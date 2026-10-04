import { getShortcutLabelByAction } from './settingsShared.js';
const FONT_SIZE_MAP = { small: '16px', medium: '21px', large: '26px' },
  BASE_APP_THEMES = new Set(['dark', 'light']),
  APP_THEME_PRESET_STORAGE_KEY = 'v2-app-theme-preset',
  APP_THEME_PRESETS = new Set(['dusk', 'dawn', 'day']),
  CURSOR_SIZE_STORAGE_KEY = 'v2-cursor-style',
  CURSOR_SIZES = new Set(['small', 'medium', 'large']),
  CURSOR_ASSET_ROOT = '../images/cursors/windows11-concept-v2',
  PROMPT_ACTION_SURFACES = new Set(['transparent', 'themed']),
  THEME_REVEAL_DURATION_MS = 0x370,
  CURSOR_ROLE_MAP = {
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
function isReducedMotionPreferred() {
  try {
    return window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}
function getViewportSize() {
  const el = document?.documentElement;
  return {
    width: window?.innerWidth || el?.clientWidth || 0x400,
    height: window?.innerHeight || el?.clientHeight || 0x300,
  };
}
function resolveThemeRevealPoint(event) {
  const { width: width, height: height } = getViewportSize(),
    value = { x: width / 2, y: height / 2 },
    x = Number(event?.clientX),
    y = Number(event?.clientY);
  if (Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)) return { x: x, y: y };
  const el2 = event?.currentTarget || event?.target;
  if (typeof el2?.getBoundingClientRect === 'function') {
    const x2 = el2.getBoundingClientRect();
    return { x: x2.left + x2.width / 2, y: x2.top + x2.height / 2 };
  }
  return value;
}
function getThemeRevealRadius(item, key) {
  const { width: width2, height: height2 } = getViewportSize();
  return Math.ceil(
    Math.max(
      Math.hypot(item, key),
      Math.hypot(width2 - item, key),
      Math.hypot(item, height2 - key),
      Math.hypot(width2 - item, height2 - key),
    ),
  );
}
function runThemeRevealTransition(index, handler) {
  if (
    typeof handler !== 'function' ||
    isReducedMotionPreferred() ||
    typeof document?.startViewTransition !== 'function' ||
    typeof document?.documentElement?.animate !== 'function'
  ) {
    handler?.();
    return;
  }
  const { x: x3, y: y2 } = resolveThemeRevealPoint(index),
    el3 = document.documentElement;
  el3.classList?.add('theme-reveal-transitioning');
  const result = document.startViewTransition(() => {
      handler();
    }),
    data = () => {
      el3.classList?.remove('theme-reveal-transitioning');
    },
    options = result.ready
      ?.then(() => {
        const themeRevealRadius = getThemeRevealRadius(x3, y2),
          target = el3.animate(
            {
              clipPath: [
                'circle(0px at ' + x3 + 'px ' + y2 + 'px)',
                'circle(' + themeRevealRadius + 'px at ' + x3 + 'px ' + y2 + 'px)',
              ],
            },
            {
              duration: THEME_REVEAL_DURATION_MS,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          );
        return target.finished;
      })
      .catch(() => {});
  Promise.allSettled(
    [options, result.finished].filter((promise) => promise && typeof promise.then === 'function'),
  ).finally(data);
}
function normalizeBaseAppTheme(source) {
  return BASE_APP_THEMES.has(source) ? source : 'dark';
}
function normalizeAppThemePreset(next) {
  return APP_THEME_PRESETS.has(next) ? next : 'dusk';
}
function normalizeCursorSize(current) {
  return CURSOR_SIZES.has(current) ? current : 'small';
}
function getBaseThemeForPreset(entry) {
  return normalizeAppThemePreset(entry) === 'day' ? 'light' : 'dark';
}
function isLightCanvasPreset(record) {
  return normalizeAppThemePreset(record) !== 'dusk';
}
function getCursorThemeForPreset(payload) {
  return normalizeAppThemePreset(payload) === 'day' ? 'dark' : 'light';
}
function getCursorFallbackPreset() {
  return normalizeAppThemePreset(localStorage.getItem(APP_THEME_PRESET_STORAGE_KEY));
}
function applyCursorStyle({ size: size, preset: preset } = {}) {
  const cursorSize = normalizeCursorSize(size || localStorage.getItem(CURSOR_SIZE_STORAGE_KEY)),
    cursorThemeForPreset = getCursorThemeForPreset(preset || getCursorFallbackPreset()),
    el4 = document.documentElement;
  (Object.entries(CURSOR_ROLE_MAP).forEach(([handle, state]) => {
    el4.style.setProperty(
      handle,
      "url('" +
        CURSOR_ASSET_ROOT +
        '/' +
        cursorThemeForPreset +
        '/' +
        state.file +
        '-' +
        cursorSize +
        ".cur'), " +
        state.fallback,
    );
  }),
    Object.entries(CURSOR_ANIMATED_ROLE_MAP).forEach(([config, scope]) => {
      el4.style.setProperty(
        config,
        "url('" + CURSOR_ASSET_ROOT + '/' + cursorThemeForPreset + '/' + scope.file + "'), " + scope.fallback,
      );
    }));
}
function getUiStoreTheme(store) {
  try {
    const input = store?.getStateRaw?.() || store?.getState?.() || {};
    return normalizeBaseAppTheme(input.theme);
  } catch {
    return 'dark';
  }
}
function getSavedAppThemePreset(output) {
  const appThemePreset = normalizeAppThemePreset(localStorage.getItem(APP_THEME_PRESET_STORAGE_KEY)),
    uiStoreTheme = getUiStoreTheme(output);
  if (getBaseThemeForPreset(appThemePreset) === uiStoreTheme) return appThemePreset;
  return uiStoreTheme === 'light' ? 'day' : 'dusk';
}
function syncAppThemeButtons(value2) {
  const appThemePreset2 = normalizeAppThemePreset(value2);
  document.querySelectorAll('.cursor-size-btn[data-app-theme]').forEach((el5) => {
    const value3 = el5.dataset.appTheme === appThemePreset2;
    (el5.classList.toggle('active', value3),
      el5.classList.remove('is-disabled'),
      el5.setAttribute('aria-disabled', 'false'),
      (el5.title = ''));
  });
}
function syncCanvasTheme(value4) {
  const el6 = document.getElementById('v2-wrap'),
    appThemePreset3 = normalizeAppThemePreset(value4),
    isLightCanvasPreset2 = isLightCanvasPreset(value4);
  document.documentElement?.classList?.toggle('is-canvas-theme-light', isLightCanvasPreset2);
  if (!el6) return;
  (el6.classList.toggle('theme-light', isLightCanvasPreset2),
    APP_THEME_PRESETS.forEach((item2) => {
      el6.classList.toggle('canvas-theme-' + item2, item2 === appThemePreset3);
    }));
}
function normalizePromptActionSurface(value5) {
  return PROMPT_ACTION_SURFACES.has(value5) ? value5 : 'themed';
}
function applyPromptActionSurface(value6) {
  const promptActionSurface = normalizePromptActionSurface(value6);
  (localStorage.setItem('v2-prompt-action-surface', promptActionSurface),
    document.querySelectorAll('.cursor-size-btn[data-prompt-action-surface]').forEach((el7) => {
      el7.classList.toggle('active', el7.dataset.promptActionSurface === promptActionSurface);
    }),
    document.body?.classList.toggle('prompt-action-surface-themed', promptActionSurface === 'themed'));
  const el8 = document.getElementById('v2-wrap');
  if (!el8) return;
  el8.classList.toggle('prompt-action-surface-themed', promptActionSurface === 'themed');
}
export function initApplicationTheme({ uiStore: uiStore } = {}) {
  let preset2 = getSavedAppThemePreset(uiStore);
  const run = (value7 = preset2) => syncAppThemeButtons(value7),
    handler2 = (value8 = preset2) => {
      ((preset2 = normalizeAppThemePreset(value8)),
        localStorage.setItem(APP_THEME_PRESET_STORAGE_KEY, preset2),
        run(preset2),
        syncCanvasTheme(preset2),
        applyCursorStyle({ preset: preset2 }));
    },
    handler3 = (value9) => {
      const appThemePreset4 = normalizeAppThemePreset(value9);
      handler2(appThemePreset4);
      const baseThemeForPreset = getBaseThemeForPreset(appThemePreset4);
      typeof uiStore?.setTheme === 'function' &&
        baseThemeForPreset !== getUiStoreTheme(uiStore) &&
        uiStore.setTheme(baseThemeForPreset);
    };
  (handler2(),
    document.querySelectorAll('.cursor-size-btn[data-app-theme]').forEach((el9) => {
      el9.addEventListener('click', (value10) => {
        const appThemePreset5 = normalizeAppThemePreset(el9.dataset.appTheme);
        if (appThemePreset5 === preset2) {
          handler3(appThemePreset5);
          return;
        }
        runThemeRevealTransition(value10, () => handler3(appThemePreset5));
      });
    }),
    typeof uiStore?.subscribeSelector === 'function' &&
      uiStore.subscribeSelector(
        (value11) => value11.theme,
        (value12) => {
          const baseAppTheme = normalizeBaseAppTheme(value12);
          if (getBaseThemeForPreset(preset2) !== baseAppTheme) {
            handler2(baseAppTheme === 'light' ? 'day' : 'dusk');
            return;
          }
          handler2(preset2);
        },
      ),
    window.addEventListener?.('aicanvas:runtime-info', () => run()));
}
export function applyGridDotsPref(enabled) {
  const el10 = document.getElementById('v2-wrap');
  if (!el10) return;
  el10.classList.toggle('has-grid-dots', !!enabled);
}
export function readGridDotsPref() {
  const value13 = localStorage.getItem('v2-grid-dots');
  if (value13 != null) return value13 === 'true' || value13 === '1';
  const value14 = localStorage.getItem('v2-snap-grid') === 'true';
  return (localStorage.setItem('v2-grid-dots', value14 ? 'true' : 'false'), value14);
}
export function setGridDotsPref(value15) {
  const enabled2 = value15 !== false;
  (localStorage.setItem('v2-grid-dots', enabled2 ? 'true' : 'false'), applyGridDotsPref(enabled2));
  const el11 = document.getElementById('btnGridDotsOn'),
    el12 = document.getElementById('btnGridDotsOff');
  if (el11) el11.classList.toggle('active', enabled2);
  if (el12) el12.classList.toggle('active', !enabled2);
  return enabled2;
}
export function applyGridDotsPrefFromStorage() {
  applyGridDotsPref(readGridDotsPref());
}
function initCursorSettings() {
  const run2 = (value16) => {
      const size2 = normalizeCursorSize(value16);
      (localStorage.setItem(CURSOR_SIZE_STORAGE_KEY, size2),
        document.querySelectorAll('.cursor-size-btn[data-size]').forEach((el13) => {
          el13.classList.toggle('active', el13.dataset.size === size2);
        }),
        applyCursorStyle({ size: size2 }));
    },
    value17 = localStorage.getItem(CURSOR_SIZE_STORAGE_KEY) || 'small';
  (run2(value17),
    document.querySelectorAll('.cursor-size-btn[data-size]').forEach((el14) => {
      el14.addEventListener('click', () => run2(el14.dataset.size));
    }));
}
function initPromptActionSurface() {
  const promptActionSurface2 = normalizePromptActionSurface(localStorage.getItem('v2-prompt-action-surface'));
  (applyPromptActionSurface(promptActionSurface2),
    document.querySelectorAll('.cursor-size-btn[data-prompt-action-surface]').forEach((el15) => {
      el15.addEventListener('click', () => applyPromptActionSurface(el15.dataset.promptActionSurface));
    }));
}
function initGridDots() {
  const el16 = document.getElementById('btnGridDotsOn'),
    el17 = document.getElementById('btnGridDotsOff'),
    el18 = document.getElementById('gridDotsShortcutLabel');
  if (!el16 || !el17) return;
  const run3 = () => {
    if (!el18) return;
    el18.textContent = getShortcutLabelByAction('grid-dots', '.');
  };
  (setGridDotsPref(readGridDotsPref()),
    run3(),
    el16.addEventListener('click', () => setGridDotsPref(true)),
    el17.addEventListener('click', () => setGridDotsPref(false)),
    window.addEventListener('shortcuts-updated', run3));
}
function initFontSize() {
  const run4 = (value18) => {
      if (!FONT_SIZE_MAP[value18]) value18 = 'small';
      (localStorage.setItem('v2-input-font-size', value18),
        document.querySelectorAll('.cursor-size-btn[data-fontsize]').forEach((el19) => {
          el19.classList.toggle('active', el19.dataset.fontsize === value18);
        }),
        document.documentElement.style.setProperty('--prompt-font-size', FONT_SIZE_MAP[value18]));
    },
    value19 = localStorage.getItem('v2-input-font-size') || 'small';
  (run4(value19),
    document.querySelectorAll('.cursor-size-btn[data-fontsize]').forEach((el20) => {
      el20.addEventListener('click', () => run4(el20.dataset.fontsize));
    }));
}
export function initAppearanceSettings(uiStore2 = {}) {
  (initApplicationTheme({ uiStore: uiStore2.uiStore }),
    initCursorSettings(),
    initPromptActionSurface(),
    initGridDots(),
    initFontSize());
}
