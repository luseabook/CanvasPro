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
function collageText(_0x3020f5, _0x44ccd7 = {}) {
  return t('collageNode.' + _0x3020f5, _0x44ccd7);
}
function collageTextOrFallback(_0x348f57, _0x2065f5, _0x39d3ce = {}) {
  const _0x26fd8c = 'collageNode.' + _0x348f57,
    _0x42aa09 = t(_0x26fd8c, _0x39d3ce);
  return _0x42aa09 === _0x26fd8c ? _0x2065f5 : _0x42aa09;
}
function getCollagePresetLabel(_0x390187) {
  if (!_0x390187) return '';
  return collageTextOrFallback('layouts.' + _0x390187.id, _0x390187.label || '');
}
function getCollageBackgroundLabel(_0x44cc75) {
  if (!_0x44cc75) return '';
  return collageTextOrFallback('backgrounds.' + _0x44cc75.id, _0x44cc75.label || '');
}
function toPositiveNumber(_0x25ff80, _0x424543 = 0) {
  const _0x8432c7 = Number(_0x25ff80);
  return Number.isFinite(_0x8432c7) && _0x8432c7 > 0 ? _0x8432c7 : _0x424543;
}
function clamp01(_0x49b546, _0x6d251d = 0.5) {
  const _0x5513de = Number(_0x49b546);
  if (!Number.isFinite(_0x5513de)) return _0x6d251d;
  return Math.min(1, Math.max(0, _0x5513de));
}
function createSvgIcon(_0x5b0292) {
  const _0x208093 = 'http://www.w3.org/2000/svg',
    _0xd34664 = document.createElementNS(_0x208093, 'svg');
  (_0xd34664.setAttribute('width', '16'),
    _0xd34664.setAttribute('height', '16'),
    _0xd34664.setAttribute('viewBox', '0 0 24 24'),
    _0xd34664.setAttribute('fill', 'none'),
    _0xd34664.setAttribute('stroke', 'currentColor'),
    _0xd34664.setAttribute('stroke-width', '2'),
    _0xd34664.setAttribute('stroke-linecap', 'round'),
    _0xd34664.setAttribute('stroke-linejoin', 'round'));
  for (const _0x578032 of _0x5b0292) {
    const _0x2fe60f = document.createElementNS(_0x208093, 'path');
    (_0x2fe60f.setAttribute('d', _0x578032), _0xd34664.appendChild(_0x2fe60f));
  }
  return _0xd34664;
}
function canvasToBlob(_0x3b1f54, _0x22a0df, _0x3911c3) {
  return new Promise((_0x544992, _0x3db43d) => {
    _0x3b1f54.toBlob(
      (_0x5cd78b) => {
        if (_0x5cd78b) _0x544992(_0x5cd78b);
        else _0x3db43d(new Error(collageText('errors.exportBlobFailed')));
      },
      _0x22a0df,
      _0x3911c3,
    );
  });
}
function loadImage(_0x51be0e) {
  const _0x1314f3 = String(_0x51be0e || '').trim();
  if (!_0x1314f3) return Promise.reject(new Error(collageText('errors.emptyImageUrl')));
  const _0x349c2d = collageImageLoadCache.get(_0x1314f3);
  if (_0x349c2d)
    return (
      collageImageLoadCache.delete(_0x1314f3),
      collageImageLoadCache.set(_0x1314f3, _0x349c2d),
      _0x349c2d
    );
  const _0x4da37b = new Promise((_0x430e2b, _0x10a675) => {
    const _0xcc318c = new Image();
    ((_0xcc318c.crossOrigin = 'anonymous'),
      (_0xcc318c.onload = () => {
        typeof _0xcc318c.decode === 'function'
          ? _0xcc318c
              .decode()
              .catch(() => {})
              .finally(() => _0x430e2b(_0xcc318c))
          : _0x430e2b(_0xcc318c);
      }),
      (_0xcc318c.onerror = () => {
        (collageImageLoadCache.delete(_0x1314f3),
          _0x10a675(new Error(collageText('errors.imageLoadFailed'))));
      }),
      (_0xcc318c.src = _0x1314f3));
  });
  collageImageLoadCache.set(_0x1314f3, _0x4da37b);
  while (collageImageLoadCache.size > COLLAGE_IMAGE_LOAD_CACHE_LIMIT) {
    const _0x41b06f = collageImageLoadCache.keys().next().value;
    collageImageLoadCache.delete(_0x41b06f);
  }
  return _0x4da37b;
}
function drawImageCover(
  _0x465265,
  _0x15bc56,
  _0x2a637d,
  _0x46fdac,
  _0x20dad4,
  _0x4a0c63,
  _0x510d49,
  _0x7d9a5d,
  _0x1f42b0 = 1,
) {
  const _0x2c1b1c = _0x15bc56.naturalWidth || _0x15bc56.width,
    _0x12c9ff = _0x15bc56.naturalHeight || _0x15bc56.height;
  if (!(_0x2c1b1c > 0 && _0x12c9ff > 0 && _0x20dad4 > 0 && _0x4a0c63 > 0)) return false;
  const _0x3c98d9 = _0x20dad4 / _0x4a0c63,
    _0x34d025 = _0x2c1b1c / _0x12c9ff,
    _0x127fd4 = normalizeCollageImageScale(_0x1f42b0);
  let _0x581310 = 0,
    _0x2e9bed = 0,
    _0x1246b9 = _0x2c1b1c,
    _0x159884 = _0x12c9ff;
  return (
    _0x34d025 > _0x3c98d9
      ? ((_0x1246b9 = (_0x12c9ff * _0x3c98d9) / _0x127fd4),
        (_0x159884 = _0x12c9ff / _0x127fd4),
        (_0x581310 = (_0x2c1b1c - _0x1246b9) * clamp01(_0x510d49)),
        (_0x2e9bed = (_0x12c9ff - _0x159884) * clamp01(_0x7d9a5d)))
      : ((_0x1246b9 = _0x2c1b1c / _0x127fd4),
        (_0x159884 = _0x2c1b1c / _0x3c98d9 / _0x127fd4),
        (_0x581310 = (_0x2c1b1c - _0x1246b9) * clamp01(_0x510d49)),
        (_0x2e9bed = (_0x12c9ff - _0x159884) * clamp01(_0x7d9a5d))),
    _0x465265.drawImage(
      _0x15bc56,
      _0x581310,
      _0x2e9bed,
      _0x1246b9,
      _0x159884,
      _0x2a637d,
      _0x46fdac,
      _0x20dad4,
      _0x4a0c63,
    ),
    true
  );
}
function drawRoundedRectPath(_0xc0c2ec, _0x526e41, _0x3ee334, _0x228d27, _0x567776, _0x92f0e3) {
  const _0x5c053a = Math.max(0, Math.min(_0x92f0e3, _0x228d27 / 2, _0x567776 / 2));
  _0xc0c2ec.beginPath();
  if (typeof _0xc0c2ec.roundRect === 'function') {
    _0xc0c2ec.roundRect(_0x526e41, _0x3ee334, _0x228d27, _0x567776, _0x5c053a);
    return;
  }
  (_0xc0c2ec.moveTo(_0x526e41 + _0x5c053a, _0x3ee334),
    _0xc0c2ec.lineTo(_0x526e41 + _0x228d27 - _0x5c053a, _0x3ee334),
    _0xc0c2ec.quadraticCurveTo(
      _0x526e41 + _0x228d27,
      _0x3ee334,
      _0x526e41 + _0x228d27,
      _0x3ee334 + _0x5c053a,
    ),
    _0xc0c2ec.lineTo(_0x526e41 + _0x228d27, _0x3ee334 + _0x567776 - _0x5c053a),
    _0xc0c2ec.quadraticCurveTo(
      _0x526e41 + _0x228d27,
      _0x3ee334 + _0x567776,
      _0x526e41 + _0x228d27 - _0x5c053a,
      _0x3ee334 + _0x567776,
    ),
    _0xc0c2ec.lineTo(_0x526e41 + _0x5c053a, _0x3ee334 + _0x567776),
    _0xc0c2ec.quadraticCurveTo(
      _0x526e41,
      _0x3ee334 + _0x567776,
      _0x526e41,
      _0x3ee334 + _0x567776 - _0x5c053a,
    ),
    _0xc0c2ec.lineTo(_0x526e41, _0x3ee334 + _0x5c053a),
    _0xc0c2ec.quadraticCurveTo(_0x526e41, _0x3ee334, _0x526e41 + _0x5c053a, _0x3ee334));
}
function drawRoundedImageCover(_0xca1bfd, _0x25ddd6, _0x357545, _0x5832d2, _0x463efb, _0x2c92b5, _0x2b7c77) {
  _0x5832d2 > 0 &&
    (_0xca1bfd.save(),
    drawRoundedRectPath(_0xca1bfd, _0x357545.x, _0x357545.y, _0x357545.width, _0x357545.height, _0x5832d2),
    _0xca1bfd.clip());
  const _0x42d76 = drawImageCover(
    _0xca1bfd,
    _0x25ddd6,
    _0x357545.x,
    _0x357545.y,
    _0x357545.width,
    _0x357545.height,
    _0x463efb,
    _0x2c92b5,
    _0x2b7c77,
  );
  if (_0x5832d2 > 0) _0xca1bfd.restore();
  return _0x42d76;
}
function getDocumentCssVar(_0x3ac03c) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(_0x3ac03c).trim();
  } catch {
    return '';
  }
}
function resolveCssColorValue(_0x561ed2) {
  const _0x163aef = normalizeCollageBackgroundColor(_0x561ed2);
  if (isCollageBackgroundTransparent(_0x163aef)) return 'transparent';
  const _0x6fc13d = _0x163aef.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (_0x6fc13d) return getDocumentCssVar(_0x6fc13d[1]);
  return _0x163aef;
}
function createBlobObjectUrl(_0x474775) {
  const _0x400d98 = globalThis.URL || globalThis.window?.URL;
  if (!_0x474775 || typeof _0x400d98?.createObjectURL !== 'function') return '';
  try {
    return _0x400d98.createObjectURL(_0x474775);
  } catch (_0x856b33) {
    return '';
  }
}
function revokeBlobObjectUrl(_0x29d17c) {
  if (!_0x29d17c || !String(_0x29d17c).startsWith('blob:')) return;
  const _0x400a6d = globalThis.URL || globalThis.window?.URL;
  if (typeof _0x400a6d?.revokeObjectURL !== 'function') return;
  try {
    _0x400a6d.revokeObjectURL(_0x29d17c);
  } catch (_0x423a10) {}
}
export class CollageNode {
  constructor(_0xcbf38a) {
    ((this._data = _0xcbf38a && typeof _0xcbf38a === 'object' ? _0xcbf38a : {}),
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
    const _0x6dbca6 = document.createElement('div');
    _0x6dbca6.className = 'collage-board';
    const _0x456da7 = getCollageBackgroundOption(this._data.backgroundColor);
    return (
      (_0x6dbca6.dataset.collageBackground = _0x456da7.id),
      _0x6dbca6.addEventListener('dblclick', (_0x574c8e) => {
        (_0x574c8e.preventDefault(), _0x574c8e.stopPropagation(), this._toggleEdit(true));
      }),
      _0x6dbca6.appendChild(this._createPreviewLayer()),
      this.el.appendChild(_0x6dbca6),
      (this._boardEl = _0x6dbca6),
      (this._previewSignature = this._getPreviewSignature()),
      this.el
    );
  }
  ['update'](_0x1af8c9) {
    ((this._data = _0x1af8c9 && typeof _0x1af8c9 === 'object' ? _0x1af8c9 : {}),
      (this._isEditing = !!this._data.isEditing),
      (this._isCollapsed = !!this._data.isCollapsed));
    if (!this._boardEl || !this._toolbarEl) {
      this.mount();
      return;
    }
    (this._syncBoardBackground(), this._syncToolbarState());
    const _0x391b74 = this._getPreviewSignature();
    _0x391b74 !== this._previewSignature ? this._syncPreviewLayer() : this._syncEditingState();
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
  ['highlightSlot'](_0x16bef1) {
    const _0x44405c = Number(_0x16bef1),
      _0x1d56d9 = Number.isInteger(_0x44405c) && _0x44405c >= 0 ? _0x44405c : -1;
    if (this._highlightedSlotIndex === _0x1d56d9) return;
    const _0x1e717a = this._highlightedSlotIndex;
    this._highlightedSlotIndex = _0x1d56d9;
    _0x1e717a >= 0
      ? this._getTileByIndex(_0x1e717a)?.classList.remove('is-drop-highlight')
      : this.el
          .querySelectorAll('.collage-item.is-drop-highlight')
          .forEach((_0x3a6d05) => _0x3a6d05.classList.remove('is-drop-highlight'));
    if (_0x1d56d9 < 0) return;
    this._getTileByIndex(_0x1d56d9)?.classList.add('is-drop-highlight');
  }
  ['previewItems'](_0x1e1fba) {
    if (!Array.isArray(_0x1e1fba)) return;
    ((this._data = { ...this._data, items: _0x1e1fba }), this._syncPreviewLayer());
  }
  ['_getPreviewSignature'](_0x4481c7 = this._data) {
    const _0xe55a8b = getCollageLayoutStyle(_0x4481c7),
      _0x240733 = (Array.isArray(_0x4481c7?.items) ? _0x4481c7.items : []).map((_0x579959) => ({
        id: _0x579959?.id || '',
        slotIndex: _0x579959?.slotIndex ?? null,
        x: Number(_0x579959?.x) || 0,
        y: Number(_0x579959?.y) || 0,
        width: Number(_0x579959?.width) || 0,
        height: Number(_0x579959?.height) || 0,
        url: String(_0x579959?.url || ''),
        localPath: String(_0x579959?.localPath || ''),
        thumbLocalPath: String(_0x579959?.thumbLocalPath || ''),
        sourceLocalPath: String(_0x579959?.sourceLocalPath || ''),
        sourceUrl: String(_0x579959?.sourceUrl || ''),
        sourceDisplayWidth: Number(_0x579959?.sourceDisplayWidth) || 0,
        sourceDisplayHeight: Number(_0x579959?.sourceDisplayHeight) || 0,
        label: String(_0x579959?.label || ''),
        fit: String(_0x579959?.fit || ''),
        focusX: clamp01(_0x579959?.focusX),
        focusY: clamp01(_0x579959?.focusY),
        imageScale: normalizeCollageImageScale(_0x579959?.imageScale),
        isEmpty: !!_0x579959?.isEmpty,
      }));
    return JSON.stringify({
      width: toPositiveNumber(_0x4481c7?.width, 1),
      height: toPositiveNumber(_0x4481c7?.height, 1),
      outerPadding: _0xe55a8b.outerPadding,
      gap: _0xe55a8b.gap,
      cornerRadius: _0xe55a8b.cornerRadius,
      items: _0x240733,
    });
  }
  ['_createToolbar']() {
    const _0x55b51d = document.createElement('div');
    return (
      (_0x55b51d.className = 'node-floating-toolbar collage-toolbar'),
      _0x55b51d.appendChild(this._createAspectRatioPicker()),
      _0x55b51d.appendChild(this._createTemplatePicker()),
      _0x55b51d.appendChild(this._createToolbarDivider()),
      _0x55b51d.appendChild(this._createEditButton()),
      _0x55b51d.appendChild(this._createBackgroundColorPicker()),
      _0x55b51d.appendChild(
        this._createRangeControl({
          field: 'outerPadding',
          label: collageText('toolbar.outerPadding'),
          icon: ['M4 4h16v16H4z', 'M8 8h8v8H8z'],
        }),
      ),
      _0x55b51d.appendChild(
        this._createRangeControl({
          field: 'gap',
          label: collageText('toolbar.gap'),
          icon: ['M4 4h6v16H4z', 'M14 4h6v16h-6z'],
        }),
      ),
      _0x55b51d.appendChild(
        this._createRangeControl({
          field: 'cornerRadius',
          label: collageText('toolbar.cornerRadius'),
          icon: ['M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z'],
        }),
      ),
      _0x55b51d.appendChild(this._createCompositeButton()),
      _0x55b51d.appendChild(this._createExportButton()),
      _0x55b51d.appendChild(this._createCollapseButton()),
      _0x55b51d
    );
  }
  ['_createToolbarDivider']() {
    const _0x5e9f4f = document.createElement('span');
    return (
      (_0x5e9f4f.className = 'collage-toolbar-divider'),
      (_0x5e9f4f.textContent = '|'),
      _0x5e9f4f.setAttribute('aria-hidden', 'true'),
      _0x5e9f4f
    );
  }
  ['_createEditButton']() {
    const _0x32e26a = document.createElement('button');
    ((_0x32e26a.type = 'button'),
      (_0x32e26a.className = 'ftb-btn icon-only act-edit collage-edit-btn'),
      _0x32e26a.classList.toggle('active', this._isEditing));
    const _0x235d79 = this._isEditing ? collageText('toolbar.exitEdit') : collageText('toolbar.edit');
    return (
      (_0x32e26a.dataset.tooltip = _0x235d79),
      _0x32e26a.setAttribute('aria-label', _0x235d79),
      _0x32e26a.appendChild(
        createSvgIcon(['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z']),
      ),
      _0x32e26a.addEventListener('pointerdown', (_0x599483) => _0x599483.stopPropagation()),
      _0x32e26a.addEventListener('dblclick', (_0x4e1e5d) => _0x4e1e5d.stopPropagation()),
      _0x32e26a.addEventListener('click', (_0x362dd3) => {
        (_0x362dd3.stopPropagation(), this._toggleEdit(!this._isEditing));
      }),
      _0x32e26a
    );
  }
  ['_createAspectRatioPicker']() {
    const _0x1c872e = getCollageAspectRatioOption(this._data.aspectRatio),
      _0x58db0a = document.createElement('div');
    ((_0x58db0a.className = 'collage-ratio-wrap'),
      _0x58db0a.addEventListener('pointerdown', (_0x5c78f8) => _0x5c78f8.stopPropagation()));
    const _0x1eb37d = document.createElement('button');
    ((_0x1eb37d.type = 'button'),
      (_0x1eb37d.className = 'ftb-btn collage-ratio-trigger'),
      (_0x1eb37d.dataset.tooltip = collageText('ratio.tooltip')),
      _0x1eb37d.setAttribute('aria-label', collageText('ratio.tooltip')),
      _0x1eb37d.appendChild(createSvgIcon(['M4 6h16v12H4z'])));
    const _0x34e3e2 = document.createElement('span');
    ((_0x34e3e2.textContent = _0x1c872e?.label || collageText('ratio.fallback')),
      _0x1eb37d.appendChild(_0x34e3e2));
    const _0x583b88 = document.createElement('div');
    _0x583b88.className = 'collage-menu collage-ratio-menu';
    for (const _0x1eb626 of COLLAGE_ASPECT_RATIO_OPTIONS) {
      const _0x38d6e0 = document.createElement('button');
      ((_0x38d6e0.type = 'button'),
        (_0x38d6e0.className = 'collage-ratio-option'),
        (_0x38d6e0.dataset.collageRatio = _0x1eb626.label),
        _0x38d6e0.classList.toggle('is-active', _0x1eb626.label === _0x1c872e?.label),
        _0x38d6e0.setAttribute('aria-label', collageText('ratio.optionAria', { label: _0x1eb626.label })));
      const _0x21d88f = document.createElement('span');
      ((_0x21d88f.className = 'collage-ratio-mark'),
        (_0x21d88f.dataset.collageRatio = _0x1eb626.label),
        _0x38d6e0.appendChild(_0x21d88f));
      const _0x371d0d = document.createElement('span');
      ((_0x371d0d.textContent = _0x1eb626.label),
        _0x38d6e0.appendChild(_0x371d0d),
        _0x38d6e0.addEventListener('click', (_0x41ba1f) => {
          _0x41ba1f.stopPropagation();
          const _0x2be125 = buildCollageAspectRatioPatch(this._data, _0x1eb626.value);
          (appStore.updateNodeData(this.id, _0x2be125), commit());
        }),
        _0x583b88.appendChild(_0x38d6e0));
    }
    return (
      _0x1eb37d.addEventListener('click', (_0x4799fb) => {
        (_0x4799fb.stopPropagation(), this._toggleMenu(_0x583b88));
      }),
      this._registerMenu(_0x583b88, _0x58db0a, 'ratio'),
      _0x58db0a.appendChild(_0x1eb37d),
      _0x58db0a.appendChild(_0x583b88),
      _0x58db0a
    );
  }
  ['_createTemplatePicker']() {
    const _0x4051b0 = document.createElement('div');
    ((_0x4051b0.className = 'collage-grid-wrap'),
      _0x4051b0.addEventListener('pointerdown', (_0xe853a0) => _0xe853a0.stopPropagation()));
    const _0x30c52a = document.createElement('button');
    ((_0x30c52a.type = 'button'),
      (_0x30c52a.className = 'ftb-btn collage-grid-trigger'),
      (_0x30c52a.dataset.tooltip = collageText('templates.tooltip')),
      _0x30c52a.setAttribute('aria-label', collageText('templates.tooltip')),
      _0x30c52a.appendChild(createSvgIcon(['M3 3h18v18H3z', 'M3 11h18', 'M11 3v18'])));
    const _0xdbcb91 = document.createElement('span');
    ((_0xdbcb91.textContent = collageText('templates.label')), _0x30c52a.appendChild(_0xdbcb91));
    const _0x16e067 = document.createElement('div');
    _0x16e067.className = 'collage-menu collage-grid-menu';
    const _0x5de119 = document.createElement('div');
    _0x5de119.className = 'collage-grid-count-list';
    const _0x328b04 = document.createElement('div');
    ((_0x328b04.className = 'collage-template-panel'),
      _0x16e067.appendChild(_0x5de119),
      _0x16e067.appendChild(_0x328b04));
    let _0x5cda4f = getCollageLayoutPreset(this._data.layoutPresetId).slotCount || 2;
    if (![2, 3, 4].includes(_0x5cda4f)) _0x5cda4f = 2;
    const _0xce2603 = (_0x4e2501) => {
      ((_0x5cda4f = _0x4e2501),
        _0x5de119
          .querySelectorAll('.collage-grid-count-btn')
          .forEach((_0x1440e0) =>
            _0x1440e0.classList.toggle('is-active', Number(_0x1440e0.dataset.slotCount) === _0x4e2501),
          ),
        _0x328b04.replaceChildren());
      const _0x5a0cf9 = COLLAGE_TEMPLATE_GROUPS.find((_0x56f1bd) => _0x56f1bd.slotCount === _0x4e2501);
      for (const _0x3c5268 of _0x5a0cf9?.presets || []) {
        const _0x44b3c5 = document.createElement('button');
        ((_0x44b3c5.type = 'button'),
          (_0x44b3c5.className = 'collage-template-option'),
          (_0x44b3c5.dataset.collagePresetId = _0x3c5268.id),
          _0x44b3c5.classList.toggle('is-active', _0x3c5268.id === this._data.layoutPresetId));
        const _0x471dc8 = getCollagePresetLabel(_0x3c5268);
        ((_0x44b3c5.title = _0x471dc8),
          _0x44b3c5.setAttribute('aria-label', _0x471dc8),
          _0x44b3c5.appendChild(this._createTemplatePreview(_0x3c5268)),
          _0x44b3c5.addEventListener('click', (_0x1df11d) => {
            _0x1df11d.stopPropagation();
            const _0x3f80e0 = buildCollageLayoutPatch(this._data, _0x3c5268.id);
            (appStore.updateNodeData(this.id, _0x3f80e0), commit());
          }),
          _0x328b04.appendChild(_0x44b3c5));
      }
    };
    for (const _0x4368a9 of COLLAGE_TEMPLATE_GROUPS) {
      const _0x18e4ff = document.createElement('button');
      ((_0x18e4ff.type = 'button'),
        (_0x18e4ff.className = 'collage-grid-count-btn'),
        (_0x18e4ff.dataset.slotCount = String(_0x4368a9.slotCount)),
        (_0x18e4ff.textContent = _0x4368a9.label),
        _0x18e4ff.setAttribute('aria-label', collageText('templates.countAria', { count: _0x4368a9.label })),
        _0x18e4ff.addEventListener('pointerenter', () => _0xce2603(_0x4368a9.slotCount)),
        _0x18e4ff.addEventListener('focus', () => _0xce2603(_0x4368a9.slotCount)),
        _0x18e4ff.addEventListener('click', (_0x41aa37) => {
          (_0x41aa37.stopPropagation(), _0xce2603(_0x4368a9.slotCount));
        }),
        _0x5de119.appendChild(_0x18e4ff));
    }
    return (
      _0xce2603(_0x5cda4f),
      _0x30c52a.addEventListener('click', (_0x2dd4ef) => {
        (_0x2dd4ef.stopPropagation(), this._toggleMenu(_0x16e067));
      }),
      this._registerMenu(_0x16e067, _0x4051b0, 'grid'),
      _0x4051b0.appendChild(_0x30c52a),
      _0x4051b0.appendChild(_0x16e067),
      _0x4051b0
    );
  }
  ['_createTemplatePreview'](_0xf5181a) {
    const _0x42071f = document.createElement('span');
    _0x42071f.className = 'collage-template-preview';
    for (const _0x3d7433 of _0xf5181a.slots || []) {
      const _0x355f48 = document.createElement('span');
      ((_0x355f48.className = 'collage-template-preview-slot'),
        (_0x355f48.style.left = (_0x3d7433.x / _0xf5181a.width) * 100 + '%'),
        (_0x355f48.style.top = (_0x3d7433.y / _0xf5181a.height) * 100 + '%'),
        (_0x355f48.style.width = (_0x3d7433.width / _0xf5181a.width) * 100 + '%'),
        (_0x355f48.style.height = (_0x3d7433.height / _0xf5181a.height) * 100 + '%'),
        _0x42071f.appendChild(_0x355f48));
    }
    return _0x42071f;
  }
  ['_createBackgroundColorPicker']() {
    const _0x3dda26 = getCollageBackgroundOption(this._data.backgroundColor),
      _0x41fc88 = document.createElement('div');
    ((_0x41fc88.className = 'collage-bg-wrap'),
      _0x41fc88.addEventListener('pointerdown', (_0x7df53b) => _0x7df53b.stopPropagation()));
    const _0x242dbe = document.createElement('button');
    ((_0x242dbe.type = 'button'),
      (_0x242dbe.className = 'ftb-btn icon-only collage-bg-btn'),
      (_0x242dbe.dataset.tooltip = collageText('background.tooltip')),
      _0x242dbe.setAttribute('aria-label', collageText('background.tooltip')));
    const _0x217eec = document.createElement('span');
    ((_0x217eec.className = 'collage-bg-dot'),
      (_0x217eec.dataset.collageBackground = _0x3dda26.id),
      _0x242dbe.appendChild(_0x217eec));
    const _0x5b0658 = document.createElement('div');
    ((_0x5b0658.className = 'collage-menu collage-bg-menu'),
      _0x242dbe.addEventListener('click', (_0x5957bd) => {
        (_0x5957bd.stopPropagation(), this._toggleMenu(_0x5b0658));
      }));
    for (const _0x454d17 of COLLAGE_BACKGROUND_OPTIONS) {
      const _0x161ead = document.createElement('button');
      ((_0x161ead.type = 'button'),
        (_0x161ead.className = 'collage-bg-option'),
        (_0x161ead.dataset.collageBackground = _0x454d17.id),
        (_0x161ead.dataset.collageBackgroundValue = _0x454d17.value),
        _0x161ead.classList.toggle('is-active', _0x454d17.id === _0x3dda26.id));
      const _0x5caf45 = getCollageBackgroundLabel(_0x454d17);
      ((_0x161ead.title = _0x5caf45),
        _0x161ead.setAttribute('aria-label', collageText('background.optionAria', { label: _0x5caf45 })),
        _0x161ead.addEventListener('click', (_0x4f7fe0) => {
          (_0x4f7fe0.stopPropagation(), this._setBackgroundColor(_0x454d17.value));
        }),
        _0x5b0658.appendChild(_0x161ead));
    }
    return (
      this._registerMenu(_0x5b0658, _0x41fc88, 'background'),
      _0x41fc88.appendChild(_0x242dbe),
      _0x41fc88.appendChild(_0x5b0658),
      _0x41fc88
    );
  }
  ['_createRangeControl']({ field: _0x265c7e, label: _0x58089c, icon: _0x3b6ba4 }) {
    const _0x55200e = getCollageLayoutStyle(this._data),
      _0x4917a0 = document.createElement('div');
    ((_0x4917a0.className = 'collage-range-wrap'),
      (_0x4917a0.dataset.collageRangeField = _0x265c7e),
      _0x4917a0.addEventListener('pointerdown', (_0x32d307) => _0x32d307.stopPropagation()));
    const _0x4a10e8 = document.createElement('button');
    ((_0x4a10e8.type = 'button'),
      (_0x4a10e8.className = 'ftb-btn icon-only collage-range-btn'),
      (_0x4a10e8.dataset.tooltip = _0x58089c),
      _0x4a10e8.setAttribute('aria-label', _0x58089c),
      _0x4a10e8.appendChild(createSvgIcon(_0x3b6ba4)));
    const _0x25f96a = document.createElement('div');
    _0x25f96a.className = 'collage-menu collage-range-menu';
    const _0x4952d0 = document.createElement('span');
    ((_0x4952d0.className = 'collage-range-value'), (_0x4952d0.textContent = String(_0x55200e[_0x265c7e])));
    const _0x3ae435 = document.createElement('input');
    return (
      (_0x3ae435.type = 'range'),
      (_0x3ae435.min = '0'),
      (_0x3ae435.max = '100'),
      (_0x3ae435.step = '1'),
      (_0x3ae435.value = String(_0x55200e[_0x265c7e])),
      _0x3ae435.setAttribute('aria-label', _0x58089c),
      _0x3ae435.addEventListener('input', () => {
        const _0x4b7b46 = normalizeCollageStyleValue(_0x3ae435.value, _0x55200e[_0x265c7e]);
        ((_0x4952d0.textContent = String(_0x4b7b46)),
          (this._data = { ...this._data, [_0x265c7e]: _0x4b7b46 }),
          this._syncPreviewLayoutStyle({ updateSignature: false }));
      }),
      _0x3ae435.addEventListener('change', () => {
        const _0x249101 = normalizeCollageStyleValue(_0x3ae435.value, _0x55200e[_0x265c7e]);
        ((this._data = { ...this._data, [_0x265c7e]: _0x249101 }),
          this._syncPreviewLayoutStyle(),
          appStore.updateNodeData(this.id, { [_0x265c7e]: _0x249101 }),
          commit());
      }),
      _0x25f96a.appendChild(_0x4952d0),
      _0x25f96a.appendChild(_0x3ae435),
      _0x4a10e8.addEventListener('click', (_0x2acf10) => {
        (_0x2acf10.stopPropagation(), this._toggleMenu(_0x25f96a));
      }),
      this._registerMenu(_0x25f96a, _0x4917a0, 'range:' + _0x265c7e),
      _0x4917a0.appendChild(_0x4a10e8),
      _0x4917a0.appendChild(_0x25f96a),
      _0x4917a0
    );
  }
  ['_createCompositeButton']() {
    const _0x3c41ef = document.createElement('div');
    ((_0x3c41ef.className = 'collage-compose-wrap'),
      _0x3c41ef.addEventListener('pointerdown', (_0x1bef70) => _0x1bef70.stopPropagation()));
    const _0x3e0207 = document.createElement('button');
    ((_0x3e0207.type = 'button'),
      (_0x3e0207.className = 'ftb-btn icon-only act-compose collage-compose-btn'));
    const _0xb5d16e = this._isExporting || this._isCompositing,
      _0x4732c2 = this._isCompositing ? collageText('toolbar.composeBusy') : collageText('toolbar.compose');
    ((_0x3e0207.dataset.tooltip = _0x4732c2),
      _0x3e0207.setAttribute('aria-label', _0x4732c2),
      (_0x3e0207.disabled = _0xb5d16e),
      _0x3e0207.appendChild(createSvgIcon(['M12 3v18', 'M21 12H3'])));
    const _0x578db6 = document.createElement('div');
    _0x578db6.className = 'collage-menu collage-export-menu';
    for (const _0x4abb8d of COLLAGE_EXPORT_RESOLUTIONS) {
      const _0x401e77 = document.createElement('button');
      ((_0x401e77.type = 'button'),
        (_0x401e77.className = 'collage-export-option'),
        (_0x401e77.textContent = _0x4abb8d.label),
        _0x401e77.setAttribute('aria-label', collageText('compose.optionAria', { label: _0x4abb8d.label })),
        _0x401e77.addEventListener('click', (_0x361019) => {
          (_0x361019.stopPropagation(), this._composeCollage(_0x4abb8d.longSide, _0x3e0207));
        }),
        _0x578db6.appendChild(_0x401e77));
    }
    return (
      _0x3e0207.addEventListener('click', (_0x3906b0) => {
        (_0x3906b0.stopPropagation(), this._toggleMenu(_0x578db6));
      }),
      this._registerMenu(_0x578db6, _0x3c41ef, 'compose'),
      _0x3c41ef.appendChild(_0x3e0207),
      _0x3c41ef.appendChild(_0x578db6),
      _0x3c41ef
    );
  }
  ['_createExportButton']() {
    const _0x4170c5 = document.createElement('div');
    ((_0x4170c5.className = 'collage-export-wrap'),
      _0x4170c5.addEventListener('pointerdown', (_0x3f5687) => _0x3f5687.stopPropagation()));
    const _0x1ff78b = document.createElement('button');
    ((_0x1ff78b.type = 'button'), (_0x1ff78b.className = 'ftb-btn icon-only collage-export-btn'));
    const _0x1bb9d3 = this._isExporting ? collageText('toolbar.exportBusy') : collageText('toolbar.export');
    ((_0x1ff78b.dataset.tooltip = _0x1bb9d3),
      _0x1ff78b.setAttribute('aria-label', _0x1bb9d3),
      (_0x1ff78b.disabled = this._isExporting || this._isCompositing),
      _0x1ff78b.appendChild(
        createSvgIcon(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']),
      ));
    const _0xcaaf33 = document.createElement('div');
    _0xcaaf33.className = 'collage-menu collage-export-menu';
    for (const _0x2e4ee8 of COLLAGE_EXPORT_RESOLUTIONS) {
      const _0x3c9a52 = document.createElement('button');
      ((_0x3c9a52.type = 'button'),
        (_0x3c9a52.className = 'collage-export-option'),
        (_0x3c9a52.textContent = _0x2e4ee8.label),
        _0x3c9a52.setAttribute('aria-label', collageText('export.optionAria', { label: _0x2e4ee8.label })),
        _0x3c9a52.addEventListener('click', (_0x27e4bc) => {
          (_0x27e4bc.stopPropagation(), this._exportCollage(_0x2e4ee8.longSide));
        }),
        _0xcaaf33.appendChild(_0x3c9a52));
    }
    return (
      _0x1ff78b.addEventListener('click', (_0x55c214) => {
        (_0x55c214.stopPropagation(), this._toggleMenu(_0xcaaf33));
      }),
      this._registerMenu(_0xcaaf33, _0x4170c5, 'export'),
      _0x4170c5.appendChild(_0x1ff78b),
      _0x4170c5.appendChild(_0xcaaf33),
      _0x4170c5
    );
  }
  ['_getCollapseIconPath']() {
    return this._isCollapsed ? 'M6 9l6 6 6-6' : 'M18 15l-6-6-6 6';
  }
  ['_createCollapseButton']() {
    const _0xaf11ce = document.createElement('button');
    ((_0xaf11ce.type = 'button'), (_0xaf11ce.className = 'ftb-btn icon-only collage-collapse-btn'));
    const _0x436b5c = this._isCollapsed ? collageText('toolbar.expand') : collageText('toolbar.collapse');
    return (
      (_0xaf11ce.dataset.tooltip = _0x436b5c),
      _0xaf11ce.setAttribute('aria-label', _0x436b5c),
      _0xaf11ce.appendChild(createSvgIcon([this._getCollapseIconPath()])),
      _0xaf11ce.addEventListener('pointerdown', (_0x29d134) => _0x29d134.stopPropagation()),
      _0xaf11ce.addEventListener('dblclick', (_0x59682c) => _0x59682c.stopPropagation()),
      _0xaf11ce.addEventListener('click', (_0x37d42b) => {
        (_0x37d42b.stopPropagation(),
          _0x37d42b.currentTarget?.blur?.(),
          this._toggleCollapse(!this._isCollapsed));
      }),
      _0xaf11ce
    );
  }
  ['_registerMenu'](_0xd0644b, _0x422779, _0x23756c) {
    _0xd0644b.dataset.collageMenuKey = _0x23756c;
    if (this._openMenuKey === _0x23756c) _0xd0644b.classList.add('show');
    this._addOutsideMenuListener(_0xd0644b, _0x422779);
  }
  ['_addOutsideMenuListener'](_0x23f2b8, _0x3e7e20) {
    const _0x2edf2c = (_0x454b93) => {
      if (_0x23f2b8.contains(_0x454b93.target) || _0x3e7e20.contains(_0x454b93.target)) return;
      if (!_0x23f2b8.classList.contains('show')) return;
      (_0x23f2b8.classList.remove('show'),
        this._openMenuKey === _0x23f2b8.dataset.collageMenuKey && (this._openMenuKey = ''));
    };
    (window.addEventListener('pointerdown', _0x2edf2c), this._menuOutsideListeners.push(_0x2edf2c));
  }
  ['_removeMenuOutsideListeners']() {
    for (const _0x219252 of this._menuOutsideListeners) {
      window.removeEventListener('pointerdown', _0x219252);
    }
    this._menuOutsideListeners = [];
  }
  ['_closeMenus']({ clearKey: clearKey = true } = {}) {
    this.el.querySelectorAll('.collage-menu.show').forEach((_0x9e9ecb) => _0x9e9ecb.classList.remove('show'));
    if (clearKey) this._openMenuKey = '';
  }
  ['_toggleMenu'](_0x47d5d2) {
    const _0x47ed0b = _0x47d5d2.classList.contains('show');
    this._closeMenus({ clearKey: false });
    if (_0x47ed0b) {
      this._openMenuKey = '';
      return;
    }
    ((this._openMenuKey = _0x47d5d2.dataset.collageMenuKey || ''), _0x47d5d2.classList.add('show'));
  }
  ['_syncBoardBackground']() {
    const _0x5cd838 = getCollageBackgroundOption(this._data.backgroundColor);
    this._boardEl && (this._boardEl.dataset.collageBackground = _0x5cd838.id);
  }
  ['_syncRootState']() {
    (this.el.classList.toggle('is-editing-mode', this._isEditing),
      this.el.classList.toggle('is-collapsed', this._isCollapsed));
  }
  ['_syncToolbarState']() {
    const _0x3062fa = this._toolbarEl || this.el.querySelector('.collage-toolbar');
    if (!_0x3062fa) return;
    const _0x2a273d = _0x3062fa.querySelector('.collage-edit-btn');
    if (_0x2a273d) {
      _0x2a273d.classList.toggle('active', this._isEditing);
      const _0x5c6eb2 = this._isEditing ? collageText('toolbar.exitEdit') : collageText('toolbar.edit');
      ((_0x2a273d.dataset.tooltip = _0x5c6eb2), _0x2a273d.setAttribute('aria-label', _0x5c6eb2));
    }
    const _0x6cfc19 = getCollageAspectRatioOption(this._data.aspectRatio),
      _0x336335 = _0x3062fa.querySelector('.collage-ratio-trigger span');
    _0x336335 && (_0x336335.textContent = _0x6cfc19?.label || collageText('ratio.fallback'));
    (_0x3062fa.querySelectorAll('.collage-ratio-option').forEach((_0x39c5f3) => {
      _0x39c5f3.classList.toggle('is-active', _0x39c5f3.dataset.collageRatio === _0x6cfc19?.label);
    }),
      _0x3062fa.querySelectorAll('.collage-template-option').forEach((_0x2f733b) => {
        _0x2f733b.classList.toggle(
          'is-active',
          _0x2f733b.dataset.collagePresetId === this._data.layoutPresetId,
        );
      }));
    const _0x51a139 = getCollageBackgroundOption(this._data.backgroundColor),
      _0x522b87 = _0x3062fa.querySelector('.collage-bg-dot');
    if (_0x522b87) _0x522b87.dataset.collageBackground = _0x51a139.id;
    _0x3062fa.querySelectorAll('.collage-bg-option').forEach((_0x28bbac) => {
      _0x28bbac.classList.toggle('is-active', _0x28bbac.dataset.collageBackground === _0x51a139.id);
    });
    const _0x3cfa23 = getCollageLayoutStyle(this._data);
    _0x3062fa.querySelectorAll('.collage-range-wrap').forEach((_0x1b8ec5) => {
      const _0x5890da = _0x1b8ec5.dataset.collageRangeField;
      if (!_0x5890da || !(_0x5890da in _0x3cfa23)) return;
      const _0x301a4e = _0x3cfa23[_0x5890da],
        _0x1ae452 = _0x1b8ec5.querySelector('.collage-range-value'),
        _0x26bcc0 = _0x1b8ec5.querySelector('input[type="range"]');
      if (_0x1ae452) _0x1ae452.textContent = String(_0x301a4e);
      if (_0x26bcc0 && _0x26bcc0.value !== String(_0x301a4e)) _0x26bcc0.value = String(_0x301a4e);
    });
    const _0x212a77 = _0x3062fa.querySelector('.collage-compose-btn');
    if (_0x212a77) {
      _0x212a77.disabled = this._isExporting || this._isCompositing;
      const _0xd47cc7 = this._isCompositing
        ? collageText('toolbar.composeBusy')
        : collageText('toolbar.compose');
      ((_0x212a77.dataset.tooltip = _0xd47cc7), _0x212a77.setAttribute('aria-label', _0xd47cc7));
    }
    const _0x4869a0 = _0x3062fa.querySelector('.collage-export-btn');
    if (_0x4869a0) {
      _0x4869a0.disabled = this._isExporting || this._isCompositing;
      const _0x3aba36 = this._isExporting ? collageText('toolbar.exportBusy') : collageText('toolbar.export');
      ((_0x4869a0.dataset.tooltip = _0x3aba36), _0x4869a0.setAttribute('aria-label', _0x3aba36));
    }
    const _0x30c027 = _0x3062fa.querySelector('.collage-collapse-btn');
    if (_0x30c027) {
      const _0x442527 = this._isCollapsed ? collageText('toolbar.expand') : collageText('toolbar.collapse');
      ((_0x30c027.dataset.tooltip = _0x442527), _0x30c027.setAttribute('aria-label', _0x442527));
      const _0x2632b1 = _0x30c027.querySelector('svg path');
      _0x2632b1?.setAttribute('d', this._getCollapseIconPath());
    }
  }
  ['_syncDividerLayer']() {
    const _0x101598 = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!_0x101598) return;
    _0x101598.querySelectorAll('.collage-divider-layer').forEach((_0x5f0237) => _0x5f0237.remove());
    if (!this._isEditing) return;
    _0x101598.appendChild(
      this._createDividerLayer(toPositiveNumber(this._data.width, 1), toPositiveNumber(this._data.height, 1)),
    );
  }
  ['_syncDividerGeometry']() {
    const _0x562593 = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!_0x562593) return;
    if (!this._isEditing) {
      _0x562593.querySelectorAll('.collage-divider-layer').forEach((_0x584f5f) => _0x584f5f.remove());
      return;
    }
    const _0x1870d9 = _0x562593.querySelector('.collage-divider-layer');
    if (!_0x1870d9) {
      this._syncDividerLayer();
      return;
    }
    const _0x1fcedf = resolveCollageEditableDividers(this._data),
      _0x4c2bae = Array.from(_0x1870d9.querySelectorAll('.collage-divider-handle'));
    if (_0x1fcedf.length !== _0x4c2bae.length) {
      this._syncDividerLayer();
      return;
    }
    const _0x21c91a = toPositiveNumber(this._data.width, 1),
      _0xaa7485 = toPositiveNumber(this._data.height, 1);
    _0x1fcedf.forEach((_0xc5458d, _0x3df738) => {
      this._applyDividerHandleGeometry(_0x4c2bae[_0x3df738], _0xc5458d, _0x21c91a, _0xaa7485);
    });
  }
  ['_syncEditingState']() {
    (this._syncRootState(),
      this.el
        .querySelectorAll('.collage-item')
        .forEach((_0x511284) => _0x511284.classList.toggle('is-editable', this._isEditing)),
      this._syncDividerLayer(),
      this._syncToolbarState());
  }
  ['_setComposeButtonBusy'](_0xca2d5a) {
    if (!_0xca2d5a) return null;
    const _0x1ab085 = Array.from(_0xca2d5a.childNodes).map((_0x337b5b) => _0x337b5b.cloneNode(true)),
      _0x36a9da = _0xca2d5a.dataset.tooltip,
      _0xc33bbc = _0xca2d5a.getAttribute('aria-label');
    (_0xca2d5a.replaceChildren(),
      (_0xca2d5a.dataset.tooltip = collageText('toolbar.composeBusyEllipsis')),
      _0xca2d5a.setAttribute('aria-label', collageText('toolbar.composeBusy')),
      (_0xca2d5a.disabled = true));
    const _0x109bc9 = createSvgIcon(['M21 12a9 9 0 1 1-6.219-8.56']);
    return (
      _0x109bc9.classList.add('v2-spinning'),
      _0x109bc9.setAttribute('width', '14'),
      _0x109bc9.setAttribute('height', '14'),
      _0xca2d5a.appendChild(_0x109bc9),
      () => {
        (_0xca2d5a.replaceChildren(..._0x1ab085.map((_0x5999f2) => _0x5999f2.cloneNode(true))),
          (_0xca2d5a.dataset.tooltip = _0x36a9da || collageText('toolbar.compose')),
          _0xca2d5a.setAttribute('aria-label', _0xc33bbc || collageText('toolbar.compose')),
          (_0xca2d5a.disabled = false));
      }
    );
  }
  ['_toggleEdit'](_0x14d9ee) {
    const _0xb97e18 = !!_0x14d9ee;
    if (_0xb97e18 && this._isCollapsed) {
      this._toggleCollapse(false);
      return;
    }
    ((this._isEditing = _0xb97e18),
      (this._data = { ...this._data, isEditing: _0xb97e18 }),
      this._syncEditingState(),
      appStore.updateNodeData(this.id, { isEditing: _0xb97e18 }));
  }
  ['_toggleCollapse'](_0x2a7024) {
    const _0x32e3c0 = buildCollageCollapsePatch(this._data, _0x2a7024);
    ((this._data = { ...this._data, ..._0x32e3c0 }),
      (this._isCollapsed = !!_0x32e3c0.isCollapsed),
      (this._isEditing = !!this._data.isEditing),
      this._syncRootState(),
      this._syncToolbarState(),
      appStore.updateNodeData(this.id, _0x32e3c0));
  }
  ['_setBackgroundColor'](_0x2bc99c) {
    const _0x3e0aa0 = normalizeCollageBackgroundColor(_0x2bc99c);
    ((this._data = { ...this._data, backgroundColor: _0x3e0aa0 }),
      this._syncBoardBackground(),
      this._syncToolbarState(),
      appStore.updateNodeData(this.id, { backgroundColor: _0x3e0aa0 }),
      commit());
  }
  ['_refreshPreviewLayer']() {
    if (!this._boardEl) return;
    ((this._highlightedSlotIndex = -1),
      this._boardEl.querySelectorAll('.collage-preview-layer').forEach((_0x39d66e) => _0x39d66e.remove()),
      this._boardEl.appendChild(this._createPreviewLayer()),
      (this._previewSignature = this._getPreviewSignature()),
      this._syncEditingState());
  }
  ['_applyTileFrame'](_0x141908, _0x2b4071, _0x3046d3, _0x3c3db8, _0x5c45a8) {
    if (!_0x141908 || !_0x2b4071) return;
    ((_0x141908.style.left = (_0x2b4071.x / _0x3046d3) * 100 + '%'),
      (_0x141908.style.top = (_0x2b4071.y / _0x3c3db8) * 100 + '%'),
      (_0x141908.style.width = (_0x2b4071.width / _0x3046d3) * 100 + '%'),
      (_0x141908.style.height = (_0x2b4071.height / _0x3c3db8) * 100 + '%'),
      (_0x141908.style.borderRadius = _0x5c45a8 + 'px'));
  }
  ['_syncTileContent'](_0x28a3bb, _0x587d3c, _0x3e0447, _0xd03a69, _0x39752c) {
    if (!_0x28a3bb) return;
    ((_0x28a3bb.dataset.collageSlotIndex = String(_0x3e0447)),
      _0x28a3bb.classList.toggle('is-empty', _0xd03a69),
      _0x28a3bb.classList.toggle('is-editable', this._isEditing));
    const _0x78813 = resolveCollageItemPreviewUrl(_0x587d3c);
    if (_0x78813 && !_0xd03a69) {
      let _0x2b8068 = _0x28a3bb.querySelector('.collage-item-img');
      !_0x2b8068
        ? (_0x28a3bb.replaceChildren(),
          (_0x2b8068 = document.createElement('img')),
          (_0x2b8068.className = 'collage-item-img'),
          (_0x2b8068.decoding = 'async'),
          (_0x2b8068.loading = 'eager'),
          _0x28a3bb.appendChild(_0x2b8068))
        : _0x28a3bb.querySelectorAll('.collage-slot-empty').forEach((_0x44e15d) => _0x44e15d.remove());
      _0x2b8068.alt = _0x587d3c.label || collageText('preview.imageAlt');
      _0x2b8068.dataset.collagePreviewUrl !== _0x78813 &&
        ((_0x2b8068.dataset.collagePreviewUrl = _0x78813), (_0x2b8068.src = _0x78813));
      (this._applyImagePlacement(_0x2b8068, _0x587d3c), (_0x2b8068.style.borderRadius = _0x39752c + 'px'));
      return;
    }
    const _0x1799f2 = !!_0x28a3bb.querySelector('.collage-slot-empty');
    if (!_0x1799f2 || _0x28a3bb.querySelector('.collage-item-img')) {
      const _0x1f5a0a = document.createElement('div');
      ((_0x1f5a0a.className = 'collage-slot-empty'), _0x28a3bb.replaceChildren(_0x1f5a0a));
    }
  }
  ['_createPreviewTile']({
    item: _0x1b16d6,
    index: _0x5406b6,
    frame: _0x1c002a,
    isEmpty: _0x54772a,
    nodeWidth: _0x2e88ed,
    nodeHeight: _0x55f808,
    cornerRadius: _0x322405,
  }) {
    const _0x5968dc = document.createElement('div');
    return (
      (_0x5968dc.className = 'collage-item'),
      this._applyTileFrame(_0x5968dc, _0x1c002a, _0x2e88ed, _0x55f808, _0x322405),
      _0x5968dc.addEventListener('pointerdown', (_0x48c674) => this._beginImageDrag(_0x48c674, _0x5406b6)),
      _0x5968dc.addEventListener('wheel', (_0x45b862) => this._handleItemWheel(_0x45b862, _0x5406b6), {
        passive: false,
      }),
      this._syncTileContent(_0x5968dc, _0x1b16d6, _0x5406b6, _0x54772a, _0x322405),
      _0x5968dc
    );
  }
  ['_syncPreviewLayer']({ updateSignature: updateSignature = true } = {}) {
    const _0x56618c = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!_0x56618c) {
      this._refreshPreviewLayer();
      return;
    }
    const _0x569950 = resolveCollageItemFrames(this._data);
    if (_0x569950.length === 0) {
      this._refreshPreviewLayer();
      return;
    }
    const _0x3937d6 = toPositiveNumber(this._data.width, 1),
      _0x2ff22d = toPositiveNumber(this._data.height, 1),
      { cornerRadius: _0x1bc7cb } = getCollageLayoutStyle(this._data),
      _0x41ac1a = new Map(
        Array.from(_0x56618c.querySelectorAll('.collage-item')).map((_0xba436e) => [
          Number(_0xba436e.dataset.collageSlotIndex),
          _0xba436e,
        ]),
      ),
      _0x174305 = new Set();
    _0x56618c
      .querySelectorAll('.collage-empty, .collage-divider-layer, .collage-collapsed-badge')
      .forEach((_0x1f5e54) => _0x1f5e54.remove());
    for (const { item: _0x52ca29, index: _0x228268, frame: _0x4409c3, isEmpty: _0xe8dad2 } of _0x569950) {
      _0x174305.add(_0x228268);
      let _0x1c9700 = _0x41ac1a.get(_0x228268);
      (!_0x1c9700
        ? (_0x1c9700 = this._createPreviewTile({
            item: _0x52ca29,
            index: _0x228268,
            frame: _0x4409c3,
            isEmpty: _0xe8dad2,
            nodeWidth: _0x3937d6,
            nodeHeight: _0x2ff22d,
            cornerRadius: _0x1bc7cb,
          }))
        : (this._applyTileFrame(_0x1c9700, _0x4409c3, _0x3937d6, _0x2ff22d, _0x1bc7cb),
          this._syncTileContent(_0x1c9700, _0x52ca29, _0x228268, _0xe8dad2, _0x1bc7cb)),
        _0x56618c.appendChild(_0x1c9700));
    }
    for (const [_0x90f29, _0x12e055] of _0x41ac1a) {
      if (!_0x174305.has(_0x90f29)) _0x12e055.remove();
    }
    this._isEditing && _0x56618c.appendChild(this._createDividerLayer(_0x3937d6, _0x2ff22d));
    this._appendCollapsedBadge(_0x56618c);
    this._highlightedSlotIndex >= 0 &&
      this._getTileByIndex(this._highlightedSlotIndex)?.classList.add('is-drop-highlight');
    if (updateSignature) this._previewSignature = this._getPreviewSignature();
    (this._syncRootState(), this._syncToolbarState());
  }
  ['_syncPreviewLayoutStyle']({ updateSignature: updateSignature = true } = {}) {
    const _0xbfdafa = this._boardEl?.querySelector?.('.collage-preview-layer');
    if (!_0xbfdafa) {
      this._refreshPreviewLayer();
      return;
    }
    const _0x4b5ebc = resolveCollageItemFrames(this._data),
      _0x55d013 = Array.from(_0xbfdafa.querySelectorAll('.collage-item'));
    if (_0x4b5ebc.length !== _0x55d013.length) {
      this._refreshPreviewLayer();
      return;
    }
    const _0x17bc0b = toPositiveNumber(this._data.width, 1),
      _0x1dca80 = toPositiveNumber(this._data.height, 1),
      { cornerRadius: _0x4090e8 } = getCollageLayoutStyle(this._data),
      _0x3779f3 = new Map(_0x4b5ebc.map((_0x37eb3e) => [Number(_0x37eb3e.index), _0x37eb3e.frame]));
    for (const _0x5eb391 of _0x55d013) {
      const _0x53b296 = Number(_0x5eb391.dataset.collageSlotIndex),
        _0x5cb0dc = _0x3779f3.get(_0x53b296);
      if (!_0x5cb0dc) {
        this._refreshPreviewLayer();
        return;
      }
      this._applyTileFrame(_0x5eb391, _0x5cb0dc, _0x17bc0b, _0x1dca80, _0x4090e8);
      const _0x2675c6 = _0x5eb391.querySelector('.collage-item-img');
      if (_0x2675c6) _0x2675c6.style.borderRadius = _0x4090e8 + 'px';
    }
    this._syncDividerGeometry();
    if (updateSignature) this._previewSignature = this._getPreviewSignature();
  }
  ['_createPreviewLayer']() {
    const _0x284fa7 = document.createElement('div');
    _0x284fa7.className = 'collage-preview-layer';
    const _0x2ca54c = resolveCollageItemFrames(this._data);
    if (_0x2ca54c.length === 0) {
      const _0x99d974 = document.createElement('div');
      return (
        (_0x99d974.className = 'collage-empty'),
        (_0x99d974.textContent = collageText('preview.empty')),
        _0x284fa7.appendChild(_0x99d974),
        this._appendCollapsedBadge(_0x284fa7),
        _0x284fa7
      );
    }
    const _0x51534c = toPositiveNumber(this._data.width, 1),
      _0x56b0fd = toPositiveNumber(this._data.height, 1),
      { cornerRadius: _0x3c13e3 } = getCollageLayoutStyle(this._data);
    for (const { item: _0x262160, index: _0x3ae513, frame: _0x2a0704, isEmpty: _0xbb777 } of _0x2ca54c) {
      const _0x3cba79 = this._createPreviewTile({
        item: _0x262160,
        index: _0x3ae513,
        frame: _0x2a0704,
        isEmpty: _0xbb777,
        nodeWidth: _0x51534c,
        nodeHeight: _0x56b0fd,
        cornerRadius: _0x3c13e3,
      });
      _0x284fa7.appendChild(_0x3cba79);
    }
    return (
      this._isEditing && _0x284fa7.appendChild(this._createDividerLayer(_0x51534c, _0x56b0fd)),
      this._appendCollapsedBadge(_0x284fa7),
      _0x284fa7
    );
  }
  ['_appendCollapsedBadge'](_0x4aefd8) {
    if (!this._isCollapsed || !_0x4aefd8) return;
    _0x4aefd8.appendChild(this._createCollapsedBadge());
  }
  ['_createCollapsedBadge']() {
    const _0x27df40 = document.createElement('button');
    ((_0x27df40.type = 'button'),
      (_0x27df40.className = 'collage-collapsed-badge'),
      (_0x27df40.dataset.tooltip = collageText('toolbar.expand')),
      _0x27df40.setAttribute('aria-label', collageText('preview.expandAria')),
      _0x27df40.appendChild(
        createSvgIcon(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']),
      ));
    const _0x14c045 = document.createElement('span'),
      _0x2f5270 = Array.isArray(this._data.items) ? this._data.items.length : 0;
    return (
      (_0x14c045.textContent = String(_0x2f5270)),
      _0x27df40.appendChild(_0x14c045),
      _0x27df40.addEventListener('pointerdown', (_0x2bf519) => _0x2bf519.stopPropagation()),
      _0x27df40.addEventListener('dblclick', (_0x5b69fb) => _0x5b69fb.stopPropagation()),
      _0x27df40.addEventListener('click', (_0x2b2436) => {
        (_0x2b2436.stopPropagation(), this._toggleCollapse(false));
      }),
      _0x27df40
    );
  }
  ['_applyImagePlacement'](_0x509069, _0x450307) {
    if (!_0x509069) return;
    const _0x1e1692 = clamp01(_0x450307?.focusX),
      _0x3d8cd5 = clamp01(_0x450307?.focusY),
      _0x396bd0 = normalizeCollageImageScale(_0x450307?.imageScale);
    ((_0x509069.style.objectPosition = _0x1e1692 * 100 + '% ' + _0x3d8cd5 * 100 + '%'),
      (_0x509069.style.transform = 'scale(' + _0x396bd0 + ')'),
      (_0x509069.style.transformOrigin = _0x1e1692 * 100 + '% ' + _0x3d8cd5 * 100 + '%'));
  }
  ['_createDividerLayer'](_0x1db0f3, _0x1b74c6) {
    const _0x1b47a8 = document.createElement('div');
    _0x1b47a8.className = 'collage-divider-layer';
    for (const _0x1071ab of resolveCollageEditableDividers(this._data)) {
      const _0x29ae38 = document.createElement('button');
      ((_0x29ae38.type = 'button'),
        (_0x29ae38.className =
          'collage-divider-handle ' + (_0x1071ab.axis === 'x' ? 'is-vertical' : 'is-horizontal')),
        _0x29ae38.setAttribute('aria-label', collageText('preview.dividerAria')),
        _0x29ae38.addEventListener('pointerdown', (_0x2c6b85) =>
          this._beginDividerDrag(_0x2c6b85, _0x1071ab),
        ),
        this._applyDividerHandleGeometry(_0x29ae38, _0x1071ab, _0x1db0f3, _0x1b74c6),
        _0x1b47a8.appendChild(_0x29ae38));
    }
    return _0x1b47a8;
  }
  ['_applyDividerHandleGeometry'](
    _0x55e8df,
    _0x3f701c,
    _0x1dd5b4 = toPositiveNumber(this._data.width, 1),
    _0x1bc75d = toPositiveNumber(this._data.height, 1),
  ) {
    if (!_0x55e8df || !_0x3f701c) return;
    const { outerPadding: _0x4acdfc } = getCollageLayoutStyle(this._data),
      _0x2406a1 = Math.min(_0x4acdfc, Math.max(0, _0x1dd5b4 * 0.45), Math.max(0, _0x1bc75d * 0.45)),
      _0x32776c = Math.max(1, _0x1dd5b4 - _0x2406a1 * 2),
      _0x51bb26 = Math.max(1, _0x1bc75d - _0x2406a1 * 2),
      _0x513e9e = _0x32776c / _0x1dd5b4,
      _0x2c812a = _0x51bb26 / _0x1bc75d;
    if (_0x3f701c.axis === 'x') {
      const _0x189662 = _0x2406a1 + (Number(_0x3f701c.position) || 0) * _0x513e9e,
        _0x5cc9b7 = _0x2406a1 + (Number(_0x3f701c.spanStart) || 0) * _0x2c812a,
        _0x50fba1 = _0x2406a1 + (Number(_0x3f701c.spanEnd) || 0) * _0x2c812a;
      ((_0x55e8df.style.left =
        'calc(' + (_0x189662 / _0x1dd5b4) * 100 + '% - var(--collage-divider-hit-offset))'),
        (_0x55e8df.style.top = (_0x5cc9b7 / _0x1bc75d) * 100 + '%'),
        (_0x55e8df.style.width = 'var(--collage-divider-hit-size)'),
        (_0x55e8df.style.height = (Math.max(1, _0x50fba1 - _0x5cc9b7) / _0x1bc75d) * 100 + '%'));
    } else {
      const _0x4918b3 = _0x2406a1 + (Number(_0x3f701c.position) || 0) * _0x2c812a,
        _0x598b00 = _0x2406a1 + (Number(_0x3f701c.spanStart) || 0) * _0x513e9e,
        _0x2bc841 = _0x2406a1 + (Number(_0x3f701c.spanEnd) || 0) * _0x513e9e;
      ((_0x55e8df.style.left = (_0x598b00 / _0x1dd5b4) * 100 + '%'),
        (_0x55e8df.style.top =
          'calc(' + (_0x4918b3 / _0x1bc75d) * 100 + '% - var(--collage-divider-hit-offset))'),
        (_0x55e8df.style.width = (Math.max(1, _0x2bc841 - _0x598b00) / _0x1dd5b4) * 100 + '%'),
        (_0x55e8df.style.height = 'var(--collage-divider-hit-size)'));
    }
  }
  ['_getItemsCopy']() {
    return (Array.isArray(this._data.items) ? this._data.items : []).map((_0x25003f) => ({ ..._0x25003f }));
  }
  ['_setItemAt'](_0x1fe7cc, _0x590a39) {
    const _0x1905ae = this._getItemsCopy();
    if (_0x1fe7cc < 0 || _0x1fe7cc >= _0x1905ae.length) return null;
    return (
      (_0x1905ae[_0x1fe7cc] = _0x590a39),
      (this._data = { ...this._data, items: _0x1905ae }),
      _0x1905ae
    );
  }
  ['_commitItems']({ commitHistory: commitHistory = true } = {}) {
    this._itemsCommitTimer && (clearTimeout(this._itemsCommitTimer), (this._itemsCommitTimer = null));
    const _0x1f57ee = this._getItemsCopy();
    ((this._previewSignature = this._getPreviewSignature()),
      appStore.updateNodeData(this.id, { items: _0x1f57ee }));
    if (commitHistory) commit();
  }
  ['_scheduleItemsCommit']() {
    if (this._itemsCommitTimer) clearTimeout(this._itemsCommitTimer);
    this._itemsCommitTimer = setTimeout(() => {
      ((this._itemsCommitTimer = null), this._commitItems());
    }, 160);
  }
  ['_getTileByIndex'](_0x27d687) {
    return this.el.querySelector('.collage-item[data-collage-slot-index="' + _0x27d687 + '"]');
  }
  ['_applyTileGeometry'](_0x32277b, _0x13c3d0 = null) {
    const _0x564b6f = this._getTileByIndex(_0x32277b);
    if (!_0x564b6f) return;
    const _0x4f3dbc = Array.isArray(_0x13c3d0) ? _0x13c3d0 : resolveCollageItemFrames(this._data),
      _0x3284d3 = _0x4f3dbc.find((_0x22508a) => _0x22508a.index === _0x32277b);
    if (!_0x3284d3) return;
    const _0x39be8a = toPositiveNumber(this._data.width, 1),
      _0x23efc6 = toPositiveNumber(this._data.height, 1),
      { frame: _0x5bddda } = _0x3284d3;
    ((_0x564b6f.style.left = (_0x5bddda.x / _0x39be8a) * 100 + '%'),
      (_0x564b6f.style.top = (_0x5bddda.y / _0x23efc6) * 100 + '%'),
      (_0x564b6f.style.width = (_0x5bddda.width / _0x39be8a) * 100 + '%'),
      (_0x564b6f.style.height = (_0x5bddda.height / _0x23efc6) * 100 + '%'));
  }
  ['_applyTileImagePlacement'](_0x3729f0) {
    const _0x346fbf = this._getTileByIndex(_0x3729f0),
      _0x3d40ec = _0x346fbf?.querySelector?.('.collage-item-img'),
      _0x9c129f = (this._data.items || [])[_0x3729f0];
    this._applyImagePlacement(_0x3d40ec, _0x9c129f);
  }
  ['_collectSlotHitRects']({ excludeIndex: excludeIndex = -1 } = {}) {
    const _0x23513b = Array.from(this.el.querySelectorAll('.collage-item'));
    return _0x23513b
      .map((_0x482eb3) => {
        const _0xf5b2b5 = Number(_0x482eb3.dataset.collageSlotIndex);
        if (!Number.isInteger(_0xf5b2b5) || _0xf5b2b5 === excludeIndex) return null;
        const _0x544f55 = _0x482eb3.getBoundingClientRect?.();
        if (!_0x544f55) return null;
        return {
          slotIndex: _0xf5b2b5,
          left: _0x544f55.left,
          top: _0x544f55.top,
          right: _0x544f55.right,
          bottom: _0x544f55.bottom,
        };
      })
      .filter(Boolean);
  }
  ['_getSlotIndexAtClientPoint'](
    _0x351c17,
    _0x17e28f,
    { excludeIndex: excludeIndex = -1, slotHitRects: slotHitRects = null } = {},
  ) {
    if (!Number.isFinite(_0x351c17) || !Number.isFinite(_0x17e28f)) return -1;
    const _0x32b853 = Array.isArray(slotHitRects)
      ? slotHitRects
      : this._collectSlotHitRects({ excludeIndex: excludeIndex });
    for (let _0x397086 = _0x32b853.length - 1; _0x397086 >= 0; _0x397086 -= 1) {
      const _0x19687b = _0x32b853[_0x397086];
      if (!_0x19687b || _0x19687b.slotIndex === excludeIndex) continue;
      if (
        _0x351c17 >= _0x19687b.left &&
        _0x351c17 <= _0x19687b.right &&
        _0x17e28f >= _0x19687b.top &&
        _0x17e28f <= _0x19687b.bottom
      )
        return _0x19687b.slotIndex;
    }
    return -1;
  }
  ['_swapImageItemIntoSlot'](_0x1dace9, _0x5cd6c9) {
    const _0x30d7be = buildCollageItemSwapPatch(this._data, _0x1dace9, _0x5cd6c9);
    if (!_0x30d7be) return false;
    return (
      (this._data = { ...this._data, items: _0x30d7be.items }),
      this._syncPreviewLayer(),
      this._commitItems(),
      true
    );
  }
  ['_createImageDragGhost'](_0x44be51, _0x516974, _0x315bd4, _0x438632, { hidden: hidden = false } = {}) {
    if (typeof document === 'undefined' || !document.body || !_0x44be51) return null;
    const _0x8671c9 = _0x44be51.getBoundingClientRect?.(),
      _0x594422 = resolveCollageItemSourceImage(_0x516974),
      _0x532124 = _0x44be51.querySelector('.collage-item-img'),
      _0x17a1ff = toPositiveNumber(_0x532124?.naturalWidth, 0),
      _0x3d7c18 = toPositiveNumber(_0x532124?.naturalHeight, 0),
      _0x5c8bbe = (_0x594422.hasIntrinsicSize ? _0x594422.width : 0) || _0x17a1ff,
      _0x5845e4 = (_0x594422.hasIntrinsicSize ? _0x594422.height : 0) || _0x3d7c18,
      _0x36ae5d = _0x5c8bbe > 0 && _0x5845e4 > 0 ? _0x5c8bbe / _0x5845e4 : 0,
      _0xe8687c = Math.max(1, Math.round(Number(_0x8671c9?.width) || 1)),
      _0x1a9108 = Math.max(1, Math.round(Number(_0x8671c9?.height) || 1)),
      _0x3867f6 = typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
      _0x54c6e4 = toPositiveNumber(_0x3867f6?.viewport?.zoom, 1),
      _0x56dc36 = toPositiveNumber(_0x516974?.sourceDisplayWidth, 0),
      _0x487c94 = toPositiveNumber(_0x516974?.sourceDisplayHeight, 0);
    let _0x233257 = _0xe8687c,
      _0x3f7c44 = _0x1a9108;
    if (_0x56dc36 > 0 && _0x487c94 > 0)
      ((_0x233257 = Math.max(1, Math.round(_0x56dc36 * _0x54c6e4))),
        (_0x3f7c44 = Math.max(1, Math.round(_0x487c94 * _0x54c6e4))));
    else {
      if (_0x36ae5d > 0) {
        const _0x2db9a4 = resolveCollageSizeByShortSide({
          width: _0x5c8bbe,
          height: _0x5845e4,
          shortSide: Math.min(_0xe8687c, _0x1a9108),
        });
        ((_0x233257 = _0x2db9a4.width), (_0x3f7c44 = _0x2db9a4.height));
      }
    }
    const _0x1dc2d6 = document.createElement('div');
    ((_0x1dc2d6.className = 'v2-ghost-image collage-drag-ghost'),
      Object.assign(_0x1dc2d6.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: _0x233257 + 'px',
        height: _0x3f7c44 + 'px',
        transform: 'translate(' + _0x315bd4 + 'px, ' + _0x438632 + 'px) translate(-50%, -50%)',
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
    const _0x255c4f =
        _0x594422.src || _0x594422.localPath
          ? document.createElement('img')
          : _0x532124?.cloneNode(false) || document.createElement('img'),
      _0x5101df =
        _0x594422.src ||
        (_0x594422.localPath ? '/' + String(_0x594422.localPath).replace(/^\/+/, '') : '') ||
        String(_0x516974?.url || '').trim() ||
        (_0x516974?.localPath ? '/' + String(_0x516974.localPath).replace(/^\/+/, '') : '') ||
        String(_0x516974?.sourceUrl || '').trim();
    return (
      _0x5101df && _0x255c4f.setAttribute('src', _0x5101df),
      Object.assign(_0x255c4f.style, {
        width: '100%',
        height: '100%',
        objectFit: _0x594422.isOriginalSource ? 'contain' : 'cover',
        display: 'block',
        pointerEvents: 'none',
        transition: 'none',
      }),
      _0x1dc2d6.appendChild(_0x255c4f),
      document.body.appendChild(_0x1dc2d6),
      _0x1dc2d6
    );
  }
  ['_ensureImageDragGhost'](_0x5b05a8, _0x13b00f, _0x55f3a8 = {}) {
    if (!_0x5b05a8 || _0x5b05a8.ghostEl) return _0x5b05a8?.ghostEl || null;
    const _0x4563ed = (this._data.items || [])[_0x5b05a8.index];
    return (
      (_0x5b05a8.ghostEl = this._createImageDragGhost(
        _0x5b05a8.tile,
        _0x4563ed,
        Number(_0x13b00f?.clientX) || _0x5b05a8.startClientX,
        Number(_0x13b00f?.clientY) || _0x5b05a8.startClientY,
        _0x55f3a8,
      )),
      _0x5b05a8.ghostEl
    );
  }
  ['_activateImageDragGhost'](_0x32b425, _0x2752ef, { markSource: markSource = false } = {}) {
    const _0x490c5f = this._ensureImageDragGhost(_0x32b425, _0x2752ef);
    if (!_0x490c5f) return null;
    return (
      (_0x32b425.ghostActive = true),
      (_0x490c5f.style.visibility = 'visible'),
      (_0x490c5f.style.opacity = '0.9'),
      (_0x490c5f.style.transition = 'none'),
      _0x32b425.tile?.classList?.toggle('is-drag-source', markSource),
      _0x490c5f
    );
  }
  ['_moveImageDragGhost'](_0x1b0895, _0x366a76, _0x37c319) {
    if (!_0x1b0895?.ghostEl) return;
    _0x1b0895.ghostEl.style.transform =
      'translate(' + _0x366a76 + 'px, ' + _0x37c319 + 'px) translate(-50%, -50%)';
  }
  ['_removeImageDragGhost'](_0x172524, { fade: fade = false } = {}) {
    const _0x5a576c = _0x172524?.ghostEl || null;
    if (!_0x5a576c) return;
    (fade
      ? ((_0x5a576c.style.transition = 'opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)'),
        (_0x5a576c.style.opacity = '0'),
        setTimeout(() => _0x5a576c.remove(), 160))
      : _0x5a576c.remove(),
      _0x172524 &&
        ((_0x172524.ghostEl = null),
        (_0x172524.ghostActive = false),
        _0x172524.tile?.classList?.remove('is-drag-source')));
  }
  ['_removeImageDragGhostWhenSourceReady'](_0x27b558, _0x467111) {
    if (!_0x27b558) return;
    const _0x405d06 = () => this._removeImageDragGhost({ ghostEl: _0x27b558 });
    if (typeof document === 'undefined' || !_0x467111) {
      _0x405d06();
      return;
    }
    const _0x1b9e1a =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (_0x2d2058) => setTimeout(_0x2d2058, 16),
      _0x195c21 = () =>
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now(),
      _0x2b9c8c = _0x195c21();
    let _0x99825c = 0;
    const _0x5c40ee = () => {
      const _0x1ac659 = document.getElementById?.(_0x467111),
        _0x378600 = _0x1ac659?.querySelector?.('img.node-img'),
        _0x16017e =
          !!_0x378600 &&
          _0x378600.style.display !== 'none' &&
          _0x378600.complete === true &&
          Number(_0x378600.naturalWidth || 0) > 0;
      if (_0x16017e) {
        _0x99825c += 1;
        if (_0x99825c >= 2) {
          _0x405d06();
          return;
        }
      } else _0x99825c = 0;
      if (_0x195c21() - _0x2b9c8c > 0x4b0) {
        _0x405d06();
        return;
      }
      _0x1b9e1a(_0x5c40ee);
    };
    _0x1b9e1a(_0x5c40ee);
  }
  ['_beginImageDrag'](_0x4ada87, _0x5f3aa1) {
    if (!this._isEditing) return;
    if (_0x4ada87.target?.closest?.('.collage-divider-handle')) return;
    (_0x4ada87.preventDefault(), _0x4ada87.stopPropagation());
    const _0x462195 = (this._data.items || [])[_0x5f3aa1];
    if (!_0x462195 || isCollageItemEmpty(_0x462195)) return;
    this._endImageDrag({ shouldCommit: false });
    const _0x54f789 = this._getTileByIndex(_0x5f3aa1),
      _0x321032 = this._boardEl?.getBoundingClientRect?.(),
      _0x307d3f = _0x54f789?.getBoundingClientRect?.();
    if (!_0x54f789 || !_0x321032 || !_0x307d3f) return;
    const _0x3a1e01 = (_0x4362c7) => this._updateImageDrag(_0x4362c7),
      _0x46762d = (_0x2b7359) => this._endImageDrag({ event: _0x2b7359 });
    ((this._activeImageDrag = {
      index: _0x5f3aa1,
      tile: _0x54f789,
      boardRect: _0x321032,
      tileRect: _0x307d3f,
      startClientX: Number(_0x4ada87.clientX) || 0,
      startClientY: Number(_0x4ada87.clientY) || 0,
      startFocusX: clamp01(_0x462195.focusX),
      startFocusY: clamp01(_0x462195.focusY),
      imageScale: normalizeCollageImageScale(_0x462195.imageScale),
      slotHitRects: this._collectSlotHitRects({ excludeIndex: _0x5f3aa1 }),
      moved: false,
      ghostEl: this._createImageDragGhost(
        _0x54f789,
        _0x462195,
        Number(_0x4ada87.clientX) || 0,
        Number(_0x4ada87.clientY) || 0,
        { hidden: true },
      ),
      ghostActive: false,
      onMove: _0x3a1e01,
      onEnd: _0x46762d,
    }),
      _0x54f789.classList.add('is-image-editing'));
    try {
      _0x54f789.setPointerCapture?.(_0x4ada87.pointerId);
    } catch (_0x8075aa) {}
    (document.addEventListener('pointermove', _0x3a1e01),
      document.addEventListener('pointerup', _0x46762d, { once: true }),
      document.addEventListener('pointercancel', _0x46762d, { once: true }));
  }
  ['_updateImageDrag'](_0x5f0452) {
    const _0x35cd82 = this._activeImageDrag;
    if (!_0x35cd82) return;
    _0x5f0452.preventDefault?.();
    const _0x2e6257 = Number(_0x5f0452.clientX) || _0x35cd82.startClientX,
      _0x1bb9f0 = Number(_0x5f0452.clientY) || _0x35cd82.startClientY,
      _0x4e33c9 = _0x2e6257 - _0x35cd82.startClientX,
      _0x4b3cb5 = _0x1bb9f0 - _0x35cd82.startClientY;
    if (Math.hypot(_0x4e33c9, _0x4b3cb5) > 3) _0x35cd82.moved = true;
    const _0x48143d = Math.hypot(_0x4e33c9, _0x4b3cb5),
      _0x31b30c = this._isOutsideRect(_0x2e6257, _0x1bb9f0, _0x35cd82.tileRect, 2);
    if (
      _0x35cd82.ghostActive ||
      (_0x35cd82.moved && _0x48143d > COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX && _0x31b30c)
    ) {
      (this._activateImageDragGhost(_0x35cd82, _0x5f0452, { markSource: true }),
        this._moveImageDragGhost(_0x35cd82, _0x2e6257, _0x1bb9f0));
      const _0x159c40 = this._getSlotIndexAtClientPoint(_0x2e6257, _0x1bb9f0, {
        excludeIndex: _0x35cd82.index,
        slotHitRects: _0x35cd82.slotHitRects,
      });
      this.highlightSlot(_0x159c40);
      return;
    }
    this.highlightSlot(-1);
    const _0x5ceb78 = Math.max(0.35, _0x35cd82.imageScale),
      _0x477897 = clamp01(
        _0x35cd82.startFocusX - _0x4e33c9 / Math.max(1, _0x35cd82.tileRect.width) / _0x5ceb78,
      ),
      _0x27920e = clamp01(
        _0x35cd82.startFocusY - _0x4b3cb5 / Math.max(1, _0x35cd82.tileRect.height) / _0x5ceb78,
      ),
      _0x137a3d = Array.isArray(this._data.items) ? [...this._data.items] : [],
      _0x57370c = _0x137a3d[_0x35cd82.index];
    if (!_0x57370c) return;
    ((_0x137a3d[_0x35cd82.index] = { ..._0x57370c, focusX: _0x477897, focusY: _0x27920e }),
      (this._data = { ...this._data, items: _0x137a3d }),
      this._applyTileImagePlacement(_0x35cd82.index),
      this._applyImagePlacement(
        _0x35cd82.ghostEl?.querySelector?.('.collage-item-img, img'),
        _0x137a3d[_0x35cd82.index],
      ));
  }
  ['_endImageDrag']({ event: event = null, shouldCommit: shouldCommit = true } = {}) {
    const _0xfcfad5 = this._activeImageDrag;
    if (!_0xfcfad5) return;
    (document.removeEventListener('pointermove', _0xfcfad5.onMove),
      document.removeEventListener('pointerup', _0xfcfad5.onEnd),
      document.removeEventListener('pointercancel', _0xfcfad5.onEnd),
      _0xfcfad5.tile?.classList?.remove('is-image-editing'),
      _0xfcfad5.tile?.classList?.remove('is-drag-source'),
      this.highlightSlot(-1),
      (this._activeImageDrag = null));
    if (!shouldCommit) {
      this._removeImageDragGhost(_0xfcfad5);
      return;
    }
    const _0x41bd0c = Number(event?.clientX),
      _0x1f4d00 = Number(event?.clientY),
      _0x50b855 = Math.hypot(
        (Number.isFinite(_0x41bd0c) ? _0x41bd0c : _0xfcfad5.startClientX) - _0xfcfad5.startClientX,
        (Number.isFinite(_0x1f4d00) ? _0x1f4d00 : _0xfcfad5.startClientY) - _0xfcfad5.startClientY,
      ),
      _0x212378 =
        Number.isFinite(_0x41bd0c) &&
        Number.isFinite(_0x1f4d00) &&
        this._isOutsideBoard(_0x41bd0c, _0x1f4d00),
      _0x1740e5 =
        _0xfcfad5.ghostActive && Number.isFinite(_0x41bd0c) && Number.isFinite(_0x1f4d00)
          ? this._getSlotIndexAtClientPoint(_0x41bd0c, _0x1f4d00, {
              excludeIndex: _0xfcfad5.index,
              slotHitRects: _0xfcfad5.slotHitRects,
            })
          : -1;
    if (_0x1740e5 >= 0 && _0x1740e5 !== _0xfcfad5.index) {
      this._removeImageDragGhost(_0xfcfad5);
      if (this._swapImageItemIntoSlot(_0xfcfad5.index, _0x1740e5)) return;
    }
    if (_0xfcfad5.moved && _0x50b855 > COLLAGE_IMAGE_DRAG_OUT_THRESHOLD_PX && _0x212378) {
      (this._activateImageDragGhost(_0xfcfad5, event, { markSource: true }),
        this._moveImageDragGhost(_0xfcfad5, _0x41bd0c, _0x1f4d00),
        _0xfcfad5.tile?.classList?.remove('is-drag-source'),
        this._extractItemToSourceNode(_0xfcfad5.index, _0x41bd0c, _0x1f4d00, _0xfcfad5.ghostEl));
      return;
    }
    (this._removeImageDragGhost(_0xfcfad5), this._commitItems());
  }
  ['_isOutsideRect'](_0x32e15c, _0x53bf8a, _0x2da658, _0x170cbb = 0) {
    if (!_0x2da658) return false;
    const _0x428c5d = Math.max(0, Number(_0x170cbb) || 0);
    return (
      _0x32e15c < _0x2da658.left - _0x428c5d ||
      _0x32e15c > _0x2da658.right + _0x428c5d ||
      _0x53bf8a < _0x2da658.top - _0x428c5d ||
      _0x53bf8a > _0x2da658.bottom + _0x428c5d
    );
  }
  ['_isOutsideBoard'](_0x56437f, _0x136789) {
    const _0x249a40 = this._boardEl?.getBoundingClientRect?.();
    return this._isOutsideRect(_0x56437f, _0x136789, _0x249a40);
  }
  ['_handleItemWheel'](_0x395e6c, _0x41439c) {
    if (!this._isEditing) return;
    const _0x4ad871 = (this._data.items || [])[_0x41439c];
    if (!_0x4ad871 || isCollageItemEmpty(_0x4ad871)) return;
    (_0x395e6c.preventDefault(), _0x395e6c.stopPropagation());
    const _0x138bec = normalizeCollageImageScale(_0x4ad871.imageScale),
      _0x83649d = Math.exp(-(Number(_0x395e6c.deltaY) || 0) * 0.0015),
      _0x312fee = normalizeCollageImageScale(_0x138bec * _0x83649d);
    if (Math.abs(_0x312fee - _0x138bec) < 0.001) return;
    const _0x1d755c = Array.isArray(this._data.items) ? [...this._data.items] : [];
    ((_0x1d755c[_0x41439c] = { ..._0x1d755c[_0x41439c], imageScale: _0x312fee }),
      (this._data = { ...this._data, items: _0x1d755c }),
      this._applyTileImagePlacement(_0x41439c),
      this._scheduleItemsCommit());
  }
  ['_beginDividerDrag'](_0x3a4bb3, _0x582f8) {
    if (!this._isEditing) return;
    (_0x3a4bb3.preventDefault(), _0x3a4bb3.stopPropagation());
    if (!_0x582f8) return;
    this._endDividerDrag({ shouldCommit: false });
    const _0x4caa26 = this._boardEl?.getBoundingClientRect?.();
    if (!_0x4caa26) return;
    const _0x51b8a6 = _0x3a4bb3.currentTarget,
      _0x24fa41 = (_0x160161) => this._updateDividerDrag(_0x160161),
      _0x4537bf = () => this._endDividerDrag();
    ((this._activeDividerDrag = {
      divider: _0x582f8,
      handle: _0x51b8a6,
      startClientX: Number(_0x3a4bb3.clientX) || 0,
      startClientY: Number(_0x3a4bb3.clientY) || 0,
      startItems: this._getItemsCopy(),
      boardRect: _0x4caa26,
      onMove: _0x24fa41,
      onEnd: _0x4537bf,
    }),
      _0x51b8a6?.classList?.add('is-active'));
    try {
      _0x3a4bb3.currentTarget?.setPointerCapture?.(_0x3a4bb3.pointerId);
    } catch (_0x3fa22d) {}
    (document.addEventListener('pointermove', _0x24fa41),
      document.addEventListener('pointerup', _0x4537bf, { once: true }),
      document.addEventListener('pointercancel', _0x4537bf, { once: true }));
  }
  ['_updateDividerDrag'](_0x1becb3) {
    const _0x266f1d = this._activeDividerDrag;
    if (!_0x266f1d) return;
    _0x1becb3.preventDefault?.();
    const _0x28263a = toPositiveNumber(this._data.width, 1),
      _0x4e3b32 = toPositiveNumber(this._data.height, 1),
      _0x2c14a0 =
        (((Number(_0x1becb3.clientX) || 0) - _0x266f1d.startClientX) /
          Math.max(1, _0x266f1d.boardRect.width)) *
        _0x28263a,
      _0x2d9e0f =
        (((Number(_0x1becb3.clientY) || 0) - _0x266f1d.startClientY) /
          Math.max(1, _0x266f1d.boardRect.height)) *
        _0x4e3b32,
      _0x15edae = _0x266f1d.divider.axis === 'x' ? _0x2c14a0 : _0x2d9e0f,
      _0xf681f1 = buildCollageDividerDragPatch(
        { ...this._data, items: _0x266f1d.startItems },
        _0x266f1d.divider,
        _0x15edae,
      );
    this._data = { ...this._data, items: _0xf681f1.items };
    const _0x3ae18b = resolveCollageItemFrames(this._data),
      _0x113990 = Array.isArray(_0xf681f1.moveIndexes)
        ? _0xf681f1.moveIndexes
        : _0xf681f1.items.map((_0x2f7d6a, _0x5e746e) => _0x5e746e);
    for (const _0x203599 of _0x113990) {
      this._applyTileGeometry(_0x203599, _0x3ae18b);
    }
    this._applyDividerHandleGeometry(
      _0x266f1d.handle,
      { ..._0x266f1d.divider, position: (Number(_0x266f1d.divider.position) || 0) + _0xf681f1.delta },
      _0x28263a,
      _0x4e3b32,
    );
  }
  ['_endDividerDrag']({ shouldCommit: shouldCommit = true } = {}) {
    const _0x4ce040 = this._activeDividerDrag;
    if (!_0x4ce040) return;
    (document.removeEventListener('pointermove', _0x4ce040.onMove),
      document.removeEventListener('pointerup', _0x4ce040.onEnd),
      document.removeEventListener('pointercancel', _0x4ce040.onEnd),
      _0x4ce040.handle?.classList?.remove('is-active'),
      (this._activeDividerDrag = null));
    if (shouldCommit) this._commitItems();
  }
  ['_extractItemToSourceNode'](_0x11a3b0, _0x27b717, _0x232cf1, _0x36edce = null) {
    const _0x55c5a2 = (this._data.items || [])[_0x11a3b0];
    if (!_0x55c5a2 || isCollageItemEmpty(_0x55c5a2)) {
      this._commitItems();
      return;
    }
    const _0x22bc0b =
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
      _0x14f9e4 = _0x22bc0b?.viewport || { x: 0, y: 0, zoom: 1 },
      _0x2e5242 = screenToWorld(_0x27b717, _0x232cf1, _0x14f9e4),
      _0x3a449e = resolveCollageItemFrames(this._data).find((_0x50e11f) => _0x50e11f.index === _0x11a3b0),
      _0x2f7942 = resolveCollageItemSourceImage(_0x55c5a2),
      _0x264de2 = this._getTileByIndex(_0x11a3b0)?.querySelector('.collage-item-img'),
      _0x44a61f = _0x36edce?.querySelector?.('img'),
      _0x4c85fb = toPositiveNumber(_0x264de2?.naturalWidth, 0),
      _0x2a0aef = toPositiveNumber(_0x264de2?.naturalHeight, 0),
      _0x156e74 = toPositiveNumber(_0x44a61f?.naturalWidth, 0),
      _0x46db1d = toPositiveNumber(_0x44a61f?.naturalHeight, 0),
      _0x1f5887 =
        (_0x2f7942.hasIntrinsicSize ? toPositiveNumber(_0x2f7942.width, 0) : 0) ||
        _0x4c85fb ||
        _0x156e74 ||
        toPositiveNumber(_0x2f7942.width, 0) ||
        toPositiveNumber(_0x3a449e?.frame?.width, _0x55c5a2.width || 1),
      _0x138664 =
        (_0x2f7942.hasIntrinsicSize ? toPositiveNumber(_0x2f7942.height, 0) : 0) ||
        _0x2a0aef ||
        _0x46db1d ||
        toPositiveNumber(_0x2f7942.height, 0) ||
        toPositiveNumber(_0x3a449e?.frame?.height, _0x55c5a2.height || 1),
      _0x2344ed = toPositiveNumber(_0x55c5a2?.sourceDisplayWidth, 0),
      _0x41323c = toPositiveNumber(_0x55c5a2?.sourceDisplayHeight, 0),
      _0x39bf80 =
        _0x2344ed > 0 && _0x41323c > 0
          ? { width: Math.max(1, Math.round(_0x2344ed)), height: Math.max(1, Math.round(_0x41323c)) }
          : getAutoMediaSizeByShortSide(_0x1f5887, _0x138664),
      _0x3b334d = generateId('source-image'),
      _0x14fc6d = _0x2f7942.localPath,
      _0x44f6f0 = _0x2f7942.src || (_0x14fc6d ? '/' + _0x14fc6d.replace(/^\/+/, '') : '');
    if (!_0x44f6f0 && !_0x14fc6d) return;
    const _0x44486e = this._getItemsCopy();
    ((_0x44486e[_0x11a3b0] = normalizeEmptyCollageItem(_0x55c5a2, _0x11a3b0)),
      (this._data = { ...this._data, items: _0x44486e }));
    const _0x9788ad = () => {
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: _0x3b334d,
          type: 'source-image',
          src: _0x44f6f0,
          localPath: _0x14fc6d,
          thumbLocalPath: _0x2f7942.isOriginalSource ? '' : _0x55c5a2.thumbLocalPath || '',
          sourceLocalPath: '',
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          imageWidth: _0x1f5887,
          imageHeight: _0x138664,
          x: _0x2e5242.x - _0x39bf80.width / 2,
          y: _0x2e5242.y - _0x39bf80.height / 2,
          width: _0x39bf80.width,
          height: _0x39bf80.height,
          fileName: _0x55c5a2.fileName || '',
          name: _0x55c5a2.label || collageText('preview.imageAlt'),
          fixedSize: true,
          needsAutoResize: false,
        }),
      ),
        appStore.updateNodeData(this.id, { items: _0x44486e }),
        appStore.setSelectedNodes([_0x3b334d]));
    };
    if (typeof appStore.batch === 'function') appStore.batch(_0x9788ad);
    else _0x9788ad();
    (commit(),
      window._triggerLocalCacheSave?.(),
      this._removeImageDragGhostWhenSourceReady(_0x36edce, _0x3b334d));
  }
  ['_resolveItemLocalPath'](_0x22a734) {
    const _0x44aec7 =
      String(_0x22a734?.localPath || '').trim() ||
      String(_0x22a734?.sourceLocalPath || '').trim() ||
      String(_0x22a734?.thumbLocalPath || '').trim() ||
      (String(_0x22a734?.url || '').startsWith('/') ? String(_0x22a734.url).trim() : '');
    if (!_0x44aec7 || /^(?:https?:|blob:|data:)/i.test(_0x44aec7)) return '';
    return _0x44aec7.replace(/^\/+/, '');
  }
  async ['_renderCollageOutput'](_0x2b6365) {
    const _0x50b162 = resolveCollageItemFrames(this._data).filter(
      ({ item: _0x464c66 }) => !isCollageItemEmpty(_0x464c66),
    );
    if (_0x50b162.length === 0) throw new Error(collageText('errors.emptyCollage'));
    const _0x479adc = getCollageExportResolution(_0x2b6365),
      _0x2a76f4 = resolveCollageExportSize(this._data, _0x479adc.longSide),
      _0x315379 = document.createElement('canvas');
    ((_0x315379.width = _0x2a76f4.width), (_0x315379.height = _0x2a76f4.height));
    const _0x497b4a = _0x315379.getContext('2d');
    if (!_0x497b4a) throw new Error(collageText('errors.canvasCreateFailed'));
    const _0x909f3f = normalizeCollageBackgroundColor(this._data.backgroundColor),
      _0x31ee9a = isCollageBackgroundTransparent(_0x909f3f),
      _0x50436d = _0x31ee9a ? '' : resolveCssColorValue(_0x909f3f) || getDocumentCssVar('--white');
    !_0x31ee9a &&
      _0x50436d &&
      ((_0x497b4a.fillStyle = _0x50436d), _0x497b4a.fillRect(0, 0, _0x315379.width, _0x315379.height));
    const _0x3d503d = toPositiveNumber(this._data.width, 1),
      _0x4ff059 = toPositiveNumber(this._data.height, 1),
      _0x3345ef = _0x315379.width / _0x3d503d,
      _0x457574 = _0x315379.height / _0x4ff059,
      _0x73dce4 = Math.min(_0x3345ef, _0x457574),
      { cornerRadius: _0x522b75 } = getCollageLayoutStyle(this._data);
    let _0x4f3f5a = 0;
    const _0x22c7b1 = await Promise.all(
      _0x50b162.map(async ({ item: _0x455152, frame: _0x3aefed, index: _0x111241 }) => {
        try {
          const _0x4b687e = resolveCollageItemPreviewUrl(_0x455152),
            _0x27268e = this._getTileByIndex(_0x111241)?.querySelector?.('.collage-item-img');
          if (_0x27268e?.complete === true && Number(_0x27268e.naturalWidth || 0) > 0)
            return { item: _0x455152, frame: _0x3aefed, img: _0x27268e };
          if (!_0x4b687e) return null;
          const _0x10783c = await loadImage(_0x4b687e);
          return { item: _0x455152, frame: _0x3aefed, img: _0x10783c };
        } catch (_0x39b175) {
          return (console.warn('[CollageNode] skip image:', _0x39b175), null);
        }
      }),
    );
    for (const _0x430293 of _0x22c7b1) {
      if (!_0x430293) continue;
      const { item: _0x3c2a88, frame: _0x2e26ed, img: _0x6e1d8 } = _0x430293,
        _0x4f922b = {
          x: Math.round(_0x2e26ed.x * _0x3345ef),
          y: Math.round(_0x2e26ed.y * _0x457574),
          width: Math.max(1, Math.round(_0x2e26ed.width * _0x3345ef)),
          height: Math.max(1, Math.round(_0x2e26ed.height * _0x457574)),
        };
      drawRoundedImageCover(
        _0x497b4a,
        _0x6e1d8,
        _0x4f922b,
        _0x522b75 * _0x73dce4,
        _0x3c2a88.focusX,
        _0x3c2a88.focusY,
        _0x3c2a88.imageScale,
      ) && (_0x4f3f5a += 1);
    }
    if (_0x4f3f5a === 0) throw new Error(collageText('errors.nothingDrawn'));
    const _0x4d74a5 = _0x31ee9a ? 'image/png' : 'image/jpeg',
      _0xb3c8b = _0x31ee9a ? 'png' : 'jpg',
      _0x2b5dde = await canvasToBlob(_0x315379, _0x4d74a5, _0x31ee9a ? undefined : 0.92),
      _0x3e107a = generateId('collage'),
      _0x517a2d = 'collage_' + _0x3e107a + '.' + _0xb3c8b;
    return {
      blob: _0x2b5dde,
      mimeType: _0x4d74a5,
      extension: _0xb3c8b,
      fileName: _0x517a2d,
      resolution: _0x479adc,
      width: _0x315379.width,
      height: _0x315379.height,
    };
  }
  async ['_saveCollageOutput'](_0x3eeb6b) {
    const _0x168167 = new File([_0x3eeb6b.blob], _0x3eeb6b.fileName, { type: _0x3eeb6b.mimeType }),
      _0x571cc7 = await saveOutputBlob(_0x168167, { ext: _0x3eeb6b.extension }),
      _0x471ea3 = String(_0x571cc7.localPath || _0x571cc7.path || '').replace(/^\//, ''),
      _0x4f4ad4 = String(_0x571cc7.url || '').trim() || (_0x471ea3 ? '/' + _0x471ea3 : '');
    return { saved: _0x571cc7, localPath: _0x471ea3, srcUrl: _0x4f4ad4 };
  }
  ['_resolveCompositeNodePosition'](_0x74958e) {
    const _0x5975b9 =
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
      _0x1b6c4b = _0x5975b9?.nodes || {},
      _0xe91e09 = _0x1b6c4b[this.id] || this._data;
    return calcSafeSpawnPosNearNode(_0x1b6c4b, _0xe91e09, _0x74958e.width, _0x74958e.height);
  }
  ['_createCompositeSourceNode'](_0x34a235, _0x12f95e) {
    const _0x536e2d = getAutoMediaSizeByShortSide(_0x34a235.width, _0x34a235.height),
      _0x3dd080 = this._resolveCompositeNodePosition(_0x536e2d),
      _0x49839f = generateId('node');
    return buildSourceMediaNodePayload({
      id: _0x49839f,
      type: 'source-image',
      x: _0x3dd080.x,
      y: _0x3dd080.y,
      width: _0x536e2d.width,
      height: _0x536e2d.height,
      naturalWidth: _0x34a235.width,
      naturalHeight: _0x34a235.height,
      src: _0x12f95e.srcUrl,
      localPath: _0x12f95e.localPath,
      fileName: _0x12f95e.saved?.filename || _0x34a235.fileName,
      name: collageText('output.name', { resolution: _0x34a235.resolution.label }),
      needsAutoResize: false,
    });
  }
  ['_addCompositeSourceNode'](_0x29bdb9, _0xc70608) {
    const _0x15e422 = this._createCompositeSourceNode(_0x29bdb9, _0xc70608),
      _0x4cd993 = () => {
        (appStore.addNode(_0x15e422), appStore.setSelectedNodes([_0x15e422.id]));
      };
    if (typeof appStore.batch === 'function') appStore.batch(_0x4cd993);
    else _0x4cd993();
    return (
      commit(),
      window._triggerLocalCacheSave?.(),
      window.v2FocusOnNodes && requestAnimationFrame(() => window.v2FocusOnNodes([this.id, _0x15e422.id])),
      _0x15e422
    );
  }
  async ['_composeCollage'](_0x21e203, _0x2418de = null) {
    if (this._isExporting || this._isCompositing) return;
    ((this._isCompositing = true), this._closeMenus());
    const _0x1f7b6a = this._setComposeButtonBusy(_0x2418de || this.el.querySelector('.collage-compose-btn')),
      _0x508c6a = (_0x5c8083) => {
        if (!_0x5c8083) return;
        setTimeout(() => revokeBlobObjectUrl(_0x5c8083), 0xfa0);
      };
    try {
      const _0xf02b18 = await this._renderCollageOutput(_0x21e203),
        _0x1b6a64 = createBlobObjectUrl(_0xf02b18.blob);
      if (_0x1b6a64) {
        const _0x564143 = this._addCompositeSourceNode(_0xf02b18, {
          saved: { filename: _0xf02b18.fileName },
          localPath: '',
          srcUrl: _0x1b6a64,
        });
        try {
          const _0x1c2020 = await this._saveCollageOutput(_0xf02b18);
          (appStore.updateNodeData(_0x564143.id, {
            src: _0x1c2020.srcUrl,
            localPath: _0x1c2020.localPath,
            fileName: _0x1c2020.saved?.filename || _0xf02b18.fileName,
          }),
            window._triggerLocalCacheSave?.(),
            _0x508c6a(_0x1b6a64),
            window.showToast?.(collageText('compose.created'), 'success'));
        } catch (_0x23ada3) {
          (console.error('[CollageNode] compose save failed:', _0x23ada3),
            window.showToast?.(collageText('compose.saveFailed'), 'warning'));
        }
        return;
      }
      const _0x4aaa87 = await this._saveCollageOutput(_0xf02b18);
      (this._addCompositeSourceNode(_0xf02b18, _0x4aaa87),
        window.showToast?.(collageText('compose.created'), 'success'));
    } catch (_0x4a3cad) {
      (console.error('[CollageNode] compose failed:', _0x4a3cad),
        window.showToast?.(_0x4a3cad?.message || collageText('errors.composeFailed'), 'error'));
    } finally {
      ((this._isCompositing = false), _0x1f7b6a?.(), this._syncToolbarState());
    }
  }
  async ['_exportCollage'](_0x33fc9d) {
    if (this._isExporting || this._isCompositing) return;
    ((this._isExporting = true), this._closeMenus(), this._syncToolbarState());
    try {
      const _0x25a048 = await this._renderCollageOutput(_0x33fc9d);
      (await this._saveCollageOutput(_0x25a048),
        window.showToast?.(collageText('export.exported'), 'success'));
    } catch (_0x1f1ef4) {
      (console.error('[CollageNode] export failed:', _0x1f1ef4),
        window.showToast?.(_0x1f1ef4?.message || collageText('errors.exportFailed'), 'error'));
    } finally {
      ((this._isExporting = false), this._syncToolbarState());
    }
  }
}
