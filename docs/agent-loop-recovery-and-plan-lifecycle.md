# 第 99 批：Agent 空转恢复预算与计划生命周期（OK 层首批 2 件落地，不接线）

本批承接第 98 批 §8 排定的 OK 层前两件：`agentLoopRecovery.js`（空转重试判定 + 副本动作预算）与 `agentPlanLifecycle.js`（确认卡片的计划描述、分区与失败恢复）。落地前按第 98 批要求做了**具名导出核验**，结论见 §3.1。

## 1. 缺口与闭包审计

| 指标 | 本批前 | 本批后 |
| --- | --- | --- |
| 移植源 `src/modules/agent`（0.7.16 反混淆镜像，非测试） | 81 件 | 81 件 |
| 仓库 `src/modules/agent` 非测试源码 | 39 件 | 41 件 |
| 仓库 `src/modules/agent` 测试文件 | 27 件 | 29 件 |
| 未落地 | 42 件 | 40 件 |
| AST 分级：纯叶 LEAF | 0 | 0 |
| AST 分级：未落地的依赖齐全 OK | 24 | 22 |
| AST 分级：依赖缺失 BLK | 18 | 18 |

复算命令：`node C:/Users/luobote/.qoder/tmp/deobf-tools/b95/deps-ast.mjs src/modules/agent`。

OK 计数由 24 降到 22 是**本批两件自身出池**（它们原本就在这个待落地清单里），不是新阻；BLK 维持 18 说明本批又没有解锁任何新对象。至此连续 3 批的账目可以定论：**纯叶与单依赖件的落地只在「被依赖方此前唯一缺它」时才产生解阻**，`src/modules/agent` 剩余 40 件里 18 件是 BLK、22 件是 OK，OK 件的共同特征是依赖已齐但**消费方全在受保护装配件里**。

## 2. 交付物

