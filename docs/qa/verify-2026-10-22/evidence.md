# 实跑取证记录（阶段 B）

- 日期：2026-10-22（本机时区）
- 仓库：`F:\CanvasPro`，HEAD `df1811a5`（`feat(brand): 换牌为「一帧 OneFrame」`），版本 `0.4.12`
- Shell：Git Bash；Node：`22.22.2`（`C:\Users\luobote\.workbuddy\binaries\node\versions\22.22.2-6\node`，ABI 127）；系统另装 `C:\Program Files\nodejs\node` = `v24.14.0`（ABI 137）
- Python：`venv\Scripts\python.exe`
- 约束遵守：**未启动 Electron/GUI，未执行 `npm run build:win`，未安装任何依赖，未做 git 写操作**。唯一写盘位置 = `docs/qa/verify-2026-10-22/`、`test-artifacts/`（跑测框架自建）、系统临时目录。

---

## E1 反混淆门禁 `node tools/deobf-gate.mjs`

命令：

```bash
cd /f/CanvasPro && node tools/deobf-gate.mjs; echo "EXIT=$?"
```

关键输出尾部 / 退出码：

```
  vendor excluded : yes (upstream)
  agent scratch   : .kilo  (older worktrees, not source)
  deobf tooling   : 16 file(s) contain the patterns they detect

PASS  no obfuscation signals in code positions
EXIT=0
```

结论：**PASS**（exit 0）。

---

## E2 CSP 静态门禁 `node tools/check-csp.mjs`

```
PASS  CSP 静态门禁：script-src 严格（无 'unsafe-inline'），connect-src 放行 data:/blob:，
index.html 无内联脚本/事件处理器/javascript:，源码无 eval/new Function，
内联处理器哈希匹配（sha256-2rvfFrggTCtyF5WOiTri1gDS8Boibj4Njn0e+VCBmDI=）；
覆盖窗口（screenshotOverlay / globalCaptureWindow）均无内联脚本且 script-src 严格。
EXIT=0
```

结论：**PASS**（exit 0）。

---

## E3 其余静态门禁（逐个记录退出码）

| 门禁 | 命令 | 输出尾部 | 退出码 | 结论 |
| --- | --- | --- | --- | --- |
| reachability | `node tools/check-reachability.mjs` | `reachability OK: scope 2074, reachable 1903, orphans 171` | 0 | PASS |
| innerHTML | `node tools/check-innerhtml.mjs` | `innerHTML OK: 346 writes (baseline 346)` | 0 | PASS |
| CSS budget | `node tools/check-css-budget.mjs` | `CSS budget OK: style.css 26765 lines (budget 26765)` | 0 | PASS |
| migrations | `node tools/check-migrations.mjs` | `ERR_DLOPEN_FAILED`（见 E15） | **1** | 见 E15 |

---

## E4 后端全量 `node tools/run-backend-tests.mjs`

命令：

```bash
cd /f/CanvasPro && node tools/run-backend-tests.mjs > /tmp/qa-backend.log 2>&1; echo "EXIT=$?"
```

输出尾部：

```
Ran 223 tests in 12.467s

FAILED (failures=3)
EXIT=1
```

3 个失败用例（完整名）：

```
FAIL: backend.services.test_audit_security.FileBoundaryTests.test_symlink_cannot_escape_root
  File "backend/services/test_audit_security.py", line 111, in test_symlink_cannot_escape_root
    with self.assertRaises(ValueError):
AssertionError: ValueError not raised

FAIL: backend.services.test_audit_security.StaticAccessTests.test_static_symlink_does_not_expose_outside_file
  File "backend/services/test_audit_security.py", line 159
    self.assertIsNone(self.resolve('/assets/link.png'))
AssertionError: ('C:\\Users\\...\\aic-security-test-vewnel9b\\assets\\link.png', False) is not None

FAIL: backend.services.test_file_save_migration.FileSaveMigrationTests.test_source_symlink_rejected_when_supported
  File "backend/services/test_file_save_migration.py", line 96
    with self.assertRaises(ValueError):
AssertionError: ValueError not raised
```

**环境根因取证**（不是猜的）：本机 Windows 无法创建真实符号链接，且行为不一致：

