# 第103批：助手会话运行时与技能/外部信息/上下文摘要运行时

本批属于 R12（Agent 会话与运行时层）移植链条，从 `D:\shuocancas\SHUO Canvas` 0.7.16 的反混淆镜像
`C:\Users\luobote\.qoder\tmp\shuo-deobf\src\modules\agent\` 逐字落地 4 个会话运行时模块，
并为每个模块补可执行测试源码。本批不改动任何既有生产文件，不做 UI 接线（原因见第 4 节）。

## 1. 本批落地清单

| 文件 | 行数 | 字节 | 导出 |
| --- | --- | --- | --- |
| `src/modules/agent/agentContextDigestRuntime.js` | 89 | 3 230 | `createAgentContextDigestRuntime` |
| `src/modules/agent/agentExternalInformationRuntime.js` | 102 | 3 704 | `createAgentExternalInformationRuntime` |
| `src/modules/agent/agentSkillConversationRuntime.js` | 28 | 1 232 | `createAgentSkillConversationRuntime` |
| `src/modules/agent/agentAssistantConversationRuntime.js` | 257 | 9 621 | `createAgentAssistantConversationRuntime` |
| 源码小计 | 476 | 17 787 | 4 |

配套测试源码（本批手写，非移植产物，标题用中文、不参与反混淆字节校验）：

| 测试文件 | 行数 | 字节 | 用例 |
| --- | --- | --- | --- |
| `src/modules/agent/agentContextDigestRuntime.test.js` | 230 | 8 871 | 15 |
| `src/modules/agent/agentExternalInformationRuntime.test.js` | 280 | 11 066 | 14 |
| `src/modules/agent/agentSkillConversationRuntime.test.js` | 155 | 6 274 | 10 |
| `src/modules/agent/agentAssistantConversationRuntime.test.js` | 631 | 23 699 | 26 |
| 测试小计 | 1 296 | 49 910 | 65 |

批次总量：1 772 行 / 67 697 字节（源码 + 测试）。

## 2. 职责与内部契约

### 2.1 `agentContextDigestRuntime.js`

`createAgentContextDigestRuntime({ sessionStore, summarize, recentMessageLimit, minBatchMessages })` → `{ prepare }`。

- `prepare({ history, projectMemory, signal, onTrace })` 先读活动会话 id 与 `getContextDigest() || activeConversation.contextDigest`，
  经 `normalizeAgentContextDigest` 归一。
- 会话 id（`String(id || '')` 去空白后）为空、或 `summarize` 不是函数、或本批无可选中消息时，直接返回归一后的旧摘要（不落库、不广播）。
- 以 `conversationId` 为键在内部 `Map` 中去重并发调用；批次的 `conversationId:coveredThrough:count` 键只在 `finally` 里用于
  判断是否清理该条目。
- 摘要成功后 `attachAgentContextDigestCursor` 附加游标并 `setContextDigest(digest, { conversationId })`；
  轨迹依次为 `agent_context_digest_started` / `agent_context_digest_completed` / `agent_context_digest_failed`（原因截断 240 字符）。

### 2.2 `agentExternalInformationRuntime.js`

`createAgentExternalInformationRuntime({ toolRegistry, sessionStore })` → `{ prepare }`。

- `prepare({ message, documentFiles, signal })` 用 `createAgentExternalInformationRequests` 判定是否需要外部信息，
  不需要则返回 `null`。
- 每条轨迹同时写 `recordTrace` 与 `recordRunEvent`（`commandId` 取 `toolId`，`runId` 取 `getCurrentRun()?.id || ''`）。
- 只有当请求涉及 **多于一个不同 toolId** 时才聚合为 `external-information.batch`；同一消息里的多个 URL 共用 `web.read_url`，
  因此仍上报 `web.read_url`。
- 工具缺失 → `Error('当前运行环境不支持读取该外部信息。')`，`code = 'EXTERNAL_TOOL_UNAVAILABLE'`；
  首个非 `ok === true` 结果 → `Error(result.message || '外部信息读取失败。')`，
  `code = result.errorCode || 'EXTERNAL_INFORMATION_READ_FAILED'`。两者都会先广播失败轨迹再抛出。
- 结果映射为 `{ ...source, sourceId: '<sourceKind>-<序号>', toolId }`，URL 源额外带 `requestedUrl`，
  最后交给 `compactAgentExternalInformationForPrompt` 压缩进提示。

### 2.3 `agentSkillConversationRuntime.js`

28 行的门面，把第 102 批落地的创作链与生命周期链合成会话入口：

- `getPending()` = `lifecycle.getPending() || authoring.getPending()`。
- `handle({ message, pending, runId, signal })`：有挂起项时按 `pending.targetKind === AGENT_SKILL_LIFECYCLE_TARGET_KIND`
  选择 `answer()`；无挂起项时先试生命周期链 `matches()`，再试创作链 `matches()`，都不命中返回 `null`。

### 2.4 `agentAssistantConversationRuntime.js`

`createAgentAssistantConversationRuntime({ sessionStore, replyFromMessage, prepareExternalInformation, startRun, isActiveRun, createStoppedReply, createFailedReply, getSignal, text, handleUserMessage })`
→ `{ getPendingChoice, stop, revise, selectVersion, answerChoice, handle }`（顺序即导出顺序）。

- 内部在飞记录为 `{ runId, conversationId, message, revision, prose, skillIds }`；`handle` 进入时写入并广播
  `{ type: 'start', runId, revision }`，收尾统一经内部收口函数广播 `{ type: 'end', runId, history, discard }`。
- 普通轮次收尾走 `pushHistory(patch)`；修订轮走
  `replaceConversationMessages([...history.slice(0, -2), { ...user, content }, { ...assistant, ...patch, replyVersions }], { conversationId })`，
  并在 `getAgentEditableTurn(history).itemId` 与记录的 `revision.itemId` 不一致时抛 `对话内容已变化，请重新发送消息`。
- 四处“会话/run 已换代”的闸门（外部信息后、回复后、catch 内、`onText`）决定返回
  `{ ...createStoppedReply(), assistantHandled: true, stale: true }`；`onText` 用的是 `isConversationLoaded() ?? 同 run 判定`。
- `revise` / `selectVersion` / `answerChoice` 共用“可编辑轮”守卫（在飞、有待执行计划、有待跑循环、有待澄清都会短路）。

## 3. 验证记录（全部离线执行，未运行桌面端、未调用任何 AI 服务）

- 逐字校验：4 个源码与 `C:\Users\luobote\.qoder\tmp\deobf-tools\b103\port\` 下的暂存副本 `cmp` 结果 4/4 IDENTICAL。
- 语法：`node --check` 对 4 个源码 + 4 个测试文件全部通过。
- 具名导入闸门：`node b100/verify-exports.mjs`（4 文件）→ 18/18 全部 `ok`，无 `MISSING`、无 `DEP-FAIL`。
- 依赖审计：`node b95/deps-ast.mjs src/modules/agent` → `port=81 / LEAF=0 / OK=19 / BLK=1`（落 b103/audit2.txt）。
  对比第 102 批的 `OK=20 / BLK=4`：本批把 3 个卡口件（上下文摘要、外部信息、技能会话门面）与其唯一消费方向前推进，
  `src/modules/agent` 未落地文件由 24 降至 20，唯一剩余阻塞为 `agentModelControls.js`。
- 单文件测试：`agentContextDigestRuntime.test.js` 15/15、`agentExternalInformationRuntime.test.js` 14/14、
  `agentSkillConversationRuntime.test.js` 10/10、`agentAssistantConversationRuntime.test.js` 26/26。
  其中摘要运行时首轮 10/15、外部信息运行时首轮多轮修正、门面首轮 6/10、助手运行时首轮 20/26，
  **全部差异都是测试侧预期写错，未改动任何移植源码**（按字节保真要求，端口源码缺陷只做记录）。
- 全量回归：`find src -name '*.test.js' | xargs node --test --test-timeout=25000 --test-reporter=tap`
  → `# tests 2965 / # pass 2922 / # fail 43`（第 102 批后为 2 900 / 2 857 / 43，本批净增 65 条用例全部通过）。
  失败名集合与基线 `deobf-tools/b85-fails.txt` 逐行 `diff` → `diff-exit=0`，43 项基线未变
  （根因仍是缺失夹具 `tests/testPreviewDom.js`，按护栏不得伪造）。
