export function observePlaybackStallProgress(value, item, changedAt = Date['now']()) {
  const signature = JSON['stringify']([item['src'], item['currentTime'], item['buffered']]);
  return (
    value['stallProgress']?.['signature'] !== signature &&
      (value['stallProgress'] = { signature: signature, changedAt: changedAt }),
    Math['max'](
      0x0,
      Number(value['stallTimeoutMs'] ?? 0xfa0) - (changedAt - value['stallProgress']['changedAt']),
    )
  );
}