```
$ venv/Scripts/python.exe -B -c "… (inside/'link.json').symlink_to(outside) …"
created ok
exists False is_symlink False size n/a          ← 静默"成功"但链接根本不存在

$ venv/Scripts/python.exe -c "… os.symlink(target, link) …"
symlink failed: [WinError 2] 系统找不到指定的文件。: 'C:\\Users\\...\\Temp\\tmp7ekg32lp\\link.txt'
```

即：`symlink_to()` 有时抛 `OSError`（用例会 `skipTest`），有时**不抛但也没创建链接**（用例前提被破坏 → 断言 `ValueError not raised`）。三个失败用例都依赖「先造一个真实软链，再断言安全函数拒绝它」，因此在本机**无法成立**，与本仓业务代码无关。

结论（**修复前基线**）：223 例，**220 pass / 3 fail（环境限制，非缺陷）**。
> 这 3 例已在收尾阶段改为 `skipTest`，复跑结果为 `OK (skipped=3)`（220 通过 / 0 失败 / 3 跳过），见本文件 **E22**。本段保留为改动前原始输出。

---

## E5 全量 JS `node tools/run-full-tests.mjs --js-only`（**首轮 / 修复前**基线）

> 本节是修复前的 11319 基线，用于与换牌记录 `docs/rebrand-oneframe.md` §6 对账。
> **修复后终态为 11339/11339**，见 **E23.4**（同一命令、同一机器，增量 +20 的分解见 E23.5）。

命令（后台执行，日志 `/tmp/qa-full-js.log`）：

```bash
cd /f/CanvasPro && node tools/run-full-tests.mjs --js-only
```

从框架自己写出的 `test-artifacts/full-review/run-H1hjeF/summary.json` 读取真实数字：

```
startedAt : 2026-10-22T05:36:24.827Z
finishedAt: 2026-10-22T05:41:25.662Z
counts    : {"tests":11319,"pass":11319,"fail":0,"skipped":0,"cancelled":0}
batches   : 20，全部 exitCode=0
manifest  : 1181 个用例文件（js 1161 + py 20）
batches 用时合计 ≈ 218 s
```

脚本尾部输出（从 summary 复算，`success` 字段）：

```
{"type":"complete","success":true,"counts":{...11319/11319...},"failed":0}
```

结论：**11319 / 11319 通过 / 0 失败**，与换牌记录 `docs/rebrand-oneframe.md` §6 的基线完全一致。单批最大 60 文件、`--test-concurrency=2`、`--test-timeout=30000`，全程在 `mkdtemp` 隔离副本 + `tools/offline-unit-guard.cjs` 下运行（真实网络被禁）。

---

## E6 分域实跑（覆盖率与模块级结论的证据）

用本轮新增的 `docs/qa/verify-2026-10-22/per-domain.mjs`（复用 `tools/test-runtime.mjs` 的 `createTestEnvironment()`，带 `offline-unit-guard`，沙箱 = `mkdtemp`，端口 18784 与全量跑的 18783 错开），按 80 文件/批调用 `node --test`：

```bash
for d in src/config src/i18n src/utils src/domain src/services src/core tools \
         api electron src/manifests src/components src/modules; do
  node docs/qa/verify-2026-10-22/per-domain.mjs "$d"
done
# vendor 单独一轮（原因见 E7）
node docs/qa/verify-2026-10-22/per-domain.mjs vendor
```

