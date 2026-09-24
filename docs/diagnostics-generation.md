# 第79批：诊断世代升代（`diagnostics.js` 268→663 行 + 三个新依赖模块）

## 1. 本批要补的缺口

第78批 §8 把 `diagnosticsEvidence.js`(2 058 B) / `diagnosticsLaunchVersion.js`(1 307 B) 列为「消费方是在用的 `electron/diagnostics.js`（本仓 268 行 vs 端口 663 行），属**升代**且端口版还引用本仓不存在的 `src/utils/diagnosticError.js` ⇒ 须单独成批并先补依赖」。本批就是这一批：一次性补齐**诊断世代**的四个文件（1 个升代 + 3 个新依赖），使 `electron/` 顶层「仅端口存在」的剩余件由 10 降至 6。

本仓的 `electron/diagnostics.js` 是**旧世代**：只有 `launchSessionId` / `logDir` / `desktopLogPath` / `serverLogPath` / `ensureInitialFiles` / `logEvent` / `getSuggestedPackagePath` / `createPackage` 的最小实现，脱敏是扁平 key 名单，`createPackage` 只打 4 个文件（`metadata.json` + 两份日志 + `README.txt`），没有 `error-summary.json` / `package-manifest.json` / 事件序号 / incident 证据 / `launch-version.json` / 后端日志模式扫描。

端口源（`D:\shuocancas` 0.7.16 反混淆）把脱敏器、错误序列化器、启动版本标记、证据汇总拆成独立模块，并让 `diagnostics.js` 只做编排。本批按端口形状整体替换。

## 2. 交付物

| 文件 | 行数 / 字节 | 端口源 | 说明 |
| --- | --- | --- | --- |
| `electron/diagnostics.js` | **663 行 / 27 495 B**（旧 268 行 / 10 275 B） | 663 / 27 495 | **原地升代**，与端口**逐字节同尺寸**（字面量 diff 0/0、token diff 0/0）。导出 `sanitizeDiagnosticValue` / `buildDiagnosticLogEntry` / `createDiagnosticsManager` |
| `electron/diagnosticsEvidence.js` | 49 / 2 058 | 49 / 2 058 | **新建**，与端口字节一致（litdiff 0/0）。导出 `summarizeBackendLog` / `mergeDiagnosticEvidence` |
| `electron/diagnosticsLaunchVersion.js` | 31 / 1 307 | 31 / 1 307 | **新建**，与端口字节一致。导出 `recordDiagnosticsLaunchVersion` |
| `src/utils/diagnosticError.js` | 39 / 1 703 | 1 行 / 1 463 | **新建**，导出 `serializeDiagnosticError`。与端口仅差 Prettier 行为（见 §4） |
| `electron/diagnostics.test.js` | 816 / 31 190 | — | **29 项离线测试，29/29 首跑全绿** |
| `electron/diagnosticsEvidence.test.js` | 143 / 5 308 | — | **11 项，11/11 全绿** |
| `electron/diagnosticsLaunchVersion.test.js` | 176 / 6 081 | — | **10 项，10/10 全绿** |
| `src/utils/diagnosticError.test.js` | 87 / 3 505 | — | **7 项，7/7 全绿** |

合计 **57 项新测试**（electron 50 + src 7），全部为 `node:test` + `node:assert/strict`，无需 Electron、无需联网。

### 语义要点

