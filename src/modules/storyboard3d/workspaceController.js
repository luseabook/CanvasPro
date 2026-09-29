import {
  getStoryboard3DModelPackStatus,
  installStoryboard3DModelPack,
} from '../../../api/storyboard3dModelPackApi.js';
import appStore from '../../core/stores/appStore.js';
import { t } from '../../i18n/index.js';
import { commit } from '../history.js';
import {
  closeActiveStoryboard3DEditor,
  openStoryboard3DProjectEditor,
  getActiveStoryboard3DEditorSession,
} from './editorLauncher.js';
import { generateStoryboard3DProjectDraft } from './projectGeneration.js';
import { createDirectorGenerationService } from './directorGenerationService.js';
import { recordDirectorDeletions } from './directorRecovery.js';
import { createStoryboard3DProject, migrateStoryboard3DProject } from './projectModel.js';
import { saveStoryboard3DProjectAsCopy } from './sceneProjectOperations.js';
import { getStoryboard3DWorkspaceProjects, initStoryboard3DWorkspaceHome } from './workspaceHome.js';
const EDITOR_OPENED_EVENT = 'storyboard-3d:editor-opened',
  EDITOR_CLOSED_EVENT = 'storyboard-3d:editor-closed',
  SAVE_AS_COPY_EVENT = 'storyboard-3d:save-as-copy';
