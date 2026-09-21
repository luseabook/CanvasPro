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
  constructor(_0x671343, _0x3bcf5f = '') {
    ((this.owner = _0x671343), (this.values = new Set(String(_0x3bcf5f).split(/\s+/).filter(Boolean))));
  }
  ['_sync']() {
    this.owner.className = [...this.values].join(' ');
  }
  ['add'](..._0x135bda) {
    (_0x135bda.forEach((_0x222c53) => this.values.add(_0x222c53)), this._sync());
  }
  ['remove'](..._0x1f5132) {
    (_0x1f5132.forEach((_0x21b684) => this.values.delete(_0x21b684)), this._sync());
  }
  ['contains'](_0x158a6e) {
    return this.values.has(_0x158a6e);
  }
  ['toggle'](_0x995536, _0x76df3e) {
    const _0x16186f = _0x76df3e === undefined ? !this.values.has(_0x995536) : !!_0x76df3e;
    if (_0x16186f) this.values.add(_0x995536);
    else this.values.delete(_0x995536);
    return (this._sync(), _0x16186f);
  }
}
class FakeButton {
  constructor(_0x231ccd) {
    ((this.className = _0x231ccd),
      (this.dataset = {}),
      (this.attrs = new Map()),
      (this.classList = new FakeClassList(this, _0x231ccd)));
  }
  ['setAttribute'](_0x23a160, _0x5a771b) {
    this.attrs.set(_0x23a160, String(_0x5a771b));
  }
  ['getAttribute'](_0x33d7d4) {
    return this.attrs.get(_0x33d7d4) || '';
  }
  ['closest'](_0x1c8b60) {
    return _0x1c8b60 === 'button' ? this : null;
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
  ['addEventListener'](_0x42fc3c, _0x2e7d74) {
    this.listeners.set(_0x42fc3c, _0x2e7d74);
  }
  ['contains']() {
    return false;
  }
  ['querySelector'](_0x796570) {
    if (_0x796570 === '.act-convert-markdown') return this.markdownBtn;
    return null;
  }
  ['querySelectorAll']() {
    return [];
  }
  ['click'](_0x118373) {
    this.listeners.get('click')?.({ target: _0x118373, stopPropagation() {} });
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
    let _0x5c8c68 = '';
    ((globalThis.window = {
      showToast(_0x21d657) {
        _0x5c8c68 = _0x21d657;
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
    const _0x129f12 = new FakeToolbar(),
      _0x33a067 = { id: 'comment-1', type: 'comment-note', content: '## 标题', width: 0x104, height: 120 };
    (bindCommentNoteToolbarEvents({
      toolbarEl: _0x129f12,
      nodeId: 'comment-1',
      getCurrentStyle: () => ({}),
      enterEditMode: () => {},
      getNodeSnapshot: () => _0x33a067,
    }),
      _0x129f12.click(_0x129f12.markdownBtn));
    const _0x524957 = appStore.getStateRaw().nodes['comment-1'];
    (assert.equal(_0x524957.content, '## 标题'),
      assert.equal(_0x524957.contentFormat, 'markdown'),
      assert.equal(_0x129f12.markdownBtn.classList.contains('is-active'), true),
      assert.equal(_0x129f12.markdownBtn.getAttribute('aria-label'), '切回普通注释'),
      assert.equal(_0x5c8c68, '已转为 Markdown 注释'),
      _0x129f12.click(_0x129f12.markdownBtn));
    const _0x513ca3 = appStore.getStateRaw().nodes['comment-1'];
    (assert.equal(_0x513ca3.content, '## 标题'),
      assert.equal(_0x513ca3.contentFormat, 'plain'),
      assert.equal(_0x129f12.markdownBtn.classList.contains('is-active'), false),
      assert.equal(_0x129f12.markdownBtn.getAttribute('aria-label'), '转为 Markdown 注释'),
      assert.equal(_0x5c8c68, '已切回普通注释'));
  }));
