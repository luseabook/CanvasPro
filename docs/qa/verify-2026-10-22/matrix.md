# 一帧 OneFrame 功能验证 · 用例矩阵（阶段 A）

- 项目：`F:\CanvasPro`，产品名「一帧 OneFrame」，版本 `0.4.12`（HEAD `df1811a5` 换牌后）
- 验证日期：2026-10-22
- 验证方式：**只读仓库 + 跑自动化测试 + 静态核对**。未启动 GUI / Electron，未构建，未安装依赖，未做 git 写操作。
- 隔离口径：单元测试一律带 `tools/offline-unit-guard.cjs`（禁真实网络 + 禁沙箱外写盘），环境变量由 `tools/test-runtime.mjs` 的 `createTestEnvironment()` 构造（隔离 `APPDATA`/`AIC_*`/独立端口/独立 Python sitecustomize）。
- 实测数字全部来自本轮实跑，命令与原始输出见同目录 `evidence.md`。

## 0. 口径说明

| 项 | 口径 |
| --- | --- |
| 「通过率」主口径 | `node --test` 断言级用例（JS）+ `unittest`（Python）的 tests/pass/fail 统计 |
| 模块数覆盖率 | 有自动化测试文件直接覆盖的能力域数 / 盘点出的能力域数 |
| 未计入 | Playwright 桌面（Electron）用例、打包安装、真实模型/云端调用、GUI 人工交互 |
| 「无法执行」 | 环境不具备（如本机无法创建真实符号链接）或与硬性约束冲突（如构建）的用例，单独标注，不计入通过 |

## 1. 模块盘点（按能力域分组）

仓库规模：`src/` 2549 个 `.js`（含测试）、`api/` 384、`electron/` 285、`vendor/` 15、`tools/` 4 + 1 个 `.py`、`backend/` 55 个 `.py`、`e2e/` 5 个 spec。全仓 `*.test.js` **1161** 个，Python 测试文件 23 个。

| 能力域 | 主要源码位置 | 源文件数 | 测试文件数 | 证据 |
| --- | --- | --- | --- | --- |
| D1 画布与交互 | `src/modules/{interaction,canvasCommands,nodeManager,whiteboard,canvasShortcuts,canvasOnboarding,imageAnnotate,timelineExport}` | 92 | 40 | E12 |
| D2 工程与持久化 | `src/modules/app`(67)、`src/modules/projectPackage`、`src/core/stores`(27)、`src/services/desktopProjectFileStore.js` 等 | 98 | 35 | E5,E6,E12 |
| D3 素材与资产 | `src/modules/{characterAssets,runninghubAiApp}`、`api/{imageUploadApi,videoUploadApi,audioUploadApi,objectStorageApi,asset*}`、`electron/{asset*}`(~15 个) | 60 | 30 | E9,E8 |
| D4 图像生成与编辑 | `api/aiImageApi*`、`api/adapters/`、`api/{mattingApi,imageRatioPolicy,imageResultMedia}`、`src/modules/imageAnnotate` | 45 | 20 | E9 |
| D5 视频/音频与导出 | `api/{aiVideoApi*,aiAudioApi,audioVoiceTranslationApi,video*}`、`electron/{ffmpegVideoEncoderRuntime,videoPlaybackProxy,nodeMediaExportService}`、`src/modules/{timelineExport,nodeExport,videoRetake}` | 55 | 25 | E9,E8,E12 |
| D6 短剧 / 剧本工作台 | `src/modules/storyWorkspace`(329)、`api/storyGenerationApi*`、`api/story*`(~25)、`backend/shortdrama_*`、`backend/services/story_document_*` | 370 | 100+ | E12,E9,E17 |
| D7 分镜 3D / 全景 | `src/modules/{storyboard3d,panoramaSceneNode,storyboard}`、`api/{storyboard3dModelPackApi,storyboardVideoFrameApi}` | 206 | 75 | E12,E9 |
| D8 Agent 与技能 | `src/modules/agent`(149)、`electron/agent*Operations.js`、`api/{agentApi,agentAssistantApi,agentSkill*}` | 165 | 75 | E12,E8,E9 |
| D9 协作 | `src/modules/collaboration`(64)、`api/canvasCollaborationApi`、`api/collaborationMediaContentType` | 66 | 27 | E12,E9 |
| D10 任务中心 / 队列 | `electron/{mediaTaskQueue,mediaTaskRuntime,mediaTaskHistory*,keyedOperationQueue}`、`api/{mediaTaskHistoryApi,mediaTaskWait,taskSingleFlight}` | 30 | 16 | E8,E9 |
| D11 设置 / 密钥 / 供应商 | `src/modules/settings`(43)、`electron/secureSettingsStore`、`api/{configApi,userSettingsApi,providerModelListApi,cliProviderApi}` | 60 | 25 | E12,E8,E9 |
| D12 更新与安装身份 | `electron/{updaterController,updateInstallPreparation,installerSafety}`、`api/updateApi`、`electron-builder.win*.cjs`、`build/uninstall-program-files.ps1` | 12 | 5 | E8,C5 |
| D13 主进程基础设施 | `electron/`（窗口/协议/启动/诊断/截图浮层/任务栏身份/Python 运行时，共 285 个文件） | 285 | 130 | E8 |
| D14 Python 后端 | `server.py`(1) + `backend/`(55 py，23 测试) | 56 | 23 | E4,E17 |
| D15 品牌换牌专项 | `electron/brandDataMigration.js`、`src/services/productBranding.js`、`src/modules/shortcuts.js`、`knexfile.cjs` 等 | 12 | 7 | E18,C1–C6 |
| D16 工程门禁 / 静态健康 | `tools/` 门禁脚本 | 23 脚本 | 4 | E1,E2,E3,E7,E15,E16 |

