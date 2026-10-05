export const PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION = 2;
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneJson(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  return JSON['parse'](JSON['stringify'](enabled));
}
const RUNTIME_PROJECT_FIELDS = new Set(['libraryProjects', 'libraryAssets', 'sourcePreviewRefs']);
function stripRuntimeProjectFields(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object' || Array['isArray'](enabled2)) return enabled2;
  return Object['fromEntries'](
    Object['entries'](enabled2)['filter'](([item]) => !RUNTIME_PROJECT_FIELDS['has'](item)),
  );
}
function getProjectId(key) {
  return normalizeText(key?.['id'] || key?.['project']?.['id']);
}
function getProjectUpdatedTime(index) {
  const result = index?.['updatedAt'] || index?.['project']?.['updatedAt'],
    data = Date['parse'](result || '');
  return Number['isFinite'](data) ? data : 0;
}
function normalizeProjectEntry(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object' || Array['isArray'](enabled3)) return null;
  const id = getProjectId(enabled3);
  if (!id) return null;
  return { ...cloneJson(stripRuntimeProjectFields(enabled3)), id: id };
}
function collectPersistedProjects(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return [];
  if (Array['isArray'](enabled4['projects'])) return enabled4['projects'];
  const options = enabled4['project'] || enabled4['currentProject'] || enabled4['data'];
  if (options && typeof options === 'object') return [options];
  return getProjectId(enabled4) ? [enabled4] : [];
}
export function normalizePersonReplacementProjectLibrary(options2 = {}) {
  const map = new Map();
  collectPersistedProjects(options2)['forEach']((target) => {
    const projectEntry = normalizeProjectEntry(target);
    if (!projectEntry) return;
    const enabled5 = map['get'](projectEntry['id']);
    (!enabled5 || getProjectUpdatedTime(projectEntry) >= getProjectUpdatedTime(enabled5)) &&
      map['set'](projectEntry['id'], projectEntry);
  });
  const projects = [...map['values']()]['sort'](
      (source, next) => getProjectUpdatedTime(next) - getProjectUpdatedTime(source),
    ),
    text = normalizeText(
      options2?.['currentProjectId'] || options2?.['project']?.['id'] || options2?.['currentProject']?.['id'],
    ),
    currentProjectId = projects['some']((current) => current['id'] === text)
      ? text
      : projects[0]?.['id'] || '';
  return {
    schemaVersion: PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION,
    currentProjectId: currentProjectId,
    projects: projects,
  };
}
export function upsertPersonReplacementProject(entry, record) {
  const args = normalizePersonReplacementProjectLibrary(entry),
    currentProjectId2 = normalizeProjectEntry(record);
  if (!currentProjectId2) return args;
  return {
    ...args,
    currentProjectId: currentProjectId2['id'],
    projects: [
      currentProjectId2,
      ...args['projects']['filter']((payload) => payload['id'] !== currentProjectId2['id']),
    ]['sort']((handle, state) => getProjectUpdatedTime(state) - getProjectUpdatedTime(handle)),
  };
}
export function removePersonReplacementProject(config, scope) {
  const currentProjectId3 = normalizePersonReplacementProjectLibrary(config),
    text2 = normalizeText(scope),
    projects2 = currentProjectId3['projects']['filter']((input) => input['id'] !== text2);
  return {
    ...currentProjectId3,
    currentProjectId:
      currentProjectId3['currentProjectId'] === text2
        ? projects2[0]?.['id'] || ''
        : currentProjectId3['currentProjectId'],
    projects: projects2,
  };
}
