import { appendUniqueUrl, normalizeInputList, normalizeInputUrlsBySlot } from './sharedResolverUtils.js';
import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
const RUNNINGHUB_HAILUO_H3_ENDPOINTS = Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/multimodal-to-video',
  }),
  RUNNINGHUB_HAILUO_H3_RATIOS = new Set(['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16']);
function normalizeHailuoH3Mode(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return item === 'reference' || item === 'multimodal' ? 'reference' : 'frames';
}
function getHailuoH3Mode(options = {}, key = {}) {
  return normalizeHailuoH3Mode(
    key['rh_hailuo_h3_mode'] ||
      options?.['generationParams']?.['rh_hailuo_h3_mode'] ||
      options?.['rh_hailuo_h3_mode'],
  );
}
function normalizeHailuoH3Duration(index) {
  const count = Math['trunc'](Number(index));
  return Number['isFinite'](count) && count >= 5 && count <= 15 ? String(count) : '5';
}
function normalizeHailuoH3Ratio(result, { allowAdaptive: allowAdaptive }) {
  const data = String(result || '')['trim'](),
    target = data === '自适应' || data['toLowerCase']() === 'auto' ? 'adaptive' : data['toLowerCase']();
  if (!RUNNINGHUB_HAILUO_H3_RATIOS['has'](target)) return '16:9';
  return target === 'adaptive' && !allowAdaptive ? '16:9' : target;
}
function collectImagesWithSlotPriority({
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
function resolveHailuoH3FrameInputs({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { images: images2, slotUrls: slotUrls2 } = collectImagesWithSlotPriority({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['firstFrame', 'lastFrame'],
    }),
    map2 = new Set(normalizeInputList([slotUrls2['firstFrame'], slotUrls2['lastFrame']])),
    list = normalizeInputList(inputImages)['filter']((entry) => !map2['has'](entry));
  let firstFrameUrl = String(slotUrls2['firstFrame'] || '')['trim'](),
    lastFrameUrl = String(slotUrls2['lastFrame'] || '')['trim']();
  return (
    !firstFrameUrl && list['length'] > 0 && (firstFrameUrl = list['shift']()),
    !lastFrameUrl && list['length'] > 0 && (lastFrameUrl = list['shift']()),
    { count: images2['length'], firstFrameUrl: firstFrameUrl, lastFrameUrl: lastFrameUrl }
  );
}
function removeHailuoH3TransientFields(record) {
  (delete record['rh_hailuo_h3_mode'],
    delete record['firstFrameUrl'],
    delete record['lastFrameUrl'],
    delete record['imageUrls'],
    delete record['videoUrls'],
    delete record['audioUrls']);
}
export function runninghubHailuoH3Video({
  currentBody: currentBody,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const handle = { ...currentBody },
    translateMinimaxH3EditorAssetMentions2 = translateMinimaxH3EditorAssetMentions(
      handle['prompt'] || finalPrompt || payload?.['prompt'] || '',
    )['trim']();
  if (!translateMinimaxH3EditorAssetMentions2)
    throw new Error('RunningHub MiniMax-H3 prompt is required');
  const hailuoH3Mode = getHailuoH3Mode(payload, handle),
    list2 = normalizeInputList(inputVideos),
    list3 = normalizeInputList(inputAudios);
  ((handle['prompt'] = translateMinimaxH3EditorAssetMentions2),
    (handle['resolution'] = '2K'),
    (handle['duration'] = normalizeHailuoH3Duration(handle['duration'])),
    removeHailuoH3TransientFields(handle));
  if (hailuoH3Mode === 'reference') {
    const { images: images3 } = collectImagesWithSlotPriority({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['referenceImage'],
    });
    if (images3['length'] === 0 && list2['length'] === 0 && list3['length'] === 0)
      throw new Error('MiniMax-H3 多参考模式至少需要一张图片、一个视频或一段音频');
    if (images3['length'] > 9)
      throw new Error('RunningHub MiniMax-H3 reference mode supports at most 9 image inputs');
    if (list2['length'] > 3)
      throw new Error(
        'RunningHub MiniMax-H3 reference mode supports at most 3 video inputs',
      );
    if (list3['length'] > 3)
      throw new Error('RunningHub MiniMax-H3 reference mode supports at most 3 audio inputs');
    if (images3['length'] > 0) handle['imageUrls'] = images3;
    if (list2['length'] > 0) handle['videoUrls'] = list2;
    if (list3['length'] > 0) handle['audioUrls'] = list3;
    return ((handle['ratio'] = normalizeHailuoH3Ratio(handle['ratio'], { allowAdaptive: !![] })), handle);
  }
  if (list2['length'] > 0 || list3['length'] > 0)
    throw new Error(
      'RunningHub MiniMax-H3 first-last-frame mode accepts images only; use reference mode for video or audio inputs',
    );
  const hailuoH3FrameInputs = resolveHailuoH3FrameInputs({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (hailuoH3FrameInputs['count'] > 2)
    throw new Error(
      'RunningHub MiniMax-H3 first-last-frame mode supports at most 2 image inputs',
    );
  if (hailuoH3FrameInputs['count'] === 0)
    return ((handle['ratio'] = normalizeHailuoH3Ratio(handle['ratio'], { allowAdaptive: ![] })), handle);
  return (
    hailuoH3FrameInputs['firstFrameUrl'] && (handle['firstFrameUrl'] = hailuoH3FrameInputs['firstFrameUrl']),
    hailuoH3FrameInputs['lastFrameUrl'] && (handle['lastFrameUrl'] = hailuoH3FrameInputs['lastFrameUrl']),
    delete handle['ratio'],
    handle
  );
}
export function runninghubHailuoH3VideoEndpoint(options2 = {}) {
  const hailuoH3Mode2 = getHailuoH3Mode(options2['payload'], options2['currentBody']);
  if (hailuoH3Mode2 === 'reference') return RUNNINGHUB_HAILUO_H3_ENDPOINTS['reference'];
  const hailuoH3FrameInputs2 = resolveHailuoH3FrameInputs(options2);
  return hailuoH3FrameInputs2['count'] > 0
    ? RUNNINGHUB_HAILUO_H3_ENDPOINTS['image']
    : RUNNINGHUB_HAILUO_H3_ENDPOINTS['text'];
}