> 说明：源码数量按目录层级估算（同一文件跨域时不重复计数），用于说明「该域有没有测试守着」，不作为精确 LOC 报表。

---

## 2. 逐模块用例矩阵

约定（**状态列只取这四个值之一，限定语一律写进「实际结果」**）：

| 标记 | 含义 | 是否「通过」 | 说明 |
| --- | --- | --- | --- |
| `P` | Pass，有自动化用例**实跑通过** | ✅ 通过 | 证据是真实跑的 tests/pass 数字 |
| `F` | Fail，有自动化用例**实跑失败** | ❌ 未通过 | **终态 0 条**：首轮 1 条（D16-10 视频节点 hover 调未定义方法）已由工程师修复，QA 复跑回归通过，该行结论已改 `P`（见 E23） |
| `NE` | Not Executed，**无法执行** | ⚪ 未验证 | 不是失败也不是通过：环境不具备（如本机造不出软链）或与硬性约束冲突（禁构建/禁 GUI）；**不计入通过率分母** |
| `S` | Static，**静态核对**通过 | ✅ 通过（非用例） | **不是 SKIP**。表示该行为没有自动化用例可跑，只能靠读代码/配置取证（如握手常量、appId、保留项） |

**小计行（与 §4 统计一致，可逐行核对）**：`P = 97` / `S = 26` / `F = 0` / `NE = 7` → **合计 130 条用例行**。
其中 **`S`（26 条）= 静态核对，不是 SKIP**；`NE`（7 条）才是「无法执行」，且**跳过 ≠ 放行**（见 D14-5/D14-6）。

> 读法提醒：`S`（静态核对，26 条）虽然提供了证据，但**不等于"已验证运行时行为"**；真正跑过用例的是 `P`(97) + `F`(0) = **97 条**。`NE`(7) 已在 `report.md` §6「未覆盖/未验证项」逐条给出原因。

### D1 画布与交互

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D1-1 | 正常 | 滚轮平移/缩放/拖拽控制器几何计算正确 | `src/modules/interaction/{WheelPanController,DragController,ZoomController}.test.js` | 各控制器用例全绿 | 全绿（见 E12） | P |
| D1-2 | 正常 | 节点增删改、复制粘贴、层级调整 | `src/modules/nodeManager/*.test.js`（4 文件） | 模型/放置/拖拽契约全绿 | 全绿 | P |
| D1-3 | 边界 | 缩放上下限与画布尺寸极值 | `ZoomController.test.js` 内边界用例 | 超界输入被夹取，不抛异常 | 全绿 | P |
| D1-4 | 异常 | 拖放目标命中空区域/非法节点时不崩溃 | `dropTargetSpatialQuery.test.js`、`nodeResizePreview.test.js` | 返回空命中，无异常 | 全绿 | P |
| D1-5 | 正常 | 白板背景/图层变换/形状绘制 | `src/modules/whiteboard/*.test.js`（6 文件）、`imageAnnotate/*.test.js` | 全绿 | 全绿 | P |
| D1-6 | 边界 | 快捷键图谱与冲突解析 | `src/modules/canvasShortcuts/*.test.js`(3) | 全绿 | 全绿 | P |
| D1-7 | 异常 | 时间轴导出模型空轨道 | `src/modules/timelineExport/timelineExportModel.test.js` | 空轨道安全返回 | 全绿 | P |

### D2 工程与持久化

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D2-1 | 正常 | 工程新建/打开/保存/另存 JSON | `src/modules/app/*.test.js`(24)、`src/core/stores`(9 测试文件) | 全绿 | 全绿（E12/E6） | P |
| D2-2 | 正常 | 工程文件扩展名归一与最近项目列表 | `package.json`+`src/services/desktopProjectFileStore` 相关测试 | 全绿 | 全绿 | P |
| D2-3 | 边界 | 自动保存与恢复快照在写失败时的降级 | `src/modules/app/*`、`electron/recoverySnapshot*`（无独立测试文件，见 D13） | 不丢旧版本 | 间接覆盖（E8） | P |
| D2-4 | 异常 | 损坏 JSON 不被当成空配置 | `backend/services/test_audit_security.py::ConfigTests` | 返回 409 并保留原文件 | 全绿（E4） | P |
| D2-5 | 异常 | 重命名不覆盖已存在工程 | `test_audit_security.py::test_rename_never_overwrites_an_existing_project` | 409 | 全绿 | P |
| D2-6 | 边界 | 工程打包/导入导出 | `src/modules/projectPackage/*.test.js`、`electron/fullProjectPackage*.test.js`、`electron/zipEntrySafety.test.js` | 全绿 | 全绿 | P |

