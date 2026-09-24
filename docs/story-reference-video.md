# 第十四批：已采纳图片 → 原生首帧视频

更新：2026-09-23。R04 的有限单镜增量，**源码已接入，未运行验收**。不等于全模型图生视频、后台媒体队列或R01–R26完成。

## 已核实范围

只开放已有 RunningHub **modelApi** 模型 `runninghub-model/seedance-2.0`，不是 RunningHub workflow。

- 原 manifest：`vendorVideoModelApiManifests.js`；execution `runninghub.model-api.video.seedance-2.v1`。
- 原参数 `generationParams.rh_seedance_2_mode = image2video`，原固定槽 `firstFrame`；Fast / Standard 仍由原控件选择。
- 原 execution 的 `extensions.bodyResolver = runninghubSeedance2Video`、`endpointResolver = runninghubSeedance2VideoEndpoint`。
- 原解析器 `api/adapters/modelApiResolvers/index.js` 要求图生视频恰好一张图片，转换为 `firstFrameUrl`，使用原图生视频路由。本批没有新建URL、账号或厂商请求适配器，也没有改原 manifest / resolver。
- 创建及每次发送复查以上契约。模型失效不自动切换；旧本地结果的来源核对/采纳不依赖模型目录可用。

## 用户路径

1. 先沿第十二批生成并人工采纳本镜图片，得到独立 `source-image`。仅支持本镜、当前图片提示词、受支持本地原图路径；不自动从人物库、场景库或其他镜头取图。
2. 工作室 → 镜头媒体 → **已采纳图片 → 首帧视频**，下拉框默认不选择。明确选择已采纳图，可先用原定位入口查看图片。
3. 点击 **应用并建立首帧视频（不发送）**。确认展示图片节点ID、本地路径、模型及现有视频任务数量。应用全部草稿，创建标准 `ai-video` 和原生 `sourceId/targetId/refSlot:firstFrame` edge；本镜视频任务上限仍为6个。
4. 关闭并定位原视频节点，核对原账号、Fast/Standard、分辨率、时长、比例、音频等参数及价格，再点击原普通生成按钮。
5. 有本批来源标签的节点会再次确认图片上传/厂商发送及可能费用。取消即返回；预设覆盖不被此链路接受。确认内容是已存常用参数/原默认回退，不是完整API请求或实时账单报价。
6. 结果返回后重新进入工作室刷新，人工选择本地视频并采纳/应用，最后使用原工程保存。来源图已换、图提示词已改或原图路径不符时不采纳旧任务。已采纳视频保留生成时首帧记录；之后换图只提示，不删除/替换旧视频。

本批不加入第十三批的纯文字串行批次。普通建图/建视频和原1–6镜文字批次仍不暗加参考图。

## 来源、发送与失败保护

- `storyMediaReference: {version:1, slot:'firstFrame', imageNodeId, localPath, resultKey}` 随原视频节点保存。只复制白名单来源信息，不从图片节点复制密钥、服务地址、任意参数或上传URL。
- 采纳视频的 `storyMediaResult.referenceImage` 保留相同的白名单首帧来源。它是来源记录，不是第二条自动请求输入。
- 核对图片 `src/localPath/originalLocalPath`，并调用原 `resolveGenerationInputImageUrl` 核对实际生成输入；不把缩略图当原图。正常 display/thumb 派生字段变动而实际原图不变时可保留。
- 建图连线与草稿同一次 apply：检查画布对象身份、工作室基础签名、完整草稿、新节点和edge ID碰撞、来源及唯一首帧关系，全部预检后再写；一次 history commit。只接受一个本批首帧节点/edge，不提供任意图编辑API，也不混入文字批次。
- 原 `_onGenerateImpl` 的窄接入只针对带本批标签的节点：确认前校验；原异步配置/授权及payload准备后再校验；`submitTask` 内真正调用原 `generateVideo` 前再次校验。
- 校验当前工作室/单集/镜头、视频提示词、当前已采纳图片、resultKey及实际原图路径、模型/图生模式、唯一入边与槽位。拒绝额外边、素材引用、富文本素材标签、实际payload中的额外媒体/槽位或被替换的提示词/参数。
- 费用相关常用参数在本次确认期间比较。保留原随机seed行为；如果原自动比例派生等使payload与确认值不符，拒绝并提示在原节点选明确参数/固定比例后再确认，不静默放行。
- 每个确认对象只允许一次原 `generateVideo` 调用，回调重复执行会拒绝。**这不是厂商账单幂等、HTTP内部重试控制或持久化防重**。用户再次手动生成会重新确认，仍可能再次计费；停止/超时/关闭不保证取消。
- 最后一次校验位于原任务提交回调，原本地任务状态可能已经开始；拒绝时由原失败处理接管，不可把本地状态误当厂商提交回执。请求一旦进入原API，后续来源变更不保证厂商取消。
- 未标记普通节点、原账号/授权检查、原HTTP上传/生成/查询/恢复接口不改；没有自动调用生成、自动采纳或自动保存。

