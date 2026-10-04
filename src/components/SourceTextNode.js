import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { bindTextToolbarEvents } from './NodeToolbarConfig.js';
import { sanitizeRichTextHtml, setStaticInnerHTML } from '../utils/dom.js';
function sourceTextText(value, item = {}) {
  return t('sourceTextNode.' + value, item);
}
export class SourceTextNode {
  constructor(key) {
    ((this._data = key),
      (this.el = document.createElement('div')),
      (this.id = key.id),
      (this.el.className = 'v2-node-component'),
      (this._lastScrollTop = Number.isFinite(key?.contentScrollTop) ? Math.max(0, key.contentScrollTop) : 0),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const el = this.el;
    setStaticInnerHTML(el, 'toolbar:text');
    const el2 = document.createElement('div');
    el2.className = 'node-card source-text-card';
    const el3 = document.createElement('div');
    ((el3.className = 'source-text-content'),
      el3.setAttribute('contenteditable', 'false'),
      (el3.spellcheck = false),
      (el3.dataset.placeholder = sourceTextText('placeholder.initial')));
    const el4 = document.createElement('div');
    el4.className = 'source-text-footer';
    const el5 = document.createElement('div');
    el5.className = 'source-text-info';
    const index = 'http://www.w3.org/2000/svg',
      el6 = document.createElementNS(index, 'svg');
    (el6.setAttribute('width', '12'),
      el6.setAttribute('height', '12'),
      el6.setAttribute('viewBox', '0 0 24 24'),
      el6.setAttribute('fill', 'none'),
      el6.setAttribute('stroke', 'currentColor'),
      el6.setAttribute('stroke-width', '2'),
      (el6.style.opacity = '0.4'));
    const el7 = document.createElementNS(index, 'path');
    el7.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
    const el8 = document.createElementNS(index, 'polyline');
    el8.setAttribute('points', '14 2 14 8 20 8');
    const el9 = document.createElementNS(index, 'line');
    (el9.setAttribute('x1', '16'),
      el9.setAttribute('y1', '13'),
      el9.setAttribute('x2', '8'),
      el9.setAttribute('y2', '13'));
    const el10 = document.createElementNS(index, 'line');
    (el10.setAttribute('x1', '16'),
      el10.setAttribute('y1', '17'),
      el10.setAttribute('x2', '8'),
      el10.setAttribute('y2', '17'),
      el6.appendChild(el7),
      el6.appendChild(el8),
      el6.appendChild(el9),
      el6.appendChild(el10));
    const el11 = document.createElement('span');
    ((el11.className = 'source-text-char-count'),
      (el11.textContent = sourceTextText('charCount', { count: 0 })),
      el5.appendChild(el6),
      el5.appendChild(el11),
      el4.appendChild(el5));
    const result = document.createElement('div');
    result.className = 'node-port out-port';
    const el12 = document.createElement('div');
    ((el12.className = 'group-resizer'),
      el12.classList.add('v2-resize-move'),
      el2.appendChild(el3),
      el2.appendChild(el4),
      el2.appendChild(result),
      el2.appendChild(el12),
      el.appendChild(el2),
      (this._card = el2),
      (this._content = el3),
      (this._countEl = el11),
      this._card.addEventListener('dblclick', (event) => {
        event.stopPropagation();
      }));
    const data = typeof this._data.content === 'string' ? this._data.content : '',
      options = typeof this._data.contentHtml === 'string' ? this._data.contentHtml : '',
      sanitizeRichTextHtml2 = sanitizeRichTextHtml(options);
    sanitizeRichTextHtml2.trim()
      ? (this._content.innerHTML = sanitizeRichTextHtml2)
      : (this._content.innerText = data);
    const count = this._content.innerText || '';
    !count
      ? (this._content.dataset.placeholder = sourceTextText('placeholder.initial'))
      : delete this._content.dataset.placeholder;
    ((this._countEl.textContent = sourceTextText('charCount', { count: count.length })),
      (this._content.scrollTop = this._lastScrollTop),
      this._content.addEventListener('blur', () => {
        ((this._lastScrollTop = Math.max(0, this._content.scrollTop || 0)),
          this._content.setAttribute('contenteditable', 'false'),
          this.el.classList.remove('source-text-editing'));
        const content = this._content.innerText || '',
          contentHtml = content.trim().length > 0 ? sanitizeRichTextHtml(this._content.innerHTML || '') : '';
        if (contentHtml.trim()) this._content.innerHTML = contentHtml;
        else content && (this._content.innerText = content);
        (appStore.updateNodeData(this.id, {
          content: content,
          contentHtml: contentHtml,
          contentScrollTop: this._lastScrollTop,
        }),
          this._updateSizeByLength(content.length, true));
      }),
      this._content.addEventListener('input', () => {
        const count2 = this._content.innerText || '';
        ((this._countEl.textContent = sourceTextText('charCount', { count: count2.length })),
          count2.length > 0
            ? delete this._content.dataset.placeholder
            : (this._content.dataset.placeholder = sourceTextText('placeholder.edit')));
      }));
    let target = 0,
      source = 0;
    (this._content.addEventListener('pointerdown', (event2) => {
      if (this._content.getAttribute('contenteditable') === 'true') {
        event2.stopPropagation();
        return;
      }
      ((target = event2.clientX), (source = event2.clientY));
    }),
      this._content.addEventListener('pointerup', (event3) => {
        if (this._content.getAttribute('contenteditable') === 'true') return;
        const count3 = Math.hypot(event3.clientX - target, event3.clientY - source);
        if (count3 < 5) {
          const list = this._content.innerText.trim();
          if (list.length === 0) {
            this._enterEditMode();
            return;
          }
          const next = document.caretRangeFromPoint(event3.clientX, event3.clientY);
          if (next && this._content.contains(next.startContainer)) {
            const current = next.startContainer.nodeType === Node.TEXT_NODE ? next.startContainer : null;
            current && this._enterEditMode();
          }
        }
      }),
      this._content.addEventListener('wheel', (event4) => {
        this._content.scrollHeight > this._content.clientHeight && event4.stopPropagation();
      }),
      this._content.addEventListener('scroll', () => {
        this._lastScrollTop = Math.max(0, this._content.scrollTop || 0);
      }));
    el12 &&
      el12.addEventListener('pointerdown', (event5) => {
        startNodeResizePreview({
          event: event5,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => ({
            width: Math.max(150, startWidth + dx),
            height: Math.max(150, startHeight + dy),
          }),
          applyPatch: (entry) => appStore.updateNodeData(this.id, entry),
          commit: commit,
        });
      });
    const record = el.querySelector('.node-floating-toolbar');
    return (
      bindTextToolbarEvents(record, this._data, () => this._content.innerText),
      this._updateSizeByLength(count.length, false),
      el
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
    const list2 = appStore.getState().selectedNodeIds;
    if (!list2.includes(this.id)) appStore.setSelectedNodes([this.id]);
  }
  ['_updateSizeByLength'](count4, payload = false) {
    if (!this._data.width || this._data.width < 100) {
      let width = 0x104;
      if (count4 > 0x12c) width = 0x208;
      payload
        ? appStore.updateNodeData(this.id, { width: width, height: width })
        : ((this._data.width = width), (this._data.height = width));
    }
  }
  ['update'](handle) {
    this._data = handle;
    if (!this._content) return;
    Number.isFinite(handle.contentScrollTop) && (this._lastScrollTop = Math.max(0, handle.contentScrollTop));
    const state = handle.content !== undefined || handle.contentHtml !== undefined;
    if (state && document.activeElement !== this._content) {
      const sanitizeRichTextHtml3 = sanitizeRichTextHtml(
          typeof handle.contentHtml === 'string' ? handle.contentHtml : '',
        ),
        config = typeof handle.content === 'string' ? handle.content : '';
      sanitizeRichTextHtml3.trim()
        ? (this._content.innerHTML = sanitizeRichTextHtml3)
        : (this._content.innerText = config);
      const count5 = this._content.innerText || '';
      (!count5
        ? (this._content.dataset.placeholder = sourceTextText('placeholder.edit'))
        : delete this._content.dataset.placeholder,
        this._countEl && (this._countEl.textContent = sourceTextText('charCount', { count: count5.length })),
        (this._content.scrollTop = this._lastScrollTop));
    }
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  }
  ['_syncLocaleTexts']() {
    if (!this._content) return;
    const count6 = this._content.innerText || '';
    (!count6 &&
      (this._content.dataset.placeholder =
        this._content.getAttribute('contenteditable') === 'true'
          ? sourceTextText('placeholder.edit')
          : sourceTextText('placeholder.initial')),
      this._countEl && (this._countEl.textContent = sourceTextText('charCount', { count: count6.length })));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(), (this._unsubscribeLocale = null));
  }
}
