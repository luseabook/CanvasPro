import { normalizePersonReplacementCompositeSidebarWidth } from './personReplacementProjectSession.js';
function normalizeText(value, item = '') {
  const key = String(value ?? '').trim();
  return key || item;
}
function projectShot(options = {}) {
  return Object.freeze({
    id: normalizeText(options?.id),
    sourceId: normalizeText(options?.sourceId),
    title: normalizeText(options?.title),
    videoRef: normalizeText(options?.videoRef),
    sourceVideoRef: normalizeText(options?.sourceVideoRef),
    resultVideoRef: normalizeText(options?.resultVideoRef),
    keyframeRef: normalizeText(options?.keyframeRef),
    replacementImageRef: normalizeText(options?.replacementImageRef),
    startTimeSec: Number(options?.startTimeSec) || 0,
    endTimeSec: Number(options?.endTimeSec) || 0,
    durationSec: Number(options?.durationSec) || 0,
    outputFps: Number(options?.outputFps) || 0,
  });
}
function resolveSelectedShot(index, list) {
  const text = normalizeText(index.workspace?.selectedShotId);
  return list.find((result) => normalizeText(result?.id) === text) || list[0] || null;
}
function resolveFullMedia(data) {
  const originalRef = normalizeText(data.output?.originalMasterRef);
  return {
    originalRef: originalRef,
    replacementRef: normalizeText(data.output?.visualMasterRef || data.output?.finalVideoRef),
    originalAudioRef: normalizeText(data.audio?.originalAudioRef || originalRef),
    replacementAudioRef: normalizeText(data.audio?.replacementAudioRef),
  };
}
function resolveShotMedia(target, list2, source) {
  const list3 = Array.isArray(target.sources) ? target.sources : [],
    next =
      list3.find((current) => normalizeText(current?.id) === normalizeText(source?.sourceId)) ||
      target.source ||
      {},
    text2 = normalizeText(target.audio?.selectedSourceId),
    replacementAudioRef =
      target.audio?.replacementAudioRef &&
      (!text2 || text2 === normalizeText(source?.sourceId) || list3.length <= 1)
        ? normalizeText(target.audio.replacementAudioRef)
        : '';
  return {
    originalRef: normalizeText(source?.videoRef || source?.sourceVideoRef || next?.videoRef),
    replacementRef: normalizeText(
      source?.resultVideoRef ||
        (list2.length === 1
          ? target.output?.finalVideoRef || target.output?.visualMasterRef
          : ''),
    ),
    replacementAudioRef: replacementAudioRef,
  };
}
export function buildPersonReplacementCompositePreviewSnapshot(selectionMode = {}) {
  const completed = (Array.isArray(selectionMode.shots) ? selectionMode.shots : []).map(
      projectShot,
    ),
    selectedShot = resolveSelectedShot(selectionMode, completed),
    args = resolveFullMedia(selectionMode),
    args2 = resolveShotMedia(selectionMode, completed, selectedShot),
    fullAvailable = Boolean(args.originalRef && args.replacementRef),
    composeSucceeded = selectionMode.output?.composeStatus === 'succeeded' && fullAvailable,
    compositionStale = fullAvailable && !composeSucceeded,
    previewMode =
      selectionMode.workspace?.compositePreviewMode === 'full' && fullAvailable ? 'full' : 'shot',
    map = new Set(
      (Array.isArray(selectionMode.output?.composedShotIds)
        ? selectionMode.output.composedShotIds
        : [])
        .map(normalizeText)
        .filter(Boolean),
    ),
    args3 = completed.filter((entry) => map.has(normalizeText(entry?.id))),
    args4 = Array.isArray(selectionMode.workspace?.selectedShotIds)
      ? selectionMode.workspace.selectedShotIds
      : [],
    args5 = previewMode === 'full' ? args : args2;
  return Object.freeze({
    title: normalizeText(selectionMode.title),
    shots: Object.freeze([...completed]),
    selectedShot: selectedShot,
    selectedShotIds: Object.freeze([...args4]),
    selectionMode: selectionMode.workspace?.shotSelectionMode === true,
    previewMode: previewMode,
    fullAvailable: fullAvailable,
    composedShots: Object.freeze([...args3]),
    media: Object.freeze({ ...args5 }),
    shotMedia: Object.freeze({ ...args2 }),
    fullMedia: Object.freeze({ ...args }),
    previewTrack: selectionMode.audio?.previewTrack === 'original' ? 'original' : 'replacement',
    completed: completed.filter((record) => normalizeText(record?.resultVideoRef)).length,
    total: completed.length,
    selectedShotIndex: Math.max(
      0,
      completed.findIndex(
        (payload) => normalizeText(payload?.id) === normalizeText(selectedShot?.id),
      ),
    ),
    composeSucceeded: composeSucceeded,
    compositionStale: compositionStale,
    canCompare: Boolean(args5.originalRef && args5.replacementRef),
    sidebarWidth: normalizePersonReplacementCompositeSidebarWidth(
      selectionMode.workspace?.compositeSidebarWidth,
    ),
  });
}
