import {
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { validateModelMediaInputLimits } from '../../modules/modelMediaInputLimits.js';
import {
  getModelApiVideoMaxInputVideoSeconds,
  isHappyHorseModelApiVideo,
  isWan27ModelApiVideo,
  supportsHappyHorseModelApiVideoEdit,
} from '../../modules/modelApiVideoResolverPolicy.js';
import { resolveModelExecution } from '../../manifests/index.js';
import { t } from '../../i18n/index.js';
import { getMissingManifestInputRequirement } from '../aigenImage/manifestInputRequirements.js';
import { resolveModelApiVideoInputMaterials } from './modelApiVideoInputPolicy.js';
import { applyVideoNodeAdaptiveAspectRatio } from './videoNodeAdaptiveAspectRatio.js';
export { buildSubmitRandomizedSeedPatch } from './modelApiVideoRandomSeedPolicy.js';
const APIMART_KLING_V3_OMNI_MODEL_ID = 'apimart/kling-v3-omni',
  APIMART_KLING_O1_MODEL_ID = 'apimart/kling-video-o1',
  HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS = 0xf,
  WAN27_AUDIO_INPUT_MIN_SECONDS = 0x2,
  WAN27_AUDIO_INPUT_MAX_SECONDS = 0x1e,
  WAN27_AUDIO_INPUT_MAX_BYTES = 0xf * 0x400 * 0x400,
  WAN27_VIDEO_EXTEND_MAX_SECONDS = 0xa,
  WAN27_REFERENCE_VIDEO_MAX_SECONDS = 0x1e,
  WAN27_EDIT_VIDEO_MIN_SECONDS = 0x2,
  WAN27_EDIT_VIDEO_MAX_SECONDS = 0xa,
  KLING_V3_OMNI_VIDEO_MIN_SECONDS = 0x3,
  KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS = 0xa,
  KLING_O1_VIDEO_MIN_SECONDS = 0x3,
  KLING_O1_VIDEO_MAX_SECONDS = 0xa;
function videoTaskText(value, item = {}) {
  return t('videoTask.' + value, item);
}
function getPlainObject(key) {
  return key && typeof key === 'object' && !Array['isArray'](key) ? key : {};
}
function normalizePositiveNumber(index) {
  const count = Number(index);
  return Number['isFinite'](count) && count > 0x0 ? count : 0x0;
}
function isCanonicalProviderModel(result, providerHint, data) {
  const modelExecution2 =
      resolveModelExecution(result, { providerHint: providerHint }) || resolveModelExecution(result),
    options = String(
      modelExecution2?.['canonicalModelId'] ||
        modelExecution2?.['modelManifest']?.['modelId'] ||
        result ||
        '',
    )['trim'](),
    enabled = String(modelExecution2?.['modelManifest']?.['provider'] || providerHint || '')
      ['trim']()
      ['toLowerCase']();
  return options === data && (!enabled || enabled === 'apimart');
}
function buildVideoInputUrlsByFixedKindSlot({
  fixedInputConfig: fixedInputConfig = null,
  refs: refs = [],
  assetInputRefs: assetInputRefs = [],
  kind: kind = 'image',
} = {}) {
  const kind2 = String(kind || '')['trim'](),
    list = (fixedInputConfig?.['visibleSlots'] || [])
      ['map']((target) => String(target || '')['trim']())
      ['filter']((source) => source && String(fixedInputConfig?.['slotKindById']?.[source] || '') === kind2);
  if (list['length'] === 0x0) return {};
  const occupiedSlots = {},
    map = new Set(),
    handler = (next, current) => {
      const enabled2 = String(next || '')['trim'](),
        enabled3 = String(current || '')['trim']();
      if (!enabled2 || !enabled3 || occupiedSlots[enabled2]) return ![];
      if (!list['includes'](enabled2)) return ![];
      return ((occupiedSlots[enabled2] = enabled3), map['add'](enabled3), !![]);
    },
    handler2 = (refSlot, { allowAuto: allowAuto = !![] } = {}) => {
      const enabled4 = String(refSlot?.['url'] || '')['trim']();
      if (!enabled4 || map['has'](enabled4)) return ![];
      const effectiveInputKind = resolveEffectiveInputKind(refSlot) || refSlot?.['type'] || kind2;
      if (String(effectiveInputKind || '')['trim']() !== kind2) return ![];
      const fixedInputSlotForRef = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: refSlot?.['refSlot'],
        kind: kind2,
        occupiedSlots: occupiedSlots,
        sourceNode: refSlot?.['nodeData'] || refSlot,
      });
      if (!allowAuto && fixedInputSlotForRef['reason'] !== 'explicit') return ![];
      return handler(fixedInputSlotForRef['slot'], enabled4);
    },
    handler3 = (entry) => {
      const url = String(entry || '')['trim']();
      if (!url || map['has'](url)) return ![];
      const fixedInputSlotForRef2 = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: '',
        kind: kind2,
        occupiedSlots: occupiedSlots,
        sourceNode: { type: kind2, url: url },
      });
      return handler(fixedInputSlotForRef2['slot'], url);
    },
    list2 = [
      ...(Array['isArray'](refs) ? refs : []),
      ...(Array['isArray'](assetInputRefs) ? assetInputRefs : []),
    ];
  return (
    list2['forEach']((record) => handler2(record, { allowAuto: ![] })),
    (Array['isArray'](refs) ? refs : [])['forEach']((handle) => handler2(handle)),
    (Array['isArray'](assetInputRefs) ? assetInputRefs : [])['forEach']((response) => {
      const effectiveInputKind2 = resolveEffectiveInputKind(response) || response?.['type'];
      if (effectiveInputKind2 === kind2) handler3(response?.['url']);
    }),
    occupiedSlots
  );
}
function buildVideoInputUrlsByFixedImageSlot(refs2 = {}) {
  return buildVideoInputUrlsByFixedKindSlot({ ...refs2, refs: refs2['imageRefs'], kind: 'image' });
}
function normalizeHappyHorseMode(state) {
  const config = String(state || '')
    ['trim']()
    ['toLowerCase']();
  return config === 'image' || config === 'reference' || config === 'edit' ? config : 'auto';
}
function getHappyHorseMode(options2 = {}) {
  const plainObject = getPlainObject(options2?.['generationParams']);
  return normalizeHappyHorseMode(plainObject['happyhorse_mode'] ?? options2?.['happyhorse_mode']);
}
function normalizeWan27Mode(scope) {
  const input = String(scope || '')
    ['trim']()
    ['toLowerCase']();
  return input === 'video' || input === 'reference' || input === 'edit' ? input : 'image';
}
function getWan27Mode(options3 = {}) {
  const plainObject2 = getPlainObject(options3?.['generationParams']);
  return normalizeWan27Mode(plainObject2['wan27_mode'] ?? options3?.['wan27_mode']);
}
function normalizeKlingV3OmniMode(output) {
  const value2 = String(output || '')
    ['trim']()
    ['toLowerCase']();
  return value2 === 'reference' || value2 === 'edit' ? value2 : 'image';
}
function getKlingV3OmniMode(options4 = {}) {
  const plainObject3 = getPlainObject(options4?.['generationParams']);
  return normalizeKlingV3OmniMode(plainObject3['kling_v3_omni_mode'] ?? options4?.['kling_v3_omni_mode']);
}
function buildHappyHorseMediaPayload({
  prompt: prompt = '',
  mode: mode = 'auto',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0x0,
  maxVideoSeconds: maxVideoSeconds = HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS,
  supportsEdit: supportsEdit = !![],
} = {}) {
  const enabled5 = String(prompt || '')['trim']();
  if (!enabled5) return { ok: ![], message: videoTaskText('validation.happyHorse.promptRequired') };
  const images2 = Array['from'](
      new Set(
        (Array['isArray'](images) ? images : [])
          ['map']((value3) => String(value3 || '')['trim']())
          ['filter'](Boolean),
      ),
    ),
    list3 = Array['from'](
      new Set(
        (Array['isArray'](videos) ? videos : [])
          ['map']((value4) => String(value4 || '')['trim']())
          ['filter'](Boolean),
      ),
    ),
    happyHorseMode = normalizeHappyHorseMode(mode),
    enabled6 = images2['length'] > 0x0 || list3['length'] > 0x0,
    value5 = { ok: !![], images: [], videos: [], inputUrls: [], mode: 'auto' },
    hint = assetVideoCount > 0x0 ? videoTaskText('validation.removePromptVideoRefs') : '';
  if (happyHorseMode === 'auto') {
    if (enabled6) return { ok: ![], message: videoTaskText('validation.happyHorse.chooseMode') };
    return value5;
  }
  if (happyHorseMode === 'image') {
    if (list3['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.imageModeRejectsVideo', { hint: hint }) };
    if (!images2[0x0]) {
      if (!enabled6) return value5;
      return { ok: ![], message: videoTaskText('validation.imageModeNeedsFirstFrame') };
    }
    return {
      ok: !![],
      images: images2['slice'](0x0, 0x1),
      videos: [],
      inputUrls: images2['slice'](0x0, 0x1),
      mode: 'image',
    };
  }
  if (happyHorseMode === 'reference') {
    if (list3['length'] > 0x0)
      return {
        ok: ![],
        message: videoTaskText('validation.referenceImageModeRejectsVideo', { hint: hint }),
      };
    if (images2['length'] <= 0x0) {
      if (!enabled6) return value5;
      return { ok: ![], message: videoTaskText('validation.referenceImageModeNeedsReference') };
    }
    const images3 = images2['slice'](0x0, 0x9);
    return { ok: !![], images: images3, videos: [], inputUrls: images3, mode: 'reference' };
  }
  if (supportsEdit === ![])
    return { ok: ![], message: videoTaskText('validation.happyHorse.editUnsupported') };
  if (!list3[0x0]) {
    if (!enabled6) return value5;
    return { ok: ![], message: videoTaskText('validation.videoEditNeedsVideo') };
  }
  const value6 = list3[0x0],
    value7 =
      (Array['isArray'](videoEntries) ? videoEntries : [])['find'](
        (response2) => String(response2?.['url'] || '')['trim']() === value6,
      ) || {},
    seconds =
      Number['isFinite'](Number(maxVideoSeconds)) && Number(maxVideoSeconds) > 0x0
        ? Number(maxVideoSeconds)
        : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
  if (normalizePositiveNumber(value7['duration']) > seconds)
    return {
      ok: ![],
      message: videoTaskText('validation.happyHorse.editVideoMaxSeconds', { seconds: seconds }),
    };
  return {
    ok: !![],
    images: images2['slice'](0x0, 0x5),
    videos: [value6],
    inputUrls: images2['slice'](0x0, 0x5),
    mode: 'edit',
  };
}
function orderHappyHorseImageUrls({
  mode: mode = 'auto',
  images: images = [],
  slotUrls: slotUrls = {},
} = {}) {
  const list4 = [],
    handler4 = (value8) => {
      const value9 = String(value8 || '')['trim']();
      if (value9 && !list4['includes'](value9)) list4['push'](value9);
    },
    happyHorseMode2 = normalizeHappyHorseMode(mode);
  if (happyHorseMode2 === 'image') handler4(slotUrls['firstFrame']);
  if (happyHorseMode2 === 'reference') handler4(slotUrls['referenceImage']);
  if (happyHorseMode2 === 'edit') handler4(slotUrls['editRefImage']);
  return ((Array['isArray'](images) ? images : [])['forEach'](handler4), list4);
}
function buildWan27MediaPayload({
  mode: mode = 'image',
  images: images = [],
  videos: videos = [],
  audios: audios = [],
  videoEntries: videoEntries = [],
  audioEntries: audioEntries = [],
  assetVideoCount: assetVideoCount = 0x0,
} = {}) {
  const run = (value10) =>
      Array['from'](
        new Set(
          (Array['isArray'](value10) ? value10 : [])
            ['map']((value11) => String(value11 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
    wan27Mode = normalizeWan27Mode(mode),
    list5 = run(images),
    videos2 = run(videos),
    list6 = run(audios),
    hint2 = assetVideoCount > 0x0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    handler5 = (value12, value13) =>
      (Array['isArray'](value12) ? value12 : [])['find'](
        (response3) => String(response3?.['url'] || '')['trim']() === value13,
      ) || {},
    handler6 = (enabled7) => {
      if (!enabled7) return null;
      const value14 = handler5(audioEntries, enabled7),
        positiveNumber = normalizePositiveNumber(value14['duration']);
      if (
        positiveNumber > 0x0 &&
        (positiveNumber < WAN27_AUDIO_INPUT_MIN_SECONDS || positiveNumber > WAN27_AUDIO_INPUT_MAX_SECONDS)
      )
        return videoTaskText('validation.wan27.audioDuration');
      if (normalizePositiveNumber(value14['sizeBytes']) > WAN27_AUDIO_INPUT_MAX_BYTES)
        return videoTaskText('validation.wan27.audioSize');
      return null;
    },
    handler7 = (value15) => normalizePositiveNumber(handler5(videoEntries, value15)['duration']);
  if (wan27Mode === 'video') {
    if (list5['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoExtendRejectsImage', { hint: hint2 }) };
    if (list6['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoExtendRejectsAudio') };
    if (!videos2[0x0]) return { ok: !![], images: [], videos: [], audios: [], inputUrls: [] };
    if (handler7(videos2[0x0]) > WAN27_VIDEO_EXTEND_MAX_SECONDS)
      return { ok: ![], message: videoTaskText('validation.wan27.extendMaxSeconds') };
    return { ok: !![], images: [], videos: videos2['slice'](0x0, 0x1), audios: [], inputUrls: [] };
  }
  if (wan27Mode === 'reference') {
    const images4 = list5['slice'](0x0, 0x1),
      videos3 = videos2['slice'](0x0, 0x1);
    if (images4['length'] <= 0x0 && videos3['length'] <= 0x0)
      return { ok: ![], message: videoTaskText('validation.referenceVideoNeedsMedia') };
    if (videos3[0x0] && handler7(videos3[0x0]) > WAN27_REFERENCE_VIDEO_MAX_SECONDS)
      return { ok: ![], message: videoTaskText('validation.wan27.referenceVideoMaxSeconds') };
    const audios2 = list6[0x0] || '',
      message = handler6(audios2);
    if (message) return { ok: ![], message: message };
    if (audios2 && images4['length'] <= 0x0)
      return { ok: ![], message: videoTaskText('validation.referenceAudioNeedsImage') };
    return {
      ok: !![],
      images: images4,
      videos: videos3,
      audios: audios2 ? [audios2] : [],
      inputUrls: images4,
    };
  }
  if (wan27Mode === 'edit') {
    if (!videos2[0x0]) return { ok: ![], message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (list5['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoEditRejectsImageUseReferenceVideo') };
    if (list6['length'] > 0x0) return { ok: ![], message: videoTaskText('validation.videoEditRejectsAudio') };
    const count2 = handler7(videos2[0x0]);
    if (count2 > 0x0 && (count2 < WAN27_EDIT_VIDEO_MIN_SECONDS || count2 > WAN27_EDIT_VIDEO_MAX_SECONDS))
      return { ok: ![], message: videoTaskText('validation.wan27.editVideoDuration') };
    return { ok: !![], images: [], videos: videos2['slice'](0x0, 0x2), audios: [], inputUrls: [] };
  }
  if (videos2['length'] > 0x0)
    return { ok: ![], message: videoTaskText('validation.imageModeRejectsVideo', { hint: hint2 }) };
  const audios3 = list6[0x0] || '',
    message2 = handler6(audios3);
  if (message2) return { ok: ![], message: message2 };
  const images5 = list5['slice'](0x0, 0x2);
  return {
    ok: !![],
    images: images5,
    videos: [],
    audios: audios3 ? [audios3] : [],
    inputUrls: images5,
  };
}
function buildKlingV3OmniMediaPayload({
  mode: mode = 'image',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0x0,
} = {}) {
  const run2 = (value16) =>
      Array['from'](
        new Set(
          (Array['isArray'](value16) ? value16 : [])
            ['map']((value17) => String(value17 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
    klingV3OmniMode = normalizeKlingV3OmniMode(mode),
    images6 = run2(images),
    videos4 = run2(videos),
    hint3 = assetVideoCount > 0x0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    handler8 = (value18) =>
      normalizePositiveNumber(
        (Array['isArray'](videoEntries) ? videoEntries : [])['find'](
          (response4) => String(response4?.['url'] || '')['trim']() === value18,
        )?.['duration'],
      );
  if (klingV3OmniMode === 'reference') {
    const images7 = images6['slice'](0x0, 0x1),
      videos5 = videos4['slice'](0x0, 0x1);
    if (images7['length'] <= 0x0 && videos5['length'] <= 0x0)
      return { ok: ![], message: videoTaskText('validation.referenceVideoNeedsMedia') };
    return { ok: !![], images: images7, videos: videos5, audios: [], inputUrls: images7 };
  }
  if (klingV3OmniMode === 'edit') {
    if (!videos4[0x0]) return { ok: ![], message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (images6['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoEditRejectsImage') };
    const count3 = handler8(videos4[0x0]);
    if (
      count3 > 0x0 &&
      (count3 < KLING_V3_OMNI_VIDEO_MIN_SECONDS || count3 > KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS)
    )
      return { ok: ![], message: videoTaskText('validation.klingV3Omni.editVideoDuration') };
    return { ok: !![], images: [], videos: videos4['slice'](0x0, 0x1), audios: [], inputUrls: [] };
  }
  if (videos4['length'] > 0x0)
    return { ok: ![], message: videoTaskText('validation.imageModeRejectsVideo', { hint: hint3 }) };
  return {
    ok: !![],
    images: images6['slice'](0x0, 0x2),
    videos: [],
    audios: [],
    inputUrls: images6['slice'](0x0, 0x2),
  };
}
function replaceKlingO1PromptImageReferences(value19, value20) {
  const count4 = Math['max'](0x0, Math['trunc'](Number(value20) || 0x0));
  if (count4 <= 0x0) return String(value19 || '');
  return String(value19 || '')['replace'](/@?图片\s*([1-9]\d*)/g, (value21, value22) => {
    const count5 = Number['parseInt'](String(value22 || ''), 0xa);
    if (!Number['isFinite'](count5) || count5 < 0x1 || count5 > count4) return value21;
    return '<<<image_' + count5 + '>>>';
  });
}
function buildKlingO1MediaPayload({
  prompt: prompt = '',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  videoRole: videoRole = '',
  hasEditVideo: hasEditVideo = ![],
  hasFeatureVideo: hasFeatureVideo = ![],
} = {}) {
  const run3 = (value23) =>
      Array['from'](
        new Set(
          (Array['isArray'](value23) ? value23 : [])
            ['map']((value24) => String(value24 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
    list7 = run3(images),
    list8 = run3(videos),
    value25 = String(videoRole || '')['trim']() === 'feature' ? 'feature' : 'base',
    handler9 = (value26) =>
      normalizePositiveNumber(
        (Array['isArray'](videoEntries) ? videoEntries : [])['find'](
          (response5) => String(response5?.['url'] || '')['trim']() === value26,
        )?.['duration'],
      );
  if (hasEditVideo && hasFeatureVideo)
    return { ok: ![], message: videoTaskText('validation.klingO1.editAndFeatureExclusive') };
  if (list8['length'] > 0x1) return { ok: ![], message: videoTaskText('validation.klingO1.onlyOneVideo') };
  const value27 = list8[0x0] || '';
  if (value27) {
    const count6 = handler9(value27);
    if (count6 > 0x0 && (count6 < KLING_O1_VIDEO_MIN_SECONDS || count6 > KLING_O1_VIDEO_MAX_SECONDS))
      return { ok: ![], message: videoTaskText('validation.klingO1.referenceVideoDuration') };
    if (value25 === 'base') {
      if (list7['length'] > 0x0)
        return { ok: ![], message: videoTaskText('validation.klingO1.editVideoRejectsImage') };
      return {
        ok: !![],
        prompt: replaceKlingO1PromptImageReferences(prompt, 0x0),
        images: [],
        videos: [value27],
        inputUrls: [],
        videoRole: 'base',
      };
    }
    if (list7['length'] > 0x1)
      return { ok: ![], message: videoTaskText('validation.klingO1.featureVideoMaxOneImage') };
    const images8 = list7['slice'](0x0, 0x1);
    return {
      ok: !![],
      prompt: replaceKlingO1PromptImageReferences(prompt, images8['length']),
      images: images8,
      videos: [value27],
      inputUrls: images8,
      videoRole: 'feature',
    };
  }
  const images9 = list7['slice'](0x0, 0x2);
  return {
    ok: !![],
    prompt: replaceKlingO1PromptImageReferences(prompt, images9['length']),
    images: images9,
    videos: [],
    inputUrls: images9,
    videoRole: '',
  };
}
function failure(value28) {
  return { ok: ![], message: String(value28 || '')['trim'](), payload: null };
}
function success(payload2) {
  return { ok: !![], message: '', payload: payload2 };
}
export function validateModelApiVideoPrompt({
  model: model = '',
  provider: provider = '',
  prompt: prompt = '',
} = {}) {
  if (isHappyHorseModelApiVideo(model, provider) && !String(prompt || '')['trim']())
    return failure(videoTaskText('validation.happyHorse.promptRequired'));
  return { ok: !![], message: '' };
}
export function compileModelApiVideoSubmit({
  payload: payload = {},
  model: model = '',
  provider: provider = '',
  nodeData: nodeData = {},
  modelExecution: modelExecution = null,
  inputMaterials: inputMaterials = {},
  assetInputRefs: assetInputRefs = [],
  assetVideoCount: assetVideoCount = 0x0,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const modelManifest = modelExecution?.['modelManifest'] || null,
    {
      images: images10,
      imageRefs: imageRefs,
      imageEntries: imageEntries,
      videos: videos6,
      videoRefs: videoRefs,
      videoEntries: videoEntries2,
      audios: audios4,
      audioEntries: audioEntries2,
      providerAssetRefs: providerAssetRefs,
    } = resolveModelApiVideoInputMaterials({
      inputMaterials: inputMaterials,
      modelManifest: modelManifest,
      nodeData: nodeData,
    }),
    min = validateModelMediaInputLimits({
      inputSlots: modelManifest?.['inputSlots'] || null,
      outputDurationSeconds:
        payload['generationParams']?.['duration'] ?? nodeData['generationParams']?.['duration'] ?? 0x0,
      images: images10,
      imageEntries: imageEntries,
      videos: videos6,
      audios: audios4,
      videoEntries: videoEntries2,
      audioEntries: audioEntries2,
    });
  if (!min['ok']) {
    const value29 = String(min?.['code'] || '')['trim']();
    return failure(
      value29
        ? videoTaskText('validation.mediaInputLimits.' + value29, {
            min: min['min'],
            max: min['max'],
            actual: min['actual'],
            allowed: min['allowed'],
          })
        : '',
    );
  }
  applyVideoNodeAdaptiveAspectRatio(payload, {
    inEdges: inEdges,
    nodes: nodes,
    nodeData: nodeData,
    provider: provider,
    model: model,
    modelManifest: modelManifest,
  });
  const fixedInputConfig2 = getFixedInputSlotConfigFromManifest(nodeData || {});
  if (isHappyHorseModelApiVideo(model, provider)) {
    const mode2 = getHappyHorseMode(nodeData),
      slotUrls2 = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: fixedInputConfig2,
        imageRefs: imageRefs,
        assetInputRefs: assetInputRefs,
      }),
      happyhorse_mode = buildHappyHorseMediaPayload({
        prompt: payload['prompt'],
        mode: mode2,
        images: orderHappyHorseImageUrls({ mode: mode2, images: images10, slotUrls: slotUrls2 }),
        videos: videos6,
        videoEntries: videoEntries2,
        assetVideoCount: assetVideoCount,
        maxVideoSeconds: getModelApiVideoMaxInputVideoSeconds(
          model,
          provider,
          HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS,
        ),
        supportsEdit: supportsHappyHorseModelApiVideoEdit(model, provider),
      });
    if (!happyhorse_mode['ok']) return failure(happyhorse_mode['message']);
    return (
      (payload['generationParams'] = {
        ...payload['generationParams'],
        happyhorse_mode: happyhorse_mode['mode'] || mode2,
      }),
      (payload['images'] = happyhorse_mode['images']),
      (payload['videos'] = happyhorse_mode['videos']),
      (payload['audios'] = []),
      (payload['inputUrls'] = happyhorse_mode['inputUrls']),
      success(payload)
    );
  }
  if (isWan27ModelApiVideo(model, provider)) {
    const mode3 = getWan27Mode(nodeData),
      videoInputUrlsByFixedKindSlot = buildVideoInputUrlsByFixedKindSlot({
        fixedInputConfig: fixedInputConfig2,
        refs: videoRefs,
        assetInputRefs: assetInputRefs,
        kind: 'video',
      }),
      videos7 = [],
      handler10 = (value30) => {
        const value31 = String(value30 || '')['trim']();
        value31 && !videos7['includes'](value31) && videos7['push'](value31);
      };
    if (mode3 === 'video') handler10(videoInputUrlsByFixedKindSlot['sourceVideo']);
    if (mode3 === 'reference') handler10(videoInputUrlsByFixedKindSlot['referenceVideo']);
    mode3 === 'edit' &&
      (handler10(videoInputUrlsByFixedKindSlot['originalVideo']),
      handler10(videoInputUrlsByFixedKindSlot['referenceVideo']));
    videos6['forEach'](handler10);
    const error = buildWan27MediaPayload({
      mode: mode3,
      images: images10,
      videos: videos7,
      audios: audios4,
      videoEntries: videoEntries2,
      audioEntries: audioEntries2,
      assetVideoCount: assetVideoCount,
    });
    if (!error['ok']) return failure(error['message']);
    ((payload['generationParams'] = { ...payload['generationParams'], wan27_mode: mode3 }),
      (payload['images'] = error['images']),
      (payload['videos'] = error['videos']),
      (payload['audios'] = error['audios']),
      (payload['inputUrls'] = error['inputUrls']));
    if (mode3 === 'image' || mode3 === 'reference') {
      const videoInputUrlsByFixedImageSlot = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: fixedInputConfig2,
        imageRefs: imageRefs,
        assetInputRefs: assetInputRefs,
      });
      Object['keys'](videoInputUrlsByFixedImageSlot)['length'] > 0x0 &&
        (payload['inputUrlsBySlot'] = videoInputUrlsByFixedImageSlot);
    }
    return success(payload);
  }
  if (isCanonicalProviderModel(model, provider, APIMART_KLING_V3_OMNI_MODEL_ID)) {
    const mode4 = getKlingV3OmniMode(nodeData),
      videoInputUrlsByFixedImageSlot2 = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: fixedInputConfig2,
        imageRefs: imageRefs,
        assetInputRefs: assetInputRefs,
      }),
      images11 = [],
      handler11 = (value32) => {
        const value33 = String(value32 || '')['trim']();
        value33 && !images11['includes'](value33) && images11['push'](value33);
      };
    mode4 === 'image' &&
      (handler11(videoInputUrlsByFixedImageSlot2['firstFrame']),
      handler11(videoInputUrlsByFixedImageSlot2['lastFrame']));
    if (mode4 === 'reference') handler11(videoInputUrlsByFixedImageSlot2['referenceImage']);
    images10['forEach'](handler11);
    const videoInputUrlsByFixedKindSlot2 = buildVideoInputUrlsByFixedKindSlot({
        fixedInputConfig: fixedInputConfig2,
        refs: videoRefs,
        assetInputRefs: assetInputRefs,
        kind: 'video',
      }),
      videos8 = [],
      handler12 = (value34) => {
        const value35 = String(value34 || '')['trim']();
        value35 && !videos8['includes'](value35) && videos8['push'](value35);
      };
    if (mode4 === 'reference') handler12(videoInputUrlsByFixedKindSlot2['referenceVideo']);
    if (mode4 === 'edit') handler12(videoInputUrlsByFixedKindSlot2['editVideo']);
    videos6['forEach'](handler12);
    const error2 = buildKlingV3OmniMediaPayload({
      mode: mode4,
      images: images11,
      videos: videos8,
      videoEntries: videoEntries2,
      assetVideoCount: assetVideoCount,
    });
    if (!error2['ok']) return failure(error2['message']);
    ((payload['generationParams'] = { ...payload['generationParams'], kling_v3_omni_mode: mode4 }),
      (payload['images'] = error2['images']),
      (payload['videos'] = error2['videos']),
      (payload['audios'] = []),
      (payload['inputUrls'] = error2['inputUrls']));
    if (mode4 === 'image' || mode4 === 'reference') {
      const value36 = {};
      if (mode4 === 'image')
        (videoInputUrlsByFixedImageSlot2['firstFrame'] &&
          (value36['firstFrame'] = videoInputUrlsByFixedImageSlot2['firstFrame']),
          videoInputUrlsByFixedImageSlot2['lastFrame'] &&
            (value36['lastFrame'] = videoInputUrlsByFixedImageSlot2['lastFrame']));
      else
        videoInputUrlsByFixedImageSlot2['referenceImage'] &&
          (value36['referenceImage'] = videoInputUrlsByFixedImageSlot2['referenceImage']);
      Object['keys'](value36)['length'] > 0x0 && (payload['inputUrlsBySlot'] = value36);
    }
    return success(payload);
  }
  if (isCanonicalProviderModel(model, provider, APIMART_KLING_O1_MODEL_ID)) {
    const videoInputUrlsByFixedImageSlot3 = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: fixedInputConfig2,
        imageRefs: imageRefs,
        assetInputRefs: assetInputRefs,
      }),
      images12 = [],
      handler13 = (value37) => {
        const value38 = String(value37 || '')['trim']();
        value38 && !images12['includes'](value38) && images12['push'](value38);
      };
    (handler13(videoInputUrlsByFixedImageSlot3['referenceImage']), images10['forEach'](handler13));
    const videoInputUrlsByFixedKindSlot3 = buildVideoInputUrlsByFixedKindSlot({
        fixedInputConfig: fixedInputConfig2,
        refs: videoRefs,
        assetInputRefs: assetInputRefs,
        kind: 'video',
      }),
      hasEditVideo2 = Boolean(videoInputUrlsByFixedKindSlot3['editVideo']),
      videoRole2 = Boolean(videoInputUrlsByFixedKindSlot3['featureReferenceVideo']),
      videos9 = [],
      handler14 = (value39) => {
        const value40 = String(value39 || '')['trim']();
        value40 && !videos9['includes'](value40) && videos9['push'](value40);
      };
    (handler14(videoInputUrlsByFixedKindSlot3['editVideo']),
      handler14(videoInputUrlsByFixedKindSlot3['featureReferenceVideo']),
      videos6['forEach'](handler14));
    const error3 = buildKlingO1MediaPayload({
      prompt: payload['prompt'],
      images: images12,
      videos: videos9,
      videoEntries: videoEntries2,
      videoRole: videoRole2 ? 'feature' : 'base',
      hasEditVideo: hasEditVideo2,
      hasFeatureVideo: videoRole2,
    });
    if (!error3['ok']) return failure(error3['message']);
    ((payload['prompt'] = error3['prompt']),
      (payload['images'] = error3['images']),
      (payload['videos'] = error3['videos']),
      (payload['audios'] = []),
      (payload['inputUrls'] = error3['inputUrls']));
    if (error3['videoRole']) payload['klingO1VideoRole'] = error3['videoRole'];
    else delete payload['klingO1VideoRole'];
    return success(payload);
  }
  ((payload['images'] = images10),
    (payload['videos'] = videos6),
    (payload['audios'] = audios4),
    (payload['inputUrls'] = images10));
  providerAssetRefs['length'] > 0x0 && (payload['providerAssetRefs'] = providerAssetRefs);
  const videoInputUrlsByFixedImageSlot4 = buildVideoInputUrlsByFixedImageSlot({
    fixedInputConfig: fixedInputConfig2,
    imageRefs: imageRefs,
    assetInputRefs: assetInputRefs,
  });
  Object['keys'](videoInputUrlsByFixedImageSlot4)['length'] > 0x0 &&
    (payload['inputUrlsBySlot'] = videoInputUrlsByFixedImageSlot4);
  const min2 = getMissingManifestInputRequirement({
    inputSlots: modelManifest?.['inputSlots'] || null,
    inputCounts: {
      text: String(payload['prompt'] || '')['trim']() ? 0x1 : 0x0,
      image: payload['images']['length'],
      video: payload['videos']['length'],
      audio: payload['audios']['length'],
    },
  });
  if (min2)
    return failure(
      t('modelInputPolicy.required', {
        min: min2['required'],
        type: t('modelInputPolicy.inputKinds.' + min2['kind']),
      }),
    );
  return success(payload);
}
