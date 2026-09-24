# 第59批 · R15 chrome-shell 网页预览管理器（`chromeShellWebPreviewManager`）

> 本批为**离线移植 + 已执行离线测试**的存证记录，不是 R01 验收，也不是 R15 完成。
> 移植源：`C:\Users\luobote\.qoder\tmp\shuo-electron-deobf\chromeShellWebPreviewManager.js`（810 行 / 33 189 B）。

---

## 1 · 本批补的缺口

R15（chrome-shell 运行时本体）在第 56–58 批已补齐传输原语（`chromeCdpPipeClient`/`chromeBrowserWorker`）、启动判定与恢复三件套（`chromeShellStartupFallback`/`chromeShellStartupHealth`/`chromeShellProfileRecovery`）、内核版本门禁与 Windows 系统工具（`windowsSystemTools`/`chromeShellBrowserVersion`/`chromeShellStartupDiagnostics`）。**剩下体量最大、且完全自足的一块**是「外部浏览器节点的画面/输入/流」这一层：

- 一个 CDP target 从创建、附加、设视口、导航，到**静态快照**（webp → jpeg 回落）与**实时流**（`Page.startScreencast` + 帧节流 + `screencastFrameAck`）怎么驱动；
- 渲染器侧发来的**输入事件**（鼠标/键盘/文本）怎么换算成 `Input.*` CDP 命令；
- 渲染器侧的**视图同步**（哪些节点可见/激活/选中）与**懒销毁**怎么落到 target 生命周期；
- 快照/流帧/导航状态/失败如何作为**事件队列**回吐给渲染器，以及等待语义（立即取、或限时等待）。

本批取该簇中**唯一零 import、可完全离线验证**的 `chromeShellWebPreviewManager`（810 行 / 33 189 B）。它是 `chromeShellRuntime`（347 行，仍缺）的直接前置，落地后 R15 只剩 4 个模块。

---

## 2 · 本批交付

| 文件 | 来源（端口源） | 行数 / 字节 | 说明 |
| --- | --- | --- | --- |
| `electron/chromeShellWebPreviewManager.js` | `tmp/shuo-electron-deobf/chromeShellWebPreviewManager.js`（810 行 / 33 189 B） | **784 / 31 269** | **零 import**；`createChromeShellWebPreviewManager`、`__chromeShellWebPreviewManagerForTest` |
| `electron/chromeShellWebPreviewManager.test.js` | 本批新写 | **957 / 37 612** | 59 项 |

合计 **1 741 行 / 68 881 B**；**新增 0 个 npm 包**，**未修改任何既有源文件**。

### 2.1 常量与私有助手（逐字移植，标识符语义化）

