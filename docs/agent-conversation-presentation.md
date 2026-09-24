# 第 110 批 · R12 会话呈现层（`agentConversationPresentation.js`）

> 来源为 0.7.16 安装版反混淆端口，逐字保真落地。结论先说：**本批不构成任何用户可见行为完成**——该件在生产代码里**零引用**，未接线、未启动应用、未做真机验收。

## 1. 落地清单与核验计数

| 项 | 值 |
| --- | --- |
| 源码 | `src/modules/agent/agentConversationPresentation.js` **441 行 / 19 537 B / 4 具名导出**（镜像端口排版前 16 035 B） |
| 本批暂存 | `C:/Users/luobote/.qoder/tmp/deobf-tools/b110/port/agentConversationPresentation.js` |
| 测试 | `src/modules/agent/agentConversationPresentation.test.js` **806 行 / 33 859 B / 35 例**（本项目自研，非移植件） |
| `cmp` 仓库 vs 暂存 | **1/1 IDENTICAL**（`prettier --write` 之后复测仍逐字节相同 ⇒ 源码本就是规范化产物） |
| `node --check` | 源码 + 测试 **2/2 ok** |
| `prettier --check` | 本批 2/2 通过（仓库侧仍只命中基线已知未格式化两件 `agentSkillPackage.js`/`agentSkillPackage.test.js`，本批未触碰） |
| 落地前门禁 `b100/verify-exports.mjs` | 具名导入 **9/9 ok**、零 `MISSING`、零 `DEP-FAIL`（8 个依赖全部已落地） |
| `node --test` 单跑 | 首跑 25/35（**10 处全为测试侧期望偏差**）→ **35/35 全绿**，`prettier --write` 后复跑 **35/35** |
| 全量 sweep `find src -name '*.test.js'` | **3 327 tests / 3 284 pass / 43 fail**（第109批 3 292/3 249/43 ⇒ 恰好 **+35/+35/±0**）；失败名单与 `b85-fails.txt` **`diff-exit=0`**，43 项仍全部归属缺失夹具 `tests/testPreviewDom.js`，**未伪造**。产物 `b110/src.tap`、`b110-fails.txt` |
| 依赖闭包 `b95/deps-ast.mjs src/modules/agent` | 由第109批 `OK=1 / BLK=1`（未落地 2）变为 **`port=81 / LEAF=0 / OK=0 / BLK=1`（未落地 1）** |
| 测试文件计数 | `src/modules/agent` **67 → 68** 件；全仓 `src/**` **274 → 275** 份；该目录非测试源码 **79 → 80** 件（端口 81） |
| 保护文件 | `api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`；本批未提交、未推送、未触发构建或发布 |

四个具名导出：`AGENT_CONVERSATION_INPUT_REF_LIMIT`（12）、`normalizeAgentRenderableMediaUrl`、`formatAgentAssistantMarkdown`（转口再导出，与 `agentAssistantMarkdown.js` **同一引用**）、`createAgentConversationPresentation`。

## 2. 契约

### 2.1 `normalizeAgentRenderableMediaUrl(value)`

`String(v||'').trim()` 后：空 → `''`；`^https?://`（忽略大小写）**或**前导 `/` → 原样；`^data:image/` 且长度 ≤ 50 000 → 原样；其余一律 `localPathToUrl(v) || ''`（含超长 data URI 与 `data:video/`）。**只 trim 不改协议、不做白名单**，故 `javascript:` 之类会被原样送进 `localPathToUrl`。

### 2.2 `createAgentConversationPresentation({messagesEl, runStepsEl, sessionStore, getHistory, onCopy, onImagePreview, copyIconHtml, onMessagesChanged, onConversationInvalidated})`

