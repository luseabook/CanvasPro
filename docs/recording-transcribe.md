# 录音转写链路（R16，第45批）

> 对应新版 0.7.16 的"录音文件识别"能力：`electron/mediaTasks/recordingTranscribeTask.js` +
> `electron/mediaTasks/recordingAsrProviders.js` + `api/doubaoRecordedAsrApi.js` +
> `api/bailianAsrApi.js` + `api/recordingAsrModels.js`，以及宿主侧凭据解析
> `electron/doubaoAsrConfig.js` / `electron/bailianAsrConfig.js`。
> 本批为**离线移植 + 首次接进本仓媒体任务队列**；真实云端调用与真实 ffmpeg 抽取**未执行、未获授权**。

## 1. 缺口（第45批之前）

| 现状 | 证据 |
| --- | --- |
| 录音转写任务类型不存在 | 批次前 `electron/mediaTasks/` 只有 `storySequenceExport`/`audioCompose`/`mediaClipExport`/`videoReverse`/`asrRuntimeInstall` 五个句柄；`enqueue({kind:'recordingTranscribe'})` 抛 `Unsupported media task kind: recordingTranscribe` |
| 两个云端 ASR 客户端不存在 | 批次前仓库根本 `api/` 下 `ls api/ \| grep -i "asr\|doubao\|bailian\|record"` **0 命中** |
| 两个凭据解析器不存在 | 批次前 `grep -rn "resolveDoubaoAsrConfig\|resolveBailianAsrConfig" electron/` **0 命中**（新版在 `main.js:1247`/`:1253` 用 `createDoubaoAsrConfigResolver`/`createBailianAsrConfigResolver` 构造） |
| 因此"录音 → 转写"在产品层完全不可用 | 渲染器没有可 enqueue 的 kind，也没有凭据读取路径 |

## 2. 本批交付

| 文件 | 作用 |
| --- | --- |
| `api/recordingAsrModels.js`（新增） | `RECORDING_ASR_MODELS` 冻结清单（`volcengine-speech` volc.bigasr.auc_turbo / `bailian` qwen-audio-3.0-asr-flash-filetrans）+ `getRecordingAsrModel(id='volcengine-speech')`，未知 id 抛 `不支持的语音识别模型，请重新选择。` |
| `api/doubaoRecordedAsrApi.js`（新增） | 火山"录音识别极速版"极速接口客户端：`DOUBAO_RECORDED_ASR_RESOURCE='volc.bigasr.auc_turbo'` + `transcribeDoubaoRecording`（POST `openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash`） |
| `api/bailianAsrApi.js`（新增） | 阿里云百炼客户端：`BAILIAN_ASR_MODEL`、`BAILIAN_ASR_BASE_URL`、`normalizeBailianAsrSegments`、`transcribeBailianAudio`（取上传凭证 → OSS 直传 → 异步任务 → 轮询 → 取转写 JSON） |
| `electron/doubaoAsrConfig.js`（新增） | `createDoubaoAsrConfigResolver`：`process.env` → 安全存储 → 用户 `config.json` → `appRoot/user/config.json` 四段取值，`speechOnly` 屏蔽通用 `volcengine` 凭据 |
| `electron/bailianAsrConfig.js`（新增） | `createBailianAsrConfigResolver`：安全存储 → 用户 `config.json` 的 `providers.bailian` |
| `electron/mediaTasks/recordingAsrProviders.js`（新增） | `createRecordingAsrProvider(providerId, deps)`：按模型 id 合并清单项与该家实现（`credentials`/`validate`/`run`） |
| `electron/mediaTasks/recordingTranscribeTask.js`（新增） | `createRecordingTranscribeTaskHandler(deps)`：探测音轨 → ffmpeg 抽 16 kHz 单声道 mp3 → 交供应商 → 清理临时文件 |
| `electron/mediaTasks/registerSharedMediaTaskHandlers.js`（修改） | 新增 `import` 与 `setHandler('recordingTranscribe', …)`，显式传 7 个依赖键 |
| `electron/main.js`（修改） | 新增两个 import（`createBailianAsrConfigResolver`/`createDoubaoAsrConfigResolver`）；在 `getSecureSettingsStore()` 之后构造 `resolveDoubaoAsrConfig`/`resolveBailianAsrConfig`；`registerSharedMediaTaskHandlers` 调用处补 `getBailianAsrConfig`/`getDoubaoAsrConfig` 两键 |
| `electron/doubaoAsrConfig.test.js`、`electron/bailianAsrConfig.test.js`、`electron/recordingAsrApis.test.js`、`electron/mediaTasks/recordingAsrProviders.test.js`、`electron/mediaTasks/recordingTranscribeTask.test.js`（新增） | 63 项离线测试 |

### 行为要点

