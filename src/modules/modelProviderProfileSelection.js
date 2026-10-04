import { getModelManifest } from '../manifests/index.js';
import { getProviderConfig } from '../../api/configApi.js';
import {
  normalizeRunningHubModelApiProfileId,
  RUNNINGHUB_SITE_PROFILE_IDS,
} from './runningHubProviderProfiles.js';
export const MODEL_PROVIDER_PROFILE_MEMORY_KEY = 'providerProfileIdByModel';
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function resolveManifest(value) {
  if (isPlainObject(value)) return value;
  const item = String(value || '')['trim']();
  return item ? getModelManifest(item) : null;
}
export function getModelProviderProfileMemoryKey(key) {
  const manifest = resolveManifest(key);
  return String(manifest?.['modelId'] || key || '')['trim']();
}
export function getModelProviderProfileIds(index) {
  const manifest2 = resolveManifest(index),
    list = Array['isArray'](manifest2?.['extensions']?.['providerProfiles'])
      ? manifest2['extensions']['providerProfiles']
      : [],
    list2 =
      list['length'] > 0x0
        ? list
        : manifest2?.['provider'] === 'runninghubwf' && manifest2?.['adapterType'] === 'workflow'
          ? RUNNINGHUB_SITE_PROFILE_IDS
          : [];
  return [...new Set(list2['map']((result) => String(result || '')['trim']())['filter'](Boolean))];
}
export function normalizeModelProviderProfileId(data, options) {
  const manifest3 = resolveManifest(data),
    list3 = getModelProviderProfileIds(data);
  if (!list3['length']) return '';
  const target = String(options || '')['trim']();
  if (list3['includes'](target)) return target;
  if (manifest3?.['provider'] === 'runninghubwf' && manifest3?.['adapterType'] === 'workflow') {
    const source = String(getProviderConfig('runninghubwf')?.['providerProfileId'] || '')['trim']();
    if (list3['includes'](source)) return source;
  }
  return list3[0x0];
}
export function resolveModelGenerationProviderProfileId(next, current, entry) {
  const manifest4 = resolveManifest(next),
    isPlainObject2 = isPlainObject(next) ? '' : String(next || '')['trim'](),
    record = Boolean(
      manifest4?.['provider'] &&
      (isPlainObject(next) || String(manifest4['modelId'] || '')['trim']() === isPlainObject2),
    ),
    payload = String(record ? manifest4['provider'] : current || '')
      ['trim']()
      ['toLowerCase'](),
    handle = payload === 'runninghub' ? '' : normalizeModelProviderProfileId(manifest4 || next, entry);
  if (handle) return handle;
  const state = String(entry || '')['trim']();
  return payload === 'runninghub' || (payload === 'runninghubwf' && state)
    ? normalizeRunningHubModelApiProfileId(state)
    : '';
}
export function resolveReadyModelProviderProfileId(config, scope, handler) {
  const list4 = getModelProviderProfileIds(config),
    modelProviderProfileId = normalizeModelProviderProfileId(config, scope);
  if (!modelProviderProfileId || typeof handler !== 'function') return modelProviderProfileId;
  const input = handler(modelProviderProfileId);
  if (input !== ![]) return modelProviderProfileId;
  return list4['find']((output) => handler(output) === !![]) || modelProviderProfileId;
}
export function sanitizeModelProviderProfileMemory(value2) {
  if (!isPlainObject(value2)) return {};
  const value3 = {};
  return (
    Object['entries'](value2)['forEach'](([value4, value5]) => {
      const modelProviderProfileMemoryKey = getModelProviderProfileMemoryKey(value4),
        modelProviderProfileId2 = normalizeModelProviderProfileId(modelProviderProfileMemoryKey, value5);
      if (modelProviderProfileMemoryKey && modelProviderProfileId2)
        value3[modelProviderProfileMemoryKey] = modelProviderProfileId2;
    }),
    value3
  );
}
export function resolveModelProviderProfileId(options2 = {}, value6 = options2?.['model']) {
  const modelProviderProfileMemoryKey2 = getModelProviderProfileMemoryKey(value6);
  if (!modelProviderProfileMemoryKey2) return '';
  const sanitizeModelProviderProfileMemory2 = sanitizeModelProviderProfileMemory(
      options2?.[MODEL_PROVIDER_PROFILE_MEMORY_KEY],
    ),
    value7 =
      String(options2?.['model'] || '')['trim']() === String(value6 || '')['trim']()
        ? options2?.['providerProfileId'] ||
          sanitizeModelProviderProfileMemory2[modelProviderProfileMemoryKey2]
        : sanitizeModelProviderProfileMemory2[modelProviderProfileMemoryKey2];
  return normalizeModelProviderProfileId(modelProviderProfileMemoryKey2, value7);
}
export function buildModelProviderProfileSelectionPatch(options3 = {}, value8 = options3?.['model'], value9) {
  const sanitizeModelProviderProfileMemory3 = sanitizeModelProviderProfileMemory(
      options3?.[MODEL_PROVIDER_PROFILE_MEMORY_KEY],
    ),
    modelProviderProfileMemoryKey3 = getModelProviderProfileMemoryKey(options3?.['model']);
  modelProviderProfileMemoryKey3 &&
    getModelProviderProfileIds(modelProviderProfileMemoryKey3)['length'] &&
    (sanitizeModelProviderProfileMemory3[modelProviderProfileMemoryKey3] = normalizeModelProviderProfileId(
      modelProviderProfileMemoryKey3,
      options3?.['providerProfileId'] || sanitizeModelProviderProfileMemory3[modelProviderProfileMemoryKey3],
    ));
  const modelProviderProfileMemoryKey4 = getModelProviderProfileMemoryKey(value8),
    list5 = getModelProviderProfileIds(modelProviderProfileMemoryKey4);
  if (!modelProviderProfileMemoryKey4 || !list5['length'])
    return {
      providerProfileId: '',
      rhProviderProfileId: '',
      [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: sanitizeModelProviderProfileMemory3,
    };
  const value10 = value9 !== undefined && value9 !== null && String(value9)['trim']() !== '',
    providerProfileId = normalizeModelProviderProfileId(
      modelProviderProfileMemoryKey4,
      value10
        ? value9
        : sanitizeModelProviderProfileMemory3[modelProviderProfileMemoryKey4] ||
            (modelProviderProfileMemoryKey3 === modelProviderProfileMemoryKey4
              ? options3?.['providerProfileId']
              : ''),
    );
  return (
    (sanitizeModelProviderProfileMemory3[modelProviderProfileMemoryKey4] = providerProfileId),
    {
      providerProfileId: providerProfileId,
      rhProviderProfileId: '',
      [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: sanitizeModelProviderProfileMemory3,
    }
  );
}
export function getNextModelProviderProfileId(options4 = {}) {
  const list6 = getModelProviderProfileIds(options4?.['model']);
  if (list6['length'] < 0x2) return list6[0x0] || '';
  const modelProviderProfileId3 = resolveModelProviderProfileId(options4),
    value11 = list6['indexOf'](modelProviderProfileId3);
  return list6[(value11 + 0x1 + list6['length']) % list6['length']];
}
