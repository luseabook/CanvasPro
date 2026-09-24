# 第47批 · R16 云端语音识别客户端与音视频云 ASR 适配层（`volc.seedasr.auc` + `createAudioVoiceCloudAsrAdapters`）

> 批次范围：R16（ASR / 转写 / 说话人分离 / 音频合成 / 视频转 GIF）中的**云端识别客户端与服务商适配层**。
> 本批**不覆盖** R16 的本地 funasr/sortformer 转写与分离驱动、`audioVoiceComposeTask.js`、渲染器面板与 `runtime/ffmpeg/` 打包。
> 所有证据均为**离线**：`node --check` 与 `node --test`，未联网、未发起任何云端识别调用、未启动应用。

---

## 1 · 缺口（第47批之前）

0.7.16 的 `resources/webapp/electron/mediaTasks/` 里有**两个成对**的可读模块在本仓完全没有对应物：

| 新版文件 | 体积 | 本仓（第47批之前） |
| --- | --- | --- |
| `mediaTasks/doubaoAsrClient.js` | 13068 B | **不存在**（`grep -rn "doubaoAsrClient\|seedasr\|volc.seedasr" electron/ api/` 0 命中） |
| `mediaTasks/audioVoiceCloudAsr.js` | 1220 B | **不存在**（`grep -rn "audioVoiceCloudAsr\|createAudioVoiceCloudAsrAdapters" electron/ api/` 0 命中） |

二者是**同一资源上的配对**：`audioVoiceCloudAsr.js` 只做服务商组装，`doubaoAsrClient.js` 是它的火山侧实现。

**与第45批的关系（易混淆，必须区分）**：第45批移植的 `api/doubaoRecordedAsrApi.js` 打的是火山**极速版** `volc.bigasr.auc_turbo`（`POST /api/v3/auc/bigmodel/recognize/flash`，**单次请求内联 base64，同步返回**）；本批的 `doubaoAsrClient.js` 打的是**录音文件识别** `volc.seedasr.auc`（`POST /api/v3/auc/bigmodel/submit` + 轮询 `POST /api/v3/auc/bigmodel/query`）。二者 `resourceId` 不同、端点不同、时序不同，**不是同一功能的两种写法**，故不能互相替代。

反混淆树里这两个文件的唯一消费者是 `mediaTasks/audioVoiceAnalyzeTask.js`（1404 行 / 55206 B，**未移植**）：

```
./mediaTasks/audioVoiceAnalyzeTask.js:6:  import { createAudioVoiceCloudAsrAdapters } from './audioVoiceCloudAsr.js';
./mediaTasks/audioVoiceAnalyzeTask.js:8:  import { runDoubaoAsrTranscription } from './doubaoAsrClient.js';
./mediaTasks/audioVoiceAnalyzeTask.js:1029: const _… = createAudioVoiceCloudAsrAdapters({ … })
```

---

## 2 · 本批交付

### 2.1 文件

| 文件 | 性质 | 说明 |
| --- | --- | --- |
| `electron/mediaTasks/doubaoAsrClient.js` | 新增（可读移植） | 仅 `node:crypto` / `node:fs`；4 个导出 |
| `electron/mediaTasks/audioVoiceCloudAsr.js` | 新增（可读移植） | 复用本仓既有 `api/bailianAsrApi.js`；1 个导出 |
| `electron/mediaTasks/doubaoAsrClient.test.js` | 新增（离线测试） | 27 项 |
| `electron/mediaTasks/audioVoiceCloudAsr.test.js` | 新增（离线测试） | 9 项 |

**未新增任何 npm 包**（`randomUUID`/`readFileSync`/`openAsBlob`/`Blob`/`FormData`/`fetch`/`AbortController` 均为 Node 内置）。

### 2.2 `doubaoAsrClient.js` 行为要点

