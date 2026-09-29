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
export function normalizePromptMentionType(_0x5127fe) {
  const _0x3cdaaf = String(_0x5127fe || '')['trim']();
  return normalizeInputKind(PROMPT_MENTION_TYPE_MAP[_0x3cdaaf] || _0x3cdaaf);
}
export function normalizePromptAssetInputRefRecord(_0x36edf5 = {}) {
  if (!_0x36edf5 || typeof _0x36edf5 !== 'object') return null;
  const _0x38d69b = String(_0x36edf5['assetId'] || '')['trim'](),
    _0x3cfe51 =
      _0x36edf5['itemIndex'] !== undefined && _0x36edf5['itemIndex'] !== null
        ? _0x36edf5['itemIndex']
        : _0x36edf5['assetIndex'],
    _0x581669 = Number(_0x3cfe51),
    _0x34ed8a = normalizePromptMentionType(_0x36edf5['type']);
  if (!_0x38d69b || !Number['isFinite'](_0x581669) || !_0x34ed8a || _0x34ed8a === 'text') return null;
  return { assetId: _0x38d69b, itemIndex: Math['max'](0x0, Math['trunc'](_0x581669)), type: _0x34ed8a };
}
export function getPromptAssetInputRefRecords(_0x375041 = {}) {
  const _0x3f8182 = _0x375041?.[PROMPT_ASSET_INPUT_REFS_FIELD];
  if (!Array['isArray'](_0x3f8182)) return [];
  return _0x3f8182['map']((_0x72227e) => normalizePromptAssetInputRefRecord(_0x72227e))['filter'](Boolean);
}
function getPillDatasetValue(_0xf51da9, _0x35a5e7, _0x23f0e4 = '') {
  const _0x26ab81 = String(_0xf51da9?.['dataset']?.[_0x35a5e7] || '')['trim']();
  if (_0x26ab81) return _0x26ab81;
  if (_0x23f0e4 && typeof _0xf51da9?.['getAttribute'] === 'function')
    return String(_0xf51da9['getAttribute'](_0x23f0e4) || '')['trim']();
  return '';
}
function isRefPillNode(_0x20fd65) {
  if (!_0x20fd65) return ![];
  if (typeof _0x20fd65['classList']?.['contains'] === 'function')
    return _0x20fd65['classList']['contains']('ref-pill');
  return String(_0x20fd65['className'] || '')
    ['split'](/\s+/)
    ['filter'](Boolean)
    ['includes']('ref-pill');
}
function isAssetMentionPill(_0x55141a) {
  return getPillDatasetValue(_0x55141a, 'refOrigin', 'data-ref-origin') === 'asset';
}
export function getAssetMentionRefFromPillNode(_0x20ca08) {
  if (!isRefPillNode(_0x20ca08) || !isAssetMentionPill(_0x20ca08)) return null;
  const _0xf11f4f = getPillDatasetValue(_0x20ca08, 'assetId', 'data-asset-id'),
    _0x35f9e3 = getPillDatasetValue(_0x20ca08, 'assetIndex', 'data-asset-index'),
    _0x719124 = Number(_0x35f9e3);
  if (!_0xf11f4f || !Number['isFinite'](_0x719124)) return null;
  return resolveAssetMentionRef({ assetId: _0xf11f4f, itemIndex: _0x719124 });
}
function normalizeAllowedMentionTypes(_0x55e327 = null) {
  return Array['isArray'](_0x55e327) && _0x55e327['length']
    ? new Set(_0x55e327['map']((_0x329226) => normalizePromptMentionType(_0x329226))['filter'](Boolean))
    : null;
}
function appendResolvedAssetInputRefFromRecord(
  _0x3cf095,
  _0xd50910,
  _0x3741a6,
  {
    allowed: allowed = null,
    assetRefSource: assetRefSource = 'prompt',
    promptAssetRefIndex: promptAssetRefIndex = null,
  } = {},
) {
  const _0x4409e1 = String(_0x3741a6?.['assetId'] || '')['trim'](),
    _0x2e6cba =
      _0x3741a6?.['itemIndex'] !== undefined && _0x3741a6?.['itemIndex'] !== null
        ? _0x3741a6['itemIndex']
        : _0x3741a6?.['assetIndex'],
    _0x764723 = Number(_0x2e6cba),
    _0x539aa1 = resolveEffectiveInputKind(_0x3741a6) || normalizePromptMentionType(_0x3741a6?.['type']);
  if (!_0x4409e1 || !Number['isFinite'](_0x764723) || !_0x539aa1 || (allowed && !allowed['has'](_0x539aa1)))
    return ![];
  const _0x121511 = Math['max'](0x0, Math['trunc'](_0x764723)),
    _0x32cb12 = resolveAssetMentionRef({ assetId: _0x4409e1, itemIndex: _0x121511 });
  if (!_0x32cb12) return ![];
  const _0x1f2c05 =
    resolveEffectiveInputKind(_0x32cb12) || normalizePromptMentionType(_0x32cb12['type'] || _0x539aa1);
  if (!_0x1f2c05 || _0x1f2c05 !== _0x539aa1) return ![];
  if (_0x539aa1 === 'text') {
    if (!String(_0x32cb12['content'] || '')['trim']()) return ![];
  } else {
    if (!String(_0x32cb12['url'] || '')['trim']()) return ![];
  }
  const _0x5c1860 = _0x4409e1 + ':' + _0x121511 + ':' + _0x539aa1,
    _0x4f38ec = _0xd50910['get'](_0x5c1860) || 0x0;
  _0xd50910['set'](_0x5c1860, _0x4f38ec + 0x1);
  const _0x5efd61 = {
    ..._0x32cb12,
    type: _0x539aa1,
    assetMentionOccurrence: _0x4f38ec,
    assetRefSource: assetRefSource,
  };
  return (
    Number['isFinite'](Number(promptAssetRefIndex)) &&
      (_0x5efd61['promptAssetRefIndex'] = Math['max'](0x0, Math['trunc'](Number(promptAssetRefIndex)))),
    _0x3cf095['push'](_0x5efd61),
    !![]
  );
}
export function getAssetInputRefsFromPrompt(_0x3e5f3b = null, { allowedTypes: allowedTypes = null } = {}) {
  if (!_0x3e5f3b || typeof _0x3e5f3b['querySelectorAll'] !== 'function') return [];
  const _0xdd786d = normalizeAllowedMentionTypes(allowedTypes),
    _0x134f2d = [],
    _0x1ef104 = new Map();
  return (
    _0x3e5f3b['querySelectorAll']('.ref-pill')['forEach']((_0x3be3a5) => {
      if (!isAssetMentionPill(_0x3be3a5)) return;
      const _0x4f207e = getAssetMentionRefFromPillNode(_0x3be3a5);
      if (!_0x4f207e) return;
      const _0x130ab1 = resolveEffectiveInputKind(_0x4f207e) || normalizePromptMentionType(_0x4f207e['type']);
      if (!_0x130ab1 || (_0xdd786d && !_0xdd786d['has'](_0x130ab1))) return;
      if (_0x130ab1 === 'text') {
        if (!String(_0x4f207e['content'] || '')['trim']()) return;
      } else {
        if (!String(_0x4f207e['url'] || '')['trim']()) return;
      }
      const _0x323731 = _0x4f207e['assetId'] + ':' + _0x4f207e['itemIndex'] + ':' + _0x130ab1,
        _0x3b90e3 = _0x1ef104['get'](_0x323731) || 0x0;
      (_0x1ef104['set'](_0x323731, _0x3b90e3 + 0x1),
        _0x134f2d['push']({
          ..._0x4f207e,
          type: _0x130ab1,
          assetMentionOccurrence: _0x3b90e3,
          assetRefSource: 'prompt',
        }));
    }),
    _0x134f2d
  );
}
function decodeHtmlAttrValue(_0x295c6d) {
  return String(_0x295c6d || '')
    ['replace'](/&quot;/g, '\x22')
    ['replace'](/&#39;/g, '\x27')
    ['replace'](/&apos;/g, '\x27')
    ['replace'](/&lt;/g, '<')
    ['replace'](/&gt;/g, '>')
    ['replace'](/&amp;/g, '&');
}
function getHtmlAttrValue(_0x5a0139 = '', _0x3aace5 = '') {
  const _0x18ea67 = String(_0x3aace5 || '')['trim']();
  if (!_0x18ea67) return '';
  const _0xc2d150 = _0x18ea67['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&'),
    _0x500612 = new RegExp(_0xc2d150 + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'),
    _0xd2793f = String(_0x5a0139 || '')['match'](_0x500612);
  if (!_0xd2793f) return '';
  return decodeHtmlAttrValue(_0xd2793f[0x1] ?? _0xd2793f[0x2] ?? _0xd2793f[0x3] ?? '')['trim']();
}
function htmlClassAttrContains(_0x3908ab = '', _0x11efd7 = '') {
  return getHtmlAttrValue(_0x3908ab, 'class')['split'](/\s+/)['filter'](Boolean)['includes'](_0x11efd7);
}
export function getAssetInputRefsFromPromptHtml(_0xffd8a2 = '', { allowedTypes: allowedTypes = null } = {}) {
  const _0xdce1c4 = normalizeAllowedMentionTypes(allowedTypes),
    _0x22d9cd = sanitizePromptHtml(_0xffd8a2);
  if (!_0x22d9cd) return [];
  const _0x1976a5 = [],
    _0x181a5f = new Map(),
    _0x531db9 = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
  let _0x21901a = null;
  while ((_0x21901a = _0x531db9['exec'](_0x22d9cd))) {
    const _0x188bb3 = _0x21901a[0x1] || '';
    if (!htmlClassAttrContains(_0x188bb3, 'ref-pill')) continue;
    if (getHtmlAttrValue(_0x188bb3, 'data-ref-origin') !== 'asset') continue;
    appendResolvedAssetInputRefFromRecord(
      _0x1976a5,
      _0x181a5f,
      {
        assetId: getHtmlAttrValue(_0x188bb3, 'data-asset-id'),
        itemIndex: getHtmlAttrValue(_0x188bb3, 'data-asset-index'),
        type: getHtmlAttrValue(_0x188bb3, 'data-ref-type'),
      },
      { allowed: _0xdce1c4, assetRefSource: 'prompt' },
    );
  }
  return _0x1976a5;
}
export function getPromptAssetInputRefsFromNode(_0x1dde07 = {}, { allowedTypes: allowedTypes = null } = {}) {
  const _0x5a2a3a = normalizeAllowedMentionTypes(allowedTypes),
    _0x3cb7fc = [],
    _0x15e559 = new Map();
  return (
    getPromptAssetInputRefRecords(_0x1dde07)['forEach']((_0x1d2e53, _0x1c3d15) => {
      const _0x24cd6e = normalizePromptMentionType(_0x1d2e53['type']);
      if (!_0x24cd6e || _0x24cd6e === 'text') return;
      appendResolvedAssetInputRefFromRecord(_0x3cb7fc, _0x15e559, _0x1d2e53, {
        allowed: _0x5a2a3a,
        assetRefSource: 'hidden',
        promptAssetRefIndex: _0x1c3d15,
      });
    }),
    _0x3cb7fc
  );
}
export function getAssetInputRefsFromNodeData(_0x39204f = {}, { allowedTypes: allowedTypes = null } = {}) {
  return [
    ...getAssetInputRefsFromPromptHtml(_0x39204f?.['prompt'] || '', { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(_0x39204f || {}, { allowedTypes: allowedTypes }),
  ];
}
export function getAssetInputRefsFromPromptAndNode(
  _0x56c783 = null,
  { nodeData: nodeData = null, allowedTypes: allowedTypes = null, dedupe: dedupe = ![] } = {},
) {
  const _0x407555 = [
    ...getAssetInputRefsFromPrompt(_0x56c783, { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(nodeData || {}, { allowedTypes: allowedTypes }),
  ];
  if (!dedupe) return _0x407555;
  const _0x1d0cd5 = new Map();
  for (const _0x3e63ed of _0x407555) {
    const _0x2f8757 =
      _0x3e63ed['assetId'] +
      ':' +
      _0x3e63ed['itemIndex'] +
      ':' +
      _0x3e63ed['type'] +
      ':' +
      _0x3e63ed['assetRefSource'];
    if (_0x1d0cd5['has'](_0x2f8757)) _0x1d0cd5['get'](_0x2f8757)['assetMentionOccurrence'] = -0x1;
    else _0x1d0cd5['set'](_0x2f8757, { ..._0x3e63ed });
  }
  return [..._0x1d0cd5['values']()];
}
