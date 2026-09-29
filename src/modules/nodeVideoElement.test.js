import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNodeVideoElement } from './nodeVideoElement.js';

const VISIBLE = { display: 'block', visibility: 'visible', opacity: '1' };
const HIDDEN = { display: 'none', visibility: 'visible', opacity: '1' };
const TRANSPARENT = { display: 'block', visibility: 'visible', opacity: '0' };
const ZERO_SIZE = { display: 'block', visibility: 'visible', opacity: '1' };

globalThis.window = {
  getComputedStyle: (element) => element.__computed || VISIBLE,
};

function createVideo(index, options = {}) {
  return {
    dataset: options.idx === undefined ? {} : { idx: String(options.idx) },
    classList: { contains: (name) => name === 'video-player' && options.player === true },
    __computed: options.computed || VISIBLE,
    getBoundingClientRect: () => (options.zeroSize ? { width: 0, height: 0 } : { width: 320, height: 180 }),
    index,
  };
}

function createRoot(videos) {
  return { querySelectorAll: () => videos };
}

test('nodeVideoElement: 空输入或没有 video 元素时返回 null', () => {
  assert.equal(resolveNodeVideoElement(null), null);
  assert.equal(resolveNodeVideoElement(createRoot([])), null);
});

test('nodeVideoElement: 只有一个可见 video 时直接返回它', () => {
  const only = createVideo(0);
  assert.equal(resolveNodeVideoElement(createRoot([only])), only);
});

test('nodeVideoElement: 跳过隐藏与零尺寸的元素', () => {
  const hidden = createVideo(0, { computed: HIDDEN });
  const transparent = createVideo(1, { computed: TRANSPARENT });
  const zero = createVideo(2, { computed: ZERO_SIZE, zeroSize: true });
  const visible = createVideo(3);
  assert.equal(resolveNodeVideoElement(createRoot([hidden, transparent, zero, visible])), visible);
});

test('nodeVideoElement: data-idx 命中的元素优先', () => {
  const first = createVideo(0, { idx: 0 });
  const second = createVideo(1, { idx: 1 });
  assert.equal(resolveNodeVideoElement(createRoot([first, second]), 1), second);
  assert.equal(resolveNodeVideoElement(createRoot([first, second]), '1'), second, '字符串索引同样命中');
  assert.equal(resolveNodeVideoElement(createRoot([first, second]), 'nope'), first, '非法索引回落第一个可见元素');
});

test('nodeVideoElement: video-player 类在可见元素缺失时也会被选中', () => {
  const player = createVideo(0, { player: true, computed: HIDDEN });
  const visible = createVideo(1);
  assert.equal(resolveNodeVideoElement(createRoot([player, visible])), player);
});

test('nodeVideoElement: 全部不可见时仍回落第一个元素，不会返回 null', () => {
  const first = createVideo(0, { computed: HIDDEN });
  const second = createVideo(1, { computed: HIDDEN });
  assert.equal(resolveNodeVideoElement(createRoot([first, second])), first);
});

test('nodeVideoElement: 负索引与小数索引被折成 0', () => {
  const first = createVideo(0, { idx: 0 });
  const second = createVideo(1, { idx: 1 });
  assert.equal(resolveNodeVideoElement(createRoot([first, second]), -3), first);
  assert.equal(resolveNodeVideoElement(createRoot([first, second]), 1.9), second, '1.9 截断为 1');
});
