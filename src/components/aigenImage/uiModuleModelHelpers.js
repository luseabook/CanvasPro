import { renderOpenAiLogoHtml } from '../shared/openAiLogo.js';
import { renderComfyUiCloudWorkflowLogoHtml, renderComfyUiLocalWorkflowLogoHtml, renderComfyUiWorkflowLogoHtmlFromIconKind } from '../shared/customAiAppLogo.js';
import { isModelManifestPubliclyListed } from '../../manifests/modelCatalogVisibility.js';
import {
  NANO_BANANA_FAMILIES,
  getDefaultModeForNanoBananaFamily,
  getNanoBananaModeOptions,
  isNanoBananaFamily,
  resolveNanoBananaModelBySelection,
  resolveNanoBananaSelectionFromModel,
} from '../../modules/nanoBananaModeRules.js';
import { getDreaminaImageMenuGroupHTML, getDreaminaImageTriggerIconHTML } from './dreaminaModelMenuHelper.js';
import {
  isRunningHubGptImage2OfficialModel,
  normalizeImageSizeForProviderModel,
} from '../../modules/imageModelCapabilities.js';
import { AI_GENERATION_NODE_SHORT_SIDE } from '../../services/fileService.js';
import {
  getAllowedRatiosForProviderModel,
  pickClosestRatioForProviderModel,
} from '../../../api/imageRatioPolicy.js';
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from '../../modules/generationRatioSource.js';
import {
  ANIME_REAL_MODEL_ID,
  PERSON_REPLACE_V21_MODEL_ID,
  PERSON_REPLACE_V3_MODEL_ID,
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelsByKind,
  getModelManifest,
  resolveModelExecution,
  resolveModelProvider,
} from '../../manifests/index.js';
import { renderNodeMenuGroup, renderNodeMenuItem } from '../shared/nodeModelMenu.js';
import { t } from '../../i18n/index.js';
export const AI_IMAGE_MIN_SIZE = 150;
export const GRSAI_GPT_IMAGE_2_MODEL = 'gpt-image-2';
const GRSAI_GPT_IMAGE_2_VIP_MODEL = 'gpt-image-2-vip';
export const APIMART_GPT_IMAGE_2_MODEL = 'apimart/gpt-image-2';
export const APIMART_QWEN_IMAGE_MODEL = 'apimart/qwen-image-2.0';
export const APIMART_Z_IMAGE_TURBO_MODEL = 'apimart/z-image-turbo';
export const APIMART_WAN_IMAGE_MODEL = 'apimart/wan2.7-image';
export const VOLCENGINE_SEEDREAM_5_MODEL = 'volcengine/seedream-5.0';
export const VOLCENGINE_SEEDREAM_4_5_MODEL = 'volcengine/seedream-4.5';
export const VOLCENGINE_SEEDREAM_4_MODEL = 'volcengine/seedream-4.0';
export const RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID;
const GRSAI_IMAGE_MENU_ICON_HTML =
    '<img src="images/grsai.png" class="node-menu-icon node-menu-icon-padded" alt="grsai">',
  AGNES_BADGE_ICON_HTML =
    '<div class="node-menu-icon node-menu-icon-badge node-menu-icon-badge-dark">AG</div>',
  VOLCENGINE_IMAGE_MENU_ICON_HTML =
    '<img src="images/volcengine.svg" class="node-menu-icon" alt="volcengine">';
