# R12 / Agent 线第 96 批：持久化运行状态、失败诊断与项目长期记忆（3 件纯叶，落地不接线）

## 1. 缺口与开工复核

本批继续 R12/Agent 线，从 `src/modules/agent` 的「零相对导入纯叶」中取第 3 批 3 件。开工前用第 95 批新写的 AST 审计器 `b95/deps-ast.mjs`（`@babel/parser`，识别 `ImportDeclaration` / `ExportNamedDeclaration` / `ExportAllDeclaration` 与动态 `import()` / `require()`，相对说明符**按仓库路径**解析）重扫：

| 口径 | 数值 |
| --- | --- |
| 端口 `src/modules/agent` 文件数 | 81 |
| 本仓落地前（第 95 批后） | 33 |
| 未落地 | 48 |
| 其中零相对导入「纯叶」 | 6 |
| 目标齐备（有依赖且依赖在仓） | 20 |
| 受阻 | 22 |

第 95 批 §8 建议「纯叶按每批 3 件取」，本批取语义同属「运行态与诊断」的 3 件：`agentDurableRunState.js`、`agentFailureDiagnostic.js`、`agentProjectMemory.js`。余下 3 件纯叶（`agentCapabilityRouter`、`agentParameterHints`、`agentTaskBindingRuntime`）留给第 97 批。

按既定口径，扫描器结论**不单独采信**：3 件均逐行通读，实测 `grep -c '^import'` 各为 0，且彼此互不引用，故闭合判断不依赖任何工具。

## 2. 交付物

| 文件 | 行 / 字节 | 导出 |
| --- | --- | --- |
| `src/modules/agent/agentDurableRunState.js` | 181 / 8 618 | 5 |
| `src/modules/agent/agentFailureDiagnostic.js` | 197 / 8 699 | 4（含 `agentFailureDiagnosticInternals`） |
| `src/modules/agent/agentProjectMemory.js` | 156 / 7 749 | 8 |
| `src/modules/agent/agentDurableRunState.test.js` | 341 / 12 995 | 15 项 |
| `src/modules/agent/agentFailureDiagnostic.test.js` | 236 / 10 302 | 10 项 |
| `src/modules/agent/agentProjectMemory.test.js` | 227 / 9 780 | 14 项 |

源码合计 **534 行 / 25 066 字节 / 17 个导出**；测试合计 **804 行 / 33 077 字节 / 39 项**；本批新增 **1 338 行 / 58 143 字节**。三件源码 **逐字节等于端口**（先 prettier 预格式化到 `b96/port/`，再原样复制入仓，`cmp` 3/3 `IDENTICAL`，源码本身此后未被改写）。

### 2.1 关键行为（以测试固定，不改实现）

