# 第61批 · R15 chrome-shell 启动器（`chromeShellLauncher`）

> 批次：第 61 批（R15 运行时本体第 2 块）/ 目标：**补充还缺失的未完成部分的源码**（未完成，不得当作总体完成）
> 上游：`D:\shuocancas\SHUO Canvas`（0.7.16）反混淆源 `C:\Users\luobote\.qoder\tmp\shuo-electron-deobf\chromeShellLauncher.js`
> 本批验证方式：**离线纯 Node**（`node --check` + `node --test`）。**未联网、未启动应用、未启动任何真实浏览器、未执行任何真实 PowerShell、未执行 `taskkill.exe`**。

## 1 · 本批补的缺口

第 56–60 批把 chrome-shell 的传输原语、启动判定/恢复层、内核版本门禁、网页预览管理器与 Windows 任务栏身份/窗口过渡补齐后，**「启动一次 chrome-shell 并把窗口摆到正确位置、退出时决定要不要退出应用」这个中枢**一直是整块空白：

| 缺口 | 本仓批前状态 | 本批 |
| --- | --- | --- |
| `electron/chromeShellLauncher.js` | **不存在**（0 行） | 972 行 / 50 399 B（端口源 976 行 / 51 397 B） |

这是 R15 里体量最大的一块，也是第 59 批与第 60 批两次专题文档都点名「下一步优先」的模块。它同时是 `chromeShellRuntime`（R15 最后一块本体）**唯一还缺的静态依赖**——落地后 `chromeShellRuntime` 的依赖全部齐备。

## 2 · 交付物

### 2.1 源文件

| 文件 | 行/字节 | 说明 |
| --- | --- | --- |
| `electron/chromeShellLauncher.js` | 972 / 50 399 | 端口源 976 / 51 397；17 个公开导出 + 1 个测试钩子 |

新增依赖：**0 个 npm 包**。模块内 `import` 只有 6 条，全部指向本仓既有模块：`node:child_process`、`node:fs`、`node:path`、`./chromeShellBrowserVersion.js`（第 58 批）、`./chromeShellStartupDiagnostics.js`（第 58 批）、`./windowsTaskbarIdentity.js`（第 60 批）。

### 2.2 公开契约（17 导出 + 1 测试钩子）

**运行时判定**

- `shouldUseChromeShellRuntime(env, { appIsPackaged, platform })`：`AIC_USE_ELECTRON_CANVAS` 为真时例外，**但当 `appIsPackaged && (win32 | darwin)` 时例外失效**（打包桌面版强行走 chrome-shell）；`AIC_CANVAS_RUNTIME` 取 `electron`/`browser-window` → 假，`chrome-shell`/`edge-shell` → 真；`AIC_USE_CHROME_SHELL=1` → 真；**默认真**。
- `shouldQuitWhenAllElectronWindowsClosed({ platform, useChromeShellRuntime })`：chrome-shell 模式恒假；否则 `platform !== 'darwin'`。
- `isChromeShellLaunchActive(launch)`：`exitCode == null && signalCode == null && killed !== true` 三者同时成立才算活跃。

**URL 与身份**

- `buildChromeShellAppUrl(appUrl, { appIsPackaged })`：写 `aicRuntime=chrome-shell`；打包时写 `aicPackaged=1`，否则**删除**该参数。
- `resolveChromeShellAppIdentity(appUrl)`：仅接受 `http:`/`https:`、无 username/password、且 `aicRuntime=chrome-shell` 的 URL，返回 `protocol + '//' + host + pathname`（**丢弃 query**，用于跨窗口身份比对）。

**浏览器与 profile**

