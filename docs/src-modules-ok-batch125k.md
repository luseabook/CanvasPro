# 第 125k 批：OK 队列第 6 组（分镜 3D 与交互族 10 件）

> 落地方式：只新增文件，不覆盖在用代码；本批**落地不接线**，运行时行为零变化。
> 落地时间：2026-09-28。上游镜像：`C:\Users\luobote\.qoder\tmp\shuo-deobf`（0.7.16 反混淆）。
> 取件依据：`b125/deps-modules.txt` 的 OK 段 + `b123/b123-gate.mjs` 逐件闸门（见 125j 专题 §2 的 23 件可落清单）。

## 1. 落地清单（10 件实现 + 10 件同名测试，106 例）

| 模块 | 实现字节/行 | sha256 前 12 位 | 用例 | 测试字节/行 |
| --- | --- | --- | --- | --- |
| `src/modules/interaction/WheelPanController.js` | 5121/127 | 8d038741851a | 13 | 10206/278 |
| `src/modules/interaction/dropTargetSpatialQuery.js` | 2032/41 | 8e9ad86fc411 | 9 | 4443/87 |
| `src/modules/toolbarPendingResultNodes.js` | 2418/58 | 805228ea8217 | 9 | 5215/131 |
| `src/modules/videoRetake/segmentRetakeModelPolicy.js` | 6623/144 | 5ed96f2a172d | 12 | 6024/121 |
| `src/modules/whiteboard/whiteboardBackgroundPreview.js` | 339/6 | bc9c63259c82 | 2 | 1238/32 |
| `src/modules/workspaceCanvasMaterialization.js` | 10600/232 | 94994dfde729 | 21 | 17078/411 |
| `src/modules/panoramaSceneNode/articulatedCharacterModel.js` | 6082/146 | bc64d91c2c5d | 5 | 1942/51 |
| `src/modules/panoramaSceneNode/scene3dGizmoVisual.js` | 10227/286 | e5b2fc46cf26 | 11 | 7354/186 |
| `src/modules/panoramaSceneNode/scene3dPanoramaTexture.js` | 4607/110 | 5bc6c4dd04e4 | 14 | 7660/226 |
| `src/modules/panoramaSceneNode/scene3dProceduralAssetVisual.js` | 4522/114 | 880b19e26f5c | 10 | 6518/126 |

源合计 52 571 B / 1 264 行；测试合计 67 678 B / 1 649 行。

## 2. 冻结的端口行为（写测试时逐条实测确认）

### 2.1 `interaction/WheelPanController`

- `createWheelPanController` 需要 `viewportPreview.{acquire,update,commit}` 三个函数，缺任何一个抛 `TypeError('[WheelPanController] viewportPreview is required')`。
- 预览归属名与媒体暂停源都是 `'wheel-pan'`；收尾延时 `0xa0`（160 ms）、媒体恢复延时 `0x78`（120 ms）。
- `handleWheelPan(dx, dy, pointerTarget)`：两个位移都取 `Number` 后非有限数按 0，**都为零就直接返回 false 且不申请预览**；成功时 `acquire(owner, store.viewport)` → `update(owner, {...acquired, x: x-dx, y: y-dy})`，并给 `window.v2Renderer.markViewportInteractionBusy()`、暂停媒体调度（`bypassPriority: 1000`）、把新视口交给 `window._v2ScheduleMinimapViewportPreview`、排收尾延时与一帧。
- 帧合并：同一帧内的多次滚动只排一帧；帧回调最多把 `window._v2UpdateSidePlusNow(window._lastMx, window._lastMy, { pointerTarget })` 推一次，没有 `Now` 版就退回 `_v2UpdateSidePlus`，两者都没有则静默跳过。
- `settleWheelPan()` 在没滚动过时返回 `null`；否则 `commit(owner)`——拿到视口就 `window._v2FlushMinimapViewportPreview`、`store.updateViewport(x,y,zoom)`、`store.markViewportPersist?.()`，拿不到就不写 store；两种情况都会 `releaseViewportInteractionBusy` 并排一次 120 ms 后的媒体恢复。
- 再次滚动会取消旧的收尾延时；`window` 不存在时全流程不抛错。

