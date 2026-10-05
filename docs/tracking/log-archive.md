# 会话日志归档

> 由 `docs/TRACKING.md` §9 第 4 条维护：TRACKING.md §11 只保留最新 10 条，挤出来的旧日志移到这里，最新的在上。
> 只追加，不改写已有内容。


- 2026-10-05（161 批·剩件可行性判定，落 1 件）：b157 回滚的 12 件整体落净增 **67**（是真规格变更，非闭包掩盖）、13 件新候选净增 **33**。**教训**：只跑同名测试的 add-one 会**假阴性**，探测集须并入交叉文件。仅 `videoActions/removeAction.js` 15 文件 0 失败、全量 **11193/11190/3** 一致；孤立 **201→200**。**逐件接线已到极限**。见 `docs/b161-consumer-upgrade-sweep.md`。

- 2026-10-05（159 批·去混淆收尾之二）：补 158b 两块漏项——① 单半字节十六进制（`0x0`–`0xf`）原被当位模式豁免、全仓剩 24,300 处，代码自身即反证（十/十六进制混排、`[0xf, 30]` 并列），改为**一律还原**；② 改写器 `scan()` 判嵌套模板闭合用绝对层级，内层 `${…}` 永不归零、吃到文件尾（13 件命中、2 件漏改，**只漏改不改错**），改相对计数 + 8 例回归测试。落 **1,085 件**（转义 83 + 十六进制 24,169），1,085/1,085 校验 PASS、全量 11193/11190/3。`vendor/` 与受保护件排除。见 `docs/unescape-normalization.md`。

- 2026-10-05（158 批·版本重定基线 + 去混淆收尾）：应用已升 **0.8.0**；镜像重取（1952 件 / 0 失败），同法反混淆后比 0.7.16：**+184 新增、0 删除、455 件有变**；仓库对 0.7.16 已 0 缺失，0.8.0 的 184 新件一件没有，**156 批待裁决项作废**。同批清掉转义 24,625 处与十六进制 6,680 处（**1,162 件**），1,189/1,189 校验 PASS、全量 11185/11182/3。注：「7,102→422」是"≥2 位"口径，"原生受保护件计数全为 0"已被 159 批推翻。**基线裁决（160 批记录）：用户选择维持 0.4.12 基线继续接线，暂不切 0.8.0。**

- 2026-10-04（157 批·脏件批）：27 件脏件全过机械工序，27 件全落地后 70 例失败 → 逐件归因＋补测，回滚 12 件（taskOrchestrationModule 与 AIGenAudioNode 各 12、SourceVideoNode 8、modelApiResolvers 7、projectLifecycle 6 等），**落地 15 件**。孤立 269→**201**（接通 80，含 renderer 12 个 renderer* 与 agent 15 件；另 12 件被 0.7.16 淘汰转孤立）。483 口径 403/1238。全量 11185/11182/3 零回归。

- 2026-10-04（156 批·manifests 层侦察）：11 件纯新增候选全过机械工序，闭包对 modelRegistry + vendorVideoModelApiManifests 已在批内闭合、裸导入全通过。但 10/11 属规格变更型——接通 0.7.16 模型 manifest 后 api 域 67 例断言 0.4.12 旧规格失败（baseline 1000/1000 全绿）。最终只落 `api/errors/ErrorParser.js`（+3 解析器、0 失败），孤立 272→**269**（累计 99）；全量 11185/11182/3 零回归。余 10 件待裁决是否采纳 0.7.16 模型规格。〔2026-10-05 注：该裁决项已因安装版升级到 0.8.0 而**作废**，见 `docs/b158-version-rebaseline.md`。〕

- 2026-10-04（154 批·接线第 5 小样）：升代授权目录 gain≥2 干净件 13 取 11（AssetManager、sceneNodeActions、shortcuts、ImageCrop/FreeAngle/Matting、agent 两件、imageAnnotate/rendering、SourceAudioNode、textGenerationResultRenderer，改名 3999、导出面 0 丢弃），孤立 313→**291**（累计 77；483 口径 445/1238，imageAnnotate 组清零）。resultRenderModule（7）与 previewControlsModule（1）回滚；desktopProjectFileStore 5 例 stash 复核为 HEAD 既有环境失败。全量 11185/11184/0 零失败。
- 2026-10-04（155 批）：干净件 gain≥1 清尾 21 取 17（textToolbar、WebPreviewNode、CanvasTabManager、GenerationHistoryFileManager、canvasNodeFlows、canvasCommands 2 件、clipboard、imagePreview、EdgeController、nodeResizePreview、settings 2 件、textInputContextMenu、ui/rendererUiEvents、services 2 件），孤立 291→**272**（累计 96；483 口径 437）。SourceImageNode、mediaPlaybackRecovery、keying/removeAction 共 7 例回滚。全量 11185/11182/3 基线一致。
- 2026-10-04（153 批·接线第 4 小样）：升代授权目录干净件 7 取 4（MediaClipNode、PanoramaSceneNode、SettingsManager、appPanels，改名 1759、导出面不变），孤立 341→**313**（累计 55；483 口径 461/1238，canvasShortcuts 与 tutorials 清零）。DragController（10 例）、videoToolbar（3）、nodePromptShared（1，aigenImage 连带）行为回归回滚。教训：目录测试须含全部下游子目录。全量 11185/11181/4，回滚后名单与基线一致。
- 2026-10-04（152 批·接线第 3 小样）：升代 api 干净件 10 取 3（imageUploadApi、runninghubWorkflowApi、sceneDetectionApi，落地件改名 231、导出面 0 丢弃），再接通孤立 4 件（368 口径 345→341；483 口径 api 组 4→2 为 472/1238）。7 件行为回归回滚：ModelApiManifestNormalizer 50 例、aiImageApi 38、aiVideoApi 9、resolvers/index 7、aiTextApi 6、providerConnectionTestApi 6、aiAudioApi 1——api 域新代含密集真实行为变化，回归密度远高于 core/commands。全量 11185/11182/3 与基线逐条一致。

- 2026-10-04（151 批·接线第 2 小样）：升代 `src/core` 干净件 6 取 5（rendererResizePreview、viewportFocus、viewportPanPreview、stores/legacyKernelStore、stores/facadeStore，改名 1092、导出面不变），再接通孤立 11 件（368 口径 356→345；483 口径删 previewCommitSession 为 473/1238）。generationTaskRuntime 自身测试回归已回滚。发现既有雷：stores/runtime.js 与 legacyKernelStore 循环导入、直连入口 TDZ（HEAD 同挂，非本批引入）。全量 11185/11185/0，基线 3 个 installerSafety 失败本轮未复现（偶发），改动相关新增 0。

- 2026-10-04（150 批·接线小样）：实况核查证明 433 条接线边无一可「只补 import」，真动作是升代在用消费方（`docs/wiring-reality-check.md`）。小样 5 件：落地 2 件（canvasCommands/index.js、scene3dBridge.js，改名 828、导出面不变）接通孤立 12 件（368→356；483 口径删 9 件）；taskOrchestrationModule.impl（16 例）与 uiModule.impl（3 例）行为回归回滚；vendorVideoModelApiManifests 受依赖闭包约束不可单件。全量 11185/11182/3 与基线逐条一致，零新增。专题 `docs/b150-consumer-upgrade-pilot.md`。

