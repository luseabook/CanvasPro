# 第81批：渲染器运行时诊断钩子（`rendererRuntimeDiagnostics`，落地不接线）+ `rendererPanPreviewReconcile` 依赖闭合**受阻**记账

## 1. 本批要补的缺口

第80批 §8「A 类」点名两件：`nativeContextMenuIcons`（受阻于 `webPreviewViewManager` 升代，第80批已落地不接线）与 `src/core/rendererPanPreviewReconcile.js`（11 189 B，第74批起即为欠项，备注「须与其 3 个依赖成组移植，先查闭合」）。本批**先做闭合审计**，结论是：该组**不能**作为「纯新增」落地，其 3 个缺失依赖里有 2 个直接要求 `rendererVirtualization.js` 具备 **0.7.16 世代才有的导出与配置键**，而本仓该模块是**行为已分叉的旧世代、且在用**（4 个消费方 + 1 个测试）。故本批只落地该闭合中**唯一零依赖**的一件 `rendererRuntimeDiagnostics.js`，并把受阻事实与依据记账。

## 2. 交付物

| # | 文件 | 行数 / 字节 | 端口源 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | `src/core/rendererRuntimeDiagnostics.js` | 31 行 / 1 214 B | 1 行 / 1 048 B | **落地不接线**（本仓零消费方） |
| 2 | `src/core/rendererRuntimeDiagnostics.test.js` | 199 行 / 7 509 B | — | **11 项离线测试，首跑 8 绿 3 红 → 修正 3 处期望后 11/11 全绿** |

### 1 · `rendererRuntimeDiagnostics.js`（逐字移植）

端口源为单行、无任何 `import`；三个导出：

- `isRendererRuntimeDiagnosticsEnabled()`：仅当 `getWindowLike()` 上 `__runtimeCompareRendererDiagnosticsEnabled === true` **且** `__runtimeCompareRecordRendererDiagnostic` 为函数时返回 `true`。
- `recordRendererRuntimeDiagnostic(payload = {})`：未启用时返回 `null`；启用时透传 `payload` 给宿主 recorder 并返回其返回值。
- `installRendererRuntimeDiagnosticAccess(resolveNodeState)`：未启用或 `resolveNodeState` 非函数时返回 `false` 且**不写任何东西**；否则在宿主上定义 `__runtimeCompareGetRendererNodeDiagnosticState = (nodeId) => {...}` 并返回 `true`。

私有 `getWindowLike()` = `typeof window !== 'undefined' ? window : globalThis`（模块加载期**不**取值，每次调用实时解析）。这正是本模块可**完全离线测量**的原因：测试只需在调用前挂/摘 `globalThis.window`。

忠实性：`litdiff2` **字面量逐字一致**（port 13 / repo 13，unique 7/7，`onlyPort(0)=[]` / `onlyRepo(0)=[]`，即 4 个全局钩子名 + `''`/`'function'`/`'object'` 等全部逐字节相同）；`cmp-tokens` port 168 / repo 177 / matched 164，差异仅为 **Prettier 补齐的括号（`return (` 包裹长 `&&` 表达式）与 `function` 关键字分词**，**无字面量/关键字缺失**。`src/**` 惯例保留 `_0x` 局部名（`_0x438bf9`/`_0x552965`/`_0x1b0016`/`_0x354472`/`_0x39a353`/`_0x3814c9`/`_0x533248`）。

### 2 · `rendererRuntimeDiagnostics.test.js`

测试用 `withWindow(windowLike, run)` 助手：保存并恢复 `globalThis.window` 与三个钩子键，跑完即还原，**不泄漏全局状态**。11 项覆盖：

1. 未打补丁的 window → `isEnabled()=false`、`record()` 返回 `null`、`install()` 返回 `false` 且**未发布 getter**；
2. 只有 enabled 标志、无 recorder 函数 → 仍 `false`；
3. 只有 recorder 函数、无 enabled 标志 → 仍 `false`；
4. 全量补丁 → `isEnabled()=true`，`record()` **原引用透传** payload（`assert.equal(seen[0], payload)`）并返回 recorder 的返回值；
5. `record()` 无参调用 → recorder 收到**新的** `{}`；
6. getter 的**字符串强转**：`getState('node-1')`→`'node-1'`、`getState(7)`→`'7'`、`getState(0)`→`''`（`String(nodeId || '')` 的 falsy 分支）；
7. resolver 返回非对象（`undefined`/`null`/`'text'`）→ getter 一律返回 `null`；
8. getter 返回**浅拷贝**：改副本字段不回写 resolver 源对象，且嵌套引用**共享**（浅拷贝语义）；
9. resolver 非函数 → `install()` 返回 `false` 且不发布 getter；
10. enabled 标志非严格 `true` → `install()` 返回 `false`；
11. `window` 绑定缺失（走 `globalThis`）→ 全部降级为 `false`/`null`。

