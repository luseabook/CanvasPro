import appStore from '../../core/stores/appStore.js';
import { commit } from '../history.js';
import { openStoryboard3DEditor } from './editorWorkspace.js';
import { migrateStoryboard3DProject } from './projectModel.js';
let activeSession = null;
function getStoreState(store) {
  return store?.getStateRaw?.() || store?.getState?.() || {};
}
export function getActiveStoryboard3DEditorSession() {
  return activeSession;
}
export function persistStoryboard3DProjectChange({
  project: project,
  storeInstance: storeInstance = appStore,
  windowObject: windowObject = globalThis.window,
} = {}) {
  if (typeof storeInstance?.upsertStoryboard3DProject !== 'function') return false;
  storeInstance.upsertStoryboard3DProject(project);
  const value = windowObject?._triggerLocalCacheSave;
  if (typeof value !== 'function') return true;
  const promise = value.call(windowObject);
  return promise && typeof promise.then === 'function' ? promise.then(() => true) : true;
}
export function closeActiveStoryboard3DEditor({ persist: persist = true } = {}) {
  if (!activeSession?.workspace) return false;
  return (activeSession.workspace.close({ persist: persist }), true);
}
export function openStoryboard3DProjectEditor({
  projectId: projectId,
  storeInstance: storeInstance = appStore,
  commitChanges: commitChanges = commit,
  onClose: onClose,
  documentObject: documentObject = globalThis.document,
  windowObject: windowObject = globalThis.window,
} = {}) {
  const projectId2 = String(projectId || '').trim();
  if (!projectId2) return null;
  if (activeSession?.projectId === projectId2 && activeSession.workspace?.root)
    return activeSession.workspace;
  activeSession?.workspace && activeSession.workspace.close();
  const enabled = (getStoreState(storeInstance).storyboard3dProjects || []).find(
    (item) => String(item?.id || '') === projectId2,
  );
  if (!enabled) return null;
  const project2 = migrateStoryboard3DProject(enabled),
    onProjectChange = (project3) =>
      persistStoryboard3DProjectChange({
        project: project3,
        storeInstance: storeInstance,
        windowObject: windowObject,
      }),
    workspace = openStoryboard3DEditor({
      projectId: projectId2,
      project: project2,
      documentObject: documentObject,
      windowObject: windowObject,
      onProjectChange: onProjectChange,
      onClose: (key, index) => {
        const promise2 = onProjectChange(index);
        promise2 && typeof promise2.catch === 'function' && promise2.catch(() => {});
        activeSession = null;
        if (promise2) commitChanges?.();
        onClose?.(key, index);
      },
    });
  return (
    (activeSession = { projectId: projectId2, workspace: workspace }),
    workspace &&
      windowObject?.dispatchEvent &&
      typeof windowObject.CustomEvent === 'function' &&
      windowObject.dispatchEvent(
        new windowObject.CustomEvent('storyboard-3d:editor-opened', { detail: { projectId: projectId2 } }),
      ),
    workspace
  );
}
