import { getShortcutLabelByAction } from './settingsShared.js';
import { runCircularRevealTransition } from '../../utils/circularRevealTransition.js';
import { resolveRendererVirtualizationTier } from '../../core/rendererVirtualization.js';
import { t } from '../../i18n/index.js';
import { initViewportCursor } from '../viewportCursor.js';
import {
  CANVAS_TOOLBAR_PLACEMENT_EVENT,
  normalizeCanvasToolbarPlacement,
} from '../canvasToolbarPlacement.js';
const FONT_SIZE_MAP = { small: '16px', medium: '21px', large: '26px' },
  BASE_APP_THEMES = new Set(['dark', 'light']),
  APP_THEME_PRESET_STORAGE_KEY = 'v2-app-theme-preset',
  APP_THEME_PRESETS = new Set(['dusk', 'dawn', 'day']),
  CURSOR_SIZE_STORAGE_KEY = 'v2-cursor-style',
  CURSOR_SIZES = new Set(['small', 'medium', 'large']),
  CURSOR_ASSET_PATH = './images/cursors/windows11-concept-v2/',
  CURSOR_ASSET_FALLBACK_ROOT = '../images/cursors/windows11-concept-v2',
  PROMPT_ACTION_SURFACES = new Set(['transparent', 'themed']),
  LEFT_SIDEBAR_KEYBOARD_FOCUS_CLASS = 'left-sidebar-keyboard-focus',
  LEFT_SIDEBAR_REVEAL_GUARD_CLASS = 'left-sidebar-auto-hide-revealing',
  LEFT_SIDEBAR_REVEAL_GUARD_MS = 360;
let leftSidebarAutoHideFocusModeDocument = null,
  leftSidebarRevealGuardTimer = 0;
const CURSOR_ROLE_MAP = {
    '--pointer-cursor': { file: 'pointer', fallback: 'default' },
    '--link-cursor': { file: 'link', fallback: 'pointer' },
    '--grab-cursor': { file: 'move', fallback: 'grab' },
    '--grabbing-cursor': { file: 'move', fallback: 'grabbing' },
    '--text-cursor': { file: 'beam', fallback: 'text' },
    '--precision-cursor': { file: 'precision', fallback: 'crosshair' },
    '--move-cursor': { file: 'move', fallback: 'move' },
    '--help-cursor': { file: 'help', fallback: 'help' },
    '--unavailable-cursor': { file: 'unavailable', fallback: 'not-allowed' },
    '--resize-ns-cursor': { file: 'vert', fallback: 'ns-resize' },
    '--resize-ew-cursor': { file: 'horz', fallback: 'ew-resize' },
    '--resize-nwse-cursor': { file: 'dgn1', fallback: 'nwse-resize' },
    '--resize-nesw-cursor': { file: 'dgn2', fallback: 'nesw-resize' },
    '--alternate-cursor': { file: 'alternate', fallback: 'default' },
    '--handwriting-cursor': { file: 'handwriting', fallback: 'default' },
    '--pin-cursor': { file: 'pin', fallback: 'pointer' },
    '--person-cursor': { file: 'person', fallback: 'pointer' },
  },
  CURSOR_ANIMATED_ROLE_MAP = {
    '--wait-cursor': { file: 'busy.ani', fallback: 'wait' },
    '--progress-cursor': { file: 'working.ani', fallback: 'progress' },
  };
