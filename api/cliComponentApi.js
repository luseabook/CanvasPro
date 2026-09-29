import { get, post } from './apiBase.js';
export const CLI_COMPONENT_CHANGED = 'aicanvas:cli-component-changed';
const pending = new Map();
function unwrap(_0x2bc36d) {
  if (_0x2bc36d['status'] === 0x194) throw new Error('组件接口不可用，请完全退出并重新启动应用后重试');
  if (!_0x2bc36d['success']) throw new Error(_0x2bc36d['error'] || 'CLI\x20组件操作失败');
  if (!_0x2bc36d['data'] || typeof _0x2bc36d['data'] !== 'object' || Array['isArray'](_0x2bc36d['data']))
    throw new Error('组件接口返回异常，请重新启动应用后重试');
  return _0x2bc36d['data'];
}
function componentStatus(_0xba88fb, _0x5c32bf) {
  const _0x355943 = unwrap(_0xba88fb);
  if (
    _0x355943['provider'] !== _0x5c32bf ||
    typeof _0x355943['phase'] !== 'string' ||
    typeof _0x355943['installed'] !== 'boolean'
  )
    throw new Error('组件状态返回异常，请重新启动应用后重试');
  return _0x355943;
}
function notify(_0x496537) {
  return (
    globalThis['window']?.['dispatchEvent'](new CustomEvent(CLI_COMPONENT_CHANGED, { detail: _0x496537 })),
    _0x496537
  );
}
export async function fetchCliComponents() {
  const _0x4f7c10 = unwrap(await get('/api/v2/cli-providers/components'));
  if (
    !_0x4f7c10['components'] ||
    typeof _0x4f7c10['components'] !== 'object' ||
    Array['isArray'](_0x4f7c10['components'])
  )
    throw new Error('无法读取组件状态，请重新启动应用后重试');
  return _0x4f7c10;
}
export async function removeCliComponent(_0x3d4f20) {
  return notify(
    componentStatus(
      await post('/api/v2/cli-providers/' + encodeURIComponent(_0x3d4f20) + '/remove-component', {}),
      _0x3d4f20,
    ),
  );
}
export function updateCliComponent(_0xa5d78b) {
  return ensureCliComponent(_0xa5d78b, { update: !![] });
}
export function repairCliComponent(_0xa94860) {
  return ensureCliComponent(_0xa94860, { repair: !![] });
}
export async function checkCliComponentUpdate(_0x234baa) {
  return notify(
    componentStatus(
      await post('/api/v2/cli-providers/' + encodeURIComponent(_0x234baa) + '/check-update', {}),
      _0x234baa,
    ),
  );
}
export function ensureCliComponent(_0x5ae80f, { update: update = ![], repair: repair = ![] } = {}) {
  if (pending['has'](_0x5ae80f)) return pending['get'](_0x5ae80f);
  let _0x5ed553;
  const _0x139a4c = (async () => {
    let _0xdd4e02 = (await fetchCliComponents())['components']?.[_0x5ae80f];
    if (!_0xdd4e02) throw new Error('当前平台暂不支持此组件');
    _0x5ed553 = _0xdd4e02;
    if (_0xdd4e02['installed'] && !update && !repair && _0xdd4e02['phase'] !== 'downloading')
      return notify(_0xdd4e02);
    ((_0xdd4e02 = notify(
      componentStatus(
        await post(
          '/api/v2/cli-providers/' +
            encodeURIComponent(_0x5ae80f) +
            '/' +
            (update ? 'update-component' : repair ? 'repair-component' : 'install-component'),
          {},
        ),
        _0x5ae80f,
      ),
    )),
      (_0x5ed553 = _0xdd4e02));
    while (_0xdd4e02['phase'] === 'downloading') {
      (await new Promise((_0x8f9fa0) => setTimeout(_0x8f9fa0, 0x3e8)),
        (_0xdd4e02 = (await fetchCliComponents())['components']?.[_0x5ae80f]));
      if (!_0xdd4e02) throw new Error('无法读取组件下载状态，请重试');
      (notify(_0xdd4e02), (_0x5ed553 = _0xdd4e02));
    }
    if (!_0xdd4e02['installed'] || _0xdd4e02['phase'] === 'failed')
      throw new Error(_0xdd4e02['error'] || '组件下载失败，请重试');
    return _0xdd4e02;
  })()
    ['catch']((_0x1e27b8) => {
      notify({
        ..._0x5ed553,
        provider: _0x5ae80f,
        installed: !!_0x5ed553?.['installed'],
        phase: 'failed',
        error: _0x1e27b8['message'],
      });
      throw _0x1e27b8;
    })
    ['finally'](() => pending['delete'](_0x5ae80f));
  return (pending['set'](_0x5ae80f, _0x139a4c), _0x139a4c);
}
