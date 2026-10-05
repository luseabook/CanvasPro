import {
  getExecutionManifest,
  getModelManifest,
  listModelManifests,
  registerManifestBundle,
  unregisterManifestBundle,
} from '../../manifests/index.js';
import { getProviderModelCatalogOwnerProviderId } from '../settings/providerModelCatalog.js';

export const PROVIDER_MODEL_CATALOG_BUNDLE_SOURCE_ID = 'provider-model-catalog';

// 动态登记的模型排在厂商内置模型之后，避免打乱既有排序。
const MENU_ORDER_BASE = 900;

const MENU_EXTENSION_BY_KIND = Object.freeze({
  text: 'textMenu',
  image: 'imageMenu',
  video: 'videoMenu',
});

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 动态模型复用同厂商同模态内置模型的执行契约（endpoint、请求/响应映射都一致），
 * 只换 modelId / executionId / 模型名。这样厂商新增一个同系列模型时无需改代码。
 */
export function findProviderModelTemplate(item, key) {
  const list = listModelManifests()['filter'](
    (index) =>
      index?.['provider'] === item &&
      index?.['kind'] === key &&
      Boolean(getExecutionManifest(index?.['executionId'])),
  );
  if (list['length'] === 0) return null;
  return [...list]['sort']((result, data) =>
    String(result?.['modelId'] || '')['localeCompare'](String(data?.['modelId'] || ''), 'en'),
  )[list['length'] - 1];
}

function deepClone(options) {
  // 每份动态清单必须是独立对象。若直接复用模板里的嵌套对象，注册表会把
  // “两个清单引用同一个 inputSlots” 误判成循环引用而拒绝整批注册。
  if (typeof structuredClone === 'function') return structuredClone(options);
  return JSON.parse(JSON.stringify(options));
}

export function buildProviderModelCatalogBundle(map) {
  const models = [],
    executions = [],
    skipped = [];
  let target = 0;
  for (const id of map?.['values']?.() || []) {
    const ownerProviderId = getProviderModelCatalogOwnerProviderId(id?.['providerIds']?.[0]),
      source = ownerProviderId + '/' + id['id'];
    if (getModelManifest(source)) {
      skipped['push']({ id: id['id'], reason: 'already-integrated' });
      continue;
    }
    const providerModelTemplate = findProviderModelTemplate(ownerProviderId, id['kind']);
    if (!providerModelTemplate) {
      skipped['push']({ id: id['id'], reason: 'no-template:' + id['kind'] });
      continue;
    }
    const slugify2 = slugify(id['id']),
      next = ownerProviderId + '.provider-model-catalog.' + id['kind'] + '.' + slugify2 + '.v1';
    if (!slugify2 || getExecutionManifest(next)) {
      skipped['push']({ id: id['id'], reason: 'duplicate-execution' });
      continue;
    }
    target += 1;
    const deepClone2 = deepClone(providerModelTemplate),
      deepClone3 = deepClone(getExecutionManifest(providerModelTemplate['executionId']));
    ((deepClone2['modelId'] = source),
      (deepClone2['executionId'] = next),
      (deepClone2['displayName'] = id['id']),
      delete deepClone2['aliases']);
    const args = {
      ...(deepClone2['extensions'] || {}),
      providerProfiles: [...id['providerIds']],
      providerModelCatalog: {
        vendorModelId: id['id'],
        ownerProviderId: ownerProviderId,
      },
    };
    const current = MENU_EXTENSION_BY_KIND[id['kind']];
    if (current && args[current])
      args[current] = {
        ...args[current],
        title: id['id'],
        order: MENU_ORDER_BASE + target,
      };
    ((deepClone2['extensions'] = args),
      (deepClone3['id'] = next),
      (deepClone3['model'] = id['id']),
      models['push'](deepClone2),
      executions['push'](deepClone3));
  }
  return {
    sourceId: PROVIDER_MODEL_CATALOG_BUNDLE_SOURCE_ID,
    models: models,
    executions: executions,
    skipped: skipped,
  };
}

/**
 * 保持注册表与当前勾选一致：先注销上一次登记的 bundle，再登记新的。
 * 返回 { changed, registered, skipped }。
 */
export function createProviderModelCatalogBundleRegistry({
  register: register = registerManifestBundle,
  unregister: unregister = unregisterManifestBundle,
} = {}) {
  let enabled = null;
  function clear() {
    if (!enabled) return false;
    try {
      unregister(enabled);
    } catch (entry) {
      console['warn']('[Provider Model Catalog] unregister failed:', entry);
    }
    enabled = null;
    return true;
  }
  return {
    sync(record) {
      clear();
      const skipped2 = buildProviderModelCatalogBundle(record);
      if (skipped2['models']['length'] === 0)
        return { changed: false, registered: 0, skipped: skipped2['skipped'] };
      try {
        register(skipped2);
      } catch (error) {
        console['warn']('[Provider Model Catalog] register failed:', error);
        return { changed: false, registered: 0, skipped: skipped2['skipped'], error: error };
      }
      enabled = skipped2;
      return {
        changed: true,
        registered: skipped2['models']['length'],
        skipped: skipped2['skipped'],
      };
    },
    clear: clear,
    getRegisteredModelIds() {
      return (enabled?.['models'] || [])['map']((payload) => payload['modelId']);
    },
  };
}
