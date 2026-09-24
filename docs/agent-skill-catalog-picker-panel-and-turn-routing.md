# 第106批：技能面板四件（弹层选择器 / 注册表内核 / 面板装配 / 轮次分流）

本批继续 R12（Agent 技能与会话体系）的源码补齐：从 0.7.16 安装版反混淆镜像移植 4 个 `src/modules/agent/` 叶子模块，逐件按原样落地（字节级一致、不修端口 bug），并为每件补可读的离线单测。本批不接线、不改装配、不产生任何用户可见行为变化。

## 1. 落地清单

### 1.1 源码（4 件，992 行 / 45 149 字节 / 9 个导出）

| 文件 | 行 / 字节 | 导出 | 依赖（全部已落地） |
| --- | --- | --- | --- |
| `src/modules/agent/agentSkillPicker.js` | 152 / 6 062 | `createAgentSkillPicker` | `./agentPanelElements.js`、`./agentScrollableWheel.js` |
| `src/modules/agent/agentSkillRegistry.js` | 255 / 10 937 | `normalizeRuntimeAgentSkill`、`createAgentSkillRegistryCore`、`agentSkillRegistryInternals` | `./agentSkillPackage.js` |
| `src/modules/agent/agentTurnRouter.js` | 139 / 9 266 | `hasAgentCanvasActionIntent`、`routeAgentTurn` | `./agentConversationIntent.js`（取 `isAgentConversationContinuation` / `isAgentStoryDeliverable` / `isAgentWritingRequest`） |
| `src/modules/agent/agentSkillPanel.js` | 446 / 18 884 | `createAgentSkillPanel`、`AGENT_DISABLED_SKILLS_STORAGE_KEY`（转口）、`agentSkillPanelInternals` | `./agentPanelElements.js`、`./agentScrollableWheel.js`、`./agentSkillEditor.js`、`./agentSkillPreferences.js` |

四件均与暂存副本 `deobf-tools/b106/port/*.js` `cmp` 一致（4/4 IDENTICAL），`node --check` 通过，Prettier `--check` 通过。

### 1.2 测试（4 件，1 892 行 / 74 048 字节 / 80 个用例）

| 测试文件 | 行 / 字节 | 用例 | DOM 依赖 |
| --- | --- | --- | --- |
| `agentTurnRouter.test.js` | 296 / 12 052 | 23 | 无（纯函数） |
| `agentSkillRegistry.test.js` | 439 / 17 371 | 21 | 无 |
| `agentSkillPicker.test.js` | 404 / 13 776 | 13 | 注入假 `document`（只用 `createElement`） |
| `agentSkillPanel.test.js` | 753 / 30 849 | 23 | 注入假 `document` + 假 `window.localStorage` |

`agentSkillPanel.js` / `agentSkillPicker.js` 只经 `createAgentElement → document.createElement` 建节点，不触达富文本清洗，因此注入假 DOM 安全（与第 101–105 批同一判据）。

## 2. 职责与契约

### 2.1 `createAgentSkillPicker({ registry, text, onSelect, slashTrigger })`

- 数据源固定为 `registry.listSkills()` 中 `source === 'installed' && enabled !== false` 的条目：内置技能与停用技能都不进弹层。查询匹配对 `id / title / description` 做小写子串判断。
- 菜单节点：类 `agent-floating-menu agent-skill-picker-menu`，`id="agent-skill-picker-menu"`（同时写属性与 JS 属性），`role="listbox"`；`slashTrigger` 只被挂在 `menu.agentPopoverTrigger` 这个普通属性上，并对触发器补 `aria-haspopup="listbox"` / `aria-controls`——真正的浮层定位由父装配负责，本模块不调用 popover 工具。
- 条目：图标在 `id` 非空时取 `skills`、否则 `check`；`role="option"`；`aria-selected` 与 `active` 类同步；描述缺省回落 `$id`；空集落 `skillPickerEmpty` 空态。
- `openSlash(query)`：`trim` 查询词、清空当前高亮（`_0x4ac4e4=''`）后重绘。
- `moveActive(step)`：`Number(step) < 0 ? -1 : 1`；越界取模回绕；无当前高亮时，向后落 index 0、向前落最后一项；命中后写 `active` 类与 `aria-selected`，并 `scrollIntoView({ block: 'nearest' })`；无可选项返回 `false`。
- `chooseActive()`：优先高亮项，否则首项；若该技能在重绘之间已消失则返回 `false`；命中时把**技能对象**交给 `onSelect`。
- 点击委托 `[data-agent-skill-pick]`，`disabled` 节点直接跳过，命中后 `preventDefault()` + `stopPropagation()`；`destroy()` 注销 click 与 wheel 监听；工厂函数返回前已完成首帧渲染。