1. `agentDurableRunState` —— 恢复态归一层。操作记录须 `id`(或 `operationId`) + `runId` + `commandId` 三者齐备，否则整条丢弃；`status` 缺省 `pending`；`ok` 是**三态**（仅严格 `true`/`false` 生效，其余一律 `null`）；`repairAttempts` 钳在 `[0,1]`；`startedAt` 非正或非有限时回落入参 `now`，而 `completedAt` 缺省时回落的是 **`startedAt` 而不是 `now`**；`fingerprint`/`errorCode` 截 120、`verificationStatus` 截 40；台账 `slice(-120)`，任务绑定 `slice(-24)`。检查点 `normalizeAgentResumeCheckpoint` 须 `originalMessage` + `conversationId` + `projectId` 三者齐备；`pendingKind === 'confirmation'` 归一为 `'interrupted'`；`precreatedNode` **仅在 `nodeId` 与 `type` 同时存在时才出该键**（否则键整个缺席）；`toolResults` 每项须有 `commandId`，`message` 截 480、`errorCode` 截 120；`failedFingerprints` 的键截 120 且**丢弃空键与计数 ≤ 0 的项**，故 `Number('abc') → NaN → max(0,NaN) → NaN > 0 为假` 会被过滤掉；`plannerExtra.inputRefs` 取 `nodeId || id` 并截 12。
2. `agentFailureDiagnostic` —— 失败归因与文案。`normalizeErrorCode` 把任意串大写、非 `[A-Z0-9_.-]` 转 `_`、截 80，**仅在结果为空时才用兜底码**（规划侧不传兜底 ⇒ 空串）。归因优先级：`reason === 'no_action'` → `AGENT_PLAN_FAILED` → 三枚不可执行码（`UNKNOWN/DEFERRED/BLOCKED_AGENT_ACTION`）→ 任意其它校验码（`PLANNER_INVALID_ACTION`）→ 才看 `cause` 文本（鉴权 → 限流 → 超时 → 网络 → 兜底请求失败），**校验码存在时 `cause` 完全不参与**。文案表 `zh-CN`/`en-US` 各 10 个错误码 + 2 个阶段标签 + 3 个恢复按钮，未知码回落 `PLANNER_REQUEST_ERROR`、未知阶段键回落 `planning`；`normalizeLocale` 判据是 `toLowerCase().startsWith('en')`，故 `'English-British'` 也走英文包（已用测试固定）。`step = max(1, trunc(step)+1)`；`completedSteps` 规划侧只数 `ok === true`，执行侧在显式 `completedSteps` 为有限数时优先、否则数 `results` 中 `ok !== false`（故缺省与 `null` 都算完成）；规划诊断 `retryable` 恒 `true`，执行诊断 `retryable = Boolean(recovery)`。
3. `agentProjectMemory` —— 项目长期记忆。四类 `brandVoice` / `preferredModels` / `namingRules` / `preferences`，每类折叠空白 + trim + 截 240、大小写不敏感去重、保留**最后 12 条**；`projectId` 空则 `'default_v2_project'` 且截 160；`updatedAt` 走 `Math.max(0, Number(updatedAt || now) || 0)`，因此**真值但非有限（含负数）会短路掉 `now` 最终夹回 0**（已用测试固定）。意图判定顺序为 `inspect → clear → forget → remember`，前三类是整句白名单（`^…$` + 允许尾随标点），`remember` 须先过「能力提问闸门」（`你能长期记住…` / `do you remember…` 一律不算）再要求 `记住:` / `remember` / `保存为项目偏好` 前缀、`以后|从现在开始|from now on|always` 前缀，或「本项目 / for this project」范围前缀**且**命中类别词或「偏好」。清洗链为 `记住前缀 → 项目范围 → 未来前缀 → 类别标签 → 模型动词 → 首尾标点`；两处端口现状值得记：分句只用 `；;` 与换行切分，而 `normalizeText` 已先把 `\n` 折叠成空格，所以**换行分隔的多条会合并成一条**；类别标签后若紧跟「都选用」这类组合，模型动词正则 `^(?:默认|优先)?(?:都)?(?:用|使用|选择)` 不匹配，动词会留在值里（`默认模型都选用 seedream → 都选用 seedream`）。两者均以断言冻结、未打补丁。

## 3. 接线状态

本批 3 件在本仓**零生产消费方**：全仓 `grep -rl --include=*.js "<name>" src electron api`（排除自身源码与本批测试）**各 0 命中**，故按「宁可留白并记账」**未接线、未伪造消费方**。端口侧真实导入方逐名与本仓比对：

| 端口消费方 | 本仓状态 |
| --- | --- |
| `agentRuntime.js` | 存在但属更早世代（仓 32 912 B / 端 75 170 B） |
| `index.js` | 存在但属更早世代（仓 767 B / 端 4 291 B） |
| `agentConversationStore.js` | 存在但属更早世代（仓 11 370 B / 端 26 561 B） |
| `agentSessionStore.js` | 存在但属更早世代（仓 5 973 B / 端 20 169 B） |
| `agentSessionEventLog.js` | 整体缺失（端 14 380 B） |
| `agentProjectMemoryStore.js` | 整体缺失（端 4 503 B） |
| `agentProjectMemoryConversationRuntime.js` | 整体缺失（端 4 115 B） |

即本批把「Agent 崩溃后可恢复」这条链的**归一与判读层**备好，但要真正生效仍需 4 件装配件升代 + 3 件缺失消费方补齐；后者不在本批范围。

## 4. 依赖审计结论

- (a) AST 审计器在第 95 批修正解析目录后，本批继续按「仓库路径」解析，结果与逐行通读一致：3 件确为零相对导入。
- (b) 落地后重跑：未落地 48 → **45**，纯叶 6 → **3**，目标齐备 20 → **22**（`agentProjectMemoryStore.js`、`agentProjectMemoryConversationRuntime.js` 因本批落件而新解阻），受阻 22 → **20**。⇒ 「纯叶不解锁新件」的上一批结论**不总成立**：纯叶若被缺失消费方直接引用，仍会把该消费方从受阻转入目标齐备。
- (c) 目标齐备只说明**文件在位**，不保证**具名导出与世代匹配**；第 97 批起取该层时须逐件核对被依赖模块的导出符号。

## 5. 已执行的离线验证

