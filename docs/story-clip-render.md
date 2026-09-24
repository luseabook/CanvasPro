# 第十五批：镜头视频顺序初剪 → 原本地渲染

更新：2026-09-23。R05 的有限成片链路增量。**源码已接入，未运行验收；没有实际生成成片。** 不重建原 `media-clip` 时间线、FFmpeg渲染器或导出菜单，也不将第十一批XML工程冒称渲染影片。

> 第16批补充：原任务中心已接显式taskId查询/独立结果取回，见 `media-task-recovery.md`。同时让原mediaTaskService跳过storySequenceExport通用状态回写，避免绕过本专题画布守卫。没有改变原渲染器，也未运行验收。

## 第18批续接说明

本文以下记录第15批v1视频初剪的原边界。第18批已在同一UI/工程/渲染链路新增**逐镜显式已采纳图片/视频 + 可选一条本地音轨**，见 `story-clip-media.md`；当前菜单文案也已更新。图片hold与音轨起点/入出点/音量/静音会被来源守卫和宿主预检核对，新建初剪采用v2标记，旧宿主明确拒绝；已有v1视频默认行为保留。未运行验收，不把新源码当作已渲染成片。

## 范围与使用路径

1. 沿第十二至十四批人工采纳本镜视频，得到本地 `source-video`；加载原素材节点的时长元数据。
2. 工作室 → 镜头媒体 → **已选镜头视频 → 初剪预览** 或 **本集全部视频 → 初剪预览**。选择顺序始终来自当前单集镜头顺序，不使用勾选先后或画布坐标。
3. 预览逐镜路径、素材记录时长、分镜计划时长和可编辑入/出点。默认使用完整素材记录时长，**不自动套用计划时长、拉伸或截掉超长部分**。缺视频、过时提示词、来源/首帧变化、未知时长等逐镜显示错误，不静默跳过。
4. 明确确认应用全部草稿并建立原剪辑节点及连线。此步不读媒体文件、不探测FFprobe、不渲染、不调用AI。一次1–60段，合计不超过3600秒；每段至少0.1秒，每集最多保留6个本批初剪节点（超过请先整理旧版本）。既有媒体批次选镜仍上限6；“本集全部”另有60段限制，不改变生成队列上限。
5. **关闭并定位初剪**。原剪辑里可调整每段入出点；本批保持镜头顺序、数量和来源，只用视频原声，不接受拆分/增删片段、重排、空隙、重叠、变速或BGM。若要改变镜头列表/顺序，回工作室重新预览建立新版本；普通未标记剪辑节点保留原有能力。
6. 从原整段导出菜单选择“加入画布”或“导出”，再次确认镜头、路径、范围、总时长和本地渲染行为。**需要加载本批源码的桌面进程**；浏览器不回退到未知后端。旧桌面不认识新任务种类时明确失败，请更新对应源码桌面端并重启，不改只读安装版。
7. 桌面逐段解析本地来源并用原FFprobe元数据函数检查视频流、有限时长与出点，然后才进入原 `mediaClipExport` 渲染器。全部通过后沿原输出命名和 `ClipVideo` 目录生成新MP4；缺文件/晚一段越界不当作部分成功。
8. 成功后原菜单可创建独立 `source-video`，保存生成时镜头来源记录；工作室媒体页显示初剪及成片定位入口。仍需原工程保存和保留媒体文件。“导出”模式沿原下载入口，不自动创建画布结果节点。

本批只支持已采纳的本地 MP4/MOV/WebM/MKV/M4V/AVI，不接受远程、绝对路径、编码/查询片段路径、图片代替缺视频或外部音轨。模型目录/账号失效不阻止已有本地视频初剪；不发生AI/云端生成调用。

## 核实并复用的原契约

- `MediaClipNode._syncFromStore` 按入边的 `createdAt/id` 收集素材；已有 `normalizeMediaClipState` 匹配 clip ID/来源ID/路径并规范化范围。因此创建使用稳定逐镜edge ID和明确顺序，并复核规范化没有改动入出点。
- 原 store 的 `batch(callback)` 推迟通知，不是回滚事务。新节点、全部入边、工作室草稿一起批量通知，避免节点先挂载但还没有完整连线时重置范围；之后一次history commit。完整草稿、画布对象身份、基础签名、所有ID及来源先预检，失败不开始写入；不承诺store内部异常后的自动回滚或磁盘原子保存。
- `buildMediaClipExportPayload` / timeline manifest 继续构建原导出内容。标记初剪复核实际payload与保存的镜头、范围相符，再白名单生成桌面请求，绝不复制节点密钥、服务URL、任意参数到渲染请求。
- 原 `electron/mediaTasks/mediaClipExportTask.js` 保持不变：多段按首段视频尺寸缩放/补黑边，以原帧率取整/默认策略统一，H.264/AAC；混合有声/无声时给无声段补静音，全无声输入可无音轨。不承诺无损、帧精确、所有编码/旋转/VFR均正确。
- 新 `storySequenceExport` 任务只是原渲染器前的严格预检入口，复用原解析器、FFprobe、任务队列与原handler。独立种类使旧桌面拒绝，而不是忽略一个新flag后绕过预检。
- 未增加IPC/preload接口或开放远程渲染代理。原 `mediaTask:enqueue/list/onUpdate` 仍是调用路径；本批请求限定kind、nodeId、首路径及最多60个 `{src,kind,start,end}` 片段与总时长。

