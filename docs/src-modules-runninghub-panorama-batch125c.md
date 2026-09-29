# 第 125c 批 · `runninghubAiApp` 6 件 + `panoramaSceneNode` 5 件零依赖纯叶

> 承接 `docs/src-modules-personreplacement-batch125.md`（125b）。这批从重跑后的 `b125/deps-modules.txt`（`LEAF 99 / OK 95 / BLK 333`）里取 `runninghubAiApp` 的 6 件、`panoramaSceneNode` 的 5 件 LEAF，逐件过导出闸门、prettier 暂存、逐字节落地、配同名 `node:test` 测试，**落地不接线**。
> 落地日期：2026-09-28。仓库文件路径一律 `src/modules/runninghubAiApp/<name>.js` 与 `src/modules/panoramaSceneNode/<name>.js`。

## 1. 落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 1 | `runninghubAiApp/rhAiAppFieldMetadata.js` | 1432 / 43 | `3ffea1747a24` | 9 |
| 2 | `runninghubAiApp/rhAiAppMotion.js` | 1946 / 49 | `235b80468bfa` | 13 |
| 3 | `runninghubAiApp/rhAiAppPersistence.js` | 1198 / 30 | `e48bad2f9904` | 10 |
| 4 | `runninghubAiApp/rhAiAppSaveAction.js` | 2339 / 54 | `2cdce59029fd` | 12 |
| 5 | `runninghubAiApp/rhAiAppSources.js` | 3707 / 82 | `70b496da609b` | 12 |
| 6 | `runninghubAiApp/rhAiAppPreviewPresentation.js` | 19471 / 414 | `7bab7075083f` | 31 |
| 7 | `panoramaSceneNode/cameraTimeline.js` | 7819 / 194 | `ff312aa3e400` | 25 |
| 8 | `panoramaSceneNode/characterBodyProfile.js` | 2445 / 54 | `d416934f3856` | 15 |
| 9 | `panoramaSceneNode/poseCatalog.js` | 12951 / 384 | `22da5b00642a` | 18 |
| 10 | `panoramaSceneNode/sceneAssetCatalog.js` | 17077 / 487 | `311115395055` | 13 |
| 11 | `panoramaSceneNode/transformInteractionAdapter.js` | 7521 / 200 | `cfc0b17a8b4e` | 22 |

合计新增 22 个文件（11 源 + 11 测试），191466 字节，**180 例**离线测试。

## 2. 依赖与闸门

- 11 件在 `deps-ast` 分级里都是 LEAF（0 条相对 import），导出闸门报告「无相对依赖」，`MISSING_TOTAL=0`。
- 暂存用 `deobf-tools/b125c/stage.mjs --check` 复核：11/11 `prettier(mirror)==staged:true`，SHA256 与 §1 一致。
- 落地用 `cmp` 与暂存产物逐字节比对，`staged-identical` 11/11；镜像原文（未格式化）与仓库不同是预期，闸门比的是 `prettier(mirror)`。
- `node --check` 对 22 个文件全部通过。
- 只新增文件，未覆盖任何在用件；`api/freeImageHostApi.js` 的 MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
- 消费方反查（`b125c/consumers.mjs`）：1071 个非测试文件、63 个 token（52 个导出名 + 11 个模块路径），真实命中 0。脚本首轮报出的 6 条命中全是**子串撞名**，不是导入：`PANORAMA_360_IMAGE_SOURCE_TYPES`（`src/components/PanoramaSceneNode.js`、`src/modules/interaction/EdgeController.js`、`src/modules/panoramaSceneNode/sceneNodeActions.js`）与 `WEB_VIDEO_TRUSTED_SOURCE_TYPES`（`src/services/fileService.js`）包含 `SOURCE_TYPES`，`electron/customAiAppStorage.js` 自带同名 `normalizeSourceType` 与 `CUSTOM_AI_APP_SOURCE_TYPES`。

## 3. 冻结行为与接入契约

