// 画布滚轮手势路由。
//
// 这块的坑全在「单位」和「归属」上：deltaMode 不换算会让 Firefox 滚一格跳半屏；
// 归属判错则要么抢走面板的滚动，要么在白板里误缩放。所以每条规则都单独立住。
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findScrollableWheelAncestor,
  resolveCanvasWheelGesture,
  _appCanvasPointerBindingsInternalsForTest as internals,
} from './appCanvasPointerBindings.js';
import {
  CANVAS_WHEEL_BEHAVIOR_PAN,
  CANVAS_WHEEL_BEHAVIOR_ZOOM,
} from '../settings/canvasControlSettings.js';

const VIEWPORT = { width: 1200, height: 800 };

test('appCanvasPointerBindings: 默认行为下滚轮是缩放，delta 归一到像素', () => {
  const zoom = resolveCanvasWheelGesture({ deltaY: 100 }, CANVAS_WHEEL_BEHAVIOR_ZOOM, VIEWPORT);
  (assert.equal(zoom.type, 'zoom'),
    assert.equal(zoom.deltaY, 100),
    assert.equal(zoom.deltaX, undefined, '缩放不该带横向位移'));
  // Firefox 按行上报：deltaMode=1 时一行等于 16px。
  const lines = resolveCanvasWheelGesture(
    { deltaY: 3, deltaMode: 1 },
    CANVAS_WHEEL_BEHAVIOR_ZOOM,
    VIEWPORT
  );
  assert.equal(lines.deltaY, 48, '行模式必须乘 16');
  const pages = resolveCanvasWheelGesture(
    { deltaY: 1, deltaMode: 2 },
    CANVAS_WHEEL_BEHAVIOR_ZOOM,
    VIEWPORT
  );
  assert.equal(pages.deltaY, 800, '页模式按视口高度换算');
});

test('appCanvasPointerBindings: 平移偏好下 Shift 转成横向平移', () => {
  const pan = resolveCanvasWheelGesture({ deltaY: 50 }, CANVAS_WHEEL_BEHAVIOR_PAN, VIEWPORT);
  (assert.equal(pan.type, 'pan'),
    assert.equal(pan.deltaX, 0),
    assert.equal(pan.deltaY, 50, '无修饰键时双向平移'));
  const shifted = resolveCanvasWheelGesture({ deltaY: 50 }, CANVAS_WHEEL_BEHAVIOR_PAN, {
    ...VIEWPORT,
  });
  // 单独验证 Shift：纵向滚动被搬到横轴。
  const withShift = resolveCanvasWheelGesture(
    { deltaY: 50, shiftKey: true },
    CANVAS_WHEEL_BEHAVIOR_PAN,
    VIEWPORT
  );
  (assert.equal(withShift.type, 'pan'),
    assert.equal(withShift.deltaX, 50, 'Shift 时纵滚转横移'),
    assert.equal(withShift.deltaY, 0),
    assert.equal(shifted.type, 'pan'));
});

test('appCanvasPointerBindings: Ctrl/Meta 永远走缩放，不被平移偏好覆盖', () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    const gesture = resolveCanvasWheelGesture(
      { deltaY: 50, ...modifier },
      CANVAS_WHEEL_BEHAVIOR_PAN,
      VIEWPORT
    );
    assert.equal(gesture.type, 'zoom', '捏合语义优先于用户偏好');
  }
});

test('appCanvasPointerBindings: 只滚横轴时也能出位移，非法 delta 归零', () => {
  const horizontal = resolveCanvasWheelGesture(
    { deltaX: 30, deltaY: 0 },
    CANVAS_WHEEL_BEHAVIOR_ZOOM,
    VIEWPORT
  );
  assert.equal(horizontal.deltaY, 30, '纵向为 0 时退化为横向量');
  const invalid = resolveCanvasWheelGesture(
    { deltaY: Number.NaN, deltaX: 'abc' },
    CANVAS_WHEEL_BEHAVIOR_ZOOM,
    VIEWPORT
  );
  assert.equal(invalid.deltaY, 0, '非数字不能变成 NaN 传进缩放');
});

