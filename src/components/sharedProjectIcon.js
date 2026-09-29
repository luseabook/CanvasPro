export function createSharedProjectIcon(_0x17dd3d = document, { host: host = ![] } = {}) {
  const _0x2c47ec = _0x17dd3d['createElementNS']('http://www.w3.org/2000/svg', 'svg');
  for (const [_0x1d5f42, _0x449312] of Object['entries']({
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
    _0x2c47ec['setAttribute'](_0x1d5f42, _0x449312);
  const _0x1bfb74 = _0x17dd3d['createElementNS']('http://www.w3.org/2000/svg', 'path');
  return (
    _0x1bfb74['setAttribute'](
      'd',
      host
        ? 'M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2M16 9a4 4 0 0 1-8 0M7 3l2 2 3-3 3 3 2-2-1 5H8Z'
        : 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    ),
    _0x2c47ec['append'](_0x1bfb74),
    _0x2c47ec
  );
}
export function createCanvasProjectBadge(_0x3da223, _0x18139a = document) {
  if (!['shared', 'shared-host']['includes'](_0x3da223?.['badge'])) return null;
  const _0x32deb6 = createSharedProjectIcon(_0x18139a, { host: _0x3da223['badge'] === 'shared-host' });
  return (
    _0x32deb6['classList']['add']('canvas-project-badge'),
    _0x32deb6['setAttribute']('data-badge', _0x3da223['badge']),
    _0x32deb6['setAttribute']('aria-label', _0x3da223['label']),
    _0x32deb6['removeAttribute']('aria-hidden'),
    _0x32deb6
  );
}