- **`createDiagnosticsManager(options)`** 返回 `{launchSessionId, logDir, diagnosticsDir, desktopLogPath, serverLogPath, ensureInitialFiles, logEvent, getSuggestedPackagePath, createPackage}` —— 是旧世代返回面的**严格超集**（旧面 8 个键全在其中），因此 `electron/diagnosticsCapabilityOperations.js`、`electron/ipc/diagnosticsIpc.js`、`main.js` 的四个调用点**无需改动**（详见 §3）。
- **`sanitizeDiagnosticValue(value, {depth, key, maxDepth})`**：`maxDepth` 夹到 `5..12`；按 key 限长（`stack` → `0x2710`，其余 → `0x7d0`）；数组 ≤ 30 项（超出写 `'[truncated N items]'`）；对象 ≤ 80 键（超出写 `__truncatedKeys`）；安全名单含 `launchSessionId` / `launchSessionIds`（会话号原样保留）；`truncateString` 的截断后缀**带计数**：`'... [truncated N chars]'`。
- **`logEvent`**：每条追加 `launchSessionId` + 自增 `eventSeq`；`warn`/`error` 级写入 `incidents.log.jsonl`（含 `{event, precedingEvents}` —— 前 8 条）；对三类启动失败事件在 context 内注入 `launchVersion`。
- **`ensureInitialFiles`**：写 `launch-version.json`（经 `recordDiagnosticsLaunchVersion`）；记 `app.session_started`（context `{pid, packaged, launchVersion}`）；**仅注册一次** `app.once('before-quit')` 记 `app.session_ended`。
- **`createPackage`**：拒绝**相对** `outputPath`（`'Diagnostics output path must be absolute'`）；读轮转/现行/后端/incident 四类日志；产出 `metadata.json` + `error-summary.json`（schemaVersion **2**）+ `package-manifest.json`（schemaVersion **1**，`files[]` 每项含 `kind`/`included`/`sourceBytes`/`includedBytes`/`truncated`/`readFailed`/`redacted`，另有 `limits`/`privacy`）+ 可选 `ai-diagnostics-report.json` + `README.txt`；记 `diagnostics.package_created` / `diagnostics.package_failed`。
- **`diagnosticsEvidence`**：`summarizeBackendLog(text)` 用单条复合正则（`[ERROR]`/`ERROR:`/`Traceback`/`XxxError:`/`spawn error:`/`exited code=<非0>`）扫描后端日志，产出 `{detection:'text-patterns', matchedLineCount, recentFindings[≤30]{line, excerpt≤0x708}, notes[2]}`；`mergeDiagnosticEvidence(primary, incidents)` **两参都必填**（无默认值），按 `${launchSessionId}:${eventSeq}` 去重、否则按 `JSON.stringify`，最后按 `ts` 再按 `eventSeq` 排序。
- **`diagnosticsLaunchVersion`**：`recordDiagnosticsLaunchVersion({logDir, app})` → `{currentVersion, previousVersion, versionChanged, markerSaved}`，标记文件用**临时文件 + rename** 写；版本号只接受 `^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$` 且长度 ≤ `0x64`（⇒ `1.2.3-rc.1+build.7` 这种「双后缀」被**拒绝**）；`path['join']` 在内部 try **之外**求值，故缺 `logDir` 会抛出 `TypeError`。
- **`diagnosticError`**：`serializeDiagnosticError(error)` 递归序列化（`MAX_ERROR_CHAIN_LENGTH = 0x4`，第 4 层起写 `'[MaxDepth]'`；环引用写 `'[Circular]'`，用 Set 在进出对象时增删）；`MAX_ERROR_MESSAGE_LENGTH = 0x7d0`、`MAX_ERROR_STACK_LENGTH = 0x2710`；`ERROR_METADATA_KEYS = ['type','provider','code','status','retryable']`；`boundedText` 的截断后缀为**固定** `'... [truncated]'`（**无计数**，与本批 `diagnostics.js` 内的 `truncateString` 不同 —— 两处后缀本就不同源）。

## 3. 接线状态

**`electron/main.js` 本批未改动**（`git diff electron/main.js` 在本批为零新增）。

原因：`createDiagnosticsManager` 的返回面是旧面的严格超集，现有的四个调用点与两个中间层消费方全部按原来的键名取用：

- `main.js:195` 构造 manager（`app` / `logDir` / `diagnosticsDir` / `serverLogPath` / `getMetadata`）；
- `main.js:242/244` 调 `ensureInitialFiles()`；
- `main.js:672` 调 `logEvent(...)`；
- `electron/diagnosticsCapabilityOperations.js`（只消费 `createPackage` / `getSuggestedPackagePath`）；
- `electron/ipc/diagnosticsIpc.js`（经上者暴露 IPC）。

