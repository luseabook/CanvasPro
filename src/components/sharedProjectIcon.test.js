import test from 'node:test';
import assert from 'node:assert/strict';

import { createCanvasProjectBadge, createSharedProjectIcon } from './sharedProjectIcon.js';

function createDocumentLike() {
  const created = [];
  return {
    created,
    createElementNS(namespace, tagName) {
      const attributes = new Map();
      const classes = new Set();
      const element = {
        namespace,
        tagName,
        attributes,
        children: [],
        classList: {
          add(name) {
            classes.add(name);
          },
          has(name) {
            return classes.has(name);
          },
        },
        setAttribute(name, value) {
          attributes.set(name, value);
        },
        removeAttribute(name) {
          attributes.delete(name);
        },
        append(child) {
          element.children.push(child);
        },
      };
      created.push(element);
      return element;
    },
  };
}

test('sharedProjectIcon: creates a shared icon with the expected SVG attributes', () => {
  const documentLike = createDocumentLike();
  const icon = createSharedProjectIcon(documentLike);
  const path = icon.children[0];

  assert.equal(icon.namespace, 'http://www.w3.org/2000/svg');
  assert.equal(icon.tagName, 'svg');
  assert.equal(icon.attributes.get('viewBox'), '0 0 24 24');
  assert.equal(icon.attributes.get('aria-hidden'), 'true');
  assert.match(path.attributes.get('d'), /^M16 21/);
});

test('sharedProjectIcon: switches to the host path for a host badge', () => {
  const documentLike = createDocumentLike();
  const icon = createSharedProjectIcon(documentLike, { host: true });
  assert.match(icon.children[0].attributes.get('d'), /^M4 21/);
});

test('sharedProjectIcon: decorates shared-project badges and rejects other badges', () => {
  const documentLike = createDocumentLike();
  const badge = createCanvasProjectBadge({ badge: 'shared-host', label: 'Shared host' }, documentLike);

  assert.equal(badge.classList.has('canvas-project-badge'), true);
  assert.equal(badge.attributes.get('data-badge'), 'shared-host');
  assert.equal(badge.attributes.get('aria-label'), 'Shared host');
  assert.equal(badge.attributes.has('aria-hidden'), false);
  assert.equal(createCanvasProjectBadge({ badge: 'private' }, documentLike), null);
});