function getStoreState(_0x3b8d08) {
  return _0x3b8d08?.['getStateRaw']?.() || _0x3b8d08?.['getState']?.() || {};
}
function createWorkspaceItemId(_0x620f16 = 'item', _0x1ca717 = globalThis['window']) {
  const _0x1450e1 = _0x1ca717?.['crypto']?.['randomUUID']?.() || globalThis['crypto']?.['randomUUID']?.();
  if (_0x1450e1) return _0x620f16 + '_' + _0x1450e1;
  return _0x620f16 + '_' + Date['now']() + '_' + Math['random']()['toString'](0x24)['slice'](0x2, 0xa);
}
function enqueueMicrotask(_0x26f212, _0x461c88) {
  if (typeof _0x26f212?.['queueMicrotask'] === 'function') {
    _0x26f212['queueMicrotask'](_0x461c88);
    return;
  }
  if (typeof globalThis['queueMicrotask'] === 'function') {
    globalThis['queueMicrotask'](_0x461c88);
    return;
  }
  Promise['resolve']()['then'](_0x461c88);
}
export function createStoryboard3DWorkspaceController({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  storeInstance: storeInstance = appStore,
  commitChanges: commitChanges = commit,
  translate: translate = t,
  modelPackApi: modelPackApi = {
    getStatus: getStoryboard3DModelPackStatus,
    install: installStoryboard3DModelPack,
  },
  createWorkspaceHome: createWorkspaceHome = initStoryboard3DWorkspaceHome,
  getProjects: getProjects = getStoryboard3DWorkspaceProjects,
  createProjectModel: createProjectModel = createStoryboard3DProject,
  migrateProjectModel: migrateProjectModel = migrateStoryboard3DProject,
  copyProject: copyProject = saveStoryboard3DProjectAsCopy,
  generateProjectDraft: generateProjectDraft = generateStoryboard3DProjectDraft,
  openProjectEditor: openProjectEditor = openStoryboard3DProjectEditor,
  closeActiveEditor: closeActiveEditor = closeActiveStoryboard3DEditor,
  getWorkspaceModeCoordinator: getWorkspaceModeCoordinator = () => null,
  showNotification: showNotification = (_0x58e636, _0x5234e3) =>
    windowObject?.['showToast']?.(_0x58e636, _0x5234e3),
  now: now = () => Date['now'](),
  idFactory: idFactory = (_0xcb3f88) => createWorkspaceItemId(_0xcb3f88, windowObject),
} = {}) {
  if (typeof storeInstance?.['upsertStoryboard3DProject'] !== 'function')
    throw new TypeError('Storyboard 3D Workspace requires project upsert capability.');
  if (typeof storeInstance?.['deleteStoryboard3DProject'] !== 'function')
    throw new TypeError('Storyboard 3D Workspace requires project delete capability.');
  let _0x58b05f = ![];
  const _0x4d6052 = (_0x29a4a9) => {
      const _0x25deb1 = String(_0x29a4a9 || '')['trim']();
      if (!_0x25deb1) return null;
      const _0xb3060f = getStoreState(storeInstance),
        _0x2bbba1 = Array['isArray'](_0xb3060f['storyboard3dProjects'])
          ? _0xb3060f['storyboard3dProjects']
          : [];
      return _0x2bbba1['find']((_0x615d0b) => String(_0x615d0b?.['id'] || '') === _0x25deb1) || null;
    },
    _0x3f93bb = (_0x5c1873) => {
      const _0x482421 = String(_0x5c1873 || '')['trim']();
      if (!_0x482421 || _0x58b05f) return null;
      return (
        _0x1951ec['recover'](_0x482421),
        openProjectEditor({
          projectId: _0x482421,
          storeInstance: storeInstance,
          commitChanges: commitChanges,
          documentObject: documentObject,
          windowObject: windowObject,
        })
      );
    },
    _0x1951ec = createDirectorGenerationService({
      getProject: (_0x425577) => {
        const _0x4e02d1 = getActiveStoryboard3DEditorSession();
        return _0x4e02d1?.['projectId'] === _0x425577
          ? _0x4e02d1['workspace']['projectStore']['getSnapshot']()
          : _0x4d6052(_0x425577);
      },
      commitProject: (_0x41b943, _0x456f15, { history: _0x544e3b, label: _0x210bc6 }) => {
        const _0x1f4ac5 = getActiveStoryboard3DEditorSession();
        if (_0x1f4ac5?.['projectId'] === _0x41b943 && !_0x1f4ac5['workspace']['_closed']) {
          const _0x2a2c66 = _0x1f4ac5['workspace'];
          _0x544e3b
            ? (_0x2a2c66['_executeMutation']({
                type: 'director-generation',
                label: _0x210bc6,
                mutate: _0x456f15,
              }),
              void _0x2a2c66['_hydratePackAssetsForProject']())
            : (_0x2a2c66['projectStore']['updateProject']('director-generation-status', (_0x537cf5) =>
                Object['assign'](_0x537cf5, _0x456f15(_0x537cf5)),
              ),
              _0x2a2c66['_render']());
          return;
        }
        const _0x52170c = _0x4d6052(_0x41b943);
        if (!_0x52170c) return;
        const _0x33774c = _0x456f15(structuredClone(_0x52170c));
        (storeInstance['upsertStoryboard3DProject'](
          migrateProjectModel(
            _0x544e3b ? recordDirectorDeletions(_0x52170c, _0x33774c, _0x210bc6) : _0x33774c,
          ),
        ),
          commitChanges?.());
      },
      notify: showNotification,
      generateDraft: generateProjectDraft,
      urlApi: windowObject?.['URL'] || globalThis['URL'],
    }),
    _0x21234f = (_0x4c2ac0) => {
      void _0x1951ec['start'](_0x4c2ac0['detail'] || {})['catch']((_0x55cdd1) =>
        showNotification(_0x55cdd1['message'], 'error'),
      );
    };
  windowObject?.['addEventListener']?.('storyboard-3d:generate-layer', _0x21234f);
  const _0x294b81 = ({ project: project = null } = {}) => {
      if (_0x58b05f) return null;
      const _0x1c780f = getProjects(getStoreState(storeInstance))['length'],
        _0x4c8345 = translate('storyboard3d.defaults.projectName'),
        _0x410904 = String(project?.['name'] || '')['trim'](),
        _0x52cf51 = _0x410904 || (_0x1c780f > 0x0 ? _0x4c8345 + '\x20' + (_0x1c780f + 0x1) : _0x4c8345),
        _0x5c4207 = project
          ? migrateProjectModel({ ...project, name: _0x52cf51 })
          : createProjectModel({ name: _0x52cf51 });
      return (
        storeInstance['upsertStoryboard3DProject'](_0x5c4207),
        commitChanges?.(),
        _0x3f93bb(_0x5c4207['id'])
      );
    },
    _0x423a24 = async (_0x1a2567 = {}) => {
      if (_0x58b05f) return null;
      const _0x5e9316 = await generateProjectDraft(_0x1a2567);
      if (_0x58b05f) return null;
      return _0x294b81({ project: _0x5e9316 });
    },
    _0x3ab8e1 = (_0x58e71d) => {
      const _0x5c0f91 = _0x4d6052(_0x58e71d);
      if (!_0x5c0f91 || _0x58b05f) return null;
      const _0x33b3fc = copyProject(_0x5c0f91, {
        name: (_0x5c0f91['name'] || '3D Storyboard') + ' 副本',
        now: now(),
        idFactory: idFactory,
      });
      return (storeInstance['upsertStoryboard3DProject'](_0x33b3fc), commitChanges?.(), _0x33b3fc);
    },
    _0x4d44d1 = (_0x56d8ce, _0x2e0d75) => {
      const _0x144b50 = _0x4d6052(_0x56d8ce),
        _0x13f45c = String(_0x2e0d75 || '')['trim']();
      if (!_0x144b50 || !_0x13f45c || _0x58b05f) return null;
      const _0x17242b = { ..._0x144b50, name: _0x13f45c, updatedAt: now() };
      return (storeInstance['upsertStoryboard3DProject'](_0x17242b), commitChanges?.(), _0x17242b);
    },
    _0x548123 = (_0x46ed33) => {
      if (_0x58b05f) return ![];
      const _0x32c5cc = storeInstance['deleteStoryboard3DProject'](_0x46ed33);
      if (_0x32c5cc) commitChanges?.();
      return _0x32c5cc;
    },
    _0x327433 = createWorkspaceHome({
      documentObject: documentObject,
      modelPackApi: modelPackApi,
      getProjects: () => getProjects(getStoreState(storeInstance)),
      onCreateProject: () => _0x294b81(),
      onGenerateProject: _0x423a24,
      onOpenProject: _0x3f93bb,
      onCloneProject: _0x3ab8e1,
      onRenameProject: _0x4d44d1,
      onDeleteProject: _0x548123,
      onNotify: showNotification,
    }),
    _0x4fa91f = () => {
      if (_0x58b05f) return;
      const _0x49557d = getWorkspaceModeCoordinator?.();
      (_0x49557d?.['getMode']?.() !== 'storyboard3d' &&
        _0x49557d?.['setMode']?.('storyboard3d', { activate: ![] }),
        _0x327433['hide']());
    },
    _0x31b3aa = (_0x3817f2) => {
      if (_0x58b05f) return;
      const _0x532be6 = getWorkspaceModeCoordinator?.();
      if (_0x532be6?.['getMode']?.() !== 'storyboard3d') return;
      enqueueMicrotask(windowObject, () => {
        if (_0x58b05f || getWorkspaceModeCoordinator?.()?.['getMode']?.() !== 'storyboard3d') return;
        (_0x327433['show'](), _0x327433['focusProject'](_0x3817f2?.['detail']?.['projectId']));
      });
    },
    _0x54297e = (_0x822857) => {
      const _0x447f66 = _0x822857?.['detail']?.['project'];
      if (!_0x447f66 || _0x58b05f) return;
      _0x294b81({ project: _0x447f66 });
    };
  return (
    windowObject?.['addEventListener']?.(EDITOR_OPENED_EVENT, _0x4fa91f),
    windowObject?.['addEventListener']?.(EDITOR_CLOSED_EVENT, _0x31b3aa),
    windowObject?.['addEventListener']?.(SAVE_AS_COPY_EVENT, _0x54297e),
    Object['freeze']({
      openHome() {
        if (_0x58b05f) return null;
        return (closeActiveEditor?.(), _0x327433['show']());
      },
      close() {
        if (_0x58b05f) return ![];
        return (_0x327433['hide'](), closeActiveEditor?.(), !![]);
      },
      dispose() {
        if (_0x58b05f) return;
        ((_0x58b05f = !![]),
          _0x1951ec['dispose'](),
          windowObject?.['removeEventListener']?.('storyboard-3d:generate-layer', _0x21234f),
          windowObject?.['removeEventListener']?.(EDITOR_OPENED_EVENT, _0x4fa91f),
          windowObject?.['removeEventListener']?.(EDITOR_CLOSED_EVENT, _0x31b3aa),
          windowObject?.['removeEventListener']?.(SAVE_AS_COPY_EVENT, _0x54297e),
          _0x327433['destroy']?.());
      },
    })
  );
}
