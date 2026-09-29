import { t } from '../../i18n/index.js';
import { translateManifestText } from '../../i18n/manifestText.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { pickGenerationRatioSourceEdge } from '../../modules/generationRatioSource.js';
import { getPlainGenerationParams } from './runningHubVideoUiSchema.js';
const VIDEO_ADAPTIVE_RATIO_VALUE = '自适应';
export const VIDEO_MODE_ALL_REFERENCE_VALUE = '全能参考';
export const VIDEO_MODE_FIRST_LAST_VALUE = '首尾帧';
export const DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER = Object['freeze'](['resolution', 'mode']);
export function videoPanelText(_0x51d1e1, _0x43eabb = {}) {
  return t('videoNode.parameterPanel.' + _0x51d1e1, _0x43eabb);
}
export function getVideoGenerateTitle() {
  return videoPanelText('generateTitle');
}
export function getVideoCancelTooltip() {
  return videoPanelText('cancelTooltip');
}
function getDefaultVideoPromptPlaceholder() {
  return videoPanelText('defaultPromptPlaceholder');
}
function formatVideoAspectRatioLabel(_0x2e62dd) {
  const _0x48f87c = String(_0x2e62dd || '')['trim']();
  if (!_0x48f87c || _0x48f87c === VIDEO_ADAPTIVE_RATIO_VALUE) return videoPanelText('adaptive');
  return _0x48f87c;
}
export function formatVideoRatioResolutionLabel(_0xbc7d71, _0x432a62) {
  return videoPanelText('ratioResolutionLabel', {
    aspectRatio: formatVideoAspectRatioLabel(_0xbc7d71),
    resolution: _0x432a62,
  });
}
export function resolveVideoAdaptiveRatioSource({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  adaptivePolicy: adaptivePolicy = {},
} = {}) {
  const _0x4b4494 = Array['isArray'](inEdges) ? inEdges : [];
  let _0x4ebb58 = pickGenerationRatioSourceEdge(_0x4b4494, nodeData) || _0x4b4494[0x0] || null;
  const _0xac04b6 = String(adaptivePolicy?.['preferSlot'] || '')['trim'](),
    _0x3057b8 = adaptivePolicy?.['preferVideoKind'] === !![],
    _0x46d168 = adaptivePolicy?.['fallbackSquareWhenNoVideo'] === !![];
  if (_0xac04b6) {
    const _0x2861bb = _0x4b4494['find']((_0x1421fa) => String(_0x1421fa?.['refSlot'] || '') === _0xac04b6);
    if (_0x2861bb) _0x4ebb58 = _0x2861bb;
    else {
      if (_0x3057b8) {
        const _0x122aca = _0x4b4494['find'](
          (_0x3edee7) => resolveEffectiveInputKind(nodes?.[_0x3edee7?.['sourceId']], _0x3edee7) === 'video',
        );
        if (_0x122aca) _0x4ebb58 = _0x122aca;
        else return { edge: null, fallbackSquare: _0x46d168 };
      }
    }
  }
  return { edge: _0x4ebb58, fallbackSquare: ![] };
}
export function getVideoModeLabel(_0x37e2e4) {
  const _0x15f5bb = String(_0x37e2e4 || '')['trim']() || VIDEO_MODE_ALL_REFERENCE_VALUE;
  if (_0x15f5bb === VIDEO_MODE_ALL_REFERENCE_VALUE) return videoPanelText('mode.allReference');
  if (_0x15f5bb === VIDEO_MODE_FIRST_LAST_VALUE) return videoPanelText('mode.firstLastFrame');
  return _0x15f5bb;
}
export function getDreaminaProviderLabel(_0x9b326c) {
  const _0x4a11ac = String(_0x9b326c || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x4a11ac === 'dreamina') return videoPanelText('providers.dreamina');
  if (_0x4a11ac === 'volcengine') return videoPanelText('providers.volcengine');
  return videoPanelText('providers.default');
}
function getManifestConditionFieldValue(_0x2a921c = {}, _0x248aaf = '') {
  const _0x552324 = String(_0x248aaf || '')['trim']();
  if (!_0x552324) return undefined;
  const _0x5c0ab6 = getPlainGenerationParams(_0x2a921c?.['generationParams']);
  if (Object['prototype']['hasOwnProperty']['call'](_0x5c0ab6, _0x552324)) return _0x5c0ab6[_0x552324];
  if (Object['prototype']['hasOwnProperty']['call'](_0x2a921c || {}, _0x552324)) return _0x2a921c[_0x552324];
  const _0xd401c9 = _0x552324['split']('.')['filter'](Boolean);
  if (_0xd401c9['length'] <= 0x1) return undefined;
  let _0x2905b6 = _0x2a921c;
  for (const _0x280cd7 of _0xd401c9) {
    if (!_0x2905b6 || typeof _0x2905b6 !== 'object') return undefined;
    _0x2905b6 = _0x2905b6[_0x280cd7];
  }
  return _0x2905b6;
}
function manifestConditionMatches(_0x318571, _0x4e72d6 = {}) {
  if (Array['isArray'](_0x318571))
    return _0x318571['some']((_0x2184c3) => manifestConditionMatches(_0x2184c3, _0x4e72d6));
  if (!_0x318571 || typeof _0x318571 !== 'object') return ![];
  if (Array['isArray'](_0x318571['any']))
    return _0x318571['any']['some']((_0xb6ab88) => manifestConditionMatches(_0xb6ab88, _0x4e72d6));
  if (Array['isArray'](_0x318571['all']))
    return _0x318571['all']['every']((_0xaa4159) => manifestConditionMatches(_0xaa4159, _0x4e72d6));
  const _0x46cebc = String(_0x318571['field'] || _0x318571['param'] || '')['trim']();
  if (!_0x46cebc) return ![];
  const _0x4027c9 = getManifestConditionFieldValue(_0x4e72d6, _0x46cebc),
    _0x5aced6 = Array['isArray'](_0x318571['values'])
      ? _0x318571['values']
      : Object['prototype']['hasOwnProperty']['call'](_0x318571, 'value')
        ? [_0x318571['value']]
        : [];
  if (_0x5aced6['length'] === 0x0) return Boolean(_0x4027c9);
  return _0x5aced6['some'](
    (_0x2631e1) => _0x4027c9 === _0x2631e1 || String(_0x4027c9 ?? '') === String(_0x2631e1 ?? ''),
  );
}
function resolveManifestPromptPlaceholder(_0x21d48e, _0x384a3b = {}) {
  if (!_0x21d48e || typeof _0x21d48e !== 'object') return '';
  const _0x48379d = Array['isArray'](_0x21d48e['variants']) ? _0x21d48e['variants'] : [];
  for (const _0x2745cb of _0x48379d) {
    if (
      _0x2745cb &&
      typeof _0x2745cb === 'object' &&
      manifestConditionMatches(_0x2745cb['when'], _0x384a3b)
    ) {
      const _0x1e9656 = translateManifestText(_0x2745cb['placeholder'] || '')['trim']();
      if (_0x1e9656) return _0x1e9656;
    }
  }
  return translateManifestText(_0x21d48e['placeholder'] || '')['trim']();
}
export function resolveVideoPromptPlaceholder(
  _0x2fb26a,
  _0x3471ff = {},
  _0x411f42 = getDefaultVideoPromptPlaceholder(),
) {
  const _0xdd18f2 = resolveManifestPromptPlaceholder(_0x2fb26a?.['prompt'], _0x3471ff);
  return _0xdd18f2 || String(_0x411f42 || '')['trim']();
}
export function shouldShowVideoPromptInput(_0x44cbb2) {
  if (!_0x44cbb2 || typeof _0x44cbb2 !== 'object') return !![];
  if (_0x44cbb2?.['prompt']?.['visible'] === ![]) return ![];
  if (_0x44cbb2?.['prompt']?.['hidden'] === !![]) return ![];
  return !![];
}
function fieldConditionReferences(_0x328619, _0x59bf42) {
  const _0x123688 = String(_0x59bf42 || '')['trim']();
  if (Array['isArray'](_0x328619))
    return _0x328619['some']((_0x3d2762) => fieldConditionReferences(_0x3d2762, _0x123688));
  if (!_0x123688 || !_0x328619 || typeof _0x328619 !== 'object') return ![];
  if (String(_0x328619['field'] || _0x328619['param'] || '')['trim']() === _0x123688) return !![];
  return ['all', 'any']['some'](
    (_0x5ef6fb) =>
      Array['isArray'](_0x328619[_0x5ef6fb]) &&
      _0x328619[_0x5ef6fb]['some']((_0x518ab5) => fieldConditionReferences(_0x518ab5, _0x123688)),
  );
}
export function manifestHelpVariantsReferenceField(_0x3cfe0f, _0x281447) {
  const _0x284105 = Array['isArray'](_0x3cfe0f?.['help']?.['variants']) ? _0x3cfe0f['help']['variants'] : [];
  return _0x284105['some']((_0x3a890a) => fieldConditionReferences(_0x3a890a?.['when'], _0x281447));
}
export function manifestPromptVariantsReferenceField(_0x181239, _0xa22169) {
  const _0x1f4b18 = Array['isArray'](_0x181239?.['prompt']?.['variants'])
    ? _0x181239['prompt']['variants']
    : [];
  return _0x1f4b18['some']((_0x505b41) => fieldConditionReferences(_0x505b41?.['when'], _0xa22169));
}
export function manifestFixedSlotVisibilityReferencesField(_0x18bc80, _0x568556) {
  const _0x19fd4a = Array['isArray'](_0x18bc80?.['inputSlots']?.['fixedSlots'])
    ? _0x18bc80['inputSlots']['fixedSlots']
    : [];
  return _0x19fd4a['some'](
    (_0x1ddf80) =>
      fieldConditionReferences(_0x1ddf80?.['showWhen'], _0x568556) ||
      fieldConditionReferences(_0x1ddf80?.['hideWhen'], _0x568556),
  );
}
export function resolveVideoModelApiFooterPlacementOrder(_0x59e9a6 = {}) {
  const _0xec3d43 = new Set(DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER),
    _0x9e7e24 = [],
    _0x341bd6 = Array['isArray'](_0x59e9a6?.['uiSchema']?.['footerPlacementOrder'])
      ? _0x59e9a6['uiSchema']['footerPlacementOrder']
      : [];
  return (
    _0x341bd6['forEach']((_0x2200aa) => {
      const _0x253c98 = String(_0x2200aa || '')
        ['trim']()
        ['toLowerCase']();
      _0xec3d43['has'](_0x253c98) && !_0x9e7e24['includes'](_0x253c98) && _0x9e7e24['push'](_0x253c98);
    }),
    DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER['forEach']((_0x124285) => {
      if (!_0x9e7e24['includes'](_0x124285)) _0x9e7e24['push'](_0x124285);
    }),
    _0x9e7e24
  );
}
export function wrapUiSchemaPlacementControls(_0x10d20a) {
  return _0x10d20a ? '<div class="ui-schema-placement">' + _0x10d20a + '</div>' : '';
}
