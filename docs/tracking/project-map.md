# CanvasPro 项目地图

> 由 `docs/TRACKING.md` 维护，是它 §10 的展开版。只在任务涉及不熟悉的子系统时再读。
> 依据：2026-09-25 通过 MCP 只读工具通读 `F:\CanvasPro`，加上本地镜像的静态分析（依赖图、语法检查、行数统计）。文中的数字都截至当天。
> 移植进度、下一步和风险**不在这里**，以 `docs/TRACKING.md` 为准。

---

## 0. 一句话概括

**AI CanvasPro v0.4.12** 是一个「节点式 AI 多模态无限画布」。
- 作者是阿硕（ashuoAI），GitHub 地址 `ashuoAI/AI-CanvasPro`。
- 许可是双授权：非商业可以查看、学习、个人修改，商业使用需要书面授权。
- 前端用 **原生 HTML/CSS/JS（ES Module，无框架、无打包）** 实现画布和各类节点。
- **本地 Python 服务** 负责托管静态资源、代理各家 AI API、处理本地媒体、存储 JSON 与文件。
- 可选的 **Electron 桌面壳** 负责拉起 Python，并提供原生能力：文件、工程包、剪贴板、截图、通知、ffmpeg 媒体任务队列等。

**仓库当前状态**：以 0.4.12 源码为底，按批次把 **0.7.16 安装版**（发布时混淆、后端编译成 exe）的功能改写成可读源码移植进来。
- `docs/` 的记录到第 118 批，另有一份总台账，编号 R01–R26。
- 这些改动**全部未提交**：67 个已跟踪文件被修改，816 个新文件未跟踪。

---

## 1. 规模

统计口径：非空行，不含 `deobfuscated/`、`vendor/`、`venv/`。

| 顶层 | 源文件 | 源码行 | 测试文件 | 测试行 |
|---|---:|---:|---:|---:|
| `src/`（渲染层） | 739 | 223,323 | 292 | 80,483 |
| 根目录单文件（index.html / main.js / server.py / style.css …） | 17 | 34,576 | – | – |
| `electron/` | 153 | 28,477 | 116 | 28,454 |
| `styles/` | 39 | 28,209 | – | – |
| `api/` | 72 | 19,513 | 32 | 16,934 |
| `docs/` | 117 | 12,316 | – | – |
| `backend/` | 27 | 9,962 | 9 | 791 |
| **合计** | **1,167** | **≈35.8 万** | **449** | **≈12.7 万** |

按语言分：JS 约 27.1 万行，CSS 约 5.4 万行，Python 约 1.3 万行，Markdown 约 1.3 万行。

最大的几个文件：
- `style.css`：2.6 万行，是一个整块的样式文件。
- `vendorVideoModelApiManifests.js`：4.8k 行。
- `MediaClipNode.js`：4.7k 行。
- i18n 词条两个文件：各约 4k 行。
- `taskOrchestrationModule.js`（视频节点）：3.7k 行。
- `index.html`：3.4k 行。
- `server.py`：3.3k 行。
- `scene3dBridge.js`：3.1k 行。
- `modelApiResolvers/index.js`：3.1k 行。

---

## 2. 运行形态与进程关系

```
┌──────────── 浏览器 / Electron BrowserWindow ─────────────┐
│ index.html + main.js（原生 ESM，按需 import）              │
│   fetch('/api/**') ─────────┐   window.electronAPI ──────┐ │
└─────────────────────────────┼────────────────────────────┼─┘
                              ▼                            ▼
   ┌──────── Python server.py（http.server 多线程）───┐  ┌──── Electron 主进程 electron/main.js ────┐
   │ 静态文件、/api/v2/proxy/* → 各 AI 厂商            │  │ spawn python server.py --host --port      │
   │ 本地媒体(ffmpeg / PySceneDetect / OpenCV)         │  │  并注入 AIC_LOCAL_TOKEN（随机 64 hex）    │
   │ 项目/资产/工作流/预设/设置 JSON 存储              │  │ 为 /api/* 请求自动加 X-AIC-Local-Token    │
   │ 即梦 CLI、ComfyUI、剧本文档解析、订阅门控、热更新  │  │ 84 个 IPC：工程/剪贴板/截图/导出/任务…    │
   │ 短剧原型 /api/shortdrama/*                        │  │ MediaTaskQueue（ffmpeg/ASR/GIF/成片）     │
   └──────────────────────────────────────────────────┘  │ 网页预览、全局快捷键、通知、更新、诊断    │
                                                          └──────────────────────────────────────────┘
```