function getDefaultImagePromptPlaceholder() {
  return t('aigenImage.prompt.placeholder');
}
function normalizeGrsaiModelToken(_0x5b2f41) {
  let _0x2e30d8 = String(_0x5b2f41 || '')
    .trim()
    .toLowerCase();
  return (_0x2e30d8.startsWith('grsai/') && (_0x2e30d8 = _0x2e30d8.slice('grsai/'.length).trim()), _0x2e30d8);
}
function isAdvancedModeEnabled() {
  return typeof window !== 'undefined' && window.ADVANCED_MODE === true;
}
function getManifestUiField(_0x19361e, _0x15a917) {
  const _0x534973 = getModelManifest(_0x19361e)?.uiSchema?.fields;
  return Array.isArray(_0x534973) ? _0x534973.find((_0x5ce432) => _0x5ce432?.id === _0x15a917) || null : null;
}
function pickNearestNumber(_0x36029b, _0x15864a, _0x208c55) {
  const _0x5ac3d5 = (Array.isArray(_0x15864a) ? _0x15864a : [])
    .map((_0xe9683b) => Number(_0xe9683b))
    .filter(Number.isFinite);
  if (_0x5ac3d5.length === 0) return _0x208c55;
  const _0x23669c = Number(_0x36029b);
  if (!Number.isFinite(_0x23669c)) return _0x208c55;
  return _0x5ac3d5.reduce(
    (_0x5b4e17, _0x3f5f66) =>
      Math.abs(_0x3f5f66 - _0x23669c) < Math.abs(_0x5b4e17 - _0x23669c) ? _0x3f5f66 : _0x5b4e17,
    _0x5ac3d5[0],
  );
}
export function isGrsaiGptImage2ModelToken(_0x142b20) {
  const _0x1cfeed = normalizeGrsaiModelToken(_0x142b20);
  return _0x1cfeed === GRSAI_GPT_IMAGE_2_MODEL || _0x1cfeed === GRSAI_GPT_IMAGE_2_VIP_MODEL;
}
export function isGrsaiGptImage2Selection(_0x36b797, _0x2ec854) {
  const _0x4ae63e = String(_0x36b797 || '')
      .trim()
      .toLowerCase(),
    _0x8b131a = String(_0x2ec854 || '')
      .trim()
      .toLowerCase(),
    _0x51cc27 = normalizeGrsaiModelToken(_0x8b131a);
  if (!isGrsaiGptImage2ModelToken(_0x51cc27)) return false;
  return _0x4ae63e === 'grsai' || _0x8b131a.startsWith('grsai/') || (!_0x4ae63e && !_0x8b131a.includes('/'));
}
export function isApimartGptImage2Selection(_0x44cbbf, _0x54b7ba) {
  const _0x18949f = String(_0x44cbbf || '')
      .trim()
      .toLowerCase(),
    _0x944a71 = String(_0x54b7ba || '')
      .trim()
      .toLowerCase();
  return (
    _0x944a71 === APIMART_GPT_IMAGE_2_MODEL ||
    (_0x18949f === 'apimart' && _0x944a71 === GRSAI_GPT_IMAGE_2_MODEL)
  );
}
export function isRunningHubGptImage2Selection(_0x133110, _0x310eed) {
  const _0x540b56 = String(_0x133110 || '')
      .trim()
      .toLowerCase(),
    _0x3cbc9a = resolveNanoBananaSelectionFromModel(_0x310eed, '2K', _0x540b56 || 'runninghub');
  return _0x3cbc9a?.provider === 'runninghub' && _0x3cbc9a.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2;
}
export function getImageSizeCapabilityProvider(_0x24d430, _0x3c028d) {
  return isGrsaiGptImage2Selection(_0x24d430, _0x3c028d) ? 'grsai' : _0x24d430;
}
export function getEffectiveImageSizeForUi(_0x36a370, _0x28e58f, _0x57d9b2) {
  const _0x25bdf5 = String(_0x57d9b2 || '').trim();
  if (_0x25bdf5) return _0x25bdf5.toUpperCase();
  return isGrsaiGptImage2Selection(_0x36a370, _0x28e58f) ? '1K' : '2K';
}
function isAdaptiveImageRatio(_0x45c623) {
  const _0x7c74d2 = String(_0x45c623 || '').trim(),
    _0x48575f = _0x7c74d2.toLowerCase();
  return !_0x7c74d2 || _0x7c74d2 === '自适应' || _0x48575f === 'auto' || _0x48575f === 'adaptive';
}
export function isAdaptiveImageAspectRatioValue(_0x181818) {
  return isAdaptiveImageRatio(_0x181818);
}
export function parseImageDisplayAspectRatio(_0x4ded2d) {
  if (isAdaptiveImageRatio(_0x4ded2d)) return null;
  const _0x1a561c = String(_0x4ded2d || '')
      .trim()
      .replace(/[：∶﹕]/g, ':')
      .replace(/\s+/g, ''),
    _0xd098d3 = _0x1a561c.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!_0xd098d3) return null;
  const _0x135808 = Number.parseFloat(_0xd098d3[1]),
    _0x5aa98f = Number.parseFloat(_0xd098d3[2]);
  if (!Number.isFinite(_0x135808) || !Number.isFinite(_0x5aa98f)) return null;
  if (_0x135808 <= 0 || _0x5aa98f <= 0) return null;
  return { width: _0x135808, height: _0x5aa98f, label: _0x135808 + ':' + _0x5aa98f };
}
export function buildImageDisplayRatioResizePatch({
  nodeData: nodeData = {},
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
} = {}) {
  const _0x41495e = parseImageDisplayAspectRatio(ratioValue);
  if (!_0x41495e) return {};
  const _0x197f75 = Math.max(1, Math.round(Number(minSide) || AI_GENERATION_NODE_SHORT_SIDE)),
    _0x1827d7 = Math.max(1, Math.round(Number(nodeData?.width) || _0x197f75)),
    _0x345b21 = Math.max(1, Math.round(Number(nodeData?.height) || _0x197f75)),
    _0x5723b3 = Number.isFinite(Number(nodeData?.x)) ? Number(nodeData.x) : 0,
    _0x90c588 = Number.isFinite(Number(nodeData?.y)) ? Number(nodeData.y) : 0;
  let _0x98c78e, _0x1e16f4;
  _0x41495e.width >= _0x41495e.height
    ? ((_0x1e16f4 = _0x197f75), (_0x98c78e = Math.round((_0x41495e.width / _0x41495e.height) * _0x197f75)))
    : ((_0x98c78e = _0x197f75), (_0x1e16f4 = Math.round((_0x41495e.height / _0x41495e.width) * _0x197f75)));
  if (_0x98c78e === _0x1827d7 && _0x1e16f4 === _0x345b21) return {};
  const _0x2ac827 = _0x98c78e - _0x1827d7,
    _0x3de030 = _0x1e16f4 - _0x345b21;
  return {
    width: _0x98c78e,
    height: _0x1e16f4,
    x: Math.round(_0x5723b3 - _0x2ac827 / 2),
    y: Math.round(_0x90c588 - _0x3de030),
  };
}
function getPlainSchemaParams(_0x454a60) {
  return _0x454a60 && typeof _0x454a60 === 'object' && !Array.isArray(_0x454a60) ? { ..._0x454a60 } : {};
}
function getImageSizeForRatioDisplay(_0x58da09 = {}, _0x490a71 = {}) {
  const _0x40b65a = _0x58da09 || {},
    _0x383493 = _0x490a71 || {},
    _0x2b85b3 = getPlainSchemaParams(_0x40b65a.generationParams);
  return getEffectiveImageSizeForUi(
    _0x40b65a.provider || _0x383493.provider,
    _0x40b65a.model || _0x383493.model,
    _0x2b85b3.imageSize || _0x40b65a.imageSize,
  );
}
function pickClosestRatioLabelForDisplay({
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  width: _0xca5229,
  height: _0x5233fb,
} = {}) {
  const _0x2aa5b3 = Number(_0xca5229) || 0,
    _0x3961e1 = Number(_0x5233fb) || 0;
  if (_0x2aa5b3 <= 0 || _0x3961e1 <= 0) return null;
  return pickClosestRatioForProviderModel({
    provider: nodeData?.provider || fallbackNodeData?.provider,
    model: nodeData?.model || fallbackNodeData?.model,
    width: _0x2aa5b3,
    height: _0x3961e1,
    imageSize: getImageSizeForRatioDisplay(nodeData, fallbackNodeData),
  });
}
function getMediaSizeForRatioDisplay(_0x3bbdc5, _0x25afce, _0x449776 = null, _0x2cf471 = 'img, video') {
  return (
    getGenerationRatioSizeWithDom({
      nodeId: _0x3bbdc5,
      nodeData: _0x25afce,
      edge: _0x449776,
      mediaSelector: _0x2cf471,
      includeNodeFrame: true,
    }) || { width: 0, height: 0 }
  );
}
function isAcceptedRatioInputKind(_0x27d58d, _0x188a7e, _0x4d2fdf, _0x4d1d06) {
  const _0x5678de = String(_0x27d58d?.refSlot || '').toLowerCase();
  if (_0x5678de.includes('mask')) return false;
  const _0x5e99ef = _0x188a7e?.[_0x27d58d?.sourceId],
    _0x21f877 = String(_0x5e99ef?.type || ''),
    _0x3defc3 = typeof _0x4d1d06 === 'function' ? _0x4d1d06(_0x21f877) : '';
  if (_0x3defc3 && _0x4d2fdf.has(_0x3defc3)) return true;
  const _0x45628e = _0x21f877.toLowerCase();
  return Array.from(_0x4d2fdf).some(
    (_0x5a8128) =>
      _0x45628e === _0x5a8128 || _0x45628e === 'source-' + _0x5a8128 || _0x45628e === 'ai-' + _0x5a8128,
  );
}
export function resolveImageSchemaAdaptiveRatioDisplayValue({
  store: _0x19a237,
  nodeId: _0x4a4d1c,
  nodeData: _0xf260da,
  fallbackNodeData: _0x10e771,
  getRefKindByNodeType: _0x855c2d,
  inputKinds: inputKinds = ['image'],
  resultMediaElement: resultMediaElement = null,
  resultFields: resultFields = [
    'images',
    'localPath',
    'thumbUrl',
    'imageUrl',
    'sourceUrl',
    'thumbId',
    'sourceId',
  ],
  mediaSelector: mediaSelector = 'img, video',
} = {}) {
  const _0x3b2dd0 = _0x19a237?.getState?.() || {},
    _0x31b2c5 = _0x3b2dd0.nodes || {},
    _0x2518bd = _0xf260da || _0x31b2c5?.[_0x4a4d1c] || _0x10e771 || {},
    _0x50e10c = new Set(
      (Array.isArray(inputKinds) ? inputKinds : ['image'])
        .map((_0x51d44d) => String(_0x51d44d || '').trim())
        .filter(Boolean),
    ),
    _0x159d79 =
      typeof _0x19a237?.getIncomingEdges === 'function' ? _0x19a237.getIncomingEdges(_0x4a4d1c) : [],
    _0x4564fc = _0x159d79.filter((_0x2312b5) =>
      isAcceptedRatioInputKind(_0x2312b5, _0x31b2c5, _0x50e10c, _0x855c2d),
    );
  if (_0x4564fc.length > 0) {
    const _0x5970a2 = pickGenerationRatioSourceEdge(_0x4564fc, _0x2518bd),
      _0x58d594 = _0x31b2c5?.[_0x5970a2?.sourceId],
      _0x1ac466 = getMediaSizeForRatioDisplay(_0x5970a2?.sourceId, _0x58d594, _0x5970a2, mediaSelector);
    return (
      pickClosestRatioLabelForDisplay({
        nodeData: _0x2518bd,
        fallbackNodeData: _0x10e771,
        width: _0x1ac466.width,
        height: _0x1ac466.height,
      }) || '1:1'
    );
  }
  const _0x150498 = resultFields.some((_0x251690) => {
    const _0x198af1 = _0x2518bd?.[_0x251690];
    return Array.isArray(_0x198af1) ? _0x198af1.length > 0 : Boolean(_0x198af1);
  });
  if (_0x150498) {
    const _0x2031c9 =
        resultMediaElement?.naturalWidth || resultMediaElement?.videoWidth || Number(_0x2518bd?.width) || 0,
      _0x380446 =
        resultMediaElement?.naturalHeight ||
        resultMediaElement?.videoHeight ||
        Number(_0x2518bd?.height) ||
        0;
    return (
      pickClosestRatioLabelForDisplay({
        nodeData: _0x2518bd,
        fallbackNodeData: _0x10e771,
        width: _0x2031c9,
        height: _0x380446,
      }) || '1:1'
    );
  }
  return '1:1';
}
export function buildImageSchemaAspectRatioDisplayPatch({
  store: _0x52e4d3,
  nodeId: _0x5131f2,
  nodeData: _0x2f5ef4,
  fallbackNodeData: _0x3be92c,
  ratioValue: ratioValue = '',
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: _0xc1e10e,
  inputKinds: _0x1d2d85,
  resultMediaElement: _0x4092f2,
  resultFields: _0x17d3c3,
  mediaSelector: _0x2dd237,
} = {}) {
  const _0x1e6d06 = _0x52e4d3?.getState?.().nodes?.[_0x5131f2];
  if (!_0x1e6d06 && !_0x2f5ef4 && !_0x3be92c) return {};
  const _0x22f519 = _0x2f5ef4 || _0x1e6d06 || _0x3be92c || {},
    _0x334619 = isAdaptiveImageAspectRatioValue(ratioValue)
      ? resolveImageSchemaAdaptiveRatioDisplayValue({
          store: _0x52e4d3,
          nodeId: _0x5131f2,
          nodeData: _0x22f519,
          fallbackNodeData: _0x3be92c,
          getRefKindByNodeType: _0xc1e10e,
          inputKinds: _0x1d2d85,
          resultMediaElement: _0x4092f2,
          resultFields: _0x17d3c3,
          mediaSelector: _0x2dd237,
        })
      : ratioValue;
  return buildImageDisplayRatioResizePatch({ nodeData: _0x22f519, ratioValue: _0x334619, minSide: minSide });
}
export function armImageSchemaRatioResizeAnimation(_0x31a3ec, _0x1be688, _0x107fec = 0x118) {
  const _0x5f5132 = typeof document !== 'undefined' ? document.getElementById(_0x1be688) : null;
  if (!_0x5f5132 || !_0x31a3ec) return;
  _0x5f5132.classList.add('is-ratio-animating');
  if (_0x31a3ec._ratioAnimTimer) clearTimeout(_0x31a3ec._ratioAnimTimer);
  _0x31a3ec._ratioAnimTimer = setTimeout(() => {
    const _0x3b9bd5 = typeof document !== 'undefined' ? document.getElementById(_0x1be688) : null;
    (_0x3b9bd5?.classList.remove('is-ratio-animating'), (_0x31a3ec._ratioAnimTimer = null));
  }, _0x107fec + 80);
}
export function animateImageSchemaRatioResizeFlip(
  _0x5e31a1,
  { nodeId: _0x27087a, previewEl: _0x311097, nodeData: _0x5bdc82, patch: _0x4c8c3b, ms: ms = 0x118 } = {},
) {
  if (!_0x5e31a1 || !_0x311097 || typeof _0x311097.animate !== 'function') return;
  const _0x44f624 = Math.max(1, Number(_0x5bdc82?.width) || Number(_0x4c8c3b?.width) || 1),
    _0x43b1a8 = Math.max(1, Number(_0x5bdc82?.height) || Number(_0x4c8c3b?.height) || 1),
    _0x42d54a = Math.max(1, Number(_0x4c8c3b?.width) || _0x44f624),
    _0x2b7619 = Math.max(1, Number(_0x4c8c3b?.height) || _0x43b1a8);
  if (_0x44f624 === _0x42d54a && _0x43b1a8 === _0x2b7619) return;
  const _0x1ca880 = _0x44f624 / _0x42d54a,
    _0x465487 = _0x43b1a8 / _0x2b7619,
    _0x36895e = 'scaleX(' + _0x1ca880 + ') scaleY(' + _0x465487 + ')',
    _0x12364e = () => {
      ((_0x5e31a1._ratioFlipAnim = null),
        (_0x311097.style.transformOrigin = ''),
        (_0x311097.style.transform = ''));
    };
  if (_0x5e31a1._ratioFlipAnim) _0x5e31a1._ratioFlipAnim.cancel();
  ((_0x311097.style.transition = 'none'),
    (_0x311097.style.transformOrigin = 'bottom center'),
    (_0x311097.style.transform = _0x36895e),
    void _0x311097.offsetWidth);
  const _0xbec0ec = () => {
    if (typeof document !== 'undefined' && !document.getElementById(_0x27087a)) {
      _0x12364e();
      return;
    }
    ((_0x5e31a1._ratioFlipAnim = _0x311097.animate([{ transform: _0x36895e }, { transform: 'none' }], {
      duration: ms,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards',
    })),
      (_0x5e31a1._ratioFlipAnim.onfinish = _0x12364e),
      (_0x5e31a1._ratioFlipAnim.oncancel = _0x12364e));
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(_0xbec0ec);
  else setTimeout(_0xbec0ec, 0);
}
export function applyImageSchemaRatioResizeAnimation(
  _0x25b895,
  { nodeId: _0x4c5d44, previewEl: _0x47101c, nodeData: _0x274976, patch: _0x6c3b8a, ms: ms = 0x118 } = {},
) {
  if (!_0x6c3b8a || Object.keys(_0x6c3b8a).length === 0) return;
  (armImageSchemaRatioResizeAnimation(_0x25b895, _0x4c5d44, ms),
    animateImageSchemaRatioResizeFlip(_0x25b895, {
      nodeId: _0x4c5d44,
      previewEl: _0x47101c,
      nodeData: _0x274976,
      patch: _0x6c3b8a,
      ms: ms,
    }));
}
export function normalizeQwenImageEditMode(_0x10a616) {
  const _0x1d31b8 = String(_0x10a616 || '')
    .trim()
    .toLowerCase();
  return _0x1d31b8 === 'qwen2509' ||
    _0x1d31b8 === 'qwen-edit2509' ||
    _0x1d31b8 === '2509' ||
    _0x1d31b8 === '0'
    ? 'qwen2509'
    : 'qwen2511';
}
export function getQwenImageEditModeLabel(_0xda2526) {
  return normalizeQwenImageEditMode(_0xda2526) === 'qwen2509' ? '2509' : '2511';
}
export function getQwenImageEditModeTooltip(_0x2ed303) {
  const _0x533775 = normalizeQwenImageEditMode(_0x2ed303),
    _0xdcb3ae = getQwenUiFieldOptions('rhQwenEditMode').find((_0x478322) => _0x478322.value === _0x533775);
  if (_0xdcb3ae?.tooltip) return _0xdcb3ae.tooltip;
  return _0x533775 === 'qwen2509'
    ? t('aigenImage.qwen.versionTooltips.qwen2509')
    : t('aigenImage.qwen.versionTooltips.qwen2511');
}
export function normalizeQwenFirstImageMode(_0x143baf) {
  const _0x5c62b8 = String(_0x143baf || '')
    .trim()
    .toLowerCase();
  if (_0x5c62b8 === 'pose' || _0x5c62b8 === '1' || _0x5c62b8 === '姿势图') return 'pose';
  if (_0x5c62b8 === 'depth' || _0x5c62b8 === '2' || _0x5c62b8 === '深度图') return 'depth';
  return 'original';
}
export function getQwenFirstImageModeLabel(_0x38f4d0) {
  const _0x4e2509 = normalizeQwenFirstImageMode(_0x38f4d0),
    _0x5c118b = getQwenUiFieldOptions('rhQwenFirstImageMode').find(
      (_0x1c6225) => _0x1c6225.value === _0x4e2509,
    );
  if (_0x5c118b?.label) return _0x5c118b.label;
  if (_0x4e2509 === 'pose') return t('aigenImage.qwen.firstImageModes.pose');
  if (_0x4e2509 === 'depth') return t('aigenImage.qwen.firstImageModes.depth');
  return t('aigenImage.qwen.firstImageModes.original');
}
function getQwenModelManifest() {
  return getModelManifest(QWEN_IMAGE_EDIT_MODEL_ID);
}
function getQwenUiField(_0x76f4a8) {
  const _0x4c11df = getQwenModelManifest()?.uiSchema?.fields;
  return Array.isArray(_0x4c11df) ? _0x4c11df.find((_0x2a9234) => _0x2a9234?.id === _0x76f4a8) || null : null;
}
function getQwenUiFieldOptions(_0x24b61f) {
  const _0xbd7646 = getQwenUiField(_0x24b61f)?.options;
  return Array.isArray(_0xbd7646) ? _0xbd7646 : [];
}
export function getQwenImageEditModelManifest() {
  return getQwenModelManifest();
}
export function getQwenFirstImageModeOptions() {
  const _0x1fd517 = getQwenUiFieldOptions('rhQwenFirstImageMode');
  return _0x1fd517.length
    ? _0x1fd517
    : [
        { value: 'original', label: t('aigenImage.qwen.firstImageModes.original') },
        { value: 'pose', label: t('aigenImage.qwen.firstImageModes.pose') },
        { value: 'depth', label: t('aigenImage.qwen.firstImageModes.depth') },
      ];
}
export function getPersonReplaceV21ResolutionOptions() {
  const _0x167484 = getManifestUiField(PERSON_REPLACE_V21_MODEL_ID, 'rhResolution'),
    _0x257f9a = Array.isArray(_0x167484?.options) ? _0x167484.options : [],
    _0x1ffc7e =
      isAdvancedModeEnabled() && Array.isArray(_0x167484?.advancedOptions) ? _0x167484.advancedOptions : [];
  return [..._0x257f9a, ..._0x1ffc7e].map((_0x32afb9) => Number(_0x32afb9)).filter(Number.isFinite);
}
export function normalizePersonReplaceV21Resolution(_0x1060f6) {
  const _0x169893 = getManifestUiField(PERSON_REPLACE_V21_MODEL_ID, 'rhResolution'),
    _0x21b735 = getPersonReplaceV21ResolutionOptions(),
    _0x5b6126 = Number(_0x169893?.defaultValue) || 0x500;
  return pickNearestNumber(_0x1060f6, _0x21b735, _0x5b6126);
}
export function buildRunningHubGptImage2OfficialPatch({
  provider: provider = '',
  model: model = '',
  imageSize: imageSize = '',
  aspectRatio: aspectRatio = '',
} = {}) {
  if (!isRunningHubGptImage2OfficialModel(model, provider)) return {};
  const _0x514441 = normalizeImageSizeForProviderModel({
      model: model,
      provider: provider,
      imageSize: imageSize,
    }),
    _0xfb567c = {},
    _0x1e8d03 = String(imageSize || '')
      .trim()
      .toUpperCase();
  _0x514441 && _0x514441 !== _0x1e8d03 && (_0xfb567c.imageSize = _0x514441);
  if (!isAdaptiveImageRatio(aspectRatio)) {
    const _0x160014 = String(aspectRatio || '')
        .trim()
        .replace(/[：∶]/g, ':')
        .replace(/\s+/g, ''),
      _0x4c2d6b = new Set(
        getAllowedRatiosForProviderModel(provider, model, _0x514441).map((_0x570f11) => _0x570f11.label),
      );
    _0x160014 &&
      !_0x4c2d6b.has(_0x160014) &&
      (_0xfb567c.aspectRatio = pickClosestRatioForProviderModel({
        provider: provider,
        model: model,
        ratioLabel: _0x160014,
        imageSize: _0x514441,
      }));
  }
  return _0xfb567c;
}
export function getImagePromptPlaceholderForModel(_0x542804) {
  const _0x54b218 = resolveModelProvider(_0x542804),
    _0x54cb48 =
      getModelManifest(_0x542804) ||
      resolveModelExecution(_0x542804, { providerHint: _0x54b218 })?.modelManifest ||
      null,
    _0x35991b = String(_0x54cb48?.prompt?.placeholder || '').trim();
  if (_0x35991b) return _0x35991b;
  return getDefaultImagePromptPlaceholder();
}
export function escapeHtmlAttr(_0x11e576) {
  return String(_0x11e576 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
const APIMART_BADGE_ICON_HTML =
  '<div class="node-menu-icon node-menu-icon-badge node-menu-icon-apimart">AM</div>';
function getImageMenuMeta(_0x1be4bd) {
  const _0x24fe4e = _0x1be4bd?.extensions?.imageMenu;
  return _0x24fe4e && typeof _0x24fe4e === 'object' ? _0x24fe4e : null;
}
export function getImageModelMenuManifests(_0x29fa82) {
  const _0x258d51 = String(_0x29fa82 || '').trim();
  return getModelsByKind('image')
    .filter((_0x11f97a) => getImageMenuMeta(_0x11f97a)?.group === _0x258d51)
    .sort((_0x291b41, _0x151654) => {
      const _0x57a291 = getImageMenuMeta(_0x291b41),
        _0x22e27a = getImageMenuMeta(_0x151654);
      return (_0x57a291?.order || 0) - (_0x22e27a?.order || 0);
    });
}
function renderImageMenuGroupHTML({
  headerClass: _0x5be06b,
  toggleAttr: _0x5be546,
  submenuClass: _0x4a8632,
  iconHtml: _0x25d944,
  title: _0x3aa1fb,
  subtitle: _0x49debe,
  badgeHtml: badgeHtml = '',
  itemsHtml: itemsHtml = '',
}) {
  return renderNodeMenuGroup({
    id: _0x4a8632,
    headerClass: _0x5be06b,
    toggleAttr: _0x5be546,
    submenuClass: _0x4a8632,
    iconHtml: _0x25d944,
    label: _0x3aa1fb,
    subtitle: _0x49debe,
    badgeHtml: badgeHtml,
    itemsHtml: itemsHtml,
  });
}
function renderImageManifestIconHTML(_0x482c2b, _0x279173 = {}) {
  if (_0x279173.iconKind === 'apimartBadge') return APIMART_BADGE_ICON_HTML;
  if (_0x279173.iconKind === 'agnesBadge') return AGNES_BADGE_ICON_HTML;
  const _0x1458d4 = _0x279173.icon || _0x482c2b?.icon || '';
  if (!_0x1458d4) return '';
  const _0x4ff9be = _0x279173.iconAlt || _0x482c2b?.provider || _0x482c2b?.displayName || '';
  return (
    '<img src="' +
    escapeHtmlAttr(_0x1458d4) +
    '" class="node-menu-icon" alt="' +
    escapeHtmlAttr(_0x4ff9be) +
    '">'
  );
}
function renderImageManifestMenuItemHTML(_0x36621c, _0x233d0d) {
  const _0x2add6d = getImageMenuMeta(_0x36621c) || {},
    _0x35f5ce = _0x36621c?.modelId || '',
    _0x3ebda3 = _0x36621c?.provider || '',
    _0x1069bb = String(_0x233d0d || '') === _0x35f5ce;
  return renderNodeMenuItem({
    modelId: _0x35f5ce,
    provider: _0x3ebda3,
    label: _0x2add6d.title || _0x36621c?.displayName || _0x35f5ce,
    description: _0x2add6d.subtitle || _0x36621c?.description || '',
    iconHtml: renderImageManifestIconHTML(_0x36621c, _0x2add6d),
    active: _0x1069bb,
  });
}
export function buildGrsaiImageMenuGroupHTML(_0x166ba9, _0xba8c9f = '') {
  return renderImageMenuGroupHTML({
    headerClass: 'grsai-group-header',
    toggleAttr: 'data-grsai-toggle',
    submenuClass: 'grsai-submenu',
    iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
    title: 'GRSAI',
    subtitle: '高性能 AI 图像生成服务',
    itemsHtml: buildNanoBananaFamilyMenuHTML(_0x166ba9, _0xba8c9f),
  });
}
export function buildApimartImageMenuGroupHTML(_0x1fd8f3) {
  const _0x5456e6 = getImageModelMenuManifests('apimart')
    .map((_0x5390d1) => renderImageManifestMenuItemHTML(_0x5390d1, _0x1fd8f3))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'apimart-group-header',
    toggleAttr: 'data-apimart-toggle',
    submenuClass: 'apimart-submenu',
    iconHtml: APIMART_BADGE_ICON_HTML,
    title: 'APIMart',
    subtitle: '一个 API 搞定一切——节省 30-70%',
    itemsHtml: _0x5456e6,
  });
}
export function buildAgnesImageMenuGroupHTML(_0x4cd042) {
  const _0x329c55 = getImageModelMenuManifests('agnes')
    .map((_0x2e1282) => renderImageManifestMenuItemHTML(_0x2e1282, _0x4cd042))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'agnes-group-header',
    toggleAttr: 'data-agnes-toggle',
    submenuClass: 'agnes-submenu',
    iconHtml: AGNES_BADGE_ICON_HTML,
    title: 'Agnes AI',
    subtitle: 'Agnes Image model API',
    itemsHtml: _0x329c55,
  });
}
export function buildVolcengineImageMenuGroupHTML(_0x5b89ae) {
  const _0x1332fb = getImageModelMenuManifests('volcengine')
    .map((_0x5cce44) => renderImageManifestMenuItemHTML(_0x5cce44, _0x5b89ae))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'volcengine-group-header',
    toggleAttr: 'data-volcengine-toggle',
    submenuClass: 'volcengine-submenu',
    iconHtml: VOLCENGINE_IMAGE_MENU_ICON_HTML,
    title: '火山方舟',
    subtitle: 'Ark Seedream 图像生成 API',
    itemsHtml: _0x1332fb,
  });
}
export function buildRunningHubImageModelMenuGroupHTML(_0x4dfb23, _0x1dce54 = '') {
  return renderImageMenuGroupHTML({
    headerClass: 'runninghub-group-header',
    toggleAttr: 'data-runninghub-toggle',
    submenuClass: 'runninghub-submenu',
    iconHtml: '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: 'RunningHUB模型',
    subtitle: '模型 API：文生图/图生图/图片编辑',
    itemsHtml: buildRunningHubNanoBananaFamilyMenuHTML(_0x4dfb23, _0x1dce54),
  });
}
export function buildRunningHubWorkflowImageMenuGroupHTML(_0x7caa57) {
  const _0x4bc318 = getImageModelMenuManifests('runninghubWorkflow')
    .map((_0x37d3f6) => buildManifestModelMenuItemHTML(_0x37d3f6.modelId, _0x7caa57))
    .join('');
  return renderImageMenuGroupHTML({
    headerClass: 'runninghubwf-group-header',
    toggleAttr: 'data-runninghubwf-toggle',
    submenuClass: 'runninghubwf-submenu',
    iconHtml: '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: 'RunningHUB工作流',
    subtitle: '工作流模板：替换/风格迁移，结果更可控',
    itemsHtml: _0x4bc318,
  });
}
export function buildImageModelMenuHTML({
  activeModel: activeModel = '',
  nanoSelection: nanoSelection = null,
} = {}) {
  return (
    '<div class="floating-menu img-model-menu">\n                ' +
    buildGrsaiImageMenuGroupHTML(nanoSelection, activeModel) +
    '\n                ' +
    getDreaminaImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildApimartImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildAgnesImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildVolcengineImageMenuGroupHTML(activeModel) +
    '\n                ' +
    buildRunningHubImageModelMenuGroupHTML(nanoSelection, activeModel) +
    '\n                ' +
    buildRunningHubWorkflowImageMenuGroupHTML(activeModel) +
    '\n              </div>'
  );
}
function getLatestImageMenuNodeData(_0x5af453, _0x1237fe, _0xf64418 = {}) {
  return (_0x5af453?.getState?.() || {}).nodes?.[_0x1237fe] || _0xf64418 || {};
}
function getImageMenuItemTitle(_0x5db60f, _0x4d20f5 = '') {
  const _0x46c767 =
    _0x5db60f?.querySelector?.('.fmi-title') || _0x5db60f?.querySelector?.('.floating-menu-label');
  return _0x46c767 ? _0x46c767.textContent : _0x4d20f5;
}
function clearImageModelMenuActive(_0x1eae21) {
  _0x1eae21
    ?.querySelectorAll?.('.floating-menu-item')
    ?.forEach((_0x1cc81f) => _0x1cc81f.classList.remove('active'));
}
export function bindImageModelMenuSubmenu({
  modelMenu: _0x5364f7,
  modelTrigger: _0x3c228b,
  modelLabel: _0x31795b,
  nodeId: _0x2871a1,
  store: _0x226a0b,
  fallbackNodeData: fallbackNodeData = {},
  toggleSelector: toggleSelector = '',
  submenuSelector: submenuSelector = '',
  defaultProvider: defaultProvider = '',
  buildModelPatch: _0x27ae2a,
  resolveSelection: _0x52f9fa,
  beforeSelect: _0x186f53,
  onDisabled: _0x2b0fa7,
  afterSelect: _0x33860b,
} = {}) {
  if (!_0x5364f7 || !_0x31795b || !_0x2871a1 || !_0x226a0b) return null;
  const _0x42a1ba = _0x5364f7.querySelector(toggleSelector),
    _0xbf3432 = _0x5364f7.querySelector(submenuSelector);
  if (!_0x42a1ba || !_0xbf3432) return null;
  let _0x1aa48b = null;
  const _0x43901a = () => {
      (_0x1aa48b && (clearTimeout(_0x1aa48b), (_0x1aa48b = null)), (_0xbf3432.style.display = 'flex'));
    },
    _0x44356f = (_0x592932 = 120) => {
      if (_0x1aa48b) clearTimeout(_0x1aa48b);
      _0x1aa48b = setTimeout(() => {
        _0xbf3432.style.display = 'none';
      }, _0x592932);
    };
  return (
    _0x42a1ba.addEventListener('mouseenter', _0x43901a),
    _0x42a1ba.addEventListener('mouseleave', () => _0x44356f()),
    _0xbf3432.addEventListener('mouseenter', _0x43901a),
    _0xbf3432.addEventListener('mouseleave', () => _0x44356f()),
    _0xbf3432.querySelectorAll('.floating-menu-item').forEach((_0x4cd634) => {
      _0x4cd634.addEventListener('click', () => {
        if (_0x4cd634.dataset.disabled === 'true') {
          _0x2b0fa7?.({ item: _0x4cd634, modelMenu: _0x5364f7, submenu: _0xbf3432, modelTrigger: _0x3c228b });
          return;
        }
        const _0x265bdf = getLatestImageMenuNodeData(_0x226a0b, _0x2871a1, fallbackNodeData),
          _0x49d027 = (typeof _0x52f9fa === 'function'
            ? _0x52f9fa({ item: _0x4cd634, latestNode: _0x265bdf, defaultProvider: defaultProvider })
            : null) || {
            model: _0x4cd634.dataset.value,
            provider: _0x4cd634.dataset.provider || defaultProvider,
          },
          _0x4a0b7b = String(_0x49d027.model || '').trim(),
          _0x39e5cd = String(_0x49d027.provider || defaultProvider).trim();
        if (!_0x4a0b7b || !_0x39e5cd) return;
        if (
          typeof _0x186f53 === 'function' &&
          _0x186f53({
            item: _0x4cd634,
            model: _0x4a0b7b,
            provider: _0x39e5cd,
            latestNode: _0x265bdf,
            selection: _0x49d027,
          }) === false
        )
          return;
        ((_0x31795b.textContent = _0x49d027.label || getImageMenuItemTitle(_0x4cd634, _0x4a0b7b)),
          clearImageModelMenuActive(_0x5364f7),
          _0x4cd634.classList.add('active'),
          _0x5364f7.classList.remove('show'),
          (_0xbf3432.style.display = 'none'));
        const _0x1f94e5 =
            _0x49d027.patch && typeof _0x49d027.patch === 'object'
              ? _0x49d027.patch
              : { model: _0x4a0b7b, provider: _0x39e5cd },
          _0x19907e =
            typeof _0x27ae2a === 'function'
              ? _0x27ae2a(_0x265bdf, _0x4a0b7b, _0x39e5cd, _0x1f94e5)
              : { ..._0x1f94e5, model: _0x4a0b7b, provider: _0x39e5cd };
        (_0x226a0b.updateNodeData(_0x2871a1, _0x19907e),
          _0x33860b?.({
            item: _0x4cd634,
            model: _0x4a0b7b,
            provider: _0x39e5cd,
            latestNode: _0x265bdf,
            selection: _0x49d027,
            modelMenu: _0x5364f7,
            submenu: _0xbf3432,
            modelTrigger: _0x3c228b,
          }));
      });
    }),
    { header: _0x42a1ba, submenu: _0xbf3432 }
  );
}
export function resolveGrsaiImageMenuSelection({ item: _0x3d0d30, latestNode: _0x52777c } = {}) {
  const _0x8c89e9 = 'grsai',
    _0x567501 = String(_0x3d0d30?.dataset?.value || '').trim();
  let _0x3f0734 = _0x567501,
    _0x4dce13 = { model: _0x3f0734, provider: _0x8c89e9 };
  if (isGrsaiGptImage2ModelToken(_0x3f0734))
    ((_0x3f0734 = GRSAI_GPT_IMAGE_2_MODEL),
      (_0x4dce13 = { model: _0x3f0734, provider: _0x8c89e9, imageSize: '1K' }));
  else {
    if (!_0x3f0734) {
      const _0x289222 = String(_0x3d0d30?.dataset?.nbFamily || '').trim();
      if (!_0x289222) return null;
      const _0x2303d9 = getPlainSchemaParams(_0x52777c?.generationParams).imageSize || '2K',
        _0x91584 = getDefaultModeForNanoBananaFamily(_0x289222, _0x8c89e9);
      ((_0x3f0734 = resolveNanoBananaModelBySelection({
        family: _0x289222,
        mode: _0x91584,
        imageSize: _0x2303d9,
        provider: _0x8c89e9,
      })),
        (_0x4dce13 = { model: _0x3f0734, provider: _0x8c89e9 }));
    }
  }
  return { model: _0x3f0734, provider: _0x8c89e9, patch: _0x4dce13 };
}
export function resolveApimartImageMenuSelection({ item: _0x4135e4, latestNode: _0x155748 } = {}) {
  const _0x2925dc = String(_0x4135e4?.dataset?.value || '').trim(),
    _0x2a14ef = String(_0x4135e4?.dataset?.provider || 'apimart').trim(),
    _0x1c5493 = { model: _0x2925dc, provider: _0x2a14ef };
  if (
    _0x2925dc === 'apimart/seedream-4.5' ||
    _0x2925dc === 'apimart/seedream-5.0-lite' ||
    _0x2925dc === APIMART_GPT_IMAGE_2_MODEL ||
    _0x2925dc === APIMART_QWEN_IMAGE_MODEL ||
    _0x2925dc === APIMART_Z_IMAGE_TURBO_MODEL ||
    _0x2925dc === APIMART_WAN_IMAGE_MODEL
  ) {
    const _0x3bc55e =
      getPlainSchemaParams(_0x155748?.generationParams).imageSize || _0x155748?.imageSize || '2K';
    ((_0x2925dc === 'apimart/seedream-4.5' || _0x2925dc === 'apimart/seedream-5.0-lite') &&
      _0x3bc55e === '1K' &&
      (_0x1c5493.imageSize = '2K'),
      _0x2925dc === 'apimart/seedream-5.0-lite' && _0x3bc55e === '4K' && (_0x1c5493.imageSize = '3K'),
      _0x2925dc === APIMART_GPT_IMAGE_2_MODEL && _0x3bc55e === '3K' && (_0x1c5493.imageSize = '2K'),
      (_0x2925dc === APIMART_QWEN_IMAGE_MODEL || _0x2925dc === APIMART_Z_IMAGE_TURBO_MODEL) &&
        _0x3bc55e !== '1K' &&
        _0x3bc55e !== '2K' &&
        (_0x1c5493.imageSize = '1K'),
      _0x2925dc === APIMART_WAN_IMAGE_MODEL &&
        _0x3bc55e !== '1K' &&
        _0x3bc55e !== '2K' &&
        (_0x1c5493.imageSize = '2K'));
  }
  return { model: _0x2925dc, provider: _0x2a14ef, patch: _0x1c5493 };
}
export function resolveVolcengineImageMenuSelection({ item: _0xfcadb6, latestNode: _0x2e6bda } = {}) {
  const _0x5ac428 = String(_0xfcadb6?.dataset?.value || '').trim(),
    _0x4cae78 = String(_0xfcadb6?.dataset?.provider || 'volcengine').trim(),
    _0x8bb336 = { model: _0x5ac428, provider: _0x4cae78 },
    _0x25efe = getPlainSchemaParams(_0x2e6bda?.generationParams).imageSize || _0x2e6bda?.imageSize || '2K';
  return (
    (_0x5ac428 === VOLCENGINE_SEEDREAM_5_MODEL || _0x5ac428 === VOLCENGINE_SEEDREAM_4_5_MODEL) &&
      _0x25efe === '1K' &&
      (_0x8bb336.imageSize = '2K'),
    _0x5ac428 === VOLCENGINE_SEEDREAM_5_MODEL && _0x25efe === '4K' && (_0x8bb336.imageSize = '3K'),
    (_0x5ac428 === VOLCENGINE_SEEDREAM_4_5_MODEL || _0x5ac428 === VOLCENGINE_SEEDREAM_4_MODEL) &&
      _0x25efe === '3K' &&
      (_0x8bb336.imageSize = '2K'),
    { model: _0x5ac428, provider: _0x4cae78, patch: _0x8bb336 }
  );
}
export function resolveRunningHubWorkflowImageMenuSelection({ item: _0x25a4fe } = {}) {
  return { model: _0x25a4fe?.dataset?.value, provider: _0x25a4fe?.dataset?.provider || 'runninghubwf' };
}
export function resolveRunningHubModelImageMenuSelection({ item: _0x47c8a3, latestNode: _0x166cb1 } = {}) {
  const _0x1c8cc1 = String(_0x47c8a3?.dataset?.nbFamily || '').trim();
  let _0x15230e = _0x47c8a3?.dataset?.value,
    _0x2dbd59 = _0x47c8a3?.dataset?.provider || 'runninghubwf';
  const _0x2539a0 = {};
  if (_0x1c8cc1) {
    _0x2dbd59 = 'runninghub';
    const _0x1e8ed1 = getPlainSchemaParams(_0x166cb1?.generationParams).imageSize || '2K',
      _0x289976 = getDefaultModeForNanoBananaFamily(_0x1c8cc1, _0x2dbd59);
    _0x15230e = resolveNanoBananaModelBySelection({
      family: _0x1c8cc1,
      mode: _0x289976,
      imageSize: _0x1e8ed1,
      provider: _0x2dbd59,
    });
  }
  if (!_0x15230e || !_0x2dbd59) return null;
  return { model: _0x15230e, provider: _0x2dbd59, patch: _0x2539a0 };
}
function createImageTriggerIcon(_0x1a3cb5, _0x6a51a9 = 'img') {
  const _0x2dba7f = _0x1a3cb5?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  return _0x2dba7f?.createElement?.(_0x6a51a9) || null;
}
function replaceImageModelTriggerFirstIcon(_0x5634c4, _0x1b6b2e) {
  const _0xeb01ca = _0x5634c4?.firstElementChild;
  if (!_0xeb01ca || !_0x1b6b2e) return;
  _0xeb01ca.replaceWith(_0x1b6b2e);
}
function setSimpleImageModelTriggerIcon(_0x1e03e6, _0x5de8c0 = {}) {
  const _0x13d474 = createImageTriggerIcon(_0x1e03e6, 'img');
  if (!_0x13d474) return;
  _0x13d474.src = _0x5de8c0.src || '';
  if (_0x5de8c0.alt) _0x13d474.alt = _0x5de8c0.alt;
  ((_0x13d474.className = ['image-model-trigger-icon', _0x5de8c0.className || ''].filter(Boolean).join(' ')),
    replaceImageModelTriggerFirstIcon(_0x1e03e6, _0x13d474));
}
function setApimartImageModelTriggerIcon(_0x22b0a3) {
  const _0x28df19 = createImageTriggerIcon(_0x22b0a3, 'div');
  if (!_0x28df19) return;
  ((_0x28df19.className =
    'image-model-trigger-icon image-model-trigger-badge image-model-trigger-icon-apimart'),
    (_0x28df19.innerText = 'AM'),
    replaceImageModelTriggerFirstIcon(_0x22b0a3, _0x28df19));
}
function setAgnesImageModelTriggerIcon(_0x134f1d) {
  const _0x3e2520 = createImageTriggerIcon(_0x134f1d, 'div');
  if (!_0x3e2520) return;
  ((_0x3e2520.className = 'image-model-trigger-icon image-model-trigger-badge'),
    (_0x3e2520.innerText = 'AG'),
    replaceImageModelTriggerFirstIcon(_0x134f1d, _0x3e2520));
}
export function setImageModelTriggerIcon(_0x2206f2, _0x47fcb3, _0x2c9a36 = null) {
  const _0x1b6037 = String(_0x47fcb3 || '')
    .trim()
    .toLowerCase();
  if (_0x1b6037 === 'apimart') {
    setApimartImageModelTriggerIcon(_0x2206f2, _0x2c9a36);
    return;
  }
  if (_0x1b6037 === 'agnes') {
    setAgnesImageModelTriggerIcon(_0x2206f2, _0x2c9a36);
    return;
  }
  if (_0x1b6037 === 'aicanvas') {
    setSimpleImageModelTriggerIcon(_0x2206f2, {
      src: 'images/favicon.svg',
      alt: 'aicanvas',
      className: 'image-model-trigger-icon-large',
    });
    return;
  }
  if (_0x1b6037 === 'runninghub' || _0x1b6037 === 'runninghubwf') {
    setSimpleImageModelTriggerIcon(_0x2206f2, {
      src: 'images/RH.png',
      alt: 'runninghub',
      className: 'image-model-trigger-icon-soft',
    });
    return;
  }
  if (_0x1b6037 === 'ppio') {
    setSimpleImageModelTriggerIcon(_0x2206f2, { src: 'images/gemini.svg', alt: 'ppio' });
    return;
  }
  if (_0x1b6037 === 'volcengine') {
    setSimpleImageModelTriggerIcon(_0x2206f2, { src: 'images/volcengine.svg', alt: 'volcengine' });
    return;
  }
  setSimpleImageModelTriggerIcon(_0x2206f2, {
    src: 'images/grsai.png',
    alt: 'grsai',
    className: 'image-model-trigger-icon-padded',
  });
}
export function renderImageModelTriggerIconHTML({ model: model = '', provider: provider = '' } = {}) {
  const _0x1cbc22 = String(model || '').trim(),
    _0x7b72cb = String(resolveModelProvider(_0x1cbc22, provider) || provider || '')
      .trim()
      .toLowerCase();
  if (_0x7b72cb === 'apimart')
    return '<div class="image-model-trigger-icon image-model-trigger-badge image-model-trigger-icon-apimart">AM</div>';
  if (_0x7b72cb === 'agnes')
    return '<div class="image-model-trigger-icon image-model-trigger-badge">AG</div>';
  if (_0x7b72cb === 'aicanvas' || _0x1cbc22.startsWith('aicanvas/'))
    return '<img src="images/favicon.svg" class="image-model-trigger-icon image-model-trigger-icon-large" alt="aicanvas">';
  if (_0x7b72cb === 'dreamina') return getDreaminaImageTriggerIconHTML();
  if (_0x7b72cb === 'runninghub' || _0x7b72cb === 'runninghubwf')
    return '<img src="images/RH.png" class="image-model-trigger-icon image-model-trigger-icon-soft" alt="runninghub">';
  if (_0x7b72cb === 'ppio')
    return '<img src="images/gemini.svg" class="image-model-trigger-icon" alt="ppio">';
  if (_0x7b72cb === 'volcengine')
    return '<img src="images/volcengine.svg" class="image-model-trigger-icon" alt="volcengine">';
  return '<img src="images/grsai.png" class="image-model-trigger-icon image-model-trigger-icon-padded" alt="grsai">';
}
export function buildNanoBananaFamilyMenuHTML(_0x2d1bca, _0x2804ec = '') {
  const _0x5750eb = _0x2d1bca?.provider === 'grsai' ? _0x2d1bca?.family || '' : '',
    _0x3f5c40 = normalizeGrsaiModelToken(_0x2804ec);
  return getImageModelMenuManifests('grsaiModel')
    .map((_0x2f508b) => {
      const _0x2e6282 = getImageMenuMeta(_0x2f508b) || {};
      if (_0x2e6282.role === 'directModel')
        return renderNodeMenuItem({
          modelId: _0x2f508b.modelId || GRSAI_GPT_IMAGE_2_MODEL,
          provider: 'grsai',
          label: _0x2e6282.title || _0x2f508b.displayName || 'GPT image 2',
          description: _0x2e6282.subtitle || _0x2f508b.description || '',
          iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
          active: isGrsaiGptImage2ModelToken(_0x3f5c40),
        });
      const _0x2347f3 = String(_0x2e6282.family || '').trim(),
        _0x3a521d = _0x2e6282.disabled === true,
        _0x263569 = _0x5750eb === _0x2347f3;
      return renderNodeMenuItem({
        label: _0x2e6282.title || _0x2f508b.displayName || _0x2347f3,
        description: _0x2e6282.subtitle || '',
        iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
        active: _0x263569,
        disabled: _0x3a521d,
        attrs: { 'data-nb-family': _0x2347f3 || undefined },
      });
    })
    .join('');
}
export function buildRunningHubNanoBananaFamilyMenuHTML(_0x48bde6, _0x228591 = '') {
  const _0x103fa2 = _0x48bde6?.provider === 'runninghub' ? _0x48bde6?.family || '' : '';
  return getImageModelMenuManifests('runninghubModel')
    .map((_0x5d196f) => {
      const _0x44cce3 = getImageMenuMeta(_0x5d196f) || {};
      if (_0x44cce3.role === 'directModel') return renderImageManifestMenuItemHTML(_0x5d196f, _0x228591);
      const _0x58ca7f = String(_0x44cce3.family || '').trim();
      return renderNodeMenuItem({
        provider: 'runninghub',
        label: _0x44cce3.title || _0x5d196f.displayName || _0x58ca7f,
        description: _0x44cce3.subtitle || _0x5d196f.description || '',
        icon: _0x44cce3.icon || _0x5d196f.icon || 'images/gemini.svg',
        iconAlt: _0x44cce3.alt || _0x58ca7f,
        active: _0x103fa2 === _0x58ca7f,
        attrs: { 'data-nb-family': _0x58ca7f || undefined },
      });
    })
    .join('');
}
export function shouldShowNanoBananaModeSelector({
  family: _0x357ef7,
  provider: provider = '',
  isModelApiManifest: isModelApiManifest = false,
} = {}) {
  if (!isNanoBananaFamily(_0x357ef7)) return false;
  return String(provider || '')
    .trim()
    .toLowerCase() === 'runninghub'
    ? true
    : !isModelApiManifest;
}
export function buildNanoBananaModeMenuHTML(_0x11e1a3, _0xf0a52d, _0x5d4fd5 = '') {
  if (!isNanoBananaFamily(_0x11e1a3)) return '';
  const _0x17ab3a = getNanoBananaModeOptions(_0x11e1a3, _0x5d4fd5);
  return _0x17ab3a
    .map((_0x8ce89e) => {
      const _0x28198c = _0x8ce89e.tooltip
          ? ' title="' +
            escapeHtmlAttr(_0x8ce89e.tooltip) +
            '" data-tooltip="' +
            escapeHtmlAttr(_0x8ce89e.tooltip) +
            '"'
          : '',
        _0x232193 = _0x8ce89e.mode === _0xf0a52d;
      return (
        '<div class="floating-menu-item ' +
        (_0x232193 ? 'active' : '') +
        '" data-nb-mode="' +
        _0x8ce89e.mode +
        '"' +
        _0x28198c +
        '><span class="floating-menu-label">' +
        _0x8ce89e.label +
        '</span></div>'
      );
    })
    .join('');
}
export function buildQwenImageEditModeMenuHTML(_0x1af5cb) {
  const _0xe13e1 = normalizeQwenImageEditMode(_0x1af5cb),
    _0x34899f = getQwenUiFieldOptions('rhQwenEditMode'),
    _0x2be5cb = _0x34899f.length
      ? _0x34899f
      : [
          { value: 'qwen2511', label: '2511' },
          { value: 'qwen2509', label: '2509' },
        ];
  return _0x2be5cb
    .map((_0x1c7489) => {
      const _0x173151 = escapeHtmlAttr(getQwenImageEditModeTooltip(_0x1c7489.value));
      return (
        '<div class="floating-menu-item ' +
        (_0xe13e1 === _0x1c7489.value ? 'active' : '') +
        '" data-qwen-mode="' +
        _0x1c7489.value +
        '" title="' +
        _0x173151 +
        '" data-tooltip="' +
        _0x173151 +
        '"><span class="floating-menu-label">' +
        _0x1c7489.label +
        '</span></div>'
      );
    })
    .join('');
}
export function buildQwenImageEditModelMenuItemHTML(_0x85a26f) {
  return buildManifestModelMenuItemHTML(QWEN_IMAGE_EDIT_MODEL_ID, _0x85a26f, {
    title: t('aigenImage.modelMenu.qwenEdit.title'),
    description: t('aigenImage.modelMenu.qwenEdit.description'),
  });
}
export function buildAnimeRealModelMenuItemHTML(_0x5b29b9) {
  return buildManifestModelMenuItemHTML(ANIME_REAL_MODEL_ID, _0x5b29b9, {
    title: t('aigenImage.modelMenu.animeReal.title'),
    description: t('aigenImage.modelMenu.animeReal.description'),
  });
}
export function buildPersonReplaceV21ModelMenuItemHTML(_0xf75509) {
  return buildManifestModelMenuItemHTML(PERSON_REPLACE_V21_MODEL_ID, _0xf75509, {
    title: t('aigenImage.modelMenu.personReplaceV21.title'),
    description: t('aigenImage.modelMenu.personReplaceV21.description'),
  });
}
export function buildPersonReplaceV3ModelMenuItemHTML(_0x4e2e73) {
  return buildManifestModelMenuItemHTML(PERSON_REPLACE_V3_MODEL_ID, _0x4e2e73, {
    title: t('aigenImage.modelMenu.personReplaceV3.title'),
    description: t('aigenImage.modelMenu.personReplaceV3.description'),
  });
}
function buildManifestModelMenuItemHTML(_0x377a92, _0x2263da, _0x90be26 = {}) {
  const _0x8961ca = getModelManifest(_0x377a92),
    _0x3fd3ce = _0x8961ca?.modelId || _0x377a92,
    _0xb97ce1 = _0x8961ca?.provider || 'runninghubwf',
    _0x564621 = _0x8961ca?.icon || 'images/RH.png',
    _0x34c5de = _0x8961ca?.displayName || _0x90be26.title || _0x3fd3ce,
    _0x2b6009 = _0x8961ca?.description || _0x90be26.description || '',
    _0x112af9 = _0x8961ca?.vip === true || _0x90be26.vip === true,
    _0x2a804c = getModelManifest(_0x2263da),
    _0x296f91 = _0x2263da === _0x377a92 || _0x2263da === _0x3fd3ce || _0x2a804c?.modelId === _0x3fd3ce;
  return renderNodeMenuItem(
    {
      modelId: _0x3fd3ce,
      provider: _0xb97ce1,
      label: _0x34c5de,
      description: _0x2b6009,
      icon: _0x564621,
      iconAlt: 'runninghub',
      vip: _0x112af9,
      active: _0x296f91,
    },
    { activeModel: _0x2263da },
  );
}
export function buildQwenFirstImageModeControlsHTML(_0x2851f4) {
  const _0x2560e6 = normalizeQwenFirstImageMode(_0x2851f4);
  return getQwenFirstImageModeOptions()
    .map((_0x1385e4) => {
      const _0x158e1d = normalizeQwenFirstImageMode(_0x1385e4.value);
      return (
        '<button type="button" class="img-rp-quality-item qwen-first-image-mode-opt ' +
        (_0x2560e6 === _0x158e1d ? 'active' : '') +
        '" data-value="' +
        escapeHtmlAttr(_0x158e1d) +
        '">' +
        escapeHtmlAttr(_0x1385e4.label) +
        '</button>'
      );
    })
    .join('');
}

