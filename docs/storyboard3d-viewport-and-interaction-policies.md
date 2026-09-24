# 第87批专题：分镜 3D（视口设置与交互策略）自洽核心 `src/modules/storyboard3d/`（6 件零依赖落地不接线）

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**；第 86 批已落地 6 件核心（`docs/storyboard3d-director-camera-and-timeline.md`），本批再从「依赖完全闭合」的子集中取 6 件**逐字节**落地并配离线测试：物体变换能力策略、框选矩形与选择集合并、图像姿态运行时清单与校验、导演场景设置归一化、视口导航预设与本地存储、时间线数值拖拽手势。

---

## 1. 本批要补的缺口

第 86 批交付后 `src/modules/storyboard3d/` 仍有 **91 件**缺失（97 − 6）。据 `C:/Users/luobote/.qoder/tmp/deobf-tools/b86/deps.json`：端口 `src/**` 共 1 550 件里「依赖全闭合、可在本仓直接落地、且仍缺失」者 467 件，其中 `src/modules/storyboard3d/` 占 **34 行**（含第 86 批刚落地的 6 件陈旧行），**真正仍缺 28 件**。本批从这 28 件中取 6 件。

开工前复核：本仓对 6 个模块名**0 命中**（`grep -rn "storyboard3d/<name>.js" src electron`，排除模块自身后全部为 0），即既无源码也无引用点；6 件源码之间**也互不引用**（0 条相对 `import`）。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/objectTransformCapabilities.js` | 26 | 1 354 | 0 | 物体变换能力策略：按类型给出可用工具/可编辑字段/是否吸附地面，`select` 归一为 `move`，工具与字段判定各自独立（3 个导出） |
| `src/modules/storyboard3d/selectionBox.js` | 50 | 1 764 | 0 | 框选几何与选择集：矩形构造（含缺省端点）、4px 拖动阈值、initial/hit × additive/toggle 的选择集合并（3 个导出 + 1 常量） |
| `src/modules/storyboard3d/imagePoseRuntimeManifest.js` | 41 | 1 676 | 0 | 图像姿态运行时清单（MediaPipe Pose Landmarker heavy v1）与上传校验：类型/空文件/24 MB 三档，错误带 `code`（1 个导出 + 1 常量） |
| `src/modules/storyboard3d/directorSceneSettings.js` | 42 | 1 984 | 0 | 导演场景设置归一化：截图栈、显示模式白名单、地面高度/透明度、全景图（半径/三轴旋转/历史）（1 个导出） |
| `src/modules/storyboard3d/viewportNavigationSettings.js` | 96 | 4 288 | 0 | 视口导航：Unity/Blender/C4D/Maya 四套预设与工具快捷键查表/反查、灵敏度夹取、反转开关、localStorage 读写容错（10 个导出：4 常量 + 6 函数） |
| `src/modules/storyboard3d/directorNumericDrag.js` | 82 | 3 094 | 0 | 时间线数值拖拽手势类：按下守卫、4px 阈值、shift 加速、min/max 夹取、`toFixed(6)` 取值、抬起提交冒泡 `change`、取消回滚、销毁解绑（1 个导出） |
| `src/modules/storyboard3d/objectTransformCapabilities.test.js` | 70 | 3 471 | — | 6 项 |
| `src/modules/storyboard3d/selectionBox.test.js` | 127 | 3 506 | — | 7 项 |
| `src/modules/storyboard3d/imagePoseRuntimeManifest.test.js` | 123 | 4 406 | — | 8 项 |
| `src/modules/storyboard3d/directorSceneSettings.test.js` | 111 | 5 347 | — | 8 项 |
| `src/modules/storyboard3d/viewportNavigationSettings.test.js` | 174 | 7 350 | — | 9 项 |
| `src/modules/storyboard3d/directorNumericDrag.test.js` | 347 | 11 954 | — | 14 项 |

6 件源码合计 **337 行 / 14 160 B**；6 件测试合计 **952 行 / 36 034 B**（52 项）；新增总计 **1 289 行 / 50 194 B**。

6 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Object['freeze']`、`Math['round']`、`0x` 十六进制、`\x20` 转义、逗号表达式、计算属性名方法 `['bind']`）。

### 2.1 关键行为（供接线时对照）

