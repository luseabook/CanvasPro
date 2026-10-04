import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../../core/stores/appStore.js';
import { COMMENT_NOTE_TOOLBAR_HTML, bindCommentNoteToolbarEvents } from './commentToolbar.js';
const originalWindow = globalThis.window;
afterEach(() => {
  (appStore.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
    typeof originalWindow === 'undefined' ? delete globalThis.window : (globalThis.window = originalWindow));
});
class FakeClassList {
  constructor(value, item = '') {
    ((this.owner = value), (this.values = new Set(String(item).split(/\s+/).filter(Boolean))));
  }
  ['_sync']() {
    this.owner.className = [...this.values].join(' ');
  }
  ['add'](...list) {
    (list.forEach((item2) => this.values.add(item2)), this._sync());
  }
  ['remove'](...list2) {
    (list2.forEach((item3) => this.values.delete(item3)), this._sync());
  }
  ['contains'](key) {
    return this.values.has(key);
  }
  ['toggle'](index, enabled) {
    const result = enabled === undefined ? !this.values.has(index) : !!enabled;
    if (result) this.values.add(index);
    else this.values.delete(index);
    return (this._sync(), result);
  }
}
class FakeButton {
  constructor(data) {
    ((this.className = data),
      (this.dataset = {}),
      (this.attrs = new Map()),
      (this.classList = new FakeClassList(this, data)));
  }
  ['setAttribute'](options, target) {
    this.attrs.set(options, String(target));
  }
  ['getAttribute'](source) {
    return this.attrs.get(source) || '';
  }
  ['closest'](next) {
    return next === 'button' ? this : null;
  }
}
class FakeToolbar {
  constructor() {
    ((this.className = 'node-floating-toolbar v2-comment-toolbar'),
      (this.dataset = {}),
      (this.classList = new FakeClassList(this, this.className)),
      (this.markdownBtn = new FakeButton('ftb-btn icon-only act-convert-markdown')),
      (this.listeners = new Map()));
  }
  ['addEventListener'](current, entry) {
    this.listeners.set(current, entry);
  }
  ['contains']() {
    return false;
  }
  ['querySelector'](record) {
    if (record === '.act-convert-markdown') return this.markdownBtn;
    return null;
  }
  ['querySelectorAll']() {
    return [];
  }
  ['click'](target2) {
    this.listeners.get('click')?.({ target: target2, stopPropagation() {} });
  }
}
(test('commentToolbar: Markdown 转换按钮位于注释节点工具栏', () => {
  (assert.match(COMMENT_NOTE_TOOLBAR_HTML, /act-convert-markdown/),
    assert.match(COMMENT_NOTE_TOOLBAR_HTML, /data-tooltip="转为 Markdown 注释"/),
    assert.match(COMMENT_NOTE_TOOLBAR_HTML, /aria-label="转为 Markdown 注释"/),
    assert.doesNotMatch(COMMENT_NOTE_TOOLBAR_HTML, /act-edit/),
    assert.doesNotMatch(COMMENT_NOTE_TOOLBAR_HTML, /act-copy-node/));
}),
  test('commentToolbar: Markdown 按钮可切换注释格式', () => {
    let payload = '';
    ((globalThis.window = {
      showToast(handle) {
        payload = handle;
      },
    }),
      appStore.loadState({
        nodes: {
          'comment-1': {
            id: 'comment-1',
            type: 'comment-note',
            content: '## 标题',
            width: 0x104,
            height: 120,
          },
        },
        edges: {},
        viewport: { x: 0, y: 0, zoom: 1 },
      }));
    const toolbarEl = new FakeToolbar(),
      state = { id: 'comment-1', type: 'comment-note', content: '## 标题', width: 0x104, height: 120 };
    (bindCommentNoteToolbarEvents({
      toolbarEl: toolbarEl,
      nodeId: 'comment-1',
      getCurrentStyle: () => ({}),
      enterEditMode: () => {},
      getNodeSnapshot: () => state,
    }),
      toolbarEl.click(toolbarEl.markdownBtn));
    const config = appStore.getStateRaw().nodes['comment-1'];
    (assert.equal(config.content, '## 标题'),
      assert.equal(config.contentFormat, 'markdown'),
      assert.equal(toolbarEl.markdownBtn.classList.contains('is-active'), true),
      assert.equal(toolbarEl.markdownBtn.getAttribute('aria-label'), '切回普通注释'),
      assert.equal(payload, '已转为 Markdown 注释'),
      toolbarEl.click(toolbarEl.markdownBtn));
    const scope = appStore.getStateRaw().nodes['comment-1'];
    (assert.equal(scope.content, '## 标题'),
      assert.equal(scope.contentFormat, 'plain'),
      assert.equal(toolbarEl.markdownBtn.classList.contains('is-active'), false),
      assert.equal(toolbarEl.markdownBtn.getAttribute('aria-label'), '转为 Markdown 注释'),
      assert.equal(payload, '已切回普通注释'));
  }));
