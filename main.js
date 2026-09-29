import './src/services/startupLoaderBootstrap.js';
import { createStoryAgentComposition } from './src/modules/app/storyAgentComposition.js';
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
  translateAppText = (_0x33c9a8, _0xd96e48 = {}) => t('app.' + _0x33c9a8, _0xd96e48),
  appProjectContext = createAppProjectContext({ windowObject: window }),
  syncCanvasViewportScreenOrigin = () => {
    const _0x5cba12 = canvasStage?.getBoundingClientRect?.();
    graphStore.setViewportScreenOrigin?.(_0x5cba12?.left || 0, _0x5cba12?.top || 0);
  };
syncCanvasViewportScreenOrigin();
const canvasStageResizeObserver =
  typeof ResizeObserver === 'function' && canvasStage
    ? new ResizeObserver(syncCanvasViewportScreenOrigin)
    : null;
(canvasStageResizeObserver?.observe(canvasStage),
  window.addEventListener('resize', syncCanvasViewportScreenOrigin),
  window.addEventListener(
    'beforeunload',
    () => {
      (canvasStageResizeObserver?.disconnect(),
        window.removeEventListener('resize', syncCanvasViewportScreenOrigin));
    },
    { once: true },
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
(window.addEventListener('beforeunload', disposeCanvasViewportVideoWarmup, { once: true }),
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
window.addEventListener('beforeunload', disposeIconButtonMotion, { once: true });
const disposeSelectionMediaProperties = initSelectionMediaProperties({
  graphStore: graphStore,
  uiStore: uiStore,
  element: document.getElementById('selectionMediaProperties'),
});
window.addEventListener('beforeunload', disposeSelectionMediaProperties, { once: true });
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
    exportProject: (..._0x5e7bbb) => workspaceProjectPackageCoordinator?.exportProject?.(..._0x5e7bbb),
    importProject: (..._0xca325b) => workspaceProjectPackageCoordinator?.importProject?.(..._0xca325b),
    hasProjectPackageDrag: (..._0x589156) =>
      workspaceProjectPackageCoordinator?.hasProjectPackageDrag?.(..._0x589156) === true,
    importProjectFromDrop: (..._0x212805) =>
      workspaceProjectPackageCoordinator?.importProjectFromDrop?.(..._0x212805) === true,
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
    createOutputCanvas: (_0x1f5f3e) => createPersonReplacementOutputCanvasFromWorkspace(_0x1f5f3e),
    saveAssetPackageItem: (_0x5cbeda) =>
      assetManagerModulePromise.then(({ assetManager: _0x58ddcf }) =>
        _0x58ddcf.upsertMediaAssetPackage(_0x5cbeda),
      ),
    persistOutputFromUrl: saveOutputFromUrl,
    onRequestClose: () => {
      workspaceModeCoordinator?.getMode?.() === REPLACEMENT_STUDIO_MODE_ID &&
        workspaceModeCoordinator.setMode('canvas');
    },
    showToast: (..._0x142903) => window.showToast?.(..._0x142903),
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
    onNotify: (..._0x5c6a53) => window.showToast?.(..._0x5c6a53),
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
  createEpisodeCanvas: (_0x4b6612) => createStoryEpisodeCanvasFromWorkspace(_0x4b6612),
  createProjectCanvas: (_0xbcb385) => createStoryProjectCanvasFromWorkspace(_0xbcb385),
  subscribeCanvasNodeDeletions: (_0x2f8b67) =>
    subscribeNodeDeletions((_0xdfd5fc) =>
      _0x2f8b67({ canvasId: CanvasTabManager.getActiveCanvasId(), nodes: _0xdfd5fc }),
    ),
  subscribeCanvasMediaNodeChanges: (_0x38ccf4) =>
    subscribeStoryCanvasMediaNodeChanges({
      graphStore: graphStore,
      getActiveCanvasId: () => CanvasTabManager.getActiveCanvasId(),
      listener: _0x38ccf4,
    }),
  getCanvasMediaSnapshot: () =>
    getStoryCanvasMediaNodeSnapshot({
      graphStore: graphStore,
      getActiveCanvasId: () => CanvasTabManager.getActiveCanvasId(),
    }),
  syncClipFrameToCanvas: (_0x43f002) => syncStoryClipFrameToCanvasFromWorkspace(_0x43f002),
  deleteCanvasNodes: (_0x19d7b2) => deleteStoryCanvasNodesFromWorkspace(_0x19d7b2),
  generateAssetImage: guardStoryModelTaskCredentials(generateImage),
  saveAssetPackageItem: (_0x1a83d8) =>
    assetManagerModulePromise.then(({ assetManager: _0x456e02 }) =>
      _0x456e02.upsertMediaAssetPackage(_0x1a83d8),
    ),
  loadWorkspace: fetchStoryWorkspaceFromServer,
  saveWorkspace: saveStoryWorkspaceToServer,
  projectPackages: workspaceProjectPackages,
  requestWorkspaceMode: (..._0x495b3d) => workspaceModeCoordinator?.setMode?.(..._0x495b3d),
});
const getCanvasPresentationContext = () => {
  const _0x1c57c3 = graphStore.getStateRaw?.() || graphStore.getState?.() || {};
  return {
    nodeCount: Object.keys(_0x1c57c3.nodes || {}).length,
    viewport: _0x1c57c3.viewport || null,
  };
};
((workspaceModeCoordinator = createWorkspaceModeCoordinator({
  documentObject: document,
  windowObject: window,
  getCanvasPresentationContext: getCanvasPresentationContext,
  canvasWorkspace: canvasWorkspacePresentation,
  storyWorkspace: {
    activate: (_0x18a144) => storyWorkspaceApi?.activate?.({ ..._0x18a144, surface: 'story' }),
    deactivate: (_0x595fb5) => storyWorkspaceApi?.deactivate?.(_0x595fb5),
    onActivated: () =>
      showStoryWorkspaceBetaNotice({ documentObject: document, windowObject: window }),
  },
  replicationWorkspace: {
    activate: (_0x4079be) => storyWorkspaceApi?.activate?.({ ..._0x4079be, surface: 'replication' }),
    deactivate: (_0x4a4e95) => storyWorkspaceApi?.deactivate?.(_0x4a4e95),
    onActivated: () =>
      showReplicationWorkspaceBetaNotice({ documentObject: document, windowObject: window }),
  },
  storyboard3DWorkspace: {
    isAvailable: () => isStoryboard3DWorkspaceAvailable(window),
    activate: () => storyboard3DWorkspaceController.openHome(),
    deactivate: () => storyboard3DWorkspaceController.close(),
  },
  replacementStudio: {
    canActivate: () => isReplacementStudioAuthorized(window),
    requestActivation: ({ retry: _0x460d79 }) =>
      requestReplacementStudioAuthorization({ windowObject: window, onSuccess: _0x460d79 }),
    activate: () => replacementStudioModelGate.requestOpen(() => replacementStudioApplication.open()),
    deactivate: () => replacementStudioApplication.close(),
    onActivated: () =>
      showReplacementStudioBetaNotice({ documentObject: document, windowObject: window }),
  },
})),
  (workspaceProjectPackageCoordinator = createWorkspaceProjectPackageCoordinator({
    windowObject: window,
    getStoryWorkspace: () => storyWorkspaceApi,
    getReplacementStudio: () => replacementStudioApplication,
    requestWorkspaceMode: (..._0x1b0d61) => workspaceModeCoordinator?.setMode?.(..._0x1b0d61),
  })));
const completionNavigation = createCompletionNavigation({
  canvasTabs: CanvasTabManager,
  store: appStore,
  viewport: { focusNode: (..._0x177753) => appViewport.focusNode(..._0x177753) },
  replacementStudio: replacementStudioApplication,
  prepareReplacement: () => replacementStudioModelGate.checkStatus(),
  requestWorkspaceMode: (..._0x140606) => workspaceModeCoordinator?.setMode?.(..._0x140606),
  showToast: (..._0x277820) => window.showToast?.(..._0x277820),
});
window.addEventListener(
  'beforeunload',
  () => {
    (workspaceModeCoordinator?.destroy?.(),
      completionNavigation?.destroy?.(),
      canvasWorkspacePresentation?.destroy?.(),
      storyWorkspaceApi?.destroy?.(),
      storyboard3DWorkspaceController?.dispose?.(),
      replacementStudioModelGate?.destroy?.(),
      replacementStudioApplication?.destroy?.());
  },
  { once: true },
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
  assetManagerModulePromise.then(({ assetManager: _0x30cc90 }) => {}));
const workflowEntryButton = document.getElementById('btnWorkflows');
workflowEntryButton &&
  ((workflowEntryButton.hidden = !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED),
  (workflowEntryButton.disabled = !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED),
  workflowEntryButton.setAttribute('aria-hidden', String(!SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED)));
SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED &&
  import('./src/modules/workflows/WorkflowManager.js').then(({ workflowManager: _0x515d08 }) => {});
(import('./src/modules/runninghubAiApp/RunningHubAiAppManager.js').then(
  ({ runningHubAiAppManager: _0x3f7c91 }) => {},
),
  import('./src/modules/GenerationHistoryFileManager.js').then(
    ({ generationHistoryFileManager: _0xab858d }) => {},
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
    showToast: (..._0xe3e14) => window.showToast?.(..._0xe3e14),
  }),
  storyEpisodeCanvasAdapter = createStoryEpisodeCanvasAdapter({
    canvasTabManager: CanvasTabManager,
    createNodeAtCursor: (..._0x161f7c) => appCanvasNodeFlows.createNodeAtCursor(..._0x161f7c),
    getGraphState: () => graphStore.getStateRaw?.() || graphStore.getState?.() || {},
    getGraphSnapshot: () => graphStore.getState?.() || {},
    restoreGraphSnapshot: (_0x3cbe5a) => graphStore.loadState(_0x3cbe5a),
    updateNodeData: (_0x63244c, _0x444065) => graphStore.updateNodeData(_0x63244c, _0x444065),
    deleteNodes: (_0x39c33d) => graphStore.deleteNodes(_0x39c33d),
    focusNodes: (..._0x1f11e2) => appViewport.focusNodes(..._0x1f11e2),
    commit: commit,
  });
createStoryEpisodeCanvasFromWorkspace = (_0x4a3216 = {}) =>
  createStoryEpisodeCanvas({ ..._0x4a3216, adapter: storyEpisodeCanvasAdapter });
const workspaceCanvasMaterializationAdapter = createWorkspaceCanvasMaterializationAdapter({
  canvasTabManager: CanvasTabManager,
  createNodeAtCursor: (..._0x524dfd) => appCanvasNodeFlows.createNodeAtCursor(..._0x524dfd),
  getGraphState: () => graphStore.getStateRaw?.() || graphStore.getState?.() || {},
  getGraphSnapshot: () => graphStore.getState?.() || {},
  restoreGraphSnapshot: (_0x330f60) => graphStore.loadState(_0x330f60),
  updateNodeData: (_0x569f7a, _0x32aaf) => graphStore.updateNodeData(_0x569f7a, _0x32aaf),
  moveNode: (_0x21a6c8, _0x4baffc, _0xf2b128) =>
    graphStore.updateNodePosition(_0x21a6c8, _0x4baffc, _0xf2b128),
  deleteNodes: (_0x52b3a6) => graphStore.deleteNodes(_0x52b3a6),
  connectNodes: addEdgeWithPolicies,
  groupNodes: (_0x54f528, _0x11ddaa) => graphStore.groupNodes(_0x54f528, _0x11ddaa),
  focusNodes: (..._0x1d63d6) => appViewport.focusNodes(..._0x1d63d6),
  getNodeSize: (_0x37faef) => getNodeDefaultSize(_0x37faef),
  projectBindingPolicies: [
    storyWorkspaceCanvasMaterializationBindingPolicy,
    personReplacementCanvasMaterializationBindingPolicy,
  ],
  commit: commit,
});
((createStoryProjectCanvasFromWorkspace = (_0x4be50f = {}) =>
  syncStoryProjectCanvas({ ..._0x4be50f, adapter: workspaceCanvasMaterializationAdapter })),
  (createPersonReplacementOutputCanvasFromWorkspace = (_0x154dbc = {}) =>
    syncPersonReplacementCanvas({
      ..._0x154dbc,
      adapter: workspaceCanvasMaterializationAdapter,
      saveOutputBlob: project.saveOutputBlob,
    })));
const storyClipFrameCanvasAdapter = createStoryClipFrameCanvasAdapter({
  canvasTabManager: CanvasTabManager,
  createNodeAtCursor: (..._0x3a9cce) => appCanvasNodeFlows.createNodeAtCursor(..._0x3a9cce),
  getGraphState: () => graphStore.getStateRaw?.() || graphStore.getState?.() || {},
  updateNodeData: (_0x19e3c3, _0x547d56) => graphStore.updateNodeData(_0x19e3c3, _0x547d56),
  getNodeSize: (_0x355b3a) => getNodeDefaultSize(_0x355b3a),
  commit: commit,
});
((syncStoryClipFrameToCanvasFromWorkspace = (_0x321fbc = {}) =>
  syncStoryClipFrameToCanvas({ ..._0x321fbc, adapter: storyClipFrameCanvasAdapter })),
  (deleteStoryCanvasNodesFromWorkspace = (_0x530b4d = {}) =>
    deleteStoryCanvasMediaNodes({ ..._0x530b4d, adapter: storyClipFrameCanvasAdapter })));
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
    showToast: (..._0x3dfcd9) => window.showToast?.(..._0x3dfcd9),
    scheduleFrame: (_0x312866) => requestAnimationFrame(_0x312866),
    recordCommand: (_0x11df7d) => agentSessionStore.recordCommand(_0x11df7d),
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
    readUrl: (_0x18f107) => desktopBridge.agentInformation.readUrl(_0x18f107),
    readDocument: extractStoryDocumentText,
    validateDocument: validateStoryDocumentFile,
  }),
  agentSkillRegistry = createAgentSkillRegistry(),
  refreshAgentSkills = () => refreshInstalledAgentSkills({ registry: agentSkillRegistry }),
  installAgentSkill = () => installAgentSkillFromFolder({ registry: agentSkillRegistry }),
  saveAgentSkill = (_0x36c78e) =>
    saveManagedAgentSkill({ registry: agentSkillRegistry, definition: _0x36c78e }),
  deleteAgentSkill = async (_0x195fa0) => {
    const _0x4d7481 = await deleteInstalledAgentSkill({
      registry: agentSkillRegistry,
      request: _0x195fa0,
    });
    return (
      _0x4d7481?.success === true &&
        forgetAgentSkillPreference({
          registry: agentSkillRegistry,
          skillId: _0x4d7481.skillId,
          windowObject: window,
        }),
      _0x4d7481
    );
  },
  setAgentSkillEnabled = (_0x1fd696, _0x34b1e9) =>
    setAgentSkillEnabledPreference({
      registry: agentSkillRegistry,
      skillId: _0x1fd696,
      enabled: _0x34b1e9,
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
    message: _0x4201cc,
    originalMessage: _0x3dace2,
    clarificationAnswer: _0x589c32,
    history: _0x4570b7,
    existingSkills: _0xf32975,
    operation: _0x1dc8fc,
    targetSkill: _0x5e3751,
    repairReason: _0x4eeaa7,
    signal: _0x4138b4,
    onTrace: _0x438ea6,
  }) =>
    requestAgentSkillDraft({
      message: _0x4201cc,
      originalMessage: _0x3dace2,
      clarificationAnswer: _0x589c32,
      history: _0x4570b7,
      existingSkills: _0xf32975,
      operation: _0x1dc8fc,
      targetSkill: _0x5e3751,
      repairReason: _0x4eeaa7,
      signal: _0x4138b4,
      onTrace: _0x438ea6,
      settings: { ...agentModelSettings.getSettings(), locale: getLocale() },
    }),
  saveSkill: saveAgentSkill,
  deleteSkill: deleteAgentSkill,
  setSkillEnabled: setAgentSkillEnabled,
  planner: ({ message: _0x56d82c, context: _0x4d715d, history: _0x2b2bb6, onTrace: _0x2e9753 }) =>
    requestAgentActionPlan({
      message: _0x56d82c,
      context: _0x4d715d,
      history: _0x2b2bb6,
      onTrace: _0x2e9753,
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
    showToast: (..._0x551463) => window.showToast?.(..._0x551463),
    translate: translateAppText,
    executeCanvasCommand: (_0xb9d33c, _0x1f4c87) =>
      executeCanvasCommand_2(_0xb9d33c, _0x1f4c87, canvasCommandContext),
    isNodeMounted: (_0x3ecfdd) => window.v2Renderer?.isNodeMounted?.(_0x3ecfdd) === true,
    scheduleFrame: (_0x2d61bf) => window.requestAnimationFrame(_0x2d61bf),
    getCanvasIdentity: () =>
      appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId(),
  }),
  installGlobalTextPresetBridge({
    getCanvasIdentity: () =>
      appProjectContext.getCurrentProjectId() + ':' + CanvasTabManager.getActiveCanvasId(),
    textPresetApi: desktopBridge.textPreset.isAvailable() ? desktopBridge.textPreset : null,
    showToast: (..._0x38ffef) => window.showToast?.(..._0x38ffef),
    translate: translateAppText,
    executeCanvasCommand: (_0x16b448, _0x3de349) =>
      executeCanvasCommand_2(_0x16b448, _0x3de349, canvasCommandContext),
    isNodeMounted: (_0x234f2b) => window.v2Renderer?.isNodeMounted?.(_0x234f2b) === true,
    scheduleFrame: (_0x20bb16) => window.requestAnimationFrame(_0x20bb16),
  }),
  installStoryboard3DExportCanvasBridge({
    windowObject: window,
    createMediaNodeFromBlob: appCanvasNodeFlows.createMediaNodeFromBlob,
    showToast: (..._0x4ad810) => window.showToast?.(..._0x4ad810),
  }));
