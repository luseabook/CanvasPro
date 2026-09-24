import assert from 'node:assert/strict';
import test from 'node:test';
import { DirectorClipTimeline } from './directorClipTimeline.js';
import {
  copyDirectorClip,
  createDirectorClip,
  duplicateDirectorClip,
  pasteDirectorClip,
} from './directorClips.js';
import { collectDirectorKeys, directorKeyIdentity } from './directorTimelineOperations.js';

function animationFixture({
  duration = 10,
  fps = 24,
  cameraKeyframes = [],
  objectTracks = [],
  motionClips = [],
  actionClips = [],
} = {}) {
  return { duration, fps, cameraKeyframes, objectTracks, motionClips, actionClips };
}

function cameraKey(id, time) {
  return { id, time };
}

function createTimeline(animation, { selected = new Set(), projectId = 'p-1', shotId = 's-1' } = {}) {
  const state = {
    animation,
    mutations: [],
    renders: 0,
    windowListeners: [],
    rootListeners: [],
    removedListeners: [],
  };
  const firstRoot = {
    addEventListener(type, fn, capture) {
      state.rootListeners.push({ type, fn, capture });
    },
    removeEventListener(type, fn, capture) {
      state.removedListeners.push({ type, fn, capture });
    },
  };
  const timeline = {
    editing: {
      selected,
      mutate(label, produce) {
        state.mutations.push(label);
        state.animation = produce(state.animation);
      },
      snapTime: (time) => time,
    },
    root: firstRoot,
    _context: () => ({ project: { id: projectId }, shot: { id: shotId, animation: state.animation } }),
    _timeForShot: () => 0,
    requestRender() {
      state.renders += 1;
    },
    getRoot: () => timeline.root,
    window: {
      AbortController,
      addEventListener(type, fn, options) {
        state.windowListeners.push({ type, fn, options });
      },
      removeEventListener() {},
    },
  };
  return { timeline, state, firstRoot };
}

function clipElement({ clipId = 'm1', clipKind = 'motion', clipEdge = '' } = {}) {
  const styleCalls = [];
  return {
    styleCalls,
    element: {
      dataset: { clipId, clipKind, clipEdge },
      parentElement: { getBoundingClientRect: () => ({ width: 200 }) },
      style: {
        setProperty(name, value) {
          styleCalls.push([name, value]);
        },
      },
    },
  };
}

test('片段时间轴：render 输出操作按钮、每条片段一行并按百分比定位', () => {
  const { timeline } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);
  const html = view.render({
    duration: 10,
    motionClips: [{ id: 'm1', name: '推镜', start: 2, end: 5 }],
    actionClips: [{ id: 'a1', actionId: 'wave', start: 1, end: 3 }],
  });

  for (const action of ['create', 'copy', 'paste', 'duplicate', 'delete'])
    assert.match(html, new RegExp(`data-storyboard-3d-action="timeline-clip-${action}"`));
  assert.match(html, /data-clip-id="m1"/);
  assert.match(html, /--clip-start:20%;--clip-width:30%/);
  assert.match(html, /推镜/);
  assert.match(html, /data-clip-kind="action"/);
  assert.match(html, /动作 · wave/);
  assert.match(html, /--clip-start:10%;--clip-width:20%/);
});

test('片段时间轴：render 转义片段名并标记选中态', () => {
  const { timeline } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);
  const html = view.render({
    duration: 10,
    motionClips: [{ id: 'm1', name: 'a&b<c"d', start: 0, end: 1 }],
    actionClips: [],
  });
  assert.match(html, /a&amp;b&lt;c&quot;d/);
  assert.doesNotMatch(html, /a&b<c"d/);
  assert.doesNotMatch(html, /is-selected/);

  view.selected = { id: 'm1', kind: 'motion' };
  assert.match(
    view.render({ duration: 10, motionClips: [{ id: 'm1', name: 'x', start: 0, end: 1 }], actionClips: [] }),
    /storyboard-3d-motion-clip is-selected/,
  );
});

test('片段时间轴：handleClick 只接管 timeline-clip- 前缀动作', () => {
  const { timeline, state } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);
  assert.equal(view.handleClick('viewport-orbit', { dataset: {} }), false);
  assert.equal(state.renders, 0);
});

