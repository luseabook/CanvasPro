import {
  buildStoryBackgroundTaskId,
  finishStoryBackgroundTask,
  getStoryBackgroundTasks,
  getStoryBackgroundTaskSummary,
  interruptStoryBackgroundTasks,
  startStoryBackgroundTask,
} from './storyBackgroundTasks.js';
import { getRecoverableStoryClipVideoTask } from './storyClipGeneration.js';
import { settleInterruptedStoryVideoReplication } from './storyVideoReplication.js';
function normalizeText(_0x2df875) {
  return String(_0x2df875 || '')['trim']();
}
export function getStoryAssetAppearanceGenerationKey(_0x2bccb6, _0xd0da72) {
  const _0x4c8851 = normalizeText(_0x2bccb6),
    _0x300590 = normalizeText(_0xd0da72);
  if (!_0x4c8851 || !_0x300590) return '';
  return _0x4c8851 + ':' + _0x300590;
}
function normalizeStoryTaskBatchIds(_0x4157d2) {
  return [
    ...new Set(
      (Array['isArray'](_0x4157d2) ? _0x4157d2 : [])
        ['map']((_0x458d44) => normalizeText(_0x458d44))
        ['filter'](Boolean),
    ),
  ];
}
const STORY_ACTIVE_CLIP_VIDEO_STATUSES = new Set([
  'pending',
  'queued',
  'recovering',
  'running',
  'submitting',
]);
function getStoryBackgroundTaskClip(_0x21e4c6 = {}, _0x47decc = {}) {
  const _0x4c00d6 = normalizeText(_0x47decc?.['scope']?.['episodeId']),
    _0xa7f658 = normalizeText(_0x47decc?.['scope']?.['clipId']);
  if (!_0xa7f658) return null;
  const _0x3fef2b = Array['isArray'](_0x21e4c6?.['episodes']) ? _0x21e4c6['episodes'] : [],
    _0x16170f = _0x4c00d6
      ? _0x3fef2b['find']((_0x232f46) => normalizeText(_0x232f46?.['id']) === _0x4c00d6)
      : null,
    _0x3d891a = _0x16170f
      ? Array['isArray'](_0x16170f['clips'])
        ? _0x16170f['clips']
        : []
      : _0x3fef2b['flatMap']((_0x3f7bef) =>
          Array['isArray'](_0x3f7bef?.['clips']) ? _0x3f7bef['clips'] : [],
        );
  return _0x3d891a['find']((_0x1e5e40) => normalizeText(_0x1e5e40?.['id']) === _0xa7f658) || null;
}
function isStoryClipVideoBackgroundTaskCurrent(_0x5640eb = {}, _0x4e9b50 = {}) {
  const _0x19adbc = getStoryBackgroundTaskClip(_0x5640eb, _0x4e9b50);
  if (!_0x19adbc) return !![];
  return STORY_ACTIVE_CLIP_VIDEO_STATUSES['has'](
    normalizeText(_0x19adbc?.['generation']?.['status'])['toLowerCase'](),
  );
}
export function reconcileStoryClipVideoBackgroundTasks(_0x64412f = {}) {
  let _0x2314fb = 0x0;
  const _0x46b3b5 = getStoryBackgroundTaskSummary(_0x64412f)['activeTasks'];
  for (const _0x31cb68 of _0x46b3b5) {
    if (_0x31cb68['type'] !== 'clip-video') continue;
    const _0x375643 = getStoryBackgroundTaskClip(_0x64412f, _0x31cb68),
      _0x19d04f = normalizeText(_0x375643?.['generation']?.['status'])['toLowerCase']();
    if (_0x375643 && STORY_ACTIVE_CLIP_VIDEO_STATUSES['has'](_0x19d04f)) continue;
    const _0x1ab957 = ['success', 'succeeded', 'completed', 'done']['includes'](_0x19d04f)
      ? { status: 'succeeded', message: '片段视频生成完成' }
      : ['failed', 'error']['includes'](_0x19d04f)
        ? {
            status: 'failed',
            message: '片段视频生成失败',
            error: normalizeText(_0x375643?.['generation']?.['error']) || '片段视频生成失败。',
          }
        : ['cancelled', 'canceled']['includes'](_0x19d04f)
          ? { status: 'cancelled', message: '片段视频任务已取消' }
          : { status: 'interrupted', message: '片段视频任务状态已失效' };
    if (finishStoryBackgroundTask(_0x64412f, _0x31cb68['id'], _0x1ab957)) _0x2314fb += 0x1;
  }
  return _0x2314fb;
}
export function reconcilePersistedStoryProjectTasks(_0x3d33c5 = {}) {
  if (!_0x3d33c5?.['project']) return ![];
  let _0x154d05 = interruptStoryBackgroundTasks(_0x3d33c5, {
    message: '应用上次关闭时任务尚未完成，请重新发起不可恢复的任务。',
  });
  ((_0x154d05 += reconcileStoryClipVideoBackgroundTasks(_0x3d33c5)),
    (_0x154d05 += settleInterruptedStoryVideoReplication(_0x3d33c5)));
  const _0x22372c = new Set(
    getStoryBackgroundTaskSummary(_0x3d33c5)['activeTasks']['map']((_0x2fed38) => _0x2fed38['type']),
  );
  _0x3d33c5['project']['summaryStatus'] === 'generating' &&
    !_0x22372c['has']('story-summary') &&
    ((_0x3d33c5['project']['summaryStatus'] = normalizeText(_0x3d33c5['project']['summary'])
      ? 'completed'
      : 'error'),
    (_0x154d05 += 0x1));
  _0x3d33c5['project']['outlineStatus'] === 'generating' &&
    !_0x22372c['has']('episode-planning') &&
    ((_0x3d33c5['project']['outlineStatus'] =
      Array['isArray'](_0x3d33c5['episodes']) && _0x3d33c5['episodes']['length'] ? 'completed' : 'error'),
    (_0x154d05 += 0x1));
  for (const _0x28bd47 of _0x3d33c5['episodes'] || []) {
    for (const _0x523859 of _0x28bd47?.['clips'] || []) {
      const _0x5a64a8 = getRecoverableStoryClipVideoTask(_0x523859);
      if (!_0x5a64a8) {
        const _0x121ece = _0x523859?.['generation'];
        STORY_ACTIVE_CLIP_VIDEO_STATUSES['has'](normalizeText(_0x121ece?.['status'])['toLowerCase']()) &&
          !normalizeText(_0x121ece?.['taskId']) &&
          ((_0x523859['generation'] = {
            ..._0x121ece,
            status: 'failed',
            error:
              '上次视频任务已中断，未保存任务 ID，无法自动查询结果。请先到厂商任务记录核对，再决定是否重新生成。',
          }),
          (_0x154d05 += 0x1));
        continue;
      }
      const _0x345405 = buildStoryBackgroundTaskId('clip-video', {
          episodeId: _0x28bd47['id'],
          clipId: _0x523859['id'],
        }),
        _0x13b414 = getStoryBackgroundTasks(_0x3d33c5)['find']((_0x12bf3a) => _0x12bf3a['id'] === _0x345405);
      if (_0x13b414?.['resumable'] && _0x13b414['remoteTaskId'] === _0x5a64a8['taskId']) continue;
      (startStoryBackgroundTask(_0x3d33c5, {
        id: _0x345405,
        type: 'clip-video',
        scope: { episodeId: _0x28bd47['id'], clipId: _0x523859['id'] },
        label: '生成片段视频',
        message: '正在恢复视频生成任务',
        status: 'recovering',
        resumable: !![],
        remoteTaskId: _0x5a64a8['taskId'],
        modelId: _0x5a64a8['modelId'],
        provider: _0x5a64a8['provider'],
        executionId: _0x5a64a8['executionId'],
        startedAt: _0x5a64a8['startedAt'],
      }),
        (_0x154d05 += 0x1));
    }
  }
  return _0x154d05 > 0x0;
}
export function deriveStoryProjectTaskState(_0x19b6e7 = {}) {
  const _0x26c78b = getStoryBackgroundTaskSummary(_0x19b6e7)['activeTasks'],
    _0x1706a1 = (_0x56d381) => _0x26c78b['find']((_0x3fa122) => _0x3fa122['type'] === _0x56d381),
    _0x352789 = (_0xf10152) =>
      _0x26c78b['map']((_0x515e63) => _0x515e63['batch'])['find'](
        (_0xfa28b2) => _0xfa28b2?.['type'] === _0xf10152,
      ),
    _0x4dff26 = {
      isGeneratingStory: ![],
      generationStatus: '',
      storyPlanningOperation: '',
      storyPlanningStatus: '',
      generatingEpisodeScriptId: '',
      isBatchGeneratingScripts: ![],
      episodeScriptBatchId: '',
      episodeScriptBatchCancelRequested: ![],
      scriptGenerationFocusMode: ![],
      episodeScriptGenerationStatus: '',
      splittingEpisodeIds: [],
      episodeBatchSplitOperation: '',
      episodeBatchSplitStatus: '',
      episodeBatchSplitId: '',
      episodeBatchSplitCancelRequested: ![],
      generatingClipId: '',
      generatingClipIds: [],
      clipBatchGenerationByEpisode: {},
      generatingAppearanceKeys: [],
      generatingVoiceAssetIds: [],
      isBatchGenerating: ![],
      batchGeneratingAssetIds: [],
      batchGeneratingAppearanceKeys: [],
      batchGeneratingVoiceAssetIds: [],
      assetBatchId: '',
      assetBatchCancelRequested: ![],
      batchGenerationLabel: '',
    },
    _0x22a693 = _0x1706a1('story-summary');
  _0x22a693 &&
    ((_0x4dff26['isGeneratingStory'] = !![]),
    (_0x4dff26['generationStatus'] = _0x22a693['message'] || _0x22a693['label'] || '正在生成剧本摘要'));
  const _0x39d4aa = _0x26c78b['find']((_0x9113e2) =>
      normalizeText(_0x9113e2?.['type'])['startsWith']('asset-extraction'),
    ),
    _0x345b6d = _0x39d4aa || _0x1706a1('episode-planning');
  _0x345b6d &&
    ((_0x4dff26['storyPlanningOperation'] = _0x39d4aa
      ? normalizeText(_0x39d4aa['type'])['replace'](/^asset-extraction/u, 'extracting-assets')
      : 'planning-episode-outlines'),
    (_0x4dff26['storyPlanningStatus'] = _0x345b6d['message'] || _0x345b6d['label'] || '正在生成'));
  const _0x4eaf93 = _0x26c78b['filter']((_0x3eea53) => _0x3eea53['type'] === 'episode-script'),
    _0x36d750 = _0x352789('episode-scripts');
  _0x4eaf93['length'] &&
    ((_0x4dff26['scriptGenerationFocusMode'] = !![]),
    (_0x4dff26['generatingEpisodeScriptId'] = normalizeText(_0x4eaf93[0x0]?.['scope']?.['episodeId'])),
    (_0x4dff26['isBatchGeneratingScripts'] = Boolean(_0x36d750) || _0x4eaf93['length'] > 0x1),
    (_0x4dff26['episodeScriptBatchId'] = normalizeText(_0x36d750?.['id'])),
    (_0x4dff26['episodeScriptBatchCancelRequested'] = _0x36d750?.['cancelRequested'] === !![]),
    (_0x4dff26['episodeScriptGenerationStatus'] =
      _0x36d750?.['label'] || _0x4eaf93[0x0]?.['message'] || '正在生成分集剧本'),
    (_0x4dff26['storyPlanningOperation'] = _0x4dff26['isBatchGeneratingScripts']
      ? 'writing-episode-scripts'
      : 'writing-episode-script'),
    (_0x4dff26['storyPlanningStatus'] = _0x4dff26['episodeScriptGenerationStatus']));
  const _0x1a33c4 = _0x26c78b['filter'](
      (_0x33a473) =>
        _0x33a473['type'] === 'episode-split' || _0x33a473['type'] === 'episode-split-experimental',
    ),
    _0x21cac6 = _0x352789('episode-splits');
  _0x4dff26['splittingEpisodeIds'] = _0x21cac6
    ? normalizeStoryTaskBatchIds(
        _0x21cac6['pendingEpisodeIds']?.['length']
          ? _0x21cac6['pendingEpisodeIds']
          : _0x21cac6['targetEpisodeIds'],
      )
    : normalizeStoryTaskBatchIds(_0x1a33c4['map']((_0x2d20f9) => _0x2d20f9['scope']?.['episodeId']));
  _0x21cac6 &&
    ((_0x4dff26['episodeBatchSplitOperation'] = normalizeText(_0x21cac6['operation']) || 'splitting-all'),
    (_0x4dff26['episodeBatchSplitStatus'] = normalizeText(_0x21cac6['label']) || '正在批量拆分'),
    (_0x4dff26['episodeBatchSplitId'] = normalizeText(_0x21cac6['id'])),
    (_0x4dff26['episodeBatchSplitCancelRequested'] = _0x21cac6['cancelRequested'] === !![]));
  ((_0x4dff26['generatingAppearanceKeys'] = normalizeStoryTaskBatchIds(
    _0x26c78b['filter']((_0x63c1f4) => ['asset-image', 'asset-image-upload']['includes'](_0x63c1f4['type']))[
      'map'
    ]((_0x3441ea) =>
      getStoryAssetAppearanceGenerationKey(
        _0x3441ea['scope']?.['assetId'],
        _0x3441ea['scope']?.['appearanceId'],
      ),
    ),
  )),
    (_0x4dff26['generatingVoiceAssetIds'] = normalizeStoryTaskBatchIds(
      _0x26c78b['filter']((_0x2c2d62) =>
        ['asset-voice', 'asset-voice-upload']['includes'](_0x2c2d62['type']),
      )['map']((_0x55f8f9) => _0x55f8f9['scope']?.['assetId']),
    )));
  const _0x31f405 = _0x352789('asset-generation');
  _0x31f405 &&
    ((_0x4dff26['isBatchGenerating'] = !![]),
    (_0x4dff26['assetBatchId'] = normalizeText(_0x31f405['id'])),
    (_0x4dff26['assetBatchCancelRequested'] = _0x31f405['cancelRequested'] === !![]),
    (_0x4dff26['batchGeneratingAssetIds'] = normalizeStoryTaskBatchIds(_0x31f405['pendingAssetIds'])),
    (_0x4dff26['batchGeneratingAppearanceKeys'] = normalizeStoryTaskBatchIds(
      _0x31f405['pendingAppearanceKeys'],
    )),
    (_0x4dff26['batchGeneratingVoiceAssetIds'] = normalizeStoryTaskBatchIds(
      _0x31f405['pendingVoiceAssetIds'],
    )),
    (_0x4dff26['batchGenerationLabel'] = normalizeText(_0x31f405['label']) || '批量生成中'));
  const _0x3d53cb = _0x26c78b['filter'](
    (_0x5918af) =>
      _0x5918af['type'] === 'clip-video' && isStoryClipVideoBackgroundTaskCurrent(_0x19b6e7, _0x5918af),
  );
  ((_0x4dff26['generatingClipIds'] = normalizeStoryTaskBatchIds(
    _0x3d53cb['map']((_0x1b7a25) => _0x1b7a25['scope']?.['clipId']),
  )),
    (_0x4dff26['generatingClipId'] = _0x4dff26['generatingClipIds'][0x0] || ''));
  const _0x225341 = new Map();
  return (
    _0x3d53cb['forEach']((_0x4d1c95) => {
      if (_0x4d1c95['batch']?.['type'] !== 'clip-videos' || _0x225341['has'](_0x4d1c95['batch']['id']))
        return;
      _0x225341['set'](_0x4d1c95['batch']['id'], _0x4d1c95['batch']);
    }),
    _0x225341['forEach']((_0x160e45) => {
      const _0x597bdb = normalizeText(_0x160e45['episodeId']);
      if (!_0x597bdb) return;
      _0x4dff26['clipBatchGenerationByEpisode'][_0x597bdb] = {
        label: normalizeText(_0x160e45['label']) || '批量生成中',
        batchId: normalizeText(_0x160e45['id']),
        cancelRequested: _0x160e45['cancelRequested'] === !![],
      };
    }),
    _0x4dff26
  );
}
