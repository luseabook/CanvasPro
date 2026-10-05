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
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function normalizeStoryEpisodeAssetRailTab(item) {
  const text = normalizeText(item);
  return STORY_EPISODE_ASSET_RAIL_TABS['has'](text) ? text : 'assets';
}
export function removeStoryProjectEntry(list = [], key = '') {
  const text2 = normalizeText(key);
  if (!text2 || !Array['isArray'](list)) return Array['isArray'](list) ? [...list] : [];
  return list['filter'](
    (index) => normalizeText(index?.['id'] || index?.['data']?.['project']?.['id']) !== text2,
  );
}
export function normalizeStoryProjectSortOrder(result) {
  return normalizeWorkspaceProjectSortOrder(result);
}
export function getStoryProjectHomeEntries(
  list2 = [],
  { query: query = '', sortOrder: sortOrder = 'updated-desc', showArchived: showArchived = false } = {},
) {
  return getWorkspaceProjectHomeEntries(list2, {
    query: query,
    sortOrder: sortOrder,
    showArchived: showArchived,
  });
}
function hasStoryProjectClipVideoResult(options = {}) {
  if (normalizeText(options?.['result']?.['videoUrl'] || options?.['videoUrl'] || options?.['resultUrl']))
    return true;
  return (Array['isArray'](options?.['video']?.['results']) ? options['video']['results'] : [])['some'](
    (response) =>
      normalizeText(
        response?.['videoUrl'] ||
          response?.['url'] ||
          response?.['displayUrl'] ||
          response?.['localPath'] ||
          response?.['displayLocalPath'],
      ),
  );
}
function resetStoryProjectCopyClipRuntime(args = {}) {
  const args2 = { ...args },
    status = hasStoryProjectClipVideoResult(args2),
    response2 =
      args2['generation'] && typeof args2['generation'] === 'object' ? { ...args2['generation'] } : null;
  if (response2) {
    const text3 = normalizeText(response2['status'])['toLowerCase'](),
      data = ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](text3);
    args2['generation'] = {
      ...response2,
      ...(data ? { status: status ? 'succeeded' : 'idle' } : {}),
      taskId: '',
      remoteTaskId: '',
      startedAt: 0,
    };
  }
  if (args2['result'] && typeof args2['result'] === 'object') {
    const response3 = { ...args2['result'] },
      text4 = normalizeText(response3['status'])['toLowerCase'](),
      target = ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](text4);
    args2['result'] = {
      ...response3,
      ...(target ? { status: status ? 'succeeded' : 'idle' } : {}),
      taskId: '',
    };
  }
  return args2;
}
export function duplicateStoryProjectEntry(
  options2 = {},
  { projectId: projectId = '', now: now = Date['now']() } = {},
) {
  const source = options2 && typeof options2 === 'object' && !Array['isArray'](options2) ? options2 : null,
    enabled = source?.['data'];
  if (!enabled?.['project']) return null;
  const id = normalizeText(projectId) || 'story-' + Math['max'](1, Number(now) || Date['now']()) + '-copy',
    args3 = JSON['parse'](JSON['stringify'](source)),
    title = (normalizeText(enabled['project']['title'] || source['title']) || '未命名故事') + ' 副本',
    data2 = args3['data'];
  return (
    (data2['project'] = {
      ...data2['project'],
      id: id,
      title: title,
      backgroundTasks: [],
    }),
    data2['project']['summaryStatus'] === 'generating' &&
      (data2['project']['summaryStatus'] = normalizeText(data2['project']['summary'])
        ? 'completed'
        : 'pending'),
    data2['project']['outlineStatus'] === 'generating' &&
      (data2['project']['outlineStatus'] =
        Array['isArray'](data2['episodes']) && data2['episodes']['length'] ? 'completed' : 'pending'),
    (data2['episodes'] = (Array['isArray'](data2['episodes']) ? data2['episodes'] : [])['map']((args4) => ({
      ...args4,
      clips: (Array['isArray'](args4?.['clips']) ? args4['clips'] : [])['map'](
        resetStoryProjectCopyClipRuntime,
      ),
    }))),
    settleInterruptedStoryVideoReplication(data2, {
      message: '副本不会继续原项目中的视频解析任务，请点击重试。',
    }),
    {
      ...args3,
      id: id,
      title: title,
      createdAt: Number(now) || Date['now'](),
      updatedAt: Number(now) || Date['now'](),
      archivedAt: 0,
      projectTitleEdited: true,
      data: data2,
    }
  );
}
function cloneStoryProjectUiValue(enabled2, next) {
  if (!enabled2 || typeof enabled2 !== 'object') return next;
  try {
    return JSON['parse'](JSON['stringify'](enabled2));
  } catch {
    return next;
  }
}
export function normalizeStoryProjectVoiceEditor(current, entry) {
  const args5 = cloneStoryProjectUiValue(current, null);
  if (!args5 || Array['isArray'](args5)) return null;
  const assetId = normalizeText(args5['assetId']),
    enabled3 = (Array['isArray'](entry?.['assets']) ? entry['assets'] : [])['find'](
      (record) => normalizeText(record?.['id']) === assetId && record?.['kind'] === 'character',
    );
  if (!enabled3) return null;
  return { ...args5, assetId: assetId, isGenerating: false };
}
export function createStoryProjectUiState(view = {}) {
  return {
    view: view['view'] === 'episode' ? 'episode' : 'project',
    step: normalizeStoryWorkspaceStep(view['step']),
    assetFilter: Object['hasOwn'](STORY_ASSET_TAB_LABELS, view['assetFilter'])
      ? view['assetFilter']
      : 'character',
    assetSplitRatio: normalizeStoryAssetSplitRatio(view['assetSplitRatio']),
    assetDetailSplitRatio: normalizeStoryAssetDetailSplitRatio(view['assetDetailSplitRatio']),
    episodeAssetPanelRatio: normalizeStoryEpisodePanelRatios(
      view['episodeAssetPanelRatio'],
      view['episodeEditorPanelRatio'],
    )['left'],
    episodeEditorPanelRatio: normalizeStoryEpisodePanelRatios(
      view['episodeAssetPanelRatio'],
      view['episodeEditorPanelRatio'],
    )['center'],
    episodeAssetRailTab: normalizeStoryEpisodeAssetRailTab(view['episodeAssetRailTab']),
    assetAppearanceIndexes: cloneStoryProjectUiValue(view['assetAppearanceIndexes'], {}),
    outlineSectionOpenState: cloneStoryProjectUiValue(view['outlineSectionOpenState'], {}),
    pageScrollPositions: cloneStoryProjectUiValue(view['pageScrollPositions'], {}),
    selectedAssetId: normalizeText(view['selectedAssetId']),
    selectedEpisodeId: normalizeText(view['selectedEpisodeId']),
    selectedClipId: normalizeText(view['selectedClipId']),
    characterVoiceEditor: view['characterVoiceEditor']
      ? { ...cloneStoryProjectUiValue(view['characterVoiceEditor'], {}), isGenerating: false }
      : null,
    assetBreakdownVisibleCount: Math['max'](
      0,
      Math['trunc'](Number(view['assetBreakdownVisibleCount']) || 0),
    ),
  };
}
export function applyStoryLibraryAdditionUiState(
  enabled4 = {},
  { targetAssetId: targetAssetId = '', selectedAppearanceIndex: selectedAppearanceIndex = 0 } = {},
) {
  if (!enabled4 || typeof enabled4 !== 'object' || Array['isArray'](enabled4)) return enabled4;
  const text5 = normalizeText(targetAssetId);
  return (
    text5 &&
      (enabled4['assetAppearanceIndexes'] = {
        ...(enabled4['assetAppearanceIndexes'] || {}),
        [text5]: Math['max'](0, Math['trunc'](Number(selectedAppearanceIndex) || 0)),
      }),
    (enabled4['assetSelectionMode'] = false),
    (enabled4['selectedAssetIds'] = []),
    enabled4
  );
}
export function applyStoryProjectUiState(enabled5 = {}, payload = {}, handle = enabled5['data']) {
  if (!enabled5 || typeof enabled5 !== 'object') return enabled5;
  const state = payload && typeof payload === 'object' && !Array['isArray'](payload) ? payload : {},
    list3 = Array['isArray'](handle?.['episodes']) ? handle['episodes'] : [],
    list4 = Array['isArray'](handle?.['assets']) ? handle['assets'] : [],
    storyWorkspaceStep = normalizeStoryWorkspaceStep(state['step']);
  ((enabled5['step'] =
    (storyWorkspaceStep === 0 || handle?.['project']?.['outlineStatus'] !== 'stale') &&
    canEnterStoryWorkspaceStep(handle, storyWorkspaceStep)
      ? storyWorkspaceStep
      : handle?.['project']?.['collaboration']?.['stage'] === 'writing'
        ? 0
        : 1),
    (enabled5['assetFilter'] = Object['hasOwn'](STORY_ASSET_TAB_LABELS, state['assetFilter'])
      ? state['assetFilter']
      : 'character'),
    (enabled5['assetSplitRatio'] = normalizeStoryAssetSplitRatio(state['assetSplitRatio'])),
    (enabled5['assetDetailSplitRatio'] = normalizeStoryAssetDetailSplitRatio(
      state['assetDetailSplitRatio'],
    )));
  const box = normalizeStoryEpisodePanelRatios(
    state['episodeAssetPanelRatio'],
    state['episodeEditorPanelRatio'],
  );
  ((enabled5['episodeAssetPanelRatio'] = box['left']),
    (enabled5['episodeEditorPanelRatio'] = box['center']),
    (enabled5['episodeAssetRailTab'] = normalizeStoryEpisodeAssetRailTab(state['episodeAssetRailTab'])),
    (enabled5['assetAppearanceIndexes'] = cloneStoryProjectUiValue(state['assetAppearanceIndexes'], {})),
    (enabled5['outlineSectionOpenState'] = cloneStoryProjectUiValue(state['outlineSectionOpenState'], {})),
    (enabled5['pageScrollPositions'] = cloneStoryProjectUiValue(state['pageScrollPositions'], {})));
  const text6 = normalizeText(state['selectedAssetId']);
  enabled5['selectedAssetId'] =
    enabled5['assetFilter'] === 'library' ||
    list4['some']((config) => normalizeText(config?.['id']) === text6)
      ? text6
      : normalizeText(
          list4['find']((scope) => scope?.['kind'] === enabled5['assetFilter'])?.['id'] || list4[0]?.['id'],
        );
  const text7 = normalizeText(state['selectedEpisodeId']),
    input = list3['find']((output) => normalizeText(output?.['id']) === text7) || list3[0] || null;
  enabled5['selectedEpisodeId'] = normalizeText(input?.['id']);
  const text8 = normalizeText(state['selectedClipId']),
    list5 = Array['isArray'](input?.['clips']) ? input['clips'] : [];
  ((enabled5['selectedClipId'] = normalizeText(
    list5['find']((value2) => normalizeText(value2?.['id']) === text8)?.['id'] || list5[0]?.['id'],
  )),
    (enabled5['characterVoiceEditor'] = normalizeStoryProjectVoiceEditor(
      state['characterVoiceEditor'],
      handle,
    )),
    (enabled5['view'] =
      state['view'] === 'episode' && canEnterStoryWorkspaceStep(handle, 3) && Boolean(input)
        ? 'episode'
        : 'project'));
  if (enabled5['view'] === 'episode') enabled5['step'] = 3;
  return (
    (enabled5['assetBreakdownVisibleCount'] = Math['max'](
      0,
      Math['trunc'](Number(state['assetBreakdownVisibleCount']) || 0),
    )),
    enabled5
  );
}
