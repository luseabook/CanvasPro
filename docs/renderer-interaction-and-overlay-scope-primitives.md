# 第74批：渲染器交互/键盘状态与遮罩作用域原语六件

本批交付 6 个自足、可完全离线验证的渲染器侧原语模块及其测试源码，全部属于同一条「画布交互状态 + 键盘物理键 + 遮罩/焦点作用域」能力簇：`escapeScope`、`physicalShortcutState`、`canvasPanShortcutState`、`viewportInteractionState`、`focusTrap`、`modalInteractionScope`。

## 1. 缺口判定

第73批对端口 `src/`（1 550 个 js/cjs/html）与本仓 `src/`（693 个）做 `comm -23` 得 1 044 条「仅在端口存在」，并用 `b74-scan.mjs`（`C:/Users/luobote/.qoder/tmp/deobf-tools/b74-scan.mjs`）逐条解析相对 import，判定「无级联」者 **481 条**（即所有相对 import 目标在本仓 `src/` 下已存在，移植后不会引出新的缺失链）。本批从该 481 条中按「零依赖 / 可注入 / 不直触 `document.`·`window.` 模块级全局 / 同簇共 6 件」挑出上列 6 个：前 4 件零 import 或仅注入式访问全局，后 2 件互为依赖（`modalInteractionScope` → `focusTrap`），且共同构成端口的「遮罩作用域 + 焦点陷阱」最小闭包。

其中要注意**两件不是「抽取件」而是真正的新行为**：

- 本仓 `src/services/keyboardService.js`（12 337 B）是端口版（13 568 B）的**更早一代**，把空格平移快捷键状态**内联**为模块级 `let _spaceHeld`（L10）+ `setPanShortcutHeld()`（L52–54，写 `window._spaceHeld` 与 `#v2-wrap` 的 `var(--grab-cursor)`）；端口版把这段抽成 `canvasPanShortcutState.js` 并额外引入 `escapeScope` / `modalInteractionScope` 两个新机制。**故 `escapeScope`、`modalInteractionScope`（及 `focusTrap`）在本仓属真正缺失的能力**（全仓无 `AltLeft`/`AltRight` 物理键跟踪、无遮罩作用域栈、无 `dispatchScopedEscape`）。
- 本仓 `src/modules/shortcuts.js`（39 059 B，端口 44 199 B）L370 仍是 `if (event.altKey) tokens.push('Alt')` 的**单值 Alt**，端口版改用 `physicalShortcutTokens(event)` 以区分左右 Alt（`['AltLeft','AltRight']`）——`physicalShortcutState` 也是新行为。
- 另两件 `canvasPanShortcutState`、`viewportInteractionState` 是**行为等价的抽取**：本仓 `src/services/storeRuntimeEffectsService.js` L179–181 仍内联 `classList.contains('is-panning') || contains('is-viewport-animating') || contains('is-zooming')`，正是端口 `readViewportInteractionState()['isViewportBusy']`（无参调用时）的等价实现。

## 2. 交付物

