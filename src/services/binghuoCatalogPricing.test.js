import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withoutBinghuoCatalogPrices } from './binghuoCatalogPricing.js';

const strip = (displayName) =>
  withoutBinghuoCatalogPrices({ models: [{ displayName }] }).models[0].displayName;

test('价格后缀整形剥离：可选货币符、小数、半/全角斜杠、允许空格', () => {
  assert.equal(strip('模型 2元/张'), '模型');
  assert.equal(strip('模型 ¥ 2元/张'), '模型');
  assert.equal(strip('模型 ￥3元／秒'), '模型');
  assert.equal(strip('模型 12.5元/张'), '模型');
  assert.equal(strip('模型 3 元 / 张'), '模型');
  assert.equal(strip('模型 2元/百万token'), '模型');
});

test('不匹配即原样返回：缺前导空格、价格不在末尾、无数字', () => {
  assert.equal(strip('模型2元/张'), '模型2元/张', '\\s+ 至少一个空白');
  assert.equal(strip('模型￥3元／秒'), '模型￥3元／秒', '货币符紧贴无空格时整条不匹配');
  assert.equal(strip('模型 2元/张 起'), '模型 2元/张 起', '锚定结尾');
  assert.equal(strip('模型 元/张'), '模型 元/张');
  assert.equal(strip(''), '');
  assert.equal(strip(undefined), '', '非字符串经 String(x||"") 变空串');
  assert.equal(strip(null), '');
  assert.equal(strip(0), '', 'String(0||"") ⇒ 假值数字变空串');
});

test('只剥一层末尾价格，前面的价格保留', () => {
  assert.equal(strip('A 1元/张 B 2元/张'), 'A 1元/张 B');
});

test('顶层非 models 键整体浅拷贝保留', () => {
  const out = withoutBinghuoCatalogPrices({ vendor: 'binghuo', models: [{ displayName: 'M 5元/次' }] });
  assert.equal(out.vendor, 'binghuo');
  assert.equal(out.models[0].displayName, 'M');
});

test('缺 models 直接 TypeError：实现无空值保护', () => {
  assert.throws(() => withoutBinghuoCatalogPrices({}), TypeError);
  assert.throws(() => withoutBinghuoCatalogPrices({ models: null }), TypeError);
});

test('imageMenu / videoMenu 去 priceText 并洗 title / label，其它键原样', () => {
  const [model] = withoutBinghuoCatalogPrices({
    models: [
      {
        id: 'm1',
        displayName: 'M 2元/张',
        extensions: {
          imageMenu: { title: '出图 2元/张', label: '标准 3元/张', priceText: '2元/张', ratio: '1:1' },
          videoMenu: { label: '视频 4元/秒', priceText: '4元/秒' },
          otherMenu: { priceText: '不动我', title: '也不动我 2元/张' },
        },
      },
    ],
  }).models;
  assert.deepEqual(model.extensions.imageMenu, { title: '出图', label: '标准', ratio: '1:1' });
  assert.deepEqual(model.extensions.videoMenu, { label: '视频' });
  assert.deepEqual(
    model.extensions.otherMenu,
    { priceText: '不动我', title: '也不动我 2元/张' },
    '白名单外的菜单键完全不处理',
  );
  assert.equal(model.id, 'm1');
});

test('extensions 真值判定：falsy 时不写覆盖键，但原始键值被外层展开带出', () => {
  const [absent] = withoutBinghuoCatalogPrices({ models: [{ displayName: 'A', extensions: null }] }).models;
  assert.equal('extensions' in absent, true, '条件省略的只是覆盖项，非删除');
  assert.equal(absent.extensions, null);
  const [stripped] = withoutBinghuoCatalogPrices({
    models: [{ displayName: 'D 2元/张', extensions: undefined }],
  }).models;
  assert.equal('extensions' in stripped, true, '显式 undefined 仍是自有键，会被外层展开带出');
  assert.equal(stripped.extensions, undefined);
  assert.deepEqual(Object.keys(stripped), ['displayName', 'extensions']);
  const [omitted] = withoutBinghuoCatalogPrices({ models: [{ displayName: 'D' }] }).models;
  assert.equal('extensions' in omitted, false, '源对象没有该键时结果也不会有');
  assert.deepEqual(Object.keys(omitted), ['displayName']);
  const [empty] = withoutBinghuoCatalogPrices({ models: [{ displayName: 'A', extensions: {} }] }).models;
  assert.deepEqual(empty.extensions, {});
  const [none] = withoutBinghuoCatalogPrices({ models: [{ id: 'x' }] }).models;
  assert.equal(none.displayName, '', '缺 displayName 时被补成空串');
  assert.deepEqual(Object.keys(none), ['id', 'displayName']);
});

test('title / label 只在键存在时改写，且值是对象也不会崩（String 化）', () => {
  const [a] = withoutBinghuoCatalogPrices({
    models: [{ displayName: 'A', extensions: { imageMenu: { title: 12 } } }],
  }).models;
  assert.deepEqual(a.extensions.imageMenu, { title: '12' });
  const [b] = withoutBinghuoCatalogPrices({
    models: [{ displayName: 'A', extensions: { imageMenu: { priceText: 'x' } } }],
  }).models;
  assert.deepEqual(b.extensions.imageMenu, {}, '只有 priceText 时菜单被清空成 {}');
});

test('输入对象未被就地改写，但内层对象是浅共享', () => {
  const menu = { title: 'T 2元/张', priceText: '2元/张' };
  const input = { models: [{ displayName: 'D 2元/张', extensions: { imageMenu: menu } }] };
  withoutBinghuoCatalogPrices(input);
  assert.deepEqual(input.models[0].extensions.imageMenu, menu, '原菜单对象保持完好');
  assert.equal(input.models[0].displayName, 'D 2元/张');
});
