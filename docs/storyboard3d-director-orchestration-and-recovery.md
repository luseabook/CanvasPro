# 第88批专题：分镜 3D（导演编排面板/生成层/回收站/编辑器 store）自洽核心 `src/modules/storyboard3d/`（6 件零依赖落地不接线）

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行，是第 86、87 批同一特性区的续取。0.7.16 端口里 `src/modules/storyboard3d/` 共 **97 件**；第 86 批落地 6 件（`docs/storyboard3d-director-camera-and-timeline.md`）、第 87 批落地 6 件（`docs/storyboard3d-viewport-and-interaction-policies.md`），本批再从「依赖完全闭合」的子集中取 6 件**逐字节**落地并配离线测试：缓动曲线编辑器、跟拍方式面板、AI 生成层与历史版本、回收站/删除恢复、编辑器状态 store、导出回画布桥。

---

## 1. 本批要补的缺口

第 87 批交付后 `src/modules/storyboard3d/` 仍有 **85 件**缺失（97 − 12）。据 `C:/Users/luobote/.qoder/tmp/deobf-tools/b86/deps.json`：端口 `src/**` 共 1 550 件里「依赖全闭合、可在本仓直接落地、且仍缺失」者 467 件，其中 `src/modules/storyboard3d/` 占 **34 行**（含第 86/87 批刚落地的 12 件陈旧行），**真正仍缺 22 件**。本批从这 22 件中取 6 件。

