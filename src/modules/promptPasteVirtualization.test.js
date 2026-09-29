import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROMPT_VIRTUAL_CHUNK_SIZE,
  PROMPT_VIRTUAL_PASTE_THRESHOLD,
  buildVirtualizedPromptPasteHtml,
  canVirtualizePromptPaste,
  clearVirtualizedPromptCommit,
  hasVirtualizedPromptChunks,
  insertVirtualizedPromptTextAtSelection,
  isVirtualizedPromptEditorCurrent,
  rememberVirtualizedPromptCommit,
  removeVirtualPromptPasteEndMarker,
  serializeVirtualizedPromptHtml,
} from './promptPasteVirtualization.js';

const VIRTUALIZABLE_DOC = () => ({
  execCommand: () => true,
  defaultView: { CSS: { supports: () => true } },
  createRange: () => null,
});

const longText = () => 'x'.repeat(PROMPT_VIRTUAL_PASTE_THRESHOLD);

const textNode = (text) => ({ nodeType: 3, textContent: text });

const elementNode = (tagName, { classes = [], children = [], matches = false } = {}) => ({
  nodeType: 1,
  tagName,
  classList: { contains: (token) => classes.includes(token) },
  childNodes: children,
  matches: () => matches,
  outerHTML: '<span class="ref-pill">P</span>',
});

test('promptPasteVirtualization: 虚拟化阈值 64 KiB、分块 4 KiB', () => {
  assert.equal(PROMPT_VIRTUAL_PASTE_THRESHOLD, 64 * 1024);
  assert.equal(PROMPT_VIRTUAL_CHUNK_SIZE, 4 * 1024);
});

test('promptPasteVirtualization: 空文本不产出任何 HTML', () => {
  assert.equal(buildVirtualizedPromptPasteHtml(''), '');
  assert.equal(buildVirtualizedPromptPasteHtml(), '');
  assert.equal(buildVirtualizedPromptPasteHtml(null), '');
});