- 常量（**全部保留 `_0x`/十六进制字面量**）：`MAX_EVENT_QUEUE_SIZE = 0xa0`(160)、`MIN_VIEWPORT_WIDTH = 0x140`(320)、`MIN_VIEWPORT_HEIGHT = 0xb4`(180)、`MAX_VIEWPORT_WIDTH = 0x780`(1920)、`MAX_VIEWPORT_HEIGHT = 0x4b0`(1200)、`SNAPSHOT_QUALITY = 0x48`(72)、`SCREENCAST_QUALITY = 0x3a`(58)、`SCREENCAST_MAX_WIDTH = 0x500`(1280)、`SCREENCAST_MAX_HEIGHT = 0x320`(800)、`SCREENCAST_MIN_FRAME_INTERVAL_MS = 0x18`(24)、`EVENT_WAIT_MIN_MS = 0x32`(50)、`EVENT_WAIT_MAX_MS = 0x1388`(5000)。
- `clampNumber(value, min, max, fallback)`：`Number.isFinite` 不成立 → `fallback`；否则 `max(min, min(max, round(value)))`。
- `normalizeNodeId` → `String(nodeId || '').trim()`；`normalizeTabId` → 同上但空则 `'default'`。
- `normalizeHttpUrl` → `new URL(...)` 且 `protocol` 必须是 `http:`/`https:`，否则 `''`（`about:`/`file:`/`javascript:`/`data:` 全被拒）。
- `toEntryKey(nodeId, tabId)` → `normalizedNodeId + '\x00' + normalizedTabId`（**NUL 分隔**）。
- `normalizeViewport(viewport = {})`：`zoomFactor = max(0.05, Number(zoom) || 1)`；`bounds` 非对象则 `{}`；`visualWidth = clampNumber(bounds.width, 1, 0x780, 0x3c0)`、`visualHeight = clampNumber(bounds.height, 1, 0x4b0, 0x258)`；返回 `{width, height, visualWidth, visualHeight, zoomFactor}`，其中 `width/height = clampNumber(visual/zoom, MIN, MAX, 默认)`。
- `createReferenceSnapshotExpression()`：返回一段**内联表达式字符串**（`pageUrl`/`pageTitle`/`selectedText`，`selectedText` 取 `globalThis.getSelection()?.toString()` 后 `.slice(0, 5000)`）。
- `normalizeInputModifiers(input = {})`：`alt1 | ctrl2 | meta4 | shift8` 位掩码。
- `normalizeMouseButton(button)`：`0/'left'→'left'`、`1/'middle'→'middle'`、`2/'right'→'right'`、`3/'back'→'back'`、`4/'forward'→'forward'`，其余 `'none'`。

### 2.2 `createChromeShellWebPreviewManager({ client, logEvent = null, now = () => Date.now(), setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout })`

`client` 无 `send` 函数 → `TypeError('Chrome CDP client is required')`。内部状态：`entries`（`Map<key, entry>`）、`sessionEntries`（`Map<sessionId, entry>`）、`eventQueue`（数组）、`waiters`（Set）、`eventSequence`、`disposed`。

**条目模型**（`createEntry`）：`key`/`nodeId`/`tabId`、`targetId`/`sessionId`、`requestedUrl`/`url`、`ready`/`disposing`、`active`/`visible`/`selected`、`capturePending`/`captureQueued`、`inputCaptureTimer`、`screencastActive`/`screencastDesired`/`screencastUnavailable`/`screencastRestartRequested`/`screencastReconcilePromise`/`lastScreencastEmitAt`/`screencastFrameTimer`/`pendingScreencastFrame`、`viewportWidth`/`viewportHeight`/`visualWidth`/`visualHeight`/`zoomFactor`、`readyPromise`。

**target 生命周期**（`attachTarget`）：`Target.createTarget {url:'about:blank', background:true, focus:false}` → 无 `targetId` 抛 `'Chrome did not create a browser target'` → `Target.attachToTarget {targetId, flatten:true}` → 无 `sessionId` 抛 `'Chrome did not attach to the browser target'` → 登记 `sessionEntries` → `Page.enable` → `Runtime.enable` → `applyViewport` → `ready = true` → `navigate(entry, normalizeHttpUrl(view.webUrl))`。

**视口**（`applyViewport`）：先无条件刷新 `visualWidth/visualHeight/zoomFactor`；仅当 `viewportWidth`/`viewportHeight` 变化才写回并发 `Emulation.setDeviceMetricsOverride { width, height, deviceScaleFactor:1, mobile:false }`。

**导航**（`navigate`）：无 session 或 url 为空或与 `entry.url` 相同 → `false`；否则先置 `url`/`requestedUrl` 并推 `loading` 事件，再 `Page.navigate {url}`；`result.errorText` 非空 → 推 `failed {url,message}` 并返回 `false`。