- 2026-09-29（暂停跟踪）：提交并推送 `4c3bc6c` 后，按用户要求停止 watcher PID 14788，取消 `.vscode/tasks.json` 的 `folderOpen` 自动启动，并在 `AGENTS.md`、本文件写明暂停状态；恢复前不运行任何跟踪登记命令。

- 2026-09-29（恢复跟踪）：按用户要求移除 `AGENTS.md` 与 `docs/TRACKING.md` 的暂停说明，恢复 `.vscode/tasks.json` 的 `folderOpen` 自动启动；已执行 `--by session-start` 补记暂停期间 #0134，并恢复自动监视进程。

- 2026-09-29（141 批）：继续清 `src/components`，落地图像执行 owner/表现层/object URL/输入需求/RunningHub 控件/UI schema 适配器、媒体片段预览/时间线编辑/视口控制和生成显示策略 10 件 + 10 个测试共 37 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑 29/37，修正 8 处测试侧预期后 37/37 全绿。src 7426/7383/43、api 791/791/0。专题 `docs/src-components-batch141.md`。

- 2026-09-29（140 批）：继续清 `src/components`，落地视频区间时间线、生成错误卡、自定义 AI Logo、悬停视频播放生命周期、mention 菜单、随机种子策略、UI schema 可见性签名、视频节点自适应比例、画布标注表面和源视频上传媒体等 10 件 + 10 个同名测试共 37 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑后修正 2 处测试侧状态或默认值预期，37/37 全绿。src 7389/7346/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-components-batch140.md`。
- 2026-09-29（139 批）：继续清 `src/components`，落地视频倒放、图像本地编辑、提示词展开动画、源视频手动播放与反馈、模型菜单绑定、OpenAI 图标、参数组、音频参考槽和视频底栏壳等 10 件 + 10 个同名测试共 28 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑后修正 4 处测试侧顺序或前置状态，28/28 全绿。src 7352/7309/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-components-batch139.md`。
- 2026-09-29（138 批）：继续清 `src/components`，落地选择状态、语音动作、媒体保存反馈、音频 workflow 输入与参数、缩略图 object URL、项目图标、旧比例弹层和提示词浮层宿主等 10 件 + 10 个同名测试共 28 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；修正 2 处测试前置状态后 28/28 全绿。src 7324/7281/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-components-batch138.md`。
- 2026-09-29（137 批）：开始清 `src/components`，落地媒体卡顿/播放固定/拖拽会话、字段覆盖、槽位标签、视频转 GIF、全屏浮层、视频节点更新性能和 RunningHub 开发模式绑定等 10 件 + 10 个同名测试共 24 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑 5 件缺实现并在补齐后修正 3 处测试侧假设，最终 24/24 全绿。src 7296/7253/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-components-batch137.md`。
- 2026-09-29（136 批）：收尾首批 `src/core`，落地边路径、生成任务协议、渲染桥、媒体槽、生命周期性能和选择快速路径 6 件 + 6 个同名测试共 15 例，落地不接线。闸门 6/6、prettier 12/12、`node --check` 12/12、bare 6/6、消费方 0；首跑 15/15 全绿。src 7272/7229/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-core-batch136.md`。
- 2026-09-29（135 批）：继续首批 `src/core`，落地视口、任务、状态与图变更 10 件 + 10 个同名测试共 26 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑 6 例测试侧问题改正后 26/26 全绿。src 7257/7214/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-core-batch135.md`。
- 2026-09-29（134 批）：继续首批 `src/core`，落地 10 件（节点几何覆盖、光栅绘制表面与计划、3D 工程状态、渲染呈现订阅、媒体选区数学、节点几何预览、节点字段订阅、旋转数学、模型菜单偏好）+ 10 个同名测试共 25 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑 3 例测试侧问题改正后 25/25 全绿。src 7231/7188/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-core-batch134.md`。
- 2026-09-29（133 批）：首批 `src/core` 落地 10 件（生成执行策略、节点编辑提交、生成任务错误态、节点删除事件、渲染提交提示、视口屏幕帧、跳变检测、提交闸门、节点编辑交互、渲染选择器目录）+ 10 个同名测试共 21 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0；首跑 3 例测试侧问题改正后 21/21 全绿。src 7206/7163/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-core-batch133.md`。
- 2026-09-29（132 批）：落地第五批，清零 `src/modules` 候选 —— 再取 9 件（语音片段编辑、画布编辑命令、协作面板、人物替换镜头切口交互与选择渲染、RunningHub 配置仓库、白板背景输入与图层变换、工作区素材呈现）+ 9 个同名测试共 47 例，落地不接线。闸门 9/9、prettier 18/18、`node --check` 18/18、bare 9/9、消费方 0；首跑 14 例测试侧问题改正后 47/47 全绿。src 7185/7142/43、api 791/791/0，43 项失败与 b85 逐条一致。专题 `docs/src-modules-batch132.md`。
- 2026-09-25（第十二次）：按用户「git更新推送」指示做分组提交与推送，第 122 批全部入库。
  - 4 条提交：`74270ca` 第 122b 批 6 件源码 + 6 个测试、`dd8cdde` 第 122c 批 7 + 7、`cf431d9` 台账与专题文档 6 件、`0231658` README 删原作者联系方式一节（用户手改，本次一并提交）。`api/freeImageHostApi.js` 未被任何提交触及，MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
  - 推送前复核：13 个新测试文件离线全绿（119 例通过、0 失败，与 122b 的 46 加 122c 的 73 吻合）；该目录全部 JS `node --check` 通过；新文件里没有绝对开发路径、MCP 地址或密钥，命中的 `apiKey` 都在早先已提交的测试里且值是假串。
  - 推送目标由用户在两个后果之间选定：`master` 与 `port/batches-1-122a` 都推到 `0231658`。推 master 会触发 `.github/workflows/mac-arm64-build.yml`（构建后 `gh release upload v0.4.12 --clobber` 覆盖既有 macOS 资产），后果已当面说明；本机 `gh` 不可用，构建是否被触发**未核实**。
  - 本次未跑 sweep、未启动应用、未做真机验收；改动只涉及入库和文档，没有改业务代码。§11 最旧一条移到 `docs/tracking/log-archive.md`。
- 2026-09-25（第十一次）：交付第 122c 批，`src/modules/storyWorkspace/` 再落 7 个 0 import 件（素材提取草稿的阻断与付费重跑确认闸门、悬停预览、片段视频结果、听不清标记、素材库菜单浮层、大纲导航、提示词引用胶囊），落地不接线；第 122 批完成。
  - 7 件 prettier(镜像)==暂存，与暂存逐字节一致；`node --check` 14/14，prettier 14/14。DOM 件的测试各自内联最小假 DOM，不引入 jsdom。
  - 自研 73 例沙箱和本机首跑全绿；变异抽查 18/18（首轮 17/18，补强 1 例）。src sweep 3670→3743 / 3627→3700 / 43（失败名集合一致）；api 791 未变；受保护文件 MD5 不变；消费方 0 命中。
  - 记下的小坑：引用胶囊占位符两端是私用区字符；切换到另一个 wrap 的目标菜单不会收回前一个；视频结果序号必须传数字。0.7.16 的引用方（主装配 `storyWorkspace` 等）都还没进仓库。
  - 专题文档 `docs/src-storyworkspace-batch122.md` 增 §10–§13；orphans 240→247 / 1009；变更 #0027、#0028；§11 最旧一条移到新建的 `docs/tracking/log-archive.md`。