test('片段时间轴：缺少动画时点击直接返回 true 且不渲染', () => {
  const { timeline, state } = createTimeline(null);
  const view = new DirectorClipTimeline(timeline);
  assert.equal(
    view.handleClick('timeline-clip-select', { dataset: { clipId: 'm1', clipKind: 'motion' } }),
    true,
  );
  assert.equal(state.renders, 0);
});

test('片段时间轴：select 记录选中片段并请求重绘', () => {
  const { timeline, state } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);
  const handled = view.handleClick('timeline-clip-select', {
    dataset: { clipId: 'm7', clipKind: 'action' },
  });
  assert.equal(handled, true);
  assert.deepEqual(view.selected, { id: 'm7', kind: 'action' });
  assert.equal(state.renders, 1);
});

test('片段时间轴：未知的 timeline-clip- 动作只重绘不突变', () => {
  const { timeline, state } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);
  assert.equal(view.handleClick('timeline-clip-unknown', { dataset: {} }), true);
  assert.deepEqual(state.mutations, []);
  assert.equal(state.renders, 1);
});

test('片段时间轴：create 用当前选中关键帧造片段，未选中的关键帧不入选', () => {
  const animation = animationFixture({ cameraKeyframes: [cameraKey('k1', 1), cameraKey('k2', 4)] });
  const selected = new Set([
    directorKeyIdentity({ type: 'camera', objectId: '', property: '', key: { id: 'k2' } }),
  ]);
  const { timeline, state } = createTimeline(animation, { selected });
  const view = new DirectorClipTimeline(timeline);

  assert.equal(view.handleClick('timeline-clip-create', { dataset: {} }), true);
  assert.deepEqual(state.mutations, ['创建运动片段']);
  const clip = state.animation.motionClips[0];
  assert.deepEqual(clip.keyframeIds, ['k2']);
  assert.equal(clip.name, '运动片段');
  assert.equal(clip.start, 4);
  assert.equal(clip.end, 4.1);
});

test('片段时间轴：create 无选中关键帧时由 createDirectorClip 抛错', () => {
  const { timeline } = createTimeline(animationFixture({ cameraKeyframes: [cameraKey('k1', 1)] }));
  const view = new DirectorClipTimeline(timeline);
  assert.throws(() => view.handleClick('timeline-clip-create', { dataset: {} }), /请先选择关键帧/);
});

test('片段时间轴：copy 写入剪贴板并带项目/镜头归属', () => {
  const animation = animationFixture({
    cameraKeyframes: [cameraKey('k1', 1)],
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: ['k1'], start: 1, end: 2 }],
  });
  const { timeline } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);
  view.selected = { id: 'm1', kind: 'motion' };

  view.handleClick('timeline-clip-copy', { dataset: {} });

  assert.equal(view.clipboard.projectId, 'p-1');
  assert.equal(view.clipboard.shotId, 's-1');
  assert.deepEqual(view.clipboard.value, copyDirectorClip(animation, 'motion', 'm1'));
});

test('片段时间轴：paste 仅在项目与镜头都命中时执行', () => {
  const animation = animationFixture({
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: [], start: 1, end: 2 }],
  });
  const { timeline, state } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);
  const value = copyDirectorClip(animation, 'motion', 'm1');

  view.clipboard = { projectId: 'other', shotId: 's-1', value };
  view.handleClick('timeline-clip-paste', { dataset: {} });
  assert.deepEqual(state.mutations, []);

  view.clipboard = { projectId: 'p-1', shotId: 's-1', value };
  view.handleClick('timeline-clip-paste', { dataset: {} });
  assert.deepEqual(state.mutations, ['粘贴片段']);

  const expected = pasteDirectorClip(animation, value, 0);
  assert.deepEqual(
    state.animation.motionClips.map((clip) => [clip.start, clip.end]),
    expected.motionClips.map((clip) => [clip.start, clip.end]),
  );
});

