import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { generateId, screenToWorld } from '../../core/math.js';
import { t } from '../../i18n/index.js';
export const RESULT_IMAGE_DRAG_OUT_THRESHOLD_PX = 6;
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
function firstNonEmptyString(...args) {
  for (const item of args) {
    const key = String(item || '').trim();
    if (key) return key;
  }
  return '';
}
function toPositiveInt(index) {
  const count = Number(index);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.max(1, Math.round(count));
}
function pickImageWidth(box) {
  return (
    toPositiveInt(box?.originalWidth) ||
    toPositiveInt(box?.imageWidth) ||
    toPositiveInt(box?.width) ||
    toPositiveInt(box?.metadata?.width)
  );
}
function pickImageHeight(box2) {
  return (
    toPositiveInt(box2?.originalHeight) ||
    toPositiveInt(box2?.imageHeight) ||
    toPositiveInt(box2?.height) ||
    toPositiveInt(box2?.metadata?.height)
  );
}
function pickFallbackSize({ fallbackWidth: fallbackWidth = 0, fallbackHeight: fallbackHeight = 0 } = {}) {
  const width2 = toPositiveInt(fallbackWidth),
    height2 = toPositiveInt(fallbackHeight);
  return width2 > 0 && height2 > 0 ? { width: width2, height: height2 } : null;
}
function fileNameFromPath(result) {
  const enabled = String(result || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!enabled) return '';
  const list = enabled.split('/');
  return String(list[list.length - 1] || '').trim();
}
export function normalizeResultImageForDragOut(data) {
  const asObject2 = asObject(data);
  if (!asObject2 || firstNonEmptyString(asObject2.error)) return null;
  const args2 = buildCanvasLocalImageFields(asObject2, { includeSrc: true }),
    nonEmptyString = firstNonEmptyString(
      args2.src,
      args2.imageUrl,
      args2.sourceUrl,
      args2.thumbUrl,
      args2.localPath,
      args2.originalLocalPath,
      args2.displayLocalPath,
      args2.thumbLocalPath,
    );
  if (!nonEmptyString) return null;
  const imageWidth = pickImageWidth(asObject2),
    imageHeight = pickImageHeight(asObject2),
    fileName = firstNonEmptyString(
      asObject2.fileName,
      fileNameFromPath(args2.localPath),
      fileNameFromPath(args2.originalLocalPath),
      fileNameFromPath(args2.displayLocalPath),
    );
  return {
    ...args2,
    ...(imageWidth > 0 ? { imageWidth: imageWidth, originalWidth: imageWidth } : {}),
    ...(imageHeight > 0 ? { imageHeight: imageHeight, originalHeight: imageHeight } : {}),
    ...(fileName ? { fileName: fileName } : {}),
  };
}
export function hasUsableResultImageForDragOut(options) {
  return !!normalizeResultImageForDragOut(options);
}
export function buildResultImageDragOutNodePayload({
  image: image,
  viewport: viewport = { x: 0, y: 0, zoom: 1 },
  screenX: screenX = 0,
  screenY: screenY = 0,
  fallbackWidth: fallbackWidth = 0,
  fallbackHeight: fallbackHeight = 0,
  id: id = '',
  createId: createId = () => generateId('source-image'),
  name: name = '',
} = {}) {
  const src = normalizeResultImageForDragOut(image);
  if (!src) return null;
  const id2 = String(id || '').trim() || createId(),
    naturalWidth = toPositiveInt(src.imageWidth),
    naturalHeight = toPositiveInt(src.imageHeight),
    width3 = pickFallbackSize({ fallbackWidth: fallbackWidth, fallbackHeight: fallbackHeight }),
    x2 = screenToWorld(screenX, screenY, viewport || { x: 0, y: 0, zoom: 1 }),
    args3 =
      naturalWidth > 0 && naturalHeight > 0
        ? { naturalWidth: naturalWidth, naturalHeight: naturalHeight, needsAutoResize: false }
        : width3
          ? {
              width: width3.width,
              height: width3.height,
              fixedSize: true,
              needsAutoResize: false,
              useExplicitSizeAsSource: true,
            }
          : { needsAutoResize: true },
    box3 = buildSourceMediaNodePayload({
      ...src,
      ...args3,
      id: id2,
      type: 'source-image',
      x: 0,
      y: 0,
      name: firstNonEmptyString(name, src.fileName, t('aigenImage.result.imageFallbackName')),
      src: src.src || src.imageUrl || src.sourceUrl || '',
    });
  return {
    ...box3,
    x: x2.x - (box3.width || 0) / 2,
    y: x2.y - (box3.height || 0) / 2,
  };
}
function getEventClientPoint(event) {
  return {
    x: Number.isFinite(Number(event?.clientX)) ? Number(event.clientX) : 0,
    y: Number.isFinite(Number(event?.clientY)) ? Number(event.clientY) : 0,
  };
}
function getElementSize(el) {
  const box4 = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
  return {
    width: toPositiveInt(box4?.width) || toPositiveInt(el?.offsetWidth),
    height: toPositiveInt(box4?.height) || toPositiveInt(el?.offsetHeight),
  };
}
function resolveOption(handler, ...args4) {
  return typeof handler === 'function' ? handler(...args4) : handler;
}
function removeGhost(el2) {
  if (!el2) return;
  (el2.style &&
    ((el2.style.transition = 'opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)'), (el2.style.opacity = '0')),
    setTimeout(() => el2.remove?.(), 160));
}
export function createResultImageDragGhost({
  sourceEl: sourceEl = null,
  fallbackSrc: fallbackSrc = '',
  width: width = 0,
  height: height = 0,
  documentRef: documentRef = globalThis.document,
} = {}) {
  if (!documentRef?.createElement) return null;
  const width4 = Math.max(1, toPositiveInt(width) || 120),
    height3 = Math.max(1, toPositiveInt(height) || 120),
    el3 = documentRef.createElement('div');
  ((el3.className = 'v2-ghost-image result-image-drag-ghost'),
    Object.assign(el3.style, { width: width4 + 'px', height: height3 + 'px' }));
  const el4 = documentRef.createElement('img'),
    nonEmptyString2 = firstNonEmptyString(sourceEl?.currentSrc, sourceEl?.src, fallbackSrc);
  if (nonEmptyString2) el4.setAttribute('src', nonEmptyString2);
  return (el3.appendChild(el4), el3);
}
export function startResultImageDragOutPointer(event2, createId2 = {}) {
  if (!event2 || event2.button !== 0) return false;
  const enabled2 = createId2.targetEl || event2.currentTarget;
  if (!enabled2) return false;
  event2.stopPropagation?.();
  const documentRef2 = enabled2.ownerDocument || globalThis.document,
    el5 = documentRef2?.body || globalThis.document?.body,
    box5 = getEventClientPoint(event2);
  let target = false,
    el6 = null,
    source = false;
  const run = () => {
      if (source) return;
      ((source = true),
        documentRef2?.removeEventListener?.('pointermove', run2, true),
        documentRef2?.removeEventListener?.('pointerup', run3, true),
        documentRef2?.removeEventListener?.('pointercancel', run4, true));
      try {
        enabled2.releasePointerCapture?.(event2.pointerId);
      } catch {}
      createId2.onDragEnd?.();
    },
    handler2 = (next) => {
      if (target) return true;
      const box6 = getEventClientPoint(next);
      if (Math.hypot(box6.x - box5.x, box6.y - box5.y) <= RESULT_IMAGE_DRAG_OUT_THRESHOLD_PX) return false;
      const option = resolveOption(createId2.image);
      if (!hasUsableResultImageForDragOut(option))
        return (
          createId2.markClickSuppressed?.(),
          createId2.showToast?.(t('aigenImage.result.dragUnavailable'), 'warning'),
          run(),
          false
        );
      ((target = true), createId2.markClickSuppressed?.(), createId2.onDragStart?.());
      const sourceEl2 = resolveOption(createId2.getGhostSourceElement),
        width5 = resolveOption(createId2.getGhostSize) || getElementSize(sourceEl2 || enabled2);
      return (
        (el6 =
          createId2.createGhost?.({
            sourceEl: sourceEl2 || enabled2,
            fallbackSrc: resolveOption(createId2.getFallbackSrc) || '',
            width: width5.width,
            height: width5.height,
            documentRef: documentRef2,
          }) ||
          createResultImageDragGhost({
            sourceEl: sourceEl2 || enabled2,
            fallbackSrc: resolveOption(createId2.getFallbackSrc) || '',
            width: width5.width,
            height: width5.height,
            documentRef: documentRef2,
          })),
        el6 &&
          (el5?.appendChild?.(el6),
          (el6.style.transform = 'translate(' + box6.x + 'px, ' + box6.y + 'px) translate(-50%, -50%)')),
        true
      );
    };
  function run2(event3) {
    if (!handler2(event3)) return;
    (event3.preventDefault?.(), event3.stopPropagation?.());
    const box7 = getEventClientPoint(event3);
    el6 && (el6.style.transform = 'translate(' + box7.x + 'px, ' + box7.y + 'px) translate(-50%, -50%)');
  }
  function run3(event4) {
    const enabled3 = target;
    run();
    if (!enabled3) return;
    (event4.preventDefault?.(), event4.stopPropagation?.());
    const image2 = resolveOption(createId2.image),
      fallbackWidth2 =
        resolveOption(createId2.getNodeFallbackSize) ||
        resolveOption(createId2.getGhostSize) ||
        getElementSize(enabled2),
      resultImageDragOutNodePayload = buildResultImageDragOutNodePayload({
        image: image2,
        viewport: resolveOption(createId2.getViewport) || { x: 0, y: 0, zoom: 1 },
        screenX: Number(event4?.clientX ?? box5.x),
        screenY: Number(event4?.clientY ?? box5.y),
        fallbackWidth: fallbackWidth2.width,
        fallbackHeight: fallbackWidth2.height,
        createId: createId2.createId,
        name: resolveOption(createId2.getNodeName),
      });
    if (!resultImageDragOutNodePayload) {
      (createId2.showToast?.(t('aigenImage.result.dragUnavailable'), 'warning'), removeGhost(el6));
      return;
    }
    (createId2.addNode?.(resultImageDragOutNodePayload),
      createId2.setSelectedNodes?.([resultImageDragOutNodePayload.id]),
      createId2.commit?.(),
      createId2.onCreated?.(resultImageDragOutNodePayload),
      removeGhost(el6));
  }
  function run4(event5) {
    (event5?.stopPropagation?.(), run(), removeGhost(el6));
  }
  try {
    enabled2.setPointerCapture?.(event2.pointerId);
  } catch {}
  return (
    documentRef2?.addEventListener?.('pointermove', run2, true),
    documentRef2?.addEventListener?.('pointerup', run3, true),
    documentRef2?.addEventListener?.('pointercancel', run4, true),
    true
  );
}
export function bindResultImageDragOutGesture(targetEl, args5 = {}) {
  if (!targetEl?.addEventListener) return () => {};
  const current = (entry) => {
    if (args5.isEnabled && !args5.isEnabled()) return;
    startResultImageDragOutPointer(entry, { ...args5, targetEl: targetEl });
  };
  return (
    targetEl.addEventListener('pointerdown', current),
    () => targetEl.removeEventListener?.('pointerdown', current)
  );
}
