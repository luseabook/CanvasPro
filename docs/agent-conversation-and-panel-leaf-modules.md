# 第94批专题：Agent 会话/面板纯叶层 12 件落地不接线（R12 线）

## 1. 本批要补的缺口

R09（分镜 3D）在第 93 批后已到「纯新增尽头」：`src/modules/storyboard3d/` 剩余未落地件里**相对目标齐备的只剩 2 件**，且两件都受阻于 `src/core/math.js` 的导出面（须先做升代 + 真机验收 + 单独授权）。因此本批按第 93 批 §8 的建议**换特性区**，取 `b86/deps.json` 里点名且依赖闭合的 **R12 Agent 线**（`src/modules/agent`）。

端口 `src/modules/agent/` 有 **81 件**源码，本仓落地前只有 **14 件**（且属更早世代），**68 件未落地**。用 `deobf-tools/b94/audit.mjs`（把第 92 批的目录级审计脚本泛化为可传 scope）扫出：**32 件相对目标齐备可落地**，其中 **24 件是完全没有任何 `import` 的纯叶模块**。

本批取这 **24 件纯叶里语义最自洽的一组 12 件**落地：**Agent 会话呈现与面板原语**（流式正文裁剪、会话文本压缩、消息列表滚动、滚轮接管、写作意图判定、文档输入校验与来源构造、引用上下文回采、助手 Markdown 归一、完成证据推导、面板元素工厂、会话→画布搬运、运行步骤投影）。选择纯叶层的理由是：它们**不引用任何模块**，因此不存在「被依赖模块世代不符」的风险，是本特性区里可以安全批量落地的最大子集。

## 2. 交付物

12 件源码（`cmp` 逐字节等于端口，合计 **652 行 / 30 980 B**，**24 个导出**）+ 12 件测试（合计 **1 271 行 / 48 547 B**，**126 项**）+ 本专题文档 1 份。

