import { requester } from './requester.js';
import { normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { buildApiUrl } from './apiUrl.js';
export function deferredMediaPreview(value) {
  const localPath = normalizeLocalPath(value?.localPath);
  return localPath && /^data\/assets\/_(?:deferred|hosted)\//.test(localPath)
    ? { localPath: localPath, url: buildApiUrl(localPath) }
    : null;
}
export function withDeferredMediaFiles(
  item,
  handler,
  handler2 = (paths) =>
    requester({
      url: '/api/v2/assets/resolve-files',
      provider: 'local',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: paths }),
      timeout: 30 * 60 * 1000,
    }),
) {
  const args = new Set(),
    map = new WeakSet();
  function run(key) {
    if (typeof key === 'string') {
      const localPath2 = normalizeLocalPath(key);
      if (localPath2 && /^data\/assets\/_(?:deferred|hosted)\//.test(localPath2)) args.add(localPath2);
    } else {
      if (
        key &&
        typeof key === 'object' &&
        (Array.isArray(key) || Object.getPrototypeOf(key) === Object.prototype) &&
        !map.has(key)
      ) {
        map.add(key);
        for (const index of Object.values(key)) run(index);
      }
    }
  }
  run(item);
  if (!args.size) return handler();
  return handler2([...args]).then((error) => {
    if (error?.success === false) throw new Error(error.message || '读取所选素材失败，请确认房主仍在线');
    return handler();
  });
}
