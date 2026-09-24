import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRendererFastPreviewContinuationController,
  createRendererFastPreviewLifecycleTracker,
  shouldDeferRendererFastPreviewSync,
  syncRendererFastPreviewAfterNodeRender,
} from './rendererFastPreviewContinuation.js';

const withProbeWindow = (run) => {
  const events = [];
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const previous = globalThis.window;
  globalThis.window = { __runtimeCompareRecordFastPreviewContinuation: (event) => events.push(event) };
  try {
    return run(events);
  } finally {
    if (had) globalThis.window = previous;
    else delete globalThis.window;
  }
};

const eventTypes = (events) => events.map((event) => event.type);

const createControllerHarness = () => {
  const frames = [];
  const cancelled = [];
  const syncCalls = [];
  const controller = createRendererFastPreviewContinuationController({
    sync: (...args) => syncCalls.push(args),
    requestFrame: (callback) => {
      frames.push(callback);
      return { kind: 'raf', id: frames.length };
    },
    cancelFrame: (handle) => cancelled.push(handle),
  });
  return { controller, frames, cancelled, syncCalls };
};

const createLayer = (previewCount, readyIds = []) => {
  const ready = new Set(readyIds);
  const pruned = [];
  return {
    pruned,
    getStats: () => ({ fastPreviewCount: previewCount }),
    isNodePreviewReady: (nodeId) => ready.has(nodeId),
    prune: (ids) => pruned.push(ids),
  };
};

const createContinuationStub = () => {
  const calls = [];
  return {
    calls,
    syncIfNeeded: (payload) => {
      calls.push(payload);
      return true;
    },
  };
};

const deferPayload = (overrides = {}) => ({
  canvasEl: {},
  nodes: {},
  previewCandidateIds: new Set(),
  selectedNodeSet: new Set(),
  candidateSignature: 'sig',
  hasPendingStructuralOps: false,
  options: {},
  deferFullSync: true,
  ...overrides,
});

test('rendererFastPreviewContinuation: 生命周期跟踪器区分媒体与非媒体变更', () => {
  const tracker = createRendererFastPreviewLifecycleTracker();
  tracker.record('aigen-image');
  tracker.record('SOURCE-VIDEO');
  tracker.record('media-clip-x');
  tracker.record('textNode');
  tracker.record(undefined);
  assert.deepEqual(tracker.getContinuationOptions(), { lifecycleRevision: 5, nonMediaLifecycleRevision: 2 });
  tracker.reset();
  assert.deepEqual(tracker.getContinuationOptions(), { lifecycleRevision: 0, nonMediaLifecycleRevision: 0 });
});

test('rendererFastPreviewContinuation: 延迟同步需同时具备既有预览面与本帧重媒体', () => {
  const decide = shouldDeferRendererFastPreviewSync;
  assert.equal(decide(), false);
  assert.equal(decide({ mountedHeavyMediaThisFrame: true }), false);
  assert.equal(decide({ mountedHeavyMediaThisFrame: true, hasExistingPreviewSurface: true }), true);
  assert.equal(decide({ updatedHeavyMediaThisFrame: true, hasExistingPreviewSurface: true }), true);
  assert.equal(decide({ hasPendingStructuralVideoMounts: true, hasExistingPreviewSurface: true }), true);
  assert.equal(
    decide({
      mountedHeavyMediaThisFrame: true,
      hasExistingPreviewSurface: true,
      dragContext: { isDragging: true },
    }),
    false,
  );
  assert.equal(decide({ hasExistingPreviewSurface: 1 }), false);
});

test('rendererFastPreviewContinuation: deferFullSync 排队一帧，帧回调执行一次完整同步', () => {
  withProbeWindow((events) => {
    const { controller, frames, syncCalls } = createControllerHarness();
    const canvasEl = { canvas: true };
    const nodes = { n1: {} };
    const previewCandidateIds = new Set(['n1']);
    const selectedNodeSet = new Set(['n1']);
    const options = { viewport: { x: 0, y: 0, zoom: 1 } };
    const ran = controller.syncIfNeeded({
      canvasEl,
      nodes,
      previewCandidateIds,
      selectedNodeSet,
      candidateSignature: 'sig',
      hasPendingStructuralOps: false,
      options,
      deferFullSync: true,
    });
    assert.equal(ran, false);
    assert.equal(frames.length, 1);
    assert.equal(syncCalls.length, 0);
    assert.deepEqual(eventTypes(events), ['sync-call', 'deferred-created']);
    assert.deepEqual(events[0], { type: 'sync-call', deferFullSync: true, hasPendingStructuralOps: false });
    assert.deepEqual(events[1], {
      type: 'deferred-created',
      deferFullSync: false,
      hasPendingStructuralOps: false,
    });
    frames[0]();
    assert.equal(syncCalls.length, 1);
    assert.deepEqual(syncCalls[0], [canvasEl, nodes, previewCandidateIds, selectedNodeSet, options]);
    assert.deepEqual(eventTypes(events), [
      'sync-call',
      'deferred-created',
      'deferred-flush',
      'sync-call',
      'full-sync-decision',
      'full-sync-run',
    ]);
    assert.deepEqual(events[4], {
      type: 'full-sync-decision',
      hasPendingStructuralOps: false,
      keyChanged: true,
      nodesChanged: true,
      shouldRun: true,
    });
    assert.equal(events[5].durationMs >= 0, true);
  });
});

