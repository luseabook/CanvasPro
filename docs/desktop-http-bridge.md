# 桌面 HTTP 桥（R02）— 移植说明与验收欠项

本文对应交接台账 R02 与第三十至四十批交付。**结论先行：桥与能力操作层已按可读源码移植、已接入既有 IPC 层并执行了 206 项离线测试（第30批 30 项 + 第31批 34 项 + 第32批 20 项 + 第33批 21 项 + 第34批 11 项 + 第35批 11 项 + 第36批 30 项 + 第37批 19 项 + 第38批 12 项 + 第39批 11 项 + 第40批 7 项）；`agent-information`/`agent-skills`/`project`/`diagnostics`/`notification-sound`/`screenshot`/`notification`/`node-export`（含 `save-timeline`）/`storage-migration`/`asset/consume-updates`/`custom-ai-apps` 等路由已可用；但新版真正的消费者（chrome-shell 外部浏览器运行时 + 渲染器侧客户端）尚未移植，其余路由依赖的能力对象仍未齐，因此这是地基，不是"桌面桥已全部可用"。**

## 1. 为什么需要这一层

旧项目（0.4.12）渲染器直接访问本地 Python HTTP 服务；0.7.16 新增了一条**宿主通道**：渲染器 → 本地回环 HTTP（`/api/v2/desktop/*`）→ Electron 主进程。全项目检索旧树 `api/v2/desktop` 出现 **0** 次、`desktopHttpBridge` **0** 次，属地基级缺口：不补它，后续桌面能力只能零散加 IPC。

新版的可复用设计（本批照搬）：

- 能力逻辑抽成**可注入对象**（capability operations），与传输无关；
- `ipcMain.handle` 与 HTTP 桥是它的**两个消费者**；
- `buildMainIpcHandlerDeps()` 产出**同一份**扁平对象，同时喂给两条通道。

因此"移植"本质是把原 `electron/ipc/*.js` 的内联逻辑搬迁到 `electron/*CapabilityOperations.js`，原 IPC 变成薄适配器。

## 2. 本批落地内容

| 文件 | 作用 |
| --- | --- |
| `electron/desktopHttpBridge.js` | 82 路由 Map；POST-only；`x-aic-desktop-bridge-token` 校验；回环监听随机端口；关闭含宽限与强制回收 |
| `electron/clipboardCapabilityOperations.js` | 剪贴板文本/图片/文件引用（含自定义格式与纯文本回退） |
| `electron/secureSettingsCapabilityOperations.js` | 安全存储 get/set/delete 与可用性降级 |
| `electron/diagnosticsCapabilityOperations.js` | 诊断包另存为 + 打开日志目录 |
| `electron/shellItemRevealer.js` | Windows 独立 explorer 窗口定位/打开，失败回退 Electron shell |
| `electron/customAiAppStorage.js` | 自定义 AI 应用按来源类型分文件读写、原子写、损坏降级 |
| `electron/ipc/clipboardIpc.js`（改） | 改为薄适配器，委托 `clipboardOperations`，IPC 名称与返回不变 |
| `electron/ipc/mainIpcSetup.js`（改） | 新增 `clipboardOperations`/`secureSettingsOperations` 键，旧键全保留 |
| `electron/ipc/desktopBridgeIpc.js` | `desktop-bridge:start|status|stop`，显式启停 |
| `electron/ipc/registerIpcHandlers.js`（改） | 注册上一项，并把 `buildMainIpcHandlerDeps()` 结果作为 `capabilityHandlers` |

第31批追加（R02 补齐）：

| 文件 | 作用 |
| --- | --- |
| `electron/agentInformationCapabilityOperations.js` | SSRF 加固的只读 URL 抓取（私网/保留地址拦截、DNS 固定直连、重定向/编码/类型/大小/超时/取消） |
| `electron/ipc/agentInformationIpc.js` | `agentInformation:readUrl` IPC 适配器 |
| `src/utils/diagnosticOperationRecorder.js` | `createDiagnosticOperation` 统一发 `started/canceled/succeeded/failed` + `elapsedMs`/`failure` |
| `electron/ipc/mainIpcSetup.js`（改） | 追加 `agentInformationOperations` 键（无新增 context 依赖） |

第32批追加（R02 Agent Skill 链路）：

| 文件 | 作用 |
| --- | --- |
| `src/modules/agent/agentSkillPackage.js` | 零 import 纯函数：SKILL.md YAML frontmatter 解析、字段校验/规范化、正文作为 `instructions`、`managed-by: shuo-canvas` 序列化回写 |
| `electron/agentSkillCapabilityOperations.js` | `list`/`openRoot`/`installFromFolder`/`saveManagedDefinition`/`deleteInstalled`；路径越界守卫（`isInsideRoot` + `dirname === root`、拒符号链接）、暂存目录原子 `rename`、资源大小上限、删除需 `confirmed:true` |
| `electron/ipc/agentSkillsIpc.js` | `agentSkills:list|openRoot|installFromFolder|saveManaged|deleteInstalled` 五个 IPC 适配器 |
| `electron/ipc/mainIpcSetup.js`（改） | 追加 `agentSkillOperations` 键（`getUserDataRoot` 默认回落 `app.getPath('userData')`） |
| `electron/ipc/registerIpcHandlers.js`（改） | 注册 `agentSkillsIpc` |
| `electron/main.js`（改） | 新增 `showOpenDialog`（包装 `dialog.showOpenDialog(mainWindow, options)`）与 `openFolder`（包装 `openShellFolder`）两个 context 键 |

第33批追加（R02 `projectOperations`）：

| 文件 | 作用 |
| --- | --- |
| `electron/projectCapabilityOperations.js` | `open`/`save`/`openPath`/`exportPackage`/`importPackage`/`setUnsavedState`/`listRecent`/`removeRecent`/`consumeExternalOpenRequests`/`writeRecoverySnapshot`/`getRecoverySnapshotInfo`/`readRecoverySnapshot`/`clearRecoverySnapshot`；`open`/`save` 用 `createDiagnosticOperation` 发 `project.desktop_*` 事件 |
| `electron/ipc/mainIpcSetup.js`（改） | 追加 `projectOperations` 键；`forwardPackageOperation` 把旧控制器的 `{sender}` 约定适配成桥的 `{onProgress}` |
| `electron/main.js`（改） | 追加 7 个 context 键：`getCanvasProjectDir`、`showSaveDialog`、`getRecoverySnapshotPath`、`writeRecoverySnapshotFile`、`getRecoverySnapshotFileInfo`、`readRecoverySnapshotFile`、`removeRecoverySnapshotFile`（删除经 `clearRecoverySnapshotIfMatches` 身份校验） |

第34批追加（R02 `diagnosticsOperations` + R17 通知音播放）：

| 文件 | 作用 |
| --- | --- |
| `electron/ipc/mainIpcSetup.js`（改） | 追加 `diagnosticsOperations`（`createDiagnosticsCapabilityOperations({diagnostics, logDir, showSaveDialog, openFolder})`）与 `playNotificationSound` 两个键。注意第30批移植的 `diagnosticsCapabilityOperations.js` 在此之前**只有测试引用**，是零生产引用的孤岛，本批才真正接线 |
| `electron/notificationSoundFiles.js`（改） | 保留原 `listNotificationSoundMp3Files`；新增 `playNotificationSoundFile`（绝对/应用相对路径解析与越界拒绝、音量收敛、非 win32 不 spawn、win32 PowerShell `MediaPlayer` 播放、`spawn-error`/`player-exit` 失败映射 + `notification_sound.play_failed` 日志）；`createSystemNotificationSoundFileService` 扩充 `playNotificationSound`（`system:true` 走 `shell.beep()`）与列表项 `playbackUrl` |
| `electron/diagnostics.js`（改） | 追加 `getSuggestedPackagePath(now)`（复用既有 `resolveDownloadsDir`/`timestampForFilename`，与 `createPackage` 的命名一致）——`diagnosticsOperations.createPackage` 的 `defaultPath` 依赖它，缺失会直接 `TypeError` |
| `electron/ipc/fileIpc.js`（改） | 新增 `notificationSound:play` IPC 适配器（能力缺失时抛“当前环境不支持播放提示音”） |
| `electron/preload.cjs`（改） | `notificationSound` 能力补 `play: (payload) => invoke('notificationSound:play', payload)` |
| `electron/main.js`（改） | `createSystemNotificationSoundFileService` 补 `beep: () => shell.beep()` 与 `logEvent: logDiagnosticEvent`；因 `...systemNotificationSoundFiles` 已展开进 context，`playNotificationSound` 无需另加键 |
| `src/services/completionSoundService.js`（改） | 补 `playNativeCompletionSound`（经 `window.electronAPI.notificationSound.play`）并在**浏览器 `Audio` 播放失败后**回落原生播放；`previewCompletionSound`/`playCompletionSound` 无需改动 |

第35批追加（R02 三条 `screenshot/*` 路由 + R17 可配置全局截图快捷键）：