| 模式 | 启动方式 | 说明 |
|---|---|---|
| Web | `npm run web`，即 `venv\Scripts\python.exe server.py` | 默认监听 `127.0.0.1:8777`。没有桌面能力，`desktopBridge.isAvailable()` 为 false |
| 桌面 | `npm run desktop`，即 `set AICANVAS_PORT=8778 && electron .`；`desktop:solo` 用默认的 8777 | 先探测端口：已有服务就**复用**，否则清理端口后拉起 Python，再 `loadURL('http://127.0.0.1:<port>/')` |
| chrome-shell | 0.7.16 的新运行时：外部 Chrome 加 CDP 管道，配合 `/api/v2/desktop/*` HTTP 桥 | 宿主模块（chromeShell*、desktopHttpBridge）**已移植但未接线**。桥只在 IPC `desktop-bridge:start` 被调用时启动，而 preload 没有暴露这个通道 |

需要注意：
- 桌面模式拉起的 Python 带有 token。这时如果用浏览器直接打开同一个端口，敏感 API 会返回 403。
- Web 模式没有 token，靠 Origin 和回环地址校验放行。

---

## 3. 渲染层（前端）

### 3.1 启动流程（`main.js`，585 行）

1. 初始化基础服务：i18n、toast、桌面桥兼容、诊断、外链、键盘、浮动菜单键盘、右键菜单、任务中心、tooltip、桌面媒体唤醒、服务器连接监控。
2. 调 `/api/v2/runtime/info`，得到 isDevBuild 和 isAdvancedMode 两个开关。
3. 用 **`registerNode(type, Class)`** 注册 23 种节点类型（对应 22 个组件类），同时注册 `nodeMeta` 里的别名。
4. `initRenderer(wrap, canvas, appStore)` → 渲染器 UI 事件 → 网页预览视图同步 → store 运行时副作用。
5. `bootstrapAppProject`：加载项目，迁移旧缩略图，规范化文件名等。
6. `initAppShellUi`：小地图、网格点、吸附。
7. `createAppViewport`：缩放和聚焦。
8. 懒加载 AssetManager、WorkflowManager、GenerationHistoryFileManager。
9. `initAppNodeEntry`：添加节点菜单。
10. `installAppCanvasPointerBindings`：把指针、滚轮、右键事件接到 interaction 层。
11. 构建 **画布命令上下文**，包括 `executeCanvasCommand` 和 `executeCanvasCommandPlan`；接着创建 **Agent 运行时** 和 Agent 面板（悬浮按钮）。
12. 安装几个桥：全局截图（截图直接落成画布节点）、全局文本预设、完成通知点击跳回节点。
13. `createAppBusinessEvents`：快捷键和业务命令。
14. `createAppTopbarAndConfig`：API 配置和即梦登录。
15. `createAppPanels`：订阅/VIP 面板等。
16. 初始化 CanvasProjectDropdownManager、SettingsManager、MascotManager、AutoUpdate，最后标记 chrome-shell 启动就绪。

### 3.2 状态管理（`src/core/stores/`）

- **`legacyKernelStore.js`**（约 2k 行）：一个大一统的内核 store，定义 state 和全部 action。
- **`facadeStore.js`** 按 key 把 state 切成三个领域 store，走的是逐步替换旧代码的重构路线：

| store | 负责的 state |
|---|---|
| `graphStore` | viewport、nodes、edges、`_parentToChildren`、selectedNodeIds、selectionBox、connOverlay、`_persistRev` / `_edgesRev` |
| `uiStore` | isServerConnected、picker、contextMenu、pickConnectMode、annotate / matting / videoKeying / videoClip 这几个编辑模式、theme，以及 `ui.*` 偏好（对齐、吸附、连线显示、工具栏布局…） |
| `workspaceStore` | subscription、assets、workflows、workflowUi |

