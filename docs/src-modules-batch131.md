# 第 131 批：首波第四批（素材拖拽、倒放播放、提及编辑、保存控制、缩略图与背景任务等 10 件）

> 第 127 批首波 260 件里的第四批，沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **74 310 B / 1 752 行**；测试 10 个同名件共 **58 928 B / 1 713 行**、**59 例**。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | --- | --- | ---: | --- |
| `storyWorkspace/storyAssetDrag` | 3325/89 | f52d8ca0fdf3 | 6 | 4798/158 |
| `personReplacement/personReplacementShotCutPlaybackController` | 6271/162 | 07e9d1fcb56a | 6 | 5829/190 |
| `promptMentionSelection` | 5783/126 | 3ad6f08cc2c7 | 5 | 6757/218 |
| `personReplacement/personReplacementAssetLibraryInteraction` | 6275/165 | ed82eba08bf4 | 6 | 5291/179 |
| `canvasProjectSaveController` | 6779/170 | e48df243b3a5 | 6 | 4793/137 |
| `storyboard3d/assetThumbnailRenderer` | 6812/153 | b3483c5e4c68 | 6 | 4652/129 |
| `storyWorkspace/storyWorkspaceInteractions` | 6702/159 | 1aa89eae2166 | 7 | 4809/101 |
| `workspaceSelects` | 9301/204 | 36d479176c36 | 5 | 8210/231 |
| `storyWorkspace/storyBackgroundTasks` | 10446/255 | 014fc01d6347 | 7 | 6182/179 |
| `personReplacement/personReplacementPageTransitionController` | 12616/269 | 8a126b452167 | 5 | 7607/191 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`storyAssetDrag`**：拖拽写入会把素材 id 去空白，把索引规范为非负整数，并设置 `effectAllowed='copy'`；无 `setData`、空 id 或 `setData` 抛错时返回 `false`。读取同样去空白，非法索引归零；识别时优先看数据，其次看 `types`。提示词落点只在编辑区内的文本节点成立，落在 `.ref-pill` 上返回 `null`；激活落点会聚焦编辑区、清空旧选区并载入新 Range。
- **`personReplacementShotCutPlaybackController`**：编辑器未打开时启动失败。原生播放只在视频确实在播放时用 `requestVideoFrameCallback` 或动画帧持续采样并同步进度。倒放会暂停原视频、静音，按时间线总长夹取起点；非倒放片段、来源已切换或播放结束时交回预览；倒放片段持续写 `currentTime` 并发布时间线位置。`stop` 会取消动画帧、超时和视频帧回调，代际令牌阻止过期回调回写。
- **`promptMentionSelection`**：删除提及在无 `execCommand` 时退化为直接裁剪文本，随后移除 pill 并提交；有 `execCommand` 时先选中 pill/范围，失败则恢复原选区。插入提及在缺 `execCommand`、缺 `createTreeWalker`、已有 `pillKind` 或范围不在编辑区时直接失败。编辑已有 pill 与按 `@` 触发范围插入都先在克隆节点上完成，再统一 hydrate/commit；要求“必须还有其它匹配”却没有时会返回 `null`，提交失败会返回 `false`。
- **`personReplacementAssetLibraryInteraction`**：只接受媒体类型匹配且带有效图片地址或音频引用的已选素材；无效选择给出提示。场景导入要求工作区意图能力已初始化。按 `sourceAssetId + sourceItemIndex` 过滤项目里已有的素材库来源，再在“加入项目”能力可用时走 `ADD_LIBRARY_ASSETS_TO_PROJECT`，否则走 `ADD_LIBRARY_ASSETS_TO_CHARACTERS`。成功后可把新素材从素材卡或详情预览飞入目标页签；外观上传只有在接口返回 `ok` 且预览元素可见时才播放飞入。
- **`canvasProjectSaveController`**：普通保存、本地另存和快捷键保存都先捕获保存事务，再提交或释放。只读项目直接警告并拒绝；未命名或自动名项目打开命名对话框；快捷键保存还要校验当前项目名是否仍在项目列表中。本地另存保存成功才补项目上下文、提示和刷新列表，取消路径不提交事务。保存中状态按并发计数展示；活动画布已切换时不再执行依赖旧画布的保存后续动作。
- **`assetThumbnailRenderer`**：缩略图缓存键由素材 id 与来源 URL 组成，命中会刷新 LRU 顺序，默认上限 512；缺 id 或缺图片数据不缓存。内置模型必须命中真实场景素材目录，未知 id 返回 `null`。取景以模型包围盒中心和半径计算相机距离，空几何抛错。渲染器克隆场景后加预览灯光，输出 JPEG data URL；最小画布 96×72，释放时遍历几何与材质并销毁 WebGL 资源。
- **`storyWorkspaceInteractions`**：生成快捷键只认不带 Alt/Shift、非输入法组合态的 Ctrl/Meta+Enter。嵌套滚轮只在剧本工作区指定元素上保留，素材列表可单独捕获/恢复滚动；片段条和提示词历史有专用滚轮处理，后者仅在存在溢出时阻止并消费事件。悬停卡的 id 按 `storyAssetHoverId`、`storyAssetId`、`storyReferenceAsset` 的优先级读取，项目数据优先于传入列表。左右/详情分隔比复用工作区规则；分集面板左栏夹在 14%–34%，中栏夹在 24%–50%，并保证中栏不超过 `76% - 左栏`。
- **`workspaceSelects`**：把原生 `select` 替换为按钮加 `listbox` 弹层，保留原始 select，复制选项文本、value、禁用态与缩略图；缩略图加载失败会移除图片。弹层按可视窗口调整宽度、上下方向与最大高度，键盘导航复用工作区菜单控制器。原生 `change` 或外部同步会刷新触发文本和 `aria-selected`；打开时聚焦当前项，关闭时可恢复触发器焦点；`destroy` 会移除监听并把原生 select 放回原位置。
- **`storyBackgroundTasks`**：任务按类型和排序后的 scope 生成稳定 id；未知状态回落到 `running`，时间戳、批次进度、远端 id、恢复载荷等统一归一。持久化保留全部活动任务，另按更新时间最多保留 60 个终态任务。同 id 启动会替换并置顶；终态任务重新进入活动态会清空旧批次与错误；批次更新只改活动任务；中断默认跳过“可恢复且有远端任务 id”的任务。摘要按批次 id 去重，不把同批任务重复计数。
- **`personReplacementPageTransitionController`**：构造必须提供根节点、过渡键、剪辑编辑器状态与重渲染四个适配器，返回冻结 API。它会记录步骤、素材页签或剪辑编辑器动作的焦点，并在页面切换后按稳定键恢复。切换会同步工具栏类名、步骤属性、侧栏 HTML 和素材页签状态；素材列表/内容区域可做定向过渡；关闭导致页面未提交时，重渲染会延后到稳定后执行，避免丢状态。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| prettier（`prettierrc.json`） | 20/20 通过 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **59 / 59 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7138 / 7095 / 43** |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0 |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