| 文件 | 作用 |
| --- | --- |
| `electron/screenshotShortcutAccelerators.js`（新） | 零 import 纯函数：快捷键 token 归一（`ctrl/control/cmdOrCtrl→CommandOrControl`、`shift`、`alt/option`、`space`/`backquote`、`f1..f24`、字母大写、标点别名）、`normalizeScreenshotAcceleratorKeys`（修饰键顺序固定为 `CommandOrControl→Shift→Alt`，必须恰有一个主键）、`parseScreenshotShortcutPayload`（`{keys}`/`{accelerator}` → `{ok:true,accelerator,keys}` 或 `{ok:false,reason:'invalid-shortcut'}`）。**故意不映射** `meta/cmd/command`（截图控制器不接受，区别于 `contextMenuShortcutAccelerators.js`） |
| `electron/screenshotCaptureEventQueue.js`（新） | 零 import 纯函数：`createBoundedCaptureEventQueue(limit=8)` 有界截图事件队列，`push` 超限丢最旧、`consume` 取走即清、非法上限回落 8、实例互不影响 |
| `electron/screenshotOverlayController.js`（重写） | 去 `_0x` 命名，补 `configureGlobalScreenshotShortcut`/`consumeGlobalScreenshotCaptureEvents`/`getGlobalScreenshotShortcutStatus` 三个键；`registerGlobalShortcut` 改为**按键位感知**（同键早返回、先注销旧键再注册、写 `shortcutStatus`、预热 overlay、日志 `screenshot.global_shortcut_registered|register_failed`）；`installGlobalScreenshotShortcut` 在原生 helper 启动中时置 `reason:'native-helper-starting'`；`deliverCaptureResult` 写 `nativeImage`+`clipboard`（`reverse-prompt` 分支**不写**剪贴板并聚焦画布）、事件带 `pngBase64/mimeType/source/createdAt` 后入有界队列并发 `screenshot:globalCaptureReady`；`captureDesktopDisplay` 增返 `cursor:{screenX,screenY,x,y}`；原生 helper 环境补 `AICANVAS_CURSOR_DIR`/`AICANVAS_THEME_TOKENS_PATH`/`AICANVAS_SCREENSHOT_ACCELERATOR`；`globalShortcutApi`/`focusCanvas` 可注入 |
| `electron/ipc/screenshotIpc.js`（改） | 新增 `screenshot:updateGlobalShortcut` 适配器（能力缺失返回 `{ok:false,reason:'not-supported'}`） |
| `electron/ipc/mainIpcSetup.js`（改） | 展平对象补 `configureGlobalScreenshotShortcut`/`consumeGlobalScreenshotCaptureEvents`/`getGlobalScreenshotShortcutStatus` 三个键 |
| `electron/ipc/mainIpcSetup.test.js`（改） | +1 项走桥验证三条 `screenshot/*` 路由取到桩控制器；补 4 条路由存在性断言 |
| `electron/preload.cjs`（改） | `screenshot` 能力补 `updateGlobalShortcut: (payload) => invoke('screenshot:updateGlobalShortcut', payload)` |
| `electron/main.js`（改） | 控制器构造补 `focusCanvas: () => focusMainWindow()` |
| `src/modules/shortcuts.js`（改） | 补 `_syncCanvasScreenshotShortcutToElectron()`（读 `_shortcuts['canvas-screenshot'].keys` 或默认值，经 `window.electronAPI.screenshot.updateGlobalShortcut({keys})` 同步，失败只 `console.warn`）；挂到 `_syncShortcutsToGlobal()` 尾部，随载入/保存/应用预设/录制完成四条既有路径触发 |
| `docs/screenshot-global-shortcut.md`（新） | R17 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

第36批追加（R02 四条 `notification/*` 路由 + R17 完成通知点击回跳与 `Alt+E` 快捷键）：

| 文件 | 作用 |
| --- | --- |
| `electron/contextMenuShortcutAccelerators.js`（新） | 零 import 纯函数 `normalizeContextMenuAccelerator(value)`：修饰键别名含 `meta/cmd/command/cmdOrCtrl/cmdOrControl→CommandOrControl`（与第35批截图版**有意不同**，截图控制器不接受 meta/cmd）、`alt/option`、`space`、`f1..f24`、单字母数字大写、命名键与标点别名；修饰键顺序固定 `CommandOrControl→Shift→Alt`；最多 4 键且必须恰有一个主键，否则 `''`。**未移植**新版另一导出 `normalizeWebPreviewContextMenuShortcuts`（依赖 R22 的 `contextMenuShortcutCatalog`） |
| `electron/notificationShortcutController.js`（新） | `createNotificationShortcutController({globalShortcutApi, activate})`：默认 `Alt+E`；同键早返回；换键先注销旧键；非法组合 `{success:false,reason:'invalid-shortcut'}`；注册被拒/抛错 `{success:false,reason:'shortcut-unavailable'}`；空数组取消注册；`dispose()` 幂等 |
| `electron/completionNotificationNavigation.js`（新，零 import） | `remember`（待处理导航上限 40，溢出结算最旧并 `release(true)`）、`activate`/`activateLatest`（恰一次 `release`、异步 `focusMainWindow` 失败记 `notification.generation_complete_focus_failed`、`onClick` 发事件入上限 40 的队列）、`acknowledge`（按 `notificationId` 结算）、`consumeClickEvents`（取走即清）、`dispose` |
| `electron/backgroundCompletionNotification.js`（重写） | 新增 `updateGlobalShortcut`/`acknowledge`/`activateLatest`/`consumeClickEvents`/`dispose`；新增依赖 `onClick`/`globalShortcutApi`/`logEvent`/`resolveNotificationIconPath`/`platform`/`setTimeoutFn`/`clearTimeoutFn`；窗口聚焦或 `Notification.isSupported()` 为假时跳过；win32 `toastXml`（长时/静音/XML 转义/图标仅图片扩展名且经 `resolveLocalVirtualPath`）；`show` 后 10s 自动关闭；`failed` 记 `notification.generation_complete_failed` |
| `electron/ipc/appIpc.js`（改） | 新增 `notification:updateGlobalShortcut`、`notification:acknowledge` |
| `electron/ipc/mainIpcSetup.test.js`（改） | +4 条 `notification/*` 路由存在性断言、+1 项用**真实 notifier** 走桥的验证 |
| `electron/main.js`（改） | electron 导入补 `globalShortcut`；notifier 构造补 `globalShortcutApi`/`onClick`（向主窗口发 `notification:generationCompleteClicked`）/`logEvent`/`resolveNotificationIconPath`；`will-quit` 追加 `backgroundCompletionNotifier.dispose()` |
| `electron/preload.cjs`（改） | `notification` 能力补 `updateGlobalShortcut`/`acknowledge`/`onGenerationCompleteClick` |
| `docs/completion-notification-navigation.md`（新） | R17 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

第37批追加（R02 五条 `node-export/*` 路由 + R05「打开剪映」）：

