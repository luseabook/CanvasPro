import assert from 'node:assert/strict';
import test from 'node:test';

import { renderDirectorCameraKeyEditor } from './directorCameraKeyEditor.js';

const camera = {
  position: [1, -2.5, 3],
  target: [0, 1, -4],
  focalLength: 35,
  roll: Math.PI / 2,
};

test('相机关键帧编辑器：渲染位置与注视目标的三轴输入', () => {
  const html = renderDirectorCameraKeyEditor({ camera, easing: 'linear' });
  assert.ok(html.includes('storyboard-3d-camera-key-fields'));
  assert.ok(html.includes('<b>位置</b>'));
  assert.ok(html.includes('<b>注视目标</b>'));
  assert.ok(html.includes('data-director-camera-key="position-0"'));
  assert.ok(html.includes('data-director-camera-key="position-1"'));
  assert.ok(html.includes('data-director-camera-key="position-2"'));
  assert.ok(html.includes('data-director-camera-key="target-0"'));
  assert.ok(html.includes('data-director-camera-key="target-2"'));
  assert.ok(html.includes('<label>X<input'));
  assert.ok(html.includes('<label>Y<input'));
  assert.ok(html.includes('<label>Z<input'));
});

test('相机关键帧编辑器：数值保留三位小数', () => {
  const html = renderDirectorCameraKeyEditor({ camera, easing: 'linear' });
  assert.ok(html.includes('value="1.000" data-director-camera-key="position-0"'));
  assert.ok(html.includes('value="-2.500" data-director-camera-key="position-1"'));
  assert.ok(html.includes('value="3.000" data-director-camera-key="position-2"'));
  assert.ok(html.includes('value="35.000" data-director-camera-key="focalLength"'));
  assert.ok(html.includes('value="-4.000" data-director-camera-key="target-2"'));
});

test('相机关键帧编辑器：倾斜角由弧度换算为角度，缺省为 0', () => {
  const half = renderDirectorCameraKeyEditor({ camera, easing: 'linear' });
  assert.ok(half.includes('value="90.000" data-director-camera-key="roll"'));
  assert.ok(half.includes('倾斜°'));
  const none = renderDirectorCameraKeyEditor({
    camera: { ...camera, roll: undefined },
    easing: 'linear',
  });
  assert.ok(none.includes('value="0.000" data-director-camera-key="roll"'));
});

test('相机关键帧编辑器：缓动下拉选中当前值并携带全部四个选项', () => {
  const html = renderDirectorCameraKeyEditor({ camera, easing: 'ease-in-out' });
  for (const value of ['linear', 'ease-in', 'ease-out', 'ease-in-out'])
    assert.ok(html.includes(`<option value="${value}"`));
  assert.ok(html.includes('<option value="linear" >匀速</option>'));
  assert.ok(html.includes('<option value="ease-in-out" selected>缓入缓出</option>'));
  assert.ok(html.includes('data-director-camera-key-easing'));
  assert.ok(html.includes('缓动'));
});

test('相机关键帧编辑器：无匹配缓动时不标注 selected', () => {
  const html = renderDirectorCameraKeyEditor({ camera, easing: 'bounce' });
  assert.ok(!html.includes('selected'));
});
