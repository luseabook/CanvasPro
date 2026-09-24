import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT,
  selectRelevantStoryboard3DAssets,
} from './assetCatalogSelection.js';

function filler(count, prefix = 'f') {
  return Array.from({ length: count }, (_value, index) => ({
    id: `${prefix}${index}`,
    name: `普通素材${index}`,
    tags: ['杂项'],
  }));
}

test('素材选择：候选上限常量为 100', () => {
  assert.equal(STORYBOARD_3D_AI_ASSET_CANDIDATE_LIMIT, 100);
});

test('素材选择：条目不足上限时保持原始顺序', () => {
  const assets = [
    { id: 'a', name: '甲', tags: [] },
    { id: 'b', name: '乙', tags: [] },
    { id: 'c', name: '丙', tags: [] },
  ];
  assert.deepEqual(
    selectRelevantStoryboard3DAssets(assets, '无关').map((asset) => asset.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(selectRelevantStoryboard3DAssets(assets, '无关', { limit: 1 }).length, 3);
});

test('素材选择：上限夹紧在 20 至 120 之间', () => {
  const assets = filler(200);
  assert.equal(selectRelevantStoryboard3DAssets(assets, '', { limit: 1 }).length, 20);
  assert.equal(selectRelevantStoryboard3DAssets(assets, '', { limit: 1000 }).length, 120);
  assert.equal(selectRelevantStoryboard3DAssets(assets, '', { limit: 25 }).length, 25);
  assert.equal(selectRelevantStoryboard3DAssets(assets, '', { limit: 0 }).length, 100);
  assert.equal(selectRelevantStoryboard3DAssets(assets, '', { limit: 'abc' }).length, 100);
  assert.equal(selectRelevantStoryboard3DAssets(assets, '').length, 100);
});

test('素材选择：按标识去重并丢弃缺失标识的条目', () => {
  const assets = [
    { id: 'dup', name: '第一次', tags: [] },
    { id: 'dup', name: '第二次', tags: [] },
    { id: 'keep', name: '保留', tags: [] },
    { name: '无标识', tags: [] },
  ];
  const selected = selectRelevantStoryboard3DAssets(assets, '');
  assert.deepEqual(
    selected.map((asset) => asset.name),
    ['第一次', '保留'],
  );
});

test('素材选择：支持仅声明 familyId 的条目', () => {
  const assets = [{ familyId: 'fam-1', name: '家族素材' }, { name: '无标识' }];
  const selected = selectRelevantStoryboard3DAssets(assets, '');
  assert.equal(selected.length, 1);
  assert.equal(selected[0].familyId, 'fam-1');
});

test('素材选择：命中名称的条目排在最前', () => {
  const assets = [{ id: 'target', name: '红苹果', tags: ['水果'] }, ...filler(30)];
  const selected = selectRelevantStoryboard3DAssets(assets, '红苹果', { limit: 20 });
  assert.equal(selected.length, 20);
  assert.equal(selected[0].id, 'target');
  assert.equal(selected[1].id, 'f0');
});

test('素材选择：标签命中进入正向评分', () => {
  const assets = [{ id: 'tagged', name: '普通物件', tags: ['城市'] }, ...filler(30)];
  const selected = selectRelevantStoryboard3DAssets(assets, '城市', { limit: 20 });
  assert.equal(selected[0].id, 'tagged');
});

test('素材选择：零分回落条目按分类轮流穿插', () => {
  const assets = [
    ...Array.from({ length: 10 }, (_value, index) => ({
      id: `a${index}`,
      name: `甲${index}`,
      category: '组A',
    })),
    ...Array.from({ length: 15 }, (_value, index) => ({
      id: `b${index}`,
      name: `乙${index}`,
      category: '组B',
    })),
  ];
  const selected = selectRelevantStoryboard3DAssets(assets, '', { limit: 20 });
  assert.equal(selected.length, 20);
  assert.deepEqual(
    selected.slice(0, 4).map((asset) => asset.id),
    ['b0', 'a0', 'b1', 'a1'],
  );
});

test('素材选择：无分类时回落到来源包标识', () => {
  const assets = [
    { id: 'packed', name: '甲', source: { packId: '包一' } },
    { id: 'plain', name: '乙' },
  ];
  const selected = selectRelevantStoryboard3DAssets(assets, '');
  assert.equal(selected.length, 2);
});

test('素材选择：入参非法时安全返回空列表', () => {
  assert.deepEqual(selectRelevantStoryboard3DAssets(null, ''), []);
  assert.deepEqual(selectRelevantStoryboard3DAssets(undefined, ''), []);
  assert.deepEqual(selectRelevantStoryboard3DAssets([{ name: '无标识' }], ''), []);
});
