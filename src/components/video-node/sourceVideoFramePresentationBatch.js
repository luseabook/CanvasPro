import { stopLoading } from '../../modules/loadingOverlay.js';
import { resetVideoFramePresentation } from '../../services/videoFramePresentation.js';
const pendingCommits = new Map();
let reportedFrames = new WeakMap(),
  frameScheduled = false;
function isCurrentCommit({ node: node, sourceKey: sourceKey, mediaSlotToken: mediaSlotToken }) {
  return !!(
    node &&
    node._currentSrc === sourceKey &&
    node._isCurrentRendererMediaSlotToken(sourceKey, mediaSlotToken)
  );
}
function prepareCommit(entry) {
  if (!isCurrentCommit(entry)) return false;
  const { node: node, sourceKey: sourceKey, mediaSlotToken: mediaSlotToken } = entry;
  if (node._restorePausedFirstFrameNudge(sourceKey))
    return (
      resetVideoFramePresentation(node._video),
      node._syncPosterFrameVisibility({ force: true }),
      node._armFirstVideoFramePresentation(sourceKey, mediaSlotToken),
      false
    );
  return (node._syncPosterFrameVisibility(), stopLoading(node._card), true);
}
function flushPendingCommits() {
  frameScheduled = false;
  const entries = Array.from(pendingCommits.values());
  pendingCommits.clear();
  const prepared = entries.filter(prepareCommit);
  for (const entry of prepared) {
    isCurrentCommit(entry) && (entry.facts = entry.node._getRendererVideoPresentationFacts());
  }
  for (const entry of prepared) {
    if (!entry.facts || !isCurrentCommit(entry)) continue;
    const { node: node, sourceKey: sourceKey, mediaSlotToken: mediaSlotToken, facts: facts } = entry;
    (node._removeNativePosterForPresentedSource(sourceKey, mediaSlotToken, facts),
      node._releaseFastPreviewForPlaybackIfReady(mediaSlotToken, facts),
      node._syncRendererPlaybackPin());
  }
}
export function scheduleSourceVideoFramePresentationCommit(node, sourceKey, mediaSlotToken) {
  if (!node || !sourceKey) return false;
  pendingCommits.set(node, {
    node: node,
    sourceKey: sourceKey,
    mediaSlotToken: mediaSlotToken,
    facts: null,
  });
  if (frameScheduled) return true;
  const requestFrame = globalThis.requestAnimationFrame;
  if (typeof requestFrame !== 'function') return (flushPendingCommits(), true);
  return ((frameScheduled = true), requestFrame(flushPendingCommits), true);
}
export function reportSourceVideoMediaSlotFrameOnce(
  node,
  { sourceKey: sourceKey, mediaSlotToken: mediaSlotToken, presentationFacts: presentationFacts = null } = {},
) {
  const videoEl = node?._video,
    normalizedSourceKey = String(sourceKey || '').trim(),
    sourceEpoch = mediaSlotToken?.sourceEpoch;
  if (!videoEl || !normalizedSourceKey || !Number.isInteger(sourceEpoch)) return false;
  if (
    hasReportedSourceVideoMediaSlotFrame(node, {
      sourceKey: normalizedSourceKey,
      mediaSlotToken: mediaSlotToken,
    })
  )
    return true;
  const reported =
    globalThis.window?.v2Renderer?.reportMediaSlotFrame?.(node.id, {
      slotIndex: 0,
      sourceKey: normalizedSourceKey,
      sourceEpoch: sourceEpoch,
      facts: presentationFacts || node._getRendererVideoPresentationFacts(),
    }) === true;
  return (
    reported &&
      reportedFrames.set(node, {
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
  const videoEl = node?._video,
    normalizedSourceKey = String(sourceKey || '').trim(),
    sourceEpoch = mediaSlotToken?.sourceEpoch;
  if (!videoEl || !normalizedSourceKey || !Number.isInteger(sourceEpoch)) return false;
  const record = reportedFrames.get(node);
  return !!(
    record?.videoEl === videoEl &&
    record.sourceKey === normalizedSourceKey &&
    record.sourceEpoch === sourceEpoch
  );
}
export const __sourceVideoFramePresentationBatchForTest = {
  reset() {
    (pendingCommits.clear(), (reportedFrames = new WeakMap()), (frameScheduled = false));
  },
};
