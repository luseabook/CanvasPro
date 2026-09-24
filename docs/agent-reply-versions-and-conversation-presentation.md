# 第 101 批：Agent 回答版本模型·会话动作短文案·运行步骤与流式呈现（OK 层 4 件落地不接线）

本批属 R12（Agent 侧栏与会话体系）。承接第 100 批 §8 排定的两件优先解阻件与一件呈现簇，共 **4 件源码 + 4 件测试 + 本文档**。所有源码逐字节等于端口产物，未打补丁；端口现状以断言冻结（§4）。**落地不接线**：本仓零生产消费方，未改任何受保护装配件，未伪造引用（§3.2）。

## 1. 开工前与收工后的目录审计（`deobf-tools/b95/deps-ast.mjs src/modules/agent`）

| 指标 | 第 100 批后 | 第 101 批后 | 变化 |
| --- | --- | --- | --- |
| 端口件数 | 81 | 81 | 0 |
| 未落地 | 34 | 30 | −4 |
| 纯叶（0 依赖） | 0 | 0 | 0 |
| OK（依赖齐全） | 22 | 21 | −4 出池 / +3 解阻 |
| BLK（依赖缺失） | 12 | 9 | −3 |

- 出池（本批落地）：`agentReplyVersions.js`、`agentConversationActionText.js`、`agentRunStatusPresentation.js`、`agentConversationStreamingPresentation.js`。
- **解阻（BLK → OK）3 件**：`agentAssistantConversationRuntime.js`、`agentConversationActions.js`、`agentConversationPresentation.js`。
  即 R12 会话层的三个核心装配件的端口依赖已在目录层面全部到位，只差把它们自身升代（受保护、需真机与运行授权）。
- 剩余 9 件 BLK 的**直接缺口清单**：`agentContextDigest.js`（阻 `agentContextDigestRuntime.js` → 再阻 `agentModelRequestRuntime.js`）、`agentExternalInformation.js`（阻 `agentExternalInformationRuntime.js`）、`agentRunEventLog.js`（阻 `agentSessionEventLog.js`）、`agentSkillAuthoringRuntime.js` + `agentSkillLifecycleRuntime.js`（阻 `agentSkillConversationRuntime.js`）、`agentSkillEditor.js`（阻 `agentSkillPanel.js`）、`agentAssistantConversationRuntime.js`（阻 `agentTextConversationRuntime.js`），以及目录外三件 `components/aigenText/modelSelector.js`、`components/aigenText/runtimeModelParameterControls.js`、`modules/modelGenerationParamMemory.js`（合阻 `agentModelControls.js`）。
- **结构性结论**：9 件 BLK 里有 6 件只被「本目录内、已在 OK 池」的件卡住 ⇒ R12 剩余补源码是**逐层剥链**而非无底洞；只有 `agentModelControls.js` 需要跨目录（模型选择器簇），仍属受保护升代范畴。
- 审计快照：`deobf-tools/b100/audit.txt`（前）与 `deobf-tools/b101/audit.txt`（后），BLK/OK 名单差异用 `comm` 逐名核对，未凭印象记账。

## 2. 交付物