| 域 | 用例文件数 | tests | pass | fail | 用时 |
| --- | --- | --- | --- | --- | --- |
| `src/modules` | 568 | 6685 | 6685 | 0 | 129.8 s |
| `electron` | 130 | 1707 | 1707 | 0 | ≈ 84 s |
| `api` | 159 | 1086 | 1086 | 0 | ≈ 57 s |
| `src/components` | 115 | 854 | 854 | 0 | 36.0 s |
| `src/services` | 43 | 369 | 369 | 0 | ≈ 18 s |
| `src/core` | 63 | 287 | 287 | 0 | ≈ 21 s |
| `src/domain` | 33 | 138 | 138 | 0 | 4.8 s |
| `src/utils` | 16 | 91 | 91 | 0 | ≈ 5 s |
| `src/manifests` | 25 | 59 | 59 | 0 | 2.7 s |
| `tools` | 4 | 36 | 36 | 0 | ≈ 2 s |
| `src/i18n` | 1 | 6 | 6 | 0 | ≈ 1 s |
| `src/config` | 1 | 1 | 1 | 0 | ≈ 1 s |
| **小计（不含 `vendor`，`npm run test:js` 覆盖范围）** | **1158** | **11319** | **11319** | **0** | — |
| `vendor`（不在任何跑测入口内） | 3 | 4 | 4 | 0 | 0.9 s |
| **合计（计入 `vendor`）** | **1161** | **11323** | **11323** | **0** | — |

交叉校验（两个总数各有所指，勿混）：

- **11319**（不含 vendor）= 12 个域相加，与 E5 全量跑 `run-full-tests.mjs --js-only` 的 **11319 逐位一致** → 分域结果与全量结果同口径、可互相印证。
- **11323**（计入 vendor 4 例）= 仓库里全部 JS 用例总数；**首轮** vendor 不在 `test:js` glob、也不在 `run-full-tests.mjs` 的 `inventory()` 目录清单内（见 E7），故当时必须单独跑。
- 再加当时新写的 3 条换牌边界用例 = **11326**（首轮 JS 口径）。

> 本节是**修复前的首轮**分域快照。此后做了三件事，数字已推进到终态：
> ① `vendor` 被纳入 `test:js` glob 与 `run-full-tests.mjs` 的 inventory（E7 的问题已修）；
> ② 换牌补充用例移入 `electron/`，被主入口收集；
> ③ 修 hover 缺陷时新增 13 例回归。
> 因此**终态 JS 全量 = 11339**（`11319 + 20`），明细见 **E23.5**；逐域数字未再重新拆分，命令见本节开头。

---

## E7 覆盖缺口发现：`vendor/*.test.js` 不在任何跑测入口内

- `package.json` 的 `test:js` glob 只有 `src/**`、`electron/**`、`api/**`、`tools/**`。
- `tools/run-full-tests.mjs` 第 45 行只对 `['src','api','electron','backend','tools','e2e','tests','test']` 做 `inventory()`，**`vendor` 不在列表内**（虽然第 19 行 `copiedRoots` 把 `vendor` 复制进了隔离副本）。
- 结果：3 个 vendor 测试文件（`vendor/*.test.js`，4 个用例）**平时不会被跑到**。本轮单独实跑：`4 / 4 pass`。

结论：用例本身健康，但**入口缺失**，属于测试工程问题（不阻塞发布，建议补进 `test:js` glob）。

---

## E8/E9/E10–E14 域明细日志

诚实说明：每个域的完整 TAP 原文写在跑测时的临时沙箱里（`mkdtemp`，结束即删，避免在仓库里堆大文件）；
仓库内 `docs/qa/verify-2026-10-22/.domain-logs/` 只保留**每域的运行标记**（域→文件数/批次数），
可复现的命令与脚本是 `per-domain.mjs` + 上面的 `for` 循环。固化的关键数字见 E6 表格与本文件各处引用
（原始 JSON 汇总在会话临时日志 `/tmp/qa-domains.log`，不随仓库交付）。

每个域的失败明细机制：`per-domain.mjs` 按批收集 TAP 汇总行（`# tests` / `# pass` / `# fail`）并累加，
若某批退出码非 0 会**逐文件单独重跑该批**，把真正失败的文件写进输出 JSON 的 `failingFiles`。
本轮 13 个域汇总的 `# fail` 均为 0、`failingFiles` 均为空，因此「零失败」不是批次级掩盖的结果
（`# tests` 总和 11323 与全量跑的 11319 + vendor 4 逐位对齐，也交叉印证了没有漏跑）。
（原始 JSON 汇总在会话临时日志 `/tmp/qa-domains.log`，不随仓库交付；关键数字已固化在 E6 表格。）

---

## E15 数据库迁移门禁（发现 Node ABI 不匹配）

第一次（PATH 里的 Node 22.22.2 = ABI 127）：