- graphStore 的 action 包括：batch、addNode、moveNodes、deleteNodes、updateNodeData(s)、addEdge / removeEdge、updateViewport、groupNodes、getSourcesForNode、serialize / hydrate、getHistorySnapshot / loadHistorySnapshot 等。
- **撤销/重做**（`src/modules/history.js`）：快照栈，保存 `{nodes, edges}`，最多 50 步。每次业务操作之后调 `commit()`。

### 3.3 节点系统

- **组件约定**：节点组件是一个普通 class。`constructor(nodeData)` 接收数据，`mount()` 返回 HTMLElement，另外实现 `update(nodeData)` 和 `unmount()`。未注册的类型会回落到 `_FallbackNodeComponent`，显示成「未知节点」。
- **节点数据**：扁平对象，形如 `{id, type, x, y, width, height, name, parentId, _bizRev, …各类型的业务字段}`。例如 storyboard 节点带 `cells`，storyboard-script 节点带 `storyboardScript`。
- **边**：`{id, sourceId, targetId, …}`。节点的输入就是所有入边的源节点，再由 `modelInputPolicy` 按模型 manifest 的 `inputSlots`（允许的类型、各类型数量上下限）过滤。
- **类型和别名**定义在 `src/modules/nodeMeta.js`，每种类型还有 wrapperClasses、refKind、beta 标记。

| 分类 | 节点类型 |
|---|---|
| 源素材 | `source-text` / `source-image` / `source-video` / `source-audio` |
| AI 生成 | `ai-image`（AIGenerateNode）/ `ai-text` / `ai-video` / `ai-audio` |
| 编辑与编排 | `media-clip`（时间线剪辑，beta）、`scene-detection`、`collage`（拼图）、`whiteboard`（白板）、`group`、`comment-note`（便签）、`debug` |
| 分镜与剧本 | `storyboard`（宫格分镜）、`storyboard-script`（分镜脚本）、`story-workspace`（剧本工作室） |
| 3D | `panorama-scene`（3D 导演台）、`panorama-360`（360 全景图），都基于 three.js |
| 网页 | `web-preview`（内嵌浏览器，beta）、`web-reference-card` |
| 外部工作流 | `comfyui-workflow` |

- 大节点按职责拆成了模块：
  - 图片节点：`aigenImage/{uiModule, uiSchemaRenderer, taskOrchestrationModule, stateSyncModule, fixedImageRefBar …}`
  - 视频节点：`video-node/{parameterPanelModule, referenceInputModule, resultRenderModule, taskOrchestrationModule …}`
- 节点工具栏在 `src/components/nodeToolbar/`：
  - **图片**：标注、裁剪、扩图、高清、抠图、多宫格、360 全景、自动主体、自由视角等。
  - **视频**：剪辑、抠像、补帧、高清、倒放、音画分离、智能剪辑、抽关键帧等。

### 3.4 渲染与交互

- `src/core/renderer.js`（2.8k 行）用 DOM 渲染节点，做了**视口虚拟化**：
  - 节点只在视口外扩的一圈范围内挂载，另有 keep-alive 名单。
  - 空间索引和边可见性索引，用来加速命中和绘制。
  - 快速预览层：低缩放时用栅格代理图代替真实节点。
  - 媒体懒加载和 LOD，节点细节延迟填充。
- `src/core/interaction.js` 加上 `src/modules/interaction/*` 负责交互：DragController（2k 行）、EdgeController（连线，2.8k 行）、Selection、Zoom、PanoramaSceneInteraction、右键菜单。
- `src/modules/app/*` 是 main.js 调用的装配层，把以上各部分粘在一起：
  - appViewport、appCanvasPointerBindings
  - canvasNodeFlows：创建节点、粘贴、拖入导入
  - appBusinessEvents、appTopbarAndConfig、appPanels
  - projectBootstrap、projectLifecycle（1.6k 行）

### 3.5 项目与持久化

**项目 = 多画布**，由 `CanvasTabManager` 管理：

```js
{ canvases: [ { id, name, nodes, edges, viewport, ... } ], activeCanvasId }
```