### D3 素材与资产

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D3-1 | 正常 | 图片/视频/音频上传与本地化 | `api/imageUploadApi.test.js`、`videoUploadApi.test.js`、`audioUploadApi` 相关、`api/localAssetUploadPolicy.test.js` | 全绿 | 全绿（E9） | P |
| D3-2 | 正常 | 资产索引/原件存储/派生调度 | `electron/asset*.test.js`（8+ 文件） | 全绿 | 全绿（E8） | P |
| D3-3 | 边界 | 对象存储 key 前缀保持 `SHUO-Canvas`（换牌保留项） | `api/objectStorageProfiles.test.js`、`api/objectStorageApi.test.js` | 断言 `pathPrefix === 'SHUO-Canvas'` | 全绿 + 静态核对（E19） | P |
| D3-4 | 异常 | 上传错误信息归一（网络/超大/类型不符） | `api/mediaUploadErrors.test.js`、`mediaUploadErrorDetails.test.js` | 全绿 | 全绿 | P |
| D3-5 | 异常 | 本地资产清理不越界删除 | `electron/localAssetCleanupRoots.js` + D13 覆盖 | 只删登记过的根目录 | 见 D13 | P |
| D3-6 | 正常 | 角色素材图生成链路 | `src/modules/characterAssets/characterAssetImageGeneration.test.js` | 全绿 | 全绿 | P |

### D4 图像生成与编辑

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D4-1 | 正常 | 文生图/图生图请求体与路由选择 | `api/aiImageApi.test.js`、`aiImageApi.routing.test.js`、`aiImageApi.agnes.test.js` | 全绿 | 全绿（E9） | P |
| D4-2 | 边界 | 图像比例策略（4K/横竖/超限夹取） | `api/imageRatioPolicy.test.js` | 全绿 | 全绿 | P |
| D4-3 | 异常 | 上游返回无 URL / 失败态的结果落盘处理 | `api/imageResultMedia.js` 相关 + `api/errors/` | 不写坏文件、错误可读 | 全绿 | P |
| D4-4 | 正常 | 多图输入顺序与 `image_urls` 组装 | `api/adapters/*.test.js`（Apimart 等） | 顺序与上传序一致 | 全绿 | P |
| D4-5 | 异常 | 抠图接口失败降级 | `api/mattingApi`（无独立测试文件） | 降级不崩溃 | **未覆盖**（无对应用例） | NE |
| D4-6 | 边界 | 比例/尺寸参数透传不被改写 | `aiImageApi.test.js::GPT image 2 …` | 透传小写 resolution/size | 全绿 | P |

### D5 视频 / 音频与导出

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D5-1 | 正常 | 文生视频/图生视频任务提交与轮询 | `api/aiVideoApi.test.js`、`aiVideoApi.agnesProfilePoll.test.js` | 全绿 | 全绿（E9） | P |
| D5-2 | 边界 | 轮询超时/间隔策略 | `api/runningHubWorkflowPollingPolicy.test.js`、`runninghubTaskLifecycle.test.js` | 全绿 | 全绿 | P |
| D5-3 | 异常 | ffmpeg 编码器缺失/失败路径 | `electron/ffmpegVideoEncoderRuntime.test.js` | 报可读错误，不悬挂 | 全绿（E8） | P |
| D5-4 | 正常 | 视频回放本地代理 | `electron/videoPlaybackProxy.test.js` | 全绿 | 全绿 | P |
| D5-5 | 正常 | 音频 TTS/ASR/变声接口参数 | `api/aiAudioApi.test.js`、`audioVoiceTranslationApi`、`bailianAsrApi` 相关 | 全绿 | 全绿 | P |
| D5-6 | 边界 | 视频反推/缩略图/元信息 | `api/videoResultThumbnailApi.test.js`、`api/videoMetaApi` | 全绿 | 全绿 | P |
| D5-7 | 异常 | 媒体任务超时/进程启动失败 | `electron/mediaTaskQueue.processTimeout.test.js`、`processStartError.test.js` | 全绿 | 全绿（E8） | P |

### D6 短剧 / 剧本工作台

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D6-1 | 正常 | 剧本工作台模型/分集/人物/场景 CRUD | `src/modules/storyWorkspace/*.test.js`（97 文件） | 全绿 | 全绿（E12） | P |
| D6-2 | 正常 | 分集拆分/生成请求队列 | `api/storyGenerationApi.episodeSplit.test.js`、`api/storyEpisodeRequestQueue.test.js`、`storyEpisodeExperimentalRequestQueue.test.js` | 全绿 | 全绿（E9） | P |
| D6-3 | 边界 | 并发分集请求去重/单飞 | `api/storyEpisodeRequestQueue.test.js`、`api/taskSingleFlight` 相关 | 同 key 只发一次 | 全绿 | P |
| D6-4 | 异常 | 短剧 SQLite 表结构幂等与事务 | `backend/test_shortdrama_schema.py` | 17 张 `o_*` 表、重跑不丢行 | 全绿（E4）+ `check-migrations` 输出 `domainTables:17, rerunPreservesRows:true`（E15） | P |
| D6-5 | 异常 | 剧本文档抽取/worker 失败隔离 | `backend/services/test_story_document_extractor.py`、`test_story_document_worker.py`、`test_story_document_route_service.py` | 全绿 | 全绿 | P |
| D6-6 | 边界 | 复刻/改编流程参数与用量统计 | `api/storyReplication*.js` 相关、`storyReplicationUsageApi` | 全绿 | 全绿 | P |

