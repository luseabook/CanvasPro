# 第86批专题：分镜 3D（导演相机与时间线）自洽核心 `src/modules/storyboard3d/`（6 件零依赖落地不接线）

本批属于 **R09（分镜3D、导演相机、模型包、全景场景、姿态/相机时间线）** 行。0.7.16 端口里 `src/modules/storyboard3d/` 有 **97 件**，本仓此前**该目录整体不存在**（0 件）。本批把其中**依赖完全闭合**的 6 件**逐字节**落地并配离线测试：小地图投影数学、导演曲线求值、导演相机路径增删改、相机关键帧编辑器渲染、时间线关键帧批量操作、以及时间线展示状态（折叠/滚动/焦点/选区）的捕获与恢复。

---

## 1. 本批要补的缺口

开工前实测：`src/modules/storyboard3d/` 在本仓**不存在**（`ls` 得 `NEW`，目录本身需新建），且全仓对 6 个模块名 **0 命中**（`grep -rn "storyboard3d/<name>" src api electron`，排除本目录自身后全部为 0）。即既无源码、也无任何引用点。

`docs/missing-features-inventory.md` 附录把 `modules/storyboard3d/` 列为「缺失 97 件」（第 269 行，逐名清单）；B 类功能明细表把**分镜 3D** 列为「缺失 `src/modules/storyboard3d/`」（第 136 行，该行括注的「17 个」为旧口径计数，与附录的 97 件不一致，本批以附录逐名清单为准）。本批取其中**自足、可离线断言**的一片。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/miniMapMath.js` | 250 | 11 083 | 0 | 小地图世界↔视口投影：投影构造/正反投影、俯视足迹多边形、相机标记、命中测试、拖动、窗口移动、状态归一化与缩放平移、由状态构造投影（14 个导出） |
| `src/modules/storyboard3d/directorCurves.js` | 61 | 2 821 | 0 | 曲线求值：向量/缓动曲线归一化、三次贝塞尔缓动采样、空间曲线采样（含切线）、关键帧切线平滑（5 个导出） |
| `src/modules/storyboard3d/directorCameraPath.js` | 87 | 3 818 | 0 | 导演相机路径：点集归一化/读取、追加控制点、更新控制点（时间量化/共帧拒绝/切线覆盖/排序）、删除控制点（5 个导出） |
| `src/modules/storyboard3d/directorCameraKeyEditor.js` | 42 | 1 511 | 0 | 相机关键帧编辑器 HTML 渲染：位置/注视目标三轴输入 + 焦距 + 倾斜角（弧度→度）+ 缓动下拉（1 个导出） |
| `src/modules/storyboard3d/directorTimelineOperations.js` | 143 | 5 725 | 0 | 时间线关键帧批量操作：收集/身份、平移（越界与共帧拒绝）、复制归零、粘贴（新 id/偏移/目标轨道校验）、删除（摄像机末帧保护）、时间吸附（7 个导出） |
| `src/modules/storyboard3d/timelinePresentation.js` | 69 | 3 206 | 0 | 时间线展示状态捕获与恢复：折叠项 + 四个滚动容器 + 焦点控件指纹 + 选区，恢复时按镜头号与摘要文本双重守卫（2 个导出） |
| `src/modules/storyboard3d/miniMapMath.test.js` | 263 | 9 068 | — | 17 项 |
| `src/modules/storyboard3d/directorCurves.test.js` | 106 | 4 286 | — | 9 项 |
| `src/modules/storyboard3d/directorCameraPath.test.js` | 179 | 6 896 | — | 13 项 |
| `src/modules/storyboard3d/directorCameraKeyEditor.test.js` | 61 | 2 894 | — | 5 项 |
| `src/modules/storyboard3d/directorTimelineOperations.test.js` | 181 | 7 128 | — | 14 项 |
| `src/modules/storyboard3d/timelinePresentation.test.js` | 210 | 7 628 | — | 9 项 |

6 件源码合计 **652 行 / 28 164 B**；6 件测试合计 **1 000 行 / 37 900 B**（67 项）；新增总计 **1 652 行 / 66 064 B**。

6 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`、`Object['hasOwn']`、`Math['round']`、`0x` 十六进制、`\x20` 转义、逗号表达式）。