| 检查 | 结果 |
| --- | --- |
| `cmp` 端口预格式化副本 | 3/3 `IDENTICAL` |
| `node --check`（源码 3 + 测试 3） | 6/6 OK |
| `prettier --check` 本批 6 件 | 首轮 3 个测试文件告警，`--write` 后全过；**3 件源码自始未被改写** |
| `node --test` 本批 3 个文件 | **39/39 全绿**（首跑 35/39，修正 4 处测试自身期望） |
| `src/**` 全量 sweep | 2 522/2 479/43 → **2 561/2 518/43**（恰好 +39/+39/±0） |
| 43 项失败名单 vs `b85-fails.txt` | `diff` 空（`diff-exit=0`），仍全部归属缺失夹具 `tests/testPreviewDom.js` |
| `electron/**` 全量 sweep | **1 649/1 648/1**（本批未触碰任何 electron 文件） |
| `api/freeImageHostApi.js` md5 | `1e0458013f5341c99f21faefc1d34d3f` **未变** |
| git 快照 | `0/67/663/0` → `0/67/669/0`（+6） |

首跑 4 处失败均判定为**测试写错**、实现一字未改：①`agentFailureDiagnostic` 误以为 `locale:'English'` 会回落中文（实际 `startsWith('en')` 命中英文包），改为同时冻结两个分支；②`agentProjectMemory` 误以为 `Number(updatedAt)` 为 `NaN` 时会回落 `now`（实际 `updatedAt || now` 先短路），改为断言结果 0；③`namingRules` 清洗漏算类别标签后的 `(?:是\|为\|用\|使用\|[:：])?` 会把「用」一起吃掉，期望由「用中文编号」改「中文编号」；④`默认模型都选用 seedream` 期望过度清洗，改为端口现状「都选用 seedream」并补一条能正常清洗的对照用例。测试**未联网、未跑 Electron、未起服务、未打开窗口、未写仓库外运行状态**（全部为纯函数入参与返回值断言）。

## 6. 未做的验收

三件均无消费方，因此不存在 UI 或运行时验收面。真实 Agent 运行循环下的检查点写入/恢复（含崩溃后重启）、真实模型服务错误文本的归因召回率、中英双语诊断文案在面板中的实际排版、项目长期记忆的真实持久化（`agentProjectMemoryStore`）与提示词注入效果、真实会话历史中 `remember/forget` 语料的误判率**均未核对**；未打包、未构建、未启动。

## 7. 约束复核

未触碰受保护文件；未越权改动 `D:\shuocancas`（仅只读）；未新增 npm 依赖（测试与检查只用 Node 内置 `node:test` 与仓库外既有 prettier/`@babel/parser`）；未修改 `src/i18n/messages/*.js`；未接线、未伪造消费方、未为端口缺陷打补丁（第 2.1 与第 5 节所列端口现状均以测试冻结）；未提交、未推送、未触发构建或发布。

## 8. 下一批建议

- **第 97 批**：取剩余 3 件纯叶 `agentCapabilityRouter.js`（11 947 B）、`agentParameterHints.js`（9 905 B）、`agentTaskBindingRuntime.js`（13 818 B），合计约 35.7 KB；本批已证实这三件在旧正则扫描器下会产出假阳性说明符，**必须以 AST 结果 + 逐行通读为准**。
- **其后**：22 件「目标齐备」按簇取（技能簇 `agentSkillRegistry`/`agentSkillAuthoring`/`agentSkillPicker`/`agentSkillEditor`/`agentSkillLoader`；呈现簇 `agentPanelText`/`agentMessageTime`/`agentConversationChoices`/`agentRunEventLog`；运行时簇 `agentTurnRouter`/`agentAssistantConversation`/`agentContextDigest`/`agentPrecreatedNode`/`agentActionPostconditions` 等），**逐件核对被依赖模块的具名导出与世代**，特别是跨模块依赖 `../../i18n/index.js`、`../../manifests/index.js`、`../canvasCommands/index.js`、`../../components/aigenText/*`、`../../services/desktopBridge.js`。
- **持续受阻**：20 件仍依赖未落地模块；`src/modules/agent` 的 4 件装配件升代（`index.js`、`agentRuntime.js`、`agentPanel.js`、`agentConversationStore.js`、`agentSessionStore.js`）与 `api/agentAssistantApi.js` 缺失属**行为变更**，各自须单独成批 + 真机验证 + 授权；`src/core/math.js`（32→52 导出、62 消费方）、`rendererVirtualization.js`、`canvasMediaLocalService.js`、`media-clip` 世代归一、`main.js` chrome-shell 最终装配、后端 spawn 站点切换同理。
