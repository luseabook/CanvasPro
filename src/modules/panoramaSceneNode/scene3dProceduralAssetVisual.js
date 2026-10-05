import * as threeRuntime from './threeRuntime.js';
import { createSelectionRing } from './scene3dTheme.js';
function createSceneAssetGeometry(box) {
  if (box?.['primitive'] === 'cylinder')
    return new threeRuntime['CylinderGeometry'](
      Number(box['radiusTop']) || 0.5,
      Number(box['radiusBottom']) || 0.5,
      Number(box['height']) || 1,
      18,
    );
  if (box?.['primitive'] === 'sphere')
    return new threeRuntime['SphereGeometry'](Number(box['radius']) || 0.5, 18, 12);
  if (box?.['primitive'] === 'torus')
    return new threeRuntime['TorusGeometry'](
      Number(box['radius']) || 0.5,
      Number(box['tube']) || 0.08,
      10,
      24,
    );
  const box2 = box?.['size'] || {};
  return new threeRuntime['BoxGeometry'](
    Number(box2['x']) || 1,
    Number(box2['y']) || 1,
    Number(box2['z']) || 1,
  );
}
export function createSceneAssetVisual(metalness, value, handler) {
  const group = new threeRuntime['Group'](),
    content = new threeRuntime['Group']();
  group['add'](content);
  const material = new Map(),
    edgeMaterial = new Map(),
    item = '__default',
    handler2 = (key) => {
      const index = key || item;
      if (!material['has'](index)) {
        const color = key ? handler(key) : value;
        (material['set'](
          index,
          new threeRuntime['MeshStandardMaterial']({
            color: color,
            roughness: 0.55,
            metalness: metalness?.['category'] === 'stage' ? 0.14 : 0.04,
          }),
        ),
          edgeMaterial['set'](
            index,
            new threeRuntime['LineBasicMaterial']({
              color: new threeRuntime['Color'](color)['clone']()['offsetHSL'](0, 0, -0.18),
              transparent: !![],
              opacity: 0.78,
            }),
          ));
      }
      return { material: material['get'](index), edgeMaterial: edgeMaterial['get'](index) };
    },
    list =
      Array['isArray'](metalness?.['parts']) && metalness['parts']['length'] > 0
        ? metalness['parts']
        : [
            {
              primitive: 'box',
              size: { x: 1, y: 1, z: 1 },
              position: { x: 0, y: 0.5, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
            },
          ];
  list['forEach']((result) => {
    const sceneAssetGeometry = createSceneAssetGeometry(result),
      { material: material2, edgeMaterial: edgeMaterial2 } = handler2(result['colorKey']),
      data = new threeRuntime['Mesh'](sceneAssetGeometry, material2);
    (data['position']['set'](
      Number(result?.['position']?.['x']) || 0,
      Number(result?.['position']?.['y']) || 0,
      Number(result?.['position']?.['z']) || 0,
    ),
      data['rotation']['set'](
        Number(result?.['rotation']?.['x']) || 0,
        Number(result?.['rotation']?.['y']) || 0,
        Number(result?.['rotation']?.['z']) || 0,
      ),
      content['add'](data));
    const options = new threeRuntime['LineSegments'](
      new threeRuntime['EdgesGeometry'](sceneAssetGeometry),
      edgeMaterial2,
    );
    (options['position']['copy'](data['position']),
      options['rotation']['copy'](data['rotation']),
      content['add'](options));
  });
  const selectionRing = createSelectionRing(0x7db4ff);
  group['add'](selectionRing);
  const material3 = material['get'](item) || material['values']()['next']()['value'],
    edgeMaterial3 = edgeMaterial['get'](item) || edgeMaterial['values']()['next']()['value'];
  return {
    assetId: metalness?.['id'] || null,
    group: group,
    content: content,
    material: material3,
    edgeMaterial: edgeMaterial3,
    materialsByColorKey: material,
    edgeMaterialsByColorKey: edgeMaterial,
    selectionRing: selectionRing,
  };
}
export function applySceneAssetColors(target, source, handler3) {
  (target?.['materialsByColorKey']?.['forEach']((next, current) => {
    next['color']['copy'](current === '__default' ? source : handler3(current));
  }),
    target?.['edgeMaterialsByColorKey']?.['forEach']((entry, record) => {
      const payload = record === '__default' ? source : handler3(record);
      entry['color']['copy'](new threeRuntime['Color'](payload)['offsetHSL'](0, 0, -0.18));
    }));
}