- 2026-09-25（第十次）：交付第 122b 批，`src/modules/storyWorkspace/` 再落 6 个 0 import 数据 / 逻辑件（分集批量拆分执行、工作区存档快照、摘要运行记录、上传剧本解析、视频风格目录、演示数据），落地不接线。
  - 开工核对：session-start 无变化；本地领先 20 条，比旧 §5 多出的是 `842782e` 台账提交，已在远端分支上。暂存区有前一会话 07:48 留下的 3 个测试草稿（无交接记录），核对后作为底稿采用，原稿备份在 `b122\tests-prev-0748\`。
  - 6 件 prettier(镜像)==暂存，与暂存逐字节一致；`node --check` 12/12，prettier 12/12；自研 46 例沙箱和本机首跑全绿，变异抽查 13/13（首轮 12/13，补 1 例）。
  - src sweep 3624→3670 / 3581→3627 / 43（失败名集合一致）；api 791 未变；受保护文件 MD5 不变；消费方 0 命中。0.7.16 里的 11 个引用方都还没进仓库；`images/story-styles/` 的 94 张缩略图仓库里没有。
  - 专题文档 `docs/src-storyworkspace-batch122.md` 增 §6–§9；orphans 234→240 / 1002；变更 #0024、#0025。
- 2026-09-25（第九次）：经用户授权做分组提交——第 1–121 批遗留的 956 个未提交文件按功能目录切成 17 条 `A.0:` 提交，第 122a 批 27 件和第 122a 收工后的台账各成 1 条，共 19 条；随后按用户指示**只推到新分支 `port/batches-1-122a`**，`origin/master` 仍为 `e12ecd1`，故未触发 mac-arm64 构建（该工作流只监听 master 和手动触发）。
  - 逐批归属先做过测算，结论是不可靠：专题文档互相引用导致命中仅 477/956（49.9%），且 91.6% 的命中文件被多批同时认领，最早认领法把绝大部分文件吸进 2 个批次。按计划预先约定的降级方案改为按功能目录分组，分桶规则与清单可复现。
  - 核对：17 桶逐条 `committed=list` 全等；`git diff --name-only e12ecd1..HEAD` 去重后 956 件全覆盖、无残差；`git status` 为 0/0/0。
  - 受保护件 `api/freeImageHostApi.js` MD5 不变且无任何提交触及；未提交集合内无凭据、无二进制（扫出的 `apiKey`／`mcp-session-id` 字样均为测试假值与文档正文）。
  - 提交期间另一会话交付第 122a 批（变更 #0019–#0021），其 27 个文件未被卷进前 17 条提交，单独成条。
  - 推送走 `http.proxy`（127.0.0.1:7890）；`git ls-remote` 核对远端只有两条分支：`refs/heads/port/batches-1-122a` 等于本地 HEAD，`refs/heads/master` 未变。工作树始终停在 master，未做任何 checkout。
- 2026-09-25（第八次）：交付第 122a 批，`src/modules/storyWorkspace/` 落 11 个 0 import 纯叶，落地不接线。24 件纯叶已全部暂存格式化，按 122a / 122b / 122c 分段。
  - 11 件与暂存逐字节一致，`node --check` 11/11，prettier 22/22；自研 37 例测试沙箱和本机首跑全绿。
  - src sweep 3587→3624 / 3544→3581 / 43（失败名集合一致）；api 791 未变；受保护文件 MD5 不变；消费方 0 命中。
  - 期间用户开始按目录分组提交（`A.0:` 系列），git 计数随之变化；专题文档 `docs/src-storyworkspace-batch122.md`；orphans 223→234；变更 #0019、#0020。
- 2026-09-25（第七次）：交付第 121c 批，`api/story-generation/` 再落 2 件（`storyEpisodeOutlinePlanning`、`storyAssetParallelExtraction`，均为依赖注入工厂），落地不接线；第 121 批至此完成。
  - 2 件过导出闸门，与暂存逐字节一致；`src/domain` 缺失的依赖只在测试里用替身注入，没有落 shim。
  - 自研 34 例测试落地后首跑全绿（沙箱预跑 4 例期望写错，改测试不改实现）；api sweep 757→791（+34）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md` 增 §9–§11；orphans 221→223；git 0/68/884/0 → 0/68/888/0；变更 #0016、#0017。
- 2026-09-25（第六次）：交付第 121b 批，`api/story-generation/` 再落 3 件（`storyAssetRequirementEvidence`、`storyEpisodeScriptTiming`、`storyAssetHybridBudget`），落地不接线。
  - 3 件过导出闸门（HybridBudget 在同段前置件落地后复跑）；27 个导出，与暂存逐字节一致。
  - 自研 47 例测试落地后首跑全绿（沙箱预跑 1 例期望算错，改测试不改实现）；api sweep 710→757（+47）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md` 增 §6–§8；orphans 218→221；git 0/68/878/0 → 0/68/884/0；变更 #0013、#0014。
- 2026-09-25（第五次）：交付第 121a 批，`api/story-generation/` 再落 8 件（第 120 批解阻的 7 件 + 链式解阻的 `storyAssetReferenceContract`），落地不接线。
  - 8 件全部过导出闸门；源码 30 个导出，与暂存逐字节一致；`node --check` 18/18。
  - 自研 82 例测试落地后首跑全绿（沙箱预跑时 2 例测试数据写错，改测试不改实现）；api sweep 628→710（+82）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md`；orphans 210→218；git 0/68/861/0 → 0/68/878/0；变更 #0010、#0011。
- 2026-09-25（第四次）：交付第 120 批，`api/story-generation/` 首批 10 件（8 纯叶 + 2 件依赖 `api/utils/`），落地不接线。
  - 镜像目录实有 32 件（LEAF 10 / OK 2 / BLK 20）；2 个 OK 件过了导出闸门；两个大纯叶留给第 121 批。源码 29 个导出，与暂存逐字节一致。
  - 自研 96 例测试首跑全绿；api sweep 532→628（+96）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合与 `b85-fails.txt` 一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-leaves.md`；orphans 200→210；git 0/68/840/0 → 0/68/861/0；变更 #0007、#0008。
- 2026-09-25（第三次）：交付第 119 批，`api/` 请求响应工具区 7 个零 import 纯叶，落地不接线。
  - 新建 `api/utils/`，落了 strictJson、storyGenerationValues、storySceneIdentity、storyAssetPublicText，另有 `api/` 下 mediaUploadErrors、runningHubWorkflowPollingPolicy、runningHubUploadResponse；共 25 个导出，与暂存逐字节一致。
  - 自研 57 例测试首跑全绿；api sweep 475→532（+57）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合与 `b85-fails.txt` 一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-request-response-utils.md`；orphans 193→200；git 0/68/825/0 → 0/68/840/0。
- 2026-09-25（第二次）：上线全自动跟踪机制。
  - 新增 `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`；`README.md` 顶部加入口提示。（试过在 `.agents/skills/` 放项目技能，MCP 桥不会扫描，已删除。）
  - 新增 `tools/tracking/track.mjs`（零依赖的变更记录脚本）和 `.vscode/tasks.json`（打开文件夹时自动启动监视）；已建立基线并启动监视。
  - 本文件新增 §1.1 常设授权和 §12 变更记录机制；§1、§2、§3.3、§9 相应调整。
  - git：改动前 0/67/820/0，改动后 0/68/825/0。监视进程已自动记下 #0002（入口文件和本文件的改动），端到端验证通过。
