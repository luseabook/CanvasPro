import appStore, { graphStore, uiStore, workspaceStore } from './src/core/stores/appStore.js';
import { initRenderer, clearRendererCache } from './src/core/renderer.js';
import { initRendererUiEvents, installRendererEventBindingGuard } from './src/ui/rendererUiEvents.js';
import {
  executeCommand,
  getDragContext,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleWheel,
  initCanvasContextMenu,
  initConnectionHandles,
  initPickConnect,
} from './src/core/interaction.js';
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
import { AIGenTextNode } from './src/components/AIGenTextNode.js';
import { AIGenVideoNode } from './src/components/AIGenVideoNode.js';
import { AIGenAudioNode } from './src/components/AIGenAudioNode.js';
import { GroupNode } from './src/components/GroupNode.js';
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
import { undo, redo, commit, onCommit } from './src/modules/history.js';
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
import { subscribeGenerationCompleteNotificationClicks } from './src/services/completionNotificationService.js';
import { desktopBridge, installDesktopBridgeCompat } from './src/services/desktopBridge.js';
import { scheduleChromeShellStartupReady } from './src/services/chromeShellStartupReadiness.js';
import { uploadFile } from './src/services/projectService.js';
import { migrateLegacyThumbnailsInMultiData } from './src/services/thumbnailCacheService.js';
import { initWebPreviewViewSyncService } from './src/services/webPreviewViewSyncService.js';
import { sanitizeMultiCanvasDataForPersistence } from './src/utils/thumbnailPersistence.js';
import { loadCustomPresets } from './src/modules/promptPresets.js';
import {
  getProjects,
  createProject,
  deleteProject,
  fetchApiConfigFromServer,
  saveApiConfigToServer,
  testProviderConnections,
  fetchDreaminaCliStatusFromServer,
  startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer,
  buildDreaminaQrImageUrl,
  startServerConnectionMonitor,
  fetchAppRuntimeInfoFromServer,
  requestAgentActionPlan,
} from './api/index.js';
import { initMinimap } from './src/modules/minimap.js';
import ImageAnnotateController from './src/modules/ImageAnnotateController.js';
import ImageMattingController from './src/modules/ImageMattingController.js';
import AudioClipController from './src/modules/AudioClipController.js';
import { CanvasTabManager } from './src/modules/CanvasTabManager.js';
import { CanvasProjectDropdownManager } from './src/modules/CanvasProjectDropdownManager.js';
import { SettingsManager } from './src/modules/SettingsManager.js';
import { MascotManager } from './src/modules/MascotManager.js';
import { initAutoUpdate } from './src/modules/AutoUpdate.js';
import { initDiagnosticsService } from './src/services/diagnosticsService.js';
import { initExternalLinkHandlers } from './src/services/externalLinkService.js';
import { initDevEntries } from './src/modules/devEntry.js';
import { initFloatingMenuKeyboard } from './src/modules/floatingMenuKeyboard.js';
import { initTextInputContextMenu } from './src/modules/textInputContextMenu.js';
import { initTaskCenterManager } from './src/modules/TaskCenterManager.js';
import { installTooltipUnifier } from './src/modules/tooltipUnifier.js';
import {
  createDefaultSubscriptionState,
  isModelAllowed,
  isSubscriptionActive,
  isActivationRequestAccepted,
  normalizeSubscriptionPayload,
  ensureInstallId,
  pullSubscriptionState,
  submitCdkey,
  clearSubscriptionAuthorization,
  DEFAULT_VIP_GATE_MODEL_ID,
  getVipModelDisplayName,
} from './src/modules/subscriptionAccess.js';
import { createAppBusinessEvents } from './src/modules/app/appBusinessEvents.js';
import { createAppCanvasNodeFlows } from './src/modules/app/canvasNodeFlows.js';
import { createAppTopbarAndConfig } from './src/modules/app/appTopbarAndConfig.js';
import { createAppPanels } from './src/modules/app/appPanels.js';
import { createAppViewport } from './src/modules/app/appViewport.js';
import { installAppCanvasPointerBindings } from './src/modules/app/appCanvasPointerBindings.js';
import { installGlobalTextPresetBridge } from './src/modules/app/globalTextPresetBridge.js';
import { initAppShellUi } from './src/modules/app/appShellUi.js';
import {
  createCanvasCommandContext,
  executeCanvasCommand,
  executeCanvasCommandPlan,
} from './src/modules/canvasCommands/index.js';
import {
  createAgentConversationStore,
  createAgentModelSettings,
  createAgentRuntime,
  createAgentSessionStore,
  initAgentPanel,
} from './src/modules/agent/index.js';
import { createSpecialNodeDataByType, initAppNodeEntry } from './src/modules/app/appNodeEntry.js';
import { bootstrapAppProject } from './src/modules/app/projectBootstrap.js';
import { getLocale, initI18nDomBindings, t } from './src/i18n/index.js';
((window._isSessionActive = true),
  initI18nDomBindings(),
  initToastService(),
  installDesktopBridgeCompat(),
  initDiagnosticsService(),
  initExternalLinkHandlers(),
  initKeyboardService(),
  initFloatingMenuKeyboard(),
  initTextInputContextMenu(),
  initTaskCenterManager(),
  installTooltipUnifier(),
  initDesktopMediaWakeService(),
  startServerConnectionMonitor(),
  (window.AI_CANVAS_IS_DEV_BUILD = false));
