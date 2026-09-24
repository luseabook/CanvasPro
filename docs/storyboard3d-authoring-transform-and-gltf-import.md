# 第91批专题：分镜 3D（导演场景编排 / 变换会话 / 实例合批 / glTF 导入适配）three.js 依赖核心 4 件落地不接线（另 2 件受阻记账）

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86–90 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**；前五批各落地 6/6/6/6/4 件（`docs/storyboard3d-director-camera-and-timeline.md`、`docs/storyboard3d-viewport-and-interaction-policies.md`、`docs/storyboard3d-director-orchestration-and-recovery.md`、`docs/storyboard3d-background-calibration-and-geometry-import.md`、`docs/storyboard3d-binary-assets-and-export-policy.md`），本批续取第 90 批 §8 点名的 6 件**带 three.js 运行时依赖**的候选中**依赖闭合且导出面齐备**的 **4 件**并**逐字节**落地、配离线测试：导演场景编排、变换会话、实例合批、glTF 导入适配。

本批先完成了第 90 批 §8.1 明确要求的**世代与导出面核对**：逐件比对端口与本仓被依赖模块的导出面，确认 4 件所需符号在本仓均存在；同时确认余下 2 件（`directorMultiView.js`、`directorViewportRuntime.js`）被本仓 `src/core/math.js` 的**世代**阻住（缺 3 个导出），按既定口径**记账受阻、不伪造 shim**（§4）。

---

## 1. 本批要补的缺口

第 90 批交付后 `src/modules/storyboard3d/` 仍有 **65 件**未落地（端口 97 − 本仓 32）。第 90 批 §8.1 点名其中 6 件带 `threeRuntime`/`core/math`/`panoramaSceneMath`/`GLTFLoader` 直接依赖，**须先做世代核对**再决定可否落地。本批把该 6 件逐件核到**结论级**：

- **依赖闭合且导出面齐备、可落地 4 件**：`directorSceneAuthoring.js`、`instanceBatching.js`、`transformSession.js`、`gltfImportAdapter.js`。
- **导出面受阻、本批不落地 2 件**：`directorMultiView.js`、`directorViewportRuntime.js` —— 二者都 import `core/math.js` 的 `clientToViewportNdc`/`ndcToViewportPoint`/`intersectRayWithAxisPlane`，而本仓该模块的世代**不导出这 3 个符号**（详见 §4(c)）。

开工前复核：本仓对 4 个模块名**0 命中**（`grep -rn --include=*.js "<name>" src electron api`，排除本批文件）——既无源码也无引用点，4 件在此之前**均不存在于本仓**。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/directorSceneAuthoring.js` | 211 | 9 593 | `threeRuntime` | 导演场景编排：六向轴视图常量、路线精细贴地采样（100 点上限）、整体变换（平移/偏航/缩放，含锁定拦截与切线/关键帧同步）、网格化避障寻路（BFS + 共线简化，100 控制点上限）（4 个导出） |
| `src/modules/storyboard3d/instanceBatching.js` | 123 | 5 119 | `threeRuntime` | 实例合批：`InstancedMesh` 模板识别（单网格、非蒙皮、无形态）、实例矩阵合成（位置/欧拉/缩放 + 模板世界矩阵）、批次创建/刷新包围体/逐实例更新/释放（7 个导出） |
| `src/modules/storyboard3d/transformSession.js` | 242 | 10 769 | `threeRuntime` | 变换会话：约束解析（显式/手柄/模式三级）、设置归一（地面锁定、吸附、统一缩放）、移动/旋转/缩放三类增量更新（精度、吸附切换、轴系旋转、枢纽缩放）（3 个导出） |
| `src/modules/storyboard3d/gltfImportAdapter.js` | 173 | 7 022 | `threeRuntime` + `GLTFLoader` | glTF 导入适配：格式能力表（glb/gltf/fbx/obj/stl，深冻结）、资源键归一与对象地址作用域、包围盒测量、三角面计数、基于官方 `GLTFLoader` 的解析器工厂（8 个导出） |
| `src/modules/storyboard3d/directorSceneAuthoring.test.js` | 221 | 7 936 | — | 13 项 |
| `src/modules/storyboard3d/gltfImportAdapter.test.js` | 236 | 9 716 | — | 10 项 |
| `src/modules/storyboard3d/instanceBatching.test.js` | 166 | 6 596 | — | 9 项 |
| `src/modules/storyboard3d/transformSession.test.js` | 215 | 8 807 | — | 10 项 |

4 件源码合计 **749 行 / 32 503 B**；4 件测试合计 **838 行 / 33 055 B**（42 项）；新增总计 **1 587 行 / 65 558 B**。

4 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Number['isFinite']`、`Array['isArray']`、`Object['freeze']`、`0x` 十六进制、`\x20` 转义、逗号表达式）。

