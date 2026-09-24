# 第90批专题：分镜 3D（二进制素材仓库 / 姿态重定向 / 分镜导出 / 纹理策略）自洽核心 `src/modules/storyboard3d/`（4 件零依赖落地不接线）

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86、87、88、89 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**；前四批各落地 6 件（`docs/storyboard3d-director-camera-and-timeline.md`、`docs/storyboard3d-viewport-and-interaction-policies.md`、`docs/storyboard3d-director-orchestration-and-recovery.md`、`docs/storyboard3d-background-calibration-and-geometry-import.md`），本批取该目录内**最后 4 件零相对导入**的核心并**逐字节**落地、配离线测试：IndexedDB 二进制素材仓库、MediaPipe 姿态重定向、分镜网格/序列导出、纹理与上传图策略。

本批把第 88、89 批「刻意回避 `threeRuntime.js` 世代风险」的策略走到了**零 `import` 子集的尽头**——落地后该目录内**只剩 6 件**，且**全部**带 `threeRuntime`/`core/math`/`panoramaSceneMath`/`GLTFLoader` 直接依赖（详见 §8）。

---

## 1. 本批要补的缺口

第 89 批交付后 `src/modules/storyboard3d/` 按 `b88/picks.mjs` 的候选集口径仍有 **10 件**未落地，其中**零相对导入**的 4 件即本批交付物。开工前复核：本仓对 4 个模块名**0 命中**（`grep -rn --include=*.js "<name>" src electron api`）——既无源码也无引用点，4 件在此之前**均不存在于本仓**；4 件源码之间**也互不引用**（各 0 条相对 `import`）。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/binaryAssetRepository.js` | 457 | 18 233 | 0 | IndexedDB 二进制素材仓库：记录归一（Blob/ArrayBuffer/视图、相对路径规范化、描述符 JSON 安全与体积上限、路径去重）、错误类与配额映射、内存驱动 + IndexedDB 驱动、仓库门面与 3 个工厂（13 个导出） |
| `src/modules/storyboard3d/imagePoseRetargeter.js` | 569 | 22 810 | 0 | MediaPipe 33 地标 → 分镜 3D 骨骼重定向：四元数工具箱、躯干/骨盆/颈头坐标系、左右臂腿三段 IK 朝向、角度限位、可见度阈值与退化段告警（4 个导出） |
| `src/modules/storyboard3d/storyboardExport.js` | 383 | 14 676 | 0 | 分镜导出：画幅/分辨率预设与尺寸推导、网格布局与单元格坐标、三分线引导、镜头元信息行、Canvas 网格出图与逐镜序列出图（6 个导出） |
| `src/modules/storyboard3d/texturePolicy.js` | 493 | 18 946 | 0 | 纹理策略：硬件×策略双向夹紧、场景纹理巡检（保留/降采样/未知）、降采样执行（ImageBitmap→离屏画布→2D 画布三级回退、中止与资源托管）、上传前图片校验与预检（10 个导出） |
| `src/modules/storyboard3d/binaryAssetRepository.test.js` | 577 | 21 090 | — | 16 项 |
| `src/modules/storyboard3d/imagePoseRetargeter.test.js` | 282 | 11 586 | — | 10 项 |
| `src/modules/storyboard3d/storyboardExport.test.js` | 464 | 14 899 | — | 10 项 |
| `src/modules/storyboard3d/texturePolicy.test.js` | 637 | 22 904 | — | 17 项 |

4 件源码合计 **1 902 行 / 74 665 B**；4 件测试合计 **1 960 行 / 70 479 B**（53 项）；新增总计 **3 862 行 / 145 144 B**。

4 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Number['isFinite']`、`Array['isArray']`、`Object['values']`、`0x` 十六进制、`\x20` 转义、逗号表达式、计算属性名方法 `['put']`/`['get']`）。

### 2.1 关键行为（供接线时对照）

