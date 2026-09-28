# 批次索引（第 1–124 批，124 进行中）

> 由 `docs/TRACKING.md` 维护。每交付一批，在表尾追加一行；细节写专题文档（都在 `docs/` 下）。
> 来源：冻结台账 `docs/implementation-handoff.md` 的 §2 表格与各批标题，加上各专题文档的标题。生成于 2026-09-25。
> 说明：第 1–29 批直接改在用代码（已接入，但都没有运行验收）；标题里写着「落地不接线」的批次，模块进了仓库但没有接进运行时。

| 批次 | 能力区 | 内容 | 专题文档 |
| --- | --- | --- | --- |
| 1 | — | 白板节点：绘图/文字/图片、图层操作、历史、项目存储、PNG及图像节点导出 | `whiteboard-implementation.md` |
| 2 | — | ComfyUI工作流节点及Python适配：API JSON、参数编辑、标准图片上传、提交/查询/恢复/排队取消、结果保存 | `comfyui-implementation.md` |
| 3 | — | 剧本工作室基础编辑：单集/资料/镜头、草稿应用、JSON/Markdown/CSV、画布分镜互转 | `story-workspace-implementation.md` |
| 4 | — | DOCX/PDF导入、独立解析进程、预览后确认追加 | `story-document-import.md` |
| 5 | — | AI拆集、人物/场景提取、JSON修正、预览/勾选合并 | `story-ai-assistant.md` |
| 6 | — | AI分镜生成、所选文字资料、逐镜审阅、追加草稿、来源检查 | `story-ai-shots.md` |
| 7 | — | 多集分镜串行队列、暂停/停止、显式重排、手动快照 | `story-ai-queue.md` |
| 8 | — | IndexedDB明确启用的自动保存、发送前/结果后检查点、人工恢复、Web Locks与版本冲突保护 | `story-ai-queue-storage.md` |
| 9 | — | 单次助手/队列统一多厂商选择器、模型资格检查、白名单请求适配、快照厂商标识 | `story-ai-providers.md` |
| 10 | — | 节点本地媒体批量导出：多选右键预览、最小受限IPC、原生目录/确认、实际复制、逐项结果及SHA-256清单 | `node-media-export.md` |
| 11 | — | 选中本地视频的Premiere/FCP7 XML工程：排序/入出点、ffprobe预检、原生确认、关联音轨、实际媒体副本及XML | `timeline-export.md` |
| 12 | — | 镜头媒体页：稳定来源ID、标准图片/视频生成节点、原入口生成、逐项本地结果采纳、独立源节点与镜头关联/工程保存字段 | `story-media-workflow.md` |
| 13 | — | 1–6镜批量建节点、原runtime逐项生成、双阶段确认/暂停、attempted标记、部分失败待核对、批次恢复自动重提保护 | `story-media-batch.md` |
| 14 | — | 本镜已采纳图片显式选择、标准视频节点+firstFrame连线、原发送确认/异步空窗复核、结果首帧来源保存 | `story-reference-video.md` |
| 15 | — | 已采纳视频按镜头顺序预览/入出点、原media-clip节点与连线、明确渲染确认、逐段宿主预检后复用原渲染器、来源复核/结果恢复/工程字段 | `story-clip-render.md` |
| 16 | — | 原任务中心手动刷新/按taskId查询、四类宿主结果白名单、确认后新建当前画布独立素材、事件/列表及跨画布守卫、工程来源字段 | `media-task-recovery.md` |
| 17 | — | 原v1工程包上补全部画布收集（严格读回校验/不覆盖）、独立工程恢复（原生选包、逐条校验、SHA-256、独占落盘）与前端切换守卫 | `project-package-recovery.md` |
| 18 | — | 初剪逐镜显式选已采纳图片/视频、图片保留时长、显式单条本地音轨及起点/范围/音量/静音；宿主逐项预检后复用原渲染器 | `story-clip-media.md` |
| 19 | — | 人物/场景资料1–6项图片批次、原runner/runtime串行、独立本地采纳、显式绑定与新分镜快照引用前复核 | `story-asset-media.md` |
| 20 | — | 原媒体任务队列明确启用的本机摘要历史、主窗口受限IPC、原中心内只读分页/按记录ID人工取回；补测试源码与磁盘v0防误启校验 | `media-task-history.md` |
| 21 | R14 | R14原外部打开队列加主窗口消费权限、启动/通知批次串行、渲染等待后再确认脏画布及旧包导入目标守卫 | `external-project-open.md` |
| 22 | R14 | R14系统 .aicpkg 交给主进程短时一次性票据，前端能力检查后复用第17批原生确认、严格校验、独立全画布恢复和切换守卫 | `os-full-package-restore.md` |
| 23 | R14 | R14原有保存路径迁移改为明确确认、复制保留源、冲突/变化/链接拒绝、全数据目录核对及失败不直接切路径；旧版默认根只读扫描→选定可信候选→确认复制到当前根 | `file-save-migration-safety.md` |
| 24 | R03 | R03本机媒体队列拒绝同进程重复任务ID、等候端订阅后按确切ID只读补查快速终止 | `media-task-history.md` |
| 25 | R03 | R03本地媒体任务入队前保留画布身份及原nodes对象、回执ID与延迟回写核对，防止切画布后误写同ID异画布 | `media-task-history.md` |
| 26 | R14 | R14工程JSON读取失败/404/不支持结构拒绝按空画布替代；仅无URL默认工程与显式新建可缺失；读取成功后才清画布，失败清启动保存身份并提示 | `file-save-migration-safety.md` |
| 27 | R14 | R14桌面原生文件、最近工程、旧单画布包与OS外部打开复用工程结构守卫；宿主失败/未知JSON在清画布或确认脏画布前拒绝 | `file-save-migration-safety.md` |
| 28 | R14 | R14恢复文件/IndexedDB缓存与JSON拖入拒绝坏正文降级空白、读取失败保留源 | `file-save-migration-safety.md` |
| 29 | R14 | R14宿主快照归属/修订保护、保存前捕获令牌及保存后条件清理；拒写告警、受保护关闭确认与旧宿主无守卫写入禁用 | `file-save-migration-safety.md` |
| 30 | R02 | R02桌面HTTP桥地基：/api/v2/desktop/* 82路由分发表 + 能力操作层（clipboard/secure-settings/diag… | `desktop-http-bridge.md` |
| 31 | R02 | R02补齐 agentInformationOperations（SSRF 加固的 URL 读取：私网/保留地址拦截、DNS 固定、重定向上限、正文编码/… | `desktop-http-bridge.md` |
| 32 | R02 | R02补齐 Agent Skill 链路：移植纯函数 src/modules/agent/agentSkillPackage.js（frontmatter… | `desktop-http-bridge.md` |
| 33 | R02 | R02补齐 projectCapabilityOperations：移植 electron/projectCapabilityOperations.js（… | `desktop-http-bridge.md` |
| 34 | R02/R17 | R17 通知音播放链路 + R02 补 diagnosticsOperations，含已执行离线测试 | `desktop-http-bridge.md` |
| 35 | R02/R17 | R17 可配置全局截图快捷键 + R02 补三条 screenshot 路由，含已执行离线测试 | `desktop-http-bridge.md`, `screenshot-global-shortcut.md` |
| 36 | R02/R17 | R17 完成通知点击回跳 + Alt+E 全局快捷键 + R02 补 notification 四路由，含已执行离线测试 | `completion-notification-navigation.md` |
| 37 | R02/R05 | R02 节点导出能力 node-export/* 五路由 + R05 "打开剪映"，含已执行离线测试 | `node-export-capability.md` |
| 38 | R02/R14 | R02 旧渲染器存储迁移两条 storage-migration/* 路由 + R14 旧存储兼容性宿主侧，含已执行离线测试 | `legacy-renderer-storage-migration.md` |
| 39 | R02 | R02 时间线导出宿主操作层 node-export/save-timeline + nodeExport:saveTimeline IPC，含已执行离线… | `desktop-http-bridge.md`, `timeline-export-operation.md` |
| 40 | R02 | R02 资产更新事件缓冲 + custom-ai-apps 数据目录，含已执行离线测试 | `asset-update-events.md` |
| 41 | R02 | R02 全局划词/文本预设捕获链 + 五条 text-preset/* 路由，含已执行离线测试 | `text-preset-capture.md` |
| 42 | R02/R12 | R02/R12 customAiApps:read/write IPC + preload 三个能力组，含已执行离线测试 | `custom-ai-app-ipc.md` |
| 43 | R16 | R16 三个可读 Python 服务 + 两个模型根解析器，含已执行离线测试 | `asr-transcription-runtime.md` |
| 44 | R16 | R16 ASR 运行时分发/安装链，首次接进本仓媒体任务队列，含已执行离线测试 | `asr-runtime-install.md` |
| 45 | R16 | R16 录音转写链：两个云端 ASR 客户端 + 供应商层 + 任务处理器 + 凭据解析器，接进本仓媒体任务队列，含已执行离线测试 | `recording-transcribe.md` |
| 46 | R16 | R16 视频转 GIF 宿主任务链 videoToGif + 渲染器校验面，含已执行离线测试 | `video-to-gif.md` |
| 47 | R16 | R16 云端语音识别客户端 volc.seedasr.auc + 音视频云 ASR 适配层 createAudioVoiceCloudAsrAdapter… | `audio-voice-cloud-asr.md` |
| 48 | R16 | R16 语音工作室合成宿主任务链 audioVoiceCompose + 渲染器校验面 + 任务中心显示名，含已执行离线测试 | `audio-voice-compose.md` |
| 49 | R16 | 第49批 · R16 语音工作室分析宿主任务链（audioVoiceAnalyze 及其四个模型/运行时句柄） | `audio-voice-analyze.md` |
| 50 | — | 第50批 · 本地媒体任务句柄层与播放代理共享模块（registerLocalMediaTaskHandlers + videoPlaybackProxy… | `local-media-task-handlers.md` |
| 51 | R02 | R02 资产能力操作层 assetCapabilityOperations + 5 依赖 + imageDerivativeWorker，main.js … | `asset-capability-operations.md` |
| 52 | R02/R16 | R02/R16 FFmpeg 编码器运行时 ffmpegVideoEncoderRuntime + toolCapture，main.js 去内联化，含已… | `ffmpeg-video-encoder-runtime.md` |
| 53 | R02/R16 | R02/R16 共享句柄 runFfmpegTask 收尾：videoReverse + mediaClipExport，含已执行离线测试 | `video-reverse-media-clip-export-runner.md` |
| 54 | R02 | R02 媒体任务队列代际升级 mediaTaskQueue.js：优先级 / 迁移去重 / spawn 重试 / spawnImpl / stage / … | `media-task-queue-generation-upgrade.md` |
| 55 | R02/R15 | （R02/R15 渲染器侧桌面桥客户端链：desktopBridge / chromeShellStartupReadiness / deferredMe… | `desktop-bridge-renderer-client.md` |
| 56 | R15 | R15 Chrome 工作进程传输层：chromeCdpPipeClient + chromeBrowserWorker，含已执行离线测试 | `chrome-shell-transport-primitives.md` |
| 57 | R15 | R15 chrome-shell 启动三件套：chromeShellStartupFallback + chromeShellStartupHealth … | `chrome-shell-startup-fallback-health-recovery.md` |
| 58 | R15 | R15 内核版本门禁与 Windows 系统工具：windowsSystemTools + chromeShellBrowserVersion + chr… | `chrome-shell-browser-version-and-windows-tools.md` |
| 59 | R15 | R15 chrome-shell 网页预览管理器：chromeShellWebPreviewManager，含已执行离线测试 | `chrome-shell-web-preview-manager.md` |
| 60 | R15 | R15 Windows 任务栏身份与窗口过渡：windowsTaskbarIdentity + windowsWindowTransitions + ap… | `chrome-shell-windows-taskbar-and-window-transitions.md` |
| 61 | R15 | R15 chrome-shell 启动器：chromeShellLauncher，含已执行离线测试 | `chrome-shell-launcher.md`, `next-session-prompt.md` |
| 62 | R15 | R15 chrome-shell 运行时装配器：chromeShellRuntime，含已执行离线测试 | `chrome-shell-runtime.md` |
| 63 | R15 | R15 浮层捕获窗口控制器：globalCaptureWindowController，含已执行离线测试 | `global-capture-window-controller.md` |
| 64 | R15 | R15 浮层捕获窗口装配层：globalCaptureControllers + globalCaptureWindowPreload.cjs，含已执行离… | `global-capture-controllers.md` |
| 65 | R15 | R15 浮层捕获渲染层的前置依赖 4 模块，含已执行离线测试 | `context-menu-icons-and-horizontal-wheel.md` |
| 66 | R15 | R15 浮层捕获面板渲染层三件套 + --font-ui，含已执行离线测试 | `global-capture-window-renderer.md` |
| 67 | R15 | R15 浮层捕获接收器 + 节点运行时解析器，含已执行离线测试 | `global-capture-receiver-and-node-runtime-resolver.md` |
| 68 | R15/R17 | R15/R17 文本预设快捷捕获设置子系统 + 宿主 settings 路由，含已执行离线测试 | `global-text-preset-bridge.md` |
| 69 | R15 | R15 渲染器侧桥 globalTextPresetBridge.js，含已执行离线测试 | `global-text-preset-bridge.md` |
| 70 | R15/R17 | R15/R17 文本预设链装配第①②③步：node.create 契约 + createNodeAtCursor 序列位 + main.js 装桥 + i… | `global-capture-chain-assembly.md` |
| 71 | R15/R17 | R15/R17 文本预设链装配第④步：主进程侧装配 globalCaptureControllers + 四条浮层通道脱离 not-supported +… | `global-capture-chain-assembly.md` |
| 72 | R15 | R15 chrome-shell 运行时模式与启动生命周期三前置：canvasRuntimeMode + desktopStartupLifecycle … | `chrome-shell-runtime-mode-and-startup-lifecycle.md` |
| 73 | R15/R17 | R15/R17 渲染器侧缺失源件两件：contextMenuShortcutCatalog（+productFeatures）+ webPreviewRe… | `context-menu-shortcut-catalog-and-web-preview-remote-input-queue.md` |
| 74 | — | 渲染器交互/键盘状态与遮罩作用域原语六件：escapeScope + physicalShortcutState + canvasPanShortcutS… | `renderer-interaction-and-overlay-scope-primitives.md` |
| 75 | — | 启动端口回收与后端启动解析：startupPortPolicy + startupPortInspector + startupPortRecovery … | `startup-port-and-backend-launch.md` |
| 76 | — | 启动辅助三件与路径包含校验：mainStartupHelpers + localPathContainment + devReloadShortcuts，… | `startup-helpers-and-path-containment.md` |
| 77 | — | 本地预览协议运行时：localPreviewProtocolRuntime，含 main.js 真实接线，含已执行离线测试 | `local-preview-protocol-runtime.md` |
| 78 | — | 媒体任务运行时装配层：mediaTaskRuntime，含 main.js 真实接线，含已执行离线测试 | `media-task-runtime.md` |
| 79 | — | 诊断世代升代：diagnostics.js 268→663 行 + diagnosticsEvidence/diagnosticsLaunchVersio… | `diagnostics-generation.md` |
| 80 | — | 前景对话框呈现器 dialogPresenter/dialogPresenterCore 替换 main.js 内联对话框调用 + 原生菜单图标工厂 na… | `dialog-presenter-and-native-context-menu-icons.md` |
| 81 | — | 渲染器运行时诊断钩子 rendererRuntimeDiagnostics 落地不接线 + rendererPanPreviewReconcile 依赖闭… | `renderer-runtime-diagnostics.md` |
| 82 | — | 节点管理器无头内核 src/modules/nodeManager/ 4 件落地不接线 + assetCoverResolver/nodeManagerL… | `node-manager-core.md` |
| 83 | — | 节点批量导出 + 下载保存链 5 件落地不接线，含已执行离线测试 | `node-batch-export-and-download-save.md` |
| 84 | — | 渲染器核心零依赖块 6 件落地不接线：边命中/边可见性空间索引 + 光栅代理策略 + 快速预览准入/续接/媒体运行时预备，含已执行离线测试 | `renderer-core-index-and-fast-preview.md` |
| 85 | — | 替换工作室/人物替换自洽核心 9 件落地不接线：任务身份 + 提示词编号身份 + 输出血缘 + 工程库 + 声音库 + 工作区输入，含已执行离线测试 | `person-replacement-identity-and-library.md` |
| 86 | — | 分镜3D/导演相机与时间线自洽核心 6 件落地不接线：小地图投影数学 + 导演曲线求值 + 相机路径增删改 + 相机关键帧编辑器 + 时间线关键帧批量操作… | `storyboard3d-director-camera-and-timeline.md` |
| 87 | — | 分镜3D/视口设置与交互策略自洽核心 6 件落地不接线：物体变换能力策略 + 框选几何与选择集 + 图像姿态运行时清单 + 导演场景设置归一化 + 视口导… | `storyboard3d-viewport-and-interaction-policies.md` |
| 88 | — | 分镜3D/导演编排与回收自洽核心 6 件落地不接线：缓动曲线编辑器 + 跟拍方式面板 + AI 生成层与历史版本 + 删除回收站与恢复 + 编辑器状态 s… | `storyboard3d-director-orchestration-and-recovery.md` |
| 89 | — | 分镜3D/背景标定与几何导入自洽核心 6 件落地不接线：背景图片控制器 + 素材目录选择 + 语音输入服务 + 背景标定数学 + 背景透视估计器 + OB… | `storyboard3d-background-calibration-and-geometry-import.md` |
| 90 | — | 分镜3D/二进制素材与导出策略自洽核心 4 件落地不接线：IndexedDB 二进制素材仓库 + MediaPipe 姿态重定向 + 分镜网格/序列导出 … | `storyboard3d-binary-assets-and-export-policy.md` |
| 91 | — | 分镜3D/导演场景编排·变换会话·实例合批·glTF 导入适配 three.js 依赖核心 4 件落地不接线 + directorMultiView/di… | `storyboard3d-authoring-transform-and-gltf-import.md` |
| 92 | — | 分镜3D/模型导入·运动片段·素材记录·导演相机路径面板·图像姿势估计·背景标定交互 6 件落地不接线，含已执行离线测试 | `storyboard3d-model-import-and-interaction-panels.md` |
| 93 | — | 分镜3D/视口导航协议·Worker入口·姿态控制器·片段时间轴·场景运行时·导出控制器·导入作业 7 件落地不接线，含已执行离线测试 | `storyboard3d-navigation-timeline-runtime-and-export.md` |
| 94 | R12 | R12/Agent 会话与面板纯叶层 12 件落地不接线，含已执行离线测试 | `agent-conversation-and-panel-leaf-modules.md` |
| 95 | R12 | R12/Agent 技能生命周期·用量快照·工具结果治理纯叶层 8 件落地不接线，含已执行离线测试 | `agent-skill-lifecycle-usage-and-tool-result-policies.md` |
| 96 | R12 | R12/Agent 持久化运行状态·失败诊断·项目长期记忆 3 件纯叶落地不接线，含已执行离线测试 | `agent-durable-run-state-failure-diagnostic-and-project-memory.md` |
| 97 | R12 | R12/Agent 能力路由与参数提示 2 件纯叶落地不接线，含已执行离线测试 | `agent-capability-routing-and-parameter-hints.md` |
| 98 | R12 | R12/Agent 任务绑定运行时最后一件纯叶落地不接线，含已执行离线测试 | `agent-task-binding-runtime.md` |
| 99 | R12 | R12/Agent 空转恢复预算与计划生命周期 OK 层首批 2 件落地不接线，含已执行离线测试 | `agent-loop-recovery-and-plan-lifecycle.md` |
| 100 | R12 | R12/Agent 面板文案·消息时间·助手会话·能力发现·技能创作 OK 层 6 件落地不接线，含已执行离线测试 | `agent-panel-text-presentation-and-capability-discovery.md` |
| 101 | R12 | R12/Agent 回答版本模型 + 会话动作短文案 + 运行步骤与流式呈现 OK 层 4 件落地不接线，含已执行离线测试 | `agent-reply-versions-and-conversation-presentation.md` |
| 102 | R12 | R12/Agent 上下文摘要·外部信息·运行事件日志·技能编辑与两条技能会话运行时 OK 层 6 件落地不接线，含已执行离线测试 | `agent-context-digest-skill-runtimes.md` |
| 103 | R12 | R12/Agent 助手会话运行时 + 摘要·外部信息·技能会话三个卡口件的运行时装配 4 件落地不接线，含已执行离线测试 | `agent-assistant-and-skill-conversation-runtimes.md` |
| 104 | R12 | R12/文本对话·模型请求·会话能力三条组合运行时落地，首次让第103批运行时进入可断言调用链，含已执行离线测试 | `agent-conversation-composition-runtimes.md` |
| 105 | R12 | R12/项目记忆持久层·会话事件日志归一与投影·会话动作条三件落地不接线，含已执行离线测试 | `agent-project-memory-store-session-event-log-and-conversation-actions.md` |
| 106 | R12 | R12/技能弹层选择器·技能注册表内核·轮次分流·技能面板四件落地不接线，含已执行离线测试 | `agent-skill-catalog-picker-panel-and-turn-routing.md` |
| 107 | R12 | R12/会话选项渲染 · 画布搬运运行时 · 能力发现命令 · 预创建节点 · 技能装载五件落地不接线，78 项离线测试全绿 | `agent-conversation-choices-precreate-discovery-skill-loader.md` |
| 108 | R12 | R12/外部工具注册表 + 组合框附件控制器两件落地不接线，39 项离线测试全绿 | `agent-external-tool-registry-composer-attachments.md` |
| 109 | R12 | R12/动作后置条件引擎专批一件落地不接线，34 项离线测试全绿 | `agent-action-postconditions.md` |
| 110 | R12 | R12/会话呈现层专批一件落地不接线，35 项离线测试全绿 | `agent-conversation-presentation.md` |
| 111 | R12 | R12 依赖解锁：模型生成参数记忆纯叶件落地不接线，32 项离线测试全绿 | `model-generation-param-memory.md` |
| 112 | R12 | R12 端口消费方：Agent 模型请求参数装配一件落地不接线，12 项离线测试首跑全绿 | `agent-model-request-params.md` |
| 113 | R12 | R12 依赖解锁：RunningHub 站点 profile 纯叶 + 模型 provider profile 选择两件成组落地不接线，43 项离线测试全绿 | `model-provider-profile-selection.md` |
| 114 | R12 | R12 首批消费者：RunningHub 站点 profile 两件落地不接线，22 项离线测试首跑全绿 | `runninghub-profile-consumers.md` |
| 115 | R12 | R12 链路前置：Provider 连接校验状态机纯叶落地不接线，28 项离线测试全绿 | `provider-connection-verification.md` |
| 116 | — | src/services 启动/保存/对象 URL 六件零 import 纯叶落地不接线 + 撤回一件「OK 假阳性」并固化跨树导出闸门，49 项离线测试… | `services-startup-and-save-primitives.md` |
| 117 | — | src/services 快捷键守卫/启动证据/首屏视觉就绪三件零 import 纯叶落地不接线，36 项离线测试全绿 | `services-browser-guard-and-visual-readiness.md` |
| 118 | — | src/services 图片快预览 + 视频首帧呈现两件零 import 纯叶落地不接线，该目录纯叶清零，50 项离线测试全绿 | `services-image-preview-and-video-frame.md` |
| 119 | R06/R12 | api/ 请求响应工具区 7 个零 import 纯叶落地不接线（新建 api/utils/），57 项离线测试首跑全绿 | `api-request-response-utils.md` |
| 120 | R06 | api/story-generation/ 首批 10 件（8 纯叶 + 2 件依赖 api/utils/）落地不接线，96 项离线测试首跑全绿 | `api-story-generation-leaves.md` |
| 121 | R06 | 分三段。121a：api/story-generation/ 再落 8 件（审片协议、复刻补片、调用证据、原片帧、摘要蓝图、资产提取结果与引用合同）落地不接线，82 项离线测试全绿；121b：再落 3 件（资产需求证据、混合输出预算、分集剧本审时），47 项离线测试全绿；121c：再落 2 件（分集大纲规划、三路并行资产提取，均为依赖注入工厂），34 项离线测试全绿。第 121 批完成 | `api-story-generation-batch121.md` |
| 122 | R06 | 分三段。122a：src/modules/storyWorkspace/ 11 个 0 import 小纯叶（素材提取续跑、首页改写与拖放、复刻角色身份与参考素材、工作区表面等）落地不接线，37 项离线测试首跑全绿；122b：再落 6 个 0 import 数据 / 逻辑件（分集批量拆分执行、工作区存档快照、摘要运行记录、上传剧本解析、视频风格目录、演示数据）落地不接线，46 项离线测试首跑全绿；122c：再落 7 件（素材提取草稿的阻断与付费重跑闸门、悬停预览、片段视频结果、听不清标记、素材库菜单浮层、大纲导航、提示词引用胶囊）落地不接线，73 项离线测试首跑全绿。第 122 批完成 | `src-storyworkspace-batch122.md` |
| 123 | R06 | 分两段。123a：src/modules/storyWorkspace/ 重新分级后，7 件依赖已齐的件（片段导出、截帧、输入槽位、分集剧本批量队列、复刻视频上限、剧本改动守卫、缩略图回填）过扩展导出闸门后落地不接线，69 项离线测试首跑全绿；123b：再落 3 件（片段帧数据、片段制作页渲染、工作区工具栏与页脚渲染）落地不接线，45 项离线测试首跑全绿。第 123 批完成 | `src-storyworkspace-batch123.md` |
| 124 | R10 | 进行中。124a 13件/121例；b冲突/36；c画布绑定/50；d聊天输入/40；e评审DOM/37；f评论线程/35。累计18件/319例，均未接线；124a–f及末尾记账（8fafc80、ba8e9b4、3b8fc6e、3c3b3ae）均已推移植分支，远端master未更新；124g先Activity，NodeReference仍阻塞 | `src-collaboration-batch124.md` |