- 2026-09-25：通读全项目（1674 个文件）后建立本跟踪体系。
  - 新增 `docs/TRACKING.md`，以及 `docs/tracking/` 下的 project-map、batches、orphans 三份文档。
  - 在 `docs/next-session-prompt.md` 顶部加了一段说明，指向本文件。
  - 没有改业务代码，没有跑测试。
  - git：改动前 0/67/816/0，改动后 0/67/820/0。

- 2026-09-25（第十三次）：交付第 123a 批，`src/modules/storyWorkspace/` 落 7 件依赖已齐的件（片段导出、截帧、输入槽位、分集剧本批量队列、复刻视频上限、剧本改动守卫、缩略图回填），落地不接线。
  - 重跑 deps-ast：OK 8→14、BLK 109→103。14 件过扩展闸门 `b123-gate`（AST 版，补上 verify-exports 漏看的再导出）：10 件通过，4 件缺在用文件的导出，记为受阻；123b 的 3 件已暂存。
  - 依赖世代核对：desktopBridge、videoResultThumbnailApi 与镜像逐字节相同；localMediaPath 等差分 427 次 0 不同；videoFrameCapture 不认 crop、modelRegistry 解析方式不同，测试按本仓行为写并标注。
  - 7 件与暂存逐字节一致，`node --check`、prettier 各 14/14；自研 69 例沙箱和本机首跑全绿，变异抽查 22/22。src sweep 3743→3812 / 3700→3769 / 43（失败名集合一致）；api 791 未变；MD5 不变；消费方 0 命中。
  - 专题文档 `docs/src-storyworkspace-batch123.md`；orphans 247→254 / 1016；变更 #0032、#0033；§11 最旧一条移到 `docs/tracking/log-archive.md`。

- 2026-09-25（第十四次）：交付第 123b 批，`src/modules/storyWorkspace/` 再落 3 件（片段帧数据、片段制作页渲染、工作区工具栏与页脚渲染），落地不接线；第 123 批完成。
  - 3 件在 123a 阶段已暂存、已过闸门；与暂存逐字节一致，`node --check`、prettier 各 6/6。渲染件的测试只断言 HTML 字符串，不引入 DOM。
  - 自研 45 例沙箱和本机首跑全绿（首跑前自查改掉 1 处写错的类名断言），变异抽查 21/21。src sweep 3812→3857 / 3769→3814 / 43（失败名集合一致）；api 791 未变；MD5 不变；消费方 0 命中。
  - 收工后复跑 deps-ast：`storyWorkspace` 又有 3 件新转 OK（待过闸门）；`collaboration` 为 LEAF 13 / OK 4 / BLK 21，是第 124 批的起点。
  - 专题文档 `docs/src-storyworkspace-batch123.md` 增 §8–§11；orphans 254→257 / 1019；变更 #0035、#0036；§11 最旧一条移到 `docs/tracking/log-archive.md`。