export const VOLCENGINE_SEEDREAM_5_PRO_MODEL='volcengine/seedream-5.0-pro';

const OPENAI_CLI_LOGO_ICON_HTML = renderOpenAiLogoHtml("node-menu-icon");
const COMFYUI_CLOUD_WORKFLOW_ICON_HTML = renderComfyUiCloudWorkflowLogoHtml({'className':"node-menu-icon"});
const COMFYUI_LOCAL_WORKFLOW_ICON_HTML = renderComfyUiLocalWorkflowLogoHtml({'className':"node-menu-icon"});

const IMAGE_SIZE_ORDER=Object["freeze"](['1K','2K','3K','4K']);

function normalizeImageSizeToken(_0x3a87e7){return String(_0x3a87e7||'')["trim"]()["toUpperCase"]();}

function pickSupportedImageSize(_0x13d3ca,_0x50c7bd){const _0x583da9=(Array["isArray"](_0x50c7bd?.['options'])?_0x50c7bd["options"]:[])["map"](_0x4b42eb=>normalizeImageSizeToken(_0x4b42eb?.["value"]??_0x4b42eb))["filter"](Boolean),_0x476bc2=normalizeImageSizeToken(_0x13d3ca);if(!_0x583da9['length']||!_0x476bc2||_0x583da9['includes'](_0x476bc2))return'';const _0x217c60=IMAGE_SIZE_ORDER['indexOf'](_0x476bc2),_0x3d2c32=_0x583da9["map"](_0x4a7ad2=>({'value':_0x4a7ad2,'rank':IMAGE_SIZE_ORDER["indexOf"](_0x4a7ad2)}))["filter"](_0x51749f=>_0x51749f["rank"]>=0x0)["sort"]((_0x5bd771,_0x2c6128)=>_0x5bd771["rank"]-_0x2c6128["rank"]);if(_0x217c60>=0x0&&_0x3d2c32["length"]>0x0){const _0x36f0a7=_0x3d2c32["filter"](_0x332d8b=>_0x332d8b["rank"]<=_0x217c60)['at'](-0x1);return _0x36f0a7?.['value']||_0x3d2c32[0x0]['value'];}const _0x34cc51=normalizeImageSizeToken(_0x50c7bd?.["defaultValue"]);return _0x583da9["includes"](_0x34cc51)?_0x34cc51:_0x583da9[0x0];}

