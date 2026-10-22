// 预览视图同步：0.8.9 新增的遮挡/命中测试与快照令牌。
//
// 这一层没有 DOM 也能测：函数只依赖「像元素的对象」，所以用假元素直接驱动，
// 不引 jsdom。覆盖重点是三处容易被写坏的地方——
//   1. 采样点必须落在视口内（越界或过小会让「有没有被遮住」恒为 false）；
//   2. 快照令牌不一致就不能复用（复用错令牌会显示上一个节点的画面）；
//   3. 平移冻结必须真的能清掉（清不干净预览会永久停在旧帧）。
import test from 'node:test';
import assert from 'node:assert/strict';

const load = () => import('./webPreviewViewSyncService.js');
const internalsOf = (module) => module._webPreviewViewSyncInternalsForTest;

/** 临时替换 globalThis.window，退出时恢复；只提供被测函数用到的字段。 */
function withWindow(fields, run) {
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const previous = globalThis.window;
  globalThis.window = { ...(previous || {}), ...fields };
  try {
    return run();
  } finally {
    if (hadWindow) globalThis.window = previous;
    else delete globalThis.window;
  }
}

function fakeSlot({ token = '', width = 0, height = 0, zoomFactor = 0, hasSnapshot = true } = {}) {
  const component = {
    classList: { contains: (name) => hasSnapshot && name === 'has-freeze-snapshot' },
    dataset: {
      webPreviewSnapshotToken: token,
      webPreviewSnapshotWidth: String(width),
      webPreviewSnapshotHeight: String(height),
      webPreviewSnapshotZoomFactor: String(zoomFactor),
    },
  };
  return { closest: (selector) => (selector === '.web-preview-component' ? component : null) };
}

test('webPreviewViewSyncService: z-index 解析只接受整数，auto 与非法值归零', async () => {
  const { parseStackingZIndex } = internalsOf(await load());
  (assert.equal(parseStackingZIndex('12'), 12),
    assert.equal(parseStackingZIndex(' auto '), 0, 'auto 不能当成层级'),
    assert.equal(parseStackingZIndex(''), 0),
    assert.equal(parseStackingZIndex(null), 0),
    assert.equal(parseStackingZIndex('abc'), 0, 'NaN 必须归零，否则比较全乱'),
    assert.equal(parseStackingZIndex('-3'), -3, '负层级是合法的'));
});

test('webPreviewViewSyncService: 不可见元素的 z-index 为 null（不参与比较）', async () => {
  const { getElementZIndex } = internalsOf(await load());
  const element = { style: {} };
  withWindow(
    { getComputedStyle: () => ({ display: 'none', visibility: 'visible', opacity: '1' }) },
    () => assert.equal(getElementZIndex(element), null, 'display:none 视为不可见')
  );
  withWindow(
    { getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '0' }) },
    () => assert.equal(getElementZIndex(element), null, 'opacity:0 视为不可见')
  );
  withWindow(
    {
      getComputedStyle: () => ({
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        zIndex: '7',
      }),
    },
    () => assert.equal(getElementZIndex(element), 7)
  );
  // 计算样式里没有 z-index 时退回内联样式，否则显式设置的元素会被当成 0 层。
  withWindow({ getComputedStyle: () => ({ display: 'block', opacity: '1' }) }, () => {
    element.style = { zIndex: '30' };
    assert.equal(getElementZIndex(element), 30);
  });
});

test('webPreviewViewSyncService: 采样点裁剪到视口内，过小的可见区域不采样', async () => {
  const { getDomOcclusionSamplePoints } = internalsOf(await load());
  withWindow({ innerWidth: 1000, innerHeight: 800 }, () => {
    const points = getDomOcclusionSamplePoints({ left: -200, top: -100, right: 600, bottom: 400 });
    assert.ok(points.length > 0, '有可见区域就要出采样点');
    assert.ok(
      points.every((point) => point.x >= 0 && point.x <= 1000 && point.y >= 0 && point.y <= 800),
      '采样点不能落到视口外'
    );
    assert.deepEqual(
      getDomOcclusionSamplePoints({ left: 0, top: 0, right: 8, bottom: 8 }),
      [],
      '小于最小可见尺寸直接放弃'
    );
    assert.deepEqual(
      getDomOcclusionSamplePoints({ left: 1200, top: 900, right: 1400, bottom: 1000 }),
      [],
      '完全在视口外的矩形没有采样点'
    );
  });
  withWindow({ innerWidth: 0, innerHeight: 0 }, () =>
    assert.deepEqual(
      getDomOcclusionSamplePoints({ left: 0, top: 0, right: 100, bottom: 100 }),
      [],
      '视口尺寸拿不到时返回空，不能瞎采样'
    )
  );
});

