import { screenToViewportPoint } from '../../core/math.js';
const motions = new WeakMap(),
  selector = 'article[data-story-replication-episode-id]';
export function settleReplicationCardMotion(_0x9f3947) {
  _0x9f3947?.['querySelectorAll'](selector)['forEach']((_0x1f473a) => {
    (motions['get'](_0x1f473a)?.['cancel'](), motions['delete'](_0x1f473a));
  });
}
export function setReplicationCardDragImage(_0x5152f8, _0x452a38) {
  const _0x9881e8 = _0x452a38['getBoundingClientRect'](),
    _0x2afda0 = screenToViewportPoint(_0x5152f8['clientX'], _0x5152f8['clientY'], {
      _screenOriginX: _0x9881e8['left'],
      _screenOriginY: _0x9881e8['top'],
    });
  _0x5152f8['dataTransfer']?.['setDragImage']?.(_0x452a38, _0x2afda0['x'], _0x2afda0['y']);
}
export function previewReplicationCardOrder(_0xfe4742, _0x2bcb29, _0x8726cd) {
  if (!_0x2bcb29 || !_0x8726cd || _0x2bcb29 === _0x8726cd) return ![];
  const _0x2da311 = [..._0xfe4742['querySelectorAll'](selector)],
    _0x1502be = _0x2da311['indexOf'](_0x2bcb29) < _0x2da311['indexOf'](_0x8726cd),
    _0x53a22b = _0x1502be ? _0x8726cd['nextElementSibling'] : _0x8726cd;
  if (_0x53a22b === _0x2bcb29 || _0x2bcb29['nextElementSibling'] === _0x53a22b) return ![];
  const _0x6a8afd = new Map(
    _0x2da311['map']((_0x8cd52d) => [_0x8cd52d, _0x8cd52d['getBoundingClientRect']()]),
  );
  (settleReplicationCardMotion(_0xfe4742), _0xfe4742['insertBefore'](_0x2bcb29, _0x53a22b));
  if (_0xfe4742['ownerDocument']['defaultView']['matchMedia']('(prefers-reduced-motion: reduce)')['matches'])
    return !![];
  for (const _0x13c907 of _0x2da311) {
    if (_0x13c907 === _0x2bcb29 || !_0x13c907['animate']) continue;
    const _0x4899ea = _0x6a8afd['get'](_0x13c907),
      _0x32374c = _0x13c907['getBoundingClientRect'](),
      _0x309d9a = _0x4899ea['left'] - _0x32374c['left'],
      _0x337240 = _0x4899ea['top'] - _0x32374c['top'];
    if (Math['abs'](_0x309d9a) + Math['abs'](_0x337240) < 0x1) continue;
    const _0x1f4da6 = _0x13c907['animate'](
      [
        { transform: 'translate(' + _0x309d9a + 'px, ' + _0x337240 + 'px)' },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 0xdc, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
    );
    (motions['set'](_0x13c907, _0x1f4da6),
      (_0x1f4da6['onfinish'] = () => {
        if (motions['get'](_0x13c907) === _0x1f4da6) motions['delete'](_0x13c907);
      }));
  }
  return !![];
}
