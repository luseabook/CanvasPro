import appStore from '../../core/stores/appStore.js';
import { commit } from '../history.js';
import { openStoryboard3DEditor } from './editorWorkspace.js';
import { migrateStoryboard3DProject } from './projectModel.js';
let activeSession = null;
function getStoreState(_0x331fad) {
  return _0x331fad?.['getStateRaw']?.() || _0x331fad?.['getState']?.() || {};
}
export function getActiveStoryboard3DEditorSession() {
  return activeSession;
}
export function persistStoryboard3DProjectChange({
  project: _0x386fd7,
  storeInstance: storeInstance = appStore,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  if (typeof storeInstance?.['upsertStoryboard3DProject'] !== 'function') return ![];
  storeInstance['upsertStoryboard3DProject'](_0x386fd7);
  const _0x5e96cc = windowObject?.['_triggerLocalCacheSave'];
  if (typeof _0x5e96cc !== 'function') return !![];
  const _0x236b53 = _0x5e96cc['call'](windowObject);
  return _0x236b53 && typeof _0x236b53['then'] === 'function' ? _0x236b53['then'](() => !![]) : !![];
}
export function closeActiveStoryboard3DEditor({ persist: persist = !![] } = {}) {
  if (!activeSession?.['workspace']) return ![];
  return (activeSession['workspace']['close']({ persist: persist }), !![]);
}
export function openStoryboard3DProjectEditor({
  projectId: _0x481eb3,
  storeInstance: storeInstance = appStore,
  commitChanges: commitChanges = commit,
  onClose: _0x2a119d,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x2ebaea = String(_0x481eb3 || '')['trim']();
  if (!_0x2ebaea) return null;
  if (activeSession?.['projectId'] === _0x2ebaea && activeSession['workspace']?.['root'])
    return activeSession['workspace'];
  activeSession?.['workspace'] && activeSession['workspace']['close']();
  const _0x4ada1b = (getStoreState(storeInstance)['storyboard3dProjects'] || [])['find'](
    (_0x20e1e3) => String(_0x20e1e3?.['id'] || '') === _0x2ebaea,
  );
  if (!_0x4ada1b) return null;
  const _0x9d931c = migrateStoryboard3DProject(_0x4ada1b),
    _0x3c20a8 = (_0x44d944) =>
      persistStoryboard3DProjectChange({
        project: _0x44d944,
        storeInstance: storeInstance,
        windowObject: windowObject,
      }),
    _0x18cb68 = openStoryboard3DEditor({
      projectId: _0x2ebaea,
      project: _0x9d931c,
      documentObject: documentObject,
      windowObject: windowObject,
      onProjectChange: _0x3c20a8,
      onClose: (_0x449dc6, _0x432cb1) => {
        const _0x58680c = _0x3c20a8(_0x432cb1);
        _0x58680c && typeof _0x58680c['catch'] === 'function' && _0x58680c['catch'](() => {});
        activeSession = null;
        if (_0x58680c) commitChanges?.();
        _0x2a119d?.(_0x449dc6, _0x432cb1);
      },
    });
  return (
    (activeSession = { projectId: _0x2ebaea, workspace: _0x18cb68 }),
    _0x18cb68 &&
      windowObject?.['dispatchEvent'] &&
      typeof windowObject['CustomEvent'] === 'function' &&
      windowObject['dispatchEvent'](
        new windowObject['CustomEvent']('storyboard-3d:editor-opened', { detail: { projectId: _0x2ebaea } }),
      ),
    _0x18cb68
  );
}