### 2.2 `interaction/dropTargetSpatialQuery`

- `createDropTargetSpatialQuery()` 返回一个 `(state, worldX, worldY) => nodes[]` 的查询函数，按 `state.nodes` 引用 + `state._persistRev` 缓存空间索引，两者任一变化或 `_persistRev` 非有限数就重建。
- 只有 `storyboard` 与 `collage` 两类节点会建矩形：分镜用 `{x, y, ...getStoryboardCellMetrics(node)}`（缺 `width`/`height` 时矩形退化到原点，仍然命中原点本身）；拼贴用子项包围盒的最小 x/y 与最大边界（没有有效子项则不建矩形）。
- 其它类型 `resolveRect` 返回 `null`，不参与命中；命中结果按 `nodes[id]` 映射后过滤掉已删除的项。
- `state` 本身是必填的，传 `undefined` 会抛 `TypeError`。

### 2.3 `toolbarPendingResultNodes`

- `selectToolbarResultNodes(ids)`：把单值或数组规整为去空白后的非空字符串数组，空数组直接返回 `[]`（不碰 store），否则 `appStore.setSelectedNodes(ids)` 并回传该数组。
- `addToolbarPendingResultNodes({nodes, persist})`：过滤掉非对象、缺 `id`、`id` 为纯空白的项；有效项多于 1 个时走 `appStore.batch(...)`；随后自动选中这批 id；`persist` 为真（默认）时调 `persistToolbarResultNodes()`。返回落地的 id 数组。
- `persistToolbarResultNodes()` 只在 `globalThis.window._triggerLocalCacheSave` 是函数时调用一次，抛错被吞掉。
- `updateToolbarResultNode(id, patch)`：`id` 去空白后必须非空、`patch` 必须是对象、且 `getStateSnapshot().nodes[id]` 必须存在，否则返回 `false`；成功则 `appStore.updateNodeData`。
- `updateToolbarResultNodes(list)`：逐项要求 `nodeId || id` 非空且 `patch` 是对象，多于 1 项时走 `batch`。

### 2.4 `videoRetake/segmentRetakeModelPolicy`

- 两个阶段常量 `editing` / `submitted`；`isSegmentRetakeEditing` 只认 `segmentRetake.phase === 'editing'`。
- 参数策略（`getSegmentRetakeParameterPolicy`）要求节点有 `segmentRetake`、模型清单里 `extensions.segmentRetake.supported === true`、且 `parameterPolicy` 是对象；三者缺一即 `null`。
- 拿不到策略时，四个装饰/应用函数都是**恒等返回**（`decorateSegmentRetakeParameterNodeData` 返回同一个引用），`buildSegmentRetakePhasePatch` 返回 `null`，`buildSegmentRetakeSessionClearPatch` 返回 `{ segmentRetake: null }`。
- 阶段补丁结构：`{ uiSchemaFieldState, segmentRetake: {...原绑定, phase} }`；只有切到 `editing` 时才额外带 `generationParams`。

### 2.5 `whiteboard/whiteboardBackgroundPreview`

纯别名模块：4 个导出分别指向 `services/fastImagePreviewService.js` 的 `createFastImagePreview`、`createImagePreviewFromDecodedImage`、`readImageFileHeaderSize`、`readImageHeaderSize`（用 `===` 断言同一函数对象）。

### 2.6 `workspaceCanvasMaterialization`

