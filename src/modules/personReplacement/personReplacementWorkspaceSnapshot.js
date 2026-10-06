import { normalizePersonReplacementWorkspaceProject } from './personReplacementProjectSession.js';
export function refreshPersonReplacementWorkspaceAssets(args, value) {
  let libraryAssets;
  try {
    libraryAssets = value?.();
  } catch {
    return args;
  }
  return Array.isArray(libraryAssets)
    ? normalizePersonReplacementWorkspaceProject({ ...args, libraryAssets: libraryAssets })
    : args;
}
export function buildPersonReplacementWorkspaceSnapshot({
  project: project,
  libraryProjects: libraryProjects,
  libraryAssets: libraryAssets2,
  sourcePreviewUrls: sourcePreviewUrls,
  persistenceState: persistenceState,
  workspaceView: workspaceView,
} = {}) {
  const map = new Set(project.sources.map((item) => item.id));
  return JSON.parse(
    JSON.stringify({
      ...project,
      sourcePreviewRefs: Object.fromEntries(
        [...sourcePreviewUrls.entries()].flatMap(([key, index]) => {
          const [result, data] = key.split('\x1f');
          return result === String(project.id || '').trim() && map.has(data) ? [[data, index]] : [];
        }),
      ),
      libraryProjects: libraryProjects,
      libraryAssets: libraryAssets2,
      persistenceState: persistenceState,
      workspace: { ...project.workspace, view: workspaceView },
    }),
  );
}
