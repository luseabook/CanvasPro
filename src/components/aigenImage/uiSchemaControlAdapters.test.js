import test from 'node:test';
import assert from 'node:assert/strict';

import {
  configureUiSchemaFieldAdapter,
  getUiSchemaFieldAdapterDefinition,
  listUiSchemaControlAdapters,
  registerUiSchemaFieldAdapter,
  resolveUiSchemaControlAdapter,
  resolveUiSchemaControlAdapterDefinition,
  resolveUiSchemaFieldAdapter,
  resolveUiSchemaFieldAdapterDefinition,
} from './uiSchemaControlAdapters.js';

test('uiSchemaControlAdapters: resolves built-in field and control adapters', () => {
  assert.equal(
    resolveUiSchemaFieldAdapter({ id: 'aspectRatio' }, { type: 'segmented' }),
    'renderAspectRatioPillField',
  );
  assert.equal(
    resolveUiSchemaFieldAdapter({ variant: 'instanceToggle' }, { type: 'segmented' }),
    'renderInstanceToggleField',
  );
  assert.equal(resolveUiSchemaControlAdapterDefinition('textarea').renderer, 'renderTextControl');
  assert.equal(resolveUiSchemaControlAdapter('asset'), 'renderAssetInputControl');
  assert.ok(listUiSchemaControlAdapters().some((adapter) => adapter.id === 'control.segmented'));
});

test('uiSchemaControlAdapters: custom adapters can be registered and removed', () => {
  const dispose = registerUiSchemaFieldAdapter({
    id: 'field.testCustom',
    renderer: 'renderTestCustom',
    matches: ({ variant }) => variant === 'testCustom',
  });

  assert.equal(resolveUiSchemaFieldAdapter({ variant: 'testCustom' }), 'renderTestCustom');
  assert.equal(getUiSchemaFieldAdapterDefinition('field.testCustom').renderer, 'renderTestCustom');

  dispose();
  assert.equal(resolveUiSchemaFieldAdapterDefinition({ variant: 'testCustom' }).id, 'fallback');
});

test('uiSchemaControlAdapters: configure can roll back capability changes', () => {
  const dispose = registerUiSchemaFieldAdapter({
    id: 'field.configurable',
    renderer: 'renderConfigurable',
    matches: ({ variant }) => variant === 'configurable',
    normalize: (value) => value,
  });
  const definition = getUiSchemaFieldAdapterDefinition('field.configurable');
  const restore = configureUiSchemaFieldAdapter('field.configurable', {
    render: () => 'configured-render',
    normalize: null,
  });

  assert.equal(definition.render(), 'configured-render');
  assert.equal(definition.normalize, undefined);

  restore();
  assert.equal(definition.render, undefined);
  assert.equal(definition.normalize('value'), 'value');
  dispose();
});
