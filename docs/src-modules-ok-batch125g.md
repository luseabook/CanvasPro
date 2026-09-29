# 125g：`src/modules` OK 队列第 2 组（settings 5 + app 4 + canvasCommands 4）落地记录

> 本专题记录 OK 队列第 2 组的成组落地。判据是两件事：一是每件模块的相对 import 目标都能在本仓找到，二是导出闸门 `MISSING_TOTAL=0`。满足这两条的模块成组落地，**全部落地不接线**：从入口沿相对 import 走不到它们，运行时行为、UI、联调一概未变；本批也没有提交、没有推送。
>
> 各组划分以 `b125/deps-modules.txt` 的 OK 分段为准。第 1 组（125f）见 `docs/src-modules-ok-batch125.md`；本组是其 §6 写明的「第 2 组 13 件」。
>
> **状态说明**：本组的 26 个文件先落在工作树里，但当时没有写专题、也没有登记 TRACKING/batches（变更记录里只以「会话开工补记（会话外改动）」出现，见 #0077 源文件、#0078 测试）。本次补齐专题与记账，同时处理了首跑发现的 2 处失败（见 §4.1）。

## 1. 第 2 组：落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 1 | app/appCanvasDropImport | 3934/113 | b90159b56e1f | 23 |
| 2 | app/completionNavigation | 2664/59 | 3aea0c7848dd | 15 |
| 3 | app/globalScreenshotBridge | 4882/117 | 37107f6da498 | 21 |
| 4 | app/modelCatalogProviderCard | 938/28 | cf7fc71f4b67 | 12 |
| 5 | canvasCommands/mediaToolCommands | 19694/488 | 235cdb34466e | 14 |
| 6 | canvasCommands/nodeExportCommands | 4544/120 | bf0da0440572 | 8 |
| 7 | canvasCommands/storyboardCommands | 17814/454 | 9a29efec93a4 | 11 |
| 8 | canvasCommands/taskCommands | 10192/264 | 59250b5aeef6 | 11 |
| 9 | settings/apiConfigSavePresentation | 1854/50 | 55d1b61f0b39 | 11 |
| 10 | settings/downloadNamingSettings | 1052/26 | bad2654a41c5 | 11 |
| 11 | settings/localAssetCleanupList | 6577/146 | 083765a37c46 | 11 |
| 12 | settings/nodeManagerSettings | 2884/69 | e5063cbb06c4 | 10 |
| 13 | settings/notificationShortcutSettings | 1073/31 | 5887daef09b5 | 10 |

合计：13 件（源 78 102 字节 / 1965 行；测试 165 673 字节 / 4701 行，共 168 例）。

## 2. 第 2 组：依赖与闸门

- 闸门 13/13 `MISSING_TOTAL=0`，共核对 34 条具名导入全部命中（证据 `b125g-gate.txt`）。
- 组内依赖：`canvasCommands` 三件共用 `./commandRegistry.js` 的 `createCanvasCommandError`（4 次命中）；`taskCommands` 还引 `../../core/nodeRuntimeRegistry.js` 默认导出；`storyboardCommands` 另引 `./graphCommands` 的同层导出、`../../core/math.js`、`../../core/storyboardFactory.js`、`../nodeSpawn.js`。
- 跨目录依赖全部已在 0.7.16 基线里存在：`services/` 的 `mediaSizingPolicy`、`localAssetCleanupService`、`downloadNamingService`、`desktopBridge`、`completionNotificationService`；`modules/` 的 `workspaceStudioModes`、`promptPresets`、`nodeManager/nodeManagerPlacement`、`nodeManager/nodeManagerDragContract`、`nodeBatchExport`；`app/globalTextPresetBridge`（125a 已落地）；`i18n/index`。
- prettier 暂存核对：本机 prettier 3.9.8 + `deobf-tools/prettierrc.json`（singleQuote、printWidth 110、tabWidth 2、lf）对镜像格式化后与仓库文件 **13/13 逐字节相同**（暂存目录 `deobf-tools/b125g/port/`）。
- `node --check` 26/26 通过。
- bare node 下 `import` 13/13 成功，无顶层 DOM 副作用：`appCanvasDropImport`、`apiConfigSavePresentation`、`localAssetCleanupList`、`nodeManagerSettings` 都触达 `document`，但一律在工厂参数默认值（`globalThis.document`）或函数体内惰性取用。