- 2026-09-25（第十五次）：按用户「提交推送」指示把第 123 批入库并推送。
  - 3 条提交：`15f780b` 第 123a 批 7 件源码 + 7 个测试、`3622094` 第 123b 批 3 + 3、`7c02833` 台账与专题文档 7 件，随后一条记账提交（本条所在）。`api/freeImageHostApi.js` 未被任何提交触及，MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f`。
  - 推送前复核：10 个新测试文件离线全绿（114 例、0 失败，与 123a 的 69 加 123b 的 45 吻合）；10 件新源码 `node --check` 全通过；新文件里没有绝对开发路径、MCP 地址或密钥。
  - 推送目标由用户再次选定：`master` 与 `port/batches-1-122a` 都推，与上一轮处置一致；后果已当面说明（mac-arm64 构建后 `--clobber` 覆盖 v0.4.12 资产）。本机 `gh` 不可用，构建是否触发与结果**未核实**。
  - 本次未跑完整 sweep、未启动应用、未做真机验收；只做入库和文档，没有改业务代码。§11 最旧一条移到 `docs/tracking/log-archive.md`。

- 2026-09-28（第十六次）：收尾 124a（既有 13 件/121 例复核全绿），交付 124b 冲突处理 1 件 + 36 例；源码与暂存一致，落地不接线，未提交。
  - 124b 沙箱与主机首跑 36/36，变异抽查 15/15；语法 2/2，协作目录暂存格式 28/28；MD5 不变，编辑器现有诊断无错误/警告（非构建验收）。
  - 实跑 src 4014/3971/43，失败名与 b85 一致；api 791/791/0。PowerShell 中文 TAP 捕获损坏后改原始字节重跑确认；未启动应用、构建或真实联调。
  - 专题 docs/src-collaboration-batch124.md；孤立台账 271/1033；Git 0/5/29/0。124c 先做 CanvasBinding，余 5 件待世代核对，R10 服务端未设计。变更 #0042/#0043，最终记录由收工脚本追加。

- 2026-09-28（第十七次）：交付 124c `collaborationCanvasBinding` + 同名 50 例测试，落地不接线。唯一 Journal 依赖过导出闸门且与格式化镜像一致；源码/测试与暂存逐字节相同。
  - 沙箱/主机首跑 50/50；变异抽查 21/21；新增语法 2/2、协作暂存格式 30/30；现有编辑器诊断无错误/警告，MD5 不变。
  - 原始 UTF-8 TAP 实跑 src 4064/4021/43，失败集与 b85 完全一致；api 791/791/0。未启动应用、构建、真实联调或提交推送。
  - 保留并测试内存先于持久化、forget 不删日志、缓存读返回引用等边界；专题 §7。Git 0/5/29/0→0/5/31/0，孤立台账 272/1034。剩余 OK 5 / BLK 18，124d 优先 ChatInput；变更 #0045，收工记录自动追加。

- 2026-09-28（第十八次）：交付 124d `collaborationChatInput` 与 40 例测试，落地不接线。唯一依赖 modalInteractionScope 及其 focusTrap 均与格式化镜像逐字节一致，未改在用件。
  - 沙箱/主机首跑 40/40，变异抽查 21/21；语法 2/2、协作暂存格式 32/32、源码/测试暂存哈希一致；现有诊断无错误/警告，受保护 MD5 不变。
  - 实跑 src 4104/4061/43，失败名单与 b85 完全一致；api 791/791/0。模块名与导出名消费方反查均无命中；没有运行应用、构建、联调、提交推送。
  - 专题 §8 固定快捷动作/指针路径差异、真值回调与点击抑制生命周期。Git 0/5/31/0→0/5/33/0，孤立台账 273/1035。剩余 OK 4 / BLK 18；124e 优先 ReviewDom。新增记录 #0047，收工文档记录自动追加。

- 2026-09-28（第十九次）：交付 124e ReviewDom 与 37 例测试，累计 17 件/284 例，未接线。首跑全绿，后补非 BMP 后缀断言；提及右边界仅查 UTF-16 单码元，非完整 Unicode 词边界。
  - MemberColor 与镜像字节一致；图标工厂/目录字节不同，但 49 组定义、245 组生成树差分一致，未改依赖。语法 2/2、暂存格式及哈希 34/34，变异 23/23；MD5 不变，现有诊断无错误/警告。
  - src 4141/4098/43 与 b85 失败名单一致，api 791 全绿。首个后台验证因 1 秒生命周期中断，保留并恢复副本后完整重跑；非构建/真机验收。
  - Activity、CommentThreads 过导出闸门，NodeReference 缺 resolveCanvasVideoPosterUrl 仍阻塞；124f 先 CommentThreads。Git 0/5/33/0→0/5/35/0，增量孤立 274/1036；记录 #0049–#0050，文档由收工脚本追加。

- 2026-09-28（第二十次）：按用户“提交后继续”先提交 124a–124e，40 件精确入库为 8fafc80，提交前 284/284、语法/哈希 34/34；提交后工作区干净，未推送。随后交付 124f CommentThreads/35 例，仍未提交、未接线。
  - 依赖 ReviewDom 五个导出存在，ReviewDom/MemberColor 与镜像一致，传递图标依赖哈希沿用 124e 未变。沙箱/主机首跑 35/35，变异 19/19；新件语法 2/2，暂存哈希和格式 36/36。
  - src 4176/4133/43 与 b85 名单一致，api 791 全绿；MD5 不变，现有诊断 0 错误/警告。固定孤儿回复空白、重复成员身份差异、渲染时权限和非原子渲染边界，见专题 §10。
  - 累计 18 件/319 例，增量孤立 275/1037；Git 最终 0/6/2/0，ahead 1（本地引用）。124g 先 Activity，NodeReference 仍缺媒体导出；记录 #0052 提交说明、#0053 新件，收尾自动登记。

- 2026-09-28（第二十一次）：按用户“提交推送”及“继续”完成124f本地提交 ba8e9b4（8件）。目标选项被跳过，按已告知保守方案仅推 origin/port/batches-1-122a；8fafc80一并快进，远端master仍1a42e29。
  - 提交前协作319/319、代码哈希与语法36/36，受保护MD5不变；未改实现或运行应用。本次未重跑src/api全量，沿用124f的4176/4133/43与791全绿证据，不冒充新测试结果。
  - 原代理127.0.0.1:7890不可用，git -c http.proxy=临时直连成功；没有改持久配置、禁用证书校验、强推或推标签。已用ls-remote核对两分支；mac工作流push仅监听master，未查询远端CI结果。
  - 业务提交后工作树0/0/0/0；记账3b8fc6e已入库，追加ls-remote连续出现空响应、连接失败和重置，尚未执行记账push；该提交及本次状态记录待网络恢复后同步。#0055为业务推送说明，#0056为记账文档，后续失败状态由脚本记录。
  - 不重复提交已入库内容，不恢复旧的master发布授权。先修复网络并核对移植分支，再做124g Activity；18件/319例均未接线，R01–R26未完成。

- 2026-09-28（第二十二次）：按用户「处理分支」核对：`origin/port/batches-1-122a`（ba8e9b4）是 master 的祖先，不存在待合并的分叉，把它合入 master 只是空操作；真正欠的是补同步。
  - 授权后按已告知的保守方案只快进推送移植分支：`ba8e9b4..3c3b3ae`（含 `3b8fc6e`、`3c3b3ae` 两条记账提交），本地 port 分支对齐到同一点并绑定 upstream；远端 master 保持 `1a42e29`，不强推、不跟随标签，未触发 mac-arm64 发布路径。
  - 推送前用 live `ls-remote` 复核两分支才执行；持久代理仍不可用，本次 Git 直连成功，未改持久配置、未禁用证书校验。#0057 记下的「待同步」状态由此解除。
  - 清理遗留工作树 `.kilo/worktrees/childish-animal`（detached `1a42e29`、工作区干净）：`worktree remove` + `prune` 后只剩主工作树，没有删除任何受跟踪文件。
  - 本次不改业务代码、未跑测试、未启动应用；18 件/319 例仍全部未接线，R01–R26 都没有完成。§11 最旧一条移到 `docs/tracking/log-archive.md`。

- 2026-09-28（第二十四次）：交付 124h 三件并收束协作阶段：`collaborationLobby`（44 例）、`collaborationNicknameEditor`（29 例）、`collaborationSelect`（46 例），共 119 例，落地不接线；协作累计 22 件/483 例，仍未提交。
  - 三件各自过导出闸门 `MISSING_TOTAL=0`，源码等于 prettier 格式化镜像并与暂存逐字节相同；三件均只依赖既有协作件与图标工厂，未改在用件。Lobby 的冻结行为含「锁定态两个面板都隐藏，被锁定之外页签 disabled」与尾部 `aria-busy` 复位；Select 的定位框 rAF 自调度、阈值 120/40/280 与 130 最小宽度均按镜像；NicknameEditor 的会话守卫在无会话构造时抛 TypeError。
  - 首跑 44/44、29/29、46/46，全部经 prettier 复排后复跑仍全绿；变异抽查 65/65 检出（Lobby 22 + NicknameEditor 18 + Select 25），唯一初判存活者是「close 焦点实参」的真实覆盖缺口，已补断言使该变异转为检出，未以「死分支」解释掉。语法 `node --check` 6/6。
  - 原始 UTF-8 TAP 实跑 src 4340/4297/43，失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；1041 个非测试 JS 模块中三件消费方均 0 命中。未启动应用、构建、联调或提交推送。
  - 协作镜像里文件存在性 OK 的件至此全部落完，余 15 件卡在缺失导出或受保护装配，需另行授权的世代升级批次；下一段转入 `src/modules` 纯叶队列，先重跑 deps-ast 重算分组。孤立台账 276→279 / 1038→1041。R01–R26 未完成。

- 2026-09-28（第二十三次）：交付 124g `collaborationActivity` 与 45 例测试，落地不接线；协作累计 19 件/364 例，仍未提交。
  - 唯一依赖 ReviewDom 的 reviewElement/reviewTime，AST 闸门 2/2 通过；源码等于 prettier 格式化镜像（SHA256 3134c574…），与暂存逐字节相同，语法 2/2；ReviewDom、MemberColor 与格式化镜像一致，图标链差分沿用旧证据。
  - 45 例首跑全绿、格式化后复跑 45/45；16 个变异检出 15，唯一存活者是创建分支里被尾部重同步覆盖的死默认值，已写进专题 §12 第 4 条。
  - src 4221/4178/43，失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 MD5 不变；1031 个非测试文件中消费方 0 命中。
  - 首轮变异基线因外部副本缺 package.json 的 type:module 导致 45 例全未执行，补上后基线 45/0，旧结果作废。未启动应用、构建、联调或提交推送；R01–R26 未完成。

- 2026-09-28（第二十六次）：交付 125b —— `src/modules/personReplacement` 12 件零相对依赖纯叶 + 12 个同名测试、149 例，落地不接线。
  - 12 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 12/12；语法 `node --check` 24/24；12 个测试首跑 149/149、经 prettier 复排后复跑仍全绿。
  - 变异抽查 61 个全部检出、0 存活、0 跳过；12 个外部副本基线全绿、`restored=true`，只改副本。首轮 3 个存活者：ManualBox 默认模式是真实覆盖缺口（已补断言转检出）、ResultHistoryLayout 动画过滤确实不可观测（换可观测变异并写进专题）、StableDom 记账顺序在假 DOM 下近乎惰性（换 `nodeKey` 相等判断）。
  - 原始 UTF-8 TAP 实跑 src 4684/4641/43（新增 149），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；1060 个非测试文件中 12 件模块名/导出名 token 消费方 0 命中（27 个导出 token）。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-personreplacement-batch125.md`；孤立台账 292→304 / 1054→1066。下一段 125c 按 `runninghubAiApp` 6、`panoramaSceneNode` 5 成组落地，队列余 87 LEAF / 95 OK。R01–R26 未完成。