| 文件 | 作用 |
| --- | --- |
| `electron/nodeExportService.js`（新） | 零 Electron 依赖（仅 `node:fs`/`node:path`/`node:stream`/`yazl`）：`saveNodeMediaToFile`（单选另存为）、`exportNodeItemsToZip`（选中节点打包 ZIP）；`manifest.json`（`kind:'aiCanvas.nodeExport'`、schema 1）最后写入；归档路径经 `sanitizeArchiveBaseName`（非法字符→`_`、折叠空白、120 字上限、Windows 保留名 `CON/PRN/…` 追加 `_`）与 `allocateArchivePath`（同类型目录内 ` (2)` 递增）；跳过原因 `UNSUPPORTED_KIND`/`EMPTY_TEXT`/`INVALID_LOCAL_PATH`/`LOCAL_PATH_NOT_FILE`/`LOCAL_FILE_MISSING`/`NO_MEDIA_SOURCE`/`REMOTE_DOWNLOAD_FAILED`；无可导出项返回 `code:'NO_EXPORTABLE_ITEMS'` |
| `electron/nodeExportController.js`（新） | `createNodeExportController({app,dialog,getMainWindow,resolveLocalVirtualPath,showSaveDialog,showOpenDialog,openPath,fetchImpl})` 产出 `exportSelectedNodesPackage`/`saveMediaFile`/`saveTextFile`/`saveMediaFiles`/`openJianying` 五个键（第39批补第六个键 `saveTimeline`，见下）；文件名经 `assertAbsolutePath`/`assertFilename`（拒 `/`、`\`、basename 不符）与 `sanitizeMediaFilename`/`sanitizeTextFilename`（160 字上限）；文本上限 16 MiB、多文件上限 500；默认目录 `downloads||temp||cwd` 并原子写 `node-export-state.json` 记忆；写入用 `.part` + `wx` + 原子 rename |
| `electron/timelineExport/jianyingExportAction.js`（新） | `findJianyingExecutable({platform,localAppData,inspect})`（仅 win32 且 `localAppData` 为绝对路径时探 `JianyingPro\Apps\JianyingPro.exe`）与 `createOpenJianyingOperation({openPath,findExecutable})`（`openPath` 非空返回即视为失败；任何错误统一回落 `{success:false,error:'暂时无法自动打开剪映，请手动打开。'}`） |
| `electron/ipc/nodeExportIpc.js`（新） | `nodeExport:exportSelected|saveMedia|saveText|saveMediaFiles|saveTimeline|openJianying` 六个 IPC；前五个经 `assertNodeExportSender`（`getNodeExportWindow` + `isNodeExportAppUrl`）**fail-closed** 校验发送方，`openJianying` 不校验（与新版一致） |
| `electron/ipc/registerIpcHandlers.js`（改） | 注册 `registerNodeExportIpcHandlers` |
| `electron/ipc/mainIpcSetup.js`（改） | 展平对象补 `exportSelectedNodesPackage`/`saveMediaFile`/`saveTextFile`/`saveMediaFiles`/`openJianying` 五个键（第30批起这五个键从未被生产代码产出，五条路由恒空转） |
| `electron/main.js`（改） | 新建 `createNodeExportController({app,dialog,getMainWindow,resolveLocalVirtualPath,openPath: (t)=>shell.openPath(t)})` 并 `...nodeExportController` 展开进 IPC context |
| `electron/preload.cjs`（改） | 新增 `nodeExport` 能力：`exportSelected`/`saveMedia`/`saveText`/`saveMediaFiles`/`saveTimeline`/`openJianying` |
| `electron/ipc/mainIpcSetup.test.js`（改） | +5 条 `node-export/*` 路由存在性断言、+1 项用**真实控制器**走桥的验证（`export-selected` 真写 `pkg.zip`，其余三条返回 `{success:false,canceled:true,…}`） |
| `docs/node-export-capability.md`（新） | R02/R05 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

第38批追加（R02 两条 `storage-migration/*` 路由 + R14 旧渲染器存储兼容性）：

| 文件 | 作用 |
| --- | --- |
| `electron/legacyRendererStorageMigration.js`（新） | 仅 `node:fs`/`node:path`、无 Electron 依赖：`buildLegacyRendererStorageMigrationAppUrl(appUrl,{available})` 给应用 URL 追加 `aicLegacyStorageMigration=1|0`；`createLegacyRendererStorageMigration({userDataDir,appUrl,createWindow,exists,readFile,writeFile,rename,unlink,now})` 返回**冻结**的 `{prepare,read,complete,stagingPath,completedPath}`——`prepare()` 四态（`completed`/`staged`/`window-unavailable`/应用源窗口导出后 `prepared`，写 `.tmp` 再 `rename`，schema 不符抛 `unsupported schema`，`finally` 必 `destroy()` 窗口）；`read()` 返回 `{available:true,payload}` 或 `{available:false,reason:'completed'|'not-prepared'}`；`complete(summary)` 原子写完成标记并尽力删除暂存；内嵌导出脚本读取 `localStorage` 全量与 `TapNowV2Cache`/`TapNowCanvasDB`/`AICanvasStoryboard3DAssets` 三库，二进制转 base64 打 `__aicStorageType` 标签，单条 16 MiB / 非持久库累计 96 MiB 上限，超限记 `skipped` 不中断 |
| `electron/ipc/mainIpcSetup.js`（改） | 扁平对象补 `readLegacyRendererStorageMigration`/`completeLegacyRendererStorageMigration` 两个键（自第30批起这两条路由恒返回无理由的 `{available:false}`） |
| `electron/main.js`（改） | 新建 `createLegacyRendererStorageMigration({userDataDir: USER_DATA_DIR, appUrl: APP_URL})`，并在 IPC context 以 `() => migration.read()` / `(payload) => migration.complete(payload)` 暴露 |
| `electron/ipc/mainIpcSetup.test.js`（改） | +2 条 `storage-migration/*` 路由存在性断言、+1 项用**真实迁移对象**走桥（`not-prepared` → 手写暂存 → `available:true` → `complete` → `completed`） |
| `docs/legacy-renderer-storage-migration.md`（新） | R02/R14 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

第39批追加（R02 `node-export/save-timeline` 路由 + 既有时间线导出链路接线）：

| 文件 | 作用 |
| --- | --- |
| `electron/timelineExport/timelineExportOperation.js`（新） | `createTimelineExportOperation({dialog,getWindow,showOpenDialog,showMessageBox,getDefaultDirectory,rememberDirectory,getRoots,resolveLocalVirtualPath,getRuntimeToolOrFallback,probe,confirmExport})`：对新版同名工厂的可读移植，但**复用本仓已验证的 `createTimelineExporter`**（不重写媒体复制/清单/XML 发布逻辑）；`buildTimelineExportConfirmation({directory,plan,totalBytes})` 抽出确认对话框文案（原样保留"不是成片/不覆盖/不联网/不转码/无执行中取消"提示）；目录选择经注入的 `showOpenDialog`，缺省回落 `dialog.showOpenDialog(getWindow(), options)`（窗口为 `null` 或 `getWindow()` 抛错时退化为无父窗口单参调用）；成功导出后仅记忆**用户所选父目录**（不是新建的导出子目录），记忆失败不吞掉已完成结果；返回契约与既有 `timelineExport:export` 完全一致（`status: complete|cancelled|failed`） |
| `electron/nodeExportController.js`（改） | 增参 `getNodeExportRoots`/`getRuntimeToolOrFallback`，返回值补第六个键 `saveTimeline`（此前该键从未被生产代码产出，`nodeExport:saveTimeline` IPC 恒抛"当前环境不支持导出剪辑工程"、桥路由恒 `undefined`） |
| `electron/ipc/timelineExportIpc.js`（改） | 确认对话框文案改为复用 `buildTimelineExportConfirmation`，消除两处重复；仍保留 `dialog` + `assertNodeExportSender` + `assertActive(event)` 的发送方与窗口失效校验 |
| `electron/main.js`（改） | 抽出 `getNodeExportRoots()`；`createNodeExportController` 增传 `getNodeExportRoots`/`getRuntimeToolOrFallback`；IPC context 里原内联的 roots 字面量改为引用同一函数（`...nodeExportController` 展开即带出 `saveTimeline`） |
| `electron/ipc/mainIpcSetup.js`（改） | 扁平对象补 `saveTimeline` 键（自第30批起桥路由、自第37批起 IPC 都声明的同一缺陷） |
| `electron/timelineExport/timelineExportOperation.test.js`（新） | 10 项：确认文案取自解析后的 plan、真实导出（注入对话框）并只记忆父目录、无记忆目录时省略 `defaultPath`、取消目录/拒绝确认不留痕、元数据不支持时任何对话框都不弹、记忆失败不隐藏已完成导出、二次取消不追加记忆、`dialog` 回落带上活动父窗口、窗口查询为 `null`/抛错时退化为单参调用 |
| `electron/nodeExportController.test.js`（改） | +1 项 `saveTimeline` 接线验证（非法请求走到真实模型校验、无可用 ffprobe 时在选目录之前失败）、暴露断言补 `saveTimeline` |
| `electron/ipc/mainIpcSetup.test.js`（改） | +1 条 `node-export/save-timeline` 路由存在性断言；既有 node-export 桥验证扩展为同时走 `save-timeline`（空请求 → 模型校验错误；非法/缺运行时 → `第 1 段：未找到 ffprobe`） |
| `docs/timeline-export-operation.md`（新） | R02 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

第40批追加（R02 `asset/consume-updates` 路由 + `custom-ai-apps/read|write` 数据目录）：

| 文件 | 作用 |
| --- | --- |
| `electron/assetUpdateEventBuffer.js`（新） | **零 import**：`ASSET_UPDATE_EVENT_LIMIT = 200`；`createAssetUpdateEventBuffer({limit=200})` 返回 `{push,consume}`——`push` 忽略假值（对应新版 `if (!asset) return`）、超限 `shift` 丢**最旧**；`consume` = `splice(0,length)` 取走即清；非有限或非正 `limit` 回落 200。对应新版 `assetCapabilityOperations.js` 内部的 200 条上限数组 |
| `electron/main.js`（改） | import 新模块；`let` 状态区新增 `assetUpdateEvents = createAssetUpdateEventBuffer()`；`sendAssetUpdated` 改为**只构造一次** `buildAssetResponse(record)`，同一对象既 `push` 进缓冲又发 `asset:updated` IPC；IPC context 补 `consumeAssetUpdateEvents: () => assetUpdateEvents.consume()` 与既有 `getDataDir`（此前 `custom-ai-apps/*` 因缺该键必然抛 `data directory is unavailable`） |
| `electron/ipc/mainIpcSetup.js`（改） | 扁平对象补 `consumeAssetUpdateEvents`/`getDataDir` 两个 pass-through 键（自第30批起 `asset/consume-updates` 恒返回 `[]`、`custom-ai-apps/*` 恒报错） |
| `electron/assetUpdateEventBuffer.test.js`（新） | 5 项：顺序与取走即清、忽略 `null`/`undefined`/`''`、上限 200 丢最旧（压 205 条后首条为第 6 条）、`limit:0`/`NaN` 回落 200、实例互不共享 |
| `electron/ipc/mainIpcSetup.test.js`（改） | +3 条路由存在性断言；+2 项：**真实缓冲 + 真实临时数据目录**走桥（drain 两条再次为空、`custom-ai-apps` 读写回环）、未接线时的诚实降级（`[]` 与 `data directory is unavailable`） |
| `docs/asset-update-events.md`（新） | R02 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

第42批追加（R02/R12 **渲染器侧可达性**：`customAiApps:read|write` IPC + preload 三能力组）：

> 本批**不改桥**（82 路由的声明、键读取与行为全部不变，`desktopHttpBridge.js` 未修改）。补的是**同一能力的另一条末端路径**——桥的消费者是 chrome-shell 外部运行时（未移植，R15），而本树自己的渲染器走 `window.electronAPI`。

| 文件 | 作用 |
| --- | --- |
| `electron/ipc/customAiAppIpc.js`（新） | `registerCustomAiAppIpcHandlers({ ipcMain, getCustomAiAppStorage, getDataDir })`：`resolveStorage()` 优先注入的 `getCustomAiAppStorage()`，否则首次调用时懒建 `createCustomAiAppStorage({ getDataDir })` 并复用；注册 `customAiApps:read|write`（此前旧树**根本没有这两个通道**） |
| `electron/ipc/registerIpcHandlers.js`（改） | import + 在 `registerCanvasVisualSnapshotIpcHandlers` 之后调用（与新版调用顺序一致），把含 `getDataDir` 的同一份依赖对象传入 |
| `electron/preload.cjs`（改） | 首次暴露 `electronAPI.customAiApps`（`read`/`write`）、`electronAPI.agentInformation`（`readUrl`）、`electronAPI.agentSkills`（`list`/`openRoot`/`installFromFolder`/`saveManaged`/`deleteInstalled`）——字段与通道名逐一对应新版 `buildElectronCapability()`；此前 `agentInformation:readUrl`（第31批注册）与 `agentSkills:*` 5 通道（第32批注册）**对本树渲染器完全不可见** |
| `electron/ipc/customAiAppIpc.test.js`（新） | 6 项：注册面、注入 accessor 优先（`getDataDir` 被调用即抛错）、`write` 缺参归一、真临时目录懒建读写往返、空 `getDataDir` 同步抛错、坏文件降级空库 |
| `docs/custom-ai-app-ipc.md`（新） | R02/R12 专题：缺口、交付文件、安全边界、已执行离线验证、验收清单、已知未完成 |

## 3. 安全边界（已实现，须验收）

- 仅监听 `127.0.0.1`，端口由系统分配；**只**在渲染进程显式调用 `desktop-bridge:start` 时开启。
- 每进程 `randomBytes(32).toString('hex')` token；缺失 token 一律 403（空 token 时桥拒绝全部请求）；非 POST 一律 405。
- 请求体上限 64 MiB，超限 413；坏 JSON 500 且不中断服务；未知路由 404。
- `asset|file:import-local`：只接受已暂存 `localPath`，必须经 `resolveLocalVirtualPath` 白名单解析；**显式拒绝** `path`/`bytes` 原样透传，避免渲染器越过暂存机制直接指定文件系统路径。
- `shell:show-item-in-folder`/`open-known-folder`：必须经 `resolveLocalVirtualPath`/`resolveKnownFolder` 解析，否则拒绝。
- 包进度事件环形缓冲上限 80 条，`consume` 取走即清，避免无界增长。
- 不从节点/快照复制 API Key、服务 URL 或任意参数到新请求。
- `agent-information/read-url`（第31批）：仅 `http`/`https` 且端口限 `80`/`443`；拒绝 URL 内嵌凭据、`localhost`/`*.local`/`*.internal`/`*.home`/`*.lan`，以及所有解析到私网/保留段（含 IPv6）的地址；**DNS 解析后固定 IP 直连**（保留 `servername`/SNI + `rejectUnauthorized:true`）以防 DNS 重绑定；重定向上限 4 且逐跳重新做私网校验；只接受 `Accept-Encoding: identity` 与文本类内容类型；1 MiB / 60000 字符 / 15 s 上限，结果标记 `trust:'untrusted_external'`。
- `notification-sound/play`（第34批）：这是全桥**唯一会 spawn 外部进程**的路由。风险控制是——文件路径先经 `normalizeText`（去 `\0`、截断 1024）与 `statSync` 必须为文件；相对路径必须落在 `appRoot` 内（否则抛“提示音相对路径超出应用目录”）；传入命令的 `file://` URI 做 PowerShell 单引号转义（`'` → `''`）；只 spawn 固定命令 `powershell.exe` 且参数为常量数组，**不拼接**用户输入到 shell 字符串；`stdio:'ignore'` + `windowsHide:true`；非 win32 直接拒绝。取走该路由的能力仍需**同一进程内的桥 token**（本机渲染器），不是网络暴露面。
- `node-export/*`（第37批）：用户可控的输出文件名经 `assertAbsolutePath`（必须绝对）与 `assertFilename`（拒 `/`、`\`、basename 不符）双重校验，再由 `sanitizeMediaFilename`/`sanitizeTextFilename` 清洗（非法字符→`_`、160 字上限）；归档内条目名经 `sanitizeArchiveBaseName` 处理，非法字符替换、Windows 保留名追加 `_`、同类型目录内冲突 ` (2)` 递增，避免 zip-slip 与保留名破坏；文本导出有 16 MiB 上限、多文件导出有 500 文件上限；`manifest.json` 固定由宿主生成并最后写入，不从节点/快照复制任意字段；远端媒体只允许 `http`/`https` 且下载失败映射为 `REMOTE_DOWNLOAD_FAILED` 跳过而非中断整包。写文件走 `.part` + `wx` + 原子 rename，避免半成品覆盖既有文件。

- `node-export/save-timeline`（第39批）：这是**唯一会把用户媒体整份复制到用户所选目录**的路由。控制点是——目录只由**原生对话框**（`showOpenDialog`，`openDirectory`+`createDirectory`）产生，不接受渲染器传入的任意目标路径；导出目标恒为所选父目录下 `fs.mkdtemp` 新建的 `CanvasPro-timeline-XXXXXX` 子目录，因此**不覆盖**既有文件；导入前必须经用户确认对话框（`showMessageBox`，默认按钮为"取消"，`defaultId`/`cancelId` 均为 0）；源解析复用 `resolveExportSource`（必须落在配置的根目录白名单内、逐级 `lstat` 拒符号链接/目录跳转、`realpath` 后仍在根内、单文件 ≤ 512 MiB）且**每段复制前重新解析并比对 dev/ino/size/mtime/ctime**，源在确认后变化即中止；媒体副本总大小 ≤ 2 GiB、整批元数据预检 120 s 超时；ffprobe 经 `createTimelineProbe` 以固定可执行名 + 常量参数数组、`shell:false`、`windowsHide`、协议/格式白名单调用，不联网；XML 与 `export-manifest.json` 用 `.part` + `COPYFILE_EXCL`/`wx` 原子发布，`timeline.xml` **最后**写入；任一段失败即整批 `status:'failed'` 并保留已写结果，**不静默丢镜头或填补空隙**。桥 token 仍是本机渲染器的同进程凭据，不构成网络暴露面。
- `asset/consume-updates` 与 `custom-ai-apps/read|write`（第40批）：**无新增攻击面**。前者只从进程内缓冲取走宿主已构造好的响应对象（无路径解析、无文件/网络访问，200 条有界），后者沿用既有 `getDataDir()`（与 `assets`/`uploads`/`workflows` 同源）与 `createCustomAiAppStorage` 的固定子目录 + 原子 `rename`，写入路径不受渲染器控制；两者都不新增 IPC 通道，也不改变任何 `assert*Sender` 校验。
- `customAiApps:read|write` IPC 与 preload 三能力组（第42批）：**无新增攻击面**。两条通道只读写 `<dataDir>/custom-ai-apps` 下的固定文件，路径不含渲染器可控片段，`sourceType`/`kind` 经白名单收敛（未知值不扩展 schema）；`agentInformation:readUrl`/`agentSkills:*` 的注册与校验沿用第31/32批实现（SSRF 加固、路径越界守卫），本批**只是把已注册的通道暴露到 `electronAPI`**，不新增 `ipcMain.on` 监听、不扩大 `webUtils`/`shell` 暴露面、不改 `assert*Sender` 校验。注意：preload 的暴露使这三组能力对**渲染器脚本**可见（此前即使通道存在也无法调用）；三组当前无消费者。

## 4. 已执行的验证（离线）

命令（对新增/修改文件）：

```
node --check electron/desktopHttpBridge.js electron/clipboardCapabilityOperations.js \
  electron/secureSettingsCapabilityOperations.js electron/diagnosticsCapabilityOperations.js \
  electron/customAiAppStorage.js electron/shellItemRevealer.js \
  electron/ipc/clipboardIpc.js electron/ipc/desktopBridgeIpc.js \
  electron/ipc/mainIpcSetup.js electron/ipc/registerIpcHandlers.js

node --test electron/shellItemRevealer.test.js electron/clipboardCapabilityOperations.test.js \
  electron/customAiAppStorage.test.js electron/desktopHttpBridge.test.js \
  electron/ipc/desktopBridgeIpc.test.js
```

第31批追加命令：

```
node --check electron/agentInformationCapabilityOperations.js electron/ipc/agentInformationIpc.js \
  src/utils/diagnosticOperationRecorder.js electron/ipc/mainIpcSetup.js electron/ipc/registerIpcHandlers.js

node --test electron/agentInformationCapabilityOperations.test.js src/utils/diagnosticOperationRecorder.test.js \
  electron/secureSettingsCapabilityOperations.test.js electron/diagnosticsCapabilityOperations.test.js \
  electron/ipc/mainIpcSetup.test.js
```

第32批追加命令：

```
node --check src/modules/agent/agentSkillPackage.js electron/agentSkillCapabilityOperations.js \
  electron/ipc/agentSkillsIpc.js electron/ipc/mainIpcSetup.js electron/ipc/registerIpcHandlers.js electron/main.js

node --test src/modules/agent/agentSkillPackage.test.js electron/agentSkillCapabilityOperations.test.js
```

第33批追加命令：

```
node --check electron/projectCapabilityOperations.js electron/ipc/mainIpcSetup.js electron/main.js

node --test electron/projectCapabilityOperations.test.js electron/ipc/mainIpcSetup.test.js
```

第34批追加命令：

```
node --check electron/notificationSoundFiles.js electron/diagnostics.js electron/ipc/fileIpc.js \
  electron/preload.cjs electron/main.js electron/ipc/mainIpcSetup.js src/services/completionSoundService.js

node --test electron/notificationSoundFiles.test.js electron/ipc/mainIpcSetup.test.js \
  src/services/completionSoundService.test.js
```

第35批追加命令：

```
node --check electron/screenshotShortcutAccelerators.js electron/screenshotCaptureEventQueue.js \
  electron/screenshotOverlayController.js electron/ipc/screenshotIpc.js electron/ipc/mainIpcSetup.js \
  electron/preload.cjs electron/main.js src/modules/shortcuts.js

node --test electron/screenshotShortcutAccelerators.test.js electron/screenshotCaptureEventQueue.test.js \
  electron/ipc/mainIpcSetup.test.js
```

第36批追加命令：

```
node --check electron/contextMenuShortcutAccelerators.js electron/notificationShortcutController.js \
  electron/completionNotificationNavigation.js electron/backgroundCompletionNotification.js \
  electron/ipc/appIpc.js electron/ipc/mainIpcSetup.test.js electron/main.js electron/preload.cjs

node --test electron/contextMenuShortcutAccelerators.test.js electron/notificationShortcutController.test.js \
  electron/completionNotificationNavigation.test.js electron/backgroundCompletionNotification.test.js \
  electron/ipc/mainIpcSetup.test.js
```

第37批追加命令：

```
node --check electron/nodeExportService.js electron/nodeExportController.js \
  electron/timelineExport/jianyingExportAction.js electron/ipc/nodeExportIpc.js \
  electron/ipc/registerIpcHandlers.js electron/ipc/mainIpcSetup.js electron/main.js \
  electron/preload.cjs electron/ipc/mainIpcSetup.test.js

node --test electron/nodeExportService.test.js electron/nodeExportController.test.js \
  electron/timelineExport/jianyingExportAction.test.js electron/ipc/mainIpcSetup.test.js
```

第38批追加命令：

```
node --check electron/legacyRendererStorageMigration.js electron/legacyRendererStorageMigration.test.js \
  electron/ipc/mainIpcSetup.js electron/ipc/mainIpcSetup.test.js electron/main.js

node --test electron/legacyRendererStorageMigration.test.js electron/ipc/mainIpcSetup.test.js
```

第39批追加命令：

```
node --check electron/timelineExport/timelineExportOperation.js \
  electron/timelineExport/timelineExportOperation.test.js electron/ipc/timelineExportIpc.js \
  electron/nodeExportController.js electron/ipc/mainIpcSetup.js electron/main.js

node --test electron/timelineExport/timelineExportOperation.test.js electron/timelineExport/timelineExport.test.js \
  electron/nodeExportController.test.js electron/ipc/mainIpcSetup.test.js
```

第40批追加命令：

```
node --check electron/assetUpdateEventBuffer.js electron/assetUpdateEventBuffer.test.js \
  electron/ipc/mainIpcSetup.js electron/ipc/mainIpcSetup.test.js electron/main.js

node --test electron/assetUpdateEventBuffer.test.js electron/ipc/mainIpcSetup.test.js
node --test $(find electron -name '*.test.js')
```

结果：`node --check` 全部退出 0；第30批新增测试 **30 项全部通过**，第31批新增测试 **34 项全部通过**（agentInformation 16 / diagnosticOperationRecorder 5 / secureSettings 5 / diagnostics 4 / mainIpcSetup 4），第32批新增测试 **20 项全部通过**（`agentSkillPackage` 8 / `agentSkillCapabilityOperations` 12），第33批新增测试 **21 项全部通过**（`projectCapabilityOperations` 20 / `mainIpcSetup` +1），第34批新增测试 **11 项全部通过**（`notificationSoundFiles` 8 / `mainIpcSetup` +1 / `completionSoundService` +2），第35批新增测试 **11 项全部通过**（`screenshotShortcutAccelerators` 7 / `screenshotCaptureEventQueue` 4，另 `mainIpcSetup` +1 走桥），第36批新增测试 **29 项全部通过**（`contextMenuShortcutAccelerators` 4 / `notificationShortcutController` 6 / `completionNotificationNavigation` 8 / `backgroundCompletionNotification` 11，另 `mainIpcSetup` +1 走桥），第37批新增测试 **19 项全部通过**（`nodeExportService` 9 / `nodeExportController` 7 / `jianyingExportAction` 2，另 `mainIpcSetup` +1 走桥），第38批新增测试 **12 项全部通过**（`legacyRendererStorageMigration` 11，另 `mainIpcSetup` +1 走桥），第39批新增测试 **11 项全部通过**（`timelineExportOperation` 10 / `nodeExportController` +1，另 `mainIpcSetup` 既有走桥项扩展 `save-timeline`），第40批新增测试 **7 项全部通过**（`assetUpdateEventBuffer` 5，另 `mainIpcSetup` +2 走桥）。`electron/**` 离线测试合计 **325 项 / 324 通过 / 1 失败**（较第39批 +7），`src/services/completionSoundService.test.js` **6 项全部通过**。唯一失败位于 `electron/fullProjectPackageService.test.js`（`missing manifest coverage cannot bind to an existing unrelated local file`），属既有失败（相关实现文件非本十批改动，断言期望 `/未包含/` 实际先命中"节点ID缺失或重复"），归 R14 第17批待验收。

第31批测试覆盖点：URL 规范化（协议/凭据/端口/内网主机名/私网 IPv4/IPv6 拒绝，fragment 剥离）；`isPublicAgentInformationAddress` 的公网/保留段判定表；HTML 正文抽取（去 `script`/`style`/注释、实体解码、块级换行）；`readUrl` 的正常抽取、纯文本/JSON 不解析、DNS 解析到私网拒绝、DNS 失败、逐跳重定向与超限、跳转缺失 `location`、跳转到私网被拦、非 2xx、非 `identity` 编码、非文本类型、正文为空、超长截断；`requestPinnedUrl` 对**真实回环 HTTP 服务器**的读取、重定向短路、字节上限、超时与预先取消；`diagnosticOperationRecorder` 的四态与 `elapsedMs`/`failure`、日志器抛错不影响任务；`buildMainIpcHandlerDeps` 产出三个能力对象键、桥路由表 82 条且目标路由为函数、安装器只执行一次。

测试覆盖点：方法/令牌/未知路由/坏 JSON 的状态码与响应体；空 token 全拒；`secure-settings`/`clipboard` 能力缺失时**明确报错**而非静默成功；`agent-skills` 相关路由现由 `agentSkillOperations` 真实服务（第32批）；`asset|file:import-local` 的 raw path/bytes 拒绝与白名单；`open-known-folder` 白名单；包进度事件缓冲与一次性取走；`close()` 幂等与端口释放；`desktop-bridge:start` 的 token 形态、重复 start 不换地址、stop 后再 start 换新 token；`clipboardCapabilityOperations` 的文本/图片/超限/自定义格式与纯文本回退/损坏缓冲降级；`customAiAppStorage` 的分源写入、未知来源/kind 收敛、坏文件降级、缺失数据目录硬失败；`shellItemRevealer` 的非 Windows 直连、Windows 独立窗口与两类失败回退。

第32批测试覆盖点：`agentSkillPackage` 的 frontmatter 解析/字段上限/id 规则/脚本身份拒绝/序列化回写与 `metadata` 别名回退；`agentSkillCapabilityOperations` 在真实临时目录下的空清单读取与 `skills/` 目录创建、缺失 userData 根硬失败、SKILL.md 超限/缺失诊断、reference 资源读取与超限跳过、`openRoot` 可用性、`installFromFolder` 成功（暂存目录事后清空）/取消/源非法/重复安装、`saveManagedDefinition` create/duplicate/invalid-id/非托管拒改/覆盖更新、`deleteInstalled` 缺确认/不存在/成功、以及 `isInsideRoot`/`dirname===root` 越界守卫。

第33批测试覆盖点：`buildProjectOpenResponse` 的 recent/路径两种来源与标识派生；`openPath` 真实读文件+写最近记录+同步系统最近；`open` 的最近ID不存在/文件被删除/对话框取消/对话框选中四种走向与 `filters`/`defaultPath`；`save` 的普通模式复用最近路径、无最近ID时写入画布目录、`saveAs` 取消与自动补扩展名；`listRecent`/`removeRecent`；`setUnsavedState`/`consumeExternalOpenRequests` 的转发与清空；`exportPackage`/`importPackage` 的 payload 与 `onProgress` 透传；恢复快照写的成功与 `RECOVERY_SNAPSHOT_PROTECTED` 失败结果、读的有/无/异常三态、info 的降级、clear 的成功与受保护失败；`open`/`save` 发出的 `project.desktop_*` 事件与 `mode`/`canvasCount`；冻结对象与桥契约方法齐全。桥侧另验证 `export-package` 期间 `sender.send` 的进度事件能被 `consume-package-progress-events` 取走且取走即清。

第34批测试覆盖点：`notificationSoundFiles` 在**真实临时目录**下的 mp3 过滤与排序（`notes.txt` 不计）、相对/缺失目录拒绝、空 payload 返回空列表；`playNotificationSoundFile` 的绝对路径与 `appRoot` 相对路径解析、`powershell.exe` 参数形态（`-NoProfile -ExecutionPolicy Bypass -Command` + `file://` URI）与 `windowsHide`、音量 0.5/默认 0.7、越界相对路径拒绝（`../outside.mp3`）、非 win32 **不 spawn** 且返回 `unsupported-platform`、`spawn` 同步抛错与非 0 退出分别映射 `spawn-error`/`player-exit` 并各写一条 `notification_sound.play_failed`（`source:'main'`）；`createSystemNotificationSoundFileService` 的列表 `playbackUrl` 编码、开目录真实创建并转发 `openPath`、`system:true` 走 `beep`、无 `beep` 时返回 `unavailable`。桥侧验证 `diagnostics/create-package` 经 `showSaveDialog` 后补 `.zip` 且把 `outputPath` 传给 `diagnostics.createPackage`、`open-logs-folder` 在**真实临时目录**上 `mkdirSync` 并把该目录交给（同步的）`openFolder`、`foregroundRequested` 透传。渲染器侧验证浏览器 `Audio` 抛错时改走 `electronAPI.notificationSound.play`（payload 为 `{filePath, volume, reason:'generation-success'}`）并返回 `native:true`，以及原生也失败时仍抛回原错误、只提示一次 toast。

第35批测试覆盖点：`screenshotShortcutAccelerators` 的 `ctrl/control/cmdOrCtrl/cmdOrControl→CommandOrControl`、`alt/option`、`space/backquote/反引号`、`f1..f24`、单字母大写、数字原样、`enter/return/esc/…` 与标点别名映射；`normalizeScreenshotAcceleratorKeys` 的修饰键固定顺序（`CommandOrControl→Shift→Alt`）、恰一个主键、拒绝仅修饰键/多主键/未知键/空数组；`parseScreenshotShortcutPayload` 对 `{keys}` 与 `{accelerator:'Alt+Q'}` 的解析与 `{ok:false,reason:'invalid-shortcut'}`；明确**拒绝** `meta/cmd/command`（截图控制器不接受）与 `f25`。`screenshotCaptureEventQueue` 的插入顺序与 `consume` 取走即清、`limit:8` 下推 11 条只留 id 4..11（丢最旧）、自定义上限 2 与非法上限回落 8、两个实例互不影响。桥侧验证 `configure-global-shortcut` 把 `{keys:['Alt','E']}` 归一为 `Alt+E` 并回 `{ok:true}`、`consume-global-capture-events` 转发并返回队列内容、`get-global-shortcut-status` 返回 `accelerator`、`screenshot/capture-display` 透传。

第36批测试覆盖点：`contextMenuShortcutAccelerators` 的 `meta/cmd/command/cmdOrCtrl/cmdOrControl` 与 `ctrl/control` 同归一为 `CommandOrControl`、`alt/option`、`space`、`f1..f24`、单字母数字大写、`enter/return/esc/arrow*/标点` 别名，修饰键固定顺序 `CommandOrControl→Shift→Alt`，拒绝空数组/非数组/`f25`/未知键/仅修饰键/多主键/超 4 键。`notificationShortcutController` 的默认 `Alt+E`、同键只注册一次、换键先 `unregister` 旧键、空数组取消注册且重复空数组不再动、非法组合不触碰注册、`register` 返回 false 或抛错均映射 `shortcut-unavailable`、`dispose` 幂等。`completionNotificationNavigation` 的未激活不进点击队列、取走即清、`activate` 幂等且 `release` 恰好一次并置 `release:null`、无待处理 `activateLatest` 返回 false、`acknowledge` 按 `notificationId` 结算（非法 id 返回 `{success:false}`）、40 条待处理上限溢出时结算最旧、点击队列 40 条上限丢最旧、`dispose` 结算全部并清队列、`focusMainWindow` 返回 false 记 `..._focus_failed` 不阻断点击事件。`backgroundCompletionNotification` 的 `isWindowFocused` 守卫（销毁/抛错/非聚焦）、`normalizeNavigation`（canvas 无 nodeId 返回 null、工作室 step 夹取 1–3、replacement-studio 夹取 1–5）、`normalizeThumbnailLocalPath`（仅图片扩展名、去 query）、`resolveNotificationIcon`（解析器缺失/抛错/非图片回落空）、窗口聚焦与 `isSupported()` 为假的跳过、win32 `toastXml` 与 `icon` 透传、构造失败上报并记 `notification.generation_complete_failed`、`show` 后自动关闭定时器与 `dispose`、`updateGlobalShortcut`/`acknowledge` 委派与 `dispose` 注销。桥侧验证四条 `notification/*` 路由经**真实 notifier** 分别返回 `{success:true,accelerator:'Alt+E'}`、`{success:true}`、`[]`、`{success:true,shown:false,reason:'window-focused'}`，且底层收到 `register('Alt+E')`。

第37批测试覆盖点：`nodeExportService` 在**真实临时目录**下——`defaultNodeExportZipName` 的时间戳格式与 `withNodeExportZipExtension` 补扩展名；`exportNodeItemsToZip` 的文本直写、本地图片经 `resolveLocalVirtualPath` 复制、`extract-zip` 真实解包后校验目录结构与 `manifest.json` 内容、Windows 保留名与非法字符后缀改造、同名条目 ` (2)` 递进、远端 URL 经 stub `fetchImpl` 下载与失败跳过；`saveNodeMediaToFile` 的本地/远端两条路径与缺失源报错；无导出项返回 `NO_EXPORTABLE_ITEMS`。`nodeExportController`（真实临时目录）——`exportSelectedNodesPackage` 真写 `pkg.zip` 且落盘名与 `getSuggestedPackagePath` 一致、`saveTextFile` 超 16 MiB 拒绝、`saveMediaFiles` 超 500 拒绝、`saveMediaFile`/`saveTextFile` 的对话框取消返回 `{success:false,canceled:true}`、默认目录记忆的读写与 `downloads` 回落、`assertAbsolutePath`/`assertFilename` 对相对路径与含 `/`、`\` 文件名的拒绝。`jianyingExportAction` 的非 win32 不探测、win32 仅在绝对 `localAppData` 下探到 `JianyingPro.exe`、`openPath` 返回非空即失败、抛错统一回落中文文案。桥侧验证五条 `node-export/*` 路由经**真实控制器**成功/取消两条走向（`export-selected` 落盘 `pkg.zip`，`save-text`/`save-media`/`save-media-files` 返回 `{success:false,canceled:true,…}`）。

第38批测试覆盖点：`buildLegacyRendererStorageMigrationAppUrl` 的 `=1`/`=0` 两态、保留既有 query、缺失 url 回落回环默认值；`read` 的无暂存文件/坏 JSON/JSON 标量三态均 `not-prepared`；`prepare` 用 stub 窗口验证 `loadURL` 目标为 `<appUrl>electron/legacyStorageMigration.html`、`executeJavaScript(script, true)`、窗口被 `destroy()`、暂存文件落盘内容与 `read` 回读一致；`prepare` 在暂存已存在时**不开窗口**直接 `staged`、在完成标记存在时 `completed`、无 `createWindow` 时 `window-unavailable`、schema 不符抛 `unsupported schema` 且仍销毁窗口且不留暂存；`complete` 写出的标记含 `schemaVersion`/`completedAt`/`summary`、删除暂存、之后 `read` 为 `completed`、重复 `complete()` 幂等且非对象 summary 收敛为 `{}`；返回对象 `Object.isFrozen` 且键集固定；`readJsonFile` 只接受 JSON 对象（`null`/数字/坏文本/读文件抛错均为 `null`）；内嵌导出脚本以 `(` 开头、以 `)()` 结尾且包含 `async function exportLegacyRendererStorage`，用 `new Function` 执行时因 Node 缺 `localStorage` 而拒绝（证明是自调用而非裸函数表达式）。桥侧验证 `storage-migration/read` 经**真实迁移对象**依次返回 `{available:false,reason:'not-prepared'}`、写入暂存后 `{available:true,payload}`、`complete` 返回 `{success:true}`、再 `read` 返回 `{available:false,reason:'completed'}`。

第39批测试覆盖点：`buildTimelineExportConfirmation` 的确认按钮顺序（`['取消','确认导出工程']`）、`defaultId`/`cancelId`/`noLink`、文案取自**解析后的 plan**（段数、`1920×1080，30.000 fps，2.000 秒`、`媒体副本 2.0 MiB`、逐段"源帧 30–90，时间线 0–60"）且不含原始 `localPath`、静音与保留音轨两种文案互斥。`createTimelineExportOperation`（真实临时目录 + 注入对话框）——真实导出 `complete` 且 `timeline.xml` 的 SHA-256 与返回一致、媒体副本落到新建子目录且**源文件未被改动**、探针只调用一次、`showMessageBox` 只弹一次、`rememberDirectory` 收到的是**用户所选父目录而非新建子目录**、`defaultPath` 在有记忆目录时透传/为空时**不出现该键**；取消目录选择不弹确认也不写任何文件、拒绝最终确认 likewise、元数据不支持时**两个对话框都不弹**且 `directory` 为空；`rememberDirectory` 抛错时仍返回 `complete`（已完成导出不被记忆失败吞掉）；一次成功后再取消不追加第二次记忆；未注入 `showOpenDialog` 时回落 `dialog.showOpenDialog(getWindow(), options)` 且父窗口为活动窗口、`getWindow()` 返回 `null` 或抛错时退化为**单参**调用（用 `arguments.length` 断言）。`nodeExportController` 侧：`saveTimeline` 为函数、空 payload 走到真实模型校验（`/1–32 个本地视频节点/`）且 `results`/`directory` 为空、无可用 ffprobe 时在**选择目录之前**失败（`showOpenDialog` 零调用）。桥侧：`node-export/save-timeline` 经**真实控制器**先返回模型校验错误，再对合法片段返回 `第 1 段：未找到 ffprobe`（`directory` 为空）。

第40批测试覆盖点：`assetUpdateEventBuffer` 的插入顺序、`consume` 取走即清（第二次为空）、忽略 `null`/`undefined`/`''`、`limit:200` 下压 205 条后只留第 6–204 条（丢最旧）、`limit:0`/`NaN` 回落 200、两个实例互不共享。桥侧：`asset/consume-updates` 经**真实缓冲**一次 drain 出两条再 drain 为空；`custom-ai-apps/read` 在**真实临时数据目录**下返回 `ok:true`/`storageRoot=<dataDir>/custom-ai-apps`/`hasData:false`/`savedApps:[]`，`custom-ai-apps/write` 落盘 `comfyui-local-workflow/saved-apps.json` 且 `ok:true`，再次 `read` 回读到写入项（`hasData:true`）；未接线时 `asset/consume-updates` 仍返回 `[]`，`custom-ai-apps/read` 同步抛 `Custom AI app storage data directory is unavailable`（诚实失败，不静默返回空数据）。

第41批测试覆盖点：`globalCaptureDelivery` 的 `consumeEvents` **peek 语义**（连续两次返回同一事件、事件对象为副本，`claim`+`acknowledge` 后才消失）、容量先于重复判定（满 3 时第 4 条得 `capture-queue-full`）、`claim` 只有首个 `receiverId` 成功、超时结算的 `retryable` 取决于是否已被认领、`AbortSignal` 取消、`destroy` 结算全部在途、定时器清理。`selectedTextCapture` 的两平台差异（非 Windows 直读 hook 且 `key-up` 不过滤、Windows 过滤 `flags & 0x10` 且套用两组细调列表）、原生抛错后清理可重试、`start` 失败闩锁、worker 的 `READY`→`COPY:1:INPUT`→`RESULT:1:OK`、半行重组、`NO_SELECTION` 换策略、`KEYS_HELD` 不重试、复制/启动超时均 kill、`spawn` 抛错与提前退出、`prewarm` 矩阵、`destroy` 幂等。`globalTextPresetShortcutController` 的键名归一化（`meta`/`cmd` 被丢弃、`Alt+Plus` 仅经 `keys:['alt','=']`）、注册失败诊断 `global_capture.shortcut_register_failed`、面板不可用/无选中/空白/抛错降级、`preset-draft` 投递与 claim/ack 结算、状态广播。`ipc/textPresetIpc` 的 8 通道注册与未接线 `not-supported` 守卫。桥侧：`text-preset/update-global-shortcut`/`consume-events`/`claim-event`/`acknowledge-event`/`get-global-shortcut-status` 经**真实控制器**逐一委派（5 键首次非兜底值）。

第42批测试覆盖点（本批**不涉及桥**，覆盖的是新增 IPC 通道）：`customAiApps:read|write` 恰好两条注册、注入的 `getCustomAiAppStorage` 优先于懒建回落（用"`getDataDir` 一被调用即抛错"证明回落分支未被走）、`write` 的缺参/`null`/`{}` 一律归一到 `{}` 传到底层、无注入 accessor 时按 `getDataDir` 懒建并在**真实临时目录**完成写盘与回读（`comfyui-local-workflow/saved-apps.json`）、`getDataDir` 返回空串时 read/write 均**同步抛** `data directory is unavailable`、存储文件内容为 `{ not json` 时仍 `ok:true` 且 `savedApps: []`。**`preload.cjs` 未纳入离线测试**（CommonJS + `require('electron')`），三能力组仅源码级逐字段核对。

## 5. 验收欠项（须授权后执行）
- [ ] 真实应用内调用 `desktop-bridge:start`，核对回环地址、token、`stop`/退出后端口确实释放、生命周期内不重复开启。
- [ ] 逐条核对上表 82 路由中**已具备能力对象**的那些（app/notification/secure-settings/clipboard/custom-ai-apps/media-task/local-asset-cleanup/diagnostics/shell/dialog/web-preview/notification-sound/project/agent-skills/agent-information/screenshot/node-export/storage-migration）返回结构与主窗口 IPC 一致；其中 `diagnostics/*` 与 `notification-sound/play` 到第34批才真正有实现（此前 `diagnosticsCapabilityOperations` 无生产引用），`screenshot/*` 三条路由到第35批才由控制器真实服务（此前控制器在旧树里已存在但从未被桥接线），`notification/*` 四条路由到第36批才由 `backgroundCompletionNotifier` 真实服务（此前本仓 notifier 只有 `showGenerationComplete`，三条路由恒空转），`node-export/*` 五条路由到第37批才由 `nodeExportController` 真实服务（此前 `exportSelectedNodesPackage` 等五个扁平键从未被 `mainIpcSetup` 产出），`storage-migration/*` 两条路由到第38批才由 `legacyRendererStorageMigration` 真实服务（此前两个 context 键从未产出，路由恒返回无理由的 `{available:false}`），`node-export/save-timeline` 到第39批才由 `saveTimeline` 键真实服务（此前桥路由恒 `undefined`、同一 `nodeExport:saveTimeline` IPC 恒抛"当前环境不支持导出剪辑工程"），`asset/consume-updates` 与 `custom-ai-apps/read|write` 到第40批才由 `consumeAssetUpdateEvents`/`getDataDir` 两个键真实服务（此前前者恒返回 `[]`、后者必然抛 `data directory is unavailable`）；**`customAiApps:read|write` 两个 IPC 通道与 `agentInformation`/`agentSkills` 三组能力到第42批才首次对本树渲染器（`window.electronAPI`）可达**（此前两条通道**根本未注册**、另两组已在第31/32批注册却无 preload 暴露，渲染器 `window.electronAPI.agentSkills` 为 `undefined`）。
- [ ] 核对仍缺失能力路由（`asset/consume-updates` 已由第40批接线；`text-preset/*` 五条已由第41批接线但需先注册快捷键）返回的"不可用"文案与前端降级是否可接受；`globalCaptureWindow:*` 四条 IPC 通道仍恒 `not-supported`（面板未移植）。
- [ ] 第31批 `agent-information/read-url`：授权后用真实公网 HTTPS 核对证书校验与正文抽取、IPv6 公开地址的固定直连、跨主机 30x 逐跳私网拦截、`gzip`/`br` 的实际拒绝文案、以及经渲染进程调用时的超时/取消传播。
- [ ] 第32批 `agent-skills/*`：授权后在真实应用内核对 `list`/`openRoot`/`installFromFolder`/`saveManaged`/`deleteInstalled` 经渲染进程与 HTTP 桥的端到端行为，含原生选目录取消/重复安装文案、`openRoot` 在 Windows 打开 explorer 的回退、`<userData>/skills/` 目录创建的副作用、安装/删除后再挂载的 `list` 结果。
- [ ] 第33批 `project/*`：授权后核对真实原生打开/另存为对话框与取消、`project/open|save|list-recent|remove-recent` 的端到端行为、`export-package`/`import-package` 经桥时的进度事件与结果结构、`set-unsaved-state`/`consume-external-open-requests` 的消费语义、`clear-recovery-snapshot` 的身份校验确实拒绝无效/变化快照、`write-recovery-snapshot` 的 `RECOVERY_SNAPSHOT_PROTECTED` 文案；并确认桥的 `save` 与旧 IPC `saveDesktopProject` 的校验层次差异可接受。
- [ ] 第34批 `diagnostics/*` 与 `notification-sound/play`：授权后在真实应用内核对——`diagnostics/create-package` 弹出原生另存为并真的生成 ZIP（含 `showSaveDialog` 取消分支）、`open-logs-folder` 在 Windows 下打开 explorer 且 `foregroundRequested` 与 `openShellFolder` 一致、**真的播放一次 mp3**（PowerShell/MediaPlayer 起播探针 750ms、时长上限 30s、非 0 退出文案）、`system:true` 的 `shell.beep()` 实际发声、`notificationSound:play` 经渲染进程的端到端返回、`getSuggestedPackagePath` 在真实 `app.getPath('downloads')` 下的路径与 `createPackage` 落盘名一致、渲染器原生兜底在浏览器自动播放被策略拦截时的真实行为（含 toast 只出现一次）。
- [ ] 第35批 `screenshot/*` 与全局截图快捷键：授权后在真实应用内核对——按下全局热键真的触发截图选区、**换键后旧键确实失效**、`screenshot:globalShortcutStatus` 事件在界面的呈现、`native/screenshot-helper/bin/screenshot-helper.exe` 存在/缺失两条注册与回落路径、确认截图真的写入系统剪贴板（`clipboard.writeImage`）且 `reverse-prompt` 分支不写剪贴板而是聚焦画布、`cursor:{screenX,screenY,x,y}` 在真实多屏/缩放下的坐标、`screenshot:globalCaptureReady` 事件的 `pngBase64/mimeType/source/createdAt` 结构与有界队列（8 条）在快速连按下的丢最旧行为；渲染器侧本仓只有"保存后同步"（无 `src/services/desktopBridge.js`），**未做**截图/全局快捷键设置界面改造，新版 `settings.shortcuts.*` 文案未移植。
- [ ] 第36批 `notification/*` 与 `Alt+E` 通知快捷键：授权后在真实应用内核对——生成任务完成且主窗口未聚焦时**真的弹出系统通知**（Windows 长时/静音/图标与 `toastXml` 实际渲染）、**点击通知真的回到对应画布节点/工作室步骤**并聚焦主窗口、**真实按 Alt+E 召回最近一条**且换键后旧键失效、`notification:updateGlobalShortcut|acknowledge` 经渲染进程的端到端返回、`will-quit` 的 `dispose()` 释放热键并关闭未关闭的通知窗口；并确认渲染器 `src/services/completionNotificationService.js` 仍是"弹出即结束"（**未接** `onGenerationCompleteClick` 订阅与导航消费，因新版依赖未移植的 `desktopBridge.js`/`videoResultThumbnailApi.js`）。详见 `completion-notification-navigation.md`。
- [ ] 第37批 `node-export/*` 与「打开剪映」：授权后在真实应用内核对——`export-selected` 弹出原生另存为并真的生成 ZIP（用解压工具核对 `manifest.json`、`Text/`/`image/`/`video/`/`audio/` 目录与保留名/重名递进命名）、`save-media`/`save-text`/`save-media-files` 的原生对话框与取消分支、默认目录记忆（`node-export-state.json`）在真实 `app.getPath('downloads')` 下的行为、`openJianying` 在装有剪映的 Windows 机器上真的拉起 `JianyingPro.exe`、未装时回落"请手动打开"文案；并确认渲染器侧**未移植消费方**（新版右键导出菜单依赖未移植的 `desktopBridge.js`），因此本批只补宿主侧，`nodeExport:*` IPC 目前仅由桥消费。详见 `node-export-capability.md`。
- [ ] 第38批 `storage-migration/*`：授权后在真实应用内核对——有旧渲染器存储时 `prepare()` 真的打开隐藏窗口并落出暂存 JSON（核对 `localStorage` 键与 `TapNowV2Cache`/`TapNowCanvasDB`/`AICanvasStoryboard3DAssets` 的 `stores`/`keyPath`/`autoIncrement`）、渲染器回填后 `complete()` 落完成标记且暂存被删、再次启动 `read()` 返回 `reason:'completed'` 不再重复迁移、损坏/半写暂存与打不开的库进入 `skipped`、16 MiB 单条与 96 MiB 非持久库累计上限的文案；并知悉 `prepare()` 与 `aicLegacyStorageMigration` URL 参数改写**未接入**（新版只在 chrome-shell 启动路径调用，本仓 chrome-shell 属 R15 未移植），渲染器侧 `src/services/legacyRendererStorageMigration.js` 依赖未移植的 `desktopBridge.js`，故本批只交付宿主侧。详见 `legacy-renderer-storage-migration.md`。
- [ ] 第39批 `node-export/save-timeline` 与既有时间线导出：授权后在真实应用内核对——装好 ffprobe 的机器上从节点选区导出真的写出 `timeline.xml`（在 Premiere 里导入核对序列、单视频轨 + 单音轨、入出点按帧量化、`file://` 绝对路径与 `%20` 转义）与 `media/` 完整副本，`export-manifest.json` 的 `xmlSha256` 与文件一致；核对原生"选择时间线工程父目录"与"确认导出剪辑工程（不是成片）"两个对话框的文案与取消分支；核对导出到只读/空间不足目录时的中文错误文案与**未留下半成品目录**；核对导出后 `node-export-state.json` 记忆的是所选父目录（与媒体另存为共用同一记忆），且下一次对话框以它为 `defaultPath`；并知悉本批**复用本仓既有 `timelineExportService`**（`status: complete|cancelled|failed` 契约），新版 `timelineExport/timelinePlan.js`/`jianyingDraft.js`/`jianyingDraftLocation.js`/`toolCapture.js` 与「剪映草稿」格式**未移植**（见下）。详见 `timeline-export-operation.md`。
- [ ] 第40批 `asset/consume-updates` 与 `custom-ai-apps/read|write`：授权后在真实应用内核对——导入图片/视频后 `asset:updated` 是否仍照常驱动渲染器（本批改了 `sendAssetUpdated` 的构造路径，事件对象由一次构造改为推送+IPC 共用）、连续导入 N 个文件后 `asset/consume-updates` 是否按完成顺序 drain 出 N 条、跨派生任务（poster/waveform/videoProxy）是否各产生独立事件、事件数 >200 时旧事件被丢弃且进程内存不增长、`custom-ai-apps/write` 后真实自定义 AI 应用面板是否回读且 `<dataDir>/custom-ai-apps` 目录结构与新版一致、桥与 IPC 两条通道是否**不重复投递**到渲染器（本仓渲染器只订阅 IPC）。并知悉 `asset/consume-updates` 与 `custom-ai-apps/*` **目前无渲染器消费者**（新版 `src/services/desktopBridge.js` 属 R15 未移植）。详见 `asset-update-events.md`。
- [ ] 第42批 `customAiApps:read|write` IPC 与 preload 三能力组：授权后在真实应用内核对——从**渲染器**（非桥）调用 `window.electronAPI.customAiApps.read()`/`write(payload)` 的返回结构，`write` 后用自定义 AI 应用面板确认回读且 `<dataDir>/custom-ai-apps` 目录结构与新版一致；`window.electronAPI.agentSkills.list()`/`installFromFolder()`（原生选目录与取消）/`openRoot()`（Windows explorer 回退）/`saveManaged()`/`deleteInstalled()` 的端到端；`window.electronAPI.agentInformation.readUrl(payload)` 经渲染进程的返回与超时/取消传播；并确认 IPC 与桥两条路径交替写同一批 `saved-apps.json` 时互不覆盖。并知悉 **`preload.cjs` 无法离线测试**（CommonJS + `require('electron')`），三能力组仅源码级静态核对，且当前 `src/` **无任何消费者**（消费方属未移植的 `src/services/desktopBridge.js`）。详见 `custom-ai-app-ipc.md`。
- [ ] `clipboardIpc` 改适配器后，渲染器侧剪贴板读写/文件引用/超限图片回归。
- [ ] 移植 chrome-shell 外部浏览器运行时（R15）与渲染器侧桥客户端之前，确认桥仅由主窗口显式使用，不构成对外暴露面。

## 6. 已知未完成（不计入本批）

- 新版消费桥的是 `chromeShellRuntime.js`（要求注入桥工厂）与渲染器侧客户端，均未移植 → 见 R15。
- 仍缺的能力对象：`electron/assetCapabilityOperations.js`（`agentInformation` 第31批、`agentSkill` 第32批、`project` 第33批、`diagnostics` 第34批、`nodeExport` 第37批、`storageMigration` 第38批已补齐）。注意本仓桥的 `asset/import` 与 `file/import-local` **不**走 `assetOperations`，而是第30批就写死的 `importStagedLocalFile`（只接受已暂存 `localPath` 并经虚拟路径白名单解析），因此 `assetOperations` 是否移植取决于是否需要新版那条“直连 asset 库”的语义，须与旧 IPC `importAssetToLibrary` 一并核对；`asset/consume-updates` 读的 `context.consumeAssetUpdateEvents` 已在第40批接线（此前恒 `[]`）。第34批还需注意：`diagnosticsCapabilityOperations.js` 早在第30批就移植完成，但**直到第34批才被生产代码引用**——这类“已交付却零引用”的模块应作为后续扫描项（`grep` 该文件名的引用方是否含非测试文件）。第35批同样命中该模式：`electron/screenshotOverlayController.js` 在旧树里早已存在（含 `screenshotOverlay.html`/`screenshotOverlayPreload.cjs`），但桥的三条 `screenshot/*` 路由自第30批声明以来一直落回“不可用”，直到第35批才把控制器展平进 `mainIpcSetup` 的依赖对象真正接线。第36批第三次命中：`electron/backgroundCompletionNotification.js` 早已存在于旧树且 `getBackgroundCompletionNotifier` 上下文键与 `notification:showGenerationComplete` IPC 都在，但本仓 notifier 只有 `showGenerationComplete` 一个方法，`notification/consume-generation-complete-clicks|update-global-shortcut|acknowledge` 三条路由恒空转，直到第36批移植 `completionNotificationNavigation`/`notificationShortcutController`/`contextMenuShortcutAccelerators` 并重写 notifier 才补齐。第37批第四次命中：`desktopHttpBridge.js` 自第30批就声明了六条 `node-export/*` 路由并读取 `context.exportSelectedNodesPackage` 等扁平键，但 `mainIpcSetup` 从未产出这些键、旧树也没有 `nodeExportController.js`/`nodeExportService.js`，直到第37批移植并接线五个键才使其中五条可用。第38批第五次命中：两条 `storage-migration/*` 路由自第30批起读 `context.readLegacyRendererStorageMigration`/`completeLegacyRendererStorageMigration`，但两个键从未产出，路由恒返回无理由的 `{available:false}`/`{success:false}`，直到第38批移植 `legacyRendererStorageMigration.js` 并接线两键才有真实 `reason` 与 `payload`。第39批第六次命中（同一缺陷**横跨传输层与 IPC 两层**）：`context.saveTimeline` 与 `nodeExport:saveTimeline` 都自各自批次声明起读取该键，但 `createNodeExportController` 从未产出它——桥路由恒 `undefined`，**且 `nodeExport:saveTimeline` IPC 恒抛“当前环境不支持导出剪辑工程”**（比前几批多一处可观测故障），直到第39批移植 `timelineExportOperation.js` 并接线才两层同时可用。第40批第七次命中（同一缺陷、**一次两键三路由**）：`context.consumeAssetUpdateEvents`（`asset/consume-updates` 的唯一数据源）自第30批声明起从未产出，该路由恒返回 `[]`；`context.getDataDir`（`custom-ai-apps/read|write` 所需的存储根）同样从未产出，两条路由因 `createCustomAiAppStorage` 的 `getStorageRoot()` **同步抛错**而恒失败（比只返回空数组更显眼），直到第40批新增 `assetUpdateEventBuffer` 接 `sendAssetUpdated`、并把既有 `getDataDir` 一并补进 `mainIpcSetup` 的两键才使三条路由可用。第41批第八次命中（**一次五键五路由**）：`configureGlobalTextPresetShortcut`/`consumeGlobalTextPresetEvents`/`claimGlobalTextPresetEvent`/`acknowledgeGlobalTextPresetEvent`/`getGlobalTextPresetShortcutStatus` 自第30批声明起全部未产出，五条 `text-preset/*` 路由分别恒为 `undefined`/`[]`/`{ok:false}`/`{ok:false}`/`null`（**宿主持久不可用而非报错**），直到第41批移植 `globalCaptureDelivery`/`selectedTextCapture`/`globalTextPresetShortcutController`/`ipc/textPresetIpc` 并接线五键。**本批有意保留的差异**：(a) 浮层捕获面板 `globalCaptureWindow*`（主进程控制器 + 渲染器模块 + preload + HTML/CSS，跨两层，归 R15）未移植，故 launcher 捕获在未接面板时返回 `panel-unavailable`；(b) `selection-hook` 原生 npm 模块不引入，`selectedTextCapture` 以注入式 `loadSelectionHook` 支持、未注入时回退 Windows PowerShell worker；(c) **不调 `installGlobalShortcut()`/`prewarm()`**——新版启动即无条件注册 `Alt+C`，面板未移植时会抢走系统热键却只得到 `panel-unavailable`，故只接线构造/销毁，渲染器可经 `text-preset/update-global-shortcut` 一行式再启用（先例：第38批 `storage-migration/prepare()`）。
- **第40批的部分移植（有意）**：`asset/consume-updates` 与 `custom-ai-apps/*` 已接线，但只移植新版存储方式的**语义**（200 条有界事件队列、默认数据目录下的 `custom-ai-apps`），**不**移植新版 `assetCapabilityOperations.js`（约 21 KB）及其六个依赖模块（`assetDerivativeScheduler`/`assetIndexCoordinator`/`assetIndexFileStore`/`assetOriginalStore`/`keyedOperationQueue`/`videoPlaybackProxy`）——本仓 `asset/import`/`asset/import-remote`/本地预览/清理早已由既有 `importAssetToLibrary`/`importRemoteAssetToLibrary`/`buildAssetResponse`/`readAssetIndex` 提供，整体替换会与既有索引/清理/恢复快照逻辑冲突。另有两点刻意差异：(a) **不**调用新版的 `publishAssetUpdate(event)` 实时 emitter——本仓实时路径是 `webContents.send('asset:updated')` → preload → `fileService`，再加一层订阅者会重复投递；(b) **不**移植 `shouldBufferAssetUpdates()` 门控——缓冲有界且仅在导入路径写入，无条件缓冲更简单。(c) 本仓 `buildAssetResponse(record, {reused, derivativeStatus})` 比新版 `buildAssetCapabilityResponse` **少** `assetRevision`/`assetUpdatedAt`/`videoProxyVersion` 三个字段，故桥返回的资产事件对象不含这三者。
- **第37批的有意留空**：`node-export/save-timeline` 在第37批仍未接线（第39批已补，见下条）。新版实现是约 900 行的 `timelineExport/{timelineExportOperation,timelinePlan,jianyingDraft,jianyingDraftLocation,premiereXml}` + `toolCapture` 链路（剪映草稿 `draft_content.json` 与 Premiere 工程目录），与本仓第11批已加固的 FCP7 导出（`electron/timelineExport/timelineExportService.js`，含源哈希校验、2 GiB 上限、原生确认）语义不同，合并需专门批次设计，故第37批只交付 `nodeExportService`/`nodeExportController` 中与单节点导出直接相关的部分。
- **第39批的部分移植（有意）**：`save-timeline` 已接线，但**复用本仓既有 `timelineExportService`**，只移植新版 `createTimelineExportOperation` 的**外壳契约**（注入式 `showOpenDialog`/`showMessageBox`、`getDefaultDirectory`/`rememberDirectory`、`getWindow` 活动窗口回落、`buildTimelineExportConfirmation` 文案）。新版真正的差异仍在：`timelinePlan.js` 的 `validateTimelineRequest`/`resolveTimelinePlan`（新请求形态 `{format,name,media[]}`）、`jianyingDraft.js`/`jianyingDraftLocation.js`（剪映草稿与草稿目录自动探测）、`toolCapture.js`、工程目录自动创建与 `safeName` 保留名处理、`format: 'jianying-draft'` 分支——这些**均未移植**，本仓 `save-timeline` 只接受既有 `{title,includeAudio,clips[]}` 形态并只产出 FCP7 XML（无 `format` 字段，无剪映草稿）。因此新版渲染器若直接调用该路由会得到校验失败文案，须等渲染器侧（R15/R02 客户端）与 `timelinePlan` 一并设计后再对齐。
- **第38批的有意未接线**：`legacyRendererStorageMigration.prepare()` 与 `buildLegacyRendererStorageMigrationAppUrl` 未接入启动流程。新版只在 **chrome-shell 启动路径**里调用 `prepare()` 并用其返回值改写 `startChromeShellRuntime` 的 `appUrl`；本仓 chrome-shell 属 R15 未移植，故只接线 `read`/`complete` 两条路由，`prepare()` 保留为可注入 `createWindow` 的可测实现（离线测试用 stub 窗口）。因此对尚未迁移的用户，`read()` 目前返回 `{available:false, reason:'not-prepared'}`——比原先无理由的 `{available:false}` 更可诊断，但不等同于"迁移已完整可用"。`electron/legacyStorageMigration.html` 资产同样未移植。
- `src/utils/diagnosticOperationRecorder.js` 已于第33批接入 `projectOperations` 的 `open`/`save`；`src/services/completionSoundService.js` 的原生播放兜底已于第34批接入（浏览器 `Audio` 失败后才走宿主），但新版在 http-shim 运行时是**原生优先**，本仓渲染器走 preload 故反过来，属有意差异。
- **有意保留的行为差异**：`electron/ipc/secureSettingsIpc.js` 与 `electron/ipc/diagnosticsIpc.js` **未**改成薄适配器。旧 `secureSettings:get` 无 try/catch、`set/delete` 不校验键；旧 `diagnostics:createPackage` 直接打包、不弹保存对话框。新版能力对象会校验并弹框，替换将改变 0.4.12 渲染器已依赖的返回结构，故保留双轨并在此记录。第34批只把 `diagnosticsOperations` 供给**桥**（`/api/v2/desktop/diagnostics/*`），旧 `diagnostics:createPackage` IPC 行为不变。
- **第33批的有意加严**：桥的 `project/clear-recovery-snapshot` 不采用新版的无条件删除，而是复用本仓第29批的 `clearRecoverySnapshotIfMatches`（要求 `projectId`+`revision` 匹配），无效或已变化的快照会返回 `RECOVERY_SNAPSHOT_PROTECTED` 而不是被删掉；`project/save` 则直接落 `writeProjectJson`，不经过渲染器侧的结构拦截，两层校验层次不同。
- `diagnosticsCapabilityOperations.openLogsFolder` 期望**同步**的 `openFolder`（直接读 `opened.foregroundRequested`）；第34批接线时传的正是本仓同步实现 `openShellFolder`（`main.js` 的 `openFolder` 键，非 Promise），若日后改成 async 会恒得 `false`。第34批的桥测试用回环 stub 覆盖了 `foregroundRequested` 透传，但**未覆盖** `shellItemRevealer.openShellFolder` 在 Windows 下的真实分支。
- `agent-skills/list` 会在用户数据目录真实创建 `skills/` 目录（只读查询带写入副作用），联调时须知悉；`openFolder` 走 `shellItemRevealer.openShellFolder`，Windows 下会另开 explorer 窗口，未验证。
- **第42批的新缺陷轴（与第34–41批不同，须继续扫描）**：前八次命中都是"桥读的键宿主从未产出"；第42批发现的是**通道已注册但 preload 从未暴露**——`customAiApps:read|write` 在旧树里**根本未注册任何 IPC 通道**，而 `agentInformation:readUrl`（第31批）、`agentSkills:*` 五通道（第32批）虽已注册，`electron/preload.cjs` 的 `electronAPI` 里却没有对应键，故本树渲染器 `window.electronAPI.agentSkills === undefined`。**后续批次应把这一轴也纳入扫描**：对每个已注册的 `ipcMain.handle('x:y')` 通道，核对 `preload.cjs` 是否有可达的暴露路径（注意 `appIpc.js` 等注册器用局部别名 `_0x91da6a.handle(...)`，naive 的 `ipcMain.handle(` grep 会漏）；反向亦然，preload 里每个 `invoke('x:y')` 都应有对应注册。**结论：本批已使三组能力可达，但 `src/` 仍零消费者**，真正的端到端要等渲染器侧 `desktopBridge.js`（R15/R12）。
- 第42批**未移植** `electron/ipc/customAiAppIpc.js` 之外的任何一轴向：新版 `customAiAppStorage.js` 的语义本仓早已有等价手写实现（第30批），本批只是补 IPC 通道与 preload 暴露，**存储格式/目录结构未变**。
- 未做真实桌面联调、未跑构建/打包/安装包；`readUrl` 的真实外网行为完全未验证；`project/*` 的原生对话框与真实工程/恢复快照读写未验证。