**静态快照**（`captureSnapshot`）：`disposed`/`disposing`/无 session/`active !== true`/`screencastActive`/`capturePending` 任一成立即返回 `false`（若 `capturePending` 则置 `captureQueued` 以便重入）；否则先 `Page.captureScreenshot {format:'webp', quality:0x48, fromSurface:true, optimizeForSpeed:true}`，**抛错则回落** `format:'jpeg'` 同参数；`data` 空/已 disposing/已转流/条目已被替换 → `false`；否则推 `snapshot {surfaceMode:'remote-snapshot', dataUrl:'data:<mime>;base64,<data>', freezeToken:'ready', width: visualWidth||viewportWidth||0, height:…, zoomFactor: zoomFactor||1}`。整体 `catch` → `logFailure('chrome_web_preview.snapshot_failed', 'Chrome\x20browser\x20node\x20snapshot\x20failed', error, entry)`；`finally` 清 `capturePending` 并对 `captureQueued` 递归一次。
- `scheduleSnapshot(entry, delayMs = 0x5a)`（90 ms）：disposing/已转流直接返回；已有 `inputCaptureTimer` 先 `clearTimeoutFn`；再 `setTimeoutFn` → 清 timer + `captureSnapshot`。

**实时流**（`shouldStream`）：`!disposing && !screencastUnavailable && active && visible && selected` 全真才为真。
- `buildScreencastParams(entry)` → `{format:'jpeg', quality:0x3a, maxWidth: min(0x500, max(1, viewportWidth||1)), maxHeight: min(0x320, max(1, viewportHeight||1)), everyNthFrame:1}`。
- `reconcileScreencast(entry, {restart = false})`：写 `screencastDesired = shouldStream(entry)`；`restart && screencastActive` → 置 `screencastRestartRequested`；已有 `screencastReconcilePromise` 则直接复用它（**并发去重**）。循环体：需要停 → 清 `screencastRestartRequested`/帧定时器/挂起帧，`Page.stopScreencast`（抛错记 `chrome_web_preview.screencast_stop_failed`）后 `screencastActive = false` 并 `continue`；需要起 → `Target.activateTarget {targetId}` + `Page.startScreencast`，成功后 `screencastActive = true`、`lastScreencastEmitAt = 0`，失败则置 `screencastUnavailable`/`screencastDesired = false` 并记 `chrome_web_preview.screencast_start_failed`（文案含 `using snapshots`），再 `continue`；否则 `break`。返回 `screencastActive`，`finally` 清 `screencastReconcilePromise`。
- `emitScreencastFrame(entry, data)`：无 data 或未转流或非 `active`/`visible` 或 disposing → `false`；否则记 `lastScreencastEmitAt = now()` 并推 `snapshot {surfaceMode:'remote-snapshot', streaming:true, dataUrl:'data:image/jpeg;base64,'+data, freezeToken:'live', …}`。
- `throttleScreencastFrame(entry, data)`：`elapsed = now() - lastScreencastEmitAt`；若从未发过（`=== 0x0`）或 `elapsed >= 0x18` → 清帧定时器与挂起帧后**立即** `emitScreencastFrame`；否则挂起 `pendingScreencastFrame = data`，已有定时器则返回 `false`，否则建定时器（延时 `max(0, 0x18 - elapsed)`）→ 到点清空挂起帧并 emit。

**事件队列**（`pushEvent`）：`snapshot` 类型会**先删除同一 node/tab 的旧快照**再入队；每条事件带自增 `sequence` 与 `createdAt: now()`；超过 `0xa0` 条 `shift()` 丢弃最旧；随后 `settleWaiters()`。
- `waitForEvents({waitMs})`：`disposed` → `Promise.resolve([])`；队列非空 → 立即 `drainEvents()`；否则 `waitMs` 经 `clampNumber(…, 0x32, 0x1388, 0x3e8)` 夹取后登记 waiter（`{resolve, timer}`），到点自删并 resolve `[]`。
- `settleWaiters()`：队列空或无 waiter 直接返回；否则取**第一个** waiter，删之，清其定时器，resolve 为 `drainEvents()`。