- `resolveChromeShellBrowserExecutable({ env, platform, exists, preferredBrowser })`：`preferredBrowser` 归一为 `chrome`/`edge`/`auto`；`AIC_CHROME_SHELL_BROWSER` 若为绝对路径或含分隔符则需 `exists` 通过，**裸名直接接受不探测**；否则按平台候选表（win32 六条 Chrome/Edge 绝对路径、darwin 两条 `\x20` 转义路径、linux 六条裸名）过滤后取首个存在者。
- `resolveChromeShellProfileDir({ app, env, browserPath })`：`AIC_CHROME_SHELL_PROFILE_DIR` → `app.getPath('sessionData')` → `userData` → `process.cwd()`；目录名按内核家族取 `edge-shell-profile` / `chromium-shell-profile` / `chrome-shell-profile`（**`chromium.exe` 不被 `identifyChromeShellBrowser` 识别**，只认 `chromium`/`chromium-browser`）。
- `writeChromeShellPreferences({ profileDir, disableDevTools, mkdir, readFile, writeFile })`：写 `<profileDir>/Default/Preferences`，关闭 `credentials_enable_service`、`autofill.credit_card_enabled`/`profile_enabled`、`profile.password_manager_enabled`；`disableDevTools` 时 `devtools.availability = 2`，否则**删除** `devtools.availability`；保留其余未知键。

**任务栏身份桥接**

- `prepareChromeShellTaskbarIdentity({ app, env, platform, windowsTaskbarIdentity, exists, spawnProcess, logEvent })`：无 helper 或无浏览器时返回 `null`（Promise）；否则解析浏览器与 profile 后原样转发给第 60 批的 `prepareWindowsChromeShellTaskbarIdentity`（**`logEvent` 一并转发**；七个身份字段齐备才会真的 spawn）。

**进程错误**

- `normalizeChromeShellSpawnError(error)`：已带 `code === 'CHROME_SHELL_SPAWN_ERROR'` 者原样返回；否则包装成 `name='ChromeShellSpawnError'`、`details = { originalCode, errno, syscall, path }` 的稳定形状。

**窗口激活**

- `activateChromeShellWindowSoon({ child, env, platform, spawnProcess })`：仅 win32/darwin 且 `AIC_CHROME_SHELL_ACTIVATE_WINDOW` 未显式关闭时；win32 走 `powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command <内嵌 C# EnumWindows 脚本>`（`AicChromeShellWindowActivator`，按标题 `*AI CanvasPro*`/`*AI Canvas*` 或尺寸 >300×300 且标题非 `IME` 认窗口，`ShowWindow(9)` + `SetForegroundWindow`，200 ms 轮询至 6000 ms 上限），darwin 走 `osascript -l JavaScript`（JXA `NSRunningApplication` + `activateWithOptions`）；两者都 `detached` + `unref`。
- `controlChromeShellLaunchWindow({ launch, action, env, platform, spawnProcess, timeoutMs, setTimeoutFn, clearTimeoutFn })`：仅 win32；`action` 只接受 `focus`/`close`；目标解析失败返回假；`-EncodedCommand` 传内嵌 C# 焦点脚本（`AicChromeShellFocus`），身份靠 **7 个环境变量**下传（`AIC_CHROME_SHELL_FOCUS_MODE`/`_WINDOW_ACTION`/`_TARGET_PID`/`_EXPECTED_BROWSER_PATH`/`_EXPECTED_PROFILE_DIR`/`_EXPECTED_APP_BASE_URL`/`_FOCUS_TIMEOUT_MS`）；`timeoutMs` 夹取 **100–10000**，定时器在 `resolvedTimeoutMs + 0x3e8` 触发并 `kill` helper；helper `exit 0` 才算成功。
- `focusChromeShellLaunchWindow(options)`：`controlChromeShellLaunchWindow({ ...options, action: 'focus' })` 的薄包装。

**关闭**

- `closeChromeShellLaunchForUpdate({ launch, env, platform, spawnProcess, controlWindow, setTimeoutFn, clearTimeoutFn, gracefulTimeoutMs, forceTimeoutMs })`：无 launch → 真；`detached` → 委托 `controlWindow('close')`；已退出 → 真；win32 非 detached → **先 `taskkill.exe /PID <pid> /T`（`0x5dc` 宽限）→ 未退再 `/T /F`（`0x9c4`）**；非 win32 → `kill()` 后等退出（`kill` 抛异常则回读 `exitCode`/`signalCode`）。

**窗口启动参数**

