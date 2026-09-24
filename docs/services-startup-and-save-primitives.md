# 第116批专题：`src/services` 启动/保存/对象 URL 纯叶六件（落地不接线）+ 「OK 池导出盲区」记账

本批两件事：**（A）**撤回一件按 `deps-ast` 判为 OK、实际无法落地的文件，并把「OK 判定不看具名导出」这一过程缺陷固化为新闸门；**（B）**按新闸门重排后，落地 `src/services` 六件零 import 纯叶（219 行 / 8 114 B），配 49 项离线测试全绿。

---

## 1. A：`providerConnectionAutoVerification.js` 撤回记账

### 1.1 事实

第115批台账把 `src/services/providerConnectionAutoVerification.js`（镜像 3 191 B）记为「BLK 转 OK、依赖已全部就位、下一批即可落地」。本批实际把它暂存进 `src/services/` 后跑三道闸门：

- `cmp` 逐字节保真：**通过**
- `node --check`：**通过**
- `b100/verify-exports.mjs` 具名导出闸门：**`MISSING ../../api/configApi.js :: getApiConfigSnapshot`**（其余 5 条具名导入全部 `ok`：`getProviderConfig`、`saveApiConfigToServer`、`testProviderConnection`、`mergeCurrentProviderConnectionResults`、`shouldPersistProviderConnectionResult`）

全仓 grep 证实：本仓 `api/configApi.js` 只导出 `clearApiConfig`、`fetchApiConfigFromServer`、`saveApiConfigToServer`、`ensureConfig`、`getProviderConfig`；**`*ConfigSnapshot` 这一符号在全仓 0 命中**。该文件留在仓库会在 import 阶段直接抛 `SyntaxError`（具名导入不存在），因此按「**不伪造 shim**」原则**已删除**，本批未落地该件。

### 1.2 镜像侧对照

镜像 `api/configApi.js`（16 889 B，本仓版本为其旧世代子集）确有：

```js
export function isApiConfigLoaded(){return apiConfig!==null;}
export function getApiConfigSnapshot(){return cloneConfig(apiConfig||{});}
```

即一个**深拷贝快照读取器**（`JSON.parse(JSON.stringify(...))`）。除它之外镜像侧还有 6 名消费者依赖该导出：

| 镜像文件 | 本仓状态 |
| --- | --- |
| `api/index.js` | 在用装配，未导出该符号 |
| `main.js` | 在用装配 |
| `src/modules/app/appTopbarAndConfig.js` | 未落地 |
| `src/modules/canvasOnboarding/emptyCanvasOnboarding.js` | 未落地 |
| `src/modules/settings/objectStorageSettings.js` | 未落地 |
| `src/services/providerConnectionAutoVerification.js` | 本批撤回 |

⇒ **解阻这一件的前置条件是 `api/configApi.js` 升代**（新增 `isApiConfigLoaded` / `getApiConfigSnapshot` / `API_CONFIG_CHANGED_EVENT` / 安全存储 hydration / 保存队列等），而 `api/configApi.js` 属**在用受保护装配**，须**单独成批 + 真机验证 + 运行授权**，本批不做。注意镜像版 `configApi.js` 反过来 import 第113批已落地的 `runningHubProviderProfiles.js` ⇒ 该升代的渲染器侧前置已就位。

### 1.3 新闸门（过程规则）

`b95/deps-ast.mjs` 的 `OK` / `BLK` **只看依赖文件是否存在，不看具名导出是否存在**，因此「OK」是**必要非充分**条件。固化：

1. **每个 `deps-ast` 判为 OK 的候选，排期前必须先过 `b100/verify-exports.mjs`。** 该脚本以镜像相对路径为入参、把解析结果指向**本仓**（`P=…/shuo-deobf/`，`REPO=F:/CanvasPro/`），因此**无需先把文件复制进仓库**即可跨树校验，属于非破坏性静态检查。
2. 纯叶（`LEAF`，0 条相对 import）不受此盲区影响，可直接排期。
3. 抽样实测：`src/services` 当前 8 件 OK 文件里 **2 件（25%）实为导出受阻** ——
   - `providerConnectionAutoVerification.js` ← `api/configApi.js :: getApiConfigSnapshot` 缺
   - `initialThemeBootstrap.js` ← `./storeRuntimeEffectsService.js :: applyStoredThemeToDom` 缺（本仓该文件存在但无此导出）

   ⇒ 既有「OK 池」计数须按此口径**下调理解**，不能直接当可落地清单。

