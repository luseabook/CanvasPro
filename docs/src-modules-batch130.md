# 第 130 批：首波第三批（快捷键图、订阅、修复流、任务反馈、MCP 会话等 10 件）

> 第 127 批首波 260 件里的第三批，沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **38 062 B / 946 行**；测试 10 个同名件共 **52 424 B / 1 338 行**、**60 例**。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | --- | --- | --- | --- |
| `canvasShortcuts/shortcutGraph` | 2771/67 | cb519789c11f | 6 | 4703/117 |
| `storyWorkspace/storyCanvasNodeSubscription` | 2887/75 | 842ec78e7fe7 | 5 | 4144/114 |
| `audioVoiceRuntimeRepairFlow` | 2877/81 | c0bef30bff32 | 7 | 5522/155 |
| `storyWorkspace/storyReplicationReviewLayout` | 3561/75 | 09aed03146bb | 4 | 6304/150 |
| `personReplacement/personReplacementLocationGuideSvg` | 3625/100 | adaf19ccb954 | 5 | 3475/69 |
| `taskStatusFeedback` | 4351/108 | 7ab0813a38f7 | 7 | 5006/135 |
| `videoRetake/segmentRetakeInputBinding` | 4141/102 | 0ef88623768a | 4 | 4672/110 |
| `personReplacement/personReplacementShotReverse` | 3992/91 | 1715dd2c8c05 | 7 | 5551/134 |
| `panoramaSceneNode/scene3dPanoramaBridgeTexture` | 4498/97 | 22bf6c3f95e2 | 7 | 6221/169 |
| `canvasMcp/canvasMcpSession` | 5359/150 | d34d7efa5169 | 8 | 6826/185 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`shortcutGraph`**：`captureShortcutGraph(store, ids?)` 无选中抛「请先在画布中选中需要保存的节点」；捕获会沿 `parentId` **带出整棵子树**，两端不在选择集的边丢弃，父指针脱离选择树的置 `null`。`prepareShortcutGraph` 以中心点为锚重摆并**重映射 id**（`idMap` 记录新旧映射）。`insertShortcutGraph` 在 `batch` 里逐项落库、选中新 id、再 `commit()`；**中途抛错会回滚新节点并恢复原选择**后重新抛出。
- **`storyCanvasNodeSubscription`**：快照只含媒体节点（图片类 + 视频类，`source-video` 也算）；订阅依赖 `subscribeSelector` 或 `subscribeRaw` + listener，缺了抛错。首报全量，之后按 `id:_bizRev:type` 修订只报变化，消失的节点以 `{id}` 占位上报；画布 id 变化即重置；listener 抛错吞掉并 `console.warn`。
- **`audioVoiceRuntimeRepairFlow`**：错误文案按 `invalid x-api-key` / 权限类正则映射专门文案，其余原样；初始进度按本地/云端分流 `model-download` / `model-prepare`；`recoverAudioVoiceLocalAsrRuntime` 只对「本地 ASR 运行时类失败」且未尝试过修复时走修复流程（先弹确认→置分析态→`trackTask`+`install`），用户拒绝/失去提交资格静默返回 `false`，修复失败清进度、置 `error` 并提示原因。
- **`storyReplicationReviewLayout`**：绑定即把 `{left,right}` 比例写成 `--review-left/middle/right` 三个 CSS 变量并同步滑块的 aria 三元组（left ∈ [12, min(38, right−20)]，right ∈ [left+20, 75]）；方向键步进 2 并夹在合法区间；分集页签支持 ArrowLeft/Right/Home/End 焦点漫游（focus + click）。
- **`personReplacementLocationGuideSvg`**：1200 宽、高按画幅比例四舍五入；四分参考线；人物框按 bbox 比例定位、颜色从 `PERSON_REPLACEMENT_MARKER_COLORS` 按 `markerIndex ?? 序号` 取；label 做 XML 转义；无 DOM 环境下 `resolvePersonReplacementLocationGuidePreview` 原样返回。
- **`taskStatusFeedback`**：等待超时（默认 10 分钟）提示「等待较久」；结束任务按 `[source, projectId, canvasId]` 分组、`mergeMs`（默认 600ms）合并，**只有存在失败才发**：单条「标题失败：错误」，多条「多项任务已结束：成功 X 个，失败 Y 个。标题：错误」；静默与旧任务不通知；`destroy` 后全面停摆。
- **`segmentRetakeInputBinding`**：`getSegmentRetakeVideoEdges` 只认「源节点类型含 video」或 `refSlot==='referenceVideo'` 的入边；绑定按 `sourceMediaKey` 找匹配边，其余视频边删除；物化片段会新建 `source-video` 节点（`剪辑自 X`、`fixedSize`、`needsAutoResize:false`）并接 `referenceVideo` 边、写回 `materializedClip.nodeId`。
- **`personReplacementShotReverse`**：`toggle…AtTimelineSec` 返回 `{draft, position, isReversed, message}` 且不改原数组；提交态三档文案；`materialize…` 区间与倒放态都没变时直接复用现有引用，否则走「导出片段 →（需要时）倒放」两段，失败按 `error/message` 抛出。
- **`scene3dPanoramaBridgeTexture`**：令牌不符直接忽略；成功路径配置贴图（球面内贴图）→ 挂 `material.map` → 可见 → 状态广播 → 重绘；完成后令牌失效会 **dispose 旧贴图**；失败广播 `全景图加载失败` 并回到可见性基线；全量加载按帧调度、可取消；预览成功后可顺带调度全量。
- **`canvasMcpSession`**：启用前必须有画布绑定（否则 `Open a canvas before connecting`）；工具数 = 命令工具数 + 1（`canvas_models`）；未登记命令按 `Unauthorized canvas command` 回报；完成载荷是 `{ok, result}` 双层包裹，净化后超 25 万字符整体替换为 `RESULT_TOO_LARGE`；`destroy` 后不能再启用；`checkBinding` 检测换绑即以 `canvasChanged` 断开。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| prettier(镜像) 逐字节 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10 `MISSING_TOTAL=0`（28 条具名导入全命中） |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **60 / 60 / 0** |
| 消费方反查 | 真实命中 **0** → 确认「落地不接线」 |
| src 全量回归 | **7079 / 7036 / 43**（+60，与新增用例数吻合） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 60 例中 **13 例失败**，全部是测试侧问题，未动移植实现。典型几处：