| 文件 | 行/字节 | 导出 | 作用 |
| --- | --- | --- | --- |
| `agentStreamingProse.js` | 9 / 485 | 1 | 裁掉流式正文里尚未收完的 ```` ```agent-choice ```` 选项围栏 |
| `agentConversationText.js` | 13 / 597 | 2 | `AGENT_MESSAGE_CONTENT_LIMIT`（0x7d00=32000）与「头 40% + 省略标记 + 尾」压缩 |
| `agentConversationScroll.js` | 15 / 693 | 2 | 消息列表瞬时滚到底（写入期强制 `scroll-behavior: auto`） |
| `agentScrollableWheel.js` | 19 / 864 | 1 | 面板内滚轮接管，按 `deltaMode` 换算像素/行(×16)/页(×clientHeight) |
| `agentConversationIntent.js` | 32 / 2265 | 4 | 写作请求 / 会话续写 / 自定义选项答案 / 故事交付物四类意图判定 |
| `agentDocumentInput.js` | 48 / 2078 | 4 | `document.read_file` 工具号、3 份上限、文档校验与来源记录构造 |
| `agentReferenceContext.js` | 41 / 2019 | 1 | 从操作台账自后向前回采「最近新建节点/最近创建组」 |
| `agentAssistantMarkdown.js` | 81 / 3589 | 1 | 助手 Markdown 版式修复：块边界、列表、孤立 `**` 剥离 |
| `agentCompletionEvidence.js` | 79 / 3364 | 2 | 从用户话语推断应新建的节点类型并核验完成证据 |
| `agentPanelElements.js` | 57 / 3869 | 3 | 面板 DOM 原语：元素/按钮工厂与 19 个内联图标 SVG |
| `agentConversationCanvasTransfer.js` | 113 / 5163 | 1 | 「把第 N 版写入选中节点提示词/画布文本节点」的搬运意图解析 |
| `agentRunSteps.js` | 145 / 5994 | 2 | 把 run 事件流投影为末 8 条执行步骤，并导出冻结的内部工具对 |

### 2.1 关键行为（供接线时对照）

- **`agentStreamingProse`**：围栏须位于**行首**且后随空白或行尾才算完整；未收完时按「最后一个换行之后的前缀」隐藏。**注意**：任何以 `\n` 结尾的文本，其末行为空串，`'```agent-choice'.startsWith('')` 恒真 ⇒ 整段按 `trimEnd()` 收口（端口原样行为，测试已覆盖）。
- **`agentConversationText`**：省略标记 `'\n[… middle omitted …]\n'` 长 22；`limit < 22` 时结果是**标记自身的前缀**而非原文；`预算 = limit - 22`，头占 `floor(预算 * 0.4)`、尾占余量，尾为 0 时不拼尾。
- **`agentConversationScroll`**：`scrollTo` 期间把 `style.scrollBehavior` 临时置 `auto`，写完按原值恢复；原值为空时优先调 `style.removeProperty('scroll-behavior')`，无该方法才回落为 `''`。
- **`agentScrollableWheel`**：`deltaMode` 未识别时因子为 1；`clientHeight` 为 0/缺失时页因子取 `max(1, …)`；目标位置钳在 `[0, scrollHeight - clientHeight]`；**只有位置真的变化时才 `preventDefault()`**，`stopPropagation()` 无条件调用。
- **`agentCompletionEvidence`**：先过**否定式**闸门（`不要|别|无需|不用|先不` + 10 字内 `创建|新建|添加`，以及 `do not|don't|no need to` + create/make/add/insert）命中即返回 `''`；`targetKind` 简写/全写等价且**优先于文案关键词**；`生成|绘制|渲染` **默认不算创建动词**，须 `includeGenerateVerb: true`；核验阶段节点类型比较前 `String(...).trim()`。
- **`agentConversationCanvasTransfer`**：两类意图各 3 条正则（中/中/英）；命中后只采纳 `role === 'assistant'` 且 `status` 缺省或 `'chat'` 且正文非空的历史项；`第N版` 支持中文数字一–十与阿拉伯数字，指名版本缺失时回落「最后一条候选」；`追加|补充|append|add to` 切 `mode: 'append'`，否则 `'replace'`；正文取 `content || reply || message || question`。**端口缺陷（记账，未改）**：意图命中但**历史为空**时，`history.at(-1)` 得 `null` 再进 `getAssistantText(null)` 会抛 `TypeError`，测试以 `assert.throws(..., TypeError)` 固化该现状。
- **`agentRunSteps`**：`runId` 取 `currentRun.id`，否则从事件流**反向**找首个带 `runId` 的项；两者皆空直接 `[]`。步骤键为 `<runId>:approval:<step>` / `:tool:<step>:<commandId>` / `:task-wait:<step>` / `:current` / `:terminal`，同键 `upsert` 合并。`ok === false` 用**严格比较**，故 `ok` 缺省与 `ok: null` 都记 `success`。终态集合 `{success, failed, stopped, cancelled}`；`stopped` 归一为 `cancelled` 但标签仍是「任务已停止」。非终态 `waiting_tasks` **在已有等待步时被抑制**。结果 `slice(-8)`。`:current`/`:terminal` 的 `ts` 来自 `Date.now()`（测试只断言类型为数值）。
- **`agentDocumentInput`**：`validateAgentDocumentFile(file)` 在**未注入校验器**时只判文件真假并给 `请选择文档。`；失败文案统一过 `剧本文件→文档`、`作为剧本读取→作为文档读取` 归一。来源记录里文件名截断 255、扩展名截断 12、`warnings` 仅数组分支生效并去空白 + 截断 8、`pageCount` 仅有限数值时出现、`truncated` 严格 `=== true`。
- **`agentReferenceContext`**：**解构默认值只对 `undefined` 生效**，故 `canvas: null` 会抛（已按现状拆成两条用例）。台账**自后向前**回溯，同时受 `creationGroupLimit`（默认 8）与 `createdNodeLimit`（默认 12）双闸约束；只认 `status === 'success'` 且 `ok !== false`；节点须仍存在于画布且跨操作去重。
- **`agentPanelElements`**：`createAgentButton` 恒为 `type="button"`，`title` 同步写 `aria-label`；带 `icon` 时走 `innerHTML` 并在有文案时追加 `.agent-btn-label` span，无 `icon` 时走 `textContent`；`disabled` 同步写 `aria-disabled="true"`。`agentIconSvg` 图标表 19 项，未知名回落空内芯。
- **`agentAssistantMarkdown`**：**含三个反引号的整段直接透传**（仅做 CRLF 归一与 `trim`）；否则依次做分隔线块边界修复、句号/冒号后小标题断段、标题行断开、`N.`/`N)` 列表项换行、孤立 `**` 剥离、`\n{3,}` 折叠。

## 3. 接线状态（零生产消费方，记账）

12 件在本仓 `grep -rl` 反查（排除自身与自身测试）均为 **0 个生产引用点**，因此本批**全部不接线**。端口内的真实消费方如下，均不在本批范围：

