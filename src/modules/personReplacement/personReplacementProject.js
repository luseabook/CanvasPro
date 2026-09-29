import { normalizeSmartClipFps, normalizeSmartClipMode } from '../../services/smartClipJobService.js';
import { resolveModelProvider } from '../../manifests/index.js';
import { buildModelProviderProfileSelectionPatch } from '../modelProviderProfileSelection.js';
import { RH_VIDEO_V54_MODEL_ID } from '../../manifests/video/runninghub/runningHubVideoV54Manifest.js';
import { RH_VIDEO_ANIMATE2_V1_MODEL_ID } from '../../manifests/video/runninghub/runningHubVideoAnimate2V1Manifest.js';
import { RH_VIDEO_BERNINI_V1_MODEL_ID } from '../../manifests/video/runninghub/runningHubVideoBerniniV1Manifest.js';
import { RH_VIDEO_HAILUO_H3_EDIT_V1_MODEL_ID } from '../../manifests/video/runninghub/runningHubVideoHailuoH3EditV1Manifest.js';
import {
  RH_VIDEO_SCAIL2_V1_MODEL_ID,
  RH_VIDEO_SCAIL_V2_MODEL_ID,
} from '../../manifests/video/runninghub/runningHubVideoScail2V1Manifest.js';
import { normalizePersonReplacementVoiceSeparationsBySourceId } from './personReplacementVoiceSeparationState.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
import { normalizePersonReplacementPromptMode } from './personReplacementPromptMode.js';
import {
  assignPersonReplacementPromptIndexes,
  formatPersonReplacementPersonLabel,
} from './personReplacementPromptIdentity.js';
export { formatPersonReplacementPersonLabel };
export const PERSON_REPLACEMENT_SCHEMA_VERSION = 0x7;
export const PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID = 'apimart/gpt-image-2';
export const PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID = RH_VIDEO_SCAIL2_V1_MODEL_ID;
export const PERSON_REPLACEMENT_DEFAULT_VIDEO_PROMPT =
  '保持源视频动作、镜头和构图，使用参考图中的人物形象替换对应人物。';
export const PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME = 'first-frame';
export const PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE = 'character-reference';
export const PERSON_REPLACEMENT_VIDEO_INPUT_MODES = Object['freeze']([
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
]);
export const PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE = 'replacement-image';
export const PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE = 'character-reference';
export const PERSON_REPLACEMENT_VIDEO_MODEL_IDS = Object['freeze']([
  RH_VIDEO_V54_MODEL_ID,
  RH_VIDEO_ANIMATE2_V1_MODEL_ID,
  RH_VIDEO_BERNINI_V1_MODEL_ID,
  RH_VIDEO_HAILUO_H3_EDIT_V1_MODEL_ID,
  RH_VIDEO_SCAIL2_V1_MODEL_ID,
  RH_VIDEO_SCAIL_V2_MODEL_ID,
]);
const PERSON_REPLACEMENT_VIDEO_PARAMETER_POLICIES = Object['freeze']({
  [RH_VIDEO_V54_MODEL_ID]: Object['freeze']({
    [PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME]: Object['freeze']({
      defaultParams: Object['freeze']({ rhSubtractSubject: ![] }),
      transitionParams: Object['freeze']({ rhSubtractSubject: ![] }),
    }),
    [PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE]: Object['freeze']({
      transitionParams: Object['freeze']({ rhSubtractSubject: !![] }),
    }),
  }),
  [RH_VIDEO_SCAIL2_V1_MODEL_ID]: Object['freeze']({
    [PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME]: Object['freeze']({
      defaultParams: Object['freeze']({ rhScail2ReplaceSubject: ![] }),
      transitionParams: Object['freeze']({ rhScail2ReplaceSubject: ![] }),
    }),
    [PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE]: Object['freeze']({
      forcedParams: Object['freeze']({ rhScail2ReplaceSubject: !![] }),
      lockedFields: Object['freeze'](['rhScail2ReplaceSubject']),
    }),
  }),
  [RH_VIDEO_SCAIL_V2_MODEL_ID]: Object['freeze']({
    [PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME]: Object['freeze']({
      defaultParams: Object['freeze']({ rhScail2ReplaceSubject: ![] }),
      transitionParams: Object['freeze']({ rhScail2ReplaceSubject: ![] }),
    }),
    [PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE]: Object['freeze']({
      forcedParams: Object['freeze']({ rhScail2ReplaceSubject: !![] }),
      lockedFields: Object['freeze'](['rhScail2ReplaceSubject']),
    }),
  }),
});
export const PERSON_REPLACEMENT_PROJECT_STATUSES = Object['freeze']([
  'draft',
  'analyzing',
  'character_mapping',
  'shot_review',
  'ready',
  'generating',
  'composing',
  'completed',
]);
export const PERSON_REPLACEMENT_ORIENTATIONS = Object['freeze']([
  'front',
  'back',
  'side',
  'left_profile',
  'right_profile',
  'three_quarter_left',
  'three_quarter_right',
  'over_shoulder_left',
  'over_shoulder_right',
  'unknown',
]);
export const PERSON_REPLACEMENT_SCOPES = Object['freeze']([
  'full-person',
  'visible-part',
  'clothing',
  'arm-hand',
  'face-hair',
  'feet',
]);
export const PERSON_REPLACEMENT_DEFAULT_SCOPE = 'full-person';
const PERSON_REPLACEMENT_SCOPE_LABELS = Object['freeze']({
  'full-person': '完整人物',
  'visible-part': '仅可见部分',
  clothing: '衣服',
  'arm-hand': '手臂手部',
  'face-hair': '脸发',
  feet: '脚部',
});
export function isGeneratedPersonReplacementLabel(_0x1911a4) {
  return /^人物(?:[A-Z]+|\d+)$/u['test'](normalizeText(_0x1911a4));
}
const STATUS_INDEX = new Map(
    PERSON_REPLACEMENT_PROJECT_STATUSES['map']((_0x60b4db, _0x4e6333) => [_0x60b4db, _0x4e6333]),
  ),
  ORIENTATION_SET = new Set(PERSON_REPLACEMENT_ORIENTATIONS),
  REPLACEMENT_SCOPE_SET = new Set(PERSON_REPLACEMENT_SCOPES),
  AUDIO_TRACKS = new Set(['original', 'replacement']),
  IDENTITY_REVIEW_STATUSES = new Set(['auto', 'needs_review', 'confirmed']),
  IDENTITY_METHODS = new Set(['osnet', 'manual', 'fallback', 'unassigned']);