- 2026-09-28（第二十五次）：交付 125a —— `src/modules/app` 13 件零相对依赖纯叶 + 13 个同名测试、195 例，落地不接线；`src/modules` 纯叶队列按重跑后的 deps-ast 重新分组（`LEAF 99 / OK 95 / BLK 333`）。
  - 13 件全过导出闸门（纯叶报告「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 13/13；语法 `node --check` 26/26；13 个测试首跑 195/195、经 prettier 复排后复跑仍全绿。
  - 变异抽查 63 个全部检出、0 存活、0 跳过；13 个外部副本基线全绿、`restored=true`，只改副本。首轮有 2 个目标串不匹配被跳过（收尾括号数不符、漏写行首条件），改准后加入并检出。
  - 原始 UTF-8 TAP 实跑 src 4535/4492/43（新增 195），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；1048 个非测试文件中 28 个模块名/导出名 token 消费方 0 命中（首轮因脚本自身 Windows 路径分隔符 bug 产生 28 条假命中，修正后归零）。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-app-batch125.md`；孤立台账 279→292 / 1041→1054。下一段 125b 按 personReplacement 12、runninghubAiApp 6、panoramaSceneNode 5 成组落地，队列余 86 LEAF / 95 OK。R01–R26 未完成。
- 2026-09-28（第二十七次）：交付 125c —— `src/modules/runninghubAiApp` 6 件与 `src/modules/panoramaSceneNode` 5 件零相对依赖纯叶 + 11 个同名测试、180 例（含 125a/125b 复绿），落地不接线。
  - 11 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 11/11；语法 `node --check` 22/22；11 个测试首跑后修 3 处期望（Motion 揭示后 hidden 实为 false、测量顺序、none），复跑全绿。
  - 变异抽查 97 个全部检出、0 存活、0 跳过；11 个外部副本基线全绿、`restored=true`，只改副本。首轮 7 个存活者全部靠补断言转检出（1px 阈值边界、ease-in-out 中点、时长取末关键帧、首关键帧采样、Head 基准缩放、move 别名、缩放 0.01 下限）。
  - 原始 UTF-8 TAP 实跑 src 4864/4821/43（新增 180），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；非测试文件中 11 件模块名/导出名 token 消费方 0 命中（6 处子串误报已列明）。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-runninghub-panorama-batch125c.md`；孤立台账 304→315 / 1066→1077。下一段按 `canvasShortcuts` 1、`promptPresetCatalog` 1、`imageAnnotate` 2 等成组落地，队列余 76 LEAF / 95 OK。R01–R26 未完成。
- 2026-09-28（第二十八次）：交付 125d —— 9 个目录（`canvasMcp`、`canvasShortcuts`、`imageAnnotate`、`interaction`、`promptPresetCatalog`、`settings`、`tutorials`、`videoRetake`、`whiteboard`）16 件零相对依赖纯叶 + 16 个同名测试、302 例，落地不接线。
  - 16 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 16/16；语法 `node --check` 32/32；16 个测试首跑全绿，经 prettier 复排后复跑仍全绿。
  - 变异抽查 138 个全部检出、0 存活、0 跳过；16 个外部副本基线全绿、`restored=true`，只改副本。首轮 19 个存活者靠补写 12 条边界断言收口（分页 `nextOffset` 边界、副标题 80 字、圆弧切线、退化线段距离、pill 圆角被 `min` 掩蔽、`dy` 的 `??` 语义、存储归一后回写、教程 sort/title/notes 上限、最小窗口 0.2 下限、EPSILON 量级、恰好落在 EPSILON 的吸附、死分支 `|| EPSILON`、POINT_LIMIT），6 个跳过者靠改用唯一/正确锚串（工具名分隔符、节点类型 `slice`、elbow 分支、hexagon 缩进、parallelogram 斜切、多行 `const` 合并后的 `collect` 拷贝语义、模板字面量里的时间文案）。
  - 原始 UTF-8 TAP 实跑 src 5166/5123/43（新增 302），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；消费方反查 1087 个非测试文件，0 真实命中（3 处 `createWhiteboardNodeData` 是与既有 `whiteboardModel.js` 同名撞名）。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-leaf-batch125d.md`；孤立台账 315→331 / 1077→1093。`src/modules` 纯叶队列重跑（`b125e/deps-modules.txt`）为 `LEAF 47 / OK 109 / BLK 319`；下一段转 `src/modules` 直属目录的 47 件零依赖叶，再转 109 件 OK。R01–R26 未完成。
- 2026-09-28（第二十九次）：交付 125e 第 1 组 —— `src/modules` 直属 10 件零相对依赖纯叶（audioVoice 5：面板打开事件常量、分析段归一、分析会话、确认弹窗、片段编辑会话；prompt 3：@ 提及匹配、引用签名、组合态触发抑制；videoKeying 2：投影几何、源视频 30 MB 上限）+ 10 个同名测试、107 例，落地不接线。
  - 10 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 10/10；语法 `node --check` 20/20；10 个测试首跑全绿，经 prettier 复排后复跑仍全绿。
  - 变异抽查 102 个全部检出、0 存活、0 跳过；10 个外部副本基线全绿、`restored=true`，只改副本。首轮 105 个检出 94、存活 11、跳过 2：5 个存活者靠补断言转检出（speakerId 与 speaker 分离、按码点推进、词字符边界、非方形媒体 nx 归一、亚像素矩形 1px 下限），6 个判为等价变异并剔除（节点键前缀、命中后回退重扫、降级名索引推进、composition 计时器重挂、签名默认入参与默认参数），2 个跳过者改用正确锚串（`forEach` 锚少一个右括号、`||` 被 prettier 折行）。
  - 原始 UTF-8 TAP 实跑 src 5273/5230/43（新增 107），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；消费方反查 1097 个非测试文件，0 真实命中。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-leaf-batch125e.md`；孤立台账 331→341 / 1093→1103。125e 队列 47 件已落 10 件、余 37 件（21 个 `workspace*` 加 16 件零星件）；下一段继续成组落地这 37 件，再转 109 件 OK。R01–R26 未完成。
