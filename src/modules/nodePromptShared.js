import { normalizePromptMentionType } from './promptAssetInputRefs.js';
import {
  rememberVirtualizedPromptCommit,
  serializeVirtualizedPromptHtml,
} from './promptPasteVirtualization.js';
import appStore from '../core/stores/appStore.js';
import {
  getInputLimitReason,
  getTargetInputPolicy,
  isInputKindAllowed,
  normalizeInputKind,
  resolveEffectiveInputKind,
} from './modelInputPolicy.js';
import { sanitizePromptHtml } from '../utils/dom.js';
import { getAssetMentionCandidates, resolveAssetMentionRef } from './assetMentionRegistry.js';
import { createReferenceFallbackThumbElement } from './referenceThumbnailFallback.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { hasPromptPresetTemplateContent, resolvePromptPresetTemplate } from './promptPresetTemplate.js';
import { normalizeProviderId, resolveModelExecution } from '../manifests/index.js';
import { t } from '../i18n/index.js';
function nodePromptSharedText(value, item = {}) {
  return t('nodePromptShared.' + value, item);
}
const AT_TYPE_MAP = { text: '文本', image: '图片', video: '视频', audio: '音频' },
  MENTION_TYPE_ORDER = ['text', 'image', 'video', 'audio'],
  ASSET_TYPE_MENU_LABELS = { text: 'text', image: 'image', video: 'video', audio: 'audio' };
export const PROMPT_ASSET_INPUT_REFS_FIELD = 'promptAssetInputRefs';
const PROMPT_INPUT_REF_UNRESOLVED_ATTR = 'data-ref-unresolved',
  PROMPT_INPUT_REF_LABEL_ATTR = 'data-ref-label',
  PROMPT_HTML_COMMIT_DELAY_MS = 320,
  ADVANCED_VOICE_CLONE_WORKFLOW_KEY = 'advanced_voice_clone',
  _pendingPromptHtmlCommitTargets = new Set(),
  AT_TYPE_CANDIDATE_MAP = {
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
  };
