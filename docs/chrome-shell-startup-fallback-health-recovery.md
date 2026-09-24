# 第57批 · Chrome 工作进程启动三件套（`electron/chromeShellStartupFallback.js` + `chromeShellStartupHealth.js` + `chromeShellProfileRecovery.js`）

> 第56批落地了 R15 的传输层（`chromeCdpPipeClient` + `chromeBrowserWorker`），但「启动一次 chrome-shell 并等它就绪」这条链上的**判定与恢复逻辑**仍全缺：就绪超时怎么等、等不到时怎么回退到兼容模式、用户怎么被问、被占用的 profile 怎么轮转重试。本批取该簇中**三个自足且可离线验证**的模块：`chromeShellStartupFallback`（缺内核 / 启动失败的三选一对话框，**零 import**）、`chromeShellStartupHealth`（就绪等待状态机，唯一依赖是本仓第55批已落地的 `src/services/chromeShellStartupReadiness.js`）、`chromeShellProfileRecovery`（profile 轮转 + 重试阶梯，**只依赖 `node:fs`/`node:path`**）。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未弹真实对话框、未启动应用、**未触碰任何真实 profile 目录**（`exists`/`rename`/`now`/`delay` 全部注入 double，§4）。

---

## 1 · 缺口（第57批之前）

| # | 缺什么 | 依据 |
| --- | --- | --- |
| 1 | `electron/chromeShellStartupFallback.js` 整个模块 | 新版在「未检测到 Chrome 内核」与「画布未就绪/启动失败」两处都弹三选一（下载 Chrome / 进入兼容模式 / 退出）并据此决定是否回落 Electron 渲染；本仓 `promptForMissingChromeShellBrowser`/`promptForChromeShellStartupFailure` = **0 命中** |
| 2 | `electron/chromeShellStartupHealth.js` 整个模块 | 新版以「启动尝试 ID + 就绪超时」在渲染器事件流里认领就绪/失败事件；本仓 `createChromeShellStartupHealthController`/`AIC_CHROME_SHELL_READY_TIMEOUT_MS` = **0 命中**（第55批只落地了**上报**侧 `src/services/chromeShellStartupReadiness.js`，**等待/认领**侧缺） |
| 3 | `electron/chromeShellProfileRecovery.js` 整个模块 | 新版在渲染器超时时把被占用的 `chrome-shell-profile` 目录**改名留档**再重试一次；本仓 `createChromeShellProfileRecovery`/`runChromeShellStartupWithProfileRecovery`/`PROFILE_DIR_PATTERN` = **0 命中** |
| 4 | R15 整簇 | `chromeShellLauncher`(51 397 B)/`chromeShellWebPreviewManager`(33 189 B)/`chromeShellRuntime`(13 404 B)/`chromeShellBrowserVersion`(9 278 B)/`chromeShellStartupDiagnostics`(1 258 B)/`globalCaptureWindow`(12 406 B)/`globalCaptureWindowController`(17 934 B)/`web-preview/*` 5 条路由 仍全缺（§7） |

---

## 2 · 本批交付

| 文件 | 来源（端口源） | 行数 / 字节 | 说明 |
| --- | --- | --- | --- |
| `electron/chromeShellStartupFallback.js` | `tmp/shuo-electron-deobf/chromeShellStartupFallback.js`（100 行 / 4 438 B） | **100 / 4 467** | **零 import**；`CHROME_DOWNLOAD_URL`、`promptForMissingChromeShellBrowser`、`promptForChromeShellStartupFailure`，私有 `openChromeDownload` |
| `electron/chromeShellStartupHealth.js` | `tmp/shuo-electron-deobf/chromeShellStartupHealth.js`（134 行 / 5 375 B） | **137 / 5 340** | 只 import `../src/services/chromeShellStartupReadiness.js`（**本仓第55批模块**）；`resolveChromeShellStartupReadyTimeoutMs`、`createChromeShellStartupHealthController`、`__chromeShellStartupHealthForTest` |
| `electron/chromeShellProfileRecovery.js` | `tmp/shuo-electron-deobf/chromeShellProfileRecovery.js`（200 行 / 8 193 B） | **207 / 8 447** | 只 import `node:fs`/`node:path`；`createChromeShellProfileRecovery`、`runChromeShellStartupWithProfileRecovery`、`__chromeShellProfileRecoveryForTest` |
| `electron/chromeShellStartupFallback.test.js` | 本批新写 | **251 / 11 723** | 23 项 |
| `electron/chromeShellStartupHealth.test.js` | 本批新写 | **321 / 13 196** | 18 项 |
| `electron/chromeShellProfileRecovery.test.js` | 本批新写 | **399 / 14 658** | 24 项 |

