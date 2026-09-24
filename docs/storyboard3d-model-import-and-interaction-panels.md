# 第92批专题：分镜 3D（模型导入 / 素材记录 / 片段编排 / 交互面板）依赖闭合 6 件落地不接线

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86–91 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**；前六批各落地 6/6/6/6/4/6…（即第 86–90 批共 28 件、第 91 批 4 件），本批续取第 91 批 §8 点名的余下候选中 **依赖闭合且导出面齐备** 的 **6 件**并**逐字节**落地、配离线测试：模型导入、运动片段编排、素材记录、导演轨迹面板、姿态估计器、背景校准交互。

本批是第 91 批 §8.1「**须先逐件做导出面审计再落地**」的直接执行：先逐件 `grep` 复核导入面（**不采信任何扫描器的 `deps===0`**，含 `export … from` 再导出盲点），再逐符号核对被依赖模块在本仓的导出面，确认 6 件所需符号**全部在位**后才落地。

---

## 1. 本批要补的缺口

第 91 批交付后 `src/modules/storyboard3d/` 仍有 **59 件**未落地（端口 97 − 本仓 38）。第 91 批 §8.1 点名其中一批**只依赖已落地模块**的候选（`assetRecord.js`、`modelImport.js`、`directorCameraPathPanel.js`、`directorClips.js`、`backgroundCalibrationInteraction.js`、`imagePoseEstimator.js`、`modelGeometryImport.worker.js`、`directorSceneRuntime.js` 等），本批从中取 **6 件**落地并留 2 件（worker 入口 + 场景运行时）给第 93 批。

开工前复核：本仓对这 6 个模块名**仅命中各自的测试文件**（`grep -rn --include=*.js "<name>" src electron api`）——既无源码也无生产引用点，6 件在此之前**均不存在于本仓**。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖（本仓已在位） | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/modelImport.js` | 297 | 12 201 | `gltfImportAdapter` | 模型导入：格式表（glb/gltf/fbx/obj/stl 扩展名 + mime 反查）、来源校验（名称/格式/空文件/体积/可读性五类错误码）、内容嗅探（GLB 头与 `asset.version`、glTF JSON、OBJ 顶点+面、FBX 头、STL 二进制/ASCII）、归一化计划（等比缩放 + 居中 + 落地）与 userData 读写、导入编排（解析器查找与进度透传）、文件选择器（13 个导出，含 2 个 `export … from` 再导出） |
| `src/modules/storyboard3d/directorClips.js` | 195 | 8 686 | `directorTimelineOperations` | 运动片段编排：片段归一（失效/被认领关键帧剔除、开始结束夹紧、排序、300 上限）、四分支采样、创建（防重复占用）、编辑（动作片段偏移 / 运动片段整体移动 + 逐帧取整 + 范围守卫）、复制/粘贴/复刻（id 与时间重映射）（7 个导出） |
| `src/modules/storyboard3d/assetRecord.js` | 102 | 4 439 | `gltfImportAdapter` | 素材记录：规范化资产 id（SHA-256 小写十六进制）、IndexedDB 引用归一、资产记录装配（包围盒优先入参、退回 `measureStoryboard3DImportedSceneBounds`；三角面计数优先 `countStoryboard3DSceneTriangles`；limitations 去重）（6 个导出） |
| `src/modules/storyboard3d/directorCameraPathPanel.js` | 160 | 6 631 | `directorCurveEditor` | 导演轨迹面板：渲染「运动轨迹」字段集（对象选择过滤 camera/light/group、编辑/聚焦/绘制/平滑/直线/删除按钮、平面与手绘时长、控制点选择与时间/焦距/倾斜/缓动/位置/目标字段），并内嵌曲线编辑器（1 个导出） |
| `src/modules/storyboard3d/imagePoseEstimator.js` | 187 | 7 204 | `imagePoseRuntimeManifest` | 姿态估计器：本地 Worker 生命周期（惰性启动/复用/终止）、请求登记与超时、中止信号、结果/错误/异常退出三条通路、`cancel`/`dispose`/`pendingCount`（2 个导出） |
| `src/modules/storyboard3d/backgroundCalibrationInteraction.js` | 219 | 10 027 | `backgroundCalibration` | 背景校准交互：指针归一、拖动求解（地平线模式同步消失点 / 消失点模式反推地平线）、引导几何（千分比取整）、预览同步（SVG 属性 + 数值输入 + 状态文案）、指针会话（阈值判定、抓取、Esc/取消回滚、提交）（5 个导出） |
| `src/modules/storyboard3d/assetRecord.test.js` | 207 | 7 699 | — | 10 项 |
| `src/modules/storyboard3d/directorClips.test.js` | 240 | 8 546 | — | 10 项 |
| `src/modules/storyboard3d/modelImport.test.js` | 377 | 13 963 | — | 13 项 |
| `src/modules/storyboard3d/directorCameraPathPanel.test.js` | 169 | 7 454 | — | 7 项 |
| `src/modules/storyboard3d/imagePoseEstimator.test.js` | 290 | 9 126 | — | 13 项 |
| `src/modules/storyboard3d/backgroundCalibrationInteraction.test.js` | 376 | 12 727 | — | 9 项 |

6 件源码合计 **1 160 行 / 49 188 B**；6 件测试合计 **1 659 行 / 59 515 B**（62 项）；新增总计 **2 819 行 / 108 703 B**。

6 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Object['freeze']`、`Number['isFinite']`、`String(...)['trim']()`、`0x` 十六进制、`\x20` 转义、逗号表达式）。