### 2.2 `createAgentSkillRegistryCore({ builtInSkills, scoreBuiltInSkill })`

- `normalizeRuntimeAgentSkill(skill, source)` 是唯一的字段收窄口：`id` 截 64 并小写、`title` 截 120、`description` 截 600、`instructions` 截 6 144、字符串数组去重后最多 40 项、资源最多 24 条且内容截 4 096。
- `execution.scriptsEnabled` 恒为 `false`，与 `scriptsAvailable` 解耦：装了脚本也不给执行权。
- `replaceInstalledPackages()` 逐包走 `parseAgentSkillMarkdown`，失败项进 `diagnostics`，与内置 `id` 撞车记 `DUPLICATE_SKILL_ID`；返回 `{ available: true, loaded, rootPath, diagnostics }`。
- `select({ maxSkills = 2, ... })` 只从启用集打分排序取前 N；内置走注入的 `scoreBuiltInSkill`，安装技能走本模块的 `scoreInstalledSkill`。
- `scoreInstalledSkill` 常量：显式点名 1 000、触发词/适用场景命中 +240、描述相关度 60×命中数（上限 180）、目标模型类型匹配 +40；`manualOnly` 且未点名直接 0。

### 2.3 `routeAgentTurn({ message, intent, clarificationAnswer, pendingPlan, conversationHistory })`

单函数 18 步有序判定链，返回 `{ channel, reason }`。`channel` 只有两值：`canvas.tool`（7 个出口）与 `assistant.message`（11 个出口）。按命中顺序：

| # | reason | channel | 触发面 |
| --- | --- | --- | --- |
| 1 | `continuation` | `canvas.tool` | `clarificationAnswer` 或 `pendingPlan` 为真 |
| 2 | `explicit-intent` | `canvas.tool` | `intent.canvasAction === true` 或 `intent.mutatesCanvas === true` |
| 3 | `empty` | `assistant.message` | `message.trim()` 为空 |
| 4 | `canvas-action-negated` | `assistant.message` | 命中"别改画布"类否定正则 |
| 5 | `informational-question` | `assistant.message` | 疑问句探针判为询问 |
| 6 | `story-deliverable` | `assistant.message` | `isAgentStoryDeliverable` |
| 7 | `canvas-target` | `canvas.tool` | 文本点名画布/节点对象 |
| 8 | `text-deliverable` | `assistant.message` | 要求产出文本产物 |
| 9 | `discussion-only` | `assistant.message` | 只讨论不动手 |
| 10 | `media-generation-negated` | `assistant.message` | 否定式生成媒体 |
| 11 | `media-generation` | `canvas.tool` | 肯定式生成媒体 |
| 12 | `model-change` | `canvas.tool` | 切换模型 |
| 13 | `creative-conversation` | `assistant.message` | 有上下文的创作型闲聊 |
| 14 | `text-creation` | `assistant.message` | `isAgentWritingRequest` |
| 15 | `conversation-continuation` | `assistant.message` | `isAgentConversationContinuation` 且历史里有助手轮次 |
| 16 | `canvas-operation` | `canvas.tool` | 画布操作动词 |
| 17 | `general-action` | `canvas.tool` | 兜底的"要做点什么" |
| 18 | `conversation` | `assistant.message` | 最终兜底 |

