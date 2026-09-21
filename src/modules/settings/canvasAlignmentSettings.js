import appStore from '../../core/stores/appStore.js';
import { getShortcuts } from '../shortcuts.js';
import { applySnapGridEnabled, readSnapGridEnabled, subscribeSnapGridChanges } from '../snapGridState.js';
import { getShortcutLabelByAction } from './settingsShared.js';
const SELECTION_RELATED_HIGHLIGHT_COLORS = ['white', 'blue', 'green', 'cyan', 'purple', 'red', 'yellow'];
function normalizeSelectionRelatedHighlightColor(_0xc59eb7) {
  const _0x691422 = String(_0xc59eb7 || '').trim();
  return SELECTION_RELATED_HIGHLIGHT_COLORS.includes(_0x691422) ? _0x691422 : 'white';
}
function getSelectionRelatedHighlightElements() {
  if (typeof document === 'undefined') return { btnOn: null, btnOff: null, colorRow: null, colorButtons: [] };
  return {
    btnOn: document.getElementById('btnSelectionRelatedHighlightOn'),
    btnOff: document.getElementById('btnSelectionRelatedHighlightOff'),
    colorRow: document.getElementById('selectionRelatedHighlightColorRow'),
    colorButtons: Array.from(document.querySelectorAll('[data-highlight-color]')),
  };
}
function syncSelectionRelatedHighlightColorButtons(_0x10fe1d) {
  const _0xed310b = normalizeSelectionRelatedHighlightColor(_0x10fe1d),
    { colorButtons: _0x31c340 } = getSelectionRelatedHighlightElements();
  _0x31c340.forEach((_0x27e3c6) => {
    _0x27e3c6.classList.toggle('active', _0x27e3c6.dataset.highlightColor === _0xed310b);
  });
}
function syncSelectionRelatedHighlightEnabled(_0x2b76c1) {
  const _0x2174a0 = _0x2b76c1 !== false,
    {
      btnOn: _0x3a4c2b,
      btnOff: _0x39b962,
      colorRow: _0x44b485,
      colorButtons: _0x4e472e,
    } = getSelectionRelatedHighlightElements();
  (_0x3a4c2b?.classList.toggle('active', _0x2174a0),
    _0x39b962?.classList.toggle('active', !_0x2174a0),
    _0x44b485?.classList.toggle('settings-row-disabled', !_0x2174a0),
    _0x4e472e.forEach((_0x4ae1af) => {
      ((_0x4ae1af.disabled = !_0x2174a0),
        _0x4ae1af.setAttribute('aria-disabled', _0x2174a0 ? 'false' : 'true'));
    }));
}
export function setSelectionRelatedHighlightPref(_0x1df6f8, _0x2d9565 = appStore) {
  const _0x40c5cb = _0x1df6f8 !== false;
  return (
    _0x2d9565.setSelectionRelatedHighlightEnabled(_0x40c5cb),
    syncSelectionRelatedHighlightEnabled(_0x40c5cb),
    _0x40c5cb
  );
}
export function setSelectionRelatedHighlightColorPref(_0x369507, _0x1c6215 = appStore) {
  const _0x28b4f6 = normalizeSelectionRelatedHighlightColor(_0x369507);
  return (
    _0x1c6215.setSelectionRelatedHighlightColor(_0x28b4f6),
    syncSelectionRelatedHighlightColorButtons(_0x28b4f6),
    _0x28b4f6
  );
}
function initSelectionRelatedHighlight() {
  const _0x386f72 = document.getElementById('btnSelectionRelatedHighlightOn'),
    _0x51637f = document.getElementById('btnSelectionRelatedHighlightOff'),
    _0x426a4b = Array.from(document.querySelectorAll('[data-highlight-color]'));
  if (!_0x386f72 || !_0x51637f) return;
  const _0x4a795c = appStore.getState(),
    _0x22d59d = _0x4a795c?.ui?.selectionRelatedHighlightEnabled !== false,
    _0xb255a2 = normalizeSelectionRelatedHighlightColor(_0x4a795c?.ui?.selectionRelatedHighlightColor);
  (setSelectionRelatedHighlightPref(_0x22d59d),
    setSelectionRelatedHighlightColorPref(_0xb255a2),
    _0x386f72.addEventListener('click', () => setSelectionRelatedHighlightPref(true)),
    _0x51637f.addEventListener('click', () => setSelectionRelatedHighlightPref(false)),
    _0x426a4b.forEach((_0x5c42f5) => {
      _0x5c42f5.addEventListener('click', () => {
        if (_0x5c42f5.disabled) return;
        setSelectionRelatedHighlightColorPref(_0x5c42f5.dataset.highlightColor);
      });
    }));
}
function initAlignFeature() {
  const _0x3cc973 = document.getElementById('btnAlignTriggerHold'),
    _0x128887 = document.getElementById('btnAlignTriggerClick'),
    _0xa210ac = document.getElementById('btnAlignTriggerOff'),
    _0x543504 = document.getElementById('alignDistributeGapSlider'),
    _0x1176c1 = document.getElementById('alignDistributeGapValue'),
    _0x42b66a = document.getElementById('alignShortcutLabelMain'),
    _0x102ca9 = document.getElementById('alignShortcutLabelHold'),
    _0x59a0da = document.getElementById('alignShortcutLabelClick');
  if (!_0x3cc973 || !_0x128887 || !_0xa210ac || !_0x543504 || !_0x1176c1) return;
  const _0x5b3310 = (_0x20c913) => {
      const _0x16a715 = String(_0x20c913 || '').trim();
      return _0x16a715 === 'hold' || _0x16a715 === 'click' || _0x16a715 === 'off' ? _0x16a715 : 'click';
    },
    _0x27a528 = () => {
      try {
        const _0xcf0e69 = getShortcuts?.() || {},
          _0x40e908 = _0xcf0e69?.['align-feature']?.keys;
        if (Array.isArray(_0x40e908) && _0x40e908.length > 0) return _0x40e908.join('+');
      } catch {}
      return 'Tab';
    },
    _0x5da279 = () => {
      const _0xb422f1 = _0x27a528();
      if (_0x42b66a) _0x42b66a.textContent = _0xb422f1;
      if (_0x102ca9) _0x102ca9.textContent = _0xb422f1;
      if (_0x59a0da) _0x59a0da.textContent = _0xb422f1;
    },
    _0x12d72c = (_0x17f289) => {
      const _0x2edcd3 = _0x5b3310(_0x17f289);
      appStore.setAlignFeatureTriggerMode(_0x2edcd3);
      const _0x55365a = _0x2edcd3 !== 'off';
      (_0x3cc973.classList.toggle('active', _0x2edcd3 === 'hold'),
        _0x128887.classList.toggle('active', _0x2edcd3 === 'click'),
        _0xa210ac.classList.toggle('active', _0x2edcd3 === 'off'),
        window.dispatchEvent(
          new CustomEvent('v2-align-feature-changed', { detail: { enabled: _0x55365a, mode: _0x2edcd3 } }),
        ));
    },
    _0x22dbfb = (_0x430e68) => {
      const _0x4bde29 = Number(_0x430e68),
        _0x13a64a = Number.isFinite(_0x4bde29)
          ? Math.max(0, Math.min(200, Math.round(_0x4bde29 / 5) * 5))
          : 40;
      ((_0x543504.value = String(_0x13a64a)),
        (_0x1176c1.textContent = String(_0x13a64a)),
        appStore.setAlignDistributeGap(_0x13a64a));
    },
    _0xc11f2f = appStore.getState()?.ui || {},
    _0x13df58 = _0x5b3310(_0xc11f2f.alignFeatureTriggerMode),
    _0x38aa76 = Number.isFinite(Number(_0xc11f2f.alignDistributeGap))
      ? Number(_0xc11f2f.alignDistributeGap)
      : 40;
  (_0x12d72c(_0x13df58),
    _0x22dbfb(_0x38aa76),
    _0x5da279(),
    _0x3cc973.addEventListener('click', () => _0x12d72c('hold')),
    _0x128887.addEventListener('click', () => _0x12d72c('click')),
    _0xa210ac.addEventListener('click', () => _0x12d72c('off')),
    _0x543504.addEventListener('input', (_0x534f13) => _0x22dbfb(_0x534f13.target?.value)),
    window.addEventListener('shortcuts-updated', _0x5da279));
}
function initConnectionLines() {
  const _0x268a36 = document.getElementById('btnConnectionLinesOn'),
    _0x4cb433 = document.getElementById('btnConnectionLinesOff'),
    _0x69b53 = document.getElementById('connectionLinesShortcutLabel');
  if (!_0x268a36 || !_0x4cb433) return;
  const _0xcde6bd = (_0xe17ab5) => {
      const _0x3f275b = _0xe17ab5 !== false;
      (_0x268a36.classList.toggle('active', _0x3f275b), _0x4cb433.classList.toggle('active', !_0x3f275b));
    },
    _0xd9260d = (_0x2c2ab6) => {
      const _0x3356bf = _0x2c2ab6 !== false;
      (appStore.setConnectionLinesVisible(_0x3356bf),
        _0xcde6bd(_0x3356bf),
        window.dispatchEvent(
          new CustomEvent('v2-connection-lines-visibility-changed', { detail: { visible: _0x3356bf } }),
        ));
    },
    _0x3a87b3 = () => {
      if (!_0x69b53) return;
      _0x69b53.textContent = getShortcutLabelByAction('toggle-connection-lines', 'B');
    };
  (_0xd9260d(appStore.getState()?.ui?.connectionLinesVisible !== false),
    _0x3a87b3(),
    _0x268a36.addEventListener('click', () => _0xd9260d(true)),
    _0x4cb433.addEventListener('click', () => _0xd9260d(false)),
    window.addEventListener('shortcuts-updated', _0x3a87b3),
    window.addEventListener('v2-connection-lines-visibility-changed', (_0x184b8d) => {
      _0xcde6bd(_0x184b8d?.detail?.visible !== false);
    }));
}
function ensureSnapGuideOverlay() {
  let _0x1e7e57 = document.getElementById('v2-snap-guide-overlay');
  (!_0x1e7e57 &&
    ((_0x1e7e57 = document.createElement('div')),
    (_0x1e7e57.id = 'v2-snap-guide-overlay'),
    (_0x1e7e57.className = 'v2-snap-guide-overlay'),
    document.body.appendChild(_0x1e7e57)),
    (window._showSnapGuideLines = (_0xf30c16) => {
      if (!_0x1e7e57) return;
      _0x1e7e57.replaceChildren();
      if (!Array.isArray(_0xf30c16) || _0xf30c16.length === 0) return;
      const _0xb000fe = document.createDocumentFragment();
      (_0xf30c16.forEach((_0x31e784) => {
        if (!_0x31e784 || (_0x31e784.type !== 'v' && _0x31e784.type !== 'h')) return;
        const _0x2a4d8c = document.createElement('div');
        _0x2a4d8c.className =
          _0x31e784.type === 'v' ? 'v2-snap-guide-line is-vertical' : 'v2-snap-guide-line is-horizontal';
        if (_0x31e784.type === 'v') {
          const _0x12bef4 = Number.isFinite(_0x31e784.start) ? _0x31e784.start : 0,
            _0x11b506 = Number.isFinite(_0x31e784.end) ? _0x31e784.end : _0x12bef4,
            _0x22b8ee = Math.min(_0x12bef4, _0x11b506),
            _0x2257a0 = Math.max(1, Math.abs(_0x11b506 - _0x12bef4));
          ((_0x2a4d8c.style.left = (Number(_0x31e784.pos) || 0) + 'px'),
            (_0x2a4d8c.style.top = _0x22b8ee + 'px'),
            (_0x2a4d8c.style.height = _0x2257a0 + 'px'));
        } else {
          const _0x3abb71 = Number.isFinite(_0x31e784.start) ? _0x31e784.start : 0,
            _0x5e13ef = Number.isFinite(_0x31e784.end) ? _0x31e784.end : _0x3abb71,
            _0x525756 = Math.min(_0x3abb71, _0x5e13ef),
            _0x19fb57 = Math.max(1, Math.abs(_0x5e13ef - _0x3abb71));
          ((_0x2a4d8c.style.top = (Number(_0x31e784.pos) || 0) + 'px'),
            (_0x2a4d8c.style.left = _0x525756 + 'px'),
            (_0x2a4d8c.style.width = _0x19fb57 + 'px'));
        }
        _0xb000fe.appendChild(_0x2a4d8c);
      }),
        _0x1e7e57.appendChild(_0xb000fe));
    }),
    (window._clearSnapGuideLines = () => {
      _0x1e7e57?.replaceChildren();
    }));
}
function initSnapGuides() {
  const _0x5268d3 = document.getElementById('btnSnapGuidesOn'),
    _0x1a752d = document.getElementById('btnSnapGuidesOff'),
    _0x458385 = document.getElementById('snapGuidesShortcutLabel');
  if (!_0x5268d3 || !_0x1a752d) return;
  ensureSnapGuideOverlay();
  const _0x3ca846 = () => {
      const _0x2029c2 = localStorage.getItem('v2-snap-guides');
      if (_0x2029c2 == null) return true;
      return _0x2029c2 === '1' || _0x2029c2 === 'true';
    },
    _0x33633d = (_0x50a5ba) => {
      const _0x29505f = _0x50a5ba !== false;
      (_0x5268d3.classList.toggle('active', _0x29505f), _0x1a752d.classList.toggle('active', !_0x29505f));
    },
    _0x4f42dd = (_0x127c29) => {
      const _0x996fd = _0x127c29 !== false;
      (appStore.setSnapGuidesEnabled(_0x996fd), (window.v2SnapGuides = _0x996fd), _0x33633d(_0x996fd));
      if (!_0x996fd) window._clearSnapGuideLines?.();
      window.dispatchEvent(new CustomEvent('v2-snap-guides-changed', { detail: { enabled: _0x996fd } }));
    },
    _0x1d397e = () => {
      if (!_0x458385) return;
      _0x458385.textContent = getShortcutLabelByAction('snap-guides', '；');
    },
    _0x4b43f0 = appStore.getState()?.ui?.snapGuidesEnabled,
    _0x1e81b3 = typeof _0x4b43f0 === 'boolean' ? _0x4b43f0 : _0x3ca846();
  (_0x4f42dd(_0x1e81b3),
    _0x1d397e(),
    _0x5268d3.addEventListener('click', () => _0x4f42dd(true)),
    _0x1a752d.addEventListener('click', () => _0x4f42dd(false)),
    window.addEventListener('shortcuts-updated', _0x1d397e),
    window.addEventListener('v2-snap-guides-changed', (_0x3d6c7b) => {
      _0x33633d(_0x3d6c7b?.detail?.enabled !== false);
    }));
}
function initSnapGrid() {
  const _0x3db129 = document.getElementById('btnSnapGridOn'),
    _0xb8828c = document.getElementById('btnSnapGridOff'),
    _0x456e78 = document.getElementById('snapGridShortcutLabel');
  if (!_0x3db129 || !_0xb8828c) return;
  const _0x36c579 = () => {
      if (!_0x456e78) return;
      _0x456e78.textContent = getShortcutLabelByAction('snap-grid', 'L');
    },
    _0x302fb7 = readSnapGridEnabled();
  (applySnapGridEnabled(_0x302fb7, { emitEvent: false }),
    _0x36c579(),
    _0x3db129.addEventListener('click', () => applySnapGridEnabled(true)),
    _0xb8828c.addEventListener('click', () => applySnapGridEnabled(false)),
    window.addEventListener('shortcuts-updated', _0x36c579),
    subscribeSnapGridChanges((_0x22e38f) => {
      (_0x3db129.classList.toggle('active', _0x22e38f === true),
        _0xb8828c.classList.toggle('active', _0x22e38f !== true));
    }));
}
export function initCanvasAlignmentSettings() {
  (initSelectionRelatedHighlight(),
    initConnectionLines(),
    initSnapGuides(),
    initSnapGrid(),
    initAlignFeature());
}