### 2.1 关键行为（供接线时对照）

- **`modelImport.js`**：`MODEL_FORMATS`（深冻结，glb/gltf/fbx/obj/stl，各含 `extension`/`mimeTypes`/`parserId`）。`detectStoryboard3DModelFormat(file)`：**先扩展名查表**（`extensionOf` 取 `name || fileName` 的小写 `.xxx` 后缀），未命中再用 mime **唯一匹配**（`application/octet-stream` 命中 glb+obj+stl 三项 → 返回 `''`，即无法判定）。`validateStoryboard3DModelSource(file, {maxBytes = 256 MiB})` 汇集错误：`MODEL_FILE_NAME_REQUIRED`（名称空）、`MODEL_FORMAT_UNSUPPORTED`、`MODEL_FILE_EMPTY`（`size` 非有限或 ≤0）、`MODEL_FILE_TOO_LARGE`（体积超限，文案按 MB 取整）、`MODEL_FILE_UNREADABLE`（无 `arrayBuffer`），返回 `{ok, format, errors}`。`inspectStoryboard3DModelFile(file, opts)`：校验通过后按格式嗅探——GLB 要求 `byteLength ≥ 0x14`、magic `0x46546c67`、version `2`、总长自洽、`0x10` 处 chunk 类型 `0x4e4f534a`、`0x14 + jsonLen ≤ byteLength`、且 `asset.version` 以 `'2'` 开头；OBJ 要求 `^\s*v\s+[-+\d.]` 与 `^\s*f\s+\S+` 同时命中（只看前 2 MiB）；FBX 要求 `'Kaydara FBX Binary'` 前缀或含 `'FBXHeaderExtension'`；STL 先试二进制（`byteLength ≥ 0x54` 且 `0x54 + count*0x32 === byteLength`）再试 ASCII（`^\s*solid\b` 且 `\bfacet\s+normal\b`，只看前 4 KiB）；失败统一 `MODEL_CONTENT_INVALID`（文案 `文件内容不是有效的 <FMT> 模型。`），成功返回 `{ok, format, byteLength, parserId, errors: []}`。`STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY = 'storyboard3dNormalization'`；`setStoryboard3DModelNormalization`/`readStoryboard3DModelNormalization` 读写目标 `userData` 下该键（`status` 非 `'ready'` 即删除/读回 `null`，`uniformScale` 下限 `1e-6`）。`createStoryboard3DModelNormalizationPlan(bounds, {targetSize = 2})`：包围盒六分量任一非有限 → `awaiting-bounds`（`operations: ['measure-bounds','uniform-scale','center-xz','place-on-ground']`）；否则按 `max(0, max-min)` 最大边算 `uniformScale = max(0.1, targetSize) / maxSize`，最大边 ≤ `1e-8` 抛 `Model bounds have no measurable size.`，平移把 XZ 居中、Y 抬到地面，返回 `sourceBounds` 与 `['uniform-scale','center-xz','place-on-ground']`。`importStoryboard3DModelFile(file, {parsers = {}, relatedFiles = [], targetSize = 2, maxBytes, signal, onProgress})`：先嗅探，失败抛带 `code`（首个错误码，缺省 `MODEL_IMPORT_INVALID`）与 `details`（完整嗅探结果）的错误；按 `parserId`（退回 `format`）查解析器，缺失抛 `MODEL_PARSER_UNAVAILABLE`（带 `format`）；建资源映射后调用 `parser(file, {format, resources, signal, onProgress, onWorkerProgress})`（两处进度回调同引用），生成归一化计划，返回 `{format, parsed, normalization}`。`createStoryboard3DModelResourceMap(files)`：键取**归一化全路径**与 **basename** 两份（`\`→`/`、按 `/` 拆分后**丢弃** `''`/`'.'`/`'..'` 段再拼回——注意不是做路径求解，故 `./a/./b.gltf` → 键 `a/b.gltf`）。`pickStoryboard3DModelFiles({documentObject = globalThis.document, multiple = false})`：无 `createElement` 即 `Promise.reject(new Error('File picker is unavailable.'))`；否则建 `input[type=file]`、置 `accept`、`change`(once) 解析 `files`、`cancel`(once) 解析 `[]`，并 `click()`。**再导出**：`STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES`、`getStoryboard3DModelImportCapability`（`export { … } from './gltfImportAdapter.js'`，同一对象引用）。
- **`directorClips.js`**：`normalizeDirectorClips(clips, timeline)`：先 `collectDirectorKeys(timeline)` 取全部合法关键帧 id 集，片段数 `slice(0, 0x12c)`（300）；每片段对 `keyframeIds` 去重后保留**既存在且未被前序片段认领**者，空则丢弃；`start = max(0, min(3599.9, finite(clip.start, 最小关键帧时间)))`；`end = max(start+0.1, min(0xe10, finite(clip.end, 最大关键帧时间)))`；`id` 缺省 `motion-clip-<index>`、`name` 缺省 `运动片段` 并截断到 120 字；最后按 `start` 再按 `id.localeCompare` 排序。`resolveDirectorClipSample(clips, keys, time)` 四分支：无片段命中 → 原样；无片段 `start ≤ time` → 剔除被认领关键帧；`time ≥ 活动片段 end` 且存在 `time > end` 的未认领后续关键帧 → 返回该后续集；否则收窄到活动片段关键帧并把 `time` 夹到 `end`。`createDirectorClip(timeline, keyIds, name = '运动片段')`：无匹配关键帧抛 `请先选择关键帧或创建轨迹。`；选中项已被运动片段占用抛 `选中关键帧已属于运动片段，请编辑或复制原片段。`；返回 `structuredClone` 并追加 `{id: 'motion-' + crypto.randomUUID(), name, keyframeIds, start: 最小时间, end: max(start+0.1, 最大时间)}`。`editDirectorClip(state, {kind, id, start, end, move = false})`：片段不存在返回原样深拷贝；`start`/`end` 按 `fps` 取整后须满足有限、`start ≥ 0`、`end ≤ 3600`、跨度 ≥ `1/fps`，否则抛 `片段范围必须在 0–3600 秒内且至少一帧。`；`kind === 'action' && !move` 时 `offset += (start - clip.start) * speed`，结果为负抛 `无法向前扩展到动作源起点之前。`；`kind === 'motion' && move` 时源关键帧按 `start - clip.start` 平移，越界抛 `移动后源关键帧超出范围。`；最后写回片段 `start`/`end`。`copyDirectorClip(state, kind, id)`：缺片段抛 `片段已不存在。`；返回 `{kind, clip, entries}`（`motion` 带匹配的关键帧行，`action` 为 `[]`）。`pasteDirectorClip(state, payload, startTime)`：`startTime < 0` 或 `clip.end + delta > 3600` 抛 `复制片段超出镜头时长范围。`；新 id `clip-<uuid>`，`motion` 逐条复制关键帧（新 id `key-<uuid>`、时间加 `delta`，结果越界抛 `源关键帧超出复制范围。`，目标物体轨道不存在抛 `片段对应物体轨道已不存在。`），并把 `keyframeIds` 经 id 映射重写。`duplicateDirectorClip = paste(copy(…))`。
- **`assetRecord.js`**：`STORYBOARD_3D_ASSET_RECORD_VERSION = 1`、默认库 `ai-canvaspro`、默认存储区 `storyboard3d-assets`。`createCanonicalStoryboard3DAssetId(file, {cryptoObject = globalThis.crypto})`：`file.arrayBuffer` 非函数抛 `Asset file is unreadable.`、`cryptoObject.subtle.digest` 非函数抛 `SHA-256 support is unavailable.`，否则返回 `asset:sha256:<64 位小写十六进制>`。`createStoryboard3DIndexedDbAssetReference({databaseName, storeName, key})`：`key` 去空后为空抛 `IndexedDB asset key is required.`，返回 `{kind: 'indexeddb', databaseName, storeName, key}`（库名/存储区名去空后回退默认）。`createStoryboard3DAssetRecord({file, format, parsed, normalization, canonicalAssetId = '', indexedDbReference = null, limitations = null, createdAt = Date.now()})`：格式能力缺失或 `parsing !== 'available'` 抛 `Unsupported parsed asset format: <fmt|unknown>`；`canonicalAssetId` 为空则**现算 SHA-256**；包围盒优先 `parsed.bounds`（六分量须全有限），否则退回 `measureStoryboard3DImportedSceneBounds(parsed.scene)`，二者皆无抛 `Parsed asset bounds are required.`；三角面数优先按 `parsed.scene` 计，否则取 `parsed.triangleCount`，`max(0, floor(·))`；`defaultScale` 仅在 `normalization.status === 'ready'` 时取 `max(1e-6, uniformScale)`，否则 `1`；`normalizationStatus` 为 `ready`/`awaiting-bounds`；`limitations` 取入参数组（否则能力表内置项）去空去重；`storage` 用显式引用或回退 `{key: canonicalAssetId}`；`name` 回退 `canonicalAssetId`；`createdAt` 取 `max(0, ·)`。
- **`directorCameraPathPanel.js`**：`renderDirectorCameraPathPanel(controller, timeline)` 返回整段 HTML 字符串：`<fieldset data-camera-path-panel><legend>运动轨迹</legend>`；**轨迹对象**下拉默认 `摄像机`，并列出 `controller.context().scene.objects` 中**排除 `camera`/`light`/`group`** 的对象（选项值为**过滤后数组下标**，名称做 `&`→`&amp;`、`<`→`&lt;` 转义，注意 `>` **不**转义）；按钮统一 `data-storyboard-3d-action="timeline-camera-path-{edit|focus|draw|smooth|linear|delete}"`，`disabled` 时在属性位写 `disabled`、否则留一个空格；`active` 为假时只到「编辑画面轨道」与「N 个控制点」；`active` 为真时追加「结束轨道编辑」「查看整条轨道」（**无控制点时禁用**）、「在画面点选路线/停止点选」、绘制模式（逐点/手绘）、手绘时长、**平滑曲线/直线路径**（控制点 <2 时禁用）、编辑平面（`[1,'XZ 地面']`/`[2,'XY 高度']`/`[0,'YZ 高度']`，按 `plane` 选中）、平面位置，以及控制点选择（`<option value="<下标>" [selected]>N · X.XX 秒</option>`，选中项为 `points.find(id === selectedId) || points[0]`）、「删除控制点」（无选中点，或**未选物体且摄像机关键帧 ≤1** 时禁用）；有选中点时渲染时间/焦距（未选物体时）/倾斜（角度制）/缓动（linear/ease-in/ease-out/ease-in-out）/位置与注视目标（未选物体时才给目标）字段，并**内嵌 `renderDirectorCurveEditor(选中点)`**。所有数值经 `Number(v).toFixed(3)`。
- **`imagePoseEstimator.js`**：`STORYBOARD_3D_IMAGE_POSE_WORKER_URL = new URL('./imagePoseLandmarker.worker.js', import.meta.url)`。`createStoryboard3DImagePoseEstimator({WorkerConstructor = globalThis.Worker, workerFactory, workerUrl, runtime, requestTimeoutMs = 120000})` 返回 `{analyze, cancel, dispose, get pendingCount, get disposed}`。`analyze(file, {signal})`：**先同步** `validateStoryboard3DImagePoseFile(file, runtime)`（类型/空文件/超限分别抛 `POSE_IMAGE_*`）；已中止信号 → 拒绝 `AbortError`（`name: 'AbortError'`、`code: 'ABORT_ERR'`）；无 Worker 能力 → `POSE_WORKER_UNAVAILABLE`；工厂抛错 → 携带原错误码（缺省 `POSE_ESTIMATION_FAILED`）与原文案；实例缺 `postMessage` → `POSE_WORKER_UNAVAILABLE`（`本地姿势识别 Worker 不可用。`）。Worker 以 `{type: 'module', name: 'storyboard3d-image-pose'}` 惰性创建，`bindWorkerListener` **优先 `addEventListener`/`removeEventListener`、缺则退回 `on<event>` 属性**。请求以 `requestId` 登记，`postMessage({type: 'estimate', requestId, image: file})`；`type: 'result'` 结算 `payload`，`type: 'error'` 拒绝；Worker `error` 事件拒绝**全部**待处理（`本地姿势识别 Worker 异常退出。`）并终止；`requestTimeoutMs > 0` 时超时抛 `POSE_ESTIMATION_TIMEOUT`（`本地姿势识别超时，请取消后重试或换一张尺寸更小的图片。`）并终止；`postMessage` 抛错 → 拒绝。`cancel(reason)` **仅当有待处理时**拒绝它们并返回 `true`，否则 `false`（默认文案 `姿势识别已取消。`）。`dispose()` 置 `disposed`、以待处理 `编辑器已关闭。` 拒绝并终止；此后 `analyze` 抛 `姿势识别器已关闭。`。
- **`backgroundCalibrationInteraction.js`**：`normalizeStoryboard3DBackgroundPointer(clientPoint, rect)` 把 `clientX/Y` 减 `left/top` 后除以 `max(1, width/height)` 并夹到 `[0,1]`（缺值按 0）。`computeStoryboard3DBackgroundCalibrationDrag({mode, background, startPoint, currentPoint})`：先归一背景；`mode === 'horizon'` 时 `horizonY = clamp01(bg.horizonY + cur.y - start.y)` 并把消失点 y 同步到地平线在该 x 的取值；`mode === 'vanishing-point'` 时 `vanishingPoint = cur` 并反推 `horizonY = clamp01(cur.y - slope*(cur.x - 0.5))`；其余模式不改动；最后经 `updateStoryboard3DBackgroundCalibration` 写回（**触发 `groundRegion` 失效重算**）并标记 `calibrationMethod: 'manual'`、`calibrationConfidence: 1`。`computeStoryboard3DBackgroundGuideGeometry(bg)`：每个坐标统一 `Math.round(clamp01(v) * 0x3e8)`（0–1000 千分比），返回 `{leftY, rightY, vanishingPoint: [x, y], groundPoints: "x,y x,y …"}`。`previewStoryboard3DBackgroundCalibration(root, background)`：把 `points` 写到 `[data-storyboard-3d-background-ground-region]`、`y1/y2` 写到**所有** `[data-storyboard-3d-background-horizon-line]`、`x1/y1` 写到左右轴元素、`cx/cy` 写到所有 `[data-storyboard-3d-background-vanishing-point]`；把 `horizonY`/`vanishingPointX`/`vanishingPointY`（后者为 `y/1000`）写进对应 `[data-storyboard-3d-background-field="…"]` 的 `value`，格式为 `toFixed(3)` 后去尾零与尾点；`[data-storyboard-3d-background-guide-status]` 文案写 `正在手动调整 · 100%`；返回归一化结果，节点缺失时静默跳过。`createStoryboard3DBackgroundCalibrationInteraction({root, windowObject = globalThis.window, getBackground, onPreview, onCommit, onCancel})`：`pointerdown`（左键、无进行中会话）命中 `target.closest('[data-storyboard-3d-background-drag]')`（须在 `root` 内、模式为 `horizon`/`vanishing-point`、`getBackground().imageUrl` 非空、SVG 矩形宽高有效）后置会话、给 `.storyboard-3d-background-calibration-guide` 加 `is-adjusting`、`setPointerCapture`（try/catch），并在 `window` 上以**捕获**方式挂 `pointermove`/`pointerup`/`pointercancel`/`keydown`；`pointermove` 需同 `pointerId`，位移 `hypot ≥ 1` 才算「移动」并通过 `preview…` + `onPreview(latest, {mode})` 预览；`pointerup` 清理后 `onCommit(latest, {mode})`；`pointercancel`/`Esc` 清理后先 `preview(root, initial)` 回滚再 `onCancel(initial, {mode})`；返回 `{destroy(), isDragging()}`，`destroy` 解绑 `root` 的 `pointerdown`。

## 3. 接线状态（零生产消费方，记账）

6 件在本仓**均无生产消费方**：`grep -rn --include=*.js "<name>" src electron api` **只命中各自测试文件**；开工前 6 件亦**皆不存在于本仓**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 6 件的真实导入方（`grep -rl "<name>.js"` 复核）全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓**全部不存在**：

| 本批模块 | 端口内的真实消费方（本仓均不存在） |
| --- | --- |
| `modelImport.js` | `editorWorkspace.js`、`index.js`、`modelImportJob.js`、`sceneRuntime.js` |
| `assetRecord.js` | `editorWorkspace.js`、`index.js` |
| `directorClips.js` | `directorClipTimeline.js`、`shotAnimation.js` |
| `backgroundCalibrationInteraction.js` | `editorWorkspace.js` |
| `directorCameraPathPanel.js` | `directorCameraPathController.js` |
| `imagePoseEstimator.js` | `characterImagePoseController.js` |

其中 `editorWorkspace.js` 与 `index.js` 是 R09 的主装配点（第 88–92 批反复记为同代未落地依赖），`shotAnimation.js`/`sceneRuntime.js`/`directorCameraPathController.js`/`characterImagePoseController.js`/`modelImportJob.js` 同属整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**。本批用复核脚本 `deobf-tools/b92/audit.mjs` 对 `src/modules/storyboard3d/` 全目录重跑。

**(b) 本批候选的直接 `grep` 复核**（不采信任何扫描器的 `deps===0`）：6 件各以 `grep` 提取导入面——`modelImport.js` 的 `from './gltfImportAdapter.js'` 是 **`export { … } from` 再导出**，plain-import 正则**看不见**，正是既定「扫描器盲点」规则的实例；6 件的相对导入面**仅**指向本仓已存在且世代一致的目标，逐件 `grep -rn --include=*.js "<name>" src electron api` 全树反查确认**本仓**无生产引用点（端口内引用方见 §3）。

**(c) 被依赖模块导出面逐符号核对**（本仓均为更早批次已落地件）：
- `gltfImportAdapter.js`：`countStoryboard3DSceneTriangles`、`getStoryboard3DModelImportCapability`、`measureStoryboard3DImportedSceneBounds`、`STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES`、`STORYBOARD_3D_RESOURCE_BASE_URL`、`parseStoryboard3DGltfFile`、`createStoryboard3DResourceUrlScope`、`createThreeGltfStoryboard3DParser` —— **8/8 在位**。
- `directorTimelineOperations.js`：`collectDirectorKeys` **在位**；`directorCurveEditor.js`：`renderDirectorCurveEditor`（及 `DirectorCurveEditor` 类）**在位**；`backgroundCalibration.js`：`normalizeStoryboard3DBackgroundCalibration`、`updateStoryboard3DBackgroundCalibration` **在位**；`imagePoseRuntimeManifest.js`：`STORYBOARD_3D_IMAGE_POSE_RUNTIME`、`validateStoryboard3DImagePoseFile` **在位**。
- `src/core/math.js` **未**被本批任何一件依赖（本批 6 件全部避开第 91 批 §4(c) 的升代阻塞点）。

**(d) 逐字节落地**：6 件均从端口原始文件复制到 `deobf-tools/b92/port/`，经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 6/6 `IDENTICAL`（§5），未做任何「顺手美化」。

**(e) 剩量修正与级联记账**：本仓 `src/modules/storyboard3d/` 落地后为 **38 件**（第 91 批后 32 + 本批 6），端口 **97 件**，**仍有 59 件未落地**。重跑 `b92/audit.mjs`：其中**全部相对目标在本仓存在**者为 **9 件**——`characterImagePoseController.js`、`directorClipTimeline.js`、`modelGeometryImport.worker.js`、`modelImportJob.js`、`exportController.js`、`viewportNavigationProtocol.js`、`directorSceneRuntime.js`（7 件待落地）与仍**被 `core/math.js` 导出面阻住**的 `directorMultiView.js`、`directorViewportRuntime.js`（2 件，不伪造 shim）；余 **50 件**因相对目标在本仓缺失而受阻。**注意本批的落地对本报告产生了级联**：`modelImportJob.js`（依赖本批 `modelImport.js`）、`directorClipTimeline.js`（依赖本批 `directorClips.js`）、`characterImagePoseController.js`（依赖本批 `imagePoseEstimator.js`）、`exportController.js` 由「受阻」转为「目标齐备」，故本批后的目标齐备数**高于**第 91 批的推算。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 6 | **6/6 `IDENTICAL`**（落地后复检一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js`（源码 6 + 测试 6） | 全部 OK |
| 格式 | `prettier --write`（本批 6 个测试文件） | 首轮 4 件被改写、`--write` 后复检通过；6 件源码自始未被改写 |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{assetRecord,directorClips,modelImport,directorCameraPathPanel,imagePoseEstimator,backgroundCalibrationInteraction}.test.js` | **62/62 通过，0 失败**（10 + 10 + 13 + 7 + 13 + 9） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 216/2 173/43**（第 91 批为 2 154/2 111/43，+62/+62/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–91 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 606 / 0`（第 91 批实测 593，+13 = 6 源码 + 6 测试 + 本专题文档 1） |

