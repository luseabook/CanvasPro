# 第89批专题：分镜 3D（背景标定/背景图/透视估计/素材选择/语音输入/几何导入核心）自洽核心 `src/modules/storyboard3d/`（6 件零依赖落地不接线）

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86、87、88 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**；第 86 批落地 6 件（`docs/storyboard3d-director-camera-and-timeline.md`）、第 87 批落地 6 件（`docs/storyboard3d-viewport-and-interaction-policies.md`）、第 88 批落地 6 件（`docs/storyboard3d-director-orchestration-and-recovery.md`），本批再从「依赖完全闭合」的子集中取 6 件**逐字节**落地并配离线测试：背景图片控制器、素材目录选择、语音输入服务、背景标定数学、背景透视估计器、OBJ/STL 几何导入核心。

---

## 1. 本批要补的缺口

第 88 批交付后 `src/modules/storyboard3d/` 仍有 **16 件**缺失（97 − 18）。据 `C:/Users/luobote/.qoder/tmp/deobf-tools/b86/deps.json`：端口 `src/**` 共 1 550 件里「依赖全闭合、可在本仓直接落地、且仍缺失」者 467 件，其中 `src/modules/storyboard3d/` 占 **34 行**（含第 86–88 批已落地的 18 件陈旧行），**真正仍缺 16 件**。本批从这 16 件中取 6 件。

开工前复核：本仓对 6 个模块名**0 命中**（`grep -rn --include=*.js "<name>" .`，排除模块自身与测试后全部为 0），即既无源码也无引用点；6 件源码之间**也互不引用**（0 条相对 `import`）。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/backgroundImageController.js` | 79 | 2 940 | 0 | 背景图片体积/类型校验（4 个错误码）与运行时对象地址（Object URL）控制器：加载/清空/快照/销毁（2 个导出） |
| `src/modules/storyboard3d/assetCatalogSelection.js` | 125 | 5 130 | 0 | AI 素材候选选取：中英混排分词（含汉字 2/3/4-gram）、按名/标签/类别/家族/标识加权打分、标识去重、零分回落条目按分类轮流穿插、上限夹紧 20–120（2 个导出） |
| `src/modules/storyboard3d/voiceInputService.js` | 129 | 5 615 | 0 | 浏览器语音识别封装：能力探测、状态机（idle/starting/listening/transcribing/stopping/error）、最终/中间文本累积、无声与中止静默、销毁解绑（3 个导出） |
| `src/modules/storyboard3d/backgroundCalibration.js` | 215 | 9 969 | 0 | 背景标定数学：水平↔垂直视场角、水平视场角→焦距、标定/相机归一与夹紧、由标定推导机位与目标点、相机锁守卫、像素级投影量（9 个导出） |
| `src/modules/storyboard3d/backgroundPerspectiveEstimator.js` | 276 | 12 750 | 0 | 本地背景透视估计：JPEG EXIF 35mm 等效焦距提取（II/MM、SHORT/LONG）、行亮度/纹理/垂边窗均值定位视平线、梯度直方图定位灭点、缩略画布取像素（3 个导出） |
| `src/modules/storyboard3d/geometryImportWorkerCore.js` | 371 | 14 361 | 0 | Worker 侧 OBJ/STL 几何解析核心：OBJ 扇面三角化与正/负索引、ASCII/二进制 STL 判别与解析、包围盒、可转移缓冲收集（4 个导出） |
| `src/modules/storyboard3d/backgroundImageController.test.js` | 138 | 5 184 | — | 8 项 |
| `src/modules/storyboard3d/assetCatalogSelection.test.js` | 113 | 4 179 | — | 10 项 |
| `src/modules/storyboard3d/voiceInputService.test.js` | 224 | 7 523 | — | 10 项 |
| `src/modules/storyboard3d/backgroundCalibration.test.js` | 401 | 12 878 | — | 13 项 |
| `src/modules/storyboard3d/backgroundPerspectiveEstimator.test.js` | 208 | 7 899 | — | 9 项 |
| `src/modules/storyboard3d/geometryImportWorkerCore.test.js` | 232 | 7 831 | — | 9 项 |

6 件源码合计 **1 195 行 / 50 765 B**；6 件测试合计 **1 316 行 / 45 494 B**（59 项）；新增总计 **2 511 行 / 96 259 B**。

6 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Number['isFinite']`、`Array['isArray']`、`Object['prototype']['hasOwnProperty']['call']`、`0x` 十六进制、`\x20` 转义、逗号表达式、计算属性名方法 `['start']`）。

