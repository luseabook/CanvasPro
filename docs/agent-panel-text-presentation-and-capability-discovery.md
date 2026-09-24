# 第 100 批：Agent 面板文案·消息时间·助手会话·能力发现与技能创作（OK 层 6 件落地不接线）

本批承接第 99 批 §8 排定的「OK 层（有依赖且依赖已在仓）逐件先做具名导出核验」口径，一次性取 6 件落地。范围仍是「补源码」，**未接线、未运行真实应用、未调用任何 AI 服务**。

## 1. 开工前与收工后的目录审计（`deobf-tools/b95/deps-ast.mjs src/modules/agent`）

| 指标 | 开工前（= 第 99 批收工） | 收工后 |
| --- | --- | --- |
| 端口该目录非测试源码 | 81 | 81 |
| 本仓已落地非测试源码 | 41 | **47** |
| 未落地 | 40 | **34** |
| 本仓已落地测试文件 | 29 | **35** |
| LEAF（零依赖纯叶） | 0 | 0 |
| OK（有依赖且全部在仓） | 22 | 22（本批 6 件退出 OK 池，同时 6 件原 BLK 转入） |
| BLK（有依赖缺失） | 18 | **12** |

- 本批 6 件全部从 OK 池退出（已落地不再列入审计）。
- 原 BLK 因本批解阻并进入 OK 池的 6 件：`agentReplyVersions.js`（← `agentAssistantConversation.js`）、`agentDiscoveryCommands.js`（← `agentCapabilityDiscovery.js`）、`agentConversationStreamingPresentation.js`（← `agentMessageTime.js`）、`agentRunStatusPresentation.js`（← `agentPanelText.js`）、`agentSkillAuthoringRuntime.js`（← `agentSkillAuthoring.js`）、`agentSkillLifecycleRuntime.js`（← `agentSkillAuthoring.js`）。
- 仍 BLK 的 12 件里，`agentModelControls.js` 是唯一受阻于**目录外**在产模块的（`../../components/aigenText/modelSelector.js`、`../../components/aigenText/runtimeModelParameterControls.js`、`../modelGenerationParamMemory.js`），其余 11 件只需本目录继续清 OK 池即可级联解阻。

## 2. 交付物

| 文件 | 行 / 字节 / 具名导出 | 端口原始体 | 相对依赖 |
| --- | --- | --- | --- |
| `src/modules/agent/agentPanelText.js` | 282 / 15 030 B / 3（`AGENT_PANEL_LOCALES`、`agentPanelText`、`formatAgentPanelText`） | 13 856 B | `../../i18n/index.js`、`./agentSkillPanelText.js` |
| `src/modules/agent/agentMessageTime.js` | 16 / 763 B / 2（`updateAgentMessageTime`、`createAgentMessageTime`） | 671 B | `./agentPanelElements.js` |
| `src/modules/agent/agentAssistantConversation.js` | 80 / 3 664 B / 4（`normalizeAgentAssistantContext`、`normalizeAgentAssistantReply`、`getAgentPendingAssistantChoice`、`getAgentContinuationSkillIds`） | 3 065 B | `./agentConversationIntent.js` |
| `src/modules/agent/agentProjectMemoryConversationRuntime.js` | 129 / 5 115 B / 1（`createAgentProjectMemoryConversationRuntime`） | 4 115 B | `./agentProjectMemory.js` |
| `src/modules/agent/agentCapabilityDiscovery.js` | 245 / 10 264 B / 5（`normalizeAgentSearchText`、`normalizeAgentSearchKey`、`searchAgentCommands`、`describeAgentCommand`、`searchAgentModels`） | 8 484 B | `../../manifests/index.js` |
| `src/modules/agent/agentSkillAuthoring.js` | 123 / 5 200 B / 6（`AGENT_SKILL_AUTHORING_TARGET_KIND`、`isAgentSkillAuthoringIntent`、`isAgentSkillAuthoringCancelMessage`、`normalizeAgentSkillAuthoringResult`、`requestNormalizedAgentSkillDraft`、`createAvailableAgentSkillId`） | 4 422 B | `./agentSkillPackage.js` |

源码 6 件合计 **875 行 / 40 036 B / 21 具名导出**；配套测试 6 件合计 **1 017 行 / 39 276 B / 71 项**；本批新增 **1 892 行 / 79 312 B**。