- **`binaryAssetRepository.js`**：`STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION = 0x1`、`..._DB_NAME = 'AICanvasStoryboard3DAssets'`、`..._STORE_NAME = 'assets'`；模块级 `DEFAULT_DESCRIPTOR_MAX_BYTES = 0x200 * 0x400`（524 288）、`DEFAULT_GET_MANY_LIMIT = 0x1f4`（500）。`text(x) = String(x ?? '').trim()`。**文件名只取自 `wrapper.name || input.name`**（回落主文件 `asset.bin`、附属 `related-N.bin`），**不从 `relativePath` 反推**；`relativePath = normalizePath(relativePath || path || webkitRelativePath, name)`，`normalizePath` 把 `\` 换成 `/`、丢弃空段与 `.`/`..` 段后拼回（见 §5 测试用例 `'..\\nested//..\\model.glb'` → `'nested/model.glb'`）。字段：`type` 去空回落 `blob.type` 再回落 `application/octet-stream`；`size = max(0, Number(blob.size) || 0)`；`lastModified = max(0, Number(x) || 0)`。**路径去重按 `toLocaleLowerCase()`**，冲突抛 `BINARY_ASSET_DUPLICATE_FILE`（`Duplicate binary asset file path: <path>`，保留原始大小写）。描述符经 `JSON.stringify` 还原器校验：遇二进制（`isBinaryValue`）抛 `descriptor must not contain binary data`、遇 `function`/`symbol`/`bigint` 抛 `descriptor must contain JSON-safe values only`，统一包成 `BINARY_ASSET_INVALID_DESCRIPTOR`（带 `cause`）；再用 `TextEncoder` 量字节，超 `max(0x400, descriptorMaxBytes)`（**下限 1024**）抛 `BINARY_ASSET_DESCRIPTOR_TOO_LARGE`（`Binary asset descriptor exceeds N bytes`）。非对象入参抛 `Binary asset record must be an object`；缺字段抛 `<field> is required`；无二进制抛 `<label> must contain a Blob or ArrayBuffer`。`byteLength` 为全部文件 `size` 之和；`createdAt = max(0, Number(createdAt) || now0)`、`updatedAt = now0`、`now0 = max(0, Number(now) || Date.now())`。`createStoryboard3DBinaryAssetReference` 产出 **`storage` 描述（driver `'indexeddb'`、数据库名、各文件引用与 `byteLength`）**，用于把 Blob 留在 IndexedDB、只把引用写进工程文件。仓库构造期强制驱动实现 `['put','get','getMany','remove']`，缺一个即 `TypeError('Binary asset driver must implement <m>()')`；`descriptorMaxBytes` 夹到 `max(0x400, …)`、`getManyLimit` 夹到 `max(1, …)`。`getMany` 非数组抛 `BINARY_ASSET_INVALID_QUERY`、超限抛 `BINARY_ASSET_QUERY_TOO_LARGE`。读取侧校验 `schemaVersion` 不等抛 `BINARY_ASSET_UNSUPPORTED_SCHEMA`，并把 `now` 设为记录自身的 `updatedAt` 以保持 `updatedAt` 稳定。`storageError` 遇 `name === 'QuotaExceededError'` → `BINARY_ASSET_QUOTA_EXCEEDED`（`Insufficient browser storage for 3D asset <assetId|data>`），否则 `BINARY_ASSET_<OP大写>_FAILED`（`Failed to <op> 3D binary asset[ <assetId>]: <msg>`），已是本类错误则**原样上抛**。IndexedDB 驱动：`_open` 缓存 `dbPromise`，`onupgradeneeded` 以 `{keyPath: 'assetId'}` 建库，`onversionchange` 关库并清缓存，`onerror`/`onblocked` 分别 → `BINARY_ASSET_OPEN_FAILED` / `BINARY_ASSET_STORAGE_BLOCKED`（阻塞提示语 `3D binary asset database upgrade is blocked by another open window`），无 `indexedDB.open` → `BINARY_ASSET_STORAGE_UNAVAILABLE`；`remove` 先 `count` 再 `delete`，返回 `count > 0`。内存驱动按 `structuredClone` 深拷贝读写，隔离外部引用。
- **`imagePoseRetargeter.js`**：`MEDIAPIPE_POSE_LANDMARK_INDEX`（冻结：鼻 0、左右耳 7/8、左右肩 11/12、左右肘 13/14、左右腕 15/16、左右小指 17/18、左右食指 19/20、左右髋 23/24、左右膝 25/26、左右踝 27/28、左右脚跟 29/30、左右脚尖 31/32）、`DEFAULT_IMAGE_POSE_MIN_VISIBILITY = 0.5`、`BONE_ANGLE_LIMITS`（冻结 18 项：pelvis π、spine_* 0.7、neck_01 0.8、Head 1.15、upperarm_* 2.8、lowerarm_* 2.45、hand_* 1.2、thigh_* 2.2、calf_* 2.65、foot_* 1.25）。`retargetMediaPipePoseToStoryboard3D(pose, {minVisibility = 0.5, mirrorX = true, invertY = true, invertZ = true})` 返回 `{boneOverrides, confidence, boneConfidence, warnings}`，共 **18 根骨骼**：`pelvis`、`spine_01..03`、`neck_01`、`Head`、`upperarm_l/r`、`lowerarm_l/r`、`hand_l/r`、`thigh_l/r`、`calf_l/r`、`foot_l/r`。地标来源 `pose.worldLandmarks ?? poseWorldLandmarks ?? pose.landmarks ?? pose`，长度为 1 的数组会**解包第 0 项**，仍不满足 33 项则返回 `POSE_LANDMARKS_INVALID`（`MediaPipe pose retargeting requires at least 33 world landmarks.`，`confidence: 0`、`boneOverrides: {}`）。可见度：`landmarkVisibility = min(visibility, presence)`（两者皆有限时），只有一个有限则取该值，**都缺则视为 1**；`minVisibility` 夹 0–1；`confidence < minVisibility` 的骨骼**不写入** `boneOverrides` 并进 `LOW_CONFIDENCE_BONES_SKIPPED`（带 `{bones, threshold}`）。归一化用躯干尺度（髋中↔肩中的中位距离）把地标平移缩放；无法确定尺度则 `POSE_SCALE_UNAVAILABLE`（`Pose landmarks do not contain a usable torso or body scale.`）。骨盆由左右髋连线与世界上方向构造，脊柱取躯干坐标的 1/3 分数四元数并共用给 `spine_01..03`，颈由肩中→双耳构造并供 `Head` 承接前向；四肢按 `upper = fromTo(静息方向, 上段)`、`lower = inv(upper) * fromTo(静息方向, 下段)`、`hand/foot = inv(lower) * fromTo(静息方向, 末端)` 逐段相对化，零长或歧义段记 `DEGENERATE_POSE_SEGMENTS_SKIPPED`（带 `{bones}`）。所有输出经 `clampQuaternionAngle` 按上述限位夹紧后转本仓分镜 3D 的 `[x,y,z,w]` 约定（**w 恒非负**）；`confidence` 为全部 18 项 `boneConfidence` 的算术平均。
- **`storyboardExport.js`**：`STORYBOARD_EXPORT_ASPECT_RATIOS`（冻结：16:9、9:16、1:1、2.39:1、4:3、3:4、3:2、2:3、21:9）、`STORYBOARD_EXPORT_RESOLUTIONS`（冻结：720p 720、1080p 1080、2K 1440、4K 2160）。`resolveStoryboardExportDimensions({aspectRatio = '16:9', resolution = '1080p'})`：画幅未命中表且不是正数则回落 `16:9`；数值画幅以 `<n>:1` 为键；分辨率未命中表则走 `toPositiveInteger` 夹 **240–4320**（非数字回落 1080，但返回的 `resolution` 仍是**原始字符串**）；比值 ≥ 1 时 `width = round(res * ratio)`、`height = res`，否则 `width = res`、`height = round(res / ratio)`。`calculateStoryboardGridLayout({count, columns = 3, frameWidth, frameHeight, metadataHeight = 160, gap = 24, padding = 32, maxSide = 16384, maxPixels = 120000000})`：夹紧为 count ≤ 1000、columns ≤ count、画格 64–8192、元信息高 0–800、间距 0–256、内边距 0–512；`cellHeight = frameHeight + metadataHeight`；总宽/高超过 `maxSide` 或总像素超过 `maxPixels` 抛 `RangeError('Storyboard export is too large (W×H). Reduce resolution or grid size.')`。`getCellRect(i)` 走 `toPositiveInteger(i + 1, 1, {max: count}) - 1`，故**越界、负数、NaN 一律折叠到 0 号格**。`renderStoryboardGrid({shots, renderFrame, ...})`：要求至少一个真值镜头（`At least one shot is required for storyboard export.`）、`renderFrame` 为函数（`TypeError('renderFrame must be a function.')`）、可取到 2D 上下文（`2D canvas context is unavailable.`）；按 `rendering`（逐镜）→ `encoding` → `complete` 上报进度；空镜只铺底色不调取帧；画面按 `cover` 居中裁剪 `drawImage`（画幅不同不拉伸）；镜头元信息最多 3 行、每行按字号截断（默认第 1 行 `SHOT 01 · CU`、第 2 行 `LOW · 35mm`、第 3 行描述），可用 `includeShotNumber/Angle/FocalLength/Description` 逐项关闭；`includeThirds` 画三分线；`palette` 与内置 `DEFAULT_PALETTE`（`#0b0c10`/`#171922`/`#f4f6fb`/`#9ba3b4`/`#42485a`/`rgba(255,255,255,0.38)`）浅合并。编码优先 `convertToBlob`，否则 `toBlob`（回调给 `null` 抛 `Canvas encoding failed.`），两者皆无抛 `Canvas blob encoding is unavailable in this runtime.`。`renderStoryboardSequence` 逐镜复用单格网格（`columns: 1`）并把进度换算成**整序列**进度。
- **`texturePolicy.js`**：`DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION = 0x1000`（4096）、`DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS = 0x1000 * 0x1000`（16 777 216）、`DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES = 0x40 * 0x400 * 0x400`（64 MiB）。`resolveStoryboard3DTextureLimits({renderer, policyMaxDimension, policyMaxPixels})` 给出 `maxDimension = 硬件 maxTextureSize（有限正整数时）与策略值的较小者`、`maxPixels`（策略值，缺省 16 777 216）、`hardwareMaxTextureSize`（无则 `null`）、`policyMaxDimension`；非法策略值回落到默认。`computeTargetSize` 缩放比 `min(1, maxDim/w, maxDim/h, sqrt(maxPixels/(w*h)))` 后向下取整、且不小于 1。`inspectStoryboard3DSceneTextures(scene, options)` 覆盖 `scene.background`、`scene.environment` 与 `scene.traverse` 下每个材质的**全部**纹理（递归深度 ≤ 4、`ArrayBuffer`/视图跳过、对象去重防环），同一纹理只记一次并累计 `references`（形如 `'<对象名>.material[i]'`、`'scene.background'`）；尺寸优先 `naturalWidth/Height` → `videoWidth/Height` → `width/height`，**数组源取面积最大的一张**；无尺寸记 `action: 'warning'` + `TEXTURE_DIMENSIONS_UNKNOWN`；超维记 `TEXTURE_DIMENSION_EXCEEDS_LIMIT`、超像素记 `TEXTURE_PIXEL_COUNT_EXCEEDS_LIMIT`，任一命中即 `action: 'downsample'`；返回 `{limits, textures, total, oversized, warnings}`。`downsampleStoryboard3DTexture(texture, {width, height, signal, ...})`：非纹理抛 `TypeError('A Three.js texture is required.')`；数组源 / `isCompressedTexture` / `isDataTexture` / 无源 → `TEXTURE_DOWNSAMPLE_UNAVAILABLE`（`Texture source is not a drawable 2D image.`）；目标尺寸非正抛 `TypeError('Positive target dimensions are required.')`；执行链 **`createImageBitmap({resizeWidth, resizeHeight, resizeQuality: 'high'})` → 离屏画布 `transferToImageBitmap`（method `'offscreen-canvas'`）→ 2D 画布 drawImage（method `'canvas'`，资源不自持）**，全不可用抛 `TEXTURE_DOWNSAMPLE_UNAVAILABLE`（`Texture cannot be downsampled in this runtime.`）并附 `.causes`；成功后写回 `image` 并复原 `colorSpace`/`flipY`、置 `needsUpdate`，把自持位图挂到纹理 `dispose` 事件上（模块级 `WeakMap` 托管，`releaseStoryboard3DTexturePolicyResource` 可手动释放并返回是否有托管）；写回失败会**回滚原图**再上抛。中止语义：`throwIfAborted` 抛 `name 'AbortError'`、`code 'ABORT_ERR'`、`message` 取 `reason.message || reason || 'Texture processing was cancelled'`；`createImageBitmap` 前后各查一次中止，命中即关掉位图。`applyStoryboard3DTexturePolicy(scene, {signal, onProgress, ...})` 先巡检再逐张降采样，成功进 `optimized`、失败进 `warnings`（`code` 取错误码、缺省 `TEXTURE_DOWNSAMPLE_FAILED`，消息形如 `Texture WxH exceeds the 4096px / 16777216 pixel policy but could not be downsampled.`），逐张上报 `{completed, total, progress}`，返回对象带 `disposeOwnedResources()`。`validateStoryboard3DImageFile(file, {maxBytes = 64MiB})` 累积 `IMAGE_FILE_NAME_REQUIRED`（`Image file name is required.`）、`IMAGE_FILE_TYPE_INVALID`（`The selected file is not an image.`，`type` 去空转小写后不以 `image/` 开头）、`IMAGE_FILE_EMPTY`（`The image file is empty.`，`size` 非有限或 ≤ 0）、`IMAGE_FILE_TOO_LARGE`（`The image file exceeds N MB.`，仅在 `size` 有限且 `> maxBytes` 时追加）。`preflightStoryboard3DImageFile(file, {...})` 返回 `{ok, action: 'reject'|'accept'|'downsample'|'accept-with-warning', errors, warnings, width, height, targetWidth, targetHeight, limits}`：校验不过即 `reject`；解码尺寸（缺省 `createImageBitmap`，可注入）后超限记 `IMAGE_PIXELS_EXCEED_LIMIT`（`Image WxH should be downsampled to w x h.`）并给 `downsample`；解码失败或尺寸非法**不阻断上传**，降级为 `accept-with-warning`（码取错误码、缺省 `IMAGE_DIMENSION_READ_FAILED`，`Image pixel dimensions could not be checked before upload.`）；`AbortError` 一律**上抛**。

