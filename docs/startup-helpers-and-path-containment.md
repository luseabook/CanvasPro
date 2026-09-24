# R15/R24 启动辅助三件与路径包含校验（第76批）

## 1. 本批要补的缺口

`electron/main.js` 里还留着三类**旧世代内联实现**，端口源已把它们抽成独立模块：

| 模块 | 端口源体量 | 内联对应物（本仓位置） |
| --- | --- | --- |
| `electron/mainStartupHelpers.js` | 89 行 / 4 511 B | `delay`(main.js:396) + `escapeHtml`(401) + `createStartupHtml`(409) + `loadStartupStatus`(431) + `isLocalAppUrl`(436) + `openExternalUrl`(444) |
| `electron/localPathContainment.js` | 31 行 / 959 B | `isPathInside`(1777) + `resolveLocalVirtualPath`(1822) 的内联包含判定 |
| `electron/devReloadShortcuts.js` | 38 行 / 1 667 B | `installDevReloadShortcuts`(2375) |

三者的**生产消费方在本仓真实存在**（即 `main.js`），故本批**接线**（口径同第70/71/75批），无伪造消费方。

## 2. 交付物

| 文件 | 行/字节 | import | 导出 |
| --- | --- | --- | --- |
| `electron/mainStartupHelpers.js` | 89 / — | **零 import** | `createStartupHelpers` |
| `electron/localPathContainment.js` | 31 / — | `node:fs`（`realpathSync`）/ `node:path` | `isPathInsideRoot` / `resolveExistingPathWithinRoot` |
| `electron/devReloadShortcuts.js` | 38 / — | **零 import** | `isPackagedBrowserShortcut` / `installDevReloadShortcuts` |
| `electron/mainStartupHelpers.test.js` | — | — | 8 项 |
| `electron/localPathContainment.test.js` | — | — | 9 项 |
| `electron/devReloadShortcuts.test.js` | — | — | 11 项 |

### `mainStartupHelpers.js` 语义

`createStartupHelpers({ appDisplayName, appOrigin, getMainWindow, logDiagnosticEvent, shellApi, normalizeExternalUrl, formatExternalUrlForLog })` 返回 `{ delay, loadStartupStatus, isLocalAppUrl, openExternalUrl }`：

- `delay(ms)` → `setTimeout` 包装的 Promise；
- `loadStartupStatus(status)`：`getMainWindow()` **惰性取窗**，`!window || window.isDestroyed()` 直接返回，否则 `loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))`；
- `isLocalAppUrl(url)`：`new URL(url)['origin'] === appOrigin`，解析失败返 `![]`；
- `openExternalUrl(url)`：`normalizeExternalUrl` 拒绝时记 `external_link.blocked`（`level:'warn'`，`context.reason='invalid-or-disallowed-protocol'`）并返 `{ ok:![] , error:'不允许打开该外部链接' }`；否则 `shellApi.openExternal(url)` + 记 `external_link.opened`（`context.url` 经 `formatExternalUrlForLog` 脱敏）并返 `{ ok:!![], url }`。
- 内部私有 `escapeHtml` / `createStartupHtml`（**不导出**）——HTML 文档模板与端口源**逐字一致**（含 `\x20`/`\x0a` 转义、`Mark`/`AccentColor`、`spin 0.9s linear infinite`、`animation: none`）。

### `localPathContainment.js` 语义

- `isPathInsideRoot(candidate, root)`：双方 `path['resolve']` 后取 `path['relative'](root, candidate)`，满足「`'' ` **或**（`!== '..'` 且不以 `'..' + path.sep` 开头 且非绝对）」为真；异常返 `![]`。
- `resolveExistingPathWithinRoot(root, relativePath, { realpath = realpathSync })`：`path['resolve'](root, relativePath)` 先过 `isPathInsideRoot` 判定，**再对 root 与 target 各做一次 realpath 复核**（拦截符号链接/junction 逃逸），任一步失败返 `''`。

### `devReloadShortcuts.js` 语义

- 私有 `normalizeInputKey(input)`：优先 `input.key` 小写；否则 `input.code` 去掉 `^Key` 前缀后小写（`code:'KeyR'` → `'r'`）。
- `isPackagedBrowserShortcut(input)`：`f5`/`f12` 恒真；`(control|meta) && r` 真；`(control&&shift)|(meta&&alt)` 且键为 `c`/`i`/`j` 真。
- `installDevReloadShortcuts({ app, window })`：`window` 缺失直接返回；挂 `before-input-event`，仅处理 `type === 'keyDown'`。
  - **已打包**：F5 或 `(control|meta)+r` → `preventDefault()` 后返回（**屏蔽刷新**）；
  - **未打包**：F5 或 `(control|meta)+r` → `preventDefault()`，`shift` 时 `reloadIgnoringCache()`，否则 `reload()`。

