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
const THEME_STORAGE_KEY = 'ai-canvas-theme',
  SHOW_VIDEO_META_STORAGE_KEY = 'v2-show-video-meta',
  TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY = 'v2-title-follows-canvas-zoom',
  PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY = 'v2-prompt-box-resize-enabled',
  PROMPT_ENTER_BEHAVIOR_STORAGE_KEY = 'v2-prompt-enter-behavior',
  PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY = 'v2-prompt-attachment-button-hidden',
  IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY = 'v2-image-video-node-resize-enabled',
  SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY = 'v2-selection-related-highlight-enabled',
  SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY = 'v2-selection-related-highlight-color',
  CONNECTION_LINES_VISIBLE_STORAGE_KEY = 'v2-connection-lines-visible',
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
function safeStorageGet(_0x3992eb, _0x5b22e9 = '') {
  const _0x49cceb = getStorage();
  if (!_0x49cceb) return _0x5b22e9;
  try {
    const _0x32629c = _0x49cceb.getItem(_0x3992eb);
    return _0x32629c == null ? _0x5b22e9 : _0x32629c;
  } catch {
    return _0x5b22e9;
  }
}
function safeStorageSet(_0x19b155, _0x3b9f81) {
  const _0x7c26e6 = getStorage();
  if (!_0x7c26e6) return;
  try {
    _0x7c26e6.setItem(_0x19b155, String(_0x3b9f81));
  } catch {}
}
function parseJsonObject(_0x4eb018) {
  if (!_0x4eb018) return {};
  try {
    const _0x26441f = JSON.parse(_0x4eb018);
    return _0x26441f && typeof _0x26441f === 'object' && !Array.isArray(_0x26441f) ? _0x26441f : {};
  } catch {
    return {};
  }
}
function normalizeSelectionRelatedHighlightColor(_0x37b1ca) {
  const _0x13e935 = String(_0x37b1ca || '').trim();
  return ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow'].includes(_0x13e935)
    ? _0x13e935
    : 'white';
}
function normalizePromptEnterBehavior(_0xafa1f0) {
  return _0xafa1f0 === 'newline' ? 'newline' : 'submit';
}
export function normalizeThemeName(_0x3f806c) {
  return _0x3f806c === 'light' ? 'light' : 'dark';
}
export function readThemeFromStorage() {
  return normalizeThemeName(safeStorageGet(THEME_STORAGE_KEY, 'dark'));
}
export function applyThemeToDom(_0x17dca7) {
  const _0x19b830 = normalizeThemeName(_0x17dca7);
  try {
    const _0x34d670 = typeof document !== 'undefined' ? document?.documentElement : null;
    _0x34d670 &&
      typeof _0x34d670.setAttribute === 'function' &&
      _0x34d670.setAttribute('data-theme', _0x19b830);
  } catch {}
}
export function persistThemeToStorage(_0x488ab5) {
  safeStorageSet(THEME_STORAGE_KEY, normalizeThemeName(_0x488ab5));
}
export function readUiPrefsFromStorage() {
  const _0x3e75d5 = safeStorageGet(SHOW_VIDEO_META_STORAGE_KEY, '0'),
    _0x54c3ff = safeStorageGet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, '0'),
    _0x3f6ea9 = safeStorageGet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, '1'),
    _0x4485db = safeStorageGet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, 'submit'),
    _0x17f17e = safeStorageGet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, '0'),
    _0xbba216 = safeStorageGet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, '0'),
    _0x501205 = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, '1'),
    _0x2d05fe = safeStorageGet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, 'white'),
    _0x152864 = safeStorageGet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, '1'),
    _0x108df8 = safeStorageGet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, ''),
    _0x5baeb4 = safeStorageGet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, ''),
    _0x2c113b = safeStorageGet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, '1'),
    _0x4fa50b = safeStorageGet(ALIGN_TRIGGER_MODE_STORAGE_KEY, ''),
    _0x5e6293 = safeStorageGet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, '40'),
    _0x282016 = safeStorageGet(SNAP_GUIDES_ENABLED_STORAGE_KEY, '1'),
    _0x1a8297 = safeStorageGet(FEATURE_SELECTIONS_STORAGE_KEY, '{}'),
    _0x2691e9 =
      _0x4fa50b === 'hold' || _0x4fa50b === 'click' || _0x4fa50b === 'off'
        ? _0x4fa50b
        : String(_0x2c113b) === '0'
          ? 'off'
          : 'click',
    _0x308861 = Number(_0x5e6293),
    _0x33cfc0 = Number.isFinite(_0x308861) ? Math.max(0, Math.min(200, Math.round(_0x308861))) : 40;
  return {
    showVideoMeta: String(_0x3e75d5) === '1',
    titleFollowsCanvasZoom: String(_0x54c3ff) === '1',
    promptBoxResizeEnabled: String(_0x3f6ea9) !== '0',
    promptEnterBehavior: normalizePromptEnterBehavior(_0x4485db),
    promptAttachmentButtonHidden: String(_0x17f17e) === '1',
    imageVideoNodeResizeEnabled: String(_0xbba216) === '1',
    selectionRelatedHighlightEnabled: String(_0x501205) !== '0',
    selectionRelatedHighlightColor: normalizeSelectionRelatedHighlightColor(_0x2d05fe),
    connectionLinesVisible: String(_0x152864) !== '0',
    imageToolbarLayout: normalizeImageToolbarLayout(parseJsonObject(_0x108df8)),
    videoToolbarLayout: normalizeVideoToolbarLayout(parseJsonObject(_0x5baeb4)),
    alignFeatureEnabled: _0x2691e9 !== 'off',
    alignFeatureTriggerMode: _0x2691e9,
    alignDistributeGap: _0x33cfc0,
    snapGuidesEnabled: String(_0x282016) !== '0',
    featureSelections: sanitizeFeatureSelectionsRecord(parseJsonObject(_0x1a8297)),
  };
}
export function persistUiPrefsToStorage(_0x2c17dd) {
  const _0xbf965c = _0x2c17dd?.showVideoMeta === true,
    _0x41e556 = _0x2c17dd?.titleFollowsCanvasZoom === true,
    _0xe87bbe = _0x2c17dd?.promptBoxResizeEnabled !== false,
    _0x371531 = normalizePromptEnterBehavior(_0x2c17dd?.promptEnterBehavior),
    _0x22e35e = _0x2c17dd?.promptAttachmentButtonHidden === true,
    _0x4b1df0 = _0x2c17dd?.imageVideoNodeResizeEnabled === true,
    _0x293565 = _0x2c17dd?.selectionRelatedHighlightEnabled !== false,
    _0x1881f2 = normalizeSelectionRelatedHighlightColor(_0x2c17dd?.selectionRelatedHighlightColor),
    _0x198a9a = _0x2c17dd?.connectionLinesVisible !== false,
    _0x53362a = normalizeImageToolbarLayout(_0x2c17dd?.imageToolbarLayout),
    _0x1cdaba = normalizeVideoToolbarLayout(_0x2c17dd?.videoToolbarLayout),
    _0x474474 =
      _0x2c17dd?.alignFeatureTriggerMode === 'hold' ||
      _0x2c17dd?.alignFeatureTriggerMode === 'click' ||
      _0x2c17dd?.alignFeatureTriggerMode === 'off'
        ? _0x2c17dd.alignFeatureTriggerMode
        : _0x2c17dd?.alignFeatureEnabled === false
          ? 'off'
          : 'click',
    _0x5bf100 = _0x474474 !== 'off',
    _0x3af60d = Number(_0x2c17dd?.alignDistributeGap),
    _0x607a4f = Number.isFinite(_0x3af60d) ? Math.max(0, Math.min(200, Math.round(_0x3af60d))) : 40,
    _0x50be6c = _0x2c17dd?.snapGuidesEnabled !== false,
    _0x5f094f = sanitizeFeatureSelectionsRecord(_0x2c17dd?.featureSelections || {});
  (safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, _0xbf965c ? '1' : '0'),
    safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, _0x41e556 ? '1' : '0'),
    safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, _0xe87bbe ? '1' : '0'),
    safeStorageSet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, _0x371531),
    safeStorageSet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, _0x22e35e ? '1' : '0'),
    safeStorageSet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, _0x4b1df0 ? '1' : '0'),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, _0x293565 ? '1' : '0'),
    safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, _0x1881f2),
    safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, _0x198a9a ? '1' : '0'),
    safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, serializeImageToolbarLayout(_0x53362a)),
    safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, serializeVideoToolbarLayout(_0x1cdaba)),
    safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, _0x5bf100 ? '1' : '0'),
    safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, _0x474474),
    safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(_0x607a4f)),
    safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, _0x50be6c ? '1' : '0'),
    safeStorageSet(FEATURE_SELECTIONS_STORAGE_KEY, JSON.stringify(_0x5f094f)));
}
function isViewportAnimating() {
  try {
    const _0x3826ba = typeof document !== 'undefined' ? document?.body : null;
    if (!_0x3826ba?.classList) return false;
    return (
      _0x3826ba.classList.contains('is-panning') ||
      _0x3826ba.classList.contains('is-viewport-animating') ||
      _0x3826ba.classList.contains('is-zooming')
    );
  } catch {
    return false;
  }
}
export function shouldBumpViewportPersistOnZoom() {
  return !isViewportAnimating();
}
function resolveStoreBundle(_0xb0e2fa) {
  if (!_0xb0e2fa || typeof _0xb0e2fa !== 'object') return { uiStore: null, graphStore: null };
  if (_0xb0e2fa.uiStore && _0xb0e2fa.graphStore)
    return { uiStore: _0xb0e2fa.uiStore, graphStore: _0xb0e2fa.graphStore };
  if (typeof _0xb0e2fa.getDomainStores === 'function') {
    const _0x1e407d = _0xb0e2fa.getDomainStores() || {};
    if (_0x1e407d.uiStore && _0x1e407d.graphStore)
      return { uiStore: _0x1e407d.uiStore, graphStore: _0x1e407d.graphStore };
  }
  return { uiStore: _0xb0e2fa, graphStore: _0xb0e2fa };
}
export function initStoreRuntimeEffects(_0x11649d) {
  const { uiStore: _0x2c424d, graphStore: _0x31e291 } = resolveStoreBundle(_0x11649d);
  if (!_0x2c424d || !_0x31e291) return () => {};
  const _0x2b6cfb = readThemeFromStorage(),
    _0x4eff59 = readUiPrefsFromStorage();
  (_0x2c424d.initTheme(_0x2b6cfb),
    _0x2c424d.initUiPrefs(_0x4eff59),
    applyThemeToDom(_0x2b6cfb),
    _0x31e291.setViewportPersistPolicy(shouldBumpViewportPersistOnZoom));
  const _0x45dab1 = _0x2c424d.subscribeSelector(
      (_0x14d5ba) => _0x14d5ba.theme,
      (_0x4ccabe) => {
        const _0x147082 = normalizeThemeName(_0x4ccabe);
        (applyThemeToDom(_0x147082), persistThemeToStorage(_0x147082));
      },
    ),
    _0x2029b5 = _0x2c424d.subscribeSelector(
      (_0x3fb8ca) => _0x3fb8ca.ui?.showVideoMeta === true,
      (_0x22d96b) => {
        safeStorageSet(SHOW_VIDEO_META_STORAGE_KEY, _0x22d96b ? '1' : '0');
      },
    ),
    _0x5b3c37 = _0x2c424d.subscribeSelector(
      (_0xc98617) => _0xc98617.ui?.titleFollowsCanvasZoom === true,
      (_0x4a6be4) => {
        safeStorageSet(TITLE_FOLLOWS_CANVAS_ZOOM_STORAGE_KEY, _0x4a6be4 ? '1' : '0');
      },
    ),
    _0x2a58f3 = _0x2c424d.subscribeSelector(
      (_0x104c19) => _0x104c19.ui?.promptBoxResizeEnabled !== false,
      (_0x100d5d) => {
        safeStorageSet(PROMPT_BOX_RESIZE_ENABLED_STORAGE_KEY, _0x100d5d ? '1' : '0');
      },
    ),
    _0x10a8cc = _0x2c424d.subscribeSelector(
      (_0x5d2093) => normalizePromptEnterBehavior(_0x5d2093.ui?.promptEnterBehavior),
      (_0x1e147a) => {
        safeStorageSet(PROMPT_ENTER_BEHAVIOR_STORAGE_KEY, _0x1e147a);
      },
    ),
    _0x2f8cd5 = _0x2c424d.subscribeSelector(
      (_0x4d5d86) => _0x4d5d86.ui?.promptAttachmentButtonHidden === true,
      (_0x4766f5) => {
        safeStorageSet(PROMPT_ATTACHMENT_BUTTON_HIDDEN_STORAGE_KEY, _0x4766f5 ? '1' : '0');
      },
    ),
    _0x44d033 = _0x2c424d.subscribeSelector(
      (_0xae7c9f) => _0xae7c9f.ui?.imageVideoNodeResizeEnabled === true,
      (_0x192262) => {
        safeStorageSet(IMAGE_VIDEO_NODE_RESIZE_ENABLED_STORAGE_KEY, _0x192262 ? '1' : '0');
      },
    ),
    _0x3f7868 = _0x2c424d.subscribeSelector(
      (_0x4a5892) => _0x4a5892.ui?.selectionRelatedHighlightEnabled !== false,
      (_0x39f4e9) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_ENABLED_STORAGE_KEY, _0x39f4e9 ? '1' : '0');
      },
    ),
    _0xdb46 = _0x2c424d.subscribeSelector(
      (_0x1dacbf) => normalizeSelectionRelatedHighlightColor(_0x1dacbf.ui?.selectionRelatedHighlightColor),
      (_0x39b84e) => {
        safeStorageSet(SELECTION_RELATED_HIGHLIGHT_COLOR_STORAGE_KEY, _0x39b84e);
      },
    ),
    _0x2fb96a = _0x2c424d.subscribeSelector(
      (_0x1f1080) => _0x1f1080.ui?.connectionLinesVisible !== false,
      (_0x5904e2) => {
        safeStorageSet(CONNECTION_LINES_VISIBLE_STORAGE_KEY, _0x5904e2 ? '1' : '0');
      },
    ),
    _0x54e9eb = _0x2c424d.subscribeSelector(
      (_0x4eecd6) => serializeImageToolbarLayout(_0x4eecd6.ui?.imageToolbarLayout),
      (_0x228b2e) => {
        safeStorageSet(IMAGE_TOOLBAR_LAYOUT_STORAGE_KEY, _0x228b2e);
      },
    ),
    _0x48e663 = _0x2c424d.subscribeSelector(
      (_0x3aae2b) => serializeVideoToolbarLayout(_0x3aae2b.ui?.videoToolbarLayout),
      (_0x54d3de) => {
        safeStorageSet(VIDEO_TOOLBAR_LAYOUT_STORAGE_KEY, _0x54d3de);
      },
    ),
    _0x3052fb = _0x2c424d.subscribeSelector(
      (_0x1bca86) => _0x1bca86.ui?.alignFeatureEnabled !== false,
      (_0x79cf0a) => {
        safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, _0x79cf0a ? '1' : '0');
      },
    ),
    _0x35fce7 = _0x2c424d.subscribeSelector(
      (_0x3007c8) => {
        const _0x49c541 = _0x3007c8.ui?.alignFeatureTriggerMode;
        return _0x49c541 === 'hold' || _0x49c541 === 'click' || _0x49c541 === 'off' ? _0x49c541 : 'click';
      },
      (_0x279eea) => {
        (safeStorageSet(ALIGN_TRIGGER_MODE_STORAGE_KEY, _0x279eea),
          safeStorageSet(ALIGN_FEATURE_ENABLED_STORAGE_KEY, _0x279eea === 'off' ? '0' : '1'));
      },
    ),
    _0x1eb07b = _0x2c424d.subscribeSelector(
      (_0x4ab4c2) => {
        const _0xda83fa = Number(_0x4ab4c2.ui?.alignDistributeGap);
        return Number.isFinite(_0xda83fa) ? Math.max(0, Math.min(200, Math.round(_0xda83fa))) : 40;
      },
      (_0x1633d0) => {
        safeStorageSet(ALIGN_DISTRIBUTE_GAP_STORAGE_KEY, String(_0x1633d0));
      },
    ),
    _0x432457 = _0x2c424d.subscribeSelector(
      (_0x22377d) => _0x22377d.ui?.snapGuidesEnabled !== false,
      (_0x50e6bd) => {
        safeStorageSet(SNAP_GUIDES_ENABLED_STORAGE_KEY, _0x50e6bd ? '1' : '0');
      },
    ),
    _0x5408ce = _0x2c424d.subscribeSelector(
      (_0x970958) => {
        try {
          return JSON.stringify(_0x970958.ui?.featureSelections || {});
        } catch {
          return '{}';
        }
      },
      (_0xaf4f85) => {
        const _0x4524e9 = parseJsonObject(_0xaf4f85);
        safeStorageSet(
          FEATURE_SELECTIONS_STORAGE_KEY,
          JSON.stringify(sanitizeFeatureSelectionsRecord(_0x4524e9)),
        );
      },
    );
  return () => {
    (_0x45dab1?.(),
      _0x2029b5?.(),
      _0x5b3c37?.(),
      _0x2a58f3?.(),
      _0x10a8cc?.(),
      _0x2f8cd5?.(),
      _0x44d033?.(),
      _0x3f7868?.(),
      _0xdb46?.(),
      _0x2fb96a?.(),
      _0x54e9eb?.(),
      _0x48e663?.(),
      _0x3052fb?.(),
      _0x35fce7?.(),
      _0x1eb07b?.(),
      _0x432457?.(),
      _0x5408ce?.(),
      _0x31e291.setViewportPersistPolicy(() => true));
  };
}