## 保存及限制

来源标签和edge沿既有工程序列化保存；guard及确认授权只存在当前调用内存，不保存为可恢复的发送授权。工作室应用/history不是磁盘保存回执；手动原生成入口不新增“发送前磁盘检查点”。文字队列的保存失败/恢复语义保持原样。

只验证本地虚拟路径和来源记录，**不检查文件存在、不复制/哈希/冻结文件字节**。同路径文件被外部覆盖无法由本批发现；需保留/备份工程和原媒体。远程图片、blob/data/file及不受支持的本地路径不支持。此保护针对正常UI流程，不是防止用户手改工程JSON或第三方代码的安全沙箱。

未支持首尾帧、多图/全能参考、任意模型、批量参考图视频、人物/场景素材批量、远程落地、跨画布后台调度、自动成片。下一条链路优先按镜头顺序复用原 `mediaClipExport`，不是继续扩展XML清单或重造已有渲染。

## 文件与实际验证

新增：
- `src/modules/storyWorkspace/storyReferenceVideo.js`
- `src/modules/storyWorkspace/storyReferenceVideo.test.js`

修改：
- `StoryMediaPanel.js`、`StoryWorkspaceEditor.js`：显式选择/确认/状态/原节点定位。
- `storyMediaCanvas.js`：原工厂、模型资格、结果首帧来源。
- `storyWorkspaceApply.js`：节点+唯一首帧edge同步预检/应用。
- `src/components/video-node/taskOrchestrationModule.js`：标记节点专用确认与发送复核。

共7个源码/测试文件；另新增本文、更新handoff/续接提示/媒体专题，共11个交付文件。主源码检查点 `917c2f14d8c730b79d10f8bc0549731872f2c4c2`；审阅检查点 `d6a845fafb4b23aef863b268f9380091cab2f8cb`、`c689b67e41f06bffde8f64782926557d3ffb86d0`。这些是工具检查点，不是提交/发布。

实际仅执行目标机15个相关JS的 `node --check`、直接相对导入存在性检查，均通过；既有工作室/video-node编辑器error诊断0，未主动编译。新增 **33项测试源码**（16个直接用例、17个来源变更表驱动用例），**均未执行**。覆盖真实manifest/body/endpoint resolver、本地首帧、异步空窗来源变更、参数/payload变化、单次确认、防混批、apply预检及原sanitizer的JSON往返。

待授权离线命令（本批未执行，无真实模型请求）：
```powershell
node --test src/modules/storyWorkspace/storyReferenceVideo.test.js src/modules/storyWorkspace/storyWorkspaceApply.test.js src/modules/storyWorkspace/storyMediaModel.test.js
```

15项静态检查不等于所有传递依赖可执行；第十三批记录的旧图片测试 `tests/testPreviewDom.js` 缺口仍在，未伪造或补假夹具。未运行应用、测试、构建、安装、媒体上传、付费生成、采纳/工程保存重开或原剪辑渲染。

待运行验收必须另行授权：真实UI默认参数与DOM、首帧连线显示、Fast/Standard原路由、确认取消、准备中切画布/换图/改参数、原task回调失败UI、重复手动生成与原HTTP重试、图片实际上传及费用、视频落地/采纳/保存重开、原普通节点与文字批次回归。
