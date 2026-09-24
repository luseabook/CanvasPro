# R15 chrome-shell 运行时模式与启动生命周期（第72批）

## 1. 本批要补的缺口

第56–71批把 R15 的传输原语、启动判定/恢复层、内核版本门禁、网页预览管理器、启动器、运行时装配器、浮层捕获链全部落地，并把文本预设捕获链**装配**完成。但把端口源 `main.js` 的启动路径逐行读下来，chrome-shell 分支（端口源 `main.js:1785–1976`）与 `handleStartupFailure`（端口源 `main.js:1980+`）还依赖三个**本仓完全没有**的模块：

| 模块 | 端口源体量 | 作用 |
| --- | --- | --- |
| `electron/canvasRuntimeMode.js` | 18 行 / 529 B | 运行时模式控制器：把「本机是否走 chrome-shell」的判定包一层**本次启动内的一次性降级开关**（`useElectronForCurrentLaunch()`） |
| `electron/desktopStartupLifecycle.js` | 69 行 / 2 051 B | 桌面启动生命周期：`requestStart` 的退出中重启、`onShellClosed` 的未保存延迟退出、`prepareBackend` 的「后端存活则复用、否则清端口重启」 |
| `electron/backendStartupMonitor.js` | 117 行 / 3 523 B | 后端子进程监视器：`error`/`exit`/`close` 三事件归一为 `failure` Promise（`BACKEND_SPAWN_ERROR` / `BACKEND_EXITED_BEFORE_READY`），以及带日志管道与同步抛错归一化的启动包装 |

三者的**唯一生产消费方**都是端口源 `main.js`：`createCanvasRuntimeModeController` 在 `main.js:229` 构造、随后出现在 6 处 `shouldUseChromeShellRuntime()` 判定点；`createDesktopStartupLifecycle` 的 5 个成员分别是 `startApp`/`handleStartupFailure`/`will-quit`/`onShellClosed` 的入口；`launchMonitoredBackendProcess` 负责本地后端的 spawn 与日志接管。本批把它们作为**可完全离线验证的自足模块**落地，**暂不触碰 `main.js`**（与第43/56/57/58/59/60/61/62批同口径）。

## 2. 交付物

| 文件 | 行/字节 | import | 导出 |
| --- | --- | --- | --- |
| `electron/canvasRuntimeMode.js` | 19 / 579 | `./chromeShellLauncher.js`（第61批已落地） | `createCanvasRuntimeModeController` |
| `electron/desktopStartupLifecycle.js` | 69 / 2 332 | **零 import** | `createDesktopStartupLifecycle` |
| `electron/backendStartupMonitor.js` | 113 / 3 372 | **零 import** | `createBackendStartupMonitor` / `launchMonitoredBackendProcess` |
| `electron/canvasRuntimeMode.test.js` | 95 | — | 8 项 |
| `electron/desktopStartupLifecycle.test.js` | 226 | — | 18 项 |
| `electron/backendStartupMonitor.test.js` | 302 | — | 19 项 |

### `canvasRuntimeMode.js` 语义

- `shouldUseChromeShellRuntime()` = `!electronForcedForLaunch && shouldUseChromeShellRuntime(env, { appIsPackaged, platform })`——判定全部**委托**给第61批的启动器，本模块只负责「本次启动内一旦降级为 Electron 就再也不回 chrome-shell」。
- `useElectronForCurrentLaunch()` 置位后恒返回 `false`，多次调用幂等；实例之间互不影响（闭包私有）。
- 默认参数 `env = process['env']`、`appIsPackaged = false`、`platform = process['platform']`。

### `desktopStartupLifecycle.js` 语义

- `requestStart(relaunchArgs)`：未退出 → 清挂起的延迟退出定时器并返回 `true`；已 `beginQuit` → **只**触发一次 `app.relaunch()`（带/不带 `args`），返回 `false`。
- `onShellClosed({ isQuittingForUpdate, hasUnsavedChanges })`：退出中或为更新而退出 → `false`；无未保存改动 → `true`（应用可继续）；有未保存改动 → 挂 `0x4b0`(1200 ms) 定时器后 `app.quit()`，返回 `false`。
- `beginQuit()` / `isQuitting()` / `assertStarting()`：`assertStarting()` 在退出中抛带 `code = 'AIC_DESKTOP_STARTUP_CANCELLED'` 的错误。
- `prepareBackend()`：取一次 `getSpawnedServer()` 快照 → 存活（同一引用、`exitCode === null`、`signalCode === null`、`!killed`）且 `probeServer()` 为真则**直接复用**；否则 `clearPortBeforeStart()` → `ensureServerRunning()`。三段都在 `assertStarting()` 守卫下，`finally` 再判一次。

