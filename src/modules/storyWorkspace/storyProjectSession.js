import {
  getWorkspaceProjectHomeEntries,
  normalizeWorkspaceProjectSortOrder,
} from '../workspaceProjectHome.js';
import {
  canEnterStoryWorkspaceStep,
  normalizeStoryWorkspaceStep,
} from './storyWorkspaceNavigationTransaction.js';
import {
  normalizeStoryAssetDetailSplitRatio,
  normalizeStoryAssetSplitRatio,
  normalizeStoryEpisodePanelRatios,
} from './storyWorkspaceInteractions.js';
import { settleInterruptedStoryVideoReplication } from './storyVideoReplication.js';
export const STORY_ASSET_TAB_LABELS = Object['freeze']({
  character: '角色',
  scene: '场景',
  prop: '道具',
  audio: '音频',
  library: '总素材',
});
const STORY_EPISODE_ASSET_RAIL_TABS = new Set(['assets', 'frames', 'library']);
function normalizeText(_0x4f86c6) {
  return String(_0x4f86c6 || '')['trim']();
}
export function normalizeStoryEpisodeAssetRailTab(_0x23641c) {
  const _0x1a484f = normalizeText(_0x23641c);
  return STORY_EPISODE_ASSET_RAIL_TABS['has'](_0x1a484f) ? _0x1a484f : 'assets';
}
export function removeStoryProjectEntry(_0x3576df = [], _0x2078cd = '') {
  const _0x5a7844 = normalizeText(_0x2078cd);
  if (!_0x5a7844 || !Array['isArray'](_0x3576df)) return Array['isArray'](_0x3576df) ? [..._0x3576df] : [];
  return _0x3576df['filter'](
    (_0x266827) => normalizeText(_0x266827?.['id'] || _0x266827?.['data']?.['project']?.['id']) !== _0x5a7844,
  );
}
export function normalizeStoryProjectSortOrder(_0x4228bf) {
  return normalizeWorkspaceProjectSortOrder(_0x4228bf);
}
export function getStoryProjectHomeEntries(
  _0x42eca5 = [],
  { query: query = '', sortOrder: sortOrder = 'updated-desc', showArchived: showArchived = ![] } = {},
) {
  return getWorkspaceProjectHomeEntries(_0x42eca5, {
    query: query,
    sortOrder: sortOrder,
    showArchived: showArchived,
  });
}
function hasStoryProjectClipVideoResult(_0x597d93 = {}) {
  if (
    normalizeText(_0x597d93?.['result']?.['videoUrl'] || _0x597d93?.['videoUrl'] || _0x597d93?.['resultUrl'])
  )
    return !![];
  return (Array['isArray'](_0x597d93?.['video']?.['results']) ? _0x597d93['video']['results'] : [])['some'](
    (_0x37422f) =>
      normalizeText(
        _0x37422f?.['videoUrl'] ||
          _0x37422f?.['url'] ||
          _0x37422f?.['displayUrl'] ||
          _0x37422f?.['localPath'] ||
          _0x37422f?.['displayLocalPath'],
      ),
  );
}
function resetStoryProjectCopyClipRuntime(_0x51ade1 = {}) {
  const _0x41cc93 = { ..._0x51ade1 },
    _0xb5b461 = hasStoryProjectClipVideoResult(_0x41cc93),
    _0x1784fd =
      _0x41cc93['generation'] && typeof _0x41cc93['generation'] === 'object'
        ? { ..._0x41cc93['generation'] }
        : null;
  if (_0x1784fd) {
    const _0x3ff633 = normalizeText(_0x1784fd['status'])['toLowerCase'](),
      _0x582c69 = ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](_0x3ff633);
    _0x41cc93['generation'] = {
      ..._0x1784fd,
      ...(_0x582c69 ? { status: _0xb5b461 ? 'succeeded' : 'idle' } : {}),
      taskId: '',
      remoteTaskId: '',
      startedAt: 0x0,
    };
  }
  if (_0x41cc93['result'] && typeof _0x41cc93['result'] === 'object') {
    const _0x7bca96 = { ..._0x41cc93['result'] },
      _0x5430a8 = normalizeText(_0x7bca96['status'])['toLowerCase'](),
      _0x28443c = ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](_0x5430a8);
    _0x41cc93['result'] = {
      ..._0x7bca96,
      ...(_0x28443c ? { status: _0xb5b461 ? 'succeeded' : 'idle' } : {}),
      taskId: '',
    };
  }
  return _0x41cc93;
}
export function duplicateStoryProjectEntry(
  _0x3d7004 = {},
  { projectId: projectId = '', now: now = Date['now']() } = {},
) {
  const _0x45ce14 =
      _0x3d7004 && typeof _0x3d7004 === 'object' && !Array['isArray'](_0x3d7004) ? _0x3d7004 : null,
    _0x404d93 = _0x45ce14?.['data'];
  if (!_0x404d93?.['project']) return null;
  const _0x194d78 =
      normalizeText(projectId) || 'story-' + Math['max'](0x1, Number(now) || Date['now']()) + '-copy',
    _0x2c25c9 = JSON['parse'](JSON['stringify'](_0x45ce14)),
    _0x3b800f =
      (normalizeText(_0x404d93['project']['title'] || _0x45ce14['title']) || '未命名故事') + '\x20副本',
    _0x439198 = _0x2c25c9['data'];
  return (
    (_0x439198['project'] = {
      ..._0x439198['project'],
      id: _0x194d78,
      title: _0x3b800f,
      backgroundTasks: [],
    }),
    _0x439198['project']['summaryStatus'] === 'generating' &&
      (_0x439198['project']['summaryStatus'] = normalizeText(_0x439198['project']['summary'])
        ? 'completed'
        : 'pending'),
    _0x439198['project']['outlineStatus'] === 'generating' &&
      (_0x439198['project']['outlineStatus'] =
        Array['isArray'](_0x439198['episodes']) && _0x439198['episodes']['length'] ? 'completed' : 'pending'),
    (_0x439198['episodes'] = (Array['isArray'](_0x439198['episodes']) ? _0x439198['episodes'] : [])['map'](
      (_0x128ff4) => ({
        ..._0x128ff4,
        clips: (Array['isArray'](_0x128ff4?.['clips']) ? _0x128ff4['clips'] : [])['map'](
          resetStoryProjectCopyClipRuntime,
        ),
      }),
    )),
    settleInterruptedStoryVideoReplication(_0x439198, {
      message: '副本不会继续原项目中的视频解析任务，请点击重试。',
    }),
    {
      ..._0x2c25c9,
      id: _0x194d78,
      title: _0x3b800f,
      createdAt: Number(now) || Date['now'](),
      updatedAt: Number(now) || Date['now'](),
      archivedAt: 0x0,
      projectTitleEdited: !![],
      data: _0x439198,
    }
  );
}
function cloneStoryProjectUiValue(_0x5e153a, _0x138fc7) {
  if (!_0x5e153a || typeof _0x5e153a !== 'object') return _0x138fc7;
  try {
    return JSON['parse'](JSON['stringify'](_0x5e153a));
  } catch {
    return _0x138fc7;
  }
}
export function normalizeStoryProjectVoiceEditor(_0xe11d7f, _0x36e463) {
  const _0x14c04b = cloneStoryProjectUiValue(_0xe11d7f, null);
  if (!_0x14c04b || Array['isArray'](_0x14c04b)) return null;
  const _0x4d9f54 = normalizeText(_0x14c04b['assetId']),
    _0x22efd4 = (Array['isArray'](_0x36e463?.['assets']) ? _0x36e463['assets'] : [])['find'](
      (_0x3594d6) => normalizeText(_0x3594d6?.['id']) === _0x4d9f54 && _0x3594d6?.['kind'] === 'character',
    );
  if (!_0x22efd4) return null;
  return { ..._0x14c04b, assetId: _0x4d9f54, isGenerating: ![] };
}
export function createStoryProjectUiState(_0x1c48ea = {}) {
  return {
    view: _0x1c48ea['view'] === 'episode' ? 'episode' : 'project',
    step: normalizeStoryWorkspaceStep(_0x1c48ea['step']),
    assetFilter: Object['hasOwn'](STORY_ASSET_TAB_LABELS, _0x1c48ea['assetFilter'])
      ? _0x1c48ea['assetFilter']
      : 'character',
    assetSplitRatio: normalizeStoryAssetSplitRatio(_0x1c48ea['assetSplitRatio']),
    assetDetailSplitRatio: normalizeStoryAssetDetailSplitRatio(_0x1c48ea['assetDetailSplitRatio']),
    episodeAssetPanelRatio: normalizeStoryEpisodePanelRatios(
      _0x1c48ea['episodeAssetPanelRatio'],
      _0x1c48ea['episodeEditorPanelRatio'],
    )['left'],
    episodeEditorPanelRatio: normalizeStoryEpisodePanelRatios(
      _0x1c48ea['episodeAssetPanelRatio'],
      _0x1c48ea['episodeEditorPanelRatio'],
    )['center'],
    episodeAssetRailTab: normalizeStoryEpisodeAssetRailTab(_0x1c48ea['episodeAssetRailTab']),
    assetAppearanceIndexes: cloneStoryProjectUiValue(_0x1c48ea['assetAppearanceIndexes'], {}),
    outlineSectionOpenState: cloneStoryProjectUiValue(_0x1c48ea['outlineSectionOpenState'], {}),
    pageScrollPositions: cloneStoryProjectUiValue(_0x1c48ea['pageScrollPositions'], {}),
    selectedAssetId: normalizeText(_0x1c48ea['selectedAssetId']),
    selectedEpisodeId: normalizeText(_0x1c48ea['selectedEpisodeId']),
    selectedClipId: normalizeText(_0x1c48ea['selectedClipId']),
    characterVoiceEditor: _0x1c48ea['characterVoiceEditor']
      ? { ...cloneStoryProjectUiValue(_0x1c48ea['characterVoiceEditor'], {}), isGenerating: ![] }
      : null,
    assetBreakdownVisibleCount: Math['max'](
      0x0,
      Math['trunc'](Number(_0x1c48ea['assetBreakdownVisibleCount']) || 0x0),
    ),
  };
}
export function applyStoryLibraryAdditionUiState(
  _0x439123 = {},
  { targetAssetId: targetAssetId = '', selectedAppearanceIndex: selectedAppearanceIndex = 0x0 } = {},
) {
  if (!_0x439123 || typeof _0x439123 !== 'object' || Array['isArray'](_0x439123)) return _0x439123;
  const _0x4f9ae5 = normalizeText(targetAssetId);
  return (
    _0x4f9ae5 &&
      (_0x439123['assetAppearanceIndexes'] = {
        ...(_0x439123['assetAppearanceIndexes'] || {}),
        [_0x4f9ae5]: Math['max'](0x0, Math['trunc'](Number(selectedAppearanceIndex) || 0x0)),
      }),
    (_0x439123['assetSelectionMode'] = ![]),
    (_0x439123['selectedAssetIds'] = []),
    _0x439123
  );
}
export function applyStoryProjectUiState(_0x193050 = {}, _0x300e8c = {}, _0x3909cb = _0x193050['data']) {
  if (!_0x193050 || typeof _0x193050 !== 'object') return _0x193050;
  const _0x4a4438 =
      _0x300e8c && typeof _0x300e8c === 'object' && !Array['isArray'](_0x300e8c) ? _0x300e8c : {},
    _0x5d6c1f = Array['isArray'](_0x3909cb?.['episodes']) ? _0x3909cb['episodes'] : [],
    _0x4dffa9 = Array['isArray'](_0x3909cb?.['assets']) ? _0x3909cb['assets'] : [],
    _0x2409af = normalizeStoryWorkspaceStep(_0x4a4438['step']);
  ((_0x193050['step'] =
    (_0x2409af === 0x0 || _0x3909cb?.['project']?.['outlineStatus'] !== 'stale') &&
    canEnterStoryWorkspaceStep(_0x3909cb, _0x2409af)
      ? _0x2409af
      : _0x3909cb?.['project']?.['collaboration']?.['stage'] === 'writing'
        ? 0x0
        : 0x1),
    (_0x193050['assetFilter'] = Object['hasOwn'](STORY_ASSET_TAB_LABELS, _0x4a4438['assetFilter'])
      ? _0x4a4438['assetFilter']
      : 'character'),
    (_0x193050['assetSplitRatio'] = normalizeStoryAssetSplitRatio(_0x4a4438['assetSplitRatio'])),
    (_0x193050['assetDetailSplitRatio'] = normalizeStoryAssetDetailSplitRatio(
      _0x4a4438['assetDetailSplitRatio'],
    )));
  const _0x1695d5 = normalizeStoryEpisodePanelRatios(
    _0x4a4438['episodeAssetPanelRatio'],
    _0x4a4438['episodeEditorPanelRatio'],
  );
  ((_0x193050['episodeAssetPanelRatio'] = _0x1695d5['left']),
    (_0x193050['episodeEditorPanelRatio'] = _0x1695d5['center']),
    (_0x193050['episodeAssetRailTab'] = normalizeStoryEpisodeAssetRailTab(_0x4a4438['episodeAssetRailTab'])),
    (_0x193050['assetAppearanceIndexes'] = cloneStoryProjectUiValue(_0x4a4438['assetAppearanceIndexes'], {})),
    (_0x193050['outlineSectionOpenState'] = cloneStoryProjectUiValue(
      _0x4a4438['outlineSectionOpenState'],
      {},
    )),
    (_0x193050['pageScrollPositions'] = cloneStoryProjectUiValue(_0x4a4438['pageScrollPositions'], {})));
  const _0x37920e = normalizeText(_0x4a4438['selectedAssetId']);
  _0x193050['selectedAssetId'] =
    _0x193050['assetFilter'] === 'library' ||
    _0x4dffa9['some']((_0x1ae84d) => normalizeText(_0x1ae84d?.['id']) === _0x37920e)
      ? _0x37920e
      : normalizeText(
          _0x4dffa9['find']((_0x2b81cc) => _0x2b81cc?.['kind'] === _0x193050['assetFilter'])?.['id'] ||
            _0x4dffa9[0x0]?.['id'],
        );
  const _0x2826ea = normalizeText(_0x4a4438['selectedEpisodeId']),
    _0x482444 =
      _0x5d6c1f['find']((_0x2bdb94) => normalizeText(_0x2bdb94?.['id']) === _0x2826ea) ||
      _0x5d6c1f[0x0] ||
      null;
  _0x193050['selectedEpisodeId'] = normalizeText(_0x482444?.['id']);
  const _0x4924a7 = normalizeText(_0x4a4438['selectedClipId']),
    _0x4a53a6 = Array['isArray'](_0x482444?.['clips']) ? _0x482444['clips'] : [];
  ((_0x193050['selectedClipId'] = normalizeText(
    _0x4a53a6['find']((_0x190a75) => normalizeText(_0x190a75?.['id']) === _0x4924a7)?.['id'] ||
      _0x4a53a6[0x0]?.['id'],
  )),
    (_0x193050['characterVoiceEditor'] = normalizeStoryProjectVoiceEditor(
      _0x4a4438['characterVoiceEditor'],
      _0x3909cb,
    )),
    (_0x193050['view'] =
      _0x4a4438['view'] === 'episode' && canEnterStoryWorkspaceStep(_0x3909cb, 0x3) && Boolean(_0x482444)
        ? 'episode'
        : 'project'));
  if (_0x193050['view'] === 'episode') _0x193050['step'] = 0x3;
  return (
    (_0x193050['assetBreakdownVisibleCount'] = Math['max'](
      0x0,
      Math['trunc'](Number(_0x4a4438['assetBreakdownVisibleCount']) || 0x0),
    )),
    _0x193050
  );
}
