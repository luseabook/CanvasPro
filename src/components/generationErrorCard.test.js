import test from 'node:test';
import assert from 'node:assert/strict';

import { createGenerationErrorCard, renderGenerationErrorCardMarkup } from './generationErrorCard.js';

function createDocumentObject() {
  return {
    createElement(tagName) {
      return {
        tagName,
        className: '',
        innerHTML: '',
        textContent: '',
        children: [],
        appendChild(child) {
          this.children.push(child);
          return child;
        },
      };
    },
  };
}

test('generationErrorCard: creates the card DOM with title and detail fallback', () => {
  const card = createGenerationErrorCard({
    title: '   ',
    errorMessage: '',
    className: ' custom ',
    documentObject: createDocumentObject(),
  });

  assert.equal(card.className, 'gen-error-card custom');
  assert.equal(card.children.length, 3);
  assert.equal(card.children[1].textContent, '生成失败');
  assert.equal(card.children[2].textContent, '生成失败');
});

test('generationErrorCard: uses explicit detail text in the DOM card', () => {
  const card = createGenerationErrorCard({
    title: 'Request failed',
    errorMessage: 'Quota exceeded',
    documentObject: createDocumentObject(),
  });

  assert.equal(card.children[1].textContent, 'Request failed');
  assert.equal(card.children[2].textContent, 'Quota exceeded');
});

test('generationErrorCard: markup escapes text, class, and role attributes', () => {
  const html = renderGenerationErrorCardMarkup({
    title: '<b>Bad</b>',
    errorMessage: 'A & "B"',
    className: 'alert" onmouseover',
    role: 'alert"',
  });

  assert.match(html, /role="alert&quot;"/);
  assert.match(html, /<span class="gen-error-card-title">&lt;b&gt;Bad&lt;\/b&gt;<\/span>/);
  assert.match(html, /<span class="gen-error-card-detail">A &amp; &quot;B&quot;<\/span>/);
  assert.doesNotMatch(html, /<b>Bad<\/b>/);
  assert.match(html, /class="gen-error-card alert&quot; onmouseover"/);
});
