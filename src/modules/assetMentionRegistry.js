import { resolveGenerationInputImageUrl } from '../services/imageReferenceUrlService.js';
import { resolveCanvasAudioUrl, resolveCanvasVideoUrl } from '../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { resolveEffectiveInputKind } from './modelInputPolicy.js';
const TYPE_LABELS = Object.freeze({
  text: '文本',
  image: '图片',
  video: '视频',
  audio: '音频',
});
let _assetMentionRefs = [],
  _assetMentionRefMap = new Map(),
  _assetMentionRegistryRevision = 0;
const _assetMentionRegistryListeners = new Set();
let _assetMentionLibrarySettings = {
  categories: [],
  displayNames: {},
  parents: {},
};
function normalizeText(value) {
  return String(value || '').trim();
}
function normalizeAssetType(item) {
  const list = normalizeText(item).toLowerCase();
  if (!list) return '';
  if (list === 'text' || list === 'source-text' || list === 'ai-text') return 'text';
  if (list === 'image' || list === 'source-image' || list === 'ai-image') return 'image';
  if (list === 'video' || list === 'source-video' || list === 'ai-video') return 'video';
  if (list === 'audio' || list === 'source-audio' || list === 'ai-audio') return 'audio';
  if (list.includes('text')) return 'text';
  if (list.includes('video')) return 'video';
  if (list.includes('audio')) return 'audio';
  if (list.includes('image')) return 'image';
  return '';
}
function normalizeCategoryList(key) {
  const list2 = [],
    map = new Set();
  for (const index of Array.isArray(key) ? key : []) {
    const text = normalizeText(index),
      result = text.toLocaleLowerCase();
    if (!text || map.has(result)) continue;
    (map.add(result), list2.push(text));
  }
  return list2;
}
function normalizeCategoryRecord(data) {
  const options = {};
  for (const [target, source] of Object.entries(data && typeof data === 'object' ? data : {})) {
    const text2 = normalizeText(target),
      text3 = normalizeText(source);
    if (text2 && text3) options[text2] = text3;
  }
  return options;
}
function areLibrarySettingsEqual(next, current) {
  if (next.categories.length !== current.categories.length) return false;
  if (next.categories.some((item2, entry) => item2 !== current.categories[entry])) return false;
  const run = (record, payload) => {
    const list3 = Object.entries(record).sort(([handle], [state]) => handle.localeCompare(state)),
      list4 = Object.entries(payload).sort(([config], [scope]) => config.localeCompare(scope));
    return (
      list3.length === list4.length &&
      list3.every(([input, output], value2) => input === list4[value2]?.[0] && output === list4[value2]?.[1])
    );
  };
  return run(next.displayNames, current.displayNames) && run(next.parents, current.parents);
}
function toUsableUrl(value3) {
  const text4 = normalizeText(value3);
  if (!text4) return '';
  if (/^(?:https?:|blob:|data:|\/)/i.test(text4)) return text4;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text4)) return '';
  return localPathToUrl(text4) || '/' + text4.replace(/^\/+/, '');
}
function firstUsableUrl(...args) {
  for (const value4 of args) {
    const toUsableUrl2 = toUsableUrl(value4);
    if (toUsableUrl2) return toUsableUrl2;
  }
  return '';
}
function pickResultItem(list5, value5) {
  if (!Array.isArray(list5) || list5.length === 0) return null;
  const value6 = Number(value5),
    value7 = Number.isFinite(value6) ? Math.max(0, Math.trunc(value6)) : 0;
  return list5[Math.min(value7, list5.length - 1)] || null;
}
function getTextContent(response = {}, error = {}) {
  return normalizeText(
    response.outputText ||
      response.text ||
      response.content ||
      response.prompt ||
      error.text ||
      error.content ||
      error.prompt ||
      response.label ||
      error.name,
  );
}
function resolveRefUrl(value8, response2 = {}, response3 = {}) {
  if (value8 === 'image')
    return (
      resolveGenerationInputImageUrl(response2) ||
      firstUsableUrl(
        response3.url,
        response3.src,
        response3.thumbSrc,
        response2.originalLocalPath,
        response2.localPath,
        response2.imageUrl,
        response2.sourceUrl,
        response2.src,
        response2.url,
        response2.thumbUrl,
      )
    );
  if (value8 === 'video') {
    const resultItem = pickResultItem(response2.videos, response2.mainVideoIndex);
    return (
      resolveCanvasVideoUrl(response2) ||
      firstUsableUrl(
        response3.url,
        response3.src,
        response2.localPath,
        response2.videoUrl,
        response2.src,
        response2.url,
        resultItem?.localPath,
        resultItem?.videoUrl,
      )
    );
  }
  if (value8 === 'audio')
    return (
      resolveCanvasAudioUrl(response2) ||
      firstUsableUrl(
        response3.url,
        response3.src,
        response2.localPath,
        response2.audioUrl,
        response2.src,
        response2.url,
      )
    );
  return '';
}
function resolveThumbUrl(value9, value10 = {}, value11 = {}) {
  const usableUrl = firstUsableUrl(
    value11.thumbSrc,
    value11.thumbUrl,
    value11.thumbnailUrl,
    value11.coverUrl,
    value10.thumbLocalPath,
    value10.thumbUrl,
    value10.thumbnailUrl,
    value10.coverUrl,
    value10.displayLocalPath,
  );
  if (usableUrl || (value9 !== 'image' && value9 !== 'video')) return usableUrl;
  return firstUsableUrl(
    value9 === 'image' ? value10.originalLocalPath : '',
    value9 === 'image' ? value10.localPath : '',
    value9 === 'image' ? value10.imageUrl : '',
  );
}
function buildAssetMentionRefs(error2) {
  if (!error2 || typeof error2 !== 'object') return [];
  const assetId2 = normalizeText(error2.id);
  if (!assetId2) return [];
  const enabled = Array.isArray(error2.items),
    enabled2 = Array.isArray(error2.nodes);
  if (!enabled && !enabled2) return [];
  const list6 = enabled
      ? error2.items
      : error2.nodes.map((nodeData) => ({
          nodeData: nodeData,
          type: nodeData?.type,
        })),
    assetName = normalizeText(error2.name),
    category = normalizeText(error2.category),
    list7 = [];
  return (
    list6.forEach((error3, itemIndex2) => {
      if (!error3 || typeof error3 !== 'object') return;
      const nodeData2 = error3.nodeData && typeof error3.nodeData === 'object' ? error3.nodeData : error3,
        type = resolveEffectiveInputKind(nodeData2) || normalizeAssetType(error3.type || nodeData2.type);
      if (!type) return;
      const name =
          normalizeText(error3.name || nodeData2.name || nodeData2.label) ||
          assetName ||
          '' + (TYPE_LABELS[type] || '素材') + (itemIndex2 + 1),
        content = type === 'text' ? getTextContent(nodeData2, error3) : '',
        url = type === 'text' ? '' : resolveRefUrl(type, nodeData2, error3),
        thumbUrl = resolveThumbUrl(type, nodeData2, error3);
      if (type === 'text' ? !content : !url) return;
      list7.push({
        origin: 'asset',
        assetId: assetId2,
        assetName: assetName,
        category: category,
        assetCategory: category,
        itemIndex: itemIndex2,
        type: type,
        name: name,
        label: name,
        insertLabel: name,
        content: content,
        url: url,
        thumbUrl: thumbUrl,
        nodeData: nodeData2,
      });
    }),
    list7
  );
}
function notifyRegistryChange() {
  ((_assetMentionRegistryRevision += 1),
    _assetMentionRegistryListeners.forEach((handler) => {
      try {
        handler(_assetMentionRegistryRevision);
      } catch (value12) {
        console.warn('[assetMentionRegistry] listener failed', value12);
      }
    }));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function')
    try {
      window.dispatchEvent(
        new CustomEvent('asset-mention-registry-change', {
          detail: { revision: _assetMentionRegistryRevision },
        }),
      );
    } catch {}
}
function rebuildIndex(value13) {
  ((_assetMentionRefs = Array.isArray(value13) ? value13 : []),
    (_assetMentionRefMap = new Map()),
    _assetMentionRefs.forEach((item3) => {
      _assetMentionRefMap.set(item3.assetId + ':' + item3.itemIndex, item3);
    }),
    notifyRegistryChange());
}
export function getAssetMentionRegistryRevision() {
  return _assetMentionRegistryRevision;
}
export function getAssetMentionLibrarySettings() {
  return {
    categories: [..._assetMentionLibrarySettings.categories],
    displayNames: { ..._assetMentionLibrarySettings.displayNames },
    parents: { ..._assetMentionLibrarySettings.parents },
  };
}
export function setAssetMentionLibrarySettings({
  categories: categories = [],
  displayNames: displayNames = {},
  parents: parents = {},
} = {}) {
  const value14 = {
    categories: normalizeCategoryList(categories),
    displayNames: normalizeCategoryRecord(displayNames),
    parents: normalizeCategoryRecord(parents),
  };
  if (areLibrarySettingsEqual(_assetMentionLibrarySettings, value14)) return false;
  return ((_assetMentionLibrarySettings = value14), notifyRegistryChange(), true);
}
export function subscribeAssetMentionRegistry(value15) {
  if (typeof value15 !== 'function') return () => {};
  return (
    _assetMentionRegistryListeners.add(value15),
    () => {
      _assetMentionRegistryListeners.delete(value15);
    }
  );
}
export function setAssetMentionAssets(list8 = []) {
  const list9 = [];
  ((Array.isArray(list8) ? list8 : []).forEach((item4) => {
    list9.push(...buildAssetMentionRefs(item4));
  }),
    rebuildIndex(list9));
}
export function upsertAssetMentionAsset(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object') return;
  const text5 = normalizeText(enabled3.id);
  if (!text5) return;
  const list10 = _assetMentionRefs.filter((item5) => item5.assetId !== text5);
  (list10.push(...buildAssetMentionRefs(enabled3)), rebuildIndex(list10));
}
export function removeAssetMentionAsset(value16) {
  const text6 = normalizeText(value16);
  if (!text6) return;
  rebuildIndex(_assetMentionRefs.filter((item6) => item6.assetId !== text6));
}
export function resolveAssetMentionRef({ assetId: assetId = '', itemIndex: itemIndex = 0 } = {}) {
  return _assetMentionRefMap.get(normalizeText(assetId) + ':' + Number(itemIndex)) || null;
}
export function getAssetMentionCandidates({ query: query = '', allowedTypes: allowedTypes = null } = {}) {
  const text7 = normalizeText(query).replace(/^@+/, '').toLowerCase(),
    map2 = Array.isArray(allowedTypes) && allowedTypes.length ? new Set(allowedTypes) : null;
  return _assetMentionRefs.filter((error4) => {
    if (map2 && !map2.has(error4.type)) return false;
    if (!text7) return true;
    const list11 = [
      error4.name,
      error4.assetName,
      error4.category,
      TYPE_LABELS[error4.type],
      error4.label,
      error4.insertLabel,
    ]
      .join(' ')
      .toLowerCase();
    return list11.includes(text7);
  });
}
export function _resetAssetMentionRegistryForTests() {
  ((_assetMentionLibrarySettings = {
    categories: [],
    displayNames: {},
    parents: {},
  }),
    rebuildIndex([]));
}
