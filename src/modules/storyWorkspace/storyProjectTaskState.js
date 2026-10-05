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
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function getStoryAssetAppearanceGenerationKey(item, key) {
  const text = normalizeText(item),
    text2 = normalizeText(key);
  if (!text || !text2) return '';
  return text + ':' + text2;
}
function normalizeStoryTaskBatchIds(index) {
  return [
    ...new Set(
      (Array['isArray'](index) ? index : [])['map']((result) => normalizeText(result))['filter'](Boolean),
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
function getStoryBackgroundTaskClip(options = {}, data = {}) {
  const text3 = normalizeText(data?.['scope']?.['episodeId']),
    text4 = normalizeText(data?.['scope']?.['clipId']);
  if (!text4) return null;
  const list = Array['isArray'](options?.['episodes']) ? options['episodes'] : [],
    target = text3 ? list['find']((source) => normalizeText(source?.['id']) === text3) : null,
    list2 = target
      ? Array['isArray'](target['clips'])
        ? target['clips']
        : []
      : list['flatMap']((next) => (Array['isArray'](next?.['clips']) ? next['clips'] : []));
  return list2['find']((current) => normalizeText(current?.['id']) === text4) || null;
}
function isStoryClipVideoBackgroundTaskCurrent(options2 = {}, entry = {}) {
  const storyBackgroundTaskClip = getStoryBackgroundTaskClip(options2, entry);
  if (!storyBackgroundTaskClip) return !![];
  return STORY_ACTIVE_CLIP_VIDEO_STATUSES['has'](
    normalizeText(storyBackgroundTaskClip?.['generation']?.['status'])['toLowerCase'](),
  );
}
export function reconcileStoryClipVideoBackgroundTasks(options3 = {}) {
  let record = 0;
  const storyBackgroundTaskSummary = getStoryBackgroundTaskSummary(options3)['activeTasks'];
  for (const payload of storyBackgroundTaskSummary) {
    if (payload['type'] !== 'clip-video') continue;
    const storyBackgroundTaskClip2 = getStoryBackgroundTaskClip(options3, payload),
      text5 = normalizeText(storyBackgroundTaskClip2?.['generation']?.['status'])['toLowerCase']();
    if (storyBackgroundTaskClip2 && STORY_ACTIVE_CLIP_VIDEO_STATUSES['has'](text5)) continue;
    const handle = ['success', 'succeeded', 'completed', 'done']['includes'](text5)
      ? { status: 'succeeded', message: '片段视频生成完成' }
      : ['failed', 'error']['includes'](text5)
        ? {
            status: 'failed',
            message: '片段视频生成失败',
            error: normalizeText(storyBackgroundTaskClip2?.['generation']?.['error']) || '片段视频生成失败。',
          }
        : ['cancelled', 'canceled']['includes'](text5)
          ? { status: 'cancelled', message: '片段视频任务已取消' }
          : { status: 'interrupted', message: '片段视频任务状态已失效' };
    if (finishStoryBackgroundTask(options3, payload['id'], handle)) record += 1;
  }
  return record;
}
export function reconcilePersistedStoryProjectTasks(enabled = {}) {
  if (!enabled?.['project']) return ![];
  let interruptStoryBackgroundTasks2 = interruptStoryBackgroundTasks(enabled, {
    message: '应用上次关闭时任务尚未完成，请重新发起不可恢复的任务。',
  });
  ((interruptStoryBackgroundTasks2 += reconcileStoryClipVideoBackgroundTasks(enabled)),
    (interruptStoryBackgroundTasks2 += settleInterruptedStoryVideoReplication(enabled)));
  const map = new Set(getStoryBackgroundTaskSummary(enabled)['activeTasks']['map']((state) => state['type']));
  enabled['project']['summaryStatus'] === 'generating' &&
    !map['has']('story-summary') &&
    ((enabled['project']['summaryStatus'] = normalizeText(enabled['project']['summary'])
      ? 'completed'
      : 'error'),
    (interruptStoryBackgroundTasks2 += 1));
  enabled['project']['outlineStatus'] === 'generating' &&
    !map['has']('episode-planning') &&
    ((enabled['project']['outlineStatus'] =
      Array['isArray'](enabled['episodes']) && enabled['episodes']['length'] ? 'completed' : 'error'),
    (interruptStoryBackgroundTasks2 += 1));
  for (const episodeId of enabled['episodes'] || []) {
    for (const clipId of episodeId?.['clips'] || []) {
      const remoteTaskId = getRecoverableStoryClipVideoTask(clipId);
      if (!remoteTaskId) {
        const response = clipId?.['generation'];
        STORY_ACTIVE_CLIP_VIDEO_STATUSES['has'](normalizeText(response?.['status'])['toLowerCase']()) &&
          !normalizeText(response?.['taskId']) &&
          ((clipId['generation'] = {
            ...response,
            status: 'failed',
            error:
              '上次视频任务已中断，未保存任务 ID，无法自动查询结果。请先到厂商任务记录核对，再决定是否重新生成。',
          }),
          (interruptStoryBackgroundTasks2 += 1));
        continue;
      }
      const id = buildStoryBackgroundTaskId('clip-video', {
          episodeId: episodeId['id'],
          clipId: clipId['id'],
        }),
        storyBackgroundTasks = getStoryBackgroundTasks(enabled)['find']((config) => config['id'] === id);
      if (
        storyBackgroundTasks?.['resumable'] &&
        storyBackgroundTasks['remoteTaskId'] === remoteTaskId['taskId']
      )
        continue;
      (startStoryBackgroundTask(enabled, {
        id: id,
        type: 'clip-video',
        scope: { episodeId: episodeId['id'], clipId: clipId['id'] },
        label: '生成片段视频',
        message: '正在恢复视频生成任务',
        status: 'recovering',
        resumable: !![],
        remoteTaskId: remoteTaskId['taskId'],
        modelId: remoteTaskId['modelId'],
        provider: remoteTaskId['provider'],
        executionId: remoteTaskId['executionId'],
        startedAt: remoteTaskId['startedAt'],
      }),
        (interruptStoryBackgroundTasks2 += 1));
    }
  }
  return interruptStoryBackgroundTasks2 > 0;
}
export function deriveStoryProjectTaskState(options4 = {}) {
  const list3 = getStoryBackgroundTaskSummary(options4)['activeTasks'],
    handler = (scope) => list3['find']((input) => input['type'] === scope),
    handler2 = (output) =>
      list3['map']((value2) => value2['batch'])['find']((value3) => value3?.['type'] === output),
    value4 = {
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
    error = handler('story-summary');
  error &&
    ((value4['isGeneratingStory'] = !![]),
    (value4['generationStatus'] = error['message'] || error['label'] || '正在生成剧本摘要'));
  const value5 = list3['find']((value6) => normalizeText(value6?.['type'])['startsWith']('asset-extraction')),
    error2 = value5 || handler('episode-planning');
  error2 &&
    ((value4['storyPlanningOperation'] = value5
      ? normalizeText(value5['type'])['replace'](/^asset-extraction/u, 'extracting-assets')
      : 'planning-episode-outlines'),
    (value4['storyPlanningStatus'] = error2['message'] || error2['label'] || '正在生成'));
  const list4 = list3['filter']((value7) => value7['type'] === 'episode-script'),
    value8 = handler2('episode-scripts');
  list4['length'] &&
    ((value4['scriptGenerationFocusMode'] = !![]),
    (value4['generatingEpisodeScriptId'] = normalizeText(list4[0]?.['scope']?.['episodeId'])),
    (value4['isBatchGeneratingScripts'] = Boolean(value8) || list4['length'] > 1),
    (value4['episodeScriptBatchId'] = normalizeText(value8?.['id'])),
    (value4['episodeScriptBatchCancelRequested'] = value8?.['cancelRequested'] === !![]),
    (value4['episodeScriptGenerationStatus'] =
      value8?.['label'] || list4[0]?.['message'] || '正在生成分集剧本'),
    (value4['storyPlanningOperation'] = value4['isBatchGeneratingScripts']
      ? 'writing-episode-scripts'
      : 'writing-episode-script'),
    (value4['storyPlanningStatus'] = value4['episodeScriptGenerationStatus']));
  const list5 = list3['filter'](
      (value9) => value9['type'] === 'episode-split' || value9['type'] === 'episode-split-experimental',
    ),
    value10 = handler2('episode-splits');
  value4['splittingEpisodeIds'] = value10
    ? normalizeStoryTaskBatchIds(
        value10['pendingEpisodeIds']?.['length'] ? value10['pendingEpisodeIds'] : value10['targetEpisodeIds'],
      )
    : normalizeStoryTaskBatchIds(list5['map']((value11) => value11['scope']?.['episodeId']));
  value10 &&
    ((value4['episodeBatchSplitOperation'] = normalizeText(value10['operation']) || 'splitting-all'),
    (value4['episodeBatchSplitStatus'] = normalizeText(value10['label']) || '正在批量拆分'),
    (value4['episodeBatchSplitId'] = normalizeText(value10['id'])),
    (value4['episodeBatchSplitCancelRequested'] = value10['cancelRequested'] === !![]));
  ((value4['generatingAppearanceKeys'] = normalizeStoryTaskBatchIds(
    list3['filter']((value12) => ['asset-image', 'asset-image-upload']['includes'](value12['type']))['map'](
      (value13) =>
        getStoryAssetAppearanceGenerationKey(
          value13['scope']?.['assetId'],
          value13['scope']?.['appearanceId'],
        ),
    ),
  )),
    (value4['generatingVoiceAssetIds'] = normalizeStoryTaskBatchIds(
      list3['filter']((value14) => ['asset-voice', 'asset-voice-upload']['includes'](value14['type']))['map'](
        (value15) => value15['scope']?.['assetId'],
      ),
    )));
  const value16 = handler2('asset-generation');
  value16 &&
    ((value4['isBatchGenerating'] = !![]),
    (value4['assetBatchId'] = normalizeText(value16['id'])),
    (value4['assetBatchCancelRequested'] = value16['cancelRequested'] === !![]),
    (value4['batchGeneratingAssetIds'] = normalizeStoryTaskBatchIds(value16['pendingAssetIds'])),
    (value4['batchGeneratingAppearanceKeys'] = normalizeStoryTaskBatchIds(value16['pendingAppearanceKeys'])),
    (value4['batchGeneratingVoiceAssetIds'] = normalizeStoryTaskBatchIds(value16['pendingVoiceAssetIds'])),
    (value4['batchGenerationLabel'] = normalizeText(value16['label']) || '批量生成中'));
  const list6 = list3['filter'](
    (value17) => value17['type'] === 'clip-video' && isStoryClipVideoBackgroundTaskCurrent(options4, value17),
  );
  ((value4['generatingClipIds'] = normalizeStoryTaskBatchIds(
    list6['map']((value18) => value18['scope']?.['clipId']),
  )),
    (value4['generatingClipId'] = value4['generatingClipIds'][0] || ''));
  const map2 = new Map();
  return (
    list6['forEach']((value19) => {
      if (value19['batch']?.['type'] !== 'clip-videos' || map2['has'](value19['batch']['id'])) return;
      map2['set'](value19['batch']['id'], value19['batch']);
    }),
    map2['forEach']((cancelRequested) => {
      const text6 = normalizeText(cancelRequested['episodeId']);
      if (!text6) return;
      value4['clipBatchGenerationByEpisode'][text6] = {
        label: normalizeText(cancelRequested['label']) || '批量生成中',
        batchId: normalizeText(cancelRequested['id']),
        cancelRequested: cancelRequested['cancelRequested'] === !![],
      };
    }),
    value4
  );
}
