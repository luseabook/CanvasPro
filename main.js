import { registerPageTeardown, runCleanupSteps } from './src/utils/cleanupSteps.js';
import './src/services/startupLoaderBootstrap.js';
import { createStoryAgentComposition } from './src/modules/app/storyAgentComposition.js';
import { installWorkspaceCloseGuard } from './src/modules/app/workspaceCloseGuard.js';
import appStore, { graphStore, uiStore, workspaceStore } from './src/core/stores/appStore.js';
import { subscribeNodeDeletions } from './src/core/nodeDeletionEvents.js';
import { pauseActiveWorkspaceTasks } from './src/core/generationTaskRuntime.js';
import { createCompletionNavigation } from './src/modules/app/completionNavigation.js';
import { initRenderer, refreshManifestModelNodeUis } from './src/core/renderer.js';
import { createCanvasViewportVideoWarmupController } from './src/core/canvasViewportVideoWarmupController.js';
import { createCanvasWorkspacePresentation } from './src/modules/app/canvasWorkspacePresentation.js';
import { initRendererUiEvents, installRendererEventBindingGuard } from './src/ui/rendererUiEvents.js';
import { desktopBridge, installDesktopBridgeCompat } from './src/services/desktopBridge.js';
import { scheduleChromeShellStartupReady } from './src/services/chromeShellStartupReadiness.js';
import { rendererStartupState } from './src/services/rendererStartupState.js';
import { migrateLegacyRendererStorageIfNeeded } from './src/services/legacyRendererStorageMigration.js';
import {
  executeCommand,
  getDragContext,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleWheel,
  handleWheelPan,
  settleWheelZoom,
  settleWheelPan,
  initCanvasContextMenu,
  initConnectionHandles,
  initPickConnect,
} from './src/core/interaction.js';
import { addEdgeWithPolicies } from './src/modules/interaction/EdgeController.js';
import { registerNode } from './src/modules/registry.js';
import { getNodeTypeAliases } from './src/modules/nodeMeta.js';
import { SourceTextNode } from './src/components/SourceTextNode.js';
import { SourceImageNode } from './src/components/SourceImageNode.js';
import { SourceVideoNode } from './src/components/SourceVideoNode.js';
import { SourceAudioNode } from './src/components/SourceAudioNode.js';
import { WebPreviewNode } from './src/components/WebPreviewNode.js';
import { WebReferenceCardNode } from './src/components/WebReferenceCardNode.js';
import { MediaClipNode } from './src/components/MediaClipNode.js';
import { CommentNoteNode } from './src/components/CommentNoteNode.js';
import { AIGenerateNode } from './src/components/AIGenerateNode.js';
import { installImageGenerationExecution } from './src/components/aigenImage/imageGenerationExecution.js';
import { AIGenTextNode } from './src/components/AIGenTextNode.js';
import { AIGenVideoNode } from './src/components/AIGenVideoNode.js';
import { AIGenAudioNode } from './src/components/AIGenAudioNode.js';
import { GroupNode } from './src/components/GroupNode.js';
import { SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED } from './src/config/productFeatures.js';
import { DebugNode } from './src/components/DebugNode.js';
import { SceneDetectionNode } from './src/components/SceneDetectionNode.js';
import { showDevToast } from './src/components/NodeToolbarConfig.js';
import { setTextWithLineBreaks } from './src/utils/dom.js';
import { StoryboardNode } from './src/components/StoryboardNode.js';
import { StoryboardScriptNode } from './src/components/StoryboardScriptNode.js';
import { CollageNode } from './src/components/CollageNode.js';
import { WhiteboardNode } from './src/components/WhiteboardNode.js';
import { ComfyWorkflowNode } from './src/components/ComfyWorkflowNode.js';
import { StoryWorkspaceNode } from './src/components/StoryWorkspaceNode.js';
import { PanoramaSceneNode } from './src/components/PanoramaSceneNode.js';
import {
  undo,
  redo,
  commit,
  onCommit,
  resetHistory,
  createHistoryCheckpoint,
  undoToHistoryCheckpoint,
} from './src/modules/history.js';
import * as project from './src/modules/project.js';
import { closeShortcuts } from './src/modules/shortcuts.js';
import { applySnapGridEnabled, readSnapGridEnabled } from './src/modules/snapGridState.js';
import {
  initToastService,
  initKeyboardService,
  addShortcutListener,
  handleFileDrop,
  handleWebImageUrlDrop,
  getBaseName,
  getNodeDefaultSize,
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  processFile,
  showError,
  initDesktopMediaWakeService,
  initStoreRuntimeEffects,
} from './src/services/index.js';
import { saveOutputFromUrl, uploadFile } from './src/services/projectService.js';
import { migrateLegacyThumbnailsInMultiData } from './src/services/thumbnailCacheService.js';
import { initWebPreviewViewSyncService } from './src/services/webPreviewViewSyncService.js';
import { sanitizeMultiCanvasDataForPersistence } from './src/utils/thumbnailPersistence.js';
import { loadCustomPresets } from './src/modules/promptPresets.js';
import {
  getProjects,
  createProject,
  deleteProject,
  fetchApiConfigFromServer,
  getApiConfigSnapshot,
  saveApiConfigToServer,
  testProviderConnections,
  analyzeCustomProviderDocumentation,
  buildCustomProviderManifestDraft,
  deleteCustomProviderManifestBundle,
  discoverCustomProvider,
  listCustomProviderManifestBundles,
  saveCustomProviderManifestBundle,
  validateCustomProviderManifestDraft,
  fetchDreaminaCliStatusFromServer,
  fetchDreaminaCliLoginRuntimeFromServer,
  startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer,
  buildDreaminaQrImageUrl,
  startServerConnectionMonitor,
  fetchAppRuntimeInfoFromServer,
  requestAgentAssistantReply,
  requestAgentContextDigest,
  requestAgentSkillDraft,
  requestAgentActionPlan,
  requestPersonReplacementPromptEnhancement,
  adjustStoryClipPrompt,
  generateImage,
  generateVideo,
  generateStoryEpisodeScript,
  generateStorySummary,
  extractStoryAssets,
  extractStoryAssetsParallel,
  extractStoryAssetsHybridExperimental,
  planStoryEpisodeOutlines,
  recoverStoryEpisodeSplitDraftLocally,
  reviewStoryEpisodeSplitQuality,
  splitStoryEpisodeChecked,
  splitStoryEpisodesBatch,
  splitStoryEpisodeExperimental,
  extractStoryDocumentText,
  validateStoryDocumentFile,
  fetchStoryWorkspaceFromServer,
  saveStoryWorkspaceToServer,
  fetchReplacementStudioWorkspaceFromServer,
  saveReplacementStudioWorkspaceToServer,
  analyzeVideoReplicationClip,
  getPersonReplacementModelPackStatus,
  installPersonReplacementModelPack,
} from './api/index.js';
import { reportAppStartupActivity } from './api/appActivityApi.js';
import { initMinimap } from './src/modules/minimap.js';
import ImageAnnotateController from './src/modules/ImageAnnotateController.js';
import ImageMattingController from './src/modules/ImageMattingController.js';
import AudioClipController from './src/modules/AudioClipController.js';
import { runAudioSeparationFromNode } from './src/modules/AudioSeparationController.js';
import { CanvasTabManager } from './src/modules/CanvasTabManager.js';
import { CanvasProjectDropdownManager } from './src/modules/CanvasProjectDropdownManager.js';
import { createCanvasProjectOperations } from './src/modules/canvasProjectOperations.js';
import { createWorkspaceProjectPackageCoordinator } from './src/modules/workspaceProjectPackageCoordinator.js';
import { SettingsManager } from './src/modules/SettingsManager.js';
import { initCanvasMcp } from './src/modules/app/appCanvasMcp.js';
import { createNodeManagerPanel } from './src/modules/nodeManager/NodeManagerPanel.js';
import { initCliProviderSettings } from './src/modules/settings/cliProviderSettings.js';
import { initModelServiceSettingsNavigator } from './src/modules/settings/modelServiceSettingsNavigator.js';
import { MascotManager } from './src/modules/MascotManager.js';
import { initAutoUpdate } from './src/modules/AutoUpdate.js';
import { initDiagnosticsService } from './src/services/diagnosticsService.js';
import { initExternalLinkHandlers } from './src/services/externalLinkService.js';
import { initDevEntries } from './src/modules/devEntry.js';
import { initFloatingMenuKeyboard } from './src/modules/floatingMenuKeyboard.js';
import { initTextInputContextMenu } from './src/modules/textInputContextMenu.js';
import { initTaskCenterManager } from './src/modules/TaskCenterManager.js';
import { initAudioVoicePanel } from './src/modules/audioVoicePanel.js';
import { initStoryWorkspace } from './src/modules/storyWorkspace/storyWorkspace.js';
import { showStoryWorkspaceBetaNotice } from './src/modules/storyWorkspace/storyWorkspaceBetaNotice.js';
import { showReplicationWorkspaceBetaNotice } from './src/modules/storyWorkspace/replicationWorkspaceBetaNotice.js';
import { guardStoryModelTaskCredentials } from './src/modules/storyWorkspace/storyModelCredentialGuard.js';
import { createReplacementStudioApplication } from './src/modules/personReplacement/personReplacementApplication.js';
import { createPersonReplacementPromptEnhancementIntegration } from './src/modules/personReplacement/personReplacementPromptEnhancementIntegration.js';
import { ReplacementStudioModelGate } from './src/modules/personReplacement/personReplacementModelGate.js';
import {
  isReplacementStudioAuthorized,
  requestReplacementStudioAuthorization,
} from './src/modules/personReplacement/replacementStudioAccess.js';
import { showReplacementStudioBetaNotice } from './src/modules/personReplacement/replacementStudioBetaNotice.js';
import { REPLACEMENT_STUDIO_MODE_ID } from './src/modules/personReplacement/replacementStudioTerminology.js';
import {
  createWorkspaceModeCoordinator,
  isStoryboard3DWorkspaceAvailable,
} from './src/modules/workspaceModeCoordinator.js';
import {
  getAssetMentionCandidates,
  subscribeAssetMentionRegistry,
} from './src/modules/assetMentionRegistry.js';
import {
  createStoryEpisodeCanvas,
  createStoryEpisodeCanvasAdapter,
} from './src/modules/storyWorkspace/storyEpisodeCanvas.js';
import {
  personReplacementCanvasMaterializationBindingPolicy,
  syncPersonReplacementCanvas,
} from './src/modules/personReplacement/personReplacementOutputCanvas.js';
import {
  storyWorkspaceCanvasMaterializationBindingPolicy,
  syncStoryProjectCanvas,
} from './src/modules/storyWorkspace/storyProjectCanvas.js';
import { createWorkspaceCanvasMaterializationAdapter } from './src/modules/workspaceCanvasMaterialization.js';
import {
  createStoryClipFrameCanvasAdapter,
  deleteStoryCanvasMediaNodes,
  syncStoryClipFrameToCanvas,
} from './src/modules/storyWorkspace/storyCanvasMediaSync.js';
import {
  getStoryCanvasMediaNodeSnapshot,
  subscribeStoryCanvasMediaNodeChanges,
} from './src/modules/storyWorkspace/storyCanvasNodeSubscription.js';
import { createStoryboard3DWorkspaceController } from './src/modules/storyboard3d/workspaceController.js';
import { installStoryboard3DExportCanvasBridge } from './src/modules/storyboard3d/exportCanvasBridge.js';
import { installTooltipUnifier } from './src/modules/tooltipUnifier.js';
import {
  createDefaultSubscriptionState,
  isModelAllowed,
  isSubscriptionActive,
  isActivationRequestAccepted,
  normalizeSubscriptionPayload,
  ensureDeviceId,
  ensureInstallId,
  pullSubscriptionState,
  submitCdkey,
  clearSubscriptionAuthorization,
  DEFAULT_VIP_GATE_MODEL_ID,
  getVipModelDisplayName,
} from './src/modules/subscriptionAccess.js';
import { createModelCatalogService } from './src/modules/modelCatalogService.js';
import { createAppBusinessEvents } from './src/modules/app/appBusinessEvents.js';
import { createAppCanvasNodeFlows } from './src/modules/app/canvasNodeFlows.js';
import { createAppTopbarAndConfig } from './src/modules/app/appTopbarAndConfig.js';
import { createAppPanels } from './src/modules/app/appPanels.js';
import { createAppViewport } from './src/modules/app/appViewport.js';
import { createAgentMaterialUploader } from './src/modules/app/agentMaterialUpload.js';
import {
  createCanvasAgentDebugApi,
  createCanvasCommandsDebugApi,
  installAppDebugApis,
} from './src/modules/app/appDebugApis.js';
import { installAppCanvasPointerBindings } from './src/modules/app/appCanvasPointerBindings.js';
import { initAppRuntimeInfo } from './src/modules/app/appRuntimeInfo.js';
import { initAppActivityTracking } from './src/modules/app/appActivityTracking.js';
import {
  installAppCanvasDropImport,
  openAppCanvasFilePicker,
} from './src/modules/app/appCanvasDropImport.js';
import { initAppShellUi } from './src/modules/app/appShellUi.js';
import { initCanvasCollaboration } from './src/modules/app/appCanvasCollaboration.js';
import { installNativeContextMenuGuard } from './src/modules/app/nativeContextMenuGuard.js';
import { bindIconButtonMotion } from './src/modules/app/iconButtonMotion.js';
import { initSelectionMediaProperties } from './src/modules/selectionMediaProperties.js';
import { installGlobalScreenshotBridge } from './src/modules/app/globalScreenshotBridge.js';
import { installGlobalTextPresetBridge } from './src/modules/app/globalTextPresetBridge.js';
import { createAppProjectContext } from './src/modules/app/projectContext.js';
import { createSourceNodeNameBackfill } from './src/modules/app/sourceNodeNameBackfill.js';
import { executeGridCrop } from './src/modules/imageToolbarGridCrop.js';
import {
  createCanvasCommandContext,
  executeCanvasCommand as executeCanvasCommand_2,
  executeCanvasCommandPlan,
} from './src/modules/canvasCommands/index.js';
import { runSmartClipKeyframeExtractionFromVideoNode } from './src/modules/VideoClipController.js';
import { runVideoAudioSeparationFromNode } from './src/modules/VideoAudioSeparationController.js';
import { runVideoReverseFromNode } from './src/modules/VideoReverseController.js';
import {
  createAgentConversationStore,
  createDefaultAgentExternalToolRegistry,
  createAgentProjectMemoryStore,
  createAgentSkillRegistry,
  createAgentModelSettings,
  createAgentModelRequestRuntime,
  createAgentRuntime,
  deleteInstalledAgentSkill,
  forgetAgentSkillPreference,
  installAgentSkillFromFolder,
  createAgentSessionStore,
  initAgentPanel,
  refreshInstalledAgentSkills,
  saveManagedAgentSkill,
  setAgentSkillEnabledPreference,
} from './src/modules/agent/index.js';
import { createSpecialNodeDataByType, initAppNodeEntry } from './src/modules/app/appNodeEntry.js';
import { buildAppCanvasNodeData } from './src/modules/app/canvasNodeDataFactory.js';
import { bootstrapAppProject } from './src/modules/app/projectBootstrap.js';
import { getLocale, initI18nDomBindings, t } from './src/i18n/index.js';
(installDesktopBridgeCompat(), initDiagnosticsService(), rendererStartupState.setPhase('storage-migration'));
const storageMigration = await migrateLegacyRendererStorageIfNeeded();
if (storageMigration.reason === 'failed') {
  rendererStartupState.fail('storage-migration');
  throw new Error('Legacy storage migration did not complete');
}
(rendererStartupState.setPhase('project-hydration'),
  (window._isSessionActive = true),
  initI18nDomBindings(),
  initToastService(),
  initExternalLinkHandlers(),
  initKeyboardService(),
  initFloatingMenuKeyboard(),
  initTextInputContextMenu(),
  installNativeContextMenuGuard(),
  initTaskCenterManager(),
  installTooltipUnifier(),
  initDesktopMediaWakeService(),
  startServerConnectionMonitor(),
  (window.AI_CANVAS_IS_DEV_BUILD = false));
