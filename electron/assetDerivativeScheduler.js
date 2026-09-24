function requireFunction(value, label) {
  if (typeof value !== 'function') throw new TypeError(label + ' must be a function');
  return value;
}
export function createAssetDerivativeScheduler({
  readAssetRecord: readAssetRecord,
  getQueue: getQueue,
  updateAssetRecord: updateAssetRecord,
  sendAssetUpdated: sendAssetUpdated,
  createTaskId: createTaskId,
} = {}) {
  const readAssetRecordFn = requireFunction(readAssetRecord, 'readAssetRecord'),
    getQueueFn = requireFunction(getQueue, 'getQueue'),
    updateAssetRecordFn = requireFunction(updateAssetRecord, 'updateAssetRecord'),
    sendAssetUpdatedFn = requireFunction(sendAssetUpdated, 'sendAssetUpdated'),
    createTaskIdFn = requireFunction(createTaskId, 'createTaskId');
  return function scheduleAssetDerivatives(asset) {
    if (!asset?.assetId) return undefined;
    const record = readAssetRecordFn(asset.assetId) || asset;
    if (record.status === 'ready') return undefined;
    if (record.kind !== 'video' && record.kind !== 'audio') return undefined;
    const kind = record.kind === 'video' ? 'videoPoster' : 'audioWaveform',
      queue = getQueueFn();
    if (record.mediaTaskId && record.mediaTaskKind === kind) {
      const running = queue.get(record.mediaTaskId);
      if (running && (running.status === 'waiting' || running.status === 'processing'))
        return running;
    }
    const taskId = createTaskIdFn(kind, record),
      updated = updateAssetRecordFn(record.assetId, {
        status: 'processing',
        error: '',
        mediaTaskId: taskId,
        mediaTaskKind: kind,
        mediaTaskStatus: 'waiting',
        mediaTaskProgress: 0,
        mediaTaskError: '',
      });
    sendAssetUpdatedFn(updated);
    try {
      return queue.enqueue({
        kind: kind,
        taskId: taskId,
        assetId: record.assetId,
        src: record.originalLocalPath,
        originalLocalPath: record.originalLocalPath,
      });
    } catch (error) {
      const message = String(error?.message || error),
        failed = updateAssetRecordFn(
          record.assetId,
          { status: 'partial', error: message, mediaTaskStatus: 'failed', mediaTaskError: message },
          { expectedMediaTaskId: taskId },
        );
      sendAssetUpdatedFn(failed);
      throw error;
    }
  };
}
