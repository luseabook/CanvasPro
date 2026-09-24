# 第 109 批 · R12 动作后置条件引擎（`agentActionPostconditions.js`）

> 本批是 `src/modules/agent` 的**专批**（单件、体量最大），来源为 0.7.16 安装版反混淆端口，逐字保真落地。
> 结论先说：**本批不构成任何用户可见行为完成**。该件在生产代码里**零引用**，未接线、未改装配件、未启动应用、未做真机验收。

## 1. 落地清单与核验计数

| 项 | 值 |
| --- | --- |
| 源码 | `src/modules/agent/agentActionPostconditions.js` **642 行 / 29 119 B / 4 具名导出** |
| 端口原样 | `C:/Users/luobote/.qoder/tmp/shuo-deobf/src/modules/agent/agentActionPostconditions.js` 20 948 B（排版前） |
| 本批暂存 | `C:/Users/luobote/.qoder/tmp/deobf-tools/b109/port/agentActionPostconditions.js` |
| 测试 | `src/modules/agent/agentActionPostconditions.test.js` **835 行 / 31 930 B / 34 例**（本项目自研，非移植件） |
| `cmp` 仓库 vs 暂存 | **1/1 IDENTICAL**（落地后逐字节复核） |
| `node --check` | 源码 + 测试 **2/2 ok** |
| `prettier --check` | 本批 2/2 通过（仓库侧仍只命中基线已知未格式化两件 `agentSkillPackage.js`/`agentSkillPackage.test.js`，本批未触碰） |
| 落地前门禁 `b100/verify-exports.mjs` | 具名导入 **1/1 ok**：`../canvasCommands/index.js :: executeCanvasCommand`（零 `MISSING`、零 `DEP-FAIL`） |
| 本批 `node --test` 单跑 | **34/34 全绿**（prettier 写盘后复跑） |
| 全量 sweep `find src -name '*.test.js'` | **3 292 tests / 3 249 pass / 43 fail**（第108批 3 258/3 215/43 ⇒ 恰好 **+34/+34/±0**）；失败名单与 `b85-fails.txt` **`diff-exit=0`**，43 项全部仍归属缺失夹具 `tests/testPreviewDom.js`，**未伪造该夹具**。产物 `b109/src.tap`、`b109-fails.txt` |
| 依赖闭包 `b95/deps-ast.mjs src/modules/agent` | 由第108批 `port=81 / LEAF=0 / OK=2 / BLK=1`（未落地 3）变为 **`port=81 / LEAF=0 / OK=1 / BLK=1`（未落地 2）** |
| 测试文件计数 | `src/modules/agent` **66 → 67** 件；全仓 **273 → 274** 件 |
| 快照 `git status --porcelain` | **0 新增修改 / 67 M / 587 ??**（本批源码+测试落盘后实测，较第107批记录的 580 为 +7 = 第108批 2 源码 + 2 测试 + 1 文档 + 本批 1 源码 + 1 测试，逐一相符；本专题文档落盘后为 **588 ??**） |
| 保护文件 | `api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`，本批未覆盖、未提交、未推送、未触发构建或发布 |

四个具名导出：`getAgentActionPostconditionPolicy`（策略查表）、`verifyAgentActionPostcondition`（纯校验）、`createAgentActionPostconditionHandler`（校验 + 一次自动重放）、`AGENT_AUTO_REPAIRABLE_COMMANDS`（冻结数组）。

## 2. 契约

### 2.1 三张策略表（模块级常量，冻结）

