import { normalizeRatioLabelText } from '../../imageRatioPolicy.js';
import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeOptionalIntegerInRange,
  normalizePositiveInteger,
  stripPrefix,
} from './sharedResolverUtils.js';
function normalizeSeedanceRouteMode(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  if (item === 'multimodal2video' || item === 'reference') return 'multimodal2video';
  if (item === 'frames2video' || item === 'frames') return 'frames2video';
  if (item === 'image2video' || item === 'image' || item === 'frame') return 'image2video';
  return 'text2video';
}
function getVolcengineSeedance2Mode(options = {}, key = {}) {
  return normalizeSeedanceRouteMode(
    options?.dreaminaRouteMode ||
      options?.dreaminaTaskType ||
      options?.generationParams?.dreaminaRouteMode ||
      key.volcengine_seedance_2_mode ||
      options?.generationParams?.volcengine_seedance_2_mode ||
      options?.volcengine_seedance_2_mode,
  );
}
function resolveVolcengineSeedance2TaskType({
  routeMode: routeMode = '',
  frameImageCount: frameImageCount = 0,
  referenceImageCount: referenceImageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const seedanceRouteMode = normalizeSeedanceRouteMode(routeMode),
    positiveInteger = normalizePositiveInteger(frameImageCount, 0),
    positiveInteger2 = normalizePositiveInteger(referenceImageCount, 0),
    positiveInteger3 = normalizePositiveInteger(videoCount, 0),
    positiveInteger4 = normalizePositiveInteger(audioCount, 0);
  if (seedanceRouteMode === 'frames2video') {
    if (positiveInteger >= 2) return 'frames2video';
    if (positiveInteger === 1) return 'image2video';
    return 'text2video';
  }
  if (seedanceRouteMode === 'image2video') return 'image2video';
  if (seedanceRouteMode === 'text2video') return 'text2video';
  if (positiveInteger2 > 0 || positiveInteger3 > 0 || positiveInteger4 > 0) return 'multimodal2video';
  return 'text2video';
}
function getVolcengineSeedance2ModelTier(index = '') {
  const list = String(index || '').toLowerCase();
  if (list.includes('mini')) return 'mini';
  if (list.includes('fast')) return 'fast';
  return 'standard';
}
function normalizeVolcengineSeedance2Resolution(result, data = {}, target = '') {
  const source = String(result || data.defaultResolution || '720p')
      .trim()
      .toLowerCase(),
    list2 = Array.isArray(data.allowedResolutions)
      ? data.allowedResolutions
          .map((next) =>
            String(next || '')
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean)
      : [];
  if (list2.length > 0)
    return list2.includes(source)
      ? source
      : list2.includes(
            String(data.defaultResolution || '')
              .trim()
              .toLowerCase(),
          )
        ? String(data.defaultResolution).trim().toLowerCase()
        : list2[0];
  const volcengineSeedance2ModelTier = getVolcengineSeedance2ModelTier(target);
  if (source === '4k' && volcengineSeedance2ModelTier === 'standard') return '4k';
  if (source === '1080p' && volcengineSeedance2ModelTier === 'standard') return '1080p';
  if (source === '480p') return '480p';
  return '720p';
}
function normalizeVolcengineSeedance2Ratio(current, entry = {}) {
  const enabled = String(current || '').trim();
  if (!enabled || enabled === 'auto' || enabled === 'default' || enabled === '自适应')
    return entry.defaultRatio || 'adaptive';
  const ratioLabelText = normalizeRatioLabelText(enabled);
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'].includes(ratioLabelText)
    ? ratioLabelText
    : entry.defaultRatio || 'adaptive';
}
function normalizeVolcengineSeedance2Duration(record, handle = {}) {
  const state = Number(record);
  if (state === -1 && handle.allowAutoDuration !== false) return -1;
  const positiveInteger5 = normalizePositiveInteger(handle.minDuration, 4),
    positiveInteger6 = normalizePositiveInteger(handle.maxDuration, 15);
  if (!Number.isFinite(state)) {
    const config = Number(handle.defaultDuration);
    return config === -1 && handle.allowAutoDuration !== false
      ? -1
      : Number.isFinite(config)
        ? Math.max(positiveInteger5, Math.min(positiveInteger6, Math.trunc(config)))
        : 5;
  }
  return Math.max(positiveInteger5, Math.min(positiveInteger6, Math.trunc(state)));
}
function normalizeVolcengineBoolean(scope, input = false) {
  if (scope === true || scope === false) return scope;
  if (scope === undefined || scope === null || String(scope).trim() === '') return input;
  const output = String(scope ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(output)) return true;
  if (['false', '0', 'no', 'off'].includes(output)) return false;
  return input;
}
function normalizeVolcengineSeedance2Priority(value2) {
  if (value2 === undefined || value2 === null || String(value2).trim() === '') return null;
  const value3 = Number.parseInt(String(value2).trim(), 10);
  if (!Number.isFinite(value3)) return null;
  return Math.max(0, Math.min(9, value3));
}
function normalizeVolcengineSeedance2OutputFormat(value4) {
  const value5 = String(value4 || 'mp4')
    .trim()
    .toLowerCase();
  return value5 === 'mov' ? 'mov' : 'mp4';
}
function normalizeVolcengineOmniReferenceTaskType(value6) {
  const value7 = String(value6 || '')
    .trim()
    .toLowerCase();
  return ['auto', 'reference', 'edit'].includes(value7) ? value7 : '';
}
function getVolcengineSeedance2Policy(value8) {
  const value9 = value8?.extensions?.seedanceVideo;
  return value9 && typeof value9 === 'object' && !Array.isArray(value9) ? value9 : {};
}
function getVolcengineSlotMedia(options2 = {}, value10) {
  return String(normalizeInputUrlsBySlot(options2)[value10] || '').trim();
}
function collectVolcengineSeedance2FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value11 = [];
  return (
    appendUniqueUrl(value11, getVolcengineSlotMedia(finalUrlsBySlot, 'firstFrame')),
    appendUniqueUrl(value11, getVolcengineSlotMedia(finalUrlsBySlot, 'lastFrame')),
    normalizeInputList(inputImages).forEach((value12) => appendUniqueUrl(value11, value12)),
    value11
  );
}
function collectVolcengineSeedance2ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const value13 = [];
  appendUniqueUrl(value13, getVolcengineSlotMedia(finalUrlsBySlot, 'referenceImage'));
  const map = new Set(normalizeInputList(Object.values(normalizeInputUrlsBySlot(finalUrlsBySlot))));
  return (
    normalizeInputList(inputImages).forEach((value14) => {
      if (!map.has(value14)) appendUniqueUrl(value13, value14);
    }),
    value13
  );
}
function pushVolcengineContentItem(list3, type, value15, value16) {
  const url = String(value15 || '').trim();
  if (!url) return;
  const value17 = { type: type };
  if (type === 'image_url') value17.image_url = { url: url };
  else {
    if (type === 'video_url') value17.video_url = { url: url };
    else {
      if (type === 'audio_url') value17.audio_url = { url: url };
    }
  }
  if (value16) value17.role = value16;
  list3.push(value17);
}
export function volcengineSeedance2Video({
  currentBody: currentBody,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest,
}) {
  const value18 = { ...currentBody },
    volcengineSeedance2Policy = getVolcengineSeedance2Policy(executionManifest),
    text = String(value18.prompt || finalPrompt || payload?.prompt || '').trim(),
    routeMode2 = getVolcengineSeedance2Mode(payload, value18),
    frameImageCount2 = collectVolcengineSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    referenceImageCount2 = collectVolcengineSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    videoCount2 = normalizeInputList(inputVideos),
    audioCount2 = normalizeInputList(inputAudios),
    volcengineOmniReferenceTaskType = normalizeVolcengineOmniReferenceTaskType(
      value18.omni_reference_task_type ||
        payload?.generationParams?.omniReferenceTaskType ||
        payload?.generationParams?.omni_reference_task_type,
    ),
    volcengineSeedance2TaskType = resolveVolcengineSeedance2TaskType({
      routeMode: routeMode2,
      frameImageCount: frameImageCount2.length,
      referenceImageCount: referenceImageCount2.length,
      videoCount: videoCount2.length,
      audioCount: audioCount2.length,
    }),
    content = [];
  if (text) content.push({ type: 'text', text: text });
  if (volcengineSeedance2TaskType === 'text2video') {
    if (!text) throw new Error('Volcengine Seedance prompt is required');
    if (frameImageCount2.length > 0 || videoCount2.length > 0 || audioCount2.length > 0)
      throw new Error('Volcengine Seedance text mode does not accept media input');
  } else {
    if (volcengineSeedance2TaskType === 'image2video') {
      if (videoCount2.length > 0 || audioCount2.length > 0)
        throw new Error('Volcengine Seedance image mode does not accept video or audio input');
      if (frameImageCount2.length < 1)
        throw new Error('Volcengine Seedance image mode requires 1 image input');
      pushVolcengineContentItem(content, 'image_url', frameImageCount2[0], 'first_frame');
    } else {
      if (volcengineSeedance2TaskType === 'frames2video') {
        if (videoCount2.length > 0 || audioCount2.length > 0)
          throw new Error('Volcengine Seedance first-last-frame mode only accepts images');
        if (frameImageCount2.length < 2)
          throw new Error('Volcengine Seedance first-last-frame mode requires 2 image inputs');
        (pushVolcengineContentItem(content, 'image_url', frameImageCount2[0], 'first_frame'),
          pushVolcengineContentItem(content, 'image_url', frameImageCount2[1], 'last_frame'));
      } else {
        const positiveInteger7 = normalizePositiveInteger(volcengineSeedance2Policy.maxImageCount, 9),
          positiveInteger8 = normalizePositiveInteger(
            volcengineSeedance2Policy.maxVideoReferenceCount,
            3,
          ),
          positiveInteger9 = normalizePositiveInteger(
            volcengineSeedance2Policy.maxAudioReferenceCount,
            3,
          ),
          value19 = volcengineSeedance2Policy.allowAudioOnlyReferences === true;
        if (
          referenceImageCount2.length + videoCount2.length <= 0 &&
          !(value19 && audioCount2.length > 0)
        )
          throw new Error('Volcengine Seedance multimodal mode requires image or video input');
        if (referenceImageCount2.length > positiveInteger7)
          throw new Error(
            'Volcengine Seedance multimodal mode supports at most ' + positiveInteger7 + ' image inputs',
          );
        if (videoCount2.length > positiveInteger8)
          throw new Error(
            'Volcengine Seedance multimodal mode supports at most ' +
              positiveInteger8 +
              ' video inputs',
          );
        if (audioCount2.length > positiveInteger9)
          throw new Error(
            'Volcengine Seedance multimodal mode supports at most ' +
              positiveInteger9 +
              ' audio inputs',
          );
        (referenceImageCount2.slice(0, positiveInteger7).forEach((value20) =>
          pushVolcengineContentItem(content, 'image_url', value20, 'reference_image'),
        ),
          videoCount2.slice(0, positiveInteger8).forEach((value21) =>
            pushVolcengineContentItem(content, 'video_url', value21, 'reference_video'),
          ),
          audioCount2.slice(0, positiveInteger9).forEach((value22) =>
            pushVolcengineContentItem(content, 'audio_url', value22, 'reference_audio'),
          ));
      }
    }
  }
  if (content.length === 0) throw new Error('Volcengine Seedance request content is empty');
  if (volcengineOmniReferenceTaskType === 'edit' && videoCount2.length < 1)
    throw new Error('Volcengine Seedance edit mode requires a reference video');
  const model = modelToken || value18.model || stripPrefix(payload.model, 'volcengine/'),
    value23 =
      volcengineSeedance2Policy.roleImagesRequireAdaptiveRatio === true &&
      (volcengineSeedance2TaskType === 'image2video' || volcengineSeedance2TaskType === 'frames2video')
        ? 'adaptive'
        : normalizeVolcengineSeedance2Ratio(value18.ratio, volcengineSeedance2Policy),
    ratio = volcengineOmniReferenceTaskType === 'edit',
    value24 = {
      model: model,
      content: content,
      resolution: normalizeVolcengineSeedance2Resolution(
        value18.resolution,
        volcengineSeedance2Policy,
        model,
      ),
      ratio: ratio ? 'adaptive' : value23,
      duration: ratio
        ? -1
        : normalizeVolcengineSeedance2Duration(value18.duration, volcengineSeedance2Policy),
      generate_audio: normalizeVolcengineBoolean(value18.generate_audio, true),
      watermark: normalizeVolcengineBoolean(value18.watermark, false),
    };
  volcengineSeedance2Policy.supportsOutputFormatParam === true &&
    (value24.output_format = normalizeVolcengineSeedance2OutputFormat(value18.output_format));
  normalizeVolcengineBoolean(value18.webSearch, false) && (value24.tools = [{ type: 'web_search' }]);
  const volcengineSeedance2Priority = normalizeVolcengineSeedance2Priority(value18.priority);
  if (volcengineSeedance2Priority !== null && volcengineSeedance2Priority > 0)
    value24.priority = volcengineSeedance2Priority;
  if (volcengineSeedance2Policy.supportsSeedParam === true) {
    const optionalIntegerInRange = normalizeOptionalIntegerInRange(value18.seed, {
      min: -1,
      max: 0x7fffffff,
    });
    if (optionalIntegerInRange !== null) value24.seed = optionalIntegerInRange;
  }
  return (
    volcengineOmniReferenceTaskType &&
      (value24.omni_reference_task_type = volcengineOmniReferenceTaskType),
    value24
  );
}
