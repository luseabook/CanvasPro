# 第62批 · R15 chrome-shell 运行时装配器（`chromeShellRuntime`）

> 承接第 56–61 批：R15 的传输原语（第 56 批）、启动判定/恢复/健康三件套（第 57 批）、内核版本门禁与 Windows 系统工具（第 58 批）、网页预览管理器（第 59 批）、任务栏身份/窗口过渡/尺寸策略（第 60 批）、启动器本体（第 61 批）均已落地。本批补上**把这些零件装起来的那一层**，也就是新版 `main.js` 实际调用的 `startChromeShellRuntime`。落盘后 R15 只剩 3 个模块（见 §7）。

## 1 · 本批补的缺口

第 61 批交付的 `chromeShellLauncher` 解决的是"**怎么把外部 Chrome 拉起来并管好它的窗口与生命周期**"；本批解决的是"**拉起来之后，桌面 HTTP 桥、渲染器就绪门禁、外部浏览器节点（CDP 管道 + 网页预览）由谁按什么顺序装配、失败时按什么顺序回收**"。

这一层是 0.7.16 `main.js` 里 chrome-shell 路径的唯一入口函数：它同时拥有

- 桌面桥句柄（自己建还是复用调用方给的），
- 启动实例（`chromeShellLaunch`），
- 网页预览管理器外观（`webPreviewManager`），
- 外部浏览器工作进程（`browserWorker`），

四件东西的**创建顺序、失败回滚顺序、以及渲染器就绪与否这条时序线**。本批之前，仓内没有任何等价物；`src/services/desktopBridge.js`（第 55 批）与 `electron/chromeShell*`（第 56–61 批）之间缺少这段胶水，故 chrome-shell 路径在本仓仍不可达。

## 2 · 交付物

### 2.1 源文件

| 项 | 值 |
| --- | --- |
| 移植源 | `D:\shuocancas\SHUO Canvas` 0.7.16 → 反混淆树 `chromeShellRuntime.js`，**347 行 / 13 404 B** |
| 落盘 | `electron/chromeShellRuntime.js`，**359 行 / 13 975 B**（+12 行为 prettier 折行） |
| 静态依赖 | 4 条 import，**全部为本仓已有模块**：`./chromeShellLauncher.js`（4 个具名导出）、`./chromeBrowserWorker.js`、`./chromeCdpPipeClient.js`、`./chromeShellWebPreviewManager.js` |
| 新增 npm 包 | 0 |
| 本仓改写 | **0 处**（无品牌字面量） |
| `_0x` 残留 | 0（258 个映射全部替换为语义名） |

### 2.2 公开契约（1 具名导出 + 1 测试钩子）

`export async function startChromeShellRuntime({ … } = {})`，参数与语义：

| 参数 | 说明 |
| --- | --- |
| `app` / `appUrl` / `env` / `platform` | 透传给启动器；`env` 默认 `process['env']`，`platform` 默认 `process['platform']` |
| `windowsTaskbarIdentity` / `displayWorkAreas` | 透传；前者仅在 `launchShell === launchChromeShellWithLifecycle` 时才额外派生 `windowsTaskbarIdentityPreparation` |
| `desktopHttpBridge` / `startHttpBridge` / `token` / `handlers` | 桥句柄：有句柄则复用，无句柄则必须给工厂，否则 `TypeError('Chrome shell desktop bridge factory is required')` |
| `prepare` | 可选的异步前置；其返回的 `appUrl`（非空字符串）覆盖入参 `appUrl` |
| `logEvent` | 统一日志出口（全部事件 `source:'main'`） |
| `onClosed` | 渲染器已就绪之后才被委派；未就绪时由本模块接管（见下） |
| `launchShell` / `launchBrowserWorker` / `createCdpClient` / `createWebPreviewManager` | 四个可注入工厂，默认分别指向第 61/56/56/59 批模块 |
| `waitForRendererReady` | 可选；提供则开启"就绪门禁"，缺省即视为已就绪 |
| `controlShellWindow` / `closeShellLaunch` | 失败回收用的两个钩子，默认 `controlChromeShellLaunchWindow` / `null` |

