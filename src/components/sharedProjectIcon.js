export function createSharedProjectIcon(value = document, { host: host = ![] } = {}) {
  const el = value['createElementNS']('http://www.w3.org/2000/svg', 'svg');
  for (const [item, key] of Object['entries']({
    viewBox: '0 0 24 24',
    width: '16',
    height: '16',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  }))
    el['setAttribute'](item, key);
  const el2 = value['createElementNS']('http://www.w3.org/2000/svg', 'path');
  return (
    el2['setAttribute'](
      'd',
      host
        ? 'M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2M16 9a4 4 0 0 1-8 0M7 3l2 2 3-3 3 3 2-2-1 5H8Z'
        : 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    ),
    el['append'](el2),
    el
  );
}
export function createCanvasProjectBadge(host2, index = document) {
  if (!['shared', 'shared-host']['includes'](host2?.['badge'])) return null;
  const el3 = createSharedProjectIcon(index, { host: host2['badge'] === 'shared-host' });
  return (
    el3['classList']['add']('canvas-project-badge'),
    el3['setAttribute']('data-badge', host2['badge']),
    el3['setAttribute']('aria-label', host2['label']),
    el3['removeAttribute']('aria-hidden'),
    el3
  );
}
