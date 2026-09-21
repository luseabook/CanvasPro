import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { bindTextToolbarEvents } from './NodeToolbarConfig.js';
import { sanitizeRichTextHtml, setStaticInnerHTML } from '../utils/dom.js';
function sourceTextText(_0x2d89d3, _0xaad379 = {}) {
  return t('sourceTextNode.' + _0x2d89d3, _0xaad379);
}
export class SourceTextNode {
  constructor(_0x213552) {
    ((this._data = _0x213552),
      (this.el = document.createElement('div')),
      (this.id = _0x213552.id),
      (this.el.className = 'v2-node-component'),
      (this._lastScrollTop = Number.isFinite(_0x213552?.contentScrollTop)
        ? Math.max(0, _0x213552.contentScrollTop)
        : 0),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const _0x4de87b = this.el;
    setStaticInnerHTML(_0x4de87b, 'toolbar:text');
    const _0x26046f = document.createElement('div');
    _0x26046f.className = 'node-card source-text-card';
    const _0x5c4384 = document.createElement('div');
    ((_0x5c4384.className = 'source-text-content'),
      _0x5c4384.setAttribute('contenteditable', 'false'),
      (_0x5c4384.spellcheck = false),
      (_0x5c4384.dataset.placeholder = sourceTextText('placeholder.initial')));
    const _0x2a77c5 = document.createElement('div');
    _0x2a77c5.className = 'source-text-footer';
    const _0x2bef40 = document.createElement('div');
    _0x2bef40.className = 'source-text-info';
    const _0x1f6b91 = 'http://www.w3.org/2000/svg',
      _0x46d7bb = document.createElementNS(_0x1f6b91, 'svg');
    (_0x46d7bb.setAttribute('width', '12'),
      _0x46d7bb.setAttribute('height', '12'),
      _0x46d7bb.setAttribute('viewBox', '0 0 24 24'),
      _0x46d7bb.setAttribute('fill', 'none'),
      _0x46d7bb.setAttribute('stroke', 'currentColor'),
      _0x46d7bb.setAttribute('stroke-width', '2'),
      (_0x46d7bb.style.opacity = '0.4'));
    const _0x18cf8b = document.createElementNS(_0x1f6b91, 'path');
    _0x18cf8b.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
    const _0x5936a9 = document.createElementNS(_0x1f6b91, 'polyline');
    _0x5936a9.setAttribute('points', '14 2 14 8 20 8');
    const _0x927197 = document.createElementNS(_0x1f6b91, 'line');
    (_0x927197.setAttribute('x1', '16'),
      _0x927197.setAttribute('y1', '13'),
      _0x927197.setAttribute('x2', '8'),
      _0x927197.setAttribute('y2', '13'));
    const _0x1ce8e9 = document.createElementNS(_0x1f6b91, 'line');
    (_0x1ce8e9.setAttribute('x1', '16'),
      _0x1ce8e9.setAttribute('y1', '17'),
      _0x1ce8e9.setAttribute('x2', '8'),
      _0x1ce8e9.setAttribute('y2', '17'),
      _0x46d7bb.appendChild(_0x18cf8b),
      _0x46d7bb.appendChild(_0x5936a9),
      _0x46d7bb.appendChild(_0x927197),
      _0x46d7bb.appendChild(_0x1ce8e9));
    const _0x40ca96 = document.createElement('span');
    ((_0x40ca96.className = 'source-text-char-count'),
      (_0x40ca96.textContent = sourceTextText('charCount', { count: 0 })),
      _0x2bef40.appendChild(_0x46d7bb),
      _0x2bef40.appendChild(_0x40ca96),
      _0x2a77c5.appendChild(_0x2bef40));
    const _0x14937d = document.createElement('div');
    _0x14937d.className = 'node-port out-port';
    const _0x1a9cec = document.createElement('div');
    ((_0x1a9cec.className = 'group-resizer'),
      _0x1a9cec.classList.add('v2-resize-move'),
      _0x26046f.appendChild(_0x5c4384),
      _0x26046f.appendChild(_0x2a77c5),
      _0x26046f.appendChild(_0x14937d),
      _0x26046f.appendChild(_0x1a9cec),
      _0x4de87b.appendChild(_0x26046f),
      (this._card = _0x26046f),
      (this._content = _0x5c4384),
      (this._countEl = _0x40ca96),
      this._card.addEventListener('dblclick', (_0x51ef14) => {
        _0x51ef14.stopPropagation();
      }));
    const _0xbbfbb7 = typeof this._data.content === 'string' ? this._data.content : '',
      _0x49c46a = typeof this._data.contentHtml === 'string' ? this._data.contentHtml : '',
      _0x535bf2 = sanitizeRichTextHtml(_0x49c46a);
    _0x535bf2.trim() ? (this._content.innerHTML = _0x535bf2) : (this._content.innerText = _0xbbfbb7);
    const _0x87357d = this._content.innerText || '';
    !_0x87357d
      ? (this._content.dataset.placeholder = sourceTextText('placeholder.initial'))
      : delete this._content.dataset.placeholder;
    ((this._countEl.textContent = sourceTextText('charCount', { count: _0x87357d.length })),
      (this._content.scrollTop = this._lastScrollTop),
      this._content.addEventListener('blur', () => {
        ((this._lastScrollTop = Math.max(0, this._content.scrollTop || 0)),
          this._content.setAttribute('contenteditable', 'false'),
          this.el.classList.remove('source-text-editing'));
        const _0x477a0e = this._content.innerText || '',
          _0x17e3af = _0x477a0e.trim().length > 0 ? sanitizeRichTextHtml(this._content.innerHTML || '') : '';
        if (_0x17e3af.trim()) this._content.innerHTML = _0x17e3af;
        else _0x477a0e && (this._content.innerText = _0x477a0e);
        (appStore.updateNodeData(this.id, {
          content: _0x477a0e,
          contentHtml: _0x17e3af,
          contentScrollTop: this._lastScrollTop,
        }),
          this._updateSizeByLength(_0x477a0e.length, true));
      }),
      this._content.addEventListener('input', () => {
        const _0x886af9 = this._content.innerText || '';
        ((this._countEl.textContent = sourceTextText('charCount', { count: _0x886af9.length })),
          _0x886af9.length > 0
            ? delete this._content.dataset.placeholder
            : (this._content.dataset.placeholder = sourceTextText('placeholder.edit')));
      }));
    let _0x4b3143 = 0,
      _0x5bff30 = 0;
    (this._content.addEventListener('pointerdown', (_0x40450b) => {
      if (this._content.getAttribute('contenteditable') === 'true') {
        _0x40450b.stopPropagation();
        return;
      }
      ((_0x4b3143 = _0x40450b.clientX), (_0x5bff30 = _0x40450b.clientY));
    }),
      this._content.addEventListener('pointerup', (_0x339307) => {
        if (this._content.getAttribute('contenteditable') === 'true') return;
        const _0x20a6f4 = Math.hypot(_0x339307.clientX - _0x4b3143, _0x339307.clientY - _0x5bff30);
        if (_0x20a6f4 < 5) {
          const _0xfa06a2 = this._content.innerText.trim();
          if (_0xfa06a2.length === 0) {
            this._enterEditMode();
            return;
          }
          const _0x50357d = document.caretRangeFromPoint(_0x339307.clientX, _0x339307.clientY);
          if (_0x50357d && this._content.contains(_0x50357d.startContainer)) {
            const _0x32c022 =
              _0x50357d.startContainer.nodeType === Node.TEXT_NODE ? _0x50357d.startContainer : null;
            _0x32c022 && this._enterEditMode();
          }
        }
      }),
      this._content.addEventListener('wheel', (_0x53f9e8) => {
        this._content.scrollHeight > this._content.clientHeight && _0x53f9e8.stopPropagation();
      }),
      this._content.addEventListener('scroll', () => {
        this._lastScrollTop = Math.max(0, this._content.scrollTop || 0);
      }));
    _0x1a9cec &&
      _0x1a9cec.addEventListener('pointerdown', (_0x3216b3) => {
        startNodeResizePreview({
          event: _0x3216b3,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: _0x5325b6, startHeight: _0x5dd735, dx: _0x3e78af, dy: _0x1a7b3d }) => ({
            width: Math.max(150, _0x5325b6 + _0x3e78af),
            height: Math.max(150, _0x5dd735 + _0x1a7b3d),
          }),
          applyPatch: (_0x4d74db) => appStore.updateNodeData(this.id, _0x4d74db),
          commit: commit,
        });
      });
    const _0x5a73a7 = _0x4de87b.querySelector('.node-floating-toolbar');
    return (
      bindTextToolbarEvents(_0x5a73a7, this._data, () => this._content.innerText),
      this._updateSizeByLength(_0x87357d.length, false),
      _0x4de87b
    );
  }
  ['_enterEditMode']() {
    (this._content.setAttribute('contenteditable', 'true'),
      this.el.classList.add('source-text-editing'),
      this._content.focus(),
      (this._content.scrollTop = this._lastScrollTop),
      requestAnimationFrame(() => {
        this._content.scrollTop = this._lastScrollTop;
      }));
    const _0x29079d = appStore.getState().selectedNodeIds;
    if (!_0x29079d.includes(this.id)) appStore.setSelectedNodes([this.id]);
  }
  ['_updateSizeByLength'](_0xa6a8e9, _0x6353ca = false) {
    if (!this._data.width || this._data.width < 100) {
      let _0x2b0560 = 0x104;
      if (_0xa6a8e9 > 0x12c) _0x2b0560 = 0x208;
      _0x6353ca
        ? appStore.updateNodeData(this.id, { width: _0x2b0560, height: _0x2b0560 })
        : ((this._data.width = _0x2b0560), (this._data.height = _0x2b0560));
    }
  }
  ['update'](_0x2c6ccf) {
    this._data = _0x2c6ccf;
    if (!this._content) return;
    Number.isFinite(_0x2c6ccf.contentScrollTop) &&
      (this._lastScrollTop = Math.max(0, _0x2c6ccf.contentScrollTop));
    const _0x3c212b = _0x2c6ccf.content !== undefined || _0x2c6ccf.contentHtml !== undefined;
    if (_0x3c212b && document.activeElement !== this._content) {
      const _0x21c45a = sanitizeRichTextHtml(
          typeof _0x2c6ccf.contentHtml === 'string' ? _0x2c6ccf.contentHtml : '',
        ),
        _0x2ed89a = typeof _0x2c6ccf.content === 'string' ? _0x2c6ccf.content : '';
      _0x21c45a.trim() ? (this._content.innerHTML = _0x21c45a) : (this._content.innerText = _0x2ed89a);
      const _0x4bc2c0 = this._content.innerText || '';
      (!_0x4bc2c0
        ? (this._content.dataset.placeholder = sourceTextText('placeholder.edit'))
        : delete this._content.dataset.placeholder,
        this._countEl &&
          (this._countEl.textContent = sourceTextText('charCount', { count: _0x4bc2c0.length })),
        (this._content.scrollTop = this._lastScrollTop));
    }
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  }
  ['_syncLocaleTexts']() {
    if (!this._content) return;
    const _0x42c064 = this._content.innerText || '';
    (!_0x42c064 &&
      (this._content.dataset.placeholder =
        this._content.getAttribute('contenteditable') === 'true'
          ? sourceTextText('placeholder.edit')
          : sourceTextText('placeholder.initial')),
      this._countEl &&
        (this._countEl.textContent = sourceTextText('charCount', { count: _0x42c064.length })));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(), (this._unsubscribeLocale = null));
  }
}
