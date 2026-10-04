import { get, post } from './requester.js';
export async function checkUpdateFromServer(options = {}) {
  const map = new URLSearchParams();
  if (options.force) map.set('force', '1');
  if (options.includeCurrent) map.set('includeCurrent', '1');
  const value = map.toString(),
    get2 = await get('/api/v2/update/check' + (value ? '?' + value : ''), { provider: 'local' });
  return get2;
}
export async function checkLocalUpdatePreviewFromServer() {
  const get3 = await get('/api/v2/update/local-preview', { provider: 'local' });
  return get3;
}
export async function applyUpdateFromServer() {
  const post2 = await post('/api/v2/update/apply', {}, { provider: 'local' });
  return post2;
}
export async function pingUpdateCheckFromServer() {
  try {
    return (await get('/api/v2/update/check', { provider: 'local' }), true);
  } catch {
    return false;
  }
}