### 2.1 关键行为（供接线时对照）

- **`backgroundImageController.js`**：`DEFAULT_STORYBOARD_3D_BACKGROUND_MAX_BYTES = 0x40 * 0x400 * 0x400`（64 MiB）。`validateStoryboard3DBackgroundImageFile(file, {maxBytes = 64MiB} = {})` 依次累积四条错误：`BACKGROUND_FILE_NAME_REQUIRED`（`背景图片缺少文件名。`，`name` 去空后为空）、`BACKGROUND_FILE_TYPE_INVALID`（`请选择图片文件。`，`type` 去空转小写后不以 `image/` 开头）、`BACKGROUND_FILE_EMPTY`（`背景图片为空。`，`Number.isFinite(size)` 为假或 `size <= 0`）、`BACKGROUND_FILE_TOO_LARGE`（`背景图片不能超过 N MB。`，`Math.round(maxBytes/1024/1024)`，仅在 `size` 有限且 `> maxBytes` 时追加，故**空文件不会叠加超限**），返回 `{ok: errors.length === 0, errors}`。`createStoryboard3DBackgroundImageController({urlApi = globalThis.URL, maxBytes} = {})` 返回 `{load, clear, getSnapshot, dispose}`：内部持有当前对象地址与快照；`load` 在**已销毁**时抛 `Background image controller has been disposed.`，在 `createObjectURL`/`revokeObjectURL` **非函数**时抛 `Browser object URL support is unavailable.`；校验失败抛 `Error`（`message` 为各条错误信息以空格连接）并挂 `.code`（首条错误码，缺省 `BACKGROUND_FILE_INVALID`）与 `.details`（完整校验结果）；成功时**先释放上一个地址**再 `createObjectURL(file)`，快照为 `{imageUrl, fileName, mimeType, byteLength, sourceKind: 'runtime-object-url'}` 并返回其浅拷贝；`clear()` 释放并清空快照；`getSnapshot()` 返回快照浅拷贝或 `null`；`dispose()` 释放并置销毁标志。
- **`assetCatalogSelection.js`**：`STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT = 0x64`（100），模块级 `MIN = 0x14`（20）、`MAX = 0x78`（120）。`normalizeText` 走 `NFKC` + `trim` + `toLocaleLowerCase`；`createSearchTokens` 取 `[a-z0-9]+` 词元，并对每段汉字（`\p{Script=Han}`）在**长度 ≤ 4 时整段入集**，再补全部 2/3/4-gram。`normalizeAssetFields` 把 `tags` 与 `keywords` 合并归一，`id` 回落 `familyId`，`familyId` 回落 `source.familyId`。`scoreAsset` 权重：名称全等 `0xf0`、名称含查询（查询长 ≥ 2）`0xa0`、查询含名称（名称长 ≥ 2）`0x78`、标签含查询（查询长 ≥ 2）`0x8c`，随后按命中词元数计名 `0x1c`、标签 `0x16`、类别 `0xa`、家族 `0x8`、标识 `0x6`。`interleaveFallbackAssets` 按分类（`category` → `sourcePack`/`source.packId` → `'other'`）分桶后**从末桶向前**轮流取头。`selectRelevantStoryboard3DAssets(assets = [], query = '', {limit = 100} = {})`：上限夹紧为 `max(20, min(120, floor(Number(limit) || 100)))`（`0`/非数字回落 100）；先按归一标识去重并丢弃无标识项；**条目数 ≤ 上限时直接按原序返回**，否则正分项按「分降序、下标升序」排在前面、零分项按分类穿插跟随，再 `slice(0, 上限)`。
- **`voiceInputService.js`**：`isStoryboard3DVoiceInputSupported(windowObject = globalThis.window)` 判定 `SpeechRecognition || webkitSpeechRecognition` 为函数。`class Storyboard3DVoiceInputService`（`lang='zh-CN'`、`continuous=false`、`interimResults=true`）以**计算属性名**定义 `['isSupported']`/`['_setState']`/`['_bindRecognition']`/`['start']`/`['stop']`/`['abort']`/`['destroy']`。`_setState(state, extras = {})` 在状态未变且无附加信息时**不通知**。`_bindRecognition` 写入 `lang`/`continuous`/`interimResults`/`maxAlternatives: 1` 并挂五个回调：`onstart` 清 `_stopping` 并置 `listening`；`onspeechstart` 置 `transcribing`；`onresult` 从 `resultIndex` 起累积（`finalText` 逐段空格拼接进 `this.finalTranscript`，`transcript` 为最终+中间拼接，`isFinal = Boolean(finalText && !interimText)`）；`onerror` 对 `['no-speech','aborted']` **置 `idle` 且不上报**，其余置 `error` 并调 `onError({error, message})`（缺省码 `recognition-error`）；`onend` 置 `recognition = null`、状态 `idle`（带 `{transcript, stopped: _stopping}`）并复位 `_stopping`。`start({resetTranscript = true} = {})`：不支持时构造 `Error`（`.code = 'speech-recognition-unsupported'`、`当前运行环境不支持语音转文字。`）、置 `error` 并 `onError` 后**抛出**；已有识别实例时返回 **`false`**；否则按需清空 `finalTranscript`，`new` 出识别对象、绑定、置 `starting`，`start()` 成功返回 `true`，**抛错则回滚** `recognition = null`、置 `error`（码 `start-failed`）并 `onError` 后原样抛出。`stop()`/`abort()` 无实例返回 `false`，否则置 `_stopping` 并分别调用 `stop`/`abort`（`stop` 另置 `stopping`）；`destroy()` 置空实例、`abort`、把五个回调全部置 `null`、置 `idle`。
- **`backgroundCalibration.js`**：模块级 `finite(v, fallback = 0)`、`clamp`、`vector2`、`normalizeGroundRegion`（非数组或长度 < 3 → 按视平线/斜率生成默认梯形 `[[0,y-0.5s],[1,y+0.5s],[1,1],[0,1]]`；否则 `slice(0,24)` 后逐点夹到 0–1）、`aspectFromImage`（默认 `16/9`）、`camerasEqual`（逐位比较 `position`/`target`/`focalLength`/`fov ?? 0`/`roll`，容差 `1e-6`，且要求 `aspectRatio` 严格相等）。`computeStoryboard3DVerticalFov(hFov, aspect = 16/9)` 把 `hFov` 夹到 10–170 后按 `2*atan(tan(f/2)/max(0.1, aspect))` 回车；`computeStoryboard3DFocalLengthFromHorizontalFov(hFov)` 为 `36 / (2*tan(f/2))`（同夹紧）。`normalizeStoryboard3DBackgroundCalibration(input = {})`：`imageOffset` 夹 ±2、`vanishingPoint` 夹 0–1、`binaryAssetId` **仅在去空非空时出现该键**、`horizonY` 夹 0–1（缺省 0.5）、`horizonSlope` 夹 ±1、`imageWidth/Height` 取 `max(0, round(...))`、`calibrationMethod` 缺省 `'manual'`、`horizontalFov` 夹 10–170（缺省 60）、`verticalFov` **`== null` 时为 `null`** 否则夹 10–170（缺省 40）、`cameraHeight` 夹 0.2–20（缺省 1.6）、`imageScale` 夹 0.1–10（缺省 1）、`calibrationConfidence` 夹 0–1（缺省 `manual` 为 1，否则 0）、`lockedCamera` 仅严格 `=== true`、`lockedCameraSnapshot` 有值时归一化否则 `null`。`normalizeStoryboard3DBackgroundCamera(input = {})`：`position` 缺省 `[0,1.6,5]`、`target` 缺省 `[0,1.2,0]`、`focalLength` 夹 1–300（缺省 50）、`fov` `== null` 为 `null` 否则夹 1–179、`roll` 夹 ±π、`near = max(0.001, …)`（缺省 0.1）、`far = max(1, …)`（缺省 1000）、`aspectRatio` 缺省 `'16:9'`。`deriveStoryboard3DBackgroundCamera(calibration, camera = {})` 由标定反推：垂直视场角优先取标定值，否则由水平视场角与图幅宽高比换算；`horizonY` 偏置与灭点横向偏置分别换算为俯仰/偏航角，`distance = horizonY` 偏离 0.5 足够大时取 `clamp(cameraHeight / tan(pitch), 1.5, 80)` 否则 `10`，据此求机位（y 为 `cameraHeight`）与目标点，`roll = -atan(horizonSlope / aspect)`，焦距由水平视场角换算。`updateStoryboard3DBackgroundCalibration(calibration, patch = {})` 在 `patch` 含 `horizonY`/`horizonSlope` **且未显式给 `groundRegion`** 时删除地面区域以触发重建。`setStoryboard3DBackgroundCameraLock(calibration, locked, camera)` 置锁并归一快照（解锁置 `null`）。`guardStoryboard3DBackgroundCameraChange(calibration, camera)` 未锁/无快照/与快照一致时 `{allowed: true, camera: 归一化入参, reason: ''}`，否则 `{allowed: false, camera: structuredClone(快照), reason: '背景相机已锁定；请先解除锁定再修改机位、焦距或画幅。'}`。`computeStoryboard3DBackgroundProjection(calibration, {width = 1920, height = 1080} = {})` 输出 `{focalPixels: width/(2*tan(hFov/2)), horizonY, horizonLine, vanishingPoint, groundRegion, calibrationConfidence, imageScale, imageOffsetPixels}`（后三者按画幅像素换算）。
- **`backgroundPerspectiveEstimator.js`**：`extractStoryboard3DFocalLength35mmFromExif(bytes)` 手写 JPEG 段遍历：要求 `FF D8` 开头，逐段读大端长度，遇 `DA`/`D9` 或非法长度即停；命中 APP1 且前 6 字节为 `Exif\0\0` 时取 TIFF 头判 `II`/`MM` 字节序，读 IFD0 中 `0x8769`（ExifIFD 指针）再读 `0xa405`（`FocalLengthIn35mmFilm`），支持 type 3（SHORT）与 type 4（LONG），**值 ≤ 0 返回 `null`**。`estimateStoryboard3DBackgroundPerspective(imageData, {sourceWidth, sourceHeight, focalLength35mm = null} = {})` 在缺 `data` 或长度不足 `w*h*4` 时抛 `TypeError('Background perspective estimation requires RGBA image data.')`；`estimateHorizon` 以行亮度均值/行内水平梯度/垂直边缘三组窗均值差（权重 `0.58/0.22/0.2`）乘中框加权 `0.62 + 0.38*exp(-((y/H - 0.48)/0.3)^2)` 打分，最高分 `< 0.5` 时回落 `{horizonY: 0.5, confidence: 0.2}`，否则视平线归一并在 0.12–0.88 夹紧、置信度夹 0.25–0.82；`estimateVanishingPointX` 以水平/垂直亮度差求斜率、经斜率门（`0.08`–`3.5`）与强度门（`26`）筛选后投 96 桶直方图并做 1-邻域平滑，无有效样本回落 `confidence 0.12`。合成结果：`horizontalFov` 夹 10–170（有 35mm 焦距时按 `2*atan(18/focal)` 换算，否则 60）、`verticalFov` 按宽高比换算、`vanishingPoint`、`cameraHeight: 1.6`、`imageWidth/Height`、`groundRegion` 默认梯形、`calibrationMethod` 为 `'exif-local-estimate'`/`'local-image-estimate'`、`calibrationConfidence = clamp(0.7*视平线置信 + 0.3*灭点置信, 0.2, 有EXIF ? 0.9 : 0.78)`。`analyzeStoryboard3DBackgroundImage(file, {documentObject = globalThis.document, imageBitmapFactory = globalThis.createImageBitmap?.bind(globalThis), maxDimension = 0x200} = {})` 为异步：缺文件抛 `TypeError('Background image file is required.')`；工厂非函数抛 `Error('当前浏览器不支持本地背景透视分析。')`；画布/2D 上下文缺失抛 `Error('无法创建背景透视分析画布。')`；否则按 `min(1, max(64, maxDimension)/max(宽,高))` 缩放到缩略画布、以 `willReadFrequently: true` 取 `ImageData`，并在 `finally` 中 `close()` 位图；仅当文件类型为 `image/jpeg` 且可 `arrayBuffer()` 时才尝试读取 EXIF 焦距。
- **`geometryImportWorkerCore.js`**：`FLOAT_PATTERN` 支持科学计数。`parseStoryboard3DObjGeometry(buffer, {name = 'OBJ model', onProgress} = {})` 以 `TextDecoder` 解码后逐行解析：`v`（取 3 分量、须全有限）、`vn`（3）、`vt`（≥2）、`o`/`g` 换名并先结算当前网格、`usemtl` 换材质并先结算、`mtllib` 收集、`f` 以空格切分并过滤空项后按 `pos/uv/normal` 解析（`resolveObjIndex` 支持 1 基与负索引，越界/0 得 `-1`）；面不足 3 点或任一位置索引非法则整行跳过；合法面按扇形三角化（`v0, vi, vi+1`），逐顶点压入位置并 `expandBounds`，法线/UV 任一顶点缺失即**整网格丢弃**该属性；`o`/`g`/`usemtl` 与收尾都会结算（无位置则丢弃）。进度：起始 `0.08`，每 4096 行回调 `0.08 + 比例*0.82`，收尾 `1`。返回 `{format:'obj', name: 去扩展名, meshes, bounds, triangleCount, materialLibraries}`，网格载荷为 `{name, materialName, attributes, triangleCount}`，属性形如 `{position|normal|uv|color: {array: ArrayBuffer, itemSize, count}}`。无任何面时抛 `OBJ did not contain any triangle faces.`。`parseStoryboard3DStlGeometry(buffer, {name = 'STL model', onProgress} = {})`：`isBinaryStl` 判据为 `长度 ≥ 0x54` 且 `0x54 + 三角形数*0x32 ≤ 长度`（小端读偏移 `0x50` 的 uint32）；二进制路径读取每面法线与三顶点（含 2 字节属性偏移跳过），ASCII 路径以正则抓 `facet normal … outer loop … endloop` 与其中最多 3 个 `vertex`，任一顶点/面缺失即跳过该面，无面时抛 `STL did not contain any triangle facets.`；两者都返回单网格的 `{format:'stl', name, meshes, bounds, triangleCount, materialLibraries: []}`。`parseStoryboard3DWorkerGeometry({format, buffer, name, onProgress} = {})`：`buffer` 非 `ArrayBuffer` 抛 `TypeError('Worker geometry import requires an ArrayBuffer.')`；`'obj'`/`'stl'` 分派，其余抛 `Worker geometry import does not support <大写格式或 UNKNOWN>.`。`collectStoryboard3DGeometryTransferables(geometry)` 收集各网格属性中的 `ArrayBuffer` 与 `index.array`。