| 存到哪里 | 方式 |
|---|---|
| Web 模式 | Python 接口 `/api/v2/projects[/save]`，文件在 `user/Canvas Project/` |
| 桌面模式 | IPC `project:open/save`，存成 `.aicanvas`（兼容 `.aicproj` 和 `.json`），并维护最近文档 |
| 工程包 | `.aicpkg`，内容是 manifest、`project/project.aicanvas` 和 assets，用 yazl / extract-zip 打包解包；支持「全部画布收集」和「独立恢复」 |
| 崩溃恢复 | Electron 写恢复快照，带工程归属和修订号守卫 |
| 浏览器缓存 | IndexedDB 分片（`projectLifecycle.buildWorkspaceShardRecords`） |

媒体文件放在这些位置：
- 上传的文件：`data/uploads`
- 生成结果：由 `/api/v2/save_output_from_url` 把远程结果下载到本地 `output/`
- 视频缩略图：`output/VideoThumbs`
- 图片衍生图（缩略图、预览档）：媒体根目录下的 `_derived/<variant>/`，通过 `/api/v2/images/derivatives/ensure` 按需生成
- 存储路径可以在设置里修改，迁移时只复制、不移动。

### 3.6 AI 生成链路（核心数据流）

```
节点 UI（选模型、写 prompt、设参数、接入上游）
  → manifests 解析出 Model 与 Execution
  → api/ai{Image,Video,Text,Audio}Api.js 按 adapter 构造请求
      (ModelApiManifestNormalizer / RunningHubAdapter / PpioAdapter / modelApiResolvers / runninghubWorkflowResolvers)
  → api/requester.js（超时、重试、取消、带 X-AIC-Install-Id）
  → 本地 Python：/api/v2/proxy/image | completions | task | upload | apimart-upload
      （请求体里带 apiUrl + apiKey，Python 加上 Bearer 转发给厂商，顺带解决 CORS；
        失败重试、快速探测 task_id、把 SSE 规范化、对部分工作流做 VIP 门控）
  → src/core/generationTaskRuntime.js：submitTask → pollTask → 结果 patch 写回节点
      （同一任务不重复提交；cancelTask 取消；resumeTask 在刷新或重开后按 taskId 继续轮询）
  → 完成后播放提示音、弹系统通知（点击跳回节点），结果保存到本地 output
  → 出错时由 api/errors/parsers/* 按厂商解析成 ApiError（给用户看的文案 + 是否可重试）
```

**模型用声明式 manifest 描述**（`src/manifests/modelRegistry.js`，每个模型配一份 Model 和一份 Execution）：
- Model manifest：modelId、provider、kind、adapterType、uiSchema（参数表单）、inputSlots、capabilities。
- Execution manifest 分三种 `adapterType`：
  - `workflow`：RunningHub 工作流，字段有 workflowId、节点映射 mapping、结果路径 result。
  - `modelApi`：各厂商的直连 API，字段有 endpoint、body/response mapping、taskPolling。
  - `localRuntime`：比如即梦走本地 CLI。

**接入的厂商**：

| 厂商 | 说明 |
|---|---|
| APIMart | 多媒体模型聚合，图床上传也走它 |
| GRSAI | — |
| RunningHub | 分两类：`runninghub` 是模型 API，`runninghubwf` 是工作流和 AI 应用 |
| 火山引擎 | — |
| PPIO | 按记录在逐步移除 |
| Agnes | — |
| 即梦 / Dreamina | 本地 `dreamina.exe` CLI，扫码登录 |
| OpenAI 兼容 | 自定义接入（`aicanvas` / `openai`） |
| ComfyUI | 本地实例，只允许白名单里的端点 |
| 免费图床 | — |

- ASR：百炼、豆包云端识别；本地 funasr 和 sortformer 还在移植中。
- **密钥存储**：provider 的 `apiKey` / `modelApiKey` 在桌面模式下优先存进 Electron safeStorage（加密）；否则随配置经 `/api/config` 写入 `user/config.json`，读出来的公开配置会给 key 打码。

### 3.7 AI 助手（Agent）

入口：main.js 里的 `createAgentRuntime` 和 `initAgentPanel`（右下角悬浮按钮）。

