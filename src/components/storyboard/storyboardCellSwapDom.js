function restorePendingSource(_0x49bc75, _0x579db9, _0x4f6f0d) {
  if (_0x579db9) _0x49bc75.__storyboardPendingSrc = _0x4f6f0d;
  else delete _0x49bc75.__storyboardPendingSrc;
}
export function applyImmediateStoryboardCellSwap(_0xa48880, _0x2e7bcd, _0x1c3892) {
  const _0x270ef = Number(_0x2e7bcd),
    _0x349a93 = Number(_0x1c3892),
    _0x46b507 = () => {};
  if (
    !Number.isInteger(_0x270ef) ||
    !Number.isInteger(_0x349a93) ||
    _0x270ef === _0x349a93 ||
    _0x270ef < 0 ||
    _0x349a93 < 0 ||
    !_0xa48880 ||
    _0x270ef >= _0xa48880.length ||
    _0x349a93 >= _0xa48880.length
  )
    return { ok: false, revert: _0x46b507 };
  const _0xb2b150 = _0xa48880[_0x270ef]?.querySelector?.('.cell-content-wrap') || null,
    _0x5c9cf1 = _0xa48880[_0x349a93]?.querySelector?.('.cell-content-wrap') || null;
  if (!_0xb2b150 || !_0x5c9cf1) return { ok: false, revert: _0x46b507 };
  const _0x155a6e = Array.from(_0xb2b150.childNodes || []),
    _0x3059b6 = Array.from(_0x5c9cf1.childNodes || []),
    _0x30f24a = _0xb2b150.__storyboardPendingSrc,
    _0x3fa165 = _0x5c9cf1.__storyboardPendingSrc,
    _0x5800ff = Object.prototype.hasOwnProperty.call(_0xb2b150, '__storyboardPendingSrc'),
    _0xeacfac = Object.prototype.hasOwnProperty.call(_0x5c9cf1, '__storyboardPendingSrc');
  (_0xb2b150.replaceChildren(..._0x3059b6),
    _0x5c9cf1.replaceChildren(..._0x155a6e),
    delete _0xb2b150.__storyboardPendingSrc,
    delete _0x5c9cf1.__storyboardPendingSrc);
  let _0xef81af = false;
  const _0x469060 = () => {
    if (_0xef81af) return;
    ((_0xef81af = true),
      _0xb2b150.replaceChildren(..._0x155a6e),
      _0x5c9cf1.replaceChildren(..._0x3059b6),
      restorePendingSource(_0xb2b150, _0x5800ff, _0x30f24a),
      restorePendingSource(_0x5c9cf1, _0xeacfac, _0x3fa165));
  };
  return { ok: true, revert: _0x469060 };
}
