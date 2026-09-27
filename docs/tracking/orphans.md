# 孤立模块清单（已落地但从入口不可达）

> 由 `docs/TRACKING.md` 维护。依据是 2026-09-25 对本地镜像做的静态依赖分析：从 `index.html`、`main.js`、`renderer.js`、`electron/main.js`、preload 和 worker 等入口出发，沿相对 import 遍历，走不到的非测试 JS 模块都列在这里。
> 增量台账共 **274** 个，非测试 JS 模块总数 1036（第 123b 基线 257/1019 加 124a–124e 的 17 件；2026-09-28 反查消费方 0 命中，本次未重跑全图遍历）。大部分是第 56–124e 批「落地不接线」的移植件；少数是 0.4.12 原有的遗留文件，如 `src/hooks/*`、`src/core/store.js`、`ProjectManager.js`。
> 某个模块接线后，从本表删掉它，并同步 `docs/TRACKING.md` §5 的计数。重算方法：从上述入口做 import 可达性遍历，排除 `*.test.js`、`vendor/`、`deobfuscated/`。

| 目录 | 数量 |
| --- | --- |
| `src/modules/agent/` | 67 |
| `src/modules/storyboard3d/` | 43 |
| `src/services/` | 19 |
| `electron/` | 16 |
| `api/story-generation/` | 23 |
| `src/modules/storyWorkspace/` | 34 |
| `src/modules/collaboration/` | 17 |
| `src/core/` | 9 |
| `src/modules/` | 8 |
| `src/modules/personReplacement/` | 8 |
| `src/hooks/` | 4 |
| `src/modules/nodeManager/` | 4 |
| `src/utils/` | 3 |
| `api/adapters/` | 2 |
| `./` | 1 |
| `api/` | 4 |
| `api/utils/` | 4 |
| `db/migrations/` | 1 |
| `src/components/` | 1 |
| `src/components/aigenImage/` | 1 |
| `src/components/nodeToolbar/` | 1 |
| `src/config/` | 1 |
| `src/core/stores/` | 1 |
| `src/modules/runninghubAiApp/` | 1 |
| `src/modules/settings/` | 1 |

## `src/modules/agent/`（67）

agentActionPostconditions.js、agentAssistantConversation.js、agentAssistantConversationRuntime.js、agentAssistantMarkdown.js、agentCapabilityDiscovery.js、agentCapabilityRouter.js、agentClarificationPolicy.js、agentCompletionEvidence.js、agentComposerAttachmentController.js、agentContextDigest.js、agentContex
tDigestRuntime.js、agentConversationActionText.js、agentConversationActions.js、agentConversationCanvasTransfer.js、agentConversationCanvasTransferRuntime.js、agentConversationCapabilityRuntime.js、agentConversationChoices.js、agentConversationIntent.js、agentConversationPresentation.js、agentConversationScr
oll.js、agentConversationStreamingPresentation.js、agentConversationText.js、agentDiscoveryCommands.js、agentDocumentInput.js、agentDurableRunState.js、agentExternalInformation.js、agentExternalInformationRuntime.js、agentExternalToolRegistry.js、agentFailureDiagnostic.js、agentLoopPlanSelection.js、agentLoopR
ecovery.js、agentMessageTime.js、agentModelRequestRuntime.js、agentPanelContinuity.js、agentPanelElements.js、agentPanelText.js、agentParameterHints.js、agentPlanLifecycle.js、agentPrecreatedNode.js、agentProjectMemory.js、agentProjectMemoryConversationRuntime.js、agentProjectMemoryStore.js、agentReferenceConte
xt.js、agentReplyVersions.js、agentRunEventLog.js、agentRunStatusPresentation.js、agentRunSteps.js、agentScrollableWheel.js、agentSessionEventLog.js、agentSkillAuthoring.js、agentSkillAuthoringRuntime.js、agentSkillConversationRuntime.js、agentSkillEditor.js、agentSkillLifecycle.js、agentSkillLifecycleRuntime.j
s、agentSkillLoader.js、agentSkillPanel.js、agentSkillPanelText.js、agentSkillPicker.js、agentSkillPreferences.js、agentSkillRegistry.js、agentSkillUsage.js、agentStreamingProse.js、agentTaskBindingRuntime.js、agentTextConversationRuntime.js、agentToolResult.js、agentTurnRouter.js

