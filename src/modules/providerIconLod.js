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
function getDocumentRef(value) {
  return value?.ownerDocument || globalThis.document;
}
function scheduleFrame(item) {
  const run = globalThis.requestAnimationFrame;
  if (typeof run === 'function') return run(item);
  return setTimeout(item, 16);
}
function cancelFrame(key) {
  const run2 = globalThis.cancelAnimationFrame;
  if (typeof run2 === 'function') {
    run2(key);
    return;
  }
  clearTimeout(key);
}
function normalizeIconSrc(index) {
  return String(index || '')
    .trim()
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^\/+/, '');
}
function readProviderIconSrc(el) {
  return el?.getAttribute?.('src') || el?.dataset?.[PROVIDER_SRC_ATTR] || '';
}
function isProviderIconImage(result) {
  return isProviderLogoSrc(readProviderIconSrc(result));
}
function isElementNode(enabled) {
  return !!enabled && enabled.nodeType === 1;
}
function getElementFromNode(el2) {
  if (isElementNode(el2)) return el2;
  const data = el2?.parentElement || el2?.parentNode;
  return isElementNode(data) ? data : null;
}
function elementMatches(options, target) {
  if (!isElementNode(options) || typeof options.matches !== 'function') return false;
  try {
    return options.matches(target);
  } catch {
    return false;
  }
}
function elementContainsMatch(el3, source) {
  if (!isElementNode(el3) || typeof el3.querySelector !== 'function') return false;
  try {
    return !!el3.querySelector(source);
  } catch {
    return false;
  }
}
function isProviderIconElement(next) {
  if (!isElementNode(next)) return false;
  if (elementMatches(next, PROVIDER_ICON_SELECTOR)) return true;
  if (String(next.tagName || '').toLowerCase() !== 'img') return false;
  return isProviderIconImage(next);
}
function nodeContainsProviderIcon(current) {
  if (!isElementNode(current)) return false;
  return (
    isProviderIconElement(current) ||
    elementContainsMatch(current, PROVIDER_ICON_SELECTOR) ||
    elementMatches(current, PROVIDER_ICON_CONTAINER_SELECTOR) ||
    elementContainsMatch(current, PROVIDER_ICON_CONTAINER_SELECTOR)
  );
}
function didPromotionClassChange(entry, record = '') {
  const map = new Set(
      String(entry || '')
        .split(/\s+/)
        .filter(Boolean),
    ),
    map2 = new Set(
      String(record || '')
        .split(/\s+/)
        .filter(Boolean),
    );
  for (const payload of NODE_PROMOTION_CLASSES) {
    if (map.has(payload) !== map2.has(payload)) return true;
  }
  return false;
}
function shouldSyncForProviderIconMutation(event) {
  const enabled2 = event?.target;
  if (!enabled2) return false;
  if (event.type === 'childList') {
    const list = [...Array.from(event.addedNodes || []), ...Array.from(event.removedNodes || [])];
    return list.some((item2) => nodeContainsProviderIcon(item2));
  }
  if (event.type !== 'attributes') return false;
  if (isProviderIconElement(enabled2)) return true;
  if (event.attributeName !== 'class') return false;
  if (elementMatches(enabled2, '.v2-node'))
    return didPromotionClassChange(event.oldValue, enabled2.getAttribute?.('class') || '');
  return nodeContainsProviderIcon(enabled2);
}
function getClosestCanvasNode(handle) {
  const el4 = getElementFromNode(handle);
  if (!el4) return null;
  if (elementMatches(el4, '.v2-node')) return el4;
  if (typeof el4.closest !== 'function') return null;
  try {
    return el4.closest('.v2-node');
  } catch {
    return null;
  }
}
function shouldSyncForProviderPointerEvent(event2) {
  const closestCanvasNode = getClosestCanvasNode(event2?.target),
    closestCanvasNode2 = getClosestCanvasNode(event2?.relatedTarget);
  return !!(closestCanvasNode || closestCanvasNode2) && closestCanvasNode !== closestCanvasNode2;
}
function findProviderIconImages(el5) {
  if (!el5 || typeof el5.querySelectorAll !== 'function') return [];
  return Array.from(el5.querySelectorAll(PROVIDER_ICON_SELECTOR));
}
function shouldDehydrateProviderIcon(el6, { store: store2, documentRef: documentRef } = {}) {
  if (!isProviderIconImage(el6)) return false;
  const nodeId = el6.closest?.('.v2-node');
  if (!nodeId) return false;
  if (!isCanvasLowZoomActive(documentRef)) return false;
  return !isNodePromotedForFullImage({
    nodeId: nodeId.id,
    rootEl: nodeId,
    store: store2,
    documentRef: documentRef,
  });
}
export function isProviderLogoSrc(state) {
  return PROVIDER_ICON_RE.test(normalizeIconSrc(state));
}
export function dehydrateProviderIcon(el7) {
  if (!el7 || !isProviderIconImage(el7)) return false;
  const config = String(el7.getAttribute?.('src') || '').trim();
  config && ((el7.dataset[PROVIDER_SRC_ATTR] = config), el7.removeAttribute('src'));
  const scope = String(el7.getAttribute?.('srcset') || '').trim();
  return (
    scope && ((el7.dataset[PROVIDER_SRCSET_ATTR] = scope), el7.removeAttribute('srcset')),
    el7.classList?.add(PLACEHOLDER_CLASS),
    true
  );
}
export function hydrateProviderIcon(el8) {
  if (!el8) return false;
  const enabled3 = String(el8.dataset?.[PROVIDER_SRC_ATTR] || '').trim(),
    enabled4 = String(el8.dataset?.[PROVIDER_SRCSET_ATTR] || '').trim();
  return (
    enabled3 && !String(el8.getAttribute?.('src') || '').trim() && el8.setAttribute('src', enabled3),
    enabled4 && !String(el8.getAttribute?.('srcset') || '').trim() && el8.setAttribute('srcset', enabled4),
    el8.dataset && (delete el8.dataset[PROVIDER_SRC_ATTR], delete el8.dataset[PROVIDER_SRCSET_ATTR]),
    el8.classList?.remove(PLACEHOLDER_CLASS),
    !!enabled3 || !!enabled4
  );
}
export function syncLowZoomProviderIcons({ rootEl: rootEl = globalThis.document, store: store = null } = {}) {
  const documentRef2 = getDocumentRef(rootEl),
    input = rootEl?.querySelectorAll ? rootEl : documentRef2,
    providerIconImages = findProviderIconImages(input);
  for (const output of providerIconImages) {
    shouldDehydrateProviderIcon(output, { store: store, documentRef: documentRef2 })
      ? dehydrateProviderIcon(output)
      : hydrateProviderIcon(output);
  }
}
export function installProviderIconLodController({ rootEl: rootEl = null, store: store = null } = {}) {
  const documentRef3 = getDocumentRef(rootEl),
    rootEl2 = rootEl || documentRef3?.getElementById?.('v2-canvas') || documentRef3;
  let scheduleFrame2 = null;
  const scheduleSync = () => {
      if (scheduleFrame2 !== null) return;
      scheduleFrame2 = scheduleFrame(() => {
        ((scheduleFrame2 = null), syncLowZoomProviderIcons({ rootEl: rootEl2, store: store }));
      });
    },
    value2 = (list2 = []) => {
      const list3 = Array.isArray(list2) ? list2 : Array.from(list2 || []);
      list3.some((item3) => shouldSyncForProviderIconMutation(item3)) && scheduleSync();
    },
    value3 = (value4) => {
      if (shouldSyncForProviderPointerEvent(value4)) scheduleSync();
    },
    value5 = typeof MutationObserver === 'function' && rootEl2 ? new MutationObserver(value2) : null;
  (value5?.observe(rootEl2, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'src', 'srcset'],
    attributeOldValue: true,
  }),
    rootEl2?.addEventListener?.('pointerover', value3, true),
    rootEl2?.addEventListener?.('pointerout', value3, true));
  const value6 = store?.subscribeSelector?.(
    (value7) => (value7.selectedNodeIds || []).join('|'),
    scheduleSync,
  );
  return (
    scheduleSync(),
    {
      sync: () => syncLowZoomProviderIcons({ rootEl: rootEl2, store: store }),
      scheduleSync: scheduleSync,
      disconnect() {
        (scheduleFrame2 !== null && (cancelFrame(scheduleFrame2), (scheduleFrame2 = null)),
          value5?.disconnect(),
          rootEl2?.removeEventListener?.('pointerover', value3, true),
          rootEl2?.removeEventListener?.('pointerout', value3, true),
          value6?.());
      },
    }
  );
}