test('webPreviewViewSyncService: 快照令牌与尺寸都要对上才算可复用', async () => {
  const { getSlotSnapshotToken, getSlotSnapshotMetrics, readySnapshotMatchesBounds } = internalsOf(
    await load()
  );
  const slot = fakeSlot({ token: 'ready', width: 640, height: 360, zoomFactor: 1.5 });
  (assert.equal(getSlotSnapshotToken(slot), 'ready'),
    assert.deepEqual(getSlotSnapshotMetrics(slot), { width: 640, height: 360, zoomFactor: 1.5 }),
    assert.equal(
      readySnapshotMatchesBounds(slot, { width: 640, height: 360 }, 1.5),
      true,
      '尺寸与缩放一致就复用'
    ),
    assert.equal(
      readySnapshotMatchesBounds(slot, { width: 641, height: 360 }, 1.5),
      false,
      '尺寸不同不能复用'
    ),
    assert.equal(
      readySnapshotMatchesBounds(slot, { width: 640, height: 360 }, 2),
      false,
      '缩放不同不能复用'
    ),
    assert.equal(readySnapshotMatchesBounds(slot, null, 1.5), false, '没有目标区域就不复用'));
  const stale = fakeSlot({ token: 'pending', width: 640, height: 360, zoomFactor: 1.5 });
  assert.equal(
    readySnapshotMatchesBounds(stale, { width: 640, height: 360 }, 1.5),
    false,
    '令牌不是 ready 一律不复用'
  );
  const missingMetrics = fakeSlot({ token: 'ready', width: 0, height: 0, zoomFactor: 0 });
  (assert.equal(getSlotSnapshotMetrics(missingMetrics), null, '元数据不全视为没有快照'),
    assert.equal(readySnapshotMatchesBounds(missingMetrics, { width: 10, height: 10 }, 1), false));
});

test('webPreviewViewSyncService: 平移冻结能起效、能清掉、到期会收尾', async () => {
  const { isPendingPanFreezeActive, startPendingPanFreeze, clearPendingPanFreeze } = internalsOf(
    await load()
  );
  const controller = { pendingPanFreezeUntil: 0, pendingPanFreezeTimer: null, finalSyncs: 0 };
  controller.scheduleFinalSync = () => {
    controller.finalSyncs += 1;
  };
  startPendingPanFreeze(controller);
  (assert.equal(isPendingPanFreezeActive(controller), true, '启动后立即生效'),
    assert.ok(controller.pendingPanFreezeTimer, '必须挂定时器'));
  clearPendingPanFreeze(controller);
  (assert.equal(controller.pendingPanFreezeTimer, null, '清理要连定时器一起清'),
    assert.equal(controller.pendingPanFreezeUntil, 0, '并把截止时间归零'),
    assert.equal(isPendingPanFreezeActive(controller), false));
  // 落空参数不该抛：初始化早期 controller 可能还没建好。
  (assert.equal(isPendingPanFreezeActive(null), false),
    assert.equal(clearPendingPanFreeze(null), undefined),
    assert.equal(startPendingPanFreeze(null), undefined));
});

test('webPreviewViewSyncService: 命中栈顶端属于别人就判定被渲染层遮挡', async () => {
  const { isOccludedByRendererStack } = internalsOf(await load());
  const slotChild = { nodeType: 1, tagName: 'DIV', hidden: false };
  const slot = {
    contains: (element) => element === slotChild,
    closest: () => null,
  };
  const foreignElement = { nodeType: 1, tagName: 'PANEL', hidden: false };
  const cssVisible = { display: 'block', visibility: 'visible', opacity: '1' };

  withWindow({ innerWidth: 800, innerHeight: 600, getComputedStyle: () => cssVisible }, () => {
    const rect = { left: 100, top: 100, right: 500, bottom: 400 };
    assert.equal(
      isOccludedByRendererStack(slot, rect, { elementsFromPoint: () => [slotChild] }),
      false,
      '命中的是自己，不算遮挡'
    );
    assert.equal(
      isOccludedByRendererStack(slot, rect, { elementsFromPoint: () => [foreignElement] }),
      true,
      '命中的是别人的面板，算遮挡'
    );
    // html/body 是兜底元素，说明采样点下面没有内容，不算遮挡。
    assert.equal(
      isOccludedByRendererStack(slot, rect, {
        elementsFromPoint: () => [{ nodeType: 1, tagName: 'HTML', hidden: false }],
      }),
      false,
      '文档根不算遮挡者'
    );
    assert.equal(
      isOccludedByRendererStack(slot, rect, {}),
      false,
      '拿不到 elementsFromPoint 时按「无数据」处理'
    );
  });
});

