import { findClosestNode, hitTestNode, worldToScreen } from '../../core/math.js';
import { getShortcuts } from '../shortcuts.js';
import { scrollElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
import {
  CANVAS_WHEEL_BEHAVIOR_PAN,
  readCanvasWheelBehavior,
} from '../settings/canvasControlSettings.js';
const CANVAS_UI_EXCLUSION_SELECTOR =
    '.header, .sidebar-floating, .canvas-controls-floating, .empty-hint, .fab-btn, .mascot-wrap, .node-add-menu, .minimap-wrapper',
  PANEL_SCROLL_SELECTOR =
    '.canvas-proj-dropdown, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel, .v2-file-history-panel',
  CANVAS_PAN_OVERLAY_SELECTOR = '.side-plus-btn',
  // 白板正在被编辑时，滚轮归白板自己（缩放/平移会打断绘制的坐标基准）。
  ACTIVE_WHITEBOARD_INTERACTION_SELECTOR = '.whiteboard-node-component.is-whiteboard-editing';
function selectVideoInteractionLockState(options = {}) {
  const value = options.videoKeying || null,
    item = options.videoClip || null,
    nodeId = value?.active ? value : item?.active ? item : null;
  return { active: !!nodeId?.active, nodeId: nodeId?.nodeId || null };
}
function getInitialState(store) {
  if (typeof store?.getState === 'function') return store.getState() || {};
  return {};
}
function subscribeSelectorOrPrime(store2, handler, handler2) {
  if (typeof store2?.subscribeSelector === 'function')
    return store2.subscribeSelector(handler, handler2);
  return (handler2(handler(getInitialState(store2))), () => {});
}
function subscribeRawOrPrime(key, handler3) {
  if (typeof key?.subscribeRaw === 'function') return key.subscribeRaw(handler3);
  return (handler3(getInitialState(key)), () => {});
}
function getRequiredInteractionFunction(index, result) {
  const data = index?.[result];
  if (typeof data !== 'function')
    throw new TypeError('[appCanvasPointerBindings] missing interaction.' + result);
  return data;
}
export function createCanvasPointerStateCache({ graphStore: graphStore, uiStore: uiStore } = {}) {
  const cache = {
      nodes: {},
      videoInteractionLock: null,
      pickerVisible: false,
      annotateActive: false,
    },
    list = [
      subscribeRawOrPrime(graphStore, (target) => {
        cache.nodes = target?.nodes || {};
      }),
      subscribeSelectorOrPrime(uiStore, selectVideoInteractionLockState, (source) => {
        cache.videoInteractionLock = source?.active ? source : null;
      }),
      subscribeSelectorOrPrime(
        uiStore,
        (enabled) => !!enabled.picker?.visible,
        (enabled2) => {
          cache.pickerVisible = !!enabled2;
        }
      ),
      subscribeSelectorOrPrime(
        uiStore,
        (enabled3) => !!enabled3.annotate?.active,
        (enabled4) => {
          cache.annotateActive = !!enabled4;
        }
      ),
    ];
  return {
    cache: cache,
    dispose() {
      list.forEach((item2) => item2?.());
    },
  };
}
function isVideoInteractionLocked(enabled5) {
  return !!enabled5.videoInteractionLock?.active;
}
function isPanoramaEditing(next) {
  const current = next?.type === 'panorama-360' ? next?.panorama360Node : next?.sceneNode;
  return (
    (next?.type === 'panorama-scene' || next?.type === 'panorama-360') &&
    next?.isCollapsed !== true &&
    current?.ui?.isEditing === true
  );
}
function blurActiveEditableForCanvasPointer(el, dom) {
  if (!el) return;
  if (el.closest?.("input, textarea, [contenteditable='true']")) return;
  const enabled6 = dom?.activeElement;
  if (!enabled6) return;
  const entry =
    enabled6.tagName === 'INPUT' ||
    enabled6.tagName === 'TEXTAREA' ||
    enabled6.contentEditable === 'true';
  entry && typeof enabled6.blur === 'function' && enabled6.blur();
}
function isScrollableTextEditWheel(el2, dom2) {
  const el3 = el2?.closest?.('.source-text-content');
  if (!el3 || dom2?.activeElement !== el3) return false;
  return el3.scrollHeight > el3.clientHeight;
}

// ---------------------------------------------------------------------------
// 滚轮手势路由
//
// 滚轮在不同场景下含义不同：画布上默认缩放（可改为平移）、按住 Shift 横向平移、
// 落在可滚动容器里交给容器、白板编辑中完全让给白板。deltaMode 也要归一化——
// Firefox 按「行 / 页」上报，直接当像素用会导致滚一格跳半屏。
// ---------------------------------------------------------------------------

/** 把 deltaMode 换算成像素倍数：0 像素、1 行（16px）、2 页（视口高度）。 */
function getWheelDeltaScale(deltaMode, pageSize) {
  if (deltaMode === 1) return 16;
  if (deltaMode === 2) return Math.max(1, Number(pageSize) || 800);
  return 1;
}

function normalizeWheelDelta(rawDelta, deltaMode, pageSize) {
  const delta = Number(rawDelta);
  if (!Number.isFinite(delta)) return 0;
  return delta * getWheelDeltaScale(deltaMode, pageSize);
}

/** 判定这次滚轮是缩放还是平移，并给出归一化后的位移。 */
export function resolveCanvasWheelGesture(
  event,
  behavior = readCanvasWheelBehavior(),
  viewport = {}
) {
  const mode = behavior === CANVAS_WHEEL_BEHAVIOR_PAN ? 'pan' : 'zoom',
    deltaMode = Number(event?.deltaMode) || 0,
    rawDeltaX = Number(event?.deltaX) || 0,
    rawDeltaY = Number(event?.deltaY) || 0;
  // Ctrl/Meta 永远走缩放：这是浏览器与触摸板捏合的通用语义，不能被「平移」偏好覆盖。
  if (mode !== 'pan' || event?.ctrlKey || event?.metaKey) {
    const zoomDelta = rawDeltaY || rawDeltaX;
    return {
      type: 'zoom',
      deltaY: normalizeWheelDelta(
        zoomDelta,
        deltaMode,
        rawDeltaY ? viewport.height : viewport.width
      ),
    };
  }
  if (event?.shiftKey) {
    // Shift 把纵向滚动转成横向平移，很多鼠标没有横向滚轮。
    const panDelta = rawDeltaX || rawDeltaY;
    return {
      type: 'pan',
      deltaX: normalizeWheelDelta(panDelta, deltaMode, viewport.width),
      deltaY: 0,
    };
  }
  return {
    type: 'pan',
    deltaX: normalizeWheelDelta(rawDeltaX, deltaMode, viewport.width),
    deltaY: normalizeWheelDelta(rawDeltaY, deltaMode, viewport.height),
  };
}

/** 取元素的计算样式；优先它自己的 window，跨 iframe 也要取对。 */
function getElementComputedStyle(element, fallbackWindow) {
  const getComputedStyle =
    element?.ownerDocument?.defaultView?.getComputedStyle || fallbackWindow?.getComputedStyle;
  if (typeof getComputedStyle !== 'function') return null;
  try {
    return getComputedStyle.call(element?.ownerDocument?.defaultView || fallbackWindow, element);
  } catch {
    return null;
  }
}

function isScrollableOverflowValue(overflowValue) {
  return overflowValue === 'auto' || overflowValue === 'scroll' || overflowValue === 'overlay';
}

/**
 * 找到真正该滚动的祖先容器。只认「内容确实溢出且 overflow 允许滚动」的元素——
 * 仅凭 overflow 样式会把 `overflow:auto` 但内容装得下的容器也算进来，滚轮就白滚。
 */
export function findScrollableWheelAncestor(startElement, boundaryElement, fallbackWindow) {
  let current = startElement?.nodeType === 3 ? startElement.parentElement : startElement;
  while (current && current !== boundaryElement) {
    const overflowsVertically = Number(current.scrollHeight) > Number(current.clientHeight),
      overflowsHorizontally = Number(current.scrollWidth) > Number(current.clientWidth);
    if (overflowsHorizontally || overflowsVertically) {
      const style = getElementComputedStyle(current, fallbackWindow),
        overflowShorthand = style?.overflow,
        scrollsVertically =
          overflowsVertically &&
          (isScrollableOverflowValue(style?.overflowY) ||
            isScrollableOverflowValue(overflowShorthand)),
        scrollsHorizontally =
          overflowsHorizontally &&
          (isScrollableOverflowValue(style?.overflowX) ||
            isScrollableOverflowValue(overflowShorthand));
      if (scrollsHorizontally || scrollsVertically) return current;
    }
    current = current.parentElement || null;
  }
  return null;
}

function isActiveWhiteboardInteractionTarget(target) {
  return !!target?.closest?.(ACTIVE_WHITEBOARD_INTERACTION_SELECTOR);
}

/** 把快捷键里的修饰键写法归一（control/meta → Ctrl、option → Alt）。 */
function normalizeModifierShortcutToken(token) {
  const normalized = String(token || '')
    .trim()
    .toLowerCase();
  if (normalized === 'ctrl' || normalized === 'control' || normalized === 'meta') return 'Ctrl';
  if (normalized === 'shift') return 'Shift';
  if (normalized === 'alt' || normalized === 'option') return 'Alt';
  return '';
}

/**
 * 某动作的快捷键是否正好是「单个修饰键」并按住了它。只支持修饰键：
 * 组合键在滚轮上无法可靠判定（按键顺序任意），与其猜不如返回 false。
 */
function isPointerModifierShortcutActive(event, shortcutId, fallbackKey) {
  const configuredKeys = getShortcuts?.()?.[shortcutId]?.keys,
    keys =
      Array.isArray(configuredKeys) && configuredKeys.length > 0 ? configuredKeys : [fallbackKey];
  if (keys.length !== 1) return false;
  const modifier = normalizeModifierShortcutToken(keys[0]);
  if (modifier === 'Ctrl') return !!(event?.ctrlKey || event?.metaKey);
  if (modifier === 'Shift') return event?.shiftKey === true;
  if (modifier === 'Alt') return event?.altKey === true;
  return false;
}
function isCanvasPanSurfaceTarget(el4, enabled7) {
  if (!el4 || !enabled7) return false;
  if (enabled7.contains?.(el4)) return true;
  return !!el4.closest?.(CANVAS_PAN_OVERLAY_SELECTOR);
}
function createLastPointerTracker(enabled8) {
  const x = { x: Number(enabled8?.innerWidth) / 2 || 0, y: Number(enabled8?.innerHeight) / 2 || 0 };
  function run() {
    if (!enabled8) return;
    ((enabled8._lastMx = x.x), (enabled8._lastMy = x.y));
  }
  function updateFromEvent(event) {
    ((x.x = event.clientX), (x.y = event.clientY), run());
  }
  return (
    run(),
    {
      updateFromEvent: updateFromEvent,
      getCursorScreenPosition() {
        return { x: x.x, y: x.y };
      },
    }
  );
}
export function installAppCanvasPointerBindings({
  graphStore: graphStore2,
  uiStore: uiStore2,
  wrap: wrap,
  appViewport: appViewport,
  interaction: interaction,
  targetWindow: targetWindow = typeof window === 'undefined' ? null : window,
  targetDocument: targetDocument = typeof document === 'undefined' ? null : document,
  getCanvasWheelBehavior: getCanvasWheelBehavior = readCanvasWheelBehavior,
} = {}) {
  const run2 = getRequiredInteractionFunction(interaction, 'getDragContext'),
    handler4 = getRequiredInteractionFunction(interaction, 'handleContextMenu'),
    handler5 = getRequiredInteractionFunction(interaction, 'handlePointerDown'),
    handler6 = getRequiredInteractionFunction(interaction, 'handlePointerMove'),
    handler7 = getRequiredInteractionFunction(interaction, 'handlePointerUp'),
    handler8 = getRequiredInteractionFunction(interaction, 'handleWheel'),
    handler11 = getRequiredInteractionFunction(interaction, 'handleWheelPan'),
    settleWheelZoom =
      typeof interaction?.settleWheelZoom === 'function' ? interaction.settleWheelZoom : null,
    settleWheelPan =
      typeof interaction?.settleWheelPan === 'function' ? interaction.settleWheelPan : null,
    handler9 = getRequiredInteractionFunction(interaction, 'initConnectionHandles'),
    handler10 = getRequiredInteractionFunction(interaction, 'initPickConnect'),
    canvasPointerStateCache = createCanvasPointerStateCache({
      graphStore: graphStore2,
      uiStore: uiStore2,
    }),
    { cache: cache2 } = canvasPointerStateCache,
    getCursorScreenPosition2 = createLastPointerTracker(targetWindow),
    list2 = [];
  let value2 = null,
    record = false;
  function run3() {
    return targetDocument?.getElementById?.('v2-wrap') || wrap || null;
  }
  function run4(el5, payload, handle, state) {
    if (!el5 || typeof el5.addEventListener !== 'function') return;
    (el5.addEventListener(payload, handle, state),
      list2.push(() => el5.removeEventListener?.(payload, handle, state)));
  }
  /** 按手势类型分发：缩放走 handleWheel，平移走 handleWheelPan。 */
  function handleCanvasWheelGesture(event, wheelTarget) {
    const gesture = resolveCanvasWheelGesture(event, getCanvasWheelBehavior?.(), {
        width: Number(targetWindow?.innerWidth) || 0,
        height: Number(targetWindow?.innerHeight) || 0,
      }),
      hasDelta =
        gesture.type === 'zoom'
          ? gesture.deltaY !== 0
          : gesture.deltaX !== 0 || gesture.deltaY !== 0;
    if (!hasDelta) return false;
    (event.preventDefault(), (event.__aiCanvasWheelHandled = true));
    if (isVideoInteractionLocked(cache2)) return true;
    if (gesture.type === 'zoom') {
      // 先结束进行中的平移惯性，再缩放：两者同时跑会互相打架。
      settleWheelPan?.();
      appViewport?.clearTrackedFocus?.('wheel-zoom');
      handler8(event.clientX, event.clientY, gesture.deltaY, wheelTarget);
    } else {
      settleWheelZoom?.();
      appViewport?.clearTrackedFocus?.('wheel-pan');
      handler11(gesture.deltaX, gesture.deltaY, wheelTarget);
    }
    return true;
  }
  targetWindow &&
    (targetWindow._mathImports = {
      findClosestNode: findClosestNode,
      worldToScreen: worldToScreen,
      hitTestNode: hitTestNode,
    });
  const config = run3();
  return (
    handler10(config),
    handler9(config),
    run4(
      targetWindow,
      'pointerdown',
      (event2) => {
        const el6 = run3();
        if (!isCanvasPanSurfaceTarget(event2.target, el6)) return;
        const el7 = event2.target?.closest?.('.panorama-scene-viewport');
        if (el7) {
          const scope = el7.closest('.v2-node'),
            input = scope?.id || '',
            output = input ? cache2.nodes?.[input] : null;
          if (isPanoramaEditing(output)) return;
        }
        const value3 = cache2.videoInteractionLock;
        if (value3?.active) {
          const value4 = value3.nodeId ? targetDocument?.getElementById?.(value3.nodeId) : null;
          if (value4 && value4.contains(event2.target)) return;
          (event2.preventDefault(), event2.stopPropagation());
          return;
        }
        const enabled9 = event2.button === 1 || (targetWindow?._spaceHeld && event2.button === 0);
        if (!enabled9) return;
        (event2.preventDefault(),
          event2.stopPropagation(),
          appViewport?.clearTrackedFocus?.('pan-start'));
        if (targetWindow?._spaceHeld) el6.style.cursor = 'var(--grab-cursor)';
        const enabled10 = run2(),
          enabled11 = !!enabled10?.isDragging;
        try {
          (el6.setPointerCapture(event2.pointerId), (value2 = event2.pointerId));
        } catch {}
        !enabled11 && handler5(event2.clientX, event2.clientY, true, false, event2);
      },
      { capture: true }
    ),
    run4(wrap, 'pointerdown', (event3) => {
      getCursorScreenPosition2.updateFromEvent(event3);
      const value5 = event3.target?.closest?.(CANVAS_UI_EXCLUSION_SELECTOR);
      if (value5) return;
      (blurActiveEditableForCanvasPointer(event3.target, targetDocument),
        uiStore2?.hideContextMenu?.());
      const value6 = cache2.videoInteractionLock;
      if (value6?.active) {
        const enabled12 = value6.nodeId ? targetDocument?.getElementById?.(value6.nodeId) : null;
        if (!enabled12 || !enabled12.contains(event3.target)) return;
        return;
      }
      // 走快捷键表而不是硬编码 Alt：用户把「拖拽创建连线副本」改到别的修饰键后
      // 这里要跟着变，否则改了键位不生效。
      const value7 =
        isPointerModifierShortcutActive(event3, 'duplicate-with-edges', 'Alt') &&
        !targetWindow?._spaceHeld;
      if (cache2.pickerVisible) {
        uiStore2?.hidePicker?.();
        return;
      }
      handler5(event3.clientX, event3.clientY, false, value7, event3);
      if (value2 != null) return;
      const value8 = run2();
      value8.isPanning && appViewport?.clearTrackedFocus?.('pan-start');
      if (value8.isPanning || value8.isConnecting || value8.isBoxSelecting || value8.isDraggingCell)
        try {
          (wrap.setPointerCapture(event3.pointerId), (value2 = event3.pointerId));
        } catch {}
    }),
    run4(wrap, 'dblclick', () => {}),
    run4(wrap, 'contextmenu', (event4) => {
      if (event4.__aiCanvasGroupedEditableContextMenu) return;
      (event4.preventDefault(),
        event4.target?.closest?.('.v2-node') && handler4(event4.clientX, event4.clientY));
    }),
    run4(wrap, 'pointermove', (event5) => {
      getCursorScreenPosition2.updateFromEvent(event5);
      if (isVideoInteractionLocked(cache2)) return;
      record && run2()?.isDragging && (event5.__aiCanvasLeftDragHeld = true);
      handler6(event5.clientX, event5.clientY, event5);
      if (value2 != null) return;
      const value9 = run2();
      if (value9.isDragging && value9.hasMoved)
        try {
          (wrap.setPointerCapture(event5.pointerId), (value2 = event5.pointerId));
        } catch {}
    }),
    run4(wrap, 'pointerup', (event6) => {
      if (isVideoInteractionLocked(cache2)) return;
      const enabled13 = run2(),
        value10 = !!enabled13?.isDragging && event6.button !== 0 && (event6.buttons & 1) !== 0;
      if (value10) {
        ((record = true),
          (event6.__aiCanvasLeftDragHeld = true),
          handler6(event6.clientX, event6.clientY, event6));
        if (targetWindow?._spaceHeld) wrap.style.cursor = 'var(--grab-cursor)';
        return;
      }
      ((record = false), (value2 = null), handler7(event6.clientX, event6.clientY));
      if (targetWindow?._spaceHeld) wrap.style.cursor = 'var(--grab-cursor)';
    }),
    run4(wrap, 'pointercancel', (event7) => {
      ((record = false), (value2 = null));
      if (isVideoInteractionLocked(cache2)) return;
      handler7(event7.clientX, event7.clientY);
      if (targetWindow?._spaceHeld) wrap.style.cursor = 'var(--grab-cursor)';
    }),
    run4(targetDocument, 'pointerup', (event8) => {
      const el8 = run3(),
        enabled14 = run2(),
        value11 = !!enabled14?.isDragging && event8.button !== 0 && (event8.buttons & 1) !== 0;
      if (value2 != null) {
        if (value11) {
          ((record = true),
            (event8.__aiCanvasLeftDragHeld = true),
            handler6(event8.clientX, event8.clientY, event8));
          return;
        }
        ((record = false), (value2 = null));
        return;
      }
      if (el8 && el8.contains(event8.target)) return;
      if (value11) {
        ((record = true),
          (event8.__aiCanvasLeftDragHeld = true),
          handler6(event8.clientX, event8.clientY, event8));
        return;
      }
      ((record = false),
        handler7(),
        targetWindow?._spaceHeld && el8 && (el8.style.cursor = 'var(--grab-cursor)'));
    }),
    run4(
      wrap,
      'wheel',
      (event9) => {
        if (event9.__aiCanvasWheelHandled) return;
        getCursorScreenPosition2.updateFromEvent(event9);
        const el9 = event9.target;
        // 白板编辑中滚轮归白板：画布跟着缩放会打断正在画的坐标。
        if (isActiveWhiteboardInteractionTarget(el9)) return;
        // 落在可滚动容器里就交给容器滚（面板、列表），只在它不能纵向滚时兜底横向滚动。
        const scrollableAncestor = findScrollableWheelAncestor(el9, wrap, targetWindow);
        if (scrollableAncestor) {
          const style = getElementComputedStyle(scrollableAncestor, targetWindow),
            scrollsVertically =
              scrollableAncestor.scrollHeight > scrollableAncestor.clientHeight &&
              isScrollableOverflowValue(style?.overflowY || style?.overflow);
          if (!scrollsVertically && !event9.ctrlKey && !event9.metaKey) {
            scrollElementHorizontallyWithWheel(event9, scrollableAncestor);
            event9.preventDefault();
          }
          return;
        }
        if (el9?.closest?.(PANEL_SCROLL_SELECTOR)) return;
        const value12 = el9?.tagName,
          value13 =
            value12 === 'INPUT' ||
            value12 === 'TEXTAREA' ||
            el9?.contentEditable === 'true' ||
            el9?.closest?.('[contenteditable="true"]');
        if (value13 || isScrollableTextEditWheel(el9, targetDocument)) return;
        handleCanvasWheelGesture(event9, el9);
      },
      { passive: false }
    ),
    run4(
      targetDocument,
      'wheel',
      (event10) => {
        // Ctrl/Meta + 滚轮在触控板上就是捏合，浏览器会跟着缩放整页，必须压住。
        (event10.ctrlKey || event10.metaKey) && event10.preventDefault();
        const el10 = event10.target;
        if (!el10) return;
        getCursorScreenPosition2.updateFromEvent(event10);
        const enabled15 = el10.closest?.('.side-plus-btn'),
          enabled16 = el10.closest?.('#v2-conn-scissor-btn') || el10.closest?.('.conn-scissor-btn');
        if (!enabled15 && !enabled16) return;
        if (cache2.annotateActive) return;
        handleCanvasWheelGesture(event10, el10);
      },
      { passive: false, capture: true }
    ),
    run4(wrap, 'mousedown', (event11) => {
      if (event11.button === 1) event11.preventDefault();
    }),
    {
      getCursorScreenPosition: getCursorScreenPosition2.getCursorScreenPosition,
      dispose() {
        (list2.splice(0).forEach((handler11) => handler11()), canvasPointerStateCache.dispose());
      },
    }
  );
}

/**
 * 仅供单测驱动内部纯函数（滚轮单位换算、修饰键判定、滚动容器识别）。
 * 运行时不要引用：随实现改。
 */
export const _appCanvasPointerBindingsInternalsForTest = {
  getWheelDeltaScale,
  normalizeWheelDelta,
  getElementComputedStyle,
  isScrollableOverflowValue,
  isActiveWhiteboardInteractionTarget,
  normalizeModifierShortcutToken,
  isPointerModifierShortcutActive,
};