## 3. 第 2 组：冻结行为与接入契约

### 3.1 app 组（4 件）

1. `appCanvasDropImport`
   - 主要导出：`runAppCanvasFileImport({ event, projectId, handleFileDrop, commit })`、`openAppCanvasFilePicker({...})`、`installAppCanvasDropImport({ targetEl, handleFileDrop, handleWebImageUrlDrop, commit, getCurrentProjectId })`。
   - 冻结行为：`runAppCanvasFileImport` 只把 `handleFileDrop` 的返回值 `=== true` 视为成功；`projectId` 空值时回落 `'default_v2_project'`（`||`，非空原样透传不 trim）；成功才调 `commit`；返回严格布尔。`openAppCanvasFilePicker` 缺 `createElement` 或 `body.appendChild` 直接返回 `false`（不抛）；建的 `input` 是 `type=file`、`accept` 固定 `image/*,video/*,audio/*`、`multiple`、固定在屏幕外；`cancel` 与 `change` 都注册 `{once:true}`；`change` 时先 `remove` 再判空，空文件列表直接返回（不调回调）；合成的伪 event 带 `preventDefault`/`stopPropagation` 空实现、`clientX`/`clientY` 走 `Number.isFinite(Number(x))` 否则归 0；导入返回假时调 `onUnsupported`，抛错时调 `onError` 并返回 `false`（此时已 `remove`）。`installAppCanvasDropImport` 对 `dragover` 只做「节点管理器拖拽类型 / `[data-ui-stop="1"]` 就近命中」两项跳过，其余 `preventDefault`；`drop` 先试文件导入，失败再试网页图片 URL 拖入并按其真值 `commit`；返回的卸载函数成对移除两个监听。
   - 接线时须接画布拖放入口（`appCanvasPointerBindings` 一族）与顶部工具栏的文件选择按钮。
2. `completionNavigation`
   - 主要导出：`createCompletionNavigation({ canvasTabs, store, viewport, requestWorkspaceMode, replacementStudio, prepareReplacement, subscribe, showToast })`，返回冻结语义的 `{ whenIdle, destroy }`。
   - 冻结行为：只处理 `source` 为 `canvas` 或 `replacement-studio` 的通知，其余忽略。替换工作室分支先 `await replacementStudio.whenReady()` 再 `await prepareReplacement()`，随后 `requestWorkspaceMode('replacement-studio')` 返回假就放弃（此时不导航），成功才 `navigateToTaskResult`。画布分支用 `getMultiDataSnapshot({captureVisualSnapshot:false})` 在全部画布里按 `canvasId` 与 `projectId` 双重过滤，再要求该画布节点里真的含 `nodeId`（`nodes` 为数组用 `some`，否则当字典查键）；命中数**必须恰好为 1**，否则 toast「对应的画布节点已删除或项目已关闭。」并返回假。切换画布后三重保险：已销毁、活动画布 id 不等于目标、store 里查不到该节点，任一命中即放弃。成功路径固定 `setSelectedNodes([nodeId])` + `focusNode(nodeId, 96, 500, { maxZoom: 1.15 })`。内部用一条串行 promise 链保证通知按序处理，任一步抛错只 toast「无法打开任务结果，请从对应工作区查看。」且不打断链；`destroy` 置销毁位并退订。
   - 接线时须接完成通知的宿主装配（`completionNotificationService` 的订阅者）。
3. `globalScreenshotBridge`
   - 主要导出：`installGlobalScreenshotBridge({ screenshotApi, createMediaNodeFromBlob, showToast, translate, executeCanvasCommand, isNodeMounted, scheduleFrame, getCanvasIdentity, consoleObject })`（无返回值）。
   - 冻结行为：`screenshotApi` 缺失直接不装配。装配时挂 `onGlobalCapture` 与 `onGlobalShortcutStatus` 两个回调。捕获回调：base64 去空白后为空即静默返回；`mimeType` 空值回落 `image/png`；base64 按 8192 字节分块转 `Uint8Array` 再组 `Blob`（`atob` 失败会进 catch）；建节点固定 `placement:'viewport-center-sequence'`、`sequenceKey:'global-screenshot'`，`actionId === 'reverse-prompt'` 时额外带 `returnNode: true` 与 `isImportCurrent` 守卫。反推流程：`node.createConnected`（`type:'ai-text'`、`inheritSource:false`）→ `node.setPrompt`（写 `REVERSE_IMAGE_PROMPT_PRESET_PROMPT`）→ `runImmediately === true` 才 `waitForGlobalCaptureNodeMounted` 再 `generation.run`；每次画布命令都先比 `getCanvasIdentity()`，不一致就抛 `canvas-changed` 中止，命令返回 `ok !== true` 也抛（文案取 `message`、`errorCode`、缺省 `canvas-command-failed`）。所有 toast 与节点名都走 `translate`（缺 `translate` 时回落一个 `{name}` 插值器）；画布身份变了就不报 toast。`translate` 缺省时 `String(key).replace(/\{(\w+)\}/g, ...)`，缺失变量补空串。
   - 接线时须接全局截图/反推提示词链路（第 34–36、63–71 批的捕获链宿主）。
