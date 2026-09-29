import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  upsertImageAssetPackage,
  upsertMediaAssetPackage,
} from './assetPackageMedia.js';

function createId(prefix) {
  return prefix + '-fixed';
}

const image = { imageUrl: 'http://cdn/a.png', imageWidth: 1024, imageHeight: 768 };
const audio = { audioUrl: 'http://cdn/a.mp3' };

test('assetPackageMedia: 缺少素材包标识、名称或素材标识/名称时抛错', () => {
  const exits = [
    [undefined, { packageName: '包', itemKey: 'k', itemName: '项', image }, '加入素材包失败：缺少素材包标识。'],
    [{}, { packageKey: 'p', packageName: '', itemKey: 'k', itemName: '项', image }, '加入素材包失败：缺少素材包名称。'],
    [{}, { packageKey: 'p', packageName: '包', itemKey: '  ', itemName: '项', image }, '加入素材包失败：缺少素材标识。'],
    [{}, { packageKey: 'p', packageName: '包', itemKey: 'k', itemName: '', image }, '加入素材包失败：缺少素材名称。'],
  ];
  for (const [pkg, options, message] of exits) {
    assert.throws(() => upsertImageAssetPackage(pkg, options, { createId }), { message });
  }
});

test('assetPackageMedia: 图片没有可用地址时抛错', () => {
  assert.throws(
    () =>
      upsertImageAssetPackage(
        null,
        { packageKey: 'p', packageName: '包', itemKey: 'k', itemName: '项', image: {} },
        { createId },
      ),
    { message: '加入素材包失败：图片缺少可用地址。' },
  );
});

test('assetPackageMedia: 首次加入图片会建包并把节点与条目一起落盘', () => {
  const result = upsertImageAssetPackage(
    null,
    { packageKey: 'p', packageName: '人物包', category: 'character', itemKey: 'k1', itemName: '阿一', image },
    { createId },
  );
  assert.equal(result.packageCreated, true);
  assert.equal(result.itemCreated, true);
  assert.equal(result.itemIndex, 0);
  assert.equal(result.asset.id, 'asset-fixed');
  assert.equal(result.asset.name, '人物包');
  assert.equal(result.asset.category, 'character');
  assert.equal(result.asset.packageKey, 'p');
  assert.equal(result.asset.coverUrl, 'http://cdn/a.png');
  assert.equal(result.asset.coverType, 'source-image');
  assert.equal(result.asset.items.length, 1);
  assert.equal(result.asset.edges.length, 0);
  assert.equal(result.item.packageItemKey, 'k1');
  assert.equal(result.item.name, '阿一');
  assert.equal(result.item.thumbSrc, 'http://cdn/a.png');
  assert.equal(result.item.type, 'source-image');
  const node = result.asset.nodes[0];
  assert.equal(node.id, 'source-image-fixed');
  assert.equal(node.type, 'source-image');
  assert.equal(node.name, '阿一');
  assert.equal(node.src, 'http://cdn/a.png');
  assert.equal(node.imageUrl, 'http://cdn/a.png');
  assert.equal(node.assetPackageItemKey, 'k1');
  assert.equal(node.needsAutoResize, false);
  assert.equal(node.fixedSize, false);
  assert.ok(node.width > 0 && node.height > 0);
  assert.equal(node.x, 0);
  assert.equal(node.y, 0);
});

test('assetPackageMedia: 同 itemKey 再加入是原地更新，不新增条目也不新建包', () => {
  const first = upsertImageAssetPackage(
    null,
    { packageKey: 'p', packageName: '包', itemKey: 'k1', itemName: '旧名', image },
    { createId },
  );
  const created = first.asset.nodes[0].id;
  const second = upsertImageAssetPackage(
    first.asset,
    {
      packageKey: 'p',
      packageName: '包',
      itemKey: 'k1',
      itemName: '新名',
      image: { imageUrl: 'http://cdn/b.png', imageWidth: 800, imageHeight: 800 },
    },
    { createId },
  );
  assert.equal(second.packageCreated, false);
  assert.equal(second.itemCreated, false);
  assert.equal(second.itemIndex, 0);
  assert.equal(second.asset.items.length, 1);
  assert.equal(second.asset.nodes.length, 1);
  assert.equal(second.asset.id, 'asset-fixed');
  assert.equal(second.asset.nodes[0].id, created, '既有节点 id 必须保留');
  assert.equal(second.asset.nodes[0].name, '新名');
  assert.equal(second.asset.nodes[0].src, 'http://cdn/b.png');
  assert.equal(first.asset.items.length, 1, '入参包对象不可被就地改动');
});

test('assetPackageMedia: 新条目按 4 列网格排布，第五个换行', () => {
  let pkg = null;
  for (let index = 0; index < 5; index += 1) {
    pkg = upsertImageAssetPackage(
      pkg,
      { packageKey: 'p', packageName: '包', itemKey: 'k' + index, itemName: '项' + index, image },
      { createId },
    ).asset;
  }
  assert.equal(pkg.items.length, 5);
  assert.deepEqual(
    [pkg.nodes[0].x, pkg.nodes[0].y, pkg.nodes[3].x, pkg.nodes[3].y, pkg.nodes[4].x, pkg.nodes[4].y],
    [0, 0, 3 * 0x228, 0, 0, 0x148],
  );
});

test('assetPackageMedia: 有 audio 时走音频节点分支', () => {
  const result = upsertMediaAssetPackage(
    null,
    { packageKey: 'p', packageName: '声音包', itemKey: 'a1', itemName: '环境声', audio },
    { createId },
  );
  assert.equal(result.item.type, 'source-audio');
  assert.equal(result.asset.coverType, 'source-audio');
  const node = result.asset.nodes[0];
  assert.equal(node.type, 'source-audio');
  assert.equal(node.id, 'source-audio-fixed');
  assert.equal(node.audioUrl, 'http://cdn/a.mp3');
  assert.equal(node.src, 'http://cdn/a.mp3');
  assert.equal(node.width, 0x140);
  assert.equal(node.height, 0x8c);
});

test('assetPackageMedia: 音频没有可用地址时抛错', () => {
  assert.throws(
    () =>
      upsertMediaAssetPackage(
        null,
        { packageKey: 'p', packageName: '包', itemKey: 'a1', itemName: '声', audio: {} },
        { createId },
      ),
    { message: '加入素材包失败：音频缺少可用地址。' },
  );
});

test('assetPackageMedia: itemMetadata 与 packageMetadata 会被合并进去', () => {
  const result = upsertImageAssetPackage(
    null,
    {
      packageKey: 'p',
      packageName: '包',
      itemKey: 'k1',
      itemName: '项',
      image,
      metadata: { 来源: '第一批' },
      itemMetadata: { 备注: '手工挑的' },
    },
    { createId },
  );
  assert.deepEqual(result.asset.packageMetadata, { 来源: '第一批' });
  assert.equal(result.asset.nodes[0].备注, '手工挑的');
  assert.equal(result.asset.nodes[0].assetPackageItemKey, 'k1');
});