function publishRuntimeInfo(_0x143bdb = {}) {
  ((window.AI_CANVAS_IS_DEV_BUILD = Boolean(_0x143bdb?.isDevBuild)),
    (window.ADVANCED_MODE = Boolean(_0x143bdb?.isAdvancedMode)),
    window.dispatchEvent(new CustomEvent('aicanvas:runtime-info', { detail: _0x143bdb })));
}
async function initLocalDevModeFromRuntime() {
  try {
    const _0x1137ea = await fetchAppRuntimeInfoFromServer();
    (publishRuntimeInfo(_0x1137ea), initDevEntries({ isDevBuild: Boolean(_0x1137ea?.isDevBuild) }));
  } catch (_0x39dcba) {
    (publishRuntimeInfo({ isDevBuild: false, isAdvancedMode: false }), initDevEntries({ isDevBuild: false }));
  }
}
initLocalDevModeFromRuntime();
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
  debug = document.getElementById('v2-debug');
(installRendererEventBindingGuard(),
  initRenderer(wrap, canvas, appStore),
  initRendererUiEvents({ wrap: wrap, store: appStore }),
  initWebPreviewViewSyncService({ graphStore: graphStore, root: document }),
  initStoreRuntimeEffects(appStore),
  workspaceStore.setSubscriptionState(createDefaultSubscriptionState()),
  (window.CanvasTabManager = CanvasTabManager),
  document.getElementById('btnAddCanvas')?.addEventListener('click', () => CanvasTabManager.addCanvas()),
  bootstrapAppProject({
    store: appStore,
    CanvasTabManager: CanvasTabManager,
    project: project,
    loadCustomPresets: loadCustomPresets,
    migrateLegacyThumbnailsInMultiData: migrateLegacyThumbnailsInMultiData,
    sanitizeMultiCanvasDataForPersistence: sanitizeMultiCanvasDataForPersistence,
    commit: commit,
    patchStoreSourceNodeNamesFromFileName: _v2PatchStoreSourceNodeNamesFromFileName,
    applySourceNamesFromFileNameToCanvas: _v2ApplySourceNamesFromFileNameToCanvas,
    uploadFile: uploadFile,
    getBaseName: getBaseName,
  }),
  initAppShellUi({
    store: graphStore,
    initMinimap: initMinimap,
    minimapEl: document.getElementById('minimap'),
    btnMinimapEl: document.getElementById('btnMinimap'),
    minimapWrapperEl: document.getElementById('minimapWrapper'),
    btnToggleDotsEl: document.getElementById('btnToggleDots'),
    applySnapGridEnabled: applySnapGridEnabled,
    readSnapGridEnabled: readSnapGridEnabled,
    applyGridDotsPrefFromStorage: SettingsManager.applyGridDotsPrefFromStorage,
    showDevToast: showDevToast,
  }));
