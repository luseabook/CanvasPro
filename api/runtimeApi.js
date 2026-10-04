import { get } from './requester.js';
export async function fetchAppRuntimeInfoFromServer() {
  const get = await get('/api/v2/runtime/info', { provider: 'local' });
  return get;
}
