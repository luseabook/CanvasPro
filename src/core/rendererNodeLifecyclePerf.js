import { normalizeNodeType } from '../modules/nodeMeta.js';
const RENDERER_NODE_LIFECYCLE_SLOW_LIMIT = 0x8;
export function createRendererNodeLifecycleStats({
  mode: mode,
  nodeCount: nodeCount,
  renderNodeCount: renderNodeCount,
  mountCandidateCount: mountCandidateCount,
  parkCandidateCount: parkCandidateCount,
  viewportBusy: viewportBusy,
} = {}) {
  return {
    mode: String(mode || 'unknown'),
    nodeCount: Number['isFinite'](Number(nodeCount)) ? Number(nodeCount) : 0x0,
    renderNodeCount: Number['isFinite'](Number(renderNodeCount)) ? Number(renderNodeCount) : 0x0,
    mountCandidateCount: Number['isFinite'](Number(mountCandidateCount)) ? Number(mountCandidateCount) : 0x0,
    parkCandidateCount: Number['isFinite'](Number(parkCandidateCount)) ? Number(parkCandidateCount) : 0x0,
    viewportBusy: viewportBusy === !![],
    createdCount: 0x0,
    createRuntimeMs: 0x0,
    createRuntimeMaxMs: 0x0,
    remountedCount: 0x0,
    remountRuntimeMs: 0x0,
    remountRuntimeMaxMs: 0x0,
    parkedCount: 0x0,
    parkRuntimeMs: 0x0,
    parkRuntimeMaxMs: 0x0,
    updateCount: 0x0,
    hiddenUpdateCount: 0x0,
    updateRuntimeMs: 0x0,
    updateRuntimeMaxMs: 0x0,
    skippedUpdateCount: 0x0,
    mountBatchCount: 0x0,
    mountBatchFlushMs: 0x0,
    mountBatchFlushMaxMs: 0x0,
    createdByType: {},
    updatedByType: {},
    slowCreates: [],
    slowUpdates: [],
  };
}
function getRendererLifecycleNodeType(value) {
  const nodeType = normalizeNodeType(value?.['type']);
  return nodeType || String(value?.['type'] || 'unknown');
}
function addRendererLifecycleTypeDuration(enabled, enabled2, item) {
  if (!enabled || !enabled2) return;
  const rendererLifecycleNodeType = getRendererLifecycleNodeType(enabled2),
    key =
      enabled[rendererLifecycleNodeType] ||
      (enabled[rendererLifecycleNodeType] = { count: 0x0, durationMs: 0x0, maxMs: 0x0 });
  ((key['count'] += 0x1), (key['durationMs'] += item), (key['maxMs'] = Math['max'](key['maxMs'], item)));
}
function sanitizeRendererLifecycleBreakdown(index) {
  const list = Array['isArray'](index?.['sections']) ? index['sections'] : [],
    sections = list['map']((error) => ({
      name: String(error?.['name'] || '')['slice'](0x0, 0x50),
      durationMs: Number(error?.['durationMs'] || 0x0),
    }))
      ['filter']((error2) => error2['name'] && Number['isFinite'](error2['durationMs']))
      ['slice'](0x0, 0xc);
  if (!sections['length']) return null;
  const result = { totalMs: Number(index?.['totalMs'] || 0x0), sections: sections };
  return (
    index?.['details'] &&
      typeof index['details'] === 'object' &&
      (result['details'] = Object['fromEntries'](
        Object['entries'](index['details'])
          ['map'](([data, options]) => [
            String(data || '')['slice'](0x0, 0x50),
            String(options ?? '')['slice'](0x0, 0x1f4),
          ])
          ['filter'](([target]) => target),
      )),
    result
  );
}
function pushRendererLifecycleSlow(list2, enabled3, durationMs, source, next = {}) {
  if (!Array['isArray'](list2) || !enabled3) return;
  const current = {
      nodeId: String(enabled3['id'] || ''),
      type: getRendererLifecycleNodeType(enabled3),
      reason: String(source || ''),
      durationMs: durationMs,
    },
    sanitizeRendererLifecycleBreakdown2 = sanitizeRendererLifecycleBreakdown(next['breakdown']);
  if (sanitizeRendererLifecycleBreakdown2) current['breakdown'] = sanitizeRendererLifecycleBreakdown2;
  (list2['push'](current),
    list2['sort']((entry, record) => record['durationMs'] - entry['durationMs']),
    list2['length'] > RENDERER_NODE_LIFECYCLE_SLOW_LIMIT &&
      (list2['length'] = RENDERER_NODE_LIFECYCLE_SLOW_LIMIT));
}
export function recordRendererLifecycleDuration(enabled4, payload, handle, state, config, scope = {}) {
  if (!enabled4) return;
  const count = Number(state);
  if (!Number['isFinite'](count) || count < 0x0) return;
  if (payload === 'create') {
    ((enabled4['createdCount'] += 0x1),
      (enabled4['createRuntimeMs'] += count),
      (enabled4['createRuntimeMaxMs'] = Math['max'](enabled4['createRuntimeMaxMs'], count)),
      addRendererLifecycleTypeDuration(enabled4['createdByType'], handle, count),
      pushRendererLifecycleSlow(enabled4['slowCreates'], handle, count, config));
    return;
  }
  if (payload === 'remount') {
    ((enabled4['remountedCount'] += 0x1),
      (enabled4['remountRuntimeMs'] += count),
      (enabled4['remountRuntimeMaxMs'] = Math['max'](enabled4['remountRuntimeMaxMs'], count)));
    return;
  }
  if (payload === 'park') {
    ((enabled4['parkedCount'] += 0x1),
      (enabled4['parkRuntimeMs'] += count),
      (enabled4['parkRuntimeMaxMs'] = Math['max'](enabled4['parkRuntimeMaxMs'], count)));
    return;
  }
  if (payload === 'update') {
    enabled4['updateCount'] += 0x1;
    if (config === 'hidden') enabled4['hiddenUpdateCount'] += 0x1;
    ((enabled4['updateRuntimeMs'] += count),
      (enabled4['updateRuntimeMaxMs'] = Math['max'](enabled4['updateRuntimeMaxMs'], count)),
      addRendererLifecycleTypeDuration(enabled4['updatedByType'], handle, count),
      pushRendererLifecycleSlow(enabled4['slowUpdates'], handle, count, config, scope));
  }
}
export function recordRendererLifecycleSkippedUpdate(enabled5) {
  if (!enabled5) return;
  enabled5['skippedUpdateCount'] += 0x1;
}