开工前复核：本仓对 6 个模块名**0 命中**（`grep -rn "storyboard3d/<name>.js" src electron`，排除模块自身与测试后全部为 0），即既无源码也无引用点；6 件源码之间**也互不引用**（0 条相对 `import`）。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/directorCurveEditor.js` | 173 | 6 786 | 0 | 缓动曲线与空间切线编辑器：SVG 三次曲线 + 两个控制柄（可拖拽/方向键微调）、4 个曲线数值输入、入/出切线三轴输入；`class DirectorCurveEditor` 负责 `change`/`key`/`down`（2 个导出） |
| `src/modules/storyboard3d/directorFollowPanel.js` | 128 | 4 917 | 0 | 跟拍面板：三档跟拍方式（相对运动/沿轨道注视/固定偏移）、偏移三轴输入、分段跟拍片段的增删与字段改写、HTML 转义（3 个导出） |
| `src/modules/storyboard3d/directorGeneratedLayers.js` | 96 | 4 289 | 0 | AI 生成层与历史版本：层/任务的窗口化归一、生成结果落层（类型白名单、父级重置、锁定对象拦截）、替换前压入历史版本、按版本回滚（4 个导出） |
| `src/modules/storyboard3d/directorRecovery.js` | 205 | 8 412 | 0 | 删除回收站：删除差集记账、回收条归一、整场/对象/镜头/轨道/运动片段/跟拍约束的恢复重建、影响面文案（4 个导出） |
| `src/modules/storyboard3d/editorStore.js` | 95 | 2 927 | 0 | 分镜 3D 编辑器状态 store：选中集归一、白名单枚举（工具/检查器页签）、严格 `true` 布尔开关、订阅/退订与销毁、快照隔离（1 个导出） |
| `src/modules/storyboard3d/exportCanvasBridge.js` | 42 | 1 951 | 0 | 导出回画布桥：监听 `storyboard-3d:export-complete`，过滤 `image/*`/`video/*` blob，逐个建画布媒体节点并按结果种别提示（1 个导出） |
| `src/modules/storyboard3d/directorCurveEditor.test.js` | 183 | 6 521 | — | 5 项 |
| `src/modules/storyboard3d/directorFollowPanel.test.js` | 162 | 6 551 | — | 7 项 |
| `src/modules/storyboard3d/directorGeneratedLayers.test.js` | 200 | 7 236 | — | 7 项 |
| `src/modules/storyboard3d/directorRecovery.test.js` | 250 | 8 529 | — | 7 项 |
| `src/modules/storyboard3d/editorStore.test.js` | 121 | 4 519 | — | 8 项 |
| `src/modules/storyboard3d/exportCanvasBridge.test.js` | 145 | 4 877 | — | 7 项 |

6 件源码合计 **739 行 / 29 282 B**；6 件测试合计 **1 061 行 / 38 233 B**（41 项）；新增总计 **1 800 行 / 67 515 B**。

6 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`/`!![]`、`Object['freeze']`、`Number['isFinite']`、`0x` 十六进制、`\x20` 转义、逗号表达式、计算属性名方法 `['change']`）。

### 2.1 关键行为（供接线时对照）

- **`directorCurveEditor.js`**：模块级 `curvePath([x1,y1,x2,y2])` 把归一化控制点映射到 200×140 视框：`'M20 120 C' + (20+x1*160) + ' ' + (120-y1*100) + ',' + (20+x2*160) + ' ' + (120-y2*100) + ',180 20'`。`renderDirectorCurveEditor(shot)` 输出 `<details class="storyboard-3d-director-curve">` 内嵌 `<svg viewBox="0 0 200 140" data-director-curve>`、`<path data-curve-line d="…">`、两个 `<circle tabindex="0" role="slider" data-curve-handle="0|1" cx cy r="6">`、四个 `data-curve-value="0..3"` 数值输入（`min` 为 `i%2 ? -4 : 0`、`max` 为 `i%2 ? 4 : 1`，`step 0.05`，标签 `起点 X/起点 Y/终点 X/终点 Y`）、以及 `inTangent`/`outTangent` 各三个 `data-curve-tangent="<名>" data-axis="0|1|2"` 输入（标签 X/Y/Z）。`easingCurve` 缺省 `[0,0,1,1]`，切线缺省 `[0,0,0]`。`class DirectorCurveEditor`：`['change']` 要求 `target.matches('[data-curve-value],[data-curve-tangent]')` 且有选中镜头；数值非有限时**返回 `true` 但不落盘**；`data-curve-value` 走 `easingCurve[idx]`，`data-curve-tangent`+`data-axis` 走对应切线数组，均以**拷贝**后 `path.change(...)` 提交。`['key']` 要求 `dataset.curveHandle != null` 且为四个方向键：左右改 X（axis 0）、上下改 Y（axis 1），步长 ±0.05（左/下为减），先 `preventDefault()` + `stopImmediatePropagation()` 再提交。`['down']` 要求 `closest('[data-curve-handle]')` 且 `button === 0`；按下时捕获 `path.selected()`/`path.identity()`/`JSON.stringify(selected)` 与 `handle.ownerSVGElement.getBoundingClientRect()`，用 `new path.timeline.window.AbortController()` 统一持有三个指针监听——`pointermove` 按 `((clientX-rect.left)/rect.width*200-20)/160` 与 `(120-(clientY-rect.top)/rect.height*140)/100`（分别夹 0–1 与 ±4）更新数组，并同步 `setAttribute('cx'/'cy')` 与曲线 `d`；`pointercancel` 走 `this.cancel?.()`；`pointerup` 仅在 `pointerId` 一致时取消监听，且**身份与选中内容均未变**才 `path.change({easingCurve})`。
- **`directorFollowPanel.js`**：模块级 `escape` 只转义 `&`、`"`、`<`；`modes` 为 `[['relative','相对运动跟拍'],['path','沿轨道注视目标'],['fixed','固定偏移跟拍']]`。`renderDirectorFollowPanel(shot, objectOptions)` 输出 `data-director-follow="mode"` 下拉（当前值加 `selected`）、`followOffset-0/1/2` 数值输入（标签 `偏移 X / 米` 等）、`data-storyboard-3d-action="timeline-follow-add"` 按钮；`cameraConstraintClips` 每段输出 `<div … data-director-follow-clip="<转义 id>">`，内含 `start`/`end` 输入、方式与偏移、`followObjectId`/`lookAtObjectId` 下拉（选项来自 `objectOptions`，同样转义）、`lookAtOffset-1`（标签 `注视高度`）与带 `data-clip-id` 的删除按钮。`changeDirectorFollow(controller, event)` 要求 `target.matches('[data-director-follow]')`，把 `dataset.directorFollow` 以 `-` 切分：有下标则写 `target[key][Number(index)]`，否则写 `target[key]`；`type === 'number'` 时解析为数字并在**非有限**时原样返回（不落盘）；切到 `mode === 'fixed'` 且 `followOffset` 三项**全为 0** 时补 `[0,2,5]`；全部在 `controller.mutate('调整跟拍方式与片段', …)` 内完成，返回 `true`。`clickDirectorFollow(controller, action, target)` 仅在 `action.startsWith('timeline-follow-')` 时生效：`timeline-follow-delete` 按 `dataset.clipId` 过滤；`timeline-follow-add` 以 `{...structuredClone(project.cameraConstraint), id: 'follow-'+crypto.randomUUID(), start: Math.min(3599, timeline._timeForShot(context().shot)), end: Math.min(3600, start+3)}` 追加，随后 `timeline.requestRender?.()`，返回 `true`。
- **`directorGeneratedLayers.js`**：`normalizeDirectorGeneratedLayers(list, mapObject)` 先 `slice(-30)` 再筛 `id` 为字符串，`name` 缺省 `生成层` 且 `slice(0,120)`，`objectIds` 只留字符串；`versions` 先 `slice(-10)`，`id` 强制 `String(...)`、`name` 缺省 `历史版本` 且 `slice(0,120)`、`objects` 经 `mapObject` 后 `filter(Boolean)`。`normalizeDirectorGenerationJobs(list)` 同样 `slice(-30)`，`kind` 仅 `'panorama'` 保留否则 `'layer'`，`status` 白名单 `['running','completed','failed']` 否则 **`'failed'`**，`message` `slice(0,500)`、`prompt` `slice(0,5000)`，`createdAt` 取 `Math.max(0, Number(x) || 0)`。`applyDirectorGeneratedLayer(project, result, {layerId='', name='AI 生成层'})`：`generatedLayers` 缺省 `||= []`；给定 `layerId` 但找不到 → 抛 `要替换的生成层已不存在。`；否则新建 `{id:'layer-'+uuid, name, objectIds:[], versions:[]}` 并压栈；若该层既有 `objectIds` 中**任一对象 `locked`** → 抛 `生成层中有锁定对象，无法替换。`；新对象只取 `type ∈ ['prop','character','light']`，各重新编号 `'generated-'+uuid` 且 **`parentId` 置 `undefined`**；为空 → 抛 `生成结果没有可插入的场景对象。`；若该层原本有对象，先把**旧对象快照**压成 `{id:'version-'+uuid, name: 层名 + ' · ' + new Date().toLocaleString(), objects: structuredClone(旧对象)}`；随后 `versions` 再 `slice(-10)`、`objects` = 去掉旧归属再拼新对象、`layer.objectIds` 改为新 id 列表；返回 `project`。`restoreDirectorLayerVersion(project, layerId, versionId)` 找不到版本 → 抛 `生成层历史版本不存在。`，命中则以 `{objects: 版本对象}` 委托上述落层函数。
- **`directorRecovery.js`**：`recordDirectorDeletions(before, after, label = '删除内容')` 在**两侧 `id` 不等或 `scenes` 非数组**时原样返回 `after`；否则逐场景求差集（旧有新无的对象 id、镜头 id），场景整体消失或存在差集时压入 `{scene: structuredClone(旧场景), wholeScene: !afterScene, objectIds, shotIds}`；有记录则把 `{id:'recycle-'+uuid, label, deletedAt: Date.now(), removed}` 追加进 `after.recycleBin` 并 `slice(-20)`。`normalizeDirectorRecycleBin(list, mapScene)` 先 `slice(-20)`、筛 `id` 为字符串，`label` 缺省 `删除内容` 且 `slice(0,120)`、`deletedAt` 取 `Math.max(0, Number(x) || 0)`、`removed` 先 `slice(0,100)` 再筛含 `scene` 者，逐项映射 `{scene: mapScene(scene, index), wholeScene: === true, objectIds/shotIds: 只留字符串}`。`restoreDirectorRecycleEntry(project, entryId)` 深拷贝后在 `recycleBin` 找记录，找不到 → 抛 `回收记录不存在。`；对每条 `removed`：场景缺失则整场回填并 `continue`，否则按 `objectIds` 补对象（去重）→ 清理悬空 `parentId` → 合并镜头动画：`objectTracks`/`actionClips` 按 `objectId`/`id` 去重合并，随后由**已并入轨道的** `position/rotation/scale` 关键帧 id 建集合，用它过滤 `motionClips`（`keyframeIds` 有交集且 id 未存在），并按新并入对象补齐 `objectPaths`、`cameraConstraint.followObjectId/lookAtObjectId`、`cameraConstraintClips`（`followObjectId`/`lookAtObjectId` 命中新并入者且 id 未存在）；最后把该记录从 `recycleBin` 移除并返回深拷贝。`directorDeletionImpact(project, objectIds)` 汇总「对象数 / `cameraId` 命中镜头数 / 命中对象的运动轨道数 / 命中对象的跟拍约束数」为中文提示 `已移入回收站：N 个对象，关联 N 个镜头、N 条运动轨道、N 项跟拍约束。可在导演编排中恢复。`
- **`editorStore.js`**：`createStoryboard3DEditorStore(initial = {})` 默认 `{selectedObjectIds: [], activeTool: 'select', assetLibraryOpen: false, inspectorOpen: false, inspectorTab: 'properties', objectOutlineOpen: false, flyMode: false}`，与 `initial` 合并后对 `selectedObjectIds` 做 `String(x||'').trim()` + 去空 + 去重（非数组清空）。`getSnapshot()` 返回 `{...state, selectedObjectIds: [...state.selectedObjectIds]}`（**数组隔离、对象为浅拷贝**）；`subscribe(fn)` 对非函数返回空退订函数，否则加入集合并返回删除函数。各 setter 每次都以**新快照对象**通知全部订阅者（`(snapshot, {reason})`）并返回该快照：`setSelectedObjects` 归一；`setActiveTool` 白名单 `['select','move','rotate','scale']` 否则 `'select'`；`setAssetLibraryOpen` 仅严格 `=== true`，原因 `open-asset-library`/`close-asset-library`；`setInspectorOpen` 原因 `toggle-inspector`；`setInspectorTab` 白名单 `['properties','shot','scene']`；`setObjectOutlineOpen` → `toggle-object-outline`；`setFlyMode` → `toggle-fly-mode`。`destroy()` 清空订阅集合。
- **`exportCanvasBridge.js`**：`normalizeResults(list)` 先取 `blob instanceof Blob` **或** `blob.type` 为真者，再用 `/^(image|video)\//` 校验 `String(blob.type || '')`。`installStoryboard3DExportCanvasBridge({windowObject = globalThis.window, createMediaNodeFromBlob, showToast} = {})`：缺 `addEventListener` 或 `createMediaNodeFromBlob` 非函数时返回空退订函数；否则在 `storyboard-3d:export-complete` 上挂异步处理并**返回用同一函数引用 `removeEventListener` 的卸载器**。处理逻辑：`detail.options.returnToCanvas === false` 或归一后为空 → 直接返回；否则逐个 `await createMediaNodeFromBlob(blob, blob.type || 'image/png', {name, placement: 'viewport-center-sequence', sequenceKey: 'storyboard-3d-export:' + (detail.projectId || 'project')})`，其中 `name` 在多结果时为 `(projectName||'3D 分镜') + ' ' + (index+1)`、单结果时 `projectName || '3D 分镜'`；统计非空返回数，若任一 blob 类型以 `'video/'` 开头提示 `已将 N 个 3D 预演结果添加到画布`，否则 `已将 N 张 3D 分镜添加到画布`，种别 `'success'`。

## 3. 接线状态（零生产消费方，记账）

6 件在本仓**均无生产消费方**：`grep -rn "storyboard3d/<name>.js" src electron`（排除模块自身与测试）**0 命中**。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这 6 件的真实导入方（`grep -rl` 复核其导入说明符）**全部落在 `modules/storyboard3d/` 内部，且这些文件在本仓全部不存在**（逐名 `test -e` 复核为 `missing`）：

| 本批模块 | 端口内的真实消费方 |
| --- | --- |
| `directorCurveEditor.js` | `directorCameraPathController.js`、`directorCameraPathPanel.js` |
| `directorFollowPanel.js` | `directorTimelinePanel.js` |
| `directorGeneratedLayers.js` | `directorGenerationPanel.js`、`directorGenerationService.js`、`projectModel.js` |
| `directorRecovery.js` | `commandHistory.js`、`directorDeliveryPanel.js`、`editorWorkspace.js`、`projectModel.js`、`workspaceController.js` |
| `editorStore.js` | `editorWorkspace.js`、`index.js` |
| `exportCanvasBridge.js` | `index.js` |

其中 `editorWorkspace.js` 是 R09 的主装配点，另有 `index.js`/`directorTimelinePanel.js`/`directorGenerationService.js`/`projectModel.js`/`commandHistory.js`/`workspaceController.js` 等一大片**同代未落地**依赖，属于整片移植范围，不在本批。

## 4. 依赖闭合与目标选择审计

**(a) 选片依据**：沿用第 86 批建立的口径 —— 用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取**所有**模块说明符（含 `export … from` 再导出，修正 `b82/scan-closure.mjs` 的盲点），把相对说明符在端口树内解析后检查目标是否**存在于本仓**，输出 `b86/deps.json`。据此从 `src/modules/storyboard3d` 的 22 件余量里取候选，并以本批新增的 `deobf-tools/b88/picks.mjs` 对 22 件候选逐件抓取说明符、在端口树内解析并回查本仓。22 件**全部**解析通过；其中 8 件的相对依赖指向 `src/modules/panoramaSceneNode/threeRuntime.js`、`src/core/math.js`、`src/core/panoramaSceneMath.js`、`vendor/three/examples/jsm/loaders/GLTFLoader.js`。**本批刻意只取零 `import` 的 16 件中的 6 件**，以回避与可能不同代的 `threeRuntime.js` 咬合（`picks.mjs` 只校验「相对目标在本仓存在」，无法判定世代一致性）。

**(b) 本批候选的直接 `grep` 复核**（不采信任何扫描器的 `deps===0`）：6 件各以 `grep -nE "^import |from '\.|from \"\."` 复核得 **0**，并另以 `grep -rnE "<name>"` 全树反查，确认**本仓**无任何引用点（端口内的引用方见 §3）。

**(c) 逐字节落地**：6 件均从端口原始文件复制到 `deobf-tools/b88/port/` 经 prettier（`singleQuote`/`printWidth:110`/`tabWidth:2`/`semi`/`arrowParens:always`/`eol:lf`）格式化后**原样**拷入本仓，`cmp` 6/6 `IDENTICAL`（§5），未做任何「顺手美化」。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 6 | **6/6 `IDENTICAL`**（落地后与格式复检后各验一次） |
| 语法 | `node --check src/modules/storyboard3d/<f>.js` × 6 | 全部 OK |
| 格式 | `prettier --check src/modules/storyboard3d/*.js`（本批 12 件） | **All matched files use Prettier code style!**（首轮 6 个测试文件告警，`--write` 后复检通过；6 件源码自始未被改写） |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/{directorCurveEditor,directorFollowPanel,directorGeneratedLayers,directorRecovery,editorStore,exportCanvasBridge}.test.js` | **41/41 通过，0 失败**（0.59 s） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **2 000/1 957/43**（第 87 批为 1 959/1 916/43，+41/+41/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与第 84–87 批一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 562 / 0`（第 87 批实测 549，+13 = 6 源码 + 6 测试 + 本专题文档 1） |

测试期间修正的 3 处**测试自身**的期望错误（实现一字未改）：
1. `normalizeDirectorGenerationJobs` 的 `prompt` 截断上限是 `slice(0,5000)`（`0x1388`）而非 2 000，原断言取错常量。
2. `changeDirectorFollow` 对 `type === 'number'` 才做数字解析，`type === 'text'` 时原样写入字符串，故断言 `start` 需用数字类型事件。
3. `editorStore` 的订阅回调收到的是**全量快照**，原断言把 `assetLibraryOpen` 当成所有通知的观测位；改为断言 `reason` 序列（各开关的布尔返回已在同测试中单独覆盖）。

## 6. 未执行的验收项

- **未接线**：6 件无任何生产消费方，端到端行为无从触发。
- **未运行真实 UI**：`directorCurveEditor` 的 `down` 与 `exportCanvasBridge` 均以**手写假对象**断言（Node 无 DOM/BOM）：`closest`/`setAttribute`/`ownerSVGElement.getBoundingClientRect`/`addEventListener({signal})`/`Blob`/`window` 事件总线均为桩件，**未验证**真实浏览器下的指针捕获、SVG 坐标换算精度、`details` 折叠态，以及 `storyboard-3d:export-complete` 事件在真实导出链路中的载荷形状；`directorFollowPanel` 只断言了 HTML 字符串，**未验证**其被插入面板后的实际交互。
- **未验证渲染器集成**：three.js 视口、GPU 能力、模型包许可与下载/缓存、姿态估计（MediaPipe）真实推理（R09 行的验收要求）均未涉及；`directorGeneratedLayers` 只处理数据结构，未调用任何生成服务。
- **未验证回收站与命名的真实语义**：`directorRecovery` 的恢复逻辑以**手写最小场景结构**验证（含 `position/rotation/scale` 三组关键帧数组的约定），未在真实项目模型上跑过导入导出往返；`recordDirectorDeletions` 依赖调用方传入「前/后」两份快照，其真实调用时序未验证。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；本批新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`C:/Users/luobote/.qoder/tmp/shuo-deobf`、`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- 交付物为 6 源码 + 6 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码（假对象桩件只存在于测试内）。

## 8. 下一批建议

1. **同族续取**：`src/modules/storyboard3d` 缺失仍为 **16 件**（22 − 6），据 `b86/deps.json` 可落地者逐名为：`assetCatalogSelection.js`、`backgroundCalibration.js`、`backgroundImageController.js`、`backgroundPerspectiveEstimator.js`、`binaryAssetRepository.js`、`geometryImportWorkerCore.js`、`imagePoseRetargeter.js`、`storyboardExport.js`、`texturePolicy.js`、`voiceInputService.js`，以及带 `threeRuntime`/`core/math`/`panoramaSceneMath`/`GLTFLoader` 直接依赖的 `directorMultiView.js`、`directorSceneAuthoring.js`、`directorViewportRuntime.js`、`gltfImportAdapter.js`、`instanceBatching.js`、`transformSession.js`。其中 `transformSession.js`（接第 87 批 `objectTransformCapabilities.js` + `selectionBox.js`）与 `binaryAssetRepository.js`（457 行）体量最大、咬合最紧，但后者落地前须先核对本仓 `threeRuntime.js` 的世代是否与端口一致。**落地前仍须逐件 `grep` 复核导入面**。
2. **升代类仍须单独成批**：`rendererVirtualization.js` 升代（`resolveRendererVirtualizationTier` 0/4、`resolveRendererLowZoomMountLimit` 0/5）、`canvasMediaLocalService.js`（28 个消费方）升代、`src/components/media-clip` 整片（端口 16 件 vs 本仓 10 件、世代互非超集），以及 `main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换 —— **均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的「设置/策略/手势/编排/回收」自足层已补齐 18 件（第 86 批 6 + 第 87 批 6 + 本批 6），但要形成可运行链路，`editorWorkspace.js`/`index.js`/`projectModel.js`/`directorTimelinePanel.js`/`workspaceController.js` 这一层是绕不开的**同代装配体**，且其下游还牵着 three.js 视口运行时与 GPU 能力探测。建议先按 R09 行验收原文核对**资源许可 / GPU 能力 / 模型包失败可诊断**三件事，再评估整片移植与接线。