## 3. 接线状态

**零消费方，落地不接线**。该模块的端口消费方是 0.7.16 世代的渲染器三件（`rendererPanPreviewReconcile`、`rendererInteractionRenderPolicy` 等），而本仓的这三件既未落地、其闭合又被下面的阻塞项挡住。本仓全局 grep `isRendererRuntimeDiagnosticsEnabled` / `recordRendererRuntimeDiagnostic` / `installRendererRuntimeDiagnosticAccess` / `rendererRuntimeDiagnostics` → **0 命中**，即本仓既无该模块、也无内联等价物。按「宁可留白并记账，也不为了「有引用」而擅自接线」，**不伪造消费方**。

语义说明：该钩子的使能开关 `window.__runtimeCompareRendererDiagnosticsEnabled` 与 recorder `window.__runtimeCompareRecordRendererDiagnostic` 由**外部运行时对照工装**注入（非渲染器自身设置）；本仓无该工装 ⇒ 本模块在当前仓库内**恒为惰性**（`isEnabled()=false`、`record()`→`null`、`install()`→`false`），**不产生任何行为**。这也是它作为「零依赖纯新增」安全的原因。

## 4. `rendererPanPreviewReconcile` 依赖闭合审计（本批核心产出：**受阻**）

目标件 `src/core/rendererPanPreviewReconcile.js`（端口 11 189 B，导出 `createRendererPanPreviewReconciler`）的 7 个 import 中，4 个本仓已有、3 个缺失：

| 依赖 | 本仓 | 端口 | 结论 |
| --- | --- | --- | --- |
| `./interaction.js` | ✅ 91 144 B | 45 330 B | 本仓更**新**，可用 |
| `./viewportPanPreview.js` | ✅ 5 724 B | 4 636 B | 可用（第73批前已落地） |
| `./viewportInteractionState.js` | ✅ 2 024 B | 1 768 B | 可用 |
| `./rendererVirtualization.js` | ⚠️ 10 441 B | 17 870 B | **旧世代、行为分叉、在用** |
| `./rendererViewportPreviewCoverage.js` | ❌ 缺 | 5 777 B | 需 `resolveRendererVirtualizationTier`（本仓**无**） |
| `./rendererInteractionRenderPolicy.js` | ❌ 缺 | 12 522 B | 需 `resolveRendererLowZoomMountLimit`（本仓**无**）+ 3 个本仓缺失的配置键 |
| `./rendererRuntimeDiagnostics.js` | ✅ 本批落地 | 1 048 B | 零依赖，**已补** |

**硬阻塞**：两个缺失依赖都从 `rendererVirtualization.js` 具名取用本仓**不存在**的导出——全仓 grep `resolveRendererVirtualizationTier` / `resolveRendererLowZoomMountLimit` → **0 命中**。端口版该模块的导出是本仓的**严格超集**（端口 11 个 vs 本仓 7 个，多出的正是上述两个 + `ensureRendererExactVisiblePreviewCandidates` + `resolveRendererPreviewPadding`），但**配置对象已行为分叉**：

| 配置键 | 本仓 | 端口 | 影响 |
| --- | --- | --- | --- |
| `veryDenseLowZoomThreshold` | `0.32` | `0.33` | 阈值语义变化 |
| `parkAfterInteractionDelayMs` | `0x708`（1800） | `0x140`（320） | **约 5.6×** 的停放延迟差 |
| `denseLowZoomPreviewPadding` | 缺 | `0x4b0` | 缺失 |
| `veryDenseLowZoomPreviewPadding` | 缺 | `0x640` | 缺失 |
| `denseLowZoomMaxMountCandidates` | 缺 | `0x24` | 缺失 |
| `veryDenseLowZoomMaxMountCandidates` | 缺 | `0x18` | 缺失 |
| `lowZoomViewportCommitReconcileDelayMs` | 缺 | `0x2d0` | 缺失 |
| `dragCommitReconcileDelayMs` | 缺 | `0x1e0` | 缺失 |

而 `rendererVirtualization.js` 在**在用**：消费方为 `src/core/renderer.js`（116 291 B，本仓最大文件）、`src/core/canvasMediaWarmup.js`、`src/ui/rendererUiEvents.js`，另有 `src/core/rendererVirtualization.test.js`。