test('rendererFastPreviewContinuation: 连续延迟同步合并为一帧且后到者覆盖', () => {
  withProbeWindow((events) => {
    const { controller, frames, syncCalls } = createControllerHarness();
    controller.syncIfNeeded(deferPayload({ canvasEl: { id: 'a' }, previewCandidateIds: new Set(['a']) }));
    controller.syncIfNeeded(deferPayload({ canvasEl: { id: 'b' }, previewCandidateIds: new Set(['b']) }));
    assert.equal(frames.length, 1);
    assert.deepEqual(eventTypes(events), [
      'sync-call',
      'deferred-created',
      'sync-call',
      'deferred-coalesced',
    ]);
    frames[0]();
    assert.equal(syncCalls.length, 1);
    assert.equal(syncCalls[0][0].id, 'b');
    assert.deepEqual([...syncCalls[0][2]], ['b']);
  });
});

test('rendererFastPreviewContinuation: 非延迟同步直接执行并返回是否运行', () => {
  withProbeWindow((events) => {
    const { controller, frames, syncCalls } = createControllerHarness();
    const ran = controller.syncIfNeeded(deferPayload({ deferFullSync: false, options: { viewport: {} } }));
    assert.equal(ran, true);
    assert.equal(frames.length, 0);
    assert.equal(syncCalls.length, 1);
    assert.deepEqual(eventTypes(events), ['sync-call', 'full-sync-decision', 'full-sync-run']);
  });
});

test('rendererFastPreviewContinuation: 结构操作挂起且键与节点未变时跳过完整同步', () => {
  withProbeWindow((events) => {
    const { controller, syncCalls } = createControllerHarness();
    const payload = deferPayload({ deferFullSync: false, options: { viewport: { x: 0, y: 0, zoom: 1 } } });
    assert.equal(controller.syncIfNeeded({ ...payload, hasPendingStructuralOps: true }), true);
    assert.equal(controller.syncIfNeeded({ ...payload, hasPendingStructuralOps: true }), false);
    assert.equal(syncCalls.length, 1);
    assert.equal(controller.syncIfNeeded({ ...payload, hasPendingStructuralOps: false }), true);
    assert.equal(syncCalls.length, 2);
    assert.equal(eventTypes(events).includes('full-sync-skipped'), true);
    assert.deepEqual(
      events.filter((event) => event.type === 'full-sync-decision').map((event) => event.shouldRun),
      [true, false, true],
    );
  });
});

test('rendererFastPreviewContinuation: shouldRunFullSync 仅在结构操作挂起时按键去重', () => {
  const { controller } = createControllerHarness();
  const nodes = {};
  const options = { viewport: { x: 0, y: 0, zoom: 1 } };
  assert.equal(
    controller.shouldRunFullSync({ candidateSignature: 's', nodes, hasPendingStructuralOps: true, options }),
    true,
  );
  assert.equal(
    controller.shouldRunFullSync({ candidateSignature: 's', nodes, hasPendingStructuralOps: true, options }),
    false,
  );
  assert.equal(
    controller.shouldRunFullSync({ candidateSignature: 's2', nodes, hasPendingStructuralOps: true, options }),
    true,
  );
  assert.equal(
    controller.shouldRunFullSync({
      candidateSignature: 's2',
      nodes: {},
      hasPendingStructuralOps: true,
      options,
    }),
    true,
  );
});

test('rendererFastPreviewContinuation: reset 取消待执行帧并丢弃载荷', () => {
  withProbeWindow((events) => {
    const { controller, frames, cancelled, syncCalls } = createControllerHarness();
    controller.syncIfNeeded(deferPayload());
    assert.equal(frames.length, 1);
    controller.reset();
    assert.deepEqual(cancelled, [{ kind: 'raf', id: 1 }]);
    assert.equal(eventTypes(events).includes('deferred-cleared'), true);
    frames[0]();
    assert.equal(syncCalls.length, 0);
  });
});