const appRuntimeInfoPromise = initAppRuntimeInfo({
  fetchAppRuntimeInfo: fetchAppRuntimeInfoFromServer,
  initDevEntries: initDevEntries,
  windowObject: window,
});
void initAppActivityTracking({
  runtimeInfoPromise: appRuntimeInfoPromise,
  ensureDeviceId: ensureDeviceId,
  reportStartupActivity: reportAppStartupActivity,
  navigatorObject: window.navigator,
});
const NODE_COMPONENTS = {
  'source-text': SourceTextNode,
  'comment-note': CommentNoteNode,
  'source-image': SourceImageNode,
  'source-video': SourceVideoNode,
  'source-audio': SourceAudioNode,
  'web-preview': WebPreviewNode,
  'web-reference-card': WebReferenceCardNode,
  'media-clip': MediaClipNode,
  'ai-image': AIGenerateNode,
  'ai-text': AIGenTextNode,
  'ai-video': AIGenVideoNode,
  'ai-audio': AIGenAudioNode,
  'scene-detection': SceneDetectionNode,
  group: GroupNode,
  debug: DebugNode,
  collage: CollageNode,
  whiteboard: WhiteboardNode,
  'comfyui-workflow': ComfyWorkflowNode,
  'story-workspace': StoryWorkspaceNode,
  storyboard: StoryboardNode,
  'storyboard-script': StoryboardScriptNode,
  'panorama-scene': PanoramaSceneNode,
  'panorama-360': PanoramaSceneNode,
};
for (const [type, ComponentClass] of Object.entries(NODE_COMPONENTS)) {
  registerNode(type, ComponentClass);
  for (const alias of getNodeTypeAliases(type)) {
    registerNode(alias, ComponentClass);
  }
}
const wrap = document.getElementById('v2-wrap'),
  canvas = document.getElementById('v2-canvas'),
  canvasStage = canvas?.closest?.('.v2-canvas-stage') || wrap,
  debug = document.getElementById('v2-debug'),
  translateAppText = (value, item = {}) => t('app.' + value, item),
  appProjectContext = createAppProjectContext({ windowObject: window }),
  syncCanvasViewportScreenOrigin = () => {
    const box = canvasStage?.getBoundingClientRect?.();
    graphStore.setViewportScreenOrigin?.(box?.left || 0, box?.top || 0);
  };