const BINGHUO_BADGE_ICON_HTML = "<div class=\"node-menu-icon node-menu-icon-badge\">BH</div>";

function isSavedRhAiAppManifest(_0xb19cfe){return Boolean(String(_0xb19cfe?.["extensions"]?.['rhAiApp']?.["appKey"]||'')["trim"]());}

function isSavedComfyUiWorkflowManifest(_0x4c652c){return Boolean(String(_0x4c652c?.["extensions"]?.["comfyUiWorkflow"]?.['appKey']||'')["trim"]());}

function getCustomProviderMeta(_0x3201fd){const _0x1875e1=_0x3201fd?.["extensions"]?.['customProvider'];return _0x1875e1&&typeof _0x1875e1==="object"?_0x1875e1:null;}

function getCustomProviderBadgeText(_0x46377a,_0x4d6771={}){return String(getCustomProviderMeta(_0x46377a)?.["badge"]||_0x4d6771["badge"]||'CP')['trim']()["slice"](0x0,0x2)||'CP';}

function getCustomProviderImageGroups(_0x338c4b=''){const _0x59855b=new Map();return getModelsByKind('image')['filter'](isModelManifestPubliclyListed)["forEach"](_0x1840a1=>{const _0x1d3f1a=getImageMenuMeta(_0x1840a1),_0x1bd09c=getCustomProviderMeta(_0x1840a1),_0x28bd60=String(_0x1d3f1a?.["group"]||_0x1840a1?.["provider"]||'')["trim"]();if(!_0x1d3f1a||!_0x1bd09c||!_0x28bd60)return;!_0x59855b["has"](_0x28bd60)&&_0x59855b["set"](_0x28bd60,{'providerId':_0x28bd60,'displayName':_0x1bd09c["displayName"]||_0x28bd60,'subtitle':_0x1d3f1a["subtitle"]||"自定义中转站",'badge':_0x1bd09c["badge"]||_0x1d3f1a["badge"]||'CP','items':[]}),_0x59855b["get"](_0x28bd60)["items"]['push'](_0x1840a1);}),Array["from"](_0x59855b["values"]())["map"](_0x4638cf=>{const _0x464ea7=_0x4638cf["providerId"]["replace"](/[^A-Za-z0-9_-]/g,'-');return renderImageMenuGroupHTML({'headerClass':"custom-provider-image-group-header custom-provider-image-group-"+_0x464ea7,'toggleAttr':"data-custom-provider-image-toggle",'submenuClass':"custom-provider-image-submenu-"+_0x464ea7,'iconHtml':"<div class=\"node-menu-icon node-menu-icon-badge\">"+escapeHtmlAttr(_0x4638cf["badge"])+"</div>",'title':_0x4638cf['displayName'],'subtitle':_0x4638cf['subtitle'],'attrs':{'data-custom-provider-image-group':_0x4638cf["providerId"]},'itemsHtml':_0x4638cf['items']["sort"]((_0x4e2ce4,_0x5bfbb3)=>Number(getImageMenuMeta(_0x4e2ce4)?.['order']||0x0)-Number(getImageMenuMeta(_0x5bfbb3)?.["order"]||0x0))['map'](_0x285746=>renderImageManifestMenuItemHTML(_0x285746,_0x338c4b))["join"]('')});});}