- 依赖硬性要求：`canvasTabManager.{addCanvas,getActiveCanvasId}`、`createNodeAtCursor`、`getGraphState`、`updateNodeData`、`moveNode` 全是必需函数；`projectBindingPolicies` 必须是**非空**数组且每项都带 `getProjectId` 与 `findProjectAnchor`（空数组同样报 `binding policies are incomplete`）。
- `canvasExists(id)` 优先查 `getMultiDataSnapshot().canvases`，没有快照时退回比较当前画布 id。
- `switchCanvas` 目标就是当前画布时直接 `true` 且不调 `switchTo`；空 id、缺 `switchTo`、`switchTo` 返回 `false` 都返回 `false`。
- `createCanvas(name)` 先 `addCanvas()` 再读活动 id，读不到抛「新建项目画布后未获得活动画布 ID」，然后 `renameCanvas`。
- `createNode(nodeData, options)`：类型取 `options.type || nodeData.type`；宽高取 `options.width/height`，缺省用 `getNodeSize(type)`；`createNodeAtCursor(type, width, height, name, {placement:'viewport-center-sequence', sequenceKey, skipCommit:true})`；写回时**剥掉 `type`**；落点默认取项目锚点（`findProjectAnchor`），叠加 `options.position`，再按 `getNodeSpawnPrefs()`（默认 `{spacing:120,direction:'right',avoidOverlap:true}`）避让已占位置，最后 `moveNode(id, dx, dy)` 只补差值。
- `deleteNodes(ids)` 过滤不存在的项并去重，无可删项返回 `true`（不是 `false`），缺 `deleteNodes` 依赖返回 `false`。
- `connectNodes` 在边上已存在时短路返回 `true` 且不调依赖；`focusNodes` 会规整 id 并把 `(ids, padding, durationMs, options)` 透传；`createMutationSnapshot` 在没注入快照函数时返回 `null`。

### 2.7 `panoramaSceneNode/articulatedCharacterModel`

- `createCharacterClayMaterial(color)`：`MeshStandardMaterial`，`roughness 0.72`、`metalness 0`、`vertexColors true`；传颜色对象时**克隆**一份。
- `buildArticulatedCharacterShell(root)`：先 `root.updateMatrixWorld(true)`，再 `traverse` 收集 `isMesh` 与第一个 `isSkinnedMesh.skeleton`；**找不到骨骼就抛 `Error('人偶模型缺少骨骼。')`**；找不到 `traverse` 则抛 `TypeError`。
- 其余路径（合并几何、绑骨架）依赖真实 SkinnedMesh，本批只覆盖到可离线验证的边界（见 §5）。

### 2.8 `panoramaSceneNode/scene3dGizmoVisual`

- 常量固定：`axisLength 1.35`、`scaleLength 1.22`、`rotateRadius 0.61`、`planeOffset 0.38`、`planeSize 0.42`、移动杆/头/拾取 1.2/0.18/1.6、缩放杆/头/拾取 1.05/0.135/1.5。
- 根 `Group` 初始 `visible = false` 并交给 `configureGizmoObject` 配置。
- `handles` 是 16 键的 Map，顺序固定：`axis-x/y/z` → `plane-xy/xz/yz` → `rotate-x/y/z` → `scale-x/y/z` → `scale-uniform` → `scale-plane-xy/xz/yz`。
- `pickMeshes` 同样是 16 个，与 `handles` 一一对应且都带 `userData.gizmoHandleKey`；注意**可见的等比缩放方块不参与拾取**，只有 0.34 的隐形方块进 `pickMeshes`。
- 移动轴/旋转环/缩放轴各按 `x/y/z` 顺序创建三次；三组分别挂在 `moveGroup`/`rotateGroup`/`scaleGroup` 下，三组又都在 `root` 下。
- 平面柄按模式分表：`planeHandles`（`mode:'plane'`）与 `scalePlaneHandles`（`mode:'scale-plane'`），`linkedAxes` 是**拷贝**出来的数组（改一个不影响另一个）。
- 返回的运行时状态默认值：`hoverHandle/activeHandle/dragLock` 都是 `null`、`currentTool:'move'`。

