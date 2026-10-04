import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { saveOutputBlob } from './project.js';
import { generateId, screenToWorld, worldToScreen } from '../core/math.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { buildCanvasLocalImageFields } from '../services/canvasMediaLocalService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../components/aigenImage/imageGenerationResultRenderer.js';
import {
  addToolbarPendingResultNodes,
  persistToolbarResultNodes,
  updateToolbarResultNode,
} from './toolbarPendingResultNodes.js';
import { resolveImageCropSourceUrl } from './imageCropSourceUrl.js';
import { bindImageOverlayViewportPreview } from './imageOverlayViewportPreview.js';
export const IMAGE_CROP_MIN_SIZE = 0x14;
export const IMAGE_CROP_EXPORT_MAX_EDGE = 0x500;
function imageCropText(value, item = {}) {
  return t('imageCrop.' + value, item);
}
function toFiniteNumber(key, index = 0x0) {
  const result = Number(key);
  return Number['isFinite'](result) ? result : index;
}
function clamp(data, options, target) {
  return Math['max'](options, Math['min'](target, data));
}
function waitForCropBackgroundFrame() {
  return new Promise((handler) => {
    const run = globalThis['window']?.['requestAnimationFrame'] || globalThis['requestAnimationFrame'];
    if (typeof run === 'function') {
      run(() => handler());
      return;
    }
    setTimeout(handler, 0x0);
  });
}
export function buildImageCropOutputSize(
  source,
  next,
  { maxEdge: maxEdge = IMAGE_CROP_EXPORT_MAX_EDGE } = {},
) {
  const width = Math['max'](0x1, Math['round'](Number(source) || 0x0)),
    height = Math['max'](0x1, Math['round'](Number(next) || 0x0)),
    current = Math['max'](0x1, Math['round'](Number(maxEdge) || 0x0)),
    entry = Math['max'](width, height);
  if (entry <= current) return { width: width, height: height };
  const record = current / entry;
  return {
    width: Math['max'](0x1, Math['round'](width * record)),
    height: Math['max'](0x1, Math['round'](height * record)),
  };
}
export function isLoadedCropImageElement(el) {
  if (!el || String(el['tagName'] || '')['toUpperCase']() !== 'IMG') return ![];
  if (el['complete'] === ![]) return ![];
  if (String(el['style']?.['display'] || '')['toLowerCase']() === 'none') return ![];
  const payload = String(el['dataset']?.['lodSrc'] || '')['trim']();
  if (payload === 'thumb' || payload === 'placeholder') return ![];
  return (
    Math['max'](0x0, Math['round'](Number(el['naturalWidth'] || el['width'] || 0x0))) > 0x0 &&
    Math['max'](0x0, Math['round'](Number(el['naturalHeight'] || el['height'] || 0x0))) > 0x0
  );
}
export function findLoadedCropImageElement(handle, enabled = globalThis['document']) {
  const enabled2 = String(handle || '')['trim']();
  if (!enabled2 || !enabled?.['getElementById']) return null;
  const el2 = enabled['getElementById'](enabled2);
  if (!el2?.['querySelector']) return null;
  for (const state of ['.node-img', 'img']) {
    const config = el2['querySelector'](state);
    if (isLoadedCropImageElement(config)) return config;
  }
  return null;
}
function normalizeCropNodeBounds(box) {
  if (!box || typeof box !== 'object') return null;
  const x2 = toFiniteNumber(box['x']),
    y2 = toFiniteNumber(box['y']),
    width2 = Math['max'](0x0, toFiniteNumber(box['width'] ?? box['w'])),
    height2 = Math['max'](0x0, toFiniteNumber(box['height'] ?? box['h']));
  if (!(width2 > 0x0 && height2 > 0x0)) return null;
  return {
    x: x2,
    y: y2,
    width: width2,
    height: height2,
    right: x2 + width2,
    bottom: y2 + height2,
  };
}
function normalizeCropAspectRatio(scope) {
  const count = Number(scope);
  return Number['isFinite'](count) && count > 0x0 ? count : null;
}
function clampPointToNode(box2, box3) {
  return {
    x: clamp(toFiniteNumber(box2?.['x']), box3['x'], box3['right']),
    y: clamp(toFiniteNumber(box2?.['y']), box3['y'], box3['bottom']),
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
    count2 = box6['x'] - box5['x'],
    count3 = box6['y'] - box5['y'],
    x3 = count2 < 0x0 ? -0x1 : 0x1,
    y3 = count3 < 0x0 ? -0x1 : 0x1;
  let w = Math['abs'](count2),
    h = Math['abs'](count3);
  const cropAspectRatio = normalizeCropAspectRatio(aspectRatio);
  if (cropAspectRatio) {
    const input = x3 < 0x0 ? box5['x'] - box4['x'] : box4['right'] - box5['x'],
      output = y3 < 0x0 ? box5['y'] - box4['y'] : box4['bottom'] - box5['y'];
    if (w > 0x0 && h > 0x0)
      w / h > cropAspectRatio
        ? (w = h * cropAspectRatio)
        : (h = w / cropAspectRatio);
    else {
      if (w > 0x0) h = w / cropAspectRatio;
      else h > 0x0 && (w = h * cropAspectRatio);
    }
    (w > input && ((w = input), (h = w / cropAspectRatio)),
      h > output && ((h = output), (w = h * cropAspectRatio)));
  }
  if (!(w > 0x0 && h > 0x0)) return null;
  const rect = {
      x: x3 < 0x0 ? box5['x'] - w : box5['x'],
      y: y3 < 0x0 ? box5['y'] - h : box5['y'],
      w: w,
      h: h,
    },
    value2 = Math['max'](0x0, toFiniteNumber(minSize, IMAGE_CROP_MIN_SIZE));
  return { rect: rect, isValid: rect['w'] >= value2 && rect['h'] >= value2 };
}
const ImageCropController = {
  active: ![],
  nodeData: null,
  cropRect: { x: 0x0, y: 0x0, w: 0x0, h: 0x0 },
  aspectRatio: null,
  overlayEl: null,
  boxEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  _unsubscribe: null,
  _unsubscribeViewportPreview: null,
  _unsubscribeLocale: null,
  _view: null,
  _redrawSelection: null,
  _isProcessingCrop: ![],
  init(value3) {
    if (this['active']) return;
    const viewport = appStore['getStateRaw'](),
      node2 = viewport['nodes']?.[value3];
    if (!node2) return;
    ((this['active'] = !![]),
      (this['nodeData'] = node2),
      (this['_isProcessingCrop'] = ![]),
      (this['aspectRatio'] = null),
      (this['_view'] = { viewport: viewport['viewport'], node: node2 }),
      (this['_redrawSelection'] = null));
    const value4 = 0.1;
    this['cropRect'] = {
      x: node2['x'] + (node2['width'] * value4) / 0x2,
      y: node2['y'] + (node2['height'] * value4) / 0x2,
      w: node2['width'] * (0x1 - value4),
      h: node2['height'] * (0x1 - value4),
    };
    const run2 = () => {
      (this['_createUI'](),
        this['_bindEvents'](),
        (this['_unsubscribe'] = appStore['subscribeSelector'](
          (state2) => {
            const nx = state2['nodes']?.[value3],
              vx = state2['viewport'] || { x: 0x0, y: 0x0, zoom: 0x1 };
            return {
              hasNode: !!nx,
              nx: nx ? nx['x'] : 0x0,
              ny: nx ? nx['y'] : 0x0,
              nw: nx ? nx['width'] : 0x0,
              nh: nx ? nx['height'] : 0x0,
              vx: vx['x'],
              vy: vx['y'],
              vz: vx['zoom'] || 0x1,
              vox: vx['_screenOriginX'] || 0x0,
              voy: vx['_screenOriginY'] || 0x0,
            };
          },
          (x4) => {
            if (!x4?.['hasNode']) return;
            const node3 = appStore['getStateRaw']()['nodes']?.[value3];
            if (!node3) return;
            ((this['_view'] = {
              viewport: {
                x: x4['vx'],
                y: x4['vy'],
                zoom: x4['vz'],
                _screenOriginX: x4['vox'],
                _screenOriginY: x4['voy'],
              },
              node: node3,
            }),
              this['_updateView'](this['_view']));
          },
        )),
        (this['_unsubscribeViewportPreview'] = bindImageOverlayViewportPreview({
          getView: () => this['_view'],
          updateView: (value5) => {
            ((this['_view'] = value5), this['_updateView'](value5));
          },
        })),
        requestAnimationFrame(() => {
          if (this['overlayEl']) this['overlayEl']['classList']['add']('visible');
          if (this['dimMaskEl']) this['dimMaskEl']['classList']['add']('visible');
        }));
    };
    run2();
  },
  _createUI() {
    const el3 = document['createDocumentFragment'](),
      el4 = document['createElement']('div');
    ((el4['className'] = 'v2-crop-overlay'), (el4['style']['willChange'] = 'opacity'));
    const value6 = document['createElement']('div');
    value6['className'] = 'v2-crop-dim-mask';
    const el5 = document['createElement']('div');
    ((el5['className'] = 'v2-crop-container'), (el5['style']['transform'] = 'translateZ(0)'));
    const el6 = document['createElement']('div');
    ((el6['className'] = 'v2-crop-box'),
      (el6['style']['willChange'] = 'transform, width, height'),
      (el6['style']['transform'] = 'translateZ(0)'));
    const el7 = document['createElement']('div');
    ((el7['className'] = 'v2-crop-grid'), el7['replaceChildren']());
    for (let count4 = 0x0; count4 < 0x9; count4++)
      el7['appendChild'](document['createElement']('div'));
    el6['appendChild'](el7);
    const list = ['tl', 'tm', 'tr', 'rm', 'br', 'bm', 'bl', 'lm'];
    (list['forEach']((value7) => {
      const el8 = document['createElement']('div');
      ((el8['className'] = 'v2-crop-handle ' + value7),
        (el8['dataset']['handle'] = value7),
        el6['appendChild'](el8));
    }),
      el5['appendChild'](el6),
      el4['appendChild'](el5),
      el3['appendChild'](value6),
      el3['appendChild'](el4));
    const el9 = document['createElement']('div');
    ((el9['className'] = 'v2-crop-size-label'),
      (el9['textContent'] = '-- x --'),
      el3['appendChild'](el9),
      (this['sizeLabelEl'] = el9),
      (this['dimMaskEl'] = value6));
    const el10 = document['createElement']('div');
    ((el10['className'] = 'v2-crop-toolbar'), (el10['style']['willChange'] = 'opacity, transform'));
    const value8 = 'http://www.w3.org/2000/svg',
      handler2 = (value9, value10, value11) => {
        const el11 = document['createElementNS'](value8, 'svg');
        return (
          el11['setAttribute']('width', String(value9)),
          el11['setAttribute']('height', String(value10)),
          el11['setAttribute']('viewBox', '0 0 24 24'),
          el11['setAttribute']('fill', 'none'),
          el11['setAttribute']('stroke', 'currentColor'),
          el11['setAttribute']('stroke-width', String(value11)),
          el11
        );
      },
      el12 = document['createElement']('button');
    ((el12['className'] = 'v2-crop-toolbar-btn exit'),
      (el12['title'] = imageCropText('actions.exit')));
    const el13 = handler2(0x12, 0x12, 0x2),
      el14 = document['createElementNS'](value8, 'path');
    el14['setAttribute']('d', 'M18 6L6 18');
    const el15 = document['createElementNS'](value8, 'path');
    (el15['setAttribute']('d', 'M6 6l12 12'),
      el13['appendChild'](el14),
      el13['appendChild'](el15),
      el12['appendChild'](el13));
    const value12 = document['createElement']('div');
    value12['className'] = 'v2-crop-divider';
    const el16 = document['createElement']('div');
    el16['className'] = 'v2-expand-wrap';
    const el17 = document['createElement']('button');
    el17['className'] = 'v2-crop-toolbar-btn ratio-toggle';
    const el18 = handler2(0x10, 0x10, 0x2),
      el19 = document['createElementNS'](value8, 'rect');
    (el19['setAttribute']('x', '3'),
      el19['setAttribute']('y', '3'),
      el19['setAttribute']('width', '18'),
      el19['setAttribute']('height', '18'),
      el19['setAttribute']('rx', '2'));
    const el20 = document['createElementNS'](value8, 'path');
    (el20['setAttribute']('d', 'M3\x209h18M9\x2021V9'),
      el18['appendChild'](el19),
      el18['appendChild'](el20));
    const el21 = document['createElement']('span');
    ((el21['className'] = 'ratio-text'),
      (el21['textContent'] = imageCropText('ratios.free')),
      el17['appendChild'](el18),
      el17['appendChild'](el21));
    const el22 = document['createElement']('div');
    el22['className'] = 'floating-menu v2-expand-menu v2-crop-ratio-menu';
    const list2 = [
      { v: 'free', key: 'free', active: !![] },
      { v: 'original', key: 'original' },
      { v: '21:9', t: '21:9' },
      { v: '16:9', t: '16:9' },
      { v: '9:16', t: '9:16' },
      { v: '4:3', t: '4:3' },
      { v: '3:4', t: '3:4' },
      { v: '1:1', t: '1:1' },
    ];
    (list2['forEach']((event) => {
      const el23 = document['createElement']('div');
      ((el23['className'] =
        'floating-menu-item v2-expand-menu-item v2-crop-ratio-item' + (event['active'] ? ' active' : '')),
        (el23['dataset']['ratio'] = event['v']));
      if (event['key']) el23['dataset']['ratioLabelKey'] = event['key'];
      const el24 = document['createElement']('span');
      ((el24['className'] = 'floating-menu-label'),
        (el24['textContent'] = event['key']
          ? imageCropText('ratios.' + event['key'])
          : event['t']),
        el23['appendChild'](el24),
        el22['appendChild'](el23));
    }),
      el16['appendChild'](el17),
      el16['appendChild'](el22));
    const value13 = document['createElement']('div');
    value13['className'] = 'v2-crop-divider';
    const el25 = document['createElement']('button');
    el25['className'] = 'v2-crop-toolbar-btn confirm';
    const el26 = handler2(0x12, 0x12, 0x2),
      el27 = document['createElementNS'](value8, 'polyline');
    (el27['setAttribute']('points', '20\x206\x209\x2017\x204\x2012'),
      el26['appendChild'](el27),
      el25['appendChild'](el26),
      el25['appendChild'](document['createTextNode']('\x20' + imageCropText('actions.confirm'))),
      el10['appendChild'](el12),
      el10['appendChild'](value12),
      el10['appendChild'](el16),
      el10['appendChild'](value13),
      el10['appendChild'](el25),
      document['body']['appendChild'](el3),
      document['body']['appendChild'](el10),
      (this['overlayEl'] = el4),
      (this['boxEl'] = el6),
      (this['toolbarEl'] = el10),
      (this['ratioMenuEl'] = el22),
      this['_subscribeLocaleChanges'](),
      this['_syncLocaleTexts'](),
      requestAnimationFrame(() => {
        if (this['_containerEl']) this['_containerEl']['_lastTransform'] = null;
        if (this['boxEl']) this['boxEl']['_lastTransform'] = null;
        this['_updateView']();
      }));
  },
  _updateView(value14 = this['_view']) {
    if (!this['active']) return;
    const enabled3 = value14?.['node'],
      box7 = value14?.['viewport'];
    if (!enabled3) return;
    this['nodeData'] = enabled3;
    const box8 = worldToScreen(this['nodeData']['x'], this['nodeData']['y'], box7),
      value15 = {
        w: Math['round'](this['nodeData']['width'] * box7['zoom']),
        h: Math['round'](this['nodeData']['height'] * box7['zoom']),
      };
    !this['_containerEl'] &&
      (this['_containerEl'] = this['overlayEl']['querySelector']('.v2-crop-container'));
    const el28 = this['_containerEl'],
      value16 =
        'translate(' +
        Math['round'](box8['x']) +
        'px, ' +
        Math['round'](box8['y']) +
        'px) translateZ(0)';
    el28['_lastTransform'] !== value16 &&
      ((el28['style']['transform'] = value16), (el28['_lastTransform'] = value16));
    ((el28['style']['width'] = value15['w'] + 'px'),
      (el28['style']['height'] = value15['h'] + 'px'),
      (el28['style']['position'] = 'fixed'));
    const box9 = {
      x: Math['max'](0x0, Math['round']((this['cropRect']['x'] - this['nodeData']['x']) * box7['zoom'])),
      y: Math['max'](0x0, Math['round']((this['cropRect']['y'] - this['nodeData']['y']) * box7['zoom'])),
      w: Math['round'](this['cropRect']['w'] * box7['zoom']),
      h: Math['round'](this['cropRect']['h'] * box7['zoom']),
    };
    box9['x'] + box9['w'] > value15['w'] && (box9['w'] = value15['w'] - box9['x']);
    box9['y'] + box9['h'] > value15['h'] && (box9['h'] = value15['h'] - box9['y']);
    const value17 = 'translate(' + box9['x'] + 'px,\x20' + box9['y'] + 'px) translateZ(0)';
    this['boxEl']['_lastTransform'] !== value17 &&
      ((this['boxEl']['style']['transform'] = value17), (this['boxEl']['_lastTransform'] = value17));
    ((this['boxEl']['style']['width'] = box9['w'] + 'px'),
      (this['boxEl']['style']['height'] = box9['h'] + 'px'),
      (this['boxEl']['style']['left'] = '0'),
      (this['boxEl']['style']['top'] = '0'));
    if (this['sizeLabelEl']) {
      const value18 = Math['round'](this['cropRect']['w']),
        value19 = Math['round'](this['cropRect']['h']);
      this['sizeLabelEl']['textContent'] = value18 + '\x20×\x20' + value19;
      const value20 = box8['y'] + box9['y'] - 0x20,
        value21 = box8['x'] + box9['x'] + box9['w'] / 0x2;
      ((this['sizeLabelEl']['style']['top'] = value20 + 'px'),
        (this['sizeLabelEl']['style']['left'] = value21 + 'px'));
    }
    if (this['toolbarEl']) {
      const value22 = box8['y'] + value15['h'] + 0xe * box7['zoom'],
        value23 = box8['x'] + value15['w'] / 0x2;
      ((this['toolbarEl']['style']['top'] = value22 + 'px'),
        (this['toolbarEl']['style']['left'] = value23 + 'px'),
        (this['toolbarEl']['style']['transform'] = 'translateX(-50%)'));
    }
    if (this['dimMaskEl']) {
      const value24 = box8['x'] + box9['x'],
        value25 = box8['y'] + box9['y'],
        value26 = box9['w'],
        value27 = box9['h'],
        value28 =
          'polygon(\n        0% 0%, 100% 0%, 100% 100%, 0% 100%,\n        0% 0%,\n        ' +
          value24 +
          'px ' +
          value25 +
          'px,\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
          value24 +
          'px ' +
          (value25 + value27) +
          'px,\n        ' +
          (value24 + value26) +
          'px ' +
          (value25 + value27) +
          'px,\n        ' +
          (value24 + value26) +
          'px ' +
          value25 +
          'px,\n        ' +
          value24 +
          'px\x20' +
          value25 +
          'px\n      )';
      this['dimMaskEl']['style']['clipPath'] = value28;
    }
  },
  _applyRedrawVisualState() {
    const value29 = this['_redrawSelection']?.['mode'] || '',
      value30 = value29 === 'armed' || value29 === 'dragging',
      value31 = value29 === 'dragging';
    for (const el29 of [this['overlayEl'], this['dimMaskEl'], this['sizeLabelEl']]) {
      (el29?.['classList']?.['toggle']('is-redraw-armed', value30),
        el29?.['classList']?.['toggle']('is-redraw-dragging', value31));
    }
  },
  _isPointInsideNode(box10) {
    if (!this['nodeData'] || !box10) return ![];
    return (
      box10['x'] >= this['nodeData']['x'] &&
      box10['x'] <= this['nodeData']['x'] + this['nodeData']['width'] &&
      box10['y'] >= this['nodeData']['y'] &&
      box10['y'] <= this['nodeData']['y'] + this['nodeData']['height']
    );
  },
  _getWorldPointFromEvent(event2) {
    const value32 = this['_view']?.['viewport'] || { x: 0x0, y: 0x0, zoom: 0x1 };
    return screenToWorld(event2['clientX'], event2['clientY'], value32);
  },
  _enterRedrawSelectionMode() {
    if (!this['active']) return;
    const value33 = this['_redrawSelection']?.['mode'] || '';
    if (value33 === 'dragging') return;
    (value33 !== 'armed' &&
      (this['_redrawSelection'] = {
        mode: 'armed',
        previousRect: { ...this['cropRect'] },
        pointerId: null,
        startPoint: null,
      }),
      this['_applyRedrawVisualState']());
  },
  _exitRedrawSelectionMode({ restore: restore = !![] } = {}) {
    const args = this['_redrawSelection']?.['previousRect'];
    ((this['_redrawSelection'] = null),
      restore && args && ((this['cropRect'] = { ...args }), this['_updateView'](this['_view'])),
      this['_applyRedrawVisualState']());
  },
  _beginRedrawSelection(pointerId) {
    const startPoint2 = this['_getWorldPointFromEvent'](pointerId);
    if (!this['_isPointInsideNode'](startPoint2)) return ![];
    const previousRect = this['_redrawSelection']?.['previousRect'] || { ...this['cropRect'] };
    return (
      (this['_redrawSelection'] = {
        mode: 'dragging',
        previousRect: previousRect,
        pointerId: pointerId['pointerId'],
        startPoint: startPoint2,
        lastResult: null,
      }),
      (this['cropRect'] = { x: startPoint2['x'], y: startPoint2['y'], w: 0x0, h: 0x0 }),
      this['_applyRedrawVisualState'](),
      this['_updateView'](this['_view']),
      this['overlayEl']?.['setPointerCapture']?.(pointerId['pointerId']),
      !![]
    );
  },
  _updateRedrawSelection(value34) {
    const startPoint3 = this['_redrawSelection'];
    if (startPoint3?.['mode'] !== 'dragging') return;
    const currentPoint2 = this['_getWorldPointFromEvent'](value34),
      args2 = buildImageCropDragRect({
        startPoint: startPoint3['startPoint'],
        currentPoint: currentPoint2,
        node: this['nodeData'],
        aspectRatio: this['aspectRatio'],
        minSize: IMAGE_CROP_MIN_SIZE,
      });
    ((startPoint3['lastResult'] = args2),
      args2?.['rect'] &&
        ((this['cropRect'] = { ...args2['rect'] }), this['_updateView'](this['_view'])));
  },
  _finishRedrawSelection(value35, { cancel: cancel = ![] } = {}) {
    const event3 = this['_redrawSelection'];
    if (event3?.['mode'] !== 'dragging') return;
    !cancel && this['_updateRedrawSelection'](value35);
    const args3 = event3['lastResult'],
      value36 = event3['previousRect'],
      args4 =
        !cancel && args3?.['isValid'] && args3?.['rect'] ? { ...args3['rect'] } : value36;
    this['_redrawSelection'] = null;
    args4 && (this['cropRect'] = { ...args4 });
    try {
      this['overlayEl']?.['releasePointerCapture']?.(event3['pointerId']);
    } catch {}
    (this['_applyRedrawVisualState'](), this['_updateView'](this['_view']));
  },
  _bindEvents() {
    const value37 = (event4) => event4['stopPropagation']();
    this['overlayEl']['addEventListener']('wheel', value37, { passive: ![] });
    const value38 = () => this['_updateView'](this['_view']);
    window['addEventListener']('resize', value38);
    let enabled4 = ![],
      box11 = { x: 0x0, y: 0x0 },
      box12 = { ...this['cropRect'] },
      list3 = null;
    const value39 = (event5) => {
      if (event5['key'] === 'Escape') {
        if (this['_redrawSelection']?.['mode'] === 'dragging') {
          this['_finishRedrawSelection'](event5, { cancel: !![] });
          return;
        }
        this['exit']();
        return;
      }
      event5['key'] === 'Control' && !enabled4 && !list3 && this['_enterRedrawSelectionMode']();
    };
    window['addEventListener']('keydown', value39);
    const value40 = (event6) => {
      if (event6['key'] !== 'Control') return;
      this['_redrawSelection']?.['mode'] === 'armed' && this['_exitRedrawSelectionMode']({ restore: !![] });
    };
    window['addEventListener']('keyup', value40);
    const value41 = (event7) => {
        if (!event7['ctrlKey'] || enabled4 || list3) return;
        if (!this['_beginRedrawSelection'](event7)) return;
        (event7['preventDefault'](), event7['stopPropagation']());
      },
      value42 = (event8) => {
        if (
          this['_redrawSelection']?.['mode'] !== 'dragging' ||
          this['_redrawSelection']['pointerId'] !== event8['pointerId']
        )
          return;
        (event8['preventDefault'](),
          event8['stopPropagation'](),
          this['_updateRedrawSelection'](event8));
      },
      value43 = (event9) => {
        if (
          this['_redrawSelection']?.['mode'] !== 'dragging' ||
          this['_redrawSelection']['pointerId'] !== event9['pointerId']
        )
          return;
        (event9['preventDefault'](),
          event9['stopPropagation'](),
          this['_finishRedrawSelection'](event9));
      },
      value44 = (event10) => {
        if (
          this['_redrawSelection']?.['mode'] !== 'dragging' ||
          this['_redrawSelection']['pointerId'] !== event10['pointerId']
        )
          return;
        (event10['preventDefault'](),
          event10['stopPropagation'](),
          this['_finishRedrawSelection'](event10, { cancel: !![] }));
      };
    (this['overlayEl']['addEventListener']('pointerdown', value41, !![]),
      this['overlayEl']['addEventListener']('pointermove', value42, !![]),
      this['overlayEl']['addEventListener']('pointerup', value43, !![]),
      this['overlayEl']['addEventListener']('pointercancel', value44, !![]),
      this['boxEl']['addEventListener']('pointerdown', (x5) => {
        if (x5['target']['classList']['contains']('v2-crop-handle')) return;
        if (x5['ctrlKey']) return;
        (x5['stopPropagation'](),
          (enabled4 = !![]),
          (box11 = { x: x5['clientX'], y: x5['clientY'] }),
          (box12 = { ...this['cropRect'] }),
          this['boxEl']['setPointerCapture'](x5['pointerId']));
      }),
      this['boxEl']['addEventListener']('pointermove', (event11) => {
        if (!enabled4) return;
        const value45 = this['_view']?.['viewport']?.['zoom'] || 0x1,
          value46 = (event11['clientX'] - box11['x']) / value45,
          value47 = (event11['clientY'] - box11['y']) / value45;
        let value48 = box12['x'] + value46,
          value49 = box12['y'] + value47;
        const value50 = IMAGE_CROP_MIN_SIZE,
          value51 = IMAGE_CROP_MIN_SIZE;
        ((value48 = Math['max'](
          this['nodeData']['x'],
          Math['min'](value48, this['nodeData']['x'] + this['nodeData']['width'] - this['cropRect']['w']),
        )),
          (value49 = Math['max'](
            this['nodeData']['y'],
            Math['min'](
              value49,
              this['nodeData']['y'] + this['nodeData']['height'] - this['cropRect']['h'],
            ),
          )),
          (this['cropRect']['x'] = value48),
          (this['cropRect']['y'] = value49),
          this['_updateView'](this['_view']));
      }));
    const value52 = () => {
      enabled4 = ![];
    };
    (this['boxEl']['addEventListener']('pointerup', value52),
      this['boxEl']['addEventListener']('pointercancel', value52),
      this['boxEl']['addEventListener']('pointerdown', (x6) => {
        const el30 = x6['target']['closest']('.v2-crop-handle');
        if (!el30) return;
        if (x6['ctrlKey']) return;
        (x6['stopPropagation'](),
          (list3 = el30['dataset']['handle']),
          (box11 = { x: x6['clientX'], y: x6['clientY'] }),
          (box12 = { ...this['cropRect'] }),
          el30['setPointerCapture'](x6['pointerId']));
      }),
      this['boxEl']['addEventListener']('pointermove', (event12) => {
        if (!list3) return;
        const value53 = this['_view']?.['viewport']?.['zoom'] || 0x1,
          value54 = (event12['clientX'] - box11['x']) / value53,
          value55 = (event12['clientY'] - box11['y']) / value53;
        let { x: x7, y: y4, w: w2, h: h2 } = box12;
        const run3 = (value56, value57) => {
            const value58 = IMAGE_CROP_MIN_SIZE;
            if (value57) {
              const value59 = box12['x'] + box12['w'] - value58;
              ((x7 = Math['max'](
                this['nodeData']['x'],
                Math['min'](box12['x'] + value54, value59),
              )),
                (w2 = box12['w'] - (x7 - box12['x'])));
            } else
              w2 = Math['max'](
                value58,
                Math['min'](value56, this['nodeData']['x'] + this['nodeData']['width'] - x7),
              );
          },
          handler3 = (value60, value61) => {
            const value62 = IMAGE_CROP_MIN_SIZE;
            if (value61) {
              const value63 = box12['y'] + box12['h'] - value62;
              ((y4 = Math['max'](
                this['nodeData']['y'],
                Math['min'](box12['y'] + value55, value63),
              )),
                (h2 = box12['h'] - (y4 - box12['y'])));
            } else
              h2 = Math['max'](
                value62,
                Math['min'](value60, this['nodeData']['y'] + this['nodeData']['height'] - y4),
              );
          };
        if (list3['includes']('r')) run3(box12['w'] + value54, ![]);
        if (list3['includes']('l')) run3(box12['w'] - value54, !![]);
        if (list3['includes']('b')) handler3(box12['h'] + value55, ![]);
        if (list3['includes']('t')) handler3(box12['h'] - value55, !![]);
        if (this['aspectRatio']) {
          if (list3 === 'tm' || list3 === 'bm' || list3 === 'lm' || list3 === 'rm')
            list3['includes']('m') &&
              (list3 === 'tm' || list3 === 'bm'
                ? ((w2 = h2 * this['aspectRatio']),
                  (x7 = box12['x'] + (box12['w'] - w2) / 0x2))
                : ((h2 = w2 / this['aspectRatio']),
                  (y4 = box12['y'] + (box12['h'] - h2) / 0x2)));
          else {
            const value64 = w2 / h2;
            value64 > this['aspectRatio']
              ? (h2 = w2 / this['aspectRatio'])
              : (w2 = h2 * this['aspectRatio']);
            if (list3['includes']('t')) y4 = box12['y'] + box12['h'] - h2;
            if (list3['includes']('l')) x7 = box12['x'] + box12['w'] - w2;
          }
          (x7 < this['nodeData']['x'] &&
            ((x7 = this['nodeData']['x']), (w2 = h2 * this['aspectRatio'])),
            y4 < this['nodeData']['y'] &&
              ((y4 = this['nodeData']['y']), (h2 = w2 / this['aspectRatio'])),
            x7 + w2 > this['nodeData']['x'] + this['nodeData']['width'] &&
              ((w2 = this['nodeData']['x'] + this['nodeData']['width'] - x7),
              (h2 = w2 / this['aspectRatio'])),
            y4 + h2 > this['nodeData']['y'] + this['nodeData']['height'] &&
              ((h2 = this['nodeData']['y'] + this['nodeData']['height'] - y4),
              (w2 = h2 * this['aspectRatio'])));
        }
        ((this['cropRect'] = { x: x7, y: y4, w: w2, h: h2 }),
          this['_updateView']());
      }));
    const value65 = () => {
      list3 = null;
    };
    (this['boxEl']['addEventListener']('pointerup', value65),
      this['boxEl']['addEventListener']('pointercancel', value65),
      (this['toolbarEl']['querySelector']('.exit')['onclick'] = () => this['exit']()));
    const enabled5 = this['toolbarEl']['querySelector']('.ratio-toggle');
    ((enabled5['onclick'] = (event13) => {
      (event13['stopPropagation'](), this['ratioMenuEl']['classList']['toggle']('open'));
    }),
      (this['ratioMenuEl']['onclick'] = (event14) => {
        const el31 = event14['target']['closest']('.v2-crop-ratio-item');
        if (!el31) return;
        (this['ratioMenuEl']
          ['querySelectorAll']('.v2-crop-ratio-item')
          ['forEach']((el32) => el32['classList']['remove']('active')),
          el31['classList']['add']('active'),
          this['ratioMenuEl']['classList']['remove']('open'));
        const value66 = el31['dataset']['ratio'],
          value67 =
            el31['querySelector']('.floating-menu-label')?.['textContent'] || el31['textContent'];
        this['toolbarEl']['querySelector']('.ratio-text')['textContent'] = value67;
        if (value66 === 'free') {
          ((this['aspectRatio'] = null), this['_updateView'](this['_view']));
          return;
        }
        if (value66 === 'original')
          this['aspectRatio'] = this['nodeData']['width'] / this['nodeData']['height'];
        else {
          const [count5, count6] = value66['split'](':')['map'](Number);
          if (
            !Number['isFinite'](count5) ||
            !Number['isFinite'](count6) ||
            count5 <= 0x0 ||
            count6 <= 0x0
          ) {
            ((this['aspectRatio'] = null), this['_updateView'](this['_view']));
            return;
          }
          this['aspectRatio'] = count5 / count6;
        }
        let value68 = this['cropRect']['w'],
          value69 = value68 / this['aspectRatio'];
        (value69 > this['nodeData']['height'] &&
          ((value69 = this['nodeData']['height']), (value68 = value69 * this['aspectRatio'])),
          value68 > this['nodeData']['width'] &&
            ((value68 = this['nodeData']['width']), (value69 = value68 / this['aspectRatio'])),
          (this['cropRect']['w'] = value68),
          (this['cropRect']['h'] = value69),
          (this['cropRect']['x'] = this['nodeData']['x'] + (this['nodeData']['width'] - value68) / 0x2),
          (this['cropRect']['y'] = this['nodeData']['y'] + (this['nodeData']['height'] - value69) / 0x2),
          this['_updateView'](this['_view']));
      }),
      (this['toolbarEl']['querySelector']('.confirm')['onclick'] = () => this['confirm']()));
    const value70 = (event15) => {
      !this['ratioMenuEl']['contains'](event15['target']) &&
        !enabled5['contains'](event15['target']) &&
        this['ratioMenuEl']['classList']['remove']('open');
    };
    (document['addEventListener']('pointerdown', value70),
      (this['cleanup'] = () => {
        (window['removeEventListener']('resize', value38),
          window['removeEventListener']('keydown', value39),
          window['removeEventListener']('keyup', value40),
          document['removeEventListener']('pointerdown', value70),
          this['overlayEl']['removeEventListener']('wheel', value37),
          this['overlayEl']['removeEventListener']('pointerdown', value41, !![]),
          this['overlayEl']['removeEventListener']('pointermove', value42, !![]),
          this['overlayEl']['removeEventListener']('pointerup', value43, !![]),
          this['overlayEl']['removeEventListener']('pointercancel', value44, !![]));
      }));
  },
  _subscribeLocaleChanges() {
    if (this['_unsubscribeLocale']) return;
    this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']());
  },
  _setButtonText(el33, value71) {
    if (!el33) return;
    const el34 = Array['from'](el33['childNodes'])['find'](
      (value72) => value72['nodeType'] === 0x3,
    );
    if (el34) {
      el34['textContent'] = '\x20' + value71;
      return;
    }
    el33['appendChild'](document['createTextNode']('\x20' + value71));
  },
  _syncLocaleTexts() {
    if (!this['toolbarEl']) return;
    const value73 = this['toolbarEl']['querySelector']('.exit');
    if (value73) value73['title'] = imageCropText('actions.exit');
    this['ratioMenuEl']
      ?.['querySelectorAll']('.v2-crop-ratio-item[data-ratio-label-key]')
      ['forEach']((el35) => {
        const value74 = el35['dataset']['ratioLabelKey'],
          el36 = el35['querySelector']('.floating-menu-label');
        if (value74 && el36) el36['textContent'] = imageCropText('ratios.' + value74);
      });
    const el37 = this['ratioMenuEl']?.['querySelector'](
        '.v2-crop-ratio-item.active .floating-menu-label',
      ),
      el38 = this['toolbarEl']['querySelector']('.ratio-text');
    if (el37 && el38) el38['textContent'] = el37['textContent'];
    const value75 = this['toolbarEl']['querySelector']('.confirm');
    value75 &&
      !this['_isProcessingCrop'] &&
      this['_setButtonText'](value75, imageCropText('actions.confirm'));
  },
  exit() {
    if (!this['active']) return;
    ((this['active'] = ![]), (this['_isProcessingCrop'] = ![]));
    this['_unsubscribe'] && (this['_unsubscribe'](), (this['_unsubscribe'] = null));
    (this['_unsubscribeViewportPreview']?.(), (this['_unsubscribeViewportPreview'] = null));
    this['_unsubscribeLocale'] && (this['_unsubscribeLocale'](), (this['_unsubscribeLocale'] = null));
    this['_containerEl'] = null;
    this['boxEl'] && (this['boxEl']['_lastTransform'] = null);
    if (this['overlayEl']) this['overlayEl']['classList']['remove']('visible');
    if (this['dimMaskEl']) this['dimMaskEl']['classList']['remove']('visible');
    setTimeout(() => {
      if (this['overlayEl']) this['overlayEl']['remove']();
      if (this['toolbarEl']) this['toolbarEl']['remove']();
      if (this['dimMaskEl']) this['dimMaskEl']['remove']();
      if (this['sizeLabelEl']) this['sizeLabelEl']['remove']();
      (this['cleanup']?.(),
        (this['overlayEl'] = null),
        (this['boxEl'] = null),
        (this['toolbarEl'] = null),
        (this['ratioMenuEl'] = null),
        (this['dimMaskEl'] = null),
        (this['sizeLabelEl'] = null),
        (this['_view'] = null),
        (this['_redrawSelection'] = null));
    }, 0x12c);
  },
  async confirm() {
    const box13 = this['nodeData'];
    if (!box13) return;
    const el39 = this['toolbarEl']?.['querySelector']('.confirm');
    if (!el39) return;
    const list4 = Array['from'](el39['childNodes'])['map']((value76) =>
      value76['cloneNode'](!![]),
    );
    ((this['_isProcessingCrop'] = !![]),
      (el39['textContent'] = imageCropText('actions.processing')),
      (el39['style']['pointerEvents'] = 'none'));
    const startedAt = Date['now']();
    let id = '',
      enabled6 = ![],
      enabled7 = ![],
      imageUrl = '',
      duration = null;
    try {
      const box14 = { ...this['cropRect'] },
        value77 = box13['id'],
        name = box13['name'] || imageCropText('output.imageFallback'),
        name2 = imageCropText('output.nodeName', { name: name }),
        width3 = getAutoMediaSizeByShortSide(box14['w'], box14['h']),
        x8 = calcSafeSpawnPosNearNode(
          appStore['getStateRaw']()['nodes'],
          box13,
          width3['width'],
          width3['height'],
        );
      ((id = generateId('source-image-crop')),
        addToolbarPendingResultNodes({
          nodes: [
            buildSourceMediaNodePayload({
              id: id,
              type: 'source-image',
              x: x8['x'],
              y: x8['y'],
              width: width3['width'],
              height: width3['height'],
              name: name2,
              src: '',
              outputText: imageCropText('actions.processing'),
              ...buildGenerationStartPatch({ startedAt: startedAt }),
              needsAutoResize: ![],
              fixedSize: !![],
            }),
          ],
          persist: ![],
        }));
      const imageCropSourceUrl = resolveImageCropSourceUrl(box13),
        loadedCropImageElement = findLoadedCropImageElement(value77);
      (this['exit'](), (enabled6 = !![]), await waitForCropBackgroundFrame());
      if (!loadedCropImageElement && !imageCropSourceUrl) throw new Error(imageCropText('errors.sourceLoadFailed'));
      const value78 = loadedCropImageElement || (await this['_loadImage'](imageCropSourceUrl)),
        value79 = value78['naturalWidth'] / box13['width'],
        value80 = value78['naturalHeight'] / box13['height'],
        value81 = (box14['x'] - box13['x']) * value79,
        value82 = (box14['y'] - box13['y']) * value80,
        value83 = box14['w'] * value79,
        value84 = box14['h'] * value80,
        box15 = buildImageCropOutputSize(value83, value84),
        box16 = document['createElement']('canvas');
      ((box16['width'] = box15['width']), (box16['height'] = box15['height']));
      const ctx = box16['getContext']('2d');
      ctx['drawImage'](
        value78,
        value81,
        value82,
        value83,
        value84,
        0x0,
        0x0,
        box15['width'],
        box15['height'],
      );
      const enabled8 = await new Promise((value85) => box16['toBlob'](value85, 'image/jpeg', 0.9));
      if (!enabled8) throw new Error(imageCropText('errors.sourceLoadFailed'));
      const fileName = new File([enabled8], 'crop_' + Date['now']() + '.jpg', { type: 'image/jpeg' });
      ((imageUrl = URL['createObjectURL'](enabled8)),
        (duration = Math['max'](0x0, Date['now']() - startedAt)));
      const args5 =
          buildImageGenerationResultPatch(
            { imageUrl: imageUrl, sourceUrl: imageUrl, fileName: fileName['name'] },
            { duration: duration },
          ) || {},
        value86 = {
          outputType: 'image',
          url: imageUrl,
          imageUrl: imageUrl,
          sourceUrl: imageUrl,
          thumbUrl: '',
          localPath: '',
          fileName: fileName['name'],
        };
      (updateToolbarResultNode(id, {
        name: name2,
        ...args5,
        images: [value86],
        src: imageUrl,
        imageUrl: imageUrl,
        sourceUrl: imageUrl,
        thumbUrl: '',
        capturePreviewUrl: imageUrl,
        captureSavePending: !![],
        captureSaveError: null,
        localPath: '',
        fileName: fileName['name'],
        outputText: '',
        needsAutoResize: ![],
        fixedSize: !![],
      }),
        (enabled7 = !![]),
        await waitForCropBackgroundFrame());
      const imageUrl2 = await saveOutputBlob(fileName, { ext: 'jpg' }),
        localPath = pickResultLocalPath(imageUrl2),
        fileName2 = imageUrl2['filename'] || fileName['name'],
        imageUrl3 = buildCanvasLocalImageFields(
          {
            ...imageUrl2,
            localPath: localPath,
            imageUrl:
              imageUrl2['displayUrl'] ||
              imageUrl2['thumbUrl'] ||
              localPathToUrl(localPath) ||
              String(imageUrl2['url'] || '')['trim'](),
            sourceUrl: imageUrl2['originalUrl'] || imageUrl2['url'] || localPathToUrl(localPath),
            thumbUrl: imageUrl2['thumbUrl'],
            fileName: fileName2,
          },
          { includeSrc: !![] },
        ),
        src =
          imageUrl3['src'] ||
          imageUrl3['imageUrl'] ||
          localPathToUrl(localPath) ||
          String(imageUrl2['url'] || '')['trim']();
      (updateToolbarResultNode(id, {
        name: name2,
        ...(buildImageGenerationResultPatch(
          {
            ...imageUrl2,
            ...imageUrl3,
            imageUrl: imageUrl3['imageUrl'] || src,
            sourceUrl: imageUrl3['sourceUrl'] || src,
            thumbUrl: imageUrl3['thumbUrl'] || src,
            localPath: imageUrl3['localPath'] || localPath,
            fileName: fileName2,
          },
          { duration: duration },
        ) || {}),
        ...imageUrl3,
        src: src,
        localPath: imageUrl3['localPath'] || localPath,
        capturePreviewUrl: '',
        captureSavePending: ![],
        captureSaveError: null,
        fileName: fileName2,
        outputText: '',
        needsAutoResize: ![],
        fixedSize: !![],
      }),
        persistToolbarResultNodes(),
        imageUrl && (URL['revokeObjectURL'](imageUrl), (imageUrl = '')),
        window['showToast']?.(imageCropText('toasts.success'), 'success'));
    } catch (error) {
      console['error']('[Crop]\x20Failed:', error);
      const error2 = error instanceof Error ? error['message'] : String(error || '');
      (id &&
        (updateToolbarResultNode(id, {
          ...(buildImageGenerationFailurePatch({
            error: error2,
            startedAt: startedAt,
            clearMediaFields: !enabled7,
          }) || {}),
          captureSavePending: ![],
          captureSaveError: error2,
          ...(enabled7 ? {} : { capturePreviewUrl: '' }),
        }),
        persistToolbarResultNodes()),
        window['showToast']?.(imageCropText('toasts.failed', { error: error2 }), 'error'),
        (this['_isProcessingCrop'] = ![]),
        !enabled6 &&
          el39['isConnected'] &&
          (el39['replaceChildren'](...list4['map']((value87) => value87['cloneNode'](!![]))),
          (el39['style']['pointerEvents'] = 'auto')));
    }
  },
  _loadImage(value88) {
    return new Promise((handler4, handler5) => {
      const image = new Image();
      ((image['crossOrigin'] = 'anonymous'),
        (image['onload'] = () => handler4(image)),
        (image['onerror'] = () => handler5(new Error(imageCropText('errors.sourceLoadFailed')))),
        (image['src'] = value88));
    });
  },
};
export default ImageCropController;