test('片段时间轴：duplicate 紧贴片段末尾复制', () => {
  const animation = animationFixture({
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: [], start: 2, end: 6 }],
  });
  const { timeline, state } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);
  view.selected = { id: 'm1', kind: 'motion' };

  view.handleClick('timeline-clip-duplicate', { dataset: {} });
  assert.deepEqual(state.mutations, ['紧后复制片段']);

  const expected = duplicateDirectorClip(animation, 'motion', 'm1', 6);
  assert.deepEqual(
    state.animation.motionClips.map((clip) => [clip.start, clip.end]),
    expected.motionClips.map((clip) => [clip.start, clip.end]),
  );
});

test('片段时间轴：delete 运动片段同时清掉其关键帧与对象轨道关键帧', () => {
  const animation = animationFixture({
    cameraKeyframes: [cameraKey('k1', 1), cameraKey('k2', 2)],
    objectTracks: [
      {
        objectId: 'o1',
        positionKeyframes: [cameraKey('k2', 2)],
        rotationKeyframes: [cameraKey('k3', 3)],
        scaleKeyframes: [],
      },
    ],
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: ['k1', 'k2'], start: 1, end: 2 }],
  });
  const { timeline, state } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);
  view.selected = { id: 'm1', kind: 'motion' };

  view.handleClick('timeline-clip-delete', { dataset: {} });

  assert.deepEqual(state.mutations, ['删除片段']);
  assert.equal(state.animation.motionClips.length, 0);
  assert.deepEqual(state.animation.cameraKeyframes, []);
  assert.deepEqual(state.animation.objectTracks[0].positionKeyframes, []);
  assert.deepEqual(
    state.animation.objectTracks[0].rotationKeyframes.map((key) => key.id),
    ['k3'],
  );
});

test('片段时间轴：delete 动作片段只动动作轨', () => {
  const animation = animationFixture({
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: [], start: 0, end: 1 }],
    actionClips: [{ id: 'a1', actionId: 'wave', start: 1, end: 2 }],
  });
  const { timeline, state } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);
  view.selected = { id: 'a1', kind: 'action' };

  view.handleClick('timeline-clip-delete', { dataset: {} });

  assert.deepEqual(state.animation.actionClips, []);
  assert.equal(state.animation.motionClips.length, 1);
});

test('片段时间轴：handleKey 映射 Delete/Ctrl+C/Ctrl+V/Enter 到对应动作', () => {
  const makeView = () => {
    const animation = animationFixture({
      motionClips: [{ id: 'm1', name: 'x', keyframeIds: [], start: 0, end: 1 }],
    });
    const created = createTimeline(animation);
    const view = new DirectorClipTimeline(created.timeline);
    return { view, state: created.state };
  };

  for (const [key, modifier, expected] of [
    ['Delete', {}, 'delete'],
    ['Backspace', {}, 'delete'],
    ['c', { ctrlKey: true }, 'copy'],
    ['v', { metaKey: true }, 'paste'],
    ['Enter', {}, 'select'],
    [' ', {}, 'select'],
  ]) {
    const { view, state } = makeView();
    const events = { prevented: 0, stopped: 0 };
    const handled = view.handleKey({
      key,
      ...modifier,
      target: {
        closest: (selector) => (selector === '.storyboard-3d-motion-clip' ? clipElement().element : null),
      },
      preventDefault: () => (events.prevented += 1),
      stopImmediatePropagation: () => (events.stopped += 1),
    });
    assert.equal(handled, true, `${key} 应被处理`);
    assert.equal(events.prevented, 1);
    assert.equal(events.stopped, 1);
    const expectedLabel = {
      delete: '删除片段',
      copy: null,
      paste: null,
      select: null,
    }[expected];
    if (expectedLabel) assert.ok(state.mutations.includes(expectedLabel));
  }
});

test('片段时间轴：handleKey 在无片段或无关按键时放弃', () => {
  const { timeline } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);
  assert.equal(
    view.handleKey({
      key: 'Delete',
      target: { closest: () => null },
      preventDefault() {},
      stopImmediatePropagation() {},
    }),
    false,
  );
  assert.equal(
    view.handleKey({
      key: 'q',
      target: { closest: () => clipElement().element },
      preventDefault() {},
      stopImmediatePropagation() {},
    }),
    false,
  );
});

