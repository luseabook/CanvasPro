# 第93批专题：分镜 3D（视口导航协议 / Worker 入口 / 姿态控制器 / 片段时间轴 / 场景运行时 / 导出控制器 / 导入作业）依赖闭合 7 件落地不接线

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86–92 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**，第 86–92 批累计落地 38 件；本批续取第 92 批 §8 点名的 **7 件可落地候选**并**逐字节**落地、配离线测试：视口导航协议、几何导入 Worker 入口、人物图像姿态控制器、片段（运动/动作）时间轴、导演场景运行时、分镜导出控制器、模型导入作业。

本批是第 92 批「连带解阻」记账的直接兑现：第 92 批落 6 件后**新解阻** `modelImportJob.js`（→ 本批前已落地的 `modelImport.js`）、`directorClipTimeline.js`（→ `directorClips.js`）、`characterImagePoseController.js`（→ `imagePoseEstimator.js`）、`exportController.js`，再加第 91 批点名的 `viewportNavigationProtocol.js`（→ `viewportNavigationSettings.js`）、`modelGeometryImport.worker.js`（→ `geometryImportWorkerCore.js`）、`directorSceneRuntime.js`（→ `threeRuntime.js` + `binaryAssetRepository.js` + `directorSceneSettings.js`），恰为 7 件。

---

## 1. 本批要补的缺口

第 92 批交付后 `src/modules/storyboard3d/` 仍有 **59 件**未落地（端口 97 − 本仓 38）。其中**全部相对目标在本仓存在**者为 **9 件**（`b92/audit.mjs` 实测 `OK 2 / BLK 50` 之前的状态）：7 件可落地、2 件仍被 `src/core/math.js` 导出面阻住。本批把 7 件可落地件**取尽**。

开工前复核：本仓对这 7 个模块名 `grep -rl --include=*.js "<name>" src electron api`（排除自身源码与本批测试文件）**各 0 命中** —— 既无源码也无生产引用点，7 件在此之前**均不存在于本仓**。

## 2. 交付物

