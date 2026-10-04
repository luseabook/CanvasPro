export const REPLICATION_WORKSPACE_MODE = 'replication';
export function getStoryProjectWorkspaceMode(options = {}) {
  return options['sourceMode'] === 'video-replication' ? REPLICATION_WORKSPACE_MODE : 'story';
}
export function getStorySurfaceProjects(value) {
  return (value['projects'] || [])['filter'](
    (item) =>
      getStoryProjectWorkspaceMode(item['data']?.['project']) === (value['workspaceSurface'] || 'story'),
  );
}
export function selectStoryWorkspaceSurface(view, key = 'story') {
  const index = key === REPLICATION_WORKSPACE_MODE ? key : 'story',
    result = view['workspaceSurface'] !== index,
    projectId = view['data']?.['project']?.['id'],
    data = (view['workspaceSurfaceViews'] ||= {});
  result &&
    getStoryProjectWorkspaceMode(view['data']?.['project']) === view['workspaceSurface'] &&
    (data[view['workspaceSurface']] = {
      projectId: projectId,
      view: view['view'],
      step: view['step'],
    });
  view['workspaceSurface'] = index;
  if (index === REPLICATION_WORKSPACE_MODE) view['homeTab'] = 'replication';
  else {
    if (view['homeTab'] === 'replication') view['homeTab'] = 'generate';
  }
  if (getStoryProjectWorkspaceMode(view['data']?.['project']) !== index) view['view'] = 'home';
  else
    result &&
      data[index]?.['projectId'] === projectId &&
      ((view['view'] = data[index]['view']), (view['step'] = data[index]['step']));
  return (
    result &&
      ((view['projectSearchQuery'] = ''),
      (view['pendingDeleteProjectId'] = ''),
      (view['openProjectMenuId'] = '')),
    result
  );
}