合计 **1 415 行 / 57 831 B**；**新增 0 个 npm 包**（仍只用 `node:` 内建 + 本仓既有模块）。

### 2.1 `chromeShellStartupFallback` 的契约（逐字移植，仅应用名按本仓改写）

- 常量：`CHROME_DOWNLOAD_URL = 'https://www.google.com/chrome/'`。
- `promptForMissingChromeShellBrowser({ dialogApi, shellApi, appName = 'AI CanvasPro' })` → `'download' | 'electron' | 'quit'`：`dialogApi.showMessageBox` 非函数 → 立即 `'quit'`（**不弹窗**）；`warning` 对话框标题 `appName + ' 启动提示'`、正文 `'未检测到\x20Chrome\x20浏览器内核'`、三个按钮 `['重新下载 Chrome','进入兼容模式','退出']`（`defaultId 0`、`cancelId 2`、`noLink true`）；`response === 0` → `await openChromeDownload(shellApi)` 后返回 `'download'`（`openExternal` 抛错被空 `catch` 吞掉，**仍返回 `'download'`**）；`=== 1` → `'electron'`；其余 → `'quit'`；任何抛错 → `'quit'`。
- `promptForChromeShellStartupFailure({ dialogApi, shellApi, appName = 'AI CanvasPro', error })` → `'download'` 之外的同一三态：`error.code === 'CHROME_SHELL_STARTUP_CANCELLED'` → **先于任何弹窗**直接 `'quit'`；`error.code === 'CHROME_SHELL_RENDERER_READY_TIMEOUT'` → 走**超时专用**文案分支（见下），否则走通用分支。
- 超时分支的三选一 detail 首行由 `error.profileRecoveryError.cause.code` 决定：`EPERM`/`EACCES`/`EBUSY` → `'自动恢复未完成：浏览器配置目录仍被占用，或访问被系统拒绝（<code>）。'`；有 `profileRecoveryError` 但 cause 码不在三者内 → `'自动恢复浏览器配置未完成，原配置目录已保留，请导出诊断包排查。'`；连 `profileRecoveryError` 都没有 → `'浏览器已启动，但画布页面未在规定时间内回报就绪。'`；标题 `appName + ' 启动超时'`、正文 `'画布页面未能就绪'`、按钮 `['进入兼容模式','退出']`；`response === 0` → `'electron'`，否则 `'quit'`。
- 通用分支按 `error.details.stage`/`code` 选择首行：`'storage-migration'` → 升级数据恢复；`'project-hydration'` → 项目恢复；`code === 'CHROME_SHELL_EXITED_BEFORE_READY'` → 浏览器进程异常退出；其余 → `'画布启动过程中遇到错误。'`；第二行是 `String(error?.message || error || '未知错误')`。

> **本仓独有偏差（有意，逐处 2 次）**：端口源默认应用名是 `'SHUO\x20Canvas'`，本仓写为 `'AI CanvasPro'`（第55批同口径）。`\x20` 转义**照旧保留**（`'未检测到\x20Chrome\x20浏览器内核'` 等，符合本仓 electron 层既有惯例）。这是本模块唯一与端口源不同的字面量。

### 2.2 `chromeShellStartupHealth` 的契约（逐字移植）

