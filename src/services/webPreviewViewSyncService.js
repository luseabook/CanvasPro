import { normalizeWebPreviewUrl } from '../modules/webPreviewUrl.js';
import { normalizeWebPreviewTabs } from '../modules/webPreviewTabs.js';
import {
  isViewportPanPreviewActive,
  VIEWPORT_PAN_PREVIEW_FRAME_EVENT,
} from '../core/viewportPanPreview.js';
import { readViewportInteractionState } from '../core/viewportInteractionState.js';
import { CONTEXT_MENU_SHORTCUT_IDS } from '../utils/contextMenuShortcutCatalog.js';
import { getShortcutKeys } from '../modules/shortcuts.js';
const SOFT_OCCLUSION_SELECTOR = '.header',
  HARD_OCCLUSION_SELECTOR =
    '#settingsOverlay, #aboutOverlay, #feedbackGroupOverlay, #v2PickerOverlay, #nodePickerOverlay, .settings-overlay, .save-dialog-overlay.open, .preset-modal-overlay, .custom-confirm-overlay, .v2-asset-sidebar-panel.show, .v2-workflow-sidebar-panel.show, .sidebar-floating #avatarMenu.open, .sidebar-floating .avatar-menu.open, .node-add-menu, .v2-node-picker, .canvas-proj-dropdown, .web-preview-image-picker-overlay',
  FULLSCREEN_OCCLUSION_SELECTOR = '.web-preview-image-picker-overlay',
  // 画布节点的可见实体：整块节点、展开的多层背板、多级弹出面板的直接子项。
  CANVAS_NODE_OCCLUDER_SELECTOR =
    '.v2-node, .multi-stack-backplate.is-expanded-card, .multi-flyout-panel > *',
  OCCLUSION_OBSERVER_SELECTOR = [
    SOFT_OCCLUSION_SELECTOR,
    HARD_OCCLUSION_SELECTOR,
    '.sidebar-floating, .canvas-controls-floating, .minimap-wrapper, .save-dialog-overlay, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel, .v2-crop-overlay, .v2-annotate-overlay, .v2-matting-overlay, .v2-expand-overlay',
    FULLSCREEN_OCCLUSION_SELECTOR,
  ].join(', '),
  BACKGROUND_SYNC_INTERVAL_MS = 50,
  FINAL_INTERACTION_SYNC_DELAY_MS = 40,
  FREEZE_SETTLE_HOLD_MS = 360,
  // 平移手势结束后仍按住冻结的时长：等惯性滚动停下再放开，否则会看到跳帧。
  PENDING_PAN_FREEZE_MS = 240,
  MIN_VISIBLE_INTERSECTION_SIZE = 16,
  SOFT_OCCLUSION_HIDE_RATIO = 0.35,
  FREEZE_ACTIVE_BODY_CLASS = 'is-web-preview-freeze-active',
  FREEZE_SETTLING_BODY_CLASS = 'is-web-preview-freeze-settling',
  WEB_PREVIEW_FREEZE_BODY_CLASSES = new Set([FREEZE_ACTIVE_BODY_CLASS, FREEZE_SETTLING_BODY_CLASS]),
  // 命中栈采样比例：两端取 2%/98% 而不是 0/100，避免落在圆角与边缘阴影上。
  DOM_OCCLUSION_SAMPLE_RATIOS = [0.02, 0.1, 0.5, 0.9, 0.98],
  registeredSlotsByNodeId = new Map(),
  WEB_PREVIEW_CONTEXT_MENU_SHORTCUT_IDS = CONTEXT_MENU_SHORTCUT_IDS.filter((shortcutId) =>
    shortcutId.startsWith('context-web-')
  );
