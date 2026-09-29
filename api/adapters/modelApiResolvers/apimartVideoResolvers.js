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
function normalizeApimartVeo3ModelChoice(_0x486623) {
  const _0x28afce = String(_0x486623 || '')
    ['trim']()
    ['toLowerCase']();
  return VEO3_MODEL_CHOICES['has'](_0x28afce) ? _0x28afce : 'fast';
}
function getApimartVeo3ModelChoice(_0x1a694b = {}) {
  return normalizeApimartVeo3ModelChoice(_0x1a694b?.['generationParams']?.['mode'] ?? _0x1a694b?.['mode']);
}
function normalizeApimartVeo3GenerationType(_0x461994, { modelChoice: modelChoice = 'fast' } = {}) {
  const _0x3fabf7 = String(_0x461994 || '')
      ['trim']()
      ['toLowerCase'](),
    _0x4cc2cf = VEO3_IMAGE_GENERATION_TYPES['has'](_0x3fabf7) ? _0x3fabf7 : 'frame';
  if (normalizeApimartVeo3ModelChoice(modelChoice) === 'quality') return 'frame';
  return _0x4cc2cf;
}
function getApimartVeo3GenerationType(_0x33f8a0 = {}) {
  const _0x2551ec = getApimartVeo3ModelChoice(_0x33f8a0);
  return normalizeApimartVeo3GenerationType(
    _0x33f8a0?.['generationParams']?.['generation_type'] ?? _0x33f8a0?.['generation_type'],
    { modelChoice: _0x2551ec },
  );
}
function validateApimartVeo3ImageCount(
  _0x18bdea = {},
  _0x1ea6c4 = 0x0,
  { allowTextOnly: allowTextOnly = ![] } = {},
) {
  const _0xc4381e = Math['max'](0x0, Math['trunc'](Number(_0x1ea6c4) || 0x0));
  if (allowTextOnly && _0xc4381e === 0x0) return Object['freeze']({ ok: !![], message: '' });
  const _0x1568c7 = getApimartVeo3GenerationType(_0x18bdea);
  if (_0x1568c7 === 'reference')
    return Object['freeze']({
      ok: _0xc4381e <= 0x3,
      message: _0xc4381e <= 0x3 ? '' : 'VEO3\x20参考图模式最多接入\x203\x20张图片',
    });
  return Object['freeze']({
    ok: _0xc4381e <= 0x2,
    message: _0xc4381e <= 0x2 ? '' : 'VEO3 首尾帧模式最多接入 2 张图片',
  });
}
export function apimartOmniFlashVideo({ currentBody: _0x343e5e }) {
  const _0x58d550 = { ..._0x343e5e };
  if (!String(_0x58d550['prompt'] || '')['trim']())
    throw new Error('Gemini Omni 1.1 Flash Ext requires a prompt');
  const _0x13bdc6 = String(_0x58d550['generation_type'] || 'frame')
    ['trim']()
    ['toLowerCase']();
  if (_0x13bdc6 !== 'frame' && _0x13bdc6 !== 'reference')
    throw new Error('Gemini Omni 1.1 Flash Ext generation_type must be frame or reference');
  _0x58d550['generation_type'] = _0x13bdc6;
  const _0x5c9f4a = normalizeInputList(_0x58d550['image_urls']);
  if (_0x13bdc6 === 'frame' && _0x5c9f4a['length'] > 0x1)
    throw new Error('Gemini Omni 1.1 Flash Ext frame mode supports at most 1 image');
  if (
    _0x13bdc6 === 'reference' &&
    _0x5c9f4a['length'] > 0x0 &&
    _0x5c9f4a['length'] !== 0x1 &&
    _0x5c9f4a['length'] !== 0x3
  )
    throw new Error('Gemini Omni 1.1 Flash Ext reference mode supports only 1 or 3 images');
  return (
    normalizeInputList(_0x58d550['video_urls'])['length'] > 0x0 && delete _0x58d550['duration'],
    _0x58d550
  );
}
export function apimartVeo3Video({
  currentBody: _0x3a257c,
  inputImages: inputImages = [],
  payload: payload = {},
}) {
  const _0x1e67bb = { ..._0x3a257c },
    _0x29342f = normalizeInputList(inputImages),
    _0x37d568 = getApimartVeo3ModelChoice(payload),
    _0xd2740e = getApimartVeo3GenerationType(payload);
  ((_0x1e67bb['duration'] = 0x8), delete _0x1e67bb['official_fallback']);
  const _0x1cc608 = String(_0x1e67bb['resolution'] || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x1e67bb['enable_gif'] === !![] && (_0x1cc608 === '1080p' || _0x1cc608 === '4k'))
    throw new Error('APIMart VEO3 GIF output only supports 720p resolution');
  const _0x4db64f = validateApimartVeo3ImageCount(
    { generationParams: { mode: _0x37d568, generation_type: _0xd2740e } },
    _0x29342f['length'],
    { allowTextOnly: !![] },
  );
  if (!_0x4db64f['ok']) throw new Error(_0x4db64f['message']);
  if (_0x29342f['length'] === 0x0)
    return (delete _0x1e67bb['generation_type'], delete _0x1e67bb['image_urls'], _0x1e67bb);
  return (
    (_0x1e67bb['generation_type'] = _0xd2740e === 'reference' ? 'reference' : 'frame'),
    (_0x1e67bb['image_urls'] =
      _0x1e67bb['generation_type'] === 'reference'
        ? _0x29342f['slice'](0x0, 0x3)
        : _0x29342f['slice'](0x0, 0x2)),
    _0x1e67bb
  );
}
export function apimartHappyHorseVideo({
  currentBody: _0x2e82f4,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: executionManifest = null,
}) {
  const _0x35303f = { ..._0x2e82f4 },
    _0x792a80 =
      executionManifest?.['extensions']?.['happyHorse'] &&
      typeof executionManifest['extensions']['happyHorse'] === 'object' &&
      !Array['isArray'](executionManifest['extensions']['happyHorse'])
        ? executionManifest['extensions']['happyHorse']
        : {},
    _0x2f2b77 = String(_0x792a80['versionLabel'] || 'HappyHorse 1.0')['trim'](),
    _0x21364b = _0x792a80['supportsEdit'] !== ![],
    _0x8d4b29 = String(_0x35303f['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!_0x8d4b29) throw new Error(_0x2f2b77 + ' prompt is required');
  const _0x2046c8 = normalizeInputList(inputImages),
    _0x2c1454 = normalizeInputList(inputVideos),
    _0x542541 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x1a4fa6 = (_0x4fc1a5 = [], _0x3e37b5 = []) => {
      const _0x6c4f5a = [],
        _0x41545d = (_0x4c7489) => {
          const _0x2812fd = String(_0x4c7489 || '')['trim']();
          if (_0x2812fd && !_0x6c4f5a['includes'](_0x2812fd)) _0x6c4f5a['push'](_0x2812fd);
        };
      return (
        _0x4fc1a5['forEach']((_0x276cf5) => _0x41545d(_0x542541[_0x276cf5])),
        normalizeInputList(_0x3e37b5)['forEach'](_0x41545d),
        _0x6c4f5a
      );
    };
  let _0x10bfc6 = String(
    payload?.['generationParams']?.['happyhorse_mode'] || payload?.['happyhorse_mode'] || 'auto',
  )['trim']();
  const _0xbd2818 =
    _0x2046c8['length'] > 0x0 || _0x2c1454['length'] > 0x0 || Object['keys'](_0x542541)['length'] > 0x0;
  (_0x10bfc6 === 'image' || _0x10bfc6 === 'reference' || _0x10bfc6 === 'edit') &&
    !_0xbd2818 &&
    (_0x10bfc6 = 'auto');
  delete _0x35303f['happyhorse_mode'];
  if (!_0x21364b && _0x2c1454['length'] > 0x0)
    throw new Error(_0x2f2b77 + ' does not support video edit mode');
  if (_0x10bfc6 === 'edit') {
    if (!_0x21364b) throw new Error(_0x2f2b77 + '\x20does\x20not\x20support\x20video\x20edit\x20mode');
    if (!_0x2c1454[0x0]) throw new Error(_0x2f2b77 + ' video edit requires video_url input');
    const _0xf0f0bf = _0x1a4fa6(['editRefImage'], _0x2046c8);
    _0x35303f['video_url'] = _0x2c1454[0x0];
    if (_0xf0f0bf['length'] > 0x0) _0x35303f['image_urls'] = _0xf0f0bf['slice'](0x0, 0x5);
    const _0xefd12f = String(
      payload?.['generationParams']?.['audio_setting'] || payload?.['audio_setting'] || '',
    )['trim']();
    return (
      (_0xefd12f === 'auto' || _0xefd12f === 'origin') && (_0x35303f['audio_setting'] = _0xefd12f),
      delete _0x35303f['first_frame_image'],
      delete _0x35303f['size'],
      delete _0x35303f['duration'],
      _0x35303f
    );
  }
  delete _0x35303f['audio_setting'];
  if (_0x10bfc6 === 'image') {
    const _0x7b10d5 = _0x1a4fa6(['firstFrame'], _0x2046c8);
    if (!_0x7b10d5[0x0]) throw new Error(_0x2f2b77 + ' image-to-video requires first_frame_image input');
    return (
      (_0x35303f['first_frame_image'] = _0x7b10d5[0x0]),
      delete _0x35303f['image_urls'],
      delete _0x35303f['video_url'],
      delete _0x35303f['size'],
      _0x35303f
    );
  }
  if (_0x10bfc6 === 'reference') {
    const _0x366a90 = _0x1a4fa6(['referenceImage'], _0x2046c8);
    if (_0x366a90['length'] <= 0x0)
      throw new Error(_0x2f2b77 + '\x20reference\x20mode\x20requires\x20image_urls\x20input');
    return (
      (_0x35303f['image_urls'] = _0x366a90['slice'](0x0, 0x9)),
      delete _0x35303f['first_frame_image'],
      delete _0x35303f['video_url'],
      _0x35303f
    );
  }
  if (_0x10bfc6 !== 'auto') throw new Error('Unsupported ' + _0x2f2b77 + '\x20mode:\x20' + _0x10bfc6);
  if (_0x2046c8['length'] > 0x0 || _0x2c1454['length'] > 0x0)
    throw new Error(_0x2f2b77 + ' media inputs require an explicit mode selection');
  return (
    delete _0x35303f['first_frame_image'],
    delete _0x35303f['image_urls'],
    delete _0x35303f['video_url'],
    _0x35303f
  );
}
export function apimartHailuo23Video({
  currentBody: _0x44c8cb,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
}) {
  const _0x2adacf = { ..._0x44c8cb };
  delete _0x2adacf['last_frame_image'];
  const _0x303ba5 = normalizeInputList(inputImages),
    _0x20a875 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0xc7d661 = Object['keys'](_0x20a875)['length'] > 0x0;
  if (_0xc7d661) {
    delete _0x2adacf['first_frame_image'];
    if (_0x20a875['firstFrame']) _0x2adacf['first_frame_image'] = _0x20a875['firstFrame'];
  } else _0x303ba5[0x0] && (_0x2adacf['first_frame_image'] = _0x303ba5[0x0]);
  const _0x1a6224 = String(modelToken || _0x2adacf['model'] || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x1a6224 === 'minimax-hailuo-2.3-fast' && !String(_0x2adacf['first_frame_image'] || '')['trim']())
    throw new Error('APIMart Hailuo 2.3 Fast requires first_frame_image input');
  return _0x2adacf;
}
function removeApimartMinimaxH3TransientFields(_0x1f3121) {
  (delete _0x1f3121['apimart_minimax_h3_mode'],
    delete _0x1f3121['first_frame_image'],
    delete _0x1f3121['last_frame_image'],
    delete _0x1f3121['image_urls'],
    delete _0x1f3121['video_urls'],
    delete _0x1f3121['audio_urls']);
}
export function apimartMinimaxH3Video({
  currentBody: _0x152b87,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x2d39d6 = { ..._0x152b87 },
    _0x2edb2f = resolveMinimaxH3Request({
      currentBody: _0x152b87,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      payload: payload,
      finalPrompt: finalPrompt,
      finalUrlsBySlot: finalUrlsBySlot,
      modeFieldId: 'apimart_minimax_h3_mode',
      providerLabel: 'APIMart',
    });
  ((_0x2d39d6['prompt'] = _0x2edb2f['prompt']),
    (_0x2d39d6['resolution'] = _0x2edb2f['resolution']),
    (_0x2d39d6['duration'] = _0x2edb2f['duration']),
    removeApimartMinimaxH3TransientFields(_0x2d39d6));
  if (_0x2edb2f['mode'] === 'reference')
    return (
      _0x2edb2f['referenceImages']['length'] > 0x0 &&
        (_0x2d39d6['image_urls'] = _0x2edb2f['referenceImages']),
      _0x2edb2f['referenceVideos']['length'] > 0x0 &&
        (_0x2d39d6['video_urls'] = _0x2edb2f['referenceVideos']),
      _0x2edb2f['referenceAudios']['length'] > 0x0 &&
        (_0x2d39d6['audio_urls'] = _0x2edb2f['referenceAudios']),
      (_0x2d39d6['aspect_ratio'] = _0x2edb2f['ratio']),
      _0x2d39d6
    );
  if (!_0x2edb2f['firstFrameImage'] && !_0x2edb2f['lastFrameImage'])
    return ((_0x2d39d6['aspect_ratio'] = _0x2edb2f['ratio']), _0x2d39d6);
  return (
    _0x2edb2f['firstFrameImage'] && (_0x2d39d6['first_frame_image'] = _0x2edb2f['firstFrameImage']),
    _0x2edb2f['lastFrameImage'] && (_0x2d39d6['last_frame_image'] = _0x2edb2f['lastFrameImage']),
    delete _0x2d39d6['aspect_ratio'],
    _0x2d39d6
  );
}
export function apimartViduQ3Video({
  currentBody: _0x3016b9,
  inputImages: inputImages = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  modelToken: modelToken = '',
}) {
  const _0x1322e3 = { ..._0x3016b9 },
    _0x1e397d = String(_0x1322e3['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!_0x1e397d) throw new Error('APIMart\x20Vidu\x20Q3\x20prompt\x20is\x20required');
  _0x1322e3['prompt'] = _0x1e397d;
  const _0x1b7fdc = String(
      payload?.['generationParams']?.['vidu_q3_generation_mode'] ||
        payload?.['vidu_q3_generation_mode'] ||
        'video',
    )
      ['trim']()
      ['toLowerCase'](),
    _0x17dbfe = String(modelToken || _0x1322e3['model'] || 'viduq3-turbo')
      ['trim']()
      ['toLowerCase'](),
    _0x215601 = normalizeInputList(inputImages),
    _0xd6298b = normalizeInputUrlsBySlot(payload?.['inputUrlsBySlot']),
    _0x172f43 = Math['max'](
      _0x215601['length'],
      normalizeInputList(payload?.['inputUrls'])['length'],
      normalizeInputList(payload?.['images'])['length'],
      Object['keys'](_0xd6298b)['length'],
    );
  if (_0x1b7fdc === 'reference') {
    if (!VIDU_Q3_REFERENCE_MODELS['has'](_0x17dbfe))
      throw new Error(
        'APIMart\x20Vidu\x20Q3\x20reference\x20mode\x20only\x20supports\x20viduq3\x20or\x20viduq3-mix',
      );
    if (_0x215601['length'] < 0x1 || _0x172f43 > 0x7)
      throw new Error('APIMart Vidu Q3 reference mode requires 1-7 image inputs');
    return (
      (_0x1322e3['model'] = _0x17dbfe),
      (_0x1322e3['image_urls'] = _0x215601['slice'](0x0, 0x7)),
      delete _0x1322e3['audio'],
      _0x1322e3
    );
  }
  if (!VIDU_Q3_VIDEO_MODELS['has'](_0x17dbfe))
    throw new Error('APIMart Vidu Q3 video generation mode only supports viduq3-turbo or viduq3-pro');
  if (_0x172f43 > 0x2)
    throw new Error('APIMart Vidu Q3 video generation mode supports at most 2 image inputs');
  return (
    (_0x1322e3['model'] = _0x17dbfe),
    _0x215601['length'] > 0x0
      ? ((_0x1322e3['image_urls'] = _0x215601['slice'](0x0, 0x2)), delete _0x1322e3['aspect_ratio'])
      : delete _0x1322e3['image_urls'],
    _0x1322e3
  );
}
export function apimartWan27Video({ currentBody: _0x49c0ab, payload: payload = {} }) {
  const _0x200bed = { ..._0x49c0ab },
    _0x16b17f = normalizeInputList(_0x200bed['image_urls']),
    _0x50058a = normalizeInputList(_0x200bed['video_urls']),
    _0x128ae0 = isPresentValue(_0x200bed['audio_url']) ? String(_0x200bed['audio_url'] || '')['trim']() : '',
    _0x4fcf29 = !!_0x128ae0,
    _0x3881ad = String(payload?.['generationParams']?.['wan27_mode'] || payload?.['wan27_mode'] || 'image')
      ['trim']()
      ['toLowerCase']();
  (delete _0x200bed['wan27_mode'],
    delete _0x200bed['wan27_reference_input'],
    delete _0x200bed['wan27_edit_input']);
  if (_0x3881ad === 'reference') {
    _0x200bed['model'] = 'wan2.7-r2v';
    const _0x21605c = _0x16b17f['slice'](0x0, 0x1),
      _0x5e840e = _0x50058a['slice'](0x0, Math['max'](0x0, 0x5 - _0x21605c['length']));
    if (_0x21605c['length'] <= 0x0 && _0x5e840e['length'] <= 0x0)
      throw new Error('APIMart Wan2.7-R2V requires image_with_roles or video_urls input');
    return (
      _0x21605c['length'] > 0x0
        ? (_0x200bed['image_with_roles'] = _0x21605c['map']((_0x219ca9, _0x4eba36) => ({
            url: _0x219ca9,
            role: 'reference_image',
            ...(_0x4eba36 === 0x0 && _0x128ae0 ? { reference_voice: _0x128ae0 } : {}),
          })))
        : delete _0x200bed['image_with_roles'],
      _0x5e840e['length'] > 0x0 ? (_0x200bed['video_urls'] = _0x5e840e) : delete _0x200bed['video_urls'],
      delete _0x200bed['image_urls'],
      delete _0x200bed['audio_url'],
      _0x200bed
    );
  }
  if (_0x3881ad === 'edit') {
    _0x200bed['model'] = 'wan2.7-videoedit';
    if (!_0x50058a[0x0]) throw new Error('APIMart Wan2.7-VideoEdit requires video_urls input');
    _0x200bed['video_urls'] = _0x50058a['slice'](0x0, 0x2);
    if (_0x16b17f['length'] > 0x0) _0x200bed['image_urls'] = _0x16b17f['slice'](0x0, 0x4);
    else delete _0x200bed['image_urls'];
    return (delete _0x200bed['audio_url'], _0x200bed);
  }
  _0x200bed['model'] = 'wan2.7';
  if (_0x16b17f['length'] > 0x0 && _0x50058a['length'] > 0x0)
    throw new Error('APIMart Wan2.7 image_urls cannot be used with video_urls');
  if (_0x50058a['length'] > 0x0 && _0x4fcf29)
    throw new Error('APIMart Wan2.7 video_urls cannot be used with audio_url');
  return ((_0x16b17f['length'] > 0x0 || _0x50058a['length'] > 0x0) && delete _0x200bed['size'], _0x200bed);
}
function normalizeKlingV3OmniMode(_0x59cdb2) {
  const _0x47c4ab = String(_0x59cdb2 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x47c4ab === 'reference' || _0x47c4ab === 'edit' ? _0x47c4ab : 'image';
}
function buildKlingV3OmniVideoItem(_0x41a5f9, _0x379bb0, _0x4cdff3 = ![]) {
  return {
    video_url: _0x41a5f9,
    refer_type: _0x379bb0,
    keep_original_sound: normalizeKlingKeepOriginalSound(_0x4cdff3) ? 'yes' : 'no',
  };
}
function normalizeKlingO1VideoRole(_0x17b950) {
  const _0x38cc24 = String(_0x17b950 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x38cc24 === 'feature' || _0x38cc24 === 'feature_reference') return 'feature';
  return _0x38cc24 === 'base' || _0x38cc24 === 'edit' ? 'base' : '';
}
export function apimartKlingO1Video({
  currentBody: _0x507ce8,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
}) {
  const _0x3c2577 = { ..._0x507ce8 },
    _0x165534 = normalizeInputList(inputImages)['slice'](0x0, 0x2),
    _0x187fa7 = normalizeInputList(inputVideos)['slice'](0x0, 0x1),
    _0x32c96b = normalizeKlingO1VideoRole(
      payload?.['klingO1VideoRole'] ||
        payload?.['kling_o1_video_role'] ||
        payload?.['generationParams']?.['kling_o1_video_role'],
    ),
    _0x12844e = normalizeKlingKeepOriginalSound(
      _0x3c2577['keep_original_sound'] ??
        payload?.['generationParams']?.['keep_original_sound'] ??
        payload?.['keep_original_sound'],
    );
  (delete _0x3c2577['kling_o1_video_role'],
    delete _0x3c2577['klingO1VideoRole'],
    delete _0x3c2577['keep_original_sound'],
    delete _0x3c2577['video_list']);
  if (_0x187fa7['length'] > 0x0) {
    const _0x406f90 = _0x32c96b || 'base';
    _0x3c2577['video_list'] = [buildKlingV3OmniVideoItem(_0x187fa7[0x0], _0x406f90, _0x12844e)];
    if (_0x406f90 === 'base') {
      if (_0x165534['length'] > 0x0)
        throw new Error('APIMart Kling O1 base video cannot be used with image_urls');
      return (
        delete _0x3c2577['image_urls'],
        delete _0x3c2577['duration'],
        delete _0x3c2577['aspect_ratio'],
        (_0x3c2577['prompt'] = replaceKlingO1PromptImageReferences(_0x3c2577['prompt'], 0x0)),
        _0x3c2577
      );
    }
    if (_0x165534['length'] > 0x1)
      throw new Error('APIMart Kling O1 feature video supports at most one image_url');
    return (
      _0x165534['length'] > 0x0
        ? (_0x3c2577['image_urls'] = _0x165534['slice'](0x0, 0x1))
        : delete _0x3c2577['image_urls'],
      (_0x3c2577['prompt'] = replaceKlingO1PromptImageReferences(
        _0x3c2577['prompt'],
        _0x3c2577['image_urls']?.['length'] || 0x0,
      )),
      _0x3c2577
    );
  }
  return (
    _0x165534['length'] > 0x0 ? (_0x3c2577['image_urls'] = _0x165534) : delete _0x3c2577['image_urls'],
    (_0x3c2577['prompt'] = replaceKlingO1PromptImageReferences(
      _0x3c2577['prompt'],
      _0x3c2577['image_urls']?.['length'] || 0x0,
    )),
    _0x3c2577
  );
}
export function apimartKlingV3OmniVideo({
  currentBody: _0x108cbb,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x476640 = { ..._0x108cbb },
    _0x20c6b6 = normalizeInputList(inputImages),
    _0x4e073e = normalizeInputList(inputVideos),
    _0x33eac9 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x4a05e0 = normalizeKlingV3OmniMode(
      payload?.['generationParams']?.['kling_v3_omni_mode'] || payload?.['kling_v3_omni_mode'] || 'image',
    );
  (delete _0x476640['kling_v3_omni_mode'],
    delete _0x476640['image_with_roles'],
    delete _0x476640['video_list']);
  if (_0x4a05e0 === 'edit') {
    if (!_0x4e073e[0x0]) throw new Error('APIMart Kling V3 Omni video edit requires video_list input');
    return (
      (_0x476640['video_list'] = [buildKlingV3OmniVideoItem(_0x4e073e[0x0], 'base')]),
      delete _0x476640['image_urls'],
      delete _0x476640['image_with_roles'],
      delete _0x476640['audio'],
      delete _0x476640['duration'],
      delete _0x476640['aspect_ratio'],
      _0x476640
    );
  }
  if (_0x4a05e0 === 'reference') {
    const _0x7d9fc5 = [];
    (appendUniqueUrl(_0x7d9fc5, _0x33eac9['referenceImage']),
      _0x20c6b6['forEach']((_0x39936b) => appendUniqueUrl(_0x7d9fc5, _0x39936b)));
    const _0x1f8af0 = _0x7d9fc5['slice'](0x0, 0x1),
      _0x1c16fd = _0x4e073e[0x0] || '';
    if (_0x1f8af0['length'] <= 0x0 && !_0x1c16fd)
      throw new Error('APIMart Kling V3 Omni reference mode requires image or video input');
    return (
      _0x1f8af0['length'] > 0x0
        ? (_0x476640['image_with_roles'] = _0x1f8af0['map']((_0x4b43af) => ({
            url: _0x4b43af,
            role: 'reference',
          })))
        : delete _0x476640['image_with_roles'],
      _0x1c16fd
        ? ((_0x476640['video_list'] = [buildKlingV3OmniVideoItem(_0x1c16fd, 'feature')]),
          delete _0x476640['audio'])
        : delete _0x476640['video_list'],
      delete _0x476640['image_urls'],
      _0x476640
    );
  }
  if (_0x4e073e['length'] > 0x0)
    throw new Error(
      'APIMart\x20Kling\x20V3\x20Omni\x20image\x20mode\x20does\x20not\x20support\x20video_list\x20input',
    );
  const _0x5ed2ae =
      Object['prototype']['hasOwnProperty']['call'](_0x33eac9, 'firstFrame') ||
      Object['prototype']['hasOwnProperty']['call'](_0x33eac9, 'lastFrame'),
    _0x4eaaa0 = _0x5ed2ae ? _0x33eac9['firstFrame'] || '' : _0x20c6b6[0x0] || '',
    _0x3f876d = _0x5ed2ae
      ? _0x33eac9['lastFrame'] || ''
      : _0x20c6b6['find']((_0x3f55bc) => _0x3f55bc && _0x3f55bc !== _0x4eaaa0) || '';
  if (!_0x4eaaa0 && _0x3f876d) throw new Error('APIMart Kling V3 Omni last_frame requires first_frame input');
  const _0x360cda = [];
  return (
    _0x4eaaa0 && _0x360cda['push']({ url: _0x4eaaa0, role: 'first_frame' }),
    _0x3f876d && _0x360cda['push']({ url: _0x3f876d, role: 'last_frame' }),
    _0x360cda['length'] > 0x0
      ? ((_0x476640['image_with_roles'] = _0x360cda), delete _0x476640['image_urls'])
      : delete _0x476640['image_urls'],
    _0x476640
  );
}
function normalizeSeedanceVideoSize(_0x3309e8) {
  const _0x5c71e8 = String(_0x3309e8 || '')['trim']();
  if (!_0x5c71e8) return '16:9';
  if (isSeedanceAdaptiveRatio(_0x5c71e8)) return 'adaptive';
  return normalizeRatioLabelText(_0x5c71e8);
}
function normalizeSeedanceAspectRatio(_0x34a60c) {
  return normalizeSeedanceVideoSize(_0x34a60c || '16:9');
}
function readSeedanceVideoParam(_0x216346, ..._0x46955f) {
  const _0x175bcb = [_0x216346, _0x216346?.['generationParams']];
  for (const _0xb8f85 of _0x175bcb) {
    if (!_0xb8f85 || typeof _0xb8f85 !== 'object' || Array['isArray'](_0xb8f85)) continue;
    for (const _0x4fc189 of _0x46955f) {
      if (Object['prototype']['hasOwnProperty']['call'](_0xb8f85, _0x4fc189)) return _0xb8f85[_0x4fc189];
    }
  }
  return undefined;
}
function isSeedanceAdaptiveRatio(_0x3893a3) {
  const _0x282dda = String(_0x3893a3 ?? '')
    ['trim']()
    ['toLowerCase']();
  return ['自适应', 'adaptive', 'auto', 'default']['includes'](_0x282dda);
}
function normalizeSeedanceBoolean(_0x4d8e60, _0x3b46e6 = ![]) {
  if (typeof _0x4d8e60 === 'boolean') return _0x4d8e60;
  if (typeof _0x4d8e60 === 'number') return _0x4d8e60 !== 0x0;
  const _0x182094 = String(_0x4d8e60 ?? '')
    ['trim']()
    ['toLowerCase']();
  if (['true', '1', 'yes', 'on']['includes'](_0x182094)) return !![];
  if (['false', '0', 'no', 'off']['includes'](_0x182094)) return ![];
  return _0x3b46e6 === !![];
}
function normalizeSeedanceVideoDuration(_0x54c996, _0x94ce4 = {}) {
  const _0x178294 = Number(_0x94ce4['defaultDuration'] ?? 0x5),
    _0x51e783 = Number['isFinite'](_0x178294) ? Math['trunc'](_0x178294) : 0x5,
    _0x3dc3b1 = Number(_0x54c996 ?? _0x51e783);
  if (!Number['isFinite'](_0x3dc3b1)) return _0x51e783;
  const _0x378432 = Math['trunc'](_0x3dc3b1);
  if (_0x94ce4['allowAutoDuration'] === !![] && _0x378432 === -0x1) return -0x1;
  const _0x173655 = Number(_0x94ce4['minDuration']),
    _0x5c1802 = Number(_0x94ce4['maxDuration']);
  if (Number['isFinite'](_0x173655) && _0x378432 < _0x173655)
    throw new Error('APIMart Seedance duration must be at least ' + _0x173655 + '\x20seconds');
  if (Number['isFinite'](_0x5c1802) && _0x378432 > _0x5c1802)
    throw new Error('APIMart Seedance duration must be at most ' + _0x5c1802 + ' seconds');
  return _0x378432;
}
function normalizeSeedanceVideoResolution(_0x4482ce, _0x17e523 = {}) {
  const _0x89019e = String(_0x17e523['defaultResolution'] || '720p')
      ['trim']()
      ['toLowerCase'](),
    _0x4038d3 = String(_0x4482ce || _0x89019e)
      ['trim']()
      ['toLowerCase'](),
    _0x2e2c77 = Array['isArray'](_0x17e523['allowedResolutions'])
      ? _0x17e523['allowedResolutions']
          ['map']((_0x45705f) =>
            String(_0x45705f || '')
              ['trim']()
              ['toLowerCase'](),
          )
          ['filter'](Boolean)
      : [];
  if (_0x2e2c77['length'] === 0x0) return _0x4038d3 || _0x89019e;
  if (_0x2e2c77['includes'](_0x4038d3)) return _0x4038d3;
  return _0x2e2c77['includes'](_0x89019e) ? _0x89019e : _0x2e2c77[0x0];
}
function getApimartSeedanceVideoPolicy(_0x220bd9) {
  const _0x76db60 = _0x220bd9?.['extensions']?.['seedanceVideo'];
  return _0x76db60 && typeof _0x76db60 === 'object' && !Array['isArray'](_0x76db60) ? _0x76db60 : {};
}
function collectVideoInputUrls(_0x13247b) {
  return Array['from'](
    new Set(
      [
        String(_0x13247b['videoUrl'] || '')['trim'](),
        ...normalizeInputList(_0x13247b['videos']),
        ...normalizeInputList(_0x13247b['videoUrls']),
      ]['filter'](Boolean),
    ),
  );
}
function collectAudioInputUrls(_0x289149) {
  return Array['from'](
    new Set(
      [
        String(_0x289149['audioUrl'] || '')['trim'](),
        ...normalizeInputList(_0x289149['audios']),
        ...normalizeInputList(_0x289149['audioUrls']),
      ]['filter'](Boolean),
    ),
  );
}
async function resolveInputVideos(_0x256cbb, _0x3e71ec) {
  if (_0x256cbb['length'] === 0x0) return [];
  const _0x46fc8c = await uploadModelApiMediaInputs('video', _0x256cbb, _0x3e71ec, {
    fallbackProvider: 'runninghub',
    strictUpload: !![],
  });
  if (!Array['isArray'](_0x46fc8c) || _0x46fc8c['length'] === 0x0)
    throw new Error('APIMART 视频上传失败：未返回有效视频地址，请重试或重新选择视频');
  return _0x46fc8c['map']((_0x3489a7) => String(_0x3489a7 || '')['trim']())['filter'](Boolean);
}
async function resolveInputAudios(_0x18ae5e, _0x452de6) {
  if (_0x18ae5e['length'] === 0x0) return [];
  const _0x4e2589 = await uploadModelApiMediaInputs('audio', _0x18ae5e, _0x452de6, {
    fallbackProvider: 'runninghub',
    strictUpload: !![],
  });
  if (!Array['isArray'](_0x4e2589) || _0x4e2589['length'] === 0x0)
    throw new Error('APIMART 音频上传失败：未返回有效音频地址，请重试或重新选择音频');
  return _0x4e2589['map']((_0xa0dc67) => String(_0xa0dc67 || '')['trim']())['filter'](Boolean);
}
export async function apimartSeedanceVideo({
  payload: _0x5da25f,
  finalPrompt: _0x401d71,
  modelToken: _0xe5085e,
  apiKey: _0x27cc29,
  ctx: _0x3674d5,
  executionManifest: _0x4a022c,
}) {
  const _0x44ff64 = _0xe5085e || stripPrefix(_0x5da25f['model'], 'apimart/'),
    _0x508f76 = getApimartSeedanceVideoPolicy(_0x4a022c),
    _0x4d05a0 = supportsApimartPrivateAvatarAssets(_0x44ff64, _0x508f76),
    _0x20f874 = _0x508f76['supportsVideoReferences'] === !![],
    _0x17eb13 = _0x508f76['supportsAudioReferences'] === !![],
    _0xe08eab = applyApimartPrivateAvatarAssetsToUrls(collectVideoInputUrls(_0x5da25f), _0x5da25f, {
      sourceKind: 'video',
      enabled: _0x4d05a0,
    });
  if (!_0x20f874 && _0xe08eab['length'] > 0x0)
    throw new Error('APIMart Seedance model does not support video references');
  const _0x4dc96f =
      _0xe08eab['length'] > 0x0 && _0x20f874 ? await resolveInputVideos(_0xe08eab, _0x3674d5) : [],
    _0x2996d8 = applyApimartPrivateAvatarAssetsToUrls(
      [
        String(_0x5da25f['first'] || _0x5da25f['firstFrameUrl'] || '')['trim'](),
        String(_0x5da25f['last'] || _0x5da25f['lastFrameUrl'] || '')['trim'](),
      ]['filter'](Boolean),
      _0x5da25f,
      { sourceKind: 'image', enabled: _0x4d05a0 },
    ),
    _0x2674c7 = normalizePositiveInteger(_0x508f76['maxRoleImageCount'], 0x2);
  if (_0x2996d8['length'] > _0x2674c7)
    throw new Error(
      _0x508f76['roleImageLimitError'] ||
        'APIMart\x20Seedance\x20model\x20does\x20not\x20support\x20this\x20many\x20role\x20images',
    );
  let _0x2b6dac = [];
  if (_0x2996d8['length'] > 0x0) {
    const _0x18d15b = await uploadModelApiMediaInputs('image', _0x2996d8, _0x3674d5, {
      apiKey: _0x27cc29,
      fallbackProvider: 'apimart',
      uploadOptions: { applyInputQualityProfile: !![] },
      strictUpload: !![],
    });
    _0x2b6dac = [
      _0x18d15b?.[0x0] ? { url: String(_0x18d15b[0x0])['trim'](), role: 'first_frame' } : null,
      _0x18d15b?.[0x1] ? { url: String(_0x18d15b[0x1])['trim'](), role: 'last_frame' } : null,
    ]['filter'](Boolean);
  }
  const _0x18285f = Array['isArray'](_0x5da25f['images'])
      ? _0x5da25f['images']
      : Array['isArray'](_0x5da25f['inputUrls'])
        ? _0x5da25f['inputUrls']
        : [],
    _0x11bd0d = applyApimartPrivateAvatarAssetsToUrls(_0x18285f, _0x5da25f, {
      sourceKind: 'image',
      enabled: _0x4d05a0,
    }),
    _0x17297f = new Set(_0x2996d8),
    _0x1900d1 =
      _0x2b6dac['length'] > 0x0 && _0x508f76['combineRoleAndReferenceImages'] === !![]
        ? _0x11bd0d['filter']((_0x3cabf3) => !_0x17297f['has'](_0x3cabf3))
        : _0x11bd0d,
    _0x171012 =
      _0x1900d1['length'] > 0x0 &&
      (_0x2b6dac['length'] <= 0x0 || _0x508f76['combineRoleAndReferenceImages'] === !![])
        ? await uploadModelApiMediaInputs('image', _0x1900d1, _0x3674d5, {
            apiKey: _0x27cc29,
            fallbackProvider: 'apimart',
            uploadOptions: { applyInputQualityProfile: !![] },
            strictUpload: !![],
          })
        : [],
    _0x2f1541 = applyApimartPrivateAvatarAssetsToUrls(collectAudioInputUrls(_0x5da25f), _0x5da25f, {
      sourceKind: 'audio',
      enabled: _0x4d05a0,
    });
  if (!_0x17eb13 && _0x2f1541['length'] > 0x0)
    throw new Error('APIMart Seedance model does not support audio references');
  const _0x1d0303 =
      _0x17eb13 && _0x2f1541['length'] > 0x0 ? await resolveInputAudios(_0x2f1541, _0x3674d5) : [],
    _0x50d99d = readSeedanceVideoParam(_0x5da25f, 'duration'),
    _0x298d8d = readSeedanceVideoParam(_0x5da25f, 'resolution'),
    _0x524de9 = readSeedanceVideoParam(_0x5da25f, 'aspectRatio', 'size', 'aspect_ratio'),
    _0x54cab4 =
      _0x508f76['preserveAdaptiveRatio'] === !![] && isSeedanceAdaptiveRatio(_0x524de9)
        ? _0x524de9
        : _0x5da25f['resolvedRatioLabel'] || _0x524de9,
    _0x216f9a = {
      model: _0x44ff64,
      prompt: _0x401d71,
      duration: normalizeSeedanceVideoDuration(_0x50d99d, _0x508f76),
      resolution: normalizeSeedanceVideoResolution(_0x298d8d, _0x508f76),
    };
  _0x508f76['ratioField'] === 'size'
    ? (_0x216f9a['size'] = normalizeSeedanceVideoSize(_0x54cab4 || _0x508f76['defaultRatio']))
    : (_0x216f9a['aspect_ratio'] = normalizeSeedanceAspectRatio(_0x54cab4 || _0x508f76['defaultRatio']));
  const _0x155d68 = normalizeOptionalIntegerInRange(readSeedanceVideoParam(_0x5da25f, 'seed'), {
    min: 0x0,
    max: 0x7fffffff,
  });
  if (_0x155d68 !== null) _0x216f9a['seed'] = _0x155d68;
  if (_0x508f76['supportsGenerateAudioParam'] === !![]) {
    const _0x5e12f7 = readSeedanceVideoParam(_0x5da25f, 'generateAudio', 'generate_audio', 'audio'),
      _0x7ce2ee = normalizeSeedanceBoolean(_0x5e12f7, _0x508f76['generateAudioDefault'] === !![]);
    if (_0x7ce2ee || _0x508f76['emitGenerateAudioBoolean'] === !![]) {
      const _0x1f6ce9 = String(_0x508f76['generateAudioField'] || 'audio')['trim']();
      _0x216f9a[_0x1f6ce9 || 'audio'] = _0x7ce2ee;
    }
  }
  _0x508f76['supportsWatermarkParam'] === !![] &&
    (_0x216f9a['watermark'] = normalizeSeedanceBoolean(readSeedanceVideoParam(_0x5da25f, 'watermark'), ![]));
  if (_0x508f76['supportsOutputFormatParam'] === !![]) {
    const _0x3275c4 = String(readSeedanceVideoParam(_0x5da25f, 'outputFormat', 'output_format') || 'mp4')
      ['trim']()
      ['toLowerCase']();
    _0x216f9a['output_format'] = ['mp4', 'mov']['includes'](_0x3275c4) ? _0x3275c4 : 'mp4';
  }
  _0x508f76['supportsWebSearchParam'] === !![] &&
    normalizeSeedanceBoolean(readSeedanceVideoParam(_0x5da25f, 'webSearch'), ![]) &&
    (_0x216f9a['tools'] = [{ type: 'web_search' }]);
  _0x508f76['supportsCameraFixedParam'] === !![] &&
    normalizeSeedanceBoolean(readSeedanceVideoParam(_0x5da25f, 'camerafixed', 'cameraFixed'), ![]) &&
    (_0x216f9a['camerafixed'] = !![]);
  const _0xf9d58e = normalizePositiveInteger(_0x508f76['maxImageCount'], 0x1);
  if (_0x2b6dac['length'] > 0x0) {
    const _0x4a7465 = _0x508f76['allowRoleImagesWithMedia'] === !![],
      _0x3817ae = _0x4dc96f['length'] > 0x0 || _0x1d0303['length'] > 0x0,
      _0xf7adab =
        _0x4a7465 && _0x3817ae
          ? _0x2b6dac['map']((_0x454afb) => ({ ..._0x454afb, role: 'reference_image' }))
          : _0x2b6dac,
      _0x5ddd8c = new Set(_0xf7adab['map']((_0x339810) => String(_0x339810?.['url'] || '')['trim']()));
    _0x216f9a['image_with_roles'] = [
      ..._0xf7adab,
      ...(_0x508f76['combineRoleAndReferenceImages'] === !![]
        ? _0x171012['filter']((_0x2b83e5) => !_0x5ddd8c['has'](String(_0x2b83e5 || '')['trim']()))['map'](
            (_0x18948c) => ({ url: _0x18948c, role: 'reference_image' }),
          )
        : []),
    ]['slice'](0x0, _0xf9d58e);
    const _0x259fe1 = _0x216f9a['image_with_roles']['some'](
      (_0x105979) => _0x105979['role'] === 'first_frame' || _0x105979['role'] === 'last_frame',
    );
    if (_0x259fe1 && _0x508f76['roleImagesRequireAdaptiveRatio'] === !![]) {
      const _0x2c2322 = _0x508f76['ratioField'] === 'size' ? 'size' : 'aspect_ratio';
      _0x216f9a[_0x2c2322] = 'adaptive';
    }
  } else _0x171012['length'] > 0x0 && (_0x216f9a['image_urls'] = _0x171012['slice'](0x0, _0xf9d58e));
  const _0x3ca608 = _0x2b6dac['length'] > 0x0 && _0x508f76['allowRoleImagesWithMedia'] !== !![];
  return (
    _0x20f874 &&
      !_0x3ca608 &&
      _0x4dc96f['length'] > 0x0 &&
      (_0x216f9a['video_urls'] = _0x4dc96f['slice'](
        0x0,
        normalizePositiveInteger(_0x508f76['maxVideoReferenceCount'], 0x3),
      )),
    _0x17eb13 &&
      !_0x3ca608 &&
      _0x1d0303['length'] > 0x0 &&
      (_0x216f9a['audio_urls'] = _0x1d0303['slice'](
        0x0,
        normalizePositiveInteger(_0x508f76['maxAudioReferenceCount'], 0x3),
      )),
    _0x216f9a
  );
}