4. `modelCatalogProviderCard`
   - 主要导出：`isModelCatalogProviderVisible(entry, providerId)`、`bindModelCatalogProviderCardVisibility({ store, card, providerId })`。
   - 冻结行为：可见判定要求四处同时成立——查询的 `providerId` 归一（trim + 小写）后非空、条目 `provider` 归一后与之**严格相等**、条目 `status` 严格等于 `'ready'`、`modelCount` 是有限数且 `> 0`。`bind...` 缺 `card` 返回空卸载函数；否则订阅模型目录状态，只写 `card.hidden`（不碰其它属性），返回订阅的退订函数。
   - 接线时须接模型设置页的厂商卡片可见性（`subscriptionStateWatcher` 订阅面）。

### 3.2 canvasCommands 组（4 件）

5. `mediaToolCommands`
   - 主要导出：`registerMediaToolCommands(registry)`，注册 7 条命令：`video.reverse`、`video.extractKeyframes`、`video.separateAv`、`audio.separate`、`image.splitGrid`、`media.resetSize`（其中前两条与后两条走通用单节点 runner 工厂，工厂内部再注册）。
   - 冻结行为：节点类型白名单是**小写比较**——`source-video`/`ai-video`/`video`、`source-audio`/`ai-audio`/`audio`、`source-image`/`ai-image`/`image`；`media.resetSize` 的可重置集合只有 `source-image`、`source-video`、`ai-image`、`ai-video`。单节点命令的 `nodeId` 解析：优先入参 `nodeId`（trim），缺省时在选中节点里挑第一个类型匹配的；解析不到抛 `MISSING_NODE_ID`，查不到节点抛 `NODE_NOT_FOUND`，类型不符抛 `UNSUPPORTED_NODE_TYPE`（details 带 `supportedTypes`）。媒体工具缺失抛 `MEDIA_TOOL_UNAVAILABLE`，工具返回空或 `ok === false` 抛 `MEDIA_TOOL_NO_RESULT`（文案优先 `message`、再 `reason`）。`video.extractKeyframes` 与 `image.splitGrid` 还额外要求产出 id 列表非空，否则同样抛 `MEDIA_TOOL_NO_RESULT`。结果字段：`video.reverse` 出 `videoId`；`video.separateAv` 出 `videoId` + `audioId`；`audio.separate` 出 `leaderId` + `peerId`；三者都用 `String(x || '')` 拼 `nodeIds` 并 `filter(Boolean)`。`image.splitGrid` 的 `cols`/`rows` 走 `Number` + `Math.trunc` 再 clamp 到 `[1, 12]`，非法回落 2。`media.resetSize`：`ids` 优先于 `nodeId` 优先于选中集，去重后逐个校验；**显式传 `nodeId` 时校验失败会抛错，走选中集时静默跳过**不支持的节点；全部被跳过则抛 `MISSING_NODE_ID`。尺寸解析按节点类型分派：`source-image` 取 `imageWidth/imageHeight`，`source-video` 取 `selectedVideoWidth` 回落 `videoWidth`，`ai-image`/`ai-video` 取主结果项尺寸、再回落节点自身尺寸，最后才用 `aspectRatio` 文本按 `/(\d+(?:\.\d+)?)\s*[:：xX/]\s*(\d+(?:\.\d+)?)/` 解析；`source-*` 用「短边缩放到 `SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE`」等比缩放，`ai-*` 用 `AI_GENERATION_NODE_SHORT_SIDE`；都拿不到就用默认尺寸（`source-image`/`source-video` 512×288，其余 320×180）。写回时统一 `Math.max(1, Math.round(...))` 并把 `needsAutoResize` 置假，整批包在 `batch` 里（无 `batch` 就直跑），最后 `commit`。
   - 接线时须接画布命令总线的媒体工具装配（`mediaTools` 能力对象与右键菜单）。