| 本批模块 | 端口内的真实消费方 | 本仓状态 |
| --- | --- | --- |
| `agentPanelElements.js` | `agentPanel.js`、`agentSkillPanel.js`、`agentSkillPicker.js`、`agentSkillEditor.js`、`agentConversationActions.js`、`agentConversationChoices.js`、`agentMessageTime.js` | `agentPanel.js` 存在但**属更早世代**，余 6 件缺失 |
| `agentAssistantMarkdown.js`、`agentConversationScroll.js` | `agentConversationPresentation.js`、`agentConversationStreamingPresentation.js` | 2 件均缺失 |
| `agentConversationText.js` | `api/agentAssistantApi.js`、`agentContextDigest.js`、`agentConversationStore.js`、`agentReplyVersions.js`、`agentSessionEventLog.js` | `agentConversationStore.js` 存在但**属更早世代**，余 4 件缺失 |
| `agentStreamingProse.js` | `api/agentAssistantApi.js`、`agentAssistantConversationRuntime.js` | 2 件均缺失 |
| `agentConversationIntent.js` | `agentAssistantConversation.js`、`agentTurnRouter.js` | 2 件均缺失 |
| `agentConversationCanvasTransfer.js` | `agentConversationCanvasTransferRuntime.js`、`index.js` | `index.js` 存在但**属更早世代**，另 1 件缺失 |
| `agentDocumentInput.js` | `agentComposerAttachmentController.js`、`agentExternalInformation.js`、`agentExternalToolRegistry.js`、`index.js` | `index.js` 同代未落地，余 3 件缺失 |
| `agentCompletionEvidence.js` | `agentPrecreatedNode.js`、`agentRuntime.js` | `agentRuntime.js` 存在但**属更早世代**，另 1 件缺失 |
| `agentReferenceContext.js` | `agentContextBuilder.js` | 存在但**属更早世代** |
| `agentRunSteps.js` | `agentRunStatusPresentation.js` | 缺失 |

关键点：`src/modules/agent` 的装配层（`index.js`、`agentRuntime.js`、`agentPanel.js`、`agentContextBuilder.js`、`agentConversationStore.js`）**本仓有文件但属更早世代**——把它们升到 0.7.16 代是**行为变更**，须单独成批 + 真机验收 + 授权，不能混进本批这类纯新增批次。这正是第 93 批 §8 已确立的「升代类须单独成批」口径。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86/92 批口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 抓取**所有**模块说明符（含 `export … from` 再导出），相对说明符在端口树内解析后检查目标是否**存在于本仓**。本批把第 92 批的目录级脚本泛化为 `deobf-tools/b94/audit.mjs`（接受 scope 参数），可对任意子树重跑。

**(b) 扫描器误报在本批暴露并纠正**：上述两条正则在**已反混淆**的源码上会产生**假阳性说明符**（把 `](_0xe0c03e[`、`...isAgentEditableParamField(_0x2658b5={},...)` 这类括号访问文本误判为 `import` 目标）。故本批新写 `deobf-tools/b94/specs.mjs` **逐件打印说明符并就地标注 repo OK / MISSING**，并据此把候选收窄为**完全零 `import` 的 24 件纯叶**——纯叶**不存在**依赖闭合问题，从根本上绕开了正则误报。**本批 12 件全部零相对导入**（唯一非零的 `agentConversationActionText.js` 属纯叶外的 i18n 依赖，留给后续批次）。

**(c) 落地前存在性核对**：12 件在落地前均确认**不在** `src/modules/agent/`（该目录落地前实测 14 件）。落地后本目录 **26 件**（14 + 12）。

**(d) 逐字节落地**：12 件从端口原始文件复制到 `deobf-tools/b94/port/`，经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 12/12 `IDENTICAL`（§5），未做任何「顺手美化」。