| 文件 | 行数 | 字节 | 相对依赖（本仓已在位） | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/viewportNavigationProtocol.js` | 56 | 2 465 | `viewportNavigationSettings` | 视口导航协议：模式常量（orbit/pan/dolly/fly-look）、按「预设 + 修饰键 + 鼠标键」解析导航模式、按飞行模式/预设给帮助文案、按快捷键解析工具（修饰键按下即不响应）（4 个导出） |
| `src/modules/storyboard3d/modelGeometryImport.worker.js` | 31 | 1 121 | `geometryImportWorkerCore` | 几何导入 Worker **入口**：模块求值时即以 `self.addEventListener('message')` 订阅消息，按消息类型解析 OBJ/STL 并 `postMessage` 回传结果/错误（0 个导出） |
| `src/modules/storyboard3d/characterImagePoseController.js` | 132 | 5 666 | `imagePoseEstimator`、`imagePoseRetargeter` | 人物图像姿态控制器：骨骼覆盖签名（键排序 + 分量 `toFixed(8)`）、逐人物状态快照（idle/running/success/error）、识别编排（单飞顶替、目标消失复核、骨骼数下限 6、中途中止回 idle、错误态写文案并上抛）、`clear`/`dispose`（3 个导出） |
| `src/modules/storyboard3d/directorClipTimeline.js` | 275 | 12 243 | `directorClips`、`directorTimelineOperations` | 片段时间轴面板控制器：整段 HTML 渲染（操作按钮 + 逐片段一行 + CSS 变量百分比定位 + 选中态）、点击动作分发（select/create/copy/paste/duplicate/delete，含剪贴板的项目/镜头归属校验）、拖拽改起止（阈值/指针捕获/取消还原）、键盘微调、`bind`/`destroy`（1 个导出：类） |
| `src/modules/storyboard3d/directorSceneRuntime.js` | 304 | 14 223 | `panoramaSceneNode/threeRuntime`、`binaryAssetRepository`、`directorSceneSettings` | 导演场景运行时：可见对象/实例根收集（实例优先于桥接网格）、场景同步、标签/材质同步（solid/clay/transparent 三模式 + 陈旧材质回收）、全景曲面、地面高度采样、障碍物收集、`dispose`（1 个导出：类） |
| `src/modules/storyboard3d/exportController.js` | 865 | 40 933 | `storyboardExport`、`collageFactory`、`downloadSaveService`、`focusTrap` | 分镜导出控制器：工程镜头收集/当前镜头解析、导出选项归一（6 模式/画幅/分辨率/宫格/视频时段与轨道）、选择集收敛、宫格槽位与拖放换位、整份导出表单渲染（分镜栏/模式/设置/预览或宫格编排/视频字段/开关/进度/目的地）、`Storyboard3DExportController` 类（8 个导出） |
| `src/modules/storyboard3d/modelImportJob.js` | 285 | 11 351 | `modelImport` | 模型导入作业：作业状态机（queued/reading/parsing/completed/error/cancelled，进度单调不减）、外部/内部双中止信号、`yieldControl` 让出主线程、解析进度映射到 0.55–0.95、中止后资源回收（几何/材质/纹理去重 dispose）、快照/`cancel`/`start`（7 个导出） |
| `src/modules/storyboard3d/viewportNavigationProtocol.test.js` | 150 | 6 503 | — | 9 项 |
| `src/modules/storyboard3d/modelGeometryImport.worker.test.js` | 133 | 4 998 | — | 7 项 |
| `src/modules/storyboard3d/characterImagePoseController.test.js` | 229 | 9 511 | — | 11 项 |
| `src/modules/storyboard3d/modelImportJob.test.js` | 351 | 12 402 | — | 16 项 |
| `src/modules/storyboard3d/directorClipTimeline.test.js` | 474 | 16 551 | — | 19 项 |
| `src/modules/storyboard3d/exportController.test.js` | 234 | 9 718 | — | 15 项 |
| `src/modules/storyboard3d/directorSceneRuntime.test.js` | 261 | 8 422 | — | 10 项 |

7 件源码合计 **1 948 行 / 88 002 B**；7 件测试合计 **1 832 行 / 68 105 B**（**87 项**）；新增总计 **3 780 行 / 156 107 B**。

7 件源码**逐字节等于端口**（`cmp` 7/7 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Object['freeze']`、`Number['isFinite']`、`String(...)['trim']()`、`0x` 十六进制、`\x20` 转义、计算属性名方法 `['render']()`、逗号表达式）。

### 2.1 关键行为（供接线时对照）

