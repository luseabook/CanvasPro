function normalizeProgressNumber(value) {
  const item = Number(value);
  return Number['isFinite'](item) ? Math['max'](0, Math['trunc'](item)) : 0;
}
function normalizeProgressText(key) {
  return String(key || '')['trim']();
}
function collectStableBatchProgress(list = []) {
  if (!Array['isArray'](list)) return [];
  return list['map']((response) => ({
    id: normalizeProgressText(response?.['id'] || response?.['batchId']),
    status: normalizeProgressText(response?.['status']),
    sourceSceneRefs: Array['isArray'](response?.['sourceSceneRefs'])
      ? response['sourceSceneRefs']['map'](normalizeProgressText)['filter'](Boolean)['sort']()
      : [],
    assetRefs: Array['isArray'](response?.['completedAssetRefs'])
      ? response['completedAssetRefs']['map'](normalizeProgressText)['filter'](Boolean)['sort']()
      : [],
  }));
}
function createStoryAssetExtractionProgressKey(response2) {
  if (!response2 || typeof response2 !== 'object' || Array['isArray'](response2)) return '';
  return JSON['stringify']({
    strategy: normalizeProgressText(response2['strategy']),
    status: normalizeProgressText(response2['status']),
    phase: normalizeProgressText(response2['phase']),
    progress: {
      stage: normalizeProgressText(response2['progress']?.['stage']),
      current: normalizeProgressNumber(response2['progress']?.['current']),
      total: normalizeProgressNumber(response2['progress']?.['total']),
    },
    inventoryBatches: collectStableBatchProgress(response2['inventoryBatches']),
    completedAssetRefs: Array['isArray'](response2['completedAssets'])
      ? response2['completedAssets']
          ['map']((index) => normalizeProgressText(index?.['ref'] || index?.['id']))
          ['filter'](Boolean)
          ['sort']()
      : [],
    detailBatches: collectStableBatchProgress(response2['detailBatches']),
  });
}
function createExtractionRunnerError(result, data, options) {
  const error = new Error(data);
  error['type'] = result;
  if (options) error['cause'] = options;
  return error;
}
export async function runStoryAssetExtractionToCompletion({
  execute: execute,
  initialResumeDraft: initialResumeDraft = null,
  onContinuation: onContinuation = null,
  isActive: isActive = () => !![],
} = {}) {
  if (typeof execute !== 'function') throw new TypeError('素材提取自动续跑缺少 execute 函数。');
  let target = initialResumeDraft,
    storyAssetExtractionProgressKey = createStoryAssetExtractionProgressKey(target);
  while (!![]) {
    if (!isActive())
      throw createExtractionRunnerError('ASSET_EXTRACTION_ABORTED', '素材提取所属项目已切换或任务已结束。');
    try {
      return await execute(target);
    } catch (source) {
      if (source?.['type'] !== 'ASSET_EXTRACTION_CONTINUE_REQUIRED' || source?.['isContinuation'] !== !![])
        throw source;
      const next = source?.['assetExtractionDraft'],
        storyAssetExtractionProgressKey2 = createStoryAssetExtractionProgressKey(next);
      if (!storyAssetExtractionProgressKey2)
        throw createExtractionRunnerError(
          'ASSET_EXTRACTION_CONTINUATION_DRAFT_MISSING',
          '素材提取要求继续，但没有返回可恢复的检查点。',
          source,
        );
      if (storyAssetExtractionProgressKey2 === storyAssetExtractionProgressKey)
        throw createExtractionRunnerError(
          'ASSET_EXTRACTION_CONTINUATION_STALLED',
          '素材提取连续两轮没有产生新进度，已停止自动续跑以避免重复计费。',
          source,
        );
      ((storyAssetExtractionProgressKey = storyAssetExtractionProgressKey2),
        (target = next),
        typeof onContinuation === 'function' && (await onContinuation(next, source)));
    }
  }
}
