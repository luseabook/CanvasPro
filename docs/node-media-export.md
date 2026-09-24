# 第十批：节点本地媒体批量导出

2026-09-23。对应 R02 的最小桌面桥接及 R18 的批量导出子项。**源码落地，未运行验收；不是 R02/R18 全部完成，更不是 R04 媒体生成或 R05 成片完成。**

## 核对依据与批次选择

- 本批只读核对安装版 `resources/webapp/package.json` 为 0.7.16；本项目 package.json 为 0.4.12。安装版确有 `src/modules/nodeBatchExport.js`、`src/services/desktopBridge.js`，桥接资源含 node-export/export-selected、save-media-files、save-timeline 等路径。
- 不能沿用早期审计的文件位置假设：本次读取安装版 `webapp/electron/nodeExportService.js` 等路径失败；安装资源根可见 app.asar。没有把这些失败读取当成已经核对 Electron 实现，也没有执行/复制混淆脚本或修改安装目录。
- 本项目已存在 preload/IPC、本地素材根目录解析、mediaTask 队列及 mediaClipExport 等本地处理能力，并非“没有后端”。工作室桥接目前只建立分镜快照并标记工作室/单集来源；R04 仍需逐镜稳定来源标识、媒体任务状态与结果回写关联、费用/未知状态确认。
- 因此本批先复用原 `resolveLocalVirtualPath` 与配置素材根目录，补一个无需模型、网络或 ffmpeg 的真实文件交付闭环。没有重写原生成通道，没有复制新版整个 Electron/styles，也没有把规划 JSON 当成影片。

## 使用入口与实际产物

1. 更新源码后由用户自行重启 Electron 桌面端（开发交付过程中未启动应用）。选中一个或多个媒体节点，在节点右键菜单点击 **导出选中节点本地媒体…**。
2. 窗口列出捕获的选择快照、拟导出文件名及跳过原因。每节点一个当前原媒体，不展开节点的历史图片、多图集合、分镜子格或整个工作室。
3. 点击 **选择目录并确认导出**。主进程再次校验输入、磁盘文件、类型和容量，打开原生父目录选择框。
4. 再次原生确认可复制数量、预检失败数量、总大小、实际文件名及目标目录。两个原生对话框默认取消；取消不会开始复制。
5. 确认后在所选目录创建唯一的 `CanvasPro-media-*` 子目录，串行复制实际媒体字节。不覆盖已有导出，也不修改/删除源文件。
6. 窗口报告每项写入或失败；目录内的 `export-manifest.json` 记录节点 ID/名称、媒体类型、文件名、字节数及 SHA-256。失败项也写入清单；清单写入失败单独提示，不丢弃已复制媒体、不自动重试。

清单是已经执行的导出记录，不是生成计划或成片。节点 ID 只在原工程语境下有意义：本批不做自动导入/回写/跨工程 ID 匹配。名称和 ID 可能含敏感信息，需妥善保管。

## 数据、权限及保存边界

- 支持 source-image/image/ai-image、source-video/video/ai-video、source-audio/audio/ai-audio 和带本地图片结果的 storyboard 节点。跳过仍生成/处理中的节点、工作室/文本节点、失效节点及远程媒体。
- 优先 originalLocalPath，再 localPath 和该媒体类型的主结果地址；不使用 displayLocalPath、posterLocalPath、thumbLocalPath 或 waveformLocalPath 来冒充原文件。明确原路径不可用时不静默换成缩略图。节点若自行把代理写进主字段，本批无法推断其原始来源。
- **不会下载远程 URL，不发送模型请求，不改原生成、账号、授权或工程保存流程。** 普通浏览器及旧 preload 明确显示需要更新后的 Electron，不降级成假下载，也不新增开放 HTTP 代理。
- 只接受 `data/assets/`、`data/uploads/`、`output/` 下的规范化虚拟路径。主进程独立白名单校验；拒绝绝对/UNC/远程路径、穿越、双重编码、查询参数、流名称等，且核对路径解析结果。百分号等特殊文件名暂不支持。
- 媒体扩展名白名单区分图片、视频与音频；不导出 SVG/脚本/可执行文件。只检查扩展名与文件状态，不验证媒体解码、编码器/播放器兼容性。
- 配置根目录由主进程提供；对根目录下的符号链接/目录跳转拒绝复制，realpath 检查不能越界。配置根本身是受信任的用户设置。并非针对本机恶意进程实时修改目录的完整沙箱，也不承诺跨平台文件系统原子事务。
- 新 IPC 仅允许主应用窗口的 mainFrame，且当前 URL 必须属于既有 APP_ORIGIN；子 frame、其他窗口和外站来源拒绝。没有从 renderer 接收任意目标目录、文件名或系统命令。
- UI 与主进程均限制 **每批最多100项；单文件最多512 MiB；有效文件合计最多2 GiB**。零字节、目录、超限文件拒绝。单项预检失败可与有效项一起报告；整批超限阻止写入。
- 每个文件先限量分块读写到独占 `.part`，检查前后文件身份/大小/修改时间，计算 SHA-256，再独占复制成最终名称。确认后源文件变化会失败；失败后临时文件清理为 best-effort，可能留有部分文件。不能根据错误或窗口关闭断言“磁盘什么都没写”。
- 暂存和最终副本在短时间内同时存在；需要整批输出空间加上当前文件额外暂存空间（最高512 MiB），不做磁盘预留。ENOSPC/权限/文件消失会报告；清单写入也可能失败。
- 只导出副本，不改变任何节点，不创建历史记录，不替代工程保存。前九批工作室“草稿→显式应用→原保存”、队列保存/恢复/计费契约原样保留。

