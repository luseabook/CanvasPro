# 第 105 批：项目记忆存储 · 会话事件日志 · 会话动作条（R12）

本批把 `src/modules/agent` 的 OK 池继续取尽三件：**项目长期记忆的持久层**、**会话事件日志的归一与投影**、**会话动作条（编辑提问 / 重新回答 / 版本切换）的呈现与交互**。三件均为**落地不接线**，并配 **52 项离线测试**。所有核验结果、未执行项与冻结的端口现状如实记账。

## 1. 落地清单

| 文件 | 行数 | 字节 | 导出 |
| --- | --- | --- | --- |
| `src/modules/agent/agentProjectMemoryStore.js` | 151 | 5 725 | 2（`AGENT_PROJECT_MEMORY_STORAGE_KEY`、`createAgentProjectMemoryStore`） |
| `src/modules/agent/agentSessionEventLog.js` | 445 | 17 337 | 8 |
| `src/modules/agent/agentConversationActions.js` | 213 | 8 230 | 1（`createAgentConversationActions`） |
| 源码合计 | **809** | **31 292** | **11 具名导出** |

| 测试 | 行数 | 字节 | 用例 |
| --- | --- | --- | --- |
| `agentProjectMemoryStore.test.js` | 245 | 9 025 | 12 |
| `agentSessionEventLog.test.js` | 597 | 19 288 | 24 |
| `agentConversationActions.test.js` | 449 | 16 830 | 16 |
| 测试合计 | **1 291** | **45 143** | **52** |

本批合计新增 **2 100 行 / 76 435 B**。三件源码由端口镜像 `shuo-deobf` 取入 `deobf-tools/b105/port/` → `prettier --write` → 原样落入仓库，`cmp` 3/3 逐字节 `IDENTICAL`；`node --check` 6/6 通过。

## 2. 各件职责与契约

- **`agentProjectMemoryStore`**：以 `localStorage['aicanvas:agent-project-memory:v1']` 为载体的项目级长期记忆仓库，暴露 `{getMemory, remember, forget, clearMemory}`。存储结构为 `{schemaVersion:1, projects:{[projectId]: memory}}`，读时按 `updatedAt` 倒序裁到 **50 个项目**；单项目单类目上限 **12 条**。项目 id 由 `getProjectId()` 提供，`trim` 后截 **160** 字符，空或抛错回落 `'default_v2_project'`。`remember` 返回 `{memory, added[]}`、`forget` 返回 `{memory, removed}`、`clearMemory` 返回 `{memory, removed}`。
- **`agentSessionEventLog`**：会话事件的统一信封层。`normalizeAgentSessionEvent` 只认 7 种事件类型 × 5 种条目类型；四个 `createAgent*SessionEvent` 分别把消息、运行事件、操作、任务绑定包成信封；`projectAgentSessionEvents` 把事件流回放成 `{events, messages, runEvents, operationLedger, taskBindings, turns, items}` 七路投影；`compareAgentSessionProjection` 做四路一致性核对；`createAgentSessionEventsFromLegacyState` 把旧式平铺状态迁移为事件流。
- **`agentConversationActions`**：会话面板末轮动作条。`{render, setBusy, destroy}` 三方法，注入 `messagesEl / runtime / getBusy / setBusy / getPresentation / onResult / setNotice / replyActions`。渲染两条动作条：用户条（编辑提问，进 `.agent-message-footer`）与助手条（重新回答 + 可选 `replyActions` + 多版本时的 `‹ / 计数 / ›`）。

## 3. 实际执行与未执行

已执行（全部离线）：
- `cmp` 3/3、`node --check` 6/6、`prettier --check` 6/6（3 件测试经 `--write` 收敛后复跑 52/52 仍全绿）。
- `b100/verify-exports.mjs` 具名导出前置核验：**18/18 `ok`、零 `MISSING`、零 `DEP-FAIL`**。
- `node --test` 本批 **52/52**（首跑 25/34 —— 其中动作条测试整文件因假 DOM 选择器正则写错而加载失败、其余 8 项为期望偏差；**移植实现一字未改**，全部为测试自身问题）。
- `src/**` 全量 sweep：`3 009/2 966/43 → 3 061/3 018/43`（恰好 **+52/+52/±0**）。43 项失败名单与 `b85-fails.txt` `diff-exit=0` 逐名一致，**未新增失败**，仍全部归属缺失夹具 `tests/testPreviewDom.js`（**不伪造**）。产物 `deobf-tools/b105/src.tap`、`b105-fails.txt`、`b105/audit.txt`。