- `messagesEl` 或 `runStepsEl` 缺任一 → 立即 `throw new TypeError('[agentConversationPresentation] messagesEl and runStepsEl are required')`。
- 返回**冻结的 10 键**对象：`appendEntry`、`appendMessage`、`appendWaiting`、`removeWaiting`、`render`、`renderMessages`、`renderRunSteps`、`setBusy`、`acknowledgeSessionState`、`destroy`。
- 构造期即装配三件事：`createAgentRunStatusPresentation({root: runStepsEl})`、`createAgentConversationStreamingPresentation({messagesEl, appendEntry, onSettled})`、`sessionStore?.subscribeAssistantStream?.(handle)`、`sessionStore?.subscribe?.(cb)`（后两者返回的退订句柄留给 `destroy`）。

### 2.3 单条消息的 DOM 形状

`appendMessage(role, content, {messageType='text', status='', task=null, inputRefs=[], diagnostic=null, onCopy, onImagePreview, copyIconHtml='', ts=Date.now()})`

- 角色：`String(role) === 'user'` 才是 user，其余（含 `undefined`/`'USER'`）全归 assistant。
- 类名：`agent-message` + `agent-message--user|--assistant`；`messageType` 归一后非空且非 `text` 追加 `agent-message--<seg>`；`status` 归一后**总是**追加 `agent-message--status-<seg>`。片段归一 = `trim().toLowerCase()` → `_`→`-` → `[^a-z0-9_-]+`→`-`。
- user：`[bubble[body, (refs), (media), (diagnostic)], footer[(time), (copyBtn)]]`；assistant：body/refs/media/diagnostic/copyBtn **直挂消息根**，无 bubble、无 footer、无时间。
- assistant 且 messageType 为空或 `text` 时加 `agent-message--rich`，正文改走 `innerHTML = renderMarkdownToHtml(formatAgentAssistantMarkdown(text))`，**返回空串则保留 textContent**。
- 消息根上挂两个自定义属性：`agentMessageContent`（原文）、`agentMessageCopyText`（复制文本），复制按钮仅当后者非空才创建。
- 每次追加/重建/等待态增删都调用 `scrollAgentMessageListToEnd(messagesEl)` 并上报 `onMessagesChanged({hasMessages})`。

### 2.4 会话状态机（忙碌 / 脏标记 / 投影）

| 入口 | 行为 |
| --- | --- |
| `setBusy(true)` | 置忙碌位并**直接返回**（不广播） |
| `setBusy(false)` | 忙碌位假值化；仅当「脏标记为真且未 destroy」时清脏、清 pending、广播 `onConversationInvalidated({historyOnly:true})` |
| `acknowledgeSessionState({taskMessages})` | 按 `taskId\0nodeId\0status` 键从 pending 集合移除；随后脏标记 = `流式中 \|\| pending 非空` |
| 订阅回调 | ①**首帧无条件吞掉**；②destroy 后吞掉；③写投影 dataset；④`history_replaced` 且非忙碌 → `streaming.reconcile(getHistory())`；⑤忙碌：`run_event` 只重绘步骤、`task_result` 记 pending、`history`+entry 置脏；⑥非忙碌 `history`+entry → 立即 `appendEntry` + 重绘步骤；⑦其余 → `onConversationInvalidated()`（无参） |
| `render({history=getHistory(), sessionSnapshot={}})` | 三合一：整表重建 + `renderRunSteps(snapshot)` + 投影 dataset |
| `destroy()` | 置停止位、清脏与 pending、`runStatus.destroy()`、`streaming.destroy()`、退订两个句柄 |

投影 dataset：`sessionProjectionParity.ok === true` → `'matched'`，否则 `'mismatch'`；`mismatches` 非空数组才写 `sessionProjectionMismatches`（逗号连接），否则**删除**该键；parity 缺失或非对象 → 两键全删。

## 3. 本批实际执行的检查 / 明确未执行的检查

已执行（全部离线、无网络、无磁盘写入、无进程、无真实 AI 调用）：端口 → 暂存 → 仓库 `cmp`；`node --check`；`prettier --write` + `--check`；落地前具名导入门禁 9/9；`node --test` 单跑 35/35；全仓 `src/**` sweep 3 327/3 284/43 且失败名单与基线 `diff-exit=0`；`b95/deps-ast.mjs` 闭包复测；反向与镜像消费者 `grep`；保护文件 md5 与 `git status` 归因。