const appViewport = createAppViewport({
  graphStore: graphStore,
  uiStore: uiStore,
  wrap: wrap,
  debugEl: debug,
  zoomSliderEl: document.getElementById('zoomSlider'),
  zoomPercentEl: document.getElementById('zoomPercent'),
  fitActionEl: document.getElementById('btnFitAction'),
});
(appViewport.installWindowBindings(window),
  import('./src/modules/AssetManager.js').then(({ assetManager: _0x3a2e76 }) => {}),
  import('./src/modules/workflows/WorkflowManager.js').then(({ workflowManager: _0x541ba8 }) => {}),
  import('./src/modules/GenerationHistoryFileManager.js').then(
    ({ generationHistoryFileManager: _0x2a6745 }) => {},
  ),
  initAppNodeEntry({
    graphStore: graphStore,
    wrap: wrap,
    btnAddEl: document.getElementById('btnAdd'),
    nodeMenuEl: document.getElementById('nodeMenu'),
    initCanvasContextMenu: initCanvasContextMenu,
    getNodeDefaultSize: getNodeDefaultSize,
    commit: commit,
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
      initConnectionHandles: initConnectionHandles,
      initPickConnect: initPickConnect,
    },
  }),
  SOURCE_NODE_LEGACY_DEFAULT_NAMES = Object.freeze({
    image: Object.freeze(['图片']),
    video: Object.freeze(['视频']),
    audio: Object.freeze(['音频']),
    text: Object.freeze(['文本']),
    node: Object.freeze(['节点']),
  });