## `src/modules/storyboard3d/`（43）

assetCatalogSelection.js、assetRecord.js、backgroundCalibration.js、backgroundCalibrationInteraction.js、backgroundImageController.js、backgroundPerspectiveEstimator.js、binaryAssetRepository.js、characterImagePoseController.js、directorCameraKeyEditor.js、directorCameraPath.js、directorCameraPathPanel.js、dir
ectorClipTimeline.js、directorClips.js、directorCurveEditor.js、directorCurves.js、directorFollowPanel.js、directorGeneratedLayers.js、directorNumericDrag.js、directorRecovery.js、directorSceneAuthoring.js、directorSceneRuntime.js、directorSceneSettings.js、directorTimelineOperations.js、editorStore.js、exportCa
nvasBridge.js、exportController.js、gltfImportAdapter.js、imagePoseEstimator.js、imagePoseRetargeter.js、imagePoseRuntimeManifest.js、instanceBatching.js、miniMapMath.js、modelImport.js、modelImportJob.js、objectTransformCapabilities.js、selectionBox.js、storyboardExport.js、texturePolicy.js、timelinePresentation
.js、transformSession.js、viewportNavigationProtocol.js、viewportNavigationSettings.js、voiceInputService.js

## `src/services/`（19）

binghuoCatalogPricing.js、canvasPanShortcutState.js、canvasProjectAccess.js、downloadNamingService.js、downloadSaveService.js、escapeScope.js、fastImagePreviewService.js、legacyStorageMigrationDeadline.js、mediaObjectUrlRegistry.js、modalInteractionScope.js、packagedBrowserShortcutGuard.js、physicalShortcutSta
te.js、projectSaveQueue.js、providerConnectionVerification.js、rendererStartupEvidence.js、rendererStartupState.js、startupVisualReadiness.js、videoFramePresentation.js、webPreviewRemoteInputQueue.js

## `electron/`（16）

appWindowSizePolicy.js、backendStartupMonitor.js、canvasRuntimeMode.js、chromeCdpPipeClient.js、chromeShellBrowserVersion.js、chromeShellLauncher.js、chromeShellProfileRecovery.js、chromeShellRuntime.js、chromeShellStartupDiagnostics.js、chromeShellStartupFallback.js、chromeShellStartupHealth.js、chromeShellWe
bPreviewManager.js、desktopStartupLifecycle.js、nativeContextMenuIcons.js、sortformerModelRoot.js、windowsTaskbarIdentity.js

## `api/story-generation/`（23）

storyAssetExtractionRequest.js、storyAssetExtractionResult.js、storyAssetHybridBudget.js、storyAssetParallelExtraction.js、storyAssetReferenceContract.js、storyAssetRequiredContracts.js、storyAssetRequirementEvidence.js、storyAssetVoicePolicy.js、storyEpisodeOutlinePlanning.js、storyEpisodeScriptPrompt.js、
storyEpisodeScriptResponseRecovery.js、storyEpisodeScriptTiming.js、storyEpisodeSpokenTiming.js、storyInvocationEvidence.js、storyReplicationAssetFrames.js、storyReplicationFlowPrompts.js、storyReplicationMissingClips.js、storyRequestPolicy.js、storyReviewOutputContract.js、storyReviewRequestJournal.js、
storySummaryBlueprint.js、storySummaryGeneration.js、storyTextRequest.js

## `src/modules/storyWorkspace/`（34）