### `backendStartupMonitor.js` 语义

- `createBackendStartupMonitor({ child, onError, onExit, onClose })`：`child` 缺 `once` 则 `TypeError('Backend child process is required')`；暴露 `{ failure, markReady }`。
  - `error` → `failure` 以 `BACKEND_SPAWN_ERROR`（带 `cause`）结算，并回调 `onError`；
  - `exit` → 先回调 `onExit(code, signal)`，再以 `BACKEND_EXITED_BEFORE_READY`（`details { exitCode, signal }`）结算；
  - `close` → 只回调 `onClose`，不影响 `failure`；
  - `markReady()` 之后 `error`/`exit` **不再**结算 `failure`（`exit` 仍会回调 `onExit`）；`failure` **只结算一次**。
- `launchMonitoredBackendProcess({ spawnProcess, command, args, options, logStream, onSpawnError, onExit })`：`spawnProcess` 非函数则 `TypeError`；`stdout`/`stderr` 以 `{ end: false }` 接入 `logStream`；同步抛错 → 回调 `onSpawnError` + `closeLog()` + 抛 `BACKEND_SPAWN_ERROR`（带 `cause`）；异步 `error` → 回调 `onSpawnError` + 关日志；spawn 失败后的 `exit` **不再**回调 `onExit`；`closeLog()` 幂等；`markReady` 直通监视器。

## 3. 接线状态

| 环节 | 状态 |
| --- | --- |
| 三模块落地 | ✅ |
| `src/services/chromeShellStartupReadiness.js`（`buildChromeShellStartupMetadataUrl` / `CHROME_SHELL_STARTUP_READY_EVENT`） | ✅ 既有（第55批） |
| `electron/chromeShellLauncher.js`（被 `canvasRuntimeMode` 静态依赖） | ✅ 第61批 |
| `electron/chromeShellRuntime.js` / `chromeShellStartupHealth.js` / `chromeShellProfileRecovery.js` | ✅ 第62/57批 |
| `electron/main.js` 的 `startApp` chrome-shell 分支 | ❌ **本批有意未接**（见 §4/§5） |
| 生产 `import` 数 | **0**（本批） |

**仍不可达**：`createCanvasRuntimeModeController`、`createDesktopStartupLifecycle`、`launchMonitoredBackendProcess` 在本仓**生产零引用**；端口源里的消费方只有 `main.js` 的启动路径。按既有口径（第43批 `sortformerModelRoot.js`、第56–62批各模块）**不接伪造消费方**，宁可留白并记账。

## 4. 本批已执行的离线验证

- `node --check` × 6（3 源码 + 3 测试）：全部退出 0。
- `prettier --check`（`deobf-tools/prettierrc.json`）：3 个源码文件**首跑即通过**；3 个测试文件首跑 `--write` 后 `All matched files use Prettier code style!`。
- `node --test electron/canvasRuntimeMode.test.js electron/desktopStartupLifecycle.test.js electron/backendStartupMonitor.test.js` = **45/45/0**（约 221 ms）：
  - 计时器、`app`、子进程、日志流、探针**全为注入替身**；**未 spawn 任何真实后端进程、未跑真实 Electron**。
  - `desktopStartupLifecycle` 的 1200 ms 延迟退出用假时钟驱动，未真实等待。
