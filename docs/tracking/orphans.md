# 孤立模块清单（已落地但从入口不可达）

> 由 `docs/TRACKING.md` 维护。**本表是实测重算结果**，不是按批次累加的估算。
> 从 `index.html` 的 `<script type="module">`、`package.json` 的 `main`（`electron/main.js`）、以及按运行期加载约定补的入口（`electron/*preload*.cjs`、`db/migrations/*.cjs`、`knexfile.cjs`、`main.js`）出发，
> 沿相对 `import` / `export … from` / 动态 `import()` / `new URL("…js", import.meta.url)` 做全图遍历，走不到的非测试 JS 模块都列在这里。
> 脚本与证据：`deobf-tools/b126/reach.mjs`、`reach-report.txt`、`reach-orphans.json`；方法说明见 `docs/b126-reachability.md`。

> scope：**1991** 个非测试 JS 模块（`src/`、`api/`、`electron/`、`db/` 加根级 `*.js`/`*.cjs`；排除 `*.test.js` / `*_test.js` / `*.spec.js`、`node_modules/`、`deobfuscated/`、`vendor/`、`user/`、`data/`、`output/`、`build/`、`dist/`、`tools/`、`backend/`）。
> 可达 **1864** / 孤立 **127** / 断链 **0** / 解析失败 **0**（断链为 0 说明整个仓库的相对 import 都能解析到实际文件）。

> **⚠ 口径变更（第 161 批发觉）**：本表此前记的是 **scope 1238 / 可达 835 / 孤立 403**，
> 那是更早的一次统计（同一份排除规则，但纳入的根目录集合更窄）。现行 `reach.mjs` 输出 scope **1991**。
> **两套数字不可直接相减** —— 孤立从 403 降到 127，主要来自口径放宽，其次才是第 150–161 批的接线。
> 引用本表计数时务必带上口径（1991）。旧的 483/403 是 1238 口径下的历史值。

> 接线进度：第 150–157 批共接 167 件，重算后 **201**；第 161 批接 1 件（`src/components/nodeToolbar/videoActions/removeAction.js`）。
> 第 156 批另接通 3 件 `api/errors/parsers/`，属第 126 批之后落地的新文件、不在此快照台账内。
> 另有 12 个 `vendor/**` 文件可达，不计入 scope。

> 某个模块接线后，从本表删掉它，并同步 `docs/TRACKING.md` §5 的计数。重算：`node deobf-tools/b126/reach.mjs`。

| 目录 | 数量 |
| --- | --- |
| `electron/` | 17 |
| `src/modules/` | 12 |
| `src/manifests/video/modelApi/` | 11 |
| `api/adapters/` | 9 |
| `src/components/aigenImage/` | 9 |
| `api/` | 8 |
| `src/manifests/audio/modelApi/` | 6 |
| `src/components/nodeToolbar/videoActions/` | 5 |
| `src/manifests/text/modelApi/` | 5 |
| `api/adapters/runninghubWorkflowResolvers/` | 4 |
| `./` | 4 |
| `src/hooks/` | 4 |
| `src/manifests/image/modelApi/` | 4 |
| `src/modules/storyWorkspace/` | 4 |
| `src/core/` | 3 |
| `src/services/` | 3 |
| `api/story-generation/` | 2 |
| `src/domain/storyGeneration/` | 2 |
| `src/modules/nodeExport/` | 2 |
| `src/modules/storyboard3d/` | 2 |
| `src/utils/` | 2 |
| `src/components/nodeToolbar/imageActions/` | 1 |
| `src/components/video-node/` | 1 |
| `src/core/stores/` | 1 |
| `src/manifests/image/localRuntime/` | 1 |
| `src/manifests/text/localRuntime/` | 1 |
| `src/modules/interaction/` | 1 |
| `src/modules/projectPackage/` | 1 |
| `src/modules/timelineExport/` | 1 |
| `src/modules/whiteboard/` | 1 |
| **合计** | **127** |
## `electron/`（17）

appWindowSizePolicy.js、backendStartupMonitor.js、canvasRuntimeMode.js、chromeBrowserWorker.js、chromeCdpPipeClient.js、chromeShellBrowserVersion.js、chromeShellLauncher.js、chromeShellProfileRecovery.js、chromeShellRuntime.js、chromeShellStartupDiagnostics.js、chromeShellStartupFallback.js、chromeShellStartupHealth.js、chromeShellWebPreviewManager.js、globalCaptureWindow.js、nativeContextMenuIcons.js、sortformerModelRoot.js、windowsTaskbarIdentity.js

## `src/modules/`（12）