- 常量：`DOUBAO_ASR_RESOURCE_ID = 'volc.seedasr.auc'`、`DOUBAO_ASR_DEFAULT_BASE_URL = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel'`、默认轮询 `0x7d0`（2000 ms）、默认总超时 `0xa * 0x3c * 0x3e8`（600000 ms）。
- `normalizeBaseUrl`：空 → 默认；**剥掉尾部 `/`、`/submit`、`/query`**（大小写不敏感），故调用方的 `…/query/` 也会收敛到基址。
- `buildAuthHeaders`：`apiKey`/`volcengineApiKey` → `X-Api-Key`；否则 `appKey`/`apiAppKey` + `accessKey`/`apiAccessKey` → `X-Api-App-Key` + `X-Api-Access-Key`；都不满足抛 `火山语音 ASR Key 未配置或无权限`。
- `buildDoubaoAsrSubmitBody`：`user.uid`（默认 `ai-canvas`）、`audio.data`（base64 字符串）、`format/codec='mp3'`、`rate=0x3e80`（16000）、`request` 六个开关（`enable_ddc` 为 `false`，其余 `true`）。
- `buildDoubaoAsrHeaders`：`Content-Type: application/json`、`X-Api-Resource-Id`、`X-Api-Request-Id`（缺省用 `randomUUID()`）、`X-Api-Sequence: '-1'`，再合并鉴权头。
- `postDoubaoJson`：**只用 `AbortController` + `setTimeout` 超时**（默认 `0x7530`=30 s）；判定顺序为 (1) `!response.ok` → 抛 `sanitizeErrorMessage(apiMessage || 'Doubao ASR HTTP ' + status)`；(2) `apiStatus` 命中 `/fail|error|invalid|denied|forbid|unauthor|expired/i` → 抛；(3) 响应体 `code` 非 0 → 抛；`AbortError` → `Doubao ASR request timed out`。
- `sanitizeErrorMessage`：先原样放行两条固定中文文案；再把 `Bearer <token>`、`X-Api-Key: <token>`、`X-Api-Access-Key: <token>` 脱敏为 `***`；随后按"无效 Key"正则 → 第一条中文文案、"权限/鉴权"正则（含中文 `无权限|未授权|鉴权`）→ 第二条中文文案。
- `normalizeDoubaoAsrSegments(payload, durationSec)`：`extractResultPayload` 依次尝试 `payload.result` → `data.result` → 含 `utterances|text|segments` 的 `data` → `payload`；段来源依次 `resultPayload.utterances` → `.segments` → `payload.segments`；时间字段兼容 `startMs|start_time|startTime|start`（同理 end），**`normalizeAsrTimeMs` 的秒→毫秒启发式**：仅当 `durationMs > 0` 且值 `<= durationMs/1000 + 5` 时才乘 1000；丢 `endMs <= startMs`；文本依次 `sourceText|text|utterance|words 拼接`；说话人依次 `speaker|speaker_id|speakerId|speaker_info.speaker_id|speaker_info.speakerId|speaker_info.speaker`；**无段但有整段 `text` 且 `durationSec>0` 时补一条 `[0, durationMs]`**；最后按 `startMs` 升序。
- `runDoubaoAsrTranscription`：`readFile(audioAbs).toString('base64')` → `emitProgress(task, 0.16, 'Submitting Doubao subtitle recognition', {stage:'transcribe'})` → `POST /submit`（超时 `0xea60`=60 s）→ **提交即成功**（`isSuccessPayload(data)` 或 `apiStatus==='success'`）则直接返回，**完全不轮询**；否则 `0.22` 起步、每轮 `+0.035` 且**上限 `0.52`**，每轮先 `throwIfCancelled` 再 `sleep(pollIntervalMs)` 再 `emitProgress(…, 'Recognizing subtitles with Doubao', {stage:'transcribe'})`，然后 `POST /query`（超时 `0x7530`）；`apiStatus` 命中失败正则即抛；超出总超时抛 `Doubao ASR recognition timed out`。

### 2.3 `audioVoiceCloudAsr.js` 行为要点

`createAudioVoiceCloudAsrAdapters({getDoubaoAsrConfig, getBailianAsrConfig, runDoubaoAsrTranscription, runBailianAsrTranscription})` 只做**组装**，返回：

