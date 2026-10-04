import { t } from '../i18n/index.js';
const MIN_SELECTION_SIZE = 8,
  ACTION_BAR_WIDTH = 92,
  ACTION_BAR_HEIGHT = 38,
  ACTION_BAR_MARGIN = 10,
  MAGNIFIER_SIZE = 172,
  MAGNIFIER_SAMPLE_SIZE = 56,
  MAGNIFIER_SCALE = 3,
  RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
function normalizeNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function clamp(index, result, data) {
  return Math.min(Math.max(index, result), data);
}
function getViewportSize() {
  return {
    width: Math.max(1, normalizeNumber(globalThis.window?.innerWidth, 1)),
    height: Math.max(1, normalizeNumber(globalThis.window?.innerHeight, 1)),
  };
}
function getWindowScreenOrigin() {
  const options = globalThis.window || {};
  return {
    x: normalizeNumber(options.screenX ?? options.screenLeft, 0),
    y: normalizeNumber(options.screenY ?? options.screenTop, 0),
  };
}
function getCssTokenValue(target, source = '') {
  const dom = globalThis.document,
    enabled = String(target || '').trim();
  if (!dom?.documentElement || !enabled) return source;
  const next = globalThis.getComputedStyle?.(dom.documentElement)?.getPropertyValue(enabled)?.trim();
  return next || source;
}
function normalizeRect(box) {
  const left = normalizeNumber(box?.left, 0),
    top = normalizeNumber(box?.top, 0),
    width = Math.max(0, normalizeNumber(box?.width, 0)),
    height = Math.max(0, normalizeNumber(box?.height, 0));
  return { left: left, top: top, width: width, height: height };
}
function rectFromPoints(box2, box3) {
  return normalizeRect({
    left: Math.min(box2.x, box3.x),
    top: Math.min(box2.y, box3.y),
    width: Math.abs(box3.x - box2.x),
    height: Math.abs(box3.y - box2.y),
  });
}
function clampRectToViewport(box4) {
  const box5 = getViewportSize(),
    width2 = Math.min(Math.max(MIN_SELECTION_SIZE, box4.width), box5.width),
    height2 = Math.min(Math.max(MIN_SELECTION_SIZE, box4.height), box5.height);
  return {
    left: clamp(box4.left, 0, Math.max(0, box5.width - width2)),
    top: clamp(box4.top, 0, Math.max(0, box5.height - height2)),
    width: width2,
    height: height2,
  };
}
function applySelectionRect(el, current) {
  const box6 = normalizeRect(current);
  return (
    (el.style.left = box6.left + 'px'),
    (el.style.top = box6.top + 'px'),
    (el.style.width = box6.width + 'px'),
    (el.style.height = box6.height + 'px'),
    el.classList.add('is-active'),
    box6
  );
}
function positionActionBar(el2, box7) {
  const box8 = getViewportSize(),
    entry = Math.min(
      Math.max(ACTION_BAR_MARGIN, box7.left + box7.width - ACTION_BAR_WIDTH),
      Math.max(ACTION_BAR_MARGIN, box8.width - ACTION_BAR_WIDTH - ACTION_BAR_MARGIN),
    ),
    record = box7.top + box7.height + ACTION_BAR_MARGIN,
    payload =
      record + ACTION_BAR_HEIGHT <= box8.height - ACTION_BAR_MARGIN
        ? record
        : Math.max(ACTION_BAR_MARGIN, box7.top - ACTION_BAR_HEIGHT - ACTION_BAR_MARGIN);
  ((el2.style.left = entry + 'px'), (el2.style.top = payload + 'px'));
}
function positionMagnifier(el3, handle, state) {
  const box9 = getViewportSize(),
    config = 18;
  let scope = handle + config,
    input = state + config;
  (scope + MAGNIFIER_SIZE > box9.width - 8 && (scope = handle - MAGNIFIER_SIZE - config),
    input + MAGNIFIER_SIZE > box9.height - 8 && (input = state - MAGNIFIER_SIZE - config),
    (el3.style.left = clamp(scope, 8, Math.max(8, box9.width - MAGNIFIER_SIZE - 8)) + 'px'),
    (el3.style.top = clamp(input, 8, Math.max(8, box9.height - MAGNIFIER_SIZE - 8)) + 'px'));
}
function loadImage(output) {
  return new Promise((handler, handler2) => {
    const image = new Image();
    ((image.onload = () => handler(image)),
      (image.onerror = () => handler2(new Error('screenshot image failed to load'))),
      (image.src = output));
  });
}
function canvasToBlob(value2) {
  return new Promise((handler3) => {
    value2.toBlob((value3) => handler3(value3), 'image/png');
  });
}
function mapClientPointToImage(value4, box10, value5, value6) {
  const value7 = value4.display || {},
    box11 = value7.bounds || {},
    box12 = value7.imageSize || {},
    number = normalizeNumber(box12.width, box10.naturalWidth || box10.width),
    number2 = normalizeNumber(box12.height, box10.naturalHeight || box10.height),
    value8 = number / Math.max(1, normalizeNumber(box11.width, globalThis.window?.innerWidth || 1)),
    value9 = number2 / Math.max(1, normalizeNumber(box11.height, globalThis.window?.innerHeight || 1)),
    box13 = getWindowScreenOrigin(),
    value10 = Math.round((box13.x + value5 - normalizeNumber(box11.x, 0)) * value8),
    value11 = Math.round((box13.y + value6 - normalizeNumber(box11.y, 0)) * value9);
  return {
    x: clamp(value10, 0, Math.max(0, number - 1)),
    y: clamp(value11, 0, Math.max(0, number2 - 1)),
    screenX: Math.round(box13.x + value5),
    screenY: Math.round(box13.y + value6),
  };
}
async function cropScreenshotToBlob(value12, box14, value13 = null) {
  const value14 = value13 || (await loadImage(value12.dataUrl)),
    box15 = mapClientPointToImage(value12, value14, box14.left, box14.top),
    box16 = mapClientPointToImage(value12, value14, box14.left + box14.width, box14.top + box14.height),
    value15 = box15.x,
    value16 = box15.y,
    value17 = Math.max(1, box16.x - box15.x),
    value18 = Math.max(1, box16.y - box15.y),
    box17 = document.createElement('canvas');
  ((box17.width = value17), (box17.height = value18));
  const ctx = box17.getContext('2d');
  if (!ctx) return null;
  return (
    ctx.drawImage(value14, value15, value16, value17, value18, 0, 0, value17, value18),
    await canvasToBlob(box17)
  );
}
function getPixelRgb(value19, box18) {
  const box19 = document.createElement('canvas');
  ((box19.width = 1), (box19.height = 1));
  const ctx2 = box19.getContext('2d', { willReadFrequently: true });
  if (!ctx2) return [0, 0, 0];
  return (
    ctx2.drawImage(value19, box18.x, box18.y, 1, 1, 0, 0, 1, 1),
    Array.from(ctx2.getImageData(0, 0, 1, 1).data.slice(0, 3))
  );
}
function drawMagnifier({
  magnifier: magnifier,
  canvas: canvas,
  meta: meta,
  image: image2,
  capture: capture,
  event: event,
}) {
  if (!image2) return;
  const box20 = mapClientPointToImage(capture, image2, event.clientX, event.clientY),
    ctx3 = canvas.getContext('2d');
  if (!ctx3) return;
  const value20 = MAGNIFIER_SAMPLE_SIZE,
    value21 = Math.floor(value20 / 2),
    clamp2 = clamp(box20.x - value21, 0, Math.max(0, (image2.naturalWidth || image2.width) - value20)),
    clamp3 = clamp(box20.y - value21, 0, Math.max(0, (image2.naturalHeight || image2.height) - value20)),
    value22 = value20 * MAGNIFIER_SCALE;
  ((ctx3.imageSmoothingEnabled = false),
    ctx3.clearRect(0, 0, canvas.width, canvas.height),
    ctx3.drawImage(image2, clamp2, clamp3, value20, value20, 0, 0, value22, value22));
  const value23 = Math.floor(value22 / 2);
  ((ctx3.strokeStyle = getCssTokenValue('--green', 'limegreen')),
    (ctx3.lineWidth = 1),
    ctx3.beginPath(),
    ctx3.moveTo(value23, 0),
    ctx3.lineTo(value23, value22),
    ctx3.moveTo(0, value23),
    ctx3.lineTo(value22, value23),
    ctx3.stroke());
  const [value24, value25, value26] = getPixelRgb(image2, box20);
  ((meta.textContent =
    'POS: (' +
    box20.screenX +
    ', ' +
    box20.screenY +
    ')\nRGB: (' +
    value24 +
    ',' +
    value25 +
    ',' +
    value26 +
    ')'),
    positionMagnifier(magnifier, event.clientX, event.clientY));
}
function buildResizeHandles() {
  return RESIZE_HANDLES.map((item2) => {
    const el4 = document.createElement('div');
    return (
      (el4.className = 'canvas-screenshot-handle canvas-screenshot-handle--' + item2),
      (el4.dataset.handle = item2),
      el4
    );
  });
}
function resizeRectFromHandle(box21, list, value27, value28) {
  let left2 = box21.left,
    top2 = box21.top,
    width3 = box21.width,
    height3 = box21.height;
  list.includes('w') && ((left2 = box21.left + value27), (width3 = box21.width - value27));
  list.includes('e') && (width3 = box21.width + value27);
  list.includes('n') && ((top2 = box21.top + value28), (height3 = box21.height - value28));
  list.includes('s') && (height3 = box21.height + value28);
  const value29 = box21.left + box21.width,
    value30 = box21.top + box21.height;
  if (width3 < MIN_SELECTION_SIZE) {
    if (list.includes('w')) left2 = value29 - MIN_SELECTION_SIZE;
    width3 = MIN_SELECTION_SIZE;
  }
  if (height3 < MIN_SELECTION_SIZE) {
    if (list.includes('n')) top2 = value30 - MIN_SELECTION_SIZE;
    height3 = MIN_SELECTION_SIZE;
  }
  return clampRectToViewport({ left: left2, top: top2, width: width3, height: height3 });
}
function removeOverlay(el5) {
  el5?.remove?.();
}
export async function startCanvasScreenshot({
  createImageNodeFromBlob: createImageNodeFromBlob,
  showToast: showToast,
} = {}) {
  const value31 = globalThis.window?.electronAPI?.screenshot;
  if (typeof value31?.captureDisplay !== 'function')
    return (showToast?.(t('canvasScreenshot.unsupported'), 'warn'), false);
  if (typeof createImageNodeFromBlob !== 'function')
    return (showToast?.(t('canvasScreenshot.entryNotReady'), 'error'), false);
  let capture2 = null;
  try {
    capture2 = await value31.captureDisplay();
  } catch {
    capture2 = null;
  }
  if (!capture2?.ok || !capture2.dataUrl)
    return (showToast?.(t('canvasScreenshot.captureFailed'), 'error'), false);
  const el6 = document.createElement('div');
  ((el6.className = 'canvas-screenshot-overlay is-idle'), (el6.tabIndex = -1));
  const value32 = document.createElement('div');
  value32.className = 'canvas-screenshot-backdrop';
  const el7 = document.createElement('div');
  ((el7.className = 'canvas-screenshot-hint'), (el7.textContent = t('canvasScreenshot.hints.selectArea')));
  const el8 = document.createElement('div');
  ((el8.className = 'canvas-screenshot-selection'), el8.append(...buildResizeHandles()));
  const el9 = document.createElement('div');
  el9.className = 'canvas-screenshot-actions';
  const el10 = document.createElement('button');
  ((el10.type = 'button'),
    (el10.className = 'canvas-screenshot-action canvas-screenshot-action--confirm'),
    el10.setAttribute('aria-label', t('canvasScreenshot.confirmAria')),
    (el10.textContent = '✓'));
  const el11 = document.createElement('button');
  ((el11.type = 'button'),
    (el11.className = 'canvas-screenshot-action canvas-screenshot-action--cancel'),
    el11.setAttribute('aria-label', t('canvasScreenshot.cancelAria')),
    (el11.textContent = '×'),
    el9.append(el10, el11));
  const magnifier2 = document.createElement('div');
  magnifier2.className = 'canvas-screenshot-magnifier';
  const canvas2 = document.createElement('canvas');
  ((canvas2.width = MAGNIFIER_SAMPLE_SIZE * MAGNIFIER_SCALE),
    (canvas2.height = MAGNIFIER_SAMPLE_SIZE * MAGNIFIER_SCALE));
  const meta2 = document.createElement('div');
  ((meta2.className = 'canvas-screenshot-magnifier-meta'),
    magnifier2.append(canvas2, meta2),
    el6.append(value32, el7, el8, el9, magnifier2),
    document.body.appendChild(el6),
    el6.focus?.());
  let value33 = 'idle',
    box22 = null,
    value34 = null,
    x = null,
    value35 = false,
    image3 = null;
  const image4 = loadImage(capture2.dataUrl)
      .then((value36) => {
        return ((image3 = value36), value36);
      })
      .catch(() => null),
    handler4 = (value37) => {
      ((value33 = value37),
        el6.classList.toggle('is-idle', value37 === 'idle'),
        el6.classList.toggle('is-selecting', value37 === 'selecting'),
        el6.classList.toggle('is-selected', value37 === 'selected'),
        el6.classList.toggle('is-busy', value37 === 'busy'));
    },
    handler5 = () => {
      if (!box22) return;
      ((box22 = applySelectionRect(el8, box22)),
        positionActionBar(el9, box22),
        el9.classList.add('is-active'),
        (el7.textContent = t('canvasScreenshot.hints.adjustArea')));
    },
    handler6 = () => {
      (globalThis.window?.removeEventListener?.('keydown', run, true),
        el6.removeEventListener('contextmenu', run2, true),
        removeOverlay(el6));
    },
    handler7 = () => {
      ((box22 = null),
        (x = null),
        el8.classList.remove('is-active'),
        el9.classList.remove('is-active', 'is-busy'),
        (el7.textContent = t('canvasScreenshot.hints.selectArea')),
        handler4('idle'));
    },
    handler8 = () => handler6(),
    handler9 = () => {
      if (value34 != null)
        try {
          el6.releasePointerCapture?.(value34);
        } catch {}
      ((value34 = null),
        el6.removeEventListener('pointermove', value38),
        el6.removeEventListener('pointerup', value39));
      if (!box22 || box22.width < MIN_SELECTION_SIZE || box22.height < MIN_SELECTION_SIZE) {
        (handler7(), showToast?.(t('canvasScreenshot.areaTooSmall'), 'warn'));
        return;
      }
      ((box22 = clampRectToViewport(box22)), handler4('selected'), handler5());
    },
    value38 = (x2) => {
      if (!x || value35) return;
      const value40 = x2.clientX - x.startX,
        value41 = x2.clientY - x.startY;
      if (x.type === 'select') {
        ((box22 = rectFromPoints({ x: x.startX, y: x.startY }, { x: x2.clientX, y: x2.clientY })),
          applySelectionRect(el8, box22));
        return;
      }
      if (x.type === 'move') {
        ((box22 = clampRectToViewport({
          ...x.startRect,
          left: x.startRect.left + value40,
          top: x.startRect.top + value41,
        })),
          handler5());
        return;
      }
      x.type === 'resize' &&
        ((box22 = resizeRectFromHandle(x.startRect, x.handle, value40, value41)), handler5());
    },
    value39 = () => {
      handler9();
    },
    handler10 = (startX, args) => {
      (startX.preventDefault(),
        (value34 = startX.pointerId),
        (x = { ...args, startX: startX.clientX, startY: startX.clientY }),
        el6.setPointerCapture?.(startX.pointerId),
        el6.addEventListener('pointermove', value38),
        el6.addEventListener('pointerup', value39, { once: true }));
    },
    handler11 = async () => {
      if (value35 || value33 !== 'selected' || !box22) return;
      ((value35 = true), handler4('busy'), el9.classList.add('is-busy'));
      try {
        const value42 = image3 || (await image4),
          blob = await cropScreenshotToBlob(capture2, box22, value42);
        if (!blob) throw new Error('empty screenshot crop');
        (await createImageNodeFromBlob(blob, 'image/png', {
          name: t('canvasScreenshot.nodeName'),
          typeSlug: 'screenshot',
        }),
          handler6(),
          showToast?.(t('canvasScreenshot.added'), 'success'));
      } catch (value43) {
        (console.warn('[canvasScreenshot] crop failed:', value43),
          handler6(),
          showToast?.(t('canvasScreenshot.addFailed'), 'error'));
      }
    };
  function run(event2) {
    if (event2.key !== 'Escape') return;
    (event2.preventDefault(), event2.stopPropagation(), handler8());
  }
  function run2(event3) {
    (event3.preventDefault(), event3.stopPropagation());
    if (value33 === 'idle') {
      handler8();
      return;
    }
    handler7();
  }
  return (
    el6.addEventListener('pointermove', (event4) => {
      if (value33 !== 'idle' || !image3) return;
      drawMagnifier({
        magnifier: magnifier2,
        canvas: canvas2,
        meta: meta2,
        image: image3,
        capture: capture2,
        event: event4,
      });
    }),
    el6.addEventListener('pointerdown', (left3) => {
      if (left3.button === 2) {
        left3.preventDefault();
        if (value33 === 'idle') handler8();
        else handler7();
        return;
      }
      if (left3.button !== 0 || value35) return;
      const handle2 = left3.target?.dataset?.handle || '';
      if (value33 === 'selected' && handle2 && box22) {
        handler10(left3, { type: 'resize', handle: handle2, startRect: { ...box22 } });
        return;
      }
      if (value33 === 'selected' && left3.target === el8 && box22) {
        handler10(left3, { type: 'move', startRect: { ...box22 } });
        return;
      }
      if (left3.target !== el6 && left3.target !== value32) return;
      (el9.classList.remove('is-active'),
        handler4('selecting'),
        (box22 = applySelectionRect(el8, {
          left: left3.clientX,
          top: left3.clientY,
          width: 0,
          height: 0,
        })),
        handler10(left3, { type: 'select' }));
    }),
    el9.addEventListener('pointerdown', (event5) => {
      event5.stopPropagation();
    }),
    el10.addEventListener('click', (event6) => {
      (event6.preventDefault(), event6.stopPropagation(), void handler11());
    }),
    el11.addEventListener('click', (event7) => {
      (event7.preventDefault(), event7.stopPropagation(), handler8());
    }),
    globalThis.window?.addEventListener?.('keydown', run, true),
    el6.addEventListener('contextmenu', run2, true),
    true
  );
}
