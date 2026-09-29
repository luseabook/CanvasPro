import test from 'node:test';
import assert from 'node:assert/strict';

import { t } from '../../i18n/index.js';
import { createVideoGenerationErrorCard } from './videoGenerationErrorCard.js';

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

test('videoGenerationErrorCard: uses the video result title and provided error detail', () => {
  const previousDocument = globalThis.document;
  globalThis.document = createDocumentObject();
  try {
    const card = createVideoGenerationErrorCard('Quota exceeded');

    assert.equal(card.children[1].textContent, t('videoResultRender.generationFailed'));
    assert.equal(card.children[2].textContent, 'Quota exceeded');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
