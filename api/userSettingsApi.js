import { get, post } from './requester.js';
export async function fetchUserSettingsFromServer() {
  const _0x492da5 = await get('/api/v2/user/settings.json', { provider: 'local' });
  return _0x492da5;
}
export async function saveUserSettingsToServer(_0x4bbdf6) {
  return await post('/api/v2/user/settings.json', _0x4bbdf6 || {}, { provider: 'local' });
}
export async function startFileSavePathMigration(_0x2ce5bb, { confirmed = false } = {}) {
  return await post(
    '/api/v2/user/file-save-paths/migration/start',
    { settings: _0x2ce5bb || {}, confirmed: confirmed === true },
    { provider: 'local', timeout: 0x2710 },
  );
}
export async function fetchFileSavePathMigrationStatus(_0x40e1b5) {
  const _0x31056c = encodeURIComponent(String(_0x40e1b5 || ''));
  return await get('/api/v2/user/file-save-paths/migration/status?jobId=' + _0x31056c, {
    provider: 'local',
    timeout: 0x2710,
  });
}
export async function fetchLegacyFileSaveCandidates() {
  return await get('/api/v2/user/file-save-paths/legacy/candidates', {
    provider: 'local', timeout: 30000,
  });
}
export async function startLegacyFileSaveCopy({ candidateId, fingerprint, confirmed = false } = {}) {
  return await post('/api/v2/user/file-save-paths/legacy/start', {
    candidateId, fingerprint, confirmed: confirmed === true,
  }, { provider: 'local', timeout: 10000 });
}
