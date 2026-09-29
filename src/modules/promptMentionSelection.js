import { matchPromptMentions } from './promptMentionMatcher.js';
export function deletePromptMention(_0x4697ce, _0x2cf9f5, _0x4bd9ad, _0x411db7, _0x31f2a7) {
  const _0x1dc8d1 = _0x4697ce['promptEl']['ownerDocument'];
  if (!_0x1dc8d1?.['execCommand']) {
    if (_0x4bd9ad['collapsed'] && _0x4bd9ad['startContainer']['nodeType'] === 0x3) {
      const _0x3aced1 = _0x4bd9ad['startContainer'];
      _0x3aced1['textContent'] =
        _0x411db7 === 'Backspace'
          ? _0x3aced1['textContent']['slice'](_0x4bd9ad['startOffset'])
          : _0x3aced1['textContent']['slice'](0x0, _0x4bd9ad['startOffset']);
    }
    (_0x2cf9f5['remove'](), _0x31f2a7(_0x4697ce));
    return;
  }
  const _0x2a05c7 = _0x1dc8d1['defaultView']['getSelection'](),
    _0xa3503 = _0x4bd9ad['cloneRange'](),
    _0x17bb72 = _0x1dc8d1['createRange']();
  _0x17bb72['selectNode'](_0x2cf9f5);
  if (_0x4bd9ad['collapsed']) {
    if (_0x411db7 === 'Backspace') _0x17bb72['setEnd'](_0x4bd9ad['startContainer'], _0x4bd9ad['startOffset']);
    else _0x17bb72['setStart'](_0x4bd9ad['startContainer'], _0x4bd9ad['startOffset']);
  }
  (_0x2a05c7['removeAllRanges'](), _0x2a05c7['addRange'](_0x17bb72));
  let _0x4f4be3 = ![];
  try {
    _0x4f4be3 = _0x1dc8d1['execCommand']('delete', ![]);
  } catch {}
  if (_0x4f4be3) _0x31f2a7(_0x4697ce);
  else (_0x2a05c7['removeAllRanges'](), _0x2a05c7['addRange'](_0xa3503));
}
function cloneTarget(_0x5d0b7f, _0x51b3d2, _0x209466) {
  const _0x20116b = [];
  for (let _0x5b318f = _0x209466; _0x5b318f && _0x5b318f !== _0x5d0b7f; _0x5b318f = _0x5b318f['parentNode']) {
    if (!_0x5b318f['parentNode']) return null;
    _0x20116b['unshift'](
      Array['prototype']['indexOf']['call'](_0x5b318f['parentNode']['childNodes'], _0x5b318f),
    );
  }
  return _0x20116b['reduce']((_0x9f7c46, _0x114af) => _0x9f7c46?.['childNodes'][_0x114af], _0x51b3d2);
}
export function insertSelectedPromptMention(_0x51a9a3, _0x2b6add, _0x40fc8d, _0x25652c) {
  const _0x3f7e94 = _0x51a9a3?.['promptEl'],
    _0x487e8b = _0x3f7e94?.['ownerDocument'];
  if (!_0x487e8b?.['execCommand'] || !_0x487e8b['createTreeWalker'] || _0x2b6add['pillKind']) return null;
  const _0x38c763 = _0x487e8b['defaultView']['getSelection'](),
    _0x2f6e70 = _0x40fc8d['triggerRange'] || (_0x38c763['rangeCount'] ? _0x38c763['getRangeAt'](0x0) : null),
    _0x438760 = _0x40fc8d['pillToEdit'];
  if (!_0x438760 && (!_0x2f6e70 || !_0x3f7e94['contains'](_0x2f6e70['startContainer']))) return ![];
  const _0xf49b7c = _0x3f7e94['cloneNode'](!![]),
    _0x1079b9 = _0x25652c['createPill'](_0x2b6add, _0x51a9a3);
  if (_0x438760) {
    if (!_0x3f7e94['contains'](_0x438760)) return ![];
    cloneTarget(_0x3f7e94, _0xf49b7c, _0x438760)['replaceWith'](_0x1079b9);
  } else {
    if (_0x2f6e70['startContainer']['nodeType'] !== 0x3) return ![];
    const _0x1332bf = cloneTarget(_0x3f7e94, _0xf49b7c, _0x2f6e70['startContainer']),
      _0x6dae67 = _0x2f6e70['startOffset'],
      _0x2def4e =
        _0x40fc8d['atIndex'] >= 0x0
          ? _0x40fc8d['atIndex']
          : Math['max'](
              _0x1332bf['textContent']['lastIndexOf']('@', _0x6dae67 - 0x1),
              _0x1332bf['textContent']['lastIndexOf']('＠', _0x6dae67 - 0x1),
            );
    if (_0x2def4e < 0x0) return ![];
    const _0x2d439b = _0x487e8b['createRange']();
    (_0x2d439b['setStart'](_0x1332bf, _0x2def4e),
      _0x2d439b['setEnd'](_0x1332bf, _0x6dae67),
      _0x2d439b['deleteContents'](),
      _0x2d439b['insertNode'](_0x1079b9));
  }
  const _0x171304 = { ..._0x2b6add, refLabel: '', assetName: '' },
    _0x2f6aa9 = _0x487e8b['createTreeWalker'](_0xf49b7c, 0x4),
    _0x4b5f9e = [];
  let _0x522d23;
  while ((_0x522d23 = _0x2f6aa9['nextNode']())) {
    if (_0x522d23['parentElement']?.['closest']('.ref-pill, [contenteditable="false"]')) continue;
    const _0xb78b1d = matchPromptMentions(_0x522d23['textContent'], [_0x171304])['filter'](
      (_0x5f188c) => _0x5f188c['candidates']['length'] === 0x1,
    );
    if (_0xb78b1d['length']) _0x4b5f9e['push']({ node: _0x522d23, matches: _0xb78b1d });
  }
  if (_0x40fc8d['requireOtherMatches'] && !_0x4b5f9e['length']) return null;
  for (const { node: _0x550e51, matches: _0x455e85 } of _0x4b5f9e) {
    for (const _0x31dbe6 of _0x455e85['reverse']()) {
      const _0xd457a3 = _0x487e8b['createRange']();
      (_0xd457a3['setStart'](_0x550e51, _0x31dbe6['start']),
        _0xd457a3['setEnd'](_0x550e51, _0x31dbe6['end']),
        _0xd457a3['deleteContents'](),
        _0xd457a3['insertNode'](_0x1079b9['cloneNode'](!![])));
    }
  }
  const _0x3389b8 = [..._0xf49b7c['querySelectorAll']('.ref-pill')]['indexOf'](_0x1079b9),
    _0xf22be5 = _0x3f7e94['scrollTop'],
    _0x749572 = _0x3f7e94['scrollLeft'],
    _0x11b5ed = _0x38c763['rangeCount'] ? _0x38c763['getRangeAt'](0x0)['cloneRange']() : null;
  _0x3f7e94['focus']({ preventScroll: !![] });
  const _0x24701a = _0x487e8b['createRange']();
  (_0x24701a['selectNodeContents'](_0x3f7e94),
    _0x38c763['removeAllRanges'](),
    _0x38c763['addRange'](_0x24701a));
  let _0x4a4332 = ![];
  try {
    _0x4a4332 = _0x487e8b['execCommand']('insertHTML', ![], _0xf49b7c['innerHTML']);
  } catch {}
  if (!_0x4a4332) {
    _0x38c763['removeAllRanges']();
    if (_0x11b5ed) _0x38c763['addRange'](_0x11b5ed);
    return ![];
  }
  _0x25652c['hydrate'](_0x51a9a3);
  const _0x168cc6 = _0x3f7e94['querySelectorAll']('.ref-pill')[_0x3389b8];
  if (_0x168cc6) {
    const _0x419762 = _0x487e8b['createRange']();
    (_0x419762['setStartAfter'](_0x168cc6),
      _0x419762['collapse'](!![]),
      _0x38c763['removeAllRanges'](),
      _0x38c763['addRange'](_0x419762));
  }
  return (
    _0x25652c['commit'](_0x51a9a3),
    (_0x3f7e94['scrollTop'] = _0xf22be5),
    (_0x3f7e94['scrollLeft'] = _0x749572),
    !![]
  );
}
