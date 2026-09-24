import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRendererFastPreviewGeometryVisible,
  isRendererFastPreviewMediaReadable,
  planRendererFastPreviewAdmission,
  resolveRendererFastPreviewMediaQueuePriority,
  selectRendererMotionAheadMediaIds,
} from './rendererFastPreviewAdmission.js';

const OPTIONS = { viewport: { x: 0, y: 0, zoom: 1 }, containerWidth: 1600, containerHeight: 900 };

const geometry = (x, y, width, height) => ({ x, y, width, height });

const mediaSeed = (nodeId, x, y, extra = {}) => ({
  nodeId,
  geometry: geometry(x, y, 50, 50),
  kind: 'image',
  sources: ['a.png'],
  ...extra,
});

test('rendererFastPreviewAdmission: 可见性判定使用缩放后的设备矩形与边距', () => {
  assert.equal(isRendererFastPreviewGeometryVisible(geometry(0, 0, 100, 100), OPTIONS), true);
  assert.equal(isRendererFastPreviewGeometryVisible(geometry(1550, 850, 100, 100), OPTIONS), true);
  assert.equal(isRendererFastPreviewGeometryVisible(geometry(-2000, 0, 100, 100), OPTIONS), false);
  assert.equal(isRendererFastPreviewGeometryVisible(geometry(-2000, 0, 100, 100), OPTIONS, 2000), true);
  assert.equal(isRendererFastPreviewGeometryVisible(geometry(2000, 0, 100, 100), OPTIONS), false);
  assert.equal(isRendererFastPreviewGeometryVisible(null, OPTIONS), false);
  assert.equal(
    isRendererFastPreviewGeometryVisible(geometry(0, 0, 100, 100), {
      viewport: { x: 0, y: 0, zoom: 0.5 },
      containerWidth: 1600,
      containerHeight: 900,
    }),
    true,
  );
  assert.equal(
    isRendererFastPreviewGeometryVisible(geometry(100, 100, 100, 100), {
      viewport: { x: 0, y: 0, zoom: 1 },
      containerW: 10,
      containerH: 10,
    }),
    false,
  );
});

test('rendererFastPreviewAdmission: 媒体可读阈值随缩放放大', () => {
  assert.equal(isRendererFastPreviewMediaReadable(geometry(0, 0, 32, 32), OPTIONS), false);
  assert.equal(
    isRendererFastPreviewMediaReadable(geometry(0, 0, 32, 32), {
      ...OPTIONS,
      viewport: { x: 0, y: 0, zoom: 2 },
    }),
    true,
  );
  assert.equal(isRendererFastPreviewMediaReadable(geometry(0, 0, 10, 10), OPTIONS), false);
  assert.equal(isRendererFastPreviewMediaReadable(geometry(0, 0, 4000, 10), OPTIONS), true);
  assert.equal(isRendererFastPreviewMediaReadable(null, OPTIONS), false);
});

test('rendererFastPreviewAdmission: 队列优先级给出用户档位、顺序与到视口中心距离', () => {
  const centered = geometry(780, 440, 40, 20);
  assert.deepEqual(
    resolveRendererFastPreviewMediaQueuePriority({ selected: true, geometry: centered, order: 3 }, OPTIONS),
    {
      userRank: 0,
      distanceSq: 0,
      order: 3,
    },
  );
  assert.equal(
    resolveRendererFastPreviewMediaQueuePriority({ visible: true, geometry: centered }, OPTIONS).userRank,
    1,
  );
  assert.equal(
    resolveRendererFastPreviewMediaQueuePriority({ motionFront: true, geometry: centered }, OPTIONS).userRank,
    1,
  );
  assert.equal(
    resolveRendererFastPreviewMediaQueuePriority({ motionAhead: true, geometry: centered }, OPTIONS).userRank,
    1,
  );
  assert.equal(
    resolveRendererFastPreviewMediaQueuePriority({ mounted: true, geometry: centered }, OPTIONS).userRank,
    2,
  );
  assert.equal(resolveRendererFastPreviewMediaQueuePriority({ geometry: centered }, OPTIONS).userRank, 3);
  assert.equal(resolveRendererFastPreviewMediaQueuePriority({}, OPTIONS).order, 0);
  assert.equal(
    resolveRendererFastPreviewMediaQueuePriority({ geometry: geometry(0, 0, 10, 10) }, OPTIONS).distanceSq,
    830050,
  );
  assert.equal(
    resolveRendererFastPreviewMediaQueuePriority({ retained: true, geometry: centered }, OPTIONS).userRank,
    0,
  );
});

