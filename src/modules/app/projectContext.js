export const DEFAULT_APP_PROJECT_ID = 'default_v2_project';
function readProjectId(value) {
  return String(value?.currentProjectId || '').trim();
}
export function createAppProjectContext({
  windowObject: windowObject = globalThis.window,
  defaultProjectId: defaultProjectId = DEFAULT_APP_PROJECT_ID,
} = {}) {
  const item = String(defaultProjectId || '').trim() || DEFAULT_APP_PROJECT_ID,
    getCurrentProjectIdOrNull = () => readProjectId(windowObject) || null;
  return {
    getCurrentProjectId: () => getCurrentProjectIdOrNull() || item,
    getCurrentProjectIdOrNull: getCurrentProjectIdOrNull,
  };
}