```js
{
  doubao:  { getConfig, run, normalize: normalizeDoubaoAsrSegments },
  bailian: { getConfig, run, normalize: (result) => result.segments },
}
```

默认的百炼 `run` 把队列语义翻译成 `api/bailianAsrApi.js` 的签名：`await openAsBlob(audioAbs, {type:'audio/mpeg'})` → `transcribeBailianAudio({...rest, audio, filename: path.basename(audioAbs), throwIfCancelled: () => queue.throwIfCancelled(task), onProgress: (p, m) => queue.emitProgress(task, p, m, {stage:'transcribe'})})`。注意展开顺序：`...rest` 在前，故 `audio`/`filename`/`throwIfCancelled`/`onProgress` **强制覆盖**调用方传入的同名键。

### 2.4 与新版的有意差异

| # | 差异 | 原因 |
| --- | --- | --- |
| 1 | 残留 `_0x` 形参/局部变量还原为语义名；`!![]`/`![]` → `true`/`false`；字符串里的 `\x20` 写回空格 | 纯可读性，**逻辑与字符串内容不变**（`sanitizeErrorMessage` 的两条固定文案比较仍然成立） |
| 2 | `postDoubaoJson({… , fetchImpl: fetchImpl, …})` 等把"新名: 新名"的冗余解构写平 | 同上 |
| 3 | 无 | `emitProgress` 第 4 参 `{stage}` 在本仓曾因 3 参 `MediaTaskQueue.emitProgress` 被忽略，**第54批已将该签名升级为 4 参并写入 `task.stage`**；本批交付本身未改队列，差异归零 |

---

## 3 · 接线现状与可达性

**本批是"纯源码补齐"，没有接线，也不能宣称可达**：

| 问题 | 现状 |
| --- | --- |
| 有任务类型注册吗？ | **没有**。`registerSharedMediaTaskHandlers` 未新增任何 `setHandler`；`mediaTask:enqueue` 发不出这两个模块的任何 kind（新版也没有对应 kind，它由 `audioVoiceAnalyzeTask` 内部直接调用） |
| 有生产消费者吗？ | **没有**。全仓 `grep -rn "doubaoAsrClient\|audioVoiceCloudAsr"` 仅命中新文件与其测试；唯一消费者 `mediaTasks/audioVoiceAnalyzeTask.js`(1404 行) **未移植** |
| 依赖能否解析？ | `audioVoiceCloudAsr.js` 的 `../../api/bailianAsrApi.js` 解析到 `F:\CanvasPro\api\bailianAsrApi.js`（第45批已移植的 `transcribeBailianAudio`），**路径成立**；`doubaoAsrClient.js` 只用 `node:crypto`/`node:fs` |
| 与第45批链路冲突吗？ | 不冲突。`recordingTranscribe` 走 `volc.bigasr.auc_turbo`（极速版）；本批走 `volc.seedasr.auc`（提交/轮询）。两条链互不复用 |
| 有渲染器入口吗？ | 没有（新版也没有直连这两个模块的渲染器调用点，都由 analyze 任务驱动） |
| 真实可用吗？ | **不可用**。真实可用需要：本机安装 python 运行时 + funasr/sortformer（第43/44批）或已配置的云端凭据 + `audioVoiceAnalyzeTask` 驱动；本批只补齐了云侧的客户端与适配层 |

---

## 4 · 已执行的验证（离线）

命令与结果（本窗口实测，均为仓库内文件的 `node --check` / `node --test`，**未联网、未发起任何云端调用、未 spawn 任何真实 ffmpeg、未启动应用**）：

| 命令 | 结果 |
| --- | --- |
| `node --check electron/mediaTasks/doubaoAsrClient.js electron/mediaTasks/audioVoiceCloudAsr.js electron/mediaTasks/doubaoAsrClient.test.js electron/mediaTasks/audioVoiceCloudAsr.test.js` | 4/4 退出 0 |
| `node --test electron/mediaTasks/doubaoAsrClient.test.js` | **27 / 27 通过** |
| `node --test electron/mediaTasks/audioVoiceCloudAsr.test.js` | **9 / 9 通过** |
| `node --test $(find electron -name '*.test.js')` | **550 / 549 / 1**（较第46批 514/513/1 净增 36，即本批新增；唯一失败仍是既有 `electron/fullProjectPackageService.test.js`，归 R14 第17批） |

