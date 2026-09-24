# R15/R24 启动端口回收与后端启动解析（第75批）

## 1. 本批要补的缺口

`electron/main.js` 的启动路径里长期存在一段**旧世代的内联实现**：一段自己写的 `collectListeningPortPids`（win32 走 `netstat -ano -p tcp`、其余平台走 `lsof -nP -iTCP:<port> -sTCP:LISTEN -t` 并解析文本）以及一个 `clearPortBeforeStart`——它对枚举出的**每一个** LISTENING pid 直接 `taskkill /PID <pid> /F /T`（非 win32 为 `process.kill(pid,'SIGTERM')`），**不校验该 pid 是否真的是本仓自己的后端子进程**。

端口源（0.7.16）把这套逻辑整体抽成了 5 个模块，并在「杀之前」插入了一道**进程身份核验**：

| 模块 | 端口源体量 | 作用 |
| --- | --- | --- |
| `electron/startupPortPolicy.js` | 40 行 / 1 412 B | 纯判定：给定「枚举到的 pid 集合」与「已核验为本地后端的 pid 集合」，决定是通过还是抛错 |
| `electron/startupPortInspector.js` | 100 行 / 3 651 B | 端口枚举（netstat/lsof）+ TCP 可用性探测（`net.createServer` 试 bind） |
| `electron/startupPortRecovery.js` | 123 行 / 5 152 B | 回收编排：容忍窗口 → 身份核验 → 变更检测 → 终止 → 复查 |
| `electron/backendLaunchResolver.js` | 27 行 / 1 017 B | 启动规格解析：未打包 → `python server.py`（cwd=appRoot）；已打包 → 原生 `aicanvas-backend[.exe]` |
| `electron/backendProcessIdentity.js` | 188 行 / 8 126 B | 进程身份核验：win32 走 PowerShell `Get-CimInstance Win32_Process`、其余平台走 `ps -p <pid> -o comm= -o args=`，再按「可执行文件/命令行/`--host=`/`--port=`」逐条判定 |

本批把这 5 个模块落地，**并把 main.js 的旧内联实现替换为对新模块的委托**（与第70/71批「真正接入」口径一致；与第43/56–62/72批「只落地不接线」不同——这 5 个模块的消费方在本仓**真实存在**，即 `main.js` 的启动路径，故可无伪造地接线）。

## 2. 交付物

| 文件 | 行/字节 | import | 导出 |
| --- | --- | --- | --- |
| `electron/startupPortPolicy.js` | 40 / 1 409 | **零 import** | `assertStartupPortCanBeReclaimed` |
| `electron/startupPortInspector.js` | 98 / 3 353 | `node:child_process`（`execFileSync`）/ `node:net`（`createServer`）/ `./windowsSystemTools.js`（`describeSystemCommandFailure`/`resolveWindowsSystemToolPath`，第58批已落地） | `collectListeningPortPids` / `probeTcpPortAvailable` / `__startupPortInspectorForTest` |
| `electron/startupPortRecovery.js` | 134 / 5 383 | `./startupPortPolicy.js` | `reclaimStartupPort` |
| `electron/backendLaunchResolver.js` | 28 / 1 047 | `node:path` | `resolveNativeBackendExecutable` / `resolveBackendLaunchSpec` |
| `electron/backendProcessIdentity.js` | 189 / 7 995 | `node:buffer`（`Buffer`）/ `node:child_process`（`spawnSync`）/ `node:path` / `./windowsSystemTools.js` | `isExpectedBackendProcess` / `inspectBackendProcesses` / `findVerifiedBackendProcessPids` / `__backendProcessIdentityForTest` |
| `electron/startupPortPolicy.test.js` | — | — | 7 项 |
| `electron/startupPortInspector.test.js` | — | — | 15 项 |
| `electron/startupPortRecovery.test.js` | — | — | 18 项 |
| `electron/backendLaunchResolver.test.js` | — | — | 4 项 |
| `electron/backendProcessIdentity.test.js` | — | — | 19 项 |

