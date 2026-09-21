import { buildApiUrl } from './apiBase.js';
import { get, post } from './requester.js';
const USER_FILE = 'shortcuts.json';
export async function fetchUserShortcutsFromServer() {
  const _0x2296eb = await get('/api/v2/user/' + USER_FILE, { provider: 'local' });
  return _0x2296eb;
}
export async function saveUserShortcutsToServer(_0x39fdb4) {
  return (await post('/api/v2/user/' + USER_FILE, _0x39fdb4 || {}, { provider: 'local' }), true);
}
