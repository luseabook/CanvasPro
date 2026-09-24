# 第60批 · R15 Windows 任务栏身份与窗口过渡（`windowsTaskbarIdentity` + `windowsWindowTransitions` + `appWindowSizePolicy`）

> 本批为**离线移植 + 已执行离线测试**的存证记录，不是 R01 验收，也不是 R15 完成。
> 移植源目录：`C:\Users\luobote\.qoder\tmp\shuo-electron-deobf\`。

---

## 1 · 本批补的缺口

第 59 批结束时，台账把 R15 的下一步写成「`chromeShellRuntime` 依赖已全齐，最优先」。**本批开工即复核并纠正了该结论**：`chromeShellRuntime.js` 第 1–6 行是**静态 ESM import**，从 `./chromeShellLauncher.js` 取 4 个名字（`controlChromeShellLaunchWindow`/`launchChromeShellWithLifecycle`/`normalizeChromeShellSpawnError`/`prepareChromeShellTaskbarIdentity`），而 `chromeShellLauncher.js` **本仓并不存在** —— 也就是说单靠第 56/58/59 批的产物，`chromeShellRuntime` 连 `import` 都过不去。真正的依赖顺序是：

```
chromeShellRuntime.js
  └─ chromeShellLauncher.js                        ← 976 行 / 51 397 B，本仓缺
       ├─ chromeShellBrowserVersion.js             ✅ 第58批
       ├─ chromeShellStartupDiagnostics.js         ✅ 第58批
       └─ windowsTaskbarIdentity.js                ← 本批
            └─ appWindowSizePolicy.js              ← 本批
chromeShellRuntime.js（其余依赖）
  ├─ chromeBrowserWorker.js                        ✅ 第56批
  ├─ chromeCdpPipeClient.js                        ✅ 第56批
  └─ chromeShellWebPreviewManager.js               ✅ 第59批
globalCaptureWindowController.js                   ← 463 行 / 17 934 B，本仓缺
  └─ windowsWindowTransitions.js                   ← 本批
       └─ windowsSystemTools.js                    ✅ 第58批