6. `nodeExportCommands`
   - 主要导出：`registerNodeExportCommands(registry)`，注册 `node.exportSelected`（`riskLevel: 'confirm'`，能力面 `writes: ['filesystem']`、`requiresSystemAccess: true`）。
   - 冻结行为：导出 API 取 `host.nodeExport` 或 `host.windowObject.electronAPI.nodeExport`，且必须有 `exportSelected` 函数，否则 validate 返回 `NODE_EXPORT_UNAVAILABLE`。目标参数用「首个非空」策略归一：`directory` ← `directory`/`downloadDir`/`targetDir`/`destinationDirectory`，`outputPath` ← `outputPath`/`filePath`/`path`，`filename` ← `filename`/`fileName`。条目来自 `collectSelectedNodeExportItems`，为空抛 `NO_EXPORTABLE_ITEMS`（details 带 `ids` 与 `skipped`）。执行侧把结果交给宿主 `exportSelected`：`canceled` 为真抛 `NODE_EXPORT_CANCELED`；`success !== true` 抛错误码取宿主 `code` 再回落 `NODE_EXPORT_FAILED`，文案取 `message`/`error`/缺省 `Node export failed.`，并把宿主返回整体塞进 details。成功时把入参与宿主的 `skipped` 合并（扁平化，非数组当空）后连同 `ids` 一起回传。
   - 接线时须接节点批量导出入口（第 10 批的原生确认与真实复制链路）。
7. `storyboardCommands`
   - 主要导出：`registerStoryboardCommands(registry)`，注册 `storyboard.createFromImages` 与 `storyboard.createGridFromNode`（都是 `riskLevel: 'safe'`，写 `nodes` 与 `selection`）。
   - 冻结行为：`createFromImages` 的来源 id 依次取 `ids`、`nodeId`、选中集里类型属于 `source-image`/`ai-image`/`image` 的节点；逐个校验存在性（`NODE_NOT_FOUND`）与类型（`UNSUPPORTED_NODE_TYPE`），去重后为空抛 `MISSING_IMAGE_NODES`，超过 `MAX_STORYBOARD_CELLS = 100` 抛 `TOO_MANY_STORYBOARD_CELLS`（details 带 `count`/`max`）。排序 `orderBy` 归一后只有四种：`visual`/`grid`/`reading` → `visual`，`left-to-right`/`x`/`horizontal` → 左到右，`top-to-bottom`/`y`/`vertical` → 上到下，其余（含缺省）→ `selection` 即不动顺序；非 `selection` 且多于 1 项时用副本排序，比较器按 x 再 y 或 y 再 x，**取不到坐标按 0**。栅格：显式给了 `cols`/`columns` 或 `rows` 才按给定值走（`Math.trunc` 后 clamp 到 `[1, 12]`，非法回落 1），缺一个就按另一个补算，两个都没有就按 `ceil(sqrt(n))` 铺；给全了但乘积不够放就抬高 `rows`。名字 `String(name).trim() || 'Storyboard'`。单元格：逐格取节点资产，节点缺失建空格（`id + '-cell-N'`、`url:''`、`isEmpty:true`）；节点在但无可用资产抛 `IMAGE_ASSET_NOT_FOUND`；有资产时把 `localPath`/`thumbLocalPath`/`url`/宽高写进单元格并打 `storyboardSourceNodeId`、`storyboardExtractedCell:true`、`storyboardLockedCell:true`、`isEmpty:false`。资产解析顺序：localPath 系列取 `images[mainImageIndex]` 再回落节点自身，url 系列本地路径存在时**让位**（返回空串）。尺寸用首个有正宽高的资产算宽高比与画板尺寸；位置优先用入参 `x`/`y`（都必须是有限数），否则从首个来源节点右侧 80px 起用 `findAvailablePosition` 找空位。落地统一 `addNode` + `setSelectedNodes([nodeId])` 包在 `batch` 里，再 `commit`；返回 `nodeId`/`node`/`sourceNodeIds`（副本）/`cols`/`rows`/`cellCount`。
   - `createGridFromNode`：`sourceId` 必填且必须查到节点（`NODE_NOT_FOUND`，缺省文案用 `(empty)`）；节点必须能取出画板可用图片引用，否则 `IMAGE_ASSET_NOT_FOUND`；`cols`/`rows` 非法回落 2（`[1,12]`），`baseShortSide` 非法回落 400。位置用 `calcSafeSpawnPosNearNode` 落在源节点旁。落地不包 `batch`（`addNode` → `setSelectedNodes([nodeId])` → `commit`）。
   - 接线时须接分镜/画板创建入口（右键菜单与命令总线）。