syncCanvasViewportScreenOrigin();
const canvasStageResizeObserver =
  typeof ResizeObserver === 'function' && canvasStage
    ? new ResizeObserver(syncCanvasViewportScreenOrigin)
    : null;
(canvasStageResizeObserver?.observe(canvasStage),
  window.addEventListener('resize', syncCanvasViewportScreenOrigin),
  registerPageTeardown(window, () =>
    runCleanupSteps([
      () => canvasStageResizeObserver?.disconnect(),
      () => window.removeEventListener('resize', syncCanvasViewportScreenOrigin),
    ]),
  ),
  installRendererEventBindingGuard(),
  installImageGenerationExecution({
    store: appStore,
    getScopeId: () => CanvasTabManager.getActiveCanvasId(),
  }));
const canvasRenderer = initRenderer(wrap, canvas, appStore),
  disposeCanvasViewportVideoWarmup = createCanvasViewportVideoWarmupController({
    store: appStore,
    containerEl: canvas?.parentElement || wrap,
  }),
  canvasWorkspacePresentation = createCanvasWorkspacePresentation({
    root: canvas,
    renderer: canvasRenderer,
    warmup: disposeCanvasViewportVideoWarmup,
  });
(registerPageTeardown(window, disposeCanvasViewportVideoWarmup),
  initRendererUiEvents({ wrap: wrap, store: appStore }),
  initWebPreviewViewSyncService({ graphStore: graphStore, root: document }),
  initStoreRuntimeEffects(appStore),
  workspaceStore.setSubscriptionState(createDefaultSubscriptionState()),
  (window.CanvasTabManager = CanvasTabManager),
  document.getElementById('btnAddCanvas')?.addEventListener('click', () => CanvasTabManager.addCanvas()));
const sourceNodeNameBackfill = createSourceNodeNameBackfill({
    graphStore: graphStore,
    getBaseName: getBaseName,
    translate: translateAppText,
  }),
  appProjectLifecycle = bootstrapAppProject({
    store: appStore,
    CanvasTabManager: CanvasTabManager,
    project: project,
    loadCustomPresets: loadCustomPresets,
    migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
    sanitizeMultiCanvasDataForPersistence: sanitizeMultiCanvasDataForPersistence,
    commit: commit,
    patchStoreSourceNodeNamesFromFileName: sourceNodeNameBackfill.patchStoreSourceNodeNamesFromFileName,
    applySourceNamesFromFileNameToCanvas: sourceNodeNameBackfill.applySourceNamesFromFileNameToCanvas,
    uploadFile: uploadFile,
    getBaseName: getBaseName,
  });