| 文件 | 行数 | 字节 | 导出 | 来源（`cmp` 一致） |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentLoopRecovery.js` | 83 | 3 671 | 6 | `b99/port/`（原始移植体 3 176 B） |
| `src/modules/agent/agentLoopRecovery.test.js` | 276 | 11 275 | — | 新写，9 例 |
| `src/modules/agent/agentPlanLifecycle.js` | 371 | 17 645 | 1 | `b99/port/`（原始移植体 14 450 B） |
| `src/modules/agent/agentPlanLifecycle.test.js` | 555 | 22 899 | — | 新写，20 例 |

合计 2 件源码 / 7 个导出 / 2 件测试 / 29 例；源码 454 行 / 21 316 B，本批新增 **1 285 行 / 55 490 B**。仓库字节大于移植原始体是因为落库前统一跑 Prettier（`printWidth:110`、`singleQuote`、`arrowParens:always`）；`cmp` 比对对象是同一份 Prettier 产物。

### 2.1 `agentLoopRecovery.js` 关键行为

6 个导出，唯一相对依赖是 `./agentParameterHints.js` 的 `extractAgentDuplicateCountHint`。

- `isAgentLoopRetryMessage`：三条**全锚定**正则 —— 纯问号 `^[?？]+$`、中文短句白名单（`重试/再试(一次)?/继续/重新来/重新试/请重试/再来一次` 后只允许 `。！!？?`）、英文 `^(retry|try again|continue|resume)[.!?]*$`（忽略大小写）。先 `trim()`，空串直接否。
- `isAgentLoopRecoveryEditMessage`：6 条**不锚定**正则，覆盖「刚才/上次/之前/原来 + 24 字内 + 失败/任务/生成/节点」「失败/原任务/原生成 + 24 字内 + 换/改/切换/继续/重做」「换/更换/切换/改成/模型改成 + 18 字内 + 模型」「修改 + 12 字内 + 需求/提示词/prompt」与两条英文式。
- `shouldRetryAgentLoopNoop`：四条件与 —— `hasActionIntent === true`、`Number(toolResultCount||0) === 0`、`Number(retryCount||0) < 1`、`String(status||'') !== 'chat'`。`NaN` 在第二、三条上都判否。
- `createAgentLoopActionBudget(message)`：`{duplicateNodeLimit: 提示值 || 0, duplicatedNodeCount: 0}`，上限直接复用副本数提示（含其 1..12 钳位与中文十进制识别）。
- `validateAgentLoopActionBudget(action, budget)`：非 `node.duplicate` 或上限 `=== 0` 时**只返回 `{ok:true}`**（不带统计字段）；否则 `planned = (ids 非空 ? ids.length : 1) * max(1, trunc(Number(copies||1)))`、`remaining = max(0, limit - max(0, trunc(Number(completed||0))))`，`planned <= remaining` 放行并回 `{ok, planned, remaining}`，超额返回 `{ok:false, errorCode:'DUPLICATE_BUDGET_EXCEEDED', limit, completed, planned, remaining}`。
- `recordAgentLoopActionBudgetResult(budget, action, result)`：只有 `action.type === 'node.duplicate'` 且 `result.ok === true`（严格）才记账，增量取 `results.at(-1).result` 的 `nodeIds`（优先）或 `ids` 长度，返回**新对象**；任一条件不满足时**原样返回入参引用**。

### 2.2 `agentPlanLifecycle.js` 关键行为

工厂 `createAgentPlanLifecycle({readCanvasState, localeProvider, formatText, isSafeAction})`，缺 `readCanvasState` 或 `isSafeAction`（须为函数）即抛 `TypeError('[agentPlanLifecycle] readCanvasState and isSafeAction are required')`；返回 `Object.freeze({describe, partition, recover, review})`。`localeProvider?.() || 'zh-CN'` 只服务于 `translateManifestText`；`formatText(key)` **只传一个参数**；未注入 `formatText` 时原样返回 key。

- `review(plan, {debugTrace, debugTraceSummary})`：产出 `{...plan, confirmationSummary:{completedActions, pendingActions, generation, debugTraceSummary, cancelNotice}}`，**不就地改写 plan**。动作描述统一为 `{type, label, args, promptSummary}`；`label` 走 13 条命令名映射（`node.create` 再按解析后的 `args.type` 细分为 图/视频/音频/文本/通用 5 个 key，未列入表的命令原样返回自身），`promptSummary = truncateText(args.prompt || args.text, 60)`。
- 作用域解析：`args` 深拷贝式递归解析，字符串须整体匹配 `^$标识符(.标识符|数字)*$` 才尝试取值，顶层键须是 scope 的**自有属性**，路径任一段为 `undefined` 则**整串回落字面量**；命中即取值（`0`、`''` 等 falsy 也算命中）。
- `generation`：取计划里**第一个** `generation.run|runBatch`，没有则整段为 `null`。`run` 读 `args.nodeId`、`runBatch` 读 `args.nodeIds`（均去空白滤空），`nodeId` 取首个、`batchSize` 取数量；节点取自 `readCanvasState().nodes`；模型经 `resolveModelExecution(node.model, {providerHint: node.provider})`，`modelLabel` 依次为 manifest `displayName → title → 节点 model → formatText('defaultModel')`；`promptSummary` 取节点 `prompt || storyboardScript.prompt` 截 120；`params` 为节点 `generationParams` 与命令 `options.params` 的浅合并（后者优先）；`editableParams` 由 `isAgentEditableParamField` 过滤 manifest `uiSchema.fields`，字段键序固定 `id/label/type/displayRole/placement/value/options/min/max/step`，值取自合并参数（有自有属性时）否则 `defaultValue`，标签与选项文案过 `translateManifestText`，`label` 为空的字段整个丢弃；`inputSource` 反查 `edges` 中 `targetId` 相同的边，源节点缺失即丢弃，`selectedNodeIds` 命中且源类型为 `ai-image|source-image` 时用图片专用文案，逗号（全角）连接，无上游时给占位文案。
- `debugTraceSummary`：显式数组原样采用；否则由轨迹归并（模型默认值、参数过滤、确认原因、参数识别三型），未知原因兜底「需要确认」，**静默截断到 6 条**。
- `describe({plan, recovery})`：有 `recovery` 时只出「失败动作：标签」或固定句「上次生成失败，可重新规划。」；否则按 `已准备 N 步；待确认：前 3 个标签；模型：X；Prompt：Y` 用全角分号连接，全空回落 `plan.reply`，末了同样过 `truncateText(…, 240)`。
- `recover(failure, plan)`：以 `Number(failure.raw?.result?.failedIndex)` 定位失败动作，有效（有限且 ≥ 0）时取 `plan.actions[index]`，否则退到第一个 `generation.run`；都取不到则 `{recovery:null, retryPlan:plan}`（同一引用）。恢复体含 `errorCode`（`failure.errorCode || failure.raw?.errorCode || ''`）、`failedAction` 描述与 4 个固定选项 `retry/editPrompt/changeModel/keepPrepared`。索引合法且未越界时才切计划：`actions.slice(index)` 为待执行、已执行段并入 `preExecutedActions`、`raw.result.aliases` 浅并进 `scope`。
- `partition(plan)`：`findIndex(a => !isSafeAction(a))`，索引 ≤ 0（含全安全的 -1）时 `prefix` 为空、`pending` 即原数组引用；否则在首个不安全动作处切分。

## 3. 接线状态与前置条件

**本批不接线，仓库内生产引用为 0。** `grep -rl "agentLoopRecovery\|agentPlanLifecycle" src api main.js` 只命中两件源码自身与两件新测试。

移植镜像里的真实引用方全部是受保护装配件：

- `agentLoopRecovery.js` ← `agentRuntime.js`（引用 6 个具名导出：`createAgentLoopActionBudget`、`isAgentLoopRecoveryEditMessage`、`isAgentLoopRetryMessage`、`recordAgentLoopActionBudgetResult`、`shouldRetryAgentLoopNoop`、`validateAgentLoopActionBudget`）与 `index.js`。
- `agentPlanLifecycle.js` ← 仅 `agentRuntime.js`，且只用默认导出的工厂。

### 3.1 具名导出核验（第 98 批 §8 的前置要求）

OK 分级只看文件在位，因此本批先核验 `agentPlanLifecycle.js` 的两个跨模块具名依赖：

| 依赖 | 需要的导出 | 仓库现状 | 纯 node 下可导入 |
| --- | --- | --- | --- |
| `../../i18n/manifestText.js` | `translateManifestText` | 存在（`export function`） | 是，未触 DOM |
| `../../manifests/index.js` | `resolveModelExecution` | 存在（再导出） | 是，未触 DOM |

行为抽样核验：`translateManifestText('Aspect Ratio', {locale:'en-US'})` 原样返回、`translateManifestText(undefined, …)` 返回空串（这正是字段被丢弃的路径）；`resolveModelExecution('no-such-model', {})` 返回 `null`（⇒ 未知模型的 `editableParams` 恒空、`modelLabel` 回落到模型串）。核验通过 ⇒ 本文件不是「假 OK」。

## 4. 审计发现与端口现状冻结清单

以下 12 条为端口现状（非本批引入），已在测试中用断言钉住，**不做补丁**：

1. `copies` 为非数字字符串时 `Number(x||1)` 得 `NaN`，`Math.max(1, NaN)` 仍是 `NaN` ⇒ `planned` 为 `NaN`，`NaN <= remaining` 为假 ⇒ **直接判超额**（`DUPLICATE_BUDGET_EXCEEDED`），而不是放行。
2. `duplicateNodeLimit` 为非数字字符串时 `remaining` 同样出 `NaN` ⇒ 任何 `node.duplicate` 都被拒。字符串数字（`'2'`）倒是能正常参与计算。
3. `recordAgentLoopActionBudgetResult` 不记账时返回**入参同一引用**（就地透传），记账时才返回新对象；且只统计 `results` 的**末项**。
4. 重试判定三条正则全锚定 ⇒ `继续生成`、`retry now` 一类带前后缀的说法都不算重试。
5. 编辑判定里 `换…模型` 需要「模型」出现在换词**之后** ⇒ `把模型改成 seedance` 判否（要写成 `换成别的模型` 才命中）。
6. `planLifecycle` 的 `formatText(key)` 只传 1 个参数，与 `agentTaskBindingRuntime` 的 `formatText(key, params)` 不同 ⇒ 任何需要插值的文案在此处拿不到参数。
7. `describe()` 的输出也要过 `truncateText` ⇒ 先 `replace(/<[^>]*>/g,' ')` 再压空白，含尖括号的标签会被吞成空格（`<nodeDelete>` 直接变空串）。
8. `recover()` 里「索引越界就不切计划」的分支实际不可达：越界索引在前一步就取不到动作、已经返回 `{recovery:null}`；只有「索引非法但能命中首个 `generation.run`」才会走那条判断。
9. `raw.result.aliases` 只要是数组就能通过 `typeof === 'object'` 闸门并被浅展开 ⇒ `scope` 多出 `0:`、`1:` 这类数字键。
10. 作用域解析的顶层键要求 `hasOwnProperty` ⇒ 原型链上的值引用不到；相反，命中的 falsy 值（`0`、`''`）会被正常取用。
11. `inputSource` 的「选中图片」判定把 `source-image` 也算作图片，且只认 `edges[].targetId` 精确字符串相等；边里的源节点若已被删除则该条静默消失（不产出占位）。
12. `debugTraceSummary` 归并结果**无提示截断到 6 条**，第 7 条起的确认原因与参数识别不会出现在确认卡片上。

## 5. 验证矩阵（全部离线，已实际执行）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check` × 2 件源码 | 通过 |
| 字节保真 | `cmp -s` 仓库 ↔ `b99/port/` 同路径 Prettier 产物 | 2/2 IDENTICAL |
| 本批测试 | `node --test --test-timeout=25000`（2 件测试文件） | 29 例 / 29 通过 / 0 失败 |
| 全量 src 回归 | `find src -name '*.test.js' \| xargs node --test --test-reporter=tap`（236 件测试） | `2 613/2 570/43 → 2 642/2 599/43`（+29/+29/±0），43 项失败名单与 `b85-fails.txt` `diff-exit=0` |
| electron 回归 | `find electron -name '*.test.js' \| xargs node --test` | 1 649 / 1 648 / 1（本批未触碰 electron） |
| 格式 | `prettier --check` × 4 件 | All matched files use Prettier code style |
| 未越界 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，与交付前一致 |

