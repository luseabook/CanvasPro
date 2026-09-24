import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canStoryboard3DObjectEditTransformField,
  canStoryboard3DObjectUseTransformTool,
  getStoryboard3DObjectTransformCapabilities,
} from './objectTransformCapabilities.js';

test('变换能力：道具与角色持有全量工具且可吸附地面', () => {
  for (const type of ['prop', 'character']) {
    const capabilities = getStoryboard3DObjectTransformCapabilities({ type });
    assert.deepEqual(capabilities.tools, ['move', 'rotate', 'scale']);
    assert.deepEqual(capabilities.fields, ['position', 'rotation', 'scale']);
    assert.equal(capabilities.groundSnap, true);
  }
});

test('变换能力：摄像机与灯光只有平移旋转且不吸附', () => {
  const camera = getStoryboard3DObjectTransformCapabilities({ type: 'camera' });
  assert.deepEqual(camera.tools, ['move', 'rotate']);
  assert.deepEqual(camera.fields, ['position', 'rotation']);
  assert.equal(camera.groundSnap, false);
  for (const light of [{ type: 'light' }, { type: 'light', lightType: 'point' }]) {
    const capabilities = getStoryboard3DObjectTransformCapabilities(light);
    assert.deepEqual(capabilities.tools, ['move', 'rotate']);
    assert.equal(capabilities.groundSnap, false);
  }
});

test('变换能力：环境光与未知类型均为空且共享同一冻结空数组', () => {
  const ambient = getStoryboard3DObjectTransformCapabilities({ type: 'light', lightType: 'ambient' });
  assert.deepEqual(ambient.tools, []);
  assert.deepEqual(ambient.fields, []);
  assert.equal(ambient.groundSnap, false);
  assert.equal(ambient.tools, ambient.fields);
  const unknown = getStoryboard3DObjectTransformCapabilities({});
  assert.equal(unknown.tools, ambient.tools);
  assert.equal(getStoryboard3DObjectTransformCapabilities(undefined).tools, ambient.tools);
});

test('变换能力：工具数组跨调用共享常量，字段数组每次新建但同样冻结', () => {
  const first = getStoryboard3DObjectTransformCapabilities({ type: 'prop' });
  const second = getStoryboard3DObjectTransformCapabilities({ type: 'character' });
  assert.equal(first.tools, second.tools);
  assert.notEqual(first.fields, second.fields);
  assert.deepEqual(first.fields, second.fields);
  assert.ok(Object.isFrozen(first.tools));
  assert.ok(Object.isFrozen(first.fields));
  assert.ok(Object.isFrozen(second.fields));
});

test('变换能力：select 归一为 move，工具与字段判定各自独立', () => {
  const camera = { type: 'camera' };
  assert.equal(canStoryboard3DObjectUseTransformTool(camera, 'select'), true);
  assert.equal(canStoryboard3DObjectUseTransformTool(camera, 'move'), true);
  assert.equal(canStoryboard3DObjectUseTransformTool(camera, 'scale'), false);
  assert.equal(canStoryboard3DObjectEditTransformField(camera, 'scale'), false);
  assert.equal(canStoryboard3DObjectEditTransformField(camera, 'rotation'), true);
  const prop = { type: 'prop' };
  assert.equal(canStoryboard3DObjectUseTransformTool(prop, 'scale'), true);
  assert.equal(canStoryboard3DObjectEditTransformField(prop, 'scale'), true);
  assert.equal(canStoryboard3DObjectUseTransformTool(prop, 'fly'), false);
  assert.equal(canStoryboard3DObjectUseTransformTool(prop, ''), false);
});

test('变换能力：非对象入参不抛错且退化为空能力', () => {
  for (const value of [null, undefined, 0, 'prop'])
    assert.deepEqual(getStoryboard3DObjectTransformCapabilities(value).tools, []);
});