### `startupPortPolicy.js` 语义

- `assertStartupPortCanBeReclaimed({ port, pids, verifiedPids, env })`：先把 `pids` 归一（`Number` → `Number.isInteger` → `> 0x0` → `Set` 去重），空集直接返回。
- 测试逃生门：`env.AICANVAS_TEST_FAIL_IF_PORT_BUSY` 命中 `TRUE_RE = /^(1|true|yes|on)$/i` 时抛 `Test port <port> is busy; refusing to terminate listener PIDs <pids>`——**专门用来防止任何测试真的去杀端口占用者**。
- 否则：若存在**不在** `verifiedPids` 里的监听者，抛 `code = 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED'`、`details = { port, pids, unverifiedPids }`。

### `startupPortInspector.js` 语义

- 私有 `createEnumerationError`：`code = 'AIC_STARTUP_PORT_ENUMERATION_FAILED'`，`details = { port, command, failure: describeSystemCommandFailure(cause) }`，并置 `cause`。
- 私有 `parseWindowsNetstatPids(output, port, processId)`：只收 `LISTENING` 行，`columns[1]?.endsWith(':' + port)`，`columns.length >= 0x5`，`parseInt(columns[0x4], 0xa)`，排除自身 `processId`，去重。
- `collectListeningPortPids(port, { platform, env, processId, execFileSyncFn })`：win32 → `resolveWindowsSystemToolPath('netstat', {env})` + `['-ano','-p','tcp']`；否则 `'lsof'` + `['-nP','-iTCP:'+port,'-sTCP:LISTEN','-t']`；统一 `{ encoding:'utf8', windowsHide:true }`；非 win32 的 `status === 0x1` 视为「无监听者」返回 `[]`。
- `probeTcpPortAvailable({ host='127.0.0.1', port, createServerFn })`：返回 Promise，一次性 `settle` 守卫；`EADDRINUSE` → resolve `false`；`listen({host, port, exclusive:true})` 成功后 `close(cb)`；`server['unref']?.()`。

### `startupPortRecovery.js` 语义

- `reclaimStartupPort({ port, env, collectListeningPortPids, probePortAvailable, confirmRuntimeIdentity, terminateProcess, delayFn, settleDelayMs=0x320, onReclaim, onEnumerationUnavailable })`：缺 collector → `TypeError('Startup port listener collector is required')`；缺 terminator → `TypeError('Startup port process terminator is required')`。
- **枚举失败的新增行为**：收到 `AIC_STARTUP_PORT_ENUMERATION_FAILED` 时先探测端口——自由则调 `onEnumerationUnavailable({ error })` 并返回 `{ reclaimed:false, pids:[], skippedReason:'enumeration-unavailable-port-free' }`；占用则重抛原错误并补 `details.portAvailability = 'free'|'busy-or-unavailable'|'probe-failed'`（后者附 `portProbeFailure`）。
- **身份未核验的策略违规**：有 `delayFn` 时进入容忍窗口——最多 10 轮 / 2 000 ms 期限（每轮 delay 200 ms）；监听者消失 → `skippedReason:'listener-exited'`；pid 集合变化 → 跳出并重抛；随后重新枚举，若所有权已变 → `AIC_STARTUP_PORT_OWNERSHIP_CHANGED`。
- 通过后：`onReclaim()` → 逐个 pid 终止（收集失败 → `AIC_STARTUP_PORT_RECLAIM_FAILED` + `details.failures`）→ 等 `settleDelayMs` → 重新枚举，仍占用则 `AIC_STARTUP_PORT_STILL_BUSY`；成功返回 `{ reclaimed:true, pids:initialPids }`。
- 私有：`normalizeListenerPids` / `samePidSet` / `createPortRecoveryError`。

### `backendLaunchResolver.js` 语义

