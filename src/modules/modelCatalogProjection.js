import { translateManifestText } from '../i18n/manifestText.js';
import { isModelManifestPubliclyListed } from '../manifests/modelCatalogVisibility.js';
import { getModelManifest, getModelsByKind } from '../manifests/modelRegistry.js';
const PROVIDER_LABELS = Object['freeze']({
  agnes: 'Agnes',
  apimart: 'APIMart',
  dreamina: '即梦',
  grsai: 'GRSAI',
  ppio: 'PPIO',
  runninghub: 'RunningHub',
  runninghubwf: 'RunningHub 工作流',
  volcengine: '火山方舟',
  'volcengine-speech': '火山语音',
});
function normalizeText(value) {
  return String(value || '')['trim']();
}
function resolveModelIcon(options = {}) {
  const text = normalizeText(options['icon']);
  if (/^(?:images\/|assets\/|https?:\/\/|data:)/i['test'](text)) return text;
  if (options['provider'] === 'runninghub' || options['provider'] === 'runninghubwf') return 'images/RH.png';
  if (options['provider'] === 'volcengine') return 'images/volcengine.svg';
  if (options['provider'] === 'ppio') return 'images/ppio.png';
  if (options['provider'] === 'grsai') return 'images/grsai.png';
  return '';
}
function resolveManifest(item) {
  return typeof item === 'string' ? getModelManifest(item) : item;
}
export function getModelCatalogProviderLabel(key) {
  const text2 = normalizeText(key);
  return PROVIDER_LABELS[text2] || text2;
}
export function isPublicModelCatalogEntry(index, result) {
  const text3 = normalizeText(index),
    manifest = resolveManifest(result);
  return Boolean(text3 && manifest?.['kind'] === text3 && isModelManifestPubliclyListed(manifest));
}
export function projectPublicModelCatalog(data, { isEligible: isEligible = () => true } = {}) {
  const text4 = normalizeText(data),
    handler = typeof isEligible === 'function' ? isEligible : () => true;
  if (!text4) return [];
  return getModelsByKind(text4)
    ['filter']((target) => isPublicModelCatalogEntry(text4, target) && handler(target))
    ['map']((source) => ({
      modelId: source['modelId'],
      kind: source['kind'],
      provider: source['provider'],
      providerLabel: getModelCatalogProviderLabel(source['provider']),
      label: translateManifestText(source['displayName'] || source['modelId']),
      description: translateManifestText(source['description'] || ''),
      icon: resolveModelIcon(source),
      vip: source['vip'] === true,
    }))
    ['sort']((next, current) => {
      const entry = next['providerLabel']['localeCompare'](current['providerLabel'], 'zh-CN');
      return entry || next['label']['localeCompare'](current['label'], 'zh-CN');
    });
}
export function findProjectedModelOption(record, payload) {
  const text5 = normalizeText(payload);
  return (Array['isArray'](record) ? record : [])['find']((handle) => handle?.['modelId'] === text5) || null;
}
