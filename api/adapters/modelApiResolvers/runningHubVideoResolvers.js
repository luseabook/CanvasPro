import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeKlingKeepOriginalSound,
  normalizeOptionalIntegerInRange,
  replaceKlingO1PromptImageReferences,
} from './sharedResolverUtils.js';
const RUNNINGHUB_HAPPYHORSE_ENDPOINTS = Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit',
  }),
  RUNNINGHUB_HAPPYHORSE_11_ENDPOINTS = Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/reference-to-video',
  });
function normalizeHappyHorseGenerationMode(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  return item === 'image' || item === 'reference' || item === 'edit' ? item : 'auto';
}
function getRunningHubHappyHorseMode(options = {}, key = {}) {
  return normalizeHappyHorseGenerationMode(
    key.happyhorse_mode ||
      options?.generationParams?.happyhorse_mode ||
      options?.happyhorse_mode,
  );
}
function isRunningHubHappyHorse11Model(options2 = {}, index = {}, result = '', data = {}, target = {}) {
  const list = String(
    data?.id ||
      target?.modelId ||
      result ||
      options2?.model ||
      options2?.generationParams?.model ||
      index?.model ||
      '',
  )
    .trim()
    .toLowerCase();
  return list.includes('happyhorse-1.1') || list.includes('happyhorse-1-1');
}
function normalizeRunningHubHappyHorseAudioSettingValue(source) {
  const next = String(source || '')
    .trim()
    .toLowerCase();
  return next === 'origin' ? 'origin' : 'auto';
}
export function runninghubHappyHorseVideo({
  currentBody: currentBody2,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const current = { ...currentBody2 },
    isRunningHubHappyHorse11Model2 = isRunningHubHappyHorse11Model(
      payload,
      currentBody2,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    enabled = String(current.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!enabled) throw new Error('RunningHub HappyHorse 1.0 prompt is required');
  const list2 = normalizeInputList(inputImages),
    list3 = normalizeInputList(inputVideos),
    inputUrlsBySlot = normalizeInputUrlsBySlot(finalUrlsBySlot),
    handler = (list4 = [], entry = []) => {
      const list5 = [],
        handler2 = (record) => {
          const handle = String(record || '').trim();
          if (handle && !list5.includes(handle)) list5.push(handle);
        };
      return (
        list4.forEach((state) => handler2(inputUrlsBySlot[state])),
        normalizeInputList(entry).forEach(handler2),
        list5
      );
    };
  let runningHubHappyHorseMode = getRunningHubHappyHorseMode(payload, current);
  const enabled2 =
    list2.length > 0 || list3.length > 0 || Object.keys(inputUrlsBySlot).length > 0;
  runningHubHappyHorseMode !== 'auto' && !enabled2 && (runningHubHappyHorseMode = 'auto');
  current.prompt = enabled;
  const optionalIntegerInRange = normalizeOptionalIntegerInRange(current.seed, {
    min: 0,
    max: 0x7fffffff,
  });
  if (optionalIntegerInRange === null) delete current.seed;
  else current.seed = optionalIntegerInRange;
  (delete current.happyhorse_mode,
    delete current.imageUrl,
    delete current.imageUrls,
    delete current.videoUrl);
  if (isRunningHubHappyHorse11Model2 && list3.length > 0)
    throw new Error('RunningHub HappyHorse 1.1 does not support video edit mode');
  if (runningHubHappyHorseMode === 'edit') {
    if (isRunningHubHappyHorse11Model2)
      throw new Error('RunningHub HappyHorse 1.1 does not support video edit mode');
    if (!list3[0]) throw new Error('RunningHub HappyHorse 1.0 video edit requires videoUrl input');
    const list6 = handler(['editRefImage'], list2);
    current.videoUrl = list3[0];
    if (list6.length > 0) current.imageUrls = list6.slice(0, 5);
    return (
      (current.audioSetting = normalizeRunningHubHappyHorseAudioSettingValue(
        current.audioSetting ??
          payload?.generationParams?.audioSetting ??
          payload?.generationParams?.audio_setting ??
          payload?.audioSetting ??
          payload?.audio_setting,
      )),
      delete current.aspectRatio,
      delete current.duration,
      delete current.imageUrl,
      current
    );
  }
  delete current.audioSetting;
  if (runningHubHappyHorseMode === 'image') {
    const enabled3 = handler(['firstFrame'], list2);
    if (!enabled3[0]) throw new Error('RunningHub HappyHorse 1.0 image-to-video requires imageUrl input');
    return (
      (current.imageUrl = enabled3[0]),
      delete current.imageUrls,
      delete current.videoUrl,
      delete current.aspectRatio,
      current
    );
  }
  if (runningHubHappyHorseMode === 'reference') {
    const list7 = handler(['referenceImage'], list2);
    if (list7.length <= 0)
      throw new Error('RunningHub HappyHorse 1.0 reference mode requires imageUrls input');
    return (
      (current.imageUrls = list7.slice(0, 9)),
      delete current.imageUrl,
      delete current.videoUrl,
      current
    );
  }
  if (list2.length > 0 || list3.length > 0)
    throw new Error('RunningHub HappyHorse 1.0 media inputs require an explicit mode selection');
  return (delete current.imageUrl, delete current.imageUrls, delete current.videoUrl, current);
}
function hasRunningHubHappyHorseEndpointMedia({
  currentBody: currentBody = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
} = {}) {
  return (
    normalizeInputList(inputImages).length > 0 ||
    normalizeInputList(inputVideos).length > 0 ||
    Object.keys(normalizeInputUrlsBySlot(finalUrlsBySlot)).length > 0 ||
    Boolean(String(currentBody?.imageUrl || currentBody?.videoUrl || '').trim()) ||
    normalizeInputList(currentBody?.imageUrls).length > 0
  );
}
export function runninghubHappyHorseVideoEndpoint(options3 = {}) {
  const {
      payload: payload = {},
      currentBody: currentBody = {},
      modelToken: modelToken = '',
      executionManifest: executionManifest = {},
      modelManifest: modelManifest = {},
    } = options3,
    response = isRunningHubHappyHorse11Model(
      payload,
      currentBody,
      modelToken,
      executionManifest,
      modelManifest,
    )
      ? RUNNINGHUB_HAPPYHORSE_11_ENDPOINTS
      : RUNNINGHUB_HAPPYHORSE_ENDPOINTS;
  let runningHubHappyHorseMode2 = getRunningHubHappyHorseMode(payload, currentBody);
  return (
    runningHubHappyHorseMode2 !== 'auto' &&
      !hasRunningHubHappyHorseEndpointMedia(options3) &&
      (runningHubHappyHorseMode2 = 'auto'),
    response[runningHubHappyHorseMode2] || response.text
  );
}
const RUNNINGHUB_SEEDANCE_2_ENDPOINTS = Object.freeze({
  mini: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/multimodal-video',
  }),
  fast: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video',
  }),
  standard: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/multimodal-video',
  }),
});
function normalizeRunningHubSeedance2Model(config) {
  const scope = String(config || '')
    .trim()
    .toLowerCase();
  return scope === 'standard' || scope === 'std' ? 'standard' : 'fast';
}
function normalizeRunningHubSeedance2Mode(input) {
  const output = String(input || '')
    .trim()
    .toLowerCase();
  if (output === 'multimodal2video' || output === 'reference') return 'multimodal2video';
  if (output === 'frames2video' || output === 'frames') return 'frames2video';
  if (output === 'image2video' || output === 'image' || output === 'frame') return 'image2video';
  return 'text2video';
}
function getRunningHubSeedance2Model(options4 = {}, value2 = {}, value3 = '', value4 = {}, value5 = {}) {
  const list8 = String(value3 || options4?.model || value2?.model || '')
      .trim()
      .toLowerCase(),
    list9 = String(value4?.id || value5?.modelId || '')
      .trim()
      .toLowerCase();
  if (
    list8.includes('seedance-2.0-mini') ||
    list8.includes('sparkvideo-2.0-mini') ||
    list9.includes('seedance-2-mini') ||
    list9.includes('sparkvideo-2.0-mini')
  )
    return 'mini';
  return normalizeRunningHubSeedance2Model(
    value2.rh_seedance_2_model ||
      options4?.generationParams?.rh_seedance_2_model ||
      options4?.rh_seedance_2_model,
  );
}
function getRunningHubSeedance2Mode(options5 = {}, value6 = {}) {
  return normalizeRunningHubSeedance2Mode(
    value6.rh_seedance_2_mode ||
      options5?.generationParams?.rh_seedance_2_mode ||
      options5?.rh_seedance_2_mode,
  );
}
function collectRunningHubSeedance2SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const value7 = [],
    inputUrlsBySlot2 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    map = new Set(normalizeInputList(Object.values(inputUrlsBySlot2)));
  return (
    slotIds.forEach((value8) => appendUniqueUrl(value7, inputUrlsBySlot2[value8])),
    normalizeInputList(inputImages).forEach((value9) => {
      if (!map.has(value9)) appendUniqueUrl(value7, value9);
    }),
    value7
  );
}
function collectRunningHubSeedance2FrameImages(args = {}) {
  return collectRunningHubSeedance2SlotImages({ ...args, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubSeedance2ReferenceImages(args2 = {}) {
  return collectRunningHubSeedance2SlotImages({ ...args2, slotIds: ['referenceImage'] });
}
function resolveRunningHubSeedance2Route({
  payload: payload = {},
  currentBody: currentBody = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
} = {}) {
  const model = getRunningHubSeedance2Model(
      payload,
      currentBody,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    runningHubSeedance2Mode = getRunningHubSeedance2Mode(payload, currentBody);
  if (runningHubSeedance2Mode === 'multimodal2video')
    return Object.freeze({ model: model, route: 'reference' });
  if (runningHubSeedance2Mode === 'image2video' || runningHubSeedance2Mode === 'frames2video')
    return Object.freeze({ model: model, route: 'image' });
  return Object.freeze({ model: model, route: 'text' });
}
function removeRunningHubSeedance2TransientFields(value10) {
  (delete value10.rh_seedance_2_model,
    delete value10.rh_seedance_2_mode,
    delete value10.firstFrameUrl,
    delete value10.lastFrameUrl,
    delete value10.imageUrls,
    delete value10.videoUrls,
    delete value10.audioUrls);
}
function normalizeRunningHubSeedance2ConversionSlots(value11) {
  const list10 = Array.isArray(value11) ? value11 : ['all'],
    list11 = list10.map((value12) => String(value12 || '').trim()).filter(Boolean);
  return list11.length > 0 ? list11 : ['all'];
}
export function runninghubSeedance2Video({
  currentBody: currentBody3,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const value13 = { ...currentBody3 },
    enabled4 = String(value13.prompt || finalPrompt || payload?.prompt || '').trim();
  if (!enabled4) throw new Error('RunningHub Seedance 2.0 prompt is required');
  const runningHubSeedance2Mode2 = getRunningHubSeedance2Mode(payload, value13),
    list12 = collectRunningHubSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    list13 = collectRunningHubSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    list14 = normalizeInputList(inputVideos),
    list15 = normalizeInputList(inputAudios),
    runningHubKlingV3RawMediaCount = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    runningHubKlingV3RawMediaCount2 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  value13.prompt = enabled4;
  const optionalIntegerInRange2 = normalizeOptionalIntegerInRange(value13.seed, {
    min: -1,
    max: 0x7fffffff,
  });
  if (optionalIntegerInRange2 === null) delete value13.seed;
  else value13.seed = optionalIntegerInRange2;
  removeRunningHubSeedance2TransientFields(value13);
  if (runningHubSeedance2Mode2 === 'multimodal2video') {
    if (list13.length + list14.length <= 0)
      throw new Error('RunningHub Seedance 2.0 multimodal mode requires image or video input');
    if (list13.length > 9)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 9 image inputs');
    if (runningHubKlingV3RawMediaCount > 3)
      throw new Error(
        'RunningHub Seedance 2.0 multimodal mode supports at most 3 video inputs',
      );
    if (runningHubKlingV3RawMediaCount2 > 3)
      throw new Error(
        'RunningHub Seedance 2.0 multimodal mode supports at most 3 audio inputs',
      );
    if (list15.length > 0 && list13.length + list14.length <= 0)
      throw new Error('RunningHub Seedance 2.0 audio input requires image or video input');
    if (list13.length > 0) value13.imageUrls = list13.slice(0, 9);
    if (list14.length > 0) value13.videoUrls = list14.slice(0, 3);
    if (list15.length > 0) value13.audioUrls = list15.slice(0, 3);
    return (
      value13.realPersonMode === true
        ? (value13.conversionSlots = normalizeRunningHubSeedance2ConversionSlots(
            value13.conversionSlots,
          ))
        : delete value13.conversionSlots,
      delete value13.webSearch,
      value13
    );
  }
  if (runningHubKlingV3RawMediaCount > 0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept video input; use multimodal mode',
    );
  if (runningHubKlingV3RawMediaCount2 > 0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept audio input; use multimodal mode',
    );
  if (runningHubSeedance2Mode2 === 'text2video') {
    if (list12.length > 0)
      throw new Error('RunningHub Seedance 2.0 text-to-video mode does not accept image input');
    return (delete value13.realPersonMode, delete value13.conversionSlots, value13);
  }
  if (runningHubSeedance2Mode2 === 'image2video' && list12.length !== 1)
    throw new Error('RunningHub Seedance 2.0 image-to-video mode requires exactly 1 image input');
  if (runningHubSeedance2Mode2 === 'frames2video' && list12.length !== 2)
    throw new Error(
      'RunningHub Seedance 2.0 first-last-frame mode requires exactly 2 image inputs',
    );
  value13.firstFrameUrl = list12[0];
  if (list12[1]) value13.lastFrameUrl = list12[1];
  return (
    delete value13.webSearch,
    value13.realPersonMode === true
      ? (value13.conversionSlots = normalizeRunningHubSeedance2ConversionSlots(value13.conversionSlots))
      : delete value13.conversionSlots,
    value13
  );
}
export function runninghubSeedance2VideoEndpoint({
  payload: payload = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const { model: model2, route: route } = resolveRunningHubSeedance2Route({
    payload: payload,
    currentBody: {},
    modelToken: modelToken || payload?.model || '',
    executionManifest: executionManifest,
    modelManifest: modelManifest,
  });
  return RUNNINGHUB_SEEDANCE_2_ENDPOINTS[model2]?.[route] || RUNNINGHUB_SEEDANCE_2_ENDPOINTS.fast.text;
}
const RUNNINGHUB_KLING_O1_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
  frames: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end',
  reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video',
});
function normalizeRunningHubKlingO1GenerationMode(value14) {
  const value15 = String(value14 || '')
    .trim()
    .toLowerCase();
  if (value15 === 'reference' || value15 === 'edit') return value15;
  return 'frame';
}
function normalizeRunningHubKlingO1QualityMode(value16) {
  const value17 = String(value16 || '')
    .trim()
    .toLowerCase();
  return value17 === 'pro' ? 'pro' : 'std';
}
function normalizeRunningHubKlingO1AspectRatio(value18) {
  const value19 = String(value18 || '9:16').trim();
  return ['16:9', '9:16', '1:1'].includes(value19) ? value19 : '9:16';
}
function normalizeRunningHubKlingO1Duration(value20) {
  const value21 = Number(value20);
  return Number.isFinite(value21) && Math.trunc(value21) === 10 ? '10' : '5';
}
function getRunningHubKlingO1GenerationMode(options6 = {}, value22 = {}) {
  return normalizeRunningHubKlingO1GenerationMode(
    value22.rh_kling_o1_generation_mode ||
      options6?.generationParams?.rh_kling_o1_generation_mode ||
      options6?.rh_kling_o1_generation_mode,
  );
}
function collectRunningHubKlingO1FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value23 = [],
    inputUrlsBySlot3 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value23, inputUrlsBySlot3.firstFrame),
    appendUniqueUrl(value23, inputUrlsBySlot3.lastFrame),
    normalizeInputList(inputImages).forEach((value24) => appendUniqueUrl(value23, value24)),
    value23
  );
}
function collectRunningHubKlingO1ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value25 = [],
    inputUrlsBySlot4 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value25, inputUrlsBySlot4.referenceImage),
    normalizeInputList(inputImages).forEach((value26) => appendUniqueUrl(value25, value26)),
    value25
  );
}
function resolveRunningHubKlingO1Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const runningHubKlingO1GenerationMode = getRunningHubKlingO1GenerationMode(payload, currentBody);
  if (runningHubKlingO1GenerationMode === 'reference') return 'reference';
  if (runningHubKlingO1GenerationMode === 'edit') return 'edit';
  const runningHubKlingO1FrameImages = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  }).length;
  if (runningHubKlingO1FrameImages >= 2) return 'frames';
  if (runningHubKlingO1FrameImages === 1) return 'image';
  const inputList = normalizeInputList(inputVideos).length;
  return inputList > 0 ? 'reference' : 'text';
}
export function runninghubKlingO1Video({
  currentBody: currentBody4,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value27 = { ...currentBody4 },
    runningHubKlingO1GenerationMode2 = getRunningHubKlingO1GenerationMode(payload, value27),
    klingKeepOriginalSound = normalizeKlingKeepOriginalSound(
      payload?.generationParams?.keepOriginalSound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keepOriginalSound ??
        payload?.keep_original_sound ??
        value27.keepOriginalSound ??
        value27.keep_original_sound,
    ),
    enabled5 = String(value27.prompt || payload?.prompt || '').trim();
  if (!enabled5) throw new Error('RunningHub Kling O1 prompt is required');
  ((value27.prompt = enabled5),
    (value27.mode = normalizeRunningHubKlingO1QualityMode(value27.mode)),
    (value27.aspectRatio = normalizeRunningHubKlingO1AspectRatio(value27.aspectRatio)),
    (value27.duration = normalizeRunningHubKlingO1Duration(value27.duration)),
    delete value27.rh_kling_o1_generation_mode,
    delete value27.keep_original_sound,
    delete value27.keepOriginalSound,
    delete value27.firstImageUrl,
    delete value27.lastImageUrl,
    delete value27.imageUrls,
    delete value27.videoUrl);
  const list16 = normalizeInputList(inputVideos),
    count = Math.max(
      list16.length,
      normalizeInputList(payload?.videos).length,
      normalizeInputList(payload?.videoUrls).length,
      String(payload?.videoUrl || '').trim() ? 1 : 0,
    );
  if (runningHubKlingO1GenerationMode2 === 'edit') {
    const list17 = [];
    (collectRunningHubKlingO1FrameImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot }).forEach((value28) => appendUniqueUrl(list17, value28)),
      collectRunningHubKlingO1ReferenceImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot }).forEach((value29) => appendUniqueUrl(list17, value29)));
    if (list17.length > 0)
      throw new Error('RunningHub Kling O1 edit mode does not accept image input');
    if (count < 1 || !list16[0]) throw new Error('RunningHub Kling O1 edit mode requires 1 video input');
    if (count > 1) throw new Error('RunningHub Kling O1 edit mode supports at most 1 video input');
    return (
      (value27.mode = 'std'),
      (value27.videoUrl = list16[0]),
      (value27.keepOriginalSound = klingKeepOriginalSound),
      delete value27.aspectRatio,
      delete value27.duration,
      value27
    );
  }
  if (runningHubKlingO1GenerationMode2 === 'reference') {
    const list18 = collectRunningHubKlingO1ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list18.length < 1)
      throw new Error('RunningHub Kling O1 reference mode requires at least 1 image input');
    if (list18.length > 7)
      throw new Error('RunningHub Kling O1 reference mode supports at most 7 image inputs');
    if (count < 1 || !list16[0])
      throw new Error('RunningHub Kling O1 reference mode requires 1 video input');
    if (count > 1)
      throw new Error(
        'RunningHub Kling O1 reference mode supports at most 1 video input',
      );
    return (
      (value27.imageUrls = list18),
      (value27.videoUrl = list16[0]),
      (value27.keepOriginalSound = klingKeepOriginalSound),
      (value27.prompt = replaceKlingO1PromptImageReferences(value27.prompt, list18.length)),
      value27
    );
  }
  const list19 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list16.length > 0)
    throw new Error('RunningHub Kling O1 frame mode does not accept video input; use reference mode');
  if (list19.length > 2)
    throw new Error('RunningHub Kling O1 frame mode supports at most 2 image inputs');
  if (list19[0]) value27.firstImageUrl = list19[0];
  if (list19[1]) value27.lastImageUrl = list19[1];
  return (
    (value27.prompt = replaceKlingO1PromptImageReferences(value27.prompt, list19.length)),
    value27
  );
}
export function runninghubKlingO1VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubKlingO1Route = resolveRunningHubKlingO1Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O1_ENDPOINTS[runningHubKlingO1Route] || RUNNINGHUB_KLING_O1_ENDPOINTS.text;
}
const RUNNINGHUB_KLING_V3_ENDPOINTS = Object.freeze({
  'turbo-pro': Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-pro/image-to-video',
  }),
  std: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/image-to-video',
  }),
  pro: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video',
  }),
  '4k': Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video',
  }),
});
function normalizeRunningHubKlingV3Model(value30) {
  const value31 = String(value30 || '')
    .trim()
    .toLowerCase();
  if (value31 === '4k') return '4k';
  if (value31 === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingV3Model(options7 = {}, value32 = {}, value33 = '', value34 = {}, value35 = {}) {
  const list20 = String(value33 || options7?.model || value32?.model || '')
      .trim()
      .toLowerCase(),
    list21 = String(value34?.id || value35?.modelId || '')
      .trim()
      .toLowerCase();
  if (list20.includes('kling-v3-turbo-pro') || list21.includes('kling-v3-turbo-pro'))
    return 'turbo-pro';
  return normalizeRunningHubKlingV3Model(
    value32.rh_kling_v3_model ||
      options7?.generationParams?.resolution ||
      options7?.resolution,
  );
}
function collectRunningHubKlingV3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value36 = [],
    inputUrlsBySlot5 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value36, inputUrlsBySlot5.firstFrame),
    appendUniqueUrl(value36, inputUrlsBySlot5.lastFrame),
    normalizeInputList(inputImages).forEach((value37) => appendUniqueUrl(value36, value37)),
    value36
  );
}
function getRunningHubKlingV3RawMediaCount(options8 = {}, value38 = [], value39 = '') {
  const value40 = value39 === 'audio' ? 'audioUrl' : value39 + 'Url',
    value41 = value39 + 's',
    value42 = value39 + 'Urls';
  return Math.max(
    normalizeInputList(value38).length,
    normalizeInputList(options8?.[value41]).length,
    normalizeInputList(options8?.[value42]).length,
    String(options8?.[value40] || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubKlingV3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
} = {}) {
  const model3 = getRunningHubKlingV3Model(
      payload,
      currentBody,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    route2 = collectRunningHubKlingV3FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  return { model: model3, route: route2 > 0 ? 'image' : 'text' };
}
export function runninghubKlingV3Video({
  currentBody: currentBody5,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const value43 = { ...currentBody5 },
    runningHubKlingV3Model = getRunningHubKlingV3Model(
      payload,
      value43,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    enabled6 = String(value43.prompt || payload?.prompt || '').trim();
  if (!enabled6) throw new Error('RunningHub Kling V3.0 prompt is required');
  const runningHubKlingV3RawMediaCount3 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video');
  if (runningHubKlingV3RawMediaCount3 > 0)
    throw new Error('RunningHub Kling V3.0 does not accept video input');
  const runningHubKlingV3RawMediaCount4 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (runningHubKlingV3RawMediaCount4 > 0)
    throw new Error('RunningHub Kling V3.0 does not accept audio input');
  ((value43.prompt = enabled6),
    delete value43.rh_kling_v3_model,
    delete value43.imageUrl,
    delete value43.firstImageUrl,
    delete value43.lastImageUrl,
    delete value43.imageUrls);
  const list22 = collectRunningHubKlingV3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list22.length > 2) throw new Error('RunningHub Kling V3.0 supports at most 2 image inputs');
  if (list22.length > 0) {
    delete value43.aspectRatio;
    if (runningHubKlingV3Model === '4k') {
      if (list22.length > 1)
        throw new Error('RunningHub Kling V3.0 4K image-to-video supports only one imageUrl');
      return ((value43.imageUrl = list22[0]), value43);
    }
    value43.firstImageUrl = list22[0];
    if (list22[1]) value43.lastImageUrl = list22[1];
  }
  return value43;
}
export function runninghubKlingV3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const { model: model4, route: route3 } = resolveRunningHubKlingV3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
    currentBody: { model: modelToken },
    modelToken: modelToken,
    executionManifest: executionManifest,
    modelManifest: modelManifest,
  });
  return RUNNINGHUB_KLING_V3_ENDPOINTS[model4]?.[route3] || RUNNINGHUB_KLING_V3_ENDPOINTS.std.text;
}
const RUNNINGHUB_KLING_O3_ENDPOINTS = Object.freeze({
  std: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit',
  }),
  pro: Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/video-edit',
  }),
  '4k': Object.freeze({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video',
  }),
});
function normalizeRunningHubKlingO3GenerationMode(value44) {
  const value45 = String(value44 || '')
    .trim()
    .toLowerCase();
  if (value45 === 'reference' || value45 === 'edit') return value45;
  return 'frame';
}
function normalizeRunningHubKlingO3Model(value46) {
  const value47 = String(value46 || '')
    .trim()
    .toLowerCase();
  if (value47 === '4k') return '4k';
  if (value47 === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingO3GenerationMode(options9 = {}, value48 = {}) {
  return normalizeRunningHubKlingO3GenerationMode(
    value48.kling_v3_omni_mode ||
      options9?.generationParams?.kling_v3_omni_mode ||
      options9?.kling_v3_omni_mode,
  );
}
function getRunningHubKlingO3Model(options10 = {}, value49 = {}) {
  return normalizeRunningHubKlingO3Model(
    value49.rh_kling_o3_model ||
      options10?.generationParams?.resolution ||
      options10?.resolution,
  );
}
function collectRunningHubKlingO3SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const value50 = [],
    inputUrlsBySlot6 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    map2 = new Set(normalizeInputList(Object.values(inputUrlsBySlot6)));
  return (
    slotIds.forEach((value51) => appendUniqueUrl(value50, inputUrlsBySlot6[value51])),
    normalizeInputList(inputImages).forEach((value52) => {
      if (!map2.has(value52)) appendUniqueUrl(value50, value52);
    }),
    value50
  );
}
function collectRunningHubKlingO3FrameImages(args3 = {}) {
  return collectRunningHubKlingO3SlotImages({ ...args3, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubKlingO3ReferenceImages(args4 = {}) {
  return collectRunningHubKlingO3SlotImages({ ...args4, slotIds: ['referenceImage'] });
}
function collectRunningHubKlingO3EditImages(args5 = {}) {
  return collectRunningHubKlingO3SlotImages({ ...args5, slotIds: ['editRefImage'] });
}
function resolveRunningHubKlingO3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const model5 = getRunningHubKlingO3Model(payload, currentBody),
    runningHubKlingO3GenerationMode = getRunningHubKlingO3GenerationMode(payload, currentBody);
  if (runningHubKlingO3GenerationMode === 'reference') return { model: model5, route: 'reference' };
  if (runningHubKlingO3GenerationMode === 'edit') return { model: model5, route: 'edit' };
  const route4 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  }).length;
  return { model: model5, route: route4 > 0 ? 'image' : 'text' };
}
export function runninghubKlingO3Video({
  currentBody: currentBody6,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value53 = { ...currentBody6 },
    runningHubKlingO3Model = getRunningHubKlingO3Model(payload, value53),
    runningHubKlingO3GenerationMode2 = getRunningHubKlingO3GenerationMode(payload, value53),
    enabled7 = String(value53.prompt || payload?.prompt || '').trim();
  if (!enabled7) throw new Error('RunningHub Kling O3 prompt is required');
  const runningHubKlingV3RawMediaCount5 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (runningHubKlingV3RawMediaCount5 > 0)
    throw new Error('RunningHub Kling O3 does not accept direct audio input');
  const inputList2 = normalizeInputList(inputVideos),
    runningHubKlingV3RawMediaCount6 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    klingKeepOriginalSound2 = normalizeKlingKeepOriginalSound(
      value53.keepOriginalSound ??
        value53.keep_original_sound ??
        payload?.generationParams?.keepOriginalSound ??
        payload?.generationParams?.keep_original_sound ??
        payload?.keepOriginalSound ??
        payload?.keep_original_sound,
    );
  ((value53.prompt = enabled7),
    delete value53.kling_v3_omni_mode,
    delete value53.rh_kling_o3_model,
    delete value53.keep_original_sound,
    delete value53.keepOriginalSound,
    delete value53.firstImageUrl,
    delete value53.lastImageUrl,
    delete value53.imageUrl,
    delete value53.imageUrls,
    delete value53.videoUrl);
  if (runningHubKlingO3GenerationMode2 === 'edit') {
    if (runningHubKlingO3Model === '4k')
      throw new Error('RunningHub Kling O3 4K does not support video edit');
    if (runningHubKlingV3RawMediaCount6 < 1 || !inputList2[0])
      throw new Error('RunningHub Kling O3 edit mode requires 1 video input');
    if (runningHubKlingV3RawMediaCount6 > 1)
      throw new Error('RunningHub Kling O3 edit mode supports at most 1 video input');
    const list23 = collectRunningHubKlingO3EditImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list23.length > 7)
      throw new Error('RunningHub Kling O3 edit mode supports at most 7 image inputs');
    value53.videoUrl = inputList2[0];
    if (list23.length > 0) value53.imageUrls = list23;
    return (
      (value53.keepOriginalSound = klingKeepOriginalSound2),
      delete value53.aspectRatio,
      delete value53.duration,
      delete value53.sound,
      delete value53.multiShot,
      delete value53.shotType,
      value53
    );
  }
  if (runningHubKlingO3GenerationMode2 === 'reference') {
    const list24 = collectRunningHubKlingO3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list24.length < 1)
      throw new Error('RunningHub Kling O3 reference mode requires at least 1 image input');
    if (runningHubKlingV3RawMediaCount6 > 1)
      throw new Error('RunningHub Kling O3 reference mode supports at most 1 video input');
    if (inputList2[0] && list24.length > 4)
      throw new Error('RunningHub Kling O3 reference mode supports at most 4 image inputs with video input');
    if (list24.length > 7)
      throw new Error('RunningHub Kling O3 reference mode supports at most 7 image inputs');
    value53.imageUrls = list24;
    if (inputList2[0]) value53.videoUrl = inputList2[0];
    value53.keepOriginalSound = klingKeepOriginalSound2;
    if (runningHubKlingO3Model !== '4k') delete value53.shotType;
    return value53;
  }
  if (runningHubKlingV3RawMediaCount6 > 0)
    throw new Error('RunningHub Kling O3 frame mode does not accept video input; use reference or edit mode');
  const list25 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list25.length > 2)
    throw new Error('RunningHub Kling O3 frame mode supports at most 2 image inputs');
  if (runningHubKlingO3Model === '4k' && list25.length > 1)
    throw new Error(
      'RunningHub Kling O3 4K image-to-video supports only one firstImageUrl',
    );
  if (list25.length > 0) {
    (delete value53.aspectRatio, (value53.firstImageUrl = list25[0]));
    if (list25[1]) value53.lastImageUrl = list25[1];
  }
  return value53;
}
export function runninghubKlingO3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: model6, route: route5 } = resolveRunningHubKlingO3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O3_ENDPOINTS[model6]?.[route5] || RUNNINGHUB_KLING_O3_ENDPOINTS.std.text;
}
const RUNNINGHUB_HAILUO_23_ENDPOINTS = Object.freeze({
  t2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard',
  t2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro',
  i2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
  i2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro',
  i2vFast: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
  i2vFastPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video',
});
function normalizeRunningHubHailuo23Quality(value54) {
  const value55 = String(value54 || '')
    .trim()
    .toLowerCase();
  if (value55 === 'pro') return 'pro';
  if (value55 === 'fast') return 'fast';
  if (value55 === 'fastpro' || value55 === 'fast-pro' || value55 === 'fast_pro') return 'fastPro';
  return 'standard';
}
function normalizeRunningHubHailuo23Duration(value56) {
  const value57 = Number(value56);
  return Number.isFinite(value57) && Math.trunc(value57) === 10 ? '10' : '6';
}
function getRunningHubHailuo23Quality(options11 = {}, value58 = {}) {
  return normalizeRunningHubHailuo23Quality(
    value58.rh_hailuo_23_quality ||
      options11?.generationParams?.rh_hailuo_23_quality ||
      options11?.rh_hailuo_23_quality,
  );
}
function collectRunningHubHailuo23FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value59 = [],
    inputUrlsBySlot7 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value59, inputUrlsBySlot7.firstFrame),
    normalizeInputList(inputImages).forEach((value60) => appendUniqueUrl(value59, value60)),
    value59
  );
}
function getRunningHubHailuo23RawVideoCount(options12 = {}, value61 = []) {
  return Math.max(
    normalizeInputList(value61).length,
    normalizeInputList(options12?.videos).length,
    normalizeInputList(options12?.videoUrls).length,
    String(options12?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubHailuo23Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const runningHubHailuo23Quality = getRunningHubHailuo23Quality(payload, currentBody),
    runningHubHailuo23FrameImages = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }).length;
  if (runningHubHailuo23Quality === 'fast') return 'i2vFast';
  if (runningHubHailuo23Quality === 'fastPro') return 'i2vFastPro';
  if (runningHubHailuo23Quality === 'pro') return runningHubHailuo23FrameImages > 0 ? 'i2vPro' : 't2vPro';
  return runningHubHailuo23FrameImages > 0 ? 'i2vStandard' : 't2vStandard';
}
export function runninghubHailuo23Video({
  currentBody: currentBody7,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value62 = { ...currentBody7 },
    enabled8 = String(value62.prompt || payload?.prompt || '').trim();
  if (!enabled8) throw new Error('RunningHub Hailuo 2.3 prompt is required');
  const runningHubHailuo23Quality2 = getRunningHubHailuo23Quality(payload, value62),
    list26 = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    runningHubHailuo23RawVideoCount = getRunningHubHailuo23RawVideoCount(payload, inputVideos);
  if (runningHubHailuo23RawVideoCount > 0)
    throw new Error('RunningHub Hailuo 2.3 does not accept video input');
  if (list26.length > 1)
    throw new Error('RunningHub Hailuo 2.3 supports only imageUrl input');
  ((value62.prompt = enabled8),
    (value62.duration = normalizeRunningHubHailuo23Duration(value62.duration)),
    delete value62.rh_hailuo_23_quality,
    delete value62.firstImageUrl,
    delete value62.lastImageUrl,
    delete value62.imageUrl,
    delete value62.imageUrls,
    delete value62.videoUrl);
  if (runningHubHailuo23Quality2 === 'fast' || runningHubHailuo23Quality2 === 'fastPro') {
    if (!list26[0]) throw new Error('RunningHub Hailuo 2.3 Fast requires imageUrl input');
    return (
      (value62.imageUrl = list26[0]),
      runningHubHailuo23Quality2 === 'fastPro' && (value62.duration = '6'),
      value62
    );
  }
  runningHubHailuo23Quality2 === 'pro' && delete value62.duration;
  if (list26[0]) value62.imageUrl = list26[0];
  return value62;
}
export function runninghubHailuo23VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubHailuo23Route = resolveRunningHubHailuo23Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_HAILUO_23_ENDPOINTS[runningHubHailuo23Route] || RUNNINGHUB_HAILUO_23_ENDPOINTS.t2vStandard
  );
}
const RUNNINGHUB_VEO3_ENDPOINTS = Object.freeze({
  lowCost: Object.freeze({
    text: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video',
    }),
    image: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
    }),
    frames: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video',
    }),
  }),
  official: Object.freeze({
    text: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/text-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video',
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/text-to-video',
    }),
    image: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/image-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/image-to-video',
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/image-to-video',
    }),
    frames: Object.freeze({
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video',
    }),
    reference: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/reference-to-video',
    }),
    extend: Object.freeze({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/video-extend',
    }),
  }),
});
function normalizeRunningHubVeo3Channel(value63) {
  const value64 = String(value63 || '')
    .trim()
    .toLowerCase();
  if (value64 === 'official' || value64 === 'stable' || value64 === 'officialstable') return 'official';
  return 'lowCost';
}
function normalizeRunningHubVeo3Mode(value65, { channel: channel = 'lowCost' } = {}) {
  const value66 = String(value65 || '')
    .trim()
    .toLowerCase();
  if (value66 === 'quality' || value66 === 'pro') return 'pro';
  if (value66 === 'lite' && channel === 'official') return 'lite';
  return 'fast';
}
function getRunningHubVeo3Channel(options13 = {}, value67 = {}) {
  return normalizeRunningHubVeo3Channel(
    value67.rh_veo3_channel ||
      options13?.generationParams?.rh_veo3_channel ||
      options13?.rh_veo3_channel,
  );
}
function getRunningHubVeo3Mode(options14 = {}, value68 = {}) {
  const channel2 = getRunningHubVeo3Channel(options14, value68);
  return normalizeRunningHubVeo3Mode(
    value68.mode || options14?.generationParams?.mode || options14?.mode,
    { channel: channel2 },
  );
}
function getRunningHubVeo3GenerationType(options15 = {}, value69 = {}) {
  const value70 = String(
    value69.generation_type ||
      options15?.generationParams?.generation_type ||
      options15?.generation_type ||
      'frame',
  )
    .trim()
    .toLowerCase();
  if (value70 === 'reference' || value70 === 'extend') return value70;
  return 'frame';
}
function collectRunningHubVeo3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value71 = [],
    inputUrlsBySlot8 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value71, inputUrlsBySlot8.firstFrame),
    appendUniqueUrl(value71, inputUrlsBySlot8.lastFrame),
    normalizeInputList(inputImages).forEach((value72) => appendUniqueUrl(value71, value72)),
    value71
  );
}
function collectRunningHubVeo3ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value73 = [],
    inputUrlsBySlot9 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(value73, inputUrlsBySlot9.referenceImage),
    normalizeInputList(inputImages).forEach((value74) => appendUniqueUrl(value73, value74)),
    value73
  );
}
function getRunningHubVeo3RawVideoCount(options16 = {}, value75 = []) {
  return Math.max(
    normalizeInputList(value75).length,
    normalizeInputList(options16?.videos).length,
    normalizeInputList(options16?.videoUrls).length,
    String(options16?.videoUrl || '').trim() ? 1 : 0,
  );
}
function resolveRunningHubVeo3Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const channel3 = getRunningHubVeo3Channel(payload, currentBody),
    mode = getRunningHubVeo3Mode(payload, currentBody),
    runningHubVeo3GenerationType = getRunningHubVeo3GenerationType(payload, currentBody);
  if (runningHubVeo3GenerationType === 'extend' || normalizeInputList(inputVideos).length > 0)
    return Object.freeze({ channel: channel3, mode: mode, route: 'extend' });
  if (runningHubVeo3GenerationType === 'reference')
    return Object.freeze({ channel: channel3, mode: mode, route: 'reference' });
  const list27 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list27.length >= 2) return Object.freeze({ channel: channel3, mode: mode, route: 'frames' });
  if (list27.length === 1)
    return Object.freeze({
      channel: channel3,
      mode: mode,
      route: channel3 === 'lowCost' && mode === 'pro' ? 'frames' : 'image',
    });
  return Object.freeze({ channel: channel3, mode: mode, route: 'text' });
}
function normalizeRunningHubVeo3BodyResolution(value76, { channel: channel4, mode: mode2 }) {
  const value77 = String(value76 || '720p')
    .trim()
    .toLowerCase();
  if (channel4 === 'lowCost') return '720p';
  if (mode2 === 'lite' && value77 === '4k') return '1080p';
  if (value77 === '4k' || value77 === '1080p') return value77;
  return '720p';
}
function normalizeRunningHubVeo3BodyDuration(value78, { channel: channel5, mode: mode3 }) {
  if (channel5 === 'lowCost') return '8';
  const count2 = Math.trunc(Number(value78));
  if (mode3 === 'lite') return count2 === 8 ? '8' : '6';
  return [4, 6, 8].includes(count2) ? String(count2) : '8';
}
function removeRunningHubVeo3TransientFields(value79) {
  (delete value79.rh_veo3_channel,
    delete value79.mode,
    delete value79.generation_type,
    delete value79.imageUrl,
    delete value79.imageUrls,
    delete value79.firstFrameUrl,
    delete value79.lastFrameUrl,
    delete value79.firstImageUrl,
    delete value79.lastImageUrl,
    delete value79.videoUrl,
    delete value79.video);
}
export function runninghubVeo3Video({
  currentBody: currentBody8,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const currentBody9 = { ...currentBody8 },
    runningHubVeo3Route = resolveRunningHubVeo3Route({
      inputImages: inputImages,
      inputVideos: inputVideos,
      payload: payload,
      finalUrlsBySlot: finalUrlsBySlot,
      currentBody: currentBody9,
    }),
    { channel: channel6, mode: mode4, route: route6 } = runningHubVeo3Route,
    runningHubVeo3GenerationType2 = getRunningHubVeo3GenerationType(payload, currentBody9),
    runningHubVeo3RawVideoCount = getRunningHubVeo3RawVideoCount(payload, inputVideos);
  if (runningHubVeo3RawVideoCount > 0 && route6 !== 'extend')
    throw new Error('RunningHub Veo3 does not accept video input');
  const enabled9 = String(currentBody9.prompt || payload?.prompt || '').trim();
  if (route6 !== 'extend') {
    if (!enabled9) throw new Error('RunningHub Veo3 prompt is required');
    currentBody9.prompt = enabled9;
  }
  ((currentBody9.resolution = normalizeRunningHubVeo3BodyResolution(currentBody9.resolution, {
    channel: channel6,
    mode: mode4,
  })),
    (currentBody9.duration = normalizeRunningHubVeo3BodyDuration(currentBody9.duration, {
      channel: channel6,
      mode: mode4,
    })),
    removeRunningHubVeo3TransientFields(currentBody9));
  if (route6 === 'extend') {
    if (channel6 !== 'official' || mode4 === 'lite')
      throw new Error('RunningHub Veo3 video extend only supports official Fast or Pro');
    const inputList3 = normalizeInputList(inputVideos);
    if (runningHubVeo3RawVideoCount < 1 || !inputList3[0])
      throw new Error('RunningHub Veo3 video extend requires 1 video input');
    if (runningHubVeo3RawVideoCount > 1)
      throw new Error('RunningHub Veo3 video extend supports at most 1 video input');
    const list28 = [];
    (collectRunningHubVeo3FrameImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot }).forEach((value80) => appendUniqueUrl(list28, value80)),
      collectRunningHubVeo3ReferenceImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot }).forEach((value81) => appendUniqueUrl(list28, value81)));
    if (list28.length > 0) throw new Error('RunningHub Veo3 video extend does not accept image input');
    return (
      (currentBody9.video = inputList3[0]),
      delete currentBody9.prompt,
      delete currentBody9.duration,
      delete currentBody9.aspectRatio,
      delete currentBody9.generateAudio,
      currentBody9
    );
  }
  if (runningHubVeo3GenerationType2 === 'reference') {
    if (channel6 !== 'official' || mode4 === 'lite')
      throw new Error(
        'RunningHub Veo3 reference mode only supports official Fast or Pro',
      );
    const list29 = collectRunningHubVeo3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (list29.length < 1)
      throw new Error('RunningHub Veo3 reference mode requires 1-3 image inputs');
    if (list29.length > 3)
      throw new Error('RunningHub Veo3 reference mode supports at most 3 image inputs');
    ((currentBody9.imageUrls = list29), delete currentBody9.duration);
    if (mode4 === 'pro') delete currentBody9.aspectRatio;
    return currentBody9;
  }
  const list30 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list30.length > 2) throw new Error('RunningHub Veo3 frame mode supports at most 2 image inputs');
  if (list30.length >= 2 && channel6 === 'official' && mode4 !== 'lite')
    throw new Error(
      'RunningHub Veo3 official Fast/Pro start-end endpoint is not published; use official Lite or low-cost channel',
    );
  if (list30.length === 1) {
    if (channel6 === 'official') currentBody9.imageUrl = list30[0];
    else
      mode4 === 'pro'
        ? (currentBody9.firstFrameUrl = list30[0])
        : (currentBody9.imageUrls = [list30[0]]);
  } else
    list30.length === 2 &&
      (channel6 === 'official'
        ? ((currentBody9.firstImageUrl = list30[0]),
          (currentBody9.lastImageUrl = list30[1]),
          delete currentBody9.duration)
        : ((currentBody9.firstFrameUrl = list30[0]), (currentBody9.lastFrameUrl = list30[1])));
  return ((channel6 === 'lowCost' || mode4 === 'lite') && delete currentBody9.generateAudio, currentBody9);
}
export function runninghubVeo3VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const {
    channel: channel7,
    mode: mode5,
    route: route7,
  } = resolveRunningHubVeo3Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_VEO3_ENDPOINTS[channel7]?.[route7]?.[mode5] ||
    RUNNINGHUB_VEO3_ENDPOINTS.lowCost.text.fast
  );
}
const RUNNINGHUB_WAN27_ENDPOINTS = Object.freeze({
  text: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
  video: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend',
  reference: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit',
});
function normalizeRunningHubWan27Mode(value82) {
  const value83 = String(value82 || '')
    .trim()
    .toLowerCase();
  return value83 === 'video' || value83 === 'reference' || value83 === 'edit' ? value83 : 'image';
}
function getRunningHubWan27Mode(options17 = {}, value84 = {}) {
  return normalizeRunningHubWan27Mode(
    value84.wan27_mode || options17?.generationParams?.wan27_mode || options17?.wan27_mode,
  );
}
function collectRunningHubWan27Images({
  mode: mode6,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value85 = [],
    inputUrlsBySlot10 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  if (mode6 === 'image')
    (appendUniqueUrl(value85, inputUrlsBySlot10.firstFrame),
      appendUniqueUrl(value85, inputUrlsBySlot10.lastFrame));
  else {
    if (mode6 === 'reference') appendUniqueUrl(value85, inputUrlsBySlot10.referenceImage);
    else mode6 === 'edit' && appendUniqueUrl(value85, inputUrlsBySlot10.editRefImage);
  }
  return (
    normalizeInputList(inputImages).forEach((value86) => appendUniqueUrl(value85, value86)),
    value85
  );
}
function removeRunningHubWan27TransientFields(enabled10) {
  (delete enabled10.wan27_mode,
    delete enabled10.firstImageUrl,
    delete enabled10.lastImageUrl,
    delete enabled10.imageUrl,
    delete enabled10.imageUrls,
    delete enabled10.videoUrl,
    delete enabled10.videoUrls);
  if (!enabled10.aspectRatio) delete enabled10.aspectRatio;
}
function resolveRunningHubWan27Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const mode7 = getRunningHubWan27Mode(payload, currentBody);
  if (mode7 === 'reference' || mode7 === 'edit') return mode7;
  const list31 = normalizeInputList(inputVideos);
  if (mode7 === 'video' && list31.length > 0) return 'video';
  const list32 = collectRunningHubWan27Images({
    mode: mode7,
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (list32.length > 0) return 'image';
  return 'text';
}
export function runninghubWan27Video({
  currentBody: currentBody10,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value87 = { ...currentBody10 },
    enabled11 = String(value87.prompt || payload?.prompt || '').trim();
  if (!enabled11) throw new Error('RunningHub Wan2.7 prompt is required');
  const mode8 = getRunningHubWan27Mode(payload, value87),
    list33 = collectRunningHubWan27Images({
      mode: mode8,
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    list34 = normalizeInputList(inputVideos),
    value88 = String(value87.audioUrl || '').trim() || normalizeInputList(inputAudios)[0] || '';
  value87.prompt = enabled11;
  if (value88) value87.audioUrl = value88;
  removeRunningHubWan27TransientFields(value87);
  if (mode8 === 'reference') {
    const count3 = list33.length + list34.length;
    if (count3 <= 0) throw new Error('RunningHub Wan2.7 reference mode requires image or video input');
    if (count3 > 5) throw new Error('RunningHub Wan2.7 reference mode supports at most 5 inputs');
    if (value88) throw new Error('RunningHub Wan2.7 reference mode does not accept audio input');
    if (list33.length > 0) value87.imageUrls = list33;
    if (list34.length > 0) value87.videoUrls = list34;
    return value87;
  }
  if (mode8 === 'edit') {
    if (!list34[0]) throw new Error('RunningHub Wan2.7 video edit requires original video input');
    if (list34.length > 1)
      throw new Error('RunningHub Wan2.7 video edit accepts only one original video');
    if (list33.length > 3)
      throw new Error(
        'RunningHub Wan2.7 video edit supports at most 3 image inputs',
      );
    if (value88) throw new Error('RunningHub Wan2.7 video edit does not accept audio input');
    value87.videoUrl = list34[0];
    if (list33.length > 0) value87.imageUrls = list33.slice(0, 3);
    return value87;
  }
  if (mode8 === 'video') {
    if (list33.length > 0) throw new Error('RunningHub Wan2.7 video extend does not accept image input');
    if (list34.length > 1)
      throw new Error('RunningHub Wan2.7 video extend accepts only one video input');
    if (list34[0]) value87.videoUrl = list34[0];
    return value87;
  }
  if (list34.length > 0)
    throw new Error('RunningHub Wan2.7 image mode does not accept video input');
  if (list33.length > 2) throw new Error('RunningHub Wan2.7 image mode supports at most 2 image inputs');
  list33[0] && (delete value87.aspectRatio, (value87.firstImageUrl = list33[0]));
  if (list33[1]) value87.lastImageUrl = list33[1];
  return value87;
}
export function runninghubWan27VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const runningHubWan27Route = resolveRunningHubWan27Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_WAN27_ENDPOINTS[runningHubWan27Route] || RUNNINGHUB_WAN27_ENDPOINTS.text;
}
