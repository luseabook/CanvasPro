# 第63批 · R15 浮层捕获窗口控制器（`globalCaptureWindowController`）

> 承接第 60 批：`windowsWindowTransitions`（原生窗口过渡关闭）于该批落地，是本模块的**唯一仓内依赖**。本批补上 0.7.16 桌面端"选中文本 → Alt+C → 浮层捕获面板 → 选动作"这条链的**主进程侧窗口控制器**。落盘后 R15 只剩 3 个模块 + 5 条路由 + `storage-migration/prepare`（见 §7）；本批同时**新发现** R15 捕获面板集群的完整边界，以及 4 条**早已注册、正在等它**的 IPC 通道（见 §3、§7）。

## 1 · 本批补的缺口

第 60 批解决的是"**怎么把原生弹窗的窗口过渡关掉**"；本批解决的是"**这个无边框透明浮层窗口由谁创建、按什么尺寸贴到光标附近的显示器工作区、呈现/隐藏/展开的时序如何裁决、渲染器发回的四个请求怎么校验并派发动作**"。

它是 0.7.16 捕获链的**窗口裁决中心**：持有唯一一个 `BrowserWindow`（`show:false` / `frame:false` / `transparent:true` / `alwaysOnTop:true` / `skipTaskbar:true`、`contextIsolation:true` + `sandbox:true` + `backgroundThrottling:false`），并且是以下四件"会话状态"的唯一真相源：

- `presentation`（当前呈现：`captureId` / `presentationId` / `text` / `phase` / `cursor` / `workArea` / `bounds` / `pending` / `presented` / `dispatchAbort`），
- `cancelledCaptureId`（已取消的捕获，用于拒绝重复呈现），
- `userFocused`（用户是否真的聚焦过——没聚焦过的失焦**不隐藏**），
- `activeActionId` / `runImmediately`（上一次动作与"立即执行"偏好，回填到下一次呈现）。

本批之前仓内没有任何等价物：`electron/selectedTextCapture.js`（第 41 批）负责"取到选中文本"，`electron/globalTextPresetShortcutController.js`（第 41 批）负责"Alt+C 触发"，但**中间那块"面板"是空的**——`showCapturePanel` / `hideCapturePanel` / `isCapturePanelVisible` 三个注入点在本仓无处可指。

## 2 · 交付物

### 2.1 源文件

| 项 | 值 |
| --- | --- |
| 移植源 | `D:\shuocancas\SHUO Canvas` 0.7.16 → 反混淆树 `globalCaptureWindowController.js`，**463 行 / 17 934 B** |
| 落盘 | `electron/globalCaptureWindowController.js`，**477 行 / 19 159 B**（+14 行为 prettier 折行） |
| 静态依赖 | 3 条 import，**全部为本仓既有或无副作用**：`electron`（默认导入，且带 `typeof electron === 'object' && electron ? electron : {}` 守卫，故纯 Node 下可加载）、`node:path`、`./windowsWindowTransitions.js`（第 60 批） |
| 新增 npm 包 | 0 |
| 本仓改写 | **1 处**品牌字面量（窗口标题，见 §5） |
| `_0x` 残留 | 0（98 个映射全部替换为语义名） |

### 2.2 公开契约（3 具名导出，无测试钩子）

| 导出 | 说明 |
| --- | --- |
| `GLOBAL_CAPTURE_ACTION_IDS` | `Object['freeze'](['source-text','ai-text','ai-image','ai-video','preset-draft'])`。模块内另有私有 `AI_ACTION_IDS = new Set(['ai-text','ai-image','ai-video'])`，用于判定"是否允许携带 `runImmediately`" |
| `resolveGlobalCaptureWindowBounds({cursor, workArea, size, margin=0xc, offset=0xe})` | 纯函数：把默认尺寸 `0x190 × 0x34` 贴到光标 `+offset` 处；越出右/下边界则**翻到光标左/上侧**；最后 `clamp` 进 `[workArea + margin, workArea + workArea尺寸 - margin - 自身尺寸]`（`clamp` 在 `max < min` 时返回 `min`，故极小工作区不会产生负尺寸） |
| `createGlobalCaptureWindowController({…})` | 返回 10 个成员的控制器（见下） |

