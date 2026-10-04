import { buildApiUrl } from './apiBase.js';
import { get, post } from './requester.js';
const USER_FILE = 'shortcuts.json';
export async function fetchUserShortcutsFromServer() {
  const get = await get('/api/v2/user/' + USER_FILE, { provider: 'local' });
  return get;
}
export async function saveUserShortcutsToServer(value) {
  return (await post('/api/v2/user/' + USER_FILE, value || {}, { provider: 'local' }), true);
}
