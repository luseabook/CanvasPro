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
function videoTaskText(_0x3804a2, _0x3c5218 = {}) {
  return t('videoTask.' + _0x3804a2, _0x3c5218);
}
function getPlainObject(_0x136b83) {
  return _0x136b83 && typeof _0x136b83 === 'object' && !Array['isArray'](_0x136b83) ? _0x136b83 : {};
}
function normalizePositiveNumber(_0x87fe81) {
  const _0x5f2c70 = Number(_0x87fe81);
  return Number['isFinite'](_0x5f2c70) && _0x5f2c70 > 0x0 ? _0x5f2c70 : 0x0;
}
function isCanonicalProviderModel(_0x16b4ab, _0x5955ad, _0x1aa067) {
  const _0x5a0a19 =
      resolveModelExecution(_0x16b4ab, { providerHint: _0x5955ad }) || resolveModelExecution(_0x16b4ab),
    _0x3dd424 = String(
      _0x5a0a19?.['canonicalModelId'] || _0x5a0a19?.['modelManifest']?.['modelId'] || _0x16b4ab || '',
    )['trim'](),
    _0x10aaf1 = String(_0x5a0a19?.['modelManifest']?.['provider'] || _0x5955ad || '')
      ['trim']()
      ['toLowerCase']();
  return _0x3dd424 === _0x1aa067 && (!_0x10aaf1 || _0x10aaf1 === 'apimart');
}
function buildVideoInputUrlsByFixedKindSlot({
  fixedInputConfig: fixedInputConfig = null,
  refs: refs = [],
  assetInputRefs: assetInputRefs = [],
  kind: kind = 'image',
} = {}) {
  const _0x393eca = String(kind || '')['trim'](),
    _0x580a66 = (fixedInputConfig?.['visibleSlots'] || [])
      ['map']((_0x3d95a7) => String(_0x3d95a7 || '')['trim']())
      ['filter'](
        (_0x1417d9) =>
          _0x1417d9 && String(fixedInputConfig?.['slotKindById']?.[_0x1417d9] || '') === _0x393eca,
      );
  if (_0x580a66['length'] === 0x0) return {};
  const _0x570206 = {},
    _0x2ae6d0 = new Set(),
    _0x1911dd = (_0x4a2326, _0xdd2d9) => {
      const _0x240ce3 = String(_0x4a2326 || '')['trim'](),
        _0x1132a4 = String(_0xdd2d9 || '')['trim']();
      if (!_0x240ce3 || !_0x1132a4 || _0x570206[_0x240ce3]) return ![];
      if (!_0x580a66['includes'](_0x240ce3)) return ![];
      return ((_0x570206[_0x240ce3] = _0x1132a4), _0x2ae6d0['add'](_0x1132a4), !![]);
    },
    _0x216513 = (_0x3de75e, { allowAuto: allowAuto = !![] } = {}) => {
      const _0x160921 = String(_0x3de75e?.['url'] || '')['trim']();
      if (!_0x160921 || _0x2ae6d0['has'](_0x160921)) return ![];
      const _0x963d38 = resolveEffectiveInputKind(_0x3de75e) || _0x3de75e?.['type'] || _0x393eca;
      if (String(_0x963d38 || '')['trim']() !== _0x393eca) return ![];
      const _0x5d627f = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: _0x3de75e?.['refSlot'],
        kind: _0x393eca,
        occupiedSlots: _0x570206,
        sourceNode: _0x3de75e?.['nodeData'] || _0x3de75e,
      });
      if (!allowAuto && _0x5d627f['reason'] !== 'explicit') return ![];
      return _0x1911dd(_0x5d627f['slot'], _0x160921);
    },
    _0x3b193a = (_0x4913d7) => {
      const _0x17ea4d = String(_0x4913d7 || '')['trim']();
      if (!_0x17ea4d || _0x2ae6d0['has'](_0x17ea4d)) return ![];
      const _0x11a752 = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: '',
        kind: _0x393eca,
        occupiedSlots: _0x570206,
        sourceNode: { type: _0x393eca, url: _0x17ea4d },
      });
      return _0x1911dd(_0x11a752['slot'], _0x17ea4d);
    },
    _0x136a6a = [
      ...(Array['isArray'](refs) ? refs : []),
      ...(Array['isArray'](assetInputRefs) ? assetInputRefs : []),
    ];
  return (
    _0x136a6a['forEach']((_0x34900f) => _0x216513(_0x34900f, { allowAuto: ![] })),
    (Array['isArray'](refs) ? refs : [])['forEach']((_0x152073) => _0x216513(_0x152073)),
    (Array['isArray'](assetInputRefs) ? assetInputRefs : [])['forEach']((_0xdac27b) => {
      const _0x3c52b3 = resolveEffectiveInputKind(_0xdac27b) || _0xdac27b?.['type'];
      if (_0x3c52b3 === _0x393eca) _0x3b193a(_0xdac27b?.['url']);
    }),
    _0x570206
  );
}
function buildVideoInputUrlsByFixedImageSlot(_0x3f2b09 = {}) {
  return buildVideoInputUrlsByFixedKindSlot({ ..._0x3f2b09, refs: _0x3f2b09['imageRefs'], kind: 'image' });
}
function normalizeHappyHorseMode(_0x212c6a) {
  const _0x5206f3 = String(_0x212c6a || '')
    ['trim']()
    ['toLowerCase']();
  return _0x5206f3 === 'image' || _0x5206f3 === 'reference' || _0x5206f3 === 'edit' ? _0x5206f3 : 'auto';
}
function getHappyHorseMode(_0x2a9377 = {}) {
  const _0x2b4b1c = getPlainObject(_0x2a9377?.['generationParams']);
  return normalizeHappyHorseMode(_0x2b4b1c['happyhorse_mode'] ?? _0x2a9377?.['happyhorse_mode']);
}
function normalizeWan27Mode(_0xb7a704) {
  const _0x5c79dc = String(_0xb7a704 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x5c79dc === 'video' || _0x5c79dc === 'reference' || _0x5c79dc === 'edit' ? _0x5c79dc : 'image';
}
function getWan27Mode(_0x3b003b = {}) {
  const _0x36a7a5 = getPlainObject(_0x3b003b?.['generationParams']);
  return normalizeWan27Mode(_0x36a7a5['wan27_mode'] ?? _0x3b003b?.['wan27_mode']);
}
function normalizeKlingV3OmniMode(_0xd402d1) {
  const _0x444c49 = String(_0xd402d1 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x444c49 === 'reference' || _0x444c49 === 'edit' ? _0x444c49 : 'image';
}
function getKlingV3OmniMode(_0x313f01 = {}) {
  const _0x20ad68 = getPlainObject(_0x313f01?.['generationParams']);
  return normalizeKlingV3OmniMode(_0x20ad68['kling_v3_omni_mode'] ?? _0x313f01?.['kling_v3_omni_mode']);
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
  const _0x285726 = String(prompt || '')['trim']();
  if (!_0x285726) return { ok: ![], message: videoTaskText('validation.happyHorse.promptRequired') };
  const _0x29a4e4 = Array['from'](
      new Set(
        (Array['isArray'](images) ? images : [])
          ['map']((_0x444721) => String(_0x444721 || '')['trim']())
          ['filter'](Boolean),
      ),
    ),
    _0x5eeb5d = Array['from'](
      new Set(
        (Array['isArray'](videos) ? videos : [])
          ['map']((_0x57992f) => String(_0x57992f || '')['trim']())
          ['filter'](Boolean),
      ),
    ),
    _0x4bebcc = normalizeHappyHorseMode(mode),
    _0x25ded1 = _0x29a4e4['length'] > 0x0 || _0x5eeb5d['length'] > 0x0,
    _0x15b244 = { ok: !![], images: [], videos: [], inputUrls: [], mode: 'auto' },
    _0x63401b = assetVideoCount > 0x0 ? videoTaskText('validation.removePromptVideoRefs') : '';
  if (_0x4bebcc === 'auto') {
    if (_0x25ded1) return { ok: ![], message: videoTaskText('validation.happyHorse.chooseMode') };
    return _0x15b244;
  }
  if (_0x4bebcc === 'image') {
    if (_0x5eeb5d['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.imageModeRejectsVideo', { hint: _0x63401b }) };
    if (!_0x29a4e4[0x0]) {
      if (!_0x25ded1) return _0x15b244;
      return { ok: ![], message: videoTaskText('validation.imageModeNeedsFirstFrame') };
    }
    return {
      ok: !![],
      images: _0x29a4e4['slice'](0x0, 0x1),
      videos: [],
      inputUrls: _0x29a4e4['slice'](0x0, 0x1),
      mode: 'image',
    };
  }
  if (_0x4bebcc === 'reference') {
    if (_0x5eeb5d['length'] > 0x0)
      return {
        ok: ![],
        message: videoTaskText('validation.referenceImageModeRejectsVideo', { hint: _0x63401b }),
      };
    if (_0x29a4e4['length'] <= 0x0) {
      if (!_0x25ded1) return _0x15b244;
      return { ok: ![], message: videoTaskText('validation.referenceImageModeNeedsReference') };
    }
    const _0x3d3d33 = _0x29a4e4['slice'](0x0, 0x9);
    return { ok: !![], images: _0x3d3d33, videos: [], inputUrls: _0x3d3d33, mode: 'reference' };
  }
  if (supportsEdit === ![])
    return { ok: ![], message: videoTaskText('validation.happyHorse.editUnsupported') };
  if (!_0x5eeb5d[0x0]) {
    if (!_0x25ded1) return _0x15b244;
    return { ok: ![], message: videoTaskText('validation.videoEditNeedsVideo') };
  }
  const _0xbea94d = _0x5eeb5d[0x0],
    _0x4c500a =
      (Array['isArray'](videoEntries) ? videoEntries : [])['find'](
        (_0xedcc1e) => String(_0xedcc1e?.['url'] || '')['trim']() === _0xbea94d,
      ) || {},
    _0x1e0a0e =
      Number['isFinite'](Number(maxVideoSeconds)) && Number(maxVideoSeconds) > 0x0
        ? Number(maxVideoSeconds)
        : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
  if (normalizePositiveNumber(_0x4c500a['duration']) > _0x1e0a0e)
    return {
      ok: ![],
      message: videoTaskText('validation.happyHorse.editVideoMaxSeconds', { seconds: _0x1e0a0e }),
    };
  return {
    ok: !![],
    images: _0x29a4e4['slice'](0x0, 0x5),
    videos: [_0xbea94d],
    inputUrls: _0x29a4e4['slice'](0x0, 0x5),
    mode: 'edit',
  };
}
function orderHappyHorseImageUrls({
  mode: mode = 'auto',
  images: images = [],
  slotUrls: slotUrls = {},
} = {}) {
  const _0x330c25 = [],
    _0x4835ff = (_0x1e0729) => {
      const _0x5044c2 = String(_0x1e0729 || '')['trim']();
      if (_0x5044c2 && !_0x330c25['includes'](_0x5044c2)) _0x330c25['push'](_0x5044c2);
    },
    _0x3982b3 = normalizeHappyHorseMode(mode);
  if (_0x3982b3 === 'image') _0x4835ff(slotUrls['firstFrame']);
  if (_0x3982b3 === 'reference') _0x4835ff(slotUrls['referenceImage']);
  if (_0x3982b3 === 'edit') _0x4835ff(slotUrls['editRefImage']);
  return ((Array['isArray'](images) ? images : [])['forEach'](_0x4835ff), _0x330c25);
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
  const _0x537d52 = (_0x5d82bf) =>
      Array['from'](
        new Set(
          (Array['isArray'](_0x5d82bf) ? _0x5d82bf : [])
            ['map']((_0x35ec92) => String(_0x35ec92 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
    _0x294d14 = normalizeWan27Mode(mode),
    _0x3c35d0 = _0x537d52(images),
    _0x5684d3 = _0x537d52(videos),
    _0x4eeb06 = _0x537d52(audios),
    _0x52131b = assetVideoCount > 0x0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    _0x5403c1 = (_0x41080d, _0x46df56) =>
      (Array['isArray'](_0x41080d) ? _0x41080d : [])['find'](
        (_0x47133c) => String(_0x47133c?.['url'] || '')['trim']() === _0x46df56,
      ) || {},
    _0x36a6fe = (_0x53ea34) => {
      if (!_0x53ea34) return null;
      const _0x572ef3 = _0x5403c1(audioEntries, _0x53ea34),
        _0x1f50aa = normalizePositiveNumber(_0x572ef3['duration']);
      if (
        _0x1f50aa > 0x0 &&
        (_0x1f50aa < WAN27_AUDIO_INPUT_MIN_SECONDS || _0x1f50aa > WAN27_AUDIO_INPUT_MAX_SECONDS)
      )
        return videoTaskText('validation.wan27.audioDuration');
      if (normalizePositiveNumber(_0x572ef3['sizeBytes']) > WAN27_AUDIO_INPUT_MAX_BYTES)
        return videoTaskText('validation.wan27.audioSize');
      return null;
    },
    _0x26b202 = (_0x156e63) => normalizePositiveNumber(_0x5403c1(videoEntries, _0x156e63)['duration']);
  if (_0x294d14 === 'video') {
    if (_0x3c35d0['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoExtendRejectsImage', { hint: _0x52131b }) };
    if (_0x4eeb06['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoExtendRejectsAudio') };
    if (!_0x5684d3[0x0]) return { ok: !![], images: [], videos: [], audios: [], inputUrls: [] };
    if (_0x26b202(_0x5684d3[0x0]) > WAN27_VIDEO_EXTEND_MAX_SECONDS)
      return { ok: ![], message: videoTaskText('validation.wan27.extendMaxSeconds') };
    return { ok: !![], images: [], videos: _0x5684d3['slice'](0x0, 0x1), audios: [], inputUrls: [] };
  }
  if (_0x294d14 === 'reference') {
    const _0x185507 = _0x3c35d0['slice'](0x0, 0x1),
      _0x2ab0cf = _0x5684d3['slice'](0x0, 0x1);
    if (_0x185507['length'] <= 0x0 && _0x2ab0cf['length'] <= 0x0)
      return { ok: ![], message: videoTaskText('validation.referenceVideoNeedsMedia') };
    if (_0x2ab0cf[0x0] && _0x26b202(_0x2ab0cf[0x0]) > WAN27_REFERENCE_VIDEO_MAX_SECONDS)
      return { ok: ![], message: videoTaskText('validation.wan27.referenceVideoMaxSeconds') };
    const _0x2c98c7 = _0x4eeb06[0x0] || '',
      _0x3b5148 = _0x36a6fe(_0x2c98c7);
    if (_0x3b5148) return { ok: ![], message: _0x3b5148 };
    if (_0x2c98c7 && _0x185507['length'] <= 0x0)
      return { ok: ![], message: videoTaskText('validation.referenceAudioNeedsImage') };
    return {
      ok: !![],
      images: _0x185507,
      videos: _0x2ab0cf,
      audios: _0x2c98c7 ? [_0x2c98c7] : [],
      inputUrls: _0x185507,
    };
  }
  if (_0x294d14 === 'edit') {
    if (!_0x5684d3[0x0]) return { ok: ![], message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (_0x3c35d0['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoEditRejectsImageUseReferenceVideo') };
    if (_0x4eeb06['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoEditRejectsAudio') };
    const _0x22733e = _0x26b202(_0x5684d3[0x0]);
    if (
      _0x22733e > 0x0 &&
      (_0x22733e < WAN27_EDIT_VIDEO_MIN_SECONDS || _0x22733e > WAN27_EDIT_VIDEO_MAX_SECONDS)
    )
      return { ok: ![], message: videoTaskText('validation.wan27.editVideoDuration') };
    return { ok: !![], images: [], videos: _0x5684d3['slice'](0x0, 0x2), audios: [], inputUrls: [] };
  }
  if (_0x5684d3['length'] > 0x0)
    return { ok: ![], message: videoTaskText('validation.imageModeRejectsVideo', { hint: _0x52131b }) };
  const _0x4b795b = _0x4eeb06[0x0] || '',
    _0x49df94 = _0x36a6fe(_0x4b795b);
  if (_0x49df94) return { ok: ![], message: _0x49df94 };
  const _0x2eea02 = _0x3c35d0['slice'](0x0, 0x2);
  return {
    ok: !![],
    images: _0x2eea02,
    videos: [],
    audios: _0x4b795b ? [_0x4b795b] : [],
    inputUrls: _0x2eea02,
  };
}
function buildKlingV3OmniMediaPayload({
  mode: mode = 'image',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0x0,
} = {}) {
  const _0xecdade = (_0x371f79) =>
      Array['from'](
        new Set(
          (Array['isArray'](_0x371f79) ? _0x371f79 : [])
            ['map']((_0x19a084) => String(_0x19a084 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
    _0x23e5ca = normalizeKlingV3OmniMode(mode),
    _0x1823a5 = _0xecdade(images),
    _0x331f1e = _0xecdade(videos),
    _0x30336a = assetVideoCount > 0x0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    _0x2ef8f7 = (_0x44c599) =>
      normalizePositiveNumber(
        (Array['isArray'](videoEntries) ? videoEntries : [])['find'](
          (_0x71ee77) => String(_0x71ee77?.['url'] || '')['trim']() === _0x44c599,
        )?.['duration'],
      );
  if (_0x23e5ca === 'reference') {
    const _0x3f2a39 = _0x1823a5['slice'](0x0, 0x1),
      _0x4cb639 = _0x331f1e['slice'](0x0, 0x1);
    if (_0x3f2a39['length'] <= 0x0 && _0x4cb639['length'] <= 0x0)
      return { ok: ![], message: videoTaskText('validation.referenceVideoNeedsMedia') };
    return { ok: !![], images: _0x3f2a39, videos: _0x4cb639, audios: [], inputUrls: _0x3f2a39 };
  }
  if (_0x23e5ca === 'edit') {
    if (!_0x331f1e[0x0]) return { ok: ![], message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (_0x1823a5['length'] > 0x0)
      return { ok: ![], message: videoTaskText('validation.videoEditRejectsImage') };
    const _0x5e14fb = _0x2ef8f7(_0x331f1e[0x0]);
    if (
      _0x5e14fb > 0x0 &&
      (_0x5e14fb < KLING_V3_OMNI_VIDEO_MIN_SECONDS || _0x5e14fb > KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS)
    )
      return { ok: ![], message: videoTaskText('validation.klingV3Omni.editVideoDuration') };
    return { ok: !![], images: [], videos: _0x331f1e['slice'](0x0, 0x1), audios: [], inputUrls: [] };
  }
  if (_0x331f1e['length'] > 0x0)
    return { ok: ![], message: videoTaskText('validation.imageModeRejectsVideo', { hint: _0x30336a }) };
  return {
    ok: !![],
    images: _0x1823a5['slice'](0x0, 0x2),
    videos: [],
    audios: [],
    inputUrls: _0x1823a5['slice'](0x0, 0x2),
  };
}
function replaceKlingO1PromptImageReferences(_0x556158, _0x10e449) {
  const _0x1a299b = Math['max'](0x0, Math['trunc'](Number(_0x10e449) || 0x0));
  if (_0x1a299b <= 0x0) return String(_0x556158 || '');
  return String(_0x556158 || '')['replace'](/@?图片\s*([1-9]\d*)/g, (_0x14f358, _0x171638) => {
    const _0x169287 = Number['parseInt'](String(_0x171638 || ''), 0xa);
    if (!Number['isFinite'](_0x169287) || _0x169287 < 0x1 || _0x169287 > _0x1a299b) return _0x14f358;
    return '<<<image_' + _0x169287 + '>>>';
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
  const _0x591ea8 = (_0x2e29c8) =>
      Array['from'](
        new Set(
          (Array['isArray'](_0x2e29c8) ? _0x2e29c8 : [])
            ['map']((_0x375724) => String(_0x375724 || '')['trim']())
            ['filter'](Boolean),
        ),
      ),
    _0x4f1563 = _0x591ea8(images),
    _0x2d0e96 = _0x591ea8(videos),
    _0x569b4c = String(videoRole || '')['trim']() === 'feature' ? 'feature' : 'base',
    _0x269ec5 = (_0x2f680f) =>
      normalizePositiveNumber(
        (Array['isArray'](videoEntries) ? videoEntries : [])['find'](
          (_0x2d888e) => String(_0x2d888e?.['url'] || '')['trim']() === _0x2f680f,
        )?.['duration'],
      );
  if (hasEditVideo && hasFeatureVideo)
    return { ok: ![], message: videoTaskText('validation.klingO1.editAndFeatureExclusive') };
  if (_0x2d0e96['length'] > 0x1)
    return { ok: ![], message: videoTaskText('validation.klingO1.onlyOneVideo') };
  const _0x8ac1eb = _0x2d0e96[0x0] || '';
  if (_0x8ac1eb) {
    const _0x631d03 = _0x269ec5(_0x8ac1eb);
    if (_0x631d03 > 0x0 && (_0x631d03 < KLING_O1_VIDEO_MIN_SECONDS || _0x631d03 > KLING_O1_VIDEO_MAX_SECONDS))
      return { ok: ![], message: videoTaskText('validation.klingO1.referenceVideoDuration') };
    if (_0x569b4c === 'base') {
      if (_0x4f1563['length'] > 0x0)
        return { ok: ![], message: videoTaskText('validation.klingO1.editVideoRejectsImage') };
      return {
        ok: !![],
        prompt: replaceKlingO1PromptImageReferences(prompt, 0x0),
        images: [],
        videos: [_0x8ac1eb],
        inputUrls: [],
        videoRole: 'base',
      };
    }
    if (_0x4f1563['length'] > 0x1)
      return { ok: ![], message: videoTaskText('validation.klingO1.featureVideoMaxOneImage') };
    const _0x274d1a = _0x4f1563['slice'](0x0, 0x1);
    return {
      ok: !![],
      prompt: replaceKlingO1PromptImageReferences(prompt, _0x274d1a['length']),
      images: _0x274d1a,
      videos: [_0x8ac1eb],
      inputUrls: _0x274d1a,
      videoRole: 'feature',
    };
  }
  const _0x2d1476 = _0x4f1563['slice'](0x0, 0x2);
  return {
    ok: !![],
    prompt: replaceKlingO1PromptImageReferences(prompt, _0x2d1476['length']),
    images: _0x2d1476,
    videos: [],
    inputUrls: _0x2d1476,
    videoRole: '',
  };
}
function failure(_0x1b6e17) {
  return { ok: ![], message: String(_0x1b6e17 || '')['trim'](), payload: null };
}
function success(_0x3d12b5) {
  return { ok: !![], message: '', payload: _0x3d12b5 };
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
  const _0x2ef917 = modelExecution?.['modelManifest'] || null,
    {
      images: _0x43317c,
      imageRefs: _0x1ab819,
      imageEntries: _0x5320c9,
      videos: _0x372f57,
      videoRefs: _0x1819e3,
      videoEntries: _0x1786b6,
      audios: _0x3a57ce,
      audioEntries: _0x79646a,
      providerAssetRefs: _0x3ee023,
    } = resolveModelApiVideoInputMaterials({
      inputMaterials: inputMaterials,
      modelManifest: _0x2ef917,
      nodeData: nodeData,
    }),
    _0x3338b6 = validateModelMediaInputLimits({
      inputSlots: _0x2ef917?.['inputSlots'] || null,
      outputDurationSeconds:
        payload['generationParams']?.['duration'] ?? nodeData['generationParams']?.['duration'] ?? 0x0,
      images: _0x43317c,
      imageEntries: _0x5320c9,
      videos: _0x372f57,
      audios: _0x3a57ce,
      videoEntries: _0x1786b6,
      audioEntries: _0x79646a,
    });
  if (!_0x3338b6['ok']) {
    const _0x120ead = String(_0x3338b6?.['code'] || '')['trim']();
    return failure(
      _0x120ead
        ? videoTaskText('validation.mediaInputLimits.' + _0x120ead, {
            min: _0x3338b6['min'],
            max: _0x3338b6['max'],
            actual: _0x3338b6['actual'],
            allowed: _0x3338b6['allowed'],
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
    modelManifest: _0x2ef917,
  });
  const _0x2fde01 = getFixedInputSlotConfigFromManifest(nodeData || {});
  if (isHappyHorseModelApiVideo(model, provider)) {
    const _0xcfc024 = getHappyHorseMode(nodeData),
      _0x359374 = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: _0x2fde01,
        imageRefs: _0x1ab819,
        assetInputRefs: assetInputRefs,
      }),
      _0x31b949 = buildHappyHorseMediaPayload({
        prompt: payload['prompt'],
        mode: _0xcfc024,
        images: orderHappyHorseImageUrls({ mode: _0xcfc024, images: _0x43317c, slotUrls: _0x359374 }),
        videos: _0x372f57,
        videoEntries: _0x1786b6,
        assetVideoCount: assetVideoCount,
        maxVideoSeconds: getModelApiVideoMaxInputVideoSeconds(
          model,
          provider,
          HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS,
        ),
        supportsEdit: supportsHappyHorseModelApiVideoEdit(model, provider),
      });
    if (!_0x31b949['ok']) return failure(_0x31b949['message']);
    return (
      (payload['generationParams'] = {
        ...payload['generationParams'],
        happyhorse_mode: _0x31b949['mode'] || _0xcfc024,
      }),
      (payload['images'] = _0x31b949['images']),
      (payload['videos'] = _0x31b949['videos']),
      (payload['audios'] = []),
      (payload['inputUrls'] = _0x31b949['inputUrls']),
      success(payload)
    );
  }
  if (isWan27ModelApiVideo(model, provider)) {
    const _0x409506 = getWan27Mode(nodeData),
      _0x5b7bd1 = buildVideoInputUrlsByFixedKindSlot({
        fixedInputConfig: _0x2fde01,
        refs: _0x1819e3,
        assetInputRefs: assetInputRefs,
        kind: 'video',
      }),
      _0xbe1ba0 = [],
      _0x47af04 = (_0x456979) => {
        const _0x3ec6fb = String(_0x456979 || '')['trim']();
        _0x3ec6fb && !_0xbe1ba0['includes'](_0x3ec6fb) && _0xbe1ba0['push'](_0x3ec6fb);
      };
    if (_0x409506 === 'video') _0x47af04(_0x5b7bd1['sourceVideo']);
    if (_0x409506 === 'reference') _0x47af04(_0x5b7bd1['referenceVideo']);
    _0x409506 === 'edit' && (_0x47af04(_0x5b7bd1['originalVideo']), _0x47af04(_0x5b7bd1['referenceVideo']));
    _0x372f57['forEach'](_0x47af04);
    const _0x2ed4da = buildWan27MediaPayload({
      mode: _0x409506,
      images: _0x43317c,
      videos: _0xbe1ba0,
      audios: _0x3a57ce,
      videoEntries: _0x1786b6,
      audioEntries: _0x79646a,
      assetVideoCount: assetVideoCount,
    });
    if (!_0x2ed4da['ok']) return failure(_0x2ed4da['message']);
    ((payload['generationParams'] = { ...payload['generationParams'], wan27_mode: _0x409506 }),
      (payload['images'] = _0x2ed4da['images']),
      (payload['videos'] = _0x2ed4da['videos']),
      (payload['audios'] = _0x2ed4da['audios']),
      (payload['inputUrls'] = _0x2ed4da['inputUrls']));
    if (_0x409506 === 'image' || _0x409506 === 'reference') {
      const _0x14c672 = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: _0x2fde01,
        imageRefs: _0x1ab819,
        assetInputRefs: assetInputRefs,
      });
      Object['keys'](_0x14c672)['length'] > 0x0 && (payload['inputUrlsBySlot'] = _0x14c672);
    }
    return success(payload);
  }
  if (isCanonicalProviderModel(model, provider, APIMART_KLING_V3_OMNI_MODEL_ID)) {
    const _0x1df7de = getKlingV3OmniMode(nodeData),
      _0x1b2ef7 = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: _0x2fde01,
        imageRefs: _0x1ab819,
        assetInputRefs: assetInputRefs,
      }),
      _0x500283 = [],
      _0x5b4b49 = (_0x52592f) => {
        const _0xb1017f = String(_0x52592f || '')['trim']();
        _0xb1017f && !_0x500283['includes'](_0xb1017f) && _0x500283['push'](_0xb1017f);
      };
    _0x1df7de === 'image' && (_0x5b4b49(_0x1b2ef7['firstFrame']), _0x5b4b49(_0x1b2ef7['lastFrame']));
    if (_0x1df7de === 'reference') _0x5b4b49(_0x1b2ef7['referenceImage']);
    _0x43317c['forEach'](_0x5b4b49);
    const _0x43e797 = buildVideoInputUrlsByFixedKindSlot({
        fixedInputConfig: _0x2fde01,
        refs: _0x1819e3,
        assetInputRefs: assetInputRefs,
        kind: 'video',
      }),
      _0x15fffa = [],
      _0x590ab4 = (_0x1b2996) => {
        const _0x36c31a = String(_0x1b2996 || '')['trim']();
        _0x36c31a && !_0x15fffa['includes'](_0x36c31a) && _0x15fffa['push'](_0x36c31a);
      };
    if (_0x1df7de === 'reference') _0x590ab4(_0x43e797['referenceVideo']);
    if (_0x1df7de === 'edit') _0x590ab4(_0x43e797['editVideo']);
    _0x372f57['forEach'](_0x590ab4);
    const _0x27bcda = buildKlingV3OmniMediaPayload({
      mode: _0x1df7de,
      images: _0x500283,
      videos: _0x15fffa,
      videoEntries: _0x1786b6,
      assetVideoCount: assetVideoCount,
    });
    if (!_0x27bcda['ok']) return failure(_0x27bcda['message']);
    ((payload['generationParams'] = { ...payload['generationParams'], kling_v3_omni_mode: _0x1df7de }),
      (payload['images'] = _0x27bcda['images']),
      (payload['videos'] = _0x27bcda['videos']),
      (payload['audios'] = []),
      (payload['inputUrls'] = _0x27bcda['inputUrls']));
    if (_0x1df7de === 'image' || _0x1df7de === 'reference') {
      const _0x277ed6 = {};
      if (_0x1df7de === 'image')
        (_0x1b2ef7['firstFrame'] && (_0x277ed6['firstFrame'] = _0x1b2ef7['firstFrame']),
          _0x1b2ef7['lastFrame'] && (_0x277ed6['lastFrame'] = _0x1b2ef7['lastFrame']));
      else _0x1b2ef7['referenceImage'] && (_0x277ed6['referenceImage'] = _0x1b2ef7['referenceImage']);
      Object['keys'](_0x277ed6)['length'] > 0x0 && (payload['inputUrlsBySlot'] = _0x277ed6);
    }
    return success(payload);
  }
  if (isCanonicalProviderModel(model, provider, APIMART_KLING_O1_MODEL_ID)) {
    const _0x13503d = buildVideoInputUrlsByFixedImageSlot({
        fixedInputConfig: _0x2fde01,
        imageRefs: _0x1ab819,
        assetInputRefs: assetInputRefs,
      }),
      _0x54239b = [],
      _0x348a14 = (_0x361901) => {
        const _0x12499c = String(_0x361901 || '')['trim']();
        _0x12499c && !_0x54239b['includes'](_0x12499c) && _0x54239b['push'](_0x12499c);
      };
    (_0x348a14(_0x13503d['referenceImage']), _0x43317c['forEach'](_0x348a14));
    const _0x1f6d57 = buildVideoInputUrlsByFixedKindSlot({
        fixedInputConfig: _0x2fde01,
        refs: _0x1819e3,
        assetInputRefs: assetInputRefs,
        kind: 'video',
      }),
      _0x51317d = Boolean(_0x1f6d57['editVideo']),
      _0x18f3b3 = Boolean(_0x1f6d57['featureReferenceVideo']),
      _0x3f835a = [],
      _0x38926c = (_0x235543) => {
        const _0x21bbd3 = String(_0x235543 || '')['trim']();
        _0x21bbd3 && !_0x3f835a['includes'](_0x21bbd3) && _0x3f835a['push'](_0x21bbd3);
      };
    (_0x38926c(_0x1f6d57['editVideo']),
      _0x38926c(_0x1f6d57['featureReferenceVideo']),
      _0x372f57['forEach'](_0x38926c));
    const _0x395e51 = buildKlingO1MediaPayload({
      prompt: payload['prompt'],
      images: _0x54239b,
      videos: _0x3f835a,
      videoEntries: _0x1786b6,
      videoRole: _0x18f3b3 ? 'feature' : 'base',
      hasEditVideo: _0x51317d,
      hasFeatureVideo: _0x18f3b3,
    });
    if (!_0x395e51['ok']) return failure(_0x395e51['message']);
    ((payload['prompt'] = _0x395e51['prompt']),
      (payload['images'] = _0x395e51['images']),
      (payload['videos'] = _0x395e51['videos']),
      (payload['audios'] = []),
      (payload['inputUrls'] = _0x395e51['inputUrls']));
    if (_0x395e51['videoRole']) payload['klingO1VideoRole'] = _0x395e51['videoRole'];
    else delete payload['klingO1VideoRole'];
    return success(payload);
  }
  ((payload['images'] = _0x43317c),
    (payload['videos'] = _0x372f57),
    (payload['audios'] = _0x3a57ce),
    (payload['inputUrls'] = _0x43317c));
  _0x3ee023['length'] > 0x0 && (payload['providerAssetRefs'] = _0x3ee023);
  const _0x30ce74 = buildVideoInputUrlsByFixedImageSlot({
    fixedInputConfig: _0x2fde01,
    imageRefs: _0x1ab819,
    assetInputRefs: assetInputRefs,
  });
  Object['keys'](_0x30ce74)['length'] > 0x0 && (payload['inputUrlsBySlot'] = _0x30ce74);
  const _0x3a9779 = getMissingManifestInputRequirement({
    inputSlots: _0x2ef917?.['inputSlots'] || null,
    inputCounts: {
      text: String(payload['prompt'] || '')['trim']() ? 0x1 : 0x0,
      image: payload['images']['length'],
      video: payload['videos']['length'],
      audio: payload['audios']['length'],
    },
  });
  if (_0x3a9779)
    return failure(
      t('modelInputPolicy.required', {
        min: _0x3a9779['required'],
        type: t('modelInputPolicy.inputKinds.' + _0x3a9779['kind']),
      }),
    );
  return success(payload);
}
