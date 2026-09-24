export const PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION = 0x2;
function normalizeText(_0x1b34eb) {
  return String(_0x1b34eb ?? '')['trim']();
}
function cloneJson(_0x4c2eff) {
  if (!_0x4c2eff || typeof _0x4c2eff !== 'object') return _0x4c2eff;
  return JSON['parse'](JSON['stringify'](_0x4c2eff));
}
const RUNTIME_PROJECT_FIELDS = new Set(['libraryProjects', 'libraryAssets', 'sourcePreviewRefs']);
function stripRuntimeProjectFields(_0x2505f7) {
  if (!_0x2505f7 || typeof _0x2505f7 !== 'object' || Array['isArray'](_0x2505f7)) return _0x2505f7;
  return Object['fromEntries'](
    Object['entries'](_0x2505f7)['filter'](([_0x219e68]) => !RUNTIME_PROJECT_FIELDS['has'](_0x219e68)),
  );
}
function getProjectId(_0x47c80f) {
  return normalizeText(_0x47c80f?.['id'] || _0x47c80f?.['project']?.['id']);
}
function getProjectUpdatedTime(_0x21d185) {
  const _0x330070 = _0x21d185?.['updatedAt'] || _0x21d185?.['project']?.['updatedAt'],
    _0x32c944 = Date['parse'](_0x330070 || '');
  return Number['isFinite'](_0x32c944) ? _0x32c944 : 0x0;
}
function normalizeProjectEntry(_0x1acc7f) {
  if (!_0x1acc7f || typeof _0x1acc7f !== 'object' || Array['isArray'](_0x1acc7f)) return null;
  const _0x271b74 = getProjectId(_0x1acc7f);
  if (!_0x271b74) return null;
  return { ...cloneJson(stripRuntimeProjectFields(_0x1acc7f)), id: _0x271b74 };
}
function collectPersistedProjects(_0x345c59) {
  if (!_0x345c59 || typeof _0x345c59 !== 'object') return [];
  if (Array['isArray'](_0x345c59['projects'])) return _0x345c59['projects'];
  const _0x18517f = _0x345c59['project'] || _0x345c59['currentProject'] || _0x345c59['data'];
  if (_0x18517f && typeof _0x18517f === 'object') return [_0x18517f];
  return getProjectId(_0x345c59) ? [_0x345c59] : [];
}
export function normalizePersonReplacementProjectLibrary(_0x4d34d6 = {}) {
  const _0xa21f9f = new Map();
  collectPersistedProjects(_0x4d34d6)['forEach']((_0xca8123) => {
    const _0xb6cd22 = normalizeProjectEntry(_0xca8123);
    if (!_0xb6cd22) return;
    const _0xd66cb = _0xa21f9f['get'](_0xb6cd22['id']);
    (!_0xd66cb || getProjectUpdatedTime(_0xb6cd22) >= getProjectUpdatedTime(_0xd66cb)) &&
      _0xa21f9f['set'](_0xb6cd22['id'], _0xb6cd22);
  });
  const _0x384e2d = [..._0xa21f9f['values']()]['sort'](
      (_0x37c6ca, _0x2bdbb2) => getProjectUpdatedTime(_0x2bdbb2) - getProjectUpdatedTime(_0x37c6ca),
    ),
    _0x2e9600 = normalizeText(
      _0x4d34d6?.['currentProjectId'] ||
        _0x4d34d6?.['project']?.['id'] ||
        _0x4d34d6?.['currentProject']?.['id'],
    ),
    _0x24a11a = _0x384e2d['some']((_0x4916e8) => _0x4916e8['id'] === _0x2e9600)
      ? _0x2e9600
      : _0x384e2d[0x0]?.['id'] || '';
  return {
    schemaVersion: PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION,
    currentProjectId: _0x24a11a,
    projects: _0x384e2d,
  };
}
export function upsertPersonReplacementProject(_0x4bcb36, _0x5a3254) {
  const _0x234cdb = normalizePersonReplacementProjectLibrary(_0x4bcb36),
    _0x5e0950 = normalizeProjectEntry(_0x5a3254);
  if (!_0x5e0950) return _0x234cdb;
  return {
    ..._0x234cdb,
    currentProjectId: _0x5e0950['id'],
    projects: [
      _0x5e0950,
      ..._0x234cdb['projects']['filter']((_0x3be471) => _0x3be471['id'] !== _0x5e0950['id']),
    ]['sort']((_0x4f0dff, _0x24c305) => getProjectUpdatedTime(_0x24c305) - getProjectUpdatedTime(_0x4f0dff)),
  };
}
export function removePersonReplacementProject(_0x185efa, _0x45e484) {
  const _0x3c69b7 = normalizePersonReplacementProjectLibrary(_0x185efa),
    _0x1efd32 = normalizeText(_0x45e484),
    _0x4366c6 = _0x3c69b7['projects']['filter']((_0x3a1a90) => _0x3a1a90['id'] !== _0x1efd32);
  return {
    ..._0x3c69b7,
    currentProjectId:
      _0x3c69b7['currentProjectId'] === _0x1efd32
        ? _0x4366c6[0x0]?.['id'] || ''
        : _0x3c69b7['currentProjectId'],
    projects: _0x4366c6,
  };
}