- **三段前置拒绝**：供应商 id 未知 → `不支持的语音识别模型，请重新选择。`（在探测音轨之前）；无音轨 → 直接返回 `{provider, model, status:'no-audio-track', utterances:[], raw:{}}`（**不 spawn ffmpeg、不建输出目录**）；凭据缺失 → 火山 `请在火山语音设置中配置录音识别凭据。` / 百炼 `请在设置 > API Key > 阿里云百炼填写 API Key。`（**不 spawn ffmpeg**）。
- **ffmpeg 抽取参数固定**：`-y -i <src> -map 0:a:0 -vn -ac 1 -af aresample=16000:first_pts=0 -ar 16000 -b:a 96k <out>`，输出名 `createOutputFilename('recording_asr','mp3')`。
- **临时文件必清**：抽取出的 mp3 无论成功、识别失败还是被取消，都在 `finally` 里 `rm(path, {force:true})`。
- **火山分支**：`bytes.length > 100MB` 直接抛 `录音文件超过极速识别的 100MB 上限。`（**不发请求**）；凭据 `apiKey` 与 `appKey+accessKey` 二选一；只接受 `X-Api-Status-Code` 为 `20000000`/`20000003`；`20000003` = 静音；`20000000` 但 `result.utterances` 非数组 → 抛 `火山录音识别未返回逐句结果，不能视为无人声。`
- **百炼分支**：`Blob([bytes], {type:'audio/mpeg'})` + `includeRaw:true` + `timeoutMs:180000`；整条链路（取凭证→直传→提交→轮询→取结果）共用一个 180 秒 deadline，`ensureAlive()` 在每次请求前后与取消轮询（200 ms）里检查；`401`/`403` 统一映射为 `阿里云百炼 API Key 无效或没有模型访问权限`；**所有抛出文案都会把 apiKey 替换成 `***`**；`baseUrl` 必须 `https:` 且不得带用户名/密码。
- **取消语义**：任务处理器把队列的 `throwIfCancelled` 透传给供应商；抽取阶段结束后另起 `AbortController`（180 s 定时 + 250 ms 取消轮询），取消即 `abort()`，文案 `录音识别已取消或超时。`

### 与新版的有意差异（仅一处语义差异 + 两处环境差异）

| 项 | 新版 | 本仓 | 影响 |
| --- | --- | --- | --- |
| `queue.runProcess(..., {timeoutMs: 0x2bf20})` | 新版队列可能实现 `timeoutMs` | 本仓 `MediaTaskQueue.runProcess`（`electron/mediaTaskQueue.js:137`）**未实现该键，静默忽略** | **ffmpeg 抽取阶段实际无超时**；识别阶段的 180 s 仍由 `AbortController` 保证。本批**未改既有队列签名**，如实记录为缺口 |
| 凭据解析 `processEnv` | 新版 `env[...]` | 本仓 `process.env[...]` | 无功能差异 |
| 队列 payload 形状 | 新版调用方可能嵌套 | 本仓 `enqueue` 把**入参本身**摊成 `payload`（`payload:{...arg, kind, taskId}`） | 调用方必须**平铺**传 `src`/`provider`，不能写 `payload:{src,…}`（写错会得到 `src=undefined`） |

## 3. 接线现状与可达性

- **注册**：`electron/mediaTasks/registerSharedMediaTaskHandlers.js` 新增 `setHandler('recordingTranscribe', createRecordingTranscribeTaskHandler({createOutputFilename, ffprobeHasAudio, getBailianAsrConfig, getDoubaoAsrConfig, getOutputDir, getRuntimeToolOrFallback, resolveMediaTaskSource}))`。
- **宿主依赖**：`electron/main.js` 的 `registerSharedMediaTaskHandlers(mediaTaskQueue, {…})` 调用处（`mediaTaskQueue` 在 `registerSharedMediaTaskHandlers` 之前创建）新增 `getBailianAsrConfig: resolveBailianAsrConfig`、`getDoubaoAsrConfig: resolveDoubaoAsrConfig`；两个解析器在 `getSecureSettingsStore()` 定义之后构造，复用既有 `getUserRoot()`（`main.js:606`）与 `app.getPath('userData')`。
- **可达性**：`electron/ipc/mediaTaskIpc.js` 的 `mediaTask:enqueue` 把入参原样交给 `queue.enqueue`，后者按 `kind` 查 `handlers`。故渲染器/桥发 `{kind:'recordingTranscribe', nodeId, src, provider}` 即走通全链，进度/结果经既有 `mediaTask:update`/`mediaTask:list` 回传；`mediaTask:cancel` 可通过队列的 `cancelRequested` + `child.kill()` 终止 ffmpeg。
- **未接线**：渲染器没有"录音转写"入口（新版的 `audioVoicePanel.js` 142 KB 等 4 个未移植），因此**当前只有 IPC/桥层可达，产品层无 UI 触发**；`api/*.js` 三个客户端也不需要任何注册表——本仓 `api/` 是静态 ESM 目录，`src/` 直接按相对路径 import。

## 4. 已执行的验证（离线）