initAppShellUi({
  store: graphStore,
  uiStore: uiStore,
  isElectronCompatibilityMode: desktopBridge.isElectron,
  initMinimap: initMinimap,
  minimapEl: document.getElementById('minimap'),
  btnMinimapEl: document.getElementById('btnMinimap'),
  minimapWrapperEl: document.getElementById('minimapWrapper'),
  btnToggleDotsEl: document.getElementById('btnToggleDots'),
  btnConnectionLinesToggleEl: document.getElementById('btnConnectionLinesToggle'),
  btnAddCanvasEl: document.getElementById('btnAddCanvas'),
  addCanvas: () => CanvasTabManager.addCanvas(),
  readGridDotsPref: SettingsManager.readGridDotsPref,
  setGridDotsPref: SettingsManager.setGridDotsPref,
  applySnapGridEnabled: applySnapGridEnabled,
  readSnapGridEnabled: readSnapGridEnabled,
  applyGridDotsPrefFromStorage: SettingsManager.applyGridDotsPrefFromStorage,
  showDevToast: showDevToast,
});
const disposeIconButtonMotion = bindIconButtonMotion(
  document.querySelectorAll(
    '.sidebar-floating .sidebar-btn-v3, .sidebar-floating .user-gear-plain, .canvas-controls-floating .cc-btn',
  ),
);
registerPageTeardown(window, disposeIconButtonMotion);
const disposeSelectionMediaProperties = initSelectionMediaProperties({
  graphStore: graphStore,
  uiStore: uiStore,
  element: document.getElementById('selectionMediaProperties'),
});
registerPageTeardown(window, disposeSelectionMediaProperties);
let createStoryEpisodeCanvasFromWorkspace = async () => {
    throw new Error('分集画布服务尚未初始化。');
  },
  createStoryProjectCanvasFromWorkspace = async () => {
    throw new Error('项目画布服务尚未初始化。');
  },
  syncStoryClipFrameToCanvasFromWorkspace = async () => {
    throw new Error('片段帧画布同步服务尚未初始化。');
  },
  createPersonReplacementOutputCanvasFromWorkspace = async () => {
    throw new Error('人物替换画布同步服务尚未初始化。');
  },
  deleteStoryCanvasNodesFromWorkspace = async () => [];
const assetManagerModulePromise = import('./src/modules/AssetManager.js');
let workspaceModeCoordinator = null,
  storyWorkspaceApi = null,
  workspaceProjectPackageCoordinator = null;
const workspaceProjectPackages = {
    exportProject: (...args) => workspaceProjectPackageCoordinator?.exportProject?.(...args),
    importProject: (...args2) => workspaceProjectPackageCoordinator?.importProject?.(...args2),
    hasProjectPackageDrag: (...args3) =>
      workspaceProjectPackageCoordinator?.hasProjectPackageDrag?.(...args3) === true,
    importProjectFromDrop: (...args4) =>
      workspaceProjectPackageCoordinator?.importProjectFromDrop?.(...args4) === true,
  },
  agentModelSettings = createAgentModelSettings({ windowObject: window }),
  replacementStudioApplication = createReplacementStudioApplication({
    documentObject: document,
    windowObject: window,
    mountTarget: '#v2-wrap',
    uploadFile: uploadFile,
    generateCharacterImage: generateImage,
    generateReplacementImage: generateImage,
    promptEnhancement: createPersonReplacementPromptEnhancementIntegration({
      enhancePrompt: requestPersonReplacementPromptEnhancement,
      getSettings: agentModelSettings.getSettings,
    }),
    generateReplacementVideo: generateVideo,
    resolveInstallId: ensureInstallId,
    listLibraryAssets: () => getAssetMentionCandidates({ allowedTypes: ['image', 'audio'] }),
    subscribeLibraryAssets: subscribeAssetMentionRegistry,
    loadWorkspace: fetchReplacementStudioWorkspaceFromServer,
    saveWorkspace: saveReplacementStudioWorkspaceToServer,
    projectPackages: workspaceProjectPackages,
    createOutputCanvas: (key) => createPersonReplacementOutputCanvasFromWorkspace(key),
    saveAssetPackageItem: (index) =>
      assetManagerModulePromise.then(({ assetManager: assetManager }) =>
        assetManager.upsertMediaAssetPackage(index),
      ),
    persistOutputFromUrl: saveOutputFromUrl,
    onRequestClose: () => {
      workspaceModeCoordinator?.getMode?.() === REPLACEMENT_STUDIO_MODE_ID &&
        workspaceModeCoordinator.setMode('canvas');
    },
    showToast: (...args5) => window.showToast?.(...args5),
  }),
  replacementStudioModelGate = new ReplacementStudioModelGate({
    documentObject: document,
    modelPackApi: {
      getStatus: getPersonReplacementModelPackStatus,
      install: installPersonReplacementModelPack,
    },
    onReady: () => {
      workspaceModeCoordinator?.resumePendingMode?.(REPLACEMENT_STUDIO_MODE_ID);
    },
    onNotify: (...args6) => window.showToast?.(...args6),
  }),
  storyboard3DWorkspaceController = createStoryboard3DWorkspaceController({
    documentObject: document,
    windowObject: window,
    storeInstance: workspaceStore,
    commitChanges: commit,
    getWorkspaceModeCoordinator: () => workspaceModeCoordinator,
  });
