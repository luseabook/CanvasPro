# 第104批：对话编排运行时三件（文本会话 / 模型请求 / 能力路由）

本批从 0.7.16 反混淆镜像移植 `src/modules/agent` 的三个"编排层"文件。它们本身不做业务判断，只把第102、103批落地的
纯函数与运行时拼成可调用的对话链路，因此本批的意义在于：**第103批的 4 个运行时首次进入了一条完整的、有测试证据的调用链**。

## 1. 落地清单

### 1.1 源码（3 件，202 行 / 6 955 字节 / 3 个导出）

| 文件 | 行 | 字节 | 导出 | 直接依赖 |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentTextConversationRuntime.js` | 100 | 3 573 | `createAgentTextConversationRuntime` | `./agentAssistantConversationRuntime.js` |
| `src/modules/agent/agentModelRequestRuntime.js` | 52 | 1 600 | `createAgentModelRequestRuntime` | `./agentContextDigestRuntime.js` |
| `src/modules/agent/agentConversationCapabilityRuntime.js` | 50 | 1 782 | `createAgentConversationCapabilityRuntime` | `./agentExternalInformationRuntime.js`、`./agentProjectMemoryConversationRuntime.js`、`./agentSkillConversationRuntime.js` |

- 三件均由镜像 `C:\Users\luobote\.qoder\tmp\shuo-deobf\src\modules\agent\` 取原始反混淆产物，经
  `C:\Users\luobote\.qoder\tmp\deobf-tools\b104\port\` Prettier 格式化后**逐字节拷入仓库**；
  `cmp -s` 复核 3/3 IDENTICAL，未做任何语义改写（含 `_0x` 局部名、`Object['freeze']`、方括号取属性、`\x20` 转义）。
- `node --check` 3/3 通过。
- 具名导出闸门 `b100/verify-exports.mjs`：5/5 `ok`（在纯 node 下动态 `import()` 成功，非仅路径存在）。

### 1.2 测试（3 件，809 行 / 32 867 字节 / 44 个用例）

| 文件 | 行 | 用例 |
| --- | --- | --- |
| `src/modules/agent/agentModelRequestRuntime.test.js` | 179 | 11 |
| `src/modules/agent/agentConversationCapabilityRuntime.test.js` | 233 | 15 |
| `src/modules/agent/agentTextConversationRuntime.test.js` | 397 | 18 |

- `node --test --test-timeout=25000`：本批 44/44 通过。
- 全仓复扫：`find src -name '*.test.js'` 共 259 个测试文件，`node --test` 总计 **3 009 用例，2 966 通过，43 失败**；
  失败名集合与 `deobf-tools/b85-fails.txt` 基线 `diff` 完全一致（`diff-exit=0`），即本批**零回归**。
  这 43 项全部源于缺失夹具 `tests/testPreviewDom.js`，按护栏不得伪造，留待夹具专项。

## 2. 职责与契约

### 2.1 `createAgentTextConversationRuntime({ sessionStore, assistant, getContext })`

文本对话的总装：拥有 `AbortController` 与运行序号，把第103批的
`createAgentAssistantConversationRuntime` 包成一个面向面板的会话对象。

- 内部态：`controller / seq / runId / closed`；`startRun()` 生成 `'agent-text-' + ++seq`，并立刻
  `sessionStore.setCurrentRun({ id, status: 'planning', stopped: false })`。
- 注入给助手运行时的四件：`createStoppedReply`（固定 `{ok:true,status:'stopped',reply:'已停止生成'}`）、
  `createFailedReply`（`{ok:false,status:'failed',reply:String(msg),...extra}`）、`text(key)`（见 §5.2）、
  `prepareExternalInformation: async () => null`。
- `replyFromMessage(message, meta)` = `assistant({ ...meta, message, context: getContext(), history: meta.history || sessionStore.getHistory() })`。
- 对外 13 个键，顺序固定：`sessionStore, handleUserMessage, stop, getPendingAssistantChoice,
  answerAssistantChoice, reviseAssistantTurn, selectAssistantVersion, listConversations,
  getActiveConversation, startNewConversation, switchConversation, deleteConversation, dispose`。

### 2.2 `createAgentModelRequestRuntime({ sessionStore, projectMemoryStore, getSettings, getLocale, summarizeContext, requestAssistant, requestPlanner })`

模型请求前置管线：每次请求前准备上下文摘要，并把摘要 / 项目记忆 / 设置一并交给请求回调。

- 只暴露 `{ assistant, planner, prepareContextDigest }`。
- `settings = { ...getSettings?.(), ...（getLocale 存在时 { locale: getLocale() }） }`，**每次调用重算**。
- 内部包装第103批的 `createAgentContextDigestRuntime`，其 `summarize` 把 `settings` 透传给 `summarizeContext`。
- `assistant` 与 `planner` 共用 `_0x40ce1c(input, requestFn)`：
  `memory = projectMemoryStore?.getMemory?.() || null` → `digest = await prepare({...input, projectMemory})`
  → `requestFn({...input, contextDigest, projectMemory, settings})`。

### 2.3 `createAgentConversationCapabilityRuntime({ sessionStore, skillRegistry, author, saveSkill, deleteSkill, setSkillEnabled, projectMemoryStore, externalToolRegistry, localeProvider, isActiveRun })`

非创作类意图的能力路由：技能链（第103批门面）优先，项目记忆链兜底，外部信息准备直接代理注册表。

- 只暴露 `{ getPendingSkillConversation, handleCommand, prepareExternalInformation }`。
- `handleCommand({ message, pendingSkillConversation, runId, signal })`
  = `await skillFaçade.handle({message, pending, runId, signal}) || memoryRuntime.handle({message, runId})`。
- 10 个构造参数整体转交技能门面（门面再拆给创作运行时与生命周期运行时）。

## 3. 本批实际执行与未执行的检查

已执行（离线、只读、零费用）：

1. `cmp -s` 仓库件 vs `b104/port/`：3/3 IDENTICAL。
2. `node --check`：6/6（3 源 + 3 测试）。
3. `node --test` 本批三件：44/44。
4. 全仓 `node --test` 复扫：3 009 用例、43 失败，失败集合与基线 `diff` 为空。
5. `b100/verify-exports.mjs`：5/5 具名导出 `ok`。
6. `b95/deps-ast.mjs src/modules/agent`：`port=81`、`OK=16`、`BLK=1`（仅跨目录件 `agentModelControls.js`），
   未落地由 20 件降至 17 件。
7. 护栏复核：`api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`，未被覆盖。
8. 反向检索三件的生产消费者（见 §4）。

未执行（需另行授权，不以静态检查冒充）：

- 未启动桌面端 / 未打开对话面板，因此**没有任何真机 UI 证据**；
- 未调用任何 AI 服务（摘要、规划、回复三处回调全部为测试桩）；
- 未跑构建、未跑 updater、未 push、未触发 release。

## 4. 接入结论：本批仍为零生产消费者

反向检索仓库内 `src/ api/ electron/ web-preview/`：三件的引用者**只有本批新增的测试文件**。

在反混淆镜像中检索三件工厂函数的真实调用点（`index.js` 只是再导出桶文件，不做实例化），结果为：

| 运行时 | 镜像内实例化位置 | 该位置在本仓库的状态 |
| --- | --- | --- |
| `createAgentTextConversationRuntime` | 根 `main.js`、`src/modules/app/storyAgentComposition.js` | `main.js` 为 0.4.12 代（584 行，未引用三件）；`storyAgentComposition.js` **未落地** |
| `createAgentModelRequestRuntime` | 根 `main.js` | 同上，且其三个模型回调 `requestAgentContextDigest / requestAgentAssistantReply / requestAgentActionPlan` 来自 **`api/agentAssistantApi.js`（本仓库不存在，当前只有 `api/agentApi.js`）** |
| `createAgentConversationCapabilityRuntime` | 根 `main.js`、`src/modules/agent/agentRuntime.js` | 两件都在受控装配件清单里 |

也就是说，把三件真正接进 UI 的前置动作是**升级根 `main.js` 与 `agentRuntime.js` 装配段**（并补齐
`api/agentAssistantApi.js`、`src/modules/app/storyAgentComposition.js`）。这些文件属受控清单
（改动需独立批次 + 真机验证 + 运行授权），本批不动它们，也不伪造临时调用点。

`agentModelRequestRuntime` 因此是当前**唯一在纯 JS 层就无法实例化**的一件：不是依赖缺失，
而是它的模型调用方在缺失的 `api/agentAssistantApi.js` 里。按"缺依赖就记账、不造垫片"的规矩，
本批只交付运行时与其测试源码，不补假 API。

宿主将来接线时需要提供的最小输入（由测试反推，勿凭猜测）：

- 文本会话：`sessionStore` 必须实现 `getHistory / getActiveConversation / getCurrentRun / setCurrentRun /
  stopCurrentRun / emitAssistantStream / pushHistory / replaceConversationMessages / isConversationLoaded`
  以及 `getPendingPlan / getPendingLoopRun / getPendingClarification`；
- 模型请求：调用 `assistant()` / `planner()` 时**必须自行带 `history`**，运行时不会去 `getHistory()`；
- 能力路由：待确认态必须用 **`pendingSkillConversation`** 这个键名传入（见 §5.6）。

## 5. 冻结行为与已知怪异（测试已锁定，改动前先看这里）

### 5.1 运行序号只在真正开跑时递增

空白消息、并发拒绝、会话关闭三种早退都不调用 `startRun()`，因此第一条成功消息的 `runId` 仍是 `agent-text-1`。

### 5.2 文本层的 `text(key)` 只映射 3 个键

`runStopped / emptyMessage / plannerFailed` 之外的任何键（含助手运行时用到的 `noPendingClarification`）
全部落到兜底串 `'当前对话已变化，请重新发送'`。后果：修订不可用、待选项缺失等**语义不同的失败在文本会话里显示为同一句话**。

### 5.3 `prepareExternalInformation` 被硬编码为 `async () => null`

文本会话永远不会拉取外部信息，即使能力运行时代理了外部工具仓库。§2.3 的 `prepareExternalInformation`
与这里是两条独立通路，装配层若只接文本会话，外部链接 / 附件读取不会生效。

### 5.4 `handleUserMessage` 丢弃第二个参数

助手运行时的 `answerChoice` 调用 `handleUserMessage(label, { assistantChoice: true })`，
而文本运行时的形参只有 `message`，meta 被整体丢弃。因此选项回答这一轮在模型请求里**看不到 `assistantChoice` 标记**
（测试用 `Object.keys` 顺序锁定了这一点）。

### 5.5 传给模型的历史是活引用

`history: meta.history || sessionStore.getHistory()`：文本会话路径下这是仓库数组本身，
模型回调若在 await 期间被其他消息追加，读到的就是变化后的列表；修订路径（`meta.history`）才是新建数组。

### 5.6 能力路由的待确认态键名是 `pendingSkillConversation`

`handleCommand` 只解构 `pendingSkillConversation`。写成 `pending` 时技能门面拿到 `null`，
于是"删除技能 → 二次输入"会**静默回落到项目记忆链**（记忆链命中就直接写库并回复，未命中才返回 `null`）。
本批用一条专门的测试锁住该行为，接线时务必按 §2.3 的键名传。

### 5.7 `||` 回退只看真值性

技能链返回任何假值（`null` / `undefined`）都会再跑一遍记忆链。当前子运行时命中时必定返回对象，
所以未观察到双回复；但装配层若新增"命中但返回空"的子链，就会出现一次消息两段回复的风险。

### 5.8 摘要批次有硬门槛

`selectAgentContextDigestBatch` 默认 `recentMessageLimit = 12`、`minBatchMessages = 8`，
即 `history.slice(0, len - 12)` 至少 8 条才会摘要 → **不足 20 条消息时永远不触发摘要**，
`contextDigest` 原样沿用旧值。测试用 20 条命中 8 条（覆盖到 `i0..i7`）。

### 5.9 摘要缺依赖时降级而非报错

无活动会话 id → `contextDigest = null`；`summarizeContext` 非函数 → 沿用归一化后的旧摘要且**不回写**；
摘要抛错 → 记 `agent_context_digest_failed` 后退回旧摘要，**模型请求照常发出**。

### 5.10 `stop()` 的 `notice` 只在补丁抛错时出现

文本运行时的 `stop()` 先取助手运行时的停止结果再 `abort()`。无在途请求时助手 `stop()` 返回 `false`；
在途普通请求停止时补丁不抛错，因此返回值只有 `{ok,status,reply}` 三键；
只有在途**修订**且会话内容已变（无可编辑轮）时，补丁阶段抛出
`'对话内容已变化，请重新发送消息'`，`stop()` 才会多出 `notice` 键。

### 5.11 停止后的在途请求以 `stale` 收尾

被停止的那次 `await` 最终返回 `{ok:true, status:'stopped', reply:'已停止生成', assistantHandled:true, stale:true}`，
且**不会**再落一条助手消息（首次停止时已落过 `stopped` 消息）。

### 5.12 `deleteConversation` 只在删当前会话时停止

判定用 `String(id).trim() === getActiveConversation()?.id`：传空串时左侧为 `''`，只有活动会话 id 也为空才停止。
`dispose()` 幂等，二次调用不抛错。

## 6. 台账与下一批口径

- 台账：`docs/implementation-handoff.md` 新增"第一百零四批交付记录"、§6 第104批后更新段、R12 行追加、§7 复选框第104批。
- 快照计数（`git status --porcelain`）：**619 项 = 67 M + 552 ??**（本批 +6：3 源 + 3 测试）。
- 测试文件数：`find src -name '*.test.js'` = **259**（本批 +3）。
- Prettier 目录级 `--check src/modules/agent/*.js` 复扫后仍报 2 件历史文件不合规：
  `agentSkillPackage.js`、`agentSkillPackage.test.js`（早期批次遗留，属逐字节保真件，本批不动）。
- 第105批口径建议：`src/modules/agent` 剩余 16 件 `OK` 中，优先取
  `agentProjectMemoryStore.js`（仅依赖已落地的 `./agentProjectMemory.js`，是 §2.2 记忆仓库的真实实现）、
  `agentSessionEventLog.js`、`agentConversationActions.js` 三件，为装配层升级补齐最后一段拼图；
  `agentModelControls.js` 仍需先移植 `components/aigenText/modelSelector.js` 等 3 件跨目录依赖，继续挂阻塞。
- 受控事项不变：`index.js` / `agentRuntime.js` / `agentPanel.js` 等装配件升级、`api/agentAssistantApi.js` 缺失、
  `src/core/math.js`（62 个消费者）、`rendererVirtualization.js`、`canvasMediaLocalService.js` 均须独立批次 + 真机验证 + 运行授权。
