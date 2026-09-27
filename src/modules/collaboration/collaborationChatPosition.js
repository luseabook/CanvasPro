const MIN_WIDTH = 0x168,
  MIN_HEIGHT = 0x1a4;
export function bindCollaborationChatPosition({
  root: _0x2f4525,
  handles: _0x1d938c,
  resizeHandle: _0x4fa745,
  storage: storage = globalThis['localStorage'],
  windowObject: windowObject = window,
}) {
  let _0x5729e1 = null,
    _0x404176 = null,
    _0x156181 = ![],
    _0x10ab54 = null;
  const _0x193544 = _0x4fa745 ? [..._0x1d938c, _0x4fa745] : _0x1d938c;
  try {
    const _0x3efa19 = JSON['parse'](storage?.['getItem']('collaboration-chat-position'));
    if (Number['isFinite'](_0x3efa19?.['x']) && Number['isFinite'](_0x3efa19?.['y'])) _0x5729e1 = _0x3efa19;
  } catch {}
  try {
    const _0x5ad0a7 = JSON['parse'](storage?.['getItem']('collaboration-chat-size'));
    if (
      Number['isFinite'](_0x5ad0a7?.['width']) &&
      Number['isFinite'](_0x5ad0a7?.['height']) &&
      _0x5ad0a7['width'] > 0x0 &&
      _0x5ad0a7['height'] > 0x0
    )
      _0x10ab54 = {
        width: Math['max'](MIN_WIDTH, _0x5ad0a7['width']),
        height: Math['max'](MIN_HEIGHT, _0x5ad0a7['height']),
      };
  } catch {}
  function _0xe39218() {
    if (_0x2f4525['hidden']) return;
    _0x10ab54 &&
      (_0x2f4525['style']['setProperty']('--chat-width', _0x10ab54['width'] + 'px'),
      _0x2f4525['style']['setProperty']('--chat-height', _0x10ab54['height'] + 'px'));
    if (!_0x5729e1) {
      const _0x2ed7fc = document['querySelector']('.sidebar-floating')?.['getBoundingClientRect']();
      _0x5729e1 = {
        x: (_0x2ed7fc?.['right'] || 0x40) + 0xc,
        y: Math['max'](0x48, _0x2ed7fc?.['top'] || 0x78),
      };
    }
    const _0x4095b0 = _0x2f4525['getBoundingClientRect']();
    ((_0x5729e1 = {
      x: Math['max'](0x8, Math['min'](_0x5729e1['x'], windowObject['innerWidth'] - _0x4095b0['width'] - 0x8)),
      y: Math['max'](
        0x8,
        Math['min'](_0x5729e1['y'], windowObject['innerHeight'] - _0x4095b0['height'] - 0x8),
      ),
    }),
      _0x2f4525['style']['setProperty']('--chat-left', _0x5729e1['x'] + 'px'),
      _0x2f4525['style']['setProperty']('--chat-top', _0x5729e1['y'] + 'px'));
  }
  function _0x566c7d(_0x53f33d) {
    if (
      _0x53f33d['button'] !== 0x0 ||
      (_0x53f33d['target']['closest']('button') &&
        _0x53f33d['currentTarget'] !== _0x53f33d['target']['closest']('button'))
    )
      return;
    (_0x2f4525['getAnimations']()['forEach']((_0x54b9e6) => _0x54b9e6['finish']()),
      _0xe39218(),
      (_0x156181 = ![]));
    const _0x2c0774 = _0x2f4525['getBoundingClientRect']();
    ((_0x404176 = {
      id: _0x53f33d['pointerId'],
      x: _0x53f33d['clientX'],
      y: _0x53f33d['clientY'],
      origin: { ..._0x5729e1 },
      handle: _0x53f33d['currentTarget'],
      resizing: _0x53f33d['currentTarget'] === _0x4fa745,
      width: _0x2c0774['width'],
      height: _0x2c0774['height'],
    }),
      _0x2f4525['classList']['toggle']('is-resizing', _0x404176['resizing']),
      _0x404176['handle']['setPointerCapture'](_0x53f33d['pointerId']),
      _0x53f33d['preventDefault']());
  }
  function _0x268fae(_0x9bf821) {
    if (!_0x404176 || _0x404176['id'] !== _0x9bf821['pointerId']) return;
    const _0x460f9d = _0x9bf821['clientX'] - _0x404176['x'],
      _0x8a10eb = _0x9bf821['clientY'] - _0x404176['y'];
    _0x156181 ||= Math['hypot'](_0x460f9d, _0x8a10eb) > 0x4;
    if (!_0x156181) return;
    if (_0x404176['resizing']) {
      const _0x1ff0c9 = Math['min'](MIN_WIDTH, windowObject['innerWidth'] - 0x10),
        _0x5ee89a = Math['min'](MIN_HEIGHT, windowObject['innerHeight'] - 0x10),
        _0x3607c6 = Math['max'](_0x1ff0c9, windowObject['innerWidth'] - _0x404176['origin']['x'] - 0x8),
        _0x5e265b = Math['max'](_0x5ee89a, windowObject['innerHeight'] - _0x404176['origin']['y'] - 0x8);
      _0x10ab54 = {
        width: Math['min'](_0x3607c6, Math['max'](_0x1ff0c9, _0x404176['width'] + _0x460f9d)),
        height: Math['min'](_0x5e265b, Math['max'](_0x5ee89a, _0x404176['height'] + _0x8a10eb)),
      };
    } else _0x5729e1 = { x: _0x404176['origin']['x'] + _0x460f9d, y: _0x404176['origin']['y'] + _0x8a10eb };
    _0xe39218();
  }
  function _0x56d33d() {
    if (!_0x404176) return;
    const _0x52b9b5 = _0x404176;
    ((_0x404176 = null), _0x2f4525['classList']['remove']('is-resizing'));
    if (_0x52b9b5['handle']['hasPointerCapture'](_0x52b9b5['id']))
      _0x52b9b5['handle']['releasePointerCapture'](_0x52b9b5['id']);
    try {
      storage?.['setItem']('collaboration-chat-position', JSON['stringify'](_0x5729e1));
    } catch {}
    if (_0x10ab54)
      try {
        storage?.['setItem']('collaboration-chat-size', JSON['stringify'](_0x10ab54));
      } catch {}
  }
  function _0xeb3fae(_0x1ae200) {
    _0x156181 && ((_0x156181 = ![]), _0x1ae200['preventDefault'](), _0x1ae200['stopImmediatePropagation']());
  }
  for (const _0x532d7c of _0x193544) {
    (_0x532d7c['addEventListener']('pointerdown', _0x566c7d),
      _0x532d7c['addEventListener']('pointermove', _0x268fae),
      _0x532d7c['addEventListener']('pointerup', _0x56d33d),
      _0x532d7c['addEventListener']('pointercancel', _0x56d33d),
      _0x532d7c['addEventListener']('lostpointercapture', _0x56d33d),
      _0x532d7c['addEventListener']('click', _0xeb3fae, !![]));
  }
  function _0x670ad6() {
    (_0x2f4525['getAnimations']()['forEach']((_0x559a9d) => _0x559a9d['finish']()), _0xe39218());
  }
  return (
    windowObject['addEventListener']('resize', _0x670ad6),
    windowObject['addEventListener']('blur', _0x56d33d),
    {
      place: _0xe39218,
      destroy() {
        (_0x56d33d(),
          windowObject['removeEventListener']('resize', _0x670ad6),
          windowObject['removeEventListener']('blur', _0x56d33d));
        for (const _0x164d30 of _0x193544) {
          (_0x164d30['removeEventListener']('pointerdown', _0x566c7d),
            _0x164d30['removeEventListener']('pointermove', _0x268fae),
            _0x164d30['removeEventListener']('pointerup', _0x56d33d),
            _0x164d30['removeEventListener']('pointercancel', _0x56d33d),
            _0x164d30['removeEventListener']('lostpointercapture', _0x56d33d),
            _0x164d30['removeEventListener']('click', _0xeb3fae, !![]));
        }
      },
    }
  );
}