## 3. 接线状态

`electron/main.js` 本批改动（`b76-wire.mjs` 锚点脚本，运行后 `node --check` 通过）：

| 环节 | 状态 |
| --- | --- |
| 3 个模块落地 | ✅ |
| 新增 3 个 import | ✅ `main.js:55–57` |
| 删除 6 个内联函数（`delay`/`escapeHtml`/`createStartupHtml`/`loadStartupStatus`/`isLocalAppUrl`/`openExternalUrl`，**73 行**） | ✅ 全文 `^function delay` 等命中 **0** |
| 替换为 `createStartupHelpers` 解构常量 | ✅ `main.js:399`（`{ delay, loadStartupStatus, isLocalAppUrl, openExternalUrl }`） |
| 删除内联 `isPathInside`（**9 行**） | ✅ |
| `resolveLocalVirtualPath` 改用 `resolveExistingPathWithinRoot` | ✅ 调用点 `main.js:1762`（`resolveLocalVirtualPath` 自身由 16 行改写为 14 行） |
| 删除内联 `installDevReloadShortcuts`（**15 行**） | ✅ 调用点 `main.js:2370` 不变 |
| 生产 `import` 数 | 3（全部真实接线） |

净行数变化：`−73 +9`、`−16 +14`、`−9`、`−15` ⇒ **净约 −87 行**，`main.js` 进一步变薄。所有 4 个解构成员的调用点（`delay` @1642、`loadStartupStatus` @2398/2419/2566、`isLocalAppUrl` @2524、`openExternalUrl` @2521/2525）**全部位于函数体内**，故 `main.js:399` 的模块级 `const` 在模块初始化期不会被 TDZ 命中。

## 4. 本批已执行的离线验证

- `node --check` × 10（3 源码 + 3 测试 + `main.js` 及既有文件）：全部退出 0。
- `prettier --check`（`deobf-tools/prettierrc.json`）：`main.js` + 3 源码首跑即过；`localPathContainment.js` 与 2 个测试文件 `--write` 后复检 `All matched files use Prettier code style!`。
- `node --test electron/devReloadShortcuts.test.js electron/localPathContainment.test.js electron/mainStartupHelpers.test.js` = **28/28/0**（11+9+8）。测试**未联网、未跑 Electron、未打开真实窗口、未写任何仓库内文件**：`app`/`window`/`webContents`/`shellApi`/`logDiagnosticEvent`/`getMainWindow` 全为注入替身；`localPathContainment` 的 3 条真实文件系统用例用 `mkdtempSync` 建**系统临时目录**并尝试 `symlinkSync(..., 'junction')`（建链失败则跳过该断言），**未离开本机、未写仓库**。
- **首跑 2 项失败均为测试期望写错、实现零改动**：①`resolveExistingPathWithinRoot('/root/sub','..')` 我断言 `path.resolve('/root')`，实际返 `''`（`'..'` 使 `isPathInsideRoot` 判否 → 直接返回空串，**实现正确**）；②我的 `formatExternalUrlForLog` 替身写成 `/[?&]token=[^&]+/g → 'token=***'`，把 `?` 一并吞掉使期望的 `.../a?token=***` 实为 `.../atoken=***`，改替身为 `/([?&])token=[^&]+/g, '$1token=***'` 后通过。修正后 28/28 全绿。
- `node --test --test-reporter=tap $(find electron -name '*.test.js')` = **1 512/1 511/1**（第75批 1 484/1 483/1，**净增 28 = 本批全部**）。唯一失败仍是既有 `fullProjectPackageService.test.js` 的 `missing manifest coverage cannot bind to an existing unrelated local file`，归 R14 第17批。
- 忠实性比对（`cmp-tokens.mjs`，port → repo）token 数**完全相等**：`devReloadShortcuts` 343/343 matched 291、`localPathContainment` 186/186 matched 157、`mainStartupHelpers` 453/453 matched 380。字面量比对（`litdiff2.mjs`）三件 `onlyPort(0)=[]`/`onlyRepo(0)=[]` **逐字一致**——**包括整份启动 HTML/CSS 模板文档**。**本批本仓改写 0 处**。
- 本批**未触碰** `api/`、`src/`、`preload`；`src/**` 沿用 1 566/1 523/43。
- 工作树快照：`staged=0 modified=67 untracked=446 conflicts=0`（第75批落盘后 `0/67/440/0`，**+6** = 本批 3 源码 + 3 测试，`modified` 保持 67 不变）。

## 5. 未执行的验收项（不得当作已完成）

