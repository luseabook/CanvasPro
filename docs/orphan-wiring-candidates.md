# 孤立模块接线候选清单（待勾选）

生成时间基准：reachability 孤立 **171** 个；其中 **48** 个在 0.7.16 镜像里有“本仓已存在且可达”的消费方（优先看）。

> 用法：在你要接线的行把 `[ ]` 改成 `[x]`；也可以直接在聊天里点名目录或文件。
> 说明：“镜像消费方”只是线索（可能跨代），最终以“本仓是否真的缺这个能力”为准。

## A. 有镜像消费方线索（48）

| 勾选 | 孤立模块 | 镜像消费方（本仓可达） |
| --- | --- | --- |
| [ ] | `api/adapters/ComfyUiAdapter.js` | `api/aiAudioApi.js`<br>`api/aiImageApi.js`<br>`api/aiVideoApi.js` |
| [ ] | `api/adapters/ManifestResultRenderer.js` | `src/core/generationTaskRuntime.js` |
| [ ] | `api/adapters/runningHubImportedAudioWorkflow.js` | `api/aiAudioApi.js` |
| [ ] | `api/adapters/runninghubWorkflowResolvers/runningHubHailuoH3AudioDrivenResolver.js` | `api/adapters/runninghubWorkflowResolvers/index.js` |
| [ ] | `api/adapters/runninghubWorkflowResolvers/runningHubHailuoH3OmniResolver.js` | `api/adapters/runninghubWorkflowResolvers/index.js` |
| [ ] | `api/adapters/runninghubWorkflowResolvers/runningHubQwenImage21EditResolver.js` | `api/adapters/runninghubWorkflowResolvers/index.js` |
| [ ] | `api/adapters/textResponseMetadata.js` | `api/aiTextApi.js` |
| [ ] | `api/adapters/textResponsesRequest.js` | `api/adapters/ModelApiManifestNormalizer.js` |
| [ ] | `api/adapters/textThinkingControl.js` | `api/adapters/ModelApiManifestNormalizer.js` |
| [ ] | `api/cliTextInputs.js` | `api/aiTextApi.js` |
| [ ] | `api/comfyUiUploadApi.js` | `api/aiAudioApi.js`<br>`api/aiImageApi.js`<br>`api/aiVideoApi.js` |
| [ ] | `api/imageResultMedia.js` | `api/aiImageApi.js` |
| [ ] | `api/modelApiVideoContent.js` | `api/aiVideoApi.js` |
| [ ] | `api/textInlineMediaInputs.js` | `api/aiTextApi.js` |
| [ ] | `src/components/aigenImage/imageGenerationPrompt.js` | `src/components/aigenImage/taskOrchestrationModule.impl.js` |
| [ ] | `src/components/aigenImage/imageObjectUrlLifecycle.js` | `src/components/aigenImage/uiModule.impl.js` |
| [ ] | `src/components/aigenImage/runningHubInstanceControl.js` | `src/components/aigenImage/uiSchemaRenderer.js` |
| [ ] | `src/components/aigenImage/uiSchemaBindingSession.js` | `src/components/aigenImage/uiSchemaRenderer.js` |
| [ ] | `src/components/aigenImage/uiSchemaFieldOverrides.js` | `src/components/aigenImage/uiSchemaRenderer.js` |
| [ ] | `src/components/aigenImage/uiSchemaParameterGroups.js` | `src/components/aigenImage/uiSchemaRenderer.js` |
| [ ] | `src/components/nodeToolbar/videoActions/depthVideoAction.js` | `src/components/nodeToolbar/videoToolbar.js` |
| [ ] | `src/components/nodeToolbar/videoActions/segmentRetakeAction.js` | `src/components/nodeToolbar/videoToolbar.js` |
| [ ] | `src/components/nodeToolbar/videoActions/toGifAction.js` | `src/components/nodeToolbar/videoToolbar.js` |
| [ ] | `src/components/nodeToolbar/videoActions/voiceReplaceAction.js` | `src/components/nodeToolbar/videoToolbar.js` |
| [ ] | `src/components/video-node/mediaPlaybackStallProgress.js` | `src/components/video-node/mediaPlaybackRecovery.js` |
| [ ] | `src/core/generationTaskCenterProjection.js` | `src/core/generationTaskRuntime.js` |
| [ ] | `src/manifests/audio/modelApi/runningHubAudioCatalog.js` | `src/manifests/modelRegistry.js` |
| [ ] | `src/manifests/image/localRuntime/openAiCliImageManifest.js` | `src/manifests/modelRegistry.js` |
| [ ] | `src/manifests/image/modelApi/apimartGptImage25ExtManifest.js` | `src/manifests/image/modelApi/apimartImageModelApiManifests.js`<br>`src/manifests/image/modelApi/index.js` |
| [ ] | `src/manifests/image/modelApi/apimartGptImage25Manifest.js` | `src/manifests/image/modelApi/apimartImageModelApiManifests.js`<br>`src/manifests/image/modelApi/index.js` |
| [ ] | `src/manifests/image/modelApi/bailianImageModelApiManifests.js` | `src/manifests/image/modelApi/index.js`<br>`src/manifests/image/modelApi/index.js` |
| [ ] | `src/manifests/image/modelApi/gptImage25Fields.js` | `src/manifests/image/modelApi/grsaiImageModelApiManifests.js` |
| [ ] | `src/manifests/text/localRuntime/cliTextModelManifests.js` | `src/manifests/modelRegistry.js` |
| [ ] | `src/manifests/text/modelApi/apimartQwenTextManifests.js` | `src/manifests/text/modelApi/vendorTextModelApiManifests.js` |
| [ ] | `src/manifests/text/modelApi/apimartTextModelCatalog.js` | `src/manifests/text/modelApi/vendorTextModelApiManifests.js` |
| [ ] | `src/manifests/text/modelApi/bailianPartnerTextModelApiManifests.js` | `src/manifests/text/modelApi/vendorTextModelApiManifests.js` |
| [ ] | `src/manifests/text/modelApi/bailianTextModelApiManifests.js` | `src/manifests/text/modelApi/vendorTextModelApiManifests.js` |
| [ ] | `src/manifests/text/modelApi/runningHubLyricsManifests.js` | `src/manifests/modelRegistry.js` |
| [ ] | `src/manifests/video/modelApi/vendorVideoModelApiShared.js` | `src/manifests/video/modelApi/vendorVideoModelApiManifests.js` |
| [ ] | `src/modules/canvasImageDisplayHandoff.js` | `src/components/aigenImage/uiModule.impl.js`<br>`src/components/SourceImageNode.js` |
| [ ] | `src/modules/interaction/dropTargetSpatialQuery.js` | `src/modules/interaction/DragController.js` |
| [ ] | `src/modules/nodePromptPaste.js` | `src/modules/nodePromptShared.js` |
| [ ] | `src/modules/promptMentionSelection.js` | `src/modules/nodePromptShared.js` |
| [ ] | `src/modules/promptReferenceSignature.js` | `src/modules/nodePromptShared.js` |
| [ ] | `src/modules/storyboard3d/imagePoseLandmarker.worker.js` | `src/modules/storyboard3d/imagePoseEstimator.js` |
| [ ] | `src/modules/storyboard3d/modelGeometryImport.worker.js` | `src/modules/storyboard3d/workerModelImportAdapters.js` |
| [ ] | `src/modules/VideoGifController.js` | `src/components/nodeToolbar/videoToolbar.js` |
| [ ] | `src/utils/operationError.js` | `api/aiAudioApi.js` |

