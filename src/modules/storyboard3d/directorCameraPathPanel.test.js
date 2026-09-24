import assert from 'node:assert/strict';
import test from 'node:test';

import { renderDirectorCameraPathPanel } from './directorCameraPathPanel.js';

function makePoint(overrides = {}) {
  return {
    id: 'p1',
    time: 0,
    easing: 'linear',
    easingCurve: [0, 0, 1, 1],
    inTangent: [0, 0, 0],
    outTangent: [0, 0, 0],
    camera: {
      focalLength: 50,
      roll: 0,
      position: [0, 1.6, 5],
      target: [0, 1.2, 0],
    },
    ...overrides,
  };
}

function makeController(overrides = {}) {
  return {
    selectedId: 'p1',
    objectId: '',
    active: false,
    drawing: false,
    drawMode: 'points',
    drawDuration: 3,
    plane: 1,
    planeOffset: 0,
    points: () => [makePoint()],
    context: () => ({
      scene: {
        objects: [
          { id: 'o1', type: 'mesh', name: 'Cube' },
          { id: 'cam', type: 'camera', name: 'Cam' },
          { id: 'light', type: 'light', name: 'Sun' },
          { id: 'grp', type: 'group', name: 'G' },
        ],
      },
    }),
    ...overrides,
  };
}

const timeline = { cameraKeyframes: [{ id: 'c1', time: 0 }] };

test('运动轨迹面板：未激活时只渲染对象选择与编辑入口', () => {
  const html = renderDirectorCameraPathPanel(makeController(), timeline);
  assert.match(html, /^<fieldset data-camera-path-panel><legend>运动轨迹<\/legend>/);
  assert.ok(html.includes('<option value="camera" selected>摄像机</option>'));
  assert.ok(html.includes('>Cube</option>'));
  assert.ok(!html.includes('>Cam</option>'));
  assert.ok(!html.includes('>Sun</option>'));
  assert.ok(!html.includes('>G</option>'));
  assert.ok(html.includes('data-storyboard-3d-action="timeline-camera-path-edit"'));
  assert.ok(html.includes('编辑画面轨道'));
  assert.ok(!html.includes('结束轨道编辑'));
  assert.ok(!html.includes('data-camera-path-draw-mode'));
  assert.ok(!html.includes('data-camera-path-selection'));
  assert.ok(html.includes('<span>1 个控制点</span>'));
});

test('运动轨迹面板：激活后给出绘制、平面与控制点编辑', () => {
  const html = renderDirectorCameraPathPanel(makeController({ active: true }), timeline);
  assert.ok(html.includes('结束轨道编辑'));
  assert.ok(html.includes('data-storyboard-3d-action="timeline-camera-path-focus"'));
  assert.ok(html.includes('查看整条轨道'));
  assert.ok(html.includes('在画面点选路线'));
  assert.ok(html.includes('<option value="points" selected>逐点</option>'));
  assert.ok(html.includes('data-camera-path-draw-duration'));
  assert.ok(html.includes('value="3" data-camera-path-draw-duration'));
  assert.ok(html.includes('<option value="1" selected>XZ 地面</option>'));
  assert.ok(html.includes('<option value="2" >XY 高度</option>'));
  assert.ok(html.includes('<option value="0" >YZ 高度</option>'));
  assert.ok(html.includes('data-camera-path-field="planeOffset" value="0.000"'));
  assert.ok(html.includes('<option value="0" selected>1 · 0.00 秒</option>'));
  assert.ok(html.includes('在画面绘制物体路线') === false);
  assert.ok(html.includes('点击画面添加机位'));
  assert.ok(html.includes('Esc 取消拖动或结束编辑。'));
  assert.ok(
    html.includes('data-storyboard-3d-action="timeline-camera-path-delete" disabled>删除控制点</button>'),
  );
  assert.ok(
    html.includes('data-storyboard-3d-action="timeline-camera-path-smooth" disabled>平滑曲线</button>'),
  );
  assert.ok(
    html.includes('data-storyboard-3d-action="timeline-camera-path-linear" disabled>直线路径</button>'),
  );
  assert.ok(html.includes('data-storyboard-3d-action="timeline-camera-path-focus" >查看整条轨道</button>'));
});