- `STORE_VERIFIED_COMMANDS` **41 项** → 策略 `store`：必须读画布状态核验。
- `RESULT_VERIFIED_COMMANDS` **5 项**（`clipboard.copy`、`node.exportSelected`、`task.focusResult`、`viewport.fitAll`、`viewport.focusNodes`）→ 策略 `result`：只看响应 `result` 的自证字段，不碰画布。
- `AUTO_REPAIRABLE_COMMANDS` **16 项**（`graph.connect`、`graph.disconnect`、`layout.align/arrangeColumn/arrangeGrid/arrangeRow/distribute/moveNearNode`、`media.resetSize`、`node.changeModel`、`node.rename`、`node.select`、`node.setInputSlot`、`node.setModel`、`node.setParams`、`node.setPrompt`）→ 处理器允许**重放一次**的白名单，测试断言其为 `STORE_VERIFIED_COMMANDS` 的真子集。
- `getAgentActionPostconditionPolicy(id)`：`normalizeId` 后依次查 store / result，否则 `unclassified`。**不做大小写归一**。
- 生成状态集合：`TERMINAL_GENERATION_STATUSES` = {completed, complete, success, succeeded}；`ACCEPTED_GENERATION_STATUSES` = 终态 ∪ {submitted, pending, queued, running, processing}（`failed` 不在任一集合，另走特例）。

### 2.2 画布状态读取与比较原语

- `readCanvasState(ctx)`：`ctx.store || ctx.graphStore`，再 `getStateRaw?.() ?? getState?.() ?? null`。二者皆无 → `null`。
- `normalizeId(v)` = `String(v || '').trim()`（**只 trim，不小写化**）。
- `uniqueIds(list)` = 映射 `normalizeId` → 滤假值 → `Set` → 数组（**丢弃空串 id**）。
- `valuesEqual(a, b)`：先 `Object.is`，再对对象/数组做递归比较（键集合排序后逐个递归）。注意 `Object.is(NaN, NaN)` 为真、`Object.is(0, -0)` 为假。
- `sameIds(a, b)`：双方 `uniqueIds` 后 `sort()` 再比较 ⇒ **顺序与重复均不敏感**。

### 2.3 `verifyAgentActionPostcondition({commandId, args, response, commandContext})`

返回值恒为 `{ok, commandId, status | reason, ...}`，末段统一补 `commandId` 与 `status: res.status || 'verified'`（失败时 `status:'failed'`）。分支顺序：

1. `response.ok !== true` → `{ok:true, commandId, status:'not_run'}`（**非成功响应不产生失败**）。
2. `commandId` 缺省时回落 `response.commandId`；策略由该 id 决定。
3. 策略 `result` → `verifyResultContract`：
   - `viewport.focusNodes`/`viewport.fitAll`/`task.focusResult`：`focused === true` **且** `ids||nodeIds` 去重后非空，否则 `viewport_effect_not_acknowledged`。
   - `clipboard.copy`：`Math.max(0, Math.trunc(Number(nodeCount) || 0))` 必须**等于** `ids` 去重后的长度，否则 `clipboard_result_mismatch`。
   - `node.exportSelected`：`success === true` 且 `exportedCount`（同上截断取正）>0 且 `path||outputPath` 非空，否则 `export_result_unverified`。
   - 其余 id → `postcondition_policy_missing`。
4. `readCanvasState`：无状态时，`store` 策略 → `state_unavailable` 失败；`unclassified` → `{ok:true, status:'not_applicable'}`。
5. 有状态 → 约 20 层嵌套分派（下表）。`nodes`/`edges` 缺省为 `{}`，`selectedNodeIds` 非数组时按 `[]`。

