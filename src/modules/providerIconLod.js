import {
  MEDIA_LOD_HOVER_PROMOTED_CLASS,
  isCanvasLowZoomActive,
  isNodePromotedForFullImage,
} from './canvasImageLod.js';
const PROVIDER_ICON_RE = /^images\/(?:RH|jimeng|grsai|ppio)\.png(?:[?#].*)?$/i,
  PROVIDER_ICON_SELECTOR = [
    '#v2-canvas .v2-node .img-model-pills img',
    '#v2-canvas .v2-node .img-model-menu img',
    '#v2-canvas .v2-node .image-function-model-trigger-icon-slot img',
  ].join(','),
  PROVIDER_ICON_CONTAINER_SELECTOR =
    '.img-model-pills, .img-model-menu, .image-function-model-trigger-icon-slot',
  PROVIDER_SRC_ATTR = 'lowZoomProviderSrc',
  PROVIDER_SRCSET_ATTR = 'lowZoomProviderSrcset',
  PLACEHOLDER_CLASS = 'provider-logo-lod-placeholder',
  NODE_PROMOTION_CLASSES = new Set([
    'selected',
    'v2-selected',
    'selection-related',
    'conn-src',
    'conn-hoverTarget',
    MEDIA_LOD_HOVER_PROMOTED_CLASS,
  ]);
function getDocumentRef(_0x4904d3) {
  return _0x4904d3?.ownerDocument || globalThis.document;
}
function scheduleFrame(_0x528c10) {
  const _0x44affd = globalThis.requestAnimationFrame;
  if (typeof _0x44affd === 'function') return _0x44affd(_0x528c10);
  return setTimeout(_0x528c10, 16);
}
function cancelFrame(_0x3c47a4) {
  const _0x450a23 = globalThis.cancelAnimationFrame;
  if (typeof _0x450a23 === 'function') {
    _0x450a23(_0x3c47a4);
    return;
  }
  clearTimeout(_0x3c47a4);
}
function normalizeIconSrc(_0x446852) {
  return String(_0x446852 || '')
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^\/+/, '');
}
function readProviderIconSrc(_0x1d5846) {
  return _0x1d5846?.getAttribute?.('src') || _0x1d5846?.dataset?.[PROVIDER_SRC_ATTR] || '';
}
function isProviderIconImage(_0x140a99) {
  return isProviderLogoSrc(readProviderIconSrc(_0x140a99));
}
function isElementNode(_0x29253b) {
  return !!_0x29253b && _0x29253b.nodeType === 1;
}
function getElementFromNode(_0x8251f8) {
  if (isElementNode(_0x8251f8)) return _0x8251f8;
  const _0x89157e = _0x8251f8?.parentElement || _0x8251f8?.parentNode;
  return isElementNode(_0x89157e) ? _0x89157e : null;
}
function elementMatches(_0x532dcc, _0x338140) {
  if (!isElementNode(_0x532dcc) || typeof _0x532dcc.matches !== 'function') return false;
  try {
    return _0x532dcc.matches(_0x338140);
  } catch {
    return false;
  }
}
function elementContainsMatch(_0x5d8b0a, _0x181ab5) {
  if (!isElementNode(_0x5d8b0a) || typeof _0x5d8b0a.querySelector !== 'function') return false;
  try {
    return !!_0x5d8b0a.querySelector(_0x181ab5);
  } catch {
    return false;
  }
}
function isProviderIconElement(_0x3e9f01) {
  if (!isElementNode(_0x3e9f01)) return false;
  if (elementMatches(_0x3e9f01, PROVIDER_ICON_SELECTOR)) return true;
  if (String(_0x3e9f01.tagName || '').toLowerCase() !== 'img') return false;
  return isProviderIconImage(_0x3e9f01);
}
function nodeContainsProviderIcon(_0x3d52ce) {
  if (!isElementNode(_0x3d52ce)) return false;
  return (
    isProviderIconElement(_0x3d52ce) ||
    elementContainsMatch(_0x3d52ce, PROVIDER_ICON_SELECTOR) ||
    elementMatches(_0x3d52ce, PROVIDER_ICON_CONTAINER_SELECTOR) ||
    elementContainsMatch(_0x3d52ce, PROVIDER_ICON_CONTAINER_SELECTOR)
  );
}
function didPromotionClassChange(_0x282cf1, _0xec0921 = '') {
  const _0x319b86 = new Set(
      String(_0x282cf1 || '')
        .split(/\s+/)
        .filter(Boolean),
    ),
    _0x5921b9 = new Set(
      String(_0xec0921 || '')
        .split(/\s+/)
        .filter(Boolean),
    );
  for (const _0x2c61f4 of NODE_PROMOTION_CLASSES) {
    if (_0x319b86.has(_0x2c61f4) !== _0x5921b9.has(_0x2c61f4)) return true;
  }
  return false;
}
function shouldSyncForProviderIconMutation(_0x2ab707) {
  const _0x53e6a7 = _0x2ab707?.target;
  if (!_0x53e6a7) return false;
  if (_0x2ab707.type === 'childList') {
    const _0xb88f7 = [...Array.from(_0x2ab707.addedNodes || []), ...Array.from(_0x2ab707.removedNodes || [])];
    return _0xb88f7.some((_0x1ee502) => nodeContainsProviderIcon(_0x1ee502));
  }
  if (_0x2ab707.type !== 'attributes') return false;
  if (isProviderIconElement(_0x53e6a7)) return true;
  if (_0x2ab707.attributeName !== 'class') return false;
  if (elementMatches(_0x53e6a7, '.v2-node'))
    return didPromotionClassChange(_0x2ab707.oldValue, _0x53e6a7.getAttribute?.('class') || '');
  return nodeContainsProviderIcon(_0x53e6a7);
}
function getClosestCanvasNode(_0x3c4670) {
  const _0x564cc3 = getElementFromNode(_0x3c4670);
  if (!_0x564cc3) return null;
  if (elementMatches(_0x564cc3, '.v2-node')) return _0x564cc3;
  if (typeof _0x564cc3.closest !== 'function') return null;
  try {
    return _0x564cc3.closest('.v2-node');
  } catch {
    return null;
  }
}
function shouldSyncForProviderPointerEvent(_0x4f68ca) {
  const _0x3bc8e9 = getClosestCanvasNode(_0x4f68ca?.target),
    _0x16435d = getClosestCanvasNode(_0x4f68ca?.relatedTarget);
  return !!(_0x3bc8e9 || _0x16435d) && _0x3bc8e9 !== _0x16435d;
}
function findProviderIconImages(_0x4fdfc2) {
  if (!_0x4fdfc2 || typeof _0x4fdfc2.querySelectorAll !== 'function') return [];
  return Array.from(_0x4fdfc2.querySelectorAll(PROVIDER_ICON_SELECTOR));
}
function shouldDehydrateProviderIcon(_0x20dd90, { store: _0x33c12c, documentRef: _0x3f1350 } = {}) {
  if (!isProviderIconImage(_0x20dd90)) return false;
  const _0x4269ea = _0x20dd90.closest?.('.v2-node');
  if (!_0x4269ea) return false;
  if (!isCanvasLowZoomActive(_0x3f1350)) return false;
  return !isNodePromotedForFullImage({
    nodeId: _0x4269ea.id,
    rootEl: _0x4269ea,
    store: _0x33c12c,
    documentRef: _0x3f1350,
  });
}
export function isProviderLogoSrc(_0x5950d0) {
  return PROVIDER_ICON_RE.test(normalizeIconSrc(_0x5950d0));
}
export function dehydrateProviderIcon(_0x2d63c9) {
  if (!_0x2d63c9 || !isProviderIconImage(_0x2d63c9)) return false;
  const _0x179a91 = String(_0x2d63c9.getAttribute?.('src') || '').trim();
  _0x179a91 && ((_0x2d63c9.dataset[PROVIDER_SRC_ATTR] = _0x179a91), _0x2d63c9.removeAttribute('src'));
  const _0x2d4e66 = String(_0x2d63c9.getAttribute?.('srcset') || '').trim();
  return (
    _0x2d4e66 && ((_0x2d63c9.dataset[PROVIDER_SRCSET_ATTR] = _0x2d4e66), _0x2d63c9.removeAttribute('srcset')),
    _0x2d63c9.classList?.add(PLACEHOLDER_CLASS),
    true
  );
}
export function hydrateProviderIcon(_0x2f8919) {
  if (!_0x2f8919) return false;
  const _0x450622 = String(_0x2f8919.dataset?.[PROVIDER_SRC_ATTR] || '').trim(),
    _0x3e377e = String(_0x2f8919.dataset?.[PROVIDER_SRCSET_ATTR] || '').trim();
  return (
    _0x450622 &&
      !String(_0x2f8919.getAttribute?.('src') || '').trim() &&
      _0x2f8919.setAttribute('src', _0x450622),
    _0x3e377e &&
      !String(_0x2f8919.getAttribute?.('srcset') || '').trim() &&
      _0x2f8919.setAttribute('srcset', _0x3e377e),
    _0x2f8919.dataset &&
      (delete _0x2f8919.dataset[PROVIDER_SRC_ATTR], delete _0x2f8919.dataset[PROVIDER_SRCSET_ATTR]),
    _0x2f8919.classList?.remove(PLACEHOLDER_CLASS),
    !!_0x450622 || !!_0x3e377e
  );
}
export function syncLowZoomProviderIcons({ rootEl: rootEl = globalThis.document, store: store = null } = {}) {
  const _0x19a459 = getDocumentRef(rootEl),
    _0x1c3d28 = rootEl?.querySelectorAll ? rootEl : _0x19a459,
    _0x27926e = findProviderIconImages(_0x1c3d28);
  for (const _0x251480 of _0x27926e) {
    shouldDehydrateProviderIcon(_0x251480, { store: store, documentRef: _0x19a459 })
      ? dehydrateProviderIcon(_0x251480)
      : hydrateProviderIcon(_0x251480);
  }
}
export function installProviderIconLodController({ rootEl: rootEl = null, store: store = null } = {}) {
  const _0x1ccf22 = getDocumentRef(rootEl),
    _0x3b9ab1 = rootEl || _0x1ccf22?.getElementById?.('v2-canvas') || _0x1ccf22;
  let _0x5a0194 = null;
  const _0x1dd2fc = () => {
      if (_0x5a0194 !== null) return;
      _0x5a0194 = scheduleFrame(() => {
        ((_0x5a0194 = null), syncLowZoomProviderIcons({ rootEl: _0x3b9ab1, store: store }));
      });
    },
    _0x9abed6 = (_0x5e465d = []) => {
      const _0x264221 = Array.isArray(_0x5e465d) ? _0x5e465d : Array.from(_0x5e465d || []);
      _0x264221.some((_0x1ce276) => shouldSyncForProviderIconMutation(_0x1ce276)) && _0x1dd2fc();
    },
    _0x523989 = (_0x30f973) => {
      if (shouldSyncForProviderPointerEvent(_0x30f973)) _0x1dd2fc();
    },
    _0x574335 = typeof MutationObserver === 'function' && _0x3b9ab1 ? new MutationObserver(_0x9abed6) : null;
  (_0x574335?.observe(_0x3b9ab1, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'src', 'srcset'],
    attributeOldValue: true,
  }),
    _0x3b9ab1?.addEventListener?.('pointerover', _0x523989, true),
    _0x3b9ab1?.addEventListener?.('pointerout', _0x523989, true));
  const _0x33dfb7 = store?.subscribeSelector?.(
    (_0x266aaf) => (_0x266aaf.selectedNodeIds || []).join('|'),
    _0x1dd2fc,
  );
  return (
    _0x1dd2fc(),
    {
      sync: () => syncLowZoomProviderIcons({ rootEl: _0x3b9ab1, store: store }),
      scheduleSync: _0x1dd2fc,
      disconnect() {
        (_0x5a0194 !== null && (cancelFrame(_0x5a0194), (_0x5a0194 = null)),
          _0x574335?.disconnect(),
          _0x3b9ab1?.removeEventListener?.('pointerover', _0x523989, true),
          _0x3b9ab1?.removeEventListener?.('pointerout', _0x523989, true),
          _0x33dfb7?.());
      },
    }
  );
}