test('promptPasteVirtualization: 每个分块一个 span，末尾补一个零宽结束标记', () => {
  const small = buildVirtualizedPromptPasteHtml('a<b>&c');
  assert.equal((small.match(/prompt-virtual-chunk"/g) || []).length, 1);
  assert.equal(small.includes('&lt;'), true, '文本必须转义');
  assert.equal(small.includes('&amp;'), true);
  assert.equal(small.includes('data-prompt-virtual-paste-end="true"'), true);
  assert.equal(small.endsWith('</span>'), true);

  const twoChunks = buildVirtualizedPromptPasteHtml('x'.repeat(5000));
  assert.equal((twoChunks.match(/prompt-virtual-chunk"/g) || []).length, 2);
  assert.equal((twoChunks.match(/<span/g) || []).length, 3, '两块 + 一个结束标记');
});

test('promptPasteVirtualization: 文本短于阈值、或缺 execCommand / CSS.supports 时都不能虚拟化', () => {
  assert.equal(canVirtualizePromptPaste('short'), false);
  assert.equal(canVirtualizePromptPaste(longText(), { documentObject: {} }), false);
  assert.equal(
    canVirtualizePromptPaste(longText(), {
      documentObject: { execCommand() {}, defaultView: { CSS: {} } },
    }),
    false,
  );
  assert.equal(canVirtualizePromptPaste(longText(), { documentObject: VIRTUALIZABLE_DOC() }), true);
});

test('promptPasteVirtualization: canVirtualizePromptPaste 会回落到全局 CSS', () => {
  const saved = globalThis.CSS;
  globalThis.CSS = { supports: () => true };
  try {
    assert.equal(canVirtualizePromptPaste(longText(), { documentObject: { execCommand() {} } }), true);
  } finally {
    if (saved === undefined) delete globalThis.CSS;
    else globalThis.CSS = saved;
  }
});

test('promptPasteVirtualization: hasVirtualizedPromptChunks 只认查询结果是否为真', () => {
  assert.equal(hasVirtualizedPromptChunks({ querySelector: () => ({}) }), true);
  assert.equal(hasVirtualizedPromptChunks({ querySelector: () => null }), false);
  assert.equal(hasVirtualizedPromptChunks({}), false);
  assert.equal(hasVirtualizedPromptChunks(null), false);
});

test('promptPasteVirtualization: 序列化时保留容器与药丸，丢掉危险标签和结束标记', () => {
  assert.equal(serializeVirtualizedPromptHtml({ querySelector: () => null }), null);

  const root = {
    querySelector: () => ({}),
    childNodes: [
      textNode('A&B'),
      elementNode('BR'),
      elementNode('DIV', { children: [textNode('内<x>')] }),
      elementNode('SPAN', { classes: ['ref-pill'] }),
      elementNode('SCRIPT', { children: [textNode('bad')] }),
      elementNode('SPAN', { matches: true }),
    ],
  };
  assert.equal(
    serializeVirtualizedPromptHtml(root),
    'A&amp;B<br><div>内&lt;x&gt;</div><span class="ref-pill" contenteditable="false" data-label="P">P</span>',
  );
});

test('promptPasteVirtualization: 提交换值时只有存在分块才会记住内容', () => {
  const holder = {
    promptEl: { querySelector: (selector) => (selector === '[data-prompt-virtual-chunk]' ? {} : null) },
    _lastPromptContentSig: 'old',
  };
  rememberVirtualizedPromptCommit(holder, 'v1');
  assert.equal(holder._virtualizedPromptCommitValue, 'v1');
  assert.equal(holder._lastPromptContentSig, 'v1');

  assert.equal(isVirtualizedPromptEditorCurrent(holder, 'v1'), true);
  assert.equal(isVirtualizedPromptEditorCurrent(holder, 'v2'), false);

  clearVirtualizedPromptCommit(holder);
  assert.equal(holder._virtualizedPromptCommitValue, null);
  assert.equal(isVirtualizedPromptEditorCurrent(holder, 'v1'), false);

  const plainHolder = { promptEl: { querySelector: () => null } };
  rememberVirtualizedPromptCommit(plainHolder, 'v');
  assert.equal(plainHolder._virtualizedPromptCommitValue, null, '没有分块时提交值被清空');

  assert.equal(rememberVirtualizedPromptCommit(null, 'v'), undefined);
  assert.equal(clearVirtualizedPromptCommit(null), undefined);
  assert.equal(isVirtualizedPromptEditorCurrent(null, 'v'), false);
});

test('promptPasteVirtualization: 插入走 execCommand，成功后摘掉结束标记', () => {
  const marker = { removed: false, remove() { this.removed = true; } };
  const editor = { querySelector: () => marker };
  const calls = [];
  const documentObject = {
    execCommand: (command, ui, html) => {
      calls.push([command, ui, html]);
      return true;
    },
    defaultView: { CSS: { supports: () => true } },
    createRange: () => null,
  };

  assert.equal(insertVirtualizedPromptTextAtSelection(editor, longText(), { documentObject }), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'insertHTML');
  assert.equal(calls[0][1], false);
  assert.equal(calls[0][2].includes('prompt-virtual-chunk'), true);
  assert.equal(marker.removed, true);
});

test('promptPasteVirtualization: execCommand 失败、文本太短或没有编辑器时都不插入', () => {
  const marker = { removed: false, remove() { this.removed = true; } };
  const editor = { querySelector: () => marker };
  const failing = () => ({ execCommand: () => false, defaultView: { CSS: { supports: () => true } } });

  assert.equal(insertVirtualizedPromptTextAtSelection(editor, longText(), { documentObject: failing() }), false);
  assert.equal(marker.removed, false, '插入失败就不动结束标记');
  assert.equal(insertVirtualizedPromptTextAtSelection(editor, 'short', { documentObject: VIRTUALIZABLE_DOC() }), false);
  assert.equal(insertVirtualizedPromptTextAtSelection(null, longText(), { documentObject: VIRTUALIZABLE_DOC() }), false);
});

test('promptPasteVirtualization: execCommand 抛错时被吞掉并返回 false', () => {
  const documentObject = {
    execCommand: () => {
      throw new Error('boom');
    },
    defaultView: { CSS: { supports: () => true } },
  };
  assert.equal(insertVirtualizedPromptTextAtSelection({ querySelector: () => null }, longText(), { documentObject }), false);
});

test('promptPasteVirtualization: 有选区能力时按范围摘标记并把光标落回原处', () => {
  const marker = { removed: false, remove() { this.removed = true; } };
  const range = {
    startBefore: null,
    collapsed: null,
    setStartBefore(node) { this.startBefore = node; },
    collapse(value) { this.collapsed = value; },
  };
  const selection = {
    cleared: false,
    added: null,
    removeAllRanges() { this.cleared = true; },
    addRange(value) { this.added = value; },
  };
  const documentObject = { createRange: () => range, defaultView: { getSelection: () => selection } };

  removeVirtualPromptPasteEndMarker({ querySelector: () => marker }, { documentObject });
  assert.equal(marker.removed, true);
  assert.equal(range.startBefore, marker);
  assert.equal(range.collapsed, true);
  assert.equal(selection.cleared, true);
  assert.equal(selection.added, range);
});

test('promptPasteVirtualization: 没有结束标记时摘标记是空操作，不抛错', () => {
  assert.equal(removeVirtualPromptPasteEndMarker({ querySelector: () => null }, { documentObject: {} }), undefined);
  assert.equal(removeVirtualPromptPasteEndMarker(null, { documentObject: {} }), undefined);
});
