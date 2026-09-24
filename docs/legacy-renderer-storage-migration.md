# 旧渲染器存储迁移（localStorage / IndexedDB）（第38批，R02）

对应交接台账 **R02**（`/api/v2/desktop/storage-migration/*` 两条路由）与 **R14**（旧工程/旧存储兼容性）的宿主侧一半。

## 1. 本批要解决的缺口

`electron/desktopHttpBridge.js` 自第30批起就声明了两条路由：

```
/api/v2/desktop/storage-migration/read      → context.readLegacyRendererStorageMigration?.() || { available: false }
/api/v2/desktop/storage-migration/complete  → context.completeLegacyRendererStorageMigration?.(payload) || { success: false }
```

但本仓从未产出这两个 context 键，旧树也没有 `electron/legacyRendererStorageMigration.js`，因此两条路由一直返回**没有理由字段**的 `{ available: false }` / `{ success: false }`。这与第34批 `diagnosticsCapabilityOperations`、第35批 `screenshotOverlayController`、第36批 `backgroundCompletionNotification`、第37批 `node-export/*` 同属"已声明路由从未真正接线"的同一类缺陷。

新版能力：把旧渲染器（0.4.12 时代）留在 **应用源** 下的 `localStorage` 与三个 IndexedDB 库导出成一份 JSON 暂存文件，再在新版渲染器里解码回填，最后写"已完成"标记。宿主侧负责导出与暂存，渲染器侧负责回填。

## 2. 交付文件

| 文件 | 性质 | 作用 |
| --- | --- | --- |
| `electron/legacyRendererStorageMigration.js` | 新增（仅 `node:fs`/`node:path`，无 Electron 依赖） | `LEGACY_RENDERER_STORAGE_SCHEMA_VERSION = 1`；`buildLegacyRendererStorageMigrationAppUrl(appUrl, {available})` 给应用 URL 追加 `aicLegacyStorageMigration=1|0`；`createLegacyRendererStorageMigration({userDataDir, appUrl, createWindow, exists, readFile, writeFile, rename, unlink, now})` 返回**冻结**的 `{prepare, read, complete, stagingPath, completedPath}`；`__legacyRendererStorageMigrationForTest` 导出内嵌导出脚本与 `readJsonFile` |
| `electron/ipc/mainIpcSetup.js`（改） | 接线 | 扁平对象补 `readLegacyRendererStorageMigration`/`completeLegacyRendererStorageMigration` 两个键（自第30批起缺失） |
| `electron/main.js`（改） | 接线 | 新建 `createLegacyRendererStorageMigration({ userDataDir: USER_DATA_DIR, appUrl: APP_URL })` 并在 IPC context 里以 `() => migration.read()` / `(payload) => migration.complete(payload)` 暴露 |
| `electron/legacyRendererStorageMigration.test.js` | 新增 | 11 项离线测试 |
| `electron/ipc/mainIpcSetup.test.js`（改） | 接线 | +2 条路由存在性断言、+1 项用**真实迁移对象**走桥 |

### 行为细节

- **暂存文件**：`<userData>/legacy-renderer-storage-migration.json`（写时先落 `.tmp` 再 `rename`，避免半成品被读到）；**完成标记**：`<userData>/legacy-renderer-storage-migration.completed.json`（含 `schemaVersion`/`completedAt`/`summary`）。
- **`prepare()`** 的四态：已完成 → `{available:false, reason:'completed'}`；暂存已存在 → `{available:true, reason:'staged'}`（**不开窗口**）；无 `createWindow` → `{available:false, reason:'window-unavailable'}`；否则在应用源窗口里 `loadURL('electron/legacyStorageMigration.html')` 并 `executeJavaScript(导出脚本, true)`，schema 不符即抛 `unsupported schema`，`finally` 里必然 `destroy()` 窗口。
- **`read()`**：已完成 → `completed`；暂存缺失/不可解析 → `not-prepared`；否则 `{available:true, payload}`。
- **`complete(summary)`**：写完成标记（非对象 summary 收敛为 `{}`）并尽力删除暂存文件（删不掉不报错，保持幂等）。
- **内嵌导出脚本**：在目标窗口内读取 `localStorage` 全量 + 三个库 `TapNowV2Cache/workspace`、`TapNowCanvasDB/images|thumbnails`、`AICanvasStoryboard3DAssets/assets`；二进制（`Blob`/`ArrayBuffer`/`TypedArray`）转 base64 并打 `__aicStorageType` 标签，`Date` 打标签；单条二进制上限 **16 MiB**、非持久库累计上限 **96 MiB**，超限或编码失败记入 `skipped` 而**不中断**整体导出。

