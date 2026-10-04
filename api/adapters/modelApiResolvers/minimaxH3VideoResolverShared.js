import { appendUniqueUrl, normalizeInputList, normalizeInputUrlsBySlot } from './sharedResolverUtils.js';
import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
const MINIMAX_H3_RATIOS = new Set(['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16']);
function normalizeMode(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return item === 'reference' || item === 'multimodal' ? 'reference' : 'frames';
}
function normalizeDuration(key) {
  const count = Math['trunc'](Number(key));
  return Number['isFinite'](count) && count >= 0x4 && count <= 0xf ? count : 0x5;
}
function normalizeResolution(index) {
  return String(index || '')
    ['trim']()
    ['toUpperCase']() === '768P'
    ? '768P'
    : '2K';
}
function normalizeRatio(result, { allowAdaptive: allowAdaptive }) {
  const data = String(result || '')['trim'](),
    options = data['toLowerCase'](),
    target =
      data === '自适应' || ['auto', 'default']['includes'](options) ? 'adaptive' : options || 'adaptive';
  if (!MINIMAX_H3_RATIOS['has'](target)) return '16:9';
  return target === 'adaptive' && !allowAdaptive ? '16:9' : target;
}
function collectImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
}) {
  const images = [],
    slotUrls = normalizeInputUrlsBySlot(finalUrlsBySlot),
    map = new Set(normalizeInputList(slotIds['map']((source) => slotUrls[source])));
  return (
    slotIds['forEach']((next) => appendUniqueUrl(images, slotUrls[next])),
    normalizeInputList(inputImages)['forEach']((current) => {
      if (!map['has'](current)) appendUniqueUrl(images, current);
    }),
    { images: images, slotUrls: slotUrls }
  );
}
function resolveFrameInputs({ inputImages: inputImages = [], finalUrlsBySlot: finalUrlsBySlot = {} }) {
  const { images: images2, slotUrls: slotUrls2 } = collectImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['firstFrame', 'lastFrame'],
    }),
    map2 = new Set(normalizeInputList([slotUrls2['firstFrame'], slotUrls2['lastFrame']])),
    list = normalizeInputList(inputImages)['filter']((entry) => !map2['has'](entry));
  let firstFrameImage = String(slotUrls2['firstFrame'] || '')['trim'](),
    lastFrameImage = String(slotUrls2['lastFrame'] || '')['trim']();
  return (
    !firstFrameImage && list['length'] > 0x0 && (firstFrameImage = list['shift']()),
    !lastFrameImage && list['length'] > 0x0 && (lastFrameImage = list['shift']()),
    { count: images2['length'], firstFrameImage: firstFrameImage, lastFrameImage: lastFrameImage }
  );
}
export function resolveMinimaxH3Request({
  currentBody: currentBody = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modeFieldId: modeFieldId,
  providerLabel: providerLabel,
  allowStandaloneAudioReference: allowStandaloneAudioReference = ![],
}) {
  const record = { ...currentBody },
    prompt = translateMinimaxH3EditorAssetMentions(
      record['prompt'] || finalPrompt || payload?.['prompt'] || '',
    )['trim']();
  if (!prompt) throw new Error(providerLabel + ' MiniMax-H3 prompt is required');
  if (prompt['length'] > 0x1b58)
    throw new Error(providerLabel + ' MiniMax-H3 prompt must not exceed 7000 characters');
  const mode = normalizeMode(
      record[modeFieldId] || payload?.['generationParams']?.[modeFieldId] || payload?.[modeFieldId],
    ),
    resolution = normalizeResolution(record['resolution']),
    duration = normalizeDuration(record['duration']),
    watermark = Boolean(record['aigc_watermark'] ?? record['watermark'] ?? ![]),
    referenceVideos = normalizeInputList(inputVideos),
    referenceAudios = normalizeInputList(inputAudios);
  if (mode === 'reference') {
    const { images: images3 } = collectImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['referenceImage'],
    });
    if (images3['length'] > 0x9)
      throw new Error(
        providerLabel +
          '\x20MiniMax-H3\x20reference\x20mode\x20supports\x20at\x20most\x209\x20image\x20inputs',
      );
    if (referenceVideos['length'] > 0x3)
      throw new Error(providerLabel + ' MiniMax-H3 reference mode supports at most 3 video inputs');
    if (referenceAudios['length'] > 0x3)
      throw new Error(providerLabel + ' MiniMax-H3 reference mode supports at most 3 audio inputs');
    if (
      !allowStandaloneAudioReference &&
      referenceAudios['length'] > 0x0 &&
      images3['length'] === 0x0 &&
      referenceVideos['length'] === 0x0
    )
      throw new Error(
        providerLabel +
          '\x20MiniMax-H3\x20audio\x20references\x20require\x20an\x20image\x20or\x20video\x20reference',
      );
    return {
      mode: mode,
      prompt: prompt,
      resolution: resolution,
      duration: duration,
      watermark: watermark,
      ratio: normalizeRatio(
        record['ratio'] ||
          record['aspect_ratio'] ||
          payload?.['generationParams']?.['aspectRatio'] ||
          payload?.['aspectRatio'],
        { allowAdaptive: !![] },
      ),
      referenceImages: images3,
      referenceVideos: referenceVideos,
      referenceAudios: referenceAudios,
    };
  }
  if (referenceVideos['length'] > 0x0 || referenceAudios['length'] > 0x0)
    throw new Error(
      providerLabel +
        ' MiniMax-H3 first-last-frame mode accepts images only; use reference mode for video or audio inputs',
    );
  const ratio = resolveFrameInputs({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot });
  if (ratio['count'] > 0x2)
    throw new Error(providerLabel + ' MiniMax-H3 first-last-frame mode supports at most 2 image inputs');
  return {
    mode: mode,
    prompt: prompt,
    resolution: resolution,
    duration: duration,
    watermark: watermark,
    ratio:
      ratio['count'] > 0x0
        ? 'adaptive'
        : normalizeRatio(
            record['ratio'] ||
              record['aspect_ratio'] ||
              payload?.['generationParams']?.['aspectRatio'] ||
              payload?.['aspectRatio'],
            { allowAdaptive: ![] },
          ),
    firstFrameImage: ratio['firstFrameImage'],
    lastFrameImage: ratio['lastFrameImage'],
  };
}
