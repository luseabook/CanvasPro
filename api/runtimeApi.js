import { get } from './requester.js';
export async function fetchAppRuntimeInfoFromServer() {
  const _0x162f85 = await get('/api/v2/runtime/info', { provider: 'local' });
  return _0x162f85;
}
