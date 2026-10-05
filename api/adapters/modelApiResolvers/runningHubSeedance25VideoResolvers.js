import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeOptionalIntegerInRange,
} from './sharedResolverUtils.js';
const RUNNINGHUB_SEEDANCE_2_5_ENDPOINTS = Object['freeze']({
  text: 'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/image-to-video',
  reference: 'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/multimodal-video',
});
function normalizeRunningHubSeedance25Mode(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  if (item === 'multimodal2video' || item === 'reference') return 'multimodal2video';
  if (item === 'frames2video' || item === 'frames') return 'frames2video';
  if (item === 'image2video' || item === 'image' || item === 'frame') return 'image2video';
  return 'text2video';
}
function getRunningHubSeedance25Mode(options = {}, key = {}) {
  return normalizeRunningHubSeedance25Mode(
    key['rh_seedance_2_mode'] ||
      options?.['generationParams']?.['rh_seedance_2_mode'] ||
      options?.['rh_seedance_2_mode'],
  );
}
function getRunningHubSeedance25OmniReferenceTaskType(options2 = {}, index = {}) {
  const result = String(
    options2?.['generationParams']?.['omniReferenceTaskType'] ||
      options2?.['omniReferenceTaskType'] ||
      index['omniReferenceTaskType'] ||
      '',
  )
    ['trim']()
    ['toLowerCase']();
  return result === 'edit' ? 'edit' : 'auto';
}
function getRawMediaCount(options3 = {}, data = [], target = '') {
  const source = target === 'audio' ? 'audioUrl' : target + 'Url';
  return Math['max'](
    normalizeInputList(data)['length'],
    normalizeInputList(options3?.[target + 's'])['length'],
    normalizeInputList(options3?.[target + 'Urls'])['length'],
    String(options3?.[source] || '')['trim']() ? 1 : 0,
  );
}
function getRunningHubSeedance25MediaCounts({
  payload: payload = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
} = {}) {
  return Object['freeze']({
    image: getRawMediaCount(payload, inputImages, 'image'),
    video: getRawMediaCount(payload, inputVideos, 'video'),
    audio: getRawMediaCount(payload, inputAudios, 'audio'),
  });
}
function collectSlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const next = [],
    inputUrlsBySlot = normalizeInputUrlsBySlot(finalUrlsBySlot),
    map = new Set(normalizeInputList(Object['values'](inputUrlsBySlot)));
  return (
    slotIds['forEach']((current) => appendUniqueUrl(next, inputUrlsBySlot[current])),
    normalizeInputList(inputImages)['forEach']((entry) => {
      if (!map['has'](entry)) appendUniqueUrl(next, entry);
    }),
    next
  );
}
function resolveRunningHubSeedance25Route(options4 = {}) {
  const runningHubSeedance25MediaCounts = getRunningHubSeedance25MediaCounts(options4);
  if (
    runningHubSeedance25MediaCounts['image'] +
      runningHubSeedance25MediaCounts['video'] +
      runningHubSeedance25MediaCounts['audio'] <=
    0
  )
    return 'text';
  const runningHubSeedance25Mode = getRunningHubSeedance25Mode(options4['payload'], options4['currentBody']);
  if (runningHubSeedance25Mode === 'multimodal2video') return 'reference';
  if (runningHubSeedance25Mode === 'image2video' || runningHubSeedance25Mode === 'frames2video')
    return 'image';
  return 'text';
}
function removeTransientFields(record) {
  (delete record['rh_seedance_2_mode'],
    delete record['firstFrameUrl'],
    delete record['lastFrameUrl'],
    delete record['imageUrls'],
    delete record['videoUrls'],
    delete record['audioUrls']);
}
function removeUnsupportedFields(handle, state) {
  if (state !== 'text') delete handle['webSearch'];
  if (state !== 'reference') delete handle['omniReferenceTaskType'];
  state === 'text' && (delete handle['realPersonMode'], delete handle['conversionSlots']);
}
function normalizeConversionSlots(config) {
  const list = Array['isArray'](config) ? config : ['all'],
    list2 = list['map']((scope) => String(scope || '')['trim']())['filter'](Boolean);
  return list2['length'] > 0 ? list2 : ['all'];
}
function applyRealPersonConversionSlots(input) {
  input['realPersonMode'] === !![]
    ? (input['conversionSlots'] = normalizeConversionSlots(input['conversionSlots']))
    : delete input['conversionSlots'];
}
export function runninghubSeedance25Video({
  currentBody: currentBody,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const output = { ...currentBody },
    enabled = String(output['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!enabled) throw new Error('RunningHub Seedance 2.5 prompt is required');
  const runningHubSeedance25Mode2 = getRunningHubSeedance25Mode(payload, output),
    runningHubSeedance25MediaCounts2 = getRunningHubSeedance25MediaCounts({
      payload: payload,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
    }),
    value2 =
      runningHubSeedance25MediaCounts2['image'] +
        runningHubSeedance25MediaCounts2['video'] +
        runningHubSeedance25MediaCounts2['audio'] >
      0,
    value3 = value2 ? runningHubSeedance25Mode2 : 'text2video',
    value4 =
      value3 === 'multimodal2video'
        ? 'reference'
        : value3 === 'image2video' || value3 === 'frames2video'
          ? 'image'
          : 'text',
    list3 = collectSlotImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['firstFrame', 'lastFrame'],
    }),
    list4 = collectSlotImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['referenceImage'],
    }),
    list5 = normalizeInputList(inputVideos),
    list6 = normalizeInputList(inputAudios);
  output['prompt'] = enabled;
  const optionalIntegerInRange = normalizeOptionalIntegerInRange(output['seed'], {
    min: -1,
    max: 0x7fffffff,
  });
  if (optionalIntegerInRange === null) delete output['seed'];
  else output['seed'] = optionalIntegerInRange;
  (removeTransientFields(output), removeUnsupportedFields(output, value4));
  if (value4 === 'text') {
    if (value2)
      throw new Error(
        'RunningHub Seedance 2.5 text-to-video mode does not accept media input; choose image, frames, or multimodal mode',
      );
    return output;
  }
  if (value4 === 'reference') {
    if (list4['length'] + list5['length'] + list6['length'] <= 0)
      throw new Error('RunningHub Seedance 2.5 multimodal mode requires image, video, or audio input');
    if (runningHubSeedance25MediaCounts2['image'] > 30)
      throw new Error('RunningHub Seedance 2.5 multimodal mode supports at most 30 image inputs');
    if (runningHubSeedance25MediaCounts2['video'] > 10)
      throw new Error(
        'RunningHub Seedance 2.5 multimodal mode supports at most 10 video inputs',
      );
    if (runningHubSeedance25MediaCounts2['audio'] > 10)
      throw new Error('RunningHub Seedance 2.5 multimodal mode supports at most 10 audio inputs');
    list4['length'] > 0 && (output['imageUrls'] = list4['slice'](0, 30));
    if (list5['length'] > 0) output['videoUrls'] = list5['slice'](0, 10);
    if (list6['length'] > 0) output['audioUrls'] = list6['slice'](0, 10);
    return (
      (output['omniReferenceTaskType'] = getRunningHubSeedance25OmniReferenceTaskType(payload, output)),
      applyRealPersonConversionSlots(output),
      output
    );
  }
  if (runningHubSeedance25MediaCounts2['video'] > 0 || runningHubSeedance25MediaCounts2['audio'] > 0)
    throw new Error(
      'RunningHub Seedance 2.5 image/frame modes only accept image input; use multimodal mode for video or audio',
    );
  if (value3 === 'image2video' && list3['length'] !== 1)
    throw new Error('RunningHub Seedance 2.5 image-to-video mode requires exactly 1 image input');
  if (value3 === 'frames2video' && list3['length'] !== 2)
    throw new Error('RunningHub Seedance 2.5 first-last-frame mode requires exactly 2 image inputs');
  output['firstFrameUrl'] = list3[0];
  if (list3[1]) output['lastFrameUrl'] = list3[1];
  return ((output['ratio'] = 'adaptive'), applyRealPersonConversionSlots(output), output);
}
export function runninghubSeedance25VideoEndpoint(options5 = {}) {
  return RUNNINGHUB_SEEDANCE_2_5_ENDPOINTS[resolveRunningHubSeedance25Route(options5)];
}
