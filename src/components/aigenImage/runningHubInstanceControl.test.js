import test from 'node:test';
import assert from 'node:assert/strict';

import {
  renderRunningHubInstanceControl,
  syncRunningHubInstanceControl,
} from './runningHubInstanceControl.js';

function createClassList(initial = []) {
  const values = new Set(initial);
  return {
    contains(value) {
      return values.has(value);
    },
    add(value) {
      values.add(value);
    },
    remove(value) {
      values.delete(value);
    },
  };
}

test('runningHubInstanceControl: renders normal and developer options while filtering hidden values', () => {
  const originalWindow = globalThis.window;
  globalThis.window = { DEV_MODE: true };
  try {
    const html = renderRunningHubInstanceControl(
      {
        id: 'vram',
        label: 'VRAM',
        defaultValue: '16',
        options: [
          { value: '8', label: '8G' },
          { value: '16', label: '16G', hidden: true },
          { value: '24', label: '24G' },
        ],
        developerOptions: [{ value: '32', label: '32G' }],
      },
      { values: { vram: '24' } },
      {
        escapeHtmlAttr: (value) => String(value).replaceAll('"', '&quot;'),
        getFieldValue: (nodeData, field) => nodeData.values[field.id],
        isOptionHidden: (option) => option.hidden === true,
        manifestText: (value) => String(value),
        renderDropdownControl: (_field, _value, _nodeData, { titleHtml }) =>
          `<div class="developer-menu">${titleHtml}</div>`,
      },
    );

    assert.match(html, /data-ui-schema-field="vram"/);
    assert.doesNotMatch(html, /value="16"/);
    assert.match(html, /data-ui-schema-value="8"/);
    assert.match(html, />24G</);
    assert.match(html, /data-ui-schema-developer-mode="true"/);
    assert.match(html, /data-ui-schema-developer-values="\[&quot;32&quot;\]/);
    assert.match(html, /class="developer-menu"/);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('runningHubInstanceControl: syncs labels and the next normal option', () => {
  const normalLabel = { textContent: '' };
  const normalButton = { dataset: { uiSchemaValue: '8' } };
  const developerLabel = { textContent: '' };
  const developerItem = {
    dataset: { uiSchemaValue: '16', uiSchemaOptionLabel: '16GB' },
    textContent: '16G',
  };
  const element = {
    classList: createClassList(['ui-schema-instance-toggle']),
    dataset: {
      uiSchemaNormalOptions: JSON.stringify([
        { value: '8', label: '8G' },
        { value: '16', label: '16G' },
        { value: '24', label: '24G' },
      ]),
    },
    querySelector(selector) {
      if (selector.includes('normal-control .ui-schema-pill-label')) return normalLabel;
      if (selector.includes('normal-control[data-ui-schema-value]')) return normalButton;
      if (selector.includes('developer-control .ui-schema-menu-trigger')) return developerLabel;
      return null;
    },
    querySelectorAll() {
      return [developerItem];
    },
  };

  syncRunningHubInstanceControl(element, '16');

  assert.equal(normalLabel.textContent, '16G');
  assert.equal(normalButton.dataset.uiSchemaValue, '24');
  assert.equal(developerLabel.textContent, '16GB');
});
