# 第十九批：人物/场景资料图片批次、人工采纳与显式引用

更新：2026-09-23。R04有限源码增量，**未运行验收、未真实生成/上传/保存重开**。不是R04或R01–R26全部完成；全体缺失功能的可维护源码与真实工程接入仍是持续推进的终点，阶段交付只是检查点。

## 1. 实际入口与行为

工作室原“人物资料 / 场景资料”页新增资料图片区，没有另造应用或厂商请求服务：

1. 填写资料名称与设定，预览该项实际待复制文字。只拼本项资料分类、名称、设定，合计1–20000字符；转成原图片节点prompt时转义HTML，不把文字当素材pill或脚本。
2. 在当前资料分类中勾选 **1–6项**，跨分页保留选择，切换人物/场景分类清空本页选择。执行顺序按资料列表，不按勾选先后；不混人物和场景为同一批。
3. 选择原清单中合格的纯文字输入image/modelApi模型，点“已选资料 → 图片批次（先建节点）”。模型移除不静默换默认；每项最多保留6个本批资料生成节点，超限整批拒绝，不自动清理。重复建立不是厂商幂等。
4. 明确确认应用全部草稿并新建标准 `ai-image` 节点。此步不发送、不上传，不复制其他节点的API Key、服务URL、任意参数或已有参考图。
5. 共用第13批 **同一个runner、页面内占用锁和原公开runtime**。先准备/挂载原节点，查看准备后的文字和常用参数，再确认可能逐项计费，才串行调用 `runGeneration({})`。没有私有_onGenerate兜底或另一套HTTP请求。
6. 成功、部分失败、未知/早返回均沿原节点结果判定；失败/未知暂停后续，不自动重试。暂停/返回不代表取消当前执行或计费，原Promise未结束时保持pin至结算。
7. 返回资料页刷新，先定位原生成节点查看真实结果，再选择某个本地原图 **“采纳资料结果（不绑定参考）”**。确认后创建独立 `source-image`，不自动覆盖资料参考图，也不复制文件字节或声称文件存在。相同resultKey重复采纳拒绝，保留已有源节点。
8. 在已采纳图片卡上另点 **“显式设为本资料参考图并应用…”**，确认目标资料、路径和旧引用；旧节点/文件保留。原参考图下拉选择仍需显式应用，选择本批图片时保存同样的来源记录；普通手动源图沿原契约。
9. 在分镜中明确选择人物/场景后，点击原 **“生成分镜脚本快照”**。新参考先校验，再沿已有 `角色图 / 参考 → @图片N / referenceImageRefs` 进入原分镜脚本。快照不自动同步，已有分镜/图片/视频生成节点不被修改；之后的生成仍在原入口另行确认。
10. 继续原工程保存。**应用、history及工具检查点不是磁盘保存回执。**

没有把新资料参考图偷偷接到第13批纯文字镜头批次；这次新增引用链是“显式绑定 → 新分镜脚本快照 → 原后续生成”，不是一次性补齐任意模型、多图视频、首尾帧或参考图批次。

## 2. 复用与来源契约

- 资料原本已有稳定id和 `referenceNodeId`，本批复用，不伪造 episodeId / shotId。
- 新生成节点用 `storyAssetSource`：version 1、工作室ID、assetKind（characters/scenes）、assetId、本节点ID、kind=image及复制时的promptText。与原 `storyMediaSource` 分开，不让资产任务冒充镜头任务。
- 独立源图用 `storyAssetResult`，增加原生成nodeId、真实结果索引、resultKey和规范本地路径。任务/结果匹配同时核对实际节点ID，普通克隆不能冒领来源。
- `readStoryMediaTaskResults` 仅抽出原第12批的共有结果读取逻辑；镜头/资料调用者仍各自验证来源。优先本地原图，不用缩略图替代；保留原数组索引，成功结果超过100项提示而非截断。resultKey沿原generationStartTime（兼容旧别名）识别同路径重新生成。
- 模型目录只影响新建/执行，不影响已完成本地结果的读取、采纳和绑定。资料名称/设定改变后旧结果仍可定位/从原节点导出，但不再作为该资料的当前结果自动采纳。
- 原batchRuntime增加**代码注入的来源适配**，默认镜头逻辑保留；资料适配核对category/id/名称设定，随后仍执行原入边/引用禁止、模型资格、参数比较、runtime身份/空闲与attempted检查。适配不是节点JSON中的可执行配置，不传给原请求。
- 节点仍带原 `storyMediaBatch:{version:1,batchId,state:'held'}`，调用前attempted并history。第13批原图片缺taskId自动fallback保护因而同样适用；原图片/视频生成、账号、授权、API与恢复源码本轮未改。
- 每个节点最多一次**批次入口调用**，失败项不自动重发；手动原入口、新建另一批次、原客户端内部HTTP重试都不是本批可保证的账单幂等。