storyWorkspaceApi = initStoryWorkspace({
  documentObject: document,
  windowObject: window,
  adjustClipPrompt: guardStoryModelTaskCredentials(adjustStoryClipPrompt),
  generateStory: guardStoryModelTaskCredentials(generateStorySummary),
  generateEpisodeScript: guardStoryModelTaskCredentials(generateStoryEpisodeScript),
  extractAssets: guardStoryModelTaskCredentials(extractStoryAssets),
  extractAssetsParallel: guardStoryModelTaskCredentials(extractStoryAssetsParallel),
  extractAssetsExperimental: guardStoryModelTaskCredentials(extractStoryAssetsHybridExperimental),
  planEpisodes: guardStoryModelTaskCredentials(planStoryEpisodeOutlines),
  recoverEpisodeSplitDraft: recoverStoryEpisodeSplitDraftLocally,
  reviewEpisodeSplit: guardStoryModelTaskCredentials(reviewStoryEpisodeSplitQuality),
  splitEpisode: guardStoryModelTaskCredentials(splitStoryEpisodeChecked),
  splitEpisodesBatch: guardStoryModelTaskCredentials(splitStoryEpisodesBatch),
  splitEpisodeExperimental: guardStoryModelTaskCredentials(splitStoryEpisodeExperimental),
  extractDocumentText: extractStoryDocumentText,
  analyzeSourceVideo: guardStoryModelTaskCredentials(analyzeVideoReplicationClip),
  createEpisodeCanvas: (result) => createStoryEpisodeCanvasFromWorkspace(result),
  createProjectCanvas: (data) => createStoryProjectCanvasFromWorkspace(data),
  subscribeCanvasNodeDeletions: (handler) =>
    subscribeNodeDeletions((nodes) =>
      handler({ canvasId: CanvasTabManager.getActiveCanvasId(), nodes: nodes }),
    ),
  subscribeCanvasMediaNodeChanges: (listener) =>
    subscribeStoryCanvasMediaNodeChanges({
      graphStore: graphStore,
      getActiveCanvasId: () => CanvasTabManager.getActiveCanvasId(),
      listener: listener,
    }),
  getCanvasMediaSnapshot: () =>
    getStoryCanvasMediaNodeSnapshot({
      graphStore: graphStore,
      getActiveCanvasId: () => CanvasTabManager.getActiveCanvasId(),
    }),
  syncClipFrameToCanvas: (options) => syncStoryClipFrameToCanvasFromWorkspace(options),
  deleteCanvasNodes: (target) => deleteStoryCanvasNodesFromWorkspace(target),
  generateAssetImage: guardStoryModelTaskCredentials(generateImage),
  saveAssetPackageItem: (source) =>
    assetManagerModulePromise.then(({ assetManager: assetManager2 }) =>
      assetManager2.upsertMediaAssetPackage(source),
    ),
  loadWorkspace: fetchStoryWorkspaceFromServer,
  saveWorkspace: saveStoryWorkspaceToServer,
  projectPackages: workspaceProjectPackages,
  requestWorkspaceMode: (...args7) => workspaceModeCoordinator?.setMode?.(...args7),
});
const getCanvasPresentationContext = () => {
  const viewport = graphStore.getStateRaw?.() || graphStore.getState?.() || {};
  return {
    nodeCount: Object.keys(viewport.nodes || {}).length,
    viewport: viewport.viewport || null,
  };
};
((workspaceModeCoordinator = createWorkspaceModeCoordinator({
  documentObject: document,
  windowObject: window,
  getCanvasPresentationContext: getCanvasPresentationContext,
  canvasWorkspace: canvasWorkspacePresentation,
  storyWorkspace: {
    activate: (args8) => storyWorkspaceApi?.activate?.({ ...args8, surface: 'story' }),
    deactivate: (next) => storyWorkspaceApi?.deactivate?.(next),
    onActivated: () => showStoryWorkspaceBetaNotice({ documentObject: document, windowObject: window }),
  },
  replicationWorkspace: {
    activate: (args9) => storyWorkspaceApi?.activate?.({ ...args9, surface: 'replication' }),
    deactivate: (current) => storyWorkspaceApi?.deactivate?.(current),
    onActivated: () => showReplicationWorkspaceBetaNotice({ documentObject: document, windowObject: window }),
  },
  storyboard3DWorkspace: {
    isAvailable: () => isStoryboard3DWorkspaceAvailable(window),
    activate: () => storyboard3DWorkspaceController.openHome(),
    deactivate: () => storyboard3DWorkspaceController.close(),
  },
  replacementStudio: {
    canActivate: () => isReplacementStudioAuthorized(window),
    requestActivation: ({ retry: retry }) =>
      requestReplacementStudioAuthorization({ windowObject: window, onSuccess: retry }),
    activate: () => replacementStudioModelGate.requestOpen(() => replacementStudioApplication.open()),
    deactivate: () => replacementStudioApplication.close(),
    onActivated: () => showReplacementStudioBetaNotice({ documentObject: document, windowObject: window }),
  },
})),
  (workspaceProjectPackageCoordinator = createWorkspaceProjectPackageCoordinator({
    windowObject: window,
    getStoryWorkspace: () => storyWorkspaceApi,
    getReplacementStudio: () => replacementStudioApplication,
    requestWorkspaceMode: (...args10) => workspaceModeCoordinator?.setMode?.(...args10),
  })));
const completionNavigation = createCompletionNavigation({
  canvasTabs: CanvasTabManager,
  store: appStore,
  viewport: { focusNode: (...args11) => appViewport.focusNode(...args11) },
  replacementStudio: replacementStudioApplication,
  prepareReplacement: () => replacementStudioModelGate.checkStatus(),
  requestWorkspaceMode: (...args12) => workspaceModeCoordinator?.setMode?.(...args12),
  showToast: (...args13) => window.showToast?.(...args13),
});
const workspaceCloseGuard = installWorkspaceCloseGuard({
  windowObject: window,
  getWorkspaces: () => [storyWorkspaceApi],
});
registerPageTeardown(window, () =>
  runCleanupSteps([
    () => workspaceCloseGuard.destroy(),
    () => workspaceModeCoordinator?.destroy?.(),
    () => completionNavigation?.destroy?.(),
    () => canvasWorkspacePresentation?.destroy?.(),
    () => storyWorkspaceApi?.destroy?.(),
    () => storyboard3DWorkspaceController?.dispose?.(),
    () => replacementStudioModelGate?.destroy?.(),
    () => replacementStudioApplication?.destroy?.(),
  ]),
);

const appViewport = createAppViewport({
  graphStore: graphStore,
  uiStore: uiStore,
  wrap: wrap,
  canvasViewportEl: canvasStage,
  debugEl: debug,
  zoomSliderEl: document.getElementById('zoomSlider'),
  zoomPercentEl: document.getElementById('zoomPercent'),
  fitActionEl: document.getElementById('btnFitAction'),
});
(appViewport.installWindowBindings(window),
  assetManagerModulePromise.then(({ assetManager: assetManager3 }) => {}));
const workflowEntryButton = document.getElementById('btnWorkflows');
workflowEntryButton &&
  ((workflowEntryButton.hidden = !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED),
  (workflowEntryButton.disabled = !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED),
  workflowEntryButton.setAttribute('aria-hidden', String(!SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED)));
SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED &&
  import('./src/modules/workflows/WorkflowManager.js').then(({ workflowManager: workflowManager }) => {});
(import('./src/modules/runninghubAiApp/RunningHubAiAppManager.js').then(
  ({ runningHubAiAppManager: runningHubAiAppManager }) => {},
),
  import('./src/modules/GenerationHistoryFileManager.js').then(
    ({ generationHistoryFileManager: generationHistoryFileManager }) => {},
  ),
  initAppNodeEntry({
    graphStore: graphStore,
    wrap: wrap,
    btnAddEl: document.getElementById('btnAdd'),
    nodeMenuEl: document.getElementById('nodeMenu'),
    initCanvasContextMenu: initCanvasContextMenu,
    getNodeDefaultSize: getNodeDefaultSize,
    commit: commit,
    executeCommand: executeCommand,
    getCanvasToolbarPlacement: () => uiStore.getState?.()?.ui?.canvasToolbarPlacement,
  }));
