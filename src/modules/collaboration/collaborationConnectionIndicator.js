export function connectionQuality(response) {
  if (!response) return { level: 'inactive', label: '未协作', value: '' };
  if (response['status'] === 'offline' || response['presenceStatus'] === 'offline')
    return { level: 'offline', label: '协作连接中断', value: '断线' };
  if (response['status'] === 'blocked') return { level: 'offline', label: '协作已暂停', value: '暂停' };
  if (!Number['isFinite'](response['latencyMs']))
    return { level: 'connecting', label: '协作连接中，正在测量延迟', value: '…' };
  const value = Math['max'](0x0, Math['round'](response['latencyMs'])),
    level = value < 0x64 ? 'good' : value < 0xfa ? 'fair' : 'poor';
  return {
    level: level,
    label:
      '协作中，延迟 ' + value + ' ms，' + (level === 'good' ? '良好' : level === 'fair' ? '一般' : '较高'),
    value: value + '\x20ms',
  };
}
export function createCollaborationConnectionIndicator(el = document) {
  const element = el['createElement']('span');
  ((element['className'] = 'collaboration-connection'), element['setAttribute']('role', 'img'));
  const el2 = el['createElement']('span');
  ((el2['className'] = 'collaboration-signal'), el2['setAttribute']('aria-hidden', 'true'));
  for (let count = 0x0; count < 0x3; count++) el2['append'](el['createElement']('i'));
  const el3 = el['createElement']('span');
  return (
    (el3['className'] = 'collaboration-latency'),
    element['append'](el2, el3),
    {
      element: element,
      update(enabled) {
        const el4 = connectionQuality(enabled);
        ((element['hidden'] = !enabled),
          (element['dataset']['quality'] = el4['level']),
          element['setAttribute']('aria-label', el4['label']),
          (element['title'] = el4['label']));
        if (el3['textContent'] !== el4['value']) el3['textContent'] = el4['value'];
      },
    }
  );
}