- `resolveChromeShellWindowStartupArgs({ profileDir, readFile, displayWorkAreas })`：优先读 `<profileDir>/Default/Preferences` 的 `browser.app_window_placement`（**递归收集全部 placement 后按 `fullscreen(1e9) + maximized(1e8) + width*height` 取最大**），回落读 `<profileDir 的父目录>/window-state.json`；再经 `constrainWindowStateToDisplayWorkAreas` 夹取（无可用工作区 → 丢 x/y；与任何工作区交集不足（≥0xf0×0x78 且 ≥20%）则**就近居中**并按工作区裁剪尺寸）；输出为 `['--start-fullscreen']` / `['--start-maximized']` / `['--window-position=X,Y','--window-size=W,H']` / `['--window-size=W,H']` / `[]`。

**启动**

- `launchChromeShell({ ... })`：找不到内核 → 抛 `Chrome or Edge executable not found`；`mkdir(profileDir)` **并**由 `writeChromeShellPreferences` 再 `mkdir(profileDir/Default)`（**共两次**）；argv 顺序固定为 `--user-data-dir→--no-first-run→--no-default-browser-check→--enable-logging=stderr→--autoplay-policy=no-user-gesture-required→(--disable-background-mode)→(3 条后台节流参数)→(窗口参数)→(--remote-debugging-port)→--app=<url>`；spawn 选项固定 `{ stdio: ['ignore','ignore','pipe'], windowsHide: false }`；随后挂 `stderr` 诊断（第 58 批 `attachChromeShellStartupDiagnostics`）、`exit` 回调、`taskbarIdentity.attach(child)`、`activateChromeShellWindowSoon`；spawn 同步抛错时先 `taskbarIdentity.cancel()` 再抛归一化错误。
- `launchChromeShellWithLifecycle({ ..., onClosed, onLaunchError, now })`：包一层日志与退出策略——`chrome_shell.launched`（info）；干净早退（`code===0` 且无 signal 且 `runtimeMs < AIC_CHROME_SHELL_EARLY_EXIT_GRACE_MS`，默认 `0x1388`）记 `chrome_shell.early_exit_ignored`（warn）并**标记 `detached`**；正常退出记 `chrome_shell.exited`（info）后 `keepOpen && shouldQuitWhenChromeShellExits(env) && app.quit()`，其中 **`keepOpen = onClosed?.(...) !== false`**，`shouldQuitWhenChromeShellExits(env) = envFlag(env,'AIC_CHROME_SHELL_KEEP_LAUNCHER') !== true`；spawn 错误记 `chrome_shell.spawn_error`（error，message `'Chrome\x20shell\x20process\x20failed'`）并回调 `onLaunchError`。

### 2.3 测试

| 文件 | 行/字节 | 用例 |
| --- | --- | --- |
| `electron/chromeShellLauncher.test.js` | 1378 / 51 587 | **67 项**（`node --test` 实测 `67/67/0`，`duration_ms ≈ 408`） |

