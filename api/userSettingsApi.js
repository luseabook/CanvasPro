import { get, post } from './requester.js';
export async function fetchUserSettingsFromServer() {
  const get2 = await get('/api/v2/user/settings.json', { provider: 'local' });
  return get2;
}
export async function saveUserSettingsToServer(value) {
  return await post('/api/v2/user/settings.json', value || {}, { provider: 'local' });
}
export async function startFileSavePathMigration(settings, { confirmed = false } = {}) {
  return await post(
    '/api/v2/user/file-save-paths/migration/start',
    { settings: settings || {}, confirmed: confirmed === true },
    { provider: 'local', timeout: 0x2710 },
  );
}
export async function fetchFileSavePathMigrationStatus(item) {
  const encodeURIComponent2 = encodeURIComponent(String(item || ''));
  return await get('/api/v2/user/file-save-paths/migration/status?jobId=' + encodeURIComponent2, {
    provider: 'local',
    timeout: 0x2710,
  });
}
export async function fetchLegacyFileSaveCandidates() {
  return await get('/api/v2/user/file-save-paths/legacy/candidates', {
    provider: 'local',
    timeout: 30000,
  });
}
export async function startLegacyFileSaveCopy({ candidateId, fingerprint, confirmed = false } = {}) {
  return await post(
    '/api/v2/user/file-save-paths/legacy/start',
    {
      candidateId,
      fingerprint,
      confirmed: confirmed === true,
    },
    { provider: 'local', timeout: 10000 },
  );
}
