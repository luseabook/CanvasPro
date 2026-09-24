import assert from 'node:assert/strict';
import test from 'node:test';

import { captureTimelinePresentation, restoreTimelinePresentation } from './timelinePresentation.js';

const SCROLLERS = [
  '.storyboard-3d-timeline-grid',
  '.storyboard-3d-timeline-toolbar',
  '.storyboard-3d-timeline-key-editor',
  '.storyboard-3d-director-path-points',
];

const scroller = (top = 0, left = 0) => ({ scrollTop: top, scrollLeft: left });

const detail = (text, open) => ({
  open,
  querySelector: (sel) => (sel === 'summary' ? { textContent: text } : null),
});

const control = ({ tagName = 'INPUT', dataset = {}, clip = null, selection = null } = {}) => {
  const el = {
    tagName,
    dataset,
    isConnected: true,
    focused: false,
    closest: (sel) => (sel === '[data-director-clip]' && clip ? { dataset: { directorClip: clip } } : null),
    focus: (opts) => {
      el.focused = true;
      el.focusOptions = opts;
    },
    setSelectionRange: (start, end) => {
      el.selection = [start, end];
    },
  };
  if (selection) {
    el.selectionStart = selection[0];
    el.selectionEnd = selection[1];
  }
  return el;
};

const harness = ({
  withTimeline = true,
  shotId = 'shot-1',
  details = [],
  scrollers = {},
  focusTarget = null,
  active = null,
} = {}) => {
  const body = { tagName: 'BODY', dataset: {} };
  const timeline = {
    dataset: { shotId },
    scrollTop: 0,
    scrollLeft: 0,
    querySelectorAll: (sel) => {
      if (sel === 'details') return details;
      if (sel === 'input, select, button, textarea') return focusTarget ? [focusTarget] : [];
      return [];
    },
    querySelector: (sel) =>
      sel === '[data-storyboard-3d-shot-timeline]' ? timeline : scrollers[sel] || null,
    contains: (el) => el === timeline || el === focusTarget || details.includes(el),
    ownerDocument: { activeElement: active || body, body },
  };
  const root = {
    querySelector: (sel) => (sel === '[data-storyboard-3d-shot-timeline]' && withTimeline ? timeline : null),
  };
  return { root, timeline, body };
};

test('捕获展示状态：缺少时间线节点时返回 null', () => {
  assert.equal(captureTimelinePresentation(harness({ withTimeline: false }).root), null);
  assert.equal(captureTimelinePresentation(null), null);
  assert.equal(captureTimelinePresentation({}), null);
});

test('捕获展示状态：记录镜头号、折叠项、滚动位置与默认空焦点', () => {
  const { root } = harness({
    shotId: 'shot-7',
    details: [detail('机位', true), detail('镜头', false)],
    scrollers: { [SCROLLERS[0]]: scroller(42, 4), [SCROLLERS[2]]: scroller(9, 0) },
  });
  const state = captureTimelinePresentation(root);
  assert.equal(state.shotId, 'shot-7');
  assert.deepEqual(state.details, [
    { index: 0, text: '机位', open: true },
    { index: 1, text: '镜头', open: false },
  ]);
  assert.deepEqual(state.scroll, [
    { selector: SCROLLERS[0], top: 42, left: 4 },
    { selector: SCROLLERS[1], top: 0, left: 0 },
    { selector: SCROLLERS[2], top: 9, left: 0 },
    { selector: SCROLLERS[3], top: 0, left: 0 },
  ]);
  assert.equal(state.focus, null);
  assert.equal(state.selection, null);
});

test('捕获展示状态：焦点在时间线内时记录控件指纹与选区', () => {
  const target = control({
    dataset: { directorCameraKey: 'position-0', zIndex: '2' },
    clip: 'clip-3',
    selection: [1, 4],
  });
  const { root } = harness({ focusTarget: target, active: target });
  const state = captureTimelinePresentation(root);
  assert.equal(
    state.focus,
    JSON.stringify({
      tag: 'INPUT',
      data: [
        ['directorCameraKey', 'position-0'],
        ['zIndex', '2'],
      ],
      clip: 'clip-3',
    }),
  );
  assert.deepEqual(state.selection, [1, 4]);
});