控制器返回的 10 个成员：

| 成员 | 语义要点 |
| --- | --- |
| `show(payload)` | 校验 `captureId` + `phase`（`CAPTURE_PHASES = capturing\|ready\|error`；`phase` 缺失时由 `text` 反推 `ready`）；`phase === 'ready'` 必须有 `text`，否则 `invalid-capture`；同一 `captureId` 若已 `cancel` → `capture-cancelled`；窗口销毁 → `window-unavailable`；控制器已销毁 → `capture-controller-destroyed`；异常 → `window-show-failed`（并清空会话）。成功则向渲染器 `send('globalCaptureWindow:present', {captureId, presentationId, text, phase, errorReason, shortcutLabel(默认 'Alt+C'), theme, runImmediately, activeActionId})`。**仅在新呈现（非复用）时**才 `setBounds` / `setAlwaysOnTop(true,'pop-up-menu')` / `setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true})` |
| `didPresent(payload, sender)` | 渲染器"我画完了"回执。校验发送方身份 → `stale-presentation`（`captureId` **与** `presentationId` 双匹配）→ 若窗口仍不可见，先 `capturePage(undefined,{stayHidden:true,stayAwake:true})` 并检查 `isEmpty()`（失败 → `window-frame-failed` + 隐藏）；`presented` 记忆化（同一次呈现只做一次）。`capturing` 相位**延迟 `pendingShowDelayMs` 再 `showInactive`**；其余相位立即 `show` + `focus` + 排一次 `focusRetryDelayMs` 聚焦重试 |
| `setExpanded(payload, sender)` | 展开的高度夹到 `EXPANDED_HEIGHT(0x104)` 与 `workArea.height - 0x18` 的较小值；下方放不下（`> workArea.y + workArea.height - 0xc`）则**向上展开**（`y = max(workArea.y + 0xc, base.y + base.height - 高度)`） |
| `chooseAction(payload, sender)` | 校验动作 id 属于 `GLOBAL_CAPTURE_ACTION_IDS` → `invalid-action`；`pending` → `action-in-flight`；`phase !== 'ready' || !text` → `capture-not-ready`。派发时新建 `AbortController` 并以 `{ signal }` 传给 `onAction`；`eventId = 'global-capture-' + captureId + '-' + ++dispatchSeq`、`source: 'globalCaptureWindow'`。成功 → 隐藏面板；失败 → 保持可见并重新聚焦。抛错 → `dispatch-failed` + 记 `global_capture.action_dispatch_failed` |
| `cancel` / `hide` | `cancel` 校验发送方与 `captureId`；两者最终都走 `hide()`（记 `cancelledCaptureId`、解除后台节流、清空会话并 `abort()` 在飞的派发） |
| `prewarm` / `isVisible` / `isTrustedSender` / `destroy` | `prewarm` 记忆化 `ensureWindow()`（重复调用返回**同一个** promise）；`isTrustedSender` 只认 `captureWindow.webContents`；`destroy` 置销毁标志、清定时器、销毁窗口，**幂等** |

`ensureWindow()` 的内部时序（审计要点）：

1. 已销毁 → 抛 `new Error('capture-controller-destroyed')`；
2. 窗口仍存活 → 若有在飞的 `windowReady` 则等它，直接返回同一窗口；
3. 构造 `BrowserWindow`，注册 `closed`（清空全部状态）/ `blur`（**仅当有会话、已 `userFocused`、且不 `pending`** 才隐藏）/ `focus`（置 `userFocused = true`）；
4. `Promise['all']([loadFile(<dirname>/globalCaptureWindow.html), prepareWindow(window)])`；`prepareWindow` 的失败被**自身 `.catch` 吞掉**并降级为 `global_capture.window_transitions_unavailable`（warn），**只有 `loadFile` 失败才会让 `windowReady` 失败**；`windowReady` 失败后置 `null`，故后续 `show` 会复用窗口对象而不再重试加载。

日志类型（全部 `source:'main'`）：`global_capture.window_transitions_disabled`(info)、`global_capture.window_transitions_unavailable`(warn)、`global_capture.window_prewarm_failed`(warn)、`global_capture.window_show_failed`(error)、`global_capture.window_frame_failed`(error)、`global_capture.action_dispatch_failed`(error)。

