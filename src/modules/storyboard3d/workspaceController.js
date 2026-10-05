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
function getStoreState(store) {
  return store?.['getStateRaw']?.() || store?.['getState']?.() || {};
}
function createWorkspaceItemId(value = 'item', item = globalThis['window']) {
  const key = item?.['crypto']?.['randomUUID']?.() || globalThis['crypto']?.['randomUUID']?.();
  if (key) return value + '_' + key;
  return value + '_' + Date['now']() + '_' + Math['random']()['toString'](36)['slice'](2, 10);
}
function enqueueMicrotask(index, result) {
  if (typeof index?.['queueMicrotask'] === 'function') {
    index['queueMicrotask'](result);
    return;
  }
  if (typeof globalThis['queueMicrotask'] === 'function') {
    globalThis['queueMicrotask'](result);
    return;
  }
  Promise['resolve']()['then'](result);
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
  showNotification: showNotification = (data, options) => windowObject?.['showToast']?.(data, options),
  now: now = () => Date['now'](),
  idFactory: idFactory = (target) => createWorkspaceItemId(target, windowObject),
} = {}) {
  if (typeof storeInstance?.['upsertStoryboard3DProject'] !== 'function')
    throw new TypeError('Storyboard 3D Workspace requires project upsert capability.');
  if (typeof storeInstance?.['deleteStoryboard3DProject'] !== 'function')
    throw new TypeError('Storyboard 3D Workspace requires project delete capability.');
  let source = false;
  const run = (next) => {
      const enabled = String(next || '')['trim']();
      if (!enabled) return null;
      const storeState = getStoreState(storeInstance),
        list = Array['isArray'](storeState['storyboard3dProjects']) ? storeState['storyboard3dProjects'] : [];
      return list['find']((current) => String(current?.['id'] || '') === enabled) || null;
    },
    onOpenProject = (entry) => {
      const projectId = String(entry || '')['trim']();
      if (!projectId || source) return null;
      return (
        directorGenerationService['recover'](projectId),
        openProjectEditor({
          projectId: projectId,
          storeInstance: storeInstance,
          commitChanges: commitChanges,
          documentObject: documentObject,
          windowObject: windowObject,
        })
      );
    },
    directorGenerationService = createDirectorGenerationService({
      getProject: (record) => {
        const activeStoryboard3DEditorSession = getActiveStoryboard3DEditorSession();
        return activeStoryboard3DEditorSession?.['projectId'] === record
          ? activeStoryboard3DEditorSession['workspace']['projectStore']['getSnapshot']()
          : run(record);
      },
      commitProject: (payload, mutate, { history: history, label: label }) => {
        const activeStoryboard3DEditorSession2 = getActiveStoryboard3DEditorSession();
        if (
          activeStoryboard3DEditorSession2?.['projectId'] === payload &&
          !activeStoryboard3DEditorSession2['workspace']['_closed']
        ) {
          const handle = activeStoryboard3DEditorSession2['workspace'];
          history
            ? (handle['_executeMutation']({
                type: 'director-generation',
                label: label,
                mutate: mutate,
              }),
              void handle['_hydratePackAssetsForProject']())
            : (handle['projectStore']['updateProject']('director-generation-status', (state) =>
                Object['assign'](state, mutate(state)),
              ),
              handle['_render']());
          return;
        }
        const enabled2 = run(payload);
        if (!enabled2) return;
        const config = mutate(structuredClone(enabled2));
        (storeInstance['upsertStoryboard3DProject'](
          migrateProjectModel(history ? recordDirectorDeletions(enabled2, config, label) : config),
        ),
          commitChanges?.());
      },
      notify: showNotification,
      generateDraft: generateProjectDraft,
      urlApi: windowObject?.['URL'] || globalThis['URL'],
    }),
    scope = (input) => {
      void directorGenerationService['start'](input['detail'] || {})['catch']((error) =>
        showNotification(error['message'], 'error'),
      );
    };
  windowObject?.['addEventListener']?.('storyboard-3d:generate-layer', scope);
  const run2 = ({ project: project = null } = {}) => {
      if (source) return null;
      const projects = getProjects(getStoreState(storeInstance))['length'],
        translate2 = translate('storyboard3d.defaults.projectName'),
        output = String(project?.['name'] || '')['trim'](),
        name = output || (projects > 0 ? translate2 + ' ' + (projects + 1) : translate2),
        value2 = project
          ? migrateProjectModel({ ...project, name: name })
          : createProjectModel({ name: name });
      return (
        storeInstance['upsertStoryboard3DProject'](value2),
        commitChanges?.(),
        onOpenProject(value2['id'])
      );
    },
    onGenerateProject = async (options2 = {}) => {
      if (source) return null;
      const project2 = await generateProjectDraft(options2);
      if (source) return null;
      return run2({ project: project2 });
    },
    onCloneProject = (value3) => {
      const error2 = run(value3);
      if (!error2 || source) return null;
      const copyProject2 = copyProject(error2, {
        name: (error2['name'] || '3D Storyboard') + ' 副本',
        now: now(),
        idFactory: idFactory,
      });
      return (storeInstance['upsertStoryboard3DProject'](copyProject2), commitChanges?.(), copyProject2);
    },
    onRenameProject = (value4, value5) => {
      const args = run(value4),
        name2 = String(value5 || '')['trim']();
      if (!args || !name2 || source) return null;
      const value6 = { ...args, name: name2, updatedAt: now() };
      return (storeInstance['upsertStoryboard3DProject'](value6), commitChanges?.(), value6);
    },
    onDeleteProject = (value7) => {
      if (source) return false;
      const value8 = storeInstance['deleteStoryboard3DProject'](value7);
      if (value8) commitChanges?.();
      return value8;
    },
    workspaceHome = createWorkspaceHome({
      documentObject: documentObject,
      modelPackApi: modelPackApi,
      getProjects: () => getProjects(getStoreState(storeInstance)),
      onCreateProject: () => run2(),
      onGenerateProject: onGenerateProject,
      onOpenProject: onOpenProject,
      onCloneProject: onCloneProject,
      onRenameProject: onRenameProject,
      onDeleteProject: onDeleteProject,
      onNotify: showNotification,
    }),
    value9 = () => {
      if (source) return;
      const value10 = getWorkspaceModeCoordinator?.();
      (value10?.['getMode']?.() !== 'storyboard3d' &&
        value10?.['setMode']?.('storyboard3d', { activate: false }),
        workspaceHome['hide']());
    },
    value11 = (value12) => {
      if (source) return;
      const value13 = getWorkspaceModeCoordinator?.();
      if (value13?.['getMode']?.() !== 'storyboard3d') return;
      enqueueMicrotask(windowObject, () => {
        if (source || getWorkspaceModeCoordinator?.()?.['getMode']?.() !== 'storyboard3d') return;
        (workspaceHome['show'](), workspaceHome['focusProject'](value12?.['detail']?.['projectId']));
      });
    },
    value14 = (value15) => {
      const project3 = value15?.['detail']?.['project'];
      if (!project3 || source) return;
      run2({ project: project3 });
    };
  return (
    windowObject?.['addEventListener']?.(EDITOR_OPENED_EVENT, value9),
    windowObject?.['addEventListener']?.(EDITOR_CLOSED_EVENT, value11),
    windowObject?.['addEventListener']?.(SAVE_AS_COPY_EVENT, value14),
    Object['freeze']({
      openHome() {
        if (source) return null;
        return (closeActiveEditor?.(), workspaceHome['show']());
      },
      close() {
        if (source) return false;
        return (workspaceHome['hide'](), closeActiveEditor?.(), true);
      },
      dispose() {
        if (source) return;
        ((source = true),
          directorGenerationService['dispose'](),
          windowObject?.['removeEventListener']?.('storyboard-3d:generate-layer', scope),
          windowObject?.['removeEventListener']?.(EDITOR_OPENED_EVENT, value9),
          windowObject?.['removeEventListener']?.(EDITOR_CLOSED_EVENT, value11),
          windowObject?.['removeEventListener']?.(SAVE_AS_COPY_EVENT, value14),
          workspaceHome['destroy']?.());
      },
    })
  );
}