**客户端事件扇出**（`handleClientEvent`，经 `client.onEvent` 订阅，未提供 `onEvent` 时退化为空函数）：按 `sessionId` 查条目，无或 disposing 即忽略。
- `Page.frameStartedLoading` → 若有 `requestedUrl` 则推 `loading {url: requestedUrl, holdSnapshot:false}`。
- `Page.frameNavigated` → 仅当 `frame.parentId` 为空且 `frame.url` 为 http(s) 时，写 `url`/`requestedUrl` 并推 `navigated {url}`。
- `Page.loadEventFired` → 推 `loaded`，随后 `Promise.all([emitNavigationState(entry), 已转流 ? resolve(true) : captureSnapshot(entry)])`。
- `Page.screencastFrame` → `sessionId` 为有限数则 `Page.screencastFrameAck {sessionId}`（`.catch(() => {})`）；随后 `throttleScreencastFrame(entry, String(params.data||'').trim())`（**ack 与节流相互独立**）。
- `Inspector.targetCrashed` → 推 `failed {message:'浏览器页面进程已退出'}`。

**渲染器入口**（返回值对象）：
- `syncViews({views})`：`disposed` → `{ok:false, error:'disposed'}`；对每个有 `nodeId` 且 http url 的视图登记 `activeKeys` 并并发 `syncView`；再对不在 `activeKeys` 的条目并发 `disposeEntry`；返回 `{ok:true, count: entries.size, visibleCount: 可见数}`。
  - `syncView(view)`：无 nodeId 或无合法 url → `null`；复用或新建条目，记录 `becameActive`/`becameSelected`；写 `active`/`visible`/`selected`；`await readyPromise`，若 disposing → `null`；`applyViewport`（`viewportChanged`）→ `navigate`（`navigationApplied`）→ `reconcileScreencast({restart: viewportChanged})`；最后**仅在** `active && !screencastActive && !navigationApplied && (becameActive || becameSelected || viewportChanged)` 时补一次 `captureSnapshot`；任何异常 → `null`。
- `disposeViews({nodeIds, tabIds, all})`：按 `nodeIds`/`tabIds` 集合过滤（两集合都空且 `all !== true` → 不选中任何条目）；返回 `{ok:true, disposed: 已销毁数}`。
- `controlView({nodeId, tabId, action, input})`：无 nodeId → `{ok:false, error:'missing-node'}`；无条目 → `{ok:false, error:'missing-view'}`；`await readyPromise` 后仍无 session/disposing → `missing-view`。分支：
  - `reload` → 推 `loading {url: entry.url}` + `Page.reload {ignoreCache:true}`；落到统一收尾（见下）。
  - `back`/`forward` → `Page.getNavigationHistory` 取 `targetIndex`；目标条目 `id == null` → 推 `blocked {message:'没有上一页'|'没有下一页'}` 并返回 `{ok:false, error:'no-history', …navigationState}`；否则 `Page.navigateToHistoryEntry {entryId}`。
  - `dispatch-input` → `input` 非对象则 `{}`；`modifiers` 由 `normalizeInputModifiers` 得出。
    - `kind:'mouse'`：`type` 必须属 `['mousePressed','mouseReleased','mouseMoved','mouseWheel']`，否则 `unsupported-input`；`xRatio`/`yRatio` 夹取 0–1 后乘 `max(1, viewportWidth/Height)` 得 `x`/`y`；发 `Input.dispatchMouseEvent {type,x,y,modifiers,button: normalizeMouseButton(input.button), buttons, clickCount, …(mouseWheel ? {deltaX,deltaY} : {})}`；`type !== 'mousePressed'` 才 `scheduleSnapshot`。
    - `kind:'key'`：`type === 'keyUp' ? 'keyUp' : 'keyDown'`；发 `Input.dispatchKeyEvent {type, modifiers, key, code, text: keyDown?text:'', unmodifiedText: 同, windowsVirtualKeyCode, nativeVirtualKeyCode, autoRepeat: input.repeat === true}`；`keyUp` 才 `scheduleSnapshot`。
    - `kind:'text'`：`Input.insertText {text}` + `scheduleSnapshot`；其余 kind → `unsupported-input`。
    - 成功 → `{ok:true, action, tabId}`。
  - `capture-reference` → `Promise.all([Runtime.evaluate {expression: createReferenceSnapshotExpression(), returnByValue:true, awaitPromise:true}, Page.captureScreenshot {format:'webp', quality:0x48, …}, readNavigationState(entry)])`；返回 `{ok:true, action, tabId, pageUrl: reference.pageUrl || entry.url || entry.requestedUrl || '', pageTitle, selectedText: String(...).slice(0, 0x1388), screenshotDataUrl: data ? 'data:image/webp;base64,'+data : '', capturedAt: new Date(now()).toISOString(), …navigationState}`。
  - 其余 action → `unsupported-action`。
  - 统一收尾：`{ok:true, action, tabId, ...(await emitNavigationState(entry))}`。
  - 任何抛错 → `logFailure('chrome_web_preview.control_failed', 'Chrome browser node control failed', error, entry)` + `{ok:false, error: String(error.message || error || 'control-failed')}`。
