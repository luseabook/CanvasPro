const VIDEO_NODE_LAYOUT_SIG_IGNORED_KEYS = new Set([
    'x',
    'y',
    'width',
    'height',
    '_bizRev',
    'selected',
    'isSelected',
    'zIndex',
  ]),
  VIDEO_NODE_FOOTER_CONTROL_SIG_IGNORED_KEYS = new Set([
    ...VIDEO_NODE_LAYOUT_SIG_IGNORED_KEYS,
    'prompt',
    'videoUrl',
    'resultUrl',
    'sourceUrl',
    'localPath',
    'displayLocalPath',
    'originalLocalPath',
    'thumbId',
    'thumbUrl',
    'thumbLocalPath',
    'posterUrl',
    'posterLocalPath',
    'mainVideoIndex',
    'isVideosExpanded',
    'videoMetaSrc',
    'videoFps',
    'videoFrameCount',
    'videoDuration',
    'videoWidth',
    'videoHeight',
    'selectedVideoWidth',
    'selectedVideoHeight',
    'isGenerating',
    'jobStatus',
    'jobError',
    'error',
    'statusMessage',
    'rhStatus',
    'rhStatusMessage',
    'rhStatusCode',
    'rhTaskId',
    'rhTaskStatus',
    'rhTaskStartedAt',
    'rhTaskRecovering',
    'rhTaskUseOpenapiQuery',
    'dreaminaSubmitId',
    'dreaminaTaskStatus',
    'dreaminaTaskPhase',
    'dreaminaTaskLabel',
    'dreaminaTaskStartedAt',
    'dreaminaTaskLastCheckedAt',
    'dreaminaTaskRecovering',
    'asyncTaskId',
    'asyncTaskStatus',
    'asyncTaskError',
    'asyncTaskRecovering',
  ]);
