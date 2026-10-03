import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getProviderModelCatalogPanelId,
  getProviderModelRowState,
  isProviderModelIntegrated,
  readProviderModelCatalogSelection,
  renderProviderModelCatalogPanel,
  resolveProviderModelAppModelId,
} from './providerModelCatalogPanel.js';

function parseCheckboxes(html) {
  const out = [];
  const pattern = /<input type="checkbox" data-provider-model-id="([^"]*)"([^>]*)\/>/g;
  let match;
  while ((match = pattern.exec(html))) {
    const rest = match[2];
    out.push({
      id: match[1],
      checked: / checked/.test(' ' + rest),
      disabled: / disabled/.test(' ' + rest),
    });
  }
  return out;
}

function parseSelects(html) {
  const out = new Map();
  const pattern = /data-provider-model-kind="([^"]*)"[^>]*>([\s\S]*?)<\/select>/g;
  let match;
  while ((match = pattern.exec(html))) {
    const selected = /<option value="([^"]*)" selected>/.exec(match[2]);
    out.set(match[1], selected ? selected[1] : '');
  }
  return out;
}

function createDocumentStub({ html = '' } = {}) {
  const element = {
    id: '',
    hidden: true,
    innerHTML: html,
    classList: { add() {}, remove() {} },
    querySelectorAll(selector) {
      if (selector === '[data-provider-model-id]') {
        return parseCheckboxes(element.innerHTML).map((entry) => ({
          dataset: { providerModelId: entry.id },
          checked: entry.checked,
          disabled: entry.disabled,
        }));
      }
      if (selector === '[data-provider-model-kind]') {
        return [...parseSelects(element.innerHTML).entries()].map(([id, value]) => ({
          dataset: { providerModelKind: id },
          value,
        }));
      }
      return [];
    },
  };
  return {
    element,
    documentObject: {
      getElementById(id) {
        return id === getProviderModelCatalogPanelId('agnes') ||
          id === getProviderModelCatalogPanelId('agnes-domestic')
          ? element
          : null;
      },
    },
  };
}

const CATALOG = {
  fetchedAt: '2026-01-01T00:00:00.000Z',
  models: [
    { id: 'agnes-3.0-flash', kind: 'text', enabled: true },
    { id: 'agnes-4.0-flash', kind: 'text', enabled: true },
    { id: 'agnes-image-9.9-flash', kind: 'image', enabled: false },
  ],
};

test('providerModelCatalogPanel: keeps one app model id prefix for both lines', () => {
  assert.equal(resolveProviderModelAppModelId('agnes', 'agnes-3.0-flash'), 'agnes/agnes-3.0-flash');
  assert.equal(
    resolveProviderModelAppModelId('agnes-domestic', 'agnes-3.0-flash'),
    'agnes/agnes-3.0-flash',
  );
  assert.equal(isProviderModelIntegrated('agnes', 'agnes-3.0-flash'), true);
  assert.equal(isProviderModelIntegrated('agnes-domestic', 'agnes-3.0-flash'), true);
  assert.equal(isProviderModelIntegrated('agnes', 'agnes-9.9-flash'), false);
});

test('providerModelCatalogPanel: renders the live list with integrated rows locked', () => {
  const { element, documentObject } = createDocumentStub();
  const rendered = renderProviderModelCatalogPanel({
    documentObject,
    providerId: 'agnes',
    catalog: CATALOG,
    statusText: '接口返回 3 个模型',
  });
  assert.equal(rendered, element);
  assert.equal(element.hidden, false);
  assert.deepEqual(parseCheckboxes(element.innerHTML), [
    { id: 'agnes-3.0-flash', checked: true, disabled: true },
    { id: 'agnes-4.0-flash', checked: true, disabled: false },
    { id: 'agnes-image-9.9-flash', checked: false, disabled: false },
  ]);
  assert.match(element.innerHTML, /接口返回 3 个模型/);
  assert.match(element.innerHTML, /data-provider-model-save="agnes"/);
  assert.deepEqual([...parseSelects(element.innerHTML).keys()], [
    'agnes-4.0-flash',
    'agnes-image-9.9-flash',
  ]);
  assert.equal(parseSelects(element.innerHTML).get('agnes-image-9.9-flash'), 'image');
});

test('providerModelCatalogPanel: dynamically registered rows stay toggleable', async () => {
  const { createProviderModelCatalogBundleRegistry } = await import(
    '../app/providerModelCatalogRegistration.js'
  );
  const registry = createProviderModelCatalogBundleRegistry();
  registry.sync(
    new Map([['agnes-4.0-flash', { id: 'agnes-4.0-flash', kind: 'text', providerIds: ['agnes'] }]]),
  );
  try {
    const { element, documentObject } = createDocumentStub();
    renderProviderModelCatalogPanel({ documentObject, providerId: 'agnes', catalog: CATALOG });
    assert.equal(getProviderModelRowState('agnes', 'agnes-4.0-flash'), 'dynamic');
    assert.deepEqual(parseCheckboxes(element.innerHTML), [
      { id: 'agnes-3.0-flash', checked: true, disabled: true },
      { id: 'agnes-4.0-flash', checked: true, disabled: false },
      { id: 'agnes-image-9.9-flash', checked: false, disabled: false },
    ]);
    assert.deepEqual([...parseSelects(element.innerHTML).keys()], ['agnes-image-9.9-flash']);
  } finally {
    registry.clear();
  }
});

test('providerModelCatalogPanel: hides itself when there is nothing to show', () => {
  const { element, documentObject } = createDocumentStub();
  const rendered = renderProviderModelCatalogPanel({
    documentObject,
    providerId: 'agnes',
    catalog: { models: [] },
  });
  assert.equal(rendered, null);
  assert.equal(element.hidden, true);
  assert.equal(element.innerHTML, '');
});

test('providerModelCatalogPanel: reads back the ticked selection and kinds', () => {
  const { documentObject } = createDocumentStub();
  renderProviderModelCatalogPanel({
    documentObject,
    providerId: 'agnes',
    catalog: CATALOG,
    statusText: '接口返回 3 个模型',
  });
  assert.deepEqual(readProviderModelCatalogSelection(documentObject, 'agnes'), [
    { id: 'agnes-3.0-flash', kind: '', enabled: true },
    { id: 'agnes-4.0-flash', kind: 'text', enabled: true },
    { id: 'agnes-image-9.9-flash', kind: 'image', enabled: false },
  ]);
});

test('providerModelCatalogPanel: escapes vendor supplied model ids', () => {
  const { element, documentObject } = createDocumentStub();
  renderProviderModelCatalogPanel({
    documentObject,
    providerId: 'agnes',
    catalog: { models: [{ id: 'x"><img src=x onerror=alert(1)>', kind: 'text', enabled: false }] },
  });
  assert.equal(element.innerHTML.includes('<img src=x'), false);
  assert.match(element.innerHTML, /&quot;&gt;&lt;img/);
});
