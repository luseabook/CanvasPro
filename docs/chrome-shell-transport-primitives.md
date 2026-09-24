# 第56批 · Chrome 工作进程传输层（`electron/chromeCdpPipeClient.js` + `electron/chromeBrowserWorker.js`）

> 第30–55批把宿主侧能力操作层与渲染器侧客户端链补齐后，R15（内嵌浏览器节点 / Chrome 工作进程 / 预览生命周期）仍是**整块空白**：`chromeShellLauncher.js`(51 397 B)、`chromeShellWebPreviewManager.js`(33 189 B)、`chromeShellRuntime.js`(13 404 B) 等 12 个模块在本仓**全部缺失**。本批只取该簇**最底层、可离线验证**的两个传输原语：`chromeCdpPipeClient`（Chrome DevTools Protocol 的 NUL 分帧管道客户端，**零 import**）与 `chromeBrowserWorker`（Windows `taskkill /T /F` 进程树终止 + profile 目录解析 + `--headless=new --remote-debugging-pipe` 启动，**只依赖 `node:` 内建**）。二者是后续 `chromeShellLauncher`/`chromeShellRuntime` 的必要前置。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未启动应用、**未 spawn 任何真实子进程**（下文的例外见 §6）。

---

## 1 · 缺口（第56批之前）

| # | 缺什么 | 依据 |
| --- | --- | --- |
| 1 | `electron/chromeCdpPipeClient.js` 整个模块 | 新版 chrome-shell 以 `--remote-debugging-pipe` 起浏览器，CDP 请求/响应/事件全走该管道客户端；本仓 `chromeCdpPipeClient` = **0 命中**。它是 `chromeShellRuntime` 唯一的 CDP 出入口 |
| 2 | `electron/chromeBrowserWorker.js` 整个模块 | 新版用「工作进程 + 独立 profile」方式起无头 Chrome，并需要 Windows 上连孙子进程一起终止；本仓 `chromeBrowserWorker`/`terminateProcessTree`/`AIC_CHROME_BROWSER_NODE_PROFILE_DIR` 均 **0 命中** |
| 3 | R15 整簇 | `chromeShellLauncher`/`chromeShellWebPreviewManager`/`chromeShellRuntime`/`chromeShellBrowserVersion`/`chromeShellProfileRecovery`/`chromeShellStartupHealth`/`chromeShellStartupFallback`/`chromeShellStartupDiagnostics`/`globalCaptureWindow`/`globalCaptureWindowController`/`web-preview/*` 5 条路由 仍全缺（见 §7） |

---

## 2 · 本批交付

| 文件 | 来源（端口源） | 行数 / 字节 | 说明 |
| --- | --- | --- | --- |
| `electron/chromeCdpPipeClient.js` | `tmp/shuo-electron-deobf/chromeCdpPipeClient.js`（150 行 / 5 454 B） | **150 / 5 275** | 零 import；`DEFAULT_COMMAND_TIMEOUT_MS = 0x3a98`(15000)、`createProtocolError`、`createChromeCdpPipeClient`、`__chromeCdpPipeClientForTest` |
| `electron/chromeBrowserWorker.js` | `tmp/shuo-electron-deobf/chromeBrowserWorker.js`（73 行 / 2 749 B） | **73 / 2 786** | 只 import `node:child_process`/`node:fs`/`node:path`；`terminateProcessTree`、`resolveChromeBrowserWorkerProfileDir`、`launchChromeBrowserWorker`、`__chromeBrowserWorkerForTest` |
| `electron/chromeCdpPipeClient.test.js` | 本批新写 | **450 / 17 069** | 30 项 |
| `electron/chromeBrowserWorker.test.js` | 本批新写 | **274 / 9 678** | 16 项 |

合计 **947 行 / 34 808 B**；**新增 0 个 npm 包**（仍只用 `node:` 内建）。

### 2.1 `chromeCdpPipeClient` 的契约（逐字移植）

