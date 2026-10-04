# 孤立模块清单（已落地但从入口不可达）

> 由 `docs/TRACKING.md` 维护。**本表是 2026-09-28 第 126 批的实测结果**（第 150–157 批接线后删 81 件、重算 403 / 1238），不再是按批次累加的估算。第 156 批另接通 3 件 `api/errors/parsers/`，属第 126 批之后落地的新文件、不在此快照台账内：
> 从 `index.html` 的 `<script type="module">`、`package.json` 的 `main`（`electron/main.js`）、以及按运行期加载约定补的入口（`electron/*preload*.cjs`、`db/migrations/*.cjs`、`knexfile.cjs`、`main.js`）出发，
> 沿相对 `import` / `export … from` / 动态 `import()` / `new URL("…js", import.meta.url)` 做全图遍历，走不到的非测试 JS 模块都列在这里。
> 脚本与证据：`deobf-tools/b126/reach.mjs`、`reach-report.txt`、`reach-orphans.json`；方法说明见 `docs/b126-reachability.md`。

> scope：**1238** 个非测试 JS 模块（`src/`、`api/`、`electron/`、`db/` 加根级 `*.js`/`*.cjs`；排除 `*.test.js` / `*_test.js` / `*.spec.js`、`node_modules/`、`deobfuscated/`、`vendor/`、`user/`、`data/`、`output/`、`build/`、`dist/`、`tools/`、`backend/`）。
> 可达 **838** / 孤立 **403** / 断链 **0** / 解析失败 **0**（断链为 0 说明整个仓库的相对 import 都能解析到实际文件）。第 150 批接线 9 件、第 151 批 1 件、第 152 批 2 件（api 组余 2）、第 153 批 11 件（canvasShortcuts 与 tutorials 组清零）、第 154 批 16 件（imageAnnotate 组清零）、第 155 批 8 件、第 157 批 34 件后重算（第 157 批另 12 件 0.7.16 淘汰件不计入本表）。
> 另有 5 个 `vendor/three/**` 文件可达，不计入 scope。

> 某个模块接线后，从本表删掉它，并同步 `docs/TRACKING.md` §5 的计数。重算：`node deobf-tools/b126/reach.mjs`。

| 目录 | 数量 |
| --- | --- |
| `src/modules/` | 78 |
| `src/modules/agent/` | 62 |
| `src/modules/storyWorkspace/` | 48 |
| `src/modules/storyboard3d/` | 46 |
| `src/modules/personReplacement/` | 37 |
| `src/modules/collaboration/` | 24 |
| `api/story-generation/` | 23 |
| `src/services/` | 15 |
| `electron/` | 18 |
| `src/modules/app/` | 18 |
| `src/modules/panoramaSceneNode/` | 5 |
| `src/core/` | 9 |
| `src/modules/settings/` | 4 |
| `src/modules/runninghubAiApp/` | 7 |
| `src/modules/interaction/` | 4 |
| `api/` | 4 |
| `api/utils/` | 4 |
| `src/hooks/` | 4 |
| `src/modules/nodeManager/` | 4 |
| `src/modules/videoRetake/` | 4 |
| `src/utils/` | 3 |
| `src/modules/canvasMcp/` | 3 |
| `src/modules/canvasShortcuts/` | 0 |
| `src/modules/tutorials/` | 0 |
| `src/modules/whiteboard/` | 3 |
| `api/adapters/` | 2 |
| `src/components/` | 2 |
| `src/modules/imageAnnotate/` | 0 |
| `./` | 1 |
| `src/components/aigenImage/` | 1 |
| `src/components/nodeToolbar/` | 1 |
| `src/config/` | 1 |
| `src/core/stores/` | 1 |
| `src/modules/characterAssets/` | 1 |
| `src/modules/promptPresetCatalog/` | 1 |
| **合计** | **403** |

## `src/modules/`（72）

