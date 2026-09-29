import * as threeRuntime from './threeRuntime.js';
import { createSelectionRing } from './scene3dTheme.js';
function createSceneAssetGeometry(_0x4d40e2) {
  if (_0x4d40e2?.['primitive'] === 'cylinder')
    return new threeRuntime['CylinderGeometry'](
      Number(_0x4d40e2['radiusTop']) || 0.5,
      Number(_0x4d40e2['radiusBottom']) || 0.5,
      Number(_0x4d40e2['height']) || 0x1,
      0x12,
    );
  if (_0x4d40e2?.['primitive'] === 'sphere')
    return new threeRuntime['SphereGeometry'](Number(_0x4d40e2['radius']) || 0.5, 0x12, 0xc);
  if (_0x4d40e2?.['primitive'] === 'torus')
    return new threeRuntime['TorusGeometry'](
      Number(_0x4d40e2['radius']) || 0.5,
      Number(_0x4d40e2['tube']) || 0.08,
      0xa,
      0x18,
    );
  const _0x19e3c1 = _0x4d40e2?.['size'] || {};
  return new threeRuntime['BoxGeometry'](
    Number(_0x19e3c1['x']) || 0x1,
    Number(_0x19e3c1['y']) || 0x1,
    Number(_0x19e3c1['z']) || 0x1,
  );
}
export function createSceneAssetVisual(_0x3cf364, _0x2fda76, _0x1787a5) {
  const _0x7a75f6 = new threeRuntime['Group'](),
    _0xa60b5f = new threeRuntime['Group']();
  _0x7a75f6['add'](_0xa60b5f);
  const _0x142e91 = new Map(),
    _0x1ae58d = new Map(),
    _0x3fe0df = '__default',
    _0x24218a = (_0x2cbbab) => {
      const _0x2e18ec = _0x2cbbab || _0x3fe0df;
      if (!_0x142e91['has'](_0x2e18ec)) {
        const _0x3708e9 = _0x2cbbab ? _0x1787a5(_0x2cbbab) : _0x2fda76;
        (_0x142e91['set'](
          _0x2e18ec,
          new threeRuntime['MeshStandardMaterial']({
            color: _0x3708e9,
            roughness: 0.55,
            metalness: _0x3cf364?.['category'] === 'stage' ? 0.14 : 0.04,
          }),
        ),
          _0x1ae58d['set'](
            _0x2e18ec,
            new threeRuntime['LineBasicMaterial']({
              color: new threeRuntime['Color'](_0x3708e9)['clone']()['offsetHSL'](0x0, 0x0, -0.18),
              transparent: !![],
              opacity: 0.78,
            }),
          ));
      }
      return { material: _0x142e91['get'](_0x2e18ec), edgeMaterial: _0x1ae58d['get'](_0x2e18ec) };
    },
    _0x427d13 =
      Array['isArray'](_0x3cf364?.['parts']) && _0x3cf364['parts']['length'] > 0x0
        ? _0x3cf364['parts']
        : [
            {
              primitive: 'box',
              size: { x: 0x1, y: 0x1, z: 0x1 },
              position: { x: 0x0, y: 0.5, z: 0x0 },
              rotation: { x: 0x0, y: 0x0, z: 0x0 },
            },
          ];
  _0x427d13['forEach']((_0x126661) => {
    const _0x4163ac = createSceneAssetGeometry(_0x126661),
      { material: _0x332a18, edgeMaterial: _0x3625ab } = _0x24218a(_0x126661['colorKey']),
      _0x30f08a = new threeRuntime['Mesh'](_0x4163ac, _0x332a18);
    (_0x30f08a['position']['set'](
      Number(_0x126661?.['position']?.['x']) || 0x0,
      Number(_0x126661?.['position']?.['y']) || 0x0,
      Number(_0x126661?.['position']?.['z']) || 0x0,
    ),
      _0x30f08a['rotation']['set'](
        Number(_0x126661?.['rotation']?.['x']) || 0x0,
        Number(_0x126661?.['rotation']?.['y']) || 0x0,
        Number(_0x126661?.['rotation']?.['z']) || 0x0,
      ),
      _0xa60b5f['add'](_0x30f08a));
    const _0x1a4806 = new threeRuntime['LineSegments'](
      new threeRuntime['EdgesGeometry'](_0x4163ac),
      _0x3625ab,
    );
    (_0x1a4806['position']['copy'](_0x30f08a['position']),
      _0x1a4806['rotation']['copy'](_0x30f08a['rotation']),
      _0xa60b5f['add'](_0x1a4806));
  });
  const _0x4aea10 = createSelectionRing(0x7db4ff);
  _0x7a75f6['add'](_0x4aea10);
  const _0x257a14 = _0x142e91['get'](_0x3fe0df) || _0x142e91['values']()['next']()['value'],
    _0x305ae8 = _0x1ae58d['get'](_0x3fe0df) || _0x1ae58d['values']()['next']()['value'];
  return {
    assetId: _0x3cf364?.['id'] || null,
    group: _0x7a75f6,
    content: _0xa60b5f,
    material: _0x257a14,
    edgeMaterial: _0x305ae8,
    materialsByColorKey: _0x142e91,
    edgeMaterialsByColorKey: _0x1ae58d,
    selectionRing: _0x4aea10,
  };
}
export function applySceneAssetColors(_0x215ecb, _0x3679ee, _0x434dc4) {
  (_0x215ecb?.['materialsByColorKey']?.['forEach']((_0x3c008b, _0x1815ec) => {
    _0x3c008b['color']['copy'](_0x1815ec === '__default' ? _0x3679ee : _0x434dc4(_0x1815ec));
  }),
    _0x215ecb?.['edgeMaterialsByColorKey']?.['forEach']((_0x4d3126, _0x2414e5) => {
      const _0x1f08a4 = _0x2414e5 === '__default' ? _0x3679ee : _0x434dc4(_0x2414e5);
      _0x4d3126['color']['copy'](new threeRuntime['Color'](_0x1f08a4)['offsetHSL'](0x0, 0x0, -0.18));
    }));
}