export function buildBinghuoImageMenuGroupHTML(_0x5d198f){const _0xced180=getImageModelMenuManifests('binghuo')["map"](_0x38a80d=>renderImageManifestMenuItemHTML(_0x38a80d,_0x5d198f))["join"]('');if(!_0xced180)return'';return renderImageMenuGroupHTML({'headerClass':"binghuo-image-group-header",'toggleAttr':"data-binghuo-image-toggle",'submenuClass':'binghuo-image-submenu','iconHtml':BINGHUO_BADGE_ICON_HTML,'title':"便宜渠道bh",'subtitle':'炳火图片生成\x20API','itemsHtml':_0xced180});}

function buildOfficialImageMenuGroupHTML(_0x30944e,_0x14fe94,_0xecb9ae,_0x2cd50c,_0x37d947){const _0x524885=getImageModelMenuManifests(_0x14fe94)["map"](_0xc44faf=>renderImageManifestMenuItemHTML(_0xc44faf,_0x30944e))['join']('');return renderImageMenuGroupHTML({'headerClass':_0x14fe94+"-group-header",'toggleAttr':"data-"+_0x14fe94+"-toggle",'submenuClass':_0x14fe94+"-submenu",'iconHtml':"<img src=\""+_0x2cd50c+'\x22\x20class=\x22node-menu-icon\x22\x20alt=\x22'+_0x14fe94+'\x22>','title':_0xecb9ae,'subtitle':_0x37d947,'itemsHtml':_0x524885});}

