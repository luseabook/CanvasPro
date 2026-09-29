import { startMediaProgressDragSession } from '../../components/shared/mediaProgressDragSession.js';
export function getRotationDragValue(_0x29f7d8, _0x20c728, _0x13b899 = {}) {
  const _0x16c4a1 = _0x13b899['ctrlKey'] ? 0.1 : _0x13b899['shiftKey'] ? 0x5 : 0x1;
  return Math['round']((_0x29f7d8 + Math['trunc'](_0x20c728 / 0x6) * _0x16c4a1) * 0xa) / 0xa;
}
export function bindRotationDrag(
  _0x102072,
  { read: _0x2b0033, preview: _0x5d395f, commit: _0x3f640e, cancel: _0xa04551 },
) {
  const _0x41b7fa = _0x102072['ownerDocument'],
    _0x30705c = _0x41b7fa['defaultView'];
  let _0x2e8af8 = null,
    _0x153d6d = null,
    _0x544c92 = ![];
  const _0x5637e3 = (_0xbf067e = ![]) => {
      if (!_0x2e8af8) return;
      const _0x43f7bf = _0x2e8af8;
      ((_0x2e8af8 = null),
        _0x153d6d?.['dispose'](),
        (_0x153d6d = null),
        _0x41b7fa['removeEventListener']('keydown', _0x109e4b, !![]));
      if (_0x102072['hasPointerCapture']?.(_0x43f7bf['id']))
        _0x102072['releasePointerCapture'](_0x43f7bf['id']);
      (_0x102072['classList']['remove']('is-dragging'), (_0x544c92 = _0x43f7bf['dragged']));
      if (_0xbf067e) _0xa04551();
      else {
        if (_0x43f7bf['dragged']) _0x3f640e(_0x43f7bf['last']);
        else (_0x102072['focus'](), _0x102072['select']());
      }
    },
    _0x49ed56 = (_0xb5c27d) => {
      if (!_0x2e8af8 || _0xb5c27d['pointerId'] !== _0x2e8af8['id']) return;
      const _0x129f2c = _0xb5c27d['clientX'] - _0x2e8af8['x'];
      if (Math['abs'](_0x129f2c) < 0x2 && !_0x2e8af8['dragged']) return;
      (_0xb5c27d['preventDefault'](),
        (_0x2e8af8['dragged'] = !![]),
        _0x102072['classList']['add']('is-dragging'));
      const _0x4f638b = _0xb5c27d['ctrlKey'] ? 'fine' : _0xb5c27d['shiftKey'] ? 'snap' : 'normal';
      _0x4f638b !== _0x2e8af8['modifier'] &&
        ((_0x2e8af8['base'] = _0x2e8af8['last']),
        (_0x2e8af8['x'] = _0xb5c27d['clientX']),
        (_0x2e8af8['modifier'] = _0x4f638b));
      const _0x2fa59c = getRotationDragValue(
        _0x2e8af8['base'],
        _0xb5c27d['clientX'] - _0x2e8af8['x'],
        _0xb5c27d,
      );
      if (_0x2fa59c === _0x2e8af8['last']) return;
      ((_0x2e8af8['last'] = _0x2fa59c), _0x5d395f(_0x2fa59c));
    },
    _0xa00a71 = () => _0x5637e3(!![]),
    _0x109e4b = (_0x414904) => {
      if (_0x414904['key'] !== 'Escape') return;
      (_0x414904['preventDefault'](), _0x414904['stopImmediatePropagation'](), _0x5637e3(!![]));
    },
    _0xb83b73 = (_0x7cd75) => {
      if (_0x7cd75['button'] !== 0x0 || _0x102072['disabled']) return;
      (_0x7cd75['preventDefault'](), _0x7cd75['stopPropagation'](), _0x5637e3(!![]), (_0x544c92 = ![]));
      const _0x4714fa = _0x2b0033();
      ((_0x2e8af8 = {
        id: _0x7cd75['pointerId'],
        x: _0x7cd75['clientX'],
        base: _0x4714fa,
        last: _0x4714fa,
        dragged: ![],
        modifier: _0x7cd75['ctrlKey'] ? 'fine' : _0x7cd75['shiftKey'] ? 'snap' : 'normal',
      }),
        _0x102072['setPointerCapture']?.(_0x7cd75['pointerId']),
        (_0x153d6d = startMediaProgressDragSession({
          target: _0x30705c,
          pointerId: _0x7cd75['pointerId'],
          onMove: _0x49ed56,
          onEnd: () => _0x5637e3(),
          onCancel: _0xa00a71,
        })),
        _0x41b7fa['addEventListener']('keydown', _0x109e4b, !![]));
    },
    _0x31a2b0 = (_0x3d5d51) => {
      if (!_0x544c92) return;
      ((_0x544c92 = ![]), _0x3d5d51['preventDefault'](), _0x3d5d51['stopImmediatePropagation']());
    };
  return (
    _0x102072['addEventListener']('pointerdown', _0xb83b73),
    _0x102072['addEventListener']('click', _0x31a2b0, !![]),
    () => {
      (_0x5637e3(!![]),
        _0x102072['removeEventListener']('pointerdown', _0xb83b73),
        _0x102072['removeEventListener']('click', _0x31a2b0, !![]));
    }
  );
}
