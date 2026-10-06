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

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeKind(item) {
  const text = normalizeText(item).toLowerCase();
  return PROVIDER_MODEL_KINDS.includes(text) ? text : '';
}

export function isProviderModelCatalogProvider(key) {
  return PROVIDER_MODEL_CATALOG_PROVIDER_IDS.includes(normalizeText(key));
}

export function getProviderModelCatalogOwnerProviderId(index) {
  const text2 = normalizeText(index);
  return PROVIDER_MODEL_CATALOG_OWNER_PROVIDER_ID[text2] || text2;
}

export function normalizeProviderModelBaseUrl(result) {
  return normalizeText(result).replace(/\/+$/, '');
}

/**
 * 由厂商接口地址推出模型清单地址。兼容以下写法：
 *   https://apihub.agnes-ai.com        -> https://apihub.agnes-ai.com/v1/models
 *   https://apihub.agnes-ai.com/v1     -> https://apihub.agnes-ai.com/v1/models
 *   https://apihub.agnes-ai.com/v1/chat/completions
 *                                      -> https://apihub.agnes-ai.com/v1/models
 */
export function buildProviderModelsUrl(data, options) {
  const target = PROVIDERS_META?.[normalizeText(data)]?.defaultUrl || '',
    list = normalizeProviderModelBaseUrl(options || target)
      .replace(/\/chat\/completions$/i, '')
      .replace(/\/models$/i, '');
  if (!list || list.includes(':generateContent')) return '';
  if (/\/v\d+(?:beta)?$/i.test(list)) return list + '/models';
  return list + '/v1/models';
}

/**
 * 厂商只返回模型 id，不返回模态。按命名推断：agnes-image-* 是图片，agnes-video-* 是视频，
 * 其余按文本处理。用户可以在设置里改。
 */
export function inferProviderModelKind(source, next) {
  const text3 = normalizeText(next).toLowerCase();
  if (!text3) return 'text';
  if (/(?:^|[-_/])video(?:[-_/]|\d|$)/.test(text3)) return 'video';
  if (/(?:^|[-_/])image(?:[-_/]|\d|$)/.test(text3)) return 'image';
  return 'text';
}

/** 兼容 {data:[{id}]} / {models:[{id}]} / [{id}] / ['id'] 四种返回形态。 */
export function normalizeProviderModelListPayload(current) {
  const entry = Array.isArray(current?.data)
      ? current.data
      : Array.isArray(current?.models)
        ? current.models
        : Array.isArray(current)
          ? current
          : [],
    map = new Set(),
    list2 = [];
  for (const error of entry) {
    const id2 = normalizeText(
      typeof error === 'string' ? error : error?.id || error?.model || error?.name,
    );
    if (!id2 || map.has(id2)) continue;
    map.add(id2);
    list2.push({ id: id2, created: Number(error?.created) || 0 });
  }
  return list2.sort((item2, record) => item2.id.localeCompare(record.id, 'en'));
}

export function readProviderModelCatalog(payload) {
  const handle = payload?.modelCatalog,
    state = Array.isArray(handle?.models) ? handle.models : [],
    map2 = new Set(),
    models = [];
  for (const enabled of state) {
    const id3 = normalizeText(enabled?.id);
    if (!id3 || map2.has(id3)) continue;
    map2.add(id3);
    models.push({
      id: id3,
      kind: normalizeKind(enabled?.kind) || inferProviderModelKind('', id3),
      enabled: enabled?.enabled === true,
    });
  }
  return { fetchedAt: normalizeText(handle?.fetchedAt), models: models };
}

/** 重新拉取后合并：已有条目的勾选状态和模态被保留，新条目默认不勾选。 */
export function mergeProviderModelCatalog(config, models2, scope) {
  const map3 = new Map();
  for (const input of readProviderModelCatalog({ modelCatalog: { models: models2 } }).models) {
    map3.set(input.id, input);
  }
  return normalizeProviderModelListPayload(scope).map((id4) => {
    const kind2 = map3.get(id4.id);
    return {
      id: id4.id,
      kind: kind2?.kind || inferProviderModelKind(config, id4.id),
      enabled: kind2?.enabled === true,
    };
  });
}

export function applyProviderModelCatalog(args, modelCatalog) {
  const output = args && typeof args === 'object' ? { ...args } : {};
  if (!modelCatalog || !Array.isArray(modelCatalog.models) || modelCatalog.models.length === 0) {
    delete output.modelCatalog;
    return output;
  }
  output.modelCatalog = {
    fetchedAt: normalizeText(modelCatalog.fetchedAt) || new Date().toISOString(),
    models: readProviderModelCatalog({ modelCatalog: modelCatalog }).models,
  };
  return output;
}

/**
 * 把配置里所有线路的勾选合并成待登记的模型清单。
 * 返回 Map<厂商模型 id, { kind, providerIds: 启用了它的线路 }>。
 */
export function collectEnabledVendorModels(value2) {
  const value3 = value2?.providers || {},
    map4 = new Map();
  for (const value4 of PROVIDER_MODEL_CATALOG_PROVIDER_IDS) {
    const providerModelCatalog = readProviderModelCatalog(value3[value4]);
    for (const id5 of providerModelCatalog.models) {
      if (!id5.enabled) continue;
      const value5 = map4.get(id5.id) || {
        id: id5.id,
        kind: id5.kind,
        providerIds: [],
      };
      value5.providerIds.push(value4);
      map4.set(id5.id, value5);
    }
  }
  return map4;
}