function normalizeText(_0x5c3bfe) {
  return String(_0x5c3bfe ?? '')['trim']();
}
export function normalizePersonReplacementScope(_0x29f254) {
  const _0x3f4437 = normalizeText(_0x29f254);
  return REPLACEMENT_SCOPE_SET['has'](_0x3f4437) ? _0x3f4437 : PERSON_REPLACEMENT_DEFAULT_SCOPE;
}
export function formatPersonReplacementScopeLabel(_0x6c6d68) {
  return PERSON_REPLACEMENT_SCOPE_LABELS[normalizePersonReplacementScope(_0x6c6d68)];
}
export function resolvePersonReplacementVideoModelId(_0x35b49f) {
  const _0x360b9c = normalizeText(_0x35b49f);
  return PERSON_REPLACEMENT_VIDEO_MODEL_IDS['includes'](_0x360b9c)
    ? _0x360b9c
    : PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID;
}
export function resolvePersonReplacementVideoGenerationFps(_0x1385c0 = {}) {
  if (_0x1385c0?.['processingMode'] === 'skip') return 0x18;
  return normalizeSmartClipFps(_0x1385c0?.['smartClipFps']);
}
export function normalizePersonReplacementVideoInputMode(_0x2554a8) {
  const _0x13f988 = normalizeText(_0x2554a8);
  return PERSON_REPLACEMENT_VIDEO_INPUT_MODES['includes'](_0x13f988)
    ? _0x13f988
    : PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME;
}
function normalizePlainObject(_0x3e3776) {
  return _0x3e3776 && typeof _0x3e3776 === 'object' && !Array['isArray'](_0x3e3776) ? { ..._0x3e3776 } : {};
}
export function resolvePersonReplacementVideoParameterPolicy({
  modelId: modelId = PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  inputMode: inputMode = PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
  generationParams: generationParams = {},
  resetModeDefaults: resetModeDefaults = ![],
} = {}) {
  const _0x482cf6 = resolvePersonReplacementVideoModelId(modelId),
    _0x1a23de = normalizePersonReplacementVideoInputMode(inputMode),
    _0x15c95f = PERSON_REPLACEMENT_VIDEO_PARAMETER_POLICIES[_0x482cf6]?.[_0x1a23de] || {},
    _0x382a2a = {
      ...normalizePlainObject(_0x15c95f['defaultParams']),
      ...normalizePlainObject(generationParams),
      ...(resetModeDefaults ? normalizePlainObject(_0x15c95f['transitionParams']) : {}),
      ...normalizePlainObject(_0x15c95f['forcedParams']),
    },
    _0x433673 = {};
  return (
    (Array['isArray'](_0x15c95f['lockedFields']) ? _0x15c95f['lockedFields'] : [])['forEach']((_0x44cd4c) => {
      const _0x25bf88 = normalizeText(_0x44cd4c);
      if (_0x25bf88) _0x433673[_0x25bf88] = { disabled: !![] };
    }),
    { modelId: _0x482cf6, inputMode: _0x1a23de, generationParams: _0x382a2a, uiSchemaFieldState: _0x433673 }
  );
}
function normalizeParamsByModel(_0x1f4aeb) {
  const _0x2ba095 = normalizePlainObject(_0x1f4aeb);
  return Object['fromEntries'](
    Object['entries'](_0x2ba095)
      ['map'](([_0x1dec5a, _0x383f63]) => [normalizeText(_0x1dec5a), normalizePlainObject(_0x383f63)])
      ['filter'](([_0x56b185]) => _0x56b185),
  );
}
function firstDefined(..._0xe5a454) {
  return _0xe5a454['find']((_0x4e5a7d) => _0x4e5a7d !== undefined && _0x4e5a7d !== null);
}
function toArray(_0x58f6df) {
  if (Array['isArray'](_0x58f6df)) return _0x58f6df;
  return _0x58f6df && typeof _0x58f6df === 'object' ? [_0x58f6df] : [];
}
function normalizeNonNegativeNumber(_0x4aa656, _0x817e35 = 0x0) {
  const _0x3f7db9 = Number(_0x4aa656);
  return Number['isFinite'](_0x3f7db9) && _0x3f7db9 >= 0x0 ? _0x3f7db9 : _0x817e35;
}
function normalizeConfidence(_0x558e6c) {
  const _0x57fe8c = Number(_0x558e6c);
  if (!Number['isFinite'](_0x57fe8c)) return 0x0;
  const _0x2e9594 = _0x57fe8c > 0x1 && _0x57fe8c <= 0x64 ? _0x57fe8c / 0x64 : _0x57fe8c;
  return Math['max'](0x0, Math['min'](0x1, _0x2e9594));
}
function normalizeStringArray(_0x5ca311) {
  const _0x4d0ec0 = [],
    _0x4dd0a3 = new Set();
  return (
    toArray(_0x5ca311)['forEach']((_0x3d2dd5) => {
      const _0x229797 = normalizeText(_0x3d2dd5);
      if (!_0x229797 || _0x4dd0a3['has'](_0x229797)) return;
      (_0x4dd0a3['add'](_0x229797), _0x4d0ec0['push'](_0x229797));
    }),
    _0x4d0ec0
  );
}
function normalizeImageRefs(_0x599082) {
  const _0x5f3ed5 = [],
    _0x10d96d = new Set(),
    _0x1f2c73 = Array['isArray'](_0x599082)
      ? _0x599082
      : _0x599082 === undefined || _0x599082 === null
        ? []
        : [_0x599082];
  return (
    _0x1f2c73['forEach']((_0x67d301) => {
      const _0x44b6a7 = normalizeText(
        _0x67d301 && typeof _0x67d301 === 'object'
          ? firstDefined(
              _0x67d301['ref'],
              _0x67d301['id'],
              _0x67d301['assetRef'],
              _0x67d301['url'],
              _0x67d301['path'],
            )
          : _0x67d301,
      );
      if (!_0x44b6a7 || _0x10d96d['has'](_0x44b6a7)) return;
      (_0x10d96d['add'](_0x44b6a7), _0x5f3ed5['push'](_0x44b6a7));
    }),
    _0x5f3ed5
  );
}
function parseJsonLike(_0x53e2d9) {
  if (typeof _0x53e2d9 !== 'string') return _0x53e2d9;
  const _0x585b1d = _0x53e2d9['trim']();
  if (!_0x585b1d) return {};
  const _0x2444d8 = _0x585b1d['replace'](/^```(?:json)?\s*/iu, '')
    ['replace'](/\s*```$/u, '')
    ['trim']();
  try {
    return JSON['parse'](_0x2444d8);
  } catch {
    const _0x355b09 = Math['min'](
        ...[_0x2444d8['indexOf']('{'), _0x2444d8['indexOf']('[')]['filter']((_0x316ff4) => _0x316ff4 >= 0x0),
      ),
      _0x3d6f61 = _0x2444d8['lastIndexOf']('}'),
      _0x45b951 = _0x2444d8['lastIndexOf'](']'),
      _0x162157 = Math['max'](_0x3d6f61, _0x45b951);
    if (Number['isFinite'](_0x355b09) && _0x355b09 >= 0x0 && _0x162157 > _0x355b09)
      try {
        return JSON['parse'](_0x2444d8['slice'](_0x355b09, _0x162157 + 0x1));
      } catch {
        return {};
      }
    return {};
  }
}
function unwrapAiAnalysis(_0x95c23d) {
  let _0xb545eb = parseJsonLike(_0x95c23d);
  for (let _0x360dd4 = 0x0; _0x360dd4 < 0x5; _0x360dd4 += 0x1) {
    if (!_0xb545eb || typeof _0xb545eb !== 'object' || Array['isArray'](_0xb545eb)) break;
    const _0x183088 = firstDefined(
      _0xb545eb['analysis'],
      _0xb545eb['result'],
      _0xb545eb['output'],
      _0xb545eb['data'],
      _0xb545eb['response'],
    );
    if (_0x183088 === undefined || _0x183088 === _0xb545eb) break;
    _0xb545eb = parseJsonLike(_0x183088);
  }
  return _0xb545eb;
}
const ORIENTATION_ALIASES = new Map([
  ['front', 'front'],
  ['frontal', 'front'],
  ['正面', 'front'],
  ['正脸', 'front'],
  ['面向镜头', 'front'],
  ['back', 'back'],
  ['back_facing', 'back'],
  ['rear', 'back'],
  ['背面', 'back'],
  ['背身', 'back'],
  ['背对镜头', 'back'],
  ['side', 'side'],
  ['profile', 'side'],
  ['侧面', 'side'],
  ['侧身', 'side'],
  ['left_profile', 'left_profile'],
  ['profile_left', 'left_profile'],
  ['左侧面', 'left_profile'],
  ['左侧脸', 'left_profile'],
  ['right_profile', 'right_profile'],
  ['profile_right', 'right_profile'],
  ['右侧面', 'right_profile'],
  ['右侧脸', 'right_profile'],
  ['three_quarter_left', 'three_quarter_left'],
  ['3_4_left', 'three_quarter_left'],
  ['左三分之四', 'three_quarter_left'],
  ['左前侧', 'three_quarter_left'],
  ['three_quarter_right', 'three_quarter_right'],
  ['3_4_right', 'three_quarter_right'],
  ['右三分之四', 'three_quarter_right'],
  ['右前侧', 'three_quarter_right'],
  ['over_shoulder_left', 'over_shoulder_left'],
  ['over_the_shoulder_left', 'over_shoulder_left'],
  ['左侧过肩', 'over_shoulder_left'],
  ['左过肩', 'over_shoulder_left'],
  ['over_shoulder_right', 'over_shoulder_right'],
  ['over_the_shoulder_right', 'over_shoulder_right'],
  ['右侧过肩', 'over_shoulder_right'],
  ['右过肩', 'over_shoulder_right'],
  ['unknown', 'unknown'],
  ['未知', 'unknown'],
]);
export function normalizePersonReplacementOrientation(_0x49fcf7) {
  const _0x24ff54 = normalizeText(_0x49fcf7)['toLowerCase']();
  if (!_0x24ff54) return 'unknown';
  const _0x92e1d2 = _0x24ff54['replace'](/[\s/-]+/gu, '_');
  if (ORIENTATION_SET['has'](_0x92e1d2)) return _0x92e1d2;
  if (ORIENTATION_ALIASES['has'](_0x92e1d2)) return ORIENTATION_ALIASES['get'](_0x92e1d2);
  if (/过肩|over.*shoulder/iu['test'](_0x24ff54)) {
    if (/左|left/iu['test'](_0x24ff54)) return 'over_shoulder_left';
    if (/右|right/iu['test'](_0x24ff54)) return 'over_shoulder_right';
  }
  if (/背|back|rear/iu['test'](_0x24ff54)) return 'back';
  if (/正|front/iu['test'](_0x24ff54)) return 'front';
  if (/左.*(?:侧|profile)|(?:left).*profile/iu['test'](_0x24ff54)) return 'left_profile';
  if (/右.*(?:侧|profile)|(?:right).*profile/iu['test'](_0x24ff54)) return 'right_profile';
  if (/侧|side|profile/iu['test'](_0x24ff54)) return 'side';
  return 'unknown';
}
function normalizeHorizontal(_0x4fc934) {
  const _0x4c24e5 = normalizeText(_0x4fc934)['toLowerCase']();
  if (/左|left/iu['test'](_0x4c24e5)) return 'left';
  if (/右|right/iu['test'](_0x4c24e5)) return 'right';
  if (/中|center|centre|middle/iu['test'](_0x4c24e5)) return 'center';
  return 'unknown';
}
function normalizeDepth(_0x1b49ec) {
  const _0xa0a99e = normalizeText(_0x1b49ec)['toLowerCase']();
  if (/前景|foreground|near|close/iu['test'](_0xa0a99e)) return 'foreground';
  if (/后景|背景|background|far/iu['test'](_0xa0a99e)) return 'background';
  if (/中景|midground|middle/iu['test'](_0xa0a99e)) return 'midground';
  return 'unknown';
}
function normalizeOcclusion(_0x5952ed) {
  if (_0x5952ed === !![]) return 'partial';
  if (_0x5952ed === ![]) return 'none';
  const _0x3e3d35 = normalizeText(
    _0x5952ed && typeof _0x5952ed === 'object'
      ? firstDefined(_0x5952ed['level'], _0x5952ed['type'], _0x5952ed['status'])
      : _0x5952ed,
  )['toLowerCase']();
  if (/heavy|severe|large|大面积|严重|高度/iu['test'](_0x3e3d35)) return 'heavy';
  if (/partial|partly|medium|局部|部分|遮挡/iu['test'](_0x3e3d35)) return 'partial';
  return 'none';
}
function normalizeBoundingBox(_0x379241, _0x13abc4 = {}) {
  if (!_0x379241) return null;
  let _0x5f3d84, _0x194f1b, _0x4d25e7, _0x128173;
  if (Array['isArray'](_0x379241)) [_0x5f3d84, _0x194f1b, _0x4d25e7, _0x128173] = _0x379241;
  else {
    if (typeof _0x379241 === 'object') {
      ((_0x5f3d84 = firstDefined(_0x379241['x'], _0x379241['left'], _0x379241['xmin'], _0x379241['xMin'])),
        (_0x194f1b = firstDefined(_0x379241['y'], _0x379241['top'], _0x379241['ymin'], _0x379241['yMin'])),
        (_0x4d25e7 = firstDefined(_0x379241['width'], _0x379241['w'])),
        (_0x128173 = firstDefined(_0x379241['height'], _0x379241['h'])));
      const _0x1b5e6a = firstDefined(_0x379241['right'], _0x379241['xmax'], _0x379241['xMax']),
        _0x580df7 = firstDefined(_0x379241['bottom'], _0x379241['ymax'], _0x379241['yMax']);
      if (_0x4d25e7 === undefined && _0x1b5e6a !== undefined)
        _0x4d25e7 = Number(_0x1b5e6a) - Number(_0x5f3d84);
      if (_0x128173 === undefined && _0x580df7 !== undefined)
        _0x128173 = Number(_0x580df7) - Number(_0x194f1b);
    }
  }
  const _0x266bc9 = [_0x5f3d84, _0x194f1b, _0x4d25e7, _0x128173]['map'](Number);
  if (_0x266bc9['some']((_0x26805e) => !Number['isFinite'](_0x26805e))) return null;
  let [_0x2efabb, _0x2007b0, _0x250c85, _0x457235] = _0x266bc9;
  const _0x453a6a = Number(
      firstDefined(_0x13abc4['width'], _0x13abc4['frameWidth'], _0x13abc4['imageWidth']),
    ),
    _0x53276b = Number(firstDefined(_0x13abc4['height'], _0x13abc4['frameHeight'], _0x13abc4['imageHeight']));
  if (_0x453a6a > 0x0 && _0x53276b > 0x0 && _0x266bc9['some']((_0x662cba) => _0x662cba > 0x1))
    ((_0x2efabb /= _0x453a6a), (_0x250c85 /= _0x453a6a), (_0x2007b0 /= _0x53276b), (_0x457235 /= _0x53276b));
  else
    _0x266bc9['every']((_0x9c90a0) => _0x9c90a0 >= 0x0 && _0x9c90a0 <= 0x64) &&
      _0x266bc9['some']((_0x114254) => _0x114254 > 0x1) &&
      ((_0x2efabb /= 0x64), (_0x2007b0 /= 0x64), (_0x250c85 /= 0x64), (_0x457235 /= 0x64));
  return {
    x: Math['max'](0x0, Math['min'](0x1, _0x2efabb)),
    y: Math['max'](0x0, Math['min'](0x1, _0x2007b0)),
    width: Math['max'](0x0, Math['min'](0x1 - Math['max'](0x0, _0x2efabb), _0x250c85)),
    height: Math['max'](0x0, Math['min'](0x1 - Math['max'](0x0, _0x2007b0), _0x457235)),
  };
}
function inferHorizontal(_0x22b9a1) {
  if (!_0x22b9a1) return 'unknown';
  const _0x3fdb02 = _0x22b9a1['x'] + _0x22b9a1['width'] / 0x2;
  if (_0x3fdb02 < 0.4) return 'left';
  if (_0x3fdb02 > 0.6) return 'right';
  return 'center';
}
function normalizeAnalysisStatus(_0x5066b0, _0x27f86f = 'pending') {
  const _0x372736 = normalizeText(_0x5066b0)['toLowerCase']();
  return ['pending', 'running', 'succeeded', 'failed', 'needs_review']['includes'](_0x372736)
    ? _0x372736
    : _0x27f86f;
}
function normalizeGenerationStatus(_0x472174) {
  const _0x11bc46 = normalizeText(_0x472174)['toLowerCase']();
  return ['pending', 'queued', 'submitting', 'running', 'succeeded', 'failed', 'cancelled', 'needs_review'][
    'includes'
  ](_0x11bc46)
    ? _0x11bc46
    : 'pending';
}
function normalizeMaterializationStatus(_0x3a41e1, _0x4f518d = ![]) {
  const _0x46057a = normalizeText(_0x3a41e1)['toLowerCase']();
  if (['pending', 'running', 'succeeded', 'failed']['includes'](_0x46057a)) return _0x46057a;
  return _0x4f518d ? 'succeeded' : 'pending';
}
export function normalizePersonReplacementPerson(
  _0x58ca25 = {},
  { shotId: shotId = 'shot-1', index: index = 0x0, frame: frame = {} } = {},
) {
  const _0x21ae0a = normalizeBoundingBox(
      firstDefined(
        _0x58ca25['bbox'],
        _0x58ca25['box'],
        _0x58ca25['boundingBox'],
        _0x58ca25['bounding_box'],
        _0x58ca25['region'],
        _0x58ca25['locator']?.['bbox'],
      ),
      frame,
    ),
    _0x228af0 = normalizeHorizontal(
      firstDefined(
        _0x58ca25['horizontal'],
        _0x58ca25['side'],
        _0x58ca25['position'],
        _0x58ca25['location'],
        _0x58ca25['locator']?.['horizontal'],
      ),
    ),
    _0x2e013 = normalizeText(
      firstDefined(
        _0x58ca25['sourceCharacterId'],
        _0x58ca25['source_character_id'],
        _0x58ca25['identityId'],
        _0x58ca25['identity_id'],
        _0x58ca25['clusterId'],
        _0x58ca25['cluster_id'],
        _0x58ca25['trackId'],
        _0x58ca25['track_id'],
      ),
    );
  return {
    id:
      normalizeText(firstDefined(_0x58ca25['id'], _0x58ca25['personId'], _0x58ca25['person_id'])) ||
      shotId + '-person-' + (index + 0x1),
    ...(Number['isSafeInteger'](_0x58ca25['promptMarkerIndex']) && _0x58ca25['promptMarkerIndex'] >= 0x0
      ? { promptMarkerIndex: _0x58ca25['promptMarkerIndex'] }
      : {}),
    sourceCharacterId: _0x2e013,
    targetCharacterId: normalizeText(
      firstDefined(_0x58ca25['targetCharacterId'], _0x58ca25['target_character_id']),
    ),
    targetAppearanceId: normalizeText(
      firstDefined(_0x58ca25['targetAppearanceId'], _0x58ca25['target_appearance_id']),
    ),
    ...(_0x58ca25['projectMappingDisabled'] === !![] || _0x58ca25['project_mapping_disabled'] === !![]
      ? { projectMappingDisabled: !![] }
      : {}),
    replacementScope: normalizePersonReplacementScope(
      firstDefined(_0x58ca25['replacementScope'], _0x58ca25['replacement_scope']),
    ),
    detectionClass:
      normalizeText(
        firstDefined(_0x58ca25['detectionClass'], _0x58ca25['detection_class'], _0x58ca25['className']),
      ) || 'person',
    detectionMethod: ['automatic', 'manual']['includes'](
      normalizeText(firstDefined(_0x58ca25['detectionMethod'], _0x58ca25['detection_method'])),
    )
      ? normalizeText(firstDefined(_0x58ca25['detectionMethod'], _0x58ca25['detection_method']))
      : 'automatic',
    label: normalizeText(firstDefined(_0x58ca25['label'], _0x58ca25['personLabel'], _0x58ca25['name'])),
    genderHint: normalizeText(
      firstDefined(
        _0x58ca25['genderHint'],
        _0x58ca25['gender'],
        _0x58ca25['perceivedGender'],
        _0x58ca25['sex'],
      ),
    ),
    locator: {
      horizontal: _0x228af0 === 'unknown' ? inferHorizontal(_0x21ae0a) : _0x228af0,
      depth: normalizeDepth(
        firstDefined(
          _0x58ca25['depth'],
          _0x58ca25['layer'],
          _0x58ca25['position'],
          _0x58ca25['location'],
          _0x58ca25['locator']?.['depth'],
        ),
      ),
      bbox: _0x21ae0a,
    },
    orientation: normalizePersonReplacementOrientation(
      firstDefined(
        _0x58ca25['orientation'],
        _0x58ca25['facing'],
        _0x58ca25['direction'],
        _0x58ca25['pose']?.['orientation'],
      ),
    ),
    orientationModelId: normalizeText(
      firstDefined(_0x58ca25['orientationModelId'], _0x58ca25['orientation_model_id']),
    ),
    identityConfidence: normalizeConfidence(
      firstDefined(
        _0x58ca25['identityConfidence'],
        _0x58ca25['identity_confidence'],
        _0x58ca25['characterConfidence'],
        _0x58ca25['character_confidence'],
      ),
    ),
    detectionConfidence: normalizeConfidence(
      firstDefined(
        _0x58ca25['detectionConfidence'],
        _0x58ca25['detection_confidence'],
        _0x58ca25['detectorConfidence'],
        _0x58ca25['detector_confidence'],
      ),
    ),
    identityMatchSimilarity: normalizeConfidence(
      firstDefined(
        _0x58ca25['identityMatchSimilarity'],
        _0x58ca25['matchSimilarity'],
        _0x58ca25['match_similarity'],
      ),
    ),
    identityReviewStatus: IDENTITY_REVIEW_STATUSES['has'](normalizeText(_0x58ca25['identityReviewStatus']))
      ? normalizeText(_0x58ca25['identityReviewStatus'])
      : firstDefined(_0x58ca25['reviewRequired'], _0x58ca25['needsReview'], ![])
        ? 'needs_review'
        : 'auto',
    identityMethod: IDENTITY_METHODS['has'](normalizeText(_0x58ca25['identityMethod']))
      ? normalizeText(_0x58ca25['identityMethod'])
      : _0x2e013
        ? 'fallback'
        : 'unassigned',
    identityReviewRequired: Boolean(
      firstDefined(
        _0x58ca25['identityReviewRequired'],
        _0x58ca25['reviewRequired'],
        _0x58ca25['needsReview'],
        ![],
      ),
    ),
    ambiguousIdentityIds: toArray(
      firstDefined(_0x58ca25['ambiguousIdentityIds'], _0x58ca25['ambiguous_identity_ids'], []),
    )
      ['map'](normalizeText)
      ['filter'](Boolean),
    orientationConfidence: normalizeConfidence(
      firstDefined(
        _0x58ca25['orientationConfidence'],
        _0x58ca25['orientation_confidence'],
        _0x58ca25['facingConfidence'],
        _0x58ca25['facing_confidence'],
      ),
    ),
    occlusion: normalizeOcclusion(
      firstDefined(_0x58ca25['occlusion'], _0x58ca25['occluded'], _0x58ca25['visibility']),
    ),
    notes: normalizeText(firstDefined(_0x58ca25['notes'], _0x58ca25['note'], _0x58ca25['description'])),
  };
}
function extractPeople(_0x181ea3) {
  return firstDefined(
    _0x181ea3['people'],
    _0x181ea3['persons'],
    _0x181ea3['characters'],
    _0x181ea3['subjects'],
    _0x181ea3['detections']?.['people'],
    _0x181ea3['detection']?.['people'],
    _0x181ea3['人物'],
    [],
  );
}
export function resolvePersonReplacementImageResultRef(_0x599116 = {}) {
  if (typeof _0x599116 === 'string') {
    const _0xff57f3 = normalizeText(_0x599116);
    return normalizeLocalPath(_0xff57f3) ? _0xff57f3 : '';
  }
  if (!_0x599116 || typeof _0x599116 !== 'object' || Array['isArray'](_0x599116)) return '';
  return (
    [
      _0x599116['originalLocalPath'],
      _0x599116['localPath'],
      _0x599116['sourceUrl'],
      _0x599116['imageUrl'],
      _0x599116['url'],
      _0x599116['resultUrl'],
      _0x599116['localUrl'],
      _0x599116['src'],
      _0x599116['displayLocalPath'],
      _0x599116['displayUrl'],
      _0x599116['ref'],
    ]
      ['map'](normalizeText)
      ['find']((_0xa936d1) => normalizeLocalPath(_0xa936d1)) || ''
  );
}
function normalizePersonReplacementImageResult(_0x29f95f = {}) {
  if (typeof _0x29f95f === 'string') {
    const _0x32fe09 = resolvePersonReplacementImageResultRef(_0x29f95f);
    return _0x32fe09 ? { imageUrl: _0x32fe09 } : null;
  }
  if (!_0x29f95f || typeof _0x29f95f !== 'object' || Array['isArray'](_0x29f95f)) return null;
  const _0x4113aa = resolvePersonReplacementImageResultRef(_0x29f95f);
  if (!_0x4113aa) return null;
  return {
    ..._0x29f95f,
    ...(_0x29f95f['originalLocalPath'] !== undefined
      ? { originalLocalPath: resolvePersonReplacementImageResultRef(_0x29f95f['originalLocalPath']) }
      : {}),
    ...(_0x29f95f['displayLocalPath'] !== undefined
      ? { displayLocalPath: resolvePersonReplacementImageResultRef(_0x29f95f['displayLocalPath']) }
      : {}),
    ...(_0x29f95f['localPath'] !== undefined
      ? { localPath: resolvePersonReplacementImageResultRef(_0x29f95f['localPath']) }
      : {}),
    ...(_0x29f95f['imageUrl'] !== undefined
      ? { imageUrl: resolvePersonReplacementImageResultRef(_0x29f95f['imageUrl']) }
      : {}),
    ...(_0x29f95f['src'] !== undefined
      ? { src: resolvePersonReplacementImageResultRef(_0x29f95f['src']) }
      : {}),
    ...(_0x29f95f['resultUrl'] !== undefined
      ? { resultUrl: resolvePersonReplacementImageResultRef(_0x29f95f['resultUrl']) }
      : {}),
    ...(_0x29f95f['localUrl'] !== undefined
      ? { localUrl: resolvePersonReplacementImageResultRef(_0x29f95f['localUrl']) }
      : {}),
    ...(_0x29f95f['sourceUrl'] !== undefined
      ? { sourceUrl: resolvePersonReplacementImageResultRef(_0x29f95f['sourceUrl']) }
      : {}),
    ...(_0x29f95f['url'] !== undefined
      ? { url: resolvePersonReplacementImageResultRef(_0x29f95f['url']) }
      : {}),
    ...(_0x29f95f['displayUrl'] !== undefined
      ? { displayUrl: resolvePersonReplacementImageResultRef(_0x29f95f['displayUrl']) }
      : {}),
    ...(_0x29f95f['ref'] !== undefined
      ? { ref: resolvePersonReplacementImageResultRef(_0x29f95f['ref']) }
      : {}),
    ...(_0x29f95f['remoteFallbackUrl'] !== undefined ? { remoteFallbackUrl: '' } : {}),
    ...(_0x29f95f['localSaveError'] !== undefined ? { localSaveError: '' } : {}),
    ...(_0x29f95f['prompt'] !== undefined ? { prompt: normalizeText(_0x29f95f['prompt']) } : {}),
    ...(_0x29f95f['userPrompt'] !== undefined ? { userPrompt: normalizeText(_0x29f95f['userPrompt']) } : {}),
    ...(_0x29f95f['modelId'] !== undefined ? { modelId: normalizeText(_0x29f95f['modelId']) } : {}),
    ...(_0x29f95f['provider'] !== undefined ? { provider: normalizeText(_0x29f95f['provider']) } : {}),
    ...(_0x29f95f['createdAt'] !== undefined ? { createdAt: normalizeText(_0x29f95f['createdAt']) } : {}),
  };
}
export function getPersonReplacementImageResults(_0x142496 = {}) {
  const _0x329c0e = _0x142496?.['replacementImage'],
    _0x4be969 =
      _0x329c0e && typeof _0x329c0e === 'object' && !Array['isArray'](_0x329c0e) ? _0x329c0e['results'] : [];
  return Array['isArray'](_0x4be969)
    ? _0x4be969['map'](normalizePersonReplacementImageResult)['filter'](Boolean)
    : [];
}
export function getPersonReplacementActiveImageResultIndex(
  _0x4490a2 = {},
  _0x10560c = getPersonReplacementImageResults(_0x4490a2),
) {
  if (!_0x10560c['length']) return 0x0;
  const _0x1dbd20 = Math['trunc'](Number(_0x4490a2?.['replacementImage']?.['activeIndex']) || 0x0);
  return Math['max'](0x0, Math['min'](_0x10560c['length'] - 0x1, _0x1dbd20));
}
export function getPersonReplacementActiveImageResult(
  _0x2a2e86 = {},
  _0x2633e6 = getPersonReplacementImageResults(_0x2a2e86),
) {
  return _0x2633e6[getPersonReplacementActiveImageResultIndex(_0x2a2e86, _0x2633e6)] || null;
}
export function resolvePersonReplacementImageSourceRef(_0x24ea1a = {}) {
  return (
    normalizeText(_0x24ea1a?.['imageIterationReferenceRef']) || normalizeText(_0x24ea1a?.['keyframeRef'])
  );
}
function normalizePersonReplacementImage(_0x345f17 = {}) {
  const _0x32ce3e =
      _0x345f17['replacementImage'] &&
      typeof _0x345f17['replacementImage'] === 'object' &&
      !Array['isArray'](_0x345f17['replacementImage'])
        ? _0x345f17['replacementImage']
        : {},
    _0xcb7d70 = getPersonReplacementImageResults({ replacementImage: _0x32ce3e }),
    _0x3c3639 = resolvePersonReplacementImageResultRef(
      normalizeText(
        firstDefined(
          _0x345f17['replacementImageRef'],
          _0x345f17['generatedKeyframeRef'],
          _0x345f17['replacedFrameRef'],
        ),
      ),
    );
  _0x3c3639 && !_0xcb7d70['length'] && _0xcb7d70['push']({ imageUrl: _0x3c3639 });
  const _0x7f0697 = Number(_0x32ce3e['activeIndex']),
    _0x43a2e7 = _0x3c3639
      ? _0xcb7d70['findIndex']((_0x1194e2) => resolvePersonReplacementImageResultRef(_0x1194e2) === _0x3c3639)
      : -0x1,
    _0x98128a = _0xcb7d70['length']
      ? Number['isFinite'](_0x7f0697)
        ? Math['max'](0x0, Math['min'](_0xcb7d70['length'] - 0x1, Math['trunc'](_0x7f0697)))
        : Math['max'](0x0, _0x43a2e7)
      : 0x0;
  return { results: _0xcb7d70, activeIndex: _0x98128a };
}
export function resolvePersonReplacementVideoResultRef(_0x205793 = {}) {
  if (typeof _0x205793 === 'string') {
    const _0x291fa2 = normalizeText(_0x205793);
    return normalizeLocalPath(_0x291fa2) ? _0x291fa2 : '';
  }
  if (!_0x205793 || typeof _0x205793 !== 'object' || Array['isArray'](_0x205793)) return '';
  return (
    [
      _0x205793['displayLocalPath'],
      _0x205793['localPath'],
      _0x205793['videoUrl'],
      _0x205793['url'],
      _0x205793['displayUrl'],
      _0x205793['ref'],
    ]
      ['map'](normalizeText)
      ['find']((_0x428c13) => normalizeLocalPath(_0x428c13)) || ''
  );
}
function normalizePersonReplacementVideoResult(_0xd9b6de = {}) {
  if (typeof _0xd9b6de === 'string') {
    const _0x389562 = resolvePersonReplacementVideoResultRef(_0xd9b6de);
    return _0x389562 ? { videoUrl: _0x389562 } : null;
  }
  if (!_0xd9b6de || typeof _0xd9b6de !== 'object' || Array['isArray'](_0xd9b6de)) return null;
  const _0x1df67a = resolvePersonReplacementVideoResultRef(_0xd9b6de);
  if (!_0x1df67a) return null;
  return {
    ..._0xd9b6de,
    ...(_0xd9b6de['displayLocalPath'] !== undefined
      ? { displayLocalPath: resolvePersonReplacementVideoResultRef(_0xd9b6de['displayLocalPath']) }
      : {}),
    ...(_0xd9b6de['localPath'] !== undefined
      ? { localPath: resolvePersonReplacementVideoResultRef(_0xd9b6de['localPath']) }
      : {}),
    ...(_0xd9b6de['videoUrl'] !== undefined
      ? { videoUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['videoUrl']) }
      : {}),
    ...(_0xd9b6de['src'] !== undefined
      ? { src: resolvePersonReplacementVideoResultRef(_0xd9b6de['src']) }
      : {}),
    ...(_0xd9b6de['resultUrl'] !== undefined
      ? { resultUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['resultUrl']) }
      : {}),
    ...(_0xd9b6de['localUrl'] !== undefined
      ? { localUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['localUrl']) }
      : {}),
    ...(_0xd9b6de['sourceUrl'] !== undefined
      ? { sourceUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['sourceUrl']) }
      : {}),
    ...(_0xd9b6de['url'] !== undefined
      ? { url: resolvePersonReplacementVideoResultRef(_0xd9b6de['url']) }
      : {}),
    ...(_0xd9b6de['displayUrl'] !== undefined
      ? { displayUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['displayUrl']) }
      : {}),
    ...(_0xd9b6de['ref'] !== undefined
      ? { ref: resolvePersonReplacementVideoResultRef(_0xd9b6de['ref']) }
      : {}),
    ...(_0xd9b6de['remoteFallbackUrl'] !== undefined ? { remoteFallbackUrl: '' } : {}),
    ...(_0xd9b6de['localSaveError'] !== undefined ? { localSaveError: '' } : {}),
    ...(_0xd9b6de['thumbUrl'] !== undefined
      ? { thumbUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['thumbUrl']) }
      : {}),
    ...(_0xd9b6de['posterUrl'] !== undefined
      ? { posterUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['posterUrl']) }
      : {}),
    ...(_0xd9b6de['previewUrl'] !== undefined
      ? { previewUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['previewUrl']) }
      : {}),
    ...(_0xd9b6de['thumbnailUrl'] !== undefined
      ? { thumbnailUrl: resolvePersonReplacementVideoResultRef(_0xd9b6de['thumbnailUrl']) }
      : {}),
    ...(_0xd9b6de['prompt'] !== undefined ? { prompt: normalizeText(_0xd9b6de['prompt']) } : {}),
    ...(_0xd9b6de['modelId'] !== undefined ? { modelId: normalizeText(_0xd9b6de['modelId']) } : {}),
    ...(_0xd9b6de['provider'] !== undefined ? { provider: normalizeText(_0xd9b6de['provider']) } : {}),
    ...(_0xd9b6de['createdAt'] !== undefined ? { createdAt: normalizeText(_0xd9b6de['createdAt']) } : {}),
  };
}
export function getPersonReplacementVideoResults(_0x144897 = {}) {
  const _0x537203 = _0x144897?.['replacementVideo'],
    _0x14a2a8 =
      _0x537203 && typeof _0x537203 === 'object' && !Array['isArray'](_0x537203) ? _0x537203['results'] : [];
  return Array['isArray'](_0x14a2a8)
    ? _0x14a2a8['map'](normalizePersonReplacementVideoResult)['filter'](Boolean)
    : [];
}
export function getPersonReplacementActiveVideoResultIndex(
  _0x58d667 = {},
  _0x7b40b4 = getPersonReplacementVideoResults(_0x58d667),
) {
  if (!_0x7b40b4['length']) return 0x0;
  const _0x1c58d7 = Math['trunc'](Number(_0x58d667?.['replacementVideo']?.['activeIndex']) || 0x0);
  return Math['max'](0x0, Math['min'](_0x7b40b4['length'] - 0x1, _0x1c58d7));
}
export function getPersonReplacementActiveVideoResult(
  _0x338d19 = {},
  _0x36811f = getPersonReplacementVideoResults(_0x338d19),
) {
  return _0x36811f[getPersonReplacementActiveVideoResultIndex(_0x338d19, _0x36811f)] || null;
}
export function resolvePersonReplacementVideoSourceRef(_0x367c96 = {}) {
  const _0x536290 = normalizeText(_0x367c96?.['videoIterationReferenceRef']);
  return _0x536290
    ? normalizeText(_0x367c96?.['videoIterationInputRef']) || _0x536290
    : normalizeText(_0x367c96?.['videoRef']);
}
function normalizePersonReplacementVideo(_0x377b4c = {}) {
  const _0x257d13 =
      _0x377b4c['replacementVideo'] &&
      typeof _0x377b4c['replacementVideo'] === 'object' &&
      !Array['isArray'](_0x377b4c['replacementVideo'])
        ? _0x377b4c['replacementVideo']
        : {},
    _0x5273ed = getPersonReplacementVideoResults({ replacementVideo: _0x257d13 }),
    _0x55e370 = resolvePersonReplacementVideoResultRef(
      normalizeText(
        firstDefined(_0x377b4c['resultVideoRef'], _0x377b4c['outputVideoRef'], _0x377b4c['resultRef']),
      ),
    );
  _0x55e370 && !_0x5273ed['length'] && _0x5273ed['push']({ videoUrl: _0x55e370 });
  const _0x514847 = Number(_0x257d13['activeIndex']),
    _0x4b379a = _0x55e370
      ? _0x5273ed['findIndex']((_0x3f4309) => resolvePersonReplacementVideoResultRef(_0x3f4309) === _0x55e370)
      : -0x1,
    _0x5cfb53 = _0x5273ed['length']
      ? Number['isFinite'](_0x514847)
        ? Math['max'](0x0, Math['min'](_0x5273ed['length'] - 0x1, Math['trunc'](_0x514847)))
        : Math['max'](0x0, _0x4b379a)
      : 0x0;
  return { results: _0x5273ed, activeIndex: _0x5cfb53 };
}
export function normalizePersonReplacementShot(_0x2ab2cd = {}, _0x2772ad = 0x0) {
  const _0x16f6fb =
      normalizeText(
        firstDefined(
          _0x2ab2cd['id'],
          _0x2ab2cd['shotId'],
          _0x2ab2cd['shot_id'],
          _0x2ab2cd['segmentId'],
          _0x2ab2cd['clipId'],
        ),
      ) || 'shot-' + (_0x2772ad + 0x1),
    _0x31de8a = normalizeNonNegativeNumber(
      firstDefined(_0x2ab2cd['startTimeSec'], _0x2ab2cd['start_time'], _0x2ab2cd['start'], _0x2ab2cd['in']),
    ),
    _0x232fa8 = Number(
      firstDefined(_0x2ab2cd['endTimeSec'], _0x2ab2cd['end_time'], _0x2ab2cd['end'], _0x2ab2cd['out']),
    ),
    _0x5e7495 = normalizeNonNegativeNumber(
      firstDefined(_0x2ab2cd['durationSec'], _0x2ab2cd['duration'], _0x2ab2cd['length']),
    ),
    _0x57ef71 = Number['isFinite'](_0x232fa8) && _0x232fa8 >= _0x31de8a ? _0x232fa8 : _0x31de8a + _0x5e7495,
    _0x111afa = firstDefined(_0x2ab2cd['frame'], _0x2ab2cd['frameSize'], _0x2ab2cd['imageSize'], {}),
    _0xa624e7 = assignPersonReplacementPromptIndexes(
      toArray(extractPeople(_0x2ab2cd))['map']((_0x1226dc, _0x30b5c6) =>
        normalizePersonReplacementPerson(_0x1226dc, {
          shotId: _0x16f6fb,
          index: _0x30b5c6,
          frame: _0x111afa,
        }),
      ),
    )['map']((_0x2f8082) => ({
      ..._0x2f8082,
      label: _0x2f8082['label'] || formatPersonReplacementPersonLabel(_0x2f8082['promptMarkerIndex']),
    })),
    _0x379682 = normalizeText(
      firstDefined(_0x2ab2cd['videoRef'], _0x2ab2cd['clipRef'], _0x2ab2cd['segmentRef'], _0x2ab2cd['video']),
    ),
    _0x4badde = normalizeText(
      firstDefined(
        _0x2ab2cd['keyframeRef'],
        _0x2ab2cd['keyFrameRef'],
        _0x2ab2cd['firstFrameRef'],
        _0x2ab2cd['frameRef'],
        _0x2ab2cd['imageRef'],
      ),
    ),
    _0x497d5 = normalizeText(_0x2ab2cd['imageIterationOriginalKeyframeRef']),
    _0x52742f = normalizePersonReplacementImage(_0x2ab2cd),
    _0x4a92b1 = normalizeText(_0x2ab2cd['imageIterationReferenceRef']) || (_0x497d5 ? _0x4badde : ''),
    _0x1329fc = _0x52742f['results']['some'](
      (_0x207438) => resolvePersonReplacementImageResultRef(_0x207438) === _0x4a92b1,
    )
      ? _0x4a92b1
      : '',
    _0x482e6b = getPersonReplacementActiveImageResult({ replacementImage: _0x52742f }, _0x52742f['results']),
    _0x29aa9f = normalizeText(_0x2ab2cd['replacementVideoReferenceSourceShotId']),
    _0x28eaef = normalizeText(_0x2ab2cd['replacementVideoReferencePersonId']),
    _0x50e103 = resolvePersonReplacementImageResultRef(_0x2ab2cd['replacementVideoReferenceImageRef']),
    _0x174fb6 = normalizePersonReplacementVideo(_0x2ab2cd),
    _0x308ab7 = normalizeText(_0x2ab2cd['videoIterationReferenceRef']),
    _0x891271 = _0x174fb6['results']['some'](
      (_0x4e2466) => resolvePersonReplacementVideoResultRef(_0x4e2466) === _0x308ab7,
    )
      ? _0x308ab7
      : '',
    _0x45317e = getPersonReplacementActiveVideoResult({ replacementVideo: _0x174fb6 }, _0x174fb6['results']);
  return {
    id: _0x16f6fb,
    sourceId: normalizeText(firstDefined(_0x2ab2cd['sourceId'], _0x2ab2cd['source_id'])),
    index: Number['isInteger'](Number(_0x2ab2cd['index'])) ? Number(_0x2ab2cd['index']) : _0x2772ad,
    frame: {
      width: normalizeNonNegativeNumber(
        firstDefined(_0x111afa['width'], _0x111afa['frameWidth'], _0x111afa['imageWidth']),
      ),
      height: normalizeNonNegativeNumber(
        firstDefined(_0x111afa['height'], _0x111afa['frameHeight'], _0x111afa['imageHeight']),
      ),
    },
    startTimeSec: _0x31de8a,
    endTimeSec: _0x57ef71,
    durationSec: Math['max'](0x0, _0x57ef71 - _0x31de8a),
    sourceVideoRef: normalizeText(
      firstDefined(_0x2ab2cd['sourceVideoRef'], _0x2ab2cd['sourceRef'], _0x2ab2cd['originalVideoRef']),
    ),
    videoRef: _0x379682,
    ...(_0x891271
      ? {
          videoIterationReferenceRef: _0x891271,
          ...(resolvePersonReplacementVideoResultRef(_0x2ab2cd['videoIterationInputRef'])
            ? {
                videoIterationInputRef: resolvePersonReplacementVideoResultRef(
                  _0x2ab2cd['videoIterationInputRef'],
                ),
                ...(_0x2ab2cd['videoIterationInputIsReversed'] === !![]
                  ? { videoIterationInputIsReversed: !![] }
                  : {}),
              }
            : {}),
        }
      : {}),
    ...(_0x2ab2cd['videoRefIsCropped'] === !![] ? { videoRefIsCropped: !![] } : {}),
    ...(_0x2ab2cd['isReversed'] === !![] ? { isReversed: !![] } : {}),
    materializedIsReversed:
      typeof _0x2ab2cd['materializedIsReversed'] === 'boolean'
        ? _0x2ab2cd['materializedIsReversed']
        : Boolean(_0x379682) && _0x2ab2cd['isReversed'] === !![],
    keyframeRef: _0x497d5 || _0x4badde,
    ...(_0x1329fc ? { imageIterationReferenceRef: _0x1329fc } : {}),
    keyframeIndex: Math['max'](
      0x0,
      Math['trunc'](
        normalizeNonNegativeNumber(firstDefined(_0x2ab2cd['keyframeIndex'], _0x2ab2cd['frameIndex'])),
      ),
    ),
    keyframeTimeSec: normalizeNonNegativeNumber(
      firstDefined(_0x2ab2cd['keyframeTimeSec'], _0x2ab2cd['frameTimeSec'], _0x31de8a),
    ),
    ...(_0x2ab2cd['keyframeManuallySelected'] === !![] ? { keyframeManuallySelected: !![] } : {}),
    outputFps: normalizeNonNegativeNumber(
      firstDefined(_0x2ab2cd['outputFps'], _0x2ab2cd['fps'], _0x2ab2cd['frameRate']),
    ),
    materializationStatus: normalizeMaterializationStatus(
      firstDefined(_0x2ab2cd['materializationStatus'], _0x2ab2cd['clipStatus']),
      Boolean(_0x379682),
    ),
    materializationProgress: Math['max'](
      0x0,
      Math['min'](0x64, normalizeNonNegativeNumber(_0x2ab2cd['materializationProgress'])),
    ),
    replacementImage: _0x52742f,
    replacementImageRef: resolvePersonReplacementImageResultRef(_0x482e6b),
    replacementVideoReferenceKind:
      normalizeText(_0x2ab2cd['replacementVideoReferenceKind']) ===
      PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE
        ? PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE
        : PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
    ...(_0x29aa9f ? { replacementVideoReferenceSourceShotId: _0x29aa9f } : {}),
    ...(_0x50e103 ? { replacementVideoReferenceImageRef: _0x50e103 } : {}),
    ...(_0x28eaef ? { replacementVideoReferencePersonId: _0x28eaef } : {}),
    people: _0xa624e7,
    analysisStatus: normalizeAnalysisStatus(
      firstDefined(_0x2ab2cd['analysisStatus'], _0x2ab2cd['analysis_status']),
      _0xa624e7['length'] ? 'succeeded' : 'pending',
    ),
    reviewRequired: Boolean(
      firstDefined(_0x2ab2cd['reviewRequired'], _0x2ab2cd['needsReview'], _0x2ab2cd['needs_review'], ![]),
    ),
    replacementPromptMode: normalizePersonReplacementPromptMode(_0x2ab2cd['replacementPromptMode']),
    ...(Array['isArray'](_0x2ab2cd['imagePromptReferences'])
      ? {
          imagePromptReferences: _0x2ab2cd['imagePromptReferences']
            ['filter']((_0x2efbae) => Number['isSafeInteger'](_0x2efbae?.['slot']) && _0x2efbae['slot'] > 0x0)
            ['map']((_0x59d721) => ({ slot: _0x59d721['slot'], key: normalizeText(_0x59d721['key']) })),
        }
      : {}),
    imagePrompt: normalizeText(
      firstDefined(
        _0x2ab2cd['imagePrompt'],
        _0x2ab2cd['replacementImagePrompt'],
        _0x2ab2cd['prompt'],
        _0x2ab2cd['replacementPrompt'],
      ),
    ),
    sceneReference: {
      sceneId: normalizeText(
        firstDefined(_0x2ab2cd['sceneReference']?.['sceneId'], _0x2ab2cd['sceneReferenceId']),
      ),
      appearanceId: normalizeText(
        firstDefined(_0x2ab2cd['sceneReference']?.['appearanceId'], _0x2ab2cd['sceneReferenceAppearanceId']),
      ),
    },
    videoPrompt: normalizeText(firstDefined(_0x2ab2cd['videoPrompt'], _0x2ab2cd['replacementVideoPrompt'])),
    replacementVideoInputsBySlot: Object['fromEntries'](
      Object['entries'](normalizePlainObject(_0x2ab2cd['replacementVideoInputsBySlot']))
        ['map'](([_0xd6dc89, _0x360b04]) => {
          const _0x4b0d34 =
              typeof _0x360b04 === 'string' ? { url: _0x360b04 } : normalizePlainObject(_0x360b04),
            _0x5f3d80 = normalizeText(_0xd6dc89),
            _0x1edc18 = normalizeText(
              firstDefined(
                _0x4b0d34['url'],
                _0x4b0d34['localUrl'],
                _0x4b0d34['imageUrl'],
                _0x4b0d34['videoUrl'],
                _0x4b0d34['localPath'],
              ),
            ),
            _0x4b3368 = normalizeText(_0x4b0d34['kind']);
          if (!_0x5f3d80 || !_0x1edc18 || !['image', 'video', 'audio']['includes'](_0x4b3368)) return null;
          return [
            _0x5f3d80,
            {
              kind: _0x4b3368,
              url: _0x1edc18,
              modelId: normalizeText(_0x4b0d34['modelId']),
              fileName: normalizeText(firstDefined(_0x4b0d34['fileName'], _0x4b0d34['name'])),
              mimeType: normalizeText(_0x4b0d34['mimeType']),
              thumbUrl: normalizeText(_0x4b0d34['thumbUrl']),
            },
          ];
        })
        ['filter'](Boolean),
    ),
    generationStatus: normalizeGenerationStatus(
      firstDefined(_0x2ab2cd['generationStatus'], _0x2ab2cd['generation_status'], _0x2ab2cd['status']),
    ),
    replacementVideo: _0x174fb6,
    resultVideoRef: resolvePersonReplacementVideoResultRef(_0x45317e),
    error: normalizeText(firstDefined(_0x2ab2cd['error'], _0x2ab2cd['errorMessage'])),
  };
}
function clearPersonReplacementVideoReferenceSelection(_0x1cc4a5 = {}) {
  const {
    replacementVideoReferenceSourceShotId: _0x346410,
    replacementVideoReferenceImageRef: _0x25661f,
    ..._0x11eff2
  } = _0x1cc4a5;
  return _0x11eff2;
}
function reconcilePersonReplacementVideoReferenceSelections(_0x313dea = []) {
  const _0x10ae40 = new Map(_0x313dea['map']((_0x8b3b9e) => [normalizeText(_0x8b3b9e?.['id']), _0x8b3b9e]));
  return _0x313dea['map']((_0x52c7a8) => {
    const _0x14266d = normalizeText(_0x52c7a8?.['replacementVideoReferenceSourceShotId']),
      _0x3d9306 = resolvePersonReplacementImageResultRef(_0x52c7a8?.['replacementVideoReferenceImageRef']);
    if (!_0x14266d && !_0x3d9306) return _0x52c7a8;
    const _0x5bc89e = _0x10ae40['get'](_0x14266d),
      _0xc30f37 = getPersonReplacementImageResults(_0x5bc89e);
    if (!_0x5bc89e || !_0xc30f37['length']) return clearPersonReplacementVideoReferenceSelection(_0x52c7a8);
    const _0x10c675 = _0x3d9306
        ? _0xc30f37['find']((_0x2d0ae8) => resolvePersonReplacementImageResultRef(_0x2d0ae8) === _0x3d9306)
        : null,
      _0x5e8b23 = resolvePersonReplacementImageResultRef(
        _0x10c675 || _0xc30f37[getPersonReplacementActiveImageResultIndex(_0x5bc89e, _0xc30f37)],
      );
    if (!_0x5e8b23) return clearPersonReplacementVideoReferenceSelection(_0x52c7a8);
    return {
      ..._0x52c7a8,
      replacementVideoReferenceSourceShotId: _0x14266d,
      replacementVideoReferenceImageRef: _0x5e8b23,
    };
  });
}
function normalizeVoiceReference(_0x35b010, _0x5979d0 = '') {
  const _0x4a72c5 = _0x35b010 && typeof _0x35b010 === 'object' ? _0x35b010 : {},
    _0x309e10 = normalizeText(_0x4a72c5['source']) || 'upload',
    _0x18402a = normalizeText(
      firstDefined(
        _0x4a72c5['audioUrl'],
        _0x4a72c5['localPath'],
        _0x4a72c5['url'],
        _0x5979d0,
        typeof _0x35b010 === 'string' ? _0x35b010 : '',
      ),
    );
  if (!_0x18402a) return null;
  return {
    audioUrl: normalizeText(firstDefined(_0x4a72c5['audioUrl'], _0x4a72c5['url'], _0x18402a)),
    localPath: normalizeText(firstDefined(_0x4a72c5['localPath'], _0x18402a)),
    fileName: normalizeText(firstDefined(_0x4a72c5['fileName'], _0x4a72c5['name'], '上传声音')),
    source: _0x309e10,
    ...(_0x309e10 === 'library'
      ? {
          libraryAssetId: normalizeText(_0x4a72c5['libraryAssetId']),
          sourceAssetId: normalizeText(_0x4a72c5['sourceAssetId']),
          sourceItemIndex: Math['max'](0x0, Math['trunc'](Number(_0x4a72c5['sourceItemIndex']) || 0x0)),
        }
      : {}),
    updatedAt: normalizeNonNegativeNumber(_0x4a72c5['updatedAt'], Date['now']()),
  };
}
function normalizeCharacterAppearances(_0x2f0a86 = {}) {
  const _0x2d0455 = Array['isArray'](_0x2f0a86['appearances'])
    ? _0x2f0a86['appearances']
    : normalizeImageRefs(
        firstDefined(
          _0x2f0a86['imageRefs'],
          _0x2f0a86['referenceImages'],
          _0x2f0a86['images'],
          _0x2f0a86['imageRef'],
        ),
      )['map']((_0x502874, _0x500b9e) => ({
        id: (normalizeText(_0x2f0a86['id']) || 'target-character') + '-appearance-' + (_0x500b9e + 0x1),
        name: _0x500b9e === 0x0 ? '基础形象' : '形象 ' + (_0x500b9e + 0x1),
        imageUrl: _0x502874,
      }));
  return _0x2d0455['map']((_0x55b541, _0x3b6121) => ({
    ...(_0x55b541 && typeof _0x55b541 === 'object' ? _0x55b541 : {}),
    id:
      normalizeText(_0x55b541?.['id']) ||
      (normalizeText(_0x2f0a86['id']) || 'target-character') + '-appearance-' + (_0x3b6121 + 0x1),
    name:
      normalizeText(_0x55b541?.['name']) || (_0x3b6121 === 0x0 ? '基础形象' : '形象 ' + (_0x3b6121 + 0x1)),
    imageUrl: normalizeText(
      firstDefined(
        _0x55b541?.['imageUrl'],
        _0x55b541?.['imageRef'],
        _0x55b541?.['url'],
        typeof _0x55b541 === 'string' ? _0x55b541 : '',
      ),
    ),
    prompt: normalizeText(firstDefined(_0x55b541?.['prompt'], _0x2f0a86['description'])),
    occurrences: normalizeText(_0x55b541?.['occurrences']) || '当前项目',
    generationStatus: normalizeGenerationStatus(_0x55b541?.['generationStatus']),
    error: normalizeText(_0x55b541?.['error']),
  }));
}
function normalizeTargetCharacter(_0x450891 = {}, _0x5c51f6 = 0x0) {
  const _0xda6098 =
      normalizeText(firstDefined(_0x450891['id'], _0x450891['ref'], _0x450891['characterId'])) ||
      'target-character-' + (_0x5c51f6 + 0x1),
    _0x20bf33 = normalizeCharacterAppearances({ ..._0x450891, id: _0xda6098 }),
    _0x4076fb = _0x20bf33['some'](
      (_0xc85970) => _0xc85970['id'] === normalizeText(_0x450891['baseAppearanceId']),
    )
      ? normalizeText(_0x450891['baseAppearanceId'])
      : _0x20bf33[0x0]?.['id'] || '',
    _0x1eb6a9 = normalizeVoiceReference(
      _0x450891['voiceReference'],
      firstDefined(_0x450891['voiceRef'], _0x450891['audioRef']),
    );
  return {
    ...normalizePlainObject(_0x450891),
    id: _0xda6098,
    kind: 'character',
    name:
      normalizeText(firstDefined(_0x450891['name'], _0x450891['label'], _0x450891['title'])) ||
      '目标角色' + (_0x5c51f6 + 0x1),
    role: normalizeText(_0x450891['role']) || '人物',
    appearances: _0x20bf33,
    baseAppearanceId: _0x4076fb,
    imageRefs: _0x20bf33['map']((_0x278fd5) => _0x278fd5['imageUrl'])['filter'](Boolean),
    voiceReference: _0x1eb6a9,
    voiceRef: normalizeText(firstDefined(_0x1eb6a9?.['localPath'], _0x1eb6a9?.['audioUrl'])),
    description: normalizeText(firstDefined(_0x450891['description'], _0x450891['prompt'])),
  };
}
function normalizeTargetScene(_0x40991c = {}, _0xfbc007 = 0x0) {
  const _0x4f0827 =
      normalizeText(firstDefined(_0x40991c['id'], _0x40991c['ref'], _0x40991c['sceneId'])) ||
      'target-scene-' + (_0xfbc007 + 0x1),
    _0x2521e7 = normalizeCharacterAppearances({ ..._0x40991c, id: _0x4f0827 }),
    _0x21149e = _0x2521e7['some'](
      (_0x141893) => _0x141893['id'] === normalizeText(_0x40991c['baseAppearanceId']),
    )
      ? normalizeText(_0x40991c['baseAppearanceId'])
      : _0x2521e7[0x0]?.['id'] || '';
  return {
    ...normalizePlainObject(_0x40991c),
    id: _0x4f0827,
    kind: 'scene',
    name:
      normalizeText(firstDefined(_0x40991c['name'], _0x40991c['label'], _0x40991c['title'])) ||
      '场景' + (_0xfbc007 + 0x1),
    role: normalizeText(_0x40991c['role']) || '场景',
    appearances: _0x2521e7,
    baseAppearanceId: _0x21149e,
    imageRefs: _0x2521e7['map']((_0x1c952b) => _0x1c952b['imageUrl'])['filter'](Boolean),
    description: normalizeText(firstDefined(_0x40991c['description'], _0x40991c['prompt'])),
  };
}
function normalizeProjectAudioAsset(_0x18cd0d = {}, _0x3df057 = 0x0) {
  const _0x1b7993 = normalizePlainObject(_0x18cd0d),
    _0x37467a = normalizeText(firstDefined(_0x18cd0d['sourceAssetId'], _0x18cd0d['assetId'])),
    _0x2284b5 = Math['max'](
      0x0,
      Math['trunc'](Number(firstDefined(_0x18cd0d['sourceItemIndex'], _0x18cd0d['itemIndex'], 0x0)) || 0x0),
    ),
    _0x51c304 = normalizeText(
      firstDefined(_0x18cd0d['audioUrl'], _0x18cd0d['sourceUrl'], _0x18cd0d['url'], _0x18cd0d['localPath']),
    ),
    _0x28b7d2 = normalizeText(_0x18cd0d['description']),
    _0xae3f3f = normalizeText(_0x28b7d2['match'](/^来自画布素材「(.+)」$/u)?.[0x1]),
    _0x57df97 = normalizeText(_0x18cd0d['savedName']) || _0xae3f3f,
    _0x3e8520 =
      _0x57df97 ||
      normalizeText(firstDefined(_0x18cd0d['name'], _0x18cd0d['assetName'], _0x18cd0d['fileName'])) ||
      '音频 ' + (_0x3df057 + 0x1);
  return {
    ..._0x1b7993,
    id:
      normalizeText(firstDefined(_0x18cd0d['id'], _0x18cd0d['audioAssetId'])) ||
      'project-audio-' + (_0x3df057 + 0x1),
    kind: 'audio',
    mediaKind: 'audio',
    name: _0x3e8520,
    ...(_0x57df97 ? { savedName: _0x57df97 } : {}),
    role: '音频素材',
    sourceOrigin: normalizeText(_0x18cd0d['sourceOrigin']) || (_0x37467a ? 'library' : 'project'),
    sourceAssetId: _0x37467a,
    sourceItemIndex: _0x2284b5,
    sourceUrl: _0x51c304,
    audioUrl: _0x51c304,
    assetName: normalizeText(_0x18cd0d['assetName']) || _0x3e8520,
    occurrences: normalizeText(_0x18cd0d['occurrences']) || '当前项目',
    description: _0x28b7d2,
    isLibraryAsset: ![],
  };
}
export function getPersonReplacementCharacterBaseImageRef(_0x3f4cd6 = {}) {
  const _0x10941e = normalizeCharacterAppearances(_0x3f4cd6),
    _0x34a559 = normalizeText(_0x3f4cd6['baseAppearanceId']),
    _0x303f13 = _0x10941e['find']((_0x443add) => _0x443add['id'] === _0x34a559) || _0x10941e[0x0];
  if (_0x303f13?.['imageUrl']) return _0x303f13['imageUrl'];
  return (
    normalizeImageRefs(
      firstDefined(
        _0x3f4cd6['imageRefs'],
        _0x3f4cd6['referenceImages'],
        _0x3f4cd6['images'],
        _0x3f4cd6['imageRef'],
      ),
    )[0x0] || ''
  );
}
export function getPersonReplacementShotCharacterReferences(_0x713749 = {}, _0x13c365 = {}) {
  const _0x511023 = Array['isArray'](_0x713749?.['characters']) ? _0x713749['characters'] : [],
    _0x458f9f = new Map(_0x511023['map']((_0x3a2543) => [normalizeText(_0x3a2543?.['id']), _0x3a2543])),
    _0x1a8ed2 = new Map(
      (Array['isArray'](_0x713749?.['mappings']) ? _0x713749['mappings'] : [])
        ['map']((_0x48be55) => [
          normalizeText(_0x48be55?.['sourceCharacterId']),
          normalizeText(_0x48be55?.['targetCharacterId']),
        ])
        ['filter'](([_0x33887c, _0x201dd6]) => _0x33887c && _0x201dd6),
    );
  return (Array['isArray'](_0x13c365?.['people']) ? _0x13c365['people'] : [])
    ['map']((_0x5026bd) => {
      const _0x42501f = normalizeText(_0x5026bd?.['targetCharacterId']),
        _0x2eb6fb =
          _0x42501f ||
          (_0x5026bd?.['projectMappingDisabled'] === !![]
            ? ''
            : _0x1a8ed2['get'](normalizeText(_0x5026bd?.['sourceCharacterId']))) ||
          '';
      if (!_0x2eb6fb) return null;
      const _0x40d0eb = _0x458f9f['get'](_0x2eb6fb);
      if (!_0x40d0eb) return null;
      const _0xb08f3e = normalizeCharacterAppearances(_0x40d0eb),
        _0x14f6bd = normalizeText(_0x5026bd?.['targetAppearanceId']),
        _0x3f1d2d =
          _0xb08f3e['find']((_0x570e0) => normalizeText(_0x570e0?.['id']) === _0x14f6bd) ||
          _0xb08f3e['find'](
            (_0x4e7931) => normalizeText(_0x4e7931?.['id']) === normalizeText(_0x40d0eb['baseAppearanceId']),
          ) ||
          _0xb08f3e[0x0] ||
          null;
      return {
        personId: normalizeText(_0x5026bd?.['id']),
        characterId: _0x2eb6fb,
        characterName: normalizeText(_0x40d0eb['name']) || '人物参考',
        appearanceId: normalizeText(_0x3f1d2d?.['id']),
        appearanceName: normalizeText(_0x3f1d2d?.['name']) || '基础形象',
        imageRef: normalizeText(
          _0x3f1d2d?.['imageUrl'] || getPersonReplacementCharacterBaseImageRef(_0x40d0eb),
        ),
      };
    })
    ['filter'](Boolean);
}
export function resolvePersonReplacementVideoImageInput(
  _0x3c73d0 = {},
  _0x4e0869 = {},
  _0x57cd8d = _0x3c73d0?.['settings']?.['replacementVideoInputMode'],
) {
  const _0x2b14ca = normalizePersonReplacementVideoInputMode(_0x57cd8d),
    _0x55b14a = normalizeText(_0x4e0869?.['id']),
    _0x3b283c = getPersonReplacementImageResults(_0x4e0869),
    _0x5c63bf = getPersonReplacementActiveImageResultIndex(_0x4e0869, _0x3b283c),
    _0x212d52 = resolvePersonReplacementImageResultRef(_0x3b283c[_0x5c63bf]),
    _0x2e3d6a = normalizeText(_0x4e0869?.['replacementImageRef'] || _0x212d52),
    _0x4d0956 = normalizeText(_0x4e0869?.['replacementVideoReferenceSourceShotId']),
    _0x3e1b53 = resolvePersonReplacementImageResultRef(_0x4e0869?.['replacementVideoReferenceImageRef']),
    _0x2832dd = toArray(_0x3c73d0?.['shots']),
    _0x260d98 = _0x2832dd['some']((_0x4ca872) => normalizeText(_0x4ca872?.['id']) === _0x55b14a)
      ? _0x2832dd
      : [..._0x2832dd, _0x4e0869],
    _0x34214a = _0x260d98['map']((_0x31c963, _0x9f50f4) => {
      const _0x58d82a = normalizeText(_0x31c963?.['id']),
        _0x14b6ac = getPersonReplacementImageResults(_0x31c963),
        _0x27e3c2 = normalizeText(_0x31c963?.['replacementImageRef']),
        _0x70b494 = _0x14b6ac['length'] ? _0x14b6ac : _0x27e3c2 ? [{ imageUrl: _0x27e3c2 }] : [];
      if (!_0x70b494['length']) return null;
      const _0x521bff =
          _0x58d82a && _0x58d82a === _0x4d0956 && _0x3e1b53
            ? _0x70b494['findIndex'](
                (_0x18bb31) => resolvePersonReplacementImageResultRef(_0x18bb31) === _0x3e1b53,
              )
            : -0x1,
        _0x30e97f =
          _0x521bff >= 0x0 ? _0x521bff : getPersonReplacementActiveImageResultIndex(_0x31c963, _0x70b494),
        _0x5993f2 = _0x14b6ac['length']
          ? resolvePersonReplacementImageResultRef(_0x70b494[_0x30e97f])
          : _0x27e3c2;
      return _0x5993f2
        ? {
            kind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
            imageRef: _0x5993f2,
            sourceShotId: _0x58d82a,
            sourceShotIndex: _0x9f50f4,
            resultIndex: _0x30e97f,
            resultCount: _0x70b494['length'],
          }
        : null;
    })['filter'](Boolean),
    _0x5dfc07 =
      _0x4d0956 && _0x3e1b53
        ? _0x34214a['find'](
            (_0x12b58c) => _0x12b58c['sourceShotId'] === _0x4d0956 && _0x12b58c['imageRef'] === _0x3e1b53,
          ) || null
        : null,
    _0x5daeb9 =
      _0x34214a['find'](
        (_0x5add0a) => _0x5add0a['sourceShotId'] === _0x55b14a && _0x5add0a['imageRef'] === _0x2e3d6a,
      ) || null,
    _0x73d1e5 = _0x5dfc07 || _0x5daeb9;
  if (_0x2b14ca === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE) {
    const _0x1e0cdd = getPersonReplacementShotCharacterReferences(_0x3c73d0, _0x4e0869),
      _0xfa3d60 = _0x1e0cdd['filter']((_0x500cca) => normalizeText(_0x500cca?.['imageRef']))['map'](
        (_0x4788e3) => ({
          kind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
          imageRef: _0x4788e3['imageRef'],
          reference: _0x4788e3,
        }),
      ),
      _0x3bf0ce = [..._0x34214a, ..._0xfa3d60],
      _0x186682 = normalizeText(_0x4e0869?.['replacementVideoReferenceKind']),
      _0x47fbcd = normalizeText(_0x4e0869?.['replacementVideoReferencePersonId']),
      _0x229a89 = _0x47fbcd
        ? _0xfa3d60['find'](
            (_0x41b530) => normalizeText(_0x41b530['reference']?.['personId']) === _0x47fbcd,
          ) || null
        : null,
      _0x469d4d = Boolean(
        _0x186682 === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE && _0x47fbcd && !_0x229a89,
      ),
      _0xa6a13d = _0x229a89 || (!_0x47fbcd ? _0xfa3d60[0x0] : null) || null,
      _0x1ef0c5 = _0x469d4d
        ? null
        : (_0x186682 === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE ? _0xa6a13d : _0x73d1e5) ||
          _0x73d1e5 ||
          _0xa6a13d ||
          null,
      _0x404d43 = _0x3bf0ce['indexOf'](_0x1ef0c5),
      _0x3bb853 = _0x1ef0c5?.['imageRef'] || '',
      _0x3a15a8 = _0x1ef0c5?.['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
      _0x4466b7 = _0x469d4d ? null : _0xa6a13d?.['reference'] || _0x1e0cdd[0x0] || null;
    return {
      mode: _0x2b14ca,
      status: _0x3bb853 ? 'ready' : 'missing',
      imageRef: _0x3bb853,
      selectedImageRef: _0x3bb853,
      referenceKind:
        _0x1ef0c5?.['kind'] || (_0x469d4d ? PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE : ''),
      referenceOptions: _0x3bf0ce,
      activeReferenceIndex: _0x404d43,
      reference: _0x4466b7,
      references: _0x1e0cdd,
      message: _0x469d4d
        ? '原选中的人物参考图已失效，请重新选择'
        : _0x3a15a8
          ? (_0x4466b7?.['characterName'] || '人物参考') +
            '\x20·\x20' +
            (_0x4466b7?.['appearanceName'] || '基础形象')
          : _0x3bb853
            ? '替换首帧'
            : _0x1e0cdd['length']
              ? '当前人物缺少可用参考图'
              : '未绑定人物参考图',
    };
  }
  const _0x17ea8c = _0x34214a,
    _0xb0afbc = _0x73d1e5,
    _0x1fbbca = _0xb0afbc?.['imageRef'] || '',
    _0x1eb325 = _0x17ea8c['indexOf'](_0xb0afbc);
  return {
    mode: _0x2b14ca,
    status: _0x1fbbca ? 'ready' : 'missing',
    imageRef: _0x1fbbca,
    selectedImageRef: _0x1fbbca,
    referenceKind: _0xb0afbc?.['kind'] || PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
    referenceOptions: _0x17ea8c,
    activeReferenceIndex: _0x1eb325,
    references: [],
    message: _0x1fbbca ? '替换首帧' : '缺少替换首帧',
  };
}
function normalizeSource(_0x57b883 = {}, _0x2e19f2 = 0x0) {
  const _0x34d2f4 = normalizeText(firstDefined(_0x57b883['videoRef'], _0x57b883['ref'], _0x57b883['url']));
  return {
    id: normalizeText(_0x57b883['id']) || 'source-' + (_0x2e19f2 + 0x1),
    assetId: normalizeText(_0x57b883['assetId']),
    videoRef: _0x34d2f4,
    playbackVideoRef: normalizeText(
      firstDefined(_0x57b883['playbackVideoRef'], _0x57b883['displayLocalPath'], _0x57b883['displayUrl']),
    ),
    thumbnailRef: normalizeText(
      firstDefined(
        _0x57b883['thumbnailRef'],
        _0x57b883['posterLocalPath'],
        _0x57b883['thumbLocalPath'],
        _0x57b883['posterUrl'],
        _0x57b883['thumbUrl'],
      ),
    ),
    fileName: normalizeText(firstDefined(_0x57b883['fileName'], _0x57b883['name'])),
    durationSec: normalizeNonNegativeNumber(_0x57b883['durationSec']),
    processingStatus:
      normalizeText(firstDefined(_0x57b883['processingStatus'], _0x57b883['analysisStatus'])) || 'idle',
    processingProgress: Math['max'](
      0x0,
      Math['min'](
        0x64,
        normalizeNonNegativeNumber(
          firstDefined(_0x57b883['processingProgress'], _0x57b883['analysisProgress']),
        ),
      ),
    ),
    order: Number['isInteger'](Number(_0x57b883['order'])) ? Number(_0x57b883['order']) : _0x2e19f2,
    error: normalizeText(_0x57b883['error']),
  };
}
function normalizeSourceCharacter(_0x3d6ce0 = {}, _0x512f2d = 0x0) {
  return {
    id:
      normalizeText(firstDefined(_0x3d6ce0['id'], _0x3d6ce0['ref'], _0x3d6ce0['sourceCharacterId'])) ||
      'source-character-' + (_0x512f2d + 0x1),
    name:
      normalizeText(firstDefined(_0x3d6ce0['name'], _0x3d6ce0['label'], _0x3d6ce0['title'])) ||
      '原人物' + (_0x512f2d + 0x1),
    imageRefs: normalizeImageRefs(
      firstDefined(_0x3d6ce0['imageRefs'], _0x3d6ce0['keyframeRefs'], _0x3d6ce0['images']),
    ),
    confidence: normalizeConfidence(firstDefined(_0x3d6ce0['confidence'], _0x3d6ce0['identityConfidence'])),
    reviewRequired: Boolean(firstDefined(_0x3d6ce0['reviewRequired'], _0x3d6ce0['needsReview'], ![])),
    identityReviewStatus: IDENTITY_REVIEW_STATUSES['has'](normalizeText(_0x3d6ce0['identityReviewStatus']))
      ? normalizeText(_0x3d6ce0['identityReviewStatus'])
      : firstDefined(_0x3d6ce0['reviewRequired'], _0x3d6ce0['needsReview'], ![])
        ? 'needs_review'
        : 'auto',
    memberCount: Math['max'](0x0, Math['trunc'](normalizeNonNegativeNumber(_0x3d6ce0['memberCount']))),
    exemplarShotId: normalizeText(_0x3d6ce0['exemplarShotId']),
    exemplarPersonId: normalizeText(_0x3d6ce0['exemplarPersonId']),
    ambiguousIdentityIds: toArray(_0x3d6ce0['ambiguousIdentityIds'])['map'](normalizeText)['filter'](Boolean),
    notes: normalizeText(firstDefined(_0x3d6ce0['notes'], _0x3d6ce0['description'])),
  };
}
function normalizeMappings(_0xf0a54b) {
  const _0x1e3265 = Array['isArray'](_0xf0a54b)
      ? _0xf0a54b
      : _0xf0a54b && typeof _0xf0a54b === 'object'
        ? Object['entries'](_0xf0a54b)['map'](([_0x78448c, _0x19326e]) => ({
            sourceCharacterId: _0x78448c,
            targetCharacterId: _0x19326e,
          }))
        : [],
    _0x1ee488 = new Map();
  return (
    _0x1e3265['forEach']((_0x2097b1) => {
      const _0x3dc48c = normalizeText(
          firstDefined(
            _0x2097b1?.['sourceCharacterId'],
            _0x2097b1?.['source_character_id'],
            _0x2097b1?.['source'],
          ),
        ),
        _0x52476d = normalizeText(
          firstDefined(
            _0x2097b1?.['targetCharacterId'],
            _0x2097b1?.['target_character_id'],
            _0x2097b1?.['target'],
          ),
        );
      if (!_0x3dc48c || !_0x52476d) return;
      _0x1ee488['set'](_0x3dc48c, { sourceCharacterId: _0x3dc48c, targetCharacterId: _0x52476d });
    }),
    [..._0x1ee488['values']()]
  );
}
function normalizeAudio(_0x3ad7fe = {}) {
  return {
    strategy: 'full_replace',
    originalAudioRef: normalizeText(_0x3ad7fe['originalAudioRef']),
    replacementAudioRef: normalizeText(_0x3ad7fe['replacementAudioRef']),
    previewTrack: AUDIO_TRACKS['has'](_0x3ad7fe['previewTrack']) ? _0x3ad7fe['previewTrack'] : 'replacement',
    exportTrack: AUDIO_TRACKS['has'](_0x3ad7fe['exportTrack']) ? _0x3ad7fe['exportTrack'] : 'replacement',
    composeStatus: normalizeGenerationStatus(_0x3ad7fe['composeStatus']),
    selectedSourceId: normalizeText(_0x3ad7fe['selectedSourceId']),
    voiceStudioState: normalizePlainObject(_0x3ad7fe['voiceStudioState']),
    voiceSeparationsBySourceId: normalizePersonReplacementVoiceSeparationsBySourceId(
      _0x3ad7fe['voiceSeparationsBySourceId'],
    ),
  };
}
export function normalizePersonReplacementProject(_0x5a6362 = {}) {
  const _0x481f15 = normalizeText(_0x5a6362['status']),
    _0x2a0222 = toArray(firstDefined(_0x5a6362['characters'], _0x5a6362['targetCharacters'], []))['map'](
      normalizeTargetCharacter,
    ),
    _0xc52957 = normalizeSource({
      ...(_0x5a6362['source'] || {}),
      videoRef: firstDefined(
        _0x5a6362['source']?.['videoRef'],
        _0x5a6362['videoRef'],
        _0x5a6362['sourceVideoRef'],
      ),
      fileName: firstDefined(
        _0x5a6362['source']?.['fileName'],
        _0x5a6362['source']?.['name'],
        _0x5a6362['fileName'],
      ),
      durationSec: firstDefined(_0x5a6362['source']?.['durationSec'], _0x5a6362['durationSec']),
    }),
    _0x458dbb = (
      Array['isArray'](_0x5a6362['sources']) && _0x5a6362['sources']['length']
        ? _0x5a6362['sources']
        : _0xc52957['videoRef'] || _0xc52957['fileName']
          ? [_0xc52957]
          : []
    )
      ['map'](normalizeSource)
      ['sort']((_0x5dcfe7, _0x1346b2) => _0x5dcfe7['order'] - _0x1346b2['order']),
    _0x246378 = _0x458dbb[0x0] || _0xc52957,
    _0x3bfbd3 =
      normalizeText(_0x5a6362['settings']?.['replacementImageModelId']) ||
      PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    _0x59aa57 = resolveModelProvider(
      _0x3bfbd3,
      normalizeText(_0x5a6362['settings']?.['replacementImageProvider']),
    ),
    _0x309d8b = buildModelProviderProfileSelectionPatch(
      {
        model: _0x3bfbd3,
        providerProfileId: _0x5a6362['settings']?.['replacementImageProviderProfileId'],
        providerProfileIdByModel: _0x5a6362['settings']?.['replacementImageProviderProfileIdByModel'],
      },
      _0x3bfbd3,
      _0x5a6362['settings']?.['replacementImageProviderProfileId'],
    ),
    _0x246bf6 =
      normalizeText(_0x5a6362['settings']?.['characterImageModelId']) ||
      PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    _0x4d520f = buildModelProviderProfileSelectionPatch(
      {
        model: _0x246bf6,
        providerProfileId: _0x5a6362['settings']?.['characterImageProviderProfileId'],
        providerProfileIdByModel: _0x5a6362['settings']?.['characterImageProviderProfileIdByModel'],
      },
      _0x246bf6,
      _0x5a6362['settings']?.['characterImageProviderProfileId'],
    ),
    _0x218fb9 = normalizeText(_0x5a6362['settings']?.['replacementModelId']),
    _0x3303e1 = resolvePersonReplacementVideoModelId(_0x218fb9),
    _0x5197fa = Boolean(_0x218fb9 && _0x218fb9 !== _0x3303e1),
    _0x213aa1 = normalizePersonReplacementVideoInputMode(
      _0x5a6362['settings']?.['replacementVideoInputMode'],
    ),
    _0x190cb6 = resolvePersonReplacementVideoParameterPolicy({
      modelId: _0x3303e1,
      inputMode: _0x213aa1,
      generationParams: _0x5197fa
        ? {}
        : normalizePlainObject(_0x5a6362['settings']?.['replacementVideoGenerationParams']),
    }),
    _0x5d262c = buildModelProviderProfileSelectionPatch(
      {
        model: _0x3303e1,
        providerProfileId: _0x5a6362['settings']?.['replacementVideoProviderProfileId'],
        providerProfileIdByModel: _0x5a6362['settings']?.['replacementVideoProviderProfileIdByModel'],
      },
      _0x3303e1,
      _0x5a6362['settings']?.['replacementVideoProviderProfileId'],
    ),
    _0x449c7b = reconcilePersonReplacementVideoReferenceSelections(
      toArray(_0x5a6362['shots'])['map'](normalizePersonReplacementShot),
    );
  return {
    schemaVersion: PERSON_REPLACEMENT_SCHEMA_VERSION,
    id: normalizeText(_0x5a6362['id']),
    title: normalizeText(_0x5a6362['title']) || '未命名人物替换项目',
    status: STATUS_INDEX['has'](_0x481f15) ? _0x481f15 : 'draft',
    source: _0x246378,
    sources: _0x458dbb,
    settings: {
      replacementModelId: _0x3303e1,
      replacementVideoInputMode: _0x213aa1,
      replacementImageModelId: _0x3bfbd3,
      replacementImageProvider: _0x59aa57,
      replacementImageProviderProfileId: _0x309d8b['providerProfileId'],
      replacementImageProviderProfileIdByModel: _0x309d8b['providerProfileIdByModel'],
      replacementVideoProviderProfileId: _0x5d262c['providerProfileId'],
      replacementVideoProviderProfileIdByModel: _0x5d262c['providerProfileIdByModel'],
      characterImageModelId: _0x246bf6,
      characterImageProvider: normalizeText(_0x5a6362['settings']?.['characterImageProvider']) || 'apimart',
      characterImageProviderProfileId: _0x4d520f['providerProfileId'],
      characterImageProviderProfileIdByModel: _0x4d520f['providerProfileIdByModel'],
      characterImageGenerationParams: normalizePlainObject(
        _0x5a6362['settings']?.['characterImageGenerationParams'],
      ),
      characterImageGenerationParamsByModel: normalizeParamsByModel(
        _0x5a6362['settings']?.['characterImageGenerationParamsByModel'],
      ),
      replacementImageGenerationParams: normalizePlainObject(
        _0x5a6362['settings']?.['replacementImageGenerationParams'],
      ),
      replacementImageGenerationParamsByModel: normalizeParamsByModel(
        _0x5a6362['settings']?.['replacementImageGenerationParamsByModel'],
      ),
      replacementPromptEnhancementEnabled:
        _0x5a6362['settings']?.['replacementPromptEnhancementEnabled'] === !![],
      replacementVideoGenerationParams: _0x190cb6['generationParams'],
      smartClipMode: normalizeSmartClipMode(
        firstDefined(_0x5a6362['settings']?.['smartClipMode'], 'balanced'),
      ),
      smartClipFps: normalizeSmartClipFps(_0x5a6362['settings']?.['smartClipFps']),
      processingMode: _0x5a6362['settings']?.['processingMode'] === 'skip' ? 'skip' : 'cut',
      automationMode: _0x5a6362['settings']?.['automationMode'] === 'auto' ? 'auto' : 'review',
      confidenceThreshold: normalizeConfidence(
        firstDefined(_0x5a6362['settings']?.['confidenceThreshold'], 0.75),
      ),
      identityAutoThreshold: normalizeConfidence(
        firstDefined(_0x5a6362['settings']?.['identityAutoThreshold'], 0.78),
      ),
      identityReviewThreshold: normalizeConfidence(
        firstDefined(_0x5a6362['settings']?.['identityReviewThreshold'], 0.68),
      ),
      identityAmbiguityMargin: normalizeConfidence(
        firstDefined(_0x5a6362['settings']?.['identityAmbiguityMargin'], 0.06),
      ),
    },
    characters: _0x2a0222,
    scenes: toArray(_0x5a6362['scenes'])['map'](normalizeTargetScene),
    audioAssets: toArray(_0x5a6362['audioAssets'])
      ['map'](normalizeProjectAudioAsset)
      ['filter']((_0x414ea0) => _0x414ea0['audioUrl']),
    sourceCharacters: toArray(_0x5a6362['sourceCharacters'])['map'](normalizeSourceCharacter),
    mappings: normalizeMappings(_0x5a6362['mappings']),
    shots: _0x449c7b,
    audio: normalizeAudio(_0x5a6362['audio']),
    output: {
      originalMasterRef: normalizeText(_0x5a6362['output']?.['originalMasterRef']),
      visualMasterRef: normalizeText(_0x5a6362['output']?.['visualMasterRef']),
      finalVideoRef: normalizeText(_0x5a6362['output']?.['finalVideoRef']),
      finalAudioTrack: AUDIO_TRACKS['has'](_0x5a6362['output']?.['finalAudioTrack'])
        ? _0x5a6362['output']['finalAudioTrack']
        : '',
      composeStatus: normalizeGenerationStatus(_0x5a6362['output']?.['composeStatus']),
      composedShotIds: toArray(_0x5a6362['output']?.['composedShotIds'])
        ['map'](normalizeText)
        ['filter'](Boolean),
      canvasBinding: normalizePlainObject(_0x5a6362['output']?.['canvasBinding']),
    },
    archivedAt: normalizeNonNegativeNumber(_0x5a6362['archivedAt']),
    createdAt: normalizeText(_0x5a6362['createdAt']),
    updatedAt: normalizeText(_0x5a6362['updatedAt']),
  };
}
export function createPersonReplacementProject(_0x3e49b1 = {}) {
  return normalizePersonReplacementProject(_0x3e49b1);
}
export function canTransitionPersonReplacementProject(_0x475724, _0x42340f) {
  const _0x3c4b4b = STATUS_INDEX['get'](normalizeText(_0x475724)),
    _0x147911 = STATUS_INDEX['get'](normalizeText(_0x42340f));
  if (_0x3c4b4b === undefined || _0x147911 === undefined) return ![];
  return _0x147911 === _0x3c4b4b || _0x147911 === _0x3c4b4b + 0x1;
}
export function transitionPersonReplacementProject(_0x310a4c, _0x3d7dd1) {
  const _0x186646 = normalizePersonReplacementProject(_0x310a4c);
  if (!canTransitionPersonReplacementProject(_0x186646['status'], _0x3d7dd1))
    throw new Error(
      '[personReplacementProject] invalid status transition: ' +
        _0x186646['status'] +
        ' -> ' +
        normalizeText(_0x3d7dd1),
    );
  return { ..._0x186646, status: normalizeText(_0x3d7dd1) };
}
export function setPersonReplacementCharacterMapping(
  _0x2d1856,
  { sourceCharacterId: _0x5729c9, targetCharacterId: _0x157898 } = {},
) {
  const _0x474ae8 = normalizePersonReplacementProject(_0x2d1856),
    _0x2b8a26 = normalizeText(_0x5729c9),
    _0x2fb0e3 = normalizeText(_0x157898);
  if (!_0x2b8a26) throw new Error('[personReplacementProject] sourceCharacterId is required');
  const _0x383e0f = _0x474ae8['mappings']['filter'](
    (_0x1c2133) => _0x1c2133['sourceCharacterId'] !== _0x2b8a26,
  );
  if (_0x2fb0e3) _0x383e0f['push']({ sourceCharacterId: _0x2b8a26, targetCharacterId: _0x2fb0e3 });
  return { ..._0x474ae8, mappings: _0x383e0f };
}
export function resolvePersonReplacementTargetCharacterId(_0x541a59, _0x1bd01e) {
  const _0x36361e = normalizePersonReplacementProject(_0x541a59),
    _0x1ad678 = _0x1bd01e && typeof _0x1bd01e === 'object' ? _0x1bd01e : null,
    _0x5abee5 = normalizeText(_0x1ad678?.['targetCharacterId']);
  if (_0x5abee5) return _0x5abee5;
  if (_0x1ad678?.['projectMappingDisabled'] === !![]) return '';
  const _0x15c9bd = normalizeText(_0x1ad678 ? _0x1ad678['sourceCharacterId'] : _0x1bd01e);
  return (
    _0x36361e['mappings']['find']((_0x55a5ff) => _0x55a5ff['sourceCharacterId'] === _0x15c9bd)?.[
      'targetCharacterId'
    ] || ''
  );
}
export function getPersonReplacementCrossRoleSourceCharacterIds(_0x5c66ba = {}) {
  const _0x40f156 = new Map();
  return (
    toArray(_0x5c66ba?.['shots'])['forEach']((_0x48f4cb) => {
      toArray(_0x48f4cb?.['people'])['forEach']((_0xec854c) => {
        const _0x52377c = normalizeText(_0xec854c?.['sourceCharacterId']),
          _0x32d394 = normalizeText(_0xec854c?.['label']);
        if (!_0x52377c || !_0x32d394) return;
        const _0x1b6ccd = _0x40f156['get'](_0x52377c) || new Set();
        (_0x1b6ccd['add'](_0x32d394), _0x40f156['set'](_0x52377c, _0x1b6ccd));
      });
    }),
    new Set(
      [..._0x40f156['entries']()]
        ['filter'](([, _0x179aff]) => _0x179aff['size'] > 0x1)
        ['map'](([_0xceb2e]) => _0xceb2e),
    )
  );
}
export function getPersonReplacementBindingOccurrences(
  _0x44a098,
  { shotId: shotId = '', personId: personId = '' } = {},
) {
  const _0x44f2ef = normalizeText(shotId),
    _0x400ae1 = normalizeText(personId),
    _0x6618f0 = toArray(_0x44a098?.['shots']),
    _0x2cfd15 = _0x6618f0['find']((_0x4c0011) => normalizeText(_0x4c0011?.['id']) === _0x44f2ef),
    _0x5677da = toArray(_0x2cfd15?.['people'])['find'](
      (_0x94e772) => normalizeText(_0x94e772?.['id']) === _0x400ae1,
    );
  if (!_0x5677da) return [];
  const _0x15b98c = normalizeText(_0x5677da['sourceCharacterId']),
    _0x17782c = normalizeText(_0x5677da['label']);
  return _0x6618f0['flatMap']((_0x5c2a39) =>
    toArray(_0x5c2a39?.['people'])['flatMap']((_0x3b97ca) => {
      const _0x3ff7b5 = normalizeText(_0x5c2a39?.['id']),
        _0x2c5ee4 = normalizeText(_0x3b97ca?.['id']),
        _0x1c23e6 = _0x3ff7b5 === _0x44f2ef && _0x2c5ee4 === _0x400ae1,
        _0x1f1a70 = _0x17782c
          ? normalizeText(_0x3b97ca?.['label']) === _0x17782c
          : Boolean(_0x15b98c && normalizeText(_0x3b97ca?.['sourceCharacterId']) === _0x15b98c);
      if (!_0x1c23e6 && !_0x1f1a70) return [];
      return [
        {
          shotId: _0x3ff7b5,
          personId: _0x2c5ee4,
          sourceCharacterId: normalizeText(_0x3b97ca?.['sourceCharacterId']),
        },
      ];
    }),
  );
}
function collectSourceIdentityOccurrences(_0x5d1315, _0x15cf37) {
  const _0x34535c = normalizeText(_0x15cf37);
  return toArray(_0x5d1315?.['shots'])['flatMap']((_0x23d421) =>
    toArray(_0x23d421?.['people'])
      ['filter']((_0x5bc12f) => normalizeText(_0x5bc12f?.['sourceCharacterId']) === _0x34535c)
      ['map']((_0x594d7a) => ({ shot: _0x23d421, person: _0x594d7a })),
  );
}
export function mergePersonReplacementSourceCharacters(
  _0x3ed110,
  { sourceCharacterIds: sourceCharacterIds = [], keepSourceCharacterId: keepSourceCharacterId = '' } = {},
) {
  const _0x1ef65c = [...new Set(toArray(sourceCharacterIds)['map'](normalizeText)['filter'](Boolean))];
  if (_0x1ef65c['length'] < 0x2) throw new Error('合并人物至少需要选择两个身份');
  const _0x3c22b7 = new Set(_0x1ef65c),
    _0x41c4b7 = _0x3c22b7['has'](normalizeText(keepSourceCharacterId))
      ? normalizeText(keepSourceCharacterId)
      : _0x1ef65c[0x0];
  for (const _0x576176 of toArray(_0x3ed110?.['shots'])) {
    const _0x364896 = toArray(_0x576176?.['people'])['filter']((_0x4f7714) =>
      _0x3c22b7['has'](normalizeText(_0x4f7714?.['sourceCharacterId'])),
    );
    if (_0x364896['length'] > 0x1) throw new Error('同一镜头中同时出现的人物不能合并为同一身份');
  }
  const _0x3312b8 = new Set();
  (toArray(_0x3ed110?.['mappings'])['forEach']((_0x30dec1) => {
    _0x3c22b7['has'](normalizeText(_0x30dec1?.['sourceCharacterId'])) &&
      _0x30dec1?.['targetCharacterId'] &&
      _0x3312b8['add'](normalizeText(_0x30dec1['targetCharacterId']));
  }),
    toArray(_0x3ed110?.['shots'])['forEach']((_0x41be5e) =>
      toArray(_0x41be5e?.['people'])['forEach']((_0x59c56b) => {
        _0x3c22b7['has'](normalizeText(_0x59c56b?.['sourceCharacterId'])) &&
          _0x59c56b?.['targetCharacterId'] &&
          _0x3312b8['add'](normalizeText(_0x59c56b['targetCharacterId']));
      }),
    ));
  if (_0x3312b8['size'] > 0x1) throw new Error('所选人物已经映射到不同目标人物，请先统一映射后再合并');
  const _0x52a36a = [..._0x3312b8][0x0] || '',
    _0x1c355c = toArray(_0x3ed110?.['sourceCharacters']),
    _0x73fc53 = _0x1c355c['filter']((_0x51e06f) => _0x3c22b7['has'](_0x51e06f['id'])),
    _0x217a22 = _0x73fc53['find']((_0xdfceda) => _0xdfceda['id'] === _0x41c4b7) ||
      _0x73fc53[0x0] || { id: _0x41c4b7, name: '原人物' },
    _0x4706e0 = {
      ..._0x217a22,
      id: _0x41c4b7,
      imageRefs: [...new Set(_0x73fc53['flatMap']((_0x145f14) => toArray(_0x145f14['imageRefs'])))],
      confidence: _0x73fc53['length']
        ? Math['min'](..._0x73fc53['map']((_0x4e3e3b) => normalizeConfidence(_0x4e3e3b['confidence'])))
        : 0x0,
      reviewRequired: ![],
      identityReviewStatus: 'confirmed',
      memberCount: _0x73fc53['reduce'](
        (_0x5e27cc, _0x125cdf) => _0x5e27cc + Math['max'](0x0, Number(_0x125cdf['memberCount']) || 0x0),
        0x0,
      ),
      ambiguousIdentityIds: [
        ...new Set(_0x73fc53['flatMap']((_0x5e1695) => toArray(_0x5e1695['ambiguousIdentityIds']))),
      ]['filter']((_0x32c1d5) => !_0x3c22b7['has'](_0x32c1d5)),
      notes: '人工合并人物身份',
    },
    _0x17aec6 = toArray(_0x3ed110?.['mappings'])['filter'](
      (_0xf16b47) => !_0x3c22b7['has'](normalizeText(_0xf16b47?.['sourceCharacterId'])),
    );
  if (_0x52a36a) _0x17aec6['push']({ sourceCharacterId: _0x41c4b7, targetCharacterId: _0x52a36a });
  return {
    ..._0x3ed110,
    shots: toArray(_0x3ed110?.['shots'])['map']((_0x425881) => ({
      ..._0x425881,
      people: toArray(_0x425881?.['people'])['map']((_0x4656a2) =>
        _0x3c22b7['has'](normalizeText(_0x4656a2?.['sourceCharacterId']))
          ? {
              ..._0x4656a2,
              sourceCharacterId: _0x41c4b7,
              label: _0x217a22['name'] || _0x4656a2['label'],
              targetCharacterId: _0x52a36a || _0x4656a2['targetCharacterId'] || '',
              identityReviewStatus: 'confirmed',
              identityReviewRequired: ![],
              identityMethod: 'manual',
              ambiguousIdentityIds: toArray(_0x4656a2['ambiguousIdentityIds'])['filter'](
                (_0x3a3374) => !_0x3c22b7['has'](_0x3a3374),
              ),
            }
          : _0x4656a2,
      ),
    })),
    sourceCharacters: [..._0x1c355c['filter']((_0x1b0060) => !_0x3c22b7['has'](_0x1b0060['id'])), _0x4706e0],
    mappings: _0x17aec6,
  };
}
export function splitPersonReplacementSourceCharacter(
  _0x48e039,
  {
    sourceCharacterId: _0x1e0b00,
    occurrences: occurrences = [],
    newSourceCharacterId: newSourceCharacterId = '',
  } = {},
) {
  const _0x12cdf7 = normalizeText(_0x1e0b00);
  if (!_0x12cdf7) throw new Error('拆分人物缺少原身份');
  const _0x2f35be = new Set(
    toArray(occurrences)
      ['map'](
        (_0x4bf57e) => normalizeText(_0x4bf57e?.['shotId']) + ':' + normalizeText(_0x4bf57e?.['personId']),
      )
      ['filter']((_0x1f3610) => _0x1f3610 !== ':'),
  );
  if (!_0x2f35be['size']) throw new Error('请先选择要拆分的人物框');
  const _0x44c084 = collectSourceIdentityOccurrences(_0x48e039, _0x12cdf7),
    _0x2caa53 = _0x44c084['filter'](({ shot: _0x324691, person: _0x4e7332 }) =>
      _0x2f35be['has'](_0x324691['id'] + ':' + _0x4e7332['id']),
    );
  if (!_0x2caa53['length']) throw new Error('没有找到要拆分的人物框');
  if (_0x2caa53['length'] >= _0x44c084['length'] && _0x44c084['length'] > 0x1)
    throw new Error('不能把该身份的全部人物框拆分出去');
  if (_0x44c084['length'] === 0x1) {
    const _0xda662c = _0x2caa53[0x0]['person'],
      _0x17d72d = normalizeText(_0xda662c['label']) || formatPersonReplacementPersonLabel(0x0);
    return {
      ..._0x48e039,
      shots: toArray(_0x48e039?.['shots'])['map']((_0x53ab3b) => ({
        ..._0x53ab3b,
        people: toArray(_0x53ab3b?.['people'])['map']((_0x2cedad) =>
          normalizeText(_0x2cedad?.['sourceCharacterId']) === _0x12cdf7
            ? {
                ..._0x2cedad,
                label: _0x17d72d,
                identityReviewStatus: 'needs_review',
                identityReviewRequired: !![],
                identityMethod: 'manual',
                ambiguousIdentityIds: [],
              }
            : _0x2cedad,
        ),
      })),
      sourceCharacters: toArray(_0x48e039?.['sourceCharacters'])['map']((_0x2a7a39) =>
        _0x2a7a39['id'] === _0x12cdf7
          ? {
              ..._0x2a7a39,
              name: _0x17d72d,
              reviewRequired: !![],
              identityReviewStatus: 'needs_review',
              ambiguousIdentityIds: [],
              notes: '人工纠正人物身份',
            }
          : _0x2a7a39,
      ),
    };
  }
  const _0x1b47a4 = new Set(toArray(_0x48e039?.['sourceCharacters'])['map']((_0x3e91e2) => _0x3e91e2['id']));
  let _0x461921 = normalizeText(newSourceCharacterId) || _0x12cdf7 + '-split-' + (_0x1b47a4['size'] + 0x1),
    _0x1553a9 = 0x2;
  while (_0x1b47a4['has'](_0x461921)) {
    ((_0x461921 = _0x12cdf7 + '-split-' + (_0x1b47a4['size'] + _0x1553a9)), (_0x1553a9 += 0x1));
  }
  const _0x1141d4 = toArray(_0x48e039?.['sourceCharacters'])['find'](
      (_0x3023ba) => _0x3023ba['id'] === _0x12cdf7,
    ) || { id: _0x12cdf7, name: '原人物' },
    _0x1fe6ea = [
      ...new Set(_0x2caa53['map'](({ shot: _0x18ef6d }) => _0x18ef6d['keyframeRef'])['filter'](Boolean)),
    ],
    _0x131c6a =
      normalizeText(_0x2caa53[0x0]['person']['label']) ||
      normalizeText(_0x1141d4['name']) ||
      formatPersonReplacementPersonLabel(0x0);
  return {
    ..._0x48e039,
    shots: toArray(_0x48e039?.['shots'])['map']((_0x35ad59) => ({
      ..._0x35ad59,
      people: toArray(_0x35ad59?.['people'])['map']((_0x51c7d9) =>
        normalizeText(_0x51c7d9?.['sourceCharacterId']) === _0x12cdf7 &&
        _0x2f35be['has'](_0x35ad59['id'] + ':' + _0x51c7d9['id'])
          ? {
              ..._0x51c7d9,
              sourceCharacterId: _0x461921,
              label: _0x131c6a,
              targetCharacterId: '',
              targetAppearanceId: '',
              identityReviewStatus: 'needs_review',
              identityReviewRequired: !![],
              identityMethod: 'manual',
              ambiguousIdentityIds: [],
            }
          : _0x51c7d9,
      ),
    })),
    sourceCharacters: [
      ...toArray(_0x48e039?.['sourceCharacters'])['map']((_0x2bc7c0) =>
        _0x2bc7c0['id'] === _0x12cdf7
          ? {
              ..._0x2bc7c0,
              memberCount: Math['max'](
                0x0,
                (Number(_0x2bc7c0['memberCount']) || _0x44c084['length']) - _0x2caa53['length'],
              ),
            }
          : _0x2bc7c0,
      ),
      {
        id: _0x461921,
        name: _0x131c6a,
        imageRefs: _0x1fe6ea,
        confidence: Math['min'](
          ..._0x2caa53['map'](({ person: _0x1ecdbe }) =>
            normalizeConfidence(_0x1ecdbe['identityConfidence']),
          ),
        ),
        reviewRequired: !![],
        identityReviewStatus: 'needs_review',
        memberCount: _0x2caa53['length'],
        exemplarShotId: _0x2caa53[0x0]['shot']['id'],
        exemplarPersonId: _0x2caa53[0x0]['person']['id'],
        ambiguousIdentityIds: [],
        notes: '人工拆分人物身份',
      },
    ],
    mappings: toArray(_0x48e039?.['mappings'])['filter'](
      (_0x5ae8b4) => normalizeText(_0x5ae8b4?.['sourceCharacterId']) !== _0x461921,
    ),
  };
}
export function confirmPersonReplacementSourceCharacter(
  _0x44b463,
  {
    sourceCharacterId: _0x2d04ce,
    targetSourceCharacterId: targetSourceCharacterId = '',
    shotId: shotId = '',
    personId: personId = '',
    label: label = '',
    orientation: orientation = '',
  } = {},
) {
  const _0x51392a = normalizeText(_0x2d04ce);
  if (!_0x51392a) throw new Error('确认人物缺少身份');
  const _0x35fdb4 = normalizeText(targetSourceCharacterId) || _0x51392a,
    _0x16e8c1 = normalizeText(shotId),
    _0x32f495 = normalizeText(personId),
    _0x20cfa3 = normalizeText(label),
    _0x20dce4 = normalizePersonReplacementOrientation(orientation),
    _0x5cd1b2 = _0x35fdb4 !== _0x51392a;
  if (_0x5cd1b2 && (!_0x16e8c1 || !_0x32f495)) throw new Error('切换人物身份时必须指定当前人物框');
  const _0x7f4e70 = toArray(_0x44b463?.['sourceCharacters']),
    _0x35ab15 =
      _0x7f4e70['some']((_0x129a71) => normalizeText(_0x129a71?.['id']) === _0x35fdb4) ||
      toArray(_0x44b463?.['shots'])['some']((_0x450888) =>
        toArray(_0x450888?.['people'])['some'](
          (_0x19efb2) => normalizeText(_0x19efb2?.['sourceCharacterId']) === _0x35fdb4,
        ),
      );
  if (_0x5cd1b2 && !_0x35ab15) throw new Error('选择的人物身份不存在');
  const _0x9fd966 = toArray(_0x44b463?.['shots'])['find'](
      (_0x5d0ef4) => normalizeText(_0x5d0ef4?.['id']) === _0x16e8c1,
    ),
    _0xcd9b1e = toArray(_0x9fd966?.['people'])['find'](
      (_0x4ae610) => normalizeText(_0x4ae610?.['id']) === _0x32f495,
    );
  if (_0x5cd1b2 && (!_0xcd9b1e || normalizeText(_0xcd9b1e['sourceCharacterId']) !== _0x51392a))
    throw new Error('没有找到要切换身份的人物框');
  const _0x126044 =
      _0x5cd1b2 &&
      toArray(_0x9fd966?.['people'])['some'](
        (_0xf339fb) =>
          normalizeText(_0xf339fb?.['id']) !== _0x32f495 &&
          normalizeText(_0xf339fb?.['sourceCharacterId']) === _0x35fdb4,
      ),
    _0x2437a4 = toArray(_0x44b463?.['mappings'])['find'](
      (_0x5d376c) => normalizeText(_0x5d376c?.['sourceCharacterId']) === _0x35fdb4,
    ),
    _0x5940da = toArray(_0x44b463?.['shots'])
      ['flatMap']((_0x57b6ea) => toArray(_0x57b6ea?.['people']))
      ['find'](
        (_0x20abe9) =>
          normalizeText(_0x20abe9?.['sourceCharacterId']) === _0x35fdb4 &&
          normalizeText(_0x20abe9?.['targetCharacterId']),
      ),
    _0x5dcba2 =
      normalizeText(_0x2437a4?.['targetCharacterId']) || normalizeText(_0x5940da?.['targetCharacterId']),
    _0x16c6d6 = _0x5dcba2
      ? normalizeText(
          toArray(_0x44b463?.['shots'])
            ['flatMap']((_0x2250fa) => toArray(_0x2250fa?.['people']))
            ['find'](
              (_0x6ff4be) =>
                normalizeText(_0x6ff4be?.['sourceCharacterId']) === _0x35fdb4 &&
                normalizeText(_0x6ff4be?.['targetCharacterId']) === _0x5dcba2 &&
                normalizeText(_0x6ff4be?.['targetAppearanceId']),
            )?.['targetAppearanceId'],
        )
      : '',
    _0x345a21 = toArray(_0x44b463?.['shots'])['map']((_0x93fc11) => ({
      ..._0x93fc11,
      people: toArray(_0x93fc11?.['people'])['map']((_0x694286) => {
        const _0x524cca = normalizeText(_0x694286?.['sourceCharacterId']) === _0x51392a;
        if (!_0x524cca) return _0x694286;
        const _0x3fe7af =
          (!_0x16e8c1 || _0x93fc11['id'] === _0x16e8c1) && (!_0x32f495 || _0x694286['id'] === _0x32f495);
        if (_0x5cd1b2 && !_0x3fe7af) return _0x694286;
        const _0x4371ef = _0x5cd1b2 && !_0x126044;
        return {
          ..._0x694286,
          ...(_0x3fe7af
            ? {
                sourceCharacterId: _0x4371ef ? _0x35fdb4 : _0x694286['sourceCharacterId'],
                label: _0x20cfa3 || _0x694286['label'],
                ...(_0x4371ef
                  ? { targetCharacterId: _0x5dcba2, targetAppearanceId: _0x16c6d6, identityMethod: 'manual' }
                  : {}),
              }
            : {}),
          orientation: orientation && _0x3fe7af ? _0x20dce4 : _0x694286['orientation'],
          orientationConfidence: orientation && _0x3fe7af ? 0x1 : _0x694286['orientationConfidence'],
          orientationModelId: orientation && _0x3fe7af ? '' : _0x694286['orientationModelId'],
          identityReviewStatus: 'confirmed',
          identityReviewRequired: ![],
          ambiguousIdentityIds: [],
        };
      }),
    })),
    _0x1ce54d = new Set(
      _0x345a21['flatMap']((_0x43be38) =>
        toArray(_0x43be38['people'])['map']((_0x3f7ef0) => normalizeText(_0x3f7ef0?.['sourceCharacterId'])),
      )['filter'](Boolean),
    );
  return {
    ..._0x44b463,
    shots: _0x345a21,
    sourceCharacters: _0x7f4e70['map']((_0x3fca22) =>
      normalizeText(_0x3fca22?.['id']) === _0x35fdb4
        ? {
            ..._0x3fca22,
            name: _0x20cfa3 || _0x3fca22['name'],
            reviewRequired: ![],
            identityReviewStatus: 'confirmed',
            ambiguousIdentityIds: [],
          }
        : _0x3fca22,
    )['filter'](
      (_0x1ec027) =>
        !_0x5cd1b2 || normalizeText(_0x1ec027?.['id']) !== _0x51392a || _0x1ce54d['has'](_0x51392a),
    ),
    mappings: toArray(_0x44b463?.['mappings'])['filter'](
      (_0x183701) =>
        !_0x5cd1b2 ||
        normalizeText(_0x183701?.['sourceCharacterId']) !== _0x51392a ||
        _0x1ce54d['has'](_0x51392a),
    ),
  };
}
export function normalizePersonReplacementAiAnalysis(_0x4a4bb3, { existingShots: existingShots = [] } = {}) {
  const _0x42c55f = unwrapAiAnalysis(_0x4a4bb3);
  let _0x22bb68;
  Array['isArray'](_0x42c55f)
    ? (_0x22bb68 = _0x42c55f)
    : ((_0x22bb68 = firstDefined(
        _0x42c55f?.['shots'],
        _0x42c55f?.['segments'],
        _0x42c55f?.['clips'],
        _0x42c55f?.['keyframes'],
      )),
      !Array['isArray'](_0x22bb68) &&
        (_0x22bb68 = _0x42c55f && typeof _0x42c55f === 'object' ? [_0x42c55f] : []));
  const _0x19232a = toArray(existingShots)['map'](normalizePersonReplacementShot);
  return _0x22bb68['map']((_0x1a8762, _0x1ee029) => {
    const _0x5a4c25 = normalizeText(
        firstDefined(
          _0x1a8762?.['id'],
          _0x1a8762?.['shotId'],
          _0x1a8762?.['shot_id'],
          _0x1a8762?.['segmentId'],
          _0x1a8762?.['clipId'],
        ),
      ),
      _0x2c3d97 =
        _0x19232a['find']((_0x2c9405) => _0x2c9405['id'] === _0x5a4c25) || _0x19232a[_0x1ee029] || {};
    return normalizePersonReplacementShot(
      {
        ..._0x2c3d97,
        ..._0x1a8762,
        id: _0x5a4c25 || _0x2c3d97['id'],
        people: extractPeople(_0x1a8762),
        analysisStatus: 'succeeded',
      },
      _0x1ee029,
    );
  });
}