**未执行**（不得当作已验证）：**未在任何真实浏览器/Electron 环境渲染过一条消息**——假 DOM 下 `document.createElement` 存在但 `template.content` 不存在，`sanitizeRichTextHtml()` 会走「真实 DOM 分支」并把 Markdown 结果**洗成空串**，故本批**只能断言类名/文本/结构，不能断言富文本 HTML 产物**（这是端口测试的固有边界，已在测试文件顶部注释标明）；未验证真实 `sessionStore.subscribe` 的回调时序与首帧语义；未验证真实流式 `start/text/end` 节奏（`text` 分支需要 `requestAnimationFrame`，本批未触发）；未验证 CSS 类在 `style.css` 里的实际样式是否存在；未测长会话滚动位置保持、图片预览真实弹窗、复制到真实剪贴板；未跑构建、未提交、未推送。

## 4. 零生产消费方（按红线未接线）

- 仓库反向 `grep`：`agentConversationPresentation` / `createAgentConversationPresentation` 在 `src`/`api`/`electron`/`main.js` 中**除自身与其测试外 0 命中**；本仓 `src/modules/agent/index.js` barrel **不**再导出该件。
- 镜像消费者只有一个：`src/modules/agent/agentPanel.js`，其 `import{AGENT_CONVERSATION_INPUT_REF_LIMIT, createAgentConversationPresentation, normalizeAgentRenderableMediaUrl} from './agentConversationPresentation.js'`，并以 `{messagesEl, runStepsEl, sessionStore, getHistory, onCopy, onImagePreview, copyIconHtml: agentIconSvg('copy'), onMessagesChanged: ...}` 实例化。
- 但该面板在本仓**落后一整代**（本仓 63 143 B vs 镜像 90 025 B），且同一 import 段里还依赖 **仍未落地的 `agentModelControls.js`**（本目录唯一 `BLK` 件）⇒ 接线该呈现层的前置条件是**先解开 BLK、再换代 `agentPanel.js`**，两者都是在用受保护装配件，须专批 + 真机验证 + 授权。
- 故本批未接线、未改装配件、未伪造消费方、未伪造 shim。

## 5. 端口现状（缺陷照实冻结、实现一字未改，35 例断言即台账）