8. `taskCommands`
   - 主要导出：`registerTaskCommands(registry)`，注册 `task.focusResult`（`safe`，写 `viewport`）与 `task.retry`（`confirm`，写 `nodes` 与 `generationTasks`）。
   - 冻结行为：目标节点解析按 `ids` → `nodeId` → `targetNodeId` → `resultNodeId` 顺序收集并去重，任一个查不到就抛 `NODE_NOT_FOUND`；给了 `taskId` 时再全量扫节点，用**递归深度上限 4**的深度优先查找八种任务 id 键（`taskId`、`task_id`、`rhTaskId`、`asyncTaskId`、`dreaminaSubmitId`、`submitId` 等，值 trim 后非空才收）命中即把该节点加入；一条目标都没凑出来且没给 `taskId` 时回落当前选中集；最终仍为空抛 `TASK_TARGET_NOT_FOUND`。`focusResult` 要求宿主提供 `focusNodes`，否则返回 `VIEWPORT_FOCUS_UNAVAILABLE`；`padding`/`durationMs` 用「有限且 `>= 0` 否则回落」的归一（缺省 80 / 800），`options` 只接受非数组对象否则 `{}`；执行后返回 `focused` 为 `focusNodes` 返回值 `!== false`。`retry` 要求解析出的目标**恰好一个**，否则返回 `AMBIGUOUS_TASK_TARGET`；执行时从 `nodeRuntimeRegistry.resolve` 取运行时，缺 `runGeneration` 抛 `TASK_RETRY_UNAVAILABLE`；透传的 options 会强制补 `source`（入参已有则保留）与 `retry: true`，已有 `taskId` 且 options 里没有时补进去。返回值里 `status` 从宿主结果与节点状态里按 `status`/`jobStatus`/`result.status`/`jobStatus`/`rhTaskStatus`/`asyncTaskStatus` 顺序取值并小写，全空时用 `ok` 布尔折成 `success`/`failed`，都没有就给空串；`taskId` 按宿主结果、节点、入参的顺序取首个非空。
   - 接线时须接任务中心「定位结果节点 / 重试」两个动作。

### 3.3 settings 组（5 件）

9. `apiConfigSavePresentation`
   - 主要导出：`createApiConfigSavePresentation(documentObject, { timerHost, successDuration })`，返回 `{ update, destroy }`。
   - 冻结行为：构造时立刻渲染一次，并注册语言变更回调（`onLocaleChange`）；状态机只有 `auto`/`saving`/`saved`/`error` 四态，文案走 i18n `settings.saveStatus.<状态>`。`update` 在已销毁时静默返回；每次 `update` 都把自增序号加一并清掉旧定时器，`saved` 态才起定时器，超时回调再验一次序号与销毁位，不匹配就不回 `auto`（避免旧定时器覆盖新状态）。按钮：`btnApiSave` 的 `disabled` 与 `aria-busy` 只跟 `saving` 走；状态节点 `apiConfigSaveStatus` 按状态切换 `settings-provider-status--testing`/`--success`/`--danger` 三个类并写 `textContent`（不用 HTML）。`successDuration` 缺省 2000ms。缺元素时对应分支跳过，不抛错。
   - 接线时须接 API 配置页保存按钮与状态文案宿主。
10. `downloadNamingSettings`
    - 主要导出：`initDownloadNamingSettings()`（无参数、无返回值，幂等）。
    - 冻结行为：只作用于 `#downloadUseOriginalFilenameGroup [data-download-original-filename]` 这一组按钮；初始态从 `getDownloadUseOriginalFilename()` 读；选中判定是 `dataset.downloadOriginalFilename === 'on'` **严格等于**布尔值，再与当前值比对；点击时调 `setDownloadUseOriginalFilename(...)` 并用其返回值重绘。重绘只写 `classList.toggle('active')` 与 `aria-pressed`。用元素上的 `__downloadNamingBound` 标记保证重复 init 不重复绑监听。
    - 接线时须接设置页下载命名分组（原位 `init` 调用点）。