## 3. 已执行的离线验证

```
node --check electron/legacyRendererStorageMigration.js electron/legacyRendererStorageMigration.test.js \
  electron/ipc/mainIpcSetup.js electron/ipc/mainIpcSetup.test.js electron/main.js

node --test electron/legacyRendererStorageMigration.test.js electron/ipc/mainIpcSetup.test.js
```

- `node --check`：5 个文件全部退出 0。
- 新增测试 **12 项全部通过**：`legacyRendererStorageMigration` 11 项 + `mainIpcSetup` 走桥 +1 项。
- `electron/**` 离线测试合计 **307 项 / 306 通过 / 1 失败**（较第37批 +12）。唯一失败仍是既有的 `electron/fullProjectPackageService.test.js`（`missing manifest coverage cannot bind to an existing unrelated local file`，断言期望 `/未包含/` 实际先命中"节点ID缺失或重复"），归 R14 第17批，与本批无关。

**测试用桩说明（不得当成真实行为）**：`prepare()` 的窗口用 stub（`loadURL`/`executeJavaScript` 直接返回 payload），**没有**真实 `BrowserWindow`、**没有**加载真实 `legacyStorageMigration.html`、**没有**读写真实 localStorage/IndexedDB；内嵌脚本只用 `new Function` 证明它可解析且会自调用（在 Node 下因缺 `localStorage` 而拒绝）。

## 4. 安全与行为边界

- 迁移对象以 `<userData>` 为根，`userDataDir` 缺失时回落 `process.cwd()` 并 `path.resolve` 归一；只写两个固定文件名，不接受外部路径。
- 读取的渲染数据仅用于**在应用源内回填**，宿主不做解释；`read()` 返回的 payload 原样交给渲染器。
- 暂存与完成标记都是**原子写**（`.tmp` + `rename`）；`complete()` 先写标记再删暂存，重复调用安全。
- 导出脚本只在**应用源**窗口执行（`new URL('electron/legacyStorageMigration.html', appUrl)`），不会去读其他源；`executeJavaScript` 第二参数为 `true`（userGesture）。
- 桥的两条路由仍受**同一进程桥 token** 约束，不是网络暴露面。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内：有旧版渲染器存储时，`prepare()` 真的打开隐藏窗口并落出暂存 JSON（核对 `localStorage` 键与三个 IndexedDB 库的 `stores`/`keyPath`/`autoIncrement`）。
- [ ] 确认渲染器回填后 `complete()` 落出完成标记、暂存文件被删除，且再次启动 `read()` 返回 `reason:'completed'` 不再重复迁移。
- [ ] 核对损坏/半写暂存文件、无 `indexedDB.databases()` 的运行时、以及某库打不开时 `skipped` 的文案。
- [ ] 端到端核对渲染器侧（见第6节）经 `desktopBridge.storageMigration` 的 `read`/`complete` 调用与 `aicLegacyStorageMigration` URL 参数联动。

## 6. 已知未完成

- **`prepare()` 未接线到启动流程**：新版只在 **chrome-shell 外部浏览器运行时**的启动路径里调用 `prepare()` 并用 `buildLegacyRendererStorageMigrationAppUrl(APP_URL, result)` 改写后续 `startChromeShellRuntime` 的 `appUrl`。本仓未移植 chrome-shell（R15），因此 `prepare()` 与 URL 参数改写**有意未接入**，`read()` 目前对未迁移用户返回 `{available:false, reason:'not-prepared'}`（比原 `{available:false}` 多了真实原因）。还原该链路须先完成 R15。
- **`electron/legacyStorageMigration.html` 未移植**：`prepare()` 加载的页面属于新版 `resources/webapp`，本仓没有该资产；未移植前 `prepare()` 只能靠注入 `createWindow` 才可离线验证。
- **渲染器侧未移植**：新版 `src/services/legacyRendererStorageMigration.js`（`decodeLegacyStorageValue`/`applyLegacyLocalStorage`/`importLegacyIndexedDatabases`/`migrateLegacyRendererStorageIfNeeded`）与 `src/services/legacyStorageMigrationDeadline.js` 依赖未移植的 `src/services/desktopBridge.js`（R15/R02 渲染器客户端）。本批只交付宿主侧。
- 本批**不改**第23批的**用户数据目录**文件迁移（`file_save_migration`/`legacy_storage_import`，那是后端侧搬 data 目录），两者是不同层：本批针对**渲染器 Web 存储**（localStorage/IndexedDB）。