test('rendererFastPreviewAdmission: 运动前方预取仅取未可见、可读且顺运动方向者，上限 6', () => {
  const motionOptions = { ...OPTIONS, previewMotion: { active: true, dx: 1, dy: 0 } };
  const entries = [
    { nodeId: 'near', geometry: geometry(1700, 100, 100, 100) },
    { nodeId: 'far', geometry: geometry(1900, 100, 100, 100) },
    { nodeId: 'behind', geometry: geometry(-500, 100, 100, 100) },
    { nodeId: 'visible', geometry: geometry(100, 100, 100, 100) },
  ];
  const ids = selectRendererMotionAheadMediaIds(entries, motionOptions);
  assert.equal(ids instanceof Set, true);
  assert.deepEqual([...ids], ['near', 'far']);
  assert.deepEqual([...selectRendererMotionAheadMediaIds(entries, OPTIONS)], []);
  const many = Array.from({ length: 8 }, (_, i) => ({
    nodeId: `m${i}`,
    geometry: geometry(1700 + i * 10, 100, 100, 100),
  }));
  const limited = [...selectRendererMotionAheadMediaIds(many, motionOptions)];
  assert.equal(limited.length, 6);
  assert.equal(limited[0], 'm0');
  assert.equal(
    [
      ...selectRendererMotionAheadMediaIds(
        [{ nodeId: 'tiny', geometry: geometry(1700, 100, 10, 10) }],
        motionOptions,
      ),
    ].length,
    0,
  );
});

test('rendererFastPreviewAdmission: 空候选集返回空的准入计划', () => {
  const plan = planRendererFastPreviewAdmission({});
  assert.deepEqual(plan.candidates, []);
  assert.deepEqual(plan.immediateCandidates, []);
  assert.deepEqual(plan.deferredCandidates, []);
  assert.deepEqual([...plan.liveIds], []);
  assert.equal(plan.createBatchSize, 8);
  assert.equal(plan.immediateMediaSrcLimit, 32);
  assert.equal(plan.immediateVideoMediaSrcLimit, 16);
  assert.equal(plan.mediaSrcBatchLimit, null);
  assert.equal(plan.videoMediaSrcBatchLimit, null);
  assert.equal(plan.visibleMediaCandidateCount, 0);
  assert.equal(plan.mediaPlan.lowPriority, false);
  assert.equal(plan.mediaPlan.prefetchAhead, false);
});

test('rendererFastPreviewAdmission: 可见带媒体候选立即进入准入与媒体计划', () => {
  const seed = mediaSeed('v1', 100, 100, { fullEligiblePreview: true, visible: true });
  const plan = planRendererFastPreviewAdmission({ candidateSeeds: [seed], options: OPTIONS });
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.immediateCandidates.length, 1);
  assert.equal(plan.deferredCandidates.length, 0);
  assert.deepEqual([...plan.liveIds], ['v1']);
  assert.equal(plan.visibleMediaCandidateCount, 1);
  assert.deepEqual([...plan.mediaPlan.nodeIdsWithMedia], ['v1']);
  assert.equal(plan.mediaPlan.explicitMediaSourceOwnerIds, null);
  assert.equal(plan.immediateMediaSrcLimit, 32);
});

test('rendererFastPreviewAdmission: 立即创建预算耗尽后剩余候选进入延迟队列', () => {
  const seeds = Array.from({ length: 10 }, (_, i) => mediaSeed(`n${i}`, 4000 + i * 10, 4000));
  const plan = planRendererFastPreviewAdmission({ candidateSeeds: seeds, options: OPTIONS });
  assert.equal(plan.candidates.length, 10);
  assert.equal(plan.immediateCandidates.length, 8);
  assert.equal(plan.deferredCandidates.length, 2);
  assert.deepEqual(
    plan.deferredCandidates.map((candidate) => candidate.nodeId),
    ['n8', 'n9'],
  );
  assert.equal(plan.liveIds.size, 10);
  assert.equal(plan.visibleMediaCandidateCount, 0);
});