**(e) 级联记账**：本批落地后重跑 `b94/audit.mjs src/modules/agent`：未落地 **68 → 56**，而**相对目标齐备数仍是 32**——因为本批取走的 12 件纯叶把原先受阻的 20 件**新解阻**（`agentConversationPresentation`、`agentAssistantConversation`、`agentTurnRouter`、`agentContextDigest`、`agentReplyVersions`、`agentSessionEventLog`、`agentMessageTime`、`agentConversationChoices`、`agentConversationActions`、`agentSkillEditor`、`agentSkillPanel`、`agentSkillPicker`、`agentComposerAttachmentController`、`agentExternalInformation`、`agentExternalToolRegistry`、`agentPrecreatedNode`、`agentConversationCanvasTransferRuntime`、`agentRunStatusPresentation`、`agentAssistantConversationRuntime`、`agentExternalInformationRuntime` 等），**下一批的可落地面没有缩小反而持平**。全 `src/modules` 面：未落地 **655 → 643**，相对目标齐备 **264 件**持平。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/agent/<f>.js` × 12 | **12/12 `IDENTICAL`**（prettier 改写测试文件后复检一次） |
| 语法 | `node --check src/modules/agent/<f>.js`（源码 12 + 测试 12） | 全部 OK |
| 格式 | `prettier --check`（本批 24 件） | 首轮 **4 个测试文件**告警、`--write` 后复检通过；**12 件源码自始未被改写**。目录内另有既存的 `agentSkillPackage.test.js` 告警，属更早批次产物，**本批未动** |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/agent/*.test.js` | **134/134 通过，0 失败**（本批新增 126，另 8 项为既存 `agentSkillPackage.test.js`）；逐件 7+7+7+10+10+9+12+9+11+12+12+20 = **126** |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 429/2 386/43**（第 93 批为 2 303/2 260/43，**+126/+126/±0**）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致**（`diff-exit=0`） |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–93 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 646 / 0`（第 93 批实测 621，**+25 = 12 源码 + 12 测试 + 本专题文档 1**） |

测试编写期间修正的 **6 处测试自身期望错误 + 1 处冗余用例**（实现一字未改）：

1. `agentStreamingProse.test.js`：误以为 `'abc ```agent-choice\n'` 原样返回；实际末行为空前缀 ⇒ 整段 `trimEnd()`，得 `'abc ```agent-choice'`。已改为该期望并**新增一条专测收口行为**。
2. `agentConversationText.test.js`：「尾部预算为 0」用例误用 10 字文本配 22 上限 —— 未超限故原样返回，断言失败；改为超过标记长度的文本。
3. `agentConversationScroll.test.js`：假 `style.removeProperty` 只记名不删属性，导致「清理后应为 `undefined`」失败；改为**按 `CSSStyleDeclaration` 语义真正删除**该属性。
4. `agentRunSteps.test.js`：把 `ok: null` 误判为失败；实现用 `=== false` 严格比较，`null` 记 `success`。改为三事件（缺省/`null`/`false`）期望 `['success','success','failed']`。
5. `agentRunSteps.test.js`：「只保留目标 run」用例忘了 `currentRun` 是终态、会追加 `:terminal` 步；期望补为三条并断言末条键名。
6. `agentReferenceContext.test.js`：以 `canvas: null` 断言容错；实际**解构默认值只对 `undefined` 生效**，`null` 会抛 `TypeError`。拆成「`undefined`/缺省走空」与「非数组 `nodes` 无匹配」两条用例。
7. `agentPanelElements.test.js`：删除一条只注入假 `document`、无断言且返回对象的冗余脚手架用例。

端口缺陷记账（**未改实现**）：`resolveAgentConversationCanvasTransfer` 在「意图命中 + 历史为空」时抛 `TypeError`（§2.1、§3 与测试注释均已记录）。

## 6. 未执行的验收项

- **未接线**：12 件无任何生产消费方，端到端行为无从触发。Agent 面板的真实渲染链路仍整体缺位。
- **未运行真实浏览器/DOM**：`agentPanelElements` 用**假 `document.createElement` + 自实现 `setAttribute`/`appendChild`** 验证，`innerHTML` 未真正解析；**未**在浏览器验证 SVG 图标渲染与无障碍语义。`agentConversationScroll`/`agentScrollableWheel` 只用**假元素对象**验证属性写入，**未**验证真实滚动容器与 `deltaMode` 在不同平台/输入设备下的行为。
- **未验证真实布局修复效果**：`agentAssistantMarkdown` 只断言字符串级版式变换，**未**验证其在真实 Markdown 渲染器与 CSS 下的视觉效果。
- **未覆盖真实数据**：`agentRunSteps`、`agentReferenceContext`、`agentCompletionEvidence`、`agentConversationCanvasTransfer` 全部使用**手工构造的事件流/台账/历史/画布桩**；**未**接真实 `agentEventLog`、真实画布节点、真实会话历史，也**未**验证 `Date.now()` 时间戳在真实 run 中的单调性。
- **未覆盖 LLM/后端**：`agentConversationIntent`、`agentCompletionEvidence` 的正则启发式**未**用真实用户语料做召回/误报评估。
- **未覆盖真实文件**：`agentDocumentInput` 只验证校验器协议与记录归一，**未**读取真实 txt/docx/pdf，也**未**触发 `document.read_file` 工具通道。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- **未伪造消费方**：12 件零生产引用，一律**留白记账**（§3），未接到任何假引用点以制造「已接入」假象。
- **未做升代**：`src/modules/agent/index.js`、`agentRuntime.js`、`agentPanel.js`、`agentContextBuilder.js`、`agentConversationStore.js` 这 5 个本仓既存但属更早世代的装配件**一字未改**，其升代仍须单独成批 + 真机验收 + 授权。
- **未伪造端口缺陷的修复**：`agentConversationCanvasTransfer` 的空历史 `TypeError` 按现状固化并记账，未私自打补丁。
- 交付物为 12 源码 + 12 测试 + 本专题文档 1 份；测试内的假 `document`/假元素/假事件流仅存在于测试文件，未把绝对路径写入源码。

## 8. 下一批建议

1. **R12 Agent 线续取（第 95 批候选）**：`src/modules/agent` 仍有 **56 件**未落地，重跑 `b94/audit.mjs src/modules/agent` 得**相对目标齐备 32 件**（本批的级联新解阻 20 件已计入）。建议按功能簇继续成批取：
   - **技能簇**：`agentSkillRegistry`、`agentSkillAuthoring`、`agentSkillLifecycle`、`agentSkillLoader`、`agentSkillUsage`、`agentSkillPanelText`、`agentSkillPreferences`、`agentSkillEditor`、`agentSkillPicker`、`agentSkillPanel`（其中 `agentSkillAuthoring`/`agentSkillRegistry` 依赖本仓既存且**同代一致**的 `agentSkillPackage.js`）。
   - **呈现簇**：`agentConversationPresentation`、`agentConversationStreamingPresentation`、`agentMessageTime`、`agentPanelText`、`agentRunStatusPresentation`、`agentConversationChoices`、`agentConversationActions`。
   - **运行时/能力簇**：`agentCapabilityRouter`、`agentCapabilityDiscovery`、`agentContextDigest`、`agentExternalInformation`、`agentExternalToolRegistry`、`agentProjectMemory`、`agentDurableRunState`、`agentFailureDiagnostic`、`agentToolResult`、`agentTaskBindingRuntime`。
   **落地前仍须逐件复核导入面**——本批已证明正则在反混淆源上会**双向出错**（假阳性说明符 + 单子句 `grep` 漏读后续 `import` 子句），**不得采信任何扫描器的 `deps===0`**。
2. **升代类仍须单独成批**：`src/core/math.js`（32 → 52 导出，**62 个消费方**，同时是 R09 剩余 2 件的阻塞点）、`rendererVirtualization.js`、`canvasMediaLocalService.js`（28 个消费方）、`src/components/media-clip` 整片、`main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换，以及本批新点名的 **`src/modules/agent` 5 件既存装配体升代** —— 均为行为变更，须真机/UI 验收 + 单独授权。
3. **R12 线路的下一步**：本批补齐 Agent 的**面板与会话纯叶层**。要形成可运行链路，仍缺 `api/agentAssistantApi.js`（本仓**完全缺失**，且是 `agentConversationText`/`agentStreamingProse` 的直接消费方）、`agentAssistantConversation` 及其 runtime、以及 `index.js`/`agentRuntime.js`/`agentPanel.js` 的同代装配体。建议在继续横向铺叶层的同时，先估算**这条装配链的世代差异有多大**，再决定是「先装配后铺叶」还是「继续把叶子铺满后一次性装配」。
4. **R09 线的现状复述**（供切换回来时用）：`src/modules/storyboard3d/` 端口 97 / 本仓 45 / 未落地 52，其中相对目标齐备仅 **2 件**且**全部**受阻于 `core/math.js` 的 `clientToViewportNdc`/`ndcToViewportPoint`/`intersectRayWithAxisPlane`（本仓 `src/core/math.js` 对这三个名字 `grep` **0 命中**）。
5. **并行可取的其它特性区**（口径同本批，均须先逐件复核导入面并核被依赖模块世代）：`src/modules/collaboration`（R10）、`src/modules/personReplacement`（R08）、`src/modules/storyWorkspace`（R06/R07）、`src/modules/app`、`src/modules/panoramaSceneNode`（R09 邻近）、`src/components/aigenImage`、`src/domain/storyGeneration` 等。
