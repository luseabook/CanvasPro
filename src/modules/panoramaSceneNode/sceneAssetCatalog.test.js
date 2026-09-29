import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SCENE_ASSET_ID,
  SCENE_ASSET_COUNT,
  estimateSceneAssetBoundingRadius,
  findSceneAsset,
  getSceneAssetCategories,
  listSceneAssets,
  resolveSceneAsset,
  searchSceneAssets,
} from './sceneAssetCatalog.js';

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    'expected ' + actual + ' to be within ' + tolerance + ' of ' + expected,
  );
}

test('素材目录给出 375 个组合与分类顺序', () => {
  assert.equal(SCENE_ASSET_COUNT, 375);
  assert.equal(DEFAULT_SCENE_ASSET_ID, 'props-cube-medium-blue');
  assert.deepEqual(getSceneAssetCategories(), ['architecture', 'furniture', 'stage', 'props', 'nature']);
});

test('listSceneAssets 每次返回新数组且条目已冻结', () => {
  const first = listSceneAssets();
  const second = listSceneAssets();
  assert.equal(first.length, 375);
  assert.notEqual(first, second);
  assert.equal(first[0].id, 'architecture-building-small-blue');
  for (const asset of first) {
    assert.equal(Object.isFrozen(asset), true);
    assert.equal(Object.isFrozen(asset.parts), true);
    assert.equal(Object.isFrozen(asset.tags), true);
  }
  first.push('x');
  assert.equal(listSceneAssets().length, 375);
});

test('素材条目携带族、尺寸、颜色与程序化标记', () => {
  const asset = findSceneAsset('props-cube-medium-blue');
  assert.equal(asset.familyId, 'cube');
  assert.equal(asset.name, 'Cube Medium Blue');
  assert.equal(asset.category, 'props');
  assert.deepEqual(asset.tags, ['box', 'primitive', 'legacy', 'medium', 'blue']);
  assert.equal(asset.kind, 'procedural');
  assert.equal(asset.colorKey, 'blue');
  assert.equal(asset.size, 'medium');
  assert.deepEqual(asset.parts, [
    {
      primitive: 'box',
      size: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      colorKey: null,
    },
  ]);
});

test('尺寸变体同时缩放构件尺寸与位置', () => {
  const small = findSceneAsset('props-cube-small-blue');
  assert.deepEqual(small.parts[0].size, { x: 0.75, y: 0.75, z: 0.75 });
  const large = findSceneAsset('props-cube-large-blue');
  assert.deepEqual(large.parts[0].size, { x: 1.35, y: 1.35, z: 1.35 });
  const smallBed = findSceneAsset('furniture-bed-small-blue');
  closeTo(smallBed.parts[1].position.z, 1.66 * 0.75);
  closeTo(smallBed.parts[0].size.z, 3.5 * 0.75);
});

test('楼梯族按步数生成递增台阶', () => {
  const stairs = findSceneAsset('architecture-stairs-medium-blue');
  assert.equal(stairs.parts.length, 5);
  stairs.parts.forEach((part, index) => {
    closeTo(part.position.y, 0.14 + index * 0.28);
    closeTo(part.position.z, index * 0.55);
    closeTo(part.size.y, 0.28);
  });
});

test('舞池族生成 16 块循环配色的地板砖', () => {
  const floor = findSceneAsset('stage-dance-floor-medium-blue');
  assert.equal(floor.parts.length, 16);
  assert.deepEqual(floor.parts.map((part) => part.colorKey).slice(0, 5), [
    'blue',
    'purple',
    'cyan',
    'yellow',
    'blue',
  ]);
  assert.equal(floor.parts[0].size.x, 0.78);
  assert.equal(floor.parts[0].position.y, 0.06);
});

test('findSceneAsset 去空白并拒绝未知 id', () => {
  assert.equal(findSceneAsset('  props-cube-medium-blue  ').id, 'props-cube-medium-blue');
  assert.equal(findSceneAsset('nope'), null);
  assert.equal(findSceneAsset(''), null);
  assert.equal(findSceneAsset(null), null);
});

