import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDenseLowZoomRasterStrength,
  planRendererRasterProxies,
} from './rendererRasterProxyPolicy.js';

const IMAGE_NODE = { id: 'a', type: 'image', width: 80, height: 120 };

const planFor = (overrides = {}) =>
  planRendererRasterProxies({
    nodes: [IMAGE_NODE],
    proxySurfaceIds: ['a'],
    rasterSupportedNodeTypes: ['image'],
    viewport: { zoom: 1 },
    ...overrides,
  });

test('rendererRasterProxyPolicy: 密集低缩放强度按缩放平滑衰减并夹紧压力', () => {
  assert.equal(calculateDenseLowZoomRasterStrength(1, { zoom: 0.4 }), 1);
  assert.equal(calculateDenseLowZoomRasterStrength(1, { zoom: 0.6 }), 0);
  assert.ok(Math.abs(calculateDenseLowZoomRasterStrength(1, { zoom: 0.475 }) - 0.5) < 1e-9);
  assert.equal(calculateDenseLowZoomRasterStrength(2, { zoom: 0.1 }), 1);
  assert.equal(calculateDenseLowZoomRasterStrength(-1, { zoom: 0.1 }), 0);
  assert.equal(calculateDenseLowZoomRasterStrength(1, { zoom: 0 }), 0);
  assert.equal(calculateDenseLowZoomRasterStrength('x', { zoom: 1 }), 0);
});

test('rendererRasterProxyPolicy: 无代理候选时直接返回空计划', () => {
  const plan = planRendererRasterProxies();
  assert.equal(plan.active, false);
  assert.equal(plan.reason, 'no-proxy-candidates');
  assert.deepEqual([...plan.rasterIds], []);
  assert.deepEqual([...plan.domProxyIds], []);
  assert.equal(plan.stats.proxyCount, 0);
  assert.equal(plan.stats.rasterCandidateCount, 0);
  assert.equal(plan.signature.startsWith('full\x1fraster\x1fdom'), true);
});

test('rendererRasterProxyPolicy: 全屏面 id 被排除出代理候选', () => {
  const plan = planFor({ fullSurfaceIds: ['a'], scenePressure: 1 });
  assert.equal(plan.reason, 'no-proxy-candidates');
  assert.equal(plan.stats.proxyCount, 0);
  assert.equal(plan.stats.exactVisibleCount, 0);
});

test('rendererRasterProxyPolicy: 交互中节点与不受支持类型落到 DOM 代理', () => {
  const interactive = planFor({ selectedNodeIds: ['a'], scenePressure: 1 });
  assert.equal(interactive.reason, 'dom-required-only');
  assert.deepEqual([...interactive.domProxyIds], ['a']);
  assert.equal(interactive.stats.interactiveDomCount, 1);
  assert.equal(interactive.stats.rasterCandidateCount, 0);

  const unsupported = planRendererRasterProxies({
    nodes: [{ id: 'x', type: 'text', width: 80, height: 120 }],
    proxySurfaceIds: ['x'],
    rasterSupportedNodeTypes: ['image'],
    viewport: { zoom: 1 },
    scenePressure: 1,
  });
  assert.equal(unsupported.reason, 'dom-required-only');
  assert.equal(unsupported.stats.unsupportedDomCount, 1);
});

test('rendererRasterProxyPolicy: 激活信号达到下限时全部转栅格代理', () => {
  const plan = planFor({ scenePressure: 1 });
  assert.equal(plan.active, true);
  assert.equal(plan.reason, 'rasterized-all-proxies');
  assert.deepEqual([...plan.rasterIds], ['a']);
  assert.deepEqual([...plan.domProxyIds], []);
  assert.equal(plan.stats.rasterCount, 1);
  assert.equal(plan.stats.domProxyCount, 0);
  assert.equal(plan.stats.activationFloor, 0.32);
  assert.ok(Math.abs(plan.stats.activationSignal - 0.352) < 1e-9);
  assert.ok(plan.signature.includes('\x1fraster\x1fa'));
  assert.equal(plan.coverageSignature, plan.signature);
});

test('rendererRasterProxyPolicy: 激活信号低于下限时回落 DOM 代理', () => {
  const plan = planFor({ scenePressure: 0 });
  assert.equal(plan.active, false);
  assert.equal(plan.reason, 'below-raster-load');
  assert.deepEqual([...plan.rasterIds], []);
  assert.deepEqual([...plan.domProxyIds], ['a']);
  assert.equal(plan.stats.rasterCount, 0);
});

test('rendererRasterProxyPolicy: 曾栅格化的节点使用更低激活下限', () => {
  assert.equal(planFor({ scenePressure: 0.8 }).reason, 'below-raster-load');
  const retained = planFor({ scenePressure: 0.8, previousRasterIds: ['a'] });
  assert.equal(retained.reason, 'rasterized-all-proxies');
  assert.equal(retained.stats.activationFloor, 0.24);
  assert.deepEqual([...retained.rasterIds], ['a']);
});

test('rendererRasterProxyPolicy: 节点容器为 Map 时同样可解析类型与投影尺寸', () => {
  const plan = planRendererRasterProxies({
    nodes: new Map([['c', { type: 'image', width: 80, height: 120 }]]),
    proxySurfaceIds: ['c'],
    rasterSupportedNodeTypes: ['image'],
    viewport: { zoom: 1 },
    scenePressure: 1,
  });
  assert.equal(plan.reason, 'rasterized-all-proxies');
  assert.deepEqual([...plan.rasterIds], ['c']);
});

test('rendererRasterProxyPolicy: 精确可见覆盖统计把全屏面也算作已覆盖', () => {
  const plan = planFor({ exactVisibleIds: ['a'], scenePressure: 1 });
  assert.equal(plan.stats.exactVisibleCount, 1);
  assert.equal(plan.stats.exactVisibleCoveredCount, 1);
  assert.equal(plan.stats.exactVisibleMissingCount, 0);
  const full = planFor({ exactVisibleIds: ['a'], fullSurfaceIds: ['a'], scenePressure: 1 });
  assert.equal(full.stats.exactVisibleCoveredCount, 1);
  assert.equal(full.stats.exactVisibleMissingCount, 0);
});
