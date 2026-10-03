import { PROVIDERS_META } from '../providers.js';

// 这些厂商的模型清单由软件内置写死已经不合适：厂商会新增模型，也会让旧模型失效。
// 设置面板改为调用厂商接口（GET /v1/models）读取真实清单，再让用户勾选要启用哪些。
export const PROVIDER_MODEL_CATALOG_PROVIDER_IDS = Object.freeze(['agnes-domestic', 'agnes']);

export const PROVIDER_MODEL_KINDS = Object.freeze(['text', 'image', 'video']);

// 一家厂商的模型在软件里的 modelId 前缀固定在“主线路”上，两条线路通过 providerProfiles
// 共用同一份清单定义。这样国际/国内各存各的密钥，但模型只需要登记一次。
export const PROVIDER_MODEL_CATALOG_OWNER_PROVIDER_ID = Object.freeze({
  'agnes-domestic': 'agnes',
  agnes: 'agnes',
});

function normalizeText(_0x2f31a0) {
  return String(_0x2f31a0 ?? '').trim();
}

function normalizeKind(_0x1f42c8) {
  const _0x9f2d = normalizeText(_0x1f42c8).toLowerCase();
  return PROVIDER_MODEL_KINDS.includes(_0x9f2d) ? _0x9f2d : '';
}

export function isProviderModelCatalogProvider(_0x5a1f7e) {
  return PROVIDER_MODEL_CATALOG_PROVIDER_IDS.includes(normalizeText(_0x5a1f7e));
}

export function getProviderModelCatalogOwnerProviderId(_0x3d2f8f) {
  const _0x1a2b4c = normalizeText(_0x3d2f8f);
  return PROVIDER_MODEL_CATALOG_OWNER_PROVIDER_ID[_0x1a2b4c] || _0x1a2b4c;
}

export function normalizeProviderModelBaseUrl(_0x4b1c9e) {
  return normalizeText(_0x4b1c9e).replace(/\/+$/, '');
}

/**
 * 由厂商接口地址推出模型清单地址。兼容以下写法：
 *   https://apihub.agnes-ai.com        -> https://apihub.agnes-ai.com/v1/models
 *   https://apihub.agnes-ai.com/v1     -> https://apihub.agnes-ai.com/v1/models
 *   https://apihub.agnes-ai.com/v1/chat/completions
 *                                      -> https://apihub.agnes-ai.com/v1/models
 */
export function buildProviderModelsUrl(_0x1e7d33, _0x30c5b1) {
  const _0x5d1e9 = PROVIDERS_META?.[normalizeText(_0x1e7d33)]?.defaultUrl || '',
    _0x4a7f22 = normalizeProviderModelBaseUrl(_0x30c5b1 || _0x5d1e9)
      .replace(/\/chat\/completions$/i, '')
      .replace(/\/models$/i, '');
  if (!_0x4a7f22 || _0x4a7f22.includes(':generateContent')) return '';
  if (/\/v\d+(?:beta)?$/i.test(_0x4a7f22)) return _0x4a7f22 + '/models';
  return _0x4a7f22 + '/v1/models';
}

/**
 * 厂商只返回模型 id，不返回模态。按命名推断：agnes-image-* 是图片，agnes-video-* 是视频，
 * 其余按文本处理。用户可以在设置里改。
 */
export function inferProviderModelKind(_0x4d9b1a, _0x2c3e70) {
  const _0x18f7b2 = normalizeText(_0x2c3e70).toLowerCase();
  if (!_0x18f7b2) return 'text';
  if (/(?:^|[-_/])video(?:[-_/]|\d|$)/.test(_0x18f7b2)) return 'video';
  if (/(?:^|[-_/])image(?:[-_/]|\d|$)/.test(_0x18f7b2)) return 'image';
  return 'text';
}

/** 兼容 {data:[{id}]} / {models:[{id}]} / [{id}] / ['id'] 四种返回形态。 */
export function normalizeProviderModelListPayload(_0x3f8c21) {
  const _0x2a1d4f = Array.isArray(_0x3f8c21?.['data'])
      ? _0x3f8c21['data']
      : Array.isArray(_0x3f8c21?.['models'])
        ? _0x3f8c21['models']
        : Array.isArray(_0x3f8c21)
          ? _0x3f8c21
          : [],
    _0x5b0e6c = new Set(),
    _0x4471d5 = [];
  for (const _0xed3a0f of _0x2a1d4f) {
    const _0x4fb6e9 = normalizeText(
      typeof _0xed3a0f === 'string' ? _0xed3a0f : _0xed3a0f?.['id'] || _0xed3a0f?.['model'] || _0xed3a0f?.['name'],
    );
    if (!_0x4fb6e9 || _0x5b0e6c.has(_0x4fb6e9)) continue;
    _0x5b0e6c.add(_0x4fb6e9);
    _0x4471d5.push({ id: _0x4fb6e9, created: Number(_0xed3a0f?.['created']) || 0 });
  }
  return _0x4471d5.sort((_0x4ef1a4, _0x2d4fbf) => _0x4ef1a4.id.localeCompare(_0x2d4fbf.id, 'en'));
}