- `resolveNativeBackendExecutable({ runtimeRoot, platform=process['platform'] })` → `path['join'](runtimeRoot,'backend', win32 ? 'aicanvas-backend.exe' : 'aicanvas-backend')`。
- `resolveBackendLaunchSpec({ appIsPackaged, appRoot, runtimeRoot, platform, existsSync, pythonCommand })`：未打包 → `{ kind:'python-source', command: pythonCommand, args:['server.py'], cwd: appRoot }`；已打包且可执行文件缺失 → 抛 `Packaged backend executable is missing: <exe>. Rebuild the native backend before packaging.`；否则 → `{ kind:'native-backend', command: executable, args: [], cwd: appRoot }`。

### `backendProcessIdentity.js` 语义

- `WINDOWS_PID_ENV_NAME = 'AIC_BACKEND_IDENTITY_PIDS_BASE64'`；`PROCESS_QUERY_TIMEOUT_MS = 0x1388`(5000)。
- `WINDOWS_PROCESS_QUERY_SCRIPT`：PowerShell 脚本，`[Environment]::GetEnvironmentVariable` 读入 pid 列表 + `Get-CimInstance Win32_Process` 取 `{pid, executablePath, commandLine}` 行，JSON → base64 输出。
- `isExpectedBackendProcess(processInfo, expectations)`：打包 win32 要求可执行路径**精确**匹配；打包非 win32 额外允许 `commandLine.includes(backendCommandPath)`；未打包且 `backendCommand` 为绝对路径时精确匹配，否则可执行文件基名须匹配 `/^python(?:3(?:\.\d+)?)?(?:\.exe)?$/`；最后要求归一后的 `<appRoot>/server.py` 出现在命令行里（回退正则 `/(?:^|[\s"'])server\.py(?:[\s"']|$)/i`），且命令行含 `--host=<host>` 与 `--port=<Number(port)>`。
- `inspectBackendProcesses({ pids, platform, env, spawnProcess = spawnSync })`：win32 走 PowerShell 脚本（非零 `status`/`error`/`signal`、base64/JSON 非法均抛错）；非 win32 逐 pid `ps -p <pid> -o comm= -o args=`，`status === 0x1` 视为已退出而跳过。
- `findVerifiedBackendProcessPids({ ... })`：归一/去重请求 pid，按「在请求集合内 **且** 通过身份判定」过滤。

## 3. 接线状态

`electron/main.js` 本批有 3 处改动（`git diff --numstat` = **+356 / −822**，含本批新增行与删除的旧内联块）：

| 环节 | 状态 |
| --- | --- |
| 5 个模块落地 | ✅ |
| `main.js` 新增 5 个 import（`resolveBackendLaunchSpec` / `findVerifiedBackendProcessPids` / `reclaimStartupPort` / `collectListeningPortPids`+`probeTcpPortAvailable` / `resolveWindowsSystemToolPath`） | ✅ main.js:21–25（`resolveWindowsSystemToolPath` 全文件**仅此一处** import，无重复） |
| **删除**旧内联 `collectListeningPortPids`（netstat/lsof 文本解析） | ✅ 全文 `netstat\|lsof` 命中 **0** |
| `clearPortBeforeStart` 改为委托 `reclaimStartupPort(...)` | ✅ main.js:518 |
| 新增 `resolveBackendLaunch()`（包装 `resolveBackendLaunchSpec`） | ✅ main.js:597；**唯一调用点** main.js:519（即 `clearPortBeforeStart` 内） |
| `clearPortBeforeStart` 消费方 | ✅ main.js:2406（`startApp`）、main.js:2552（退出后重启路径） |
| 生产 `import` 数 | 5（全部真实接线，无伪造消费方） |
| 后端 **spawn 站点** 改为 `resolveBackendLaunchSpec` | ❌ **本批有意未改**——见 §4/§5 |

**行为差异（必须记账）**：旧内联实现会**无条件**杀掉端口上的每个 LISTENING pid；新路径先做身份核验，核验不过则**拒绝终止**并抛 `AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED`（有 `delayFn` 时先给 2 000 ms 容忍窗口）。这与「禁止误杀」约束一致，但意味着**启动可能在旧版会「自愈」的场景下改为失败**，必须经真实运行验收。

