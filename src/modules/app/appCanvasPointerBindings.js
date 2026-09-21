import { findClosestNode, hitTestNode, worldToScreen } from '../../core/math.js';
const CANVAS_UI_EXCLUSION_SELECTOR =
    '.header, .sidebar-floating, .canvas-controls-floating, .empty-hint, .fab-btn, .mascot-wrap, .node-add-menu, .minimap-wrapper',
  PANEL_SCROLL_SELECTOR =
    '.canvas-proj-dropdown, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel, .v2-file-history-panel',
  CANVAS_PAN_OVERLAY_SELECTOR = '.side-plus-btn';
function selectVideoInteractionLockState(_0x569e46 = {}) {
  const _0x1db325 = _0x569e46.videoKeying || null,
    _0x57d0a1 = _0x569e46.videoClip || null,
    _0x22b30b = _0x1db325?.active ? _0x1db325 : _0x57d0a1?.active ? _0x57d0a1 : null;
  return { active: !!_0x22b30b?.active, nodeId: _0x22b30b?.nodeId || null };
}
function getInitialState(_0x3d5cee) {
  if (typeof _0x3d5cee?.getState === 'function') return _0x3d5cee.getState() || {};
  return {};
}
function subscribeSelectorOrPrime(_0x56f12b, _0x26925a, _0x450357) {
  if (typeof _0x56f12b?.subscribeSelector === 'function')
    return _0x56f12b.subscribeSelector(_0x26925a, _0x450357);
  return (_0x450357(_0x26925a(getInitialState(_0x56f12b))), () => {});
}
function subscribeRawOrPrime(_0x318e04, _0x47c337) {
  if (typeof _0x318e04?.subscribeRaw === 'function') return _0x318e04.subscribeRaw(_0x47c337);
  return (_0x47c337(getInitialState(_0x318e04)), () => {});
}
function getRequiredInteractionFunction(_0x3c9d92, _0xbee824) {
  const _0x304b7d = _0x3c9d92?.[_0xbee824];
  if (typeof _0x304b7d !== 'function')
    throw new TypeError('[appCanvasPointerBindings] missing interaction.' + _0xbee824);
  return _0x304b7d;
}
export function createCanvasPointerStateCache({ graphStore: _0x2ce3f2, uiStore: _0x213536 } = {}) {
  const _0x1e9991 = { nodes: {}, videoInteractionLock: null, pickerVisible: false, annotateActive: false },
    _0x1c853e = [
      subscribeRawOrPrime(_0x2ce3f2, (_0x4bf260) => {
        _0x1e9991.nodes = _0x4bf260?.nodes || {};
      }),
      subscribeSelectorOrPrime(_0x213536, selectVideoInteractionLockState, (_0x3aa2b0) => {
        _0x1e9991.videoInteractionLock = _0x3aa2b0?.active ? _0x3aa2b0 : null;
      }),
      subscribeSelectorOrPrime(
        _0x213536,
        (_0x4caf4a) => !!_0x4caf4a.picker?.visible,
        (_0x1ace3d) => {
          _0x1e9991.pickerVisible = !!_0x1ace3d;
        },
      ),
      subscribeSelectorOrPrime(
        _0x213536,
        (_0x324a93) => !!_0x324a93.annotate?.active,
        (_0x502ee7) => {
          _0x1e9991.annotateActive = !!_0x502ee7;
        },
      ),
    ];
  return {
    cache: _0x1e9991,
    dispose() {
      _0x1c853e.forEach((_0x2f3d49) => _0x2f3d49?.());
    },
  };
}
function isVideoInteractionLocked(_0x206c76) {
  return !!_0x206c76.videoInteractionLock?.active;
}
function isPanoramaEditing(_0x53c290) {
  const _0x117d9a = _0x53c290?.type === 'panorama-360' ? _0x53c290?.panorama360Node : _0x53c290?.sceneNode;
  return (
    (_0x53c290?.type === 'panorama-scene' || _0x53c290?.type === 'panorama-360') &&
    _0x53c290?.isCollapsed !== true &&
    _0x117d9a?.ui?.isEditing === true
  );
}
function blurActiveEditableForCanvasPointer(_0x563022, _0x490905) {
  if (!_0x563022) return;
  if (_0x563022.closest?.("input, textarea, [contenteditable='true']")) return;
  const _0x163342 = _0x490905?.activeElement;
  if (!_0x163342) return;
  const _0x5025ba =
    _0x163342.tagName === 'INPUT' || _0x163342.tagName === 'TEXTAREA' || _0x163342.contentEditable === 'true';
  _0x5025ba && typeof _0x163342.blur === 'function' && _0x163342.blur();
}
function isScrollableTextEditWheel(_0x4410f5, _0xdf5e13) {
  const _0x262837 = _0x4410f5?.closest?.('.source-text-content');
  if (!_0x262837 || _0xdf5e13?.activeElement !== _0x262837) return false;
  return _0x262837.scrollHeight > _0x262837.clientHeight;
}
function isCanvasPanSurfaceTarget(_0x34dd26, _0x55a018) {
  if (!_0x34dd26 || !_0x55a018) return false;
  if (_0x55a018.contains?.(_0x34dd26)) return true;
  return !!_0x34dd26.closest?.(CANVAS_PAN_OVERLAY_SELECTOR);
}
function createLastPointerTracker(_0x564ce3) {
  const _0x260c87 = { x: Number(_0x564ce3?.innerWidth) / 2 || 0, y: Number(_0x564ce3?.innerHeight) / 2 || 0 };
  function _0x998a49() {
    if (!_0x564ce3) return;
    ((_0x564ce3._lastMx = _0x260c87.x), (_0x564ce3._lastMy = _0x260c87.y));
  }
  function _0x12b46e(_0x535de9) {
    ((_0x260c87.x = _0x535de9.clientX), (_0x260c87.y = _0x535de9.clientY), _0x998a49());
  }
  return (
    _0x998a49(),
    {
      updateFromEvent: _0x12b46e,
      getCursorScreenPosition() {
        return { x: _0x260c87.x, y: _0x260c87.y };
      },
    }
  );
}
export function installAppCanvasPointerBindings({
  graphStore: _0x209285,
  uiStore: _0x5c5041,
  wrap: _0x5acae5,
  appViewport: _0x10d42a,
  interaction: _0x1d04e5,
  targetWindow: targetWindow = typeof window === 'undefined' ? null : window,
  targetDocument: targetDocument = typeof document === 'undefined' ? null : document,
} = {}) {
  const _0x44b8e1 = getRequiredInteractionFunction(_0x1d04e5, 'getDragContext'),
    _0x576f5b = getRequiredInteractionFunction(_0x1d04e5, 'handleContextMenu'),
    _0x3dbb37 = getRequiredInteractionFunction(_0x1d04e5, 'handlePointerDown'),
    _0x1f478f = getRequiredInteractionFunction(_0x1d04e5, 'handlePointerMove'),
    _0x280c16 = getRequiredInteractionFunction(_0x1d04e5, 'handlePointerUp'),
    _0x218536 = getRequiredInteractionFunction(_0x1d04e5, 'handleWheel'),
    _0x28f05e = getRequiredInteractionFunction(_0x1d04e5, 'initConnectionHandles'),
    _0x142865 = getRequiredInteractionFunction(_0x1d04e5, 'initPickConnect'),
    _0x4b68f4 = createCanvasPointerStateCache({ graphStore: _0x209285, uiStore: _0x5c5041 }),
    { cache: _0x3c80f7 } = _0x4b68f4,
    _0x28a2ab = createLastPointerTracker(targetWindow),
    _0x26352e = [];
  let _0x2e2165 = null,
    _0x2333e8 = false;
  function _0x689734() {
    return targetDocument?.getElementById?.('v2-wrap') || _0x5acae5 || null;
  }
  function _0x5aebe4(_0x1f422a, _0x296060, _0x164361, _0x12de28) {
    if (!_0x1f422a || typeof _0x1f422a.addEventListener !== 'function') return;
    (_0x1f422a.addEventListener(_0x296060, _0x164361, _0x12de28),
      _0x26352e.push(() => _0x1f422a.removeEventListener?.(_0x296060, _0x164361, _0x12de28)));
  }
  targetWindow &&
    (targetWindow._mathImports = {
      findClosestNode: findClosestNode,
      worldToScreen: worldToScreen,
      hitTestNode: hitTestNode,
    });
  const _0x496828 = _0x689734();
  return (
    _0x142865(_0x496828),
    _0x28f05e(_0x496828),
    _0x5aebe4(
      targetWindow,
      'pointerdown',
      (_0xc9e889) => {
        const _0xe6de77 = _0x689734();
        if (!isCanvasPanSurfaceTarget(_0xc9e889.target, _0xe6de77)) return;
        const _0x5f28fe = _0xc9e889.target?.closest?.('.panorama-scene-viewport');
        if (_0x5f28fe) {
          const _0x46a484 = _0x5f28fe.closest('.v2-node'),
            _0x114c9f = _0x46a484?.id || '',
            _0x86f4e2 = _0x114c9f ? _0x3c80f7.nodes?.[_0x114c9f] : null;
          if (isPanoramaEditing(_0x86f4e2)) return;
        }
        const _0x2cd363 = _0x3c80f7.videoInteractionLock;
        if (_0x2cd363?.active) {
          const _0x290f04 = _0x2cd363.nodeId ? targetDocument?.getElementById?.(_0x2cd363.nodeId) : null;
          if (_0x290f04 && _0x290f04.contains(_0xc9e889.target)) return;
          (_0xc9e889.preventDefault(), _0xc9e889.stopPropagation());
          return;
        }
        const _0xba1d39 = _0xc9e889.button === 1 || (targetWindow?._spaceHeld && _0xc9e889.button === 0);
        if (!_0xba1d39) return;
        (_0xc9e889.preventDefault(),
          _0xc9e889.stopPropagation(),
          _0x10d42a?.clearTrackedFocus?.('pan-start'));
        if (targetWindow?._spaceHeld) _0xe6de77.style.cursor = 'var(--grab-cursor)';
        const _0xdc7b97 = _0x44b8e1(),
          _0x3b750a = !!_0xdc7b97?.isDragging;
        try {
          (_0xe6de77.setPointerCapture(_0xc9e889.pointerId), (_0x2e2165 = _0xc9e889.pointerId));
        } catch {}
        !_0x3b750a && _0x3dbb37(_0xc9e889.clientX, _0xc9e889.clientY, true, false, _0xc9e889);
      },
      { capture: true },
    ),
    _0x5aebe4(_0x5acae5, 'pointerdown', (_0x58a598) => {
      _0x28a2ab.updateFromEvent(_0x58a598);
      const _0x5e4d43 = _0x58a598.target?.closest?.(CANVAS_UI_EXCLUSION_SELECTOR);
      if (_0x5e4d43) return;
      (blurActiveEditableForCanvasPointer(_0x58a598.target, targetDocument), _0x5c5041?.hideContextMenu?.());
      const _0x4c46f2 = _0x3c80f7.videoInteractionLock;
      if (_0x4c46f2?.active) {
        const _0x1195b8 = _0x4c46f2.nodeId ? targetDocument?.getElementById?.(_0x4c46f2.nodeId) : null;
        if (!_0x1195b8 || !_0x1195b8.contains(_0x58a598.target)) return;
        return;
      }
      const _0x2b005d = _0x58a598.altKey && !targetWindow?._spaceHeld;
      if (_0x3c80f7.pickerVisible) {
        _0x5c5041?.hidePicker?.();
        return;
      }
      _0x3dbb37(_0x58a598.clientX, _0x58a598.clientY, false, _0x2b005d, _0x58a598);
      if (_0x2e2165 != null) return;
      const _0xf94438 = _0x44b8e1();
      _0xf94438.isPanning && _0x10d42a?.clearTrackedFocus?.('pan-start');
      if (
        _0xf94438.isPanning ||
        _0xf94438.isConnecting ||
        _0xf94438.isBoxSelecting ||
        _0xf94438.isDraggingCell
      )
        try {
          (_0x5acae5.setPointerCapture(_0x58a598.pointerId), (_0x2e2165 = _0x58a598.pointerId));
        } catch {}
    }),
    _0x5aebe4(_0x5acae5, 'dblclick', () => {}),
    _0x5aebe4(_0x5acae5, 'contextmenu', (_0x2b4cad) => {
      if (_0x2b4cad.__aiCanvasGroupedEditableContextMenu) return;
      (_0x2b4cad.preventDefault(),
        _0x2b4cad.target?.closest?.('.v2-node') && _0x576f5b(_0x2b4cad.clientX, _0x2b4cad.clientY));
    }),
    _0x5aebe4(_0x5acae5, 'pointermove', (_0x795121) => {
      _0x28a2ab.updateFromEvent(_0x795121);
      if (isVideoInteractionLocked(_0x3c80f7)) return;
      _0x2333e8 && _0x44b8e1()?.isDragging && (_0x795121.__aiCanvasLeftDragHeld = true);
      _0x1f478f(_0x795121.clientX, _0x795121.clientY, _0x795121);
      if (_0x2e2165 != null) return;
      const _0x1f5803 = _0x44b8e1();
      if (_0x1f5803.isDragging && _0x1f5803.hasMoved)
        try {
          (_0x5acae5.setPointerCapture(_0x795121.pointerId), (_0x2e2165 = _0x795121.pointerId));
        } catch {}
    }),
    _0x5aebe4(_0x5acae5, 'pointerup', (_0x55312b) => {
      if (isVideoInteractionLocked(_0x3c80f7)) return;
      const _0x562241 = _0x44b8e1(),
        _0x3fc87c = !!_0x562241?.isDragging && _0x55312b.button !== 0 && (_0x55312b.buttons & 1) !== 0;
      if (_0x3fc87c) {
        ((_0x2333e8 = true),
          (_0x55312b.__aiCanvasLeftDragHeld = true),
          _0x1f478f(_0x55312b.clientX, _0x55312b.clientY, _0x55312b));
        if (targetWindow?._spaceHeld) _0x5acae5.style.cursor = 'var(--grab-cursor)';
        return;
      }
      ((_0x2333e8 = false), (_0x2e2165 = null), _0x280c16(_0x55312b.clientX, _0x55312b.clientY));
      if (targetWindow?._spaceHeld) _0x5acae5.style.cursor = 'var(--grab-cursor)';
    }),
    _0x5aebe4(_0x5acae5, 'pointercancel', (_0x378a7e) => {
      ((_0x2333e8 = false), (_0x2e2165 = null));
      if (isVideoInteractionLocked(_0x3c80f7)) return;
      _0x280c16(_0x378a7e.clientX, _0x378a7e.clientY);
      if (targetWindow?._spaceHeld) _0x5acae5.style.cursor = 'var(--grab-cursor)';
    }),
    _0x5aebe4(targetDocument, 'pointerup', (_0x1de014) => {
      const _0x524703 = _0x689734(),
        _0x31f0c0 = _0x44b8e1(),
        _0x512fad = !!_0x31f0c0?.isDragging && _0x1de014.button !== 0 && (_0x1de014.buttons & 1) !== 0;
      if (_0x2e2165 != null) {
        if (_0x512fad) {
          ((_0x2333e8 = true),
            (_0x1de014.__aiCanvasLeftDragHeld = true),
            _0x1f478f(_0x1de014.clientX, _0x1de014.clientY, _0x1de014));
          return;
        }
        ((_0x2333e8 = false), (_0x2e2165 = null));
        return;
      }
      if (_0x524703 && _0x524703.contains(_0x1de014.target)) return;
      if (_0x512fad) {
        ((_0x2333e8 = true),
          (_0x1de014.__aiCanvasLeftDragHeld = true),
          _0x1f478f(_0x1de014.clientX, _0x1de014.clientY, _0x1de014));
        return;
      }
      ((_0x2333e8 = false),
        _0x280c16(),
        targetWindow?._spaceHeld && _0x524703 && (_0x524703.style.cursor = 'var(--grab-cursor)'));
    }),
    _0x5aebe4(
      _0x5acae5,
      'wheel',
      (_0x205ce1) => {
        _0x28a2ab.updateFromEvent(_0x205ce1);
        const _0x1ad1a9 = _0x205ce1.target;
        if (_0x1ad1a9?.closest?.(PANEL_SCROLL_SELECTOR)) return;
        const _0x5cdb99 = _0x1ad1a9?.tagName,
          _0x3ce8a8 =
            _0x5cdb99 === 'INPUT' ||
            _0x5cdb99 === 'TEXTAREA' ||
            _0x1ad1a9?.contentEditable === 'true' ||
            _0x1ad1a9?.closest?.('[contenteditable="true"]');
        if (_0x3ce8a8 || isScrollableTextEditWheel(_0x1ad1a9, targetDocument)) return;
        _0x205ce1.preventDefault();
        if (isVideoInteractionLocked(_0x3c80f7)) return;
        (_0x10d42a?.clearTrackedFocus?.('wheel-zoom'),
          _0x218536(_0x205ce1.clientX, _0x205ce1.clientY, _0x205ce1.deltaY));
      },
      { passive: false },
    ),
    _0x5aebe4(
      targetDocument,
      'wheel',
      (_0xced4e1) => {
        const _0x1fce45 = _0xced4e1.target;
        if (!_0x1fce45) return;
        _0x28a2ab.updateFromEvent(_0xced4e1);
        const _0x13e096 = _0x1fce45.closest?.('.side-plus-btn'),
          _0x2ac7de = _0x1fce45.closest?.('#v2-conn-scissor-btn') || _0x1fce45.closest?.('.conn-scissor-btn');
        if (!_0x13e096 && !_0x2ac7de) return;
        if (_0x3c80f7.annotateActive) return;
        (_0xced4e1.preventDefault(), _0x218536(_0xced4e1.clientX, _0xced4e1.clientY, _0xced4e1.deltaY));
      },
      { passive: false, capture: true },
    ),
    _0x5aebe4(_0x5acae5, 'mousedown', (_0x1abd7f) => {
      if (_0x1abd7f.button === 1) _0x1abd7f.preventDefault();
    }),
    {
      getCursorScreenPosition: _0x28a2ab.getCursorScreenPosition,
      dispose() {
        (_0x26352e.splice(0).forEach((_0x541b51) => _0x541b51()), _0x4b68f4.dispose());
      },
    }
  );
}