## 并发、取消与失败

- 同一主进程同时只允许一个本批导出；界面执行中禁用再次执行及关闭按钮。处理范围有上限，但本批没有逐字节进度或执行中取消接口。
- 开始复制前可取消目录选择或最终确认。复制开始后不能撤销本批文件；关闭/刷新/进程终止不会回滚已经落盘的副本，也不保证清单已写完。页面离开提示仅 best-effort。
- 每个新文件开始前复核调用窗口；窗口失效时后续项失败，已经完成的文件保留。不是后台任务中心、重启恢复或跨画布任务调度。
- 结果失败、不完整或 IPC 中断时先核对磁盘。关闭再打开导出会新建另一批，不会续写，也没有自动收费或自动重试。

## 文件

新增源码/测试（8）：
- `src/modules/nodeExport/nodeMediaExportModel.js`：跨 renderer/main 的纯白名单、命名与限制契约。
- `src/modules/nodeExport/collectNodeMedia.js`：原媒体选择快照、跳过原因。
- `src/modules/nodeExport/NodeMediaExportDialog.js`：预览、能力降级、操作与逐项结果。
- `src/modules/nodeExport/nodeMediaExport.test.js`：模型/选择器测试源码，参数化展开21项。
- `src/services/nodeMediaExportService.js`：能力查询、白名单桥接。
- `electron/nodeMediaExportService.js`：主进程预检、真实复制、摘要/清单、并发与失败处理。
- `electron/nodeMediaExportService.test.js`：临时文件/目录及注入确认器测试源码13项。
- `electron/ipc/nodeMediaExportIpc.js`：受限 IPC、原生目录选择和二次确认。

修改接入（6）：`electron/main.js`、`electron/ipc/mainIpcSetup.js`、`electron/ipc/registerIpcHandlers.js`、`electron/preload.cjs`、`src/core/interaction.js`、`src/services/keyboardService.js`。

专题文档之外同步更新 `implementation-handoff.md` 和 `next-session-prompt.md`。无新增依赖、无后端接口变更、无整目录替换。

## 实际检查与尚未执行

- 源码补丁工具检查点：`0dd67d0c706681b810dcb03ee1530cf9650cf8d2`；不是发布或业务分支提交。
- 目标机 **14个 JavaScript/CJS 文件的 `node --check` 通过**；所检查的静态相对导入及动态相对导入目标均存在。
- **14个落盘 SHA-256 与成功补丁返回版本一致**。检查期间未运行测试模块。
- Electron、nodeExport 目录、导出 service、interaction、keyboardService 的已有编辑器 error 诊断均为0；没有主动编译，空诊断不证明运行正确。
- 提供 **34项测试源码，未执行**。没有执行测试套件、构建、依赖安装、Electron/网页启动、真实文件导出、模型/云服务请求或发布。

待授权执行的离线测试命令（本次未执行）：

```powershell
node --test src/modules/nodeExport/nodeMediaExport.test.js electron/nodeMediaExportService.test.js
```

这些测试只用操作系统临时目录和模拟确认器，不请求网络或模型；包含稀疏大文件容量边界和按 OS 权限跳过的 symlink fixture。仍需先取得执行授权。测试即使通过，也不能替代 Electron 原生窗口、真实磁盘权限和 UI 验收。

人工验收欠项：多选/单选及保存后重开；有本地结果的原 AI/Comfy/白板导出节点；远程/缺失/代理/缩略图跳过；混合成功失败；两个取消点；重复点击/跨窗口 IPC；文件名冲突/超限/源文件变化/权限不足/磁盘满；清单失败与残留文件；主窗口关闭、刷新及快捷键隔离；Windows目录跳转；大媒体复制与各平台文件系统。

下一步仍按 R01–R26 推进。优先补 R04 的逐镜媒体来源与结果关联，并复用原生成通道；或沿 R05 核对 mediaClipExport/ffmpeg 后接可打开的时间线/媒体产物。不能因为本批文件导出完成而宣称媒体生成、剪映/PR或成片完成。