| 命令 | 结果 |
| --- | --- |
| `node --check` × 12 个新文件 + `electron/main.js` + `registerSharedMediaTaskHandlers.js` | 全部退出 0 |
| `node --test electron/doubaoAsrConfig.test.js electron/bailianAsrConfig.test.js electron/recordingAsrApis.test.js electron/mediaTasks/recordingAsrProviders.test.js electron/mediaTasks/recordingTranscribeTask.test.js` | **63/63 通过** |
| `node --test $(find electron -name '*.test.js')` | **489/488/1**（较第44批 426/425/1 净增 63；唯一失败仍是既有 `fullProjectPackageService.test.js`，归 R14 第17批） |

**测试中未联网、未 spawn 真实进程**（`recordingTranscribeTask.test.js` 里有一个测试新建 `MediaTaskQueue` 实例，但注册的 `ffprobeHasAudio` 恒为 false，故不 spawn）：
`fetchImpl`、媒体队列、凭据解析器全部是注入替身；百炼分支用脚本化 `fetchImpl` + 注入 `sleep`/`now` 走完"取凭证→直传→提交→轮询→取结果"；凭据解析器用真实临时 `config.json`。

首跑 6 项断言失败，**全部是测试期望/mock 写错，不是实现错误**，已逐条修正：
1. `spawn` 期望的 app 侧配置路径写成了 `<appRoot>/config.json`，实现读的是 `<appRoot>/user/config.json`；
2. 百炼 `run` 的 `runProcess` 入参误以为可嵌套 `payload`（本仓队列摊平入参），改为平铺 `src`/`provider`；
3. `MediaTaskQueue.enqueue` 的返回快照在异步 handler 起跑后已是 `processing`，原断言写 `waiting`；
4. 百炼空白安全值 `'  '` 会**掩蔽** `config.json` 的值（源码 `String(secure || config || '').trim()` 先 `||` 后 `trim`），原断言误以为会回退；
5. 百炼供应商 `status` 只按 `text` 真值判断，`'   '` 仍算 `recognized`，静音用例应传空串；
6. `403` 在实现里与 `401` 同属"API Key 无效"分支，通用 HTTP 失败用例应用 `500`（另补一条 `403` 断言）。

## 5. 验收欠项（需授权/真实环境）

- [ ] 真实调用火山极速接口（需 `VOLCENGINE_ASR_API_KEY` 或 `appKey+accessKey`）与百炼（需 DashScope API Key）——**涉及真实费用与网络，须先授权**；核对配额、地区、`X-Api-Status-Code` 枚举是否还有第三态、`20000003` 是否真的等于无人声。
- [ ] 真实 `ffmpeg` 抽取路径：本仓 `runProcess` **不实现 `timeoutMs`**，需确认长录音会不会无限挂起；Windows 上 `-map 0:a:0` 对无音轨文件是否真返回非 0（当前依赖 `ffprobeHasAudio` 前置判断）。
- [ ] 宿主凭据来源核对：真实安装版的 `config.json` 与 `secureSettingsStore` 键名（`apiConfig.providers.volcengine-speech.apiKey` / `apiConfig.providers.bailian.apiKey`）是否与新版一致；新版另有 `providers.volcengine.asrAppKey/asrAccessKey/asrApiUrl` 的写入方，本批只读。
- [ ] 渲染器入口（新版 `audioVoicePanel.js`）未移植，故无端到端 UI 验证；百炼链路在产品内每次轮询会真实等待 2 s（`pollIntervalMs` 2000，本批未改）。
- [ ] 沙箱/代理/自签 CA 环境下的 `fetchImpl` 行为（`urlopen` 那套信任根在 JS 侧不适用）；大文件（>100 MB 火山 / >2 GB 或 >12 h 百炼）拒绝文案的真实触发。

## 6. R16 剩余工作

| 项 | 状态 |
| --- | --- |
| 三个可读 Python 服务（`outbound_http_transport`/`funasr_transcription_service`/`sortformer_diarization_service`） | 第43批已移植 |
| 两个模型根解析器（`funasrModelRoot`/`sortformerModelRoot`） | 第43批已移植，**仍是生产零引用** |
| 运行时分发/安装链（`pythonRuntimeResolver`/`asrRuntimeResolver`/`asrRuntimeInstallTask`） | 第44批已移植并接进队列 |
| 录音转写链（本批：3 个 `api/` 客户端 + 2 个 `mediaTasks` + 2 个凭据解析器） | **第45批已移植并接进队列** |
| `mediaTasks/audioVoiceAnalyzeTask.js`（55 KB 本地转写/分离驱动） | 未移植（R16 主体） |
| `mediaTasks/audioVoiceComposeTask.js`、`audioVoiceCloudAsr.js`、`doubaoAsrClient.js`、`videoToGifTask.js` | 未移植 |
| `main.js` 的 `getFunasrModelRootDir()`/`getSortformerModelRootDir()` 消费点 | 未接线（需先有 `audioVoiceAnalyzeTask.js` 等价驱动） |
| 渲染器 `audioVoicePanel.js`(142 KB)/`audioVoiceAsrProviders.js`/`audioVoiceLocalAsrRuntime.js` | 未移植 |
| `/api/v2/video-gif`、音频合成、`runtime/ffmpeg/` 随包打包 | 未移植 |