工作模式是**先规划、再执行**：

```
用户消息
  → buildAgentContext：画布摘要、选中节点、可用模型（来自 manifest）、命令 schema、技能
  → api/agentApi.js 的 requestAgentActionPlan：让配置好的文本模型输出一份严格的 JSON 计划
  → validateAgentPlan 校验
  → 计划状态：chat / need_clarification / need_confirmation / ready / …
  → executeAgentActions 调用画布命令总线执行
```

- **画布命令**（`src/modules/canvasCommands`）：
  - `node.*`：create、delete、duplicate、rename、select、setPrompt、appendPrompt、setParams、setInputSlot、getSummary
  - `graph.*`：connect、disconnect、getSelection、getCanvasSummary
  - `layout.*`：align、distribute、arrangeRow、arrangeColumn、arrangeGrid、moveNearNode
  - `viewport.*`：fitAll、focusNodes
  - `generation.*`：run（**必须经用户确认**）、cancel、resume、getStatus
- **技能**：`agentSkillCatalog` 加 SKILL.md 包格式；桌面端可以从文件夹安装和托管技能。
- **接线情况**：`src/modules/agent/` 共 80 个模块，**只有 13 个接进了运行时**。剩下 67 个是 0.7.16 的会话运行时、项目长期记忆、能力路由、后置条件、空转恢复等，都已移植但**没有接线**。

### 3.8 其他功能模块

| 模块 | 说明 |
|---|---|
| **剧本工作室** `storyWorkspace/` | 33 个文件，全部已接线。<br>• DOCX/PDF 导入：Python 在受限 worker 里抽取文本<br>• AI 拆集、资料提取、分镜，走多厂商文本模型<br>• 串行分镜队列：最多 6 项，IndexedDB 自动保存<br>• 镜头媒体生成与采纳、首帧参考视频<br>• 初剪：媒体任务 `storySequenceExport` |
| **3D** | `panoramaSceneNode/`（3D 导演台和 360 全景，已接线）。<br>`storyboard3d/`：导演相机、时间线、glTF 导入、姿态等，45 个里 43 个未接线 |
| **媒体编辑** | MediaClipNode（时间线剪辑和导出）。<br>视频相关控制器：剪辑、抠像（VideoKeying）、音频剪辑、音频分离、视频合成、倒放。<br>图片相关控制器：标注、抠图、裁剪、扩图、自由视角 |
| **素材 / 工作流 / 历史** | AssetManager（素材库）<br>WorkflowManager（把节点组存成模板、一键应用）<br>GenerationHistoryFileManager（生成历史）<br>TaskCenterManager（任务中心，支持媒体任务的查询和取回） |
| **提示词** | promptPresets（预设，`/` 呼出菜单）、`@` 引用素材、nodePromptShared（提示词框的公共逻辑） |
| **设置** | SettingsManager 和 `settings/*`：外观、对齐、提示音、诊断、文件保存路径与迁移、本地素材清理、节点行为、面板等。<br>`apiSettings.js` 只是个空桩，API 配置界面在 appTopbarAndConfig |
| **订阅/VIP** | `subscriptionAccess.js` 加 `subscriptionGateManifest.json`，门控 8 个 RunningHub 高级工作流（视频编辑 V5.4 / BERNINI / Scail、视频高清、商业级数字人等）。<br>后端按 install id 和激活码（cdkey）向官方授权服务校验 |
| **i18n** | `src/i18n`：zh-CN 和 en-US，`t('key')`，被 182 个模块引用，是全项目被依赖最多的模块 |
| **短剧原型** | `backend/shortdrama_*.py`、`db/migrations`、`knexfile.cjs`（SQLite，路径 `%APPDATA%\CanvasPro\shortdrama.db`）。<br>现在是用确定性占位逻辑加 ffmpeg 纯色帧跑通的单集闭环，**没有前端界面** |

---

## 4. Electron 主进程（`electron/`）

**启动顺序**（`startApp`）：
1. 注册本地预览协议。
2. 注册全部 IPC。
3. 预热浮层捕获窗口。
4. 创建主窗口，同时装菜单和 token 请求头。
5. 注册全局截图和文本预设快捷键。
6. 处理外部打开的工程。
7. 清理端口，确保 Python 在运行。
8. 启动 keep-alive，加载画布。