ImageExpandController_lf.js、ProjectManager.js、agnesProviderProfiles.js、assetCreateFly.js、audioVoiceAnalysisSegments.js、audioVoiceAnalysisSession.js、audioVoiceConfirmDialog.js、audioVoiceLocalAsrRuntime.js、audioVoicePanelEvents.js、audioVoicePanelGenerationFeedback.js、audioVoicePanelPickSession.js、audioVoicePanelSegmentState.js、audioVoicePlaybackSession.js、audioVoiceRuntimeRepairFlow.js、audioVoiceSegmentEditSession.js、audioVoiceTranslation.js、canvasImageDisplayHandoff.js、canvasToolbarPlacement.js、generationPromptPolicy.js、groupNodeLayout.js、materialLibraryPolicy.js、minimaxProviderProfiles.js、modelApiVideoResolverPolicy.js、modelGenerationParamMemory.js、modelMediaInputLimits.js、modelProviderProfileSelection.js、modelProviderProfiles.js、nodeBatchExport.js、promptAssetInputRefs.js、promptMentionMatcher.js、promptPasteVirtualization.js、promptReferenceSignature.js、promptTriggerComposition.js、referenceInputThumbnail.js、runningHubInstanceTypes.js、runningHubProviderProfiles.js、taskCenterModel.js、taskCenterThumbnail.js、toolbarPendingResultNodes.js、videoAspectRatioExecution.js、videoKeyingProjection.js、videoKeyingSourceVideoLimit.js、videoTimelineThumbnails.js、workspaceActionIcons.js、workspaceAssetAppearance.js、workspaceAssetDragPreview.js、workspaceAssetHover.js、workspaceAssetLibraryContextMenu.js、workspaceAssetPromptPresets.js、workspaceAssetSelection.js、workspaceAssetSettingsShell.js、workspaceBetaNotice.js、workspaceCanvasMaterialization.js、workspaceContextMenuGuard.js、workspaceEpisodeRailPresentation.js、workspaceHorizontalWheel.js、workspaceImageDownload.js、workspaceMarqueeSelection.js、workspaceMediaDownload.js、workspaceMediaHistory.js、workspaceMenuController.js、workspacePageTransition.js、workspacePersistenceCoordinator.js、workspacePersistencePresentation.js、workspacePresentationLifecycle.js、workspaceProjectHome.js、workspaceResizeSession.js、workspaceStepShortcut.js、workspaceStudioModes.js、workspaceVideoDownload.js、workspaceVideoPlaybackControls.js、workspaceWheelNavigation.js

## `src/modules/agent/`（47）

agentAssistantConversation.js、agentAssistantConversationRuntime.js、agentAssistantMarkdown.js、agentCapabilityDiscovery.js、agentContextDigest.js、agentContextDigestRuntime.js、agentConversationActionText.js、agentConversationCanvasTransfer.js、agentConversationCapabilityRuntime.js、agentConversationIntent.js、agentConversationPresentation.js、agentConversationScroll.js、agentConversationStreamingPresentation.js、agentConversationText.js、agentDiscoveryCommands.js、agentDocumentInput.js、agentDurableRunState.js、agentExternalInformation.js、agentExternalInformationRuntime.js、agentExternalToolRegistry.js、agentLoopRecovery.js、agentMessageTime.js、agentModelRequestRuntime.js、agentPanelElements.js、agentPanelText.js、agentParameterHints.js、agentProjectMemory.js、agentProjectMemoryConversationRuntime.js、agentProjectMemoryStore.js、agentReplyVersions.js、agentRunEventLog.js、agentRunStatusPresentation.js、agentRunSteps.js、agentSessionEventLog.js、agentSkillAuthoring.js、agentSkillAuthoringRuntime.js、agentSkillConversationRuntime.js、agentSkillLifecycle.js、agentSkillLifecycleRuntime.js、agentSkillLoader.js、agentSkillPanelText.js、agentSkillPreferences.js、agentSkillRegistry.js、agentSkillUsage.js、agentStreamingProse.js、agentTextConversationRuntime.js、agentTurnRouter.js

## `src/modules/storyWorkspace/`（48）

replicationWorkspaceBetaNotice.js、storyAssetExtractionDraft.js、storyAssetExtractionRunner.js、storyAssetHoverPreviewController.js、storyAssetPromptPresets.js、storyAssetSettingsShell.js、storyAsyncButtonPresentation.js、storyCanvasBinding.js、storyCanvasMediaSync.js、storyCanvasNodeSubscription.js、storyCanvasSyncWorkspaceController.js、storyClipExport.js、storyClipFrameCapture.js、storyClipFrames.js、storyClipInputSlots.js、storyClipProductionPresentation.js、storyClipPromptReferences.js、storyClipVideoResultDom.js、storyCollaborationPolicy.js、storyEpisodeScriptBatchQueue.js、storyEpisodeSplitBatchExecution.js、storyEpisodeSplitPresentationPolicy.js、storyHomeRewrite.js、storyLibraryAppearanceMenuPortal.js、storyMarqueeSelection.js、storyMediaHistory.js、storyOutlineNavigation.js、storyProjectNavigation.js、storyReplicationAssetFrames.js、storyReplicationAssetIdentity.js、storyReplicationDefinitions.js、storyReplicationRepresentativeFrames.js、storyReplicationReviewLayout.js、storyReplicationReviewThumbnails.js、storyReplicationVideoLimits.js、storyScriptImport.js、storyScriptRevision.js、storySpeechGapEditor.js、storyStyleCatalog.js、storySummaryRun.js、storyTaskBatchCancellation.js、storyVideoThumbnailBackfill.js、storyWorkspaceBetaNotice.js、storyWorkspaceChromePresentation.js、storyWorkspaceData.js、storyWorkspaceIcons.js、storyWorkspacePersistence.js、storyWorkspaceSurface.js