## 3. 参考来源扩展、失效与兼容

工作室schema保持 `canvas-story-workspace.v1`，资料增加可选白名单字段：

```text
referenceNodeId: 当前明确选择的源图节点ID
referenceImage: { version: 1, nodeId, localPath, resultKey }  // 仅本批资料采纳图
```

原 `referenceNodeId` 保留。新字段校验ID一致、规范本地图片路径及有限resultKey，不保留额外键；仍受工作室4MiB总容量限制，不把图片字节嵌进JSON。旧代码可能丢弃新增字段；新代码遇到本批源图却缺少对应绑定记录会要求重新明确绑定，不凭名称/路径自动补授权。

绑定前后核对本资料身份、生成时名称/设定、resultKey、`src/localPath/originalLocalPath` 和原图实际引用解析。缺节点、换图、来源不符、旧设定等明确报错，不悄悄换图或清除记录。

- **应用资料文字**时可以保留旧参考记录。只有本次新设/改变的绑定需要在apply中重验，因此旧参考失效不会阻止用户保存文字或为新设定重新建立资料图片批次。
- **创建分镜脚本快照**时重新校验本集实际使用的资料引用；有过时/缺失的本批引用则拒绝，不静默丢掉它们。不使用的其他资料失效不阻止本集快照。
- 解除参考只改草稿，原节点和媒体文件不删。绑定来源变化后用户可以解除、重新采纳或重新明确绑定，不能让“应用”变成静默合并。
- 没有本批来源记录的原手动引用沿原契约保留；本批不把所有历史手动/远程参考重新定义为已验证本地素材。

## 4. 应用、恢复与边界

新建/采纳前按新鲜当前状态核对工作室nodes对象身份、baseSignature、完整草稿、全部新ID（包括与edge ID碰撞）、asset来源及原结果选择。资料节点只接受同一未发送批次，不混镜头/任意连线或重复资料。新节点和草稿用原store.batch一次通知，随后一次history。只有引用变动时继续用原单工作室节点apply。

store.batch不是回滚事务；store/commit内部异常不能宣称自动回滚。批次准备、检查、暂停与结果保留是当前页面编排，不是后台队列或磁盘检查点。原生成组件内部的迟到状态路由保持原机制，不能把编排层的来源守卫外推为所有旧生成通道已有完整跨画布安全保证。

保存/刷新不自动恢复批次或重发；held/attempted标记及来源/引用记录随原serializer和原工程保存。原文字队列≤6项、每项3次本地尝试、8MiB快照、queued→held/running→unknown和默认关闭自动保存均未改。也没有迁移浏览器队列或宿主历史。

只接受规范本地原媒体引用，不主动下载远程输出、检查文件存在、计算媒体内容哈希或冻结文件字节；同路径文件被覆盖不能由resultKey证明未变。原节点挂载/媒体加载可能沿既有控件读取配置、价格/元数据或派生资源，准备不是“已生成”或“绝无其他原加载行为”的保证。

未实现：素材多外观/变体、更多模型与参考输入批次、远程落地、自动对齐镜头/自动替换旧引用、跨画布后台调度、持久任务历史、可靠厂商取消、全新版资料工作流或全产品完成。R04其余差异和R01–R26继续保留。

## 5. 文件与静态证据

13个实现/测试文件：

