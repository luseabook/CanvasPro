import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createVideoPromptEditorElements,
  getVideoFixedInputSlotLabelText,
  renderVideoFixedInputSlotMarkup,
  renderVideoFixedInputSlotsMarkup,
  renderVideoPromptEditorMarkup,
  renderVideoReferenceBarMarkup,
} from './promptInputSurface.js';

function createElement(tagName) {
  const classes = new Set();
  return {
    tagName,
    className: '',
    classList: {
      add(name) {
        classes.add(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    dataset: {},
    children: [],
    appendChild(child) {
      this.children.push(child);
      return child;
    },
  };
}

test('promptInputSurface: fixed slot labels prefer explicit labels, then slot labels, then media kind', () => {
  const config = {
    slotById: {
      slotA: { label: '  自定义槽位  ' },
      sourceVideo: {},
    },
    slotKindById: {
      slotA: 'image',
      sourceVideo: 'sourceVideo',
      slotC: 'video',
      slotD: 'unknown-kind',
    },
  };

  assert.equal(getVideoFixedInputSlotLabelText(config, 'slotA'), '自定义槽位');
  assert.equal(getVideoFixedInputSlotLabelText(config, 'sourceVideo'), '源视频');
  assert.equal(getVideoFixedInputSlotLabelText(config, 'slotC'), '视频');
  assert.equal(getVideoFixedInputSlotLabelText(config, 'slotD'), 'slotD');
});

test('promptInputSurface: editor elements preserve prompt markup and placeholder metadata', () => {
  const documentObject = {
    createElement,
  };
  const result = createVideoPromptEditorElements({
    documentObject,
    promptHtml: '<p>Hello</p>',
    placeholder: 'Describe the shot',
  });

  assert.equal(result.inputWrap.className, 'prompt-input-wrapper');
  assert.equal(result.inputWrap.classList.contains('is-resizable'), true);
  assert.equal(result.promptEl.className, 'prompt-textarea custom-textarea');
  assert.equal(result.promptEl.contentEditable, 'true');
  assert.equal(result.promptEl.spellcheck, false);
  assert.equal(result.promptEl.dataset.placeholder, 'Describe the shot');
  assert.equal(result.promptEl.innerHTML, '<p>Hello</p>');
  assert.equal(result.inputWrap.children[0], result.promptEl);
});

test('promptInputSurface: editor markup sanitizes scripts and escapes placeholder attributes', () => {
  const html = renderVideoPromptEditorMarkup({
    promptHtml: '<p>Hello</p><script>alert(1)</script>',
    placeholder: 'A "quote"',
    attributes: ' data-mode="edit" ',
  });

  assert.match(html, /<p>Hello<\/p>/);
  assert.equal(html.includes('<script'), false);
  assert.match(html, /data-placeholder="A &quot;quote&quot;"/);
  assert.match(html, /data-mode="edit"/);
});

test('promptInputSurface: fixed slot rendering distinguishes empty, editable, and read-only states', () => {
  const fixedInputConfig = {
    visibleSlots: ['refImage'],
    slotById: { refImage: { label: '参考图' } },
    slotKindById: { refImage: 'image' },
  };

  const empty = renderVideoFixedInputSlotMarkup({
    fixedInputConfig,
    slot: 'refImage',
    input: null,
  });
  assert.match(empty, /^<button type="button"/);
  assert.match(empty, /data-slot="refImage"/);
  assert.match(empty, /data-kind="image"/);

  const readOnlyEmpty = renderVideoFixedInputSlotMarkup({
    fixedInputConfig,
    slot: 'refImage',
    input: null,
    readOnly: true,
  });
  assert.match(readOnlyEmpty, /is-empty/);
  assert.match(readOnlyEmpty, /role="img"/);

  const editable = renderVideoFixedInputSlotMarkup({
    fixedInputConfig,
    slot: 'refImage',
    input: { imageUrl: 'data/ref.png' },
  });
  assert.match(editable, /<img src="data\/ref.png"/);
  assert.match(editable, /ref-thumb-delete/);
  assert.match(editable, /data-ref-origin="asset"/);
});

test('promptInputSurface: multiple fixed slots honor per-slot read-only overrides', () => {
  const html = renderVideoFixedInputSlotsMarkup({
    fixedInputConfig: {
      visibleSlots: ['sourceVideo', 'refImage'],
      slotById: {},
      slotKindById: { sourceVideo: 'sourceVideo', refImage: 'image' },
    },
    inputsBySlot: {
      sourceVideo: { videoUrl: 'data/source.mp4' },
      refImage: { imageUrl: 'data/ref.png' },
    },
    readOnlySlots: ['refImage'],
  });

  assert.match(html, /data-slot="sourceVideo"/);
  assert.match(html, /data-slot="refImage"/);
  assert.match(html, /ref-thumb-wrap--readonly/);
  assert.equal((html.match(/ref-thumb-delete/g) || []).length, 1);
});

test('promptInputSurface: reference bar reports active state from visible references', () => {
  const inactive = renderVideoReferenceBarMarkup({ inputs: [] });
  assert.match(inactive, /class="node-ref-bar"/);
  assert.match(inactive, /prompt-attachment-btn/);

  const active = renderVideoReferenceBarMarkup({
    inputs: [{ kind: 'image', imageUrl: 'data/ref.png' }],
  });
  assert.match(active, /class="node-ref-bar active"/);
  assert.match(active, /ref-thumb-container/);
});