- 常量：`DEFAULT_READY_TIMEOUT_MS = 0x7530`(30000)、`MIN_READY_TIMEOUT_MS = 0x3e8`(1000)、`MAX_READY_TIMEOUT_MS = 0x1d4c0`(120000)。
- `resolveChromeShellStartupReadyTimeoutMs(env = process.env)`：读 `env.AIC_CHROME_SHELL_READY_TIMEOUT_MS`；非有限数或 `<= 0` → 默认 30000；否则 `max(1000, min(120000, round(raw)))`。
- `createChromeShellStartupHealthController({ setTimeoutFn, clearTimeoutFn, now })` → `{ cancel, observeDiagnosticEvent, waitForReady }`，内部只有 `lastResolved` 与 `pending` 两个槽位：
  - `waitForReady({ timeoutMs = 30000, startupAttemptId })`：`startupAttemptId` 不过 `isChromeShellStartupAttemptId`（16–128 字符 `[A-Za-z0-9_-]`）→ `Promise.reject` 且码 `CHROME_SHELL_STARTUP_ATTEMPT_INVALID`；否则先置 `lastResolved = null`，再把**仍在等待**的上一次等待以 `CHROME_SHELL_RENDERER_READY_REPLACED` reject；超时按 1000–120000 夹取后定时，到点若 `pending.reject` 仍是本次则拒绝为 `CHROME_SHELL_RENDERER_READY_TIMEOUT`（消息含夹取后的毫秒数）。
  - `observeDiagnosticEvent(event)`：仅接受 `type` 为就绪/失败事件、`source === 'renderer'`、且 `readChromeShellStartupMetadata(event.context.href)` 非空者；再要求 `event.context.startupAttemptId`/`readyTimeoutMs` 与 href 读出的元数据**双双相等**。无 `pending` 时：失败事件 → `false`（**不被认领**）；就绪事件 → 仅当与 `lastResolved` 的 `(startupAttemptId, readyTimeoutMs)` 完全一致才 `true`。有 `pending` 时还要与 `pending` 的两个字段相等：失败 → `cancelPending` 拒绝为 `CHROME_SHELL_RENDERER_STARTUP_FAILED`，`details.stage` 取 `event.context.failure` 若在 `['entry','initialization','storage-migration','project-hydration']` 内，否则 `'initialization'`；就绪 → 结算为 `{ ready:true, elapsedMs: max(0, now() - startedAt), href, startupAttemptId }` 并记入 `lastResolved`、清定时器。
  - `cancel(message = 'Chrome shell renderer readiness wait was cancelled', { startupAttemptId } = {})`：给了 `startupAttemptId` 但与 `pending` 不符 → `false`（**不动 pending**）；否则以 `CHROME_SHELL_RENDERER_READY_CANCELLED` 拒绝并返回 `true`；无 `pending` → `false`。

### 2.3 `chromeShellProfileRecovery` 的契约（逐字移植）

- 常量：`CHROME_SHELL_RENDERER_READY_TIMEOUT`、`DEFAULT_MAX_RECOVERY_ATTEMPTS = 0x1`、`PROFILE_DIR_PATTERN = /^(chrome|chromium|edge)-shell-profile$/i`、`RENAME_RETRY_DELAYS_MS = [0xc8,0x190,0x320,0x4b0,0x578]`(200/400/800/1200/1400)、`RETRYABLE_RENAME_CODES = new Set(['EPERM','EACCES','EBUSY'])`。
- 错误工厂 `createProfileRecoveryError(message, code, cause = null)` 用 `new Error(message, cause ? { cause } : undefined)`，故 `error.cause` 是**真 cause**（`retryable` 判定读的就是 `error.cause.code`）。
- `formatRecoveryTimestamp(value)`：`Date | 可 new Date()`；`getTime()` 非有限 → `CHROME_SHELL_PROFILE_RECOVERY_TIMESTAMP_INVALID`；否则 `toISOString()` → 去 `[-:]` → `T`→`-` → `slice(0,15)`，得 `YYYYMMDD-HHMMSS`。
- `resolveRecoveryPaths({ sessionDataRoot, profileDir })`：两侧任一为空白、或 `dirname(resolve(profileDir)) !== resolve(sessionDataRoot)`、或目录名不匹配 `PROFILE_DIR_PATTERN` → `CHROME_SHELL_PROFILE_RECOVERY_PATH_INVALID`（**防越界**）。
- `resolveAvailableBackupDir({ profileDir, exists, now })`：`<profileDir>.recovery-<stamp>`，已存在则试 `-1`…`-999`，全占 → `..._BACKUP_UNAVAILABLE`。
- `createChromeShellProfileRecovery({ sessionDataRoot, profileDir, exists = existsSync, rename = renameSync, now = () => new Date(), delay })` → `{ rotate, rotateWhenReleased }`：
  - `rotate()`：源目录不存在 → `..._SOURCE_MISSING`；`rename(profileDir, backupDir)` 抛错 → `..._RENAME_FAILED`（cause 原样保留）；成功 → `{ rotated:true, profileDir, backupDir }`。
  - `rotateWhenReleased()`：循环调 `rotate()`；仅当错误码是 `..._RENAME_FAILED` **且** `cause.code` 属 `RETRYABLE_RENAME_CODES` **且** 未用尽 5 档延迟时才 `await delay(档位)` 重试；否则抛出（错误上附 `renameAttempts`，从 1 起算）。