export function buildOpenAiCliImageMenuGroupHTML(_0x5d86e3){const _0x5b4681=getImageModelMenuManifests('openai-cli')["map"](_0x2cc9de=>renderImageManifestMenuItemHTML(_0x2cc9de,_0x5d86e3))['join']('');if(!_0x5b4681)return'';return renderImageMenuGroupHTML({'headerClass':"openai-cli-image-group-header",'toggleAttr':"data-openai-cli-image-toggle",'submenuClass':"openai-cli-image-submenu",'iconHtml':OPENAI_CLI_LOGO_ICON_HTML,'title':"OpenAI CLI",'subtitle':"使用本机已登录的 OpenAI CLI 账号",'itemsHtml':_0x5b4681});}

export function buildRhAiAppImageMenuGroupHTML(_0x5314ab){const _0x4e0240=getImageModelMenuManifests("rhAiApp")["map"](_0x4d1990=>renderImageManifestMenuItemHTML(_0x4d1990,_0x5314ab))['join']('');if(!_0x4e0240)return'';return renderImageMenuGroupHTML({'headerClass':'rh-ai-app-image-group-header','toggleAttr':"data-rh-ai-app-toggle",'submenuClass':"rh-ai-app-image-submenu",'iconHtml':"<img src=\"images/RH.png\" class=\"node-menu-icon\" alt=\"runninghub\">",'title':"RH AI应用",'subtitle':"自定义 RunningHub AI App",'itemsHtml':_0x4e0240});}

