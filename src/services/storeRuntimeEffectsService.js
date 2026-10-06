import {
  FEATURE_SELECTIONS_STORAGE_KEY,
  sanitizeFeatureSelectionsRecord,
} from '../modules/featureSelectionMemory.js';
import {
  normalizeImageToolbarLayout,
  serializeImageToolbarLayout,
} from '../modules/imageToolbarLayoutMemory.js';
import {
  normalizeVideoToolbarLayout,
  serializeVideoToolbarLayout,
} from '../modules/videoToolbarLayoutMemory.js';
import { normalizeCanvasToolbarPlacement } from '../modules/canvasToolbarPlacement.js';
import { normalizeNodeManagerPlacement } from '../modules/nodeManager/nodeManagerPlacement.js';
import { readViewportInteractionState } from '../core/viewportInteractionState.js';
import { normalizeConnectionLineStyle } from '../core/edgePathGeometry.js';
const THEME_STORAGE_KEY = 'ai-canvas-theme',
  SHOW_VIDEO_META_STORAGE_KEY = 'v2-show-video-meta',
  SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY = 'v2-show-selection-media-properties',
  TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY = 'v2-title-follows-canvas-zoom',
  PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY = 'v2-prompt-box-resize-enabled',
  PROMPT_ENTER_BEHAVIOR_STORAGE_KEY = 'v2-prompt-enter-behavior',
  PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY = 'v2-prompt-attachment-button-hidden',
  PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY = 'v2-prompt-preset-button-hidden',
  VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY = 'v2-video-audio-default-enabled',
  CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY = 'v2-canvas-toolbar-placement',
  NODE_MANAGER_PLACEMENT_STORAGE_KEY = 'v2-node-manager-placement',
  LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY = 'v2-left-sidebar-auto-hide',
  BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY = 'v2-bottom-left-bar-auto-hide',
  IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY = 'v2-image-video-node-resize-enabled',
  SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY = 'v2-selection-related-highlight-enabled',
  SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY = 'v2-selection-related-highlight-color',
  CONNECTION_LINES_VISIBLE_STORAGE_KEY = 'v2-connection-lines-visible',
  CONNECTION_LINE_STYLE_STORAGE_KEY = 'v2-connection-line-style',
  IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY = 'v2-image-toolbar-layout',
  VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY = 'v2-video-toolbar-layout',
  ALIGN_FEATURE_ENABLED_STORAGE_KEY = 'v2-align-enabled',
  ALIGN_TRIGGER_MODE_STORAGE_KEY = 'v2-align-trigger-mode',
  ALIGN_DISTRIBUTE_GAP_STORAGE_KEY = 'v2-align-distribute-gap',
  SNAP_GUIDES_ENABLED_STORAGE_KEY = 'v2-snap-guides';
