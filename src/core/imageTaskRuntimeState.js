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
function isActiveGenerationJobStatus(_0x1e2d1e) {
  return GENERATION_ACTIVE_JOB_STATUSES.has(
    String(_0x1e2d1e || '')
      .trim()
      .toLowerCase(),
  );
}
export function stripImageGenerationRuntimeState(_0x57f1c4) {
  const _0xe57ee9 = _0x57f1c4 && typeof _0x57f1c4 === 'object' ? _0x57f1c4 : {};
  return (
    delete _0xe57ee9.isGenerating,
    isActiveGenerationJobStatus(_0xe57ee9.jobStatus) && delete _0xe57ee9.jobStatus,
    delete _0xe57ee9.taskCancellable,
    delete _0xe57ee9.taskResumable,
    delete _0xe57ee9.taskAdapterType,
    delete _0xe57ee9.generationStartTime,
    delete _0xe57ee9.generationDuration,
    delete _0xe57ee9.rhTaskId,
    delete _0xe57ee9.rhTaskStatus,
    delete _0xe57ee9.rhTaskStartedAt,
    delete _0xe57ee9.rhTaskRecovering,
    delete _0xe57ee9.rhTaskUseOpenapiQuery,
    delete _0xe57ee9.rhStatusMessage,
    delete _0xe57ee9.rhStatusCode,
    delete _0xe57ee9.dreaminaSubmitId,
    delete _0xe57ee9.dreaminaTaskStatus,
    delete _0xe57ee9.dreaminaTaskPhase,
    delete _0xe57ee9.dreaminaTaskLabel,
    delete _0xe57ee9.dreaminaTaskStartedAt,
    delete _0xe57ee9.dreaminaTaskLastCheckedAt,
    delete _0xe57ee9.dreaminaTaskRecovering,
    delete _0xe57ee9.dreaminaTaskLastRaw,
    delete _0xe57ee9.asyncTaskProvider,
    delete _0xe57ee9.asyncTaskKind,
    delete _0xe57ee9.asyncTaskId,
    delete _0xe57ee9.asyncTaskStatus,
    delete _0xe57ee9.asyncTaskStartedAt,
    delete _0xe57ee9.asyncTaskRecovering,
    delete _0xe57ee9.mediaTaskId,
    delete _0xe57ee9.mediaTaskKind,
    delete _0xe57ee9.mediaTaskStatus,
    delete _0xe57ee9.mediaTaskProgress,
    delete _0xe57ee9.mediaTaskError,
    _0xe57ee9
  );
}
export function stripImageGenerationResultStateForDerivedNode(_0x58bba2) {
  const _0x39ae9b = stripImageGenerationRuntimeState(_0x58bba2);
  return (
    delete _0x39ae9b.images,
    delete _0x39ae9b.imageUrl,
    delete _0x39ae9b.sourceUrl,
    delete _0x39ae9b.thumbUrl,
    delete _0x39ae9b.sourceId,
    delete _0x39ae9b.thumbId,
    delete _0x39ae9b.src,
    delete _0x39ae9b.url,
    delete _0x39ae9b.resultUrl,
    delete _0x39ae9b.localPath,
    delete _0x39ae9b.originalLocalPath,
    delete _0x39ae9b.displayLocalPath,
    delete _0x39ae9b.thumbLocalPath,
    delete _0x39ae9b.fileName,
    delete _0x39ae9b.isImagesExpanded,
    delete _0x39ae9b.mainImageIndex,
    delete _0x39ae9b.mask,
    delete _0x39ae9b.maskPreview,
    delete _0x39ae9b.maskPreviewUrl,
    delete _0x39ae9b.maskPolarity,
    delete _0x39ae9b.maskSaveToken,
    delete _0x39ae9b.videos,
    delete _0x39ae9b.isVideosExpanded,
    delete _0x39ae9b.mainVideoIndex,
    delete _0x39ae9b.videoUrl,
    delete _0x39ae9b.videoMetaSrc,
    delete _0x39ae9b.coverUrl,
    delete _0x39ae9b.audioUrl,
    delete _0x39ae9b.duration,
    delete _0x39ae9b.taskId,
    delete _0x39ae9b.status,
    delete _0x39ae9b.progress,
    delete _0x39ae9b.error,
    _0x39ae9b
  );
}
