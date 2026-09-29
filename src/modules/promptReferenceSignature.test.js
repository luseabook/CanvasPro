import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPromptReferenceSignature } from './promptReferenceSignature.js';

test('returns an empty signature for empty or missing input', () => {
  assert.equal(getPromptReferenceSignature(), '');
  assert.equal(getPromptReferenceSignature(''), '');
  assert.equal(getPromptReferenceSignature(null), '');
  assert.equal(getPromptReferenceSignature('<div>no spans</div>'), '');
});

test('extracts a single ref-pill span verbatim', () => {
  const html = '<span class="ref-pill" data-id="1">@foo</span>';
  assert.equal(getPromptReferenceSignature(html), '<span class="ref-pill" data-id="1">');
});

test('keeps only ref-pill spans and joins them with newlines', () => {
  const html = [
    '<span class="other">ignore</span>',
    '<span class="ref-pill">a</span>',
    '<span class="plain">ignore</span>',
    '<span class="attached-ref-pill tail">b</span>',
  ].join('');
  assert.equal(
    getPromptReferenceSignature(html),
    '<span class="ref-pill">\n<span class="attached-ref-pill tail">',
  );
});

test('matches class names case-insensitively and with either quote style', () => {
  assert.equal(getPromptReferenceSignature("<SPAN CLASS='REF-PILL'>"), "<SPAN CLASS='REF-PILL'>");
});

test('requires a full ref-pill word and an exact class attribute name', () => {
  assert.equal(getPromptReferenceSignature('<span class="ref-pilly">'), '');
  assert.equal(getPromptReferenceSignature('<span class = "ref-pill">'), '');
  assert.equal(getPromptReferenceSignature('<span class="ref-pill-2">'), '<span class="ref-pill-2">');
});

test('ignores non-span elements even when they carry ref-pill', () => {
  assert.equal(getPromptReferenceSignature('<div class="ref-pill"></div>'), '');
  assert.equal(getPromptReferenceSignature('<a class="ref-pill">x</a>'), '');
});

test('returns an empty string when no closing angle bracket terminates the tag', () => {
  assert.equal(getPromptReferenceSignature('<span class="ref-pill"'), '');
});
