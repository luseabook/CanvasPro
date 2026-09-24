# 第十八批：初剪中的已采纳图片与可选单音轨

更新：2026-09-23。R05 有限源码增量，**源码与静态检查已交付，测试和应用运行未验收**。沿第15批 `storyClipModel / StoryClipPreview → media-clip → storySequenceExport → mediaClipExport` 增补，不重建时间线、渲染器、任务中心或工程格式。R01–R26 总范围不缩减。

## 1. 入口与真实接线

1. 工作室 → 镜头媒体 → **已选镜头 → 图片/视频初剪预览**，或 **本集全部镜头 → 图片/视频初剪预览**。
2. 每镜默认仍选择视频。用户可在该镜下拉框**显式改选本镜已采纳图片**；缺视频时不会自动拿图片替换，也不会静默跳过缺素材。沿原镜头顺序，不按点击先后排序。
3. 图片与视频必须已经通过原工作室采纳，具有正确的独立 `source-image / source-video` 和来源记录；不直接使用生成中节点或远程结果。图片路径还核对 `src/localPath/originalLocalPath` 与原图实际输入。
4. 可显式选择当前画布的一条 **source-audio 独立本地素材**作为本次初剪的音轨（如导入、已有结果采纳或第16批任务取回后的音频）。此步骤把它采纳到 `storySequence.audio`，**不是给每镜新增 audio mediaRefs，也不是新增配音/下载/生成链路**。AI音频节点、缺时长和仍在处理的素材不直接可用。
5. 预览中设置图片保留时长、视频入出点，以及可选音轨的素材入出点、成片起点、音量和静音。再明确确认**应用全部草稿并建立初剪**。
6. 原 `store.batch` 一次发布初剪节点、所有视觉/音频入边和工作室草稿，随后一次 history 提交。没有触发渲染或工程保存。继续“关闭并定位初剪”，在原整段导出菜单选择加入画布/导出，再次确认后才会运行宿主任务。
7. 来源改变、画布切换或迟到结果仍沿第15批守卫；成功文件不能自动关联时保留可复制路径供人工恢复，不写入其他画布。第16批任务中心仍可按确切 taskId 查询本次 `storySequenceExport` 的已完成结果。

## 2. 已核对的原契约与窄修改

| 项目 | 原契约 | 本批处理 |
| --- | --- | --- |
| 视觉输入 | `getMediaClipInputKind` 接受 image/video，入边按 createdAt/id 收集；clip 用 sourceId/sourceKey/id | 逐镜显式选择，沿原稳定 edge ID 与顺序；不改普通连线或生成槽 |
| 图片时长 | 原 `resolveMediaClipDurationSec(image)` 缺时长时默认5秒；直接给 clip.endSec 会在再次同步时被裁回默认值 | 新建图片片段携带有限 `storyImageDurationSec`，只在图片且来源键匹配时保留；没有此字段的旧图片仍走原默认逻辑，不修改图片源节点 |
| 音轨 | 原 `audioClips` 含素材入出点、timelineStart/EndSec、laneIndex、muted/disabled | 新链只允许一条 laneIndex=0，静音仅控制该独立音轨；新增可选 volume 的状态保留、导出透传、缓存签名及原FFmpeg增益过滤器 |
| 时间线 manifest | 原契约已有 image/audio、muted/disabled/volume | 比对实际 manifest 的种类、范围、路径、起点、静音和音量；不能只检查自有来源标签 |
| 预览声音 | 原有外接音轨预览会静音视频 | 仅 `storySequence.version=2` 保留视频原声，并给音频预览设置相同增益；普通剪辑及v1默认行为保留 |
| 渲染 | 原 renderer 已有图片 `-loop 1`、音轨裁切/adelay、原声与音轨合成、H.264/AAC | 复用原参数构建/输出命名，只补显式非默认 volume 到已有音频过滤器；未另造渲染器 |

音量为1或未提供时保留原参数路径；显式0不会被当作缺值改回1。普通剪辑的默认音量/缓存语义不改变；显式非默认音量计入导出签名，避免缓存忽略该值。

## 3. 图片保留时长及声音规则

