import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
} from '../services/canvasMediaLocalService.js';
import { getImage } from './storage.js';
import { firstNonEmpty } from '../utils/validators.js';
import {
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageThumbUrl,
} from '../services/canvasMediaLocalService.js';
import { attachMediaElementPlaybackSource } from '../services/desktopMediaBlobSource.js';
export async function resolveNodeImagePreviewSource(enabled) {
  if (!enabled) return null;
  const value = Array.isArray(enabled.images) ? enabled.images : [],
    item = enabled.mainImageIndex || 0,
    key = value[item] || null,
    nonEmpty = firstNonEmpty(key?.sourceId, enabled.sourceId);
  if (nonEmpty)
    try {
      const image = await getImage(nonEmpty);
      if (image) return { url: URL.createObjectURL(image), revokeUrlOnClose: true };
    } catch (index) {}
  const url = firstNonEmpty(resolveCanvasImagePreviewUrl(key), resolveCanvasImagePreviewUrl(enabled));
  if (url) return { url: url, revokeUrlOnClose: false };
  const url2 = firstNonEmpty(resolveCanvasImageThumbUrl(key), resolveCanvasImageThumbUrl(enabled));
  if (url2) return { url: url2, revokeUrlOnClose: false };
  return null;
}
function markSidebarSubmenuOwner(el, result) {
  const data = String(result || '').trim();
  if (data) el.dataset.sidebarSubmenuOwner = data;
}
const IMAGE_PREVIEW_MIN_SCALE = 0.25,
  IMAGE_PREVIEW_MAX_SCALE = 6,
  IMAGE_PREVIEW_WHEEL_INTENSITY = 0.0015;