返回值：`{ chromeShellLaunch, browserWorker, desktopHttpBridge, webPreviewManager }`。

`export const __chromeShellRuntimeForTest = { BROWSER_NODE_MODE_ENV, resolveBrowserNodeMode, shouldKeepWebPreviewView }`。

模块私有件（不导出，但决定行为）：

- `BROWSER_NODE_MODE_ENV = 'AIC_CHROME_BROWSER_NODE_MODE'`，合法值 `new Set(['eager','lazy','off'])`，非法/缺省 → `'lazy'`；
- `createDeferredWebPreviewRuntime({…})` → `{ facade, ensureRuntime, getBrowserWorker }`。`facade` 的 7 个成员：`syncViews` / `disposeViews` / `controlView` / `consumeEvents` / `waitForEvents` / `dispose` / `_getEntry`；
- **懒加载语义（本模块的核心）**：`ensureRuntime()` 在 `off` 或已 `dispose` 时返回 `null`；成功时**记忆化**（只起一个工作进程 + 一个 CDP 客户端 + 一个管理器）；`syncViews` 在"无视图需保留"时**根本不起工作进程**，直接返回 `{ ok:true, count:0, visibleCount:0 }`；
- **视图过滤**：`shouldKeepWebPreviewView` 只保留 `visible === true || selected === true || fullscreen === true || pendingPopup === true`（**严格布尔**，`1` / `'yes'` 不算）；
- **等待夹取**：`waitForEvents` 在无管理器时用 `Math['max'](0x32, Math['min'](0x9c4, waitMs))`（50–2500 ms），非有限值回落 `0x3e8`（1000 ms）；已 `dispose` 时立即 `[]`；
- **启动阶段游标** `stage`：`'prepare'` → `'launch'` → `'renderer-ready'` → `'browser-node'`，只出现在失败日志的 `context.stage`；
- **错误码**：`CHROME_SHELL_STARTUP_CANCELLED`（退出码 0 且无信号）、`CHROME_SHELL_EXITED_BEFORE_READY`、入参侧透传的 `AIC_DESKTOP_STARTUP_CANCELLED`（降级为 `info`）、`CHROME_SHELL_SPAWN_ERROR`；
- **日志类型**：`chrome_web_preview.worker_error`、`chrome_web_preview.pipe_unavailable`、`chrome_shell.renderer_ready`、`chrome_shell.exited_before_renderer_ready`、`chrome_shell.startup_cancelled`、`chrome_shell.startup_failed`、`chrome_shell.launch_close_after_startup_failure`、`chrome_shell.detached_window_close_after_startup_failure`；
- **环境变量写入**：仅当桥是**自己建的**（`ownsBridge`）才写 `env['AIC_DESKTOP_BRIDGE_URL']` / `env['AIC_DESKTOP_BRIDGE_TOKEN']`。

失败回收顺序（`catch` 内，逐条 `try` 包住，**最后重新抛出原始错误**）：

1. 记 `startup_failed` / `startup_cancelled`（含 `pid` / `exitCode` / `signalCode` / `detached` / `browserPath` / `profileDir` + `startupDiagnostics.snapshot()` 展开）；
2. `startupDiagnostics.stop()`；
3. `await taskbarIdentityPreparation?.cancel?.()`；
4. `await webPreviewFacade?.dispose?.()`（内含"等在建的 `ensureRuntime` 落地"）；
5. `closeShellLaunch({launch, env, platform})` → 记 `launch_close_after_startup_failure`；
6. 若关闭未确认且 `launch.detached === true` → `controlShellWindow({action:'close'})` → 记 `detached_window_close_after_startup_failure`；
7. 否则若关闭未确认 → `launch.process.kill()`；
8. 若桥是自己建的 → `await bridge.close()`。

### 2.3 测试

`electron/chromeShellRuntime.test.js`，**955 行 / 39 276 B / 54 项**，全离线：