```bash
$ node tools/check-migrations.mjs
Acquire connection error: Error: The module '\\?\F:\CanvasPro\node_modules\better-sqlite3\build\Release\better_sqlite3.node'
was compiled against a different Node.js version using NODE_MODULE_VERSION 137.
This version of Node.js requires NODE_MODULE_VERSION 127.
  code: 'ERR_DLOPEN_FAILED'
EXIT=1
```

第二次（系统 Node 24.14.0 = ABI 137）：

```bash
$ "/c/Program Files/nodejs/node" tools/check-migrations.mjs
{"success":true,"domainTables":17,"migrationApplied":["001_short_drama_core.cjs"],"rerunPreservesRows":true}
EXIT=0
```

结论：门禁本身 **PASS**，但**依赖 `node_modules` 里预编译的 `better-sqlite3`（ABI 137 / Node 24）**；
用 Node 22 跑会 `ERR_DLOPEN_FAILED`。这是环境事实（不是代码缺陷），已记入报告「环境要求」。
`check-migrations` 不在 `npm test` 主链里（`test` = `check:obfuscation && test:js && check:csp && test:backend`）。

---

## E16 未执行：`node tools/check-package.mjs`

**未执行，原因：属于构建动作**。脚本第 21–22 行直接调用 `electron-builder --dir --win --x64`（解包目录构建）并做打包内 Python 冒烟，
与本次任务的硬性约束「禁止构建」冲突，且 `electron-builder` 首次使用可能下载 `winCodeSign` 等组件（需网络）。
替代覆盖：打包产物的**文件白名单/用户数据保留**语义由 `electron/installerSafety.test.js` 用真实 PowerShell 跑
`build/uninstall-program-files.ps1` 覆盖（E8 中全绿）；`appId/productName/artifactName` 由 C5 静态核对覆盖。

---

## E17 后端代码级补充核对（Python 目录回退）

见 `matrix.md` C4；另外 `backend/test_shortdrama_schema.py` 在 E4 中通过（17 张 `o_*` 表、重跑不丢行），
与 E15 的 `domainTables:17 / rerunPreservesRows:true` 互相印证。

---

## E18 换牌专项：`brandDataMigration` 全量 + 本轮补充边界用例

原有 6 例（已含在 E8 的 electron 域 1707 例内）：

```bash
$ AIC_TEST_SANDBOX_ROOT="$(mktemp -d)" node --require "F:/CanvasPro/tools/offline-unit-guard.cjs" \
    --test --test-reporter=tap electron/brandDataMigration.test.js
# tests 6 / pass 6 / fail 0
```

本轮新增 3 例（覆盖原测试的两个空白分支 + 一个异常分支）：

```bash
$ AIC_TEST_SANDBOX_ROOT="$(mktemp -d)" node --require "F:/CanvasPro/tools/offline-unit-guard.cjs" \
    --test --test-reporter=tap electron/brandDataMigration.extra.test.js
ok 1 - 边界：新目录存在但为空时仍然执行迁移
ok 2 - 边界：单文件复制失败不中断，其余文件仍然迁移并计入 failedFiles
ok 3 - 异常：appDataDir 不存在时返回 no-legacy-data 而不是抛异常
# tests 3 / pass 3 / fail 0
EXIT=0
```

结论：迁移的**全部 9 条分支**均有实跑证据；`docs/rebrand-oneframe.md` §4 的 6 条策略逐条可验证。

---

## E19 保留项静态核对命令

```bash
grep -rn "luseaer-ship-it/CanvasPro" api/            # → api/tutorialReleaseNotesApi.js:1,2 仍为旧仓库地址
grep -rln "ashuoai.com" src/ api/ electron/ backend/ # → legacyInitialState.js / appPanels.js / subscriptionAccess.js / tutorialCatalog.js
grep -rn "SHUO-Canvas" api/                          # → api/objectStorageProfiles.js:1 OBJECT_STORAGE_KEY_PREFIX = 'SHUO-Canvas'
grep -n "SERVER_ID_VALUE\|X-AICanvas-Server" electron/main.js server.py
#   electron/main.js:166  SERVER_ID_VALUE = 'Canvas'
#   server.py:2847        self.send_header("X-AICanvas-Server", "Canvas")
grep -n "namespace ShuoCanvas" electron/             # → windowsTaskbarIdentity.js:104 仍为 namespace ShuoCanvas + ShuoCanvasCallWndProcHookProc
grep -n "ASHUO_PRESET" src/modules/shortcuts.js      # → ASHUO_PRESET_NAME='一帧预设' / LEGACY_ASHUO_PRESET_NAMES=new Set(['阿硕预设'])
```