test('resolveSceneAsset 依次回落到默认与首个素材', () => {
  assert.equal(resolveSceneAsset('nature-tree-large-red').id, 'nature-tree-large-red');
  assert.equal(resolveSceneAsset('nope').id, DEFAULT_SCENE_ASSET_ID);
  assert.equal(resolveSceneAsset('nope', 'nature-rock-small-red').id, 'nature-rock-small-red');
  assert.equal(resolveSceneAsset('nope', '  spaced  ').id, 'architecture-building-small-blue');
});

test('estimateSceneAssetBoundingRadius 覆盖各类图元', () => {
  closeTo(estimateSceneAssetBoundingRadius('props-cube-medium-blue'), Math.sqrt(0.75));
  closeTo(estimateSceneAssetBoundingRadius('nature-rock-medium-blue'), 1.375);
  closeTo(
    estimateSceneAssetBoundingRadius({
      parts: [
        {
          primitive: 'cylinder',
          radiusTop: 0.04,
          radiusBottom: 0.34,
          height: 1.05,
          position: { x: 0, y: 0.56, z: 0 },
        },
      ],
    }),
    0.525 * Math.sqrt(3),
  );
  closeTo(
    estimateSceneAssetBoundingRadius({
      parts: [{ primitive: 'torus', radius: 0.4, tube: 0.1, position: { x: 0, y: 0, z: 0 } }],
    }),
    0.5 * Math.sqrt(3),
  );
  closeTo(
    estimateSceneAssetBoundingRadius({
      parts: [
        {
          primitive: 'box',
          size: { x: 2, y: 1, z: 0.5 },
          position: { x: 1, y: 0, z: 0 },
        },
      ],
    }),
    Math.hypot(1, 0.5, 0.25),
  );
});

test('estimateSceneAssetBoundingRadius 对空零件与未知 id 取 0.5 下限', () => {
  assert.equal(estimateSceneAssetBoundingRadius('nope'), 0.5);
  assert.equal(estimateSceneAssetBoundingRadius({ parts: [] }), 0.5);
  assert.equal(estimateSceneAssetBoundingRadius({}), 0.5);
  assert.equal(estimateSceneAssetBoundingRadius({ parts: [{ primitive: 'sphere', radius: 0.1 }] }), 0.5);
});

test('searchSceneAssets 按分类过滤', () => {
  const props = searchSceneAssets({ category: 'props' });
  assert.equal(props.length, 75);
  assert.ok(props.every((asset) => asset.category === 'props'));
  assert.equal(searchSceneAssets({ category: 'PROPS ' }).length, 75);
  assert.deepEqual(searchSceneAssets({ category: 'unknown' }), []);
  assert.equal(searchSceneAssets({ category: 'all', limit: 9999 }).length, 360);
});

test('searchSceneAssets 关键词匹配 id、族、名称、分类与标签', () => {
  assert.equal(searchSceneAssets({ query: 'cube' }).length, 15);
  assert.equal(searchSceneAssets({ query: 'purple' }).length, 75);
  assert.equal(searchSceneAssets({ query: 'stage', limit: 9999 }).length, 90);
  assert.equal(searchSceneAssets({ query: 'cyclorama' }).length, 15);
  assert.deepEqual(
    searchSceneAssets({ query: 'DANCE-FLOOR' }).map((asset) => asset.familyId),
    Array.from({ length: 15 }, () => 'dance-floor'),
  );
  assert.deepEqual(searchSceneAssets({ query: 'zzz' }), []);
});

test('searchSceneAssets 支持分页与数量收敛', () => {
  const page = searchSceneAssets({ offset: 2, limit: 3 });
  assert.deepEqual(
    page.map((asset) => asset.id),
    [
      'architecture-building-small-green',
      'architecture-building-small-yellow',
      'architecture-building-small-purple',
    ],
  );
  assert.equal(searchSceneAssets({ limit: 0 }).length, 80);
  assert.equal(searchSceneAssets({ limit: 9999 }).length, 360);
  assert.equal(searchSceneAssets({ limit: -5 }).length, 1);
  assert.equal(searchSceneAssets({ offset: -3 }).length, 80);
  assert.equal(searchSceneAssets({ offset: 370 }).length, 5);
  assert.equal(searchSceneAssets({ offset: 10, limit: '2.9' }).length, 2);
  assert.deepEqual(searchSceneAssets({ offset: 400 }), []);
});