首跑 **26/29**（`agentLoopRecovery` 1 项、`agentPlanLifecycle` 2 项失败），三处都是**测试自身**的期望偏差：①把 `Number(copies||1)` 误判为「非法即 1」，实际出 `NaN`（改为同时钉住 `planned` 的 `NaN` 与超额结果）；②漏算 `hasOwnProperty` 命中后 `0` 会被正常取值（`$zero` 期望由字符串改为 `0`）；③把「选中的 `ai-image` 上游」误写成通用文案，且未料 `describe` 的标签会被 `stripMarkup` 吞掉。跑测前另清掉一处草稿里的无效断言。**实现一字未改**。

`agentPlanLifecycle.test.js` 对真实模型目录只做**接线级**断言：取 `QWEN_IMAGE_EDIT_MODEL_ID` 走通 `resolveModelExecution → uiSchema → editableParams`，断言 `aspectRatio` 出现在可编辑项里、字段与选项键序固定，并把 `modelLabel` 与运行时读到的 manifest `displayName` 比对，从而不把清单内容变化误报为回归。

## 6. 本批明确不承接

- **不升级任何受保护装配件**：`agentRuntime.js` 与 `index.js` 是本批两件的唯一消费方，二者换代须单独成批 + 真机验证 + 运行授权。
- **不接线、不伪造调用点**：两文件在仓库内保持「已落地、待接线」。
- **不动 `src/i18n/messages/*.js`**：`nodeCreateImage`、`cancelNotice`、`retry` 等 key 由注入的 `formatText` 承担，其词条覆盖情况本批只记录不补。
- **不碰 BLK 层**：`agentConversationPresentation.js`、`agentRunStatusPresentation.js`、`agentSessionEventLog.js`、`agentSkillLifecycleRuntime.js` 等 18 件仍缺上游，须按 §8 的顺序先补 OK 层前置件，另批处理。

