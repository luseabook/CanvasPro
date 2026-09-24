# 第108批：外部工具注册表与组合框附件控制器（R12 浅链 OK 件）

本批从 `src/modules/agent` 剩余 `OK` 队列取两件最浅链依赖（均只依赖已落地的 `agentDocumentInput.js`）落地并补离线测试。两件在 0.7.16 里的消费方都是受保护的装配件，因此**只落地源码 + 测试，不做接线**（遵守「不伪造消费方」）。

## 1. 落地清单与核验

| 文件 | 行数 | 字节 | 具名导出 | 依赖 |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentExternalToolRegistry.js` | 217 | 8 128 | `createAgentExternalToolRegistry`、`createDefaultAgentExternalToolRegistry` | `./agentDocumentInput.js`（3 符号） |
| `src/modules/agent/agentComposerAttachmentController.js` | 141 | 5 247 | `createAgentComposerAttachmentController` | `./agentDocumentInput.js`（2 符号） |
| 小计（源码） | 358 | 13 375 | 3 | — |
| `src/modules/agent/agentExternalToolRegistry.test.js` | 545 | 19 227 | 22 例 | — |
| `src/modules/agent/agentComposerAttachmentController.test.js` | 406 | 15 126 | 17 例 | — |
| 小计（测试） | 951 | 34 353 | 39 例 | — |

已执行的检查（全部离线、在本仓内）：

1. `cmp` 仓库文件 vs `deobf-tools/b108/port/` 预格式副本：**2/2 字节一致**。
2. `node --check`：源码 2/2、测试 2/2 通过。
3. `prettier --check`：源码 2/2 干净（落地前已 `--write`）；测试 2/2 落地后 `--write` 复校。
4. 落地前导出闸门 `b100/verify-exports.mjs`：`agentExternalToolRegistry.js` 3/3 `ok`、`agentComposerAttachmentController.js` 2/2 `ok`（合计 5/5），无缺失符号 ⇒ 本批**不需要伪造 shim**。
5. 目录依赖审计 `b95/deps-ast.mjs src/modules/agent`：`port=81 / LEAF=0 / OK=2 / BLK=1` ⇒ 未落地由第107批的 **5 件降到 3 件**（`agentConversationPresentation.js`、`agentActionPostconditions.js` 为 `OK`，`agentModelControls.js` 为唯一 `BLK`）。
6. 两文件专项测试：**39/39 全绿**（首跑 39 例中 5 例失败，均为测试侧期望偏差，实现一字未改）。
7. 全量 sweep：`3 219/3 176/43 → 3 258/3 215/43`（**+39/+39/±0**），失败名单与基线 `b85-fails.txt` 比较 `diff-exit=0` ⇒ 零回归；43 项基线失败仍全部源自缺失夹具 `tests/testPreviewDom.js`。
8. `api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`（未覆盖用户手写版）。
9. `git status --porcelain` 计数 `647 → 651`（+4：2 源码 + 2 测试）。
10. 消费方扫描：仓库内除两份新测试外，对 `agentExternalToolRegistry` / `agentComposerAttachmentController` 的引用数为 **0**。

未执行（需另行授权或真机验证）：应用启动、渲染面板真实交互、任何真实网络读取（`web.read_url` 未发起过真实 URL 请求，测试全部注入桩读取器）、构建与发布、`git commit/push`。

## 2. 契约要点

### 2.1 `createAgentExternalToolRegistry`

- `register()` **返回 id 字符串**（不是定义对象）；取定义要走 `get(id)`。
- id 必须先 `trim().toLowerCase()` 再匹配 `/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)+$/`：至少一个分隔符段、不得数字开头、不得分隔符结尾；失败抛 `TypeError`，文案里带的是**规范化后**的 id（空值渲染为 `<empty>`）。
- 定义被 `Object.freeze`：`title` 回落 id 并截断到 120 字符、`description` 截断到 500 字符、`inputSchema` 走 `structuredClone`（数组也算合法对象、字符串回落默认 `{type:'object',properties:{},additionalProperties:false}`）、`riskLevel` 恒为 `'read_only'`、`trust` 默认 `'untrusted_external'`、`validate` 非函数时置 `null`。
- `execute({toolId,args,signal})` 的返回统一为 `{ok,status,toolId,errorCode|result,message}`：未知工具 `failed/EXTERNAL_TOOL_NOT_FOUND`（此处 `toolId` 用**未规范化**原值）、预先 abort `cancelled/EXTERNAL_TOOL_ABORTED`、`validate` 只有 `=== false` 或 `.ok === false` 才算拒绝、工具返回值只有 `success === false` 或 `ok === false` 才算失败（`{}` 与真值字符串都算成功）。
- 异常规范化顺序：`code` → `errorCode` → 默认码；`message` 空则回落 `'External tool failed.'`；`status`/默认码取决于 catch 时 `signal.aborted`。
- `executeWithSignal`：无 `addEventListener` 的伪 signal 直接透传给 `execute(args,{signal})`（此时工具同步抛错在 `Promise.resolve(...)` 求值阶段逃逸，仍被外层 `try` 捕获）；可监听 signal 以 `{once:true}` 注册 `abort`，并在成功与失败两条路径都手动 `removeEventListener`。
- `createDefaultAgentExternalToolRegistry` 只注册两个只读工具：`web.read_url`、`document.read_file`（后者 id 取自 `AGENT_EXTERNAL_DOCUMENT_TOOL_ID`）；读取器缺省分别返回 `URL_READER_UNAVAILABLE` / `DOCUMENT_READER_UNAVAILABLE`（后者文案为中文 `'文档读取在当前运行环境中不可用。'`），文档成功路径包装为 `{success:true, source: createAgentDocumentSource(...)}`。

### 2.2 `createAgentComposerAttachmentController`

- 构造时通过注入的 `documentObject.createElement('input')` 建两个隐藏 input：`.agent-upload-input`（`image/*,video/*,audio/*`、单选）与 `.agent-document-input`（`.txt,.docx,.pdf`、多选），二者都 `hidden = true` 且各自挂 `change` 监听。
- 文档队列上限来自 `AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT`（当前 3）；去重键为 `name:size:lastModified` 三段字符串拼接（缺失字段留空位），命中即静默跳过；越界只播报一次 `documentLimit` 并 `break`（后续文件不再尝试）。
- 展示引用固定形状：`{id, nodeId: id, type:'external-document', kind:'document', name, label, source:'document-upload'}`，`name` 缺失回落 `'document'`；内部自增计数器**不随清空重置**，故 id 单调递增。
- 文案取用顺序：`formatText(key, vars) || text(key)`；素材链路只用 `text()`（`uploadMaterialMissing` / `uploadMaterialFailed` / `uploadMaterialReady` / `uploadMaterial` / `readDocument`）。
- `uploadMaterialFile` 的并发闸门在**外部注入的 `getBusy()`**：为真时直接 `return`（连上下文都不捕获）；文件为假值时更早返回。

## 3. 冻结的端口现状（仅记录，不改）

1. `register()` 返回 id，因此调用方无法拿到冻结定义；定义只能靠 `get()`。
2. `list()` 与 `execute()` 对 id 都做规范化，但未知工具的返回值 `toolId` 用的是原始入参（大小写/空白原样回显）。
3. 工具返回值 `{}`、真值字符串等「未显式失败」的形状一律判为成功。
4. `riskLevel` 被硬编码为 `'read_only'`，注册方传入的任意 `riskLevel` 都被丢弃。
5. `signal.aborted` 为真但 `addEventListener` 缺失时，仍走「无监听」分支并把该 signal 透传给工具。
6. 附件控制器的 `busy` 复位受 `isContextCurrent` 门控：上下文过期时 `setBusy(true)` 已发出而 `setBusy(false)` 被跳过 ⇒ **busy 泄漏**（本批测试以 `calls.busy === [true]` 冻结该行为）。
7. `captureContext()` 在「上传器缺失」判定**之前**就被调用，因此缺读取器时仍产生一次上下文捕获。
8. `removeDocument(id)` 以 `String(id || '')` 归一，数字 id 可命中；未命中不触发 `onDocumentChange`。
9. `consumeDocuments()` 静默清空（不调用 `onDocumentChange`），而 `clearDocuments()` 默认通知、可用 `{notify:false}` 抑制。
10. `openMaterialPicker()` 在 click 之后仍无条件播报 `uploadMaterial` 文案（即使没有 `setNotice` 也不报错，但有通知端口时用户会看到提示而非选择结果）。
11. 文档校验失败逐条 `setNotice(error)` 后 `continue`，因此一次批量添加可能播报多条失败 + 一条成功。

## 4. 接线判定

镜像侧消费方（grep 于 `C:\Users\luobote\.qoder\tmp\shuo-deobf`）只有两处：

| 消费方 | 用法 | 仓库现状 | 结论 |
| --- | --- | --- | --- |
| `src/modules/agent/index.js` | 再导出 `createAgentExternalToolRegistry`、`createDefaultAgentExternalToolRegistry` | 镜像 4 291 B（单行 barrel）vs 仓库 767 B | 仓库 barrel 落后一个世代，未含本批符号 ⇒ 需换代专批 |
| `src/modules/agent/agentPanel.js` | `import{createAgentComposerAttachmentController}` 并在装配处以 `document/uploadMaterial/validateDocumentFile/normalizeMaterialNode/...` 实例化 | 镜像 90 025 B vs 仓库 63 143 B（1 417 行） | 落后装配层，换代需真机验证 + 授权 |

因此本批两件的**生产引用数仍为 0**，按规范留白记账、不擅自接线。附件控制器还额外依赖面板侧提供的 `uploadMaterial`、`validateDocumentFile`、`normalizeMaterialNode`、`addInputRefs` 等端口，这些端口在仓库 `agentPanel.js` 里尚不存在；外部工具注册表则卡在 barrel 换代。

## 5. i18n 待补键（本批新增，未改 `src/i18n/messages/*.js`）

`documentLimit`、`documentAttached`、`uploadMaterialMissing`、`uploadMaterialFailed`、`uploadMaterialReady`、`uploadMaterial`、`readDocument`（面板文案键，接线前需与既有 `agentPanel*` 键表合并评估）。这些键目前只在测试里以 `T:`/`F:` 桩断言，源码在端口缺省时回落为 `undefined` 播报（即静默）。

## 6. 台账口径

- 落地：本批 2 件 / 358 行 / 13 375 B / 3 具名导出；测试 2 件 / 951 行 / 34 353 B / 39 例全绿。
- `src/modules/agent` 目录：非测试源码 76 → **78 件**，测试 64 → **66 件**；审计 `port=81 / LEAF=0 / OK=2 / BLK=1`，未落地 **5 → 3**。
- 全量：仓库测试文件 273 份、用例 2 480 例（含本批 39 例）。
- sweep 基线：`3 258/3 215/43`，`b85-fails.txt` `diff-exit=0`。

**第109批口径建议**：`src/modules/agent` 仅剩 `agentConversationPresentation.js`（16 035 B，8 依赖全落地，呈现场需真实 DOM 评估）与 `agentActionPostconditions.js`（20 948 B，依赖 `../canvasCommands/index.js`）两件 `OK`，各需专批；唯一 `BLK` 仍是 `agentModelControls.js`（2 342 B，缺 `../../components/aigenText/modelSelector.js`、`../../components/aigenText/runtimeModelParameterControls.js`、`../modelGenerationParamMemory.js`）——若继续 R12 线，先补这三件依赖或以 `agentModelControls` 专批评估其依赖树；否则转向 `src/modules/agent` 目录外的叶子缺口（全树仍有 286 个 leaf 候选）与装配件换代专批（需授权 + 真机验证）。