覆盖点：

- **纯函数**：submit body 默认值与自定义 uid/空 base64；header 的 apiKey 分支、appKey+accessKey 分支、无凭据抛错、自动生成 `X-Api-Request-Id`（`/^[0-9a-f-]{36}$/`）；`normalizeDoubaoAsrSegments` 的毫秒直通与排序、秒→毫秒启发式（`durationSec=10` 时 `1.5/2.5` → `1500/2500`）、**已有毫秒值不被二次缩放**（`1500` 在 `durationSec=10` 下仍是 `1500`）、`words` 拼接（`text`/`word` 混用、空串被滤）、`speaker_info.speaker_id` 取用、丢反转/等值/非对象条目、**负起始被夹到 0 而非丢弃**、`data`/`result` 两种信封解包、无段时的整段兜底（`durationSec>0` 才补）。
- **`runDoubaoAsrTranscription`**：提交即成功（**只发 1 次请求，不轮询**，进度恰为 `[{0.16, 'Submitting Doubao subtitle recognition', {stage:'transcribe'}}]`）；提交未完成 → 轮询至成功（`/submit`+2×`/query`，`/query` body 为 `'{}'`，进度序列 `0.16 → 0.255 → 0.29…`，末条文案 `Recognizing subtitles with Doubao`，`throwIfCancelled` 被调用过）；进度**封顶 0.52** 且出现该值；自定义 baseUrl（`…/query/`）被收敛到 `…/submit`；`x-api-status: error` + `invalid x-api-key` → 中文"Key 无效"文案；`denied` + `no access` → 中文"无权限"文案；HTTP 500 + `Bearer sk-very-secret failed` → 脱敏为 `Bearer *** failed` 且**原 token 不外泄**；无 message 的 HTTP 503 → `Doubao ASR HTTP 503`；`code: 45000001`（`apiStatus` 为 `busy`，不触发失败正则）→ 抛 `busy`；`AbortError` → `Doubao ASR request timed out`；总超时（提交耗时 5 ms、`timeoutMs: 1`）→ `Doubao ASR recognition timed out`；取消发生在**发出 `/query` 之前**（`calls.length === 1`）；默认 `readFile` 真读临时 mp3 并 base64 编码进 `audio.data`；`fetchImpl: null` → `fetch is unavailable`。
- **`audioVoiceCloudAsr.js`**：返回键集与两槽的键集；`getConfig` 直通同一引用；`doubao.run` 默认**同一函数引用**等于 `runDoubaoAsrTranscription`、`doubao.normalize` 等于 `normalizeDoubaoAsrSegments`；两个 `run` 都可被注入替换；`bailian.normalize` 解包 `segments`。
- **百炼默认 run 端到端（离线）**：用**真实临时 mp3 文件** + 脚本化 `fetchImpl` 走完 `getPolicy → OSS 直传 → 提交 → 轮询 SUCCEEDED → 取 transcription_url`，断言返回段 `[{0,1200,'你好',speaker:'1'}]`、进度三条文案（`Uploading audio to Bailian` / `Submitting Bailian subtitle recognition` / `Recognizing subtitles with Bailian`）且第 4 参为 `{stage:'transcribe'}`、`taskId` 正确、`throwIfCancelled` 被转发、**上传的 `FormData` 里 `key='dashscope/upload/speech.mp3'`、`OSSAccessKeyId='ak'`、`file.name='speech.mp3'`**；队列取消会穿透 reject；无 API Key 时**在一次请求都没发**的前提下抛中文提示。

**首次运行失败 1 项，为测试期望错误而非实现错误**：`0.22 + 0.035` 的第三次累加产生 `0.29000000000000004`，断言写成了字面量 `0.29`；改为 `Number(entry.progress.toFixed(6))` 后通过（实现侧的 `Math.min(0.52, …)` 与新版完全一致，未改动）。