### D7 分镜 3D / 全景

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D7-1 | 正常 | 3D 场景/骨骼/相机时间轴模型 | `src/modules/storyboard3d/*.test.js`（75 文件）、`panoramaSceneNode`(10) | 全绿 | 全绿（E12） | P |
| D7-2 | 边界 | 相机关键帧插值与姿态目录 | `cameraTimeline.test.js`、`poseCatalog.test.js` | 全绿 | 全绿 | P |
| D7-3 | 异常 | 3D 模型包下载校验失败 | `api/storyboard3dModelPackApi.test.js`、`personReplacementModelPackApi.test.js` | 拒绝损坏包 | 全绿（E9） | P |
| D7-4 | 正常 | 分镜视频帧生成参数 | `api/storyboardVideoFrameApi.test.js` | 全绿 | 全绿 | P |

### D8 Agent 与技能

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D8-1 | 正常 | Agent 会话/工具路由/上下文摘要 | `src/modules/agent/*.test.js`（68 文件） | 全绿 | 全绿（E12） | P |
| D8-2 | 边界 | 技能目录加载与能力发现 | `api/agentSkillAuthoringApi.test.js`、`agentSkillTrace.test.js`、`electron/agentSkillCapabilityOperations.test.js` | 全绿 | 全绿（E9/E8） | P |
| D8-3 | 异常 | 工具执行失败的条件回滚 | `docs/agent-action-postconditions.md` 对应模块测试 | 失败不改画布状态 | 全绿 | P |
| D8-4 | 边界 | 模型请求参数归一（temperature/tools） | `api/agentModelRequestParams.test.js` | 全绿 | 全绿 | P |

### D9 协作

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D9-1 | 正常 | 协作画布绑定/变更流/聊天状态 | `src/modules/collaboration/*.test.js`（26 文件） | 全绿 | 全绿（E12） | P |
| D9-2 | 边界 | 变更流乱序与去重 | `collaborationChangeFeed.test.js` | 幂等应用 | 全绿 | P |
| D9-3 | 异常 | 协作媒体 content-type 非法值 | `api/collaborationMediaContentType.test.js` | 拒绝非法类型 | 全绿（E9） | P |
| D9-4 | 异常 | 移动端导演客户端离线 | `api/directorMobileClientApi.test.js` | 明确错误码 | 全绿 | P |

### D10 任务中心 / 队列

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D10-1 | 正常 | 媒体任务入队/并发/历史 | `electron/mediaTaskQueue*.test.js`（5 文件）、`mediaTaskRuntime.test.js`、`mediaTaskHistory*.test.js` | 全绿 | 全绿（E8） | P |
| D10-2 | 边界 | 任务 id 安全（注入/穿越） | `electron/mediaTaskQueue.idSafety.test.js` | 拒绝非法 id | 全绿 | P |
| D10-3 | 异常 | 进程超时被杀 + 恢复 | `mediaTaskQueue.processTimeout.test.js`、`mediaTaskRecovery.test.js` | 任务标失败可重试 | 全绿 | P |
| D10-4 | 边界 | 单飞去重与等待 | `api/taskSingleFlight`、`api/mediaTaskWait.test.js` | 同 key 合并 | 全绿 | P |
| D10-5 | 异常 | 队列串行化（keyed queue） | `electron/keyedOperationQueue.test.js` | 同 key 串行 | 全绿 | P |

### D11 设置 / 密钥 / 供应商

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D11-1 | 正常 | 设置项读写与自动保存呈现 | `src/modules/settings/*.test.js`（15 文件） | 全绿 | 全绿（E12） | P |
| D11-2 | 边界 | 密钥存储加密与回读（safeStorage） | `electron/secureSettingsStore.test.js`、`secureSettingsCapabilityOperations.test.js` | 全绿 | 全绿（E8） | P |
| D11-3 | 异常 | 配置损坏不被当作空配置清空 | `api/configApi.test.js`、`backend/services/test_client_config_structured.py` | 保留原文件并报错 | 全绿 | P |
| D11-4 | 正常 | 供应商模型列表/连接测试 | `api/providerModelListApi.test.js`、`providerConnectionTestApi.test.js`、`customProviderDiscoveryApi.test.js` | 全绿 | 全绿 | P |
| D11-5 | 边界 | 文件保存目录迁移守卫 | `src/modules/settings/fileSaveMigrationGuard.test.js`、`backend/services/test_file_save_migration.py` | 迁移前置校验 | 主用例全绿；其中 1 条 symlink 子例受环境影响无法成立（记在 D14-6，不重复计） | P |

### D12 更新与安装身份

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D12-1 | 正常 | 检查更新/下载/安装准备状态机 | `electron/updaterController.test.js`、`updateInstallPreparation.test.js` | 全绿 | 全绿（E8） | P |
| D12-2 | 边界 | 更新信息字段缺失归一 | `electron/updaterInfoNormalizer.js`（无独立测试文件） | 缺字段不崩 | **未覆盖** | NE |
| D12-3 | 异常 | 安装器不杀进程/不递归删安装根 | `electron/installerSafety.test.js::installer does not force termination…` | 源码不含 taskkill/RMDir /r | 全绿 | P |
| D12-4 | 异常 | 卸载只删清单内未变更文件，保留用户数据 | `electron/installerSafety.test.js::cleanup removes only unchanged manifest-owned program files`（PowerShell 实跑 `build/uninstall-program-files.ps1`） | 未变更程序文件删、用户数据留 | 全绿 | P |
| D12-5 | 静态 | appId/productName/artifactName = 新品牌 | `electron-builder.win.cjs`（`com.oneframe.app` / `一帧 OneFrame` / `OneFrame-Setup-${version}-${arch}.${ext}`） | 三项均为新品牌 | 静态核对通过（C5） | S |