| 文件 | 行/字节 | 端口来源 | 契约要点 |
| --- | --- | --- | --- |
| `src/services/escapeScope.js` | 17 行 / 405 B | `src/services/escapeScope.js`（453 B） | `registerEscapeScope(handler)` 入栈并返回 `lastIndexOf`+`splice` 的退订闭包；`dispatchScopedEscape(event)` 仅当 `key==='Escape' && !isComposing && 栈非空` 时才 `preventDefault()`+`stopImmediatePropagation()`+调用**栈顶**（LIFO，后注册者优先）并返 `true`，否则返 `false` 且无副作用 |
| `src/services/physicalShortcutState.js` | 16 行 / 424 B | 同名（484 B） | 模块级 `Set` 记录物理 `event.code`；`trackPhysicalShortcutKey(e)`（无 `code` 忽略）、`releasePhysicalShortcutKey(e)`、`clearPhysicalShortcutKeys()`；`physicalShortcutTokens(e)` → 同时按下 `AltLeft`+`AltRight` 且 `altKey` → `['AltLeft','AltRight']`，仅 `altKey` → `['Alt']`，否则 `[]` |
| `src/services/canvasPanShortcutState.js` | 19 行 / 609 B | 同名（609 B） | `setCanvasPanShortcutHeld(v, {windowObject=globalThis.window, documentObject=globalThis.document})`：仅在 `v === true` 时置位（严格布尔，`1`/`'true'`/对象均不置位），写 `windowObject._spaceHeld`，并把 `documentObject.getElementById('v2-wrap').style.cursor` 设为 `var(--grab-cursor)` 或 `''`；`releaseCanvasPanShortcut(opts)`；`isCanvasPanShortcutHeld()` |
| `src/core/viewportInteractionState.js` | 48 行 / 1 768 B | 同名（1 768 B） | `VIEWPORT_INTERACTION_CLASSES`（`Object.freeze`，3 个 body class 名）+ 私有 `BUSY_INTERACTION_FLAGS`（`isDragging`/`isConnecting`/`isBoxSelecting`/`isDraggingCell`）；`readViewportInteractionState({documentRef, interactionState, panPreviewActive, pendingPanFreezeActive})` → `{isPanning, isZooming, isViewportAnimating, isViewportBusy}`（`isPanning` 由 body class **或** `interactionState.isPanning`/`assistPanActive` **或** 两个 preview 标志共同决定；`isZooming`/`isViewportAnimating` **只**看 body class）；`isRendererInteractionBusy({documentRef, interactionState})` 先看 4 个 busy 标志**严格等于 `true`**，否则回落 `isViewportBusy` |
| `src/utils/focusTrap.js` | 51 行 / 2 288 B | `src/utils/focusTrap.js`（3 019 B） | `FOCUSABLE_SELECTOR`（8 条选择器 `join(',')`）；`listFocusableElements(root)` 过滤「不可见（`getClientRects()` 为空 / computed `visibility` 为 `hidden`·`collapse`）/ `disabled`·`hidden`·`inert` / `aria-hidden='true'` / `closest('[hidden], [aria-hidden=true], [inert]')` / `tabIndex < 0` / 无 `focus()`」；`focusFirstElement(root, {preferredSelector})`；`trapTabKey(event, root, documentRef)`（Tab 首尾环绕，中段交还浏览器）；`restoreFocus(el, documentRef)` |
| `src/services/modalInteractionScope.js` | 66 行 / 1 928 B | 同名（1 970 B） | 模块级作用域栈；`hasActiveModalInteraction()` = 栈内**任一** `root.isConnected !== false`；`beginModalInteraction({root, onClose, onSuspend, returnFocus, preferredSelector})` 挂 window `keydown`（Tab 陷阱）+ document `focusin`（焦点逃逸拉回）+ root `keydown`/`keyup`（Escape → `preventDefault` 后 `onClose`，`isComposing`/`defaultPrevented` 时不关但**仍** `stopPropagation`），开作用域时先调上一顶层 `onSuspend()` 并移焦；返回的退订闭包幂等，且**仅当自己仍是栈顶**时才 `restoreFocus`（`{restoreFocus:true}` 默认，可关） |

**测试源码**（6 个 `*.test.js`，共 **101 项**，全为注入替身、无 DOM）：`escapeScope` 13、`physicalShortcutState` 11、`canvasPanShortcutState` 11、`viewportInteractionState` 17、`focusTrap` 27、`modalInteractionScope` 22。

## 3. 接线状态：本批 6 件全部生产零引用

`grep` 全仓（`src`/`electron`/`api`/`main.js`）对 6 个模块名与 `physicalShortcutTokens`/`readViewportInteractionState`/`registerEscapeScope`/`dispatchScopedEscape`/`hasActiveModalInteraction` 的引用**均为 0**；`main.js`/`mainIpcSetup`/`preload.cjs` 零改动。按既定口径「宁可留白并记账，也不为了『有引用』而擅自接线」，本批不接伪造消费方。