### 2.1 关键行为（供接线时对照）

- **`miniMapMath.js`**：`createStoryboard3DMiniMapProjection` 默认世界边界 ±10、视口 240×180、内边距 12（夹到 `[0, min(w,h)/2]`，内尺寸 `max(1, w-2*pad)`，四角绕世界中心旋转，`scale = min(innerW/spanX, innerH/spanZ)`，默认参数下 `scale=7.8`、原点 `(120,90)`）。`hitTestStoryboard3DMiniMapObjects` 跳过 `visible === false`，兼容 `transform.position[0]/[2]` 与 `position.x/z`，用严格 `<` 使并列时首个胜出。`normalizeStoryboard3DMiniMapState` 默认 `x16/y16`，宽 160–640、高 120–480、缩放 0.25–8。`panStoryboard3DMiniMapState` 除以 `max(1e-8, ⌊scale⌋)`，退化为 0 时位移放大到 `-8e8`。
- **`directorCurves.js`**：`sampleBezierEase` 在 `t≤0 || t≥1` 时直通返回 `t`，否则对 x 分量做 24 次二分。`sampleSpatialCurve` 在两端均无切线时退化为纯线性插值，否则逐分量三次插值，缺省切线取相邻差值的 1/3。`smoothDirectorKeys` **原地改写并返回同一数组**，`outTangent[i] = (next[i] − prev[i]) / 6`、`inTangent = −outTangent`（故全零分量的 `inTangent` 为 `-0`），首尾关键帧以**自身**为邻居。
- **`directorCameraPath.js`**：`addDirectorCameraPathPoint` 时间取「末个路径点 +1 秒」，空路径时取「所有关键帧最大时间 +1 秒」并用末个关键帧起锚 `cameraPath`；`> 3600` 抛 `轨道已达到镜头时长上限。`，路径点 `≥ 100` 抛 `每条轨道最多 100 个控制点。`。`updateDirectorCameraPathPoint` 对未知 id **原样返回克隆**；时间按 `round(t*fps)/fps` 量化，越界抛 `控制点时间必须在 0–3600 秒之间。`，与他帧差距 `< 0.5/fps` 抛 `该帧已有摄像机控制点。`；设 `easing` 会删除 `easingCurve`，`inTangent`/`outTangent`/`easingCurve` 走 `Object.hasOwn` 复制或删除；末尾按「时间、再 id 字典序」排序并重新归一化 `cameraPath`。
- **`directorCameraKeyEditor.js`**：纯字符串渲染，数值一律 `Number(v).toFixed(3)`；倾斜角为 `roll * 180 / PI`（缺省按 0）；缓动 `<option>` 仅当前值带 `selected`，非四选项之一时无 `selected`。
- **`directorTimelineOperations.js`**：身份串为 `type:objectId:property:keyId`（缺失字段填空串，`key.id` 缺失时回退 `keyframeId`）。平移/粘贴的共帧阈值统一为 `0.5/fps`；平移整组选中项时组内互不判冲突；粘贴生成 `key-<uuid>` 新 id 并把时间量化。删除摄像机关键帧时若轨内仅剩 1 帧抛 `至少保留一个摄像机关键帧。`。`directorSnapTime` 候选集为「0、总时长、未排除关键帧、动作/运动片段起止」，阈值内取**最早**的最近候选，否则返回量化值。
- **`timelinePresentation.js`**：`controlKey` 用 `JSON.stringify({tag, data(按 key 排序的 dataset 条目), clip})` 作为控件指纹。`captureTimelinePresentation` 在无 `[data-storyboard-3d-shot-timeline]` 节点时返回 `null`；四类滚动容器为 `.storyboard-3d-timeline-grid`/`-toolbar`/`-key-editor`/`.storyboard-3d-director-path-points`。`restoreTimelinePresentation` 以「镜头号一致」为前哨，折叠项以「摘要文本一致」二次校验，焦点恢复走 `queueMicrotask` 并再校验镜头号未变、`isConnected`、且 `activeElement ∈ {body, 目标}`（不抢已被占用的焦点）。

