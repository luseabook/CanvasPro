import { normalizeRatioLabelText } from '../../imageRatioPolicy.js';
import { uploadModelApiMediaInputs } from '../../mediaInputUploadRouter.js';
import {
  applyApimartPrivateAvatarAssetsToUrls,
  supportsApimartPrivateAvatarAssets,
} from '../apimartPrivateAvatarAssetResolver.js';
import {
  appendUniqueUrl,
  isPresentValue,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeKlingKeepOriginalSound,
  normalizeOptionalIntegerInRange,
  normalizePositiveInteger,
  replaceKlingO1PromptImageReferences,
  stripPrefix,
} from './sharedResolverUtils.js';
import { resolveMinimaxH3Request } from './minimaxH3VideoResolverShared.js';
const VEO3_MODEL_CHOICES = new Set(['fast', 'quality']),
  VEO3_IMAGE_GENERATION_TYPES = new Set(['frame', 'reference']),
  VIDU_Q3_VIDEO_MODELS = new Set(['viduq3-turbo', 'viduq3-pro']),
  VIDU_Q3_REFERENCE_MODELS = new Set(['viduq3', 'viduq3-mix']);
function normalizeApimartVeo3ModelChoice(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return VEO3_MODEL_CHOICES['has'](item) ? item : 'fast';
}
function getApimartVeo3ModelChoice(options = {}) {
  return normalizeApimartVeo3ModelChoice(options?.['generationParams']?.['mode'] ?? options?.['mode']);
}
function normalizeApimartVeo3GenerationType(key, { modelChoice: modelChoice = 'fast' } = {}) {
  const index = String(key || '')
      ['trim']()
      ['toLowerCase'](),
    result = VEO3_IMAGE_GENERATION_TYPES['has'](index) ? index : 'frame';
  if (normalizeApimartVeo3ModelChoice(modelChoice) === 'quality') return 'frame';
  return result;
}
function getApimartVeo3GenerationType(options2 = {}) {
  const modelChoice2 = getApimartVeo3ModelChoice(options2);
  return normalizeApimartVeo3GenerationType(
    options2?.['generationParams']?.['generation_type'] ?? options2?.['generation_type'],
    { modelChoice: modelChoice2 },
  );
}
function validateApimartVeo3ImageCount(
  options3 = {},
  data = 0,
  { allowTextOnly: allowTextOnly = false } = {},
) {
  const ok = Math['max'](0, Math['trunc'](Number(data) || 0));
  if (allowTextOnly && ok === 0) return Object['freeze']({ ok: true, message: '' });
  const apimartVeo3GenerationType = getApimartVeo3GenerationType(options3);
  if (apimartVeo3GenerationType === 'reference')
    return Object['freeze']({
      ok: ok <= 3,
      message: ok <= 3 ? '' : 'VEO3 参考图模式最多接入 3 张图片',
    });
  return Object['freeze']({
    ok: ok <= 2,
    message: ok <= 2 ? '' : 'VEO3 首尾帧模式最多接入 2 张图片',
  });
}
export function apimartOmniFlashVideo({ currentBody: currentBody }) {
  const target = { ...currentBody };
  if (!String(target['prompt'] || '')['trim']())
    throw new Error('Gemini Omni 1.1 Flash Ext requires a prompt');
  const source = String(target['generation_type'] || 'frame')
    ['trim']()
    ['toLowerCase']();
  if (source !== 'frame' && source !== 'reference')
    throw new Error('Gemini Omni 1.1 Flash Ext generation_type must be frame or reference');
  target['generation_type'] = source;
  const list = normalizeInputList(target['image_urls']);
  if (source === 'frame' && list['length'] > 1)
    throw new Error('Gemini Omni 1.1 Flash Ext frame mode supports at most 1 image');
  if (source === 'reference' && list['length'] > 0 && list['length'] !== 1 && list['length'] !== 3)
    throw new Error('Gemini Omni 1.1 Flash Ext reference mode supports only 1 or 3 images');
  return (normalizeInputList(target['video_urls'])['length'] > 0 && delete target['duration'], target);
}
export function apimartVeo3Video({
  currentBody: currentBody2,
  inputImages: inputImages = [],
  payload: payload = {},
}) {
  const next = { ...currentBody2 },
    list2 = normalizeInputList(inputImages),
    mode = getApimartVeo3ModelChoice(payload),
    generation_type = getApimartVeo3GenerationType(payload);
  ((next['duration'] = 8), delete next['official_fallback']);
  const current = String(next['resolution'] || '')
    ['trim']()
    ['toLowerCase']();
  if (next['enable_gif'] === true && (current === '1080p' || current === '4k'))
    throw new Error('APIMart VEO3 GIF output only supports 720p resolution');
  const error = validateApimartVeo3ImageCount(
    { generationParams: { mode: mode, generation_type: generation_type } },
    list2['length'],
    { allowTextOnly: true },
  );
  if (!error['ok']) throw new Error(error['message']);
  if (list2['length'] === 0) return (delete next['generation_type'], delete next['image_urls'], next);
  return (
    (next['generation_type'] = generation_type === 'reference' ? 'reference' : 'frame'),
    (next['image_urls'] =
      next['generation_type'] === 'reference' ? list2['slice'](0, 3) : list2['slice'](0, 2)),
    next
  );
}
export function apimartHappyHorseVideo({
  currentBody: currentBody3,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: executionManifest = null,
}) {
  const entry = { ...currentBody3 },
    record =
      executionManifest?.['extensions']?.['happyHorse'] &&
      typeof executionManifest['extensions']['happyHorse'] === 'object' &&
      !Array['isArray'](executionManifest['extensions']['happyHorse'])
        ? executionManifest['extensions']['happyHorse']
        : {},
    handle = String(record['versionLabel'] || 'HappyHorse 1.0')['trim'](),
    enabled = record['supportsEdit'] !== false,
    enabled2 = String(entry['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!enabled2) throw new Error(handle + ' prompt is required');
  const list3 = normalizeInputList(inputImages),
    list4 = normalizeInputList(inputVideos),
    inputUrlsBySlot = normalizeInputUrlsBySlot(finalUrlsBySlot),
    handler = (list5 = [], state = []) => {
      const list6 = [],
        handler2 = (config) => {
          const scope = String(config || '')['trim']();
          if (scope && !list6['includes'](scope)) list6['push'](scope);
        };
      return (
        list5['forEach']((input) => handler2(inputUrlsBySlot[input])),
        normalizeInputList(state)['forEach'](handler2),
        list6
      );
    };
  let output = String(
    payload?.['generationParams']?.['happyhorse_mode'] || payload?.['happyhorse_mode'] || 'auto',
  )['trim']();
  const enabled3 =
    list3['length'] > 0 || list4['length'] > 0 || Object['keys'](inputUrlsBySlot)['length'] > 0;
  (output === 'image' || output === 'reference' || output === 'edit') && !enabled3 && (output = 'auto');
  delete entry['happyhorse_mode'];
  if (!enabled && list4['length'] > 0) throw new Error(handle + ' does not support video edit mode');
  if (output === 'edit') {
    if (!enabled) throw new Error(handle + ' does not support video edit mode');
    if (!list4[0]) throw new Error(handle + ' video edit requires video_url input');
    const list7 = handler(['editRefImage'], list3);
    entry['video_url'] = list4[0];
    if (list7['length'] > 0) entry['image_urls'] = list7['slice'](0, 5);
    const value2 = String(
      payload?.['generationParams']?.['audio_setting'] || payload?.['audio_setting'] || '',
    )['trim']();
    return (
      (value2 === 'auto' || value2 === 'origin') && (entry['audio_setting'] = value2),
      delete entry['first_frame_image'],
      delete entry['size'],
      delete entry['duration'],
      entry
    );
  }
  delete entry['audio_setting'];
  if (output === 'image') {
    const enabled4 = handler(['firstFrame'], list3);
    if (!enabled4[0]) throw new Error(handle + ' image-to-video requires first_frame_image input');
    return (
      (entry['first_frame_image'] = enabled4[0]),
      delete entry['image_urls'],
      delete entry['video_url'],
      delete entry['size'],
      entry
    );
  }
  if (output === 'reference') {
    const list8 = handler(['referenceImage'], list3);
    if (list8['length'] <= 0)
      throw new Error(handle + ' reference mode requires image_urls input');
    return (
      (entry['image_urls'] = list8['slice'](0, 9)),
      delete entry['first_frame_image'],
      delete entry['video_url'],
      entry
    );
  }
  if (output !== 'auto') throw new Error('Unsupported ' + handle + ' mode: ' + output);
  if (list3['length'] > 0 || list4['length'] > 0)
    throw new Error(handle + ' media inputs require an explicit mode selection');
  return (delete entry['first_frame_image'], delete entry['image_urls'], delete entry['video_url'], entry);
}
export function apimartHailuo23Video({
  currentBody: currentBody4,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
}) {
  const value3 = { ...currentBody4 };
  delete value3['last_frame_image'];
  const inputList = normalizeInputList(inputImages),
    inputUrlsBySlot2 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    value4 = Object['keys'](inputUrlsBySlot2)['length'] > 0;
  if (value4) {
    delete value3['first_frame_image'];
    if (inputUrlsBySlot2['firstFrame']) value3['first_frame_image'] = inputUrlsBySlot2['firstFrame'];
  } else inputList[0] && (value3['first_frame_image'] = inputList[0]);
  const value5 = String(modelToken || value3['model'] || '')
    ['trim']()
    ['toLowerCase']();
  if (value5 === 'minimax-hailuo-2.3-fast' && !String(value3['first_frame_image'] || '')['trim']())
    throw new Error('APIMart Hailuo 2.3 Fast requires first_frame_image input');
  return value3;
}
function removeApimartMinimaxH3TransientFields(value6) {
  (delete value6['apimart_minimax_h3_mode'],
    delete value6['first_frame_image'],
    delete value6['last_frame_image'],
    delete value6['image_urls'],
    delete value6['video_urls'],
    delete value6['audio_urls']);
}
export function apimartMinimaxH3Video({
  currentBody: currentBody5,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value7 = { ...currentBody5 },
    minimaxH3Request = resolveMinimaxH3Request({
      currentBody: currentBody5,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      payload: payload,
      finalPrompt: finalPrompt,
      finalUrlsBySlot: finalUrlsBySlot,
      modeFieldId: 'apimart_minimax_h3_mode',
      providerLabel: 'APIMart',
    });
  ((value7['prompt'] = minimaxH3Request['prompt']),
    (value7['resolution'] = minimaxH3Request['resolution']),
    (value7['duration'] = minimaxH3Request['duration']),
    removeApimartMinimaxH3TransientFields(value7));
  if (minimaxH3Request['mode'] === 'reference')
    return (
      minimaxH3Request['referenceImages']['length'] > 0 &&
        (value7['image_urls'] = minimaxH3Request['referenceImages']),
      minimaxH3Request['referenceVideos']['length'] > 0 &&
        (value7['video_urls'] = minimaxH3Request['referenceVideos']),
      minimaxH3Request['referenceAudios']['length'] > 0 &&
        (value7['audio_urls'] = minimaxH3Request['referenceAudios']),
      (value7['aspect_ratio'] = minimaxH3Request['ratio']),
      value7
    );
  if (!minimaxH3Request['firstFrameImage'] && !minimaxH3Request['lastFrameImage'])
    return ((value7['aspect_ratio'] = minimaxH3Request['ratio']), value7);
  return (
    minimaxH3Request['firstFrameImage'] &&
      (value7['first_frame_image'] = minimaxH3Request['firstFrameImage']),
    minimaxH3Request['lastFrameImage'] && (value7['last_frame_image'] = minimaxH3Request['lastFrameImage']),
    delete value7['aspect_ratio'],
    value7
  );
}
export function apimartViduQ3Video({
  currentBody: currentBody6,
  inputImages: inputImages = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  modelToken: modelToken = '',
}) {
  const value8 = { ...currentBody6 },
    enabled5 = String(value8['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!enabled5) throw new Error('APIMart Vidu Q3 prompt is required');
  value8['prompt'] = enabled5;
  const value9 = String(
      payload?.['generationParams']?.['vidu_q3_generation_mode'] ||
        payload?.['vidu_q3_generation_mode'] ||
        'video',
    )
      ['trim']()
      ['toLowerCase'](),
    value10 = String(modelToken || value8['model'] || 'viduq3-turbo')
      ['trim']()
      ['toLowerCase'](),
    list9 = normalizeInputList(inputImages),
    inputUrlsBySlot3 = normalizeInputUrlsBySlot(payload?.['inputUrlsBySlot']),
    count = Math['max'](
      list9['length'],
      normalizeInputList(payload?.['inputUrls'])['length'],
      normalizeInputList(payload?.['images'])['length'],
      Object['keys'](inputUrlsBySlot3)['length'],
    );
  if (value9 === 'reference') {
    if (!VIDU_Q3_REFERENCE_MODELS['has'](value10))
      throw new Error(
        'APIMart Vidu Q3 reference mode only supports viduq3 or viduq3-mix',
      );
    if (list9['length'] < 1 || count > 7)
      throw new Error('APIMart Vidu Q3 reference mode requires 1-7 image inputs');
    return (
      (value8['model'] = value10),
      (value8['image_urls'] = list9['slice'](0, 7)),
      delete value8['audio'],
      value8
    );
  }
  if (!VIDU_Q3_VIDEO_MODELS['has'](value10))
    throw new Error('APIMart Vidu Q3 video generation mode only supports viduq3-turbo or viduq3-pro');
  if (count > 2) throw new Error('APIMart Vidu Q3 video generation mode supports at most 2 image inputs');
  return (
    (value8['model'] = value10),
    list9['length'] > 0
      ? ((value8['image_urls'] = list9['slice'](0, 2)), delete value8['aspect_ratio'])
      : delete value8['image_urls'],
    value8
  );
}
export function apimartWan27Video({ currentBody: currentBody7, payload: payload = {} }) {
  const value11 = { ...currentBody7 },
    list10 = normalizeInputList(value11['image_urls']),
    list11 = normalizeInputList(value11['video_urls']),
    reference_voice = isPresentValue(value11['audio_url'])
      ? String(value11['audio_url'] || '')['trim']()
      : '',
    value12 = !!reference_voice,
    value13 = String(payload?.['generationParams']?.['wan27_mode'] || payload?.['wan27_mode'] || 'image')
      ['trim']()
      ['toLowerCase']();
  (delete value11['wan27_mode'], delete value11['wan27_reference_input'], delete value11['wan27_edit_input']);
  if (value13 === 'reference') {
    value11['model'] = 'wan2.7-r2v';
    const list12 = list10['slice'](0, 1),
      list13 = list11['slice'](0, Math['max'](0, 5 - list12['length']));
    if (list12['length'] <= 0 && list13['length'] <= 0)
      throw new Error('APIMart Wan2.7-R2V requires image_with_roles or video_urls input');
    return (
      list12['length'] > 0
        ? (value11['image_with_roles'] = list12['map']((url, count2) => ({
            url: url,
            role: 'reference_image',
            ...(count2 === 0 && reference_voice ? { reference_voice: reference_voice } : {}),
          })))
        : delete value11['image_with_roles'],
      list13['length'] > 0 ? (value11['video_urls'] = list13) : delete value11['video_urls'],
      delete value11['image_urls'],
      delete value11['audio_url'],
      value11
    );
  }
  if (value13 === 'edit') {
    value11['model'] = 'wan2.7-videoedit';
    if (!list11[0]) throw new Error('APIMart Wan2.7-VideoEdit requires video_urls input');
    value11['video_urls'] = list11['slice'](0, 2);
    if (list10['length'] > 0) value11['image_urls'] = list10['slice'](0, 4);
    else delete value11['image_urls'];
    return (delete value11['audio_url'], value11);
  }
  value11['model'] = 'wan2.7';
  if (list10['length'] > 0 && list11['length'] > 0)
    throw new Error('APIMart Wan2.7 image_urls cannot be used with video_urls');
  if (list11['length'] > 0 && value12)
    throw new Error('APIMart Wan2.7 video_urls cannot be used with audio_url');
  return ((list10['length'] > 0 || list11['length'] > 0) && delete value11['size'], value11);
}
function normalizeKlingV3OmniMode(value14) {
  const value15 = String(value14 || '')
    ['trim']()
    ['toLowerCase']();
  return value15 === 'reference' || value15 === 'edit' ? value15 : 'image';
}
function buildKlingV3OmniVideoItem(video_url, refer_type, value16 = false) {
  return {
    video_url: video_url,
    refer_type: refer_type,
    keep_original_sound: normalizeKlingKeepOriginalSound(value16) ? 'yes' : 'no',
  };
}
function normalizeKlingO1VideoRole(value17) {
  const value18 = String(value17 || '')
    ['trim']()
    ['toLowerCase']();
  if (value18 === 'feature' || value18 === 'feature_reference') return 'feature';
  return value18 === 'base' || value18 === 'edit' ? 'base' : '';
}
export function apimartKlingO1Video({
  currentBody: currentBody8,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
}) {
  const value19 = { ...currentBody8 },
    list14 = normalizeInputList(inputImages)['slice'](0, 2),
    list15 = normalizeInputList(inputVideos)['slice'](0, 1),
    klingO1VideoRole = normalizeKlingO1VideoRole(
      payload?.['klingO1VideoRole'] ||
        payload?.['kling_o1_video_role'] ||
        payload?.['generationParams']?.['kling_o1_video_role'],
    ),
    klingKeepOriginalSound = normalizeKlingKeepOriginalSound(
      value19['keep_original_sound'] ??
        payload?.['generationParams']?.['keep_original_sound'] ??
        payload?.['keep_original_sound'],
    );
  (delete value19['kling_o1_video_role'],
    delete value19['klingO1VideoRole'],
    delete value19['keep_original_sound'],
    delete value19['video_list']);
  if (list15['length'] > 0) {
    const value20 = klingO1VideoRole || 'base';
    value19['video_list'] = [buildKlingV3OmniVideoItem(list15[0], value20, klingKeepOriginalSound)];
    if (value20 === 'base') {
      if (list14['length'] > 0)
        throw new Error('APIMart Kling O1 base video cannot be used with image_urls');
      return (
        delete value19['image_urls'],
        delete value19['duration'],
        delete value19['aspect_ratio'],
        (value19['prompt'] = replaceKlingO1PromptImageReferences(value19['prompt'], 0)),
        value19
      );
    }
    if (list14['length'] > 1)
      throw new Error('APIMart Kling O1 feature video supports at most one image_url');
    return (
      list14['length'] > 0
        ? (value19['image_urls'] = list14['slice'](0, 1))
        : delete value19['image_urls'],
      (value19['prompt'] = replaceKlingO1PromptImageReferences(
        value19['prompt'],
        value19['image_urls']?.['length'] || 0,
      )),
      value19
    );
  }
  return (
    list14['length'] > 0 ? (value19['image_urls'] = list14) : delete value19['image_urls'],
    (value19['prompt'] = replaceKlingO1PromptImageReferences(
      value19['prompt'],
      value19['image_urls']?.['length'] || 0,
    )),
    value19
  );
}
export function apimartKlingV3OmniVideo({
  currentBody: currentBody9,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value21 = { ...currentBody9 },
    list16 = normalizeInputList(inputImages),
    list17 = normalizeInputList(inputVideos),
    inputUrlsBySlot4 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    klingV3OmniMode = normalizeKlingV3OmniMode(
      payload?.['generationParams']?.['kling_v3_omni_mode'] || payload?.['kling_v3_omni_mode'] || 'image',
    );
  (delete value21['kling_v3_omni_mode'], delete value21['image_with_roles'], delete value21['video_list']);
  if (klingV3OmniMode === 'edit') {
    if (!list17[0]) throw new Error('APIMart Kling V3 Omni video edit requires video_list input');
    return (
      (value21['video_list'] = [buildKlingV3OmniVideoItem(list17[0], 'base')]),
      delete value21['image_urls'],
      delete value21['image_with_roles'],
      delete value21['audio'],
      delete value21['duration'],
      delete value21['aspect_ratio'],
      value21
    );
  }
  if (klingV3OmniMode === 'reference') {
    const list18 = [];
    (appendUniqueUrl(list18, inputUrlsBySlot4['referenceImage']),
      list16['forEach']((value22) => appendUniqueUrl(list18, value22)));
    const list19 = list18['slice'](0, 1),
      enabled6 = list17[0] || '';
    if (list19['length'] <= 0 && !enabled6)
      throw new Error('APIMart Kling V3 Omni reference mode requires image or video input');
    return (
      list19['length'] > 0
        ? (value21['image_with_roles'] = list19['map']((url2) => ({
            url: url2,
            role: 'reference',
          })))
        : delete value21['image_with_roles'],
      enabled6
        ? ((value21['video_list'] = [buildKlingV3OmniVideoItem(enabled6, 'feature')]),
          delete value21['audio'])
        : delete value21['video_list'],
      delete value21['image_urls'],
      value21
    );
  }
  if (list17['length'] > 0)
    throw new Error(
      'APIMart Kling V3 Omni image mode does not support video_list input',
    );
  const value23 =
      Object['prototype']['hasOwnProperty']['call'](inputUrlsBySlot4, 'firstFrame') ||
      Object['prototype']['hasOwnProperty']['call'](inputUrlsBySlot4, 'lastFrame'),
    url3 = value23 ? inputUrlsBySlot4['firstFrame'] || '' : list16[0] || '',
    url4 = value23
      ? inputUrlsBySlot4['lastFrame'] || ''
      : list16['find']((value24) => value24 && value24 !== url3) || '';
  if (!url3 && url4) throw new Error('APIMart Kling V3 Omni last_frame requires first_frame input');
  const list20 = [];
  return (
    url3 && list20['push']({ url: url3, role: 'first_frame' }),
    url4 && list20['push']({ url: url4, role: 'last_frame' }),
    list20['length'] > 0
      ? ((value21['image_with_roles'] = list20), delete value21['image_urls'])
      : delete value21['image_urls'],
    value21
  );
}
function normalizeSeedanceVideoSize(value25) {
  const enabled7 = String(value25 || '')['trim']();
  if (!enabled7) return '16:9';
  if (isSeedanceAdaptiveRatio(enabled7)) return 'adaptive';
  return normalizeRatioLabelText(enabled7);
}
function normalizeSeedanceAspectRatio(value26) {
  return normalizeSeedanceVideoSize(value26 || '16:9');
}
function readSeedanceVideoParam(value27, ...args) {
  const value28 = [value27, value27?.['generationParams']];
  for (const enabled8 of value28) {
    if (!enabled8 || typeof enabled8 !== 'object' || Array['isArray'](enabled8)) continue;
    for (const value29 of args) {
      if (Object['prototype']['hasOwnProperty']['call'](enabled8, value29)) return enabled8[value29];
    }
  }
  return undefined;
}
function isSeedanceAdaptiveRatio(value30) {
  const value31 = String(value30 ?? '')
    ['trim']()
    ['toLowerCase']();
  return ['自适应', 'adaptive', 'auto', 'default']['includes'](value31);
}
function normalizeSeedanceBoolean(count3, value32 = false) {
  if (typeof count3 === 'boolean') return count3;
  if (typeof count3 === 'number') return count3 !== 0;
  const value33 = String(count3 ?? '')
    ['trim']()
    ['toLowerCase']();
  if (['true', '1', 'yes', 'on']['includes'](value33)) return true;
  if (['false', '0', 'no', 'off']['includes'](value33)) return false;
  return value32 === true;
}
function normalizeSeedanceVideoDuration(value34, value35 = {}) {
  const value36 = Number(value35['defaultDuration'] ?? 5),
    value37 = Number['isFinite'](value36) ? Math['trunc'](value36) : 5,
    value38 = Number(value34 ?? value37);
  if (!Number['isFinite'](value38)) return value37;
  const value39 = Math['trunc'](value38);
  if (value35['allowAutoDuration'] === true && value39 === -1) return -1;
  const value40 = Number(value35['minDuration']),
    value41 = Number(value35['maxDuration']);
  if (Number['isFinite'](value40) && value39 < value40)
    throw new Error('APIMart Seedance duration must be at least ' + value40 + ' seconds');
  if (Number['isFinite'](value41) && value39 > value41)
    throw new Error('APIMart Seedance duration must be at most ' + value41 + ' seconds');
  return value39;
}
function normalizeSeedanceVideoResolution(value42, value43 = {}) {
  const value44 = String(value43['defaultResolution'] || '720p')
      ['trim']()
      ['toLowerCase'](),
    value45 = String(value42 || value44)
      ['trim']()
      ['toLowerCase'](),
    list21 = Array['isArray'](value43['allowedResolutions'])
      ? value43['allowedResolutions']
          ['map']((value46) =>
            String(value46 || '')
              ['trim']()
              ['toLowerCase'](),
          )
          ['filter'](Boolean)
      : [];
  if (list21['length'] === 0) return value45 || value44;
  if (list21['includes'](value45)) return value45;
  return list21['includes'](value44) ? value44 : list21[0];
}
function getApimartSeedanceVideoPolicy(value47) {
  const value48 = value47?.['extensions']?.['seedanceVideo'];
  return value48 && typeof value48 === 'object' && !Array['isArray'](value48) ? value48 : {};
}
function collectVideoInputUrls(value49) {
  return Array['from'](
    new Set(
      [
        String(value49['videoUrl'] || '')['trim'](),
        ...normalizeInputList(value49['videos']),
        ...normalizeInputList(value49['videoUrls']),
      ]['filter'](Boolean),
    ),
  );
}
function collectAudioInputUrls(value50) {
  return Array['from'](
    new Set(
      [
        String(value50['audioUrl'] || '')['trim'](),
        ...normalizeInputList(value50['audios']),
        ...normalizeInputList(value50['audioUrls']),
      ]['filter'](Boolean),
    ),
  );
}
async function resolveInputVideos(list22, value51) {
  if (list22['length'] === 0) return [];
  const list23 = await uploadModelApiMediaInputs('video', list22, value51, {
    fallbackProvider: 'runninghub',
    strictUpload: true,
  });
  if (!Array['isArray'](list23) || list23['length'] === 0)
    throw new Error('APIMART 视频上传失败：未返回有效视频地址，请重试或重新选择视频');
  return list23['map']((value52) => String(value52 || '')['trim']())['filter'](Boolean);
}
async function resolveInputAudios(list24, value53) {
  if (list24['length'] === 0) return [];
  const list25 = await uploadModelApiMediaInputs('audio', list24, value53, {
    fallbackProvider: 'runninghub',
    strictUpload: true,
  });
  if (!Array['isArray'](list25) || list25['length'] === 0)
    throw new Error('APIMART 音频上传失败：未返回有效音频地址，请重试或重新选择音频');
  return list25['map']((value54) => String(value54 || '')['trim']())['filter'](Boolean);
}
export async function apimartSeedanceVideo({
  payload: payload2,
  finalPrompt: finalPrompt2,
  modelToken: modelToken2,
  apiKey: apiKey,
  ctx: ctx,
  executionManifest: executionManifest2,
}) {
  const model = modelToken2 || stripPrefix(payload2['model'], 'apimart/'),
    apimartSeedanceVideoPolicy = getApimartSeedanceVideoPolicy(executionManifest2),
    enabled9 = supportsApimartPrivateAvatarAssets(model, apimartSeedanceVideoPolicy),
    enabled10 = apimartSeedanceVideoPolicy['supportsVideoReferences'] === true,
    enabled11 = apimartSeedanceVideoPolicy['supportsAudioReferences'] === true,
    list26 = applyApimartPrivateAvatarAssetsToUrls(collectVideoInputUrls(payload2), payload2, {
      sourceKind: 'video',
      enabled: enabled9,
    });
  if (!enabled10 && list26['length'] > 0)
    throw new Error('APIMart Seedance model does not support video references');
  const list27 = list26['length'] > 0 && enabled10 ? await resolveInputVideos(list26, ctx) : [],
    list28 = applyApimartPrivateAvatarAssetsToUrls(
      [
        String(payload2['first'] || payload2['firstFrameUrl'] || '')['trim'](),
        String(payload2['last'] || payload2['lastFrameUrl'] || '')['trim'](),
      ]['filter'](Boolean),
      payload2,
      { sourceKind: 'image', enabled: enabled9 },
    ),
    positiveInteger = normalizePositiveInteger(apimartSeedanceVideoPolicy['maxRoleImageCount'], 2);
  if (list28['length'] > positiveInteger)
    throw new Error(
      apimartSeedanceVideoPolicy['roleImageLimitError'] ||
        'APIMart Seedance model does not support this many role images',
    );
  let list29 = [];
  if (list28['length'] > 0) {
    const uploadModelApiMediaInputs2 = await uploadModelApiMediaInputs('image', list28, ctx, {
      apiKey: apiKey,
      fallbackProvider: 'apimart',
      uploadOptions: { applyInputQualityProfile: true },
      strictUpload: true,
    });
    list29 = [
      uploadModelApiMediaInputs2?.[0]
        ? { url: String(uploadModelApiMediaInputs2[0])['trim'](), role: 'first_frame' }
        : null,
      uploadModelApiMediaInputs2?.[1]
        ? { url: String(uploadModelApiMediaInputs2[1])['trim'](), role: 'last_frame' }
        : null,
    ]['filter'](Boolean);
  }
  const value55 = Array['isArray'](payload2['images'])
      ? payload2['images']
      : Array['isArray'](payload2['inputUrls'])
        ? payload2['inputUrls']
        : [],
    list30 = applyApimartPrivateAvatarAssetsToUrls(value55, payload2, {
      sourceKind: 'image',
      enabled: enabled9,
    }),
    map = new Set(list28),
    list31 =
      list29['length'] > 0 && apimartSeedanceVideoPolicy['combineRoleAndReferenceImages'] === true
        ? list30['filter']((value56) => !map['has'](value56))
        : list30,
    list32 =
      list31['length'] > 0 &&
      (list29['length'] <= 0 || apimartSeedanceVideoPolicy['combineRoleAndReferenceImages'] === true)
        ? await uploadModelApiMediaInputs('image', list31, ctx, {
            apiKey: apiKey,
            fallbackProvider: 'apimart',
            uploadOptions: { applyInputQualityProfile: true },
            strictUpload: true,
          })
        : [],
    list33 = applyApimartPrivateAvatarAssetsToUrls(collectAudioInputUrls(payload2), payload2, {
      sourceKind: 'audio',
      enabled: enabled9,
    });
  if (!enabled11 && list33['length'] > 0)
    throw new Error('APIMart Seedance model does not support audio references');
  const list34 = enabled11 && list33['length'] > 0 ? await resolveInputAudios(list33, ctx) : [],
    seedanceVideoParam = readSeedanceVideoParam(payload2, 'duration'),
    seedanceVideoParam2 = readSeedanceVideoParam(payload2, 'resolution'),
    seedanceVideoParam3 = readSeedanceVideoParam(payload2, 'aspectRatio', 'size', 'aspect_ratio'),
    value57 =
      apimartSeedanceVideoPolicy['preserveAdaptiveRatio'] === true &&
      isSeedanceAdaptiveRatio(seedanceVideoParam3)
        ? seedanceVideoParam3
        : payload2['resolvedRatioLabel'] || seedanceVideoParam3,
    value58 = {
      model: model,
      prompt: finalPrompt2,
      duration: normalizeSeedanceVideoDuration(seedanceVideoParam, apimartSeedanceVideoPolicy),
      resolution: normalizeSeedanceVideoResolution(seedanceVideoParam2, apimartSeedanceVideoPolicy),
    };
  apimartSeedanceVideoPolicy['ratioField'] === 'size'
    ? (value58['size'] = normalizeSeedanceVideoSize(value57 || apimartSeedanceVideoPolicy['defaultRatio']))
    : (value58['aspect_ratio'] = normalizeSeedanceAspectRatio(
        value57 || apimartSeedanceVideoPolicy['defaultRatio'],
      ));
  const optionalIntegerInRange = normalizeOptionalIntegerInRange(readSeedanceVideoParam(payload2, 'seed'), {
    min: 0,
    max: 0x7fffffff,
  });
  if (optionalIntegerInRange !== null) value58['seed'] = optionalIntegerInRange;
  if (apimartSeedanceVideoPolicy['supportsGenerateAudioParam'] === true) {
    const seedanceVideoParam4 = readSeedanceVideoParam(payload2, 'generateAudio', 'generate_audio', 'audio'),
      seedanceBoolean = normalizeSeedanceBoolean(
        seedanceVideoParam4,
        apimartSeedanceVideoPolicy['generateAudioDefault'] === true,
      );
    if (seedanceBoolean || apimartSeedanceVideoPolicy['emitGenerateAudioBoolean'] === true) {
      const value59 = String(apimartSeedanceVideoPolicy['generateAudioField'] || 'audio')['trim']();
      value58[value59 || 'audio'] = seedanceBoolean;
    }
  }
  apimartSeedanceVideoPolicy['supportsWatermarkParam'] === true &&
    (value58['watermark'] = normalizeSeedanceBoolean(readSeedanceVideoParam(payload2, 'watermark'), false));
  if (apimartSeedanceVideoPolicy['supportsOutputFormatParam'] === true) {
    const value60 = String(readSeedanceVideoParam(payload2, 'outputFormat', 'output_format') || 'mp4')
      ['trim']()
      ['toLowerCase']();
    value58['output_format'] = ['mp4', 'mov']['includes'](value60) ? value60 : 'mp4';
  }
  apimartSeedanceVideoPolicy['supportsWebSearchParam'] === true &&
    normalizeSeedanceBoolean(readSeedanceVideoParam(payload2, 'webSearch'), false) &&
    (value58['tools'] = [{ type: 'web_search' }]);
  apimartSeedanceVideoPolicy['supportsCameraFixedParam'] === true &&
    normalizeSeedanceBoolean(readSeedanceVideoParam(payload2, 'camerafixed', 'cameraFixed'), false) &&
    (value58['camerafixed'] = true);
  const positiveInteger2 = normalizePositiveInteger(apimartSeedanceVideoPolicy['maxImageCount'], 1);
  if (list29['length'] > 0) {
    const value61 = apimartSeedanceVideoPolicy['allowRoleImagesWithMedia'] === true,
      value62 = list27['length'] > 0 || list34['length'] > 0,
      list35 =
        value61 && value62 ? list29['map']((args2) => ({ ...args2, role: 'reference_image' })) : list29,
      map2 = new Set(list35['map']((response) => String(response?.['url'] || '')['trim']()));
    value58['image_with_roles'] = [
      ...list35,
      ...(apimartSeedanceVideoPolicy['combineRoleAndReferenceImages'] === true
        ? list32['filter']((value63) => !map2['has'](String(value63 || '')['trim']()))['map']((url5) => ({
            url: url5,
            role: 'reference_image',
          }))
        : []),
    ]['slice'](0, positiveInteger2);
    const value64 = value58['image_with_roles']['some'](
      (value65) => value65['role'] === 'first_frame' || value65['role'] === 'last_frame',
    );
    if (value64 && apimartSeedanceVideoPolicy['roleImagesRequireAdaptiveRatio'] === true) {
      const value66 = apimartSeedanceVideoPolicy['ratioField'] === 'size' ? 'size' : 'aspect_ratio';
      value58[value66] = 'adaptive';
    }
  } else list32['length'] > 0 && (value58['image_urls'] = list32['slice'](0, positiveInteger2));
  const enabled12 = list29['length'] > 0 && apimartSeedanceVideoPolicy['allowRoleImagesWithMedia'] !== true;
  return (
    enabled10 &&
      !enabled12 &&
      list27['length'] > 0 &&
      (value58['video_urls'] = list27['slice'](
        0,
        normalizePositiveInteger(apimartSeedanceVideoPolicy['maxVideoReferenceCount'], 3),
      )),
    enabled11 &&
      !enabled12 &&
      list34['length'] > 0 &&
      (value58['audio_urls'] = list34['slice'](
        0,
        normalizePositiveInteger(apimartSeedanceVideoPolicy['maxAudioReferenceCount'], 3),
      )),
    value58
  );
}