### 2.3 测试

`electron/globalCaptureWindowController.test.js`，**1 188 行 / 44 601 B / 91 项**，全离线。替身：`BrowserWindowClass`（类构造器**返回**窗口 double，从而捕获构造参数）、`screenApi`（光标 + 最近显示器工作区）、`nativeThemeApi`、`onAction`、`logDiagnosticEvent`、`prepareWindow`、假 `setTimeoutFn` / `clearTimeoutFn`（可查 `active()` 与显式 `fire(id)`）。

| 组 | 覆盖 |
| --- | --- |
| 常量 | 5 个动作 id 逐项 + `Object.isFrozen` |
| `resolveGlobalCaptureWindowBounds` | 全默认；光标偏移；右/下越界翻转；负光标夹到 margin；极远光标夹到远角；工作区过小则尺寸缩到 `工作区 - 2×margin`；`size` 为 0 回落默认；`margin`/`offset` 非数字按 0；`cursor`/`workArea` 非对象不炸；小数坐标取整 |
| 契约 | 10 个成员均为函数 |
| 窗口构造 | 无边框/透明/置顶/任务栏隐藏等 18 个构造项逐项；`webPreferences` 四项（preload 路径 = `dirname + globalCaptureWindowPreload.cjs`）；`loadFile` 目标 = `dirname + globalCaptureWindow.html`；自定义 `windowSize` 同时影响构造项与 `bounds` |
| 原生过渡准备 | `{ok:true}` → `window_transitions_disabled`；`{ok:true,skipped:true}` → 不记；`{ok:false}` → warn 且 `show` 仍成功；抛错 → warn 且 `show` 仍成功 |
| 窗口复用 | `prewarm` 后 `show` 不再构造第二个窗口 |
| `show` 校验 | 缺 id / 未知 phase 且无 text / ready 无 text → 三例 `invalid-capture`（**且不构造窗口**）；`capturing` 无 text 合法；缺 phase 由 text 反推 `ready` |
| `show` 载荷 | `send` 通道名与 9 个字段逐字段；`presentationId` 递增；`shortcutLabel` 空白回落 `Alt+C`、有值 trim；`errorReason` trim；主题 light/dark（含 `shouldUseDarkColors` 为 `undefined` 时落 dark） |
| `show` 定位 | 新呈现按光标显示器工作区定位 + 三项窗口设置；**复用呈现不再改位置**（`bounds` 引用不变） |
| `show` 拒绝 | 同 `captureId` 取消后 → `capture-cancelled`；换 `captureId` 可再呈现；窗口已销毁 → `window-unavailable`；控制器销毁后 → `capture-controller-destroyed`；`loadFile` 失败 → `window-show-failed` + error 日志 + 会话被清空 |
| `prewarm` | 两次调用返回**同一 promise** 且只构造一个窗口；失败时 warn 且 promise 正常 resolve |
| `didPresent` | 不可信发送方（含"无会话"）；`captureId` 错 / `presentationId` 错 → `stale-presentation`；不可见时 `capturePage` 参数逐字；**已可见则完全不截帧**；空帧与截帧抛错 → `window-frame-failed` + 隐藏；记忆化；截帧期间换呈现 → `stale-presentation` 且不显示；`ready` → `show` + 聚焦 + 排聚焦重试；`capturing` → 只排 `pendingShowDelayMs`、`fire` 后走 `showInactive` 且不聚焦；会话先消失则 `fire` 不回显；聚焦重试仅在"仍未聚焦"时第二次 `focus` |
| `setExpanded` | 不可信发送方 / `stale-capture` / `capturing` 未就绪 / 动作在飞 → 四种拒绝；向下展开的完整 `bounds`（且写回窗口）；光标靠下时**向上展开**（`opensUp:true` + 精确 `y`）；高度按工作区夹取；收回 `expanded:false` 回到基准高度 |
| `chooseAction` | 不可信发送方 / 未知动作 / `stale-capture` / 动作在飞 / `capturing` 无 text → 五种拒绝；成功 → 隐藏 + 事件 6 个字段（含 `eventId` 序号）+ **派发期间 signal 未 abort、派发结束后被 abort**；失败 → 保持可见 + `show` + `focus`；非对象返回值 → `dispatch-failed`；抛错 → `dispatch-failed` + error 日志 + `context.actionId`；销毁时 abort 在飞派发；AI 动作记住 `runImmediately` 且回填到下次呈现；`rememberRunImmediately:false` 时不覆盖旧值；非 AI 动作永远 `runImmediately:false`；两连派发 `eventId` 序号连续 |
| `cancel` / `destroy` | 不可信发送方；`captureId` 不匹配；成功 → 隐藏 + 节流 `[false,true]` + 清掉聚焦重试定时器；`destroy` 两次只销毁一次且后续 `show` 被拒；从未开窗时 `destroy` 是 no-op |
| 事件 | `closed` → 身份/可见性复位且下次 `show` 重建窗口；`blur` 在未聚焦前被忽略、聚焦后隐藏、**动作在飞时被忽略**（动作结束后才隐藏）；`focus` 单独不显示窗口 |