- `node --test --test-reporter=tap $(find electron -name '*.test.js')` = **1 421/1 420/1**（第71批 1 376/1 375/1，**净增 45 = 本批全部**）。唯一失败仍是既有 `fullProjectPackageService.test.js` 的 `missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第17批。
- 本批**未触碰** `api/`、`src/`、`main.js`、`preload`；`src/**` 沿用 1 440/1 397/43、`api/**` 沿用 463/463/0。
- 工作树快照：`staged=0 modified=67 untracked=409 conflicts=0`（相对第71批落盘后 `0/67/403/0` **+6**，与本批 6 个新文件逐一相符）。
- 忠实性 token 比对（`cmp-tokens.mjs`，port → repo）：
  - `canvasRuntimeMode` **87/87**，matched 84，`ONLY IN PORT` = 3 个 `V`、`ONLY IN REPO` = `electronForcedForLaunch` × 3 → **纯重命名，非标识符残差 0**。
  - `desktopStartupLifecycle` **385/385**，matched 325，`ONLY IN PORT` = 60 个 `V`、`ONLY IN REPO` = 60 个语义名 → **逐一对应，非标识符残差 0**。
  - `backendStartupMonitor` **677/676**，matched 581，`ONLY IN PORT` = 95 个 `V` + 1 个 `,`、`ONLY IN REPO` = 95 个语义名 → 差额**仅 1 个逗号**（`createBackendStartupError` 形参表在端口源里折行带尾逗号、本仓单行写满 printWidth 110 故无尾逗号）→ **零逻辑分歧**。
- 品牌字面量：三模块**无品牌字面量**，**本批本仓改写 0 处**（`\x20` 转义、`!![]`/`![]` 布尔惯用法、hex 字面量照旧保留）。

## 5. 未执行的验收项（不得当作已完成）

1. **三模块未在 Electron 主进程内运行**：`app.relaunch`/`app.quit` 的真实语义、`process.env`/`process.platform` 的真实取值组合**全未验证**。
2. **未 spawn 任何真实后端进程**：`spawnProcess`、子进程 `once('error'|'exit'|'close')` 的真实时序、真实 `logStream`（文件流）的背压与 `end()` **全未验证**。
3. **`prepareBackend` 的真实探针未跑**：真实本地 HTTP 后端（`server.py`）的 `probeServer()` 命中率、真实端口占用下 `clearPortBeforeStart()` 的行为、真实后端 `exitCode`/`signalCode`/`killed` 的流转**均未验证**。
4. **1200 ms 未保存延迟退出只用假时钟测过**：真实退出窗口期用户交互（继续编辑 / 切画布）**未验证**。
5. **main.js 装配未做**：因此「打包 win32/darwin 强行走 chrome-shell」这条路径在本仓**仍不可达**，R15 端到端仍不可运行。

## 6. 约束复核

- 未改安装目录 `D:\shuocancas`、未写 asar、未提交/推送、未跑构建/启动/真实 AI 调用。
- 未触碰 `api/freeImageHostApi.js`（md5 `1e0458013f5341c99f21faefc1d34d3f`）。
- 未新增 npm 依赖、未改 `src/i18n/messages/*`、未改授权检查、未清理未跟踪文件。
- 未对任何真实 pid 执行 `taskkill.exe`。
- 未伪造缺失夹具 `tests/testPreviewDom.js`。
- 未为「有引用」而擅自接线：三模块保持生产零引用并在此记账。
- PowerShell 5.1 兼容性：本批三模块**不含内嵌 PowerShell/C#**，无影响。

## 7. 下一批建议

R15 至此**装配前置已全部齐备**：`main.js` 的 chrome-shell 启动分支所依赖的 13 个模块（`canvasRuntimeMode` / `desktopStartupLifecycle` / `backendStartupMonitor` / `chromeShellLauncher` / `chromeShellRuntime` / `chromeShellStartupHealth` / `chromeShellStartupFallback` / `chromeShellProfileRecovery` / `chromeShellBrowserVersion` / `chromeShellStartupDiagnostics` / `chromeShellWebPreviewManager` / `chromeCdpPipeClient` / `chromeBrowserWorker`）**均已落地**，另有既有的 `src/services/chromeShellStartupReadiness.js`。

1. **第73批建议**：R15 chrome-shell 启动路径的**最终装配**——在 `main.js` 构造 `canvasRuntimeMode` 与 `desktopStartupLifecycle`，把 `startApp` 的 `shouldUseChromeShellRuntime()` 分支、`handleStartupFailure` 的降级询问、`will-quit` 的 `beginQuit()`/`onShellClosed()` 接入，并补**静态装配断言测试**（同第71批 `captureChainWiring.test.js` 手法）。**须注意**：这条路径一旦接通，打包 win32/darwin 将默认走 chrome-shell，**必须同时给出真实 Electron 下的端到端验收计划并单独获授权**。
2. 另可另批补：`electron/ipc/webPreviewIpc.js` 的消费侧（`webPreview/*` 5 条桥路由当前只在桥侧可达、渲染器侧无生产调用点）、`storage-migration/prepare`、`styles/variables.css` 里 44 个未移植的 0.7.16 CSS 自定义属性。
3. R02 剩余能力对象：`asset` 之外的路由已基本补齐，`desktopHttpBridge` 的 `web-preview/*` 与 `chrome-shell` 相关路由仍依赖上述装配。
