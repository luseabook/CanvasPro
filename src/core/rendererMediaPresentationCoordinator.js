import { createNodeDetailHydrationController } from './rendererNodeDetailHydration.js';
import { createRendererDeferredMediaController } from './rendererDeferredMedia.js';
import { createRendererVideoMediaResidencyController } from './rendererVideoMediaResidency.js';
import { createRendererVideoHydrationBackpressure } from './rendererVideoHydrationBackpressure.js';
import { resolveCanvasVideoPosterUrl } from '../services/canvasMediaLocalService.js';
const VIDEO_TYPES = new Set(['source-video', 'ai-video', 'video']);
export function createRendererMediaPresentationCoordinator({
  getNode: _0x144c77,
  getComponent: _0x49a6ce,
  getWrapper: _0x5d4b67,
  getParkedWrapper: _0x285e37,
  getWrappers: _0x3b13bb,
  getParkedWrappers: _0x381117,
  isMounted: _0x492ea4,
  isInteractionBusy: _0x1bd25b,
  isPinned: _0x385706,
  isSelected: _0x33a88b,
  preview: _0x36fec2,
  previewRelease: _0x54ef19,
  videoSlots: _0x4dc2b5,
  videoBackpressure: videoBackpressure = createRendererVideoHydrationBackpressure(),
  batchSize: batchSize = 0x2,
  presentedMediaLeaseMs: presentedMediaLeaseMs = 0x258,
  maxRetainedPresentedMedia: maxRetainedPresentedMedia = 0x3,
  suspendDelayMs: _0x1700ee,
  onHydrateDiagnostic: _0x1f758e,
  onParkSuspendDiagnostic: _0x19809e,
} = {}) {
  const _0x499ef8 = (_0x392e71) => VIDEO_TYPES['has'](_0x144c77?.(_0x392e71)?.['type']),
    _0x4ffd96 = (_0x3bad9b) => _0x49a6ce?.(_0x3bad9b)?.['getRendererMediaState']?.() || {};
  let _0x8aa6c9;
  const _0x352a10 = createRendererVideoMediaResidencyController({
    getComponent: _0x49a6ce,
    getWrapper: _0x5d4b67,
    isMounted: _0x492ea4,
    presentedMediaLeaseMs: presentedMediaLeaseMs,
    maxRetainedPresentedMedia: maxRetainedPresentedMedia,
    suspendDelayMs: _0x1700ee,
    isMediaDeferred: (_0x346cdf) => _0x4ffd96(_0x346cdf)['deferred'] === !![],
    isPlaybackActive: (_0x57db47, _0xcd4f80, _0x4c2666) => {
      if (_0x385706?.(_0x57db47)) return !![];
      return [...(_0x4c2666?.['querySelectorAll']?.('video, audio') || [])]['some'](
        (_0x2950f7) => _0x2950f7['paused'] === ![] && _0x2950f7['ended'] !== !![],
      );
    },
    shouldRetainPresentedMedia: (_0x26501c, _0x5d41fc) => {
      try {
        return _0x5d41fc?.['hasPresentedRendererMedia']?.() === !![];
      } catch {
        return ![];
      }
    },
    isRetentionProtected: (_0x448660) =>
      _0x33a88b?.(_0x448660) === !![] || _0x4ffd96(_0x448660)['interactionActive'] === !![],
    onSuspend: (_0x4e8ffd, _0x4bc467) => {
      _0x36fec2['retainNode'](_0x4e8ffd);
      const _0x2a3967 = _0x36fec2['isNodePreviewReady'](_0x4e8ffd),
        _0x279594 = _0x4bc467?.['prepareRendererMediaFallbackForSuspend']?.() === !![];
      if (!_0x2a3967 && !_0x279594) return ![];
      return (
        _0x8aa6c9['forget'](_0x4e8ffd),
        _0x54ef19['forget'](_0x4e8ffd),
        _0x4bc467?.['suspendRendererMedia']?.(),
        _0x4dc2b5['suspendPresentedSurface'](_0x4e8ffd),
        !![]
      );
    },
    onParkSuspend: (_0x44c9f8, _0x58c25a) => {
      const _0x2c9b24 = _0x19809e ? performance['now']() : 0x0;
      try {
        _0x58c25a?.['suspendRendererMedia']?.();
      } catch {}
      _0x19809e?.({ nodeId: _0x44c9f8, durationMs: performance['now']() - _0x2c9b24 });
    },
    onResume: (_0x3821ea, _0xd15bb8) => {
      if (_0xd15bb8?.['prepareRendererVisibleVideoPreview']?.() !== !![]) return;
      (_0x36fec2['retainNode'](_0x3821ea), _0x8aa6c9['enqueue'](_0x3821ea, { urgent: !![] }));
    },
  });
  _0x8aa6c9 = createRendererDeferredMediaController({
    getComponent: _0x49a6ce,
    isInteractionBusy: _0x1bd25b,
    batchSize: batchSize,
    getNodeType: (_0x4c616b) => _0x144c77?.(_0x4c616b)?.['type'],
    onHydrateMedia: _0x54ef19['schedule'],
    onHydrateDiagnostic: _0x1f758e,
    canHydrateMedia: _0x352a10['isHydrationAllowed'],
    canHydrateVideo: () => videoBackpressure['tryAcquire'](),
  });
  const _0x1f6ec3 = createNodeDetailHydrationController({
    getWrapper: _0x5d4b67,
    getParkedWrapper: _0x285e37,
    getWrappers: _0x3b13bb,
    getParkedWrappers: _0x381117,
    isMounted: _0x492ea4,
    isInteractionBusy: _0x1bd25b,
    isVideoNodeDetails: _0x499ef8,
    canHydrateVideoDetails: () => videoBackpressure['tryAcquire'](),
    onHydrateNodeDetails: (_0x217c9f) => {
      (_0x49a6ce?.(_0x217c9f)?.['hydrateDeferredDetails']?.(),
        _0x36fec2['retainNode'](_0x217c9f),
        (!_0x499ef8(_0x217c9f) || !resolveCanvasVideoPosterUrl(_0x144c77?.(_0x217c9f))) &&
          _0x8aa6c9['enqueue'](_0x217c9f));
    },
  });
  function _0x28b8e7(_0x35cae2) {
    (_0x1f6ec3['forgetNodeDetailHydration'](_0x35cae2),
      _0x8aa6c9['forget'](_0x35cae2),
      _0x54ef19['forget'](_0x35cae2));
  }
  function _0x3704c2(_0x37c17b) {
    (_0x352a10['forget'](_0x37c17b), _0x28b8e7(_0x37c17b));
  }
  function _0x72dece() {
    (_0x8aa6c9['pause'](), _0x1f6ec3['pause']());
  }
  function _0x35c6ba() {
    (_0x1f6ec3['resumeNodeDetailHydration'](), _0x8aa6c9['resume']());
  }
  function _0x2567ec() {
    (_0x1f6ec3['clearNodeDetailHydrationState'](),
      _0x8aa6c9['clear'](),
      _0x352a10['clear'](),
      videoBackpressure['reset'](),
      _0x54ef19['clear']());
  }
  return Object['freeze']({
    media: _0x8aa6c9,
    details: _0x1f6ec3,
    residency: _0x352a10,
    videoBackpressure: videoBackpressure,
    forgetHydration: _0x28b8e7,
    forget: _0x3704c2,
    pause: _0x72dece,
    resume: _0x35c6ba,
    clear: _0x2567ec,
  });
}