function buildComfyUiWorkflowImageMenuGroupHTML({activeModel:_0x13deba,group:_0x43b15e,headerClass:_0x15d520,toggleAttr:_0x347778,submenuClass:_0x5b2461,iconHtml:_0x5ddba9,title:_0x46cebd,subtitle:_0x5d3930}={}){const _0x593928=getImageModelMenuManifests(_0x43b15e)["map"](_0x3f5be1=>renderImageManifestMenuItemHTML(_0x3f5be1,_0x13deba))["join"]('');if(!_0x593928)return'';return renderImageMenuGroupHTML({'headerClass':_0x15d520,'toggleAttr':_0x347778,'submenuClass':_0x5b2461,'iconHtml':_0x5ddba9,'title':_0x46cebd,'subtitle':_0x5d3930,'itemsHtml':_0x593928});}

export function buildComfyUiCloudWorkflowImageMenuGroupHTML(_0x31a9f9){return buildComfyUiWorkflowImageMenuGroupHTML({'activeModel':_0x31a9f9,'group':"comfyUiCloudWorkflow",'headerClass':"comfyui-cloud-workflow-group-header",'toggleAttr':"data-comfyui-cloud-workflow-toggle",'submenuClass':'comfyui-cloud-workflow-submenu','iconHtml':COMFYUI_CLOUD_WORKFLOW_ICON_HTML,'title':"云端工作流",'subtitle':"保存的 ComfyUI 云端工作流"});}