1. `HTMLElement` 不存在或元素非其实例时，消息**根节点也被写入正文** ⇒ 与 body 里的文本重复一份（假 DOM 环境即落在此分支）。
2. 角色判定是严格 `String(role) === 'user'`：`'USER'`、`'User '`、`null`、`undefined` 全部按 assistant 渲染（结构、时间、页脚都不同）。
3. `status` 归一后**总是**加类：中文状态 `'生成中'` 被折叠成 `'-'`，得到类 `agent-message--status--`（既非原值也不可样式化定位）。
4. 富文本只在 `assistant && (!messageType || messageType === 'text')` 时启用；`task_result` 等带 messageType 的助手消息**永远是纯文本**。
5. `renderMarkdownToHtml` 返回空串时**保留**原 `textContent`（不写 `innerHTML`），与「返回空串即清空」的实现相差一步。
6. `inputRefs` 硬上限 12（`AGENT_CONVERSATION_INPUT_REF_LIMIT`），超出静默丢弃；条目必须 `nodeId||id` 非空；`label||name||id` 回落；角标取 `String(kind||'node')` 前 3 字符大写（`document`→`DOC`）。
7. 媒体网格要求 `media.kind === 'image'`；`items` 缺省**或为空数组**都会把 `media` 自身当单项；`url`/`thumbUrl` 互为兜底，两者都归一化为空才丢条目。
8. 名称回落链 `item.name → media.name → task.nodeId → ''`，故**几乎总有名称节点**（只要带 nodeId）；多项时名称后附 `\x20` + 序号。
9. 复制文本 = 正文 trim + 节点名行 + 逐图行（多于一张才带序号）：**正文为空仍可能得到非空复制文本**，此时复制按钮照样出现；反之无文本无媒体的助手消息没有复制按钮。
10. 复制按钮与图片卡片的点击都 `preventDefault()+stopPropagation()`，事件不外泄给面板级委托。
11. 诊断块要求 `summary` 为真值，否则整块不渲染；`phaseLabel || phase || ''`；`step` 走 `Math.max(1, Number(step||1))`、`completedSteps` 走 `Math.max(0, Number(completedSteps||0))` ⇒ **非数字入参得 NaN**，文案直出「第 NaN 步」。
12. 诊断详情默认 `hidden=true`，切换判据是 `detail.hidden === true` ⇒ 外部把 `hidden` 写成非布尔真值时语义反转。
13. `appendWaiting()` 造的三点 `span` 无 `aria-hidden`，且它同样触发 `onMessagesChanged`（可能上报 `hasMessages:false` 的中间态）。
14. `removeWaiting` 对 `null`/无 `parentNode` 的入参静默返回；元素有 `remove()` 走原生，否则手工 `children.splice`（假 DOM 兼容路径）。
15. 订阅**首帧无条件被吞**（构造期 `skipInitial=true`）⇒ 若真实 store 在 `subscribe` 内同步回调一次初始状态，该状态不会呈现。
16. `destroy()` 不置空退订句柄 ⇒ 二次 `destroy()` 会**重复退订**（实测 4 次）；且 destroy 只停订阅，`appendMessage`/`render` 之后仍可继续改 DOM（呈现层无停止守卫）。
17. `task_result` 的 pending 键要求 `taskId||nodeId` 至少其一非空；两者皆空的条目**不记键**，但会把脏标记置真 ⇒ 该脏可能永不清除，表现为每次结束忙碌都广播失效。
18. 流式 `handle({type:'end'})` 在没有前置 `start` 时**完全无效**（`runId === undefined?.id` 不等）；`reconcile` 按 **DOM 位置逐条覆盖**而非按内容 diff ⇒ 历史中间插入一条会让其后所有条目错位改写。
19. `renderRunSteps` 委托给 `createAgentRunStatusPresentation`：步骤为空时把容器整体 `hidden=true` 并清空子节点。
20. 本件对 `document` 是**模块级隐式全局依赖**（`createEl` 直接读 `document`），无法经端口注入替换 ⇒ 单测必须改写 `globalThis.document`，也因此**不能**在真实 DOM 之外验证富文本清洗结果。

## 6. 台账与下一批口径

- 台账：本批新增 2 个仓库文件（1 源码 + 1 测试）与本专题文档，**未修改任何既有生产文件**；`docs/implementation-handoff.md` 的 §6 进度标记、§7 待办勾选项、R12 表行与交付记录四处已同步（表列数保持 6）。
- i18n：本批未新增待补键（该件全部文案经已落地的 `agentPanelText.js`/`formatAgentPanelText`），但把面板侧对 `copyMessage*`、`diagnostic*`、`imageResultOpen`、`waiting` 等键的**实际用量**固化为断言。
- **`src/modules/agent` 现只剩 1 件未落地**：`BLK` 件 `agentModelControls.js`（2 342 B，缺 `../../components/aigenText/modelSelector.js`、`../../components/aigenText/runtimeModelParameterControls.js`、`../modelGenerationParamMemory.js`）——**第111批口径**：先移植这 3 个跨目录依赖（属 `src/components/aigenText` 与 `src/modules` 的模型选择/参数记忆链，须逐依赖复核其在仓现状与消费者），再回装 `agentModelControls.js`；该链完成后，R12 的 81 件端口将全部落地，下一道门即受保护装配件换代（`agentPanel.js`、`agentRuntime.js`、`src/modules/agent/index.js`、`agentActionExecutor.js`、`agentConversationStore.js`、`agentSessionStore.js`、根 `main.js`、`agentSkillCatalog.js`），须专批 + 真机验证 + 授权。
- 承接挂账（本批不解决）：缺失夹具 `tests/testPreviewDom.js` 的 43 项基线失败继续挂账，**不伪造**；富文本 HTML 产物**必须**在真机（或引入真实 DOM 实现）上另行验收。
