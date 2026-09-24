function nowContinuationProbeMs() {
  return typeof globalThis['performance']?.['now'] === 'function'
    ? globalThis['performance']['now']()
    : Date['now']();
}
function recordFastPreviewContinuationEvent(_0x37d411, _0x49d710 = {}) {
  globalThis['window']?.['__runtimeCompareRecordFastPreviewContinuation']?.({
    type: _0x37d411,
    ..._0x49d710,
  });
}
function buildContinuationProbeContext(_0x3a2d33 = {}) {
  return {
    deferFullSync: _0x3a2d33['deferFullSync'] === !![],
    hasPendingStructuralOps: _0x3a2d33['hasPendingStructuralOps'] === !![],
  };
}
function buildNodeIdSetKey(_0x17b4e6) {
  if (!_0x17b4e6 || typeof _0x17b4e6[Symbol['iterator']] !== 'function') return '';
  return Array['from'](_0x17b4e6, (_0x1cd374) => String(_0x1cd374 || ''))['join']('\x1f');
}
function buildContinuationKey(_0x3e6f16, _0x1b5fec = {}) {
  const _0x1113a6 = _0x1b5fec['viewport'] || {},
    _0x2ba129 = _0x1b5fec['connOverlay'] || {},
    _0x27dee0 = _0x1b5fec['dragContext'] || {},
    _0x5a3f0c =
      _0x1b5fec['keepMountedMediaPreview'] === !![]
        ? _0x1b5fec['nonMediaLifecycleRevision']
        : _0x1b5fec['lifecycleRevision'],
    _0x1e1b1e = Array['isArray'](_0x2ba129['invalidNodeIds'])
      ? _0x2ba129['invalidNodeIds']['join']('\x1f')
      : '';
  return [
    _0x3e6f16,
    _0x1113a6['x'],
    _0x1113a6['y'],
    _0x1113a6['zoom'],
    _0x1b5fec['viewportBusy'] === !![] ? 0x1 : 0x0,
    _0x1b5fec['suppressNewMedia'] === !![] ? 0x1 : 0x0,
    _0x1b5fec['deferVisibleMediaSrc'] === !![] ? 0x1 : 0x0,
    _0x1b5fec['suspendNewMediaSrc'] === !![] ? 0x1 : 0x0,
    _0x1b5fec['keepMountedMediaPreview'] === !![] ? 0x1 : 0x0,
    buildNodeIdSetKey(_0x1b5fec['fullEligibleVisibleImageNodeIds']),
    buildNodeIdSetKey(_0x1b5fec['fullEligiblePreviewImageNodeIds']),
    _0x1b5fec['mediaSourceOwnerIds'] == null
      ? 'legacy-media-source-owners'
      : buildNodeIdSetKey(_0x1b5fec['mediaSourceOwnerIds']),
    _0x1b5fec['requiredImmediateMediaSourceOwnerIds'] == null
      ? 'legacy-required-media-source-owners'
      : buildNodeIdSetKey(_0x1b5fec['requiredImmediateMediaSourceOwnerIds']),
    Number(_0x5a3f0c) || 0x0,
    _0x2ba129['side'] || '',
    _0x1e1b1e,
    _0x27dee0['isCommittingDrag'] === !![] ? 0x1 : 0x0,
    _0x27dee0['hasMoved'] === !![] ? 0x1 : 0x0,
  ]['join']('|');
}
function requestContinuationFrame(_0x3ba785) {
  if (typeof requestAnimationFrame === 'function')
    return { kind: 'raf', id: requestAnimationFrame(_0x3ba785) };
  return { kind: 'timer', id: setTimeout(_0x3ba785, 0x20) };
}
function cancelContinuationFrame(_0x3fd4de) {
  if (!_0x3fd4de) return;
  if (_0x3fd4de['kind'] === 'raf' && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(_0x3fd4de['id']);
    return;
  }
  if (_0x3fd4de['kind'] === 'timer') clearTimeout(_0x3fd4de['id']);
}
export function createRendererFastPreviewLifecycleTracker() {
  let _0x420c92 = 0x0,
    _0xae3180 = 0x0;
  return {
    record(_0x2b2027) {
      _0x420c92 += 0x1;
      const _0x2d259d = String(_0x2b2027 || '')['toLowerCase']();
      !_0x2d259d['includes']('image') &&
        !_0x2d259d['includes']('video') &&
        !_0x2d259d['includes']('media-clip') &&
        (_0xae3180 += 0x1);
    },
    reset() {
      ((_0x420c92 = 0x0), (_0xae3180 = 0x0));
    },
    getContinuationOptions() {
      return { lifecycleRevision: _0x420c92, nonMediaLifecycleRevision: _0xae3180 };
    },
  };
}
export function shouldDeferRendererFastPreviewSync({
  mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame = ![],
  updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame = ![],
  hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts = ![],
  hasExistingPreviewSurface: hasExistingPreviewSurface = ![],
  dragContext: dragContext = null,
} = {}) {
  if (dragContext?.['isDragging'] === !![]) return ![];
  if (hasExistingPreviewSurface !== !![]) return ![];
  return (
    mountedHeavyMediaThisFrame === !![] ||
    updatedHeavyMediaThisFrame === !![] ||
    hasPendingStructuralVideoMounts === !![]
  );
}
export function syncRendererFastPreviewAfterNodeRender({
  continuation: _0x4c9885,
  layer: _0x248eb8,
  canvasEl: _0x1ada41,
  nodes: _0x4566ca,
  previewCandidateIds: _0xbc5fed,
  selectedNodeSet: _0xfbd09d,
  candidateSignature: _0x28b565,
  hasPendingStructuralOps: _0x5af51a,
  connOverlay: _0x2681a7,
  pickConnectMode: _0x117005,
  nodeCount: nodeCount = 0x0,
  viewport: _0x34d881,
  containerWidth: _0x32bf47,
  containerHeight: _0x4df913,
  suppressNewMedia: suppressNewMedia = ![],
  deferVisibleMediaSrc: deferVisibleMediaSrc = ![],
  viewportBusy: viewportBusy = ![],
  dragContext: _0x1ac82d,
  dragTargets: _0x4d5f72,
  suspendNewMediaSrc: suspendNewMediaSrc = ![],
  fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds = null,
  fullEligiblePreviewImageNodeIds: fullEligiblePreviewImageNodeIds = null,
  mediaSourceOwnerIds: mediaSourceOwnerIds = null,
  requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds = null,
  lifecycleRevision: lifecycleRevision = 0x0,
  nonMediaLifecycleRevision: nonMediaLifecycleRevision = 0x0,
  mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame = ![],
  updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame = ![],
  hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts = ![],
} = {}) {
  const _0x1b8ab1 = {
      connOverlay: _0x2681a7,
      pickConnectMode: _0x117005,
      nodeCount: nodeCount,
      viewport: _0x34d881,
      containerWidth: _0x32bf47,
      containerHeight: _0x4df913,
      suppressNewMedia: suppressNewMedia,
      deferVisibleMediaSrc: deferVisibleMediaSrc,
      viewportBusy: viewportBusy,
      dragContext: _0x1ac82d,
      dragTargets: _0x4d5f72,
      suspendNewMediaSrc: suspendNewMediaSrc,
      fullEligibleVisibleImageNodeIds: fullEligibleVisibleImageNodeIds,
      fullEligiblePreviewImageNodeIds: fullEligiblePreviewImageNodeIds,
      mediaSourceOwnerIds: mediaSourceOwnerIds,
      requiredImmediateMediaSourceOwnerIds: requiredImmediateMediaSourceOwnerIds,
      lifecycleRevision: lifecycleRevision,
      nonMediaLifecycleRevision: nonMediaLifecycleRevision,
      keepMountedMediaPreview:
        nodeCount >= 0x30 && (viewportBusy || Number(_0x34d881?.['zoom'] || 0x1) <= 0.45),
    },
    _0x263f6f =
      shouldDeferRendererFastPreviewSync({
        mountedHeavyMediaThisFrame: mountedHeavyMediaThisFrame,
        updatedHeavyMediaThisFrame: updatedHeavyMediaThisFrame,
        hasPendingStructuralVideoMounts: hasPendingStructuralVideoMounts,
        hasExistingPreviewSurface: _0x248eb8?.['getStats']?.()['fastPreviewCount'] > 0x0,
        dragContext: _0x1ac82d,
      }) &&
      !(
        requiredImmediateMediaSourceOwnerIds != null &&
        typeof requiredImmediateMediaSourceOwnerIds?.[Symbol['iterator']] === 'function' &&
        Array['from'](requiredImmediateMediaSourceOwnerIds)['some'](
          (_0x568f29) => _0x248eb8?.['isNodePreviewReady']?.(_0x568f29) !== !![],
        )
      );
  return (
    _0x248eb8?.['prune']?.(_0xbc5fed),
    _0x4c9885?.['syncIfNeeded']({
      canvasEl: _0x1ada41,
      nodes: _0x4566ca,
      previewCandidateIds: _0xbc5fed,
      selectedNodeSet: _0xfbd09d,
      candidateSignature: _0x28b565,
      hasPendingStructuralOps: _0x5af51a,
      options: _0x1b8ab1,
      deferFullSync: _0x263f6f,
    })
  );
}
export function createRendererFastPreviewContinuationController({
  sync: _0x4b9a6f,
  requestFrame: requestFrame = requestContinuationFrame,
  cancelFrame: cancelFrame = cancelContinuationFrame,
} = {}) {
  let _0x14d2ec = '',
    _0x505eee = null,
    _0x3c4869 = null,
    _0x4a9c48 = null;
  function _0x2ab523(_0x33d6c8 = 'clear') {
    _0x3c4869 = null;
    if (_0x4a9c48 === null) return;
    (recordFastPreviewContinuationEvent('deferred-cleared', { reason: _0x33d6c8 }),
      cancelFrame?.(_0x4a9c48),
      (_0x4a9c48 = null));
  }
  function _0xd18fde() {
    ((_0x14d2ec = ''), (_0x505eee = null), _0x2ab523('reset'));
  }
  function _0x36ccc0(_0x382ea9) {
    _0x3c4869 = _0x382ea9;
    if (_0x4a9c48 !== null) {
      recordFastPreviewContinuationEvent('deferred-coalesced', {
        ...buildContinuationProbeContext(_0x382ea9),
      });
      return;
    }
    ((_0x4a9c48 = requestFrame?.(() => {
      _0x4a9c48 = null;
      const _0x134e0f = _0x3c4869;
      _0x3c4869 = null;
      if (!_0x134e0f) return;
      (recordFastPreviewContinuationEvent('deferred-flush', { ...buildContinuationProbeContext(_0x134e0f) }),
        _0x14f25e({ ..._0x134e0f, deferFullSync: ![] }));
    })),
      recordFastPreviewContinuationEvent('deferred-created', {
        ...buildContinuationProbeContext(_0x382ea9),
      }));
  }
  function _0x256e4f({
    candidateSignature: _0x1a4fab,
    nodes: _0x54256e,
    hasPendingStructuralOps: _0x18b1e4,
    options: _0x2d5562,
  } = {}) {
    const _0x2adca5 = buildContinuationKey(_0x1a4fab, _0x2d5562),
      _0x5f209f = _0x14d2ec !== _0x2adca5,
      _0x4c7547 = _0x505eee !== _0x54256e,
      _0x2d655c = _0x18b1e4 !== !![] || _0x5f209f || _0x4c7547;
    return (
      recordFastPreviewContinuationEvent('full-sync-decision', {
        hasPendingStructuralOps: _0x18b1e4 === !![],
        keyChanged: _0x5f209f,
        nodesChanged: _0x4c7547,
        shouldRun: _0x2d655c,
      }),
      _0x18b1e4 === !![] ? ((_0x14d2ec = _0x2adca5), (_0x505eee = _0x54256e)) : _0xd18fde(),
      _0x2d655c
    );
  }
  function _0x14f25e({
    canvasEl: _0x2e83d3,
    nodes: _0x1b2b45,
    previewCandidateIds: _0x13b74a,
    selectedNodeSet: _0x467e18,
    candidateSignature: _0x3fa668,
    hasPendingStructuralOps: _0x558631,
    options: _0x5bee45,
    deferFullSync: deferFullSync = ![],
  } = {}) {
    recordFastPreviewContinuationEvent('sync-call', {
      deferFullSync: deferFullSync === !![],
      hasPendingStructuralOps: _0x558631 === !![],
    });
    if (deferFullSync === !![])
      return (
        _0x36ccc0({
          canvasEl: _0x2e83d3,
          nodes: _0x1b2b45,
          previewCandidateIds: _0x13b74a,
          selectedNodeSet: _0x467e18,
          candidateSignature: _0x3fa668,
          hasPendingStructuralOps: _0x558631,
          options: _0x5bee45,
        }),
        ![]
      );
    _0x2ab523('direct-sync');
    if (
      !_0x256e4f({
        candidateSignature: _0x3fa668,
        nodes: _0x1b2b45,
        hasPendingStructuralOps: _0x558631,
        options: _0x5bee45,
      })
    )
      return (
        recordFastPreviewContinuationEvent('full-sync-skipped', {
          hasPendingStructuralOps: _0x558631 === !![],
        }),
        ![]
      );
    const _0x49911a = nowContinuationProbeMs();
    try {
      _0x4b9a6f?.(_0x2e83d3, _0x1b2b45, _0x13b74a, _0x467e18, _0x5bee45);
    } finally {
      recordFastPreviewContinuationEvent('full-sync-run', {
        durationMs: Math['max'](0x0, nowContinuationProbeMs() - _0x49911a),
        hasPendingStructuralOps: _0x558631 === !![],
      });
    }
    return !![];
  }
  function _0x416ee7(_0x43658c) {
    if (!_0x3c4869) return;
    const _0x2b2de2 = new Set(_0x43658c),
      _0x206b29 = (_0x5774e1) =>
        _0x5774e1 == null
          ? _0x5774e1
          : new Set([..._0x5774e1]['filter']((_0x5c11e1) => !_0x2b2de2['has'](_0x5c11e1)));
    _0x3c4869 = {
      ..._0x3c4869,
      previewCandidateIds: _0x206b29(_0x3c4869['previewCandidateIds']),
      options: {
        ..._0x3c4869['options'],
        mediaSourceOwnerIds: _0x206b29(_0x3c4869['options']?.['mediaSourceOwnerIds']),
        requiredImmediateMediaSourceOwnerIds: _0x206b29(
          _0x3c4869['options']?.['requiredImmediateMediaSourceOwnerIds'],
        ),
      },
    };
  }
  return { reset: _0xd18fde, shouldRunFullSync: _0x256e4f, syncIfNeeded: _0x14f25e, excludeNodes: _0x416ee7 };
}
