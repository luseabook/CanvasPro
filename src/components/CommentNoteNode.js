import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { bindCommentNoteToolbarEvents } from './NodeToolbarConfig.js';
import { setStaticInnerHTML } from '../utils/dom.js';
import {
  COMMENT_NOTE_BACKGROUND_COLOR_MAP,
  COMMENT_NOTE_TEXT_COLOR_MAP,
  normalizeCommentNoteStyle,
} from './commentNoteStyle.js';
import { isCommentNoteMarkdown } from './commentNoteFormat.js';
import { COMMENT_NOTE_MIN_HEIGHT, buildCommentNoteContentPatch } from './commentNoteSize.js';
import { renderMarkdownToHtml } from './aigenText/markdownRenderer.js';
const COMMENT_NOTE_PLACEHOLDER = '双击写下注释';
export class CommentNoteNode {
  constructor(_0x54a7b2) {
    ((this._data = _0x54a7b2),
      (this.id = _0x54a7b2.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component'));
  }
  ['mount']() {
    const _0x4f160a = this.el;
    setStaticInnerHTML(_0x4f160a, 'toolbar:comment-note');
    const _0x5c10e6 = document.createElement('div');
    _0x5c10e6.className = 'node-card comment-note-card';
    const _0x1afe96 = document.createElement('div');
    ((_0x1afe96.className = 'comment-note-content'),
      _0x1afe96.setAttribute('contenteditable', 'false'),
      (_0x1afe96.spellcheck = false),
      (_0x1afe96.dataset.placeholder = COMMENT_NOTE_PLACEHOLDER));
    const _0x506ea5 = document.createElement('div');
    ((_0x506ea5.className = 'group-resizer'),
      _0x506ea5.classList.add('v2-resize-move'),
      _0x5c10e6.appendChild(_0x1afe96),
      _0x5c10e6.appendChild(_0x506ea5),
      _0x4f160a.appendChild(_0x5c10e6),
      (this._card = _0x5c10e6),
      (this._content = _0x1afe96),
      this._card.addEventListener('dblclick', (_0x36588) => {
        _0x36588.stopPropagation();
      }),
      this._renderContentFromData(this._data),
      this._content.addEventListener('blur', () => {
        (this._content.setAttribute('contenteditable', 'false'),
          this.el.classList.remove('comment-note-editing'));
        const _0x33884f = this._content.innerText || '',
          _0x32bae6 = appStore.getStateRaw().nodes?.[this.id] || this._data,
          _0x4c9328 = buildCommentNoteContentPatch({
            content: _0x33884f,
            measuredHeight: this._measureAutoHeight(),
            currentHeight: _0x32bae6?.height,
          });
        (appStore.updateNodeData(this.id, _0x4c9328),
          (this._data = { ...this._data, ..._0x4c9328 }),
          this._renderContentFromData(this._data),
          commit());
      }),
      this._content.addEventListener('input', () => {
        const _0x4f7568 = this._content.innerText || '';
        (_0x4f7568.length > 0
          ? delete this._content.dataset.placeholder
          : (this._content.dataset.placeholder = COMMENT_NOTE_PLACEHOLDER),
          this._syncAutoHeightToStore());
      }));
    let _0x4b08b6 = 0,
      _0x36769a = 0;
    (this._content.addEventListener('pointerdown', (_0xef8668) => {
      if (this._content.getAttribute('contenteditable') === 'true') {
        _0xef8668.stopPropagation();
        return;
      }
      ((_0x4b08b6 = _0xef8668.clientX), (_0x36769a = _0xef8668.clientY));
    }),
      this._content.addEventListener('pointerup', (_0x4c856f) => {
        if (this._content.getAttribute('contenteditable') === 'true') return;
        const _0x4e46a2 = Math.hypot(_0x4c856f.clientX - _0x4b08b6, _0x4c856f.clientY - _0x36769a);
        if (_0x4e46a2 >= 5) return;
        const _0x4f6b8f = this._readCurrentRawContent().trim();
        if (!_0x4f6b8f) {
          this._enterEditMode();
          return;
        }
        const _0x2fd9a0 = document.caretRangeFromPoint?.(_0x4c856f.clientX, _0x4c856f.clientY);
        _0x2fd9a0 && this._content.contains(_0x2fd9a0.startContainer) && this._enterEditMode();
      }),
      this._content.addEventListener('wheel', (_0x90fd3) => {
        this._content.scrollHeight > this._content.clientHeight && _0x90fd3.stopPropagation();
      }),
      _0x506ea5.addEventListener('pointerdown', (_0x395099) => {
        startNodeResizePreview({
          event: _0x395099,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: _0x421ab0, startHeight: _0x269147, dx: _0x438bfa, dy: _0x32b13e }) => ({
            width: Math.max(160, _0x421ab0 + _0x438bfa),
            height: Math.max(COMMENT_NOTE_MIN_HEIGHT, _0x269147 + _0x32b13e),
          }),
          applyPatch: (_0x47e959) => appStore.updateNodeData(this.id, _0x47e959),
          commit: commit,
        });
      }));
    const _0x1f2544 = _0x4f160a.querySelector('.node-floating-toolbar');
    return (
      (this._syncToolbarState = bindCommentNoteToolbarEvents({
        toolbarEl: _0x1f2544,
        nodeId: this.id,
        getCurrentStyle: () => normalizeCommentNoteStyle(this._data.style),
        getNodeSnapshot: () => ({
          ...(appStore.getStateRaw().nodes?.[this.id] || this._data),
          content: this._readCurrentRawContent(),
        }),
      })),
      this._applyNodeState(this._data),
      _0x4f160a
    );
  }
  ['_enterEditMode']() {
    const _0x1e4757 = this._readCurrentRawContent();
    (this._content.setAttribute('contenteditable', 'true'),
      this.el.classList.add('comment-note-editing'),
      this._renderContentFromData({ ...this._data, content: _0x1e4757 }, { forceRaw: true }),
      this._syncAutoHeightToStore(),
      this._content.focus());
    const _0x23a0e8 = appStore.getState().selectedNodeIds;
    if (!_0x23a0e8.includes(this.id)) appStore.setSelectedNodes([this.id]);
  }
  ['_readCurrentRawContent']() {
    if (!this._content) return this._data?.content || '';
    if (this._content.getAttribute('contenteditable') === 'true') return this._content.innerText || '';
    return typeof this._data?.content === 'string' ? this._data.content : this._content.innerText || '';
  }
  ['_renderContentFromData'](_0x4dcbb7, { forceRaw: forceRaw = false } = {}) {
    if (!this._content) return;
    const _0x3c9f5d = typeof _0x4dcbb7?.content === 'string' ? _0x4dcbb7.content : '',
      _0xc9a836 = isCommentNoteMarkdown(_0x4dcbb7) && !forceRaw;
    (this._content.classList.toggle('comment-note-content--markdown', isCommentNoteMarkdown(_0x4dcbb7)),
      _0xc9a836
        ? (this._content.innerHTML = renderMarkdownToHtml(_0x3c9f5d))
        : (this._content.innerText = _0x3c9f5d),
      !_0x3c9f5d
        ? (this._content.dataset.placeholder = COMMENT_NOTE_PLACEHOLDER)
        : delete this._content.dataset.placeholder);
  }
  ['_measureAutoHeight']() {
    if (!this._content) return COMMENT_NOTE_MIN_HEIGHT;
    const _0x215047 = this._content.style.height;
    this._content.style.height = 'auto';
    const _0x435419 = Math.ceil(this._content.scrollHeight);
    return ((this._content.style.height = _0x215047), Math.max(COMMENT_NOTE_MIN_HEIGHT, _0x435419));
  }
  ['_syncAutoHeightToStore']({ allowShrink: allowShrink = false } = {}) {
    const _0x5196ef = appStore.getStateRaw().nodes?.[this.id];
    if (!_0x5196ef) return;
    const _0x274290 = this._measureAutoHeight(),
      _0x2be8e7 = Number(_0x5196ef.height) || COMMENT_NOTE_MIN_HEIGHT,
      _0x432287 = allowShrink ? Math.abs(_0x274290 - _0x2be8e7) >= 1 : _0x274290 > _0x2be8e7 + 1;
    if (!_0x432287) return;
    appStore.updateNodeData(this.id, { height: _0x274290 });
  }
  ['_applyNodeState'](_0x3a1aff) {
    const _0x1393fa = normalizeCommentNoteStyle(_0x3a1aff.style);
    (this._card.style.setProperty('--comment-note-font-size', _0x1393fa.fontSize + 'px'),
      this._card.style.setProperty(
        '--comment-note-text-color',
        COMMENT_NOTE_TEXT_COLOR_MAP[_0x1393fa.textColor],
      ),
      this._card.style.setProperty(
        '--comment-note-bg-color',
        COMMENT_NOTE_BACKGROUND_COLOR_MAP[_0x1393fa.backgroundColor],
      ),
      this._card.classList.toggle(
        'comment-note-card--transparent',
        _0x1393fa.backgroundColor === 'transparent',
      ),
      this._syncToolbarState?.(_0x1393fa));
  }
  ['update'](_0x3bc79c) {
    this._data = _0x3bc79c;
    if (!this._content || !this._card) return;
    (document.activeElement !== this._content && this._renderContentFromData(_0x3bc79c),
      this._applyNodeState(_0x3bc79c));
  }
  ['unmount']() {}
}
