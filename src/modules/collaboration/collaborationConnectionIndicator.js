export function connectionQuality(_0x3ee0d1) {
  if (!_0x3ee0d1) return { level: 'inactive', label: '未协作', value: '' };
  if (_0x3ee0d1['status'] === 'offline' || _0x3ee0d1['presenceStatus'] === 'offline')
    return { level: 'offline', label: '协作连接中断', value: '断线' };
  if (_0x3ee0d1['status'] === 'blocked') return { level: 'offline', label: '协作已暂停', value: '暂停' };
  if (!Number['isFinite'](_0x3ee0d1['latencyMs']))
    return { level: 'connecting', label: '协作连接中，正在测量延迟', value: '…' };
  const _0x59754b = Math['max'](0x0, Math['round'](_0x3ee0d1['latencyMs'])),
    _0x5ba823 = _0x59754b < 0x64 ? 'good' : _0x59754b < 0xfa ? 'fair' : 'poor';
  return {
    level: _0x5ba823,
    label:
      '协作中，延迟 ' +
      _0x59754b +
      ' ms，' +
      (_0x5ba823 === 'good' ? '良好' : _0x5ba823 === 'fair' ? '一般' : '较高'),
    value: _0x59754b + '\x20ms',
  };
}
export function createCollaborationConnectionIndicator(_0x1d771d = document) {
  const _0x53566d = _0x1d771d['createElement']('span');
  ((_0x53566d['className'] = 'collaboration-connection'), _0x53566d['setAttribute']('role', 'img'));
  const _0x56061d = _0x1d771d['createElement']('span');
  ((_0x56061d['className'] = 'collaboration-signal'), _0x56061d['setAttribute']('aria-hidden', 'true'));
  for (let _0x30e59c = 0x0; _0x30e59c < 0x3; _0x30e59c++)
    _0x56061d['append'](_0x1d771d['createElement']('i'));
  const _0x568f24 = _0x1d771d['createElement']('span');
  return (
    (_0x568f24['className'] = 'collaboration-latency'),
    _0x53566d['append'](_0x56061d, _0x568f24),
    {
      element: _0x53566d,
      update(_0x2056d6) {
        const _0x43c221 = connectionQuality(_0x2056d6);
        ((_0x53566d['hidden'] = !_0x2056d6),
          (_0x53566d['dataset']['quality'] = _0x43c221['level']),
          _0x53566d['setAttribute']('aria-label', _0x43c221['label']),
          (_0x53566d['title'] = _0x43c221['label']));
        if (_0x568f24['textContent'] !== _0x43c221['value']) _0x568f24['textContent'] = _0x43c221['value'];
      },
    }
  );
}
