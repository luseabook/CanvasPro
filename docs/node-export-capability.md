# 节点导出能力与 `node-export/*` 桥路由（第37批，R02/R05）

对应交接台账 **R02**（`/api/v2/desktop/node-export/*` 六条路由）与 **R05**（成片/剪辑工程导出：本批补单节点保存与"打开剪映"，JianYing 草稿导出见第 6 节）。

## 1. 本批要解决的缺口

第30批把新版 82 条 `/api/v2/desktop/*` 路由整表移植进 `electron/desktopHttpBridge.js`，其中六条 `node-export/*` 直接读**扁平上下文键**：

```js
['/api/v2/desktop/node-export/export-selected', (payload) => context.exportSelectedNodesPackage?.(payload || {})],
['/api/v2/desktop/node-export/save-media',      (payload) => context.saveMediaFile?.(payload || {})],
['/api/v2/desktop/node-export/save-text',       (payload) => context.saveTextFile?.(payload || {})],
['/api/v2/desktop/node-export/save-media-files',(payload) => context.saveMediaFiles?.(payload || {})],
['/api/v2/desktop/node-export/save-timeline',   (payload) => context.saveTimeline?.(payload || {})],
['/api/v2/desktop/node-export/open-jianying',   () => context.openJianying?.()],
```

而本仓 `mainIpcSetup.js` 从未产出这些键，`electron/` 下也没有新版的 `nodeExportController.js` / `nodeExportService.js`——六条路由自第30批以来一直返回 `undefined`（与第34批 `diagnosticsCapabilityOperations`、第35批 `screenshotOverlayController`、第36批 `backgroundCompletionNotification` 同属"已声明路由但无宿主实现"的缺陷模式）。

同时，本仓第10批只做了**批量媒体导出**（`nodeMediaExport:exportSelected`，选父目录 + 原生确认 + sha256 校验 + 清单），渲染器**没有**"把单个节点另存为文件""把文本导出为文件""把多个媒体存到目录""把选中节点打包成 ZIP""打开剪映"这五条通道；`src/services/desktopBridge.js`（新版渲染器消费方）尚未移植，故本批先补齐**宿主侧**。

## 2. 交付文件

| 文件 | 性质 | 作用 |
| --- | --- | --- |
| `electron/nodeExportService.js` | 新增（只依赖 `node:fs`/`node:path`/`node:stream`/`yazl`） | `defaultNodeExportZipName(date)`（`AI-CanvasPro-Export-YYYYMMDD-HHmmss.zip`）、`withNodeExportZipExtension(name)`（去重扩展名）、`saveNodeMediaToFile({outputPath,item,resolveLocalVirtualPath,fetchImpl})`（本地复制或经 `fetchImpl` 拉取远端 → 同目录 `.part` 独占写 → 原子替换，落地后清理暂存）、`exportNodeItemsToZip({outputPath,items,resolveLocalVirtualPath,tempRoot,fetchImpl,now})`（按 kind 分目录 `Text/`/`image/`/`video/`/`audio/`，文本入包为 buffer 且压缩、媒体为 store，包内名经净化并对 Windows 保留名 `CON/PRN/…` 追加 `_`、重名 ` (2)` 递增，最后写入 `manifest.json`）。**sha256** `32b49f75…99c912` |
| `electron/nodeExportController.js` | 新增 | `createNodeExportController({app,dialog,getMainWindow,resolveLocalVirtualPath,showSaveDialog,showOpenDialog,openPath,fetchImpl})` 返回 `exportSelectedNodesPackage`/`saveMediaFile`/`saveTextFile`/`saveMediaFiles`/`openJianying`：绝对路径校验、文件名分隔符拒绝、媒体名/文本名净化（`[\\/:*?"<>|\u0000-\u001f]→_`，160 字符上限）、目录内重名递增、`node-export-state.json` 记住上次导出目录（原子写，非法内容静默回退）、文本 16 MiB 上限、单批媒体 ≤500 项。**sha256** `7a2cbe88…3275f2` |
| `electron/timelineExport/jianyingExportAction.js` | 新增 | `findJianyingExecutable({platform,localAppData,inspect})`（仅 win32 且 `LOCALAPPDATA` 为绝对路径时探测 `JianyingPro\Apps\JianyingPro.exe`）、`createOpenJianyingOperation({openPath,findExecutable})`（`shell.openPath` 返回非空字符串即视为失败，全部异常收敛为结构化 `{success:false,error}`）。**sha256** `7045c746…bd331c` |
| `electron/ipc/nodeExportIpc.js` | 新增 | 移植新版 `nodeExport:*` 六个 IPC（`exportSelected`/`saveMedia`/`saveText`/`saveMediaFiles`/`saveTimeline`/`openJianying`）；**加严**：五个写文件的通道先过 `assertNodeExportSender`（仅主窗口 + 本机应用 URL），缺失能力时抛明确错误而非静默成功。**sha256** `3a9d650d…500d83` |
| `electron/ipc/registerIpcHandlers.js` | 修改 | 注册 `registerNodeExportIpcHandlers`（与既有 `registerNodeMediaExportIpcHandlers` 并存，通道名不同） |
| `electron/ipc/mainIpcSetup.js` | 修改 | 返回对象补 `exportSelectedNodesPackage`/`saveMediaFile`/`saveTextFile`/`saveMediaFiles`/`openJianying` 五个扁平键，使桥的对应路由可用 |
| `electron/main.js` | 修改 | 导入并构造 `nodeExportController = createNodeExportController({ app, dialog, getMainWindow, resolveLocalVirtualPath, openPath })`，在 IPC 上下文里 `...nodeExportController` 展开 |
| `electron/preload.cjs` | 修改 | 新增 `nodeExport` 能力（`exportSelected`/`saveMedia`/`saveText`/`saveMediaFiles`/`saveTimeline`/`openJianying`）；保留原 `nodeMediaExport` 不变 |
| `electron/ipc/mainIpcSetup.test.js` | 修改 | 追加 5 条 `node-export/*` 路由存在性断言，并新增 1 项走桥测试（见第 3 节） |
| `electron/nodeExportService.test.js`(9)、`electron/nodeExportController.test.js`(7)、`electron/timelineExport/jianyingExportAction.test.js`(2) | 新增 | 共 18 项离线测试 |

