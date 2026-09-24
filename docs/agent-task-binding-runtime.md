# 第 98 批：Agent 任务绑定运行时（最后一件纯叶落地，不接线）

本批承接第 97 批 §8 排定的「最后一件纯叶 `agentTaskBindingRuntime.js`」，并与已落地的 `agentDurableRunState.js` 做绑定语义对齐核对（结论见 §4.1）。落地后 `src/modules/agent` 的纯叶层清零。

## 1. 缺口与闭包审计

| 指标 | 本批前 | 本批后 |
| --- | --- | --- |
| 移植源 `src/modules/agent`（0.7.16 反混淆镜像，非测试） | 81 件 | 81 件 |
| 仓库 `src/modules/agent` 非测试源码 | 38 件 | 39 件 |
| 仓库 `src/modules/agent` 测试文件 | 26 件 | 27 件 |
| 未落地 | 43 件 | 42 件 |
| AST 分级：纯叶 LEAF | 1 | 0 |
| AST 分级：依赖齐全 OK | 24 | 24 |
| AST 分级：依赖缺失 BLK | 18 | 18 |

复算命令：`node C:/Users/luobote/.qoder/tmp/deobf-tools/b95/deps-ast.mjs src/modules/agent`。

本批没有 BLK→OK 转化：`agentTaskBindingRuntime.js` 零相对依赖，被依赖方向上也没有任何移植文件只缺它（BLK 名单里最近的 `agentConversationCapabilityRuntime.js` 还缺 3 件）。OK 层 24 件与本批前完全一致，可作为下一批改动的对照基线。

## 2. 交付物

| 文件 | 行数 | 字节 | 导出 | 来源（`cmp` 一致） |
| --- | --- | --- | --- | --- |
| `src/modules/agent/agentTaskBindingRuntime.js` | 460 | 17 360 | 1 | `b96/port/`（原始移植体 13 818 B） |
| `src/modules/agent/agentTaskBindingRuntime.test.js` | 499 | 18 486 | — | 新写，19 例 |

落库前统一跑过 Prettier（`printWidth:110`、`singleQuote`、`arrowParens:always`），所以仓库字节数大于移植原始体；`cmp` 比对对象是同一份 Prettier 产物。

### 2.1 `agentTaskBindingRuntime.js` 关键行为

唯一导出 `createAgentTaskBindingRuntime({...})`，缺 `sessionStore` 或 `readCanvasState` 非函数即抛 `TypeError('[agentTaskBindingRuntime] sessionStore and readCanvasState are required')`；返回 `Object.freeze` 的 6 个键：`getPending` / `getSettlement` / `registerExecution` / `start` / `sync` / `dispose`。除导出工厂外的全部逻辑都是闭包，因此测试只能从公开面进入。

状态归一：

- 终态集合 = `success|succeeded|completed|complete|done` ∪ `failed|fail|error` ∪ `cancelled|canceled`；
- `normalizeTaskStatus` 只做两次迁移：`queued|submitted → pending`、`generating|processing → running`；
- 节点状态取值链：`jobStatus → rhTaskStatus → asyncTaskStatus → textJobStatus → videoJobStatus → storyboardScript.jobStatus → (isGenerating ? 'running' : '')`；
- 节点任务 id 链：`taskId → rhTaskId → asyncTaskId`；
- 消息态 `getTaskMessageStatus`：成功族→`success`、失败族→`failed`、取消族→`cancelled`、`pending` 原样，其余回落原始小写串或 `'running'`。

节点标签 `getNodeLabel`：按 `type` 含 `video/audio/text` 否则「图片」选种类词，拼成 `名称（图片节点）`；节点无 `name/title` 时用入参标签，再兜底 `'目标'`。

响应解析 `getGenerationResponses`：取 `results`，否则取 `raw.result.actions`；`generation.run` 原样保留，`generation.runBatch` 展开子项为 `{commandId, ok: !失败族, result}`，**其它 commandId 整个丢弃**。

绑定 id `buildTaskBindingId`：`['agent-task', 会话||'conversation', 轮次||'turn', 节点||'node', 任务||'local']`，逐段 `replace(/[^A-Za-z0-9_-]+/g,'_')` 后用 `:` 连接。

消息：`{role:'assistant', status, messageType, content, task}`，`messageType` 终态为 `task_result`、非终态为 `task_status`；`task` 为 `{nodeId, taskId, commandId(默认 generation.run), status, resultKind}`，且仅当「消息态 success 且结果为 image」时挂 `media`。`content` 走注入的 `formatText(key, params)`，未注入时原样返回 key。

媒体归一：`normalizeTaskMediaUrl` 剔除空串与 `data:` URL；条目上限 12（`MAX_TASK_MEDIA_ITEMS 0xc`）；`images[]` 优先，逐项丢弃 `error` 或 `status==='failed'`；`thumbUrl` 缺失回落主图，反之亦然。

三条主流程：