`build/uninstall-program-files.ps1:24` 白名单正则同时包含新旧品牌：
`(?:user|user-data|data|output|projects|OneFrame Project|OneFrame Files|Canvas Project|Canvas Files|AI CanvasPro Files)`。

---

## E20 Web 集成（Playwright，非 Electron）

```bash
$ npx playwright test e2e/smoke.spec.js e2e/http-security.spec.js \
    e2e/node-parameters.spec.js e2e/workspace.spec.js
Running 9 tests using 1 worker

  ok 1 e2e\http-security.spec.js:3:1 › live server requires a local token for shortdrama and config APIs (192ms)
  ok 2 e2e\http-security.spec.js:18:1 › static allowlist blocks repository internals, private files and listings… (184ms)
  ok 3 e2e\http-security.spec.js:30:1 › live JSON file routes reject encoded path escapes without breaking normal saves (62ms)
  ok 4 e2e\http-security.spec.js:43:1 › private mapped media works with a token, but not without one, for GET and HEAD (72ms)
  x  5 e2e\node-parameters.spec.js:2:1 › real video node lazily opens grouped model menus and keeps advanced controls across updates (26.7s)
  ok 6 e2e\smoke.spec.js:6:1 › the canvas shell boots without renderer errors (17.3s)
  ok 7–9 …（workspace.spec.js，全绿）

  1 failed
    e2e\node-parameters.spec.js:2:1 …
  8 passed (1.7m)
```

失败断言原文：

```
    - Expected  - 1
    + Received  + 4
    - Array []
    + Array [
    +   "this.activatePreviewHoverPlayback is not a function",
    +   "this._deactivatePreviewHoverPlayback is not a function",
    + ]
    > 35 |   expect(errors).toEqual([]);
    at F:\CanvasPro\e2e\node-parameters.spec.js:35:18
```

**缺陷定位（静态取证）**：

```bash
$ grep -rn "activatePreviewHover" --include=*.js . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=dist-win
./src/components/AIGenVideoNode.js:395:      this.activatePreviewHoverPlayback();
./src/components/AIGenVideoNode.js:403:        this._deactivatePreviewHoverPlayback();
```

- 全仓**只有调用点、没有任何定义**（`grep` 无 `activatePreviewHoverPlayback()` 方法体）。
- 同类能力真实存在的名字是 `src/components/source-video/sourceVideoHoverPlayback.js` 的
  `deactivateSourceVideoHoverPlayback()`，以及 `SourceVideoNode.js` 的 `['_activateHoverPlayback']()` / `['_deactivateHoverPlayback']()`；
  `AIGenVideoNode.js` 里两者都没有，也没有从 `video-node/*` 模块注入（`previewControlsModule.js` 只提供
  `_ensurePreviewVideoOverlays`、`_toggleVideoPlayPause` 等，无 Hover 播放方法）。
- 触发条件：视频节点预览区 `mouseenter` / `mouseleave`（`AIGenVideoNode.js:394-404`）。
- 引入时间（只读 `git log -S`）：`91d76472 port(b164): restore fail-closed recovery guards; unescape newly landed files`，
  **早于本次换牌提交 `df1811a5`**，属于**既有缺陷**，不是换牌引入。

结论：**真实运行时缺陷（P1）**，单元测试因只渲染 DOM、不模拟 hover 事件而漏掉；集成层抓到了。

---

## E21 运行时版本口径与「第二种口径」对账（主理人独立复跑）

主理人（齐活林）用另一种口径独立复跑了 6 个门禁，用于对账。**逐项完全一致，无差异**：