**有意未移植**（见第 6 节）：`save-timeline` 路由仍返回"不可用"——新版该能力由 `timelineExport/{timelineExportOperation,timelinePlan,jianyingDraft,jianyingDraftLocation,premiereXml}.js` + `toolCapture.js` 共同实现（约 900 行），且与本仓第11批已交付的**加固版** FCP7 XML 导出（`electron/timelineExport/timelineExportService.js`，含源文件哈希校验/2 GiB 上限/原生确认）语义不同；两者合并需要单独一批设计，故本批**不接线、不覆盖**。

## 3. 已执行的离线验证

```
node --check electron/nodeExportService.js electron/nodeExportController.js \
  electron/timelineExport/jianyingExportAction.js electron/ipc/nodeExportIpc.js \
  electron/ipc/mainIpcSetup.js electron/ipc/registerIpcHandlers.js electron/main.js electron/preload.cjs
node --check electron/nodeExportService.test.js electron/nodeExportController.test.js \
  electron/timelineExport/jianyingExportAction.test.js electron/ipc/mainIpcSetup.test.js

node --test electron/nodeExportService.test.js electron/nodeExportController.test.js \
  electron/timelineExport/jianyingExportAction.test.js electron/ipc/mainIpcSetup.test.js
```

- `node --check`：上述 12 个文件全部退出 0。
- 新增测试 **19 项全部通过**（18 项独立文件 + 1 项走桥）。
- 真实往返验证：用 `extract-zip`（既有依赖）解包生成的 ZIP，核对 `image/Shot A.png` 字节、`Text/Narration.txt` 文本、`manifest.json` 的 `packageKind/schemaVersion/exportedAt/items[].archivePath`；重名用例核对 `Same.png` / `Same (2).png` / `Text/Same.txt`。
- skip 语义验证：`UNSUPPORTED_KIND`（`document`）、`EMPTY_TEXT`、`NO_MEDIA_SOURCE`（无来源、`file://` 非 http(s)）、`INVALID_LOCAL_PATH`（虚拟路径解析被拒）、`LOCAL_FILE_MISSING`、`REMOTE_DOWNLOAD_FAILED`（`HTTP 502`）六种原因逐一断言，且全部失败时返回 `code:'NO_EXPORTABLE_ITEMS'`。
- 控制器验证：记住目录写入/复读（含损坏状态文件回退到 `downloads`）、`filename:'a/b'` 被拒、`saveMediaFile` 拒绝 `text` 类、`saveMediaFiles` 取消返回 `{success:false,canceled:true,count:0,files:[]}`。
- `electron/**` 离线测试合计 **295 项 / 294 通过 / 1 失败**（较第36批 +19）。唯一失败仍是既有的 `electron/fullProjectPackageService.test.js`（`missing manifest coverage cannot bind to an existing unrelated local file`，期望 `/未包含/` 实收 `节点ID缺失或重复`），属 R14 第17批既有断言，与本批无关。

