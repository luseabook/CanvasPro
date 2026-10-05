import {
  isAdaptiveRatioLabel,
  pickClosestRatioForProviderModel,
  resolveAdaptiveSourceSize,
} from '../../../api/imageRatioPolicy.js';
import { getModelManifest, resolveModelProvider } from '../../manifests/index.js';
import { normalizeCharacterAssetImageGenerationParams } from '../characterAssets/characterAssetImageGeneration.js';
import {
  applyWorkspaceCharacterAssetPromptPreset,
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID,
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS,
} from '../workspaceAssetPromptPresets.js';
import {
  getPersonReplacementImageResults,
  resolvePersonReplacementImageSourceRef,
  resolvePersonReplacementImageResultRef,
} from './personReplacementProject.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import {
  composePersonReplacementImagePrompt,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
} from './personReplacementPromptMode.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { getPersonReplacementPromptReferenceReviewMessage } from './personReplacementPromptReferenceReview.js';
import { resolvePersonReplacementPromptMentionRef } from './personReplacementPromptMentions.js';
import { resolvePromptTextWithTextRefs, sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import {
  getRecoverablePersonReplacementGenerationTask,
  isPersonReplacementGenerationTaskActive,
  normalizePersonReplacementGenerationTaskIdentity,
} from './personReplacementGenerationTaskIdentity.js';
export const PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS = Object['freeze'](
  WORKSPACE_CHARACTER_ASSET_PROMPT_PRESETS['filter']((value) =>
    [WORKSPACE_CHARACTER_ASSET_PROMPT_PRESET_NONE_ID, 'character-three-view', 'character-three-view-face'][
      'includes'
    ](value['id']),
  ),
);
const PERSON_REPLACEMENT_DEFAULT_ASSET_PROMPT_PRESET_ID =
    PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS['find'](
      (item) => item['id'] === 'character-three-view',
    )?.['id'] ||
    PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS[0]?.['id'] ||
    'character-three-view',
  PERSON_REPLACEMENT_IMAGE_GENERATION_STATUSES = new Set([
    'idle',
    'queued',
    'submitting',
    'running',
    'succeeded',
    'failed',
  ]);
function normalizeText(key) {
  return String(key ?? '')['trim']();
}
function normalizePromptEnhancementSnapshot(options = {}) {
  const index = options && typeof options === 'object' && !Array['isArray'](options) ? options : {},
    text = normalizeText(index['prompt']);
  if (!text) return null;
  return {
    prompt: text,
    modelId: normalizeText(index['modelId']),
    provider: normalizeText(index['provider']),
    providerProfileId: normalizeText(index['providerProfileId']),
    createdAt: normalizeText(index['createdAt']),
    analysis:
      index['analysis'] && typeof index['analysis'] === 'object' && !Array['isArray'](index['analysis'])
        ? index['analysis']
        : {},
  };
}
function getPositiveSize(box = {}) {
  const count = Number(box?.['width']),
    count2 = Number(box?.['height']);
  return Number['isFinite'](count) && count > 0 && Number['isFinite'](count2) && count2 > 0
    ? { width: count, height: count2 }
    : null;
}
function stableSerialize(result) {
  if (result === null || typeof result !== 'object') return JSON['stringify'](result);
  if (Array['isArray'](result))
    return '[' + result['map']((data) => stableSerialize(data))['join'](',') + ']';
  return (
    '{' +
    Object['keys'](result)
      ['filter']((target) => result[target] !== undefined)
      ['sort']()
      ['map']((source) => JSON['stringify'](source) + ':' + stableSerialize(result[source]))
      ['join'](',') +
    '}'
  );
}
export function createPersonReplacementImagePromptRequestResolver({
  documentObject: documentObject = null,
} = {}) {
  return ({ project: project = {}, shot: shot = {}, promptPackage: promptPackage = {} } = {}) => {
    const personReplacementPromptReferenceReviewMessage = getPersonReplacementPromptReferenceReviewMessage(
      shot,
      promptPackage,
    );
    if (personReplacementPromptReferenceReviewMessage)
      throw new Error(personReplacementPromptReferenceReviewMessage);
    const text2 = normalizeText(shot['imagePrompt']),
      modelManifest = getModelManifest(project['settings']?.['replacementImageModelId'])?.['extensions']?.[
        'personReplacement'
      ]?.['imageMentionFormat'],
      el = text2 ? (documentObject || globalThis['document'])?.['createElement']?.('div') : null,
      next = [];
    let promptTextWithTextRefs = text2;
    return (
      el &&
        ((el['innerHTML'] = sanitizePromptHtmlForCommit(text2)),
        el['querySelectorAll']?.('.ref-pill')['forEach']((current) => {
          const personReplacementPromptMentionRef = resolvePersonReplacementPromptMentionRef(current, {
              project: project,
              promptPackage: promptPackage,
              shot: shot,
            }),
            handler = (entry) =>
              (localPathToUrl(entry['ref']) || entry['ref']) === personReplacementPromptMentionRef?.['url'],
            record =
              promptPackage['referenceImages']?.['find'](
                (handle) => handle['slot'] === personReplacementPromptMentionRef?.['referenceSlot'],
              ) ||
              promptPackage['referenceImages']?.['find'](
                (state) =>
                  handler(state) &&
                  (state['targetCharacterId'] || state['targetSceneId']) ===
                    personReplacementPromptMentionRef?.['assetId'],
              ) ||
              promptPackage['referenceImages']?.['find'](handler);
          if (record)
            current['replaceWith'](
              el['ownerDocument']['createTextNode'](
                modelManifest === 'at-image' ? '@图片' + record['slot'] : '图' + record['slot'],
              ),
            );
        }),
        (promptTextWithTextRefs = resolvePromptTextWithTextRefs({
          promptEl: el,
          assetInputRefs: next,
          assetMediaCounts: {
            image: promptPackage['referenceImages']?.['length'] || 0,
            video: 0,
            audio: 0,
          },
          allowedAssetTypes: ['image'],
          resolveAssetMentionRef: (config) =>
            resolvePersonReplacementPromptMentionRef(config, {
              project: project,
              promptPackage: promptPackage,
              shot: shot,
            }),
          dedupeAssetMentions: true,
        }))),
      {
        savedPrompt: text2,
        requestPrompt: composePersonReplacementImagePrompt(promptPackage, promptTextWithTextRefs),
        promptAssetRefs: next,
      }
    );
  };
}
export function createPersonReplacementImageGenerationMappingRevision({
  project: project = {},
  shot: shot = {},
} = {}) {
  const personReplacementPromptPackage = buildPersonReplacementPromptPackage({
    project: project,
    shot: shot,
  });
  return stableSerialize({
    shot: {
      id: normalizeText(shot['id']),
      keyframeRef: normalizeText(shot['keyframeRef']),
      imageSourceRef: resolvePersonReplacementImageSourceRef(shot),
      frame: shot['frame'],
      sceneReference: shot['sceneReference'],
      people: (Array['isArray'](shot['people']) ? shot['people'] : [])['map']((scope) => ({
        id: normalizeText(scope['id']),
        sourceCharacterId: normalizeText(scope['sourceCharacterId']),
        targetCharacterId: normalizeText(scope['targetCharacterId']),
        targetAppearanceId: normalizeText(scope['targetAppearanceId']),
        label: normalizeText(scope['label']),
        replacementScope: normalizeText(scope['replacementScope']),
        bbox: scope['locator']?.['bbox'] || scope['bbox'],
      })),
    },
    prompt: {
      mode: personReplacementPromptPackage['promptMode'],
      bindingPrompt: personReplacementPromptPackage['bindingPrompt'],
      references: personReplacementPromptPackage['referenceImages']['map']((input) => ({
        role: normalizeText(input['role']),
        ref: normalizeText(input['ref']),
        targetCharacterId: normalizeText(input['targetCharacterId']),
        targetAppearanceId: normalizeText(input['targetAppearanceId']),
        targetSceneId: normalizeText(input['targetSceneId']),
        targetSceneAppearanceId: normalizeText(input['targetSceneAppearanceId']),
      })),
      unmappedPersonIds: personReplacementPromptPackage['unmappedPersonIds'],
      missingLocatorPersonIds: personReplacementPromptPackage['missingLocatorPersonIds'],
      unresolvedOrientationPersonIds: personReplacementPromptPackage['unresolvedOrientationPersonIds'],
      overflowPersonIds: personReplacementPromptPackage['overflowPersonIds'],
    },
  });
}
export function createPersonReplacementImageGenerationRequestRevision({
  project: project = {},
  shot: shot = {},
  payload: payload = {},
  sourceImageSize: sourceImageSize = {},
} = {}) {
  const output =
      shot['replacementPromptMode'] === 'positioning'
        ? buildPersonReplacementPromptPackage({ project: project, shot: shot })
        : null,
    value2 = output?.['locationGuideSlot'] || 0,
    value3 = output?.['referenceImages'][value2 - 1]?.['ref'] || '';
  return stableSerialize({
    mappingRevision: createPersonReplacementImageGenerationMappingRevision({ project: project, shot: shot }),
    payload:
      shot['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_TEST &&
      payload['inputUrls']?.['length']
        ? {
            ...payload,
            inputUrls: [resolvePersonReplacementImageSourceRef(shot), ...payload['inputUrls']['slice'](1)],
          }
        : value2 && payload['inputUrls']?.['length']
          ? {
              ...payload,
              inputUrls: payload['inputUrls']['map']((value4, value5) =>
                value5 === value2 - 1 ? value3 : value4,
              ),
            }
          : payload,
    sourceImageSize: getPositiveSize(sourceImageSize),
  });
}
export function appendPersonReplacementImageResult(options2 = {}, args = {}) {
  const list = getPersonReplacementImageResults(options2),
    personReplacementImageResultRef = resolvePersonReplacementImageResultRef(args),
    count3 = list['findIndex'](
      (value6) => resolvePersonReplacementImageResultRef(value6) === personReplacementImageResultRef,
    );
  if (count3 >= 0) return { results: list, activeIndex: count3 };
  return { results: [...list, { ...args }], activeIndex: list['length'] };
}
export function normalizePersonReplacementAssetPromptPresetId(value7 = '') {
  const value8 = PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS['find'](
    (value9) => value9['id'] === normalizeText(value7),
  );
  return value8?.['id'] || PERSON_REPLACEMENT_DEFAULT_ASSET_PROMPT_PRESET_ID;
}
export function applyPersonReplacementCharacterAssetPromptPreset(value10 = '', value11 = '') {
  const text3 = normalizeText(value11),
    text4 = normalizeText(value10);
  if (!PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS['some']((value12) => value12['id'] === text4))
    return text3;
  return applyWorkspaceCharacterAssetPromptPreset(text4, text3, { hasImageInput: true });
}
export function resolveGeneratedPersonReplacementAppearanceName(value13 = '', value14 = 1) {
  const value15 = PERSON_REPLACEMENT_CHARACTER_ASSET_PROMPT_PRESETS['find'](
      (value16) => value16['id'] === normalizeText(value13),
    ),
    value17 = '形象 ' + Math['max'](1, Number(value14) || 1);
  return value15?.['template'] ? normalizeText(value15['label']) || value17 : value17;
}
export function normalizePersonReplacementImageGenerationState(options3 = {}, value18 = '') {
  const response = options3 && typeof options3 === 'object' && !Array['isArray'](options3) ? options3 : {},
    text5 = normalizeText(response['status'])['toLowerCase'](),
    args2 = normalizeText(response['requestId']),
    args3 = normalizePersonReplacementGenerationTaskIdentity(response),
    args4 = normalizePromptEnhancementSnapshot(response['promptEnhancement']);
  return {
    status: PERSON_REPLACEMENT_IMAGE_GENERATION_STATUSES['has'](text5) ? text5 : 'idle',
    shotId: normalizeText(response['shotId']) || normalizeText(value18),
    error: normalizeText(response['error']),
    ...(args2 ? { requestId: args2 } : {}),
    ...(args4 ? { promptEnhancement: args4 } : {}),
    ...args3,
  };
}
export function getRecoverablePersonReplacementImageTask(options4 = {}) {
  const personReplacementImageGenerationState = normalizePersonReplacementImageGenerationState(options4),
    args5 = getRecoverablePersonReplacementGenerationTask(personReplacementImageGenerationState);
  return args5 && personReplacementImageGenerationState['promptEnhancement']
    ? { ...args5, promptEnhancement: personReplacementImageGenerationState['promptEnhancement'] }
    : args5;
}
export function normalizePersonReplacementImageGenerationsByShotId(
  options5 = {},
  value19 = [],
  value20 = {},
) {
  const map = new Set(
      (Array['isArray'](value19) ? value19 : [])
        ['map']((value21) => normalizeText(value21?.['id']))
        ['filter'](Boolean),
    ),
    value22 = options5 && typeof options5 === 'object' && !Array['isArray'](options5) ? options5 : {},
    enabled = Object['fromEntries'](
      Object['entries'](value22)['flatMap'](([value23, value24]) => {
        const text6 = normalizeText(value23);
        if (!map['has'](text6)) return [];
        return [[text6, normalizePersonReplacementImageGenerationState(value24, text6)]];
      }),
    ),
    personReplacementImageGenerationState2 = normalizePersonReplacementImageGenerationState(value20);
  return (
    map['has'](personReplacementImageGenerationState2['shotId']) &&
      !enabled[personReplacementImageGenerationState2['shotId']] &&
      (enabled[personReplacementImageGenerationState2['shotId']] = personReplacementImageGenerationState2),
    enabled
  );
}
export function resolvePersonReplacementImageGenerationState(options6 = {}, value25 = '') {
  const text7 = normalizeText(value25),
    value26 = options6?.['imageGenerationsByShotId']?.[text7];
  if (value26 && typeof value26 === 'object')
    return normalizePersonReplacementImageGenerationState(value26, text7);
  const personReplacementImageGenerationState3 = normalizePersonReplacementImageGenerationState(
    options6?.['imageGeneration'],
  );
  return personReplacementImageGenerationState3['shotId'] === text7
    ? personReplacementImageGenerationState3
    : normalizePersonReplacementImageGenerationState({}, text7);
}
export function updatePersonReplacementImageGenerationState(args6 = {}, value27 = {}) {
  const personReplacementImageGenerationState4 = normalizePersonReplacementImageGenerationState(value27);
  if (!personReplacementImageGenerationState4['shotId']) return { ...args6 };
  const value28 = {
      ...(args6?.['imageGenerationsByShotId'] &&
      typeof args6['imageGenerationsByShotId'] === 'object' &&
      !Array['isArray'](args6['imageGenerationsByShotId'])
        ? args6['imageGenerationsByShotId']
        : {}),
      [personReplacementImageGenerationState4['shotId']]: personReplacementImageGenerationState4,
    },
    personReplacementImageGenerationState5 = normalizePersonReplacementImageGenerationState(
      args6?.['imageGeneration'],
    ),
    isPersonReplacementGenerationTaskActive2 =
      isPersonReplacementGenerationTaskActive(personReplacementImageGenerationState5) &&
      isPersonReplacementGenerationTaskActive(value28[personReplacementImageGenerationState5['shotId']])
        ? value28[personReplacementImageGenerationState5['shotId']]
        : null,
    value29 = Object['values'](value28)['find'](isPersonReplacementGenerationTaskActive),
    isPersonReplacementGenerationTaskActive3 = isPersonReplacementGenerationTaskActive(
      personReplacementImageGenerationState4,
    )
      ? personReplacementImageGenerationState4
      : isPersonReplacementGenerationTaskActive2 || value29 || personReplacementImageGenerationState4;
  return {
    ...args6,
    imageGeneration: isPersonReplacementGenerationTaskActive3,
    imageGenerationsByShotId: value28,
  };
}
function createImageGenerationUiRevision(options7 = {}, value30 = '') {
  const text8 = normalizeText(value30),
    value31 = (Array['isArray'](options7?.['shots']) ? options7['shots'] : [])['find'](
      (value32) => normalizeText(value32?.['id']) === text8,
    );
  return JSON['stringify']({
    shotId: text8,
    replacementImageRef: normalizeText(value31?.['replacementImageRef']),
    replacementImage: value31?.['replacementImage'] || null,
    error: normalizeText(value31?.['error']),
    generation: resolvePersonReplacementImageGenerationState(options7?.['workspace'], text8),
  });
}
function createImageGenerationTimelineRevision(options8 = {}) {
  return JSON['stringify'](
    (Array['isArray'](options8?.['shots']) ? options8['shots'] : [])['map']((value33) =>
      createImageGenerationUiRevision(options8, value33?.['id']),
    ),
  );
}
export function resolvePersonReplacementImageGenerationUiRefreshScope(options9 = {}, value34 = {}) {
  const text9 = normalizeText(value34?.['workspace']?.['selectedShotId']);
  if (createImageGenerationUiRevision(options9, text9) !== createImageGenerationUiRevision(value34, text9))
    return 'selected-shot';
  return createImageGenerationTimelineRevision(options9) !== createImageGenerationTimelineRevision(value34)
    ? 'timeline'
    : '';
}
export function resolvePersonReplacementImageGenerationParams({
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  sourceImageSize: sourceImageSize = {},
  shot: shot = {},
} = {}) {
  const text10 = normalizeText(modelId),
    modelProvider = resolveModelProvider(text10, provider),
    args7 = normalizeCharacterAssetImageGenerationParams(text10, generationParams),
    value35 = args7['aspectRatio'];
  if (!isAdaptiveRatioLabel(value35))
    return {
      provider: modelProvider,
      generationParams: args7,
      requestedAspectRatio: value35,
      resolvedAspectRatio: value35,
      adaptiveSource: 'explicit',
    };
  const box2 = getPositiveSize(sourceImageSize) ||
      getPositiveSize(shot?.['frame']) || { width: 0, height: 0 },
    box3 = resolveAdaptiveSourceSize({ inputWidth: box2['width'], inputHeight: box2['height'] }),
    closestRatioForProviderModel = pickClosestRatioForProviderModel({
      provider: modelProvider,
      model: text10,
      width: box3['width'],
      height: box3['height'],
      imageSize: args7['imageSize'],
    });
  return {
    provider: modelProvider,
    generationParams: { ...args7, aspectRatio: closestRatioForProviderModel },
    requestedAspectRatio: value35,
    resolvedAspectRatio: closestRatioForProviderModel,
    adaptiveSource: box3['source'],
  };
}