关键语义（均以断言固定，未做任何改写）：

- **`agentPanelText`**：`AGENT_PANEL_LOCALES` 冻结为 `['zh-CN','en-US']`；locale 归一只看 `toLowerCase().startsWith('en')`，其余一律 `zh-CN`；取键顺序为「本语言表 → zh-CN 表 → 键名本身」；zh-CN 表以 `{...AGENT_SKILL_PANEL_TEXT['zh-CN'], ...}` 起步，故技能面板文案被面板表继承并可被同名键覆盖；`formatAgentPanelText` 只把 `null`/`undefined` 视为缺失（`0`、`false` 会渲染成 `'0'`、`'false'`），占位符语法为 `{name}`。
- **`agentMessageTime`**：两道校验（`Number(ts) > 0` 与 `isFinite(date.getTime())`）任一不过即返回 `false` 且不写任何属性；写入 `datetime`（ISO 串）、`textContent`（`getHours() + ':' + 补零分钟`）、`title`（`toLocaleString()`）；`createAgentMessageTime` 走 `createAgentElement('time','agent-message-time')`，时间戳非法时返回 `null`。
- **`agentAssistantConversation`**：选项归一要求问题非空且有效选项 ≥ 2，按 id 去重、缺 id 或缺 label 丢弃、上限 3 个、问题截 600 字；上下文 `skillIds` 只收 `^[a-z0-9][a-z0-9-]{0,63}$`、去重后截 2 个；```` ```agent-choice ```` 围栏内的 JSON 解析成功即作为选项来源，解析失败则选项判空；`getAgentPendingAssistantChoice` 只看最后一条「无 `messageType` 或 `messageType==='text'`」的消息，要求 `role==='assistant' && status==='chat'`，`questionId` 回落链为 `itemId → turnId → ts + ':' + 长度`，再拼 `replyVersions.activeIndex || 0`；`getAgentContinuationSkillIds` 在「续问语义」或「存在待答选择题且属自定义回答」时才继承上一条助手消息的 `skillIds`，且该消息状态须属 `chat|stopped|failed`。
- **`agentProjectMemoryConversationRuntime`**：`handle()` 在未注入记忆仓库时直接 `null`；识别不到记忆意图同样 `null`（不产生 trace）；命中意图后先 `recordTrace({type:'agent_turn_routed', channel:'project.memory', reason:'project-memory-<operation>'})`，再经 `pushHistory({role:'assistant',status:'success',content,turnId:runId})` + `setCurrentRun({id,status:'success',stopped:false})` 落会话，返回 `{ok:true,status:'success',reply,responseChannel:'project.memory',projectMemory}`；`inspect` 先判空记忆走 `empty` 文案，否则按 `AGENT_PROJECT_MEMORY_CATEGORIES` 固定顺序逐类成行、空类跳行；`remember` 按 `added` 是否为空切换 `remembered`/`unchanged`；`forget` 按 `removed` 是否为 0 切换 `forgotten`/`notFound`。
- **`agentCapabilityDiscovery`**：检索文本做 `NFKC` + trim + 小写，检索键在此基础上再剔除空白与 `-_.:/|,，。()（）[]【】`；打分表为「命令 id/模型 id 精确 1000 → 键精确 900 → 子串互含 220 → 键子串互含 200 → 描述整串包含 180 → 键化描述包含 160 → 分词命中 30」，同分按注册表原序；`limit` 经 `normalizeLimit` 处理（非有限值 → 6，其余 `trunc` 后钳到 1..12）；`describeAgentCommand` 未注册时返回 `{found:false, commandId, errorCode:'AGENT_COMMAND_NOT_FOUND', message}`；模型检索以 `listModelManifests()`（本仓 143 件）为数据源，`kind`/`provider` 精确过滤、`inputKinds` 逐条要求模型接受该输入位（`allowedKinds` 命中 / `maxByKind>0` / `minByKind>0` / `fixedSlots` 同 `kind`）。
- **`agentSkillAuthoring`**：创作意图须「创建动词表」与「技能词」在 32 字内相邻（双向），否定式（`不要/别/不用/无需`、`do not/don't`）与提问式（`如何/怎么/怎样…`、`how to/how do i…`）优先判否；取消语为全锚定白名单（`取消[创建]`、`不创建了`、`算了`、`cancel`、`never\s*mind`，尾部至多一个标点）；结果归一分四路：非法对象 → `SKILL_AUTHORING_INVALID`，`need_clarification` → 缺问题报 `SKILL_AUTHORING_QUESTION_MISSING`、选项非数组给 `[]` 且截 6，`failed` → 透传错误码，其余走 `serializeManagedAgentSkillDefinition`；`requestNormalizedAgentSkillDraft` 仅在**非** `SKILL_AUTHORING_FAILED` 的失败时重试一次，并在第二次入参上追加 `repairReason = '<errorCode>: <message>'`，同时 `onTrace({type:'agent_skill_authoring_schema_retry', errorCode})`；`createAvailableAgentSkillId` 先把基础名归一为 `[a-z0-9-]` slug（截 64），冲突时按 `^(.*?)-(\d+)$` 拆基础名与序号并从 `max(2, 序号+1)` 起试到 999。

