import { isNodeType } from '../modules/registry.js';
import { createRendererMediaSlotLifecycle, isRendererMediaSlotStable } from './rendererMediaSlotLifecycle.js';
function getSlotKey(value, item = 0) {
  return String(value || '') + ':' + Math['max'](0, Math['trunc'](Number(item) || 0));
}
function clearReleasedPreviewDataset(el) {
  if (!el?.['dataset']) return;
  (delete el['dataset']['fastPreviewReleasedForPlayback'],
    delete el['dataset']['fastPreviewReleasedSourceKey']);
}
export function createRendererSourceVideoSlotLifecycle({
  getNode: getNode,
  getWrapper: getWrapper,
  releasePreview: releasePreview,
  forgetScheduledRelease: forgetScheduledRelease,
} = {}) {
  let rendererMediaSlotLifecycle = createRendererMediaSlotLifecycle();
  function isManagedNode(key) {
    return isNodeType(getNode?.(key), 'source-video');
  }
  function read(index, result = 0) {
    return rendererMediaSlotLifecycle['read'](getSlotKey(index, result));
  }
  function resolveMediaPresentationReady(data) {
    if (!isManagedNode(data)) return undefined;
    return read(data)['surface'] === 'media';
  }
  function prepareSource(enabled, sourceKey, { slotIndex: slotIndex = 0, rebind: rebind = ![] } = {}) {
    if (!enabled || !isManagedNode(enabled)) return null;
    const options = rendererMediaSlotLifecycle['transition'](getSlotKey(enabled, slotIndex), {
      type: 'source-intent',
      sourceKey: sourceKey,
      rebind: rebind === !![],
    });
    if (options['changed']) clearReleasedPreviewDataset(getWrapper?.(enabled));
    return options['state'];
  }
  function reportFrame(enabled2, sourceKey2 = {}) {
    if (!enabled2 || !isManagedNode(enabled2)) return ![];
    const enabled3 = rendererMediaSlotLifecycle['transition'](getSlotKey(enabled2, sourceKey2['slotIndex']), {
      type: 'frame-observed',
      sourceKey: sourceKey2['sourceKey'],
      sourceEpoch: sourceKey2['sourceEpoch'],
      facts: sourceKey2['facts'],
    });
    if (!enabled3['accepted'] || !isRendererMediaSlotStable(enabled3['state'])) return ![];
    if (releasePreview?.(enabled2) !== !![]) return ![];
    const el2 = getWrapper?.(enabled2);
    return (
      el2?.['dataset'] &&
        ((el2['dataset']['fastPreviewReleasedForPlayback'] = '1'),
        (el2['dataset']['fastPreviewReleasedSourceKey'] = enabled3['state']['sourceKey'])),
      forgetScheduledRelease?.(enabled2),
      !![]
    );
  }
  function syncVisibility(enabled4, visibilityTier, target = 0) {
    if (!enabled4 || !isManagedNode(enabled4)) return null;
    return rendererMediaSlotLifecycle['transition'](getSlotKey(enabled4, target), {
      type: 'visibility',
      visibilityTier: visibilityTier,
    })['state'];
  }
  function syncViewportVisibility(
    source,
    {
      isSelected: isSelected = ![],
      isVisible: isVisible = ![],
      isPreviewCandidate: isPreviewCandidate = ![],
    } = {},
  ) {
    return syncVisibility(
      source,
      isSelected ? 'focused' : isVisible ? 'visible' : isPreviewCandidate ? 'near' : 'far',
    );
  }
  function setResidency(enabled5, residency, next = 0) {
    if (!enabled5 || !isManagedNode(enabled5)) return null;
    const current = rendererMediaSlotLifecycle['transition'](getSlotKey(enabled5, next), {
      type: 'residency',
      residency: residency,
    });
    return (
      current['accepted'] && residency !== 'mounted' && clearReleasedPreviewDataset(getWrapper?.(enabled5)),
      current['state']
    );
  }
  function shouldRetainPresentedSurface(entry, record = 0) {
    if (!isManagedNode(entry)) return ![];
    const payload = read(entry, record);
    return payload['surface'] === 'media' && payload['visibilityTier'] !== 'far';
  }
  function suspendPresentedSurface(enabled6, handle = 0) {
    if (!enabled6 || !isManagedNode(enabled6)) return null;
    const sourceKey3 = read(enabled6, handle),
      state = rendererMediaSlotLifecycle['transition'](getSlotKey(enabled6, handle), {
        type: 'source-intent',
        sourceKey: sourceKey3['sourceKey'],
        rebind: !![],
      });
    return (clearReleasedPreviewDataset(getWrapper?.(enabled6)), state['state']);
  }
  function forget(config, scope = 0) {
    return rendererMediaSlotLifecycle['forget'](getSlotKey(config, scope));
  }
  function reset() {
    rendererMediaSlotLifecycle = createRendererMediaSlotLifecycle();
  }
  return Object['freeze']({
    forget: forget,
    isManagedNode: isManagedNode,
    prepareSource: prepareSource,
    read: read,
    reportFrame: reportFrame,
    reset: reset,
    resolveMediaPresentationReady: resolveMediaPresentationReady,
    setResidency: setResidency,
    shouldRetainPresentedSurface: shouldRetainPresentedSurface,
    suspendPresentedSurface: suspendPresentedSurface,
    syncVisibility: syncVisibility,
    syncViewportVisibility: syncViewportVisibility,
  });
}
export const __rendererSourceVideoSlotLifecycleForTest = Object['freeze']({
  clearReleasedPreviewDataset: clearReleasedPreviewDataset,
  getSlotKey: getSlotKey,
});