1. `registerExecution(payload, {turnId})`：展开响应 → 建绑定（状态取响应，空则取节点；两者都无则丢弃该条）→ 优先 `sessionStore.upsertTaskBindings(list)` 批量落库，缺该导出时逐条走 `upsertTaskBinding` **并使用其返回值**（回写生效）→ 每条推送历史 → 若任一响应节点在画布上已终态，再跑一次 `sync(canvasState)`。
2. `sync(state)`：跳过无 `nodeId`、或 `notifiedTerminal === true` 的绑定；节点无状态则跳过；终态 → 推历史 + `updateTaskBinding(id, {...补丁, notifiedTerminal:true})`；非终态 → 仅当 `status` 或 `messageStatus` 变化才回写补丁（不带 `notifiedTerminal`）；无论如何末尾调用 `onBindingsChanged?.()`。
3. `getSettlement(ids)`：入参先过 `Set`；空集、命中数≠集合大小、或存在非终态 → `{settled:false, allSucceeded:false, bindings}`；否则 `settled:true`，`allSucceeded` 取全部成功族，非全成功时 `failedBinding` 取**按序第一个**非成功绑定，并附本地化的 `failureMessage`。

订阅 `start()`：只订阅一次，优先 `store.subscribeSelector(state => Number(state._persistRev || 0), cb)`，回落 `subscribeRaw`，再回落 `subscribe`；三者都没有则静默。`dispose()` 调用退订句柄并把「已订阅」标志复位，故可重启。`getPending(turnId)`：按轮次过滤，剔除终态，绑定无 `taskId` 时要求节点处于 `pending|running` 才算待完成。

## 3. 接线状态与前置条件

**本批不接线，仓库内生产引用为 0。** `grep -rl agentTaskBindingRuntime src api main.js` 只命中自身与新增测试。

移植全镜像（`shuo-deobf/src`、`shuo-deobf/api`）里唯一的外部引用者是 `src/modules/agent/agentRuntime.js`：

```js
import { createAgentTaskBindingRuntime } from './agentTaskBindingRuntime.js';
```

而 `agentRuntime.js` 是**已在仓库运行的上一代装配件**，属受保护升级对象（须独立批次 + 真机验证 + 运行授权）。它给本模块注入的依赖是：`store`、`sessionStore`、`readCanvasState: () => getState({store, commandContext})`、`getActiveConversationId`、`getCurrentTurnId`、带 locale 的 `formatText`、`onBindingsChanged`，并在构造后立即调用 `start()`。这正好等于 §2.1 的入参契约，说明本文件的公开面无缺项。

与持久层的对端：绑定的规范化与落库由 `agentConversationStore.js`（受保护装配件）和 `agentSessionEventLog.js`（BLK，还缺 `agentRunEventLog/agentReplyVersions/agentAssistantConversation`）承担；`agentSessionStore.js` 只从 `agentDurableRunState.js` 引 `normalizeAgentOperation`，**不引** `normalizeAgentTaskBindings`。也就是说本模块产出的裸绑定对象要经过 `agentConversationStore` 才能拿到 `createdAt/updatedAt`。

结论：本批是「补齐纯叶层」的收尾，不产生可见功能，也不改变现有 Agent 行为。任何「本批已让任务状态卡片跑起来」的说法都不成立。

## 4. 审计发现与端口现状冻结清单

以下 8 条为端口现状（非本批引入的缺陷），已在测试里用断言钉住，**不做补丁**以保持字节保真：

1. **与 `agentDurableRunState.js` 的绑定 schema 不对齐（跨模块）**：`normalizeAgentTaskBinding` 要求 `id` 且 `nodeId||targetNodeId` 同时存在，并会补 `createdAt/updatedAt`、把 `notifiedTerminal` 强制成布尔；而本模块 `buildTaskBindingId` 造出的绑定**没有** `createdAt/updatedAt`，`messageStatus` 只在 `sync`/`registerExecution` 的部分路径写入。⇒ 绑定必须经持久层归一后才自洽，运行时自身产出的对象不是最终形态。本批按原样落地并在 §3 记录落库归属。
2. 未知 `commandId` 的响应整体丢弃（只认 `generation.run` 与 `generation.runBatch`），因此 `node.create` 之类命令的返回值不会建立绑定。
3. `generation.runBatch` 子项若无 `nodeId`，即使带 `taskId` 也会被丢弃（`_0xb5c11a` 先校验 nodeId）。
4. `registerExecution` 里 `runBatch` 展开项的 `ok` 只按「失败族」判定：`status` 为 `cancelled` 的子项仍算 `ok:true`，但消息态会是 `cancelled`。
5. `media` 只在「消息态 success 且 `resultKind==='image'`」时出现；video/audio/text 成功结果一律不带媒体，即便节点上挂着 URL。
6. `data:` URL 一律剔除（含 `thumbUrl` 只有 data: 的项），故内联小图在 Agent 消息里不可见。
7. `getSettlement` 的入参先过 `Set` 去重 ⇒ 传入重复 id 会被当作单个目标照常判定为 `settled`。
8. `start()` 的订阅优先级会吞掉更低层：只要 `subscribeSelector` 存在就不再尝试 `subscribeRaw/subscribe`；且 `dispose()` 后允许重启，重启会重新订阅。