## 3. 接线状态（零生产消费方，记账）

6 件在本仓**均无生产消费方**：`grep -rn "storyboard3d/<name>" src api electron`（排除本目录与测试）**0 命中**；6 件源码之间**也互不引用**（0 条相对 `import`）。按既定口径**宁可留白并记账，也不为「有引用」而擅自接线**，**未伪造消费方**。

端口里这些模块的真实调用方是 `workspaceController.js`/`directorCameraPathController.js`/`directorCameraPathPanel.js`/`directorTimelinePanel.js`/`directorTimelineEditing.js`/`directorProjectPackage.js`/`editorStore.js` 等——它们本仓**整体不存在**，且各自还牵着渲染器/three.js/视口运行时等更深依赖，不属本批范围。

## 4. 依赖闭合与目标选择审计

**(a) 本批工具升级**：`b82/scan-closure.mjs` 只统计 `import` 声明，**不识别 `export … from` 再导出**（第 85 批发现的盲点）。本批改用新写的 `C:/Users/luobote/.qoder/tmp/deobf-tools/b86/deps.mjs`：用 `[/from\s*['"]([^'"]+)['"]/g, /import\s*['"]([^'"]+)['"]/g]` 两个模式抓取所有模块说明符（含再导出），把相对说明符在端口树内解析后检查目标是否**存在于本仓**。输出 `b86/deps.json`：端口 `src/**` 共 **1 550** 件，**可在本仓直接落地（依赖全闭合）而仍缺失**者 **467** 件。

**(b) 该工具自身的两个缺陷（已修，记账）**：
1. 最初用单条正则要求 `from` 前有空白，导致压缩成 `import{a}from'./x.js'` 的写法**一条也匹配不到**，全部文件假报 `deps=0`、可落地数虚高到 1 009。改为上面两个显式模式后修复。
2. 随即给说明符加了过严过滤 `^[A-Za-z0-9_@][…]$`，把**以 `.` 开头的相对说明符全数拒掉**，可落地数回退到 1 009。改为 `^[\w@./-]+$` 后稳定在 467。
3. 早期还含一条动态 `import()` 正则，会把长代码片段当成「外部说明符」显示在 `ext:` 列；已删除（该类误报本身只会偏保守，不影响落地判定）。

**(c) 结论与后续规则**：此后候选件**均直接 `grep` 复核导入面**，不采信任何扫描器的 `deps===0` 结论。本批 6 件已逐个 `grep` 确认 0 相对 `import`、0 跨模块引用。

## 5. 已执行的离线验证

