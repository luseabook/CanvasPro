function nowContinuationProbeMs() {
  return typeof globalThis['performance']?.['now'] === 'function'
    ? globalThis['performance']['now']()
    : Date['now']();
}
function recordFastPreviewContinuationEvent(type, args = {}) {
  globalThis['window']?.['__runtimeCompareRecordFastPreviewContinuation']?.({
    type: type,
    ...args,
  });
}
function buildContinuationProbeContext(deferFullSync2 = {}) {
  return {
    deferFullSync: deferFullSync2['deferFullSync'] === true,
    hasPendingStructuralOps: deferFullSync2['hasPendingStructuralOps'] === true,
  };
}
function buildNodeIdSetKey(enabled) {
  if (!enabled || typeof enabled[Symbol['iterator']] !== 'function') return '';
  return Array['from'](enabled, (value) => String(value || ''))['join']('\x1f');
}
function buildContinuationKey(item, key = {}) {
  const box = key['viewport'] || {},
    index = key['connOverlay'] || {},
    result = key['dragContext'] || {},
    data =
      key['keepMountedMediaPreview'] === true ? key['nonMediaLifecycleRevision'] : key['lifecycleRevision'],
    options = Array['isArray'](index['invalidNodeIds']) ? index['invalidNodeIds']['join']('\x1f') : '';
  return [
    item,
    box['x'],
    box['y'],
    box['zoom'],
    key['viewportBusy'] === true ? 1 : 0,
    key['suppressNewMedia'] === true ? 1 : 0,
    key['deferVisibleMediaSrc'] === true ? 1 : 0,
    key['suspendNewMediaSrc'] === true ? 1 : 0,
    key['keepMountedMediaPreview'] === true ? 1 : 0,
    buildNodeIdSetKey(key['fullEligibleVisibleImageNodeIds']),
    buildNodeIdSetKey(key['fullEligiblePreviewImageNodeIds']),
    key['mediaSourceOwnerIds'] == null
      ? 'legacy-media-source-owners'
      : buildNodeIdSetKey(key['mediaSourceOwnerIds']),
    key['requiredImmediateMediaSourceOwnerIds'] == null
      ? 'legacy-required-media-source-owners'
      : buildNodeIdSetKey(key['requiredImmediateMediaSourceOwnerIds']),
    Number(data) || 0,
    index['side'] || '',
    options,
    result['isCommittingDrag'] === true ? 1 : 0,
    result['hasMoved'] === true ? 1 : 0,
  ]['join']('|');
}
function requestContinuationFrame(target) {
  if (typeof requestAnimationFrame === 'function') return { kind: 'raf', id: requestAnimationFrame(target) };
  return { kind: 'timer', id: setTimeout(target, 32) };
}
function cancelContinuationFrame(enabled2) {
  if (!enabled2) return;
  if (enabled2['kind'] === 'raf' && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(enabled2['id']);
    return;
  }
  if (enabled2['kind'] === 'timer') clearTimeout(enabled2['id']);
}
export function createRendererFastPreviewLifecycleTracker() {
  let lifecycleRevision2 = 0,
    nonMediaLifecycleRevision2 = 0;
  return {
    record(source) {
      lifecycleRevision2 += 1;
      const list = String(source || '')['toLowerCase']();
      !list['includes']('image') &&
        !list['includes']('video') &&
        !list['includes']('media-clip') &&
        (nonMediaLifecycleRevision2 += 1);
    },
    reset() {
      ((lifecycleRevision2 = 0), (nonMediaLifecycleRevision2 = 0));
    },
    getContinuationOptions() {
      return { lifecycleRevision: lifecycleRevision2, nonMediaLifecycleRevision: nonMediaLifecycleRevision2 };
    },
  };
}
export function shouldDeferRendererFastPreviewSync({
  mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame = false,
  updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame = false,
  hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts = false,
  hasExistingPreviewSurface: hasExistingPreviewSurface = false,
  dragContext: dragContext = null,
} = {}) {
  if (dragContext?.['isDragging'] === true) return false;
  if (hasExistingPreviewSurface !== true) return false;
  return (
    mountedHeavyMediaThisFrame === true ||
    updatedHeavyMediaThisFrame === true ||
    hasPendingStructuralVideoMounts === true
  );
}
export function syncRendererFastPreviewAfterNodeRender({
  continuation: continuation,
  layer: layer,
  canvasEl: canvasEl,
  nodes: nodes,
  previewCandidateIds: previewCandidateIds,
  selectedNodeSet: selectedNodeSet,
  candidateSignature: candidateSignature,
  hasPendingStructuralOps: hasPendingStructuralOps,
  connOverlay: connOverlay,
  pickConnectMode: pickConnectMode,
  nodeCount: nodeCount = 0,
  viewport: viewport,
  containerWidth: containerWidth,
  containerHeight: containerHeight,
  suppressNewMedia: suppressNewMedia = false,
  deferVisibleMediaSrc: deferVisibleMediaSrc = false,
  freezeRasterSurface: freezeRasterSurface = false,
  viewportBusy: viewportBusy = false,
  dragContext: dragContext2,
  dragTargets: dragTargets,
  suspendNewMediaSrc: suspendNewMediaSrc = false,
  fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds = null,
  fullEligiblePreviewImageNodeIds: fullEligiblePreviewImageNodeIds = null,
  mediaSourceOwnerIds: mediaSourceOwnerIds = null,
  requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds = null,
  lifecycleRevision: lifecycleRevision = 0,
  nonMediaLifecycleRevision: nonMediaLifecycleRevision = 0,
  mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame = false,
  updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame = false,
  hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts = false,
} = {}) {
  const options2 = {
      connOverlay: connOverlay,
      pickConnectMode: pickConnectMode,
      nodeCount: nodeCount,
      viewport: viewport,
      containerWidth: containerWidth,
      containerHeight: containerHeight,
      suppressNewMedia: suppressNewMedia,
      deferVisibleMediaSrc: deferVisibleMediaSrc,
      freezeRasterSurface: freezeRasterSurface,
      viewportBusy: viewportBusy,
      dragContext: dragContext2,
      dragTargets: dragTargets,
      suspendNewMediaSrc: suspendNewMediaSrc,
      fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
      fullEligiblePreviewImageNodeIds: fullEligiblePreviewImageNodeIds,
      mediaSourceOwnerIds: mediaSourceOwnerIds,
      requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds,
      lifecycleRevision: lifecycleRevision,
      nonMediaLifecycleRevision: nonMediaLifecycleRevision,
      keepMountedMediaPreview:
        nodeCount >= 48 && (viewportBusy || Number(viewport?.['zoom'] || 1) <= 0.45),
    },
    deferFullSync3 =
      shouldDeferRendererFastPreviewSync({
        mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame,
        updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame,
        hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts,
        hasExistingPreviewSurface: layer?.['getStats']?.()['fastPreviewCount'] > 0,
        dragContext: dragContext2,
      }) &&
      !(
        requiredImmediateMediaSourceOwnerIds != null &&
        typeof requiredImmediateMediaSourceOwnerIds?.[Symbol['iterator']] === 'function' &&
        Array['from'](requiredImmediateMediaSourceOwnerIds)['some'](
          (next) => layer?.['isNodePreviewReady']?.(next) !== true,
        )
      );
  return (
    layer?.['prune']?.(previewCandidateIds),
    continuation?.['syncIfNeeded']({
      canvasEl: canvasEl,
      nodes: nodes,
      previewCandidateIds: previewCandidateIds,
      selectedNodeSet: selectedNodeSet,
      candidateSignature: candidateSignature,
      hasPendingStructuralOps: hasPendingStructuralOps,
      options: options2,
      deferFullSync: deferFullSync3,
    })
  );
}
export function createRendererFastPreviewContinuationController({
  sync: sync,
  requestFrame: requestFrame = requestContinuationFrame,
  cancelFrame: cancelFrame = cancelContinuationFrame,
} = {}) {
  let current = '',
    value2 = null,
    args2 = null,
    value3 = null;
  function run(reason = 'clear') {
    args2 = null;
    if (value3 === null) return;
    (recordFastPreviewContinuationEvent('deferred-cleared', { reason: reason }),
      cancelFrame?.(value3),
      (value3 = null));
  }
  function reset2() {
    ((current = ''), (value2 = null), run('reset'));
  }
  function run2(entry) {
    args2 = entry;
    if (value3 !== null) {
      recordFastPreviewContinuationEvent('deferred-coalesced', {
        ...buildContinuationProbeContext(entry),
      });
      return;
    }
    ((value3 = requestFrame?.(() => {
      value3 = null;
      const args3 = args2;
      args2 = null;
      if (!args3) return;
      (recordFastPreviewContinuationEvent('deferred-flush', { ...buildContinuationProbeContext(args3) }),
        syncIfNeeded({ ...args3, deferFullSync: false }));
    })),
      recordFastPreviewContinuationEvent('deferred-created', {
        ...buildContinuationProbeContext(entry),
      }));
  }
  function shouldRunFullSync({
    candidateSignature: candidateSignature2,
    nodes: nodes2,
    hasPendingStructuralOps: hasPendingStructuralOps2,
    options: options3,
  } = {}) {
    const continuationKey = buildContinuationKey(candidateSignature2, options3),
      keyChanged = current !== continuationKey,
      nodesChanged = value2 !== nodes2,
      shouldRun = hasPendingStructuralOps2 !== true || keyChanged || nodesChanged;
    return (
      recordFastPreviewContinuationEvent('full-sync-decision', {
        hasPendingStructuralOps: hasPendingStructuralOps2 === true,
        keyChanged: keyChanged,
        nodesChanged: nodesChanged,
        shouldRun: shouldRun,
      }),
      hasPendingStructuralOps2 === true ? ((current = continuationKey), (value2 = nodes2)) : reset2(),
      shouldRun
    );
  }
  function syncIfNeeded({
    canvasEl: canvasEl2,
    nodes: nodes3,
    previewCandidateIds: previewCandidateIds2,
    selectedNodeSet: selectedNodeSet2,
    candidateSignature: candidateSignature3,
    hasPendingStructuralOps: hasPendingStructuralOps3,
    options: options4,
    deferFullSync: deferFullSync = false,
  } = {}) {
    recordFastPreviewContinuationEvent('sync-call', {
      deferFullSync: deferFullSync === true,
      hasPendingStructuralOps: hasPendingStructuralOps3 === true,
    });
    if (deferFullSync === true)
      return (
        run2({
          canvasEl: canvasEl2,
          nodes: nodes3,
          previewCandidateIds: previewCandidateIds2,
          selectedNodeSet: selectedNodeSet2,
          candidateSignature: candidateSignature3,
          hasPendingStructuralOps: hasPendingStructuralOps3,
          options: options4,
        }),
        false
      );
    run('direct-sync');
    if (
      !shouldRunFullSync({
        candidateSignature: candidateSignature3,
        nodes: nodes3,
        hasPendingStructuralOps: hasPendingStructuralOps3,
        options: options4,
      })
    )
      return (
        recordFastPreviewContinuationEvent('full-sync-skipped', {
          hasPendingStructuralOps: hasPendingStructuralOps3 === true,
        }),
        false
      );
    const nowContinuationProbeMs2 = nowContinuationProbeMs();
    try {
      sync?.(canvasEl2, nodes3, previewCandidateIds2, selectedNodeSet2, options4);
    } finally {
      recordFastPreviewContinuationEvent('full-sync-run', {
        durationMs: Math['max'](0, nowContinuationProbeMs() - nowContinuationProbeMs2),
        hasPendingStructuralOps: hasPendingStructuralOps3 === true,
      });
    }
    return true;
  }
  function excludeNodes(payload) {
    if (!args2) return;
    const map = new Set(payload),
      previewCandidateIds3 = (args4) =>
        args4 == null ? args4 : new Set([...args4]['filter']((handle) => !map['has'](handle)));
    args2 = {
      ...args2,
      previewCandidateIds: previewCandidateIds3(args2['previewCandidateIds']),
      options: {
        ...args2['options'],
        mediaSourceOwnerIds: previewCandidateIds3(args2['options']?.['mediaSourceOwnerIds']),
        requiredImmediateMediaSourceOwnerIds: previewCandidateIds3(
          args2['options']?.['requiredImmediateMediaSourceOwnerIds'],
        ),
      },
    };
  }
  return {
    reset: reset2,
    shouldRunFullSync: shouldRunFullSync,
    syncIfNeeded: syncIfNeeded,
    excludeNodes: excludeNodes,
  };
}