const appCanvasPointerBindings = installAppCanvasPointerBindings({
  graphStore: graphStore,
  uiStore: uiStore,
  wrap: wrap,
  appViewport: appViewport,
  interaction: {
    getDragContext: getDragContext,
    handleContextMenu: handleContextMenu,
    handlePointerDown: handlePointerDown,
    handlePointerMove: handlePointerMove,
    handlePointerUp: handlePointerUp,
    handleWheel: handleWheel,
    handleWheelPan: handleWheelPan,
    settleWheelZoom: settleWheelZoom,
    settleWheelPan: settleWheelPan,
    initConnectionHandles: initConnectionHandles,
    initPickConnect: initPickConnect,
  },
});
installAppCanvasDropImport({
  targetEl: wrap,
  handleFileDrop: handleFileDrop,
  handleWebImageUrlDrop: handleWebImageUrlDrop,
  commit: commit,
  getCurrentProjectId: appProjectContext.getCurrentProjectId,
});
const appCanvasNodeFlows = createAppCanvasNodeFlows({
    graphStore: graphStore,
    commit: commit,
    getCursorScreenPosition: appCanvasPointerBindings.getCursorScreenPosition,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    getAIGenerationNodeSize: getAIGenerationNodeSize,
    createPanoramaNodeDataByType: createSpecialNodeDataByType,
    processFile: processFile,
    executeCommand: executeCommand,
    getCurrentProjectId: appProjectContext.getCurrentProjectIdOrNull,
    getCanvasIdentity: () =>
      appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId(),
    showToast: (...args14) => window.showToast?.(...args14),
  }),
  storyEpisodeCanvasAdapter = createStoryEpisodeCanvasAdapter({
    canvasTabManager: CanvasTabManager,
    createNodeAtCursor: (...args15) => appCanvasNodeFlows.createNodeAtCursor(...args15),
    getGraphState: () => graphStore.getStateRaw?.() || graphStore.getState?.() || {},
    getGraphSnapshot: () => graphStore.getState?.() || {},
    restoreGraphSnapshot: (entry) => graphStore.loadState(entry),
    updateNodeData: (record, payload) => graphStore.updateNodeData(record, payload),
    deleteNodes: (handle) => graphStore.deleteNodes(handle),
    focusNodes: (...args16) => appViewport.focusNodes(...args16),
    commit: commit,
  });
createStoryEpisodeCanvasFromWorkspace = (args17 = {}) =>
  createStoryEpisodeCanvas({ ...args17, adapter: storyEpisodeCanvasAdapter });
const workspaceCanvasMaterializationAdapter = createWorkspaceCanvasMaterializationAdapter({
  canvasTabManager: CanvasTabManager,
  createNodeAtCursor: (...args18) => appCanvasNodeFlows.createNodeAtCursor(...args18),
  getGraphState: () => graphStore.getStateRaw?.() || graphStore.getState?.() || {},
  getGraphSnapshot: () => graphStore.getState?.() || {},
  restoreGraphSnapshot: (state) => graphStore.loadState(state),
  updateNodeData: (config, scope) => graphStore.updateNodeData(config, scope),
  moveNode: (input, output, value2) => graphStore.updateNodePosition(input, output, value2),
  deleteNodes: (value3) => graphStore.deleteNodes(value3),
  connectNodes: addEdgeWithPolicies,
  groupNodes: (value4, value5) => graphStore.groupNodes(value4, value5),
  focusNodes: (...args19) => appViewport.focusNodes(...args19),
  getNodeSize: (value6) => getNodeDefaultSize(value6),
  projectBindingPolicies: [
    storyWorkspaceCanvasMaterializationBindingPolicy,
    personReplacementCanvasMaterializationBindingPolicy,
  ],
  commit: commit,
});
((createStoryProjectCanvasFromWorkspace = (args20 = {}) =>
  syncStoryProjectCanvas({ ...args20, adapter: workspaceCanvasMaterializationAdapter })),
  (createPersonReplacementOutputCanvasFromWorkspace = (args21 = {}) =>
    syncPersonReplacementCanvas({
      ...args21,
      adapter: workspaceCanvasMaterializationAdapter,
      saveOutputBlob: project.saveOutputBlob,
    })));
const storyClipFrameCanvasAdapter = createStoryClipFrameCanvasAdapter({
  canvasTabManager: CanvasTabManager,
  createNodeAtCursor: (...args22) => appCanvasNodeFlows.createNodeAtCursor(...args22),
  getGraphState: () => graphStore.getStateRaw?.() || graphStore.getState?.() || {},
  updateNodeData: (value7, value8) => graphStore.updateNodeData(value7, value8),
  getNodeSize: (value9) => getNodeDefaultSize(value9),
  commit: commit,
});
((syncStoryClipFrameToCanvasFromWorkspace = (args23 = {}) =>
  syncStoryClipFrameToCanvas({ ...args23, adapter: storyClipFrameCanvasAdapter })),
  (deleteStoryCanvasNodesFromWorkspace = (args24 = {}) =>
    deleteStoryCanvasMediaNodes({ ...args24, adapter: storyClipFrameCanvasAdapter })));
const agentConversationStore = createAgentConversationStore({
    windowObject: window,
    getProjectId: appProjectContext.getCurrentProjectId,
  }),
  agentSessionStore = createAgentSessionStore({ conversationStore: agentConversationStore }),
  agentProjectMemoryStore = createAgentProjectMemoryStore({
    windowObject: window,
    getProjectId: appProjectContext.getCurrentProjectId,
  }),
  canvasCommandContext = createCanvasCommandContext({
    store: appStore,
    graphStore: graphStore,
    canvasNodeFlows: appCanvasNodeFlows,
    createNodeAtCursor: appCanvasNodeFlows.createNodeAtCursor,
    buildNodeData: buildAppCanvasNodeData,
    executeCommand: executeCommand,
    focusNodes: appViewport.focusNodes,
    commit: commit,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    getAIGenerationNodeSize: getAIGenerationNodeSize,
    connectNodes: addEdgeWithPolicies,
    windowObject: window,
    nodeExport: desktopBridge.nodeExport.isAvailable() ? desktopBridge.nodeExport : null,
    mediaTools: {
      executeGridCrop: executeGridCrop,
      runAudioSeparationFromNode: runAudioSeparationFromNode,
      runSmartClipKeyframeExtractionFromVideoNode: runSmartClipKeyframeExtractionFromVideoNode,
      runVideoAudioSeparationFromNode: runVideoAudioSeparationFromNode,
      runVideoReverseFromNode: runVideoReverseFromNode,
    },
    translate: t,
    showToast: (...args25) => window.showToast?.(...args25),
    scheduleFrame: (value10) => requestAnimationFrame(value10),
    recordCommand: (value11) => agentSessionStore.recordCommand(value11),
    history: {
      createCheckpoint: createHistoryCheckpoint,
      undoToCheckpoint: undoToHistoryCheckpoint,
    },
  }),
  agentModelRequests = createAgentModelRequestRuntime({
    sessionStore: agentSessionStore,
    projectMemoryStore: agentProjectMemoryStore,
    getSettings: agentModelSettings.getSettings,
    getLocale: getLocale,
    summarizeContext: requestAgentContextDigest,
    requestAssistant: requestAgentAssistantReply,
    requestPlanner: requestAgentActionPlan,
  }),
  agentExternalToolRegistry = createDefaultAgentExternalToolRegistry({
    readUrl: (value12) => desktopBridge.agentInformation.readUrl(value12),
    readDocument: extractStoryDocumentText,
    validateDocument: validateStoryDocumentFile,
  }),
  agentSkillRegistry = createAgentSkillRegistry(),
  refreshAgentSkills = () => refreshInstalledAgentSkills({ registry: agentSkillRegistry }),
  installAgentSkill = () => installAgentSkillFromFolder({ registry: agentSkillRegistry }),
  saveAgentSkill = (definition) =>
    saveManagedAgentSkill({ registry: agentSkillRegistry, definition: definition }),
  deleteAgentSkill = async (request) => {
    const skillId = await deleteInstalledAgentSkill({
      registry: agentSkillRegistry,
      request: request,
    });
    return (
      skillId?.success === true &&
        forgetAgentSkillPreference({
          registry: agentSkillRegistry,
          skillId: skillId.skillId,
          windowObject: window,
        }),
      skillId
    );
  },
  setAgentSkillEnabled = (skillId2, enabled) =>
    setAgentSkillEnabledPreference({
      registry: agentSkillRegistry,
      skillId: skillId2,
      enabled: enabled,
      windowObject: window,
    });