主进程是单实例，退出时会停掉 Python，并清理快捷键和阻止休眠的锁。

**preload 暴露的 API**：
- `window.aiCanvasDesktop`：小工具集。
- `window.electronAPI`：按能力分组。

| 分组 | 能力 |
|---|---|
| 应用与更新 | 版本、设备 ID、检查/下载/安装更新 |
| `project` | 打开、保存、最近文档、导入导出工程包、恢复快照、外部打开 |
| `clipboard` | 读写文本、图片、文件引用 |
| `screenshot` / `textPreset` | 全局截图、划词文本预设 |
| `secureSettings` | 加密存取敏感设置 |
| `customAiApps` / `agentInformation` / `agentSkills` | Agent 相关 |
| 素材导入 | importAsset、importRemoteAsset |
| 导出 | `timelineExport`（Premiere/FCP7 XML、剪映）、`nodeExport`、`nodeMediaExport` |
| `mediaTask` | 入队、取消、列表、进度、历史 |
| `webPreview` | 视图同步和控制 |
| `diagnostics` | 事件日志、诊断包、打开日志目录 |
| `notification` / `notificationSound` | 完成通知、提示音 |
| `localAssetCleanup` | 扫描、移入回收站 |
| shell / dialog | 打开外链、在文件夹中显示、选择目录 |

以上共 **84 个 invoke 通道**。

**MediaTaskQueue**（`mediaTaskQueue.js` 和 `mediaTasks/*`）：
- 队列支持优先级、去重、spawn 重试和超时。
- 任务种类：
  - 视频：videoCut、videoCompose、videoAudioMux、videoAudioSeparate、videoReverse、videoToGif、videoFirstFrame、videoPoster
  - 音频：audioCut、audioCompose、audioWaveform
  - 成片与剪辑导出：mediaClipExport、storySequenceExport
  - 语音工作室：audioVoiceAnalyze、audioVoiceCompose、recordingTranscribe
  - ASR 运行时：asrRuntimeInstall、funasr*，以及对应的模型准备任务
- 执行时通过 ffmpegVideoEncoderRuntime 调用 ffmpeg / ffprobe。

**其他主进程模块**：
- `webPreviewViewManager.js`（1.8k 行，WebContentsView，含抖音解析）
- 截图浮层、全局捕获窗口、划词捕获
- 工程包服务（projectPackageService），节点导出服务（nodeExportService）
- 资产能力层：原图存储、衍生图 worker、资产索引
- 诊断（diagnostics.js）、updaterController（electron-updater）、备份与恢复快照、Windows 任务栏进度等

---

## 5. Python 后端（`server.py` + `backend/`）

**`server.py`**（3.3k 行）基于 `http.server.SimpleHTTPRequestHandler` 和 `ThreadingTCPServer`，**没有第三方 Web 框架**。

**路由顺序**，GET 和 POST 都一样：
1. 本地访问安全检查
2. ComfyUI
3. 剧本文档（仅 POST）
4. `HttpRouteDispatcher`，分发给各个 service
5. `/api/shortdrama/*`
6. server.py 里内联的老路由：proxy/image、completions、chat、apimart-upload、智能剪辑等
7. 以上都不匹配，就当静态文件处理

**backend/services 分工**：