覆盖分组：`envFlag` 三态；`shouldUseChromeShellRuntime`（含打包桌面例外）；`shouldQuitWhenAllElectronWindowsClosed`；`isChromeShellLaunchActive`；`buildChromeShellAppUrl`；`resolveChromeShellAppIdentity`；`candidatePathsForPlatform`（win32/darwin/linux 三平台夹具）；`resolveChromeShellBrowserExecutable`（绝对路径探测 / 裸名 / 回落 / `preferredBrowser` 过滤 / 空结果）；`resolveChromeShellProfileDir`（覆盖优先级 + 家族目录名 + `sessionData→userData→cwd`）；`prepareChromeShellTaskbarIdentity`（短路 + 转发 + **READY 握手**）；`writeChromeShellPreferences`；`normalizeChromeShellSpawnError`；`activateChromeShellWindowSoon`（win32 脚本断言 `$targetPid = 4660\n$deadline = ...AddMilliseconds(6000)` 且**不含 `SHUO`**、darwin JXA、spawn 抛错吞掉）；`resolveRemoteDebuggingPort`；`shouldQuitWhenChromeShellExits`；`controlChromeShellLaunchWindow`（平台/动作/目标三类拒绝、`-EncodedCommand` 解码后断言、7 个环境变量、退出码判定、无 `once`、抛错、超时夹取 100–10000 并 `kill`、早退清定时器）；`focusChromeShellLaunchWindow`；`closeChromeShellLaunchForUpdate`（短路、detached 委托、已退出、**`/T` → `/T /F` 升级**、非 win32 `kill` + 等退出、`kill` 抛错回读）；`resolveChromeShellWindowStartupArgs`（取最大 placement、fullscreen/maximized、legacy `window-state.json`、无记录、离屏就近居中 `['--window-position=560,240','--window-size=800,600']`、无工作区丢位置）；`launchChromeShell`（缺内核抛错、完整 argv 顺序、打包 + 调试端口 + 后台参数关断、注入 taskbar 准备件的 `attach`、spawn 抛错时 `cancel` + 归一化、`error`/`exit` 接线、无 `onExit`）；`launchChromeShellWithLifecycle`（launched 日志、早退标 detached、真退出后 quit、`onClosed` 返回假 / `AIC_CHROME_SHELL_KEEP_LAUNCHER=1` 时不 quit、spawn 错误归一化上报）。

## 3 · 接线现状：生产零引用（有意留白）

`grep -rn "chromeShellLauncher"`（排除自身与 `node_modules`）= **0 命中**。端口源里它的消费方只有未移植的 `chromeShellRuntime.js` 与 `main.js` 的启动路径，**本仓均不存在**；`main.js` / `mainIpcSetup` / `preload.cjs` 本批**零改动**。

沿用第 43/56/57/58/59/60 批口径：**宁可留白并记账，也不为了「有引用」而擅自接线伪造消费方**。本模块的实质分支（真的起浏览器、真的摆窗口、真的 `taskkill`）只有在 `chromeShellRuntime` + `main.js` 启动路径落地后才可达。

## 4 · 已执行验证（离线，本窗口实测）

| 命令 | 结果 |
| --- | --- |
| `node --check electron/chromeShellLauncher.js` | 退出 0 |
| `node --check electron/chromeShellLauncher.test.js` | 退出 0 |
| `prettier --check`（两文件，`deobf-tools/prettierrc.json`） | `All matched files use Prettier code style!` |
| `node --test electron/chromeShellLauncher.test.js` | **67 / 67 / 0** |
| `node --test $(find electron -name '*.test.js')` | **1152 / 1151 / 1**（批前 1085/1084/1，净增 **+67**） |