void refreshAgentSkills();
const agentRuntime = createAgentRuntime({
  store: appStore,
  commandContext: canvasCommandContext,
  sessionStore: agentSessionStore,
  projectMemoryStore: agentProjectMemoryStore,
  externalToolRegistry: agentExternalToolRegistry,
  loopMode: true,
  skillRegistry: agentSkillRegistry,
  assistant: agentModelRequests.assistant,
  skillAuthor: ({
    message: message,
    originalMessage: originalMessage,
    clarificationAnswer: clarificationAnswer,
    history: history,
    existingSkills: existingSkills,
    operation: operation,
    targetSkill: targetSkill,
    repairReason: repairReason,
    signal: signal,
    onTrace: onTrace,
  }) =>
    requestAgentSkillDraft({
      message: message,
      originalMessage: originalMessage,
      clarificationAnswer: clarificationAnswer,
      history: history,
      existingSkills: existingSkills,
      operation: operation,
      targetSkill: targetSkill,
      repairReason: repairReason,
      signal: signal,
      onTrace: onTrace,
      settings: { ...agentModelSettings.getSettings(), locale: getLocale() },
    }),
  saveSkill: saveAgentSkill,
  deleteSkill: deleteAgentSkill,
  setSkillEnabled: setAgentSkillEnabled,
  planner: ({ message: message2, context: context, history: history2, onTrace: onTrace2 }) =>
    requestAgentActionPlan({
      message: message2,
      context: context,
      history: history2,
      onTrace: onTrace2,
      settings: { ...agentModelSettings.getSettings(), locale: getLocale() },
    }),
});
(initCanvasMcp({
  commandContext: canvasCommandContext,
  getCanvasIdentity: () =>
    appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId(),
}),
  installAppDebugApis({
    windowObject: window,
    canvasCommands: createCanvasCommandsDebugApi({
      executeCanvasCommand: executeCanvasCommand_2,
      executeCanvasCommandPlan: executeCanvasCommandPlan,
      commandContext: canvasCommandContext,
    }),
    canvasAgent: createCanvasAgentDebugApi({
      agentRuntime: agentRuntime,
      agentSessionStore: agentSessionStore,
      agentSkillRegistry: agentSkillRegistry,
      refreshAgentSkills: refreshAgentSkills,
    }),
  }));
const uploadAgentMaterial = createAgentMaterialUploader({
    canvasNodeFlows: appCanvasNodeFlows,
    graphStore: graphStore,
    getBaseName: getBaseName,
  }),
  agentPanelApi = initAgentPanel({
    runtime: agentRuntime,
    modelSettings: agentModelSettings,
    store: appStore,
    uploadMaterial: uploadAgentMaterial,
    validateDocumentFile: validateStoryDocumentFile,
    skillRegistry: agentSkillRegistry,
    refreshAgentSkills: refreshAgentSkills,
    installAgentSkill: installAgentSkill,
    deleteAgentSkill: deleteAgentSkill,
    saveAgentSkill: saveAgentSkill,
    fabBtnEl: document.getElementById('fabBtn'),
    root: document.body,
  });
(createStoryAgentComposition({
  collaboration: storyWorkspaceApi?.collaboration,
  modelSettings: agentModelSettings,
  requestAssistant: requestAgentAssistantReply,
  summarizeContext: requestAgentContextDigest,
  canvasPanel: agentPanelApi,
}),
  initAudioVoicePanel({
    store: appStore,
    fabBtnEl: document.getElementById('audioVoicePanelFab'),
    root: document.body,
  }),
  installGlobalScreenshotBridge({
    screenshotApi: desktopBridge.screenshot.isAvailable() ? desktopBridge.screenshot : null,
    createMediaNodeFromBlob: appCanvasNodeFlows.createMediaNodeFromBlob,
    showToast: (...args26) => window.showToast?.(...args26),
    translate: translateAppText,
    executeCanvasCommand: (value13, value14) =>
      executeCanvasCommand_2(value13, value14, canvasCommandContext),
    isNodeMounted: (value15) => window.v2Renderer?.isNodeMounted?.(value15) === true,
    scheduleFrame: (value16) => window.requestAnimationFrame(value16),
    getCanvasIdentity: () =>
      appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId(),
  }),
  installGlobalTextPresetBridge({
    getCanvasIdentity: () =>
      appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId(),
    textPresetApi: desktopBridge.textPreset.isAvailable() ? desktopBridge.textPreset : null,
    showToast: (...args27) => window.showToast?.(...args27),
    translate: translateAppText,
    executeCanvasCommand: (value17, value18) =>
      executeCanvasCommand_2(value17, value18, canvasCommandContext),
    isNodeMounted: (value19) => window.v2Renderer?.isNodeMounted?.(value19) === true,
    scheduleFrame: (value20) => window.requestAnimationFrame(value20),
  }),
  installStoryboard3DExportCanvasBridge({
    windowObject: window,
    createMediaNodeFromBlob: appCanvasNodeFlows.createMediaNodeFromBlob,
    showToast: (...args28) => window.showToast?.(...args28),
  }));