test('rendererFastPreviewContinuation: excludeNodes 从待执行载荷剔除节点与媒体归属', () => {
  withProbeWindow(() => {
    const { controller, frames, syncCalls } = createControllerHarness();
    controller.syncIfNeeded(
      deferPayload({
        previewCandidateIds: new Set(['a', 'b']),
        options: {
          viewport: {},
          mediaSourceOwnerIds: new Set(['a', 'b']),
          requiredImmediateMediaSourceOwnerIds: new Set(['a']),
        },
      }),
    );
    controller.excludeNodes(['a']);
    frames[0]();
    assert.deepEqual([...syncCalls[0][2]], ['b']);
    assert.deepEqual([...syncCalls[0][4].mediaSourceOwnerIds], ['b']);
    assert.deepEqual([...syncCalls[0][4].requiredImmediateMediaSourceOwnerIds], []);

    controller.syncIfNeeded(deferPayload({ options: { viewport: {} } }));
    controller.excludeNodes(['a']);
    frames[1]();
    assert.equal(syncCalls[1][4].mediaSourceOwnerIds, undefined);
    controller.excludeNodes(['a']);
    assert.equal(frames.length, 2);
  });
});

test('rendererFastPreviewContinuation: 拖拽中不延迟同步，且始终裁剪预览候选', () => {
  const layer = createLayer(3);
  const continuation = createContinuationStub();
  const previewCandidateIds = new Set(['n1', 'n2']);
  const result = syncRendererFastPreviewAfterNodeRender({
    continuation,
    layer,
    canvasEl: {},
    nodes: {},
    previewCandidateIds,
    selectedNodeSet: new Set(),
    candidateSignature: 's',
    hasPendingStructuralOps: false,
    nodeCount: 60,
    viewport: { x: 0, y: 0, zoom: 1 },
    containerWidth: 1600,
    containerHeight: 900,
    mountedHeavyMediaThisFrame: true,
    dragContext: { isDragging: true },
  });
  assert.equal(result, true);
  assert.deepEqual(layer.pruned, [previewCandidateIds]);
  assert.equal(continuation.calls[0].deferFullSync, false);
  assert.equal(continuation.calls[0].options.keepMountedMediaPreview, false);
});

test('rendererFastPreviewContinuation: 重媒体帧配合既有预览面时延迟同步，必需媒体未就绪则放弃延迟', () => {
  const options = { nodeCount: 60, viewport: { x: 0, y: 0, zoom: 1 }, viewportBusy: true };
  const layer = createLayer(3, ['n9']);
  const continuation = createContinuationStub();
  const base = {
    continuation,
    layer,
    canvasEl: {},
    nodes: {},
    previewCandidateIds: new Set(),
    selectedNodeSet: new Set(),
    candidateSignature: 's',
    hasPendingStructuralOps: false,
    containerWidth: 1600,
    containerHeight: 900,
    mountedHeavyMediaThisFrame: true,
    ...options,
  };
  assert.equal(
    syncRendererFastPreviewAfterNodeRender({ ...base, requiredImmediateMediaSourceOwnerIds: ['n9'] }),
    true,
  );
  assert.equal(continuation.calls[0].deferFullSync, true);
  assert.equal(continuation.calls[0].options.keepMountedMediaPreview, true);
  assert.equal(
    syncRendererFastPreviewAfterNodeRender({ ...base, requiredImmediateMediaSourceOwnerIds: ['n404'] }),
    true,
  );
  assert.equal(continuation.calls[1].deferFullSync, false);
});

test('rendererFastPreviewContinuation: 无既有预览面或无重媒体时不延迟同步', () => {
  const bare = { prune: () => {} };
  const continuation = createContinuationStub();
  const payload = {
    continuation,
    layer: bare,
    canvasEl: {},
    nodes: {},
    previewCandidateIds: new Set(),
    selectedNodeSet: new Set(),
    candidateSignature: 's',
    hasPendingStructuralOps: false,
    containerWidth: 1600,
    containerHeight: 900,
    mountedHeavyMediaThisFrame: true,
  };
  assert.equal(syncRendererFastPreviewAfterNodeRender(payload), true);
  assert.equal(continuation.calls[0].deferFullSync, false);
  const emptySurface = createLayer(0);
  assert.equal(syncRendererFastPreviewAfterNodeRender({ ...payload, layer: emptySurface }), true);
  assert.equal(continuation.calls[1].deferFullSync, false);
  assert.equal(
    syncRendererFastPreviewAfterNodeRender({
      ...payload,
      layer: createLayer(3),
      mountedHeavyMediaThisFrame: false,
    }),
    true,
  );
  assert.equal(continuation.calls[2].deferFullSync, false);
});
