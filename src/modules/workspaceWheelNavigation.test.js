import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureWorkspaceNestedScrollPositions,
  captureWorkspaceScrollPosition,
  hasWorkspaceScrollableOverflow,
  restoreWorkspaceNestedScrollPositions,
  restoreWorkspaceScrollPosition,
  scrollWorkspaceTrackWithWheel,
  shouldPreserveWorkspaceNestedWheel,
} from './workspaceWheelNavigation.js';

const SCROLLABLE = { overflowY: 'auto', overflowX: 'hidden' };
const CLIPPED = { overflowY: 'hidden', overflowX: 'hidden' };

function createScroller(options = {}) {
  return {
    scrollTop: options.top || 0,
    scrollLeft: options.left || 0,
    scrollHeight: options.scrollHeight || 0,
    clientHeight: options.clientHeight || 0,
    scrollWidth: options.scrollWidth || 0,
    clientWidth: options.clientWidth || 0,
  };
}

test('workspaceWheelNavigation: 溢出判定要求 overflow 可滚且内容确实超出', () => {
  assert.equal(
    hasWorkspaceScrollableOverflow(createScroller({ scrollHeight: 300, clientHeight: 100 }), SCROLLABLE),
    true,
  );
  assert.equal(
    hasWorkspaceScrollableOverflow(createScroller({ scrollHeight: 100, clientHeight: 100 }), SCROLLABLE),
    false,
    '内容没超出就不算可滚',
  );
  assert.equal(
    hasWorkspaceScrollableOverflow(createScroller({ scrollHeight: 300, clientHeight: 100 }), CLIPPED),
    false,
    'overflow 不是 auto/scroll/overlay 就不算',
  );
  assert.equal(
    hasWorkspaceScrollableOverflow(createScroller({ scrollWidth: 300, clientWidth: 100 }), {
      overflowY: 'hidden',
      overflowX: 'scroll',
    }),
    true,
    '横向可滚也算',
  );
  assert.equal(hasWorkspaceScrollableOverflow(createScroller(), { overflowY: 'overlay' }), false);
  assert.equal(hasWorkspaceScrollableOverflow(null, null), false);
  assert.equal(hasWorkspaceScrollableOverflow(createScroller({ scrollHeight: 300, clientHeight: 1 }), { overflowY: 'AUTO' }), false, '大小写敏感');
});

test('workspaceWheelNavigation: 命中嵌套选择器时保留原生滚轮，越出边界不算', () => {
  const inside = { closest: () => ({ id: 'nested' }) };
  const outside = { closest: () => null };
  const boundary = { contains: (node) => node.id === 'nested' };
  const elsewhere = { contains: () => false };
  assert.equal(
    shouldPreserveWorkspaceNestedWheel(inside, { nestedSelector: '.nested', boundaryRoot: boundary }),
    true,
  );
  assert.equal(
    shouldPreserveWorkspaceNestedWheel(inside, { nestedSelector: '.nested', boundaryRoot: elsewhere }),
    false,
    '嵌套节点不在边界内就不保留',
  );
  assert.equal(shouldPreserveWorkspaceNestedWheel(inside, { nestedSelector: '.nested' }), true, '没有边界时不做限制');
  assert.equal(shouldPreserveWorkspaceNestedWheel(outside, { nestedSelector: '.nested', boundaryRoot: boundary }), false);
  assert.equal(shouldPreserveWorkspaceNestedWheel(outside, { nestedSelector: '   ' }), false, '空选择器不匹配');
});