**测试用桩说明（不得当成真实行为）**：全部用例使用 stub 文件对话框（`showSaveDialog`/`showOpenDialog`）与 stub `fetchImpl`，**未弹出任何真实原生对话框、未发起任何真实网络请求**；`openJianying` 走桥用例只断言返回结构（本机若无剪映则返回 `{success:false}`，因此不断言 `shell.openPath` 次数）；未在真实应用内导出、未用真实工程素材、未导入剪映/Premiere。

## 4. 安全与行为边界

- 导出路径必须为**绝对路径**；`outputPath`/`directory` 经 `path.resolve` 归一，`filename` 中含 `/`、`\` 或与 `path.basename` 不等时直接抛错。
- `saveNodeMediaToFile` 的本地来源必须经 `resolveLocalVirtualPath` 解析（沿用既有虚拟路径白名单）；解析失败、非普通文件一律拒绝，**不接受任意渲染进程传绝对路径**。
- 远端来源只接受 `http:`/`https:`（`file:`/`data:` 等被 `normalizeRemoteUrl` 丢弃），下载失败按项记入 `skipped` 而**不重试**。
- 写文件一律"同目录 `.part` 独占写（`flag:'wx'`）→ 原子替换 → `finally` 清理暂存"；ZIP 写失败时删除临时目录下的下载件。
- 覆盖已存在文件只发生在用户经**原生"另存为"对话框**明确选定路径之后（与第11批"绝不覆盖"的批量导出不同，两者并存、互不影响）。
- IPC 侧五个写文件通道限主窗口 + 本机应用 URL；桥侧沿用既有每进程随机 token + 仅回环。
- 文本导出上限 16 MiB，单批媒体上限 500 项，均在进入对话框前判定。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内：对图片/视频/音频节点各执行一次"另存为"，核对落盘内容与"上次导出目录"记忆（含重启后仍生效）。
- [ ] 真实文本节点导出为 `.txt`/`.md`，核对编码、扩展名补全与 16 MiB 上限提示。
- [ ] 选中多个节点执行批量下载，核对 ZIP 结构（`Text/`、`image/` 等分目录）、`manifest.json`、重名递增与部分失败时的 `skipped` 列表。
- [ ] 在装有剪映（专业版）的 Windows 机器上点"打开剪映"，核对能真正拉起 `JianyingPro.exe`；无剪映时应返回中文提示而非报错。
- [ ] 经渲染器侧（`window.electronAPI.nodeExport.*` 或新版 `desktopBridge`）端到端调用六个通道，核对错误提示文案。
- [ ] 与第10批 `nodeMediaExport:exportSelected` 同时使用，确认两者互不影响、导出目录互不覆盖。

## 6. 已知未完成

- **`save-timeline` 未接线**：新版由 `timelineExport{tOperation,Plan}` + `jianyingDraft` + `jianyingDraftLocation` + `premiereXml` + `toolCapture` 实现（含"自动定位剪映草稿目录""JianYing 草稿 v2 结构"）；本仓第11批的 `createTimelineExporter` 是**加固版** FCP7 XML 导出，两者需在下一批统一设计（保留哈希校验与原生确认，另辟草稿目录写入路径），本批不覆盖、不重复实现。
- 渲染器侧未移植：新版 `src/services/desktopBridge.js` 中的 `nodeExport.*` 调用方与相应 UI（右键"保存/另存为/批量下载/打开剪映"菜单、进度提示）仍缺；本批只补宿主能力与桥路由。
- `contextMenuShortcutCatalog.js` 中的节点导出右键菜单项（与第36批同源，R22）未移植。
- 新版 `nodeExportService` 的 `defaultNodeExportZipName` 使用 `toISOString()`-无关的本地时间；本批保持新版本地时间语义，未改成 UTC。
