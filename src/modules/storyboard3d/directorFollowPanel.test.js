import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderDirectorFollowPanel,
  changeDirectorFollow,
  clickDirectorFollow,
} from './directorFollowPanel.js';

const makeEvent = (dataset, value, type = 'number', closest = () => null) => ({
  target: {
    matches: (selector) => selector === '[data-director-follow]',
    closest,
    dataset,
    type,
    value,
  },
});

test('renderDirectorFollowPanel 输出基础跟拍字段与模式下拉', () => {
  const html = renderDirectorFollowPanel(
    { cameraConstraint: { mode: 'relative', followOffset: [0, 2, 5] }, cameraConstraintClips: [] },
    [],
  );
  assert.ok(html.includes('<div class="storyboard-3d-director-fields">'));
  assert.ok(html.includes('data-director-follow="mode"'));
  assert.ok(html.includes('<option value="relative" selected>相对运动跟拍</option>'));
  assert.ok(html.includes('<option value="path" >沿轨道注视目标</option>'));
  assert.ok(html.includes('<option value="fixed" >固定偏移跟拍</option>'));
  assert.ok(
    html.includes(
      '<label>偏移 X / 米<input type="number" step="0.1" data-director-follow="followOffset-0" value="0"></label>',
    ),
  );
  assert.ok(html.includes('data-director-follow="followOffset-2" value="5"'));
  assert.ok(
    html.includes('<button data-storyboard-3d-action="timeline-follow-add">从播放头添加跟拍段</button>'),
  );
});

test('renderDirectorFollowPanel 转义对象选项并在片段中回填当前值', () => {
  const html = renderDirectorFollowPanel(
    {
      cameraConstraint: { mode: 'fixed', followOffset: [0, 0.5, 1] },
      cameraConstraintClips: [
        {
          id: 'c"<&',
          start: 1,
          end: 4,
          mode: 'path',
          followOffset: [1, 2, 3],
          followObjectId: 'o1',
          lookAtObjectId: 'o2',
          lookAtOffset: [0, 1.5, 0],
        },
      ],
    },
    [
      ['o1', '主角"<&'],
      ['o2', '道具'],
    ],
  );
  assert.ok(html.includes('<option value="o1" selected>主角&quot;&lt;&amp;</option>'));
  assert.ok(html.includes('<option value="o2" selected>道具</option>'));
  assert.ok(html.includes('data-director-follow-clip="c&quot;&lt;&amp;"'));
  assert.ok(html.includes('data-clip-id="c&quot;&lt;&amp;"'));
  assert.ok(html.includes('data-director-follow="start" value="1"'));
  assert.ok(html.includes('data-director-follow="end" value="4"'));
  assert.ok(
    html.includes(
      '<label>注视高度<input type="number" step="0.1" data-director-follow="lookAtOffset-1" value="1.5"></label>',
    ),
  );
});

test('changeDirectorFollow 写入基础字段并拒绝非有限数字', () => {
  const project = { cameraConstraint: { mode: 'relative', followOffset: [0, 2, 5] } };
  const controller = { mutate: (label, handler) => handler(project) };
  assert.equal(changeDirectorFollow(controller, { target: { matches: () => false } }), false);
  assert.equal(changeDirectorFollow(controller, makeEvent({ directorFollow: 'followOffset-1' }, '9')), true);
  assert.deepEqual(project.cameraConstraint.followOffset, [0, 9, 5]);
  changeDirectorFollow(controller, makeEvent({ directorFollow: 'followOffset-0' }, 'abc'));
  assert.deepEqual(project.cameraConstraint.followOffset, [0, 9, 5]);
  changeDirectorFollow(controller, makeEvent({ directorFollow: 'followObjectId' }, 'o7', 'text'));
  assert.equal(project.cameraConstraint.followObjectId, 'o7');
});

test('changeDirectorFollow 切到固定偏移且偏移全零时给出默认偏移', () => {
  const project = { cameraConstraint: { mode: 'relative', followOffset: [0, 0, 0] } };
  const controller = { mutate: (label, handler) => handler(project) };
  changeDirectorFollow(controller, makeEvent({ directorFollow: 'mode' }, 'fixed', 'text'));
  assert.equal(project.cameraConstraint.mode, 'fixed');
  assert.deepEqual(project.cameraConstraint.followOffset, [0, 2, 5]);
});

test('changeDirectorFollow 命中片段时写入片段字段，未命中片段时原样返回', () => {
  const clip = { id: 'c1', mode: 'path', followOffset: [0, 0, 0], start: 1, end: 4 };
  const project = {
    cameraConstraint: { mode: 'relative', followOffset: [0, 0, 0] },
    cameraConstraintClips: [clip],
  };
  const controller = { mutate: (label, handler) => handler(project) };
  const withClip = (dataset, value, type = 'number') =>
    makeEvent(dataset, value, type, (selector) =>
      selector === '[data-director-follow-clip]' ? { dataset: { directorFollowClip: 'c1' } } : null,
    );
  assert.equal(changeDirectorFollow(controller, withClip({ directorFollow: 'end' }, '8')), true);
  assert.equal(clip.end, 8);
  assert.deepEqual(project.cameraConstraint.followOffset, [0, 0, 0]);
  changeDirectorFollow(controller, withClip({ directorFollow: 'start' }, '3'));
  assert.equal(clip.start, 3);
});

test('clickDirectorFollow 删除与新增跟拍段并请求重绘', () => {
  let rendered = 0;
  const project = {
    cameraConstraint: { mode: 'path', followOffset: [0, 1, 2] },
    cameraConstraintClips: [{ id: 'c1' }, { id: 'c2' }],
  };
  const controller = {
    mutate: (label, handler) => handler(project),
    timeline: {
      _timeForShot: () => 12,
      requestRender: () => {
        rendered += 1;
      },
    },
    context: () => ({ shot: {} }),
  };
  assert.equal(clickDirectorFollow(controller, 'not-follow', {}), false);
  assert.equal(
    clickDirectorFollow(controller, 'timeline-follow-delete', { dataset: { clipId: 'c1' } }),
    true,
  );
  assert.deepEqual(
    project.cameraConstraintClips.map((c) => c.id),
    ['c2'],
  );
  clickDirectorFollow(controller, 'timeline-follow-add', { dataset: {} });
  const added = project.cameraConstraintClips.at(-1);
  assert.ok(added.id.startsWith('follow-'));
  assert.equal(added.start, 12);
  assert.equal(added.end, 15);
  assert.equal(added.mode, 'path');
  assert.deepEqual(added.followOffset, [0, 1, 2]);
  assert.equal(rendered, 2);
});

test('clickDirectorFollow 新增片段时把播放头与结束时间限制在 3599/3600 以内', () => {
  const project = {
    cameraConstraint: { mode: 'relative', followOffset: [0, 0, 0] },
    cameraConstraintClips: [],
  };
  const controller = {
    mutate: (label, handler) => handler(project),
    timeline: { _timeForShot: () => 5000, requestRender: () => {} },
    context: () => ({ shot: {} }),
  };
  clickDirectorFollow(controller, 'timeline-follow-add', { dataset: {} });
  const added = project.cameraConstraintClips[0];
  assert.equal(added.start, 3599);
  assert.equal(added.end, 3600);
});
