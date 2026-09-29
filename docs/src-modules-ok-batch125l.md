# 第 125l 批：OK 队列收尾组（storyWorkspace 3 件）· OK 队列可落件清零

> 落地方式：只新增文件，不覆盖在用代码；本批**落地不接线**，运行时行为零变化。
> 落地时间：2026-09-28。上游镜像：`C:\Users\luobote\.qoder\tmp\shuo-deobf`（0.7.16 反混淆）。
> 本批是 OK 队列的**收尾批**：落完这 3 件后，`b125/deps-modules.txt` OK 段里的可落件全部落地。

## 1. 落地清单（3 件实现 + 3 件同名测试，53 例）

| 模块 | 实现字节/行 | sha256 前 12 位 | 用例 | 测试字节/行 |
| --- | --- | --- | --- | --- |
| `src/modules/storyWorkspace/storyCanvasMediaSync.js` | 18952/464 | 6f999ab69f48 | 23 | 19844/455 |
| `src/modules/storyWorkspace/storyCanvasSyncWorkspaceController.js` | 12644/293 | 3f770cfcd3c6 | 19 | 15088/374 |
| `src/modules/storyWorkspace/storyReplicationRepresentativeFrames.js` | 2424/55 | 3e90274e4371 | 11 | 7948/230 |

源合计 34 020 B / 812 行；测试合计 42 880 B / 1 059 行。

## 2. 冻结的端口行为（写测试时逐条实测确认）

### 2.1 `storyCanvasMediaSync`

- **节点类型集**：`source-image`/`ai-image`/`image` 与 `source-video`/`ai-video`/`video` 两类算画布媒体节点；`isStoryCanvasMediaNode` 只看 `type`。
- **媒体信息解析**（`resolveStoryCanvasNodeMedia`）：图像按 `images` + `mainImageIndex`/`activeImageIndex`（非有限数或越界都夹回边界）取主图；主地址候选链是 `item.imageUrl → item.url → node.imageUrl → node.src → node.url → item.sourceUrl → node.sourceUrl → item.thumbUrl → node.thumbUrl`（所以**只给缩略图也能顶上主地址**）；`sourceUrl` 再由 `item.sourceUrl → node.sourceUrl → imageUrl` 兜底。视频同构，另带 `videoDuration`/`videoFps`（都 `Math.max(0, …)`）。全链都取不到就返回 `null`。
- **组帧**（`buildStoryCanvasMediaFrame`）：非媒体节点、`storyWorkspaceBinding.kind === 'clip-video'`、缺 `canvasId` 或节点 `id`、解析不到媒体信息——四种情况都返回 `null`。成功时 id 依次取 `binding.clipFrameId → existingFrame.id → 'story-canvas-media-' + hash(canvasId + ':' + nodeId)`；`createdAt` 取 `existingFrame.createdAt → now()`；`currentTimeSec` 恒 0，视频的 `endTimeSec` 等于 `videoDuration`；`sourceKey = 'canvas-node:<canvasId>:<nodeId>'`；集/片段由 `binding.clipFrameEpisodeId|episodeId|existingFrame.episodeId|episodeId` 与对应 clip 字段定位，找不到就用第一条兜底。
- **对账**（`reconcileStoryCanvasMediaNodes`）：缺 `project`、`nodes` 不是数组、或 `canvasId` 与 `project.canvasBinding.canvasId` 不一致时返回 `false`。绑定里 `projectId` 与当前项目不同 → 摘掉该节点已有帧；节点不再算媒体节点 → 也摘掉；比对前后 `JSON.stringify` 相同则返回 `false`（不改动）。
- **帧转节点数据**（`buildStoryClipFrameCanvasNodeData`）：图像 → `type:'source-image'` + `needsAutoResize:true`；视频 → `type:'source-video'` + `videoUrl`/`thumbUrl` + `posterUrl`（缺海报时用缩略图兜底）+ 时长帧率。两者都带 `storyWorkspaceBinding`（`kind:'clip-frame-media'`、`canvasScope:'project'`、`clipFrameId/EpisodeId/ClipId`）。
- **帧画布适配器**（`createStoryClipFrameCanvasAdapter`）：需要 `canvasTabManager.getActiveCanvasId`、`createNodeAtCursor`、`getGraphState`、`updateNodeData`；`createMediaNode` 的尺寸走 `getNodeSize(type, node)`，缺省 `0x200 × 0x120`，拿不到新 id 抛「创建片段帧画布节点失败」，写回时剥掉 `type` 并 `commit()`；`deleteNodes` 在**无可删项时返回 `false`**（注意与 `workspaceCanvasMaterialization` 相反）。
- **删画布媒体节点**（`deleteStoryCanvasMediaNodes`）：适配器必须是 `canvasExists`/`switchCanvas`/`deleteNodes` 齐全；缺 `canvasId`、`nodeIds` 为空、画布不存在都返回 `false`；`switchCanvas` 返回 `false` 时抛「无法切换到关联画布：<id>」。
- **同步片段帧到画布**（`syncStoryClipFrameToCanvas`）：适配器需 `canvasExists`/`switchCanvas`/`nodeExists`/`createMediaNode`/`updateMediaNode`；没有绑定画布或画布不存在 → `{ synced: false, reason: 'canvas-unavailable' }`；切换失败抛「无法切换到已绑定的项目画布：<id>」；只有 `frame.canvasId` 与目标一致且节点存在才走更新，否则新建；`sequenceKey` 为 `'story-project:<projectId||canvasId>:clip-frames'`；拿不到节点 id 抛「同步片段帧到项目画布失败」。