- **行为差异 1（刷新屏蔽，须真实运行核对）**：本仓旧内联 `installDevReloadShortcuts` 在 `app.isPackaged` 时**直接 return（什么都不做）**；新模块在已打包时**对 F5 与 `Ctrl/Cmd+R` 调 `preventDefault()`**，即**打包版将屏蔽刷新快捷键**。这是真实的行为变更，未在真实 Electron 上验证；`isPackagedBrowserShortcut` 亦**未被 `installDevReloadShortcuts` 调用**（端口源同样如此），故它目前是**本仓无外部消费方的导出符号**。
- **行为差异 2（路径包含收紧，须真实运行核对）**：`resolveLocalVirtualPath` 原用字符串前缀 `isPathInside`（`p === r || p.startsWith(r + path.sep)`，**不做 realpath**）；新路径改用 `path.relative` 判定 **并对 root/target 各做 realpath**，符号链接/junction 逃逸现在会被拒。返回契约仍为「命中原路径或 `''`」，但真实 `data/assets`、`data/uploads`、`output` 目录若经 junction（Windows 常见）指向别处，`realpath` 后的包含判定**是否仍命中未验证**。
- **`before-input-event` 真实载荷**：真实 Electron 是否以 `key:'F5'`（而非仅 `code`）投递、`shift`/`control`/`meta` 的真实取值组合未验证；本批只覆盖构造载荷。`code:'KeyR'` 回退分支亦然。
- **启动 HTML 的真实呈现**：`data:text/html;charset=utf-8,` 文档在真实 `BrowserWindow` 中的 `Mark`/`AccentColor`/`animation` 呈现、以及 `loadStartupStatus` 在窗口销毁竞态下的行为未验证。
- **模块级 `const` 解构的装配语义**：`createStartupHelpers` 现于**模块加载期**调用一次（端口源同）；本仓已核对全部调用点在函数体内，但**未在真实启动流程中跑过**。
- 本批**未做** `main.js` 接线的静态断言测试（第71批 `captureChainWiring.test.js` 之先例）；`main.js` 改动仅经 `node --check`/`prettier --check` 与「锚点脚本运行成功」，**未经任何测试覆盖**。

## 6. 约束复核

- 未触碰 `api/freeImageHostApi.js`；未做任何批量复制（`main.js` 改动经**锚点脚本**逐段替换，且事先备份到 `C:/Users/luobote/.qoder/tmp/deobf-tools/main.before-b76.js`）。
- 未 `git reset --hard` / `git clean` / 批量 checkout；未清理未跟踪文件。
- 未触碰 `D:\shuocancas`；端口源目录仅**只读**。
- 未改 `style.css`、未改授权检查、未新增 npm 依赖、未改 `src/i18n/messages/*`。
- 未把反混淆临时目录/绝对开发机路径写进运行时依赖。
- 未提交、未推送、未触发 release 工作流。
- 测试**未写任何仓库内文件**（`localPathContainment` 的真实 fs 用例只写系统临时目录）。

## 7. 下一批建议

1. **（低风险、纯新增）** `electron/` 顶层**仅端口存在**的文件已从 15 个降至 10 个，其中仍**依赖闭合**的候选：`dialogPresenterCore.js`(3 667 B) + `dialogPresenter.js`(331 B)（`dialogPresenterCore` 零 import；`dialogPresenter` 依赖 `electron`）、`diagnosticsEvidence.js`(2 058 B) + `diagnosticsLaunchVersion.js`(1 307 B)（零/仅 node:fs，但消费方是本仓**旧世代** `diagnostics.js`，接线需先决定是否升代 `diagnostics.js`——**升代属在用在产文件，须单独授权**）、`nativeContextMenuIcons.js`(2 058 B，依赖已存在的 `src/utils/contextMenuIconCatalog.js`)、`localPreviewProtocolRuntime.js`(7 648 B，纯 node 内建)、`mainStartupHelpers` 同族的 `mediaTaskRuntime.js`(19 065 B，6 个依赖**本仓已全部存在**——媒体任务队列的**装配层**，价值高但体量大)。
2. **（需真实运行授权）** 核对本批两处**行为差异**：打包版刷新屏蔽（`installDevReloadShortcuts`）与 realpath 收紧后的路径包含（`resolveLocalVirtualPath` + junction 资产目录），并补 `main.js` 接线的静态断言。
3. **（需真实运行授权）** 第75批遗留：把后端 spawn 站点切到 `resolveBackendLaunchSpec`（打包走原生 `aicanvas-backend`）。
4. 长期不变项：`src/core/rendererPanPreviewReconcile.js`（11 189 B，须与其 3 个依赖成组移植）；第74批 `b74-scan.mjs` 判定的 481 条「无级联」渲染器池；`web-preview/*` 5 条路由的渲染器侧消费点；`storage-migration/prepare`；`styles/variables.css` 里 44 个未移植 CSS 自定义属性；`main.js` 的 chrome-shell 最终装配（13 个依赖模块已落地）。
