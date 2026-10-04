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
  constructor(value) {
    ((this._data = value),
      (this.id = value.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component'));
  }
  ['mount']() {
    const el = this.el;
    setStaticInnerHTML(el, 'toolbar:comment-note');
    const el2 = document.createElement('div');
    el2.className = 'node-card comment-note-card';
    const el3 = document.createElement('div');
    ((el3.className = 'comment-note-content'),
      el3.setAttribute('contenteditable', 'false'),
      (el3.spellcheck = false),
      (el3.dataset.placeholder = COMMENT_NOTE_PLACEHOLDER));
    const el4 = document.createElement('div');
    ((el4.className = 'group-resizer'),
      el4.classList.add('v2-resize-move'),
      el2.appendChild(el3),
      el2.appendChild(el4),
      el.appendChild(el2),
      (this._card = el2),
      (this._content = el3),
      this._card.addEventListener('dblclick', (event) => {
        event.stopPropagation();
      }),
      this._renderContentFromData(this._data),
      this._content.addEventListener('blur', () => {
        (this._content.setAttribute('contenteditable', 'false'),
          this.el.classList.remove('comment-note-editing'));
        const content = this._content.innerText || '',
          currentHeight = appStore.getStateRaw().nodes?.[this.id] || this._data,
          args = buildCommentNoteContentPatch({
            content: content,
            measuredHeight: this._measureAutoHeight(),
            currentHeight: currentHeight?.height,
          });
        (appStore.updateNodeData(this.id, args),
          (this._data = { ...this._data, ...args }),
          this._renderContentFromData(this._data),
          commit());
      }),
      this._content.addEventListener('input', () => {
        const list = this._content.innerText || '';
        (list.length > 0
          ? delete this._content.dataset.placeholder
          : (this._content.dataset.placeholder = COMMENT_NOTE_PLACEHOLDER),
          this._syncAutoHeightToStore());
      }));
    let item = 0,
      key = 0;
    (this._content.addEventListener('pointerdown', (event2) => {
      if (this._content.getAttribute('contenteditable') === 'true') {
        event2.stopPropagation();
        return;
      }
      ((item = event2.clientX), (key = event2.clientY));
    }),
      this._content.addEventListener('pointerup', (event3) => {
        if (this._content.getAttribute('contenteditable') === 'true') return;
        const count = Math.hypot(event3.clientX - item, event3.clientY - key);
        if (count >= 5) return;
        const enabled = this._readCurrentRawContent().trim();
        if (!enabled) {
          this._enterEditMode();
          return;
        }
        const index = document.caretRangeFromPoint?.(event3.clientX, event3.clientY);
        index && this._content.contains(index.startContainer) && this._enterEditMode();
      }),
      this._content.addEventListener('wheel', (event4) => {
        this._content.scrollHeight > this._content.clientHeight && event4.stopPropagation();
      }),
      el4.addEventListener('pointerdown', (event5) => {
        startNodeResizePreview({
          event: event5,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => ({
            width: Math.max(160, startWidth + dx),
            height: Math.max(COMMENT_NOTE_MIN_HEIGHT, startHeight + dy),
          }),
          applyPatch: (result) => appStore.updateNodeData(this.id, result),
          commit: commit,
        });
      }));
    const toolbarEl = el.querySelector('.node-floating-toolbar');
    return (
      (this._syncToolbarState = bindCommentNoteToolbarEvents({
        toolbarEl: toolbarEl,
        nodeId: this.id,
        getCurrentStyle: () => normalizeCommentNoteStyle(this._data.style),
        getNodeSnapshot: () => ({
          ...(appStore.getStateRaw().nodes?.[this.id] || this._data),
          content: this._readCurrentRawContent(),
        }),
      })),
      this._applyNodeState(this._data),
      el
    );
  }
  ['_enterEditMode']() {
    const content2 = this._readCurrentRawContent();
    (this._content.setAttribute('contenteditable', 'true'),
      this.el.classList.add('comment-note-editing'),
      this._renderContentFromData({ ...this._data, content: content2 }, { forceRaw: true }),
      this._syncAutoHeightToStore(),
      this._content.focus());
    const list2 = appStore.getState().selectedNodeIds;
    if (!list2.includes(this.id)) appStore.setSelectedNodes([this.id]);
  }
  ['_readCurrentRawContent']() {
    if (!this._content) return this._data?.content || '';
    if (this._content.getAttribute('contenteditable') === 'true') return this._content.innerText || '';
    return typeof this._data?.content === 'string' ? this._data.content : this._content.innerText || '';
  }
  ['_renderContentFromData'](data, { forceRaw: forceRaw = false } = {}) {
    if (!this._content) return;
    const enabled2 = typeof data?.content === 'string' ? data.content : '',
      isCommentNoteMarkdown2 = isCommentNoteMarkdown(data) && !forceRaw;
    (this._content.classList.toggle('comment-note-content--markdown', isCommentNoteMarkdown(data)),
      isCommentNoteMarkdown2
        ? (this._content.innerHTML = renderMarkdownToHtml(enabled2))
        : (this._content.innerText = enabled2),
      !enabled2
        ? (this._content.dataset.placeholder = COMMENT_NOTE_PLACEHOLDER)
        : delete this._content.dataset.placeholder);
  }
  ['_measureAutoHeight']() {
    if (!this._content) return COMMENT_NOTE_MIN_HEIGHT;
    const options = this._content.style.height;
    this._content.style.height = 'auto';
    const target = Math.ceil(this._content.scrollHeight);
    return ((this._content.style.height = options), Math.max(COMMENT_NOTE_MIN_HEIGHT, target));
  }
  ['_syncAutoHeightToStore']({ allowShrink: allowShrink = false } = {}) {
    const box = appStore.getStateRaw().nodes?.[this.id];
    if (!box) return;
    const height = this._measureAutoHeight(),
      source = Number(box.height) || COMMENT_NOTE_MIN_HEIGHT,
      enabled3 = allowShrink ? Math.abs(height - source) >= 1 : height > source + 1;
    if (!enabled3) return;
    appStore.updateNodeData(this.id, { height: height });
  }
  ['_applyNodeState'](el5) {
    const commentNoteStyle = normalizeCommentNoteStyle(el5.style);
    (this._card.style.setProperty('--comment-note-font-size', commentNoteStyle.fontSize + 'px'),
      this._card.style.setProperty(
        '--comment-note-text-color',
        COMMENT_NOTE_TEXT_COLOR_MAP[commentNoteStyle.textColor],
      ),
      this._card.style.setProperty(
        '--comment-note-bg-color',
        COMMENT_NOTE_BACKGROUND_COLOR_MAP[commentNoteStyle.backgroundColor],
      ),
      this._card.classList.toggle(
        'comment-note-card--transparent',
        commentNoteStyle.backgroundColor === 'transparent',
      ),
      this._syncToolbarState?.(commentNoteStyle));
  }
  ['update'](next) {
    this._data = next;
    if (!this._content || !this._card) return;
    (document.activeElement !== this._content && this._renderContentFromData(next),
      this._applyNodeState(next));
  }
  ['unmount']() {}
}