- 构造：`createChromeCdpPipeClient({ readable, writable, commandTimeoutMs = 15000, setTimeoutFn, clearTimeoutFn, logEvent = null })`；`readable` 必须有 `on`、`writable` 必须有 `write`，否则抛 `TypeError('Chrome CDP readable pipe is required'` / `'Chrome\x20CDP\x20writable\x20pipe\x20is\x20required'`）。
- `send(method, params = {}, sessionId = '')`：自增 `id`；`method` 空串 → 同步 `Promise.reject('Chrome CDP method is required')` **且不写帧**；`sessionId` 为假值则**整键省略**；帧为 `JSON.stringify(msg) + '\0'`，以 `utf8` 写；`writable.write` 同步抛错 → 该请求立即 reject 并清定时器。
- 分帧：`buffer` 累积，按 `'\0'` 切；**空段跳过**；`JSON.parse` 失败 → `logEvent({ type:'chrome_cdp.invalid_message', level:'warn', source:'main', … })` 后**继续处理后帧**（不关管道）。
- 分发：带 `id` → 命中 `pending` 则 `clearTimeoutFn(timer)` 后 `resolve(result || {})`，带 `error` 则 `createProtocolError` 后 reject（`code`/`data` 仅在 `!= null` 时拷贝）；**无 `id` 有 `method`** → 扇出给全部 `onEvent` 处理器，单个处理器抛错不阻断其余；二者皆无 → 静默忽略。
- 关闭：`close(reason = 'Chrome CDP pipe closed')` 幂等；解绑两管道的 `data`/`close`/`end`/`error`；**所有 pending 以 `new Error(reason)` reject**；清空处理器集合。`readable` 的 `end`/`close`、`writable` 的 `close` 都触发它；任一管道 `error` 先记 `chrome_cdp.pipe_error` 再以 `String(error?.message || error || 'Chrome CDP pipe failed')` 为 reason 关闭。

### 2.2 `chromeBrowserWorker` 的契约（逐字移植）

- `terminateProcessTree(childProcess, platform = process.platform)`：`platform === 'win32' && Number.isInteger(pid) && pid > 0` → `spawn('taskkill.exe', ['/pid', String(pid), '/T', '/F'], { stdio:'ignore', windowsHide:true }).unref?.()` 后 **return**（`try/catch` 空吞，失败则落回 `kill`）；否则 `childProcess.kill?.()`（同样空吞）。
- `resolveChromeBrowserWorkerProfileDir({ mainProfileDir, env = process.env })`：`env.AIC_CHROME_BROWSER_NODE_PROFILE_DIR` 去空白后非空 → `path.resolve(override)`；否则 `path.join(path.dirname(path.resolve(String(mainProfileDir || process.cwd()))), 'chrome-browser-node-profile')`。
- `launchChromeBrowserWorker({ browserPath, mainProfileDir, env, platform, mkdir = mkdirSync, spawnProcess = spawn, terminateProcess = terminateProcessTree, onExit = null, onError = null })`：`browserPath` 去空白后为空 → 抛 `Error('Chrome browser worker executable is required')`（**在 mkdir/spawn 之前**）；`mkdir(profileDir, { recursive: true })`；参数固定为 `--user-data-dir=<profileDir> --headless=new --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required --remote-debugging-pipe about:blank`；`stdio: ['ignore','ignore','ignore','pipe','pipe']`、`windowsHide: true`；`devToolsPipe = proc.stdio[3] && proc.stdio[4] ? { writable: stdio[3], readable: stdio[4] } : null`；`dispose()` 幂等，只调一次 `terminateProcess(proc, platform)`。

---

## 3 · 接线现状与可达性

**本批有意不接线，两个模块当前均为生产零引用。**

- 唯一的生产消费方是 `chromeShellLauncher.js` / `chromeShellRuntime.js`，二者**本批未移植**（§7）。把 `launchChromeBrowserWorker`/`createChromeCdpPipeClient` 接到任何现有入口上都会是**伪造消费方**——本仓现有 `webPreviewViewManager.js` 走的是 Electron `<webview>`/`WebContentsView` 路线，与 chrome-shell（外部浏览器 + CDP 管道）不是同一条链，接上去只会制造一条永不执行的死路径。
- 这与第43批 `sortformerModelRoot.js` 的处理口径一致：**宁可留白并记账，也不为了「有引用」而擅自接线**。第55批已验证的台账原文亦有此约束「不要为了让它有引用而擅自接线」。
- 反过来，**本批不影响任何现有行为**：两模块零 import 侧效应（`chromeBrowserWorker` 只在被调用时才 spawn），且**无任何仓内文件 import 它们**，故接线为零风险、可随时由后续批次的 launcher 接入。