1. **rhAiAppFieldMetadata**：`getRunningHubFieldOptions(field)` 只在 `String(field.fieldType).toUpperCase() === 'LIST'` 时工作；`fieldData` 是字符串时 `JSON.parse`，解析失败或非数组返回 `[]`；只保留自有属性含 `index` 且其类型属于 `string/number/boolean` 的项，输出 `{value: String(index), label: String(name ?? index)}`。`inferRunningHubFieldMetadata(field)` 按 `fieldType` 大写查 `{IMAGE:'image', VIDEO:'video', AUDIO:'audio'}`，命中给锁定 `componentKind`/`controlType='text'`；否则有选项时给锁定 `componentKind='param'`、`controlType='select'`；都不满足返回 `null`。
2. **rhAiAppMotion**：模块级用 `WeakMap` 记录每个元素当前动画。`reduceMotion()` 以 `matchMedia('(prefers-reduced-motion: reduce)').matches === true` 判定。`animatePreviewOrder(elements, mutate)` 先对全部元素各取一次 `getBoundingClientRect`，再执行 `mutate`，最后逐元素取消旧动画、在非 reduced-motion 且不匹配 `.is-dragging, :has(> .is-dragging)` 且位移绝对值和 `>= 1`（严格 `< 1` 视为亚像素跳过）时播放 `translate(dx, dy) → translate(0,0)`，时长 `210`（`0xd2`）、缓动 `cubic-bezier(0.2, 0, 0.2, 1)`。`showGroupPanel(el, show)`：`show` 为真时**立即**置 `hidden=false`；非 reduced-motion 且元素可 `animate` 时播放入场 `opacity 0/translateY(6px) scale(.98) → 1/0/1`（时长 `180`/`0xb4`）或反序出场（时长 `120`/`0x78`），`onfinish` 仅在登记的动画句柄仍是自己时把 `hidden` 置为 `!show` 并清除登记（所以入场完成后保持可见，出场完成后才真正隐藏）；reduced-motion 或无 `animate` 时直接 `hidden = !show` 并返回。
3. **rhAiAppPersistence**：`createRhAiAppPersistence({externalBridge, storage, onWarning})` 返回 `(snapshotFn, {saveApps, onCommitted}) => Promise`。每次写入串行挂在内部 promise 链上（前一次失败也被 `catch` 吞掉，不阻塞后续）。先取快照；桥可用（`isAvailable?.() === true`）时 `await bridge.write(snapshot)`，结果 `ok !== true` 抛 `error || '模型文件保存失败，请重试'`。`saveApps` 为真时写 `localStorage` 键 `aiCanvas.runningHubAiApp.savedApps.v1`（值为 `JSON.stringify(snapshot.savedApps)`）；存储不可用抛「模型存储不可用」，但**桥可用时**改为调用 `onWarning('[RH AI App] local cache update failed:', err)` 不抛。成功回调 `onCommitted()` 并返回 `{ok: true}`。
4. **rhAiAppSaveAction**：`saveRhAiApp(app, overwriteSavedAppId = null)`。`app.savePending` 为真直接返回 `null`。未显式指定覆盖时：先 `findSavedApp(app.savedAppId)`，再 `findSameNameSavedAppForCurrentScope()`；两者都无同名前先 `_showOverwriteConfirm(sameName.id, 'save')` 并返回 `null`，否则沿用已存 id。随后记下 `draftIdentity(app)`（`JSON.stringify([sourceType, kind, savedAppId, runningHubProfileId, _getInputText(), appName, appDescription, promptHelpTooltip, componentDrafts])`），置 `savePending=true`、复位成功反馈、按钮 `disabled=true`、文案「保存中…」、加 `aria-busy`。保存结果 `isCurrentDraft` 为真时补丁成功预览、复位并闪烁成功反馈、清空错误；随后 `window.showToast?.('模型“<name>”已保存', 'success')` 并返回 `record`。异常时文案取 `err?.message || '模型保存失败，请重试'`，**仅当身份未变**才 `_setError`，再弹 error toast 并复位，返回 `null`。`finally` 复位 `savePending`、移除 `aria-busy`、`disabled = !app.currentBundle`，且文案仍为「保存中…」时再复位一次。模块直接引用全局 `window`。
5. **rhAiAppSources**：冻结的 `SOURCE_TYPES`（`runninghub-ai-app`、`runninghub-workflow`、`comfyui-local-workflow`、`comfyui-cloud-workflow`）与 `SOURCE_TYPE_META`，共享的 ComfyUI meta 与 `COMFYUI_WORKFLOW_STATE_SCOPE='comfyui-workflow'`。`normalizeSourceType` 去空白后必须命中已知值，否则 `''`。`isRunningHubSource`/`isComfyUiSource` 用严格比较。`getComfyUiBaseUrlMode` 只在云端给 `'cloud'`，其余 `'local'`；`getComfyUiSourceTypeFromBaseUrlMode` 对 `trim().toLowerCase() === 'cloud'` 给云端类型；`getComfyUiBaseUrlModeLabel` 给「云端」/「本地」。RH 工作流那条 meta 有意**不含** `saveFailed`/`deleteSuccess`。
6. **rhAiAppPreviewPresentation**：`createRhAiAppPreviewPresentation({readState, writeState, actions, primitives, windowObject, documentObject})` 返回类实例。只读 getter 由 `readState()` 派生（`previewAppMenuOpen`/`comfyCandidatePickerOpen` 用 `=== true` 严格化），`componentPickerEl` 走 `writeState`。`_canRemovePreviewParams`/`_canRemovePreviewInputs` 用 `!== false`，`_shouldShowManualComponentPicker` 用 `=== true`。`_renderNodePreview` 清空 ui-schema 绑定后整体重建，再取候选菜单元素、装饰高级字段、重绑 ui-schema。`_closePreviewAppMenuElement` 在 reduced-motion 下直接 `remove()`，否则加 `is-closing`、`aria-hidden=true` 并在 `RH_AI_APP_EXIT_MOTION_MS` 后移除。`_patchPreviewAppChrome`/`_patchSaveConfigMenu`/`_patchCreateConfigMenu`/`_patchFooterOverwriteMenu`/`_patchPreviewPromptArea`/`_patchPreviewActionControls` 做局部补丁；`_patchPreviewWithoutRebuild` 没有预览节点时回退整体重渲染。`_renderPreviewMutableZones` 按 `input/params/advanced` 分区写 `innerHTML`，高级区用 `outerHTML` 替换、原元素不在时追加到 `.rh-ai-app-real-preview-panel` 末尾，无内容则 `remove()`。`_getPreviewZoneElement` 只认 `input/prompt/params/advanced`。`destroy` 清 ui-schema 绑定。
7. **cameraTimeline**：默认 `duration 6`、`fps 24`；`MIN/MAX_DURATION_SECONDS=0.1/3600`、`MIN/MAX_FOV=10/120`；缓动集合 `linear/ease-in/ease-out/ease-in-out`。`normalizeCameraTimeline` 按 id 去重保留后者、先按时间再按 id 排序；`duration = clamp(max(0.1, 有限(duration, 6), 末帧时间), 0.1, 3600)`；`fps = clamp(round(有限(fps, 24)), 1, 120)`；关键帧缺省 `position {0, 1.6, 6}`、`target` 为 position 的 `z-4`、`time = max(0, 有限(time, 序号))`、`id` 缺省 `camera-keyframe-<序号+1>`、`fov = clamp(有限(fov, 55), 10, 120)`、缓动非法回落 `linear`；`currentTime` 收敛到 `[0, duration]`。`upsertCameraKeyframe` 同 id 覆盖并把 `duration` 抬到该帧时间、`currentTime` 设为该帧时间。`cameraTimelineFrameToTime/TimeToFrame` 用钳制后的 fps。`sampleCameraTimeline` 无帧返回 `null`；循环模式对时长取模（负数也折回正区间），非循环 clamp 到 `[0, duration]`；命中首帧（含恰好等于首帧时间）或只有一帧时返回该帧副本且 `progress 0`；命中末帧及以后返回末帧副本；否则在相邻两帧间按起点缓动插值，`span = max(1e-8, b.time - a.time)`、`progress = clamp((t - a.time)/span, 0, 1)` 再缓动。
8. **characterBodyProfile**：`DEFAULT_CHARACTER_BODY_HEIGHT=1.92`。`captureCharacterModelBodyProfileBase(modelRoot)` 读根缩放与 `Head` 骨骼缩放（无 Head 给 `null`），非法值回落 `1`。`applyCharacterBodyProfile(scene, profile)` 用 `finiteBodyValue`（`Number(v)` 有限则 clamp，否则回退默认）收敛：身高 `[0.55, 2.3]`、肩/胯 `[0.65, 1.35]`（两者平均）、纵深 `[0.75, 1.25]`、头 `[0.85, 1.45]`；写 `proxyRoot.scale`（`x=身高比×肩胯均、y=身高比、z=身高比×纵深`）与 `parts.head.scale` 乘头比例；`modelRoot` 存在时**只捕获一次**基准，再以基准驱动根缩放与 `Head` 骨骼缩放（`base.headScale × 头比例`），最后 `updateMatrixWorld(true)`。
9. **poseCatalog**：冻结 21 个 `PANORAMA_CHARACTER_BONES`；`normalizeBonePose` 逐骨 clamp 弧度到 `[-PI, PI]` 并丢弃三轴绝对值之和 `< 1e-8` 的骨；`mirrorBonePose` 交换 `_l`/`_r` 并取反 `y/z`。27 个冻结预设分五类 `{basic:4, gesture:7, action:5, locomotion:4, dance:7}`；`DEFAULT_MANNEQUIN_POSE_ID='neutral'`。`listMannequinPosePresets({category, query})` 大小写不敏感过滤。`resolveMannequinPose(id, custom)` 在 `id='custom'` 且有自定义姿态时返回规范化后的自定义姿态，否则回退 `neutral`。`normalizeCustomMannequinPose` 把名字切到 80 字符、标签切到 12 个。`validateCustomMannequinPose(pose)` 返回 `{ok, errors, pose}`，错误文案 `Pose must be an object.`、`Pose bones are required.`、`Unknown bones: a, b`；注意默认参数不作用于 `null`，`validateCustomMannequinPose(null)` 会抛 `TypeError`（真实行为，按原样断言不改）。
10. **sceneAssetCatalog**：`SCENE_ASSET_COUNT=375`（25 族 × 3 尺寸 × 5 颜色），`DEFAULT_SCENE_ASSET_ID='props-cube-medium-blue'`，类别顺序 `architecture/furniture/stage/props/nature`。`estimateSceneAssetBoundingRadius` 按图元求半尺寸（球取半径；圆环取 `半径+管径`；圆柱取 `max(顶半径, 底半径, 高/2)`；否则取尺寸 `x/y/z` 各自一半），包围盒半径再 `max(0.5, hypot(...))`，无 parts 给 `0.5`。`searchSceneAssets({query, category, limit, offset})`：`offset = max(0, floor(Number(offset)||0))`、`limit = max(1, min(360, floor(Number(limit)||80)))`，匹配 id/族 id/名/类别/标签拼接串。`resolveSceneAsset` 逐级回退到默认 id 与首个资产。
11. **transformInteractionAdapter**：`normalizeTransformInteractionOptions` 归一 `mode`（`move → translate`）、`space`、`constraint`，`uniformScale`/`groundLock` 用 `!== false`，吸附步长 `translation 0.25`、`rotation PI/12`、`scale 0.1` 取正数。`applyTransformInteractionOptions(pose, options)`：`groundLock && mode==='translate'` 把 `y` 归零；`uniformScale && mode==='scale'` 时按约束里第一个命中的轴（顺序 `x/y/z`，都不命中用 `x`）取等比基准；吸附开启时平移/旋转/缩放各自对齐步长，旋转吸附会把 `quaternion` 置 `null`，缩放吸附保留 `0.01` 下限。`normalizePose` **不**应用 `groundLock`（所以未 `preview` 就 `commit`/`cancel` 拿到的是归一化基准姿态）。`TransformInteractionAdapter` 的 `begin` 要求 `objectType` 与 `objectId` 齐全（否则 `false`），已有拖拽先 `cancel`，并关闭轨道控制；`preview` 应用选项并回调；`commit`/`cancel` 清空拖拽、恢复轨道控制并分别回传预览姿态/基准姿态；`getState` 的 `dragging` 用 `drag !== null`。

