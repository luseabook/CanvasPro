import { stopLoading } from '../../modules/loadingOverlay.js';
import { resetVideoFramePresentation } from '../../services/videoFramePresentation.js';
const pendingCommits = new Map();
let reportedFrames = new WeakMap(),
  frameScheduled = ![];
function isCurrentCommit({ node: _0x401cbf, sourceKey: _0x5db0e8, mediaSlotToken: _0xd62bad }) {
  return !!(
    _0x401cbf &&
    _0x401cbf['_currentSrc'] === _0x5db0e8 &&
    _0x401cbf['_isCurrentRendererMediaSlotToken'](_0x5db0e8, _0xd62bad)
  );
}
function prepareCommit(_0xd09f7f) {
  if (!isCurrentCommit(_0xd09f7f)) return ![];
  const { node: _0x125ffd, sourceKey: _0x5c3f3c, mediaSlotToken: _0x5094c5 } = _0xd09f7f;
  if (_0x125ffd['_restorePausedFirstFrameNudge'](_0x5c3f3c))
    return (
      resetVideoFramePresentation(_0x125ffd['_video']),
      _0x125ffd['_syncPosterFrameVisibility']({ force: !![] }),
      _0x125ffd['_armFirstVideoFramePresentation'](_0x5c3f3c, _0x5094c5),
      ![]
    );
  return (_0x125ffd['_syncPosterFrameVisibility'](), stopLoading(_0x125ffd['_card']), !![]);
}
function flushPendingCommits() {
  frameScheduled = ![];
  const _0x1bc286 = Array['from'](pendingCommits['values']());
  pendingCommits['clear']();
  const _0x28417d = _0x1bc286['filter'](prepareCommit);
  for (const _0x545b99 of _0x28417d) {
    isCurrentCommit(_0x545b99) &&
      (_0x545b99['facts'] = _0x545b99['node']['_getRendererVideoPresentationFacts']());
  }
  for (const _0x25b675 of _0x28417d) {
    if (!_0x25b675['facts'] || !isCurrentCommit(_0x25b675)) continue;
    const { node: _0x5d6d6b, sourceKey: _0x9dfa93, mediaSlotToken: _0xb0e85e, facts: _0x309c69 } = _0x25b675;
    (_0x5d6d6b['_removeNativePosterForPresentedSource'](_0x9dfa93, _0xb0e85e, _0x309c69),
      _0x5d6d6b['_releaseFastPreviewForPlaybackIfReady'](_0xb0e85e, _0x309c69),
      _0x5d6d6b['_syncRendererPlaybackPin']());
  }
}
export function scheduleSourceVideoFramePresentationCommit(_0x41d87f, _0x26eb93, _0x40d74b) {
  if (!_0x41d87f || !_0x26eb93) return ![];
  pendingCommits['set'](_0x41d87f, {
    node: _0x41d87f,
    sourceKey: _0x26eb93,
    mediaSlotToken: _0x40d74b,
    facts: null,
  });
  if (frameScheduled) return !![];
  const _0x5f4161 = globalThis['requestAnimationFrame'];
  if (typeof _0x5f4161 !== 'function') return (flushPendingCommits(), !![]);
  return ((frameScheduled = !![]), _0x5f4161(flushPendingCommits), !![]);
}
export function reportSourceVideoMediaSlotFrameOnce(
  _0x56bc93,
  { sourceKey: _0x21dfbb, mediaSlotToken: _0x3d183a, presentationFacts: presentationFacts = null } = {},
) {
  const _0x7a1d35 = _0x56bc93?.['_video'],
    _0xe3491c = String(_0x21dfbb || '')['trim'](),
    _0x589610 = _0x3d183a?.['sourceEpoch'];
  if (!_0x7a1d35 || !_0xe3491c || !Number['isInteger'](_0x589610)) return ![];
  if (hasReportedSourceVideoMediaSlotFrame(_0x56bc93, { sourceKey: _0xe3491c, mediaSlotToken: _0x3d183a }))
    return !![];
  const _0x3b77ca =
    globalThis['window']?.['v2Renderer']?.['reportMediaSlotFrame']?.(_0x56bc93['id'], {
      slotIndex: 0x0,
      sourceKey: _0xe3491c,
      sourceEpoch: _0x589610,
      facts: presentationFacts || _0x56bc93['_getRendererVideoPresentationFacts'](),
    }) === !![];
  return (
    _0x3b77ca &&
      reportedFrames['set'](_0x56bc93, { videoEl: _0x7a1d35, sourceKey: _0xe3491c, sourceEpoch: _0x589610 }),
    _0x3b77ca
  );
}
export function hasReportedSourceVideoMediaSlotFrame(
  _0x37cd2f,
  { sourceKey: _0x3c6d09, mediaSlotToken: _0x56dcba } = {},
) {
  const _0x365f88 = _0x37cd2f?.['_video'],
    _0x3c764d = String(_0x3c6d09 || '')['trim'](),
    _0x2a6c90 = _0x56dcba?.['sourceEpoch'];
  if (!_0x365f88 || !_0x3c764d || !Number['isInteger'](_0x2a6c90)) return ![];
  const _0x4278ed = reportedFrames['get'](_0x37cd2f);
  return !!(
    _0x4278ed?.['videoEl'] === _0x365f88 &&
    _0x4278ed['sourceKey'] === _0x3c764d &&
    _0x4278ed['sourceEpoch'] === _0x2a6c90
  );
}
export const __sourceVideoFramePresentationBatchForTest = {
  reset() {
    (pendingCommits['clear'](), (reportedFrames = new WeakMap()), (frameScheduled = ![]));
  },
};