11. `localAssetCleanupList`
    - 主要导出：`createLocalAssetCleanupList({ list, toolbar, details, onSelectionChange })`，返回 `{ selectedItems, setBusy, setScan }`。
    - 冻结行为：一页 `PAGE_SIZE = 50`，扫描结果按页渲染，选择用 `localPath` 作键的 `Set`，跨页保留。工具栏自建四个按钮 `selectPage`/`clearSelection`/`previousPage`/`nextPage`（类名固定 `settings-save-btn settings-btn-ghost`，带 `data-cleanup-action`，`disabled` 时点击不触发）与两个说明 span（`aria-live="polite"` 的选中摘要 + 页码摘要）。可操作性判定 `ok === true && canTrash !== false && !busy`：只有可操作时勾选框才启用、`onSelectionChange` 才收到真实选择，否则一律回传空数组。「全选本页」还额外要求本页非空；「下一页」在 `(page+1) * 50 >= 总数` 时禁用。选中摘要里的字节数用 `formatCleanupBytes` 汇总（`Number(size) || 0` 累加）。扫描结果为空时列表与工具栏一起 `hidden`。`setScan` 会清空选择并把页码归 0，然后按 `coverage`（`projectFiles`/`canvasDirectory`/`mediaDirectories[].prefix → path`）与 `warnings`（`source: message`）拼 `details` 文本（`\n` 连接），无内容则 `hidden`。条目内固定展示文件名（`localPath.split('/').pop()`）、绝对路径（回落 localPath，并写 `data-tooltip` 与 `data-tooltip-overflow`）、`kind` 只认 `image`/`video`/`audio`/`waveform` 否则显示 `media`，再接字节数。
    - 接线时须接素材清理设置页（扫描结果与确认删除宿主）。
12. `nodeManagerSettings`
    - 主要导出：`initNodeManagerSettings({ uiStore, root, eventTarget })`，返回卸载函数。
    - 冻结行为：只认三个固定按钮 `btnNodeManagerPlacementLeft`/`Right`/`Bottom`（映射 `left`/`right`/`bottom`，用 `Object.freeze` 冻结）。初始化时从 store 读（`getStateRaw` 回落 `getState`，抛错则回落默认值）并归一，然后刷新按钮 `active` 类与 `aria-pressed`。**只在归一结果与上次不同时**才派发 `NODE_MANAGER_PLACEMENT_EVENT`（`CustomEvent` 优先取 `eventTarget.CustomEvent` 再回落 `globalThis.CustomEvent`，`detail` 为 `{placement}`）；目标缺失或 `CustomEvent` 不是函数时静默跳过。点击按钮先 `uiStore.setNodeManagerPlacement(...)` 再本地刷新。若 store 提供 `subscribeSelector`，还会订阅 `ui.nodeManagerPlacement` 变化并同步刷新；卸载函数移除全部监听并退订。
    - 接线时须接节点管理器位置设置与布局事件消费方。
13. `notificationShortcutSettings`
    - 主要导出：`syncNotificationShortcut(keys)`。
    - 冻结行为：模块级持有 `revision` 与串行 `syncQueue`。`desktopBridge.notification.isAvailable()` 为假时**直接返回 undefined 且不入队**；每次调用自增 revision 并把任务串到队列尾（队列前序失败会被 `catch` 吞掉，不阻断后续）。任务执行前与拿到结果后各验一次 revision，落后即放弃写入，保证并发调用只有最后一次生效。`desktopBridge.notification.updateGlobalShortcut({keys})` 抛错会被折成 `{success:false}`。失败时只在「与上次失败按键组合不同」时 toast `settings.shortcuts.notificationShortcutUnavailable`（warn），成功则清空失败记忆；toast 走 `globalThis.window?.showToast?.`，没有宿主就静默。函数返回串行队列 promise。
    - 接线时须接快捷键设置页的通知快捷键保存动作。

## 4. 第 2 组：验证结果

### 4.1 首跑失败与处置（本组的关键差异）

- 首跑 13 个测试文件：**168 例 / 166 通过 / 2 失败**。失败只在 `src/modules/canvasCommands/storyboardCommands.test.js`：
  - 第 246 行用例 `createFromImages execute 建节点、选中并提交`（断言在改前的第 292 行）；
  - 第 398 行用例 `createGridFromNode execute 铺满重复素材单元格并追加在源节点右侧`（断言在改前的第 447 行）。
