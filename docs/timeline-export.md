# 第十一批：Premiere/FCP7 XML 时间线工程导出

2026-09-23。对应 R05 的一条有限剪辑工程交付链路及 R02 必要 IPC。**源码已加入，未运行验收；不是渲染成片、不是剪映草稿，也不是 R05 全部完成。**

## 本批核对与选型

- 当前项目已有 `electron/mediaTasks/mediaClipExportTask.js`、原 `mediaClipExportController.js`：可经原媒体任务路径使用 ffmpeg 渲染剪辑。本批没有把“已有渲染”重新当作缺失功能，也没有改写该路径。
- 安装版仍可读到 `src/modules/nodeBatchExport.js`，`desktopBridge.js` 存在 `node-export/save-timeline` 路由；其媒体剪辑时间线相关资源确实存在。这些是差异线索，不等于已核对或移植其私有导出协议。
- 当前 Electron 目录没有既有 timeline/premiere 文件；本批独立实现可维护的 FCP7 xmeml v5 输出，不执行安装版混淆脚本，不修改安装目录。
- 复用第10批已核对的素材白名单、`resolveExportSource`、`copyVerified`、主窗口 IPC 校验及现有 `getRuntimeToolOrFallback`。`copyVerified` 仅增加 export 标记，函数签名/行为不改；修改前已用 LSP 核对原调用者。

## 使用与产物

1. 用户自行更新/重启 Electron 后，在画布选择 **1–32个已有本地原视频的节点**，右键 → **导出视频时间线工程（Premiere XML）…**。
2. 窗口捕获选择快照，可上移/下移调整顺序，设置每段入点、出点（秒）；出点留空取原视频全长。初始顺序是选择数组顺序，不推断分镜顺序，务必核对。
3. 默认勾选保留原音轨。不合格音轨会拒绝导出；若确实希望静音，可明确取消勾选。静音只作用于 XML 轨道，**副本仍保留源视频全部内容和原音频**。
4. 点击“预检并导出时间线工程”，主进程对本地素材做独立路径/容量检查，并运行本地 ffprobe 读取元数据；不会调用模型、联网获取媒体或自动安装运行时。
5. 通过后原生选择父目录，再次原生确认分辨率、帧率、总时长、文件容量、片段顺序/量化帧入出点、声音策略及副本隐私边界。默认取消。
6. 写入新的 `CanvasPro-timeline-*` 子目录：
   - `media/`：完整原视频副本，不是转码片段；按顺序命名，不覆盖原文件。
   - `export-manifest.json`：节点 ID、已复制文件、媒体 SHA-256、帧范围、序列参数和预期 XML SHA-256。
   - `timeline.xml`：实际 FCP7 xmeml v5 剪辑工程，包含顺序视频轨、源入出点及保留声音时的关联音轨，不是规划 JSON。
7. 在支持 FCP7 XML 的 Premiere 等软件导入 `timeline.xml`，人工核对画面/声音/帧边界。**开发交付过程中尚未执行真实导出，也没有证明任何具体剪辑软件版本已导入成功。**

XML 使用导出副本的绝对 file URI（空格/中文 URL 编码，XML 文本转义）。同机原位置便于直接定位；移动目录/换机器需在剪辑软件重链接媒体。不是自包含 `.prproj`、剪映 draft 或最终 MP4。

## 明确支持的范围

- 单一顺序视频轨，无转场、缩放、变速、字幕或叠加。多个节点可以引用同一源视频，但一个节点在同一选择中只出现一次。
- 所有视频必须同分辨率、同受支持帧率；帧率为24/25/30/50/60或24000/1001、30000/1001、60000/1001。XML 用 timebase＋NTSC 标记保留有理帧率，时间码为 NDF。
- 入出点按最近帧量化，出点排他；不足一帧、超出视频、混合尺寸/帧率等明确拒绝，不自动缩放、转码或猜测时长。
- 每个源必须只有一个视频流，能报告整数帧数与相符的流时长；视频起点为零，不支持旋转、已知非方形像素、已知隔行视频。未报告或 unknown 的某些显示标记只能作为未检出处理，不能证明素材实际属性。
- 报告的平均帧率和标称帧率须一致；缺失、0/0或差异值拒绝。此检查**不是逐帧 VFR 检测**，部分素材仍可能在导入时出现偏差，须使用真实媒体验收。
- 保留声音仅支持单路、1或2声道、44.1/48kHz、近零起点且时长覆盖视频的音轨。静音源保持轨道空白；多路、多声道、偏移或不充分时长均拒绝，而非默默遗漏。
- XML建立视频/音频 link、按源声道建立音轨，序列音频格式声明48kHz/16bit。原始媒体不重采样、不改变编码；剪辑软件的重采样、声道声像和解码结果仍需运行验收，不能视为音频比特级无损工程迁移。
- 每批32段，单源/总时间线最长30分钟，尺寸每边最高8192；复用单文件512 MiB、媒体合计2 GiB限制。时间线只是部分使用原视频也会复制整文件，容量按整文件计算。
- 不直接导出原 `media-clip` 节点的复杂轨道、工作室镜头表、静态图片、独立音频/BGM或未落地远程链接。它们仍在 R04/R05 剩余范围，不偷偷从选择中删去。

## 安全、运行时与失败处理