function shouldBypassThemeRevealTransition(value) {
  let viewport = null;
  try {
    viewport = value?.() || null;
  } catch {
    viewport = null;
  }
  return (
    resolveRendererVirtualizationTier({
      viewport: viewport?.viewport,
      nodeCount: viewport?.nodeCount,
    }) === 'very-dense-low-zoom'
  );
}
function runThemeRevealTransition(
  event,
  apply,
  { getCanvasPresentationContext: getCanvasPresentationContext = null } = {},
) {
  if (shouldBypassThemeRevealTransition(getCanvasPresentationContext)) return (apply(), null);
  return runCircularRevealTransition({
    event: event,
    apply: apply,
    rootClassName: 'theme-reveal-transitioning',
  });
}
function normalizeBaseAppTheme(item) {
  return BASE_APP_THEMES.has(item) ? item : 'dark';
}
function normalizeAppThemePreset(key) {
  return APP_THEME_PRESETS.has(key) ? key : 'dusk';
}
function normalizeCursorSize(index) {
  return CURSOR_SIZES.has(index) ? index : 'small';
}
function getBaseThemeForPreset(result) {
  return normalizeAppThemePreset(result) === 'day' ? 'light' : 'dark';
}
function isLightCanvasPreset(data) {
  return normalizeAppThemePreset(data) !== 'dusk';
}
function getCursorThemeForPreset(options) {
  return normalizeAppThemePreset(options) === 'day' ? 'dark' : 'light';
}
function getCursorFallbackPreset() {
  return normalizeAppThemePreset(localStorage.getItem(APP_THEME_PRESET_STORAGE_KEY));
}
function resolveCursorAssetRoot() {
  const enabled = String(globalThis.document?.baseURI || '').trim();
  if (!enabled) return CURSOR_ASSET_FALLBACK_ROOT;
  try {
    return new URL(CURSOR_ASSET_PATH, enabled).href.replace(/\/$/, '');
  } catch {
    return CURSOR_ASSET_FALLBACK_ROOT;
  }
}
function applyCursorStyle({ size: size, preset: preset } = {}) {
  const cursorSize = normalizeCursorSize(size || localStorage.getItem(CURSOR_SIZE_STORAGE_KEY)),
    cursorThemeForPreset = getCursorThemeForPreset(preset || getCursorFallbackPreset()),
    cursorAssetRoot = resolveCursorAssetRoot(),
    el = document.documentElement;
  (Object.entries(CURSOR_ROLE_MAP).forEach(([target, source]) => {
    const list = cursorSize === 'small' ? [cursorSize] : [cursorSize, 'small'],
      next = list.map(
        (current) =>
          "url('" + cursorAssetRoot + '/' + cursorThemeForPreset + '/' + source.file + '-' + current + ".cur')",
      );
    if (target === '--pointer-cursor')
      el.style.setProperty('--pointer-cursor-image', next[0]);
    el.style.setProperty(
      target,
      [
        next[0],
        ...(next[1] ? ['var(--viewport-edge-cursor, ' + next[1] + ')'] : []),
        source.fallback,
      ].join(', '),
    );
  }),
    Object.entries(CURSOR_ANIMATED_ROLE_MAP).forEach(([entry, record]) => {
      el.style.setProperty(
        entry,
        "url('" + cursorAssetRoot + '/' + cursorThemeForPreset + '/' + record.file + "'), " + record.fallback,
      );
    }),
    initViewportCursor()?.preload(
      cursorSize === 'small'
        ? []
        : Object.keys(CURSOR_ROLE_MAP).map((payload) =>
            el.style.getPropertyValue(payload),
          ),
    ));
}
function getUiStoreTheme(store) {
  try {
    const handle = store?.getStateRaw?.() || store?.getState?.() || {};
    return normalizeBaseAppTheme(handle.theme);
  } catch {
    return 'dark';
  }
}
function getSavedAppThemePreset(state) {
  const appThemePreset = normalizeAppThemePreset(localStorage.getItem(APP_THEME_PRESET_STORAGE_KEY)),
    uiStoreTheme = getUiStoreTheme(state);
  if (getBaseThemeForPreset(appThemePreset) === uiStoreTheme) return appThemePreset;
  return uiStoreTheme === 'light' ? 'day' : 'dusk';
}
function syncAppThemeButtons(config) {
  const appThemePreset2 = normalizeAppThemePreset(config);
  document.querySelectorAll('.cursor-size-btn[data-app-theme]').forEach((el2) => {
    const scope = el2.dataset.appTheme === appThemePreset2;
    (el2.classList.toggle('active', scope),
      el2.setAttribute('aria-pressed', String(scope)),
      el2.classList.remove('is-disabled'),
      el2.setAttribute('aria-disabled', 'false'),
      (el2.title = ''));
  });
}
function syncCanvasTheme(input) {
  const el3 = document.getElementById('v2-wrap'),
    appThemePreset3 = normalizeAppThemePreset(input),
    isLightCanvasPreset2 = isLightCanvasPreset(input);
  document.documentElement?.classList?.toggle('is-canvas-theme-light', isLightCanvasPreset2);
  if (!el3) return;
  (el3.classList.toggle('theme-light', isLightCanvasPreset2),
    APP_THEME_PRESETS.forEach((output) => {
      el3.classList.toggle('canvas-theme-' + output, output === appThemePreset3);
    }));
}
function normalizePromptActionSurface(value2) {
  return PROMPT_ACTION_SURFACES.has(value2) ? value2 : 'themed';
}
function applyPromptActionSurface(value3) {
  const promptActionSurface = normalizePromptActionSurface(value3);
  (localStorage.setItem('v2-prompt-action-surface', promptActionSurface),
    document.querySelectorAll('.cursor-size-btn[data-prompt-action-surface]').forEach((el4) => {
      (el4.classList.toggle('active', el4.dataset.promptActionSurface === promptActionSurface),
        el4.setAttribute(
          'aria-pressed',
          String(el4.dataset.promptActionSurface === promptActionSurface),
        ));
    }),
    document.body?.classList.toggle('prompt-action-surface-themed', promptActionSurface === 'themed'));
  const el5 = document.getElementById('v2-wrap');
  if (!el5) return;
  el5.classList.toggle('prompt-action-surface-themed', promptActionSurface === 'themed');
}
function getUiPrefs(store2) {
  try {
    const value4 = store2?.getStateRaw?.() || store2?.getState?.() || {};
    return value4?.ui && typeof value4.ui === 'object' ? value4.ui : {};
  } catch {
    return {};
  }
}
function syncButtonPair(value5, value6, value7) {
  const enabled2 = value7 === true;
  (document.getElementById(value5)?.classList.toggle('active', enabled2),
    document.getElementById(value6)?.classList.toggle('active', !enabled2),
    document.getElementById(value5)?.setAttribute?.('aria-pressed', String(enabled2)),
    document.getElementById(value6)?.setAttribute?.('aria-pressed', String(!enabled2)));
}
function applyCanvasToolbarPlacement(value8) {
  const placement = normalizeCanvasToolbarPlacement(value8),
    el6 = document.getElementById('v2-wrap'),
    el7 = document.querySelector?.('.sidebar-floating');
  (el6?.classList.toggle('canvas-toolbar-left', placement === 'left'),
    el6?.classList.toggle('canvas-toolbar-right', placement === 'right'),
    el6?.classList.toggle('canvas-toolbar-bottom', placement === 'bottom'),
    el7?.setAttribute('data-tooltip-placement', placement === 'bottom' ? 'top' : 'right'));
  const el8 = document.getElementById('btnCanvasToolbarPlacementLeft'),
    el9 = document.getElementById('btnCanvasToolbarPlacementRight'),
    el10 = document.getElementById('btnCanvasToolbarPlacementBottom');
  return (
    el8?.classList.toggle('active', placement === 'left'),
    el9?.classList.toggle('active', placement === 'right'),
    el10?.classList.toggle('active', placement === 'bottom'),
    el8?.setAttribute('aria-pressed', String(placement === 'left')),
    el9?.setAttribute('aria-pressed', String(placement === 'right')),
    el10?.setAttribute('aria-pressed', String(placement === 'bottom')),
    typeof window?.dispatchEvent === 'function' &&
      typeof globalThis.CustomEvent === 'function' &&
      window.dispatchEvent(
        new CustomEvent(CANVAS_TOOLBAR_PLACEMENT_EVENT, { detail: { placement: placement } }),
      ),
    placement
  );
}
function setCanvasToolbarPlacementPref(value9, value10) {
  const canvasToolbarPlacement = normalizeCanvasToolbarPlacement(value9);
  return (
    value10?.setCanvasToolbarPlacement?.(canvasToolbarPlacement),
    applyCanvasToolbarPlacement(canvasToolbarPlacement),
    canvasToolbarPlacement
  );
}
function initCanvasToolbarPlacement({ uiStore: uiStore } = {}) {
  const el11 = document.getElementById('btnCanvasToolbarPlacementLeft'),
    el12 = document.getElementById('btnCanvasToolbarPlacementRight'),
    el13 = document.getElementById('btnCanvasToolbarPlacementBottom');
  if (!el11 && !el12 && !el13) return;
  const run = (value11) => applyCanvasToolbarPlacement(value11);
  (run(getUiPrefs(uiStore).canvasToolbarPlacement),
    el11?.addEventListener('click', () => setCanvasToolbarPlacementPref('left', uiStore)),
    el12?.addEventListener('click', () => setCanvasToolbarPlacementPref('right', uiStore)),
    el13?.addEventListener('click', () => setCanvasToolbarPlacementPref('bottom', uiStore)),
    uiStore?.subscribeSelector?.(
      (value12) => normalizeCanvasToolbarPlacement(value12.ui?.canvasToolbarPlacement),
      run,
    ));
}
function syncAutoHidePinButton({
  buttonId: buttonId,
  autoHideEnabled: autoHideEnabled,
  pinKey: pinKey,
  autoHideKey: autoHideKey,
  tooltipAttribute: tooltipAttribute,
  i18nTooltipAttribute: i18nTooltipAttribute,
}) {
  const el14 = document.getElementById(buttonId);
  if (!el14) return;
  const value13 = autoHideEnabled !== true,
    value14 = value13 ? autoHideKey : pinKey,
    t2 = t(value14);
  (el14.classList.toggle('is-pinned', value13),
    el14.setAttribute('aria-pressed', String(value13)),
    el14.setAttribute('aria-label', t2),
    el14.setAttribute('data-i18n-aria-label', value14),
    el14.setAttribute(tooltipAttribute, t2),
    el14.setAttribute(i18nTooltipAttribute, value14));
}
function applyLeftSidebarAutoHidePref(value15) {
  const autoHideEnabled2 = value15 === true,
    el15 = document.getElementById('v2-wrap');
  return (
    el15?.classList.toggle('left-sidebar-auto-hide', autoHideEnabled2),
    !autoHideEnabled2 &&
      (document.body?.classList.remove(LEFT_SIDEBAR_KEYBOARD_FOCUS_CLASS),
      clearLeftSidebarRevealGuard()),
    syncButtonPair('btnLeftSidebarAutoHideOn', 'btnLeftSidebarAutoHideOff', autoHideEnabled2),
    syncAutoHidePinButton({
      buttonId: 'btnLeftSidebarPin',
      autoHideEnabled: autoHideEnabled2,
      pinKey: 'sidebar.pin',
      autoHideKey: 'sidebar.autoHide',
      tooltipAttribute: 'data-tooltip-right',
      i18nTooltipAttribute: 'data-i18n-tooltip-right',
    }),
    autoHideEnabled2
  );
}
function clearLeftSidebarRevealGuard() {
  (document.getElementById('v2-wrap')?.classList.remove(LEFT_SIDEBAR_REVEAL_GUARD_CLASS),
    leftSidebarRevealGuardTimer &&
      typeof window?.clearTimeout === 'function' &&
      window.clearTimeout(leftSidebarRevealGuardTimer),
    (leftSidebarRevealGuardTimer = 0));
}
function startLeftSidebarRevealGuard() {
  const el16 = document.getElementById('v2-wrap');
  if (!el16?.classList.contains('left-sidebar-auto-hide')) return;
  el16.classList.add(LEFT_SIDEBAR_REVEAL_GUARD_CLASS);
  leftSidebarRevealGuardTimer &&
    typeof window?.clearTimeout === 'function' &&
    window.clearTimeout(leftSidebarRevealGuardTimer);
  const value16 = window.setTimeout?.(() => {
    (el16.classList.remove(LEFT_SIDEBAR_REVEAL_GUARD_CLASS),
      leftSidebarRevealGuardTimer === value16 && (leftSidebarRevealGuardTimer = 0));
  }, LEFT_SIDEBAR_REVEAL_GUARD_MS);
  leftSidebarRevealGuardTimer = value16 || 0;
}
function initLeftSidebarAutoHideFocusMode() {
  if (leftSidebarAutoHideFocusModeDocument === document) return;
  leftSidebarAutoHideFocusModeDocument = document;
  const run2 = () => {
    document.body?.classList.remove(LEFT_SIDEBAR_KEYBOARD_FOCUS_CLASS);
  };
  (document.addEventListener?.(
    'keydown',
    (event2) => {
      if (event2?.key !== 'Tab') return;
      if (!document.getElementById('v2-wrap')?.classList.contains('left-sidebar-auto-hide')) return;
      document.body?.classList.add(LEFT_SIDEBAR_KEYBOARD_FOCUS_CLASS);
    },
    true,
  ),
    document.addEventListener?.('pointerdown', run2, true),
    document.querySelector?.('.sidebar-floating')?.addEventListener?.('focusout', () => {
      window.setTimeout?.(() => {
        !document.querySelector?.('.sidebar-floating')?.matches?.(':focus-within') && run2();
      }, 0);
    }));
  const el17 = document.querySelector?.('.left-sidebar-hover-zone');
  (el17?.addEventListener?.('pointerenter', startLeftSidebarRevealGuard),
    el17?.addEventListener?.('pointerdown', startLeftSidebarRevealGuard));
}
function applyBottomLeftBarAutoHidePref(value17) {
  const autoHideEnabled3 = value17 === true,
    el18 = document.getElementById('v2-wrap');
  return (
    el18?.classList.toggle('bottom-left-bar-auto-hide', autoHideEnabled3),
    syncButtonPair('btnBottomLeftBarAutoHideOn', 'btnBottomLeftBarAutoHideOff', autoHideEnabled3),
    syncAutoHidePinButton({
      buttonId: 'btnBottomLeftBarPin',
      autoHideEnabled: autoHideEnabled3,
      pinKey: 'canvasControls.pinBar',
      autoHideKey: 'canvasControls.autoHideBar',
      tooltipAttribute: 'data-tooltip',
      i18nTooltipAttribute: 'data-i18n-tooltip',
    }),
    autoHideEnabled3
  );
}
function setLeftSidebarAutoHidePref(value18, value19) {
  const value20 = value18 === true;
  return (
    typeof value19?.setLeftSidebarAutoHideEnabled === 'function' &&
      value19.setLeftSidebarAutoHideEnabled(value20),
    applyLeftSidebarAutoHidePref(value20),
    value20
  );
}
function setBottomLeftBarAutoHidePref(value21, value22) {
  const value23 = value21 === true;
  return (
    typeof value22?.setBottomLeftBarAutoHideEnabled === 'function' &&
      value22.setBottomLeftBarAutoHideEnabled(value23),
    applyBottomLeftBarAutoHidePref(value23),
    value23
  );
}
export function initApplicationTheme({
  uiStore: uiStore2,
  getCanvasPresentationContext: getCanvasPresentationContext = null,
} = {}) {
  let preset2 = getSavedAppThemePreset(uiStore2);
  const run3 = (value24 = preset2) => syncAppThemeButtons(value24),
    handler = (value25 = preset2) => {
      ((preset2 = normalizeAppThemePreset(value25)),
        localStorage.setItem(APP_THEME_PRESET_STORAGE_KEY, preset2),
        run3(preset2),
        syncCanvasTheme(preset2),
        applyCursorStyle({ preset: preset2 }));
    },
    handler2 = (value26) => {
      const appThemePreset4 = normalizeAppThemePreset(value26);
      handler(appThemePreset4);
      const baseThemeForPreset = getBaseThemeForPreset(appThemePreset4);
      typeof uiStore2?.setTheme === 'function' &&
        baseThemeForPreset !== getUiStoreTheme(uiStore2) &&
        uiStore2.setTheme(baseThemeForPreset);
    };
  (handler(),
    document.querySelectorAll('.cursor-size-btn[data-app-theme]').forEach((el19) => {
      el19.addEventListener('click', (value27) => {
        const appThemePreset5 = normalizeAppThemePreset(el19.dataset.appTheme);
        if (appThemePreset5 === preset2) {
          handler2(appThemePreset5);
          return;
        }
        runThemeRevealTransition(value27, () => handler2(appThemePreset5), {
          getCanvasPresentationContext: getCanvasPresentationContext,
        });
      });
    }),
    typeof uiStore2?.subscribeSelector === 'function' &&
      uiStore2.subscribeSelector(
        (value28) => value28.theme,
        (value29) => {
          const baseAppTheme = normalizeBaseAppTheme(value29);
          if (getBaseThemeForPreset(preset2) !== baseAppTheme) {
            handler(baseAppTheme === 'light' ? 'day' : 'dusk');
            return;
          }
          handler(preset2);
        },
      ),
    window.addEventListener?.('aicanvas:runtime-info', () => run3()));
}
export function applyGridDotsPref(enabled3) {
  const el20 = document.getElementById('v2-wrap');
  if (!el20) return;
  el20.classList.toggle('has-grid-dots', !!enabled3);
}
export function readGridDotsPref() {
  const value30 = localStorage.getItem('v2-grid-dots');
  if (value30 != null) return value30 === 'true' || value30 === '1';
  return (localStorage.setItem('v2-grid-dots', 'true'), true);
}
export function setGridDotsPref(value31) {
  const enabled4 = value31 !== false;
  (localStorage.setItem('v2-grid-dots', enabled4 ? 'true' : 'false'), applyGridDotsPref(enabled4));
  const el21 = document.getElementById('btnToggleDots'),
    el22 = document.getElementById('btnGridDotsOn'),
    el23 = document.getElementById('btnGridDotsOff');
  el21 &&
    (el21.classList.toggle('active', enabled4),
    el21.setAttribute('aria-pressed', enabled4 ? 'true' : 'false'));
  if (el22) el22.classList.toggle('active', enabled4);
  if (el23) el23.classList.toggle('active', !enabled4);
  return (
    el22?.setAttribute?.('aria-pressed', String(enabled4)),
    el23?.setAttribute?.('aria-pressed', String(!enabled4)),
    enabled4
  );
}
export function applyGridDotsPrefFromStorage() {
  setGridDotsPref(readGridDotsPref());
}
function initCursorSettings() {
  const run4 = (value32) => {
      const size2 = normalizeCursorSize(value32);
      (localStorage.setItem(CURSOR_SIZE_STORAGE_KEY, size2),
        document.querySelectorAll('.cursor-size-btn[data-size]').forEach((el24) => {
          (el24.classList.toggle('active', el24.dataset.size === size2),
            el24.setAttribute('aria-pressed', String(el24.dataset.size === size2)));
        }),
        applyCursorStyle({ size: size2 }));
    },
    value33 = localStorage.getItem(CURSOR_SIZE_STORAGE_KEY) || 'small';
  (run4(value33),
    document.querySelectorAll('.cursor-size-btn[data-size]').forEach((el25) => {
      el25.addEventListener('click', () => run4(el25.dataset.size));
    }));
}
function initPromptActionSurface() {
  const promptActionSurface2 = normalizePromptActionSurface(localStorage.getItem('v2-prompt-action-surface'));
  (applyPromptActionSurface(promptActionSurface2),
    document.querySelectorAll('.cursor-size-btn[data-prompt-action-surface]').forEach((el26) => {
      el26.addEventListener('click', () =>
        applyPromptActionSurface(el26.dataset.promptActionSurface),
      );
    }));
}
function initAutoHideChromeSettings({ uiStore: uiStore3 } = {}) {
  const el27 = document.getElementById('btnLeftSidebarAutoHideOn'),
    el28 = document.getElementById('btnLeftSidebarAutoHideOff'),
    el29 = document.getElementById('btnBottomLeftBarAutoHideOn'),
    el30 = document.getElementById('btnBottomLeftBarAutoHideOff'),
    el31 = document.getElementById('btnLeftSidebarPin'),
    el32 = document.getElementById('btnBottomLeftBarPin');
  if (!el27 && !el28 && !el29 && !el30 && !el31 && !el32) return;
  initLeftSidebarAutoHideFocusMode();
  const uiPrefs = getUiPrefs(uiStore3);
  let leftSidebarAutoHidePref = uiPrefs.leftSidebarAutoHideEnabled === true,
    bottomLeftBarAutoHidePref = uiPrefs.bottomLeftBarAutoHideEnabled === true;
  const run5 = (value34) => {
      leftSidebarAutoHidePref = applyLeftSidebarAutoHidePref(value34);
    },
    handler3 = (value35) => {
      bottomLeftBarAutoHidePref = applyBottomLeftBarAutoHidePref(value35);
    },
    handler4 = (value36) => {
      ((leftSidebarAutoHidePref = value36 === true), setLeftSidebarAutoHidePref(leftSidebarAutoHidePref, uiStore3));
    },
    handler5 = (value37) => {
      ((bottomLeftBarAutoHidePref = value37 === true), setBottomLeftBarAutoHidePref(bottomLeftBarAutoHidePref, uiStore3));
    },
    handler6 = (event3) => {
      if (Number(event3?.detail) > 0) event3.currentTarget?.blur?.();
    };
  (run5(leftSidebarAutoHidePref),
    handler3(bottomLeftBarAutoHidePref),
    el27?.addEventListener('click', () => handler4(true)),
    el28?.addEventListener('click', () => handler4(false)),
    el29?.addEventListener('click', () => handler5(true)),
    el30?.addEventListener('click', () => handler5(false)),
    el31?.addEventListener('click', (value38) => {
      (handler4(!leftSidebarAutoHidePref), handler6(value38));
    }),
    el32?.addEventListener('click', (value39) => {
      (handler5(!bottomLeftBarAutoHidePref), handler6(value39));
    }),
    typeof uiStore3?.subscribeSelector === 'function' &&
      (uiStore3.subscribeSelector(
        (value40) => value40.ui?.leftSidebarAutoHideEnabled === true,
        run5,
      ),
      uiStore3.subscribeSelector(
        (value41) => value41.ui?.bottomLeftBarAutoHideEnabled === true,
        handler3,
      )));
}
function initGridDots() {
  const el33 = document.getElementById('btnGridDotsOn'),
    el34 = document.getElementById('btnGridDotsOff'),
    el35 = document.getElementById('gridDotsShortcutLabel');
  if (!el33 || !el34) return;
  const run6 = () => {
    if (!el35) return;
    el35.textContent = getShortcutLabelByAction('grid-dots', '.');
  };
  (setGridDotsPref(readGridDotsPref()),
    run6(),
    el33.addEventListener('click', () => setGridDotsPref(true)),
    el34.addEventListener('click', () => setGridDotsPref(false)),
    window.addEventListener('shortcuts-updated', run6));
}
function initFontSize() {
  const run7 = (value42) => {
      if (!FONT_SIZE_MAP[value42]) value42 = 'small';
      (localStorage.setItem('v2-input-font-size', value42),
        document.querySelectorAll('.cursor-size-btn[data-fontsize]').forEach((el36) => {
          (el36.classList.toggle('active', el36.dataset.fontsize === value42),
            el36.setAttribute(
              'aria-pressed',
              String(el36.dataset.fontsize === value42),
            ));
        }),
        document.documentElement.style.setProperty('--prompt-font-size', FONT_SIZE_MAP[value42]));
    },
    value43 = localStorage.getItem('v2-input-font-size') || 'small';
  (run7(value43),
    document.querySelectorAll('.cursor-size-btn[data-fontsize]').forEach((el37) => {
      el37.addEventListener('click', () => run7(el37.dataset.fontsize));
    }));
}
export function initAppearanceSettings(uiStore4 = {}) {
  (initApplicationTheme({
    uiStore: uiStore4.uiStore,
    getCanvasPresentationContext: uiStore4.getCanvasPresentationContext,
  }),
    initCursorSettings(),
    initPromptActionSurface(),
    initCanvasToolbarPlacement({ uiStore: uiStore4.uiStore }),
    initAutoHideChromeSettings({ uiStore: uiStore4.uiStore }),
    initGridDots(),
    initFontSize());
}
