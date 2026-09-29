import test from 'node:test';
import assert from 'node:assert/strict';

import { createMentionMenuItem, positionMentionMenu } from './mentionMenu.js';

function withGlobals(values, callback) {
  const previous = new Map();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, globalThis[key]);
    globalThis[key] = value;
  }
  try {
    return callback();
  } finally {
    for (const [key, value] of previous) {
      if (typeof value === 'undefined') delete globalThis[key];
      else globalThis[key] = value;
    }
  }
}

function createDocumentLike() {
  return {
    createElement(tagName) {
      const classes = new Set();
      return {
        tagName,
        className: '',
        textContent: '',
        hidden: false,
        children: [],
        classList: {
          toggle(name, enabled) {
            if (enabled) classes.add(name);
            else classes.delete(name);
          },
          contains(name) {
            return classes.has(name);
          },
        },
        appendChild(child) {
          this.children.push(child);
          return child;
        },
      };
    },
  };
}

test('mentionMenu: creates the item structure and modifier classes', () => {
  const documentLike = createDocumentLike();
  const result = withGlobals({ document: documentLike }, () =>
    createMentionMenuItem({
      label: 'Image',
      subtitle: 'PNG',
      disabled: true,
      hasSubmenu: true,
      compactVisual: true,
    }),
  );

  assert.match(result.item.className, /at-mention-disabled/);
  assert.match(result.item.className, /at-mention-has-submenu/);
  assert.match(result.item.className, /at-mention-compact-visual/);
  assert.equal(result.labelEl.textContent, 'Image');
  assert.equal(result.subtitleEl.textContent, 'PNG');
  assert.equal(result.subtitleEl.hidden, false);
  assert.equal(result.item.classList.contains('at-mention-has-subtitle'), true);
});

test('mentionMenu: hides an empty subtitle', () => {
  const documentLike = createDocumentLike();
  const result = withGlobals({ document: documentLike }, () => createMentionMenuItem({ label: 'Text' }));

  assert.equal(result.subtitleEl.hidden, true);
  assert.equal(result.item.classList.contains('at-mention-has-subtitle'), false);
});

test('mentionMenu: clamps the menu horizontally to the viewport', () => {
  const element = {
    style: { maxHeight: '123px' },
    offsetWidth: 0,
    offsetHeight: 0,
    getBoundingClientRect() {
      return { width: 100, height: 50 };
    },
  };

  withGlobals({ window: { innerWidth: 300, innerHeight: 200 } }, () => {
    positionMentionMenu(element, { left: 270, top: 20, anchorTop: 40 });
  });

  assert.equal(element.style.left, '188px');
  assert.equal(element.style.top, '20px');
  assert.equal(element.style.maxHeight, '50px');
});

test('mentionMenu: flips upward and constrains height near the bottom edge', () => {
  const element = {
    style: {},
    offsetWidth: 0,
    offsetHeight: 0,
    getBoundingClientRect() {
      return { width: 100, height: 150 };
    },
  };

  withGlobals({ window: { innerWidth: 300, innerHeight: 200 } }, () => {
    positionMentionMenu(element, { left: 20, top: 180, anchorTop: 100 });
  });

  assert.equal(element.style.maxHeight, '88px');
  assert.equal(element.style.left, '20px');
  assert.equal(element.style.top, '12px');
});
