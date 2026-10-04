import { resolveAssetMentionRef } from './assetMentionRegistry.js';
import { normalizeInputKind, resolveEffectiveInputKind } from './modelInputPolicy.js';
import { sanitizePromptHtml } from '../utils/dom.js';
const PROMPT_MENTION_TYPE_MAP = Object['freeze']({
  text: 'text',
  'source-text': 'text',
  'ai-text': 'text',
  image: 'image',
  'source-image': 'image',
  'ai-image': 'image',
  video: 'video',
  'source-video': 'video',
  'ai-video': 'video',
  audio: 'audio',
  'source-audio': 'audio',
  'ai-audio': 'audio',
});
export const PROMPT_ASSET_INPUT_REFS_FIELD = 'promptAssetInputRefs';
export function normalizePromptMentionType(value) {
  const item = String(value || '')['trim']();
  return normalizeInputKind(PROMPT_MENTION_TYPE_MAP[item] || item);
}
export function normalizePromptAssetInputRefRecord(enabled = {}) {
  if (!enabled || typeof enabled !== 'object') return null;
  const assetId = String(enabled['assetId'] || '')['trim'](),
    key =
      enabled['itemIndex'] !== undefined && enabled['itemIndex'] !== null
        ? enabled['itemIndex']
        : enabled['assetIndex'],
    index = Number(key),
    type = normalizePromptMentionType(enabled['type']);
  if (!assetId || !Number['isFinite'](index) || !type || type === 'text') return null;
  return { assetId: assetId, itemIndex: Math['max'](0x0, Math['trunc'](index)), type: type };
}
export function getPromptAssetInputRefRecords(options = {}) {
  const list = options?.[PROMPT_ASSET_INPUT_REFS_FIELD];
  if (!Array['isArray'](list)) return [];
  return list['map']((result) => normalizePromptAssetInputRefRecord(result))['filter'](Boolean);
}
function getPillDatasetValue(el, data, target = '') {
  const source = String(el?.['dataset']?.[data] || '')['trim']();
  if (source) return source;
  if (target && typeof el?.['getAttribute'] === 'function')
    return String(el['getAttribute'](target) || '')['trim']();
  return '';
}
function isRefPillNode(el2) {
  if (!el2) return ![];
  if (typeof el2['classList']?.['contains'] === 'function') return el2['classList']['contains']('ref-pill');
  return String(el2['className'] || '')
    ['split'](/\s+/)
    ['filter'](Boolean)
    ['includes']('ref-pill');
}
function isAssetMentionPill(next) {
  return getPillDatasetValue(next, 'refOrigin', 'data-ref-origin') === 'asset';
}
export function getAssetMentionRefFromPillNode(current) {
  if (!isRefPillNode(current) || !isAssetMentionPill(current)) return null;
  const assetId2 = getPillDatasetValue(current, 'assetId', 'data-asset-id'),
    pillDatasetValue = getPillDatasetValue(current, 'assetIndex', 'data-asset-index'),
    itemIndex = Number(pillDatasetValue);
  if (!assetId2 || !Number['isFinite'](itemIndex)) return null;
  return resolveAssetMentionRef({ assetId: assetId2, itemIndex: itemIndex });
}
function normalizeAllowedMentionTypes(list2 = null) {
  return Array['isArray'](list2) && list2['length']
    ? new Set(list2['map']((entry) => normalizePromptMentionType(entry))['filter'](Boolean))
    : null;
}
function appendResolvedAssetInputRefFromRecord(
  list3,
  map,
  record,
  {
    allowed: allowed = null,
    assetRefSource: assetRefSource = 'prompt',
    promptAssetRefIndex: promptAssetRefIndex = null,
  } = {},
) {
  const assetId3 = String(record?.['assetId'] || '')['trim'](),
    payload =
      record?.['itemIndex'] !== undefined && record?.['itemIndex'] !== null
        ? record['itemIndex']
        : record?.['assetIndex'],
    handle = Number(payload),
    type2 = resolveEffectiveInputKind(record) || normalizePromptMentionType(record?.['type']);
  if (!assetId3 || !Number['isFinite'](handle) || !type2 || (allowed && !allowed['has'](type2))) return ![];
  const itemIndex2 = Math['max'](0x0, Math['trunc'](handle)),
    response = resolveAssetMentionRef({ assetId: assetId3, itemIndex: itemIndex2 });
  if (!response) return ![];
  const effectiveInputKind =
    resolveEffectiveInputKind(response) || normalizePromptMentionType(response['type'] || type2);
  if (!effectiveInputKind || effectiveInputKind !== type2) return ![];
  if (type2 === 'text') {
    if (!String(response['content'] || '')['trim']()) return ![];
  } else {
    if (!String(response['url'] || '')['trim']()) return ![];
  }
  const state = assetId3 + ':' + itemIndex2 + ':' + type2,
    assetMentionOccurrence = map['get'](state) || 0x0;
  map['set'](state, assetMentionOccurrence + 0x1);
  const config = {
    ...response,
    type: type2,
    assetMentionOccurrence: assetMentionOccurrence,
    assetRefSource: assetRefSource,
  };
  return (
    Number['isFinite'](Number(promptAssetRefIndex)) &&
      (config['promptAssetRefIndex'] = Math['max'](0x0, Math['trunc'](Number(promptAssetRefIndex)))),
    list3['push'](config),
    !![]
  );
}
export function getAssetInputRefsFromPrompt(el3 = null, { allowedTypes: allowedTypes = null } = {}) {
  if (!el3 || typeof el3['querySelectorAll'] !== 'function') return [];
  const map2 = normalizeAllowedMentionTypes(allowedTypes),
    list4 = [],
    map3 = new Map();
  return (
    el3['querySelectorAll']('.ref-pill')['forEach']((scope) => {
      if (!isAssetMentionPill(scope)) return;
      const response2 = getAssetMentionRefFromPillNode(scope);
      if (!response2) return;
      const type3 = resolveEffectiveInputKind(response2) || normalizePromptMentionType(response2['type']);
      if (!type3 || (map2 && !map2['has'](type3))) return;
      if (type3 === 'text') {
        if (!String(response2['content'] || '')['trim']()) return;
      } else {
        if (!String(response2['url'] || '')['trim']()) return;
      }
      const input = response2['assetId'] + ':' + response2['itemIndex'] + ':' + type3,
        assetMentionOccurrence2 = map3['get'](input) || 0x0;
      (map3['set'](input, assetMentionOccurrence2 + 0x1),
        list4['push']({
          ...response2,
          type: type3,
          assetMentionOccurrence: assetMentionOccurrence2,
          assetRefSource: 'prompt',
        }));
    }),
    list4
  );
}
function decodeHtmlAttrValue(output) {
  return String(output || '')
    ['replace'](/&quot;/g, '\x22')
    ['replace'](/&#39;/g, '\x27')
    ['replace'](/&apos;/g, '\x27')
    ['replace'](/&lt;/g, '<')
    ['replace'](/&gt;/g, '>')
    ['replace'](/&amp;/g, '&');
}
function getHtmlAttrValue(value2 = '', value3 = '') {
  const enabled2 = String(value3 || '')['trim']();
  if (!enabled2) return '';
  const value4 = enabled2['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&'),
    regExp = new RegExp(value4 + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'),
    enabled3 = String(value2 || '')['match'](regExp);
  if (!enabled3) return '';
  return decodeHtmlAttrValue(enabled3[0x1] ?? enabled3[0x2] ?? enabled3[0x3] ?? '')['trim']();
}
function htmlClassAttrContains(value5 = '', value6 = '') {
  return getHtmlAttrValue(value5, 'class')['split'](/\s+/)['filter'](Boolean)['includes'](value6);
}
export function getAssetInputRefsFromPromptHtml(value7 = '', { allowedTypes: allowedTypes = null } = {}) {
  const allowed2 = normalizeAllowedMentionTypes(allowedTypes),
    sanitizePromptHtml2 = sanitizePromptHtml(value7);
  if (!sanitizePromptHtml2) return [];
  const value8 = [],
    value9 = new Map(),
    value10 = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
  let value11 = null;
  while ((value11 = value10['exec'](sanitizePromptHtml2))) {
    const value12 = value11[0x1] || '';
    if (!htmlClassAttrContains(value12, 'ref-pill')) continue;
    if (getHtmlAttrValue(value12, 'data-ref-origin') !== 'asset') continue;
    appendResolvedAssetInputRefFromRecord(
      value8,
      value9,
      {
        assetId: getHtmlAttrValue(value12, 'data-asset-id'),
        itemIndex: getHtmlAttrValue(value12, 'data-asset-index'),
        type: getHtmlAttrValue(value12, 'data-ref-type'),
      },
      { allowed: allowed2, assetRefSource: 'prompt' },
    );
  }
  return value8;
}
export function getPromptAssetInputRefsFromNode(options2 = {}, { allowedTypes: allowedTypes = null } = {}) {
  const allowed3 = normalizeAllowedMentionTypes(allowedTypes),
    value13 = [],
    value14 = new Map();
  return (
    getPromptAssetInputRefRecords(options2)['forEach']((value15, promptAssetRefIndex2) => {
      const promptMentionType = normalizePromptMentionType(value15['type']);
      if (!promptMentionType || promptMentionType === 'text') return;
      appendResolvedAssetInputRefFromRecord(value13, value14, value15, {
        allowed: allowed3,
        assetRefSource: 'hidden',
        promptAssetRefIndex: promptAssetRefIndex2,
      });
    }),
    value13
  );
}
export function getAssetInputRefsFromNodeData(options3 = {}, { allowedTypes: allowedTypes = null } = {}) {
  return [
    ...getAssetInputRefsFromPromptHtml(options3?.['prompt'] || '', { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(options3 || {}, { allowedTypes: allowedTypes }),
  ];
}
export function getAssetInputRefsFromPromptAndNode(
  value16 = null,
  { nodeData: nodeData = null, allowedTypes: allowedTypes = null, dedupe: dedupe = ![] } = {},
) {
  const value17 = [
    ...getAssetInputRefsFromPrompt(value16, { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(nodeData || {}, { allowedTypes: allowedTypes }),
  ];
  if (!dedupe) return value17;
  const map4 = new Map();
  for (const args of value17) {
    const value18 =
      args['assetId'] + ':' + args['itemIndex'] + ':' + args['type'] + ':' + args['assetRefSource'];
    if (map4['has'](value18)) map4['get'](value18)['assetMentionOccurrence'] = -0x1;
    else map4['set'](value18, { ...args });
  }
  return [...map4['values']()];
}