### 2.1 关键行为（供接线时对照）

- **`directorSceneAuthoring.js`**：`DIRECTOR_AXIS_VIEWS`（6 行 `[key, 标签, yaw, pitch]`：`front/前 [0,0]`、`back/后 [π,0]`、`left/左 [-π/2,0]`、`right/右 [π/2,0]`、`top/上 [0, π/2-0.0001]`、`bottom/下 [0, -π/2+0.0001]`）。`sampleDirectorGroundRoute(route, heightAt, offset = 0, step = 0.25)`：按各段水平距离 `hypot(dx, dz)` 计采样点数 `1 + Σ max(1, ceil(seg/step))`，**超过 100 抛** `路径过长，精细贴地采样超过 100 点，请分段编排。`；逐段插值，**第 0 段从 k=0 起（含首点）、i>0 段从 k=1 起（跳过重复点）**，压入 `[x, heightAt(x,z) + offset, z]`。`transformDirectorScene(scene, {x,y,z,yaw,scale})`：参数非有限或 `scale ∉ [0.01,100]` 抛 `整体变换参数无效，缩放应为 0.01–100。`；场景含 `locked` 对象抛 `场景含锁定对象，请先解锁再整体变换。`；`structuredClone` 深拷贝后以 `Matrix4.compose(Vector3(x,y,z), Quaternion.setFromAxisAngle(Vector3(0,1,0), yaw*π/180), Vector3(scale³))` 变换——位置走 `applyMatrix4`、切线/偏移走 `applyQuaternion(...).multiplyScalar(scale)`、欧拉旋转走 `Euler.setFromQuaternion(q_yaw.clone().multiply(setFromEuler(Euler(...))))`；同步对象变换、`target`、镜头机位、全部相机/对象关键帧与切线、相机约束的 `followOffset`/`lookAtOffset`、对象缩放关键帧；末尾 `directorSettings.groundHeight = groundHeight * scale + y`。`findDirectorObstacleRoute(start, end, obstacles, {clearance = 0.4, step = 0.5})`：`step ≥ 0.1`、`clearance ≥ 0`、外扩 `margin = max(3, clearance*4)` 定网格；`gridW * gridH > 0x186a0`（100 000）抛 `避障区域过大，请减小场景范围或增大采样步长。`；4 连通 BFS（邻序 `[1,0],[-1,0],[0,1],[0,-1]`）；起/终点落在障碍内抛 `路线起点或终点位于障碍物内，请先移开控制点。`；不可达抛 `当前障碍与间距下找不到可通行路线。`；命中判据为障碍竖向与 `[start.y+0.1, start.y+1.8)` 相交且水平落在 `±clearance` 内；路径反转后端点替换为真实起/终点，**共线中点被过滤**，控制点数 `> 0x64`（100）抛 `避障路径控制点超过 100 个，请调整障碍布局。`
- **`instanceBatching.js`**：`STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT = 0x3`。`createStoryboard3DInstanceMatrix(transform, parentMatrix = null)`：位置/欧拉/缩放入参**读数组下标** `[0]/[1]/[2]`，缩放逐轴夹 `max(0.001, ·)`，`Matrix4.compose` 后**若给模板世界矩阵则右乘**。`findStoryboard3DInstancingTemplate(object3d)`：遍历若见 `isSkinnedMesh` 或非空 `morphTargetInfluences` 即判不可合批；**非实例化网格须恰为 1 个**且带 `geometry`+`material`，否则 `null`；返回 `{geometry, material, sourceMatrix: matrixWorld.clone()}`（先 `updateMatrixWorld(true)`）。`createStoryboard3DInstanceBatch({template, objects = [], tint = '', castShadow = true, receiveShadow = true})`：模板缺 `geometry`/`material` 抛 `TypeError('An instancing template is required')`；对象过滤掉无 `id` 者，空集抛 `Error('At least one storyboard object is required')`；`tint` 非空时**克隆每个材质并 `color.set(tint)`**，克隆件收进 `ownedMaterials`；建 `InstancedMesh`（多材质时用材质数组），置 `name = 'storyboard3d-instance-batch'`、`userData.storyboardObjectIds`、逐实例 `setMatrixAt`（矩阵右乘模板世界矩阵）、`instanceMatrix.needsUpdate = true`、`computeBoundingBox/Sphere`；返回 `{mesh, objectIds, sourceMatrix, ownedMaterials}`。`refreshStoryboard3DInstanceBatchBounds(batch)` 重算两个包围体、无 `mesh` 返回 `false`。`updateStoryboard3DInstanceTransform(batch, objectId, transform, {recomputeBounds = true})`：按 `objectIds.indexOf` 定位，未命中返回 `false`，否则 `setMatrixAt` + 标脏，`recomputeBounds` 时刷新包围体并返回 `true`。`disposeStoryboard3DInstanceBatch(batch)` 顺序 **`removeFromParent` → `mesh.dispose` → 各 `ownedMaterials` `dispose`**。
- **`transformSession.js`**：`resolveStoryboard3DTransformConstraint(input = {})`：先归一显式 `constraint`（只留 `[xyz]`、按 `x/y/z` 排序、全集去重）；空则按 `mode === 'scale-uniform'` 或 `handleKey === 'scale-uniform'` → `'xyz'`；再 `/(?:scale-)?plane-([xyz]{2})$/`；再 `/(?:axis|scale|rotate)-([xyz])$/`；否则 `'xyz'`。`createStoryboard3DTransformSession({sceneId, activeTool, initialTransforms, dragState, settings = {}})`：`activeTool` 不在 `{move,rotate,scale}` 回落 `'move'`；`initialTransforms` 经 `cloneTransforms`（位置补 `[0,0,0]`、缩放逐轴夹 `max(0.001, ·)`），**为空返回 `null`**；`dragState` 缺省 `{}`；`constraint` 取自 `resolveStoryboard3DTransformConstraint(dragState)`；`pivot`/`axisWorld` 由 `toThreeVector3` 读出并**归一**（`axisWorld` 缺省 `{x:1,y:0,z:0}`）、`gizmoQuaternion` 由 `toThreeQuaternion` 读出并归一（w 缺省 1，零长回单位四元数）；**注意 `toThreeVector3` 读 `value?.['x']` 等，故 `delta`/`pivot`/`axisWorld` 须是 `{x,y,z}` 对象而非数组**；设置归一：`groundLock`/`uniformScale` 严格 `true` 判定、`snapEnabled = snapEnabled === true || snap?.enabled === true`、`translationSnap = max(0.0001, finite(translationSnap ?? snap?.translation, 0.25))`、`rotationSnap` 缺省 `π/12`、`scaleSnap` 缺省 `0.1`、`groundPositions` 仅留有限数值项；`forcedUniformScale = activeTool === 'scale' && !transformsShareOrientation(initialTransforms)`（朝向共享判据：四元数 `|1 - |dot|| < 0.00001`，少于 2 个变换视为共享）。`updateStoryboard3DTransformSession(session, delta, {precision = false, toggleSnap = false})`：`precision` 按工具分别 `*0.1`（移动/旋转）或 `1 + (v-1)*0.1`（缩放）；吸附开关 `resolveSnapEnabled = toggleSnap ? !settings.snapEnabled : settings.snapEnabled`；**移动**——`toThreeVector3(delta)` 后若吸附命中则绕 `gizmoQuaternion` 逆变换到局部、按约束轴 `round(v/snap)*snap`、非约束轴清零、再变换回，然后逐对象加偏移（`groundLock` 时 `position[1]` 取 `groundPositions[id]`）；**旋转**——标量角、绕 `axisWorld` 建四元数，位置绕 `pivot` 旋转、朝向由该四元数左乘后转欧拉；**缩放**——`factor = max(0.001, finite(delta,1))`，轴集 `uniformScale || forcedUniformScale ? 'xyz' : constraint`，多对象时还按 `pivot` 相对偏移同步缩放位置；所有数值过 `cleanNumber`（`|v| < 1e-12` 归零）。返回新 `transforms` 并同步写回 `session.latestTransforms`。
- **`gltfImportAdapter.js`**：`STORYBOARD_3D_RESOURCE_BASE_URL = 'storyboard3d-resource:///'`；`STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES`（**深冻结**：`glb`/`gltf`/`fbx`/`obj`/`stl`，各 `{format, inspection: true, parsing: 'available', parserId, limitations: 冻结数组, reason?}`——Draco/Meshopt/KTX2 需调用方另行配置解码器；obj 不解析独立 MTL、用默认材质；stl 不携带材质、建默认标准材质）。`getStoryboard3DModelImportCapability(format)` 去空转小写查表、未命中 `null`。`normalizeResourceKey`：剥 `storyboard3d-resource:///` 前缀、`decodeURIComponent`（try/catch 吞异常）、`\`→`/`、去 `?`/`#` 之后、去前导 `./`。`findResource(map, key)` 先按整键再按 basename 取。`createStoryboard3DResourceUrlScope(resources, urlApi)`：`resolve` 放行 `blob:/data:/https?:`、命中资源则**按 Blob 缓存一个对象地址**；`dispose` 撤销全部并清空。`measureStoryboard3DImportedSceneBounds(object)`：`updateMatrixWorld(true)` 后取 `Box3.setFromObject`，六分量非有限或空盒返回 `null`，否则 `{min, max}`。`countStoryboard3DSceneTriangles(object)`：遍历网格，顶点数取 `index?.count ?? getAttribute('position')?.count`，扣 `drawRange.start`、认有限 `drawRange.count`，`floor(count/3) * (isInstancedMesh ? count : 1)`。`createThreeGltfStoryboard3DParser({urlApi = globalThis.URL, configureLoader = null})`：`file.arrayBuffer` 非函数抛 `GLB/glTF file is unreadable.`；`urlApi.createObjectURL`/`revokeObjectURL` 非函数抛 `Browser object URL support is unavailable.`；用 `LoadingManager.setURLModifier` 接资源作用域、建 `GLTFLoader`、可选 `configureLoader`；`.gltf` 名走 `TextDecoder` 解码文本、`.glb` 直传 `ArrayBuffer`，以 `STORYBOARD_3D_RESOURCE_BASE_URL` 为路径基 `parseAsync`；缺 `scene` 抛 `GLB/glTF did not contain a default scene.`；返回 `{scene, scenes, animations, cameras, asset, userData, bounds, triangleCount}`，**`finally` 释放作用域**。`parseStoryboard3DGltfFile = createThreeGltfStoryboard3DParser()`。