function mainText(_0x451ec4, _0x32878d = {}) {
  return t('app.' + _0x451ec4, _0x32878d);
}
function _v2GetDefaultNodeKind(_0x56a552) {
  const _0x35e50b = String(_0x56a552 || '');
  if (_0x35e50b.includes('image')) return 'image';
  if (_0x35e50b.includes('video')) return 'video';
  if (_0x35e50b.includes('audio')) return 'audio';
  if (_0x35e50b.includes('text')) return 'text';
  return 'node';
}
function _v2GetDefaultNodeName(_0x827d6b) {
  return mainText('sourceDefaults.' + _v2GetDefaultNodeKind(_0x827d6b));
}
function _v2IsDefaultNodeName(_0x135d12, _0x3ce5a5) {
  const _0x350069 = String(_0x135d12 || '');
  if (!_0x350069) return true;
  const _0x31de99 = _v2GetDefaultNodeKind(_0x3ce5a5);
  return (
    _0x350069 === _v2GetDefaultNodeName(_0x3ce5a5) ||
    SOURCE_NODE_LEGACY_DEFAULT_NAMES[_0x31de99]?.includes(_0x350069)
  );
}
function _v2ApplySourceNameFromFileNameToNode(_0x387c59) {
  if (!_0x387c59 || !_0x387c59.type) return _0x387c59;
  if (!String(_0x387c59.type).startsWith('source-')) return _0x387c59;
  const _0x1b7450 = getBaseName(_0x387c59.fileName);
  if (!_0x1b7450) return _0x387c59;
  if (_v2IsDefaultNodeName(_0x387c59.name, _0x387c59.type)) _0x387c59.name = _0x1b7450;
  return _0x387c59;
}
function _v2ApplySourceNamesFromFileNameToCanvas(_0x3fd599) {
  if (!_0x3fd599 || !_0x3fd599.nodes) return _0x3fd599;
  if (Array.isArray(_0x3fd599.nodes))
    return (_0x3fd599.nodes.forEach(_v2ApplySourceNameFromFileNameToNode), _0x3fd599);
  return (
    typeof _0x3fd599.nodes === 'object' &&
      Object.values(_0x3fd599.nodes).forEach(_v2ApplySourceNameFromFileNameToNode),
    _0x3fd599
  );
}
function _v2PatchStoreSourceNodeNamesFromFileName() {
  const _0x134fa2 = graphStore.getState(),
    _0x2455d3 = _0x134fa2?.nodes || {};
  Object.keys(_0x2455d3).forEach((_0x1d90d1) => {
    const _0x2a6372 = _0x2455d3[_0x1d90d1];
    if (!_0x2a6372 || !_0x2a6372.type || !String(_0x2a6372.type).startsWith('source-')) return;
    const _0x523de9 = getBaseName(_0x2a6372.fileName);
    if (!_0x523de9) return;
    _v2IsDefaultNodeName(_0x2a6372.name, _0x2a6372.type) && graphStore.renameNode(_0x1d90d1, _0x523de9);
  });
}
(wrap.addEventListener('dragover', (_0x4b6099) => {
  _0x4b6099.preventDefault();
}),
  wrap.addEventListener('drop', async (_0x428578) => {
    const _0xcef359 = window.currentProjectId || 'default_v2_project',
      _0x413b1b = await handleFileDrop(_0x428578, _0xcef359);
    if (_0x413b1b) {
      commit();
      return;
    }
    const _0x475553 = await handleWebImageUrlDrop(_0x428578, { projectId: _0xcef359 });
    _0x475553 && commit();
  }));
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
    getCurrentProjectId: () => window.currentProjectId,
    showToast: (..._0x443e69) => window.showToast?.(..._0x443e69),
  }),
  agentConversationStore = createAgentConversationStore({
    windowObject: window,
    getProjectId: () => window.currentProjectId || 'default_v2_project',
  }),
  agentSessionStore = createAgentSessionStore({ conversationStore: agentConversationStore }),
  canvasCommandContext = createCanvasCommandContext({
    store: appStore,
    graphStore: graphStore,
    canvasNodeFlows: appCanvasNodeFlows,
    createNodeAtCursor: appCanvasNodeFlows.createNodeAtCursor,
    executeCommand: executeCommand,
    focusNodes: appViewport.focusNodes,
    commit: commit,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    windowObject: window,
    recordCommand: (_0x3a444f) => agentSessionStore.recordCommand(_0x3a444f),
  }),
  canvasCommandsDebugApi = {
    executeCanvasCommand(_0x5ca618, _0x5aa7f9 = {}) {
      return executeCanvasCommand(_0x5ca618, _0x5aa7f9, canvasCommandContext);
    },
    executeCanvasCommandPlan(_0x5db01a = []) {
      return executeCanvasCommandPlan(_0x5db01a, canvasCommandContext);
    },
  },
  agentModelSettings = createAgentModelSettings({ windowObject: window }),
  agentRuntime = createAgentRuntime({
    store: appStore,
    commandContext: canvasCommandContext,
    sessionStore: agentSessionStore,
    planner: ({ message: _0x56d82c, context: _0x4d715d, history: _0x2b2bb6, onTrace: _0x2e9753 }) =>
      requestAgentActionPlan({
        message: _0x56d82c,
        context: _0x4d715d,
        history: _0x2b2bb6,
        onTrace: _0x2e9753,
        settings: { ...agentModelSettings.getSettings(), locale: getLocale() },
      }),
  }),
  canvasAgentDebugApi = {
    handleUserMessage: (..._0x24e206) => agentRuntime.handleUserMessage(..._0x24e206),
    answerClarification: (..._0x58660f) => agentRuntime.answerClarification(..._0x58660f),
    confirmPendingPlan: (..._0x4d3039) => agentRuntime.confirmPendingPlan(..._0x4d3039),
    cancelPendingPlan: (..._0x422302) => agentRuntime.cancelPendingPlan(..._0x422302),
    retryFailedPlan: (..._0x4f4bd7) => agentRuntime.retryFailedPlan(..._0x4f4bd7),
    keepPreparedPlan: (..._0x54e1b8) => agentRuntime.keepPreparedPlan(..._0x54e1b8),
    stop: (..._0x4942e7) => agentRuntime.stop(..._0x4942e7),
    resetSession: (..._0x247244) => agentRuntime.resetSession(..._0x247244),
    startNewConversation: (..._0x24e761) => agentRuntime.startNewConversation(..._0x24e761),
    switchConversation: (..._0x3fbe92) => agentRuntime.switchConversation(..._0x3fbe92),
    deleteConversation: (..._0x1d42f8) => agentRuntime.deleteConversation(..._0x1d42f8),
    listConversations: (..._0x217c52) => agentRuntime.listConversations(..._0x217c52),
    getActiveConversation: (..._0x3e5b54) => agentRuntime.getActiveConversation(..._0x3e5b54),
    getSessionState: () => agentSessionStore.getState(),
  };