## 3. 接入状态

### 3.1 具名导出核验（OK 层落地的硬性前置）

AST 分级只证明依赖**路径**存在，不证明被依赖模块**真的导出**了所引用的名字（这是既往「假 OK」的来源）。本批在落地前用 `deobf-tools/b100/verify-exports.mjs` 在**纯 node**（无 DOM、无 Electron、不联网）下逐个 `import()` 依赖模块并检查每个被引用具名，结果 12/12 全命中：

| 待落地件 | 依赖（本仓） | 被引用具名 | 纯 node 可导入 |
| --- | --- | --- | --- |
| `agentPanelText.js` | `src/i18n/index.js`、`agentSkillPanelText.js` | `getLocale`、`AGENT_SKILL_PANEL_TEXT` | 是 |
| `agentMessageTime.js` | `agentPanelElements.js` | `createAgentElement` | 是 |
| `agentAssistantConversation.js` | `agentConversationIntent.js` | `isAgentConversationContinuation`、`isAgentCustomChoiceAnswer` | 是 |
| `agentProjectMemoryConversationRuntime.js` | `agentProjectMemory.js` | `AGENT_PROJECT_MEMORY_CATEGORIES`、`detectAgentProjectMemoryIntent`、`isAgentProjectMemoryEmpty` | 是 |
| `agentCapabilityDiscovery.js` | `src/manifests/index.js` | `listModelManifests` | 是 |
| `agentSkillAuthoring.js` | `agentSkillPackage.js` | `serializeManagedAgentSkillDefinition` | 是 |

### 3.2 生产接线：**未接线，本仓零消费方**

反向 `grep -rl --include=*.js "<模块名>" src electron api`（排除自身）对本批 6 件**各 0 命中**，故按「宁可留白并记账，也不为了『有引用』而擅自接线」保持不接线。端口侧真实导入方分两类：

- **在本仓存在但属更早世代**（升代须单独成批 + 真机验证 + 授权，本批未做）：`src/modules/agent/agentPanel.js`、`agentRuntime.js`、`agentConversationStore.js`、`index.js`、`agentCanvasSummary.js`、`agentPlanValidator.js`、`api/index.js`。这些文件在仓内**均不引用**本批任何模块名，即它们还是旧一代实现。
- **在本仓整体不存在**：`agentConversationPresentation.js`、`agentConversationStreamingPresentation.js`、`agentRunStatusPresentation.js`、`agentReplyVersions.js`、`agentSessionEventLog.js`、`agentAssistantConversationRuntime.js`、`agentTextConversationRuntime.js`、`agentConversationCapabilityRuntime.js`、`agentDiscoveryCommands.js`、`agentSkillConversationRuntime.js`、`agentSkillLifecycleRuntime.js`、`agentSkillAuthoringRuntime.js`、`api/agentAssistantApi.js`。

另注：`agentMessageTime.js` 与 `agentPanelText.js` 属**呈现层**，前者经 `createAgentElement` 依赖真实 `document`；本仓既无承载它的面板世代，也无浏览器侧回归手段，故「落地即接 UI」不成立。

## 4. 冻结的端口现状（以断言固定，未打补丁）