- **视频**：默认完整素材记录时长，不自动套用镜头计划；入出点不得超出记录时长，宿主再查实际时长。第15批v1既有视频工程仍可用。
- **图片**：默认使用该镜当前计划秒数，但该数是**人为保留时长，不是图片文件时长**。预览允许改为0.1–3600秒，入点固定0。创建时的保留长度作为本片段上限，后续原剪辑可缩短；需要加长、换源或换媒体种类时回工作室建立新初剪版本，不静默改旧版本。
- 图片计划时长、提示词、已采纳原图、resultKey 或引用改变后，旧初剪来源失效，需重新预览。文件同路径字节变化不在前端签名保护范围内。
- **单音轨默认不选**。首次选择时，预览默认素材入点0、成片起点0，出点取已知音频记录时长与当前成片总长的较小值并显示，可显式修改。此后调整视觉片段时**不自动裁切/重对齐音轨**；超出素材或成片则阻止应用/导出。
- 音量范围0–1；静音只作用于这一条独立音轨。视频原声保留，图片自身没有音轨；原 renderer 将单音轨叠加到原声上，**无自动压低原声、闪避、响度归一或削波保护**。
- 这不是多轨编辑/多轨混音功能扩展：不能添加第二独立音轨、改为其他lane、做自动对齐、循环、节拍、变速、转场或字幕。原声加一条独立音轨复用原本就有的合成过滤器。
- 混合有声/无声片段时沿原策略补静音；全图片/无声视频且没有有效外接音轨时允许没有音频流。图片不需要伪造音轨或文件时长。
- 初剪仍限 **1–60段、合计≤3600秒、每段≥0.1秒**；每集最多6个初剪版本。未改变媒体生成队列≤6项、每项3次本地尝试等原规则。

## 4. 宿主严格入口

新建初剪保存 `storySequence.version=2`。导出仍用原 `storySequenceExport` kind，但明确传 `args.mediaVersion=2` 和零/一条 `audioClips`。旧第15批宿主不接受这些字段，因而拒绝，而不是忽略图片/音轨设置后错误成功；**需要更新并重启目标源码桌面端，不能改只读安装版**。没有新增IPC/preload或浏览器回退。

- v1 无新增标记时继续只接受视频及原声；不会静默放宽老请求的白名单。
- 路径仅本地 `output/`、`data/uploads/`、`data/assets/`，拒绝远程/绝对/编码/查询片段/穿越。视频格式沿第15批；本批图片为 PNG/JPEG/WebP/BMP，音频为 MP3/WAV/M4A/AAC/FLAC/OGG。不宣称全部图片/声音格式可用。
- 视频沿原 `ffprobeVideoMeta` 逐段验证视频流、有限时长和出点。
- 图片沿原任务队列和FFprobe可执行文件，最多读取前两个输入包并计帧：要求一个可解码静态帧、正尺寸和支持的编码；明确拒绝探测到多帧、APNG/GIF等不支持情况。此有限探测不是全文件格式审计；尤其静态/动画WebP、损坏文件及各平台解码器行为仍需真实样例验收。
- 音频读取首个音频流，优先用其有效时长，否则用有效容器时长；缺音轨、时长未知或出点越界则拒绝。**选中但静音的音频也要完成来源预检**，不能用静音掩盖失效素材。
- 所有视觉及音轨通过后才进入原渲染器；不提前建输出目录、写文件或执行FFmpeg。逐步检查取消，并拒绝预检期间请求变更；使用校验时的片段副本，不拿中途替换的新路径继续探测。
- 输出尺寸取原 renderer 的首个视频；全图片时取首图。帧率、缩放、补黑边、命名与 `ClipVideo` 目录沿原策略。未承诺无损、帧精确、旋转/VFR/奇数尺寸全兼容。

## 5. 来源、保存与未实现项

`storySequence` 只保存工作室/单集/镜头ID、来源节点ID/本地路径/resultKey/必要文字与时长、edge ID，以及可选音频的节点ID/路径/记录时长。范围、音量/静音在原 `mediaClip` 中；生成结果的 `storySequenceOutput` 带当次视觉和单音轨设置。没有复制 API Key、服务URL或任意生成参数，也没有保存发送授权。

应用前重建计划，并核对当前画布对象、工作室基础签名、完整镜头顺序、全部新ID及音频来源。导出确认前后、等待一帧后、任务返回后沿原守卫复核实际来源和当前时间线；切画布即使节点ID相同也不能写入。图片/音轨/边/静音/音量/起点变化均会阻止旧授权继续。

原serializer和原工程保存仍是唯一持久化出口：**草稿显式应用 → 原工程保存**。store.batch只是合并通知，不是回滚事务；应用/history/工具检查点都不是磁盘保存回执。图片hold与音轨字段已补往返测试源码，但**没有实际保存重开证据**。

