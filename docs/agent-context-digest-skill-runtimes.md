# 第 102 批：Agent 上下文摘要 · 外部信息 · 运行事件日志 · 技能编辑与两条技能会话运行时

本批属于 R12（Agent 会话 / 技能管理）纯源码补全线，按第 101 批 §8 排定的「单点卡口件」清单整批取 OK 层 6 件。
移植源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\src\modules\agent\`（0.7.16 安装版反混淆镜像）；
本批暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b102\port\`。

## 1. 落地清单

| 文件 | 行 / B | 导出 | 目录内依赖 |
| --- | --- | --- | --- |
| `src/modules/agent/agentRunEventLog.js` | 109 / 5 128 | 2 | `./agentSkillUsage.js` |
| `src/modules/agent/agentContextDigest.js` | 142 / 6 212 | 7 | `./agentConversationText.js` |
| `src/modules/agent/agentExternalInformation.js` | 146 / 7 000 | 8 | `./agentDocumentInput.js` |
| `src/modules/agent/agentSkillEditor.js` | 132 / 5 938 | 1 | `./agentPanelElements.js` |
| `src/modules/agent/agentSkillAuthoringRuntime.js` | 251 / 9 345 | 1 | 4 件同目录模块 |
| `src/modules/agent/agentSkillLifecycleRuntime.js` | 492 / 18 830 | 1 | 3 件同目录模块 |

合计 **1 272 行 / 52 453 B / 20 具名导出**。配套测试 6 件 **2 180 行 / 82 949 B / 125 例**（20+20+20+14+24+27）。

## 2. 各件职责与关键行为

- `agentRunEventLog.js`：`normalizeAgentRunEvent` 把任意事件体归一为 14 键冻结记录（键序固定 `id,runId,conversationId,projectId,type,status,step,commandId,ok,errorCode,message,channel,ts`）；`replayAgentRunEvents` 按 ts 升序重放并聚合出 `eventCount / startedAt / endedAt / commandSequence / approvals / errors / lastStatus` 等运行摘要。
- `agentContextDigest.js`：三个常量（步长 1、上限 12、每节 8）+ 摘要归一、批次选取、游标附加、提示词压缩。批次窗口是 `slice(coveredIndex + 1, len - recentLimit)`，即「已被摘要覆盖之后」到「保留给最近的原文之前」，两端都可为空。
- `agentExternalInformation.js`：`web.read_url` 工具的来源抽取（文档优先、URL 其次、共享上限 3）、意图判定（显式读链 vs 仅含链接 vs 判否）与提示词预算（`Math.max(1000, floor(maxContentChars / n))`，`maxContentChars` 是**第二个**实参）。
- `agentSkillEditor.js`：技能编辑浮层，纯 DOM 组装（`agentPanelElements` 工厂），五级 maxLength `64/120/600/2000/24576`，`SKILL_ID_PATTERN` 校验与小写归一。
- `agentSkillAuthoringRuntime.js`：「创建技能」对话分支。意图闸门 → 模型创作 → 归一化 → id 冲突改名 → 落盘（撞车时换 id 重试一次）→ 回写历史与当前运行；返回 `{isAvailable, matches, getPending, run, answer}`。
- `agentSkillLifecycleRuntime.js`：`inspect/update/clone/enable/disable/delete` 六操作的会话分支，含目标四态解析、删除两段式确认、创作期追问续跑；返回 `{getPending, matches, run, answer}`（**无 `isAvailable`**）。

## 3. 核验记录（全部离线）

- `cmp`：6/6 与 `b102/port/` 逐字节 `IDENTICAL`；`node --check` 6/6 通过。
- 具名导出前置核验 `b100/verify-exports.mjs`：**18/18 `ok`、零 `MISSING`、零 `DEP-FAIL`**。
- `node --test` 本批 6 件：**125/125 通过**（首跑 lifecycle 件 23/27，4 处全部为测试自身期望偏差，实现一字未改，见 §5）。
- `prettier --check`：本批 6 件测试改写后复查全过（6 件源码自始未被改写）。
- `src/**` 全量 sweep（248 件测试文件）：`2 775/2 732/43 → 2 900/2 857/43`（恰好 +125/+125/±0）；失败名单与 `deobf-tools/b85-fails.txt` `diff-exit=0`，43 项仍全部归属缺失夹具 `tests/testPreviewDom.js`，**未伪造**。产物：`b102/src.tap`、`b102-fails.txt`。
- AST 依赖审计 `b95/deps-ast.mjs src/modules/agent`：`port=81 / LEAF=0 / OK=20 / BLK=4`，`b102/audit.txt` 留档。
- 反向 `grep`（`src`、`api`、`electron`、`main.js`）：6 件的生产引用点 **0 命中**。
- 守卫件 `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` 未变。

## 4. 接线结论

6 件**零生产消费方**，因此本批**未接线、未改装配件、未伪造消费方**。移植镜像中它们的真实导入方分两类：

- 受保护装配件（升代须单独成批 + 真机验证 + 授权）：`index.js`、`agentRuntime.js`、`agentPanel.js`、`agentContextBuilder.js`、`agentConversationStore.js`、`agentSessionStore.js`；
- 本仓整体缺失、尚无落盘载体的同名件。

`agentSkillEditor.js` 与两条技能运行时最终要靠 `agentSkillPanel.js` / `agentSkillConversationRuntime.js` 装配，这两件现已进入 OK 池但仍未落地——**在它们落地并完成 `index.js` 升代之前，技能对话管理不存在任何用户可见路径**。

## 5. 以断言冻结的端口现状（未打补丁）

1. `normalizeAgentRunEvent(null)` 抛 `TypeError`（缺省实参只兜 `undefined`），而 `[null]` 传入 `replayAgentRunEvents` 同样抛；数组里的 `undefined` 被静默跳过 ⇒ **同一件非法输入两种形状行为相反**。
2. `ts` 非有限值时回落到第二实参（缺省 0）；`message` 折叠换行与首尾空白后截 320 并补 `...`；`channel` 只裁首尾空白（内部连续空格保留）后截 80。
3. `ok` 是三态：缺键时该键**不出现**，而非 `false`。
4. 摘要批次窗口是**左开右不闭**的下标式窗口，`recentMessageLimit` / `minBatchMessages` 各有下限 1；游标 `itemId` 优先于 `ts`，ts 相同取下标**最后一个**；正文**不 trim**，只有 2000 字符上限触发中段省略（标记 `\n[… middle omitted …]\n`）。
5. `selectAgentContextDigestBatch([null])` 抛 `TypeError`。
6. 外部信息：URL 尾标点裁剪对 CJK 终止符不生效；`documentFiles` 缺 `displayName/fileName` 的条目整条丢弃；未知 `sourceKind` 一律按 URL 形态压缩。
7. 技能编辑器：`text` 为必填但未校验类型（`()`、`{}`、非函数均抛 `TypeError`）；更新态锁 id 并把焦点给标题；`setBusy` 只动取消按钮，保存按钮 `disabled` 恒为 `false`；关闭再打开保留已填值，但 `open(null)` 会清空并使 `readDefinition()` 校验失败。
8. 创作运行时：`existingSkills` 标题压缩是**硬 `slice(0,120)` 不加省略号**、上限 100 项；`history` 直接透传 store 的**活数组引用**（非副本）；`localeProvider` 在成功分支抛错会让整个 `run` **reject** 而不是返回 failed；`author` 缺席时回的是**未本地化**的 `'Skill authoring is unavailable.'`。
9. 生命周期运行时：`matches` **不受** author/saveSkill 可用性影响（与创作件不同）；`inspect` 成功**不清**挂起项（只有写操作成功才清）；挂起项里的 `options` 恒为 `[]`（模型给的候选只回给 UI 不入库）；`$id` 形态只查安装表 ⇒ vendor 条目判 `SKILL_NOT_FOUND` 而不是追问；未识别的 operation 字符串一律落到 create 分支按「复制」文案回执；模型失败与异常**原文透出**，不走 i18n。

## 6. 目录账目与下一批

- `src/modules/agent`：未落地 **30 → 24**、OK **21 → 20**（6 出 5 进）、**BLK 9 → 4** ⇒ 单批解阻 5 件。第 101 批 §8 预测「取齐 6 件可把 BLK 压到 2」，实测为 **4**，差在 `agentSkillConversationRuntime` 与 `agentContextDigestRuntime` 等件本身进入 OK 池后又各自成为新的单点卡口，此为对预测的**修正而非达成**。
- 剩余 BLK 4：`agentConversationCapabilityRuntime`（缺 `agentExternalInformationRuntime`、`agentSkillConversationRuntime`）、`agentModelRequestRuntime`（缺 `agentContextDigestRuntime`）、`agentTextConversationRuntime`（缺 `agentAssistantConversationRuntime`）、`agentModelControls`（唯一需要目录外在产模块：`components/aigenText/modelSelector.js`、`runtimeModelParameterControls.js`、`modelGenerationParamMemory.js`，属升代范畴）。
- 本仓该目录非测试源码 **51 → 57** 件、测试 **39 → 45** 件（端口 81）。
- **下一批（第 103 批）**：按解阻面取 `agentContextDigestRuntime.js` + `agentExternalInformationRuntime.js` + `agentSkillConversationRuntime.js`（三件落地后 BLK 可望 4 → 1），再评估 `agentSessionEventLog.js`、`agentSkillPanel.js`。仍欠（不变）：`tests/testPreviewDom.js` 夹具（43 项失败根因，不伪造）、`api/agentAssistantApi.js`、`src/core/math.js` 升代（32→52 导出、62 消费方，R09 最后 2 件的唯一阻塞）、`rendererVirtualization.js`、`canvasMediaLocalService.js`（28 消费方）、`components/aigenText/*` 模型选择器簇、`web-preview/*` 5 条路由渲染器侧消费点、`storage-migration/prepare`、44 个未移植 CSS 自定义属性、`main.js` chrome-shell 最终装配与后端 spawn 站点切换、i18n 词条（`taskCompleted`/`taskStarted`/`taskPending`、第 101 批硬编码中文错误、本批 `'Skill authoring is unavailable.'` 与生命周期运行时的原文透出），以上均须单独成批与授权。

**本批不构成任何用户可见行为完成**：上下文摘要回灌、外部链接读取、运行事件重放、技能编辑浮层、技能对话式创作与管理均未在真实渲染层验收。