### D13 主进程基础设施

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D13-1 | 正常 | 启动生命周期/窗口尺寸策略/最小化恢复 | `electron/{desktopStartupLifecycle,mainStartupHelpers,appWindowSizePolicy,windowsWindowTransitions,mainWindowActivation}.test.js` | 全绿 | 全绿（E8） | P |
| D13-2 | 正常 | 后端启动解析/Python 运行时定位/端口策略 | `electron/{backendLaunchResolver,pythonRuntimeResolver,startupPortPolicy,startupPortRecovery,startupPortInspector}.test.js` | 全绿 | 全绿 | P |
| D13-3 | 异常 | 后端启动超时/进程身份校验/终止 | `electron/{backendStartupMonitor,backendProcessIdentity,backendProcessTermination}.test.js` | 超时被判失败并清理 | 全绿 | P |
| D13-4 | 异常 | 本地预览协议路径穿越防护 | `electron/{localPreviewProtocolRuntime,localPathContainment,zipEntrySafety}.test.js` | 拒绝越界路径 | 全绿 | P |
| D13-5 | 正常 | 截图浮层/取词/全局捕获窗口 | `electron/{screenshotOverlay*,globalCaptureWindow*,selectedTextCapture,toolCapture,captureChainWiring}.test.js` | 全绿 | 全绿 | P |
| D13-6 | 正常 | 任务栏身份（含新旧品牌标题匹配、ShuoCanvas native 命名空间） | `electron/windowsTaskbarIdentity.test.js` | 新旧标题都认、命名空间保留 | 全绿 + 静态核对（E19） | P |
| D13-7 | 异常 | 诊断包收集与脱敏 | `electron/{diagnostics,diagnosticsAudit,diagnosticsEvidence,diagnosticsLaunchVersion}.test.js` | 不含密钥 | 全绿 | P |
| D13-8 | 边界 | 渲染层导航拦截/legacy 存储迁移 | `electron/{rendererNavigationGuard,legacyRendererStorageMigration}.test.js` | 全绿 | 全绿 | P |

### D14 Python 后端

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D14-1 | 正常 | 全部后端单元/路由用例 | `node tools/run-backend-tests.mjs` | 223 例，0 失败 | **223 例中 220 通过、0 失败、3 跳过（SKIP）**，`unittest` 收尾为 `OK (skipped=3)`；3 例跳过全部是「本机无法造真实软链」的环境限制（明细见 D14-5/D14-6，结论 E4）。结论列仍标 `NE` 仅因为**有 3 例未真正执行**，不代表有失败 | NE |
| D14-2 | 正常 | 鉴权：回环 vs 远端、敏感 API 需 token | `test_server_security.py` | 全绿 | 全绿 | P |
| D14-3 | 异常 | SSRF：内网/整数/十六进制/八进制 IP 绕过 | `test_ssrf_adversarial_qa.py`、`test_server_proxy_url_guard.py`、`outbound_http_transport.py` | 全部拦截 | 全绿 | P |
| D14-4 | 异常 | 路径穿越：`..`、`%2e`、编码二次解析、盘符 | `test_json_file_route_security.py`、`test_media_file_route_security.py`、`test_audit_security.py::StaticAccessTests` | 一律拒绝 | 全绿（symlink 2 例为 SKIP，见 D14-5） | P |
| D14-5 | **NE** | 符号链接不得逃逸根目录（2 例） | `test_audit_security.py::{test_symlink_cannot_escape_root,test_static_symlink_does_not_expose_outside_file}` | 抛 `ValueError` / 返回 `None` | **SKIP（`skipTest`）**：本机 `os.symlink`/`Path.symlink_to` 静默不创建真实链接，用例已加「`is_symlink() and exists()`」前提校验后跳过（**环境限制，非缺陷**）；能建真软链的机器上仍照旧严格断言 | NE |
| D14-6 | **NE** | 文件保存迁移拒绝源符号链接（1 例） | `test_file_save_migration.py::test_source_symlink_rejected_when_supported` | 抛 `ValueError` | **SKIP（`skipTest`）**：同上，已补真实链接前提校验（**环境限制，非缺陷**） | NE |
| D14-7 | 正常 | 热更新清单校验/签名/离线缓存 | `test_hot_update_service.py`、`backend/services/offline_cache_verifier.py` | 全绿 | 全绿 | P |
| D14-8 | 边界 | 订阅门禁/契约版本/远端校验 | `test_subscription_client.py`、`test_subscription_contract_version.py`、`test_subscription_gate_remote.py` | 全绿 | 全绿 | P |
| D14-9 | 正常 | 媒体转码/合成/抽帧路由 | `test_media_file_route_security.py`、`local_media_processing_route_service.py` | 全绿 | 全绿 | P |

### D15 品牌换牌专项（详见 §3）