## 7. 约束复核

- 未覆盖 `api/freeImageHostApi.js`（md5 已复核未变）；本批只在 `src/modules/agent/` 新增 4 个文件。
- 未 commit、未 push、未触发 release workflow。
- 未跑构建、未启动 Electron、未联网、未调用真实 AI 服务；测试全为仓库内文件的离线 `node --test`。
- 未 `git reset --hard`/`clean`/批量 checkout，未清理未跟踪文件。
- `D:\shuocancas` 与 `shuo-deobf` 镜像只读。
- 未新增 npm 依赖；未修改 `style.css`、未改授权判定。
- 端口 bug 与现状只记账（§4），未打补丁。

## 8. 下一批建议

剩余 40 件：OK 22 / BLK 18。建议**第 100 批**继续清 OK 层里依赖最浅的单依赖件，逐件先做 §3.1 那样的**具名导出核验**（AST 分级不验导出名，这是历史「假 OK」的来源）：

1. `agentProjectMemoryConversationRuntime.js` ← 仅 `./agentProjectMemory.js`（已落地）。
2. `agentCapabilityDiscovery.js`、`agentAssistantConversation.js`、`agentPanelText.js`、`agentMessageTime.js`、`agentSkillAuthoring.js`：OK 分级只看路径在位，**逐件核验具名导出后再取**；它们同时是 BLK 簇的前置（`agentSkillLifecycleRuntime.js`、`agentSkillAuthoringRuntime.js` 缺 `agentSkillAuthoring.js`；`agentReplyVersions.js`、`agentSessionEventLog.js` 缺 `agentAssistantConversation.js`；`agentConversationPresentation.js`、`agentRunStatusPresentation.js` 缺 `agentPanelText.js`）⇒ 落地即可批量解阻。
3. 呈现簇 `agentConversationPresentation.js`/`agentRunStatusPresentation.js`/`agentConversationStreamingPresentation.js` 的共同前置是 `agentPanelText.js` 与 `agentMessageTime.js`（两者均在 OK 层，依赖 `../../i18n/index.js` 与 `./agentPanelElements.js`）⇒ 若第 100 批想一次性解锁一整条 UI 呈现链，优先取这两件。

受保护装配件升代（`index.js`/`agentRuntime.js`/`agentPanel.js`/`agentContextBuilder.js`/`agentConversationStore.js`/`agentSessionStore.js`）、`api/agentAssistantApi.js` 补齐、`core/math.js`（32→52 导出、62 消费方，R09 最后 2 件的唯一阻塞）、`rendererVirtualization.js`、`canvasMediaLocalService.js`（28 消费方）、`media-clip` 世代归一、`main.js` chrome-shell 最终装配、后端 spawn 站点切换：**各自均须单独成批 + 真机验证 + 运行/费用授权**，不在纯补齐批次内推进。