- 根因定位：两者都是 `assert.deepEqual([calls.selected, ...], [[result.nodeId], ...])`。测试替身写的是 `setSelectedNodes: (ids) => calls.selected.push(ids)`，所以 `calls.selected` 实际是 `[[nodeId]]`；而实现侧（`storyboardCommands.js` 第 347、441 行）确实调的是 `setSelectedNodes([nodeId])`，即**传数组是对的**。断言写成 `[result.nodeId]` 少了一层嵌套。
- 处置：**只改测试期望**，把两处首个期望元素改成 `[[result.nodeId]]`，未触碰移植过来的实现。复跑 168/168 全绿。
- 记录：这是本组首跑发现的测试侧笔误，不是实现缺陷。

### 4.2 检查结果表

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 导出闸门 | 13/13 `MISSING_TOTAL=0`（34 条导入全命中） | `b125g-gate.txt` |
| prettier 逐字节 | 13/13 与 prettier(镜像) 相同 | `b125g/port/` |
| `node --check` | 26/26 通过 | 本机实跑 |
| bare node 导入 | 13/13 成功、无顶层 DOM 副作用 | 本机实跑 |
| 本组单测 | 168 / 168 / 0（修复后） | 本机实跑 |
| src 全量回归 | 6497 / 6454 / 43 | `b125g-src-raw.tap` |
| src 失败名单 | 43 项与 `b85-fails.txt` 逐条相同，新增 0 消失 0 | `b125g-fails.txt` |
| api 全量回归 | 791 / 791 / 0（未变） | `b125g-api-raw.tap` |
| 消费方反查 | 真实命中 0（仅匹配到模块自身定义） | 本机扫描 |
| 受保护文件 | `api/freeImageHostApi.js` 未被触碰 | 本批只新增文件 |

## 5. 第 2 组：未执行项与边界

- 本体未接线：13 件都没有接入任何入口，从入口沿相对 import 走不到，运行时零影响。
- 未跑变异测试（第 125f 组做了 302 个变异体的检出统计，本组未做）。
- 未启动应用、未构建、未联调、未提交推送。
- 运行验收欠账不变，仍按 TRACKING.md 的既有口径挂账。
- 本组文件是先前落在工作树里的，落地时的中间产物（当时的闸门输出、prettier 暂存记录）没有留存；§2/§4.2 的闸门与逐字节结果是本次重新实跑得到的。

## 6. 第 2 组：收尾与下一段

- 本批落地不接线，代码与 `docs/tracking/` 只做记录，不提交不推送。
- **下一组（125h）候选已做闸门预筛**：按 OK 队列顺序取下一组 14 件，用 `b123/b123-gate.mjs` 实测 **10 件 `MISSING_TOTAL=0` 可落、4 件受阻**。
  - 可落 10 件（镜像体积）：`assetPackageMedia` 8066B、`audioVoiceLocalAsrRuntime` 3743B、`audioVoicePanelGenerationFeedback` 2074B、`audioVoicePanelPickSession` 14643B、`audioVoicePanelSegmentState` 8772B、`audioVoicePlaybackSession` 8117B、`audioVoiceTranslation` 6480B、`canvasProjectSaveTransaction` 1921B、`collaboration/collaborationInvitation` 4502B、`collaboration/collaborationMembers` 6306B（合计约 64.6 KB）。
  - 受阻 4 件与缺失导出：`app/appTopbarCustomProviderPolicy` 缺 `../subscriptionAccess.js :: CUSTOM_PROVIDER_VIP_MODEL_ID`；`assetCoverResolver` 缺 `../services/canvasMediaLocalService.js :: resolveCanvasVideoDisplayUrl`；`characterAssets/characterAssetImageGeneration` 缺 `../services/canvasMediaLocalService.js :: resolveCanvasVideoPosterUrl`；`cliLoginMissingToast` 缺 `./settings/panelSettings.js :: openSettingsPanelToField`。
  - 这 4 件解阻同样需要升代受保护或既有件，属 §7.3 口径，不要硬上。
- 建议下一批落 125h 的 10 件可落件（带同名测试、落地不接线），受阻 4 件转入 §7.3。
- R01–R26 未完成，仍待后续批次逐条清账。