## 3. 接线状态（零生产消费方，记账）

4 件在本仓**均无生产消费方**：`grep -rn --include=*.js "<name>" src electron api`（排除 4 个本批文件）**0 命中**；开工前 4 件亦**皆不存在于本仓**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 4 件的真实导入方（`grep -rl` 复核其导入说明符）**全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓全部不存在**（逐名 `test -e` 复核为 `missing`）：

| 本批模块 | 端口内的真实消费方（本仓均 `missing`） |
| --- | --- |
| `directorSceneAuthoring.js` | `directorScenePanel.js` |
| `gltfImportAdapter.js` | `assetRecord.js`、`index.js`、`legacyModelImportAdapters.js`、`modelImport.js` |
| `instanceBatching.js` | `index.js`、`sceneRuntime.js` |
| `transformSession.js` | `editorWorkspace.js` |

另记两个**本批未落地**候选的端口消费方（供后续批次对照）：`directorMultiView.js` ← `shotTimelineController.js`；`directorViewportRuntime.js` ← `sceneRuntime.js`。

其中 `editorWorkspace.js` 与 `index.js` 是 R09 的主装配点（第 88–90 批已记为同代未落地依赖），另有 `sceneRuntime.js`（3D 视口运行时）、`shotTimelineController.js`、`directorScenePanel.js`、`modelImport.js`/`legacyModelImportAdapters.js`/`assetRecord.js` 等**同代未落地**依赖，属于整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**，输出 `b86/deps.json`。第 90 批 §8.1 点名余下 6 件**全部带 three.js 依赖**，本批把这 6 件核到结论级。