## B. 无镜像消费方线索（123）

### src/modules/storyWorkspace（38）
- [ ] `src/modules/storyWorkspace/storyAssetSettingsShell.js`
- [ ] `src/modules/storyWorkspace/storyClipReviewIssues.js`
- [ ] `src/modules/storyWorkspace/storyEpisodeSplitPersistence.js`
- [ ] `src/modules/storyWorkspace/storyOfficialTextRun.js`
- [ ] `src/modules/storyWorkspace/storyReplicationAssetBatches.js`
- [ ] `src/modules/storyWorkspace/storyReplicationAssetFrameRecovery.js`
- [ ] `src/modules/storyWorkspace/storyReplicationAssetRecoveryPresentation.js`
- [ ] `src/modules/storyWorkspace/storyReplicationCharacterIdentity.js`
- [ ] `src/modules/storyWorkspace/storyReplicationComparisonLayout.js`
- [ ] `src/modules/storyWorkspace/storyReplicationConcurrentTasks.js`
- [ ] `src/modules/storyWorkspace/storyReplicationDraftRecovery.js`
- [ ] `src/modules/storyWorkspace/storyReplicationEpisodeCardPresentation.js`
- [ ] `src/modules/storyWorkspace/storyReplicationFinalAssembly.js`
- [ ] `src/modules/storyWorkspace/storyReplicationFinalDelivery.js`
- [ ] `src/modules/storyWorkspace/storyReplicationFinalReviewRun.js`
- [ ] `src/modules/storyWorkspace/storyReplicationFinalReviewService.js`
- [ ] `src/modules/storyWorkspace/storyReplicationHomeFeedback.js`
- [ ] `src/modules/storyWorkspace/storyReplicationIdentityReview.js`
- [ ] `src/modules/storyWorkspace/storyReplicationIntentRecovery.js`
- [ ] `src/modules/storyWorkspace/storyReplicationParallelPreparation.js`
- [ ] `src/modules/storyWorkspace/storyReplicationProductAdoption.js`
- [ ] `src/modules/storyWorkspace/storyReplicationProductTask.js`
- [ ] `src/modules/storyWorkspace/storyReplicationProductWorkspaceController.js`
- [ ] `src/modules/storyWorkspace/storyReplicationProjectPromptMode.js`
- [ ] `src/modules/storyWorkspace/storyReplicationPromptReviewAnchor.js`
- [ ] `src/modules/storyWorkspace/storyReplicationPromptReviewData.js`
- [ ] `src/modules/storyWorkspace/storyReplicationPromptReviewEditor.js`
- [ ] `src/modules/storyWorkspace/storyReplicationSourceDuration.js`
- [ ] `src/modules/storyWorkspace/storyReplicationSourcePoster.js`
- [ ] `src/modules/storyWorkspace/storyReplicationStagePolicy.js`
- [ ] `src/modules/storyWorkspace/storyReplicationStatusQuery.js`
- [ ] `src/modules/storyWorkspace/storyReplicationUploadedImageAnalysis.js`
- [ ] `src/modules/storyWorkspace/storyReplicationUsageWorkspaceController.js`
- [ ] `src/modules/storyWorkspace/storyReplicationVideoComparison.js`
- [ ] `src/modules/storyWorkspace/storyReplicationWan30Prompt.js`
- [ ] `src/modules/storyWorkspace/storySourceChunking.js`
- [ ] `src/modules/storyWorkspace/storyVideoReplicationPromptAnalysis.js`
- [ ] `src/modules/storyWorkspace/textModelContextBudget.js`