| 文件 | 行 | 字节 | 导出 | 端口原始字节 |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentReplyVersions.js` | 112 | 4 799 | 9 | 4 174 |
| `src/modules/agent/agentConversationActionText.js` | 26 | 826 | 1 | 720 |
| `src/modules/agent/agentRunStatusPresentation.js` | 31 | 1 569 | 1 | 1 344 |
| `src/modules/agent/agentConversationStreamingPresentation.js` | 90 | 4 095 | 2 | 3 331 |
| 合计源码 | **259** | **11 289** | **13** | 9 569 |

配套测试 4 件（可读、不混淆、中文标题）：

| 测试 | 行 | 字节 | 例数 |
| --- | --- | --- | --- |
| `agentReplyVersions.test.js` | 298 | 12 410 | 23 |
| `agentConversationActionText.test.js` | 59 | 2 700 | 7 |
| `agentRunStatusPresentation.test.js` | 205 | 6 988 | 10 |
| `agentConversationStreamingPresentation.test.js` | 524 | 18 676 | 22 |
| 合计测试 | **1 086** | **40 774** | **62** |

- 本批新增 **1 345 行 / 52 063 字节**（含本文档另计）。
- `prettier --check` 8 件全过（4 件源码自始未被改写，4 件测试写入后复检）。
- 依赖：`agentReplyVersions.js` → `./agentAssistantConversation.js`（第 100 批已落地）+ `./agentConversationText.js`；`agentConversationActionText.js` → `../../i18n/index.js`；`agentRunStatusPresentation.js` → `./agentRunSteps.js` + `./agentPanelText.js`（第 100 批）；`agentConversationStreamingPresentation.js` → `../../components/aigenText/markdownRenderer.js` + `./agentAssistantMarkdown.js` + `./agentConversationScroll.js` + `./agentMessageTime.js`（已落地）。**本批未新增任何 npm 依赖。**
- 目录规模：`src/modules/agent/` 非测试源码 47 → **51** 件，测试 35 → **39** 件（端口 81 件）。

## 3. 接入状态

### 3.1 具名导出核验（OK 层落地的硬性前置，沿用第 99/100 批工序）

AST 分级只验「文件在位」，不验「具名导出真的存在且能在纯 node 下导入」，故落地前逐个 import 说明符解析到仓库文件并动态 `import()` 比对具名绑定：`deobf-tools/b100/verify-exports.mjs` 对 4 件源码共 **14 条具名依赖判定 14/14 `ok`，零 `MISSING`、零 `DEP-FAIL`**。

| 消费方 | 依赖 | 判定 |
| --- | --- | --- |
| `agentReplyVersions.js` | `normalizeAgentAssistantContext` | ok |
| `agentReplyVersions.js` | `AGENT_MESSAGE_CONTENT_LIMIT`、`compactAgentConversationText` | ok / ok |
| `agentConversationActionText.js` | `getLocale` | ok |
| `agentRunStatusPresentation.js` | `buildAgentRunSteps`、`agentPanelText` | ok / ok |
| `agentConversationStreamingPresentation.js` | `renderMarkdownToHtml`、`formatAgentAssistantMarkdown` | ok / ok |
| `agentConversationStreamingPresentation.js` | `scrollAgentMessageListToEnd`、`scrollAgentMessageListTo`、`updateAgentMessageTime` | ok ×3 |

抽样行为核验（避免「假 OK」）：`AGENT_MESSAGE_CONTENT_LIMIT === 32 000`、`buildAgentRunSteps({runEvents:[],currentRun:null})` 返回 `[]`、`agentPanelText('runStepsTitle')` 返回「执行步骤」、`renderMarkdownToHtml('- a\n- b')` 返回 `<ul><li>a</li><li>b</li></ul>`。

### 3.2 生产接线：**未接线，本仓零消费方**

- `grep -rl "agentReplyVersions|agentConversationActionText|agentRunStatusPresentation|agentConversationStreamingPresentation"` 覆盖 `src`/`api`/`electron`/`main.js`：只命中 4 件新测试与 `agentConversationActionText.js` 自身（其内部字符串含模块名片段），**无任何生产文件引用**。
- 移植镜像里的真实消费方：`agentReplyVersions.js` ← `agentAssistantConversationRuntime.js`、`agentConversationActions.js`、`agentConversationStore.js`、`agentSessionEventLog.js`；`agentConversationActionText.js` ← 前两者；`agentRunStatusPresentation.js` 与 `agentConversationStreamingPresentation.js` ← `agentConversationPresentation.js`。四者全部属于「受保护装配件升代」范畴（§6），需独立批次 + 真机验证 + 运行授权。
- 结论：本批只扩「可落地面」，不改运行时行为；两件呈现模块在仓库内保持「已落地、待接线」。

## 4. 冻结的端口现状（以断言固定，未打补丁）

**回答版本（`agentReplyVersions.js`）**

1. `agentMessageKey()` 在无 `itemId` 时拼 `ts + ':' + role`，两字段皆缺时得到字面量 `"undefined:undefined"` ⇒ 多条无标识消息**键冲突**，`selectAgentReplyVersion` 会同时匹配到它们。
2. 版本条目缺 `prompt` 或 `reply`（含空串）时**整条静默丢弃**；且该过滤发生在「上限判定之前」⇒ 20 条里有 1 条空 reply 时被裁成 19 条，`appendAgentReplyVersion` **不抛上限错**而继续追加回 20 条（上限可被脏数据绕过）。
3. `status` 白名单只有 `chat|stopped|failed`（大小写敏感，`'CHAT'` 不算）⇒ 流式中的 `'streaming'` 一旦进归一会**被改写成 `chat`**，故该函数只能在沉降后调用。
4. `assistantContext` 经 `normalizeAgentAssistantContext` 后**只保留 `skillIds`**（`styleHints` 等字段被丢）⇒ 切版本会丢上下文扩展字段；且 `normalizeAgentAssistantContext([])` 返回 `{skillIds: []}` 而非 `null`，使 `|| { skillIds: [] }` 兜底部分成为死码（与第 100 批现状 ① 同源）。
5. `activeIndex` 走 `trunc(Number(x)) || 0` ⇒ `'abc'`、`null`、`-5`、`NaN` 一律 0；`'1'` 这类数字串能正常命中；越界被钳到「末条 / 19」。
6. `normalizeAgentReplyVersionChange()` 只校验 `append` 是数组，`append` 内非法条目被清成 `[]` 后**仍返回对象**（`{activeIndex, append: []}`），与 `normalizeAgentReplyVersions()` 全非法返回 `null` 不对称。
7. `createAgentReplyVersionChange(prev, next)` 在 `next` 缺 `replyVersions` 时按「已有 0 条」处理 ⇒ **整个 prev 被当作 append 重放**（重复版本风险）。
8. `getAgentEditableTurn()` 对硬编码字符串入参不抛（`'ab'.at(-1)` 可用，只判否），但 `null`/数字入参在 `at()` 上抛 `TypeError`（默认参数只对 `undefined` 生效）。
9. `getAgentEditableTurn()` 要求助手消息**必须有 `assistantContext`**、状态在 `chat|stopped|failed`、用户消息 `inputRefs` 为空 ⇒ 带素材入参的轮次、无上下文的纯文本回复，一律**不可编辑、不可版本化**。
10. `appendAgentReplyVersion()` 达到上限时抛中文硬编码 `回答版本已达上限，请发送新消息继续`，与 `agentConversationActionText('limit')` 的 zh 词条内容相同但**不走 i18n** ⇒ 英文界面下错误文案仍是中文。
11. `selectAgentReplyVersion()` 返回新数组、只整条替换末两条，更早历史保持**同一对象引用**；用户消息只换 `content`，`modelId`/`inputRefs` 等其余字段原样保留。

**动作短文案（`agentConversationActionText.js`）**

12. 语言闸门是 `String(locale).startsWith('en')`，**大小写敏感** ⇒ `'EN'`、`'En-US'` 落中文，`'english'` 反而落英文；`null`/对象等非字符串经 `String()` 后一律中文。
13. 未收录 key 原样返回 ⇒ 与「词条恰好等于 key」不可区分，缺失词条在 UI 上表现为英文原文而不报错。

**运行步骤呈现（`agentRunStatusPresentation.js`）**

14. `destroy()` 是**空实现**：调用后 DOM 不摘除、`render()` 仍可继续工作 ⇒ 生命周期完全依赖外层摘 `root`。
15. 空步骤时先 `replaceChildren()` 再置 `hidden = true` 并提前返回 ⇒ 标题节点不会被创建，旧节点被清空（不会残留）。
16. `agentPanelText('runStepsTitle')` **不传 locale** ⇒ 标题语言取渲染当时全局语言，切换语言不会自动重绘。
17. 缺 `root` 时工厂构造不抛，首次 `render()`（含空态）才抛 `TypeError`。
18. 步骤数由 `buildAgentRunSteps()` 末位 `slice(-8)` 决定，呈现层**不再截断**。

**流式呈现（`agentConversationStreamingPresentation.js`）**

19. `reconcile()` 按**下标**而非 `itemId` 对齐 DOM ⇒ 历史中间插入/删除会使后续气泡的文本与标识错位（就地改写）。
20. `end` 事件的条件是 `discard || revision` ⇒ `revision` 自 `start` 起从不清零，任何带非零 `revision` 的流式气泡在结束时**一律被移除**，只能靠 `history` 重建。
21. 贴底判定 `scrollHeight - scrollTop - clientHeight < 0x40`（64px，**严格小于**）⇒ 距底恰好 64px 时保留用户位置。
22. `updateAgentMessageBody()` 文本未变时整体跳过重渲染 ⇒ 外部改写过的 DOM 只在**下一次文本变化**时自愈。
23. 消息文本取 `String(content || status)` ⇒ `content` 为空时把状态短语当正文写进气泡与复制缓存（`agentMessageCopyText`）。
24. 缺 `.agent-message-body` 子节点时抛 `TypeError`（无空值保护），缺 `.agent-message-time` 时静默返回 `false`。
25. 未 `start` 就来的 `text`/`end`、runId 不匹配、未知 `type` 全部**静默忽略**，不回调 `onSettled` ⇒ 迟到结果不会污染界面（与「停止后不执行」策略一致）。

## 5. 验证矩阵（全部离线；未运行 Electron、未起服务、未打开窗口、未调用 AI 服务）

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 字节一致性 | `cmp -s` 4 件源码 vs `deobf-tools/b101/port/` | 4/4 `IDENTICAL` |
| 语法 | `node --check` 4 件源码 | 全过 |
| 格式 | `prettier --check` 8 件 | `All matched files use Prettier code style!` |
| 具名导出核验 | `b100/verify-exports.mjs` | 14/14 `ok`，零 `DEP-FAIL` |
| 本批 4 件测试 | `node --test --test-reporter=tap` | `62 / 62 / 0` |
| `src/**` 全量 sweep（246 件测试文件） | `find src -name '*.test.js' \| xargs -0 node --test` | `2 713 / 2 670 / 43` → **`2 775 / 2 732 / 43`**（恰好 **+62 / +62 / ±0**） |
| 失败名单回归 | 与 `deobf-tools/b85-fails.txt` 逐名 `diff` | `diff-exit=0`（43 项名单不变，仍全部归属缺失夹具 `tests/testPreviewDom.js`，**未伪造**） |
| `electron/**` sweep | 未运行（本批未触碰该目录） | 沿用既有记录 `1 649 / 1 648 / 1`，**不声称本批复测** |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` **未变** |
| 快照 | `git ls-files --others --exclude-standard \| wc -l` / `git ls-files --modified \| wc -l` | 未跟踪 696 → **704**（+8 = 4 源码 + 4 测试），已改 67；本文档落盘后未跟踪再 +1 |
| 首次跑结果 | 4 件测试首跑 `42 / 62`，20 项失败**全部为测试侧期望与假 DOM 注入缺陷**（缺 `classList` 可迭代实现、`at()` 对字符串的宽容、上限判定发生在过滤之后、`appendEntry` 与 markdown 返回值的期望偏差） | **实现一字未改**，修正断言与注入后 `62/62` |

测试注入要点（供后续呈现类批次复用）：假元素必须实现**可迭代的 `classList`**（`for..of` + `add`/`remove`）与 `querySelector(All)` 递归遍历；`requestAnimationFrame`/`cancelAnimationFrame` 需成对注入并在 `finally` 还原；**呈现类测试文件里不要再注入 `globalThis.document`**——一旦存在 `document.createElement`，`sanitizeRichTextHtml()` 会走真实 DOM 分支并在假 DOM 上静默返回空串，导致 markdown 断言全灭（这是本批首跑失败的主因）。`agentRunStatusPresentation` 只用到 `document.createElement`，故单独在 `withDocument()` 作用域内注入并还原。

## 6. 本批**不构成**完成证据

- 未做装配件升代：`agentConversationPresentation.js`、`agentConversationActions.js`、`agentAssistantConversationRuntime.js` 仍是端口代，仓库运行时不使用本批 4 件。
- 未做真机验收：回答版本切换、重新回答、编辑提问、运行步骤气泡、流式气泡插入位置与滚动保持，均需渲染层接线 + 打开窗口 + 授权后才可验收。
- 未做静态「当作已接入」的替代证据：目录审计、`node --check`、离线单测只证明「可维护源码已补齐」，不证明 R12 功能可用。
- 未补 i18n 词条：`agentConversationActionText.js` 自带中英双表（不依赖 `src/i18n/messages/*`），但 §4 第 10 条的硬编码中文抛错文案仍未国际化。
- 仍欠：`agentRunEventLog.js`、`agentContextDigestRuntime.js`、`agentSkill*Runtime.js`/`agentSkillEditor.js`、`modelSelector` 簇等 BLK 缺口件。

## 7. 约束复核

- 未覆盖 `api/freeImageHostApi.js`（md5 已复核）。
- 未触碰受保护装配件：`src/modules/agent/index.js`、`agentRuntime.js`、`agentPanel.js`、`agentContextBuilder.js`、`agentConversationStore.js`、`agentSessionStore.js` 及 `style.css`、`src/i18n/messages/*.js`。
- 未新增 npm 依赖；未提交、未推送、未触发 CI/发布。
- 未运行 Electron、未起服务、未打开窗口、未调用任何计费 AI 服务；测试未联网，未写仓库外运行状态。
- 未伪造消费方、未伪造垫片、未伪造缺失夹具；端口 bug 一律记录不修补。
- 反混淆临时目录与绝对开发机路径未进入运行时代码（仅出现在本文档的工序说明中）。

## 8. 下一批（第 102 批）建议

按「解阻面最大优先 + 不碰受保护装配件」两条口径，剩余 30 件未落地（OK 21 / BLK 9）建议取：

1. **优先取「OK 池里的单点卡口件」**（一次落地同时吃掉多个 BLK）：`agentRunEventLog.js`（解 `agentSessionEventLog.js`）、`agentContextDigest.js`（解 `agentContextDigestRuntime.js`）、`agentExternalInformation.js`（解 `agentExternalInformationRuntime.js`）、`agentSkillEditor.js`（解 `agentSkillPanel.js`）、`agentSkillAuthoringRuntime.js` + `agentSkillLifecycleRuntime.js`（同解 `agentSkillConversationRuntime.js`）。6 件全落可把 BLK 从 9 压到 2（只剩链式 `agentModelRequestRuntime.js` 与跨目录的 `agentModelControls.js`）。
2. **同批可带上会话链最后一块**：`agentAssistantConversationRuntime.js`（现已 OK，其依赖 `agentAssistantConversation.js`、`agentStreamingProse.js`、`agentConversationActionText.js` 均已落地），落地后再解 `agentTextConversationRuntime.js`。
3. 每件落地前照例先跑 `b100/verify-exports.mjs` 式**具名导出 + 纯 node 可导入**核验；呈现类另须先确认假 DOM 可注入（本批 §5 已给出「不要注入 `globalThis.document`」的边界），不可注入者记为「不可离线度量」并顺延。
4. 装配件升代（`agentConversationPresentation.js`、`agentConversationActions.js`、`agentAssistantConversationRuntime.js` 三件现已 OK）仍需**独立批次 + 真机验证 + 运行授权**，不与本类补源码批次混做。