### 2.9 `panoramaSceneNode/scene3dPanoramaTexture`

- `loadPanoramaTextureSource(url, {...})`：`url` 去空白后必填（否则 `Error('Panorama texture URL is empty')`）；`signal.aborted` 为真立即抛 `AbortError`。
- 有 `fetchBlobImpl` **且**有 `createImageBitmapImpl` 时走位图分支：`fetchBlobImpl(url, {signal, timeout})`（默认 `timeout = 0x3a98`）→ `createImageBitmap(blob, {imageOrientation:'flipY'})` → `new Texture(bitmap)` 且 `flipY = false`；纹理 `dispose` 时关掉位图（重复释放只关一次）。
- 位图无效（宽或高 ≤ 0）会关掉位图并抛「Panorama texture bitmap is invalid」；该错误进入兜底后若纹理加载器也失败，**抛的是最先那个错误**（不是加载器的错误）。
- 位图分支抛错后走 `textureLoader.load(url, onLoad, undefined, onError)`；没有加载器则以「Panorama texture loader is unavailable」拒绝；`onError` 传非 Error 时包成 `Error('Panorama texture load failed')`。
- 中止事件：加载期间会挂 `abort` 监听（`{once:true}`），触发后以 `AbortError` 结束并摘掉监听；**中止后迟到的纹理会被立刻 `dispose`**。
- `configureInsideSpherePanoramaTexture(texture, renderer, {isPreview})`：非预览用 `LinearMipmapLinearFilter` + `generateMipmaps true` + `anisotropy = min(8, getMaxAnisotropy() || 1)`；预览用 `LinearFilter` + 关 mipmap + `anisotropy 1`；两者都设 `repeat.set(-1, 1)`、`offset.set(1, 0)`、`needsUpdate true`、`colorSpace = SRGBColorSpace`；`texture` 为空时是空操作。

### 2.10 `panoramaSceneNode/scene3dProceduralAssetVisual`

- `createSceneAssetVisual(asset, defaultColor, colorForKey)` 返回 `{assetId, group, content, material, edgeMaterial, materialsByColorKey, edgeMaterialsByColorKey, selectionRing}`；`assetId` 取 `asset.id || null`。
- 每个部件产出一个 `Mesh` 加一条 `LineSegments` 描边（描边复制实体的位置与旋转）；没有 `parts` 时补一个 `size {1,1,1}`、`position {0,0.5,0}` 的默认方块，材质落到 `__default` 键。
- 图元映射：`cylinder` → `CylinderGeometry(radiusTop||0.5, radiusBottom||0.5, height||1, 18)`、`sphere` → `SphereGeometry(radius||0.5, 18, 12)`、`torus` → `TorusGeometry(radius||0.5, tube||0.08, 10, 24)`，其余一律 `BoxGeometry(size.x||1, size.y||1, size.z||1)`。
- 材质按 `colorKey` 复用（同键共用实例），`roughness 0.55`，`metalness` 在 `asset.category === 'stage'` 时为 `0.14`、否则 `0.04`；描边色是实体色 `offsetHSL(0, 0, -0.18)` 的结果。
- `applySceneAssetColors(visual, defaultColor, colorForKey)` 会重写两张表的颜色，`__default` 用默认色；对 `null`/残缺入参不抛错。

## 3. 检查结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b123-gate.mjs` | 10/10 `MISSING_TOTAL=0`（22 条具名导入全命中） |
| prettier(镜像) 逐字节 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| bare node 导入 | 10/10 成功（three 走 `vendor/three`，不需要联网） |
| 本组单测 | **106 / 106 / 0**（首跑 17 例失败，全部修正测试侧，未改移植实现） |
| 消费方反查 | 真实命中 **0** → 落地不接线（见 §4） |
| src 全量回归 | **6863 / 6820 / 43**（+106 例，与新增用例数吻合） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条相同**，新增 0、消失 0 |
| api 全量回归 | **791 / 791 / 0**（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