- **`objectTransformCapabilities.js`**：`FULL_TOOLS`/`MOVE_ROTATE_TOOLS`/`EMPTY_TOOLS` 均为 `Object.freeze` 的模块级常量。`prop`/`character` → 全量工具 + 可吸附地面（`groundSnap: true`）；`camera` 与**非 ambient** 的 `light` → `['move','rotate']` + 不可吸附；`light` 且 `lightType === 'ambient'`、以及**未知类型** → `EMPTY_TOOLS` + 不可吸附，且该分支 `tools` 与 `fields` **同一引用**。`fields` 每次调用新建冻结数组（`tools` 则复用常量，故跨调用 `tools` 引用相等、`fields` 引用不等）。`canStoryboard3DObjectUseTransformTool` 会先把 `'select'` 归一为 `'move'`，再走 `tools.includes`；`canStoryboard3DObjectEditTransformField` **不做**归一化。入参非对象（`null`/`undefined`/`0`/字符串）不抛错，退化为空能力。
- **`selectionBox.js`**：`STORYBOARD_3D_SELECTION_DRAG_THRESHOLD = 4`。`createStoryboard3DSelectionRect(begin, end)` 用 `Number.isFinite` 归一，缺省端点回退到起点（注意 `Number(null) === 0` 是**有限值**，不会走缺省）。`hasStoryboard3DSelectionDragMoved` 取 `max(width, height) >= 4`。`mergeStoryboard3DBoxSelection({initialObjectIds, hitObjectIds, additive, toggle})` 先各自 `filter(Boolean)` 去重；**`toggle` 优先于 `additive`**（命中项在初始集中则删、不在则增）；`additive` 为并集；两者皆假则**只取命中集**（初始集被丢弃）。
- **`imagePoseRuntimeManifest.js`**：清单冻结，`version: '0.10.35'`、`maxPoses: 1`、`accept: ['image/jpeg','image/png','image/webp']`、`maxBytes: 24 MB`、`runningMode: 'IMAGE'` 与三个 0.5 阈值。`validateStoryboard3DImagePoseFile(file, manifest = 运行时清单)` 判定顺序为 **显式 `type` 优先于扩展名**；`'image/jpg'` 归一为 `'image/jpeg'`；`size` 取 `max(0, Number(size) || 0)`。三类失败各自抛带 `code` 的 `Error`：`POSE_IMAGE_TYPE_UNSUPPORTED`（`请选择 JPG、PNG 或 WebP 图片。`）、`POSE_IMAGE_EMPTY`（`图片为空或无法读取。`）、`POSE_IMAGE_TOO_LARGE`（`图片不能超过 24 MB。`）；成功返回 `{type, size}`。
- **`directorSceneSettings.js`**：`normalizeDirectorSceneSettings(input = {})`。`screenshots` 先 `slice(-100)` 再筛 `assetId` 为字符串，字段逐一夹取：`name` 缺省 `镜头截图` 且 `slice(0,120)`、`time` 0–3600、`width` 缺省 1920 且 1–16384、`height` 缺省 1080。`displayMode` 白名单 `['solid','transparent','clay']`，否则回 `solid`；`labels` 仅严格 `true`；`groundVisible` 仅严格 `false` 时为假；`groundHeight` 缺省 0 且 ±1000；`groundOpacity` 缺省 1 且 0–1。`panorama`：`enabled` 严格 `true`、`radius` 缺省 100 且 5–2000、`rotation` 三轴各夹 ±2π、`history` `slice(-50)` 且 `name` 缺省 `全景图`。
- **`viewportNavigationSettings.js`**：存储键 `aiCanvas.storyboard3d.navigation.v1`，默认预设 `unity`。四套预设的 `toolShortcuts` 固定为 `select/move/rotate/scale` 四键：unity 与 maya 均 `Q/W/E/R`，blender `W/G/R/S`，C4D `0/E/R/T`；仅 C4D 的 `defaults` 非 1（orbit 0.9 / pan 1 / zoom 0.9）。`getStoryboard3DToolShortcut(preset, tool)` 对**未知预设回落 unity**、未知工具返回空串；`resolveStoryboard3DToolFromShortcut(char, preset)` 先 `trim().toLowerCase()`，空串直接 `null`。`normalizeStoryboard3DNavigationSettings` 的夹取区间为 **0.2–3**，回落值取**当前预设的 `defaults`**；注意 `Number('') === 0` 与 `Number(null) === 0` 都是**有限值**，会走夹取（→ 0.2）而非回落，只有 `NaN` 等非有限值才取预设缺省。三个反转开关均要求严格 `=== true`。`load*`/`save*` 默认取 `globalThis.localStorage`，`getItem`/`setItem` 异常一律吞掉并回退默认。
- **`directorNumericDrag.js`**：`class DirectorNumericDrag`，方法以计算属性名书写（`['bind']`/`['down']`/`['destroy']`）。**按下守卫**（任一不满足即返回、不注册任何全局监听）：`event.button === 0`、`target.closest('[data-storyboard-3d-shot-timeline] label')` 命中且其内 `input[type="number"]` 存在、输入未 `disabled`、`target.closest('input,select,button')` 为空、且当前 `value` 为有限数。通过后取 `input.ownerDocument.defaultView` 作事件宿主，新建 `AbortController` 统一持有 `pointermove`/`pointerup`/`pointercancel` 三个监听（全部带 `{signal}`）。**移动**：`pointerId` 不一致直接返回；位移 `|dx| < 4` 且尚未越过阈值时返回；一旦越过则置 `moved` 并 `preventDefault()`，取值 `clamp(min, max, start + Math.round(dx / (shiftKey ? 20 : 4)) * step)`，其中 `min`/`max` **仅在 `hasAttribute` 为真时**读取（否则 `∓Infinity`），`step` 缺省 1，最终 `String(Number(x.toFixed(6)))` 收敛浮点误差。**抬起**：仅 `pointerId` 一致时提交；若输入已 `isConnected === false` 则**既不回写也不派发**；否则在 `moved` 且取值变化时派发**冒泡**的 `change`。**取消**（显式 `cancel()` 或 `pointercancel`）：同上述短路，`isConnected` 为真时把 `value` 回写为按下时的原值；无论哪条路径都会 `abort()` 并在提交/取消后把 `this.cancel` 置 `null`。`bind(root)` 对**同一 root 早退**，换 root 时先 `destroy()` 旧 root；`destroy()` 取消在途拖拽、解绑 `pointerdown`（capture）并把 `root` 置 `null`（可重复调用）。新的 `down` 会先 `this.cancel?.()` 回滚上一次未结束的拖拽。