已探明的**真实**接线点（供后续授权批次使用，本批不动）：

1. `src/modules/shortcuts.js` 的 `_resolveShortcutKeys`（本仓 L370 `if (event.altKey) push('Alt')`）→ `physicalShortcutTokens(event)`。属**行为变更**（新增左右 Alt 区分）。
2. `src/services/keyboardService.js` 的空格平移三处（`_spaceHeld` L10/L52–54、`isSpaceHeld()` L278、`handleWindowBlur` L296–297）→ `canvasPanShortcutState` 的三成员；`handleKeyDown` 的 Escape 分支 → `escapeScope`/`modalInteractionScope`。后者需**连带**移植端口 `keyboardService` 的其余新依赖（`hasActiveModalInteraction`、`toggleDevMode`、`resolveShortcutActionForEvent`），属**整代升代**。
3. `src/services/storeRuntimeEffectsService.js` L179–181 的内联 body-class 判定 → `readViewportInteractionState()['isViewportBusy']`。**行为等价**，纯重构。

三项都改**在用生产文件的运行逻辑**：①③无 UI 差异、②含键盘行为变更。均**须在真实浏览器/Electron 内验收**，故本批不做，留待单独授权批次。

另有 **2 个同簇文件本批未取**，原因记录在此以免被误判为遗漏：

- `src/core/rendererPanPreviewReconcile.js`（11 189 B）——级联未闭合：其 3 个依赖 `rendererViewportPreviewCoverage.js`/`rendererInteractionRenderPolicy.js`/`rendererRuntimeDiagnostics.js` **本仓均不存在**，属更大一代渲染管线抽取件，须成组移植。
- 端口 `src/services/keyboardService.js` 整体升代——见上第 2 条，依赖面大且有行为变更。

## 4. 已执行的离线验证

全部在仓内、离线、无网络：

- `node --check`：6 个源码 + 6 个测试，**12/12 exit 0**。
- `prettier --check`（配置 `C:/Users/luobote/.qoder/tmp/deobf-tools/prettierrc.json`）：6 个源码 + 6 个测试**全过**（`focusTrap.js`、`modalInteractionScope.js`、`viewportInteractionState.test.js`、`modalInteractionScope.test.js` 首跑有格式告警，`--write` 后复检通过）。
- 6 个测试文件单跑：**101/101 通过**，首跑 2 项失败（`isRendererInteractionBusy ignores unrelated interaction flags` 期望写错——`isPanning` 合法地参与 viewport 回落；`trapTabKey leaves a middle element to the browser` 的假容器 `contains` 恒 `false` 致中段被当作「域外」），均为**测试期望/harness 写错，实现零改动**，修正后全绿。
- `src/**` 全量清扫（`node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')`）：**1 465/1 422/43 → 1 566/1 523/43**（+101 恰为本批新增），43 项失败**逐项与第73批一致**（`diff` 为空），全归因缺失夹具 `tests/testPreviewDom.js`（0.4.12 遗留，不伪造）。
- 忠实性比对（`cmp-tokens.mjs` + 新增 `litdiff.mjs`，port → repo）：`escapeScope` 105/110（残差全为 `return![]` 无空格与 prettier 补的 `(`/`)`）、`physicalShortcutState` 107/107、`canvasPanShortcutState` 105/107（双引号差异 + 折行逗号）、`viewportInteractionState` 312/323（引号差 + prettier 去键引号 + 折行逗号）、`focusTrap` 650/674、`modalInteractionScope` 463/470——**字面量集合比对全部只剩 prettier 按 `quoteProps: as-needed` 去掉的冗余对象键引号**（`preferredSelector`/`preventScroll`/`root`/`documentRef`/`interactionState`），**无任何语义或字面量分歧**。
- 工作树快照：`staged=0 modified=67 untracked=416 conflicts=0` → **`0/67/428/0`**（+12 = 6 个源码 + 6 个测试，逐一相符；`modified` 保持 67 不变，本批未触碰任何既有文件）。