const openCanvasFileUploadFromShortcut = () => {
    const _0x196a58 = appCanvasPointerBindings.getCursorScreenPosition?.() || {};
    openAppCanvasFilePicker({
      documentObject: document,
      projectId: appProjectContext.getCurrentProjectId(),
      handleFileDrop: handleFileDrop,
      commit: commit,
      clientX: _0x196a58.x,
      clientY: _0x196a58.y,
      onUnsupported: () => {
        window.showToast?.(t('canvasInteraction.toasts.unsupportedUpload'), 'warning');
      },
      onError: (_0x593dee) => {
        (console.error('[Canvas] shortcut file import failed:', _0x593dee),
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
  analyzeCustomProviderDocumentation: (_0x2f86e6) =>
    analyzeCustomProviderDocumentation(_0x2f86e6, {
      settings: { ...agentModelSettings.getSettings(), locale: getLocale() },
    }),
  buildCustomProviderManifestDraft: buildCustomProviderManifestDraft,
  validateCustomProviderManifestDraft: validateCustomProviderManifestDraft,
  saveCustomProviderManifestBundle: saveCustomProviderManifestBundle,
  listCustomProviderManifestBundles: listCustomProviderManifestBundles,
  deleteCustomProviderManifestBundle: deleteCustomProviderManifestBundle,
  refreshManifestModelNodeUis: () => {
    const _0x10aaef = refreshManifestModelNodeUis();
    if (_0x10aaef.remountedNodeIds.length > 0) appStore.invalidateUi();
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
    focusNodes: (..._0x2ab5c2) => appViewport.focusNodes(..._0x2ab5c2),
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
    focusNode: (..._0x441d41) => appViewport.focusNode(..._0x441d41),
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
  onWorkspaceProjectPackageImported: (_0x517277) =>
    workspaceProjectPackageCoordinator?.applyImportedProject?.(_0x517277),
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
(window.addEventListener('beforeunload', () => nodeManagerPanel?.destroy?.(), { once: true }),
  MascotManager.init({ bindFabButton: false }),
  initAutoUpdate(),
  rendererStartupState.complete('entry'),
  void rendererStartupState.settled.then(({ ready: _0x225a6c }) => {
    if (_0x225a6c)
      scheduleChromeShellStartupReady({
        windowObject: window,
        diagnostics: desktopBridge.diagnostics,
      });
  }));
