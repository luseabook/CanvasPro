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
function safeStorageGet(_0x2b18d3, _0x4db7dc = '') {
  const _0x4e017c = getStorage();
  if (!_0x4e017c) return _0x4db7dc;
  try {
    const _0x109307 = _0x4e017c['getItem'](_0x2b18d3);
    return _0x109307 == null ? _0x4db7dc : _0x109307;
  } catch {
    return _0x4db7dc;
  }
}
function safeStorageSet(_0x568c73, _0x1e5d89) {
  const _0x17ef30 = getStorage();
  if (!_0x17ef30) return;
  try {
    _0x17ef30['setItem'](_0x568c73, String(_0x1e5d89));
  } catch {}
}
function parseJsonObject(_0x38707d) {
  if (!_0x38707d) return {};
  try {
    const _0x30f350 = JSON['parse'](_0x38707d);
    return _0x30f350 && typeof _0x30f350 === 'object' && !Array['isArray'](_0x30f350) ? _0x30f350 : {};
  } catch {
    return {};
  }
}
function normalizeSelectionRelatedHighlightColor(_0x1d1b14) {
  const _0xc5e33 = String(_0x1d1b14 || '')['trim']();
  return ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow']['includes'](_0xc5e33)
    ? _0xc5e33
    : 'white';
}
function normalizePromptEnterBehavior(_0x1b6b43) {
  return _0x1b6b43 === 'newline' ? 'newline' : 'submit';
}
export function normalizeThemeName(_0x16f2e7) {
  return _0x16f2e7 === 'light' ? 'light' : 'dark';
}
export function readThemeFromStorage() {
  return normalizeThemeName(safeStorageGet(THEME_STORAGE_KEY, 'dark'));
}
export function applyThemeToDom(_0x25ab87) {
  const _0x13594a = normalizeThemeName(_0x25ab87);
  try {
    const _0x10cdb7 = typeof document !== 'undefined' ? document?.['documentElement'] : null;
    _0x10cdb7 &&
      typeof _0x10cdb7['setAttribute'] === 'function' &&
      _0x10cdb7['setAttribute']('data-theme', _0x13594a);
  } catch {}
}
export function persistThemeToStorage(_0x457e9c) {
  safeStorageSet(THEME_STORAGE_KEY, normalizeThemeName(_0x457e9c));
}
export function applyStoredThemeToDom() {
  const _0x4dee3d = readThemeFromStorage();
  return (applyThemeToDom(_0x4dee3d), _0x4dee3d);
}
export function readUiPrefsFromStorage() {
  const _0x37e053 = safeStorageGet(SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY, '1'),
    _0x3c41c6 = safeStorageGet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, '0'),
    _0xbbb4f1 = safeStorageGet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, '1'),
    _0x59fa66 = safeStorageGet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, 'submit'),
    _0x16eeb3 = safeStorageGet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, '1'),
    _0x64aba3 = safeStorageGet(PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY, '0'),
    _0x5278c3 = safeStorageGet(VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY, '0'),
    _0x3358da = safeStorageGet(CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY, 'left'),
    _0x277b4b = safeStorageGet(NODE_MANAGER_PLACEMENT_STORAGE_KEY, 'left'),
    _0x419091 = safeStorageGet(LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY, '0'),
    _0x7c3239 = safeStorageGet(BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY, '0'),
    _0x32694e = safeStorageGet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, '0'),
    _0xf79b0d = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, '1'),
    _0x27907d = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, 'white'),
    _0x3fc5cb = safeStorageGet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, '1'),
    _0x5ed4d1 = safeStorageGet(CONNECTION_LINE_STYLE_STORAGE_KEY, 'curve'),
    _0x19a76f = safeStorageGet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, ''),
    _0x5a714e = safeStorageGet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, ''),
    _0x50e66a = safeStorageGet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, '1'),
    _0x38be75 = safeStorageGet(ALIGN_TRIGGER_MODE_STORAGE_KEY, ''),
    _0x23accb = safeStorageGet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, '40'),
    _0x234b06 = safeStorageGet(SNAP_GUIDES_ENABLED_STORAGE_KEY, '1'),
    _0x6282a3 = safeStorageGet(FEATURE_SELECTIONS_STORAGE_KEY, '{}'),
    _0x11bf04 =
      _0x38be75 === 'hold' || _0x38be75 === 'click' || _0x38be75 === 'off'
        ? _0x38be75
        : String(_0x50e66a) === '0'
          ? 'off'
          : 'click',
    _0x353a8d = Number(_0x23accb),
    _0x3e4c1c = Number['isFinite'](_0x353a8d)
      ? Math['max'](0x0, Math['min'](0xc8, Math['round'](_0x353a8d)))
      : 0x28;
  return {
    showVideoMeta: ![],
    showSelectionMediaProperties: String(_0x37e053) !== '0',
    titleFollowsCanvasZoom: String(_0x3c41c6) === '1',
    promptBoxResizeEnabled: String(_0xbbb4f1) !== '0',
    promptEnterBehavior: normalizePromptEnterBehavior(_0x59fa66),
    promptAttachmentButtonHidden: String(_0x16eeb3) === '1',
    promptPresetButtonHidden: String(_0x64aba3) === '1',
    videoAudioDefaultEnabled: String(_0x5278c3) === '1',
    canvasToolbarPlacement: normalizeCanvasToolbarPlacement(_0x3358da),
    nodeManagerPlacement: normalizeNodeManagerPlacement(_0x277b4b),
    leftSidebarAutoHideEnabled: String(_0x419091) === '1',
    bottomLeftBarAutoHideEnabled: String(_0x7c3239) === '1',
    imageVideoNodeResizeEnabled: String(_0x32694e) === '1',
    selectionRelatedHighlightEnabled: String(_0xf79b0d) !== '0',
    selectionRelatedHighlightColor: normalizeSelectionRelatedHighlightColor(_0x27907d),
    connectionLinesVisible: String(_0x3fc5cb) !== '0',
    connectionLineStyle: normalizeConnectionLineStyle(_0x5ed4d1),
    imageToolbarLayout: normalizeImageToolbarLayout(parseJsonObject(_0x19a76f)),
    videoToolbarLayout: normalizeVideoToolbarLayout(parseJsonObject(_0x5a714e)),
    alignFeatureEnabled: _0x11bf04 !== 'off',
    alignFeatureTriggerMode: _0x11bf04,
    alignDistributeGap: _0x3e4c1c,
    snapGuidesEnabled: String(_0x234b06) !== '0',
    featureSelections: sanitizeFeatureSelectionsRecord(parseJsonObject(_0x6282a3)),
  };
}
export function persistUiPrefsToStorage(_0x1981b8) {
  const _0x5bc241 = _0x1981b8?.['showSelectionMediaProperties'] !== ![],
    _0x47712b = _0x1981b8?.['titleFollowsCanvasZoom'] === !![],
    _0x1b668c = _0x1981b8?.['promptBoxResizeEnabled'] !== ![],
    _0x1e7094 = normalizePromptEnterBehavior(_0x1981b8?.['promptEnterBehavior']),
    _0x517092 = _0x1981b8?.['promptAttachmentButtonHidden'] === !![],
    _0x4b4660 = _0x1981b8?.['promptPresetButtonHidden'] === !![],
    _0x4a217b = _0x1981b8?.['videoAudioDefaultEnabled'] === !![],
    _0x3e60f2 = normalizeCanvasToolbarPlacement(_0x1981b8?.['canvasToolbarPlacement']),
    _0x24cbbf = normalizeNodeManagerPlacement(_0x1981b8?.['nodeManagerPlacement']),
    _0x337339 = _0x1981b8?.['leftSidebarAutoHideEnabled'] === !![],
    _0x13f789 = _0x1981b8?.['bottomLeftBarAutoHideEnabled'] === !![],
    _0x14ccf4 = _0x1981b8?.['imageVideoNodeResizeEnabled'] === !![],
    _0x383cac = _0x1981b8?.['selectionRelatedHighlightEnabled'] !== ![],
    _0x3765cb = normalizeSelectionRelatedHighlightColor(_0x1981b8?.['selectionRelatedHighlightColor']),
    _0x36b437 = _0x1981b8?.['connectionLinesVisible'] !== ![],
    _0x24996e = normalizeConnectionLineStyle(_0x1981b8?.['connectionLineStyle']),
    _0x1007c3 = normalizeImageToolbarLayout(_0x1981b8?.['imageToolbarLayout']),
    _0x213457 = normalizeVideoToolbarLayout(_0x1981b8?.['videoToolbarLayout']),
    _0x12af39 =
      _0x1981b8?.['alignFeatureTriggerMode'] === 'hold' ||
      _0x1981b8?.['alignFeatureTriggerMode'] === 'click' ||
      _0x1981b8?.['alignFeatureTriggerMode'] === 'off'
        ? _0x1981b8['alignFeatureTriggerMode']
        : _0x1981b8?.['alignFeatureEnabled'] === ![]
          ? 'off'
          : 'click',
    _0x3c01f5 = _0x12af39 !== 'off',
    _0x36a4e8 = Number(_0x1981b8?.['alignDistributeGap']),
    _0x4e2112 = Number['isFinite'](_0x36a4e8)
      ? Math['max'](0x0, Math['min'](0xc8, Math['round'](_0x36a4e8)))
      : 0x28,
    _0x3f6ffe = _0x1981b8?.['snapGuidesEnabled'] !== ![],
    _0x1fefb1 = sanitizeFeatureSelectionsRecord(_0x1981b8?.['featureSelections'] || {});
  (safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, '0'),
    safeStorageSet(SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY, _0x5bc241 ? '1' : '0'),
    safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, _0x47712b ? '1' : '0'),
    safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, _0x1b668c ? '1' : '0'),
    safeStorageSet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, _0x1e7094),
    safeStorageSet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, _0x517092 ? '1' : '0'),
    safeStorageSet(PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY, _0x4b4660 ? '1' : '0'),
    safeStorageSet(VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY, _0x4a217b ? '1' : '0'),
    safeStorageSet(CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY, _0x3e60f2),
    safeStorageSet(NODE_MANAGER_PLACEMENT_STORAGE_KEY, _0x24cbbf),
    safeStorageSet(LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY, _0x337339 ? '1' : '0'),
    safeStorageSet(BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY, _0x13f789 ? '1' : '0'),
    safeStorageSet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, _0x14ccf4 ? '1' : '0'),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, _0x383cac ? '1' : '0'),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, _0x3765cb),
    safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, _0x36b437 ? '1' : '0'),
    safeStorageSet(CONNECTION_LINE_STYLE_STORAGE_KEY, _0x24996e),
    safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, serializeImageToolbarLayout(_0x1007c3)),
    safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, serializeVideoToolbarLayout(_0x213457)),
    safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, _0x3c01f5 ? '1' : '0'),
    safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, _0x12af39),
    safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(_0x4e2112)),
    safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, _0x3f6ffe ? '1' : '0'),
    safeStorageSet(FEATURE_SELECTIONS_STORAGE_KEY, JSON['stringify'](_0x1fefb1)));
}
function isViewportAnimating() {
  return readViewportInteractionState()['isViewportBusy'];
}
export function shouldBumpViewportPersistOnZoom() {
  return !isViewportAnimating();
}
function resolveStoreBundle(_0x1ddf72) {
  if (!_0x1ddf72 || typeof _0x1ddf72 !== 'object') return { uiStore: null, graphStore: null };
  if (_0x1ddf72['uiStore'] && _0x1ddf72['graphStore'])
    return { uiStore: _0x1ddf72['uiStore'], graphStore: _0x1ddf72['graphStore'] };
  if (typeof _0x1ddf72['getDomainStores'] === 'function') {
    const _0x3d3dc4 = _0x1ddf72['getDomainStores']() || {};
    if (_0x3d3dc4['uiStore'] && _0x3d3dc4['graphStore'])
      return { uiStore: _0x3d3dc4['uiStore'], graphStore: _0x3d3dc4['graphStore'] };
  }
  return { uiStore: _0x1ddf72, graphStore: _0x1ddf72 };
}
export function initStoreRuntimeEffects(_0x3d9912) {
  const { uiStore: _0x503c83, graphStore: _0x9d262e } = resolveStoreBundle(_0x3d9912);
  if (!_0x503c83 || !_0x9d262e) return () => {};
  const _0x495614 = applyStoredThemeToDom(),
    _0x439732 = readUiPrefsFromStorage();
  (_0x503c83['initTheme'](_0x495614),
    _0x503c83['initUiPrefs'](_0x439732),
    _0x9d262e['setViewportPersistPolicy'](shouldBumpViewportPersistOnZoom));
  const _0x3cae09 = _0x503c83['subscribeSelector'](
    (_0x3625e9) => _0x3625e9['theme'],
    (_0x920186) => {
      const _0x464abc = normalizeThemeName(_0x920186);
      (applyThemeToDom(_0x464abc), persistThemeToStorage(_0x464abc));
    },
  );
  safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, '0');
  const _0x10e2f3 = _0x503c83['subscribeSelector'](
      (_0x2c82c8) => _0x2c82c8['ui']?.['showSelectionMediaProperties'] !== ![],
      (_0x2f467e) => {
        safeStorageSet(SHOW_SELECTION_MEDIA_PROPERTIES_STORAGE_KEY, _0x2f467e ? '1' : '0');
      },
    ),
    _0x16a774 = _0x503c83['subscribeSelector'](
      (_0x52cd02) => _0x52cd02['ui']?.['titleFollowsCanvasZoom'] === !![],
      (_0x401ed6) => {
        safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, _0x401ed6 ? '1' : '0');
      },
    ),
    _0x5ca8b9 = _0x503c83['subscribeSelector'](
      (_0x58d0e5) => _0x58d0e5['ui']?.['promptBoxResizeEnabled'] !== ![],
      (_0x4f53be) => {
        safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, _0x4f53be ? '1' : '0');
      },
    ),
    _0x28064a = _0x503c83['subscribeSelector'](
      (_0x14e684) => normalizePromptEnterBehavior(_0x14e684['ui']?.['promptEnterBehavior']),
      (_0x32392e) => {
        safeStorageSet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, _0x32392e);
      },
    ),
    _0x408791 = _0x503c83['subscribeSelector'](
      (_0x5b6789) => _0x5b6789['ui']?.['promptAttachmentButtonHidden'] === !![],
      (_0x598402) => {
        safeStorageSet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, _0x598402 ? '1' : '0');
      },
    ),
    _0xba3352 = _0x503c83['subscribeSelector'](
      (_0x112034) => _0x112034['ui']?.['promptPresetButtonHidden'] === !![],
      (_0x298dcb) => {
        safeStorageSet(PROMPT_PRESET_BUTTON_HIDDEN_STORAGE_KEY, _0x298dcb ? '1' : '0');
      },
    ),
    _0x4b4b48 = _0x503c83['subscribeSelector'](
      (_0x50a819) => _0x50a819['ui']?.['videoAudioDefaultEnabled'] === !![],
      (_0x476ce5) => {
        safeStorageSet(VIDEO_AUDIO_DEFAULT_ENABLED_STORAGE_KEY, _0x476ce5 ? '1' : '0');
      },
    ),
    _0x19c068 = _0x503c83['subscribeSelector'](
      (_0x39b4ce) => normalizeCanvasToolbarPlacement(_0x39b4ce['ui']?.['canvasToolbarPlacement']),
      (_0x2a3c04) => {
        safeStorageSet(CANVAS_TOOLBAR_PLACEMENT_STORAGE_KEY, _0x2a3c04);
      },
    ),
    _0x205a36 = _0x503c83['subscribeSelector'](
      (_0x516a4d) => normalizeNodeManagerPlacement(_0x516a4d['ui']?.['nodeManagerPlacement']),
      (_0x596756) => {
        safeStorageSet(NODE_MANAGER_PLACEMENT_STORAGE_KEY, _0x596756);
      },
    ),
    _0x40443f = _0x503c83['subscribeSelector'](
      (_0x5c35b8) => _0x5c35b8['ui']?.['leftSidebarAutoHideEnabled'] === !![],
      (_0xb8550b) => {
        safeStorageSet(LEFT_SIDEBAR_AUTO_HIDE_STORAGE_KEY, _0xb8550b ? '1' : '0');
      },
    ),
    _0x79636d = _0x503c83['subscribeSelector'](
      (_0x1e3efa) => _0x1e3efa['ui']?.['bottomLeftBarAutoHideEnabled'] === !![],
      (_0x287d13) => {
        safeStorageSet(BOTTOM_LEFT_BAR_AUTO_HIDE_STORAGE_KEY, _0x287d13 ? '1' : '0');
      },
    ),
    _0x40faf1 = _0x503c83['subscribeSelector'](
      (_0x8f9e6d) => _0x8f9e6d['ui']?.['imageVideoNodeResizeEnabled'] === !![],
      (_0x211681) => {
        safeStorageSet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, _0x211681 ? '1' : '0');
      },
    ),
    _0x3e7a7b = _0x503c83['subscribeSelector'](
      (_0x4dc803) => _0x4dc803['ui']?.['selectionRelatedHighlightEnabled'] !== ![],
      (_0x1e83f0) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, _0x1e83f0 ? '1' : '0');
      },
    ),
    _0x2e4558 = _0x503c83['subscribeSelector'](
      (_0x362ec4) =>
        normalizeSelectionRelatedHighlightColor(_0x362ec4['ui']?.['selectionRelatedHighlightColor']),
      (_0x3cf452) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, _0x3cf452);
      },
    ),
    _0x5b8b1c = _0x503c83['subscribeSelector'](
      (_0x47ba82) => _0x47ba82['ui']?.['connectionLinesVisible'] !== ![],
      (_0x20e586) => {
        safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, _0x20e586 ? '1' : '0');
      },
    ),
    _0x327e8a = _0x503c83['subscribeSelector'](
      (_0x1ed259) => normalizeConnectionLineStyle(_0x1ed259['ui']?.['connectionLineStyle']),
      (_0x1f6f90) => {
        safeStorageSet(CONNECTION_LINE_STYLE_STORAGE_KEY, _0x1f6f90);
      },
    ),
    _0x199197 = _0x503c83['subscribeSelector'](
      (_0x4fb732) => serializeImageToolbarLayout(_0x4fb732['ui']?.['imageToolbarLayout']),
      (_0x3b4e2e) => {
        safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, _0x3b4e2e);
      },
    ),
    _0x331161 = _0x503c83['subscribeSelector'](
      (_0xa1e5d9) => serializeVideoToolbarLayout(_0xa1e5d9['ui']?.['videoToolbarLayout']),
      (_0x46709b) => {
        safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, _0x46709b);
      },
    ),
    _0x2a1cea = _0x503c83['subscribeSelector'](
      (_0x15b3c0) => _0x15b3c0['ui']?.['alignFeatureEnabled'] !== ![],
      (_0x49ab9a) => {
        safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, _0x49ab9a ? '1' : '0');
      },
    ),
    _0x29f4e5 = _0x503c83['subscribeSelector'](
      (_0x1879f6) => {
        const _0x2ac817 = _0x1879f6['ui']?.['alignFeatureTriggerMode'];
        return _0x2ac817 === 'hold' || _0x2ac817 === 'click' || _0x2ac817 === 'off' ? _0x2ac817 : 'click';
      },
      (_0x23635e) => {
        (safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, _0x23635e),
          safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, _0x23635e === 'off' ? '0' : '1'));
      },
    ),
    _0x72bd3d = _0x503c83['subscribeSelector'](
      (_0x151580) => {
        const _0x1f30c5 = Number(_0x151580['ui']?.['alignDistributeGap']);
        return Number['isFinite'](_0x1f30c5)
          ? Math['max'](0x0, Math['min'](0xc8, Math['round'](_0x1f30c5)))
          : 0x28;
      },
      (_0x444218) => {
        safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(_0x444218));
      },
    ),
    _0x4a89d5 = _0x503c83['subscribeSelector'](
      (_0x50f048) => _0x50f048['ui']?.['snapGuidesEnabled'] !== ![],
      (_0x370906) => {
        safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, _0x370906 ? '1' : '0');
      },
    ),
    _0x5d0bba = _0x503c83['subscribeSelector'](
      (_0x1b966a) => {
        try {
          return JSON['stringify'](_0x1b966a['ui']?.['featureSelections'] || {});
        } catch {
          return '{}';
        }
      },
      (_0x1a4237) => {
        const _0x744b70 = parseJsonObject(_0x1a4237);
        safeStorageSet(
          FEATURE_SELECTIONS_STORAGE_KEY,
          JSON['stringify'](sanitizeFeatureSelectionsRecord(_0x744b70)),
        );
      },
    );
  return () => {
    (_0x3cae09?.(),
      _0x10e2f3?.(),
      _0x16a774?.(),
      _0x5ca8b9?.(),
      _0x28064a?.(),
      _0x408791?.(),
      _0xba3352?.(),
      _0x4b4b48?.(),
      _0x19c068?.(),
      _0x205a36?.(),
      _0x40443f?.(),
      _0x79636d?.(),
      _0x40faf1?.(),
      _0x3e7a7b?.(),
      _0x2e4558?.(),
      _0x5b8b1c?.(),
      _0x327e8a?.(),
      _0x199197?.(),
      _0x331161?.(),
      _0x2a1cea?.(),
      _0x29f4e5?.(),
      _0x72bd3d?.(),
      _0x4a89d5?.(),
      _0x5d0bba?.(),
      _0x9d262e['setViewportPersistPolicy'](() => !![]));
  };
}