**仍未接入**：`resolveBackendLaunchSpec` 目前只服务于 `clearPortBeforeStart` 的**监听者身份核验**（`backendCommand` 参数）；main.js:1683 的后端 spawn 仍是硬编码 `spawn(<resolvePythonCommand()>, ['server.py','--host='+HOST,'--port='+PORT], { cwd: APP_ROOT, ... })`，**未**改用 `resolveBackendLaunchSpec` 的 `kind/command/args/cwd`。即：已打包场景的「改用原生 `aicanvas-backend` 可执行文件」这一**行为变更被有意推迟**（属于打包产物形态变更，需单独授权与端到端计划）。

## 4. 本批已执行的离线验证

- `node --check` × **11**（5 源码 + 5 测试 + `main.js`）：全部退出 0。
- `prettier --check`（`deobf-tools/prettierrc.json`）：`main.js` 与 5 个源码文件**首跑即通过**；4 个测试文件首跑告警，`--write` 后复检 `All matched files use Prettier code style!`。
- `node --test electron/startupPortPolicy.test.js electron/startupPortInspector.test.js electron/startupPortRecovery.test.js electron/backendLaunchResolver.test.js electron/backendProcessIdentity.test.js` = **63/63/0**（7+15+18+4+19 = 63）。测试**未 spawn 任何真实进程、未联网、未杀任何真实 pid、未跑真实 Electron**：
  - `startupPortInspector.test.js` 的 `execFileSyncFn` / `createServerFn` 全为注入替身（含一个本地 `createServerStub({onListen, throwOnListen})`），未真的执行 `netstat`/`lsof`、未真的 bind 端口；
  - `backendProcessIdentity.test.js` 的 `spawnProcess` 全为替身，未真的跑 `powershell`/`ps`；
  - `startupPortRecovery.test.js` 的 collector/probe/identity/terminate 全为脚本化替身，`delayFn` 为记录器（断言 delay 序列 `[200]`/`[800]`/`[0]`），**未真的等待、未真的终止进程**；
  - `backendLaunchResolver.test.js` 的 `existsSync` 为替身；期望值全部经 `path.join` 生成以适配 win32 宿主（模块用**不带前缀**的 `path`）。
