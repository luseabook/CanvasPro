import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { saveOutputBlob } from './project.js';
import { generateId, screenToWorld, worldToScreen } from '../core/math.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
export const IMAGE_CROP_MIN_SIZE = 20;
function imageCropText(value, item = {}) {
  return t('imageCrop.' + value, item);
}
function toFiniteNumber(key, index = 0) {
  const result = Number(key);
  return Number.isFinite(result) ? result : index;
}
function clamp(data, options, target) {
  return Math.max(options, Math.min(target, data));
}
function normalizeCropNodeBounds(box) {
  if (!box || typeof box !== 'object') return null;
  const x2 = toFiniteNumber(box.x),
    y2 = toFiniteNumber(box.y),
    width = Math.max(0, toFiniteNumber(box.width ?? box.w)),
    height = Math.max(0, toFiniteNumber(box.height ?? box.h));
  if (!(width > 0 && height > 0)) return null;
  return {
    x: x2,
    y: y2,
    width: width,
    height: height,
    right: x2 + width,
    bottom: y2 + height,
  };
}
function normalizeCropAspectRatio(source) {
  const count = Number(source);
  return Number.isFinite(count) && count > 0 ? count : null;
}
function clampPointToNode(box2, box3) {
  return {
    x: clamp(toFiniteNumber(box2?.x), box3.x, box3.right),
    y: clamp(toFiniteNumber(box2?.y), box3.y, box3.bottom),
  };
}
export function buildImageCropDragRect({
  startPoint: startPoint,
  currentPoint: currentPoint,
  node: node,
  aspectRatio: aspectRatio = null,
  minSize: minSize = IMAGE_CROP_MIN_SIZE,
} = {}) {
  const box4 = normalizeCropNodeBounds(node);
  if (!box4) return null;
  const box5 = clampPointToNode(startPoint, box4),
    box6 = clampPointToNode(currentPoint, box4),
    count2 = box6.x - box5.x,
    count3 = box6.y - box5.y,
    x3 = count2 < 0 ? -1 : 1,
    y3 = count3 < 0 ? -1 : 1;
  let w = Math.abs(count2),
    h = Math.abs(count3);
  const cropAspectRatio = normalizeCropAspectRatio(aspectRatio);
  if (cropAspectRatio) {
    const next = x3 < 0 ? box5.x - box4.x : box4.right - box5.x,
      current = y3 < 0 ? box5.y - box4.y : box4.bottom - box5.y;
    if (w > 0 && h > 0) w / h > cropAspectRatio ? (w = h * cropAspectRatio) : (h = w / cropAspectRatio);
    else {
      if (w > 0) h = w / cropAspectRatio;
      else h > 0 && (w = h * cropAspectRatio);
    }
    (w > next && ((w = next), (h = w / cropAspectRatio)),
      h > current && ((h = current), (w = h * cropAspectRatio)));
  }
  if (!(w > 0 && h > 0)) return null;
  const rect = {
      x: x3 < 0 ? box5.x - w : box5.x,
      y: y3 < 0 ? box5.y - h : box5.y,
      w: w,
      h: h,
    },
    entry = Math.max(0, toFiniteNumber(minSize, IMAGE_CROP_MIN_SIZE));
  return { rect: rect, isValid: rect.w >= entry && rect.h >= entry };
}
const ImageCropController = {
  active: false,
  nodeData: null,
  cropRect: { x: 0, y: 0, w: 0, h: 0 },
  aspectRatio: null,
  overlayEl: null,
  boxEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  _unsubscribe: null,
  _unsubscribeLocale: null,
  _view: null,
  _redrawSelection: null,
  _isProcessingCrop: false,
  init(record) {
    if (this.active) return;
    const viewport = appStore.getStateRaw(),
      node2 = viewport.nodes?.[record];
    if (!node2) return;
    ((this.active = true),
      (this.nodeData = node2),
      (this._isProcessingCrop = false),
      (this.aspectRatio = null),
      (this._view = { viewport: viewport.viewport, node: node2 }),
      (this._redrawSelection = null));
    const payload = 0.1;
    this.cropRect = {
      x: node2.x + (node2.width * payload) / 2,
      y: node2.y + (node2.height * payload) / 2,
      w: node2.width * (1 - payload),
      h: node2.height * (1 - payload),
    };
    const handle = () => {
      (this._createUI(),
        this._bindEvents(),
        (this._unsubscribe = appStore.subscribeSelector(
          (state) => {
            const nx = state.nodes?.[record],
              vx = state.viewport || { x: 0, y: 0, zoom: 1 };
            return {
              hasNode: !!nx,
              nx: nx ? nx.x : 0,
              ny: nx ? nx.y : 0,
              nw: nx ? nx.width : 0,
              nh: nx ? nx.height : 0,
              vx: vx.x,
              vy: vx.y,
              vz: vx.zoom || 1,
            };
          },
          (x4) => {
            if (!x4?.hasNode) return;
            const node3 = appStore.getStateRaw().nodes?.[record];
            if (!node3) return;
            ((this._view = {
              viewport: { x: x4.vx, y: x4.vy, zoom: x4.vz },
              node: node3,
            }),
              this._updateView(this._view));
          },
        )),
        requestAnimationFrame(() => {
          if (this.overlayEl) this.overlayEl.classList.add('visible');
          if (this.dimMaskEl) this.dimMaskEl.classList.add('visible');
        }));
    };
    typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(handle, { timeout: 50 })
      : setTimeout(handle, 0);
  },
  _createUI() {
    const el = document.createDocumentFragment(),
      el2 = document.createElement('div');
    ((el2.className = 'v2-crop-overlay'), (el2.style.willChange = 'opacity'));
    const config = document.createElement('div');
    config.className = 'v2-crop-dim-mask';
    const el3 = document.createElement('div');
    ((el3.className = 'v2-crop-container'), (el3.style.transform = 'translateZ(0)'));
    const el4 = document.createElement('div');
    ((el4.className = 'v2-crop-box'),
      (el4.style.willChange = 'transform, width, height'),
      (el4.style.transform = 'translateZ(0)'));
    const el5 = document.createElement('div');
    ((el5.className = 'v2-crop-grid'), el5.replaceChildren());
    for (let count4 = 0; count4 < 9; count4++) el5.appendChild(document.createElement('div'));
    el4.appendChild(el5);
    const list = ['tl', 'tm', 'tr', 'rm', 'br', 'bm', 'bl', 'lm'];
    (list.forEach((item2) => {
      const el6 = document.createElement('div');
      ((el6.className = 'v2-crop-handle ' + item2), (el6.dataset.handle = item2), el4.appendChild(el6));
    }),
      el3.appendChild(el4),
      el2.appendChild(el3),
      el.appendChild(config),
      el.appendChild(el2));
    const el7 = document.createElement('div');
    ((el7.className = 'v2-crop-size-label'),
      (el7.textContent = '-- x --'),
      el.appendChild(el7),
      (this.sizeLabelEl = el7),
      (this.dimMaskEl = config));
    const el8 = document.createElement('div');
    ((el8.className = 'v2-crop-toolbar'), (el8.style.willChange = 'opacity, transform'));
    const scope = 'http://www.w3.org/2000/svg',
      handler = (input, output, value2) => {
        const el9 = document.createElementNS(scope, 'svg');
        return (
          el9.setAttribute('width', String(input)),
          el9.setAttribute('height', String(output)),
          el9.setAttribute('viewBox', '0 0 24 24'),
          el9.setAttribute('fill', 'none'),
          el9.setAttribute('stroke', 'currentColor'),
          el9.setAttribute('stroke-width', String(value2)),
          el9
        );
      },
      el10 = document.createElement('button');
    ((el10.className = 'v2-crop-toolbar-btn exit'), (el10.title = imageCropText('actions.exit')));
    const el11 = handler(18, 18, 2),
      el12 = document.createElementNS(scope, 'path');
    el12.setAttribute('d', 'M18 6L6 18');
    const el13 = document.createElementNS(scope, 'path');
    (el13.setAttribute('d', 'M6 6l12 12'),
      el11.appendChild(el12),
      el11.appendChild(el13),
      el10.appendChild(el11));
    const value3 = document.createElement('div');
    value3.className = 'v2-crop-divider';
    const el14 = document.createElement('div');
    el14.className = 'v2-expand-wrap';
    const el15 = document.createElement('button');
    el15.className = 'v2-crop-toolbar-btn ratio-toggle';
    const el16 = handler(16, 16, 2),
      el17 = document.createElementNS(scope, 'rect');
    (el17.setAttribute('x', '3'),
      el17.setAttribute('y', '3'),
      el17.setAttribute('width', '18'),
      el17.setAttribute('height', '18'),
      el17.setAttribute('rx', '2'));
    const el18 = document.createElementNS(scope, 'path');
    (el18.setAttribute('d', 'M3 9h18M9 21V9'), el16.appendChild(el17), el16.appendChild(el18));
    const el19 = document.createElement('span');
    ((el19.className = 'ratio-text'),
      (el19.textContent = imageCropText('ratios.free')),
      el15.appendChild(el16),
      el15.appendChild(el19));
    const el20 = document.createElement('div');
    el20.className = 'floating-menu v2-expand-menu v2-crop-ratio-menu';
    const list2 = [
      { v: 'free', key: 'free', active: true },
      { v: 'original', key: 'original' },
      { v: '21:9', t: '21:9' },
      { v: '16:9', t: '16:9' },
      { v: '9:16', t: '9:16' },
      { v: '4:3', t: '4:3' },
      { v: '3:4', t: '3:4' },
      { v: '1:1', t: '1:1' },
    ];
    (list2.forEach((event) => {
      const el21 = document.createElement('div');
      ((el21.className =
        'floating-menu-item v2-expand-menu-item v2-crop-ratio-item' + (event.active ? ' active' : '')),
        (el21.dataset.ratio = event.v));
      if (event.key) el21.dataset.ratioLabelKey = event.key;
      const el22 = document.createElement('span');
      ((el22.className = 'floating-menu-label'),
        (el22.textContent = event.key ? imageCropText('ratios.' + event.key) : event.t),
        el21.appendChild(el22),
        el20.appendChild(el21));
    }),
      el14.appendChild(el15),
      el14.appendChild(el20));
    const value4 = document.createElement('div');
    value4.className = 'v2-crop-divider';
    const el23 = document.createElement('button');
    el23.className = 'v2-crop-toolbar-btn confirm';
    const el24 = handler(18, 18, 2),
      el25 = document.createElementNS(scope, 'polyline');
    (el25.setAttribute('points', '20 6 9 17 4 12'),
      el24.appendChild(el25),
      el23.appendChild(el24),
      el23.appendChild(document.createTextNode(' ' + imageCropText('actions.confirm'))),
      el8.appendChild(el10),
      el8.appendChild(value3),
      el8.appendChild(el14),
      el8.appendChild(value4),
      el8.appendChild(el23),
      document.body.appendChild(el),
      document.body.appendChild(el8),
      (this.overlayEl = el2),
      (this.boxEl = el4),
      (this.toolbarEl = el8),
      (this.ratioMenuEl = el20),
      this._subscribeLocaleChanges(),
      this._syncLocaleTexts(),
      requestAnimationFrame(() => {
        if (this._containerEl) this._containerEl._lastTransform = null;
        if (this.boxEl) this.boxEl._lastTransform = null;
        this._updateView();
      }));
  },
  _updateView(value5 = this._view) {
    if (!this.active) return;
    const enabled = value5?.node,
      box7 = value5?.viewport;
    if (!enabled) return;
    this.nodeData = enabled;
    const box8 = worldToScreen(this.nodeData.x, this.nodeData.y, box7),
      value6 = {
        w: Math.round(this.nodeData.width * box7.zoom),
        h: Math.round(this.nodeData.height * box7.zoom),
      };
    !this._containerEl && (this._containerEl = this.overlayEl.querySelector('.v2-crop-container'));
    const el26 = this._containerEl,
      value7 = 'translate(' + Math.round(box8.x) + 'px, ' + Math.round(box8.y) + 'px) translateZ(0)';
    el26._lastTransform !== value7 && ((el26.style.transform = value7), (el26._lastTransform = value7));
    ((el26.style.width = value6.w + 'px'),
      (el26.style.height = value6.h + 'px'),
      (el26.style.position = 'fixed'));
    const box9 = {
      x: Math.max(0, Math.round((this.cropRect.x - this.nodeData.x) * box7.zoom)),
      y: Math.max(0, Math.round((this.cropRect.y - this.nodeData.y) * box7.zoom)),
      w: Math.round(this.cropRect.w * box7.zoom),
      h: Math.round(this.cropRect.h * box7.zoom),
    };
    box9.x + box9.w > value6.w && (box9.w = value6.w - box9.x);
    box9.y + box9.h > value6.h && (box9.h = value6.h - box9.y);
    const value8 = 'translate(' + box9.x + 'px, ' + box9.y + 'px) translateZ(0)';
    this.boxEl._lastTransform !== value8 &&
      ((this.boxEl.style.transform = value8), (this.boxEl._lastTransform = value8));
    ((this.boxEl.style.width = box9.w + 'px'),
      (this.boxEl.style.height = box9.h + 'px'),
      (this.boxEl.style.left = '0'),
      (this.boxEl.style.top = '0'));
    if (this.sizeLabelEl) {
      const value9 = Math.round(this.cropRect.w),
        value10 = Math.round(this.cropRect.h);
      this.sizeLabelEl.textContent = value9 + ' × ' + value10;
      const value11 = box8.y + box9.y - 32,
        value12 = box8.x + box9.x + box9.w / 2;
      ((this.sizeLabelEl.style.top = value11 + 'px'), (this.sizeLabelEl.style.left = value12 + 'px'));
    }
    if (this.toolbarEl) {
      const value13 = box8.y + value6.h + 14 * box7.zoom,
        value14 = box8.x + value6.w / 2;
      ((this.toolbarEl.style.top = value13 + 'px'),
        (this.toolbarEl.style.left = value14 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'));
    }
    if (this.dimMaskEl) {
      const value15 = box8.x + box9.x,
        value16 = box8.y + box9.y,
        value17 = box9.w,
        value18 = box9.h,
        value19 =
          'polygon(\n        0% 0%, 100% 0%, 100% 100%, 0% 100%,\n        0% 0%,\n        ' +
          value15 +
          'px ' +
          value16 +
          'px,\n        ' +
          value15 +
          'px ' +
          (value16 + value18) +
          'px,\n        ' +
          (value15 + value17) +
          'px ' +
          (value16 + value18) +
          'px,\n        ' +
          (value15 + value17) +
          'px ' +
          value16 +
          'px,\n        ' +
          value15 +
          'px ' +
          value16 +
          'px\n      )';
      this.dimMaskEl.style.clipPath = value19;
    }
  },
  _applyRedrawVisualState() {
    const value20 = this._redrawSelection?.mode || '',
      value21 = value20 === 'armed' || value20 === 'dragging',
      value22 = value20 === 'dragging';
    for (const el27 of [this.overlayEl, this.dimMaskEl, this.sizeLabelEl]) {
      (el27?.classList?.toggle('is-redraw-armed', value21),
        el27?.classList?.toggle('is-redraw-dragging', value22));
    }
  },
  _isPointInsideNode(box10) {
    if (!this.nodeData || !box10) return false;
    return (
      box10.x >= this.nodeData.x &&
      box10.x <= this.nodeData.x + this.nodeData.width &&
      box10.y >= this.nodeData.y &&
      box10.y <= this.nodeData.y + this.nodeData.height
    );
  },
  _getWorldPointFromEvent(event2) {
    const value23 = this._view?.viewport || { x: 0, y: 0, zoom: 1 };
    return screenToWorld(event2.clientX, event2.clientY, value23);
  },
  _enterRedrawSelectionMode() {
    if (!this.active) return;
    const value24 = this._redrawSelection?.mode || '';
    if (value24 === 'dragging') return;
    (value24 !== 'armed' &&
      (this._redrawSelection = {
        mode: 'armed',
        previousRect: { ...this.cropRect },
        pointerId: null,
        startPoint: null,
      }),
      this._applyRedrawVisualState());
  },
  _exitRedrawSelectionMode({ restore: restore = true } = {}) {
    const args = this._redrawSelection?.previousRect;
    ((this._redrawSelection = null),
      restore && args && ((this.cropRect = { ...args }), this._updateView(this._view)),
      this._applyRedrawVisualState());
  },
  _beginRedrawSelection(pointerId) {
    const startPoint2 = this._getWorldPointFromEvent(pointerId);
    if (!this._isPointInsideNode(startPoint2)) return false;
    const previousRect = this._redrawSelection?.previousRect || { ...this.cropRect };
    return (
      (this._redrawSelection = {
        mode: 'dragging',
        previousRect: previousRect,
        pointerId: pointerId.pointerId,
        startPoint: startPoint2,
        lastResult: null,
      }),
      (this.cropRect = { x: startPoint2.x, y: startPoint2.y, w: 0, h: 0 }),
      this._applyRedrawVisualState(),
      this._updateView(this._view),
      this.overlayEl?.setPointerCapture?.(pointerId.pointerId),
      true
    );
  },
  _updateRedrawSelection(value25) {
    const startPoint3 = this._redrawSelection;
    if (startPoint3?.mode !== 'dragging') return;
    const currentPoint2 = this._getWorldPointFromEvent(value25),
      args2 = buildImageCropDragRect({
        startPoint: startPoint3.startPoint,
        currentPoint: currentPoint2,
        node: this.nodeData,
        aspectRatio: this.aspectRatio,
        minSize: IMAGE_CROP_MIN_SIZE,
      });
    ((startPoint3.lastResult = args2),
      args2?.rect && ((this.cropRect = { ...args2.rect }), this._updateView(this._view)));
  },
  _finishRedrawSelection(value26, { cancel: cancel = false } = {}) {
    const event3 = this._redrawSelection;
    if (event3?.mode !== 'dragging') return;
    !cancel && this._updateRedrawSelection(value26);
    const args3 = event3.lastResult,
      value27 = event3.previousRect,
      args4 = !cancel && args3?.isValid && args3?.rect ? { ...args3.rect } : value27;
    this._redrawSelection = null;
    args4 && (this.cropRect = { ...args4 });
    try {
      this.overlayEl?.releasePointerCapture?.(event3.pointerId);
    } catch {}
    (this._applyRedrawVisualState(), this._updateView(this._view));
  },
  _bindEvents() {
    const value28 = (event4) => event4.stopPropagation();
    this.overlayEl.addEventListener('wheel', value28, { passive: false });
    const value29 = () => this._updateView(this._view);
    window.addEventListener('resize', value29);
    let enabled2 = false,
      box11 = { x: 0, y: 0 },
      box12 = { ...this.cropRect },
      list3 = null;
    const value30 = (event5) => {
      if (event5.key === 'Escape') {
        if (this._redrawSelection?.mode === 'dragging') {
          this._finishRedrawSelection(event5, { cancel: true });
          return;
        }
        this.exit();
        return;
      }
      event5.key === 'Control' && !enabled2 && !list3 && this._enterRedrawSelectionMode();
    };
    window.addEventListener('keydown', value30);
    const value31 = (event6) => {
      if (event6.key !== 'Control') return;
      this._redrawSelection?.mode === 'armed' && this._exitRedrawSelectionMode({ restore: true });
    };
    window.addEventListener('keyup', value31);
    const value32 = (event7) => {
        if (!event7.ctrlKey || enabled2 || list3) return;
        if (!this._beginRedrawSelection(event7)) return;
        (event7.preventDefault(), event7.stopPropagation());
      },
      value33 = (event8) => {
        if (
          this._redrawSelection?.mode !== 'dragging' ||
          this._redrawSelection.pointerId !== event8.pointerId
        )
          return;
        (event8.preventDefault(), event8.stopPropagation(), this._updateRedrawSelection(event8));
      },
      value34 = (event9) => {
        if (
          this._redrawSelection?.mode !== 'dragging' ||
          this._redrawSelection.pointerId !== event9.pointerId
        )
          return;
        (event9.preventDefault(), event9.stopPropagation(), this._finishRedrawSelection(event9));
      },
      value35 = (event10) => {
        if (
          this._redrawSelection?.mode !== 'dragging' ||
          this._redrawSelection.pointerId !== event10.pointerId
        )
          return;
        (event10.preventDefault(),
          event10.stopPropagation(),
          this._finishRedrawSelection(event10, { cancel: true }));
      };
    (this.overlayEl.addEventListener('pointerdown', value32, true),
      this.overlayEl.addEventListener('pointermove', value33, true),
      this.overlayEl.addEventListener('pointerup', value34, true),
      this.overlayEl.addEventListener('pointercancel', value35, true),
      this.boxEl.addEventListener('pointerdown', (x5) => {
        if (x5.target.classList.contains('v2-crop-handle')) return;
        if (x5.ctrlKey) return;
        (x5.stopPropagation(),
          (enabled2 = true),
          (box11 = { x: x5.clientX, y: x5.clientY }),
          (box12 = { ...this.cropRect }),
          this.boxEl.setPointerCapture(x5.pointerId));
      }),
      this.boxEl.addEventListener('pointermove', (event11) => {
        if (!enabled2) return;
        const value36 = this._view?.viewport?.zoom || 1,
          value37 = (event11.clientX - box11.x) / value36,
          value38 = (event11.clientY - box11.y) / value36;
        let value39 = box12.x + value37,
          value40 = box12.y + value38;
        const value41 = IMAGE_CROP_MIN_SIZE,
          value42 = IMAGE_CROP_MIN_SIZE;
        ((value39 = Math.max(
          this.nodeData.x,
          Math.min(value39, this.nodeData.x + this.nodeData.width - this.cropRect.w),
        )),
          (value40 = Math.max(
            this.nodeData.y,
            Math.min(value40, this.nodeData.y + this.nodeData.height - this.cropRect.h),
          )),
          (this.cropRect.x = value39),
          (this.cropRect.y = value40),
          this._updateView(this._view));
      }));
    const value43 = () => {
      enabled2 = false;
    };
    (this.boxEl.addEventListener('pointerup', value43),
      this.boxEl.addEventListener('pointercancel', value43),
      this.boxEl.addEventListener('pointerdown', (x6) => {
        const el28 = x6.target.closest('.v2-crop-handle');
        if (!el28) return;
        if (x6.ctrlKey) return;
        (x6.stopPropagation(),
          (list3 = el28.dataset.handle),
          (box11 = { x: x6.clientX, y: x6.clientY }),
          (box12 = { ...this.cropRect }),
          el28.setPointerCapture(x6.pointerId));
      }),
      this.boxEl.addEventListener('pointermove', (event12) => {
        if (!list3) return;
        const value44 = this._view?.viewport?.zoom || 1,
          value45 = (event12.clientX - box11.x) / value44,
          value46 = (event12.clientY - box11.y) / value44;
        let { x: x7, y: y4, w: w2, h: h2 } = box12;
        const run = (value47, value48) => {
            const value49 = IMAGE_CROP_MIN_SIZE;
            if (value48) {
              const value50 = box12.x + box12.w - value49;
              ((x7 = Math.max(this.nodeData.x, Math.min(box12.x + value45, value50))),
                (w2 = box12.w - (x7 - box12.x)));
            } else w2 = Math.max(value49, Math.min(value47, this.nodeData.x + this.nodeData.width - x7));
          },
          handler2 = (value51, value52) => {
            const value53 = IMAGE_CROP_MIN_SIZE;
            if (value52) {
              const value54 = box12.y + box12.h - value53;
              ((y4 = Math.max(this.nodeData.y, Math.min(box12.y + value46, value54))),
                (h2 = box12.h - (y4 - box12.y)));
            } else h2 = Math.max(value53, Math.min(value51, this.nodeData.y + this.nodeData.height - y4));
          };
        if (list3.includes('r')) run(box12.w + value45, false);
        if (list3.includes('l')) run(box12.w - value45, true);
        if (list3.includes('b')) handler2(box12.h + value46, false);
        if (list3.includes('t')) handler2(box12.h - value46, true);
        if (this.aspectRatio) {
          if (list3 === 'tm' || list3 === 'bm' || list3 === 'lm' || list3 === 'rm')
            list3.includes('m') &&
              (list3 === 'tm' || list3 === 'bm'
                ? ((w2 = h2 * this.aspectRatio), (x7 = box12.x + (box12.w - w2) / 2))
                : ((h2 = w2 / this.aspectRatio), (y4 = box12.y + (box12.h - h2) / 2)));
          else {
            const value55 = w2 / h2;
            value55 > this.aspectRatio ? (h2 = w2 / this.aspectRatio) : (w2 = h2 * this.aspectRatio);
            if (list3.includes('t')) y4 = box12.y + box12.h - h2;
            if (list3.includes('l')) x7 = box12.x + box12.w - w2;
          }
          (x7 < this.nodeData.x && ((x7 = this.nodeData.x), (w2 = h2 * this.aspectRatio)),
            y4 < this.nodeData.y && ((y4 = this.nodeData.y), (h2 = w2 / this.aspectRatio)),
            x7 + w2 > this.nodeData.x + this.nodeData.width &&
              ((w2 = this.nodeData.x + this.nodeData.width - x7), (h2 = w2 / this.aspectRatio)),
            y4 + h2 > this.nodeData.y + this.nodeData.height &&
              ((h2 = this.nodeData.y + this.nodeData.height - y4), (w2 = h2 * this.aspectRatio)));
        }
        ((this.cropRect = { x: x7, y: y4, w: w2, h: h2 }), this._updateView());
      }));
    const value56 = () => {
      list3 = null;
    };
    (this.boxEl.addEventListener('pointerup', value56),
      this.boxEl.addEventListener('pointercancel', value56),
      (this.toolbarEl.querySelector('.exit').onclick = () => this.exit()));
    const enabled3 = this.toolbarEl.querySelector('.ratio-toggle');
    ((enabled3.onclick = (event13) => {
      (event13.stopPropagation(), this.ratioMenuEl.classList.toggle('open'));
    }),
      (this.ratioMenuEl.onclick = (event14) => {
        const el29 = event14.target.closest('.v2-crop-ratio-item');
        if (!el29) return;
        (this.ratioMenuEl
          .querySelectorAll('.v2-crop-ratio-item')
          .forEach((el30) => el30.classList.remove('active')),
          el29.classList.add('active'),
          this.ratioMenuEl.classList.remove('open'));
        const value57 = el29.dataset.ratio,
          value58 = el29.querySelector('.floating-menu-label')?.textContent || el29.textContent;
        this.toolbarEl.querySelector('.ratio-text').textContent = value58;
        if (value57 === 'free') {
          ((this.aspectRatio = null), this._updateView(this._view));
          return;
        }
        if (value57 === 'original') this.aspectRatio = this.nodeData.width / this.nodeData.height;
        else {
          const [count5, count6] = value57.split(':').map(Number);
          if (!Number.isFinite(count5) || !Number.isFinite(count6) || count5 <= 0 || count6 <= 0) {
            ((this.aspectRatio = null), this._updateView(this._view));
            return;
          }
          this.aspectRatio = count5 / count6;
        }
        let value59 = this.cropRect.w,
          value60 = value59 / this.aspectRatio;
        (value60 > this.nodeData.height &&
          ((value60 = this.nodeData.height), (value59 = value60 * this.aspectRatio)),
          value59 > this.nodeData.width &&
            ((value59 = this.nodeData.width), (value60 = value59 / this.aspectRatio)),
          (this.cropRect.w = value59),
          (this.cropRect.h = value60),
          (this.cropRect.x = this.nodeData.x + (this.nodeData.width - value59) / 2),
          (this.cropRect.y = this.nodeData.y + (this.nodeData.height - value60) / 2),
          this._updateView(this._view));
      }),
      (this.toolbarEl.querySelector('.confirm').onclick = () => this.confirm()));
    const value61 = (event15) => {
      !this.ratioMenuEl.contains(event15.target) &&
        !enabled3.contains(event15.target) &&
        this.ratioMenuEl.classList.remove('open');
    };
    (document.addEventListener('pointerdown', value61),
      (this.cleanup = () => {
        (window.removeEventListener('resize', value29),
          window.removeEventListener('keydown', value30),
          window.removeEventListener('keyup', value31),
          document.removeEventListener('pointerdown', value61),
          this.overlayEl.removeEventListener('wheel', value28),
          this.overlayEl.removeEventListener('pointerdown', value32, true),
          this.overlayEl.removeEventListener('pointermove', value33, true),
          this.overlayEl.removeEventListener('pointerup', value34, true),
          this.overlayEl.removeEventListener('pointercancel', value35, true));
      }));
  },
  _subscribeLocaleChanges() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  },
  _setButtonText(el31, value62) {
    if (!el31) return;
    const el32 = Array.from(el31.childNodes).find((item3) => item3.nodeType === 3);
    if (el32) {
      el32.textContent = ' ' + value62;
      return;
    }
    el31.appendChild(document.createTextNode(' ' + value62));
  },
  _syncLocaleTexts() {
    if (!this.toolbarEl) return;
    const value63 = this.toolbarEl.querySelector('.exit');
    if (value63) value63.title = imageCropText('actions.exit');
    this.ratioMenuEl?.querySelectorAll('.v2-crop-ratio-item[data-ratio-label-key]').forEach((el33) => {
      const value64 = el33.dataset.ratioLabelKey,
        el34 = el33.querySelector('.floating-menu-label');
      if (value64 && el34) el34.textContent = imageCropText('ratios.' + value64);
    });
    const el35 = this.ratioMenuEl?.querySelector('.v2-crop-ratio-item.active .floating-menu-label'),
      el36 = this.toolbarEl.querySelector('.ratio-text');
    if (el35 && el36) el36.textContent = el35.textContent;
    const value65 = this.toolbarEl.querySelector('.confirm');
    value65 && !this._isProcessingCrop && this._setButtonText(value65, imageCropText('actions.confirm'));
  },
  exit() {
    if (!this.active) return;
    ((this.active = false), (this._isProcessingCrop = false));
    this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
    this._unsubscribeLocale && (this._unsubscribeLocale(), (this._unsubscribeLocale = null));
    this._containerEl = null;
    this.boxEl && (this.boxEl._lastTransform = null);
    if (this.overlayEl) this.overlayEl.classList.remove('visible');
    if (this.dimMaskEl) this.dimMaskEl.classList.remove('visible');
    setTimeout(() => {
      if (this.overlayEl) this.overlayEl.remove();
      if (this.toolbarEl) this.toolbarEl.remove();
      if (this.dimMaskEl) this.dimMaskEl.remove();
      if (this.sizeLabelEl) this.sizeLabelEl.remove();
      (this.cleanup?.(),
        (this.overlayEl = null),
        (this.boxEl = null),
        (this.toolbarEl = null),
        (this.ratioMenuEl = null),
        (this.dimMaskEl = null),
        (this.sizeLabelEl = null),
        (this._view = null),
        (this._redrawSelection = null));
    }, 0x12c);
  },
  async confirm() {
    const el37 = this.toolbarEl.querySelector('.confirm'),
      list4 = Array.from(el37.childNodes).map((item4) => item4.cloneNode(true));
    ((this._isProcessingCrop = true),
      (el37.textContent = imageCropText('actions.processing')),
      (el37.style.pointerEvents = 'none'));
    try {
      const value66 = this.nodeData.localPath
          ? '/' + this.nodeData.localPath
          : this.nodeData.src || this.nodeData.sourceUrl,
        value67 = await this._loadImage(value66),
        value68 = value67.naturalWidth / this.nodeData.width,
        value69 = value67.naturalHeight / this.nodeData.height,
        value70 = (this.cropRect.x - this.nodeData.x) * value68,
        value71 = (this.cropRect.y - this.nodeData.y) * value69,
        value72 = this.cropRect.w * value68,
        value73 = this.cropRect.h * value69,
        box13 = document.createElement('canvas');
      ((box13.width = value72), (box13.height = value73));
      const ctx = box13.getContext('2d');
      ctx.drawImage(value67, value70, value71, value72, value73, 0, 0, value72, value73);
      const value74 = await new Promise((value75) => box13.toBlob(value75, 'image/jpeg', 0.9)),
        error = new File([value74], 'crop_' + Date.now() + '.jpg', { type: 'image/jpeg' }),
        fileName = await saveOutputBlob(error, { ext: 'jpg' }),
        localPath = pickResultLocalPath(fileName),
        src = String(fileName.url || '').trim() || localPathToUrl(localPath),
        width2 = getAutoMediaSizeByShortSide(this.cropRect.w, this.cropRect.h),
        box14 = calcSafeSpawnPosNearNode(
          appStore.getStateRaw().nodes,
          this.nodeData,
          width2.width,
          width2.height,
        ),
        x8 = box14.x,
        y5 = box14.y,
        id = generateId('source-image-crop');
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: id,
          type: 'source-image',
          x: x8,
          y: y5,
          width: width2.width,
          height: width2.height,
          name: imageCropText('output.nodeName', {
            name: this.nodeData.name || imageCropText('output.imageFallback'),
          }),
          src: src,
          localPath: localPath,
          fileName: fileName.filename || error.name,
          needsAutoResize: false,
        }),
      ),
        appStore.setSelectedNodes([id]),
        window.v2FocusOnNodes && window.v2FocusOnNodes([this.nodeData.id, id]),
        window._triggerLocalCacheSave?.(),
        window.showToast?.(imageCropText('toasts.success'), 'success'),
        this.exit());
    } catch (error2) {
      (console.error('[Crop] Failed:', error2),
        window.showToast?.(imageCropText('toasts.failed', { error: error2.message }), 'error'),
        (this._isProcessingCrop = false),
        el37.replaceChildren(...list4.map((item5) => item5.cloneNode(true))),
        (el37.style.pointerEvents = 'auto'));
    }
  },
  _loadImage(value76) {
    return new Promise((handler3, handler4) => {
      const image = new Image();
      ((image.crossOrigin = 'anonymous'),
        (image.onload = () => handler3(image)),
        (image.onerror = () => handler4(new Error(imageCropText('errors.sourceLoadFailed')))),
        (image.src = value76));
    });
  },
};
export default ImageCropController;