---

## 2. B：六件零 import 纯叶落地

全部按 `cmp` 逐字节保真落地（端口产物**未编辑一字**），`node --check` 6/6，`prettier --check` 12/12（含 6 件自研测试），具名导出闸门 6/6 无 import 可校验（天然通过）。

| 文件 | 行数 / 字节 | 镜像字节 | 导出 |
| --- | --- | --- | --- |
| `mediaObjectUrlRegistry.js` | 80 / 2 765 | 2 379 | `createTrackedMediaObjectUrl`、`revokeTrackedMediaObjectUrl`、`getMediaObjectUrlRegistrySnapshot`、`__mediaObjectUrlRegistryForTest` |
| `rendererStartupState.js` | 39 / 1 372 | 1 091 | `createRendererStartupState`、单例 `rendererStartupState` |
| `legacyStorageMigrationDeadline.js` | 28 / 1 129 | 872 | `LEGACY_STORAGE_MIGRATION_TIMEOUT_MS`、`createMigrationDeadline` |
| `projectSaveQueue.js` | 26 / 1 004 | 794 | `createProjectSaveQueue` |
| `binghuoCatalogPricing.js` | 25 / 934 | 728 | `withoutBinghuoCatalogPrices` |
| `canvasProjectAccess.js` | 21 / 910 | 795 | `normalizeCanvasProjectAccess`、`assertCanvasProjectSaveAllowed` |
| 合计 | **219 / 8 114** | 6 659 | 14 具名导出 |

`src/services` 零依赖纯叶缺口 **11 → 5**（余：`fastImagePreviewService.js` 6 980 B、`packagedBrowserShortcutGuard.js` 2 961 B、`rendererStartupEvidence.js` 1 917 B、`startupVisualReadiness.js` 3 524 B、`videoFramePresentation.js` 7 322 B）。

## 3. 端口现状要点（只记账，不打补丁）

1. **`mediaObjectUrlRegistry` 是模块级单例**（`activeObjectUrls` 闭包在模块作用域），并且**在 import 时就执行一次 `exposeSnapshotReader()`**；`window` 未定义时静默跳过。快照函数被挂成 `window.__getMediaObjectUrlRegistrySnapshot`，与导出的是**同一函数引用**。
2. 其 `createObjectURL` 走 `globalThis.URL?.createObjectURL?.()` ⇒ 缺 API 时**返回空串而不是抛错**，且空串**不登记**；`revokeTrackedMediaObjectUrl` 对**未登记 URL 也返回 `true`**，并以 `kind:'unknown'` 记一次 `media-object-url:revoked`；`__mediaObjectUrlRegistryForTest.clear()` **只清表、不调用 `revokeObjectURL`**（泄漏由调用方自负）。
3. **`rendererStartupState` 的 `ready` 只能由 `complete('entry') + complete('project')` 两个标记凑齐，或由 `setPhase('ready')` 直接改写**——两条路都会结算 `settled`，因为结算判据是「快照 `ready` 为真或 `failure` 非空」，不区分来源。一旦 `ready` 或已 `fail`，`setPhase`/`complete` 全部静默短路，`fail` 返回 `false`。`subscribe` 会**立刻回放一次**，取消函数返回 `Set.delete` 的布尔值。
4. **`legacyStorageMigrationDeadline.wait()` 在已中止时是同步 `throw`，不是 rejected Promise**（`throwIfAborted()` 位于 `return` 表达式里、构造 Promise 之前）；超时时长被 `Math.max(1, ms)` 夹住 ⇒ **传 0 或负数不是「立刻中止」而是 1 ms 定时器**；`dispose()` 只是 `clearTimeout`，已中止的信号不会复活。回调经 `Promise.resolve().then` **延后一拍**执行，飞行中超时则以中止原因 reject 并丢弃迟到结果。
5. **`projectSaveQueue` 每个 id 只有一个「待写格」**：入队时若上一格存在，**当场**用 `{success:false, canceled:true, superseded:true}` 兑现它；排空后 `Map.delete` ⇒ 同 id 再来会重新同步开跑。`saver` 在 `queue()` 的**同步阶段**就被调用。`saver` reject 只影响当次请求，循环继续处理待写格。
6. **`binghuoCatalogPricing` 的正则 `\s+` 是必需前导空白** ⇒ `模型￥3元／秒`（货币符紧贴）**整条不匹配**；只锚定末尾、非全局 ⇒ **一次只剥一层**。`priceText` 只从白名单 `imageMenu`/`videoMenu` 里删；`title`/`label` 用 `in` 判定才改写（值为数字也会被 `String()` 化）。**缺 `models` 直接 `TypeError`**（无空值保护）；`extensions` 为 falsy 时只是**不写覆盖键**，原始键值仍被外层 `{...model}` 带出（`null` 与显式 `undefined` 都留在结果里）。
7. **`canvasProjectAccess` 的 `canSave` 只认严格 `false`**（`0`/`''`/`null` 都算允许）；`badge` 白名单外一律 `''`；`label` 截 80、`saveMessage` 截 180。`assertCanvasProjectSaveAllowed` 先问 `CanvasTabManager.getCanvasProjectAccess(id)`，**返回真值即不再回落**（哪怕该对象没有 `canSave` 键 ⇒ 放行），返回假值才回落节点自带 `projectAccess`；命中即抛 `code:'PROJECT_SAVE_FORBIDDEN'`，`saveMessage` 空串回落默认文案「当前项目不允许保存」，且**后面的画布不再检查**。