ImageExpandController_lf.js、MediaTaskHistoryPanel.js、MediaTaskRecoveryPanel.js、ProjectManager.js、VideoGifController.js、canvasImageDisplayHandoff.js、externalProjectOpen.js、mediaTaskRecoveryCanvas.js、nodePromptPaste.js、promptMentionMatcher.js、promptMentionSelection.js、promptReferenceSignature.js

## `src/manifests/video/modelApi/`（11）

agnesVideoModelApiManifests.js、apimartVideoModelApiManifests.js、bailianVideoModelApiManifests.js、grsaiVideoModelApiManifests.js、minimaxH3VideoModelApiShared.js、minimaxVideoModelApiManifests.js、runningHubHailuoH3VideoModelApiManifests.js、runningHubSeedance25VideoModelApiManifest.js、runningHubVideoModelApiManifests.js、vendorVideoModelApiShared.js、volcengineVideoModelApiManifests.js

## `api/adapters/`（9）

ApimartAdapter.js、ComfyUiAdapter.js、ComfyUiWorkflowMappingAdapter.js、GeminiAdapter.js、ManifestResultRenderer.js、runningHubImportedAudioWorkflow.js、textResponseMetadata.js、textResponsesRequest.js、textThinkingControl.js

## `src/components/aigenImage/`（9）

imageGenerationPrompt.js、imageObjectUrlLifecycle.js、refBarDragSort.js、runningHubInstanceControl.js、runningHubInstanceDevModeBinding.js、uiSchemaBindingEvents.js、uiSchemaBindingSession.js、uiSchemaFieldOverrides.js、uiSchemaParameterGroups.js

## `api/`（8）

cliTextInputs.js、comfyUiUploadApi.js、directorMobileClientApi.js、imageResultMedia.js、mediaTaskHistoryApi.js、modelApiVideoContent.js、storyReplicationFlowApi.js、textInlineMediaInputs.js

## `src/manifests/audio/modelApi/`（6）

runningHubAudioCatalog.js、runningHubAudioCatalogShared.js、runningHubDoubaoAudioManifests.js、runningHubMinimaxAudioManifests.js、runningHubMurekaAudioManifests.js、runningHubQwenAudioManifests.js

## `src/components/nodeToolbar/videoActions/`（5）

depthVideoAction.js、segmentRetakeAction.js、toGifAction.js、videoDepthEditor.js、voiceReplaceAction.js

## `src/manifests/text/modelApi/`（5）

apimartQwenTextManifests.js、apimartTextModelCatalog.js、bailianPartnerTextModelApiManifests.js、bailianTextModelApiManifests.js、runningHubLyricsManifests.js

## `api/adapters/runninghubWorkflowResolvers/`（4）

runningHubHailuoH3AudioDrivenResolver.js、runningHubHailuoH3OmniResolver.js、runningHubQwenImage21EditResolver.js、runningHubReferenceMediaResolverShared.js

## `./`（4）

electron-builder.win.cjs、electron-builder.win.dev.cjs、playwright.config.js、playwright.desktop.config.js

## `src/hooks/`（4）

index.js、useHistory.js、useSelection.js、useViewport.js

## `src/manifests/image/modelApi/`（4）

apimartGptImage25ExtManifest.js、apimartGptImage25Manifest.js、bailianImageModelApiManifests.js、gptImage25Fields.js

## `src/modules/storyWorkspace/`（4）

storyAssetSettingsShell.js、storySourceChunking.js、storyVideoReplicationPromptAnalysis.js、textModelContextBudget.js

## `src/core/`（3）

generationTaskCenterProjection.js、rendererViewportCommitGate.js、store.js

## `src/services/`（3）

initialThemeBootstrap.js、localAudioPlaybackObjectUrlService.js、nodeMediaExportService.js

## `api/story-generation/`（2）

storyPromptModeRules.js、storyReplicationFlowPrompts.js

## `src/domain/storyGeneration/`（2）

index.js、videoReplicationFlowPlanning.js

## `src/modules/nodeExport/`（2）

NodeMediaExportDialog.js、collectNodeMedia.js

## `src/modules/storyboard3d/`（2）

index.js、mobileCameraClient.js

## `src/utils/`（2）

format.js、operationError.js

## `src/components/nodeToolbar/imageActions/`（1）

annotateCloneAction.js

## `src/components/video-node/`（1）

mediaPlaybackStallProgress.js

## `src/core/stores/`（1）

index.js

## `src/manifests/image/localRuntime/`（1）

openAiCliImageManifest.js

## `src/manifests/text/localRuntime/`（1）

cliTextModelManifests.js

## `src/modules/interaction/`（1）

dropTargetSpatialQuery.js

## `src/modules/projectPackage/`（1）

fullProjectPackageSession.js

## `src/modules/timelineExport/`（1）

TimelineExportDialog.js

## `src/modules/whiteboard/`（1）

whiteboardDrawing.js
