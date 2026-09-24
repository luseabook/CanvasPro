function normalizeProgressNumber(_0x5632bf) {
  const _0x4c98f0 = Number(_0x5632bf);
  return Number['isFinite'](_0x4c98f0) ? Math['max'](0x0, Math['trunc'](_0x4c98f0)) : 0x0;
}
function normalizeProgressText(_0x5e49cf) {
  return String(_0x5e49cf || '')['trim']();
}
function collectStableBatchProgress(_0x15db49 = []) {
  if (!Array['isArray'](_0x15db49)) return [];
  return _0x15db49['map']((_0x12a9ad) => ({
    id: normalizeProgressText(_0x12a9ad?.['id'] || _0x12a9ad?.['batchId']),
    status: normalizeProgressText(_0x12a9ad?.['status']),
    sourceSceneRefs: Array['isArray'](_0x12a9ad?.['sourceSceneRefs'])
      ? _0x12a9ad['sourceSceneRefs']['map'](normalizeProgressText)['filter'](Boolean)['sort']()
      : [],
    assetRefs: Array['isArray'](_0x12a9ad?.['completedAssetRefs'])
      ? _0x12a9ad['completedAssetRefs']['map'](normalizeProgressText)['filter'](Boolean)['sort']()
      : [],
  }));
}
function createStoryAssetExtractionProgressKey(_0x52eed1) {
  if (!_0x52eed1 || typeof _0x52eed1 !== 'object' || Array['isArray'](_0x52eed1)) return '';
  return JSON['stringify']({
    strategy: normalizeProgressText(_0x52eed1['strategy']),
    status: normalizeProgressText(_0x52eed1['status']),
    phase: normalizeProgressText(_0x52eed1['phase']),
    progress: {
      stage: normalizeProgressText(_0x52eed1['progress']?.['stage']),
      current: normalizeProgressNumber(_0x52eed1['progress']?.['current']),
      total: normalizeProgressNumber(_0x52eed1['progress']?.['total']),
    },
    inventoryBatches: collectStableBatchProgress(_0x52eed1['inventoryBatches']),
    completedAssetRefs: Array['isArray'](_0x52eed1['completedAssets'])
      ? _0x52eed1['completedAssets']
          ['map']((_0x41f94e) => normalizeProgressText(_0x41f94e?.['ref'] || _0x41f94e?.['id']))
          ['filter'](Boolean)
          ['sort']()
      : [],
    detailBatches: collectStableBatchProgress(_0x52eed1['detailBatches']),
  });
}
function createExtractionRunnerError(_0x881adb, _0xff8739, _0x14a106) {
  const _0x2146b4 = new Error(_0xff8739);
  _0x2146b4['type'] = _0x881adb;
  if (_0x14a106) _0x2146b4['cause'] = _0x14a106;
  return _0x2146b4;
}
export async function runStoryAssetExtractionToCompletion({
  execute: _0x20e8b4,
  initialResumeDraft: initialResumeDraft = null,
  onContinuation: onContinuation = null,
  isActive: isActive = () => !![],
} = {}) {
  if (typeof _0x20e8b4 !== 'function') throw new TypeError('素材提取自动续跑缺少 execute 函数。');
  let _0xd82b23 = initialResumeDraft,
    _0x306ebd = createStoryAssetExtractionProgressKey(_0xd82b23);
  while (!![]) {
    if (!isActive())
      throw createExtractionRunnerError('ASSET_EXTRACTION_ABORTED', '素材提取所属项目已切换或任务已结束。');
    try {
      return await _0x20e8b4(_0xd82b23);
    } catch (_0x46c155) {
      if (
        _0x46c155?.['type'] !== 'ASSET_EXTRACTION_CONTINUE_REQUIRED' ||
        _0x46c155?.['isContinuation'] !== !![]
      )
        throw _0x46c155;
      const _0x1fbc76 = _0x46c155?.['assetExtractionDraft'],
        _0x1b54d2 = createStoryAssetExtractionProgressKey(_0x1fbc76);
      if (!_0x1b54d2)
        throw createExtractionRunnerError(
          'ASSET_EXTRACTION_CONTINUATION_DRAFT_MISSING',
          '素材提取要求继续，但没有返回可恢复的检查点。',
          _0x46c155,
        );
      if (_0x1b54d2 === _0x306ebd)
        throw createExtractionRunnerError(
          'ASSET_EXTRACTION_CONTINUATION_STALLED',
          '素材提取连续两轮没有产生新进度，已停止自动续跑以避免重复计费。',
          _0x46c155,
        );
      ((_0x306ebd = _0x1b54d2),
        (_0xd82b23 = _0x1fbc76),
        typeof onContinuation === 'function' && (await onContinuation(_0x1fbc76, _0x46c155)));
    }
  }
}