const openCanvasFileUploadFromShortcut = () => {
    const clientX = appCanvasPointerBindings.getCursorScreenPosition?.() || {};
    openAppCanvasFilePicker({
      documentObject: document,
      projectId: appProjectContext.getCurrentProjectId(),
      handleFileDrop: handleFileDrop,
      commit: commit,
      clientX: clientX.x,
      clientY: clientX.y,
      onUnsupported: () => {
        window.showToast?.(t('canvasInteraction.toasts.unsupportedUpload'), 'warning');
      },
      onError: (value21) => {
        (console.error('[Canvas] shortcut file import failed:', value21),
          window.showToast?.(t('previewUpload.uploadFailed'), 'warning'));
      },
    });
  },
  appBusinessEvents = createAppBusinessEvents({
    store: appStore,
    wrap: wrap,
    canvasViewportEl: canvasStage,
    addShortcutListener: addShortcutListener,
    executeCommand: executeCommand,
    undo: undo,
    redo: redo,
    commit: commit,
    closeShortcuts: closeShortcuts,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    createNodeAtCursor: appCanvasNodeFlows.createNodeAtCursor,
    createImageNodeFromBlob: appCanvasNodeFlows.createMediaNodeFromBlob,
    openFileUpload: openCanvasFileUploadFromShortcut,
    animateViewport: appViewport.animateViewport,
    focusNodeAtZoomPercent: appViewport.focusNodeAtZoomPercent,
    focusNodes: appViewport.focusNodes,
    clearTrackedFocus: appViewport.clearTrackedFocus,
    handlePasteFromClipboard: appCanvasNodeFlows.handlePasteFromClipboard,
    initCanvasContextMenu: initCanvasContextMenu,
    toggleAgentPanel: () => agentPanelApi?.toggle?.(),
    ImageAnnotateController: ImageAnnotateController,
    ImageMattingController: ImageMattingController,
    AudioClipController: AudioClipController,
  });
appBusinessEvents.bindAll();
const appTopbarAndConfig = createAppTopbarAndConfig({
  store: appStore,
  fetchApiConfigFromServer: fetchApiConfigFromServer,
  getApiConfigSnapshot: getApiConfigSnapshot,
  saveApiConfigToServer: saveApiConfigToServer,
  testProviderConnections: testProviderConnections,
  discoverCustomProvider: discoverCustomProvider,
  analyzeCustomProviderDocumentation: (value22) =>
    analyzeCustomProviderDocumentation(value22, {
      settings: { ...agentModelSettings.getSettings(), locale: getLocale() },
    }),
  buildCustomProviderManifestDraft: buildCustomProviderManifestDraft,
  validateCustomProviderManifestDraft: validateCustomProviderManifestDraft,
  saveCustomProviderManifestBundle: saveCustomProviderManifestBundle,
  listCustomProviderManifestBundles: listCustomProviderManifestBundles,
  deleteCustomProviderManifestBundle: deleteCustomProviderManifestBundle,
  refreshManifestModelNodeUis: () => {
    const refreshManifestModelNodeUis2 = refreshManifestModelNodeUis();
    if (refreshManifestModelNodeUis2.remountedNodeIds.length > 0) appStore.invalidateUi();
  },
  fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
  fetchDreaminaCliLoginRuntimeFromServer: fetchDreaminaCliLoginRuntimeFromServer,
  startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer: startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer: logoutDreaminaFromServer,
  buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
  showError: showError,
});
(initModelServiceSettingsNavigator(), appTopbarAndConfig.init(), void initCliProviderSettings());
const modelCatalogService = createModelCatalogService({ store: workspaceStore }),
  appPanels = createAppPanels({
    store: appStore,
    setTextWithLineBreaks: setTextWithLineBreaks,
    executeCommand: executeCommand,
    focusNodes: (...args29) => appViewport.focusNodes(...args29),
    commit: commit,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    createDefaultSubscriptionState: createDefaultSubscriptionState,
    isModelAllowed: isModelAllowed,
    isSubscriptionActive: isSubscriptionActive,
    isActivationRequestAccepted: isActivationRequestAccepted,
    normalizeSubscriptionPayload: normalizeSubscriptionPayload,
    ensureInstallId: ensureInstallId,
    pullSubscriptionState: pullSubscriptionState,
    submitCdkey: submitCdkey,
    clearSubscriptionAuthorization: clearSubscriptionAuthorization,
    DEFAULT_VIP_GATE_MODEL_ID: DEFAULT_VIP_GATE_MODEL_ID,
    getVipModelDisplayName: getVipModelDisplayName,
    ensureDeviceId: ensureDeviceId,
    modelCatalogService: modelCatalogService,
    refreshManifestModelNodeUis: refreshManifestModelNodeUis,
  });
(appPanels.init(),
  initCanvasCollaboration({
    store: appStore,
    canvasTabs: CanvasTabManager,
    ensureInstallId: ensureInstallId,
    ensureDeviceId: ensureDeviceId,
    resetHistory: resetHistory,
    focusNode: (...args30) => appViewport.focusNode(...args30),
  }));
const canvasProjectOperations = createCanvasProjectOperations({
  getCanvasManager: () => CanvasTabManager,
  projectWorkspaceSessions: appProjectLifecycle.projectWorkspaceSessions,
  onProjectHydrated: appProjectLifecycle.resumeProjectPersistenceAfterHydration,
  renameTemporaryProject: appProjectLifecycle.renameCurrentProject,
  applySourceNames: sourceNodeNameBackfill.applySourceNamesFromFileNameToCanvas,
  requestCacheSave: () => window._triggerLocalCacheSave?.(),
});
(CanvasProjectDropdownManager.init({
  projectOperations: canvasProjectOperations,
  projectWorkspaceSessions: appProjectLifecycle.projectWorkspaceSessions,
  onProjectHydrated: appProjectLifecycle.resumeProjectPersistenceAfterHydration,
  renameTemporaryProject: appProjectLifecycle.renameCurrentProject,
  pauseActiveWorkspaceTasks: pauseActiveWorkspaceTasks,
  onWorkspaceProjectPackageImported: (value23) =>
    workspaceProjectPackageCoordinator?.applyImportedProject?.(value23),
  getCanvasToolbarPlacement: () => uiStore.getState?.()?.ui?.canvasToolbarPlacement,
}),
  SettingsManager.init({
    graphStore: graphStore,
    uiStore: uiStore,
    getCanvasPresentationContext: getCanvasPresentationContext,
  }));
const nodeManagerPanel = createNodeManagerPanel({
  graphStore: graphStore,
  uiStore: uiStore,
  appViewport: appViewport,
  executeCanvasCommand: executeCanvasCommand_2,
  renameCurrentProject: CanvasProjectDropdownManager.renameCurrentProject,
  wrap: wrap,
  canvasStage: canvasStage,
  button: document.getElementById('btnNodeManager'),
});
(registerPageTeardown(window, () => nodeManagerPanel?.destroy?.()),
  MascotManager.init({ bindFabButton: false }),
  initAutoUpdate(),
  rendererStartupState.complete('entry'),
  void rendererStartupState.settled.then(({ ready: ready }) => {
    if (ready)
      scheduleChromeShellStartupReady({
        windowObject: window,
        diagnostics: desktopBridge.diagnostics,
      });
  }));