## 3. 接线状态（零生产消费方，记账）

6 件在本仓**均无生产消费方**：`grep -rn "storyboard3d/<name>.js" src electron`（排除模块自身与测试）**0 命中**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 6 件的真实导入方（`grep -rno` 复核其导入说明符）**全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓全部不存在**：

| 本批模块 | 端口内的真实消费方 |
| --- | --- |
| `objectTransformCapabilities.js` | `editorWorkspace.js`、`sceneRuntime.js` |
| `selectionBox.js` | `editorWorkspace.js` |
| `imagePoseRuntimeManifest.js` | `imagePoseEstimator.js`、`imagePoseLandmarker.worker.js` |
| `directorSceneSettings.js` | `directorGenerationService.js`、`directorScenePanel.js`、`directorSceneRuntime.js`、`projectModel.js` |
| `viewportNavigationSettings.js` | `editorWorkspace.js`、`viewportNavigationProtocol.js` |
| `directorNumericDrag.js` | `directorTimelineEditing.js` |

其中 `editorWorkspace.js` 是 R09 的主装配点，另有 `shotTimelineController.js`/`shotVideoRecorder.js`/`projectModel.js`/`cameraShotSystem.js`/`commandHistory.js`/`panoramaSceneMath.js` 等一大片**同代未落地**依赖，属于整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**，输出 `b86/deps.json`。据此从 `src/modules/storyboard3d` 的 28 件余量里取候选。

**(b) 本批候选的**直接 `grep` **复核**（不采信任何扫描器的 `deps===0`）：端口 `C:/Users/luobote/.qoder/tmp/shuo-deobf/src/modules/storyboard3d/` 下 22 件候选逐件 `grep` 导入面，**21 件零相对 `import`**；本批 6 件各以 `grep -c "^import\|from '"` 复核得 **0**，并另以 `grep -rno "['\"][^'\"]*<name>\.js['\"]"` 全树反查，确认**本仓**无任何引用点（端口内的引用方见 §3）。

