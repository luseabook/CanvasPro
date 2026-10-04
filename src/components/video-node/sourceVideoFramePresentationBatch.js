import { stopLoading } from '../../modules/loadingOverlay.js';
import { resetVideoFramePresentation } from '../../services/videoFramePresentation.js';
const pendingCommits = new Map();
let reportedFrames = new WeakMap(),
  frameScheduled = ![];
function isCurrentCommit({ node: node, sourceKey: sourceKey, mediaSlotToken: mediaSlotToken }) {
  return !!(
    node &&
    node['_currentSrc'] === sourceKey &&
    node['_isCurrentRendererMediaSlotToken'](sourceKey, mediaSlotToken)
  );
}
function prepareCommit(entry) {
  if (!isCurrentCommit(entry)) return ![];
  const { node: node, sourceKey: sourceKey, mediaSlotToken: mediaSlotToken } = entry;
  if (node['_restorePausedFirstFrameNudge'](sourceKey))
    return (
      resetVideoFramePresentation(node['_video']),
      node['_syncPosterFrameVisibility']({ force: !![] }),
      node['_armFirstVideoFramePresentation'](sourceKey, mediaSlotToken),
      ![]
    );
  return (node['_syncPosterFrameVisibility'](), stopLoading(node['_card']), !![]);
}
function flushPendingCommits() {
  frameScheduled = ![];
  const entries = Array['from'](pendingCommits['values']());
  pendingCommits['clear']();
  const prepared = entries['filter'](prepareCommit);
  for (const entry of prepared) {
    isCurrentCommit(entry) && (entry['facts'] = entry['node']['_getRendererVideoPresentationFacts']());
  }
  for (const entry of prepared) {
    if (!entry['facts'] || !isCurrentCommit(entry)) continue;
    const { node: node, sourceKey: sourceKey, mediaSlotToken: mediaSlotToken, facts: facts } = entry;
    (node['_removeNativePosterForPresentedSource'](sourceKey, mediaSlotToken, facts),
      node['_releaseFastPreviewForPlaybackIfReady'](mediaSlotToken, facts),
      node['_syncRendererPlaybackPin']());
  }
}
export function scheduleSourceVideoFramePresentationCommit(node, sourceKey, mediaSlotToken) {
  if (!node || !sourceKey) return ![];
  pendingCommits['set'](node, {
    node: node,
    sourceKey: sourceKey,
    mediaSlotToken: mediaSlotToken,
    facts: null,
  });
  if (frameScheduled) return !![];
  const requestFrame = globalThis['requestAnimationFrame'];
  if (typeof requestFrame !== 'function') return (flushPendingCommits(), !![]);
  return ((frameScheduled = !![]), requestFrame(flushPendingCommits), !![]);
}
export function reportSourceVideoMediaSlotFrameOnce(
  node,
  { sourceKey: sourceKey, mediaSlotToken: mediaSlotToken, presentationFacts: presentationFacts = null } = {},
) {
  const videoEl = node?.['_video'],
    normalizedSourceKey = String(sourceKey || '')['trim'](),
    sourceEpoch = mediaSlotToken?.['sourceEpoch'];
  if (!videoEl || !normalizedSourceKey || !Number['isInteger'](sourceEpoch)) return ![];
  if (
    hasReportedSourceVideoMediaSlotFrame(node, {
      sourceKey: normalizedSourceKey,
      mediaSlotToken: mediaSlotToken,
    })
  )
    return !![];
  const reported =
    globalThis['window']?.['v2Renderer']?.['reportMediaSlotFrame']?.(node['id'], {
      slotIndex: 0x0,
      sourceKey: normalizedSourceKey,
      sourceEpoch: sourceEpoch,
      facts: presentationFacts || node['_getRendererVideoPresentationFacts'](),
    }) === !![];
  return (
    reported &&
      reportedFrames['set'](node, {
        videoEl: videoEl,
        sourceKey: normalizedSourceKey,
        sourceEpoch: sourceEpoch,
      }),
    reported
  );
}
export function hasReportedSourceVideoMediaSlotFrame(
  node,
  { sourceKey: sourceKey, mediaSlotToken: mediaSlotToken } = {},
) {
  const videoEl = node?.['_video'],
    normalizedSourceKey = String(sourceKey || '')['trim'](),
    sourceEpoch = mediaSlotToken?.['sourceEpoch'];
  if (!videoEl || !normalizedSourceKey || !Number['isInteger'](sourceEpoch)) return ![];
  const record = reportedFrames['get'](node);
  return !!(
    record?.['videoEl'] === videoEl &&
    record['sourceKey'] === normalizedSourceKey &&
    record['sourceEpoch'] === sourceEpoch
  );
}
export const __sourceVideoFramePresentationBatchForTest = {
  reset() {
    (pendingCommits['clear'](), (reportedFrames = new WeakMap()), (frameScheduled = ![]));
  },
};