| 组 | 覆盖 |
| --- | --- |
| 测试钩子 | 3 个成员的类型与环境变量名一致 |
| `resolveBrowserNodeMode` | 3 个合法值、大小写与空白归一、非法/空/缺省/非字符串 → `lazy`、默认取 `process['env']` |
| `shouldKeepWebPreviewView` | 4 个标志各自成立、严格布尔（`1`/`'yes'` 不算）、空与缺省 |
| 桥 | 无桥无工厂 → `TypeError`；自建桥写 env 两键并用 `{token, handlers, logEvent}` 调工厂；复用调用方桥时**失败不关闭**；自建桥失败时**关闭** |
| 透传 | `app`/`appUrl`/`env`/`platform`/`logEvent`/`displayWorkAreas`/`windowsTaskbarIdentity` 逐项到位，`windowsTaskbarIdentityPreparation` 在注入 stub 启动器时为 `null`，两个回调存在 |
| `prepare` | 覆盖 `appUrl`；只给空白则回落入参 |
| 启动错误 | 启动对象自带 `spawnError` → 抛归一化错误；**在 `launchShell` 内部同步上报**（此时模块游标仍为 `null`）→ 不落库、不抛；**无就绪门禁时的迟到上报** → 落在 `launch.spawnError` 上但不阻断启动（忠实于原版时序）；**有就绪门禁时** → 通过 `rejectRendererReady` 中止启动 |
| 就绪门禁 | `renderer_ready` 日志含 `elapsedMs`（缺省 0）、`browserPath`、`profileDir`；未就绪时退出 → `CHROME_SHELL_EXITED_BEFORE_READY`(error) / `CHROME_SHELL_STARTUP_CANCELLED`(info)；`detached` 退出 → 标记 `launch.detached` 且不请求退出 |
| 懒/即时 | 缺省 lazy：零工作进程、零 CDP、零管理器；`eager`：启动时即起（`browserWorker` 非 `null`，CDP 客户端拿到 `devToolsPipe` 展开 + `logEvent`，管理器拿到该客户端）；`off`：`syncViews`/`controlView` 均 `{ok:false,error:'browser-node-disabled'}` |
| 预览外观 | 空/全被过滤 → 空闲结果且不起进程；首个保留视图才起进程并按过滤后的 `views` 委派；无 `devToolsPipe` → `chrome_web_preview.pipe_unavailable` + `browser-node-unavailable`；`onError` → `chrome_web_preview.worker_error`；`controlView`/`disposeViews`/`consumeEvents`/`waitForEvents`/`_getEntry` 委派；`dispose` 幂等且管理器/工作进程各 disposed 一次；`dispose` 后拒绝再起（`browser-node-unavailable`） |
| 等待夹取 | `waitMs:1` → 不早于 50 ms 解出；`'later'` → 20 ms 内不解出、随后解出 `[]`；`dispose` 后立即 `[]` |
| 失败日志 | `stage` 三态（`prepare`/`launch`/`renderer-ready`）；启动对象存在时带 `pid`/`exitCode`/`signalCode`/`detached`/`browserPath`/`profileDir`/`stderrTail`；不存在时为 `null`/`''` 且无 `stderrTail`；`stop()` 被调用 |
| 回收 | `closeShellLaunch` 调用与 info/warn 两档文案、抛错被吞、`detached` 走 `controlShellWindow` 的 info/warn 两档、未确认且非 detached 才 `process.kill()`、自建桥被关闭、**原始错误被重新抛出**、`eager` 节点在后续失败时被回收 |

## 3 · 接线现状：生产零引用（有意留白）

`chromeShellRuntime` 在本仓**生产 `import` 数 = 0**（全仓除自身源/测试外 0 命中）；`main.js` / `mainIpcSetup` / `preload.cjs` 本批**零改动**。

原因与第 56–61 批一致：**它的消费方是新版 `main.js` 的 chrome-shell 启动序列**，而本仓 0.4.12 的 `main.js` 走 Electron 原生窗口路线（`webPreviewViewManager.js` 是 Electron `<webview>`，与"外部浏览器 + CDP 管道"不是同一条链）。把它接到本仓现有启动流程上只会造死路径，故**宁可留白并记账，不为了「有引用」而擅自接线**（沿用 `sortformerModelRoot.js` 的既定规则）。

