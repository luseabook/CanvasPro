import { isSameStringOrder } from '../utils/arrayOrder.js';
import { resolveGroupOutputSourceOrder } from './groupDynamicOutput.js';
const THUMB_CONTAINER_SELECTOR = '.ref-thumb-container',
  THUMB_ITEM_SELECTOR = '.ref-thumb-wrap',
  orderDragStateByContainer = new WeakMap();
function matchesSelector(_0x5a1ff5, _0x39b960) {
  return typeof _0x5a1ff5?.matches === 'function' && _0x5a1ff5.matches(_0x39b960);
}
function resolveThumbContainer(_0x31fb5d) {
  if (!_0x31fb5d) return null;
  if (matchesSelector(_0x31fb5d, THUMB_CONTAINER_SELECTOR)) return _0x31fb5d;
  return _0x31fb5d.querySelector?.(THUMB_CONTAINER_SELECTOR) || null;
}
function queryThumbItems(_0xcdbdaa) {
  return Array.from(_0xcdbdaa?.querySelectorAll?.(THUMB_ITEM_SELECTOR) || []);
}
function getDataset(_0x8aeb0f) {
  return _0x8aeb0f?.dataset || {};
}
function isAssetRef(_0x55cfc1) {
  const _0x20c165 = getDataset(_0x55cfc1);
  return (
    _0x20c165.refOrigin === 'asset' ||
    !!_0x20c165.assetId ||
    String(_0x20c165.refKey || '').startsWith('asset:')
  );
}
function getEdgeId(_0x5cc8e3) {
  return String(getDataset(_0x5cc8e3).edgeId || '').trim();
}
function isNodeEdgeThumb(_0x3fbc6e) {
  return !!getEdgeId(_0x3fbc6e) && !isAssetRef(_0x3fbc6e);
}
function isGroupOutputEdge(_0x3dde00) {
  return !!(_0x3dde00?.isGroupOutput && _0x3dde00?.groupOutputEdgeId);
}
function isReadOnlyDerivedGroupEdge(_0x47c0d8) {
  if (!_0x47c0d8) return false;
  if (isGroupOutputEdge(_0x47c0d8)) return false;
  if (_0x47c0d8.isGroupShared) return false;
  return !!_0x47c0d8.effectiveTargetId && !isGroupOutputEdge(_0x47c0d8);
}
function findIncomingEdge(_0xee447, _0x409423, _0x473664) {
  const _0x5cd1e8 = String(_0x473664 || '').trim();
  if (!_0x5cd1e8 || typeof _0xee447?.getIncomingEdges !== 'function') return null;
  return (
    (_0xee447.getIncomingEdges(_0x409423) || []).find(
      (_0x5488d8) => String(_0x5488d8?.id || '').trim() === _0x5cd1e8,
    ) || null
  );
}
function isMutableNodeEdgeThumb(_0x4930e3, _0x3d3eda, _0x3a9984) {
  if (!isNodeEdgeThumb(_0x4930e3)) return false;
  const _0x27e7b1 = findIncomingEdge(_0x3d3eda, _0x3a9984, getEdgeId(_0x4930e3));
  return !isReadOnlyDerivedGroupEdge(_0x27e7b1);
}
function getFixedSlotEdgeContext(_0x4b8b16, _0x4c062f, _0x1bfe73) {
  if (!_0x4c062f) return null;
  const _0x4dff77 = _0x4b8b16?.getState?.() || {},
    _0x5bb27d = String(_0x1bfe73 || '');
  if (isGroupOutputEdge(_0x4c062f)) {
    if (String(_0x4c062f.effectiveTargetId || '') !== _0x5bb27d) return null;
    const _0x411f21 = String(_0x4c062f.groupOutputEdgeId || '').trim(),
      _0x29fbe4 = _0x4dff77.edges?.[_0x411f21] || null;
    if (!_0x29fbe4?.id) return null;
    return {
      kind: 'groupOutput',
      incomingEdge: _0x4c062f,
      rawEdge: _0x29fbe4,
      dragEdgeId: String(_0x4c062f.id || '').trim(),
    };
  }
  const _0x30facf = _0x4dff77.edges?.[String(_0x4c062f.id || '').trim()] || null;
  if (!_0x30facf?.id) return null;
  if (String(_0x30facf.targetId || '') === _0x5bb27d)
    return { kind: 'edge', incomingEdge: _0x4c062f, rawEdge: _0x30facf, dragEdgeId: _0x30facf.id };
  if (_0x4c062f.isGroupShared && String(_0x4c062f.effectiveTargetId || '') === _0x5bb27d)
    return { kind: 'edge', incomingEdge: _0x4c062f, rawEdge: _0x30facf, dragEdgeId: _0x30facf.id };
  return null;
}
function resolveMutableFixedSlotThumb(_0x357a27, _0x262f14, _0x50a9c5) {
  if (!isMutableNodeEdgeThumb(_0x357a27, _0x262f14, _0x50a9c5)) return null;
  const _0x16bf7c = findIncomingEdge(_0x262f14, _0x50a9c5, getEdgeId(_0x357a27));
  return getFixedSlotEdgeContext(_0x262f14, _0x16bf7c, _0x50a9c5);
}
function resolveMutableFixedSlotEdgeById(_0x4dff1f, _0xeec999, _0x320c2d) {
  const _0x1d421e = findIncomingEdge(_0x4dff1f, _0xeec999, _0x320c2d);
  return getFixedSlotEdgeContext(_0x4dff1f, _0x1d421e, _0xeec999);
}
function isFixedSlotThumb(_0x382b1f, _0x36c182 = null) {
  const _0x6d8f8a = getDataset(_0x382b1f);
  return !!(
    String(_0x6d8f8a.slot || '').trim() ||
    String(_0x6d8f8a.refSlot || '').trim() ||
    String(_0x36c182?.refSlot || '').trim()
  );
}
function isOrderableNodeEdgeThumb(_0xc5b551, _0x3e0b06, _0x137489) {
  if (!isNodeEdgeThumb(_0xc5b551)) return false;
  const _0x1a5d37 = findIncomingEdge(_0x3e0b06, _0x137489, getEdgeId(_0xc5b551));
  if (isReadOnlyDerivedGroupEdge(_0x1a5d37)) return false;
  return !isFixedSlotThumb(_0xc5b551, _0x1a5d37);
}
function setDragData(_0x54a461, _0x28149a) {
  if (!_0x54a461?.dataTransfer) return;
  ((_0x54a461.dataTransfer.effectAllowed = 'move'),
    _0x54a461.dataTransfer.setData?.('text/plain', _0x28149a));
}
function setDropMove(_0x432a7e) {
  if (!_0x432a7e?.dataTransfer) return;
  _0x432a7e.dataTransfer.dropEffect = 'move';
}
function setOwnerDragging(_0x15dd2f, _0x37f7dc) {
  if (!_0x15dd2f) return;
  _0x15dd2f._isDraggingSorting = _0x37f7dc;
}
function getOrderDragState(_0xa8951d) {
  if (!_0xa8951d || typeof _0xa8951d !== 'object') return { dragEl: null };
  let _0x3e36b4 = orderDragStateByContainer.get(_0xa8951d);
  return (
    !_0x3e36b4 && ((_0x3e36b4 = { dragEl: null }), orderDragStateByContainer.set(_0xa8951d, _0x3e36b4)),
    _0x3e36b4
  );
}
function animateReorder(_0x172a8e, _0x3e391f) {
  const _0x41d8cd = queryThumbItems(_0x172a8e),
    _0x18f04e = _0x41d8cd.map((_0x1a89a8) => _0x1a89a8.getBoundingClientRect?.() || {});
  _0x3e391f();
  const _0x5e3720 = _0x41d8cd.map((_0x198f4d) => _0x198f4d.getBoundingClientRect?.() || {});
  _0x41d8cd.forEach((_0x29c79a, _0x4ab96f) => {
    const _0x1f0c49 = Number(_0x18f04e[_0x4ab96f]?.left || 0) - Number(_0x5e3720[_0x4ab96f]?.left || 0),
      _0x21f2f0 = Number(_0x18f04e[_0x4ab96f]?.top || 0) - Number(_0x5e3720[_0x4ab96f]?.top || 0);
    if (_0x1f0c49 === 0 && _0x21f2f0 === 0) return;
    ((_0x29c79a.style.transform = 'translate(' + _0x1f0c49 + 'px, ' + _0x21f2f0 + 'px)'),
      (_0x29c79a.style.transition = 'none'));
    const _0x4ef02e =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (_0x308c2c) => setTimeout(_0x308c2c, 0);
    _0x4ef02e(() => {
      ((_0x29c79a.style.transform = ''),
        (_0x29c79a.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'));
    });
  });
}
function getTargetIncomingEdges(_0x5ee140, _0x5e6331) {
  return (_0x5ee140?.getIncomingEdges?.(_0x5e6331) || []).filter((_0x5b1146) => {
    if (!_0x5b1146 || !String(_0x5b1146.id || '').trim()) return false;
    const _0x788e50 = String(_0x5e6331 || '');
    if (String(_0x5b1146.targetId || '') === _0x788e50) return true;
    return (
      (_0x5b1146.isGroupShared && String(_0x5b1146.effectiveTargetId || '') === _0x788e50) ||
      (isGroupOutputEdge(_0x5b1146) && String(_0x5b1146.effectiveTargetId || '') === _0x788e50)
    );
  });
}
function resolveEdge(_0x4d94f1, _0x3d6c4a, _0x130019) {
  const _0x43e26e = _0x4d94f1?.getState?.() || {};
  return _0x43e26e.edges?.[_0x3d6c4a] || _0x130019.find((_0x457db4) => _0x457db4.id === _0x3d6c4a) || null;
}
function uniqueSourceIds(_0x3ddd70) {
  const _0x57f812 = new Set(),
    _0x239556 = [];
  return (
    _0x3ddd70.forEach((_0x5c17cf) => {
      const _0x5a9a74 = String(_0x5c17cf?.sourceId || '').trim();
      if (!_0x5a9a74 || _0x57f812.has(_0x5a9a74)) return;
      (_0x57f812.add(_0x5a9a74), _0x239556.push(_0x5a9a74));
    }),
    _0x239556
  );
}
function mergeVisibleSourceOrder(_0x2f52b4, _0x2502de) {
  const _0x4be053 = [..._0x2502de],
    _0x11f170 = new Set(_0x4be053);
  return (
    (Array.isArray(_0x2f52b4) ? _0x2f52b4 : []).forEach((_0x15a43b) => {
      const _0x5eeb8b = String(_0x15a43b || '').trim();
      if (!_0x5eeb8b || _0x11f170.has(_0x5eeb8b)) return;
      (_0x11f170.add(_0x5eeb8b), _0x4be053.push(_0x5eeb8b));
    }),
    _0x4be053
  );
}
function getGroupOutputOrderTargetId(_0x1929d9) {
  const _0x3e2550 = new Set();
  for (const _0x33b542 of _0x1929d9 || []) {
    if (!_0x33b542?.isGroupShared) return '';
    const _0x15b5d3 = String(_0x33b542.effectiveTargetId || '').trim();
    if (!_0x15b5d3) return '';
    _0x3e2550.add(_0x15b5d3);
  }
  return _0x3e2550.size === 1 ? Array.from(_0x3e2550)[0] : '';
}
function applyGroupOutputSourceOrder(_0x2d9ff3, _0x32a670, _0x6400fd) {
  if (!_0x32a670) return { ..._0x2d9ff3, groupOutputSourceOrder: _0x6400fd };
  const _0x3c3875 = _0x2d9ff3.groupOutputSourceOrderByTarget,
    _0x12a07f =
      _0x3c3875 && typeof _0x3c3875 === 'object' && !Array.isArray(_0x3c3875) ? { ..._0x3c3875 } : {};
  return ((_0x12a07f[_0x32a670] = _0x6400fd), { ..._0x2d9ff3, groupOutputSourceOrderByTarget: _0x12a07f });
}
function collectGroupOutputEdgeUpdates(_0x43b28a, _0xd95e77) {
  const _0x46fc17 = _0x43b28a?.getState?.() || {},
    _0x56444c = new Map();
  _0xd95e77.forEach((_0x2750c2) => {
    if (!isGroupOutputEdge(_0x2750c2)) return;
    const _0x2782ba = String(_0x2750c2.groupOutputEdgeId || '').trim();
    if (!_0x2782ba) return;
    if (!_0x56444c.has(_0x2782ba)) _0x56444c.set(_0x2782ba, []);
    _0x56444c.get(_0x2782ba).push(_0x2750c2);
  });
  const _0x411236 = [];
  return (
    _0x56444c.forEach((_0x3bc410, _0x2f318f) => {
      const _0x482efa = _0x46fc17.edges?.[_0x2f318f];
      if (!_0x482efa?.id) return;
      const _0x3ae6b9 = uniqueSourceIds(_0x3bc410);
      if (_0x3ae6b9.length <= 1) return;
      const _0x18f579 = getGroupOutputOrderTargetId(_0x3bc410),
        _0x402df9 = resolveGroupOutputSourceOrder(_0x482efa, _0x18f579),
        _0x5cdae8 = mergeVisibleSourceOrder(_0x402df9, _0x3ae6b9);
      if (isSameStringOrder(_0x5cdae8, _0x402df9 || [])) return;
      _0x411236.push({
        removeId: _0x2f318f,
        edge: applyGroupOutputSourceOrder(_0x482efa, _0x18f579, _0x5cdae8),
      });
    }),
    _0x411236
  );
}
function collectOrderedEdgeIds(_0x41f1b6, _0x5e0baa, _0x559d1b) {
  return queryThumbItems(_0x41f1b6)
    .filter((_0x147698) => isOrderableNodeEdgeThumb(_0x147698, _0x5e0baa, _0x559d1b))
    .map((_0x5a8854) => getEdgeId(_0x5a8854))
    .filter(Boolean);
}
function commitOrder(_0x3ccaf2, _0x23cfe1, _0x5b9d1a) {
  const _0x2dbf7c = collectOrderedEdgeIds(_0x3ccaf2, _0x23cfe1, _0x5b9d1a);
  if (_0x2dbf7c.length === 0) return;
  const _0x4ab1df = new Set(_0x2dbf7c),
    _0x124e37 = getTargetIncomingEdges(_0x23cfe1, _0x5b9d1a).filter((_0x3b0da9) =>
      _0x4ab1df.has(_0x3b0da9.id),
    ),
    _0x87bd8 = _0x124e37.map((_0x6a3d1c) => _0x6a3d1c.id);
  if (_0x87bd8.length !== _0x2dbf7c.length) return;
  if (isSameStringOrder(_0x2dbf7c, _0x87bd8)) return;
  const _0x6d9f2 = _0x2dbf7c.map((_0x1f5e7f) => resolveEdge(_0x23cfe1, _0x1f5e7f, _0x124e37)).filter(Boolean);
  if (_0x6d9f2.length !== _0x87bd8.length) return;
  const _0x4e6f2c = collectGroupOutputEdgeUpdates(_0x23cfe1, _0x6d9f2),
    _0x3f25d0 = _0x6d9f2.filter((_0x58c19c) => !isGroupOutputEdge(_0x58c19c)),
    _0x6e41dd = _0x124e37
      .filter((_0x40ed32) => !isGroupOutputEdge(_0x40ed32))
      .map((_0x3d68ab) => _0x3d68ab.id),
    _0x590adc = _0x3f25d0.map((_0x5315e2) => _0x5315e2.id),
    _0x12cd42 = [],
    _0x427b2c = [];
  _0x6e41dd.length > 1 &&
    !isSameStringOrder(_0x590adc, _0x6e41dd) &&
    (_0x12cd42.push(..._0x6e41dd), _0x427b2c.push(..._0x3f25d0));
  _0x4e6f2c.forEach((_0x2c5463) => {
    (_0x12cd42.push(_0x2c5463.removeId), _0x427b2c.push(_0x2c5463.edge));
  });
  if (_0x12cd42.length === 0) return;
  _0x23cfe1.updateEdgesBatch?.(_0x12cd42, _0x427b2c);
}
export function bindRefThumbOrderDrag({
  owner: _0x47fe09,
  container: _0x33cbd6,
  store: _0x341383,
  nodeId: _0x36f2cb,
} = {}) {
  const _0x4b0b8d = resolveThumbContainer(_0x33cbd6);
  if (!_0x4b0b8d || !_0x341383 || !_0x36f2cb) return;
  const _0x80babc = getOrderDragState(_0x4b0b8d);
  (queryThumbItems(_0x4b0b8d).forEach((_0x37931) => {
    if (!isOrderableNodeEdgeThumb(_0x37931, _0x341383, _0x36f2cb)) {
      const _0x266c06 = findIncomingEdge(_0x341383, _0x36f2cb, getEdgeId(_0x37931));
      isNodeEdgeThumb(_0x37931) &&
        isReadOnlyDerivedGroupEdge(_0x266c06) &&
        _0x37931.setAttribute?.('draggable', 'false');
      return;
    }
    if (_0x37931.dataset.dragBound === '1') return;
    ((_0x37931.dataset.dragBound = '1'),
      _0x37931.setAttribute?.('draggable', 'true'),
      _0x37931.addEventListener('dragstart', (_0x142a24) => {
        if (!isOrderableNodeEdgeThumb(_0x37931, _0x341383, _0x36f2cb)) return;
        ((_0x80babc.dragEl = _0x37931),
          setOwnerDragging(_0x47fe09, true),
          setDragData(_0x142a24, getEdgeId(_0x37931) || 'dragging'),
          _0x37931.classList?.add('dragging-capture'),
          setTimeout(() => {
            (_0x37931.classList?.add('dragging'), (_0x37931.style.opacity = '0.1'));
          }, 0));
      }),
      _0x37931.addEventListener('dragend', () => {
        if (_0x80babc.dragEl) _0x80babc.dragEl.style.opacity = '1';
        (_0x37931.classList?.remove('dragging'), _0x37931.classList?.remove('dragging-capture'));
        try {
          commitOrder(_0x4b0b8d, _0x341383, _0x36f2cb);
        } finally {
          ((_0x80babc.dragEl = null), setOwnerDragging(_0x47fe09, false));
        }
      }),
      _0x37931.addEventListener('dragover', (_0x3e0cab) => {
        const _0x1d2fc6 = _0x80babc.dragEl;
        if (!_0x1d2fc6 || _0x1d2fc6 === _0x37931) return;
        if (
          !isOrderableNodeEdgeThumb(_0x1d2fc6, _0x341383, _0x36f2cb) ||
          !isOrderableNodeEdgeThumb(_0x37931, _0x341383, _0x36f2cb)
        )
          return;
        (_0x3e0cab.preventDefault?.(), setDropMove(_0x3e0cab));
        const _0x4c9d07 = _0x37931.getBoundingClientRect?.() || {},
          _0x21adcd = Number(_0x4c9d07.left || 0) + Number(_0x4c9d07.width || 0) / 2;
        animateReorder(_0x4b0b8d, () => {
          Number(_0x3e0cab.clientX || 0) < _0x21adcd
            ? _0x37931.parentNode?.insertBefore(_0x1d2fc6, _0x37931)
            : _0x37931.parentNode?.insertBefore(_0x1d2fc6, _0x37931.nextSibling);
        });
      }));
  }),
    _0x4b0b8d.dataset.dragContainerBound !== '1' &&
      ((_0x4b0b8d.dataset.dragContainerBound = '1'),
      _0x4b0b8d.addEventListener('dragover', (_0x19d070) => _0x19d070.preventDefault?.()),
      _0x4b0b8d.addEventListener('drop', (_0xec18aa) => _0xec18aa.preventDefault?.())));
}
function defaultGetKindByNode(_0x46d389) {
  const _0x1777bb = String(_0x46d389?.type || '');
  if (_0x1777bb.includes('text')) return 'text';
  if (_0x1777bb.includes('video')) return 'video';
  if (_0x1777bb.includes('audio')) return 'audio';
  return _0x1777bb ? 'image' : '';
}
function clearDropState(_0x1caeed) {
  queryThumbItems(_0x1caeed)
    .filter((_0x3e594f) => _0x3e594f.classList?.contains?.('is-drop-allow'))
    .forEach((_0x5157a0) => _0x5157a0.classList?.remove('is-drop-allow'));
}
function getSlot(_0x544683) {
  return String(getDataset(_0x544683).slot || '').trim();
}
function getSlotKind(_0x4dbd0d, _0x4c20ba, _0x278af3, _0x22fd60) {
  const _0x2b10c1 = getSlot(_0x4dbd0d),
    _0xb7dcbb = String(getDataset(_0x4dbd0d).kind || '').trim();
  if (_0xb7dcbb) return _0xb7dcbb;
  const _0x463a14 = String(getDataset(_0x4dbd0d).sourceId || '').trim(),
    _0x5b077e = _0x463a14 ? _0x22fd60?.getState?.()?.nodes?.[_0x463a14] : null;
  return _0x278af3(_0x5b077e) || String(_0x4c20ba?.[_0x2b10c1] || '').trim();
}
function findSlotTarget(_0x45dac6) {
  return _0x45dac6?.target?.closest?.('[data-slot]') || null;
}
function resolveFixedSlotTargetEdgeContext(_0x460579, _0x11e925, _0x41ef63, _0x2b9fe3) {
  const _0x68defe = getEdgeId(_0x460579);
  if (_0x68defe) return resolveMutableFixedSlotEdgeById(_0x11e925, _0x41ef63, _0x68defe);
  return (
    getTargetIncomingEdges(_0x11e925, _0x41ef63)
      .map((_0x458514) => getFixedSlotEdgeContext(_0x11e925, _0x458514, _0x41ef63))
      .filter(Boolean)
      .find(
        ({ incomingEdge: _0x3bcc77, rawEdge: _0x5b95c2 }) =>
          _0x5b95c2 && String(_0x3bcc77?.refSlot || '').trim() === String(_0x2b9fe3 || ''),
      ) || null
  );
}
function getFixedSlotAcceptMap(_0x2327f9, _0x4f2a77) {
  return _0x2327f9?._refThumbFixedSlotAcceptMap || _0x4f2a77 || {};
}
function getContextSourceKind(_0x50ee74, _0x1645ce, _0x35a186) {
  const _0x439413 = String(_0x50ee74?.incomingEdge?.sourceId || '').trim();
  if (!_0x439413) return '';
  return _0x35a186(_0x1645ce?.nodes?.[_0x439413] || null);
}
function collectFixedSlotGroupOutputUpdates({
  store: _0x42e2ec,
  nodeId: _0x2cd9c8,
  slotOrder: _0x31fc52,
  contextA: _0xb82383,
  contextB: _0x13dcdf,
  fromSlot: _0x70319b,
  toSlot: _0xe71d2c,
}) {
  if (_0xb82383?.kind !== 'groupOutput' && _0x13dcdf?.kind !== 'groupOutput') return [];
  const _0x1560e8 = new Map();
  getTargetIncomingEdges(_0x42e2ec, _0x2cd9c8)
    .filter(isGroupOutputEdge)
    .forEach((_0x227aa6) => {
      const _0xcb75fb = String(_0x227aa6?.refSlot || '').trim();
      if (_0xcb75fb) _0x1560e8.set(_0xcb75fb, _0x227aa6);
    });
  _0xb82383?.kind === 'groupOutput' && _0x1560e8.delete(_0x70319b);
  _0x13dcdf?.kind === 'groupOutput' && _0x1560e8.delete(_0xe71d2c);
  _0xb82383?.kind === 'groupOutput' && _0x1560e8.set(_0xe71d2c, _0xb82383.incomingEdge);
  _0x13dcdf?.kind === 'groupOutput' && _0x1560e8.set(_0x70319b, _0x13dcdf.incomingEdge);
  const _0x52f267 = _0x31fc52.map((_0x316469) => _0x1560e8.get(_0x316469)).filter(Boolean);
  return collectGroupOutputEdgeUpdates(_0x42e2ec, _0x52f267);
}
export function bindRefThumbFixedSlotDrag({
  owner: _0x5a9eb7,
  container: _0x38cd8d,
  store: _0x3d6773,
  nodeId: _0x108a00,
  acceptMap: _0x386011,
  getKindByNode: getKindByNode = defaultGetKindByNode,
} = {}) {
  if (!_0x38cd8d || !_0x3d6773 || !_0x108a00 || !_0x386011) return;
  if (_0x5a9eb7) _0x5a9eb7._refThumbFixedSlotAcceptMap = _0x386011 || null;
  if (_0x38cd8d.dataset.fixedSlotDragBound === '1') return;
  ((_0x38cd8d.dataset.fixedSlotDragBound = '1'),
    _0x38cd8d.addEventListener('dragstart', (_0x201be2) => {
      const _0x4b1533 = _0x201be2.target?.closest?.(THUMB_ITEM_SELECTOR),
        _0x32e98d = _0x4b1533 ? resolveMutableFixedSlotThumb(_0x4b1533, _0x3d6773, _0x108a00) : null;
      if (!_0x4b1533 || !_0x32e98d) return;
      const _0x1aa09b = String(_0x32e98d.dragEdgeId || _0x32e98d.rawEdge.id || '').trim(),
        _0x4522c7 = getSlot(_0x4b1533);
      if (!_0x1aa09b || !_0x4522c7) return;
      const _0x4a89e5 = getFixedSlotAcceptMap(_0x5a9eb7, _0x386011),
        _0x54162c = getSlotKind(_0x4b1533, _0x4a89e5, getKindByNode, _0x3d6773);
      if (!_0x54162c || _0x4a89e5[_0x4522c7] !== _0x54162c) return;
      if (!_0x5a9eb7) return;
      ((_0x5a9eb7._fixedSlotDrag = { edgeId: _0x1aa09b, fromSlot: _0x4522c7, kind: _0x54162c }),
        clearDropState(_0x38cd8d),
        _0x4b1533.classList?.add('is-dragging'),
        setDragData(_0x201be2, _0x1aa09b),
        _0x201be2.stopPropagation?.());
    }),
    _0x38cd8d.addEventListener('dragend', (_0x253359) => {
      const _0x47579d = _0x253359.target?.closest?.(THUMB_ITEM_SELECTOR);
      (_0x47579d?.classList?.remove('is-dragging'), clearDropState(_0x38cd8d));
      if (_0x5a9eb7) _0x5a9eb7._fixedSlotDrag = null;
      _0x253359.stopPropagation?.();
    }),
    _0x38cd8d.addEventListener('dragover', (_0x36c839) => {
      const _0x4b2780 = _0x5a9eb7?._fixedSlotDrag;
      if (!_0x4b2780) return;
      const _0x3a47b6 = findSlotTarget(_0x36c839),
        _0x11fe13 = getSlot(_0x3a47b6),
        _0xfec9d8 = getFixedSlotAcceptMap(_0x5a9eb7, _0x386011);
      if (!_0x11fe13 || _0xfec9d8[_0x11fe13] !== _0x4b2780.kind) return;
      (_0x36c839.preventDefault?.(),
        setDropMove(_0x36c839),
        clearDropState(_0x38cd8d),
        _0x3a47b6.classList?.add('is-drop-allow'),
        _0x36c839.stopPropagation?.());
    }),
    _0x38cd8d.addEventListener('drop', (_0x41e671) => {
      const _0x4afb31 = _0x5a9eb7?._fixedSlotDrag;
      if (!_0x4afb31) return;
      const _0x5cc632 = findSlotTarget(_0x41e671),
        _0x40fd8d = getSlot(_0x5cc632),
        _0x5cac29 = getFixedSlotAcceptMap(_0x5a9eb7, _0x386011);
      if (!_0x40fd8d || _0x5cac29[_0x40fd8d] !== _0x4afb31.kind) return;
      (_0x41e671.preventDefault?.(), clearDropState(_0x38cd8d));
      if (_0x40fd8d === _0x4afb31.fromSlot) return;
      const _0x4fb015 = _0x3d6773.getState?.() || {},
        _0x1c21ba = resolveMutableFixedSlotEdgeById(_0x3d6773, _0x108a00, _0x4afb31.edgeId),
        _0x2e0d55 = _0x1c21ba?.rawEdge || null;
      if (!_0x2e0d55) return;
      const _0x15d4cf = resolveFixedSlotTargetEdgeContext(_0x5cc632, _0x3d6773, _0x108a00, _0x40fd8d),
        _0x50b50a = _0x15d4cf?.rawEdge || null,
        _0x1b5894 = Object.keys(_0x5cac29 || {}).filter(
          (_0x4db165) => _0x5cac29[_0x4db165] === _0x4afb31.kind,
        ),
        _0x5bfff2 = collectFixedSlotGroupOutputUpdates({
          store: _0x3d6773,
          nodeId: _0x108a00,
          slotOrder: _0x1b5894,
          contextA: _0x1c21ba,
          contextB: _0x15d4cf,
          fromSlot: _0x4afb31.fromSlot,
          toSlot: _0x40fd8d,
        }),
        _0x576418 = [],
        _0xf59b88 = [];
      if (_0x50b50a?.id && _0x50b50a.id !== _0x2e0d55.id) {
        const _0x329ef6 = getContextSourceKind(_0x15d4cf, _0x4fb015, getKindByNode);
        if (!_0x329ef6 || _0x5cac29[_0x4afb31.fromSlot] !== _0x329ef6) return;
        (_0x1c21ba.kind === 'edge' &&
          (_0x576418.push(_0x2e0d55.id), _0xf59b88.push({ ..._0x2e0d55, refSlot: _0x40fd8d })),
          _0x15d4cf.kind === 'edge' &&
            (_0x576418.push(_0x50b50a.id), _0xf59b88.push({ ..._0x50b50a, refSlot: _0x4afb31.fromSlot })));
      } else
        _0x1c21ba.kind === 'edge' &&
          (_0x576418.push(_0x2e0d55.id), _0xf59b88.push({ ..._0x2e0d55, refSlot: _0x40fd8d }));
      _0x5bfff2.forEach((_0x2e1e47) => {
        (_0x576418.push(_0x2e1e47.removeId), _0xf59b88.push(_0x2e1e47.edge));
      });
      if (_0x576418.length === 0) return;
      _0x3d6773.updateEdgesBatch?.(_0x576418, _0xf59b88);
      if (_0x5a9eb7) _0x5a9eb7._fixedSlotDrag = null;
      _0x41e671.stopPropagation?.();
    }));
}