function clampNumber(options, target, source) {
  const next = Number(options);
  if (!Number.isFinite(next)) return target;
  return Math.min(source, Math.max(target, next));
}
function stopPreviewEvent(event) {
  (event?.preventDefault?.(), event?.stopPropagation?.());
}
function getOverlayCenterPoint(el2) {
  const x = el2.getBoundingClientRect?.();
  if (!x)
    return { x: (globalThis.window?.innerWidth || 0) / 2, y: (globalThis.window?.innerHeight || 0) / 2 };
  return { x: x.left + x.width / 2, y: x.top + x.height / 2 };
}
function isPointerInsideElementBounds(el3, event2) {
  if (!el3 || !event2) return false;
  const current = Number(event2.clientX),
    entry = Number(event2.clientY);
  if (!Number.isFinite(current) || !Number.isFinite(entry)) return event2.target === el3;
  const box = el3.getBoundingClientRect?.();
  if (!box) return event2.target === el3;
  const record = Number(box.left),
    payload = Number(box.top),
    handle = Number.isFinite(Number(box.right)) ? Number(box.right) : record + Number(box.width || 0),
    state = Number.isFinite(Number(box.bottom)) ? Number(box.bottom) : payload + Number(box.height || 0);
  if (
    !Number.isFinite(record) ||
    !Number.isFinite(payload) ||
    !Number.isFinite(handle) ||
    !Number.isFinite(state) ||
    handle <= record ||
    state <= payload
  )
    return event2.target === el3;
  return current >= record && current <= handle && entry >= payload && entry <= state;
}
function applyImagePreviewTransform(el4, el5, box2) {
  (el4.style.setProperty('--image-preview-offset-x', Math.round(box2.offsetX * 100) / 100 + 'px'),
    el4.style.setProperty('--image-preview-offset-y', Math.round(box2.offsetY * 100) / 100 + 'px'),
    el5.style.setProperty('--image-preview-scale', String(Math.round(box2.scale * 0x3e8) / 0x3e8)));
}
export function openImagePreview(enabled2, enabled3 = {}) {
  if (!enabled2) return () => {};
  const config = !!enabled3.revokeUrlOnClose,
    offsetX = { scale: 1, offsetX: 0, offsetY: 0 };
  let event3 = null,
    scope = false;
  const el6 = document.createElement('div');
  ((el6.className = 'v2-image-preview-overlay'),
    (el6.style.zIndex = '99999'),
    markSidebarSubmenuOwner(el6, enabled3.sidebarSubmenuOwner));
  const el7 = document.createElement('div');
  el7.className = 'v2-image-preview-stage';
  const el8 = document.createElement('img');
  ((el8.className = 'v2-image-preview-media'),
    (el8.src = enabled2),
    (el8.alt = enabled3.alt || 'Image preview'),
    (el8.draggable = false),
    applyImagePreviewTransform(el7, el8, offsetX));
  const run = () => {
      (globalThis.window?.removeEventListener?.('pointermove', run2, true),
        globalThis.window?.removeEventListener?.('pointerup', run3, true),
        globalThis.window?.removeEventListener?.('pointercancel', run3, true));
    },
    handler = () => {
      (run(), el6.classList.remove('is-panning'), (event3 = null));
    },
    handler2 = () => {
      if (scope) return;
      ((scope = true), document.removeEventListener('keydown', input, true), handler(), el6.remove());
      if (config)
        try {
          URL.revokeObjectURL(enabled2);
        } catch (output) {}
    },
    input = (event4) => {
      event4.key === 'Escape' && (event4.preventDefault(), event4.stopPropagation(), handler2());
    },
    value2 = (event5) => {
      stopPreviewEvent(event5);
      const value3 = offsetX.scale,
        value4 = Math.exp(-Number(event5.deltaY || 0) * IMAGE_PREVIEW_WHEEL_INTENSITY),
        clampNumber2 = clampNumber(value3 * value4, IMAGE_PREVIEW_MIN_SCALE, IMAGE_PREVIEW_MAX_SCALE);
      if (clampNumber2 === value3) return;
      const box3 = getOverlayCenterPoint(el6),
        value5 = Number(event5.clientX || 0) - box3.x,
        value6 = Number(event5.clientY || 0) - box3.y,
        value7 = clampNumber2 / value3;
      ((offsetX.offsetX = value5 - (value5 - offsetX.offsetX) * value7),
        (offsetX.offsetY = value6 - (value6 - offsetX.offsetY) * value7),
        (offsetX.scale = clampNumber2),
        applyImagePreviewTransform(el7, el8, offsetX));
    },
    value8 = (pointerId) => {
      if (pointerId.button != null && pointerId.button !== 0) return;
      if (!isPointerInsideElementBounds(el8, pointerId)) return;
      (stopPreviewEvent(pointerId),
        handler(),
        (event3 = {
          pointerId: pointerId.pointerId,
          startX: Number(pointerId.clientX || 0),
          startY: Number(pointerId.clientY || 0),
          offsetX: offsetX.offsetX,
          offsetY: offsetX.offsetY,
        }),
        el6.classList.add('is-panning'),
        el7.setPointerCapture?.(pointerId.pointerId),
        globalThis.window?.addEventListener?.('pointermove', run2, true),
        globalThis.window?.addEventListener?.('pointerup', run3, true),
        globalThis.window?.addEventListener?.('pointercancel', run3, true));
    };
  function run2(event6) {
    if (!event3) return;
    if (event3.pointerId != null && event6.pointerId != null && event6.pointerId !== event3.pointerId) return;
    (stopPreviewEvent(event6),
      (offsetX.offsetX = event3.offsetX + Number(event6.clientX || 0) - event3.startX),
      (offsetX.offsetY = event3.offsetY + Number(event6.clientY || 0) - event3.startY),
      applyImagePreviewTransform(el7, el8, offsetX));
  }
  function run3(event7) {
    if (!event3) return;
    if (event3.pointerId != null && event7?.pointerId != null && event7.pointerId !== event3.pointerId)
      return;
    stopPreviewEvent(event7);
    try {
      el7.releasePointerCapture?.(event3.pointerId);
    } catch (value9) {}
    handler();
  }
  return (
    el6.addEventListener('click', (event8) => {
      if (isPointerInsideElementBounds(el8, event8)) {
        event8.stopPropagation();
        return;
      }
      handler2();
    }),
    el6.addEventListener('wheel', value2, { passive: false }),
    el8.addEventListener('pointerdown', value8),
    el8.addEventListener('dragstart', stopPreviewEvent),
    el7.appendChild(el8),
    el6.appendChild(el7),
    document.addEventListener('keydown', input, true),
    document.body.appendChild(el6),
    handler2
  );
}
export function openVideoPreview(enabled4, enabled5 = {}) {
  if (!enabled4) return () => {};
  const el9 = document.createElement('div');
  (markSidebarSubmenuOwner(el9, enabled5.sidebarSubmenuOwner),
    Object.assign(el9.style, {
      position: 'fixed',
      inset: '0',
      background: 'var(--overlay-dim)',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'zoom-out',
    }));
  const el10 = document.createElement('video');
  ((el10.controls = true),
    (el10.autoplay = enabled5.autoplay !== false),
    (el10.loop = enabled5.loop !== false),
    (el10.muted = !!enabled5.muted),
    void attachMediaElementPlaybackSource(el10, enabled4, { preload: 'auto' }).catch(() => {
      !String(el10.getAttribute?.('src') || el10.src || '').trim() && ((el10.src = enabled4), el10.load?.());
    }),
    Object.assign(el10.style, { maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }));
  const run4 = () => {
      document.removeEventListener('keydown', value10, true);
      try {
        el10.pause();
      } catch (value11) {}
      el9.remove();
    },
    value10 = (event9) => {
      event9.key === 'Escape' && (event9.preventDefault(), event9.stopPropagation(), run4());
    };
  (el9.addEventListener('click', (event10) => {
    if (event10.target === el9) run4();
  }),
    el9.appendChild(el10),
    document.addEventListener('keydown', value10, true),
    document.body.appendChild(el9));
  try {
    const promise = el10.play?.();
    promise && typeof promise.catch === 'function' && promise.catch(() => {});
  } catch (value12) {}
  return run4;
}
export async function openNodeImagePreview(value13) {
  const revokeUrlOnClose = await resolveNodeImagePreviewSource(value13);
  if (!revokeUrlOnClose) return () => {};
  return openImagePreview(revokeUrlOnClose.url, { revokeUrlOnClose: revokeUrlOnClose.revokeUrlOnClose });
}