## 3. 接线状态（零生产消费方，记账）

6 件在本仓**均无生产消费方**：`grep -rn --include=*.js "<name>" .`（排除 12 个本批文件）**0 命中**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 6 件的真实导入方（`grep -rl` 复核其导入说明符）**全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓全部不存在**（逐名 `test -e` 复核为 `missing`）：

| 本批模块 | 端口内的真实消费方（本仓均 `missing`） |
| --- | --- |
| `backgroundImageController.js` | `directorScenePanel.js`、`editorWorkspace.js`、`index.js` |
| `assetCatalogSelection.js` | `aiCommandAgent.js`、`projectGeneration.js` |
| `voiceInputService.js` | `aiVoiceController.js`、`index.js` |
| `backgroundCalibration.js` | `backgroundCalibrationInteraction.js`、`editorWorkspace.js`、`index.js`、`sceneRuntime.js` |
| `backgroundPerspectiveEstimator.js` | `editorWorkspace.js` |
| `geometryImportWorkerCore.js` | `index.js`、`modelGeometryImport.worker.js` |

其中 `editorWorkspace.js` 与 `index.js` 是 R09 的主装配点（第 88 批已记为同代未落地依赖），另有 `sceneRuntime.js`（3D 视口运行时）、`backgroundCalibrationInteraction.js`、`modelGeometryImport.worker.js`、`directorScenePanel.js`、`aiVoiceController.js`、`aiCommandAgent.js`、`projectGeneration.js` 等**同代未落地**依赖，属于整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**，输出 `b86/deps.json`。第 88 批已用 `b88/picks.mjs` 对同一批 22 件候选逐件抓取说明符并在端口树内解析；本批从该已审计集合里剩余的 16 件中取 6 件。

