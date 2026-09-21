import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { saveOutputBlob } from './project.js';
import { generateId, screenToWorld, worldToScreen } from '../core/math.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
export const IMAGE_CROP_MIN_SIZE = 20;
function imageCropText(_0x7dd52f, _0x591873 = {}) {
  return t('imageCrop.' + _0x7dd52f, _0x591873);
}
function toFiniteNumber(_0x56c58c, _0x111982 = 0) {
  const _0x185efd = Number(_0x56c58c);
  return Number.isFinite(_0x185efd) ? _0x185efd : _0x111982;
}
function clamp(_0x2c2e68, _0x251d01, _0x94b310) {
  return Math.max(_0x251d01, Math.min(_0x94b310, _0x2c2e68));
}
function normalizeCropNodeBounds(_0x2a1b53) {
  if (!_0x2a1b53 || typeof _0x2a1b53 !== 'object') return null;
  const _0x20cf80 = toFiniteNumber(_0x2a1b53.x),
    _0x58700b = toFiniteNumber(_0x2a1b53.y),
    _0x47b57 = Math.max(0, toFiniteNumber(_0x2a1b53.width ?? _0x2a1b53.w)),
    _0x4aea24 = Math.max(0, toFiniteNumber(_0x2a1b53.height ?? _0x2a1b53.h));
  if (!(_0x47b57 > 0 && _0x4aea24 > 0)) return null;
  return {
    x: _0x20cf80,
    y: _0x58700b,
    width: _0x47b57,
    height: _0x4aea24,
    right: _0x20cf80 + _0x47b57,
    bottom: _0x58700b + _0x4aea24,
  };
}
function normalizeCropAspectRatio(_0x1440f9) {
  const _0x2cc8bd = Number(_0x1440f9);
  return Number.isFinite(_0x2cc8bd) && _0x2cc8bd > 0 ? _0x2cc8bd : null;
}
function clampPointToNode(_0x280193, _0x41afdd) {
  return {
    x: clamp(toFiniteNumber(_0x280193?.x), _0x41afdd.x, _0x41afdd.right),
    y: clamp(toFiniteNumber(_0x280193?.y), _0x41afdd.y, _0x41afdd.bottom),
  };
}
export function buildImageCropDragRect({
  startPoint: _0x680cd4,
  currentPoint: _0x5e4a24,
  node: _0x48057c,
  aspectRatio: aspectRatio = null,
  minSize: minSize = IMAGE_CROP_MIN_SIZE,
} = {}) {
  const _0x17dbe8 = normalizeCropNodeBounds(_0x48057c);
  if (!_0x17dbe8) return null;
  const _0x92ed72 = clampPointToNode(_0x680cd4, _0x17dbe8),
    _0x101849 = clampPointToNode(_0x5e4a24, _0x17dbe8),
    _0x548725 = _0x101849.x - _0x92ed72.x,
    _0x961788 = _0x101849.y - _0x92ed72.y,
    _0x4d14a9 = _0x548725 < 0 ? -1 : 1,
    _0x5ea017 = _0x961788 < 0 ? -1 : 1;
  let _0x474f48 = Math.abs(_0x548725),
    _0x4ef7f3 = Math.abs(_0x961788);
  const _0x214bcd = normalizeCropAspectRatio(aspectRatio);
  if (_0x214bcd) {
    const _0x143221 = _0x4d14a9 < 0 ? _0x92ed72.x - _0x17dbe8.x : _0x17dbe8.right - _0x92ed72.x,
      _0x1c9525 = _0x5ea017 < 0 ? _0x92ed72.y - _0x17dbe8.y : _0x17dbe8.bottom - _0x92ed72.y;
    if (_0x474f48 > 0 && _0x4ef7f3 > 0)
      _0x474f48 / _0x4ef7f3 > _0x214bcd
        ? (_0x474f48 = _0x4ef7f3 * _0x214bcd)
        : (_0x4ef7f3 = _0x474f48 / _0x214bcd);
    else {
      if (_0x474f48 > 0) _0x4ef7f3 = _0x474f48 / _0x214bcd;
      else _0x4ef7f3 > 0 && (_0x474f48 = _0x4ef7f3 * _0x214bcd);
    }
    (_0x474f48 > _0x143221 && ((_0x474f48 = _0x143221), (_0x4ef7f3 = _0x474f48 / _0x214bcd)),
      _0x4ef7f3 > _0x1c9525 && ((_0x4ef7f3 = _0x1c9525), (_0x474f48 = _0x4ef7f3 * _0x214bcd)));
  }
  if (!(_0x474f48 > 0 && _0x4ef7f3 > 0)) return null;
  const _0x53a964 = {
      x: _0x4d14a9 < 0 ? _0x92ed72.x - _0x474f48 : _0x92ed72.x,
      y: _0x5ea017 < 0 ? _0x92ed72.y - _0x4ef7f3 : _0x92ed72.y,
      w: _0x474f48,
      h: _0x4ef7f3,
    },
    _0x899031 = Math.max(0, toFiniteNumber(minSize, IMAGE_CROP_MIN_SIZE));
  return { rect: _0x53a964, isValid: _0x53a964.w >= _0x899031 && _0x53a964.h >= _0x899031 };
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
  init(_0x487a40) {
    if (this.active) return;
    const _0x51231a = appStore.getStateRaw(),
      _0xfea39d = _0x51231a.nodes?.[_0x487a40];
    if (!_0xfea39d) return;
    ((this.active = true),
      (this.nodeData = _0xfea39d),
      (this._isProcessingCrop = false),
      (this.aspectRatio = null),
      (this._view = { viewport: _0x51231a.viewport, node: _0xfea39d }),
      (this._redrawSelection = null));
    const _0x5012da = 0.1;
    this.cropRect = {
      x: _0xfea39d.x + (_0xfea39d.width * _0x5012da) / 2,
      y: _0xfea39d.y + (_0xfea39d.height * _0x5012da) / 2,
      w: _0xfea39d.width * (1 - _0x5012da),
      h: _0xfea39d.height * (1 - _0x5012da),
    };
    const _0x2cea1c = () => {
      (this._createUI(),
        this._bindEvents(),
        (this._unsubscribe = appStore.subscribeSelector(
          (_0xb8861f) => {
            const _0x2ab7c1 = _0xb8861f.nodes?.[_0x487a40],
              _0x3e34df = _0xb8861f.viewport || { x: 0, y: 0, zoom: 1 };
            return {
              hasNode: !!_0x2ab7c1,
              nx: _0x2ab7c1 ? _0x2ab7c1.x : 0,
              ny: _0x2ab7c1 ? _0x2ab7c1.y : 0,
              nw: _0x2ab7c1 ? _0x2ab7c1.width : 0,
              nh: _0x2ab7c1 ? _0x2ab7c1.height : 0,
              vx: _0x3e34df.x,
              vy: _0x3e34df.y,
              vz: _0x3e34df.zoom || 1,
            };
          },
          (_0x483cf3) => {
            if (!_0x483cf3?.hasNode) return;
            const _0x28031b = appStore.getStateRaw().nodes?.[_0x487a40];
            if (!_0x28031b) return;
            ((this._view = {
              viewport: { x: _0x483cf3.vx, y: _0x483cf3.vy, zoom: _0x483cf3.vz },
              node: _0x28031b,
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
      ? requestIdleCallback(_0x2cea1c, { timeout: 50 })
      : setTimeout(_0x2cea1c, 0);
  },
  _createUI() {
    const _0x49271f = document.createDocumentFragment(),
      _0xd88fa8 = document.createElement('div');
    ((_0xd88fa8.className = 'v2-crop-overlay'), (_0xd88fa8.style.willChange = 'opacity'));
    const _0x4ef1d2 = document.createElement('div');
    _0x4ef1d2.className = 'v2-crop-dim-mask';
    const _0x39d301 = document.createElement('div');
    ((_0x39d301.className = 'v2-crop-container'), (_0x39d301.style.transform = 'translateZ(0)'));
    const _0x5ce481 = document.createElement('div');
    ((_0x5ce481.className = 'v2-crop-box'),
      (_0x5ce481.style.willChange = 'transform, width, height'),
      (_0x5ce481.style.transform = 'translateZ(0)'));
    const _0x267998 = document.createElement('div');
    ((_0x267998.className = 'v2-crop-grid'), _0x267998.replaceChildren());
    for (let _0x4bf1cb = 0; _0x4bf1cb < 9; _0x4bf1cb++) _0x267998.appendChild(document.createElement('div'));
    _0x5ce481.appendChild(_0x267998);
    const _0x409a0c = ['tl', 'tm', 'tr', 'rm', 'br', 'bm', 'bl', 'lm'];
    (_0x409a0c.forEach((_0x3adf50) => {
      const _0x2ba2c7 = document.createElement('div');
      ((_0x2ba2c7.className = 'v2-crop-handle ' + _0x3adf50),
        (_0x2ba2c7.dataset.handle = _0x3adf50),
        _0x5ce481.appendChild(_0x2ba2c7));
    }),
      _0x39d301.appendChild(_0x5ce481),
      _0xd88fa8.appendChild(_0x39d301),
      _0x49271f.appendChild(_0x4ef1d2),
      _0x49271f.appendChild(_0xd88fa8));
    const _0x5bafc1 = document.createElement('div');
    ((_0x5bafc1.className = 'v2-crop-size-label'),
      (_0x5bafc1.textContent = '-- x --'),
      _0x49271f.appendChild(_0x5bafc1),
      (this.sizeLabelEl = _0x5bafc1),
      (this.dimMaskEl = _0x4ef1d2));
    const _0x57b2bd = document.createElement('div');
    ((_0x57b2bd.className = 'v2-crop-toolbar'), (_0x57b2bd.style.willChange = 'opacity, transform'));
    const _0x376862 = 'http://www.w3.org/2000/svg',
      _0x2ec95a = (_0xd331f3, _0x335016, _0x4db65e) => {
        const _0x3a256e = document.createElementNS(_0x376862, 'svg');
        return (
          _0x3a256e.setAttribute('width', String(_0xd331f3)),
          _0x3a256e.setAttribute('height', String(_0x335016)),
          _0x3a256e.setAttribute('viewBox', '0 0 24 24'),
          _0x3a256e.setAttribute('fill', 'none'),
          _0x3a256e.setAttribute('stroke', 'currentColor'),
          _0x3a256e.setAttribute('stroke-width', String(_0x4db65e)),
          _0x3a256e
        );
      },
      _0x145302 = document.createElement('button');
    ((_0x145302.className = 'v2-crop-toolbar-btn exit'), (_0x145302.title = imageCropText('actions.exit')));
    const _0x2da165 = _0x2ec95a(18, 18, 2),
      _0x1ac440 = document.createElementNS(_0x376862, 'path');
    _0x1ac440.setAttribute('d', 'M18 6L6 18');
    const _0x3770f9 = document.createElementNS(_0x376862, 'path');
    (_0x3770f9.setAttribute('d', 'M6 6l12 12'),
      _0x2da165.appendChild(_0x1ac440),
      _0x2da165.appendChild(_0x3770f9),
      _0x145302.appendChild(_0x2da165));
    const _0x42173b = document.createElement('div');
    _0x42173b.className = 'v2-crop-divider';
    const _0x197477 = document.createElement('div');
    _0x197477.className = 'v2-expand-wrap';
    const _0x4887d1 = document.createElement('button');
    _0x4887d1.className = 'v2-crop-toolbar-btn ratio-toggle';
    const _0x3f2637 = _0x2ec95a(16, 16, 2),
      _0x3fcf52 = document.createElementNS(_0x376862, 'rect');
    (_0x3fcf52.setAttribute('x', '3'),
      _0x3fcf52.setAttribute('y', '3'),
      _0x3fcf52.setAttribute('width', '18'),
      _0x3fcf52.setAttribute('height', '18'),
      _0x3fcf52.setAttribute('rx', '2'));
    const _0x50204e = document.createElementNS(_0x376862, 'path');
    (_0x50204e.setAttribute('d', 'M3 9h18M9 21V9'),
      _0x3f2637.appendChild(_0x3fcf52),
      _0x3f2637.appendChild(_0x50204e));
    const _0xe3c0e1 = document.createElement('span');
    ((_0xe3c0e1.className = 'ratio-text'),
      (_0xe3c0e1.textContent = imageCropText('ratios.free')),
      _0x4887d1.appendChild(_0x3f2637),
      _0x4887d1.appendChild(_0xe3c0e1));
    const _0x3adef4 = document.createElement('div');
    _0x3adef4.className = 'floating-menu v2-expand-menu v2-crop-ratio-menu';
    const _0x5d99ad = [
      { v: 'free', key: 'free', active: true },
      { v: 'original', key: 'original' },
      { v: '21:9', t: '21:9' },
      { v: '16:9', t: '16:9' },
      { v: '9:16', t: '9:16' },
      { v: '4:3', t: '4:3' },
      { v: '3:4', t: '3:4' },
      { v: '1:1', t: '1:1' },
    ];
    (_0x5d99ad.forEach((_0x3e68fd) => {
      const _0x151866 = document.createElement('div');
      ((_0x151866.className =
        'floating-menu-item v2-expand-menu-item v2-crop-ratio-item' + (_0x3e68fd.active ? ' active' : '')),
        (_0x151866.dataset.ratio = _0x3e68fd.v));
      if (_0x3e68fd.key) _0x151866.dataset.ratioLabelKey = _0x3e68fd.key;
      const _0x4c55cd = document.createElement('span');
      ((_0x4c55cd.className = 'floating-menu-label'),
        (_0x4c55cd.textContent = _0x3e68fd.key ? imageCropText('ratios.' + _0x3e68fd.key) : _0x3e68fd.t),
        _0x151866.appendChild(_0x4c55cd),
        _0x3adef4.appendChild(_0x151866));
    }),
      _0x197477.appendChild(_0x4887d1),
      _0x197477.appendChild(_0x3adef4));
    const _0x2e2f10 = document.createElement('div');
    _0x2e2f10.className = 'v2-crop-divider';
    const _0x54b402 = document.createElement('button');
    _0x54b402.className = 'v2-crop-toolbar-btn confirm';
    const _0x3579bd = _0x2ec95a(18, 18, 2),
      _0x37c1f0 = document.createElementNS(_0x376862, 'polyline');
    (_0x37c1f0.setAttribute('points', '20 6 9 17 4 12'),
      _0x3579bd.appendChild(_0x37c1f0),
      _0x54b402.appendChild(_0x3579bd),
      _0x54b402.appendChild(document.createTextNode(' ' + imageCropText('actions.confirm'))),
      _0x57b2bd.appendChild(_0x145302),
      _0x57b2bd.appendChild(_0x42173b),
      _0x57b2bd.appendChild(_0x197477),
      _0x57b2bd.appendChild(_0x2e2f10),
      _0x57b2bd.appendChild(_0x54b402),
      document.body.appendChild(_0x49271f),
      document.body.appendChild(_0x57b2bd),
      (this.overlayEl = _0xd88fa8),
      (this.boxEl = _0x5ce481),
      (this.toolbarEl = _0x57b2bd),
      (this.ratioMenuEl = _0x3adef4),
      this._subscribeLocaleChanges(),
      this._syncLocaleTexts(),
      requestAnimationFrame(() => {
        if (this._containerEl) this._containerEl._lastTransform = null;
        if (this.boxEl) this.boxEl._lastTransform = null;
        this._updateView();
      }));
  },
  _updateView(_0xe5a934 = this._view) {
    if (!this.active) return;
    const _0x3e060f = _0xe5a934?.node,
      _0x43a900 = _0xe5a934?.viewport;
    if (!_0x3e060f) return;
    this.nodeData = _0x3e060f;
    const _0x380415 = worldToScreen(this.nodeData.x, this.nodeData.y, _0x43a900),
      _0x58ac8e = {
        w: Math.round(this.nodeData.width * _0x43a900.zoom),
        h: Math.round(this.nodeData.height * _0x43a900.zoom),
      };
    !this._containerEl && (this._containerEl = this.overlayEl.querySelector('.v2-crop-container'));
    const _0x1ae9fa = this._containerEl,
      _0x170141 =
        'translate(' + Math.round(_0x380415.x) + 'px, ' + Math.round(_0x380415.y) + 'px) translateZ(0)';
    _0x1ae9fa._lastTransform !== _0x170141 &&
      ((_0x1ae9fa.style.transform = _0x170141), (_0x1ae9fa._lastTransform = _0x170141));
    ((_0x1ae9fa.style.width = _0x58ac8e.w + 'px'),
      (_0x1ae9fa.style.height = _0x58ac8e.h + 'px'),
      (_0x1ae9fa.style.position = 'fixed'));
    const _0x4c21bd = {
      x: Math.max(0, Math.round((this.cropRect.x - this.nodeData.x) * _0x43a900.zoom)),
      y: Math.max(0, Math.round((this.cropRect.y - this.nodeData.y) * _0x43a900.zoom)),
      w: Math.round(this.cropRect.w * _0x43a900.zoom),
      h: Math.round(this.cropRect.h * _0x43a900.zoom),
    };
    _0x4c21bd.x + _0x4c21bd.w > _0x58ac8e.w && (_0x4c21bd.w = _0x58ac8e.w - _0x4c21bd.x);
    _0x4c21bd.y + _0x4c21bd.h > _0x58ac8e.h && (_0x4c21bd.h = _0x58ac8e.h - _0x4c21bd.y);
    const _0x2730ad = 'translate(' + _0x4c21bd.x + 'px, ' + _0x4c21bd.y + 'px) translateZ(0)';
    this.boxEl._lastTransform !== _0x2730ad &&
      ((this.boxEl.style.transform = _0x2730ad), (this.boxEl._lastTransform = _0x2730ad));
    ((this.boxEl.style.width = _0x4c21bd.w + 'px'),
      (this.boxEl.style.height = _0x4c21bd.h + 'px'),
      (this.boxEl.style.left = '0'),
      (this.boxEl.style.top = '0'));
    if (this.sizeLabelEl) {
      const _0x242e39 = Math.round(this.cropRect.w),
        _0x2763ec = Math.round(this.cropRect.h);
      this.sizeLabelEl.textContent = _0x242e39 + ' × ' + _0x2763ec;
      const _0x1df5d3 = _0x380415.y + _0x4c21bd.y - 32,
        _0x13319f = _0x380415.x + _0x4c21bd.x + _0x4c21bd.w / 2;
      ((this.sizeLabelEl.style.top = _0x1df5d3 + 'px'), (this.sizeLabelEl.style.left = _0x13319f + 'px'));
    }
    if (this.toolbarEl) {
      const _0xebcccb = _0x380415.y + _0x58ac8e.h + 14 * _0x43a900.zoom,
        _0x40bf39 = _0x380415.x + _0x58ac8e.w / 2;
      ((this.toolbarEl.style.top = _0xebcccb + 'px'),
        (this.toolbarEl.style.left = _0x40bf39 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'));
    }
    if (this.dimMaskEl) {
      const _0x4cd365 = _0x380415.x + _0x4c21bd.x,
        _0x363376 = _0x380415.y + _0x4c21bd.y,
        _0x275ce6 = _0x4c21bd.w,
        _0x38879e = _0x4c21bd.h,
        _0x3a5fd4 =
          'polygon(\n        0% 0%, 100% 0%, 100% 100%, 0% 100%,\n        0% 0%,\n        ' +
          _0x4cd365 +
          'px ' +
          _0x363376 +
          'px,\n        ' +
          _0x4cd365 +
          'px ' +
          (_0x363376 + _0x38879e) +
          'px,\n        ' +
          (_0x4cd365 + _0x275ce6) +
          'px ' +
          (_0x363376 + _0x38879e) +
          'px,\n        ' +
          (_0x4cd365 + _0x275ce6) +
          'px ' +
          _0x363376 +
          'px,\n        ' +
          _0x4cd365 +
          'px ' +
          _0x363376 +
          'px\n      )';
      this.dimMaskEl.style.clipPath = _0x3a5fd4;
    }
  },
  _applyRedrawVisualState() {
    const _0x2d6e1b = this._redrawSelection?.mode || '',
      _0x56a557 = _0x2d6e1b === 'armed' || _0x2d6e1b === 'dragging',
      _0x489e51 = _0x2d6e1b === 'dragging';
    for (const _0x276a64 of [this.overlayEl, this.dimMaskEl, this.sizeLabelEl]) {
      (_0x276a64?.classList?.toggle('is-redraw-armed', _0x56a557),
        _0x276a64?.classList?.toggle('is-redraw-dragging', _0x489e51));
    }
  },
  _isPointInsideNode(_0x8f03b4) {
    if (!this.nodeData || !_0x8f03b4) return false;
    return (
      _0x8f03b4.x >= this.nodeData.x &&
      _0x8f03b4.x <= this.nodeData.x + this.nodeData.width &&
      _0x8f03b4.y >= this.nodeData.y &&
      _0x8f03b4.y <= this.nodeData.y + this.nodeData.height
    );
  },
  _getWorldPointFromEvent(_0x109177) {
    const _0x12e8ee = this._view?.viewport || { x: 0, y: 0, zoom: 1 };
    return screenToWorld(_0x109177.clientX, _0x109177.clientY, _0x12e8ee);
  },
  _enterRedrawSelectionMode() {
    if (!this.active) return;
    const _0x571e03 = this._redrawSelection?.mode || '';
    if (_0x571e03 === 'dragging') return;
    (_0x571e03 !== 'armed' &&
      (this._redrawSelection = {
        mode: 'armed',
        previousRect: { ...this.cropRect },
        pointerId: null,
        startPoint: null,
      }),
      this._applyRedrawVisualState());
  },
  _exitRedrawSelectionMode({ restore: restore = true } = {}) {
    const _0x168964 = this._redrawSelection?.previousRect;
    ((this._redrawSelection = null),
      restore && _0x168964 && ((this.cropRect = { ..._0x168964 }), this._updateView(this._view)),
      this._applyRedrawVisualState());
  },
  _beginRedrawSelection(_0x8fb92a) {
    const _0xf1130c = this._getWorldPointFromEvent(_0x8fb92a);
    if (!this._isPointInsideNode(_0xf1130c)) return false;
    const _0x472662 = this._redrawSelection?.previousRect || { ...this.cropRect };
    return (
      (this._redrawSelection = {
        mode: 'dragging',
        previousRect: _0x472662,
        pointerId: _0x8fb92a.pointerId,
        startPoint: _0xf1130c,
        lastResult: null,
      }),
      (this.cropRect = { x: _0xf1130c.x, y: _0xf1130c.y, w: 0, h: 0 }),
      this._applyRedrawVisualState(),
      this._updateView(this._view),
      this.overlayEl?.setPointerCapture?.(_0x8fb92a.pointerId),
      true
    );
  },
  _updateRedrawSelection(_0x223c2f) {
    const _0x45022a = this._redrawSelection;
    if (_0x45022a?.mode !== 'dragging') return;
    const _0x238eb1 = this._getWorldPointFromEvent(_0x223c2f),
      _0x5b38ba = buildImageCropDragRect({
        startPoint: _0x45022a.startPoint,
        currentPoint: _0x238eb1,
        node: this.nodeData,
        aspectRatio: this.aspectRatio,
        minSize: IMAGE_CROP_MIN_SIZE,
      });
    ((_0x45022a.lastResult = _0x5b38ba),
      _0x5b38ba?.rect && ((this.cropRect = { ..._0x5b38ba.rect }), this._updateView(this._view)));
  },
  _finishRedrawSelection(_0x5301e0, { cancel: cancel = false } = {}) {
    const _0x43f55b = this._redrawSelection;
    if (_0x43f55b?.mode !== 'dragging') return;
    !cancel && this._updateRedrawSelection(_0x5301e0);
    const _0x4cd7bd = _0x43f55b.lastResult,
      _0x85a3af = _0x43f55b.previousRect,
      _0x21fa6f = !cancel && _0x4cd7bd?.isValid && _0x4cd7bd?.rect ? { ..._0x4cd7bd.rect } : _0x85a3af;
    this._redrawSelection = null;
    _0x21fa6f && (this.cropRect = { ..._0x21fa6f });
    try {
      this.overlayEl?.releasePointerCapture?.(_0x43f55b.pointerId);
    } catch {}
    (this._applyRedrawVisualState(), this._updateView(this._view));
  },
  _bindEvents() {
    const _0x25a7d3 = (_0x171dac) => _0x171dac.stopPropagation();
    this.overlayEl.addEventListener('wheel', _0x25a7d3, { passive: false });
    const _0x5a0cf9 = () => this._updateView(this._view);
    window.addEventListener('resize', _0x5a0cf9);
    let _0x2ca894 = false,
      _0x1d48cc = { x: 0, y: 0 },
      _0x3bc26f = { ...this.cropRect },
      _0x391f77 = null;
    const _0x2ae28c = (_0x264783) => {
      if (_0x264783.key === 'Escape') {
        if (this._redrawSelection?.mode === 'dragging') {
          this._finishRedrawSelection(_0x264783, { cancel: true });
          return;
        }
        this.exit();
        return;
      }
      _0x264783.key === 'Control' && !_0x2ca894 && !_0x391f77 && this._enterRedrawSelectionMode();
    };
    window.addEventListener('keydown', _0x2ae28c);
    const _0xfd617d = (_0x4afb02) => {
      if (_0x4afb02.key !== 'Control') return;
      this._redrawSelection?.mode === 'armed' && this._exitRedrawSelectionMode({ restore: true });
    };
    window.addEventListener('keyup', _0xfd617d);
    const _0x42c141 = (_0x5d4145) => {
        if (!_0x5d4145.ctrlKey || _0x2ca894 || _0x391f77) return;
        if (!this._beginRedrawSelection(_0x5d4145)) return;
        (_0x5d4145.preventDefault(), _0x5d4145.stopPropagation());
      },
      _0x533e1e = (_0x31b71b) => {
        if (
          this._redrawSelection?.mode !== 'dragging' ||
          this._redrawSelection.pointerId !== _0x31b71b.pointerId
        )
          return;
        (_0x31b71b.preventDefault(), _0x31b71b.stopPropagation(), this._updateRedrawSelection(_0x31b71b));
      },
      _0x2b4050 = (_0x3df1ff) => {
        if (
          this._redrawSelection?.mode !== 'dragging' ||
          this._redrawSelection.pointerId !== _0x3df1ff.pointerId
        )
          return;
        (_0x3df1ff.preventDefault(), _0x3df1ff.stopPropagation(), this._finishRedrawSelection(_0x3df1ff));
      },
      _0x2470b0 = (_0x12f4c7) => {
        if (
          this._redrawSelection?.mode !== 'dragging' ||
          this._redrawSelection.pointerId !== _0x12f4c7.pointerId
        )
          return;
        (_0x12f4c7.preventDefault(),
          _0x12f4c7.stopPropagation(),
          this._finishRedrawSelection(_0x12f4c7, { cancel: true }));
      };
    (this.overlayEl.addEventListener('pointerdown', _0x42c141, true),
      this.overlayEl.addEventListener('pointermove', _0x533e1e, true),
      this.overlayEl.addEventListener('pointerup', _0x2b4050, true),
      this.overlayEl.addEventListener('pointercancel', _0x2470b0, true),
      this.boxEl.addEventListener('pointerdown', (_0x10c274) => {
        if (_0x10c274.target.classList.contains('v2-crop-handle')) return;
        if (_0x10c274.ctrlKey) return;
        (_0x10c274.stopPropagation(),
          (_0x2ca894 = true),
          (_0x1d48cc = { x: _0x10c274.clientX, y: _0x10c274.clientY }),
          (_0x3bc26f = { ...this.cropRect }),
          this.boxEl.setPointerCapture(_0x10c274.pointerId));
      }),
      this.boxEl.addEventListener('pointermove', (_0x2080b4) => {
        if (!_0x2ca894) return;
        const _0x531b19 = this._view?.viewport?.zoom || 1,
          _0x4a05da = (_0x2080b4.clientX - _0x1d48cc.x) / _0x531b19,
          _0x16da72 = (_0x2080b4.clientY - _0x1d48cc.y) / _0x531b19;
        let _0x3d6e3a = _0x3bc26f.x + _0x4a05da,
          _0x25c912 = _0x3bc26f.y + _0x16da72;
        const _0x45a0ca = IMAGE_CROP_MIN_SIZE,
          _0x44d736 = IMAGE_CROP_MIN_SIZE;
        ((_0x3d6e3a = Math.max(
          this.nodeData.x,
          Math.min(_0x3d6e3a, this.nodeData.x + this.nodeData.width - this.cropRect.w),
        )),
          (_0x25c912 = Math.max(
            this.nodeData.y,
            Math.min(_0x25c912, this.nodeData.y + this.nodeData.height - this.cropRect.h),
          )),
          (this.cropRect.x = _0x3d6e3a),
          (this.cropRect.y = _0x25c912),
          this._updateView(this._view));
      }));
    const _0x3a3178 = () => {
      _0x2ca894 = false;
    };
    (this.boxEl.addEventListener('pointerup', _0x3a3178),
      this.boxEl.addEventListener('pointercancel', _0x3a3178),
      this.boxEl.addEventListener('pointerdown', (_0x285b2b) => {
        const _0x397dba = _0x285b2b.target.closest('.v2-crop-handle');
        if (!_0x397dba) return;
        if (_0x285b2b.ctrlKey) return;
        (_0x285b2b.stopPropagation(),
          (_0x391f77 = _0x397dba.dataset.handle),
          (_0x1d48cc = { x: _0x285b2b.clientX, y: _0x285b2b.clientY }),
          (_0x3bc26f = { ...this.cropRect }),
          _0x397dba.setPointerCapture(_0x285b2b.pointerId));
      }),
      this.boxEl.addEventListener('pointermove', (_0x4704e9) => {
        if (!_0x391f77) return;
        const _0x3e0727 = this._view?.viewport?.zoom || 1,
          _0x1b6dd1 = (_0x4704e9.clientX - _0x1d48cc.x) / _0x3e0727,
          _0x58cc59 = (_0x4704e9.clientY - _0x1d48cc.y) / _0x3e0727;
        let { x: _0x3347e9, y: _0x41e8a1, w: _0x4f226b, h: _0x19ab47 } = _0x3bc26f;
        const _0x1ac92f = (_0x4bf8ed, _0x1eb98a) => {
            const _0x3fddc4 = IMAGE_CROP_MIN_SIZE;
            if (_0x1eb98a) {
              const _0x41a512 = _0x3bc26f.x + _0x3bc26f.w - _0x3fddc4;
              ((_0x3347e9 = Math.max(this.nodeData.x, Math.min(_0x3bc26f.x + _0x1b6dd1, _0x41a512))),
                (_0x4f226b = _0x3bc26f.w - (_0x3347e9 - _0x3bc26f.x)));
            } else
              _0x4f226b = Math.max(
                _0x3fddc4,
                Math.min(_0x4bf8ed, this.nodeData.x + this.nodeData.width - _0x3347e9),
              );
          },
          _0x5a97ec = (_0x48a269, _0x23ba93) => {
            const _0x30b16e = IMAGE_CROP_MIN_SIZE;
            if (_0x23ba93) {
              const _0x823ec9 = _0x3bc26f.y + _0x3bc26f.h - _0x30b16e;
              ((_0x41e8a1 = Math.max(this.nodeData.y, Math.min(_0x3bc26f.y + _0x58cc59, _0x823ec9))),
                (_0x19ab47 = _0x3bc26f.h - (_0x41e8a1 - _0x3bc26f.y)));
            } else
              _0x19ab47 = Math.max(
                _0x30b16e,
                Math.min(_0x48a269, this.nodeData.y + this.nodeData.height - _0x41e8a1),
              );
          };
        if (_0x391f77.includes('r')) _0x1ac92f(_0x3bc26f.w + _0x1b6dd1, false);
        if (_0x391f77.includes('l')) _0x1ac92f(_0x3bc26f.w - _0x1b6dd1, true);
        if (_0x391f77.includes('b')) _0x5a97ec(_0x3bc26f.h + _0x58cc59, false);
        if (_0x391f77.includes('t')) _0x5a97ec(_0x3bc26f.h - _0x58cc59, true);
        if (this.aspectRatio) {
          if (_0x391f77 === 'tm' || _0x391f77 === 'bm' || _0x391f77 === 'lm' || _0x391f77 === 'rm')
            _0x391f77.includes('m') &&
              (_0x391f77 === 'tm' || _0x391f77 === 'bm'
                ? ((_0x4f226b = _0x19ab47 * this.aspectRatio),
                  (_0x3347e9 = _0x3bc26f.x + (_0x3bc26f.w - _0x4f226b) / 2))
                : ((_0x19ab47 = _0x4f226b / this.aspectRatio),
                  (_0x41e8a1 = _0x3bc26f.y + (_0x3bc26f.h - _0x19ab47) / 2)));
          else {
            const _0x3ab2fd = _0x4f226b / _0x19ab47;
            _0x3ab2fd > this.aspectRatio
              ? (_0x19ab47 = _0x4f226b / this.aspectRatio)
              : (_0x4f226b = _0x19ab47 * this.aspectRatio);
            if (_0x391f77.includes('t')) _0x41e8a1 = _0x3bc26f.y + _0x3bc26f.h - _0x19ab47;
            if (_0x391f77.includes('l')) _0x3347e9 = _0x3bc26f.x + _0x3bc26f.w - _0x4f226b;
          }
          (_0x3347e9 < this.nodeData.x &&
            ((_0x3347e9 = this.nodeData.x), (_0x4f226b = _0x19ab47 * this.aspectRatio)),
            _0x41e8a1 < this.nodeData.y &&
              ((_0x41e8a1 = this.nodeData.y), (_0x19ab47 = _0x4f226b / this.aspectRatio)),
            _0x3347e9 + _0x4f226b > this.nodeData.x + this.nodeData.width &&
              ((_0x4f226b = this.nodeData.x + this.nodeData.width - _0x3347e9),
              (_0x19ab47 = _0x4f226b / this.aspectRatio)),
            _0x41e8a1 + _0x19ab47 > this.nodeData.y + this.nodeData.height &&
              ((_0x19ab47 = this.nodeData.y + this.nodeData.height - _0x41e8a1),
              (_0x4f226b = _0x19ab47 * this.aspectRatio)));
        }
        ((this.cropRect = { x: _0x3347e9, y: _0x41e8a1, w: _0x4f226b, h: _0x19ab47 }), this._updateView());
      }));
    const _0x16175c = () => {
      _0x391f77 = null;
    };
    (this.boxEl.addEventListener('pointerup', _0x16175c),
      this.boxEl.addEventListener('pointercancel', _0x16175c),
      (this.toolbarEl.querySelector('.exit').onclick = () => this.exit()));
    const _0x45c438 = this.toolbarEl.querySelector('.ratio-toggle');
    ((_0x45c438.onclick = (_0x25ec60) => {
      (_0x25ec60.stopPropagation(), this.ratioMenuEl.classList.toggle('open'));
    }),
      (this.ratioMenuEl.onclick = (_0x2c767d) => {
        const _0x410d52 = _0x2c767d.target.closest('.v2-crop-ratio-item');
        if (!_0x410d52) return;
        (this.ratioMenuEl
          .querySelectorAll('.v2-crop-ratio-item')
          .forEach((_0x2b7cd4) => _0x2b7cd4.classList.remove('active')),
          _0x410d52.classList.add('active'),
          this.ratioMenuEl.classList.remove('open'));
        const _0x54dde2 = _0x410d52.dataset.ratio,
          _0xd302a3 = _0x410d52.querySelector('.floating-menu-label')?.textContent || _0x410d52.textContent;
        this.toolbarEl.querySelector('.ratio-text').textContent = _0xd302a3;
        if (_0x54dde2 === 'free') {
          ((this.aspectRatio = null), this._updateView(this._view));
          return;
        }
        if (_0x54dde2 === 'original') this.aspectRatio = this.nodeData.width / this.nodeData.height;
        else {
          const [_0x358751, _0x594038] = _0x54dde2.split(':').map(Number);
          if (
            !Number.isFinite(_0x358751) ||
            !Number.isFinite(_0x594038) ||
            _0x358751 <= 0 ||
            _0x594038 <= 0
          ) {
            ((this.aspectRatio = null), this._updateView(this._view));
            return;
          }
          this.aspectRatio = _0x358751 / _0x594038;
        }
        let _0x3b29b0 = this.cropRect.w,
          _0x10b20e = _0x3b29b0 / this.aspectRatio;
        (_0x10b20e > this.nodeData.height &&
          ((_0x10b20e = this.nodeData.height), (_0x3b29b0 = _0x10b20e * this.aspectRatio)),
          _0x3b29b0 > this.nodeData.width &&
            ((_0x3b29b0 = this.nodeData.width), (_0x10b20e = _0x3b29b0 / this.aspectRatio)),
          (this.cropRect.w = _0x3b29b0),
          (this.cropRect.h = _0x10b20e),
          (this.cropRect.x = this.nodeData.x + (this.nodeData.width - _0x3b29b0) / 2),
          (this.cropRect.y = this.nodeData.y + (this.nodeData.height - _0x10b20e) / 2),
          this._updateView(this._view));
      }),
      (this.toolbarEl.querySelector('.confirm').onclick = () => this.confirm()));
    const _0x597d0 = (_0x51104b) => {
      !this.ratioMenuEl.contains(_0x51104b.target) &&
        !_0x45c438.contains(_0x51104b.target) &&
        this.ratioMenuEl.classList.remove('open');
    };
    (document.addEventListener('pointerdown', _0x597d0),
      (this.cleanup = () => {
        (window.removeEventListener('resize', _0x5a0cf9),
          window.removeEventListener('keydown', _0x2ae28c),
          window.removeEventListener('keyup', _0xfd617d),
          document.removeEventListener('pointerdown', _0x597d0),
          this.overlayEl.removeEventListener('wheel', _0x25a7d3),
          this.overlayEl.removeEventListener('pointerdown', _0x42c141, true),
          this.overlayEl.removeEventListener('pointermove', _0x533e1e, true),
          this.overlayEl.removeEventListener('pointerup', _0x2b4050, true),
          this.overlayEl.removeEventListener('pointercancel', _0x2470b0, true));
      }));
  },
  _subscribeLocaleChanges() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  },
  _setButtonText(_0x20b08a, _0xaaf78d) {
    if (!_0x20b08a) return;
    const _0x18b6cf = Array.from(_0x20b08a.childNodes).find((_0x12af06) => _0x12af06.nodeType === 3);
    if (_0x18b6cf) {
      _0x18b6cf.textContent = ' ' + _0xaaf78d;
      return;
    }
    _0x20b08a.appendChild(document.createTextNode(' ' + _0xaaf78d));
  },
  _syncLocaleTexts() {
    if (!this.toolbarEl) return;
    const _0x359961 = this.toolbarEl.querySelector('.exit');
    if (_0x359961) _0x359961.title = imageCropText('actions.exit');
    this.ratioMenuEl?.querySelectorAll('.v2-crop-ratio-item[data-ratio-label-key]').forEach((_0x54f254) => {
      const _0x54833b = _0x54f254.dataset.ratioLabelKey,
        _0x52d441 = _0x54f254.querySelector('.floating-menu-label');
      if (_0x54833b && _0x52d441) _0x52d441.textContent = imageCropText('ratios.' + _0x54833b);
    });
    const _0x4b8b9c = this.ratioMenuEl?.querySelector('.v2-crop-ratio-item.active .floating-menu-label'),
      _0x12efb5 = this.toolbarEl.querySelector('.ratio-text');
    if (_0x4b8b9c && _0x12efb5) _0x12efb5.textContent = _0x4b8b9c.textContent;
    const _0x13c8ff = this.toolbarEl.querySelector('.confirm');
    _0x13c8ff && !this._isProcessingCrop && this._setButtonText(_0x13c8ff, imageCropText('actions.confirm'));
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
    const _0x328f4e = this.toolbarEl.querySelector('.confirm'),
      _0x12c1b9 = Array.from(_0x328f4e.childNodes).map((_0x28b70d) => _0x28b70d.cloneNode(true));
    ((this._isProcessingCrop = true),
      (_0x328f4e.textContent = imageCropText('actions.processing')),
      (_0x328f4e.style.pointerEvents = 'none'));
    try {
      const _0x4acc38 = this.nodeData.localPath
          ? '/' + this.nodeData.localPath
          : this.nodeData.src || this.nodeData.sourceUrl,
        _0x146407 = await this._loadImage(_0x4acc38),
        _0x2e0a8f = _0x146407.naturalWidth / this.nodeData.width,
        _0x330284 = _0x146407.naturalHeight / this.nodeData.height,
        _0x528178 = (this.cropRect.x - this.nodeData.x) * _0x2e0a8f,
        _0x5bb8ef = (this.cropRect.y - this.nodeData.y) * _0x330284,
        _0x36d8b4 = this.cropRect.w * _0x2e0a8f,
        _0x1fe1da = this.cropRect.h * _0x330284,
        _0x4353a2 = document.createElement('canvas');
      ((_0x4353a2.width = _0x36d8b4), (_0x4353a2.height = _0x1fe1da));
      const _0x22e57b = _0x4353a2.getContext('2d');
      _0x22e57b.drawImage(_0x146407, _0x528178, _0x5bb8ef, _0x36d8b4, _0x1fe1da, 0, 0, _0x36d8b4, _0x1fe1da);
      const _0x23a9b3 = await new Promise((_0x4ece65) => _0x4353a2.toBlob(_0x4ece65, 'image/jpeg', 0.9)),
        _0x283a1d = new File([_0x23a9b3], 'crop_' + Date.now() + '.jpg', { type: 'image/jpeg' }),
        _0x18db0b = await saveOutputBlob(_0x283a1d, { ext: 'jpg' }),
        _0xaef050 = pickResultLocalPath(_0x18db0b),
        _0x66ccb8 = String(_0x18db0b.url || '').trim() || localPathToUrl(_0xaef050),
        _0x321bb0 = getAutoMediaSizeByShortSide(this.cropRect.w, this.cropRect.h),
        _0xaca8b9 = calcSafeSpawnPosNearNode(
          appStore.getStateRaw().nodes,
          this.nodeData,
          _0x321bb0.width,
          _0x321bb0.height,
        ),
        _0x333419 = _0xaca8b9.x,
        _0x23492b = _0xaca8b9.y,
        _0x25e433 = generateId('source-image-crop');
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: _0x25e433,
          type: 'source-image',
          x: _0x333419,
          y: _0x23492b,
          width: _0x321bb0.width,
          height: _0x321bb0.height,
          name: imageCropText('output.nodeName', {
            name: this.nodeData.name || imageCropText('output.imageFallback'),
          }),
          src: _0x66ccb8,
          localPath: _0xaef050,
          fileName: _0x18db0b.filename || _0x283a1d.name,
          needsAutoResize: false,
        }),
      ),
        appStore.setSelectedNodes([_0x25e433]),
        window.v2FocusOnNodes && window.v2FocusOnNodes([this.nodeData.id, _0x25e433]),
        window._triggerLocalCacheSave?.(),
        window.showToast?.(imageCropText('toasts.success'), 'success'),
        this.exit());
    } catch (_0x508fbb) {
      (console.error('[Crop] Failed:', _0x508fbb),
        window.showToast?.(imageCropText('toasts.failed', { error: _0x508fbb.message }), 'error'),
        (this._isProcessingCrop = false),
        _0x328f4e.replaceChildren(..._0x12c1b9.map((_0x4f3b8c) => _0x4f3b8c.cloneNode(true))),
        (_0x328f4e.style.pointerEvents = 'auto'));
    }
  },
  _loadImage(_0x240194) {
    return new Promise((_0x2f7cbe, _0x3c62a5) => {
      const _0x2e4ac9 = new Image();
      ((_0x2e4ac9.crossOrigin = 'anonymous'),
        (_0x2e4ac9.onload = () => _0x2f7cbe(_0x2e4ac9)),
        (_0x2e4ac9.onerror = () => _0x3c62a5(new Error(imageCropText('errors.sourceLoadFailed')))),
        (_0x2e4ac9.src = _0x240194));
    });
  },
};
export default ImageCropController;
