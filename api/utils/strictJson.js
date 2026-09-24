function normalizeJsonText(_0x307fd1) {
  return typeof _0x307fd1 === 'string' ? _0x307fd1['trim']()['replace'](/^\uFEFF/u, '') : '';
}
function extractBalancedJsonContainer(_0x43cbf3, _0x1834d2) {
  const _0x3c1c8c = _0x43cbf3[_0x1834d2];
  if (_0x3c1c8c !== '{' && _0x3c1c8c !== '[') return '';
  const _0x3b6a95 = [_0x3c1c8c];
  let _0x5de72a = ![],
    _0x124d5e = ![];
  for (let _0x223a4f = _0x1834d2 + 0x1; _0x223a4f < _0x43cbf3['length']; _0x223a4f += 0x1) {
    const _0x204ccf = _0x43cbf3[_0x223a4f];
    if (_0x5de72a) {
      if (_0x124d5e) _0x124d5e = ![];
      else {
        if (_0x204ccf === '\x5c') _0x124d5e = !![];
        else {
          if (_0x204ccf === '\x22') _0x5de72a = ![];
        }
      }
      continue;
    }
    if (_0x204ccf === '\x22') {
      _0x5de72a = !![];
      continue;
    }
    if (_0x204ccf === '{' || _0x204ccf === '[') {
      _0x3b6a95['push'](_0x204ccf);
      continue;
    }
    if (_0x204ccf !== '}' && _0x204ccf !== ']') continue;
    const _0xa7fd42 = _0x204ccf === '}' ? '{' : '[';
    if (_0x3b6a95['at'](-0x1) !== _0xa7fd42) return '';
    _0x3b6a95['pop']();
    if (!_0x3b6a95['length']) return _0x43cbf3['slice'](_0x1834d2, _0x223a4f + 0x1);
  }
  return '';
}
function collectJsonCandidates(_0x3e2cbf) {
  const _0x55779f = [],
    _0x86d46a = (_0x53961a) => {
      const _0x2209e5 = normalizeJsonText(_0x53961a)['replace'](/;$/u, '')['trim']();
      if (_0x2209e5 && !_0x55779f['includes'](_0x2209e5)) _0x55779f['push'](_0x2209e5);
    };
  _0x86d46a(_0x3e2cbf);
  const _0x3b9a61 = /```(?:json)?[ \t]*\r?\n?([\s\S]*?)```/giu;
  let _0x15eaff = _0x3b9a61['exec'](_0x3e2cbf);
  while (_0x15eaff) {
    (_0x86d46a(_0x15eaff[0x1]), (_0x15eaff = _0x3b9a61['exec'](_0x3e2cbf)));
  }
  for (let _0x238e20 = 0x0; _0x238e20 < _0x3e2cbf['length']; _0x238e20 += 0x1) {
    if (_0x3e2cbf[_0x238e20] !== '{' && _0x3e2cbf[_0x238e20] !== '[') continue;
    const _0x477e24 = extractBalancedJsonContainer(_0x3e2cbf, _0x238e20);
    if (_0x477e24) _0x86d46a(_0x477e24);
  }
  return _0x55779f;
}
export function parseStrictJson(_0x104b31, _0x4e0060 = 'Agent 未返回结果。') {
  if (_0x104b31 && typeof _0x104b31 === 'object' && !Array['isArray'](_0x104b31)) return _0x104b31;
  const _0x11524f = normalizeJsonText(_0x104b31);
  if (!_0x11524f) throw new Error(_0x4e0060);
  let _0x1dbeb0 = null;
  for (const _0x2b479a of collectJsonCandidates(_0x11524f)) {
    try {
      return JSON['parse'](_0x2b479a);
    } catch (_0x1a8d65) {
      _0x1dbeb0 = _0x1a8d65;
    }
  }
  const _0x1a3bd0 = new Error('Agent 未返回有效的 JSON。');
  ((_0x1a3bd0['code'] = 'AGENT_INVALID_JSON'),
    (_0x1a3bd0['parseCause'] = normalizeJsonText(_0x1dbeb0?.['message'])),
    (_0x1a3bd0['responsePreview'] = _0x11524f['slice'](0x0, 0x320)));
  throw _0x1a3bd0;
}
export function extractCompleteJsonArrayItems(_0x25f9c3, _0x50c5f9) {
  const _0x14fcb8 = normalizeJsonText(_0x25f9c3),
    _0x36e44c = normalizeJsonText(_0x50c5f9);
  if (!_0x14fcb8 || !_0x36e44c) return [];
  const _0x16ef76 = '\x22' + _0x36e44c + '\x22',
    _0x28543a = _0x14fcb8['indexOf'](_0x16ef76);
  if (_0x28543a < 0x0) return [];
  const _0x201c89 = _0x14fcb8['indexOf'](':', _0x28543a + _0x16ef76['length']),
    _0x523524 = _0x201c89 >= 0x0 ? _0x14fcb8['indexOf']('[', _0x201c89 + 0x1) : -0x1;
  if (_0x523524 < 0x0) return [];
  const _0x45a324 = [];
  let _0x3a6b12 = _0x523524 + 0x1;
  while (_0x3a6b12 < _0x14fcb8['length']) {
    while (_0x3a6b12 < _0x14fcb8['length'] && /[\s,]/u['test'](_0x14fcb8[_0x3a6b12])) _0x3a6b12 += 0x1;
    if (_0x14fcb8[_0x3a6b12] === ']') break;
    if (_0x14fcb8[_0x3a6b12] !== '{' && _0x14fcb8[_0x3a6b12] !== '[') break;
    const _0x5110aa = extractBalancedJsonContainer(_0x14fcb8, _0x3a6b12);
    if (!_0x5110aa) break;
    try {
      _0x45a324['push'](JSON['parse'](_0x5110aa));
    } catch {
      break;
    }
    _0x3a6b12 += _0x5110aa['length'];
  }
  return _0x45a324;
}
export function extractJsonStringProperty(_0x1a9581, _0x4e58ee) {
  const _0x805822 = normalizeJsonText(_0x1a9581),
    _0x1c8df8 = normalizeJsonText(_0x4e58ee);
  if (!_0x805822 || !_0x1c8df8) return '';
  const _0x577d30 = _0x1c8df8['replace'](/[.*+?^${}()|[\]\\]/gu, '\\$&'),
    _0x528867 = _0x805822['match'](
      new RegExp('\x22' + _0x577d30 + '\x22\x5cs*:\x5cs*(\x22(?:\x5c\x5c.|[^\x22\x5c\x5c])*\x22)', 'u'),
    );
  if (!_0x528867) return '';
  try {
    return JSON['parse'](_0x528867[0x1]);
  } catch {
    return '';
  }
}