### 2.2 `storyCanvasSyncWorkspaceController`

- 构造期校验四组依赖，错误信息可定位：`state` 非对象 → `Story canvas sync requires workspace state.`；`projectTasks` 缺 `createToken/isCurrent/isLive/syncEntry`、`persistence` 缺 `schedule`、`presentation` 缺 `closeMenu/handleMediaNodeChanges/refreshEpisodeRail/refreshToolbar/requestWorkspaceMode/showToast`、projection 三个函数缺任一 → 各自带组名的 `TypeError`。
- 返回**冻结**对象：`{ addProject, addSelectedEpisode, destroy, syncFrame }`。
- `syncFrame(entry, frame)`：缺 `operations.syncClipFrame`、`entry.data.project.canvasBinding.canvasId` 为空、`frame` 为空 → `false`；服务返回 `synced` 为假、或帧都 `isLive` 为假、或 `entry.data.clipFrames` 里找不到同 id 帧 → `false`；成功则把 `syncClipFrame` 返回的 `frame` 合并回 `clipFrames`、`syncEntry(entry)`、`persistence.schedule({immediate:true})`，并在**当前任务 + `state.view === 'episode'`** 时 `refreshEpisodeRail({refreshContent:true})`；抛错时只 warn，且**当前任务**才 `showToast(message, 'warning')`。
- `addSelectedEpisode()`：没有选中集 → `false`；缺 `operations.createEpisodeCanvas` → `showToast('项目关联画布服务尚未初始化。','error')` + `false`；成功则用返回的 `canvasId/nodes` 写绑定、`handleMediaNodeChanges({canvasId, nodes})`、同步本集帧，最后 `requestWorkspaceMode('canvas')` 并提示「已同步本集到项目关联画布。」（`reused`）或「已创建项目关联画布并同步本集。」。
- `addProject()`：`getProjectCanvasEpisodes(data.episodes, state.selectedEpisodeId)` 取不到第一条 → `false`；缺 `operations.createProjectCanvas` → `showToast('项目画布服务尚未初始化。','error')`；成功提示「已创建项目画布，加入 N 项内容。」或「项目画布已同步：更新 X 项，新增 Y 项。」；`nodes` 若为对象数组会取 `.node` 再过滤。
- **待处理态**（内部 `_0x7edf9`）：进入时 `state.canvasSyncPending = true`、`canvasSyncScope = scope`、`presentation.closeMenu()`、`root.classList.toggle('is-canvas-sync-pending', true)`、`root.setAttribute('aria-busy','true')`、`workspaceShell.inert = true` + `setAttribute('inert','')`、`loadingElement.hidden = false` + `aria-hidden='false'`、`refreshToolbar()`；退出时全部反向恢复并移除 `inert` 属性。
- **按项目去重**：同一 `projectId` 的并发请求复用同一个内部 promise（外层 `async` 包装仍会给出不同的外层 promise），任务结束时按项目删除并把 pending 复位。`destroy()` 清空所有在途记录与界面标记（不取消已发出的请求）。