function _getMentionType(key) {
  return normalizeInputKind(AT_TYPE_CANDIDATE_MAP[String(key || '').trim()] || key);
}
function _normalizeQuery(index) {
  return String(index || '')
    .trim()
    .replace(/^@+/, '');
}
function _stripMentionDisplayMarker(result) {
  return String(result || '')
    .trim()
    .replace(/^@+/, '')
    .trim();
}
function _formatMentionSubmitLabel(data) {
  const _stripMentionDisplayMarker2 = _stripMentionDisplayMarker(data);
  return _stripMentionDisplayMarker2 ? '@' + _stripMentionDisplayMarker2 : '';
}
function _normalizePromptWhitespace(options) {
  return String(options || '')
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, ' ')
    .trim();
}
export function normalizePromptEnterBehavior(target) {
  return target === 'newline' ? 'newline' : 'submit';
}
function getPromptEnterBehaviorFromStore() {
  try {
    const source = appStore.getStateRaw?.() || appStore.getState?.() || {};
    return normalizePromptEnterBehavior(source?.ui?.promptEnterBehavior);
  } catch {
    return 'submit';
  }
}
export function shouldSubmitPromptByKeyboard(event, next = {}) {
  if (!event || event.key !== 'Enter' || event.isComposing === true) return false;
  const current = Object.prototype.hasOwnProperty.call(next, 'behavior')
      ? next.behavior
      : getPromptEnterBehaviorFromStore(),
    promptEnterBehavior = normalizePromptEnterBehavior(current);
  if (promptEnterBehavior === 'newline') return event.ctrlKey === true || event.metaKey === true;
  return event.shiftKey !== true;
}
function _getAssetTypeMenuLabel(entry) {
  const record = ASSET_TYPE_MENU_LABELS[entry];
  if (record) return nodePromptSharedText('assetTypes.' + record);
  return entry || nodePromptSharedText('materialFallback');
}
function _escapeRegExp(payload) {
  return String(payload || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function _getTextRefContent(response) {
  return String(
    response?.outputText || response?.text || response?.content || response?.prompt || response?.label || '',
  ).trim();
}
function _getChildNodes(enabled) {
  if (!enabled?.childNodes) return [];
  return Array.from(enabled.childNodes);
}
function _isRefPillNode(el) {
  if (!el) return false;
  if (typeof el.classList?.contains === 'function') return el.classList.contains('ref-pill');
  return String(el.className || '')
    .split(/\s+/)
    .filter(Boolean)
    .includes('ref-pill');
}
function _getDatasetValue(el2, handle, state = '') {
  const config = String(el2?.dataset?.[handle] || '').trim();
  if (config) return config;
  if (state && typeof el2?.getAttribute === 'function') return String(el2.getAttribute(state) || '').trim();
  return '';
}
function _decodeHtmlAttrValue(scope) {
  return String(scope || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
function _getHtmlAttrValue(input = '', output = '') {
  const enabled2 = String(output || '').trim();
  if (!enabled2) return '';
  const regExp = new RegExp(_escapeRegExp(enabled2) + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'),
    enabled3 = String(input || '').match(regExp);
  if (!enabled3) return '';
  return _decodeHtmlAttrValue(enabled3[1] ?? enabled3[2] ?? enabled3[3] ?? '').trim();
}
function _htmlClassAttrContains(value2 = '', value3 = '') {
  const _getHtmlAttrValue2 = _getHtmlAttrValue(value2, 'class');
  return _getHtmlAttrValue2.split(/\s+/).filter(Boolean).includes(value3);
}
function _isAssetMentionPill(value4) {
  return _getDatasetValue(value4, 'refOrigin', 'data-ref-origin') === 'asset';
}
function _isUnresolvedInputMentionPill(value5) {
  return (
    !_isAssetMentionPill(value5) &&
    _getDatasetValue(value5, 'refUnresolved', PROMPT_INPUT_REF_UNRESOLVED_ATTR) === 'true'
  );
}
function _normalizeMentionLabelKey(value6) {
  return _stripMentionDisplayMarker(value6).replace(/[\s\u00A0]+/g, '');
}
function _inferMentionTypeFromLabel(value7 = '') {
  const _normalizeMentionLabelKey2 = _normalizeMentionLabelKey(value7);
  if (!_normalizeMentionLabelKey2) return '';
  for (const value8 of MENTION_TYPE_ORDER) {
    const value9 = String(AT_TYPE_MAP[value8] || '').trim();
    if (value9 && _normalizeMentionLabelKey2.startsWith(value9)) return value8;
  }
  return '';
}
function _getPillMentionType(el3) {
  return (
    _getMentionType(_getDatasetValue(el3, 'refType', 'data-ref-type')) ||
    _inferMentionTypeFromLabel(_getDatasetValue(el3, 'label', 'data-label') || el3?.textContent || '')
  );
}
function _getPromptInputDisplayLabel(el4) {
  return _stripMentionDisplayMarker(_getDatasetValue(el4, 'label', 'data-label') || el4?.textContent || '');
}
function _getPromptInputRefLabel(value10, value11 = '') {
  return _stripMentionDisplayMarker(
    _getDatasetValue(value10, 'refLabel', PROMPT_INPUT_REF_LABEL_ATTR) || value11,
  );
}
export function getPromptInputSubmitLabelFromPillNode(el5, value12 = '') {
  if (_isAssetMentionPill(el5))
    return String(_getDatasetValue(el5, 'label', 'data-label') || el5?.textContent || value12 || '').trim();
  return _formatMentionSubmitLabel(
    _getPromptInputRefLabel(el5, value12) || _getPromptInputDisplayLabel(el5) || value12,
  );
}
function _setInputMentionPillUnresolved(el6, { label: label = '', type: type = '' } = {}) {
  if (!_isRefPillNode(el6) || _isAssetMentionPill(el6)) return false;
  const _stripMentionDisplayMarker3 = _stripMentionDisplayMarker(
      label || el6?.dataset?.label || el6?.textContent || '',
    ),
    _getPromptInputRefLabel2 = _getPromptInputRefLabel(el6, _stripMentionDisplayMarker3),
    _getMentionType2 = _getMentionType(type) || _getPillMentionType(el6);
  ((el6.dataset.label = _stripMentionDisplayMarker3),
    (el6.dataset.refOrigin = 'node'),
    (el6.dataset.refUnresolved = 'true'));
  if (_getPromptInputRefLabel2) el6.dataset.refLabel = _getPromptInputRefLabel2;
  if (_getMentionType2) el6.dataset.refType = _getMentionType2;
  return (
    delete el6.dataset.nodeId,
    el6.removeAttribute?.('data-node-id'),
    el6.classList?.add?.('ref-pill--unresolved'),
    (el6.title = 'Input reference is not bound in this node.'),
    _renderMentionPillContent(el6, _stripMentionDisplayMarker3, _getMentionVisual(null, null, el6)),
    true
  );
}
function _clearInputMentionPillUnresolved(el7) {
  if (!_isRefPillNode(el7)) return false;
  (delete el7.dataset.refUnresolved,
    el7.removeAttribute?.(PROMPT_INPUT_REF_UNRESOLVED_ATTR),
    el7.classList?.remove?.('ref-pill--unresolved'));
  if (el7.title === 'Input reference is not bound in this node.') {
    el7.removeAttribute?.('title');
    if ('title' in el7) el7.title = '';
  }
  return true;
}
function _getTargetNodeData(value13 = null) {
  const value14 = String(value13?.nodeId || '').trim(),
    value15 = value14 ? appStore.getState?.()?.nodes?.[value14] : null;
  return value15 || value13?._data || {};
}
function _isAdvancedVoiceCloneTarget(options2 = {}) {
  if (String(options2?.type || '').trim() !== 'ai-audio') return false;
  return [options2.audioWorkflowKey, options2.model, options2.audioWorkflowLabel].some(
    (item2) => String(item2 || '').trim() === ADVANCED_VOICE_CLONE_WORKFLOW_KEY,
  );
}
function _getMentionAudioInputKey(options3 = {}) {
  if (_getMentionType(options3?.type) !== 'audio') return '';
  if (options3?.origin === 'asset') {
    const _getPromptAssetInputRefRecordForMention2 = _getPromptAssetInputRefRecordForMention(options3);
    return _getPromptAssetInputRefRecordForMention2
      ? 'asset:' +
          _getPromptAssetInputRefRecordForMention2.assetId +
          ':' +
          _getPromptAssetInputRefRecordForMention2.itemIndex
      : '';
  }
  const value16 = String(options3?.nodeId || options3?.sourceId || '').trim();
  return value16 ? 'node:' + value16 : '';
}
function _getActualAudioInputKeysForTarget(value17 = '', value18 = {}, value19 = null) {
  const value20 = new Set(),
    value21 = value19 || appStore.getState(),
    value22 = value21.nodes || {};
  return (
    appStore.getIncomingEdges(value17).forEach((item3) => {
      const value23 = value22?.[item3?.sourceId];
      resolveEffectiveInputKind(value23, item3) === 'audio' &&
        item3?.sourceId &&
        value20.add('node:' + item3.sourceId);
    }),
    _getPromptAssetInputRefRecords(value18 || {}).forEach((item4) => {
      item4.type === 'audio' && value20.add('asset:' + item4.assetId + ':' + item4.itemIndex);
    }),
    value20
  );
}
function _getAdvancedVoiceCloneAudioLimitReason(value24, value25 = {}, value26 = {}, value27 = null) {
  if (!_isAdvancedVoiceCloneTarget(value26)) return null;
  if (_getMentionType(value25?.type) !== 'audio') return null;
  const targetInputPolicy = getTargetInputPolicy(value26),
    count = Number(targetInputPolicy?.maxByKind?.audio);
  if (!Number.isFinite(count) || count <= 0) return null;
  const audio = _getActualAudioInputKeysForTarget(value24?.nodeId, value26, value27),
    _getMentionAudioInputKey2 = _getMentionAudioInputKey(value25);
  if (_getMentionAudioInputKey2 && audio.has(_getMentionAudioInputKey2)) return '';
  return audio.size >= count ? getInputLimitReason(targetInputPolicy, 'audio', { audio: audio.size }) : '';
}
export function isRunningHubWorkflowNode(options4 = {}) {
  const providerHint = normalizeProviderId(options4?.provider);
  if (providerHint === 'runninghubwf') return true;
  const enabled4 = String(options4?.model || '').trim();
  if (!enabled4) return false;
  const modelExecution =
      resolveModelExecution(enabled4, { providerHint: providerHint }) || resolveModelExecution(enabled4),
    providerId = normalizeProviderId(modelExecution?.modelManifest?.provider),
    providerId2 = normalizeProviderId(modelExecution?.executionManifest?.provider);
  return (
    modelExecution?.executionManifest?.adapterType === 'workflow' &&
    (providerId === 'runninghubwf' || providerId2 === 'runninghubwf')
  );
}
function _normalizePromptAssetInputRefRecord(enabled5 = {}) {
  if (!enabled5 || typeof enabled5 !== 'object') return null;
  const assetId2 = String(enabled5.assetId || '').trim(),
    value28 =
      enabled5.itemIndex !== undefined && enabled5.itemIndex !== null
        ? enabled5.itemIndex
        : enabled5.assetIndex,
    value29 = Number(value28),
    type2 = _getMentionType(enabled5.type);
  if (!assetId2 || !Number.isFinite(value29) || !type2 || type2 === 'text') return null;
  return { assetId: assetId2, itemIndex: Math.max(0, Math.trunc(value29)), type: type2 };
}
function _getPromptAssetInputRefRecords(options5 = {}) {
  const list = options5?.[PROMPT_ASSET_INPUT_REFS_FIELD];
  if (!Array.isArray(list)) return [];
  return list.map((item5) => _normalizePromptAssetInputRefRecord(item5)).filter(Boolean);
}
function _toLocalPathUrl(value30) {
  return localPathToUrl(value30);
}
function _isLikelyImageUrl(value31) {
  const enabled6 = String(value31 || '')
    .trim()
    .toLowerCase();
  if (!enabled6) return false;
  if (enabled6.startsWith('data:image/') || enabled6.startsWith('blob:')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(enabled6);
}
function _firstNonEmpty(list2 = []) {
  return list2.map((item6) => String(item6 || '').trim()).find(Boolean) || '';
}
function _pickIndexedItem(list3, value32) {
  if (!Array.isArray(list3) || list3.length === 0) return null;
  const value33 = Number.isFinite(Number(value32)) ? Math.max(0, Math.trunc(Number(value32))) : 0;
  return list3[value33] || list3[0] || null;
}
function _resolveNodeThumbUrl(response2 = {}, value34 = '') {
  const _getMentionType3 = _getMentionType(value34 || response2?.type);
  if (_getMentionType3 === 'text' || _getMentionType3 === 'audio') return '';
  if (_getMentionType3 === 'image') {
    const response3 = _pickIndexedItem(response2.images || response2.outputImages, response2.mainImageIndex);
    return _firstNonEmpty([
      response3?.thumbUrl,
      response3?.src,
      response3?.imageUrl,
      response3?.sourceUrl,
      response3?.url,
      _toLocalPathUrl(response3?.localPath),
      response2.thumbUrl,
      response2.src,
      response2.imageUrl,
      response2.sourceUrl,
      response2.url,
      _toLocalPathUrl(response2.localPath),
    ]);
  }
  if (_getMentionType3 === 'video') {
    const _pickIndexedItem2 = _pickIndexedItem(response2.videos, response2.mainVideoIndex),
      list4 = [
        _pickIndexedItem2?.thumbUrl,
        _pickIndexedItem2?.posterUrl,
        _toLocalPathUrl(_pickIndexedItem2?.posterLocalPath),
        response2.thumbUrl,
        response2.videoThumbSrc,
        response2.firstFrameThumbUrl,
        response2.firstFrameUrl,
        response2.posterUrl,
        _toLocalPathUrl(response2.posterLocalPath),
        response2.imageUrl,
        response2.src,
      ];
    return (
      list4.map((item7) => String(item7 || '').trim()).find((item8) => item8 && _isLikelyImageUrl(item8)) ||
      ''
    );
  }
  return '';
}
function _resolveRefBarThumbNode(enabled7, value35) {
  const enabled8 = String(value35 || '').trim();
  if (!enabled8 || !enabled7?.refBarEl || typeof enabled7.refBarEl.querySelector !== 'function') return null;
  const value36 =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(enabled8)
        : enabled8.replace(/["\\]/g, '\\$&'),
    el8 = enabled7.refBarEl.querySelector('.ref-thumb-wrap[data-source-id="' + value36 + '"]');
  return el8?.querySelector?.('.ref-thumb-media') || null;
}
function _getThumbNodeUrl(value37) {
  const value38 = value37?.tagName && String(value37.tagName).toLowerCase() === 'img' ? value37 : null;
  return String(value38?.currentSrc || value38?.src || '').trim();
}
function _getRenderableMentionThumbUrl(value39, value40 = '') {
  const enabled9 = String(value39 || '').trim();
  if (!enabled9) return '';
  const _getMentionType4 = _getMentionType(value40);
  if (_getMentionType4 === 'text' || _getMentionType4 === 'audio')
    return _isLikelyImageUrl(enabled9) ? enabled9 : '';
  return enabled9;
}
function _getMentionVisual(value41, value42 = null, value43 = null) {
  const _getMentionType5 = _getMentionType(
      value42?.type || _getDatasetValue(value43, 'refType', 'data-ref-type'),
    ),
    iconType2 = _getMentionType5 || 'text';
  if (value42?.origin === 'asset' || _isAssetMentionPill(value43)) {
    const value44 = value42?.origin === 'asset' ? null : getAssetMentionRefFromPillNode(value43),
      thumbUrl2 = _getRenderableMentionThumbUrl(
        value42?.thumbUrl || value44?.thumbUrl || '',
        _getMentionType5,
      );
    return { thumbUrl: thumbUrl2, iconType: iconType2 };
  }
  const value45 = String(
      value42?.nodeId || value42?.sourceId || _getDatasetValue(value43, 'nodeId', 'data-node-id'),
    ).trim(),
    value46 = appStore.getState?.()?.nodes?.[value45] || {},
    iconType3 = _getMentionType5 || _getMentionType(value46.type),
    _resolveRefBarThumbNode2 = _resolveRefBarThumbNode(value41, value45),
    _getThumbNodeUrl2 = _getThumbNodeUrl(_resolveRefBarThumbNode2),
    thumbUrl3 =
      _getThumbNodeUrl2 ||
      _getRenderableMentionThumbUrl(value42?.thumbUrl || '', iconType3) ||
      _resolveNodeThumbUrl(value46, iconType3);
  return {
    thumbUrl: thumbUrl3,
    thumbNode: thumbUrl3 ? null : _resolveRefBarThumbNode2,
    iconType: iconType3 || iconType2,
  };
}
function _createTextAudioMentionThumb(value47, value48) {
  return createReferenceFallbackThumbElement(_getMentionType(value47), value48);
}
function _cloneMentionThumbNode(enabled10, value49, value50 = '') {
  const _createTextAudioMentionThumb2 = _createTextAudioMentionThumb(value50, value49);
  if (_createTextAudioMentionThumb2) return _createTextAudioMentionThumb2;
  if (!enabled10) return null;
  if (typeof enabled10.cloneNode !== 'function') return null;
  const value51 = enabled10.cloneNode(true);
  return (
    (value51.className = value49),
    (value51.draggable = false),
    (value51.contentEditable = 'false'),
    value51
  );
}
function _appendMentionVisualNode(
  el9,
  { thumbUrl: thumbUrl = '', thumbNode: thumbNode = null, iconType: iconType = '' } = {},
) {
  if (thumbUrl) {
    const value52 = document.createElement('img');
    return (
      (value52.className = 'ref-pill-thumb'),
      (value52.src = thumbUrl),
      (value52.alt = ''),
      (value52.draggable = false),
      (value52.contentEditable = 'false'),
      el9.appendChild(value52),
      true
    );
  }
  const _cloneMentionThumbNode2 = _cloneMentionThumbNode(thumbNode, 'ref-pill-thumb', iconType);
  if (!_cloneMentionThumbNode2) return false;
  return (el9.appendChild(_cloneMentionThumbNode2), true);
}
function _renderMentionPillContent(el10, value53, value54 = {}) {
  const _stripMentionDisplayMarker4 = _stripMentionDisplayMarker(value53);
  if (
    typeof document === 'undefined' ||
    typeof document.createElement !== 'function' ||
    typeof el10?.replaceChildren !== 'function'
  ) {
    el10.textContent = _stripMentionDisplayMarker4;
    return;
  }
  const el11 = document.createElement('span');
  ((el11.className = 'ref-pill-label'),
    (el11.textContent = _stripMentionDisplayMarker4),
    el10.replaceChildren(),
    _appendMentionVisualNode(el10, value54),
    el10.appendChild(el11));
}
function _isPillVisualCurrent(el12, value55 = {}) {
  if (!el12 || typeof el12.querySelector !== 'function') return true;
  const _getMentionType6 = _getMentionType(value55.iconType);
  if (value55.thumbUrl) {
    const value56 = el12.querySelector('img.ref-pill-thumb');
    return String(value56?.currentSrc || value56?.src || '').trim() === value55.thumbUrl;
  }
  if (_getMentionType6 === 'text' || _getMentionType6 === 'audio') {
    const el13 = el12.querySelector('.ref-pill-thumb'),
      list5 =
        typeof el13?.className === 'string' ? el13.className : String(el13?.getAttribute?.('class') || '');
    return (
      !!el13 && (el13.classList?.contains?.('ref-thumb-fallback') || list5.includes('ref-thumb-fallback'))
    );
  }
  if (value55.thumbNode) return !!el12.querySelector('.ref-pill-thumb');
  return !el12.querySelector('.ref-pill-thumb') && !el12.querySelector('.ref-pill-icon');
}
export function getAssetMentionRefFromPillNode(value57) {
  if (!_isRefPillNode(value57) || !_isAssetMentionPill(value57)) return null;
  const assetId3 = _getDatasetValue(value57, 'assetId', 'data-asset-id'),
    _getDatasetValue2 = _getDatasetValue(value57, 'assetIndex', 'data-asset-index'),
    itemIndex2 = Number(_getDatasetValue2);
  if (!assetId3 || !Number.isFinite(itemIndex2)) return null;
  return resolveAssetMentionRef({ assetId: assetId3, itemIndex: itemIndex2 });
}
export function getMentionPlaceholderLabel(value58, value59) {
  const _getMentionType7 = _getMentionType(value58),
    value60 = AT_TYPE_MAP[_getMentionType7] || _getMentionType7 || '素材',
    value61 = Math.max(1, Math.trunc(Number(value59) || 1));
  return '@' + value60 + value61;
}
export function appendAssetMentionToPrompt({
  domNode: domNode = null,
  rawLabel: rawLabel = '',
  promptParts: promptParts = null,
  inputRefs: inputRefs = null,
  mediaCounts: mediaCounts = null,
  allowedTypes: allowedTypes = null,
} = {}) {
  const response4 = getAssetMentionRefFromPillNode(domNode);
  if (!response4) return false;
  const type3 = resolveEffectiveInputKind(response4) || _getMentionType(response4.type);
  if (Array.isArray(allowedTypes) && !allowedTypes.includes(type3)) {
    if (Array.isArray(promptParts)) promptParts.push(' ' + (rawLabel || response4.label) + ' ');
    return true;
  }
  if (type3 === 'text') {
    if (Array.isArray(promptParts)) promptParts.push(' ' + (response4.content || '') + ' ');
    return true;
  }
  if (!response4.url) {
    if (Array.isArray(promptParts)) promptParts.push(' ' + (rawLabel || response4.label) + ' ');
    return true;
  }
  const value62 = mediaCounts || {};
  value62[type3] = Number(value62[type3] || 0) + 1;
  const placeholder = getMentionPlaceholderLabel(type3, value62[type3]);
  if (Array.isArray(promptParts)) promptParts.push(' ' + placeholder + ' ');
  return (
    Array.isArray(inputRefs) && inputRefs.push({ ...response4, type: type3, placeholder: placeholder }),
    true
  );
}
export function appendMentionPillToPrompt(value63, enabled11, { focus: focus = true } = {}) {
  const el14 = value63?.promptEl;
  if (!el14 || !enabled11) return null;
  const _createMentionPillForCandidate2 = _createMentionPillForCandidate(enabled11, value63);
  _bindPromptPill(value63, _createMentionPillForCandidate2);
  const value64 = Boolean(String(el14.textContent || '').trim() || el14.childNodes?.length);
  if (value64) el14.appendChild(document.createTextNode(' '));
  el14.appendChild(_createMentionPillForCandidate2);
  const el15 = document.createTextNode('\xa0');
  el14.appendChild(el15);
  _updatePromptHtml(value63);
  if (focus) {
    const value65 = globalThis.window?.getSelection?.(),
      value66 =
        typeof globalThis.document?.createRange === 'function' ? globalThis.document.createRange() : null;
    value65 &&
      value66 &&
      (value66.setStart(el15, el15.textContent.length),
      value66.collapse(true),
      value65.removeAllRanges(),
      value65.addRange(value66),
      el14.focus?.());
  }
  return _createMentionPillForCandidate2;
}
export function getAssetInputRefsFromPrompt(el16 = null, { allowedTypes: allowedTypes = null } = {}) {
  if (!el16 || typeof el16.querySelectorAll !== 'function') return [];
  const map =
      Array.isArray(allowedTypes) && allowedTypes.length
        ? new Set(allowedTypes.map((item9) => _getMentionType(item9)).filter(Boolean))
        : null,
    list6 = [],
    map2 = new Map();
  return (
    el16.querySelectorAll('.ref-pill').forEach((item10) => {
      if (!_isAssetMentionPill(item10)) return;
      const response5 = getAssetMentionRefFromPillNode(item10);
      if (!response5) return;
      const type4 = resolveEffectiveInputKind(response5) || _getMentionType(response5.type);
      if (!type4 || (map && !map.has(type4))) return;
      if (type4 === 'text') {
        if (!String(response5.content || '').trim()) return;
      } else {
        if (!String(response5.url || '').trim()) return;
      }
      const value67 = response5.assetId + ':' + response5.itemIndex + ':' + type4,
        assetMentionOccurrence = map2.get(value67) || 0;
      (map2.set(value67, assetMentionOccurrence + 1),
        list6.push({
          ...response5,
          type: type4,
          assetMentionOccurrence: assetMentionOccurrence,
          assetRefSource: 'prompt',
        }));
    }),
    list6
  );
}
function _normalizeAllowedMentionTypes(list7 = null) {
  return Array.isArray(list7) && list7.length
    ? new Set(list7.map((item11) => _getMentionType(item11)).filter(Boolean))
    : null;
}
function _appendResolvedAssetInputRefFromRecord(
  list8,
  map3,
  value68,
  {
    allowed: allowed = null,
    assetRefSource: assetRefSource = 'prompt',
    promptAssetRefIndex: promptAssetRefIndex = null,
  } = {},
) {
  const assetId4 = String(value68?.assetId || '').trim(),
    value69 =
      value68?.itemIndex !== undefined && value68?.itemIndex !== null
        ? value68.itemIndex
        : value68?.assetIndex,
    value70 = Number(value69),
    type5 = resolveEffectiveInputKind(value68) || _getMentionType(value68?.type);
  if (!assetId4 || !Number.isFinite(value70) || !type5 || (allowed && !allowed.has(type5))) return false;
  const itemIndex3 = Math.max(0, Math.trunc(value70)),
    response6 = resolveAssetMentionRef({ assetId: assetId4, itemIndex: itemIndex3 });
  if (!response6) return false;
  const effectiveInputKind = resolveEffectiveInputKind(response6) || _getMentionType(response6.type || type5);
  if (!effectiveInputKind || effectiveInputKind !== type5) return false;
  if (type5 === 'text') {
    if (!String(response6.content || '').trim()) return false;
  } else {
    if (!String(response6.url || '').trim()) return false;
  }
  const value71 = assetId4 + ':' + itemIndex3 + ':' + type5,
    assetMentionOccurrence2 = map3.get(value71) || 0;
  map3.set(value71, assetMentionOccurrence2 + 1);
  const value72 = {
    ...response6,
    type: type5,
    assetMentionOccurrence: assetMentionOccurrence2,
    assetRefSource: assetRefSource,
  };
  return (
    Number.isFinite(Number(promptAssetRefIndex)) &&
      (value72.promptAssetRefIndex = Math.max(0, Math.trunc(Number(promptAssetRefIndex)))),
    list8.push(value72),
    true
  );
}
export function getAssetInputRefsFromPromptHtml(value73 = '', { allowedTypes: allowedTypes = null } = {}) {
  const allowed2 = _normalizeAllowedMentionTypes(allowedTypes),
    sanitizePromptHtml2 = sanitizePromptHtml(value73);
  if (!sanitizePromptHtml2) return [];
  const value74 = [],
    value75 = new Map(),
    value76 = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
  let value77 = null;
  while ((value77 = value76.exec(sanitizePromptHtml2))) {
    const value78 = value77[1] || '';
    if (!_htmlClassAttrContains(value78, 'ref-pill')) continue;
    if (_getHtmlAttrValue(value78, 'data-ref-origin') !== 'asset') continue;
    _appendResolvedAssetInputRefFromRecord(
      value74,
      value75,
      {
        assetId: _getHtmlAttrValue(value78, 'data-asset-id'),
        itemIndex: _getHtmlAttrValue(value78, 'data-asset-index'),
        type: _getHtmlAttrValue(value78, 'data-ref-type'),
      },
      { allowed: allowed2, assetRefSource: 'prompt' },
    );
  }
  return value74;
}
export function getPromptAssetInputRefsFromNode(options6 = {}, { allowedTypes: allowedTypes = null } = {}) {
  const allowed3 = _normalizeAllowedMentionTypes(allowedTypes),
    value79 = [],
    value80 = new Map();
  return (
    _getPromptAssetInputRefRecords(options6).forEach((item12, promptAssetRefIndex2) => {
      const _getMentionType8 = _getMentionType(item12.type);
      if (!_getMentionType8 || _getMentionType8 === 'text') return;
      _appendResolvedAssetInputRefFromRecord(value79, value80, item12, {
        allowed: allowed3,
        assetRefSource: 'hidden',
        promptAssetRefIndex: promptAssetRefIndex2,
      });
    }),
    value79
  );
}
export function getAssetInputRefsFromNodeData(options7 = {}, { allowedTypes: allowedTypes = null } = {}) {
  return [
    ...getAssetInputRefsFromPromptHtml(options7?.prompt || '', { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(options7 || {}, { allowedTypes: allowedTypes }),
  ];
}
export function getAssetInputRefsFromPromptAndNode(
  value81 = null,
  { nodeData: nodeData = null, allowedTypes: allowedTypes = null } = {},
) {
  return [
    ...getAssetInputRefsFromPrompt(value81, { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(nodeData || {}, { allowedTypes: allowedTypes }),
  ];
}
export function removeAssetMentionPillFromPrompt(
  value82,
  {
    assetId: assetId = '',
    assetIndex: assetIndex = '',
    itemIndex: itemIndex = '',
    type: type = '',
    occurrence: occurrence = null,
  } = {},
) {
  const el17 = value82?.promptEl;
  if (!el17 || typeof el17.querySelectorAll !== 'function') return false;
  const enabled12 = String(assetId || '').trim(),
    value83 =
      assetIndex !== null && assetIndex !== undefined && String(assetIndex) !== '' ? assetIndex : itemIndex,
    enabled13 = String(value83 ?? '').trim(),
    _getMentionType9 = _getMentionType(type),
    count2 = Number(occurrence),
    enabled14 = Number.isFinite(count2) && count2 >= 0;
  if (!enabled12 || !enabled13) return false;
  const list9 = Array.from(el17.querySelectorAll('.ref-pill'));
  let value84 = 0;
  const el18 = list9.find((item13) => {
    if (!_isAssetMentionPill(item13)) return false;
    const _getDatasetValue3 = _getDatasetValue(item13, 'assetId', 'data-asset-id'),
      _getDatasetValue4 = _getDatasetValue(item13, 'assetIndex', 'data-asset-index'),
      _getMentionType10 = _getMentionType(_getDatasetValue(item13, 'refType', 'data-ref-type')),
      enabled15 =
        _getDatasetValue3 === enabled12 &&
        _getDatasetValue4 === enabled13 &&
        (!_getMentionType9 || _getMentionType10 === _getMentionType9);
    if (!enabled15) return false;
    if (!enabled14) return true;
    const value85 = value84 === count2;
    return ((value84 += 1), value85);
  });
  if (!el18) return false;
  return (el18.remove?.(), _updatePromptHtml(value82), true);
}
export function removePromptAssetInputRefFromNode(
  value86,
  {
    assetId: assetId = '',
    assetIndex: assetIndex = '',
    itemIndex: itemIndex = '',
    type: type = '',
    occurrence: occurrence = null,
  } = {},
) {
  const enabled16 = String(value86?.nodeId || '').trim();
  if (!enabled16) return false;
  const enabled17 = String(assetId || '').trim(),
    value87 =
      assetIndex !== null && assetIndex !== undefined && String(assetIndex) !== '' ? assetIndex : itemIndex,
    value88 = Number(value87),
    _getMentionType11 = _getMentionType(type),
    count3 = Number(occurrence),
    value89 = Number.isFinite(count3) && count3 >= 0;
  if (!enabled17 || !Number.isFinite(value88)) return false;
  const list10 = _getPromptAssetInputRefRecords(_getTargetNodeData(value86));
  let value90 = 0,
    enabled18 = false;
  const value91 = list10.filter((item14) => {
    if (enabled18) return true;
    const enabled19 =
      item14.assetId === enabled17 &&
      item14.itemIndex === Math.max(0, Math.trunc(value88)) &&
      (!_getMentionType11 || item14.type === _getMentionType11);
    if (!enabled19) return true;
    if (value89 && value90 !== count3) return ((value90 += 1), true);
    return ((enabled18 = true), false);
  });
  if (!enabled18) return false;
  return (
    appStore.updateNodeData(enabled16, { [PROMPT_ASSET_INPUT_REFS_FIELD]: value91 }),
    _notifyPromptHtmlUpdated(value86),
    true
  );
}
function _assetInputRefTargetMatches(options8 = {}, value92 = {}) {
  const enabled20 = String(value92?.assetId || '').trim(),
    value93 =
      value92?.itemIndex !== undefined && value92?.itemIndex !== null
        ? value92.itemIndex
        : value92?.assetIndex,
    value94 = Number(value93),
    _getMentionType12 = _getMentionType(value92?.type || value92?.refType || '');
  if (!enabled20 || !Number.isFinite(value94)) return false;
  return (
    String(options8?.assetId || '').trim() === enabled20 &&
    Number(options8?.itemIndex) === Math.max(0, Math.trunc(value94)) &&
    (!_getMentionType12 || _getMentionType(options8?.type) === _getMentionType12)
  );
}
function _removePromptAssetInputRecordFromNodeData(options9 = {}, value95 = {}) {
  const records = _getPromptAssetInputRefRecords(options9);
  if (!records.length) return { removed: false, records: records };
  const value96 = String(value95?.assetRefSource || '').trim();
  if (value96 && value96 !== 'hidden') return { removed: false, records: records };
  const count4 = Number(value95?.promptAssetRefIndex);
  if (Number.isFinite(count4) && count4 >= 0) {
    const value97 = Math.max(0, Math.trunc(count4));
    if (_assetInputRefTargetMatches(records[value97], value95)) {
      const records2 = records.slice();
      return (records2.splice(value97, 1), { removed: true, records: records2 });
    }
  }
  const count5 = Number(value95?.assetMentionOccurrence ?? value95?.occurrence),
    value98 = Number.isFinite(count5) && count5 >= 0;
  let value99 = 0,
    removed = false;
  const records3 = records.filter((item15) => {
    if (removed || !_assetInputRefTargetMatches(item15, value95)) return true;
    if (value98 && value99 !== Math.trunc(count5)) return ((value99 += 1), true);
    return ((removed = true), false);
  });
  return { removed: removed, records: records3 };
}
function _removeAssetMentionPillFromPromptHtml(prompt = '', value100 = {}) {
  const value101 = String(value100?.assetRefSource || '').trim();
  if (value101 && value101 !== 'prompt') return { removed: false, prompt: prompt };
  const prompt2 = sanitizePromptHtml(prompt);
  if (!prompt2) return { removed: false, prompt: prompt2 };
  const count6 = Number(value100?.assetMentionOccurrence ?? value100?.occurrence),
    value102 = Number.isFinite(count6) && count6 >= 0;
  let value103 = 0,
    removed2 = false;
  const value104 = prompt2.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (value105, value106) => {
    if (removed2) return value105;
    if (!_htmlClassAttrContains(value106, 'ref-pill')) return value105;
    if (_getHtmlAttrValue(value106, 'data-ref-origin') !== 'asset') return value105;
    const value107 = {
      assetId: _getHtmlAttrValue(value106, 'data-asset-id'),
      itemIndex: _getHtmlAttrValue(value106, 'data-asset-index'),
      type: _getHtmlAttrValue(value106, 'data-ref-type'),
    };
    if (!_assetInputRefTargetMatches(value107, value100)) return value105;
    if (value102 && value103 !== Math.trunc(count6)) return ((value103 += 1), value105);
    return ((removed2 = true), '');
  });
  return { removed: removed2, prompt: removed2 ? sanitizePromptHtml(value104) : prompt2 };
}
export function buildRemoveAssetInputRefPatchFromNodeData(options10 = {}, value108 = {}) {
  const value109 = {},
    _removePromptAssetInputRecordFromNodeData2 = _removePromptAssetInputRecordFromNodeData(
      options10,
      value108,
    );
  _removePromptAssetInputRecordFromNodeData2.removed &&
    (value109[PROMPT_ASSET_INPUT_REFS_FIELD] = _removePromptAssetInputRecordFromNodeData2.records);
  const _removeAssetMentionPillFromPromptHtml2 = _removeAssetMentionPillFromPromptHtml(
    options10?.prompt || '',
    value108,
  );
  return (
    _removeAssetMentionPillFromPromptHtml2.removed &&
      (value109.prompt = _removeAssetMentionPillFromPromptHtml2.prompt),
    Object.keys(value109).length ? value109 : null
  );
}
export function removeAssetInputRefFromNodeData(value110 = '', value111 = {}) {
  const enabled21 = String(value110 || '').trim();
  if (!enabled21) return false;
  const value112 = appStore.getState?.()?.nodes?.[enabled21] || {},
    removeAssetInputRefPatchFromNodeData = buildRemoveAssetInputRefPatchFromNodeData(value112, value111);
  if (!removeAssetInputRefPatchFromNodeData) return false;
  return (appStore.updateNodeData(enabled21, removeAssetInputRefPatchFromNodeData), true);
}
export function handleRefThumbDeleteClick(value113, event2) {
  const el19 = event2?.target?.closest?.('.ref-thumb-delete');
  if (!el19) return false;
  typeof event2.stopImmediatePropagation === 'function'
    ? event2.stopImmediatePropagation()
    : event2.stopPropagation?.();
  event2.preventDefault?.();
  const assetId5 = el19.closest?.('.ref-thumb-wrap'),
    value114 = assetId5?.dataset?.edgeId || '';
  if (value114) return (appStore.removeEdge(value114), value113?._updateSubmitButtonState?.(), true);
  if (assetId5?.dataset?.refOrigin === 'asset') {
    const value115 = {
        assetId: assetId5.dataset.assetId,
        assetIndex: assetId5.dataset.assetIndex,
        type: assetId5.dataset.refType || assetId5.dataset.kind,
        occurrence: assetId5.dataset.assetOccurrence,
      },
      value116 = String(assetId5.dataset.assetRefSource || '').trim(),
      enabled22 =
        value116 === 'hidden'
          ? removePromptAssetInputRefFromNode(value113, value115)
          : removeAssetMentionPillFromPrompt(value113, value115) ||
            removePromptAssetInputRefFromNode(value113, value115);
    !enabled22 && (value113?._renderRefBar?.(), value113?._updateSubmitButtonState?.());
  }
  return true;
}
function _createInputCountState() {
  return {
    counts: { text: 0, image: 0, video: 0, audio: 0 },
    keysByType: { text: new Set(), image: new Set(), video: new Set(), audio: new Set() },
  };
}
function _cloneInputCountState(value117 = null) {
  const _createInputCountState2 = _createInputCountState();
  return (
    MENTION_TYPE_ORDER.forEach((item16) => {
      ((_createInputCountState2.counts[item16] = Number(value117?.counts?.[item16] || 0)),
        (_createInputCountState2.keysByType[item16] = new Set(value117?.keysByType?.[item16] || [])));
    }),
    _createInputCountState2
  );
}
function _addInputCount(enabled23, value118, value119 = '') {
  const _getMentionType13 = _getMentionType(value118);
  if (!enabled23 || enabled23.counts?.[_getMentionType13] == null) return false;
  const value120 = String(value119 || '').trim(),
    map4 = enabled23.keysByType?.[_getMentionType13];
  if (value120 && map4?.has(value120)) return false;
  if (value120 && map4) map4.add(value120);
  return ((enabled23.counts[_getMentionType13] += 1), true);
}
function _getNodeInputCountKey(value121 = '', value122 = '') {
  const value123 = String(value121 || '').trim(),
    _getMentionType14 = _getMentionType(value122);
  return value123 && _getMentionType14 ? 'node:' + value123 + ':' + _getMentionType14 : '';
}
function _getAssetInputCountKey({
  assetId: assetId = '',
  itemIndex: itemIndex = null,
  assetIndex: assetIndex = null,
  type: type = '',
} = {}) {
  const enabled24 = String(assetId || '').trim(),
    value124 = itemIndex !== null && itemIndex !== undefined ? itemIndex : assetIndex,
    value125 = Number(value124),
    _getMentionType15 = _getMentionType(type);
  if (!enabled24 || !Number.isFinite(value125) || !_getMentionType15) return '';
  return 'asset:' + enabled24 + ':' + Math.max(0, Math.trunc(value125)) + ':' + _getMentionType15;
}
function _getMentionInputCountKey(assetId6 = {}, value126 = '') {
  const type6 = _getMentionType(value126 || assetId6?.type);
  if (assetId6?.origin === 'asset')
    return _getAssetInputCountKey({
      assetId: assetId6.assetId,
      itemIndex: assetId6.itemIndex,
      assetIndex: assetId6.assetIndex,
      type: type6,
    });
  return _getNodeInputCountKey(assetId6?.nodeId || assetId6?.sourceId, type6);
}
function _isMentionAlreadyCounted(value127, value128 = {}, value129 = '') {
  const _getMentionType16 = _getMentionType(value129 || value128?.type),
    _getMentionInputCountKey2 = _getMentionInputCountKey(value128, _getMentionType16);
  return !!(
    _getMentionType16 &&
    _getMentionInputCountKey2 &&
    value127?.keysByType?.[_getMentionType16]?.has(_getMentionInputCountKey2)
  );
}
function _canReuseAlreadyCountedInputForLimit(value130 = '') {
  return _getMentionType(value130) !== 'audio';
}
function _getPromptInputCountState(el20, value131 = null, { nodeData: nodeData = null } = {}) {
  const _createInputCountState3 = _createInputCountState(),
    value132 = appStore.getState(),
    value133 = value132.nodes || {};
  return (
    el20 &&
      typeof el20.querySelectorAll === 'function' &&
      el20.querySelectorAll('.ref-pill').forEach((item17) => {
        if (item17 === value131) return;
        let type7 = '',
          _getAssetInputCountKey2 = '';
        if (_isAssetMentionPill(item17)) {
          const assetId7 = getAssetMentionRefFromPillNode(item17);
          ((type7 = assetId7?.type || _getDatasetValue(item17, 'refType', 'data-ref-type')),
            (_getAssetInputCountKey2 = _getAssetInputCountKey({
              assetId: assetId7?.assetId || _getDatasetValue(item17, 'assetId', 'data-asset-id'),
              itemIndex: assetId7?.itemIndex,
              assetIndex: _getDatasetValue(item17, 'assetIndex', 'data-asset-index'),
              type: type7,
            })));
        } else {
          const _getDatasetValue5 = _getDatasetValue(item17, 'nodeId', 'data-node-id');
          if (_isUnresolvedInputMentionPill(item17)) return;
          ((type7 =
            _getPillMentionType(item17) || _getMentionType(value133?.[_getDatasetValue5]?.type || '')),
            (_getAssetInputCountKey2 = _getNodeInputCountKey(_getDatasetValue5, type7)));
        }
        _addInputCount(_createInputCountState3, type7, _getAssetInputCountKey2);
      }),
    _getPromptAssetInputRefRecords(nodeData || {}).forEach((item18) => {
      _addInputCount(_createInputCountState3, item18.type, _getAssetInputCountKey(item18));
    }),
    _createInputCountState3
  );
}
function _countPromptPillsByType(value134, value135 = null, { nodeData: nodeData = null } = {}) {
  return _getPromptInputCountState(value134, value135, { nodeData: nodeData }).counts;
}
function _candidateMatchesQuery(
  { label: label = '', type: type = '', assetName: assetName = '' },
  value136 = '',
) {
  const _normalizeQuery2 = _normalizeQuery(value136).toLowerCase();
  if (!_normalizeQuery2) return true;
  const value137 = AT_TYPE_MAP[type] || type,
    _getAssetTypeMenuLabel2 = _getAssetTypeMenuLabel(type);
  return [label, value137, _getAssetTypeMenuLabel2, assetName]
    .join(' ')
    .toLowerCase()
    .includes(_normalizeQuery2);
}
export function _resolvePromptTextWithTextRefs({
  promptEl: promptEl = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  assetInputRefs: assetInputRefs = null,
  assetMediaCounts: assetMediaCounts = null,
  allowedAssetTypes: allowedAssetTypes = null,
  prependUnusedTextRefs: prependUnusedTextRefs = true,
} = {}) {
  const list11 = [];
  let value138 = 0;
  for (const value139 of inEdges) {
    const enabled25 = nodes?.[value139?.sourceId];
    if (!enabled25) continue;
    if (_getMentionType(enabled25.type) !== 'text') continue;
    const content = _getTextRefContent(enabled25);
    if (!content) continue;
    ((value138 += 1),
      list11.push({
        label: '@' + AT_TYPE_MAP.text + value138,
        content: content,
        sourceId: String(value139?.sourceId || ''),
        used: false,
      }));
  }
  if (!promptEl && list11.length === 0) return '';
  const value140 = Object.create(null),
    value141 = Object.create(null);
  list11.forEach((item19) => {
    value140[item19.label.replace(/\s+/g, '')] = item19;
    if (item19.sourceId) value141[item19.sourceId] = item19;
  });
  const value142 = globalThis.Node?.TEXT_NODE ?? 3,
    value143 = globalThis.Node?.ELEMENT_NODE ?? 1;
  let value144 = '';
  const run = (value145) => {
    for (const domNode2 of _getChildNodes(value145)) {
      const value146 = Number(domNode2?.nodeType);
      if (value146 === value142) {
        value144 += String(domNode2?.textContent || '');
        continue;
      }
      if (value146 !== value143) continue;
      if (_isRefPillNode(domNode2)) {
        const promptParts2 = [];
        if (
          appendAssetMentionToPrompt({
            domNode: domNode2,
            rawLabel: String(domNode2?.dataset?.label || domNode2?.textContent || '').trim(),
            promptParts: promptParts2,
            inputRefs: assetInputRefs,
            mediaCounts: assetMediaCounts,
            allowedTypes: allowedAssetTypes,
          })
        ) {
          value144 += promptParts2.join('');
          continue;
        }
        const value147 = String(domNode2?.dataset?.nodeId || ''),
          value148 = String(domNode2?.dataset?.label || domNode2?.textContent || '').trim();
        if (_isUnresolvedInputMentionPill(domNode2)) {
          value144 += ' ' + value148 + ' ';
          continue;
        }
        const value149 = value148.replace(/\s+/g, ''),
          value150 = (value147 && value141[value147]) || value140[value149];
        value150
          ? ((value150.used = true), (value144 += ' ' + value150.content + ' '))
          : (value144 += ' ' + value148 + ' ');
        continue;
      }
      if (String(domNode2?.tagName || '').toUpperCase() === 'BR') {
        value144 += '\n';
        continue;
      }
      run(domNode2);
    }
  };
  _getChildNodes(promptEl).length > 0
    ? run(promptEl)
    : (value144 = String(promptEl?.innerText || promptEl?.textContent || ''));
  let _normalizePromptWhitespace2 = _normalizePromptWhitespace(value144);
  (list11.forEach((item20) => {
    if (item20.used) return;
    const regExp2 = new RegExp(_escapeRegExp(item20.label).replace(/\s+/g, '[\\s\\u00A0]*'), 'g');
    regExp2.test(_normalizePromptWhitespace2) &&
      ((item20.used = true),
      (_normalizePromptWhitespace2 = _normalizePromptWhitespace2.replace(
        regExp2,
        ' ' + item20.content + ' ',
      )));
  }),
    (_normalizePromptWhitespace2 = _normalizePromptWhitespace(_normalizePromptWhitespace2)));
  let enabled26 = '';
  prependUnusedTextRefs &&
    list11.forEach((enabled27) => {
      !enabled27.used &&
        enabled27.content &&
        ((enabled26 += enabled27.content + '\n'), (enabled27.used = true));
    });
  if (!enabled26) return _normalizePromptWhitespace2;
  if (!_normalizePromptWhitespace2) return enabled26.replace(/\n+$/g, '');
  return '' + enabled26 + _normalizePromptWhitespace2;
}
export function resolvePromptTextWithTextRefs(options11 = {}) {
  return _resolvePromptTextWithTextRefs(options11);
}
export function resolvePresetPromptTextWithTextRefs({
  template: template = null,
  promptEl: promptEl = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  assetInputRefs: assetInputRefs = null,
  assetMediaCounts: assetMediaCounts = null,
  allowedAssetTypes: allowedAssetTypes = null,
} = {}) {
  const _resolvePromptTextWithTextRefs2 = _resolvePromptTextWithTextRefs({
    promptEl: promptEl,
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: assetInputRefs,
    assetMediaCounts: assetMediaCounts,
    allowedAssetTypes: allowedAssetTypes,
  });
  if (template == null) return _resolvePromptTextWithTextRefs2;
  const innerText = resolvePromptPresetTemplate(template, _resolvePromptTextWithTextRefs2);
  return _resolvePromptTextWithTextRefs({
    promptEl: { innerText: innerText, textContent: innerText, childNodes: [] },
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: assetInputRefs,
    assetMediaCounts: assetMediaCounts,
    allowedAssetTypes: allowedAssetTypes,
    prependUnusedTextRefs: false,
  });
}
function _templateConsumesPresetUserInput(value151 = null) {
  if (value151 == null) return false;
  const value152 = '__PROMPT_PRESET_USER_INPUT_MARKER__';
  return resolvePromptPresetTemplate(value151, value152).includes(value152);
}
function _resolveInsertedPresetPromptText({
  template: template = null,
  promptEl: promptEl = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  allowedAssetTypes: allowedAssetTypes = null,
} = {}) {
  const _resolvePromptTextWithTextRefs3 = _resolvePromptTextWithTextRefs({
      promptEl: promptEl,
      inEdges: inEdges,
      nodes: nodes,
      assetInputRefs: [],
      assetMediaCounts: { image: 0, video: 0, audio: 0 },
      allowedAssetTypes: allowedAssetTypes,
    }),
    promptPresetTemplate = resolvePromptPresetTemplate(template, _resolvePromptTextWithTextRefs3);
  if (!_resolvePromptTextWithTextRefs3 || _templateConsumesPresetUserInput(template))
    return promptPresetTemplate;
  if (!promptPresetTemplate) return _resolvePromptTextWithTextRefs3;
  return _resolvePromptTextWithTextRefs3 + '\n' + promptPresetTemplate;
}
function _notifyPromptHtmlUpdated(value153, value154 = {}) {
  const value155 = value154?.renderRefBar !== false;
  if (typeof value153._handlePromptHtmlUpdated === 'function') {
    value153._handlePromptHtmlUpdated();
    return;
  }
  (value155 && typeof value153._renderRefBar === 'function' && value153._renderRefBar(),
    typeof value153._updateSubmitButtonState === 'function' && value153._updateSubmitButtonState());
}
function _isEmptyPromptHtml(value156 = '') {
  const value157 = String(value156 || '')
    .replace(/<br\b[^>]*\/?>/gi, '')
    .replace(/<\/?(?:div|p|section|article|blockquote)\b[^>]*>/gi, '')
    .replace(/&nbsp;|\u00a0/g, '')
    .trim();
  return value157 === '';
}
function _sanitizePromptHtmlForCommit(value158 = '') {
  const sanitizePromptHtml3 = sanitizePromptHtml(value158);
  return _isEmptyPromptHtml(sanitizePromptHtml3) ? '' : sanitizePromptHtml3;
}
export function sanitizePromptHtmlForCommit(value159 = '') {
  return _sanitizePromptHtmlForCommit(value159);
}
function _clearPromptHtmlCommitTimer(enabled28) {
  if (!enabled28?._promptHtmlCommitTimer) return;
  (clearTimeout(enabled28._promptHtmlCommitTimer), (enabled28._promptHtmlCommitTimer = null));
}
export function schedulePromptHtmlCommit(enabled29, { delayMs: delayMs = PROMPT_HTML_COMMIT_DELAY_MS } = {}) {
  if (!enabled29?.promptEl || !enabled29?.nodeId) return false;
  (_clearPromptHtmlCommitTimer(enabled29),
    (enabled29._hasPendingPromptHtmlCommit = true),
    _pendingPromptHtmlCommitTargets.add(enabled29));
  const value160 = Math.max(0, Number(delayMs) || 0);
  return (
    (enabled29._promptHtmlCommitTimer = setTimeout(() => {
      flushPromptHtmlCommit(enabled29);
    }, value160)),
    true
  );
}
export function cancelPromptHtmlCommit(enabled30) {
  if (!enabled30) return false;
  return (
    _clearPromptHtmlCommitTimer(enabled30),
    (enabled30._hasPendingPromptHtmlCommit = false),
    _pendingPromptHtmlCommitTargets.delete(enabled30),
    true
  );
}
export function flushPromptHtmlCommit(enabled31) {
  if (!enabled31) return false;
  _clearPromptHtmlCommitTimer(enabled31);
  const enabled32 = enabled31._hasPendingPromptHtmlCommit === true;
  ((enabled31._hasPendingPromptHtmlCommit = false), _pendingPromptHtmlCommitTargets.delete(enabled31));
  if (!enabled31?.promptEl || !enabled31?.nodeId) return false;
  const prompt3 = _sanitizePromptHtmlForCommit(enabled31.promptEl.innerHTML),
    enabled33 = appStore.getState?.()?.nodes?.[enabled31.nodeId];
  if (!enabled33) return false;
  const value161 = enabled33.prompt;
  if (!enabled32 && value161 === prompt3) return false;
  if (value161 === prompt3) return false;
  return (appStore.updateNodeData(enabled31.nodeId, { prompt: prompt3 }), true);
}
export function flushAllPendingPromptHtmlCommits() {
  let flushPromptHtmlCommit2 = false;
  return (
    Array.from(_pendingPromptHtmlCommitTargets).forEach((item21) => {
      flushPromptHtmlCommit2 = flushPromptHtmlCommit(item21) || flushPromptHtmlCommit2;
    }),
    flushPromptHtmlCommit2
  );
}
function _updatePromptHtml(enabled34, value162 = {}) {
  if (!enabled34?.promptEl || !enabled34?.nodeId) return;
  (cancelPromptHtmlCommit(enabled34),
    appStore.updateNodeData(enabled34.nodeId, {
      prompt: _sanitizePromptHtmlForCommit(enabled34.promptEl.innerHTML),
    }),
    _notifyPromptHtmlUpdated(enabled34, value162));
}
function _commitPromptAndAssetInputRefs(enabled35, value163) {
  if (!enabled35?.nodeId) return false;
  const value164 = { [PROMPT_ASSET_INPUT_REFS_FIELD]: Array.isArray(value163) ? value163 : [] };
  return (
    enabled35?.promptEl &&
      (cancelPromptHtmlCommit(enabled35),
      (value164.prompt = _sanitizePromptHtmlForCommit(enabled35.promptEl.innerHTML))),
    appStore.updateNodeData(enabled35.nodeId, value164),
    _notifyPromptHtmlUpdated(enabled35),
    true
  );
}
function _getPromptAssetInputRefRecordForMention(assetId8 = {}) {
  if (assetId8?.origin !== 'asset') return null;
  return _normalizePromptAssetInputRefRecord({
    assetId: assetId8.assetId,
    itemIndex: assetId8.assetIndex ?? assetId8.itemIndex,
    type: assetId8.type,
  });
}
function _appendPromptAssetInputRefRecords(value165, value166 = []) {
  const list12 = _getPromptAssetInputRefRecords(_getTargetNodeData(value165)),
    list13 = list12.slice();
  return (
    (Array.isArray(value166) ? value166 : [value166]).forEach((item22) => {
      const _getPromptAssetInputRefRecordForMention3 = _getPromptAssetInputRefRecordForMention(item22);
      if (_getPromptAssetInputRefRecordForMention3) list13.push(_getPromptAssetInputRefRecordForMention3);
    }),
    list13
  );
}
function _shouldStoreMentionAsPromptAssetInput(value167, value168 = {}) {
  const _getMentionType17 = _getMentionType(value168?.type);
  return (
    value168?.origin === 'asset' &&
    _getMentionType17 &&
    _getMentionType17 !== 'text' &&
    isRunningHubWorkflowNode(_getTargetNodeData(value167))
  );
}
function _consumeMentionTriggerText({ triggerRange: triggerRange = null, atIndex: atIndex = -1 } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const value169 = window.getSelection?.(),
    enabled36 = triggerRange || (value169 && value169.rangeCount ? value169.getRangeAt(0) : null);
  if (!enabled36 || enabled36.startContainer.nodeType !== Node.TEXT_NODE) return false;
  const el21 = enabled36.startContainer,
    list14 = String(el21.textContent || ''),
    value170 = enabled36.startOffset,
    count7 = Number.isFinite(atIndex) && atIndex >= 0 ? atIndex : list14.lastIndexOf('@', value170 - 1);
  if (count7 < 0) return false;
  const el22 = el21.parentNode;
  if (!el22) return false;
  const value171 = document.createTextNode(list14.slice(0, count7)),
    value172 = document.createTextNode(list14.slice(value170));
  (el22.replaceChild(value172, el21), el22.insertBefore(value171, value172));
  const value173 = document.createRange();
  return (
    value173.setStartAfter(value171),
    value173.collapse(true),
    value169?.removeAllRanges?.(),
    value169?.addRange?.(value173),
    true
  );
}
function _insertPromptAssetInputRef(
  value174,
  value175,
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  const _appendPromptAssetInputRefRecords2 = _appendPromptAssetInputRefRecords(value174, [value175]);
  if (pillToEdit)
    return (
      pillToEdit.remove?.(),
      _commitPromptAndAssetInputRefs(value174, _appendPromptAssetInputRefRecords2)
    );
  if (!_consumeMentionTriggerText({ triggerRange: triggerRange, atIndex: atIndex })) return false;
  return _commitPromptAndAssetInputRefs(value174, _appendPromptAssetInputRefRecords2);
}
function _escapePromptPreviewHtml(value176) {
  return String(value176 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '<br>');
}
function _moveCaretToPromptEnd(enabled37) {
  if (!enabled37) return;
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof document.createRange !== 'function'
  )
    return;
  try {
    const enabled38 = window.getSelection?.();
    if (!enabled38) return;
    const value177 = document.createRange();
    (value177.selectNodeContents(enabled37),
      value177.collapse(false),
      enabled38.removeAllRanges(),
      enabled38.addRange(value177));
  } catch {}
}
export function shouldUsePromptPreviewForPreset(value178 = null, value179 = {}) {
  return (
    (value179?.insertPrompt === true || globalThis.window?.DEV_MODE === true) &&
    hasPromptPresetTemplateContent(value178)
  );
}
export function previewPresetPromptInEditor({
  storeApi: storeApi = appStore,
  nodeId: nodeId = '',
  promptEl: promptEl = null,
  promptText: promptText = '',
  toastText: toastText = '',
  toastType: toastType = 'warn',
} = {}) {
  const textContent = String(promptText ?? ''),
    prompt4 = sanitizePromptHtml(_escapePromptPreviewHtml(textContent)),
    enabled39 = typeof Element !== 'undefined' && promptEl instanceof Element;
  promptEl && (promptEl.innerHTML = prompt4);
  !enabled39 &&
    promptEl &&
    (('textContent' in promptEl || typeof promptEl.textContent !== 'undefined') &&
      (promptEl.textContent = textContent),
    ('innerText' in promptEl || typeof promptEl.innerText !== 'undefined') &&
      (promptEl.innerText = textContent),
    Array.isArray(promptEl.childNodes) &&
      (promptEl.childNodes = [{ nodeType: globalThis.Node?.TEXT_NODE ?? 3, textContent: textContent }]));
  if (typeof promptEl?.focus === 'function')
    try {
      promptEl.focus();
    } catch {}
  return (
    enabled39 && _moveCaretToPromptEnd(promptEl),
    storeApi?.updateNodeData && nodeId && storeApi.updateNodeData(nodeId, { prompt: prompt4 }),
    toastText && globalThis.window?.showToast?.(toastText, toastType),
    prompt4
  );
}
export function insertPresetPromptIntoEditor({
  storeApi: storeApi = appStore,
  nodeId: nodeId = '',
  promptEl: promptEl = null,
  template: template = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  allowedAssetTypes: allowedAssetTypes = null,
  toastText: toastText = '',
  toastType: toastType = 'success',
} = {}) {
  const promptText2 = _resolveInsertedPresetPromptText({
    template: template,
    promptEl: promptEl,
    inEdges: inEdges,
    nodes: nodes,
    allowedAssetTypes: allowedAssetTypes,
  });
  return previewPresetPromptInEditor({
    storeApi: storeApi,
    nodeId: nodeId,
    promptEl: promptEl,
    promptText: promptText2,
    toastText: toastText,
    toastType: toastType,
  });
}
let _mentionMenuEl = null,
  _mentionMenuState = { activeMenu: null },
  _mentionViewportUnsubscribe = null,
  _mentionOutsideDocClick = null,
  _mentionOutsideDocClickTimer = 0,
  _mentionMenuPositionState = null;
function _isMentionNodeConnected(el23) {
  if (!el23) return false;
  if (el23.isConnected === true) return true;
  if (typeof document === 'undefined') return true;
  return typeof document.body?.contains === 'function' ? document.body.contains(el23) : true;
}
function _clearMentionOutsideDocClick() {
  (_mentionOutsideDocClickTimer &&
    (clearTimeout(_mentionOutsideDocClickTimer), (_mentionOutsideDocClickTimer = 0)),
    _mentionOutsideDocClick &&
      typeof document !== 'undefined' &&
      document.removeEventListener?.('mousedown', _mentionOutsideDocClick),
    (_mentionOutsideDocClick = null));
}
function _cleanupMentionMenuLifecycle() {
  (_clearMentionOutsideDocClick(),
    _mentionViewportUnsubscribe && (_mentionViewportUnsubscribe(), (_mentionViewportUnsubscribe = null)),
    (_mentionMenuPositionState = null));
}
function _resolveMentionMenuPoint(left) {
  if (!left) return null;
  const value180 = 5;
  if (left.triggerRange?.getBoundingClientRect)
    try {
      const left2 = left.triggerRange.getBoundingClientRect();
      if (left2) return { left: left2.left, top: left2.bottom + value180 };
    } catch {}
  if (left.pillToEdit?.getBoundingClientRect && _isMentionNodeConnected(left.pillToEdit)) {
    const left3 = left.pillToEdit.getBoundingClientRect();
    return { left: left3.left, top: left3.bottom + value180 };
  }
  if (Number.isFinite(left.fallbackX) && Number.isFinite(left.fallbackY))
    return { left: left.fallbackX, top: left.fallbackY };
  return null;
}
function _syncOpenMentionSubmenus() {
  const el24 = _mentionMenuPositionState?.menu || _mentionMenuEl;
  if (!el24?.querySelectorAll) return;
  el24.querySelectorAll('.at-mention-submenu-open').forEach((el25) => {
    const value181 = Array.from(el25.children || []).find((el26) =>
      el26.classList?.contains('at-mention-submenu'),
    );
    if (value181) _positionMentionSubmenu(el25, value181);
  });
}
function _positionMentionMenu() {
  const enabled40 = _mentionMenuPositionState,
    el27 = enabled40?.menu;
  if (!enabled40 || !el27 || el27.style.display !== 'flex') return;
  const box = _resolveMentionMenuPoint(enabled40);
  if (!box) {
    _closeMentionMenu();
    return;
  }
  const count8 = Number(globalThis.window?.innerHeight || 0),
    value182 = count8 > 0 && box.top + 180 > count8 ? box.top - 185 : box.top;
  ((el27.style.left = box.left + 'px'), (el27.style.top = value182 + 'px'), _syncOpenMentionSubmenus());
}
function _watchMentionViewport() {
  if (typeof appStore.subscribeSelector !== 'function') return;
  if (_mentionViewportUnsubscribe) _mentionViewportUnsubscribe();
  _mentionViewportUnsubscribe = appStore.subscribeSelector(
    (value183) => value183.viewport,
    () => _positionMentionMenu(),
  );
}
function _bindMentionOutsideDocClick(enabled41) {
  (_clearMentionOutsideDocClick(),
    (_mentionOutsideDocClick = (event3) => {
      !enabled41.contains(event3.target) && _closeMentionMenu();
    }),
    (_mentionOutsideDocClickTimer = setTimeout(() => {
      ((_mentionOutsideDocClickTimer = 0),
        _mentionOutsideDocClick && document.addEventListener?.('mousedown', _mentionOutsideDocClick));
    }, 10)));
}
export function _getMentionMenu() {
  if (!_mentionMenuEl) {
    _mentionMenuEl = document.getElementById('v2-mention-menu');
    if (!_mentionMenuEl)
      ((_mentionMenuEl = document.createElement('div')),
        (_mentionMenuEl.id = 'v2-mention-menu'),
        (_mentionMenuEl.className = 'at-mention-menu'),
        document.body.appendChild(_mentionMenuEl));
    else
      !_mentionMenuEl.classList.contains('at-mention-menu') &&
        _mentionMenuEl.classList.add('at-mention-menu');
  }
  const enabled42 = document.getElementById?.('v2-mention-menu') || null;
  if (enabled42 && enabled42 !== _mentionMenuEl) _mentionMenuEl = enabled42;
  else
    _mentionMenuEl &&
      !enabled42 &&
      typeof document.body?.appendChild === 'function' &&
      document.body.appendChild(_mentionMenuEl);
  return (
    _mentionMenuEl &&
      !_mentionMenuEl.classList.contains('at-mention-menu') &&
      _mentionMenuEl.classList.add('at-mention-menu'),
    _mentionMenuEl
  );
}
export function _closeMentionMenu() {
  _cleanupMentionMenuLifecycle();
  const el28 = _getMentionMenu();
  ((el28.style.display = 'none'), (el28.innerHTML = ''), (_mentionMenuState.activeMenu = null));
}
export function _buildMentionCandidates(value184, value185 = '', value186 = {}) {
  const value187 = value184?.nodeId,
    value188 = appStore.getState(),
    value189 = value188.nodes || {},
    nodeData2 = value189?.[value187] || value184?._data || {},
    targetInputPolicy2 = getTargetInputPolicy(nodeData2),
    list15 = appStore.getIncomingEdges(value187),
    _normalizeQuery3 = _normalizeQuery(value185),
    value190 = { text: 0, image: 0, video: 0, audio: 0 },
    _getPromptInputCountState2 = _getPromptInputCountState(
      value184?.promptEl,
      value186?.excludePill || null,
      {
        nodeData: nodeData2,
      },
    ),
    _cloneInputCountState2 = _cloneInputCountState(_getPromptInputCountState2),
    list16 = [];
  list15.forEach((edgeId) => {
    const enabled43 = value189[edgeId.sourceId];
    if (!enabled43) return;
    const type8 = resolveEffectiveInputKind(enabled43, edgeId);
    if (!type8) return;
    if (!isInputKindAllowed(targetInputPolicy2, type8)) return;
    (_addInputCount(_cloneInputCountState2, type8, _getNodeInputCountKey(edgeId.sourceId, type8)),
      (value190[type8] += 1));
    const list17 = AT_TYPE_MAP[type8] || type8,
      list18 = '' + list17 + value190[type8],
      label2 = list18;
    if (_normalizeQuery3 && !list18.includes(_normalizeQuery3) && !list17.includes(_normalizeQuery3)) return;
    list16.push({
      origin: 'node',
      edgeId: edgeId.id,
      nodeId: edgeId.sourceId,
      type: type8,
      label: label2,
      ..._getMentionVisual(value184, { origin: 'node', nodeId: edgeId.sourceId, type: type8 }),
      limitReason: '',
    });
  });
  const allowedTypes2 = MENTION_TYPE_ORDER.filter((item23) => isInputKindAllowed(targetInputPolicy2, item23));
  return (
    getAssetMentionCandidates({ query: '', allowedTypes: allowedTypes2 }).forEach((assetId9) => {
      const type9 = _getMentionType(assetId9.type);
      if (!type9) return;
      if (!_candidateMatchesQuery(assetId9, value185)) return;
      list16.push({
        origin: 'asset',
        assetId: assetId9.assetId,
        assetIndex: assetId9.itemIndex,
        type: type9,
        label: _stripMentionDisplayMarker(assetId9.insertLabel || assetId9.label || assetId9.name),
        assetName: assetId9.assetName,
        thumbUrl: _getRenderableMentionThumbUrl(assetId9.thumbUrl || '', type9),
        iconType: type9,
        limitReason:
          _getAdvancedVoiceCloneAudioLimitReason(
            value184,
            { origin: 'asset', assetId: assetId9.assetId, assetIndex: assetId9.itemIndex, type: type9 },
            nodeData2,
            value188,
          ) ??
          (_canReuseAlreadyCountedInputForLimit(type9) &&
          _isMentionAlreadyCounted(_cloneInputCountState2, {
            origin: 'asset',
            assetId: assetId9.assetId,
            assetIndex: assetId9.itemIndex,
            type: type9,
          })
            ? ''
            : getInputLimitReason(targetInputPolicy2, type9, _cloneInputCountState2.counts)),
      });
    }),
    list16
  );
}
export function _buildMentionMenuTree(list19 = []) {
  const nodeItems = [],
    map5 = new Map();
  (Array.isArray(list19) ? list19 : []).forEach((assetId10) => {
    if (!assetId10 || typeof assetId10 !== 'object') return;
    if (assetId10.origin !== 'asset') {
      nodeItems.push(assetId10);
      return;
    }
    const type10 = _getMentionType(assetId10.type);
    if (!type10) return;
    const value191 = String(assetId10.assetId || assetId10.assetName || 'asset');
    !map5.has(value191) &&
      map5.set(value191, {
        assetId: assetId10.assetId || '',
        label: assetId10.assetName || nodePromptSharedText('assetFallback'),
        typeMap: new Map(),
        items: [],
      });
    const enabled44 = map5.get(value191);
    (enabled44.items.push(assetId10),
      !enabled44.typeMap.has(type10) &&
        enabled44.typeMap.set(type10, {
          type: type10,
          label: _getAssetTypeMenuLabel(type10),
          items: [],
        }),
      enabled44.typeMap.get(type10).items.push(assetId10));
  });
  const assetItems = Array.from(map5.values())
    .map((assetId11) => ({
      assetId: assetId11.assetId,
      label: assetId11.label,
      items: assetId11.items,
      typeItems: MENTION_TYPE_ORDER.map((item24) => assetId11.typeMap.get(item24)).filter(
        (item25) => item25?.items?.length > 0,
      ),
    }))
    .filter((item26) => item26.items.length > 0);
  return { nodeItems: nodeItems, assetItems: assetItems };
}
function _getPromptInputPillLabel(el29) {
  return _stripMentionDisplayMarker(_getDatasetValue(el29, 'label', 'data-label') || el29?.textContent || '');
}
function _buildInputMentionCandidateIndex(value192) {
  const list20 = _buildMentionCandidates(value192, '').filter((item27) => item27?.origin === 'node'),
    bySourceId = new Map(),
    byLabel = new Map(),
    byLabelAndType = new Map();
  return (
    list20.forEach((item28) => {
      const value193 = String(item28?.nodeId || '').trim(),
        _normalizeMentionLabelKey3 = _normalizeMentionLabelKey(item28?.label || ''),
        _getMentionType18 = _getMentionType(item28?.type);
      if (value193) bySourceId.set(value193, item28);
      if (_normalizeMentionLabelKey3 && !byLabel.has(_normalizeMentionLabelKey3))
        byLabel.set(_normalizeMentionLabelKey3, item28);
      if (_normalizeMentionLabelKey3 && _getMentionType18) {
        const value194 = _getMentionType18 + ':' + _normalizeMentionLabelKey3;
        if (!byLabelAndType.has(value194)) byLabelAndType.set(value194, item28);
      }
    }),
    { bySourceId: bySourceId, byLabel: byLabel, byLabelAndType: byLabelAndType }
  );
}
function _applyInputMentionCandidateToPill(value195, el30, enabled45) {
  if (!_isRefPillNode(el30) || !enabled45) return false;
  const _stripMentionDisplayMarker5 = _stripMentionDisplayMarker(
      enabled45.label || el30.dataset?.label || '',
    ),
    _getMentionType19 = _getMentionType(enabled45.type);
  ((el30.dataset.refOrigin = 'node'),
    (el30.dataset.label = _stripMentionDisplayMarker5),
    (el30.dataset.nodeId = String(enabled45.nodeId || '')));
  if (_getMentionType19) el30.dataset.refType = _getMentionType19;
  return (
    delete el30.dataset.assetId,
    delete el30.dataset.assetIndex,
    el30.removeAttribute?.('data-asset-id'),
    el30.removeAttribute?.('data-asset-index'),
    _clearInputMentionPillUnresolved(el30),
    _renderMentionPillContent(
      el30,
      _stripMentionDisplayMarker5,
      _getMentionVisual(value195, enabled45, el30),
    ),
    true
  );
}
export function resolvePromptInputPillsForTarget(enabled46) {
  if (!enabled46?.promptEl || typeof enabled46.promptEl.querySelectorAll !== 'function')
    return { resolved: 0, unresolved: 0 };
  const _buildInputMentionCandidateIndex2 = _buildInputMentionCandidateIndex(enabled46);
  let resolved = 0,
    unresolved = 0;
  return (
    enabled46.promptEl.querySelectorAll('.ref-pill').forEach((item29) => {
      if (_isAssetMentionPill(item29)) return;
      const label3 = _getPromptInputPillLabel(item29),
        _normalizeMentionLabelKey4 = _normalizeMentionLabelKey(label3),
        type11 = _getPillMentionType(item29),
        _getDatasetValue6 = _getDatasetValue(item29, 'nodeId', 'data-node-id');
      let enabled47 = _getDatasetValue6
        ? _buildInputMentionCandidateIndex2.bySourceId.get(_getDatasetValue6)
        : null;
      !enabled47 &&
        _normalizeMentionLabelKey4 &&
        type11 &&
        (enabled47 =
          _buildInputMentionCandidateIndex2.byLabelAndType.get(type11 + ':' + _normalizeMentionLabelKey4) ||
          null);
      !enabled47 &&
        _normalizeMentionLabelKey4 &&
        (enabled47 = _buildInputMentionCandidateIndex2.byLabel.get(_normalizeMentionLabelKey4) || null);
      if (enabled47 && (!type11 || _getMentionType(enabled47.type) === type11)) {
        if (_applyInputMentionCandidateToPill(enabled46, item29, enabled47)) resolved += 1;
        return;
      }
      if (_setInputMentionPillUnresolved(item29, { label: label3, type: type11 })) unresolved += 1;
    }),
    { resolved: resolved, unresolved: unresolved }
  );
}
function _getClipboardData(value196, value197) {
  const value198 = value196?.clipboardData || globalThis.window?.clipboardData;
  if (typeof value198?.getData !== 'function') return '';
  return String(value198.getData(value197) || '');
}
function _insertPromptHtmlAtSelection(value199) {
  if (typeof document !== 'undefined' && typeof document.execCommand === 'function')
    try {
      if (document.execCommand('insertHTML', false, value199)) return true;
    } catch {}
  return false;
}
function _insertPromptTextAtSelection(value200) {
  if (typeof document !== 'undefined' && typeof document.execCommand === 'function')
    try {
      if (document.execCommand('insertText', false, value200)) return true;
    } catch {}
  return false;
}
export function handlePromptPaste(enabled48, event4) {
  if (!enabled48?.promptEl) return false;
  event4?.preventDefault?.();
  const _getClipboardData2 = _getClipboardData(event4, 'text/html'),
    _getClipboardData3 = _getClipboardData(event4, 'text/plain'),
    sanitizePromptHtml4 = sanitizePromptHtml(_getClipboardData2),
    enabled49 = !!sanitizePromptHtml4 && /class="ref-pill"/i.test(sanitizePromptHtml4);
  if (!enabled49) {
    const _insertPromptTextAtSelection2 = _insertPromptTextAtSelection(_getClipboardData3);
    if (_insertPromptTextAtSelection2) return (_updatePromptHtml(enabled48), true);
    return false;
  }
  const _insertPromptHtmlAtSelection2 = _insertPromptHtmlAtSelection(sanitizePromptHtml4);
  if (!_insertPromptHtmlAtSelection2) {
    const _insertPromptTextAtSelection3 = _insertPromptTextAtSelection(_getClipboardData3);
    if (_insertPromptTextAtSelection3) _updatePromptHtml(enabled48);
    return _insertPromptTextAtSelection3;
  }
  const promptInputPillsForTarget = resolvePromptInputPillsForTarget(enabled48);
  return (
    _rehydratePromptPills(enabled48),
    _syncEdgesOrderFromPills(enabled48),
    _updatePromptHtml(enabled48),
    promptInputPillsForTarget.unresolved > 0 &&
      globalThis.window?.showToast?.('Some @ input refs are not bound in this node.', 'warn'),
    true
  );
}
export function handlePromptSelectAll(enabled50, event5) {
  if (!enabled50?.promptEl) return false;
  const value201 = String(event5?.key || '').toLowerCase(),
    value202 = String(event5?.code || ''),
    enabled51 =
      (event5?.ctrlKey || event5?.metaKey) && !event5?.altKey && (value201 === 'a' || value202 === 'KeyA');
  if (!enabled51) return false;
  const enabled52 = globalThis.window?.getSelection?.(),
    enabled53 =
      typeof document !== 'undefined' && typeof document.createRange === 'function'
        ? document.createRange()
        : null;
  if (!enabled52 || !enabled53) return false;
  return (
    event5.preventDefault?.(),
    event5.stopPropagation?.(),
    enabled53.selectNodeContents(enabled50.promptEl),
    enabled52.removeAllRanges?.(),
    enabled52.addRange?.(enabled53),
    true
  );
}
export function _insertMentionPill(
  enabled54,
  {
    label: label4,
    nodeId: nodeId2,
    triggerRange: triggerRange = null,
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
    candidate: candidate = null,
  } = {},
) {
  if (!enabled54?.promptEl) return false;
  const value203 = candidate || { origin: 'node', label: label4, nodeId: nodeId2, type: '' },
    _getMentionType20 = _getMentionType(value203.type);
  if (_getMentionType20) {
    const value204 = appStore.getState(),
      nodeData3 = value204.nodes?.[enabled54.nodeId] || enabled54?._data || {},
      targetInputPolicy3 = getTargetInputPolicy(nodeData3),
      _getPromptInputCountState3 = _getPromptInputCountState(enabled54.promptEl, pillToEdit || null, {
        nodeData: nodeData3,
      });
    if (value203.origin === 'asset') {
      const value205 = value204.nodes || {};
      appStore.getIncomingEdges(enabled54.nodeId).forEach((item30) => {
        const effectiveInputKind2 = resolveEffectiveInputKind(value205?.[item30?.sourceId], item30);
        _addInputCount(
          _getPromptInputCountState3,
          effectiveInputKind2,
          _getNodeInputCountKey(item30?.sourceId, effectiveInputKind2),
        );
      });
    }
    const _getAdvancedVoiceCloneAudioLimitReason2 =
      _getAdvancedVoiceCloneAudioLimitReason(enabled54, value203, nodeData3, value204) ??
      (_canReuseAlreadyCountedInputForLimit(_getMentionType20) &&
      _isMentionAlreadyCounted(_getPromptInputCountState3, value203, _getMentionType20)
        ? ''
        : getInputLimitReason(targetInputPolicy3, _getMentionType20, _getPromptInputCountState3.counts));
    if (_getAdvancedVoiceCloneAudioLimitReason2)
      return (globalThis.window?.showToast?.(_getAdvancedVoiceCloneAudioLimitReason2, 'warn'), false);
  }
  if (_shouldStoreMentionAsPromptAssetInput(enabled54, value203))
    return _insertPromptAssetInputRef(enabled54, value203, {
      triggerRange: triggerRange,
      atIndex: atIndex,
      pillToEdit: pillToEdit,
    });
  const run2 = (el31) => {
    const _stripMentionDisplayMarker6 = _stripMentionDisplayMarker(value203.label || label4 || '');
    ((el31.dataset.label = _stripMentionDisplayMarker6),
      value203.origin === 'asset'
        ? ((el31.dataset.refOrigin = 'asset'),
          (el31.dataset.assetId = String(value203.assetId || '')),
          (el31.dataset.assetIndex = String(value203.assetIndex ?? '')),
          (el31.dataset.refType = String(_getMentionType20 || value203.type || '')),
          _clearInputMentionPillUnresolved(el31),
          delete el31.dataset.nodeId,
          el31.removeAttribute?.('data-node-id'),
          _renderMentionPillContent(
            el31,
            _stripMentionDisplayMarker6,
            _getMentionVisual(enabled54, value203, el31),
          ))
        : ((el31.dataset.refOrigin = 'node'),
          (el31.dataset.nodeId = String(value203.nodeId || nodeId2 || '')),
          (_getMentionType20 || value203.type) &&
            (el31.dataset.refType = String(_getMentionType20 || value203.type || '')),
          _clearInputMentionPillUnresolved(el31),
          delete el31.dataset.assetId,
          delete el31.dataset.assetIndex,
          el31.removeAttribute?.('data-asset-id'),
          el31.removeAttribute?.('data-asset-index'),
          _renderMentionPillContent(
            el31,
            _stripMentionDisplayMarker6,
            _getMentionVisual(enabled54, value203, el31),
          )));
  };
  if (pillToEdit) return (run2(pillToEdit), _updatePromptHtml(enabled54), true);
  const value206 = window.getSelection(),
    enabled55 = triggerRange || (value206 && value206.rangeCount ? value206.getRangeAt(0) : null);
  if (!enabled55 || enabled55.startContainer.nodeType !== Node.TEXT_NODE) return false;
  const el32 = enabled55.startContainer,
    list21 = String(el32.textContent || ''),
    value207 = enabled55.startOffset,
    count9 = Number.isFinite(atIndex) && atIndex >= 0 ? atIndex : list21.lastIndexOf('@', value207 - 1);
  if (count9 < 0) return false;
  const value208 = list21.slice(0, count9),
    value209 = list21.slice(value207),
    value210 = document.createTextNode(value208),
    el33 = document.createTextNode(value209),
    value211 = document.createElement('span');
  ((value211.className = 'ref-pill'),
    (value211.contentEditable = 'false'),
    run2(value211),
    _bindPromptPill(enabled54, value211),
    el32.parentNode.replaceChild(el33, el32),
    el33.parentNode.insertBefore(value211, el33),
    el33.parentNode.insertBefore(value210, value211));
  const value212 = document.createRange();
  return (
    value212.setStartAfter(value211),
    value212.collapse(true),
    value206.removeAllRanges(),
    value206.addRange(value212),
    _updatePromptHtml(enabled54),
    true
  );
}
function _getDirectMentionItems(el34) {
  return Array.from(el34?.children || []).filter((el35) => el35.classList?.contains('at-mention-item'));
}
function _clearActiveItems(value213) {
  _getDirectMentionItems(value213).forEach((el36) => el36.classList.remove('active'));
}
function _setActiveMentionItem(el37, { focusSubmenu: focusSubmenu = false } = {}) {
  if (!el37) return;
  const enabled56 = el37.parentElement;
  if (!enabled56) return;
  (_clearActiveItems(enabled56),
    el37.classList.add('active'),
    (_mentionMenuState.activeMenu = enabled56),
    el37.classList.contains('at-mention-has-submenu')
      ? _openMentionSubmenu(el37, { focusSubmenu: focusSubmenu })
      : _closeSiblingMentionSubmenus(el37));
}
function _setInitialMentionActiveItem(value214) {
  const _getDirectMentionItems2 =
    _getDirectMentionItems(value214).find((el38) => !el38.classList.contains('at-mention-disabled')) ||
    _getDirectMentionItems(value214)[0];
  if (_getDirectMentionItems2) _setActiveMentionItem(_getDirectMentionItems2);
}
function _closeSiblingMentionSubmenus(value215) {
  const enabled57 = value215?.parentElement;
  if (!enabled57) return;
  _getDirectMentionItems(enabled57).forEach((el39) => {
    if (el39 === value215) return;
    (el39.classList.remove('at-mention-submenu-open'),
      el39
        .querySelectorAll('.at-mention-submenu-open')
        .forEach((el40) => el40.classList.remove('at-mention-submenu-open')));
  });
}
function _positionMentionSubmenu(el41, el42) {
  if (!el41 || !el42 || typeof el41.getBoundingClientRect !== 'function') return;
  const box2 = el41.getBoundingClientRect(),
    count10 = Number(globalThis.window?.innerWidth || 0),
    count11 = Number(globalThis.window?.innerHeight || 0),
    value216 = 6,
    value217 = 12,
    value218 = el42.offsetWidth || 220,
    value219 = el42.offsetHeight || 320;
  let value220 = box2.right + value216;
  count10 > 0 &&
    value220 + value218 + value217 > count10 &&
    (value220 = Math.max(value217, box2.left - value218 - value216));
  let value221 = box2.top;
  (count11 > 0 &&
    value221 + value219 + value217 > count11 &&
    (value221 = Math.max(value217, count11 - value219 - value217)),
    (el42.style.left = Math.round(value220) + 'px'),
    (el42.style.top = Math.round(value221) + 'px'),
    count11 > 0 && (el42.style.maxHeight = Math.max(160, count11 - value217 * 2) + 'px'));
}
function _openMentionSubmenu(el43, { focusSubmenu: focusSubmenu = false } = {}) {
  const enabled58 = Array.from(el43?.children || []).find((el44) =>
    el44.classList?.contains('at-mention-submenu'),
  );
  if (!enabled58) return false;
  return (
    _closeSiblingMentionSubmenus(el43),
    el43.classList.add('at-mention-submenu-open'),
    _positionMentionSubmenu(el43, enabled58),
    focusSubmenu
      ? ((_mentionMenuState.activeMenu = enabled58), _setInitialMentionActiveItem(enabled58))
      : (_mentionMenuState.activeMenu = el43.parentElement || enabled58),
    true
  );
}
function _activateMentionMenuItem(el45) {
  if (!el45) return false;
  if (el45.classList.contains('at-mention-has-submenu'))
    return _openMentionSubmenu(el45, { focusSubmenu: true });
  if (typeof el45._mentionSelect === 'function') return (el45._mentionSelect(), true);
  return false;
}
function _createMentionMenuItem({
  label: label = '',
  title: title = '',
  disabled: disabled = false,
  hasSubmenu: hasSubmenu = false,
  thumbUrl: thumbUrl = '',
  thumbNode: thumbNode = null,
  iconType: iconType = '',
  badges: badges = null,
  onSelect: onSelect = null,
} = {}) {
  const el46 = document.createElement('div');
  ((el46.className =
    'at-mention-item' +
    (disabled ? ' at-mention-disabled disabled' : '') +
    (hasSubmenu ? ' at-mention-has-submenu' : '')),
    (el46.title = title || ''));
  const _getMentionType21 = _getMentionType(iconType);
  if (thumbUrl || thumbNode || _getMentionType21 === 'text' || _getMentionType21 === 'audio') {
    const el47 = document.createElement('span');
    el47.className = 'at-mention-visual';
    if (thumbUrl) {
      const value222 = document.createElement('img');
      ((value222.className = 'at-mention-thumb'),
        (value222.src = thumbUrl),
        (value222.alt = ''),
        (value222.draggable = false),
        el47.appendChild(value222));
    } else {
      const _cloneMentionThumbNode3 = _cloneMentionThumbNode(thumbNode, 'at-mention-thumb', iconType);
      if (_cloneMentionThumbNode3) el47.appendChild(_cloneMentionThumbNode3);
    }
    if (el47.childNodes.length) el46.appendChild(el47);
  }
  const el48 = document.createElement('span');
  ((el48.className = 'at-mention-label'), (el48.textContent = label), el46.appendChild(el48));
  if (Array.isArray(badges) && badges.length > 0) {
    const el49 = document.createElement('span');
    ((el49.className = 'at-mention-badges'),
      badges.slice(0, 4).forEach((item31) => {
        const el50 = document.createElement('span');
        ((el50.className = 'at-mention-badge'),
          (el50.textContent = String(item31 || '')),
          el49.appendChild(el50));
      }),
      el46.appendChild(el49));
  }
  if (hasSubmenu) {
    const el51 = document.createElement('span');
    ((el51.className = 'at-mention-arrow'), (el51.textContent = '>'), el46.appendChild(el51));
  }
  return (
    (el46._mentionSelect = onSelect),
    el46.addEventListener('mouseenter', () => {
      _setActiveMentionItem(el46);
    }),
    el46.addEventListener('mousedown', (event6) => {
      (event6.preventDefault(), event6.stopPropagation(), _activateMentionMenuItem(el46));
    }),
    el46
  );
}
function _appendMentionCandidateItem(
  el52,
  value223,
  label5,
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  const _createMentionMenuItem2 = _createMentionMenuItem({
    label: label5.label,
    title: label5.limitReason || '',
    disabled: !!label5.limitReason,
    thumbUrl: label5.thumbUrl || '',
    thumbNode: label5.thumbNode || null,
    iconType: label5.iconType || label5.type || '',
    onSelect: () => {
      if (label5.limitReason) {
        globalThis.window?.showToast?.(label5.limitReason, 'warn');
        return;
      }
      (_insertMentionPill(value223, {
        label: label5.label,
        nodeId: label5.nodeId,
        candidate: label5,
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      }),
        _closeMentionMenu());
    },
  });
  return (
    label5.assetName &&
      !label5.limitReason &&
      (_createMentionMenuItem2.title = label5.assetName + ' · ' + _getAssetTypeMenuLabel(label5.type)),
    el52.appendChild(_createMentionMenuItem2),
    _createMentionMenuItem2
  );
}
function _getBulkAssetLimitReason(value224, value225 = [], value226 = null) {
  const list22 = (Array.isArray(value225) ? value225 : []).filter((item32) => item32?.origin === 'asset');
  if (!list22.length) return nodePromptSharedText('assetUnavailable');
  const value227 = appStore.getState(),
    nodeData4 = value227.nodes?.[value224?.nodeId] || value224?._data || {},
    targetInputPolicy4 = getTargetInputPolicy(nodeData4);
  if (_isAdvancedVoiceCloneTarget(nodeData4)) {
    const audio2 = _getActualAudioInputKeysForTarget(value224?.nodeId, nodeData4, value227),
      value228 = Number(targetInputPolicy4?.maxByKind?.audio);
    for (const value229 of list22) {
      const _getMentionType22 = _getMentionType(value229.type);
      if (!_getMentionType22) continue;
      if (_getMentionType22 !== 'audio') {
        const inputLimitReason = getInputLimitReason(targetInputPolicy4, _getMentionType22, {});
        if (inputLimitReason) return inputLimitReason;
        continue;
      }
      const _getMentionAudioInputKey3 = _getMentionAudioInputKey(value229);
      if (_getMentionAudioInputKey3 && audio2.has(_getMentionAudioInputKey3)) continue;
      if (Number.isFinite(value228) && audio2.size >= value228)
        return getInputLimitReason(targetInputPolicy4, 'audio', { audio: audio2.size });
      if (_getMentionAudioInputKey3) audio2.add(_getMentionAudioInputKey3);
    }
    return '';
  }
  const _getPromptInputCountState4 = _getPromptInputCountState(value224?.promptEl, value226 || null, {
      nodeData: nodeData4,
    }),
    value230 = value227.nodes || {};
  appStore.getIncomingEdges(value224?.nodeId).forEach((item33) => {
    const effectiveInputKind3 = resolveEffectiveInputKind(value230?.[item33?.sourceId], item33);
    _addInputCount(
      _getPromptInputCountState4,
      effectiveInputKind3,
      _getNodeInputCountKey(item33?.sourceId, effectiveInputKind3),
    );
  });
  for (const value231 of list22) {
    const _getMentionType23 = _getMentionType(value231.type);
    if (!_getMentionType23) continue;
    if (
      _canReuseAlreadyCountedInputForLimit(_getMentionType23) &&
      _isMentionAlreadyCounted(_getPromptInputCountState4, value231, _getMentionType23)
    )
      continue;
    const inputLimitReason2 = getInputLimitReason(
      targetInputPolicy4,
      _getMentionType23,
      _getPromptInputCountState4.counts,
    );
    if (inputLimitReason2) return inputLimitReason2;
    _addInputCount(
      _getPromptInputCountState4,
      _getMentionType23,
      _getMentionInputCountKey(value231, _getMentionType23),
    );
  }
  return '';
}
function _createMentionPillForCandidate(value232, value233 = null) {
  const el53 = document.createElement('span');
  ((el53.className = 'ref-pill'), (el53.contentEditable = 'false'));
  const _getMentionType24 = _getMentionType(value232?.type),
    _stripMentionDisplayMarker7 = _stripMentionDisplayMarker(value232?.label || '');
  el53.dataset.label = _stripMentionDisplayMarker7;
  if (value232?.origin === 'asset')
    return (
      (el53.dataset.refOrigin = 'asset'),
      (el53.dataset.assetId = String(value232.assetId || '')),
      (el53.dataset.assetIndex = String(value232.assetIndex ?? '')),
      (el53.dataset.refType = String(_getMentionType24 || value232.type || '')),
      _renderMentionPillContent(
        el53,
        _stripMentionDisplayMarker7,
        _getMentionVisual(value233, value232, el53),
      ),
      el53
    );
  return (
    (el53.dataset.refOrigin = 'node'),
    (el53.dataset.nodeId = String(value232?.nodeId || '')),
    (_getMentionType24 || value232?.type) &&
      (el53.dataset.refType = String(_getMentionType24 || value232.type || '')),
    _renderMentionPillContent(el53, _stripMentionDisplayMarker7, _getMentionVisual(value233, value232, el53)),
    el53
  );
}
function _insertMentionPills(
  enabled59,
  value234 = [],
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  if (!enabled59?.promptEl) return false;
  const candidate2 = (Array.isArray(value234) ? value234 : []).filter(Boolean);
  if (!candidate2.length) return false;
  if (pillToEdit) return _insertMentionPill(enabled59, { candidate: candidate2[0], pillToEdit: pillToEdit });
  const list23 = candidate2.filter((item34) => _shouldStoreMentionAsPromptAssetInput(enabled59, item34)),
    list24 = candidate2.filter((item35) => !_shouldStoreMentionAsPromptAssetInput(enabled59, item35));
  if (!list24.length) {
    const _appendPromptAssetInputRefRecords3 = _appendPromptAssetInputRefRecords(enabled59, list23);
    if (!_consumeMentionTriggerText({ triggerRange: triggerRange, atIndex: atIndex })) return false;
    return _commitPromptAndAssetInputRefs(enabled59, _appendPromptAssetInputRefRecords3);
  }
  const value235 = window.getSelection(),
    enabled60 = triggerRange || (value235 && value235.rangeCount ? value235.getRangeAt(0) : null);
  if (!enabled60 || enabled60.startContainer.nodeType !== Node.TEXT_NODE) return false;
  const el54 = enabled60.startContainer,
    list25 = String(el54.textContent || ''),
    value236 = enabled60.startOffset,
    count12 = Number.isFinite(atIndex) && atIndex >= 0 ? atIndex : list25.lastIndexOf('@', value236 - 1);
  if (count12 < 0) return false;
  const value237 = document.createTextNode(list25.slice(0, count12)),
    value238 = document.createTextNode(list25.slice(value236)),
    el55 = el54.parentNode;
  if (!el55) return false;
  el55.replaceChild(value238, el54);
  const list26 = [];
  (list24.forEach((item36, count13) => {
    count13 > 0 && el55.insertBefore(document.createTextNode('\xa0'), value238);
    const _createMentionPillForCandidate3 = _createMentionPillForCandidate(item36, enabled59);
    (_bindPromptPill(enabled59, _createMentionPillForCandidate3),
      list26.push(_createMentionPillForCandidate3),
      el55.insertBefore(_createMentionPillForCandidate3, value238));
  }),
    el55.insertBefore(value237, list26[0] || value238));
  const value239 = document.createRange(),
    value240 = list26[list26.length - 1];
  return (
    value239.setStartAfter(value240),
    value239.collapse(true),
    value235.removeAllRanges(),
    value235.addRange(value239),
    list23.length
      ? _commitPromptAndAssetInputRefs(enabled59, _appendPromptAssetInputRefRecords(enabled59, list23))
      : _updatePromptHtml(enabled59),
    true
  );
}
function _appendMentionDivider(el56) {
  const value241 = document.createElement('div');
  return ((value241.className = 'at-mention-divider'), el56.appendChild(value241), value241);
}
function _createMentionSubmenu({ leaf: leaf = false } = {}) {
  const el57 = document.createElement('div');
  return (
    (el57.className =
      'at-mention-menu at-mention-submenu' +
      (leaf ? ' at-mention-leaf-submenu' : ' at-mention-branch-submenu')),
    el57.addEventListener('mouseenter', () => {
      _mentionMenuState.activeMenu = el57;
    }),
    el57
  );
}
export function _populateMentionMenu(
  value242,
  {
    x: x,
    y: y,
    triggerRange: triggerRange = null,
    query: query = '',
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
  } = {},
) {
  const menu = _getMentionMenu();
  _cleanupMentionMenuLifecycle();
  const list27 = _buildMentionCandidates(value242, query, { excludePill: pillToEdit || null }),
    _buildMentionMenuTree2 = _buildMentionMenuTree(list27);
  menu.innerHTML = '';
  if (!list27.length) return (_closeMentionMenu(), false);
  return (
    _buildMentionMenuTree2.nodeItems.forEach((item37) => {
      _appendMentionCandidateItem(menu, value242, item37, {
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      });
    }),
    _buildMentionMenuTree2.nodeItems.length &&
      _buildMentionMenuTree2.assetItems.length &&
      _appendMentionDivider(menu),
    _buildMentionMenuTree2.assetItems.forEach((label6) => {
      const el58 = _createMentionMenuItem({ label: label6.label, hasSubmenu: true }),
        el59 = _createMentionSubmenu(),
        title2 = _getBulkAssetLimitReason(value242, label6.items, pillToEdit),
        _createMentionMenuItem3 = _createMentionMenuItem({
          label: nodePromptSharedText('useEntireAsset'),
          title: title2,
          disabled: !!title2,
          onSelect: () => {
            if (title2) {
              globalThis.window?.showToast?.(title2, 'warn');
              return;
            }
            (_insertMentionPills(value242, label6.items, {
              triggerRange: triggerRange,
              atIndex: atIndex,
              pillToEdit: pillToEdit,
            }),
              _closeMentionMenu());
          },
        });
      (el59.appendChild(_createMentionMenuItem3),
        _appendMentionDivider(el59),
        label6.items.forEach((item38) => {
          _appendMentionCandidateItem(el59, value242, item38, {
            triggerRange: triggerRange,
            atIndex: atIndex,
            pillToEdit: pillToEdit,
          });
        }),
        el58.appendChild(el59),
        menu.appendChild(el58));
    }),
    (menu.style.display = 'flex'),
    (menu.style.pointerEvents = 'auto'),
    (menu.style.bottom = ''),
    (menu.style.marginTop = ''),
    (menu.style.marginBottom = ''),
    (menu.style.transformOrigin = ''),
    (_mentionMenuPositionState = {
      menu: menu,
      triggerRange: triggerRange,
      pillToEdit: pillToEdit,
      fallbackX: Number(x),
      fallbackY: Number(y),
    }),
    _positionMentionMenu(),
    (_mentionMenuState.activeMenu = menu),
    _setInitialMentionActiveItem(menu),
    _watchMentionViewport(),
    _bindMentionOutsideDocClick(menu),
    true
  );
}
export function _checkAtTrigger(value243, value244) {
  if (value244?.inputType === 'insertCompositionText') return false;
  const enabled61 = window.getSelection();
  if (!enabled61.rangeCount) return false;
  const triggerRange2 = enabled61.getRangeAt(0).cloneRange();
  if (triggerRange2.startContainer.nodeType !== Node.TEXT_NODE) return (_closeMentionMenu(), false);
  const list28 = String(triggerRange2.startContainer.textContent || '').slice(0, triggerRange2.startOffset),
    atIndex2 = list28.lastIndexOf('@');
  if (atIndex2 === -1) return (_closeMentionMenu(), false);
  const query2 = list28.slice(atIndex2 + 1);
  if (query2.length > 20) return (_closeMentionMenu(), false);
  const x2 = triggerRange2.getBoundingClientRect();
  return _populateMentionMenu(value243, {
    x: x2.left,
    y: x2.bottom + 5,
    triggerRange: triggerRange2,
    query: query2,
    atIndex: atIndex2,
  });
}
export function _handleMentionMenuKeyboard(event7) {
  const el60 = _getMentionMenu();
  if (el60.style.display !== 'flex') return false;
  const value245 = _mentionMenuState.activeMenu || el60,
    list29 = _getDirectMentionItems(value245);
  if (!list29.length) {
    if (event7.key === 'Escape') return (event7.preventDefault(), _closeMentionMenu(), true);
    return false;
  }
  let count14 = list29.findIndex((el61) => el61.classList.contains('active'));
  if (count14 < 0) count14 = 0;
  if (event7.key === 'ArrowDown')
    return (
      event7.preventDefault(),
      (count14 = count14 < list29.length - 1 ? count14 + 1 : 0),
      _setActiveMentionItem(list29[count14]),
      list29[count14]?.scrollIntoView({ block: 'nearest' }),
      true
    );
  if (event7.key === 'ArrowUp')
    return (
      event7.preventDefault(),
      (count14 = count14 > 0 ? count14 - 1 : list29.length - 1),
      _setActiveMentionItem(list29[count14]),
      list29[count14]?.scrollIntoView({ block: 'nearest' }),
      true
    );
  if (event7.key === 'ArrowRight') {
    event7.preventDefault();
    if (count14 >= 0) _openMentionSubmenu(list29[count14], { focusSubmenu: true });
    return true;
  }
  if (event7.key === 'ArrowLeft') {
    event7.preventDefault();
    if (value245 !== el60 && value245.parentElement) {
      const el62 = value245.parentElement,
        value246 = el62.parentElement || el60;
      (el62.classList.remove('at-mention-submenu-open'),
        _clearActiveItems(value246),
        el62.classList.add('active'),
        (_mentionMenuState.activeMenu = value246));
    }
    return true;
  }
  if (event7.key === 'Enter') {
    event7.preventDefault();
    if (count14 >= 0) _activateMentionMenuItem(list29[count14]);
    return true;
  }
  if (event7.key === 'Escape') return (event7.preventDefault(), _closeMentionMenu(), true);
  return false;
}
export function _bindPromptPill(value247, pillToEdit2) {
  if (!pillToEdit2) return;
  pillToEdit2.querySelectorAll('.pill-del').forEach((el63) => el63.remove());
  const _stripMentionDisplayMarker8 = _stripMentionDisplayMarker(
    String(pillToEdit2.dataset.label || pillToEdit2.textContent || '').replace(/[×✕✖]/g, ''),
  );
  ((pillToEdit2.dataset.label = _stripMentionDisplayMarker8),
    _renderMentionPillContent(
      pillToEdit2,
      _stripMentionDisplayMarker8,
      _getMentionVisual(value247, null, pillToEdit2),
    ),
    _isUnresolvedInputMentionPill(pillToEdit2) &&
      (pillToEdit2.classList?.add?.('ref-pill--unresolved'),
      (pillToEdit2.title = 'Input reference is not bound in this node.')),
    (pillToEdit2.onmousedown = (event8) => {
      (event8.preventDefault(), event8.stopPropagation());
      const x3 = pillToEdit2.getBoundingClientRect();
      _populateMentionMenu(value247, {
        x: x3.left,
        y: x3.bottom + 5,
        pillToEdit: pillToEdit2,
        query: '',
        atIndex: -1,
        triggerRange: null,
      });
    }));
}
export function _rehydratePromptPills(enabled62) {
  if (!enabled62?.promptEl) return;
  enabled62.promptEl.querySelectorAll('.ref-pill').forEach((item39) => {
    _bindPromptPill(enabled62, item39);
  });
}
const CARET_SPACER_TEXT_RE = /^[\u00A0\u200B\u200C\u200D\uFEFF]*$/;
function _isCaretSpacerTextNode(el64) {
  return !!(
    el64 &&
    el64.nodeType === Node.TEXT_NODE &&
    CARET_SPACER_TEXT_RE.test(String(el64.textContent || ''))
  );
}
function _findRefPillNearNode(value248, value249) {
  let value250 = value248 || null;
  while (value250) {
    if (_isRefPillNode(value250)) return value250;
    if (!_isCaretSpacerTextNode(value250)) return null;
    value250 = value249 === 'previous' ? value250.previousSibling : value250.nextSibling;
  }
  return null;
}
function _getSelectedRefPill(value251) {
  const enabled63 = value251?.startContainer,
    value252 = value251?.endContainer;
  if (!enabled63 || enabled63 !== value252 || enabled63.nodeType !== Node.ELEMENT_NODE) return null;
  if (value251.endOffset - value251.startOffset !== 1) return null;
  return _isRefPillNode(enabled63.childNodes?.[value251.startOffset])
    ? enabled63.childNodes[value251.startOffset]
    : null;
}
export function _handlePillKeyboard(enabled64, event9) {
  if (!enabled64?.promptEl) return false;
  if (event9.key !== 'Backspace' && event9.key !== 'Delete') return false;
  const enabled65 = window.getSelection();
  if (!enabled65.rangeCount) return false;
  const enabled66 = enabled65.getRangeAt(0);
  if (!enabled66.collapsed) {
    const el65 = _getSelectedRefPill(enabled66);
    if (!el65) return false;
    return (event9.preventDefault(), el65.remove(), _updatePromptHtml(enabled64), true);
  }
  const el66 = enabled66.startContainer,
    count15 = enabled66.startOffset;
  let el67 = null;
  if (el66.nodeType === Node.TEXT_NODE) {
    const list30 = String(el66.textContent || '');
    if (
      event9.key === 'Backspace' &&
      (count15 === 0 || CARET_SPACER_TEXT_RE.test(list30.slice(0, count15)))
    ) {
      el67 = _findRefPillNearNode(el66.previousSibling, 'previous');
      if (el67 && count15 > 0) el66.textContent = list30.slice(count15);
    } else {
      if (
        event9.key === 'Delete' &&
        (count15 === list30.length || CARET_SPACER_TEXT_RE.test(list30.slice(count15)))
      ) {
        el67 = _findRefPillNearNode(el66.nextSibling, 'next');
        if (el67 && count15 < list30.length) el66.textContent = list30.slice(0, count15);
      }
    }
  } else {
    if (el66.nodeType === Node.ELEMENT_NODE) {
      if (event9.key === 'Backspace' && count15 > 0)
        el67 = _findRefPillNearNode(el66.childNodes[count15 - 1], 'previous');
      else
        event9.key === 'Delete' &&
          count15 < el66.childNodes.length &&
          (el67 = _findRefPillNearNode(el66.childNodes[count15], 'next'));
    }
  }
  if (_isRefPillNode(el67))
    return (event9.preventDefault(), el67.remove(), _updatePromptHtml(enabled64), true);
  return false;
}
export function _handlePillHover(event10, enabled67) {
  const el68 = event10.target.closest('.ref-pill');
  if (!el68 || !enabled67.refBarEl) return;
  const enabled68 = el68.dataset.nodeId;
  if (!enabled68) return;
  const el69 = enabled67.refBarEl.querySelector('.ref-thumb-wrap[data-source-id="' + enabled68 + '"]');
  el69 &&
    (el69.classList.add('highlight'),
    el69.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }));
}
export function _handlePillOut(event11, enabled69) {
  const el70 = event11.target.closest('.ref-pill');
  if (!el70 || !enabled69.refBarEl) return;
  const enabled70 = el70.dataset.nodeId;
  if (!enabled70) return;
  const el71 = enabled69.refBarEl.querySelector('.ref-thumb-wrap[data-source-id="' + enabled70 + '"]');
  el71 && el71.classList.remove('highlight');
}
export function _syncEdgesOrderFromPills(enabled71, { allowReorder: allowReorder = false } = {}) {
  if (!allowReorder) return false;
  if (!enabled71?.promptEl || typeof enabled71.promptEl.querySelectorAll !== 'function') return false;
  const list31 = Array.from(enabled71.promptEl.querySelectorAll('.ref-pill'));
  if (list31.length === 0) return false;
  const list32 = appStore
    .getIncomingEdges(enabled71.nodeId)
    .filter((enabled72) => !enabled72?.isGroupShared && enabled72?.targetId === enabled71.nodeId);
  if (list32.length <= 1) return false;
  const list33 = list31.map((el72) => el72.dataset.nodeId).filter(Boolean);
  if (list33.length === 0) return false;
  const value253 = list32.map((item40) => item40.id),
    enabled73 = {};
  list32.forEach((item41) => {
    if (!enabled73[item41.sourceId]) enabled73[item41.sourceId] = [];
    enabled73[item41.sourceId].push(item41);
  });
  const list34 = [];
  (list33.forEach((item42) => {
    enabled73[item42]?.length > 0 && list34.push(enabled73[item42].shift());
  }),
    Object.values(enabled73).forEach((args) => list34.push(...args)));
  const value254 = list34.map((item43) => item43.id);
  if (JSON.stringify(value253) !== JSON.stringify(value254))
    return ((enabled71._isDraggingSorting = false), appStore.updateEdgesBatch(value253, list34), true);
  return false;
}
export function _syncPillLabels(enabled74, value255) {
  if (!enabled74.promptEl) return;
  const list35 = enabled74.promptEl.querySelectorAll('.ref-pill');
  if (!list35.length) return;
  let value256 = false;
  (list35.forEach((el73) => {
    if (_isAssetMentionPill(el73)) return;
    const enabled75 = el73.dataset.nodeId;
    if (!enabled75) return;
    if (value255[enabled75]) {
      const _stripMentionDisplayMarker9 = _stripMentionDisplayMarker(value255[enabled75]),
        el74 = el73.querySelector?.('.ref-pill-label'),
        value257 = String(el73.dataset.label || el74?.textContent || el73.textContent || '').trim(),
        _getMentionVisual2 = _getMentionVisual(enabled74, null, el73),
        value258 =
          value257 !== _stripMentionDisplayMarker9 ||
          !el73.querySelector?.('.ref-pill-label') ||
          !_isPillVisualCurrent(el73, _getMentionVisual2) ||
          !!el73.querySelector?.('.pill-del');
      value258 &&
        ((el73.dataset.label = _stripMentionDisplayMarker9),
        _renderMentionPillContent(el73, _stripMentionDisplayMarker9, _getMentionVisual2),
        (value256 = true));
    } else (el73.remove(), (value256 = true));
  }),
    value256 && _updatePromptHtml(enabled74, { renderRefBar: false }));
}

function _findLastMentionTriggerIndex(value259, value260) {
  const value261 = Number['isFinite'](value260) ? value260 - 1 : undefined;
  return Math['max'](
    String(value259 || '')['lastIndexOf']('@', value261),
    String(value259 || '')['lastIndexOf']('＠', value261),
  );
}

function _getNodeMentionDisplayLabel(options12 = {}, value262 = '') {
  const value263 = [
    options12?.['name'],
    options12?.['title'],
    options12?.['label'],
    options12?.['displayName'],
  ]
    ['map']((value264) => _stripMentionDisplayMarker(value264))
    ['find'](Boolean);
  return value263 || _stripMentionDisplayMarker(value262);
}

export function resolveTextReferenceContent(value265) {
  const value266 = String(value265?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  if (value266 === 'source-text' || value266 === 'text') {
    const value267 =
      typeof value265?.['content'] === 'string'
        ? value265['content']
        : value265?.['text'] || value265?.['outputText'] || value265?.['prompt'] || value265?.['label'] || '';
    return String(value267)['trim']();
  }
  return String(
    value265?.['outputText'] ||
      value265?.['text'] ||
      value265?.['content'] ||
      value265?.['prompt'] ||
      value265?.['label'] ||
      '',
  )['trim']();
}

function _decorateMentionPill(value268, value269, value270 = null) {
  if (typeof value268?.['decorateMentionPill'] !== 'function') return;
  value268['decorateMentionPill']({ pill: value269, mention: value270 });
}

export function createPromptMediaReferenceState(list36 = []) {
  const value271 = { image: 0, video: 0, audio: 0 },
    value272 = new Map();
  for (const response7 of list36) {
    const promptMentionType = normalizePromptMentionType(response7['type']),
      enabled76 = String(response7['url'] || '')['trim']();
    if (
      !(promptMentionType in value271) ||
      !enabled76 ||
      value272['has'](promptMentionType + ':' + enabled76)
    )
      continue;
    ((value271[promptMentionType] += 1),
      value272['set'](
        promptMentionType + ':' + enabled76,
        getMentionPlaceholderLabel(promptMentionType, value271[promptMentionType]),
      ));
  }
  return { mediaCounts: value271, dedupeState: value272 };
}

function _readPromptHtmlForCommit(value273) {
  const serializeVirtualizedPromptHtml2 = serializeVirtualizedPromptHtml(value273?.['promptEl']),
    value274 =
      serializeVirtualizedPromptHtml2 === null
        ? sanitizePromptHtml(value273?.['promptEl']?.['innerHTML'] || '')
        : serializeVirtualizedPromptHtml2,
    _isEmptyPromptHtml2 = _isEmptyPromptHtml(value274) ? '' : value274;
  return (rememberVirtualizedPromptCommit(value273, _isEmptyPromptHtml2), _isEmptyPromptHtml2);
}

export function bindPromptMentionHost(
  value275,
  {
    enablePaste: enablePaste = true,
    enableSelectAll: enableSelectAll = true,
    ignoreInlineEditor: ignoreInlineEditor = true,
    inlineEditorSelector: inlineEditorSelector = '[data-prompt-pill-inline-editor="true"]',
    rehydrate: rehydrate = true,
    commitHydratedPrompt: commitHydratedPrompt = true,
    closeMenuOnDestroy: closeMenuOnDestroy = true,
  } = {},
) {
  const el75 = value275?.['promptEl'];
  if (!el75?.['addEventListener']) return null;
  const run3 = (value276) =>
      ignoreInlineEditor && Boolean(value276?.['target']?.['closest']?.(inlineEditorSelector)),
    value277 = (value278) => {
      if (run3(value278)) return;
      (schedulePromptHtmlCommit(value275), _checkAtTrigger(value275, value278));
    },
    value279 = () => {
      flushPromptHtmlCommit(value275);
    },
    value280 = (value281) => {
      if (run3(value281)) return;
      if (_handleMentionMenuKeyboard(value281)) return;
      if (enableSelectAll && handlePromptSelectAll(value275, value281)) return;
      _handlePillKeyboard(value275, value281);
    },
    value282 = (value283) => {
      if (run3(value283)) return;
      handlePromptPaste(value275, value283);
    };
  (el75['addEventListener']('input', value277),
    el75['addEventListener']('blur', value279),
    el75['addEventListener']('keydown', value280));
  if (enablePaste) el75['addEventListener']('paste', value282);
  if (rehydrate) _rehydratePromptPills(value275);
  if (
    commitHydratedPrompt &&
    typeof value275['getPromptHtml'] === 'function' &&
    typeof value275['commitPromptHtml'] === 'function'
  ) {
    const _readPromptHtmlForCommit2 = _readPromptHtmlForCommit(value275);
    _readPromptHtmlForCommit2 !== value275['getPromptHtml']() &&
      value275['commitPromptHtml'](_readPromptHtmlForCommit2);
  }
  let value284 = false;
  return {
    destroy() {
      if (value284) return;
      value284 = true;
      if (closeMenuOnDestroy) _closeMentionMenu();
      (flushPromptHtmlCommit(value275),
        el75['removeEventListener']?.('input', value277),
        el75['removeEventListener']?.('blur', value279),
        el75['removeEventListener']?.('keydown', value280));
      if (enablePaste) el75['removeEventListener']?.('paste', value282);
    },
  };
}

function _appendMentionSectionLabel(value285, value286) {
  const value287 = document['createElement']('div');
  return (
    (value287['className'] = 'at-mention-section-label'),
    (value287['textContent'] = String(value286 || '')),
    value285['appendChild'](value287),
    value287
  );
}

function _appendMentionGroupLabel(el76, value288) {
  const value289 = document['createElement']('div');
  return (
    (value289['className'] = 'at-mention-group-label'),
    (value289['textContent'] = String(value288 || '')),
    el76['appendChild'](value289),
    value289
  );
}

function _applyMentionPillPresentation(el77, value290 = {}) {
  if (!el77) return;
  const value291 = String(value290?.['pillKind'] || '')['trim']();
  if (value291) el77['dataset']['promptPillKind'] = value291;
  else delete el77['dataset']['promptPillKind'];
  el77['classList']?.['toggle']?.('story-time-pill', value291 === 'time');
  const value292 = value290?.['missingAsset'] === true;
  el77['classList']?.['toggle']?.('ref-pill--unresolved', value292);
  if (value292) ((el77['dataset']['refUnresolved'] = 'true'), (el77['title'] = '缺少图片素材'));
  else {
    el77['dataset']?.['refUnresolved'] === 'true' &&
      value290?.['origin'] === 'asset' &&
      delete el77['dataset']['refUnresolved'];
    if (el77['title'] === '缺少图片素材') el77['removeAttribute']?.('title');
  }
}

function _populateMentionMenuTree(
  value293,
  value294,
  value295,
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  let value296 = '',
    value297 = '',
    count16 = 0;
  (value295['nodeItems']['forEach']((value298) => {
    const value299 = String(value298['menuGroup'] || '')['trim'](),
      value300 = String(value298['menuSection'] || '')['trim']();
    if (value299 && value299 !== value296) {
      if (count16 > 0) _appendMentionDivider(value293);
      (_appendMentionGroupLabel(value293, value299), (value297 = ''));
    }
    ((value296 = value299),
      value300 && value300 !== value297 && _appendMentionSectionLabel(value293, value300),
      (value297 = value300),
      _appendMentionCandidateItem(value293, value294, value298, {
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      }),
      (count16 += 1));
  }),
    value295['nodeItems']['length'] && value295['assetItems']['length'] && _appendMentionDivider(value293),
    value295['assetItems']['forEach']((enabled77) => {
      const _createMentionMenuItem4 = _createMentionMenuItem({
          label: enabled77['label'],
          subtitle: enabled77['subtitle'],
          hasSubmenu: true,
        }),
        _createMentionSubmenu2 = _createMentionSubmenu();
      if (!enabled77['suppressBulkMention']) {
        const _getBulkAssetLimitReason2 = _getBulkAssetLimitReason(value294, enabled77['items'], pillToEdit),
          _createMentionMenuItem5 = _createMentionMenuItem({
            label: nodePromptSharedText('useEntireAsset'),
            title: _getBulkAssetLimitReason2,
            disabled: !!_getBulkAssetLimitReason2,
            onSelect: () => {
              if (_getBulkAssetLimitReason2) {
                globalThis['window']?.['showToast']?.(_getBulkAssetLimitReason2, 'warn');
                return;
              }
              (_insertMentionPills(value294, enabled77['items'], {
                triggerRange: triggerRange,
                atIndex: atIndex,
                pillToEdit: pillToEdit,
              }),
                _closeMentionMenu());
            },
          });
        (_createMentionSubmenu2['appendChild'](_createMentionMenuItem5),
          _appendMentionDivider(_createMentionSubmenu2));
      }
      (enabled77['items']['forEach']((value301) => {
        _appendMentionCandidateItem(_createMentionSubmenu2, value294, value301, {
          triggerRange: triggerRange,
          atIndex: atIndex,
          pillToEdit: pillToEdit,
        });
      }),
        _createMentionMenuItem4['appendChild'](_createMentionSubmenu2),
        value293['appendChild'](_createMentionMenuItem4));
    }));
}

function _getMentionMenuPages(value302, value303 = []) {
  const list37 =
    typeof value302?.['getMentionMenuPages'] === 'function'
      ? value302['getMentionMenuPages']({ candidates: value303 })
      : [];
  if (!Array['isArray'](list37) || list37['length'] < 2) return [];
  const value304 = new Set();
  return list37['map']((value305) => ({
    id: String(value305?.['id'] || '')['trim'](),
    label: String(value305?.['label'] || '')['trim'](),
    icon: ['assets', 'tools']['includes'](String(value305?.['icon'] || '')['trim']())
      ? String(value305['icon'])['trim']()
      : '',
  }))['filter']((enabled78) => {
    if (!enabled78['id'] || !enabled78['label'] || value304['has'](enabled78['id'])) return false;
    return (value304['add'](enabled78['id']), true);
  });
}

function _createMentionMenuPageIcon(value306) {
  const enabled79 = String(value306 || '')['trim']();
  if (!enabled79) return null;
  const value307 = document['createElement']('span');
  return (
    (value307['className'] = 'at-mention-tab-icon'),
    (value307['dataset']['icon'] = enabled79),
    value307['setAttribute']('aria-hidden', 'true'),
    (value307['innerHTML'] =
      enabled79 === 'tools'
        ? '<svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5l-7.7 7.7a2 2 0 1 0 2.8 2.8z"/><path d="m16 15 4.5 4.5"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none"><path d="M4 6.5h6l1.7 2H20v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 9h16"/></svg>'),
    value307
  );
}

function _appendMentionMenuPages(value308, value309, value310, value311) {
  const _getMentionMenuPages2 = _getMentionMenuPages(value309, value310);
  if (_getMentionMenuPages2['length'] < 2) return null;
  const value312 = document['createElement']('div');
  ((value312['className'] = 'at-mention-tabs'),
    value312['setAttribute']('role', 'tablist'),
    value312['setAttribute']('aria-label', '@ 功能分类'),
    value308['appendChild'](value312));
  const value313 = document['createElement']('div');
  value313['className'] = 'at-mention-pages';
  const value314 = document['createElement']('div');
  ((value314['className'] = 'at-mention-pages-track'),
    (value314['style']['width'] = _getMentionMenuPages2['length'] * 100 + '%'),
    (value314['style']['gridTemplateColumns'] =
      'repeat(' + _getMentionMenuPages2['length'] + ', minmax(0, 1fr))'),
    value313['appendChild'](value314),
    value308['appendChild'](value313));
  const value315 = String(
      value309?.['getMentionMenuDefaultPage']?.({ candidates: value310 }) || _getMentionMenuPages2[0]['id'],
    )['trim'](),
    value316 = _getMentionMenuPages2['map']((args2) => {
      const list38 = value310['filter'](
          (value317) =>
            String(value317?.['menuPage'] || _getMentionMenuPages2[0]['id'])['trim']() === args2['id'],
        ),
        el78 = document['createElement']('button');
      ((el78['type'] = 'button'), (el78['className'] = 'at-mention-tab'));
      const _createMentionMenuPageIcon2 = _createMentionMenuPageIcon(args2['icon']);
      if (_createMentionMenuPageIcon2) el78['appendChild'](_createMentionMenuPageIcon2);
      const value318 = document['createElement']('span');
      ((value318['className'] = 'at-mention-tab-label'),
        (value318['textContent'] = args2['label']),
        el78['appendChild'](value318),
        (el78['dataset']['mentionPage'] = args2['id']),
        el78['setAttribute']('role', 'tab'));
      const el79 = document['createElement']('div');
      ((el79['className'] = 'at-mention-page'),
        (el79['dataset']['mentionPagePanel'] = args2['id']),
        el79['setAttribute']('role', 'tabpanel'));
      if (list38['length']) _populateMentionMenuTree(el79, value309, _buildMentionMenuTree(list38), value311);
      else {
        const value319 = document['createElement']('div');
        ((value319['className'] = 'at-mention-empty'),
          (value319['textContent'] = '没有匹配的内容'),
          el79['appendChild'](value319));
      }
      return (
        value312['appendChild'](el78),
        value314['appendChild'](el79),
        { ...args2, button: el78, panel: el79, hasCandidates: list38['length'] > 0 }
      );
    }),
    value320 = value316['find']((value321) => value321['id'] === value315);
  let enabled80 = value320?.['hasCandidates'] ? value320 : null;
  if (!enabled80) enabled80 = value316['find']((value322) => value322['hasCandidates']);
  if (!enabled80) enabled80 = value320 || value316[0];
  const run4 = (enabled81, { keyboard: keyboard = false } = {}) => {
    if (!enabled81) return;
    const value323 = value316['indexOf'](enabled81);
    (value316['forEach']((event12) => {
      const enabled82 = event12 === enabled81;
      (event12['button']['classList']['toggle']('is-active', enabled82),
        event12['button']['setAttribute']('aria-selected', String(enabled82)),
        (event12['button']['tabIndex'] = enabled82 ? 0 : -1),
        event12['panel']['classList']['toggle']('is-active', enabled82),
        event12['panel']['setAttribute']('aria-hidden', String(!enabled82)),
        (event12['panel']['inert'] = !enabled82));
    }),
      (value314['style']['transform'] = 'translateX(' + -value323 * (100 / value316['length']) + '%)'),
      (_mentionMenuState['activeMenu'] = enabled81['panel']),
      _setInitialMentionActiveItem(enabled81['panel'], { keyboard: keyboard }),
      _positionMentionMenu());
  };
  return (
    value316['forEach']((value324) => {
      value324['button']['addEventListener']('mousedown', (event13) => {
        (event13['preventDefault'](), event13['stopPropagation'](), run4(value324));
      });
    }),
    run4(enabled80),
    enabled80?.['panel'] || null
  );
}