---

## 5 · 验收欠项（须授权后执行）

- **真实云端调用会产生费用**，且必须先说明：使用的 Key/账号、端点、音频时长与大小、预计调用次数。届时才可验证：真实 `X-Api-Key` 能否通过 `volc.seedasr.auc`、`submit`+`query` 的**真实时序与真实 `x-api-status` 取值集合**（本批只见 `success`/`running`/`error`/`denied` 四种构造值）、`enable_speaker_info` 在真实响应里说话人字段的真实形状、`normalizeAsrTimeMs` 的秒/毫秒启发式在真实响应上是否误判（本批只能证明**已知输入**下的行为）、`rate: 16000` 与真实 mp3 采样率不符时火山是否接受。
- 真实 `Bearer`/Key 出现在错误体时脱敏是否覆盖**所有**厂商文案变体（本批只覆盖三种已知形态）。
- 真实百炼链路已在第45批与本批两次以脚本化 `fetchImpl` 走通，**但仍未对真实 `dashscope` 发起过请求**；`openAsBlob` 在 >2 GB / >12 h 前置拒绝路径下的行为未测。
- 本轮**没有**任何 UI/端到端验收：`audioVoiceAnalyzeTask.js`（消费者）与 `audioVoicePanel.js`（渲染器）均未移植，故产品层面无触发点。

---

## 6 · R16 剩余工作

| 项 | 状态 |
| --- | --- |
| 三个可读 `.py`（funasr / sortformer / outbound_http_transport） | ✅ 第43批 |
| `funasrModelRoot.js` / `sortformerModelRoot.js` | ✅ 第43批（**仍生产零引用**） |
| 运行时分发/安装链（`pythonRuntimeResolver` / `asrRuntimeResolver` / `asrRuntimeInstallTask`） | ✅ 第44批（已接进媒体任务队列） |
| 云端录音转写链（`volc.bigasr.auc_turbo` 极速版 + 百炼） | ✅ 第45批（已接进媒体任务队列） |
| 视频转 GIF 宿主链（`videoToGif`） | ✅ 第46批（已接进媒体任务队列；**渲染器无调用点**） |
| 云 ASR 客户端与适配层（`volc.seedasr.auc` 提交/轮询 + `createAudioVoiceCloudAsrAdapters`） | ✅ **第47批（本批，纯源码，未接线）** |
| `mediaTasks/audioVoiceAnalyzeTask.js`（1404 行驱动：本地 funasr 转写 + sortformer 分离 + 云侧二选一 + 切片产物） | ❌ 未移植（R16 的关键路径） |
| `main.js` 的 `getFunasrModelRootDir()` / `getSortformerModelRootDir()` 消费点 | ❌ 未接线（第43批两个解析器仍生产零引用） |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` | ❌ 未移植 |
| `mediaTasks/audioVoiceComposeTask.js`（音频合成）、`/api/v2/video-gif` | ❌ 未移植 |
| `runtime/ffmpeg/` 随包打包 | ❌ 未做（本仓无 `runtime/`） |

**移植 `audioVoiceAnalyzeTask.js` 的前置阻塞（本批探明）**：它 `import { createProcessStartError } from '../mediaTaskQueue.js'`，而本仓 `electron/mediaTaskQueue.js` **不导出 `createProcessStartError`**（只有 `MediaTaskCancelledError`）。故下一批必须先决定：是给本仓队列补该工厂（会改动既有队列文件），还是在移植时改为复用既有错误构造——**不得静默丢弃该导入**。

---

## 7 · 约束复核

- 未推送、未提交；未触碰 `api/freeImageHostApi.js`；未清理 untracked。
- 未安装依赖、未构建、未启动应用、未联网、未发起任何真实云端识别调用。
- 新增文件全部为仓库内可读源码与离线测试；测试中的临时 mp3 与临时目录（`mkdtempSync(tmpdir())`）在 `t.after` 内清理。
- 本批**未修改任何既有文件**（`git snapshot` 初读 = 落盘后 modified 计数不变）。