没有自动重试/重发、后台持久任务日志、云端请求或厂商取消保证。关闭/超时后原本地任务可能继续，不应盲目再次渲染；原任务中心的内存记录也不保证宿主重启后存在。没有冻结文件字节、媒体哈希、备份或自动修复丢失文件。

## 6. 文件、检查点与实际检查

本批13个源码/测试文件：

- 新增 `src/modules/storyWorkspace/storyClipMedia.js`、`storyClipMedia.test.js`、`StoryClipPreview.test.js`。
- 新增 `electron/mediaTasks/storySequenceMedia.test.js`。
- 修改 `src/modules/storyWorkspace/storyClipModel.js`、`StoryClipPreview.js`、`StoryWorkspaceEditor.js`、`StoryMediaPanel.js`。
- 修改 `src/components/media-clip/mediaClipState.js`、`mediaClipExportController.js`、`src/components/MediaClipNode.js`。
- 修改 `electron/mediaTasks/storySequenceExportTask.js`、`mediaClipExportTask.js`。
- 另新增本文，更新 `story-clip-render.md`、`implementation-handoff.md`、`next-session-prompt.md`，共17个交付文件。

源码检查点 `e54c4b2708061ea6eede1adb64f30f27e30d7977`；测试源码检查点 `f1d813a13a8d42342b8bd039d20a1b1604c377db`。这些是工具检查点，不是自动业务提交/推送/发布。

实际已做：

1. 开工与中断续接重读Git，均为 master / 0 staged / 31 unstaged / 122 untracked / 0 conflicted。本窗口未找到第17批 `b17_final_versions.json`；用户明确授权以当前文件建立新SHA基线，故**第17批历史SHA未核验**，不能宣称其历史17文件无变化。已记录17个第17批文件及 `api/freeImageHostApi.js` 的本轮保护基线。
2. 所有远端修改都用 apply_patch；既有文件使用提交前新读SHA expected_versions，新文件用排他Add。首轮10源码、随后3测试已逐个读回核对SHA；收尾17文件清单在交付记录中提供。
3. 目标机 `F:\CanvasPro`、Node v24.14.0：**26个相关JS/CJS `node --check` 均 exit0，138处直接相对import/export目标存在，无缺失**。只检查语法与路径，没有加载应用模块或执行测试。
4. 工作室、media-clip、MediaClipNode、electron/mediaTasks四个范围的已有编辑器 error 诊断均0、未截断；未主动构建/编译，空诊断不是运行证明。
5. 只读对照安装版 package.json 为0.7.16，mediaClipState.js存在、50272 bytes；其 webapp/electron/mediaTasks/mediaClipExportTask.js 在该路径不存在，**未据此推断新版渲染器行为，也未解包、复制或修改安装资源**。

**新增69项测试源码，全部未执行**：模型/来源/正常化/保存29项（16直接+13变更表），宿主预检/白名单/原参数构建31项（12直接+4图片表+15请求表），预览局部DOM替身9项。这不是真实浏览器夹具；没有伪造或补齐历史缺失的 `tests/testPreviewDom.js`。

未执行：测试套件、构建、依赖安装、应用启动、真实FFprobe/FFmpeg、媒体导出/保存重开、真实模型或云请求。静态检查与测试源码均不代表完整产品验收。

## 7. 待授权验收与下一批

候选离线命令（**本轮未执行**；仅测试模型、局部DOM替身与假探测/参数构建，不运行FFmpeg或厂商）：

```powershell
node --test src/modules/storyWorkspace/storyClipMedia.test.js src/modules/storyWorkspace/StoryClipPreview.test.js electron/mediaTasks/storySequenceMedia.test.js src/modules/storyWorkspace/storyClipModel.test.js electron/mediaTasks/storySequenceExportTask.test.js api/storyClipTaskWait.test.js
```

另行授权后验收：真实图片/视频混排与全图片、8秒以上图片跨同步保留、音轨元数据/起点/静音/增益及原声预听与成片一致性、WebP/APNG/损坏文件、混合规格/帧边界、晚段失败不进入渲染、旧宿主拒绝、删除/换源/切画布/同ID副本、超时人工取回、撤销与保存重开、第15批v1与普通剪辑回归。测试/应用启动/真实文件操作需分别授权；任何厂商请求另需说明发送内容和费用。

下一批建议转 R04：人物/场景素材的有限批量与显式引用，先复核第12–14批、现有资料绑定与原生成槽，不能复制密钥/服务URL或自动收费。随后 R03持久历史/可靠取消、R14存储迁移/外部打开/重开验收，再按R01–R26台账推进；本批不是“新版已补齐”。