测试编写期间修正的 4 处**测试自身**的期望错误（实现一字未改）：
1. `assetRecord.test.js`：末条「不可读文件」用例误传**可读** `fileStub`，导致 `canonicalAssetId` 现算成功、先抛「缺包围盒」而非「`Asset file is unreadable.`」；改为传无 `arrayBuffer` 的对象且不给显式 `canonicalAssetId`。
2. `backgroundCalibrationInteraction.test.js`：「拖动地平线」用例用严格相等断言 `0.3`，实际浮点为 `0.30000000000000004`；改为容差断言并把 `vanishingPoint`/`groundRegion` 的期望**引用回计算结果**。
3. `directorCameraPathPanel.test.js`：对象名转义只做 `&`→`&amp;` 与 `<`→`&lt;`（**`>` 不转义**），期望串去掉 `&gt;`。
4. `modelImport.test.js`：资源映射用例两处——(i) 相对路径样例误写成**裸字符串**（会被当作无 `name` 项丢弃），改为 `{name: '…'}`；(ii) 键归一**只丢弃** `''`/`'.'`/`'..'` 段、**不做路径求解**，故 `./models/./e.gltf` 键为 `models/e.gltf`，期望同步修正。

## 6. 未执行的验收项

- **未接线**：6 件无任何生产消费方，端到端行为无从触发。
- **未运行真实浏览器/GPU 环境**：`imagePoseEstimator` 的 Worker 只用**手写 `FakeWorker` 桩**（含 `addEventListener` 与 `on<event>` 两套通路）验证协议；**未**加载真实 `modelGeometryImport`/`imagePoseLandmarker` Worker，也**未**接真实 MediaPipe 运行时与真实图片。`modelImport` 的内容嗅探只用**手工构造的最小 GLB/glTF/OBJ/FBX/STL 字节**；`directorCameraPathPanel`/`backgroundCalibrationInteraction` 只用**假 DOM/假 root/window** 验证属性与类名写入，**未**在真实浏览器中验证 SVG 渲染与指针捕获。
- **未验证真实 three.js 场景**：`assetRecord` 的 scene 分支用真实 `threeRuntime`（`BoxGeometry`/`MeshBasicMaterial`）验证包围盒与面数，但**未**验证真实导入模型的资源地址作用域、IndexedDB 实际读写与配额行为。
- **未覆盖真实文件系统/选择器**：`pickStoryboard3DModelFiles` 仅以假 `document.createElement` 验证 `change`/`cancel` 两条通路，**未**验证真实文件对话框与多选行为。
- **未覆盖受阻件**：`directorMultiView.js`/`directorViewportRuntime.js` **未落地**（需先做 `core/math.js` 升代）。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- **未伪造 shim**：`directorMultiView.js`/`directorViewportRuntime.js` 的 `core/math.js` 导出面缺口仍**受阻记账**，未新增同名假实现、未把受阻件接到假消费方。
- 交付物为 6 源码 + 6 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（`FakeWorker`/假 DOM/合成字节只存在于测试内）。