- `consumeEvents()` → `drainEvents()`。
- `dispose()`：幂等；置 `disposed`、调 `unsubscribe()`、并发 `disposeEntry` 全部条目、`sessionEntries.clear()`、清空 `eventQueue`；对全部 waiter 清定时器并 resolve `[]`、`waiters.clear()`；最后 `client.close?.()`。
- `_getEntry(nodeId, tabId)` → 条目或 `null`。

---

## 3 · 接线现状与可达性

**本批有意不接线，模块当前为生产零引用。**

- 端口源里 `chromeShellWebPreviewManager` 的唯一生产消费方是本批未移植的 `chromeShellRuntime`（`grep` 端口源确认）；在本仓 `main.js` 里凭空调用它会是**伪造消费方**：本仓渲染器是 Electron 内置渲染器、`installDesktopBridgeCompat()` 首道守卫即 `return false`（第55批已证），chrome-shell 启动分支根本不执行，接上去只会造一条死路径。
- 口径同第43批 `sortformerModelRoot.js`、第56批两传输原语、第57批启动三件套、第58批版本门禁：**宁可留白并记账，也不为了「有引用」而擅自接线**。
- 本模块**零 import**，import 侧效应严格为零；仅在被调用时才发 CDP 命令与建定时器，而本仓无调用点。
- **结构性收益**：本模块落地后，`chromeShellRuntime`（347 行 / 13 404 B）的依赖已全部齐备——它只依赖 `chromeBrowserWorker`、`chromeCdpPipeClient`（第56批）与本模块。

| 检查 | 结论 |
| --- | --- |
| 仓内 `import` 引用数 | **0**（除本批测试文件） |
| `main.js` / `mainIpcSetup` / preload 改动 | **无** |
| 新增 env 变量读取 | 无 |
| 对现有测试的影响 | 无（纯新增；`electron/**` 由 985 → **1044**，全部为本批 +59） |

---

## 4 · 已执行的验证

| 命令（离线） | 结果 |
| --- | --- |
| `node --check` × 1 源 + 1 测试 | 退出 0 |
| `prettier --write` + `--check` × 2 文件 | `All matched files use Prettier code style!`（源文件 `unchanged`，测试文件首跑 `--write` 后通过） |
| `node --test electron/chromeShellWebPreviewManager.test.js` | **59/59/0**，约 314 ms |
| `node --test $(find electron -name '*.test.js')` | **1044/1043/1**（唯一失败仍是既有 `electron/fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`，第17批遗留，**未新增未变化**） |
| 快照 | `git diff --cached`=0 / `git diff`=58 / `git ls-files --others`=**353** / 冲突=0（第58批 `0/58/351/0`）：**+2 untracked = 本批 2 个文件**（源 + 测试；专题文档落盘后为 354）。`modified` 同为 58，**本批未编辑任何既有源文件** |

### 4.1 忠实性（token 级 LCS 比对，非目测）

