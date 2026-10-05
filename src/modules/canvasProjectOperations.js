import { loadProjectStrict, resolveCanvasData } from '../services/projectService.js';
import { fetchV2ProjectsFromServer, renameV2ProjectOnServer } from '../../api/projectsV2Api.js';
import { buildUniqueCanvasName, stripCanvasProjectFileExtension } from '../utils/canvasProjectFileNames.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { commit as commit_2 } from './history.js';
import { t } from '../i18n/index.js';
const text = (value) => t('projectDropdown.' + value),
  normalizeName = (item) =>
    String(item || '')
      ['replace'](/\s+/g, ' ')
      ['trim'](),
  lookupName = (key) => normalizeName(stripCanvasProjectFileExtension(key))['toLowerCase']();
export function buildCanvasProjectContext(isTemporary = {}, index = {}) {
  const filename = String(isTemporary['filename'] || index['filename'] || '')['trim']();
  return {
    projectId: String(
      isTemporary['projectId'] || index['projectId'] || stripCanvasProjectFileExtension(filename),
    )['trim'](),
    filename: filename,
    projectName: String(
      isTemporary['projectName'] || index['projectName'] || stripCanvasProjectFileExtension(filename),
    )['trim'](),
    recentId: String(isTemporary['recentId'] || index['recentId'] || '')['trim'](),
    displayPath: String(isTemporary['displayPath'] || index['displayPath'] || '')['trim'](),
    lastModified: Number(isTemporary['lastModified'] || index['lastModified'] || 0) || 0,
    isTemporary: isTemporary['isTemporary'] === true,
    workspaceProjectScoped: true,
  };
}
export function createCanvasProjectOperations({
  getCanvasManager: getCanvasManager,
  getActiveProjectContext: getActiveProjectContext = () =>
    getCanvasManager?.()?.['getCanvasProjectContext']?.() || {},
  loadProject: loadProject = loadProjectStrict,
  listProjects: listProjects = fetchV2ProjectsFromServer,
  renameProject: renameProject = renameV2ProjectOnServer,
  projectWorkspaceSessions: projectWorkspaceSessions,
  renameTemporaryProject: renameTemporaryProject = () => false,
  applySourceNames: applySourceNames,
  commit: commit = commit_2,
  onProjectHydrated: onProjectHydrated,
  requestCacheSave: requestCacheSave,
} = {}) {
  let promise = Promise['resolve']();
  const map = new Map();
  function run(result) {
    const promise2 = promise['then'](result);
    return ((promise = promise2['catch'](() => {})), promise2);
  }
  function run2() {
    const enabled = getCanvasManager?.();
    if (!enabled?.['addCanvas'] || !enabled?.['hydrateActiveCanvasSnapshot'])
      throw new Error('CanvasTabManager is unavailable');
    return enabled;
  }
  async function run3(canvasName, activeCanvasId, args) {
    const data = canvasName['getActiveCanvasId']?.() || canvasName['_activeId'];
    if (activeCanvasId !== data && (await canvasName['switchTo']?.(activeCanvasId)) === false) return false;
    return (
      canvasName['setCanvasProjectContext']?.(activeCanvasId, {
        ...(canvasName['getCanvasProjectContext']?.(activeCanvasId) || {}),
        ...args,
      }),
      {
        activeCanvasId: activeCanvasId,
        canvasName:
          canvasName['_canvases']?.['find']((options) => options['id'] === activeCanvasId)?.['name'] ||
          args['projectName'] ||
          text('loadedPackageBase'),
        hydratedData: null,
        alreadyOpen: true,
      }
    );
  }
  async function run4(enabled2, { applySourceNames: applySourceNames2 = false } = {}) {
    if (!enabled2 || enabled2['canceled']) return false;
    const target = run2(),
      projectName = buildCanvasProjectContext(enabled2),
      source = target['findCanvasIdByProjectIdentity']?.(projectName);
    if (source) return run3(target, source, projectName);
    const hydratedData = sanitizeMultiCanvasDataForPersistence(
        enabled2['multiData'] || resolveCanvasData(enabled2['data'] || {}),
      ),
      error =
        hydratedData?.['canvases']?.['find']((next) => next?.['id'] === hydratedData['activeCanvasId']) ||
        hydratedData?.['canvases']?.[0];
    if (!error) throw new Error(text('loadFailed'));
    const name = buildUniqueCanvasName(
        enabled2['projectName'] || stripCanvasProjectFileExtension(enabled2['filename']) || error['name'],
        target['_canvases'] || [],
        { fallbackName: text('loadedPackageBase') },
      ),
      current = { ...error, name: name };
    if (applySourceNames2) applySourceNames?.(current);
    if ((await target['addCanvas']()) === false) return false;
    const activeCanvasId2 = target['getActiveCanvasId']?.() || target['_activeId'];
    if (!activeCanvasId2) return false;
    return (
      target['renameCanvas']?.(activeCanvasId2, name),
      target['hydrateActiveCanvasSnapshot'](current),
      target['setCanvasProjectContext']?.(activeCanvasId2, {
        ...projectName,
        projectName: projectName['projectName'] || name,
      }),
      target['markCanvasClean']?.(activeCanvasId2),
      target['renderTabs']?.(),
      commit(),
      onProjectHydrated?.({ activeCanvasId: activeCanvasId2, projectContext: projectName }),
      requestCacheSave?.(),
      { activeCanvasId: activeCanvasId2, canvasName: name, hydratedData: hydratedData }
    );
  }
  function openProject(entry, projectName2, { onProgress: onProgress } = {}) {
    const filename2 = String(entry || '')['trim'](),
      projectId = stripCanvasProjectFileExtension(filename2),
      record = JSON['stringify']([filename2, String(projectName2 || projectId)]);
    if (map['has'](record)) return map['get'](record);
    const payload = run(async () => {
      if (!filename2) throw new Error(text('loadFailed'));
      await onProgress?.('reading');
      const handle = run2(),
        args2 = {
          projectId: projectId,
          filename: filename2,
          projectName: projectName2 || projectId,
          isTemporary: false,
          workspaceProjectScoped: true,
        },
        state = handle['findCanvasIdByProjectIdentity']?.(args2);
      if (state) return run3(handle, state, args2);
      let multiData;
      try {
        multiData = sanitizeMultiCanvasDataForPersistence(await loadProject(filename2));
      } catch (cause) {
        throw new Error(text('loadFailed'), { cause: cause });
      }
      if (!multiData?.['canvases']?.['length']) throw new Error(text('loadFailed'));
      return (
        await onProgress?.('hydrating'),
        run4({ ...args2, multiData: multiData }, { applySourceNames: true })
      );
    })['finally'](() => map['delete'](record));
    return (map['set'](record, payload), payload);
  }
  function renameProject2(args3, config) {
    const filename3 = { ...args3 },
      projectName3 = normalizeName(config);
    return run(async () => {
      if (!projectName3) throw new Error(text('renameFailed'));
      const list = await listProjects(),
        scope = list['some'](
          (error2) =>
            String(error2?.['filename'] || '')['trim']() !== String(filename3['filename'] || '')['trim']() &&
            [error2?.['name'], error2?.['filename']]['some'](
              (input) => lookupName(input) === lookupName(projectName3),
            ),
        );
      if (scope) throw new Error(text('nameExists'));
      const response = await renameProject(filename3['filename'], projectName3);
      if (!response?.['success']) throw new Error(text('renameFailed'));
      const output = getCanvasManager?.(),
        value2 = {
          projectId: stripCanvasProjectFileExtension(filename3['filename']),
          filename: filename3['filename'],
          projectName: filename3['name'] || stripCanvasProjectFileExtension(filename3['filename']),
        },
        value3 = output?.['findCanvasIdByProjectIdentity']?.(value2),
        projectId2 = String(response['filename'] || filename3['filename'] || '')['trim']();
      return (
        value3 &&
          (output['setCanvasProjectContext']?.(value3, {
            ...(output['getCanvasProjectContext']?.(value3) || {}),
            projectId: projectId2 ? stripCanvasProjectFileExtension(projectId2) : projectName3,
            filename: projectId2,
            projectName: projectName3,
            recentId: '',
            displayPath: '',
            lastModified: 0,
            isTemporary: false,
          }),
          output['renameCanvas']?.(value3, projectName3),
          output['renderTabs']?.()),
        await projectWorkspaceSessions?.['move']?.(
          filename3['filename'],
          response['filename'] || projectName3,
          {
            projectName: projectName3,
          },
        ),
        { ...response, name: projectName3, filename: projectId2 }
      );
    });
  }
  function renameCurrentProject(value4) {
    const name2 = normalizeName(value4);
    if (!name2) return Promise['resolve'](false);
    const name3 = getActiveProjectContext(),
      filename4 = String(name3?.['filename'] || name3?.['projectId'] || '')['trim']();
    if (name3?.['isTemporary'] === true || !filename4)
      return Promise['resolve'](renameTemporaryProject(name2));
    return renameProject2(
      { filename: filename4, name: name3['projectName'] || stripCanvasProjectFileExtension(filename4) },
      name2,
    )['then']((error3) => error3['name']);
  }
  return Object['freeze']({
    openProject: openProject,
    appendProject: (value5, value6) => run(() => run4(value5, value6)),
    renameProject: renameProject2,
    renameCurrentProject: renameCurrentProject,
  });
}