1. `agentAssistantConversation`：`normalizeAgentAssistantContext` 只判 `typeof === 'object'`，**缺 `Array.isArray`**，故 `[]` 被当对象处理并返回 `{skillIds: []}` 而非 `null`。
2. 同一模块内**两种形状不对称**：上下文把选项嵌在 `choice` 下，而 `normalizeAgentAssistantReply` 把 `{question, options}` **铺平到返回值顶层**（`res.choice` 恒为 `undefined`）；下游需按两条不同路径读取。
3. 围栏正文剥离后，因剥离结果不含问题文本，`normalizeAgentAssistantReply` 又把问题**追加回正文**，即 ```` ```agent-choice ```` 的问题最终仍出现在正文里。
4. 围栏内 JSON 解析失败时选项判空，但**正文截断照常执行**（围栏内容整体消失，无错误码）。
5. `agentProjectMemoryConversationRuntime`：`inspect` 的行内分隔符 `'- '`、`'：'`、`'；'` 硬编码在拼装处，en-US 下也输出全角标点；返回值里的 `projectMemory` 是仓库对象的**同一引用**（未拷贝）。
6. 同模块的分支是「inspect / remember / forget / 其余一律 clear」，即**任何未预期的 operation 值都会清空长期记忆**（当前意图器只产出这四种，故正常路径不触发）。
7. `agentMessageTime`：小时不补零而分钟补零（`9:05`）；`Number(ts)` 强转使数字字符串合法；显示串与 `title` 依赖宿主**时区与 locale**，跨机不可复现。
8. `createAgentMessageTime` 在时间戳非法时**先创建再丢弃** `<time>` 元素（`document.createElement` 已被调用一次）。
9. `agentCapabilityDiscovery`：查询为空串（或仅空白）时候选**每条都得 1 分**，即"空查询等于全量命中"；`normalizeLimit` 对 `NaN`/`Infinity` 回落 6，但对 `0`/负数**钳到 1**；`totalMatched` 报全量而返回体受 1..12 上限。
10. `summarizeModelField` 的保留键白名单写的是 `default`，而本仓清单实际发布 `defaultValue` ⇒ **默认值永不出现在摘要里**；`description`/`displayLabel` 同样被丢弃，选项另截 60 个。
11. `agentSkillAuthoring`：`normalizeAgentSkillAuthoringResult()` 的形参默认 `{}`，故「模型无返回」被判为 `INVALID_SKILL_ID` 而非 `SKILL_AUTHORING_INVALID`。
12. `createAvailableAgentSkillId` 无冲突时直接返回全长 64 的 slug，冲突时基础名截到 `64 - 后缀长度`；重试上界 999 之后的 `base36(时间戳)` 分支实际不可达。
13. 创作意图动词表含 `做一个/写一个/新建/创建/生成/制作` 但**不含 `先建`**，故「技能先建一个」判否。

## 5. 验证矩阵（全部离线；未运行 Electron、未起服务、未打开窗口、未调用 AI 服务）

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节等于端口 | `cmp` 6 件 vs `deobf-tools/b100/port/` | 6/6 `IDENTICAL` |
| 语法 | `node --check` × 6 | 6/6 通过 |
| 依赖具名核验 | `node b100/verify-exports.mjs <6 件>` | 12/12 具名在纯 node 下命中，无 `DEP-FAIL` |
| 格式 | `prettier --check/--write` 12 件 | 6 件源码自始 `unchanged`；6 件测试 `--write` 后全过 |
| 本批测试 | `node --test` 6 件 | **71/71 全绿**（首跑 64/71，7 处**全部为测试自身期望偏差**，实现一字未改） |
| 全量 `src/**` | `find src -name '*.test.js' \| xargs node --test` | `2 642/2 599/43 → **2 713/2 670/43**`（恰好 +71/+71/±0） |
| 失败集合稳定性 | `diff b85-fails.txt b100-fails.txt` | `diff-exit=0`（43 项全部仍归属缺失夹具 `tests/testPreviewDom.js`，**不伪造**） |
| `electron/**` | 本批未触碰任何 electron 文件 | 沿用第 84 批以来 `1 649/1 648/1` |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` 未变 |
| 工作区快照 | `git ls-files --others --exclude-standard \| wc -l`、`git diff --name-only \| wc -l` | `683 → 695`（+12 源码与测试），专题文档 +1 后为 696；改动文件 67 |

首跑 7 处测试期望偏差分别是：`[]` 的上下文判定（第 1 条）、围栏选项形状（第 2 条）、围栏剥离后追加问题（第 3 条）、`query: 'x'` 因分词长度 < 2 而全表 0 分致摘要取空、创作意图两处词表外变体（第 13 条）、缺省实参走序列化器（第 11 条）。全部改测试后重跑为 71/71。

## 6. 本批**不构成**完成证据

- 6 件零生产消费方，Agent 面板/会话/技能创作的**用户可见行为无任何变化**；本批只是把可离线度量的源码搬进仓并加测试。
- 未验证：面板真实渲染（`agentPanelText` 的文案在真实 UI 的换行/截断/宽度）、`<time>` 元素在真实时区下的显示、助手待答选择题在真实会话流里的呈现与作答回灌、能力发现（命令/模型检索）在真实 Agent 循环中的召回质量、技能创作的真实模型返回与落盘（`agentSkillPackage` 的写盘路径与权限）。
- 未做：`src/modules/agent/index.js`、`agentRuntime.js`、`agentPanel.js`、`agentConversationStore.js`、`agentCanvasSummary.js`、`agentPlanValidator.js`、`api/index.js` 的**升代**（均系在产模块，须单独成批 + 真机验证 + 授权）。
- 未做：缺失夹具 `tests/testPreviewDom.js`（43 项既有失败的根因），**不伪造**。
- i18n 欠项延续：第 98 批记的 `taskCompleted`/`taskStarted`/`taskPending` 仍缺；本批 `agentPanelText` 自带中英表，未新增 `src/i18n/messages/*` 欠项。

## 7. 约束复核

- 未改 `api/freeImageHostApi.js`（md5 复核一致），未覆盖任何受保护文件；批量拷贝仅 `cp` 本批 6 个具名文件到 `src/modules/agent/`，未使用目录级 `cp`/`git checkout`/`git clean`/`reset --hard`。
- 未 push、未触发构建、未上传 release、未启动 Electron、未起 Python 后端、未调用任何计费或真实 AI 服务。
- 未新增 npm 依赖；未改 `src/i18n/messages/*.js`；未引入绝对开发机路径或临时目录作为运行时依赖（`deobf-tools/` 仅出现在文档与验证命令里）。
- 未伪造消费者、未伪造 shim、未打端口源码补丁（13 条现状全部以断言冻结并记账）。
- 测试替身全部注入（假 store / 假 sessionStore / 假 registry / 假 `document`），无一处 `taskkill`、无真实网络。

## 8. 下一批（第 101 批）建议

沿本批口径继续清 OK 池（现为 22 件，全部只被本目录或受保护装配件消费）：

1. **优先解阻面最大者**：`agentReplyVersions.js`（解阻 `agentAssistantConversationRuntime.js`、`agentSessionEventLog.js`、`agentConversationActions.js` 3 件的依赖）与 `agentConversationActionText.js`（依赖 `../../i18n/index.js`，另解阻 `agentConversationActions.js`、`agentAssistantConversationRuntime.js`）。
2. **成组取呈现簇**：`agentRunStatusPresentation.js` + `agentConversationStreamingPresentation.js`（二者依赖本批已落的 `agentPanelText.js`/`agentMessageTime.js`，且同喂 `agentConversationPresentation.js`）⇒ 取这两件可让 `agentConversationPresentation.js` 只剩 `agentRunStatusPresentation.js` 一个缺口。
3. `agentSkillAuthoringRuntime.js` + `agentSkillLifecycleRuntime.js`（← `agentSkillAuthoring.js`）与 `agentSkillConversationRuntime.js`（还需 `agentSkillEditor.js`、`agentRunEventLog.js`）构成技能链闭环，但**闭环后仍无装配方**，须与 `index.js` 升代同批才谈接线。
4. 每件落地前照例先跑 `b100/verify-exports.mjs` 式的**具名导出 + 纯 node 可导入**核验；呈现簇（依赖 `document`）另须确认测试注入假 DOM 的可行性，不能注入则记为「不可离线度量」并顺延。
