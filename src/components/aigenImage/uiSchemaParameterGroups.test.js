import test from 'node:test';
import assert from 'node:assert/strict';

import { renderParameterGroups } from './uiSchemaParameterGroups.js';

test('uiSchemaParameterGroups: groups adjacent footer fields and renders standalone fields directly', () => {
  const calls = [];
  const fields = [
    { id: 'a', footerGroup: { id: 'g1', label: 'Group 1', description: 'First group' } },
    { id: 'b' },
    { id: 'c', footerGroup: { id: 'g1', label: 'Ignored' } },
  ];
  const html = renderParameterGroups(
    fields,
    { model: 'model-1' },
    { variant: 'default' },
    (field, model, options) => {
      calls.push([field.id, model, options.variant]);
      return `<field id="${field.id}" variant="${options.variant || ''}"></field>`;
    },
  );

  assert.deepEqual(calls, [
    ['a', { model: 'model-1' }, 'groupRow'],
    ['c', { model: 'model-1' }, 'groupRow'],
    ['b', { model: 'model-1' }, 'default'],
  ]);
  assert.match(html, /data-ui-schema-composite-field="parameter-group:g1"/);
  assert.match(html, /Group 1/);
  assert.match(html, /First group/);
  assert.match(html, /<field id="a" variant="groupRow"><\/field>/);
  assert.match(html, /<field id="b" variant="default"><\/field>/);
  assert.match(html, /<field id="c" variant="groupRow"><\/field>/);
});

test('uiSchemaParameterGroups: escapes group labels and descriptions in generated attributes', () => {
  const html = renderParameterGroups(
    [{ id: 'x', footerGroup: { id: 'x" onmouseover="bad', label: '<Group>', description: 'A "tip"' } }],
    {},
    {},
    () => '<field></field>',
  );

  assert.equal(html.includes('onmouseover="bad'), false);
  assert.equal(html.includes('&quot;'), true);
  assert.equal(html.includes('&lt;Group&gt;'), true);
});

test('uiSchemaParameterGroups: returns an empty string for no fields', () => {
  assert.equal(
    renderParameterGroups([], {}, {}, () => '<field></field>'),
    '',
  );
});
