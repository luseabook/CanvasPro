import { normalizePromptMentionType } from './promptAssetInputRefs.js';
import { rememberVirtualizedPromptCommit, serializeVirtualizedPromptHtml } from './promptPasteVirtualization.js';
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
function nodePromptSharedText(_0x232edc, _0x213deb = {}) {
  return t('nodePromptShared.' + _0x232edc, _0x213deb);
}
const AT_TYPE_MAP = { text: '文本', image: '图片', video: '视频', audio: '音频' },
  MENTION_TYPE_ORDER = ['text', 'image', 'video', 'audio'],
  ASSET_TYPE_MENU_LABELS = { text: 'text', image: 'image', video: 'video', audio: 'audio' };
export const PROMPT_ASSET_INPUT_REFS_FIELD = 'promptAssetInputRefs';
const PROMPT_INPUT_REF_UNRESOLVED_ATTR = 'data-ref-unresolved',
  PROMPT_INPUT_REF_LABEL_ATTR = 'data-ref-label',
  PROMPT_HTML_COMMIT_DELAY_MS = 0x140,
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
function _getMentionType(_0x2c0694) {
  return normalizeInputKind(AT_TYPE_CANDIDATE_MAP[String(_0x2c0694 || '').trim()] || _0x2c0694);
}
function _normalizeQuery(_0xbaffc3) {
  return String(_0xbaffc3 || '')
    .trim()
    .replace(/^@+/, '');
}
function _stripMentionDisplayMarker(_0xdab4d7) {
  return String(_0xdab4d7 || '')
    .trim()
    .replace(/^@+/, '')
    .trim();
}
function _formatMentionSubmitLabel(_0x14f0c1) {
  const _0x423c36 = _stripMentionDisplayMarker(_0x14f0c1);
  return _0x423c36 ? '@' + _0x423c36 : '';
}
function _normalizePromptWhitespace(_0x4891bd) {
  return String(_0x4891bd || '')
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, ' ')
    .trim();
}
export function normalizePromptEnterBehavior(_0x59deab) {
  return _0x59deab === 'newline' ? 'newline' : 'submit';
}
function getPromptEnterBehaviorFromStore() {
  try {
    const _0x14501e = appStore.getStateRaw?.() || appStore.getState?.() || {};
    return normalizePromptEnterBehavior(_0x14501e?.ui?.promptEnterBehavior);
  } catch {
    return 'submit';
  }
}
export function shouldSubmitPromptByKeyboard(_0x322423, _0x3badb4 = {}) {
  if (!_0x322423 || _0x322423.key !== 'Enter' || _0x322423.isComposing === true) return false;
  const _0x4d9f29 = Object.prototype.hasOwnProperty.call(_0x3badb4, 'behavior')
      ? _0x3badb4.behavior
      : getPromptEnterBehaviorFromStore(),
    _0x561096 = normalizePromptEnterBehavior(_0x4d9f29);
  if (_0x561096 === 'newline') return _0x322423.ctrlKey === true || _0x322423.metaKey === true;
  return _0x322423.shiftKey !== true;
}
function _getAssetTypeMenuLabel(_0xc96a68) {
  const _0x1a788b = ASSET_TYPE_MENU_LABELS[_0xc96a68];
  if (_0x1a788b) return nodePromptSharedText('assetTypes.' + _0x1a788b);
  return _0xc96a68 || nodePromptSharedText('materialFallback');
}
function _escapeRegExp(_0x34e673) {
  return String(_0x34e673 || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function _getTextRefContent(_0x2d1dd6) {
  return String(
    _0x2d1dd6?.outputText ||
      _0x2d1dd6?.text ||
      _0x2d1dd6?.content ||
      _0x2d1dd6?.prompt ||
      _0x2d1dd6?.label ||
      '',
  ).trim();
}
function _getChildNodes(_0x23d6fa) {
  if (!_0x23d6fa?.childNodes) return [];
  return Array.from(_0x23d6fa.childNodes);
}
function _isRefPillNode(_0x3f9b48) {
  if (!_0x3f9b48) return false;
  if (typeof _0x3f9b48.classList?.contains === 'function') return _0x3f9b48.classList.contains('ref-pill');
  return String(_0x3f9b48.className || '')
    .split(/\s+/)
    .filter(Boolean)
    .includes('ref-pill');
}
function _getDatasetValue(_0x231bd9, _0x2c592c, _0x2bccc3 = '') {
  const _0xc6d1aa = String(_0x231bd9?.dataset?.[_0x2c592c] || '').trim();
  if (_0xc6d1aa) return _0xc6d1aa;
  if (_0x2bccc3 && typeof _0x231bd9?.getAttribute === 'function')
    return String(_0x231bd9.getAttribute(_0x2bccc3) || '').trim();
  return '';
}
function _decodeHtmlAttrValue(_0x187dbf) {
  return String(_0x187dbf || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
function _getHtmlAttrValue(_0x55441e = '', _0x333cfe = '') {
  const _0x3886ef = String(_0x333cfe || '').trim();
  if (!_0x3886ef) return '';
  const _0x38dfea = new RegExp(
      _escapeRegExp(_0x3886ef) + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))',
      'i',
    ),
    _0x47e118 = String(_0x55441e || '').match(_0x38dfea);
  if (!_0x47e118) return '';
  return _decodeHtmlAttrValue(_0x47e118[1] ?? _0x47e118[2] ?? _0x47e118[3] ?? '').trim();
}
function _htmlClassAttrContains(_0x239417 = '', _0xf4db53 = '') {
  const _0x28563f = _getHtmlAttrValue(_0x239417, 'class');
  return _0x28563f.split(/\s+/).filter(Boolean).includes(_0xf4db53);
}
function _isAssetMentionPill(_0x393e07) {
  return _getDatasetValue(_0x393e07, 'refOrigin', 'data-ref-origin') === 'asset';
}
function _isUnresolvedInputMentionPill(_0x58c18d) {
  return (
    !_isAssetMentionPill(_0x58c18d) &&
    _getDatasetValue(_0x58c18d, 'refUnresolved', PROMPT_INPUT_REF_UNRESOLVED_ATTR) === 'true'
  );
}
function _normalizeMentionLabelKey(_0xba2b5b) {
  return _stripMentionDisplayMarker(_0xba2b5b).replace(/[\s\u00A0]+/g, '');
}
function _inferMentionTypeFromLabel(_0x41a0cc = '') {
  const _0x15067b = _normalizeMentionLabelKey(_0x41a0cc);
  if (!_0x15067b) return '';
  for (const _0x2645d1 of MENTION_TYPE_ORDER) {
    const _0x24a36e = String(AT_TYPE_MAP[_0x2645d1] || '').trim();
    if (_0x24a36e && _0x15067b.startsWith(_0x24a36e)) return _0x2645d1;
  }
  return '';
}
function _getPillMentionType(_0x1e8707) {
  return (
    _getMentionType(_getDatasetValue(_0x1e8707, 'refType', 'data-ref-type')) ||
    _inferMentionTypeFromLabel(
      _getDatasetValue(_0x1e8707, 'label', 'data-label') || _0x1e8707?.textContent || '',
    )
  );
}
function _getPromptInputDisplayLabel(_0x4d0540) {
  return _stripMentionDisplayMarker(
    _getDatasetValue(_0x4d0540, 'label', 'data-label') || _0x4d0540?.textContent || '',
  );
}
function _getPromptInputRefLabel(_0x9e6d9a, _0x274d1e = '') {
  return _stripMentionDisplayMarker(
    _getDatasetValue(_0x9e6d9a, 'refLabel', PROMPT_INPUT_REF_LABEL_ATTR) || _0x274d1e,
  );
}
export function getPromptInputSubmitLabelFromPillNode(_0x2c4722, _0x174f70 = '') {
  if (_isAssetMentionPill(_0x2c4722))
    return String(
      _getDatasetValue(_0x2c4722, 'label', 'data-label') || _0x2c4722?.textContent || _0x174f70 || '',
    ).trim();
  return _formatMentionSubmitLabel(
    _getPromptInputRefLabel(_0x2c4722, _0x174f70) ||
      _getPromptInputDisplayLabel(_0x2c4722) ||
      _0x174f70,
  );
}
function _setInputMentionPillUnresolved(_0x3597cc, { label: label = '', type: type = '' } = {}) {
  if (!_isRefPillNode(_0x3597cc) || _isAssetMentionPill(_0x3597cc)) return false;
  const _0x176297 = _stripMentionDisplayMarker(
      label || _0x3597cc?.dataset?.label || _0x3597cc?.textContent || '',
    ),
    _0x247c53 = _getPromptInputRefLabel(_0x3597cc, _0x176297),
    _0x2db370 = _getMentionType(type) || _getPillMentionType(_0x3597cc);
  ((_0x3597cc.dataset.label = _0x176297),
    (_0x3597cc.dataset.refOrigin = 'node'),
    (_0x3597cc.dataset.refUnresolved = 'true'));
  if (_0x247c53) _0x3597cc.dataset.refLabel = _0x247c53;
  if (_0x2db370) _0x3597cc.dataset.refType = _0x2db370;
  return (
    delete _0x3597cc.dataset.nodeId,
    _0x3597cc.removeAttribute?.('data-node-id'),
    _0x3597cc.classList?.add?.('ref-pill--unresolved'),
    (_0x3597cc.title = 'Input reference is not bound in this node.'),
    _renderMentionPillContent(_0x3597cc, _0x176297, _getMentionVisual(null, null, _0x3597cc)),
    true
  );
}
function _clearInputMentionPillUnresolved(_0x446485) {
  if (!_isRefPillNode(_0x446485)) return false;
  (delete _0x446485.dataset.refUnresolved,
    _0x446485.removeAttribute?.(PROMPT_INPUT_REF_UNRESOLVED_ATTR),
    _0x446485.classList?.remove?.('ref-pill--unresolved'));
  if (_0x446485.title === 'Input reference is not bound in this node.') {
    _0x446485.removeAttribute?.('title');
    if ('title' in _0x446485) _0x446485.title = '';
  }
  return true;
}
function _getTargetNodeData(_0x4b1862 = null) {
  const _0x3bc6e3 = String(_0x4b1862?.nodeId || '').trim(),
    _0x9db107 = _0x3bc6e3 ? appStore.getState?.()?.nodes?.[_0x3bc6e3] : null;
  return _0x9db107 || _0x4b1862?._data || {};
}
function _isAdvancedVoiceCloneTarget(_0x5dec81 = {}) {
  if (String(_0x5dec81?.type || '').trim() !== 'ai-audio') return false;
  return [_0x5dec81.audioWorkflowKey, _0x5dec81.model, _0x5dec81.audioWorkflowLabel].some(
    (_0x35a78d) => String(_0x35a78d || '').trim() === ADVANCED_VOICE_CLONE_WORKFLOW_KEY,
  );
}
function _getMentionAudioInputKey(_0x354219 = {}) {
  if (_getMentionType(_0x354219?.type) !== 'audio') return '';
  if (_0x354219?.origin === 'asset') {
    const _0x102e69 = _getPromptAssetInputRefRecordForMention(_0x354219);
    return _0x102e69 ? 'asset:' + _0x102e69.assetId + ':' + _0x102e69.itemIndex : '';
  }
  const _0x25cc44 = String(_0x354219?.nodeId || _0x354219?.sourceId || '').trim();
  return _0x25cc44 ? 'node:' + _0x25cc44 : '';
}
function _getActualAudioInputKeysForTarget(_0x4292ba = '', _0x48b1c7 = {}, _0x17101c = null) {
  const _0x569a2f = new Set(),
    _0x29e954 = _0x17101c || appStore.getState(),
    _0x34890d = _0x29e954.nodes || {};
  return (
    appStore.getIncomingEdges(_0x4292ba).forEach((_0x274445) => {
      const _0x38927a = _0x34890d?.[_0x274445?.sourceId];
      resolveEffectiveInputKind(_0x38927a, _0x274445) === 'audio' &&
        _0x274445?.sourceId &&
        _0x569a2f.add('node:' + _0x274445.sourceId);
    }),
    _getPromptAssetInputRefRecords(_0x48b1c7 || {}).forEach((_0x2e8e84) => {
      _0x2e8e84.type === 'audio' && _0x569a2f.add('asset:' + _0x2e8e84.assetId + ':' + _0x2e8e84.itemIndex);
    }),
    _0x569a2f
  );
}
function _getAdvancedVoiceCloneAudioLimitReason(_0x1b286d, _0x11cf3f = {}, _0x27599b = {}, _0xabc946 = null) {
  if (!_isAdvancedVoiceCloneTarget(_0x27599b)) return null;
  if (_getMentionType(_0x11cf3f?.type) !== 'audio') return null;
  const _0x54378e = getTargetInputPolicy(_0x27599b),
    _0x59082e = Number(_0x54378e?.maxByKind?.audio);
  if (!Number.isFinite(_0x59082e) || _0x59082e <= 0) return null;
  const _0x52097e = _getActualAudioInputKeysForTarget(_0x1b286d?.nodeId, _0x27599b, _0xabc946),
    _0x5be934 = _getMentionAudioInputKey(_0x11cf3f);
  if (_0x5be934 && _0x52097e.has(_0x5be934)) return '';
  return _0x52097e.size >= _0x59082e
    ? getInputLimitReason(_0x54378e, 'audio', { audio: _0x52097e.size })
    : '';
}
export function isRunningHubWorkflowNode(_0x1d5194 = {}) {
  const _0x31db3f = normalizeProviderId(_0x1d5194?.provider);
  if (_0x31db3f === 'runninghubwf') return true;
  const _0x4d0271 = String(_0x1d5194?.model || '').trim();
  if (!_0x4d0271) return false;
  const _0x376171 =
      resolveModelExecution(_0x4d0271, { providerHint: _0x31db3f }) || resolveModelExecution(_0x4d0271),
    _0x227c63 = normalizeProviderId(_0x376171?.modelManifest?.provider),
    _0xb8da9d = normalizeProviderId(_0x376171?.executionManifest?.provider);
  return (
    _0x376171?.executionManifest?.adapterType === 'workflow' &&
    (_0x227c63 === 'runninghubwf' || _0xb8da9d === 'runninghubwf')
  );
}
function _normalizePromptAssetInputRefRecord(_0x735ed2 = {}) {
  if (!_0x735ed2 || typeof _0x735ed2 !== 'object') return null;
  const _0x5705fd = String(_0x735ed2.assetId || '').trim(),
    _0x3665ba =
      _0x735ed2.itemIndex !== undefined && _0x735ed2.itemIndex !== null
        ? _0x735ed2.itemIndex
        : _0x735ed2.assetIndex,
    _0x1b2434 = Number(_0x3665ba),
    _0x27e05c = _getMentionType(_0x735ed2.type);
  if (!_0x5705fd || !Number.isFinite(_0x1b2434) || !_0x27e05c || _0x27e05c === 'text') return null;
  return { assetId: _0x5705fd, itemIndex: Math.max(0, Math.trunc(_0x1b2434)), type: _0x27e05c };
}
function _getPromptAssetInputRefRecords(_0x675a66 = {}) {
  const _0x4fba20 = _0x675a66?.[PROMPT_ASSET_INPUT_REFS_FIELD];
  if (!Array.isArray(_0x4fba20)) return [];
  return _0x4fba20.map((_0x22efe6) => _normalizePromptAssetInputRefRecord(_0x22efe6)).filter(Boolean);
}
function _toLocalPathUrl(_0x4a2245) {
  return localPathToUrl(_0x4a2245);
}
function _isLikelyImageUrl(_0x164034) {
  const _0x42b507 = String(_0x164034 || '')
    .trim()
    .toLowerCase();
  if (!_0x42b507) return false;
  if (_0x42b507.startsWith('data:image/') || _0x42b507.startsWith('blob:')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(_0x42b507);
}
function _firstNonEmpty(_0x31f991 = []) {
  return _0x31f991.map((_0x4b731f) => String(_0x4b731f || '').trim()).find(Boolean) || '';
}
function _pickIndexedItem(_0x151b53, _0x150172) {
  if (!Array.isArray(_0x151b53) || _0x151b53.length === 0) return null;
  const _0x3e9e67 = Number.isFinite(Number(_0x150172)) ? Math.max(0, Math.trunc(Number(_0x150172))) : 0;
  return _0x151b53[_0x3e9e67] || _0x151b53[0] || null;
}
function _resolveNodeThumbUrl(_0x37d643 = {}, _0xbd8b2b = '') {
  const _0x1ba437 = _getMentionType(_0xbd8b2b || _0x37d643?.type);
  if (_0x1ba437 === 'text' || _0x1ba437 === 'audio') return '';
  if (_0x1ba437 === 'image') {
    const _0x1c0fa7 = _pickIndexedItem(_0x37d643.images || _0x37d643.outputImages, _0x37d643.mainImageIndex);
    return _firstNonEmpty([
      _0x1c0fa7?.thumbUrl,
      _0x1c0fa7?.src,
      _0x1c0fa7?.imageUrl,
      _0x1c0fa7?.sourceUrl,
      _0x1c0fa7?.url,
      _toLocalPathUrl(_0x1c0fa7?.localPath),
      _0x37d643.thumbUrl,
      _0x37d643.src,
      _0x37d643.imageUrl,
      _0x37d643.sourceUrl,
      _0x37d643.url,
      _toLocalPathUrl(_0x37d643.localPath),
    ]);
  }
  if (_0x1ba437 === 'video') {
    const _0x4109d2 = _pickIndexedItem(_0x37d643.videos, _0x37d643.mainVideoIndex),
      _0x45718d = [
        _0x4109d2?.thumbUrl,
        _0x4109d2?.posterUrl,
        _toLocalPathUrl(_0x4109d2?.posterLocalPath),
        _0x37d643.thumbUrl,
        _0x37d643.videoThumbSrc,
        _0x37d643.firstFrameThumbUrl,
        _0x37d643.firstFrameUrl,
        _0x37d643.posterUrl,
        _toLocalPathUrl(_0x37d643.posterLocalPath),
        _0x37d643.imageUrl,
        _0x37d643.src,
      ];
    return (
      _0x45718d
        .map((_0x2517dd) => String(_0x2517dd || '').trim())
        .find((_0x27cda8) => _0x27cda8 && _isLikelyImageUrl(_0x27cda8)) || ''
    );
  }
  return '';
}
function _resolveRefBarThumbNode(_0x293c62, _0x5847d3) {
  const _0xd2c7e4 = String(_0x5847d3 || '').trim();
  if (!_0xd2c7e4 || !_0x293c62?.refBarEl || typeof _0x293c62.refBarEl.querySelector !== 'function')
    return null;
  const _0x526597 =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(_0xd2c7e4)
        : _0xd2c7e4.replace(/["\\]/g, '\\$&'),
    _0x5a0ef9 = _0x293c62.refBarEl.querySelector('.ref-thumb-wrap[data-source-id="' + _0x526597 + '"]');
  return _0x5a0ef9?.querySelector?.('.ref-thumb-media') || null;
}
function _getThumbNodeUrl(_0x1bae3a) {
  const _0x38f6a2 =
    _0x1bae3a?.tagName && String(_0x1bae3a.tagName).toLowerCase() === 'img' ? _0x1bae3a : null;
  return String(_0x38f6a2?.currentSrc || _0x38f6a2?.src || '').trim();
}
function _getRenderableMentionThumbUrl(_0x2f905e, _0x466fb1 = '') {
  const _0x4fa8b3 = String(_0x2f905e || '').trim();
  if (!_0x4fa8b3) return '';
  const _0x498595 = _getMentionType(_0x466fb1);
  if (_0x498595 === 'text' || _0x498595 === 'audio') return _isLikelyImageUrl(_0x4fa8b3) ? _0x4fa8b3 : '';
  return _0x4fa8b3;
}
function _getMentionVisual(_0x27d4b0, _0x1affa7 = null, _0x1304ba = null) {
  const _0x35cb6b = _getMentionType(
      _0x1affa7?.type || _getDatasetValue(_0x1304ba, 'refType', 'data-ref-type'),
    ),
    _0x44372a = _0x35cb6b || 'text';
  if (_0x1affa7?.origin === 'asset' || _isAssetMentionPill(_0x1304ba)) {
    const _0x3c7594 = _0x1affa7?.origin === 'asset' ? null : getAssetMentionRefFromPillNode(_0x1304ba),
      _0x36436a = _getRenderableMentionThumbUrl(_0x1affa7?.thumbUrl || _0x3c7594?.thumbUrl || '', _0x35cb6b);
    return { thumbUrl: _0x36436a, iconType: _0x44372a };
  }
  const _0x34e2dd = String(
      _0x1affa7?.nodeId || _0x1affa7?.sourceId || _getDatasetValue(_0x1304ba, 'nodeId', 'data-node-id'),
    ).trim(),
    _0x10f2ba = appStore.getState?.()?.nodes?.[_0x34e2dd] || {},
    _0x463e92 = _0x35cb6b || _getMentionType(_0x10f2ba.type),
    _0x17d581 = _resolveRefBarThumbNode(_0x27d4b0, _0x34e2dd),
    _0x253fa5 = _getThumbNodeUrl(_0x17d581),
    _0x3f6a87 =
      _0x253fa5 ||
      _getRenderableMentionThumbUrl(_0x1affa7?.thumbUrl || '', _0x463e92) ||
      _resolveNodeThumbUrl(_0x10f2ba, _0x463e92);
  return { thumbUrl: _0x3f6a87, thumbNode: _0x3f6a87 ? null : _0x17d581, iconType: _0x463e92 || _0x44372a };
}
function _createTextAudioMentionThumb(_0x23c67b, _0x1a1eba) {
  return createReferenceFallbackThumbElement(_getMentionType(_0x23c67b), _0x1a1eba);
}
function _cloneMentionThumbNode(_0x111f8e, _0x3bbf6d, _0x3ae41c = '') {
  const _0x31398e = _createTextAudioMentionThumb(_0x3ae41c, _0x3bbf6d);
  if (_0x31398e) return _0x31398e;
  if (!_0x111f8e) return null;
  if (typeof _0x111f8e.cloneNode !== 'function') return null;
  const _0xd16166 = _0x111f8e.cloneNode(true);
  return (
    (_0xd16166.className = _0x3bbf6d),
    (_0xd16166.draggable = false),
    (_0xd16166.contentEditable = 'false'),
    _0xd16166
  );
}
function _appendMentionVisualNode(
  _0x993e58,
  { thumbUrl: thumbUrl = '', thumbNode: thumbNode = null, iconType: iconType = '' } = {},
) {
  if (thumbUrl) {
    const _0x35723c = document.createElement('img');
    return (
      (_0x35723c.className = 'ref-pill-thumb'),
      (_0x35723c.src = thumbUrl),
      (_0x35723c.alt = ''),
      (_0x35723c.draggable = false),
      (_0x35723c.contentEditable = 'false'),
      _0x993e58.appendChild(_0x35723c),
      true
    );
  }
  const _0x26dcd3 = _cloneMentionThumbNode(thumbNode, 'ref-pill-thumb', iconType);
  if (!_0x26dcd3) return false;
  return (_0x993e58.appendChild(_0x26dcd3), true);
}
function _renderMentionPillContent(_0x14012d, _0x2ef493, _0x23cb33 = {}) {
  const _0x5de91a = _stripMentionDisplayMarker(_0x2ef493);
  if (
    typeof document === 'undefined' ||
    typeof document.createElement !== 'function' ||
    typeof _0x14012d?.replaceChildren !== 'function'
  ) {
    _0x14012d.textContent = _0x5de91a;
    return;
  }
  const _0x49903d = document.createElement('span');
  ((_0x49903d.className = 'ref-pill-label'),
    (_0x49903d.textContent = _0x5de91a),
    _0x14012d.replaceChildren(),
    _appendMentionVisualNode(_0x14012d, _0x23cb33),
    _0x14012d.appendChild(_0x49903d));
}
function _isPillVisualCurrent(_0x3881ac, _0x51a501 = {}) {
  if (!_0x3881ac || typeof _0x3881ac.querySelector !== 'function') return true;
  const _0x520a23 = _getMentionType(_0x51a501.iconType);
  if (_0x51a501.thumbUrl) {
    const _0x272fbd = _0x3881ac.querySelector('img.ref-pill-thumb');
    return String(_0x272fbd?.currentSrc || _0x272fbd?.src || '').trim() === _0x51a501.thumbUrl;
  }
  if (_0x520a23 === 'text' || _0x520a23 === 'audio') {
    const _0x32a9e4 = _0x3881ac.querySelector('.ref-pill-thumb'),
      _0x22df43 =
        typeof _0x32a9e4?.className === 'string'
          ? _0x32a9e4.className
          : String(_0x32a9e4?.getAttribute?.('class') || '');
    return (
      !!_0x32a9e4 &&
      (_0x32a9e4.classList?.contains?.('ref-thumb-fallback') || _0x22df43.includes('ref-thumb-fallback'))
    );
  }
  if (_0x51a501.thumbNode) return !!_0x3881ac.querySelector('.ref-pill-thumb');
  return !_0x3881ac.querySelector('.ref-pill-thumb') && !_0x3881ac.querySelector('.ref-pill-icon');
}
export function getAssetMentionRefFromPillNode(_0x5e0f9c) {
  if (!_isRefPillNode(_0x5e0f9c) || !_isAssetMentionPill(_0x5e0f9c)) return null;
  const _0x1386c3 = _getDatasetValue(_0x5e0f9c, 'assetId', 'data-asset-id'),
    _0xd237d = _getDatasetValue(_0x5e0f9c, 'assetIndex', 'data-asset-index'),
    _0x282260 = Number(_0xd237d);
  if (!_0x1386c3 || !Number.isFinite(_0x282260)) return null;
  return resolveAssetMentionRef({ assetId: _0x1386c3, itemIndex: _0x282260 });
}
export function getMentionPlaceholderLabel(_0x233cf0, _0x44ea16) {
  const _0x51ee49 = _getMentionType(_0x233cf0),
    _0x5abc1f = AT_TYPE_MAP[_0x51ee49] || _0x51ee49 || '素材',
    _0x392b78 = Math.max(1, Math.trunc(Number(_0x44ea16) || 1));
  return '@' + _0x5abc1f + _0x392b78;
}
export function appendAssetMentionToPrompt({
  domNode: domNode = null,
  rawLabel: rawLabel = '',
  promptParts: promptParts = null,
  inputRefs: inputRefs = null,
  mediaCounts: mediaCounts = null,
  allowedTypes: allowedTypes = null,
} = {}) {
  const _0xd7869b = getAssetMentionRefFromPillNode(domNode);
  if (!_0xd7869b) return false;
  const _0x4c7a97 = resolveEffectiveInputKind(_0xd7869b) || _getMentionType(_0xd7869b.type);
  if (Array.isArray(allowedTypes) && !allowedTypes.includes(_0x4c7a97)) {
    if (Array.isArray(promptParts)) promptParts.push(' ' + (rawLabel || _0xd7869b.label) + ' ');
    return true;
  }
  if (_0x4c7a97 === 'text') {
    if (Array.isArray(promptParts)) promptParts.push(' ' + (_0xd7869b.content || '') + ' ');
    return true;
  }
  if (!_0xd7869b.url) {
    if (Array.isArray(promptParts)) promptParts.push(' ' + (rawLabel || _0xd7869b.label) + ' ');
    return true;
  }
  const _0xb52656 = mediaCounts || {};
  _0xb52656[_0x4c7a97] = Number(_0xb52656[_0x4c7a97] || 0) + 1;
  const _0x503341 = getMentionPlaceholderLabel(_0x4c7a97, _0xb52656[_0x4c7a97]);
  if (Array.isArray(promptParts)) promptParts.push(' ' + _0x503341 + ' ');
  return (
    Array.isArray(inputRefs) && inputRefs.push({ ..._0xd7869b, type: _0x4c7a97, placeholder: _0x503341 }),
    true
  );
}
export function appendMentionPillToPrompt(_0x14cef7, _0x336af3, { focus: focus = true } = {}) {
  const _0x2a1c97 = _0x14cef7?.promptEl;
  if (!_0x2a1c97 || !_0x336af3) return null;
  const _0x506d9e = _createMentionPillForCandidate(_0x336af3, _0x14cef7);
  _bindPromptPill(_0x14cef7, _0x506d9e);
  const _0x2b3fa6 = Boolean(String(_0x2a1c97.textContent || '').trim() || _0x2a1c97.childNodes?.length);
  if (_0x2b3fa6) _0x2a1c97.appendChild(document.createTextNode(' '));
  _0x2a1c97.appendChild(_0x506d9e);
  const _0x47cc7b = document.createTextNode('\u00a0');
  _0x2a1c97.appendChild(_0x47cc7b);
  _updatePromptHtml(_0x14cef7);
  if (focus) {
    const _0x249d24 = globalThis.window?.getSelection?.(),
      _0x5bc204 =
        typeof globalThis.document?.createRange === 'function' ? globalThis.document.createRange() : null;
    _0x249d24 &&
      _0x5bc204 &&
      (_0x5bc204.setStart(_0x47cc7b, _0x47cc7b.textContent.length),
      _0x5bc204.collapse(true),
      _0x249d24.removeAllRanges(),
      _0x249d24.addRange(_0x5bc204),
      _0x2a1c97.focus?.());
  }
  return _0x506d9e;
}
export function getAssetInputRefsFromPrompt(_0x5d76c8 = null, { allowedTypes: allowedTypes = null } = {}) {
  if (!_0x5d76c8 || typeof _0x5d76c8.querySelectorAll !== 'function') return [];
  const _0x593915 =
      Array.isArray(allowedTypes) && allowedTypes.length
        ? new Set(allowedTypes.map((_0x3eef44) => _getMentionType(_0x3eef44)).filter(Boolean))
        : null,
    _0x3db1b6 = [],
    _0x554865 = new Map();
  return (
    _0x5d76c8.querySelectorAll('.ref-pill').forEach((_0x53ecb6) => {
      if (!_isAssetMentionPill(_0x53ecb6)) return;
      const _0x492886 = getAssetMentionRefFromPillNode(_0x53ecb6);
      if (!_0x492886) return;
      const _0x42fd3e = resolveEffectiveInputKind(_0x492886) || _getMentionType(_0x492886.type);
      if (!_0x42fd3e || (_0x593915 && !_0x593915.has(_0x42fd3e))) return;
      if (_0x42fd3e === 'text') {
        if (!String(_0x492886.content || '').trim()) return;
      } else {
        if (!String(_0x492886.url || '').trim()) return;
      }
      const _0xb8a9d8 = _0x492886.assetId + ':' + _0x492886.itemIndex + ':' + _0x42fd3e,
        _0x1c63f0 = _0x554865.get(_0xb8a9d8) || 0;
      (_0x554865.set(_0xb8a9d8, _0x1c63f0 + 1),
        _0x3db1b6.push({
          ..._0x492886,
          type: _0x42fd3e,
          assetMentionOccurrence: _0x1c63f0,
          assetRefSource: 'prompt',
        }));
    }),
    _0x3db1b6
  );
}
function _normalizeAllowedMentionTypes(_0x180ed7 = null) {
  return Array.isArray(_0x180ed7) && _0x180ed7.length
    ? new Set(_0x180ed7.map((_0xd2cd78) => _getMentionType(_0xd2cd78)).filter(Boolean))
    : null;
}
function _appendResolvedAssetInputRefFromRecord(
  _0x510bc5,
  _0x5295a4,
  _0x42bc59,
  {
    allowed: allowed = null,
    assetRefSource: assetRefSource = 'prompt',
    promptAssetRefIndex: promptAssetRefIndex = null,
  } = {},
) {
  const _0x32040f = String(_0x42bc59?.assetId || '').trim(),
    _0x2adbd2 =
      _0x42bc59?.itemIndex !== undefined && _0x42bc59?.itemIndex !== null
        ? _0x42bc59.itemIndex
        : _0x42bc59?.assetIndex,
    _0x3464fa = Number(_0x2adbd2),
    _0x314139 = resolveEffectiveInputKind(_0x42bc59) || _getMentionType(_0x42bc59?.type);
  if (!_0x32040f || !Number.isFinite(_0x3464fa) || !_0x314139 || (allowed && !allowed.has(_0x314139)))
    return false;
  const _0x52d515 = Math.max(0, Math.trunc(_0x3464fa)),
    _0x5eaa0b = resolveAssetMentionRef({ assetId: _0x32040f, itemIndex: _0x52d515 });
  if (!_0x5eaa0b) return false;
  const _0x108bd0 = resolveEffectiveInputKind(_0x5eaa0b) || _getMentionType(_0x5eaa0b.type || _0x314139);
  if (!_0x108bd0 || _0x108bd0 !== _0x314139) return false;
  if (_0x314139 === 'text') {
    if (!String(_0x5eaa0b.content || '').trim()) return false;
  } else {
    if (!String(_0x5eaa0b.url || '').trim()) return false;
  }
  const _0x8c7532 = _0x32040f + ':' + _0x52d515 + ':' + _0x314139,
    _0x311baf = _0x5295a4.get(_0x8c7532) || 0;
  _0x5295a4.set(_0x8c7532, _0x311baf + 1);
  const _0x5dc7f4 = {
    ..._0x5eaa0b,
    type: _0x314139,
    assetMentionOccurrence: _0x311baf,
    assetRefSource: assetRefSource,
  };
  return (
    Number.isFinite(Number(promptAssetRefIndex)) &&
      (_0x5dc7f4.promptAssetRefIndex = Math.max(0, Math.trunc(Number(promptAssetRefIndex)))),
    _0x510bc5.push(_0x5dc7f4),
    true
  );
}
export function getAssetInputRefsFromPromptHtml(_0x5e3aeb = '', { allowedTypes: allowedTypes = null } = {}) {
  const _0x206613 = _normalizeAllowedMentionTypes(allowedTypes),
    _0x59e12f = sanitizePromptHtml(_0x5e3aeb);
  if (!_0x59e12f) return [];
  const _0x64d6f1 = [],
    _0x5a67ac = new Map(),
    _0xf46daa = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
  let _0x9b1ca3 = null;
  while ((_0x9b1ca3 = _0xf46daa.exec(_0x59e12f))) {
    const _0x184360 = _0x9b1ca3[1] || '';
    if (!_htmlClassAttrContains(_0x184360, 'ref-pill')) continue;
    if (_getHtmlAttrValue(_0x184360, 'data-ref-origin') !== 'asset') continue;
    _appendResolvedAssetInputRefFromRecord(
      _0x64d6f1,
      _0x5a67ac,
      {
        assetId: _getHtmlAttrValue(_0x184360, 'data-asset-id'),
        itemIndex: _getHtmlAttrValue(_0x184360, 'data-asset-index'),
        type: _getHtmlAttrValue(_0x184360, 'data-ref-type'),
      },
      { allowed: _0x206613, assetRefSource: 'prompt' },
    );
  }
  return _0x64d6f1;
}
export function getPromptAssetInputRefsFromNode(_0xd605cd = {}, { allowedTypes: allowedTypes = null } = {}) {
  const _0x5d4d5e = _normalizeAllowedMentionTypes(allowedTypes),
    _0x1f5042 = [],
    _0x299f80 = new Map();
  return (
    _getPromptAssetInputRefRecords(_0xd605cd).forEach((_0x60e870, _0x4cee72) => {
      const _0x1e200a = _getMentionType(_0x60e870.type);
      if (!_0x1e200a || _0x1e200a === 'text') return;
      _appendResolvedAssetInputRefFromRecord(_0x1f5042, _0x299f80, _0x60e870, {
        allowed: _0x5d4d5e,
        assetRefSource: 'hidden',
        promptAssetRefIndex: _0x4cee72,
      });
    }),
    _0x1f5042
  );
}
export function getAssetInputRefsFromNodeData(_0x8f83c8 = {}, { allowedTypes: allowedTypes = null } = {}) {
  return [
    ...getAssetInputRefsFromPromptHtml(_0x8f83c8?.prompt || '', { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(_0x8f83c8 || {}, { allowedTypes: allowedTypes }),
  ];
}
export function getAssetInputRefsFromPromptAndNode(
  _0x4fae8f = null,
  { nodeData: nodeData = null, allowedTypes: allowedTypes = null } = {},
) {
  return [
    ...getAssetInputRefsFromPrompt(_0x4fae8f, { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(nodeData || {}, { allowedTypes: allowedTypes }),
  ];
}
export function removeAssetMentionPillFromPrompt(
  _0x2dc9a1,
  {
    assetId: assetId = '',
    assetIndex: assetIndex = '',
    itemIndex: itemIndex = '',
    type: type = '',
    occurrence: occurrence = null,
  } = {},
) {
  const _0x58d54d = _0x2dc9a1?.promptEl;
  if (!_0x58d54d || typeof _0x58d54d.querySelectorAll !== 'function') return false;
  const _0x104214 = String(assetId || '').trim(),
    _0x4294ab =
      assetIndex !== null && assetIndex !== undefined && String(assetIndex) !== '' ? assetIndex : itemIndex,
    _0x4b90aa = String(_0x4294ab ?? '').trim(),
    _0x2c9b87 = _getMentionType(type),
    _0x1c0ec4 = Number(occurrence),
    _0x1ae165 = Number.isFinite(_0x1c0ec4) && _0x1c0ec4 >= 0;
  if (!_0x104214 || !_0x4b90aa) return false;
  const _0x14390f = Array.from(_0x58d54d.querySelectorAll('.ref-pill'));
  let _0x3a03d2 = 0;
  const _0x81e260 = _0x14390f.find((_0x42f698) => {
    if (!_isAssetMentionPill(_0x42f698)) return false;
    const _0x46ca09 = _getDatasetValue(_0x42f698, 'assetId', 'data-asset-id'),
      _0x402afb = _getDatasetValue(_0x42f698, 'assetIndex', 'data-asset-index'),
      _0x3e2cc6 = _getMentionType(_getDatasetValue(_0x42f698, 'refType', 'data-ref-type')),
      _0x46bdd6 =
        _0x46ca09 === _0x104214 && _0x402afb === _0x4b90aa && (!_0x2c9b87 || _0x3e2cc6 === _0x2c9b87);
    if (!_0x46bdd6) return false;
    if (!_0x1ae165) return true;
    const _0x229f7c = _0x3a03d2 === _0x1c0ec4;
    return ((_0x3a03d2 += 1), _0x229f7c);
  });
  if (!_0x81e260) return false;
  return (_0x81e260.remove?.(), _updatePromptHtml(_0x2dc9a1), true);
}
export function removePromptAssetInputRefFromNode(
  _0x308b36,
  {
    assetId: assetId = '',
    assetIndex: assetIndex = '',
    itemIndex: itemIndex = '',
    type: type = '',
    occurrence: occurrence = null,
  } = {},
) {
  const _0x3aef91 = String(_0x308b36?.nodeId || '').trim();
  if (!_0x3aef91) return false;
  const _0x502171 = String(assetId || '').trim(),
    _0x339efa =
      assetIndex !== null && assetIndex !== undefined && String(assetIndex) !== '' ? assetIndex : itemIndex,
    _0x4cf1ce = Number(_0x339efa),
    _0x324a11 = _getMentionType(type),
    _0x43cb94 = Number(occurrence),
    _0x1f86bc = Number.isFinite(_0x43cb94) && _0x43cb94 >= 0;
  if (!_0x502171 || !Number.isFinite(_0x4cf1ce)) return false;
  const _0x5f2710 = _getPromptAssetInputRefRecords(_getTargetNodeData(_0x308b36));
  let _0x3ad61c = 0,
    _0x155cfb = false;
  const _0x31ed26 = _0x5f2710.filter((_0x4e695d) => {
    if (_0x155cfb) return true;
    const _0x1bee73 =
      _0x4e695d.assetId === _0x502171 &&
      _0x4e695d.itemIndex === Math.max(0, Math.trunc(_0x4cf1ce)) &&
      (!_0x324a11 || _0x4e695d.type === _0x324a11);
    if (!_0x1bee73) return true;
    if (_0x1f86bc && _0x3ad61c !== _0x43cb94) return ((_0x3ad61c += 1), true);
    return ((_0x155cfb = true), false);
  });
  if (!_0x155cfb) return false;
  return (
    appStore.updateNodeData(_0x3aef91, { [PROMPT_ASSET_INPUT_REFS_FIELD]: _0x31ed26 }),
    _notifyPromptHtmlUpdated(_0x308b36),
    true
  );
}
function _assetInputRefTargetMatches(_0x5baa09 = {}, _0x1ae3cc = {}) {
  const _0xb96c1e = String(_0x1ae3cc?.assetId || '').trim(),
    _0x4d882b =
      _0x1ae3cc?.itemIndex !== undefined && _0x1ae3cc?.itemIndex !== null
        ? _0x1ae3cc.itemIndex
        : _0x1ae3cc?.assetIndex,
    _0x361dc8 = Number(_0x4d882b),
    _0x114ee8 = _getMentionType(_0x1ae3cc?.type || _0x1ae3cc?.refType || '');
  if (!_0xb96c1e || !Number.isFinite(_0x361dc8)) return false;
  return (
    String(_0x5baa09?.assetId || '').trim() === _0xb96c1e &&
    Number(_0x5baa09?.itemIndex) === Math.max(0, Math.trunc(_0x361dc8)) &&
    (!_0x114ee8 || _getMentionType(_0x5baa09?.type) === _0x114ee8)
  );
}
function _removePromptAssetInputRecordFromNodeData(_0x1c5ca8 = {}, _0x28afbf = {}) {
  const _0x16b5e7 = _getPromptAssetInputRefRecords(_0x1c5ca8);
  if (!_0x16b5e7.length) return { removed: false, records: _0x16b5e7 };
  const _0x2345bb = String(_0x28afbf?.assetRefSource || '').trim();
  if (_0x2345bb && _0x2345bb !== 'hidden') return { removed: false, records: _0x16b5e7 };
  const _0x2a73c8 = Number(_0x28afbf?.promptAssetRefIndex);
  if (Number.isFinite(_0x2a73c8) && _0x2a73c8 >= 0) {
    const _0x2365d7 = Math.max(0, Math.trunc(_0x2a73c8));
    if (_assetInputRefTargetMatches(_0x16b5e7[_0x2365d7], _0x28afbf)) {
      const _0x5df117 = _0x16b5e7.slice();
      return (_0x5df117.splice(_0x2365d7, 1), { removed: true, records: _0x5df117 });
    }
  }
  const _0x543164 = Number(_0x28afbf?.assetMentionOccurrence ?? _0x28afbf?.occurrence),
    _0x73632a = Number.isFinite(_0x543164) && _0x543164 >= 0;
  let _0x51dc8b = 0,
    _0x392749 = false;
  const _0x52da6a = _0x16b5e7.filter((_0x4bc9c0) => {
    if (_0x392749 || !_assetInputRefTargetMatches(_0x4bc9c0, _0x28afbf)) return true;
    if (_0x73632a && _0x51dc8b !== Math.trunc(_0x543164)) return ((_0x51dc8b += 1), true);
    return ((_0x392749 = true), false);
  });
  return { removed: _0x392749, records: _0x52da6a };
}
function _removeAssetMentionPillFromPromptHtml(_0x3b1f83 = '', _0x9af16a = {}) {
  const _0x1361d5 = String(_0x9af16a?.assetRefSource || '').trim();
  if (_0x1361d5 && _0x1361d5 !== 'prompt') return { removed: false, prompt: _0x3b1f83 };
  const _0x2bc899 = sanitizePromptHtml(_0x3b1f83);
  if (!_0x2bc899) return { removed: false, prompt: _0x2bc899 };
  const _0x51e384 = Number(_0x9af16a?.assetMentionOccurrence ?? _0x9af16a?.occurrence),
    _0x1e96f1 = Number.isFinite(_0x51e384) && _0x51e384 >= 0;
  let _0x2fdab4 = 0,
    _0x7b7930 = false;
  const _0x15861e = _0x2bc899.replace(/<span\b([^>]*)>([\s\S]*?)<\/span>/gi, (_0x996f5, _0x124e71) => {
    if (_0x7b7930) return _0x996f5;
    if (!_htmlClassAttrContains(_0x124e71, 'ref-pill')) return _0x996f5;
    if (_getHtmlAttrValue(_0x124e71, 'data-ref-origin') !== 'asset') return _0x996f5;
    const _0x516de8 = {
      assetId: _getHtmlAttrValue(_0x124e71, 'data-asset-id'),
      itemIndex: _getHtmlAttrValue(_0x124e71, 'data-asset-index'),
      type: _getHtmlAttrValue(_0x124e71, 'data-ref-type'),
    };
    if (!_assetInputRefTargetMatches(_0x516de8, _0x9af16a)) return _0x996f5;
    if (_0x1e96f1 && _0x2fdab4 !== Math.trunc(_0x51e384)) return ((_0x2fdab4 += 1), _0x996f5);
    return ((_0x7b7930 = true), '');
  });
  return { removed: _0x7b7930, prompt: _0x7b7930 ? sanitizePromptHtml(_0x15861e) : _0x2bc899 };
}
export function buildRemoveAssetInputRefPatchFromNodeData(_0x4fcd62 = {}, _0x56ce6e = {}) {
  const _0x4d60f5 = {},
    _0x534d57 = _removePromptAssetInputRecordFromNodeData(_0x4fcd62, _0x56ce6e);
  _0x534d57.removed && (_0x4d60f5[PROMPT_ASSET_INPUT_REFS_FIELD] = _0x534d57.records);
  const _0xc7ff4c = _removeAssetMentionPillFromPromptHtml(_0x4fcd62?.prompt || '', _0x56ce6e);
  return (
    _0xc7ff4c.removed && (_0x4d60f5.prompt = _0xc7ff4c.prompt),
    Object.keys(_0x4d60f5).length ? _0x4d60f5 : null
  );
}
export function removeAssetInputRefFromNodeData(_0xb0fa72 = '', _0x57b1ba = {}) {
  const _0x1a8289 = String(_0xb0fa72 || '').trim();
  if (!_0x1a8289) return false;
  const _0x343890 = appStore.getState?.()?.nodes?.[_0x1a8289] || {},
    _0x4505df = buildRemoveAssetInputRefPatchFromNodeData(_0x343890, _0x57b1ba);
  if (!_0x4505df) return false;
  return (appStore.updateNodeData(_0x1a8289, _0x4505df), true);
}
export function handleRefThumbDeleteClick(_0x1dea2b, _0x9e9a) {
  const _0x353583 = _0x9e9a?.target?.closest?.('.ref-thumb-delete');
  if (!_0x353583) return false;
  typeof _0x9e9a.stopImmediatePropagation === 'function'
    ? _0x9e9a.stopImmediatePropagation()
    : _0x9e9a.stopPropagation?.();
  _0x9e9a.preventDefault?.();
  const _0x746b84 = _0x353583.closest?.('.ref-thumb-wrap'),
    _0x7df7e0 = _0x746b84?.dataset?.edgeId || '';
  if (_0x7df7e0) return (appStore.removeEdge(_0x7df7e0), _0x1dea2b?._updateSubmitButtonState?.(), true);
  if (_0x746b84?.dataset?.refOrigin === 'asset') {
    const _0x6c5ca9 = {
        assetId: _0x746b84.dataset.assetId,
        assetIndex: _0x746b84.dataset.assetIndex,
        type: _0x746b84.dataset.refType || _0x746b84.dataset.kind,
        occurrence: _0x746b84.dataset.assetOccurrence,
      },
      _0x5cb4fd = String(_0x746b84.dataset.assetRefSource || '').trim(),
      _0x28a28b =
        _0x5cb4fd === 'hidden'
          ? removePromptAssetInputRefFromNode(_0x1dea2b, _0x6c5ca9)
          : removeAssetMentionPillFromPrompt(_0x1dea2b, _0x6c5ca9) ||
            removePromptAssetInputRefFromNode(_0x1dea2b, _0x6c5ca9);
    !_0x28a28b && (_0x1dea2b?._renderRefBar?.(), _0x1dea2b?._updateSubmitButtonState?.());
  }
  return true;
}
function _createInputCountState() {
  return {
    counts: { text: 0, image: 0, video: 0, audio: 0 },
    keysByType: { text: new Set(), image: new Set(), video: new Set(), audio: new Set() },
  };
}
function _cloneInputCountState(_0x1f4aab = null) {
  const _0x1233e1 = _createInputCountState();
  return (
    MENTION_TYPE_ORDER.forEach((_0x57b7e9) => {
      ((_0x1233e1.counts[_0x57b7e9] = Number(_0x1f4aab?.counts?.[_0x57b7e9] || 0)),
        (_0x1233e1.keysByType[_0x57b7e9] = new Set(_0x1f4aab?.keysByType?.[_0x57b7e9] || [])));
    }),
    _0x1233e1
  );
}
function _addInputCount(_0x5a7c9e, _0x59e3ab, _0x3c0297 = '') {
  const _0x3deaa8 = _getMentionType(_0x59e3ab);
  if (!_0x5a7c9e || _0x5a7c9e.counts?.[_0x3deaa8] == null) return false;
  const _0x322c60 = String(_0x3c0297 || '').trim(),
    _0x371dd3 = _0x5a7c9e.keysByType?.[_0x3deaa8];
  if (_0x322c60 && _0x371dd3?.has(_0x322c60)) return false;
  if (_0x322c60 && _0x371dd3) _0x371dd3.add(_0x322c60);
  return ((_0x5a7c9e.counts[_0x3deaa8] += 1), true);
}
function _getNodeInputCountKey(_0x212b12 = '', _0x466ba1 = '') {
  const _0x529afc = String(_0x212b12 || '').trim(),
    _0x160e00 = _getMentionType(_0x466ba1);
  return _0x529afc && _0x160e00 ? 'node:' + _0x529afc + ':' + _0x160e00 : '';
}
function _getAssetInputCountKey({
  assetId: assetId = '',
  itemIndex: itemIndex = null,
  assetIndex: assetIndex = null,
  type: type = '',
} = {}) {
  const _0x1bdac6 = String(assetId || '').trim(),
    _0xee7899 = itemIndex !== null && itemIndex !== undefined ? itemIndex : assetIndex,
    _0x398b09 = Number(_0xee7899),
    _0x250417 = _getMentionType(type);
  if (!_0x1bdac6 || !Number.isFinite(_0x398b09) || !_0x250417) return '';
  return 'asset:' + _0x1bdac6 + ':' + Math.max(0, Math.trunc(_0x398b09)) + ':' + _0x250417;
}
function _getMentionInputCountKey(_0x1900b = {}, _0x239797 = '') {
  const _0x1338e4 = _getMentionType(_0x239797 || _0x1900b?.type);
  if (_0x1900b?.origin === 'asset')
    return _getAssetInputCountKey({
      assetId: _0x1900b.assetId,
      itemIndex: _0x1900b.itemIndex,
      assetIndex: _0x1900b.assetIndex,
      type: _0x1338e4,
    });
  return _getNodeInputCountKey(_0x1900b?.nodeId || _0x1900b?.sourceId, _0x1338e4);
}
function _isMentionAlreadyCounted(_0x344c89, _0x3ac51b = {}, _0x403a2d = '') {
  const _0x4f4dfa = _getMentionType(_0x403a2d || _0x3ac51b?.type),
    _0x262ad4 = _getMentionInputCountKey(_0x3ac51b, _0x4f4dfa);
  return !!(_0x4f4dfa && _0x262ad4 && _0x344c89?.keysByType?.[_0x4f4dfa]?.has(_0x262ad4));
}
function _canReuseAlreadyCountedInputForLimit(_0x4048a6 = '') {
  return _getMentionType(_0x4048a6) !== 'audio';
}
function _getPromptInputCountState(_0x12a8ec, _0xf838fe = null, { nodeData: nodeData = null } = {}) {
  const _0x43b30f = _createInputCountState(),
    _0xb50ed2 = appStore.getState(),
    _0x3dce0a = _0xb50ed2.nodes || {};
  return (
    _0x12a8ec &&
      typeof _0x12a8ec.querySelectorAll === 'function' &&
      _0x12a8ec.querySelectorAll('.ref-pill').forEach((_0x4315cb) => {
        if (_0x4315cb === _0xf838fe) return;
        let _0x319ff7 = '',
          _0x4558a1 = '';
        if (_isAssetMentionPill(_0x4315cb)) {
          const _0x13bf6e = getAssetMentionRefFromPillNode(_0x4315cb);
          ((_0x319ff7 = _0x13bf6e?.type || _getDatasetValue(_0x4315cb, 'refType', 'data-ref-type')),
            (_0x4558a1 = _getAssetInputCountKey({
              assetId: _0x13bf6e?.assetId || _getDatasetValue(_0x4315cb, 'assetId', 'data-asset-id'),
              itemIndex: _0x13bf6e?.itemIndex,
              assetIndex: _getDatasetValue(_0x4315cb, 'assetIndex', 'data-asset-index'),
              type: _0x319ff7,
            })));
        } else {
          const _0x18f251 = _getDatasetValue(_0x4315cb, 'nodeId', 'data-node-id');
          if (_isUnresolvedInputMentionPill(_0x4315cb)) return;
          ((_0x319ff7 =
            _getPillMentionType(_0x4315cb) || _getMentionType(_0x3dce0a?.[_0x18f251]?.type || '')),
            (_0x4558a1 = _getNodeInputCountKey(_0x18f251, _0x319ff7)));
        }
        _addInputCount(_0x43b30f, _0x319ff7, _0x4558a1);
      }),
    _getPromptAssetInputRefRecords(nodeData || {}).forEach((_0x397ef0) => {
      _addInputCount(_0x43b30f, _0x397ef0.type, _getAssetInputCountKey(_0x397ef0));
    }),
    _0x43b30f
  );
}
function _countPromptPillsByType(_0x4c2be6, _0x3207b5 = null, { nodeData: nodeData = null } = {}) {
  return _getPromptInputCountState(_0x4c2be6, _0x3207b5, { nodeData: nodeData }).counts;
}
function _candidateMatchesQuery(
  { label: label = '', type: type = '', assetName: assetName = '' },
  _0x43e510 = '',
) {
  const _0x30bd57 = _normalizeQuery(_0x43e510).toLowerCase();
  if (!_0x30bd57) return true;
  const _0x5785ef = AT_TYPE_MAP[type] || type,
    _0x1223a0 = _getAssetTypeMenuLabel(type);
  return [label, _0x5785ef, _0x1223a0, assetName].join(' ').toLowerCase().includes(_0x30bd57);
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
  const _0x162945 = [];
  let _0x433690 = 0;
  for (const _0xca3f24 of inEdges) {
    const _0x25a9d6 = nodes?.[_0xca3f24?.sourceId];
    if (!_0x25a9d6) continue;
    if (_getMentionType(_0x25a9d6.type) !== 'text') continue;
    const _0x106cc8 = _getTextRefContent(_0x25a9d6);
    if (!_0x106cc8) continue;
    ((_0x433690 += 1),
      _0x162945.push({
        label: '@' + AT_TYPE_MAP.text + _0x433690,
        content: _0x106cc8,
        sourceId: String(_0xca3f24?.sourceId || ''),
        used: false,
      }));
  }
  if (!promptEl && _0x162945.length === 0) return '';
  const _0x3f31ff = Object.create(null),
    _0x226f2b = Object.create(null);
  _0x162945.forEach((_0x35df7e) => {
    _0x3f31ff[_0x35df7e.label.replace(/\s+/g, '')] = _0x35df7e;
    if (_0x35df7e.sourceId) _0x226f2b[_0x35df7e.sourceId] = _0x35df7e;
  });
  const _0x1fb921 = globalThis.Node?.TEXT_NODE ?? 3,
    _0x41c759 = globalThis.Node?.ELEMENT_NODE ?? 1;
  let _0x4fad8a = '';
  const _0x2727b5 = (_0x3af4bc) => {
    for (const _0x51aaba of _getChildNodes(_0x3af4bc)) {
      const _0x3bcabc = Number(_0x51aaba?.nodeType);
      if (_0x3bcabc === _0x1fb921) {
        _0x4fad8a += String(_0x51aaba?.textContent || '');
        continue;
      }
      if (_0x3bcabc !== _0x41c759) continue;
      if (_isRefPillNode(_0x51aaba)) {
        const _0x2e298e = [];
        if (
          appendAssetMentionToPrompt({
            domNode: _0x51aaba,
            rawLabel: String(_0x51aaba?.dataset?.label || _0x51aaba?.textContent || '').trim(),
            promptParts: _0x2e298e,
            inputRefs: assetInputRefs,
            mediaCounts: assetMediaCounts,
            allowedTypes: allowedAssetTypes,
          })
        ) {
          _0x4fad8a += _0x2e298e.join('');
          continue;
        }
        const _0x44abe1 = String(_0x51aaba?.dataset?.nodeId || ''),
          _0x53daa6 = String(_0x51aaba?.dataset?.label || _0x51aaba?.textContent || '').trim();
        if (_isUnresolvedInputMentionPill(_0x51aaba)) {
          _0x4fad8a += ' ' + _0x53daa6 + ' ';
          continue;
        }
        const _0x3ca506 = _0x53daa6.replace(/\s+/g, ''),
          _0x4122e4 = (_0x44abe1 && _0x226f2b[_0x44abe1]) || _0x3f31ff[_0x3ca506];
        _0x4122e4
          ? ((_0x4122e4.used = true), (_0x4fad8a += ' ' + _0x4122e4.content + ' '))
          : (_0x4fad8a += ' ' + _0x53daa6 + ' ');
        continue;
      }
      if (String(_0x51aaba?.tagName || '').toUpperCase() === 'BR') {
        _0x4fad8a += '\n';
        continue;
      }
      _0x2727b5(_0x51aaba);
    }
  };
  _getChildNodes(promptEl).length > 0
    ? _0x2727b5(promptEl)
    : (_0x4fad8a = String(promptEl?.innerText || promptEl?.textContent || ''));
  let _0x15a8c5 = _normalizePromptWhitespace(_0x4fad8a);
  (_0x162945.forEach((_0x44197a) => {
    if (_0x44197a.used) return;
    const _0x46d80a = new RegExp(_escapeRegExp(_0x44197a.label).replace(/\s+/g, '[\\s\\u00A0]*'), 'g');
    _0x46d80a.test(_0x15a8c5) &&
      ((_0x44197a.used = true), (_0x15a8c5 = _0x15a8c5.replace(_0x46d80a, ' ' + _0x44197a.content + ' ')));
  }),
    (_0x15a8c5 = _normalizePromptWhitespace(_0x15a8c5)));
  let _0x253329 = '';
  prependUnusedTextRefs &&
    _0x162945.forEach((_0x3969b3) => {
      !_0x3969b3.used &&
        _0x3969b3.content &&
        ((_0x253329 += _0x3969b3.content + '\n'), (_0x3969b3.used = true));
    });
  if (!_0x253329) return _0x15a8c5;
  if (!_0x15a8c5) return _0x253329.replace(/\n+$/g, '');
  return '' + _0x253329 + _0x15a8c5;
}
export function resolvePromptTextWithTextRefs(_0x24b591 = {}) {
  return _resolvePromptTextWithTextRefs(_0x24b591);
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
  const _0x7f1306 = _resolvePromptTextWithTextRefs({
    promptEl: promptEl,
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: assetInputRefs,
    assetMediaCounts: assetMediaCounts,
    allowedAssetTypes: allowedAssetTypes,
  });
  if (template == null) return _0x7f1306;
  const _0x18e564 = resolvePromptPresetTemplate(template, _0x7f1306);
  return _resolvePromptTextWithTextRefs({
    promptEl: { innerText: _0x18e564, textContent: _0x18e564, childNodes: [] },
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: assetInputRefs,
    assetMediaCounts: assetMediaCounts,
    allowedAssetTypes: allowedAssetTypes,
    prependUnusedTextRefs: false,
  });
}
function _templateConsumesPresetUserInput(_0xf695f = null) {
  if (_0xf695f == null) return false;
  const _0x1c66a9 = '__PROMPT_PRESET_USER_INPUT_MARKER__';
  return resolvePromptPresetTemplate(_0xf695f, _0x1c66a9).includes(_0x1c66a9);
}
function _resolveInsertedPresetPromptText({
  template: template = null,
  promptEl: promptEl = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  allowedAssetTypes: allowedAssetTypes = null,
} = {}) {
  const _0x492372 = _resolvePromptTextWithTextRefs({
      promptEl: promptEl,
      inEdges: inEdges,
      nodes: nodes,
      assetInputRefs: [],
      assetMediaCounts: { image: 0, video: 0, audio: 0 },
      allowedAssetTypes: allowedAssetTypes,
    }),
    _0xe511d6 = resolvePromptPresetTemplate(template, _0x492372);
  if (!_0x492372 || _templateConsumesPresetUserInput(template)) return _0xe511d6;
  if (!_0xe511d6) return _0x492372;
  return _0x492372 + '\n' + _0xe511d6;
}
function _notifyPromptHtmlUpdated(_0x566959, _0x446bf9 = {}) {
  const _0x31e860 = _0x446bf9?.renderRefBar !== false;
  if (typeof _0x566959._handlePromptHtmlUpdated === 'function') {
    _0x566959._handlePromptHtmlUpdated();
    return;
  }
  (_0x31e860 && typeof _0x566959._renderRefBar === 'function' && _0x566959._renderRefBar(),
    typeof _0x566959._updateSubmitButtonState === 'function' && _0x566959._updateSubmitButtonState());
}
function _isEmptyPromptHtml(_0x3f44ee = '') {
  const _0x2310d8 = String(_0x3f44ee || '')
    .replace(/<br\b[^>]*\/?>/gi, '')
    .replace(/<\/?(?:div|p|section|article|blockquote)\b[^>]*>/gi, '')
    .replace(/&nbsp;|\u00a0/g, '')
    .trim();
  return _0x2310d8 === '';
}
function _sanitizePromptHtmlForCommit(_0x494e53 = '') {
  const _0x943968 = sanitizePromptHtml(_0x494e53);
  return _isEmptyPromptHtml(_0x943968) ? '' : _0x943968;
}
export function sanitizePromptHtmlForCommit(_0x41d4ca = '') {
  return _sanitizePromptHtmlForCommit(_0x41d4ca);
}
function _clearPromptHtmlCommitTimer(_0x2c7705) {
  if (!_0x2c7705?._promptHtmlCommitTimer) return;
  (clearTimeout(_0x2c7705._promptHtmlCommitTimer), (_0x2c7705._promptHtmlCommitTimer = null));
}
export function schedulePromptHtmlCommit(_0x3f63e5, { delayMs: delayMs = PROMPT_HTML_COMMIT_DELAY_MS } = {}) {
  if (!_0x3f63e5?.promptEl || !_0x3f63e5?.nodeId) return false;
  (_clearPromptHtmlCommitTimer(_0x3f63e5),
    (_0x3f63e5._hasPendingPromptHtmlCommit = true),
    _pendingPromptHtmlCommitTargets.add(_0x3f63e5));
  const _0x1c9505 = Math.max(0, Number(delayMs) || 0);
  return (
    (_0x3f63e5._promptHtmlCommitTimer = setTimeout(() => {
      flushPromptHtmlCommit(_0x3f63e5);
    }, _0x1c9505)),
    true
  );
}
export function cancelPromptHtmlCommit(_0x1b2964) {
  if (!_0x1b2964) return false;
  return (
    _clearPromptHtmlCommitTimer(_0x1b2964),
    (_0x1b2964._hasPendingPromptHtmlCommit = false),
    _pendingPromptHtmlCommitTargets.delete(_0x1b2964),
    true
  );
}
export function flushPromptHtmlCommit(_0x3aa01e) {
  if (!_0x3aa01e) return false;
  _clearPromptHtmlCommitTimer(_0x3aa01e);
  const _0x2e2803 = _0x3aa01e._hasPendingPromptHtmlCommit === true;
  ((_0x3aa01e._hasPendingPromptHtmlCommit = false), _pendingPromptHtmlCommitTargets.delete(_0x3aa01e));
  if (!_0x3aa01e?.promptEl || !_0x3aa01e?.nodeId) return false;
  const _0x461478 = _sanitizePromptHtmlForCommit(_0x3aa01e.promptEl.innerHTML),
    _0x5aa690 = appStore.getState?.()?.nodes?.[_0x3aa01e.nodeId];
  if (!_0x5aa690) return false;
  const _0x472303 = _0x5aa690.prompt;
  if (!_0x2e2803 && _0x472303 === _0x461478) return false;
  if (_0x472303 === _0x461478) return false;
  return (appStore.updateNodeData(_0x3aa01e.nodeId, { prompt: _0x461478 }), true);
}
export function flushAllPendingPromptHtmlCommits() {
  let _0x331bb7 = false;
  return (
    Array.from(_pendingPromptHtmlCommitTargets).forEach((_0x1e4e8e) => {
      _0x331bb7 = flushPromptHtmlCommit(_0x1e4e8e) || _0x331bb7;
    }),
    _0x331bb7
  );
}
function _updatePromptHtml(_0x152c9e, _0x1bb831 = {}) {
  if (!_0x152c9e?.promptEl || !_0x152c9e?.nodeId) return;
  (cancelPromptHtmlCommit(_0x152c9e),
    appStore.updateNodeData(_0x152c9e.nodeId, {
      prompt: _sanitizePromptHtmlForCommit(_0x152c9e.promptEl.innerHTML),
    }),
    _notifyPromptHtmlUpdated(_0x152c9e, _0x1bb831));
}
function _commitPromptAndAssetInputRefs(_0x459474, _0x3d9cb4) {
  if (!_0x459474?.nodeId) return false;
  const _0x249065 = { [PROMPT_ASSET_INPUT_REFS_FIELD]: Array.isArray(_0x3d9cb4) ? _0x3d9cb4 : [] };
  return (
    _0x459474?.promptEl &&
      (cancelPromptHtmlCommit(_0x459474),
      (_0x249065.prompt = _sanitizePromptHtmlForCommit(_0x459474.promptEl.innerHTML))),
    appStore.updateNodeData(_0x459474.nodeId, _0x249065),
    _notifyPromptHtmlUpdated(_0x459474),
    true
  );
}
function _getPromptAssetInputRefRecordForMention(_0x4c99f3 = {}) {
  if (_0x4c99f3?.origin !== 'asset') return null;
  return _normalizePromptAssetInputRefRecord({
    assetId: _0x4c99f3.assetId,
    itemIndex: _0x4c99f3.assetIndex ?? _0x4c99f3.itemIndex,
    type: _0x4c99f3.type,
  });
}
function _appendPromptAssetInputRefRecords(_0x337d22, _0x4f367c = []) {
  const _0x5ad9bd = _getPromptAssetInputRefRecords(_getTargetNodeData(_0x337d22)),
    _0x2359f9 = _0x5ad9bd.slice();
  return (
    (Array.isArray(_0x4f367c) ? _0x4f367c : [_0x4f367c]).forEach((_0x512774) => {
      const _0x418d04 = _getPromptAssetInputRefRecordForMention(_0x512774);
      if (_0x418d04) _0x2359f9.push(_0x418d04);
    }),
    _0x2359f9
  );
}
function _shouldStoreMentionAsPromptAssetInput(_0x391152, _0x5c27ff = {}) {
  const _0x455956 = _getMentionType(_0x5c27ff?.type);
  return (
    _0x5c27ff?.origin === 'asset' &&
    _0x455956 &&
    _0x455956 !== 'text' &&
    isRunningHubWorkflowNode(_getTargetNodeData(_0x391152))
  );
}
function _consumeMentionTriggerText({ triggerRange: triggerRange = null, atIndex: atIndex = -1 } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const _0x7512f = window.getSelection?.(),
    _0x5f0be2 = triggerRange || (_0x7512f && _0x7512f.rangeCount ? _0x7512f.getRangeAt(0) : null);
  if (!_0x5f0be2 || _0x5f0be2.startContainer.nodeType !== Node.TEXT_NODE) return false;
  const _0x30f9bd = _0x5f0be2.startContainer,
    _0x119c54 = String(_0x30f9bd.textContent || ''),
    _0x5da688 = _0x5f0be2.startOffset,
    _0x363cbc =
      Number.isFinite(atIndex) && atIndex >= 0 ? atIndex : _0x119c54.lastIndexOf('@', _0x5da688 - 1);
  if (_0x363cbc < 0) return false;
  const _0x3b7683 = _0x30f9bd.parentNode;
  if (!_0x3b7683) return false;
  const _0x392c4d = document.createTextNode(_0x119c54.slice(0, _0x363cbc)),
    _0x555365 = document.createTextNode(_0x119c54.slice(_0x5da688));
  (_0x3b7683.replaceChild(_0x555365, _0x30f9bd), _0x3b7683.insertBefore(_0x392c4d, _0x555365));
  const _0x2aecbd = document.createRange();
  return (
    _0x2aecbd.setStartAfter(_0x392c4d),
    _0x2aecbd.collapse(true),
    _0x7512f?.removeAllRanges?.(),
    _0x7512f?.addRange?.(_0x2aecbd),
    true
  );
}
function _insertPromptAssetInputRef(
  _0x150c5a,
  _0x43f1a1,
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  const _0x4bb176 = _appendPromptAssetInputRefRecords(_0x150c5a, [_0x43f1a1]);
  if (pillToEdit) return (pillToEdit.remove?.(), _commitPromptAndAssetInputRefs(_0x150c5a, _0x4bb176));
  if (!_consumeMentionTriggerText({ triggerRange: triggerRange, atIndex: atIndex })) return false;
  return _commitPromptAndAssetInputRefs(_0x150c5a, _0x4bb176);
}
function _escapePromptPreviewHtml(_0xce6c55) {
  return String(_0xce6c55 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, '<br>');
}
function _moveCaretToPromptEnd(_0x137831) {
  if (!_0x137831) return;
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof document.createRange !== 'function'
  )
    return;
  try {
    const _0x178dae = window.getSelection?.();
    if (!_0x178dae) return;
    const _0x2f3bc3 = document.createRange();
    (_0x2f3bc3.selectNodeContents(_0x137831),
      _0x2f3bc3.collapse(false),
      _0x178dae.removeAllRanges(),
      _0x178dae.addRange(_0x2f3bc3));
  } catch {}
}
export function shouldUsePromptPreviewForPreset(_0x138037 = null, _0x233c58 = {}) {
  return (
    (_0x233c58?.insertPrompt === true || globalThis.window?.DEV_MODE === true) &&
    hasPromptPresetTemplateContent(_0x138037)
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
  const _0x4479f2 = String(promptText ?? ''),
    _0xe8c199 = sanitizePromptHtml(_escapePromptPreviewHtml(_0x4479f2)),
    _0x174de4 = typeof Element !== 'undefined' && promptEl instanceof Element;
  promptEl && (promptEl.innerHTML = _0xe8c199);
  !_0x174de4 &&
    promptEl &&
    (('textContent' in promptEl || typeof promptEl.textContent !== 'undefined') &&
      (promptEl.textContent = _0x4479f2),
    ('innerText' in promptEl || typeof promptEl.innerText !== 'undefined') &&
      (promptEl.innerText = _0x4479f2),
    Array.isArray(promptEl.childNodes) &&
      (promptEl.childNodes = [{ nodeType: globalThis.Node?.TEXT_NODE ?? 3, textContent: _0x4479f2 }]));
  if (typeof promptEl?.focus === 'function')
    try {
      promptEl.focus();
    } catch {}
  return (
    _0x174de4 && _moveCaretToPromptEnd(promptEl),
    storeApi?.updateNodeData && nodeId && storeApi.updateNodeData(nodeId, { prompt: _0xe8c199 }),
    toastText && globalThis.window?.showToast?.(toastText, toastType),
    _0xe8c199
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
  const _0xc7764 = _resolveInsertedPresetPromptText({
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
    promptText: _0xc7764,
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
function _isMentionNodeConnected(_0x1d5e4c) {
  if (!_0x1d5e4c) return false;
  if (_0x1d5e4c.isConnected === true) return true;
  if (typeof document === 'undefined') return true;
  return typeof document.body?.contains === 'function' ? document.body.contains(_0x1d5e4c) : true;
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
function _resolveMentionMenuPoint(_0x53d9bd) {
  if (!_0x53d9bd) return null;
  const _0x380983 = 5;
  if (_0x53d9bd.triggerRange?.getBoundingClientRect)
    try {
      const _0x59a7bd = _0x53d9bd.triggerRange.getBoundingClientRect();
      if (_0x59a7bd) return { left: _0x59a7bd.left, top: _0x59a7bd.bottom + _0x380983 };
    } catch {}
  if (_0x53d9bd.pillToEdit?.getBoundingClientRect && _isMentionNodeConnected(_0x53d9bd.pillToEdit)) {
    const _0x242e07 = _0x53d9bd.pillToEdit.getBoundingClientRect();
    return { left: _0x242e07.left, top: _0x242e07.bottom + _0x380983 };
  }
  if (Number.isFinite(_0x53d9bd.fallbackX) && Number.isFinite(_0x53d9bd.fallbackY))
    return { left: _0x53d9bd.fallbackX, top: _0x53d9bd.fallbackY };
  return null;
}
function _syncOpenMentionSubmenus() {
  const _0x4f1d97 = _mentionMenuPositionState?.menu || _mentionMenuEl;
  if (!_0x4f1d97?.querySelectorAll) return;
  _0x4f1d97.querySelectorAll('.at-mention-submenu-open').forEach((_0x1f15ac) => {
    const _0x5660e7 = Array.from(_0x1f15ac.children || []).find((_0x74a877) =>
      _0x74a877.classList?.contains('at-mention-submenu'),
    );
    if (_0x5660e7) _positionMentionSubmenu(_0x1f15ac, _0x5660e7);
  });
}
function _positionMentionMenu() {
  const _0x15f6f6 = _mentionMenuPositionState,
    _0x2361ad = _0x15f6f6?.menu;
  if (!_0x15f6f6 || !_0x2361ad || _0x2361ad.style.display !== 'flex') return;
  const _0x58ac55 = _resolveMentionMenuPoint(_0x15f6f6);
  if (!_0x58ac55) {
    _closeMentionMenu();
    return;
  }
  const _0x1bc4c2 = Number(globalThis.window?.innerHeight || 0),
    _0x3ed80f = _0x1bc4c2 > 0 && _0x58ac55.top + 180 > _0x1bc4c2 ? _0x58ac55.top - 185 : _0x58ac55.top;
  ((_0x2361ad.style.left = _0x58ac55.left + 'px'),
    (_0x2361ad.style.top = _0x3ed80f + 'px'),
    _syncOpenMentionSubmenus());
}
function _watchMentionViewport() {
  if (typeof appStore.subscribeSelector !== 'function') return;
  if (_mentionViewportUnsubscribe) _mentionViewportUnsubscribe();
  _mentionViewportUnsubscribe = appStore.subscribeSelector(
    (_0x36b4c8) => _0x36b4c8.viewport,
    () => _positionMentionMenu(),
  );
}
function _bindMentionOutsideDocClick(_0x5acd16) {
  (_clearMentionOutsideDocClick(),
    (_mentionOutsideDocClick = (_0x342c1d) => {
      !_0x5acd16.contains(_0x342c1d.target) && _closeMentionMenu();
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
  const _0x51b36d = document.getElementById?.('v2-mention-menu') || null;
  if (_0x51b36d && _0x51b36d !== _mentionMenuEl) _mentionMenuEl = _0x51b36d;
  else
    _mentionMenuEl &&
      !_0x51b36d &&
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
  const _0x5b2ef8 = _getMentionMenu();
  ((_0x5b2ef8.style.display = 'none'), (_0x5b2ef8.innerHTML = ''), (_mentionMenuState.activeMenu = null));
}
export function _buildMentionCandidates(_0x30abf8, _0x184c56 = '', _0x4aa7d1 = {}) {
  const _0x105326 = _0x30abf8?.nodeId,
    _0x4402ed = appStore.getState(),
    _0x35aea6 = _0x4402ed.nodes || {},
    _0x4412db = _0x35aea6?.[_0x105326] || _0x30abf8?._data || {},
    _0x5539ba = getTargetInputPolicy(_0x4412db),
    _0x230ad5 = appStore.getIncomingEdges(_0x105326),
    _0x119556 = _normalizeQuery(_0x184c56),
    _0x2f014b = { text: 0, image: 0, video: 0, audio: 0 },
    _0x22d51e = _getPromptInputCountState(_0x30abf8?.promptEl, _0x4aa7d1?.excludePill || null, {
      nodeData: _0x4412db,
    }),
    _0x289f63 = _cloneInputCountState(_0x22d51e),
    _0x57e118 = [];
  _0x230ad5.forEach((_0x2b22cb) => {
    const _0x37c45d = _0x35aea6[_0x2b22cb.sourceId];
    if (!_0x37c45d) return;
    const _0x4e8a8c = resolveEffectiveInputKind(_0x37c45d, _0x2b22cb);
    if (!_0x4e8a8c) return;
    if (!isInputKindAllowed(_0x5539ba, _0x4e8a8c)) return;
    (_addInputCount(_0x289f63, _0x4e8a8c, _getNodeInputCountKey(_0x2b22cb.sourceId, _0x4e8a8c)),
      (_0x2f014b[_0x4e8a8c] += 1));
    const _0x48b0a2 = AT_TYPE_MAP[_0x4e8a8c] || _0x4e8a8c,
      _0x133c9b = '' + _0x48b0a2 + _0x2f014b[_0x4e8a8c],
      _0x4f68ff = _0x133c9b;
    if (_0x119556 && !_0x133c9b.includes(_0x119556) && !_0x48b0a2.includes(_0x119556)) return;
    _0x57e118.push({
      origin: 'node',
      edgeId: _0x2b22cb.id,
      nodeId: _0x2b22cb.sourceId,
      type: _0x4e8a8c,
      label: _0x4f68ff,
      ..._getMentionVisual(_0x30abf8, { origin: 'node', nodeId: _0x2b22cb.sourceId, type: _0x4e8a8c }),
      limitReason: '',
    });
  });
  const _0x236b73 = MENTION_TYPE_ORDER.filter((_0x347c7b) => isInputKindAllowed(_0x5539ba, _0x347c7b));
  return (
    getAssetMentionCandidates({ query: '', allowedTypes: _0x236b73 }).forEach((_0x1e0211) => {
      const _0x44d68b = _getMentionType(_0x1e0211.type);
      if (!_0x44d68b) return;
      if (!_candidateMatchesQuery(_0x1e0211, _0x184c56)) return;
      _0x57e118.push({
        origin: 'asset',
        assetId: _0x1e0211.assetId,
        assetIndex: _0x1e0211.itemIndex,
        type: _0x44d68b,
        label: _stripMentionDisplayMarker(_0x1e0211.insertLabel || _0x1e0211.label || _0x1e0211.name),
        assetName: _0x1e0211.assetName,
        thumbUrl: _getRenderableMentionThumbUrl(_0x1e0211.thumbUrl || '', _0x44d68b),
        iconType: _0x44d68b,
        limitReason:
          _getAdvancedVoiceCloneAudioLimitReason(
            _0x30abf8,
            { origin: 'asset', assetId: _0x1e0211.assetId, assetIndex: _0x1e0211.itemIndex, type: _0x44d68b },
            _0x4412db,
            _0x4402ed,
          ) ??
          (_canReuseAlreadyCountedInputForLimit(_0x44d68b) &&
          _isMentionAlreadyCounted(_0x289f63, {
            origin: 'asset',
            assetId: _0x1e0211.assetId,
            assetIndex: _0x1e0211.itemIndex,
            type: _0x44d68b,
          })
            ? ''
            : getInputLimitReason(_0x5539ba, _0x44d68b, _0x289f63.counts)),
      });
    }),
    _0x57e118
  );
}
export function _buildMentionMenuTree(_0x5eda93 = []) {
  const _0x1a8ef9 = [],
    _0x355c62 = new Map();
  (Array.isArray(_0x5eda93) ? _0x5eda93 : []).forEach((_0xb2c00a) => {
    if (!_0xb2c00a || typeof _0xb2c00a !== 'object') return;
    if (_0xb2c00a.origin !== 'asset') {
      _0x1a8ef9.push(_0xb2c00a);
      return;
    }
    const _0x1068a5 = _getMentionType(_0xb2c00a.type);
    if (!_0x1068a5) return;
    const _0x1ebf10 = String(_0xb2c00a.assetId || _0xb2c00a.assetName || 'asset');
    !_0x355c62.has(_0x1ebf10) &&
      _0x355c62.set(_0x1ebf10, {
        assetId: _0xb2c00a.assetId || '',
        label: _0xb2c00a.assetName || nodePromptSharedText('assetFallback'),
        typeMap: new Map(),
        items: [],
      });
    const _0x5c133e = _0x355c62.get(_0x1ebf10);
    (_0x5c133e.items.push(_0xb2c00a),
      !_0x5c133e.typeMap.has(_0x1068a5) &&
        _0x5c133e.typeMap.set(_0x1068a5, {
          type: _0x1068a5,
          label: _getAssetTypeMenuLabel(_0x1068a5),
          items: [],
        }),
      _0x5c133e.typeMap.get(_0x1068a5).items.push(_0xb2c00a));
  });
  const _0x4aee34 = Array.from(_0x355c62.values())
    .map((_0x49c4d4) => ({
      assetId: _0x49c4d4.assetId,
      label: _0x49c4d4.label,
      items: _0x49c4d4.items,
      typeItems: MENTION_TYPE_ORDER.map((_0xa0ce93) => _0x49c4d4.typeMap.get(_0xa0ce93)).filter(
        (_0x1bee74) => _0x1bee74?.items?.length > 0,
      ),
    }))
    .filter((_0x25ed42) => _0x25ed42.items.length > 0);
  return { nodeItems: _0x1a8ef9, assetItems: _0x4aee34 };
}
function _getPromptInputPillLabel(_0x35c601) {
  return _stripMentionDisplayMarker(
    _getDatasetValue(_0x35c601, 'label', 'data-label') || _0x35c601?.textContent || '',
  );
}
function _buildInputMentionCandidateIndex(_0x2989ef) {
  const _0x9d4c97 = _buildMentionCandidates(_0x2989ef, '').filter(
      (_0x47bfec) => _0x47bfec?.origin === 'node',
    ),
    _0x10973e = new Map(),
    _0x28331a = new Map(),
    _0x4639b8 = new Map();
  return (
    _0x9d4c97.forEach((_0x322e5f) => {
      const _0x375aa2 = String(_0x322e5f?.nodeId || '').trim(),
        _0x361150 = _normalizeMentionLabelKey(_0x322e5f?.label || ''),
        _0x138529 = _getMentionType(_0x322e5f?.type);
      if (_0x375aa2) _0x10973e.set(_0x375aa2, _0x322e5f);
      if (_0x361150 && !_0x28331a.has(_0x361150)) _0x28331a.set(_0x361150, _0x322e5f);
      if (_0x361150 && _0x138529) {
        const _0x4b8dd6 = _0x138529 + ':' + _0x361150;
        if (!_0x4639b8.has(_0x4b8dd6)) _0x4639b8.set(_0x4b8dd6, _0x322e5f);
      }
    }),
    { bySourceId: _0x10973e, byLabel: _0x28331a, byLabelAndType: _0x4639b8 }
  );
}
function _applyInputMentionCandidateToPill(_0x2c9053, _0x57c71d, _0x2a49de) {
  if (!_isRefPillNode(_0x57c71d) || !_0x2a49de) return false;
  const _0x142c2b = _stripMentionDisplayMarker(_0x2a49de.label || _0x57c71d.dataset?.label || ''),
    _0x52fe53 = _getMentionType(_0x2a49de.type);
  ((_0x57c71d.dataset.refOrigin = 'node'),
    (_0x57c71d.dataset.label = _0x142c2b),
    (_0x57c71d.dataset.nodeId = String(_0x2a49de.nodeId || '')));
  if (_0x52fe53) _0x57c71d.dataset.refType = _0x52fe53;
  return (
    delete _0x57c71d.dataset.assetId,
    delete _0x57c71d.dataset.assetIndex,
    _0x57c71d.removeAttribute?.('data-asset-id'),
    _0x57c71d.removeAttribute?.('data-asset-index'),
    _clearInputMentionPillUnresolved(_0x57c71d),
    _renderMentionPillContent(_0x57c71d, _0x142c2b, _getMentionVisual(_0x2c9053, _0x2a49de, _0x57c71d)),
    true
  );
}
export function resolvePromptInputPillsForTarget(_0x15067d) {
  if (!_0x15067d?.promptEl || typeof _0x15067d.promptEl.querySelectorAll !== 'function')
    return { resolved: 0, unresolved: 0 };
  const _0x1699a6 = _buildInputMentionCandidateIndex(_0x15067d);
  let _0x8b86f4 = 0,
    _0x588906 = 0;
  return (
    _0x15067d.promptEl.querySelectorAll('.ref-pill').forEach((_0x2a2f64) => {
      if (_isAssetMentionPill(_0x2a2f64)) return;
      const _0x5b06f7 = _getPromptInputPillLabel(_0x2a2f64),
        _0x2ef91e = _normalizeMentionLabelKey(_0x5b06f7),
        _0x505671 = _getPillMentionType(_0x2a2f64),
        _0x129fd6 = _getDatasetValue(_0x2a2f64, 'nodeId', 'data-node-id');
      let _0x3b90c7 = _0x129fd6 ? _0x1699a6.bySourceId.get(_0x129fd6) : null;
      !_0x3b90c7 &&
        _0x2ef91e &&
        _0x505671 &&
        (_0x3b90c7 = _0x1699a6.byLabelAndType.get(_0x505671 + ':' + _0x2ef91e) || null);
      !_0x3b90c7 && _0x2ef91e && (_0x3b90c7 = _0x1699a6.byLabel.get(_0x2ef91e) || null);
      if (_0x3b90c7 && (!_0x505671 || _getMentionType(_0x3b90c7.type) === _0x505671)) {
        if (_applyInputMentionCandidateToPill(_0x15067d, _0x2a2f64, _0x3b90c7)) _0x8b86f4 += 1;
        return;
      }
      if (_setInputMentionPillUnresolved(_0x2a2f64, { label: _0x5b06f7, type: _0x505671 })) _0x588906 += 1;
    }),
    { resolved: _0x8b86f4, unresolved: _0x588906 }
  );
}
function _getClipboardData(_0xa90758, _0x3b93e7) {
  const _0x39c564 = _0xa90758?.clipboardData || globalThis.window?.clipboardData;
  if (typeof _0x39c564?.getData !== 'function') return '';
  return String(_0x39c564.getData(_0x3b93e7) || '');
}
function _insertPromptHtmlAtSelection(_0x39fa2f) {
  if (typeof document !== 'undefined' && typeof document.execCommand === 'function')
    try {
      if (document.execCommand('insertHTML', false, _0x39fa2f)) return true;
    } catch {}
  return false;
}
function _insertPromptTextAtSelection(_0xb52ff) {
  if (typeof document !== 'undefined' && typeof document.execCommand === 'function')
    try {
      if (document.execCommand('insertText', false, _0xb52ff)) return true;
    } catch {}
  return false;
}
export function handlePromptPaste(_0x3b1034, _0x3cc020) {
  if (!_0x3b1034?.promptEl) return false;
  _0x3cc020?.preventDefault?.();
  const _0x54cffd = _getClipboardData(_0x3cc020, 'text/html'),
    _0x392a68 = _getClipboardData(_0x3cc020, 'text/plain'),
    _0x125ae5 = sanitizePromptHtml(_0x54cffd),
    _0x3f4b2c = !!_0x125ae5 && /class="ref-pill"/i.test(_0x125ae5);
  if (!_0x3f4b2c) {
    const _0x24d1d2 = _insertPromptTextAtSelection(_0x392a68);
    if (_0x24d1d2) return (_updatePromptHtml(_0x3b1034), true);
    return false;
  }
  const _0x36d300 = _insertPromptHtmlAtSelection(_0x125ae5);
  if (!_0x36d300) {
    const _0x4b7789 = _insertPromptTextAtSelection(_0x392a68);
    if (_0x4b7789) _updatePromptHtml(_0x3b1034);
    return _0x4b7789;
  }
  const _0x13dc74 = resolvePromptInputPillsForTarget(_0x3b1034);
  return (
    _rehydratePromptPills(_0x3b1034),
    _syncEdgesOrderFromPills(_0x3b1034),
    _updatePromptHtml(_0x3b1034),
    _0x13dc74.unresolved > 0 &&
      globalThis.window?.showToast?.('Some @ input refs are not bound in this node.', 'warn'),
    true
  );
}
export function handlePromptSelectAll(_0x319375, _0x12423a) {
  if (!_0x319375?.promptEl) return false;
  const _0x4d7c70 = String(_0x12423a?.key || '').toLowerCase(),
    _0x4345f2 = String(_0x12423a?.code || ''),
    _0x8c2d92 =
      (_0x12423a?.ctrlKey || _0x12423a?.metaKey) &&
      !_0x12423a?.altKey &&
      (_0x4d7c70 === 'a' || _0x4345f2 === 'KeyA');
  if (!_0x8c2d92) return false;
  const _0xdcb6b1 = globalThis.window?.getSelection?.(),
    _0x4cdc26 =
      typeof document !== 'undefined' && typeof document.createRange === 'function'
        ? document.createRange()
        : null;
  if (!_0xdcb6b1 || !_0x4cdc26) return false;
  return (
    _0x12423a.preventDefault?.(),
    _0x12423a.stopPropagation?.(),
    _0x4cdc26.selectNodeContents(_0x319375.promptEl),
    _0xdcb6b1.removeAllRanges?.(),
    _0xdcb6b1.addRange?.(_0x4cdc26),
    true
  );
}
export function _insertMentionPill(
  _0x195565,
  {
    label: _0x27647a,
    nodeId: _0x3b8704,
    triggerRange: triggerRange = null,
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
    candidate: candidate = null,
  } = {},
) {
  if (!_0x195565?.promptEl) return false;
  const _0x507157 = candidate || { origin: 'node', label: _0x27647a, nodeId: _0x3b8704, type: '' },
    _0x1343b5 = _getMentionType(_0x507157.type);
  if (_0x1343b5) {
    const _0xc5dac5 = appStore.getState(),
      _0x1c6038 = _0xc5dac5.nodes?.[_0x195565.nodeId] || _0x195565?._data || {},
      _0x40cb2b = getTargetInputPolicy(_0x1c6038),
      _0x2cb549 = _getPromptInputCountState(_0x195565.promptEl, pillToEdit || null, { nodeData: _0x1c6038 });
    if (_0x507157.origin === 'asset') {
      const _0x46427d = _0xc5dac5.nodes || {};
      appStore.getIncomingEdges(_0x195565.nodeId).forEach((_0x7cd6dd) => {
        const _0x194058 = resolveEffectiveInputKind(_0x46427d?.[_0x7cd6dd?.sourceId], _0x7cd6dd);
        _addInputCount(_0x2cb549, _0x194058, _getNodeInputCountKey(_0x7cd6dd?.sourceId, _0x194058));
      });
    }
    const _0x3d0283 =
      _getAdvancedVoiceCloneAudioLimitReason(_0x195565, _0x507157, _0x1c6038, _0xc5dac5) ??
      (_canReuseAlreadyCountedInputForLimit(_0x1343b5) &&
      _isMentionAlreadyCounted(_0x2cb549, _0x507157, _0x1343b5)
        ? ''
        : getInputLimitReason(_0x40cb2b, _0x1343b5, _0x2cb549.counts));
    if (_0x3d0283) return (globalThis.window?.showToast?.(_0x3d0283, 'warn'), false);
  }
  if (_shouldStoreMentionAsPromptAssetInput(_0x195565, _0x507157))
    return _insertPromptAssetInputRef(_0x195565, _0x507157, {
      triggerRange: triggerRange,
      atIndex: atIndex,
      pillToEdit: pillToEdit,
    });
  const _0x58600e = (_0x5efc65) => {
    const _0x34f9da = _stripMentionDisplayMarker(_0x507157.label || _0x27647a || '');
    ((_0x5efc65.dataset.label = _0x34f9da),
      _0x507157.origin === 'asset'
        ? ((_0x5efc65.dataset.refOrigin = 'asset'),
          (_0x5efc65.dataset.assetId = String(_0x507157.assetId || '')),
          (_0x5efc65.dataset.assetIndex = String(_0x507157.assetIndex ?? '')),
          (_0x5efc65.dataset.refType = String(_0x1343b5 || _0x507157.type || '')),
          _clearInputMentionPillUnresolved(_0x5efc65),
          delete _0x5efc65.dataset.nodeId,
          _0x5efc65.removeAttribute?.('data-node-id'),
          _renderMentionPillContent(_0x5efc65, _0x34f9da, _getMentionVisual(_0x195565, _0x507157, _0x5efc65)))
        : ((_0x5efc65.dataset.refOrigin = 'node'),
          (_0x5efc65.dataset.nodeId = String(_0x507157.nodeId || _0x3b8704 || '')),
          (_0x1343b5 || _0x507157.type) &&
            (_0x5efc65.dataset.refType = String(_0x1343b5 || _0x507157.type || '')),
          _clearInputMentionPillUnresolved(_0x5efc65),
          delete _0x5efc65.dataset.assetId,
          delete _0x5efc65.dataset.assetIndex,
          _0x5efc65.removeAttribute?.('data-asset-id'),
          _0x5efc65.removeAttribute?.('data-asset-index'),
          _renderMentionPillContent(
            _0x5efc65,
            _0x34f9da,
            _getMentionVisual(_0x195565, _0x507157, _0x5efc65),
          )));
  };
  if (pillToEdit) return (_0x58600e(pillToEdit), _updatePromptHtml(_0x195565), true);
  const _0x11cf45 = window.getSelection(),
    _0x2325bc = triggerRange || (_0x11cf45 && _0x11cf45.rangeCount ? _0x11cf45.getRangeAt(0) : null);
  if (!_0x2325bc || _0x2325bc.startContainer.nodeType !== Node.TEXT_NODE) return false;
  const _0x28cc96 = _0x2325bc.startContainer,
    _0x5460a5 = String(_0x28cc96.textContent || ''),
    _0x1a5967 = _0x2325bc.startOffset,
    _0x4e5e35 =
      Number.isFinite(atIndex) && atIndex >= 0 ? atIndex : _0x5460a5.lastIndexOf('@', _0x1a5967 - 1);
  if (_0x4e5e35 < 0) return false;
  const _0x50d612 = _0x5460a5.slice(0, _0x4e5e35),
    _0x198638 = _0x5460a5.slice(_0x1a5967),
    _0x1d1d02 = document.createTextNode(_0x50d612),
    _0x419cb7 = document.createTextNode(_0x198638),
    _0x4d4b99 = document.createElement('span');
  ((_0x4d4b99.className = 'ref-pill'),
    (_0x4d4b99.contentEditable = 'false'),
    _0x58600e(_0x4d4b99),
    _bindPromptPill(_0x195565, _0x4d4b99),
    _0x28cc96.parentNode.replaceChild(_0x419cb7, _0x28cc96),
    _0x419cb7.parentNode.insertBefore(_0x4d4b99, _0x419cb7),
    _0x419cb7.parentNode.insertBefore(_0x1d1d02, _0x4d4b99));
  const _0x5588da = document.createRange();
  return (
    _0x5588da.setStartAfter(_0x4d4b99),
    _0x5588da.collapse(true),
    _0x11cf45.removeAllRanges(),
    _0x11cf45.addRange(_0x5588da),
    _updatePromptHtml(_0x195565),
    true
  );
}
function _getDirectMentionItems(_0x44ef1c) {
  return Array.from(_0x44ef1c?.children || []).filter((_0x291f0f) =>
    _0x291f0f.classList?.contains('at-mention-item'),
  );
}
function _clearActiveItems(_0x53a58b) {
  _getDirectMentionItems(_0x53a58b).forEach((_0x27d170) => _0x27d170.classList.remove('active'));
}
function _setActiveMentionItem(_0x20f4bf, { focusSubmenu: focusSubmenu = false } = {}) {
  if (!_0x20f4bf) return;
  const _0x1e80d0 = _0x20f4bf.parentElement;
  if (!_0x1e80d0) return;
  (_clearActiveItems(_0x1e80d0),
    _0x20f4bf.classList.add('active'),
    (_mentionMenuState.activeMenu = _0x1e80d0),
    _0x20f4bf.classList.contains('at-mention-has-submenu')
      ? _openMentionSubmenu(_0x20f4bf, { focusSubmenu: focusSubmenu })
      : _closeSiblingMentionSubmenus(_0x20f4bf));
}
function _setInitialMentionActiveItem(_0x369241) {
  const _0x1a069e =
    _getDirectMentionItems(_0x369241).find(
      (_0x999b9a) => !_0x999b9a.classList.contains('at-mention-disabled'),
    ) || _getDirectMentionItems(_0x369241)[0];
  if (_0x1a069e) _setActiveMentionItem(_0x1a069e);
}
function _closeSiblingMentionSubmenus(_0x457387) {
  const _0x10383b = _0x457387?.parentElement;
  if (!_0x10383b) return;
  _getDirectMentionItems(_0x10383b).forEach((_0x381f3b) => {
    if (_0x381f3b === _0x457387) return;
    (_0x381f3b.classList.remove('at-mention-submenu-open'),
      _0x381f3b
        .querySelectorAll('.at-mention-submenu-open')
        .forEach((_0x891bf) => _0x891bf.classList.remove('at-mention-submenu-open')));
  });
}
function _positionMentionSubmenu(_0x4006ae, _0x28247d) {
  if (!_0x4006ae || !_0x28247d || typeof _0x4006ae.getBoundingClientRect !== 'function') return;
  const _0x67d34c = _0x4006ae.getBoundingClientRect(),
    _0x4a9699 = Number(globalThis.window?.innerWidth || 0),
    _0x27048c = Number(globalThis.window?.innerHeight || 0),
    _0x49d70f = 6,
    _0x221963 = 12,
    _0x199f3a = _0x28247d.offsetWidth || 220,
    _0x145d60 = _0x28247d.offsetHeight || 0x140;
  let _0xc6589d = _0x67d34c.right + _0x49d70f;
  _0x4a9699 > 0 &&
    _0xc6589d + _0x199f3a + _0x221963 > _0x4a9699 &&
    (_0xc6589d = Math.max(_0x221963, _0x67d34c.left - _0x199f3a - _0x49d70f));
  let _0x571854 = _0x67d34c.top;
  (_0x27048c > 0 &&
    _0x571854 + _0x145d60 + _0x221963 > _0x27048c &&
    (_0x571854 = Math.max(_0x221963, _0x27048c - _0x145d60 - _0x221963)),
    (_0x28247d.style.left = Math.round(_0xc6589d) + 'px'),
    (_0x28247d.style.top = Math.round(_0x571854) + 'px'),
    _0x27048c > 0 && (_0x28247d.style.maxHeight = Math.max(160, _0x27048c - _0x221963 * 2) + 'px'));
}
function _openMentionSubmenu(_0x18cff3, { focusSubmenu: focusSubmenu = false } = {}) {
  const _0xd68387 = Array.from(_0x18cff3?.children || []).find((_0x4df56a) =>
    _0x4df56a.classList?.contains('at-mention-submenu'),
  );
  if (!_0xd68387) return false;
  return (
    _closeSiblingMentionSubmenus(_0x18cff3),
    _0x18cff3.classList.add('at-mention-submenu-open'),
    _positionMentionSubmenu(_0x18cff3, _0xd68387),
    focusSubmenu
      ? ((_mentionMenuState.activeMenu = _0xd68387), _setInitialMentionActiveItem(_0xd68387))
      : (_mentionMenuState.activeMenu = _0x18cff3.parentElement || _0xd68387),
    true
  );
}
function _activateMentionMenuItem(_0x11fbe9) {
  if (!_0x11fbe9) return false;
  if (_0x11fbe9.classList.contains('at-mention-has-submenu'))
    return _openMentionSubmenu(_0x11fbe9, { focusSubmenu: true });
  if (typeof _0x11fbe9._mentionSelect === 'function') return (_0x11fbe9._mentionSelect(), true);
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
  const _0x345f15 = document.createElement('div');
  ((_0x345f15.className =
    'at-mention-item' +
    (disabled ? ' at-mention-disabled disabled' : '') +
    (hasSubmenu ? ' at-mention-has-submenu' : '')),
    (_0x345f15.title = title || ''));
  const _0x2fbc2d = _getMentionType(iconType);
  if (thumbUrl || thumbNode || _0x2fbc2d === 'text' || _0x2fbc2d === 'audio') {
    const _0x13d95b = document.createElement('span');
    _0x13d95b.className = 'at-mention-visual';
    if (thumbUrl) {
      const _0x496688 = document.createElement('img');
      ((_0x496688.className = 'at-mention-thumb'),
        (_0x496688.src = thumbUrl),
        (_0x496688.alt = ''),
        (_0x496688.draggable = false),
        _0x13d95b.appendChild(_0x496688));
    } else {
      const _0x404f53 = _cloneMentionThumbNode(thumbNode, 'at-mention-thumb', iconType);
      if (_0x404f53) _0x13d95b.appendChild(_0x404f53);
    }
    if (_0x13d95b.childNodes.length) _0x345f15.appendChild(_0x13d95b);
  }
  const _0x470eb8 = document.createElement('span');
  ((_0x470eb8.className = 'at-mention-label'),
    (_0x470eb8.textContent = label),
    _0x345f15.appendChild(_0x470eb8));
  if (Array.isArray(badges) && badges.length > 0) {
    const _0x2a7651 = document.createElement('span');
    ((_0x2a7651.className = 'at-mention-badges'),
      badges.slice(0, 4).forEach((_0x4671cc) => {
        const _0x5717f1 = document.createElement('span');
        ((_0x5717f1.className = 'at-mention-badge'),
          (_0x5717f1.textContent = String(_0x4671cc || '')),
          _0x2a7651.appendChild(_0x5717f1));
      }),
      _0x345f15.appendChild(_0x2a7651));
  }
  if (hasSubmenu) {
    const _0x4fab7b = document.createElement('span');
    ((_0x4fab7b.className = 'at-mention-arrow'),
      (_0x4fab7b.textContent = '>'),
      _0x345f15.appendChild(_0x4fab7b));
  }
  return (
    (_0x345f15._mentionSelect = onSelect),
    _0x345f15.addEventListener('mouseenter', () => {
      _setActiveMentionItem(_0x345f15);
    }),
    _0x345f15.addEventListener('mousedown', (_0x4985bd) => {
      (_0x4985bd.preventDefault(), _0x4985bd.stopPropagation(), _activateMentionMenuItem(_0x345f15));
    }),
    _0x345f15
  );
}
function _appendMentionCandidateItem(
  _0x2148fe,
  _0x119d4c,
  _0xc9b12e,
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  const _0x5be440 = _createMentionMenuItem({
    label: _0xc9b12e.label,
    title: _0xc9b12e.limitReason || '',
    disabled: !!_0xc9b12e.limitReason,
    thumbUrl: _0xc9b12e.thumbUrl || '',
    thumbNode: _0xc9b12e.thumbNode || null,
    iconType: _0xc9b12e.iconType || _0xc9b12e.type || '',
    onSelect: () => {
      if (_0xc9b12e.limitReason) {
        globalThis.window?.showToast?.(_0xc9b12e.limitReason, 'warn');
        return;
      }
      (_insertMentionPill(_0x119d4c, {
        label: _0xc9b12e.label,
        nodeId: _0xc9b12e.nodeId,
        candidate: _0xc9b12e,
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      }),
        _closeMentionMenu());
    },
  });
  return (
    _0xc9b12e.assetName &&
      !_0xc9b12e.limitReason &&
      (_0x5be440.title = _0xc9b12e.assetName + ' · ' + _getAssetTypeMenuLabel(_0xc9b12e.type)),
    _0x2148fe.appendChild(_0x5be440),
    _0x5be440
  );
}
function _getBulkAssetLimitReason(_0x59d71e, _0x33b87e = [], _0x48a673 = null) {
  const _0x41099f = (Array.isArray(_0x33b87e) ? _0x33b87e : []).filter(
    (_0x16c1e7) => _0x16c1e7?.origin === 'asset',
  );
  if (!_0x41099f.length) return nodePromptSharedText('assetUnavailable');
  const _0x3868ce = appStore.getState(),
    _0x56e01a = _0x3868ce.nodes?.[_0x59d71e?.nodeId] || _0x59d71e?._data || {},
    _0x5d0719 = getTargetInputPolicy(_0x56e01a);
  if (_isAdvancedVoiceCloneTarget(_0x56e01a)) {
    const _0x4711aa = _getActualAudioInputKeysForTarget(_0x59d71e?.nodeId, _0x56e01a, _0x3868ce),
      _0x3930b2 = Number(_0x5d0719?.maxByKind?.audio);
    for (const _0x801a62 of _0x41099f) {
      const _0x6f4dfd = _getMentionType(_0x801a62.type);
      if (!_0x6f4dfd) continue;
      if (_0x6f4dfd !== 'audio') {
        const _0x26dc2d = getInputLimitReason(_0x5d0719, _0x6f4dfd, {});
        if (_0x26dc2d) return _0x26dc2d;
        continue;
      }
      const _0x181dd3 = _getMentionAudioInputKey(_0x801a62);
      if (_0x181dd3 && _0x4711aa.has(_0x181dd3)) continue;
      if (Number.isFinite(_0x3930b2) && _0x4711aa.size >= _0x3930b2)
        return getInputLimitReason(_0x5d0719, 'audio', { audio: _0x4711aa.size });
      if (_0x181dd3) _0x4711aa.add(_0x181dd3);
    }
    return '';
  }
  const _0x198852 = _getPromptInputCountState(_0x59d71e?.promptEl, _0x48a673 || null, {
      nodeData: _0x56e01a,
    }),
    _0x25e233 = _0x3868ce.nodes || {};
  appStore.getIncomingEdges(_0x59d71e?.nodeId).forEach((_0xa970cb) => {
    const _0xee409b = resolveEffectiveInputKind(_0x25e233?.[_0xa970cb?.sourceId], _0xa970cb);
    _addInputCount(_0x198852, _0xee409b, _getNodeInputCountKey(_0xa970cb?.sourceId, _0xee409b));
  });
  for (const _0x220a7f of _0x41099f) {
    const _0x3ea8af = _getMentionType(_0x220a7f.type);
    if (!_0x3ea8af) continue;
    if (
      _canReuseAlreadyCountedInputForLimit(_0x3ea8af) &&
      _isMentionAlreadyCounted(_0x198852, _0x220a7f, _0x3ea8af)
    )
      continue;
    const _0x3ae335 = getInputLimitReason(_0x5d0719, _0x3ea8af, _0x198852.counts);
    if (_0x3ae335) return _0x3ae335;
    _addInputCount(_0x198852, _0x3ea8af, _getMentionInputCountKey(_0x220a7f, _0x3ea8af));
  }
  return '';
}
function _createMentionPillForCandidate(_0x2fc370, _0x7090df = null) {
  const _0x43f8f9 = document.createElement('span');
  ((_0x43f8f9.className = 'ref-pill'), (_0x43f8f9.contentEditable = 'false'));
  const _0x31eb77 = _getMentionType(_0x2fc370?.type),
    _0x2afc7f = _stripMentionDisplayMarker(_0x2fc370?.label || '');
  _0x43f8f9.dataset.label = _0x2afc7f;
  if (_0x2fc370?.origin === 'asset')
    return (
      (_0x43f8f9.dataset.refOrigin = 'asset'),
      (_0x43f8f9.dataset.assetId = String(_0x2fc370.assetId || '')),
      (_0x43f8f9.dataset.assetIndex = String(_0x2fc370.assetIndex ?? '')),
      (_0x43f8f9.dataset.refType = String(_0x31eb77 || _0x2fc370.type || '')),
      _renderMentionPillContent(_0x43f8f9, _0x2afc7f, _getMentionVisual(_0x7090df, _0x2fc370, _0x43f8f9)),
      _0x43f8f9
    );
  return (
    (_0x43f8f9.dataset.refOrigin = 'node'),
    (_0x43f8f9.dataset.nodeId = String(_0x2fc370?.nodeId || '')),
    (_0x31eb77 || _0x2fc370?.type) && (_0x43f8f9.dataset.refType = String(_0x31eb77 || _0x2fc370.type || '')),
    _renderMentionPillContent(_0x43f8f9, _0x2afc7f, _getMentionVisual(_0x7090df, _0x2fc370, _0x43f8f9)),
    _0x43f8f9
  );
}
function _insertMentionPills(
  _0x1c04ae,
  _0x5969bf = [],
  { triggerRange: triggerRange = null, atIndex: atIndex = -1, pillToEdit: pillToEdit = null } = {},
) {
  if (!_0x1c04ae?.promptEl) return false;
  const _0x5c9d94 = (Array.isArray(_0x5969bf) ? _0x5969bf : []).filter(Boolean);
  if (!_0x5c9d94.length) return false;
  if (pillToEdit) return _insertMentionPill(_0x1c04ae, { candidate: _0x5c9d94[0], pillToEdit: pillToEdit });
  const _0x4888bd = _0x5c9d94.filter((_0x44ba32) =>
      _shouldStoreMentionAsPromptAssetInput(_0x1c04ae, _0x44ba32),
    ),
    _0x19a158 = _0x5c9d94.filter((_0x3c23f9) => !_shouldStoreMentionAsPromptAssetInput(_0x1c04ae, _0x3c23f9));
  if (!_0x19a158.length) {
    const _0x2c9d85 = _appendPromptAssetInputRefRecords(_0x1c04ae, _0x4888bd);
    if (!_consumeMentionTriggerText({ triggerRange: triggerRange, atIndex: atIndex })) return false;
    return _commitPromptAndAssetInputRefs(_0x1c04ae, _0x2c9d85);
  }
  const _0x406ebc = window.getSelection(),
    _0x1f6b70 = triggerRange || (_0x406ebc && _0x406ebc.rangeCount ? _0x406ebc.getRangeAt(0) : null);
  if (!_0x1f6b70 || _0x1f6b70.startContainer.nodeType !== Node.TEXT_NODE) return false;
  const _0x5007c6 = _0x1f6b70.startContainer,
    _0x309411 = String(_0x5007c6.textContent || ''),
    _0xf01dc = _0x1f6b70.startOffset,
    _0x316eae = Number.isFinite(atIndex) && atIndex >= 0 ? atIndex : _0x309411.lastIndexOf('@', _0xf01dc - 1);
  if (_0x316eae < 0) return false;
  const _0x2c00ca = document.createTextNode(_0x309411.slice(0, _0x316eae)),
    _0x509479 = document.createTextNode(_0x309411.slice(_0xf01dc)),
    _0x26ce87 = _0x5007c6.parentNode;
  if (!_0x26ce87) return false;
  _0x26ce87.replaceChild(_0x509479, _0x5007c6);
  const _0x7b5230 = [];
  (_0x19a158.forEach((_0x597dca, _0xec96c0) => {
    _0xec96c0 > 0 && _0x26ce87.insertBefore(document.createTextNode('\xa0'), _0x509479);
    const _0x248db1 = _createMentionPillForCandidate(_0x597dca, _0x1c04ae);
    (_bindPromptPill(_0x1c04ae, _0x248db1),
      _0x7b5230.push(_0x248db1),
      _0x26ce87.insertBefore(_0x248db1, _0x509479));
  }),
    _0x26ce87.insertBefore(_0x2c00ca, _0x7b5230[0] || _0x509479));
  const _0x1c7081 = document.createRange(),
    _0x50f4bc = _0x7b5230[_0x7b5230.length - 1];
  return (
    _0x1c7081.setStartAfter(_0x50f4bc),
    _0x1c7081.collapse(true),
    _0x406ebc.removeAllRanges(),
    _0x406ebc.addRange(_0x1c7081),
    _0x4888bd.length
      ? _commitPromptAndAssetInputRefs(_0x1c04ae, _appendPromptAssetInputRefRecords(_0x1c04ae, _0x4888bd))
      : _updatePromptHtml(_0x1c04ae),
    true
  );
}
function _appendMentionDivider(_0x1b9afc) {
  const _0x2a2e15 = document.createElement('div');
  return ((_0x2a2e15.className = 'at-mention-divider'), _0x1b9afc.appendChild(_0x2a2e15), _0x2a2e15);
}
function _createMentionSubmenu({ leaf: leaf = false } = {}) {
  const _0x453cdf = document.createElement('div');
  return (
    (_0x453cdf.className =
      'at-mention-menu at-mention-submenu' +
      (leaf ? ' at-mention-leaf-submenu' : ' at-mention-branch-submenu')),
    _0x453cdf.addEventListener('mouseenter', () => {
      _mentionMenuState.activeMenu = _0x453cdf;
    }),
    _0x453cdf
  );
}
export function _populateMentionMenu(
  _0x45b73d,
  {
    x: _0x456577,
    y: _0x28d05b,
    triggerRange: triggerRange = null,
    query: query = '',
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
  } = {},
) {
  const _0x3224b = _getMentionMenu();
  _cleanupMentionMenuLifecycle();
  const _0x3c7dda = _buildMentionCandidates(_0x45b73d, query, { excludePill: pillToEdit || null }),
    _0x41a8d0 = _buildMentionMenuTree(_0x3c7dda);
  _0x3224b.innerHTML = '';
  if (!_0x3c7dda.length) return (_closeMentionMenu(), false);
  return (
    _0x41a8d0.nodeItems.forEach((_0x205d61) => {
      _appendMentionCandidateItem(_0x3224b, _0x45b73d, _0x205d61, {
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      });
    }),
    _0x41a8d0.nodeItems.length && _0x41a8d0.assetItems.length && _appendMentionDivider(_0x3224b),
    _0x41a8d0.assetItems.forEach((_0x5bd0a0) => {
      const _0x460511 = _createMentionMenuItem({ label: _0x5bd0a0.label, hasSubmenu: true }),
        _0x7397ef = _createMentionSubmenu(),
        _0x211d11 = _getBulkAssetLimitReason(_0x45b73d, _0x5bd0a0.items, pillToEdit),
        _0x2dd753 = _createMentionMenuItem({
          label: nodePromptSharedText('useEntireAsset'),
          title: _0x211d11,
          disabled: !!_0x211d11,
          onSelect: () => {
            if (_0x211d11) {
              globalThis.window?.showToast?.(_0x211d11, 'warn');
              return;
            }
            (_insertMentionPills(_0x45b73d, _0x5bd0a0.items, {
              triggerRange: triggerRange,
              atIndex: atIndex,
              pillToEdit: pillToEdit,
            }),
              _closeMentionMenu());
          },
        });
      (_0x7397ef.appendChild(_0x2dd753),
        _appendMentionDivider(_0x7397ef),
        _0x5bd0a0.items.forEach((_0x5a4d48) => {
          _appendMentionCandidateItem(_0x7397ef, _0x45b73d, _0x5a4d48, {
            triggerRange: triggerRange,
            atIndex: atIndex,
            pillToEdit: pillToEdit,
          });
        }),
        _0x460511.appendChild(_0x7397ef),
        _0x3224b.appendChild(_0x460511));
    }),
    (_0x3224b.style.display = 'flex'),
    (_0x3224b.style.pointerEvents = 'auto'),
    (_0x3224b.style.bottom = ''),
    (_0x3224b.style.marginTop = ''),
    (_0x3224b.style.marginBottom = ''),
    (_0x3224b.style.transformOrigin = ''),
    (_mentionMenuPositionState = {
      menu: _0x3224b,
      triggerRange: triggerRange,
      pillToEdit: pillToEdit,
      fallbackX: Number(_0x456577),
      fallbackY: Number(_0x28d05b),
    }),
    _positionMentionMenu(),
    (_mentionMenuState.activeMenu = _0x3224b),
    _setInitialMentionActiveItem(_0x3224b),
    _watchMentionViewport(),
    _bindMentionOutsideDocClick(_0x3224b),
    true
  );
}
export function _checkAtTrigger(_0x10a11e, _0x231f66) {
  if (_0x231f66?.inputType === 'insertCompositionText') return false;
  const _0x538f17 = window.getSelection();
  if (!_0x538f17.rangeCount) return false;
  const _0x4c7ebb = _0x538f17.getRangeAt(0).cloneRange();
  if (_0x4c7ebb.startContainer.nodeType !== Node.TEXT_NODE) return (_closeMentionMenu(), false);
  const _0x3810b3 = String(_0x4c7ebb.startContainer.textContent || '').slice(0, _0x4c7ebb.startOffset),
    _0x141071 = _0x3810b3.lastIndexOf('@');
  if (_0x141071 === -1) return (_closeMentionMenu(), false);
  const _0x1e5257 = _0x3810b3.slice(_0x141071 + 1);
  if (_0x1e5257.length > 20) return (_closeMentionMenu(), false);
  const _0x34f3ed = _0x4c7ebb.getBoundingClientRect();
  return _populateMentionMenu(_0x10a11e, {
    x: _0x34f3ed.left,
    y: _0x34f3ed.bottom + 5,
    triggerRange: _0x4c7ebb,
    query: _0x1e5257,
    atIndex: _0x141071,
  });
}
export function _handleMentionMenuKeyboard(_0x547e) {
  const _0x41c9fd = _getMentionMenu();
  if (_0x41c9fd.style.display !== 'flex') return false;
  const _0x4a2e5c = _mentionMenuState.activeMenu || _0x41c9fd,
    _0x440734 = _getDirectMentionItems(_0x4a2e5c);
  if (!_0x440734.length) {
    if (_0x547e.key === 'Escape') return (_0x547e.preventDefault(), _closeMentionMenu(), true);
    return false;
  }
  let _0x463a07 = _0x440734.findIndex((_0x19d2a3) => _0x19d2a3.classList.contains('active'));
  if (_0x463a07 < 0) _0x463a07 = 0;
  if (_0x547e.key === 'ArrowDown')
    return (
      _0x547e.preventDefault(),
      (_0x463a07 = _0x463a07 < _0x440734.length - 1 ? _0x463a07 + 1 : 0),
      _setActiveMentionItem(_0x440734[_0x463a07]),
      _0x440734[_0x463a07]?.scrollIntoView({ block: 'nearest' }),
      true
    );
  if (_0x547e.key === 'ArrowUp')
    return (
      _0x547e.preventDefault(),
      (_0x463a07 = _0x463a07 > 0 ? _0x463a07 - 1 : _0x440734.length - 1),
      _setActiveMentionItem(_0x440734[_0x463a07]),
      _0x440734[_0x463a07]?.scrollIntoView({ block: 'nearest' }),
      true
    );
  if (_0x547e.key === 'ArrowRight') {
    _0x547e.preventDefault();
    if (_0x463a07 >= 0) _openMentionSubmenu(_0x440734[_0x463a07], { focusSubmenu: true });
    return true;
  }
  if (_0x547e.key === 'ArrowLeft') {
    _0x547e.preventDefault();
    if (_0x4a2e5c !== _0x41c9fd && _0x4a2e5c.parentElement) {
      const _0x229dae = _0x4a2e5c.parentElement,
        _0x11cff9 = _0x229dae.parentElement || _0x41c9fd;
      (_0x229dae.classList.remove('at-mention-submenu-open'),
        _clearActiveItems(_0x11cff9),
        _0x229dae.classList.add('active'),
        (_mentionMenuState.activeMenu = _0x11cff9));
    }
    return true;
  }
  if (_0x547e.key === 'Enter') {
    _0x547e.preventDefault();
    if (_0x463a07 >= 0) _activateMentionMenuItem(_0x440734[_0x463a07]);
    return true;
  }
  if (_0x547e.key === 'Escape') return (_0x547e.preventDefault(), _closeMentionMenu(), true);
  return false;
}
export function _bindPromptPill(_0x565f80, _0x120d8a) {
  if (!_0x120d8a) return;
  _0x120d8a.querySelectorAll('.pill-del').forEach((_0x58e7a9) => _0x58e7a9.remove());
  const _0x1f75ee = _stripMentionDisplayMarker(
    String(_0x120d8a.dataset.label || _0x120d8a.textContent || '').replace(/[×✕✖]/g, ''),
  );
  ((_0x120d8a.dataset.label = _0x1f75ee),
    _renderMentionPillContent(_0x120d8a, _0x1f75ee, _getMentionVisual(_0x565f80, null, _0x120d8a)),
    _isUnresolvedInputMentionPill(_0x120d8a) &&
      (_0x120d8a.classList?.add?.('ref-pill--unresolved'),
      (_0x120d8a.title = 'Input reference is not bound in this node.')),
    (_0x120d8a.onmousedown = (_0x1a4b04) => {
      (_0x1a4b04.preventDefault(), _0x1a4b04.stopPropagation());
      const _0x49f123 = _0x120d8a.getBoundingClientRect();
      _populateMentionMenu(_0x565f80, {
        x: _0x49f123.left,
        y: _0x49f123.bottom + 5,
        pillToEdit: _0x120d8a,
        query: '',
        atIndex: -1,
        triggerRange: null,
      });
    }));
}
export function _rehydratePromptPills(_0x5e59ab) {
  if (!_0x5e59ab?.promptEl) return;
  _0x5e59ab.promptEl.querySelectorAll('.ref-pill').forEach((_0x3ffd02) => {
    _bindPromptPill(_0x5e59ab, _0x3ffd02);
  });
}
const CARET_SPACER_TEXT_RE = /^[\u00A0\u200B\u200C\u200D\uFEFF]*$/;
function _isCaretSpacerTextNode(_0x415e83) {
  return !!(
    _0x415e83 &&
    _0x415e83.nodeType === Node.TEXT_NODE &&
    CARET_SPACER_TEXT_RE.test(String(_0x415e83.textContent || ''))
  );
}
function _findRefPillNearNode(_0x24e8bd, _0x5d049e) {
  let _0x3c2e3f = _0x24e8bd || null;
  while (_0x3c2e3f) {
    if (_isRefPillNode(_0x3c2e3f)) return _0x3c2e3f;
    if (!_isCaretSpacerTextNode(_0x3c2e3f)) return null;
    _0x3c2e3f = _0x5d049e === 'previous' ? _0x3c2e3f.previousSibling : _0x3c2e3f.nextSibling;
  }
  return null;
}
function _getSelectedRefPill(_0x427fb3) {
  const _0x562a97 = _0x427fb3?.startContainer,
    _0x5bd7e0 = _0x427fb3?.endContainer;
  if (!_0x562a97 || _0x562a97 !== _0x5bd7e0 || _0x562a97.nodeType !== Node.ELEMENT_NODE) return null;
  if (_0x427fb3.endOffset - _0x427fb3.startOffset !== 1) return null;
  return _isRefPillNode(_0x562a97.childNodes?.[_0x427fb3.startOffset])
    ? _0x562a97.childNodes[_0x427fb3.startOffset]
    : null;
}
export function _handlePillKeyboard(_0x2d78ac, _0x4cec3a) {
  if (!_0x2d78ac?.promptEl) return false;
  if (_0x4cec3a.key !== 'Backspace' && _0x4cec3a.key !== 'Delete') return false;
  const _0x270333 = window.getSelection();
  if (!_0x270333.rangeCount) return false;
  const _0x50a6f8 = _0x270333.getRangeAt(0);
  if (!_0x50a6f8.collapsed) {
    const _0x4f554a = _getSelectedRefPill(_0x50a6f8);
    if (!_0x4f554a) return false;
    return (_0x4cec3a.preventDefault(), _0x4f554a.remove(), _updatePromptHtml(_0x2d78ac), true);
  }
  const _0x105412 = _0x50a6f8.startContainer,
    _0x11d52a = _0x50a6f8.startOffset;
  let _0x32a1ad = null;
  if (_0x105412.nodeType === Node.TEXT_NODE) {
    const _0x1114de = String(_0x105412.textContent || '');
    if (
      _0x4cec3a.key === 'Backspace' &&
      (_0x11d52a === 0 || CARET_SPACER_TEXT_RE.test(_0x1114de.slice(0, _0x11d52a)))
    ) {
      _0x32a1ad = _findRefPillNearNode(_0x105412.previousSibling, 'previous');
      if (_0x32a1ad && _0x11d52a > 0) _0x105412.textContent = _0x1114de.slice(_0x11d52a);
    } else {
      if (
        _0x4cec3a.key === 'Delete' &&
        (_0x11d52a === _0x1114de.length || CARET_SPACER_TEXT_RE.test(_0x1114de.slice(_0x11d52a)))
      ) {
        _0x32a1ad = _findRefPillNearNode(_0x105412.nextSibling, 'next');
        if (_0x32a1ad && _0x11d52a < _0x1114de.length) _0x105412.textContent = _0x1114de.slice(0, _0x11d52a);
      }
    }
  } else {
    if (_0x105412.nodeType === Node.ELEMENT_NODE) {
      if (_0x4cec3a.key === 'Backspace' && _0x11d52a > 0)
        _0x32a1ad = _findRefPillNearNode(_0x105412.childNodes[_0x11d52a - 1], 'previous');
      else
        _0x4cec3a.key === 'Delete' &&
          _0x11d52a < _0x105412.childNodes.length &&
          (_0x32a1ad = _findRefPillNearNode(_0x105412.childNodes[_0x11d52a], 'next'));
    }
  }
  if (_isRefPillNode(_0x32a1ad))
    return (_0x4cec3a.preventDefault(), _0x32a1ad.remove(), _updatePromptHtml(_0x2d78ac), true);
  return false;
}
export function _handlePillHover(_0x5a9dea, _0x5eb139) {
  const _0x27e4cd = _0x5a9dea.target.closest('.ref-pill');
  if (!_0x27e4cd || !_0x5eb139.refBarEl) return;
  const _0x20288c = _0x27e4cd.dataset.nodeId;
  if (!_0x20288c) return;
  const _0xff6235 = _0x5eb139.refBarEl.querySelector('.ref-thumb-wrap[data-source-id="' + _0x20288c + '"]');
  _0xff6235 &&
    (_0xff6235.classList.add('highlight'),
    _0xff6235.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }));
}
export function _handlePillOut(_0x9d01e6, _0x5e6e51) {
  const _0x177214 = _0x9d01e6.target.closest('.ref-pill');
  if (!_0x177214 || !_0x5e6e51.refBarEl) return;
  const _0x516d9f = _0x177214.dataset.nodeId;
  if (!_0x516d9f) return;
  const _0x581e84 = _0x5e6e51.refBarEl.querySelector('.ref-thumb-wrap[data-source-id="' + _0x516d9f + '"]');
  _0x581e84 && _0x581e84.classList.remove('highlight');
}
export function _syncEdgesOrderFromPills(_0xdfa0f0, { allowReorder: allowReorder = false } = {}) {
  if (!allowReorder) return false;
  if (!_0xdfa0f0?.promptEl || typeof _0xdfa0f0.promptEl.querySelectorAll !== 'function') return false;
  const _0x974cd = Array.from(_0xdfa0f0.promptEl.querySelectorAll('.ref-pill'));
  if (_0x974cd.length === 0) return false;
  const _0xb74c66 = appStore
    .getIncomingEdges(_0xdfa0f0.nodeId)
    .filter((_0x4fcb01) => !_0x4fcb01?.isGroupShared && _0x4fcb01?.targetId === _0xdfa0f0.nodeId);
  if (_0xb74c66.length <= 1) return false;
  const _0x5162b3 = _0x974cd.map((_0x23b813) => _0x23b813.dataset.nodeId).filter(Boolean);
  if (_0x5162b3.length === 0) return false;
  const _0x35ad39 = _0xb74c66.map((_0x32c9c6) => _0x32c9c6.id),
    _0x38d14f = {};
  _0xb74c66.forEach((_0x281157) => {
    if (!_0x38d14f[_0x281157.sourceId]) _0x38d14f[_0x281157.sourceId] = [];
    _0x38d14f[_0x281157.sourceId].push(_0x281157);
  });
  const _0x20acd6 = [];
  (_0x5162b3.forEach((_0x56405e) => {
    _0x38d14f[_0x56405e]?.length > 0 && _0x20acd6.push(_0x38d14f[_0x56405e].shift());
  }),
    Object.values(_0x38d14f).forEach((_0x32f5ca) => _0x20acd6.push(..._0x32f5ca)));
  const _0x3b7c55 = _0x20acd6.map((_0x5adfc4) => _0x5adfc4.id);
  if (JSON.stringify(_0x35ad39) !== JSON.stringify(_0x3b7c55))
    return ((_0xdfa0f0._isDraggingSorting = false), appStore.updateEdgesBatch(_0x35ad39, _0x20acd6), true);
  return false;
}
export function _syncPillLabels(_0x1940e6, _0x3fa739) {
  if (!_0x1940e6.promptEl) return;
  const _0x5af196 = _0x1940e6.promptEl.querySelectorAll('.ref-pill');
  if (!_0x5af196.length) return;
  let _0x53054e = false;
  (_0x5af196.forEach((_0x4e3ae9) => {
    if (_isAssetMentionPill(_0x4e3ae9)) return;
    const _0x118f07 = _0x4e3ae9.dataset.nodeId;
    if (!_0x118f07) return;
    if (_0x3fa739[_0x118f07]) {
      const _0x1e9994 = _stripMentionDisplayMarker(_0x3fa739[_0x118f07]),
        _0xf42c1a = _0x4e3ae9.querySelector?.('.ref-pill-label'),
        _0x176edd = String(
          _0x4e3ae9.dataset.label || _0xf42c1a?.textContent || _0x4e3ae9.textContent || '',
        ).trim(),
        _0x21fb0d = _getMentionVisual(_0x1940e6, null, _0x4e3ae9),
        _0x342fe0 =
          _0x176edd !== _0x1e9994 ||
          !_0x4e3ae9.querySelector?.('.ref-pill-label') ||
          !_isPillVisualCurrent(_0x4e3ae9, _0x21fb0d) ||
          !!_0x4e3ae9.querySelector?.('.pill-del');
      _0x342fe0 &&
        ((_0x4e3ae9.dataset.label = _0x1e9994),
        _renderMentionPillContent(_0x4e3ae9, _0x1e9994, _0x21fb0d),
        (_0x53054e = true));
    } else (_0x4e3ae9.remove(), (_0x53054e = true));
  }),
    _0x53054e && _updatePromptHtml(_0x1940e6, { renderRefBar: false }));
}

function _findLastMentionTriggerIndex(_0x4b38b7,_0x54dbdb){const _0x164049=Number["isFinite"](_0x54dbdb)?_0x54dbdb-0x1:undefined;return Math['max'](String(_0x4b38b7||'')["lastIndexOf"]('@',_0x164049),String(_0x4b38b7||'')["lastIndexOf"]('＠',_0x164049));}

function _getNodeMentionDisplayLabel(_0x18d6cc={},_0x467a03=''){const _0x446ce3=[_0x18d6cc?.["name"],_0x18d6cc?.["title"],_0x18d6cc?.["label"],_0x18d6cc?.["displayName"]]["map"](_0x535c06=>_stripMentionDisplayMarker(_0x535c06))["find"](Boolean);return _0x446ce3||_stripMentionDisplayMarker(_0x467a03);}

export function resolveTextReferenceContent(_0x1b77c7){const _0x274200=String(_0x1b77c7?.["type"]||'')["trim"]()["toLowerCase"]();if(_0x274200==="source-text"||_0x274200==="text"){const _0x9fd16c=typeof _0x1b77c7?.["content"]==="string"?_0x1b77c7['content']:_0x1b77c7?.["text"]||_0x1b77c7?.["outputText"]||_0x1b77c7?.["prompt"]||_0x1b77c7?.['label']||'';return String(_0x9fd16c)["trim"]();}return String(_0x1b77c7?.["outputText"]||_0x1b77c7?.["text"]||_0x1b77c7?.["content"]||_0x1b77c7?.['prompt']||_0x1b77c7?.["label"]||'')["trim"]();}

function _decorateMentionPill(_0x2a53fb,_0x10e2d9,_0x462b2a=null){if(typeof _0x2a53fb?.["decorateMentionPill"]!=='function')return;_0x2a53fb['decorateMentionPill']({'pill':_0x10e2d9,'mention':_0x462b2a});}

export function createPromptMediaReferenceState(_0x2be96e=[]){const _0x2d0164={'image':0x0,'video':0x0,'audio':0x0},_0x76a9b6=new Map();for(const _0x47fe09 of _0x2be96e){const _0x37b3cc=normalizePromptMentionType(_0x47fe09["type"]),_0x5ac7a3=String(_0x47fe09['url']||'')['trim']();if(!(_0x37b3cc in _0x2d0164)||!_0x5ac7a3||_0x76a9b6["has"](_0x37b3cc+':'+_0x5ac7a3))continue;_0x2d0164[_0x37b3cc]+=0x1,_0x76a9b6["set"](_0x37b3cc+':'+_0x5ac7a3,getMentionPlaceholderLabel(_0x37b3cc,_0x2d0164[_0x37b3cc]));}return{'mediaCounts':_0x2d0164,'dedupeState':_0x76a9b6};}

function _readPromptHtmlForCommit(_0x5897db){const _0x4db631=serializeVirtualizedPromptHtml(_0x5897db?.['promptEl']),_0x7778bc=_0x4db631===null?sanitizePromptHtml(_0x5897db?.["promptEl"]?.["innerHTML"]||''):_0x4db631,_0x24398f=_isEmptyPromptHtml(_0x7778bc)?'':_0x7778bc;return rememberVirtualizedPromptCommit(_0x5897db,_0x24398f),_0x24398f;}

export function bindPromptMentionHost(_0x529e94,{enablePaste:enablePaste=!![],enableSelectAll:enableSelectAll=!![],ignoreInlineEditor:ignoreInlineEditor=!![],inlineEditorSelector:inlineEditorSelector="[data-prompt-pill-inline-editor=\"true\"]",rehydrate:rehydrate=!![],commitHydratedPrompt:commitHydratedPrompt=!![],closeMenuOnDestroy:closeMenuOnDestroy=!![]}={}){const _0x38d655=_0x529e94?.["promptEl"];if(!_0x38d655?.['addEventListener'])return null;const _0xadb0d1=_0x23d20d=>ignoreInlineEditor&&Boolean(_0x23d20d?.["target"]?.["closest"]?.(inlineEditorSelector)),_0x34232c=_0x1720c8=>{if(_0xadb0d1(_0x1720c8))return;schedulePromptHtmlCommit(_0x529e94),_checkAtTrigger(_0x529e94,_0x1720c8);},_0xeb8a74=()=>{flushPromptHtmlCommit(_0x529e94);},_0x272fda=_0x425c1b=>{if(_0xadb0d1(_0x425c1b))return;if(_handleMentionMenuKeyboard(_0x425c1b))return;if(enableSelectAll&&handlePromptSelectAll(_0x529e94,_0x425c1b))return;_handlePillKeyboard(_0x529e94,_0x425c1b);},_0x5e2d4b=_0x46ab8b=>{if(_0xadb0d1(_0x46ab8b))return;handlePromptPaste(_0x529e94,_0x46ab8b);};_0x38d655["addEventListener"]("input",_0x34232c),_0x38d655["addEventListener"]("blur",_0xeb8a74),_0x38d655['addEventListener']('keydown',_0x272fda);if(enablePaste)_0x38d655["addEventListener"]("paste",_0x5e2d4b);if(rehydrate)_rehydratePromptPills(_0x529e94);if(commitHydratedPrompt&&typeof _0x529e94['getPromptHtml']==="function"&&typeof _0x529e94["commitPromptHtml"]==="function"){const _0x252927=_readPromptHtmlForCommit(_0x529e94);_0x252927!==_0x529e94["getPromptHtml"]()&&_0x529e94["commitPromptHtml"](_0x252927);}let _0x211083=![];return{'destroy'(){if(_0x211083)return;_0x211083=!![];if(closeMenuOnDestroy)_closeMentionMenu();flushPromptHtmlCommit(_0x529e94),_0x38d655["removeEventListener"]?.("input",_0x34232c),_0x38d655["removeEventListener"]?.("blur",_0xeb8a74),_0x38d655["removeEventListener"]?.('keydown',_0x272fda);if(enablePaste)_0x38d655['removeEventListener']?.("paste",_0x5e2d4b);}};}

function _appendMentionSectionLabel(_0x18e38d,_0x496bbb){const _0x4a9323=document["createElement"]("div");return _0x4a9323["className"]="at-mention-section-label",_0x4a9323["textContent"]=String(_0x496bbb||''),_0x18e38d["appendChild"](_0x4a9323),_0x4a9323;}

function _appendMentionGroupLabel(_0x4a2bf1,_0x440d05){const _0x57da0c=document["createElement"]('div');return _0x57da0c["className"]="at-mention-group-label",_0x57da0c["textContent"]=String(_0x440d05||''),_0x4a2bf1['appendChild'](_0x57da0c),_0x57da0c;}

function _applyMentionPillPresentation(_0xe04b1d,_0x2ba3b9={}){if(!_0xe04b1d)return;const _0x5c0c62=String(_0x2ba3b9?.['pillKind']||'')["trim"]();if(_0x5c0c62)_0xe04b1d["dataset"]["promptPillKind"]=_0x5c0c62;else delete _0xe04b1d["dataset"]["promptPillKind"];_0xe04b1d['classList']?.["toggle"]?.("story-time-pill",_0x5c0c62==="time");const _0x2fc685=_0x2ba3b9?.['missingAsset']===!![];_0xe04b1d["classList"]?.["toggle"]?.('ref-pill--unresolved',_0x2fc685);if(_0x2fc685)_0xe04b1d["dataset"]['refUnresolved']="true",_0xe04b1d["title"]="缺少图片素材";else{_0xe04b1d['dataset']?.["refUnresolved"]==="true"&&_0x2ba3b9?.["origin"]==="asset"&&delete _0xe04b1d['dataset']['refUnresolved'];if(_0xe04b1d["title"]==="缺少图片素材")_0xe04b1d["removeAttribute"]?.('title');}}

function _populateMentionMenuTree(_0x46ca79,_0x421ade,_0x5bbad6,{triggerRange:triggerRange=null,atIndex:atIndex=-0x1,pillToEdit:pillToEdit=null}={}){let _0x5cbd74='',_0x3f7689='',_0x546041=0x0;_0x5bbad6["nodeItems"]['forEach'](_0x3e7822=>{const _0x118a3e=String(_0x3e7822["menuGroup"]||'')["trim"](),_0x5cbb45=String(_0x3e7822["menuSection"]||'')["trim"]();if(_0x118a3e&&_0x118a3e!==_0x5cbd74){if(_0x546041>0x0)_appendMentionDivider(_0x46ca79);_appendMentionGroupLabel(_0x46ca79,_0x118a3e),_0x3f7689='';}_0x5cbd74=_0x118a3e,_0x5cbb45&&_0x5cbb45!==_0x3f7689&&_appendMentionSectionLabel(_0x46ca79,_0x5cbb45),_0x3f7689=_0x5cbb45,_appendMentionCandidateItem(_0x46ca79,_0x421ade,_0x3e7822,{'triggerRange':triggerRange,'atIndex':atIndex,'pillToEdit':pillToEdit}),_0x546041+=0x1;}),_0x5bbad6["nodeItems"]["length"]&&_0x5bbad6["assetItems"]["length"]&&_appendMentionDivider(_0x46ca79),_0x5bbad6["assetItems"]["forEach"](_0x3f99bc=>{const _0x114b7b=_createMentionMenuItem({'label':_0x3f99bc["label"],'subtitle':_0x3f99bc["subtitle"],'hasSubmenu':!![]}),_0x158915=_createMentionSubmenu();if(!_0x3f99bc["suppressBulkMention"]){const _0x2b5755=_getBulkAssetLimitReason(_0x421ade,_0x3f99bc["items"],pillToEdit),_0x402ff9=_createMentionMenuItem({'label':nodePromptSharedText('useEntireAsset'),'title':_0x2b5755,'disabled':!!_0x2b5755,'onSelect':()=>{if(_0x2b5755){globalThis["window"]?.["showToast"]?.(_0x2b5755,"warn");return;}_insertMentionPills(_0x421ade,_0x3f99bc["items"],{'triggerRange':triggerRange,'atIndex':atIndex,'pillToEdit':pillToEdit}),_closeMentionMenu();}});_0x158915["appendChild"](_0x402ff9),_appendMentionDivider(_0x158915);}_0x3f99bc["items"]["forEach"](_0x31482d=>{_appendMentionCandidateItem(_0x158915,_0x421ade,_0x31482d,{'triggerRange':triggerRange,'atIndex':atIndex,'pillToEdit':pillToEdit});}),_0x114b7b["appendChild"](_0x158915),_0x46ca79["appendChild"](_0x114b7b);});}

function _getMentionMenuPages(_0x3eb0ce,_0xb7b368=[]){const _0x82e70a=typeof _0x3eb0ce?.["getMentionMenuPages"]==='function'?_0x3eb0ce["getMentionMenuPages"]({'candidates':_0xb7b368}):[];if(!Array['isArray'](_0x82e70a)||_0x82e70a['length']<0x2)return[];const _0x1daefe=new Set();return _0x82e70a['map'](_0x5013d3=>({'id':String(_0x5013d3?.['id']||'')["trim"](),'label':String(_0x5013d3?.["label"]||'')["trim"](),'icon':["assets","tools"]["includes"](String(_0x5013d3?.["icon"]||'')["trim"]())?String(_0x5013d3["icon"])["trim"]():''}))["filter"](_0x4a601c=>{if(!_0x4a601c['id']||!_0x4a601c["label"]||_0x1daefe["has"](_0x4a601c['id']))return![];return _0x1daefe["add"](_0x4a601c['id']),!![];});}

function _createMentionMenuPageIcon(_0x3c9701){const _0x557064=String(_0x3c9701||'')["trim"]();if(!_0x557064)return null;const _0x42b7e5=document['createElement']("span");return _0x42b7e5["className"]="at-mention-tab-icon",_0x42b7e5["dataset"]["icon"]=_0x557064,_0x42b7e5["setAttribute"]("aria-hidden","true"),_0x42b7e5["innerHTML"]=_0x557064==="tools"?"<svg viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5l-7.7 7.7a2 2 0 1 0 2.8 2.8z\"/><path d=\"m16 15 4.5 4.5\"/></svg>":'<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22><path\x20d=\x22M4\x206.5h6l1.7\x202H20v9.5a2\x202\x200\x200\x201-2\x202H6a2\x202\x200\x200\x201-2-2z\x22/><path\x20d=\x22M4\x209h16\x22/></svg>',_0x42b7e5;}

function _appendMentionMenuPages(_0x4ad620,_0x4cb8c9,_0x398323,_0x5081c5){const _0x410cf3=_getMentionMenuPages(_0x4cb8c9,_0x398323);if(_0x410cf3["length"]<0x2)return null;const _0x177fa2=document["createElement"]("div");_0x177fa2["className"]="at-mention-tabs",_0x177fa2["setAttribute"]('role',"tablist"),_0x177fa2["setAttribute"]("aria-label","@ 功能分类"),_0x4ad620["appendChild"](_0x177fa2);const _0x42cb45=document['createElement']("div");_0x42cb45["className"]='at-mention-pages';const _0x200756=document['createElement']("div");_0x200756["className"]="at-mention-pages-track",_0x200756["style"]['width']=_0x410cf3["length"]*0x64+'%',_0x200756["style"]["gridTemplateColumns"]="repeat("+_0x410cf3["length"]+", minmax(0, 1fr))",_0x42cb45["appendChild"](_0x200756),_0x4ad620["appendChild"](_0x42cb45);const _0xe329bb=String(_0x4cb8c9?.["getMentionMenuDefaultPage"]?.({'candidates':_0x398323})||_0x410cf3[0x0]['id'])["trim"](),_0x29d811=_0x410cf3["map"](_0x4c4d81=>{const _0xeb7e37=_0x398323["filter"](_0x32fbba=>String(_0x32fbba?.['menuPage']||_0x410cf3[0x0]['id'])["trim"]()===_0x4c4d81['id']),_0x44476c=document["createElement"]("button");_0x44476c['type']="button",_0x44476c["className"]="at-mention-tab";const _0x10ed9c=_createMentionMenuPageIcon(_0x4c4d81["icon"]);if(_0x10ed9c)_0x44476c['appendChild'](_0x10ed9c);const _0x17cafb=document['createElement']('span');_0x17cafb['className']="at-mention-tab-label",_0x17cafb["textContent"]=_0x4c4d81["label"],_0x44476c['appendChild'](_0x17cafb),_0x44476c["dataset"]["mentionPage"]=_0x4c4d81['id'],_0x44476c["setAttribute"]("role","tab");const _0x172fee=document['createElement']('div');_0x172fee["className"]="at-mention-page",_0x172fee["dataset"]["mentionPagePanel"]=_0x4c4d81['id'],_0x172fee['setAttribute']("role",'tabpanel');if(_0xeb7e37['length'])_populateMentionMenuTree(_0x172fee,_0x4cb8c9,_buildMentionMenuTree(_0xeb7e37),_0x5081c5);else{const _0x43ac94=document["createElement"]("div");_0x43ac94["className"]='at-mention-empty',_0x43ac94["textContent"]='没有匹配的内容',_0x172fee['appendChild'](_0x43ac94);}return _0x177fa2["appendChild"](_0x44476c),_0x200756["appendChild"](_0x172fee),{..._0x4c4d81,'button':_0x44476c,'panel':_0x172fee,'hasCandidates':_0xeb7e37["length"]>0x0};}),_0x3266b0=_0x29d811["find"](_0x420209=>_0x420209['id']===_0xe329bb);let _0x54d57b=_0x3266b0?.["hasCandidates"]?_0x3266b0:null;if(!_0x54d57b)_0x54d57b=_0x29d811["find"](_0x2670f7=>_0x2670f7["hasCandidates"]);if(!_0x54d57b)_0x54d57b=_0x3266b0||_0x29d811[0x0];const _0x29d1f9=(_0x399cf3,{keyboard:keyboard=![]}={})=>{if(!_0x399cf3)return;const _0x5988cc=_0x29d811["indexOf"](_0x399cf3);_0x29d811["forEach"](_0x35da96=>{const _0x303953=_0x35da96===_0x399cf3;_0x35da96['button']['classList']["toggle"]("is-active",_0x303953),_0x35da96["button"]['setAttribute']("aria-selected",String(_0x303953)),_0x35da96['button']["tabIndex"]=_0x303953?0x0:-0x1,_0x35da96['panel']["classList"]["toggle"]("is-active",_0x303953),_0x35da96["panel"]["setAttribute"]("aria-hidden",String(!_0x303953)),_0x35da96['panel']["inert"]=!_0x303953;}),_0x200756["style"]["transform"]="translateX("+-_0x5988cc*(0x64/_0x29d811["length"])+'%)',_mentionMenuState["activeMenu"]=_0x399cf3['panel'],_setInitialMentionActiveItem(_0x399cf3['panel'],{'keyboard':keyboard}),_positionMentionMenu();};return _0x29d811["forEach"](_0x1e4b35=>{_0x1e4b35["button"]["addEventListener"]("mousedown",_0x1e8c08=>{_0x1e8c08["preventDefault"](),_0x1e8c08['stopPropagation'](),_0x29d1f9(_0x1e4b35);});}),_0x29d1f9(_0x54d57b),_0x54d57b?.["panel"]||null;}
