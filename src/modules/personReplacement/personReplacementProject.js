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
export const PERSON_REPLACEMENT_SCHEMA_VERSION = 7;
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
export function isGeneratedPersonReplacementLabel(value) {
  return /^人物(?:[A-Z]+|\d+)$/u['test'](normalizeText(value));
}
const STATUS_INDEX = new Map(PERSON_REPLACEMENT_PROJECT_STATUSES['map']((item, key) => [item, key])),
  ORIENTATION_SET = new Set(PERSON_REPLACEMENT_ORIENTATIONS),
  REPLACEMENT_SCOPE_SET = new Set(PERSON_REPLACEMENT_SCOPES),
  AUDIO_TRACKS = new Set(['original', 'replacement']),
  IDENTITY_REVIEW_STATUSES = new Set(['auto', 'needs_review', 'confirmed']),
  IDENTITY_METHODS = new Set(['osnet', 'manual', 'fallback', 'unassigned']);
function normalizeText(result) {
  return String(result ?? '')['trim']();
}
export function normalizePersonReplacementScope(data) {
  const text = normalizeText(data);
  return REPLACEMENT_SCOPE_SET['has'](text) ? text : PERSON_REPLACEMENT_DEFAULT_SCOPE;
}
export function formatPersonReplacementScopeLabel(options) {
  return PERSON_REPLACEMENT_SCOPE_LABELS[normalizePersonReplacementScope(options)];
}
export function resolvePersonReplacementVideoModelId(target) {
  const text2 = normalizeText(target);
  return PERSON_REPLACEMENT_VIDEO_MODEL_IDS['includes'](text2)
    ? text2
    : PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID;
}
export function resolvePersonReplacementVideoGenerationFps(options2 = {}) {
  if (options2?.['processingMode'] === 'skip') return 24;
  return normalizeSmartClipFps(options2?.['smartClipFps']);
}
export function normalizePersonReplacementVideoInputMode(source) {
  const text3 = normalizeText(source);
  return PERSON_REPLACEMENT_VIDEO_INPUT_MODES['includes'](text3)
    ? text3
    : PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME;
}
function normalizePlainObject(args) {
  return args && typeof args === 'object' && !Array['isArray'](args) ? { ...args } : {};
}
export function resolvePersonReplacementVideoParameterPolicy({
  modelId: modelId = PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  inputMode: inputMode = PERSON_REPLACEMENT_VIDEO_INPUT_MODE_FIRST_FRAME,
  generationParams: generationParams = {},
  resetModeDefaults: resetModeDefaults = ![],
} = {}) {
  const modelId2 = resolvePersonReplacementVideoModelId(modelId),
    inputMode2 = normalizePersonReplacementVideoInputMode(inputMode),
    next = PERSON_REPLACEMENT_VIDEO_PARAMETER_POLICIES[modelId2]?.[inputMode2] || {},
    generationParams2 = {
      ...normalizePlainObject(next['defaultParams']),
      ...normalizePlainObject(generationParams),
      ...(resetModeDefaults ? normalizePlainObject(next['transitionParams']) : {}),
      ...normalizePlainObject(next['forcedParams']),
    },
    uiSchemaFieldState = {};
  return (
    (Array['isArray'](next['lockedFields']) ? next['lockedFields'] : [])['forEach']((current) => {
      const text4 = normalizeText(current);
      if (text4) uiSchemaFieldState[text4] = { disabled: !![] };
    }),
    {
      modelId: modelId2,
      inputMode: inputMode2,
      generationParams: generationParams2,
      uiSchemaFieldState: uiSchemaFieldState,
    }
  );
}
function normalizeParamsByModel(entry) {
  const plainObject = normalizePlainObject(entry);
  return Object['fromEntries'](
    Object['entries'](plainObject)
      ['map'](([record, payload]) => [normalizeText(record), normalizePlainObject(payload)])
      ['filter'](([handle]) => handle),
  );
}
function firstDefined(...list) {
  return list['find']((state) => state !== undefined && state !== null);
}
function toArray(config) {
  if (Array['isArray'](config)) return config;
  return config && typeof config === 'object' ? [config] : [];
}
function normalizeNonNegativeNumber(scope, input = 0) {
  const count = Number(scope);
  return Number['isFinite'](count) && count >= 0 ? count : input;
}
function normalizeConfidence(output) {
  const count2 = Number(output);
  if (!Number['isFinite'](count2)) return 0;
  const value2 = count2 > 1 && count2 <= 100 ? count2 / 100 : count2;
  return Math['max'](0, Math['min'](1, value2));
}
function normalizeStringArray(value3) {
  const list2 = [],
    map = new Set();
  return (
    toArray(value3)['forEach']((value4) => {
      const text5 = normalizeText(value4);
      if (!text5 || map['has'](text5)) return;
      (map['add'](text5), list2['push'](text5));
    }),
    list2
  );
}
function normalizeImageRefs(value5) {
  const list3 = [],
    map2 = new Set(),
    list4 = Array['isArray'](value5) ? value5 : value5 === undefined || value5 === null ? [] : [value5];
  return (
    list4['forEach']((response) => {
      const text6 = normalizeText(
        response && typeof response === 'object'
          ? firstDefined(
              response['ref'],
              response['id'],
              response['assetRef'],
              response['url'],
              response['path'],
            )
          : response,
      );
      if (!text6 || map2['has'](text6)) return;
      (map2['add'](text6), list3['push'](text6));
    }),
    list3
  );
}
function parseJsonLike(value6) {
  if (typeof value6 !== 'string') return value6;
  const enabled = value6['trim']();
  if (!enabled) return {};
  const list5 = enabled['replace'](/^```(?:json)?\s*/iu, '')
    ['replace'](/\s*```$/u, '')
    ['trim']();
  try {
    return JSON['parse'](list5);
  } catch {
    const count3 = Math['min'](
        ...[list5['indexOf']('{'), list5['indexOf']('[')]['filter']((count4) => count4 >= 0),
      ),
      value7 = list5['lastIndexOf']('}'),
      value8 = list5['lastIndexOf'](']'),
      value9 = Math['max'](value7, value8);
    if (Number['isFinite'](count3) && count3 >= 0 && value9 > count3)
      try {
        return JSON['parse'](list5['slice'](count3, value9 + 1));
      } catch {
        return {};
      }
    return {};
  }
}
function unwrapAiAnalysis(value10) {
  let jsonLike = parseJsonLike(value10);
  for (let count5 = 0; count5 < 5; count5 += 1) {
    if (!jsonLike || typeof jsonLike !== 'object' || Array['isArray'](jsonLike)) break;
    const defined = firstDefined(
      jsonLike['analysis'],
      jsonLike['result'],
      jsonLike['output'],
      jsonLike['data'],
      jsonLike['response'],
    );
    if (defined === undefined || defined === jsonLike) break;
    jsonLike = parseJsonLike(defined);
  }
  return jsonLike;
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
export function normalizePersonReplacementOrientation(value11) {
  const text7 = normalizeText(value11)['toLowerCase']();
  if (!text7) return 'unknown';
  const value12 = text7['replace'](/[\s/-]+/gu, '_');
  if (ORIENTATION_SET['has'](value12)) return value12;
  if (ORIENTATION_ALIASES['has'](value12)) return ORIENTATION_ALIASES['get'](value12);
  if (/过肩|over.*shoulder/iu['test'](text7)) {
    if (/左|left/iu['test'](text7)) return 'over_shoulder_left';
    if (/右|right/iu['test'](text7)) return 'over_shoulder_right';
  }
  if (/背|back|rear/iu['test'](text7)) return 'back';
  if (/正|front/iu['test'](text7)) return 'front';
  if (/左.*(?:侧|profile)|(?:left).*profile/iu['test'](text7)) return 'left_profile';
  if (/右.*(?:侧|profile)|(?:right).*profile/iu['test'](text7)) return 'right_profile';
  if (/侧|side|profile/iu['test'](text7)) return 'side';
  return 'unknown';
}
function normalizeHorizontal(value13) {
  const text8 = normalizeText(value13)['toLowerCase']();
  if (/左|left/iu['test'](text8)) return 'left';
  if (/右|right/iu['test'](text8)) return 'right';
  if (/中|center|centre|middle/iu['test'](text8)) return 'center';
  return 'unknown';
}
function normalizeDepth(value14) {
  const text9 = normalizeText(value14)['toLowerCase']();
  if (/前景|foreground|near|close/iu['test'](text9)) return 'foreground';
  if (/后景|背景|background|far/iu['test'](text9)) return 'background';
  if (/中景|midground|middle/iu['test'](text9)) return 'midground';
  return 'unknown';
}
function normalizeOcclusion(response2) {
  if (response2 === !![]) return 'partial';
  if (response2 === ![]) return 'none';
  const text10 = normalizeText(
    response2 && typeof response2 === 'object'
      ? firstDefined(response2['level'], response2['type'], response2['status'])
      : response2,
  )['toLowerCase']();
  if (/heavy|severe|large|大面积|严重|高度/iu['test'](text10)) return 'heavy';
  if (/partial|partly|medium|局部|部分|遮挡/iu['test'](text10)) return 'partial';
  return 'none';
}
function normalizeBoundingBox(box, box2 = {}) {
  if (!box) return null;
  let defined2, defined3, defined4, defined5;
  if (Array['isArray'](box)) [defined2, defined3, defined4, defined5] = box;
  else {
    if (typeof box === 'object') {
      ((defined2 = firstDefined(box['x'], box['left'], box['xmin'], box['xMin'])),
        (defined3 = firstDefined(box['y'], box['top'], box['ymin'], box['yMin'])),
        (defined4 = firstDefined(box['width'], box['w'])),
        (defined5 = firstDefined(box['height'], box['h'])));
      const defined6 = firstDefined(box['right'], box['xmax'], box['xMax']),
        defined7 = firstDefined(box['bottom'], box['ymax'], box['yMax']);
      if (defined4 === undefined && defined6 !== undefined) defined4 = Number(defined6) - Number(defined2);
      if (defined5 === undefined && defined7 !== undefined) defined5 = Number(defined7) - Number(defined3);
    }
  }
  const list6 = [defined2, defined3, defined4, defined5]['map'](Number);
  if (list6['some']((value15) => !Number['isFinite'](value15))) return null;
  let [value16, value17, value18, value19] = list6;
  const count6 = Number(firstDefined(box2['width'], box2['frameWidth'], box2['imageWidth'])),
    count7 = Number(firstDefined(box2['height'], box2['frameHeight'], box2['imageHeight']));
  if (count6 > 0 && count7 > 0 && list6['some']((count8) => count8 > 1))
    ((value16 /= count6), (value18 /= count6), (value17 /= count7), (value19 /= count7));
  else
    list6['every']((count9) => count9 >= 0 && count9 <= 100) &&
      list6['some']((count10) => count10 > 1) &&
      ((value16 /= 100), (value17 /= 100), (value18 /= 100), (value19 /= 100));
  return {
    x: Math['max'](0, Math['min'](1, value16)),
    y: Math['max'](0, Math['min'](1, value17)),
    width: Math['max'](0, Math['min'](1 - Math['max'](0, value16), value18)),
    height: Math['max'](0, Math['min'](1 - Math['max'](0, value17), value19)),
  };
}
function inferHorizontal(box3) {
  if (!box3) return 'unknown';
  const count11 = box3['x'] + box3['width'] / 2;
  if (count11 < 0.4) return 'left';
  if (count11 > 0.6) return 'right';
  return 'center';
}
function normalizeAnalysisStatus(value20, value21 = 'pending') {
  const text11 = normalizeText(value20)['toLowerCase']();
  return ['pending', 'running', 'succeeded', 'failed', 'needs_review']['includes'](text11) ? text11 : value21;
}
function normalizeGenerationStatus(value22) {
  const text12 = normalizeText(value22)['toLowerCase']();
  return ['pending', 'queued', 'submitting', 'running', 'succeeded', 'failed', 'cancelled', 'needs_review'][
    'includes'
  ](text12)
    ? text12
    : 'pending';
}
function normalizeMaterializationStatus(value23, value24 = ![]) {
  const text13 = normalizeText(value23)['toLowerCase']();
  if (['pending', 'running', 'succeeded', 'failed']['includes'](text13)) return text13;
  return value24 ? 'succeeded' : 'pending';
}
export function normalizePersonReplacementPerson(
  promptMarkerIndex = {},
  { shotId: shotId = 'shot-1', index: index = 0, frame: frame = {} } = {},
) {
  const bbox = normalizeBoundingBox(
      firstDefined(
        promptMarkerIndex['bbox'],
        promptMarkerIndex['box'],
        promptMarkerIndex['boundingBox'],
        promptMarkerIndex['bounding_box'],
        promptMarkerIndex['region'],
        promptMarkerIndex['locator']?.['bbox'],
      ),
      frame,
    ),
    horizontal = normalizeHorizontal(
      firstDefined(
        promptMarkerIndex['horizontal'],
        promptMarkerIndex['side'],
        promptMarkerIndex['position'],
        promptMarkerIndex['location'],
        promptMarkerIndex['locator']?.['horizontal'],
      ),
    ),
    sourceCharacterId = normalizeText(
      firstDefined(
        promptMarkerIndex['sourceCharacterId'],
        promptMarkerIndex['source_character_id'],
        promptMarkerIndex['identityId'],
        promptMarkerIndex['identity_id'],
        promptMarkerIndex['clusterId'],
        promptMarkerIndex['cluster_id'],
        promptMarkerIndex['trackId'],
        promptMarkerIndex['track_id'],
      ),
    );
  return {
    id:
      normalizeText(
        firstDefined(promptMarkerIndex['id'], promptMarkerIndex['personId'], promptMarkerIndex['person_id']),
      ) || shotId + '-person-' + (index + 1),
    ...(Number['isSafeInteger'](promptMarkerIndex['promptMarkerIndex']) &&
    promptMarkerIndex['promptMarkerIndex'] >= 0
      ? { promptMarkerIndex: promptMarkerIndex['promptMarkerIndex'] }
      : {}),
    sourceCharacterId: sourceCharacterId,
    targetCharacterId: normalizeText(
      firstDefined(promptMarkerIndex['targetCharacterId'], promptMarkerIndex['target_character_id']),
    ),
    targetAppearanceId: normalizeText(
      firstDefined(promptMarkerIndex['targetAppearanceId'], promptMarkerIndex['target_appearance_id']),
    ),
    ...(promptMarkerIndex['projectMappingDisabled'] === !![] ||
    promptMarkerIndex['project_mapping_disabled'] === !![]
      ? { projectMappingDisabled: !![] }
      : {}),
    replacementScope: normalizePersonReplacementScope(
      firstDefined(promptMarkerIndex['replacementScope'], promptMarkerIndex['replacement_scope']),
    ),
    detectionClass:
      normalizeText(
        firstDefined(
          promptMarkerIndex['detectionClass'],
          promptMarkerIndex['detection_class'],
          promptMarkerIndex['className'],
        ),
      ) || 'person',
    detectionMethod: ['automatic', 'manual']['includes'](
      normalizeText(
        firstDefined(promptMarkerIndex['detectionMethod'], promptMarkerIndex['detection_method']),
      ),
    )
      ? normalizeText(
          firstDefined(promptMarkerIndex['detectionMethod'], promptMarkerIndex['detection_method']),
        )
      : 'automatic',
    label: normalizeText(
      firstDefined(promptMarkerIndex['label'], promptMarkerIndex['personLabel'], promptMarkerIndex['name']),
    ),
    genderHint: normalizeText(
      firstDefined(
        promptMarkerIndex['genderHint'],
        promptMarkerIndex['gender'],
        promptMarkerIndex['perceivedGender'],
        promptMarkerIndex['sex'],
      ),
    ),
    locator: {
      horizontal: horizontal === 'unknown' ? inferHorizontal(bbox) : horizontal,
      depth: normalizeDepth(
        firstDefined(
          promptMarkerIndex['depth'],
          promptMarkerIndex['layer'],
          promptMarkerIndex['position'],
          promptMarkerIndex['location'],
          promptMarkerIndex['locator']?.['depth'],
        ),
      ),
      bbox: bbox,
    },
    orientation: normalizePersonReplacementOrientation(
      firstDefined(
        promptMarkerIndex['orientation'],
        promptMarkerIndex['facing'],
        promptMarkerIndex['direction'],
        promptMarkerIndex['pose']?.['orientation'],
      ),
    ),
    orientationModelId: normalizeText(
      firstDefined(promptMarkerIndex['orientationModelId'], promptMarkerIndex['orientation_model_id']),
    ),
    identityConfidence: normalizeConfidence(
      firstDefined(
        promptMarkerIndex['identityConfidence'],
        promptMarkerIndex['identity_confidence'],
        promptMarkerIndex['characterConfidence'],
        promptMarkerIndex['character_confidence'],
      ),
    ),
    detectionConfidence: normalizeConfidence(
      firstDefined(
        promptMarkerIndex['detectionConfidence'],
        promptMarkerIndex['detection_confidence'],
        promptMarkerIndex['detectorConfidence'],
        promptMarkerIndex['detector_confidence'],
      ),
    ),
    identityMatchSimilarity: normalizeConfidence(
      firstDefined(
        promptMarkerIndex['identityMatchSimilarity'],
        promptMarkerIndex['matchSimilarity'],
        promptMarkerIndex['match_similarity'],
      ),
    ),
    identityReviewStatus: IDENTITY_REVIEW_STATUSES['has'](
      normalizeText(promptMarkerIndex['identityReviewStatus']),
    )
      ? normalizeText(promptMarkerIndex['identityReviewStatus'])
      : firstDefined(promptMarkerIndex['reviewRequired'], promptMarkerIndex['needsReview'], ![])
        ? 'needs_review'
        : 'auto',
    identityMethod: IDENTITY_METHODS['has'](normalizeText(promptMarkerIndex['identityMethod']))
      ? normalizeText(promptMarkerIndex['identityMethod'])
      : sourceCharacterId
        ? 'fallback'
        : 'unassigned',
    identityReviewRequired: Boolean(
      firstDefined(
        promptMarkerIndex['identityReviewRequired'],
        promptMarkerIndex['reviewRequired'],
        promptMarkerIndex['needsReview'],
        ![],
      ),
    ),
    ambiguousIdentityIds: toArray(
      firstDefined(
        promptMarkerIndex['ambiguousIdentityIds'],
        promptMarkerIndex['ambiguous_identity_ids'],
        [],
      ),
    )
      ['map'](normalizeText)
      ['filter'](Boolean),
    orientationConfidence: normalizeConfidence(
      firstDefined(
        promptMarkerIndex['orientationConfidence'],
        promptMarkerIndex['orientation_confidence'],
        promptMarkerIndex['facingConfidence'],
        promptMarkerIndex['facing_confidence'],
      ),
    ),
    occlusion: normalizeOcclusion(
      firstDefined(
        promptMarkerIndex['occlusion'],
        promptMarkerIndex['occluded'],
        promptMarkerIndex['visibility'],
      ),
    ),
    notes: normalizeText(
      firstDefined(promptMarkerIndex['notes'], promptMarkerIndex['note'], promptMarkerIndex['description']),
    ),
  };
}
function extractPeople(value25) {
  return firstDefined(
    value25['people'],
    value25['persons'],
    value25['characters'],
    value25['subjects'],
    value25['detections']?.['people'],
    value25['detection']?.['people'],
    value25['人物'],
    [],
  );
}
export function resolvePersonReplacementImageResultRef(response3 = {}) {
  if (typeof response3 === 'string') {
    const text14 = normalizeText(response3);
    return normalizeLocalPath(text14) ? text14 : '';
  }
  if (!response3 || typeof response3 !== 'object' || Array['isArray'](response3)) return '';
  return (
    [
      response3['originalLocalPath'],
      response3['localPath'],
      response3['sourceUrl'],
      response3['imageUrl'],
      response3['url'],
      response3['resultUrl'],
      response3['localUrl'],
      response3['src'],
      response3['displayLocalPath'],
      response3['displayUrl'],
      response3['ref'],
    ]
      ['map'](normalizeText)
      ['find']((value26) => normalizeLocalPath(value26)) || ''
  );
}
function normalizePersonReplacementImageResult(response4 = {}) {
  if (typeof response4 === 'string') {
    const imageUrl = resolvePersonReplacementImageResultRef(response4);
    return imageUrl ? { imageUrl: imageUrl } : null;
  }
  if (!response4 || typeof response4 !== 'object' || Array['isArray'](response4)) return null;
  const personReplacementImageResultRef = resolvePersonReplacementImageResultRef(response4);
  if (!personReplacementImageResultRef) return null;
  return {
    ...response4,
    ...(response4['originalLocalPath'] !== undefined
      ? { originalLocalPath: resolvePersonReplacementImageResultRef(response4['originalLocalPath']) }
      : {}),
    ...(response4['displayLocalPath'] !== undefined
      ? { displayLocalPath: resolvePersonReplacementImageResultRef(response4['displayLocalPath']) }
      : {}),
    ...(response4['localPath'] !== undefined
      ? { localPath: resolvePersonReplacementImageResultRef(response4['localPath']) }
      : {}),
    ...(response4['imageUrl'] !== undefined
      ? { imageUrl: resolvePersonReplacementImageResultRef(response4['imageUrl']) }
      : {}),
    ...(response4['src'] !== undefined
      ? { src: resolvePersonReplacementImageResultRef(response4['src']) }
      : {}),
    ...(response4['resultUrl'] !== undefined
      ? { resultUrl: resolvePersonReplacementImageResultRef(response4['resultUrl']) }
      : {}),
    ...(response4['localUrl'] !== undefined
      ? { localUrl: resolvePersonReplacementImageResultRef(response4['localUrl']) }
      : {}),
    ...(response4['sourceUrl'] !== undefined
      ? { sourceUrl: resolvePersonReplacementImageResultRef(response4['sourceUrl']) }
      : {}),
    ...(response4['url'] !== undefined
      ? { url: resolvePersonReplacementImageResultRef(response4['url']) }
      : {}),
    ...(response4['displayUrl'] !== undefined
      ? { displayUrl: resolvePersonReplacementImageResultRef(response4['displayUrl']) }
      : {}),
    ...(response4['ref'] !== undefined
      ? { ref: resolvePersonReplacementImageResultRef(response4['ref']) }
      : {}),
    ...(response4['remoteFallbackUrl'] !== undefined ? { remoteFallbackUrl: '' } : {}),
    ...(response4['localSaveError'] !== undefined ? { localSaveError: '' } : {}),
    ...(response4['prompt'] !== undefined ? { prompt: normalizeText(response4['prompt']) } : {}),
    ...(response4['userPrompt'] !== undefined ? { userPrompt: normalizeText(response4['userPrompt']) } : {}),
    ...(response4['modelId'] !== undefined ? { modelId: normalizeText(response4['modelId']) } : {}),
    ...(response4['provider'] !== undefined ? { provider: normalizeText(response4['provider']) } : {}),
    ...(response4['createdAt'] !== undefined ? { createdAt: normalizeText(response4['createdAt']) } : {}),
  };
}
export function getPersonReplacementImageResults(options3 = {}) {
  const value27 = options3?.['replacementImage'],
    list7 = value27 && typeof value27 === 'object' && !Array['isArray'](value27) ? value27['results'] : [];
  return Array['isArray'](list7)
    ? list7['map'](normalizePersonReplacementImageResult)['filter'](Boolean)
    : [];
}
export function getPersonReplacementActiveImageResultIndex(
  options4 = {},
  list8 = getPersonReplacementImageResults(options4),
) {
  if (!list8['length']) return 0;
  const value28 = Math['trunc'](Number(options4?.['replacementImage']?.['activeIndex']) || 0);
  return Math['max'](0, Math['min'](list8['length'] - 1, value28));
}
export function getPersonReplacementActiveImageResult(
  options5 = {},
  personReplacementImageResults = getPersonReplacementImageResults(options5),
) {
  return (
    personReplacementImageResults[
      getPersonReplacementActiveImageResultIndex(options5, personReplacementImageResults)
    ] || null
  );
}
export function resolvePersonReplacementImageSourceRef(options6 = {}) {
  return normalizeText(options6?.['imageIterationReferenceRef']) || normalizeText(options6?.['keyframeRef']);
}
function normalizePersonReplacementImage(options7 = {}) {
  const replacementImage =
      options7['replacementImage'] &&
      typeof options7['replacementImage'] === 'object' &&
      !Array['isArray'](options7['replacementImage'])
        ? options7['replacementImage']
        : {},
    results = getPersonReplacementImageResults({ replacementImage: replacementImage }),
    imageUrl2 = resolvePersonReplacementImageResultRef(
      normalizeText(
        firstDefined(
          options7['replacementImageRef'],
          options7['generatedKeyframeRef'],
          options7['replacedFrameRef'],
        ),
      ),
    );
  imageUrl2 && !results['length'] && results['push']({ imageUrl: imageUrl2 });
  const value29 = Number(replacementImage['activeIndex']),
    value30 = imageUrl2
      ? results['findIndex']((value31) => resolvePersonReplacementImageResultRef(value31) === imageUrl2)
      : -1,
    activeIndex = results['length']
      ? Number['isFinite'](value29)
        ? Math['max'](0, Math['min'](results['length'] - 1, Math['trunc'](value29)))
        : Math['max'](0, value30)
      : 0;
  return { results: results, activeIndex: activeIndex };
}
export function resolvePersonReplacementVideoResultRef(response5 = {}) {
  if (typeof response5 === 'string') {
    const text15 = normalizeText(response5);
    return normalizeLocalPath(text15) ? text15 : '';
  }
  if (!response5 || typeof response5 !== 'object' || Array['isArray'](response5)) return '';
  return (
    [
      response5['displayLocalPath'],
      response5['localPath'],
      response5['videoUrl'],
      response5['url'],
      response5['displayUrl'],
      response5['ref'],
    ]
      ['map'](normalizeText)
      ['find']((value32) => normalizeLocalPath(value32)) || ''
  );
}
function normalizePersonReplacementVideoResult(response6 = {}) {
  if (typeof response6 === 'string') {
    const videoUrl = resolvePersonReplacementVideoResultRef(response6);
    return videoUrl ? { videoUrl: videoUrl } : null;
  }
  if (!response6 || typeof response6 !== 'object' || Array['isArray'](response6)) return null;
  const personReplacementVideoResultRef = resolvePersonReplacementVideoResultRef(response6);
  if (!personReplacementVideoResultRef) return null;
  return {
    ...response6,
    ...(response6['displayLocalPath'] !== undefined
      ? { displayLocalPath: resolvePersonReplacementVideoResultRef(response6['displayLocalPath']) }
      : {}),
    ...(response6['localPath'] !== undefined
      ? { localPath: resolvePersonReplacementVideoResultRef(response6['localPath']) }
      : {}),
    ...(response6['videoUrl'] !== undefined
      ? { videoUrl: resolvePersonReplacementVideoResultRef(response6['videoUrl']) }
      : {}),
    ...(response6['src'] !== undefined
      ? { src: resolvePersonReplacementVideoResultRef(response6['src']) }
      : {}),
    ...(response6['resultUrl'] !== undefined
      ? { resultUrl: resolvePersonReplacementVideoResultRef(response6['resultUrl']) }
      : {}),
    ...(response6['localUrl'] !== undefined
      ? { localUrl: resolvePersonReplacementVideoResultRef(response6['localUrl']) }
      : {}),
    ...(response6['sourceUrl'] !== undefined
      ? { sourceUrl: resolvePersonReplacementVideoResultRef(response6['sourceUrl']) }
      : {}),
    ...(response6['url'] !== undefined
      ? { url: resolvePersonReplacementVideoResultRef(response6['url']) }
      : {}),
    ...(response6['displayUrl'] !== undefined
      ? { displayUrl: resolvePersonReplacementVideoResultRef(response6['displayUrl']) }
      : {}),
    ...(response6['ref'] !== undefined
      ? { ref: resolvePersonReplacementVideoResultRef(response6['ref']) }
      : {}),
    ...(response6['remoteFallbackUrl'] !== undefined ? { remoteFallbackUrl: '' } : {}),
    ...(response6['localSaveError'] !== undefined ? { localSaveError: '' } : {}),
    ...(response6['thumbUrl'] !== undefined
      ? { thumbUrl: resolvePersonReplacementVideoResultRef(response6['thumbUrl']) }
      : {}),
    ...(response6['posterUrl'] !== undefined
      ? { posterUrl: resolvePersonReplacementVideoResultRef(response6['posterUrl']) }
      : {}),
    ...(response6['previewUrl'] !== undefined
      ? { previewUrl: resolvePersonReplacementVideoResultRef(response6['previewUrl']) }
      : {}),
    ...(response6['thumbnailUrl'] !== undefined
      ? { thumbnailUrl: resolvePersonReplacementVideoResultRef(response6['thumbnailUrl']) }
      : {}),
    ...(response6['prompt'] !== undefined ? { prompt: normalizeText(response6['prompt']) } : {}),
    ...(response6['modelId'] !== undefined ? { modelId: normalizeText(response6['modelId']) } : {}),
    ...(response6['provider'] !== undefined ? { provider: normalizeText(response6['provider']) } : {}),
    ...(response6['createdAt'] !== undefined ? { createdAt: normalizeText(response6['createdAt']) } : {}),
  };
}
export function getPersonReplacementVideoResults(options8 = {}) {
  const value33 = options8?.['replacementVideo'],
    list9 = value33 && typeof value33 === 'object' && !Array['isArray'](value33) ? value33['results'] : [];
  return Array['isArray'](list9)
    ? list9['map'](normalizePersonReplacementVideoResult)['filter'](Boolean)
    : [];
}
export function getPersonReplacementActiveVideoResultIndex(
  options9 = {},
  list10 = getPersonReplacementVideoResults(options9),
) {
  if (!list10['length']) return 0;
  const value34 = Math['trunc'](Number(options9?.['replacementVideo']?.['activeIndex']) || 0);
  return Math['max'](0, Math['min'](list10['length'] - 1, value34));
}
export function getPersonReplacementActiveVideoResult(
  options10 = {},
  personReplacementVideoResults = getPersonReplacementVideoResults(options10),
) {
  return (
    personReplacementVideoResults[
      getPersonReplacementActiveVideoResultIndex(options10, personReplacementVideoResults)
    ] || null
  );
}
export function resolvePersonReplacementVideoSourceRef(options11 = {}) {
  const text16 = normalizeText(options11?.['videoIterationReferenceRef']);
  return text16
    ? normalizeText(options11?.['videoIterationInputRef']) || text16
    : normalizeText(options11?.['videoRef']);
}
function normalizePersonReplacementVideo(options12 = {}) {
  const replacementVideo =
      options12['replacementVideo'] &&
      typeof options12['replacementVideo'] === 'object' &&
      !Array['isArray'](options12['replacementVideo'])
        ? options12['replacementVideo']
        : {},
    results2 = getPersonReplacementVideoResults({ replacementVideo: replacementVideo }),
    videoUrl2 = resolvePersonReplacementVideoResultRef(
      normalizeText(
        firstDefined(options12['resultVideoRef'], options12['outputVideoRef'], options12['resultRef']),
      ),
    );
  videoUrl2 && !results2['length'] && results2['push']({ videoUrl: videoUrl2 });
  const value35 = Number(replacementVideo['activeIndex']),
    value36 = videoUrl2
      ? results2['findIndex']((value37) => resolvePersonReplacementVideoResultRef(value37) === videoUrl2)
      : -1,
    activeIndex2 = results2['length']
      ? Number['isFinite'](value35)
        ? Math['max'](0, Math['min'](results2['length'] - 1, Math['trunc'](value35)))
        : Math['max'](0, value36)
      : 0;
  return { results: results2, activeIndex: activeIndex2 };
}
export function normalizePersonReplacementShot(imagePromptReferences = {}, value38 = 0) {
  const shotId2 =
      normalizeText(
        firstDefined(
          imagePromptReferences['id'],
          imagePromptReferences['shotId'],
          imagePromptReferences['shot_id'],
          imagePromptReferences['segmentId'],
          imagePromptReferences['clipId'],
        ),
      ) || 'shot-' + (value38 + 1),
    startTimeSec = normalizeNonNegativeNumber(
      firstDefined(
        imagePromptReferences['startTimeSec'],
        imagePromptReferences['start_time'],
        imagePromptReferences['start'],
        imagePromptReferences['in'],
      ),
    ),
    value39 = Number(
      firstDefined(
        imagePromptReferences['endTimeSec'],
        imagePromptReferences['end_time'],
        imagePromptReferences['end'],
        imagePromptReferences['out'],
      ),
    ),
    nonNegativeNumber = normalizeNonNegativeNumber(
      firstDefined(
        imagePromptReferences['durationSec'],
        imagePromptReferences['duration'],
        imagePromptReferences['length'],
      ),
    ),
    endTimeSec =
      Number['isFinite'](value39) && value39 >= startTimeSec ? value39 : startTimeSec + nonNegativeNumber,
    frame2 = firstDefined(
      imagePromptReferences['frame'],
      imagePromptReferences['frameSize'],
      imagePromptReferences['imageSize'],
      {},
    ),
    people = assignPersonReplacementPromptIndexes(
      toArray(extractPeople(imagePromptReferences))['map']((value40, index2) =>
        normalizePersonReplacementPerson(value40, {
          shotId: shotId2,
          index: index2,
          frame: frame2,
        }),
      ),
    )['map']((label2) => ({
      ...label2,
      label: label2['label'] || formatPersonReplacementPersonLabel(label2['promptMarkerIndex']),
    })),
    videoRef = normalizeText(
      firstDefined(
        imagePromptReferences['videoRef'],
        imagePromptReferences['clipRef'],
        imagePromptReferences['segmentRef'],
        imagePromptReferences['video'],
      ),
    ),
    text17 = normalizeText(
      firstDefined(
        imagePromptReferences['keyframeRef'],
        imagePromptReferences['keyFrameRef'],
        imagePromptReferences['firstFrameRef'],
        imagePromptReferences['frameRef'],
        imagePromptReferences['imageRef'],
      ),
    ),
    keyframeRef = normalizeText(imagePromptReferences['imageIterationOriginalKeyframeRef']),
    replacementImage2 = normalizePersonReplacementImage(imagePromptReferences),
    text18 =
      normalizeText(imagePromptReferences['imageIterationReferenceRef']) || (keyframeRef ? text17 : ''),
    imageIterationReferenceRef = replacementImage2['results']['some'](
      (value41) => resolvePersonReplacementImageResultRef(value41) === text18,
    )
      ? text18
      : '',
    personReplacementActiveImageResult = getPersonReplacementActiveImageResult(
      { replacementImage: replacementImage2 },
      replacementImage2['results'],
    ),
    replacementVideoReferenceSourceShotId = normalizeText(
      imagePromptReferences['replacementVideoReferenceSourceShotId'],
    ),
    replacementVideoReferencePersonId = normalizeText(
      imagePromptReferences['replacementVideoReferencePersonId'],
    ),
    replacementVideoReferenceImageRef = resolvePersonReplacementImageResultRef(
      imagePromptReferences['replacementVideoReferenceImageRef'],
    ),
    replacementVideo2 = normalizePersonReplacementVideo(imagePromptReferences),
    text19 = normalizeText(imagePromptReferences['videoIterationReferenceRef']),
    videoIterationReferenceRef = replacementVideo2['results']['some'](
      (value42) => resolvePersonReplacementVideoResultRef(value42) === text19,
    )
      ? text19
      : '',
    personReplacementActiveVideoResult = getPersonReplacementActiveVideoResult(
      { replacementVideo: replacementVideo2 },
      replacementVideo2['results'],
    );
  return {
    id: shotId2,
    sourceId: normalizeText(
      firstDefined(imagePromptReferences['sourceId'], imagePromptReferences['source_id']),
    ),
    index: Number['isInteger'](Number(imagePromptReferences['index']))
      ? Number(imagePromptReferences['index'])
      : value38,
    frame: {
      width: normalizeNonNegativeNumber(
        firstDefined(frame2['width'], frame2['frameWidth'], frame2['imageWidth']),
      ),
      height: normalizeNonNegativeNumber(
        firstDefined(frame2['height'], frame2['frameHeight'], frame2['imageHeight']),
      ),
    },
    startTimeSec: startTimeSec,
    endTimeSec: endTimeSec,
    durationSec: Math['max'](0, endTimeSec - startTimeSec),
    sourceVideoRef: normalizeText(
      firstDefined(
        imagePromptReferences['sourceVideoRef'],
        imagePromptReferences['sourceRef'],
        imagePromptReferences['originalVideoRef'],
      ),
    ),
    videoRef: videoRef,
    ...(videoIterationReferenceRef
      ? {
          videoIterationReferenceRef: videoIterationReferenceRef,
          ...(resolvePersonReplacementVideoResultRef(imagePromptReferences['videoIterationInputRef'])
            ? {
                videoIterationInputRef: resolvePersonReplacementVideoResultRef(
                  imagePromptReferences['videoIterationInputRef'],
                ),
                ...(imagePromptReferences['videoIterationInputIsReversed'] === !![]
                  ? { videoIterationInputIsReversed: !![] }
                  : {}),
              }
            : {}),
        }
      : {}),
    ...(imagePromptReferences['videoRefIsCropped'] === !![] ? { videoRefIsCropped: !![] } : {}),
    ...(imagePromptReferences['isReversed'] === !![] ? { isReversed: !![] } : {}),
    materializedIsReversed:
      typeof imagePromptReferences['materializedIsReversed'] === 'boolean'
        ? imagePromptReferences['materializedIsReversed']
        : Boolean(videoRef) && imagePromptReferences['isReversed'] === !![],
    keyframeRef: keyframeRef || text17,
    ...(imageIterationReferenceRef ? { imageIterationReferenceRef: imageIterationReferenceRef } : {}),
    keyframeIndex: Math['max'](
      0,
      Math['trunc'](
        normalizeNonNegativeNumber(
          firstDefined(imagePromptReferences['keyframeIndex'], imagePromptReferences['frameIndex']),
        ),
      ),
    ),
    keyframeTimeSec: normalizeNonNegativeNumber(
      firstDefined(
        imagePromptReferences['keyframeTimeSec'],
        imagePromptReferences['frameTimeSec'],
        startTimeSec,
      ),
    ),
    ...(imagePromptReferences['keyframeManuallySelected'] === !![] ? { keyframeManuallySelected: !![] } : {}),
    outputFps: normalizeNonNegativeNumber(
      firstDefined(
        imagePromptReferences['outputFps'],
        imagePromptReferences['fps'],
        imagePromptReferences['frameRate'],
      ),
    ),
    materializationStatus: normalizeMaterializationStatus(
      firstDefined(imagePromptReferences['materializationStatus'], imagePromptReferences['clipStatus']),
      Boolean(videoRef),
    ),
    materializationProgress: Math['max'](
      0,
      Math['min'](100, normalizeNonNegativeNumber(imagePromptReferences['materializationProgress'])),
    ),
    replacementImage: replacementImage2,
    replacementImageRef: resolvePersonReplacementImageResultRef(personReplacementActiveImageResult),
    replacementVideoReferenceKind:
      normalizeText(imagePromptReferences['replacementVideoReferenceKind']) ===
      PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE
        ? PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE
        : PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
    ...(replacementVideoReferenceSourceShotId
      ? { replacementVideoReferenceSourceShotId: replacementVideoReferenceSourceShotId }
      : {}),
    ...(replacementVideoReferenceImageRef
      ? { replacementVideoReferenceImageRef: replacementVideoReferenceImageRef }
      : {}),
    ...(replacementVideoReferencePersonId
      ? { replacementVideoReferencePersonId: replacementVideoReferencePersonId }
      : {}),
    people: people,
    analysisStatus: normalizeAnalysisStatus(
      firstDefined(imagePromptReferences['analysisStatus'], imagePromptReferences['analysis_status']),
      people['length'] ? 'succeeded' : 'pending',
    ),
    reviewRequired: Boolean(
      firstDefined(
        imagePromptReferences['reviewRequired'],
        imagePromptReferences['needsReview'],
        imagePromptReferences['needs_review'],
        ![],
      ),
    ),
    replacementPromptMode: normalizePersonReplacementPromptMode(
      imagePromptReferences['replacementPromptMode'],
    ),
    ...(Array['isArray'](imagePromptReferences['imagePromptReferences'])
      ? {
          imagePromptReferences: imagePromptReferences['imagePromptReferences']
            ['filter']((value43) => Number['isSafeInteger'](value43?.['slot']) && value43['slot'] > 0)
            ['map']((slot) => ({ slot: slot['slot'], key: normalizeText(slot['key']) })),
        }
      : {}),
    imagePrompt: normalizeText(
      firstDefined(
        imagePromptReferences['imagePrompt'],
        imagePromptReferences['replacementImagePrompt'],
        imagePromptReferences['prompt'],
        imagePromptReferences['replacementPrompt'],
      ),
    ),
    sceneReference: {
      sceneId: normalizeText(
        firstDefined(
          imagePromptReferences['sceneReference']?.['sceneId'],
          imagePromptReferences['sceneReferenceId'],
        ),
      ),
      appearanceId: normalizeText(
        firstDefined(
          imagePromptReferences['sceneReference']?.['appearanceId'],
          imagePromptReferences['sceneReferenceAppearanceId'],
        ),
      ),
    },
    videoPrompt: normalizeText(
      firstDefined(imagePromptReferences['videoPrompt'], imagePromptReferences['replacementVideoPrompt']),
    ),
    replacementVideoInputsBySlot: Object['fromEntries'](
      Object['entries'](normalizePlainObject(imagePromptReferences['replacementVideoInputsBySlot']))
        ['map'](([value44, url]) => {
          const error = typeof url === 'string' ? { url: url } : normalizePlainObject(url),
            text20 = normalizeText(value44),
            url2 = normalizeText(
              firstDefined(
                error['url'],
                error['localUrl'],
                error['imageUrl'],
                error['videoUrl'],
                error['localPath'],
              ),
            ),
            kind = normalizeText(error['kind']);
          if (!text20 || !url2 || !['image', 'video', 'audio']['includes'](kind)) return null;
          return [
            text20,
            {
              kind: kind,
              url: url2,
              modelId: normalizeText(error['modelId']),
              fileName: normalizeText(firstDefined(error['fileName'], error['name'])),
              mimeType: normalizeText(error['mimeType']),
              thumbUrl: normalizeText(error['thumbUrl']),
            },
          ];
        })
        ['filter'](Boolean),
    ),
    generationStatus: normalizeGenerationStatus(
      firstDefined(
        imagePromptReferences['generationStatus'],
        imagePromptReferences['generation_status'],
        imagePromptReferences['status'],
      ),
    ),
    replacementVideo: replacementVideo2,
    resultVideoRef: resolvePersonReplacementVideoResultRef(personReplacementActiveVideoResult),
    error: normalizeText(firstDefined(imagePromptReferences['error'], imagePromptReferences['errorMessage'])),
  };
}
function clearPersonReplacementVideoReferenceSelection(options13 = {}) {
  const {
    replacementVideoReferenceSourceShotId: replacementVideoReferenceSourceShotId2,
    replacementVideoReferenceImageRef: replacementVideoReferenceImageRef2,
    ...args2
  } = options13;
  return args2;
}
function reconcilePersonReplacementVideoReferenceSelections(list11 = []) {
  const map3 = new Map(list11['map']((value45) => [normalizeText(value45?.['id']), value45]));
  return list11['map']((args3) => {
    const replacementVideoReferenceSourceShotId3 = normalizeText(
        args3?.['replacementVideoReferenceSourceShotId'],
      ),
      personReplacementImageResultRef2 = resolvePersonReplacementImageResultRef(
        args3?.['replacementVideoReferenceImageRef'],
      );
    if (!replacementVideoReferenceSourceShotId3 && !personReplacementImageResultRef2) return args3;
    const enabled2 = map3['get'](replacementVideoReferenceSourceShotId3),
      list12 = getPersonReplacementImageResults(enabled2);
    if (!enabled2 || !list12['length']) return clearPersonReplacementVideoReferenceSelection(args3);
    const value46 = personReplacementImageResultRef2
        ? list12['find'](
            (value47) => resolvePersonReplacementImageResultRef(value47) === personReplacementImageResultRef2,
          )
        : null,
      replacementVideoReferenceImageRef3 = resolvePersonReplacementImageResultRef(
        value46 || list12[getPersonReplacementActiveImageResultIndex(enabled2, list12)],
      );
    if (!replacementVideoReferenceImageRef3) return clearPersonReplacementVideoReferenceSelection(args3);
    return {
      ...args3,
      replacementVideoReferenceSourceShotId: replacementVideoReferenceSourceShotId3,
      replacementVideoReferenceImageRef: replacementVideoReferenceImageRef3,
    };
  });
}
function normalizeVoiceReference(value48, value49 = '') {
  const error2 = value48 && typeof value48 === 'object' ? value48 : {},
    source2 = normalizeText(error2['source']) || 'upload',
    text21 = normalizeText(
      firstDefined(
        error2['audioUrl'],
        error2['localPath'],
        error2['url'],
        value49,
        typeof value48 === 'string' ? value48 : '',
      ),
    );
  if (!text21) return null;
  return {
    audioUrl: normalizeText(firstDefined(error2['audioUrl'], error2['url'], text21)),
    localPath: normalizeText(firstDefined(error2['localPath'], text21)),
    fileName: normalizeText(firstDefined(error2['fileName'], error2['name'], '上传声音')),
    source: source2,
    ...(source2 === 'library'
      ? {
          libraryAssetId: normalizeText(error2['libraryAssetId']),
          sourceAssetId: normalizeText(error2['sourceAssetId']),
          sourceItemIndex: Math['max'](0, Math['trunc'](Number(error2['sourceItemIndex']) || 0)),
        }
      : {}),
    updatedAt: normalizeNonNegativeNumber(error2['updatedAt'], Date['now']()),
  };
}
function normalizeCharacterAppearances(options14 = {}) {
  const list13 = Array['isArray'](options14['appearances'])
    ? options14['appearances']
    : normalizeImageRefs(
        firstDefined(
          options14['imageRefs'],
          options14['referenceImages'],
          options14['images'],
          options14['imageRef'],
        ),
      )['map']((imageUrl3, name2) => ({
        id: (normalizeText(options14['id']) || 'target-character') + '-appearance-' + (name2 + 1),
        name: name2 === 0 ? '基础形象' : '形象 ' + (name2 + 1),
        imageUrl: imageUrl3,
      }));
  return list13['map']((error3, count12) => ({
    ...(error3 && typeof error3 === 'object' ? error3 : {}),
    id:
      normalizeText(error3?.['id']) ||
      (normalizeText(options14['id']) || 'target-character') + '-appearance-' + (count12 + 1),
    name: normalizeText(error3?.['name']) || (count12 === 0 ? '基础形象' : '形象 ' + (count12 + 1)),
    imageUrl: normalizeText(
      firstDefined(
        error3?.['imageUrl'],
        error3?.['imageRef'],
        error3?.['url'],
        typeof error3 === 'string' ? error3 : '',
      ),
    ),
    prompt: normalizeText(firstDefined(error3?.['prompt'], options14['description'])),
    occurrences: normalizeText(error3?.['occurrences']) || '当前项目',
    generationStatus: normalizeGenerationStatus(error3?.['generationStatus']),
    error: normalizeText(error3?.['error']),
  }));
}
function normalizeTargetCharacter(error4 = {}, value50 = 0) {
  const id2 =
      normalizeText(firstDefined(error4['id'], error4['ref'], error4['characterId'])) ||
      'target-character-' + (value50 + 1),
    appearances = normalizeCharacterAppearances({ ...error4, id: id2 }),
    baseAppearanceId = appearances['some'](
      (value51) => value51['id'] === normalizeText(error4['baseAppearanceId']),
    )
      ? normalizeText(error4['baseAppearanceId'])
      : appearances[0]?.['id'] || '',
    voiceReference = normalizeVoiceReference(
      error4['voiceReference'],
      firstDefined(error4['voiceRef'], error4['audioRef']),
    );
  return {
    ...normalizePlainObject(error4),
    id: id2,
    kind: 'character',
    name:
      normalizeText(firstDefined(error4['name'], error4['label'], error4['title'])) ||
      '目标角色' + (value50 + 1),
    role: normalizeText(error4['role']) || '人物',
    appearances: appearances,
    baseAppearanceId: baseAppearanceId,
    imageRefs: appearances['map']((value52) => value52['imageUrl'])['filter'](Boolean),
    voiceReference: voiceReference,
    voiceRef: normalizeText(firstDefined(voiceReference?.['localPath'], voiceReference?.['audioUrl'])),
    description: normalizeText(firstDefined(error4['description'], error4['prompt'])),
  };
}
function normalizeTargetScene(error5 = {}, value53 = 0) {
  const id3 =
      normalizeText(firstDefined(error5['id'], error5['ref'], error5['sceneId'])) ||
      'target-scene-' + (value53 + 1),
    appearances2 = normalizeCharacterAppearances({ ...error5, id: id3 }),
    baseAppearanceId2 = appearances2['some'](
      (value54) => value54['id'] === normalizeText(error5['baseAppearanceId']),
    )
      ? normalizeText(error5['baseAppearanceId'])
      : appearances2[0]?.['id'] || '';
  return {
    ...normalizePlainObject(error5),
    id: id3,
    kind: 'scene',
    name:
      normalizeText(firstDefined(error5['name'], error5['label'], error5['title'])) ||
      '场景' + (value53 + 1),
    role: normalizeText(error5['role']) || '场景',
    appearances: appearances2,
    baseAppearanceId: baseAppearanceId2,
    imageRefs: appearances2['map']((value55) => value55['imageUrl'])['filter'](Boolean),
    description: normalizeText(firstDefined(error5['description'], error5['prompt'])),
  };
}
function normalizeProjectAudioAsset(error6 = {}, value56 = 0) {
  const args4 = normalizePlainObject(error6),
    sourceAssetId = normalizeText(firstDefined(error6['sourceAssetId'], error6['assetId'])),
    sourceItemIndex = Math['max'](
      0,
      Math['trunc'](Number(firstDefined(error6['sourceItemIndex'], error6['itemIndex'], 0)) || 0),
    ),
    sourceUrl = normalizeText(
      firstDefined(error6['audioUrl'], error6['sourceUrl'], error6['url'], error6['localPath']),
    ),
    description = normalizeText(error6['description']),
    text22 = normalizeText(description['match'](/^来自画布素材「(.+)」$/u)?.[1]),
    savedName = normalizeText(error6['savedName']) || text22,
    name3 =
      savedName ||
      normalizeText(firstDefined(error6['name'], error6['assetName'], error6['fileName'])) ||
      '音频 ' + (value56 + 1);
  return {
    ...args4,
    id:
      normalizeText(firstDefined(error6['id'], error6['audioAssetId'])) || 'project-audio-' + (value56 + 1),
    kind: 'audio',
    mediaKind: 'audio',
    name: name3,
    ...(savedName ? { savedName: savedName } : {}),
    role: '音频素材',
    sourceOrigin: normalizeText(error6['sourceOrigin']) || (sourceAssetId ? 'library' : 'project'),
    sourceAssetId: sourceAssetId,
    sourceItemIndex: sourceItemIndex,
    sourceUrl: sourceUrl,
    audioUrl: sourceUrl,
    assetName: normalizeText(error6['assetName']) || name3,
    occurrences: normalizeText(error6['occurrences']) || '当前项目',
    description: description,
    isLibraryAsset: ![],
  };
}
export function getPersonReplacementCharacterBaseImageRef(options15 = {}) {
  const list14 = normalizeCharacterAppearances(options15),
    text23 = normalizeText(options15['baseAppearanceId']),
    value57 = list14['find']((value58) => value58['id'] === text23) || list14[0];
  if (value57?.['imageUrl']) return value57['imageUrl'];
  return (
    normalizeImageRefs(
      firstDefined(
        options15['imageRefs'],
        options15['referenceImages'],
        options15['images'],
        options15['imageRef'],
      ),
    )[0] || ''
  );
}
export function getPersonReplacementShotCharacterReferences(options16 = {}, value59 = {}) {
  const list15 = Array['isArray'](options16?.['characters']) ? options16['characters'] : [],
    map4 = new Map(list15['map']((value60) => [normalizeText(value60?.['id']), value60])),
    map5 = new Map(
      (Array['isArray'](options16?.['mappings']) ? options16['mappings'] : [])
        ['map']((value61) => [
          normalizeText(value61?.['sourceCharacterId']),
          normalizeText(value61?.['targetCharacterId']),
        ])
        ['filter'](([value62, value63]) => value62 && value63),
    );
  return (Array['isArray'](value59?.['people']) ? value59['people'] : [])
    ['map']((value64) => {
      const text24 = normalizeText(value64?.['targetCharacterId']),
        characterId =
          text24 ||
          (value64?.['projectMappingDisabled'] === !![]
            ? ''
            : map5['get'](normalizeText(value64?.['sourceCharacterId']))) ||
          '';
      if (!characterId) return null;
      const error7 = map4['get'](characterId);
      if (!error7) return null;
      const list16 = normalizeCharacterAppearances(error7),
        text25 = normalizeText(value64?.['targetAppearanceId']),
        error8 =
          list16['find']((value65) => normalizeText(value65?.['id']) === text25) ||
          list16['find'](
            (value66) => normalizeText(value66?.['id']) === normalizeText(error7['baseAppearanceId']),
          ) ||
          list16[0] ||
          null;
      return {
        personId: normalizeText(value64?.['id']),
        characterId: characterId,
        characterName: normalizeText(error7['name']) || '人物参考',
        appearanceId: normalizeText(error8?.['id']),
        appearanceName: normalizeText(error8?.['name']) || '基础形象',
        imageRef: normalizeText(error8?.['imageUrl'] || getPersonReplacementCharacterBaseImageRef(error7)),
      };
    })
    ['filter'](Boolean);
}
export function resolvePersonReplacementVideoImageInput(
  options17 = {},
  value67 = {},
  value68 = options17?.['settings']?.['replacementVideoInputMode'],
) {
  const mode = normalizePersonReplacementVideoInputMode(value68),
    text26 = normalizeText(value67?.['id']),
    personReplacementImageResults2 = getPersonReplacementImageResults(value67),
    personReplacementActiveImageResultIndex = getPersonReplacementActiveImageResultIndex(
      value67,
      personReplacementImageResults2,
    ),
    personReplacementImageResultRef3 = resolvePersonReplacementImageResultRef(
      personReplacementImageResults2[personReplacementActiveImageResultIndex],
    ),
    text27 = normalizeText(value67?.['replacementImageRef'] || personReplacementImageResultRef3),
    text28 = normalizeText(value67?.['replacementVideoReferenceSourceShotId']),
    personReplacementImageResultRef4 = resolvePersonReplacementImageResultRef(
      value67?.['replacementVideoReferenceImageRef'],
    ),
    list17 = toArray(options17?.['shots']),
    list18 = list17['some']((value69) => normalizeText(value69?.['id']) === text26)
      ? list17
      : [...list17, value67],
    list19 = list18['map']((value70, sourceShotIndex) => {
      const sourceShotId = normalizeText(value70?.['id']),
        list20 = getPersonReplacementImageResults(value70),
        imageUrl4 = normalizeText(value70?.['replacementImageRef']),
        resultCount = list20['length'] ? list20 : imageUrl4 ? [{ imageUrl: imageUrl4 }] : [];
      if (!resultCount['length']) return null;
      const count13 =
          sourceShotId && sourceShotId === text28 && personReplacementImageResultRef4
            ? resultCount['findIndex'](
                (value71) =>
                  resolvePersonReplacementImageResultRef(value71) === personReplacementImageResultRef4,
              )
            : -1,
        resultIndex =
          count13 >= 0 ? count13 : getPersonReplacementActiveImageResultIndex(value70, resultCount),
        imageRef = list20['length']
          ? resolvePersonReplacementImageResultRef(resultCount[resultIndex])
          : imageUrl4;
      return imageRef
        ? {
            kind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
            imageRef: imageRef,
            sourceShotId: sourceShotId,
            sourceShotIndex: sourceShotIndex,
            resultIndex: resultIndex,
            resultCount: resultCount['length'],
          }
        : null;
    })['filter'](Boolean),
    value72 =
      text28 && personReplacementImageResultRef4
        ? list19['find'](
            (value73) =>
              value73['sourceShotId'] === text28 && value73['imageRef'] === personReplacementImageResultRef4,
          ) || null
        : null,
    value74 =
      list19['find']((value75) => value75['sourceShotId'] === text26 && value75['imageRef'] === text27) ||
      null,
    value76 = value72 || value74;
  if (mode === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE) {
    const references = getPersonReplacementShotCharacterReferences(options17, value67),
      list21 = references['filter']((value77) => normalizeText(value77?.['imageRef']))['map'](
        (imageRef2) => ({
          kind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
          imageRef: imageRef2['imageRef'],
          reference: imageRef2,
        }),
      ),
      referenceOptions = [...list19, ...list21],
      text29 = normalizeText(value67?.['replacementVideoReferenceKind']),
      text30 = normalizeText(value67?.['replacementVideoReferencePersonId']),
      enabled3 = text30
        ? list21['find']((value78) => normalizeText(value78['reference']?.['personId']) === text30) || null
        : null,
      message = Boolean(
        text29 === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE && text30 && !enabled3,
      ),
      value79 = enabled3 || (!text30 ? list21[0] : null) || null,
      referenceKind = message
        ? null
        : (text29 === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE ? value79 : value76) ||
          value76 ||
          value79 ||
          null,
      activeReferenceIndex = referenceOptions['indexOf'](referenceKind),
      status = referenceKind?.['imageRef'] || '',
      value80 = referenceKind?.['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
      reference = message ? null : value79?.['reference'] || references[0] || null;
    return {
      mode: mode,
      status: status ? 'ready' : 'missing',
      imageRef: status,
      selectedImageRef: status,
      referenceKind:
        referenceKind?.['kind'] || (message ? PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE : ''),
      referenceOptions: referenceOptions,
      activeReferenceIndex: activeReferenceIndex,
      reference: reference,
      references: references,
      message: message
        ? '原选中的人物参考图已失效，请重新选择'
        : value80
          ? (reference?.['characterName'] || '人物参考') +
            ' · ' +
            (reference?.['appearanceName'] || '基础形象')
          : status
            ? '替换首帧'
            : references['length']
              ? '当前人物缺少可用参考图'
              : '未绑定人物参考图',
    };
  }
  const referenceOptions2 = list19,
    referenceKind2 = value76,
    status2 = referenceKind2?.['imageRef'] || '',
    activeReferenceIndex2 = referenceOptions2['indexOf'](referenceKind2);
  return {
    mode: mode,
    status: status2 ? 'ready' : 'missing',
    imageRef: status2,
    selectedImageRef: status2,
    referenceKind: referenceKind2?.['kind'] || PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
    referenceOptions: referenceOptions2,
    activeReferenceIndex: activeReferenceIndex2,
    references: [],
    message: status2 ? '替换首帧' : '缺少替换首帧',
  };
}
function normalizeSource(error9 = {}, value81 = 0) {
  const videoRef2 = normalizeText(firstDefined(error9['videoRef'], error9['ref'], error9['url']));
  return {
    id: normalizeText(error9['id']) || 'source-' + (value81 + 1),
    assetId: normalizeText(error9['assetId']),
    videoRef: videoRef2,
    playbackVideoRef: normalizeText(
      firstDefined(error9['playbackVideoRef'], error9['displayLocalPath'], error9['displayUrl']),
    ),
    thumbnailRef: normalizeText(
      firstDefined(
        error9['thumbnailRef'],
        error9['posterLocalPath'],
        error9['thumbLocalPath'],
        error9['posterUrl'],
        error9['thumbUrl'],
      ),
    ),
    fileName: normalizeText(firstDefined(error9['fileName'], error9['name'])),
    durationSec: normalizeNonNegativeNumber(error9['durationSec']),
    processingStatus:
      normalizeText(firstDefined(error9['processingStatus'], error9['analysisStatus'])) || 'idle',
    processingProgress: Math['max'](
      0,
      Math['min'](
        100,
        normalizeNonNegativeNumber(firstDefined(error9['processingProgress'], error9['analysisProgress'])),
      ),
    ),
    order: Number['isInteger'](Number(error9['order'])) ? Number(error9['order']) : value81,
    error: normalizeText(error9['error']),
  };
}
function normalizeSourceCharacter(error10 = {}, value82 = 0) {
  return {
    id:
      normalizeText(firstDefined(error10['id'], error10['ref'], error10['sourceCharacterId'])) ||
      'source-character-' + (value82 + 1),
    name:
      normalizeText(firstDefined(error10['name'], error10['label'], error10['title'])) ||
      '原人物' + (value82 + 1),
    imageRefs: normalizeImageRefs(
      firstDefined(error10['imageRefs'], error10['keyframeRefs'], error10['images']),
    ),
    confidence: normalizeConfidence(firstDefined(error10['confidence'], error10['identityConfidence'])),
    reviewRequired: Boolean(firstDefined(error10['reviewRequired'], error10['needsReview'], ![])),
    identityReviewStatus: IDENTITY_REVIEW_STATUSES['has'](normalizeText(error10['identityReviewStatus']))
      ? normalizeText(error10['identityReviewStatus'])
      : firstDefined(error10['reviewRequired'], error10['needsReview'], ![])
        ? 'needs_review'
        : 'auto',
    memberCount: Math['max'](0, Math['trunc'](normalizeNonNegativeNumber(error10['memberCount']))),
    exemplarShotId: normalizeText(error10['exemplarShotId']),
    exemplarPersonId: normalizeText(error10['exemplarPersonId']),
    ambiguousIdentityIds: toArray(error10['ambiguousIdentityIds'])['map'](normalizeText)['filter'](Boolean),
    notes: normalizeText(firstDefined(error10['notes'], error10['description'])),
  };
}
function normalizeMappings(value83) {
  const list22 = Array['isArray'](value83)
      ? value83
      : value83 && typeof value83 === 'object'
        ? Object['entries'](value83)['map'](([sourceCharacterId2, targetCharacterId]) => ({
            sourceCharacterId: sourceCharacterId2,
            targetCharacterId: targetCharacterId,
          }))
        : [],
    map6 = new Map();
  return (
    list22['forEach']((event) => {
      const sourceCharacterId3 = normalizeText(
          firstDefined(event?.['sourceCharacterId'], event?.['source_character_id'], event?.['source']),
        ),
        targetCharacterId2 = normalizeText(
          firstDefined(event?.['targetCharacterId'], event?.['target_character_id'], event?.['target']),
        );
      if (!sourceCharacterId3 || !targetCharacterId2) return;
      map6['set'](sourceCharacterId3, {
        sourceCharacterId: sourceCharacterId3,
        targetCharacterId: targetCharacterId2,
      });
    }),
    [...map6['values']()]
  );
}
function normalizeAudio(options18 = {}) {
  return {
    strategy: 'full_replace',
    originalAudioRef: normalizeText(options18['originalAudioRef']),
    replacementAudioRef: normalizeText(options18['replacementAudioRef']),
    previewTrack: AUDIO_TRACKS['has'](options18['previewTrack']) ? options18['previewTrack'] : 'replacement',
    exportTrack: AUDIO_TRACKS['has'](options18['exportTrack']) ? options18['exportTrack'] : 'replacement',
    composeStatus: normalizeGenerationStatus(options18['composeStatus']),
    selectedSourceId: normalizeText(options18['selectedSourceId']),
    voiceStudioState: normalizePlainObject(options18['voiceStudioState']),
    voiceSeparationsBySourceId: normalizePersonReplacementVoiceSeparationsBySourceId(
      options18['voiceSeparationsBySourceId'],
    ),
  };
}
export function normalizePersonReplacementProject(providerProfileId = {}) {
  const text31 = normalizeText(providerProfileId['status']),
    characters = toArray(
      firstDefined(providerProfileId['characters'], providerProfileId['targetCharacters'], []),
    )['map'](normalizeTargetCharacter),
    source3 = normalizeSource({
      ...(providerProfileId['source'] || {}),
      videoRef: firstDefined(
        providerProfileId['source']?.['videoRef'],
        providerProfileId['videoRef'],
        providerProfileId['sourceVideoRef'],
      ),
      fileName: firstDefined(
        providerProfileId['source']?.['fileName'],
        providerProfileId['source']?.['name'],
        providerProfileId['fileName'],
      ),
      durationSec: firstDefined(
        providerProfileId['source']?.['durationSec'],
        providerProfileId['durationSec'],
      ),
    }),
    sources = (
      Array['isArray'](providerProfileId['sources']) && providerProfileId['sources']['length']
        ? providerProfileId['sources']
        : source3['videoRef'] || source3['fileName']
          ? [source3]
          : []
    )
      ['map'](normalizeSource)
      ['sort']((value84, value85) => value84['order'] - value85['order']),
    source4 = sources[0] || source3,
    model =
      normalizeText(providerProfileId['settings']?.['replacementImageModelId']) ||
      PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    replacementImageProvider = resolveModelProvider(
      model,
      normalizeText(providerProfileId['settings']?.['replacementImageProvider']),
    ),
    replacementImageProviderProfileId = buildModelProviderProfileSelectionPatch(
      {
        model: model,
        providerProfileId: providerProfileId['settings']?.['replacementImageProviderProfileId'],
        providerProfileIdByModel: providerProfileId['settings']?.['replacementImageProviderProfileIdByModel'],
      },
      model,
      providerProfileId['settings']?.['replacementImageProviderProfileId'],
    ),
    model2 =
      normalizeText(providerProfileId['settings']?.['characterImageModelId']) ||
      PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
    characterImageProviderProfileId = buildModelProviderProfileSelectionPatch(
      {
        model: model2,
        providerProfileId: providerProfileId['settings']?.['characterImageProviderProfileId'],
        providerProfileIdByModel: providerProfileId['settings']?.['characterImageProviderProfileIdByModel'],
      },
      model2,
      providerProfileId['settings']?.['characterImageProviderProfileId'],
    ),
    text32 = normalizeText(providerProfileId['settings']?.['replacementModelId']),
    modelId3 = resolvePersonReplacementVideoModelId(text32),
    generationParams3 = Boolean(text32 && text32 !== modelId3),
    inputMode3 = normalizePersonReplacementVideoInputMode(
      providerProfileId['settings']?.['replacementVideoInputMode'],
    ),
    replacementVideoGenerationParams = resolvePersonReplacementVideoParameterPolicy({
      modelId: modelId3,
      inputMode: inputMode3,
      generationParams: generationParams3
        ? {}
        : normalizePlainObject(providerProfileId['settings']?.['replacementVideoGenerationParams']),
    }),
    replacementVideoProviderProfileId = buildModelProviderProfileSelectionPatch(
      {
        model: modelId3,
        providerProfileId: providerProfileId['settings']?.['replacementVideoProviderProfileId'],
        providerProfileIdByModel: providerProfileId['settings']?.['replacementVideoProviderProfileIdByModel'],
      },
      modelId3,
      providerProfileId['settings']?.['replacementVideoProviderProfileId'],
    ),
    shots = reconcilePersonReplacementVideoReferenceSelections(
      toArray(providerProfileId['shots'])['map'](normalizePersonReplacementShot),
    );
  return {
    schemaVersion: PERSON_REPLACEMENT_SCHEMA_VERSION,
    id: normalizeText(providerProfileId['id']),
    title: normalizeText(providerProfileId['title']) || '未命名人物替换项目',
    status: STATUS_INDEX['has'](text31) ? text31 : 'draft',
    source: source4,
    sources: sources,
    settings: {
      replacementModelId: modelId3,
      replacementVideoInputMode: inputMode3,
      replacementImageModelId: model,
      replacementImageProvider: replacementImageProvider,
      replacementImageProviderProfileId: replacementImageProviderProfileId['providerProfileId'],
      replacementImageProviderProfileIdByModel: replacementImageProviderProfileId['providerProfileIdByModel'],
      replacementVideoProviderProfileId: replacementVideoProviderProfileId['providerProfileId'],
      replacementVideoProviderProfileIdByModel: replacementVideoProviderProfileId['providerProfileIdByModel'],
      characterImageModelId: model2,
      characterImageProvider:
        normalizeText(providerProfileId['settings']?.['characterImageProvider']) || 'apimart',
      characterImageProviderProfileId: characterImageProviderProfileId['providerProfileId'],
      characterImageProviderProfileIdByModel: characterImageProviderProfileId['providerProfileIdByModel'],
      characterImageGenerationParams: normalizePlainObject(
        providerProfileId['settings']?.['characterImageGenerationParams'],
      ),
      characterImageGenerationParamsByModel: normalizeParamsByModel(
        providerProfileId['settings']?.['characterImageGenerationParamsByModel'],
      ),
      replacementImageGenerationParams: normalizePlainObject(
        providerProfileId['settings']?.['replacementImageGenerationParams'],
      ),
      replacementImageGenerationParamsByModel: normalizeParamsByModel(
        providerProfileId['settings']?.['replacementImageGenerationParamsByModel'],
      ),
      replacementPromptEnhancementEnabled:
        providerProfileId['settings']?.['replacementPromptEnhancementEnabled'] === !![],
      replacementVideoGenerationParams: replacementVideoGenerationParams['generationParams'],
      smartClipMode: normalizeSmartClipMode(
        firstDefined(providerProfileId['settings']?.['smartClipMode'], 'balanced'),
      ),
      smartClipFps: normalizeSmartClipFps(providerProfileId['settings']?.['smartClipFps']),
      processingMode: providerProfileId['settings']?.['processingMode'] === 'skip' ? 'skip' : 'cut',
      automationMode: providerProfileId['settings']?.['automationMode'] === 'auto' ? 'auto' : 'review',
      confidenceThreshold: normalizeConfidence(
        firstDefined(providerProfileId['settings']?.['confidenceThreshold'], 0.75),
      ),
      identityAutoThreshold: normalizeConfidence(
        firstDefined(providerProfileId['settings']?.['identityAutoThreshold'], 0.78),
      ),
      identityReviewThreshold: normalizeConfidence(
        firstDefined(providerProfileId['settings']?.['identityReviewThreshold'], 0.68),
      ),
      identityAmbiguityMargin: normalizeConfidence(
        firstDefined(providerProfileId['settings']?.['identityAmbiguityMargin'], 0.06),
      ),
    },
    characters: characters,
    scenes: toArray(providerProfileId['scenes'])['map'](normalizeTargetScene),
    audioAssets: toArray(providerProfileId['audioAssets'])
      ['map'](normalizeProjectAudioAsset)
      ['filter']((value86) => value86['audioUrl']),
    sourceCharacters: toArray(providerProfileId['sourceCharacters'])['map'](normalizeSourceCharacter),
    mappings: normalizeMappings(providerProfileId['mappings']),
    shots: shots,
    audio: normalizeAudio(providerProfileId['audio']),
    output: {
      originalMasterRef: normalizeText(providerProfileId['output']?.['originalMasterRef']),
      visualMasterRef: normalizeText(providerProfileId['output']?.['visualMasterRef']),
      finalVideoRef: normalizeText(providerProfileId['output']?.['finalVideoRef']),
      finalAudioTrack: AUDIO_TRACKS['has'](providerProfileId['output']?.['finalAudioTrack'])
        ? providerProfileId['output']['finalAudioTrack']
        : '',
      composeStatus: normalizeGenerationStatus(providerProfileId['output']?.['composeStatus']),
      composedShotIds: toArray(providerProfileId['output']?.['composedShotIds'])
        ['map'](normalizeText)
        ['filter'](Boolean),
      canvasBinding: normalizePlainObject(providerProfileId['output']?.['canvasBinding']),
    },
    archivedAt: normalizeNonNegativeNumber(providerProfileId['archivedAt']),
    createdAt: normalizeText(providerProfileId['createdAt']),
    updatedAt: normalizeText(providerProfileId['updatedAt']),
  };
}
export function createPersonReplacementProject(options19 = {}) {
  return normalizePersonReplacementProject(options19);
}
export function canTransitionPersonReplacementProject(value87, value88) {
  const value89 = STATUS_INDEX['get'](normalizeText(value87)),
    value90 = STATUS_INDEX['get'](normalizeText(value88));
  if (value89 === undefined || value90 === undefined) return ![];
  return value90 === value89 || value90 === value89 + 1;
}
export function transitionPersonReplacementProject(value91, value92) {
  const response7 = normalizePersonReplacementProject(value91);
  if (!canTransitionPersonReplacementProject(response7['status'], value92))
    throw new Error(
      '[personReplacementProject] invalid status transition: ' +
        response7['status'] +
        ' -> ' +
        normalizeText(value92),
    );
  return { ...response7, status: normalizeText(value92) };
}
export function setPersonReplacementCharacterMapping(
  value93,
  { sourceCharacterId: sourceCharacterId4, targetCharacterId: targetCharacterId3 } = {},
) {
  const args5 = normalizePersonReplacementProject(value93),
    sourceCharacterId5 = normalizeText(sourceCharacterId4),
    targetCharacterId4 = normalizeText(targetCharacterId3);
  if (!sourceCharacterId5) throw new Error('[personReplacementProject] sourceCharacterId is required');
  const mappings = args5['mappings']['filter'](
    (value94) => value94['sourceCharacterId'] !== sourceCharacterId5,
  );
  if (targetCharacterId4)
    mappings['push']({ sourceCharacterId: sourceCharacterId5, targetCharacterId: targetCharacterId4 });
  return { ...args5, mappings: mappings };
}
export function resolvePersonReplacementTargetCharacterId(value95, value96) {
  const personReplacementProject = normalizePersonReplacementProject(value95),
    value97 = value96 && typeof value96 === 'object' ? value96 : null,
    text33 = normalizeText(value97?.['targetCharacterId']);
  if (text33) return text33;
  if (value97?.['projectMappingDisabled'] === !![]) return '';
  const text34 = normalizeText(value97 ? value97['sourceCharacterId'] : value96);
  return (
    personReplacementProject['mappings']['find']((value98) => value98['sourceCharacterId'] === text34)?.[
      'targetCharacterId'
    ] || ''
  );
}
export function getPersonReplacementCrossRoleSourceCharacterIds(options20 = {}) {
  const map7 = new Map();
  return (
    toArray(options20?.['shots'])['forEach']((value99) => {
      toArray(value99?.['people'])['forEach']((value100) => {
        const text35 = normalizeText(value100?.['sourceCharacterId']),
          text36 = normalizeText(value100?.['label']);
        if (!text35 || !text36) return;
        const value101 = map7['get'](text35) || new Set();
        (value101['add'](text36), map7['set'](text35, value101));
      });
    }),
    new Set(
      [...map7['entries']()]
        ['filter'](([, value102]) => value102['size'] > 1)
        ['map'](([value103]) => value103),
    )
  );
}
export function getPersonReplacementBindingOccurrences(
  value104,
  { shotId: shotId = '', personId: personId = '' } = {},
) {
  const text37 = normalizeText(shotId),
    text38 = normalizeText(personId),
    list23 = toArray(value104?.['shots']),
    value105 = list23['find']((value106) => normalizeText(value106?.['id']) === text37),
    toArray2 = toArray(value105?.['people'])['find'](
      (value107) => normalizeText(value107?.['id']) === text38,
    );
  if (!toArray2) return [];
  const text39 = normalizeText(toArray2['sourceCharacterId']),
    text40 = normalizeText(toArray2['label']);
  return list23['flatMap']((value108) =>
    toArray(value108?.['people'])['flatMap']((value109) => {
      const shotId3 = normalizeText(value108?.['id']),
        personId2 = normalizeText(value109?.['id']),
        enabled4 = shotId3 === text37 && personId2 === text38,
        enabled5 = text40
          ? normalizeText(value109?.['label']) === text40
          : Boolean(text39 && normalizeText(value109?.['sourceCharacterId']) === text39);
      if (!enabled4 && !enabled5) return [];
      return [
        {
          shotId: shotId3,
          personId: personId2,
          sourceCharacterId: normalizeText(value109?.['sourceCharacterId']),
        },
      ];
    }),
  );
}
function collectSourceIdentityOccurrences(value110, value111) {
  const text41 = normalizeText(value111);
  return toArray(value110?.['shots'])['flatMap']((shot) =>
    toArray(shot?.['people'])
      ['filter']((value112) => normalizeText(value112?.['sourceCharacterId']) === text41)
      ['map']((person) => ({ shot: shot, person: person })),
  );
}
export function mergePersonReplacementSourceCharacters(
  args6,
  { sourceCharacterIds: sourceCharacterIds = [], keepSourceCharacterId: keepSourceCharacterId = '' } = {},
) {
  const list24 = [...new Set(toArray(sourceCharacterIds)['map'](normalizeText)['filter'](Boolean))];
  if (list24['length'] < 2) throw new Error('合并人物至少需要选择两个身份');
  const map8 = new Set(list24),
    id4 = map8['has'](normalizeText(keepSourceCharacterId))
      ? normalizeText(keepSourceCharacterId)
      : list24[0];
  for (const value113 of toArray(args6?.['shots'])) {
    const list25 = toArray(value113?.['people'])['filter']((value114) =>
      map8['has'](normalizeText(value114?.['sourceCharacterId'])),
    );
    if (list25['length'] > 1) throw new Error('同一镜头中同时出现的人物不能合并为同一身份');
  }
  const args7 = new Set();
  (toArray(args6?.['mappings'])['forEach']((value115) => {
    map8['has'](normalizeText(value115?.['sourceCharacterId'])) &&
      value115?.['targetCharacterId'] &&
      args7['add'](normalizeText(value115['targetCharacterId']));
  }),
    toArray(args6?.['shots'])['forEach']((value116) =>
      toArray(value116?.['people'])['forEach']((value117) => {
        map8['has'](normalizeText(value117?.['sourceCharacterId'])) &&
          value117?.['targetCharacterId'] &&
          args7['add'](normalizeText(value117['targetCharacterId']));
      }),
    ));
  if (args7['size'] > 1) throw new Error('所选人物已经映射到不同目标人物，请先统一映射后再合并');
  const targetCharacterId5 = [...args7][0] || '',
    list26 = toArray(args6?.['sourceCharacters']),
    confidence = list26['filter']((value118) => map8['has'](value118['id'])),
    label3 = confidence['find']((value119) => value119['id'] === id4) ||
      confidence[0] || { id: id4, name: '原人物' },
    value120 = {
      ...label3,
      id: id4,
      imageRefs: [...new Set(confidence['flatMap']((value121) => toArray(value121['imageRefs'])))],
      confidence: confidence['length']
        ? Math['min'](...confidence['map']((value122) => normalizeConfidence(value122['confidence'])))
        : 0,
      reviewRequired: ![],
      identityReviewStatus: 'confirmed',
      memberCount: confidence['reduce'](
        (value123, value124) => value123 + Math['max'](0, Number(value124['memberCount']) || 0),
        0,
      ),
      ambiguousIdentityIds: [
        ...new Set(confidence['flatMap']((value125) => toArray(value125['ambiguousIdentityIds']))),
      ]['filter']((value126) => !map8['has'](value126)),
      notes: '人工合并人物身份',
    },
    mappings2 = toArray(args6?.['mappings'])['filter'](
      (value127) => !map8['has'](normalizeText(value127?.['sourceCharacterId'])),
    );
  if (targetCharacterId5)
    mappings2['push']({ sourceCharacterId: id4, targetCharacterId: targetCharacterId5 });
  return {
    ...args6,
    shots: toArray(args6?.['shots'])['map']((args8) => ({
      ...args8,
      people: toArray(args8?.['people'])['map']((args9) =>
        map8['has'](normalizeText(args9?.['sourceCharacterId']))
          ? {
              ...args9,
              sourceCharacterId: id4,
              label: label3['name'] || args9['label'],
              targetCharacterId: targetCharacterId5 || args9['targetCharacterId'] || '',
              identityReviewStatus: 'confirmed',
              identityReviewRequired: ![],
              identityMethod: 'manual',
              ambiguousIdentityIds: toArray(args9['ambiguousIdentityIds'])['filter'](
                (value128) => !map8['has'](value128),
              ),
            }
          : args9,
      ),
    })),
    sourceCharacters: [...list26['filter']((value129) => !map8['has'](value129['id'])), value120],
    mappings: mappings2,
  };
}
export function splitPersonReplacementSourceCharacter(
  args10,
  {
    sourceCharacterId: sourceCharacterId6,
    occurrences: occurrences = [],
    newSourceCharacterId: newSourceCharacterId = '',
  } = {},
) {
  const id5 = normalizeText(sourceCharacterId6);
  if (!id5) throw new Error('拆分人物缺少原身份');
  const map9 = new Set(
    toArray(occurrences)
      ['map']((value130) => normalizeText(value130?.['shotId']) + ':' + normalizeText(value130?.['personId']))
      ['filter']((value131) => value131 !== ':'),
  );
  if (!map9['size']) throw new Error('请先选择要拆分的人物框');
  const list27 = collectSourceIdentityOccurrences(args10, id5),
    memberCount = list27['filter'](({ shot: shot2, person: person2 }) =>
      map9['has'](shot2['id'] + ':' + person2['id']),
    );
  if (!memberCount['length']) throw new Error('没有找到要拆分的人物框');
  if (memberCount['length'] >= list27['length'] && list27['length'] > 1)
    throw new Error('不能把该身份的全部人物框拆分出去');
  if (list27['length'] === 1) {
    const value132 = memberCount[0]['person'],
      label4 = normalizeText(value132['label']) || formatPersonReplacementPersonLabel(0);
    return {
      ...args10,
      shots: toArray(args10?.['shots'])['map']((args11) => ({
        ...args11,
        people: toArray(args11?.['people'])['map']((args12) =>
          normalizeText(args12?.['sourceCharacterId']) === id5
            ? {
                ...args12,
                label: label4,
                identityReviewStatus: 'needs_review',
                identityReviewRequired: !![],
                identityMethod: 'manual',
                ambiguousIdentityIds: [],
              }
            : args12,
        ),
      })),
      sourceCharacters: toArray(args10?.['sourceCharacters'])['map']((args13) =>
        args13['id'] === id5
          ? {
              ...args13,
              name: label4,
              reviewRequired: !![],
              identityReviewStatus: 'needs_review',
              ambiguousIdentityIds: [],
              notes: '人工纠正人物身份',
            }
          : args13,
      ),
    };
  }
  const map10 = new Set(toArray(args10?.['sourceCharacters'])['map']((value133) => value133['id']));
  let sourceCharacterId7 = normalizeText(newSourceCharacterId) || id5 + '-split-' + (map10['size'] + 1),
    value134 = 2;
  while (map10['has'](sourceCharacterId7)) {
    ((sourceCharacterId7 = id5 + '-split-' + (map10['size'] + value134)), (value134 += 1));
  }
  const error11 = toArray(args10?.['sourceCharacters'])['find']((value135) => value135['id'] === id5) || {
      id: id5,
      name: '原人物',
    },
    imageRefs = [
      ...new Set(memberCount['map'](({ shot: shot3 }) => shot3['keyframeRef'])['filter'](Boolean)),
    ],
    label5 =
      normalizeText(memberCount[0]['person']['label']) ||
      normalizeText(error11['name']) ||
      formatPersonReplacementPersonLabel(0);
  return {
    ...args10,
    shots: toArray(args10?.['shots'])['map']((args14) => ({
      ...args14,
      people: toArray(args14?.['people'])['map']((args15) =>
        normalizeText(args15?.['sourceCharacterId']) === id5 && map9['has'](args14['id'] + ':' + args15['id'])
          ? {
              ...args15,
              sourceCharacterId: sourceCharacterId7,
              label: label5,
              targetCharacterId: '',
              targetAppearanceId: '',
              identityReviewStatus: 'needs_review',
              identityReviewRequired: !![],
              identityMethod: 'manual',
              ambiguousIdentityIds: [],
            }
          : args15,
      ),
    })),
    sourceCharacters: [
      ...toArray(args10?.['sourceCharacters'])['map']((args16) =>
        args16['id'] === id5
          ? {
              ...args16,
              memberCount: Math['max'](
                0,
                (Number(args16['memberCount']) || list27['length']) - memberCount['length'],
              ),
            }
          : args16,
      ),
      {
        id: sourceCharacterId7,
        name: label5,
        imageRefs: imageRefs,
        confidence: Math['min'](
          ...memberCount['map'](({ person: person3 }) => normalizeConfidence(person3['identityConfidence'])),
        ),
        reviewRequired: !![],
        identityReviewStatus: 'needs_review',
        memberCount: memberCount['length'],
        exemplarShotId: memberCount[0]['shot']['id'],
        exemplarPersonId: memberCount[0]['person']['id'],
        ambiguousIdentityIds: [],
        notes: '人工拆分人物身份',
      },
    ],
    mappings: toArray(args10?.['mappings'])['filter'](
      (value136) => normalizeText(value136?.['sourceCharacterId']) !== sourceCharacterId7,
    ),
  };
}
export function confirmPersonReplacementSourceCharacter(
  args17,
  {
    sourceCharacterId: sourceCharacterId8,
    targetSourceCharacterId: targetSourceCharacterId = '',
    shotId: shotId = '',
    personId: personId = '',
    label: label = '',
    orientation: orientation = '',
  } = {},
) {
  const text42 = normalizeText(sourceCharacterId8);
  if (!text42) throw new Error('确认人物缺少身份');
  const text43 = normalizeText(targetSourceCharacterId) || text42,
    text44 = normalizeText(shotId),
    text45 = normalizeText(personId),
    label6 = normalizeText(label),
    personReplacementOrientation = normalizePersonReplacementOrientation(orientation),
    enabled6 = text43 !== text42;
  if (enabled6 && (!text44 || !text45)) throw new Error('切换人物身份时必须指定当前人物框');
  const sourceCharacters = toArray(args17?.['sourceCharacters']),
    enabled7 =
      sourceCharacters['some']((value137) => normalizeText(value137?.['id']) === text43) ||
      toArray(args17?.['shots'])['some']((value138) =>
        toArray(value138?.['people'])['some'](
          (value139) => normalizeText(value139?.['sourceCharacterId']) === text43,
        ),
      );
  if (enabled6 && !enabled7) throw new Error('选择的人物身份不存在');
  const toArray3 = toArray(args17?.['shots'])['find'](
      (value140) => normalizeText(value140?.['id']) === text44,
    ),
    toArray4 = toArray(toArray3?.['people'])['find'](
      (value141) => normalizeText(value141?.['id']) === text45,
    );
  if (enabled6 && (!toArray4 || normalizeText(toArray4['sourceCharacterId']) !== text42))
    throw new Error('没有找到要切换身份的人物框');
  const enabled8 =
      enabled6 &&
      toArray(toArray3?.['people'])['some'](
        (value142) =>
          normalizeText(value142?.['id']) !== text45 &&
          normalizeText(value142?.['sourceCharacterId']) === text43,
      ),
    toArray5 = toArray(args17?.['mappings'])['find'](
      (value143) => normalizeText(value143?.['sourceCharacterId']) === text43,
    ),
    toArray6 = toArray(args17?.['shots'])
      ['flatMap']((value144) => toArray(value144?.['people']))
      ['find'](
        (value145) =>
          normalizeText(value145?.['sourceCharacterId']) === text43 &&
          normalizeText(value145?.['targetCharacterId']),
      ),
    targetCharacterId6 =
      normalizeText(toArray5?.['targetCharacterId']) || normalizeText(toArray6?.['targetCharacterId']),
    targetAppearanceId = targetCharacterId6
      ? normalizeText(
          toArray(args17?.['shots'])
            ['flatMap']((value146) => toArray(value146?.['people']))
            ['find'](
              (value147) =>
                normalizeText(value147?.['sourceCharacterId']) === text43 &&
                normalizeText(value147?.['targetCharacterId']) === targetCharacterId6 &&
                normalizeText(value147?.['targetAppearanceId']),
            )?.['targetAppearanceId'],
        )
      : '',
    shots2 = toArray(args17?.['shots'])['map']((args18) => ({
      ...args18,
      people: toArray(args18?.['people'])['map']((args19) => {
        const text46 = normalizeText(args19?.['sourceCharacterId']) === text42;
        if (!text46) return args19;
        const enabled9 = (!text44 || args18['id'] === text44) && (!text45 || args19['id'] === text45);
        if (enabled6 && !enabled9) return args19;
        const sourceCharacterId9 = enabled6 && !enabled8;
        return {
          ...args19,
          ...(enabled9
            ? {
                sourceCharacterId: sourceCharacterId9 ? text43 : args19['sourceCharacterId'],
                label: label6 || args19['label'],
                ...(sourceCharacterId9
                  ? {
                      targetCharacterId: targetCharacterId6,
                      targetAppearanceId: targetAppearanceId,
                      identityMethod: 'manual',
                    }
                  : {}),
              }
            : {}),
          orientation: orientation && enabled9 ? personReplacementOrientation : args19['orientation'],
          orientationConfidence: orientation && enabled9 ? 1 : args19['orientationConfidence'],
          orientationModelId: orientation && enabled9 ? '' : args19['orientationModelId'],
          identityReviewStatus: 'confirmed',
          identityReviewRequired: ![],
          ambiguousIdentityIds: [],
        };
      }),
    })),
    map11 = new Set(
      shots2['flatMap']((value148) =>
        toArray(value148['people'])['map']((value149) => normalizeText(value149?.['sourceCharacterId'])),
      )['filter'](Boolean),
    );
  return {
    ...args17,
    shots: shots2,
    sourceCharacters: sourceCharacters['map']((error12) =>
      normalizeText(error12?.['id']) === text43
        ? {
            ...error12,
            name: label6 || error12['name'],
            reviewRequired: ![],
            identityReviewStatus: 'confirmed',
            ambiguousIdentityIds: [],
          }
        : error12,
    )['filter'](
      (value150) => !enabled6 || normalizeText(value150?.['id']) !== text42 || map11['has'](text42),
    ),
    mappings: toArray(args17?.['mappings'])['filter'](
      (value151) =>
        !enabled6 || normalizeText(value151?.['sourceCharacterId']) !== text42 || map11['has'](text42),
    ),
  };
}
export function normalizePersonReplacementAiAnalysis(value152, { existingShots: existingShots = [] } = {}) {
  const unwrapAiAnalysis2 = unwrapAiAnalysis(value152);
  let list28;
  Array['isArray'](unwrapAiAnalysis2)
    ? (list28 = unwrapAiAnalysis2)
    : ((list28 = firstDefined(
        unwrapAiAnalysis2?.['shots'],
        unwrapAiAnalysis2?.['segments'],
        unwrapAiAnalysis2?.['clips'],
        unwrapAiAnalysis2?.['keyframes'],
      )),
      !Array['isArray'](list28) &&
        (list28 = unwrapAiAnalysis2 && typeof unwrapAiAnalysis2 === 'object' ? [unwrapAiAnalysis2] : []));
  const list29 = toArray(existingShots)['map'](normalizePersonReplacementShot);
  return list28['map']((args20, value153) => {
    const id6 = normalizeText(
        firstDefined(
          args20?.['id'],
          args20?.['shotId'],
          args20?.['shot_id'],
          args20?.['segmentId'],
          args20?.['clipId'],
        ),
      ),
      args21 = list29['find']((value154) => value154['id'] === id6) || list29[value153] || {};
    return normalizePersonReplacementShot(
      {
        ...args21,
        ...args20,
        id: id6 || args21['id'],
        people: extractPeople(args20),
        analysisStatus: 'succeeded',
      },
      value153,
    );
  });
}