`hasAgentCanvasActionIntent(text, { intent, clarificationAnswer, pendingPlan, conversationHistory })` 是同文件导出的布尔包装：内部直接调 `routeAgentTurn` 并取 `channel === 'canvas.tool'`，供上游用一次调用决定"是否走工具通道"。

### 2.4 `createAgentSkillPanel({ registry, refreshSkills, installSkill, deleteSkill, saveSkill, text, formatText, onInsert, onUse, onCatalogChange, onNotice, windowObject })`

- 构造期先 `hydrateDisabledAgentSkillIds()`（用 localStorage 覆盖注册表禁用集），再渲染一次。
- 返回句柄顺序：`element, open, close, render, refresh, install, requestDelete, confirmDelete, save, refreshText, destroy`。
- 单飞忙碌闸：`_0xd93941(kind, fn, onOk, onFail)` 在已有动作在途或 `fn` 非函数时返回 `null`；用自增序号丢弃过期回调，`destroy()` 后所有回调静默。
- 动作表 `[[refreshBtn,'refresh'],[importBtn,'import'],[editor.saveButton,'save']]` 统一禁用；删除确认钮按 `pendingId` 匹配才发请求。
- 列表条目仅 `managedBy === 'shuo-canvas'` 的安装技能给编辑钮。

## 3. 本批实际执行与未执行的检查

已执行（全部离线、无费用、无网络、无桌面进程）：

1. `prettier --write` 四件源码（在暂存目录）+ 四件测试，随后 `--check`：仓库侧仅命中基线里两个已知未格式化文件（`agentSkillPackage.js` / `agentSkillPackage.test.js`，属早期批次遗留，本批未触碰）。
2. `cmp -s` 四件源码 vs 暂存副本：4/4 IDENTICAL。
3. `node --check` 四件源码 + 四件测试：全通过（注意：`node --check` 只对处于 `"type":"module"` 包内的文件有效，故必须在落地后跑）。
4. 落地前导出闸门 `b100/verify-exports.mjs`：17 个 `ok` / 0 `MISSING` / 0 `DEP-FAIL`。
5. 四件新测试单独跑：80/80 通过。
6. 全量回归：`find src -name '*.test.js' | xargs -0 node --test --test-timeout=25000` → **3 141 用例 / 3 098 通过 / 43 失败**（基线 3 061 / 3 018 / 43；净 +80 用例、+80 通过、失败零增长）。
7. 失败清单 `b106-fails.txt` 与 `b85-fails.txt` `diff` → **exit 0**（43 个失败全部来自缺失夹具 `tests/testPreviewDom.js`，按红线不伪造该夹具）。
8. 依赖审计 `b95/deps-ast.mjs src/modules/agent`：`port=81 / LEAF=0 / OK=9 / BLK=1`，未落地件由 14 降到 **10**。
9. `md5sum api/freeImageHostApi.js` → `1e0458013f5341c99f21faefc1d34d3f`，与保护基线一致，本批未覆盖。
10. `git status --porcelain` → 67 `M` + 568 `??`（上一批 67 M / 560 ??，增量恰为本批 4 源码 + 4 测试）。
11. 测试文件计数：`src/modules/agent/` 55 → **59**，全仓 `find src -name '*.test.js'` 262 → **266**。

未执行（如实记账，不得当作已通过）：

- 未启动 Electron / 渲染进程 / 后端 Python；未在浏览器里打开 Agent 面板、技能弹层或技能管理面板。
- 未跑技能安装/删除/保存的真实磁盘与 IPC 路径（`refreshSkills` / `installSkill` / `deleteSkill` / `saveSkill` 全部由注入的桩提供）。
- 未跑 `npm run web` / `desktop` / `migrate`；未调用任何付费 AI 服务。
- 因此本批证据只覆盖"模块级逻辑与 DOM 结构契约"，不覆盖"真实面板可用性与技能装载链路"。

## 4. 接入结论：本批四件仍为零生产消费者

对 `src`、`api`、`electron`、`web-preview`、`tools` 反向 grep 四件模块名，仓库内消费者为 0（`agentPanelText.js` 的两处命中是 `agentSkillPanelText.js` 的子串碰撞，非引用）。

