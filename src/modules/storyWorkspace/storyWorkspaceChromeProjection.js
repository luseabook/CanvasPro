import { buildStoryEpisodeCanvasName } from './storyEpisodeCanvas.js';
import { isStoryCollaborationProject } from './storyCollaborationPolicy.js';
import {
  getStoryVideoEpisodes,
  isStoryWorkspaceStepNavigationDisabled,
} from './storyWorkspaceNavigationTransaction.js';
function normalizeText(_0x4e622d) {
  return String(_0x4e622d ?? '')['trim']();
}
function freezeSnapshot(_0x9f503) {
  if (Array['isArray'](_0x9f503))
    return Object['freeze'](_0x9f503['map']((_0x192d37) => freezeSnapshot(_0x192d37)));
  if (_0x9f503 && typeof _0x9f503 === 'object')
    return Object['freeze'](
      Object['fromEntries'](
        Object['entries'](_0x9f503)['map'](([_0x540dc3, _0x5d9f3f]) => [
          _0x540dc3,
          freezeSnapshot(_0x5d9f3f),
        ]),
      ),
    );
  return _0x9f503;
}
export function getStoryEpisodeToolbarOptions(_0x1a9f0b = [], _0x5c7a58 = '') {
  const _0x16e773 = normalizeText(_0x5c7a58);
  return getStoryVideoEpisodes(_0x1a9f0b)['filter'](
    (_0x3de3d5) =>
      normalizeText(_0x3de3d5?.['id']) !== _0x16e773 &&
      Array['isArray'](_0x3de3d5?.['clips']) &&
      _0x3de3d5['clips']['length'] > 0x0,
  );
}
export function getStoryProjectCanvasEpisodes(_0x5bc6c5 = [], _0x45a125 = '') {
  const _0x55585b = getStoryVideoEpisodes(_0x5bc6c5),
    _0x38bd6b = normalizeText(_0x45a125),
    _0x51d982 =
      _0x55585b['find']((_0x598c84) => normalizeText(_0x598c84?.['id']) === _0x38bd6b) || _0x55585b[0x0];
  return _0x51d982 ? [_0x51d982] : [];
}
function projectEpisodeSwitcher(_0x1f02d3, _0x4451a3, _0x1fb53a) {
  return {
    currentEpisodeId: normalizeText(_0x4451a3?.['id']),
    currentEpisodeName: buildStoryEpisodeCanvasName(_0x4451a3) || '分集详情',
    isCurrentPage: _0x1fb53a,
    options: getStoryEpisodeToolbarOptions(_0x1f02d3['data']?.['episodes'], _0x4451a3?.['id'])['map'](
      (_0x263ef1) => ({
        id: _0x263ef1['id'],
        name: buildStoryEpisodeCanvasName(_0x263ef1) || '分集详情',
        clipCount: _0x263ef1['clips']['length'],
      }),
    ),
  };
}
export function createStoryWorkspaceChromeProjection({ steps: steps = [] } = {}) {
  function _0x3e1853(_0x15cef0, _0x309f11 = _0x15cef0['step']) {
    const _0x5dfd5e = _0x15cef0['data']?.['project']?.['sourceMode'],
      _0x5e20e2 =
        _0x5dfd5e === 'upload-original'
          ? steps['map']((_0x44eb7f) =>
              _0x44eb7f['id'] === 0x1 ? { ..._0x44eb7f, label: '原始剧本' } : _0x44eb7f,
            )
          : _0x5dfd5e === 'video-replication'
            ? steps['map']((_0x1bc02a) => ({
                ..._0x1bc02a,
                label:
                  { 0x1: '原片分析', 0x2: '素材设定', 0x3: '视频列表' }[_0x1bc02a['id']] ||
                  _0x1bc02a['label'],
              }))
            : steps;
    return {
      activeStep: _0x309f11,
      items: (isStoryCollaborationProject(_0x15cef0['data'])
        ? [{ id: 0x0, label: '故事构思' }, ..._0x5e20e2]
        : _0x5e20e2)['map']((_0x1028d9, _0x24ad4b) => ({
        id: _0x1028d9['id'],
        number: _0x24ad4b + 0x1,
        label: _0x1028d9['label'],
        active: _0x309f11 === _0x1028d9['id'],
        disabled:
          (_0x1028d9['id'] === 0x0 && _0x15cef0['developerModeAvailable'] !== !![]) ||
          isStoryWorkspaceStepNavigationDisabled(_0x15cef0['data'], _0x1028d9['id']),
      })),
    };
  }
  function _0x391769(_0x595bd4 = {}) {
    if (_0x595bd4['view'] === 'episode') {
      const _0x4061af = _0x595bd4['data']?.['episodes']?.['find'](
        (_0x52d1dd) => _0x52d1dd['id'] === _0x595bd4['selectedEpisodeId'],
      );
      return {
        kind: 'episode',
        projectLabel: _0x595bd4['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目',
        steps: _0x3e1853(_0x595bd4, 'episode'),
        episodeSwitcher: projectEpisodeSwitcher(_0x595bd4, _0x4061af, !![]),
        canvasSyncPending: _0x595bd4['canvasSyncPending'] === !![],
      };
    }
    const _0x2fe6fc = getStoryEpisodeToolbarOptions(_0x595bd4['data']?.['episodes']),
      _0x5e3906 =
        _0x2fe6fc['find'](
          (_0x50fd30) => normalizeText(_0x50fd30?.['id']) === normalizeText(_0x595bd4['selectedEpisodeId']),
        ) ||
        _0x2fe6fc[0x0] ||
        null;
    return {
      kind: 'project',
      collaborationAvailable:
        _0x595bd4['developerModeAvailable'] === !![] &&
        _0x595bd4['workspaceSurface'] !== 'replication' &&
        isStoryCollaborationProject(_0x595bd4['data']),
      projectLabel: _0x595bd4['workspaceSurface'] === 'replication' ? '复刻项目' : '剧本项目',
      steps: _0x3e1853(_0x595bd4),
      episodeSwitcher: _0x5e3906 ? projectEpisodeSwitcher(_0x595bd4, _0x5e3906, ![]) : null,
    };
  }
  function _0x291648(
    _0x2f0a06 = {},
    {
      nextLabel: _0x36d60e,
      nextAction: _0x38abfe = '',
      isLast: isLast = ![],
      title: title = '',
      hint: hint = '',
      actionsMarkup: actionsMarkup = '',
      leadingActionsMarkup: leadingActionsMarkup = '',
      useDefaultCopy: useDefaultCopy = !![],
    } = {},
  ) {
    const _0x3d00d0 =
        _0x38abfe ||
        (isLast
          ? 'finish-story-workbench'
          : _0x2f0a06['step'] === 0x1
            ? 'extract-assets'
            : 'open-episode-stage'),
      _0x2c35d3 =
        _0x2f0a06['data']?.['project']?.['sourceMode'] === 'video-replication' &&
        _0x2f0a06['splittingEpisodeIds']?.['length'] > 0x0,
      _0x2b195c = Boolean(_0x2f0a06['storyPlanningOperation'] || _0x2c35d3),
      _0x716cbc = _0x2c35d3
        ? '正在生成分段提示词'
        : _0x2f0a06['storyPlanningStatus'] || _0x36d60e || '处理中',
      _0x4dbec9 =
        title ||
        (_0x38abfe === 'plan-episode-outlines'
          ? '剧本摘要已完成'
          : _0x38abfe === 'extract-assets'
            ? '完整分集剧本已全部完成'
            : _0x2f0a06['step'] === 0x2
              ? '角色、场景和道具设定已应用'
              : '分集结构已建立'),
      _0x55c110 =
        hint ||
        (_0x38abfe === 'plan-episode-outlines'
          ? '下一步将按已设置集数生成分集大纲'
          : _0x38abfe === 'extract-assets'
            ? '下一步沿用现有素材、分镜和视频流程'
            : isLast
              ? '进入分集后可编辑片段并选择视频模型'
              : '可以继续下一步，也可以返回修改');
    return {
      title: useDefaultCopy ? _0x4dbec9 : title,
      hint: useDefaultCopy ? _0x55c110 : hint,
      actionsMarkup: actionsMarkup,
      leadingActionsMarkup: leadingActionsMarkup,
      showPrevious:
        _0x2f0a06['step'] >
        (_0x2f0a06['developerModeAvailable'] === !![] && isStoryCollaborationProject(_0x2f0a06['data'])
          ? 0x0
          : 0x1),
      nextAction: _0x3d00d0,
      nextLabel: _0x2b195c ? _0x716cbc : _0x36d60e || '下一步',
      busy: _0x2b195c,
    };
  }
  return Object['freeze']({
    projectFooter: (..._0x2dc8b2) => freezeSnapshot(_0x291648(..._0x2dc8b2)),
    projectToolbar: (..._0x2080f2) => freezeSnapshot(_0x391769(..._0x2080f2)),
  });
}