storyAssetExtractionDraft.js、storyAssetExtractionRunner.js、storyAssetHoverPreviewController.js、storyAsyncButtonPresentation.js、storyCanvasBinding.js、storyClipExport.js、storyClipFrameCapture.js、storyClipFrames.js、storyClipInputSlots.js、storyClipProductionPresentation.js、storyClipPromptReferences.js、
storyClipVideoResultDom.js、storyCollaborationPolicy.js、storyEpisodeScriptBatchQueue.js、storyEpisodeSplitBatchExecution.js、storyEpisodeSplitPresentationPolicy.js、storyHomeRewrite.js、storyLibraryAppearanceMenuPortal.js、storyOutlineNavigation.js、storyProjectNavigation.js、
storyReplicationAssetIdentity.js、storyReplicationDefinitions.js、storyReplicationVideoLimits.js、storyScriptImport.js、storyScriptRevision.js、storySpeechGapEditor.js、storyStyleCatalog.js、storySummaryRun.js、storyTaskBatchCancellation.js、storyVideoThumbnailBackfill.js、storyWorkspaceChromePresentation.js、
storyWorkspaceData.js、storyWorkspacePersistence.js、storyWorkspaceSurface.js

## `src/core/`（9）

rendererEdgeHitIndex.js、rendererEdgeVisibilityIndex.js、rendererFastPreviewAdmission.js、rendererFastPreviewContinuation.js、rendererMediaRuntimePreparer.js、rendererRasterProxyPolicy.js、rendererRuntimeDiagnostics.js、store.js、viewportInteractionState.js

## `src/modules/`（8）

ImageExpandController_lf.js、ImageExpandController_test.js、ProjectManager.js、modelGenerationParamMemory.js、modelProviderProfileSelection.js、nodeBatchExport.js、runningHubProviderProfiles.js、workspaceStudioModes.js

## `src/modules/personReplacement/`（8）

personReplacementCapabilities.js、personReplacementGenerationTaskIdentity.js、personReplacementOutputLineage.js、personReplacementProjectLibrary.js、personReplacementPromptIdentity.js、personReplacementVoiceLibrary.js、personReplacementWorkspaceInput.js、replacementStudioTerminology.js

## `src/hooks/`（4）

index.js、useHistory.js、useSelection.js、useViewport.js

## `src/modules/nodeManager/`（4）

nodeManagerDragContract.js、nodeManagerDragController.js、nodeManagerModel.js、nodeManagerPlacement.js

## `src/utils/`（3）

contextMenuShortcutCatalog.js、focusTrap.js、format.js

## `api/adapters/`（2）

ApimartAdapter.js、GeminiAdapter.js

## `./`（1）

playwright.config.js

## `api/`（4）

agentModelRequestParams.js、mediaUploadErrors.js、runningHubUploadResponse.js、runningHubWorkflowPollingPolicy.js

## `api/utils/`（4）

storyAssetPublicText.js、storyGenerationValues.js、storySceneIdentity.js、strictJson.js

## `db/migrations/`（1）

001_short_drama_core.cjs

## `src/components/`（1）

sharedIconMarkup.js

## `src/components/aigenImage/`（1）

refBarDragSort.js

## `src/components/nodeToolbar/`（1）

mediaDownloadFilename.js

## `src/config/`（1）

productFeatures.js

## `src/core/stores/`（1）

index.js

## `src/modules/runninghubAiApp/`（1）

rhAiAppRunningHubProfile.js

## `src/modules/settings/`（1）

runningHubDefaultSiteSettings.js

## `src/modules/collaboration/`（17）

collaborationCanvasBinding.js、collaborationChangeFeed.js、collaborationChatInput.js、collaborationChatPosition.js、collaborationChatState.js、collaborationConflicts.js、collaborationConnectionIndicator.js、collaborationDocument.js、collaborationEditing.js、collaborationFieldMerge.js、collaborationJournal.js、collaborationMemberColor.js、collaborationPreferences.js、collaborationPresenceChannel.js、collaborationPreviews.js、collaborationReviewDom.js、collaborationReviewState.js