镜像侧的真实上游：

| 新落地件 | 0.7.16 里的消费者 | 本仓库状态 |
| --- | --- | --- |
| `agentSkillPicker.js` | `src/modules/agent/agentPanel.js` | 在用受保护装配，升级需专批 + 真机验证 |
| `agentSkillPanel.js` | `src/modules/agent/agentPanel.js` | 同上 |
| `agentTurnRouter.js` | `src/modules/agent/agentRuntime.js` | 同上 |
| `agentSkillRegistry.js` | `main.js`、`src/modules/agent/agentSkillCatalog.js` | `main.js` 属在用受保护装配；仓库里的 `agentSkillCatalog.js` 仍是旧世代 102 行硬编码版（只导出 `listAgentSkills`，不依赖注册表内核） |

结论：四件按"宁可留白并记账，也不为『有引用』而擅自接线"的红线保持未接线。要让它们真正生效，前置专批至少包括 `agentSkillCatalog.js` 换代（改为注册表内核 + 内置技能白名单）、`agentPanel.js`、`agentRuntime.js`、`main.js` 四件在用装配的升级与真机验证。本批不构成任何用户可见行为完成。

## 5. 冻结行为与已知怪异（测试已锁定，改动前先看这里）

### 5.1 「创建技能」按钮不打开编辑器

`agentSkillPanel.js` 的创建钮回调只 `onInsert?.(text('skillCreatePrompt'))` 然后 `close()` 整个面板，不会以 `create` 模式打开编辑区。因此 `agentSkillEditor` 的 `mode === 'create'` 分支（标题 `skillEditorCreateTitle`、`id` 输入可编辑）在面板侧目前不可达——只能经 `open(skill)` 传 `null` 才会走到，而面板只在点编辑钮时传条目对象。测试已把"点创建后标题仍是上一次 edit 模式、编辑器隐藏、面板隐藏"锁死。

### 5.2 `close()` 会清掉待确认的删除态

非忙碌期 `close()` 重置 `pendingId` 并重绘，所以确认对话框不跨开关保留。测试同时锁定另一侧：忙碌期 `close()` 不清 `pendingId`（`if (!busy)` 守卫）。

### 5.3 `destroy()` 后渲染函数直接 return

`render()` 首行 `if (destroyed) return;`，因此 `destroy()` 之后 `requestDelete()` 只改闭包变量，DOM 不再变化。

### 5.4 忙碌闸把「无回调」和「已在途」混为一谈

`refresh()` / `install()` / `save()` 在未注入对应回调时返回 `null`，调用方无法区分"没接"与"被忙碌吞掉"。

### 5.5 安装/刷新失败提示被折叠

`install` 的错误码分派把 `SKILL_MD_*` / `SKILL_SOURCE_*` / `INVALID_SKILL` / `MISSING_SKILL` 全部映射到同一条 `skillImportInvalid`，其余落 `skillImportFailed`；`refresh` 则把 `available:false` 与抛错合并成 `skillRefreshFailed`。用户看不到具体原因。

### 5.6 缺 `skillId` 时播报字面量 `Skill`

`install` / `save` 成功路径写 `formatText(key, { name: result.skillId || 'Skill' })`，硬编码英文兜底，未过 i18n。

### 5.7 注册表的禁用集大小写不一致

`setSkillEnabled()` 对入参做 `trim().toLowerCase()`，而 `setDisabledSkillIds()` 只 `trim()`。因此 `setDisabledSkillIds([' A ','a','','b'])` 得到 `['A','a','b']`——`'A'` 是永不命中的死条目，且会原样写回 localStorage。测试按现状锁定，未打补丁。

### 5.8 `resources: [null]` 直接抛 TypeError

`normalizeResources` 的默认参数只覆盖 `undefined`，数组元素为 `null` 时 `_0x53acd8['name']` 取值抛错，而不是被过滤掉。

### 5.9 相关度打分只数去重后的 gram