| 验证 | 命令 | 结果 |
| --- | --- | --- |
| 逐字节比对 | `cmp -s <port>/<f>.js src/modules/storyboard3d/<f>.js` × 6 | **6/6 `IDENTICAL`** |
| 语法 | `node --check src/modules/storyboard3d/<f>.js` × 6 | 全部 OK |
| 格式 | `prettier --check src/modules/storyboard3d/*.js`（12 件） | **All matched files use Prettier code style!**（首轮 3 个测试文件告警，`--write` 后复检通过；6 件源码自始未被改写） |
| 本批测试 | `node --test --test-timeout=25000 --test-reporter=tap src/modules/storyboard3d/*.test.js` | **67/67 通过，0 失败**（0.49 s） |
| 全仓 `src/**` 回归 | `node --test --test-timeout=25000 --test-reporter=tap $(find src -name '*.test.js')` | **1 907/1 864/43**（第 85 批为 1 840/1 797/43，+67/+67/±0）；43 项失败名单与 `b85-fails.txt` `diff` **逐名一致** |
| `electron/**` 回归 | `node --test … $(find electron -name '*.test.js')` | **1 649/1 648/1**，与本批前一致（唯一失败仍是 `fullProjectPackageService.test.js` 的 manifest 绑定项） |
| 受保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f`，**未变** |
| 工作树快照 | `echo "staged=… modified=… untracked=… conflicts=…"` | `0 / 67 / 536 / 0`（该处原记为 535 系笔误；经第 87 批实测 549 减去本批新增 13 件（12 代码 + 1 专题文档）反推核对为 536，即第 85 批 523 + 13 = 536） |

测试期间修正的 4 处**测试自身**的期望错误（实现一字未改）：`smoothDirectorKeys` 的 `inTangent` 含 `-0`（改用归一化比较）、`collectDirectorKeys` 的入参**必须有 `objectTracks`**（两处夹具补 `objectTracks: []`）、粘贴物体关键帧的落点应为 `3` 而非 `4`、`createStoryboard3DMiniMapProjectionFromState` 在 `zoom=2` 下两个方向的跨度**均为 10**（`scale = 15.6`）。

## 6. 未执行的验收项

- **未接线**：6 件无任何生产消费方，端到端行为无从触发。
- **未运行真实 UI**：`directorCameraKeyEditor` 的输出 HTML 未在真实 DOM 中渲染；`timelinePresentation` 仅用**手写假 DOM** 断言（Node 无 DOM），`queueMicrotask` 焦点恢复只验证到「微任务后调用 `focus({preventScroll:true})` 与 `setSelectionRange`」，**未验证**真实浏览器中的焦点/滚动行为。
- **未验证渲染器集成**：three.js 视口、GPU 能力、模型包许可与下载/缓存（R09 行的验收要求）均未涉及。
- **未执行**：任何打包、构建、启动应用或真实 AI 服务调用。

## 7. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 复核未变），未改 `src/i18n/messages/*`，未新增 npm 依赖，未改授权检查。
- 未 `git reset/clean/checkout`，未覆盖目录；新增均为**纯新增文件**（`modified=67` 未变），未清理任何未跟踪文件。
- 端口树（`D:\shuocancas`）**只读**访问，未写入。
- 端口源里的 `_0x` 局部名与压缩风格**保留**，未做「顺手美化」，以保证与端口逐字节可比。
- 交付物为 6 源码 + 6 测试 + 本专题文档 1 份；未生成任何临时目录内的运行时依赖，未把绝对路径写入源码。

## 8. 下一批建议

1. **同族续取**：本仓 `src/modules/storyboard3d` 缺失仍为 91 件（97 − 6）。按 §4 的 467 件可落地清单继续取**依赖闭合**的子块，优先与既有 6 件**互相咬合**的一层（如 `directorCameraPresets.js`、`objectTransformCapabilities.js`、`sceneHierarchy.js`、`projectModel.js` 等需先复核其导入面）。
2. **升代类仍须单独成批**：`rendererVirtualization.js` 升代（`resolveRendererVirtualizationTier` 0/4、`resolveRendererLowZoomMountLimit` 0/5）、`canvasMediaLocalService.js`（28 个消费方）升代、`src/components/media-clip` 整片（端口 16 件 vs 本仓 10 件、世代互非超集），以及 `main.js` 的 chrome-shell 最终装配与后端 spawn 站点切换——**均须真机/UI 验收 + 单独授权**，不得混入纯新增批次。
3. **R09 线路的下一步**：分镜 3D 的自足核心已具备，真正接线需要 three.js 视口运行时与工作区控制器整片，建议先做**资源许可/GPU 能力/模型包失败可诊断**三件事的核对（R09 行验收原文），再决定是否整片移植。