未执行（不在本批范围，须单独授权）：
- 未启动 Electron、未打开任何窗口、未构建、未打包、未推送、未触发 CI。
- 未真实读写浏览器 `localStorage`（测试用注入的假 `windowObject`）；未验证真实渲染器里的动作条 DOM/CSS（`.agent-message-actions`、`.agent-message-editor` 等样式类在本仓 `style.css` 的存在性与观感未核对）。
- `electron/**` 本批未触碰，沿用 `1 649/1 648/1`，**未复测**。

## 4. 接线结论：三件仍是零生产消费方，但它们是受保护装配件的前置

反向 `grep -rl <模块名>` 覆盖 `*.js`/`*.html`/`*.py`：三件**除自身测试外 0 命中**。端口镜像侧的真实消费方已逐件查明：

| 本批件 | 端口真实消费方 | 本仓现状 |
| --- | --- | --- |
| `agentProjectMemoryStore` | 根 `main.js`、`src/modules/agent/index.js` | 两者均在仓、属更早世代（在用的受保护装配件） |
| `agentSessionEventLog` | `agentConversationStore.js`、`agentSessionStore.js`、`index.js` | 三件均在仓、属更早世代（在用的受保护装配件） |
| `agentConversationActions` | `agentPanel.js` | 在仓、属更早世代（在用的受保护装配件） |

⇒ 与前几批「消费方整体缺失」不同，本批三件的消费方**全部是本仓在用件**，也就是说：**要让第 101–104 批的会话运行时与面板真正长出用户可见行为，`agentSessionStore`/`agentConversationStore`/`agentPanel`/`index.js`/`main.js` 的升代是唯一的下一道门**。这些件在保护清单内，升代**必须单独成批 + 真机验收 + 明确授权**。本批**未接线、未改装配件、未伪造消费方、未伪造 shim**。

## 5. 冻结的端口现状（以断言固化，未打补丁）

记忆存储：
1. **读路径不注入时钟**：`getMemory()` 里 `normalizeAgentProjectMemory(..., {projectId})` 不带 `now`，故无 `updatedAt` 的项目读出为 **0**（写路径经 `normalizeState` 才取 `now()`）。
2. 归一用 `state.updatedAt || now` ⇒ **`updatedAt` 为 0 的项目在被读取时被抬到当前时钟**，与「按 `updatedAt` 倒序裁 50」相互作用，可把本应淘汰的项目挤进来。
3. `remember` 未知类目静默落 `preferences`；条目值非法则该条丢弃；同类目大小写不敏感去重；单类目超 12 条淘汰最旧；**零新增时完全不写盘**。
4. `forget` 不带 `query` 时清空**全部类目**；查询匹配是**双向包含**（条目含查询 或 查询含条目）；`category` 未知等同全扫；`removed === 0` 不动盘也不推进 `updatedAt`。
5. `clearMemory` 只删当前项目键、保留其它项目；无新增/无删除路径也仍会调用一次写盘。
6. 缺 `window`、`getItem` 抛错、`setItem` 抛错三态**全部静默降级**（配额超限不报错、不重试）。
7. 返回对象经 `cloneJson` 克隆，外部改写不污染存储；但克隆走 `JSON` 往返，`undefined` 字段会被抹掉。

会话事件日志：
8. `itemType` 缺省为 `'audit'`；audit 通道要求 `payload.runEvent` 可归一，否则**整条事件丢弃**（连带 `payload: {}` 场景）。
9. `ts` 只要求「有限正数」，字符串 `'12.9'` 会**原样转数字通过**；`seq` 额外要求整数（`Math.trunc`）。二者归一严格度不对称。
10. `status` 截 **80**、`messageType` 截 **40**、`inputRefs` 截 **12**、消息正文走 `AGENT_MESSAGE_CONTENT_LIMIT = 32000`。
11. 消息快照按 `content → reply → message → question` 四级取值；**正文与状态全空**才整条丢弃；`role` 缺省 `'assistant'`。
12. 快照按角色分叉：`user` 只带 `inputRefs`、丢弃 `diagnostic/assistantContext/replyVersions`；`assistant` 反之。`task` 只在 `messageType` 非 `text` 时保留。
13. `createAgentMessageSessionEvent` 会把 `replyVersions` **从消息载荷里删掉**、改写成 `replyVersionChange` 增量；无 `previousMessage` 时增量等于全量。
14. `run.status` 三态映射 `turn.started / turn.completed / turn.updated`（终态白名单 7 项，其余一律「更新」）；approval 条目的 `itemId` 组装为 `runId:approval:step:commandId||'plan'`，非 approval 时 `itemId` 为空串。
15. 条目生命周期：终态白名单 11 项、起始白名单 4 项（`pending/queued/running/submitted`），**其余全部落 `item.updated`**（含拼错的终态）。
16. 投影 `fallbackSeq` 按**输入数组下标**回填（非排序后位置），故缺 `seq` 的事件其相对次序由入参顺序决定。
17. 投影三路截断：`runEvents` 120、`operationLedger` 120、`taskBindings` **24**；`messages` 以 `itemId || event.id` 为键**后写覆盖前写**；返回值全部克隆。
18. `compareAgentSessionProjection` 用 `JSON.stringify` 比对 ⇒ **键序不同即判为不一致**；空数组与缺省入参等价。
19. 旧状态迁移中**无效条目仍占用 `seq` 号**；且 `messages: [null]` 会**直接抛 `TypeError`**（`createAgentReplyVersionChange` 未做守卫），与投影通道的容错姿态不对称。