- `node --test --test-reporter=tap $(find electron -name '*.test.js')` = **1 484/1 483/1**（第72批 1 421/1 420/1，**净增 63 = 本批全部**）。唯一失败仍是既有 `fullProjectPackageService.test.js` 的 `missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第17批。
- 本批**未触碰** `api/`、`src/`、`preload`；`src/**` 沿用 1 566/1 523/43（43 项失败全归缺失夹具 `tests/testPreviewDom.js`，**不伪造**）。
- 忠实性 token 比对（`cmp-tokens.mjs`）：`startupPortPolicy` 263/263 matched 232、`startupPortInspector` 705/704 matched 613、`startupPortRecovery` 949/948 matched 810、`backendLaunchResolver` 170/170 matched 151、`backendProcessIdentity` 1259/1260 matched 1089——残差**全部**为 `_0x*`↔语义名的重命名对（含 prettier 补/删的括号与一个折行尾逗号），零逻辑分歧。
- 字面量比对（`litdiff2.mjs`，跳过注释与正则字面量）：五个模块 `onlyPort(0)=[]` / `onlyRepo(0)=[]` 全部**逐字一致**（含 PowerShell 脚本、netstat/lsof argv、错误文案、正则源码）。
- 工作树快照：`staged=0 modified=67 untracked=439 conflicts=0`（相对第74批落盘后 `0/67/428/0` **+11** = 本批 10 个新文件 + 第74批专题文档）。

## 5. 未执行的验收项（不得当作已完成）

以下全部**未运行**，需授权后核对：

- **端口回收的真实行为**：真实 `netstat -ano -p tcp` / `lsof` 输出在本机 Windows 下的解析命中率（本批只证明构造文本/替身）；真实端口被占用时容忍窗口 10 轮 / 2 000 ms 是否够用；`AIC_STARTUP_PORT_STILL_BUSY` 在真实 `timeout` 回收下的表现。
- **身份核验的真实行为**（**最关键**）：真实 `Get-CimInstance Win32_Process` 输出的 `ExecutablePath`/`CommandLine` 形状是否与期望一致（尤其**未打包 python 源码**场景下 `python.exe` 的绝对路径与 `server.py` 在命令行中的呈现）；`--host=`/`--port=` 是否恒出现在真实 spawn 的命令行；**误拒风险**——旧版能自愈、新版可能因核验不过而**启动失败**（见 §3 行为差异）。
- **`AICANVAS_TEST_FAIL_IF_PORT_BUSY` 逃生门**只被测试用到；真实环境**不设**该变量，故真实路径上「拒绝终止未核验监听者」这条分支**从未在生产环境跑过**。
- **非 win32 语义**（`lsof`/`ps -p ... -o comm= -o args=`）本批仅在 win32 宿主上经替身验证，未在 macOS/Linux 真机运行。
- **后端 spawn 站点切换**（`resolveBackendLaunchSpec` 的 `native-backend` 分支）：`runtime/backend/aicanvas-backend[.exe]` 在真实打包产物中是否存在、原生后端的 `--host/--port` 语义是否被接受、打包体积/体积门禁，**均未验证**——本批有意未改 spawn 站点。
- **启动时机的真实交互**：`clearPortBeforeStart` 在真实 `startApp` 流程中与 `loadStartupStatus` 提示（`kind:'loading'`）的先后与呈现；`onReclaim` 文案（`APP_DISPLAY_NAME + ' 正在启动'`）在真实渲染下的显示。
- 本批**未做**针对 `clearPortBeforeStart` 的静态接线断言（如第71批 `captureChainWiring.test.js` 之先例）；main.js 的改动仅经 `node --check` 与 `prettier --check`，**未经任何测试覆盖**。

## 6. 约束复核

- 未触碰 `api/freeImageHostApi.js`（工作树手写版），未做任何批量复制。
- 未 `git reset --hard` / `git clean` / 批量 checkout；未清理未跟踪文件。
- 未触碰 `D:\shuocancas`；端口源目录仅**只读**读取。
- 未改 `style.css`、未改授权检查、未新增 npm 依赖、未改 `src/i18n/messages/*`。
- 未把反混淆临时目录/绝对开发机路径写进运行时依赖。
- 未提交、未推送、未触发任何 release 工作流。
- 未在测试中 `taskkill` 任何真实 pid：新模块的终止动作**全部**为注入替身，且 `startupPortPolicy` 内置 `AICANVAS_TEST_FAIL_IF_PORT_BUSY` 逃生门。

## 7. 下一批建议

1. **（低风险、纯新增、无需额外授权）** 继续从第74批 `b74-scan.mjs` 判定的 **481 个「无级联」** 端口独有文件中取材，**必须先做依赖闭包检查**（吸取 `rendererPanPreviewReconcile.js` 因缺 3 个依赖而整组搁置的教训），优先挑选「零 import 或仅依赖已落地模块」的渲染器原语。
2. **（需真实运行授权）** 把 `main.js:1683` 的后端 spawn 站点切换到 `resolveBackendLaunchSpec`，并连同「已打包走原生 `aicanvas-backend`」一起做端到端验收计划（涉及打包产物形态、体积门禁、`runtime/` 打包）。
3. **（需真实运行授权）** 为 `clearPortBeforeStart` 补一条静态接线断言（仿 `captureChainWiring.test.js`），并核对 §5 列出的真实 `netstat`/`Get-CimInstance` 输出形状，重点排除「误拒导致启动失败」。
4. 第74批遗留的 `src/core/rendererPanPreviewReconcile.js`（11 189 B，需连同其 3 个缺失依赖整组移植）；R15 渲染器的「升代 + 接线」三步；`main.js` 的 chrome-shell 最终装配（13 个依赖模块已落地）。
