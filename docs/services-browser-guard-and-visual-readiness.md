# 第117批专题：打包浏览器快捷键守卫 / 启动证据采集 / 首屏视觉就绪三件纯叶（落地不接线）

承接第116批固化的「**OK 候选排期前必须先过跨树具名导出闸门**」口径，本批从 `src/services` 余 5 件零依赖纯叶中取三件落地（另两件留后续批次）。三件**全部 0 条相对 import**，因此不受导出盲区影响；`cmp` 逐字节保真、端口产物未编辑一字。

## 1. 落地清单

| 文件 | 行数 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `src/services/startupVisualReadiness.js` | 116 / 4 424 | 3 524 | `isStartupVisualComplete`、`waitForStartupVisualComplete`、`createLatestStartupVisualTaskQueue` |
| `src/services/packagedBrowserShortcutGuard.js` | 82 / 3 479 | 2 961 | `isPackagedChromeShellLocation`、`isBlockedPackagedBrowserShortcut`、`installPackagedBrowserShortcutGuard` |
| `src/services/rendererStartupEvidence.js` | 57 / 2 340 | 1 917 | `collectRendererStartupEvidence` |
| 合计 | **255 / 10 243** | 8 402 | **7** |

`src/services` 零依赖纯叶缺口 **5 → 2**（仅剩 `fastImagePreviewService.js` 6 980 B、`videoFramePresentation.js` 7 322 B）。

三件的模块级内部常量（未导出、构成行为的一部分）：`INITIAL_APP_SHORTCUT_BINDINGS = Object.freeze(['CTRL+SHIFT+C'])`、`STARTUP_LOADER_ID = 'v2-initial-loader'`、`STARTUP_VISUAL_FALLBACK_POLL_MS = 0x64`（100 ms）。

## 2. 端口现状要点（只记账，不打补丁）

### 2.1 `packagedBrowserShortcutGuard.js`

1. **键名归一**：`String(key||'').toLowerCase()`，`key` 为空才用 `code` 并 `replace(/^Key/i,'')` ⇒ `{code:'KEYr'}` 归一成 `'r'`；但 **`key` 只要有值就完全屏蔽 `code`**（`{key:'x', code:'F5'}` 不算 F5）。
2. **绑定串构造**：`ctrlKey` **或** `metaKey` 都产出 `CTRL` 段（即 mac 的 ⌘ 在绑定里被当成 CTRL），`shiftKey`→`SHIFT`，`altKey`→`ALT`，再追加非修饰键的大写键名；纯修饰键事件的尾段被排除 ⇒ 绑定退化为 `'CTRL'` 这类值，因此**永远不会命中拦截表**（`isBlocked` 本身就是前置门槛）。
3. **拦截表并非单一判据**：`f5`/`f12` 无修饰即拦；`r` 必须带 ctrl 或 meta；`[c,i,j]` 要求 `(ctrl&&shift) || (meta&&alt)`；另有独立一条 `meta&&shift&&c`。⇒ **`meta+shift+i` 不在表内**（只有 `c` 被这条分支覆盖）。
4. **`isInspectElementShortcut` 只认 `c`**（`ctrl+shift+c` 或 `meta+shift+c`），命中即**无条件 `preventDefault`**，与是否打包位置无关；`i`/`j` 虽在拦截表内，但**非打包位置时不动作**。
5. **`install` 的分支顺序决定副作用强度**：`__aicShortcutRecording === true`（用户正在设置里录制快捷键）⇒ 整条守卫直通；命中「已配置为应用快捷键」或「检查元素」⇒ **只 `preventDefault`**；只有**打包 chrome-shell 位置 + 表内键**才额外 `stopImmediatePropagation`。⇒ 开发态下 `Ctrl+Shift+C` 仍可被应用自身消费。
6. 配置表来自 `windowObject.__aicConfiguredShortcutBindings`，**非数组即回落内置常量**（字符串 `'CTRL+SHIFT+C'` 也算无效）；注册与摘除都以 `capture=true` 第三参成对出现。
7. `isPackagedChromeShellLocation` 要求 `aicRuntime=chrome-shell` **且** `aicPackaged=1` 同时命中，参数顺序无关；取 `search` 抛错被 `catch` 兜成 `false`。

### 2.2 `rendererStartupEvidence.js`

1. `category` 判定是**先分类后短路**：`target.tagName === 'SCRIPT'` 直接定为 `script-load` 并**跳过全部消息判据**（哪怕 `message` 命中 fetch/export、`error.name` 是 `TypeError`）；否则依次 `module-fetch` → `module-export` → 严格等值 `'Script error.'` ⇒ `opaque-script-error`（**尾部多一个空格就落到下一档**）→ `error.name ∈ {Syntax,Reference,Type,Range}Error` ⇒ 用该名 → 兜底 `runtime-error`。
2. `source` 经 `codePath`：必须**与 `location.href` 同源**且路径匹配 `^\/(main\.js|(src|api|vendor)\/[A-Za-z0-9_./-]+\.m?js)$`，命中后截 240 字符；跨源、`/index.js`、`.css`、`.ts` 一律 `''`；`href` 不可解析时 `new URL(base)` 抛错被吞 ⇒ 所有路径为空。
3. `line`/`column` 只保留**正安全整数**，`0`/负数/小数/字符串/`NaN`/超 `MAX_SAFE_INTEGER` 全部归 `0`。
4. `documentState` 白名单 `loading|interactive|complete`，其余（含无 `document`）为 `'unknown'`。
5. `failedScriptRequests` 只收 `responseStatus >= 400` **且** `codePath` 非空的资源条目，`slice(-8)` 取**末 8 条**，映射为 `{source, status}`；`responseStatus` 缺失（`undefined >= 400` 为 `false`）不算失败；`getEntriesByType` 缺失/返回 `null`/抛错三种情况都落回 `[]`（抛错走 `catch`，返回体仍完整）。
6. **环境对象无空值保护**：第二个入参直接 `env['location']?.['href']` ⇒ 传 `undefined` 会 `TypeError`（事件对象则有完整可选链）。