## `src/modules/storyboard3d/`（46）

assetCatalogSelection.js、assetRecord.js、backgroundCalibration.js、backgroundCalibrationInteraction.js、backgroundImageController.js、backgroundPerspectiveEstimator.js、binaryAssetRepository.js、characterActionSampling.js、characterImagePoseController.js、directorCameraKeyEditor.js、directorCameraPath.js、directorCameraPathPanel.js、directorClipTimeline.js、directorClips.js、directorCurveEditor.js、directorCurves.js、directorFollowPanel.js、directorGeneratedLayers.js、directorNumericDrag.js、directorRecovery.js、directorSceneAuthoring.js、directorSceneRuntime.js、directorSceneSettings.js、directorTimelineOperations.js、editorStore.js、exportCanvasBridge.js、exportController.js、geometryImportWorkerCore.js、gltfImportAdapter.js、imagePoseEstimator.js、imagePoseRetargeter.js、imagePoseRuntimeManifest.js、instanceBatching.js、miniMapMath.js、modelGeometryImport.worker.js、modelImport.js、modelImportJob.js、objectTransformCapabilities.js、selectionBox.js、storyboardExport.js、texturePolicy.js、timelinePresentation.js、transformSession.js、viewportNavigationProtocol.js、viewportNavigationSettings.js、voiceInputService.js

## `src/modules/personReplacement/`（37）

personReplacementAssetPackage.js、personReplacementBoxDragPreview.js、personReplacementCapabilities.js、personReplacementCharacterAppearanceLocalization.js、personReplacementCompletionNavigation.js、personReplacementCompositeMediaResidency.js、personReplacementDetectionFeedback.js、personReplacementExport.js、personReplacementExportSubmenuController.js、personReplacementGenerationTaskIdentity.js、personReplacementLocationGuideSvg.js、personReplacementManualBox.js、personReplacementModelGate.js、personReplacementOutputLineage.js、personReplacementProjectLibrary.js、personReplacementPromptEnhancement.js、personReplacementPromptEnhancementIntegration.js、personReplacementPromptIdentity.js、personReplacementPromptMode.js、personReplacementResultHistoryLayout.js、personReplacementShotCutModel.js、personReplacementShotReverse.js、personReplacementSlideTransition.js、personReplacementSmartDetectPresentation.js、personReplacementSourceDescriptions.js、personReplacementSourcePlayback.js、personReplacementStableDom.js、personReplacementTimelineExport.js、personReplacementTimelineExportPrompt.js、personReplacementVideoGeneration.js、personReplacementVideoSyncPlayback.js、personReplacementVoiceLibrary.js、personReplacementVoiceSeparationState.js、personReplacementWorkspaceInput.js、personReplacementWorkspaceIntentPort.js、replacementStudioBetaNotice.js、replacementStudioTerminology.js

## `src/modules/collaboration/`（24）

collaborationActivity.js、collaborationCanvasBinding.js、collaborationChangeFeed.js、collaborationChatInput.js、collaborationChatPosition.js、collaborationChatState.js、collaborationCommentThreads.js、collaborationConflicts.js、collaborationConnectionIndicator.js、collaborationDocument.js、collaborationEditing.js、collaborationFieldMerge.js、collaborationInvitation.js、collaborationJournal.js、collaborationLobby.js、collaborationMemberColor.js、collaborationMembers.js、collaborationNicknameEditor.js、collaborationPreferences.js、collaborationPresenceChannel.js、collaborationPreviews.js、collaborationReviewDom.js、collaborationReviewState.js、collaborationSelect.js

## `api/story-generation/`（23）

storyAssetExtractionRequest.js、storyAssetExtractionResult.js、storyAssetHybridBudget.js、storyAssetParallelExtraction.js、storyAssetReferenceContract.js、storyAssetRequiredContracts.js、storyAssetRequirementEvidence.js、storyAssetVoicePolicy.js、storyEpisodeOutlinePlanning.js、storyEpisodeScriptPrompt.js、storyEpisodeScriptResponseRecovery.js、storyEpisodeScriptTiming.js、storyEpisodeSpokenTiming.js、storyInvocationEvidence.js、storyReplicationAssetFrames.js、storyReplicationFlowPrompts.js、storyReplicationMissingClips.js、storyRequestPolicy.js、storyReviewOutputContract.js、storyReviewRequestJournal.js、storySummaryBlueprint.js、storySummaryGeneration.js、storyTextRequest.js

