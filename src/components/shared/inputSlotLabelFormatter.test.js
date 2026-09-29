import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeInputSlotLabelHtml, formatInputSlotLabelHtml } from './inputSlotLabelFormatter.js';

test('inputSlotLabelFormatter: escapes HTML-sensitive characters', () => {
  assert.equal(
    escapeInputSlotLabelHtml(`<a href="x">Tom & 'Jerry'</a>`),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
  );
});

test('inputSlotLabelFormatter: wraps four and five Chinese characters', () => {
  assert.equal(formatInputSlotLabelHtml('参考图像'), '参考<br>图像');
  assert.equal(formatInputSlotLabelHtml('参考图像位'), '参考图<br>像位');
});

test('inputSlotLabelFormatter: converts whitespace and trims the label', () => {
  assert.equal(formatInputSlotLabelHtml('  first  second\nthird  '), 'first<br>second<br>third');
  assert.equal(formatInputSlotLabelHtml('   '), '');
});