| 门禁 | 我的实跑（本文件 E1–E3/E15） | 主理人独立复跑 | 是否一致 |
| --- | --- | --- | --- |
| `deobf-gate` | exit 0，`PASS no obfuscation signals in code positions` | exit 0，同文案 | ✅ 一致 |
| `check-csp` | exit 0，`PASS`（含 sha256 哈希） | exit 0，`PASS` | ✅ 一致 |
| `check-reachability` | exit 0，`scope 2074, reachable 1903, orphans 171` | exit 0，同三数字 | ✅ 一致 |
| `check-innerhtml` | exit 0，`346 writes (baseline 346)` | exit 0，同数字 | ✅ 一致 |
| `check-css-budget` | exit 0，`style.css 26765 lines (budget 26765)` | exit 0，同数字 | ✅ 一致 |
| `check-migrations`（Node 22.22.2） | **exit 1**，`ERR_DLOPEN_FAILED`（ABI 137 vs 127） | 同为 exit 1、同报错 | ✅ 一致 |
| `check-migrations`（Node 24.14.0） | exit 0，`{"success":true,"domainTables":17,"migrationApplied":["001_short_drama_core.cjs"],"rerunPreservesRows":true}` | exit 0，同 JSON | ✅ 一致 |

### E21.1 ABI 问题的定性（并入报告口径：环境问题，不是缺陷）

`node_modules/better-sqlite3` 的原生模块按 **Node 24（`NODE_MODULE_VERSION 137`）** 编译；
默认 PATH 的 `node` 是 **22.22.2（需要 127）**，因此任何加载它的一方都会 `ERR_DLOPEN_FAILED`。
这是**工具链 ABI 不匹配**，与仓库代码无关。涉及方只有门禁脚本（`tools/check-migrations.mjs` 走 knex 的 `better-sqlite3` client），
以及 `npm run migrate` / `migrate:rollback`。

### E21.2 该问题**不影响**本轮 11319 条单元用例（已取证）

```bash
$ grep -rln "better-sqlite3" --include=*.test.js src/ api/ electron/ tools/ vendor/
（无输出）
$ grep -rln "from 'knex'\|require('knex')" --include=*.test.js src/ api/ electron/ tools/
（无输出）
```

即**单元测试层没有任何文件直接依赖 `better-sqlite3` / `knex`**，所以：
- E5/E6 的 11319 + 4 条用例在 Node 22.22.2 下跑出的结果**有效，无需改用 Node 24 复跑**；
- 唯一需要 Node 24 的是那两个门禁脚本（`check-migrations`、`check-package`）；
- 后端 223 例是 Python `unittest`（`sqlite3` 走 Python 3.12 标准库），与 Node ABI 无关。

### E21.3 `rerunPreservesRows:true` 已完成一条边界用例

`check-migrations` 的 `rerunPreservesRows:true` 本身就是「迁移可重复执行、重跑不丢行」的边界证据，
已登记在 `matrix.md` **D16-6**（门禁层）与 **D6-4**（短剧库表结构层），与 `backend/test_shortdrama_schema.py` 的
17 张 `o_*` 表断言互相印证。

### E21.4 运行时版本要求（建议写进文档）

| 用途 | 运行时 |
| --- | --- |
| 跑单元测试 `npm run test:js` / `run-full-tests.mjs` | Node 22.22.2（本机实测，11319 全绿）或 Node 24 均可 |
| 跑 `check-migrations` / `migrate` / `check-package` | **必须 Node 24.x**（否则 `ERR_DLOPEN_FAILED`） |
| 跑后端 `run-backend-tests.mjs` | Python `venv\Scripts\python.exe`（Node 仅作启动壳） |

---

## E22 后端软链用例降级为 SKIP 后复跑（2026-10-22，本轮收尾）

### E22.1 本机软链行为取证

```bash
$ python - <<'PY'
from pathlib import Path
import tempfile
root = Path(tempfile.mkdtemp()); outside = root/'outside.json'; outside.write_text('{}')
inside = root/'inside'; inside.mkdir(); link = inside/'link.json'
link.symlink_to(outside)            # 不抛异常
print(link.exists(), link.is_symlink())   # False False
PY
False False
```

