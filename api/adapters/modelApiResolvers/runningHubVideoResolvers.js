import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeKlingKeepOriginalSound,
  normalizeOptionalIntegerInRange,
  replaceKlingO1PromptImageReferences,
} from './sharedResolverUtils.js';
const RUNNINGHUB_HAPPYHORSE_ENDPOINTS = Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit',
  }),
  RUNNINGHUB_HAPPYHORSE_11_ENDPOINTS = Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/reference-to-video',
  });
function normalizeHappyHorseGenerationMode(_0x4ff33e) {
  const _0x3eab77 = String(_0x4ff33e || '')
    ['trim']()
    ['toLowerCase']();
  return _0x3eab77 === 'image' || _0x3eab77 === 'reference' || _0x3eab77 === 'edit' ? _0x3eab77 : 'auto';
}
function getRunningHubHappyHorseMode(_0x4c2a90 = {}, _0x1319d9 = {}) {
  return normalizeHappyHorseGenerationMode(
    _0x1319d9['happyhorse_mode'] ||
      _0x4c2a90?.['generationParams']?.['happyhorse_mode'] ||
      _0x4c2a90?.['happyhorse_mode'],
  );
}
function isRunningHubHappyHorse11Model(
  _0x383027 = {},
  _0x58c57c = {},
  _0x1fafc7 = '',
  _0x405bb5 = {},
  _0x4e5513 = {},
) {
  const _0xadda84 = String(
    _0x405bb5?.['id'] ||
      _0x4e5513?.['modelId'] ||
      _0x1fafc7 ||
      _0x383027?.['model'] ||
      _0x383027?.['generationParams']?.['model'] ||
      _0x58c57c?.['model'] ||
      '',
  )
    ['trim']()
    ['toLowerCase']();
  return _0xadda84['includes']('happyhorse-1.1') || _0xadda84['includes']('happyhorse-1-1');
}
function normalizeRunningHubHappyHorseAudioSettingValue(_0x24296d) {
  const _0x3cd75a = String(_0x24296d || '')
    ['trim']()
    ['toLowerCase']();
  return _0x3cd75a === 'origin' ? 'origin' : 'auto';
}
export function runninghubHappyHorseVideo({
  currentBody: _0xe2f733,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const _0x2bd153 = { ..._0xe2f733 },
    _0x1a70fb = isRunningHubHappyHorse11Model(
      payload,
      _0xe2f733,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    _0x4f5160 = String(_0x2bd153['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!_0x4f5160) throw new Error('RunningHub\x20HappyHorse\x201.0\x20prompt\x20is\x20required');
  const _0xe8f871 = normalizeInputList(inputImages),
    _0x490790 = normalizeInputList(inputVideos),
    _0x4547c4 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x496c99 = (_0x25015f = [], _0x19cd55 = []) => {
      const _0x3ba8e9 = [],
        _0x4a8e9d = (_0x30fc79) => {
          const _0x55cf5e = String(_0x30fc79 || '')['trim']();
          if (_0x55cf5e && !_0x3ba8e9['includes'](_0x55cf5e)) _0x3ba8e9['push'](_0x55cf5e);
        };
      return (
        _0x25015f['forEach']((_0x2cadb8) => _0x4a8e9d(_0x4547c4[_0x2cadb8])),
        normalizeInputList(_0x19cd55)['forEach'](_0x4a8e9d),
        _0x3ba8e9
      );
    };
  let _0x2f4210 = getRunningHubHappyHorseMode(payload, _0x2bd153);
  const _0x302a7e =
    _0xe8f871['length'] > 0x0 || _0x490790['length'] > 0x0 || Object['keys'](_0x4547c4)['length'] > 0x0;
  _0x2f4210 !== 'auto' && !_0x302a7e && (_0x2f4210 = 'auto');
  _0x2bd153['prompt'] = _0x4f5160;
  const _0x1316af = normalizeOptionalIntegerInRange(_0x2bd153['seed'], { min: 0x0, max: 0x7fffffff });
  if (_0x1316af === null) delete _0x2bd153['seed'];
  else _0x2bd153['seed'] = _0x1316af;
  (delete _0x2bd153['happyhorse_mode'],
    delete _0x2bd153['imageUrl'],
    delete _0x2bd153['imageUrls'],
    delete _0x2bd153['videoUrl']);
  if (_0x1a70fb && _0x490790['length'] > 0x0)
    throw new Error('RunningHub HappyHorse 1.1 does not support video edit mode');
  if (_0x2f4210 === 'edit') {
    if (_0x1a70fb) throw new Error('RunningHub HappyHorse 1.1 does not support video edit mode');
    if (!_0x490790[0x0]) throw new Error('RunningHub HappyHorse 1.0 video edit requires videoUrl input');
    const _0x51358b = _0x496c99(['editRefImage'], _0xe8f871);
    _0x2bd153['videoUrl'] = _0x490790[0x0];
    if (_0x51358b['length'] > 0x0) _0x2bd153['imageUrls'] = _0x51358b['slice'](0x0, 0x5);
    return (
      (_0x2bd153['audioSetting'] = normalizeRunningHubHappyHorseAudioSettingValue(
        _0x2bd153['audioSetting'] ??
          payload?.['generationParams']?.['audioSetting'] ??
          payload?.['generationParams']?.['audio_setting'] ??
          payload?.['audioSetting'] ??
          payload?.['audio_setting'],
      )),
      delete _0x2bd153['aspectRatio'],
      delete _0x2bd153['duration'],
      delete _0x2bd153['imageUrl'],
      _0x2bd153
    );
  }
  delete _0x2bd153['audioSetting'];
  if (_0x2f4210 === 'image') {
    const _0x1f6dac = _0x496c99(['firstFrame'], _0xe8f871);
    if (!_0x1f6dac[0x0]) throw new Error('RunningHub HappyHorse 1.0 image-to-video requires imageUrl input');
    return (
      (_0x2bd153['imageUrl'] = _0x1f6dac[0x0]),
      delete _0x2bd153['imageUrls'],
      delete _0x2bd153['videoUrl'],
      delete _0x2bd153['aspectRatio'],
      _0x2bd153
    );
  }
  if (_0x2f4210 === 'reference') {
    const _0x519bd3 = _0x496c99(['referenceImage'], _0xe8f871);
    if (_0x519bd3['length'] <= 0x0)
      throw new Error('RunningHub HappyHorse 1.0 reference mode requires imageUrls input');
    return (
      (_0x2bd153['imageUrls'] = _0x519bd3['slice'](0x0, 0x9)),
      delete _0x2bd153['imageUrl'],
      delete _0x2bd153['videoUrl'],
      _0x2bd153
    );
  }
  if (_0xe8f871['length'] > 0x0 || _0x490790['length'] > 0x0)
    throw new Error('RunningHub HappyHorse 1.0 media inputs require an explicit mode selection');
  return (
    delete _0x2bd153['imageUrl'],
    delete _0x2bd153['imageUrls'],
    delete _0x2bd153['videoUrl'],
    _0x2bd153
  );
}
function hasRunningHubHappyHorseEndpointMedia({
  currentBody: currentBody = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
} = {}) {
  return (
    normalizeInputList(inputImages)['length'] > 0x0 ||
    normalizeInputList(inputVideos)['length'] > 0x0 ||
    Object['keys'](normalizeInputUrlsBySlot(finalUrlsBySlot))['length'] > 0x0 ||
    Boolean(String(currentBody?.['imageUrl'] || currentBody?.['videoUrl'] || '')['trim']()) ||
    normalizeInputList(currentBody?.['imageUrls'])['length'] > 0x0
  );
}
export function runninghubHappyHorseVideoEndpoint(_0x474b2d = {}) {
  const {
      payload: payload = {},
      currentBody: currentBody = {},
      modelToken: modelToken = '',
      executionManifest: executionManifest = {},
      modelManifest: modelManifest = {},
    } = _0x474b2d,
    _0x2d82d7 = isRunningHubHappyHorse11Model(
      payload,
      currentBody,
      modelToken,
      executionManifest,
      modelManifest,
    )
      ? RUNNINGHUB_HAPPYHORSE_11_ENDPOINTS
      : RUNNINGHUB_HAPPYHORSE_ENDPOINTS;
  let _0x5e2dca = getRunningHubHappyHorseMode(payload, currentBody);
  return (
    _0x5e2dca !== 'auto' && !hasRunningHubHappyHorseEndpointMedia(_0x474b2d) && (_0x5e2dca = 'auto'),
    _0x2d82d7[_0x5e2dca] || _0x2d82d7['text']
  );
}
const RUNNINGHUB_SEEDANCE_2_ENDPOINTS = Object['freeze']({
  mini: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/multimodal-video',
  }),
  fast: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video',
  }),
  standard: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/multimodal-video',
  }),
});
function normalizeRunningHubSeedance2Model(_0xce5bfc) {
  const _0x2284a7 = String(_0xce5bfc || '')
    ['trim']()
    ['toLowerCase']();
  return _0x2284a7 === 'standard' || _0x2284a7 === 'std' ? 'standard' : 'fast';
}
function normalizeRunningHubSeedance2Mode(_0x422ca6) {
  const _0x4a2fb9 = String(_0x422ca6 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x4a2fb9 === 'multimodal2video' || _0x4a2fb9 === 'reference') return 'multimodal2video';
  if (_0x4a2fb9 === 'frames2video' || _0x4a2fb9 === 'frames') return 'frames2video';
  if (_0x4a2fb9 === 'image2video' || _0x4a2fb9 === 'image' || _0x4a2fb9 === 'frame') return 'image2video';
  return 'text2video';
}
function getRunningHubSeedance2Model(
  _0x41883e = {},
  _0x356c37 = {},
  _0x201fd5 = '',
  _0x38df65 = {},
  _0x3aa176 = {},
) {
  const _0x2ab974 = String(_0x201fd5 || _0x41883e?.['model'] || _0x356c37?.['model'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x5c03d7 = String(_0x38df65?.['id'] || _0x3aa176?.['modelId'] || '')
      ['trim']()
      ['toLowerCase']();
  if (
    _0x2ab974['includes']('seedance-2.0-mini') ||
    _0x2ab974['includes']('sparkvideo-2.0-mini') ||
    _0x5c03d7['includes']('seedance-2-mini') ||
    _0x5c03d7['includes']('sparkvideo-2.0-mini')
  )
    return 'mini';
  return normalizeRunningHubSeedance2Model(
    _0x356c37['rh_seedance_2_model'] ||
      _0x41883e?.['generationParams']?.['rh_seedance_2_model'] ||
      _0x41883e?.['rh_seedance_2_model'],
  );
}
function getRunningHubSeedance2Mode(_0x25fae9 = {}, _0x45180d = {}) {
  return normalizeRunningHubSeedance2Mode(
    _0x45180d['rh_seedance_2_mode'] ||
      _0x25fae9?.['generationParams']?.['rh_seedance_2_mode'] ||
      _0x25fae9?.['rh_seedance_2_mode'],
  );
}
function collectRunningHubSeedance2SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const _0x21f706 = [],
    _0x21dc23 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x2ef48f = new Set(normalizeInputList(Object['values'](_0x21dc23)));
  return (
    slotIds['forEach']((_0x9d3d0d) => appendUniqueUrl(_0x21f706, _0x21dc23[_0x9d3d0d])),
    normalizeInputList(inputImages)['forEach']((_0x5464d7) => {
      if (!_0x2ef48f['has'](_0x5464d7)) appendUniqueUrl(_0x21f706, _0x5464d7);
    }),
    _0x21f706
  );
}
function collectRunningHubSeedance2FrameImages(_0x30d2a2 = {}) {
  return collectRunningHubSeedance2SlotImages({ ..._0x30d2a2, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubSeedance2ReferenceImages(_0x43353e = {}) {
  return collectRunningHubSeedance2SlotImages({ ..._0x43353e, slotIds: ['referenceImage'] });
}
function resolveRunningHubSeedance2Route({
  payload: payload = {},
  currentBody: currentBody = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
} = {}) {
  const _0x47164f = getRunningHubSeedance2Model(
      payload,
      currentBody,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    _0x1f4f35 = getRunningHubSeedance2Mode(payload, currentBody);
  if (_0x1f4f35 === 'multimodal2video') return Object['freeze']({ model: _0x47164f, route: 'reference' });
  if (_0x1f4f35 === 'image2video' || _0x1f4f35 === 'frames2video')
    return Object['freeze']({ model: _0x47164f, route: 'image' });
  return Object['freeze']({ model: _0x47164f, route: 'text' });
}
function removeRunningHubSeedance2TransientFields(_0x2458df) {
  (delete _0x2458df['rh_seedance_2_model'],
    delete _0x2458df['rh_seedance_2_mode'],
    delete _0x2458df['firstFrameUrl'],
    delete _0x2458df['lastFrameUrl'],
    delete _0x2458df['imageUrls'],
    delete _0x2458df['videoUrls'],
    delete _0x2458df['audioUrls']);
}
function normalizeRunningHubSeedance2ConversionSlots(_0x10b67b) {
  const _0x1c3d81 = Array['isArray'](_0x10b67b) ? _0x10b67b : ['all'],
    _0x48aa06 = _0x1c3d81['map']((_0x32fc44) => String(_0x32fc44 || '')['trim']())['filter'](Boolean);
  return _0x48aa06['length'] > 0x0 ? _0x48aa06 : ['all'];
}
export function runninghubSeedance2Video({
  currentBody: _0x1a810b,
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
  const _0x41fb73 = { ..._0x1a810b },
    _0x2a1011 = String(_0x41fb73['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!_0x2a1011) throw new Error('RunningHub\x20Seedance\x202.0\x20prompt\x20is\x20required');
  const _0x42c61b = getRunningHubSeedance2Mode(payload, _0x41fb73),
    _0xad7ead = collectRunningHubSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x5cef1a = collectRunningHubSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x4ff026 = normalizeInputList(inputVideos),
    _0x53a8e3 = normalizeInputList(inputAudios),
    _0x4d338a = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    _0x12c7af = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  _0x41fb73['prompt'] = _0x2a1011;
  const _0x1462ed = normalizeOptionalIntegerInRange(_0x41fb73['seed'], { min: -0x1, max: 0x7fffffff });
  if (_0x1462ed === null) delete _0x41fb73['seed'];
  else _0x41fb73['seed'] = _0x1462ed;
  removeRunningHubSeedance2TransientFields(_0x41fb73);
  if (_0x42c61b === 'multimodal2video') {
    if (_0x5cef1a['length'] + _0x4ff026['length'] <= 0x0)
      throw new Error('RunningHub Seedance 2.0 multimodal mode requires image or video input');
    if (_0x5cef1a['length'] > 0x9)
      throw new Error('RunningHub Seedance 2.0 multimodal mode supports at most 9 image inputs');
    if (_0x4d338a > 0x3)
      throw new Error(
        'RunningHub\x20Seedance\x202.0\x20multimodal\x20mode\x20supports\x20at\x20most\x203\x20video\x20inputs',
      );
    if (_0x12c7af > 0x3)
      throw new Error(
        'RunningHub\x20Seedance\x202.0\x20multimodal\x20mode\x20supports\x20at\x20most\x203\x20audio\x20inputs',
      );
    if (_0x53a8e3['length'] > 0x0 && _0x5cef1a['length'] + _0x4ff026['length'] <= 0x0)
      throw new Error('RunningHub Seedance 2.0 audio input requires image or video input');
    if (_0x5cef1a['length'] > 0x0) _0x41fb73['imageUrls'] = _0x5cef1a['slice'](0x0, 0x9);
    if (_0x4ff026['length'] > 0x0) _0x41fb73['videoUrls'] = _0x4ff026['slice'](0x0, 0x3);
    if (_0x53a8e3['length'] > 0x0) _0x41fb73['audioUrls'] = _0x53a8e3['slice'](0x0, 0x3);
    return (
      _0x41fb73['realPersonMode'] === !![]
        ? (_0x41fb73['conversionSlots'] = normalizeRunningHubSeedance2ConversionSlots(
            _0x41fb73['conversionSlots'],
          ))
        : delete _0x41fb73['conversionSlots'],
      delete _0x41fb73['webSearch'],
      _0x41fb73
    );
  }
  if (_0x4d338a > 0x0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept video input; use multimodal mode',
    );
  if (_0x12c7af > 0x0)
    throw new Error(
      'RunningHub Seedance 2.0 text/image/frame modes do not accept audio input; use multimodal mode',
    );
  if (_0x42c61b === 'text2video') {
    if (_0xad7ead['length'] > 0x0)
      throw new Error('RunningHub Seedance 2.0 text-to-video mode does not accept image input');
    return (delete _0x41fb73['realPersonMode'], delete _0x41fb73['conversionSlots'], _0x41fb73);
  }
  if (_0x42c61b === 'image2video' && _0xad7ead['length'] !== 0x1)
    throw new Error('RunningHub Seedance 2.0 image-to-video mode requires exactly 1 image input');
  if (_0x42c61b === 'frames2video' && _0xad7ead['length'] !== 0x2)
    throw new Error(
      'RunningHub\x20Seedance\x202.0\x20first-last-frame\x20mode\x20requires\x20exactly\x202\x20image\x20inputs',
    );
  _0x41fb73['firstFrameUrl'] = _0xad7ead[0x0];
  if (_0xad7ead[0x1]) _0x41fb73['lastFrameUrl'] = _0xad7ead[0x1];
  return (
    delete _0x41fb73['webSearch'],
    _0x41fb73['realPersonMode'] === !![]
      ? (_0x41fb73['conversionSlots'] = normalizeRunningHubSeedance2ConversionSlots(
          _0x41fb73['conversionSlots'],
        ))
      : delete _0x41fb73['conversionSlots'],
    _0x41fb73
  );
}
export function runninghubSeedance2VideoEndpoint({
  payload: payload = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const { model: _0x4bbfb9, route: _0x411866 } = resolveRunningHubSeedance2Route({
    payload: payload,
    currentBody: {},
    modelToken: modelToken || payload?.['model'] || '',
    executionManifest: executionManifest,
    modelManifest: modelManifest,
  });
  return (
    RUNNINGHUB_SEEDANCE_2_ENDPOINTS[_0x4bbfb9]?.[_0x411866] || RUNNINGHUB_SEEDANCE_2_ENDPOINTS['fast']['text']
  );
}
const RUNNINGHUB_KLING_O1_ENDPOINTS = Object['freeze']({
  text: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video',
  frames: 'https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end',
  reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video',
});
function normalizeRunningHubKlingO1GenerationMode(_0x253156) {
  const _0x5121c9 = String(_0x253156 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x5121c9 === 'reference' || _0x5121c9 === 'edit') return _0x5121c9;
  return 'frame';
}
function normalizeRunningHubKlingO1QualityMode(_0xe3f1c3) {
  const _0x57b33d = String(_0xe3f1c3 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x57b33d === 'pro' ? 'pro' : 'std';
}
function normalizeRunningHubKlingO1AspectRatio(_0x190a9e) {
  const _0x5e122e = String(_0x190a9e || '9:16')['trim']();
  return ['16:9', '9:16', '1:1']['includes'](_0x5e122e) ? _0x5e122e : '9:16';
}
function normalizeRunningHubKlingO1Duration(_0x2bd6a7) {
  const _0x419c9a = Number(_0x2bd6a7);
  return Number['isFinite'](_0x419c9a) && Math['trunc'](_0x419c9a) === 0xa ? '10' : '5';
}
function getRunningHubKlingO1GenerationMode(_0x305e20 = {}, _0x1c286b = {}) {
  return normalizeRunningHubKlingO1GenerationMode(
    _0x1c286b['rh_kling_o1_generation_mode'] ||
      _0x305e20?.['generationParams']?.['rh_kling_o1_generation_mode'] ||
      _0x305e20?.['rh_kling_o1_generation_mode'],
  );
}
function collectRunningHubKlingO1FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x1ea244 = [],
    _0x5576ed = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x1ea244, _0x5576ed['firstFrame']),
    appendUniqueUrl(_0x1ea244, _0x5576ed['lastFrame']),
    normalizeInputList(inputImages)['forEach']((_0x19c4ef) => appendUniqueUrl(_0x1ea244, _0x19c4ef)),
    _0x1ea244
  );
}
function collectRunningHubKlingO1ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x573bca = [],
    _0x3e723e = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x573bca, _0x3e723e['referenceImage']),
    normalizeInputList(inputImages)['forEach']((_0x18d790) => appendUniqueUrl(_0x573bca, _0x18d790)),
    _0x573bca
  );
}
function resolveRunningHubKlingO1Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x2364e8 = getRunningHubKlingO1GenerationMode(payload, currentBody);
  if (_0x2364e8 === 'reference') return 'reference';
  if (_0x2364e8 === 'edit') return 'edit';
  const _0x420525 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  })['length'];
  if (_0x420525 >= 0x2) return 'frames';
  if (_0x420525 === 0x1) return 'image';
  const _0x26ea6b = normalizeInputList(inputVideos)['length'];
  return _0x26ea6b > 0x0 ? 'reference' : 'text';
}
export function runninghubKlingO1Video({
  currentBody: _0xf2d185,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x50c909 = { ..._0xf2d185 },
    _0x5deff5 = getRunningHubKlingO1GenerationMode(payload, _0x50c909),
    _0x439526 = normalizeKlingKeepOriginalSound(
      payload?.['generationParams']?.['keepOriginalSound'] ??
        payload?.['generationParams']?.['keep_original_sound'] ??
        payload?.['keepOriginalSound'] ??
        payload?.['keep_original_sound'] ??
        _0x50c909['keepOriginalSound'] ??
        _0x50c909['keep_original_sound'],
    ),
    _0xa24cc0 = String(_0x50c909['prompt'] || payload?.['prompt'] || '')['trim']();
  if (!_0xa24cc0) throw new Error('RunningHub\x20Kling\x20O1\x20prompt\x20is\x20required');
  ((_0x50c909['prompt'] = _0xa24cc0),
    (_0x50c909['mode'] = normalizeRunningHubKlingO1QualityMode(_0x50c909['mode'])),
    (_0x50c909['aspectRatio'] = normalizeRunningHubKlingO1AspectRatio(_0x50c909['aspectRatio'])),
    (_0x50c909['duration'] = normalizeRunningHubKlingO1Duration(_0x50c909['duration'])),
    delete _0x50c909['rh_kling_o1_generation_mode'],
    delete _0x50c909['keep_original_sound'],
    delete _0x50c909['keepOriginalSound'],
    delete _0x50c909['firstImageUrl'],
    delete _0x50c909['lastImageUrl'],
    delete _0x50c909['imageUrls'],
    delete _0x50c909['videoUrl']);
  const _0x503375 = normalizeInputList(inputVideos),
    _0x2a8589 = Math['max'](
      _0x503375['length'],
      normalizeInputList(payload?.['videos'])['length'],
      normalizeInputList(payload?.['videoUrls'])['length'],
      String(payload?.['videoUrl'] || '')['trim']() ? 0x1 : 0x0,
    );
  if (_0x5deff5 === 'edit') {
    const _0x323620 = [];
    (collectRunningHubKlingO1FrameImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot })[
      'forEach'
    ]((_0x12c6ec) => appendUniqueUrl(_0x323620, _0x12c6ec)),
      collectRunningHubKlingO1ReferenceImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot })[
        'forEach'
      ]((_0x44ebe5) => appendUniqueUrl(_0x323620, _0x44ebe5)));
    if (_0x323620['length'] > 0x0)
      throw new Error('RunningHub\x20Kling\x20O1\x20edit\x20mode\x20does\x20not\x20accept\x20image\x20input');
    if (_0x2a8589 < 0x1 || !_0x503375[0x0])
      throw new Error('RunningHub Kling O1 edit mode requires 1 video input');
    if (_0x2a8589 > 0x1) throw new Error('RunningHub Kling O1 edit mode supports at most 1 video input');
    return (
      (_0x50c909['mode'] = 'std'),
      (_0x50c909['videoUrl'] = _0x503375[0x0]),
      (_0x50c909['keepOriginalSound'] = _0x439526),
      delete _0x50c909['aspectRatio'],
      delete _0x50c909['duration'],
      _0x50c909
    );
  }
  if (_0x5deff5 === 'reference') {
    const _0x427f2d = collectRunningHubKlingO1ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x427f2d['length'] < 0x1)
      throw new Error('RunningHub Kling O1 reference mode requires at least 1 image input');
    if (_0x427f2d['length'] > 0x7)
      throw new Error('RunningHub Kling O1 reference mode supports at most 7 image inputs');
    if (_0x2a8589 < 0x1 || !_0x503375[0x0])
      throw new Error('RunningHub Kling O1 reference mode requires 1 video input');
    if (_0x2a8589 > 0x1)
      throw new Error(
        'RunningHub\x20Kling\x20O1\x20reference\x20mode\x20supports\x20at\x20most\x201\x20video\x20input',
      );
    return (
      (_0x50c909['imageUrls'] = _0x427f2d),
      (_0x50c909['videoUrl'] = _0x503375[0x0]),
      (_0x50c909['keepOriginalSound'] = _0x439526),
      (_0x50c909['prompt'] = replaceKlingO1PromptImageReferences(_0x50c909['prompt'], _0x427f2d['length'])),
      _0x50c909
    );
  }
  const _0x3b7c1d = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x503375['length'] > 0x0)
    throw new Error('RunningHub Kling O1 frame mode does not accept video input; use reference mode');
  if (_0x3b7c1d['length'] > 0x2)
    throw new Error('RunningHub Kling O1 frame mode supports at most 2 image inputs');
  if (_0x3b7c1d[0x0]) _0x50c909['firstImageUrl'] = _0x3b7c1d[0x0];
  if (_0x3b7c1d[0x1]) _0x50c909['lastImageUrl'] = _0x3b7c1d[0x1];
  return (
    (_0x50c909['prompt'] = replaceKlingO1PromptImageReferences(_0x50c909['prompt'], _0x3b7c1d['length'])),
    _0x50c909
  );
}
export function runninghubKlingO1VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x55dd71 = resolveRunningHubKlingO1Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_KLING_O1_ENDPOINTS[_0x55dd71] || RUNNINGHUB_KLING_O1_ENDPOINTS['text'];
}
const RUNNINGHUB_KLING_V3_ENDPOINTS = Object['freeze']({
  'turbo-pro': Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-pro/image-to-video',
  }),
  std: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/image-to-video',
  }),
  pro: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video',
  }),
  '4k': Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video',
  }),
});
function normalizeRunningHubKlingV3Model(_0x57ea6e) {
  const _0x21d03e = String(_0x57ea6e || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x21d03e === '4k') return '4k';
  if (_0x21d03e === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingV3Model(
  _0x3cdb6d = {},
  _0x34cadc = {},
  _0x5794ef = '',
  _0x218997 = {},
  _0x12df69 = {},
) {
  const _0x19eca4 = String(_0x5794ef || _0x3cdb6d?.['model'] || _0x34cadc?.['model'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x4c3ca2 = String(_0x218997?.['id'] || _0x12df69?.['modelId'] || '')
      ['trim']()
      ['toLowerCase']();
  if (_0x19eca4['includes']('kling-v3-turbo-pro') || _0x4c3ca2['includes']('kling-v3-turbo-pro'))
    return 'turbo-pro';
  return normalizeRunningHubKlingV3Model(
    _0x34cadc['rh_kling_v3_model'] ||
      _0x3cdb6d?.['generationParams']?.['resolution'] ||
      _0x3cdb6d?.['resolution'],
  );
}
function collectRunningHubKlingV3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x50a197 = [],
    _0x1e1fb2 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x50a197, _0x1e1fb2['firstFrame']),
    appendUniqueUrl(_0x50a197, _0x1e1fb2['lastFrame']),
    normalizeInputList(inputImages)['forEach']((_0x163c3c) => appendUniqueUrl(_0x50a197, _0x163c3c)),
    _0x50a197
  );
}
function getRunningHubKlingV3RawMediaCount(_0xbaf282 = {}, _0x240d9c = [], _0x2213af = '') {
  const _0x1e5606 = _0x2213af === 'audio' ? 'audioUrl' : _0x2213af + 'Url',
    _0x258832 = _0x2213af + 's',
    _0x535209 = _0x2213af + 'Urls';
  return Math['max'](
    normalizeInputList(_0x240d9c)['length'],
    normalizeInputList(_0xbaf282?.[_0x258832])['length'],
    normalizeInputList(_0xbaf282?.[_0x535209])['length'],
    String(_0xbaf282?.[_0x1e5606] || '')['trim']() ? 0x1 : 0x0,
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
  const _0x355716 = getRunningHubKlingV3Model(
      payload,
      currentBody,
      modelToken,
      executionManifest,
      modelManifest,
    ),
    _0x10dd9c = collectRunningHubKlingV3FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })['length'];
  return { model: _0x355716, route: _0x10dd9c > 0x0 ? 'image' : 'text' };
}
export function runninghubKlingV3Video({
  currentBody: _0x5db79a,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const _0xe420e6 = { ..._0x5db79a },
    _0x47d308 = getRunningHubKlingV3Model(payload, _0xe420e6, modelToken, executionManifest, modelManifest),
    _0x27ccb4 = String(_0xe420e6['prompt'] || payload?.['prompt'] || '')['trim']();
  if (!_0x27ccb4) throw new Error('RunningHub Kling V3.0 prompt is required');
  const _0xf35984 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video');
  if (_0xf35984 > 0x0) throw new Error('RunningHub Kling V3.0 does not accept video input');
  const _0x455b21 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (_0x455b21 > 0x0) throw new Error('RunningHub Kling V3.0 does not accept audio input');
  ((_0xe420e6['prompt'] = _0x27ccb4),
    delete _0xe420e6['rh_kling_v3_model'],
    delete _0xe420e6['imageUrl'],
    delete _0xe420e6['firstImageUrl'],
    delete _0xe420e6['lastImageUrl'],
    delete _0xe420e6['imageUrls']);
  const _0x4a0672 = collectRunningHubKlingV3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x4a0672['length'] > 0x2) throw new Error('RunningHub Kling V3.0 supports at most 2 image inputs');
  if (_0x4a0672['length'] > 0x0) {
    delete _0xe420e6['aspectRatio'];
    if (_0x47d308 === '4k') {
      if (_0x4a0672['length'] > 0x1)
        throw new Error('RunningHub Kling V3.0 4K image-to-video supports only one imageUrl');
      return ((_0xe420e6['imageUrl'] = _0x4a0672[0x0]), _0xe420e6);
    }
    _0xe420e6['firstImageUrl'] = _0x4a0672[0x0];
    if (_0x4a0672[0x1]) _0xe420e6['lastImageUrl'] = _0x4a0672[0x1];
  }
  return _0xe420e6;
}
export function runninghubKlingV3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: executionManifest = {},
  modelManifest: modelManifest = {},
}) {
  const { model: _0x128c5a, route: _0x4ab9fe } = resolveRunningHubKlingV3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
    currentBody: { model: modelToken },
    modelToken: modelToken,
    executionManifest: executionManifest,
    modelManifest: modelManifest,
  });
  return (
    RUNNINGHUB_KLING_V3_ENDPOINTS[_0x128c5a]?.[_0x4ab9fe] || RUNNINGHUB_KLING_V3_ENDPOINTS['std']['text']
  );
}
const RUNNINGHUB_KLING_O3_ENDPOINTS = Object['freeze']({
  std: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit',
  }),
  pro: Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video',
    edit: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/video-edit',
  }),
  '4k': Object['freeze']({
    text: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video',
    image: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video',
    reference: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video',
  }),
});
function normalizeRunningHubKlingO3GenerationMode(_0xe49cae) {
  const _0x5cc045 = String(_0xe49cae || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x5cc045 === 'reference' || _0x5cc045 === 'edit') return _0x5cc045;
  return 'frame';
}
function normalizeRunningHubKlingO3Model(_0x10d62f) {
  const _0x5c9c00 = String(_0x10d62f || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x5c9c00 === '4k') return '4k';
  if (_0x5c9c00 === 'pro') return 'pro';
  return 'std';
}
function getRunningHubKlingO3GenerationMode(_0xfe90b9 = {}, _0x46cb12 = {}) {
  return normalizeRunningHubKlingO3GenerationMode(
    _0x46cb12['kling_v3_omni_mode'] ||
      _0xfe90b9?.['generationParams']?.['kling_v3_omni_mode'] ||
      _0xfe90b9?.['kling_v3_omni_mode'],
  );
}
function getRunningHubKlingO3Model(_0x592507 = {}, _0x34cc46 = {}) {
  return normalizeRunningHubKlingO3Model(
    _0x34cc46['rh_kling_o3_model'] ||
      _0x592507?.['generationParams']?.['resolution'] ||
      _0x592507?.['resolution'],
  );
}
function collectRunningHubKlingO3SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const _0x5330eb = [],
    _0x469fba = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x1456f4 = new Set(normalizeInputList(Object['values'](_0x469fba)));
  return (
    slotIds['forEach']((_0xef37cc) => appendUniqueUrl(_0x5330eb, _0x469fba[_0xef37cc])),
    normalizeInputList(inputImages)['forEach']((_0xa486c1) => {
      if (!_0x1456f4['has'](_0xa486c1)) appendUniqueUrl(_0x5330eb, _0xa486c1);
    }),
    _0x5330eb
  );
}
function collectRunningHubKlingO3FrameImages(_0x2a78ce = {}) {
  return collectRunningHubKlingO3SlotImages({ ..._0x2a78ce, slotIds: ['firstFrame', 'lastFrame'] });
}
function collectRunningHubKlingO3ReferenceImages(_0x17938a = {}) {
  return collectRunningHubKlingO3SlotImages({ ..._0x17938a, slotIds: ['referenceImage'] });
}
function collectRunningHubKlingO3EditImages(_0x15e786 = {}) {
  return collectRunningHubKlingO3SlotImages({ ..._0x15e786, slotIds: ['editRefImage'] });
}
function resolveRunningHubKlingO3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x1fa122 = getRunningHubKlingO3Model(payload, currentBody),
    _0x134ba1 = getRunningHubKlingO3GenerationMode(payload, currentBody);
  if (_0x134ba1 === 'reference') return { model: _0x1fa122, route: 'reference' };
  if (_0x134ba1 === 'edit') return { model: _0x1fa122, route: 'edit' };
  const _0x33da49 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  })['length'];
  return { model: _0x1fa122, route: _0x33da49 > 0x0 ? 'image' : 'text' };
}
export function runninghubKlingO3Video({
  currentBody: _0x264334,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x323ccb = { ..._0x264334 },
    _0x5136cb = getRunningHubKlingO3Model(payload, _0x323ccb),
    _0x493b07 = getRunningHubKlingO3GenerationMode(payload, _0x323ccb),
    _0x34cae1 = String(_0x323ccb['prompt'] || payload?.['prompt'] || '')['trim']();
  if (!_0x34cae1) throw new Error('RunningHub Kling O3 prompt is required');
  const _0x428f62 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, 'audio');
  if (_0x428f62 > 0x0) throw new Error('RunningHub Kling O3 does not accept direct audio input');
  const _0x163500 = normalizeInputList(inputVideos),
    _0x390ff7 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, 'video'),
    _0x5053a7 = normalizeKlingKeepOriginalSound(
      _0x323ccb['keepOriginalSound'] ??
        _0x323ccb['keep_original_sound'] ??
        payload?.['generationParams']?.['keepOriginalSound'] ??
        payload?.['generationParams']?.['keep_original_sound'] ??
        payload?.['keepOriginalSound'] ??
        payload?.['keep_original_sound'],
    );
  ((_0x323ccb['prompt'] = _0x34cae1),
    delete _0x323ccb['kling_v3_omni_mode'],
    delete _0x323ccb['rh_kling_o3_model'],
    delete _0x323ccb['keep_original_sound'],
    delete _0x323ccb['keepOriginalSound'],
    delete _0x323ccb['firstImageUrl'],
    delete _0x323ccb['lastImageUrl'],
    delete _0x323ccb['imageUrl'],
    delete _0x323ccb['imageUrls'],
    delete _0x323ccb['videoUrl']);
  if (_0x493b07 === 'edit') {
    if (_0x5136cb === '4k')
      throw new Error('RunningHub\x20Kling\x20O3\x204K\x20does\x20not\x20support\x20video\x20edit');
    if (_0x390ff7 < 0x1 || !_0x163500[0x0])
      throw new Error('RunningHub Kling O3 edit mode requires 1 video input');
    if (_0x390ff7 > 0x1) throw new Error('RunningHub Kling O3 edit mode supports at most 1 video input');
    const _0x4f9999 = collectRunningHubKlingO3EditImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x4f9999['length'] > 0x7)
      throw new Error('RunningHub Kling O3 edit mode supports at most 7 image inputs');
    _0x323ccb['videoUrl'] = _0x163500[0x0];
    if (_0x4f9999['length'] > 0x0) _0x323ccb['imageUrls'] = _0x4f9999;
    return (
      (_0x323ccb['keepOriginalSound'] = _0x5053a7),
      delete _0x323ccb['aspectRatio'],
      delete _0x323ccb['duration'],
      delete _0x323ccb['sound'],
      delete _0x323ccb['multiShot'],
      delete _0x323ccb['shotType'],
      _0x323ccb
    );
  }
  if (_0x493b07 === 'reference') {
    const _0x3b1a2f = collectRunningHubKlingO3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x3b1a2f['length'] < 0x1)
      throw new Error('RunningHub Kling O3 reference mode requires at least 1 image input');
    if (_0x390ff7 > 0x1) throw new Error('RunningHub Kling O3 reference mode supports at most 1 video input');
    if (_0x163500[0x0] && _0x3b1a2f['length'] > 0x4)
      throw new Error('RunningHub Kling O3 reference mode supports at most 4 image inputs with video input');
    if (_0x3b1a2f['length'] > 0x7)
      throw new Error('RunningHub Kling O3 reference mode supports at most 7 image inputs');
    _0x323ccb['imageUrls'] = _0x3b1a2f;
    if (_0x163500[0x0]) _0x323ccb['videoUrl'] = _0x163500[0x0];
    _0x323ccb['keepOriginalSound'] = _0x5053a7;
    if (_0x5136cb !== '4k') delete _0x323ccb['shotType'];
    return _0x323ccb;
  }
  if (_0x390ff7 > 0x0)
    throw new Error('RunningHub Kling O3 frame mode does not accept video input; use reference or edit mode');
  const _0x4a6904 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x4a6904['length'] > 0x2)
    throw new Error('RunningHub Kling O3 frame mode supports at most 2 image inputs');
  if (_0x5136cb === '4k' && _0x4a6904['length'] > 0x1)
    throw new Error(
      'RunningHub\x20Kling\x20O3\x204K\x20image-to-video\x20supports\x20only\x20one\x20firstImageUrl',
    );
  if (_0x4a6904['length'] > 0x0) {
    (delete _0x323ccb['aspectRatio'], (_0x323ccb['firstImageUrl'] = _0x4a6904[0x0]));
    if (_0x4a6904[0x1]) _0x323ccb['lastImageUrl'] = _0x4a6904[0x1];
  }
  return _0x323ccb;
}
export function runninghubKlingO3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: _0x277526, route: _0x111b4b } = resolveRunningHubKlingO3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_KLING_O3_ENDPOINTS[_0x277526]?.[_0x111b4b] || RUNNINGHUB_KLING_O3_ENDPOINTS['std']['text']
  );
}
const RUNNINGHUB_HAILUO_23_ENDPOINTS = Object['freeze']({
  t2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard',
  t2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro',
  i2vStandard: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard',
  i2vPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro',
  i2vFast: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
  i2vFastPro: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video',
});
function normalizeRunningHubHailuo23Quality(_0x4d9b94) {
  const _0x136efa = String(_0x4d9b94 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x136efa === 'pro') return 'pro';
  if (_0x136efa === 'fast') return 'fast';
  if (_0x136efa === 'fastpro' || _0x136efa === 'fast-pro' || _0x136efa === 'fast_pro') return 'fastPro';
  return 'standard';
}
function normalizeRunningHubHailuo23Duration(_0x3b4c54) {
  const _0x1f2911 = Number(_0x3b4c54);
  return Number['isFinite'](_0x1f2911) && Math['trunc'](_0x1f2911) === 0xa ? '10' : '6';
}
function getRunningHubHailuo23Quality(_0x481153 = {}, _0x272a35 = {}) {
  return normalizeRunningHubHailuo23Quality(
    _0x272a35['rh_hailuo_23_quality'] ||
      _0x481153?.['generationParams']?.['rh_hailuo_23_quality'] ||
      _0x481153?.['rh_hailuo_23_quality'],
  );
}
function collectRunningHubHailuo23FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x474c43 = [],
    _0x549a91 = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x474c43, _0x549a91['firstFrame']),
    normalizeInputList(inputImages)['forEach']((_0x5c091e) => appendUniqueUrl(_0x474c43, _0x5c091e)),
    _0x474c43
  );
}
function getRunningHubHailuo23RawVideoCount(_0x457602 = {}, _0x157644 = []) {
  return Math['max'](
    normalizeInputList(_0x157644)['length'],
    normalizeInputList(_0x457602?.['videos'])['length'],
    normalizeInputList(_0x457602?.['videoUrls'])['length'],
    String(_0x457602?.['videoUrl'] || '')['trim']() ? 0x1 : 0x0,
  );
}
function resolveRunningHubHailuo23Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x5b4e5b = getRunningHubHailuo23Quality(payload, currentBody),
    _0x1827e4 = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })['length'];
  if (_0x5b4e5b === 'fast') return 'i2vFast';
  if (_0x5b4e5b === 'fastPro') return 'i2vFastPro';
  if (_0x5b4e5b === 'pro') return _0x1827e4 > 0x0 ? 'i2vPro' : 't2vPro';
  return _0x1827e4 > 0x0 ? 'i2vStandard' : 't2vStandard';
}
export function runninghubHailuo23Video({
  currentBody: _0x17ef36,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0xbe8b82 = { ..._0x17ef36 },
    _0x4989f6 = String(_0xbe8b82['prompt'] || payload?.['prompt'] || '')['trim']();
  if (!_0x4989f6) throw new Error('RunningHub\x20Hailuo\x202.3\x20prompt\x20is\x20required');
  const _0x358142 = getRunningHubHailuo23Quality(payload, _0xbe8b82),
    _0x515f3c = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x56ab41 = getRunningHubHailuo23RawVideoCount(payload, inputVideos);
  if (_0x56ab41 > 0x0)
    throw new Error('RunningHub\x20Hailuo\x202.3\x20does\x20not\x20accept\x20video\x20input');
  if (_0x515f3c['length'] > 0x1)
    throw new Error('RunningHub\x20Hailuo\x202.3\x20supports\x20only\x20imageUrl\x20input');
  ((_0xbe8b82['prompt'] = _0x4989f6),
    (_0xbe8b82['duration'] = normalizeRunningHubHailuo23Duration(_0xbe8b82['duration'])),
    delete _0xbe8b82['rh_hailuo_23_quality'],
    delete _0xbe8b82['firstImageUrl'],
    delete _0xbe8b82['lastImageUrl'],
    delete _0xbe8b82['imageUrl'],
    delete _0xbe8b82['imageUrls'],
    delete _0xbe8b82['videoUrl']);
  if (_0x358142 === 'fast' || _0x358142 === 'fastPro') {
    if (!_0x515f3c[0x0]) throw new Error('RunningHub Hailuo 2.3 Fast requires imageUrl input');
    return (
      (_0xbe8b82['imageUrl'] = _0x515f3c[0x0]),
      _0x358142 === 'fastPro' && (_0xbe8b82['duration'] = '6'),
      _0xbe8b82
    );
  }
  _0x358142 === 'pro' && delete _0xbe8b82['duration'];
  if (_0x515f3c[0x0]) _0xbe8b82['imageUrl'] = _0x515f3c[0x0];
  return _0xbe8b82;
}
export function runninghubHailuo23VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x3fd991 = resolveRunningHubHailuo23Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_HAILUO_23_ENDPOINTS[_0x3fd991] || RUNNINGHUB_HAILUO_23_ENDPOINTS['t2vStandard'];
}
const RUNNINGHUB_VEO3_ENDPOINTS = Object['freeze']({
  lowCost: Object['freeze']({
    text: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video',
    }),
    image: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video',
    }),
    frames: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video',
    }),
  }),
  official: Object['freeze']({
    text: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/text-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video',
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/text-to-video',
    }),
    image: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/image-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/image-to-video',
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/image-to-video',
    }),
    frames: Object['freeze']({
      lite: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video',
    }),
    reference: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/reference-to-video',
    }),
    extend: Object['freeze']({
      fast: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend',
      pro: 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/video-extend',
    }),
  }),
});
function normalizeRunningHubVeo3Channel(_0x3d32a3) {
  const _0x4eff97 = String(_0x3d32a3 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x4eff97 === 'official' || _0x4eff97 === 'stable' || _0x4eff97 === 'officialstable') return 'official';
  return 'lowCost';
}
function normalizeRunningHubVeo3Mode(_0x26c2a4, { channel: channel = 'lowCost' } = {}) {
  const _0x32d084 = String(_0x26c2a4 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x32d084 === 'quality' || _0x32d084 === 'pro') return 'pro';
  if (_0x32d084 === 'lite' && channel === 'official') return 'lite';
  return 'fast';
}
function getRunningHubVeo3Channel(_0x18340e = {}, _0x4a493c = {}) {
  return normalizeRunningHubVeo3Channel(
    _0x4a493c['rh_veo3_channel'] ||
      _0x18340e?.['generationParams']?.['rh_veo3_channel'] ||
      _0x18340e?.['rh_veo3_channel'],
  );
}
function getRunningHubVeo3Mode(_0x33f192 = {}, _0x560877 = {}) {
  const _0x2aa93a = getRunningHubVeo3Channel(_0x33f192, _0x560877);
  return normalizeRunningHubVeo3Mode(
    _0x560877['mode'] || _0x33f192?.['generationParams']?.['mode'] || _0x33f192?.['mode'],
    { channel: _0x2aa93a },
  );
}
function getRunningHubVeo3GenerationType(_0x1d94bb = {}, _0x2540c6 = {}) {
  const _0x208f2b = String(
    _0x2540c6['generation_type'] ||
      _0x1d94bb?.['generationParams']?.['generation_type'] ||
      _0x1d94bb?.['generation_type'] ||
      'frame',
  )
    ['trim']()
    ['toLowerCase']();
  if (_0x208f2b === 'reference' || _0x208f2b === 'extend') return _0x208f2b;
  return 'frame';
}
function collectRunningHubVeo3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x2a15c8 = [],
    _0x2dc80f = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x2a15c8, _0x2dc80f['firstFrame']),
    appendUniqueUrl(_0x2a15c8, _0x2dc80f['lastFrame']),
    normalizeInputList(inputImages)['forEach']((_0x264c06) => appendUniqueUrl(_0x2a15c8, _0x264c06)),
    _0x2a15c8
  );
}
function collectRunningHubVeo3ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x1b5fd2 = [],
    _0x24050c = normalizeInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(_0x1b5fd2, _0x24050c['referenceImage']),
    normalizeInputList(inputImages)['forEach']((_0x858ed5) => appendUniqueUrl(_0x1b5fd2, _0x858ed5)),
    _0x1b5fd2
  );
}
function getRunningHubVeo3RawVideoCount(_0x4b2fe7 = {}, _0x2dd219 = []) {
  return Math['max'](
    normalizeInputList(_0x2dd219)['length'],
    normalizeInputList(_0x4b2fe7?.['videos'])['length'],
    normalizeInputList(_0x4b2fe7?.['videoUrls'])['length'],
    String(_0x4b2fe7?.['videoUrl'] || '')['trim']() ? 0x1 : 0x0,
  );
}
function resolveRunningHubVeo3Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x305daa = getRunningHubVeo3Channel(payload, currentBody),
    _0x1f1aa2 = getRunningHubVeo3Mode(payload, currentBody),
    _0x355c8d = getRunningHubVeo3GenerationType(payload, currentBody);
  if (_0x355c8d === 'extend' || normalizeInputList(inputVideos)['length'] > 0x0)
    return Object['freeze']({ channel: _0x305daa, mode: _0x1f1aa2, route: 'extend' });
  if (_0x355c8d === 'reference')
    return Object['freeze']({ channel: _0x305daa, mode: _0x1f1aa2, route: 'reference' });
  const _0x3a9ee7 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x3a9ee7['length'] >= 0x2)
    return Object['freeze']({ channel: _0x305daa, mode: _0x1f1aa2, route: 'frames' });
  if (_0x3a9ee7['length'] === 0x1)
    return Object['freeze']({
      channel: _0x305daa,
      mode: _0x1f1aa2,
      route: _0x305daa === 'lowCost' && _0x1f1aa2 === 'pro' ? 'frames' : 'image',
    });
  return Object['freeze']({ channel: _0x305daa, mode: _0x1f1aa2, route: 'text' });
}
function normalizeRunningHubVeo3BodyResolution(_0x4fe155, { channel: _0x5a3c8b, mode: _0x3f97ff }) {
  const _0x4a7529 = String(_0x4fe155 || '720p')
    ['trim']()
    ['toLowerCase']();
  if (_0x5a3c8b === 'lowCost') return '720p';
  if (_0x3f97ff === 'lite' && _0x4a7529 === '4k') return '1080p';
  if (_0x4a7529 === '4k' || _0x4a7529 === '1080p') return _0x4a7529;
  return '720p';
}
function normalizeRunningHubVeo3BodyDuration(_0x14e220, { channel: _0x20551c, mode: _0x500d86 }) {
  if (_0x20551c === 'lowCost') return '8';
  const _0x8d1769 = Math['trunc'](Number(_0x14e220));
  if (_0x500d86 === 'lite') return _0x8d1769 === 0x8 ? '8' : '6';
  return [0x4, 0x6, 0x8]['includes'](_0x8d1769) ? String(_0x8d1769) : '8';
}
function removeRunningHubVeo3TransientFields(_0x11253b) {
  (delete _0x11253b['rh_veo3_channel'],
    delete _0x11253b['mode'],
    delete _0x11253b['generation_type'],
    delete _0x11253b['imageUrl'],
    delete _0x11253b['imageUrls'],
    delete _0x11253b['firstFrameUrl'],
    delete _0x11253b['lastFrameUrl'],
    delete _0x11253b['firstImageUrl'],
    delete _0x11253b['lastImageUrl'],
    delete _0x11253b['videoUrl'],
    delete _0x11253b['video']);
}
export function runninghubVeo3Video({
  currentBody: _0x2129d1,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x24571f = { ..._0x2129d1 },
    _0x5bbc53 = resolveRunningHubVeo3Route({
      inputImages: inputImages,
      inputVideos: inputVideos,
      payload: payload,
      finalUrlsBySlot: finalUrlsBySlot,
      currentBody: _0x24571f,
    }),
    { channel: _0x4caa8d, mode: _0xa08581, route: _0x3cccc2 } = _0x5bbc53,
    _0x5de497 = getRunningHubVeo3GenerationType(payload, _0x24571f),
    _0x5c686c = getRunningHubVeo3RawVideoCount(payload, inputVideos);
  if (_0x5c686c > 0x0 && _0x3cccc2 !== 'extend')
    throw new Error('RunningHub Veo3 does not accept video input');
  const _0x2162ed = String(_0x24571f['prompt'] || payload?.['prompt'] || '')['trim']();
  if (_0x3cccc2 !== 'extend') {
    if (!_0x2162ed) throw new Error('RunningHub Veo3 prompt is required');
    _0x24571f['prompt'] = _0x2162ed;
  }
  ((_0x24571f['resolution'] = normalizeRunningHubVeo3BodyResolution(_0x24571f['resolution'], {
    channel: _0x4caa8d,
    mode: _0xa08581,
  })),
    (_0x24571f['duration'] = normalizeRunningHubVeo3BodyDuration(_0x24571f['duration'], {
      channel: _0x4caa8d,
      mode: _0xa08581,
    })),
    removeRunningHubVeo3TransientFields(_0x24571f));
  if (_0x3cccc2 === 'extend') {
    if (_0x4caa8d !== 'official' || _0xa08581 === 'lite')
      throw new Error('RunningHub Veo3 video extend only supports official Fast or Pro');
    const _0x3196ed = normalizeInputList(inputVideos);
    if (_0x5c686c < 0x1 || !_0x3196ed[0x0])
      throw new Error('RunningHub Veo3 video extend requires 1 video input');
    if (_0x5c686c > 0x1) throw new Error('RunningHub Veo3 video extend supports at most 1 video input');
    const _0xd25d61 = [];
    (collectRunningHubVeo3FrameImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot })[
      'forEach'
    ]((_0x14a89a) => appendUniqueUrl(_0xd25d61, _0x14a89a)),
      collectRunningHubVeo3ReferenceImages({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot })[
        'forEach'
      ]((_0x2562bf) => appendUniqueUrl(_0xd25d61, _0x2562bf)));
    if (_0xd25d61['length'] > 0x0)
      throw new Error('RunningHub Veo3 video extend does not accept image input');
    return (
      (_0x24571f['video'] = _0x3196ed[0x0]),
      delete _0x24571f['prompt'],
      delete _0x24571f['duration'],
      delete _0x24571f['aspectRatio'],
      delete _0x24571f['generateAudio'],
      _0x24571f
    );
  }
  if (_0x5de497 === 'reference') {
    if (_0x4caa8d !== 'official' || _0xa08581 === 'lite')
      throw new Error(
        'RunningHub\x20Veo3\x20reference\x20mode\x20only\x20supports\x20official\x20Fast\x20or\x20Pro',
      );
    const _0x513950 = collectRunningHubVeo3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (_0x513950['length'] < 0x1)
      throw new Error('RunningHub\x20Veo3\x20reference\x20mode\x20requires\x201-3\x20image\x20inputs');
    if (_0x513950['length'] > 0x3)
      throw new Error('RunningHub Veo3 reference mode supports at most 3 image inputs');
    ((_0x24571f['imageUrls'] = _0x513950), delete _0x24571f['duration']);
    if (_0xa08581 === 'pro') delete _0x24571f['aspectRatio'];
    return _0x24571f;
  }
  const _0x507f1b = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x507f1b['length'] > 0x2)
    throw new Error('RunningHub Veo3 frame mode supports at most 2 image inputs');
  if (_0x507f1b['length'] >= 0x2 && _0x4caa8d === 'official' && _0xa08581 !== 'lite')
    throw new Error(
      'RunningHub Veo3 official Fast/Pro start-end endpoint is not published; use official Lite or low-cost channel',
    );
  if (_0x507f1b['length'] === 0x1) {
    if (_0x4caa8d === 'official') _0x24571f['imageUrl'] = _0x507f1b[0x0];
    else
      _0xa08581 === 'pro'
        ? (_0x24571f['firstFrameUrl'] = _0x507f1b[0x0])
        : (_0x24571f['imageUrls'] = [_0x507f1b[0x0]]);
  } else
    _0x507f1b['length'] === 0x2 &&
      (_0x4caa8d === 'official'
        ? ((_0x24571f['firstImageUrl'] = _0x507f1b[0x0]),
          (_0x24571f['lastImageUrl'] = _0x507f1b[0x1]),
          delete _0x24571f['duration'])
        : ((_0x24571f['firstFrameUrl'] = _0x507f1b[0x0]), (_0x24571f['lastFrameUrl'] = _0x507f1b[0x1])));
  return ((_0x4caa8d === 'lowCost' || _0xa08581 === 'lite') && delete _0x24571f['generateAudio'], _0x24571f);
}
export function runninghubVeo3VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const {
    channel: _0x109ecc,
    mode: _0x3c73e1,
    route: _0xebea4b,
  } = resolveRunningHubVeo3Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_VEO3_ENDPOINTS[_0x109ecc]?.[_0xebea4b]?.[_0x3c73e1] ||
    RUNNINGHUB_VEO3_ENDPOINTS['lowCost']['text']['fast']
  );
}
const RUNNINGHUB_WAN27_ENDPOINTS = Object['freeze']({
  text: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video',
  image: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video',
  video: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend',
  reference: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
  edit: 'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit',
});
function normalizeRunningHubWan27Mode(_0x44414a) {
  const _0x321d88 = String(_0x44414a || '')
    ['trim']()
    ['toLowerCase']();
  return _0x321d88 === 'video' || _0x321d88 === 'reference' || _0x321d88 === 'edit' ? _0x321d88 : 'image';
}
function getRunningHubWan27Mode(_0x1439a7 = {}, _0x2cb313 = {}) {
  return normalizeRunningHubWan27Mode(
    _0x2cb313['wan27_mode'] || _0x1439a7?.['generationParams']?.['wan27_mode'] || _0x1439a7?.['wan27_mode'],
  );
}
function collectRunningHubWan27Images({
  mode: _0x4dab18,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x39e9d8 = [],
    _0xa7221a = normalizeInputUrlsBySlot(finalUrlsBySlot);
  if (_0x4dab18 === 'image')
    (appendUniqueUrl(_0x39e9d8, _0xa7221a['firstFrame']), appendUniqueUrl(_0x39e9d8, _0xa7221a['lastFrame']));
  else {
    if (_0x4dab18 === 'reference') appendUniqueUrl(_0x39e9d8, _0xa7221a['referenceImage']);
    else _0x4dab18 === 'edit' && appendUniqueUrl(_0x39e9d8, _0xa7221a['editRefImage']);
  }
  return (
    normalizeInputList(inputImages)['forEach']((_0x19620c) => appendUniqueUrl(_0x39e9d8, _0x19620c)),
    _0x39e9d8
  );
}
function removeRunningHubWan27TransientFields(_0x55bcf4) {
  (delete _0x55bcf4['wan27_mode'],
    delete _0x55bcf4['firstImageUrl'],
    delete _0x55bcf4['lastImageUrl'],
    delete _0x55bcf4['imageUrl'],
    delete _0x55bcf4['imageUrls'],
    delete _0x55bcf4['videoUrl'],
    delete _0x55bcf4['videoUrls']);
  if (!_0x55bcf4['aspectRatio']) delete _0x55bcf4['aspectRatio'];
}
function resolveRunningHubWan27Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const _0x3a022b = getRunningHubWan27Mode(payload, currentBody);
  if (_0x3a022b === 'reference' || _0x3a022b === 'edit') return _0x3a022b;
  const _0x50578c = normalizeInputList(inputVideos);
  if (_0x3a022b === 'video' && _0x50578c['length'] > 0x0) return 'video';
  const _0x3d58eb = collectRunningHubWan27Images({
    mode: _0x3a022b,
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (_0x3d58eb['length'] > 0x0) return 'image';
  return 'text';
}
export function runninghubWan27Video({
  currentBody: _0x1e4caa,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x5e14cd = { ..._0x1e4caa },
    _0x45eac3 = String(_0x5e14cd['prompt'] || payload?.['prompt'] || '')['trim']();
  if (!_0x45eac3) throw new Error('RunningHub Wan2.7 prompt is required');
  const _0x4c4a7e = getRunningHubWan27Mode(payload, _0x5e14cd),
    _0x22609b = collectRunningHubWan27Images({
      mode: _0x4c4a7e,
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0xd03e5c = normalizeInputList(inputVideos),
    _0x5ceacc = String(_0x5e14cd['audioUrl'] || '')['trim']() || normalizeInputList(inputAudios)[0x0] || '';
  _0x5e14cd['prompt'] = _0x45eac3;
  if (_0x5ceacc) _0x5e14cd['audioUrl'] = _0x5ceacc;
  removeRunningHubWan27TransientFields(_0x5e14cd);
  if (_0x4c4a7e === 'reference') {
    const _0x19a404 = _0x22609b['length'] + _0xd03e5c['length'];
    if (_0x19a404 <= 0x0) throw new Error('RunningHub Wan2.7 reference mode requires image or video input');
    if (_0x19a404 > 0x5) throw new Error('RunningHub Wan2.7 reference mode supports at most 5 inputs');
    if (_0x5ceacc) throw new Error('RunningHub Wan2.7 reference mode does not accept audio input');
    if (_0x22609b['length'] > 0x0) _0x5e14cd['imageUrls'] = _0x22609b;
    if (_0xd03e5c['length'] > 0x0) _0x5e14cd['videoUrls'] = _0xd03e5c;
    return _0x5e14cd;
  }
  if (_0x4c4a7e === 'edit') {
    if (!_0xd03e5c[0x0]) throw new Error('RunningHub Wan2.7 video edit requires original video input');
    if (_0xd03e5c['length'] > 0x1)
      throw new Error('RunningHub Wan2.7 video edit accepts only one original video');
    if (_0x22609b['length'] > 0x3)
      throw new Error(
        'RunningHub\x20Wan2.7\x20video\x20edit\x20supports\x20at\x20most\x203\x20image\x20inputs',
      );
    if (_0x5ceacc) throw new Error('RunningHub Wan2.7 video edit does not accept audio input');
    _0x5e14cd['videoUrl'] = _0xd03e5c[0x0];
    if (_0x22609b['length'] > 0x0) _0x5e14cd['imageUrls'] = _0x22609b['slice'](0x0, 0x3);
    return _0x5e14cd;
  }
  if (_0x4c4a7e === 'video') {
    if (_0x22609b['length'] > 0x0)
      throw new Error('RunningHub Wan2.7 video extend does not accept image input');
    if (_0xd03e5c['length'] > 0x1)
      throw new Error('RunningHub\x20Wan2.7\x20video\x20extend\x20accepts\x20only\x20one\x20video\x20input');
    if (_0xd03e5c[0x0]) _0x5e14cd['videoUrl'] = _0xd03e5c[0x0];
    return _0x5e14cd;
  }
  if (_0xd03e5c['length'] > 0x0)
    throw new Error('RunningHub\x20Wan2.7\x20image\x20mode\x20does\x20not\x20accept\x20video\x20input');
  if (_0x22609b['length'] > 0x2)
    throw new Error('RunningHub Wan2.7 image mode supports at most 2 image inputs');
  _0x22609b[0x0] && (delete _0x5e14cd['aspectRatio'], (_0x5e14cd['firstImageUrl'] = _0x22609b[0x0]));
  if (_0x22609b[0x1]) _0x5e14cd['lastImageUrl'] = _0x22609b[0x1];
  return _0x5e14cd;
}
export function runninghubWan27VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x8b93c = resolveRunningHubWan27Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_WAN27_ENDPOINTS[_0x8b93c] || RUNNINGHUB_WAN27_ENDPOINTS['text'];
}