**判定**：把 `rendererVirtualization.js` 升到 0.7.16 世代**不是纯新增，而是对在用模块的行为变更**（`parkAfterInteractionDelayMs` 5.6×、缩放阈值变化、若干缺失配置键使新函数产出 `undefined`/`NaN`）。它必须**单独成批**，且需：(a) 先审计 4 个消费方的调用点与配置键读取；(b) 明确其**行为差异**（尤其停放延迟与阈值）是否为本仓期望；(c) 真机验证渲染/虚拟化行为不回归。**本批不做**，按「宁可留白并记账」记录。依赖闭合审计脚本一次性完成，故第74批遗留的该项由「依赖未查」升级为「依赖已查、受阻于在用模块行为升代」。

## 5. 本批已执行的离线验证

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check src/core/rendererRuntimeDiagnostics.js` / `...test.js` | 均 exit 0 |
| 格式 | `prettier --config deobf-tools/prettierrc.json --check`（模块 + 测试） | 模块 `--write` 后两件全过 |
| 新模块单测 | `node --test src/core/rendererRuntimeDiagnostics.test.js` | **11/11 通过**（首跑 8/11，3 处**期望写错**已修正，实现未改） |
| `src/**` 全量 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **1 584 / 1 541 通过 / 43 失败**（第80批台账 `1 573/1 530/43`，**恰好 +11** = 本批新测；43 项失败仍**全部**归属缺失夹具 `tests/testPreviewDom.js`，**不伪造**） |
| `electron/**` 全量 | 未重跑 | 本批**未触碰任何 `electron/` 文件**（`git status` 确认），沿用第80批基线 **1 649/1 648/1** |
| 字面量保真 | `litdiff2.mjs` | port 13 / repo 13，unique 7/7，`onlyPort(0)=[]` / `onlyRepo(0)=[]`（**逐字节一致**） |
| 令牌保真 | `cmp-tokens.mjs` | port 168 / repo 177 / matched 164；差异全为 Prettier 括号 + `function` 分词，**无字面量/关键字缺失** |
| 工作区快照 | `git status` 计数 | `0 / 67 / 471 / 0`（第80批 `0/67/468/0`，+3 = 本批 1 源码 + 1 测试 + 1 专题文档） |

测试**未联网、未跑 Electron、未起服务、未打开任何窗口、未写仓库内文件**（唯一的全局写入是测试助手内的 `globalThis.window` 挂载，且 `finally` 里逐键还原）。

## 6. 未执行的验收项（不得当作已完成）

1. `rendererRuntimeDiagnostics` 在真实渲染器与真实对照工装下的使能/记录链路（本仓无工装 ⇒ 恒惰性，需真机 + 工装注入才能验证）。
2. `rendererPanPreviewReconcile` 及其两个缺失依赖**未移植、未测试、未接线**（受阻，见 §4）。
3. `rendererVirtualization.js` 升代后的渲染/虚拟化行为（停放延迟、缩放阈值）**未做任何真机验证**。

## 7. 约束复核

- `api/freeImageHostApi.js` md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`（**未变**）。
- 未自动提交、未推送、未触发任何 release；`staged=0`。
- 未新增 npm 依赖；未改 `src/i18n/messages/*.js`；未改任何鉴权检查；未触碰 `electron/`。
- 未使用任何破坏性 git 命令；未清理任何未跟踪文件。
- 未把反混淆临时目录或本机绝对路径写成运行时依赖（模块只依赖 `window`/`globalThis`）。
- **未伪造消费方**：模块落地即零引用，缺口如实记账。

## 8. 下一批建议

1. **`rendererVirtualization.js` 0.7.16 世代升代**（解锁整个 pan-preview 家族的**前置网关**）：需先审计 4 个消费方（`renderer.js`/`canvasMediaWarmup.js`/`rendererUiEvents.js`/`rendererVirtualization.test.js`）与 8 个配置键差异，把「停放延迟 5.6×、缩放阈值、缺失键」逐一判为期望或需回填，再决定升代方式；升代后 `rendererViewportPreviewCoverage.js` + `rendererInteractionRenderPolicy.js` + `rendererPanPreviewReconcile.js` 三件可成组落地。
2. `src/core/rendererPanPreviewReconcile.js` 依赖闭合其余三件（须在 1 之后）。
3. 第74批 `b74-scan.mjs` 判定的 481 条「无级联」渲染器池；`web-preview/*` 5 条路由的渲染器侧消费点；`storage-migration/prepare`；44 个未移植 CSS 自定义属性。
4. `nativeContextMenuIcons.js` 待 `webPreviewViewManager` 升代后接线（第80批落地不接线）。