```

即「R15 依赖缺口只剩 `windowsTaskbarIdentity.js` 与 `windowsWindowTransitions.js`」这句台账话是对的，但它们**不是旁枝**：`windowsTaskbarIdentity` 是**最大一块 `chromeShellLauncher` 的直接前置**，`windowsWindowTransitions` 是**浮层捕获面板 `globalCaptureWindowController` 的直接前置**。本批把这两个缺口连同它们的共同底料 `appWindowSizePolicy` 一并落地，R15 的**依赖缺口即归零**，剩下的全是「本体」模块。

三个模块都是**零外部依赖、可完全离线验证**的：`appWindowSizePolicy` 只有两个常量；`windowsWindowTransitions` 只 import `node:child_process` + 本仓既有 `windowsSystemTools`；`windowsTaskbarIdentity` 只 import `node:child_process` + 本批的 `appWindowSizePolicy`。

---

## 2 · 交付物

| 类型 | 文件 | 本仓 | 端口源 | 要点 |
| --- | --- | --- | --- | --- |
| 源 | `electron/appWindowSizePolicy.js` | **2 行 / 87 B** | 2 行 / 87 B | `APP_WINDOW_MIN_WIDTH = 0x500`(1280) / `APP_WINDOW_MIN_HEIGHT = 0x2d0`(720)，唯一被本批另两个模块共同引用的常量模块 |
| 源 | `electron/windowsWindowTransitions.js` | **62 行 / 2 970 B** | 62 行 / 2 964 B | `disableWindowsWindowTransitions`：DWM 过渡禁用 |
| 源 | `electron/windowsTaskbarIdentity.js` | **208 行 / 34 809 B** | 201 行 / 34 953 B | 任务栏身份（C# 内嵌 + 常驻 PowerShell 助手） |
| 测试 | `electron/appWindowSizePolicy.test.js` | 21 行 / 794 B / **3 项** | — | 常量值 + 正整数性 |
| 测试 | `electron/windowsWindowTransitions.test.js` | 212 行 / 8 275 B / **12 项** | — | 句柄解析 + 脚本编码 + 四条失败路径 |
| 测试 | `electron/windowsTaskbarIdentity.test.js` | 534 行 / 18 996 B / **26 项** | — | 窗口身份 + 脚本生成 + 助手握手全流程 |
| 文档 | `docs/chrome-shell-windows-taskbar-and-window-transitions.md` | 本文件 | — | — |

合计 **1 039 行 / 65 931 B**（源 272 行 / 37 866 B，测试 767 行 / 28 065 B）。**未新增任何 npm 包**，未修改任何既有源文件。

`windowsTaskbarIdentity.js` 行数比端口源多 7 行：端口源把巨型脚本拼接写成一行超长表达式，本仓经 prettier 折行后为 208 行；**token 总数不变**（见 §4.1），属纯排版差。

### 2.1 `appWindowSizePolicy` 契约

| 导出 | 值 | 说明 |
| --- | --- | --- |
| `APP_WINDOW_MIN_WIDTH` | `0x500` = 1280 | 窗口最小宽（DIP） |
| `APP_WINDOW_MIN_HEIGHT` | `0x2d0` = 720 | 窗口最小高（DIP） |

### 2.2 `windowsWindowTransitions` 契约

唯一导出 `async disableWindowsWindowTransitions(targetWindow, { platform = process.platform, ownerPid = process.pid, execFileFn = execFile } = {})`：

| 分支 | 条件 | 返回 |
| --- | --- | --- |
| 跳过 | `platform !== 'win32'` | `{ ok: true, skipped: true }`（**不取句柄、不 spawn**） |
| 不可用 | `targetWindow.isDestroyed()`；或句柄非 `Buffer`／长度非 `4`/`8`；或句柄 `<= 0n` 或 `> 0x7fffffffffffffffn`；或 `ownerPid` 非正安全整数 | `{ ok: false, reason: 'window-unavailable' }` |
| 成功 | 助手 stdout（`trim()` 后）严格等于 `APPLIED` 且窗口仍未销毁 | `{ ok: true }` |
| 失败 | 其余 stdout／`execFile` 异步错误／`execFileFn` 同步 throw | `{ ok: false, reason: 'native-transitions-unavailable' }` |

- 句柄：`length === 0x8` 取 `readBigUInt64LE()`，否则 `BigInt(readUInt32LE())`。
- 载荷：`'$result = [ShuoWindowTransitions]::Disable([long]::Parse(\'<handle>\'), [uint32]<ownerPid>)'`，整段脚本经 `Buffer.from(script, 'utf16le').toString('base64')` 后者以 `-EncodedCommand` 传入。
- `execFile` 选项固定 `{ windowsHide: true, timeout: 0x1388, maxBuffer: 0x4000, encoding: 'utf8' }`（超时 5000 ms）。
- 内嵌 C# 先 `GetWindowThreadProcessId` 校验 pid 与句柄归属，不符即返回 `-1`；再 `DwmSetWindowAttribute(hwnd, 3, ref disabled, 4)`（`DWMWA_TRANSITIONS_FORCEDISABLED = 3`），失败则 PowerShell 抛错。

### 2.3 `windowsTaskbarIdentity` 契约

四个导出：

| 导出 | 签名要点 |
| --- | --- |
| `configureWindowsTaskbarIdentity({ window, platform, appId, iconPath, executablePath, displayName })` | 仅 win32 且窗口同时具备 `setIcon`/`setAppDetails`；四个身份字段**缺一即 `false`**；先 `setIcon(iconPath)` 再 `setAppDetails({ appId, appIconPath: iconPath, appIconIndex: 0x0, relaunchCommand: executablePath, relaunchDisplayName: displayName })`；整体 try/catch 兜 `false` |
| `installWindowsTaskbarIdentity({ window, platform, ...identity })` | 额外要求 `window.on` 存在；**立即应用一次**并订阅 `'show'` 重放；返回 `true`/`false` |
| `buildWindowsChromeShellTaskbarIdentityScript({ browserPath, profileDir, appId, iconPath, executablePath, displayName, sizeGuardDllPath, minWidth = APP_WINDOW_MIN_WIDTH, minHeight = APP_WINDOW_MIN_HEIGHT, timeoutMs = 0x1770 })` | 七个路径/身份字段**缺一即返回 `''`**；返回值经 `trim()`；`minWidth`/`minHeight` 走 `readPositiveInteger` 后回落常量；`timeoutMs` 走 `readNonNegativeInteger(timeoutMs, 0x1770)` |
| `prepareWindowsChromeShellTaskbarIdentity({ browserPath, profileDir, platform, spawnProcess = spawn, logEvent = null, ...rest })` | 非 win32 或脚本为空 → `null`；否则 spawn 常驻 PowerShell 助手并等待 `READY`，成功返回 `{ helper, cancel(), attach(launch) }` |

私有助手语义：

- **值编码**：`encodePowerShellValue(v) = Buffer.from(String(v \|\| ''), 'utf8').toString('base64')`，脚本内 `Decode-TaskbarIdentityValue` 用 UTF-8 还原（与 `windowsWindowTransitions` 的 `utf16le` 编码**不同**，见 §6）。
- **整数归一**：`readPositiveInteger` 非有限或 `<= 0` 一律归 `0`（由调用方 `|| 常量` 兜底）；`readNonNegativeInteger` 非有限或 `< 0` 才回落 `fallback`，**`0` 是合法值**。
- **`READY` 握手**：`waitForTaskbarIdentityHelperReady` 累积 stdout 文本，用 `/(^|\r?\n)READY\r?\n/` 对 `output + '\x0a'` 判定；`stdout.on('data')`/`once('error')`/`once('exit')` 三路都会 settle（幂等 `settled` 守卫），并 `removeListener` 清理 + `clearTimeout`，定时器 `unref()`。**超时值不可注入**（硬编码 `0x1770`）。
- **助手退出码**：`5` = 尺寸守卫 DLL/过程未就绪、`3` = `SetWinEventHook` 失败、`4` = stdin 读到的目标 pid `<= 0`、`2` = 稳定窗口未在 `timeoutMs` 内出现；`0` = 正常收尾（**在 `READY` 之后退出码 `0` 不记日志**，非 `0` 记 `chrome_shell.taskbar_identity_timeout`）。
- **`attach(launch)`**：`readPositiveInteger(launch.pid)` 为 `0` 或 `helper.stdin.write` 非函数时 `cancel()` 并返回 `false`；成功则 `stdin.write(pid + '\x0a')` → `stdin.end()` → `stdout.destroy()` → `unref()`，返回 `true`。
- **三类日志**：`chrome_shell.taskbar_identity_not_ready`、`chrome_shell.taskbar_identity_timeout`（带 `context: { code, signal }`）、`chrome_shell.taskbar_identity_spawn_error`（带 `error`），全部 `level: 'warn'`、`source: 'main'`。
- **内嵌判定**：`ShuoCanvas.ChromeShellTaskbarIdentity` 用 `SetWinEventHook(EVENT_OBJECT_CREATE, EVENT_OBJECT_SHOW, WINEVENT_OUTOFCONTEXT)` 观察顶层窗口，按「标题含品牌名」或「宽高 > 300 且标题非空」认窗口；`LoadLibrary(sizeGuardDllPath)` + `GetProcAddress("ShuoCanvasCallWndProcHookProc")` 装 `WH_CALLWNDPROC` 钩子做最小尺寸限制；`SHGetPropertyStoreForWindow` 写 4 个 `AppUserModel` 属性（RelaunchCommand/RelaunchIconResource/RelaunchDisplayNameResource/AppUserModelID）。

---

## 3 · 接线现状：生产零引用（有意留白）

三个模块在本仓**均无生产消费者**：

| 检查 | 结果 |
| --- | --- |
| `grep -rn "windowsTaskbarIdentity\|windowsWindowTransitions\|appWindowSizePolicy" electron src api`（排除自身与 `.test.js`） | **0 命中** |
| `electron/main.js` 内 `APP_WINDOW_MIN`/`TaskbarIdentity`/`WindowTransitions` | **0 命中** |
| `electron/preload.cjs` 同上 | **0 命中** |
| `main.js`/`mainIpcSetup`/preload 是否被本批改动 | **否（零改动）** |
| `windowsTaskbarIdentity` → `appWindowSizePolicy` | 本批内部依赖边（唯一仓内引用） |
| `windowsWindowTransitions` → `windowsSystemTools` | 指向第58批已落地模块 |

消费链在端口源里是 `main.js` →（未移植的）`chromeShellLauncher` → `windowsTaskbarIdentity`，以及（未移植的）`globalCaptureWindowController` → `windowsWindowTransitions`。**口径同第43/56/57/58/59批：宁可留白并记账，也不为了「有引用」而擅自接线。** 本仓渲染器是 Electron 内置渲染器、`installDesktopBridgeCompat()` 首道守卫即 `return false`（第55批已证），现在接上去只会造死路径。

**结构性收益**（本批的主要目的）：`chromeShellLauncher`（R15 最大一块，976 行）与 `globalCaptureWindowController`（463 行）的**全部依赖本批后已满足**，两者从「依赖缺口阻塞」变为「可直接移植」。

---

## 4 · 已执行验证（离线，本窗口实测）

未联网、未启动应用、**未 spawn 任何真实 PowerShell / 未执行任何 C# 代码 / 未改动任何窗口任务栏属性**；`targetWindow`/`execFileFn`/`spawnProcess`/`helper`/`logEvent` 全为注入 double。

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check` × 6 文件 | 6/6 退出 0（另：`node --check` 亦通过 `windowsTaskbarIdentity.js` 的 34 KB 内嵌脚本） |
| 格式 | `prettier --check`（`deobf-tools/prettierrc.json`） | 6/6 `All matched files use Prettier code style!`（`windowsTaskbarIdentity.js` 与两个测试首跑 `--write` 后通过） |
| 本批测试 | `node --test electron/appWindowSizePolicy.test.js electron/windowsWindowTransitions.test.js electron/windowsTaskbarIdentity.test.js` | **41/41/0**（3 + 12 + 26） |
| 全量回归 | `node --test $(find electron -name '*.test.js')` | **1085/1084/1**（第59批 1044/1043/1，**净增 41 = 本批全部**；唯一失败仍是既有 `electron/fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第17批，**未新增未变化**） |
| `api/**` | 未触碰 | 沿用第58批实测 **457/457/0** |
| `src/**` | 未触碰 | 沿用第58批实测 **1 262/1 219/43**（43 项失败全为缺失夹具 `tests/testPreviewDom.js`，既有） |

### 4.1 忠实性 token 级比对（非目测）

工具：`C:/Users/luobote/.qoder/tmp/deobf-tools/cmp-tokens.mjs`（仅在临时目录，**不在仓内**）。

| 模块 | port tokens | repo tokens | ONLY IN PORT | ONLY IN REPO | 结论 |
| --- | --- | --- | --- | --- | --- |
| `appWindowSizePolicy.js` | **12** | **12** | 0 token | 0 token | **逐 token 完全相同**（零差） |
| `windowsWindowTransitions.js` | **519** | **519** | 28 token = `V`×28 | 28 token = 9 个语义名（`rawHandle`6/`windowHandle`5/`targetWindow`4/`handleResult`3/`thrown`2/`stdout`2/`script`2/`resolve`2/`error`2） | **纯重命名，零非标识符残差** |
| `windowsTaskbarIdentity.js` | **1 194** | **1 194** | 153 token = `V`×153，另 1 个巨型字符串 | 153 token = 40 个语义名，另 1 个巨型字符串 | **纯重命名 + 1 处有意品牌改写** |

- 三侧 token 总数**两侧完全相等**且差集**一一对应**；`windowsWindowTransitions` 的 28 个差 token 全部是标识符，**不存在任何非标识符差异**（连尾逗号差都没有）。
- `windowsTaskbarIdentity` 唯一的非标识符差异是**同一个巨型 C# 字面量**两侧各出现一次 —— 即端口源 `"SHUO Canvas"` → 本仓 `"AI CanvasPro"` 的**有意品牌改写**（§5）。prettier 的 201→208 行折行变化**未产生任何新 token**。

### 4.2 测试设计要点

- **无注入点处用等价证据代替**：`waitForTaskbarIdentityHelperReady` 的超时值是不可注入的 `0x1770`（6 s），故**「未就绪」分支不走定时器**，改由 `helper.emit('exit')`／`helper.emit('error')` 触发同一条 `finish(false)` 路径（同一 `kill()` + 同一条日志），避免测试真的空等 6 秒。
- **`READY` 只认行边界**：用 `'NOTREADY\n'` 证明「含 `READY` 子串但不独立成行」不会误判 —— 因果证据是该情形下随后 `emit('exit')` 会走到 `kill()` 分支（若已误判为 ready，`kill()` 不会被调用）。
- **分块边界**：`'REA'` + `'DY\n'` 两片证明累积缓冲；`'  APPLIED\r\n'` 证明 `trim()` 语义。
- **`appWindowSizePolicy` 被断言两次**：既直接断言常量，也在 `windowsTaskbarIdentity` 脚本里断言 `$minimumWidth = 1280\n$minimumHeight = 720` 真的来自该模块（`minWidth: 0`/`minHeight: -5` 时回落常量）。
- **品牌断言是负向的**：`!script.includes('SHUO Canvas')` 锁死改写，`title.IndexOf("AI CanvasPro", ...)` 与 `"AI Canvas"` 两条正向断言锁死匹配语义。
- **`0` 与 `undefined` 的坑已被测试钉住**：`readNonNegativeInteger` 接受 `0`（故 `timeoutMs: 0` → `$timeoutMs = 0`），而 `readPositiveInteger` 把 `0` 归一为 `0` 再由调用方回落常量；`attach({ pid: '4321' })` 会被 `Number()` **接受**，故负例改用 `'not-a-pid'`。

---

## 5 · 本批本仓改写

**仅 1 处**，且是必须的：

| 位置 | 端口源 | 本仓 | 理由 |
| --- | --- | --- | --- |
| `windowsTaskbarIdentity.js` 内嵌 C# 的 `IsBrandedAppWindow` | `title.IndexOf("SHUO Canvas", …)` | `title.IndexOf("AI CanvasPro", …)` | 该判定按**窗口标题**认自家窗口；本仓应用显示名为 `AI CanvasPro`（`electron/main.js:120` `APP_DISPLAY_NAME`），沿用端口源品牌将**永远不匹配**本仓窗口 |

`"AI Canvas"` 这一条短标题匹配**原样保留**（同时覆盖本仓标题）。C# 命名空间 `ShuoCanvas`、窗口属性名 `SHUO.Canvas.MinimumTrackWidth.v1` 等**内部技术标识未改**（非用户可见、且改动只增噪音）。其余 `\x20`/`\x0a` 转义、hex 字面量（`0x1770`/`0x1388`/`0x4000`/`0x7fffffffffffffffn`/`0x500`/`0x2d0`）、非简写对象属性（`browserPath: browserPath`）与方括号成员访问（`helper?.['stdin']?.['end']?.()`）照旧保留。

---

## 6 · 未执行的验收项（不得当作已完成）

1. **未 spawn 过真实 PowerShell**：`powershell.exe`（`windowsTaskbarIdentity`）与 `resolveWindowsSystemToolPath('powershell')`（`windowsWindowTransitions`）两条路径都只在 double 上验证；真实 `Add-Type` 编译内嵌 C#、真实 `SetWinEventHook`、真实 `LoadLibrary` 尺寸守卫 DLL、真实 stdin/stdout 握手节奏**全未验证**。
2. **未验证真实系统路径**：`resolveWindowsSystemToolPath` 只被喂环境变量，真实 `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe` 的存在性与 PowerShell 5.1/7 差异未验证（PowerShell 5.1 用 `;`、不支持 `&&`/`||`，本模块脚本未使用链式运算符，但 `Add-Type` 的编译行为未跑过）。
3. **未改动真实窗口**：`setIcon`/`setAppDetails`、`DwmSetWindowAttribute`、任务栏 AppUserModel 属性**从未在真实窗口上生效**；「品牌标题匹配是否真能认出本仓窗口」纯属静态推断。
4. **未覆盖不可注入的超时**：`waitForTaskbarIdentityHelperReady` 的 6 s 超时分支**没有测试执行**（见 §4.2）；`\x20` 之外的超时数值边界、`unref()` 的真实效果未验证。
5. **`utf8` vs `utf16le` 编码差未交叉验证**：两个模块用同一工具（powershell）但**不同编码**传参（`windowsTaskbarIdentity` 用 `utf8`+脚本内 UTF-8 解码；`windowsWindowTransitions` 用 `utf16le`+`-EncodedCommand`），两者各自的真实行为均未跑。
6. **未在 Electron 主进程内运行**：三模块**未打包、未在主进程内加载**，41 项全是纯 Node 离线用例；本批三模块**生产零引用**（§3）。
7. **R15 依赖缺口虽已归零，但本体仍缺**：`chromeShellLauncher`/`chromeShellRuntime`/`globalCaptureWindowController`/`globalCaptureWindow` 四个模块与 `web-preview/*` 5 条路由、`storage-migration/prepare` 均未移植。

---

## 7 · R15 剩余（本批后）

| 模块 | 规模 | 依赖状态 |
| --- | --- | --- |
| `chromeShellLauncher.js` | 976 行 / 51 397 B | **✅ 全齐**（`node:child_process`/`node:fs`/`node:path` + `chromeShellBrowserVersion` + `chromeShellStartupDiagnostics` + `windowsTaskbarIdentity`[本批]）——**建议下一批** |
| `chromeShellRuntime.js` | 347 行 / 13 404 B | 仅缺 `chromeShellLauncher`（其余三依赖已齐） |
| `globalCaptureWindowController.js` | 463 行 / 17 934 B | **✅ 全齐**（`electron`/`node:path` + `windowsWindowTransitions`[本批]） |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | 缺 `src/modules/interaction/contextMenuIcons.js` 与 `src/modules/workspaceHorizontalWheel.js`（**本仓均不存在**，端口源有） |
| `web-preview/*` | 5 条路由 | 缺 `chromeShellRuntime` |
| `storage-migration/prepare` | — | — |

**建议下一批**：`chromeShellLauncher`（976 行 / 51 397 B，依赖已全齐，是 R15 体量最大且被 `chromeShellRuntime` 直接消费的一块），随后 `chromeShellRuntime`、`globalCaptureWindowController`。

---

## 8 · 约束复核

- 本批**未** `git reset --hard`／`git clean`／批量 checkout／覆盖目录；未清理任何 untracked 文件。
- 本批**未**触碰 `api/freeImageHostApi.js`（工作区定制原样保留）或任何既有源文件；**未**新增 npm 包；**未**提交／推送／发布；**未**触碰安装版资源。
- 本批**未**在测试里运行 `taskkill.exe` 或任何指向真实 pid 的命令；**未**真实 spawn 任何子进程。
- 本批给 `electron/**` 增加 6 个 untracked 文件（3 源 + 3 测试），`modified` 计数不变（本批未编辑既有源文件，4 份台账文档本就在既有 modified 集合内）。
