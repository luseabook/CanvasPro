import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
  STORYBOARD_3D_NAVIGATION_PRESETS,
  STORYBOARD_3D_NAVIGATION_STORAGE_KEY,
  STORYBOARD_3D_NAVIGATION_TOOLS,
  createStoryboard3DNavigationPresetSettings,
  getStoryboard3DToolShortcut,
  loadStoryboard3DNavigationSettings,
  normalizeStoryboard3DNavigationSettings,
  resolveStoryboard3DToolFromShortcut,
  saveStoryboard3DNavigationSettings,
} from './viewportNavigationSettings.js';

const storage = (initial = null) => {
  const calls = [];
  return {
    calls,
    getItem: (key) => {
      calls.push(['getItem', key]);
      return typeof initial === 'function' ? initial() : initial;
    },
    setItem: (key, value) => calls.push(['setItem', key, value]),
  };
};

test('导航常量：存储键、四套预设与工具清单', () => {
  assert.equal(STORYBOARD_3D_NAVIGATION_STORAGE_KEY, 'aiCanvas.storyboard3d.navigation.v1');
  assert.equal(DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET, 'unity');
  assert.deepEqual(STORYBOARD_3D_NAVIGATION_TOOLS, ['select', 'move', 'rotate', 'scale']);
  assert.deepEqual(Object.keys(STORYBOARD_3D_NAVIGATION_PRESETS), ['unity', 'blender', 'c4d', 'maya']);
  for (const preset of Object.values(STORYBOARD_3D_NAVIGATION_PRESETS)) {
    assert.ok(Object.isFrozen(preset));
    assert.deepEqual(Object.keys(preset.toolShortcuts), ['select', 'move', 'rotate', 'scale']);
  }
  assert.deepEqual(STORYBOARD_3D_NAVIGATION_PRESETS.c4d.defaults, {
    orbitSensitivity: 0.9,
    panSensitivity: 1,
    zoomSensitivity: 0.9,
  });
});

test('导航快捷键：按预设查表并对未知预设回落到 unity', () => {
  assert.equal(getStoryboard3DToolShortcut(), 'Q');
  assert.equal(getStoryboard3DToolShortcut('unity', 'rotate'), 'E');
  assert.equal(getStoryboard3DToolShortcut('blender', 'select'), 'W');
  assert.equal(getStoryboard3DToolShortcut('c4d', 'select'), '0');
  assert.equal(getStoryboard3DToolShortcut('maya', 'scale'), 'R');
  assert.equal(getStoryboard3DToolShortcut('blender', 'fly'), '');
  assert.equal(getStoryboard3DToolShortcut('maya', 'scale'), 'R');
  assert.equal(getStoryboard3DToolShortcut('unknown', 'select'), 'Q');
});

test('导航快捷键：反查工具忽略大小写与空白，未知按键为 null', () => {
  assert.equal(resolveStoryboard3DToolFromShortcut('q'), 'select');
  assert.equal(resolveStoryboard3DToolFromShortcut('  W  '), 'move');
  assert.equal(resolveStoryboard3DToolFromShortcut('E'), 'rotate');
  assert.equal(resolveStoryboard3DToolFromShortcut('r'), 'scale');
  assert.equal(resolveStoryboard3DToolFromShortcut('g', 'blender'), 'move');
  assert.equal(resolveStoryboard3DToolFromShortcut('w', 'blender'), 'select');
  assert.equal(resolveStoryboard3DToolFromShortcut('0', 'c4d'), 'select');
  assert.equal(resolveStoryboard3DToolFromShortcut('t', 'c4d'), 'scale');
  assert.equal(resolveStoryboard3DToolFromShortcut('q', 'c4d'), null);
  assert.equal(resolveStoryboard3DToolFromShortcut('w', 'unknown'), 'move');
  assert.equal(resolveStoryboard3DToolFromShortcut('z'), null);
  assert.equal(resolveStoryboard3DToolFromShortcut(''), null);
  assert.equal(resolveStoryboard3DToolFromShortcut(undefined), null);
});