**(b) 本批候选的直接 `grep` 复核**（不采信任何扫描器的 `deps===0`）：4 件各以 `grep -nE "^import |from '\.|from \"\."` 复核，相对导入面**仅**指向本仓已存在且世代一致的目标（`panoramaSceneNode/threeRuntime.js`、`vendor/three/examples/jsm/loaders/GLTFLoader.js`），并以 `grep -rn --include=*.js "<name>" src electron api` 全树反查确认**本仓**无引用点（端口内的引用方见 §3）。**扫描器盲点复核**：本仓 `panoramaSceneNode/threeRuntime.js` 为 1 行再导出 `export * from '../../../vendor/three/three.module.js';`，端口与之**逐字节同形**（无世代差）；本仓 `vendor/three/three.module.js` 有 **422** 个导出，`GLTFLoader` 及其传递的 `BufferGeometryUtils.js` 均在位。逐件核对本批 4 件实际用到的全部 `threeRuntime` 成员（`Box3`/`Vector3`/`Quaternion`/`Euler`/`Matrix4`/`Sphere`/`InstancedMesh`/`LoadingManager`/`Raycaster` 等）**均存在于该 422 导出集**。

**(c) 导出面受阻的 2 件（本批不落地，不伪造 shim）**：`directorMultiView.js`、`directorViewportRuntime.js` 均 import `src/core/math.js` 的 `clientToViewportNdc`/`ndcToViewportPoint`/`intersectRayWithAxisPlane`。逐符号核对：**本仓 `src/core/math.js` 的世代不导出这 3 个符号**（端口该模块为更晚世代，导出面 32 → 52，多出 20 个含这 3 个）。二者另依赖本仓**已在位**的 `core/panoramaSceneMath.js`（本仓为端口**严格超集**，仅 onlyB=6，所需 `focalLengthToFov`/`cameraPoseToSceneView` 均在位）。因 `src/core/math.js` 有 **62 个消费方**，升代属**in-use 升级**（行为变更，须单独成批 + 真机验证 + 授权，见 §8.2），故本批把这 2 件**记录为受阻**，**未伪造任何 shim 绕行**。