## 3. 接线状态（零生产消费方，记账）

4 件在本仓**均无生产消费方**：`grep -rn --include=*.js "<name>" src electron api`（排除 4 个本批文件）**0 命中**；开工前 4 件亦**皆不存在于本仓**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 4 件的真实导入方（`grep -rl` 复核其导入说明符）**全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓全部不存在**（逐名 `test -e` 复核为 `missing`）：

| 本批模块 | 端口内的真实消费方（本仓均 `missing`） |
| --- | --- |
| `binaryAssetRepository.js` | `directorGenerationService.js`、`directorSceneRuntime.js`、`editorWorkspace.js`、`index.js` |
| `imagePoseRetargeter.js` | `characterImagePoseController.js`、`editorWorkspace.js` |
| `storyboardExport.js` | `exportController.js`、`shotFrameCapture.js`、`shotVideoRecorder.js`、`index.js` |
| `texturePolicy.js` | `editorWorkspace.js`、`index.js`、`sceneRuntime.js` |

其中 `editorWorkspace.js` 与 `index.js` 是 R09 的主装配点（第 88、89 批已记为同代未落地依赖），另有 `sceneRuntime.js`（3D 视口运行时，第 89 批同批已记）、`directorGenerationService.js`/`directorSceneRuntime.js`（第 86–88 批已记为牵 deeper 依赖的未落地件）、`characterImagePoseController.js`、`exportController.js`、`shotFrameCapture.js`、`shotVideoRecorder.js` 等**同代未落地**依赖，属于整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**，输出 `b86/deps.json`；第 88 批以 `b88/picks.mjs` 对同一批 22 件候选逐件复核，第 89 批从此集合取 6 件。本批取该集合的**最后 4 件零 `import` 件**，落地后该集合**只剩 6 件**（§8）。