### electron（16）
- [ ] `electron/appWindowSizePolicy.js`
- [ ] `electron/backendStartupMonitor.js`
- [ ] `electron/canvasRuntimeMode.js`
- [ ] `electron/chromeBrowserWorker.js`
- [ ] `electron/chromeCdpPipeClient.js`
- [ ] `electron/chromeShellBrowserVersion.js`
- [ ] `electron/chromeShellLauncher.js`
- [ ] `electron/chromeShellProfileRecovery.js`
- [ ] `electron/chromeShellRuntime.js`
- [ ] `electron/chromeShellStartupDiagnostics.js`
- [ ] `electron/chromeShellStartupFallback.js`
- [ ] `electron/chromeShellStartupHealth.js`
- [ ] `electron/chromeShellWebPreviewManager.js`
- [ ] `electron/nativeContextMenuIcons.js`
- [ ] `electron/sortformerModelRoot.js`
- [ ] `electron/windowsTaskbarIdentity.js`

### api（11）
- [ ] `api/adminContentApi.js`
- [ ] `api/directorMobileClientApi.js`
- [ ] `api/mediaTaskHistoryApi.js`
- [ ] `api/officialTextRun.js`
- [ ] `api/replicationDiagnostics.js`
- [ ] `api/storyReplicationFlowApi.js`
- [ ] `api/storyReplicationLocalMediaApi.js`
- [ ] `api/storyReplicationTaskApi.js`
- [ ] `api/storyReplicationUploadConfig.js`
- [ ] `api/storyReplicationUsageApi.js`
- [ ] `api/textImageInputPreparation.js`

### src/modules（7）
- [ ] `src/modules/ImageExpandController_lf.js`
- [ ] `src/modules/MediaTaskHistoryPanel.js`
- [ ] `src/modules/MediaTaskRecoveryPanel.js`
- [ ] `src/modules/ProjectManager.js`
- [ ] `src/modules/externalProjectOpen.js`
- [ ] `src/modules/mediaTaskRecoveryCanvas.js`
- [ ] `src/modules/promptMentionMatcher.js`