- **`viewportNavigationProtocol.js`**：`STORYBOARD_3D_NAVIGATION_MODE`（冻结：`orbit`/`pan`/`dolly`/`fly-look`）。`resolveStoryboard3DNavigationMode(event, {flyMode = false, preset})`：**先把未知预设回落 `DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET`**（unity），再按分支——`flyMode && button === 2` → `FLY_LOOK`；`blender` 预设**只认左键**（ctrl/meta → `dolly`、shift → `pan`、否则 `orbit`）；`unity` 预设（左键 → `pan`、alt+左键 → `orbit`、alt+右键 → `dolly`、否则 `null`）；**其余预设（含 maya/C4D）须按住 alt** 才响应（左/右/中 → orbit/pan/dolly），否则 `null`。`getStoryboard3DNavigationHelpText({flyMode, preset})`：飞行模式返回固定文案 `飞行模式 · WASD / Q E / 右键观察 / Shift 加速`，否则取 `presets[preset].summary`、未知预设回落默认预设的 `summary`。`resolveStoryboard3DNavigationTool(event, {preset})`：**任一修饰键（alt/ctrl/meta/shift）按下即返回 `null`**，否则委托 `resolveStoryboard3DToolFromShortcut(event.key, preset)`。**注意**：`resolveStoryboard3DNavigationMode` 的第二参数里 `preset` 只取 `presets[preset] ? preset : 默认` 作白名单判定，模式分支用的是该白名单结果；而 `resolveStoryboard3DNavigationTool` **把 `preset` 原样透传**给快捷键查表（未做白名单归一），未知预设由被依赖模块自行回落。
- **`modelGeometryImport.worker.js`**：模块求值时即执行 `self['addEventListener']('message', …)`（**入口型模块，导出 0 项**），在回调内按 `message.data` 的类型字段选择解析器并 `postMessage` 回传结果或错误。**测试须在动态 `await import(...)` 之前**把 `globalThis.self` 装成 `{addEventListener, postMessage}` 桩件，否则模块求值即抛。
- **`characterImagePoseController.js`**：`MIN_APPLIED_BONES = 0x6`。`createStoryboard3DBoneOverridesSignature(boneOverrides)`：按键 `localeCompare` 排序后逐个取 `Number(Number(v).toFixed(8))`（非数组分量记为 `[]`）再 `JSON.stringify`。`createStoryboard3DCharacterImagePoseController({estimator, retarget, getCharacter, applyPose, onStateChange})`：`getCharacter`/`applyPose` 非函数即抛 `TypeError`（`'getCharacter is required.'`/`'applyPose is required.'`）；内建 `Map` 存逐人物状态（`Object.freeze` 快照并入 `idleState`、`objectId` 强制字符串），`onStateChange` 每次状态变化即回调。`extract({objectId, file})`：已销毁 → 抛带 `code 'POSE_CONTROLLER_DISPOSED'`（文案 `姿势识别器已关闭。`）；目标非 `character` → `POSE_CHARACTER_NOT_FOUND`（`目标人物已不存在。`）；**新请求先 `abort('开始新的姿势识别。')` 顶替在途请求并自增 `requestId`**，写 `running` 态；`await estimator.analyze(file, {signal})` 后**双重复核**（已销毁或 `requestId` 已过期 → 返回 `null`；目标识别中途被移除 → `POSE_CHARACTER_NOT_FOUND`（`识别完成前目标人物已被移除。`））；骨骼数 `< 6` → `POSE_RETARGET_INSUFFICIENT`（`可见关节太少，无法生成可靠姿势。请换一张全身清晰、遮挡较少的图片。`）；成功调 `applyPose({objectId, boneOverrides, confidence（夹 0–1）, warnings})` 再复核一次，写 `success` 态并返回 `{...重定向结果, state}`；catch 里 `AbortError`/`ABORT_ERR` → 回 `idle` 且返回 `null`，其它错误写 `error` 态后**原样上抛**。`clear(objectId)`：若在途对象匹配则 `abort('姿势已重置。')`、清空、自增 `requestId`，再写该对象 `idle`。`dispose()`（幂等）：置 `disposed`、自增 `requestId`、`abort('编辑器已关闭。')`、调 `estimator.dispose?.()`、清空 `Map`。返回 `{extract, clear, getSnapshot, dispose, get disposed}`。
- **`directorClipTimeline.js`**：`escape(v)` **只转义 `&`/`"`/`<`（不转义 `>`）**。`class DirectorClipTimeline` 的 `['render'](payload)` 输出操作按钮（`data-storyboard-3d-action="timeline-clip-<key>"`）与逐片段一行（`data-clip-id`/`data-clip-kind`、`--clip-start`/`--clip-width` 百分比、选中态类），**缺动画时只渲染空态**。`['handleClick'](action, element)`：非 `timeline-clip-` 前缀返回 `false`；无动画返回 `true`（不突变）；`timeline-clip-select` 记选中（`dataset.clipId`/`clipKind`）；`create` 用 `collectDirectorKeys` 过滤出 `editing.selected` 中的键再 `createDirectorClip`；`copy` 记剪贴板（带 `projectId`/`shotId`/`copyDirectorClip` 结果）；`paste` **须剪贴板项目与镜头均与本上下文一致**才 `pasteDirectorClip(…, _timeForShot(shot))`；`duplicate` 以源片段 `end` 为落点调 `duplicateDirectorClip`；`delete` 对 `action` 只过滤 `actionClips`，对 `motion` 则连同 `cameraKeyframes` 与各 `objectTracks` 的三组关键帧一并剔除该片段认领的 id；**末尾统一 `requestRender()` 并返回 `true`**。`['bind']()`：从 `timeline.getRoot()` 取根，**同一 root 早退**，换 root 先解绑旧 root 再绑新 root（`pointerdown`，捕获）。`['drag'](event)`：命中 `closest('.storyboard-3d-motion-clip')` 且左键才处理，`preventDefault` + `stopImmediatePropagation` 后按指针位置换算时间并夹紧，取消时还原 `--clip-start`/`--clip-width`。`['handleKey'](event)`：方向键等映射为时间微调/切换选中。`['destroy']()`：解绑并清根（可重复调用）。
- **`directorSceneRuntime.js`**：`constructor(runtime)` 记 `runtime`/`materials`（`Map`）/`token`/`assetId`/`pending`/`error`。`['roots'](excludeSet = new Set())`：取 `runtime.adapted.scene.objects` 中 `visible !== false`、不在 `excludeSet`、且类型属于 `['prop','character']` 者；根优先 `importedInstanceByObjectId.get(id).mesh` → `importedModelRoots.get(id)` → 桥接 `_mannequinMap`/`_cubeMap` 的 `group`；`instanceId` 为实例内下标或 `null`；最后**只保留 `root?.isObject3D` 为真者**。`['sync']()`：`pending` 时早退。`['syncLabels'](…)`、`['syncMaterials'](mode)`（`solid`/`clay`/`transparent` 三模式，`prepareMaterials()` 造材质，**陈旧材质按 `token` 回收 dispose**）、`['syncPanorama'](settings)`（归一场景设置后铺全景曲面，半径/三轴旋转来自 `normalizeDirectorSceneSettings`）、`['surfaceHeight'](x, z, exclude = [])`（地面高度采样，回退 0）、`['obstacles'](exclude = [])`（障碍物收集）、`['dispose']()`。相对依赖三项本仓均已落地且在位（`threeRuntime` 为端口同形 1 行再导出）。
- **`exportController.js`**：`collectStoryboard3DProjectShots(project)` 取活动场景（缺省首个）的 `shots` 并逐条附 `sceneId`/`sceneName`/`sceneShotIndex`；`getActiveStoryboard3DProjectShot(project)` 先定活动场景再定活动镜头（缺省首个），返回附场景名或 `null`。`normalizeStoryboard3DExportOptions(options)`：`mode` 白名单（6 值，缺省 `current-png`）、`aspectRatio` 须在 `STORYBOARD_EXPORT_ASPECT_RATIOS` 内（缺省 `16:9`）、`resolution` 白名单（`720p`/`1080p`/`2K`/`4K`）、`gridSize` 取 `Number(gridSize) || columns²` 且白名单 `[4, 9, 16]`（缺省 9）、`columns = sqrt(gridSize)`，**仅视频模式**才带 `videoStart`/`videoEnd`（各夹 `[0, 3600]`）与 `videoTrack`（缺省 `'all'`），三个布尔以 `!== false` 语义取真。`reconcileStoryboard3DExportSelection(mode, all, selected)`：`grid-png` → `[]`；序列模式 → 选中集非空则用选中集、否则首个镜头；其余模式 → 首个有效选中镜头、否则首个镜头。`createStoryboard3DExportGridSlots(all, gridSize, ordered)`：选中集前置、其余按原序补齐，长度固定为 `gridSize`、空位为 `''`。`placeStoryboard3DShotInGrid(slots, {shotId, sourceIndex, targetIndex})`：越界/空 id 原样返回；**源与目标不同且源有效时优先走 `buildCollageItemSwapPatch` 的交换通道**（`sourceIndex` 缺省取 `indexOf(shotId)`），否则退化为「先清掉同 id 的其它槽、再落到目标槽」。`class Storyboard3DExportController`（`constructor({getProject, renderFrame, renderVideo, onComplete, downloadResults, downloadResult, documentObject, windowObject})`，`downloadResults` 缺省时按 `downloadResult` 逐个包装、再缺省 `saveMediaFilesDownload`）渲染完整导出表单并处理交互/进度/取消；`createStoryboard3DExportController(options)` 为工厂。
- **`modelImportJob.js`**：`STORYBOARD_3D_MODEL_IMPORT_JOB_STATUSES`（冻结六态）、终态集 `{completed, error, cancelled}`。`Storyboard3DModelImportJobError extends Error`（`name`/`code`（缺省 `MODEL_IMPORT_FAILED`）/`stage`/`cancelled`）；`normalizeStoryboard3DModelImportJobError(error, {stage})`：**已是本类即原样返回**，`name === 'AbortError'` 或 `code === 'ABORT_ERR'` → 归为取消（`code 'MODEL_IMPORT_CANCELLED'`、`cancelled: true`），否则包成带原文案/原码的错误。`yieldStoryboard3DModelImportStart({windowObject, setTimeoutFn})`：有 `requestAnimationFrame` 时用它包一层 `setTimeout(…, 0)`，否则直接 `setTimeout(…, 0)`。`cachedFileLike(file, buffer)` 造出 `{name, fileName, type, size: byteLength, lastModified: max(0, ·), webkitRelativePath, arrayBuffer: async () => buffer}` 供解析器复用同一缓冲。`disposeCancelledStoryboard3DModelImportResult(result)`：先调 `parsed.disposeResources?.()`，再遍历 `scene`/`scenes` 用**两个 `Set` 去重**逐几何/材质/纹理 `dispose()`。`class Storyboard3DModelImportJob`：`constructor({file, relatedFiles, importOptions, importModel, **signal**, yieldControl, disposeResult, idFactory, onProgress, onStateChange, onError})` —— **公开的中止信号入参名是 `signal`，内部存为 `this.externalSignal`**（`file` 须有 `arrayBuffer` 否则 `TypeError('A readable model file is required')`；`importModel`/`yieldControl` 非函数亦抛 `TypeError`）；`jobId` 由 `idFactory('model-import')` 或 `crypto.randomUUID()` 生成、再回落 `model-import-<ts>-<rand36>`。`_transition(status, progress, extra)`：进度**单调不减**（`max(现值, 夹 0–1 的新值)`），回调顺序为 `onStateChange(snapshot, {reason: status})` 再 `onProgress(合并快照)`。`_isCancelled()` 四判（终态 `cancelled` / `cancelReason !== null` / 外部信号 `aborted` / 内部 `AbortController.signal.aborted`）；`_throwIfCancelled(stage)` 抛取消错误。`cancel(reason)`：终态直接返回 `false`，否则记原因、`abortController.abort(reason)`、写取消错误、转 `cancelled`，返回 `true`。`_run()` 时序：`queued`(progress 0) → `_throwIfCancelled` → `yieldControl` → `_throwIfCancelled` → `reading`(0.12) → `await file.arrayBuffer()`（**非 `ArrayBuffer` 即抛 `MODEL_FILE_UNREADABLE`**）→ `parsing`(0.55) → `yieldControl` → `_throwIfCancelled` → `await importModel(cachedFileLike(...), {...importOptions, relatedFiles, signal: abortController.signal || externalSignal, onProgress})`（解析进度映射为 `0.55 + p*0.4`，取消后丢弃后续回调）→ 完成前若已取消则 `disposeResult(result)` 并抛取消 → `completed`(1)；catch 归一错误，取消类返回 `null`（必要时补转 `cancelled` 态），否则写 `error` 态、`onError(error, snapshot)` 后**上抛**；`finally` 解绑外部 abort。`start()`：重复调用返回同一 `runPromise`；`started` 置真、`_bindExternalAbort()`（`{once: true}` 监听 `abort`）、**若外部信号已 aborted 立即 `cancel(reason)`**，再跑 `_run()`。`createStoryboard3DModelImportJob(options)` 为工厂。