**(c) 逐字节落地**：6 件均从端口原始文件复制到 `deobf-tools/b87/port/` 经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 6/6 `IDENTICAL`（§5），未做任何「顺手美化」。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 6 | **6/6 `IDENTICAL`**（落地后与格式复检后各验一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js` × 6 | 全部 OK |
| 格式 | `prettier --check src/modules/storyboard3d/*.js`（本批 12 件） | **All matched files use Prettier code style!**（首轮 3 个测试文件告警，`--write` 后复检通过；6 件源码自始未被改写） |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{objectTransformCapabilities,selectionBox,imagePoseRuntimeManifest,directorSceneSettings,viewportNavigationSettings,directorNumericDrag}.test.js` | **52/52 通过，0 失败**（0.49 s） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **1 959/1 916/43**（第 86 批为 1 907/1 864/43，+52/+52/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–86 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 549 / 0`（第 86 批实测 536，+13 = 6 源码 + 6 测试 + 本专题文档 1；**第 86 批文档 §5 该处原记为 535 系笔误，本批以实测反推更正为 536**） |

测试期间修正的 2 处**测试自身**的期望错误（实现一字未改）：
1. `objectTransformCapabilities` 的 `tools` 复用模块级常量而 `fields` **每次调用新建**，故 `first.tools === second.tools` 成立、`first.fields !== second.fields`（原断言误以为是同一引用）。
2. `viewportNavigationSettings` 的灵敏度回落只对**非有限值**生效，而 `Number('') === 0` **是有限值**，故 `orbitSensitivity: ''` 走夹取得到 `0.2` 而非预设缺省 `0.9`（改用 `NaN` 验证回落路径）。

## 6. 未执行的验收项

- **未接线**：6 件无任何生产消费方，端到端行为无从触发。
- **未运行真实 UI**：`directorNumericDrag` 仅用**手写假 DOM/假 `AbortController`** 断言（Node 无 DOM）：`closest`/`querySelector`/`hasAttribute`/`dispatchEvent` 与 `ownerDocument.defaultView.addEventListener({signal})` 均为桩件，**未验证**真实浏览器中的指针捕获、`preventDefault` 对滚动的影响、以及 `change` 冒泡到编辑器 store 的实际链路；`input[type=number]` 的真实 `step`/`min`/`max` 属性语义亦未在浏览器内核下核对。
- **未验证渲染器集成**：three.js 视口、GPU 能力、模型包许可与下载/缓存、姿态估计（MediaPipe）真实推理（R09 行的验收要求）均未涉及；`imagePoseRuntimeManifest` 只校验了**上传前置条件**，未加载任何模型。
- **未验证导航预设的真实手感**：四套预设的 `toolShortcuts` 与灵敏度仅做数据断言，未在真实视口下比对 Unity/Blender/C4D/Maya 的鼠标行为一致性。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- 交付物为 6 源码 + 6 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（假 DOM 桩件只存在于测试内）。

## 8. 下一批建议

1. **同族续取**：`src/modules/storyboard3d` 缺失仍为 **22 件**（28 − 6），据 `b86/deps.json` 可落地者逐名为：`assetCatalogSelection.js`、`backgroundCalibration.js`、`backgroundImageController.js`、`backgroundPerspectiveEstimator.js`、`binaryAssetRepository.js`、`directorCurveEditor.js`、`directorFollowPanel.js`、`directorGeneratedLayers.js`、`directorMultiView.js`、`directorRecovery.js`、`directorSceneAuthoring.js`、`directorViewportRuntime.js`、`editorStore.js`、`exportCanvasBridge.js`、`geometryImportWorkerCore.js`、`gltfImportAdapter.js`、`imagePoseRetargeter.js`、`instanceBatching.js`、`storyboardExport.js`、`texturePolicy.js`、`transformSession.js`、`voiceInputService.js`。其中 `directorCurveEditor.js`（接第 86 批 `directorCurves.js`）、`transformSession.js`（接本批 `objectTransformCapabilities.js`）与本批/上批咬合最紧，**下一批优先候选**，但落地前仍须逐件 `grep` 复核导入面。
2. **升代类仍须单独成批**：`rendererVirtualization.js` 升代（`resolveRendererVirtualizationTier` 0/4、`resolveRendererLowZoomMountLimit` 0/5）、`canvasMediaLocalService.js`（28 个消费方）升代、`src/components/media-clip` 整片（端口 16 件 vs 本仓 10 件、世代互非超集），以及 `main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的「设置/策略/手势」自足层已补齐 12 件（第 86 批 6 件 + 本批 6 件），但要形成可运行链路，`editorWorkspace.js`/`sceneRuntime.js`/`projectModel.js`/`viewportNavigationProtocol.js` 这一层是绕不开的**同代装配体**，且其下游还牵着 three.js 视口运行时与 GPU 能力探测。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