`scoreDescriptionRelevance` 对查询与"标题+描述"做 2/3-gram 交集，命中数 ×60 后 `Math.min(180, …)`；停用词表只有 7 个词，且只过滤 2-gram 面（3-gram 如"用一个"不会被剔除）。

### 5.10 非 ASCII 技能 id 必须带 `$` 或 `/` 前缀才算点名

`containsSkillReference(..., { prefixed: true })` 走 `[$/]id` 正则；只有标题分支退回大小写不敏感的 `includes`。所以中文 id 写成 `请帮我…` 不算显式请求，且 `请用My Skill处理` 因"用"属 `\p{L}` 而判否。

### 5.11 否定式媒体正则匹配不到英文复数

两支媒体正则都以 `\b(?:image|picture|…)\b` 结尾，`don't generate any images` 因词尾仍接字母而不匹配，既不算否定媒体也不算媒体生成，最终被 `GENERAL_ACTION_PATTERN` 的 `\bgenerate\b` 收进工具通道（`canvas.tool / general-action`）；同句改成单数 `don't generate image` 即正常命中 `assistant.message / media-generation-negated`，中文"不要生成图片"也命中。测试同时锁定命中的单数、中文与失守的复数三面。

### 5.12 `intent` 字段只认布尔 `true`

`intent.canvasAction` / `intent.mutatesCanvas` 传非空字符串不会触发 `explicit-intent`（严格 `=== true`），该句继续往下走后续判定。

### 5.13 包装器对 `conversationHistory` 缺失宽容

`hasAgentCanvasActionIntent` 内部 `conversationHistory || []` 归一，故传 `null` 不抛错；它只是布尔包装，不额外加宽或收窄命中面。

### 5.14 弹层 `moveActive` 的 `step` 是数字字符串也生效

`Number('-1')` 参与 `< 0` 判定，故 `'-1'` 真的向后走；只有非数字（如 `'x'` → `NaN`）才被当作前进方向。

### 5.15 弹层首帧即渲染，坏 `listSkills` 会让工厂抛错

`createAgentSkillPicker` 在 `return` 前调用一次渲染，因此 `registry.listSkills` 若抛错，错误发生在构造期而非 `openSlash()`。

## 6. 台账与下一批口径

- `docs/implementation-handoff.md`：§6 新增"（第106批后更新）"段落、§7 新增第 106 批待办、R12 行追加本批落地件（保持 `| R12 |` 行 6 列、插入文本不含裸 `|`）、交付记录新增第 106 批条目。
- `docs/next-session-prompt.md`：更新到第 106 批收口 + 第 107 批口径。同时更正一条事实：原第 106 批口径点名的 `agentProjectMemoryConversationRuntime.js` 实际早已落地（本批核实其源与测试均在 `src/modules/agent/`），故本批改取其余三件 `OK`（`agentSkillPicker.js`、`agentSkillRegistry.js`、`agentTurnRouter.js`）并追加 `agentSkillPanel.js`。
- 第 107 批口径：`src/modules/agent` 未落地 10 件中，`BLK` 仍只有 `agentModelControls.js`（缺 `components/aigenText/modelSelector.js`、`runtimeModelParameterControls.js`、`modelGenerationParamMemory.js`），其余 9 件为 `OK`，优先取依赖已落地的浅链件：`agentConversationChoices.js`（← `agentPanelElements.js`）、`agentPrecreatedNode.js`（← `agentCompletionEvidence.js`）、`agentExternalToolRegistry.js` 与 `agentComposerAttachmentController.js`（← `agentDocumentInput.js`）、`agentDiscoveryCommands.js`（← `agentCapabilityDiscovery.js`）、`agentActionPostconditions.js`（← `../canvasCommands/index.js`）、`agentSkillLoader.js`（← `../../services/desktopBridge.js`）、`agentConversationCanvasTransferRuntime.js`（← `agentConversationCanvasTransfer.js`）；`agentConversationPresentation.js`（8 个依赖，全部已落地）可与本批四件一起留待装配层专批评估。仍不接线、不改在用装配。