## 3. 接线状态（零生产消费方，记账）

7 件在本仓**均无生产消费方**：`grep -rl --include=*.js "<name>" src electron api`（排除自身源码与测试）**各 0 命中**；开工前 7 件亦**皆不存在于本仓**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 7 件的真实导入方（`grep -rl "<name>.js"` 复核）全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓**全部不存在**（逐名 `test -e` 复核为 `missing`）：

| 本批模块 | 端口内的真实消费方（本仓均不存在） |
| --- | --- |
| `viewportNavigationProtocol.js` | `editorWorkspace.js` |
| `modelGeometryImport.worker.js` | `workerModelImportAdapters.js` |
| `characterImagePoseController.js` | `editorWorkspace.js` |
| `directorClipTimeline.js` | `shotTimelineController.js` |
| `directorSceneRuntime.js` | `sceneRuntime.js` |
| `exportController.js` | `editorWorkspace.js`、`index.js` |
| `modelImportJob.js` | `editorWorkspace.js`、`index.js` |

其中 `editorWorkspace.js` 与 `index.js` 是 R09 的主装配点（第 88–93 批反复记为同代未落地依赖），`workerModelImportAdapters.js`/`shotTimelineController.js`/`sceneRuntime.js` 同属整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**。本批以复核脚本 `deobf-tools/b92/audit.mjs` 对 `src/modules/storyboard3d/` 全目录重跑，得候选 **52 件**（端口 97 − 本仓 45）。