**刻意未移植的一处端口差异**：端口的 `getMetadata` 额外返回 `outboundTls`，取自 `requestLocalJson('/api/v2/runtime/info')`；本仓**没有**该路由，若为「接上」而就地补一个路由/假消费方，就违反了「宁可留白并记账，也不为了「有引用」而擅自接线」。故 `outboundTls` 留在端口、本仓不引入，记为欠项（§6）。

## 4. 行为差异（必须记账，均未真机验证）

1. **脱敏范围显著扩大**：旧世代是扁平 key 名单，新世代递归（对象/数组/字符串三路），并新增 `Bearer` / `token=` / `sk-` 等**值内模式**脱敏与 `%USERPROFILE%` 归一。⇒ 旧包可能原样带出的敏感串，新包会被替换为 `[REDACTED]`。
2. **`truncateString` 后缀带计数**（`'... [truncated N chars]'`），而 `diagnosticError.js` 的 `boundedText` 后缀不带 —— 同一份包里两种后缀并存，属端口原样。
3. **`SENSITIVE_QUERY_RE` 的已知人工痕迹**：对 `'a?token=abc&b=1'`，先由 query 规则插入 `[REDACTED]`，再由赋值规则匹配时值类 `[^\s,;\]}]+` 停在 `]` 前，结果留下一个多余的 `]`：`'a?token=[REDACTED]]&b=1'`。这是端口的既有形状（本批未修），已写成专测并在 §6 记账。
4. **计数器键会被脱敏**：`problemTypeCounts` 的键名含 `session` 时（如 `app.session_ended`），其**计数值**会被 key 脱敏成 `'[REDACTED]'`。同样是端口既有行为，已写成专测。
5. **`package-manifest.json` 的 `files[]` 恒含两份 incident 描述符**（`incidents.log.jsonl` 与其轮转件），即使文件不存在也保留条目（`included:false`）⇒ 条目数固定为 **8**。
6. **`createPackage` 新增绝对路径校验**：旧世代对相对 `outputPath` 会静默按相对路径写；新世代直接失败。
7. **版本号校验更严**：`1.2.3-rc.1+build.7` 之类「预发布 + 构建」双后缀被拒（旧世代无校验）。
8. **`src/utils/diagnosticError.js` 与端口的唯一字面量差异**：Prettier 把端口的 `'name':` / `'message':` / `'stack':` 引号属性名去引号并补尾逗号（`litdiff2` 报 `onlyPort(3)` / `onlyRepo(3)` 恰为这三个字面量），语义零差异。