test('导航设置：默认值、未知预设回落与灵敏度夹取', () => {
  assert.deepEqual(normalizeStoryboard3DNavigationSettings(), {
    preset: 'unity',
    orbitSensitivity: 1,
    panSensitivity: 1,
    zoomSensitivity: 1,
    invertOrbitX: false,
    invertOrbitY: false,
    invertWheel: false,
  });
  assert.equal(normalizeStoryboard3DNavigationSettings({ preset: 'nope' }).preset, 'unity');
  assert.equal(normalizeStoryboard3DNavigationSettings({ preset: 'blender' }).preset, 'blender');
  assert.equal(normalizeStoryboard3DNavigationSettings({ orbitSensitivity: 0.1 }).orbitSensitivity, 0.2);
  assert.equal(normalizeStoryboard3DNavigationSettings({ orbitSensitivity: 9 }).orbitSensitivity, 3);
  assert.equal(normalizeStoryboard3DNavigationSettings({ panSensitivity: 2.5 }).panSensitivity, 2.5);
  assert.equal(normalizeStoryboard3DNavigationSettings({ zoomSensitivity: 'x' }).zoomSensitivity, 1);
});

test('导航设置：预设自带灵敏度缺省值参与回落', () => {
  assert.deepEqual(normalizeStoryboard3DNavigationSettings({ preset: 'c4d' }), {
    preset: 'c4d',
    orbitSensitivity: 0.9,
    panSensitivity: 1,
    zoomSensitivity: 0.9,
    invertOrbitX: false,
    invertOrbitY: false,
    invertWheel: false,
  });
  assert.equal(
    normalizeStoryboard3DNavigationSettings({ preset: 'c4d', orbitSensitivity: '' }).orbitSensitivity,
    0.2,
  );
  assert.equal(
    normalizeStoryboard3DNavigationSettings({ preset: 'c4d', orbitSensitivity: 0 }).orbitSensitivity,
    0.2,
  );
  assert.equal(
    normalizeStoryboard3DNavigationSettings({ preset: 'c4d', orbitSensitivity: NaN }).orbitSensitivity,
    0.9,
  );
});

test('导航设置：反转开关只认严格 true', () => {
  const normalized = normalizeStoryboard3DNavigationSettings({
    invertOrbitX: true,
    invertOrbitY: 1,
    invertWheel: 'true',
  });
  assert.equal(normalized.invertOrbitX, true);
  assert.equal(normalized.invertOrbitY, false);
  assert.equal(normalized.invertWheel, false);
});

test('导航设置：按预设名生成一份默认设置', () => {
  assert.deepEqual(createStoryboard3DNavigationPresetSettings('maya'), {
    preset: 'maya',
    orbitSensitivity: 1,
    panSensitivity: 1,
    zoomSensitivity: 1,
    invertOrbitX: false,
    invertOrbitY: false,
    invertWheel: false,
  });
  assert.equal(createStoryboard3DNavigationPresetSettings('nope').preset, 'unity');
});

test('导航设置：读取本地存储并在异常时回落默认', () => {
  const store = storage(JSON.stringify({ preset: 'blender', invertOrbitX: true, zoomSensitivity: 99 }));
  const loaded = loadStoryboard3DNavigationSettings(store);
  assert.equal(loaded.preset, 'blender');
  assert.equal(loaded.zoomSensitivity, 3);
  assert.equal(loaded.invertOrbitX, true);
  assert.deepEqual(store.calls, [['getItem', STORYBOARD_3D_NAVIGATION_STORAGE_KEY]]);

  assert.equal(loadStoryboard3DNavigationSettings(storage(null)).preset, 'unity');
  assert.equal(loadStoryboard3DNavigationSettings(storage('not-json')).preset, 'unity');
  assert.equal(loadStoryboard3DNavigationSettings(storage('"text"')).preset, 'unity');
  assert.equal(
    loadStoryboard3DNavigationSettings(
      storage(() => {
        throw new Error('blocked');
      }),
    ).preset,
    'unity',
  );
  assert.equal(loadStoryboard3DNavigationSettings(undefined).preset, 'unity');
  assert.equal(loadStoryboard3DNavigationSettings().preset, 'unity');
});

test('导航设置：保存前归一化并写入序列化结果，写入异常被吞掉', () => {
  const store = storage();
  const saved = saveStoryboard3DNavigationSettings({ preset: 'c4d', panSensitivity: 5 }, store);
  assert.equal(saved.preset, 'c4d');
  assert.equal(saved.panSensitivity, 3);
  assert.deepEqual(store.calls, [['setItem', STORYBOARD_3D_NAVIGATION_STORAGE_KEY, JSON.stringify(saved)]]);
  const failing = {
    setItem: () => {
      throw new Error('quota');
    },
  };
  assert.equal(saveStoryboard3DNavigationSettings({ preset: 'maya' }, failing).preset, 'maya');
  assert.equal(saveStoryboard3DNavigationSettings({ preset: 'maya' }).preset, 'maya');
});
