import { isNodeType } from '../modules/registry.js';
import { createRendererMediaSlotLifecycle, isRendererMediaSlotStable } from './rendererMediaSlotLifecycle.js';
function getSlotKey(_0x17d50d, _0xd8001f = 0x0) {
  return String(_0x17d50d || '') + ':' + Math['max'](0x0, Math['trunc'](Number(_0xd8001f) || 0x0));
}
function clearReleasedPreviewDataset(_0x3353da) {
  if (!_0x3353da?.['dataset']) return;
  (delete _0x3353da['dataset']['fastPreviewReleasedForPlayback'],
    delete _0x3353da['dataset']['fastPreviewReleasedSourceKey']);
}
export function createRendererSourceVideoSlotLifecycle({
  getNode: _0x191ece,
  getWrapper: _0x4f3da0,
  releasePreview: _0x2008e6,
  forgetScheduledRelease: _0x41dda4,
} = {}) {
  let _0x225721 = createRendererMediaSlotLifecycle();
  function _0x1d38ba(_0x1389c5) {
    return isNodeType(_0x191ece?.(_0x1389c5), 'source-video');
  }
  function _0x4a37b5(_0x3de362, _0xa36a2e = 0x0) {
    return _0x225721['read'](getSlotKey(_0x3de362, _0xa36a2e));
  }
  function _0x1a61cb(_0x3437ed) {
    if (!_0x1d38ba(_0x3437ed)) return undefined;
    return _0x4a37b5(_0x3437ed)['surface'] === 'media';
  }
  function _0x409401(_0x8d9c40, _0x2d0320, { slotIndex: slotIndex = 0x0, rebind: rebind = ![] } = {}) {
    if (!_0x8d9c40 || !_0x1d38ba(_0x8d9c40)) return null;
    const _0x152888 = _0x225721['transition'](getSlotKey(_0x8d9c40, slotIndex), {
      type: 'source-intent',
      sourceKey: _0x2d0320,
      rebind: rebind === !![],
    });
    if (_0x152888['changed']) clearReleasedPreviewDataset(_0x4f3da0?.(_0x8d9c40));
    return _0x152888['state'];
  }
  function _0x59dbd4(_0xd23672, _0x26ee56 = {}) {
    if (!_0xd23672 || !_0x1d38ba(_0xd23672)) return ![];
    const _0xf2f367 = _0x225721['transition'](getSlotKey(_0xd23672, _0x26ee56['slotIndex']), {
      type: 'frame-observed',
      sourceKey: _0x26ee56['sourceKey'],
      sourceEpoch: _0x26ee56['sourceEpoch'],
      facts: _0x26ee56['facts'],
    });
    if (!_0xf2f367['accepted'] || !isRendererMediaSlotStable(_0xf2f367['state'])) return ![];
    if (_0x2008e6?.(_0xd23672) !== !![]) return ![];
    const _0x3ea440 = _0x4f3da0?.(_0xd23672);
    return (
      _0x3ea440?.['dataset'] &&
        ((_0x3ea440['dataset']['fastPreviewReleasedForPlayback'] = '1'),
        (_0x3ea440['dataset']['fastPreviewReleasedSourceKey'] = _0xf2f367['state']['sourceKey'])),
      _0x41dda4?.(_0xd23672),
      !![]
    );
  }
  function _0x25a55c(_0x45895d, _0x4f5068, _0x303aec = 0x0) {
    if (!_0x45895d || !_0x1d38ba(_0x45895d)) return null;
    return _0x225721['transition'](getSlotKey(_0x45895d, _0x303aec), {
      type: 'visibility',
      visibilityTier: _0x4f5068,
    })['state'];
  }
  function _0xc0b622(
    _0x43abdb,
    {
      isSelected: isSelected = ![],
      isVisible: isVisible = ![],
      isPreviewCandidate: isPreviewCandidate = ![],
    } = {},
  ) {
    return _0x25a55c(
      _0x43abdb,
      isSelected ? 'focused' : isVisible ? 'visible' : isPreviewCandidate ? 'near' : 'far',
    );
  }
  function _0x3ccde1(_0x1f2194, _0x5c7c1d, _0xd7f92b = 0x0) {
    if (!_0x1f2194 || !_0x1d38ba(_0x1f2194)) return null;
    const _0x3e0fbc = _0x225721['transition'](getSlotKey(_0x1f2194, _0xd7f92b), {
      type: 'residency',
      residency: _0x5c7c1d,
    });
    return (
      _0x3e0fbc['accepted'] && _0x5c7c1d !== 'mounted' && clearReleasedPreviewDataset(_0x4f3da0?.(_0x1f2194)),
      _0x3e0fbc['state']
    );
  }
  function _0x2a39d6(_0x257e3d, _0x34f7c4 = 0x0) {
    if (!_0x1d38ba(_0x257e3d)) return ![];
    const _0x22c0ca = _0x4a37b5(_0x257e3d, _0x34f7c4);
    return _0x22c0ca['surface'] === 'media' && _0x22c0ca['visibilityTier'] !== 'far';
  }
  function _0x58fee0(_0x496bc4, _0x168e98 = 0x0) {
    if (!_0x496bc4 || !_0x1d38ba(_0x496bc4)) return null;
    const _0x3512ee = _0x4a37b5(_0x496bc4, _0x168e98),
      _0x1d688b = _0x225721['transition'](getSlotKey(_0x496bc4, _0x168e98), {
        type: 'source-intent',
        sourceKey: _0x3512ee['sourceKey'],
        rebind: !![],
      });
    return (clearReleasedPreviewDataset(_0x4f3da0?.(_0x496bc4)), _0x1d688b['state']);
  }
  function _0x35ddb4(_0x34c305, _0x417381 = 0x0) {
    return _0x225721['forget'](getSlotKey(_0x34c305, _0x417381));
  }
  function _0x297286() {
    _0x225721 = createRendererMediaSlotLifecycle();
  }
  return Object['freeze']({
    forget: _0x35ddb4,
    isManagedNode: _0x1d38ba,
    prepareSource: _0x409401,
    read: _0x4a37b5,
    reportFrame: _0x59dbd4,
    reset: _0x297286,
    resolveMediaPresentationReady: _0x1a61cb,
    setResidency: _0x3ccde1,
    shouldRetainPresentedSurface: _0x2a39d6,
    suspendPresentedSurface: _0x58fee0,
    syncVisibility: _0x25a55c,
    syncViewportVisibility: _0xc0b622,
  });
}
export const __rendererSourceVideoSlotLifecycleForTest = Object['freeze']({
  clearReleasedPreviewDataset: clearReleasedPreviewDataset,
  getSlotKey: getSlotKey,
});
