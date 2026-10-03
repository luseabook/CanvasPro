import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getExecutionManifest,
  getModelManifest,
  resolveModelExecution,
} from '../../manifests/index.js';
import {
  buildProviderModelCatalogBundle,
  createProviderModelCatalogBundleRegistry,
  findProviderModelTemplate,
} from './providerModelCatalogRegistration.js';

function enabledModels(entries) {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

const BOTH_LINES = ['agnes-domestic', 'agnes'];

test('providerModelCatalogRegistration: reuses the built-in contract of the same kind', () => {
  const template = findProviderModelTemplate('agnes', 'text');
  assert.equal(template.kind, 'text');
  assert.equal(template.provider, 'agnes');
  assert.equal(Boolean(getExecutionManifest(template.executionId)), true);
  assert.equal(findProviderModelTemplate('agnes', 'audio'), null);
});

test('providerModelCatalogRegistration: builds a bundle for a vendor model we do not ship', () => {
  const bundle = buildProviderModelCatalogBundle(
    enabledModels([
      { id: 'agnes-4.0-flash', kind: 'text', providerIds: [...BOTH_LINES] },
    ]),
  );
  assert.equal(bundle.sourceId, 'provider-model-catalog');
  assert.equal(bundle.models.length, 1);
  assert.equal(bundle.executions.length, 1);
  const model = bundle.models[0];
  assert.equal(model.modelId, 'agnes/agnes-4.0-flash');
  assert.equal(model.displayName, 'agnes-4.0-flash');
  assert.deepEqual([...model.extensions.providerProfiles], [...BOTH_LINES]);
  assert.equal(model.extensions.textMenu.title, 'agnes-4.0-flash');
  assert.equal('aliases' in model, false);
  assert.equal(bundle.executions[0].model, 'agnes-4.0-flash');
  assert.equal(bundle.executions[0].id, model.executionId);
  assert.deepEqual(bundle.skipped, []);
});

test('providerModelCatalogRegistration: skips models that are already integrated', () => {
  const bundle = buildProviderModelCatalogBundle(
    enabledModels([
      { id: 'agnes-3.0-flash', kind: 'text', providerIds: [...BOTH_LINES] },
      { id: 'agnes-9.9-flash', kind: 'audio', providerIds: ['agnes'] },
    ]),
  );
  assert.equal(bundle.models.length, 0);
  assert.deepEqual(bundle.skipped, [
    { id: 'agnes-3.0-flash', reason: 'already-integrated' },
    { id: 'agnes-9.9-flash', reason: 'no-template:audio' },
  ]);
});

test('providerModelCatalogRegistration: registers several cloned models without false cycles', () => {
  // 多个动态清单若共用模板里的嵌套对象，注册表会把共享引用误判成循环引用。
  const registry = createProviderModelCatalogBundleRegistry();
  const ids = ['agnes-5.0-flash', 'agnes-5.1-flash', 'agnes-image-5.0-flash'];
  const applied = registry.sync(
    enabledModels(
      ids.map((id) => ({
        id,
        kind: id.includes('image') ? 'image' : 'text',
        providerIds: [...BOTH_LINES],
      })),
    ),
  );
  assert.equal(applied.changed, true);
  assert.equal(applied.registered, 3);
  assert.deepEqual(applied.skipped, []);
  for (const id of ids) {
    const manifest = getModelManifest('agnes/' + id);
    assert.equal(Boolean(manifest), true);
    assert.equal(manifest.extensions.providerModelCatalog.vendorModelId, id);
  }
  // 两份清单之间不得共享嵌套对象
  const first = getModelManifest('agnes/' + ids[0]);
  const second = getModelManifest('agnes/' + ids[1]);
  assert.notEqual(first.inputSlots, second.inputSlots);
  registry.clear();
});

test('providerModelCatalogRegistration: sync registers then clears the dynamic models', () => {
  const registry = createProviderModelCatalogBundleRegistry();
  const dynamicId = 'agnes/agnes-4.1-flash';
  assert.equal(getModelManifest(dynamicId), null);
  const applied = registry.sync(
    enabledModels([{ id: 'agnes-4.1-flash', kind: 'text', providerIds: [...BOTH_LINES] }]),
  );
  assert.equal(applied.changed, true);
  assert.equal(applied.registered, 1);
  assert.deepEqual(registry.getRegisteredModelIds(), [dynamicId]);
  const manifest = getModelManifest(dynamicId);
  assert.equal(manifest.provider, 'agnes');
  assert.equal(manifest.kind, 'text');
  assert.deepEqual([...manifest.extensions.providerProfiles], [...BOTH_LINES]);
  assert.equal(manifest.extensions.providerModelCatalog.vendorModelId, 'agnes-4.1-flash');
  const resolved = resolveModelExecution(dynamicId);
  assert.equal(resolved.modelManifest.modelId, dynamicId);
  assert.equal(resolved.executionManifest.model, 'agnes-4.1-flash');
  assert.equal(registry.sync(new Map()).changed, false);
  assert.equal(getModelManifest(dynamicId), null);
});
