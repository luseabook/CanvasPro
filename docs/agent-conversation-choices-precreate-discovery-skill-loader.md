# 第107批：会话选项渲染 · 画布搬运运行时 · 能力发现命令 · 预创建节点 · 技能装载（R12）

本批继续缩小 `src/modules/agent` 与 0.7.16 版本（`D:\shuocancas\SHUO Canvas`，只读镜像）之间的可维护源码差距。
选取标准沿用第106批 §6 口径：从依赖审计里"依赖全部已落地"的 OK 池中取浅链、可离线测试的模块。
因目标轮次预算收紧，本批把 20 948 B 的 `agentActionPostconditions.js` 与 16 035 B 的 `agentConversationPresentation.js`
留给专批，只落 5 件，但 5 件的源码保真、测试、文档、台账全部闭环。

## 1. 落地清单

### 1.1 移植源码（逐字保真，仅做 Prettier 排版，未修任何端口缺陷）

| 文件 | 行数 | 字节 | 导出 | 直接依赖 |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentConversationChoices.js` | 49 | 1 872 | 1（`renderAgentConversationChoices`） | `./agentPanelElements.js :: createAgentElement` |
| `src/modules/agent/agentConversationCanvasTransferRuntime.js` | 95 | 3 647 | 1（`createAgentConversationCanvasTransferRuntime`） | `./agentConversationCanvasTransfer.js :: resolveAgentConversationCanvasTransfer` |
| `src/modules/agent/agentDiscoveryCommands.js` | 86 | 3 278 | 2（`AGENT_DISCOVERY_COMMAND_IDS`、`registerAgentDiscoveryCommands`） | `./agentCapabilityDiscovery.js`（3 个符号） |
| `src/modules/agent/agentPrecreatedNode.js` | 110 | 5 292 | 4（归一化 / 类型推导 / 消费判定 / 运行时工厂） | `./agentCompletionEvidence.js :: deriveRequestedCreatedNodeType` |
| `src/modules/agent/agentSkillLoader.js` | 83 | 3 962 | 5（技能清单刷新、打开目录、文件夹导入、受管保存、删除） | `../../services/desktopBridge.js :: desktopBridge` |
| 合计 | 423 | 18 051 | 13 | — |

保真与语法核验：`cmp` 对 5 件与 `b107/port/` 暂存副本 **5/5 IDENTICAL**；落地后 `node --check` **5/5** 通过。
命名导入前置核验 `b100/verify-exports.mjs`：**7/7 ok**，无 `MISSING`、无 `DEP-FAIL`。

### 1.2 测试源码（本项目自研，非移植件，可读命名 + 中文用例标题）

| 测试文件 | 行数 | 字节 | 用例 |
| --- | --- | --- | --- |
| `agentConversationChoices.test.js` | 267 | 9 548 | 14 |
| `agentConversationCanvasTransferRuntime.test.js` | 256 | 10 813 | 16 |
| `agentDiscoveryCommands.test.js` | 187 | 7 816 | 11 |
| `agentPrecreatedNode.test.js` | 301 | 12 874 | 21 |
| `agentSkillLoader.test.js` | 296 | 11 843 | 16 |
| 合计 | 1 307 | 52 894 | 78 |

`node --test` 五件单跑：**78 tests / 78 pass / 0 fail**。
全量 sweep（`find src -name '*.test.js'`）：**3 219 tests / 3 176 pass / 43 fail**，
失败名单与第85批基线 `b85-fails.txt` 比对 `diff-exit=0`（43 项全部来自缺失夹具 `tests/testPreviewDom.js`，非本批引入）。
测试文件计数：`src/modules/agent` 59 → **64** 个测试文件、用例 **924**；全仓 **271** 个测试文件、用例 **2 441**。
依赖审计 `b95/deps-ast.mjs src/modules/agent`：`port=81 / LEAF=0 / OK=4 / BLK=1`，未落地数 **10 → 5**。

## 2. 端口契约

### 2.1 `renderAgentConversationChoices(container, pending, runtime, applyResult, setBusy, hooks)`

- 每次调用先 `container.replaceChildren()`，再按 `Array.isArray(pending.options)` 渲染 `button.agent-option-btn`；
  选项数为 0 时容器整体 `hidden = true`（不清空旧节点之外的任何状态）。
- 点击链路固定顺序：`onAnswer(答案文案)` → `container.hidden = true` → `setBusy(true)` → `onWaitingStart()` →
  `await runtime.……` → `applyResult(结果)` → `onWaitingEnd(占位节点)` → 条件 `setBusy(false)`。
- 答案文案 = `String(option.label || option.id || '').trim()`；传给 runtime 的永远是原始 `option.id`。
- 通道分叉：`pending.responseChannel === 'assistant.message'` 时调用
  `runtime.answerAssistantChoice(id, { questionId })`，否则
  `runtime.answerClarification(id, { displayAnswer })`。
- 异常统一转成 `{ ok:false, status:'failed', reply: error?.message || 'Agent clarification failed.' }`。

### 2.2 `createAgentConversationCanvasTransferRuntime(ports) -> { handle }`

`handle(message, turnId)` 三步：解析搬运意图 → 记录 `agent_turn_routed` trace → 分通道执行。

| 目标 | 前置 | 动作 | 执行入口 | 成功文案 |
| --- | --- | --- | --- | --- |
| `selected_prompt` + `replace` | 恰好 1 个选中节点 | `node.setPrompt {nodeId,text}` | `handlePlan(plan, meta)` | `promptTransferCompleted` |
| `selected_prompt` + `append` | 恰好 1 个选中节点 | `node.appendPrompt {nodeId,text}` | `handlePlan(plan, meta)` | `promptTransferCompleted` |
| 文本节点（`nodeType: 'ai-text'`） | 无选中要求 | `node.create {type,prompt}` | `executeActions(actions, opts)` | `textPlacedOnCanvas` |

`handlePlan` 的 `meta` 固定为 `{agentContext: {}, userMessage, turnId, confirmationReply, completionReply}`；
`executeActions` 的 `opts` 固定为 `{commandContext, ...buildExecutionGuard(turnId)}`。
所有出口都带 `responseChannel: 'canvas.tool'`，且 `message` 与 `reply` 同源。

### 2.3 `registerAgentDiscoveryCommands(registry)`

| 命令 id | 必填参数 | limit | execute 转发 |
| --- | --- | --- | --- |
| `agent.capabilities.search` | `query` | 1–12，默认 6 | `searchAgentCommands({commandRegistry: registry, ...args})` |
| `agent.command.describe` | `commandId` | — | `describeAgentCommand({commandRegistry: registry, ...args})` |
| `agent.models.search` | 无 | 1–12，默认 6 | `searchAgentModels(args)`（不注入注册表） |

三者的 `riskLevel` 均为 `safe`，并共享同一个 `Object.freeze({reads:['agent.capabilityCatalog'],writes:[]})` 实例。

### 2.4 `agentPrecreatedNode`

- `deriveAgentPrecreatedNodeType` 复用完成证据侧的类型规则，但把 `includeGenerateVerb` 硬编码为 `true`。
- 抑制条件（返回 `''`）：`EXISTING_TARGET_PATTERN` 命中且未命中 `EXPLICIT_NEW_TARGET_PATTERN`，
  且当前已选中同类型节点；或未命中显式新建动词且（选中同类型 / 存在名称≥2 字且出现在句中的同类型节点）。
- `reserve(run)`：推导成功 → `node.create`（带 `precreateReservation: true`）→ 校验 `ok === true` 且
  `createdNodeIds[0]` → 补发 `node.select` 复原选中集 → `setPendingLoopRun({...run, pendingKind:'interrupted'})`
  → `markUnfinishedOperation(originalMessage)` → `agent_precreated_node_ready` trace；返回带 `precreatedNode` 的新对象。

### 2.5 `agentSkillLoader`

5 个入口共享同一降级判定 `bridge?.agentSkills?.isAvailable() !== true`，但只有 4 个校验 registry：

| 入口 | 不可用时 | 成功链路 | 刷新失败时 |
| --- | --- | --- | --- |
| `refreshInstalledAgentSkills` | `{available:false,loaded:0,rootPath:'',diagnostics:[]}` | `registry.replaceInstalledPackages(packages, payload)` | 回退 `registry.getState()` + `SKILL_DISCOVERY_FAILED` |
| `openInstalledAgentSkillsRoot` | `SKILL_FOLDER_OPEN_UNAVAILABLE`（不校验 registry） | 直通 `agentSkills.openRoot()` | — |
| `installAgentSkillFromFolder` | `SKILL_IMPORT_UNAVAILABLE` | `{...bridgeResult, loaded}` | `success:false` + `SKILL_REFRESH_AFTER_INSTALL_FAILED` |
| `saveManagedAgentSkill` | `SKILL_SAVE_UNAVAILABLE` | `{...bridgeResult, loaded}` | `SKILL_REFRESH_AFTER_SAVE_FAILED` |
| `deleteInstalledAgentSkill` | `SKILL_DELETE_UNAVAILABLE` | `{...bridgeResult, loaded}` | `SKILL_REFRESH_AFTER_DELETE_FAILED` |

`definition` / `request` 缺省时分别以 `{}` 传给 `saveManaged` / `deleteInstalled`。

## 3. 本批实际执行的检查与未执行的检查

已执行（全部离线、零外部依赖、零网络、零费用）：

1. 5 件源码 `cmp` 字节比对（仓库 vs 暂存副本）：5/5 IDENTICAL。
2. 5 件源码 `node --check`：5/5 通过。
3. `b100/verify-exports.mjs` 命名导入前置核验：7/7 `ok`。
4. `b95/deps-ast.mjs src/modules/agent` 依赖审计：`port=81 / LEAF=0 / OK=4 / BLK=1`。
5. 5 个新测试套件单跑：78/78 通过。
6. 全仓 sweep：3 219 tests / 3 176 pass / 43 fail，失败名单与 `b85-fails.txt` `diff-exit=0`。
7. 5 个测试文件 Prettier `--check`：全部符合代码风格。
8. `git status --porcelain` 快照：646 项（67 M / 579 ??），较第106批 +10（本批 5 源码 + 5 测试）。
9. 保护文件核验：`api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`（未被覆盖）。
10. 消费方核验：5 件在本仓 `src` / `api` / `electron` / `main.js` 中零引用。

未执行（受授权与真实环境门槛限制，不以静态检查冒充）：

- 未启动 Electron / 浏览器，未真实渲染 Agent 面板、选项按钮或搬运结果上画布。
- 未调用任何真实 AI 服务、未执行 `node.create` / `node.setPrompt` 等真实画布命令。
- 未访问真实技能目录（`agentSkills` 桌面桥全部为假对象桩），未验证磁盘扫描与导入/删除副作用。
- 未做 i18n 文案落库核验（见 §5 中硬编码英文与 `text()` 兜底项）。
- 未跑 npm 构建 / 打包 / 安装程序。

## 4. 接线结论：5 件全部保持零消费方，本批不接线

在 0.7.16 镜像里，这 5 件的生产消费方是：

| 新落地件 | 镜像消费方 | 本仓该消费方现状 |
| --- | --- | --- |
| `agentConversationChoices.js` | `agentPanel.js` | 已存在但是 0.4.12 代际（63 143 B vs 镜像 90 025 B），在用受保护装配件 |
| `agentConversationCanvasTransferRuntime.js` | `agentRuntime.js` | 已存在 0.4.12 代际（32 912 B vs 75 170 B），在用受保护 |
| `agentDiscoveryCommands.js` | `agentRuntime.js`、`index.js` | 同上；`index.js` 767 B vs 4 291 B |
| `agentPrecreatedNode.js` | `agentActionExecutor.js`、`agentRuntime.js` | `agentActionExecutor.js` 1 120 B vs 7 465 B |
| `agentSkillLoader.js` | `index.js` | 同 `index.js`；且其上游 `agentSkillCatalog.js` 仍是本仓 102 行硬编码目录（第106批 §4 已记账），注册表尚不能生效 |

结论与红线一致：**不接线、不改装在用装配件、不为"有引用"伪造消费方**。
这 5 件的可维护源码 + 契约测试已就位，真正生效要等各自装配件（`agentPanel.js` / `agentRuntime.js` /
`src/modules/agent/index.js` / `agentActionExecutor.js`）的升级专批——每一项都需要单独批次、真机验证与运行授权。

## 5. 端口冻结行为清单（只记录，不修）

以下行为由本批用例逐条钉住，源码保持与镜像一致：

1. **选项忙碌闸门整次渲染共享**：局部 `busy` 标志声明在选项循环之外，因此点完第一个按钮后，
   其余按钮的点击（含 `onAnswer` 回调）一并被吞掉。
2. **`label` 只做真值判断**：`label: '   '` 被视为有效值，`trim` 后答案文案变成空串并原样回传 runtime。
3. **占位节点未落 DOM 时忙碌态永不复位**：`const attached = !waiting || Boolean(waiting.parentNode)`，
   未挂载时 `setBusy(false)` 被跳过，`onWaitingEnd` 仍被调用——同一族 UI 泄漏（与第105批记录同型）。
4. **失败兜底文案硬编码英文** `'Agent clarification failed.'`，未走 `text()`/i18n。
5. **搬运解析器在无可用历史时抛 TypeError**：`resolveSourceEntry` 取 `[].at(-1) || null` 后把 `null`
   交给会 `.content` 解引用的 `getAssistantText`。因此 `text('textSourceMissing')` 分支与
   `agent_turn_routed` trace 在该路径不可达，`handle()` 直接以异常退出。
6. **两条搬运通道护栏不对称**：提示词通道走 `handlePlan`（含确认语），文本通道走 `executeActions`（无确认），
   二者对同一句话的护栏强度不同。
7. **提示词搬运要求"恰好一个"选中节点**：0 个与 ≥2 个都被拒（先去空白、去重再计数），拒绝时 `ok` 仍为 `true`、
   `status` 为 `chat`。
8. **文本通道失败文案优先取 `execution.message`**：该值可能是底层原始错误串，会直接呈现给用户。
9. **`agent.models.search` 的 `execute` 不转发 `commandRegistry`**，与另两个发现命令的转发形态不一致。
10. **注册幂等靠调用方**：`register` 前逐个 `has(id)` 守卫；注册表缺 `register` 或 `has` 时静默返回原对象（含 `null`）。
11. **预创建类型推导比完成证据侧更宽松**：`includeGenerateVerb` 在 `derive` 内部硬编码为 `true`，
    "生成图片"这类无显式新建动词的说法也算创建请求。
12. **抑制条件依赖中文/英文双份正则**：`重新生成 / 当前节点 / regenerate / this image` 命中"已有目标"，
    句中同时出现"新建一张"时抑制失效。
13. **节点名命中要求 ≥2 字**：单字名（如"图"）永不参与已有目标判定。
14. **`reserve` 用严格 `ok !== true` 判定失败**：`ok: 1` 也按失败；缺 `createdNodeIds` 或首个 id 为空白同样失败。
15. **只取 `createdNodeIds[0]`**：一次创建多个节点时其余 id 不进入 `precreatedNode`。
16. **恢复选中集的 `node.select` 不带 `precreateReservation`**，且发生在写入 `precreatedNode` 之前；
    选中集为空时该补发被跳过。
17. **`isAvailable` 严格 `!== true`**：返回 `1`/truthy 值都按不可用降级。
18. **`openInstalledAgentSkillsRoot` 不校验 registry**，与其余 4 个入口的 `TypeError` 前置校验不一致。
19. **刷新失败会把落盘成功的结果改写为 `success:false`**（`SKILL_REFRESH_AFTER_*_FAILED`），
    同时保留 bridge 原字段（如 `skillId`），但丢掉 `loaded`。
20. **诊断文案截断 300 字符**；`throw new Error('')` 经字符串化后 message 变成 `'Error'`。
21. **离线/无 `window` 环境全部走降级哨兵**：默认 `desktopBridge` 判定不可用，四个写入口直接返回
    `SKILL_*_UNAVAILABLE`，不会触碰磁盘。

## 6. 台账口径与下一批

- 本批交付：5 件移植源码（423 行 / 18 051 字节 / 13 导出）+ 5 件测试（1 307 行 / 52 894 字节 / 78 用例）+ 本专题文档。
- `docs/implementation-handoff.md`：§6 追加"第107批后更新"段、§7 追加第107批待办项、R12 行追加本批文件、
  文末追加"第一百零七批交付记录"；快照计数 636 → 646（67 M / 579 ??）。
- **第108批口径**：`src/modules/agent` 未落地数 5，其中 OK 池 4 件——
  `agentExternalToolRegistry.js`（6 180 B）、`agentComposerAttachmentController.js`（4 206 B）、
  `agentConversationPresentation.js`（16 035 B，依赖 7 个模块）、
  `agentActionPostconditions.js`（20 948 B，依赖 `../canvasCommands/index.js`）；
  BLK 1 件——`agentModelControls.js`（2 342 B，缺 `modelSelector.js` / `runtimeModelParameterControls.js` /
  `modelGenerationParamMemory.js`，需先补依赖再落地，禁止伪造 shim）。
  建议第108批取前两件（约 10 KB）成一组，`agentConversationPresentation.js` 与 `agentActionPostconditions.js`
  各占一个专批（依赖面广、需要更多用例覆盖）。