- 2026-09-28（第三十次）：交付 125e 第 2 组 —— `src/modules` 直属 11 件零相对依赖纯叶（`agnesProviderProfiles`、`autoUpdatePolicy`、`minimaxProviderProfiles`、`runningHubInstanceTypes`；`taskCenterModel`；`assetCreateFly`、`backgroundTaskCanvasSnapshot`、`canvasToolbarPlacement`、`clipboardMediaSignature`、`groupNodeLayout`、`imageOverlayReadiness`）+ 11 个同名测试、119 例，落地不接线。
  - 11 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 11/11；语法 `node --check` 22/22；11 个测试首跑 116 例（3 处期望写错，改测试后）119/119 全绿，经 prettier 复排后复跑仍全绿。
  - 变异抽查 68 个全部检出、0 存活、0 跳过；11 个外部副本基线全绿、`restored=true`，只改副本。首个跳过者（`plus option label` 锚串被 prettier 折行）改用正确锚串后收口。
  - 原始 UTF-8 TAP 实跑 src 5392/5349/43（新增 119），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；消费方反查 1108 个非测试文件，0 真实命中。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-leaf-batch125e.md`；孤立台账 341→352 / 1103→1114。125e 队列 47 件已落 21 件、余 26 件（21 个 `workspace*` 加 `canvasImageDisplayHandoff`、`materialComparisonViewport`、`materialLibraryPolicy`、`modelMediaInputLimits`、`nodeCreationMenuIcons`）。R01–R26 未完成。

- 2026-09-28（第三十一次）：交付 125e 第 3 组 —— `src/modules` 直属 11 件零相对依赖纯叶（`workspaceActionIcons`、`workspaceAssetAppearance`、`workspaceAssetDragPreview`、`workspaceAssetHover`、`workspaceAssetLibraryContextMenu`、`workspaceAssetSelection`、`workspaceBetaNotice`、`workspaceContextMenuGuard`、`workspacePersistencePresentation`、`workspacePresentationLifecycle`、`workspaceStepShortcut`）+ 11 个同名测试、132 例，落地不接线。
  - 11 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 11/11；语法 `node --check` 22/22；11 个测试首跑 125/131（6 处期望写错，改测试后）131/131，再补 1 例边界后 132/132，经 prettier 复排（8 个测试文件重排）复跑仍全绿。
  - 变异抽查 92 个全部检出、0 存活、0 跳过；11 个外部副本基线全绿、`restored=true`，只改副本。首轮 2 存活 1 跳过：`isActive` 等价变异换成 `() => true`、「已暂停动画目标脱离文档」补用例、`reveal root` 锚串补右括号后全部收口。
  - 原始 UTF-8 TAP 实跑 src 5524/5481/43（新增 132，与测试数吻合），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；消费方反查 1119 个非测试文件，0 真实命中。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-leaf-batch125e.md`；孤立台账 352→363 / 1114→1125。125e 队列 47 件已落 32 件、余 15 件（10 个 `workspace*` 加 `canvasImageDisplayHandoff`、`materialComparisonViewport`、`materialLibraryPolicy`、`modelMediaInputLimits`、`nodeCreationMenuIcons`）。R01–R26 未完成。
- 2026-09-28（第三十二次）：交付 125e 第 4–5 组 —— `src/modules` 直属 15 件零相对依赖纯叶（第 4 组 8：剧集栏呈现、面板拖拽会话、下拉菜单控制器、素材设置页壳、持久化协调器、节点创建菜单图标、画布图片显示交接、素材对比视口；第 5 组 7：框选、媒体历史菜单、切页过渡、项目首页、视频播放控件、素材库策略、模型媒体输入上限）+ 15 个同名测试、631 例，落地不接线。
  - 15 件全过导出闸门（纯叶「无相对依赖」，`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 15/15；语法 `node --check` 30/30；两批测试首跑全绿，变异收口后 631/631，经 prettier 复排（12 个测试文件重排）复跑仍全绿。
  - 变异抽查：第 4 组 112 个、第 5 组 101 个全部检出，0 存活、0 跳过（第 5 组 3 处判为等价变异并记录理由）；15 个外部副本基线全绿、`restored=true`，只改副本。
  - 原始 UTF-8 TAP 实跑 src 6155/6112/43（新增 631，与测试数吻合），失败名与 b85 完全一致、新增 0 消失 0；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；消费方反查 1134 个非测试文件，0 真实命中。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-leaf-batch125e.md`（补 §19–§24）；孤立台账 363→378 / 1125→1140。125e 队列 47 件全部落地、余 0 LEAF；下一段转 109 件 OK（闸门实测 77 件可落、32 件受阻）。R01–R26 未完成。
- 2026-09-28（第三十三次）：交付 OK 队列第 1 组 125f —— `src/modules/personReplacement` 13 件带相对依赖、过导出闸门的模块（外观本地化、合成媒体驻留、检测反馈、导出、模型门禁、提示词增强、提示词模式、分镜切分模型、智能检测呈现、时间线导出、时间线导出提示、视频生成、人声分离状态）+ 13 个同名测试、174 例，落地不接线。
  - 13 件全过导出闸门（`MISSING_TOTAL=0`），prettier 暂存与仓库逐字节相同 13/13；语法 `node --check` 26/26；13 件在 bare node 下 import 成功、无 DOM 副作用；13 个测试全绿（174 例），经 prettier 复排与变异收口后复跑仍全绿。
  - 变异抽查 302 个（第 A 批 165、第 B 批 137）全部检出、0 存活、0 跳过；外部副本基线全绿、`restored=true`，只改副本；为收口补了 ModelGate/ShotCutModel/CompositeMedia/PromptEnhancement/PromptMode/TimelineExportPrompt 的断言，第 B 批 4 条经审定为等价变异（其中 1 条换成同位置可观察变异）。
  - 原始 UTF-8 TAP 实跑 src 6329/6286/43（新增 174，与测试数吻合），`FAIL_COMPARISON` added 0 消失 0，43 项失败名与 b85 一致；api 791/791/0；受保护 `freeImageHostApi.js` MD5 不变；消费方反查 1147 个非测试文件，1 处同名 token（`extractJsonObject` 撞 `api/agentApi.js` 的局部函数）非消费方，真实命中 0。未启动应用、构建、联调或提交推送。
  - 专题 `docs/src-modules-ok-batch125.md`（新建，§1–§6）；孤立台账 378→391 / 1140→1153。OK 队列余 64 件（125g 13、125h 14、125i 7、125j 29）。R01–R26 未完成。