**(b) 本批候选的直接 `grep` 复核**（不采信任何扫描器的 `deps===0`）：6 件各以 `grep -nE "^import |from '\.|from \"\."` 复核得 **0**（无任何相对导入），并另以 `grep -rn --include=*.js "<name>" .` 全树反查，确认**本仓**无任何引用点（端口内的引用方见 §3）。

**(c) 逐字节落地**：6 件均从端口原始文件复制到 `deobf-tools/b89/port/` 经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 6/6 `IDENTICAL`（§5），未做任何「顺手美化」。

**(d) 本批与第 88 批的口径差异**：第 88 批刻意回避了 8 件带 `threeRuntime.js`/`core/math.js`/`core/panoramaSceneMath.js`/`GLTFLoader.js` 相对依赖的候选；本批所取 6 件**全部零 `import`**，因此不存在世代一致性风险，落地前只需确认「相对目标存在」这一项为空即可。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 6 | **6/6 `IDENTICAL`**（落地后与格式复检后各验一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js` × 6 | 全部 OK |
| 格式 | `prettier --check src/modules/storyboard3d/*.js`（本批 12 件） | **All matched files use Prettier code style!**（首轮 5 个测试文件告警，`--write` 后复检通过；6 件源码自始未被改写） |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{backgroundImageController,assetCatalogSelection,voiceInputService,backgroundCalibration,backgroundPerspectiveEstimator,geometryImportWorkerCore}.test.js` | **59/59 通过，0 失败** |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 059/2 016/43**（第 88 批为 2 000/1 957/43，+59/+59/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–88 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 575 / 0`（第 88 批实测 562，+13 = 6 源码 + 6 测试 + 本专题文档 1） |

测试期间修正的 1 处**测试自身**的期望错误（实现一字未改）：`assetCatalogSelection` 的「零分回落条目按分类穿插」用例误用了默认上限 100，致 25 条候选走「条目数 ≤ 上限直接返回」的分支；改为显式传 `{limit: 20}` 以进入评分+穿插路径。

## 6. 未执行的验收项

- **未接线**：6 件无任何生产消费方，端到端行为无从触发。
- **未运行真实 UI/浏览器 API**：`backgroundImageController` 的 `URL.createObjectURL`、`voiceInputService` 的 `SpeechRecognition`、`backgroundPerspectiveEstimator` 的 `createImageBitmap`/`OffscreenCanvas`/`getImageData` 全部以**手写桩件**替代（Node 无 BOM），**未验证**真实浏览器下的对象地址生命周期、语音识别事件序列、位图缩放与 `willReadFrequently` 的实际像素结果。
- **未验证真实图像质量**：视平线/灭点估计只在「纯灰」与「上下二分」两类合成图上断言，**未**用真实分镜背景图评估精度；EXIF 提取只在**手工拼装的合成 JPEG** 上验证，未覆盖真实相机原图的 APP1 多段、缩略图 IFD 与 XMP 混排等情形。
- **未验证真实模型文件**：OBJ 只覆盖四边形扇面、负索引、混合法线与越界跳行；STL 只覆盖单面 ASCII 与单面二进制；均**未**在真实大模型（十万级面片）上验证进度回调、内存与 `bounds` 数值精度，也未在真实 `Worker` 中验证可转移对象的 `postMessage` 语义。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- 交付物为 6 源码 + 6 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（假对象桩件只存在于测试内）。

## 8. 下一批建议

1. **同族续取**：`src/modules/storyboard3d` 缺失降为 **10 件**（16 − 6），其中零相对导入的 4 件为 `binaryAssetRepository.js`（457 行）、`imagePoseRetargeter.js`（569 行）、`storyboardExport.js`（383 行）、`texturePolicy.js`（493 行）；另 6 件（`directorMultiView.js`、`directorSceneAuthoring.js`、`directorViewportRuntime.js`、`gltfImportAdapter.js`、`instanceBatching.js`、`transformSession.js`）带 `threeRuntime`/`core/math`/`panoramaSceneMath`/`GLTFLoader` 直接依赖，**落地前须先核对本仓 `threeRuntime.js` 的世代是否与端口一致**。**落地前仍须逐件 `grep` 复核导入面**。
2. **升代类仍须单独成批**：`rendererVirtualization.js` 升代（`resolveRendererVirtualizationTier` 0/4、`resolveRendererLowZoomMountLimit` 0/5）、`canvasMediaLocalService.js`（28 个消费方）升代、`src/components/media-clip` 整片（端口 16 件 vs 本仓 10 件、世代互非超集），以及 `main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的「设置/策略/手势/编排/回收/背景/导入」自足层已补齐 24 件（第 86 批 6 + 第 87 批 6 + 第 88 批 6 + 本批 6），但要形成可运行链路，`editorWorkspace.js`/`index.js`/`projectModel.js`/`directorTimelinePanel.js`/`workspaceController.js`/`sceneRuntime.js` 这一层是绕不开的**同代装配体**，且其下游还牵着 three.js 视口运行时、GPU 能力探测与模型包下载/缓存。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