本批**未执行**：真实浏览器/Electron 内的键盘与焦点行为、右键/快捷键设置界面渲染、任何 AI 或云服务调用。

## 5. 未执行的验收项

1. `escapeScope`/`modalInteractionScope` 的 Escape 层叠顺序在真实应用内是否与既有 `keyboardService` 的 Escape 分支（`escape-all`/`pickConnectMode`/`annotation` 等）**不冲突**——本批只证明模块内部 LIFO 与「域外焦点拉回」语义。
2. `physicalShortcutTokens` 的左右 Alt 区分在**真实键盘**下能否稳定拿到 `AltLeft`/`AltRight`（浏览器 `code` 的值域）——本批只用注入的 `{code}` 事件。
3. `canvasPanShortcutState` 写的是**真实 `#v2-wrap`** 元素的 `cursor`，真实 DOM 下是否与既有 `keyboardService.setPanShortcutHeld` 的写法一致、`window._spaceHeld` 是否被别的消费者读取——本批只用假 `windowObject`/`documentObject`。
4. `viewportInteractionState` 依赖 **body class 真的被加/删**（`is-panning`/`is-zooming`/`is-viewport-animating`）；本批只喂假 `classList.contains`，未验证谁在真实运行时切换这些类。
5. `focusTrap` 的可见性判定（`getClientRects()`/`getComputedStyle`）在真实渲染下的边界：`transform` 缩放、`visibility:hidden` 的祖先、`content-visibility` 等未覆盖。
6. `modalInteractionScope` 的 window/document/root 三层监听在真实 Electron 渲染器下是否**不重复投递**、`restoreFocus` 与既有输入框焦点恢复是否互相打架。

## 6. 约束复核

- 未覆盖 `api/freeImageHostApi.js`（未做任何批量拷贝）。
- 未提交、未推送、未触发任何 CI/发布。
- 未写 `D:\shuocancas`（只读引用端口美化树于 `C:/Users/luobote/.qoder/tmp/shuo-deobf`）。
- 未改 `src/i18n/messages/*.js`、未加 npm 依赖、未整体替换 `style.css`、未把临时目录或绝对路径写成运行时依赖（6 个模块零外部依赖）。
- 未伪造消费方：6 件生产零引用，缺口已如实记账（§3）。
- 未清理工作树中未跟踪文件（它们是交付物本体）。
- 测试命令、依赖、成本已在执行前明确（离线 `node --check` / `node --test` / `prettier --check`，零网络、零费用）。

## 7. 下一批建议

延续「闭合 481 条无级联缺失件」的主线，优先**同簇成组**而非零散取件：

- **A（低风险，纯新增）**：取 `core/` 下其余零/单依赖的交互与渲染前置件，并做**依赖闭包**检查（成组移植，避免像 `rendererPanPreviewReconcile` 那样只取一件而级联未闭合）。
- **B（须授权）**：`src/modules/shortcuts.js` + `src/services/keyboardService.js` 的**整代升代 + 接线**（§3 第 1/2 条），须先在真实 Electron 内验证空格平移、左右 Alt、Escape 层叠，并核对本仓既有的截图快捷键同步定制与两语言文案不被覆盖。
- **C（须授权）**：`src/services/storeRuntimeEffectsService.js` L179–181 的等权重构接线（行为不变，可作为 B 的前置小步）。

仍欠（非本链）：`web-preview/*` 5 条路由的渲染器侧消费点、`storage-migration/prepare`、`styles/variables.css` 里 44 个未移植的 0.7.16 CSS 自定义属性、`main.js` 的 chrome-shell 启动分支最终装配（13 个依赖已全部落地）。