| 命令 | 核验函数 | 关键判据 | 失败 reason |
| --- | --- | --- | --- |
| `node.create` / `node.createConnected` / `node.duplicate` / `collage.createFromSelection` / `storyboard.createFromImages` / `storyboard.createGridFromNode` | `verifyNodeCreation` | `result` 的 `nodeId`∪`node.id`∪`nodeIds`∪`ids` 去重后**全部**存在于 `state.nodes` | `missing_result_node_ids` / `nodes_not_committed` |
| ↑ `node.duplicate` 追加 | 同上 | `|result.sourceIds ∪ args.ids ∪ args.nodeId| × copies` 必须等于新建 id 数 | `duplicate_count_mismatch` |
| ↑ `node.createConnected` 追加 | `verifyEdge` | 边存在 + 字段字符串比较 | `edge_not_committed` / `edge_state_mismatch` |
| `audio.separate` / `image.splitGrid` / `video.extractKeyframes` / `video.reverse` / `video.separateAv` | `verifyNodeIds` | `result.nodeIds` 全部落库 | 同上两型 |
| `node.select` | `verifySelection` | 期望集与 `selectedNodeIds` 去重排序后全等（期望为空即失败） | `selection_state_mismatch` |
| `node.group` | `verifyGroup` | 组节点存在 + `type==='group'` + 每个 `ids` 子节点 `parentId` 等于组 id + 选中集恰为 `{groupId}` | `group_state_mismatch` / `selection_state_mismatch` |
| `node.ungroup` | `verifyUngroup` | `groupIds` 非空且全部**已从 store 消失**；`childIds` 存在且 `parentId` 不再属于被拆组 | `ungroup_state_mismatch` |
| `clipboard.paste` | `verifyPastedGraph` | `result.nodeIds||ids` 落库 + `result.edgeIds` 落库 + 选中集全等于粘贴节点 | `edges_not_committed` / `selection_state_mismatch` |
| `node.setPrompt` / `node.appendPrompt` | `verifyPrompt` | `String(node.prompt||'') === String(result.prompt||'')` | `prompt_state_mismatch` |
| `node.setModel` / `node.changeModel` | `verifyModel` | `node.model` === `result.modelId||result.model`；`result.provider` 存在时比 provider；`result.params` 存在时递归比 `node.generationParams` | `model_state_mismatch` / `provider_state_mismatch` / `model_params_state_mismatch` |
| `node.setParams` | `verifyParams` | **只比对 `result.params` 出现的键**，逐键递归 | `params_state_mismatch` |
| `graph.connect` | `verifyEdge`（`result.edge \|\| {id:result.edgeId}`） | 边存在 + `sourceId/targetId/refSlot/type` 四字段（仅当期望值非 `null/undefined`） | `edge_not_committed` / `edge_state_mismatch` |
| `node.setInputSlot` | `verifyEdge`（额外带 `refSlot`） | 同上 | 同上 |
| `graph.disconnect` | 内联 | `result.edgeIds` 去重后**全部消失**（空列表即通过） | `edges_not_removed` |
| `node.delete` | 内联 | `ids` 非空且**全部消失** | `nodes_not_removed` |
| `node.rename` | 内联 | `result.renamed` 优先；否则由 `ids`（或 `nodeId`）与 `name`/`names[i]` 配对，逐节点 `String(name)` 全等 | `node_name_mismatch` |
| `layout.*` | `verifyLayout` | `result.ids\|\|movedIds` 落库；`result.positions` 存在时按 `1e-6` 容差比 `x/y` | `layout_position_mismatch` |
| `generation.run` / `generation.runBatch` | `verifyGeneration` | batch 走 `result.results`（逐条），单条走 `[result]` | `generation_results_missing` + 条目 reason |
| `task.retry` | `verifyGenerationEntry` | 单条 | `generation_status_unverified` / `generation_task_not_bound` / `nodes_not_committed` |
| `generation.cancel` / `generation.resume` | `verifyNodeIds` | `result.nodeId` 落库 | `nodes_not_committed` |
| `scene.*`（4 项） | `verifyNodeIds` | `result.nodeId` 落库 | 同上 |
| `media.resetSize` | 内联 | 节点落库 + **仅 `result.sizes` 出现过的节点**比 `Number(width)/Number(height)` | `node_size_mismatch` |
| 其余 `store` 未匹配 id | 末端 | — | `postcondition_policy_missing`（见 §3 探针） |

`verifyGenerationEntry` 三态：①`status` 与 `taskId` 都为空 → `{ok:true, status:'legacy_contract'}`；②`status` 不在接受集合且非 `failed` → `generation_status_unverified`；③无 `taskId` 且非终态且非 `failed` → `generation_task_not_bound`。

### 2.4 `createAgentActionPostconditionHandler({commandContext, executeCommand = executeCanvasCommand, shouldContinue})`

`async ({commandId, args, response, context}) => …`，是计划执行器（0.7.16 的 `agentActionExecutor.js`）传给 `executeCanvasCommandPlan` 的 `afterAction` 钩子形态：