| 服务 | 职责 |
|---|---|
| config_route_service | `/api/config` 读写，公开读取时给 key 打码 |
| json_file_route_service / library_file_route_service | 项目、预设、工作流、用户设置等 JSON 与资料库 |
| media_file_route_service | save_output(_from_url)、图片衍生图、宫格裁切 |
| local_media_processing_route_service | 视频/音频剪切合成、首帧、元数据、倒放、音画分离、分镜抽帧、智能剪辑（PySceneDetect） |
| remote_proxy_route_service | proxy/task、proxy/upload、RunningHub 工作流运行、查询、取消 |
| dreamina_cli_service / dreamina_route_service | 即梦 CLI（2.5k 行）：扫码或网页登录、文生图、图生图、文生视频、图生视频、多帧、多模态、队列 |
| comfyui_route_service | ComfyUI 适配，端点走白名单 |
| story_document_* | DOCX/PDF 纯文本抽取，在资源受限的子进程 worker 里执行 |
| subscription_client / gate_service / gate_manifest | 订阅状态、激活码激活、VIP 门控 |
| hot_update_service | 每 30 分钟检查一次 GitHub 上的 `latest.json`，“热更新”走 git（会 `git reset --hard`，见 `docs/TRACKING.md` §8） |
| file_save_migration / legacy_storage_import | 存储路径迁移：只复制、不移动；只读预览旧的默认目录 |
| funasr / sortformer / outbound_http_transport | ASR 转写、说话人分离、统一 TLS 出站（从 0.7.16 原样搬来） |

**安全模型**：
- 默认只绑定 `127.0.0.1`。想开放到局域网，必须显式加 `--lan`，并用 `AIC_ALLOWED_ORIGINS` 配置可信 Origin；否则写了 0.0.0.0 也会退回 127.0.0.1。
- 访问敏感前缀（config、projects、proxy、video、user、workflows …）时：
  - 如果设置了 token，必须带 `X-AIC-Local-Token` 或 Bearer token；
  - 否则要求 Origin 在白名单里，或者请求来自回环地址。

---

## 6. 测试、构建与工具

- **JS 测试**：统一用 Node 内置的 `node:test` 加 `node:assert/strict`，440 个 `*.test.js` 和源码放在一起。`package.json` 里**没有 test 脚本**，要手动 `node --test <文件或目录>`。
- **Python 测试**：`backend/services/test_*.py`，用 unittest，全部离线运行。
- **Playwright**：`playwright.config.js` 指向 `./e2e`，由 `tools/e2e-static-server.mjs` 在 4173 端口提供页面。但仓库里**既没有 `e2e/` 也没有 `tools/`**，这套配置跑不起来。
- **构建**：渲染层没有构建步骤，浏览器直接加载 ESM。打包用 electron-builder；GitHub Actions 里有一份 mac-arm64 工作流，会内置 python-build-standalone 和 ffmpeg。
- **2026-09-25 的静态检查**：
  - 在修正后的完整镜像上，1390 个 JS 文件在 Node 20 下 `node --check` **全部通过**。
  - 所有 Python 文件都能被 `ast.parse` 正常解析。
  - 这里只检查了语法，没有执行测试。

---

## 7. 按需求找代码

| 想做的事 | 从这里开始 |
|---|---|
| 新增或修改节点类型 | `main.js` 的 NODE_COMPONENTS → `src/components/XxxNode.js` → `src/modules/nodeMeta.js` → `nodeCreationMenuCatalog.js` → i18n |
| 新增或修改模型 | `src/manifests/**`（Model + Execution）→ `api/adapters/*` / `modelApiResolvers` → 如有需要再改 `server.py` 的 proxy |
| 生成任务的状态和恢复 | `src/core/generationTaskRuntime.js`、`generationTaskLifecycle.js`、各节点的 `taskOrchestrationModule` |
| 画布数据和撤销 | `src/core/stores/*`、`src/modules/history.js` |
| 保存、打开、工程包 | `src/modules/CanvasTabManager.js`、`app/projectLifecycle.js`、`src/services/projectService.js` / `desktopProjectService.js`、`electron/projectPackageService.js` |
| 桌面能力 | `electron/preload.cjs` → `electron/ipc/*` → `electron/main.js` / `mainIpcSetup.js` |
| 本地媒体处理 | 桌面：`electron/mediaTasks/*`；Web：`backend/services/local_media_processing_route_service.py` |
| Agent | `src/modules/agent/{agentRuntime,agentContextBuilder,agentPlanValidator,agentPanel}.js`、`api/agentApi.js`、`src/modules/canvasCommands/*` |
| 剧本工作室 | `src/modules/storyWorkspace/*`、`api/storyAiApi.js`、`backend/services/story_document_*` |
| 后端路由 | `server.py` 的 `Handler.do_GET/do_POST` → `backend/services/http_route_dispatcher.py` |
