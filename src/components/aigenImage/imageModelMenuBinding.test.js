import test from 'node:test';
import assert from 'node:assert/strict';

import { bindImageModelMenuGroups } from './imageModelMenuBinding.js';

function createClassList() {
  const values = new Set();
  return {
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
    contains(value) {
      return values.has(value);
    },
  };
}

function createElement({ dataset = {}, query = {}, items = [] } = {}) {
  const listeners = new Map();
  return {
    dataset,
    style: {},
    classList: createClassList(),
    textContent: '',
    querySelector: (selector) => query[selector] || null,
    querySelectorAll: (selector) => (selector === '.floating-menu-item' ? items : []),
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    click() {
      listeners.get('click')?.();
    },
  };
}

test('imageModelMenuBinding: ignores menus without declared submenus', () => {
  assert.deepEqual(
    bindImageModelMenuGroups({
      modelMenu: { querySelectorAll: () => [] },
      modelTrigger: {},
    }),
    [],
  );
});

test('imageModelMenuBinding: binds generic provider submenus and applies their selection', () => {
  const title = { textContent: 'Vendor X' };
  const item = createElement({
    dataset: { value: 'vendor/model-x', provider: 'vendor' },
    query: { '.fmi-title': title },
  });
  const submenu = createElement({
    dataset: { provider: 'vendor' },
    items: [item],
  });
  const header = createElement({
    dataset: { nodeMenuSubmenu: '.vendor-submenu' },
  });
  const modelMenu = createElement({
    query: {
      '.vendor-submenu': submenu,
      '[data-vendor-toggle]': header,
    },
  });
  modelMenu.querySelectorAll = (selector) => (selector === '[data-node-menu-submenu]' ? [header] : []);
  const modelTrigger = createElement();
  const modelLabel = { textContent: 'Old model' };
  const updates = [];
  const afterSelect = [];
  const store = {
    getState: () => ({ nodes: { 'image-1': { model: 'old', provider: 'vendor' } } }),
    updateNodeData: (nodeId, patch) => updates.push([nodeId, patch]),
  };

  const bindings = bindImageModelMenuGroups({
    modelMenu,
    modelTrigger,
    modelLabel,
    nodeId: 'image-1',
    store,
    toggleSelector: '[data-vendor-toggle]',
    submenuSelector: '.vendor-submenu',
    afterSelect: (selection) => afterSelect.push(selection),
  });

  assert.equal(bindings.length, 1);
  item.click();
  assert.deepEqual(updates, [['image-1', { model: 'vendor/model-x', provider: 'vendor' }]]);
  assert.equal(modelLabel.textContent, 'Vendor X');
  assert.equal(afterSelect.length, 1);
  assert.equal(afterSelect[0].model, 'vendor/model-x');
  assert.equal(afterSelect[0].provider, 'vendor');
});
