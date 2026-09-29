export function observePlaybackStallProgress(_0x3c9f4f, _0x5b25a2, _0x466fc3 = Date['now']()) {
  const _0x1590b9 = JSON['stringify']([_0x5b25a2['src'], _0x5b25a2['currentTime'], _0x5b25a2['buffered']]);
  return (
    _0x3c9f4f['stallProgress']?.['signature'] !== _0x1590b9 &&
      (_0x3c9f4f['stallProgress'] = { signature: _0x1590b9, changedAt: _0x466fc3 }),
    Math['max'](
      0x0,
      Number(_0x3c9f4f['stallTimeoutMs'] ?? 0xfa0) - (_0x466fc3 - _0x3c9f4f['stallProgress']['changedAt']),
    )
  );
}