async function uploadAgentMaterial(_0x1a5d4d) {
  if (!_0x1a5d4d?.type) return null;
  const _0x4bd377 = await appCanvasNodeFlows.createMediaNodeFromBlob(_0x1a5d4d, _0x1a5d4d.type, {
    placement: 'viewport-center-sequence',
    sequenceKey: 'agent-upload',
    name: getBaseName(_0x1a5d4d.name) || _0x1a5d4d.name || '',
  });
  if (!_0x4bd377) return null;
  const _0x3929f8 = graphStore.getState(),
    _0x9cbd7b = Array.isArray(_0x3929f8.selectedNodeIds) ? _0x3929f8.selectedNodeIds : [],
    _0x17f7d2 = _0x9cbd7b[_0x9cbd7b.length - 1] || '';
  return _0x17f7d2 ? _0x3929f8.nodes?.[_0x17f7d2] || null : null;
}
window.DEV_MODE === true &&
  (window.__aiCanvasDebug = {
    ...(window.__aiCanvasDebug || {}),
    canvasCommands: canvasCommandsDebugApi,
    canvasAgent: canvasAgentDebugApi,
  });
const agentPanelApi = initAgentPanel({
  runtime: agentRuntime,
  modelSettings: agentModelSettings,
  store: appStore,
  uploadMaterial: uploadAgentMaterial,
  fabBtnEl: document.getElementById('fabBtn'),
  root: document.body,
});
function createBlobFromBase64(_0x2a71a9, _0x20c903 = 'image/png') {
  const _0x1cb669 = atob(String(_0x2a71a9 || '')),
    _0x48b38f = [];
  for (let _0xda2453 = 0; _0xda2453 < _0x1cb669.length; _0xda2453 += 0x2000) {
    const _0x25f7b0 = _0x1cb669.slice(_0xda2453, _0xda2453 + 0x2000),
      _0x443285 = new Uint8Array(_0x25f7b0.length);
    for (let _0x42060f = 0; _0x42060f < _0x25f7b0.length; _0x42060f += 1) {
      _0x443285[_0x42060f] = _0x25f7b0.charCodeAt(_0x42060f);
    }
    _0x48b38f.push(_0x443285);
  }
  return new Blob(_0x48b38f, { type: _0x20c903 });
}
function installGlobalScreenshotBridge() {
  const _0x17dabd = window.electronAPI?.screenshot;
  (_0x17dabd?.onGlobalCapture?.(async (_0x882b8b = {}) => {
    try {
      const _0x25c32e = String(_0x882b8b?.pngBase64 || '').trim();
      if (!_0x25c32e) return;
      const _0x4d737c = String(_0x882b8b?.mimeType || 'image/png') || 'image/png',
        _0x337ecd = createBlobFromBase64(_0x25c32e, _0x4d737c),
        _0x5884c9 = await appCanvasNodeFlows.createMediaNodeFromBlob(_0x337ecd, _0x4d737c, {
          name: mainText('globalScreenshot.nodeName'),
          placement: 'viewport-center-sequence',
          sequenceKey: 'global-screenshot',
        });
      _0x5884c9
        ? window.showToast?.(mainText('globalScreenshot.added'), 'success')
        : window.showToast?.(mainText('globalScreenshot.importFailed'), 'error');
    } catch (_0x580487) {
      (console.error('[screenshot] failed to import global capture', _0x580487),
        window.showToast?.(mainText('globalScreenshot.importFailed'), 'error'));
    }
  }),
    _0x17dabd?.onGlobalShortcutStatus?.((_0x51089d = {}) => {
      if (_0x51089d?.registered === false && _0x51089d?.reason === 'registration-failed') {
        window.showToast?.(mainText('globalScreenshot.shortcutRegistrationFailed'), 'warn');
        return;
      }
      _0x51089d?.registered === true &&
        _0x51089d?.ok === false &&
        window.showToast?.(mainText('globalScreenshot.captureFailed'), 'error');
    }));
}
installGlobalScreenshotBridge();
installGlobalTextPresetBridge({
  getCanvasIdentity: () =>
    (window.currentProjectId || 'default_v2_project') + ':' + CanvasTabManager.getActiveCanvasId(),
  textPresetApi: desktopBridge['textPreset']['isAvailable']() ? desktopBridge['textPreset'] : null,
  showToast: (..._0x38ffef) => window.showToast?.(..._0x38ffef),
  translate: mainText,
  executeCanvasCommand: (_0x16b448, _0x3de349) =>
    executeCanvasCommand(_0x16b448, _0x3de349, canvasCommandContext),
  isNodeMounted: (_0x234f2b) => window['v2Renderer']?.['isNodeMounted']?.(_0x234f2b) === true,
  scheduleFrame: (_0x20bb16) => window['requestAnimationFrame'](_0x20bb16),
});
function installCompletionNotificationBridge() {
  subscribeGenerationCompleteNotificationClicks(async (_0x39a4f2 = {}) => {
    const _0x1a2f6e = String(_0x39a4f2?.nodeId || '').trim();
    if (!_0x1a2f6e) return;
    const _0x3f5f8c = String(_0x39a4f2?.canvasId || '').trim(),
      _0x1c2bfb = CanvasTabManager.getMultiDataSnapshot({ captureVisualSnapshot: false }),
      _0x5a6f5d = (_0x1c2bfb?.canvases || []).filter((_0x4e0d17) => {
        if (_0x3f5f8c && _0x4e0d17?.id !== _0x3f5f8c) return false;
        const _0x2e1a3f = _0x4e0d17?.nodes || [];
        return Array.isArray(_0x2e1a3f)
          ? _0x2e1a3f.some((_0x1d0b6e) => _0x1d0b6e?.id === _0x1a2f6e)
          : Boolean(_0x2e1a3f[_0x1a2f6e]);
      });
    if (_0x5a6f5d.length !== 1) {
      window.showToast?.(mainText('completionNavigation.nodeMissing'), 'warn');
      return;
    }
    const _0x4c4aaf = _0x5a6f5d[0].id;
    if (_0x4c4aaf !== CanvasTabManager.getActiveCanvasId()) await CanvasTabManager.switchTo(_0x4c4aaf);
    if (CanvasTabManager.getActiveCanvasId() !== _0x4c4aaf) return;
    if (!graphStore.getState()?.nodes?.[_0x1a2f6e]) return;
    (graphStore.setSelectedNodes([_0x1a2f6e]), appViewport.focusNodes([_0x1a2f6e]));
  });
}
installCompletionNotificationBridge();
const appBusinessEvents = createAppBusinessEvents({
  store: appStore,
  wrap: wrap,
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
  saveApiConfigToServer: saveApiConfigToServer,
  testProviderConnections: testProviderConnections,
  fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
  startDreaminaHeadlessLoginFromServer: startDreaminaHeadlessLoginFromServer,
  startDreaminaHeadlessReloginFromServer: startDreaminaHeadlessReloginFromServer,
  startDreaminaWebLoginFromServer: startDreaminaWebLoginFromServer,
  importDreaminaLoginResponseFromServer: importDreaminaLoginResponseFromServer,
  logoutDreaminaFromServer: logoutDreaminaFromServer,
  buildDreaminaQrImageUrl: buildDreaminaQrImageUrl,
  showError: showError,
});
appTopbarAndConfig.init();
const appPanels = createAppPanels({
  store: appStore,
  setTextWithLineBreaks: setTextWithLineBreaks,
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
});
(appPanels.init(),
  CanvasProjectDropdownManager.init(),
  SettingsManager.init({ graphStore: graphStore, uiStore: uiStore }),
  MascotManager.init({ bindFabButton: false }),
  initAutoUpdate());
scheduleChromeShellStartupReady({ windowObject: window, diagnostics: desktopBridge['diagnostics'] });
