const GENERATION_ACTIVE_JOB_STATUSES = new Set([
  'running',
  'processing',
  'generating',
  'in_progress',
  'in-progress',
  'pending',
  'queued',
  'queueing',
  'waiting',
  'submitted',
  'submitting',
  'submit',
  'recovering',
]);
function isActiveGenerationJobStatus(value) {
  return GENERATION_ACTIVE_JOB_STATUSES.has(
    String(value || '')
      .trim()
      .toLowerCase(),
  );
}
export function stripImageGenerationRuntimeState(item) {
  const key = item && typeof item === 'object' ? item : {};
  return (
    delete key.isGenerating,
    isActiveGenerationJobStatus(key.jobStatus) && delete key.jobStatus,
    delete key.taskCancellable,
    delete key.taskResumable,
    delete key.taskAdapterType,
    delete key.generationStartTime,
    delete key.generationDuration,
    delete key.rhTaskId,
    delete key.rhTaskStatus,
    delete key.rhTaskStartedAt,
    delete key.rhTaskRecovering,
    delete key.rhTaskUseOpenapiQuery,
    delete key.rhStatusMessage,
    delete key.rhStatusCode,
    delete key.dreaminaSubmitId,
    delete key.dreaminaTaskStatus,
    delete key.dreaminaTaskPhase,
    delete key.dreaminaTaskLabel,
    delete key.dreaminaTaskStartedAt,
    delete key.dreaminaTaskLastCheckedAt,
    delete key.dreaminaTaskRecovering,
    delete key.dreaminaTaskLastRaw,
    delete key.asyncTaskProvider,
    delete key.asyncTaskKind,
    delete key.asyncTaskId,
    delete key.asyncTaskStatus,
    delete key.asyncTaskStartedAt,
    delete key.asyncTaskRecovering,
    delete key.mediaTaskId,
    delete key.mediaTaskKind,
    delete key.mediaTaskStatus,
    delete key.mediaTaskProgress,
    delete key.mediaTaskError,
    key
  );
}
export function stripImageGenerationResultStateForDerivedNode(index) {
  const response = stripImageGenerationRuntimeState(index);
  return (
    delete response.images,
    delete response.imageUrl,
    delete response.sourceUrl,
    delete response.thumbUrl,
    delete response.sourceId,
    delete response.thumbId,
    delete response.src,
    delete response.url,
    delete response.resultUrl,
    delete response.localPath,
    delete response.originalLocalPath,
    delete response.displayLocalPath,
    delete response.thumbLocalPath,
    delete response.fileName,
    delete response.isImagesExpanded,
    delete response.mainImageIndex,
    delete response.mask,
    delete response.maskPreview,
    delete response.maskPreviewUrl,
    delete response.maskPolarity,
    delete response.maskSaveToken,
    delete response.videos,
    delete response.isVideosExpanded,
    delete response.mainVideoIndex,
    delete response.videoUrl,
    delete response.videoMetaSrc,
    delete response.coverUrl,
    delete response.audioUrl,
    delete response.duration,
    delete response.taskId,
    delete response.status,
    delete response.progress,
    delete response.error,
    response
  );
}