| 状态 | port tokens | repo tokens | ONLY IN PORT | ONLY IN REPO | 结论 |
| --- | --- | --- | --- | --- | --- |
| 原样 | 5705 | 5703 | 819 | 817 | 差集非标识符残留：port 4 个 `,`、repo 2 个 `,`（净 −2） |
| **剥离全部逗号后** | **5236** | **5236** | **815** | **815** | port 侧 815 条**全是 `V`**（标识符），repo 侧 815 条**全是语义名**；**非标识符残留 0** |

即：`chromeShellWebPreviewManager` 是**纯重命名移植、零逻辑分歧**；唯一的字面差异是**多行构造上的尾逗号位置**（本仓 prettier 的 `--write` 已把 8 个中的 6 个补齐，余下 2 个是「本仓把某处多行数组折叠成单行」与「端口源自身带 4 个尾逗号」的组合，不影响语义）。

### 4.2 测试设计要点

- 全部依赖注入：`client` 为 `send`/`onEvent`/`close` 三件套的 double（`send` 按方法名查脚本，值可为字面量、函数或 `Error`；`Error` 走 reject），`now` 为可控计数器，`setTimeoutFn`/`clearTimeoutFn` 为**假定时器 registry**（可查 `pendingMs()`、可 `fire`/`fireAll`），`logEvent` 为事件收集器。**从不启动真实进程、从不触碰真实浏览器、从不联网**。
- 5 个导出助手（`normalizeHttpUrl`/`normalizeInputModifiers`/`normalizeMouseButton`/`normalizeViewport`/`toEntryKey`）逐一覆盖：协议白名单、NUL 键、位掩码、5 组按钮映射、默认/最小/最大视口、zoom 乘除与 0.05 地板、非数 bounds 与 `null` 的差异（`null` 被当作数值 0 再夹到最小值 1）。
- `syncViews` 覆盖：CDP 调用序列与参数、`loading` 事件、无 nodeId/非 http 视图被跳过、`visibleCount` 计数、**陈旧条目被 `Target.closeTarget` 懒销毁**、重复同步不重建 target/不重设视口、target 创建失败走 `failed` 事件 + `create_failed` 日志。`controlView` 覆盖 6 条分支（`reload`/`back` 有页与无页/`forward` 无页/`dispatch-input` 三种 kind + 两类非法输入/`capture-reference` 与降级/未知 action/底层 reject 时 `control_failed`）。
- 事件链覆盖：`frameStartedLoading`/`frameNavigated`（含子帧与非 http 被忽略）/`loadEventFired`（`loaded` + 快照）/`screencastFrame`（ack 与节流**相互独立**，非有限 `sessionId` 不 ack 但仍出帧、空 data 不帧）/`targetCrashed`/未知 session 全忽略。
- 队列语义覆盖：容量 160 丢最旧（断言首尾 `sequence`）、同视图快照**替换**旧快照（断言 5 条事件中恰 1 条 snapshot 且 2 loaded + 2 navigation-state）、`waitForEvents` 立即取 / 定时等待 / 三段夹取（50 / 5000 / 默认 1000）/ 首个 waiter 被 `pushEvent` 就地唤醒。
- 销毁覆盖：`disposeViews` 按 id、按 `all`、无选择器不误删；`dispose` 幂等、解订阅、关 client、拒绝后续 `syncViews`、唤醒挂起 waiter、容忍无 `onEvent` 的 client。

---

## 5 · 本仓独有差异

**零处。** 端口源中不含 `SHUO`/应用名类字面量（实测 0 命中），本模块**没有需要按本仓改写的字符串**；中文文案（`'浏览器页面进程已退出'`、`'没有上一页'`/`'没有下一页'`）与 `\x20` 转义（`'Chrome\x20browser\x20node\x20snapshot\x20failed'`、`'Browser\x20target\x20failed'`）**照旧保留**。未改任何 locale 文件、未加 i18n key。

---

## 6 · 未执行的验收项（不得当作已完成）

