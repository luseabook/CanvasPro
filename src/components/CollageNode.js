import appStore from '../core/stores/appStore.js';
import { generateId, screenToWorld } from '../core/math.js';
import { commit } from '../modules/history.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { calcSafeSpawnPosNearNode } from '../modules/nodeSpawn.js';
import { saveOutputBlob } from '../modules/project.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import {
  buildCollageAspectRatioPatch,
  buildCollageCollapsePatch,
  buildCollageDividerDragPatch,
  buildCollageItemSwapPatch,
  buildCollageLayoutPatch,
  COLLAGE_ASPECT_RATIO_OPTIONS,
  COLLAGE_BACKGROUND_OPTIONS,
  COLLAGE_EXPORT_RESOLUTIONS,
  COLLAGE_TEMPLATE_GROUPS,
  getCollageAspectRatioOption,
  getCollageBackgroundOption,
  getCollageExportResolution,
  getCollageLayoutStyle,
  getCollageLayoutPreset,
  isCollageBackgroundTransparent,
  isCollageItemEmpty,
  normalizeCollageImageScale,
  normalizeCollageBackgroundColor,
  normalizeEmptyCollageItem,
  normalizeCollageStyleValue,
  resolveCollageExportSize,
  resolveCollageEditableDividers,
  resolveCollageItemFrames,
  resolveCollageItemPreviewUrl,
  resolveCollageSizeByShortSide,
  resolveCollageItemSourceImage,
} from '../modules/collage/collageFactory.js';
const COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX = 8,
  COLLAGE_IMAGE_LOAD_CACHE_LIMIT = 48,
  collageImageLoadCache = new Map();