test('片段时间轴：bind 绑定到时间轴根节点且换根时解绑旧根', () => {
  const { timeline, state, firstRoot } = createTimeline(animationFixture());
  const view = new DirectorClipTimeline(timeline);

  view.bind();
  assert.equal(state.rootListeners.length, 1);
  assert.equal(state.rootListeners[0].type, 'pointerdown');
  assert.equal(state.rootListeners[0].capture, true);
  assert.equal(view.root, firstRoot);

  view.bind();
  assert.equal(state.rootListeners.length, 1);

  const secondRoot = {
    addEventListener(type, fn, capture) {
      state.rootListeners.push({ type, fn, capture });
    },
    removeEventListener(type, fn, capture) {
      state.removedListeners.push({ type, fn, capture });
    },
  };
  timeline.root = secondRoot;
  view.bind();
  assert.equal(state.removedListeners.length, 1);
  assert.equal(state.removedListeners[0].type, 'pointerdown');
  assert.equal(state.rootListeners.length, 2);
  assert.equal(view.root, secondRoot);

  view.destroy();
  assert.equal(view.root, null);
  assert.equal(state.removedListeners.length, 2);
});

test('片段时间轴：drag 忽略空目标与非左键，左键拖动登记窗口监听与取消函数', () => {
  const animation = animationFixture({
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: [], start: 1, end: 2 }],
  });
  const { timeline, state } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);

  assert.equal(view.drag({ target: { closest: () => null }, button: 0 }), undefined);
  assert.equal(view.drag({ target: { closest: () => clipElement().element }, button: 2 }), undefined);
  assert.equal(state.windowListeners.length, 0);

  const { element, styleCalls } = clipElement({ clipEdge: 'end' });
  const events = { prevented: 0, stopped: 0 };
  view.drag({
    target: {
      closest: (selector) => (selector === '.storyboard-3d-motion-clip' ? element : null),
      dataset: {},
    },
    button: 0,
    clientX: 120,
    pointerId: 3,
    preventDefault: () => (events.prevented += 1),
    stopImmediatePropagation: () => (events.stopped += 1),
  });

  assert.equal(events.prevented, 1);
  assert.equal(events.stopped, 1);
  assert.deepEqual(view.selected, { id: 'm1', kind: 'motion' });
  assert.deepEqual(
    state.windowListeners.map((entry) => entry.type),
    ['pointermove', 'pointercancel', 'keydown', 'pointerup'],
  );
  assert.equal(typeof view.cancel, 'function');

  view.cancel();
  assert.equal(view.cancel, null);
  assert.deepEqual(styleCalls, [
    ['--clip-start', '10%'],
    ['--clip-width', '10%'],
  ]);
});

test('片段时间轴：destroy 取消在途拖动', () => {
  const animation = animationFixture({
    motionClips: [{ id: 'm1', name: 'x', keyframeIds: [], start: 1, end: 2 }],
  });
  const { timeline, state } = createTimeline(animation);
  const view = new DirectorClipTimeline(timeline);
  view.bind();
  const { element } = clipElement({ clipEdge: 'end' });
  view.drag({
    target: {
      closest: (selector) => (selector === '.storyboard-3d-motion-clip' ? element : null),
      dataset: {},
    },
    button: 0,
    clientX: 10,
    pointerId: 1,
    preventDefault() {},
    stopImmediatePropagation() {},
  });
  assert.equal(typeof view.cancel, 'function');
  view.destroy();
  assert.equal(view.cancel, null);
  assert.equal(view.root, null);
  assert.equal(state.removedListeners.length, 1);
});

test('片段时间轴：collectDirectorKeys 覆盖相机与对象轨道，供 create 选择过滤', () => {
  const animation = animationFixture({
    cameraKeyframes: [cameraKey('c1', 1)],
    objectTracks: [
      {
        objectId: 'o1',
        positionKeyframes: [cameraKey('p1', 2)],
        rotationKeyframes: [],
        scaleKeyframes: [cameraKey('s1', 3)],
      },
    ],
  });
  const keys = collectDirectorKeys(animation);
  assert.equal(keys.length, 3);
  assert.deepEqual(
    keys.map((entry) => entry.type),
    ['camera', 'object', 'object'],
  );
  assert.deepEqual(view0Identities(keys), ['camera:::c1', 'object:o1:position:p1', 'object:o1:scale:s1']);
});

function view0Identities(keys) {
  return keys.map((entry) => directorKeyIdentity(entry));
}
