import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  buildDreaminaStyleVideoNodeNormalizationPatch,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDurationRange,
  getDreaminaStyleVideoResolutionOptions,
  getDreaminaVideoTaskParamVisibility,
  isApimartDreaminaVideoModel,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoDuration,
  getDreaminaStyleVideoDefaultModel,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../../modules/dreaminaVideoModelHelper.js';
import {
  getModelManifest,
  normalizeProviderId,
  resolveModelExecution,
  resolveModelProvider,
} from '../../manifests/index.js';
import {
  buildFixedInputAssetSlotMap,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { flushPromptHtmlCommit, resolvePromptTextWithTextRefs } from '../../modules/nodePromptShared.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../../utils/debugRequestPreview.js';
import { resolveGenerationButtonMode } from '../../core/generationTaskUiState.js';
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import {
  buildModelUiSchemaDefaultParams,
  bindUiSchemaFieldControls,
  bindModelUiSchemaControls,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
  sanitizeModelUiSchemaParams,
  syncModelUiSchemaControls,
} from '../aigenImage/uiSchemaRenderer.js';
import {
  applyImageSchemaRatioResizeAnimation,
  buildImageSchemaAspectRatioDisplayPatch,
} from '../aigenImage/uiModuleModelHelpers.js';
import { renderNodeModelMenu, renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import {
  bindNodeFooterController,
  bindNodeSubmenus,
  closeNodeFooterMenus,
} from '../shared/nodeFooterControls.js';
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  getRunningHubVideoWorkflowFpsOptions,
  getRunningHubVideoParameterPanelPolicy,
  getPlainGenerationParams,
  hasRunningHubVideoWorkflowUiPlacement,
  isRunningHubVideoWorkflowManifest,
} from './runningHubVideoUiSchema.js';
import {
  arePlainObjectsEqual,
  buildAgnesVideoLogoHTML,
  buildAgnesVideoMenuItemsHtml,
  buildApimartVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildDreaminaVideoLogoHTML,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaTaskModelMenuHtml,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getDefaultRunningHubVideoWorkflowModelId,
  getDreaminaTaskModelMenuItems,
  getDreaminaTaskModelMenuMeta,
  getRhV54FpsOptions,
  normalizeRhStandardFps,
  normalizeRhV54Fps,
} from './parameterPanelModelHelpers.js';
import {
  buildDreaminaParamPatch,
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamSchemaFields,
  buildDreaminaRouteModeUpdate,
  buildDreaminaStorePatchFromNormalization,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from './dreaminaParameterSchema.js';
import { t } from '../../i18n/index.js';
import { translateManifestText } from '../../i18n/manifestText.js';
const VIDEO_ADAPTIVE_RATIO_VALUE = '自适应',
  VIDEO_MODE_ALL_REFERENCE_VALUE = '全能参考',
  VIDEO_MODE_FIRST_LAST_VALUE = '首尾帧';
function videoPanelText(_0x2e89f1, _0x31c3d3 = {}) {
  return t('videoNode.parameterPanel.' + _0x2e89f1, _0x31c3d3);
}
function getVideoGenerateTitle() {
  return videoPanelText('generateTitle');
}
function getVideoCancelTooltip() {
  return videoPanelText('cancelTooltip');
}
function getDefaultVideoPromptPlaceholder() {
  return videoPanelText('defaultPromptPlaceholder');
}
function formatVideoAspectRatioLabel(_0x4eb743) {
  const _0x1b95eb = String(_0x4eb743 || '').trim();
  if (!_0x1b95eb || _0x1b95eb === VIDEO_ADAPTIVE_RATIO_VALUE) return videoPanelText('adaptive');
  return _0x1b95eb;
}
function formatVideoRatioResolutionLabel(_0x5bc0ce, _0x3460e4) {
  return videoPanelText('ratioResolutionLabel', {
    aspectRatio: formatVideoAspectRatioLabel(_0x5bc0ce),
    resolution: _0x3460e4,
  });
}
function getVideoModeLabel(_0x2c41a6) {
  const _0x48109c = String(_0x2c41a6 || '').trim() || VIDEO_MODE_ALL_REFERENCE_VALUE;
  if (_0x48109c === VIDEO_MODE_ALL_REFERENCE_VALUE) return videoPanelText('mode.allReference');
  if (_0x48109c === VIDEO_MODE_FIRST_LAST_VALUE) return videoPanelText('mode.firstLastFrame');
  return _0x48109c;
}
function getDreaminaProviderLabel(_0x286dea) {
  const _0x5e8f77 = String(_0x286dea || '')
    .trim()
    .toLowerCase();
  if (_0x5e8f77 === 'dreamina') return videoPanelText('providers.dreamina');
  if (_0x5e8f77 === 'volcengine') return videoPanelText('providers.volcengine');
  return videoPanelText('providers.default');
}
const APIMART_KLING_V3_OMNI_MODEL_ID = 'apimart/kling-v3-omni',
  HAPPYHORSE_BODY_RESOLVERS = new Set(['apimartHappyHorseVideo', 'runninghubHappyHorseVideo']),
  WAN27_BODY_RESOLVERS = new Set(['apimartWan27Video', 'runninghubWan27Video']),
  RH_WORKFLOW_DISPLAY_FIELD_IDS = new Set([
    'rhVideoResolution',
    'rhVideoFps',
    'rhVideoFrames',
    'rhVideoSeconds',
  ]),
  RH_V54_BOOLEAN_FIELD_IDS = new Set(['rhBlendIntoScene', 'rhSubtractSubject', 'rhMaskRect']),
  RH_WORKFLOW_BOOLEAN_FIELD_IDS = new Set([...RH_V54_BOOLEAN_FIELD_IDS, 'rhEnableMask']);
function getDefaultVideoModelId() {
  return getDefaultRunningHubVideoWorkflowModelId();
}
function normalizeRhVideoFpsByPolicy(_0x199a12, _0x58f659) {
  return _0x199a12?.sourceFrameCountFps === 'v54'
    ? normalizeRhV54Fps(_0x58f659)
    : normalizeRhStandardFps(_0x58f659);
}
function findPreferredVideoEdge(_0x46c85b, _0xb6fcd4) {
  return _0x46c85b.find((_0x2fd652) => {
    const _0x23b1e0 = _0xb6fcd4?.nodes?.[_0x2fd652?.sourceId],
      _0x212803 = String(_0x23b1e0?.type || '');
    return _0x212803 === 'source-video' || _0x212803 === 'video' || _0x212803 === 'ai-video';
  });
}
function normalizeRhV54SingleControlPreset(_0x3a4c0a) {
  const _0x543f2b = String(_0x3a4c0a ?? '').trim();
  return _0x543f2b === 'efficiency' || _0x543f2b === 'stable' || _0x543f2b === 'quality'
    ? _0x543f2b
    : 'efficiency';
}
function normalizeRhV54SpecialModeValue(_0x11db89) {
  const _0x1c4120 = String(_0x11db89 ?? '').trim();
  return _0x1c4120 === 'longVideoOverlay' || _0x1c4120 === 'cameraMove' ? _0x1c4120 : null;
}
function normalizeRhV54MaskExpandValue(_0x1e0556) {
  const _0x25caf0 = Number(_0x1e0556);
  return Number.isFinite(_0x25caf0) ? Math.max(-0x270f, Math.min(0x270f, Math.trunc(_0x25caf0))) : 25;
}
function normalizeRhV54BreastJiggleValue(_0x11069f) {
  const _0x56f696 = Number(_0x11069f);
  if (!Number.isFinite(_0x56f696)) return 0;
  return Math.max(0, Math.min(1, Math.round(_0x56f696 * 20) / 20));
}
function isApimartPanelModel(_0xd36026 = {}, _0x5e0d3c = '') {
  const _0x28c764 = String(_0xd36026?.provider || '')
      .trim()
      .toLowerCase(),
    _0x2ff4f1 = String(_0xd36026?.model || '').trim(),
    _0x386c70 =
      resolveModelExecution(_0x2ff4f1, { providerHint: _0x28c764 }) || resolveModelExecution(_0x2ff4f1),
    _0x28cac0 = String(_0x386c70?.canonicalModelId || _0x386c70?.modelManifest?.modelId || _0x2ff4f1).trim(),
    _0x1191a4 = String(_0x386c70?.modelManifest?.provider || _0x28c764)
      .trim()
      .toLowerCase();
  return _0x28cac0 === _0x5e0d3c && (!_0x1191a4 || _0x1191a4 === 'apimart');
}
function isHappyHorsePanelModel(_0x459d0a = {}) {
  return isPanelModelUsingBodyResolver(_0x459d0a, HAPPYHORSE_BODY_RESOLVERS);
}
function isPanelModelUsingBodyResolver(_0x5d19b4 = {}, _0x461048 = new Set()) {
  const _0x48d69a = String(_0x5d19b4?.provider || '')
      .trim()
      .toLowerCase(),
    _0x2e7f5a = String(_0x5d19b4?.model || '').trim(),
    _0x4a91e3 =
      resolveModelExecution(_0x2e7f5a, { providerHint: _0x48d69a }) || resolveModelExecution(_0x2e7f5a),
    _0x2fca35 = String(_0x4a91e3?.executionManifest?.extensions?.bodyResolver || '').trim();
  return _0x2fca35 && _0x461048.has(_0x2fca35);
}
function isWan27PanelModel(_0x1e32b7 = {}) {
  return isPanelModelUsingBodyResolver(_0x1e32b7, WAN27_BODY_RESOLVERS);
}
function isKlingV3OmniPanelModel(_0x196631 = {}) {
  return isApimartPanelModel(_0x196631, APIMART_KLING_V3_OMNI_MODEL_ID);
}
function getPanelModelManifest(_0x3f2ab6 = {}) {
  const _0x255643 = String(_0x3f2ab6?.model || '').trim();
  if (!_0x255643) return null;
  const _0x379da4 =
    resolveModelExecution(_0x255643, { providerHint: _0x3f2ab6?.provider }) ||
    resolveModelExecution(_0x255643);
  return _0x379da4?.modelManifest || getModelManifest(_0x255643) || null;
}
function getManifestConditionFieldValue(_0x530474 = {}, _0x14976a = '') {
  const _0x4209e4 = String(_0x14976a || '').trim();
  if (!_0x4209e4) return undefined;
  const _0x2279be = getPlainGenerationParams(_0x530474?.generationParams);
  if (Object.prototype.hasOwnProperty.call(_0x2279be, _0x4209e4)) return _0x2279be[_0x4209e4];
  if (Object.prototype.hasOwnProperty.call(_0x530474 || {}, _0x4209e4)) return _0x530474[_0x4209e4];
  const _0x3e5eb2 = _0x4209e4.split('.').filter(Boolean);
  if (_0x3e5eb2.length <= 1) return undefined;
  let _0x565619 = _0x530474;
  for (const _0x2ff32b of _0x3e5eb2) {
    if (!_0x565619 || typeof _0x565619 !== 'object') return undefined;
    _0x565619 = _0x565619[_0x2ff32b];
  }
  return _0x565619;
}
function manifestConditionMatches(_0x1b8e9d, _0x310a21 = {}) {
  if (Array.isArray(_0x1b8e9d))
    return _0x1b8e9d.some((_0x178df5) => manifestConditionMatches(_0x178df5, _0x310a21));
  if (!_0x1b8e9d || typeof _0x1b8e9d !== 'object') return false;
  if (Array.isArray(_0x1b8e9d.any))
    return _0x1b8e9d.any.some((_0x20a67f) => manifestConditionMatches(_0x20a67f, _0x310a21));
  if (Array.isArray(_0x1b8e9d.all))
    return _0x1b8e9d.all.every((_0x4d4dc0) => manifestConditionMatches(_0x4d4dc0, _0x310a21));
  const _0x3a44bf = String(_0x1b8e9d.field || _0x1b8e9d.param || '').trim();
  if (!_0x3a44bf) return false;
  const _0x3d58b2 = getManifestConditionFieldValue(_0x310a21, _0x3a44bf),
    _0x3f714b = Array.isArray(_0x1b8e9d.values)
      ? _0x1b8e9d.values
      : Object.prototype.hasOwnProperty.call(_0x1b8e9d, 'value')
        ? [_0x1b8e9d.value]
        : [];
  if (_0x3f714b.length === 0) return Boolean(_0x3d58b2);
  return _0x3f714b.some(
    (_0x3068c3) => _0x3d58b2 === _0x3068c3 || String(_0x3d58b2 ?? '') === String(_0x3068c3 ?? ''),
  );
}
function resolveManifestPromptPlaceholder(_0x9f4219, _0x40e10f = {}) {
  if (!_0x9f4219 || typeof _0x9f4219 !== 'object') return '';
  const _0x69e477 = Array.isArray(_0x9f4219.variants) ? _0x9f4219.variants : [];
  for (const _0x46d7d4 of _0x69e477) {
    if (_0x46d7d4 && typeof _0x46d7d4 === 'object' && manifestConditionMatches(_0x46d7d4.when, _0x40e10f)) {
      const _0x3b013c = translateManifestText(_0x46d7d4.placeholder || '').trim();
      if (_0x3b013c) return _0x3b013c;
    }
  }
  return translateManifestText(_0x9f4219.placeholder || '').trim();
}
export function resolveVideoPromptPlaceholder(
  _0x4bd378,
  _0x393245 = {},
  _0x2d927d = getDefaultVideoPromptPlaceholder(),
) {
  const _0x3eb9ea = resolveManifestPromptPlaceholder(_0x4bd378?.prompt, _0x393245);
  return _0x3eb9ea || String(_0x2d927d || '').trim();
}
export function shouldShowVideoPromptInput(_0x912ef4) {
  if (!_0x912ef4 || typeof _0x912ef4 !== 'object') return true;
  if (_0x912ef4?.prompt?.visible === false) return false;
  if (_0x912ef4?.prompt?.hidden === true) return false;
  return true;
}
function fieldConditionReferences(_0x127044, _0x390dcc) {
  const _0x3b7116 = String(_0x390dcc || '').trim();
  if (Array.isArray(_0x127044))
    return _0x127044.some((_0x52b99f) => fieldConditionReferences(_0x52b99f, _0x3b7116));
  if (!_0x3b7116 || !_0x127044 || typeof _0x127044 !== 'object') return false;
  if (String(_0x127044.field || _0x127044.param || '').trim() === _0x3b7116) return true;
  return ['all', 'any'].some(
    (_0x22676c) =>
      Array.isArray(_0x127044[_0x22676c]) &&
      _0x127044[_0x22676c].some((_0x972194) => fieldConditionReferences(_0x972194, _0x3b7116)),
  );
}
function manifestHelpVariantsReferenceField(_0x534ff4, _0x125180) {
  const _0x43cc55 = Array.isArray(_0x534ff4?.help?.variants) ? _0x534ff4.help.variants : [];
  return _0x43cc55.some((_0x38f930) => fieldConditionReferences(_0x38f930?.when, _0x125180));
}
function manifestPromptVariantsReferenceField(_0xda14cd, _0x2da79d) {
  const _0x1ff88a = Array.isArray(_0xda14cd?.prompt?.variants) ? _0xda14cd.prompt.variants : [];
  return _0x1ff88a.some((_0x77b887) => fieldConditionReferences(_0x77b887?.when, _0x2da79d));
}
function manifestFixedSlotVisibilityReferencesField(_0x525153, _0x422651) {
  const _0x220156 = Array.isArray(_0x525153?.inputSlots?.fixedSlots) ? _0x525153.inputSlots.fixedSlots : [];
  return _0x220156.some(
    (_0x138473) =>
      fieldConditionReferences(_0x138473?.showWhen, _0x422651) ||
      fieldConditionReferences(_0x138473?.hideWhen, _0x422651),
  );
}
function normalizeHappyHorsePanelMode(_0x2f3a81) {
  const _0x5bf8ac = String(_0x2f3a81 || '')
    .trim()
    .toLowerCase();
  return _0x5bf8ac === 'image' || _0x5bf8ac === 'reference' || _0x5bf8ac === 'edit' ? _0x5bf8ac : 'auto';
}
function normalizeWan27PanelMode(_0x1236e1) {
  const _0x2a1661 = String(_0x1236e1 || '')
    .trim()
    .toLowerCase();
  return _0x2a1661 === 'video' || _0x2a1661 === 'reference' || _0x2a1661 === 'edit' ? _0x2a1661 : 'image';
}
function normalizeKlingV3OmniPanelMode(_0x504959) {
  const _0x123880 = String(_0x504959 || '')
    .trim()
    .toLowerCase();
  return _0x123880 === 'reference' || _0x123880 === 'edit' ? _0x123880 : 'image';
}
function getPanelInputKind(_0xbda26f, _0x10c9a2) {
  const _0x379f40 = resolveEffectiveInputKind(_0xbda26f, _0x10c9a2);
  if (_0x379f40) return _0x379f40;
  const _0xfd705d = String(_0xbda26f?.type || '').toLowerCase();
  if (_0xfd705d.includes('video')) return 'video';
  if (_0xfd705d.includes('image')) return 'image';
  if (_0xfd705d.includes('audio')) return 'audio';
  if (_0xfd705d.includes('text')) return 'text';
  return '';
}
function getHappyHorseModeEdgeIdsToRemove({
  nextMode: _0x4bbf52,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const _0x3fa4b5 = normalizeHappyHorsePanelMode(_0x4bbf52),
    _0x2d3ac9 = [];
  let _0x3771c1 = 0,
    _0x471042 = 0;
  for (const _0x272633 of Array.isArray(inEdges) ? inEdges : []) {
    const _0x464b11 = nodes?.[_0x272633?.sourceId],
      _0x11569b = getPanelInputKind(_0x464b11, _0x272633);
    if (_0x11569b === 'video') {
      if (_0x3fa4b5 === 'edit' && _0x471042 < 1) _0x471042 += 1;
      else _0x272633?.id && _0x2d3ac9.push(_0x272633.id);
      continue;
    }
    if (_0x11569b === 'image') {
      if (_0x3fa4b5 === 'image') {
        if (_0x3771c1 < 1) _0x3771c1 += 1;
        else {
          if (_0x272633?.id) _0x2d3ac9.push(_0x272633.id);
        }
      } else {
        if (_0x3fa4b5 === 'edit') {
          if (_0x3771c1 < 5) _0x3771c1 += 1;
          else {
            if (_0x272633?.id) _0x2d3ac9.push(_0x272633.id);
          }
        } else {
          if (_0x3fa4b5 === 'reference') {
            if (_0x3771c1 < 9) _0x3771c1 += 1;
            else {
              if (_0x272633?.id) _0x2d3ac9.push(_0x272633.id);
            }
          }
        }
      }
      continue;
    }
    _0x11569b === 'audio' && _0x272633?.id && _0x2d3ac9.push(_0x272633.id);
  }
  return _0x2d3ac9;
}
function getWan27ModeEdgeIdsToRemove({ nextMode: _0xbeaba6, inEdges: inEdges = [], nodes: nodes = {} } = {}) {
  const _0x42cbf9 = normalizeWan27PanelMode(_0xbeaba6),
    _0x5cadb8 = [];
  let _0xc330e6 = 0,
    _0x25cefc = 0,
    _0x43fcb5 = 0;
  for (const _0x339f3a of Array.isArray(inEdges) ? inEdges : []) {
    const _0x17c685 = nodes?.[_0x339f3a?.sourceId],
      _0x3c58ae = getPanelInputKind(_0x17c685, _0x339f3a);
    if (_0x3c58ae === 'image') {
      if (_0x42cbf9 === 'image' && _0xc330e6 < 2) _0xc330e6 += 1;
      else {
        if (_0x42cbf9 === 'reference' && _0xc330e6 < 1) _0xc330e6 += 1;
        else _0x339f3a?.id && _0x5cadb8.push(_0x339f3a.id);
      }
      continue;
    }
    if (_0x3c58ae === 'video') {
      if (_0x42cbf9 === 'video' && _0x25cefc < 1) _0x25cefc += 1;
      else {
        if (_0x42cbf9 === 'reference' && _0x25cefc < 1) _0x25cefc += 1;
        else {
          if (_0x42cbf9 === 'edit' && _0x25cefc < 2) _0x25cefc += 1;
          else _0x339f3a?.id && _0x5cadb8.push(_0x339f3a.id);
        }
      }
      continue;
    }
    if (_0x3c58ae === 'audio') {
      if ((_0x42cbf9 === 'image' || _0x42cbf9 === 'reference') && _0x43fcb5 < 1) _0x43fcb5 += 1;
      else _0x339f3a?.id && _0x5cadb8.push(_0x339f3a.id);
    }
  }
  return _0x5cadb8;
}
function getKlingV3OmniModeEdgeIdsToRemove({
  nextMode: _0x5528bd,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const _0x9084cb = normalizeKlingV3OmniPanelMode(_0x5528bd),
    _0x20afc8 = [];
  let _0x48ee9c = 0,
    _0x19a136 = 0;
  for (const _0x31dc94 of Array.isArray(inEdges) ? inEdges : []) {
    const _0x426390 = nodes?.[_0x31dc94?.sourceId],
      _0x750b27 = getPanelInputKind(_0x426390, _0x31dc94);
    if (_0x750b27 === 'image') {
      if (_0x9084cb === 'image' && _0x48ee9c < 2) _0x48ee9c += 1;
      else {
        if (_0x9084cb === 'reference' && _0x48ee9c < 1) _0x48ee9c += 1;
        else _0x31dc94?.id && _0x20afc8.push(_0x31dc94.id);
      }
      continue;
    }
    if (_0x750b27 === 'video') {
      if ((_0x9084cb === 'reference' || _0x9084cb === 'edit') && _0x19a136 < 1) _0x19a136 += 1;
      else _0x31dc94?.id && _0x20afc8.push(_0x31dc94.id);
      continue;
    }
    _0x750b27 === 'audio' && _0x31dc94?.id && _0x20afc8.push(_0x31dc94.id);
  }
  return _0x20afc8;
}
function buildSchemaParamsPatch(_0x50011d, _0xa3f60, _0x59e2bb = {}) {
  const _0x32ac40 = {
      ...getPlainGenerationParams(_0x50011d?.generationParams),
      ...getPlainGenerationParams(_0x59e2bb?.generationParams),
      ...(_0xa3f60 && typeof _0xa3f60 === 'object' ? _0xa3f60 : {}),
    },
    _0x19b6d5 = { generationParams: _0x32ac40 },
    _0x3458e0 = String(_0x50011d?.model || '').trim();
  return (
    _0x3458e0 &&
      (_0x19b6d5.generationParamsByModel = {
        ...getPlainGenerationParams(_0x50011d?.generationParamsByModel),
        [_0x3458e0]: _0x32ac40,
      }),
    _0x19b6d5
  );
}
function getUiSchemaFieldIds(_0x447260) {
  const _0x420ed8 = getModelManifest(_0x447260);
  return new Set(
    (Array.isArray(_0x420ed8?.uiSchema?.fields) ? _0x420ed8.uiSchema.fields : [])
      .map((_0xf19a09) => String(_0xf19a09?.id || '').trim())
      .filter(Boolean),
  );
}
const DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER = Object.freeze(['resolution', 'mode']);
function resolveVideoModelApiFooterPlacementOrder(_0x33c4af = {}) {
  const _0xda87d8 = new Set(DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER),
    _0x3eb0d8 = [],
    _0x591597 = Array.isArray(_0x33c4af?.uiSchema?.footerPlacementOrder)
      ? _0x33c4af.uiSchema.footerPlacementOrder
      : [];
  return (
    _0x591597.forEach((_0x44f215) => {
      const _0x35170a = String(_0x44f215 || '')
        .trim()
        .toLowerCase();
      _0xda87d8.has(_0x35170a) && !_0x3eb0d8.includes(_0x35170a) && _0x3eb0d8.push(_0x35170a);
    }),
    DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER.forEach((_0x3c0c80) => {
      if (!_0x3eb0d8.includes(_0x3c0c80)) _0x3eb0d8.push(_0x3c0c80);
    }),
    _0x3eb0d8
  );
}
function wrapUiSchemaPlacementControls(_0x186c32) {
  return _0x186c32 ? '<div class="ui-schema-placement">' + _0x186c32 + '</div>' : '';
}
function sanitizeVideoModelApiParams(_0x3cdd1b, _0x25ecff = {}, _0x954eff = {}) {
  const _0x50a23e = getPlainGenerationParams(_0x25ecff);
  try {
    return sanitizeModelUiSchemaParams(_0x3cdd1b, _0x50a23e, _0x954eff);
  } catch {
    return _0x50a23e;
  }
}
export function buildVideoModelApiModelSelectionPatch(
  _0x24655b = {},
  _0x54d9fd = '',
  _0x10d7e8 = null,
  _0x1c2e80 = {},
) {
  const _0x30888c = String(_0x54d9fd || '').trim();
  if (!_0x30888c) return {};
  const _0x459ecc = String(_0x24655b?.model || '').trim(),
    _0x412964 = getPlainGenerationParams(_0x24655b?.generationParamsByModel);
  _0x459ecc &&
    (_0x412964[_0x459ecc] = sanitizeVideoModelApiParams(_0x459ecc, _0x24655b?.generationParams, {
      includeDefaults: false,
    }));
  const _0x754da2 = getUiSchemaFieldIds(_0x30888c),
    _0x63e43c = buildModelUiSchemaDefaultParams(_0x30888c),
    _0x359970 = getPlainGenerationParams(_0x412964[_0x30888c]),
    _0x2f0c8e = Object.prototype.hasOwnProperty.call(_0x1c2e80, 'generationParams'),
    _0x38560b = _0x2f0c8e ? getPlainGenerationParams(_0x1c2e80.generationParams) : {},
    _0x592150 = {};
  Object.entries(_0x1c2e80 || {}).forEach(([_0x3f723e, _0x3d3d8b]) => {
    if (_0x754da2.has(_0x3f723e)) _0x592150[_0x3f723e] = _0x3d3d8b;
  });
  const _0x268c5c = { ..._0x63e43c, ..._0x359970, ..._0x38560b, ..._0x592150 },
    _0x19e0b7 = Object.fromEntries(
      Object.entries(_0x268c5c).filter(([_0x16a921]) => _0x754da2.has(_0x16a921)),
    ),
    _0x2eeba1 = sanitizeVideoModelApiParams(_0x30888c, _0x19e0b7, { includeDefaults: true }),
    { generationParams: _0x2c7be0, ..._0x5a54c8 } = _0x1c2e80 || {},
    _0x25e299 = { ..._0x5a54c8 };
  return (
    _0x754da2.forEach((_0x4ea312) => {
      delete _0x25e299[_0x4ea312];
    }),
    {
      ..._0x25e299,
      model: _0x30888c,
      provider: _0x10d7e8,
      generationParams: _0x2eeba1,
      generationParamsByModel: _0x412964,
    }
  );
}
function buildRhWorkflowFieldPatch(_0xea5697, _0x48e964, _0x3ac433, _0x25ca21 = {}) {
  const _0x26de46 = String(_0x48e964 || '').trim();
  if (RH_WORKFLOW_DISPLAY_FIELD_IDS.has(_0x26de46)) return { [_0x26de46]: _0x3ac433 };
  if (_0x26de46 === 'rhSingleControlPreset' || _0x26de46 === 'rhControlMode') {
    const _0x4adbba = String(_0x3ac433 || '').trim(),
      _0x45dd3a =
        _0x4adbba === 'multi'
          ? { rhControlMode: 'multi', rhSingleControlPreset: null }
          : { rhControlMode: 'single', rhSingleControlPreset: normalizeRhV54SingleControlPreset(_0x4adbba) };
    return { ...buildSchemaParamsPatch(_0xea5697, _0x45dd3a, _0x25ca21), ..._0x45dd3a };
  }
  if (RH_WORKFLOW_BOOLEAN_FIELD_IDS.has(_0x26de46)) {
    const _0x34d0be = _0x3ac433 === true || String(_0x3ac433) === 'true',
      _0x5b1b75 = { [_0x26de46]: _0x34d0be };
    return { ...buildSchemaParamsPatch(_0xea5697, _0x5b1b75, _0x25ca21), ..._0x5b1b75 };
  }
  if (_0x26de46 === 'rhSpecialMode') {
    const _0xc11db4 = getPlainGenerationParams(_0xea5697?.generationParams),
      _0x11f2f9 = normalizeRhV54SpecialModeValue(
        _0xc11db4.rhSpecialMode !== undefined ? _0xc11db4.rhSpecialMode : _0xea5697?.rhSpecialMode,
      ),
      _0x976dfe = normalizeRhV54SpecialModeValue(_0x3ac433),
      _0x34376e = _0x11f2f9 === _0x976dfe ? null : _0x976dfe,
      _0x1c8875 = { rhSpecialMode: _0x34376e };
    return { ...buildSchemaParamsPatch(_0xea5697, _0x1c8875, _0x25ca21), ..._0x1c8875 };
  }
  if (_0x26de46 === 'rhMaskExpand') {
    const _0x7d9137 = normalizeRhV54MaskExpandValue(_0x3ac433),
      _0xe7f91a = { rhMaskExpand: _0x7d9137 };
    return {
      ...buildSchemaParamsPatch(_0xea5697, _0xe7f91a, _0x25ca21),
      rhMaskExpand: _0x7d9137,
      rhMaskExpandTouched: true,
    };
  }
  if (_0x26de46 === 'rhBreastJiggle') {
    const _0x22863c = normalizeRhV54BreastJiggleValue(_0x3ac433),
      _0xd445f4 = { rhBreastJiggle: _0x22863c };
    return { ...buildSchemaParamsPatch(_0xea5697, _0xd445f4, _0x25ca21), rhBreastJiggle: _0x22863c };
  }
  return {};
}
export function createVideoNodeParameterPanelModule(_0x25eda3) {
  const {
    store: _0x573227,
    api: _0x4c67f2,
    getDisplayModelName: _0x2fa8d9,
    PROVIDERS_META: _0x241d0f,
    getAIGenerationNodeSize: _0x527c72,
    getDisplayedMediaSizeFromNode: _0x249658,
    activateMenuKeyboard: _0x51e6cc,
    isVideoVipModel: _0x2d6f60,
  } = _0x25eda3;
  class _0x1077c8 {
    ['_getRhVideoAdvancedSchemaNodeData'](_0x52a035 = {}) {
      const _0x46b384 = String(_0x52a035?.model || '').trim(),
        _0x4083d2 = getRunningHubVideoParameterPanelPolicy(_0x46b384);
      let _0x237c9c = _0x52a035;
      if (_0x4083d2.sourceFrameCountFps) {
        const _0x556fbe = normalizeRhVideoFpsByPolicy(_0x4083d2, _0x52a035?.rhVideoFps);
        _0x237c9c = {
          ..._0x237c9c,
          rhVideoSourceFrameCount: this._getRhV5SourceVideoFrameCount?.(_0x556fbe) || 0,
        };
      }
      if (_0x4083d2.maskVideoDisablesSubtractSubject !== true) return _0x237c9c;
      const _0x181b80 = (_0x573227.getIncomingEdges(this.nodeId) || []).some((_0x5a8dbc) => {
        const _0x21cbe6 = String(_0x5a8dbc?.refSlot || '').trim();
        return _0x21cbe6 === 'videoMask' || _0x21cbe6 === 'maskVideo';
      });
      if (!_0x181b80) return _0x237c9c;
      return {
        ..._0x237c9c,
        rhV54HasMaskVideo: true,
        rhSubtractSubject: false,
        generationParams: {
          ...getPlainGenerationParams(_0x237c9c?.generationParams),
          rhSubtractSubject: false,
        },
      };
    }
    ['_buildVideoModelMenuHtml'](_0x2f885c = '') {
      const _0x390e8a = String(_0x2f885c || this._data?.model || '').trim() || getDefaultVideoModelId();
      return renderNodeModelMenu({
        kind: 'video',
        activeModel: _0x390e8a,
        items: [
          ...buildDreaminaOfficialVideoMenuItems(),
          ...buildVolcengineOfficialVideoMenuItems(_0x390e8a, this._data?.provider),
        ],
        groups: [
          {
            id: 'apimart-video',
            headerClass: 'apimart-video-group-header',
            submenuClass: 'apimart-video-submenu',
            toggleAttr: 'data-apimart-video-toggle',
            label: 'APIMart',
            subtitle: '视频生成模型',
            iconHtml: buildApimartVideoLogoHTML(20),
            itemsHtml: buildApimartVideoMenuItemsHtml(_0x390e8a, this._data?.provider),
          },
          {
            id: 'agnes-video',
            headerClass: 'agnes-video-group-header',
            submenuClass: 'agnes-video-submenu',
            toggleAttr: 'data-agnes-video-toggle',
            label: 'Agnes AI',
            subtitle: 'Video model API',
            iconHtml: buildAgnesVideoLogoHTML(20),
            itemsHtml: buildAgnesVideoMenuItemsHtml(_0x390e8a),
          },
          {
            id: 'runninghub',
            label: 'RunningHUB工作流',
            subtitle: 'AI 工作流',
            icon: 'images/RH.png',
            iconAlt: 'runninghub',
            itemsHtml: buildRunningHubVideoWorkflowMenuItems(_0x390e8a),
          },
          {
            id: 'runninghub-model',
            label: 'RunningHUB模型',
            subtitle: '标准模型 API',
            icon: 'images/RH.png',
            iconAlt: 'runninghub',
            itemsHtml: buildRunningHubVideoModelApiMenuItems(_0x390e8a),
          },
        ],
      });
    }
    ['_renderFooterImpl'](_0x589a6d) {
      let _0x1c64a4 = false;
      const _0x5c8d7e = _0x589a6d.querySelector('.rh-vram-adv-panel');
      _0x5c8d7e && (_0x1c64a4 = _0x5c8d7e.classList.contains('show'));
      const _0x4a0f81 = this._isDreaminaVideoNode(this._data)
        ? this._syncDreaminaTaskState(this._data, { syncStore: true })
        : null;
      _0x4a0f81?.nodeData && (this._data = _0x4a0f81.nodeData);
      const _0x1a53e3 = Boolean(_0x4a0f81),
        _0x4f7c4b = String(this._data.model || '').trim() || getDefaultVideoModelId();
      if (isRunningHubVideoWorkflowManifest(_0x4f7c4b)) {
        const _0x1cc1e5 = buildVideoWorkflowGenerationParamsPatch(this._data, _0x4f7c4b),
          _0x3f6a0c = buildVideoWorkflowDisplayParamsPatch(_0x4f7c4b, _0x1cc1e5.generationParams, {
            v54FpsOptions: getRhV54FpsOptions(),
          }),
          _0x3ea18a = Object.entries(_0x3f6a0c).some(
            ([_0x267911, _0x239bd7]) => this._data?.[_0x267911] !== _0x239bd7,
          );
        if (
          _0x1cc1e5.generationParams &&
          (!arePlainObjectsEqual(
            _0x1cc1e5.generationParams,
            getPlainGenerationParams(this._data.generationParams),
          ) ||
            !arePlainObjectsEqual(
              _0x1cc1e5.generationParamsByModel,
              getPlainGenerationParams(this._data.generationParamsByModel),
            ) ||
            _0x3ea18a)
        ) {
          const _0x79b999 = { ..._0x1cc1e5, ..._0x3f6a0c };
          (_0x573227.updateNodeData(this.nodeId, _0x79b999), (this._data = { ...this._data, ..._0x79b999 }));
        }
      }
      const _0x3aca2e = _0x4f7c4b.includes('seedance'),
        _0x49843e =
          _0x4a0f81?.nodeData?.resolution || this._data.resolution || (_0x3aca2e ? '720p' : '1080p'),
        _0xedead1 = this._getModelParamVisibility(_0x4f7c4b, this._data.provider),
        _0x48bdff = this._isRunninghubWorkflowModel(_0x4f7c4b, this._data.provider),
        _0x5a090e = this._resolveModelExecution(_0x4f7c4b, this._data.provider),
        _0x36145d =
          !_0x1a53e3 &&
          !_0x48bdff &&
          _0x5a090e?.modelManifest?.adapterType === 'modelApi' &&
          _0x5a090e?.modelManifest?.kind === 'video',
        _0x10689f = _0x36145d
          ? String(_0x5a090e?.canonicalModelId || _0x5a090e?.modelManifest?.modelId || _0x4f7c4b).trim()
          : _0x4f7c4b,
        _0x3eb347 = _0x48bdff,
        _0x3893f7 = _0x3eb347
          ? renderModelUiSchemaControls(_0x4f7c4b, this._data, {
              placement: 'instance',
              variant: 'instanceToggle',
            })
          : '',
        _0xd2c69a = hasRunningHubVideoWorkflowUiPlacement(_0x4f7c4b, 'videoAdvanced'),
        _0x1fa8ab = hasRunningHubVideoWorkflowUiPlacement(_0x4f7c4b, 'videoParams'),
        _0x5c299c = hasRunningHubVideoWorkflowUiPlacement(_0x4f7c4b, 'resolution'),
        _0x4ca0e0 = _0x1fa8ab ? this._getRhVideoAdvancedSchemaNodeData(this._data) : this._data,
        _0x2898b7 = _0x1fa8ab
          ? renderModelUiSchemaControls(_0x4f7c4b, _0x4ca0e0, {
              placement: 'videoParams',
              unwrap: true,
              rhVideoFpsOptions: getRunningHubVideoWorkflowFpsOptions(_0x4f7c4b, {
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            })
          : '',
        _0x36d6c6 = _0x5c299c
          ? renderModelUiSchemaControls(_0x4f7c4b, _0x4ca0e0, { placement: 'resolution' })
          : '',
        _0x148850 = _0x36145d
          ? renderModelUiSchemaControls(_0x10689f, this._data, { placement: 'mode' })
          : '',
        _0x42ea77 = _0x36145d
          ? renderModelUiSchemaControls(_0x10689f, this._data, { placement: 'resolution' })
          : '',
        _0x3cc0e8 = _0x36145d
          ? renderModelUiSchemaControls(_0x10689f, this._data, { placement: 'advanced' })
          : '',
        _0x4d3cbf = _0x36145d && hasModelUiSchema(_0x10689f, { placement: 'advanced' }),
        _0x37cf4e = _0xd2c69a || _0x4d3cbf,
        _0x242158 = this._getModelIconHTML(_0x4f7c4b, this._data.provider),
        _0x5f47cb = this._getRatioIconHTML(this._data.aspectRatio || '自适应'),
        _0x4da5ae = formatVideoRatioResolutionLabel(this._data.aspectRatio, _0x49843e),
        _0xeafbb8 =
          '\n                <div class="img-rp-quality-area">\n                  <div class="img-rp-section-label">' +
          videoPanelText('resolution') +
          '</div>\n                  <div class="img-rp-quality-segmented">\n                    <button type="button" class="img-rp-quality-item ' +
          (_0x49843e === '480p' ? 'active' : '') +
          ' ' +
          (_0x3aca2e ? 'is-disabled' : '') +
          '" data-value="480p" ' +
          (_0x3aca2e ? 'disabled title="' + videoPanelText('resolutionUnavailable') + '"' : '') +
          '>480p</button>\n                    <button type="button" class="img-rp-quality-item ' +
          (_0x49843e === '720p' ? 'active' : '') +
          '" data-value="720p">720p</button>\n                    <button type="button" class="img-rp-quality-item ' +
          (_0x49843e === '1080p' ? 'active' : '') +
          ' ' +
          (_0x3aca2e ? 'is-disabled' : '') +
          '" data-value="1080p" ' +
          (_0x3aca2e ? 'disabled title="' + videoPanelText('resolutionUnavailable') + '"' : '') +
          '>1080p</button>\n                  </div>\n                </div>\n                <div class="img-rp-ratio-area">\n                  <div class="img-rp-section-label">' +
          videoPanelText('aspectRatio') +
          '</div>\n                  <div class="img-rp-ratio-split">\n                    <div class="img-rp-ratio-left">\n                      <button type="button" class="img-rp-large-adaptive active" data-label="自适应" data-w="1" data-h="1">\n                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n                        <span>' +
          videoPanelText('adaptive') +
          '</span>\n                      </button>\n                    </div>\n                    <div class="img-rp-ratio-right">\n                      <button type="button" class="img-rp-ratio-item" data-label="1:1" data-w="1" data-h="1"><span class="img-rp-icon img-rp-sq"></span><span>1:1</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="9:16" data-w="9" data-h="16"><span class="img-rp-icon img-rp-tall"></span><span>9:16</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="16:9" data-w="16" data-h="9"><span class="img-rp-icon img-rp-wide"></span><span>16:9</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="3:4" data-w="3" data-h="4"><span class="img-rp-icon img-rp-p34"></span><span>3:4</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="4:3" data-w="4" data-h="3"><span class="img-rp-icon img-rp-l43"></span><span>4:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="3:2" data-w="3" data-h="2" disabled><span class="img-rp-icon img-rp-l32"></span><span>3:2</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="2:3" data-w="2" data-h="3" disabled><span class="img-rp-icon img-rp-p23"></span><span>2:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="5:4" data-w="5" data-h="4" disabled><span class="img-rp-icon img-rp-l54"></span><span>5:4</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="4:5" data-w="4" data-h="5" disabled><span class="img-rp-icon img-rp-p45"></span><span>4:5</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="21:9" data-w="21" data-h="9"><span class="img-rp-icon img-rp-ultra"></span><span>21:9</span></button>\n                    </div>\n                  </div>\n                </div>\n      ',
        _0x381f6e = _0x36145d
          ? resolveVideoModelApiFooterPlacementOrder(_0x5a090e?.modelManifest)
          : DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER,
        _0x12dfe6 = _0x381f6e.indexOf('mode'),
        _0x2abc70 = _0x381f6e.indexOf('resolution'),
        _0x58b711 = _0x36145d && _0x148850 && _0x12dfe6 >= 0 && _0x2abc70 >= 0 && _0x12dfe6 < _0x2abc70,
        _0x3f37f8 = wrapUiSchemaPlacementControls(_0x148850),
        _0x373cbd = wrapUiSchemaPlacementControls(_0x42ea77);
      _0x589a6d.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              ' +
        renderNodeModelTrigger({ iconHtml: _0x242158, label: _0x2fa8d9(_0x4f7c4b) }) +
        '\n              <div class="floating-menu img-model-menu node-model-menu" data-node-menu-kind="video" data-lazy-model-menu="video"></div>\n            </div>\n            ' +
        (_0x1a53e3 ? '' : _0x58b711 ? _0x3f37f8 : '') +
        '\n            ' +
        (_0x1a53e3 ? '' : _0x1fa8ab && _0x2898b7 ? _0x2898b7 : '') +
        '\n            ' +
        (_0x1a53e3
          ? ''
          : _0x36d6c6
            ? wrapUiSchemaPlacementControls(_0x36d6c6)
            : !_0x1fa8ab && _0x42ea77
              ? _0x373cbd
              : !_0x1fa8ab
                ? '<div class="img-ratio-wrap"' +
                  (_0xedead1.ratio ? '' : ' hidden') +
                  '>\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
                  _0x5f47cb +
                  '</span>\n                <span class="img-ratio-label">' +
                  _0x4da5ae +
                  '</span>\n              </button>\n              <div class="img-ratio-popup">\n                ' +
                  _0xeafbb8 +
                  '\n              </div>\n            </div>'
                : '') +
        '\n            ' +
        (_0x1a53e3
          ? ''
          : _0x36145d
            ? _0x58b711
              ? ''
              : _0x148850
                ? _0x3f37f8
                : ''
            : '<div class="vid-mode-wrap"' +
              (_0xedead1.mode ? '' : ' hidden') +
              '>\n              <button type="button" class="img-pill-btn vid-mode-btn">\n                <span class="vid-mode-label">' +
              getVideoModeLabel(this._data.mode) +
              '</span>\n              </button>\n              <div class="floating-menu vid-mode-menu">\n                <div class="floating-menu-item video-mode-item ' +
              (!this._data.mode || this._data.mode === VIDEO_MODE_ALL_REFERENCE_VALUE ? 'active' : '') +
              '" data-value="' +
              VIDEO_MODE_ALL_REFERENCE_VALUE +
              '">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>\n                  <span class="floating-menu-label">' +
              videoPanelText('mode.allReference') +
              '</span>\n                </div>\n                <div class="floating-menu-item video-mode-item ' +
              (this._data.mode === VIDEO_MODE_FIRST_LAST_VALUE ? 'active' : '') +
              '" data-value="' +
              VIDEO_MODE_FIRST_LAST_VALUE +
              '">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 17h10"/></svg>\n                  <span class="floating-menu-label">' +
              videoPanelText('mode.firstLastFrame') +
              '</span>\n                </div>\n              </div>\n            </div>') +
        '\n            ' +
        (_0x1a53e3 || _0x36145d
          ? ''
          : '<div class="vid-duration-wrap"' +
            (_0xedead1.duration ? '' : ' hidden') +
            '>\n              <button type="button" class="img-pill-btn vid-duration-btn">\n                <span class="vid-duration-label">' +
            (this._data.duration || '5') +
            'S</span>\n              </button>\n              <div class="floating-menu vid-duration-pop">\n                <div class="vid-duration-title">' +
            videoPanelText('duration') +
            '</div>\n                <input type="range" class="vid-duration-slider" min="4" max="15" step="1" value="' +
            (this._data.duration || 5) +
            '">\n                <div class="vid-duration-bounds">\n                  <span class="vid-duration-min">4S</span>\n                  <span class="vid-duration-max">15S</span>\n                </div>\n              </div>\n            </div>') +
        '\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="img-pill-btn rh-adv2-btn"' +
        (_0x37cf4e ? '' : ' hidden') +
        '>\n              <span class="rh-adv2-label">' +
        videoPanelText('advancedSettings') +
        '</span>\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot"' +
        (_0x3eb347 && _0x3893f7 ? '' : ' hidden') +
        '>\n              ' +
        _0x3893f7 +
        '\n            </div>\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        videoPanelText('debugApiParams') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n                  <button type="button" class="prompt-submit img-gen-btn" ' +
        (_0x48bdff
          ? 'data-tooltip="' + getVideoCancelTooltip() + '"'
          : 'title="' + getVideoGenerateTitle() + '"') +
        '>\n                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n                  </button>\n          </div>';
      const _0x57e712 = this._getRhVideoAdvancedSchemaNodeData(this._data),
        _0x5ca9d4 = _0xd2c69a
          ? renderModelUiSchemaControls(_0x4f7c4b, _0x57e712, { placement: 'videoAdvanced' })
          : _0x3cc0e8,
        _0xebde06 = _0x5ca9d4
          ? '\n          <div class="rh-vram-adv-panel">\n            ' +
            _0x5ca9d4 +
            '\n          </div>\n        '
          : '';
      _0x4a0f81 && this._decorateDreaminaFooter(_0x589a6d, _0x4a0f81);
      if (_0xebde06) _0x589a6d.insertAdjacentHTML('beforeend', _0xebde06);
      ((this.rhVramAdvPanelEl = _0x589a6d.querySelector('.rh-vram-adv-panel')),
        this._uiSchemaCleanup?.(),
        (this._uiSchemaCleanup = _0x4a0f81
          ? bindUiSchemaFieldControls(_0x589a6d, {
              getNodeData: () =>
                this._getDreaminaEffectiveNodeData(
                  _0x573227.getState?.().nodes?.[this.nodeId] || this._data || {},
                ),
              commitFieldValue: (_0x2225de, _0x4a6ee8, _0x505f46) =>
                this._commitDreaminaSchemaField(_0x2225de, _0x4a6ee8, _0x505f46),
            })
          : bindModelUiSchemaControls(_0x589a6d, {
              nodeId: this.nodeId,
              nodeData: this._data,
              store: _0x573227,
              decorateNodeData: (_0x3856cb) => this._getRhVideoAdvancedSchemaNodeData(_0x3856cb),
              buildPatch: (_0x181828, _0x444d58, _0x11aebc, _0x4e33a8) => {
                const _0xfef952 = String(_0x444d58 || '').trim();
                let _0x2d1067 = [];
                if (isHappyHorsePanelModel(_0x181828) && _0xfef952 === 'happyhorse_mode') {
                  const _0x13b47e = _0x573227.getState?.() || {};
                  _0x2d1067 = getHappyHorseModeEdgeIdsToRemove({
                    nextMode: _0x11aebc,
                    inEdges: _0x573227.getIncomingEdges?.(this.nodeId) || [],
                    nodes: _0x13b47e.nodes || {},
                  });
                } else {
                  if (isWan27PanelModel(_0x181828) && _0xfef952 === 'wan27_mode') {
                    const _0x521a38 = _0x573227.getState?.() || {};
                    _0x2d1067 = getWan27ModeEdgeIdsToRemove({
                      nextMode: _0x11aebc,
                      inEdges: _0x573227.getIncomingEdges?.(this.nodeId) || [],
                      nodes: _0x521a38.nodes || {},
                    });
                  } else {
                    if (isKlingV3OmniPanelModel(_0x181828) && _0xfef952 === 'kling_v3_omni_mode') {
                      const _0x55380f = _0x573227.getState?.() || {};
                      _0x2d1067 = getKlingV3OmniModeEdgeIdsToRemove({
                        nextMode: _0x11aebc,
                        inEdges: _0x573227.getIncomingEdges?.(this.nodeId) || [],
                        nodes: _0x55380f.nodes || {},
                      });
                    }
                  }
                }
                if (_0x2d1067.length > 0) {
                  const _0x5b7094 = () => {
                    _0x2d1067.forEach((_0x1ee408) => _0x573227.removeEdge?.(_0x1ee408));
                  };
                  if (typeof _0x573227.batch === 'function') _0x573227.batch(_0x5b7094);
                  else _0x5b7094();
                }
                return {
                  ...buildRhWorkflowFieldPatch(_0x181828, _0x444d58, _0x11aebc, _0x4e33a8),
                  ...this._buildModelApiAspectRatioDisplayPatch(_0x181828, _0x444d58, _0x11aebc, _0x4e33a8),
                  ...this._buildRunningHubWorkflowAspectRatioDisplayPatch(
                    _0x181828,
                    _0x444d58,
                    _0x11aebc,
                    _0x4e33a8,
                  ),
                };
              },
              afterCommit: (_0xf2bf72, _0x4afff8, _0x3441e7) => {
                const _0x384743 = String(_0xf2bf72 || '').trim(),
                  _0x19b332 = getPanelModelManifest(_0x3441e7),
                  _0x46377f = manifestHelpVariantsReferenceField(_0x19b332, _0x384743),
                  _0x48a902 = manifestPromptVariantsReferenceField(_0x19b332, _0x384743),
                  _0x86a47f = manifestFixedSlotVisibilityReferencesField(_0x19b332, _0x384743);
                (_0x46377f || _0x48a902 || _0x86a47f) &&
                  ((this._data = { ...(this._data || {}), ...(_0x3441e7 || {}) }),
                  _0x46377f && this._syncGenerationNodeHelpTip?.(),
                  _0x48a902 && this._syncDreaminaPromptPlaceholder?.(this._data),
                  _0x86a47f && this._renderRefBar?.(),
                  this._updateSubmitButtonState?.());
              },
            })),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = bindNodeFooterController(_0x589a6d)),
        _0x1c64a4 && this.rhVramAdvPanelEl && this.rhVramAdvPanelEl.classList.add('show'),
        (this.btnEl = _0x589a6d.querySelector('.img-gen-btn')),
        this._bindFooterEvents(_0x589a6d));
    }
    ['_runVipRetryOnce'](_0x2bf115) {
      let _0x53fc32 = false;
      return () => {
        if (_0x53fc32) return;
        ((_0x53fc32 = true), (this._vipSelectionRetryInProgress = true));
        try {
          _0x2bf115();
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      };
    }
    ['_guardVipSelection'](_0x4c498e, _0x81335e = null, _0x4f52f3 = null) {
      const _0x2ddfae = String(_0x4c498e || '');
      let _0x23c3c4 = '',
        _0x438dc4 = _0x4f52f3;
      typeof _0x81335e === 'function'
        ? (_0x438dc4 = _0x81335e)
        : (_0x23c3c4 = String(_0x81335e || '').trim());
      if (!_0x2d6f60(_0x2ddfae, _0x23c3c4)) return true;
      const _0x8627cd = window.isModelAllowedBySubscription,
        _0x13b191 = typeof _0x8627cd === 'function' ? _0x8627cd(_0x2ddfae, _0x23c3c4) : true;
      if (_0x13b191) return true;
      if (this._vipSelectionRetryInProgress) return false;
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: _0x2ddfae, provider: _0x23c3c4, onSuccess: _0x438dc4 })
          : window.showToast?.(videoPanelText('vipRequired'), 'warn'),
        false
      );
    }
    ['_bindFooterEvents'](_0x33f0e7) {
      const _0x19bfb9 = _0x33f0e7.querySelector('.img-model-btn-trigger'),
        _0x59f72e = _0x33f0e7.querySelector('.img-model-menu'),
        _0xe22527 = _0x33f0e7.querySelector('.dreamina-task-model-btn'),
        _0x1dcf75 = _0x33f0e7.querySelector('.dreamina-task-model-menu'),
        _0x15bb04 = _0x33f0e7.querySelector('.img-ratio-btn'),
        _0x3bb06a = _0x33f0e7.querySelector('.img-ratio-popup'),
        _0x473620 = _0x33f0e7.querySelector('.img-ratio-label'),
        _0x25482d = _0x33f0e7.querySelector('.img-ratio-icon-slot'),
        _0x42aaa8 = _0x33f0e7.querySelector('.vid-mode-btn'),
        _0x20cab8 = _0x33f0e7.querySelector('.vid-mode-menu'),
        _0x2ab11e = _0x33f0e7.querySelector('.vid-mode-label'),
        _0x44d95d = _0x33f0e7.querySelector('.vid-duration-btn'),
        _0x28daa2 = _0x33f0e7.querySelector('.vid-duration-pop'),
        _0x2c1b4f = _0x33f0e7.querySelector('.vid-duration-slider'),
        _0x2fd2c9 = _0x33f0e7.querySelector('.vid-duration-label'),
        _0x501edf = _0x33f0e7.querySelector('.rh-adv2-btn'),
        _0x57c208 = _0x33f0e7.querySelector('.rh-vram-adv-panel'),
        _0x568d7f = () => {
          _0x3bb06a?.classList.remove('show');
          if (_0x3bb06a) _0x3bb06a.style.display = '';
        },
        _0x3cc061 = () => {
          _0x28daa2?.classList.remove('show');
          if (_0x28daa2) _0x28daa2.style.display = '';
        },
        _0xfe877 = this._isDreaminaVideoNode(this._data),
        _0x3b1f4f = _0xfe877
          ? this._getDreaminaEffectiveNodeData(this._data)
          : this._getRhVideoAdvancedSchemaNodeData(this._data);
      syncModelUiSchemaControls(_0x33f0e7, _0x3b1f4f);
      const _0x44620f = (_0x537bcc) => {
          const _0x47ab97 = {
            ...(_0x573227.getState().nodes?.[this.nodeId] || this._data || {}),
            ...(_0x537bcc && typeof _0x537bcc === 'object' ? _0x537bcc : {}),
          };
          return (
            _0x573227.updateNodeData(this.nodeId, _0x537bcc),
            (this._data = _0x47ab97),
            (this._lastFooterSig = ''),
            this._renderFooter(_0x33f0e7),
            _0x47ab97
          );
        },
        _0x5421e9 = () => _0x573227.getState().nodes?.[this.nodeId] || this._data || {},
        _0x16edc6 = ({
          model: _0x35f12c,
          provider: _0x16b631,
          useRememberedRouteModel: useRememberedRouteModel = false,
        } = {}) => {
          const _0x566b6f = String(_0x35f12c || '').trim();
          if (!_0x566b6f) return null;
          const _0x3d1f13 = _0x5421e9(),
            _0x4db6b3 = this._getDreaminaEffectiveNodeData(_0x3d1f13),
            _0x34818c = this._syncDreaminaTaskState(_0x3d1f13, { syncStore: false }),
            _0x1aec7d = _0x34818c?.nodeData || _0x4db6b3 || _0x3d1f13,
            _0xe06e0d = resolveDreaminaStyleVideoProvider(
              _0x566b6f,
              _0x16b631 || _0x1aec7d?.provider || 'dreamina',
            ),
            _0x42cf2c =
              _0x34818c?.resolvedTaskType || this._getResolvedDreaminaTaskType(_0x1aec7d, _0x34818c?.summary),
            _0x14150a =
              _0x34818c?.routeMode ||
              normalizeDreaminaVideoRouteMode(_0x1aec7d?.dreaminaRouteMode, _0x1aec7d?.mode),
            _0x569ece = ensureDreaminaStyleVideoModelForTask(_0x42cf2c, _0x566b6f, _0xe06e0d) || _0x566b6f,
            _0xffc084 = useRememberedRouteModel
              ? resolveDreaminaRememberedRouteModel(_0x1aec7d, {
                  provider: _0xe06e0d,
                  routeMode: _0x14150a,
                  taskType: _0x42cf2c,
                  fallbackModel: _0x569ece,
                }) || _0x569ece
              : _0x569ece,
            _0x566172 = normalizeDreaminaStyleVideoResolution(
              _0x42cf2c,
              _0xffc084,
              _0x1aec7d?.resolution || _0x1aec7d?.videoSize,
              _0xe06e0d,
            ),
            _0x2c488f = normalizeDreaminaStyleVideoDuration(
              _0x42cf2c,
              _0xffc084,
              _0x1aec7d?.duration,
              _0xe06e0d,
            ),
            _0xcd079a = { provider: _0xe06e0d, model: _0xffc084 };
          return _0x44620f({
            ..._0xcd079a,
            ...this._buildDreaminaModelSelectionParamPatch(_0x1aec7d, {
              model: _0xffc084,
              provider: _0xe06e0d,
              taskType: _0x42cf2c,
              fallbackValues: {
                dreaminaRouteMode: _0x14150a,
                aspectRatio: _0x1aec7d?.aspectRatio,
                ...(_0x566172 ? { resolution: _0x566172 } : {}),
                duration: _0x2c488f,
              },
            }),
          });
        };
      let _0x572f7d = null;
      const _0x2ae7fa = () => {
        if (!_0x59f72e) return null;
        if (_0x59f72e.dataset.lazyMounted === '1') return _0x59f72e;
        const _0x3777b9 = _0x5421e9(),
          _0xec71d2 = String(_0x3777b9?.model || this._data?.model || '').trim() || getDefaultVideoModelId(),
          _0x3342d3 = document.createElement('template');
        _0x3342d3.innerHTML = this._buildVideoModelMenuHtml(_0xec71d2).trim();
        const _0x3e03ee = _0x3342d3.content.firstElementChild;
        return (
          (_0x59f72e.innerHTML = _0x3e03ee?.innerHTML || ''),
          (_0x59f72e.dataset.lazyMounted = '1'),
          (_0x59f72e.dataset.nodeMenuKind = _0x3e03ee?.dataset?.nodeMenuKind || 'video'),
          _0x572f7d?.(),
          (_0x572f7d = bindNodeSubmenus(_0x59f72e)),
          _0x59f72e
        );
      };
      _0x19bfb9 &&
        _0x59f72e &&
        _0x19bfb9.addEventListener('click', (_0x3c4eee) => {
          _0x3c4eee.stopPropagation();
          const _0x16dc91 = _0x2ae7fa();
          if (!_0x16dc91) return;
          const _0x4257ae = !_0x16dc91.classList.contains('show');
          (closeNodeFooterMenus(_0x33f0e7, _0x59f72e),
            _0x1dcf75?.classList.remove('show'),
            _0x16dc91.classList.toggle('show', _0x4257ae));
          if (_0x4257ae) _0x51e6cc(_0x16dc91);
        });
      _0x15bb04 &&
        _0x3bb06a &&
        (_0x15bb04.onclick = (_0x4beb18) => {
          _0x4beb18.stopPropagation();
          if (_0x15bb04.disabled || !String(_0x3bb06a.innerHTML || '').trim()) return;
          ((_0x3bb06a.style.display = ''),
            _0x3bb06a.classList.toggle('show'),
            _0x59f72e.classList.remove('show'),
            _0x1dcf75?.classList.remove('show'));
          if (_0x20cab8) _0x20cab8.classList.remove('show');
          (_0x3cc061(), _0x57c208?.classList.remove('show'));
        });
      _0xe22527 &&
        _0x1dcf75 &&
        (_0xe22527.onclick = (_0x2545a6) => {
          _0x2545a6.stopPropagation();
          if (_0xe22527.disabled) return;
          (_0x1dcf75.classList.toggle('show'), _0x59f72e.classList.remove('show'), _0x568d7f());
          if (_0x20cab8) _0x20cab8.classList.remove('show');
          (_0x3cc061(),
            _0x57c208?.classList.remove('show'),
            _0x1dcf75.classList.contains('show') && _0x51e6cc(_0x1dcf75));
        });
      _0x42aaa8 &&
        _0x20cab8 &&
        (_0x42aaa8.onclick = (_0xc0e62b) => {
          (_0xc0e62b.stopPropagation(),
            _0x20cab8.classList.toggle('show'),
            _0x59f72e.classList.remove('show'),
            _0x1dcf75?.classList.remove('show'),
            _0x568d7f(),
            _0x3cc061(),
            _0x57c208?.classList.remove('show'),
            _0x20cab8.classList.contains('show') && _0x51e6cc(_0x20cab8));
        });
      _0x44d95d &&
        _0x28daa2 &&
        (_0x44d95d.onclick = (_0x116bb7) => {
          (_0x116bb7.stopPropagation(),
            (_0x28daa2.style.display = ''),
            _0x28daa2.classList.toggle('show'),
            _0x59f72e.classList.remove('show'),
            _0x1dcf75?.classList.remove('show'),
            _0x568d7f());
          if (_0x20cab8) _0x20cab8.classList.remove('show');
          _0x57c208?.classList.remove('show');
        });
      const _0x30a4ff = () => {
        (_0x59f72e?.classList.remove('show'),
          _0x59f72e?.querySelectorAll('.node-model-submenu, .node-menu-submenu').forEach((_0x43259d) => {
            _0x43259d.style.display = 'none';
          }));
      };
      (_0x59f72e?.addEventListener('click', (_0xd3dd0c) => {
        _0xd3dd0c.stopPropagation();
        const _0x3ce481 = _0xd3dd0c.target?.closest?.('.floating-menu-item');
        if (!_0x3ce481 || !_0x59f72e.contains(_0x3ce481)) return;
        if (_0x3ce481.hasAttribute('data-node-menu-submenu')) return;
        if (_0x3ce481.closest('.apimart-video-submenu')) {
          const _0x500d17 = _0x3ce481.dataset.value || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
          if (isApimartDreaminaVideoModel(_0x500d17, 'apimart')) {
            _0x16edc6({ model: _0x500d17, provider: 'apimart', useRememberedRouteModel: true });
            return;
          }
        }
        if (_0x3ce481.closest('.runninghub-submenu')) {
          if (_0x3ce481.dataset.disabled === 'true') {
            (window.showToast?.(videoPanelText('videoGenerationUnavailable'), 'warn'), _0x30a4ff());
            return;
          }
          const _0x55a138 = _0x3ce481.dataset.value;
          if (!_0x55a138) return;
          const _0x45c733 = this._runVipRetryOnce(() => _0x3ce481.click());
          if (!this._guardVipSelection(_0x55a138, _0x45c733)) {
            _0x30a4ff();
            return;
          }
          const _0x18b729 = _0x3ce481.dataset.provider || null,
            _0x398c36 = _0x573227.getState().nodes?.[this.nodeId] || {},
            _0x527732 = { model: _0x55a138, provider: _0x18b729 };
          if (this._isRunninghubWorkflowModel(_0x55a138, _0x18b729))
            Object.assign(
              _0x527732,
              buildVideoWorkflowModelSelectionPatch(_0x398c36, _0x55a138, {
                preserveMaskTouchedState: true,
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            );
          else {
            const _0x1864bf = resolveModelExecution(_0x55a138, { providerHint: _0x18b729 });
            _0x1864bf?.modelManifest?.kind === 'video' &&
              _0x1864bf?.modelManifest?.adapterType === 'modelApi' &&
              Object.assign(
                _0x527732,
                buildVideoModelApiModelSelectionPatch(
                  _0x398c36,
                  _0x1864bf.canonicalModelId || _0x55a138,
                  _0x18b729 || _0x1864bf?.modelManifest?.provider || null,
                  _0x527732,
                ),
              );
          }
          _0x44620f(_0x527732);
          return;
        }
        if (_0x3ce481.dataset.disabled === 'true') {
          (window.showToast?.(videoPanelText('videoGenerationUnavailable'), 'warn'), _0x30a4ff());
          return;
        }
        const _0x6303f3 = _0x3ce481.dataset.value;
        if (!_0x6303f3) return;
        const _0x16d68b = _0x3ce481.dataset.provider || 'dreamina';
        if (isDreaminaStyleVideoModel(_0x6303f3, _0x16d68b)) {
          const _0x54f90f = resolveDreaminaStyleVideoProvider(_0x6303f3, _0x16d68b),
            _0x2ef986 = this._runVipRetryOnce(() => _0x3ce481.click());
          if (!this._guardVipSelection(_0x6303f3, _0x54f90f, _0x2ef986)) {
            _0x30a4ff();
            return;
          }
          _0x16edc6({ model: _0x6303f3, provider: _0x54f90f, useRememberedRouteModel: true });
          return;
        }
        const _0x48bbe9 = this._runVipRetryOnce(() => _0x3ce481.click());
        if (!this._guardVipSelection(_0x6303f3, _0x48bbe9)) {
          _0x30a4ff();
          return;
        }
        const _0x1b620a = { model: _0x6303f3 };
        _0x1b620a.provider = _0x3ce481.dataset.provider || null;
        const _0x58bc25 = _0x573227.getState().nodes?.[this.nodeId] || {};
        if (this._isRunninghubWorkflowModel(_0x6303f3, _0x1b620a.provider))
          Object.assign(
            _0x1b620a,
            buildVideoWorkflowModelSelectionPatch(_0x58bc25, _0x6303f3, {
              v54FpsOptions: getRhV54FpsOptions(),
            }),
          );
        else {
          const _0x3be3da = resolveModelExecution(_0x6303f3, { providerHint: _0x1b620a.provider });
          _0x3be3da?.modelManifest?.kind === 'video' &&
            _0x3be3da?.modelManifest?.adapterType === 'modelApi' &&
            Object.assign(
              _0x1b620a,
              buildVideoModelApiModelSelectionPatch(
                _0x58bc25,
                _0x3be3da.canonicalModelId || _0x6303f3,
                _0x1b620a.provider || _0x3be3da?.modelManifest?.provider || null,
                _0x1b620a,
              ),
            );
        }
        (_0x6303f3.includes('seedance') &&
          (!this._data.resolution || this._data.resolution !== '720p') &&
          (_0x1b620a.resolution = '720p'),
          _0x44620f(_0x1b620a));
      }),
        _0x1dcf75?.querySelectorAll('.floating-menu-item').forEach(
          (_0x2dd94d) =>
            (_0x2dd94d.onclick = () => {
              if (_0x2dd94d.dataset.disabled === 'true') {
                (window.showToast?.(videoPanelText('smartMultiframeUnavailable'), 'warn'),
                  _0x1dcf75.classList.remove('show'));
                return;
              }
              const _0x51dd82 = String(_0x2dd94d.dataset.value || '').trim();
              if (!_0x51dd82) return;
              const _0xbf0b61 = resolveDreaminaStyleVideoProvider(
                  _0x51dd82,
                  _0x2dd94d.dataset.provider || this._data?.provider || 'dreamina',
                ),
                _0x4a6021 = this._runVipRetryOnce(() => _0x2dd94d.click());
              if (!this._guardVipSelection(_0x51dd82, _0xbf0b61, _0x4a6021)) {
                _0x1dcf75.classList.remove('show');
                return;
              }
              _0x16edc6({ model: _0x51dd82, provider: _0xbf0b61, useRememberedRouteModel: false });
            }),
        ));
      _0x501edf &&
        _0x57c208 &&
        ((_0x501edf.onclick = (_0x30b257) => {
          _0x30b257.stopPropagation();
          const _0x59ff49 = !_0x57c208.classList.contains('show');
          ((_0x57c208.style.display = ''),
            _0x57c208.classList.toggle('show', _0x59ff49),
            _0x59f72e.classList.remove('show'),
            _0x568d7f());
          if (_0x20cab8) _0x20cab8.classList.remove('show');
          _0x3cc061();
        }),
        (_0x57c208.onclick = (_0x4ae935) => _0x4ae935.stopPropagation()));
      _0x20cab8 &&
        _0x2ab11e &&
        _0x20cab8.querySelectorAll('.floating-menu-item').forEach(
          (_0x2895b2) =>
            (_0x2895b2.onclick = () => {
              if (_0xfe877) {
                const _0x48a1f4 = normalizeDreaminaVideoRouteMode(
                  _0x2895b2.dataset.routeMode || _0x2895b2.dataset.value,
                );
                if (!_0x48a1f4) return;
                (this._commitDreaminaRouteMode(_0x48a1f4, this._data), _0x20cab8.classList.remove('show'));
                return;
              }
              const _0x7ec9d5 = _0x2895b2.dataset.value;
              (_0x573227.updateNodeData(this.nodeId, { mode: _0x7ec9d5 }),
                (_0x2ab11e.textContent = getVideoModeLabel(_0x7ec9d5)),
                _0x20cab8.classList.remove('show'),
                _0x20cab8
                  .querySelectorAll('.floating-menu-item')
                  .forEach((_0x3270cd) => _0x3270cd.classList.toggle('active', _0x3270cd === _0x2895b2)));
            }),
        );
      if (_0xfe877 && _0x20cab8) {
        const _0x83856b = () => {
          const _0x4913c6 = [];
          _0x20cab8.querySelectorAll('.dreamina-transition-prompt').forEach((_0x43b33c) => {
            const _0xcfcfc4 = Number(_0x43b33c.dataset.index);
            Number.isFinite(_0xcfcfc4) && (_0x4913c6[_0xcfcfc4] = _0x43b33c.value);
          });
          const _0x25d65e = [];
          (_0x20cab8.querySelectorAll('.dreamina-transition-duration').forEach((_0x256d26) => {
            const _0x116d10 = Number(_0x256d26.dataset.index);
            Number.isFinite(_0x116d10) && (_0x25d65e[_0x116d10] = _0x256d26.value);
          }),
            _0x573227.updateNodeData(this.nodeId, {
              dreaminaTransitionPrompts: _0x4913c6,
              dreaminaTransitionDurations: _0x25d65e,
            }));
        };
        (_0x20cab8.querySelectorAll('.dreamina-transition-prompt').forEach((_0x391680) => {
          (_0x391680.addEventListener('input', _0x83856b),
            _0x391680.addEventListener('click', (_0x42a8f6) => _0x42a8f6.stopPropagation()));
        }),
          _0x20cab8.querySelectorAll('.dreamina-transition-duration').forEach((_0x2fce54) => {
            (_0x2fce54.addEventListener('input', _0x83856b),
              _0x2fce54.addEventListener('change', _0x83856b),
              _0x2fce54.addEventListener('click', (_0x14c586) => _0x14c586.stopPropagation()));
          }));
      }
      _0x2c1b4f &&
        _0x2fd2c9 &&
        (_0x2c1b4f.oninput = () => {
          if (_0xfe877) {
            const _0x76ce44 = this._syncDreaminaTaskState(this._data, { syncStore: false }),
              _0x4c1ec4 = _0x76ce44?.resolvedTaskType || this._getResolvedDreaminaTaskType(),
              _0x52f7e7 = resolveDreaminaStyleVideoProvider(this._data?.model, this._data?.provider),
              _0x4d23e2 = ensureDreaminaStyleVideoModelForTask(_0x4c1ec4, this._data?.model, _0x52f7e7),
              _0x1100c8 = normalizeDreaminaStyleVideoDuration(
                _0x4c1ec4,
                _0x4d23e2,
                _0x2c1b4f.value,
                _0x52f7e7,
              );
            ((_0x2fd2c9.textContent = _0x1100c8 + 'S'),
              this._commitDreaminaParamValues({ duration: _0x1100c8 }, this._data));
            return;
          }
          const _0xf0975 = _0x2c1b4f.value;
          ((_0x2fd2c9.textContent = _0xf0975 + 'S'),
            _0x573227.updateNodeData(this.nodeId, { duration: parseInt(_0xf0975, 10) }));
        });
      _0x473620 &&
        _0x3bb06a?.querySelectorAll('.img-rp-quality-item').forEach(
          (_0x39553d) =>
            (_0x39553d.onclick = () => {
              if (_0x39553d.hasAttribute('disabled')) return;
              if (_0x39553d.closest('[data-ui-schema-field]')) return;
              if (_0xfe877 && _0x39553d.dataset.dreaminaKind === 'resolution') {
                const _0x51c295 = String(_0x39553d.dataset.value || '').trim();
                if (!_0x51c295) return;
                this._commitDreaminaParamValues({ resolution: _0x51c295 }, this._data);
                const _0x2dbe05 = {
                    ...this._getDreaminaEffectiveNodeData(
                      _0x573227.getState().nodes?.[this.nodeId] || this._data || {},
                    ),
                  },
                  _0x4d9d57 = this._getDreaminaRatioDisplayState(_0x2dbe05);
                _0x473620.textContent =
                  _0x4d9d57?.ratioLabelText ||
                  formatVideoRatioResolutionLabel(_0x2dbe05.aspectRatio || '1:1', _0x51c295);
                _0x25482d &&
                  (_0x25482d.innerHTML = this._getRatioIconHTML(
                    _0x4d9d57?.ratioIconLabel || _0x2dbe05.aspectRatio || '1:1',
                  ));
                const _0x52d20e = _0x39553d.parentElement;
                (_0x52d20e
                  ?.querySelectorAll('.img-rp-quality-item')
                  .forEach((_0x1fa3bb) => _0x1fa3bb.classList.remove('active')),
                  _0x39553d.classList.add('active'));
                return;
              }
              (_0x573227.updateNodeData(this.nodeId, { resolution: _0x39553d.dataset.value }),
                (_0x473620.textContent = formatVideoRatioResolutionLabel(
                  this._data.aspectRatio,
                  _0x39553d.dataset.value,
                )));
              const _0x4aed56 = _0x39553d.parentElement;
              (_0x4aed56
                ?.querySelectorAll('.img-rp-quality-item')
                .forEach((_0x595b32) => _0x595b32.classList.remove('active')),
                _0x39553d.classList.add('active'));
            }),
        );
      const _0xdd065f = 0x118,
        _0x25996b = (_0x202b20) => {
          const _0x3bf730 = String(_0x202b20 || '').trim();
          if (!_0x3bf730 || _0x3bf730 === '自适应') return { w: 1, h: 1, label: '自适应' };
          const _0x433734 = _0x3bf730.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
          if (!_0x433734) return null;
          return {
            w: parseFloat(_0x433734[1]),
            h: parseFloat(_0x433734[2]),
            label: _0x433734[1] + ':' + _0x433734[2],
          };
        },
        _0x7a23ea = (_0x38ddfc = '', _0x20160e = false) => {
          const _0x5dca3c = String(_0x38ddfc || '').trim(),
            _0x25937c = !!_0x20160e || _0x5dca3c === '自适应';
          _0x33f0e7
            .querySelectorAll('.img-rp-ratio-item,.img-rp-large-adaptive')
            .forEach((_0x32940c) => _0x32940c.classList.remove('active'));
          if (_0x25937c) {
            _0x33f0e7.querySelector('.img-rp-large-adaptive')?.classList.add('active');
            return;
          }
          _0x33f0e7
            .querySelectorAll('.img-rp-ratio-item')
            .forEach((_0x35adc4) =>
              _0x35adc4.classList.toggle(
                'active',
                String(_0x35adc4.dataset.label || '').trim() === _0x5dca3c,
              ),
            );
        },
        _0x4c2ff9 = (_0x263b81, _0x419bbf, _0x887d26, _0x355b38 = {}) => {
          const _0x4df848 = _0x355b38?.persistAspectRatio !== false,
            _0x245554 = (_0x5f5483) => {
              const _0x1f36e5 = document.getElementById(this.nodeId);
              if (!_0x1f36e5) return;
              _0x1f36e5.classList.add('is-ratio-animating');
              if (this._ratioAnimTimer) clearTimeout(this._ratioAnimTimer);
              this._ratioAnimTimer = setTimeout(() => {
                const _0x48977b = document.getElementById(this.nodeId);
                if (_0x48977b) _0x48977b.classList.remove('is-ratio-animating');
                this._ratioAnimTimer = null;
              }, _0x5f5483 + 80);
            },
            _0x4f813b = this._data.width || 0x12c,
            _0x1e61c8 = this._data.height || 0x12c,
            _0x15472d = _0x527c72(_0x263b81, _0x419bbf),
            _0x31f062 = _0x15472d.width,
            _0x35a571 = _0x15472d.height,
            _0x10b5ff = _0x31f062 - _0x4f813b,
            _0x45d4c7 = _0x35a571 - _0x1e61c8;
          if (_0x10b5ff !== 0 || _0x45d4c7 !== 0) _0x245554(_0xdd065f);
          const _0x40c18b = {
            width: _0x31f062,
            height: _0x35a571,
            x: Math.round(this._data.x - _0x10b5ff / 2),
            y: Math.round(this._data.y - _0x45d4c7),
          };
          _0x4df848 &&
            (this._isDreaminaVideoNode(this._data)
              ? Object.assign(
                  _0x40c18b,
                  this._buildDreaminaParamPatch(this._data, { aspectRatio: _0x887d26 }),
                )
              : (_0x40c18b.aspectRatio = _0x887d26));
          _0x573227.updateNodeData(this.nodeId, _0x40c18b);
          const _0x53b6d6 = _0x573227.getState().nodes?.[this.nodeId] || this._data || {},
            _0x4c2d27 = this._getDreaminaRatioDisplayState(_0x53b6d6);
          _0x473620 &&
            (_0x473620.textContent =
              _0x4c2d27?.ratioLabelText ||
              formatVideoRatioResolutionLabel(_0x887d26, _0x53b6d6.resolution || '1080p'));
          _0x25482d && (_0x25482d.innerHTML = this._getRatioIconHTML(_0x4c2d27?.ratioIconLabel || _0x887d26));
          ((this.previewEl.style.transition = 'none'),
            (this.previewEl.style.transformOrigin = 'bottom center'),
            (this.previewEl.style.transform =
              'scaleX(' + _0x4f813b / _0x31f062 + ') scaleY(' + _0x1e61c8 / _0x35a571 + ')'),
            void this.previewEl.offsetWidth);
          if (this._ratioFlipAnim) this._ratioFlipAnim.cancel();
          const _0x5c7e2e = 'scaleX(' + _0x4f813b / _0x31f062 + ') scaleY(' + _0x1e61c8 / _0x35a571 + ')';
          this._ratioFlipAnim = this.previewEl.animate([{ transform: _0x5c7e2e }, { transform: 'none' }], {
            duration: _0xdd065f,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards',
          });
          const _0xfb2e2a = () => {
            ((this._ratioFlipAnim = null),
              (this.previewEl.style.transformOrigin = ''),
              (this.previewEl.style.transform = ''));
          };
          ((this._ratioFlipAnim.onfinish = _0xfb2e2a), (this._ratioFlipAnim.oncancel = _0xfb2e2a));
        },
        _0x5207f6 = (_0x38a2ba, _0x4c2a9a = {}) => {
          const _0x355568 = _0x25996b(_0x38a2ba);
          if (!_0x355568) return;
          (_0x4c2ff9(_0x355568.w, _0x355568.h, _0x355568.label, _0x4c2a9a),
            _0x7a23ea(_0x355568.label, false));
        };
      !_0xfe877 &&
        _0x33f0e7.querySelectorAll('.img-rp-ratio-item').forEach(
          (_0x22b035) =>
            (_0x22b035.onclick = () => {
              if (
                _0x22b035.hasAttribute('disabled') ||
                _0x22b035.classList.contains('disabled') ||
                _0x22b035.getAttribute('aria-disabled') === 'true'
              )
                return;
              _0x5207f6(_0x22b035.dataset.label);
            }),
        );
      const _0x49fed8 = () => {
        const _0x213c30 = _0x573227.getState(),
          _0x4a2692 = _0x213c30.nodes?.[this.nodeId],
          _0x3cdeb6 = String(_0x4a2692?.model || ''),
          _0x4b6188 = getRunningHubVideoParameterPanelPolicy(_0x3cdeb6).adaptiveRatio || {},
          _0x6022dd =
            _0x4b6188.preferSlot &&
            _0x4b6188.preferVideoKind === true &&
            _0x4b6188.fallbackSquareWhenNoVideo !== true,
          _0x386fe9 = _0x4b6188.preferSlot && _0x4b6188.preferVideoKind !== true,
          _0x1a47cb =
            _0x4b6188.preferSlot &&
            _0x4b6188.preferVideoKind === true &&
            _0x4b6188.fallbackSquareWhenNoVideo === true;
        let _0x19434b = _0x573227.getIncomingEdges(this.nodeId);
        _0x4b6188.scopeTargetEdges === true &&
          (_0x19434b = _0x19434b.filter((_0x11b349) => _0x11b349?.targetId === this.nodeId));
        const _0x14e097 = (_0xb46238, _0x3d311b) => {
          const _0xd66c22 = Number(_0xb46238),
            _0x4082d1 = Number(_0x3d311b);
          if (!(Number.isFinite(_0xd66c22) && _0xd66c22 > 0)) return false;
          if (!(Number.isFinite(_0x4082d1) && _0x4082d1 > 0)) return false;
          return (_0x4c2ff9(_0xd66c22, _0x4082d1, '自适应'), true);
        };
        if (_0x19434b.length > 0) {
          let _0x49c2a8 = _0x19434b[0];
          if (_0x6022dd) {
            const _0x141363 = _0x19434b.find(
              (_0x3f12ab) => String(_0x3f12ab?.refSlot || '') === 'sourceVideo',
            );
            if (_0x141363) _0x49c2a8 = _0x141363;
            else {
              const _0x3896b5 = _0x19434b.find((_0x93049b) => {
                const _0x3c8234 = _0x213c30.nodes?.[_0x93049b?.sourceId],
                  _0x26cf66 = String(_0x3c8234?.type || '');
                return _0x26cf66 === 'source-video' || _0x26cf66 === 'video' || _0x26cf66 === 'ai-video';
              });
              if (_0x3896b5) _0x49c2a8 = _0x3896b5;
            }
          } else {
            if (_0x386fe9 || _0x1a47cb) {
              const _0x1a26c3 = _0x19434b.find(
                (_0x2395e9) => String(_0x2395e9?.refSlot || '') === 'sourceVideo',
              );
              if (_0x1a26c3) _0x49c2a8 = _0x1a26c3;
              else {
                if (_0x1a47cb) {
                  const _0x3929f7 = _0x19434b.find((_0x3ae1c6) => {
                    const _0x4923f0 = _0x213c30.nodes?.[_0x3ae1c6?.sourceId],
                      _0x53cd6e = String(_0x4923f0?.type || '');
                    return _0x53cd6e === 'source-video' || _0x53cd6e === 'video' || _0x53cd6e === 'ai-video';
                  });
                  if (_0x3929f7) _0x49c2a8 = _0x3929f7;
                  else {
                    _0x4c2ff9(1, 1, '自适应');
                    return;
                  }
                }
              }
            }
          }
          const _0x3ce5d8 = _0x49c2a8.sourceId,
            _0x92b2ec = _0x213c30.nodes[_0x3ce5d8],
            _0x307f3a = String(_0x92b2ec?.type || ''),
            _0x228965 = _0x307f3a === 'ai-video' || _0x307f3a === 'source-video' || _0x307f3a === 'video';
          if (_0x228965) {
            const _0xb985df = _0x249658(_0x3ce5d8, 'video'),
              _0x4af753 = Number(_0xb985df?.w || 0),
              _0x3f103f = Number(_0xb985df?.h || 0);
            if (_0x14e097(_0x4af753, _0x3f103f)) return;
            const _0x5cdfbb = Number(_0x49c2a8?.sourceMediaW || 0),
              _0xf8059d = Number(_0x49c2a8?.sourceMediaH || 0);
            if (_0x14e097(_0x5cdfbb, _0xf8059d)) return;
            const _0x6ce1b3 = Number(_0x92b2ec?.mainVideoIndex),
              _0x1c7250 = Number.isFinite(_0x6ce1b3) ? Math.max(0, Math.trunc(_0x6ce1b3)) : 0,
              _0x2eebe4 = Array.isArray(_0x92b2ec?.videos) ? _0x92b2ec.videos : [];
            let _0x40d186 = _0x1c7250;
            const _0x1a96bb = String(_0x49c2a8?.sourceMediaKey || '').trim();
            if (_0x1a96bb && _0x2eebe4.length) {
              const _0x599a2a = _0x2eebe4.findIndex((_0x4c144d) => {
                const _0xf2294 =
                  String(_0x4c144d?.localPath || '').trim() || String(_0x4c144d?.videoUrl || '').trim();
                return _0xf2294 === _0x1a96bb;
              });
              if (_0x599a2a >= 0) _0x40d186 = _0x599a2a;
            }
            const _0x58883c = _0x2eebe4[_0x40d186],
              _0xd98848 = Number(_0x58883c?.videoWidth || 0),
              _0x1ff3ff = Number(_0x58883c?.videoHeight || 0);
            if (_0x14e097(_0xd98848, _0x1ff3ff)) return;
            const _0x5d0a0c = Number(_0x92b2ec?.selectedVideoWidth || 0),
              _0x497713 = Number(_0x92b2ec?.selectedVideoHeight || 0);
            if (_0x14e097(_0x5d0a0c, _0x497713)) return;
            const _0xfff39c = ++this._adaptiveSrcRetryToken;
            (setTimeout(() => {
              if (_0xfff39c !== this._adaptiveSrcRetryToken) return;
              const _0x1fe2d4 = _0x573227.getState().nodes?.[this.nodeId];
              if (!_0x1fe2d4) return;
              const _0x2ef20c = this._getDreaminaEffectiveNodeData(_0x1fe2d4);
              if (String(_0x2ef20c.aspectRatio || '自适应') !== '自适应') return;
              const _0x34b211 = _0x573227.getState().nodes?.[_0x3ce5d8];
              if (_0x34b211) {
                const _0x16d968 = Number(_0x49c2a8?.sourceMediaW || 0),
                  _0x33eff4 = Number(_0x49c2a8?.sourceMediaH || 0);
                if (_0x14e097(_0x16d968, _0x33eff4)) return;
                const _0x20db60 = Number(_0x34b211.mainVideoIndex),
                  _0x524d8a = Number.isFinite(_0x20db60) ? Math.max(0, Math.trunc(_0x20db60)) : 0,
                  _0x22348c = Array.isArray(_0x34b211.videos) ? _0x34b211.videos : [];
                let _0x5c4268 = _0x524d8a;
                const _0x230392 = String(_0x49c2a8?.sourceMediaKey || '').trim();
                if (_0x230392 && _0x22348c.length) {
                  const _0x1944b5 = _0x22348c.findIndex((_0x253b6c) => {
                    const _0x9c9750 =
                      String(_0x253b6c?.localPath || '').trim() || String(_0x253b6c?.videoUrl || '').trim();
                    return _0x9c9750 === _0x230392;
                  });
                  if (_0x1944b5 >= 0) _0x5c4268 = _0x1944b5;
                }
                const _0xe78bce = _0x22348c[_0x5c4268],
                  _0x374a1b = Number(_0xe78bce?.videoWidth || 0),
                  _0x46b73b = Number(_0xe78bce?.videoHeight || 0);
                if (_0x14e097(_0x374a1b, _0x46b73b)) return;
                const _0x3b8c37 = Number(_0x34b211.selectedVideoWidth || 0),
                  _0xe288f1 = Number(_0x34b211.selectedVideoHeight || 0);
                if (_0x14e097(_0x3b8c37, _0xe288f1)) return;
              }
              const _0x1b0c44 = _0x249658(_0x3ce5d8, 'video'),
                _0x200b77 = Number(_0x1b0c44?.w || 0),
                _0x328d5e = Number(_0x1b0c44?.h || 0);
              if (_0x200b77 > 0 && _0x328d5e > 0) _0x4c2ff9(_0x200b77, _0x328d5e, '自适应');
            }, 160),
              _0x4c2ff9(1, 1, '自适应'));
            return;
          }
          const _0xd535de = _0x249658(_0x3ce5d8, 'image'),
            _0x3b2374 = Number(_0xd535de?.w || 0),
            _0x42ef60 = Number(_0xd535de?.h || 0);
          if (_0x14e097(_0x3b2374, _0x42ef60)) return;
          if (_0x92b2ec) {
            const _0x18a90b = Number(_0x92b2ec.width || 0),
              _0xad34de = Number(_0x92b2ec.height || 0);
            if (_0x14e097(_0x18a90b, _0xad34de)) return;
          }
          _0x4c2ff9(1, 1, '自适应');
          return;
        }
        const _0x1bee38 = Boolean(
          (_0x4a2692?.videos && _0x4a2692.videos.length) ||
          _0x4a2692?.localPath ||
          _0x4a2692?.thumbUrl ||
          _0x4a2692?.videoUrl ||
          _0x4a2692?.src,
        );
        if (_0x1bee38) {
          const _0x20b4e5 = this.videoEl?.videoWidth || 0,
            _0x50daf5 = this.videoEl?.videoHeight || 0;
          if (_0x14e097(_0x20b4e5, _0x50daf5)) return;
          return;
        }
        _0x4c2ff9(1, 1, '自适应');
      };
      ((this._runAdaptiveRatio = () => {
        const _0x56aa83 = _0x573227.getState().nodes?.[this.nodeId] || this._data || {};
        if (this._isRunninghubWorkflowModel(_0x56aa83?.model, _0x56aa83?.provider)) return;
        const _0x3850f6 = _0x33f0e7.querySelector('.img-rp-large-adaptive');
        if (this._isDreaminaVideoNode(_0x56aa83)) {
          (this._commitDreaminaSchemaAspectRatio('自适应', _0x56aa83),
            _0x7a23ea('自适应', true),
            _0x3850f6?.classList.add('active'));
          return;
        }
        (_0x49fed8(), _0x7a23ea('自适应', true), _0x3850f6?.classList.add('active'));
      }),
        (this._applyStoredAspectRatio = () => {
          const _0xbdef06 = _0x573227.getState().nodes?.[this.nodeId] || this._data || {},
            _0x4d0a44 = this._getDreaminaRatioDisplayState(_0xbdef06),
            _0x53cf2c = String(_0x4d0a44?.currentRatio || '').trim() || '自适应';
          if (_0x53cf2c === '自适应') {
            this._runAdaptiveRatio?.();
            return;
          }
          _0x5207f6(_0x53cf2c, { persistAspectRatio: true });
        }),
        (this._applyDreaminaSchemaAspectRatio = (_0x159185) => {
          const _0x3804a8 = _0x573227.getState().nodes?.[this.nodeId] || this._data || {};
          this._commitDreaminaSchemaAspectRatio(_0x159185, _0x3804a8);
        }));
      const _0x48f851 = _0x33f0e7.querySelector('.img-rp-large-adaptive');
      _0x48f851 && !_0xfe877 && (_0x48f851.onclick = () => this._runAdaptiveRatio());
      this.btnEl.onclick = () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      };
      const _0x2cda85 = _0x33f0e7.querySelector('.debug-wrench-btn');
      _0x2cda85?.addEventListener('click', async (_0x1ade51) => {
        (_0x1ade51.stopPropagation(), flushPromptHtmlCommit(this));
        const _0x344609 = await this._buildPayload();
        if (!_0x344609) {
          window.showToast?.(videoPanelText('missingPromptOrReference'), 'warn');
          return;
        }
        try {
          const _0x3db386 = await _0x4c67f2.buildGenerateVideoRequest(_0x344609),
            _0x3e616c = formatFinalApiDebugRequest(_0x3db386),
            _0x4b84eb = _0x573227.getState(),
            _0x38ca14 = this._data.x + (this._data.width || 0x17c) + 50,
            _0xea92ae = this._data.y;
          let _0x420cfb = Object.values(_0x4b84eb.nodes).find((_0x23b5f4) => _0x23b5f4.type === 'debug');
          (!_0x420cfb
            ? _0x573227.addNode({
                id: 'debug-' + Date.now(),
                type: 'debug',
                x: _0x38ca14,
                y: _0xea92ae,
                width: 0x17c,
                height: 0x12c,
                name: videoPanelText('debugNodeName'),
                outputText: _0x3e616c,
              })
            : _0x573227.updateNodeData(_0x420cfb.id, { outputText: _0x3e616c, x: _0x38ca14, y: _0xea92ae }),
            window.showToast?.(videoPanelText('debugParamsShown'), 'warn'));
        } catch (_0x6a16e2) {
          window.showToast?.(videoPanelText('buildRequestFailed', { error: _0x6a16e2.message }), 'error');
        }
      });
      !this._docClickBound &&
        (document.addEventListener('click', () => {
          if (this._suppressDocClickOnce) {
            this._suppressDocClickOnce = false;
            return;
          }
          const _0xbd0b5 = this.footerEl;
          if (!_0xbd0b5) return;
          (closeNodeFooterMenus(_0xbd0b5),
            _0xbd0b5.querySelector('.img-model-menu')?.classList.remove('show'),
            _0xbd0b5.querySelector('.dreamina-task-model-menu')?.classList.remove('show'));
          const _0x42385b = _0xbd0b5.querySelector('.img-ratio-popup');
          _0x42385b?.classList.remove('show');
          if (_0x42385b) _0x42385b.style.display = '';
          _0xbd0b5.querySelector('.vid-mode-menu')?.classList.remove('show');
          const _0x23b9fa = _0xbd0b5.querySelector('.vid-duration-pop');
          _0x23b9fa?.classList.remove('show');
          if (_0x23b9fa) _0x23b9fa.style.display = '';
          _0xbd0b5.querySelector('.rh-vram-adv-panel')?.classList.remove('show');
        }),
        (this._docClickBound = true));
      if (_0x3bb06a) _0x3bb06a.onclick = (_0x6785f1) => _0x6785f1.stopPropagation();
      if (_0x28daa2) _0x28daa2.onclick = (_0x1fb0e0) => _0x1fb0e0.stopPropagation();
      if (_0x20cab8) _0x20cab8.onclick = (_0x18962c) => _0x18962c.stopPropagation();
      if (_0x1dcf75) _0x1dcf75.onclick = (_0x733de) => _0x733de.stopPropagation();
    }
    ['_isDreaminaVideoNode'](_0x16379d = this._data) {
      return isDreaminaStyleVideoModel(_0x16379d?.model, _0x16379d?.provider);
    }
    ['_getDreaminaEffectiveNodeData'](_0x4d256a = this._data) {
      return getDreaminaEffectiveNodeData(_0x4d256a);
    }
    ['_buildDreaminaParamPatch'](_0x17b2e0 = this._data, _0x3deba4 = {}) {
      return buildDreaminaParamPatch(_0x17b2e0, _0x3deba4);
    }
    ['_buildDreaminaModelSelectionParamPatch'](_0x1246c8 = this._data, _0x4d43a9 = {}) {
      return buildDreaminaModelSelectionParamPatch(_0x1246c8, _0x4d43a9);
    }
    ['_commitDreaminaParamValues'](_0x242b41 = {}, _0x142059 = this._data, _0x572e94 = {}) {
      const _0x5b2945 =
          this._getDreaminaEffectiveNodeData(_0x142059) ||
          this._getDreaminaEffectiveNodeData(_0x573227.getState().nodes?.[this.nodeId] || this._data || {}),
        _0x6713d8 = { ..._0x5b2945, ..._0x572e94 },
        _0x1529a1 = this._buildDreaminaParamPatch(_0x6713d8, _0x242b41),
        _0x58b816 = { ...(_0x572e94 && typeof _0x572e94 === 'object' ? _0x572e94 : {}), ..._0x1529a1 };
      return (
        _0x573227.updateNodeData(this.nodeId, _0x58b816),
        (this._data = this._getDreaminaEffectiveNodeData({ ..._0x5b2945, ..._0x58b816 })),
        this._data
      );
    }
    ['_commitDreaminaRouteMode'](_0x2f87ef, _0x332687 = this._data) {
      const _0x3c050c = _0x573227.getState(),
        _0x438fa6 = buildDreaminaRouteModeUpdate({
          nextRouteMode: _0x2f87ef,
          baseNodeData: _0x332687,
          incoming: _0x573227.getIncomingEdges(this.nodeId) || [],
          nodes: _0x3c050c.nodes || {},
        });
      if (_0x438fa6.disabled)
        return (
          window.showToast?.(videoPanelText('smartMultiframeUnavailable'), 'warn'),
          (this._data = _0x438fa6.nodeData),
          this._data
        );
      const _0x335a9e = Array.isArray(_0x438fa6.edgeIdsToRemove) ? _0x438fa6.edgeIdsToRemove : [],
        _0x16006e = _0x438fa6.patch || {};
      return (
        (_0x335a9e.length > 0 || Object.keys(_0x16006e).length > 0) &&
          _0x573227.batch(() => {
            (_0x335a9e.forEach((_0x42eabe) => _0x573227.removeEdge(_0x42eabe)),
              Object.keys(_0x16006e).length > 0 && _0x573227.updateNodeData(this.nodeId, _0x16006e));
          }),
        (this._data =
          _0x438fa6.nodeData || this._getDreaminaEffectiveNodeData({ ..._0x332687, ..._0x16006e })),
        this._data
      );
    }
    ['_commitDreaminaSchemaField'](_0x128be9, _0x5f3868, _0x131ee0 = this._data) {
      const _0x4ea7dd = String(_0x128be9 || '').trim(),
        _0x32dd07 = this._getDreaminaEffectiveNodeData(_0x131ee0);
      if (_0x4ea7dd === 'dreaminaRouteMode') return this._commitDreaminaRouteMode(_0x5f3868, _0x32dd07);
      const _0x2b4d1e = this._getResolvedDreaminaTaskType(_0x32dd07),
        _0x124e8f = resolveDreaminaStyleVideoProvider(_0x32dd07?.model, _0x32dd07?.provider),
        _0x737956 = ensureDreaminaStyleVideoModelForTask(_0x2b4d1e, _0x32dd07?.model, _0x124e8f);
      if (_0x4ea7dd === 'resolution') {
        const _0x53e28d = normalizeDreaminaStyleVideoResolution(_0x2b4d1e, _0x737956, _0x5f3868, _0x124e8f);
        return this._commitDreaminaParamValues({ resolution: _0x53e28d }, _0x32dd07);
      }
      if (_0x4ea7dd === 'duration') {
        const _0x49f566 = normalizeDreaminaStyleVideoDuration(_0x2b4d1e, _0x737956, _0x5f3868, _0x124e8f);
        return this._commitDreaminaParamValues({ duration: _0x49f566 }, _0x32dd07);
      }
      if (_0x4ea7dd === 'aspectRatio') return this._commitDreaminaSchemaAspectRatio(_0x5f3868, _0x32dd07);
      return _0x32dd07;
    }
    ['_normalizeDreaminaNodeData'](_0x53f677, _0x57ec94 = {}) {
      const _0x861495 = _0x57ec94?.syncStore !== false,
        _0x3090e7 = this._getDreaminaEffectiveNodeData(_0x53f677),
        _0x4a2b6b = buildDreaminaStyleVideoNodeNormalizationPatch(_0x3090e7);
      if (!_0x4a2b6b) return _0x3090e7;
      const _0x3ce338 = buildDreaminaStorePatchFromNormalization(_0x3090e7, _0x4a2b6b),
        _0x20483b = this._getDreaminaEffectiveNodeData({ ..._0x3090e7, ..._0x3ce338 }),
        _0x419cde = _0x573227.getState().nodes?.[this.nodeId];
      return (
        _0x861495 &&
          _0x419cde &&
          Object.keys(_0x3ce338).length > 0 &&
          _0x573227.updateNodeData(this.nodeId, _0x3ce338),
        _0x20483b
      );
    }
    ['_getDreaminaReferenceSummary'](_0xd38679 = this._data) {
      const _0x44161e = _0x573227.getIncomingEdges(this.nodeId) || [],
        _0xee0cce = _0x573227.getState().nodes || {},
        _0x3db3e1 = [];
      for (const _0x4888a0 of _0x44161e) {
        const _0x4b4d1e = _0xee0cce?.[_0x4888a0.sourceId];
        if (!_0x4b4d1e) continue;
        const _0x141d17 = String(_0x4b4d1e.type || '');
        let _0xbcdb9b = '';
        if (_0x141d17.includes('video')) _0xbcdb9b = 'video';
        else {
          if (_0x141d17.includes('audio')) _0xbcdb9b = 'audio';
          else {
            if (_0x141d17.includes('image')) _0xbcdb9b = 'image';
            else {
              if (_0x141d17.includes('text')) _0xbcdb9b = 'text';
            }
          }
        }
        if (!_0xbcdb9b) continue;
        if (_0xbcdb9b === 'image') {
          const _0x5843d2 =
            !!_0x4b4d1e.thumbId ||
            !!_0x4b4d1e.thumbUrl ||
            !!_0x4b4d1e.imageUrl ||
            !!_0x4b4d1e.src ||
            !!_0x4b4d1e.localPath;
          if (!_0x5843d2) continue;
        } else {
          if (_0xbcdb9b === 'video') {
            const _0x504fae =
              (Array.isArray(_0x4b4d1e.videos) && _0x4b4d1e.videos.length > 0) ||
              !!_0x4b4d1e.thumbId ||
              !!_0x4b4d1e.thumbUrl ||
              !!_0x4b4d1e.videoUrl ||
              !!_0x4b4d1e.src ||
              !!_0x4b4d1e.localPath;
            if (!_0x504fae) continue;
          } else {
            if (_0xbcdb9b === 'audio') {
              const _0x1ff9fe = !!_0x4b4d1e.audioUrl || !!_0x4b4d1e.src || !!_0x4b4d1e.localPath;
              if (!_0x1ff9fe) continue;
            } else {
              if (_0xbcdb9b === 'text') {
                const _0x350844 = !!String(
                  _0x4b4d1e.outputText || _0x4b4d1e.text || _0x4b4d1e.content || '',
                ).trim();
                if (!_0x350844) continue;
              }
            }
          }
        }
        _0x3db3e1.push({
          edgeId: String(_0x4888a0.id || ''),
          sourceId: String(_0x4888a0.sourceId || ''),
          kind: _0xbcdb9b,
          refSlot: String(_0x4888a0.refSlot || ''),
        });
      }
      const _0x106524 = _0x3db3e1.filter((_0x2e9f4f) => _0x2e9f4f.kind === 'image'),
        _0x19e866 = _0x3db3e1.filter((_0x1efde2) => _0x1efde2.kind === 'video'),
        _0x508f3a = _0x3db3e1.filter((_0x250b7f) => _0x250b7f.kind === 'audio'),
        _0x4b6b4f = _0x3db3e1.filter((_0x363f3f) => _0x363f3f.kind === 'text');
      return {
        items: _0x3db3e1,
        images: _0x106524,
        videos: _0x19e866,
        audios: _0x508f3a,
        texts: _0x4b6b4f,
        imageCount: _0x106524.length,
        videoCount: _0x19e866.length,
        audioCount: _0x508f3a.length,
        textCount: _0x4b6b4f.length,
        signature: _0x3db3e1
          .map(
            (_0x6a40d8, _0x5a6d74) =>
              _0x5a6d74 +
              ':' +
              _0x6a40d8.edgeId +
              ':' +
              _0x6a40d8.sourceId +
              ':' +
              _0x6a40d8.kind +
              ':' +
              _0x6a40d8.refSlot,
          )
          .join('|'),
      };
    }
    ['_getResolvedDreaminaTaskType'](_0x140a87 = this._data, _0xfc1ed8 = null) {
      if (!this._isDreaminaVideoNode(_0x140a87)) return '';
      const _0x4c02c2 = this._getDreaminaEffectiveNodeData(_0x140a87),
        _0x59cbf9 = _0xfc1ed8 || this._getDreaminaReferenceSummary(_0x4c02c2);
      return resolveDreaminaVideoTaskType({
        routeMode: normalizeDreaminaVideoRouteMode(_0x4c02c2?.dreaminaRouteMode, _0x4c02c2?.mode),
        imageCount: _0x59cbf9.imageCount,
        videoCount: _0x59cbf9.videoCount,
        audioCount: _0x59cbf9.audioCount,
      });
    }
    ['_commitDreaminaSchemaAspectRatio'](_0xbdd394, _0x413766 = this._data) {
      const _0x546d4e = this._getDreaminaEffectiveNodeData(_0x413766),
        _0xad296 = normalizeDreaminaVideoAspectRatio(_0xbdd394, { preserveAdaptive: true }),
        _0x2565fb = buildImageSchemaAspectRatioDisplayPatch({
          store: _0x573227,
          nodeId: this.nodeId,
          nodeData: _0x546d4e,
          fallbackNodeData: this._data,
          ratioValue: _0xad296,
          minSide: _0x527c72().width,
          inputKinds: ['image', 'video'],
          resultMediaElement: this.videoEl,
          resultFields: ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'],
        }),
        _0x124eb3 = this._buildDreaminaParamPatch(_0x546d4e, { aspectRatio: _0xad296 }),
        _0x53ddab = { ..._0x2565fb, ..._0x124eb3 };
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: _0x546d4e,
          patch: _0x2565fb,
        }),
        _0x573227.updateNodeData(this.nodeId, _0x53ddab),
        (this._data = this._getDreaminaEffectiveNodeData({ ..._0x546d4e, ..._0x53ddab })),
        this._data
      );
    }
    ['_buildModelApiAspectRatioDisplayPatch'](_0x5328a1, _0x5dcba8, _0x2662a7, _0x30b37b = {}) {
      const _0x1e6c70 = String(_0x5dcba8 || '').trim();
      if (!_0x1e6c70) return {};
      const _0x2c2332 = this._resolveModelExecution(_0x5328a1?.model, _0x5328a1?.provider);
      if (
        _0x2c2332?.modelManifest?.kind !== 'video' ||
        _0x2c2332?.modelManifest?.adapterType !== 'modelApi' ||
        _0x2c2332?.executionManifest?.adapterType !== 'modelApi'
      )
        return {};
      const _0x181db0 = Array.isArray(_0x2c2332?.modelManifest?.uiSchema?.fields)
          ? _0x2c2332.modelManifest.uiSchema.fields
          : [],
        _0x491a56 = _0x181db0.find((_0x6f18d6) => String(_0x6f18d6?.id || '').trim() === _0x1e6c70);
      if (_0x1e6c70 !== 'aspectRatio' && _0x491a56?.displayRole !== 'aspectRatio') return {};
      const _0x45247a = getPlainGenerationParams(_0x30b37b?.generationParams),
        _0x381c42 = Object.prototype.hasOwnProperty.call(_0x45247a, _0x1e6c70)
          ? _0x45247a[_0x1e6c70]
          : Object.prototype.hasOwnProperty.call(_0x45247a, 'aspectRatio')
            ? _0x45247a.aspectRatio
            : _0x2662a7,
        _0x4aa710 = String(_0x381c42 || '').trim();
      if (!_0x4aa710) return {};
      const _0x51da4c = buildImageSchemaAspectRatioDisplayPatch({
        store: _0x573227,
        nodeId: this.nodeId,
        nodeData: _0x5328a1,
        fallbackNodeData: this._data,
        ratioValue: _0x4aa710,
        minSide: _0x527c72().width,
        inputKinds: ['image', 'video'],
        resultMediaElement: this.videoEl,
        resultFields: ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'],
      });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: _0x5328a1,
          patch: _0x51da4c,
        }),
        { aspectRatio: _0x4aa710, ..._0x51da4c }
      );
    }
    ['_buildRunningHubWorkflowAspectRatioDisplayPatch'](_0x161e1f, _0x53175e, _0x2a4726, _0x16cc87 = {}) {
      const _0x4e9b59 = String(_0x53175e || '').trim();
      if (!_0x4e9b59) return {};
      const _0x5ee961 = this._resolveModelExecution(_0x161e1f?.model, _0x161e1f?.provider);
      if (
        _0x5ee961?.modelManifest?.kind !== 'video' ||
        _0x5ee961?.modelManifest?.adapterType !== 'workflow' ||
        _0x5ee961?.executionManifest?.adapterType !== 'workflow'
      )
        return {};
      const _0x4ab2eb = Array.isArray(_0x5ee961?.modelManifest?.uiSchema?.fields)
          ? _0x5ee961.modelManifest.uiSchema.fields
          : [],
        _0x37fe88 = _0x4ab2eb.find((_0x4f8be3) => String(_0x4f8be3?.id || '').trim() === _0x4e9b59);
      if (_0x4e9b59 !== 'aspectRatio' && _0x37fe88?.displayRole !== 'aspectRatio') return {};
      const _0x424476 = getPlainGenerationParams(_0x16cc87?.generationParams),
        _0x525b8d = Object.prototype.hasOwnProperty.call(_0x424476, _0x4e9b59)
          ? _0x424476[_0x4e9b59]
          : Object.prototype.hasOwnProperty.call(_0x424476, 'aspectRatio')
            ? _0x424476.aspectRatio
            : _0x2a4726,
        _0x18b662 = String(_0x525b8d || '').trim();
      if (!_0x18b662) return {};
      const _0x13b592 = buildImageSchemaAspectRatioDisplayPatch({
        store: _0x573227,
        nodeId: this.nodeId,
        nodeData: _0x161e1f,
        fallbackNodeData: this._data,
        ratioValue: _0x18b662,
        minSide: _0x527c72().width,
        inputKinds: ['image', 'video'],
        resultMediaElement: this.videoEl,
        resultFields: ['videos', 'localPath', 'thumbUrl', 'videoUrl', 'src'],
      });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: _0x161e1f,
          patch: _0x13b592,
        }),
        { aspectRatio: _0x18b662, ..._0x13b592 }
      );
    }
    ['_getDreaminaRatioDisplayState'](_0x3cff61 = this._data, _0xa1d20e = null) {
      if (!this._isDreaminaVideoNode(_0x3cff61)) return null;
      const _0x510393 = _0xa1d20e || this._syncDreaminaTaskState(_0x3cff61, { syncStore: false }),
        _0x1eb759 = _0x510393?.nodeData || _0x3cff61,
        _0x537e7e = _0x510393?.summary || this._getDreaminaReferenceSummary(_0x1eb759),
        _0xa619b6 = _0x510393?.resolvedTaskType || this._getResolvedDreaminaTaskType(_0x1eb759, _0x537e7e),
        _0x5daccb =
          ensureDreaminaStyleVideoModelForTask(_0xa619b6, _0x1eb759?.model, _0x1eb759?.provider) ||
          normalizeDreaminaStyleVideoModel(_0x1eb759?.model, _0x1eb759?.provider),
        _0x2b1a8d = normalizeDreaminaStyleVideoResolution(
          _0xa619b6,
          _0x5daccb,
          _0x1eb759?.resolution || _0x1eb759?.videoSize,
          _0x1eb759?.provider,
        ),
        _0x47d2cc = String(_0x1eb759?.aspectRatio || '').trim(),
        _0x575aa3 =
          _0x47d2cc === '自适应' || _0x47d2cc === '自适应' || _0x47d2cc === 'auto'
            ? '自适应'
            : _0x47d2cc === '5:4'
              ? '4:3'
              : _0x47d2cc === '4:5'
                ? '3:4'
                : _0x47d2cc
                  ? normalizeDreaminaVideoAspectRatio(_0x47d2cc)
                  : '自适应',
        _0x491cac = getDreaminaStyleVideoResolutionOptions(_0xa619b6, _0x5daccb, _0x1eb759?.provider),
        _0x1b4f7c = Number(_0x537e7e?.imageCount || 0) > 0;
      return {
        nodeData: _0x1eb759,
        summary: _0x537e7e,
        resolvedTaskType: _0xa619b6,
        currentModel: _0x5daccb,
        currentResolution: _0x2b1a8d,
        currentRatio: _0x575aa3,
        resolutionOptions: _0x491cac,
        hasImageRefs: _0x1b4f7c,
        ratioLabelText: formatVideoRatioResolutionLabel(_0x575aa3, _0x2b1a8d || '720p'),
        ratioIconLabel: _0x575aa3,
      };
    }
    ['_syncDreaminaTaskState'](_0x5cb527 = this._data, _0x24b7e9 = {}) {
      if (!this._isDreaminaVideoNode(_0x5cb527))
        return {
          nodeData: _0x5cb527,
          summary: this._getDreaminaReferenceSummary(_0x5cb527),
          resolvedTaskType: '',
          routeMode: '',
        };
      const _0x594ab3 = _0x24b7e9?.syncStore !== false;
      let _0x2c9bbe = this._normalizeDreaminaNodeData(_0x5cb527, { syncStore: _0x594ab3 });
      const _0x4c96cf = this._getDreaminaReferenceSummary(_0x2c9bbe),
        _0xfd5ca = normalizeDreaminaVideoRouteMode(_0x2c9bbe?.dreaminaRouteMode, _0x2c9bbe?.mode),
        _0x5daa99 = resolveDreaminaVideoTaskType({
          routeMode: _0xfd5ca,
          imageCount: _0x4c96cf.imageCount,
          videoCount: _0x4c96cf.videoCount,
          audioCount: _0x4c96cf.audioCount,
        }),
        _0x253529 = {};
      if (_0x5daa99 !== 'multiframe2video') {
        const _0x148f2e = resolveDreaminaStyleVideoProvider(_0x2c9bbe?.model, _0x2c9bbe?.provider),
          _0x4c3626 = ensureDreaminaStyleVideoModelForTask(_0x5daa99, _0x2c9bbe?.model, _0x148f2e);
        _0x4c3626 && _0x4c3626 !== String(_0x2c9bbe?.model || '').trim() && (_0x253529.model = _0x4c3626);
        const _0x2a256d = normalizeDreaminaStyleVideoResolution(
          _0x5daa99,
          _0x4c3626 || _0x2c9bbe?.model,
          _0x2c9bbe?.resolution || _0x2c9bbe?.videoSize,
          _0x148f2e,
        );
        _0x2a256d &&
          _0x2a256d !== String(_0x2c9bbe?.resolution || '').trim() &&
          (_0x253529.resolution = _0x2a256d);
        const _0x51d1ff = normalizeDreaminaStyleVideoDuration(
          _0x5daa99,
          _0x4c3626 || _0x2c9bbe?.model,
          _0x2c9bbe?.duration,
          _0x148f2e,
        );
        Number(_0x51d1ff) !== Number(_0x2c9bbe?.duration) && (_0x253529.duration = _0x51d1ff);
      }
      if (_0x4c96cf.imageCount <= 0) {
        const _0x1243d4 = normalizeDreaminaVideoAspectRatio(_0x2c9bbe?.aspectRatio, {
          preserveAdaptive: true,
        });
        _0x1243d4 !== String(_0x2c9bbe?.aspectRatio || '').trim() &&
          String(_0x2c9bbe?.aspectRatio || '').trim() &&
          (_0x253529.aspectRatio = _0x1243d4);
      }
      _0xfd5ca !== String(_0x2c9bbe?.dreaminaRouteMode || '').trim() &&
        (_0x253529.dreaminaRouteMode = _0xfd5ca);
      const _0x4db713 = resolveDreaminaStyleVideoProvider(_0x2c9bbe?.model, _0x2c9bbe?.provider);
      String(_0x2c9bbe?.provider || '')
        .trim()
        .toLowerCase() !== _0x4db713 && (_0x253529.provider = _0x4db713);
      if (Object.keys(_0x253529).length > 0) {
        const _0x3d9a4e = buildDreaminaStorePatchFromNormalization(_0x2c9bbe, _0x253529);
        _0x2c9bbe = this._getDreaminaEffectiveNodeData({ ..._0x2c9bbe, ..._0x3d9a4e });
        const _0x136cc1 = _0x573227.getState().nodes?.[this.nodeId];
        _0x594ab3 && _0x136cc1 && _0x573227.updateNodeData(this.nodeId, _0x3d9a4e);
      }
      return { nodeData: _0x2c9bbe, summary: _0x4c96cf, resolvedTaskType: _0x5daa99, routeMode: _0xfd5ca };
    }
    ['_syncDreaminaPromptPlaceholder'](_0x3689b0 = this._data) {
      if (!this.promptEl) return;
      const _0x5100e3 = this.promptEl.dataset || (this.promptEl.dataset = {});
      if (!this._isDreaminaVideoNode(_0x3689b0)) {
        const _0x442c96 = this._resolveModelExecution(_0x3689b0?.model, _0x3689b0?.provider);
        _0x5100e3.placeholder = resolveVideoPromptPlaceholder(_0x442c96?.modelManifest, _0x3689b0);
        return;
      }
      const _0x405d1f = this._getDreaminaEffectiveNodeData(_0x3689b0),
        _0x2c7e19 = normalizeDreaminaVideoRouteMode(_0x405d1f?.dreaminaRouteMode, _0x405d1f?.mode);
      _0x5100e3.placeholder =
        _0x2c7e19 === 'frames2video'
          ? videoPanelText('dreaminaPrompt.frames2video')
          : videoPanelText('dreaminaPrompt.reference');
    }
    ['_decorateDreaminaFooter'](_0xc1ff4b, _0x395e1e) {
      const _0x1a12eb = _0x395e1e || this._syncDreaminaTaskState(this._data, { syncStore: false }),
        _0x2a5acd = _0x1a12eb?.nodeData || this._data,
        _0x8bd165 = this._getDreaminaRatioDisplayState(_0x2a5acd, _0x1a12eb),
        _0x1c6c09 = _0x8bd165?.resolvedTaskType || _0x1a12eb?.resolvedTaskType || 'text2video',
        _0xf6567e = _0x1a12eb?.routeMode || 'auto',
        _0xcaaf3 = _0x8bd165?.summary || _0x1a12eb?.summary || this._getDreaminaReferenceSummary(_0x2a5acd),
        _0x547d65 = getDreaminaVideoTaskParamVisibility(_0x1c6c09),
        _0x89e81e = resolveDreaminaStyleVideoProvider(_0x2a5acd?.model, _0x2a5acd?.provider),
        _0x4a97ac =
          _0x8bd165?.currentModel ||
          ensureDreaminaStyleVideoModelForTask(_0x1c6c09, _0x2a5acd?.model, _0x89e81e) ||
          normalizeDreaminaStyleVideoModel(_0x2a5acd?.model, _0x89e81e),
        _0x22c394 =
          _0x8bd165?.currentResolution ||
          normalizeDreaminaStyleVideoResolution(
            _0x1c6c09,
            _0x4a97ac,
            _0x2a5acd?.resolution || _0x2a5acd?.videoSize,
            _0x89e81e,
          ),
        _0x4778f7 = _0x8bd165?.currentRatio || normalizeDreaminaVideoAspectRatio(_0x2a5acd?.aspectRatio),
        _0x58e434 = normalizeDreaminaStyleVideoDuration(_0x1c6c09, _0x4a97ac, _0x2a5acd?.duration, _0x89e81e),
        _0x284cf1 = getDreaminaStyleVideoDurationRange(_0x1c6c09, _0x4a97ac, _0x89e81e),
        _0x1817d0 = _0xc1ff4b.querySelector('.img-model-pills'),
        _0x4921c1 = _0xc1ff4b.querySelector('.img-model-wrap'),
        _0x256f5d = _0xc1ff4b.querySelector('.img-model-btn-trigger'),
        _0x4a4666 = _0xc1ff4b.querySelector('.img-model-label'),
        _0x1d8ae5 = _0xc1ff4b.querySelector('.img-model-menu');
      if (_0x4921c1) _0x4921c1.hidden = false;
      _0x4a4666 && (_0x4a4666.textContent = getDreaminaProviderLabel(_0x89e81e));
      if (_0x256f5d) {
        const _0x562606 = this._getModelIconHTML(_0x4a97ac, _0x89e81e),
          _0x166e5f = _0x256f5d.firstElementChild;
        if (_0x166e5f) _0x166e5f.outerHTML = _0x562606;
        else _0x256f5d.insertAdjacentHTML('afterbegin', _0x562606);
      }
      _0x1d8ae5?.querySelectorAll('.floating-menu-item').forEach((_0x36d467) => {
        const _0x12ad0a = String(_0x36d467.dataset.value || '').trim(),
          _0x14cbe0 = String(_0x36d467.dataset.provider || '')
            .trim()
            .toLowerCase(),
          _0x145c57 =
            _0x89e81e === 'dreamina'
              ? _0x14cbe0 === 'dreamina' || _0x12ad0a === 'dreamina/text2video'
              : _0x89e81e === 'apimart'
                ? _0x14cbe0 === 'apimart' && isApimartDreaminaVideoModel(_0x12ad0a, _0x14cbe0)
                : _0x14cbe0 === _0x89e81e && isDreaminaStyleVideoModel(_0x12ad0a, _0x14cbe0);
        _0x36d467.classList.toggle('active', _0x145c57);
      });
      let _0x43dc4b = _0xc1ff4b.querySelector('.dreamina-task-model-wrap');
      !_0x43dc4b &&
        ((_0x43dc4b = document.createElement('div')),
        (_0x43dc4b.className = 'dreamina-task-model-wrap'),
        (_0x43dc4b.innerHTML =
          '\n        <button type="button" class="img-pill-btn dreamina-task-model-btn">\n          <span class="dreamina-task-model-label"></span>\n        </button>\n        <div class="floating-menu dreamina-task-model-menu"></div>\n      '),
        _0x4921c1?.insertAdjacentElement('afterend', _0x43dc4b));
      const _0x809e5f = _0x43dc4b.querySelector('.dreamina-task-model-btn'),
        _0x1e8737 = _0x43dc4b.querySelector('.dreamina-task-model-label'),
        _0x376734 = _0x43dc4b.querySelector('.dreamina-task-model-menu'),
        _0x4a73cf = getDreaminaTaskModelMenuMeta(_0x4a97ac, _0x89e81e);
      _0x1e8737 &&
        (_0x1e8737.textContent =
          _0x4a73cf?.title ||
          _0x2fa8d9(_0x4a97ac || getDreaminaStyleVideoDefaultModel(_0x1c6c09, _0x89e81e)));
      _0x376734 && (_0x376734.innerHTML = buildDreaminaTaskModelMenuHtml(_0x4a97ac, _0x1c6c09, _0x89e81e));
      const _0x1a5e73 =
        !isDreaminaVideoRouteModeEnabled(_0xf6567e) ||
        getDreaminaTaskModelMenuItems(_0x1c6c09, _0x89e81e).length <= 0;
      _0x809e5f && (_0x809e5f.disabled = _0x1a5e73);
      (_0xc1ff4b.querySelector('.img-ratio-wrap')?.remove(),
        _0xc1ff4b.querySelector('.vid-mode-wrap')?.remove(),
        _0xc1ff4b.querySelector('.vid-duration-wrap')?.remove(),
        _0xc1ff4b
          .querySelectorAll('[data-dreamina-video-param-schema]')
          .forEach((_0x1cc614) => _0x1cc614.remove()));
      const _0x397dc9 = this._getDreaminaEffectiveNodeData({
          ..._0x2a5acd,
          provider: _0x89e81e,
          model: _0x4a97ac,
          generationParams: {
            ...getPlainGenerationParams(_0x2a5acd?.generationParams),
            dreaminaRouteMode: _0xf6567e,
            aspectRatio: _0x4778f7,
            duration: _0x58e434,
            ...(_0x22c394 ? { resolution: _0x22c394 } : {}),
          },
        }),
        _0x2e0d08 = buildDreaminaParamSchemaFields({
          routeMode: _0xf6567e,
          currentRatio: _0x4778f7,
          currentResolution: _0x22c394,
          currentDuration: _0x58e434,
          durationRange: _0x284cf1,
          resolutionOptions: _0x8bd165?.resolutionOptions || [],
        }),
        _0x57a84f = (_0x3f536e, _0x12a2f6, _0xa599d = {}) => {
          if (!_0x12a2f6.length) return null;
          const _0x1c0024 = renderUiSchemaFields(_0x12a2f6, _0x397dc9, {
            sourceId: 'dreamina-video-normal-params',
            ..._0xa599d,
          });
          if (!_0x1c0024) return null;
          const _0x10ebf6 = document.createElement('div');
          return (
            (_0x10ebf6.className = 'ui-schema-placement ' + _0x3f536e),
            (_0x10ebf6.dataset.dreaminaVideoParamSchema = '1'),
            (_0x10ebf6.innerHTML = _0x1c0024),
            _0x10ebf6
          );
        },
        _0x1457cd = _0x547d65.mode ? _0x57a84f('dreamina-video-mode-schema', [_0x2e0d08.mode]) : null,
        _0x4cd8fb = _0x547d65.ratio
          ? _0x57a84f('dreamina-video-ratio-schema', [_0x2e0d08.resolution, _0x2e0d08.aspectRatio], {
              placement: 'resolution',
            })
          : null,
        _0x11042a = _0x547d65.duration
          ? _0x57a84f('dreamina-video-duration-schema', [_0x2e0d08.duration])
          : null;
      if (_0x1817d0) {
        const _0x682f2d = [_0x4921c1, _0x43dc4b, _0x1457cd, _0x4cd8fb, _0x11042a].filter(Boolean);
        _0x682f2d.forEach((_0xd196fe) => _0x1817d0.appendChild(_0xd196fe));
      }
      this._syncDreaminaPromptPlaceholder(_0x397dc9);
    }
    ['_resolveModelExecution'](_0x5ced15, _0x15afa7) {
      return (
        resolveModelExecution(_0x5ced15, { providerHint: _0x15afa7 }) ||
        resolveModelExecution(_0x5ced15) ||
        null
      );
    }
    ['_getModelProviderId'](_0xd14fb9, _0x39de74) {
      const _0x1d0876 = this._resolveModelExecution(_0xd14fb9, _0x39de74),
        _0x2c7202 = normalizeProviderId(_0x1d0876?.modelManifest?.provider);
      if (_0x2c7202) return _0x2c7202;
      return resolveModelProvider(_0xd14fb9, _0x39de74, { allowPrefixInference: false }) || null;
    }
    ['_isRunninghubWorkflowModel'](_0x8ab144, _0x36f180) {
      const _0x5bedc5 = this._resolveModelExecution(_0x8ab144, _0x36f180);
      return (
        normalizeProviderId(_0x5bedc5?.modelManifest?.provider) === 'runninghubwf' &&
        _0x5bedc5?.modelManifest?.adapterType === 'workflow' &&
        _0x5bedc5?.executionManifest?.adapterType === 'workflow'
      );
    }
    ['_getModelIconHTML'](_0x439cd4, _0x881b41) {
      const _0x2d3b5b = this._resolveModelExecution(_0x439cd4, _0x881b41),
        _0x1b8807 = this._getModelProviderId(_0x439cd4, _0x881b41);
      if (_0x1b8807 === 'apimart') return buildApimartVideoLogoHTML(12);
      if (_0x1b8807 === 'volcengine') return buildVolcengineVideoLogoHTML(12);
      if (_0x1b8807 === 'dreamina' || _0x2d3b5b?.modelManifest?.extensions?.dreaminaStyleVideo)
        return buildDreaminaVideoLogoHTML(12);
      const _0x429c1f = _0x1b8807 ? _0x241d0f?.[_0x1b8807]?.logoPath : null;
      if (_0x429c1f)
        return '<img src="' + _0x429c1f + '" class="node-menu-icon-small" alt="' + _0x1b8807 + '">';
      return '<div class="node-menu-icon-small node-menu-icon-badge video-model-fallback-icon">VM</div>';
    }
    ['_getModelParamVisibility'](_0x88c2e3, _0x17f1e9) {
      if (isDreaminaStyleVideoModel(_0x88c2e3, _0x17f1e9)) {
        const _0x5a34f1 = this._getResolvedDreaminaTaskType();
        return getDreaminaVideoTaskParamVisibility(_0x5a34f1);
      }
      const _0xfb9076 = this._getModelProviderId(_0x88c2e3, _0x17f1e9);
      if (_0xfb9076 === 'runninghub' || _0xfb9076 === 'runninghubwf')
        return { ratio: true, mode: false, duration: false };
      return { ratio: true, mode: true, duration: true };
    }
    ['_getRatioIconHTML'](_0x5e4f63) {
      if (_0x5e4f63 === '自适应')
        return '<svg class="video-ratio-auto-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>';
      const _0x3dd54a = {
          '1:1': 'img-rp-sq',
          '9:16': 'img-rp-tall',
          '16:9': 'img-rp-wide',
          '3:4': 'img-rp-p34',
          '4:3': 'img-rp-l43',
          '3:2': 'img-rp-l32',
          '2:3': 'img-rp-p23',
          '5:4': 'img-rp-l54',
          '4:5': 'img-rp-p45',
          '21:9': 'img-rp-ultra',
        },
        _0x508f3f = _0x3dd54a[_0x5e4f63] || 'img-rp-sq';
      return '<span class="img-rp-icon video-ratio-icon ' + _0x508f3f + '"></span>';
    }
    ['_updateSubmitButtonState']() {
      if (!this.btnEl) return;
      const _0x2d4859 = typeof _0x573227.getState === 'function' ? _0x573227.getState() : {},
        _0x4d9b62 = _0x2d4859?.nodes || {},
        _0x1e6bbd =
          typeof _0x573227.getIncomingEdges === 'function' ? _0x573227.getIncomingEdges(this.nodeId) : [],
        _0x41c39f = _0x4d9b62?.[this.nodeId] || this._data || {},
        _0x180ce7 = this._isRunninghubWorkflowModel(_0x41c39f?.model, _0x41c39f?.provider),
        _0x28a804 = resolveGenerationButtonMode(_0x41c39f, {
          cancellable: _0x180ce7,
          cancelInFlight: this._rhCancelInFlight === true,
        });
      if (_0x28a804.busy) {
        if (_0x180ce7) {
          const _0x1edbc6 = getVideoCancelTooltip();
          setGenerateButtonCancellableUi(this.btnEl, {
            title: _0x1edbc6,
            tooltip: _0x1edbc6,
            ariaLabel: videoPanelText('cancelGenerateAria'),
            color: 'var(--red)',
            busy: true,
          });
        } else {
          const _0x4b2c3a = getVideoGenerateTitle();
          setGenerateButtonLoadingUi(this.btnEl, { title: _0x4b2c3a, disabled: true, ariaLabel: _0x4b2c3a });
        }
        ((this.btnEl.disabled = _0x28a804.disabled), (this.btnEl.style.cursor = _0x28a804.cursor));
        return;
      }
      resetGenerateButtonIdleUi(this.btnEl, getVideoGenerateTitle());
      const _0x21f174 = resolvePromptTextWithTextRefs({
        promptEl: this.promptEl,
        inEdges: _0x1e6bbd,
        nodes: _0x4d9b62,
      });
      if (this._isDreaminaVideoNode(_0x41c39f)) {
        const _0x5ce2f2 = this._syncDreaminaTaskState(_0x41c39f, { syncStore: true });
        this._data = _0x5ce2f2.nodeData || this._data;
        const _0x36e4ac = _0x5ce2f2.summary || this._getDreaminaReferenceSummary(),
          _0x3d1d2e = _0x5ce2f2.resolvedTaskType || this._getResolvedDreaminaTaskType(),
          _0x4cda17 = _0x5ce2f2.routeMode || 'multimodal2video';
        if (!isDreaminaVideoRouteModeEnabled(_0x4cda17)) {
          ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'));
          return;
        }
        const _0x7ade22 = validateDreaminaVideoRouteSelection({
          routeMode: _0x4cda17,
          taskType: _0x3d1d2e,
          imageCount: _0x36e4ac.imageCount,
          videoCount: _0x36e4ac.videoCount,
          audioCount: _0x36e4ac.audioCount,
        });
        let _0x54d312 = !_0x7ade22;
        if (_0x54d312) {
          if (_0x3d1d2e === 'text2video') _0x54d312 = !!_0x21f174;
          else {
            if (_0x3d1d2e === 'image2video') _0x54d312 = !!_0x21f174 && _0x36e4ac.imageCount === 1;
            else {
              if (_0x3d1d2e === 'frames2video') _0x54d312 = !!_0x21f174 && _0x36e4ac.imageCount === 2;
              else {
                if (_0x3d1d2e === 'multiframe2video') _0x54d312 = false;
                else
                  _0x3d1d2e === 'multimodal2video' &&
                    (_0x54d312 = _0x36e4ac.imageCount > 0 || _0x36e4ac.videoCount > 0);
              }
            }
          }
        }
        ((this.btnEl.disabled = !_0x54d312),
          (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
        return;
      }
      const _0x23c9ab = !!_0x1e6bbd.length;
      if (isHappyHorsePanelModel(_0x41c39f)) {
        ((this.btnEl.disabled = !_0x21f174),
          (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
        return;
      }
      const _0xb53068 = getFixedInputSlotConfigFromManifest(this._data || {}),
        _0x3c961b = (_0xb53068?.fixedSlots || []).filter((_0x37ef95) => _0x37ef95?.required === true),
        _0xe55952 = (_0xb53068?.exclusiveGroups || []).filter(
          (_0xfffe70) => _0xfffe70?.required === true || Number(_0xfffe70?.min || 0) > 0,
        );
      if (_0x3c961b.length > 0 || _0xe55952.length > 0) {
        const _0x854f6a = _0x4d9b62?.[this.nodeId] || this._data || {},
          _0x503db2 = new Set(),
          _0x338b22 = new Set(_0xb53068.visibleSlots || []);
        for (const _0x10b65b of _0x1e6bbd) {
          const _0x26f929 = _0x4d9b62[_0x10b65b.sourceId];
          if (!_0x26f929) continue;
          const _0x50a97d = resolveEffectiveInputKind(_0x26f929, _0x10b65b),
            { slot: _0xdf9d87 } = resolveFixedInputSlotForRef({
              fixedInputConfig: _0xb53068,
              refSlot: _0x10b65b?.refSlot,
              kind: _0x50a97d,
              occupiedSlots: _0x503db2,
              sourceNode: _0x26f929,
            });
          if (_0xdf9d87 && _0x338b22.has(_0xdf9d87)) _0x503db2.add(_0xdf9d87);
        }
        const _0x55f6a9 = buildFixedInputAssetSlotMap(this.promptEl, {
            slotOrderByType: _0xb53068.slotOrderByType,
            visibleSlots: _0xb53068.visibleSlots,
            exclusiveGroups: _0xb53068.exclusiveGroups,
            slotById: _0xb53068.slotById,
            occupiedSlots: _0x503db2,
            nodeData: _0x854f6a,
          }),
          _0x7aca8b = _0x3c961b.every((_0x163a8d) => {
            const _0x3463ef = String(_0x163a8d?.id || '').trim();
            return !!_0x3463ef && (_0x503db2.has(_0x3463ef) || !!_0x55f6a9[_0x3463ef]);
          }),
          _0x2f3a01 = _0xe55952.every((_0x50ad60) => {
            const _0x53bf30 = Array.isArray(_0x50ad60?.slots) ? _0x50ad60.slots : [];
            return _0x53bf30.some((_0x959198) => _0x503db2.has(_0x959198) || !!_0x55f6a9[_0x959198]);
          }),
          _0x140728 = _0x7aca8b && _0x2f3a01;
        ((this.btnEl.disabled = !_0x140728),
          (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
        return;
      }
      ((this.btnEl.disabled = _0x180ce7 ? false : !_0x21f174 && !_0x23c9ab),
        (this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : ''));
    }
  }
  return _0x1077c8.prototype;
}
