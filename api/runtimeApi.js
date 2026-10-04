import { get } from './requester.js';
export async function fetchAppRuntimeInfoFromServer() {
  const get2 = await get('/api/v2/runtime/info', { provider: 'local' });
  return get2;
}