- 格式化：4 个测试文件 `prettier --write` 后 `--check` 全绿；源码为移植件，保持与暂存副本一致。
- 工作区安全：`api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`（未被批量覆盖）；
  `git status --porcelain` 为 **613** 项（67 修改 / 546 未跟踪）：本批新增 4 源码 + 4 测试 + 1 专题文档 = 9 项。
- 未执行：真实启动桌面端、渲染面板交互、模型调用、发布/推送。本批不做任何“运行期已验证”的声明。

## 4. 接入状态：零生产引用，本批不接线

反向检索（`grep -rl <模块名> --include='*.js' --include='*.html' --include='*.py'`，排除 `node_modules`）结果：
4 个新模块除自身测试文件外**无任何引用者**。它们在 0.7.16 中的消费方仍停留在未落地清单里：

- `agentTextConversationRuntime.js` → 依赖 `./agentAssistantConversationRuntime.js`
- `agentModelRequestRuntime.js` → 依赖 `./agentContextDigestRuntime.js`
- `agentConversationCapabilityRuntime.js` → 依赖 `./agentExternalInformationRuntime.js` + `./agentSkillConversationRuntime.js`

这三者依赖均已在库中（审计为 `OK`），因此下一批落地它们即可把本批 4 个运行时纳入真实调用链。
在此之前按护栏“宁可留白并记账，也不为了有引用而擅自接线”，不改 `agentRuntime.js` / `agentPanel.js` 等在用装配件。