1. **未跑过真实浏览器**：全部 CDP 帧由 double 脚本喂入；真实 `--remote-debugging-pipe` 下 `Target.createTarget`/`attachToTarget` 的 `sessionId` 路由、真实 `Page.startScreencast` 帧率与 `screencastFrameAck` 反压、真实 `Emulation.setDeviceMetricsOverride` 生效**均未验证**。
2. **未验证真实快照编码**：webp→jpeg 回落是用「让 webp 那次抛错」合成出来的；真实 Chromium 在 `--headless=new` 下对 `format:'webp'` 的支持面与 `optimizeForSpeed` 的实际效果未验证。
3. **未验证真实输入语义**：`xRatio/yRatio × viewport` 的像素换算、`buttons`/`clickCount`/`deltaX/deltaY` 的语义、`windowsVirtualKeyCode`/`nativeVirtualKeyCode` 对真实按键的作用**未验证**。
4. **未在 Electron 主进程内运行**：模块未打包、未被 `main.js` 引用，59 项全是纯 Node 离线用例；真实渲染器侧的 `syncViews`/`controlView`/`consumeEvents`/`waitForEvents` 契约（IPC 或桥路由）**未接线**（消费方 `chromeShellRuntime` 未移植）。
5. **真实事件节流时基未验证**：`SCREENCAST_MIN_FRAME_INTERVAL_MS = 24` 的节流是用假时钟验证的；真实 1/24 s 帧间隔下的挂起帧合并行为未实测。
6. **`window/` 级清理未验证**：`dispose()` 对真实 target 的 `Target.closeTarget` 与管道断开后的行为未实测。

---

## 7 · R15 剩余（下一步）

**本批之后 R15 仍缺 4 个模块 + 5 条路由**（原 7 个模块已落地 6 个前置 + 本批 1 个）：

| 模块 | 端口源大小 | 依赖 | 现状 |
| --- | --- | --- | --- |
| `chromeShellRuntime.js` | 347 行 / 13 404 B | `chromeBrowserWorker`（第56批）、`chromeCdpPipeClient`（第56批）、**`chromeShellWebPreviewManager`（本批）** | **依赖全齐，最优先** |
| `chromeShellLauncher.js` | 976 行 / 51 397 B | `node:child_process`/`fs`/`path`、`chromeShellBrowserVersion`（第58批）、`chromeShellStartupDiagnostics`（第58批）、`windowsTaskbarIdentity`（**仍缺**） | 依赖缺 1 |
| `globalCaptureWindowController.js` | 463 行 / 17 934 B | `electron`、`node:path`、`windowsWindowTransitions`（**仍缺**） | 依赖缺 1 |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | `src/modules/interaction/contextMenuIcons.js`、`src/modules/workspaceHorizontalWheel.js`（**本仓存在性待核**） | 待核 |

依赖缺口：`windowsTaskbarIdentity.js`/`windowsWindowTransitions.js` 在本仓 `electron/` 下**均不存在**（`windowsSystemTools.js` 已于第58批落地）；`web-preview/*` 5 条路由与 `storage-migration/prepare` 仍在 `desktopHttpBridge` 侧留空（归 R02）。

**建议下一批**：`chromeShellRuntime`（347 行 / 13 404 B，依赖已全齐、可直接消费本批模块），随后按依赖顺序补 `windowsTaskbarIdentity`/`windowsWindowTransitions` 并攻 `chromeShellLauncher`。

---

## 8 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批零 `api/` 改动）；未 push；未 `git reset --hard`/`git clean`/批量 checkout；未覆盖任何既有文件。
- 未改动授权校验逻辑；未在仓内写入任何 MCP 地址/会话 ID/密钥；未把反混淆临时目录或绝对开发机路径写成运行时依赖（模块本身**零 import**，路径全部来自入参）。
- 未伪造消费方接线（§3）；未伪造缺失测试夹具；未执行任何真实子进程/网络/浏览器/厂商调用；未运行 `taskkill.exe`。