证据文件（`deobf-tools` 下）：`b125k-gate.txt`、`b125k-src-raw.tap`、`b125k-fails.txt`、`b125k-api-raw.tap`、`b125k/port/`。

## 4. 接线候选（本批新发现）

按导出名反查时，唯一命中的在用文件是 **`src/modules/panoramaSceneNode/scene3dBridge.js`**（130 KB）：它自带 `GIZMO_BASE_*` 常量（4 处）与 `createCharacterClayMaterial` 的私有副本，也就是说本批的 `scene3dGizmoVisual` 与 `articulatedCharacterModel` 正是从它里面抽出来的——**它是这两个模块的第一优先接线候选**。`scene3dBridge` 是分镜 3D 的主装配，体积大、耦合深，接线时必须逐条比对常量与函数实现，绝不能整块替换。

其余 8 件（`WheelPanController`、`dropTargetSpatialQuery`、`toolbarPendingResultNodes`、`segmentRetakeModelPolicy`、`whiteboardBackgroundPreview`、`workspaceCanvasMaterialization`、`scene3dPanoramaTexture`、`scene3dProceduralAssetVisual`）在 `api`/`src`/`electron`/`main.js` 里**零命中**。

## 5. 世代差异与未覆盖路径（接线前必须先处理）

1. **`segmentRetakeModelPolicy` 的主路径在本仓不可达**：`getModelsByKind('video')` 的 54 个模型里**没有任何一个**声明 `extensions.segmentRetake`，所以 `getSegmentRetakeAllowedModelIds()` 恒为 `[]`、`isSegmentRetakeModelSupported()` 恒为 `false`、`getSegmentRetakeParameterPolicy()` 恒为 `null`。本批测试只覆盖到「拿不到策略时的恒等/兜底分支」，参数锁定与解锁（`decorateSegmentRetakeParameter*`、`applySegmentRetakeSubmitParameterPolicy` 的生效分支）**需要先补 0.7.16 的模型清单扩展**才能接线。
2. **`articulatedCharacterModel` 只覆盖到错误分支**：成功路径需要真实 `SkinnedMesh` + `Skeleton` + 几何合并（`mergeGeometries`），离线单测只验证了材质构造、`updateMatrixWorld(true)` 调用、缺骨骼报错、缺 `traverse` 抛错四类边界。
3. **`WheelPanController` 依赖一批全局钩子**：`window._v2UpdateSidePlusNow`/`_v2UpdateSidePlus`、`_v2ScheduleMinimapViewportPreview`、`_v2FlushMinimapViewportPreview`、`v2Renderer.*`。接线前要确认这些钩子在 0.4.12 里存在（本批测试用替身验证，未核对真实全局）。
4. **`workspaceCanvasMaterialization` 的项目绑定策略是必填的非空数组**：与 `storyCanvasMediaSync` 的 `createStoryClipFrameCanvasAdapter` 风格不同，后者允许空策略。接线时不要把两者当同一套约定。

## 6. 未执行项与边界

- 未启动应用、未构建、未联调；本批**不接线**，运行时行为零变化。
- 未提交、未推送；未做变异测试。
- 独立验证只覆盖离线单测这一级；运行验收、厂商验收都没做（见 TRACKING §7.5）。

## 7. 下一段

- **OK 队列的可落件在本批 + 125l 之后已经清零**。对账：125i 之后余 23 件可落 → 125j 落 10 件（图像输入与提示词族）→ 余 13 件 → 125k 落 10 件（本批）+ 125l 落 3 件（`storyWorkspace`）→ **余 0 件**。
- 剩下的 28 件受阻件要解阻，必须**升代既有件或补清单扩展**，属 §7.3 口径，需另行授权。
- R01–R26 仍未闭环，接线欠账（§4）与运行验收欠账未动。