## 来源、异步与结果保护

- 原剪辑节点保存 `storySequence`：版本1、节点/工作室/单集ID、建立时完整镜头ID顺序、所选视频的节点ID/本地路径/resultKey/文字来源/记录时长/可选首帧来源、edge ID。没有自动发送授权。
- 原渲染组件捕获所属画布对象。导出开始前拒绝已离开原画布的旧组件；即使另一画布恰有相同节点ID也不借用。之后在等待一帧后、任务返回后、结果写回前再次核对来源和入出点。
- 单集新增/删除/重排镜头、所选关联/提示词/路径/resultKey/记录时长变化、入边缺失或额外输入、时间线变化都会拒绝继续或拒绝自动写回。不悄悄导出原normalizer裁掉的片段，也不静默插入新镜头。
- 每次明确整段导出重新渲染；标记节点不复用原 `lastOutput` 路径缓存。新确认不是任务去重，也不是取消/重试授权。未标记普通剪辑仍沿原缓存与导出行为。
- 成片来源 `storySequenceOutput` 保留生成时记录，后续修改镜头不自动更新/覆盖旧文件。工作室列出成片定位；不冒充逐镜mediaRefs，亦不自动替换镜头视频。
- 如果文件已返回但画布、来源或范围发生变化，不向新画布添加结果或写旧剪辑状态。显示独立恢复对话框，路径可选中复制，用户回原画布核对/导入；没有使用Electron不可靠的 `window.prompt`。
- 新任务等待器先订阅事件、再读取原任务列表，处理“入队响应前已失败/完成”的空窗；只核对相同taskId，终态清监听器。列表读取失败继续等事件到超时，不自动重发。超时提示taskId，**不会自动取消宿主任务**。
- 已排队/运行的本地任务可能在关闭编辑器、切画布、等待超时后继续。刷新、退出或崩溃后的状态/结果恢复仍依赖原宿主任务与文件，不新增持久任务日志或自动恢复；别因界面没返回就再次渲染。

## 存储与事实边界

工程保存沿原serializer保留初剪、边、成片来源；没有新增默认自动保存。应用/history不是磁盘回执，真实保存重开尚未验收。

素材记录时长仅用于预览，**不是文件探测结果**。真实导出时才执行原FFprobe；使用其返回的容器/流时长信息做范围检查，不证明帧边界精确。路径不冻结文件字节；检查后文件被覆盖、源文件在渲染中变化仍可能影响结果。无自动备份/哈希/打包；失败目录或部分文件遵循原任务行为，不额外清理。

未完成：图片/BGM/配音混排、复杂轨道/转场/字幕、统一规格细化、剪映工程、完整持久任务日志、全新版能力及真实成片验收。第16批已接当前宿主内存记录的跨画布显式独立取回，不恢复镜头关系、不等于持久恢复。R01–R26范围保留。

## 文件与验证

新增7个源码/测试：
- `src/modules/storyWorkspace/storyClipModel.js`、`storyClipModel.test.js`
- `src/modules/storyWorkspace/StoryClipPreview.js`
- `electron/mediaTasks/storySequenceExportTask.js`、`storySequenceExportTask.test.js`
- `api/storyClipTaskWait.js`、`storyClipTaskWait.test.js`

修改6个源码：
- `StoryWorkspaceEditor.js`、`StoryMediaPanel.js`
- `src/components/MediaClipNode.js`、`src/components/media-clip/mediaClipExportController.js`
- `api/localMediaTaskApi.js`
- `electron/mediaTasks/registerSharedMediaTaskHandlers.js`

合计13源码/测试，另本文+3份交接/专题更新，共17交付文件。主源码检查点 `42774630797e92e63de4f0ce5c317b2a5e73b76f`；审阅 `39bfa7e491e9576c50cb1f89e0b9e595904d8690`、`bd67e2a8d63982496dc8aa01f471f0be814fda20`、`c460e3e749eb1ffedcd2268b0e06907eeeb31798`，不是提交/发布。

实际仅做22个相关JS的语法及直接相对导入存在性检查，exit0；已有工作室/组件/API/媒体任务error诊断0，未主动编译。新增 **52项测试源码**：36项模型/来源/应用/guard/保存（21直接+15表驱动）、10项宿主预检/原参数构建、6项等待器；**均未执行**。未运行FFprobe、FFmpeg、应用、测试、构建、安装、文件探测/渲染/导出/保存重开或云请求。

待授权离线命令（只测试源码/mock和原参数构建，不调用FFmpeg/厂商；本批未执行）：
```powershell
node --test src/modules/storyWorkspace/storyClipModel.test.js electron/mediaTasks/storySequenceExportTask.test.js api/storyClipTaskWait.test.js src/modules/storyWorkspace/storyWorkspaceApply.test.js src/modules/storyWorkspace/storyMediaModel.test.js
```

待另行授权验收：节点挂载/元数据就绪、入出点保留、首段及混合规格/音轨、缺文件/晚段失败、旧桌面拒绝、真实队列事件先后、取消/超时/切画布/同ID跨画布、结果恢复对话框、原下载与加入画布、普通media-clip回归、工程保存重开。静态检查不等于全部传递依赖可运行；旧图片测试缺 `tests/testPreviewDom.js` 的历史问题仍未解决。