**(d) 逐字节落地**：4 件均从端口原始文件复制到 `deobf-tools/b91/port/`，经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 4/4 `IDENTICAL`（§5），未做任何「顺手美化」。

**(e) 剩量修正记账**：第 90 批 §8 曾将本目录剩量表述为「6 件」；经本批复核，端口 `src/modules/storyboard3d/` 实为 **97 件**、本仓落地后为 **32 件**，**仍有 65 件未落地**。其中**全部相对目标在本仓存在**的候选为 **12 件**（本批落 4 件；2 件被 `core/math.js` 导出面阻住；余 6 件另需逐件导出面审计），**53 件**因相对目标在本仓缺失而受阻。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 4 | **4/4 `IDENTICAL`**（落地后与格式复检后各验一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js` × 4 | 全部 OK |
| 格式 | `prettier --check`（本批 8 件） | **All matched files use Prettier code style!**（首轮 4 个测试文件告警，`--write` 后复检通过；4 件源码自始未被改写） |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{directorSceneAuthoring,gltfImportAdapter,instanceBatching,transformSession}.test.js` | **42/42 通过，0 失败**（13 + 10 + 9 + 10） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 154/2 111/43**（第 90 批为 2 112/2 069/43，+42/+42/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–90 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 592 / 0`（第 90 批实测 583，+8 = 4 源码 + 4 测试；本专题文档 +1 后为 593） |

测试期间修正的 5 处**测试自身**的期望错误（实现一字未改）：`transformSession` 4 处（**根本原因**：`toThreeVector3` 读 `value?.['x']`，而初版把 `delta`/`pivot`/`axisWorld` 传成数组 `[1,2,3]`/`[0,1,0]`/`[0,0,0]`，导致分量全落回落值、移动无效、绕零轴旋转为空操作；改为传 `{x,y,z}` 对象，并补断言固定「对象形参契约」——`axisWorld` 由 `{x:0,y:0,z:3}` 归一为 `[0,0,1]`、`gizmoQuaternion.w` 由 `2` 归一为 `1`）；另 1 处旋转「精度」期望写错（`precision` 把角度 `*0.1`，实际为 `[cos(π/40),0,-sin(π/40)]`，已按 `preciseAngle = (π/4)*0.1` 重算并加 `notDeepEqual` 反证）、`directorSceneAuthoring` 1 处（「障碍墙致无路可通」——因 BFS 搜索网格会向**每个**障碍外扩 `margin = max(3, clearance*4)`，单面轴对齐墙数学上**不可能**完全封死；最终改用**四块障碍围住终点格**、只留 `(2,0,0)` 可行而四邻全堵构造，并追加「终点在环内时报起点/终点错误」的第二断言）。

## 6. 未执行的验收项

- **未接线**：4 件无任何生产消费方，端到端行为无从触发。
- **未运行真实浏览器/GPU 环境**：`gltfImportAdapter` 的 glTF 解析在**离线 data-URI 文档**上完成，且因 Node 无 `ProgressEvent` 全局，测试内加了**手写 `ProgressEvent` 桩**（`if (typeof globalThis.ProgressEvent !== 'function')` 守卫）——`three.core.js` 的 `FileLoader` 依赖该浏览器全局；**未**验证真实 Draco/Meshopt/KTX2 解码器配置、真实磁盘大模型的内存与耗时。
- **未验证真实 three.js 视口**：`instanceBatching` 用真实 `threeRuntime`（`BoxGeometry`/`MeshBasicMaterial`）验证矩阵与实例缓冲，但**未**在真实 WebGL 渲染器下验证合批绘制结果、阴影与包围体剔除；`transformSession`/`directorSceneAuthoring` 为纯数值/结构变换，**未**接入真实 gizmo 交互与导演面板验证手感。
- **未验证避障寻路的真实场景规模**：`findDirectorObstacleRoute` 只在**合成障碍布局**上断言（含四块围堵构造），**未**在真实导演场景的复杂障碍密度与十万格上限附近验证耗时与路径质量；`sampleDirectorGroundRoute` 的贴地精度只以**合成高度函数**验证。
- **未覆盖受阻件**：`directorMultiView.js`/`directorViewportRuntime.js` **未落地**，其视口投影/框选行为**未**验证（需先做 `core/math.js` 升代）。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- **未伪造 shim**：`core/math.js` 缺 3 个导出即**受阻记账**，未新增同名假实现，也未把受阻件接到假消费方。
- 交付物为 4 源码 + 4 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（`ProgressEvent` 桩与假对象只存在于测试内）。

## 8. 下一批建议

1. **R09 同族续取**：`src/modules/storyboard3d` 仍有 **65 件**未落地。其中相对目标齐备的候选 **12 件**——本批已落 4 件，**2 件被 `core/math.js` 导出面阻住**，**余 6 件**（`assetRecord.js`→`gltfImportAdapter`、`modelImport.js`→`gltfImportAdapter`、`modelGeometryImport.worker.js`→`geometryImportWorkerCore`、`directorCameraPathPanel.js`→`directorCurveEditor`、`directorClips.js`→`directorTimelineOperations`、`backgroundCalibrationInteraction.js`→`backgroundCalibration`、`imagePoseEstimator.js`→`imagePoseRuntimeManifest`、`directorSceneRuntime.js`→`threeRuntime`+`binaryAssetRepository`+`directorSceneSettings` 等，其中多数只依赖**已落地**模块）**须先逐件做导出面审计再落地**；另 **53 件**因相对目标在本仓缺失而受阻，须先落其依赖链。**落地前仍须逐件 `grep` 复核导入面**。
2. **升代类仍须单独成批**：`src/core/math.js` 升代（32 → 52 导出，+20，含本批受阻的 3 个视口符号；**62 个消费方**，可解阻 `directorMultiView.js`/`directorViewportRuntime.js`）、`rendererVirtualization.js` 升代（`resolveRendererVirtualizationTier` 0/4、`resolveRendererLowZoomMountLimit` 0/5）、`canvasMediaLocalService.js` 升代（28 个消费方，牵 `assetCoverResolver.js`/`nodeManagerListSnapshot.js`/`NodeManagerPanel.js`）、`src/components/media-clip` 整片（端口 16 件 vs 本仓 10 件、世代互非超集）、`main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的「设置/策略/手势/编排/回收/背景/导入/素材/姿态/导出/纹理/编排/变换/合批/glTF 导入」自足层已补齐 32 件（第 86–90 批 28 + 本批 4），要形成可运行链路，`editorWorkspace.js`/`index.js`/`projectModel.js`/`sceneRuntime.js` 这一层是绕不开的**同代装配体**，其下游即 three.js 视口运行时、GPU 能力探测与模型包下载/缓存。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
4. **并行可取的其它特性区**（口径同本批，均须先逐件 `grep` 复核、并核被依赖模块世代）：`b86/deps.json` 里仍缺且依赖闭合的 `src/modules/agent` 32 件、`storyWorkspace` 32 件、`personReplacement` 25 件、`app` 18 件、`collaboration` 17 件、`components/aigenImage` 13 件、`domain/storyGeneration` 13 件、`components/video-node` 11 件、`manifests/image` 11 件、`components/shared` 10 件、`panoramaSceneNode` 9 件等。