## 8. 下一批建议

1. **R09 同族续取（第 93 批候选）**：`src/modules/storyboard3d` 仍有 **59 件**未落地。重跑 `b92/audit.mjs` 后**相对目标齐备的 9 件**中，本批已落 6 件的**级联**新解阻了 `modelImportJob.js`、`directorClipTimeline.js`、`characterImagePoseController.js`、`exportController.js`，加上第 91 批点名的 `modelGeometryImport.worker.js`（→ `geometryImportWorkerCore`）、`directorSceneRuntime.js`（→ `threeRuntime` + `binaryAssetRepository` + `directorSceneSettings`）与 `viewportNavigationProtocol.js`，构成 **7 件可落地候选**；余 **2 件**（`directorMultiView.js`/`directorViewportRuntime.js`）仍被 `core/math.js` 导出面阻住。**落地前仍须逐件 `grep` 复核导入面并逐符号核对被依赖模块导出面**（尤其 `modelGeometryImport.worker.js` 为 worker 入口、`directorSceneRuntime.js` 含 `requestAnimationFrame` 与 three.js 运行时，须先核世代）。
2. **升代类仍须单独成批**：`src/core/math.js` 升代（32 → 52 导出，+20，含 2 件受阻所需视口符号；**62 个消费方**）、`rendererVirtualization.js` 升代、`canvasMediaLocalService.js` 升代（28 个消费方）、`src/components/media-clip` 整片、`main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的自足层已补齐 **38 件**（第 86–91 批 32 + 本批 6）。要形成可运行链路，`editorWorkspace.js`/`index.js`/`sceneRuntime.js`/`projectModel.js` 这一层是绕不开的**同代装配体**，其下游即 three.js 视口运行时、GPU 能力探测与模型包下载/缓存；本批的 `modelImport`/`assetRecord`/`imagePoseEstimator` 正是该装配体的直接前置。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
4. **并行可取的其它特性区**（口径同本批，均须先逐件 `grep` 复核、并核被依赖模块世代）：`b86/deps.json` 里仍缺且依赖闭合的 `src/modules/agent` 32 件、`storyWorkspace` 32 件、`personReplacement` 25 件、`app` 18 件、`collaboration` 17 件、`components/aigenImage` 13 件、`domain/storyGeneration` 13 件、`components/video-node` 11 件、`manifests/image` 11 件、`components/shared` 10 件、`panoramaSceneNode` 9 件等。