- `runChromeShellStartupWithProfileRecovery({ startAttempt, rotateProfile, maxRecoveryAttempts = 1, logEvent = null })`：两回调必须为函数（否则对应 `TypeError`）；额度 `max(0, min(1, trunc(Number(x) || 0)))`（**默认 1，最多 1 次恢复**）。循环 `startAttempt({ attemptNumber: count+1, recoveryCount: count })`：成功 → 若 `count > 0` 记 `chrome_shell.profile_recovery_succeeded`，返回 `{ runtime, profileRecovery: { recovered: count > 0, recoveryCount, backupDir } }`；失败但**不是**超时或额度用尽 → 记 `..._recovery_failed` 后抛出；否则记 `..._recovery_started` 并 `rotateProfile({ error, recoveryCount })`——其抛错 → 把 `startupError.profileRecoveryError` 指向该错误、记 `..._recovery_failed`（context 带 `renameAttempts`/`filesystemCode`）后抛**原 startupError**；返回 `rotated !== true` → 同样指向一个 `..._NOT_ROTATED` 错误后抛原 startupError；成功 → `count += 1`、记 `..._profile_rotated`（context 带 `backupName`/`renameAttempts`）。

---

## 3 · 接线现状与可达性

**本批有意不接线，三个模块当前均为生产零引用。**

- 三个模块在端口源里的**唯一消费方都是 `main.js` 的 chrome-shell 启动路径**（`grep` 端口源：`chromeShellStartupFallback`/`chromeShellStartupHealth`/`chromeShellProfileRecovery` 均只被 `main.js` 引用），而该路径依赖 `chromeShellLauncher`/`chromeShellRuntime`（**本批未移植**，§7）。在本仓 `main.js` 里凭空调用它们会是**伪造消费方**：本仓渲染器是 Electron 内置渲染器、`installDesktopBridgeCompat()` 首道守卫即 `return false`（第55批已证），chrome-shell 启动分支根本不执行，接上去只会造一条死路径。
- 与第43批 `sortformerModelRoot.js`、第56批两个传输原语同一口径：**宁可留白并记账，也不为了「有引用」而擅自接线**。
- **本批不影响任何现有行为**：三个模块的 import 侧效应为零（`chromeShellProfileRecovery` 只在被调用时才 `renameSync`，而本仓无调用点）；`chromeShellStartupHealth` 的 import 目标是第55批**已落地且已测**的模块，属真实可离线验证的依赖边。
- 一个**结构性收益**：`chromeShellStartupHealth` 与第55批的 `src/services/chromeShellStartupReadiness.js` 组成「上报端 ↔ 认领端」的完整闭环（同一份 `aicStartupAttemptId`/`aicStartupReadyTimeoutMs` 契约、同一套 1000–120000 夹取、同一批事件名常量），使 R15 的就绪协议**首次两端齐备**——只差把两端接进未移植的 launcher。

| 检查 | 结论 |
| --- | --- |
| 仓内 `import` 引用数 | 三者均为 **0**（测试文件除外） |
| `main.js` / `mainIpcSetup` / preload 改动 | **无** |
| 新增 env 变量读取 | `AIC_CHROME_SHELL_READY_TIMEOUT_MS`（仅在函数被调用时读，本仓无调用点故不生效） |
| 对现有测试的影响 | 无（纯新增文件；`electron/**` 由 869 → **934**，全部为本批 +65） |

---

## 4 · 已执行的验证

| 命令（离线） | 结果 |
| --- | --- |
| `node --check` × 3 个源 + 3 个测试 | 退出 0 |
| `prettier --check` × 6 个文件 | `All matched files use Prettier code style!` |
| `node --test electron/chromeShellStartupFallback.test.js` | **23/23/0** |
| `node --test electron/chromeShellStartupHealth.test.js` | **18/18/0** |
| `node --test electron/chromeShellProfileRecovery.test.js` | **24/24/0** |
| 三文件合并 `node --test` | **65/65/0** |
| `node --test $(find electron -name '*.test.js')` | **934/933/1**（唯一失败仍是既有 `electron/fullProjectPackageService.test.js`，第17批遗留；`api/**` = 457/457/0、`src/**` = 1 262/1 219/43 均未触碰） |
| 快照 | `0/58/344/0`（第56批 `0/58/337/0`）：**+7 untracked，已逐一归因且无余项** = 3 源 + 3 测试 + 1 专题文档（本表落盘前实测为 343）；`modified` 同为 58，**本批未编辑任何既有源文件** |

