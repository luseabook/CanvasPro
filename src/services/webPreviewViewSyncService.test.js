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

// ---------------------------------------------------------------------------
// buildViewPayload：遮挡判定的最终出口。这一段是 197 批的核心，任何一个分支写反
// 都会表现为「预览该显示时不显示」或「该冻结时乱跳」，所以逐条钉住。
// ---------------------------------------------------------------------------

const VISIBLE_STYLE = { display: 'block', visibility: 'visible', opacity: '1', position: 'static' };
const RECT = { left: 100, top: 100, right: 500, bottom: 400, width: 400, height: 300 };

/** 造一个能进 buildViewPayload 的槽位：盒子 + 可选快照元数据。 */
function buildSlot({ rect = RECT, snapshot = null } = {}) {
  const component = snapshot
    ? {
        classList: { contains: (name) => name === 'has-freeze-snapshot' },
        dataset: {
          webPreviewSnapshotToken: snapshot.token || 'ready',
          webPreviewSnapshotWidth: String(snapshot.width || 0),
          webPreviewSnapshotHeight: String(snapshot.height || 0),
          webPreviewSnapshotZoomFactor: String(snapshot.zoomFactor || 0),
        },
      }
    : null;
  return {
    dataset: { nodeId: 'node-1' },
    hidden: false,
    isConnected: true,
    getBoundingClientRect: () => rect,
    closest: (selector) => {
      if (selector === '.web-preview-component') return component;
      if (selector === '.v2-node') return null;
      return null;
    },
  };
}

function buildPayloadArgs(overrides = {}) {
  return {
    node: { id: 'node-1', browserProfileId: '' },
    tabId: 'tab-1',
    webUrl: 'https://example.com/',
    slot: buildSlot(),
    active: true,
    selected: false,
    canvasZoom: 1,
    interactionState: { frozen: false, showSnapshot: false, deferZoomFactor: false },
    freezeToken: 0,
    fullscreenBlockerRects: [],
    softBlockerRects: [],
    hardBlockerRects: [],
    canvasNodeOccluders: [],
    root: { elementsFromPoint: () => [] },
    canvasSpaceHeld: false,
    pendingPopup: false,
    ...overrides,
  };
}

test('webPreviewViewSyncService: 无遮挡且可交互时可见，且不冻结', async () => {
  const { buildViewPayload } = internalsOf(await load());
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => VISIBLE_STYLE }, () => {
    const payload = buildViewPayload(buildPayloadArgs());
    (assert.equal(payload.visible, true, '干净区域必须可见'),
      assert.deepEqual(payload.bounds, { x: 100, y: 100, width: 400, height: 300 }),
      assert.equal(payload.frozen, false, '没交互也没遮挡，不该冻结'),
      assert.equal(payload.freezeToken, ''),
      assert.equal(payload.showSnapshot, false, '不该用快照'),
      assert.equal(payload.snapshotBounds, null));
  });
});

test('webPreviewViewSyncService: 被硬遮挡时不可见但进入冻结并给出 occlusion 令牌', async () => {
  const { buildViewPayload } = internalsOf(await load());
  const blocker = { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 };
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => VISIBLE_STYLE }, () => {
    const payload = buildViewPayload(buildPayloadArgs({ hardBlockerRects: [blocker] }));
    (assert.equal(payload.visible, false, '被盖住就不该认为可见'),
      assert.equal(payload.frozen, true, '遮挡要进冻结，否则会看到穿透'),
      assert.equal(payload.showSnapshot, true, '冻结时用快照顶住'),
      assert.match(payload.freezeToken, /^occlusion:/, '令牌要标明是遮挡冻结'),
      assert.deepEqual(payload.snapshotBounds, { x: 100, y: 100, width: 400, height: 300 }));
  });
});

