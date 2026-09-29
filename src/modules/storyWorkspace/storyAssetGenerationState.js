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
function normalizeText(_0x185f4d) {
  return String(_0x185f4d || '')['trim']();
}
export function buildStoryAssetGenerationPayload({
  asset: _0xe843a9,
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
  referenceImageUrls: referenceImageUrls = [],
  mapReferenceImageToImage2: mapReferenceImageToImage2 = ![],
} = {}) {
  const _0x257aec = sanitizeStoryAssetPublicPromptText(_0xe843a9?.['prompt']),
    _0x4977ef = buildCharacterAssetImageGenerationPayload({
      prompt: mapReferenceImageToImage2 ? compileStoryAssetReferencePrompt(_0x257aec) : _0x257aec,
      modelId: modelId,
      provider: provider,
      generationParams: generationParams,
      referenceImageUrls: referenceImageUrls,
    });
  return (
    mapReferenceImageToImage2 &&
      (_0x4977ef['inputUrls'] = (Array['isArray'](referenceImageUrls) ? referenceImageUrls : [])
        ['map'](normalizeText)
        ['filter'](Boolean)),
    _0x4977ef
  );
}
export function normalizeStoryImageGenerationParams(_0x5d67cd, _0x126b52 = {}) {
  return normalizeCharacterAssetImageGenerationParams(_0x5d67cd, _0x126b52);
}
export function isStoryAssetBatchLoading(_0x108b16, _0x2a1c47) {
  return (
    _0x108b16?.['isBatchGenerating'] === !![] &&
    Array['isArray'](_0x108b16?.['batchGeneratingAssetIds']) &&
    _0x108b16['batchGeneratingAssetIds']['includes'](_0x2a1c47)
  );
}
export function setStoryAssetAppearanceGenerating(_0x3af09b, _0x5230eb, _0x65deb0, _0x6e4823 = !![]) {
  if (!_0x3af09b || typeof _0x3af09b !== 'object') return ![];
  const _0x53b577 = getStoryAssetAppearanceGenerationKey(_0x5230eb, _0x65deb0);
  if (!_0x53b577) return ![];
  const _0x4a849d = Array['isArray'](_0x3af09b['generatingAppearanceKeys'])
      ? _0x3af09b['generatingAppearanceKeys']
      : [],
    _0x56a5df = _0x6e4823
      ? [...new Set([..._0x4a849d, _0x53b577])]
      : _0x4a849d['filter']((_0x44f67f) => _0x44f67f !== _0x53b577);
  return ((_0x3af09b['generatingAppearanceKeys'] = _0x56a5df), _0x56a5df['length'] !== _0x4a849d['length']);
}
export function setStoryAssetVoiceGenerating(_0x5dabba, _0x2796f1, _0x4c7c6f = !![]) {
  if (!_0x5dabba || typeof _0x5dabba !== 'object') return ![];
  const _0x1bce8d = normalizeText(_0x2796f1);
  if (!_0x1bce8d) return ![];
  const _0x588d35 = Array['isArray'](_0x5dabba['generatingVoiceAssetIds'])
      ? _0x5dabba['generatingVoiceAssetIds']
      : [],
    _0x3fa804 = _0x4c7c6f
      ? [...new Set([..._0x588d35, _0x1bce8d])]
      : _0x588d35['filter']((_0x51c78f) => normalizeText(_0x51c78f) !== _0x1bce8d);
  return ((_0x5dabba['generatingVoiceAssetIds'] = _0x3fa804), _0x3fa804['length'] !== _0x588d35['length']);
}
export function isStoryAssetVoiceLoading(_0x319c67, _0x263978) {
  const _0x5b3593 = normalizeText(_0x263978);
  if (!_0x5b3593) return ![];
  return (
    (Array['isArray'](_0x319c67?.['generatingVoiceAssetIds']) &&
      _0x319c67['generatingVoiceAssetIds']['some']((_0xd79f1a) => normalizeText(_0xd79f1a) === _0x5b3593)) ||
    (_0x319c67?.['isBatchGenerating'] === !![] &&
      Array['isArray'](_0x319c67?.['batchGeneratingVoiceAssetIds']) &&
      _0x319c67['batchGeneratingVoiceAssetIds']['some'](
        (_0x5f461f) => normalizeText(_0x5f461f) === _0x5b3593,
      ))
  );
}
export function isStoryAssetCardLoading(_0x560ecb, _0x97796b) {
  const _0x140918 = normalizeText(_0x97796b) + ':';
  return (
    isStoryAssetBatchLoading(_0x560ecb, _0x97796b) ||
    (_0x140918 !== ':' &&
      Array['isArray'](_0x560ecb?.['generatingAppearanceKeys']) &&
      _0x560ecb['generatingAppearanceKeys']['some']((_0x418946) =>
        normalizeText(_0x418946)['startsWith'](_0x140918),
      ))
  );
}
export function isStoryAssetAppearanceLoading(_0x1d6e13, _0x576734, _0x2a5057) {
  const _0xd5a581 = getStoryAssetAppearanceGenerationKey(_0x576734, _0x2a5057);
  if (!_0xd5a581) return ![];
  return (
    (Array['isArray'](_0x1d6e13?.['generatingAppearanceKeys']) &&
      _0x1d6e13['generatingAppearanceKeys']['includes'](_0xd5a581)) ||
    (_0x1d6e13?.['isBatchGenerating'] === !![] &&
      Array['isArray'](_0x1d6e13?.['batchGeneratingAppearanceKeys']) &&
      _0x1d6e13['batchGeneratingAppearanceKeys']['includes'](_0xd5a581))
  );
}
export function getStoryAssetGenerationControlState(_0x206624, _0x4283b3, _0x580f32) {
  const _0x49b36d = isStoryAssetAppearanceLoading(_0x206624, _0x4283b3, _0x580f32),
    _0x2ea83f = normalizeText(_0x206624?.['assetGenerateLabel']),
    _0x10f4ff = _0x2ea83f === '生成资产图' ? '生成素材图' : _0x2ea83f || '生成素材图';
  return { isGenerating: _0x49b36d, disabled: _0x49b36d, label: _0x49b36d ? '生成中' : _0x10f4ff };
}
export function settleStoryAssetBatchLoading(
  _0x286776,
  _0x4dbb60,
  _0x42e86a = [],
  { failed: failed = ![] } = {},
) {
  const _0x26ab47 = normalizeText(_0x4dbb60?.['id']);
  if (!_0x26ab47 || !Array['isArray'](_0x286776?.['batchGeneratingAssetIds'])) return ![];
  const _0x549237 = _0x42e86a['some'](
    (_0x38e637) => normalizeText(_0x38e637?.['asset']?.['id']) === _0x26ab47,
  );
  if (!failed && _0x549237) return ![];
  return (
    (_0x286776['batchGeneratingAssetIds'] = _0x286776['batchGeneratingAssetIds']['filter'](
      (_0x3e9ab8) => normalizeText(_0x3e9ab8) !== _0x26ab47,
    )),
    !![]
  );
}
export function normalizeStoryAssetBatchGenerationMode(_0x268865) {
  const _0x5dab15 = normalizeText(_0x268865)['toLowerCase']();
  return ['image', 'voice', 'all']['includes'](_0x5dab15) ? _0x5dab15 : 'all';
}
export function buildStoryAssetBatchCancellationUpdate(_0x455eb3 = {}, _0x2304ac = {}) {
  const _0x29e77a = (_0x2d232b) => [
      ...new Set((Array['isArray'](_0x2d232b) ? _0x2d232b : [])['map'](normalizeText)['filter'](Boolean)),
    ],
    _0x3601e3 = _0x29e77a(_0x2304ac['appearanceKeys']),
    _0x17ffd3 = _0x29e77a(_0x2304ac['voiceAssetIds']),
    _0x52d207 = _0x29e77a(_0x2304ac['assetIds']),
    _0x4afd02 = new Set(_0x3601e3),
    _0x334d49 = new Set(_0x17ffd3),
    _0x297f35 = _0x29e77a(_0x455eb3['pendingAppearanceKeys'])['filter'](
      (_0x250327) => !_0x4afd02['has'](_0x250327),
    ),
    _0x1ff765 = _0x29e77a(_0x455eb3['pendingVoiceAssetIds'])['filter'](
      (_0x865a4a) => !_0x334d49['has'](_0x865a4a),
    ),
    _0x486aab = _0x297f35['length'] + _0x1ff765['length'],
    _0x377acf = _0x3601e3['length'] + _0x17ffd3['length'];
  return {
    canCancel: _0x486aab > 0x0,
    cancelledCount: _0x486aab,
    runningCount: _0x377acf,
    cancelledAppearanceKeys: _0x297f35,
    cancelledVoiceAssetIds: _0x1ff765,
    pendingAssetIds: _0x52d207,
    pendingAppearanceKeys: _0x3601e3,
    pendingVoiceAssetIds: _0x17ffd3,
    label: _0x377acf ? '已取消后续生成 · 正在完成 ' + _0x377acf + '\x20项' : '已取消后续生成',
  };
}
export function buildStoryAssetBatchGenerationPlan(_0x4d5a07 = [], _0x36d31d = 'all') {
  const _0x51d508 = normalizeStoryAssetBatchGenerationMode(_0x36d31d),
    _0xa8ed13 = (Array['isArray'](_0x4d5a07) ? _0x4d5a07 : [])['filter'](
      (_0x371e95) => _0x371e95 && !_0x371e95['isLibraryAsset'],
    ),
    _0x4efe82 =
      _0x51d508 === 'voice'
        ? []
        : buildStoryAssetAppearanceGenerationTasks(_0xa8ed13, { includeExisting: !![] }),
    _0x1c1db2 =
      _0x51d508 === 'image' ? [] : _0xa8ed13['filter']((_0x321e3b) => _0x321e3b['kind'] === 'character');
  return {
    mode: _0x51d508,
    imageTasks: _0x4efe82,
    voiceAssets: _0x1c1db2,
    totalTasks: _0x4efe82['length'] + _0x1c1db2['length'],
  };
}
export async function runStoryAssetBatchGenerationPhases(_0x4f9f70 = null, _0x4cc15d = null) {
  return Promise['all']([
    typeof _0x4f9f70 === 'function' ? _0x4f9f70() : undefined,
    typeof _0x4cc15d === 'function' ? _0x4cc15d() : undefined,
  ]);
}
