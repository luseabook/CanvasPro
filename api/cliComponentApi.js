import { get, post } from './apiBase.js';
export const CLI_COMPONENT_CHANGED = 'aicanvas:cli-component-changed';
const pending = new Map();
function unwrap(response) {
  if (response['status'] === 0x194) throw new Error('组件接口不可用，请完全退出并重新启动应用后重试');
  if (!response['success']) throw new Error(response['error'] || 'CLI\x20组件操作失败');
  if (!response['data'] || typeof response['data'] !== 'object' || Array['isArray'](response['data']))
    throw new Error('组件接口返回异常，请重新启动应用后重试');
  return response['data'];
}
function componentStatus(value, item) {
  const unwrap2 = unwrap(value);
  if (
    unwrap2['provider'] !== item ||
    typeof unwrap2['phase'] !== 'string' ||
    typeof unwrap2['installed'] !== 'boolean'
  )
    throw new Error('组件状态返回异常，请重新启动应用后重试');
  return unwrap2;
}
function notify(detail) {
  return (
    globalThis['window']?.['dispatchEvent'](new CustomEvent(CLI_COMPONENT_CHANGED, { detail: detail })),
    detail
  );
}
export async function fetchCliComponents() {
  const unwrap3 = unwrap(await get('/api/v2/cli-providers/components'));
  if (
    !unwrap3['components'] ||
    typeof unwrap3['components'] !== 'object' ||
    Array['isArray'](unwrap3['components'])
  )
    throw new Error('无法读取组件状态，请重新启动应用后重试');
  return unwrap3;
}
export async function removeCliComponent(key) {
  return notify(
    componentStatus(
      await post('/api/v2/cli-providers/' + encodeURIComponent(key) + '/remove-component', {}),
      key,
    ),
  );
}
export function updateCliComponent(index) {
  return ensureCliComponent(index, { update: !![] });
}
export function repairCliComponent(result) {
  return ensureCliComponent(result, { repair: !![] });
}
export async function checkCliComponentUpdate(data) {
  return notify(
    componentStatus(
      await post('/api/v2/cli-providers/' + encodeURIComponent(data) + '/check-update', {}),
      data,
    ),
  );
}
export function ensureCliComponent(provider, { update: update = ![], repair: repair = ![] } = {}) {
  if (pending['has'](provider)) return pending['get'](provider);
  let args;
  const options = (async () => {
    let notify2 = (await fetchCliComponents())['components']?.[provider];
    if (!notify2) throw new Error('当前平台暂不支持此组件');
    args = notify2;
    if (notify2['installed'] && !update && !repair && notify2['phase'] !== 'downloading')
      return notify(notify2);
    ((notify2 = notify(
      componentStatus(
        await post(
          '/api/v2/cli-providers/' +
            encodeURIComponent(provider) +
            '/' +
            (update ? 'update-component' : repair ? 'repair-component' : 'install-component'),
          {},
        ),
        provider,
      ),
    )),
      (args = notify2));
    while (notify2['phase'] === 'downloading') {
      (await new Promise((target) => setTimeout(target, 0x3e8)),
        (notify2 = (await fetchCliComponents())['components']?.[provider]));
      if (!notify2) throw new Error('无法读取组件下载状态，请重试');
      (notify(notify2), (args = notify2));
    }
    if (!notify2['installed'] || notify2['phase'] === 'failed')
      throw new Error(notify2['error'] || '组件下载失败，请重试');
    return notify2;
  })()
    ['catch']((error) => {
      notify({
        ...args,
        provider: provider,
        installed: !!args?.['installed'],
        phase: 'failed',
        error: error['message'],
      });
      throw error;
    })
    ['finally'](() => pending['delete'](provider));
  return (pending['set'](provider, options), options);
}