- 2026-09-28（第三十四次）：分支运维 —— `port/batches-1-122a` 已 100% 并入 master，经用户授权本地与 origin 双删。删除前 `git merge-base --is-ancestor 3c3b3ae master` 通过，提交全部留在 master 历史里、可随时回溯；远端跟踪引用随 push --delete 清除，`git fetch --prune` 因 GitHub 终端凭据不可用未跑成（事后核对已无残留引用）。未动 origin/master、未触发发布路径；未启动应用、未做构建或联调。
- 2026-09-28（第三十五次）：收尾 125g —— 该组 26 个文件先前只落在工作树、未记账（变更记录仅 #0077/#0078「会话开工补记」）。修好 `storyboardCommands.test.js` 2 处断言期望（替身按调用记 `[ids]`、断言写成 `[nodeId]`，应为 `[[nodeId]]`；测试侧笔误，未动移植实现），复跑 168/168；闸门 13/13、prettier 逐字节 13/13、`node --check` 26/26，src 6497/6454/43、api 791/791/0。新建专题 `docs/src-modules-ok-batch125g.md`。另完成下一组 125h 的闸门预筛：14 件中 10 件可落、4 件受阻。
- 2026-09-28（第三十六次）：交付 OK 队列第 3 组 125h —— 落 10 件（素材包节点构建、语音族 7 件：运行时装机与修复、进度跟踪、完成反馈、选段会话、段落状态、试听播放、翻译；画布工程保存事务、协作邀请与成员面板）+ 10 个同名测试、83 例，落地不接线。闸门 10/10、prettier 逐字节 10/10、`node --check` 20/20；首跑 13 例失败全为测试侧期望问题，改正后 83/83，未动移植实现。src 6580/6537/43（与 b85 逐条相同）、api 791/791/0。新建专题 `docs/src-modules-ok-batch125h.md`，同步 orphans（414/1176）与 §0/§5/§6/§7、batches.md；同批 3 件受阻并入 §7.3，并压缩 §6 引言守住 45 KB。未构建、未提交推送。
- 2026-09-28（第三十七次）：交付 OK 队列第 4 组 125i —— 先对全部 61 件未落 OK 件**逐件**跑闸门（一次多件时 `MISSING` 行不标模块，逐件跑才不会误配），得 33 件可落 / 28 件受阻；本批落 10 件（任务中心与媒体缩略图族）+ 10 个同名测试、83 例，落地不接线。闸门 10/10、prettier 逐字节 10/10、`node --check` 20/20；首跑 5 例失败全为测试侧问题，改正后 83/83。src 6663/6620/43（与 b85 逐条相同）、api 791/791/0。新建专题 `docs/src-modules-ok-batch125i.md`，同步 orphans（424/1186）与 §0/§5/§6/§7、batches.md；并更正 125h 受阻件归因（3 件）。未构建、未提交推送。
- 2026-09-28（第三十八次）：交付 OK 队列第 5 组 125j（图像输入与提示词族 10 件）+ 10 个同名测试、**94 例首跑全绿**，落地不接线；51 件未落 OK 件实测 23 可落 / 28 受阻。闸门 10/10 `MISSING_TOTAL=0`、prettier 逐字节 10/10、`node --check` 20/20、bare 导入 10/10；消费方零命中（命中处是 `nodePromptShared.js` 等抽取源）。src 6757/6714/43（与 b85 逐条相同）、api 791/791/0。新建专题 `docs/src-modules-ok-batch125j.md`，同步 orphans（434/1196）与 §0/§5/§6/§7、batches.md；压缩 §6 引言与 §7.2 守住 45 KB。未构建、未提交推送。
- 2026-09-28（第三十九次）：交付 OK 队列第 6 组 125k —— 落分镜 3D 与交互族 10 件（`panoramaSceneNode` 4、`interaction` 2、`toolbarPendingResultNodes`、`segmentRetakeModelPolicy`、`whiteboardBackgroundPreview`、`workspaceCanvasMaterialization`）+ 10 个同名测试、106 例；闸门 10/10、prettier 逐字节 10/10、`node --check` 20/20、bare 导入 10/10；src 6863/6820/43、api 791/791/0；消费方零命中。专题 `docs/src-modules-ok-batch125k.md`。
- 2026-09-28（第四十次）：OK 队列收尾批 125l —— 落 `storyWorkspace` 3 件（画布媒体同步、画布同步控制器、复刻代表帧）+ 3 个同名测试、53 例；闸门 3/3、`node --check` 6/6、消费方零命中；src 6916/6873/43、api 791/791/0。**OK 队列可落件清零**（累计落 69 件、余 28 件受阻需授权升代）。专题 `docs/src-modules-ok-batch125l.md`。
- 2026-09-28（第四十一次 126 批）：全图可达性重算 —— 从 `index.html`/`package.json.main` 与运行期入口（3 个 preload、db 迁移、knexfile）出发做 AST 级全图遍历，实测 **1208 / 可达 755 / 孤立 453 / 断链 0 / 解析失败 0**，替换掉旧的增量估算（447/1209）。新增**在用触达**指标：114 件触达 >0、339 件孤岛。据此重写 `docs/tracking/orphans.md`（36 段、453 条、清单完整，最大行 2304 字，修掉旧的 300 字符截断缺陷），新增专题 `docs/b126-reachability.md`（方法、差异表、接线段建议）。**未改任何仓库源码**；脚本在 `deobf-tools/b126/`。
- 2026-09-28（第四十二次 127 批）：全仓移植欠账清点（只读，不改源码）—— 实测镜像 1767 / 仓库 1212 / **未落地 771**，依赖波次第 1 波 326、第 2–18 波 445，循环 0、断链 0、解析失败 0；首波 326 件跑闸门得**通过 260 / 受阻 66**，受阻根因统一为 40 个在用文件缺 **105 个具名导出**（105 个在镜像里全部存在，属**升代可补**；含 5 个 §2.3 受保护装配件）。据此修正旧口径：OK 队列清零只是 `src/modules` **直属**一层。新增专题 `docs/b127-porting-backlog.md` 与 §7.6，同步 §0/§5/§7.2/§7.3；脚本证据在 `deobf-tools/b127/`。
- 2026-09-28（第四十三次 128 批）：首波落地首批 —— 取 127 批 260 件首波里 `src/modules` 最小的 10 件（3 个纯别名件，加图像裁剪地址、教程缓存、提示词增强集成、厂商档案、画布呈现、复刻 Beta 提示、姿态采样）+ 10 个同名测试共 48 例，落地不接线。闸门 10/10、逐字节 10/10、`node --check` 20/20、bare 10/10；首跑 3 例测试侧失败已改正，48/48 全绿。src 6964/6921/43、api 791/791/0。专题 `docs/src-modules-batch128.md`。
- 2026-09-29（第四十四次 129 批）：首波落地第二批 —— 从首波里再取 `src/modules` 10 件（两个 Beta 提示件、图片/视频下载件、片段重拍模型偏好、素材提示词预设别名、快捷键卡片、复刻评审缩略图、复刻素材取帧、复刻框选）+ 10 个同名测试共 55 例，落地不接线。闸门 10/10、逐字节 10/10、`node --check` 20/20、bare 10/10；首跑 5 例测试侧失败，改正后 55/55。src 7019/6976/43、api 791/791/0。专题 `docs/src-modules-batch129.md`；孤儿台账实测刷新 473/1228。
- 2026-09-29（第四十五次 130 批）：首波落地第三批 —— 再取 `src/modules` 10 件（快捷键图捕获/粘贴/插入、媒体订阅、语音修复流、评审三栏布局、定位图 SVG、任务反馈、取帧接线、倒放、全景贴图桥、MCP 会话）+ 10 个同名测试共 60 例，落地不接线。闸门 10/10、逐字节 10/10、`node --check` 20/20、bare 10/10；首跑 13 例测试侧失败，改正后 60/60。src 7079/7036/43、api 791/791/0。**发现真实缺陷**：`core/math.js` 的 `findAvailablePosition` 遇缺几何节点死循环（未修，待授权）。专题 `docs/src-modules-batch130.md`；孤儿台账实测 483/1238。
- 2026-09-29（第四十六次 131 批）：首波落地第四批 —— 再取 `src/modules` 10 件（素材拖拽与提示词落点、倒放播放控制、提及删除/插入、素材库交互、工程保存控制、3D 资产缩略图、工作室交互、原生 select 替换、背景任务、替换页过渡）+ 10 个同名测试共 59 例，落地不接线。闸门 10/10、prettier 20/20、`node --check` 20/20、bare 10/10、消费方 0 命中。修正回归口径并复跑 src 7138/7095/43、api 791/791/0，43 项失败与 b85 逐条一致；首跑 `ENAMETOOLONG` 已通过 `**/*.test.js` 分目录执行修复。专题 `docs/src-modules-batch131.md`。
- 2026-10-05（160 批·清受保护件残留）：经授权清完 6 个受保护件共 **406 处**（`uiSchemaRenderer.js` 214 转义 + 26 十六进制、`rendererVirtualization.js` 77、`nodeFooterControls.js` 3 + 61 等），只改字面量值、不动标识符与导出面。校验 6/6 PASS、全量零回归；另回滚 b158b 对 `vendor` 的误改。裁决 **维持 0.4.12 基线**。见 `docs/unescape-normalization.md`。
- 2026-10-05（162 批·视频节点域裁决清单，**未改代码**）：12 件整体落地 + **全量**回归 = **11147/11076/71**（基线 11193/11190/3，净增 **68**）。初判：规格变更 45、装配失配 17、形状断言 5、接口断裂 1（文件级）。依赖面缺失均为 0（已排除缺件型）；装配闭包见专题。12 件已回滚，工作区干净。见 `docs/b162-video-domain-adjudication.md`。