**(b) 本批候选的直接 `grep` 复核（不采信任何扫描器的 `deps===0`）**：7 件逐件以 `grep -nE "^import |from '\.|from \"\."` 复核导入面 —— **单子句 `grep` 会漏掉第二个 `import` 子句**，本批多次命中该盲点并靠**整文件阅读**纠正：`characterImagePoseController.js` 有 **2 个**相对 import（第 2 个是 `imagePoseRetargeter.js`）、`directorClipTimeline.js` 有 **2 个**（第 2 个是 `directorTimelineOperations.js`）、`directorSceneRuntime.js` 有 **3 个**、`exportController.js` 有 **4 个**。故仍按既定口径逐件手工复核，不采信任何扫描器。

**(c) 被依赖模块导出面逐符号核对**（本仓均为更早批次已落地件，逐符号 `grep '^export'` 确认在位）：
- `viewportNavigationSettings.js`：`DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET`、`STORYBOARD_3D_NAVIGATION_PRESETS`、`resolveStoryboard3DToolFromShortcut` **在位**。
- `geometryImportWorkerCore.js`：本批 worker 入口所需解析/转移缓冲符号 **在位**。
- `imagePoseEstimator.js`：`createStoryboard3DImagePoseEstimator` **在位**；`imagePoseRetargeter.js`：`retargetMediaPipePoseToStoryboard3D`（第 413 行）**在位**（此为本批唯一需要**读文件确认**的咬合点，第 92 批只核到 `imagePoseEstimator`）。
- `directorClips.js`：`createDirectorClip`/`duplicateDirectorClip`/`editDirectorClip`/`copyDirectorClip`/`pasteDirectorClip` **在位**；`directorTimelineOperations.js`：`collectDirectorKeys`/`directorKeyIdentity` **在位**。
- `panoramaSceneNode/threeRuntime.js`：1 行再导出、与端口**逐字节同形**（无世代差）；`binaryAssetRepository.js`：`createStoryboard3DBinaryAssetRepository` **在位**；`directorSceneSettings.js`：`normalizeDirectorSceneSettings` **在位**。
- `storyboardExport.js`：`renderStoryboardGrid`/`renderStoryboardSequence`/`resolveStoryboardExportDimensions`/`STORYBOARD_EXPORT_ASPECT_RATIOS` **在位**；`collageFactory.js`：`buildCollageItemSwapPatch` **在位**；`downloadSaveService.js`：`saveMediaFilesDownload` **在位**；`focusTrap.js`：`focusFirstElement`/`restoreFocus`/`trapTabKey` **在位**。
- `modelImport.js`：`detectStoryboard3DModelFormat`/`importStoryboard3DModelFile` **在位**（第 92 批落地件）。
- `src/core/math.js` **未**被本批任何一件依赖（本批 7 件全部避开第 91 批 §4(c) 的升代阻塞点）。

