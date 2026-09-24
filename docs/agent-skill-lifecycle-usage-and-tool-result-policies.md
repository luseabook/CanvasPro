# 第95批专题：Agent 技能生命周期/用量快照/工具结果治理纯叶层 8 件落地不接线（R12 线）

## 1. 本批要补的缺口

第93批判定 `src/modules/storyboard3d/`（R09）的「纯新增可落地」子集已取尽，第94批据此转到 R12/Agent 特性区，落地 12 件「零 `import` 纯叶」。本批继续同一目录的纯叶子集。

用 `b95/deps-ast.mjs`（本批新写，改用 `@babel/parser` 走 AST 抓依赖，替代既有正则抓取器）对端口 `src/modules/agent/` 重扫：

| 口径 | 数值 |
| --- | --- |
| 端口该目录文件数 | 81 |
| 本仓开工前已落地 | 25（13 原生 + 第94批 12） |
| 未落地 | 56 |
| 其中「完全零相对依赖」的纯叶 | 14 |

本批取其中 8 件体积适中、可离线真断言者落地并配测；余 6 件纯叶（`agentCapabilityRouter` 11 947 B、`agentParameterHints` 9 905 B、`agentTaskBindingRuntime` 13 818 B、`agentDurableRunState` 7 444 B、`agentFailureDiagnostic` 7 490 B、`agentProjectMemory` 6 877 B）留待下一批单独处理——它们是本目录里最大的几件，须单独安排测试预算。

**顺带修正第94批台账的一处计数**：其 §4 记「本仓此前 14 件」，实测开工前本仓 `src/modules/agent/` 只有 **13** 件与端口同名的源码件（本批后为 33 件、端口 81 件、仍缺 48 件），即 b94 的「未落地 68 件」应为 **69** 件、其「纯叶 24 件」的口径不受影响（该数由 AST 扫描器单独得出）。

## 2. 交付物

`src/modules/agent/` 下 8 件源码（逐字节等于端口、Prettier 形态）与 8 件同名测试：

| 源码 | 行 / 字节 | 导出 | 测试 | 行 / 字节 | 项 |
| --- | --- | --- | --- | --- | --- |
| `agentClarificationPolicy.js` | 33 / 1 914 | 1 | `*.test.js` | 88 / 3 125 | 9 |
| `agentLoopPlanSelection.js` | 27 / 1 210 | 1 | `*.test.js` | 129 / 4 179 | 9 |
| `agentPanelContinuity.js` | 42 / 1 254 | 1 | `*.test.js` | 95 / 3 407 | 10 |
| `agentSkillPreferences.js` | 68 / 2 165 | 6 | `*.test.js` | 181 / 6 509 | 15 |
| `agentSkillUsage.js` | 104 / 4 288 | 4 | `*.test.js` | 137 / 5 700 | 13 |
| `agentSkillLifecycle.js` | 98 / 5 162 | 5 | `*.test.js` | 141 / 6 511 | 15 |
| `agentSkillPanelText.js` | 111 / 5 878 | 1 | `*.test.js` | 94 / 3 157 | 7 |
| `agentToolResult.js` | 169 / 6 740 | 5 | `*.test.js` | 235 / 8 093 | 15 |
| **合计** | **652 / 28 611** | **24** | **合计** | **1 100 / 40 681** | **93** |

8 件源码**全部零 `import` 语句**（`grep -c '^import'` 各为 0），件间互不引用。

### 2.1 关键行为（供接线时对照）