**(b) 本批候选的直接 `grep` 复核**（不采信任何扫描器的 `deps===0`）：4 件各以 `grep -nE "^import |from '\.|from \"\."` 复核得 **0**（无任何相对导入，另核 `import(` 动态导入 0 处），并以 `grep -rn --include=*.js "<name>" src electron api` 全树反查确认**本仓**无引用点（端口内的引用方见 §3）。

**(c) 逐字节落地**：4 件均从端口原始文件复制到 `deobf-tools/b90/port/`，经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 4/4 `IDENTICAL`（§5），未做任何「顺手美化」。

**(d) 命名空间假阳性复核**：端口 `grep -rl storyboardExport` 会命中 `src/i18n/messages/{zh-CN,en-US}.js`，逐字复核证实命中的是**键名子串** `'storyboardExportPending'`（1 处），**不是**本模块的导入或 i18n 命名空间；本仓 `src/i18n/messages/*.js` 对该键 **0 命中**——属另一特性（导出排队提示）的词条缺口，与 i18n 既有纪律冲突，**留待授权后单独补齐**（见 §6）。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 4 | **4/4 `IDENTICAL`**（落地后与格式复检后各验一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js` × 4 | 全部 OK |
| 格式 | `prettier --check`（本批 8 件） | **All matched files use Prettier code style!**（首轮 4 个测试文件告警，`--write` 后复检通过；4 件源码自始未被改写） |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{binaryAssetRepository,imagePoseRetargeter,storyboardExport,texturePolicy}.test.js` | **53/53 通过，0 失败**（16 + 10 + 10 + 17） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 112/2 069/43**（第 89 批为 2 059/2 016/43，+53/+53/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–89 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 `missing manifest coverage cannot bind to an existing unrelated local file`） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 583 / 0`（第 89 批实测 575，+8 = 4 源码 + 4 测试） |

测试期间修正的 8 处**测试自身**的期望错误（实现一字未改）：`binaryAssetRepository` 3 处（误把 `name` 当作由 `relativePath` 反推 → 实际只取 `wrapper.name`/`input.name`，回落 `asset.bin`/`related-N.bin`，主文件与附属文件各 1 处；另把 `get` 的 `operation` 误期望为 `'get'`，实际 `requiredText` 在 `try` 外调用故保持 `''`）、`imagePoseRetargeter` 2 处（`AXIS_ALIGNED` 曾用 `filter` 删掉鼻标记致长度变 32 而整体判为 `POSE_LANDMARKS_INVALID`；`minVisibility: 2` 会**夹到 1** 从而跳过 0.2 可见度的骨骼产生告警，原期望写成「无告警」）、`storyboardExport` 2 处（`drawMetadata` 也会 `fillRect` 铺底，空镜占位是第 4 次而非第 3 次 `fillRect`；默认字号为 `round(width/42)` 即 `30px` 而非 48px）、`texturePolicy` 1 处（单材质数组下标恒为 `[0]`，把 `shared-b.material[1]` 误写成期望）。

## 6. 未执行的验收项

- **未接线**：4 件无任何生产消费方，端到端行为无从触发。
- **未运行真实浏览器 API**：`binaryAssetRepository` 的 `indexedDB`（测试用**手写假 IndexedDB**：假请求/假事务/`queueMicrotask` 延迟回调）、`texturePolicy` 的 `createImageBitmap`/`OffscreenCanvas.transferToImageBitmap`/2D 画布绘制/`ImageData` 解码、`storyboardExport` 的 `OffscreenCanvas.convertToBlob`/`toBlob` 全部以**手写桩件**替代（Node 无 BOM），**未验证**真实环境下的库升级阻塞、配额耗尽、位图缩放质量与 canvas 编码字节。
- **未验证真实姿态数据**：`imagePoseRetargeter` 只在**合成 T 字姿态**与人为构造的低可见度/退化段上断言（单位四元数、镜像与翻转等价性、轴对齐恒等旋转），**未**用真实 MediaPipe 输出或真实模型骨骼绑定验证视觉结果与 IK 观感。
- **未验证真实分镜出图**：网格布局只在**假画布**上记录调用序列与几何参数，**未**产出真实 PNG 校验像素级一致性、字距与三分线位置。
- **未验证真实图片策略**：`preflightStoryboard3DImageFile` 的尺寸解码全程注入桩件，**未**在真实浏览器对超大 JPEG/PNG/WebP 验证内存占用与降采样耗时。
- **记账的 i18n 缺口**：端口 `storyboardExportPending` 键在本仓 `src/i18n/messages/*.js` **0 命中**（第 83 批 `nodeBatchExport.toasts.*` 同类问题的延续）；因纪律明令不得修改 `src/i18n/messages/*.js`，**留待授权后单独补齐**（本仓 `t()` 对未命中键回退为键名，不崩溃）。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- 交付物为 4 源码 + 4 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（假对象桩件只存在于测试内）。

## 8. 下一批建议

1. **R09 同族只剩 6 件，且全部带 three.js 运行时依赖**：`src/modules/storyboard3d` 缺失降为 **6 件**（10 − 4）——`directorMultiView.js`、`directorSceneAuthoring.js`、`directorViewportRuntime.js`、`gltfImportAdapter.js`、`instanceBatching.js`、`transformSession.js`，各自相对依赖指向 `panoramaSceneNode/threeRuntime.js`、`core/math.js`、`core/panoramaSceneMath.js`、`vendor/three/.../GLTFLoader.js`。**落地前必须先做一次世代核对**：`b88/picks.mjs` 只校验「相对目标在本仓存在」，**无法判定世代一致**；须逐件比对端口与本仓这些被依赖模块的导出面（缺导出即受阻，按既定口径**不伪造 shim**）。**落地前仍须逐件 `grep` 复核导入面**。
2. **升代类仍须单独成批**：`rendererVirtualization.js` 升代（`resolveRendererVirtualizationTier` 0/4、`resolveRendererLowZoomMountLimit` 0/5）、`canvasMediaLocalService.js`（28 个消费方）升代、`src/components/media-clip` 整片（端口 16 件 vs 本仓 10 件、世代互非超集），以及 `main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的「设置/策略/手势/编排/回收/背景/导入/素材/姿态/导出/纹理」自足层已补齐 28 件（第 86–89 批各 6 + 本批 4），要形成可运行链路，`editorWorkspace.js`/`index.js`/`projectModel.js`/`sceneRuntime.js` 这一层是绕不开的**同代装配体**，且其下游就是本批与 §8.1 指出的 three.js 视口运行时、GPU 能力探测与模型包下载/缓存。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
4. **并行可取的其它特性区**（口径同本批，均须先逐件 `grep` 复核）：`b86/deps.json` 里仍缺且依赖闭合的 `src/modules/agent` 32 件、`storyWorkspace` 32 件、`personReplacement` 25 件、`app` 18 件、`collaboration` 17 件、`components/aigenImage` 13 件、`domain/storyGeneration` 13 件等。