## 3 · 接线现状：本模块生产零引用，但 **4 条 IPC 通道早已在等它**

`globalCaptureWindowController` 在本仓**生产 `import` 数 = 0**（全仓除自身源/测试外 0 命中）；`main.js` / `mainIpcSetup` / `preload.cjs` 本批**零改动**（口径同第 55–62 批：宁可留白并记账，不为了「有引用」而擅自接线）。

**但本批发现了一个必须记账的事实**：第 41 批落地的 `electron/ipc/textPresetIpc.js` **已经注册了 4 条 `globalCaptureWindow:*` 通道**，且其依赖注入形状与本控制器**逐一对齐**：

| 已注册通道 | 第 41 批的注入形参 | 本模块对应成员 |
| --- | --- | --- |
| `globalCaptureWindow:chooseAction` | `chooseGlobalCaptureWindowAction(payload, event?.sender)` | `controller.chooseAction(payload, sender)` |
| `globalCaptureWindow:cancel` | `cancelGlobalCaptureWindow(payload, event?.sender)` | `controller.cancel(payload, sender)` |
| `globalCaptureWindow:setExpanded` | `setGlobalCaptureWindowExpanded(payload, event?.sender)` | `controller.setExpanded(payload, sender)` |
| `globalCaptureWindow:didPresent` | `acknowledgeGlobalCaptureWindowPresentation(payload, event?.sender)` | `controller.didPresent(payload, sender)` |

即**这四条通道的 `(payload, sender)` 二参签名、以及 `isTrustedSender` 只认窗口 `webContents` 的设计，与本控制器完全一致**——它们不是"给别的实现留的口子"，就是给本模块留的。之所以**本批仍不接线**，是因为接线缺的不是这 4 个方法，而是**它们的宿主与对端**：

1. **主进程宿主**：需要一个用真实 `dirname` 构造本控制器、并把上面 4 个注入口传给 `registerTextPresetIpcHandlers` 的装配层——即 R15 剩余件 `globalCaptureControllers.js`（46 行 / 1 878 B，见 §7），其 3 条静态 import **在本批后已全部命中本仓既有模块**。
2. **渲染器对端**：`show()` 发出的 `'globalCaptureWindow:present'` 通道在**本仓只有发送方、没有接收方**；接收端是 0.7.16 webapp 的 `src/modules/app/globalCaptureReceiver.js`，页面是 `globalCaptureWindow.html`（见 §7）。
3. **面板页面本身**：`<dirname>/globalCaptureWindow.html` 与 `globalCaptureWindowPreload.cjs` 本仓均不存在。

半接线（只注册 IPC 不建面板）会造出"通道永远返回 `not-supported`"的死路，**故本批保持零引用并把这 4 条通道的对应关系入账**，作为下一批接线的验收清单。