function stringifyVideoNodeUpdateSig(value) {
  try {
    return JSON['stringify'](value);
  } catch {
    return '';
  }
}
function isVideoNodeUpdateSigPrimitive(item) {
  return item == null || typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean';
}
function getGenerationParamsForSig(key) {
  return key['generationParams'] &&
    typeof key['generationParams'] === 'object' &&
    !Array['isArray'](key['generationParams'])
    ? key['generationParams']
    : null;
}
function buildVideoNodePrimitiveDataSig(
  options = {},
  { ignoredKeys: ignoredKeys = VIDEO_NODE_LAYOUT_SIG_IGNORED_KEYS } = {},
) {
  const index = options && typeof options === 'object' ? options : {},
    primitive = {};
  return (
    Object['keys'](index)
      ['sort']()
      ['forEach']((result) => {
        if (ignoredKeys['has'](result)) return;
        const data = index[result];
        isVideoNodeUpdateSigPrimitive(data) && (primitive[result] = data ?? null);
      }),
    stringifyVideoNodeUpdateSig({
      primitive: primitive,
      generationParams: getGenerationParamsForSig(index),
    })
  );
}
export function buildVideoNodePromptUiSig(options2 = {}) {
  const target = options2 && typeof options2 === 'object' ? options2 : {};
  return stringifyVideoNodeUpdateSig({
    model: String(target['model'] || ''),
    provider: String(target['provider'] || ''),
  });
}
export function buildVideoNodePromptBoxSizeSig(options3 = {}) {
  const source = options3 && typeof options3 === 'object' ? options3 : {};
  return String(Number(source['promptBoxHeight'] || 0x0) || 0x0);
}
export function buildVideoNodeVideoViewSig(options4 = {}) {
  const isGenerating = options4 && typeof options4 === 'object' ? options4 : {},
    videos = Array['isArray'](isGenerating['videos']) ? isGenerating['videos'] : [];
  return stringifyVideoNodeUpdateSig({
    videos: videos['map']((mediaUnavailable) => ({
      videoUrl: String(mediaUnavailable?.['videoUrl'] || ''),
      resultUrl: String(mediaUnavailable?.['resultUrl'] || ''),
      sourceUrl: String(mediaUnavailable?.['sourceUrl'] || ''),
      localPath: String(mediaUnavailable?.['localPath'] || ''),
      displayLocalPath: String(mediaUnavailable?.['displayLocalPath'] || ''),
      originalLocalPath: String(mediaUnavailable?.['originalLocalPath'] || ''),
      thumbId: String(mediaUnavailable?.['thumbId'] || ''),
      thumbUrl: String(mediaUnavailable?.['thumbUrl'] || ''),
      thumbLocalPath: String(mediaUnavailable?.['thumbLocalPath'] || ''),
      posterUrl: String(mediaUnavailable?.['posterUrl'] || ''),
      posterLocalPath: String(mediaUnavailable?.['posterLocalPath'] || ''),
      error: String(mediaUnavailable?.['error'] || ''),
      mediaUnavailable: mediaUnavailable?.['mediaUnavailable'] === !![],
      mediaUnavailableSource: String(mediaUnavailable?.['mediaUnavailableSource'] || ''),
    })),
    videoUrl: String(isGenerating['videoUrl'] || ''),
    resultUrl: String(isGenerating['resultUrl'] || ''),
    sourceUrl: String(isGenerating['sourceUrl'] || ''),
    localPath: String(isGenerating['localPath'] || ''),
    displayLocalPath: String(isGenerating['displayLocalPath'] || ''),
    originalLocalPath: String(isGenerating['originalLocalPath'] || ''),
    thumbId: String(isGenerating['thumbId'] || ''),
    thumbUrl: String(isGenerating['thumbUrl'] || ''),
    thumbLocalPath: String(isGenerating['thumbLocalPath'] || ''),
    posterUrl: String(isGenerating['posterUrl'] || ''),
    posterLocalPath: String(isGenerating['posterLocalPath'] || ''),
    mainVideoIndex: Number(isGenerating['mainVideoIndex'] || 0x0),
    isVideosExpanded: !!isGenerating['isVideosExpanded'],
    isGenerating: isGenerating['isGenerating'] === !![],
    jobStatus: String(isGenerating['jobStatus'] || ''),
    jobError: String(isGenerating['jobError'] || ''),
    error: String(isGenerating['error'] || ''),
    statusMessage: String(isGenerating['statusMessage'] || ''),
    rhStatus: String(isGenerating['rhStatus'] || ''),
    rhStatusMessage: String(isGenerating['rhStatusMessage'] || ''),
    rhStatusCode: String(isGenerating['rhStatusCode'] || ''),
    rhTaskId: String(isGenerating['rhTaskId'] || ''),
    rhTaskStatus: String(isGenerating['rhTaskStatus'] || ''),
    rhTaskStartedAt: Number(isGenerating['rhTaskStartedAt'] || 0x0),
    rhTaskRecovering: !!isGenerating['rhTaskRecovering'],
    rhTaskUseOpenapiQuery: !!isGenerating['rhTaskUseOpenapiQuery'],
    dreaminaSubmitId: String(isGenerating['dreaminaSubmitId'] || ''),
    dreaminaTaskStatus: String(isGenerating['dreaminaTaskStatus'] || ''),
    dreaminaTaskPhase: String(isGenerating['dreaminaTaskPhase'] || ''),
    dreaminaTaskLabel: String(isGenerating['dreaminaTaskLabel'] || ''),
    dreaminaTaskStartedAt: Number(isGenerating['dreaminaTaskStartedAt'] || 0x0),
    dreaminaTaskLastCheckedAt: Number(isGenerating['dreaminaTaskLastCheckedAt'] || 0x0),
    dreaminaTaskRecovering: !!isGenerating['dreaminaTaskRecovering'],
    asyncTaskId: String(isGenerating['asyncTaskId'] || ''),
    asyncTaskStatus: String(isGenerating['asyncTaskStatus'] || ''),
    asyncTaskError: String(isGenerating['asyncTaskError'] || ''),
    asyncTaskRecovering: !!isGenerating['asyncTaskRecovering'],
  });
}
export function buildVideoNodeFooterControlSig(options5 = {}, next = '') {
  return [
    next,
    buildVideoNodePrimitiveDataSig(options5, { ignoredKeys: VIDEO_NODE_FOOTER_CONTROL_SIG_IGNORED_KEYS }),
  ]['join']('\x0a');
}
export function buildVideoNodeSubmitButtonSig(options6 = {}, current = '', entry = {}) {
  return [
    current,
    entry['rhCancelInFlight'] === !![] ? 'cancel:1' : 'cancel:0',
    buildVideoNodePrimitiveDataSig(options6),
  ]['join']('\x0a');
}