| 检查 | 结论 |
| --- | --- |
| 仓内 `import` 引用数 | `chromeCdpPipeClient` = 0（测试除外）、`chromeBrowserWorker` = 0（测试除外） |
| `main.js` / `mainIpcSetup` / preload 改动 | **无** |
| 新增 env 变量读取 | `AIC_CHROME_BROWSER_NODE_PROFILE_DIR`（仅在函数被调用时读，本仓无调用点故不生效） |
| 对现有测试的影响 | 无（纯新增文件；`electron/**` 由 823 → **869**，全部为本批 +46） |

---

## 4 · 已执行的验证（全部离线，本窗口实测）

| 命令 | 结果 |
| --- | --- |
| `node --check electron/chromeCdpPipeClient.js` | 退出 0 |
| `node --check electron/chromeBrowserWorker.js` | 退出 0 |
| `node --check electron/chromeCdpPipeClient.test.js` | 退出 0 |
| `node --check electron/chromeBrowserWorker.test.js` | 退出 0 |
| `node --test electron/chromeCdpPipeClient.test.js electron/chromeBrowserWorker.test.js` | **46/46 通过**，325 ms |
| `node --test $(find electron -name '*.test.js')` | **869/868/1**（第55批 823/822/1，**净增 46**；唯一失败仍是既有 `fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第17批，未新增未变化） |
| prettier（`deobf-tools/prettierrc.json`）`--check` 四个文件 | `All matched files use Prettier code style!` |

**忠实性用 token 级比对工具核对（非目测）**——`~/.qoder/tmp/deobf-tools/cmp-tokens.mjs`：

| 文件 | port tokens | repo tokens | matched | ONLY IN PORT | ONLY IN REPO |
| --- | --- | --- | --- | --- | --- |
| `chromeCdpPipeClient` | 1062 | **1062** | 895 | 167 | 167 |
| `chromeBrowserWorker` | 541 | **541** | 492 | 49 | 49 |

两侧 token **总数完全相等**，且 ONLY IN PORT 与 ONLY IN REPO **一一对应**——`chromeBrowserWorker` 的 49 项逐条核对为 `V`(端口 `_0x` 名) ↔ 语义名（`childProcess`/`platform`/`killer`/`mainProfileDir`/`override`/`resolvedMain`/`browserPath`/`executable`/`profileDir`/`args`/`code`/`signal`/`error`/`disposed`），即**纯重命名、零逻辑差异**（无新增/删除语句，无参数增删）。`chromeCdpPipeClient` 同类。这是目前批次里最强的忠实性结果（此前批次为「总数不等 + 声明顺序残差」）。

**测试设计（全部离线 double，`spawn` 一次都没跑）**：

- `chromeCdpPipeClient.test.js` **30 项**：构造参数校验（含 `\x20` 消息）；帧格式（`utf8` + `\0` 结尾 + 字段/id 自增/`params` 归一为 `{}`/假值 `sessionId` 整键省略/`method` 强制 `String`）；空 `method` 拒绝且**不写帧**；事件扇出（多处理器、单处理器抛错不阻断、`id`+`method` 皆无 → 忽略、未知 `id` → 忽略）；**跨 chunk 半帧重组**（先发半帧断言未结算，再发余下）；同 chunk 双帧 + 空段跳过（用 `Buffer` 喂入）；非法 JSON 记 `chrome_cdp.invalid_message` 且后帧仍派发、无 `logEvent` 也不崩；协议错误 `code`/`data`/默认消息/`createProtocolError` 空参；**注入式假定时器**验证默认 15000、`0/-5/'abc'` 关定时器、超时 reject + `clearTimeoutFn` 收到 token + 迟到响应被忽略；同步写失败 reject 并清定时器；`close(reason)` 幂等且拒绝全部 pending、`end`/`close`/`error` 三分支、非 `Error` 与非 `Error` 空值 reason 回落、关后 `send`/`onEvent` 行为、退订生效。
- `chromeBrowserWorker.test.js` **16 项**：`terminateProcessTree` 的 `null`/无 `pid`/`pid=0`/负/字符串/小数/`NaN` 一律回落 `kill`（**含 `'1234'` 字符串非整数**）、非 win32 三平台走 `kill`、`kill` 抛错与缺失 `kill` 均被吞；profile 解析（`AIC_CHROME_BROWSER_NODE_PROFILE_DIR` 去空白 + 解析、空/空白回落兄弟目录、缺失回落 cwd、**空白串因 truthy 而解析到 cwd 本身**这一移植怪癖单列一项）；启动（空 `browserPath` 在 mkdir/spawn 前抛、mkdir `recursive:true`、参数数组逐项、`stdio`/`windowsHide` 逐项、`browserPath` 去空白、`devToolsPipe` 映射、`stdio` 缺 `[3]`/`[4]` 时 `null`）；`onExit({code,signal})`/`onError(err)` 转发、无回调也不崩；`dispose()` **只终止一次**且透传 `platform`（显式 `'linux'` 与默认 `process.platform` 两侧都锁）。

**快照** `0/58/336/0`（第55批 `0/58/332/0`）：**+4 untracked 已逐一归因** = 本批 4 个新增文件（2 模块 + 2 测试）；`modified` 同为 58（本批**未修改任何既有文件**）。

---

## 5 · 本仓独有增量（**必须保留**）

本批**未引入任何偏离**：两个模块为纯移植，无本仓特有增强。反过来，**后续批次按新版覆盖这两个文件是安全的**（它们没有像 `mediaTaskQueue.js` 那样的 5 处本仓独有增量）。

---

## 6 · 验收欠项（仍未执行，须授权）

1. **`terminateProcessTree` 的 win32 `taskkill /T /F` 分支未被执行**——该分支内部调用模块级 `spawn`，**没有注入点**（本批为保忠实性**未给私有助手增加注入参数**）。要覆盖它必须真的启动系统 `taskkill.exe` 并指向一个 pid，存在误杀真实进程树的风险，故**有意不测**。已改用两条等价证据锁定：①`platform:'win32'` 下非整数/非正 `pid` **不**走该分支（回落 `kill`）；②`dispose()` → 注入的 `terminateProcess` 拿到 `(child, platform)`。**这不等价于已验收 win32 树终止**。
2. **CDP 管道客户端未经真实 Chrome 验证**——所有帧都由 `EventEmitter` double 喂入。真实 `--remote-debugging-pipe` 的**握手序列**（`Target.setAutoAttach`/`sessionId` 路由/`\0` 分帧在真实 pipe 上的边界）、真实 Chrome 的事件顺序、大帧跨多次 `data` 的实际分块**均未验证**。
3. **未在 Electron 主进程内运行**——两模块均未被打包进应用、未跑过 `electron` 主进程；`spawn` 的真实 PATH 解析（`chrome.exe` 与 `taskkill.exe` 的查找）**未验证**。
4. 未联网、未下载/启动任何 Chrome、未执行任何 CDP 命令。

---

## 7 · 剩余工作（不在本批）

- **R15 其余 10 个模块**：`chromeShellLauncher.js`(51 397 B)、`chromeShellWebPreviewManager.js`(33 189 B)、`chromeShellRuntime.js`(13 404 B)、`chromeShellBrowserVersion.js`(9 278 B)、`chromeShellProfileRecovery.js`(8 193 B)、`chromeShellStartupHealth.js`(5 375 B)、`chromeShellStartupFallback.js`(4 438 B)、`chromeShellStartupDiagnostics.js`(1 258 B)、`globalCaptureWindow.js`(12 406 B)、`globalCaptureWindowController.js`(17 934 B)；`web-preview/*` 5 条路由；`webPreviewViewManager.js`（本仓已有，属更老一代，106 620 vs 端口 127 166 B）；`storage-migration/prepare`。
- **本批两模块的消费方**：`chromeShellLauncher` 是 `launchChromeBrowserWorker` 与 `createChromeCdpPipeClient` 的唯一接线点，接入后二者生产引用数才从 0 变正。
- R02 其余（`legacyStorageMigration.html` + `prepare()`、`text-preset` 浮层面板、`contextMenuShortcutCatalog.js`、新时间线链）、R16 渲染器面板与全部 kind 调用点、R01 验收均照台账。

---

## 8 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 `1e0458013f5341c99f21faefc1d34d3f` 不变）；未触碰安装目录、授权校验、`style.css`、CI/发布链。
- 未 `git reset --hard`/`git clean`/批量 checkout/覆盖目录；未提交、未推送。
- 新增文件不含绝对开发机路径、不含临时目录依赖、不含密钥/session/MCP 地址。
- 未新增 npm 依赖；`package.json` 未改。
- 未把 `--check-runtime-only` 之类静态结论当作运行结果；§4 全部为**本窗口实测执行**，§6 明确列出**未执行**项。