test('workspaceWheelNavigation: 祖先可滚时保留原生滚轮，遇到边界或根部停止', () => {
  const root = { parentElement: null, matches: () => false };
  const scrollableParent = {
    parentElement: root,
    matches: () => false,
    scrollHeight: 300,
    clientHeight: 100,
    scrollWidth: 100,
    clientWidth: 100,
  };
  const leaf = { parentElement: scrollableParent, matches: () => false };
  const styleOf = (node) => (node === scrollableParent ? SCROLLABLE : CLIPPED);
  assert.equal(
    shouldPreserveWorkspaceNestedWheel(leaf, {
      nestedSelector: '.nested',
      getComputedStyle: styleOf,
      boundaryRoot: null,
    }),
    true,
  );

  const plainParent = { parentElement: root, matches: () => false };
  const plainLeaf = { parentElement: plainParent, matches: () => false };
  assert.equal(
    shouldPreserveWorkspaceNestedWheel(plainLeaf, {
      nestedSelector: '.nested',
      getComputedStyle: () => CLIPPED,
    }),
    false,
  );
  assert.equal(
    shouldPreserveWorkspaceNestedWheel(plainLeaf, {
      nestedSelector: '.nested',
      getComputedStyle: () => SCROLLABLE,
      boundaryRoot: plainLeaf,
    }),
    false,
    '第一个节点就是边界时直接停，不往上找',
  );
  assert.equal(shouldPreserveWorkspaceNestedWheel(leaf, { nestedSelector: '.nested' }), false, '拿不到 getComputedStyle 就不保留');
});

test('workspaceWheelNavigation: 滚动位置抓取与还原都按非负数归一', () => {
  assert.equal(captureWorkspaceScrollPosition(null), null);
  assert.deepEqual(captureWorkspaceScrollPosition({ scrollTop: 120, scrollLeft: -5 }), { top: 120, left: 0 });
  assert.deepEqual(captureWorkspaceScrollPosition({ scrollTop: '40', scrollLeft: 'nope' }), { top: 40, left: 0 });

  const target = { scrollTop: 0, scrollLeft: 0 };
  assert.equal(restoreWorkspaceScrollPosition(target, { top: 33, left: -2 }), true);
  assert.deepEqual([target.scrollTop, target.scrollLeft], [33, 0]);
  assert.equal(restoreWorkspaceScrollPosition(null, { top: 1, left: 1 }), false);
  assert.equal(restoreWorkspaceScrollPosition(target, null), false);
});

test('workspaceWheelNavigation: 嵌套滚动位置按选择器加序号成对保存与还原', () => {
  const first = createScroller({ top: 10, left: 1 });
  const second = createScroller({ top: 20, left: 2 });
  const container = {
    querySelectorAll: (selector) => (selector === '.pane' ? [first, second] : []),
  };
  const captured = captureWorkspaceNestedScrollPositions(container, ['  .pane  ', '']);
  assert.deepEqual(captured, [
    { selector: '.pane', index: 0, top: 10, left: 1 },
    { selector: '.pane', index: 1, top: 20, left: 2 },
  ]);
  assert.equal(captureWorkspaceNestedScrollPositions(container, []), null);
  assert.equal(captureWorkspaceNestedScrollPositions(null, ['.pane']), null);

  first.scrollTop = 0;
  second.scrollTop = 0;
  assert.equal(restoreWorkspaceNestedScrollPositions(container, captured), true);
  assert.deepEqual([first.scrollTop, first.scrollLeft, second.scrollTop, second.scrollLeft], [10, 1, 20, 2]);
  assert.equal(restoreWorkspaceNestedScrollPositions(container, []), false);
  assert.equal(restoreWorkspaceNestedScrollPositions(container, null), false);
  assert.equal(
    restoreWorkspaceNestedScrollPositions(container, [{ selector: '.missing', index: 0, top: 1, left: 1 }]),
    false,
    '选择器查不到元素时不算成功',
  );
});

test('workspaceWheelNavigation: 轨道滚轮在空选择器时不接管', () => {
  assert.equal(scrollWorkspaceTrackWithWheel({}, ''), false);
  assert.equal(scrollWorkspaceTrackWithWheel({}, '   '), false);
  assert.equal(scrollWorkspaceTrackWithWheel({}, null), false);
});
