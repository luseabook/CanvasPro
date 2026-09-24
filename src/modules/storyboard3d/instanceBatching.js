import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
export const STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT = 0x3;
function finite(_0x46632f, _0x4653a0 = 0x0) {
  const _0x9bca16 = Number(_0x46632f);
  return Number['isFinite'](_0x9bca16) ? _0x9bca16 : _0x4653a0;
}
function vector3(_0x266f40, _0x991e79) {
  const _0x23d85d = Array['isArray'](_0x266f40) ? _0x266f40 : [];
  return new threeRuntime['Vector3'](
    finite(_0x23d85d[0x0], _0x991e79[0x0]),
    finite(_0x23d85d[0x1], _0x991e79[0x1]),
    finite(_0x23d85d[0x2], _0x991e79[0x2]),
  );
}
export function createStoryboard3DInstanceMatrix(_0x5e12ef, _0x15d1d9 = null) {
  const _0x3f81cb = vector3(_0x5e12ef?.['position'], [0x0, 0x0, 0x0]),
    _0x435ddf = vector3(_0x5e12ef?.['rotation'], [0x0, 0x0, 0x0]),
    _0x2f498f = vector3(_0x5e12ef?.['scale'], [0x1, 0x1, 0x1]);
  _0x2f498f['set'](
    Math['max'](0.001, _0x2f498f['x']),
    Math['max'](0.001, _0x2f498f['y']),
    Math['max'](0.001, _0x2f498f['z']),
  );
  const _0x2ca68f = new threeRuntime['Matrix4']()['compose'](
    _0x3f81cb,
    new threeRuntime['Quaternion']()['setFromEuler'](
      new threeRuntime['Euler'](_0x435ddf['x'], _0x435ddf['y'], _0x435ddf['z']),
    ),
    _0x2f498f,
  );
  if (_0x15d1d9) _0x2ca68f['multiply'](_0x15d1d9);
  return _0x2ca68f;
}
export function findStoryboard3DInstancingTemplate(_0x313658) {
  if (!_0x313658?.['traverse']) return null;
  _0x313658['updateMatrixWorld']?.(!![]);
  const _0x5e4694 = [];
  let _0x44b81 = ![];
  _0x313658['traverse']((_0x75fb04) => {
    if (_0x75fb04?.['isSkinnedMesh'] || _0x75fb04?.['morphTargetInfluences']?.['length']) _0x44b81 = !![];
    if (_0x75fb04?.['isMesh'] && !_0x75fb04['isInstancedMesh']) _0x5e4694['push'](_0x75fb04);
  });
  if (_0x44b81 || _0x5e4694['length'] !== 0x1) return null;
  const _0x113cf3 = _0x5e4694[0x0];
  if (!_0x113cf3['geometry'] || !_0x113cf3['material']) return null;
  return {
    geometry: _0x113cf3['geometry'],
    material: _0x113cf3['material'],
    sourceMatrix: _0x113cf3['matrixWorld']['clone'](),
  };
}
export function createStoryboard3DInstanceBatch({
  template: _0x562731,
  objects: objects = [],
  tint: tint = '',
  castShadow: castShadow = !![],
  receiveShadow: receiveShadow = !![],
} = {}) {
  if (!_0x562731?.['geometry'] || !_0x562731?.['material'])
    throw new TypeError('An\x20instancing\x20template\x20is\x20required');
  const _0x2a78e6 = Array['isArray'](objects) ? objects['filter']((_0x122a72) => _0x122a72?.['id']) : [];
  if (_0x2a78e6['length'] === 0x0)
    throw new Error('At\x20least\x20one\x20storyboard\x20object\x20is\x20required');
  const _0x4bdf80 = Array['isArray'](_0x562731['material']) ? _0x562731['material'] : [_0x562731['material']],
    _0x33e818 = [],
    _0x3eeea8 = _0x4bdf80['map']((_0x507760) => {
      if (!tint || !_0x507760?.['clone']) return _0x507760;
      const _0x272848 = _0x507760['clone']();
      return (_0x272848['color']?.['set']?.(tint), _0x33e818['push'](_0x272848), _0x272848);
    }),
    _0x35637a = new threeRuntime['InstancedMesh'](
      _0x562731['geometry'],
      Array['isArray'](_0x562731['material']) ? _0x3eeea8 : _0x3eeea8[0x0],
      _0x2a78e6['length'],
    );
  return (
    (_0x35637a['name'] = 'storyboard3d-instance-batch'),
    (_0x35637a['castShadow'] = castShadow !== ![]),
    (_0x35637a['receiveShadow'] = receiveShadow !== ![]),
    (_0x35637a['userData']['storyboardObjectIds'] = _0x2a78e6['map']((_0x4d1e4e) => _0x4d1e4e['id'])),
    _0x2a78e6['forEach']((_0x379d9e, _0x79f8b6) => {
      _0x35637a['setMatrixAt'](
        _0x79f8b6,
        createStoryboard3DInstanceMatrix(_0x379d9e['transform'], _0x562731['sourceMatrix']),
      );
    }),
    (_0x35637a['instanceMatrix']['needsUpdate'] = !![]),
    _0x35637a['computeBoundingBox']?.(),
    _0x35637a['computeBoundingSphere']?.(),
    {
      mesh: _0x35637a,
      objectIds: [..._0x35637a['userData']['storyboardObjectIds']],
      sourceMatrix: _0x562731['sourceMatrix']['clone'](),
      ownedMaterials: _0x33e818,
    }
  );
}
export function refreshStoryboard3DInstanceBatchBounds(_0x1a857d) {
  const _0x24e96c = _0x1a857d?.['mesh'];
  if (!_0x24e96c) return ![];
  return (_0x24e96c['computeBoundingBox']?.(), _0x24e96c['computeBoundingSphere']?.(), !![]);
}
export function updateStoryboard3DInstanceTransform(
  _0x4f4e81,
  _0x26450b,
  _0xac5f70,
  { recomputeBounds: recomputeBounds = !![] } = {},
) {
  const _0x1436ae = _0x4f4e81?.['objectIds']?.['indexOf']?.(_0x26450b) ?? -0x1;
  if (_0x1436ae < 0x0 || !_0x4f4e81?.['mesh']?.['setMatrixAt']) return ![];
  (_0x4f4e81['mesh']['setMatrixAt'](
    _0x1436ae,
    createStoryboard3DInstanceMatrix(_0xac5f70, _0x4f4e81['sourceMatrix']),
  ),
    (_0x4f4e81['mesh']['instanceMatrix']['needsUpdate'] = !![]));
  if (recomputeBounds) refreshStoryboard3DInstanceBatchBounds(_0x4f4e81);
  return !![];
}
export function disposeStoryboard3DInstanceBatch(_0x552e05) {
  (_0x552e05?.['mesh']?.['removeFromParent']?.(),
    _0x552e05?.['mesh']?.['dispose']?.(),
    (_0x552e05?.['ownedMaterials'] || [])['forEach']((_0x3ca191) => _0x3ca191?.['dispose']?.()));
}