### src/domain/storyGeneration（6）
- [ ] `src/domain/storyGeneration/index.js`
- [ ] `src/domain/storyGeneration/videoReplicationEvidenceTime.js`
- [ ] `src/domain/storyGeneration/videoReplicationFlowAsr.js`
- [ ] `src/domain/storyGeneration/videoReplicationFlowPlanning.js`
- [ ] `src/domain/storyGeneration/videoReplicationRepairEvidence.js`
- [ ] `src/domain/storyGeneration/videoReplicationVerifiedRepair.js`

### .（5）
- [ ] `electron-builder.win.cjs`
- [ ] `electron-builder.win.dev.cjs`
- [ ] `eslint.config.mjs`
- [ ] `playwright.config.js`
- [ ] `playwright.desktop.config.js`

### src/manifests/audio/modelApi（5）
- [ ] `src/manifests/audio/modelApi/runningHubAudioCatalogShared.js`
- [ ] `src/manifests/audio/modelApi/runningHubDoubaoAudioManifests.js`
- [ ] `src/manifests/audio/modelApi/runningHubMinimaxAudioManifests.js`
- [ ] `src/manifests/audio/modelApi/runningHubMurekaAudioManifests.js`
- [ ] `src/manifests/audio/modelApi/runningHubQwenAudioManifests.js`

### src/hooks（4）
- [ ] `src/hooks/index.js`
- [ ] `src/hooks/useHistory.js`
- [ ] `src/hooks/useSelection.js`
- [ ] `src/hooks/useViewport.js`

### src/services（4）
- [ ] `src/services/initialThemeBootstrap.js`
- [ ] `src/services/localAudioPlaybackObjectUrlService.js`
- [ ] `src/services/nodeMediaExportService.js`
- [ ] `src/services/officialPromptEnhancementPolicy.js`

### api/adapters（3）
- [ ] `api/adapters/ApimartAdapter.js`
- [ ] `api/adapters/ComfyUiWorkflowMappingAdapter.js`
- [ ] `api/adapters/GeminiAdapter.js`

### api/story-generation（3）
- [ ] `api/story-generation/storyPromptModeRules.js`
- [ ] `api/story-generation/storyReplicationFlowPrompts.js`
- [ ] `api/story-generation/storyReplicationReviewRecovery.js`

### src/components/aigenImage（3）
- [ ] `src/components/aigenImage/refBarDragSort.js`
- [ ] `src/components/aigenImage/runningHubInstanceDevModeBinding.js`
- [ ] `src/components/aigenImage/uiSchemaBindingEvents.js`

### src/modules/storyboard3d（3）
- [ ] `src/modules/storyboard3d/geometryImportWorkerCore.js`
- [ ] `src/modules/storyboard3d/index.js`
- [ ] `src/modules/storyboard3d/mobileCameraClient.js`

### src/core（2）
- [ ] `src/core/rendererViewportCommitGate.js`
- [ ] `src/core/store.js`

### src/manifests/video/modelApi（2）
- [ ] `src/manifests/video/modelApi/minimaxH3VideoModelApiShared.js`
- [ ] `src/manifests/video/modelApi/runningHubSeedance25VideoModelApiManifest.js`

### src/modules/nodeExport（2）
- [ ] `src/modules/nodeExport/NodeMediaExportDialog.js`
- [ ] `src/modules/nodeExport/collectNodeMedia.js`

### api/adapters/runninghubWorkflowResolvers（1）
- [ ] `api/adapters/runninghubWorkflowResolvers/runningHubReferenceMediaResolverShared.js`

### api/utils（1）
- [ ] `api/utils/replicationSourceUrl.js`

### src/components/nodeToolbar/imageActions（1）
- [ ] `src/components/nodeToolbar/imageActions/annotateCloneAction.js`

### src/components/nodeToolbar/videoActions（1）
- [ ] `src/components/nodeToolbar/videoActions/videoDepthEditor.js`

### src/core/stores（1）
- [ ] `src/core/stores/index.js`

### src/modules/projectPackage（1）
- [ ] `src/modules/projectPackage/fullProjectPackageSession.js`

### src/modules/timelineExport（1）
- [ ] `src/modules/timelineExport/TimelineExportDialog.js`

### src/modules/whiteboard（1）
- [ ] `src/modules/whiteboard/whiteboardDrawing.js`

### src/utils（1）
- [ ] `src/utils/format.js`