1. **`agentClarificationPolicy.shouldUseCreativeDefaults`** —— 四道闸门：`plan.status === 'need_clarification'` 且 `toolResultCount` 归零（`Number(x||0) > 0` 即拒）且消息命中「创作型创建」模式（中英两组、跨度分别 80 / 40 字）且 `agentContext.commands` 含 `node.create`，最后若澄清问句命中「不可推断输入」模式（哪个/请上传/`which … node`/`text-to-video|image-to-video … or`）仍判假。命令项可为裸字符串；id 只 `trim()` **不小写化**，故 `'Node.create'` 不命中。问句取 `plan.question || plan.reply`。
2. **`agentLoopPlanSelection.selectAgentLoopPlanAction`** —— 有候选时先包装成 `{...rawPlan, actions:[a0]}` 并**复用**这次校验结果作为 `i=0` 的结果；候选数 ≤ 1 或校验不通过即原样返回。循环里指纹取自**校验返回 plan 内的动作**（校验器可归一化），命中 `completedFingerprints` 时回调 `onCompletedPrefix(action, index)` 并前移；**游标只在真正命中时更新**，故「全部已完成」时返回的仍是初始首候选 plan。
3. **`agentPanelContinuity`** —— 身份是 `JSON.stringify([projectId||'', id||''])`，令牌 `{identity, epoch}`；`isCurrent` 要求未销毁 + epoch 相等 + 身份字符串相等；`invalidate` 只递增 epoch 并清空关闭快照；`rememberClosed` 额外记历史 JSON 与条数，`canResume` 须三者全等且未销毁；`isSameConversation` 只看身份；`destroy` = 置销毁位 + `invalidate`，此后 `canResume` 恒假但 `rememberClosed` 仍可让 `isSameConversation` 为真。
4. **`agentSkillPreferences`** —— 存储键 `aiCanvas.agentDisabledSkills.v1`；读取归一为 `trim + toLowerCase + 去空 + Set 去重`，JSON 非法/非数组/无 `localStorage`/抛错皆回 `[]`；写入端 **`persistDisabledAgentSkillIds` 重读 `registry.getState().disabledSkillIds`**，因此注册表若不回写状态就会落盘旧集合（本批有测试固定该现状）；`setAgentSkillEnabledPreference` 要求 `setSkillEnabled` **严格返回 `true`** 才落盘；`forgetAgentSkillPreference` 先归一 id、要求 `setDisabledSkillIds` 是函数，再剔除后写回。
5. **`agentSkillUsage`** —— `resolveAgentSkillMatch` 优先级 `explicit > title > trigger > id > semantic`；显式判定用 `(??:^|[^a-z0-9_-])\$<escaped-id>(?![a-z0-9_-])`（`i`），故 `x$skill`、`$skill-lite` 都降级为 `id` 子串命中；id 正则元字符经 `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` 转义。快照限长：条目 4、id 64、title 120、description 500、instructions 2 000、`match.kind` 32、`matchedText` / 资源名 160、资源名 12 个，`source` 40；无 id 项丢弃。`buildSelectedAgentSkillUsage` 无技能时返回 `null`，`channel` 限长 80。
6. **`agentSkillLifecycle`** —— 意图判定先过三道否决（空文本、疑问开头、否定式），再要求「技能主语」：字面 `skill/skills/技能`、`$id`/`/id` 形态，或**已安装**技能的 id/title 出现在文本里（`source !== 'installed'` 不计）。判定前会把已安装技能的 `$id`、`/id`、id、title 从文本中抹成空格，再按固定优先级 `delete > clone > disable > enable > update > inspect` 取首个命中。**端口现状缺陷**：若某已安装技能 `title` 为空串，`replaceAll('', ' ')` 会在每个字符间插入空格，导致操作词全部失配、意图判定返回 `''`（测试固定该行为）。目标解析四态 `resolved / not_found / ambiguous / missing`，`missing` 会带出全部已安装技能；中文回落路径把 `[\u3400-\u9fff]{2,}` 连续段剥离操作/名词词后（长度 ≥ 2）再去 `title + ' ' + description` 中查子串。确认/取消话术为整句白名单（可带一个尾随标点）。常量 `AGENT_SKILL_LIFECYCLE_TARGET_KIND = 'agent-skill-lifecycle'`。
7. **`agentSkillPanelText`** —— `AGENT_SKILL_PANEL_TEXT` 三层 `Object.freeze`，`zh-CN` / `en-US` 各 50 键、键集完全一致；占位符 `{count}` 只在 `skillDiagnostics`、`skillRefreshDone`，`{name}` 只在 `skillDeleteConfirmLabel`、`skillDeleteDone`、`skillImportDone`、`skillImportRestricted`、`skillSaveDone`；源码中的 `\x20` 只是普通空格转义，值内**不含 NBSP**。
8. **`agentToolResult`** —— `sanitizeAgentToolResult` 先 `sanitizeValue` 再 `trimToBudget`：`SENSITIVE_OR_BULKY_KEYS` 15 项（`authorization/apikey/api_key/base64/blob/body/buffer/bytes/data/headers/raw/request/response/secret/token`，键名小写比对）在**任意层级整键丢弃**；字符串 800、数组 12 项、深度 5（`null/number/boolean/string` 不受深度限制，`function/symbol/bigint` 转字符串）；超 `maxChars`（缺省 6 000）先折叠成 `{ok,status,commandId,errorCode,message,truncated}`（message 限长 `max(160, maxChars-320)`），仍超则退化为 `{ok,status,commandId,truncated}`。`buildAgentToolResult` 取 `execution.results` **末项**，`commandId` 来自 `action.type`、`status` 由 `ok` 推 `success|failed`、`alias` 回落到 `action.alias || action.as`。`deriveAgentCapabilityDiscovery` 只在 `ok === true` 时按三类动作取列并去重去空。`deriveAgentRuntimeProvenance` 以 `Set` 合并 previous，只对 4 个创建类动作收 `nodeId/id` 与 `nodeIds/ids`、只对 `graph.connect` 收 `edgeId/id` 与 `edgeIds/ids`。`fingerprintAgentAction` 为 FNV-1a（`0x811c9dc5` / `0x1000193`）→ `'agent-action-' + 8 位小写十六进制`，对 `{type:'node.create',args:{a:1}}` 的稳定值为 `agent-action-2c51199c`，且**与 `JSON.stringify` 键序相关**。

