import { normalizeNodeType } from '../modules/nodeMeta.js';
const RENDERER_NODE_LIFECYCLE_SLOW_LIMIT = 8;
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
    nodeCount: Number['isFinite'](Number(nodeCount)) ? Number(nodeCount) : 0,
    renderNodeCount: Number['isFinite'](Number(renderNodeCount)) ? Number(renderNodeCount) : 0,
    mountCandidateCount: Number['isFinite'](Number(mountCandidateCount)) ? Number(mountCandidateCount) : 0,
    parkCandidateCount: Number['isFinite'](Number(parkCandidateCount)) ? Number(parkCandidateCount) : 0,
    viewportBusy: viewportBusy === true,
    createdCount: 0,
    createRuntimeMs: 0,
    createRuntimeMaxMs: 0,
    remountedCount: 0,
    remountRuntimeMs: 0,
    remountRuntimeMaxMs: 0,
    parkedCount: 0,
    parkRuntimeMs: 0,
    parkRuntimeMaxMs: 0,
    updateCount: 0,
    hiddenUpdateCount: 0,
    updateRuntimeMs: 0,
    updateRuntimeMaxMs: 0,
    skippedUpdateCount: 0,
    mountBatchCount: 0,
    mountBatchFlushMs: 0,
    mountBatchFlushMaxMs: 0,
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
      (enabled[rendererLifecycleNodeType] = { count: 0, durationMs: 0, maxMs: 0 });
  ((key['count'] += 1), (key['durationMs'] += item), (key['maxMs'] = Math['max'](key['maxMs'], item)));
}
function sanitizeRendererLifecycleBreakdown(index) {
  const list = Array['isArray'](index?.['sections']) ? index['sections'] : [],
    sections = list['map']((error) => ({
      name: String(error?.['name'] || '')['slice'](0, 80),
      durationMs: Number(error?.['durationMs'] || 0),
    }))
      ['filter']((error2) => error2['name'] && Number['isFinite'](error2['durationMs']))
      ['slice'](0, 12);
  if (!sections['length']) return null;
  const result = { totalMs: Number(index?.['totalMs'] || 0), sections: sections };
  return (
    index?.['details'] &&
      typeof index['details'] === 'object' &&
      (result['details'] = Object['fromEntries'](
        Object['entries'](index['details'])
          ['map'](([data, options]) => [
            String(data || '')['slice'](0, 80),
            String(options ?? '')['slice'](0, 500),
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
  if (!Number['isFinite'](count) || count < 0) return;
  if (payload === 'create') {
    ((enabled4['createdCount'] += 1),
      (enabled4['createRuntimeMs'] += count),
      (enabled4['createRuntimeMaxMs'] = Math['max'](enabled4['createRuntimeMaxMs'], count)),
      addRendererLifecycleTypeDuration(enabled4['createdByType'], handle, count),
      pushRendererLifecycleSlow(enabled4['slowCreates'], handle, count, config));
    return;
  }
  if (payload === 'remount') {
    ((enabled4['remountedCount'] += 1),
      (enabled4['remountRuntimeMs'] += count),
      (enabled4['remountRuntimeMaxMs'] = Math['max'](enabled4['remountRuntimeMaxMs'], count)));
    return;
  }
  if (payload === 'park') {
    ((enabled4['parkedCount'] += 1),
      (enabled4['parkRuntimeMs'] += count),
      (enabled4['parkRuntimeMaxMs'] = Math['max'](enabled4['parkRuntimeMaxMs'], count)));
    return;
  }
  if (payload === 'update') {
    enabled4['updateCount'] += 1;
    if (config === 'hidden') enabled4['hiddenUpdateCount'] += 1;
    ((enabled4['updateRuntimeMs'] += count),
      (enabled4['updateRuntimeMaxMs'] = Math['max'](enabled4['updateRuntimeMaxMs'], count)),
      addRendererLifecycleTypeDuration(enabled4['updatedByType'], handle, count),
      pushRendererLifecycleSlow(enabled4['slowUpdates'], handle, count, config, scope));
  }
}
export function recordRendererLifecycleSkippedUpdate(enabled5) {
  if (!enabled5) return;
  enabled5['skippedUpdateCount'] += 1;
}
