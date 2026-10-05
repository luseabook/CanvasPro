import {
  normalizePersonReplacementProjectLibrary,
  removePersonReplacementProject,
} from './personReplacementProjectLibrary.js';
import {
  canCollectPersonReplacementProject,
  createImportedPersonReplacementProject,
  createPersonReplacementProjectPackagePayload,
} from './personReplacementProjectPackage.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createPersonReplacementProjectLibraryWorkspaceController({
  getProject: getProject,
  getLibrary: getLibrary,
  setLibrary: setLibrary,
  getProjectById: getProjectById,
  rememberProject: rememberProject,
  hasActiveProjectTask: hasActiveProjectTask,
  isProcessing: isProcessing,
  replaceProject: replaceProject,
  createApplicationProject: createApplicationProject,
  createInitialProject: createInitialProject,
  createId: createId,
  now: now,
  cloneJson: cloneJson,
  syncWorkspace: syncWorkspace,
  schedulePersistence: schedulePersistence,
  snapshot: snapshot,
  releaseAllSourcePreviews: releaseAllSourcePreviews,
  openProject: openProject,
  projectPackages: projectPackages,
  showToast: showToast,
} = {}) {
  function run(item, handler) {
    const id = normalizeText(item),
      currentProjectId = getLibrary(),
      enabled = currentProjectId['projects']['find']((key) => key['id'] === id);
    if (!enabled || typeof handler !== 'function') return null;
    const index = createApplicationProject(
      { ...handler(cloneJson(enabled)), id: id, updatedAt: now() },
      enabled,
    );
    return (
      setLibrary(
        normalizePersonReplacementProjectLibrary({
          ...currentProjectId,
          currentProjectId: currentProjectId['currentProjectId'],
          projects: currentProjectId['projects']['map']((result) => (result['id'] === id ? index : result)),
        }),
      ),
      getProject()['id'] === id &&
        replaceProject(index, {
          persist: false,
          presentation: 'none',
          reason: 'update-library-project',
          touchUpdatedAt: false,
        }),
      syncWorkspace(),
      schedulePersistence(),
      snapshot()
    );
  }
  const renameProject = ({ projectId: projectId, title: title } = {}) =>
    run(projectId, (args) => ({
      ...args,
      title: normalizeText(title) || '未命名人物替换项目',
    }));
  function duplicateProject({ projectId: projectId2 } = {}) {
    const currentProjectId2 = getLibrary(),
      enabled2 = currentProjectId2['projects']['find']((data) => data['id'] === normalizeText(projectId2));
    if (!enabled2) return null;
    const createdAt = now(),
      options = createApplicationProject({
        ...cloneJson(enabled2),
        id: createId('person-replacement'),
        title: (normalizeText(enabled2['title']) || '未命名人物替换项目') + ' 副本',
        archivedAt: 0,
        createdAt: createdAt,
        updatedAt: createdAt,
        output: { ...(enabled2['output'] || {}), canvasBinding: {} },
        workspace: {
          ...(enabled2['workspace'] || {}),
          view: 'home',
          openProjectMenuId: '',
          pendingDeleteProjectId: '',
        },
      });
    return (
      setLibrary(
        normalizePersonReplacementProjectLibrary({
          ...currentProjectId2,
          currentProjectId: currentProjectId2['currentProjectId'],
          projects: [options, ...currentProjectId2['projects']],
        }),
      ),
      syncWorkspace(),
      schedulePersistence(),
      showToast('项目副本已创建。', 'success'),
      snapshot()
    );
  }
  async function collectProject({ projectId: projectId3 } = {}) {
    const projectId4 = normalizeText(projectId3);
    if (projectId4 === normalizeText(getProject()['id'])) rememberProject();
    const projectName = getProjectById(projectId4);
    if (!projectName) return (showToast('人物替换项目不存在。', 'error'), null);
    if (hasActiveProjectTask(projectId4) || !canCollectPersonReplacementProject(projectName))
      return (showToast('项目仍有任务处理中，请完成后再收集。', 'info'), null);
    if (typeof projectPackages?.['exportProject'] !== 'function')
      return (showToast('当前环境不支持收集项目。', 'error'), null);
    return await projectPackages['exportProject']({
      projectType: 'person-replacement',
      projectId: projectId4,
      projectName: projectName['title'],
      projectData: createPersonReplacementProjectPackagePayload(projectName),
    });
  }
  async function importProjectPackage() {
    if (typeof projectPackages?.['importProject'] !== 'function')
      return (showToast('当前环境不支持导入项目。', 'error'), null);
    return await projectPackages['importProject']();
  }
  function importProjectPackageResult(options2 = {}) {
    if (normalizeText(options2['projectType']) !== 'person-replacement') return null;
    const now2 = now(),
      currentProjectId3 = createImportedPersonReplacementProject(
        options2['projectData'] || options2['data'],
        {
          projectId: createId('person-replacement'),
          now: now2,
        },
      );
    rememberProject();
    const args2 = getLibrary();
    return (
      setLibrary(
        normalizePersonReplacementProjectLibrary({
          ...args2,
          currentProjectId: currentProjectId3['id'],
          projects: [
            currentProjectId3,
            ...args2['projects']['filter']((target) => target['id'] !== currentProjectId3['id']),
          ],
        }),
      ),
      syncWorkspace(),
      schedulePersistence({ immediate: true }),
      openProject(currentProjectId3['id']),
      cloneJson(currentProjectId3)
    );
  }
  const archiveProject = ({ projectId: projectId5, archived: archived } = {}) =>
    run(projectId5, (args3) => ({ ...args3, archivedAt: archived ? Date['now']() : 0 }));
  function deleteProject({ projectId: projectId6 } = {}) {
    const text = normalizeText(projectId6),
      enabled3 = getLibrary();
    if (!enabled3['projects']['some']((source) => source['id'] === text)) return null;
    if (hasActiveProjectTask(text))
      return (
        showToast(
          isProcessing() ? '当前项目正在后台处理，暂时不能删除。' : '当前项目仍有任务处理中，暂时不能删除。',
          'info',
        ),
        null
      );
    return (
      setLibrary(removePersonReplacementProject(enabled3, text)),
      releaseAllSourcePreviews(text),
      getProject()['id'] === text &&
        replaceProject(createInitialProject(), {
          persist: false,
          presentation: 'none',
          reason: 'delete-project',
          touchUpdatedAt: false,
        }),
      syncWorkspace(),
      schedulePersistence(),
      showToast('人物替换项目已删除。', 'success'),
      snapshot()
    );
  }
  return Object['freeze']({
    archiveProject: archiveProject,
    collectProject: collectProject,
    deleteProject: deleteProject,
    duplicateProject: duplicateProject,
    importProjectPackage: importProjectPackage,
    importProjectPackageResult: importProjectPackageResult,
    renameProject: renameProject,
  });
}