本批同时纠正了回归总数口径：第 130 批原始 TAP 是 `7079 / 7036 / 43`；本批新增 59 例后应为 `7138 / 7095 / 43`。此前台账里的 `7139 / 7096` 是把目录自动发现时额外收进的 1 个非 `*.test.js` 文件算进了总数。新脚本按目录分别执行 `**/*.test.js`，文件集合与 b85 基线一致，不再混入额外测试。

回归脚本首跑曾因把全部测试文件路径塞进 Windows `spawnSync` 参数而报 `ENAMETOOLONG`，测试本身未启动。改为在两个目录内由 Node 展开 `**/*.test.js` 后稳定完成。测试文件首跑也有测试侧断言问题，改正后 59/59 全绿，未改移植实现。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- WebGL 缩略图使用假 renderer 覆盖调度与生命周期，真实 GPU 输出未验收。
- 页面过渡、弹层定位、拖拽飞入、视频帧回调等依赖真实浏览器布局与媒体元素；离线测试只覆盖可注入的 DOM/媒体替身。
- 未提交、未推送。

## 5. 下一批口径

首波 `src/modules` 还剩 9 件：`audioVoicePanelSegmentEditing`、`canvasCommands/editingCommands`、`collaboration/collaborationPanel`、`personReplacementShotCutInteractionController`、`personReplacementShotSelectionRendering`、`runninghubAiApp/rhAiAppConfigRepository`、`whiteboard/whiteboardBackgroundInput`、`whiteboard/whiteboardLayerTransform`、`workspaceAssetPresentation`。第 128–131 批累计落首波 40 件、222 例；首波余 220 件，其中这 9 件属于 `src/modules`。

## 6. 证据文件

`deobf-tools/b131/port/`（10 件格式化产物）；回归证据 `b131-src-raw.tap`、`b131-src-raw.err`、`b131-src-fails-raw.txt`、`b131-failure-comparison.json`、`b131-api-raw.tap`、`b131-api-raw.err`、`sweep-raw.mjs`。