## `src/services/`（14）

binghuoCatalogPricing.js、canvasProjectAccess.js、downloadNamingService.js、downloadSaveService.js、escapeScope.js、legacyStorageMigrationDeadline.js、mediaObjectUrlRegistry.js、modalInteractionScope.js、packagedBrowserShortcutGuard.js、projectSaveQueue.js、providerConnectionVerification.js、rendererStartupEvidence.js、rendererStartupState.js、videoFramePresentation.js

## `electron/`（18）

appWindowSizePolicy.js、backendStartupMonitor.js、canvasRuntimeMode.js、chromeBrowserWorker.js、chromeCdpPipeClient.js、chromeShellBrowserVersion.js、chromeShellLauncher.js、chromeShellProfileRecovery.js、chromeShellRuntime.js、chromeShellStartupDiagnostics.js、chromeShellStartupFallback.js、chromeShellStartupHealth.js、chromeShellWebPreviewManager.js、desktopStartupLifecycle.js、globalCaptureWindow.js、nativeContextMenuIcons.js、sortformerModelRoot.js、windowsTaskbarIdentity.js

## `src/modules/app/`（12）

agentMaterialUpload.js、appActivityTracking.js、appCanvasDropImport.js、appDebugApis.js、canvasWorkspacePresentation.js、completionNavigation.js、globalScreenshotBridge.js、iconButtonMotion.js、nativeContextMenuGuard.js、projectContext.js、sourceNodeNameBackfill.js、workspaceCacheIdleScheduler.js

## `src/modules/panoramaSceneNode/`（5）

cameraTimeline.js、poseCatalog.js、scene3dProceduralAssetVisual.js、sceneAssetCatalog.js、transformInteractionAdapter.js

## `src/core/`（9）

rendererEdgeHitIndex.js、rendererEdgeVisibilityIndex.js、rendererFastPreviewAdmission.js、rendererFastPreviewContinuation.js、rendererMediaRuntimePreparer.js、rendererRasterProxyPolicy.js、rendererRuntimeDiagnostics.js、store.js、viewportInteractionState.js

## `src/modules/settings/`（1）

notificationShortcutSettings.js

## `src/modules/runninghubAiApp/`（7）

rhAiAppFieldMetadata.js、rhAiAppMotion.js、rhAiAppPersistence.js、rhAiAppPreviewPresentation.js、rhAiAppRunningHubProfile.js、rhAiAppSaveAction.js、rhAiAppSources.js

## `src/modules/interaction/`（3）

WheelPanController.js、dropTargetSpatialQuery.js、viewportPreviewCoordinator.js

## `api/`（2）

agentModelRequestParams.js、mediaUploadErrors.js

## `api/utils/`（4）

storyAssetPublicText.js、storyGenerationValues.js、storySceneIdentity.js、strictJson.js

## `src/hooks/`（4）

index.js、useHistory.js、useSelection.js、useViewport.js

## `src/modules/nodeManager/`（4）

nodeManagerDragContract.js、nodeManagerDragController.js、nodeManagerModel.js、nodeManagerPlacement.js

## `src/modules/videoRetake/`（4）

segmentRetakeInputBinding.js、segmentRetakeModelPolicy.js、segmentRetakeModelPreference.js、segmentRetakeSession.js

## `src/utils/`（3）

contextMenuIconCatalog.js、focusTrap.js、format.js

## `src/modules/canvasMcp/`（3）

canvasMcpAutoConnection.js、canvasMcpSession.js、canvasMcpTools.js

## `src/modules/canvasShortcuts/`（0）

（第 153 批接线清零）

## `src/modules/tutorials/`（0）

（第 153 批接线清零）

## `src/modules/whiteboard/`（1）

whiteboardNodeData.js

## `api/adapters/`（2）

ApimartAdapter.js、GeminiAdapter.js

## `src/components/`（2）

contextMenuIcon.js、sharedIconMarkup.js

## `src/modules/imageAnnotate/`（0）

（第 154 批清零）

## `./`（1）

playwright.config.js

## `src/components/aigenImage/`（1）

refBarDragSort.js

## `src/components/nodeToolbar/`（1）

mediaDownloadFilename.js

## `src/config/`（1）

productFeatures.js

## `src/core/stores/`（1）

index.js

## `src/modules/characterAssets/`（1）

characterAssetImageGeneration.js

## `src/modules/promptPresetCatalog/`（1）

doubaoAudio1PromptPresets.js