### 2.3 `storyReplicationRepresentativeFrames`

- `captureStoryReplicationRepresentativeFrame`：截图参数固定为 `{ sourceUrl: videoRef, currentTimeSec: timeSec, fileNamePrefix: 'story_source_character', crop }`；截图后、保存后各检查一次 `isActive()`，任一为假都返回 `null`（不保存 / 不返回结果）；保存走 `saveVideoFrameSnapshot(captured, (file) => save(file, projectId))`；有 `crop` 时结果额外带**裁剪框副本**与 `width`/`height`。
- `collectStoryReplicationRepresentativeFrames`：遍历 `episode.replication.sourceAnalysis.characters`；已有 `frame.localPath` 的跳过；每条上报 `'正在提取人物代表画面 N/M'`；成功写入 `frame` 并清空 `frameError`，失败写 `frameError = error.message || '代表画面提取失败，可播放原片后重新截帧。'`；每步前后都校验 `isActive()` **且** `sourceAnalysis` 引用没被换掉，任一不成立立刻 `return`（丢弃本轮结果）。

## 3. 检查结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b123-gate.mjs` | 3/3 `MISSING_TOTAL=0`（13 条具名导入全命中） |
| prettier(镜像) 逐字节 | 3/3 相同 |
| `node --check` | 6/6 通过 |
| bare node 导入 | 3/3 成功 |
| 本组单测 | **53 / 53 / 0**（首跑 3 例失败，全部修正测试侧，未改移植实现） |
| 消费方反查 | 命中 **0**（连同名局部实现都没有）→ 落地不接线 |
| src 全量回归 | **6916 / 6873 / 43**（+53 例，与新增用例数吻合） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条相同**，新增 0、消失 0 |
| api 全量回归 | **791 / 791 / 0**（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

证据文件（`deobf-tools` 下）：`b125l-gate.txt`、`b125l-src-raw.tap`、`b125l-fails.txt`、`b125l-api-raw.tap`、`b125l/port/`。

## 4. 接线候选

本批 3 件在 `api`/`src`/`electron`/`main.js` 里**零命中**，也**没有**同名局部实现（不像 125j 的 `promptAssetInputRefs` 或 125k 的 `scene3dGizmoVisual` 有抽取源）。要接线只能从真实调用点补装配：`storyCanvasSyncWorkspaceController` 需要接工作室的「加入画布」入口，`storyCanvasMediaSync` 需要接画布媒体节点变更与工作室片段帧同步链路。

## 5. OK 队列收尾对账（本批完成后）

| 阶段 | 可落余量 | 本批/本阶段动了什么 |
| --- | --- | --- |
| 125i 之后 | 23 件 | 对 61 件未落 OK 件逐件跑闸门，得 33 可落 / 28 受阻 |
| 125j | 23 → 13 | 落图像输入与提示词族 10 件（94 例） |
| 125k | 13 → 3 | 落分镜 3D 与交互族 10 件（106 例） |
| 125l（本批） | 3 → **0** | 落 storyWorkspace 3 件（53 例） |

**结论：`b125/deps-modules.txt` OK 段里的可落件已全部落地，OK 队列（可落部分）清零。** 余下 **28 件受阻件**（清单见 125j 专题 §2 与 TRACKING §7.3）必须**升代既有件或补清单扩展**才能继续，属需另行授权的口径。

## 6. 未执行项与边界

- 未启动应用、未构建、未联调；本批不接线，运行时行为零变化。
- 未提交、未推送；未做变异测试。
- 独立验证只覆盖离线单测这一级。`storyCanvasSyncWorkspaceController` 的 DOM 标记用替身验证，未在真实 DOM 上跑过。
