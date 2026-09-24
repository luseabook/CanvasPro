# 第58批 · Chrome 内核版本门禁与 Windows 系统工具（`electron/windowsSystemTools.js` + `chromeShellBrowserVersion.js` + `chromeShellStartupDiagnostics.js`）

> 第56/57 批补齐了 R15 的**传输层**（`chromeCdpPipeClient`/`chromeBrowserWorker`）与**启动判定恢复层**（`chromeShellStartupFallback`/`chromeShellStartupHealth`/`chromeShellProfileRecovery`），但这条链的两块**直接前置**仍缺：起浏览器之前要「认内核是谁、版本够不够、不够就换 Edge、再不行才回落 Electron」的**版本门禁**，以及把子进程 stderr 尾巴变成可上报诊断的**采集器**；而版本门禁自身又依赖一个连 Windows 系统工具绝对路径都要自己解析的**底层工具模块**（端口源里 `powershell.exe` 不走 PATH，而是 `%SystemRoot%\System32\WindowsPowerShell\v1.0\` 下拼出来）。本批取该簇里**三个自足、零外部依赖、可完全离线验证**的模块：`windowsSystemTools`（**只依赖 `node:buffer`/`node:path`**）、`chromeShellBrowserVersion`（依赖前者 + 三个 `node:` 内建）、`chromeShellStartupDiagnostics`（唯一依赖是本仓**既有**的 `electron/diagnostics.js`）。
> 全部验证为**离线**：`node --check` + `node --test` + prettier。未联网、未启动应用、**未 spawn 任何真实子进程**（`spawnProcess` 全部注入 double，§4.2）。

---

## 1 · 缺口（第58批之前）

| # | 缺什么 | 依据 |
| --- | --- | --- |
| 1 | `electron/windowsSystemTools.js` 整个模块 | 新版在 Windows 上**不信任 PATH**：`powershell`/`taskkill`/`netstat` 一律用 `%SystemRoot%\System32\...` 的绝对路径（如 `powershell` 要拼 `System32\WindowsPowerShell\v1.0\powershell.exe`），并把子进程失败对象裁剪成可安全上报的字段集；本仓 `resolveWindowsSystemToolPath`/`describeSystemCommandFailure`/`WINDOWS_SYSTEM_TOOLS` = **0 命中** |
| 2 | `electron/chromeShellBrowserVersion.js` 整个模块 | 新版启动前先识别内核类型（chrome/edge/chromium）、读其版本、与最小版本（默认 `148.0.7778.280`）比对，过旧或不可识别就**改走已验证的 Edge**，两者都不行才要求回落 Electron；本仓 `inspectChromeShellBrowserVersion`/`checkChromeShellBrowserVersionBeforeLaunch`/`DEFAULT_MIN_CHROME_VERSION` = **0 命中** |
| 3 | `electron/chromeShellStartupDiagnostics.js` 整个模块 | 新版把浏览器子进程的 stderr **只留尾窗 1800 B**、且只记字节数（不无限增长），再交给 `sanitizeDiagnosticValue` 脱敏后上报；本仓 `attachChromeShellStartupDiagnostics`/`MAX_STDERR_BYTES` = **0 命中**（`diagnostics.js` 本仓**已存在**，故这是最易落地的一块） |
| 4 | R15 整簇 | `chromeShellLauncher`(976 行 / 51 397 B)/`chromeShellWebPreviewManager`(810 行 / 33 189 B)/`chromeShellRuntime`(347 行 / 13 404 B)/`globalCaptureWindowController`(463 行 / 17 934 B)/`globalCaptureWindow`(281 行 / 12 406 B)/`web-preview/*` 5 条路由 仍全缺（§7） |

---

## 2 · 本批交付

| 文件 | 来源（端口源） | 行数 / 字节 | 说明 |
| --- | --- | --- | --- |
| `electron/windowsSystemTools.js` | `tmp/shuo-electron-deobf/windowsSystemTools.js`（53 行 / 2 170 B） | **48 / 2 027** | 只 import `node:buffer`/`node:path`；`resolveWindowsSystemToolPath`、`describeSystemCommandFailure`、`__windowsSystemToolsForTest`（含私有 `resolveWindowsRoot`/`normalizeFailureText`） |
| `electron/chromeShellBrowserVersion.js` | `tmp/shuo-electron-deobf/chromeShellBrowserVersion.js`（261 行 / 9 278 B） | **261 / 9 390** | 只 import 三个 `node:` 内建 + 本批 `./windowsSystemTools.js`；`DEFAULT_MIN_*`、`compareBrowserVersions`、`identifyChromeShellBrowser`、`readBrowserExecutableVersion`、`inspectChromeShellBrowserVersion`、`checkChromeShellBrowserVersionBeforeLaunch`、`__chromeShellBrowserVersionForTest` |
| `electron/chromeShellStartupDiagnostics.js` | `tmp/shuo-electron-deobf/chromeShellStartupDiagnostics.js`（35 行 / 1 258 B） | **35 / 1 282** | 唯一 import 是本仓既有的 `./diagnostics.js`；`attachChromeShellStartupDiagnostics`（`snapshot`/`stop`） |
| `electron/windowsSystemTools.test.js` | 本批新写 | **142 / 5 964** | 17 项 |
| `electron/chromeShellBrowserVersion.test.js` | 本批新写 | **438 / 17 114** | 24 项 |
| `electron/chromeShellStartupDiagnostics.test.js` | 本批新写 | **114 / 4 937** | 10 项 |

合计 **1 038 行 / 40 714 B**；**新增 0 个 npm 包**（仍只用 `node:` 内建 + 本仓既有模块）。

### 2.1 `windowsSystemTools` 的契约（逐字移植）

- 常量：`MAX_FAILURE_TEXT_LENGTH = 0x7d0`(2000)；`WINDOWS_SYSTEM_TOOLS = Object['freeze']({ netstat: {fallback:'netstat.exe', relativePath:['System32','netstat.exe']}, powershell: {fallback:'powershell.exe', relativePath:['System32','WindowsPowerShell','v1.0','powershell.exe']}, taskkill: {fallback:'taskkill.exe', relativePath:['System32','taskkill.exe']} })`。
- 私有 `resolveWindowsRoot(env = process.env)`：按 `SystemRoot` → `SYSTEMROOT` → `WINDIR` → `windir` 顺序取第一个**去空白 + 去首尾双引号后仍是 `path.win32.isAbsolute`** 的值；一个都没有 → `''`（**不猜 `C:\Windows`**）。
- `resolveWindowsSystemToolPath(toolName, { env = process.env } = {})`：工具名 `String(...).trim().toLowerCase()` 后查表；**未支持 → `TypeError('Unsupported Windows system tool: ' + toolName)`**；有 root → `path.win32.join(root, ...relativePath)`，无 root → 退回裸名 `fallback`。
- 私有 `normalizeFailureText(value)`：`Buffer.isBuffer` → `toString('utf8')`，否则 `String(value ?? '')`，再 `slice(0, 0x7d0)`。
- `describeSystemCommandFailure(cause)`：从 `['code','errno','status','signal','syscall','path']` 里**只拷贝 `!== undefined` 的键**（显式 `null` 会被保留）；`message`/`stderr` 经 `normalizeFailureText` 后**仅非空才写入**；其余字段（如 `stdout`、任意自定义键）**一律丢弃**。

### 2.2 `chromeShellBrowserVersion` 的契约（逐字移植）

- 常量：`DEFAULT_MIN_CHROME_VERSION = '148.0.7778.280'`、`DEFAULT_MIN_EDGE_VERSION = '148.0.0.0'`、`DEFAULT_MIN_CHROMIUM_VERSION = DEFAULT_MIN_CHROME_VERSION`、`VERSION_CHECK_TIMEOUT_MS = 0x1388`(5000)、`SUPPORTED_BROWSER_KINDS = new Set(['chrome','edge','chromium'])`、`WINDOWS_BROWSER_PATH_ENV_NAME = 'AIC_CHROME_SHELL_BROWSER_PATH_BASE64'`，以及 `WINDOWS_VERSION_SCRIPT`（6 行以 `';\x20'` 拼成的 PowerShell 片段：从 `$env:AIC_CHROME_SHELL_BROWSER_PATH_BASE64` 还原目标路径 → `Get-Item -LiteralPath` → 输出 `VersionInfo.ProductVersion`）。
- 私有 `parseVersionParts(value)`：正则 `/\b(\d+(?:\.\d+){1,3})\b/` 抓**首段**点分版本（**至少要一个点**，纯 `148` 不算），`parseInt` 后不足 4 段**补 0**，返回 `{ text, parts }`；无匹配/非有限/负 → `null`。
- `compareBrowserVersions(left, right)`：任一侧 `null` → `null`；否则按补 0 后的 4 段逐位比，返回 `-1 | 0 | 1`（**第 5 位起不参与**）。
- `identifyChromeShellBrowser(browserPath)`：取 `path.basename(String(browserPath || '')).toLowerCase()` 匹配 5 个 chrome 名、5 个 edge 名、2 个 chromium 名，否则 `'unknown'`。
- `readBrowserExecutableVersion({ browserPath, env, platform, spawnProcess = spawnSync })`：路径去空白后为空 → `''`（**不 spawn**）；`platform === 'win32'` → 用 `resolveWindowsSystemToolPath('powershell', { env })` 起 `['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command', WINDOWS_VERSION_SCRIPT]`，并把 `{ ...env, AIC_CHROME_SHELL_BROWSER_PATH_BASE64: base64(路径) }` 传进子进程；其余平台 → `<路径> --version`；两者都是 `{ encoding:'utf8', timeout:5000, windowsHide:true }`；私有 `extractVersionFromProcessResult` 要求 `status === 0` **且无 `error` 无 `signal`**，否则 `''`；整个函数 `try/catch` 兜底为 `''`。
- 私有 `resolveMinimumBrowserVersion(browserKind, env)`：按 kind 读 `AIC_CHROME_SHELL_MIN_{CHROME,EDGE,CHROMIUM}_VERSION`（**经 `parseVersionParts` 规范化为 `.text`**，非法值视为未配置）；未配置 → 对应默认值（`unknown` 落到 chrome 默认）。
- `inspectChromeShellBrowserVersion({ browserPath, env, platform, spawnProcess })` → `{ browserKind, browserPath, version, minimumVersion, checked, outdated, reason }`，`reason ∈ {'unsupported-browser','version-unavailable','version-too-old','supported'}`；**不支持的内核直接返回、不 spawn**（`checked:false`、`outdated:true`）；读不到版本（`compareBrowserVersions` 为 `null`）→ `version-unavailable`。
- 私有 `clearRememberedBrowserChoice(preferencePath, unlink = unlinkSync)`：空路径直接返回；`unlink` 抛错**空 `catch` 吞掉**。
- `checkChromeShellBrowserVersionBeforeLaunch({ browserPath, edgeBrowserPath = '', preferencePath = '', env, platform, spawnProcess, logEvent = null, unlink = unlinkSync })`：**先**清记忆值；主内核 `checked && !outdated` → `{ continueLaunch:true, action:'continue' }`；否则若 `edgeBrowserPath` 且 `path.resolve(edgeBrowserPath) !== path.resolve(主路径)`（**同一路径会被跳过**）则探测 Edge，通过 → `action:'edge-fallback'`；都不行 → `{ continueLaunch:false, action:'electron-fallback' }`。日志类型四种：`chrome_shell.browser_version_checked`（主检查，`outdated` → `warn` 否则 `info`；`version-unavailable` 文案为 `'Browser version could not be verified'`，过旧为 `'Browser version is below the supported minimum'`，通过为 `'Browser version check completed'`）、`chrome_shell.fallback_browser_version_checked`、`chrome_shell.safe_browser_fallback_selected`（`warn`）、`chrome_shell.electron_fallback_required`（`error`）；全部 `source:'main'`、`context` 带 `inspection`/`fallbackInspection`。

### 2.3 `chromeShellStartupDiagnostics` 的契约（逐字移植）

- 常量：`MAX_STDERR_BYTES = 0x708`(1800)。
- `attachChromeShellStartupDiagnostics(childProcess)` 闭包持有 `active`/`stderrBuffer`/`stderrBytes`/`stderrReadError`，并（可选链）订阅 `childProcess.stderr` 的 `data`/`error`：
  - `data`：`!active` 直接返回；chunk 为 Buffer 即用、否则 `Buffer.from(String(chunk),'utf8')`；**先累加全长 `stderrBytes`**，再把 `Buffer.concat([旧缓冲, 新块.subarray(-1800)])` 再 `.subarray(-1800)`——即**缓冲恒为尾窗、字节数如实累计**。
  - `error`：`active` 时记 `String(error?.code || 'STDERR_READ_FAILED')`。
  - 返回 `{ snapshot(), stop() }`：`snapshot()` = `sanitizeDiagnosticValue({ stderrAvailable: Boolean(childProcess?.stderr), stderrBytes, stderrTruncated: stderrBytes > 1800, stderrReadError, stderrTail: stderrBuffer.toString('utf8') })`（**每次新对象**）；`stop()` = `active = false` 且缓冲重置为 `Buffer.alloc(0)`（**字节数不重置**）。

---

## 3 · 接线现状与可达性

**本批有意不接线，三个模块当前均为生产零引用。**

- 端口源里三者的消费链是 `main.js` → `chromeShellLauncher` →（`chromeShellBrowserVersion` + `chromeShellStartupDiagnostics`）→ `windowsSystemTools`；而 `chromeShellLauncher`/`chromeShellRuntime` **本批未移植**（§7）。本仓渲染器是 Electron 内置渲染器，`installDesktopBridgeCompat()` 首道守卫即 `return false`（第55批已证），chrome-shell 启动分支根本不执行——在 `main.js` 里凭空调用这些模块只会**伪造消费方**、造一条死路径。
- 与第43批 `sortformerModelRoot.js`、第56/57 批同一口径：**宁可留白并记账，也不为了「有引用」而擅自接线**。
- **本批不影响任何现有行为**：三个模块 import 侧效应为零（`windowsSystemTools` 只读环境变量、`chromeShellBrowserVersion` 只在被调用时才 `spawnSync`、`chromeShellStartupDiagnostics` 只在被调用时才订阅流），且**无任何仓内文件 import 它们**。
- 一个**结构性收益**：`windowsSystemTools` 是 `chromeShellLauncher`（R15 最大一块）与 `chromeShellBrowserVersion` 的**共同前置**，本批把它单独落地后，后续 launcher 只需再补 `windowsTaskbarIdentity.js`。`chromeShellStartupDiagnostics` 复用了**本仓既有**的 `diagnostics.js`，是三者中唯一「依赖已在仓内且已测」的模块。

| 检查 | 结论 |
| --- | --- |
| 仓内 `import` 引用数 | 三者均为 **0**（测试文件除外；`chromeShellBrowserVersion` → `windowsSystemTools` 是本批内部依赖边，非生产消费方） |
| `main.js` / `mainIpcSetup` / preload 改动 | **无** |
| 新增 env 变量读取 | `AIC_CHROME_SHELL_MIN_CHROME_VERSION`/`_MIN_EDGE_VERSION`/`_MIN_CHROMIUM_VERSION`（`resolveMinimumBrowserVersion`），以及 win32 分支写出的 `AIC_CHROME_SHELL_BROWSER_PATH_BASE64`；**仅在函数被调用时读**，本仓无调用点故不生效 |
| 对现有测试的影响 | 无（纯新增文件；`electron/**` 由 934 → **985**，全部为本批 +51） |

---

## 4 · 已执行的验证

| 命令（离线） | 结果 |
| --- | --- |
| `node --check` × 3 个源 + 3 个测试 | 退出 0 |
| `prettier --check` × 6 个文件（3 源 + 3 测试） | `All matched files use Prettier code style!` |
| `node --test electron/windowsSystemTools.test.js` | **17/17/0** |
| `node --test electron/chromeShellBrowserVersion.test.js` | **24/24/0** |
| `node --test electron/chromeShellStartupDiagnostics.test.js` | **10/10/0** |
| `node --test $(find electron -name '*.test.js')` | **985/984/1**（唯一失败仍是既有 `electron/fullProjectPackageService.test.js`，第17批遗留；`api/**` = 457/457/0、`src/**` = 1 262/1 219/43 均未触碰） |
| 快照 | `0/58/351/0`（第57批 `0/58/344/0`）：**+7 untracked** = 3 源 + 3 测试 + 1 专题文档；`modified` 同为 58，**本批未编辑任何既有源文件**（四份台账文档的改动计入 `modified`，与第57批同口径） |

### 4.1 忠实性（token 级 LCS 比对，非目测）

| 模块 | port tokens | repo tokens | ONLY IN PORT | ONLY IN REPO | 结论 |
| --- | --- | --- | --- | --- | --- |
| `windowsSystemTools` | 406 | **405** | 49 | 48 | 48 个 `_0x` 名 ↔ 48 个语义名；port 侧**唯一**多的非标识符 token 是 `1 个逗号`，位于端口源被 prettier **折行的 `candidates` 数组**的尾逗号处（本仓该数组压成一行故无尾逗号） |
| `chromeShellBrowserVersion` | 1 400 | **1 400** | 135 | 135 | 135 个 `_0x` 名 ↔ 135 个语义名，**两侧 token 数完全相同** = 最干净的一次纯重命名移植 |
| `chromeShellStartupDiagnostics` | 251 | **250** | 30 | 29 | 29 个 `_0x` 名 ↔ 29 个语义名；port 侧**唯一**多的非标识符 token 是 `1 个逗号`，位于端口源折行的 `Array.prototype.subarray(-MAX_STDERR_BYTES,)` 实参尾逗号处（本仓折在成员访问处故无） |

差集里**没有任何非标识符 token**（除上述 2 处折行位置不同的尾逗号），即三个模块都是**纯重命名移植、零逻辑分歧**。两处单逗号差异均已定位到**同源的换行位置不同**，而非逻辑差异；`chromeShellBrowserVersion` 更是连行数（261）都与端口源一致。

### 4.2 测试设计要点

- `windowsSystemTools.test.js`：`resolveWindowsRoot` 的**四键优先级**、**跳过相对路径**、**去空白 + 去首尾引号**、**无绝对路径 → `''`**；`resolveWindowsSystemToolPath` 三种工具的 `System32` 绝对拼装 vs 无 root 的裸名回退、**大小写与前后空白归一**、未知名与空名的 `TypeError`（断言 `message` 原文）；`describeSystemCommandFailure` 的**白名单键**（`stdout`/自定义键被丢弃）、`undefined` 跳过、显式 `null` 保留、Buffer 消息转 utf8、**2000 字符截断**、`stderr` 与 `message` 并存、空串省略、`null`/`undefined`/非对象容错。
- `chromeShellBrowserVersion.test.js`：`spawnProcess` 全部注入 double（**从不 spawn 真实进程**），按命令分派结果。覆盖 `parseVersionParts` 的补 0 与「必须有点」、`compareBrowserVersions` 的 `-1/0/1/null` 与补 0 等值；`identifyChromeShellBrowser` **全 12 个名字** + 大小写 + `'unknown'`；`WINDOWS_VERSION_SCRIPT` 的**6 段拼接 + 基名 + base64 还原 + 空目标 `exit 2`**；`readBrowserExecutableVersion` 分别断言 **win32 的 powershell 绝对路径 + 7 元实参数组 + `AIC_CHROME_SHELL_BROWSER_PATH_BASE64＝base64(路径)` + `timeout:5000` + `windowsHide:true`** 与 **非 win32 的 `<路径> --version`**，以及空白路径**不 spawn**、`status!==0`/`error`/`signal` 三种丢弃、spawn 抛错兜底；`resolveMinimumBrowserVersion` 三种 env 覆盖 + 三种默认 + `unknown`；`inspectChromeShellBrowserVersion` **四种 reason**（不支持内核**断言未 spawn**）；`clearRememberedBrowserChoice` 的正常/空路径/抛错；`checkChromeShellBrowserVersionBeforeLaunch` 的 `continue`/`edge-fallback`/`electron-fallback` **四种日志类型顺序与 `level`**、**同一路径回退被跳过（`fallbackInspection === null`）**、`version-unavailable` 文案、`preferencePath` 被 unlink 且无日志汇容忍。
- `chromeShellStartupDiagnostics.test.js`：用 `node:events` 的假 `stderr`（**从不碰真实子进程**）。覆盖空快照、无 `stderr` 容错、Buffer 与字符串 chunk 的字节数（含中文 3 字节/字）、**多块累积后只留尾 1800 B 而字节数照实累计**、单块超窗即 `stderrTruncated`、`error` 事件的 `code` 与其缺省 `STDERR_READ_FAILED`、`stop()` 后**冻结尾巴且丢弃后续流量**、以及 `snapshot()` 返回值的**独立性**（改返回值不影响内部状态）。

---

## 5 · 本仓独有差异

- **无任何应用名/文案改写**：三者都不含 `'SHUO\x20Canvas'` 之类的品牌字面量（唯一的中文/英文文案在 `chromeShellBrowserVersion` 的日志 `message` 里，端口源即为英文，照旧保留）。
- `\x20` 转义**照旧保留**（`WINDOWS_VERSION_SCRIPT` 里的 `'if\x20(-not\x20$target)\x20{\x20exit\x202\x20}'` 与 `';\x20'` 拼接符，符合本仓 electron 层既有惯例）。
- 与端口源仅有的 token 级差异是上述 **2 处折行位置不同引起的可选尾逗号**（§4.1），无逻辑、无字面量差异。

---

## 6 · 未执行的验收项（不得当作已完成）

1. **未 spawn 过真实浏览器或 PowerShell**：`spawnProcess` 恒为 double，win32 分支的 `powershell` 调用与 `--version` 调用**均未在真实进程上跑过**；真实 `Get-Item -LiteralPath` 的 `ProductVersion` 输出格式、真实超时/权限失败**未验证**。
2. **未验证真实注册表/系统路径**：`resolveWindowsRoot` 只被喂合成 env；真实 Windows 上 `SystemRoot` 的取值、`%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe` 的存在性、PowerShell 7 与 5.1 的差异**未验证**。
3. **未跑过真实版本门禁**：`checkChromeShellBrowserVersionBeforeLaunch` 的四种动作只在 double 上走通；**真实「主内核过旧 → 真的落到 Edge → 真的回落 Electron」的端到端**未验证（依赖未移植的 launcher）。
4. **未接真实子进程 stderr**：`stderr` 是 `EventEmitter` 假体，真实 `child_process.spawn` 的 `stderr` 分块节奏、`error` 事件的真实 `code`、以及 1800 B 尾窗在真实大输出下的行为**未验证**。
5. **未在 Electron 主进程内运行**：三个模块未打包、未被 `main.js` 引用，51 项测试全部是纯 Node 下的离线用例。

---

## 7 · R15 剩余（下一步）

**本批之后 R15 仍缺 5 个模块 + 5 条路由 + `storage-migration/prepare`**（不含已落地的 8 个模块）：

| 模块 | 端口源大小 | 依赖 | 现状 |
| --- | --- | --- | --- |
| `chromeShellWebPreviewManager.js` | 810 行 / 33 189 B | **零 import** | 体量大但自足，**最优先** |
| `chromeShellRuntime.js` | 347 行 / 13 404 B | `chromeBrowserWorker`、`chromeCdpPipeClient`、`chromeShellWebPreviewManager` | **前两者第56批已落地**，只差管理器 |
| `chromeShellLauncher.js` | 976 行 / 51 397 B | `node:child_process`/`fs`/`path`、`chromeShellBrowserVersion`(**✅第58批**)、`chromeShellStartupDiagnostics`(**✅第58批**)、`windowsSystemTools`(**✅第58批**)、`windowsTaskbarIdentity`(**缺**) | 依赖 4/5 已齐 |
| `globalCaptureWindowController.js` | 463 行 / 17 934 B | `electron`、`node:path`、`windowsWindowTransitions`(**缺**) | 待补 `windowsWindowTransitions` |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | `src/modules/interaction/contextMenuIcons.js`、`src/modules/workspaceHorizontalWheel.js` | 本仓存在性待核 |

依赖缺口：**只剩 `windowsTaskbarIdentity.js` 与 `windowsWindowTransitions.js` 在本仓 `electron/` 下不存在**（`windowsSystemTools.js` 已由本批落地）。`web-preview/*` 5 条路由与 `storage-migration/prepare` 仍在 `desktopHttpBridge` 侧留空（归 R02，见 `desktop-http-bridge.md`）。

**建议下一批**：先攻 `chromeShellWebPreviewManager`（33 189 B、**零 import**、可离线验证），它同时解锁 `chromeShellRuntime`；两个 `windows*` 缺口（`windowsTaskbarIdentity`/`windowsWindowTransitions`）体量小，可插入同批或紧邻批；最后再攻 `chromeShellLauncher`（51 397 B，依赖届时全部就位）。

---

## 8 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批零 `api/` 改动）；未 push；未 `git reset --hard`/`git clean`/批量 checkout；未覆盖任何既有文件。
- 未改动授权校验逻辑；未在仓内写入任何 MCP 地址/会话 ID/密钥；未把反混淆临时目录或绝对开发机路径写成运行时依赖（`windowsSystemTools` 的路径构造全部基于 `env` 与 `path.win32`；`chromeShellBrowserVersion` 的脚本路径来自 `resolveWindowsSystemToolPath`）。
- **未伪造消费方接线**（§3，与第43/56/57批同口径）；未伪造缺失测试夹具（第58批零 `tests/` 改动，`src/**` 的 43 项既有失败与本批无关）；**未执行任何真实子进程/网络/厂商调用**（§4.2，`spawnProcess` 全注入）。
- 未在测试中对**任何真实 pid** 调用 `taskkill.exe`（本批测试根本不 spawn 进程；`taskkill` 仅作为 `windowsSystemTools` 的**表项常量**被断言路径拼装）。