同时注意：`startChromeShellRuntime` 是**本批唯一有生产价值的导出**，而它本身依赖调用方注入 `handlers`/`token`/`startHttpBridge`；本仓 `src/services/desktopBridge.js`（第 55 批）提供的是渲染器侧客户端，宿主侧桥需要 `desktopHttpBridge`（本仓已有）与 chrome-shell 启动序列共同到场，缺一不可。

## 4 · 已执行验证（离线，本窗口实测）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check electron/chromeShellRuntime.js` | 通过 |
| 语法 | `node --check electron/chromeShellRuntime.test.js` | 通过 |
| 格式 | `prettier --config <tmp>/prettierrc.json --check` 两文件 | `All matched files use Prettier code style!` |
| 本文件测试 | `node --test --test-timeout=20000 electron/chromeShellRuntime.test.js` | **54 / 54 / 0** |
| 全量 sweep | `node --test --test-timeout=25000 $(find electron -name '*.test.js')` | **1206 / 1205 / 1**（第 61 批为 1152/1151/1，**+54 与本批新增用例数逐一对齐**） |
| 唯一失败 | — | `electron/fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（**第 14 批既有失败，与本批无关**） |
| 生产引用 | `grep -rn chromeShellRuntime`（排除自身与 node_modules） | 0 命中 |
| git 快照 | `echo "staged=$(git diff --cached --name-only \| wc -l) …"` | `staged=0 modified=58 untracked=363 conflicts=0`（专题文档落盘后 364） |
| 毒副作用 | — | 无真实 spawn、无真实 `taskkill.exe`、无真实 PowerShell、无真实 profile 目录写入、无真实 CDP 管道、无网络 |

### 4.1 忠实性 token 级比对（非目测）

工具 `C:/Users/luobote/.qoder/tmp/deobf-tools/cmp-tokens.mjs`（会先把 `_0x…` 归一为 `V`、`!![]`→`true`、`![]`→`false`、`\x20`→空格、`['x']`→`.x`）：

```
port tokens=2187  repo tokens=2188
matched=1929
```

- **ONLY IN PORT = 258**，全部是 `V`（即 258 个 `_0x` 名）；
- **ONLY IN REPO = 259** = 258 个语义名 + **1 个逗号**；
- 该逗号已定位：prettier 把 `Promise['race']([waitForRendererReady({ launch }), rendererReadyFailure])` 折成多行并在数组尾补了尾逗号（原版单行无尾逗号）。

独立归一化 diff 复算（把 `_0x…` 与全部插入的语义名统一替换为 `Q` 后逐 token 比对，见 `diff-norm-runtime.mjs`）：**仅 5 处差异区域**，全部为排版——`((q` ↔ `( (q`、`q);` ↔ `q );`、以及上述 `Promise['race']` 折行（3 段）。**零逻辑差、零非标识符残差**。

`\x20` 转义字面量按既定约定**原样保留**（2 处：`'Chrome\x20shell\x20process\x20tree\x20could…'`、`'Detached\x20Chrome\x20shell\x20window\x20closed…'`）。

## 5 · 本批本仓改写

**0 处**。该模块不含任何品牌/应用名字面量（窗口标题、C# 类名、env 名均不涉及），故第 61 批的 2 处 `AI CanvasPro` 改写在本批没有对应物。全部 `AIC_*` 环境变量名（`AIC_CHROME_BROWSER_NODE_MODE`、`AIC_DESKTOP_BRIDGE_URL`、`AIC_DESKTOP_BRIDGE_TOKEN`）与错误码、日志类型、中文/英文文案逐字照搬。

## 6 · 未执行的验收项（不得当作已完成）

1. **未跑真实浏览器**：`launchBrowserWorker` 从未真的启动 Chrome（第 56 批已知：win32 `taskkill /T /F` 分支无 spawn 注入点，未经授权不得真跑）。
2. **未跑真实 PowerShell / 未执行内嵌 C#**：`prepareChromeShellTaskbarIdentity` 的真实分支未触发。
3. **`windowsTaskbarIdentityPreparation` 非 `null` 分支未执行**：该分支要求 `launchShell` 恰为真实的 `launchChromeShellWithLifecycle`（以组成"派生准备 → 交给启动器"的配对），而真实启动器会真的拉起 Chrome；测试只覆盖了注入 stub 时的 `null` 分支与"给身份但平台非 win32"的天然回落。同理 `catch` 里的 `await taskbarIdentityPreparation?.cancel?.()` 只在 `null` 上执行过。
4. **`waitForEvents` 的两端夹取未按时间戳验证**：只验证了 50 ms 下界（实测不早于 50 ms）与非有限值落 1000 ms（20 ms 内未解出）；**2500 ms 上界与 1000 ms 精确值未按时间戳断言**（会显著拖长套件）。
5. **未跑真实 CDP 管道**：`createCdpClient` 全为 double，`'\0'` 分帧真实行为属第 56 批范围。
6. **未跑真实 HTTP 桥**：`startHttpBridge` 为 double，未验证真实路由与 token 校验。
7. **未跑渲染器就绪协议的真实跨进程时序**：`waitForRendererReady` 为 double；真实的"上报 ↔ 认领"闭环属第 55 批 `chromeShellStartupHealth` 与渲染器上报端的组合验收。
8. **未接 UI**：本批**没有**把 `startChromeShellRuntime` 接到本仓 `main.js`（理由见 §3），故 chrome-shell 路径在本仓 Electron 渲染器下**仍不可达**，82 条桥路由的 chrome-shell 分支仍无法端到端验收。

## 7 · R15 剩余（本批后）

| 模块 | 规模 | 依赖状态 | 备注 |
| --- | --- | --- | --- |
| `globalCaptureWindowController.js` | 463 行 / 17 934 B | **已全齐**（第 60 批 `windowsWindowTransitions` → 第 58 批 `windowsSystemTools`） | 浮层捕获窗口控制器，**建议下一批** |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | **待先移依赖** | 静态 import `src/modules/interaction/contextMenuIcons.js` 与 `src/modules/workspaceHorizontalWheel.js`。**二者在 0.7.16 反混淆树中存在**（`shuo-deobf/src/modules/interaction/contextMenuIcons.js`、`shuo-deobf/src/modules/workspaceHorizontalWheel.js`），只是**本仓尚未移植**；故属正常的移植次序问题（先补两个渲染器模块），**不是源码缺失** |
| `web-preview/*` 5 条路由 | — | 待核 | 消费第 59 批管理器 |
| `storage-migration/prepare` | — | 待核 | 条 38 批只接了 `read`/`complete` |

**R15 的依赖缺口已归零**：第 59 批曾误称"`chromeShellRuntime` 依赖已全齐"，其真实缺口是 `./chromeShellLauncher.js`；第 61 批把启动器落地后，本批开工复核确认 `chromeShellRuntime` 的 4 条静态 import **全部命中本仓既有模块**（`node --check` + 测试实跑通过即为证）。故 R15 现在只剩上表 4 项，其中 `globalCaptureWindow` 需**先补两个渲染器依赖**（`contextMenuIcons.js` / `workspaceHorizontalWheel.js`，源码在移植树内、非缺失，只是本仓未移植）。

## 8 · 约束复核

- 未 push、未 commit、未 `git reset --hard` / `git clean` / 批量 checkout / 全量覆盖目录；未清理任何 untracked 文件。
- 未触碰 `api/freeImageHostApi.js`（本批零改动该文件）。
- 未改动安装目录 `D:\shuocancas` 下任何文件；反混淆临时树只作**只读**移植源。
- 未引入绝对开发机路径或反混淆临时目录为运行时依赖（模块内只有 `./` 相对 import）。
- 未改授权检查；未把 MCP 地址/会话 ID/API 密钥写入仓库。
- 测试**全离线**：`launchShell`/`launchBrowserWorker`/`createCdpClient`/`createWebPreviewManager`/`controlShellWindow`/`closeShellLaunch`/`startHttpBridge`/`prepare`/`logEvent`/`waitForRendererReady` 全部注入 double，`process['env']` 的临时改写用 `try/finally` 还原。
- 未为"让模块有引用"而擅自接线（§3）。
- 静态检查与运行结果分开报告：`node --check` / `prettier --check` 属静态；`node --test` 的 54 与 sweep 的 1206/1205/1 属实跑结果，均已如实记录。