## 3. 接线状态（零生产消费方，记账）

全仓 `grep -rl --include=*.js "<name>" src electron api`（排除自身与本批测试）**8 件各 0 命中**；8 件开工前皆不存在于本仓。按「宁可留白并记账」**未伪造消费方**，本批不做接线。

端口侧真实导入方逐名定位并与本仓 `cmp` 分类，得到续推地图：

| 落地件 | 端口消费方 | 本仓状态 |
| --- | --- | --- |
| `agentClarificationPolicy` / `agentLoopPlanSelection` / `agentToolResult` | `agentRuntime.js` | 存在但**更早世代** |
| `agentPanelContinuity` | `agentPanel.js` | 存在但**更早世代** |
| `agentSkillUsage` | `agentRuntime.js`、`agentSessionStore.js`、`agentRunEventLog.js` | 前二为**更早世代**，后者本仓缺失 |
| `agentSkillPreferences` | `index.js`（更早世代）、`agentSkillPanel.js`（缺失） | 混合 |
| `agentSkillLifecycle` | `index.js`（更早世代）、`agentSkillConversationRuntime.js`、`agentSkillLifecycleRuntime.js`（皆缺失） | 混合 |
| `agentSkillPanelText` | `agentPanelText.js`（缺失） | 全缺失 |

即：**要让这 8 件真正生效，最小前置是 `agentRuntime.js` / `agentPanel.js` / `index.js` / `agentSessionStore.js` 四件装配体升代**（与第94批点名的 5 件高度重叠），属 in-use 行为变更，须单独成批 + 真机验证 + 授权。

## 4. 依赖闭合与目标选择审计

本批把依赖审计**从正则升级为 AST**，并发现并修掉两处工具缺陷：

- **(a) 正则抓取器会假阳性**：`b94/specs.mjs` 沿用 `from\s*['"]([^'"]+)['"]` / `import\s*['"]([^'"]+)['"]`，在反混淆文本上把 `agentCapabilityRouter.js` 报出 `](_0xe0c03e[`、把 `agentParameterHints.js` 报出一整段代码碎片。
- **(b) `b94/audit.mjs` 与首版 `b95/deps-ast.mjs` 的说明符解析基准错了目录**：相对说明符被解析到**端口树**自身（`resolve(dirname(portFile), s)`），端口内互引恒成立 ⇒ 「相对目标齐备」被系统性高估。修正为解析到**本仓同名相对路径**（`join(REPO, normalize(join(dirname(rel), s)))`）后，`src/modules/agent` 的真实分级为 **纯叶 6 / 目标齐备 20 / 受阻 22**（共 48 件未落地），而非首版误报的「42 件目标齐备」。
- **(c) AST 抓取覆盖三形态**：`ImportDeclaration`、`ExportNamedDeclaration/ExportAllDeclaration` 带 `source`（补上 `b82/scan-closure.mjs` 的盲点）、以及 `import('…')` / `require('…')` 字面量。
- **(d) 候选选择**：本批只取「完全零相对依赖」的纯叶 ⇒ **不存在闭合判断**，与 (b) 的缺陷无关，选择依然成立。
- **(e) 级联**：落这 8 件后，`agentRunEventLog`（→`agentSkillUsage`）、`agentPanelText`（→`agentSkillPanelText`）、`agentSkillPanel` 等 **8 件端口文件新进入「目标齐备」**；`agentSessionStore`/`agentRuntime` 一类仍受装配体世代制约。

## 5. 已执行的离线验证