会话动作条：
20. `runtime` 缺 `reviseAssistantTurn` 时 `render()` 完全空转；`destroy()` 只收编辑浮层、**不移除动作条**。
21. 渲染指纹 = `itemId:activeIndex:versions.length:重新回答文案`，指纹未变且条数一致时二次 `render()` 幂等；**本地化文案参与指纹** ⇒ 切语言会强制重建动作条。
22. `busy && 已有动作条` 时只重排禁用态、不清空；但历史与 DOM 条数不一致时**只清除不重建**。
23. `replyActions` 只在末轮 `status === 'chat'` 时追加；`apply` 抛错**原文进 `setNotice`**（未走 i18n）。
24. 修订流程 `finally` 里以「占位节点是否仍在 DOM」决定是否 `setBusy(false)` ⇒ 宿主 `appendWaiting` 若不落 DOM，**忙碌态永不复位**（真实泄漏，测试已固化）。
25. 失败提示条件是 `ok === false && !stale` ⇒ `stale` 与 `ok !== false` 均静默；抛错路径同样进 `setNotice(error.message)`。
26. 助手条子节点序固定为 `[重新回答, ‹, 计数, ›]`（计数夹在两个箭头之间）。
27. 版本数达 **20** 时编辑与重新回答一并禁用；`prev` 在 `activeIndex === 0` 禁用、`next` 在末位禁用。
28. 编辑浮层：`textarea` 预填用户提问、`rows=4`、立即 `focus()`；保存按钮随 `input` 的空/非空切换 `disabled`；`Ctrl|Meta + Enter` 且 `!isComposing` 才提交；`Escape` 只关浮层不提交；同一时刻仅保留一个浮层（渲染与 `setBusy` 都会先收起）。
29. 公开的 `setBusy()` **不修改忙碌态**，只负责收编辑器并重排禁用态。

## 6. 目录账目与第 106 批口径

- 闭包记账：`b95/deps-ast.mjs src/modules/agent` → `port=81 / LEAF=0 / OK=13 / BLK=1`（对照第 104 批的 `OK=16 / BLK=1`），未落地 **17 → 14**；本仓该目录非测试源码 **64 → 67**、测试 **52 → 55**。
- 唯一剩余 BLK 仍是跨目录件 `agentModelControls.js`（缺 `components/aigenText/modelSelector.js`、`components/aigenText/runtimeModelParameterControls.js`、`modules/modelGenerationParamMemory.js`，属升代 + 真机 + 授权范畴）。
- 该目录另有 2 件历史件 `agentSkillPackage.js`、`agentSkillPackage.test.js` 自始非 Prettier 清洁形（逐字节保真端口），本批**未改写**。
- **第 106 批口径**：从剩余 13 件 `OK` 里按「受保护装配件的前置依赖」优先取 `agentProjectMemoryConversationRuntime.js`（把第 96/100 批的记忆意图与本批记忆存储接上）、`agentSessionProjectionStore` 类依赖件与 `agentSkillPicker.js`、`agentSkillRegistry.js`、`agentTurnRouter.js` 等纯逻辑件；`agentSkillPanel.js` 与呈现三件套仍指向受保护装配层，落地后仍需升代才有用户可见路径。
- 待授权的 i18n 欠账新增：本批 `agentConversationActions` 的 8 组中文文案（编辑提问 / 保存并重新回答 / 取消 / 重新回答 / 上一个版本 / 下一个版本 / 回答版本）取自中英双表，属已具备词条；但错误提示走 `error.message` **原文透出**，仍无对应词条。