export async function resolveNodeImageOriginalSource(enabled6) {
  if (!enabled6) return null;
  const value14 = Array['isArray'](enabled6['images']) ? enabled6['images'] : [],
    value15 = enabled6['mainImageIndex'] || 0x0,
    value16 = value14[value15] || null,
    nonEmpty2 = firstNonEmpty(value16?.['sourceId'], enabled6['sourceId']);
  if (nonEmpty2)
    try {
      const image2 = await getImage(nonEmpty2);
      if (image2) return { url: URL['createObjectURL'](image2), revokeUrlOnClose: !![] };
    } catch (value17) {}
  const nonEmpty3 = firstNonEmpty(
    resolveCanvasImageSourceUrl(value16),
    resolveCanvasImageSourceUrl(enabled6),
  );
  if (nonEmpty3) return { url: nonEmpty3, revokeUrlOnClose: ![] };
  return null;
}

function collectUniquePreviewUrls(list = []) {
  const list2 = [],
    map = new Set();
  for (const value18 of list) {
    const enabled7 = String(value18 || '')['trim']();
    if (!enabled7 || map['has'](enabled7)) continue;
    (map['add'](enabled7), list2['push'](enabled7));
  }
  return list2;
}

function resolveImmediateNodeImagePreviewUrls(value19, value20 = '') {
  const value21 = Array['isArray'](value19?.['images']) ? value19['images'] : [],
    value22 = Math['max'](0x0, Number(value19?.['mainImageIndex']) || 0x0),
    value23 = value21[value22] || value21[0x0] || null;
  return collectUniquePreviewUrls([
    value20,
    resolveCanvasImageDisplayUrl(value23),
    resolveCanvasImageDisplayUrl(value19),
    resolveCanvasImagePreviewUrl(value23),
    resolveCanvasImagePreviewUrl(value19),
    resolveCanvasImageThumbUrl(value23),
    resolveCanvasImageThumbUrl(value19),
  ]);
}

let activeImagePreviewClose = null,
  activeVideoPreviewClose = null,
  videoPreviewOwnerSequence = 0x0;

export function closeActiveImagePreview() {
  if (typeof activeImagePreviewClose !== 'function') return ![];
  const run5 = activeImagePreviewClose;
  return (run5(), !![]);
}

export function closeActiveVideoPreview() {
  if (typeof activeVideoPreviewClose !== 'function') return ![];
  const run6 = activeVideoPreviewClose;
  return (run6(), !![]);
}