## 4. 验证结果

- 11 个测试首跑全绿，经 prettier 复排后复跑仍全绿：9 + 13 + 10 + 12 + 12 + 31 = 87（runninghubAiApp），25 + 15 + 18 + 13 + 22 = 93（panoramaSceneNode），合计 **180/180**。
- 首轮有 3 处断言与实现语义不符，按「落地码是真相」改为断言真实行为并补边界用例（`rhAiAppMotion` 的入场 `onfinish` 后应保持可见、`animatePreviewOrder` 先量后改且每元素二次量取；`cameraTimeline` 的 `ease-in-out` 在中点附近、多关键帧时长、首帧时刻命中），没有改动任何落地模块。
- 变异抽查（`b125c/mutate.mjs`）**97 个全检出、0 存活、0 跳过**；11 个外部副本基线全绿、`restored=true`，只改副本。首轮 7 个存活者与 2 个跳过已收口：`rhAiAppMotion` 亚像素阈值补「恰好 1 像素」用例；`rhAiAppPreviewPresentation` 的候选菜单选择器锚串写错（`['data-role=...` 多一个引号）已改正、`canRemovePreviewInputs` 锚串在文件内出现两次改用 `_0x3d5851` 唯一锚；`cameraTimeline` 补缓动 0.55、多关键帧时长与首帧边界；`characterBodyProfile` 补 Head 基准缩放 ≠ 1 的用例；`transformInteractionAdapter` 把语义等价的 `move→move` 变异换成 `move→rotate`、并补标量缩放 `0.005 → 0.01` 下限用例。
- 原始 UTF-8 TAP 实跑（`b125c/sweep-raw.mjs`）：src **4864 / 4821 / 43**（本批新增 180），43 项失败名与 `b85-fails.txt` 完全一致、新增 0 消失 0；api **791 / 791 / 0**。受保护 `freeImageHostApi.js` MD5 不变。
- 未启动应用、Electron，未构建，未联调，未提交或推送。