test('运动轨迹面板：摄像机控制点字段含时间焦距倾斜与位置目标', () => {
  const html = renderDirectorCameraPathPanel(makeController({ active: true }), timeline);
  assert.ok(html.includes('data-camera-path-field="time" value="0.000" step="0.1" min="0" max="3600"'));
  assert.ok(html.includes('焦距 / mm'));
  assert.ok(
    html.includes('data-camera-path-field="focalLength" value="50.000" step="0.1" min="1" max="500"'),
  );
  assert.ok(html.includes('data-camera-path-field="roll" value="0.000" step="0.1" min="-180" max="180"'));
  assert.ok(html.includes('<option value="linear" selected>匀速</option>'));
  assert.ok(html.includes('<option value="ease-in" >缓入</option>'));
  assert.ok(html.includes('data-camera-path-field="position-0" value="0.000"'));
  assert.ok(html.includes('data-camera-path-field="position-1" value="1.600"'));
  assert.ok(html.includes('data-camera-path-field="position-2" value="5.000"'));
  assert.ok(html.includes('data-camera-path-field="target-0" value="0.000"'));
  assert.ok(html.includes('data-camera-path-field="target-1" value="1.200"'));
  assert.ok(html.includes('>注视目标</b>'));
  assert.ok(html.includes('data-director-curve'));
  assert.ok(html.includes('data-curve-handle="0"'));
  assert.ok(html.includes('运动曲线与空间切线'));
});

test('运动轨迹面板：物体轨道省略焦距与注视目标', () => {
  const html = renderDirectorCameraPathPanel(
    makeController({ active: true, objectId: 'o1', selectedId: 'p1' }),
    { cameraKeyframes: [{ id: 'c1' }, { id: 'c2' }] },
  );
  assert.ok(html.includes('<option value="0" selected>Cube</option>'));
  assert.ok(html.includes('<option value="camera" >摄像机</option>'));
  assert.ok(!html.includes('焦距 / mm'));
  assert.ok(!html.includes('data-camera-path-field="target-0"'));
  assert.ok(html.includes('在画面绘制物体路线，拖动控制点调整走位。'));
  assert.ok(html.includes('data-storyboard-3d-action="timeline-camera-path-delete" >删除控制点</button>'));
});

test('运动轨迹面板：绘制开关与手绘模式反映当前状态', () => {
  const html = renderDirectorCameraPathPanel(
    makeController({ active: true, drawing: true, drawMode: 'freehand', drawDuration: 8 }),
    timeline,
  );
  assert.ok(html.includes('停止点选'));
  assert.ok(!html.includes('在画面点选路线'));
  assert.ok(html.includes('<option value="freehand" selected>手绘</option>'));
  assert.ok(html.includes('value="8" data-camera-path-draw-duration'));
});

test('运动轨迹面板：转义对象名并处理空控制点', () => {
  const escaped = renderDirectorCameraPathPanel(
    makeController({
      context: () => ({ scene: { objects: [{ id: 'o1', type: 'mesh', name: '<A & B>' }] } }),
    }),
    timeline,
  );
  assert.ok(escaped.includes('&lt;A &amp; B>'));
  assert.ok(!escaped.includes('<A & B>'));

  const empty = renderDirectorCameraPathPanel(makeController({ active: true, points: () => [] }), timeline);
  assert.ok(
    empty.includes('data-storyboard-3d-action="timeline-camera-path-delete" disabled>删除控制点</button>'),
  );
  assert.ok(
    empty.includes('data-storyboard-3d-action="timeline-camera-path-focus" disabled>查看整条轨道</button>'),
  );
  assert.ok(!empty.includes('data-director-curve'));
  assert.ok(empty.includes('<span>0 个控制点</span>'));
});

test('运动轨迹面板：未选中控制点时回退到首个控制点', () => {
  const html = renderDirectorCameraPathPanel(
    makeController({ active: true, selectedId: 'missing' }),
    timeline,
  );
  assert.ok(html.includes('<option value="0" selected>1 · 0.00 秒</option>'));
  assert.ok(html.includes('data-camera-path-field="time" value="0.000"'));
});