export function readProviderModelCatalog(_0x39a2b7) {
  const _0x2f3ae1 = _0x39a2b7?.['modelCatalog'],
    _0x1c0d6a = Array.isArray(_0x2f3ae1?.['models']) ? _0x2f3ae1['models'] : [],
    _0x2b7e5c = new Set(),
    _0x3b3b1c = [];
  for (const _0x2c7f0e of _0x1c0d6a) {
    const _0x4a5ea1 = normalizeText(_0x2c7f0e?.['id']);
    if (!_0x4a5ea1 || _0x2b7e5c.has(_0x4a5ea1)) continue;
    _0x2b7e5c.add(_0x4a5ea1);
    _0x3b3b1c.push({
      id: _0x4a5ea1,
      kind: normalizeKind(_0x2c7f0e?.['kind']) || inferProviderModelKind('', _0x4a5ea1),
      enabled: _0x2c7f0e?.['enabled'] === true,
    });
  }
  return { fetchedAt: normalizeText(_0x2f3ae1?.['fetchedAt']), models: _0x3b3b1c };
}

/** 重新拉取后合并：已有条目的勾选状态和模态被保留，新条目默认不勾选。 */
export function mergeProviderModelCatalog(_0x1c8e5c, _0x4a0d1b, _0x2dfb7c) {
  const _0x5744c8 = new Map();
  for (const _0x1e5cbf of readProviderModelCatalog({ modelCatalog: { models: _0x4a0d1b } }).models) {
    _0x5744c8.set(_0x1e5cbf.id, _0x1e5cbf);
  }
  return normalizeProviderModelListPayload(_0x2dfb7c)
    .map((_0x2e0d6a) => {
      const _0x112f3f = _0x5744c8.get(_0x2e0d6a.id);
      return {
        id: _0x2e0d6a.id,
        kind: _0x112f3f?.['kind'] || inferProviderModelKind(_0x1c8e5c, _0x2e0d6a.id),
        enabled: _0x112f3f?.['enabled'] === true,
      };
    });
}

export function applyProviderModelCatalog(_0x1d5e0d, _0x104d64) {
  const _0x33d7b3 = _0x1d5e0d && typeof _0x1d5e0d === 'object' ? { ..._0x1d5e0d } : {};
  if (!_0x104d64 || !Array.isArray(_0x104d64['models']) || _0x104d64['models'].length === 0) {
    delete _0x33d7b3['modelCatalog'];
    return _0x33d7b3;
  }
  _0x33d7b3['modelCatalog'] = {
    fetchedAt: normalizeText(_0x104d64['fetchedAt']) || new Date().toISOString(),
    models: readProviderModelCatalog({ modelCatalog: _0x104d64 }).models,
  };
  return _0x33d7b3;
}

/**
 * 把配置里所有线路的勾选合并成待登记的模型清单。
 * 返回 Map<厂商模型 id, { kind, providerIds: 启用了它的线路 }>。
 */
export function collectEnabledVendorModels(_0x1b04f6) {
  const _0x4f0c7a = _0x1b04f6?.['providers'] || {},
    _0x2538f7 = new Map();
  for (const _0x1f0c4d of PROVIDER_MODEL_CATALOG_PROVIDER_IDS) {
    const _0x4a6e93 = readProviderModelCatalog(_0x4f0c7a[_0x1f0c4d]);
    for (const _0x21b6e3 of _0x4a6e93.models) {
      if (!_0x21b6e3.enabled) continue;
      const _0x479be8 = _0x2538f7.get(_0x21b6e3.id) || {
        id: _0x21b6e3.id,
        kind: _0x21b6e3.kind,
        providerIds: [],
      };
      _0x479be8.providerIds.push(_0x1f0c4d);
      _0x2538f7.set(_0x21b6e3.id, _0x479be8);
    }
  }
  return _0x2538f7;
}