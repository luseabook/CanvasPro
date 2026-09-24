export function formatPersonReplacementPersonLabel(_0x4290fc = 0x0) {
  let _0x5d0f39 = Math['max'](0x0, Math['trunc'](Number(_0x4290fc) || 0x0)),
    _0xcede71 = '';
  do {
    ((_0xcede71 = String['fromCharCode'](0x41 + (_0x5d0f39 % 0x1a)) + _0xcede71),
      (_0x5d0f39 = Math['floor'](_0x5d0f39 / 0x1a) - 0x1));
  } while (_0x5d0f39 >= 0x0);
  return '人物' + _0xcede71;
}
function labelIndex(_0xb9b95c) {
  const _0x4236a1 = /^人物([A-Z]+)$/u['exec'](String(_0xb9b95c || ''))?.[0x1];
  if (!_0x4236a1) return null;
  const _0x27ef7c =
    [..._0x4236a1]['reduce'](
      (_0x2ef3d3, _0x2469f9) => _0x2ef3d3 * 0x1a + _0x2469f9['charCodeAt'](0x0) - 0x40,
      0x0,
    ) - 0x1;
  return Number['isSafeInteger'](_0x27ef7c) ? _0x27ef7c : null;
}
export function resolvePersonReplacementPromptLabel(_0x59cd3b = {}) {
  return formatPersonReplacementPersonLabel(labelIndex(_0x59cd3b['label']) ?? _0x59cd3b['promptMarkerIndex']);
}
function initialPosition(_0x59f84d) {
  const _0x3dd062 = _0x59f84d['locator']?.['bbox'] || _0x59f84d['bbox'];
  return _0x3dd062 ? Number(_0x3dd062['x']) + Number(_0x3dd062['width']) / 0x2 : Infinity;
}
export function assignPersonReplacementPromptIndexes(_0x2b8319 = []) {
  const _0xaf5d00 = new Set(),
    _0x5dc0bd = new Map(),
    _0x5797e4 = (_0x12541e, _0x37497c) => {
      if (!Number['isSafeInteger'](_0x37497c) || _0x37497c < 0x0 || _0xaf5d00['has'](_0x37497c)) return;
      (_0xaf5d00['add'](_0x37497c), _0x5dc0bd['set'](_0x12541e, _0x37497c));
    };
  (_0x2b8319['forEach']((_0x47bb9a) => _0x5797e4(_0x47bb9a, _0x47bb9a['promptMarkerIndex'])),
    _0x2b8319['forEach']((_0x4fc97d) => {
      if (!_0x5dc0bd['has'](_0x4fc97d)) _0x5797e4(_0x4fc97d, labelIndex(_0x4fc97d['label']));
    }));
  let _0x356b34 = _0xaf5d00['size'] ? Math['max'](..._0xaf5d00) + 0x1 : 0x0;
  return (
    [..._0x2b8319]
      ['sort']((_0x1c7e15, _0x5b564b) => initialPosition(_0x1c7e15) - initialPosition(_0x5b564b))
      ['forEach']((_0x10a060) => {
        if (!_0x5dc0bd['has'](_0x10a060)) _0x5dc0bd['set'](_0x10a060, _0x356b34++);
      }),
    _0x2b8319['map']((_0x2009bc) => ({ ..._0x2009bc, promptMarkerIndex: _0x5dc0bd['get'](_0x2009bc) }))
  );
}