## 5. 未执行项与边界

- 11 件全部**未接线**：从 `index.html`/`main.js` 等入口沿相对 import 遍历都走不到，消费方反查为 0 命中（6 条命中全是子串撞名）。
- `rhAiAppSaveAction` 直接引用全局 `window`，接线时宿主必须提供 `window.showToast`；测试用 `globalThis.window` 临时替换。
- `rhAiAppPreviewPresentation` 只能通过注入的 `primitives` 与 DOM 化 `readState`/`actions` 观测，接线时须补齐 23 个 primitives 与宿主回调。
- `poseCatalog` 的 `validateCustomMannequinPose(null)` 抛 `TypeError` 是镜像真实行为，未「修复」。
- 全景 3D 主装配（依赖 three.js 的 `workspaceController`/`sceneRuntime` 等）与 `cameraTimeline`/`characterBodyProfile`/`poseCatalog` 的实际消费仍缺，R09 未完成。

## 6. 收尾与下一段

- 孤立台账 304→315 / 1066→1077；专题见本文件。
- `src/modules` 纯叶队列扣掉 125a 的 13、125b 的 12、本批的 11 后余 **76 LEAF / 95 OK**；接下来按 `canvasShortcuts` 1、`promptPresetCatalog` 1（`doubaoAudio1PromptPresets.js` 单文件约 47 KB）、`imageAnnotate` 2、`interaction` 3、`whiteboard` 2、`tutorials` 2、`settings` 2、`canvasMcp` 2、`videoRetake` 1 成组推进，`src/modules` 直属目录另有 47 件零依赖叶。
- 7.3 受阻项与 15 件协作受阻件不变，须另行授权的生成件升级批。
- R01–R26 都没有完成。
