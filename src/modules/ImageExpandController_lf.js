import appStore from '../core/stores/appStore.js';
import { worldToScreen, generateId } from '../core/math.js';
import { getDisplayModelName } from './providers.js';
import {
  IMAGE_MODELS,
  getModelDisplayName,
  getModelProvider,
  getProviderIconHtml,
} from '../config/modelConfig.js';
import { generateImage } from '../../api/aiImageApi.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const ImageExpandController = {
  active: false,
  nodeId: null,
  nodeData: null,
  ratioStr: 'original',
  imageSize: '1K',
  model: null,
  provider: null,
  overlayEl: null,
  frameEl: null,
  frameRect: null,
  _pointerState: null,
  imgEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  sizeMenuEl: null,
  modelMenuEl: null,
  _unsubscribe: null,
  _view: null,
  cleanup: null,
  init(_0x1f67ea) {
    if (this.active) return;
    const _0x12f190 = appStore.getStateRaw(),
      _0x518b8d = _0x12f190.nodes?.[_0x1f67ea];
    if (!_0x518b8d) return;
    ((this.active = true),
      (this.nodeId = _0x1f67ea),
      (this.nodeData = _0x518b8d),
      (this._view = { viewport: _0x12f190.viewport, node: _0x518b8d }),
      (this.ratioStr = 'original'),
      (this.imageSize = '1K'));
    const _0x30d4c0 = Object.keys(IMAGE_MODELS)[0],
      _0x4a5e2c = IMAGE_MODELS[_0x30d4c0].models[0];
    ((this.model = _0x4a5e2c.id),
      (this.provider = _0x30d4c0),
      this._createUI(),
      this._bindEvents(),
      (this._unsubscribe = appStore.subscribeSelector(
        (_0x1b5f1d) => {
          const _0x4d8c62 = _0x1b5f1d.nodes?.[_0x1f67ea],
            _0x4322b2 = _0x1b5f1d.viewport || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!_0x4d8c62,
            vx: _0x4322b2.x,
            vy: _0x4322b2.y,
            vz: _0x4322b2.zoom || 1,
            nx: _0x4d8c62 ? _0x4d8c62.x : 0,
            ny: _0x4d8c62 ? _0x4d8c62.y : 0,
            nw: _0x4d8c62 ? _0x4d8c62.width : 0,
            nh: _0x4d8c62 ? _0x4d8c62.height : 0,
          };
        },
        (_0x576016) => {
          if (!_0x576016?.hasNode) return;
          const _0x1ff6b1 = appStore.getStateRaw().nodes?.[_0x1f67ea];
          if (!_0x1ff6b1) return;
          ((this.nodeData = _0x1ff6b1),
            (this._view = {
              viewport: { x: _0x576016.vx, y: _0x576016.vy, zoom: _0x576016.vz },
              node: _0x1ff6b1,
            }),
            this._updateView(this._view));
        },
      )),
      this._waitForImageAndShow());
  },
  _waitForImageAndShow() {
    const _0x2aae0e = () => {
      this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0
        ? (this._updateView(this._view),
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          }))
        : requestAnimationFrame(_0x2aae0e);
    };
    _0x2aae0e();
  },
  _getImageUrl() {
    const _0x4dc8c1 = this.nodeData || {};
    return localPathToUrl(_0x4dc8c1.localPath) || _0x4dc8c1.src || _0x4dc8c1.imageUrl || _0x4dc8c1.sourceUrl;
  },
  _createExpandedImage(_0x15c057, _0x2bc872) {
    return new Promise((_0x5d10c8, _0x1120fb) => {
      const _0x2af496 = new Image();
      ((_0x2af496.crossOrigin = 'anonymous'),
        (_0x2af496.onload = async () => {
          try {
            const _0x4538e0 = document.createElement('canvas'),
              _0xbcc15b = _0x4538e0.getContext('2d'),
              _0x337fa1 = _0x2af496.naturalWidth,
              _0xdc4f3c = _0x2af496.naturalHeight,
              _0x272a4f = _0x15c057,
              _0x131679 = {
                x: _0x2bc872.x || 0,
                y: _0x2bc872.y || 0,
                w: _0x2bc872.width || 1,
                h: _0x2bc872.height || 1,
              },
              _0x59602b = _0x337fa1 / _0x131679.w,
              _0x35462e = _0xdc4f3c / _0x131679.h,
              _0x31de8e = Math.round(_0x272a4f.w * _0x59602b),
              _0x22f36b = Math.round(_0x272a4f.h * _0x35462e);
            ((_0x4538e0.width = _0x31de8e),
              (_0x4538e0.height = _0x22f36b),
              (_0xbcc15b.fillStyle = '#000'),
              _0xbcc15b.fillRect(0, 0, _0x31de8e, _0x22f36b));
            const _0x2debc1 = Math.round((_0x131679.x - _0x272a4f.x) * _0x59602b),
              _0x11b47a = Math.round((_0x131679.y - _0x272a4f.y) * _0x35462e);
            (_0xbcc15b.drawImage(_0x2af496, _0x2debc1, _0x11b47a, _0x337fa1, _0xdc4f3c),
              _0x4538e0.toBlob((_0x182bb7) => {
                if (_0x182bb7) {
                  const _0xf63ffc = URL.createObjectURL(_0x182bb7);
                  _0x5d10c8(_0xf63ffc);
                } else _0x1120fb(new Error('无法创建扩展图像'));
              }, 'image/png'));
          } catch (_0xbffaa3) {
            _0x1120fb(_0xbffaa3);
          }
        }),
        (_0x2af496.onerror = () => {
          _0x1120fb(new Error('无法加载原始图像'));
        }));
      const _0x5767cf =
        localPathToUrl(_0x2bc872.localPath) || _0x2bc872.src || _0x2bc872.imageUrl || _0x2bc872.sourceUrl;
      _0x2af496.src = _0x5767cf;
    });
  },
  _parseRatio() {
    if (this.ratioStr === 'original') return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    const _0x28c701 = this.ratioStr.split(':').map((_0x2ea0ac) => Number(_0x2ea0ac));
    if (_0x28c701.length !== 2 || !_0x28c701[0] || !_0x28c701[1])
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    return _0x28c701[0] / _0x28c701[1];
  },
  _calcFrameWorldRect() {
    const _0x2275a7 = this.nodeData,
      _0x19dd68 = _0x2275a7.width || 1,
      _0x2c9dec = _0x2275a7.height || 1,
      _0xdaed3b = _0x2275a7.x + _0x19dd68 / 2,
      _0x42e580 = _0x2275a7.y + _0x2c9dec / 2,
      _0x271d7a = _0x19dd68 / _0x2c9dec,
      _0x2d03e8 = this._parseRatio();
    let _0x4d5a4f, _0x54a2bb;
    _0x2d03e8 >= _0x271d7a
      ? ((_0x54a2bb = _0x2c9dec), (_0x4d5a4f = _0x2c9dec * _0x2d03e8))
      : ((_0x4d5a4f = _0x19dd68), (_0x54a2bb = _0x19dd68 / _0x2d03e8));
    const _0x3ef962 = 1.35,
      _0x36a698 = Math.max(_0x19dd68, _0x4d5a4f) * _0x3ef962,
      _0x256406 = Math.max(_0x2c9dec, _0x54a2bb) * _0x3ef962;
    return { x: _0xdaed3b - _0x36a698 / 2, y: _0x42e580 - _0x256406 / 2, w: _0x36a698, h: _0x256406 };
  },
  _getNodeWorldRect() {
    const _0x58a997 = this.nodeData || {},
      _0x1bd326 = _0x58a997.width || 1,
      _0x2e70e0 = _0x58a997.height || 1;
    return { x: _0x58a997.x || 0, y: _0x58a997.y || 0, w: _0x1bd326, h: _0x2e70e0 };
  },
  _clampFrameRect(_0x3817a1) {
    const _0x3023ab = this._getNodeWorldRect(),
      _0x5aed0a = (_0x30988e, _0x3d51b5, _0xc5aab7) => Math.min(_0xc5aab7, Math.max(_0x3d51b5, _0x30988e)),
      _0xf4ead6 = {
        x: Number(_0x3817a1?.x) || 0,
        y: Number(_0x3817a1?.y) || 0,
        w: Number(_0x3817a1?.w) || 1,
        h: Number(_0x3817a1?.h) || 1,
      },
      _0x33c27e = Math.max(_0x3023ab.w, 24),
      _0x4b3b7a = Math.max(_0x3023ab.h, 24);
    ((_0xf4ead6.w = Math.max(_0xf4ead6.w, _0x33c27e)), (_0xf4ead6.h = Math.max(_0xf4ead6.h, _0x4b3b7a)));
    if (this.ratioStr !== 'original') {
      const _0x4f77ea = this._parseRatio(),
        _0x490752 = _0xf4ead6.x + _0xf4ead6.w / 2,
        _0x236560 = _0xf4ead6.y + _0xf4ead6.h / 2;
      let _0x53fd8d = _0xf4ead6.w,
        _0x45a778 = _0xf4ead6.h;
      (_0x53fd8d / _0x45a778 > _0x4f77ea
        ? (_0x45a778 = _0x53fd8d / _0x4f77ea)
        : (_0x53fd8d = _0x45a778 * _0x4f77ea),
        _0x53fd8d < _0x33c27e && ((_0x53fd8d = _0x33c27e), (_0x45a778 = _0x53fd8d / _0x4f77ea)),
        _0x45a778 < _0x4b3b7a && ((_0x45a778 = _0x4b3b7a), (_0x53fd8d = _0x45a778 * _0x4f77ea)),
        (_0xf4ead6.w = _0x53fd8d),
        (_0xf4ead6.h = _0x45a778),
        (_0xf4ead6.x = _0x490752 - _0xf4ead6.w / 2),
        (_0xf4ead6.y = _0x236560 - _0xf4ead6.h / 2));
    }
    const _0x495753 = _0x3023ab.x + _0x3023ab.w - _0xf4ead6.w,
      _0x304f60 = _0x3023ab.x,
      _0x6be192 = _0x3023ab.y + _0x3023ab.h - _0xf4ead6.h,
      _0x19bc28 = _0x3023ab.y;
    return (
      (_0xf4ead6.x = _0x5aed0a(_0xf4ead6.x, _0x495753, _0x304f60)),
      (_0xf4ead6.y = _0x5aed0a(_0xf4ead6.y, _0x6be192, _0x19bc28)),
      _0xf4ead6
    );
  },
  _createUI() {
    const _0x132acc = document.createElement('div');
    _0x132acc.className = 'v2-expand-overlay';
    const _0x4c768e = document.createElement('div');
    ((_0x4c768e.className = 'v2-expand-frame'),
      ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'].forEach((_0x26c79c) => {
        const _0x125b4b = document.createElement('div');
        ((_0x125b4b.className = 'v2-expand-handle ' + _0x26c79c),
          (_0x125b4b.dataset.handle = _0x26c79c),
          _0x4c768e.appendChild(_0x125b4b));
      }));
    const _0x41a90d = document.createElement('img');
    ((_0x41a90d.className = 'v2-expand-img'),
      (_0x41a90d.draggable = false),
      (_0x41a90d.src = this._getImageUrl()),
      _0x132acc.appendChild(_0x4c768e),
      _0x132acc.appendChild(_0x41a90d),
      document.body.appendChild(_0x132acc),
      (this.overlayEl = _0x132acc),
      (this.frameEl = _0x4c768e),
      (this.imgEl = _0x41a90d),
      (this.frameRect = this._calcFrameWorldRect()));
    const _0x34f4d5 = document.createElement('div');
    _0x34f4d5.className = 'v2-expand-toolbar';
    const _0x443400 = this.ratioStr === 'original' ? '比例' : this.ratioStr,
      _0x31db1f = getModelDisplayName(this.model);
    let _0x5943e8 = '';
    (Object.entries(IMAGE_MODELS).forEach(([_0x319833, _0x5ae9c9]) => {
      const _0x3074ce = _0x5ae9c9.isTextIcon
        ? '<div style="width:20px;height:20px;border-radius:3px;background:var(--bg-node);color:var(--text-primary);font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          _0x5ae9c9.icon +
          '</div>'
        : '<img src="' +
          _0x5ae9c9.icon +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          _0x319833 +
          '">';
      let _0x2af3c4 = '';
      (_0x5ae9c9.models.forEach((_0x1254dd) => {
        const _0x5e5377 = _0x1254dd.icon || _0x5ae9c9.icon,
          _0x4eecc4 = this.model === _0x1254dd.id ? 'active' : '';
        _0x2af3c4 +=
          '\n          <div class="floating-menu-item ' +
          _0x4eecc4 +
          '" data-value="' +
          _0x1254dd.id +
          '" data-provider="' +
          _0x319833 +
          '" style="display:flex;align-items:center;gap:8px;">\n            <img src="' +
          _0x5e5377 +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          _0x319833 +
          '">\n            <div class="fmi-content">\n              <div class="fmi-title">' +
          _0x1254dd.name +
          '</div>\n              <div class="fmi-sub">' +
          _0x1254dd.description +
          '</div>\n            </div>\n          </div>';
      }),
        (_0x5943e8 +=
          '\n        <div class="' +
          _0x319833 +
          '-group-header floating-menu-item" data-' +
          _0x319833 +
          '-toggle style="display:flex;align-items:center;gap:8px;cursor:var(--link-cursor);">\n          ' +
          _0x3074ce +
          '\n          <div class="fmi-content">\n            <div class="fmi-title">' +
          _0x5ae9c9.name +
          '</div>\n            <div class="fmi-sub">' +
          _0x5ae9c9.description +
          '</div>\n          </div>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;flex-shrink:0;"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="' +
          _0x319833 +
          '-submenu" style="position:absolute;left:calc(100% + 6px);top:0;z-index:1001;width:max-content;max-width:320px;background:var(--bg-2);border:1px solid var(--stroke-08);border-radius:14px;padding:8px;box-shadow:var(--shadow-popover);display:none;flex-direction:column;">\n          ' +
          _0x2af3c4 +
          '\n        </div>'));
    }),
      (_0x34f4d5.innerHTML =
        '\n      <button class="v2-expand-toolbar-btn exit" title="退出(Esc)">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>\n      </button>\n      <div class="v2-expand-divider"></div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn ratio-toggle">\n          <span class="ratio-text">' +
        _0x443400 +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu ratio-menu">\n          <div class="v2-expand-menu-item active" data-type="ratio" data-value="original">原图比例</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="21:9">21:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="16:9">16:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="9:16">9:16</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="4:3">4:3</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="3:4">3:4</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="1:1">1:1</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn size-toggle">\n          <span class="size-text">' +
        this.imageSize +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu size-menu">\n          <div class="v2-expand-menu-item active" data-type="size" data-value="1K">1K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="2K">2K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="4K">4K</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="model-text">' +
        _0x31db1f +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu model-menu">\n          ' +
        _0x5943e8 +
        '\n        </div>\n      </div>\n      <button class="v2-expand-toolbar-btn go" title="生成扩图">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n      </button>\n    '),
      document.body.appendChild(_0x34f4d5),
      (this.toolbarEl = _0x34f4d5),
      (this.ratioMenuEl = _0x34f4d5.querySelector('.ratio-menu')),
      (this.sizeMenuEl = _0x34f4d5.querySelector('.size-menu')),
      (this.modelMenuEl = _0x34f4d5.querySelector('.model-menu')),
      this._updateView(this._view));
  },
  _updateView(_0x2bcec = this._view) {
    if (!this.active) return;
    const _0x1fb959 = _0x2bcec?.node,
      _0x329332 = _0x2bcec?.viewport;
    if (!_0x1fb959) return;
    this.nodeData = _0x1fb959;
    if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
    this.frameRect = this._clampFrameRect(this.frameRect);
    const _0x2f09cb = this.frameRect,
      _0x243394 = worldToScreen(_0x2f09cb.x, _0x2f09cb.y, _0x329332),
      _0x7a9644 = Math.round(_0x2f09cb.w * _0x329332.zoom),
      _0x5277f2 = Math.round(_0x2f09cb.h * _0x329332.zoom);
    ((this.frameEl.style.left = Math.round(_0x243394.x) + 'px'),
      (this.frameEl.style.top = Math.round(_0x243394.y) + 'px'),
      (this.frameEl.style.width = _0x7a9644 + 'px'),
      (this.frameEl.style.height = _0x5277f2 + 'px'));
    const _0xccf0ca = worldToScreen(_0x1fb959.x, _0x1fb959.y, _0x329332),
      _0x63b5a2 = Math.round(_0x1fb959.width * _0x329332.zoom),
      _0x55faf8 = Math.round(_0x1fb959.height * _0x329332.zoom);
    ((this.imgEl.style.left = Math.round(_0xccf0ca.x) + 'px'),
      (this.imgEl.style.top = Math.round(_0xccf0ca.y) + 'px'),
      (this.imgEl.style.width = _0x63b5a2 + 'px'),
      (this.imgEl.style.height = _0x55faf8 + 'px'));
    if (this.toolbarEl) {
      const _0x39dffc = _0xccf0ca.y + _0x55faf8 + 14;
      ((this.toolbarEl.style.top = _0x39dffc + 'px'),
        (this.toolbarEl.style.left = _0xccf0ca.x + _0x63b5a2 / 2 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'),
        (this.toolbarEl.style.bottom = 'auto'));
    }
  },
  _bindEvents() {
    const _0x243187 = () => this._updateView(this._view);
    window.addEventListener('resize', _0x243187);
    const _0x37cc46 = (_0x1b927f) => {
      if (_0x1b927f.key === 'Escape') this.exit();
    };
    window.addEventListener('keydown', _0x37cc46);
    const _0x546502 = (_0x32d684) => _0x32d684.stopPropagation();
    this.overlayEl.addEventListener('wheel', _0x546502, { passive: false });
    const _0x35e290 = () => {
      (this.ratioMenuEl?.classList.remove('open'),
        this.sizeMenuEl?.classList.remove('open'),
        this.modelMenuEl?.classList.remove('show'),
        Object.keys(IMAGE_MODELS).forEach((_0x347e49) => {
          const _0x24cb93 = this.modelMenuEl?.querySelector('.' + _0x347e49 + '-submenu');
          if (_0x24cb93) _0x24cb93.style.display = 'none';
        }));
    };
    this.toolbarEl.querySelector('.exit').onclick = () => this.exit();
    const _0x2eaf1f = this.toolbarEl.querySelector('.ratio-toggle');
    _0x2eaf1f.onclick = (_0x56fd5c) => {
      _0x56fd5c.stopPropagation();
      const _0x4a2a0b = this.ratioMenuEl.classList.toggle('open');
      _0x4a2a0b && (this.sizeMenuEl.classList.remove('open'), this.modelMenuEl.classList.remove('open'));
    };
    const _0x1edf33 = this.toolbarEl.querySelector('.size-toggle');
    _0x1edf33.onclick = (_0x41da54) => {
      _0x41da54.stopPropagation();
      const _0x4769cd = this.sizeMenuEl.classList.toggle('open');
      _0x4769cd && (this.ratioMenuEl.classList.remove('open'), this.modelMenuEl.classList.remove('open'));
    };
    const _0x50e16e = (_0x164244) => {
      const _0x36a83f = _0x164244.target.closest('.v2-expand-menu-item');
      if (!_0x36a83f) return;
      const _0x270bcf = _0x36a83f.dataset.type;
      if (_0x270bcf === 'ratio') {
        ((this.ratioStr = _0x36a83f.dataset.value),
          this.ratioMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((_0x9969d2) => _0x9969d2.classList.toggle('active', _0x9969d2 === _0x36a83f)),
          (this.toolbarEl.querySelector('.ratio-text').textContent =
            this.ratioStr === 'original' ? '比例' : this.ratioStr),
          this.ratioMenuEl.classList.remove('open'),
          (this.frameRect = this._calcFrameWorldRect()),
          this._updateView(this._view));
        return;
      }
      if (_0x270bcf === 'size') {
        ((this.imageSize = _0x36a83f.dataset.value),
          this.sizeMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((_0x6e76e7) => _0x6e76e7.classList.toggle('active', _0x6e76e7 === _0x36a83f)),
          (this.toolbarEl.querySelector('.size-text').textContent = this.imageSize),
          this.sizeMenuEl.classList.remove('open'));
        return;
      }
      if (_0x270bcf === 'model') {
        ((this.model = _0x36a83f.dataset.value),
          (this.provider = _0x36a83f.dataset.provider || getModelProvider(this.model)),
          this.modelMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((_0x562070) => _0x562070.classList.toggle('active', _0x562070 === _0x36a83f)),
          (this.toolbarEl.querySelector('.model-text').textContent = getModelDisplayName(this.model)),
          this.modelMenuEl.classList.remove('open'));
        return;
      }
    };
    ((this.ratioMenuEl.onclick = _0x50e16e),
      (this.sizeMenuEl.onclick = _0x50e16e),
      (this.modelMenuEl.onclick = _0x50e16e));
    const _0x18043d = this.toolbarEl.querySelector('.model-toggle'),
      _0x4226b0 = this.modelMenuEl,
      _0x1a45c6 = this.toolbarEl.querySelector('.model-text');
    _0x18043d &&
      _0x4226b0 &&
      _0x1a45c6 &&
      (_0x18043d.addEventListener('click', (_0x3adb2e) => {
        (_0x3adb2e.stopPropagation(),
          _0x4226b0.classList.toggle('show'),
          this.ratioMenuEl.classList.remove('open'),
          this.sizeMenuEl.classList.remove('open'));
      }),
      Object.keys(IMAGE_MODELS).forEach((_0x779084) => {
        const _0x58fb4f = _0x4226b0.querySelector('[data-' + _0x779084 + '-toggle]'),
          _0x54800d = _0x4226b0.querySelector('.' + _0x779084 + '-submenu');
        if (!_0x58fb4f || !_0x54800d) return;
        let _0x1dfdf8 = null;
        const _0x5f30e7 = () => {
            (clearTimeout(_0x1dfdf8), (_0x54800d.style.display = 'flex'));
          },
          _0x145038 = (_0xdeeb37 = 120) => {
            _0x1dfdf8 = setTimeout(() => {
              _0x54800d.style.display = 'none';
            }, _0xdeeb37);
          };
        (_0x58fb4f.addEventListener('mouseenter', _0x5f30e7),
          _0x58fb4f.addEventListener('mouseleave', () => _0x145038()),
          _0x54800d.addEventListener('mouseenter', _0x5f30e7),
          _0x54800d.addEventListener('mouseleave', () => _0x145038()),
          _0x54800d.querySelectorAll('.floating-menu-item').forEach((_0x58710e) => {
            _0x58710e.addEventListener('click', () => {
              const _0x365eb8 = _0x58710e.dataset.value,
                _0x561773 = _0x58710e.dataset.provider || _0x779084,
                _0x54b918 = _0x58710e.querySelector('.fmi-title');
              ((_0x1a45c6.textContent = _0x54b918 ? _0x54b918.textContent : getModelDisplayName(_0x365eb8)),
                (this.model = _0x365eb8),
                (this.provider = _0x561773),
                appStore.updateNodeData(this.nodeId, { model: _0x365eb8, provider: _0x561773 }),
                _0x4226b0
                  .querySelectorAll('.floating-menu-item')
                  .forEach((_0x43ebed) => _0x43ebed.classList.remove('active')),
                _0x58710e.classList.add('active'),
                _0x4226b0.classList.remove('show'),
                (_0x54800d.style.display = 'none'));
            });
          }));
      }));
    this.toolbarEl.querySelector('.go').onclick = async () => {
      try {
        window.showToast?.('正在生成扩图...', 'loading');
        const _0x3c2c85 = appStore.getStateRaw(),
          _0x5ad4f5 = _0x3c2c85.nodes?.[this.nodeId];
        if (!_0x5ad4f5) return;
        const _0x1663b1 = { ...this.frameRect };
        let _0x21cc02, _0x358106;
        const _0x21cfda =
            this.ratioStr === 'original'
              ? _0x5ad4f5.width / _0x5ad4f5.height
              : parseInt(this.ratioStr.split(':')[0]) / parseInt(this.ratioStr.split(':')[1]),
          _0x1f200d = getAutoMediaSizeByShortSide(_0x21cfda, 1);
        ((_0x21cc02 = _0x1f200d.width), (_0x358106 = _0x1f200d.height));
        const { x: _0x35a214, y: _0x441971 } = calcSafeSpawnPosNearNode(
            _0x3c2c85.nodes,
            _0x5ad4f5,
            _0x21cc02,
            _0x358106,
          ),
          _0x11bdd4 = generateId('source-image-expand');
        (appStore.addNode(
          buildSourceMediaNodePayload({
            id: _0x11bdd4,
            type: 'source-image',
            x: _0x35a214,
            y: _0x441971,
            width: _0x21cc02,
            height: _0x358106,
            name: '扩图生成中...',
            src: '',
            isGenerating: true,
            outputText:
              '模型: ' + getDisplayModelName(this.model) + '\n提示词: 保持现有主体不变，填充黑色区域',
          }),
        ),
          appStore.setSelectedNodes([_0x11bdd4]));
        typeof window.v2FocusOnNodes === 'function'
          ? window.v2FocusOnNodes([_0x5ad4f5.id, _0x11bdd4])
          : window.v2FocusOnNode?.(_0x11bdd4);
        const _0x361c44 = { ..._0x5ad4f5 };
        this.exit();
        const _0x21bd0a = await this._createExpandedImage(_0x1663b1, _0x361c44),
          _0x6e0d1 = {
            prompt: '保持现有主体不变，填充黑色区域',
            model: this.model,
            provider: this.provider,
            aspectRatio: this.ratioStr === 'original' ? '自适应' : this.ratioStr,
            imageSize: this.imageSize,
            inputUrls: [_0x21bd0a],
            batchSize: 1,
          },
          _0x309aad = await generateImage(_0x6e0d1);
        URL.revokeObjectURL(_0x21bd0a);
        if (_0x309aad.error) {
          (appStore.updateNodeData(_0x11bdd4, {
            isGenerating: false,
            name: '扩图生成失败',
            outputText:
              '模型: ' +
              getDisplayModelName(this.model) +
              '\n提示词: 保持现有主体不变，填充黑色区域\n错误: ' +
              _0x309aad.error,
          }),
            window.showToast?.('扩图失败: ' + _0x309aad.error, 'error'));
          return;
        }
        (appStore.updateNodeData(_0x11bdd4, {
          isGenerating: false,
          name: '扩图结果',
          imageUrl: _0x309aad.imageUrl,
          sourceUrl: _0x309aad.sourceUrl,
          thumbUrl: _0x309aad.thumbUrl,
          sourceId: _0x309aad.sourceId,
          thumbId: _0x309aad.thumbId,
          localPath: _0x309aad.localPath,
          outputText: '模型: ' + getDisplayModelName(this.model) + '\n提示词: 保持现有主体不变，填充黑色区域',
        }),
          window.showToast?.('扩图生成成功', 'success'));
      } catch (_0xfb9b54) {
        (console.error('扩图生成失败:', _0xfb9b54),
          window.showToast?.('扩图生成失败: ' + (_0xfb9b54.message || '未知错误'), 'error'));
      }
    };
    const _0x8a3f8a = (_0x5cbfb4) => {
      if (!this.toolbarEl.contains(_0x5cbfb4.target)) _0x35e290();
    };
    document.addEventListener('pointerdown', _0x8a3f8a, true);
    const _0x204d8b = () => {
        if (!this._pointerState) return;
        (window.removeEventListener('pointermove', _0x4c19e1, true),
          window.removeEventListener('pointerup', _0x4e9253, true),
          window.removeEventListener('pointercancel', _0x4e9253, true),
          (this._pointerState = null));
      },
      _0x5a037c = () => this.ratioStr !== 'original',
      _0x4c19e1 = (_0x223e47) => {
        const _0x2cde0a = this._pointerState;
        if (!_0x2cde0a || _0x223e47.pointerId !== _0x2cde0a.pointerId) return;
        _0x223e47.preventDefault();
        const _0x3b818f = _0x2cde0a.zoom || this._view?.viewport?.zoom || 1,
          _0x497054 = (_0x223e47.clientX - _0x2cde0a.startX) / _0x3b818f,
          _0x2e0dfa = (_0x223e47.clientY - _0x2cde0a.startY) / _0x3b818f,
          _0x3b9da5 = this._getNodeWorldRect(),
          _0x250c6f = (_0x3cc06a, _0x136a7a, _0xf3b536) =>
            Math.min(_0xf3b536, Math.max(_0x136a7a, _0x3cc06a));
        if (_0x2cde0a.mode === 'drag') {
          const _0x42e28c = _0x2cde0a.startRect.w,
            _0xd44f79 = _0x2cde0a.startRect.h;
          let _0x428f8e = _0x2cde0a.startRect.x + _0x497054,
            _0x4eccfe = _0x2cde0a.startRect.y + _0x2e0dfa;
          ((_0x428f8e = _0x250c6f(_0x428f8e, _0x3b9da5.x + _0x3b9da5.w - _0x42e28c, _0x3b9da5.x)),
            (_0x4eccfe = _0x250c6f(_0x4eccfe, _0x3b9da5.y + _0x3b9da5.h - _0xd44f79, _0x3b9da5.y)),
            (this.frameRect = { x: _0x428f8e, y: _0x4eccfe, w: _0x42e28c, h: _0xd44f79 }),
            this._updateView(this._view));
          return;
        }
        const _0x1adac0 = _0x2cde0a.handle,
          _0x594828 = Math.max(_0x3b9da5.w, 24),
          _0x181688 = Math.max(_0x3b9da5.h, 24),
          _0x1f609e = (_0x16b394) => {
            const _0x6a41e1 = { ..._0x16b394 },
              _0x4f4841 = _0x3b9da5.x + _0x3b9da5.w - _0x6a41e1.w,
              _0x1bebd5 = _0x3b9da5.x,
              _0x5cd3bc = _0x3b9da5.y + _0x3b9da5.h - _0x6a41e1.h,
              _0xc9bcf6 = _0x3b9da5.y;
            return (
              (_0x6a41e1.x = _0x250c6f(_0x6a41e1.x, _0x4f4841, _0x1bebd5)),
              (_0x6a41e1.y = _0x250c6f(_0x6a41e1.y, _0x5cd3bc, _0xc9bcf6)),
              _0x6a41e1
            );
          },
          _0x22203e = (_0x2ebb3e, _0x2f081b) => {
            const _0x1eb83c = { ..._0x2ebb3e };
            if (_0x1eb83c.w < _0x594828) _0x1eb83c.w = _0x594828;
            if (_0x1eb83c.h < _0x181688) _0x1eb83c.h = _0x181688;
            if (_0x2f081b === 'tl')
              ((_0x1eb83c.x = _0x2cde0a.startRect.x + _0x2cde0a.startRect.w - _0x1eb83c.w),
                (_0x1eb83c.y = _0x2cde0a.startRect.y + _0x2cde0a.startRect.h - _0x1eb83c.h));
            else {
              if (_0x2f081b === 'tr')
                ((_0x1eb83c.x = _0x2cde0a.startRect.x),
                  (_0x1eb83c.y = _0x2cde0a.startRect.y + _0x2cde0a.startRect.h - _0x1eb83c.h));
              else {
                if (_0x2f081b === 'bl')
                  ((_0x1eb83c.x = _0x2cde0a.startRect.x + _0x2cde0a.startRect.w - _0x1eb83c.w),
                    (_0x1eb83c.y = _0x2cde0a.startRect.y));
                else {
                  if (_0x2f081b === 'br')
                    ((_0x1eb83c.x = _0x2cde0a.startRect.x), (_0x1eb83c.y = _0x2cde0a.startRect.y));
                  else {
                    if (_0x2f081b === 'lm')
                      ((_0x1eb83c.x = _0x2cde0a.startRect.x + _0x2cde0a.startRect.w - _0x1eb83c.w),
                        (_0x1eb83c.y = _0x2cde0a.startRect.y));
                    else {
                      if (_0x2f081b === 'rm')
                        ((_0x1eb83c.x = _0x2cde0a.startRect.x), (_0x1eb83c.y = _0x2cde0a.startRect.y));
                      else {
                        if (_0x2f081b === 'tm')
                          ((_0x1eb83c.x = _0x2cde0a.startRect.x),
                            (_0x1eb83c.y = _0x2cde0a.startRect.y + _0x2cde0a.startRect.h - _0x1eb83c.h));
                        else
                          _0x2f081b === 'bm' &&
                            ((_0x1eb83c.x = _0x2cde0a.startRect.x), (_0x1eb83c.y = _0x2cde0a.startRect.y));
                      }
                    }
                  }
                }
              }
            }
            return _0x1eb83c;
          };
        if (!_0x5a037c()) {
          let _0x5ad277 = { ..._0x2cde0a.startRect };
          if (_0x1adac0 === 'tl')
            ((_0x5ad277.x = _0x2cde0a.startRect.x + _0x497054),
              (_0x5ad277.y = _0x2cde0a.startRect.y + _0x2e0dfa),
              (_0x5ad277.w = _0x2cde0a.startRect.w - _0x497054),
              (_0x5ad277.h = _0x2cde0a.startRect.h - _0x2e0dfa),
              (_0x5ad277 = _0x22203e(_0x5ad277, 'tl')));
          else {
            if (_0x1adac0 === 'tr')
              ((_0x5ad277.y = _0x2cde0a.startRect.y + _0x2e0dfa),
                (_0x5ad277.w = _0x2cde0a.startRect.w + _0x497054),
                (_0x5ad277.h = _0x2cde0a.startRect.h - _0x2e0dfa),
                (_0x5ad277 = _0x22203e(_0x5ad277, 'tr')));
            else {
              if (_0x1adac0 === 'bl')
                ((_0x5ad277.x = _0x2cde0a.startRect.x + _0x497054),
                  (_0x5ad277.w = _0x2cde0a.startRect.w - _0x497054),
                  (_0x5ad277.h = _0x2cde0a.startRect.h + _0x2e0dfa),
                  (_0x5ad277 = _0x22203e(_0x5ad277, 'bl')));
              else {
                if (_0x1adac0 === 'br')
                  ((_0x5ad277.w = _0x2cde0a.startRect.w + _0x497054),
                    (_0x5ad277.h = _0x2cde0a.startRect.h + _0x2e0dfa),
                    (_0x5ad277 = _0x22203e(_0x5ad277, 'br')));
                else {
                  if (_0x1adac0 === 'tm')
                    ((_0x5ad277.y = _0x2cde0a.startRect.y + _0x2e0dfa),
                      (_0x5ad277.h = _0x2cde0a.startRect.h - _0x2e0dfa),
                      (_0x5ad277 = _0x22203e(_0x5ad277, 'tm')));
                  else {
                    if (_0x1adac0 === 'bm')
                      ((_0x5ad277.h = _0x2cde0a.startRect.h + _0x2e0dfa),
                        (_0x5ad277 = _0x22203e(_0x5ad277, 'bm')));
                    else {
                      if (_0x1adac0 === 'lm')
                        ((_0x5ad277.x = _0x2cde0a.startRect.x + _0x497054),
                          (_0x5ad277.w = _0x2cde0a.startRect.w - _0x497054),
                          (_0x5ad277 = _0x22203e(_0x5ad277, 'lm')));
                      else
                        _0x1adac0 === 'rm' &&
                          ((_0x5ad277.w = _0x2cde0a.startRect.w + _0x497054),
                          (_0x5ad277 = _0x22203e(_0x5ad277, 'rm')));
                    }
                  }
                }
              }
            }
          }
          ((this.frameRect = _0x1f609e(_0x5ad277)), this._updateView(this._view));
          return;
        }
        const _0x4aeb86 = this._parseRatio(),
          _0xd97215 = _0x2cde0a.startRect.x + _0x2cde0a.startRect.w / 2,
          _0x4813bc = _0x2cde0a.startRect.y + _0x2cde0a.startRect.h / 2;
        let _0x148d94 = { ..._0x2cde0a.startRect };
        if (_0x1adac0 === 'lm' || _0x1adac0 === 'rm') {
          let _0x3639b0 = _0x2cde0a.startRect.w + (_0x1adac0 === 'rm' ? _0x497054 : -_0x497054);
          _0x3639b0 = Math.max(_0x3639b0, _0x594828);
          let _0x36b56c = _0x3639b0 / _0x4aeb86;
          (_0x36b56c < _0x181688 && ((_0x36b56c = _0x181688), (_0x3639b0 = _0x36b56c * _0x4aeb86)),
            (_0x148d94.w = _0x3639b0),
            (_0x148d94.h = _0x36b56c),
            (_0x148d94.x =
              _0x1adac0 === 'rm'
                ? _0x2cde0a.startRect.x
                : _0x2cde0a.startRect.x + _0x2cde0a.startRect.w - _0x148d94.w),
            (_0x148d94.y = _0x4813bc - _0x148d94.h / 2));
        } else {
          if (_0x1adac0 === 'tm' || _0x1adac0 === 'bm') {
            let _0x260f25 = _0x2cde0a.startRect.h + (_0x1adac0 === 'bm' ? _0x2e0dfa : -_0x2e0dfa);
            _0x260f25 = Math.max(_0x260f25, _0x181688);
            let _0x49f580 = _0x260f25 * _0x4aeb86;
            (_0x49f580 < _0x594828 && ((_0x49f580 = _0x594828), (_0x260f25 = _0x49f580 / _0x4aeb86)),
              (_0x148d94.w = _0x49f580),
              (_0x148d94.h = _0x260f25),
              (_0x148d94.y =
                _0x1adac0 === 'bm'
                  ? _0x2cde0a.startRect.y
                  : _0x2cde0a.startRect.y + _0x2cde0a.startRect.h - _0x148d94.h),
              (_0x148d94.x = _0xd97215 - _0x148d94.w / 2));
          } else {
            const _0x55fc33 = _0x1adac0 === 'tr' || _0x1adac0 === 'br' ? 1 : -1,
              _0xca6fea = _0x1adac0 === 'bl' || _0x1adac0 === 'br' ? 1 : -1;
            let _0x11bcdd = _0x2cde0a.startRect.w + _0x497054 * _0x55fc33,
              _0x6a4401 = _0x2cde0a.startRect.h + _0x2e0dfa * _0xca6fea;
            ((_0x11bcdd = Math.max(_0x11bcdd, 1)), (_0x6a4401 = Math.max(_0x6a4401, 1)));
            _0x11bcdd / _0x6a4401 > _0x4aeb86
              ? (_0x6a4401 = _0x11bcdd / _0x4aeb86)
              : (_0x11bcdd = _0x6a4401 * _0x4aeb86);
            _0x11bcdd < _0x594828 && ((_0x11bcdd = _0x594828), (_0x6a4401 = _0x11bcdd / _0x4aeb86));
            _0x6a4401 < _0x181688 && ((_0x6a4401 = _0x181688), (_0x11bcdd = _0x6a4401 * _0x4aeb86));
            ((_0x148d94.w = _0x11bcdd), (_0x148d94.h = _0x6a4401));
            if (_0x1adac0 === 'br')
              ((_0x148d94.x = _0x2cde0a.startRect.x), (_0x148d94.y = _0x2cde0a.startRect.y));
            else {
              if (_0x1adac0 === 'bl')
                ((_0x148d94.x = _0x2cde0a.startRect.x + _0x2cde0a.startRect.w - _0x148d94.w),
                  (_0x148d94.y = _0x2cde0a.startRect.y));
              else
                _0x1adac0 === 'tr'
                  ? ((_0x148d94.x = _0x2cde0a.startRect.x),
                    (_0x148d94.y = _0x2cde0a.startRect.y + _0x2cde0a.startRect.h - _0x148d94.h))
                  : ((_0x148d94.x = _0x2cde0a.startRect.x + _0x2cde0a.startRect.w - _0x148d94.w),
                    (_0x148d94.y = _0x2cde0a.startRect.y + _0x2cde0a.startRect.h - _0x148d94.h));
            }
          }
        }
        ((this.frameRect = _0x1f609e(_0x148d94)), this._updateView(this._view));
      },
      _0x4e9253 = (_0x5e7e4d) => {
        const _0x4170d8 = this._pointerState;
        if (!_0x4170d8 || _0x5e7e4d.pointerId !== _0x4170d8.pointerId) return;
        (_0x5e7e4d.preventDefault(), _0x204d8b());
      },
      _0x1a923f = (_0x1877b6) => {
        if (_0x1877b6.button !== 0) return;
        (_0x1877b6.stopPropagation(), _0x1877b6.preventDefault());
        if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
        this.frameRect = this._clampFrameRect(this.frameRect);
        const _0x1923d9 = _0x1877b6.target.closest('.v2-expand-handle'),
          _0x15aa2e = _0x1923d9?.dataset?.handle || null,
          _0x2f1a3b = _0x15aa2e ? 'resize' : 'drag';
        ((this._pointerState = {
          pointerId: _0x1877b6.pointerId,
          mode: _0x2f1a3b,
          handle: _0x15aa2e,
          startX: _0x1877b6.clientX,
          startY: _0x1877b6.clientY,
          startRect: { ...this.frameRect },
          zoom: this._view?.viewport?.zoom || 1,
        }),
          this.frameEl.setPointerCapture?.(_0x1877b6.pointerId),
          window.addEventListener('pointermove', _0x4c19e1, true),
          window.addEventListener('pointerup', _0x4e9253, true),
          window.addEventListener('pointercancel', _0x4e9253, true));
      };
    (this.frameEl.addEventListener('pointerdown', _0x1a923f),
      (this.cleanup = () => {
        (_0x204d8b(),
          window.removeEventListener('resize', _0x243187),
          window.removeEventListener('keydown', _0x37cc46),
          document.removeEventListener('pointerdown', _0x8a3f8a, true),
          this.overlayEl?.removeEventListener('wheel', _0x546502),
          this.frameEl?.removeEventListener('pointerdown', _0x1a923f));
      }));
  },
  exit() {
    if (!this.active) return;
    this.active = false;
    this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
    if (this.overlayEl) this.overlayEl.classList.remove('visible');
    setTimeout(() => {
      (this.overlayEl?.remove(),
        this.toolbarEl?.remove(),
        this.cleanup?.(),
        (this.nodeId = null),
        (this.nodeData = null),
        (this.frameRect = null),
        (this._view = null));
    }, 200);
  },
};
export default ImageExpandController;