| 项 | 命令要点 | 结果 |
| --- | --- | --- |
| 逐字节保真 | `cmp -s` 源码 vs `b95/port/`（已 Prettier 的端口副本） | 8/8 一致，源码自始未被改写 |
| 语法 | `node --check` × 16 | 全 OK |
| 风格 | `prettier --check` × 16 | 全部通过（首轮测试文件经 `--write` 归一） |
| 本批测试 | `node --test` × 8 文件 | 首跑 90/92 → 修 2 处**期望写错** → **93/93 全绿** |
| `src/**` 全量 | `node --test $(find src -name '*.test.js')` | 2 429/2 386/43 → **2 522/2 479/43**（恰好 +93/+93/±0） |
| 失败名集合 | 与 `b85-fails.txt` `diff` | **逐名相同**（43 项，全部归属缺失夹具 `tests/testPreviewDom.js`） |
| `electron/**` 全量 | `node --test $(find electron -name '*.test.js')` | 沿用 **1 649/1 648/1**（本批未触碰） |
| 保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` **未变** |
| 工作树 | `git diff --cached / --name-only / ls-files --others / ls-files -u` | `0 / 67 / 662 / 0`（+16 = 8 源码 + 8 测试） |

首跑 2 处失败均为**测试期望写错**、实现未改：`agentPanelContinuity` 用例把会话传成 `undefined` 从而触发形参缺省值（改传 `null` 与 `{}`）；`agentSkillPreferences` 的 `forget` 用例假设落盘的是剔除后集合，实际 `persist` 重读 `getState()`（改为状态型假注册表，并另加一条用例固定「状态未回写时落盘旧集合」）。

**未执行**：真机 Electron 启动、渲染器面板实际操作、任何联网或付费 AI 调用。UI 验收仍欠，本批不声称总体完成。

## 6. 未执行的验收项

- R12 的渲染器侧可见行为（技能面板、澄清回落、运行步骤呈现）需真机验证。
- `agentSkillPanelText` 的词条是模块内冻结表，**未并入** `src/i18n/messages/*`（纪律禁止修改），故不走 i18n 回退链，接线时需确认取表逻辑与当前语言解析一致。
- 端口缺陷（§2.1 第 6 条空 `title` 致意图判定失效、§5 的 `persist` 重读语义）只记录未修，接线前须与产品确认预期。

## 7. 约束复核

- 未改 `api/freeImageHostApi.js`、未改 `src/i18n/messages/*.js`、未新增 npm 依赖。
- 未做 `git commit` / `push` / 发布；未清理未跟踪文件。
- 端口侧只读；产物全部经 `deobf-tools/b95/port/` 中转，未把临时目录变成运行时依赖。
- 未伪造消费方、未伪造 shim、未打端口缺陷补丁（保字节保真）。
- **未做升代**：`agentRuntime.js`、`agentPanel.js`、`index.js`、`agentSessionStore.js`、`agentContextBuilder.js`、`agentConversationStore.js` 等 in-use 装配体本批一律未触碰。

## 8. 下一批建议

1. **续取 `src/modules/agent` 余 6 件纯叶**（`agentCapabilityRouter`、`agentParameterHints`、`agentTaskBindingRuntime`、`agentDurableRunState`、`agentFailureDiagnostic`、`agentProjectMemory`，合计约 57 KB）——本目录内闭合风险最低的一类；因单件体积大，建议分两批（每次 3 件）并给足测试预算。
2. **再取「目标齐备 20 件」**：`agentAssistantConversation`、`agentTurnRouter`、`agentContextDigest`、`agentConversationChoices`、`agentMessageTime`、`agentSkillEditor`、`agentSkillPicker`、`agentSkillRegistry`、`agentSkillAuthoring`、`agentPrecreatedNode`、`agentExternalInformation`、`agentExternalToolRegistry`、`agentComposerAttachmentController`、`agentRunEventLog`、`agentPanelText`、`agentConversationActionText`、`agentCapabilityDiscovery`、`agentActionPostconditions`、`agentConversationCanvasTransferRuntime`、`agentSkillLoader`。**须逐件读整文件复核被依赖符号的导出面与世代**（`@babel/parser` 只判「文件在不在」，不判「符号齐不齐、世代同不同」），其中 `../../i18n/index.js`、`../../manifests/index.js`、`../../components/aigenText/*`、`../canvasCommands/index.js`、`../../services/desktopBridge.js` 是本仓**已在使用**的跨模块依赖，落这些件前须先确认其导出面与本仓世代一致，否则按纪律记为受阻而非伪造 shim。
3. **装配体升代批次**（须单独成批 + 真机验证 + 授权）：`agentRuntime.js` / `agentPanel.js` / `index.js` / `agentSessionStore.js` / `agentContextBuilder.js` / `agentConversationStore.js`；升代后本批与第94批的 20 件才可真正接线。
4. **R09 现状不变**：`src/modules/storyboard3d` 仍缺 52 件、相对目标齐备仅 2 件且均被 `src/core/math.js` 导出面阻住。
5. **其它欠项**（各自须授权或单独成批）：`web-preview/*` 5 条路由渲染器侧消费点、`storage-migration/prepare`、44 个未移植 CSS 自定义属性、`nodeBatchExport.toasts.*` 7 键 × 2 语言与 `storyboardExportPending` 1 键、`nativeContextMenuIcons` 待 `webPreviewViewManager` 升代、`main.js` chrome-shell 最终装配、后端 spawn 站点切换。