test('webPreviewViewSyncService: 只被更高层且相交的节点遮挡', async () => {
  const { isOccludedByHigherCanvasNode } = internalsOf(await load());
  const host = { dataset: { nodeId: 'self' } };
  const slot = { dataset: { nodeId: 'self' }, closest: () => host };
  const rect = { left: 0, top: 0, right: 100, bottom: 100 };
  const style = {
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    zIndex: '10',
    position: 'absolute',
  };
  withWindow({ getComputedStyle: () => style }, () => {
    const overlapping = { element: { id: 'other' }, nodeId: 'other', rect, zIndex: 20 };
    const farAway = {
      element: { id: 'far' },
      nodeId: 'far',
      rect: { left: 500, top: 500, right: 600, bottom: 600 },
      zIndex: 20,
    };
    const lower = { element: { id: 'low' }, nodeId: 'low', rect, zIndex: 5 };
    (assert.equal(isOccludedByHigherCanvasNode(slot, rect, [overlapping]), true),
      assert.equal(isOccludedByHigherCanvasNode(slot, rect, [farAway]), false, '不相交不算遮挡'),
      assert.equal(isOccludedByHigherCanvasNode(slot, rect, [lower]), false, '层级更低不算遮挡'),
      assert.equal(isOccludedByHigherCanvasNode(slot, rect, []), false),
      assert.equal(isOccludedByHigherCanvasNode(null, rect, [overlapping]), false));
  });
});

test('webPreviewViewSyncService: 遮挡物收集跳过不可见与无尺寸的节点', async () => {
  const { collectCanvasNodeOccluders } = internalsOf(await load());
  const visibleNode = {
    dataset: { nodeId: 'node-a' },
    closest: () => null,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    }),
  };
  const hiddenNode = {
    dataset: { nodeId: 'node-b' },
    hidden: true,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 100, height: 100 }),
  };
  const zeroSized = {
    dataset: { nodeId: 'node-c' },
    closest: () => null,
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
  };
  const root = { querySelectorAll: () => [visibleNode, hiddenNode, zeroSized] };
  withWindow(
    {
      innerWidth: 1000,
      innerHeight: 800,
      getComputedStyle: () => ({
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        zIndex: '5',
      }),
    },
    () => {
      const occluders = collectCanvasNodeOccluders(root);
      (assert.equal(occluders.length, 1, '只保留可见且有尺寸的节点'),
        assert.equal(occluders[0].nodeId, 'node-a'),
        assert.equal(occluders[0].zIndex, 5));
    }
  );
});

test('webPreviewViewSyncService: 图状态优先走 getStateRaw，避免把追踪器卷进订阅', async () => {
  const { readGraphStoreState } = internalsOf(await load());
  let rawCalls = 0;
  let stateCalls = 0;
  const store = {
    getStateRaw: () => {
      rawCalls += 1;
      return { nodes: { a: 1 } };
    },
    getState: () => {
      stateCalls += 1;
      return { nodes: { b: 2 } };
    },
  };
  assert.deepEqual(readGraphStoreState(store), { nodes: { a: 1 } });
  assert.deepEqual([rawCalls, stateCalls], [1, 0], '有 getStateRaw 就不该调 getState');
  const legacyStore = { getState: () => ({ nodes: { c: 3 } }) };
  assert.deepEqual(readGraphStoreState(legacyStore), { nodes: { c: 3 } }, '老存储退回 getState');
  assert.deepEqual(readGraphStoreState(null), {}, '空存储给空对象而不是抛');
});

test('webPreviewViewSyncService: 活跃节点追踪只在持久化版本变化时重算', async () => {
  const { createWebPreviewNodeActivityTracker } = await load();
  let revision = 1;
  // 节点的标签页字段是 webTabs（不是 tabs），url 必须能过 normalizeWebPreviewUrl，
  // 否则归一化会造出一个空标签页，让「活跃」判定恒为 false。
  const webPreviewNode = {
    type: 'web-preview',
    webTabs: [{ id: 'tab-1', title: '示例', url: 'https://example.com' }],
  };
  const store = {
    state: { _persistRev: revision, nodes: { a: webPreviewNode } },
    getStateRaw() {
      return this.state;
    },
  };
  const tracker = createWebPreviewNodeActivityTracker(store);
  assert.equal(tracker.hasActiveNodes, true, '构造时就要算出初值');

  // 版本号没变 → 不重算：把状态换成「无活跃节点」但版本不动，结果必须仍是 true。
  store.state = { _persistRev: revision, nodes: {} };
  assert.equal(tracker.refresh(), true, '版本未变不重算，这是每帧调用的前提');

  revision = 2;
  store.state = { _persistRev: revision, nodes: {} };
  assert.equal(tracker.refresh(), false, '版本变化后要重新判定');
  assert.equal(tracker.hasActiveNodes, false);
});

test('webPreviewViewSyncService: 上下文菜单快捷键只收 context-web- 前缀', async () => {
  const { collectWebPreviewContextMenuShortcuts } = await load();
  const shortcuts = collectWebPreviewContextMenuShortcuts();
  const ids = Object.keys(shortcuts);
  assert.ok(ids.length > 0, '至少要有几个预览右键快捷键');
  assert.ok(
    ids.every((id) => id.startsWith('context-web-')),
    '不能把别的域的快捷键混进来'
  );
});