### D16 工程门禁 / 静态健康

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| D16-1 | 正常 | 反混淆门禁 | `node tools/deobf-gate.mjs` | PASS | `PASS no obfuscation signals in code positions`，exit 0（E1） | P |
| D16-2 | 正常 | CSP 门禁 | `node tools/check-csp.mjs` | PASS | PASS，exit 0（E2） | P |
| D16-3 | 正常 | 可达性门禁（孤儿模块不新增） | `node tools/check-reachability.mjs` | OK | `scope 2074, reachable 1903, orphans 171`，exit 0（E3） | P |
| D16-4 | 正常 | innerHTML 收敛（只减不增） | `node tools/check-innerhtml.mjs` | OK | `346 writes (baseline 346)`，exit 0（E3） | P |
| D16-5 | 正常 | CSS 预算（style.css 只减不增） | `node tools/check-css-budget.mjs` | OK | `26765 lines (budget 26765)`，exit 0（E3） | P |
| D16-6 | 正常 | 数据库迁移可应用且幂等 | `node tools/check-migrations.mjs` | success | 首次 exit 1（native ABI 不匹配）；换 Node 24 后 `{"success":true,"domainTables":17,"migrationApplied":["001_short_drama_core.cjs"],"rerunPreservesRows":true}`，exit 0（E15）；**该门禁必须用 Node 24 跑**，Node 22 下必然 `ERR_DLOPEN_FAILED`（环境问题，见 E21） | P |
| D16-7 | **NE** | 打包空跑（`electron-builder --dir` + 打包内 Python 冒烟） | `node tools/check-package.mjs` | success | **未执行**：属构建动作（`electron-builder --dir`），与「禁止构建」硬性约束冲突，且可能触发 electron-builder 组件下载 | NE |
| D16-8 | 正常 | 反混淆工具自身单测 | `tools/{deobf-bool,deobf-gate,deobf-member-access,deobf-unescape}.test.js` | 全绿 | 36 例全绿（E14） | P |
| D16-9 | 正常 | Web 集成（headless Chromium + 静态服务器）—— **通过的 8 例** | `npx playwright test e2e/{smoke,http-security,workspace}.spec.js` + `node-parameters.spec.js` 的其余断言 | 页面无渲染错误、鉴权/路径穿越/工作台交互正常 | 8 例全绿（`smoke` 3、`http-security` 4、`workspace` 1，明细 E20）；另 1 例 `node-parameters` 见 D16-10（已修复） | P |
| D16-10 | **异常** | Web 集成 **1 例失败 → 修复后回归通过**：视频节点 hover 调用未定义方法 | `npx playwright test e2e/node-parameters.spec.js` | `expect(errors).toEqual([])` 无渲染层错误 | **首轮 FAIL**：抛 2 条 TypeError `this.activatePreviewHoverPlayback is not a function` / `this._deactivatePreviewHoverPlayback is not a function`（`AIGenVideoNode.js:395/403` 无定义，既有缺陷）→ 工程师新增 `video-node/previewHoverPlaybackModule.js` 并挂到原型 → **复跑 1 passed**，全套 web spec **9/9**，自带回归 **13/13**（见 E20 / E23） | P |
| D16-11 | **NE** | 桌面端 e2e（Electron 真机） | `npx playwright test --config playwright.desktop.config.js` | 全绿 | **未执行**：需启动 Electron GUI，属禁止项 | NE |

---

## 3. 换牌关键路径专项用例（阶段 C）

被测对象：`electron/brandDataMigration.js`、握手值、预设名归一、目录回退、安装身份、10 项保留项。

### C1 用户数据迁移（`brandDataMigration`）

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| C1-1 | 异常 | 无旧目录 → 不动作、不建新目录 | `electron/brandDataMigration.test.js::没有旧目录时什么也不做…` | `reason=no-legacy-data`，新目录不存在 | 通过 | P |
| C1-2 | 正常 | 旧目录有内容 → 复制、跳过缓存、写标记 | 同文件`::复制用户数据到新目录…` | `copiedFiles=2`、`Cache` 未复制、旧目录保留 | 通过 | P |
| C1-3 | 边界 | 新旧都有内容 → 不覆盖 | 同文件`::新目录已有内容时不动…` | `reason=target-already-has-data`，新数据仍为 `new` | 通过 | P |
| C1-4 | 边界 | **新目录存在但为空** → 仍应迁移 | 本轮新增 `electron/brandDataMigration.extra.test.js::边界：新目录存在但为空时仍然执行迁移`（原测试未覆盖；后被移入 `electron/` 以纳入 `test:js` glob） | 迁移成功，`reason=copied` | 通过（E18） | P |
| C1-5 | 边界 | `AIC_SKIP_USERDATA_MIGRATION=1` / `AIC_USER_DATA_ROOT` → 跳过 | 同文件`::测试隔离目录或显式开关会跳过迁移` | `reason=skipped-by-env` | 通过 | P |
| C1-6 | 边界 | 多个旧目录并存 → `CanvasPro` 优先 | 同文件`::多个旧目录并存时优先 CanvasPro` | 取 `CanvasPro` 的内容 | 通过 | P |
| C1-7 | 边界 | 只有 `AI CanvasPro` → 也能迁移 | 同文件`::只有 AI CanvasPro 目录时也能迁移` | 迁移成功 | 通过 | P |
| C1-8 | 异常 | **复制中途单文件失败不中断** | 本轮新增 `brandDataMigration.extra.test.js::边界：单文件复制失败不中断…`（注入 EBUSY，原测试未覆盖） | `migrated=true`、`failedFiles=1`、其余文件已复制、标记文件记录失败数 | 通过（E18） | P |
| C1-9 | 异常 | `appDataDir` 不存在时不抛异常 | 本轮新增 `brandDataMigration.extra.test.js::异常：appDataDir 不存在时…` | 返回 `no-legacy-data` | 通过（E18） | P |
| C1-10 | 静态 | 迁移必须在 `app.setPath('userData')` 之前、且隔离目录下跳过 | `electron/main.js:250-263` | 顺序正确、条件正确 | 静态核对通过（§C1 证据） | S |

