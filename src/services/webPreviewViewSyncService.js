import { normalizeWebPreviewUrl } from '../modules/webPreviewUrl.js';
import { normalizeWebPreviewTabs } from '../modules/webPreviewTabs.js';
import { isViewportPanPreviewActive, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../core/viewportPanPreview.js';
const SOFT_OCCLUSION_SELECTOR = '.header',
  HARD_OCCLUSION_SELECTOR =
    '#settingsOverlay, #aboutOverlay, #feedbackGroupOverlay, #v2PickerOverlay, #nodePickerOverlay, .settings-overlay, .save-dialog-overlay.open, .preset-modal-overlay, .custom-confirm-overlay, .v2-asset-sidebar-panel.show, .v2-workflow-sidebar-panel.show, .sidebar-floating #avatarMenu.open, .sidebar-floating .avatar-menu.open, .node-add-menu, .v2-node-picker, .canvas-proj-dropdown, .web-preview-image-picker-overlay',
  FULLSCREEN_OCCLUSION_SELECTOR = '.web-preview-image-picker-overlay',
  OCCLUSION_OBSERVER_SELECTOR = [
    SOFT_OCCLUSION_SELECTOR,
    HARD_OCCLUSION_SELECTOR,
    '.sidebar-floating, .canvas-controls-floating, .minimap-wrapper, .save-dialog-overlay, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel, .v2-crop-overlay, .v2-annotate-overlay, .v2-matting-overlay, .v2-expand-overlay',
    FULLSCREEN_OCCLUSION_SELECTOR,
  ].join(', '),
  BACKGROUND_SYNC_INTERVAL_MS = 50,
  FINAL_INTERACTION_SYNC_DELAY_MS = 40,
  FREEZE_SETTLE_HOLD_MS = 360,
  MIN_VISIBLE_INTERSECTION_SIZE = 16,
  SOFT_OCCLUSION_HIDE_RATIO = 0.35,
  FREEZE_ACTIVE_BODY_CLASS = 'is-web-preview-freeze-active',
  FREEZE_SETTLING_BODY_CLASS = 'is-web-preview-freeze-settling',
  WEB_PREVIEW_FREEZE_BODY_CLASSES = new Set([FREEZE_ACTIVE_BODY_CLASS, FREEZE_SETTLING_BODY_CLASS]),
  registeredSlotsByNodeId = new Map();
function normalizeNodeId(value) {
  return String(value || '').trim();
}
function getViewKey(options = {}) {
  return normalizeNodeId(options.nodeId) + '\n' + String(options.tabId || '').trim();
}
function getNowMs() {
  const item = globalThis.performance?.now?.();
  return Number.isFinite(item) ? item : Date.now();
}
function readCanvasSpaceHeld() {
  return globalThis.window?._spaceHeld === true;
}
function getRequestAnimationFrame() {
  return globalThis.window?.requestAnimationFrame?.bind(globalThis.window) || ((key) => setTimeout(key, 16));
}
function getCancelAnimationFrame() {
  return globalThis.window?.cancelAnimationFrame?.bind(globalThis.window) || clearTimeout;
}
function rectIntersects(box, box2) {
  return box.left < box2.right && box.right > box2.left && box.top < box2.bottom && box.bottom > box2.top;
}
function getRectArea(box3) {
  return Math.max(0, Number(box3?.width) || 0) * Math.max(0, Number(box3?.height) || 0);
}
function getIntersectionArea(box4, box5) {
  if (!rectIntersects(box4, box5)) return 0;
  const index = Math.min(box4.right, box5.right) - Math.max(box4.left, box5.left),
    result = Math.min(box4.bottom, box5.bottom) - Math.max(box4.top, box5.top);
  return Math.max(0, index) * Math.max(0, result);
}
function hasVisibleViewportIntersection(box6) {
  const count = Number(box6?.width) || 0,
    count2 = Number(box6?.height) || 0;
  if (count < 16 || count2 < 16) return false;
  const data = globalThis.window || {},
    count3 = Number(data.innerWidth) || 0,
    count4 = Number(data.innerHeight) || 0;
  if (count3 <= 0 || count4 <= 0) return false;
  const target = Math.min(box6.right, count3) - Math.max(box6.left, 0),
    source = Math.min(box6.bottom, count4) - Math.max(box6.top, 0);
  return target >= MIN_VISIBLE_INTERSECTION_SIZE && source >= MIN_VISIBLE_INTERSECTION_SIZE;
}
function collectOcclusionRects(el = document, next = SOFT_OCCLUSION_SELECTOR) {
  const current = el.querySelectorAll?.(next) || [],
    list = [];
  for (const el2 of current) {
    if (!el2 || el2.hidden) continue;
    const entry = globalThis.window?.getComputedStyle?.(el2);
    if (entry?.display === 'none' || entry?.visibility === 'hidden') continue;
    const count5 = Number(entry?.opacity);
    if (Number.isFinite(count5) && count5 <= 0) continue;
    if (entry?.pointerEvents === 'none') continue;
    const record = el2.getBoundingClientRect?.();
    if (record) list.push(record);
  }
  return list;
}
function isOccludedByRects(payload, list2 = []) {
  return list2.some((item2) => rectIntersects(payload, item2));
}
function isSignificantlyOccludedByRects(handle, state = []) {
  const rectArea = getRectArea(handle);
  if (rectArea <= 0) return false;
  let config = 0;
  for (const scope of state) {
    config += getIntersectionArea(handle, scope);
    if (config / rectArea >= SOFT_OCCLUSION_HIDE_RATIO) return true;
  }
  return false;
}
function nodeMatchesOcclusionSelector(el3) {
  if (!el3 || el3.nodeType === 3) return false;
  try {
    if (typeof el3.matches === 'function' && el3.matches(OCCLUSION_OBSERVER_SELECTOR)) return true;
    return Boolean(el3.querySelector?.(OCCLUSION_OBSERVER_SELECTOR));
  } catch {
    return false;
  }
}
function isCanvasPanSurfaceTarget(el4) {
  if (!el4) return false;
  const input = globalThis.document?.getElementById?.('v2-wrap');
  if (input?.contains?.(el4)) return true;
  return Boolean(el4.closest?.('.side-plus-btn'));
}
function isPotentialCanvasPanStartEvent(event) {
  if (!isCanvasPanSurfaceTarget(event?.target)) return false;
  const count6 = Number(event?.button);
  if (count6 === 1) return true;
  return count6 === 0 && globalThis.window?._spaceHeld === true;
}
function isNativePanStartPreviewEvent(output) {
  return output?.type === 'pan-start-preview';
}
function normalizeObservedClassName(value2 = '') {
  return String(value2 || '')
    .split(/\s+/)
    .map((item3) => item3.trim())
    .filter((item4) => item4 && !WEB_PREVIEW_FREEZE_BODY_CLASSES.has(item4))
    .sort()
    .join(' ');
}
function isOwnFreezeClassMutation(event2) {
  if (event2?.type !== 'attributes' || event2?.attributeName !== 'class') return false;
  if (event2.target !== globalThis.document?.body) return false;
  return normalizeObservedClassName(event2.oldValue) === normalizeObservedClassName(event2.target?.className);
}
function shouldSyncForOcclusionMutation(list3 = []) {
  for (const event3 of list3) {
    if (isOwnFreezeClassMutation(event3)) continue;
    if (nodeMatchesOcclusionSelector(event3?.target)) return true;
    for (const value3 of event3?.addedNodes || []) {
      if (nodeMatchesOcclusionSelector(value3)) return true;
    }
    for (const value4 of event3?.removedNodes || []) {
      if (nodeMatchesOcclusionSelector(value4)) return true;
    }
  }
  return false;
}
function appendSlotToIndex(map, el5) {
  const enabled = el5?.dataset?.nodeId;
  if (!enabled) return;
  const enabled2 = map.get(enabled);
  if (el5.dataset.webPreviewFullscreen === 'true') {
    map.set(enabled, el5);
    return;
  }
  if (!enabled2) map.set(enabled, el5);
}
function buildSlotIndex(el6 = document, list4 = []) {
  const map2 = new Map(),
    map3 = new Set();
  for (const value5 of registeredSlotsByNodeId.values()) {
    for (const el7 of value5) {
      if (!el7 || el7.isConnected === false || map3.has(el7)) continue;
      (map3.add(el7), appendSlotToIndex(map2, el7));
    }
  }
  if (list4.length > 0 && list4.every((item5) => map2.has(item5))) return map2;
  const value6 = el6.querySelectorAll?.("[data-web-preview-slot='true']") || [];
  for (const enabled3 of value6) {
    if (!enabled3 || map3.has(enabled3)) continue;
    (map3.add(enabled3), appendSlotToIndex(map2, enabled3));
  }
  return map2;
}
export function registerWebPreviewSlot(value7, enabled4) {
  const nodeId = normalizeNodeId(value7);
  if (!nodeId || !enabled4) return () => {};
  let enabled5 = registeredSlotsByNodeId.get(nodeId);
  return (
    !enabled5 && ((enabled5 = new Set()), registeredSlotsByNodeId.set(nodeId, enabled5)),
    enabled5.add(enabled4),
    () => {
      const map4 = registeredSlotsByNodeId.get(nodeId);
      if (!map4) return;
      map4.delete(enabled4);
      if (map4.size === 0) registeredSlotsByNodeId.delete(nodeId);
    }
  );
}
export function _clearWebPreviewSlotRegistryForTest() {
  registeredSlotsByNodeId.clear();
}
function hasActiveWebPreviewNodes(store) {
  const value8 = typeof store?.getStateRaw === 'function' ? store.getStateRaw() : store?.getState?.() || {};
  return Object.values(value8.nodes || {}).some(
    (item6) =>
      item6?.type === 'web-preview' &&
      normalizeWebPreviewTabs(item6).tabs.some(
        (response) => normalizeWebPreviewUrl(response.url) || response.pendingPopup === true,
      ),
  );
}
function normalizeCanvasZoom(value9) {
  const count7 = Number(value9);
  if (!Number.isFinite(count7) || count7 <= 0) return 1;
  return Math.min(5, Math.max(0.25, count7));
}
function getCanvasInteractionState() {
  const value10 = globalThis.document?.body?.classList,
    frozen = Boolean(value10?.contains?.('is-viewport-animating'));
  return {
    frozen: frozen,
    deferZoomFactor: frozen,
    settleSnapshot: frozen,
    showSnapshot: frozen,
  };
}
function getSlotFullscreen(el8) {
  return el8?.dataset?.webPreviewFullscreen === 'true';
}
function getSlotSnapshotComponent(el9) {
  return el9?.closest?.('.web-preview-component') || null;
}
function getSlotSnapshotReady(value11, value12 = '', { allowAnyToken: allowAnyToken = false } = {}) {
  const el10 = getSlotSnapshotComponent(value11);
  if (!el10?.classList?.contains?.('has-freeze-snapshot')) return false;
  if (allowAnyToken) return true;
  const enabled6 = String(value12 || '').trim();
  if (!enabled6) return true;
  const value13 = String(el10?.dataset?.webPreviewSnapshotToken || '').trim();
  return value13 === enabled6;
}
function getSlotSnapshotHold(value14) {
  return Boolean(getSlotSnapshotComponent(value14)?.classList?.contains?.('is-web-preview-loading'));
}
function buildViewPayload({
  node: node,
  tabId: tabId,
  webUrl: webUrl,
  slot: slot,
  active: active,
  selected: selected,
  canvasZoom: canvasZoom,
  interactionState: interactionState2,
  freezeToken: freezeToken2,
  fullscreenBlockerRects: fullscreenBlockerRects,
  softBlockerRects: softBlockerRects,
  hardBlockerRects: hardBlockerRects,
  canvasSpaceHeld: canvasSpaceHeld = false,
  pendingPopup: pendingPopup = false,
}) {
  let visible = false,
    bounds = null;
  const zoomFactor = getSlotFullscreen(slot);
  if (slot?.isConnected !== false) {
    const box7 = slot?.getBoundingClientRect?.(),
      enabled7 = box7 ? isOccludedByRects(box7, fullscreenBlockerRects) : false,
      enabled8 = box7 && !zoomFactor ? isOccludedByRects(box7, hardBlockerRects) : false,
      enabled9 = box7 && !zoomFactor ? isSignificantlyOccludedByRects(box7, softBlockerRects) : false;
    box7 &&
      hasVisibleViewportIntersection(box7) &&
      !enabled7 &&
      !enabled8 &&
      !enabled9 &&
      ((visible = true),
      (bounds = {
        x: Math.round(box7.left),
        y: Math.round(box7.top),
        width: Math.round(box7.width),
        height: Math.round(box7.height),
      }));
  }
  const snapshotHold = getSlotSnapshotHold(slot),
    frozen2 = Boolean((interactionState2.frozen || snapshotHold) && !zoomFactor && visible),
    freezeToken3 = frozen2 ? String(freezeToken2 || '0') : '',
    snapshotReady = Boolean(frozen2 && (interactionState2.showSnapshot || snapshotHold)),
    allowAnyToken2 = snapshotReady || snapshotHold;
  return {
    nodeId: node.id,
    tabId: tabId,
    webUrl: webUrl,
    pendingPopup: pendingPopup,
    browserProfileId: node.browserProfileId || '',
    active: active,
    visible: visible,
    bounds: bounds,
    zoomFactor: zoomFactor ? 1 : canvasZoom,
    deferZoomFactor: zoomFactor ? false : interactionState2.deferZoomFactor,
    frozen: frozen2,
    freezeToken: freezeToken3,
    snapshotReady: snapshotReady
      ? getSlotSnapshotReady(slot, freezeToken3, { allowAnyToken: allowAnyToken2 })
      : false,
    snapshotHold: snapshotHold,
    showSnapshot: snapshotReady,
    fullscreen: zoomFactor,
    selected: selected,
    canvasSpaceHeld: canvasSpaceHeld === true,
  };
}
function syncCachedViewsForBudget(list5, args) {
  if (!args) return list5;
  const nowMs = getNowMs(),
    enabled10 = list5.some((item7) => item7?.frozen || item7?.deferZoomFactor),
    map5 = new Set(list5.map(getViewKey));
  for (const value15 of [...args.cachedViewsByNodeId.keys()]) {
    if (!map5.has(value15)) args.cachedViewsByNodeId.delete(value15);
  }
  if (!enabled10) {
    args.lastBackgroundSyncAt = nowMs;
    for (const value16 of list5) args.cachedViewsByNodeId.set(getViewKey(value16), value16);
    return list5;
  }
  const value17 = nowMs - args.lastBackgroundSyncAt >= BACKGROUND_SYNC_INTERVAL_MS;
  if (value17) args.lastBackgroundSyncAt = nowMs;
  return list5.map((selected2) => {
    const viewKey = getViewKey(selected2),
      syncPriority = args.cachedViewsByNodeId.get(viewKey),
      value18 =
        selected2.frozen === true &&
        selected2.visible === true &&
        syncPriority?.visible === true &&
        syncPriority?.bounds &&
        syncPriority.webUrl === selected2.webUrl &&
        syncPriority.pendingPopup === selected2.pendingPopup &&
        syncPriority.active === selected2.active;
    if (value18) {
      const value19 = {
        ...syncPriority,
        selected: selected2.selected,
        zoomFactor: selected2.zoomFactor,
        deferZoomFactor: selected2.deferZoomFactor,
        frozen: true,
        freezeToken: selected2.freezeToken,
        snapshotReady: selected2.snapshotReady,
        snapshotHold: selected2.snapshotHold,
        showSnapshot: selected2.showSnapshot,
        syncPriority: syncPriority.frozen === true ? 'background-throttled' : undefined,
      };
      return (args.cachedViewsByNodeId.set(viewKey, value19), value19);
    }
    const value20 = value17 && selected2.frozen !== true,
      value21 = selected2.deferZoomFactor === true && selected2.frozen !== true && selected2.visible === true,
      value22 =
        selected2.fullscreen ||
        (selected2.selected && !selected2.frozen) ||
        value21 ||
        value20 ||
        !syncPriority ||
        syncPriority.active !== selected2.active ||
        syncPriority.webUrl !== selected2.webUrl ||
        syncPriority.pendingPopup !== selected2.pendingPopup ||
        syncPriority.visible !== selected2.visible ||
        syncPriority.frozen !== selected2.frozen ||
        syncPriority.freezeToken !== selected2.freezeToken ||
        syncPriority.snapshotReady !== selected2.snapshotReady ||
        syncPriority.snapshotHold !== selected2.snapshotHold;
    if (value22) return (args.cachedViewsByNodeId.set(viewKey, selected2), selected2);
    return {
      ...syncPriority,
      webUrl: selected2.webUrl,
      pendingPopup: selected2.pendingPopup,
      active: selected2.active,
      selected: selected2.selected,
      zoomFactor: selected2.zoomFactor,
      deferZoomFactor: selected2.deferZoomFactor,
      frozen: selected2.frozen,
      freezeToken: selected2.freezeToken,
      snapshotReady: selected2.snapshotReady,
      snapshotHold: selected2.snapshotHold,
      showSnapshot: selected2.showSnapshot,
      syncPriority: 'background-throttled',
    };
  });
}
function buildViewsSignature(list6 = []) {
  return list6
    .map((item8) => {
      const box8 = item8?.bounds || {};
      return [
        item8?.nodeId || '',
        item8?.tabId || '',
        item8?.webUrl || '',
        item8?.pendingPopup === true ? 1 : 0,
        item8?.browserProfileId || '',
        item8?.active === true ? 1 : 0,
        item8?.visible === true ? 1 : 0,
        Number(box8.x || 0),
        Number(box8.y || 0),
        Number(box8.width || 0),
        Number(box8.height || 0),
        Number(item8?.zoomFactor || 1).toFixed(3),
        item8?.deferZoomFactor === true ? 1 : 0,
        item8?.frozen === true ? 1 : 0,
        item8?.freezeToken || '',
        item8?.snapshotReady === true ? 1 : 0,
        item8?.snapshotHold === true ? 1 : 0,
        item8?.showSnapshot === true ? 1 : 0,
        item8?.fullscreen === true ? 1 : 0,
        item8?.selected === true ? 1 : 0,
        item8?.canvasSpaceHeld === true ? 1 : 0,
      ].join(':');
    })
    .join('|');
}
function clearFinalSyncTimer(enabled11) {
  if (!enabled11?.finalSyncTimer) return;
  (clearTimeout(enabled11.finalSyncTimer), (enabled11.finalSyncTimer = null));
}
function setBodyClass(value23, value24) {
  const el11 = globalThis.document?.body?.classList;
  if (!el11) return;
  const enabled12 = Boolean(el11.contains?.(value23));
  if (value24) {
    if (!enabled12) el11.add?.(value23);
  } else enabled12 && el11.remove?.(value23);
}
function setFreezeActiveClass(value25) {
  setBodyClass(FREEZE_ACTIVE_BODY_CLASS, value25);
}
function setFreezeSettlingClass(value26) {
  setBodyClass(FREEZE_SETTLING_BODY_CLASS, value26);
}
function clearFreezeSettlingTimer(enabled13) {
  if (!enabled13?.freezeSettlingTimer) return;
  (clearTimeout(enabled13.freezeSettlingTimer), (enabled13.freezeSettlingTimer = null));
}
function scheduleFreezeSettlingClear(enabled14) {
  if (!enabled14) return;
  (setFreezeSettlingClass(true),
    clearFreezeSettlingTimer(enabled14),
    (enabled14.freezeSettlingUntil = getNowMs() + FREEZE_SETTLE_HOLD_MS),
    (enabled14.freezeSettlingTimer = setTimeout(() => {
      ((enabled14.freezeSettlingTimer = null),
        (enabled14.freezeSettlingUntil = 0),
        setFreezeSettlingClass(false));
      if (!getCanvasInteractionState().frozen) setFreezeActiveClass(false);
      enabled14.scheduleFinalSync();
    }, FREEZE_SETTLE_HOLD_MS)));
}
function createSyncBudgetState(handler) {
  const value27 = {
    cachedViewsByNodeId: new Map(),
    finalSyncTimer: null,
    freezeSettlingTimer: null,
    freezeSettlingUntil: 0,
    freezeActive: false,
    snapshotFreezeActive: false,
    snapshotSettleActive: false,
    canvasSpaceHeld: readCanvasSpaceHeld(),
    freezeToken: 0,
    lastBackgroundSyncAt: 0,
    lastViewsSignature: '',
    scheduleFinalSync() {
      (clearFinalSyncTimer(value27),
        (value27.finalSyncTimer = setTimeout(() => {
          ((value27.finalSyncTimer = null), handler());
        }, FINAL_INTERACTION_SYNC_DELAY_MS)));
    },
  };
  return value27;
}
function markInteractionTransition(enabled15, value28) {
  if (!enabled15) return;
  const enabled16 = Boolean(value28?.frozen),
    value29 = Boolean(value28?.showSnapshot),
    value30 = Boolean(value28?.settleSnapshot),
    value31 = enabled16 && !enabled15.freezeActive,
    value32 = enabled16 && value29 && !enabled15.snapshotFreezeActive;
  if (value31 || value32)
    (clearFreezeSettlingTimer(enabled15),
      (enabled15.freezeSettlingUntil = 0),
      setFreezeSettlingClass(false),
      (enabled15.freezeToken += 1),
      (enabled15.lastBackgroundSyncAt = 0));
  else
    !enabled16 &&
      enabled15.freezeActive &&
      ((enabled15.lastBackgroundSyncAt = 0),
      enabled15.snapshotSettleActive
        ? scheduleFreezeSettlingClear(enabled15)
        : ((enabled15.freezeSettlingUntil = 0),
          setFreezeSettlingClass(false),
          setFreezeActiveClass(false),
          enabled15.scheduleFinalSync()));
  ((enabled15.freezeActive = enabled16),
    (enabled15.snapshotFreezeActive = enabled16 && value29),
    (enabled15.snapshotSettleActive = enabled16 && value30));
}
function getEffectiveInteractionState(enabled17, value33) {
  const enabled18 = !enabled17?.frozen && Number(value33?.freezeSettlingUntil || 0) > getNowMs();
  if (!enabled18) return enabled17;
  return { frozen: true, deferZoomFactor: true, settleSnapshot: true, showSnapshot: true };
}
function collectWebPreviewViews({
  graphStore: graphStore,
  root: root = document,
  freezeToken: freezeToken = 0,
  interactionState: interactionState = getCanvasInteractionState(),
  canvasSpaceHeld: canvasSpaceHeld = readCanvasSpaceHeld(),
} = {}) {
  const value34 =
      typeof graphStore?.getStateRaw === 'function'
        ? graphStore.getStateRaw()
        : graphStore?.getState?.() || {},
    map6 = new Set(value34.selectedNodeIds || []),
    list7 = Object.values(value34.nodes || {})
      .filter((item9) => item9?.type === 'web-preview')
      .map((node2) => {
        const tabState = normalizeWebPreviewTabs(node2);
        return {
          node: node2,
          tabState: tabState,
          tabs: tabState.tabs
            .map((tab) => ({
              tab: tab,
              webUrl: normalizeWebPreviewUrl(tab.url),
              pendingPopup: tab.pendingPopup === true,
              active: tab.id === tabState.activeTabId,
            }))
            .filter((item10) => item10.webUrl || item10.pendingPopup),
        };
      })
      .filter((item11) => item11.tabs.length > 0),
    canvasZoom2 = normalizeCanvasZoom(value34.viewport?.zoom),
    map7 = buildSlotIndex(
      root,
      list7.map((item12) => item12.node.id),
    ),
    softBlockerRects2 = collectOcclusionRects(root, SOFT_OCCLUSION_SELECTOR),
    hardBlockerRects2 = collectOcclusionRects(root, HARD_OCCLUSION_SELECTOR),
    fullscreenBlockerRects2 = collectOcclusionRects(root, FULLSCREEN_OCCLUSION_SELECTOR),
    list8 = [];
  for (const { node: node3, tabs: tabs } of list7) {
    const value35 = map7.get(node3.id);
    for (const { tab: tab2, webUrl: webUrl2, pendingPopup: pendingPopup2, active: active2 } of tabs) {
      list8.push(
        buildViewPayload({
          node: node3,
          tabId: tab2.id,
          webUrl: webUrl2,
          pendingPopup: pendingPopup2,
          slot: active2 ? value35 : null,
          active: active2,
          selected: active2 && map6.has(node3.id),
          canvasZoom: canvasZoom2,
          interactionState: interactionState,
          freezeToken: freezeToken,
          canvasSpaceHeld: canvasSpaceHeld,
          fullscreenBlockerRects: fullscreenBlockerRects2,
          softBlockerRects: softBlockerRects2,
          hardBlockerRects: hardBlockerRects2,
        }),
      );
    }
  }
  return (list8.sort((item13, value36) => Number(item13.selected) - Number(value36.selected)), list8);
}
export function initWebPreviewViewSyncService({ graphStore: graphStore2, root: root = document } = {}) {
  const enabled19 = globalThis.window?.electronAPI?.webPreview;
  if (!enabled19 || typeof enabled19.syncViews !== 'function') return { dispose() {} };
  const run = getRequestAnimationFrame(),
    handler2 = getCancelAnimationFrame(),
    handler3 = typeof enabled19.syncViewsFast === 'function' ? enabled19.syncViewsFast : enabled19.syncViews;
  let value37 = null,
    value38 = false,
    hasActiveWebPreviewNodes2 = hasActiveWebPreviewNodes(graphStore2),
    freezeToken4 = null;
  const run2 = () => {
      value37 = null;
      if (value38) return;
      const canvasInteractionState = getCanvasInteractionState();
      markInteractionTransition(freezeToken4, canvasInteractionState);
      const interactionState3 = getEffectiveInteractionState(canvasInteractionState, freezeToken4),
        views = syncCachedViewsForBudget(
          collectWebPreviewViews({
            graphStore: graphStore2,
            root: root,
            freezeToken: freezeToken4?.freezeToken || 0,
            interactionState: interactionState3,
            canvasSpaceHeld: freezeToken4?.canvasSpaceHeld === true,
          }),
          freezeToken4,
        );
      setFreezeActiveClass(views.some((item14) => item14?.showSnapshot === true));
      const viewsSignature = buildViewsSignature(views);
      if (viewsSignature === freezeToken4?.lastViewsSignature) return;
      if (freezeToken4) freezeToken4.lastViewsSignature = viewsSignature;
      try {
        const promise = handler3({ views: views });
        promise && typeof promise.catch === 'function' && void promise.catch(() => {});
      } catch {}
    },
    handler4 = () => {
      if (value38 || value37 !== null) return;
      value37 = run(run2);
    },
    handler5 = () => {
      if (value38) return;
      (value37 !== null && (handler2(value37), (value37 = null)), run2());
    },
    handler6 = () => {
      const canvasInteractionState2 = getCanvasInteractionState();
      return (
        canvasInteractionState2.frozen ||
        canvasInteractionState2.deferZoomFactor ||
        freezeToken4?.freezeActive === true ||
        Number(freezeToken4?.freezeSettlingUntil || 0) > getNowMs()
      );
    },
    handler7 = () => {
      if (handler6()) {
        handler5();
        return;
      }
      handler4();
    },
    handler8 = () => {
      if (!hasActiveWebPreviewNodes2) return;
      handler5();
    };
  freezeToken4 = createSyncBudgetState(handler4);
  const run3 = () => {
      if (!hasActiveWebPreviewNodes2) return;
      if (isViewportPanPreviewActive()) return;
      handler4();
    },
    value39 = () => {
      if (!hasActiveWebPreviewNodes2) return;
      handler5();
    },
    handler9 = () => {
      if (!hasActiveWebPreviewNodes2) return;
      handler5();
    },
    value40 = (value41) => {
      if (!hasActiveWebPreviewNodes2) return;
      if (isPotentialCanvasPanStartEvent(value41)) {
        handler9();
        return;
      }
      handler4();
    },
    value42 = () => {
      run3();
    },
    value43 = () => {
      if (!hasActiveWebPreviewNodes2 || !freezeToken4) return;
      const canvasSpaceHeld2 = readCanvasSpaceHeld();
      if (freezeToken4.canvasSpaceHeld === canvasSpaceHeld2) return;
      ((freezeToken4.canvasSpaceHeld = canvasSpaceHeld2), handler5());
    },
    value44 = () => {
      ((hasActiveWebPreviewNodes2 = hasActiveWebPreviewNodes(graphStore2)), handler7());
    },
    value45 = typeof graphStore2?.subscribeRaw === 'function' ? graphStore2.subscribeRaw(value44) : () => {},
    value46 =
      typeof enabled19.onEvent === 'function'
        ? enabled19.onEvent((detail) => {
            if (isNativePanStartPreviewEvent(detail)) handler9();
            globalThis.window?.dispatchEvent?.(
              new CustomEvent('web-preview:native-event', { detail: detail }),
            );
          })
        : () => {},
    handler10 = globalThis.window?.MutationObserver || globalThis.MutationObserver,
    value47 =
      typeof handler10 === 'function'
        ? new handler10((value48) => {
            if (shouldSyncForOcclusionMutation(value48)) handler8();
          })
        : null,
    value49 = root?.body || root?.documentElement || root;
  try {
    value47?.observe?.(value49, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
      attributeOldValue: true,
      childList: true,
      subtree: true,
    });
  } catch {}
  return (
    globalThis.window?.addEventListener?.('resize', handler4),
    globalThis.window?.addEventListener?.('scroll', handler4, true),
    globalThis.window?.addEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, value39),
    globalThis.window?.addEventListener?.('pointerdown', value40, true),
    globalThis.window?.addEventListener?.('pointermove', run3),
    globalThis.window?.addEventListener?.('pointerup', value42),
    globalThis.window?.addEventListener?.('pointercancel', value42),
    globalThis.window?.addEventListener?.('keydown', value43),
    globalThis.window?.addEventListener?.('keyup', value43),
    globalThis.window?.addEventListener?.('blur', value43),
    globalThis.window?.addEventListener?.('wheel', run3, { passive: true }),
    globalThis.window?.addEventListener?.('web-preview:force-sync', handler5),
    handler4(),
    {
      dispose() {
        ((value38 = true), clearFinalSyncTimer(freezeToken4), clearFreezeSettlingTimer(freezeToken4));
        if (freezeToken4) freezeToken4.freezeSettlingUntil = 0;
        (setFreezeActiveClass(false), setFreezeSettlingClass(false));
        if (value37 !== null) handler2(value37);
        ((value37 = null),
          value45?.(),
          value46?.(),
          globalThis.window?.removeEventListener?.('resize', handler4),
          globalThis.window?.removeEventListener?.('scroll', handler4, true),
          globalThis.window?.removeEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, value39),
          globalThis.window?.removeEventListener?.('pointerdown', value40, true),
          globalThis.window?.removeEventListener?.('pointermove', run3),
          globalThis.window?.removeEventListener?.('pointerup', value42),
          globalThis.window?.removeEventListener?.('pointercancel', value42),
          globalThis.window?.removeEventListener?.('keydown', value43),
          globalThis.window?.removeEventListener?.('keyup', value43),
          globalThis.window?.removeEventListener?.('blur', value43),
          globalThis.window?.removeEventListener?.('wheel', run3, { passive: true }),
          globalThis.window?.removeEventListener?.('web-preview:force-sync', handler5),
          value47?.disconnect?.(),
          void enabled19.disposeViews?.());
      },
    }
  );
}
export { collectWebPreviewViews };
