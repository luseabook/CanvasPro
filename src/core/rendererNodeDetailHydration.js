import { isNodeType } from '../modules/registry.js';
export const NODE_DETAIL_DEFERRED_CLASS = 'v2-node-detail-deferred';
const NODE_DETAIL_LOW_ZOOM_THRESHOLD = 0.45,
  NODE_DETAIL_DEFERRED_STAGE = 'deferred',
  NODE_DETAIL_HYDRATED_STAGE = 'hydrated',
  NODE_DETAIL_HYDRATION_BATCH_SIZE = 24,
  NODE_DETAIL_DEFER_VISIBLE_COUNT = 48,
  NODE_DETAIL_HYDRATION_BUSY_RETRY_MS = 120,
  NODE_DETAIL_HYDRATION_FALLBACK_MS = 24,
  NODE_DETAIL_HYDRATION_IDLE_TIMEOUT_MS = 120;
export function createNodeDetailHydrationController({
  getWrapper: getWrapper,
  getParkedWrapper: getParkedWrapper,
  getWrappers: getWrappers,
  getParkedWrappers: getParkedWrappers,
  isMounted: isMounted,
  isInteractionBusy: isInteractionBusy,
  onHydrateNodeDetails: onHydrateNodeDetails,
} = {}) {
  let list = [],
    map = new Set(),
    setTimeout2 = null,
    value = '';
  let paused = false;
  function run() {
    if (setTimeout2 === null) return;
    if (value === 'idle' && typeof cancelIdleCallback === 'function') cancelIdleCallback(setTimeout2);
    else value === 'timeout' && clearTimeout(setTimeout2);
    ((setTimeout2 = null), (value = ''));
  }
  function hydrateNodeDetails(enabled, el = getWrapper?.(enabled)) {
    if (!enabled || !el) return;
    const enabled2 =
      el.classList.contains(NODE_DETAIL_DEFERRED_CLASS) ||
      el.dataset?.detailStage === NODE_DETAIL_DEFERRED_STAGE;
    if (!enabled2 && el.dataset?.detailStage === NODE_DETAIL_HYDRATED_STAGE) return;
    (map.delete(enabled), el.classList.remove(NODE_DETAIL_DEFERRED_CLASS));
    if (el.dataset) el.dataset.detailStage = NODE_DETAIL_HYDRATED_STAGE;
    onHydrateNodeDetails?.(enabled, el);
  }
  function run2() {
    if (paused || setTimeout2 !== null) return;
    if (isInteractionBusy?.()) {
      ((value = 'timeout'), (setTimeout2 = setTimeout(() => run3(), NODE_DETAIL_HYDRATION_BUSY_RETRY_MS)));
      return;
    }
    if (list.length >= NODE_DETAIL_HYDRATION_BATCH_SIZE * 3) {
      ((value = 'timeout'), (setTimeout2 = setTimeout(() => run3(), NODE_DETAIL_HYDRATION_FALLBACK_MS)));
      return;
    }
    if (typeof requestIdleCallback === 'function') {
      ((value = 'idle'),
        (setTimeout2 = requestIdleCallback(run3, { timeout: NODE_DETAIL_HYDRATION_IDLE_TIMEOUT_MS })));
      return;
    }
    ((value = 'timeout'), (setTimeout2 = setTimeout(() => run3(), NODE_DETAIL_HYDRATION_FALLBACK_MS)));
  }
  function run3(enabled3 = null) {
    ((setTimeout2 = null), (value = ''));
    if (paused) return;
    if (isInteractionBusy?.()) {
      run2();
      return;
    }
    let item = 0;
    const run4 = () => {
      if (!enabled3 || enabled3.didTimeout) return true;
      if (typeof enabled3.timeRemaining !== 'function') return true;
      return enabled3.timeRemaining() > 2;
    };
    while (list.length > 0 && item < NODE_DETAIL_HYDRATION_BATCH_SIZE && run4()) {
      const key = list.shift();
      if (!map.delete(key)) continue;
      const el2 = getWrapper?.(key);
      if (!el2 || !isMounted?.(key) || !el2.isConnected) continue;
      (hydrateNodeDetails(key, el2), (item += 1));
    }
    if (list.length > 0) run2();
  }
  function run5(enabled4) {
    if (!enabled4 || map.has(enabled4)) return;
    (map.add(enabled4), list.push(enabled4), run2());
  }
  function resumeNodeDetailHydration() {
    paused = false;
    if (list.length === 0) return;
    run2();
  }
  function run6(el3, enabled5, { autoHydrate: autoHydrate = true } = {}) {
    if (!el3 || !enabled5) return;
    el3.classList.add(NODE_DETAIL_DEFERRED_CLASS);
    if (el3.dataset) el3.dataset.detailStage = NODE_DETAIL_DEFERRED_STAGE;
    if (autoHydrate) run5(enabled5);
    else map.delete(enabled5);
  }
  function forgetNodeDetailHydration(enabled6, { removeClass: removeClass = true } = {}) {
    if (!enabled6) return;
    map.delete(enabled6);
    const el4 = getWrapper?.(enabled6) || getParkedWrapper?.(enabled6);
    removeClass &&
      el4 &&
      (el4.classList.remove(NODE_DETAIL_DEFERRED_CLASS),
      el4.dataset && el4.dataset.detailStage && delete el4.dataset.detailStage);
  }
  function clearNodeDetailHydrationState() {
    (run(), (list = []), (map = new Set()));
    for (const el5 of getWrappers?.() || []) {
      (el5?.classList?.remove?.(NODE_DETAIL_DEFERRED_CLASS),
        el5?.dataset && el5.dataset.detailStage && delete el5.dataset.detailStage);
    }
    for (const el6 of getParkedWrappers?.() || []) {
      (el6?.classList?.remove?.(NODE_DETAIL_DEFERRED_CLASS),
        el6?.dataset && el6.dataset.detailStage && delete el6.dataset.detailStage);
    }
  }
  function isNodeDetailActive({
    node: node,
    nodeId: nodeId,
    isSelected: isSelected,
    connOverlay: connOverlay,
    pickMode: pickMode,
    relatedNodeIds: relatedNodeIds,
  } = {}) {
    if (isSelected) return true;
    if (relatedNodeIds?.has?.(nodeId)) return true;
    if (connOverlay?.srcId === nodeId || connOverlay?.hoverId === nodeId) return true;
    if (pickMode?.sourceNodeId === nodeId || pickMode?.hoverNodeId === nodeId) return true;
    return !!(node?.isImagesExpanded || node?.isVideosExpanded);
  }
  function shouldDeferNodeDetails({
    node: node2,
    nodeId: nodeId2,
    isSelected: isSelected2,
    connOverlay: connOverlay2,
    pickMode: pickMode2,
    relatedNodeIds: relatedNodeIds2,
    viewport: viewport,
    mountCandidateCount: mountCandidateCount,
  } = {}) {
    if (!node2?.id) return false;
    if (isNodeType(node2, ['group', 'comment-note', 'web-preview'])) return false;
    if (
      isNodeDetailActive({
        node: node2,
        nodeId: nodeId2,
        isSelected: isSelected2,
        connOverlay: connOverlay2,
        pickMode: pickMode2,
        relatedNodeIds: relatedNodeIds2,
      })
    )
      return false;
    const index = Number.isFinite(viewport?.zoom) ? viewport.zoom : 1;
    return (
      index <= NODE_DETAIL_LOW_ZOOM_THRESHOLD ||
      Number(mountCandidateCount || 0) >= NODE_DETAIL_DEFER_VISIBLE_COUNT
    );
  }
  function syncNodeDetailMountStage({
    wrapperEl: wrapperEl,
    node: node3,
    nodeId: nodeId3,
    isSelected: isSelected3,
    connOverlay: connOverlay3,
    pickMode: pickMode3,
    relatedNodeIds: relatedNodeIds3,
    viewport: viewport2,
    mountCandidateCount: mountCandidateCount2,
    autoHydrate: autoHydrate = true,
  } = {}) {
    if (!wrapperEl || !nodeId3) return;
    shouldDeferNodeDetails({
      node: node3,
      nodeId: nodeId3,
      isSelected: isSelected3,
      connOverlay: connOverlay3,
      pickMode: pickMode3,
      relatedNodeIds: relatedNodeIds3,
      viewport: viewport2,
      mountCandidateCount: mountCandidateCount2,
    })
      ? run6(wrapperEl, nodeId3, { autoHydrate: autoHydrate })
      : hydrateNodeDetails(nodeId3, wrapperEl);
  }
  return {
    clearNodeDetailHydrationState: clearNodeDetailHydrationState,
    forgetNodeDetailHydration: forgetNodeDetailHydration,
    hydrateNodeDetails: hydrateNodeDetails,
    isNodeDetailActive: isNodeDetailActive,
    pause() {
      paused = true;
      run();
    },
    resumeNodeDetailHydration: resumeNodeDetailHydration,
    shouldDeferNodeDetails: shouldDeferNodeDetails,
    syncNodeDetailMountStage: syncNodeDetailMountStage,
  };
}