**(d) 逐字节落地**：7 件均从端口原始文件复制到 `deobf-tools/b93/port/`，经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 7/7 `IDENTICAL`（§5），未做任何「顺手美化」。

**(e) 剩量修正与级联记账**：本仓 `src/modules/storyboard3d/` 落地后为 **45 件**（第 92 批后 38 + 本批 7），端口 **97 件**，**仍有 52 件未落地**。重跑 `b92/audit.mjs`：**`OK 2 / BLK 50`** —— 其中**全部相对目标在本仓存在**者仅剩 **2 件**，且二者仍**被 `src/core/math.js` 导出面阻住**（`clientToViewportNdc`/`ndcToViewportPoint`/`intersectRayWithAxisPlane` 在本仓 `src/core/math.js` **各 0 命中**，本批复查确认）：`directorMultiView.js`、`directorViewportRuntime.js`。余 **50 件**因相对目标在本仓缺失而受阻。**本批把「相对目标齐备」的可落地子集取尽**，此后该目录的纯新增推进只剩升代解阻与依赖链补全两条路。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 7 | **7/7 `IDENTICAL`**（落地后复检一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js`（源码 7 + 测试 7） | 全部 OK |
| 格式 | `prettier --check`（本批 7 源码 + 7 测试） | 首轮 **5 个测试文件**告警，`--write` 后复检 **All matched files use Prettier code style!**；**7 件源码自始未被改写** |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{viewportNavigationProtocol,modelGeometryImport.worker,characterImagePoseController,modelImportJob,directorClipTimeline,exportController,directorSceneRuntime}.test.js` | **87/87 通过，0 失败**（9 + 7 + 11 + 16 + 19 + 15 + 10） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 303/2 260/43**（第 92 批为 2 216/2 173/43，+87/+87/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–92 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 621 / 0`（第 92 批实测 606，+15 = 7 源码 + 7 测试 + 本专题文档 1） |

测试编写期间修正的 **5 处测试自身**的期望错误（**实现一字未改**）：
1. `exportController.test.js`：`placeStoryboard3DShotInGrid(['a','a','c','d'], {shotId:'a', targetIndex:3})` 期望写成去重回落路径的 `['','a','c','a']`，实际**先走 `buildCollageItemSwapPatch` 交换通道**（`sourceIndex` 缺省 `indexOf('a') === 0 ≠ 3`）得 `['d','a','c','a']`；期望改为 `['d','a','c','a']` 并注明「源镜头在格内出现多次时按首个匹配交换，其余重复项原样保留」。
2. `exportController.test.js`：`downloadResult` 逐文件包装用例里我把 `seen.push` 写成取 `payload.blob`，与期望的整个 `payload` 不一致；改为 `seen.push([payload, filename, destination])`。
3. `modelImportJob.test.js`：解析进度序列真值为 `[0, 0.12, 0.55, 0.75, 0.75, 0.9500000000000001, 1]` —— 回退的 `onProgress(0.25)` 被 `Math.max` 吸收但**快照仍报告当前更高进度**，另叠加浮点噪声；改为断言 `map((v) => Number(v.toFixed(6)))` 对 `[0, 0.12, 0.55, 0.75, 0.75, 0.95, 1]`。
4./5. `modelImportJob.test.js`：外部 `AbortSignal` 两个用例（含解绑用例）误传 `externalSignal:` —— **构造器公开入参名是 `signal`**（内部才存为 `this.externalSignal`），故未绑监听、作业跑到完成；3 处改为 `signal: controller.signal`。

## 6. 未执行的验收项

- **未接线**：7 件无任何生产消费方，端到端行为无从触发。
- **未运行真实浏览器/GPU 环境**：`modelGeometryImport.worker.js` 以**手写 `self` 桩**（动态 `import` 前装入）验证消息协议，**未**加载真实 Worker；`characterImagePoseController` 以**延迟 resolve 的 estimator 桩**验证单飞/顶替/中止；`directorSceneRuntime` 以**假 `runtime` 桥**（`adapted.scene`/`bridge._mannequinMap`/`_cubeMap`/`importedInstanceByObjectId`/`importedModelRoots`）与假材质验证三模式材质同步，**未**接真实 three.js 场景与真实 GPU；`directorClipTimeline`/`exportController` 以**假 DOM/假 `window`/假 `AbortController`** 验证属性与类名写入，**未**在真实浏览器中验证 SVG/指针捕获/焦点陷阱。
- **未验证真实 three.js 视口**：`directorSceneRuntime.js` 已能干净 import（Node v24 下以守卫式 `ProgressEvent` 垫片 + 顶层 `await import` 载入，因 `vendor/three/three.core.js` 的 `FileLoader` 依赖浏览器全局 `ProgressEvent`），但**未**验证真实视口渲染、材质模式切换的视觉结果与全景曲面贴图。
- **未覆盖真实文件系统/选择器/IndexedDB**：`exportController` 的默认下载实现只用桩件验证「逐文件包装」形状，**未**验证真实目录选择与落盘；`modelImportJob` 不触真实文件系统。
- **未覆盖 Worker 真实载体**：`modelGeometryImport.worker.js` 的 `self` 桩只覆盖 `message` 一条通道，**未**覆盖真实 `postMessage` 转移（transferable）语义与 Worker 生命周期。
- **未覆盖受阻件**：`directorMultiView.js`/`directorViewportRuntime.js` **未落地**（需先做 `core/math.js` 升代）。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- **未伪造 shim**：`directorMultiView.js`/`directorViewportRuntime.js` 的 `core/math.js` 导出面缺口仍**受阻记账**，未新增同名假实现、未把受阻件接到假消费方。
- 交付物为 7 源码 + 7 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（假 DOM/假 `self`/假 `runtime` 只存在于测试内）。
- 测试**未联网、未跑 Electron、未起服务、未打开窗口、未写仓库外运行状态**。

## 8. 下一批建议

1. **R09 同族续取（第 94 批候选）**：本批已把「相对目标齐备」的可落地子集**取尽**，本目录仅剩 **52 件**未落地（端口 97 − 本仓 45），其中 **`OK 2`** 的 `directorMultiView.js`/`directorViewportRuntime.js` 仍被 `src/core/math.js` 导出面阻住（需 `clientToViewportNdc`/`ndcToViewportPoint`/`intersectRayWithAxisPlane` 三个符号），**另 50 件须先落其依赖链**（`projectModel.js`/`shotAnimation.js`/`sceneRuntime.js`/`editorWorkspace.js`/`index.js` 等装配体是公共前置）。**下一批若要纯新增，须换特性区**（见第 4 条）；若留在 R09，则须先做升代（见第 2 条）。
2. **升代类仍须单独成批**：`src/core/math.js` 升代（32 → 52 导出，+20，含上述 3 个视口符号；**62 个消费方**）、`rendererVirtualization.js` 升代、`canvasMediaLocalService.js` 升代（28 个消费方）、`src/components/media-clip` 整片、`main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的自足层已补齐 **45 件**（第 86–92 批 38 + 本批 7）。要形成可运行链路，`editorWorkspace.js`/`index.js`/`sceneRuntime.js`/`projectModel.js`/`shotTimelineController.js`/`workerModelImportAdapters.js` 这一层是绕不开的**同代装配体**（本批 7 件的端口消费方恰好全落在其中），其下游即 three.js 视口运行时、GPU 能力探测与模型包下载/缓存。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
4. **并行可取的其它特性区**（口径同本批，均须先逐件 `grep` 复核、并核被依赖模块世代）：`b86/deps.json` 里仍缺且依赖闭合的 `src/modules/agent` 32 件、`storyWorkspace` 32 件、`personReplacement` 25 件、`app` 18 件、`collaboration` 17 件、`components/aigenImage` 13 件、`domain/storyGeneration` 13 件、`components/video-node` 11 件、`manifests/image` 11 件、`components/shared` 10 件、`panoramaSceneNode` 9 件等。
5. **仍欠（不变）**：`web-preview/*` 5 条路由渲染器侧消费点、`storage-migration/prepare`、44 个未移植 CSS 自定义属性、`nodeBatchExport.toasts.*` 7 键 × 2 语言与 `storyboardExportPending` 1 键（均须授权改 `src/i18n/messages/*`）、`nativeContextMenuIcons` 待 `webPreviewViewManager` 升代、`main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换。