test('捕获展示状态：焦点在时间线外时不记录', () => {
  const outside = control({ tagName: 'BUTTON' });
  const { root } = harness({ focusTarget: control(), active: outside });
  const state = captureTimelinePresentation(root);
  assert.equal(state.focus, null);
  assert.equal(state.selection, null);
  const noClip = control({ dataset: {} });
  const inner = harness({ focusTarget: noClip, active: noClip });
  assert.equal(
    captureTimelinePresentation(inner.root).focus,
    JSON.stringify({ tag: 'INPUT', data: [], clip: '' }),
  );
});

test('恢复展示状态：空状态或镜头号不匹配时直接返回', () => {
  const details = [detail('机位', true)];
  const { root, timeline } = harness({
    shotId: 'shot-1',
    details,
    scrollers: { [SCROLLERS[0]]: scroller() },
  });
  restoreTimelinePresentation(root, null);
  restoreTimelinePresentation(root, { shotId: 'other', details: [{ index: 0, text: '机位', open: false }] });
  assert.equal(details[0].open, true);
  assert.equal(timeline.scrollTop, 0);
  restoreTimelinePresentation(harness({ withTimeline: false }).root, { shotId: 'shot-1', scroll: [] });
});

test('恢复展示状态：按摘要文本匹配折叠项并回填滚动位置', () => {
  const details = [detail('机位', true), detail('镜头', true)];
  const grid = scroller();
  const { root } = harness({ shotId: 'shot-1', details, scrollers: { [SCROLLERS[0]]: grid } });
  restoreTimelinePresentation(root, {
    shotId: 'shot-1',
    details: [
      { index: 0, text: '机位', open: false },
      { index: 1, text: '已改名', open: false },
      { index: 5, text: '越界', open: true },
    ],
    scroll: [
      { selector: SCROLLERS[0], top: 33, left: 7 },
      { selector: SCROLLERS[3], top: 1, left: 0 },
    ],
  });
  assert.equal(details[0].open, false);
  assert.equal(details[1].open, true);
  assert.equal(grid.scrollTop, 33);
  assert.equal(grid.scrollLeft, 7);
});

test('恢复展示状态：异步恢复焦点与选区', async () => {
  const target = control({ dataset: { directorCameraKey: 'focalLength' }, selection: [0, 2] });
  const fingerprint = JSON.stringify({
    tag: 'INPUT',
    data: [['directorCameraKey', 'focalLength']],
    clip: '',
  });
  const { root } = harness({ shotId: 'shot-1', focusTarget: target, active: null });
  restoreTimelinePresentation(root, {
    shotId: 'shot-1',
    details: [],
    scroll: [],
    focus: fingerprint,
    selection: [0, 2],
  });
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(target.focused, true);
  assert.deepEqual(target.focusOptions, { preventScroll: true });
  assert.deepEqual(target.selection, [0, 2]);
});

test('恢复展示状态：焦点已被他处占用时不抢焦点', async () => {
  const target = control({ dataset: { directorCameraKey: 'roll' } });
  const other = control({ tagName: 'BUTTON' });
  const fingerprint = JSON.stringify({ tag: 'INPUT', data: [['directorCameraKey', 'roll']], clip: '' });
  const { root } = harness({ shotId: 'shot-1', focusTarget: target, active: other });
  restoreTimelinePresentation(root, { shotId: 'shot-1', details: [], scroll: [], focus: fingerprint });
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(target.focused, false);
});

test('恢复展示状态：控件已脱离文档时不抢焦点', async () => {
  const target = control({ dataset: { directorCameraKey: 'roll' } });
  target.isConnected = false;
  const fingerprint = JSON.stringify({ tag: 'INPUT', data: [['directorCameraKey', 'roll']], clip: '' });
  const { root } = harness({ shotId: 'shot-1', focusTarget: target });
  restoreTimelinePresentation(root, { shotId: 'shot-1', details: [], scroll: [], focus: fingerprint });
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(target.focused, false);
});