宿主注入要求（接线时必须齐备，否则运行时会抛 TypeError）：
`agentAssistantConversationRuntime` 的 10 个构造项中，`sessionStore`、`replyFromMessage`、`prepareExternalInformation`、
`createStoppedReply`、`createFailedReply`、`text`、`handleUserMessage` 均为必需；缺 `sessionStore` 时连 `getPendingChoice()`
都会抛 `TypeError`（源码用 `_0x3860ff['getHistory']` 直接取属性，只有 `stop()` 在无在飞任务时不触碰宿主对象）。

## 5. 冻结的既有行为（本批只做测试固化，不修）

1. **摘要运行时的并发去重只按会话 id**：同一会话在飞行中时，携带不同批次的第二次 `prepare` 会拿到同一个 promise，
   计算出的批次键仅用于 `finally` 的清理判断。
2. **摘要失败静默回退**：`summarize` 抛错时只广播 `agent_context_digest_failed` 并返回旧摘要；
   而 `summarize` 返回不可解析内容时 `attachAgentContextDigestCursor` 仍会产出一条“空分节”摘要并**覆盖**旧摘要后广播 completed。
3. **外部信息映射丢弃 `sourceKind`**：结果项只保留 `sourceId = <sourceKind>-<序号>`，文档源与 URL 源在压缩阶段
   共用 URL 语义，缺 `finalUrl` 的文档源会被静默丢弃。
4. **`toolId` 聚合条件**：只有跨工具才出现 `external-information.batch`，多 URL 单工具不上报聚合名。
5. **技能门面静默失效**：创作链 `matches()` 前置 `isAvailable()`（`author` 与 `saveSkill` 都必须是函数），
   缺任一依赖时门面直接返回 `null`，不会给出 `SKILL_AUTHORING_UNAVAILABLE` 之类的用户可见文案。
6. **门面裸构造仍会接管停用意图**：`createAgentSkillConversationRuntime()` 无参时，`'停用技能'` 仍进入生命周期链并返回
   `need_clarification`（`$skill-id` 提示文案），其余消息返回 `null`。
7. **`stop()` 返回形状不对称**：无在飞任务返回布尔 `false`，有在飞任务返回 `{ error }`。
8. **stale 分支不清理在飞记录**：外部信息/回复阶段发生会话或 run 换代时直接返回 stale，既不广播 `end` 也不清空内部记录，
   于是随后的 `stop()` 仍会返回 `{ error: null }` 并补一条 `discard: true` 的 `end`。
9. **成功轮与失败轮的 `skillIds` 来源不同**：成功补丁取模型回复自带的 `selectedSkillIds` 且**原样入库**（不截断、不去非法值），
   非法值只在 `getPendingChoice()` 读取时经 `normalizeAgentAssistantContext` 归一；停止/失败补丁取 `onSkillsSelected` 累计值。
10. **修订轮失败且无正文时不落历史**：`revision` 存在且 `prose` 为空时补丁为 `null`，历史保持原样并以 `discard: true` 收尾。
11. **`questionId` 可退化为 `undefined:1:0`**：由 `itemId || turnId || '<ts>:<history长度>'` 与 `replyVersions.activeIndex` 拼接，
    宿主未写 `itemId` 时出现字面量 `undefined`。
12. **`handle` 第二参数必填**：`meta` 缺省会在 `try` 之前抛 `TypeError`（读 `meta['revision']`）。

## 6. 台账与下一步

- `docs/implementation-handoff.md`：新增第103批交付记录、`**（第103批后更新）**` 状态段、R12 行更新、
  第 7 节追加 `- [ ] 第103批（…）`。
- `docs/next-session-prompt.md`：续接指针更新为 b104。
- 下一批（b104）建议：落地 `agentTextConversationRuntime.js`、`agentModelRequestRuntime.js`、
  `agentConversationCapabilityRuntime.js`，使本批 4 个运行时首次进入真实调用链；若其依赖出现缺失则按 BLK 记账不伪造垫片。
- 仍未覆盖的 gated 项不变：agent 装配件升级、`agentConversationPresentation.js`、`agentModelControls.js`、
  `api/agentAssistantApi.js`、`src/core/math.js`（R09 唯一阻塞）、`rendererVirtualization.js`、`canvasMediaLocalService.js`、
  `main.js` 外壳终装配、后端 spawn 切换。全部 20 个未落地的 `src/modules/agent` 文件清单见 `b103/audit2.txt`。
- i18n 待办（需授权）：本批 4 个模块含大量硬编码中文文案（外部信息失败提示、技能停用追问、会话变更提示、
  助手停止/失败文案），落地时保持字节保真，未新增 `src/i18n/messages/*` 键。