### 4.1 忠实性（token 级 LCS 比对，非目测）

| 模块 | port tokens | repo tokens | ONLY IN PORT | ONLY IN REPO | 结论 |
| --- | --- | --- | --- | --- | --- |
| `chromeShellStartupFallback` | 545 | **545** | 40 | 40 | 差集**全是标识符**；40 对 40 一一对应 = 纯重命名 + 应用名/formatting 差异 |
| `chromeShellStartupHealth` | 822 | **823** | 103 | 104 | 103 个 `_0x` 名 ↔ 103 个语义名；repo 多出的**唯一** token 是 prettier 对多行形参表补的**尾逗号** |
| `chromeShellProfileRecovery` | 1207 | **1209** | 138 | 140 | 138 个 `_0x` 名 ↔ 138 个语义名；repo 多出的 2 个 token 是同样两个多行形参表的**尾逗号** |

差集里**没有任何非标识符 token**（除尾逗号），即三个模块都是**纯重命名移植、零逻辑分歧**。（比对前后各修一处：`resolveAvailableBackupDir` 起初把端口源的 `const ts = formatRecoveryTimestamp(now()); const baseName = profileDir + '.recovery-' + ts` 内联成一行，已还原为端口源的两段式，差额随之为纯尾逗号。）

### 4.2 测试设计要点

- `chromeShellStartupFallback.test.js`：`dialogApi.showMessageBox`/`shellApi.openExternal` 全部注入 double（**从不弹真实对话框**），逐一断言按钮数组/`defaultId`/`cancelId`/`noLink`/detail 文案；覆盖 `0/1/2/缺失字段`、`openExternal` 抛错仍 `'download'`、`showMessageBox` 抛错 → `'quit'`（普通分支与超时分支各一条）、`CHROME_SHELL_STARTUP_CANCELLED` **不弹窗**直接 `'quit'`、`EPERM`/`EACCES`/`EBUSY` 三种锁定码与「有恢复错误但码非三类」「无恢复错误」三种 detail 首行、`storage-migration`/`project-hydration`/`EXITED_BEFORE_READY`/通用 四种 stage 文案、非 `Error` 值与缺失值的字符串化。
- `chromeShellStartupHealth.test.js`：`setTimeoutFn`/`clearTimeoutFn`/`now` 全部注入（**假定时器 registry + 手动 `fire`**，不用真实时钟），而 `readChromeShellStartupMetadata`/`isChromeShellStartupAttemptId` 用**本仓真实实现**（回环 `aicRuntime=chrome-shell` href）。覆盖 env 覆盖值的三类回退与双端夹取、非法 attempt id、就绪结算的 `elapsedMs`/`href`/清定时器、超时消息含夹取后毫秒数、attempt/超时/来源/href 四种不匹配、**替换语义**（前一个以 `..._READY_REPLACED` 拒绝）、失败事件的 `details.stage` 归一、结算后重复就绪事件按 `lastResolved` 认领、`cancel` 的三种作用域。
- `chromeShellProfileRecovery.test.js`：`exists`/`rename`/`now`/`delay` 全注入（**同步 `exists`/`rename` double 保证不触碰文件系统**），断言 `rotate` 的备份名拼装（含 `-N` 碰撞后缀与 1000 名全占）、`rename` 失败的 cause 保留、重试阶梯**恰好** `[200,400,800,1200,1400]` 且用尽后 `renameAttempts = 6`、非可重试码与源缺失**不重试**、以及 `runChromeShellStartupWithProfileRecovery` 的四种日志类型顺序/`context`/原错误透传与三个 `TypeError`/额度语义（默认 1、`0` 关闭）。

---

## 5 · 本仓独有差异

- **唯一一处**：`chromeShellStartupFallback` 的默认应用名 `'SHUO\x20Canvas'` → `'AI CanvasPro'`（2 处，见 §2.1），随之为 40/40 的差集。`chromeShellStartupHealth`/`chromeShellProfileRecovery` **无任何本仓改写**——用端口源覆盖等价（除行宽/尾逗号）。
- 未改任何 locale 文件、未加 i18n key（三个模块的文案本就是端口源内的中文字面量，不进 `src/i18n`）。

