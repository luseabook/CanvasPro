const mounted = new WeakSet(),
  gapPattern = /\[听不清\]|【听不清】|\[无法听清\]/gu;
function decorateGaps(_0x4f635f) {
  const _0x13a911 = _0x4f635f['ownerDocument'],
    _0x15ee1e = _0x13a911['createTreeWalker'](_0x4f635f, 0x4),
    _0x276bbd = [];
  while (_0x15ee1e['nextNode']()) _0x276bbd['push'](_0x15ee1e['currentNode']);
  for (const _0x2aee44 of _0x276bbd) {
    if (_0x2aee44['parentElement']?.['closest']('.ref-pill,\x20.story-speech-gap,\x20input,\x20textarea'))
      continue;
    const _0x3dc1bc = _0x2aee44['nodeValue'] || '',
      _0x2eb26e = [..._0x3dc1bc['matchAll'](gapPattern)];
    if (!_0x2eb26e['length']) continue;
    const _0x5d458b = _0x13a911['createDocumentFragment']();
    let _0x46b9e9 = 0x0;
    for (const _0x361924 of _0x2eb26e) {
      _0x5d458b['append'](_0x13a911['createTextNode'](_0x3dc1bc['slice'](_0x46b9e9, _0x361924['index'])));
      const _0x28ac06 = _0x13a911['createElement']('span');
      ((_0x28ac06['className'] = 'story-speech-gap'),
        (_0x28ac06['contentEditable'] = 'false'),
        (_0x28ac06['tabIndex'] = 0x0),
        _0x28ac06['setAttribute']('role', 'button'),
        _0x28ac06['setAttribute']('aria-label', '听不清，点击后输入台词'),
        _0x28ac06['setAttribute']('data-tooltip', '点击后直接输入台词，替换听不清的部分'),
        (_0x28ac06['textContent'] = _0x361924[0x0]),
        _0x5d458b['append'](_0x28ac06),
        (_0x46b9e9 = _0x361924['index'] + _0x361924[0x0]['length']));
    }
    (_0x5d458b['append'](_0x13a911['createTextNode'](_0x3dc1bc['slice'](_0x46b9e9))),
      _0x2aee44['replaceWith'](_0x5d458b));
  }
}
export function mountStorySpeechGapEditor(_0x56cdc5) {
  if (!_0x56cdc5) return;
  queueMicrotask(() => {
    if (_0x56cdc5['isConnected']) decorateGaps(_0x56cdc5);
  });
  if (mounted['has'](_0x56cdc5)) return;
  mounted['add'](_0x56cdc5);
  const _0x1d02a1 = (_0x11b9bd) => {
    if (_0x11b9bd['type'] === 'keydown' && !['Enter', '\x20']['includes'](_0x11b9bd['key'])) return;
    const _0x16a2f5 = _0x11b9bd['target']?.['closest']?.('.story-speech-gap');
    if (
      !_0x16a2f5 ||
      !_0x56cdc5['contains'](_0x16a2f5) ||
      _0x56cdc5['getAttribute']('contenteditable') !== 'true'
    )
      return;
    (_0x11b9bd['preventDefault'](), _0x11b9bd['stopPropagation'](), _0x56cdc5['focus']());
    const _0x244a02 = _0x56cdc5['ownerDocument']['createRange']();
    _0x244a02['selectNode'](_0x16a2f5);
    const _0x49508d = _0x56cdc5['ownerDocument']['getSelection']();
    (_0x49508d['removeAllRanges'](), _0x49508d['addRange'](_0x244a02));
  };
  (_0x56cdc5['addEventListener']('click', _0x1d02a1, !![]),
    _0x56cdc5['addEventListener']('keydown', _0x1d02a1, !![]));
}
