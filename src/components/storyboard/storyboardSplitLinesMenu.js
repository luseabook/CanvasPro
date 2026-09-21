import { normalizeStoryboardGridGap, STORYBOARD_GRID_GAP_MAX } from '../../core/storyboardCellUtils.js';
export function createStoryboardSplitLinesMenu({ getGap: _0x136d63, onGapChange: _0x490676 } = {}) {
  const _0x3a12c6 = document.createElement('div');
  _0x3a12c6.className = 'v2-canvas-ctx-menu v2-sb-dropdown storyboard-split-lines-menu';
  const _0x430e5b = document.createElement('div');
  _0x430e5b.className = 'storyboard-grid-gap-row';
  const _0x562bb0 = document.createElement('span');
  ((_0x562bb0.className = 'storyboard-grid-gap-label'), (_0x562bb0.textContent = '线间距'));
  const _0x168a4a = document.createElement('span');
  _0x168a4a.className = 'storyboard-grid-gap-readout';
  const _0x9c95e6 = document.createElement('div');
  _0x9c95e6.className = 'storyboard-grid-gap-control';
  const _0x17df50 = document.createElement('input');
  return (
    (_0x17df50.type = 'range'),
    (_0x17df50.min = '0'),
    (_0x17df50.max = String(STORYBOARD_GRID_GAP_MAX)),
    (_0x17df50.step = '1'),
    (_0x17df50.value = String(_0x136d63?.() ?? 0)),
    (_0x168a4a.textContent = _0x17df50.value + 'px'),
    _0x17df50.addEventListener('input', (_0x1f05cd) => {
      _0x1f05cd.stopPropagation?.();
      const _0x5c7fd2 = normalizeStoryboardGridGap(_0x1f05cd.target?.value, _0x136d63?.() ?? 0);
      ((_0x17df50.value = String(_0x5c7fd2)),
        (_0x168a4a.textContent = _0x5c7fd2 + 'px'),
        _0x490676?.(_0x5c7fd2));
    }),
    _0x17df50.addEventListener('pointerdown', (_0x3ab459) => {
      _0x3ab459.stopPropagation?.();
    }),
    _0x9c95e6.appendChild(_0x17df50),
    _0x430e5b.appendChild(_0x562bb0),
    _0x430e5b.appendChild(_0x168a4a),
    _0x3a12c6.appendChild(_0x430e5b),
    _0x3a12c6.appendChild(_0x9c95e6),
    _0x3a12c6
  );
}
export function bindStoryboardSplitLinesMenuDismiss({
  menu: _0xa341b4,
  anchor: _0x29c163,
  shouldKeepOpen: _0x2240df,
  onDismiss: _0x50adc1,
} = {}) {
  const _0x264222 = (_0x5ed87b) => {
    if (_0x2240df?.()) return;
    !_0xa341b4?.contains?.(_0x5ed87b.target) && !_0x29c163?.contains?.(_0x5ed87b.target) && _0x50adc1?.();
  };
  return (document.addEventListener('pointerdown', _0x264222), _0x264222);
}
