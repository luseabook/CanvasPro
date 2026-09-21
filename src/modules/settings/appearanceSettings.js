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
  const _0x39fcc4 = document?.documentElement;
  return {
    width: window?.innerWidth || _0x39fcc4?.clientWidth || 0x400,
    height: window?.innerHeight || _0x39fcc4?.clientHeight || 0x300,
  };
}
function resolveThemeRevealPoint(_0x1f4b6d) {
  const { width: _0x3a60c3, height: _0x2650b7 } = getViewportSize(),
    _0x32e6ad = { x: _0x3a60c3 / 2, y: _0x2650b7 / 2 },
    _0x57b579 = Number(_0x1f4b6d?.clientX),
    _0x181198 = Number(_0x1f4b6d?.clientY);
  if (Number.isFinite(_0x57b579) && Number.isFinite(_0x181198) && (_0x57b579 !== 0 || _0x181198 !== 0))
    return { x: _0x57b579, y: _0x181198 };
  const _0xcc7386 = _0x1f4b6d?.currentTarget || _0x1f4b6d?.target;
  if (typeof _0xcc7386?.getBoundingClientRect === 'function') {
    const _0x174beb = _0xcc7386.getBoundingClientRect();
    return { x: _0x174beb.left + _0x174beb.width / 2, y: _0x174beb.top + _0x174beb.height / 2 };
  }
  return _0x32e6ad;
}
function getThemeRevealRadius(_0x4cec59, _0x4b6df9) {
  const { width: _0x8ae3cc, height: _0x487f79 } = getViewportSize();
  return Math.ceil(
    Math.max(
      Math.hypot(_0x4cec59, _0x4b6df9),
      Math.hypot(_0x8ae3cc - _0x4cec59, _0x4b6df9),
      Math.hypot(_0x4cec59, _0x487f79 - _0x4b6df9),
      Math.hypot(_0x8ae3cc - _0x4cec59, _0x487f79 - _0x4b6df9),
    ),
  );
}
function runThemeRevealTransition(_0x5a8154, _0x4f992f) {
  if (
    typeof _0x4f992f !== 'function' ||
    isReducedMotionPreferred() ||
    typeof document?.startViewTransition !== 'function' ||
    typeof document?.documentElement?.animate !== 'function'
  ) {
    _0x4f992f?.();
    return;
  }
  const { x: _0x2bb4ab, y: _0x15cc8e } = resolveThemeRevealPoint(_0x5a8154),
    _0x519fda = document.documentElement;
  _0x519fda.classList?.add('theme-reveal-transitioning');
  const _0xb159e8 = document.startViewTransition(() => {
      _0x4f992f();
    }),
    _0xf80f4 = () => {
      _0x519fda.classList?.remove('theme-reveal-transitioning');
    },
    _0x5d14c9 = _0xb159e8.ready
      ?.then(() => {
        const _0x16e2ed = getThemeRevealRadius(_0x2bb4ab, _0x15cc8e),
          _0x562501 = _0x519fda.animate(
            {
              clipPath: [
                'circle(0px at ' + _0x2bb4ab + 'px ' + _0x15cc8e + 'px)',
                'circle(' + _0x16e2ed + 'px at ' + _0x2bb4ab + 'px ' + _0x15cc8e + 'px)',
              ],
            },
            {
              duration: THEME_REVEAL_DURATION_MS,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          );
        return _0x562501.finished;
      })
      .catch(() => {});
  Promise.allSettled(
    [_0x5d14c9, _0xb159e8.finished].filter((_0x535153) => _0x535153 && typeof _0x535153.then === 'function'),
  ).finally(_0xf80f4);
}
function normalizeBaseAppTheme(_0x3bc385) {
  return BASE_APP_THEMES.has(_0x3bc385) ? _0x3bc385 : 'dark';
}
function normalizeAppThemePreset(_0x952709) {
  return APP_THEME_PRESETS.has(_0x952709) ? _0x952709 : 'dusk';
}
function normalizeCursorSize(_0x28413e) {
  return CURSOR_SIZES.has(_0x28413e) ? _0x28413e : 'small';
}
function getBaseThemeForPreset(_0x2ec321) {
  return normalizeAppThemePreset(_0x2ec321) === 'day' ? 'light' : 'dark';
}
function isLightCanvasPreset(_0x446e4) {
  return normalizeAppThemePreset(_0x446e4) !== 'dusk';
}
function getCursorThemeForPreset(_0x1a62e0) {
  return normalizeAppThemePreset(_0x1a62e0) === 'day' ? 'dark' : 'light';
}
function getCursorFallbackPreset() {
  return normalizeAppThemePreset(localStorage.getItem(APP_THEME_PRESET_STORAGE_KEY));
}
function applyCursorStyle({ size: _0x4aa28a, preset: _0x1b8735 } = {}) {
  const _0x422b04 = normalizeCursorSize(_0x4aa28a || localStorage.getItem(CURSOR_SIZE_STORAGE_KEY)),
    _0x47f0ac = getCursorThemeForPreset(_0x1b8735 || getCursorFallbackPreset()),
    _0x356566 = document.documentElement;
  (Object.entries(CURSOR_ROLE_MAP).forEach(([_0x3a9374, _0x46e546]) => {
    _0x356566.style.setProperty(
      _0x3a9374,
      "url('" +
        CURSOR_ASSET_ROOT +
        '/' +
        _0x47f0ac +
        '/' +
        _0x46e546.file +
        '-' +
        _0x422b04 +
        ".cur'), " +
        _0x46e546.fallback,
    );
  }),
    Object.entries(CURSOR_ANIMATED_ROLE_MAP).forEach(([_0x175cb1, _0x2ca4c5]) => {
      _0x356566.style.setProperty(
        _0x175cb1,
        "url('" + CURSOR_ASSET_ROOT + '/' + _0x47f0ac + '/' + _0x2ca4c5.file + "'), " + _0x2ca4c5.fallback,
      );
    }));
}
function getUiStoreTheme(_0x4688f0) {
  try {
    const _0x29520c = _0x4688f0?.getStateRaw?.() || _0x4688f0?.getState?.() || {};
    return normalizeBaseAppTheme(_0x29520c.theme);
  } catch {
    return 'dark';
  }
}
function getSavedAppThemePreset(_0x44f591) {
  const _0x246e40 = normalizeAppThemePreset(localStorage.getItem(APP_THEME_PRESET_STORAGE_KEY)),
    _0x3c49bc = getUiStoreTheme(_0x44f591);
  if (getBaseThemeForPreset(_0x246e40) === _0x3c49bc) return _0x246e40;
  return _0x3c49bc === 'light' ? 'day' : 'dusk';
}
function syncAppThemeButtons(_0x1b38d3) {
  const _0xfc103e = normalizeAppThemePreset(_0x1b38d3);
  document.querySelectorAll('.cursor-size-btn[data-app-theme]').forEach((_0x5796c3) => {
    const _0x14150f = _0x5796c3.dataset.appTheme === _0xfc103e;
    (_0x5796c3.classList.toggle('active', _0x14150f),
      _0x5796c3.classList.remove('is-disabled'),
      _0x5796c3.setAttribute('aria-disabled', 'false'),
      (_0x5796c3.title = ''));
  });
}
function syncCanvasTheme(_0x46f09b) {
  const _0x5d0b27 = document.getElementById('v2-wrap'),
    _0x3f2832 = normalizeAppThemePreset(_0x46f09b),
    _0x3df6f5 = isLightCanvasPreset(_0x46f09b);
  document.documentElement?.classList?.toggle('is-canvas-theme-light', _0x3df6f5);
  if (!_0x5d0b27) return;
  (_0x5d0b27.classList.toggle('theme-light', _0x3df6f5),
    APP_THEME_PRESETS.forEach((_0xd93750) => {
      _0x5d0b27.classList.toggle('canvas-theme-' + _0xd93750, _0xd93750 === _0x3f2832);
    }));
}
function normalizePromptActionSurface(_0x179a15) {
  return PROMPT_ACTION_SURFACES.has(_0x179a15) ? _0x179a15 : 'themed';
}
function applyPromptActionSurface(_0x1119ef) {
  const _0x1f01a4 = normalizePromptActionSurface(_0x1119ef);
  (localStorage.setItem('v2-prompt-action-surface', _0x1f01a4),
    document.querySelectorAll('.cursor-size-btn[data-prompt-action-surface]').forEach((_0x14460b) => {
      _0x14460b.classList.toggle('active', _0x14460b.dataset.promptActionSurface === _0x1f01a4);
    }),
    document.body?.classList.toggle('prompt-action-surface-themed', _0x1f01a4 === 'themed'));
  const _0x5a54fd = document.getElementById('v2-wrap');
  if (!_0x5a54fd) return;
  _0x5a54fd.classList.toggle('prompt-action-surface-themed', _0x1f01a4 === 'themed');
}
export function initApplicationTheme({ uiStore: _0x49fc29 } = {}) {
  let _0x16d581 = getSavedAppThemePreset(_0x49fc29);
  const _0xc2b26c = (_0x490a49 = _0x16d581) => syncAppThemeButtons(_0x490a49),
    _0x4b1946 = (_0x53feeb = _0x16d581) => {
      ((_0x16d581 = normalizeAppThemePreset(_0x53feeb)),
        localStorage.setItem(APP_THEME_PRESET_STORAGE_KEY, _0x16d581),
        _0xc2b26c(_0x16d581),
        syncCanvasTheme(_0x16d581),
        applyCursorStyle({ preset: _0x16d581 }));
    },
    _0x508384 = (_0x584fab) => {
      const _0x30c26e = normalizeAppThemePreset(_0x584fab);
      _0x4b1946(_0x30c26e);
      const _0x29b802 = getBaseThemeForPreset(_0x30c26e);
      typeof _0x49fc29?.setTheme === 'function' &&
        _0x29b802 !== getUiStoreTheme(_0x49fc29) &&
        _0x49fc29.setTheme(_0x29b802);
    };
  (_0x4b1946(),
    document.querySelectorAll('.cursor-size-btn[data-app-theme]').forEach((_0x39de5) => {
      _0x39de5.addEventListener('click', (_0x5c1bc3) => {
        const _0x208d01 = normalizeAppThemePreset(_0x39de5.dataset.appTheme);
        if (_0x208d01 === _0x16d581) {
          _0x508384(_0x208d01);
          return;
        }
        runThemeRevealTransition(_0x5c1bc3, () => _0x508384(_0x208d01));
      });
    }),
    typeof _0x49fc29?.subscribeSelector === 'function' &&
      _0x49fc29.subscribeSelector(
        (_0x1508c5) => _0x1508c5.theme,
        (_0x5c0f0c) => {
          const _0x3c8097 = normalizeBaseAppTheme(_0x5c0f0c);
          if (getBaseThemeForPreset(_0x16d581) !== _0x3c8097) {
            _0x4b1946(_0x3c8097 === 'light' ? 'day' : 'dusk');
            return;
          }
          _0x4b1946(_0x16d581);
        },
      ),
    window.addEventListener?.('aicanvas:runtime-info', () => _0xc2b26c()));
}
export function applyGridDotsPref(_0xfee94a) {
  const _0x37356f = document.getElementById('v2-wrap');
  if (!_0x37356f) return;
  _0x37356f.classList.toggle('has-grid-dots', !!_0xfee94a);
}
export function readGridDotsPref() {
  const _0x175d68 = localStorage.getItem('v2-grid-dots');
  if (_0x175d68 != null) return _0x175d68 === 'true' || _0x175d68 === '1';
  const _0x515d5d = localStorage.getItem('v2-snap-grid') === 'true';
  return (localStorage.setItem('v2-grid-dots', _0x515d5d ? 'true' : 'false'), _0x515d5d);
}
export function setGridDotsPref(_0x3bb56a) {
  const _0x4cd2f6 = _0x3bb56a !== false;
  (localStorage.setItem('v2-grid-dots', _0x4cd2f6 ? 'true' : 'false'), applyGridDotsPref(_0x4cd2f6));
  const _0x3fd5e8 = document.getElementById('btnGridDotsOn'),
    _0x20b544 = document.getElementById('btnGridDotsOff');
  if (_0x3fd5e8) _0x3fd5e8.classList.toggle('active', _0x4cd2f6);
  if (_0x20b544) _0x20b544.classList.toggle('active', !_0x4cd2f6);
  return _0x4cd2f6;
}
export function applyGridDotsPrefFromStorage() {
  applyGridDotsPref(readGridDotsPref());
}
function initCursorSettings() {
  const _0x5dcd98 = (_0x3bb1c6) => {
      const _0x1f10a3 = normalizeCursorSize(_0x3bb1c6);
      (localStorage.setItem(CURSOR_SIZE_STORAGE_KEY, _0x1f10a3),
        document.querySelectorAll('.cursor-size-btn[data-size]').forEach((_0x46bf1a) => {
          _0x46bf1a.classList.toggle('active', _0x46bf1a.dataset.size === _0x1f10a3);
        }),
        applyCursorStyle({ size: _0x1f10a3 }));
    },
    _0x2daf5e = localStorage.getItem(CURSOR_SIZE_STORAGE_KEY) || 'small';
  (_0x5dcd98(_0x2daf5e),
    document.querySelectorAll('.cursor-size-btn[data-size]').forEach((_0x1794bb) => {
      _0x1794bb.addEventListener('click', () => _0x5dcd98(_0x1794bb.dataset.size));
    }));
}
function initPromptActionSurface() {
  const _0x505ab0 = normalizePromptActionSurface(localStorage.getItem('v2-prompt-action-surface'));
  (applyPromptActionSurface(_0x505ab0),
    document.querySelectorAll('.cursor-size-btn[data-prompt-action-surface]').forEach((_0x618903) => {
      _0x618903.addEventListener('click', () =>
        applyPromptActionSurface(_0x618903.dataset.promptActionSurface),
      );
    }));
}
function initGridDots() {
  const _0x25712f = document.getElementById('btnGridDotsOn'),
    _0x1e89c6 = document.getElementById('btnGridDotsOff'),
    _0x51269f = document.getElementById('gridDotsShortcutLabel');
  if (!_0x25712f || !_0x1e89c6) return;
  const _0x3ea3f1 = () => {
    if (!_0x51269f) return;
    _0x51269f.textContent = getShortcutLabelByAction('grid-dots', '.');
  };
  (setGridDotsPref(readGridDotsPref()),
    _0x3ea3f1(),
    _0x25712f.addEventListener('click', () => setGridDotsPref(true)),
    _0x1e89c6.addEventListener('click', () => setGridDotsPref(false)),
    window.addEventListener('shortcuts-updated', _0x3ea3f1));
}
function initFontSize() {
  const _0x2b36d7 = (_0x8701ed) => {
      if (!FONT_SIZE_MAP[_0x8701ed]) _0x8701ed = 'small';
      (localStorage.setItem('v2-input-font-size', _0x8701ed),
        document.querySelectorAll('.cursor-size-btn[data-fontsize]').forEach((_0x5d4706) => {
          _0x5d4706.classList.toggle('active', _0x5d4706.dataset.fontsize === _0x8701ed);
        }),
        document.documentElement.style.setProperty('--prompt-font-size', FONT_SIZE_MAP[_0x8701ed]));
    },
    _0x46c908 = localStorage.getItem('v2-input-font-size') || 'small';
  (_0x2b36d7(_0x46c908),
    document.querySelectorAll('.cursor-size-btn[data-fontsize]').forEach((_0x39457a) => {
      _0x39457a.addEventListener('click', () => _0x2b36d7(_0x39457a.dataset.fontsize));
    }));
}
export function initAppearanceSettings(_0x59905d = {}) {
  (initApplicationTheme({ uiStore: _0x59905d.uiStore }),
    initCursorSettings(),
    initPromptActionSurface(),
    initGridDots(),
    initFontSize());
}