### 2.3 `startupVisualReadiness.js`

1. 完成判据分三段：加载层**不存在 / `isConnected === false` / `hidden === true`** 直接算完成；否则读呈现（`window.getComputedStyle` 优先，抛错回落 `element.style`）；**两者都拿不到时保守返回 `false`（未完成）**。
2. 呈现阈值：`display==='none'` **或** `visibility==='hidden'`（都先 `trim().toLowerCase()`）或 `parseFloat(opacity) <= 0.001`；`opacity` 缺省字符串 `'1'`、非数字 `NaN` 不参与比较 ⇒ 判未完成。
3. `waitForStartupVisualComplete` 的三条解析路径：`MutationObserver`（observe 目标为 `documentElement`，选项固定 `attributes + attributeFilter:['class','hidden','style'] + childList + subtree`）、加载层的 `animationend`/`transitionend` 监听、以及**仅在没有 MutationObserver 时**才启用的 100 ms `setTimeout` 轮询；解析时统一 `disconnect` + 摘两个监听 + `clearTimeout(最后一次 id)`（**轮询续排后清的是最新 id，不是首个**）。
4. `setTimeout`/`clearTimeout` 若宿主提供则 **`bind(windowObject)`**，否则回落全局。
5. `createLatestStartupVisualTaskQueue` 是「**只保留最新一个任务 + 单飞等待**」：`defer` 对非函数与「已就绪」返回 `false` 且不入队；在飞行中再次 `defer` **覆盖待办但不重复 `waitUntilReady`**（被覆盖者永不执行）；`waitUntilReady` **reject 被吞后任务照跑**；`clear()` 只清待办、不中断已在飞行的等待。
6. 关键异步细节：`waitUntilReady` 是在 `Promise.resolve().then(...)` 的**微任务**里才被调用 ⇒ 调用方若依赖外部释放句柄，必须**先 `await` 一拍**再取用。

## 3. 测试与实际执行的检查

- 自研 3 件测试 **36 例**：**首跑 32/36**，4 处失败**全部是我方期望写错、实现未改一字** ——
  1. 误把「检查元素分支」当成覆盖 `[c,i,j]`（实际只认 `c`），改为分别断言 `ctrl+shift+c` 被吞与 `ctrl+shift+i` 在非打包位置不动作；
  2. `documentState` 用例用 `{...ENV}` 展开覆盖了 `location` 却仍带着 `document`，导致断不到 `unknown`（改为显式 `document: undefined`）；
  3. + 4. 队列两例在 `defer` 后同步取 `release` 句柄 ⇒ `TypeError`（见 §2.3 第 6 点，改为先 `await` 一拍）。
  修正后 **36/36 全绿**。
- `src/**` sweep `3 501/3 458/43 → **3 537/3 494/43**`（恰好 +36 / +36 / 失败数不变）；失败名集合与 `b85-fails.txt` `diff` **exit 0**（43 项仍全部归属缺失夹具 `tests/testPreviewDom.js`，**未伪造**）。
- `api/**` sweep **475/475/0** 未变。
- `cmp` 3/3 逐字节保真（`prettier --write` 对三件源码均报 `unchanged`）；`node --check` 3/3；`prettier --check` 6/6（3 源码 + 3 测试）。
- 具名导出闸门 3/3 无 import 可校验（零依赖纯叶）。
- **未执行**：未运行应用、未起 Electron、未打开浏览器窗口 ⇒ **真实 `keydown` 事件流、真实首屏加载层动画/DOM 变更、真实 `window.onerror`/`unhandledrejection` 上报链路全部未验证**；`resource` 条目的 `responseStatus` 依赖较新 Chrome，本批仅用桩断言；三件的端口消费方（`main.js` 启动装配、`renderer.js`、设置页快捷键录制 UI）本仓世代不同 ⇒ **真实调用序列未验证**，本批只证静态契约。
- 零消费方 ⇒ **落地不接线**：反向 grep 三个模块名（排除自身与测试）**0 命中**；未改装配件、未伪造消费方、未伪造 shim。
- 快照 `git status --porcelain` = **696**（67 修改 / 629 未跟踪 = 第116批后 689 + 本批 6 文件 + 1 专题文档）；`api/freeImageHostApi.js` md5 仍 `1e0458013f5341c99f21faefc1d34d3f`；未提交、未推送、未构建、未运行应用。i18n 本批未新增待补键。

## 4. 下一批（第118批）口径

1. `src/services` 零依赖纯叶只剩 **2** 件：`fastImagePreviewService.js`（镜像 6 980 B）、`videoFramePresentation.js`（7 322 B）——落地后该目录纯叶清零，转入 `OK` 池（**须先过跨树导出闸门**）。
2. 主候选转向 `api/` 纯叶 41 与 `src/modules` 纯叶 136（全树 286）：按特性区成组，先跑 `b100/verify-exports.mjs` 再排期。
3. 两件「导出受阻」仍不解阻：`providerConnectionAutoVerification.js`（缺 `api/configApi.js :: getApiConfigSnapshot`）、`initialThemeBootstrap.js`（缺 `storeRuntimeEffectsService.js :: applyStoredThemeToDom`）；`api/configApi.js` 升代须**单独成批 + 真机验证 + 运行授权**，批量操作必须**排除 `api/freeImageHostApi.js`**。
4. `modelGenerationReadiness.js` 仍卡 `api/cliTextStream.js` → `api/cliProviderApi.js` 这一对缺失文件。
