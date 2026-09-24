import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_NAVIGATION_MODE,
  getStoryboard3DNavigationHelpText,
  resolveStoryboard3DNavigationMode,
  resolveStoryboard3DNavigationTool,
} from './viewportNavigationProtocol.js';
import {
  DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET,
  STORYBOARD_3D_NAVIGATION_PRESETS,
} from './viewportNavigationSettings.js';

test('导航协议：模式表冻结且复用默认预设', () => {
  assert.ok(Object.isFrozen(STORYBOARD_3D_NAVIGATION_MODE));
  assert.deepEqual(STORYBOARD_3D_NAVIGATION_MODE, {
    ORBIT: 'orbit',
    PAN: 'pan',
    DOLLY: 'dolly',
    FLY_LOOK: 'fly-look',
  });
  assert.equal(DEFAULT_STORYBOARD_3D_NAVIGATION_PRESET, 'unity');
});

test('导航协议：Blender 只用中键，修饰键区分环绕/平移/缩放', () => {
  const blender = { preset: 'blender' };
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1, ctrlKey: true }, blender),
    STORYBOARD_3D_NAVIGATION_MODE.DOLLY,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1, metaKey: true }, blender),
    STORYBOARD_3D_NAVIGATION_MODE.DOLLY,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1, shiftKey: true }, blender),
    STORYBOARD_3D_NAVIGATION_MODE.PAN,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1 }, blender),
    STORYBOARD_3D_NAVIGATION_MODE.ORBIT,
  );
  assert.equal(resolveStoryboard3DNavigationMode({ button: 0, shiftKey: true }, blender), null);
  assert.equal(resolveStoryboard3DNavigationMode({ button: 2, ctrlKey: true }, blender), null);
});

test('导航协议：Blender 的 Ctrl 优先于 Shift（dolly 压过 pan）', () => {
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1, ctrlKey: true, shiftKey: true }, { preset: 'blender' }),
    STORYBOARD_3D_NAVIGATION_MODE.DOLLY,
  );
});

test('导航协议：Unity 中键平移、Alt 组合环绕与缩放', () => {
  assert.equal(resolveStoryboard3DNavigationMode({ button: 1 }, {}), STORYBOARD_3D_NAVIGATION_MODE.PAN);
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 0, altKey: true }, {}),
    STORYBOARD_3D_NAVIGATION_MODE.ORBIT,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 2, altKey: true }, {}),
    STORYBOARD_3D_NAVIGATION_MODE.DOLLY,
  );
  assert.equal(resolveStoryboard3DNavigationMode({ button: 0 }, {}), null);
  // 第二参缺省时预设回落 unity，故 Alt+右键仍为 dolly。
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 2, altKey: true, preset: 'maya' }, {}),
    STORYBOARD_3D_NAVIGATION_MODE.DOLLY,
  );
});

test('导航协议：Maya/C4D 与回落的 Unity 都要求 Alt', () => {
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 0, altKey: true }, { preset: 'c4d' }),
    STORYBOARD_3D_NAVIGATION_MODE.ORBIT,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 2, altKey: true, preset: 'c4d' }, {}),
    STORYBOARD_3D_NAVIGATION_MODE.DOLLY,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1, altKey: true }, { preset: 'maya' }),
    STORYBOARD_3D_NAVIGATION_MODE.PAN,
  );
  assert.equal(resolveStoryboard3DNavigationMode({ button: 0 }, { preset: 'maya' }), null);
  // 未知预设回落 unity（button 1 无需 Alt 即为平移）。
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1 }, { preset: 'unknown-preset' }),
    STORYBOARD_3D_NAVIGATION_MODE.PAN,
  );
  assert.equal(resolveStoryboard3DNavigationMode({ button: 9 }, { preset: 'unknown-preset' }), null);
});

test('导航协议：飞行模式下右键优先观察', () => {
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 2 }, { flyMode: true }),
    STORYBOARD_3D_NAVIGATION_MODE.FLY_LOOK,
  );
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 2, altKey: true }, { flyMode: true }),
    STORYBOARD_3D_NAVIGATION_MODE.FLY_LOOK,
  );
  // 飞行模式只劫持右键，其余仍走预设分支。
  assert.equal(
    resolveStoryboard3DNavigationMode({ button: 1 }, { flyMode: true }),
    STORYBOARD_3D_NAVIGATION_MODE.PAN,
  );
});

test('导航协议：空参数不抛错，null 入参按属性访问失败上抛', () => {
  assert.equal(resolveStoryboard3DNavigationMode(), null);
  assert.equal(resolveStoryboard3DNavigationMode({}, {}), null);
  assert.equal(resolveStoryboard3DNavigationMode({ button: '1' }), STORYBOARD_3D_NAVIGATION_MODE.PAN);
  // 缺省值只对 undefined 生效，显式 null 会在读属性时抛 TypeError。
  assert.throws(() => resolveStoryboard3DNavigationMode(null), TypeError);
});

test('导航协议：帮助文案按飞行模式与预设切换', () => {
  assert.equal(
    getStoryboard3DNavigationHelpText({ flyMode: true }),
    '飞行模式 · WASD / Q E / 右键观察 / Shift 加速',
  );
  assert.equal(
    getStoryboard3DNavigationHelpText({ preset: 'blender' }),
    STORYBOARD_3D_NAVIGATION_PRESETS.blender.summary,
  );
  assert.equal(getStoryboard3DNavigationHelpText(), STORYBOARD_3D_NAVIGATION_PRESETS.unity.summary);
  assert.equal(
    getStoryboard3DNavigationHelpText({ preset: 'does-not-exist' }),
    STORYBOARD_3D_NAVIGATION_PRESETS.unity.summary,
  );
});

test('导航协议：工具快捷键解析在带修饰键时直接放弃', () => {
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'q' }), 'select');
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'W' }), 'move');
  // 预设走第二形参；首参里同名的字段不参与判定（故此处按 unity 解析为 scale）。
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'r', preset: 'blender' }), 'scale');
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'r' }, { preset: 'blender' }), 'rotate');
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'g' }, { preset: 'blender' }), 'move');
  assert.equal(resolveStoryboard3DNavigationTool({ key: 's' }, { preset: 'blender' }), 'scale');
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'q', altKey: true }), null);
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'q', ctrlKey: true }), null);
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'q', metaKey: true }), null);
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'q', shiftKey: true }), null);
  assert.equal(resolveStoryboard3DNavigationTool({ key: 'z' }), null);
  assert.equal(resolveStoryboard3DNavigationTool(), null);
  assert.equal(resolveStoryboard3DNavigationTool({ key: '0' }, { preset: 'c4d' }), 'select');
});