function getStorage() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {}
  return null;
}
function safeStorageGet(value, item = '') {
  const storage = getStorage();
  if (!storage) return item;
  try {
    const key = storage.getItem(value);
    return key == null ? item : key;
  } catch {
    return item;
  }
}
function safeStorageSet(index, result) {
  const storage2 = getStorage();
  if (!storage2) return;
  try {
    storage2.setItem(index, String(result));
  } catch {}
}
function parseJsonObject(enabled) {
  if (!enabled) return {};
  try {
    const data = JSON.parse(enabled);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}
function normalizeSelectionRelatedHighlightColor(options) {
  const target = String(options || '').trim();
  return ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow'].includes(target) ? target : 'white';
}
function normalizePromptEnterBehavior(source) {
  return source === 'newline' ? 'newline' : 'submit';
}
export function normalizeThemeName(next) {
  return next === 'light' ? 'light' : 'dark';
}
export function readThemeFromStorage() {
  return normalizeThemeName(safeStorageGet(THEME_STORAGE_KEY, 'dark'));
}
export function applyThemeToDom(current) {
  const themeName = normalizeThemeName(current);
  try {
    const el = typeof document !== 'undefined' ? document?.documentElement : null;
    el && typeof el.setAttribute === 'function' && el.setAttribute('data-theme', themeName);
  } catch {}
}
export function persistThemeToStorage(entry) {
  safeStorageSet(THEME_STORAGE_KEY, normalizeThemeName(entry));
}
export function applyStoredThemeToDom() {
  const themeFromStorage = readThemeFromStorage();
  return (applyThemeToDom(themeFromStorage), themeFromStorage);
}
export function readUiPrefsFromStorage() {
  const safeStorageGet2 = safeStorageGet(SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY, '1'),
    safeStorageGet3 = safeStorageGet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, '0'),
    safeStorageGet4 = safeStorageGet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, '1'),
    safeStorageGet5 = safeStorageGet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, 'submit'),
    safeStorageGet6 = safeStorageGet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, '1'),
    safeStorageGet7 = safeStorageGet(PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY, '0'),
    safeStorageGet8 = safeStorageGet(VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY, '0'),
    safeStorageGet9 = safeStorageGet(CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY, 'left'),
    safeStorageGet10 = safeStorageGet(NODE_MANAGER_PLACEMENT_STORAGE_KEY, 'left'),
    safeStorageGet11 = safeStorageGet(LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY, '0'),
    safeStorageGet12 = safeStorageGet(BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY, '0'),
    safeStorageGet13 = safeStorageGet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, '0'),
    safeStorageGet14 = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, '1'),
    safeStorageGet15 = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, 'white'),
    safeStorageGet16 = safeStorageGet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, '1'),
    safeStorageGet17 = safeStorageGet(CONNECTION_LINE_STYLE_STORAGE_KEY, 'curve'),
    safeStorageGet18 = safeStorageGet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, ''),
    safeStorageGet19 = safeStorageGet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, ''),
    safeStorageGet20 = safeStorageGet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, '1'),
    safeStorageGet21 = safeStorageGet(ALIGN_TRIGGER_MODE_STORAGE_KEY, ''),
    safeStorageGet22 = safeStorageGet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, '40'),
    safeStorageGet23 = safeStorageGet(SNAP_GUIDES_ENABLED_STORAGE_KEY, '1'),
    safeStorageGet24 = safeStorageGet(FEATURE_SELECTIONS_STORAGE_KEY, '{}'),
    alignFeatureEnabled =
      safeStorageGet21 === 'hold' || safeStorageGet21 === 'click' || safeStorageGet21 === 'off'
        ? safeStorageGet21
        : String(safeStorageGet20) === '0'
          ? 'off'
          : 'click',
    record = Number(safeStorageGet22),
    alignDistributeGap = Number.isFinite(record)
      ? Math.max(0, Math.min(200, Math.round(record)))
      : 40;
  return {
    showVideoMeta: false,
    showSelectionMediaProperties: String(safeStorageGet2) !== '0',
    titleFollowsCanvasZoom: String(safeStorageGet3) === '1',
    promptBoxResizeEnabled: String(safeStorageGet4) !== '0',
    promptEnterBehavior: normalizePromptEnterBehavior(safeStorageGet5),
    promptAttachmentButtonHidden: String(safeStorageGet6) === '1',
    promptPresetButtonHidden: String(safeStorageGet7) === '1',
    videoAudioDefaultEnabled: String(safeStorageGet8) === '1',
    canvasToolbarPlacement: normalizeCanvasToolbarPlacement(safeStorageGet9),
    nodeManagerPlacement: normalizeNodeManagerPlacement(safeStorageGet10),
    leftSidebarAutoHideEnabled: String(safeStorageGet11) === '1',
    bottomLeftBarAutoHideEnabled: String(safeStorageGet12) === '1',
    imageVideoNodeResizeEnabled: String(safeStorageGet13) === '1',
    selectionRelatedHighlightEnabled: String(safeStorageGet14) !== '0',
    selectionRelatedHighlightColor: normalizeSelectionRelatedHighlightColor(safeStorageGet15),
    connectionLinesVisible: String(safeStorageGet16) !== '0',
    connectionLineStyle: normalizeConnectionLineStyle(safeStorageGet17),
    imageToolbarLayout: normalizeImageToolbarLayout(parseJsonObject(safeStorageGet18)),
    videoToolbarLayout: normalizeVideoToolbarLayout(parseJsonObject(safeStorageGet19)),
    alignFeatureEnabled: alignFeatureEnabled !== 'off',
    alignFeatureTriggerMode: alignFeatureEnabled,
    alignDistributeGap: alignDistributeGap,
    snapGuidesEnabled: String(safeStorageGet23) !== '0',
    featureSelections: sanitizeFeatureSelectionsRecord(parseJsonObject(safeStorageGet24)),
  };
}
export function persistUiPrefsToStorage(payload) {
  const handle = payload?.showSelectionMediaProperties !== false,
    state = payload?.titleFollowsCanvasZoom === true,
    config = payload?.promptBoxResizeEnabled !== false,
    promptEnterBehavior = normalizePromptEnterBehavior(payload?.promptEnterBehavior),
    scope = payload?.promptAttachmentButtonHidden === true,
    input = payload?.promptPresetButtonHidden === true,
    output = payload?.videoAudioDefaultEnabled === true,
    canvasToolbarPlacement = normalizeCanvasToolbarPlacement(payload?.canvasToolbarPlacement),
    nodeManagerPlacement = normalizeNodeManagerPlacement(payload?.nodeManagerPlacement),
    value2 = payload?.leftSidebarAutoHideEnabled === true,
    value3 = payload?.bottomLeftBarAutoHideEnabled === true,
    value4 = payload?.imageVideoNodeResizeEnabled === true,
    value5 = payload?.selectionRelatedHighlightEnabled !== false,
    selectionRelatedHighlightColor = normalizeSelectionRelatedHighlightColor(
      payload?.selectionRelatedHighlightColor,
    ),
    value6 = payload?.connectionLinesVisible !== false,
    connectionLineStyle = normalizeConnectionLineStyle(payload?.connectionLineStyle),
    imageToolbarLayout = normalizeImageToolbarLayout(payload?.imageToolbarLayout),
    videoToolbarLayout = normalizeVideoToolbarLayout(payload?.videoToolbarLayout),
    value7 =
      payload?.alignFeatureTriggerMode === 'hold' ||
      payload?.alignFeatureTriggerMode === 'click' ||
      payload?.alignFeatureTriggerMode === 'off'
        ? payload.alignFeatureTriggerMode
        : payload?.alignFeatureEnabled === false
          ? 'off'
          : 'click',
    value8 = value7 !== 'off',
    value9 = Number(payload?.alignDistributeGap),
    value10 = Number.isFinite(value9) ? Math.max(0, Math.min(200, Math.round(value9))) : 40,
    value11 = payload?.snapGuidesEnabled !== false,
    sanitizeFeatureSelectionsRecord2 = sanitizeFeatureSelectionsRecord(payload?.featureSelections || {});
  (safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, '0'),
    safeStorageSet(SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY, handle ? '1' : '0'),
    safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, state ? '1' : '0'),
    safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, config ? '1' : '0'),
    safeStorageSet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, promptEnterBehavior),
    safeStorageSet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, scope ? '1' : '0'),
    safeStorageSet(PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY, input ? '1' : '0'),
    safeStorageSet(VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY, output ? '1' : '0'),
    safeStorageSet(CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY, canvasToolbarPlacement),
    safeStorageSet(NODE_MANAGER_PLACEMENT_STORAGE_KEY, nodeManagerPlacement),
    safeStorageSet(LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY, value2 ? '1' : '0'),
    safeStorageSet(BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY, value3 ? '1' : '0'),
    safeStorageSet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, value4 ? '1' : '0'),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, value5 ? '1' : '0'),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, selectionRelatedHighlightColor),
    safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, value6 ? '1' : '0'),
    safeStorageSet(CONNECTION_LINE_STYLE_STORAGE_KEY, connectionLineStyle),
    safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, serializeImageToolbarLayout(imageToolbarLayout)),
    safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, serializeVideoToolbarLayout(videoToolbarLayout)),
    safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, value8 ? '1' : '0'),
    safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, value7),
    safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(value10)),
    safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, value11 ? '1' : '0'),
    safeStorageSet(FEATURE_SELECTIONS_STORAGE_KEY, JSON.stringify(sanitizeFeatureSelectionsRecord2)));
}
function isViewportAnimating() {
  return readViewportInteractionState().isViewportBusy;
}
export function shouldBumpViewportPersistOnZoom() {
  return !isViewportAnimating();
}
function resolveStoreBundle(uiStore) {
  if (!uiStore || typeof uiStore !== 'object') return { uiStore: null, graphStore: null };
  if (uiStore.uiStore && uiStore.graphStore)
    return { uiStore: uiStore.uiStore, graphStore: uiStore.graphStore };
  if (typeof uiStore.getDomainStores === 'function') {
    const uiStore2 = uiStore.getDomainStores() || {};
    if (uiStore2.uiStore && uiStore2.graphStore)
      return { uiStore: uiStore2.uiStore, graphStore: uiStore2.graphStore };
  }
  return { uiStore: uiStore, graphStore: uiStore };
}
export function initStoreRuntimeEffects(value12) {
  const { uiStore: uiStore3, graphStore: graphStore } = resolveStoreBundle(value12);
  if (!uiStore3 || !graphStore) return () => {};
  const dom = applyStoredThemeToDom(),
    uiPrefsFromStorage = readUiPrefsFromStorage();
  (uiStore3.initTheme(dom),
    uiStore3.initUiPrefs(uiPrefsFromStorage),
    graphStore.setViewportPersistPolicy(shouldBumpViewportPersistOnZoom));
  const value13 = uiStore3.subscribeSelector(
    (value14) => value14.theme,
    (value15) => {
      const themeName2 = normalizeThemeName(value15);
      (applyThemeToDom(themeName2), persistThemeToStorage(themeName2));
    },
  );
  safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, '0');
  const value16 = uiStore3.subscribeSelector(
      (value17) => value17.ui?.showSelectionMediaProperties !== false,
      (value18) => {
        safeStorageSet(SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY, value18 ? '1' : '0');
      },
    ),
    value19 = uiStore3.subscribeSelector(
      (value20) => value20.ui?.titleFollowsCanvasZoom === true,
      (value21) => {
        safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, value21 ? '1' : '0');
      },
    ),
    value22 = uiStore3.subscribeSelector(
      (value23) => value23.ui?.promptBoxResizeEnabled !== false,
      (value24) => {
        safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, value24 ? '1' : '0');
      },
    ),
    value25 = uiStore3.subscribeSelector(
      (value26) => normalizePromptEnterBehavior(value26.ui?.promptEnterBehavior),
      (value27) => {
        safeStorageSet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, value27);
      },
    ),
    value28 = uiStore3.subscribeSelector(
      (value29) => value29.ui?.promptAttachmentButtonHidden === true,
      (value30) => {
        safeStorageSet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, value30 ? '1' : '0');
      },
    ),
    value31 = uiStore3.subscribeSelector(
      (value32) => value32.ui?.promptPresetButtonHidden === true,
      (value33) => {
        safeStorageSet(PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY, value33 ? '1' : '0');
      },
    ),
    value34 = uiStore3.subscribeSelector(
      (value35) => value35.ui?.videoAudioDefaultEnabled === true,
      (value36) => {
        safeStorageSet(VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY, value36 ? '1' : '0');
      },
    ),
    value37 = uiStore3.subscribeSelector(
      (value38) => normalizeCanvasToolbarPlacement(value38.ui?.canvasToolbarPlacement),
      (value39) => {
        safeStorageSet(CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY, value39);
      },
    ),
    value40 = uiStore3.subscribeSelector(
      (value41) => normalizeNodeManagerPlacement(value41.ui?.nodeManagerPlacement),
      (value42) => {
        safeStorageSet(NODE_MANAGER_PLACEMENT_STORAGE_KEY, value42);
      },
    ),
    value43 = uiStore3.subscribeSelector(
      (value44) => value44.ui?.leftSidebarAutoHideEnabled === true,
      (value45) => {
        safeStorageSet(LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY, value45 ? '1' : '0');
      },
    ),
    value46 = uiStore3.subscribeSelector(
      (value47) => value47.ui?.bottomLeftBarAutoHideEnabled === true,
      (value48) => {
        safeStorageSet(BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY, value48 ? '1' : '0');
      },
    ),
    value49 = uiStore3.subscribeSelector(
      (value50) => value50.ui?.imageVideoNodeResizeEnabled === true,
      (value51) => {
        safeStorageSet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, value51 ? '1' : '0');
      },
    ),
    value52 = uiStore3.subscribeSelector(
      (value53) => value53.ui?.selectionRelatedHighlightEnabled !== false,
      (value54) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, value54 ? '1' : '0');
      },
    ),
    value55 = uiStore3.subscribeSelector(
      (value56) => normalizeSelectionRelatedHighlightColor(value56.ui?.selectionRelatedHighlightColor),
      (value57) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, value57);
      },
    ),
    value58 = uiStore3.subscribeSelector(
      (value59) => value59.ui?.connectionLinesVisible !== false,
      (value60) => {
        safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, value60 ? '1' : '0');
      },
    ),
    value61 = uiStore3.subscribeSelector(
      (value62) => normalizeConnectionLineStyle(value62.ui?.connectionLineStyle),
      (value63) => {
        safeStorageSet(CONNECTION_LINE_STYLE_STORAGE_KEY, value63);
      },
    ),
    value64 = uiStore3.subscribeSelector(
      (value65) => serializeImageToolbarLayout(value65.ui?.imageToolbarLayout),
      (value66) => {
        safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, value66);
      },
    ),
    value67 = uiStore3.subscribeSelector(
      (value68) => serializeVideoToolbarLayout(value68.ui?.videoToolbarLayout),
      (value69) => {
        safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, value69);
      },
    ),
    value70 = uiStore3.subscribeSelector(
      (value71) => value71.ui?.alignFeatureEnabled !== false,
      (value72) => {
        safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, value72 ? '1' : '0');
      },
    ),
    value73 = uiStore3.subscribeSelector(
      (value74) => {
        const value75 = value74.ui?.alignFeatureTriggerMode;
        return value75 === 'hold' || value75 === 'click' || value75 === 'off' ? value75 : 'click';
      },
      (value76) => {
        (safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, value76),
          safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, value76 === 'off' ? '0' : '1'));
      },
    ),
    value77 = uiStore3.subscribeSelector(
      (value78) => {
        const value79 = Number(value78.ui?.alignDistributeGap);
        return Number.isFinite(value79)
          ? Math.max(0, Math.min(200, Math.round(value79)))
          : 40;
      },
      (value80) => {
        safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(value80));
      },
    ),
    value81 = uiStore3.subscribeSelector(
      (value82) => value82.ui?.snapGuidesEnabled !== false,
      (value83) => {
        safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, value83 ? '1' : '0');
      },
    ),
    value84 = uiStore3.subscribeSelector(
      (value85) => {
        try {
          return JSON.stringify(value85.ui?.featureSelections || {});
        } catch {
          return '{}';
        }
      },
      (value86) => {
        const jsonObject = parseJsonObject(value86);
        safeStorageSet(
          FEATURE_SELECTIONS_STORAGE_KEY,
          JSON.stringify(sanitizeFeatureSelectionsRecord(jsonObject)),
        );
      },
    );
  return () => {
    (value13?.(),
      value16?.(),
      value19?.(),
      value22?.(),
      value25?.(),
      value28?.(),
      value31?.(),
      value34?.(),
      value37?.(),
      value40?.(),
      value43?.(),
      value46?.(),
      value49?.(),
      value52?.(),
      value55?.(),
      value58?.(),
      value61?.(),
      value64?.(),
      value67?.(),
      value70?.(),
      value73?.(),
      value77?.(),
      value81?.(),
      value84?.(),
      graphStore.setViewportPersistPolicy(() => true));
  };
}