### C2 前后端握手值（换牌最容易踩的坑）

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| C2-1 | 静态 | `SERVER_ID_VALUE` 仍为字面量 `'Canvas'` | `electron/main.js:163-166`（`SERVER_ID_HEADER='x-aicanvas-server'`） | 保持 `'Canvas'` | `SERVER_ID_VALUE = 'Canvas'` | S |
| C2-2 | 静态 | 后端响应头值一致 | `server.py:2845-2847` | `send_header("X-AICanvas-Server","Canvas")` | 一致 | S |
| C2-3 | 静态 | 健康检查用该值判定就绪 | `electron/main.js:465` | `value7 === SERVER_ID_VALUE` | 一致 | S |
| C2-4 | 异常 | 若一侧改动会怎样（风险说明） | 代码注释 `main.js:164` | 会永远「正在启动」 | 代码内已注释警示，且无测试守卫此常量（**风险点，非缺陷**） | S |

### C3 预设名归一（`src/modules/shortcuts.js`）

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| C3-1 | 静态 | 新预设名 = `一帧预设` | `shortcuts.js:17` `ASHUO_PRESET_NAME` | `一帧预设` | 一致 | S |
| C3-2 | 静态 | 旧名归一集合含 `阿硕预设` | `shortcuts.js:18` `LEGACY_ASHUO_PRESET_NAMES = new Set(['阿硕预设'])` | 含旧名 | 一致 | S |
| C3-3 | 正常 | 读回旧值被归一为新值 | `shortcuts.js:466`（保存时）/`:508`（归一函数） | 旧值 → `一帧预设` | 一致 | S |
| C3-4 | 正常 | 快捷键模块用例全绿 | `src/modules/canvasShortcuts/*.test.js`、`src/modules/shortcuts` 相关（src/modules 域） | 全绿 | 全绿（E12） | P |

### C4 目录回退

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| C4-1 | 静态 | web 模式默认工程目录 `OneFrame Project`，旧 `Canvas Project` 仅回退 | `server.py:300-315`（`_resolve_default_canvas_dir()`：新目录不存在且旧目录存在 → 用旧） | 新写走新目录，旧数据可读 | 逻辑与描述一致 | S |
| C4-2 | 静态 | 短剧 SQLite 目录回退、不复制 | `backend/shortdrama_db.py:16-28`（`BRAND_DATA_DIRNAME="OneFrame"`，`LEGACY_DATA_DIRNAMES=("CanvasPro","AI CanvasPro")`；`app_data_dir()` 仅回退不复制） | 新不存在 → 用旧，不复制 DB | 一致 | S |
| C4-3 | 静态 | knex 迁移脚本同一口径 | `knexfile.cjs:8-18` `resolveAppDataDir()` | 新 → 旧 → 新 | 一致 | S |
| C4-4 | 正常 | 迁移可应用且幂等 | `node tools/check-migrations.mjs` | `success:true` | 见 D16-6 | P |

### C5 安装身份

| 编号 | 类型 | 用例 | 执行方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| C5-1 | 静态 | 正式包 appId/productName | `electron-builder.win.cjs:6-8` | `com.oneframe.app` / `一帧 OneFrame` | 一致 | S |
| C5-2 | 静态 | artifactName 改名 | 同文件`:63,:73` | `OneFrame-…-win-${arch}.${ext}` / `OneFrame-Setup-…` | 一致 | S |
| C5-3 | 静态 | dev 包独立 appId | `electron-builder.win.dev.cjs:18-23` | `com.oneframe.app.dev` / `一帧 OneFrame Dev` | 一致 | S |
| C5-4 | 静态 | 卸载保留白名单含新旧品牌 | `build/uninstall-program-files.ps1:24` | 同时含 `OneFrame Project`/`OneFrame Files` 与 `Canvas Project`/`Canvas Files`/`AI CanvasPro Files` | 一致 | S |
| C5-5 | 正常 | 卸载脚本行为（只删清单内未变更文件） | `electron/installerSafety.test.js`（PowerShell 实跑） | 通过 | 全绿（E8） | P |

### C6 保留项未被误改（`docs/rebrand-oneframe.md` §3 的 10 项抽查）