## 4. 测试与检查台账（本批实际执行）

- 自研 6 件测试 **49 例**：**首跑 44/49**，5 处失败**全部是我方期望写错、实现未改一字**：
  1. 误以为货币符紧贴也剥离（实际 `\s+` 必需）；
  2. 误以为 `extensions:null` 时结果无该键（实际由外层展开带出）；
  3. 误以为 `ownerId:0` 变 `'0'`（实际 `String(0||'')` 得 `''`）；
  4. 函数同一性断言写成了带括号的调用；
  5. `projectSaveQueue` reject 用例**先 `reject` 后挂处理器** ⇒ Node 记 unhandled rejection 使该用例失败，改为 `assert.rejects` 先订阅。
  修正后 **49/49 全绿**。
- `src/**` sweep `3 452/3 409/43 → **3 501/3 458/43**`（恰好 +49）；失败名集合与 `b85-fails.txt` `diff` **exit 0**（43 项全部归属缺失夹具 `tests/testPreviewDom.js`，**未伪造**）。
- `api/**` sweep **475/475/0** 未变。
- `prettier --check` 本批 12 件全过；仓库内两处历史脏文件（`agentSkillPackage.js` / `agentSkillPackage.test.js`）未触碰。
- **未执行**：未运行应用、未起 Electron、未发起任何网络/后端调用（六件皆纯本地原语）；`rendererStartupState` 与 `mediaObjectUrlRegistry` 的**真实渲染器启动/媒体生命周期接线未验证**；`projectSaveQueue`/`canvasProjectAccess` 的真实调用方（保存链、TabManager）本仓世代不同 ⇒ **未验证真实调用序列**，本批只证静态契约。
- 零消费方（反向 grep 六个模块名 **0 命中**）⇒ **落地不接线**，未改装配件、未伪造消费方、未伪造 shim。
- 快照 `git status --porcelain` = **688**（67 修改 / 621 未跟踪 = 609 + 本批 12 文件）；`api/freeImageHostApi.js` md5 仍 `1e0458013f5341c99f21faefc1d34d3f`；未提交、未推送、未构建。i18n 本批未新增待补键。

## 5. 下一批口径

1. **先跑跨树导出闸门再排期**（本批新规则），从 5 件 `src/services` 纯叶与 `api/` 41、`src/modules` 136、全树 286 候选中挑**导出无缺**者。
2. `src/services/providerConnectionAutoVerification.js` 与 `initialThemeBootstrap.js` **改列为「导出受阻」**，不再当 OK 排期；各自前置为 `api/configApi.js` 升代与 `storeRuntimeEffectsService.js` 的 `applyStoredThemeToDom`。
3. `api/configApi.js` 升代是**受保护在装配**：须单独成批 + 真机验证 + 运行授权，且**必须排除** `api/freeImageHostApi.js`。
4. `modelGenerationReadiness.js` 仍卡在 `api/cliTextStream.js` → `api/cliProviderApi.js` 这一对缺失文件。