- 新 IPC 仅主应用窗口 mainFrame＋原 APP_ORIGIN 可调用；renderer 不传可执行文件路径、shell命令、任意参数或目标目录。
- 本地源路径仍只在配置的 `data/assets/`、`data/uploads/`、`output/` 根内，复用原媒体扩展名、穿越/符号链接和复制时版本检查。密钥、服务地址及节点任意请求参数不会进入请求或导出清单。
- ffprobe 路径只由主进程现有运行时解析器提供（含已有 PATH fallback）。`execFile` 不启用 shell；协议仅 file/pipe，输入容器限制 mov/matroska/webm/avi；单次15秒、输出1 MiB、单次分配64 MiB。整批每次开始下一探测前检查已耗时120秒，因此不是严格120秒总超时。
- 不执行 ffmpeg 转码，不安装/下载探测器。能力查询只表示桥接已接入，明确返回 `ffprobeChecked:false`；运行时是否存在要在用户实际触发后验证。缺失时显示清楚错误，不伪造时长。
- 容器/协议限制不等于隔离沙箱，单次分配上限不等于总进程内存上限；恶意媒体解码和本机并发修改目录仍存在操作系统层风险。不存在跨文件系统原子事务保证。
- 任一选择不合格、预检/探测失败时整批阻止；不按“成功片段子集”生成一个偷偷缩短的时间线。
- 确认后新建独立目录，逐个复制、核对源文件变化并记录哈希。某项复制失败就停止；已写入副本保留，窗口报告对应结果，不自动重试。未开始的后续项没有“已保存”记录。
- 媒体全部成功后先写清单，最后写 XML；只有全过程返回 complete 才显示完成。清单单独存在不证明 XML 已保存，应核对 `timeline.xml` 与清单哈希。磁盘/权限故障或进程终止仍可能残留部分/损坏文件。
- 不覆盖已有工程目录；重复确认导出会创建新批次，不是断点续写。原生目录选择/最终确认可取消；复制开始后无执行中取消。窗口关闭/刷新不会回滚磁盘产物，离开提示只是 best-effort。
- 同一 exporter 拒绝并发；不是跨进程锁，也不是常驻媒体任务中心。没有把本批导出偷偷写入原生成任务或工作室文字队列。
- 不修改节点/画布/历史，不替代原工程保存。第1–10批既有生成、账号、授权、队列与恢复契约保持。

## 文件

新增源码/测试8个：
- `src/modules/timelineExport/timelineExportModel.js`：请求白名单、媒体元数据与帧级时间线校验。
- `src/modules/timelineExport/TimelineExportDialog.js`：右键入口窗口、顺序/入出点/音轨选择与结果。
- `src/modules/timelineExport/timelineExportModel.test.js`：27项模型测试源码（含参数化用例）。
- `electron/timelineExport/premiereXml.js`：FCP7 XML序列、源文件、入出点、视频/声音链接。
- `electron/timelineExport/probeTimelineMedia.js`：有边界的本地ffprobe适配。
- `electron/timelineExport/timelineExportService.js`：预检、确认、复制与清单/XML写入。
- `electron/timelineExport/timelineExport.test.js`：12项XML/主进程/适配测试源码。
- `electron/ipc/timelineExportIpc.js`：受限IPC和原生确认。

修改源码7个：`electron/nodeMediaExportService.js`（仅导出复制函数）、`electron/main.js`、`electron/preload.cjs`、`electron/ipc/mainIpcSetup.js`、`electron/ipc/registerIpcHandlers.js`、`src/core/interaction.js`、`src/services/keyboardService.js`。

新增本专题文档；更新 `implementation-handoff.md`、`next-session-prompt.md`。无依赖安装、无原mediaClipExport/模型/授权逻辑变更。

## 实际检查与验收欠项

- 主源码补丁检查点 `2168fd150728842fe3e8d452149b2f950721469b`；审阅修正缺失标称帧率并增补测试的检查点 `e59f0eafdce64e796577a0956af106a85ed63efa`。不是业务提交/发布。
- 目标机19个相关JS/CJS文件 `node --check` 和静态/动态相对导入目标存在性检查通过；含15个本批文件和4个第10批依赖/回归测试源码。未执行这些模块。
- 15个本批源码/测试文件实际SHA-256与最终补丁版本核对一致。相关已有编辑器error诊断0条，无主动编译。
- 新增 **39项测试源码未执行**（27模型＋12主进程/适配）。测试设计使用模拟ffprobe、原生对话框替身和临时文件，不代表真实视频/探测器/剪辑软件验收。
- **未运行：测试套件、ffprobe、ffmpeg、应用、构建、安装、真实导出、Premiere/FCP7导入或模型/云服务调用。**

需要授权后再执行的离线测试命令（本次未执行）：

```powershell
node --test src/modules/timelineExport/timelineExportModel.test.js electron/timelineExport/timelineExport.test.js src/modules/nodeExport/nodeMediaExport.test.js electron/nodeMediaExportService.test.js
```

实际UI/媒体验收还需：原生取消和确认；真实CFR/NTSC与VFR素材；1/2/多声道及有偏移音轨；中英文文件名；片段顺序/帧精度；静音副本的隐私提示；文件变化/缺失/越界/符号链接；探测器缺失/超时；磁盘满/权限/复制中断；刷新退出；第10批回归；在具体Premiere版本导入XML、核对时长、片段定位、声像和媒体重链接。导入成功与真实成片渲染必须分别报告。

下一批优先回到 R04：稳定镜头来源ID、复用已有媒体生成通道和结果关联/保存，而不是继续只扩展导出清单。剪映、复杂轨道迁移、媒体任务恢复与成片仍留在 R01–R26 台账。
