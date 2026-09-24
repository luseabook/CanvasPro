export const REPLICATION_WORKSPACE_MODE = 'replication';
export function getStoryProjectWorkspaceMode(_0x35ae85 = {}) {
  return _0x35ae85['sourceMode'] === 'video-replication' ? REPLICATION_WORKSPACE_MODE : 'story';
}
export function getStorySurfaceProjects(_0x37ec61) {
  return (_0x37ec61['projects'] || [])['filter'](
    (_0x262344) =>
      getStoryProjectWorkspaceMode(_0x262344['data']?.['project']) ===
      (_0x37ec61['workspaceSurface'] || 'story'),
  );
}
export function selectStoryWorkspaceSurface(_0x578e71, _0x506727 = 'story') {
  const _0x216ed5 = _0x506727 === REPLICATION_WORKSPACE_MODE ? _0x506727 : 'story',
    _0x2fe931 = _0x578e71['workspaceSurface'] !== _0x216ed5,
    _0x1a6106 = _0x578e71['data']?.['project']?.['id'],
    _0xc3492d = (_0x578e71['workspaceSurfaceViews'] ||= {});
  _0x2fe931 &&
    getStoryProjectWorkspaceMode(_0x578e71['data']?.['project']) === _0x578e71['workspaceSurface'] &&
    (_0xc3492d[_0x578e71['workspaceSurface']] = {
      projectId: _0x1a6106,
      view: _0x578e71['view'],
      step: _0x578e71['step'],
    });
  _0x578e71['workspaceSurface'] = _0x216ed5;
  if (_0x216ed5 === REPLICATION_WORKSPACE_MODE) _0x578e71['homeTab'] = 'replication';
  else {
    if (_0x578e71['homeTab'] === 'replication') _0x578e71['homeTab'] = 'generate';
  }
  if (getStoryProjectWorkspaceMode(_0x578e71['data']?.['project']) !== _0x216ed5) _0x578e71['view'] = 'home';
  else
    _0x2fe931 &&
      _0xc3492d[_0x216ed5]?.['projectId'] === _0x1a6106 &&
      ((_0x578e71['view'] = _0xc3492d[_0x216ed5]['view']),
      (_0x578e71['step'] = _0xc3492d[_0x216ed5]['step']));
  return (
    _0x2fe931 &&
      ((_0x578e71['projectSearchQuery'] = ''),
      (_0x578e71['pendingDeleteProjectId'] = ''),
      (_0x578e71['openProjectMenuId'] = '')),
    _0x2fe931
  );
}
