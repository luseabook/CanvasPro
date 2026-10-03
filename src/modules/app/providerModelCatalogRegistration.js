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
const MENU_ORDER_BASE = 0x384;

const MENU_EXTENSION_BY_KIND = Object.freeze({
  text: 'textMenu',
  image: 'imageMenu',
  video: 'videoMenu',
});

function slugify(_0x2e6c41) {
  return String(_0x2e6c41 || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 动态模型复用同厂商同模态内置模型的执行契约（endpoint、请求/响应映射都一致），
 * 只换 modelId / executionId / 模型名。这样厂商新增一个同系列模型时无需改代码。
 */
export function findProviderModelTemplate(_0x49d1b8, _0x365d64) {
  const _0x2e2c1e = listModelManifests()['filter'](
    (_0x5a3d02) =>
      _0x5a3d02?.['provider'] === _0x49d1b8 &&
      _0x5a3d02?.['kind'] === _0x365d64 &&
      Boolean(getExecutionManifest(_0x5a3d02?.['executionId'])),
  );
  if (_0x2e2c1e['length'] === 0x0) return null;
  return [..._0x2e2c1e]['sort']((_0x4b1a1f, _0x2b8cbb) =>
    String(_0x4b1a1f?.['modelId'] || '')['localeCompare'](String(_0x2b8cbb?.['modelId'] || ''), 'en'),
  )[_0x2e2c1e['length'] - 0x1];
}

function deepClone(_0x2b0b7a) {
  // 每份动态清单必须是独立对象。若直接复用模板里的嵌套对象，注册表会把
  // “两个清单引用同一个 inputSlots” 误判成循环引用而拒绝整批注册。
  if (typeof structuredClone === 'function') return structuredClone(_0x2b0b7a);
  return JSON.parse(JSON.stringify(_0x2b0b7a));
}

export function buildProviderModelCatalogBundle(_0x1e3d55) {
  const _0xa6373 = [],
    _0x3fd5b2 = [],
    _0x4b6a1e = [];
  let _0x1a5c64 = 0x0;
  for (const _0x11ff7a of _0x1e3d55?.['values']?.() || []) {
    const _0x5dc1a2 = getProviderModelCatalogOwnerProviderId(_0x11ff7a?.['providerIds']?.[0x0]),
      _0x2b8d90 = _0x5dc1a2 + '/' + _0x11ff7a['id'];
    if (getModelManifest(_0x2b8d90)) {
      _0x4b6a1e['push']({ id: _0x11ff7a['id'], reason: 'already-integrated' });
      continue;
    }
    const _0x19b93e = findProviderModelTemplate(_0x5dc1a2, _0x11ff7a['kind']);
    if (!_0x19b93e) {
      _0x4b6a1e['push']({ id: _0x11ff7a['id'], reason: 'no-template:' + _0x11ff7a['kind'] });
      continue;
    }
    const _0x2a2d09 = slugify(_0x11ff7a['id']),
      _0x7610f9 =
        _0x5dc1a2 + '.provider-model-catalog.' + _0x11ff7a['kind'] + '.' + _0x2a2d09 + '.v1';
    if (!_0x2a2d09 || getExecutionManifest(_0x7610f9)) {
      _0x4b6a1e['push']({ id: _0x11ff7a['id'], reason: 'duplicate-execution' });
      continue;
    }
    _0x1a5c64 += 0x1;
    const _0x2f8b47 = deepClone(_0x19b93e),
      _0xd1b8f = deepClone(getExecutionManifest(_0x19b93e['executionId']));
    ((_0x2f8b47['modelId'] = _0x2b8d90),
      (_0x2f8b47['executionId'] = _0x7610f9),
      (_0x2f8b47['displayName'] = _0x11ff7a['id']),
      delete _0x2f8b47['aliases']);
    const _0xe89c1 = {
      ...(_0x2f8b47['extensions'] || {}),
      providerProfiles: [..._0x11ff7a['providerIds']],
      providerModelCatalog: {
        vendorModelId: _0x11ff7a['id'],
        ownerProviderId: _0x5dc1a2,
      },
    };
    const _0x5b1739 = MENU_EXTENSION_BY_KIND[_0x11ff7a['kind']];
    if (_0x5b1739 && _0xe89c1[_0x5b1739])
      _0xe89c1[_0x5b1739] = {
        ..._0xe89c1[_0x5b1739],
        title: _0x11ff7a['id'],
        order: MENU_ORDER_BASE + _0x1a5c64,
      };
    ((_0x2f8b47['extensions'] = _0xe89c1),
      (_0xd1b8f['id'] = _0x7610f9),
      (_0xd1b8f['model'] = _0x11ff7a['id']),
      _0xa6373['push'](_0x2f8b47),
      _0x3fd5b2['push'](_0xd1b8f));
  }
  return {
    sourceId: PROVIDER_MODEL_CATALOG_BUNDLE_SOURCE_ID,
    models: _0xa6373,
    executions: _0x3fd5b2,
    skipped: _0x4b6a1e,
  };
}

/**
 * 保持注册表与当前勾选一致：先注销上一次登记的 bundle，再登记新的。
 * 返回 { changed, registered, skipped }。
 */
export function createProviderModelCatalogBundleRegistry({
  register: _0x1d1c5a = registerManifestBundle,
  unregister: _0x3b8de2 = unregisterManifestBundle,
} = {}) {
  let _0x2f8a91 = null;
  function _0x4c0a2a() {
    if (!_0x2f8a91) return false;
    try {
      _0x3b8de2(_0x2f8a91);
    } catch (_0x1f0a3e) {
      console['warn']('[Provider Model Catalog] unregister failed:', _0x1f0a3e);
    }
    _0x2f8a91 = null;
    return true;
  }
  return {
    sync(_0x1bdd37) {
      _0x4c0a2a();
      const _0x2c95c6 = buildProviderModelCatalogBundle(_0x1bdd37);
      if (_0x2c95c6['models']['length'] === 0x0)
        return { changed: false, registered: 0x0, skipped: _0x2c95c6['skipped'] };
      try {
        _0x1d1c5a(_0x2c95c6);
      } catch (_0x2a8763) {
        console['warn']('[Provider Model Catalog] register failed:', _0x2a8763);
        return { changed: false, registered: 0x0, skipped: _0x2c95c6['skipped'], error: _0x2a8763 };
      }
      _0x2f8a91 = _0x2c95c6;
      return {
        changed: true,
        registered: _0x2c95c6['models']['length'],
        skipped: _0x2c95c6['skipped'],
      };
    },
    clear: _0x4c0a2a,
    getRegisteredModelIds() {
      return (_0x2f8a91?.['models'] || [])['map']((_0x5c4c52) => _0x5c4c52['modelId']);
    },
  };
}