- `response?.ok !== true` → **原样返回该响应**，不附 `verification`。
- 校验通过 → `{...response, verification:{status, attempts:0}}`（`status` 可能是 `verified`/`not_applicable`/`legacy_contract`/`not_run`）。
- 校验失败且（id 不在可修复白名单 **或** `shouldContinue({phase:'postcondition_repair', commandId}) === false`）→ `buildPostconditionFailure`：`errorCode:'AGENT_POSTCONDITION_FAILED'`、message `'<id> returned success, but its canvas result could not be verified.'`、`details:{reason, ...细节, repairAttempted:false}`、`verification:{status:'failed', attempts:0, reason}`。
- 否则**用原始 `args` 重放一次** `executeCommand(commandId, args, context || commandContext)`：重放非 `ok` 或重放后仍不满足后置条件 → `buildPostconditionFailure(..., repair)` 且 `details.repairAttempted=true` + `repairErrorCode`/`repairMessage`；重放通过 → `{...重放响应, verification:{status:'repaired', attempts:1, initialReason}}`（**返回体换成重放响应**）。

## 3. 本批实际执行的检查 / 明确未执行的检查

已执行（全部离线、无网络、无磁盘写入、无进程）：

1. 端口 → 暂存 → 仓库逐字节 `cmp`：1/1 IDENTICAL。
2. `node --check` 源码与测试：2/2。
3. `prettier --check`（本批 2 件）+ 一次 `--write` 后复跑测试。
4. 落地前具名导入门禁 `b100/verify-exports.mjs`：1/1。
5. `node --test` 单文件：34/34。
6. 全仓 `src/**` sweep：3 292/3 249/43，失败名单与基线 `diff-exit=0`。
7. `b95/deps-ast.mjs src/modules/agent` 闭包复测：未落地 3 → 2。
8. 反向消费者 `grep`（`src`/`api`/`electron`/`main.js`）与镜像消费者 `grep`：见 §4。
9. **可达性探针** `b109/probe.mjs`：按源码字面量取出 41 个 `STORE_VERIFIED_COMMANDS` id，逐个喂进一份"尽量满足"的画布状态与响应。实测输出 **`store ids 41` / `policy_missing on store path: []`** —— 即 `store` 路径**当前无一 id 会落入 `postcondition_policy_missing`**（38 项 `verified`，`node.delete`/`node.group`/`node.ungroup` 因该状态语义相反为 `nodes_not_removed`/`group_state_mismatch`/`ungroup_state_mismatch`）。该行仅在 store 集合新增 id 而未写分支时才会命中。
10. 保护文件 md5 复核与 `git status` 计数归因。

**未执行**（不得当作已验证）：未启动 Electron / 浏览器；未真实执行任何画布命令（重放路径的 `executeCommand` 默认值指向真实 `executeCanvasCommand` 总线，本批**只在单测里以桩注入**，从未让默认值生效）；未接真实渲染器画布 store；未验证真实 `node.create`/`clipboard.paste`/`layout.*` 的落库时序；未做性能评估（每次动作后读一次全量 `getStateRaw` 并在 `verifyParams`/`valuesEqual` 做递归深比较）；未跑构建、未提交、未推送、未触发发布；`electron/**` 本批未触碰、未复测。

## 4. 零生产消费方（按红线未接线）

- 仓库反向 `grep`：`agentActionPostconditions` / `verifyAgentActionPostcondition` / `createAgentActionPostconditionHandler` / `getAgentActionPostconditionPolicy` / `AGENT_AUTO_REPAIRABLE_COMMANDS` 在 `src`/`api`/`electron`/`main.js` 中**除该件自身与其测试外 0 命中**。
- 镜像唯一消费者：`C:/Users/luobote/.qoder/tmp/shuo-deobf/src/modules/agent/agentActionExecutor.js`，它在 `executeCanvasCommandPlan(..., {afterAction: createAgentActionPostconditionHandler({commandContext, executeCommand, shouldContinue})})` 处挂载本件。
- 该消费者在本仓**落后一代**：本仓 `src/modules/agent/agentActionExecutor.js` **34 行 / 1 120 B**，镜像 **7 465 B（单行）**；本仓版本不含 `afterAction`、不含 `normalizeAgentActionArgs`/`collectCreatedNodeResult`/`revealCreatedNodes`，也没有 `agentPrecreatedNode.js` 依赖。转口 `src/modules/agent/index.js` 本仓 **16 行 / 767 B** vs 镜像 **4 291 B**。
- 结论：要让本件生效，必须先换代 `agentActionExecutor.js`（在用受保护装配件，且其新形态还牵出 `executeCanvasCommandPlan`、`core/math.js` 的 `worldToScreen`、`scheduleFrame`/`focusNodes` 端口与侧栏 inset 读取），属**独立专批 + 真机验证 + 运行授权**。本批未接线、未改装配件、未伪造消费方。