即 `Path.symlink_to()` **静默"成功"但磁盘上没有链接**；`os.symlink()` 同样不抛异常也不产生链接项，
因此原用例只捕获 `OSError` 时会带着「软链已建好」的错误前提继续断言。

### E22.2 改动（仅 3 处测试文件，未改 `src/`、`tools/`、`package.json`）

| 文件 | 用例 | 改动 |
| --- | --- | --- |
| `backend/services/test_audit_security.py` | `FileBoundaryTests.test_symlink_cannot_escape_root` | `symlink_to` 后补 `if not (link.is_symlink() and link.exists()): self.skipTest(...)` |
| `backend/services/test_audit_security.py` | `StaticAccessTests.test_static_symlink_does_not_expose_outside_file` | 同上 |
| `backend/services/test_file_save_migration.py` | `FileSaveMigrationTests.test_source_symlink_rejected_when_supported` | `os.symlink` 后补同款校验 |

原 `except OSError: self.skipTest(...)` 兜底全部保留；安全断言（`assertRaises(ValueError)` / `assertIsNone(...)`）逐字未改。

### E22.3 复跑结果

```bash
$ node tools/run-backend-tests.mjs
test_symlink_cannot_escape_root (...) ... skipped 'Host cannot create real symlinks; symlink-based assertions cannot run here'
test_static_symlink_does_not_expose_outside_file (...) ... skipped 'Host cannot create real symlinks; symlink-based assertions cannot run here'
test_source_symlink_rejected_when_supported (...) ... skipped 'Host cannot create real symlinks; symlink-based assertions cannot run here'

----------------------------------------------------------------------
Ran 223 tests in 11.093s

OK (skipped=3)
```

**结论：223 tests → 220 通过 / 0 失败 / 3 跳过**（修复前为 220 通过 + 3 条失败断言），
跳过的 3 例与 D14-5/D14-6 一一对应，均为环境限制，**不代表安全断言被放行**。

---

## E23 `AIGenVideoNode` hover 缺陷修复的 QA 验证（终态复跑）

首轮 e2e 唯一的真实失败（E20）已由工程师修复，本节记录**独立验证过程**（不采信「已修好」的口头结论）。

### E23.1 修复内容核对（读码）

```bash
$ git status --porcelain
 M backend/services/test_audit_security.py
 M backend/services/test_file_save_migration.py
 M package.json
 M src/components/AIGenVideoNode.js
 M tools/run-full-tests.mjs
?? electron/brandDataMigration.extra.test.js
?? src/components/video-node/previewHoverPlaybackModule.js
?? src/components/video-node/previewHoverPlaybackModule.test.js
```

- 新增模块 `src/components/video-node/previewHoverPlaybackModule.js`，导出 `createVideoNodePreviewHoverPlaybackModule()`；
  方法用计算属性名定义：`['activatePreviewHoverPlayback']()`（第 192 行）、`['_deactivatePreviewHoverPlayback']()`（第 233 行）。
- 接线（`src/components/AIGenVideoNode.js`）：第 72 行 import → 第 1476 行 `create…()` → 第 1489 行
  `applyClassPrototypeMethods(AIGenVideoNode.prototype, videoNodePreviewHoverPlaybackModule)`。
- 实现质量（QA 视角）：两个方法都包 try/catch 兜底不抛；有 `_previewHoverActivationPending` 重入保护；
  外部 owner（视频剪辑/抠像控制器）与手动播放态不抢控制权；`mouseleave` 时仅在非手动播放态才 `pause`。
- 修复自带回归 `previewHoverPlaybackModule.test.js`：用 `assert.doesNotThrow` **真的派发** `mouseenter`/`mouseleave`——
  正是首轮漏测的那个分支。

### E23.2 原失败用例复跑

```bash
# 先按默认端口跑，撞上残留服务：
#   Error: http://127.0.0.1:18779/ is already used …
# 改用独立端口，避免与其它在跑的 e2e 互相干扰：
$ AIC_E2E_PORT=18791 npx playwright test e2e/node-parameters.spec.js
Running 1 test using 1 worker
  ok 1 e2e\node-parameters.spec.js:2:1 › real video node lazily opens grouped model menus and keeps advanced controls across updates (14.6s)
  1 passed (18.0s)
```