- 新增 `storyAssetMediaModel.js`、`storyAssetMediaCanvas.js`、`StoryAssetMediaPanel.js`。
- 新增 `storyAssetMediaModel.test.js`、`storyAssetMediaBatch.test.js`、`StoryAssetMediaPanel.test.js`。
- 修改 `storyMediaModel.js`、`storyMediaBatchRuntime.js`、`StoryMediaBatchPanel.js`、`StoryWorkspaceEditor.js`、`storyWorkspaceModel.js`、`storyWorkspaceApply.js`、`storyWorkspaceCanvas.js`。
- 路径均在 `src/modules/storyWorkspace/`；没有修改原厂商API、生成/授权/账号模块或 `api/freeImageHostApi.js`。
- 另本文与handoff/next-session/工作室基础/第13批专题4份更新，共18交付文件。

源码检查点 `e83a03e2781af19aab718e64113325d74830d6e3`；测试源码检查点 `a748d155fe9734315e5675c06d86082e98c0f894`。不是自动业务提交/推送/发布。

实际完成：

1. 开工Git master / 0 staged / 33 unstaged / 127 untracked / 0 conflicted，与第18批收尾一致；第18批17个交付文件及合并保护范围33路径新读SHA均无变化。第17批历史SHA未核验的边界没有被改写。
2. 本轮所有远端修改使用apply_patch；既有文件用提交前新读SHA expected_versions，新文件排他Add。13源码/测试已读回并与准备稿SHA一致，最终18文件清单随交付提供。
3. 目标机Node v24.14.0：**35个相关JS语法检查exit0，171处直接相对导入/导出目标存在**。检查范围含本批文件、原镜头批次/采纳/首帧、第18批模型/测试、原图片恢复窄保护、素材工厂、serializer与分镜工厂；不等于执行了这些模块或测试。
4. 工作室目录、原图片taskOrchestration实现、分镜工厂、fileService四个范围的已有编辑器error均0、未截断；未主动编译。
5. 只读定位安装版storyWorkspace目录下的资产批次/生成/状态/外观/输出落地等模块，例如storyAssetBatchGenerationController.js（18356 bytes）、storyAssetGenerationController.js（19610 bytes）、storyAssetAppearances.js（15765 bytes）。名称/长度只是对照定位证据，不证明行为完全一致；未复制混淆发布文件或修改安装目录。

**新增66项测试源码，全部未执行**：34模型/应用/参考（21直接+8来源变更+5路径表）、24runtime/串行集成（15直接+9变更表）、8资料卡局部DOM替身。未伪造旧 `tests/testPreviewDom.js`；不是浏览器/真实生成测试。

未执行测试套件、构建、依赖安装、应用启动、图片生成/上传、FFprobe/FFmpeg、实际素材/工程保存重开或厂商云请求。源码、静态检查、测试执行、应用运行、厂商验收继续分层报告。

## 6. 待授权验收及持续推进

候选离线命令（本轮未执行，无真实模型请求）：

```powershell
node --test src/modules/storyWorkspace/storyAssetMediaModel.test.js src/modules/storyWorkspace/storyAssetMediaBatch.test.js src/modules/storyWorkspace/StoryAssetMediaPanel.test.js src/modules/storyWorkspace/storyMediaBatchRuntime.test.js src/modules/storyWorkspace/storyMediaBatchRunner.test.js src/modules/storyWorkspace/storyWorkspaceApply.test.js src/modules/storyWorkspace/storyWorkspaceModel.test.js src/modules/storyWorkspace/storyMediaModel.test.js
```

另行授权后验收：真实原图片节点挂载/参数稳定与费用确认、六项串行/暂停/早返回/部分失败、模型消失后的已有结果采纳、源图元数据加载、名称设定变化、跨画布/同ID副本、明确绑定/解除、分镜快照实际参考输入、撤销/JSON/工程保存重开、第12–18批回归。真实调用必须另说明发送内容、账号及可能费用。

**下一条优先R03宿主媒体任务历史持久化与只读恢复查询**，先核对原队列的记录、存储根/原子写、IPC与第16批结果白名单，恢复在途记录只能变为待核对，不自动enqueue或重发；厂商可靠取消需逐协议核对，不能让“暂停/停止”冒充取消或停止计费。随后R14存储迁移/外部打开/重开验收及R02/R06/R18，再继续总台账其余缺失源码。

总任务不得因第19批落盘被标记为完成，也不得默认缩减为工作室。只有R01–R26逐项核对完并明确记录剩余源码缺口为零，才能报告总体源码完成；未经运行授权/证据的验收仍须单列，不以源码存在冒充通过。
