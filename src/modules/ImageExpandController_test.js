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
  init(_0x3e1174) {
    if (this.active) return;
    const _0x24c59a = appStore.getStateRaw(),
      _0xcde897 = _0x24c59a.nodes?.[_0x3e1174];
    if (!_0xcde897) return;
    ((this.active = true),
      (this.nodeId = _0x3e1174),
      (this.nodeData = _0xcde897),
      (this._view = { viewport: _0x24c59a.viewport, node: _0xcde897 }),
      (this.ratioStr = 'original'),
      (this.imageSize = '1K'));
    const _0x296527 = Object.keys(IMAGE_MODELS)[0],
      _0x1a73c6 = IMAGE_MODELS[_0x296527].models[0];
    ((this.model = _0x1a73c6.id),
      (this.provider = _0x296527),
      this._createUI(),
      this._bindEvents(),
      (this._unsubscribe = appStore.subscribeSelector(
        (_0x20fddc) => {
          const _0x428cc5 = _0x20fddc.nodes?.[_0x3e1174],
            _0x1e31d2 = _0x20fddc.viewport || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!_0x428cc5,
            vx: _0x1e31d2.x,
            vy: _0x1e31d2.y,
            vz: _0x1e31d2.zoom || 1,
            nx: _0x428cc5 ? _0x428cc5.x : 0,
            ny: _0x428cc5 ? _0x428cc5.y : 0,
            nw: _0x428cc5 ? _0x428cc5.width : 0,
            nh: _0x428cc5 ? _0x428cc5.height : 0,
          };
        },
        (_0x4bf9a8) => {
          if (!_0x4bf9a8?.hasNode) return;
          const _0x15eede = appStore.getStateRaw().nodes?.[_0x3e1174];
          if (!_0x15eede) return;
          ((this.nodeData = _0x15eede),
            (this._view = {
              viewport: { x: _0x4bf9a8.vx, y: _0x4bf9a8.vy, zoom: _0x4bf9a8.vz },
              node: _0x15eede,
            }),
            this._updateView(this._view));
        },
      )),
      this._waitForImageAndShow());
  },
  _waitForImageAndShow() {
    const _0x432a57 = () => {
      this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0
        ? (this._updateView(this._view),
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          }))
        : requestAnimationFrame(_0x432a57);
    };
    _0x432a57();
  },
  _getImageUrl() {
    const _0x1e8023 = this.nodeData || {};
    return localPathToUrl(_0x1e8023.localPath) || _0x1e8023.src || _0x1e8023.imageUrl || _0x1e8023.sourceUrl;
  },
  _createExpandedImage(_0x1d2c1e, _0x5ae606) {
    return new Promise((_0x24f02e, _0x208aab) => {
      const _0x1b48ab = new Image();
      ((_0x1b48ab.crossOrigin = 'anonymous'),
        (_0x1b48ab.onload = async () => {
          try {
            const _0x4b6e63 = document.createElement('canvas'),
              _0x124d57 = _0x4b6e63.getContext('2d'),
              _0x27cbce = _0x1b48ab.naturalWidth,
              _0x1b0e2a = _0x1b48ab.naturalHeight,
              _0x26f127 = _0x1d2c1e,
              _0x142fd2 = {
                x: _0x5ae606.x || 0,
                y: _0x5ae606.y || 0,
                w: _0x5ae606.width || 1,
                h: _0x5ae606.height || 1,
              },
              _0x652a43 = _0x27cbce / _0x142fd2.w,
              _0xa4221e = _0x1b0e2a / _0x142fd2.h,
              _0x4583a6 = Math.round(_0x26f127.w * _0x652a43),
              _0x337a12 = Math.round(_0x26f127.h * _0xa4221e);
            ((_0x4b6e63.width = _0x4583a6),
              (_0x4b6e63.height = _0x337a12),
              (_0x124d57.fillStyle = '#000'),
              _0x124d57.fillRect(0, 0, _0x4583a6, _0x337a12));
            const _0x1b2861 = Math.round((_0x142fd2.x - _0x26f127.x) * _0x652a43),
              _0x70f28b = Math.round((_0x142fd2.y - _0x26f127.y) * _0xa4221e);
            (_0x124d57.drawImage(_0x1b48ab, _0x1b2861, _0x70f28b, _0x27cbce, _0x1b0e2a),
              _0x4b6e63.toBlob((_0x3c4793) => {
                if (_0x3c4793) {
                  const _0x33846f = URL.createObjectURL(_0x3c4793);
                  _0x24f02e(_0x33846f);
                } else _0x208aab(new Error('无法创建扩展图像'));
              }, 'image/png'));
          } catch (_0x467b3a) {
            _0x208aab(_0x467b3a);
          }
        }),
        (_0x1b48ab.onerror = () => {
          _0x208aab(new Error('无法加载原始图像'));
        }));
      const _0x417d64 =
        localPathToUrl(_0x5ae606.localPath) || _0x5ae606.src || _0x5ae606.imageUrl || _0x5ae606.sourceUrl;
      _0x1b48ab.src = _0x417d64;
    });
  },
  _parseRatio() {
    if (this.ratioStr === 'original') return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    const _0x44afde = this.ratioStr.split(':').map((_0x2427d5) => Number(_0x2427d5));
    if (_0x44afde.length !== 2 || !_0x44afde[0] || !_0x44afde[1])
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    return _0x44afde[0] / _0x44afde[1];
  },
  _calcFrameWorldRect() {
    const _0x17ccf2 = this.nodeData,
      _0x267559 = _0x17ccf2.width || 1,
      _0x596eed = _0x17ccf2.height || 1,
      _0x247bd5 = _0x17ccf2.x + _0x267559 / 2,
      _0x3ed1ae = _0x17ccf2.y + _0x596eed / 2,
      _0x2cc90b = _0x267559 / _0x596eed,
      _0x22a3a9 = this._parseRatio();
    let _0xd478ee, _0x15cc78;
    _0x22a3a9 >= _0x2cc90b
      ? ((_0x15cc78 = _0x596eed), (_0xd478ee = _0x596eed * _0x22a3a9))
      : ((_0xd478ee = _0x267559), (_0x15cc78 = _0x267559 / _0x22a3a9));
    const _0x2a1e2d = 1.35,
      _0xf62fd7 = Math.max(_0x267559, _0xd478ee) * _0x2a1e2d,
      _0x32875a = Math.max(_0x596eed, _0x15cc78) * _0x2a1e2d;
    return { x: _0x247bd5 - _0xf62fd7 / 2, y: _0x3ed1ae - _0x32875a / 2, w: _0xf62fd7, h: _0x32875a };
  },
  _getNodeWorldRect() {
    const _0x4eb6f1 = this.nodeData || {},
      _0x2980cd = _0x4eb6f1.width || 1,
      _0x323ed9 = _0x4eb6f1.height || 1;
    return { x: _0x4eb6f1.x || 0, y: _0x4eb6f1.y || 0, w: _0x2980cd, h: _0x323ed9 };
  },
  _clampFrameRect(_0x15786f) {
    const _0x25c644 = this._getNodeWorldRect(),
      _0x9e96cc = (_0x108167, _0xfc5dcf, _0x4f5441) => Math.min(_0x4f5441, Math.max(_0xfc5dcf, _0x108167)),
      _0x1a9836 = {
        x: Number(_0x15786f?.x) || 0,
        y: Number(_0x15786f?.y) || 0,
        w: Number(_0x15786f?.w) || 1,
        h: Number(_0x15786f?.h) || 1,
      },
      _0x5e912c = Math.max(_0x25c644.w, 24),
      _0x1b6b4a = Math.max(_0x25c644.h, 24);
    ((_0x1a9836.w = Math.max(_0x1a9836.w, _0x5e912c)), (_0x1a9836.h = Math.max(_0x1a9836.h, _0x1b6b4a)));
    if (this.ratioStr !== 'original') {
      const _0x1add1a = this._parseRatio(),
        _0x4ffb83 = _0x1a9836.x + _0x1a9836.w / 2,
        _0x3a077a = _0x1a9836.y + _0x1a9836.h / 2;
      let _0x1021ea = _0x1a9836.w,
        _0x3cf9da = _0x1a9836.h;
      (_0x1021ea / _0x3cf9da > _0x1add1a
        ? (_0x3cf9da = _0x1021ea / _0x1add1a)
        : (_0x1021ea = _0x3cf9da * _0x1add1a),
        _0x1021ea < _0x5e912c && ((_0x1021ea = _0x5e912c), (_0x3cf9da = _0x1021ea / _0x1add1a)),
        _0x3cf9da < _0x1b6b4a && ((_0x3cf9da = _0x1b6b4a), (_0x1021ea = _0x3cf9da * _0x1add1a)),
        (_0x1a9836.w = _0x1021ea),
        (_0x1a9836.h = _0x3cf9da),
        (_0x1a9836.x = _0x4ffb83 - _0x1a9836.w / 2),
        (_0x1a9836.y = _0x3a077a - _0x1a9836.h / 2));
    }
    const _0x501463 = _0x25c644.x + _0x25c644.w - _0x1a9836.w,
      _0x5324a2 = _0x25c644.x,
      _0x56587e = _0x25c644.y + _0x25c644.h - _0x1a9836.h,
      _0x44ab46 = _0x25c644.y;
    return (
      (_0x1a9836.x = _0x9e96cc(_0x1a9836.x, _0x501463, _0x5324a2)),
      (_0x1a9836.y = _0x9e96cc(_0x1a9836.y, _0x56587e, _0x44ab46)),
      _0x1a9836
    );
  },
  _createUI() {
    const _0xf89c03 = document.createElement('div');
    _0xf89c03.className = 'v2-expand-overlay';
    const _0x2e7ffd = document.createElement('div');
    ((_0x2e7ffd.className = 'v2-expand-frame'),
      ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'].forEach((_0x122280) => {
        const _0x2f9a99 = document.createElement('div');
        ((_0x2f9a99.className = 'v2-expand-handle ' + _0x122280),
          (_0x2f9a99.dataset.handle = _0x122280),
          _0x2e7ffd.appendChild(_0x2f9a99));
      }));
    const _0x5c73e9 = document.createElement('img');
    ((_0x5c73e9.className = 'v2-expand-img'),
      (_0x5c73e9.draggable = false),
      (_0x5c73e9.src = this._getImageUrl()),
      _0xf89c03.appendChild(_0x2e7ffd),
      _0xf89c03.appendChild(_0x5c73e9),
      document.body.appendChild(_0xf89c03),
      (this.overlayEl = _0xf89c03),
      (this.frameEl = _0x2e7ffd),
      (this.imgEl = _0x5c73e9),
      (this.frameRect = this._calcFrameWorldRect()));
    const _0x5852cb = document.createElement('div');
    _0x5852cb.className = 'v2-expand-toolbar';
    const _0x8dd89f = this.ratioStr === 'original' ? '比例' : this.ratioStr,
      _0x18fb80 = getModelDisplayName(this.model);
    let _0x4111c8 = '';
    (Object.entries(IMAGE_MODELS).forEach(([_0x3660b5, _0x1b84c9]) => {
      const _0x207155 = _0x1b84c9.isTextIcon
        ? '<div style="width:20px;height:20px;border-radius:3px;background:var(--bg-node);color:var(--text-primary);font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          _0x1b84c9.icon +
          '</div>'
        : '<img src="' +
          _0x1b84c9.icon +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          _0x3660b5 +
          '">';
      let _0x20b52d = '';
      (_0x1b84c9.models.forEach((_0x44f65d) => {
        const _0x766e26 = _0x44f65d.icon || _0x1b84c9.icon,
          _0x4233d3 = this.model === _0x44f65d.id ? 'active' : '';
        _0x20b52d +=
          '\n          <div class="floating-menu-item ' +
          _0x4233d3 +
          '" data-value="' +
          _0x44f65d.id +
          '" data-provider="' +
          _0x3660b5 +
          '" style="display:flex;align-items:center;gap:8px;">\n            <img src="' +
          _0x766e26 +
          '" style="width:20px;height:20px;object-fit:contain;border-radius:3px;flex-shrink:0;background:var(--white-10);padding:2.5px;" alt="' +
          _0x3660b5 +
          '">\n            <div class="fmi-content">\n              <div class="fmi-title">' +
          _0x44f65d.name +
          '</div>\n              <div class="fmi-sub">' +
          _0x44f65d.description +
          '</div>\n            </div>\n          </div>';
      }),
        (_0x4111c8 +=
          '\n        <div class="' +
          _0x3660b5 +
          '-group-header floating-menu-item" data-' +
          _0x3660b5 +
          '-toggle style="display:flex;align-items:center;gap:8px;cursor:var(--link-cursor);">\n          ' +
          _0x207155 +
          '\n          <div class="fmi-content">\n            <div class="fmi-title">' +
          _0x1b84c9.name +
          '</div>\n            <div class="fmi-sub">' +
          _0x1b84c9.description +
          '</div>\n          </div>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.5;flex-shrink:0;"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="' +
          _0x3660b5 +
          '-submenu" style="position:absolute;left:calc(100% + 6px);top:0;z-index:1001;width:max-content;max-width:320px;background:var(--bg-2);border:1px solid var(--stroke-08);border-radius:14px;padding:8px;box-shadow:var(--shadow-popover);display:none;flex-direction:column;">\n          ' +
          _0x20b52d +
          '\n        </div>'));
    }),
      (_0x5852cb.innerHTML =
        '\n      <button class="v2-expand-toolbar-btn exit" title="退出 (Esc)">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>\n      </button>\n      <div class="v2-expand-divider"></div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn ratio-toggle">\n          <span class="ratio-text">' +
        _0x8dd89f +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu ratio-menu">\n          <div class="v2-expand-menu-item active" data-type="ratio" data-value="original">原图比例</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="21:9">21:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="16:9">16:9</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="9:16">9:16</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="4:3">4:3</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="3:4">3:4</div>\n          <div class="v2-expand-menu-item" data-type="ratio" data-value="1:1">1:1</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn size-toggle">\n          <span class="size-text">' +
        this.imageSize +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="v2-expand-menu size-menu">\n          <div class="v2-expand-menu-item active" data-type="size" data-value="1K">1K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="2K">2K</div>\n          <div class="v2-expand-menu-item" data-type="size" data-value="4K">4K</div>\n        </div>\n      </div>\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="model-text">' +
        _0x18fb80 +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu model-menu">\n          ' +
        _0x4111c8 +
        '\n        </div>\n      </div>\n      <button class="v2-expand-toolbar-btn go" title="生成扩图">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n      </button>\n    '),
      document.body.appendChild(_0x5852cb),
      (this.toolbarEl = _0x5852cb),
      (this.ratioMenuEl = _0x5852cb.querySelector('.ratio-menu')),
      (this.sizeMenuEl = _0x5852cb.querySelector('.size-menu')),
      (this.modelMenuEl = _0x5852cb.querySelector('.model-menu')),
      this._updateView(this._view));
  },
  _updateView(_0x51465a = this._view) {
    if (!this.active) return;
    const _0xfd7f66 = _0x51465a?.node,
      _0x2e62a5 = _0x51465a?.viewport;
    if (!_0xfd7f66) return;
    this.nodeData = _0xfd7f66;
    if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
    this.frameRect = this._clampFrameRect(this.frameRect);
    const _0x1126e8 = this.frameRect,
      _0x11d02d = worldToScreen(_0x1126e8.x, _0x1126e8.y, _0x2e62a5),
      _0x4b9ff8 = Math.round(_0x1126e8.w * _0x2e62a5.zoom),
      _0x5009cf = Math.round(_0x1126e8.h * _0x2e62a5.zoom);
    ((this.frameEl.style.left = Math.round(_0x11d02d.x) + 'px'),
      (this.frameEl.style.top = Math.round(_0x11d02d.y) + 'px'),
      (this.frameEl.style.width = _0x4b9ff8 + 'px'),
      (this.frameEl.style.height = _0x5009cf + 'px'));
    const _0x1b4a13 = worldToScreen(_0xfd7f66.x, _0xfd7f66.y, _0x2e62a5),
      _0x49c00a = Math.round(_0xfd7f66.width * _0x2e62a5.zoom),
      _0x2d91bb = Math.round(_0xfd7f66.height * _0x2e62a5.zoom);
    ((this.imgEl.style.left = Math.round(_0x1b4a13.x) + 'px'),
      (this.imgEl.style.top = Math.round(_0x1b4a13.y) + 'px'),
      (this.imgEl.style.width = _0x49c00a + 'px'),
      (this.imgEl.style.height = _0x2d91bb + 'px'));
    if (this.toolbarEl) {
      const _0x568054 = _0x1b4a13.y + _0x2d91bb + 14;
      ((this.toolbarEl.style.top = _0x568054 + 'px'),
        (this.toolbarEl.style.left = _0x1b4a13.x + _0x49c00a / 2 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'),
        (this.toolbarEl.style.bottom = 'auto'));
    }
  },
  _bindEvents() {
    const _0x4ed72b = () => this._updateView(this._view);
    window.addEventListener('resize', _0x4ed72b);
    const _0x4ad0df = (_0x424309) => {
      if (_0x424309.key === 'Escape') this.exit();
    };
    window.addEventListener('keydown', _0x4ad0df);
    const _0x5a6b5b = (_0x43d57e) => _0x43d57e.stopPropagation();
    this.overlayEl.addEventListener('wheel', _0x5a6b5b, { passive: false });
    const _0x108c01 = () => {
      (this.ratioMenuEl?.classList.remove('open'),
        this.sizeMenuEl?.classList.remove('open'),
        this.modelMenuEl?.classList.remove('show'),
        Object.keys(IMAGE_MODELS).forEach((_0x1696e2) => {
          const _0x1e07c3 = this.modelMenuEl?.querySelector('.' + _0x1696e2 + '-submenu');
          if (_0x1e07c3) _0x1e07c3.style.display = 'none';
        }));
    };
    this.toolbarEl.querySelector('.exit').onclick = () => this.exit();
    const _0x31c5ce = this.toolbarEl.querySelector('.ratio-toggle');
    _0x31c5ce.onclick = (_0x1c3f80) => {
      _0x1c3f80.stopPropagation();
      const _0x1624ed = this.ratioMenuEl.classList.toggle('open');
      _0x1624ed && (this.sizeMenuEl.classList.remove('open'), this.modelMenuEl.classList.remove('open'));
    };
    const _0x47f689 = this.toolbarEl.querySelector('.size-toggle');
    _0x47f689.onclick = (_0x3ee17a) => {
      _0x3ee17a.stopPropagation();
      const _0x4f5e3c = this.sizeMenuEl.classList.toggle('open');
      _0x4f5e3c && (this.ratioMenuEl.classList.remove('open'), this.modelMenuEl.classList.remove('open'));
    };
    const _0x373140 = (_0x222baf) => {
      const _0x52348b = _0x222baf.target.closest('.v2-expand-menu-item');
      if (!_0x52348b) return;
      const _0x25ae99 = _0x52348b.dataset.type;
      if (_0x25ae99 === 'ratio') {
        ((this.ratioStr = _0x52348b.dataset.value),
          this.ratioMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((_0x4a427e) => _0x4a427e.classList.toggle('active', _0x4a427e === _0x52348b)),
          (this.toolbarEl.querySelector('.ratio-text').textContent =
            this.ratioStr === 'original' ? '比例' : this.ratioStr),
          this.ratioMenuEl.classList.remove('open'),
          (this.frameRect = this._calcFrameWorldRect()),
          this._updateView(this._view));
        return;
      }
      if (_0x25ae99 === 'size') {
        ((this.imageSize = _0x52348b.dataset.value),
          this.sizeMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((_0x17db19) => _0x17db19.classList.toggle('active', _0x17db19 === _0x52348b)),
          (this.toolbarEl.querySelector('.size-text').textContent = this.imageSize),
          this.sizeMenuEl.classList.remove('open'));
        return;
      }
      if (_0x25ae99 === 'model') {
        ((this.model = _0x52348b.dataset.value),
          (this.provider = _0x52348b.dataset.provider || getModelProvider(this.model)),
          this.modelMenuEl
            .querySelectorAll('.v2-expand-menu-item')
            .forEach((_0x1305a5) => _0x1305a5.classList.toggle('active', _0x1305a5 === _0x52348b)),
          (this.toolbarEl.querySelector('.model-text').textContent = getModelDisplayName(this.model)),
          this.modelMenuEl.classList.remove('open'));
        return;
      }
    };
    ((this.ratioMenuEl.onclick = _0x373140),
      (this.sizeMenuEl.onclick = _0x373140),
      (this.modelMenuEl.onclick = _0x373140));
    const _0x34cf9d = this.toolbarEl.querySelector('.model-toggle'),
      _0x3a444f = this.modelMenuEl,
      _0x318564 = this.toolbarEl.querySelector('.model-text');
    _0x34cf9d &&
      _0x3a444f &&
      _0x318564 &&
      (_0x34cf9d.addEventListener('click', (_0x4041fc) => {
        (_0x4041fc.stopPropagation(),
          _0x3a444f.classList.toggle('show'),
          this.ratioMenuEl.classList.remove('open'),
          this.sizeMenuEl.classList.remove('open'));
      }),
      Object.keys(IMAGE_MODELS).forEach((_0x55156e) => {
        const _0x20c730 = _0x3a444f.querySelector('[data-' + _0x55156e + '-toggle]'),
          _0x32f8f9 = _0x3a444f.querySelector('.' + _0x55156e + '-submenu');
        if (!_0x20c730 || !_0x32f8f9) return;
        let _0x113027 = null;
        const _0x287661 = () => {
            (clearTimeout(_0x113027), (_0x32f8f9.style.display = 'flex'));
          },
          _0x4f50ad = (_0x2cf2f0 = 120) => {
            _0x113027 = setTimeout(() => {
              _0x32f8f9.style.display = 'none';
            }, _0x2cf2f0);
          };
        (_0x20c730.addEventListener('mouseenter', _0x287661),
          _0x20c730.addEventListener('mouseleave', () => _0x4f50ad()),
          _0x32f8f9.addEventListener('mouseenter', _0x287661),
          _0x32f8f9.addEventListener('mouseleave', () => _0x4f50ad()),
          _0x32f8f9.querySelectorAll('.floating-menu-item').forEach((_0x1fc8c0) => {
            _0x1fc8c0.addEventListener('click', () => {
              const _0x3b1657 = _0x1fc8c0.dataset.value,
                _0x440d38 = _0x1fc8c0.dataset.provider || _0x55156e,
                _0x1245f2 = _0x1fc8c0.querySelector('.fmi-title');
              ((_0x318564.textContent = _0x1245f2 ? _0x1245f2.textContent : getModelDisplayName(_0x3b1657)),
                (this.model = _0x3b1657),
                (this.provider = _0x440d38),
                appStore.updateNodeData(this.nodeId, { model: _0x3b1657, provider: _0x440d38 }),
                _0x3a444f
                  .querySelectorAll('.floating-menu-item')
                  .forEach((_0xf866cf) => _0xf866cf.classList.remove('active')),
                _0x1fc8c0.classList.add('active'),
                _0x3a444f.classList.remove('show'),
                (_0x32f8f9.style.display = 'none'));
            });
          }));
      }));
    this.toolbarEl.querySelector('.go').onclick = async () => {
      try {
        window.showToast?.('正在生成扩图...', 'loading');
        const _0x55f195 = appStore.getStateRaw(),
          _0x42284d = _0x55f195.nodes?.[this.nodeId];
        if (!_0x42284d) return;
        const _0x9e702 = { ...this.frameRect };
        let _0x2493f9, _0x4051e1;
        const _0x26362c =
            this.ratioStr === 'original'
              ? _0x42284d.width / _0x42284d.height
              : parseInt(this.ratioStr.split(':')[0]) / parseInt(this.ratioStr.split(':')[1]),
          _0x526fa0 = getAutoMediaSizeByShortSide(_0x26362c, 1);
        ((_0x2493f9 = _0x526fa0.width), (_0x4051e1 = _0x526fa0.height));
        const { x: _0x241056, y: _0x2ec9ee } = calcSafeSpawnPosNearNode(
            _0x55f195.nodes,
            _0x42284d,
            _0x2493f9,
            _0x4051e1,
          ),
          _0x455507 = generateId('source-image-expand');
        (appStore.addNode(
          buildSourceMediaNodePayload({
            id: _0x455507,
            type: 'source-image',
            x: _0x241056,
            y: _0x2ec9ee,
            width: _0x2493f9,
            height: _0x4051e1,
            name: '扩图生成中...',
            src: '',
            isGenerating: true,
            outputText:
              '模型: ' + getDisplayModelName(this.model) + '\n提示词: 保持现有主体不变，填充黑色区域',
          }),
        ),
          appStore.setSelectedNodes([_0x455507]));
        typeof window.v2FocusOnNodes === 'function'
          ? window.v2FocusOnNodes([_0x42284d.id, _0x455507])
          : window.v2FocusOnNode?.(_0x455507);
        const _0x443e52 = { ..._0x42284d };
        this.exit();
        const _0x23c4fb = await this._createExpandedImage(_0x9e702, _0x443e52),
          _0x35acaa = {
            prompt: '保持现有主体不变，填充黑色区域',
            model: this.model,
            provider: this.provider,
            aspectRatio: this.ratioStr === 'original' ? '自适应' : this.ratioStr,
            imageSize: this.imageSize,
            inputUrls: [_0x23c4fb],
            batchSize: 1,
          },
          _0x563667 = await generateImage(_0x35acaa);
        URL.revokeObjectURL(_0x23c4fb);
        if (_0x563667.error) {
          (appStore.updateNodeData(_0x455507, {
            isGenerating: false,
            name: '扩图生成失败',
            outputText:
              '模型: ' +
              getDisplayModelName(this.model) +
              '\n提示词: 保持现有主体不变，填充黑色区域\n错误: ' +
              _0x563667.error,
          }),
            window.showToast?.('扩图失败: ' + _0x563667.error, 'error'));
          return;
        }
        (appStore.updateNodeData(_0x455507, {
          isGenerating: false,
          name: '扩图结果',
          imageUrl: _0x563667.imageUrl,
          sourceUrl: _0x563667.sourceUrl,
          thumbUrl: _0x563667.thumbUrl,
          sourceId: _0x563667.sourceId,
          thumbId: _0x563667.thumbId,
          localPath: _0x563667.localPath,
          outputText: '模型: ' + getDisplayModelName(this.model) + '\n提示词: 保持现有主体不变，填充黑色区域',
        }),
          window.showToast?.('扩图生成成功', 'success'));
      } catch (_0x316a5e) {
        (console.error('扩图生成失败:', _0x316a5e),
          window.showToast?.('扩图生成失败: ' + (_0x316a5e.message || '未知错误'), 'error'));
      }
    };
    const _0x4b134f = (_0x217ad) => {
      if (!this.toolbarEl.contains(_0x217ad.target)) _0x108c01();
    };
    document.addEventListener('pointerdown', _0x4b134f, true);
    const _0x5358a7 = () => {
        if (!this._pointerState) return;
        (window.removeEventListener('pointermove', _0x10fd49, true),
          window.removeEventListener('pointerup', _0x9d796, true),
          window.removeEventListener('pointercancel', _0x9d796, true),
          (this._pointerState = null));
      },
      _0x561092 = () => this.ratioStr !== 'original',
      _0x10fd49 = (_0x15cb99) => {
        const _0x256dc5 = this._pointerState;
        if (!_0x256dc5 || _0x15cb99.pointerId !== _0x256dc5.pointerId) return;
        _0x15cb99.preventDefault();
        const _0x5b132c = _0x256dc5.zoom || this._view?.viewport?.zoom || 1,
          _0x1a7f0b = (_0x15cb99.clientX - _0x256dc5.startX) / _0x5b132c,
          _0x357ab7 = (_0x15cb99.clientY - _0x256dc5.startY) / _0x5b132c,
          _0x3c4d1a = this._getNodeWorldRect(),
          _0x13fd13 = (_0x16a155, _0x56023e, _0x1e5dcd) =>
            Math.min(_0x1e5dcd, Math.max(_0x56023e, _0x16a155));
        if (_0x256dc5.mode === 'drag') {
          const _0xd00c9 = _0x256dc5.startRect.w,
            _0x332958 = _0x256dc5.startRect.h;
          let _0xc7ad70 = _0x256dc5.startRect.x + _0x1a7f0b,
            _0x294cf1 = _0x256dc5.startRect.y + _0x357ab7;
          ((_0xc7ad70 = _0x13fd13(_0xc7ad70, _0x3c4d1a.x + _0x3c4d1a.w - _0xd00c9, _0x3c4d1a.x)),
            (_0x294cf1 = _0x13fd13(_0x294cf1, _0x3c4d1a.y + _0x3c4d1a.h - _0x332958, _0x3c4d1a.y)),
            (this.frameRect = { x: _0xc7ad70, y: _0x294cf1, w: _0xd00c9, h: _0x332958 }),
            this._updateView(this._view));
          return;
        }
        const _0x59ce4d = _0x256dc5.handle,
          _0x5c9a78 = Math.max(_0x3c4d1a.w, 24),
          _0x165954 = Math.max(_0x3c4d1a.h, 24),
          _0x5f9250 = (_0x6011d3) => {
            const _0x170d7b = { ..._0x6011d3 },
              _0x5eb22c = _0x3c4d1a.x + _0x3c4d1a.w - _0x170d7b.w,
              _0x550a68 = _0x3c4d1a.x,
              _0x18edff = _0x3c4d1a.y + _0x3c4d1a.h - _0x170d7b.h,
              _0x38ae15 = _0x3c4d1a.y;
            return (
              (_0x170d7b.x = _0x13fd13(_0x170d7b.x, _0x5eb22c, _0x550a68)),
              (_0x170d7b.y = _0x13fd13(_0x170d7b.y, _0x18edff, _0x38ae15)),
              _0x170d7b
            );
          },
          _0x591cc7 = (_0x27c11d, _0x47ecd4) => {
            const _0x12e9e8 = { ..._0x27c11d };
            if (_0x12e9e8.w < _0x5c9a78) _0x12e9e8.w = _0x5c9a78;
            if (_0x12e9e8.h < _0x165954) _0x12e9e8.h = _0x165954;
            if (_0x47ecd4 === 'tl')
              ((_0x12e9e8.x = _0x256dc5.startRect.x + _0x256dc5.startRect.w - _0x12e9e8.w),
                (_0x12e9e8.y = _0x256dc5.startRect.y + _0x256dc5.startRect.h - _0x12e9e8.h));
            else {
              if (_0x47ecd4 === 'tr')
                ((_0x12e9e8.x = _0x256dc5.startRect.x),
                  (_0x12e9e8.y = _0x256dc5.startRect.y + _0x256dc5.startRect.h - _0x12e9e8.h));
              else {
                if (_0x47ecd4 === 'bl')
                  ((_0x12e9e8.x = _0x256dc5.startRect.x + _0x256dc5.startRect.w - _0x12e9e8.w),
                    (_0x12e9e8.y = _0x256dc5.startRect.y));
                else {
                  if (_0x47ecd4 === 'br')
                    ((_0x12e9e8.x = _0x256dc5.startRect.x), (_0x12e9e8.y = _0x256dc5.startRect.y));
                  else {
                    if (_0x47ecd4 === 'lm')
                      ((_0x12e9e8.x = _0x256dc5.startRect.x + _0x256dc5.startRect.w - _0x12e9e8.w),
                        (_0x12e9e8.y = _0x256dc5.startRect.y));
                    else {
                      if (_0x47ecd4 === 'rm')
                        ((_0x12e9e8.x = _0x256dc5.startRect.x), (_0x12e9e8.y = _0x256dc5.startRect.y));
                      else {
                        if (_0x47ecd4 === 'tm')
                          ((_0x12e9e8.x = _0x256dc5.startRect.x),
                            (_0x12e9e8.y = _0x256dc5.startRect.y + _0x256dc5.startRect.h - _0x12e9e8.h));
                        else
                          _0x47ecd4 === 'bm' &&
                            ((_0x12e9e8.x = _0x256dc5.startRect.x), (_0x12e9e8.y = _0x256dc5.startRect.y));
                      }
                    }
                  }
                }
              }
            }
            return _0x12e9e8;
          };
        if (!_0x561092()) {
          let _0x561309 = { ..._0x256dc5.startRect };
          if (_0x59ce4d === 'tl')
            ((_0x561309.x = _0x256dc5.startRect.x + _0x1a7f0b),
              (_0x561309.y = _0x256dc5.startRect.y + _0x357ab7),
              (_0x561309.w = _0x256dc5.startRect.w - _0x1a7f0b),
              (_0x561309.h = _0x256dc5.startRect.h - _0x357ab7),
              (_0x561309 = _0x591cc7(_0x561309, 'tl')));
          else {
            if (_0x59ce4d === 'tr')
              ((_0x561309.y = _0x256dc5.startRect.y + _0x357ab7),
                (_0x561309.w = _0x256dc5.startRect.w + _0x1a7f0b),
                (_0x561309.h = _0x256dc5.startRect.h - _0x357ab7),
                (_0x561309 = _0x591cc7(_0x561309, 'tr')));
            else {
              if (_0x59ce4d === 'bl')
                ((_0x561309.x = _0x256dc5.startRect.x + _0x1a7f0b),
                  (_0x561309.w = _0x256dc5.startRect.w - _0x1a7f0b),
                  (_0x561309.h = _0x256dc5.startRect.h + _0x357ab7),
                  (_0x561309 = _0x591cc7(_0x561309, 'bl')));
              else {
                if (_0x59ce4d === 'br')
                  ((_0x561309.w = _0x256dc5.startRect.w + _0x1a7f0b),
                    (_0x561309.h = _0x256dc5.startRect.h + _0x357ab7),
                    (_0x561309 = _0x591cc7(_0x561309, 'br')));
                else {
                  if (_0x59ce4d === 'tm')
                    ((_0x561309.y = _0x256dc5.startRect.y + _0x357ab7),
                      (_0x561309.h = _0x256dc5.startRect.h - _0x357ab7),
                      (_0x561309 = _0x591cc7(_0x561309, 'tm')));
                  else {
                    if (_0x59ce4d === 'bm')
                      ((_0x561309.h = _0x256dc5.startRect.h + _0x357ab7),
                        (_0x561309 = _0x591cc7(_0x561309, 'bm')));
                    else {
                      if (_0x59ce4d === 'lm')
                        ((_0x561309.x = _0x256dc5.startRect.x + _0x1a7f0b),
                          (_0x561309.w = _0x256dc5.startRect.w - _0x1a7f0b),
                          (_0x561309 = _0x591cc7(_0x561309, 'lm')));
                      else
                        _0x59ce4d === 'rm' &&
                          ((_0x561309.w = _0x256dc5.startRect.w + _0x1a7f0b),
                          (_0x561309 = _0x591cc7(_0x561309, 'rm')));
                    }
                  }
                }
              }
            }
          }
          ((this.frameRect = _0x5f9250(_0x561309)), this._updateView(this._view));
          return;
        }
        const _0x5dcf32 = this._parseRatio(),
          _0x14c551 = _0x256dc5.startRect.x + _0x256dc5.startRect.w / 2,
          _0x4c179d = _0x256dc5.startRect.y + _0x256dc5.startRect.h / 2;
        let _0x8dbfdb = { ..._0x256dc5.startRect };
        if (_0x59ce4d === 'lm' || _0x59ce4d === 'rm') {
          let _0x150418 = _0x256dc5.startRect.w + (_0x59ce4d === 'rm' ? _0x1a7f0b : -_0x1a7f0b);
          _0x150418 = Math.max(_0x150418, _0x5c9a78);
          let _0x315fff = _0x150418 / _0x5dcf32;
          (_0x315fff < _0x165954 && ((_0x315fff = _0x165954), (_0x150418 = _0x315fff * _0x5dcf32)),
            (_0x8dbfdb.w = _0x150418),
            (_0x8dbfdb.h = _0x315fff),
            (_0x8dbfdb.x =
              _0x59ce4d === 'rm'
                ? _0x256dc5.startRect.x
                : _0x256dc5.startRect.x + _0x256dc5.startRect.w - _0x8dbfdb.w),
            (_0x8dbfdb.y = _0x4c179d - _0x8dbfdb.h / 2));
        } else {
          if (_0x59ce4d === 'tm' || _0x59ce4d === 'bm') {
            let _0xc9d31e = _0x256dc5.startRect.h + (_0x59ce4d === 'bm' ? _0x357ab7 : -_0x357ab7);
            _0xc9d31e = Math.max(_0xc9d31e, _0x165954);
            let _0x5dfacc = _0xc9d31e * _0x5dcf32;
            (_0x5dfacc < _0x5c9a78 && ((_0x5dfacc = _0x5c9a78), (_0xc9d31e = _0x5dfacc / _0x5dcf32)),
              (_0x8dbfdb.w = _0x5dfacc),
              (_0x8dbfdb.h = _0xc9d31e),
              (_0x8dbfdb.y =
                _0x59ce4d === 'bm'
                  ? _0x256dc5.startRect.y
                  : _0x256dc5.startRect.y + _0x256dc5.startRect.h - _0x8dbfdb.h),
              (_0x8dbfdb.x = _0x14c551 - _0x8dbfdb.w / 2));
          } else {
            const _0x1fbf7a = _0x59ce4d === 'tr' || _0x59ce4d === 'br' ? 1 : -1,
              _0x286d90 = _0x59ce4d === 'bl' || _0x59ce4d === 'br' ? 1 : -1;
            let _0x2972e7 = _0x256dc5.startRect.w + _0x1a7f0b * _0x1fbf7a,
              _0x489bbc = _0x256dc5.startRect.h + _0x357ab7 * _0x286d90;
            ((_0x2972e7 = Math.max(_0x2972e7, 1)), (_0x489bbc = Math.max(_0x489bbc, 1)));
            _0x2972e7 / _0x489bbc > _0x5dcf32
              ? (_0x489bbc = _0x2972e7 / _0x5dcf32)
              : (_0x2972e7 = _0x489bbc * _0x5dcf32);
            _0x2972e7 < _0x5c9a78 && ((_0x2972e7 = _0x5c9a78), (_0x489bbc = _0x2972e7 / _0x5dcf32));
            _0x489bbc < _0x165954 && ((_0x489bbc = _0x165954), (_0x2972e7 = _0x489bbc * _0x5dcf32));
            ((_0x8dbfdb.w = _0x2972e7), (_0x8dbfdb.h = _0x489bbc));
            if (_0x59ce4d === 'br')
              ((_0x8dbfdb.x = _0x256dc5.startRect.x), (_0x8dbfdb.y = _0x256dc5.startRect.y));
            else {
              if (_0x59ce4d === 'bl')
                ((_0x8dbfdb.x = _0x256dc5.startRect.x + _0x256dc5.startRect.w - _0x8dbfdb.w),
                  (_0x8dbfdb.y = _0x256dc5.startRect.y));
              else
                _0x59ce4d === 'tr'
                  ? ((_0x8dbfdb.x = _0x256dc5.startRect.x),
                    (_0x8dbfdb.y = _0x256dc5.startRect.y + _0x256dc5.startRect.h - _0x8dbfdb.h))
                  : ((_0x8dbfdb.x = _0x256dc5.startRect.x + _0x256dc5.startRect.w - _0x8dbfdb.w),
                    (_0x8dbfdb.y = _0x256dc5.startRect.y + _0x256dc5.startRect.h - _0x8dbfdb.h));
            }
          }
        }
        ((this.frameRect = _0x5f9250(_0x8dbfdb)), this._updateView(this._view));
      },
      _0x9d796 = (_0x24379c) => {
        const _0x462b85 = this._pointerState;
        if (!_0x462b85 || _0x24379c.pointerId !== _0x462b85.pointerId) return;
        (_0x24379c.preventDefault(), _0x5358a7());
      },
      _0x19d227 = (_0x3954db) => {
        if (_0x3954db.button !== 0) return;
        (_0x3954db.stopPropagation(), _0x3954db.preventDefault());
        if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
        this.frameRect = this._clampFrameRect(this.frameRect);
        const _0xddb536 = _0x3954db.target.closest('.v2-expand-handle'),
          _0x56eacd = _0xddb536?.dataset?.handle || null,
          _0x582f72 = _0x56eacd ? 'resize' : 'drag';
        ((this._pointerState = {
          pointerId: _0x3954db.pointerId,
          mode: _0x582f72,
          handle: _0x56eacd,
          startX: _0x3954db.clientX,
          startY: _0x3954db.clientY,
          startRect: { ...this.frameRect },
          zoom: this._view?.viewport?.zoom || 1,
        }),
          this.frameEl.setPointerCapture?.(_0x3954db.pointerId),
          window.addEventListener('pointermove', _0x10fd49, true),
          window.addEventListener('pointerup', _0x9d796, true),
          window.addEventListener('pointercancel', _0x9d796, true));
      };
    (this.frameEl.addEventListener('pointerdown', _0x19d227),
      (this.cleanup = () => {
        (_0x5358a7(),
          window.removeEventListener('resize', _0x4ed72b),
          window.removeEventListener('keydown', _0x4ad0df),
          document.removeEventListener('pointerdown', _0x4b134f, true),
          this.overlayEl?.removeEventListener('wheel', _0x5a6b5b),
          this.frameEl?.removeEventListener('pointerdown', _0x19d227));
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
