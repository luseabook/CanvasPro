export function removeStoryboardCustomGridOverlay(_0xcb8676) {
  return (_0xcb8676?.remove?.(), null);
}
export function applyStoryboardCustomGridLineSize(_0x134d91, _0x354d56, _0x23ceaa) {
  const _0x2b2879 = Math.max(0, Number(_0x23ceaa) || 0),
    _0x4990ff = Math.max(1, Math.round(_0x2b2879)) + 'px',
    _0x47f91e = Math.max(0.5, _0x2b2879 / 2) + 'px',
    _0x49050a = Math.max(18, Math.round(_0x2b2879)) + 'px';
  if (typeof _0x134d91.style?.setProperty === 'function')
    (_0x134d91.style.setProperty('--storyboard-grid-line-size', _0x4990ff),
      _0x134d91.style.setProperty('--storyboard-grid-line-half-size', _0x47f91e));
  else
    _0x134d91.style &&
      ((_0x134d91.style['--storyboard-grid-line-size'] = _0x4990ff),
      (_0x134d91.style['--storyboard-grid-line-half-size'] = _0x47f91e));
  if (_0x354d56 === 'columns') _0x134d91.style.width = _0x49050a;
  else _0x134d91.style.height = _0x49050a;
}
function createGridLine({
  editable: _0x4149c0,
  axis: _0x28c09f,
  index: _0x750dab,
  position: _0x544d22,
  lineSize: _0x1ece25,
  onPointerDown: _0x3f6c9e,
}) {
  const _0x2503e7 = document.createElement(_0x4149c0 ? 'button' : 'div');
  if (_0x4149c0) _0x2503e7.type = 'button';
  const _0x2790dc = _0x28c09f === 'columns';
  ((_0x2503e7.className = _0x4149c0
    ? 'storyboard-custom-grid-handle storyboard-custom-grid-handle-' + (_0x2790dc ? 'vertical' : 'horizontal')
    : 'storyboard-custom-grid-line storyboard-custom-grid-line-' + (_0x2790dc ? 'vertical' : 'horizontal')),
    (_0x2503e7.dataset.axis = _0x28c09f),
    (_0x2503e7.dataset.index = String(_0x750dab)),
    _0x2503e7.setAttribute(
      'aria-label',
      _0x2790dc ? 'Move vertical split line' : 'Move horizontal split line',
    ));
  if (_0x2790dc) _0x2503e7.style.left = _0x544d22;
  else _0x2503e7.style.top = _0x544d22;
  return (
    applyStoryboardCustomGridLineSize(_0x2503e7, _0x28c09f, _0x1ece25),
    _0x4149c0 &&
      _0x2503e7.addEventListener('pointerdown', (_0x1c9e33) => _0x3f6c9e?.(_0x1c9e33, _0x28c09f, _0x750dab)),
    _0x2503e7
  );
}
export function renderStoryboardCustomGridOverlay({
  grid: _0x2a8511,
  overlay: _0x314c4e,
  editable: _0x97f7e7,
  layout: _0x52b644,
  lineSize: _0x585bfb,
  getLinePosition: _0x2eabac,
  onPointerDown: _0x3d7b56,
} = {}) {
  if (!_0x2a8511) return _0x314c4e || null;
  const _0x4a4e55 = _0x52b644.cols > 1 || _0x52b644.rows > 1;
  if (!_0x4a4e55) return removeStoryboardCustomGridOverlay(_0x314c4e);
  let _0x306a8b = _0x314c4e;
  (!_0x306a8b || _0x306a8b.parentNode !== _0x2a8511) &&
    ((_0x306a8b = document.createElement('div')),
    (_0x306a8b.className = 'storyboard-custom-grid-overlay'),
    _0x2a8511.appendChild(_0x306a8b));
  (_0x306a8b.replaceChildren(), _0x306a8b.classList.toggle('is-editable', _0x97f7e7));
  const _0x133a22 = _0x52b644.columns.reduce((_0x1a72e9, _0x513544) => _0x1a72e9 + _0x513544, 0),
    _0x3c24ee = _0x52b644.rowTracks.reduce((_0x5c7f70, _0x4b99cd) => _0x5c7f70 + _0x4b99cd, 0);
  let _0x1ea069 = 0;
  for (let _0xa61444 = 0; _0xa61444 < _0x52b644.columns.length - 1; _0xa61444 += 1) {
    ((_0x1ea069 += _0x52b644.columns[_0xa61444]),
      _0x306a8b.appendChild(
        createGridLine({
          editable: _0x97f7e7,
          axis: 'columns',
          index: _0xa61444,
          position: _0x2eabac(_0x1ea069, _0x133a22),
          lineSize: _0x585bfb,
          onPointerDown: _0x3d7b56,
        }),
      ));
  }
  let _0x27022d = 0;
  for (let _0x460660 = 0; _0x460660 < _0x52b644.rowTracks.length - 1; _0x460660 += 1) {
    ((_0x27022d += _0x52b644.rowTracks[_0x460660]),
      _0x306a8b.appendChild(
        createGridLine({
          editable: _0x97f7e7,
          axis: 'rows',
          index: _0x460660,
          position: _0x2eabac(_0x27022d, _0x3c24ee),
          lineSize: _0x585bfb,
          onPointerDown: _0x3d7b56,
        }),
      ));
  }
  return _0x306a8b;
}
