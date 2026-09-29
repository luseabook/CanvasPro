export const DEFAULT_APP_PROJECT_ID = 'default_v2_project';
function readProjectId(_0x495d5b) {
  return String(_0x495d5b?.['currentProjectId'] || '')['trim']();
}
export function createAppProjectContext({
  windowObject: windowObject = globalThis['window'],
  defaultProjectId: defaultProjectId = DEFAULT_APP_PROJECT_ID,
} = {}) {
  const _0x5cfd67 = String(defaultProjectId || '')['trim']() || DEFAULT_APP_PROJECT_ID,
    _0x4d8728 = () => readProjectId(windowObject) || null;
  return { getCurrentProjectId: () => _0x4d8728() || _0x5cfd67, getCurrentProjectIdOrNull: _0x4d8728 };
}