test('rendererFastPreviewAdmission: 已存在的预览节点不占用立即创建预算', () => {
  const seeds = Array.from({ length: 10 }, (_, i) => mediaSeed(`n${i}`, 4000 + i * 10, 4000));
  const plan = planRendererFastPreviewAdmission({
    candidateSeeds: seeds,
    existingPreviewNodeIds: new Set(['n0']),
    options: OPTIONS,
  });
  assert.equal(plan.immediateCandidates.length, 9);
  assert.equal(plan.deferredCandidates.length, 1);
  assert.equal(plan.deferredCandidates[0].nodeId, 'n9');
});

test('rendererFastPreviewAdmission: 必需候选（选中/可见）在预算内不被延迟', () => {
  const seeds = Array.from({ length: 5 }, (_, i) =>
    mediaSeed(`s${i}`, 4000 + i * 10, 4000, { selected: true }),
  );
  const plan = planRendererFastPreviewAdmission({ candidateSeeds: seeds, options: OPTIONS });
  assert.equal(plan.candidates.length, 5);
  assert.equal(plan.immediateCandidates.length, 5);
  assert.equal(plan.deferredCandidates.length, 0);
  assert.deepEqual(
    plan.immediateCandidates.map((candidate) => candidate.selected),
    [true, true, true, true, true],
  );
});

test('rendererFastPreviewAdmission: 媒体 src 上限随延迟/繁忙/低缩放档位切换', () => {
  const seed = mediaSeed('v1', 100, 100);
  const deferredSrc = planRendererFastPreviewAdmission({
    candidateSeeds: [seed],
    options: { ...OPTIONS, deferVisibleMediaSrc: true },
  });
  assert.equal(deferredSrc.immediateMediaSrcLimit, 2);
  assert.equal(deferredSrc.immediateVideoMediaSrcLimit, 1);
  assert.equal(deferredSrc.mediaSrcBatchLimit, 2);
  assert.equal(deferredSrc.videoMediaSrcBatchLimit, 1);

  const busy = planRendererFastPreviewAdmission({
    candidateSeeds: [seed],
    options: { ...OPTIONS, viewportBusy: true },
  });
  assert.equal(busy.immediateMediaSrcLimit, 16);
  assert.equal(busy.immediateVideoMediaSrcLimit, 2);
  assert.equal(busy.mediaPlan.lowPriority, false);

  const lowZoom = planRendererFastPreviewAdmission({
    candidateSeeds: [seed],
    options: { ...OPTIONS, viewport: { x: 0, y: 0, zoom: 0.4 } },
  });
  assert.equal(lowZoom.immediateMediaSrcLimit, 24);
  assert.equal(lowZoom.mediaPlan.lowPriority, true);

  const lowPriorityLarge = planRendererFastPreviewAdmission({
    candidateSeeds: Array.from({ length: 200 }, (_, i) => mediaSeed(`p${i}`, 4000 + i, 4000)),
    options: { ...OPTIONS, viewport: { x: 0, y: 0, zoom: 0.4 } },
  });
  assert.equal(lowPriorityLarge.immediateMediaSrcLimit, 12);
});

test('rendererFastPreviewAdmission: 候选可为任意可迭代集合，且显式媒体归属会限制媒体计划', () => {
  const seeds = [mediaSeed('m1', 4000, 4000), mediaSeed('m2', 4010, 4000)];
  const fromSet = planRendererFastPreviewAdmission({ candidateSeeds: new Set(seeds), options: OPTIONS });
  assert.equal(fromSet.candidates.length, 2);
  const scoped = planRendererFastPreviewAdmission({
    candidateSeeds: seeds,
    options: { ...OPTIONS, mediaSourceOwnerIds: new Set(['m1']) },
  });
  assert.deepEqual([...scoped.mediaPlan.nodeIdsWithMedia], ['m1']);
  assert.deepEqual([...scoped.mediaPlan.explicitMediaSourceOwnerIds], ['m1']);
  const suppressed = planRendererFastPreviewAdmission({
    candidateSeeds: seeds,
    options: { ...OPTIONS, mediaSourceOwnerIds: new Set(['m1']), suppressNewMedia: true },
  });
  assert.deepEqual([...suppressed.mediaPlan.nodeIdsWithMedia], []);
  assert.equal(suppressed.mediaPlan.lowPriority, false);
});