function collageText(value, item = {}) {
  return t('collageNode.' + value, item);
}
function collageTextOrFallback(key, index, result = {}) {
  const data = 'collageNode.' + key,
    t2 = t(data, result);
  return t2 === data ? index : t2;
}
function getCollagePresetLabel(enabled) {
  if (!enabled) return '';
  return collageTextOrFallback('layouts.' + enabled.id, enabled.label || '');
}
function getCollageBackgroundLabel(enabled2) {
  if (!enabled2) return '';
  return collageTextOrFallback('backgrounds.' + enabled2.id, enabled2.label || '');
}
function toPositiveNumber(options, target = 0) {
  const count = Number(options);
  return Number.isFinite(count) && count > 0 ? count : target;
}
function clamp01(source, next = 0.5) {
  const current = Number(source);
  if (!Number.isFinite(current)) return next;
  return Math.min(1, Math.max(0, current));
}
function createSvgIcon(entry) {
  const record = 'http://www.w3.org/2000/svg',
    el = document.createElementNS(record, 'svg');
  (el.setAttribute('width', '16'),
    el.setAttribute('height', '16'),
    el.setAttribute('viewBox', '0 0 24 24'),
    el.setAttribute('fill', 'none'),
    el.setAttribute('stroke', 'currentColor'),
    el.setAttribute('stroke-width', '2'),
    el.setAttribute('stroke-linecap', 'round'),
    el.setAttribute('stroke-linejoin', 'round'));
  for (const payload of entry) {
    const el2 = document.createElementNS(record, 'path');
    (el2.setAttribute('d', payload), el.appendChild(el2));
  }
  return el;
}
function canvasToBlob(handle, state, config) {
  return new Promise((handler, handler2) => {
    handle.toBlob(
      (scope) => {
        if (scope) handler(scope);
        else handler2(new Error(collageText('errors.exportBlobFailed')));
      },
      state,
      config,
    );
  });
}
function loadImage(input) {
  const enabled3 = String(input || '').trim();
  if (!enabled3) return Promise.reject(new Error(collageText('errors.emptyImageUrl')));
  const output = collageImageLoadCache.get(enabled3);
  if (output)
    return (collageImageLoadCache.delete(enabled3), collageImageLoadCache.set(enabled3, output), output);
  const value2 = new Promise((handler3, handler4) => {
    const image = new Image();
    ((image.crossOrigin = 'anonymous'),
      (image.onload = () => {
        typeof image.decode === 'function'
          ? image
              .decode()
              .catch(() => {})
              .finally(() => handler3(image))
          : handler3(image);
      }),
      (image.onerror = () => {
        (collageImageLoadCache.delete(enabled3), handler4(new Error(collageText('errors.imageLoadFailed'))));
      }),
      (image.src = enabled3));
  });
  collageImageLoadCache.set(enabled3, value2);
  while (collageImageLoadCache.size > COLLAGE_IMAGE_LOAD_CACHE_LIMIT) {
    const value3 = collageImageLoadCache.keys().next().value;
    collageImageLoadCache.delete(value3);
  }
  return value2;
}
function drawImageCover(ctx, box, value4, value5, count2, count3, value6, value7, value8 = 1) {
  const count4 = box.naturalWidth || box.width,
    count5 = box.naturalHeight || box.height;
  if (!(count4 > 0 && count5 > 0 && count2 > 0 && count3 > 0)) return false;
  const value9 = count2 / count3,
    value10 = count4 / count5,
    collageImageScale = normalizeCollageImageScale(value8);
  let value11 = 0,
    value12 = 0,
    value13 = count4,
    value14 = count5;
  return (
    value10 > value9
      ? ((value13 = (count5 * value9) / collageImageScale),
        (value14 = count5 / collageImageScale),
        (value11 = (count4 - value13) * clamp01(value6)),
        (value12 = (count5 - value14) * clamp01(value7)))
      : ((value13 = count4 / collageImageScale),
        (value14 = count4 / value9 / collageImageScale),
        (value11 = (count4 - value13) * clamp01(value6)),
        (value12 = (count5 - value14) * clamp01(value7))),
    ctx.drawImage(box, value11, value12, value13, value14, value4, value5, count2, count3),
    true
  );
}
function drawRoundedRectPath(ctx2, value15, value16, value17, value18, value19) {
  const value20 = Math.max(0, Math.min(value19, value17 / 2, value18 / 2));
  ctx2.beginPath();
  if (typeof ctx2.roundRect === 'function') {
    ctx2.roundRect(value15, value16, value17, value18, value20);
    return;
  }
  (ctx2.moveTo(value15 + value20, value16),
    ctx2.lineTo(value15 + value17 - value20, value16),
    ctx2.quadraticCurveTo(value15 + value17, value16, value15 + value17, value16 + value20),
    ctx2.lineTo(value15 + value17, value16 + value18 - value20),
    ctx2.quadraticCurveTo(
      value15 + value17,
      value16 + value18,
      value15 + value17 - value20,
      value16 + value18,
    ),
    ctx2.lineTo(value15 + value20, value16 + value18),
    ctx2.quadraticCurveTo(value15, value16 + value18, value15, value16 + value18 - value20),
    ctx2.lineTo(value15, value16 + value20),
    ctx2.quadraticCurveTo(value15, value16, value15 + value20, value16));
}
function drawRoundedImageCover(ctx3, value21, box2, count6, value22, value23, value24) {
  count6 > 0 &&
    (ctx3.save(), drawRoundedRectPath(ctx3, box2.x, box2.y, box2.width, box2.height, count6), ctx3.clip());
  const drawImageCover2 = drawImageCover(
    ctx3,
    value21,
    box2.x,
    box2.y,
    box2.width,
    box2.height,
    value22,
    value23,
    value24,
  );
  if (count6 > 0) ctx3.restore();
  return drawImageCover2;
}
function getDocumentCssVar(value25) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(value25).trim();
  } catch {
    return '';
  }
}
function resolveCssColorValue(value26) {
  const collageBackgroundColor = normalizeCollageBackgroundColor(value26);
  if (isCollageBackgroundTransparent(collageBackgroundColor)) return 'transparent';
  const value27 = collageBackgroundColor.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (value27) return getDocumentCssVar(value27[1]);
  return collageBackgroundColor;
}
function createBlobObjectUrl(enabled4) {
  const value28 = globalThis.URL || globalThis.window?.URL;
  if (!enabled4 || typeof value28?.createObjectURL !== 'function') return '';
  try {
    return value28.createObjectURL(enabled4);
  } catch (value29) {
    return '';
  }
}
function revokeBlobObjectUrl(enabled5) {
  if (!enabled5 || !String(enabled5).startsWith('blob:')) return;
  const value30 = globalThis.URL || globalThis.window?.URL;
  if (typeof value30?.revokeObjectURL !== 'function') return;
  try {
    value30.revokeObjectURL(enabled5);
  } catch (value31) {}
}
export class CollageNode {
  constructor(value32) {
    ((this._data = value32 && typeof value32 === 'object' ? value32 : {}),
      (this.id = this._data.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component collage-node'),
      (this._isEditing = !!this._data.isEditing),
      (this._isCollapsed = !!this._data.isCollapsed),
      (this._isExporting = false),
      (this._isCompositing = false),
      (this._openMenuKey = ''),
      (this._menuOutsideListeners = []),
      (this._activeImageDrag = null),
      (this._activeDividerDrag = null),
      (this._itemsCommitTimer = null),
      (this._previewSignature = ''),
      (this._highlightedSlotIndex = -1),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    (this._subscribeLocaleChanges(),
      this._removeMenuOutsideListeners(),
      this.el.replaceChildren(),
      (this._isEditing = !!this._data.isEditing),
      (this._isCollapsed = !!this._data.isCollapsed),
      this._syncRootState(),
      (this._toolbarEl = this._createToolbar()),
      this.el.appendChild(this._toolbarEl));
    const el3 = document.createElement('div');
    el3.className = 'collage-board';
    const collageBackgroundOption = getCollageBackgroundOption(this._data.backgroundColor);
    return (
      (el3.dataset.collageBackground = collageBackgroundOption.id),
      el3.addEventListener('dblclick', (event2) => {
        (event2.preventDefault(), event2.stopPropagation(), this._toggleEdit(true));
      }),
      el3.appendChild(this._createPreviewLayer()),
      this.el.appendChild(el3),
      (this._boardEl = el3),
      (this._previewSignature = this._getPreviewSignature()),
      this.el
    );
  }
  ['update'](value33) {
    ((this._data = value33 && typeof value33 === 'object' ? value33 : {}),
      (this._isEditing = !!this._data.isEditing),
      (this._isCollapsed = !!this._data.isCollapsed));
    if (!this._boardEl || !this._toolbarEl) {
      this.mount();
      return;
    }
    (this._syncBoardBackground(), this._syncToolbarState());
    const value34 = this._getPreviewSignature();
    value34 !== this._previewSignature ? this._syncPreviewLayer() : this._syncEditingState();
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._endImageDrag({ shouldCommit: false }),
      this._endDividerDrag({ shouldCommit: false }),
      this._removeMenuOutsideListeners(),
      this._itemsCommitTimer && (clearTimeout(this._itemsCommitTimer), (this._itemsCommitTimer = null)),
      (this._openMenuKey = ''));
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => {
      this.mount();
    });
  }
  ['highlightSlot'](value35) {
    const count7 = Number(value35),
      count8 = Number.isInteger(count7) && count7 >= 0 ? count7 : -1;
    if (this._highlightedSlotIndex === count8) return;
    const count9 = this._highlightedSlotIndex;
    this._highlightedSlotIndex = count8;
    count9 >= 0
      ? this._getTileByIndex(count9)?.classList.remove('is-drop-highlight')
      : this.el
          .querySelectorAll('.collage-item.is-drop-highlight')
          .forEach((el4) => el4.classList.remove('is-drop-highlight'));
    if (count8 < 0) return;
    this._getTileByIndex(count8)?.classList.add('is-drop-highlight');
  }
  ['previewItems'](items) {
    if (!Array.isArray(items)) return;
    ((this._data = { ...this._data, items: items }), this._syncPreviewLayer());
  }
  ['_getPreviewSignature'](box3 = this._data) {
    const outerPadding = getCollageLayoutStyle(box3),
      items2 = (Array.isArray(box3?.items) ? box3.items : []).map((id) => ({
        id: id?.id || '',
        slotIndex: id?.slotIndex ?? null,
        x: Number(id?.x) || 0,
        y: Number(id?.y) || 0,
        width: Number(id?.width) || 0,
        height: Number(id?.height) || 0,
        url: String(id?.url || ''),
        localPath: String(id?.localPath || ''),
        thumbLocalPath: String(id?.thumbLocalPath || ''),
        sourceLocalPath: String(id?.sourceLocalPath || ''),
        sourceUrl: String(id?.sourceUrl || ''),
        sourceDisplayWidth: Number(id?.sourceDisplayWidth) || 0,
        sourceDisplayHeight: Number(id?.sourceDisplayHeight) || 0,
        label: String(id?.label || ''),
        fit: String(id?.fit || ''),
        focusX: clamp01(id?.focusX),
        focusY: clamp01(id?.focusY),
        imageScale: normalizeCollageImageScale(id?.imageScale),
        isEmpty: !!id?.isEmpty,
      }));
    return JSON.stringify({
      width: toPositiveNumber(box3?.width, 1),
      height: toPositiveNumber(box3?.height, 1),
      outerPadding: outerPadding.outerPadding,
      gap: outerPadding.gap,
      cornerRadius: outerPadding.cornerRadius,
      items: items2,
    });
  }
  ['_createToolbar']() {
    const el5 = document.createElement('div');
    return (
      (el5.className = 'node-floating-toolbar collage-toolbar'),
      el5.appendChild(this._createAspectRatioPicker()),
      el5.appendChild(this._createTemplatePicker()),
      el5.appendChild(this._createToolbarDivider()),
      el5.appendChild(this._createEditButton()),
      el5.appendChild(this._createBackgroundColorPicker()),
      el5.appendChild(
        this._createRangeControl({
          field: 'outerPadding',
          label: collageText('toolbar.outerPadding'),
          icon: ['M4 4h16v16H4z', 'M8 8h8v8H8z'],
        }),
      ),
      el5.appendChild(
        this._createRangeControl({
          field: 'gap',
          label: collageText('toolbar.gap'),
          icon: ['M4 4h6v16H4z', 'M14 4h6v16h-6z'],
        }),
      ),
      el5.appendChild(
        this._createRangeControl({
          field: 'cornerRadius',
          label: collageText('toolbar.cornerRadius'),
          icon: ['M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z'],
        }),
      ),
      el5.appendChild(this._createCompositeButton()),
      el5.appendChild(this._createExportButton()),
      el5.appendChild(this._createCollapseButton()),
      el5
    );
  }
  ['_createToolbarDivider']() {
    const el6 = document.createElement('span');
    return (
      (el6.className = 'collage-toolbar-divider'),
      (el6.textContent = '|'),
      el6.setAttribute('aria-hidden', 'true'),
      el6
    );
  }
  ['_createEditButton']() {
    const el7 = document.createElement('button');
    ((el7.type = 'button'),
      (el7.className = 'ftb-btn icon-only act-edit collage-edit-btn'),
      el7.classList.toggle('active', this._isEditing));
    const value36 = this._isEditing ? collageText('toolbar.exitEdit') : collageText('toolbar.edit');
    return (
      (el7.dataset.tooltip = value36),
      el7.setAttribute('aria-label', value36),
      el7.appendChild(createSvgIcon(['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z'])),
      el7.addEventListener('pointerdown', (event3) => event3.stopPropagation()),
      el7.addEventListener('dblclick', (event4) => event4.stopPropagation()),
      el7.addEventListener('click', (event5) => {
        (event5.stopPropagation(), this._toggleEdit(!this._isEditing));
      }),
      el7
    );
  }
  ['_createAspectRatioPicker']() {
    const collageAspectRatioOption = getCollageAspectRatioOption(this._data.aspectRatio),
      el8 = document.createElement('div');
    ((el8.className = 'collage-ratio-wrap'),
      el8.addEventListener('pointerdown', (event6) => event6.stopPropagation()));
    const el9 = document.createElement('button');
    ((el9.type = 'button'),
      (el9.className = 'ftb-btn collage-ratio-trigger'),
      (el9.dataset.tooltip = collageText('ratio.tooltip')),
      el9.setAttribute('aria-label', collageText('ratio.tooltip')),
      el9.appendChild(createSvgIcon(['M4 6h16v12H4z'])));
    const el10 = document.createElement('span');
    ((el10.textContent = collageAspectRatioOption?.label || collageText('ratio.fallback')),
      el9.appendChild(el10));
    const el11 = document.createElement('div');
    el11.className = 'collage-menu collage-ratio-menu';
    for (const label of COLLAGE_ASPECT_RATIO_OPTIONS) {
      const el12 = document.createElement('button');
      ((el12.type = 'button'),
        (el12.className = 'collage-ratio-option'),
        (el12.dataset.collageRatio = label.label),
        el12.classList.toggle('is-active', label.label === collageAspectRatioOption?.label),
        el12.setAttribute('aria-label', collageText('ratio.optionAria', { label: label.label })));
      const el13 = document.createElement('span');
      ((el13.className = 'collage-ratio-mark'),
        (el13.dataset.collageRatio = label.label),
        el12.appendChild(el13));
      const el14 = document.createElement('span');
      ((el14.textContent = label.label),
        el12.appendChild(el14),
        el12.addEventListener('click', (event7) => {
          event7.stopPropagation();
          const collageAspectRatioPatch = buildCollageAspectRatioPatch(this._data, label.value);
          (appStore.updateNodeData(this.id, collageAspectRatioPatch), commit());
        }),
        el11.appendChild(el12));
    }
    return (
      el9.addEventListener('click', (event8) => {
        (event8.stopPropagation(), this._toggleMenu(el11));
      }),
      this._registerMenu(el11, el8, 'ratio'),
      el8.appendChild(el9),
      el8.appendChild(el11),
      el8
    );
  }
  ['_createTemplatePicker']() {
    const el15 = document.createElement('div');
    ((el15.className = 'collage-grid-wrap'),
      el15.addEventListener('pointerdown', (event9) => event9.stopPropagation()));
    const el16 = document.createElement('button');
    ((el16.type = 'button'),
      (el16.className = 'ftb-btn collage-grid-trigger'),
      (el16.dataset.tooltip = collageText('templates.tooltip')),
      el16.setAttribute('aria-label', collageText('templates.tooltip')),
      el16.appendChild(createSvgIcon(['M3 3h18v18H3z', 'M3 11h18', 'M11 3v18'])));
    const el17 = document.createElement('span');
    ((el17.textContent = collageText('templates.label')), el16.appendChild(el17));
    const el18 = document.createElement('div');
    el18.className = 'collage-menu collage-grid-menu';
    const el19 = document.createElement('div');
    el19.className = 'collage-grid-count-list';
    const el20 = document.createElement('div');
    ((el20.className = 'collage-template-panel'), el18.appendChild(el19), el18.appendChild(el20));
    let collageLayoutPreset = getCollageLayoutPreset(this._data.layoutPresetId).slotCount || 2;
    if (![2, 3, 4].includes(collageLayoutPreset)) collageLayoutPreset = 2;
    const run = (value37) => {
      ((collageLayoutPreset = value37),
        el19
          .querySelectorAll('.collage-grid-count-btn')
          .forEach((el21) => el21.classList.toggle('is-active', Number(el21.dataset.slotCount) === value37)),
        el20.replaceChildren());
      const value38 = COLLAGE_TEMPLATE_GROUPS.find((item2) => item2.slotCount === value37);
      for (const value39 of value38?.presets || []) {
        const el22 = document.createElement('button');
        ((el22.type = 'button'),
          (el22.className = 'collage-template-option'),
          (el22.dataset.collagePresetId = value39.id),
          el22.classList.toggle('is-active', value39.id === this._data.layoutPresetId));
        const collagePresetLabel = getCollagePresetLabel(value39);
        ((el22.title = collagePresetLabel),
          el22.setAttribute('aria-label', collagePresetLabel),
          el22.appendChild(this._createTemplatePreview(value39)),
          el22.addEventListener('click', (event10) => {
            event10.stopPropagation();
            const collageLayoutPatch = buildCollageLayoutPatch(this._data, value39.id);
            (appStore.updateNodeData(this.id, collageLayoutPatch), commit());
          }),
          el20.appendChild(el22));
      }
    };
    for (const count10 of COLLAGE_TEMPLATE_GROUPS) {
      const el23 = document.createElement('button');
      ((el23.type = 'button'),
        (el23.className = 'collage-grid-count-btn'),
        (el23.dataset.slotCount = String(count10.slotCount)),
        (el23.textContent = count10.label),
        el23.setAttribute('aria-label', collageText('templates.countAria', { count: count10.label })),
        el23.addEventListener('pointerenter', () => run(count10.slotCount)),
        el23.addEventListener('focus', () => run(count10.slotCount)),
        el23.addEventListener('click', (event11) => {
          (event11.stopPropagation(), run(count10.slotCount));
        }),
        el19.appendChild(el23));
    }
    return (
      run(collageLayoutPreset),
      el16.addEventListener('click', (event12) => {
        (event12.stopPropagation(), this._toggleMenu(el18));
      }),
      this._registerMenu(el18, el15, 'grid'),
      el15.appendChild(el16),
      el15.appendChild(el18),
      el15
    );
  }
  ['_createTemplatePreview'](box4) {
    const el24 = document.createElement('span');
    el24.className = 'collage-template-preview';
    for (const box5 of box4.slots || []) {
      const el25 = document.createElement('span');
      ((el25.className = 'collage-template-preview-slot'),
        (el25.style.left = (box5.x / box4.width) * 100 + '%'),
        (el25.style.top = (box5.y / box4.height) * 100 + '%'),
        (el25.style.width = (box5.width / box4.width) * 100 + '%'),
        (el25.style.height = (box5.height / box4.height) * 100 + '%'),
        el24.appendChild(el25));
    }
    return el24;
  }
  ['_createBackgroundColorPicker']() {
    const collageBackgroundOption2 = getCollageBackgroundOption(this._data.backgroundColor),
      el26 = document.createElement('div');
    ((el26.className = 'collage-bg-wrap'),
      el26.addEventListener('pointerdown', (event13) => event13.stopPropagation()));
    const el27 = document.createElement('button');
    ((el27.type = 'button'),
      (el27.className = 'ftb-btn icon-only collage-bg-btn'),
      (el27.dataset.tooltip = collageText('background.tooltip')),
      el27.setAttribute('aria-label', collageText('background.tooltip')));
    const el28 = document.createElement('span');
    ((el28.className = 'collage-bg-dot'),
      (el28.dataset.collageBackground = collageBackgroundOption2.id),
      el27.appendChild(el28));
    const el29 = document.createElement('div');
    ((el29.className = 'collage-menu collage-bg-menu'),
      el27.addEventListener('click', (event14) => {
        (event14.stopPropagation(), this._toggleMenu(el29));
      }));
    for (const el30 of COLLAGE_BACKGROUND_OPTIONS) {
      const el31 = document.createElement('button');
      ((el31.type = 'button'),
        (el31.className = 'collage-bg-option'),
        (el31.dataset.collageBackground = el30.id),
        (el31.dataset.collageBackgroundValue = el30.value),
        el31.classList.toggle('is-active', el30.id === collageBackgroundOption2.id));
      const label2 = getCollageBackgroundLabel(el30);
      ((el31.title = label2),
        el31.setAttribute('aria-label', collageText('background.optionAria', { label: label2 })),
        el31.addEventListener('click', (event15) => {
          (event15.stopPropagation(), this._setBackgroundColor(el30.value));
        }),
        el29.appendChild(el31));
    }
    return (
      this._registerMenu(el29, el26, 'background'),
      el26.appendChild(el27),
      el26.appendChild(el29),
      el26
    );
  }
  ['_createRangeControl']({ field: field, label: label3, icon: icon }) {
    const collageLayoutStyle = getCollageLayoutStyle(this._data),
      el32 = document.createElement('div');
    ((el32.className = 'collage-range-wrap'),
      (el32.dataset.collageRangeField = field),
      el32.addEventListener('pointerdown', (event16) => event16.stopPropagation()));
    const el33 = document.createElement('button');
    ((el33.type = 'button'),
      (el33.className = 'ftb-btn icon-only collage-range-btn'),
      (el33.dataset.tooltip = label3),
      el33.setAttribute('aria-label', label3),
      el33.appendChild(createSvgIcon(icon)));
    const el34 = document.createElement('div');
    el34.className = 'collage-menu collage-range-menu';
    const el35 = document.createElement('span');
    ((el35.className = 'collage-range-value'), (el35.textContent = String(collageLayoutStyle[field])));
    const el36 = document.createElement('input');
    return (
      (el36.type = 'range'),
      (el36.min = '0'),
      (el36.max = '100'),
      (el36.step = '1'),
      (el36.value = String(collageLayoutStyle[field])),
      el36.setAttribute('aria-label', label3),
      el36.addEventListener('input', () => {
        const collageStyleValue = normalizeCollageStyleValue(el36.value, collageLayoutStyle[field]);
        ((el35.textContent = String(collageStyleValue)),
          (this._data = { ...this._data, [field]: collageStyleValue }),
          this._syncPreviewLayoutStyle({ updateSignature: false }));
      }),
      el36.addEventListener('change', () => {
        const collageStyleValue2 = normalizeCollageStyleValue(el36.value, collageLayoutStyle[field]);
        ((this._data = { ...this._data, [field]: collageStyleValue2 }),
          this._syncPreviewLayoutStyle(),
          appStore.updateNodeData(this.id, { [field]: collageStyleValue2 }),
          commit());
      }),
      el34.appendChild(el35),
      el34.appendChild(el36),
      el33.addEventListener('click', (event17) => {
        (event17.stopPropagation(), this._toggleMenu(el34));
      }),
      this._registerMenu(el34, el32, 'range:' + field),
      el32.appendChild(el33),
      el32.appendChild(el34),
      el32
    );
  }
  ['_createCompositeButton']() {
    const el37 = document.createElement('div');
    ((el37.className = 'collage-compose-wrap'),
      el37.addEventListener('pointerdown', (event18) => event18.stopPropagation()));
    const el38 = document.createElement('button');
    ((el38.type = 'button'), (el38.className = 'ftb-btn icon-only act-compose collage-compose-btn'));
    const value40 = this._isExporting || this._isCompositing,
      value41 = this._isCompositing ? collageText('toolbar.composeBusy') : collageText('toolbar.compose');
    ((el38.dataset.tooltip = value41),
      el38.setAttribute('aria-label', value41),
      (el38.disabled = value40),
      el38.appendChild(createSvgIcon(['M12 3v18', 'M21 12H3'])));
    const el39 = document.createElement('div');
    el39.className = 'collage-menu collage-export-menu';
    for (const label4 of COLLAGE_EXPORT_RESOLUTIONS) {
      const el40 = document.createElement('button');
      ((el40.type = 'button'),
        (el40.className = 'collage-export-option'),
        (el40.textContent = label4.label),
        el40.setAttribute('aria-label', collageText('compose.optionAria', { label: label4.label })),
        el40.addEventListener('click', (event19) => {
          (event19.stopPropagation(), this._composeCollage(label4.longSide, el38));
        }),
        el39.appendChild(el40));
    }
    return (
      el38.addEventListener('click', (event20) => {
        (event20.stopPropagation(), this._toggleMenu(el39));
      }),
      this._registerMenu(el39, el37, 'compose'),
      el37.appendChild(el38),
      el37.appendChild(el39),
      el37
    );
  }
  ['_createExportButton']() {
    const el41 = document.createElement('div');
    ((el41.className = 'collage-export-wrap'),
      el41.addEventListener('pointerdown', (event21) => event21.stopPropagation()));
    const el42 = document.createElement('button');
    ((el42.type = 'button'), (el42.className = 'ftb-btn icon-only collage-export-btn'));
    const value42 = this._isExporting ? collageText('toolbar.exportBusy') : collageText('toolbar.export');
    ((el42.dataset.tooltip = value42),
      el42.setAttribute('aria-label', value42),
      (el42.disabled = this._isExporting || this._isCompositing),
      el42.appendChild(
        createSvgIcon(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']),
      ));
    const el43 = document.createElement('div');
    el43.className = 'collage-menu collage-export-menu';
    for (const label5 of COLLAGE_EXPORT_RESOLUTIONS) {
      const el44 = document.createElement('button');
      ((el44.type = 'button'),
        (el44.className = 'collage-export-option'),
        (el44.textContent = label5.label),
        el44.setAttribute('aria-label', collageText('export.optionAria', { label: label5.label })),
        el44.addEventListener('click', (event22) => {
          (event22.stopPropagation(), this._exportCollage(label5.longSide));
        }),
        el43.appendChild(el44));
    }
    return (
      el42.addEventListener('click', (event23) => {
        (event23.stopPropagation(), this._toggleMenu(el43));
      }),
      this._registerMenu(el43, el41, 'export'),
      el41.appendChild(el42),
      el41.appendChild(el43),
      el41
    );
  }
  ['_getCollapseIconPath']() {
    return this._isCollapsed ? 'M6 9l6 6 6-6' : 'M18 15l-6-6-6 6';
  }
  ['_createCollapseButton']() {
    const el45 = document.createElement('button');
    ((el45.type = 'button'), (el45.className = 'ftb-btn icon-only collage-collapse-btn'));
    const value43 = this._isCollapsed ? collageText('toolbar.expand') : collageText('toolbar.collapse');
    return (
      (el45.dataset.tooltip = value43),
      el45.setAttribute('aria-label', value43),
      el45.appendChild(createSvgIcon([this._getCollapseIconPath()])),
      el45.addEventListener('pointerdown', (event24) => event24.stopPropagation()),
      el45.addEventListener('dblclick', (event25) => event25.stopPropagation()),
      el45.addEventListener('click', (event26) => {
        (event26.stopPropagation(),
          event26.currentTarget?.blur?.(),
          this._toggleCollapse(!this._isCollapsed));
      }),
      el45
    );
  }
  ['_registerMenu'](el46, value44, value45) {
    el46.dataset.collageMenuKey = value45;
    if (this._openMenuKey === value45) el46.classList.add('show');
    this._addOutsideMenuListener(el46, value44);
  }
  ['_addOutsideMenuListener'](el47, value46) {
    const value47 = (event27) => {
      if (el47.contains(event27.target) || value46.contains(event27.target)) return;
      if (!el47.classList.contains('show')) return;
      (el47.classList.remove('show'),
        this._openMenuKey === el47.dataset.collageMenuKey && (this._openMenuKey = ''));
    };
    (window.addEventListener('pointerdown', value47), this._menuOutsideListeners.push(value47));
  }
  ['_removeMenuOutsideListeners']() {
    for (const value48 of this._menuOutsideListeners) {
      window.removeEventListener('pointerdown', value48);
    }
    this._menuOutsideListeners = [];
  }
  ['_closeMenus']({ clearKey: clearKey = true } = {}) {
    this.el.querySelectorAll('.collage-menu.show').forEach((el48) => el48.classList.remove('show'));
    if (clearKey) this._openMenuKey = '';
  }
  ['_toggleMenu'](el49) {
    const value49 = el49.classList.contains('show');
    this._closeMenus({ clearKey: false });
    if (value49) {
      this._openMenuKey = '';
      return;
    }
    ((this._openMenuKey = el49.dataset.collageMenuKey || ''), el49.classList.add('show'));
  }
  ['_syncBoardBackground']() {
    const collageBackgroundOption3 = getCollageBackgroundOption(this._data.backgroundColor);
    this._boardEl && (this._boardEl.dataset.collageBackground = collageBackgroundOption3.id);
  }
  ['_syncRootState']() {
    (this.el.classList.toggle('is-editing-mode', this._isEditing),
      this.el.classList.toggle('is-collapsed', this._isCollapsed));
  }
  ['_syncToolbarState']() {
    const el50 = this._toolbarEl || this.el.querySelector('.collage-toolbar');
    if (!el50) return;
    const el51 = el50.querySelector('.collage-edit-btn');
    if (el51) {
      el51.classList.toggle('active', this._isEditing);
      const value50 = this._isEditing ? collageText('toolbar.exitEdit') : collageText('toolbar.edit');
      ((el51.dataset.tooltip = value50), el51.setAttribute('aria-label', value50));
    }
    const collageAspectRatioOption2 = getCollageAspectRatioOption(this._data.aspectRatio),
      el52 = el50.querySelector('.collage-ratio-trigger span');
    el52 && (el52.textContent = collageAspectRatioOption2?.label || collageText('ratio.fallback'));
    (el50.querySelectorAll('.collage-ratio-option').forEach((el53) => {
      el53.classList.toggle('is-active', el53.dataset.collageRatio === collageAspectRatioOption2?.label);
    }),
      el50.querySelectorAll('.collage-template-option').forEach((el54) => {
        el54.classList.toggle('is-active', el54.dataset.collagePresetId === this._data.layoutPresetId);
      }));
    const collageBackgroundOption4 = getCollageBackgroundOption(this._data.backgroundColor),
      el55 = el50.querySelector('.collage-bg-dot');
    if (el55) el55.dataset.collageBackground = collageBackgroundOption4.id;
    el50.querySelectorAll('.collage-bg-option').forEach((el56) => {
      el56.classList.toggle('is-active', el56.dataset.collageBackground === collageBackgroundOption4.id);
    });
    const collageLayoutStyle2 = getCollageLayoutStyle(this._data);
    el50.querySelectorAll('.collage-range-wrap').forEach((el57) => {
      const enabled6 = el57.dataset.collageRangeField;
      if (!enabled6 || !(enabled6 in collageLayoutStyle2)) return;
      const value51 = collageLayoutStyle2[enabled6],
        el58 = el57.querySelector('.collage-range-value'),
        el59 = el57.querySelector('input[type="range"]');
      if (el58) el58.textContent = String(value51);
      if (el59 && el59.value !== String(value51)) el59.value = String(value51);
    });
    const el60 = el50.querySelector('.collage-compose-btn');
    if (el60) {
      el60.disabled = this._isExporting || this._isCompositing;
      const value52 = this._isCompositing
        ? collageText('toolbar.composeBusy')
        : collageText('toolbar.compose');
      ((el60.dataset.tooltip = value52), el60.setAttribute('aria-label', value52));
    }
    const el61 = el50.querySelector('.collage-export-btn');
    if (el61) {
      el61.disabled = this._isExporting || this._isCompositing;
      const value53 = this._isExporting ? collageText('toolbar.exportBusy') : collageText('toolbar.export');
      ((el61.dataset.tooltip = value53), el61.setAttribute('aria-label', value53));
    }
    const el62 = el50.querySelector('.collage-collapse-btn');
    if (el62) {
      const value54 = this._isCollapsed ? collageText('toolbar.expand') : collageText('toolbar.collapse');
      ((el62.dataset.tooltip = value54), el62.setAttribute('aria-label', value54));
      const el63 = el62.querySelector('svg path');
      el63?.setAttribute('d', this._getCollapseIconPath());
    }
  }
  ['_syncDividerLayer']() {
    const el64 = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!el64) return;
    el64.querySelectorAll('.collage-divider-layer').forEach((el65) => el65.remove());
    if (!this._isEditing) return;
    el64.appendChild(
      this._createDividerLayer(toPositiveNumber(this._data.width, 1), toPositiveNumber(this._data.height, 1)),
    );
  }
  ['_syncDividerGeometry']() {
    const el66 = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!el66) return;
    if (!this._isEditing) {
      el66.querySelectorAll('.collage-divider-layer').forEach((el67) => el67.remove());
      return;
    }
    const el68 = el66.querySelector('.collage-divider-layer');
    if (!el68) {
      this._syncDividerLayer();
      return;
    }
    const list = resolveCollageEditableDividers(this._data),
      list2 = Array.from(el68.querySelectorAll('.collage-divider-handle'));
    if (list.length !== list2.length) {
      this._syncDividerLayer();
      return;
    }
    const toPositiveNumber2 = toPositiveNumber(this._data.width, 1),
      toPositiveNumber3 = toPositiveNumber(this._data.height, 1);
    list.forEach((item3, value55) => {
      this._applyDividerHandleGeometry(list2[value55], item3, toPositiveNumber2, toPositiveNumber3);
    });
  }
  ['_syncEditingState']() {
    (this._syncRootState(),
      this.el
        .querySelectorAll('.collage-item')
        .forEach((el69) => el69.classList.toggle('is-editable', this._isEditing)),
      this._syncDividerLayer(),
      this._syncToolbarState());
  }
  ['_setComposeButtonBusy'](el70) {
    if (!el70) return null;
    const list3 = Array.from(el70.childNodes).map((item4) => item4.cloneNode(true)),
      value56 = el70.dataset.tooltip,
      value57 = el70.getAttribute('aria-label');
    (el70.replaceChildren(),
      (el70.dataset.tooltip = collageText('toolbar.composeBusyEllipsis')),
      el70.setAttribute('aria-label', collageText('toolbar.composeBusy')),
      (el70.disabled = true));
    const el71 = createSvgIcon(['M21 12a9 9 0 1 1-6.219-8.56']);
    return (
      el71.classList.add('v2-spinning'),
      el71.setAttribute('width', '14'),
      el71.setAttribute('height', '14'),
      el70.appendChild(el71),
      () => {
        (el70.replaceChildren(...list3.map((item5) => item5.cloneNode(true))),
          (el70.dataset.tooltip = value56 || collageText('toolbar.compose')),
          el70.setAttribute('aria-label', value57 || collageText('toolbar.compose')),
          (el70.disabled = false));
      }
    );
  }
  ['_toggleEdit'](enabled7) {
    const isEditing = !!enabled7;
    if (isEditing && this._isCollapsed) {
      this._toggleCollapse(false);
      return;
    }
    ((this._isEditing = isEditing),
      (this._data = { ...this._data, isEditing: isEditing }),
      this._syncEditingState(),
      appStore.updateNodeData(this.id, { isEditing: isEditing }));
  }
  ['_toggleCollapse'](value58) {
    const args = buildCollageCollapsePatch(this._data, value58);
    ((this._data = { ...this._data, ...args }),
      (this._isCollapsed = !!args.isCollapsed),
      (this._isEditing = !!this._data.isEditing),
      this._syncRootState(),
      this._syncToolbarState(),
      appStore.updateNodeData(this.id, args));
  }
  ['_setBackgroundColor'](value59) {
    const backgroundColor = normalizeCollageBackgroundColor(value59);
    ((this._data = { ...this._data, backgroundColor: backgroundColor }),
      this._syncBoardBackground(),
      this._syncToolbarState(),
      appStore.updateNodeData(this.id, { backgroundColor: backgroundColor }),
      commit());
  }
  ['_refreshPreviewLayer']() {
    if (!this._boardEl) return;
    ((this._highlightedSlotIndex = -1),
      this._boardEl.querySelectorAll('.collage-preview-layer').forEach((el72) => el72.remove()),
      this._boardEl.appendChild(this._createPreviewLayer()),
      (this._previewSignature = this._getPreviewSignature()),
      this._syncEditingState());
  }
  ['_applyTileFrame'](el73, box6, value60, value61, value62) {
    if (!el73 || !box6) return;
    ((el73.style.left = (box6.x / value60) * 100 + '%'),
      (el73.style.top = (box6.y / value61) * 100 + '%'),
      (el73.style.width = (box6.width / value60) * 100 + '%'),
      (el73.style.height = (box6.height / value61) * 100 + '%'),
      (el73.style.borderRadius = value62 + 'px'));
  }
  ['_syncTileContent'](el74, value63, value64, enabled8, value65) {
    if (!el74) return;
    ((el74.dataset.collageSlotIndex = String(value64)),
      el74.classList.toggle('is-empty', enabled8),
      el74.classList.toggle('is-editable', this._isEditing));
    const collageItemPreviewUrl = resolveCollageItemPreviewUrl(value63);
    if (collageItemPreviewUrl && !enabled8) {
      let el75 = el74.querySelector('.collage-item-img');
      !el75
        ? (el74.replaceChildren(),
          (el75 = document.createElement('img')),
          (el75.className = 'collage-item-img'),
          (el75.decoding = 'async'),
          (el75.loading = 'eager'),
          el74.appendChild(el75))
        : el74.querySelectorAll('.collage-slot-empty').forEach((el76) => el76.remove());
      el75.alt = value63.label || collageText('preview.imageAlt');
      el75.dataset.collagePreviewUrl !== collageItemPreviewUrl &&
        ((el75.dataset.collagePreviewUrl = collageItemPreviewUrl), (el75.src = collageItemPreviewUrl));
      (this._applyImagePlacement(el75, value63), (el75.style.borderRadius = value65 + 'px'));
      return;
    }
    const enabled9 = !!el74.querySelector('.collage-slot-empty');
    if (!enabled9 || el74.querySelector('.collage-item-img')) {
      const value66 = document.createElement('div');
      ((value66.className = 'collage-slot-empty'), el74.replaceChildren(value66));
    }
  }
  ['_createPreviewTile']({
    item: item6,
    index: index2,
    frame: frame,
    isEmpty: isEmpty,
    nodeWidth: nodeWidth,
    nodeHeight: nodeHeight,
    cornerRadius: cornerRadius,
  }) {
    const el77 = document.createElement('div');
    return (
      (el77.className = 'collage-item'),
      this._applyTileFrame(el77, frame, nodeWidth, nodeHeight, cornerRadius),
      el77.addEventListener('pointerdown', (value67) => this._beginImageDrag(value67, index2)),
      el77.addEventListener('wheel', (value68) => this._handleItemWheel(value68, index2), {
        passive: false,
      }),
      this._syncTileContent(el77, item6, index2, isEmpty, cornerRadius),
      el77
    );
  }
  ['_syncPreviewLayer']({ updateSignature: updateSignature = true } = {}) {
    const el78 = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!el78) {
      this._refreshPreviewLayer();
      return;
    }
    const list4 = resolveCollageItemFrames(this._data);
    if (list4.length === 0) {
      this._refreshPreviewLayer();
      return;
    }
    const nodeWidth2 = toPositiveNumber(this._data.width, 1),
      nodeHeight2 = toPositiveNumber(this._data.height, 1),
      { cornerRadius: cornerRadius2 } = getCollageLayoutStyle(this._data),
      map = new Map(
        Array.from(el78.querySelectorAll('.collage-item')).map((el79) => [
          Number(el79.dataset.collageSlotIndex),
          el79,
        ]),
      ),
      map2 = new Set();
    el78
      .querySelectorAll('.collage-empty, .collage-divider-layer, .collage-collapsed-badge')
      .forEach((el80) => el80.remove());
    for (const { item: item7, index: index3, frame: frame2, isEmpty: isEmpty2 } of list4) {
      map2.add(index3);
      let enabled10 = map.get(index3);
      (!enabled10
        ? (enabled10 = this._createPreviewTile({
            item: item7,
            index: index3,
            frame: frame2,
            isEmpty: isEmpty2,
            nodeWidth: nodeWidth2,
            nodeHeight: nodeHeight2,
            cornerRadius: cornerRadius2,
          }))
        : (this._applyTileFrame(enabled10, frame2, nodeWidth2, nodeHeight2, cornerRadius2),
          this._syncTileContent(enabled10, item7, index3, isEmpty2, cornerRadius2)),
        el78.appendChild(enabled10));
    }
    for (const [value69, el81] of map) {
      if (!map2.has(value69)) el81.remove();
    }
    this._isEditing && el78.appendChild(this._createDividerLayer(nodeWidth2, nodeHeight2));
    this._appendCollapsedBadge(el78);
    this._highlightedSlotIndex >= 0 &&
      this._getTileByIndex(this._highlightedSlotIndex)?.classList.add('is-drop-highlight');
    if (updateSignature) this._previewSignature = this._getPreviewSignature();
    (this._syncRootState(), this._syncToolbarState());
  }
  ['_syncPreviewLayoutStyle']({ updateSignature: updateSignature = true } = {}) {
    const el82 = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!el82) {
      this._refreshPreviewLayer();
      return;
    }
    const list5 = resolveCollageItemFrames(this._data),
      list6 = Array.from(el82.querySelectorAll('.collage-item'));
    if (list5.length !== list6.length) {
      this._refreshPreviewLayer();
      return;
    }
    const toPositiveNumber4 = toPositiveNumber(this._data.width, 1),
      toPositiveNumber5 = toPositiveNumber(this._data.height, 1),
      { cornerRadius: cornerRadius3 } = getCollageLayoutStyle(this._data),
      map3 = new Map(list5.map((item8) => [Number(item8.index), item8.frame]));
    for (const el83 of list6) {
      const value70 = Number(el83.dataset.collageSlotIndex),
        enabled11 = map3.get(value70);
      if (!enabled11) {
        this._refreshPreviewLayer();
        return;
      }
      this._applyTileFrame(el83, enabled11, toPositiveNumber4, toPositiveNumber5, cornerRadius3);
      const el84 = el83.querySelector('.collage-item-img');
      if (el84) el84.style.borderRadius = cornerRadius3 + 'px';
    }
    this._syncDividerGeometry();
    if (updateSignature) this._previewSignature = this._getPreviewSignature();
  }
  ['_createPreviewLayer']() {
    const el85 = document.createElement('div');
    el85.className = 'collage-preview-layer';
    const list7 = resolveCollageItemFrames(this._data);
    if (list7.length === 0) {
      const el86 = document.createElement('div');
      return (
        (el86.className = 'collage-empty'),
        (el86.textContent = collageText('preview.empty')),
        el85.appendChild(el86),
        this._appendCollapsedBadge(el85),
        el85
      );
    }
    const nodeWidth3 = toPositiveNumber(this._data.width, 1),
      nodeHeight3 = toPositiveNumber(this._data.height, 1),
      { cornerRadius: cornerRadius4 } = getCollageLayoutStyle(this._data);
    for (const { item: item9, index: index4, frame: frame3, isEmpty: isEmpty3 } of list7) {
      const value71 = this._createPreviewTile({
        item: item9,
        index: index4,
        frame: frame3,
        isEmpty: isEmpty3,
        nodeWidth: nodeWidth3,
        nodeHeight: nodeHeight3,
        cornerRadius: cornerRadius4,
      });
      el85.appendChild(value71);
    }
    return (
      this._isEditing && el85.appendChild(this._createDividerLayer(nodeWidth3, nodeHeight3)),
      this._appendCollapsedBadge(el85),
      el85
    );
  }
  ['_appendCollapsedBadge'](el87) {
    if (!this._isCollapsed || !el87) return;
    el87.appendChild(this._createCollapsedBadge());
  }
  ['_createCollapsedBadge']() {
    const el88 = document.createElement('button');
    ((el88.type = 'button'),
      (el88.className = 'collage-collapsed-badge'),
      (el88.dataset.tooltip = collageText('toolbar.expand')),
      el88.setAttribute('aria-label', collageText('preview.expandAria')),
      el88.appendChild(createSvgIcon(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'])));
    const el89 = document.createElement('span'),
      value72 = Array.isArray(this._data.items) ? this._data.items.length : 0;
    return (
      (el89.textContent = String(value72)),
      el88.appendChild(el89),
      el88.addEventListener('pointerdown', (event28) => event28.stopPropagation()),
      el88.addEventListener('dblclick', (event29) => event29.stopPropagation()),
      el88.addEventListener('click', (event30) => {
        (event30.stopPropagation(), this._toggleCollapse(false));
      }),
      el88
    );
  }
  ['_applyImagePlacement'](el90, value73) {
    if (!el90) return;
    const clamp012 = clamp01(value73?.focusX),
      clamp013 = clamp01(value73?.focusY),
      collageImageScale2 = normalizeCollageImageScale(value73?.imageScale);
    ((el90.style.objectPosition = clamp012 * 100 + '% ' + clamp013 * 100 + '%'),
      (el90.style.transform = 'scale(' + collageImageScale2 + ')'),
      (el90.style.transformOrigin = clamp012 * 100 + '% ' + clamp013 * 100 + '%'));
  }
  ['_createDividerLayer'](value74, value75) {
    const el91 = document.createElement('div');
    el91.className = 'collage-divider-layer';
    for (const value76 of resolveCollageEditableDividers(this._data)) {
      const el92 = document.createElement('button');
      ((el92.type = 'button'),
        (el92.className =
          'collage-divider-handle ' + (value76.axis === 'x' ? 'is-vertical' : 'is-horizontal')),
        el92.setAttribute('aria-label', collageText('preview.dividerAria')),
        el92.addEventListener('pointerdown', (value77) => this._beginDividerDrag(value77, value76)),
        this._applyDividerHandleGeometry(el92, value76, value74, value75),
        el91.appendChild(el92));
    }
    return el91;
  }
  ['_applyDividerHandleGeometry'](
    el93,
    enabled12,
    toPositiveNumber6 = toPositiveNumber(this._data.width, 1),
    toPositiveNumber7 = toPositiveNumber(this._data.height, 1),
  ) {
    if (!el93 || !enabled12) return;
    const { outerPadding: outerPadding2 } = getCollageLayoutStyle(this._data),
      value78 = Math.min(
        outerPadding2,
        Math.max(0, toPositiveNumber6 * 0.45),
        Math.max(0, toPositiveNumber7 * 0.45),
      ),
      value79 = Math.max(1, toPositiveNumber6 - value78 * 2),
      value80 = Math.max(1, toPositiveNumber7 - value78 * 2),
      value81 = value79 / toPositiveNumber6,
      value82 = value80 / toPositiveNumber7;
    if (enabled12.axis === 'x') {
      const value83 = value78 + (Number(enabled12.position) || 0) * value81,
        value84 = value78 + (Number(enabled12.spanStart) || 0) * value82,
        value85 = value78 + (Number(enabled12.spanEnd) || 0) * value82;
      ((el93.style.left =
        'calc(' + (value83 / toPositiveNumber6) * 100 + '% - var(--collage-divider-hit-offset))'),
        (el93.style.top = (value84 / toPositiveNumber7) * 100 + '%'),
        (el93.style.width = 'var(--collage-divider-hit-size)'),
        (el93.style.height = (Math.max(1, value85 - value84) / toPositiveNumber7) * 100 + '%'));
    } else {
      const value86 = value78 + (Number(enabled12.position) || 0) * value82,
        value87 = value78 + (Number(enabled12.spanStart) || 0) * value81,
        value88 = value78 + (Number(enabled12.spanEnd) || 0) * value81;
      ((el93.style.left = (value87 / toPositiveNumber6) * 100 + '%'),
        (el93.style.top =
          'calc(' + (value86 / toPositiveNumber7) * 100 + '% - var(--collage-divider-hit-offset))'),
        (el93.style.width = (Math.max(1, value88 - value87) / toPositiveNumber6) * 100 + '%'),
        (el93.style.height = 'var(--collage-divider-hit-size)'));
    }
  }
  ['_getItemsCopy']() {
    return (Array.isArray(this._data.items) ? this._data.items : []).map((args2) => ({ ...args2 }));
  }
  ['_setItemAt'](count11, value89) {
    const items3 = this._getItemsCopy();
    if (count11 < 0 || count11 >= items3.length) return null;
    return ((items3[count11] = value89), (this._data = { ...this._data, items: items3 }), items3);
  }
  ['_commitItems']({ commitHistory: commitHistory = true } = {}) {
    this._itemsCommitTimer && (clearTimeout(this._itemsCommitTimer), (this._itemsCommitTimer = null));
    const items4 = this._getItemsCopy();
    ((this._previewSignature = this._getPreviewSignature()),
      appStore.updateNodeData(this.id, { items: items4 }));
    if (commitHistory) commit();
  }
  ['_scheduleItemsCommit']() {
    if (this._itemsCommitTimer) clearTimeout(this._itemsCommitTimer);
    this._itemsCommitTimer = setTimeout(() => {
      ((this._itemsCommitTimer = null), this._commitItems());
    }, 160);
  }
  ['_getTileByIndex'](value90) {
    return this.el.querySelector('.collage-item[data-collage-slot-index="' + value90 + '"]');
  }
  ['_applyTileGeometry'](value91, value92 = null) {
    const el94 = this._getTileByIndex(value91);
    if (!el94) return;
    const list8 = Array.isArray(value92) ? value92 : resolveCollageItemFrames(this._data),
      enabled13 = list8.find((item10) => item10.index === value91);
    if (!enabled13) return;
    const toPositiveNumber8 = toPositiveNumber(this._data.width, 1),
      toPositiveNumber9 = toPositiveNumber(this._data.height, 1),
      { frame: frame4 } = enabled13;
    ((el94.style.left = (frame4.x / toPositiveNumber8) * 100 + '%'),
      (el94.style.top = (frame4.y / toPositiveNumber9) * 100 + '%'),
      (el94.style.width = (frame4.width / toPositiveNumber8) * 100 + '%'),
      (el94.style.height = (frame4.height / toPositiveNumber9) * 100 + '%'));
  }
  ['_applyTileImagePlacement'](value93) {
    const el95 = this._getTileByIndex(value93),
      value94 = el95?.querySelector?.('.collage-item-img'),
      value95 = (this._data.items || [])[value93];
    this._applyImagePlacement(value94, value95);
  }
  ['_collectSlotHitRects']({ excludeIndex: excludeIndex = -1 } = {}) {
    const list9 = Array.from(this.el.querySelectorAll('.collage-item'));
    return list9
      .map((el96) => {
        const slotIndex = Number(el96.dataset.collageSlotIndex);
        if (!Number.isInteger(slotIndex) || slotIndex === excludeIndex) return null;
        const left = el96.getBoundingClientRect?.();
        if (!left) return null;
        return {
          slotIndex: slotIndex,
          left: left.left,
          top: left.top,
          right: left.right,
          bottom: left.bottom,
        };
      })
      .filter(Boolean);
  }
  ['_getSlotIndexAtClientPoint'](
    value96,
    value97,
    { excludeIndex: excludeIndex = -1, slotHitRects: slotHitRects = null } = {},
  ) {
    if (!Number.isFinite(value96) || !Number.isFinite(value97)) return -1;
    const list10 = Array.isArray(slotHitRects)
      ? slotHitRects
      : this._collectSlotHitRects({ excludeIndex: excludeIndex });
    for (let count12 = list10.length - 1; count12 >= 0; count12 -= 1) {
      const box7 = list10[count12];
      if (!box7 || box7.slotIndex === excludeIndex) continue;
      if (value96 >= box7.left && value96 <= box7.right && value97 >= box7.top && value97 <= box7.bottom)
        return box7.slotIndex;
    }
    return -1;
  }
  ['_swapImageItemIntoSlot'](value98, value99) {
    const items5 = buildCollageItemSwapPatch(this._data, value98, value99);
    if (!items5) return false;
    return (
      (this._data = { ...this._data, items: items5.items }),
      this._syncPreviewLayer(),
      this._commitItems(),
      true
    );
  }
  ['_createImageDragGhost'](el97, response, value100, value101, { hidden: hidden = false } = {}) {
    if (typeof document === 'undefined' || !document.body || !el97) return null;
    const box8 = el97.getBoundingClientRect?.(),
      objectFit = resolveCollageItemSourceImage(response),
      value102 = el97.querySelector('.collage-item-img'),
      toPositiveNumber10 = toPositiveNumber(value102?.naturalWidth, 0),
      toPositiveNumber11 = toPositiveNumber(value102?.naturalHeight, 0),
      width = (objectFit.hasIntrinsicSize ? objectFit.width : 0) || toPositiveNumber10,
      height = (objectFit.hasIntrinsicSize ? objectFit.height : 0) || toPositiveNumber11,
      count13 = width > 0 && height > 0 ? width / height : 0,
      value103 = Math.max(1, Math.round(Number(box8?.width) || 1)),
      value104 = Math.max(1, Math.round(Number(box8?.height) || 1)),
      value105 = typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
      toPositiveNumber12 = toPositiveNumber(value105?.viewport?.zoom, 1),
      toPositiveNumber13 = toPositiveNumber(response?.sourceDisplayWidth, 0),
      toPositiveNumber14 = toPositiveNumber(response?.sourceDisplayHeight, 0);
    let width2 = value103,
      height2 = value104;
    if (toPositiveNumber13 > 0 && toPositiveNumber14 > 0)
      ((width2 = Math.max(1, Math.round(toPositiveNumber13 * toPositiveNumber12))),
        (height2 = Math.max(1, Math.round(toPositiveNumber14 * toPositiveNumber12))));
    else {
      if (count13 > 0) {
        const box9 = resolveCollageSizeByShortSide({
          width: width,
          height: height,
          shortSide: Math.min(value103, value104),
        });
        ((width2 = box9.width), (height2 = box9.height));
      }
    }
    const el98 = document.createElement('div');
    ((el98.className = 'v2-ghost-image collage-drag-ghost'),
      Object.assign(el98.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: width2 + 'px',
        height: height2 + 'px',
        transform: 'translate(' + value100 + 'px, ' + value101 + 'px) translate(-50%, -50%)',
        opacity: hidden ? '0' : '0.9',
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: 'none',
        zIndex: '10000',
        borderRadius: '8px',
        border: 'none',
        boxShadow: '0 0 0 2px var(--white-80), 0 0 30px 0 var(--white-40), 0 12px 40px var(--black-60)',
        overflow: 'hidden',
        willChange: 'transform, opacity',
        transition: 'none',
        background: 'var(--bg-node)',
      }));
    const el99 =
        objectFit.src || objectFit.localPath
          ? document.createElement('img')
          : value102?.cloneNode(false) || document.createElement('img'),
      value106 =
        objectFit.src ||
        (objectFit.localPath ? '/' + String(objectFit.localPath).replace(/^\/+/, '') : '') ||
        String(response?.url || '').trim() ||
        (response?.localPath ? '/' + String(response.localPath).replace(/^\/+/, '') : '') ||
        String(response?.sourceUrl || '').trim();
    return (
      value106 && el99.setAttribute('src', value106),
      Object.assign(el99.style, {
        width: '100%',
        height: '100%',
        objectFit: objectFit.isOriginalSource ? 'contain' : 'cover',
        display: 'block',
        pointerEvents: 'none',
        transition: 'none',
      }),
      el98.appendChild(el99),
      document.body.appendChild(el98),
      el98
    );
  }
  ['_ensureImageDragGhost'](enabled14, event31, value107 = {}) {
    if (!enabled14 || enabled14.ghostEl) return enabled14?.ghostEl || null;
    const value108 = (this._data.items || [])[enabled14.index];
    return (
      (enabled14.ghostEl = this._createImageDragGhost(
        enabled14.tile,
        value108,
        Number(event31?.clientX) || enabled14.startClientX,
        Number(event31?.clientY) || enabled14.startClientY,
        value107,
      )),
      enabled14.ghostEl
    );
  }
  ['_activateImageDragGhost'](value109, value110, { markSource: markSource = false } = {}) {
    const el100 = this._ensureImageDragGhost(value109, value110);
    if (!el100) return null;
    return (
      (value109.ghostActive = true),
      (el100.style.visibility = 'visible'),
      (el100.style.opacity = '0.9'),
      (el100.style.transition = 'none'),
      value109.tile?.classList?.toggle('is-drag-source', markSource),
      el100
    );
  }
  ['_moveImageDragGhost'](enabled15, value111, value112) {
    if (!enabled15?.ghostEl) return;
    enabled15.ghostEl.style.transform =
      'translate(' + value111 + 'px, ' + value112 + 'px) translate(-50%, -50%)';
  }
  ['_removeImageDragGhost'](value113, { fade: fade = false } = {}) {
    const el101 = value113?.ghostEl || null;
    if (!el101) return;
    (fade
      ? ((el101.style.transition = 'opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)'),
        (el101.style.opacity = '0'),
        setTimeout(() => el101.remove(), 160))
      : el101.remove(),
      value113 &&
        ((value113.ghostEl = null),
        (value113.ghostActive = false),
        value113.tile?.classList?.remove('is-drag-source')));
  }
  ['_removeImageDragGhostWhenSourceReady'](ghostEl, enabled16) {
    if (!ghostEl) return;
    const run2 = () => this._removeImageDragGhost({ ghostEl: ghostEl });
    if (typeof document === 'undefined' || !enabled16) {
      run2();
      return;
    }
    const run3 =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (value114) => setTimeout(value114, 16),
      handler5 = () =>
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now(),
      count14 = handler5();
    let count15 = 0;
    const value115 = () => {
      const el102 = document.getElementById?.(enabled16),
        el103 = el102?.querySelector?.('img.node-img'),
        value116 =
          !!el103 &&
          el103.style.display !== 'none' &&
          el103.complete === true &&
          Number(el103.naturalWidth || 0) > 0;
      if (value116) {
        count15 += 1;
        if (count15 >= 2) {
          run2();
          return;
        }
      } else count15 = 0;
      if (handler5() - count14 > 1200) {
        run2();
        return;
      }
      run3(value115);
    };
    run3(value115);
  }
  ['_beginImageDrag'](event32, index5) {
    if (!this._isEditing) return;
    if (event32.target?.closest?.('.collage-divider-handle')) return;
    (event32.preventDefault(), event32.stopPropagation());
    const enabled17 = (this._data.items || [])[index5];
    if (!enabled17 || isCollageItemEmpty(enabled17)) return;
    this._endImageDrag({ shouldCommit: false });
    const tile = this._getTileByIndex(index5),
      boardRect = this._boardEl?.getBoundingClientRect?.(),
      tileRect = tile?.getBoundingClientRect?.();
    if (!tile || !boardRect || !tileRect) return;
    const onMove = (value117) => this._updateImageDrag(value117),
      onEnd = (event33) => this._endImageDrag({ event: event33 });
    ((this._activeImageDrag = {
      index: index5,
      tile: tile,
      boardRect: boardRect,
      tileRect: tileRect,
      startClientX: Number(event32.clientX) || 0,
      startClientY: Number(event32.clientY) || 0,
      startFocusX: clamp01(enabled17.focusX),
      startFocusY: clamp01(enabled17.focusY),
      imageScale: normalizeCollageImageScale(enabled17.imageScale),
      slotHitRects: this._collectSlotHitRects({ excludeIndex: index5 }),
      moved: false,
      ghostEl: this._createImageDragGhost(
        tile,
        enabled17,
        Number(event32.clientX) || 0,
        Number(event32.clientY) || 0,
        { hidden: true },
      ),
      ghostActive: false,
      onMove: onMove,
      onEnd: onEnd,
    }),
      tile.classList.add('is-image-editing'));
    try {
      tile.setPointerCapture?.(event32.pointerId);
    } catch (value118) {}
    (document.addEventListener('pointermove', onMove),
      document.addEventListener('pointerup', onEnd, { once: true }),
      document.addEventListener('pointercancel', onEnd, { once: true }));
  }
  ['_updateImageDrag'](event34) {
    const excludeIndex2 = this._activeImageDrag;
    if (!excludeIndex2) return;
    event34.preventDefault?.();
    const value119 = Number(event34.clientX) || excludeIndex2.startClientX,
      value120 = Number(event34.clientY) || excludeIndex2.startClientY,
      value121 = value119 - excludeIndex2.startClientX,
      value122 = value120 - excludeIndex2.startClientY;
    if (Math.hypot(value121, value122) > 3) excludeIndex2.moved = true;
    const value123 = Math.hypot(value121, value122),
      value124 = this._isOutsideRect(value119, value120, excludeIndex2.tileRect, 2);
    if (
      excludeIndex2.ghostActive ||
      (excludeIndex2.moved && value123 > COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX && value124)
    ) {
      (this._activateImageDragGhost(excludeIndex2, event34, { markSource: true }),
        this._moveImageDragGhost(excludeIndex2, value119, value120));
      const value125 = this._getSlotIndexAtClientPoint(value119, value120, {
        excludeIndex: excludeIndex2.index,
        slotHitRects: excludeIndex2.slotHitRects,
      });
      this.highlightSlot(value125);
      return;
    }
    this.highlightSlot(-1);
    const value126 = Math.max(0.35, excludeIndex2.imageScale),
      focusX = clamp01(
        excludeIndex2.startFocusX - value121 / Math.max(1, excludeIndex2.tileRect.width) / value126,
      ),
      focusY = clamp01(
        excludeIndex2.startFocusY - value122 / Math.max(1, excludeIndex2.tileRect.height) / value126,
      ),
      items6 = Array.isArray(this._data.items) ? [...this._data.items] : [],
      args3 = items6[excludeIndex2.index];
    if (!args3) return;
    ((items6[excludeIndex2.index] = { ...args3, focusX: focusX, focusY: focusY }),
      (this._data = { ...this._data, items: items6 }),
      this._applyTileImagePlacement(excludeIndex2.index),
      this._applyImagePlacement(
        excludeIndex2.ghostEl?.querySelector?.('.collage-item-img, img'),
        items6[excludeIndex2.index],
      ));
  }
  ['_endImageDrag']({ event: event = null, shouldCommit: shouldCommit = true } = {}) {
    const excludeIndex3 = this._activeImageDrag;
    if (!excludeIndex3) return;
    (document.removeEventListener('pointermove', excludeIndex3.onMove),
      document.removeEventListener('pointerup', excludeIndex3.onEnd),
      document.removeEventListener('pointercancel', excludeIndex3.onEnd),
      excludeIndex3.tile?.classList?.remove('is-image-editing'),
      excludeIndex3.tile?.classList?.remove('is-drag-source'),
      this.highlightSlot(-1),
      (this._activeImageDrag = null));
    if (!shouldCommit) {
      this._removeImageDragGhost(excludeIndex3);
      return;
    }
    const value127 = Number(event?.clientX),
      value128 = Number(event?.clientY),
      value129 = Math.hypot(
        (Number.isFinite(value127) ? value127 : excludeIndex3.startClientX) - excludeIndex3.startClientX,
        (Number.isFinite(value128) ? value128 : excludeIndex3.startClientY) - excludeIndex3.startClientY,
      ),
      value130 =
        Number.isFinite(value127) && Number.isFinite(value128) && this._isOutsideBoard(value127, value128),
      count16 =
        excludeIndex3.ghostActive && Number.isFinite(value127) && Number.isFinite(value128)
          ? this._getSlotIndexAtClientPoint(value127, value128, {
              excludeIndex: excludeIndex3.index,
              slotHitRects: excludeIndex3.slotHitRects,
            })
          : -1;
    if (count16 >= 0 && count16 !== excludeIndex3.index) {
      this._removeImageDragGhost(excludeIndex3);
      if (this._swapImageItemIntoSlot(excludeIndex3.index, count16)) return;
    }
    if (excludeIndex3.moved && value129 > COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX && value130) {
      (this._activateImageDragGhost(excludeIndex3, event, { markSource: true }),
        this._moveImageDragGhost(excludeIndex3, value127, value128),
        excludeIndex3.tile?.classList?.remove('is-drag-source'),
        this._extractItemToSourceNode(excludeIndex3.index, value127, value128, excludeIndex3.ghostEl));
      return;
    }
    (this._removeImageDragGhost(excludeIndex3), this._commitItems());
  }
  ['_isOutsideRect'](value131, value132, box10, value133 = 0) {
    if (!box10) return false;
    const value134 = Math.max(0, Number(value133) || 0);
    return (
      value131 < box10.left - value134 ||
      value131 > box10.right + value134 ||
      value132 < box10.top - value134 ||
      value132 > box10.bottom + value134
    );
  }
  ['_isOutsideBoard'](value135, value136) {
    const value137 = this._boardEl?.getBoundingClientRect?.();
    return this._isOutsideRect(value135, value136, value137);
  }
  ['_handleItemWheel'](event35, value138) {
    if (!this._isEditing) return;
    const enabled18 = (this._data.items || [])[value138];
    if (!enabled18 || isCollageItemEmpty(enabled18)) return;
    (event35.preventDefault(), event35.stopPropagation());
    const collageImageScale3 = normalizeCollageImageScale(enabled18.imageScale),
      value139 = Math.exp(-(Number(event35.deltaY) || 0) * 0.0015),
      imageScale = normalizeCollageImageScale(collageImageScale3 * value139);
    if (Math.abs(imageScale - collageImageScale3) < 0.001) return;
    const items7 = Array.isArray(this._data.items) ? [...this._data.items] : [];
    ((items7[value138] = { ...items7[value138], imageScale: imageScale }),
      (this._data = { ...this._data, items: items7 }),
      this._applyTileImagePlacement(value138),
      this._scheduleItemsCommit());
  }
  ['_beginDividerDrag'](event36, divider) {
    if (!this._isEditing) return;
    (event36.preventDefault(), event36.stopPropagation());
    if (!divider) return;
    this._endDividerDrag({ shouldCommit: false });
    const boardRect2 = this._boardEl?.getBoundingClientRect?.();
    if (!boardRect2) return;
    const handle2 = event36.currentTarget,
      onMove2 = (value140) => this._updateDividerDrag(value140),
      onEnd2 = () => this._endDividerDrag();
    ((this._activeDividerDrag = {
      divider: divider,
      handle: handle2,
      startClientX: Number(event36.clientX) || 0,
      startClientY: Number(event36.clientY) || 0,
      startItems: this._getItemsCopy(),
      boardRect: boardRect2,
      onMove: onMove2,
      onEnd: onEnd2,
    }),
      handle2?.classList?.add('is-active'));
    try {
      event36.currentTarget?.setPointerCapture?.(event36.pointerId);
    } catch (value141) {}
    (document.addEventListener('pointermove', onMove2),
      document.addEventListener('pointerup', onEnd2, { once: true }),
      document.addEventListener('pointercancel', onEnd2, { once: true }));
  }
  ['_updateDividerDrag'](event37) {
    const items8 = this._activeDividerDrag;
    if (!items8) return;
    event37.preventDefault?.();
    const toPositiveNumber15 = toPositiveNumber(this._data.width, 1),
      toPositiveNumber16 = toPositiveNumber(this._data.height, 1),
      value142 =
        (((Number(event37.clientX) || 0) - items8.startClientX) / Math.max(1, items8.boardRect.width)) *
        toPositiveNumber15,
      value143 =
        (((Number(event37.clientY) || 0) - items8.startClientY) / Math.max(1, items8.boardRect.height)) *
        toPositiveNumber16,
      value144 = items8.divider.axis === 'x' ? value142 : value143,
      items9 = buildCollageDividerDragPatch(
        { ...this._data, items: items8.startItems },
        items8.divider,
        value144,
      );
    this._data = { ...this._data, items: items9.items };
    const collageItemFrames = resolveCollageItemFrames(this._data),
      value145 = Array.isArray(items9.moveIndexes)
        ? items9.moveIndexes
        : items9.items.map((item11, value146) => value146);
    for (const value147 of value145) {
      this._applyTileGeometry(value147, collageItemFrames);
    }
    this._applyDividerHandleGeometry(
      items8.handle,
      { ...items8.divider, position: (Number(items8.divider.position) || 0) + items9.delta },
      toPositiveNumber15,
      toPositiveNumber16,
    );
  }
  ['_endDividerDrag']({ shouldCommit: shouldCommit = true } = {}) {
    const enabled19 = this._activeDividerDrag;
    if (!enabled19) return;
    (document.removeEventListener('pointermove', enabled19.onMove),
      document.removeEventListener('pointerup', enabled19.onEnd),
      document.removeEventListener('pointercancel', enabled19.onEnd),
      enabled19.handle?.classList?.remove('is-active'),
      (this._activeDividerDrag = null));
    if (shouldCommit) this._commitItems();
  }
  ['_extractItemToSourceNode'](value148, value149, value150, el104 = null) {
    const fileName = (this._data.items || [])[value148];
    if (!fileName || isCollageItemEmpty(fileName)) {
      this._commitItems();
      return;
    }
    const value151 =
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
      value152 = value151?.viewport || { x: 0, y: 0, zoom: 1 },
      x2 = screenToWorld(value149, value150, value152),
      collageItemFrames2 = resolveCollageItemFrames(this._data).find((item12) => item12.index === value148),
      thumbLocalPath = resolveCollageItemSourceImage(fileName),
      value153 = this._getTileByIndex(value148)?.querySelector('.collage-item-img'),
      value154 = el104?.querySelector?.('img'),
      toPositiveNumber17 = toPositiveNumber(value153?.naturalWidth, 0),
      toPositiveNumber18 = toPositiveNumber(value153?.naturalHeight, 0),
      toPositiveNumber19 = toPositiveNumber(value154?.naturalWidth, 0),
      toPositiveNumber20 = toPositiveNumber(value154?.naturalHeight, 0),
      imageWidth =
        (thumbLocalPath.hasIntrinsicSize ? toPositiveNumber(thumbLocalPath.width, 0) : 0) ||
        toPositiveNumber17 ||
        toPositiveNumber19 ||
        toPositiveNumber(thumbLocalPath.width, 0) ||
        toPositiveNumber(collageItemFrames2?.frame?.width, fileName.width || 1),
      imageHeight =
        (thumbLocalPath.hasIntrinsicSize ? toPositiveNumber(thumbLocalPath.height, 0) : 0) ||
        toPositiveNumber18 ||
        toPositiveNumber20 ||
        toPositiveNumber(thumbLocalPath.height, 0) ||
        toPositiveNumber(collageItemFrames2?.frame?.height, fileName.height || 1),
      toPositiveNumber21 = toPositiveNumber(fileName?.sourceDisplayWidth, 0),
      toPositiveNumber22 = toPositiveNumber(fileName?.sourceDisplayHeight, 0),
      width3 =
        toPositiveNumber21 > 0 && toPositiveNumber22 > 0
          ? {
              width: Math.max(1, Math.round(toPositiveNumber21)),
              height: Math.max(1, Math.round(toPositiveNumber22)),
            }
          : getAutoMediaSizeByShortSide(imageWidth, imageHeight),
      id2 = generateId('source-image'),
      localPath = thumbLocalPath.localPath,
      src = thumbLocalPath.src || (localPath ? '/' + localPath.replace(/^\/+/, '') : '');
    if (!src && !localPath) return;
    const items10 = this._getItemsCopy();
    ((items10[value148] = normalizeEmptyCollageItem(fileName, value148)),
      (this._data = { ...this._data, items: items10 }));
    const run4 = () => {
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: id2,
          type: 'source-image',
          src: src,
          localPath: localPath,
          thumbLocalPath: thumbLocalPath.isOriginalSource ? '' : fileName.thumbLocalPath || '',
          sourceLocalPath: '',
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          imageWidth: imageWidth,
          imageHeight: imageHeight,
          x: x2.x - width3.width / 2,
          y: x2.y - width3.height / 2,
          width: width3.width,
          height: width3.height,
          fileName: fileName.fileName || '',
          name: fileName.label || collageText('preview.imageAlt'),
          fixedSize: true,
          needsAutoResize: false,
        }),
      ),
        appStore.updateNodeData(this.id, { items: items10 }),
        appStore.setSelectedNodes([id2]));
    };
    if (typeof appStore.batch === 'function') appStore.batch(run4);
    else run4();
    (commit(), window._triggerLocalCacheSave?.(), this._removeImageDragGhostWhenSourceReady(el104, id2));
  }
  ['_resolveItemLocalPath'](response2) {
    const enabled20 =
      String(response2?.localPath || '').trim() ||
      String(response2?.sourceLocalPath || '').trim() ||
      String(response2?.thumbLocalPath || '').trim() ||
      (String(response2?.url || '').startsWith('/') ? String(response2.url).trim() : '');
    if (!enabled20 || /^(?:https?:|blob:|data:)/i.test(enabled20)) return '';
    return enabled20.replace(/^\/+/, '');
  }
  async ['_renderCollageOutput'](value155) {
    const list11 = resolveCollageItemFrames(this._data).filter(
      ({ item: item13 }) => !isCollageItemEmpty(item13),
    );
    if (list11.length === 0) throw new Error(collageText('errors.emptyCollage'));
    const resolution = getCollageExportResolution(value155),
      box11 = resolveCollageExportSize(this._data, resolution.longSide),
      width4 = document.createElement('canvas');
    ((width4.width = box11.width), (width4.height = box11.height));
    const ctx4 = width4.getContext('2d');
    if (!ctx4) throw new Error(collageText('errors.canvasCreateFailed'));
    const collageBackgroundColor2 = normalizeCollageBackgroundColor(this._data.backgroundColor),
      isCollageBackgroundTransparent2 = isCollageBackgroundTransparent(collageBackgroundColor2),
      value156 = isCollageBackgroundTransparent2
        ? ''
        : resolveCssColorValue(collageBackgroundColor2) || getDocumentCssVar('--white');
    !isCollageBackgroundTransparent2 &&
      value156 &&
      ((ctx4.fillStyle = value156), ctx4.fillRect(0, 0, width4.width, width4.height));
    const toPositiveNumber23 = toPositiveNumber(this._data.width, 1),
      toPositiveNumber24 = toPositiveNumber(this._data.height, 1),
      value157 = width4.width / toPositiveNumber23,
      value158 = width4.height / toPositiveNumber24,
      value159 = Math.min(value157, value158),
      { cornerRadius: cornerRadius5 } = getCollageLayoutStyle(this._data);
    let count17 = 0;
    const value160 = await Promise.all(
      list11.map(async ({ item: item14, frame: frame5, index: index6 }) => {
        try {
          const collageItemPreviewUrl2 = resolveCollageItemPreviewUrl(item14),
            img = this._getTileByIndex(index6)?.querySelector?.('.collage-item-img');
          if (img?.complete === true && Number(img.naturalWidth || 0) > 0)
            return { item: item14, frame: frame5, img: img };
          if (!collageItemPreviewUrl2) return null;
          const img2 = await loadImage(collageItemPreviewUrl2);
          return { item: item14, frame: frame5, img: img2 };
        } catch (value161) {
          return (console.warn('[CollageNode] skip image:', value161), null);
        }
      }),
    );
    for (const enabled21 of value160) {
      if (!enabled21) continue;
      const { item: item15, frame: frame6, img: img3 } = enabled21,
        value162 = {
          x: Math.round(frame6.x * value157),
          y: Math.round(frame6.y * value158),
          width: Math.max(1, Math.round(frame6.width * value157)),
          height: Math.max(1, Math.round(frame6.height * value158)),
        };
      drawRoundedImageCover(
        ctx4,
        img3,
        value162,
        cornerRadius5 * value159,
        item15.focusX,
        item15.focusY,
        item15.imageScale,
      ) && (count17 += 1);
    }
    if (count17 === 0) throw new Error(collageText('errors.nothingDrawn'));
    const mimeType = isCollageBackgroundTransparent2 ? 'image/png' : 'image/jpeg',
      extension = isCollageBackgroundTransparent2 ? 'png' : 'jpg',
      blob = await canvasToBlob(width4, mimeType, isCollageBackgroundTransparent2 ? undefined : 0.92),
      generateId2 = generateId('collage'),
      fileName2 = 'collage_' + generateId2 + '.' + extension;
    return {
      blob: blob,
      mimeType: mimeType,
      extension: extension,
      fileName: fileName2,
      resolution: resolution,
      width: width4.width,
      height: width4.height,
    };
  }
  async ['_saveCollageOutput'](type) {
    const file = new File([type.blob], type.fileName, { type: type.mimeType }),
      saved = await saveOutputBlob(file, { ext: type.extension }),
      localPath2 = String(saved.localPath || saved.path || '').replace(/^\//, ''),
      srcUrl = String(saved.url || '').trim() || (localPath2 ? '/' + localPath2 : '');
    return { saved: saved, localPath: localPath2, srcUrl: srcUrl };
  }
  ['_resolveCompositeNodePosition'](box12) {
    const value163 =
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
      value164 = value163?.nodes || {},
      value165 = value164[this.id] || this._data;
    return calcSafeSpawnPosNearNode(value164, value165, box12.width, box12.height);
  }
  ['_createCompositeSourceNode'](naturalWidth, src2) {
    const width5 = getAutoMediaSizeByShortSide(naturalWidth.width, naturalWidth.height),
      x3 = this._resolveCompositeNodePosition(width5),
      id3 = generateId('node');
    return buildSourceMediaNodePayload({
      id: id3,
      type: 'source-image',
      x: x3.x,
      y: x3.y,
      width: width5.width,
      height: width5.height,
      naturalWidth: naturalWidth.width,
      naturalHeight: naturalWidth.height,
      src: src2.srcUrl,
      localPath: src2.localPath,
      fileName: src2.saved?.filename || naturalWidth.fileName,
      name: collageText('output.name', { resolution: naturalWidth.resolution.label }),
      needsAutoResize: false,
    });
  }
  ['_addCompositeSourceNode'](value166, value167) {
    const value168 = this._createCompositeSourceNode(value166, value167),
      handler6 = () => {
        (appStore.addNode(value168), appStore.setSelectedNodes([value168.id]));
      };
    if (typeof appStore.batch === 'function') appStore.batch(handler6);
    else handler6();
    return (
      commit(),
      window._triggerLocalCacheSave?.(),
      window.v2FocusOnNodes && requestAnimationFrame(() => window.v2FocusOnNodes([this.id, value168.id])),
      value168
    );
  }
  async ['_composeCollage'](value169, value170 = null) {
    if (this._isExporting || this._isCompositing) return;
    ((this._isCompositing = true), this._closeMenus());
    const value171 = this._setComposeButtonBusy(value170 || this.el.querySelector('.collage-compose-btn')),
      handler7 = (enabled22) => {
        if (!enabled22) return;
        setTimeout(() => revokeBlobObjectUrl(enabled22), 4000);
      };
    try {
      const filename = await this._renderCollageOutput(value169),
        srcUrl2 = createBlobObjectUrl(filename.blob);
      if (srcUrl2) {
        const value172 = this._addCompositeSourceNode(filename, {
          saved: { filename: filename.fileName },
          localPath: '',
          srcUrl: srcUrl2,
        });
        try {
          const src3 = await this._saveCollageOutput(filename);
          (appStore.updateNodeData(value172.id, {
            src: src3.srcUrl,
            localPath: src3.localPath,
            fileName: src3.saved?.filename || filename.fileName,
          }),
            window._triggerLocalCacheSave?.(),
            handler7(srcUrl2),
            window.showToast?.(collageText('compose.created'), 'success'));
        } catch (value173) {
          (console.error('[CollageNode] compose save failed:', value173),
            window.showToast?.(collageText('compose.saveFailed'), 'warning'));
        }
        return;
      }
      const value174 = await this._saveCollageOutput(filename);
      (this._addCompositeSourceNode(filename, value174),
        window.showToast?.(collageText('compose.created'), 'success'));
    } catch (error) {
      (console.error('[CollageNode] compose failed:', error),
        window.showToast?.(error?.message || collageText('errors.composeFailed'), 'error'));
    } finally {
      ((this._isCompositing = false), value171?.(), this._syncToolbarState());
    }
  }
  async ['_exportCollage'](value175) {
    if (this._isExporting || this._isCompositing) return;
    ((this._isExporting = true), this._closeMenus(), this._syncToolbarState());
    try {
      const value176 = await this._renderCollageOutput(value175);
      (await this._saveCollageOutput(value176),
        window.showToast?.(collageText('export.exported'), 'success'));
    } catch (error2) {
      (console.error('[CollageNode] export failed:', error2),
        window.showToast?.(error2?.message || collageText('errors.exportFailed'), 'error'));
    } finally {
      ((this._isExporting = false), this._syncToolbarState());
    }
  }
}