export function collectWebPreviewContextMenuShortcuts() {
  return Object.fromEntries(
    WEB_PREVIEW_CONTEXT_MENU_SHORTCUT_IDS.map((shortcutId) => [
      shortcutId,
      getShortcutKeys(shortcutId),
    ])
  );
}
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
  return (
    globalThis.window?.requestAnimationFrame?.bind(globalThis.window) ||
    ((key) => setTimeout(key, 16))
  );
}
function getCancelAnimationFrame() {
  return globalThis.window?.cancelAnimationFrame?.bind(globalThis.window) || clearTimeout;
}
function rectIntersects(box, box2) {
  return (
    box.left < box2.right && box.right > box2.left && box.top < box2.bottom && box.bottom > box2.top
  );
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
// ---------------------------------------------------------------------------
// 画布节点遮挡与命中测试
//
// 预览视图是原生 webview，永远盖在 DOM 之上，所以「有没有被遮住」只能推断：
// 先按可见性与 z-index 收集体积遮挡物，再用 document.elementsFromPoint 采样，
// 看命中栈顶端是否仍属于自己。全部函数只读不写，单测可以用假元素驱动。
// ---------------------------------------------------------------------------

/** 解析 CSS z-index 文本；auto / 空值 / 非法值一律按 0 处理。 */
function parseStackingZIndex(rawValue) {
  const text = String(rawValue ?? '').trim();
  if (!text || text === 'auto') return 0;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 元素的有效 z-index；完全不可见（display/visibility/opacity）时返回 null，表示不参与比较。 */
function getElementZIndex(element) {
  const style = globalThis.window?.getComputedStyle?.(element);
  if (style?.display === 'none' || style?.visibility === 'hidden') return null;
  const opacity = Number(style?.opacity);
  if (Number.isFinite(opacity) && opacity <= 0) return null;
  return parseStackingZIndex(style?.zIndex || element?.style?.zIndex);
}

/** 元素可见时返回它的包围盒，否则 null。宽高为 0 视为不可见。 */
function getElementVisibleRect(element) {
  if (!element || element.hidden || element.isConnected === false) return null;
  const style = globalThis.window?.getComputedStyle?.(element);
  if (style?.display === 'none' || style?.visibility === 'hidden') return null;
  const opacity = Number(style?.opacity);
  if (Number.isFinite(opacity) && opacity <= 0) return null;
  const rect = element.getBoundingClientRect?.();
  if (!rect || (Number(rect.width) || 0) <= 0 || (Number(rect.height) || 0) <= 0) return null;
  return rect;
}

/**
 * 候选遮挡物：定位脱离文档流（fixed/sticky/absolute）或 z-index > 0，且与视口有可见交集。
 * 只是「可能」遮挡，真正判定交给命中测试。
 */
function isPotentialNativeViewOccluderElement(element) {
  if (!element || element.nodeType === 3 || element.hidden) return false;
  const style = globalThis.window?.getComputedStyle?.(element);
  if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  const opacity = Number(style?.opacity);
  if (Number.isFinite(opacity) && opacity <= 0) return false;
  const position = String(style?.position || element?.style?.position || '').trim();
  const zIndex = parseStackingZIndex(style?.zIndex || element?.style?.zIndex);
  if (!['fixed', 'sticky', 'absolute'].includes(position) && zIndex <= 0) return false;
  const rect = element.getBoundingClientRect?.();
  if (!rect || (Number(rect.width) || 0) <= 0 || (Number(rect.height) || 0) <= 0) return false;
  return hasVisibleViewportIntersection(rect);
}

/** 找到遮挡物所属的画布节点宿主（`.v2-node`）；节点内部元素返回最近的宿主。 */
function getCanvasOccluderHostElement(element) {
  try {
    if (element?.matches?.('.v2-node')) return element;
  } catch {
    // 非 Element（文本节点、已脱离文档）调 matches 会抛，直接走 closest。
  }
  return element?.closest?.('.v2-node') || null;
}

/** 遮挡物的层叠高度：取自身与宿主的较大值；任一不可见则整体不可比较（null）。 */
function getCanvasOccluderZIndex(element, hostElement) {
  const elementZIndex = getElementZIndex(element);
  if (elementZIndex === null) return null;
  if (!hostElement || hostElement === element) return elementZIndex;
  const hostZIndex = getElementZIndex(hostElement);
  if (hostZIndex === null) return null;
  return Math.max(elementZIndex, hostZIndex);
}

/** 收集当前画布上所有可能遮挡预览的节点，按 z-index 排序留给后续比较。 */
function collectCanvasNodeOccluders(root = document) {
  const candidates = root.querySelectorAll?.(CANVAS_NODE_OCCLUDER_SELECTOR) || [];
  const occluders = [];
  for (const element of candidates) {
    const rect = getElementVisibleRect(element);
    if (!rect) continue;
    const hostElement = getCanvasOccluderHostElement(element);
    const zIndex = getCanvasOccluderZIndex(element, hostElement);
    if (zIndex === null) continue;
    occluders.push({
      element,
      nodeId: normalizeNodeId(
        hostElement?.dataset?.nodeId || element?.dataset?.nodeId || element?.id
      ),
      rect,
      zIndex,
    });
  }
  return occluders;
}

/** 预览槽位所属的画布节点宿主。 */
function getSlotHostNodeElement(slot) {
  return slot?.closest?.('.v2-node') || null;
}

/**
 * 是否被画布上更高的节点压住：跳过自己与自己所在的宿主，只比较 z-index 更高的，
 * 并且必须真的与预览区域相交——只看 z-index 会把远处的节点也算成遮挡。
 */
function isOccludedByHigherCanvasNode(slot, rect, occluders = []) {
  if (!slot || !rect || !occluders.length) return false;
  const hostElement = getSlotHostNodeElement(slot);
  const nodeId = normalizeNodeId(slot?.dataset?.nodeId);
  const hostZIndex = getElementZIndex(hostElement) ?? 0;
  for (const occluder of occluders) {
    if (!occluder?.element || occluder.element === hostElement) continue;
    if (nodeId && occluder.nodeId === nodeId) continue;
    if (occluder.zIndex <= hostZIndex) continue;
    if (rectIntersects(rect, occluder.rect)) return true;
  }
  return false;
}

/** 在预览矩形内生成采样点（含视口裁剪），去重后返回；可用区域太小则不采样。 */
function getDomOcclusionSamplePoints(rect) {
  const viewport = globalThis.window || {};
  const viewportWidth = Number(viewport.innerWidth) || 0;
  const viewportHeight = Number(viewport.innerHeight) || 0;
  if (viewportWidth <= 0 || viewportHeight <= 0) return [];
  const left = Math.max(0, Number(rect?.left) || 0);
  const top = Math.max(0, Number(rect?.top) || 0);
  const right = Math.min(viewportWidth, Number(rect?.right) || 0);
  const bottom = Math.min(viewportHeight, Number(rect?.bottom) || 0);
  const width = right - left;
  const height = bottom - top;
  if (width < MIN_VISIBLE_INTERSECTION_SIZE || height < MIN_VISIBLE_INTERSECTION_SIZE) return [];
  const points = [];
  const seen = new Set();
  for (const ratioY of DOM_OCCLUSION_SAMPLE_RATIOS) {
    for (const ratioX of DOM_OCCLUSION_SAMPLE_RATIOS) {
      const x = Math.round(left + width * ratioX);
      const y = Math.round(top + height * ratioY);
      const key = x + ',' + y;
      if (seen.has(key)) continue;
      seen.add(key);
      points.push({ x, y });
    }
  }
  return points;
}

/** 命中测试；优先用传入的 root，拿不到 elementsFromPoint 时返回空数组（视为无数据，不是无遮挡）。 */
function getElementsFromPoint(root, x, y) {
  const target = root?.elementsFromPoint ? root : globalThis.document;
  const elementsFromPoint = target?.elementsFromPoint;
  if (typeof elementsFromPoint !== 'function') return [];
  try {
    return Array.from(elementsFromPoint.call(target, x, y) || []);
  } catch {
    return [];
  }
}

/** html / body 是命中栈的兜底元素，它们出现说明采样点下面没有实际内容。 */
function isDocumentRootHitElement(element) {
  const tagName = String(element?.tagName || '').toLowerCase();
  return tagName === 'html' || tagName === 'body';
}

/** 命中栈里可以代表「有内容」的元素：可见的元素节点，且不是文档根。 */
function isRenderableHitElement(element) {
  if (!element || (element.nodeType && element.nodeType !== 1)) return false;
  if (isDocumentRootHitElement(element) || element.hidden) return false;
  const style = globalThis.window?.getComputedStyle?.(element);
  if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  const opacity = Number(style?.opacity);
  return !(Number.isFinite(opacity) && opacity <= 0);
}

/** 命中的元素是否属于 container（自身或其后代）。 */
function elementOwnsHit(container, hitElement) {
  return Boolean(container && (container === hitElement || container.contains?.(hitElement)));
}

/** 命中的元素是否属于这个预览槽位（槽位自身或它所在画布节点的子树）。 */
function isOwnedByWebPreviewSlot(hitElement, slot) {
  if (!hitElement || !slot) return false;
  const hostElement = getSlotHostNodeElement(slot);
  return elementOwnsHit(slot, hitElement) || elementOwnsHit(hostElement, hitElement);
}

/** 命中栈顶端第一个「有内容」的元素；整条栈都是 html/body 时返回 null。 */
function getTopRenderableHitElement(elements = []) {
  for (const element of elements) {
    if (isRenderableHitElement(element)) return element;
  }
  return null;
}

/**
 * 采样点里只要有一个被别的元素抢走，就判定为被渲染层遮挡。
 * 用「任一」而不是「多数」：预览被盖住一半时用户就已经看不见内容了。
 */
function isOccludedByRendererStack(slot, rect, root = document) {
  if (!slot || !rect) return false;
  const points = getDomOcclusionSamplePoints(rect);
  if (!points.length) return false;
  for (const point of points) {
    const topElement = getTopRenderableHitElement(getElementsFromPoint(root, point.x, point.y));
    if (!topElement) continue;
    if (!isOwnedByWebPreviewSlot(topElement, slot)) return true;
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
  return (
    normalizeObservedClassName(event2.oldValue) ===
    normalizeObservedClassName(event2.target?.className)
  );
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
/**
 * 读图存储的原始状态：优先 getStateRaw（不触发订阅/拷贝），退回 getState。
 * 追踪器每帧都要读，走订阅接口会把自己卷进渲染循环。
 */
function readGraphStoreState(graphStore) {
  return typeof graphStore?.getStateRaw === 'function'
    ? graphStore.getStateRaw()
    : graphStore?.getState?.() || {};
}

/** 状态里是否存在「有可用 URL 或待打开弹窗」的预览节点。入参是图状态，不是 store。 */
function hasActiveWebPreviewNodes(state = {}) {
  return Object.values(state.nodes || {}).some(
    (node) =>
      node?.type === 'web-preview' &&
      normalizeWebPreviewTabs(node).tabs.some(
        (tab) => normalizeWebPreviewUrl(tab.url) || tab.pendingPopup === true
      )
  );
}
function normalizeCanvasZoom(value9) {
  const count7 = Number(value9);
  if (!Number.isFinite(count7) || count7 <= 0) return 1;
  return Math.min(5, Math.max(0.25, count7));
}
/**
 * 节点活跃度追踪器：只有「有 web-preview 节点且带可用 URL」时同步循环才值得跑。
 * 用 `_persistRev` 判断状态是否真的变了——每帧做全量扫描会把主线程吃掉。
 */
export function createWebPreviewNodeActivityTracker(graphStore) {
  const initialState = readGraphStoreState(graphStore);
  let lastRevision = Number(initialState?._persistRev);
  let hasRevision = Number.isFinite(lastRevision);
  let hasActiveNodes = hasActiveWebPreviewNodes(initialState);
  return {
    get hasActiveNodes() {
      return hasActiveNodes;
    },
    /** 传入新状态则用它，否则自己读；返回最新的「是否存在活跃节点」。 */
    refresh(nextState) {
      const state = nextState || readGraphStoreState(graphStore);
      const revision = Number(state?._persistRev);
      const revisionValid = Number.isFinite(revision);
      // 任一侧拿不到版本号时也必须重算，否则版本号缺失会让缓存永远不失效。
      if (!revisionValid || !hasRevision || revision !== lastRevision) {
        hasActiveNodes = hasActiveWebPreviewNodes(state);
        lastRevision = revision;
        hasRevision = revisionValid;
      }
      return hasActiveNodes;
    },
  };
}

// --- 平移手势后的临时冻结 ---
// 手势结束时惯性滚动还会持续几十毫秒，这段时间继续用旧快照，避免预览来回跳。

function isPendingPanFreezeActive(controller) {
  return Number(controller?.pendingPanFreezeUntil || 0) > getNowMs();
}

function clearPendingPanFreeze(controller) {
  if (!controller) return;
  if (controller.pendingPanFreezeTimer) {
    clearTimeout(controller.pendingPanFreezeTimer);
    controller.pendingPanFreezeTimer = null;
  }
  controller.pendingPanFreezeUntil = 0;
}

function startPendingPanFreeze(controller) {
  if (!controller) return;
  clearPendingPanFreeze(controller);
  controller.pendingPanFreezeUntil = getNowMs() + PENDING_PAN_FREEZE_MS;
  controller.pendingPanFreezeTimer = setTimeout(() => {
    controller.pendingPanFreezeTimer = null;
    controller.pendingPanFreezeUntil = 0;
    controller.scheduleFinalSync?.();
  }, PENDING_PAN_FREEZE_MS);
}

/**
 * 画布交互状态。平移/缩放/视口动画都会让原生视图的位置不稳定，此时应当冻结。
 * `controller` 带 pendingPanFreeze 时不看 body class —— 手势刚结束、class 已摘掉但
 * 惯性滚动还没停，这段时间仍要算作忙。
 */
function getCanvasInteractionState(controller) {
  const canvasState = readViewportInteractionState({
    panPreviewActive: isViewportPanPreviewActive(),
    pendingPanFreezeActive: isPendingPanFreezeActive(controller),
  });
  const frozen = canvasState.isViewportBusy;
  return {
    frozen: frozen,
    deferZoomFactor: canvasState.isViewportAnimating || canvasState.isZooming,
    settleSnapshot: canvasState.isViewportAnimating,
    showSnapshot: frozen,
  };
}
function getSlotFullscreen(el8) {
  return el8?.dataset?.webPreviewFullscreen === 'true';
}
function getSlotSnapshotComponent(el9) {
  return el9?.closest?.('.web-preview-component') || null;
}
/** 快照令牌：标记当前快照是给哪一次冻结算出来的，令牌不一致就不能复用。 */
function getSlotSnapshotToken(slot) {
  const component = getSlotSnapshotComponent(slot);
  if (!component?.classList?.contains?.('has-freeze-snapshot')) return '';
  return String(component?.dataset?.webPreviewSnapshotToken || '').trim();
}

function readPositiveNumber(rawValue) {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** 快照的尺寸/缩放元数据；三项缺一就当作没有可用快照。 */
function getSlotSnapshotMetrics(slot) {
  const component = getSlotSnapshotComponent(slot);
  if (!component?.classList?.contains?.('has-freeze-snapshot')) return null;
  const dataset = component?.dataset || {};
  const width = readPositiveNumber(dataset.webPreviewSnapshotWidth);
  const height = readPositiveNumber(dataset.webPreviewSnapshotHeight);
  const zoomFactor = readPositiveNumber(dataset.webPreviewSnapshotZoomFactor);
  if (!width || !height || !zoomFactor) return null;
  return { width, height, zoomFactor };
}

/**
 * 已就绪快照能否直接顶替当前区域：令牌必须是 ready，且尺寸与缩放都对得上。
 * 尺寸用 round 比较，浮点误差不该让快照作废。
 */
function readySnapshotMatchesBounds(slot, bounds, zoomFactor) {
  if (!bounds) return false;
  if (getSlotSnapshotToken(slot) !== 'ready') return false;
  const metrics = getSlotSnapshotMetrics(slot);
  if (!metrics) return false;
  const widthMatches = Math.round(metrics.width) === Math.round(bounds.width);
  const heightMatches = Math.round(metrics.height) === Math.round(bounds.height);
  const expectedZoom = readPositiveNumber(zoomFactor) || 1;
  const zoomMatches = Math.abs(metrics.zoomFactor - expectedZoom) < 0.001;
  return widthMatches && heightMatches && zoomMatches;
}

function getSlotSnapshotReady(
  value11,
  value12 = '',
  { allowAnyToken: allowAnyToken = false } = {}
) {
  const el10 = getSlotSnapshotComponent(value11);
  if (!el10?.classList?.contains?.('has-freeze-snapshot')) return false;
  if (allowAnyToken) return true;
  const enabled6 = String(value12 || '').trim();
  if (!enabled6) return true;
  const value13 = String(el10?.dataset?.webPreviewSnapshotToken || '').trim();
  return value13 === enabled6;
}
function getSlotSnapshotHold(value14) {
  return Boolean(
    getSlotSnapshotComponent(value14)?.classList?.contains?.('is-web-preview-loading')
  );
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
  canvasNodeOccluders: canvasNodeOccluders = [],
  root: root = document,
  canvasSpaceHeld: canvasSpaceHeld = false,
  pendingPopup: pendingPopup = false,
}) {
  let visible = false,
    bounds = null,
    slotRect = null,
    hardOccluded = false,
    softOccluded = false,
    canvasOccluded = false,
    rendererOccluded = false,
    snapshotMatchesReady = false;
  const zoomFactor = getSlotFullscreen(slot);
  if (slot?.isConnected !== false) {
    const box7 = slot?.getBoundingClientRect?.();
    slotRect = box7 || null;
    const roundedSize = box7
        ? { width: Math.round(box7.width), height: Math.round(box7.height) }
        : null,
      fullscreenOrSelected = Boolean(zoomFactor || selected);
    // 同尺寸同缩放的 ready 快照可以直接顶替重绘，并据此进入 passive 冻结。
    snapshotMatchesReady = Boolean(
      box7 &&
      !zoomFactor &&
      !fullscreenOrSelected &&
      readySnapshotMatchesBounds(slot, roundedSize, canvasZoom)
    );
    const fullscreenOccluded = box7 ? isOccludedByRects(box7, fullscreenBlockerRects) : false;
    hardOccluded = box7 && !zoomFactor ? isOccludedByRects(box7, hardBlockerRects) : false;
    softOccluded =
      box7 && !zoomFactor ? isSignificantlyOccludedByRects(box7, softBlockerRects) : false;
    // 画布上更高的节点与渲染层命中栈：原生视图永远盖在 DOM 之上，只能靠推断。
    canvasOccluded = Boolean(
      box7 && !zoomFactor && isOccludedByHigherCanvasNode(slot, box7, canvasNodeOccluders)
    );
    rendererOccluded = Boolean(box7 && !zoomFactor && isOccludedByRendererStack(slot, box7, root));
    box7 &&
      hasVisibleViewportIntersection(box7) &&
      !fullscreenOccluded &&
      !hardOccluded &&
      !softOccluded &&
      !canvasOccluded &&
      !rendererOccluded &&
      !snapshotMatchesReady &&
      ((visible = true),
      (bounds = {
        x: Math.round(box7.left),
        y: Math.round(box7.top),
        width: Math.round(box7.width),
        height: Math.round(box7.height),
      }));
  }
  const snapshotHold = getSlotSnapshotHold(slot),
    occluded = Boolean(
      (hardOccluded || softOccluded || canvasOccluded || rendererOccluded) && !zoomFactor
    ),
    frozenByOcclusion = Boolean(occluded || snapshotMatchesReady),
    frozen2 = Boolean(
      ((interactionState2.frozen || snapshotHold) && !zoomFactor && visible) || frozenByOcclusion
    ),
    // 被遮挡/可复用快照时冻结在「那一个区域 + 缩放」上，令牌由它和冻结原因共同决定。
    snapshotBounds =
      frozenByOcclusion && slotRect && hasVisibleViewportIntersection(slotRect)
        ? {
            x: Math.round(slotRect.left),
            y: Math.round(slotRect.top),
            width: Math.round(slotRect.width),
            height: Math.round(slotRect.height),
          }
        : null,
    frozenWithInteraction = Boolean(occluded && interactionState2.frozen),
    occlusionFreezeToken =
      occluded && snapshotBounds
        ? frozenWithInteraction
          ? String(freezeToken2 || '0')
          : [
              'occlusion',
              snapshotBounds.width,
              snapshotBounds.height,
              Number(canvasZoom || 1).toFixed(3),
            ].join(':')
        : '',
    passiveFreezeToken =
      snapshotMatchesReady && !occluded && snapshotBounds
        ? [
            'passive',
            snapshotBounds.width,
            snapshotBounds.height,
            Number(canvasZoom || 1).toFixed(3),
          ].join(':')
        : '',
    freezeToken3 = frozen2
      ? occlusionFreezeToken || passiveFreezeToken || String(freezeToken2 || '0')
      : '',
    showSnapshot = Boolean(
      frozenByOcclusion || (frozen2 && (interactionState2.showSnapshot || snapshotHold))
    ),
    snapshotToken = getSlotSnapshotToken(slot),
    snapshotReady = Boolean(
      showSnapshot &&
      frozenByOcclusion &&
      (snapshotMatchesReady ||
        (!frozenWithInteraction && readySnapshotMatchesBounds(slot, snapshotBounds, canvasZoom)))
    ),
    allowAnyToken2 = Boolean(
      showSnapshot && (!frozenByOcclusion || frozenWithInteraction || snapshotReady)
    );
  return {
    nodeId: node.id,
    tabId: tabId,
    webUrl: webUrl,
    pendingPopup: pendingPopup,
    browserProfileId: node.browserProfileId || '',
    active: active,
    visible: visible,
    bounds: bounds,
    snapshotBounds: snapshotBounds,
    zoomFactor: zoomFactor ? 1 : canvasZoom,
    deferZoomFactor: zoomFactor ? false : interactionState2.deferZoomFactor,
    frozen: frozen2,
    freezeToken: freezeToken3,
    snapshotReady: showSnapshot
      ? getSlotSnapshotReady(slot, freezeToken3, { allowAnyToken: allowAnyToken2 })
      : false,
    snapshotToken: snapshotToken,
    allowReusableSnapshot: allowAnyToken2,
    snapshotHold: snapshotHold,
    showSnapshot: showSnapshot,
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
      value21 =
        selected2.deferZoomFactor === true &&
        selected2.frozen !== true &&
        selected2.visible === true,
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
/**
 * 视图签名：主进程靠它判断「这一帧值得下发吗」。
 * 漏掉任何一个会影响渲染的字段，表现就是「界面卡住不更新」，所以快照令牌与
 * 可复用标记必须在内；快捷键表单独成段，改键位要能触发重新下发。
 */
function buildViewsSignature(list6 = [], shortcuts = {}) {
  const viewsSignature = list6
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
          item8?.snapshotToken || '',
          item8?.allowReusableSnapshot === true ? 1 : 0,
          item8?.snapshotHold === true ? 1 : 0,
          item8?.showSnapshot === true ? 1 : 0,
          item8?.fullscreen === true ? 1 : 0,
          item8?.selected === true ? 1 : 0,
          item8?.canvasSpaceHeld === true ? 1 : 0,
        ].join(':');
      })
      .join('|'),
    shortcutsSignature = Object.entries(shortcuts)
      .map(([shortcutId, keys]) => shortcutId + ':' + (keys || []).join('+'))
      .join('|');
  return viewsSignature + '#' + shortcutsSignature;
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
      list7.map((item12) => item12.node.id)
    ),
    softBlockerRects2 = collectOcclusionRects(root, SOFT_OCCLUSION_SELECTOR),
    hardBlockerRects2 = collectOcclusionRects(root, HARD_OCCLUSION_SELECTOR),
    fullscreenBlockerRects2 = collectOcclusionRects(root, FULLSCREEN_OCCLUSION_SELECTOR),
    // 整轮同步只收一次遮挡物：每个视图重复扫 DOM 会把每次同步变成 O(节点数²)。
    canvasNodeOccluders2 = collectCanvasNodeOccluders(root),
    list8 = [];
  for (const { node: node3, tabs: tabs } of list7) {
    const value35 = map7.get(node3.id);
    for (const {
      tab: tab2,
      webUrl: webUrl2,
      pendingPopup: pendingPopup2,
      active: active2,
    } of tabs) {
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
          canvasNodeOccluders: canvasNodeOccluders2,
          root: root,
        })
      );
    }
  }
  return (
    list8.sort((item13, value36) => Number(item13.selected) - Number(value36.selected)),
    list8
  );
}
export function initWebPreviewViewSyncService({
  graphStore: graphStore2,
  root: root = document,
} = {}) {
  const webPreviewBridge = globalThis.window?.electronAPI?.webPreview;
  if (!webPreviewBridge || typeof webPreviewBridge.syncViews !== 'function')
    return { dispose() {} };
  const requestFrame = getRequestAnimationFrame(),
    cancelFrame = getCancelAnimationFrame(),
    syncViews =
      typeof webPreviewBridge.syncViewsFast === 'function'
        ? webPreviewBridge.syncViewsFast
        : webPreviewBridge.syncViews;
  let frameHandle = null,
    disposed = false,
    freezeToken4 = null;
  // 活跃节点只在 _persistRev 变化时重算：每帧全量扫一遍 nodes 会把同步循环变成热点，
  // 而 99% 的帧状态根本没变。
  const activityTracker = createWebPreviewNodeActivityTracker(graphStore2);
  let hasActiveWebPreviewNodes2 = activityTracker.hasActiveNodes;
  const run2 = () => {
      frameHandle = null;
      if (disposed) return;
      const canvasInteractionState = getCanvasInteractionState(freezeToken4);
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
          freezeToken4
        );
      setFreezeActiveClass(views.some((item14) => item14?.showSnapshot === true));
      // 快捷键表也要进签名：改键位后主进程必须重新下发，否则右键菜单会是旧文案。
      const contextMenuShortcuts = collectWebPreviewContextMenuShortcuts(),
        viewsSignature = buildViewsSignature(views, contextMenuShortcuts);
      if (viewsSignature === freezeToken4?.lastViewsSignature) return;
      if (freezeToken4) freezeToken4.lastViewsSignature = viewsSignature;
      try {
        const promise = syncViews({ views: views, contextMenuShortcuts: contextMenuShortcuts });
        promise && typeof promise.catch === 'function' && void promise.catch(() => {});
      } catch {}
    },
    handler4 = () => {
      if (disposed || frameHandle !== null) return;
      frameHandle = requestFrame(run2);
    },
    handler5 = () => {
      if (disposed) return;
      (frameHandle !== null && (cancelFrame(frameHandle), (frameHandle = null)), run2());
    },
    handler6 = () => {
      const canvasInteractionState2 = getCanvasInteractionState(freezeToken4);
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
    // 平移手势开始时先挂一个短冻结：惯性滚动还没停就同步，会看到预览来回跳。
    handler9 = () => {
      if (!hasActiveWebPreviewNodes2) return;
      (startPendingPanFreeze(freezeToken4), handler5());
    },
    value40 = (value41) => {
      if (!hasActiveWebPreviewNodes2) return;
      if (isPotentialCanvasPanStartEvent(value41)) {
        handler9();
        return;
      }
      handler4();
    },
    // 手势结束才解除冻结，随后再走一次立即同步。
    value42 = () => {
      (clearPendingPanFreeze(freezeToken4), run3());
    },
    value43 = () => {
      if (!hasActiveWebPreviewNodes2 || !freezeToken4) return;
      const canvasSpaceHeld2 = readCanvasSpaceHeld();
      if (freezeToken4.canvasSpaceHeld === canvasSpaceHeld2) return;
      ((freezeToken4.canvasSpaceHeld = canvasSpaceHeld2), handler5());
    },
    value44 = (value49) => {
      const wasActive = hasActiveWebPreviewNodes2;
      hasActiveWebPreviewNodes2 = activityTracker.refresh(value49);
      if (!hasActiveWebPreviewNodes2) {
        // 从「有预览」变成「没了」必须补一次同步，否则主进程会留着已删视图。
        if (wasActive) handler5();
        return;
      }
      handler7();
    },
    value45 =
      typeof graphStore2?.subscribeRaw === 'function'
        ? graphStore2.subscribeRaw(value44)
        : () => {},
    value46 =
      typeof webPreviewBridge.onEvent === 'function'
        ? webPreviewBridge.onEvent((detail) => {
            if (isNativePanStartPreviewEvent(detail)) handler9();
            globalThis.window?.dispatchEvent?.(
              new CustomEvent('web-preview:native-event', { detail: detail })
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
    value50 = root?.body || root?.documentElement || root;
  try {
    value47?.observe?.(value50, {
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
    globalThis.window?.addEventListener?.('shortcuts-updated', handler5),
    handler4(),
    {
      dispose() {
        ((disposed = true),
          clearFinalSyncTimer(freezeToken4),
          clearFreezeSettlingTimer(freezeToken4),
          clearPendingPanFreeze(freezeToken4));
        if (freezeToken4) freezeToken4.freezeSettlingUntil = 0;
        (setFreezeActiveClass(false), setFreezeSettlingClass(false));
        if (frameHandle !== null) cancelFrame(frameHandle);
        ((frameHandle = null),
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
          globalThis.window?.removeEventListener?.('shortcuts-updated', handler5),
          value47?.disconnect?.(),
          void webPreviewBridge.disposeViews?.());
      },
    }
  );
}
export { collectWebPreviewViews };

/**
 * 仅供单测驱动内部纯函数（遮挡采样、快照令牌、平移冻结）。
 * 运行时不要引用：这些不是稳定 API，随实现改。
 */
export const _webPreviewViewSyncInternalsForTest = {
  buildViewPayload,
  buildViewsSignature,
  getCanvasInteractionState,
  parseStackingZIndex,
  getElementZIndex,
  getElementVisibleRect,
  collectCanvasNodeOccluders,
  isOccludedByHigherCanvasNode,
  getDomOcclusionSamplePoints,
  isOccludedByRendererStack,
  getSlotSnapshotToken,
  getSlotSnapshotMetrics,
  readySnapshotMatchesBounds,
  isPendingPanFreezeActive,
  startPendingPanFreeze,
  clearPendingPanFreeze,
  readPositiveNumber,
  readGraphStoreState,
};