test('webPreviewViewSyncService: 更高层画布节点与渲染层命中共用同一套冻结', async () => {
  const { buildViewPayload } = internalsOf(await load());
  const occluder = { element: { id: 'other' }, nodeId: 'other', rect: RECT, zIndex: 40 };
  const style = { ...VISIBLE_STYLE, zIndex: '10' };
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => style }, () => {
    const byCanvas = buildViewPayload(buildPayloadArgs({ canvasNodeOccluders: [occluder] }));
    (assert.equal(byCanvas.visible, false, '被更高节点压住就不该可见'),
      assert.equal(byCanvas.frozen, true),
      assert.match(byCanvas.freezeToken, /^occlusion:/));
    // 渲染层命中：命中栈顶端是别人的面板。
    const foreign = { nodeType: 1, tagName: 'PANEL', hidden: false };
    const byRenderer = buildViewPayload(
      buildPayloadArgs({ root: { elementsFromPoint: () => [foreign] } })
    );
    (assert.equal(byRenderer.visible, false, '渲染层遮挡同样要判为不可见'),
      assert.equal(byRenderer.frozen, true));
  });
});

test('webPreviewViewSyncService: 同尺寸同缩放的 ready 快照直接复用（passive 冻结）', async () => {
  const { buildViewPayload } = internalsOf(await load());
  const slot = buildSlot({ snapshot: { token: 'ready', width: 400, height: 300, zoomFactor: 1 } });
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => VISIBLE_STYLE }, () => {
    const payload = buildViewPayload(buildPayloadArgs({ slot }));
    (assert.equal(payload.visible, false, '有可复用快照就不必重绘'),
      assert.equal(payload.frozen, true),
      assert.match(payload.freezeToken, /^passive:/, '可复用快照记为 passive'),
      assert.equal(payload.snapshotReady, true, '快照要标记为可用'),
      assert.equal(payload.allowReusableSnapshot, true));
  });
  // 缩放对不上就不能复用，必须回到正常渲染。
  const staleSlot = buildSlot({
    snapshot: { token: 'ready', width: 400, height: 300, zoomFactor: 2 },
  });
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => VISIBLE_STYLE }, () => {
    const payload = buildViewPayload(buildPayloadArgs({ slot: staleSlot }));
    (assert.equal(payload.visible, true, '快照失配就正常显示'),
      assert.equal(payload.frozen, false),
      assert.equal(payload.snapshotReady, false));
  });
});

test('webPreviewViewSyncService: 全屏时跳过遮挡判定，缩放固定为 1', async () => {
  const { buildViewPayload } = internalsOf(await load());
  const blocker = { left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800 };
  const slot = buildSlot();
  slot.dataset.webPreviewFullscreen = 'true';
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => VISIBLE_STYLE }, () => {
    const payload = buildViewPayload(
      buildPayloadArgs({ slot, hardBlockerRects: [blocker], canvasZoom: 2.5 })
    );
    (assert.equal(payload.fullscreen, true),
      assert.equal(payload.zoomFactor, 1, '全屏不看画布缩放'),
      assert.equal(payload.deferZoomFactor, false),
      assert.equal(payload.frozen, false, '全屏优先，遮挡不参与冻结判定'));
  });
});

test('webPreviewViewSyncService: 零尺寸元素既不显示也不冻结', async () => {
  // 真实 DOM 里 display:none 的元素包围盒全为 0，buildViewPayload 靠这个判不可见
  // （它不自己查计算样式，避免每帧对每个槽位多做一次 getComputedStyle）。
  const { buildViewPayload } = internalsOf(await load());
  const zeroRect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  withWindow({ innerWidth: 1000, innerHeight: 800, getComputedStyle: () => VISIBLE_STYLE }, () => {
    const payload = buildViewPayload(buildPayloadArgs({ slot: buildSlot({ rect: zeroRect }) }));
    (assert.equal(payload.visible, false, '零尺寸的元素不可见'),
      assert.equal(payload.frozen, false, '本来看不见就没必要冻结'),
      assert.equal(payload.bounds, null));
  });
});
