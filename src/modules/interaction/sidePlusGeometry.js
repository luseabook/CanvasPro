import { findClosestNode } from '../../core/math.js';
import { isNodeType } from '../registry.js';
import { createNodeGeometryOverlay } from '../../core/nodeGeometryOverlay.js';
import { readNodeGeometryPreviewEntries } from '../../core/nodeGeometryPreview.js';
export function createSidePlusGeometryOverlay(_0x2ae42d, _0x1dc06b) {
  const _0x423a1a = Object['create'](null);
  for (const [_0x42313b, _0x378d82] of readNodeGeometryPreviewEntries()) {
    Number['isFinite'](_0x378d82['width']) &&
      Number['isFinite'](_0x378d82['height']) &&
      (_0x423a1a[_0x42313b] = { width: _0x378d82['width'], height: _0x378d82['height'] });
  }
  return (Object['assign'](_0x423a1a, _0x1dc06b), createNodeGeometryOverlay(_0x2ae42d, _0x423a1a));
}
export function createGroupSidePlusCandidateIdCache() {
  let _0x5d4d7e = null,
    _0x1004af = -0x1,
    _0x145674 = [];
  return {
    get(_0x5cfabf, _0x1c593a) {
      const _0x4b36a = Number['isFinite'](_0x1c593a) ? _0x1c593a : -0x1;
      if (_0x5cfabf === _0x5d4d7e && _0x4b36a === _0x1004af) return _0x145674;
      ((_0x5d4d7e = _0x5cfabf || null), (_0x1004af = _0x4b36a), (_0x145674 = []));
      for (const [_0x1d16cc, _0x19c148] of Object['entries'](_0x5cfabf || {})) {
        if (!isNodeType(_0x19c148, 'group')) continue;
        const _0xca27b4 = String(_0x19c148?.['id'] || _0x1d16cc || '')['trim']();
        if (_0xca27b4) _0x145674['push'](_0xca27b4);
      }
      return _0x145674;
    },
  };
}
function getClosestResultDistanceSq(_0x3fae6f, _0x54a189, _0x81a8ce) {
  const _0x27cbc0 = _0x54a189 - Number(_0x3fae6f?.['screenRect']?.['cx'] || 0x0),
    _0x48eb37 = _0x81a8ce - Number(_0x3fae6f?.['screenRect']?.['cy'] || 0x0);
  return _0x27cbc0 * _0x27cbc0 + _0x48eb37 * _0x48eb37;
}
function getSpatialNodeOrder(_0x141719, _0x54d8c1) {
  return _0x141719?.['nodeRects']?.['get']?.(_0x54d8c1)?.['order'] ?? Infinity;
}
export function findClosestNodeWithGeometryOverrides({
  screenX: _0x9f4512,
  screenY: _0x2d2794,
  nodes: _0x2191fb,
  geometryNodes: geometryNodes = _0x2191fb,
  overrideNodeIds: overrideNodeIds = [],
  viewport: _0x2a12af,
  spatialIndex: _0x41b5ef,
  ignoreGroup: ignoreGroup = ![],
} = {}) {
  const _0x3a26c1 = Array['isArray'](overrideNodeIds)
    ? overrideNodeIds['filter']((_0x319dcf) => !!geometryNodes?.[_0x319dcf])['sort'](
        (_0x477c1a, _0x4e3cfa) =>
          getSpatialNodeOrder(_0x41b5ef, _0x477c1a) - getSpatialNodeOrder(_0x41b5ef, _0x4e3cfa),
      )
    : [];
  if (_0x3a26c1['length'] === 0x0)
    return findClosestNode(_0x9f4512, _0x2d2794, _0x2191fb, _0x2a12af, ignoreGroup, {
      spatialIndex: _0x41b5ef,
    });
  const _0xded746 = new Set(_0x3a26c1),
    _0x10d0f9 = findClosestNode(_0x9f4512, _0x2d2794, _0x2191fb, _0x2a12af, ignoreGroup, {
      spatialIndex: _0x41b5ef,
      candidateFilter: (_0x52b6ba, _0x11e00b) => !_0xded746['has'](_0x11e00b),
    }),
    _0x326a43 = Object['create'](null);
  for (const _0x5a9ccb of _0x3a26c1) _0x326a43[_0x5a9ccb] = geometryNodes[_0x5a9ccb];
  const _0x2ef138 = findClosestNode(_0x9f4512, _0x2d2794, _0x326a43, _0x2a12af, ignoreGroup);
  if (!_0x10d0f9) return _0x2ef138;
  if (!_0x2ef138) return _0x10d0f9;
  const _0x143e48 = getSpatialNodeOrder(_0x41b5ef, _0x10d0f9['nodeId']),
    _0x545d29 = getSpatialNodeOrder(_0x41b5ef, _0x2ef138['nodeId']);
  if (_0x10d0f9['isInside'] && _0x2ef138['isInside']) return _0x545d29 < _0x143e48 ? _0x2ef138 : _0x10d0f9;
  if (_0x10d0f9['isInside'] !== _0x2ef138['isInside']) return _0x2ef138['isInside'] ? _0x2ef138 : _0x10d0f9;
  const _0x1bba68 = getClosestResultDistanceSq(_0x10d0f9, _0x9f4512, _0x2d2794),
    _0x596068 = getClosestResultDistanceSq(_0x2ef138, _0x9f4512, _0x2d2794);
  if (_0x1bba68 !== _0x596068) return _0x596068 < _0x1bba68 ? _0x2ef138 : _0x10d0f9;
  return _0x545d29 < _0x143e48 ? _0x2ef138 : _0x10d0f9;
}
