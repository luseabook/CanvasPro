import { normalizeNodeType } from '../modules/nodeMeta.js';
const RENDERER_NODE_LIFECYCLE_SLOW_LIMIT = 0x8;
export function createRendererNodeLifecycleStats({
  mode: _0x22b14d,
  nodeCount: _0x4fb3ac,
  renderNodeCount: _0x305119,
  mountCandidateCount: _0x136010,
  parkCandidateCount: _0x4668de,
  viewportBusy: _0x2f868f,
} = {}) {
  return {
    mode: String(_0x22b14d || 'unknown'),
    nodeCount: Number['isFinite'](Number(_0x4fb3ac)) ? Number(_0x4fb3ac) : 0x0,
    renderNodeCount: Number['isFinite'](Number(_0x305119)) ? Number(_0x305119) : 0x0,
    mountCandidateCount: Number['isFinite'](Number(_0x136010)) ? Number(_0x136010) : 0x0,
    parkCandidateCount: Number['isFinite'](Number(_0x4668de)) ? Number(_0x4668de) : 0x0,
    viewportBusy: _0x2f868f === !![],
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
function getRendererLifecycleNodeType(_0x5c15aa) {
  const _0x2c6290 = normalizeNodeType(_0x5c15aa?.['type']);
  return _0x2c6290 || String(_0x5c15aa?.['type'] || 'unknown');
}
function addRendererLifecycleTypeDuration(_0x23a540, _0x122bda, _0x1b92ee) {
  if (!_0x23a540 || !_0x122bda) return;
  const _0x3e85ee = getRendererLifecycleNodeType(_0x122bda),
    _0x20a7ed = _0x23a540[_0x3e85ee] || (_0x23a540[_0x3e85ee] = { count: 0x0, durationMs: 0x0, maxMs: 0x0 });
  ((_0x20a7ed['count'] += 0x1),
    (_0x20a7ed['durationMs'] += _0x1b92ee),
    (_0x20a7ed['maxMs'] = Math['max'](_0x20a7ed['maxMs'], _0x1b92ee)));
}
function sanitizeRendererLifecycleBreakdown(_0x5b9a00) {
  const _0x59e580 = Array['isArray'](_0x5b9a00?.['sections']) ? _0x5b9a00['sections'] : [],
    _0x3691c3 = _0x59e580['map']((_0x368a14) => ({
      name: String(_0x368a14?.['name'] || '')['slice'](0x0, 0x50),
      durationMs: Number(_0x368a14?.['durationMs'] || 0x0),
    }))
      ['filter']((_0x390a52) => _0x390a52['name'] && Number['isFinite'](_0x390a52['durationMs']))
      ['slice'](0x0, 0xc);
  if (!_0x3691c3['length']) return null;
  const _0x2845cb = { totalMs: Number(_0x5b9a00?.['totalMs'] || 0x0), sections: _0x3691c3 };
  return (
    _0x5b9a00?.['details'] &&
      typeof _0x5b9a00['details'] === 'object' &&
      (_0x2845cb['details'] = Object['fromEntries'](
        Object['entries'](_0x5b9a00['details'])
          ['map'](([_0x4f7587, _0x33abd3]) => [
            String(_0x4f7587 || '')['slice'](0x0, 0x50),
            String(_0x33abd3 ?? '')['slice'](0x0, 0x1f4),
          ])
          ['filter'](([_0x9450a7]) => _0x9450a7),
      )),
    _0x2845cb
  );
}
function pushRendererLifecycleSlow(_0x3deed4, _0x1cd58d, _0xaf79dc, _0x50ebf0, _0x3db95f = {}) {
  if (!Array['isArray'](_0x3deed4) || !_0x1cd58d) return;
  const _0x54ade9 = {
      nodeId: String(_0x1cd58d['id'] || ''),
      type: getRendererLifecycleNodeType(_0x1cd58d),
      reason: String(_0x50ebf0 || ''),
      durationMs: _0xaf79dc,
    },
    _0x51d50d = sanitizeRendererLifecycleBreakdown(_0x3db95f['breakdown']);
  if (_0x51d50d) _0x54ade9['breakdown'] = _0x51d50d;
  (_0x3deed4['push'](_0x54ade9),
    _0x3deed4['sort']((_0x5e9370, _0x570027) => _0x570027['durationMs'] - _0x5e9370['durationMs']),
    _0x3deed4['length'] > RENDERER_NODE_LIFECYCLE_SLOW_LIMIT &&
      (_0x3deed4['length'] = RENDERER_NODE_LIFECYCLE_SLOW_LIMIT));
}
export function recordRendererLifecycleDuration(
  _0x271d83,
  _0x371179,
  _0x24d2ce,
  _0x41a4c7,
  _0x3de4db,
  _0x1bf2bc = {},
) {
  if (!_0x271d83) return;
  const _0x1a29f0 = Number(_0x41a4c7);
  if (!Number['isFinite'](_0x1a29f0) || _0x1a29f0 < 0x0) return;
  if (_0x371179 === 'create') {
    ((_0x271d83['createdCount'] += 0x1),
      (_0x271d83['createRuntimeMs'] += _0x1a29f0),
      (_0x271d83['createRuntimeMaxMs'] = Math['max'](_0x271d83['createRuntimeMaxMs'], _0x1a29f0)),
      addRendererLifecycleTypeDuration(_0x271d83['createdByType'], _0x24d2ce, _0x1a29f0),
      pushRendererLifecycleSlow(_0x271d83['slowCreates'], _0x24d2ce, _0x1a29f0, _0x3de4db));
    return;
  }
  if (_0x371179 === 'remount') {
    ((_0x271d83['remountedCount'] += 0x1),
      (_0x271d83['remountRuntimeMs'] += _0x1a29f0),
      (_0x271d83['remountRuntimeMaxMs'] = Math['max'](_0x271d83['remountRuntimeMaxMs'], _0x1a29f0)));
    return;
  }
  if (_0x371179 === 'park') {
    ((_0x271d83['parkedCount'] += 0x1),
      (_0x271d83['parkRuntimeMs'] += _0x1a29f0),
      (_0x271d83['parkRuntimeMaxMs'] = Math['max'](_0x271d83['parkRuntimeMaxMs'], _0x1a29f0)));
    return;
  }
  if (_0x371179 === 'update') {
    _0x271d83['updateCount'] += 0x1;
    if (_0x3de4db === 'hidden') _0x271d83['hiddenUpdateCount'] += 0x1;
    ((_0x271d83['updateRuntimeMs'] += _0x1a29f0),
      (_0x271d83['updateRuntimeMaxMs'] = Math['max'](_0x271d83['updateRuntimeMaxMs'], _0x1a29f0)),
      addRendererLifecycleTypeDuration(_0x271d83['updatedByType'], _0x24d2ce, _0x1a29f0),
      pushRendererLifecycleSlow(_0x271d83['slowUpdates'], _0x24d2ce, _0x1a29f0, _0x3de4db, _0x1bf2bc));
  }
}
export function recordRendererLifecycleSkippedUpdate(_0x522fb6) {
  if (!_0x522fb6) return;
  _0x522fb6['skippedUpdateCount'] += 0x1;
}
