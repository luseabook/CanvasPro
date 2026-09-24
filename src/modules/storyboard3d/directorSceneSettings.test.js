import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeDirectorSceneSettings } from './directorSceneSettings.js';

test('场景设置：空入参得到完整默认值', () => {
  assert.deepEqual(normalizeDirectorSceneSettings(), {
    screenshots: [],
    displayMode: 'solid',
    labels: false,
    groundVisible: true,
    groundHeight: 0,
    groundOpacity: 1,
    panorama: { enabled: false, assetId: '', radius: 100, rotation: [0, 0, 0], history: [] },
  });
  assert.deepEqual(normalizeDirectorSceneSettings(), normalizeDirectorSceneSettings({}));
});

test('场景设置：截图仅保留末 100 条且要求 assetId 为字符串', () => {
  const raw = [{ assetId: 7, name: '丢弃' }, { name: '无 id' }, null];
  for (let index = 0; index < 105; index += 1) raw.push({ assetId: 'a' + index, name: 'n' + index });
  const { screenshots } = normalizeDirectorSceneSettings({ screenshots: raw });
  assert.equal(screenshots.length, 100);
  assert.equal(screenshots[0].assetId, 'a5');
  assert.equal(screenshots.at(-1).assetId, 'a104');
  assert.ok(!screenshots.some((item) => item.assetId === 7));
  assert.deepEqual(normalizeDirectorSceneSettings({ screenshots: 'x' }).screenshots, []);
});

test('场景设置：截图字段的默认值与范围夹取', () => {
  const [shot] = normalizeDirectorSceneSettings({
    screenshots: [{ assetId: 'a', name: '', shotId: undefined, time: 9999, width: 0, height: 'abc' }],
  }).screenshots;
  assert.deepEqual(shot, { assetId: 'a', name: '镜头截图', shotId: '', time: 3600, width: 1, height: 1080 });
  const [clamped] = normalizeDirectorSceneSettings({
    screenshots: [{ assetId: 'a', time: -5, width: 99999, height: 99999 }],
  }).screenshots;
  assert.equal(clamped.time, 0);
  assert.equal(clamped.width, 16384);
  assert.equal(clamped.height, 16384);
  const [longName] = normalizeDirectorSceneSettings({
    screenshots: [{ assetId: 'a', name: 'x'.repeat(200) }],
  }).screenshots;
  assert.equal(longName.name.length, 120);
});

test('场景设置：显示模式白名单与布尔字段的严格判定', () => {
  for (const mode of ['solid', 'transparent', 'clay'])
    assert.equal(normalizeDirectorSceneSettings({ displayMode: mode }).displayMode, mode);
  for (const mode of ['wireframe', '', null, 0])
    assert.equal(normalizeDirectorSceneSettings({ displayMode: mode }).displayMode, 'solid');
  assert.equal(normalizeDirectorSceneSettings({ labels: true }).labels, true);
  assert.equal(normalizeDirectorSceneSettings({ labels: 'true' }).labels, false);
  assert.equal(normalizeDirectorSceneSettings({ groundVisible: false }).groundVisible, false);
  assert.equal(normalizeDirectorSceneSettings({ groundVisible: 0 }).groundVisible, true);
  assert.equal(normalizeDirectorSceneSettings({ groundVisible: null }).groundVisible, true);
});

test('场景设置：地面高度与不透明度按范围夹取且非有限值回落默认', () => {
  assert.equal(normalizeDirectorSceneSettings({ groundHeight: 1000 }).groundHeight, 1000);
  assert.equal(normalizeDirectorSceneSettings({ groundHeight: -1001 }).groundHeight, -1000);
  assert.equal(normalizeDirectorSceneSettings({ groundHeight: 'x' }).groundHeight, 0);
  assert.equal(normalizeDirectorSceneSettings({ groundOpacity: -1 }).groundOpacity, 0);
  assert.equal(normalizeDirectorSceneSettings({ groundOpacity: 2 }).groundOpacity, 1);
  assert.equal(normalizeDirectorSceneSettings({ groundOpacity: 'x' }).groundOpacity, 1);
});

test('场景设置：全景默认值与字段夹取', () => {
  assert.deepEqual(normalizeDirectorSceneSettings({ panorama: { enabled: true, assetId: 9 } }).panorama, {
    enabled: true,
    assetId: '9',
    radius: 100,
    rotation: [0, 0, 0],
    history: [],
  });
  const tightened = normalizeDirectorSceneSettings({
    panorama: { enabled: 'yes', radius: 9999, rotation: [99, -99, 'x'] },
  }).panorama;
  assert.equal(tightened.enabled, false);
  assert.equal(tightened.radius, 2000);
  assert.equal(tightened.rotation[0], Math.PI * 2);
  assert.equal(tightened.rotation[1], -Math.PI * 2);
  assert.equal(tightened.rotation[2], 0);
  assert.equal(normalizeDirectorSceneSettings({ panorama: { radius: 1 } }).panorama.radius, 5);
});

test('场景设置：全景历史仅保留末 50 条并套用同名规则', () => {
  const history = [{ assetId: null, name: '丢弃' }];
  for (let index = 0; index < 55; index += 1) history.push({ assetId: 'h' + index, name: 'n' + index });
  const { panorama } = normalizeDirectorSceneSettings({ panorama: { history } });
  assert.equal(panorama.history.length, 50);
  assert.equal(panorama.history[0].assetId, 'h5');
  assert.equal(panorama.history[0].name, 'n5');
  assert.equal(panorama.history.at(-1).assetId, 'h54');
  const [item] = normalizeDirectorSceneSettings({
    panorama: { history: [{ assetId: 'h', name: '' }] },
  }).panorama.history;
  assert.equal(item.name, '全景图');
  assert.deepEqual(normalizeDirectorSceneSettings({ panorama: { history: 'x' } }).panorama.history, []);
});

test('场景设置：panorama 非对象时退回默认全景', () => {
  for (const panorama of ['x', 5, [], true])
    assert.deepEqual(normalizeDirectorSceneSettings({ panorama }).panorama, {
      enabled: false,
      assetId: '',
      radius: 100,
      rotation: [0, 0, 0],
      history: [],
    });
});