## 5. 本批已执行的离线验证

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check`（4 个模块文件） | exit 0 |
| 格式 | `prettier --config deobf-tools/prettierrc.json --check`（8 件） | 全过 |
| 新模块单测 | `node --test`（4 个新测试文件） | **57/57 全绿**（29 + 11 + 10 + 7） |
| `electron/**` 全量 | `node --test --test-timeout=25000 --test-reporter=tap $(find electron -name '*.test.js')` | **1620 / 1619 通过 / 1 失败**（第78批基线 1570/1569/1，**恰好 +50** = 本批 electron 新测 50） |
| `src/**` 全量 | 同式（`find src -name '*.test.js'`） | **1573 / 1530 / 43**（第78批 1566/1523/43，**+7** = 本批 src 新测 7；43 项失败全部归属缺失夹具 `tests/testPreviewDom.js`，**不伪造**该夹具） |
| `api/**` 全量 | 同式 | **463 / 463 / 0**（**注**：台账旧记 457 已陈旧，本批未触碰任何 `api/` 文件，+6 不归属本批） |
| 令牌保真 | `cmp-tokens.mjs`（`diagnostics.js`） | port 0 / repo 0 差异（同名同形） |
| 字面量保真 | `litdiff2.mjs` | `diagnostics.js` / `diagnosticsEvidence.js` / `diagnosticsLaunchVersion.js` → `onlyPort=[] onlyRepo=[]`（**逐字节一致**）；`diagnosticError.js` → `onlyPort(3)=[name,message,stack]` `onlyRepo(3)=[同名]`（仅引号属性名，见 §4.8） |
| 工作区快照 | `git status` 计数 | `staged=0 modified=67 untracked=460 conflicts=0`（第78批 `0/67/453/0`，**+7** = 本批 4 测试 + 3 新源码；被跟踪修改集仍为 67，`diagnostics.js` 本就在其中） |
| 保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` **未变** |

唯一失败用例仍是长期已知项：`fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（第 14 批起登记的永久失败，与本批无关）。

`diagnostics.test.js` 内自带**零依赖 zip 中央目录解析器**（读 `PK\x01\x02`，按 method/sizes/name/localOffset 取条目，method 8 用 `inflateRawSync`），因此打包产物（`metadata.json` / `error-summary.json` / `package-manifest.json` / 已脱敏的 `desktop.log.jsonl` 与 `server.log` / `README.txt`）与 8 条 manifest 记录都是**真读真断言**，非 mock。

## 6. 未执行的验收项（不得当已通过）

- 真实 Electron 启动、真实 `app.once('before-quit')` 触发、真实 `app.getVersion()` 取版本、真实 `app.getPath('downloads')` 取保存目录。
- 真实崩溃/未捕获异常流程下 incident 证据（前 8 条）与 `launch-version.json` 的实际落盘与跨版本比较。
- `outboundTls` 未移植（本仓无 `/api/v2/runtime/info`），功能上比端口少一项诊断元数据。
- §4.3 的多余 `]` 与 §4.4 的计数键脱敏在真实报告中的可读性影响。
- 真实用户拿到诊断包后按 `README.txt` 走的取数流程；真实 `diagnosticsIpc` 端到端（未做 IPC 层断测）。
- 本批**未**为 `main.js` 的四个调用点补接线静态断言测试。

## 7. 约束复核

- `api/freeImageHostApi.js` 未触碰（md5 复核，同上）。
- 未提交、未推送、未触发任何 CI/发布；未运行真实服务/未产生费用；未跑 Electron、未起服务、未打开窗口。
- 未改 `main.js`、未删除仍被消费的既有导出、未伪造消费方、未改 `src/i18n/messages/*`、未新增 npm 依赖、未把反混淆临时目录或本机绝对路径写成运行时依赖。
- 未 `git reset --hard` / `git clean` / 批量 checkout / 目录覆盖；未清理任何未跟踪文件。
- 回滚点：`C:\Users\luobote\.qoder\tmp\deobf-tools\diagnostics.before-b79.js`（升代前 268 行 / 10 275 B 全文备份）。

## 8. 下一批建议

- **A（低风险、纯新增）**：`electron/nativeContextMenuIcons.js`（2 058 B）—— 依赖本仓**已存在**的 `src/utils/contextMenuIconCatalog.js`，但消费方需先确认：若 `electron/webPreviewViewManager.js` 的菜单今天是无图标的，则本件属**新能力接线**（须同时改消费方），否则按「宁可留白并记账」落地不接线。
- **A**：`electron/dialogPresenter.js`(331 B) + `dialogPresenterCore.js`(3 667 B) —— 本仓近乎零消费方，落地后**不接线**并记账。
- **B（需真实运行授权）**：按 §6 逐项验收本批 + 第75–78批遗留差异。
- **C（需真实运行授权）**：第75批遗留后端 spawn 站点切换到 `resolveBackendLaunchSpec`；`main.js` 的 chrome-shell 最终装配（13 个依赖模块已落地，装配后 win32/darwin 默认走 chrome-shell，且本仓 CI 会构建 mac arm64 并 `gh release upload`）⇒ 须单独端到端方案与授权。
- **仍欠（不变）**：`src/core/rendererPanPreviewReconcile.js`（11 189 B，须与其 3 个缺失依赖成组移植）；第74批 `b74-scan.mjs` 判定的 481 条「无级联」渲染器池；`web-preview/*` 5 条路由的渲染器侧消费点；`storage-migration/prepare`；`styles/variables.css` 中 44 个未映射 CSS 自定义属性；R15 渲染器「升代 + 接线」。