export function buildComfyUiLocalWorkflowImageMenuGroupHTML(_0x98f744){return buildComfyUiWorkflowImageMenuGroupHTML({'activeModel':_0x98f744,'group':'comfyUiLocalWorkflow','headerClass':"comfyui-local-workflow-group-header",'toggleAttr':"data-comfyui-local-workflow-toggle",'submenuClass':'comfyui-local-workflow-submenu','iconHtml':COMFYUI_LOCAL_WORKFLOW_ICON_HTML,'title':"本地工作流",'subtitle':'保存的\x20ComfyUI\x20本地工作流'});}

function createImageTriggerIconFromHTML(_0x435d18,_0x13aaec){const _0x595a42=_0x435d18?.["ownerDocument"]||(typeof document!=="undefined"?document:null),_0xb60fd4=_0x595a42?.['createElement']?.("template");if(!_0xb60fd4)return null;return _0xb60fd4["innerHTML"]=String(_0x13aaec||'')['trim'](),_0xb60fd4["content"]?.["firstElementChild"]||null;}

function setOpenAiCliImageModelTriggerIcon(_0x163add){const _0x3f3954=createImageTriggerIconFromHTML(_0x163add,renderOpenAiLogoHtml("image-model-trigger-icon"));if(!_0x3f3954)return;replaceImageModelTriggerFirstIcon(_0x163add,_0x3f3954);}

function getComfyUiWorkflowIconKind(_0x158576='',_0x19d488=null){const _0x144eee=_0x19d488?.["querySelector"]?.(".custom-ai-app-logo");if(_0x144eee?.['classList']?.["contains"]('custom-ai-app-logo--comfyui-cloud'))return "comfyUiCloudWorkflowBadge";if(_0x144eee?.["classList"]?.["contains"]("custom-ai-app-logo--comfyui-local"))return "comfyUiLocalWorkflowBadge";const _0x5c41d7=String(_0x158576||'')["trim"]()||String(_0x19d488?.["dataset"]?.["value"]||_0x19d488?.["getAttribute"]?.('data-value')||'')['trim'](),_0x33ffb7=String(getModelManifest(_0x5c41d7)?.["extensions"]?.["imageMenu"]?.["iconKind"]||'')["trim"]();return _0x33ffb7;}

function renderComfyUiWorkflowTriggerIconHTML(_0x554b35=''){return renderComfyUiWorkflowLogoHtmlFromIconKind(getComfyUiWorkflowIconKind(_0x554b35),{'className':"image-model-trigger-icon"});}

function setComfyUiWorkflowTriggerIcon(_0x2e7428,_0x3b76d2=null){const _0x1f02dd=createImageTriggerIconFromHTML(_0x2e7428,renderComfyUiWorkflowLogoHtmlFromIconKind(getComfyUiWorkflowIconKind('',_0x3b76d2),{'className':"image-model-trigger-icon"}));if(!_0x1f02dd)return;replaceImageModelTriggerFirstIcon(_0x2e7428,_0x1f02dd);}

function resolveImageTriggerManifest(_0x10a88c='',_0x1007f5=''){const _0x7efdf7=String(_0x10a88c||'')['trim']();if(_0x7efdf7){const _0x591da8=getModelManifest(_0x7efdf7);if(_0x591da8)return _0x591da8;}const _0x2a2308=String(_0x1007f5||'')['trim']();if(!_0x7efdf7&&!_0x2a2308)return null;try{return resolveModelExecution(_0x7efdf7,{'providerHint':_0x2a2308})?.["modelManifest"]||resolveModelExecution(_0x7efdf7)?.['modelManifest']||null;}catch{return null;}}

function renderCustomProviderTriggerBadgeHTML(_0xbbadfe,_0x3bf6ae={}){const _0x3b4b90=getCustomProviderBadgeText(_0xbbadfe,_0x3bf6ae);return "<div class=\"image-model-trigger-icon image-model-trigger-badge\">"+escapeHtmlAttr(_0x3b4b90)+"</div>";}

function setCustomProviderImageModelTriggerIcon(_0x1cea6d,_0xa51346,_0x2376bf={}){const _0x2a2ec9=createImageTriggerIcon(_0x1cea6d,"div");if(!_0x2a2ec9)return;_0x2a2ec9['className']="image-model-trigger-icon image-model-trigger-badge",_0x2a2ec9["innerText"]=getCustomProviderBadgeText(_0xa51346,_0x2376bf),replaceImageModelTriggerFirstIcon(_0x1cea6d,_0x2a2ec9);}

export function syncImageModelTriggerIcon(_0x59910f,_0x4bf2e3={}){if(!_0x59910f||!_0x4bf2e3?.['model'])return;const _0x179af3=createImageTriggerIconFromHTML(_0x59910f,renderImageModelTriggerIconHTML({'model':_0x4bf2e3['model'],'provider':_0x4bf2e3["provider"]})),_0x53096f=_0x59910f["firstElementChild"];_0x179af3&&_0x53096f?.['outerHTML']!==_0x179af3['outerHTML']&&_0x53096f?.["replaceWith"]?.(_0x179af3);}
