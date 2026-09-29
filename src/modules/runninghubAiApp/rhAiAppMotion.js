const motions = new WeakMap();
export const reduceMotion = () =>
  globalThis['matchMedia']?.('(prefers-reduced-motion: reduce)')?.['matches'] === !![];
export function animatePreviewOrder(_0x5bc0f8, _0x1f80a5) {
  const _0x661021 = new Map(
    _0x5bc0f8['map']((_0x3516d8) => [_0x3516d8, _0x3516d8['getBoundingClientRect']()]),
  );
  (_0x1f80a5(),
    _0x5bc0f8['forEach']((_0x5503c7) => {
      motions['get'](_0x5503c7)?.['cancel']();
      if (reduceMotion() || _0x5503c7['matches']('.is-dragging, :has(> .is-dragging)')) return;
      const _0x2099f5 = _0x661021['get'](_0x5503c7),
        _0x51d08a = _0x5503c7['getBoundingClientRect'](),
        _0x24e738 = _0x2099f5['left'] - _0x51d08a['left'],
        _0x568b0c = _0x2099f5['top'] - _0x51d08a['top'];
      if (Math['abs'](_0x24e738) + Math['abs'](_0x568b0c) < 0x1) return;
      motions['set'](
        _0x5503c7,
        _0x5503c7['animate']?.(
          [
            { transform: 'translate(' + _0x24e738 + 'px, ' + _0x568b0c + 'px)' },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 0xd2, easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
        ),
      );
    }));
}
export function showGroupPanel(_0x3625bd, _0x4cd00c) {
  motions['get'](_0x3625bd)?.['cancel']();
  if (_0x4cd00c) _0x3625bd['hidden'] = ![];
  if (reduceMotion() || !_0x3625bd['animate']) {
    _0x3625bd['hidden'] = !_0x4cd00c;
    return;
  }
  const _0x2de4dd = [
      { opacity: 0x0, transform: 'translateY(6px) scale(.98)' },
      { opacity: 0x1, transform: 'translateY(0) scale(1)' },
    ],
    _0xbee8c = _0x3625bd['animate'](_0x4cd00c ? _0x2de4dd : _0x2de4dd['slice']()['reverse'](), {
      duration: _0x4cd00c ? 0xb4 : 0x78,
      easing: 'ease-out',
    });
  (motions['set'](_0x3625bd, _0xbee8c),
    (_0xbee8c['onfinish'] = () => {
      motions['get'](_0x3625bd) === _0xbee8c &&
        ((_0x3625bd['hidden'] = !_0x4cd00c), motions['delete'](_0x3625bd));
    }));
}