**唯一失败仍是既有** `electron/fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（归 R14 第 17 批），**与本批无关**。

**测试期间未发生的动作**（可复核）：未启动任何真实进程（`spawnProcess` 全为替身）、未触碰真实文件系统（`exists`/`mkdir`/`readFile`/`writeFile` 全为注入替身）、未执行真实 `powershell.exe`、**未对任何真实 pid 执行 `taskkill.exe`**、未使用真实定时器（`setTimeoutFn`/`clearTimeoutFn` 全为替身）。

**首跑 7 项失败已全部归因于测试期望写错，实现未改**（`git diff electron/chromeShellLauncher.js` 在本批内除主题名改写外无二次改动）：

| # | 失败断言 | 真因 |
| --- | --- | --- |
| 1 | `AIC_USE_ELECTRON_CANVAS` + 打包 linux 期望 `true` | 实现为 `!(appIsPackaged && (win32\|\|darwin))` → linux 打包仍返回假；**测试期望错** |
| 2 | `chromium.exe` 期望 `chromium-shell-profile` | `identifyChromeShellBrowser` 只认裸名 `chromium`/`chromium-browser`；**夹具错** |
| 3 | taskbar 转发期望 spawn 1 次却 0 次 | 七字段未给齐 → 脚本为 `''` → 提前返回；**夹具错**（补齐七字段 + READY 握手后通过） |
| 4 | `closeChromeShellLaunchForUpdate` win32 升级用例挂起 15 s | 假时钟从未触发，Promise 永不结算；改为「推进宏任务 + `fireNext`」驱动 |
| 5 | 取最大 placement 期望带位置 | 夹具传了 `displayWorkAreas: []` → 无工作区 → 主动丢 x/y；**夹具与用例名不符** |
| 6 | legacy `window-state.json` 回落读到 `[]` | 期望路径误写成 `dirname(legacyDir)`，实现读的是 `dirname(profileDir)`；**夹具错** |
| 7 | `mkdir` 期望 1 次实为 2 次 | 实现先建 `profileDir` 再由 `writeChromeShellPreferences` 建 `Default`；**期望错** |
| 8 | 退出后 `runtimeMs` 期望 `0x1388` 实为 `0x1770` | 假时钟从 0 起算，`0x3e8 + 0x1388 = 6000`；**期望算错** |

另有一处**语义澄清**（不是 bug）：`keepOpen = onClosed?.(...) !== false`，即 `onClosed` 返回 **`false` 是「不要退出应用」的否决**，返回 `undefined`/缺省才退出。首跑把「返回 `false` 应退出」写进了期望，实测不成立——端口源第 937 行同为 `![]`，**移植忠实**，测试已按真实语义重写。

### 4.1 忠实性 token 级比对（非目测）

工具 `C:\Users\luobote\.qoder\tmp\deobf-tools\cmp-tokens.mjs`（token 级 LCS）：

```
port tokens=6371  repo tokens=6373
matched=5622
--- ONLY IN PORT, 749 tokens ---   --- ONLY IN REPO, 751 tokens ---
```

两侧 ONLY 集合逐 token 归类：

| 侧 | 计数 | 构成 |
| --- | --- | --- |
| ONLY IN PORT | **749** | `_0x*` 名 **746** + `,` **1** + 内嵌脚本被折行切出的字符串片段 **2** |
| ONLY IN REPO | **751** | 语义标识符 **746** + `,` **1** + `(` **1** + `)` **1** + 同样 2 个字符串片段 |

**结论：`_0x` 名 ↔ 语义名一一对应（746 对），非标识符残差仅 1 个逗号位置差 + 1 对括号 + 2 段字符串切分，外加 2 处有意品牌改写，无任何逻辑缺失。**

已用 `C:\Users\luobote\.qoder\tmp\deobf-tools\diff-normalized-launcher.mjs`（把 `_0x*`、全部新语义名与品牌串统一归一后做窗口重同步 diff）独立复核：`port norm tokens=3389 / repo norm tokens=3394`，**分歧区仅 6 处且全部为排版/品牌**——`isChromeShellLaunchActive` 处 prettier 补的一对括号（即上表 751 里的 `(`/`)`）、一处多行实参的尾逗号位置（上表的 `,`）、`['filter'](Boolean)` 的两处折行差，以及**两处品牌改写**（本节 5）。

移植手法：`C:\Users\luobote\.qoder\tmp\deobf-tools\port-chrome-shell-launcher.mjs`——**216 条标识符映射** + 2 条品牌正则，每条映射带「0 命中即 throw」守卫，转换后校验 `_0x` 残留为 0、`SHUO` 残留为 0 再写盘（输出 `written 50411 B`）。模块内含**两段约 30 KB 的内嵌 PowerShell/C# 字面量**，全部由该脚本机器改写，**未手工重打一个字符**。

## 5 · 本批本仓改写

**2 处品牌字面量**（端口源按窗口标题认自己的窗口，沿用 `SHUO` 品牌在本仓永不匹配）：

| 位置 | 端口源 | 本仓 |
| --- | --- | --- |
| `activateChromeShellWindowSoon` 内嵌 C# 前的 PowerShell 片段（字面空格形） | `*SHUO Canvas*` | `*AI CanvasPro*` |
| 焦点脚本内的 `-notlike` 判定（`\x20` 转义形，2 个） | `*SHUO\x20Canvas*` | `*AI\x20CanvasPro*` |

`*AI Canvas*` 短标题匹配**原样保留**；C# 类名（`AicChromeShellWindowActivator`/`AicChromeShellFocus`）、窗口属性名、`AIC_*` 环境变量名等内部技术标识**未改**。

**其余 0 处改写**：`\x20`/`\x0a` 转义、十六进制字面量（`0x1388`/`0x1770`/`0x5dc`/`0x9c4`/`0x3e8`/`0x64`/`0x2710` 等）全部按端口源保留。

## 6 · 未执行的验收项（不得当作已完成）

1. **这不是 R01 验收**：67 项均离线纯 Node，**未经真实 Electron 主进程**。
2. **未启动任何真实浏览器**：`--app=` 拉起真实 Chrome/Edge、真实 `--user-data-dir`、真实 `--remote-debugging-port` 全部未跑。
3. **未执行任何真实 PowerShell**：`activateChromeShellWindowSoon` 的内嵌 C#（`EnumWindows`/`ShowWindow`/`SetForegroundWindow`）与 `controlChromeShellLaunchWindow` 的内嵌 C#（`AicChromeShellFocus`）**一次都没编译执行**；win32 激活与焦点、darwin JXA 激活均未真跑。
4. **未执行任何真实 `taskkill.exe`**：`closeChromeShellLaunchForUpdate` 的 `/T` 与 `/T /F` 两条路径、`runWindowsTaskkill` 的 `0x64` 下限与超时 `kill` 全为替身驱动；真实「优雅关不掉 → 强杀」未验证。
5. **真实窗口参数未验证**：`Preferences` 的 `browser.app_window_placement` 真实结构、`window-state.json` 真实落盘、多显示器真实 `workArea`、真实离屏就近居中效果均未跑。
6. **READY 握手未在真实进程间验证**：`prepareChromeShellTaskbarIdentity` 转发链已在测试里用替身 `stdout` 的 `READY\n` 驱动，但**真实 stdin/stdout 节奏与 6 s 不可注入超时分支未执行**（口径同第 60 批）。
7. **`AIC_CHROME_SHELL_*` 全部 18 个环境变量只验证了读取语义**，未在真实启动中生效过。
8. 模块**未打包、未在 Electron 主进程内运行**，**生产零引用**（§3）。

## 7 · R15 剩余（本批后）

| 模块 | 端口源体量 | 依赖状态 | 备注 |
| --- | --- | --- | --- |
| `chromeShellRuntime.js` | 347 行 / 13 404 B | **已全齐** | 静态依赖 = 第 56 批两传输原语 + 第 59 批预览管理器 + **本批 launcher**；**建议下一批** |
| `globalCaptureWindowController.js` | 463 行 / 17 934 B | 已全齐 | 依赖第 60 批 `windowsWindowTransitions` + 第 58 批 `windowsSystemTools` |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | **缺 2 个 `src/` 依赖** | 本仓没有 `src/modules/interaction/contextMenuIcons.js` 与 `src/modules/workspaceHorizontalWheel.js` |
| `web-preview/*` | 5 条路由 | — | 待接 |
| `storage-migration/prepare` | — | — | 待接 |

**更正记录（重要）**：第 59 批专题文档与交接台账曾称「`chromeShellRuntime` 依赖已全部齐备」，**该说法有误**——`chromeShellRuntime.js` 第 1–6 行静态 `import` 未移植的 `./chromeShellLauncher.js`。第 60 批开工复核已定位，本批落地 launcher 后该依赖**才真正归零**。

## 8 · 约束复核

- 未推送到远端；未触碰 `.github/workflows/*`。
- 未覆盖 `api/freeImageHostApi.js`（本批未触碰 `api/`）。
- 未执行 `git reset --hard` / `git clean` / 批量 checkout；未删除任何未跟踪交付物。
- 未修改授权校验；未把反混淆临时目录或开发机绝对路径写成运行时依赖；未新增 npm 包。
- 未伪造缺失夹具 `tests/testPreviewDom.js`（`src/**` 那 43 项失败与本批无关，沿用既有基线）。
- **未对真实 pid 运行 `taskkill.exe`**；未启动真实浏览器/PowerShell。
- 本批**未编辑任何既有源文件**，`main.js`/`mainIpcSetup`/`preload.cjs` 零改动。