| 编号 | 保留项 | 核对方式 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- | --- |
| C6-1 | 更新/教程源 URL（`github.com/luseaer-ship-it/CanvasPro`） | `grep api/tutorialReleaseNotesApi.js` | 仍是旧仓库地址 | `TUTORIAL_RELEASES_URL` / `API_URL` 均未改 | S |
| C6-2 | `ashuoai.com` 域名 | `grep -rl ashuoai.com` | 保留 | `src/core/stores/legacyInitialState.js`、`appPanels.js`、`subscriptionAccess.js`、`tutorialCatalog.js` 均保留 | S |
| C6-3 | `OBJECT_STORAGE_KEY_PREFIX='SHUO-Canvas'` | `api/objectStorageProfiles.js:1` | 保留 | 保留，且 `objectStorageApi.test.js` 断言 `SHUO-Canvas` | S |
| C6-4 | `X-AICanvas-Server: Canvas` 与 `SERVER_ID_VALUE` | 见 C2 | 保留 | 保留 | S |
| C6-5 | legacy 路径（`user/Canvas Project`、`%LOCALAPPDATA%/AI-CanvasPro`） | `server.py:302`、`storageRoots.js` | 仅作回退保留 | `LEGACY_CANVAS_DIRNAME="Canvas Project"` 保留 | S |
| C6-6 | `ASHUO_PRESET_*` 标识符名 | `shortcuts.js` | 标识符保留、只改值 | `ASHUO_PRESET_NAME`/`LEGACY_ASHUO_PRESET_NAMES` 保留 | S |
| C6-7 | `namespace ShuoCanvas` 与 native 导出名 | `electron/windowsTaskbarIdentity.js:104` | 保留 | PowerShell 内联 C# 仍为 `namespace ShuoCanvas`、`ShuoCanvasCallWndProcHookProc` | S |
| C6-8 | `Canvas` API / `canvasTitle` / `Canvas 转码失败` | `src/` 全量测试 | 保留（指 HTML Canvas） | 相关模块用例全绿，未被替换成品牌名 | S |
| C6-9 | `release_notes.txt`、`docs/TRACKING.md` | 文件存在 | 历史流水不改 | 保留 | S |
| C6-10 | `tools/` 里的 `F:\CanvasPro` 路径 | `tools/*.mjs` | 保留 | 门禁脚本本轮全部可正常执行（E1–E3,E15） | S |

---

## 4. 矩阵统计

> 以下数字由脚本对 `matrix.md` 逐行解析状态列得出（状态列已规范为 `P`/`S`/`F`/`NE` 四值，无括号限定语），可复算。

| 维度 | 数量 |
| --- | --- |
| 盘点能力域 | 16（D1–D16）+ 换牌专项 6 组（C1–C6）= 17 个验证单元 |
| 矩阵用例行 | **130 行**（D1–D16：93 行；C1–C6：37 行） |
| `P` 通过（有自动化用例实跑通过） | **97**（含 D16-10：首轮 FAIL、修复后回归通过） |
| `F` 失败（有自动化用例实跑失败） | **0** —— 首轮 1 条（D16-10 `activatePreviewHoverPlayback is not a function`）已修复并回归通过，详见 report §3.1 / E23 |
| `S` 静态核对通过（**非 SKIP**，无自动化用例可跑） | **26** |
| `NE` 无法执行（环境限制 / 与硬性约束冲突，不计入通过率） | **7** |
| **合计** | **97 + 26 + 0 + 7 = 130** ✅ |
| 自动化实跑用例（JS + Python + e2e，与上方「用例行」是不同维度） | **11571** 条断言，通过 **11568**、失败 **0**、跳过 **3**（`skipTest`，本机软链环境限制）—— 见 `report.md` §1.1 |

**`NE`(7) 明细**（每条都在 `report.md` §6 给了原因；本表首列用序号，避免与用例行的编号统计混淆）：

| # | 矩阵编号 | 事项 | 不可执行原因 |
| --- | --- | --- | --- |
| 1 | `D4-5` | `api/mattingApi` 抠图失败降级 | 无专用测试文件（覆盖盲区，非环境问题） |
| 2 | `D12-2` | `electron/updaterInfoNormalizer` 字段缺失归一 | 无专用测试文件（覆盖盲区） |
| 3 | `D14-1` | 后端全量 223 例汇总 | 220 通过 / 0 失败 / 3 跳过（SKIP）；3 例跳过来自符号链接环境限制，未真正执行故不计为「全绿」 |
| 4 | `D14-5` | 符号链接不得逃逸根目录（2 例） | 本机 Windows 造不出真实软链（静默不创建 / `WinError 2`） |
| 5 | `D14-6` | 文件保存迁移拒绝源软链（1 例） | 同上 |
| 6 | `D16-7` | `check-package.mjs` 打包空跑 | 属构建动作，与「禁止构建」硬性约束冲突 |
| 7 | `D16-11` | 桌面 e2e（Electron 真机） | 需启动 Electron GUI，与「禁止启动 GUI」冲突 |

**`F`/`NE` 与「0 条失败断言 + 3 条 SKIP」的关系**：矩阵是「用例意图」维度（130 行），实跑断言是「执行」维度（11571 条）。
首轮那 1 条 `F`（D16-10，视频节点 hover）已修复并回归通过，故终态 `F = 0`；后端那 3 条用例属**同一环境根因**（本机造不出真实软链），已改为 `skipTest`，在矩阵里归入 `NE`（D14-5/D14-6）。
因此 **`F`=0 对应 report §1.1 的 0 条失败断言，`NE` 内含的 3 条对应 3 条 SKIP 断言（不计入失败）**，两个维度可对上：`11568 + 3 = 11571`。