### E23.3 四个 web spec 全量复跑

```bash
$ AIC_E2E_PORT=18792 npx playwright test e2e/smoke.spec.js e2e/http-security.spec.js e2e/node-parameters.spec.js e2e/workspace.spec.js
  ok 1..9  （全部通过）
  9 passed (1.5m)
```

关键对比：**首轮 `1 failed / 8 passed (1.7m)` → 终态 `9 passed`**，同一份用例、同一台机器。

### E23.4 全量 JS 复跑（修复后终态）

```bash
$ node tools/run-full-tests.mjs --js-only
# 日志第 1 行即给出本次运行的权威目录：
#   {"type":"start","resultRoot":"F:\\CanvasPro\\test-artifacts\\full-review\\run-Z9L83q","unitFiles":1186,"nodeFiles":1163,"pythonFiles":23}
# 结果取自该 run 的 summary.json：
startedAt   2026-10-22T05:59:45.642Z
finishedAt  2026-10-22T06:05:55.877Z
counts      {"tests":11339,"pass":11339,"fail":0,"skipped":0,"cancelled":0}
success     true    batches 20（全部 exitCode=0）    manifest 1186 个用例文件    批用时合计 ≈ 273 s
```

> ⚠️ 取证注意（我实际踩过一次，记录以免后人重复）：本轮有其他 teammate **并发**跑同一条命令，
> `test-artifacts/full-review/` 下同时存在多个 `run-*`（`run-tkpf1k` 05:56:50、`run-Tu9j4O` 05:59:13、`run-Z9L83q` 05:59:45）。
> 认领自己那次**唯一可靠的办法是看自己进程日志的第 1 行 `{"type":"start","resultRoot":…}`**；
> 用 `ls -td | head -1` 会拿到别人未跑完的中间态（曾误读到 `batches=11` / `tests=5901`），
> 用 `startedAt` 排序也可能认错（我最初就把另一个并发 run `run-tkpf1k` 当成了自己的）。
> 补充：那几个并发 run 的终态数字**完全一致**（`run-tkpf1k` / `run-Tu9j4O` / `run-Z9L83q` 三者均 `finished=true` 且均为 `11339/11339/0`），
> 说明该结果**可复现**；但**引用的路径必须是自己那个**，否则无法复核（本节早先版本曾误引 `run-tkpf1k`，已更正为 `run-Z9L83q`）。

### E23.5 增量 +20 的逐文件分解（11319 → 11339）

| 新增用例文件 | tests |
| --- | --- |
| `src/components/video-node/previewHoverPlaybackModule.test.js`（修复自带回归） | 13 |
| `electron/brandDataMigration.extra.test.js`（本轮换牌补充，已从 `docs/qa` 移入 `electron/` 以纳入 glob） | 3 |
| `vendor/three/examples/jsm/curves/NURBSUtils.test.js` | 2 |
| `vendor/three/examples/jsm/loaders/OBJLoader.test.js` | 1 |
| `vendor/three/examples/jsm/loaders/STLLoader.test.js` | 1 |
| **合计** | **20** |

manifest 文件数 1181 → 1186（+5），与上表 5 个文件一一对应；`git status` 中无其它测试文件被修改，故增量可完全解释。

### E23.6 后端复跑（与 QA-2 的 SKIP 改动交叉验证）

```bash
$ node tools/run-backend-tests.mjs
Ran 223 tests in 11.759s
OK (skipped=3)
EXIT=0
```

即 **220 通过 / 0 失败 / 3 跳过**，与 QA-2 的结论一致（我独立复跑，未复述其数字）。

### E23.7 终态总账

| 层 | 用例 | 通过 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| JS 全量（主入口，已含 vendor） | 11339 | 11339 | 0 | 0 |
| Python 后端 | 223 | 220 | 0 | 3 |
| Web 集成 e2e | 9 | 9 | 0 | 0 |
| **合计** | **11571** | **11568** | **0** | **3** |

**结论：首轮 1 个真实缺陷已闭环，终态 0 失败；3 例 SKIP 为环境限制且已标注「跳过 ≠ 放行」。**
