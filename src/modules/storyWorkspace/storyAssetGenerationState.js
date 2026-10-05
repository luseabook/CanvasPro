import {
  buildStoryAssetAppearanceGenerationTasks,
  compileStoryAssetReferencePrompt,
} from './storyAssetAppearances.js';
import {
  buildCharacterAssetImageGenerationPayload,
  normalizeCharacterAssetImageGenerationParams,
} from '../characterAssets/characterAssetImageGeneration.js';
import { getStoryAssetAppearanceGenerationKey } from './storyProjectTaskState.js';
import { sanitizeStoryAssetPublicPromptText } from '../../../api/utils/storyAssetPublicText.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function buildStoryAssetGenerationPayload({
  asset: asset,
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  referenceImageUrls: referenceImageUrls = [],
  mapReferenceImageToImage2: mapReferenceImageToImage2 = ![],
} = {}) {
  const sanitizeStoryAssetPublicPromptText2 = sanitizeStoryAssetPublicPromptText(asset?.['prompt']),
    characterAssetImageGenerationPayload = buildCharacterAssetImageGenerationPayload({
      prompt: mapReferenceImageToImage2
        ? compileStoryAssetReferencePrompt(sanitizeStoryAssetPublicPromptText2)
        : sanitizeStoryAssetPublicPromptText2,
      modelId: modelId,
      provider: provider,
      generationParams: generationParams,
      referenceImageUrls: referenceImageUrls,
    });
  return (
    mapReferenceImageToImage2 &&
      (characterAssetImageGenerationPayload['inputUrls'] = (
        Array['isArray'](referenceImageUrls) ? referenceImageUrls : []
      )
        ['map'](normalizeText)
        ['filter'](Boolean)),
    characterAssetImageGenerationPayload
  );
}
export function normalizeStoryImageGenerationParams(item, key = {}) {
  return normalizeCharacterAssetImageGenerationParams(item, key);
}
export function isStoryAssetBatchLoading(index, result) {
  return (
    index?.['isBatchGenerating'] === !![] &&
    Array['isArray'](index?.['batchGeneratingAssetIds']) &&
    index['batchGeneratingAssetIds']['includes'](result)
  );
}
export function setStoryAssetAppearanceGenerating(enabled, data, options, target = !![]) {
  if (!enabled || typeof enabled !== 'object') return ![];
  const storyAssetAppearanceGenerationKey = getStoryAssetAppearanceGenerationKey(data, options);
  if (!storyAssetAppearanceGenerationKey) return ![];
  const list = Array['isArray'](enabled['generatingAppearanceKeys'])
      ? enabled['generatingAppearanceKeys']
      : [],
    list2 = target
      ? [...new Set([...list, storyAssetAppearanceGenerationKey])]
      : list['filter']((source) => source !== storyAssetAppearanceGenerationKey);
  return ((enabled['generatingAppearanceKeys'] = list2), list2['length'] !== list['length']);
}
export function setStoryAssetVoiceGenerating(enabled2, next, current = !![]) {
  if (!enabled2 || typeof enabled2 !== 'object') return ![];
  const text = normalizeText(next);
  if (!text) return ![];
  const list3 = Array['isArray'](enabled2['generatingVoiceAssetIds'])
      ? enabled2['generatingVoiceAssetIds']
      : [],
    list4 = current
      ? [...new Set([...list3, text])]
      : list3['filter']((entry) => normalizeText(entry) !== text);
  return ((enabled2['generatingVoiceAssetIds'] = list4), list4['length'] !== list3['length']);
}
export function isStoryAssetVoiceLoading(record, payload) {
  const text2 = normalizeText(payload);
  if (!text2) return ![];
  return (
    (Array['isArray'](record?.['generatingVoiceAssetIds']) &&
      record['generatingVoiceAssetIds']['some']((handle) => normalizeText(handle) === text2)) ||
    (record?.['isBatchGenerating'] === !![] &&
      Array['isArray'](record?.['batchGeneratingVoiceAssetIds']) &&
      record['batchGeneratingVoiceAssetIds']['some']((state) => normalizeText(state) === text2))
  );
}
export function isStoryAssetCardLoading(config, scope) {
  const text3 = normalizeText(scope) + ':';
  return (
    isStoryAssetBatchLoading(config, scope) ||
    (text3 !== ':' &&
      Array['isArray'](config?.['generatingAppearanceKeys']) &&
      config['generatingAppearanceKeys']['some']((input) => normalizeText(input)['startsWith'](text3)))
  );
}
export function isStoryAssetAppearanceLoading(output, value2, value3) {
  const storyAssetAppearanceGenerationKey2 = getStoryAssetAppearanceGenerationKey(value2, value3);
  if (!storyAssetAppearanceGenerationKey2) return ![];
  return (
    (Array['isArray'](output?.['generatingAppearanceKeys']) &&
      output['generatingAppearanceKeys']['includes'](storyAssetAppearanceGenerationKey2)) ||
    (output?.['isBatchGenerating'] === !![] &&
      Array['isArray'](output?.['batchGeneratingAppearanceKeys']) &&
      output['batchGeneratingAppearanceKeys']['includes'](storyAssetAppearanceGenerationKey2))
  );
}
export function getStoryAssetGenerationControlState(value4, value5, value6) {
  const isGenerating = isStoryAssetAppearanceLoading(value4, value5, value6),
    text4 = normalizeText(value4?.['assetGenerateLabel']),
    value7 = text4 === '生成资产图' ? '生成素材图' : text4 || '生成素材图';
  return { isGenerating: isGenerating, disabled: isGenerating, label: isGenerating ? '生成中' : value7 };
}
export function settleStoryAssetBatchLoading(value8, value9, list5 = [], { failed: failed = ![] } = {}) {
  const text5 = normalizeText(value9?.['id']);
  if (!text5 || !Array['isArray'](value8?.['batchGeneratingAssetIds'])) return ![];
  const value10 = list5['some']((value11) => normalizeText(value11?.['asset']?.['id']) === text5);
  if (!failed && value10) return ![];
  return (
    (value8['batchGeneratingAssetIds'] = value8['batchGeneratingAssetIds']['filter'](
      (value12) => normalizeText(value12) !== text5,
    )),
    !![]
  );
}
export function normalizeStoryAssetBatchGenerationMode(value13) {
  const text6 = normalizeText(value13)['toLowerCase']();
  return ['image', 'voice', 'all']['includes'](text6) ? text6 : 'all';
}
export function buildStoryAssetBatchCancellationUpdate(options2 = {}, value14 = {}) {
  const run = (value15) => [
      ...new Set((Array['isArray'](value15) ? value15 : [])['map'](normalizeText)['filter'](Boolean)),
    ],
    pendingAppearanceKeys = run(value14['appearanceKeys']),
    pendingVoiceAssetIds = run(value14['voiceAssetIds']),
    pendingAssetIds = run(value14['assetIds']),
    map = new Set(pendingAppearanceKeys),
    map2 = new Set(pendingVoiceAssetIds),
    cancelledAppearanceKeys = run(options2['pendingAppearanceKeys'])['filter'](
      (value16) => !map['has'](value16),
    ),
    cancelledVoiceAssetIds = run(options2['pendingVoiceAssetIds'])['filter'](
      (value17) => !map2['has'](value17),
    ),
    canCancel = cancelledAppearanceKeys['length'] + cancelledVoiceAssetIds['length'],
    runningCount = pendingAppearanceKeys['length'] + pendingVoiceAssetIds['length'];
  return {
    canCancel: canCancel > 0,
    cancelledCount: canCancel,
    runningCount: runningCount,
    cancelledAppearanceKeys: cancelledAppearanceKeys,
    cancelledVoiceAssetIds: cancelledVoiceAssetIds,
    pendingAssetIds: pendingAssetIds,
    pendingAppearanceKeys: pendingAppearanceKeys,
    pendingVoiceAssetIds: pendingVoiceAssetIds,
    label: runningCount ? '已取消后续生成 · 正在完成 ' + runningCount + ' 项' : '已取消后续生成',
  };
}
export function buildStoryAssetBatchGenerationPlan(list6 = [], value18 = 'all') {
  const mode = normalizeStoryAssetBatchGenerationMode(value18),
    list7 = (Array['isArray'](list6) ? list6 : [])['filter'](
      (enabled3) => enabled3 && !enabled3['isLibraryAsset'],
    ),
    imageTasks =
      mode === 'voice' ? [] : buildStoryAssetAppearanceGenerationTasks(list7, { includeExisting: !![] }),
    voiceAssets = mode === 'image' ? [] : list7['filter']((value19) => value19['kind'] === 'character');
  return {
    mode: mode,
    imageTasks: imageTasks,
    voiceAssets: voiceAssets,
    totalTasks: imageTasks['length'] + voiceAssets['length'],
  };
}
export async function runStoryAssetBatchGenerationPhases(handler = null, handler2 = null) {
  return Promise['all']([
    typeof handler === 'function' ? handler() : undefined,
    typeof handler2 === 'function' ? handler2() : undefined,
  ]);
}