## 5. 端口现状（缺陷照实冻结、实现一字未改，34 例断言即台账）

1. `response.ok !== true` 一律 `status:'not_run'` 且 `ok:true` ⇒ 失败响应**永不触发**后置条件流程，也不产生 `verification`。
2. `normalizeId` 只 `trim` 不改大小写 ⇒ `Node.Create` 落 `unclassified`，在有画布状态时直接 `not_applicable` 通过（**大小写写错即静默跳过核验**）。
3. `commandId` 只回落 `response.commandId`，**不看 `args.commandId`/`args.type`**。
4. `store` 与 `unclassified` 在"无状态"下语义相反：前者 `state_unavailable` 失败、后者 `ok/not_applicable`；而 `result` 策略根本不读状态。
5. `readCanvasState` 用 `??` 回落：`getStateRaw()` 返回 `null`/`undefined` 时才试 `getState()`，返回**假值但非 nullish**（如 `false`）时按"有状态"继续。
6. 创建类核验只看 **result** 的四种 id 出口，`args` 里的 id 完全不参与 ⇒ 命令成功但 `result` 不回 id 时得到 `missing_result_node_ids`（判失败），而 `result` 谎报 id 且该 id 恰在 store 中即算通过。
7. `node.duplicate` 的 `copies` 走 `Math.max(1, Math.trunc(Number(copies ?? args.copies ?? 1)))`：**非数字 → NaN**，`NaN > 0` 为假 ⇒ 副本数校验**整体静默跳过**，复制错数量也报 verified。
8. `node.duplicate` 的源集合混取 `result.sourceIds` 与 `args.ids`/`args.nodeId`，其它创建类不读 args ⇒ 同类命令的参数来源不一致。
9. `verifyEdge` 仅比较 `sourceId`/`targetId`/`refSlot`/`type` 四键，且期望值为 `null`/`undefined` 时**跳过**该键；比较用 `String()` ⇒ `1` 与 `'1'` 等价。
10. `verifySelection` 期望集为空即判 `selection_state_mismatch` ⇒ **"清空选中"这一合法动作永远无法通过后置条件**；比较两侧 `sort()` ⇒ 选中顺序不敏感。
11. `verifyGroup` 要求选中集**恰好等于** `{groupId}` ⇒ 真实实现若同时选中子节点即判失败；子节点 `parentId` 比较经 `normalizeId`，但 `type` 比较经 `String(...||'')`（`type:0` 与 `''` 同判失败）。
12. `verifyUngroup` 允许 `childIds` 为空数组即通过，只要求 `groupIds` 非空且消失。
13. `clipboard.paste` 在 `result.edgeIds` 缺省时**不校验边**，粘贴丢边不会被发现。
14. `node.setPrompt`/`node.setModel`/`node.setParams` 的期望值全部取自 **result**：`result` 省略 `provider`/`params` 即跳过该段校验；`verifyParams` 是**部分键**比较（未出现的键不检查），而 `verifyModel` 的 `params` 是**整对象**递归比较——两件对同名字段严格度不同。
15. `verifyLayout` 无 `positions` 时返回 `status:'legacy_contract'`，该 status 会**原样冒泡**到 `verification.status`（仍算成功、仍不重放）；有 `positions` 时期望值缺 `x`/`y` ⇒ `Number(undefined)` 为 NaN，差值比较为假 ⇒ **视为通过**。
16. `generation.run` 只回 `{ok:true}` 而无 `status`/`taskId` 时走 `legacy_contract`，且 `verifyGeneration` 聚合时**丢弃条目 status**，最终整体 `verified` ⇒ 生成类动作的实际提交与否不被核验。
17. `graph.disconnect` 传空 `edgeIds` 直接算通过，而 `node.delete` 要求 `ids` 非空 —— "必须消失"两型语义不对称。
18. `node.rename` 在 `names` 数组短于 `ids` 时以 `undefined` 配对 ⇒ 该节点被期望改名为**空串**，非空名一律 `node_name_mismatch`。
19. 处理器重放使用**原始 `args`、无幂等标记**：白名单刻意排除了创建类（`node.create`/`node.duplicate`/`clipboard.paste` 等不在其中，故不会重复建节点），但含 `node.select`/`layout.*`/`media.resetSize` 等，重放即**二次执行同一命令**，副作用取决于命令自身的幂等性，本件不做保证。
20. `shouldContinue` 只在 `phase:'postcondition_repair'` 被调用，**校验前不调用**；且它只能否决重放、不能否决首次校验。
21. 处理器**返回体重放响应**（`{...repairResponse, verification}`），上层拿到的 `result` 是第二次执行的产物 ⇒ 与第一次的 `result` 不同时静默替换。
22. `buildPostconditionFailure` 的 message 为**硬编码英文模板**（`'<id> returned success, but its canvas result could not be verified.'`），未走 i18n；`errorCode` 固定 `AGENT_POSTCONDITION_FAILED`，原始 `reason` 只活在 `details.reason`。
23. 默认 `executeCommand = executeCanvasCommand` 从 `../canvasCommands/index.js` 静态导入 ⇒ **任何单测若走默认参数就会拉起真实命令总线**（本批测试全部显式注入桩）。

