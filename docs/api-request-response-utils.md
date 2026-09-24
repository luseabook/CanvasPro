# 第119批：`api/` 请求响应工具区 7 个零 import 纯叶（落地不接线）

批次：第 119 批（纯新增落地，零消费方不接线）
能力区：R06（`api/utils/` 的剧本生成 4 件）、R12（RunningHub 上传与轮询 3 件）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\api\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b119\port\`

---

## 1. 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `api/utils/strictJson.js` | 116 / 4 476 | 3 673 | `parseStrictJson`、`extractCompleteJsonArrayItems`、`extractJsonStringProperty` |
| `api/utils/storyGenerationValues.js` | 10 / 422 | 385 | `normalizeText`、`normalizeStringArray`、`normalizePositiveNumber` |
| `api/utils/storySceneIdentity.js` | 47 / 2 784 | 2 517 | `normalizeStorySceneHeadingIdentity`、`getStorySceneIdentityKey`、`storySceneIdentitiesOverlap` |
| `api/utils/storyAssetPublicText.js` | 47 / 2 557 | 2 330 | `stripStoryAssetInternalEvidenceMetadata`、`sanitizeStoryAssetPublicDescriptionText`、`sanitizeStoryAssetPublicPromptText` |
| `api/mediaUploadErrors.js` | 17 / 830 | 744 | `RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING`、`RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE`、`createRunningHubMediaUploadApiKeyMissingError`、`isRunningHubMediaUploadApiKeyMissingError` |
| `api/runningHubWorkflowPollingPolicy.js` | 27 / 1 589 | 1 426 | `RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS`、`RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS`、`RUNNINGHUB_WORKFLOW_POLL_MAX_COUNT`、`resolveRunningHubWorkflowPollingPolicy`、`hasRunningHubWorkflowPollingTimedOut` |
| `api/runningHubUploadResponse.js` | 45 / 1 847 | 1 576 | `hasRunningHubUploadFailureCode`、`getRunningHubUploadErrorMessage`、`getRunningHubUploadUrl`、`isRunningHubUploadResponseSuccessful` |

- 合计 **309 行 / 14 505 B / 25 个具名导出**（镜像 12 651 B，差额全部来自 prettier 格式化）。
- 7 件都是 **0 条相对 import 的纯叶**；`api/utils/` 是本批新建目录。
- 另有 7 个同名测试文件（见 §3），同目录存放。

---

## 2. 冻结的端口行为（只记录，不打补丁）

### 2.1 `strictJson.js`

1. **`parseStrictJson` 的短路**：非数组的真值对象**原样返回（同一引用）**；数组对象和其他非字符串都走文本分支，归一后为空，抛 `Error(fallbackMessage)`，默认文案 `Agent 未返回结果。`。
2. **候选顺序固定**：整段文本 ⇒ 每个 ```` ``` ````/```` ```json ```` 围栏内容 ⇒ 从左到右每个 `{`/`[` 起点的平衡容器；逐个 `JSON.parse`，**第一个成功的即返回**。候选会去掉 BOM、首尾空白和**末尾一个分号**，并去重。
3. **平衡扫描懂字符串**：引号内的括号和 `\"` 转义都被跳过；括号类型不匹配直接判该起点无效（返回空串，而不是继续找）。
4. **全部失败时**抛 `Error('Agent 未返回有效的 JSON。')`，附 `code='AGENT_INVALID_JSON'`、`parseCause`（最后一个解析错误的 message）、`responsePreview`（归一文本前 **800** 字符）。
5. **`extractCompleteJsonArrayItems(text, key)`** 面向流式截断：定位 `"key"` ⇒ 其后第一个 `:` ⇒ 其后第一个 `[`，然后逐个取完整的对象/数组元素；遇到**标量元素、不完整元素或解析失败都直接停止**（不跳过），因此 `[1,2]` 得到 `[]`。
6. **`extractJsonStringProperty(text, key)`** 用正则取 `"key": "…"` 的首个字符串值再 `JSON.parse` 解转义；key 里的正则元字符会被转义；值不是字符串或解析失败 ⇒ `''`。

### 2.2 `storyGenerationValues.js`

1. `normalizeText` 用 `String(x || '')` ⇒ **数字 0 变成空串**，`12` 变 `'12'`。
2. `normalizeStringArray` 只接受真数组（类数组对象 ⇒ `[]`），按首次出现顺序去重。
3. `normalizePositiveNumber` 非有限或 ≤0 一律 0，**不取整**。

### 2.3 `storySceneIdentity.js`

1. **标题归一是两段循环**：先反复剥离「独立内/外标记」和「前导标签」（场号 `第N场`/`场N`/`N.`，相对日 `次日`/`N天后`…，时段加内外景 `日 内`/`夜外`/`内景`…），直到不再变化；再反复剥离尾部转场词（`与此同时`、`稍后`、`转场`…）；最后去掉首尾分隔符。
2. **地名保护**：独立标记 `内`/`外` 用负向前瞻排除 `内 蒙古`、`外 滩`，所以 `内 蒙古草原` 原样保留。
3. **身份键**：归一标题 ⇒ 小写 ⇒ 删掉房间词（公寓、客厅、厨房…）前的「的」⇒ 删除所有非字母数字字符。
4. **重叠判定**：任一键为空 ⇒ `false`；互相包含 ⇒ `true`；否则**只要共享一个二字组就算重叠**（`医院走廊` 与 `走廊尽头` 为 `true`），判定宽松，消费方可能需要自己加阈值。

### 2.4 `storyAssetPublicText.js`

1. 三个函数对非字符串都返回 `''`。
2. **strip** 删除：`PP-UIE 本地候选：…` 行（连同紧跟的 `证据原文：` 前缀）、`证据原文：` 字样、内部证据片段（`candidateAssets`、`本地候选`、`召回线索` 等，**删到句号、换行或分号为止**）、兜底诊断句「模型细化结果不完整…」；并把行尾空白和三个以上连续换行压成两个。
3. **description** 在 strip 之后只删**空的**「剧本事实：」「视觉补全：」标签行；带内容的标签（`剧本事实：身穿红衣`）原样保留。
4. **prompt** 规则更激进：删除「保留原视频的视觉风格、场景和道具」「依据原片可见外观…」套话、客户端背景说明（`背景由客户端统一添加` 等）、**行内**的标签前缀，清理悬挂的逗号/分号，并把**所有连续换行压成一个**。

### 2.5 `mediaUploadErrors.js`

- 错误对象为原生 `Error`，`name='RunningHubMediaUploadApiKeyMissingError'`、`code='RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING'`、`provider='runninghub'`、`kind`（默认 `''`）、`retryable=false`。
- 判定函数**只看 `code`**：`String(err?.code || '')` 全等即为 `true`。

### 2.6 `runningHubWorkflowPollingPolicy.js`

1. 默认值：间隔 **2000 ms**、超时 **3 600 000 ms（1 小时）**、最多 **1800** 次。
2. **间隔允许低于默认**（最小 0，负数和非数字都归 0，小数截断），但 `maxPolls` 按 `max(间隔, 2000)` 推算 ⇒ 调小间隔**不会增加**最大轮询次数。
3. `pollTimeoutMs`、`maxPolls` 非正或非数字时回落默认；`maxPolls` 的默认值由超时推算（如超时 10 000 ⇒ 5 次）。
4. `hasRunningHubWorkflowPollingTimedOut(start, timeout, now = Date.now())` 用 `>=` 判定；开始或当前时间不是有限数 ⇒ `false`（不判超时）；超时参数非法回落 1 小时。

### 2.7 `runningHubUploadResponse.js`

1. **失败码判定用白名单**：`code` 缺失、`null` 或空白 ⇒ 不算失败；否则 trim 并小写后不在 `{'0','200','ok','success'}` 中即为失败。
2. **错误文案**依次取 `message`、`msg`、`errorMessage`、`error`，再取 `data.` 下同名字段，第一个非空字符串胜出；有 `code` 时追加 ` (code: …)`，都没有则 `未知错误`。
3. **URL** 优先 `data.download_url`、`downloadUrl`、`fileUrl`、`file_url`、`url`，其次顶层同名字段，最后 trim。
4. **成功** = 无失败码且拿到非空 URL。

---

## 3. 本批实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 开工补记 `track.mjs --by session-start` | 无会话外改动（「无变化，未写记录」）；git 0/68/825/0 与 §5 快照一致 |
| 暂存 ↔ 仓库逐字节比对 | 7/7 一致（`apply_patch` 返回的 sha256 与暂存 `Get-FileHash` 逐一相同） |
| `node --check` | 源码 7/7、测试 7/7（暂存目录没有 `"type":"module"`，那里的 check 报错属预期，以仓库内结果为准） |
| `prettier --check`（`prettierrc.json`，prettier 3.9.8） | 14/14。源码格式化后落地；两个自研测试首次落地后被判不合规（中文长行），按 prettier 输出更新后复检通过 |
| 跨树具名导出闸门 `b100/verify-exports.mjs` | 7/7 无相对 import，0 缺失 |
| 导出面 | 动态 import 实测 25 个具名导出，与预筛一致 |
| 自研测试 | **57 例**（strictJson 14、storyGenerationValues 4、storySceneIdentity 9、storyAssetPublicText 9、mediaUploadErrors 4、polling 9、uploadResponse 8），**首跑 57/57 全绿**，期望未改、实现未改 |
| `api/**` sweep | **475 / 475 / 0 ⇒ 532 / 532 / 0**（+57，失败数不变） |
| `src/**` sweep | **3 587 / 3 544 / 43** 未变（本批不涉及 src，按工序照跑） |
| 失败名集合 vs `b85-fails.txt` | 43 = 43，**集合完全一致**。其中 10 项是文件级失败，名字是路径；本次以绝对路径传参，归一掉 `F:\\CanvasPro\\` 前缀后比对 |
| 消费方反向 grep | `api`/`src`/`electron`/`main.js`/`renderer.js` 对 7 个模块名 **0 命中** ⇒ 落地不接线 |
| git_status | 落地前 0/68/825/0 ⇒ 源码与测试落地后 0/68/839/0（+14）；本文档落地后 0/68/840/0 |
| 受保护文件 | `api/freeImageHostApi.js` md5 前后均为 `1E0458013F5341C99F21FAEFC1D34D3F`；本批只新增文件，未碰在用装配件 |
| 变更登记 | `track.mjs --by agent` 已记 #0004（源码 7 件），测试与文档在收工时登记 |

**未执行 / 边界**：没有启动应用或 Electron，没有发任何真实 RunningHub 或模型请求 ⇒ 真实上传响应格式、真实轮询时序、真实 Agent 输出的 JSON 形态都**未验证**，本批只证静态契约和离线单测。

---

## 4. 接线观察（本批不动，留给接线批）

- `api/imageUploadApi.js`（第 178–213 行）有 `pickFirstUploadMessage`、`getRunningHubUploadErrorMessage`、`getRunningHubUploadUrl` 三个**私有副本**，逻辑与 `runningHubUploadResponse.js` 逐字段相同。
- **但失败码判定不同**：`uploadToRunningHub`（第 171–173 行）用 `Number(code)` 有限且 `!== 0` 判失败 ⇒ `code: 200` 会抛错、`code: 'error'` 不会；端口用白名单 ⇒ `200` 算成功、`'error'` 算失败。
- 改成 import 端口实现会改变在用行为，按 §7.4 须单独成批、写清差异、用户授权后真机验证上传。

---

## 5. 第 120 批口径

1. 候选：`api/story-generation/` 整组，10 件约 133 KB（R06）。它们很可能 import 本批的 `api/utils/*`，**必须先跑 `b100/verify-exports.mjs`**，确认每个具名导入在本仓真实存在后再排期。
2. 之后继续：`api/` 剩余纯叶 34 件；`src/modules` 纯叶 136 件按能力区成组（清单见 `deobf-tools\b119\screen.txt`）。
3. 沿用的口径：桩覆盖一律 `'k' in over ? over.k : 默认值`；表格行内不写裸竖线；不伪造 shim、消费方或缺失夹具 `tests/testPreviewDom.js`；批量操作排除 `api/freeImageHostApi.js`。
4. 小坑：`run_command` 单条命令上限 8000 字符，大文件不要用 base64 内联上传，改用 `apply_patch` 落地后再 `prettier --check`；sweep 若以绝对路径传参，失败名比对前要先归一路径前缀。