## 4 · 已执行验证（离线，本窗口实测）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check electron/globalCaptureWindowController.js` | 通过 |
| 语法 | `node --check electron/globalCaptureWindowController.test.js` | 通过 |
| 格式 | `prettier --config <tmp>/prettierrc.json --check` 两文件 | `All matched files use Prettier code style!`（测试文件首跑 `--write` 后通过） |
| 本文件测试 | `node --test --test-timeout=20000 electron/globalCaptureWindowController.test.js` | **91 / 91 / 0**（`duration_ms ≈ 330`） |
| 全量 sweep | `node --test --test-timeout=25000 $(find electron -name '*.test.js')` | **1297 / 1296 / 1**（第 62 批为 1206/1205/1，**净增 91 = 本批全部用例**） |
| 唯一失败 | — | `electron/fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（**第 14 批既有失败，与本批无关、未新增未变化**） |
| 未触碰面 | — | 本批未编辑 `api/`、`src/`、`main.js`，故 `api/**` 沿用第 58 批实测 457/457/0、`src/**` 沿用第 55 批实测 1262/1219/43（43 项全为缺失夹具 `tests/testPreviewDom.js`，既有） |
| 生产引用 | `grep -rn globalCaptureWindowController`（排除自身与 `node_modules`） | 0 命中 |
| git 快照 | `echo "staged=$(git diff --cached --name-only \| wc -l) …"` | `staged=0 modified=58 untracked=369 conflicts=0`（第 62 批专题文档落盘后为 367，**+2 = 本批 `globalCaptureWindowController.js` + `.test.js`**，已用 `git ls-files --others` 逐一列出；本专题文档落盘后为 370）。`modified` 同为 58，**本批未编辑任何既有源文件** |
| 毒副作用 | — | 无真实 `BrowserWindow`、无真实 `screen`/`nativeTheme`、无真实 `loadFile`、无真实 `capturePage`、无真实 IPC、无真实 PowerShell、**无真实 `taskkill.exe`**、无网络 |

### 4.1 忠实性 token 级比对（非目测）

工具 `C:/Users/luobote/.qoder/tmp/deobf-tools/cmp-tokens.mjs`（先把 `_0x…` 归一为 `V`、`!![]`→`true`、`![]`→`false`、`0x…`→十进制、`\x20`→空格、`['x']`→`.x`）：

```
port tokens=3424  repo tokens=3424
matched=2977
```

- **ONLY IN PORT = 447** = `V` **446** 个 + **1** 个品牌前字符串 `'发送到 Shuo Canvas 无限画布'`；
- **ONLY IN REPO = 447** = 语义名 **446** 个 + **1** 个品牌后字符串 `'发送到 AI CanvasPro 无限画布'`；
- **两侧 token 总数相同（3424 = 3424）**，且 `ONLY IN PORT` 与 `ONLY IN REPO` 数量相同、446 对一一对应 → **非标识符残差为 0**。

即本批是「**纯 `_0x` → 语义名重命名 + 1 处品牌字面量**」，比第 62 批还干净：**连 prettier 折行造成的尾逗号差都没有**（第 62 批有 1 个逗号差，本批 0）。改写脚本 `transform-capture-controller.mjs`（98 条映射 + 1 条品牌正则 + "0 命中即 throw" 守卫 + `_0x`/`Shuo` 残留双向校验）只在临时目录，**不在仓内**。

`\x20` 转义字面量按既定约定**原样保留**（本模块 3 处：`'Native\x20popup\x20transitions\x20disabled\x20before\x20presentation'`、`'Native\x20popup\x20transitions\x20could\x20not\x20be\x20disabled'`、`'Global\x20capture\x20window\x20failed\x20to\x20show'`）。

## 5 · 本批本仓改写（1 处）

| 位置 | 端口源 | 本仓 | 理由 |
| --- | --- | --- | --- |
| `ensureWindow()` 内 `BrowserWindow` 的 `title` | `'发送到 Shuo Canvas 无限画布'` | `'发送到 AI CanvasPro 无限画布'` | 该字符串是本应用**自己的窗口标题**（会出现在任务栏/辅助功能树里），沿用端口源的 `Shuo` 品牌在本仓是错的；沿用第 60/61 批的 `SHUO Canvas → AI CanvasPro` 口径，只替换品牌词，中文与"无限画布"保留 |

**其余全部逐字照搬**：`'#' + '0'['repeat'](0x8)`（`'#00000000'`）、`'pop-up-menu'`、`'globalCaptureWindow:present'`、`'global-capture-'`、`'globalCaptureWindow'`、`'source-text'`、`'Alt+C'`、`'empty-capture-frame'`、`'capture-controller-destroyed'`、`'native-window-preparation-failed'` 等字符串，以及 6 个日志类型、10 个拒绝原因（`invalid-capture` / `capture-cancelled` / `window-unavailable` / `capture-controller-destroyed` / `window-show-failed` / `untrusted-sender` / `stale-presentation` / `window-frame-failed` / `invalid-action` / `stale-capture` / `action-in-flight` / `capture-not-ready` / `dispatch-failed`）、全部十六进制字面量（`0x190`/`0x34`/`0x104`/`0x500`/`0x2d0`/`0xc`/`0xe`/`0x18`/`0x78`/`0x8`/`0x0`/`0x1`/`0x2`）与 `!![]` / `![]` 风格（本模块不含 BigInt 字面量）。

`BrowserWindow` 构造项里的 `width` / `height` 取自 `windowSize`（默认 `DEFAULT_WINDOW_SIZE`），**未**改成 `resolveGlobalCaptureWindowBounds` 的产物——这与端口源一致（`bounds` 是 `setBounds` 给的，构造尺寸只是初值）。

## 6 · 未执行的验收项（不得当作已完成）

1. **未创建过真实 `BrowserWindow`**：无边框/透明/置顶/任务栏隐藏等 18 个构造项只在"类替身收到的 options"上验证，**Electron 是否真的接受 `roundedCorners:false` + `transparent:true` + `backgroundMaterial:'none'` 组合、真实窗口是否真的无阴影不可缩放，全未验证**。
2. **未读真实 `screen` / `nativeTheme`**：`getCursorScreenPoint` / `getDisplayNearestPoint` / `shouldUseDarkColors` 全为替身；**多显示器真实工作区、真实光标、真实暗色主题未跑**。`resolveGlobalCaptureWindowBounds` 的数学有 11 条离线用例，但**真实 DPI 缩放下的坐标语义未验证**。
3. **未加载真实页面**：`loadFile(<dirname>/globalCaptureWindow.html)` 只验证了拼接出的路径，**`globalCaptureWindow.html` 在本仓不存在**（见 §7），故真实 `loadFile` 必然失败——本批的"窗口可用"仅在替身上成立。
4. **未执行真实原生过渡**：`prepareWindow` 默认值虽指向第 60 批的 `disableWindowsWindowTransitions`，但 91 项测试**全部注入替身**；真实 `DwmSetWindowAttribute(3)` 调用属第 60 批范围，本批未触发。
5. **未跑真实 `capturePage`**：跳帧守卫依赖 `capturePage(undefined,{stayHidden:true,stayAwake:true})` 与 `isEmpty()`；**真实离屏帧的"空帧"判定、以及"窗口不可见时截帧能否成功"未验证**。
6. **未跑真实跨进程时序**：`webContents.send('globalCaptureWindow:present', …)` 的**接收端在本仓不存在**；"发送 → 渲染器绘制 → `didPresent` → 显示"这条真实闭环**未验证**。测试里的 `capturePageImpl` 用 deferred 模拟了"截帧期间呈现被换掉"，但真实 IPC 竞态未验证。
7. **未被任何生产代码装配**：本批**零引用**（§3），故 `BrowserWindow` 从未被构造、`ipcMain` 从未收到这 4 条通道的真实请求；`main.js` 的捕获链**仍不可达**。
8. **未验证 `focus()` 的真实语义**：`focusWindow` 依赖"`focus()` 之后 `isFocused()` 变 `true`"，测试用 `focusEffective` 开关模拟两种结果；**真实 Windows 下"拒绝抢焦点"（ForegroundLockTimeout）导致的 `isFocused()` 仍为 false 才是常态**，此时 `focusRetryDelayMs`(默认 24 ms) 的单次重试是否够用、`userFocused` 是否会漏置，**未验证**。
9. **未验证 `destroy()` 的真实 `closed` 事件**：替身的 `destroy()` 不发 `closed`（真实 Electron 会异步发），故"`destroy` → `closed` 处理器再清一次状态"这条真实二次清理路径未执行。

## 7 · R15 剩余（本批后）

| 项 | 规模 | 依赖状态 | 备注 |
| --- | --- | --- | --- |
| `globalCaptureControllers.js` | 46 行 / 1 878 B | **已全齐**（`createGlobalCaptureWindowController` 本批 + `createSelectedTextCaptureController`（第 41 批 `electron/selectedTextCapture.js`）+ `createGlobalTextPresetShortcutController`（第 41 批 `electron/globalTextPresetShortcutController.js`）） | **主进程装配层**：构造面板控制器 + 选中文本控制器 + 快捷键控制器，把 `show`/`hide`/`isVisible` 注入快捷键控制器，并把四方法暴露给 IPC 层。**建议下一批** |
| `globalCaptureWindowPreload.cjs` | 16 行 / 794 B | **移植树内** | 面板窗口 preload；`globalCaptureWindowController` 的 `webPreferences.preload` 直接指向它 |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | **待先移依赖** | 面板渲染器。静态 import `src/modules/interaction/contextMenuIcons.js` 与 `src/modules/workspaceHorizontalWheel.js`——**二者在 0.7.16 反混淆树中存在**（`shuo-deobf/src/modules/interaction/contextMenuIcons.js`、`shuo-deobf/src/modules/workspaceHorizontalWheel.js`），只是**本仓尚未移植**，属移植次序问题而非源码缺失 |
| `globalCaptureWindow.html` | — | **在 0.7.16 安装包内** | 已用 `grep -a` 确认 `D:\shuocancas\SHUO Canvas\resources\app.asar` 内含该文件名；**未解包、未阅读内容**（解包需第三方工具，属运行授权范围） |
| 渲染器对端 | `globalCaptureReceiver.js`（1 721 B，移植树 `shuo-deobf/src/modules/app/`）+ `global-capture-window.css`（安装包 `resources/webapp/styles/` 内） | **待核** | `'globalCaptureWindow:present'` 的接收端与面板样式，本仓均无 |
| `web-preview/*` 5 条路由 | — | 待核 | 消费第 59 批管理器 |
| `storage-migration/prepare` | — | 待核 | 第 38 批只接了 `read`/`complete` |

**R15 依赖缺口维持归零**：本批的 3 条静态 import 全部命中本仓既有模块（`node --check` + 91 项测试实跑通过即为证）。本批的**新发现**是：捕获面板集群的边界比台账此前记载的更大——除 `globalCaptureWindow.js` 外，还有 `globalCaptureControllers.js`（装配层）、`globalCaptureWindowPreload.cjs`、`globalCaptureWindow.html` 与 webapp 侧的 `globalCaptureReceiver.js` / `global-capture-window.css`，以及 4 条**已注册待接**的 IPC 通道（§3）。**下一批建议先做 `globalCaptureControllers.js`**（依赖已全齐、体量最小、是 4 条通道接线的必经一步）。

## 8 · 约束复核

- 未 push、未 commit、未 `git reset --hard` / `git clean` / 批量 checkout / 全量覆盖目录；未清理任何 untracked 文件。
- 未触碰 `api/freeImageHostApi.js`（本批零改动该文件；该文件的 md5 `1e0458013f5341c99f21faefc1d34d3f` 未被本批任何操作影响）。
- 未改动安装目录 `D:\shuocancas` 下任何文件；反混淆临时树与 `app.asar` 只作**只读**查询源（`grep -a` 只读文件名列表，未解包、未写入）。
- 未引入绝对开发机路径或反混淆临时目录为运行时依赖（模块内只有 `./` 相对 import 与 `node:path`）。
- 未改授权检查；未把 MCP 地址/会话 ID/API 密钥写入仓库。
- 测试**全离线**：`BrowserWindowClass` / `screenApi` / `nativeThemeApi` / `onAction` / `logDiagnosticEvent` / `prepareWindow` / `setTimeoutFn` / `clearTimeoutFn` 全部注入替身；**从未构造真实窗口、从未读真实屏幕、从未截真实帧、从未启动真实进程**。
- 未为"让模块有引用"而擅自接线（§3 明确说明为何半接线会造死路）。
- 静态检查与运行结果分开报告：`node --check` / `prettier --check` 属静态；`node --test` 的 91 与 sweep 的 1297/1296/1 属实跑结果，均已如实记录。快照数字用 `git` 实测，非估计。