## 6. 台账与下一批口径

- 台账：本批只新增 2 个仓库文件（1 源码 + 1 测试）与本专题文档，**未修改任何既有文件**；`docs/implementation-handoff.md` 的 §6 进度标记、§7 待办勾选项、R12 表行与交付记录四处已同步（表列数保持 6）。
- `src/modules/agent` 仍欠 **2 件**：`OK` 池 `agentConversationPresentation.js`（16 035 B，依赖 8 个模块**均已落地**：`../../components/aigenText/markdownRenderer.js`、`../../utils/localMediaPath.js`、`./agentAssistantMarkdown.js`、`./agentPanelText.js`、`./agentConversationScroll.js`、`./agentRunStatusPresentation.js`、`./agentConversationStreamingPresentation.js`、`./agentMessageTime.js`）；`BLK` 件 `agentModelControls.js`（2 342 B，仍缺 `../../components/aigenText/modelSelector.js`、`../../components/aigenText/runtimeModelParameterControls.js`、`../modelGenerationParamMemory.js` 三个依赖，**不伪造 shim**）。
- **第 110 批口径**：取 `agentConversationPresentation.js` 专批。前置要求（本批教训延续）：①该件依赖 `markdownRenderer`/`sanitizeRichTextHtml` 一路，**禁止注入假 DOM**（`src/utils/dom.js` 的富文本清洗在存在 `document.createElement` 时走真实 DOM 分支），需以纯字符串/端口注入方式设计断言；②延续 `'k' in over ? over.k : default` 的桩覆盖写法，勿用 `??`；③核验桩要按"实现返回什么就断言什么"记缺陷，不改实现；④落地前必须先跑 `b100/verify-exports.mjs` 逐具名导入核验，任一 `DEP-FAIL` 即回退为 BLK 记账。
- 承接挂账（本批不解决）：真实接线需换代 `agentActionExecutor.js`/`index.js`（受保护装配件 + 真机验证 + 授权）；i18n 缺口新增 1 项（`AGENT_POSTCONDITION_FAILED` 英文模板）；缺失夹具 `tests/testPreviewDom.js` 的 43 项基线失败继续挂账，**不伪造**。