1. **`prepareShortcutGraph` 会重映射 id**（我以为只挪位置）——`idMap` 才是新旧映射的权威。
2. **完成载荷双层包裹**：MCP 完成回报是 `{ok, result:{…}}`，我第一版按单层取 `total`。
3. **`sanitizeMcpResult` 会把长字符串截断到 1.5 万字符**——想触发 `RESULT_TOO_LARGE` 必须用多个键凑出净化后仍超 25 万字符的结果。
4. **`describeCanvasMcpModels` 不支持 `limit`**（只认 `offset/query/kind/modelId`）。
5. `isStoryCanvasMediaNode` 的视频集合包含 `source-video`；`buildWorkspaceMediaDownloadPayload` 只校验路径前缀不校验媒体类型（128 批已记，本批再次踩到）。
6. 假 DOM 事件对象要带 `closest`/`preventDefault`/`stopPropagation`/`parentElement`；`node --test` 文件级超时多半是**轮询循环没给退出条件**（`{request:null}` 会无限续轮）。

## 4. 本批发现的一个真实缺陷（未修，记录在案）

**`src/core/math.js` 的 `findAvailablePosition` 遇到缺几何信息的节点会死循环**：节点对象若没有 `x/y/width/height`（例如 `{id:'b'}`），避让循环永不终止。本批测试夹具一度因此挂死。修法是在调用侧保证节点带几何信息（测试已照此修正），或给 `math.js` 补默认值兜底——后者属于**改在用核心文件**，须单独成批并经授权，本批不动。

## 5. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批**落地不接线**，运行时行为零变化。
- 未提交、未推送。
- `storyReplicationReviewLayout` 的**拖拽分会话**（pointerdown → `beginWorkspaceHorizontalResizeSession`）离线不可验（需要真实指针事件与窗口监听），本批只覆盖键步进与页签漫游；真机验收时补。
- 首波余量：**230 件**（`src/modules` 余 19、`src/core` 36、`src/components` 61、`src/manifests` 20 等）。

## 6. 证据文件

`deobf-tools/b130/port/`（10 件 prettier 产物）；回归证据 `b130-src-raw.tap`、`b130-src-raw.err`、`b130-fails.txt`、`b130-api-raw.tap`、`b130-gate.txt`。