另有 1 条 i18n 缺口（不改 `src/i18n/messages/*.js`，仅记账）：`taskCompleted` / `taskStarted` / `taskPending` 三个 key 在仓库与移植镜像的 i18n 里**都不存在**（`grep -rn taskCompleted src/i18n/`、`grep -rn taskCompleted shuo-deobf/src/i18n/` 均 0 命中；`taskFailed`/`taskCancelled` 只在别的命名空间出现）。因此未注入 `formatText` 时消息正文会露出裸 key。补词条属需要授权的 i18n 改动，与本批解耦，已并入 §8 之后的待办。

## 5. 验证矩阵（全部离线，已实际执行）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check src/modules/agent/agentTaskBindingRuntime.js` | 通过 |
| 字节保真 | `cmp -s` 仓库文件 ↔ `b96/port/` 同路径 Prettier 产物 | IDENTICAL |
| 本模块测试 | `node --test --test-timeout=25000 src/modules/agent/agentTaskBindingRuntime.test.js` | 19 例 / 19 通过 / 0 失败 |
| 全量 src 回归 | `node --test --test-timeout=25000`（见台账快照） | 2613 / 2570 / 43，失败名单与 `b85-fails.txt` 基线 `diff` 为空 |
| 格式 | `prettier --check` 两文件 | All matched files use Prettier code style |
| 未越界 | `freeImageHostApi.js` md5 | `1e0458013f5341c99f21faefc1d34d3f`，与交付前一致 |

测试覆盖：构造器抛错与冻结面（6 键）、非生成响应丢弃、`generation.run` 成功的完整绑定与 `task_result` 消息、无状态有 taskId → `running`、无状态无 taskId → 丢弃、节点 `jobStatus`/`jobError` 回落、`runBatch` 展开与无 nodeId 子项丢弃、id 非法字符替换、`upsertTaskBinding` 回落路径与返回值回写、`sync` 的终态回写/幂等/三种跳过/非终态不刷屏/taskId 从节点补取/`updateTaskBinding` 缺失不抛错、`getPending` 三组过滤、`getSettlement` 五组判定（含 `failureMessage` 与重复 id）、`start/dispose` 三档订阅回落与重启、媒体 `data:` 剔除与 12 项上限。

## 6. 本批明确不承接

- **不升级任何受保护装配件**：`agentRuntime.js`（唯一调用方）、`agentConversationStore.js`、`agentSessionStore.js`、`agentPanel.js`、`agentContextBuilder.js`、`index.js`。它们一旦换到 0.7.16 代次才会真正消费本模块，需要真机验证与运行授权。
- **不接线**：仓库内 0 引用即按 0 引用交付，不伪造调用点。
- **不补 i18n 词条**：见 §4 末。
- **不动 `agentSessionEventLog.js`**：它是 BLK，缺 3 件上游，属「依赖缺失」而非纯叶批次。

## 7. 约束复核

- 未覆盖 `api/freeImageHostApi.js`（本批只新增 2 个 `src/modules/agent` 文件）。
- 未 push、未触发 release workflow、未 commit。
- 未跑构建/启动/真实 AI 调用；测试为仓库内文件的离线 `node --test`。
- 未 `git reset --hard`/`clean`/批量 checkout；未清理未跟踪文件。
- 只读访问 `D:\shuocancas` 与 `shuo-deobf` 镜像，未写回。
- 未新增 npm 依赖；未修改 `src/i18n/messages/*.js`；未替换 `style.css`。
- 端口 bug 与现状只记账（§4），未擅自修补。

## 8. 下一批建议

纯叶层已清零，`src/modules/agent` 剩余 42 件全部落在 OK(24) / BLK(18) 两层。建议**第 99 批**取 OK 层里解锁收益最高的两件：

1. `agentLoopRecovery.js` ← 仅依赖本批前已落地的 `agentParameterHints.js`；它在受保护 `agentRuntime.js` 的导入清单里被引用 5 次（`createAgentLoopActionBudget`、`isAgentLoopRecoveryEditMessage`、`isAgentLoopRetryMessage`、`recordAgentLoopActionBudgetResult`、`shouldRetryAgentLoopNoop`、`validateAgentLoopActionBudget`），属纯函数簇，可测试面无副作用。
2. `agentPlanLifecycle.js` ← 落地前须先核验 `../../i18n/manifestText.js` 与 `../../manifests/index.js` 两个具名导出在仓库当前代次是否已存在（OK 分级只看路径存在，不校验具名导出，这正是历史上出现过「假 OK」的地方）。

若 2 的具名导出缺失，按「不伪造 shim」规则把该文件记为阻塞，改为承接 `agentProjectMemoryConversationRuntime.js`（← 仅依赖已落地的 `agentProjectMemory.js`）这类单依赖件，并同样先做具名导出核验。