---

## 6 · 未执行的验收项（不得当作已完成）

1. **未弹过真实对话框**：`dialogApi` 恒为 double，`'download'` 分支的 `shellApi.openExternal` 也只在 double 上跑过；真实 Electron `dialog.showMessageBox` 的返回值/按钮映射、真实系统浏览器打开**未验证**。
2. **未跑过真实就绪协议**：`chromeShellStartupHealth` 的事件由测试直接构造，`readChromeShellStartupMetadata` 只在**回环 href** 上被验证；真实渲染器在 chrome-shell 运行时下发出的 `renderer.chrome_shell_startup_ready`/`_failed` 事件、真实 `performance.now()` 时基、真实 30 s 等待**未验证**（chrome-shell 运行时未移植）。
3. **未触碰真实 profile 目录**：`rename` 全为 double，`PROFILE_DIR_PATTERN` 路径校验虽用真实 `path`，但**真实 Windows 上「浏览器占用 profile 导致 `EBUSY`」的真实重试行为未验证**；1000 名全占场景是合成出来的。
4. **未在 Electron 主进程内运行**：三个模块未打包、未被 `main.js` 引用，65 项测试全部是纯 Node 下的离线用例。
5. `runChromeShellStartupWithProfileRecovery` 的真实 `startAttempt`（即 `chromeShellLauncher` 的启动 + CDP 握手 + 就绪等待整链）**完全未跑**。

---

## 7 · R15 剩余（下一步）

**本批之后 R15 仍缺 7 个模块 + 5 条路由**（不含已落地的 5 个前置）：

| 模块 | 端口源大小 | 依赖 |
| --- | --- | --- |
| `chromeShellLauncher.js` | 976 行 / 51 397 B | `node:child_process`/`fs`/`path`、`chromeShellBrowserVersion`、`chromeShellStartupDiagnostics`、`windowsTaskbarIdentity` |
| `chromeShellWebPreviewManager.js` | 810 行 / 33 189 B | **零 import**（体量大但自足，最优先） |
| `chromeShellRuntime.js` | 347 行 / 13 404 B | `chromeBrowserWorker`、`chromeCdpPipeClient`、`chromeShellWebPreviewManager`（**前两者第56批已落地**） |
| `globalCaptureWindowController.js` | 463 行 / 17 934 B | `electron`、`node:path`、`windowsWindowTransitions` |
| `globalCaptureWindow.js` | 281 行 / 12 406 B | `src/modules/interaction/contextMenuIcons.js`、`src/modules/workspaceHorizontalWheel.js`（**本仓存在性待核**） |
| `chromeShellBrowserVersion.js` | 261 行 / 9 278 B | `node:child_process`/`buffer`/`fs`/`path`、`windowsSystemTools` |
| `chromeShellStartupDiagnostics.js` | 35 行 / 1 258 B | `./diagnostics.js`（**本仓已存在**，最易） |

依赖缺口：`windowsSystemTools.js`/`windowsTaskbarIdentity.js`/`windowsWindowTransitions.js` 在本仓 `electron/` 下**均不存在**，需与本簇同批或先行移植；`web-preview/*` 5 条路由与 `storage-migration/prepare` 仍在 `desktopHttpBridge` 侧留空（归 R02，见 `desktop-http-bridge.md`）。

**建议下一批**：`chromeShellStartupDiagnostics`(1 258 B) + `chromeShellBrowserVersion`(9 278 B) 与三个 `windows*` 依赖中的前两个（自足、可离线测），随后再攻 `chromeShellWebPreviewManager`(33 189 B) 与 `chromeShellLauncher`(51 397 B)。

---

## 8 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批零 `api/` 改动）；未 push；未 `git reset --hard`/`git clean`/批量 checkout；未覆盖任何既有文件。
- 未改动授权校验逻辑；未在仓内写入任何 MCP 地址/会话 ID/密钥；未把反混淆临时目录或绝对开发机路径写成运行时依赖（三个模块的路径构造全部基于注入参数与 `path`）。
- 未伪造消费方接线（§3）；未伪造缺失测试夹具；未执行任何真实子进程/网络/厂商调用。
