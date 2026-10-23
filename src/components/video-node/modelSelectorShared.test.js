import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _modelSelectorSharedInternalsForTest,
  buildVideoModelMenuHTML,
} from './modelSelectorShared.js';

const {
  compareOfficialVideoMenuModels,
  buildDreaminaVideoMenuGroups,
  OFFICIAL_VIDEO_MENU_PREFIXES,
} = _modelSelectorSharedInternalsForTest;

const model = (displayName, extra = {}) => ({
  modelId: displayName,
  provider: 'aicanvas',
  displayName: displayName,
  extensions: { videoMenu: {} },
  ...extra,
});

test('modelSelectorShared: 官方视频模型先按推荐位次排', () => {
  const models = [
    model('普通模型', { extensions: { videoMenu: { recommendationRank: 3 } } }),
    model('官方热推 A', { extensions: { videoMenu: { recommendationRank: 1 } } }),
    model('正价 B', { extensions: { videoMenu: { recommendationRank: 2 } } }),
  ];
  assert.deepEqual(
    models.sort(compareOfficialVideoMenuModels).map((entry) => entry.displayName),
    ['官方热推 A', '正价 B', '普通模型'],
    '位次是后台下发的排序意图，要压过名字前缀'
  );
});

test('modelSelectorShared: 同一位次时按官方档位，未命中档位的排最后', () => {
  const names = ['白名单 D', '官转 C', '官推 B', '正价 A', '官方热推 Z', '随便一个'];
  const models = names.map((name) => model(name));
  assert.deepEqual(
    models.sort(compareOfficialVideoMenuModels).map((entry) => entry.displayName),
    ['官方热推 Z', '正价 A', '官推 B', '官转 C', '白名单 D', '随便一个'],
    '档位顺序必须与 OFFICIAL_VIDEO_MENU_PREFIXES 一致'
  );
  assert.deepEqual(OFFICIAL_VIDEO_MENU_PREFIXES, ['官方热推', '正价', '官推', '官转', '白名单']);
});

test('modelSelectorShared: 即梦分组只收 dreamina，且带上品牌图标', () => {
  assert.deepEqual(buildDreaminaVideoMenuGroups([]), [], '没有即梦模型就不出分组');
  assert.deepEqual(
    buildDreaminaVideoMenuGroups([model('其它', { provider: 'volcengine' })]),
    [],
    '别的 provider 不能混进即梦分组'
  );
  const groups = buildDreaminaVideoMenuGroups([
    model('即梦 Seedance', { provider: 'dreamina', modelId: 'dreamina/seedance' }),
    model('即梦 Seaweed', { provider: 'dreamina', modelId: 'dreamina/seaweed' }),
  ]);
  assert.equal(groups.length, 1);
  const [group] = groups;
  assert.equal(group.id, 'dreamina-canvas-video');
  assert.equal(group.label, '即梦官方');
  assert.deepEqual(
    group.items.map((item) => [item.modelId, item.provider, item.label]),
    [
      ['dreamina/seedance', 'dreamina', '即梦 Seedance'],
      ['dreamina/seaweed', 'dreamina', '即梦 Seaweed'],
    ]
  );
  assert.match(String(group.iconHtml), /svg|<img/, '分组图标不能为空');
});

test('modelSelectorShared: 官方目录菜单带 data-official-model-catalog 标记', () => {
  const html = buildVideoModelMenuHTML({});
  assert.match(html, /data-node-menu-kind="video"/);
  assert.match(
    html,
    /data-official-model-catalog/,
    '缺这个标记，样式与埋点会把官方目录当成普通菜单'
  );
});