test('appCanvasPointerBindings: 识别真正会滚的祖先容器', () => {
  const scroller = {
    clientHeight: 100,
    scrollHeight: 400,
    clientWidth: 100,
    scrollWidth: 100,
    parentElement: null,
    ownerDocument: {
      defaultView: { getComputedStyle: () => ({ overflowY: 'auto', overflow: 'visible' }) },
    },
  };
  const plainParent = {
    clientHeight: 100,
    scrollHeight: 100,
    clientWidth: 100,
    scrollWidth: 100,
    parentElement: scroller,
    ownerDocument: scroller.ownerDocument,
  };
  const target = { nodeType: 1, parentElement: plainParent };
  assert.equal(
    findScrollableWheelAncestor(target, { id: 'boundary' }, null),
    scroller,
    '内容溢出且 overflow:auto 才算滚动容器'
  );
  // overflow:auto 但内容装得下：不该抢滚轮，否则滚轮「没反应」。
  const notOverflowing = {
    clientHeight: 100,
    scrollHeight: 100,
    clientWidth: 100,
    scrollWidth: 100,
    parentElement: null,
    ownerDocument: scroller.ownerDocument,
  };
  assert.equal(
    findScrollableWheelAncestor({ nodeType: 1, parentElement: notOverflowing }, null, null),
    null
  );
  // 文本节点从父元素起算。
  const textTarget = { nodeType: 3, parentElement: plainParent };
  assert.equal(findScrollableWheelAncestor(textTarget, null, null), scroller);
  // 到边界就停，不能滚到画布外面去。
  assert.equal(findScrollableWheelAncestor(target, scroller, null), null);
});

test('appCanvasPointerBindings: 修饰键写法归一与单修饰键判定', () => {
  (assert.equal(internals.normalizeModifierShortcutToken(' control '), 'Ctrl'),
    assert.equal(internals.normalizeModifierShortcutToken('META'), 'Ctrl'),
    assert.equal(internals.normalizeModifierShortcutToken('option'), 'Alt'),
    assert.equal(internals.normalizeModifierShortcutToken('shift'), 'Shift'),
    assert.equal(internals.normalizeModifierShortcutToken('F5'), '', '普通键不是修饰键'),
    assert.equal(internals.normalizeModifierShortcutToken(null), ''));
  // 用不存在的快捷键 id + 回退键，走的是「配置缺失时用默认修饰键」这条路径。
  (assert.equal(
    internals.isPointerModifierShortcutActive({ ctrlKey: true }, '__no-such-shortcut__', 'ctrl'),
    true,
    'Ctrl 与 Meta 等价'
  ),
    assert.equal(
      internals.isPointerModifierShortcutActive({ metaKey: true }, '__no-such-shortcut__', 'ctrl'),
      true
    ),
    assert.equal(
      internals.isPointerModifierShortcutActive({ altKey: true }, '__no-such-shortcut__', 'alt'),
      true
    ),
    assert.equal(
      internals.isPointerModifierShortcutActive({}, '__no-such-shortcut__', 'alt'),
      false
    ));
});

test('appCanvasPointerBindings: 白板编辑目标与 overflow 取值判定', () => {
  const whiteboardNode = { closest: (selector) => (selector.includes('whiteboard') ? {} : null) };
  (assert.equal(internals.isActiveWhiteboardInteractionTarget(whiteboardNode), true),
    assert.equal(internals.isActiveWhiteboardInteractionTarget({ closest: () => null }), false),
    assert.equal(internals.isActiveWhiteboardInteractionTarget(null), false),
    assert.equal(internals.isScrollableOverflowValue('auto'), true),
    assert.equal(internals.isScrollableOverflowValue('overlay'), true),
    assert.equal(internals.isScrollableOverflowValue('hidden'), false),
    assert.equal(internals.isScrollableOverflowValue('clip'), false));
});

test('appCanvasPointerBindings: Alt+拖拽复制走快捷键表，不硬编码 Alt', () => {
  // 该动作在 shortcuts.js 里登记为 keys: ['Alt'] 且属于 MODIFIER_ONLY_SHORTCUT_ACTIONS。
  // 接线读表而不是读 event.altKey，用户改键位后才能生效。
  assert.equal(
    internals.isPointerModifierShortcutActive({ altKey: true }, 'duplicate-with-edges', 'Alt'),
    true,
    '默认 Alt 生效'
  );
  assert.equal(
    internals.isPointerModifierShortcutActive({ ctrlKey: true }, 'duplicate-with-edges', 'Alt'),
    false,
    '只按住 Ctrl 不该触发复制'
  );
});
