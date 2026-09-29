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
function normalizeRunningHubSeedance25Mode(_0x3d48ce) {
  const _0x16ed88 = String(_0x3d48ce || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x16ed88 === 'multimodal2video' || _0x16ed88 === 'reference') return 'multimodal2video';
  if (_0x16ed88 === 'frames2video' || _0x16ed88 === 'frames') return 'frames2video';
  if (_0x16ed88 === 'image2video' || _0x16ed88 === 'image' || _0x16ed88 === 'frame') return 'image2video';
  return 'text2video';
}
function getRunningHubSeedance25Mode(_0x111ebe = {}, _0x3525be = {}) {
  return normalizeRunningHubSeedance25Mode(
    _0x3525be['rh_seedance_2_mode'] ||
      _0x111ebe?.['generationParams']?.['rh_seedance_2_mode'] ||
      _0x111ebe?.['rh_seedance_2_mode'],
  );
}
function getRunningHubSeedance25OmniReferenceTaskType(_0x4fd048 = {}, _0x5bde12 = {}) {
  const _0x23f8ce = String(
    _0x4fd048?.['generationParams']?.['omniReferenceTaskType'] ||
      _0x4fd048?.['omniReferenceTaskType'] ||
      _0x5bde12['omniReferenceTaskType'] ||
      '',
  )
    ['trim']()
    ['toLowerCase']();
  return _0x23f8ce === 'edit' ? 'edit' : 'auto';
}
function getRawMediaCount(_0x4ec468 = {}, _0x23743f = [], _0x21f687 = '') {
  const _0x1013f2 = _0x21f687 === 'audio' ? 'audioUrl' : _0x21f687 + 'Url';
  return Math['max'](
    normalizeInputList(_0x23743f)['length'],
    normalizeInputList(_0x4ec468?.[_0x21f687 + 's'])['length'],
    normalizeInputList(_0x4ec468?.[_0x21f687 + 'Urls'])['length'],
    String(_0x4ec468?.[_0x1013f2] || '')['trim']() ? 0x1 : 0x0,
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
  const _0x2fe768 = [],
    _0x5a67bb = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x3ac249 = new Set(normalizeInputList(Object['values'](_0x5a67bb)));
  return (
    slotIds['forEach']((_0x3c1667) => appendUniqueUrl(_0x2fe768, _0x5a67bb[_0x3c1667])),
    normalizeInputList(inputImages)['forEach']((_0x1d5dce) => {
      if (!_0x3ac249['has'](_0x1d5dce)) appendUniqueUrl(_0x2fe768, _0x1d5dce);
    }),
    _0x2fe768
  );
}
function resolveRunningHubSeedance25Route(_0x2e64ac = {}) {
  const _0x1a558d = getRunningHubSeedance25MediaCounts(_0x2e64ac);
  if (_0x1a558d['image'] + _0x1a558d['video'] + _0x1a558d['audio'] <= 0x0) return 'text';
  const _0x56e2bc = getRunningHubSeedance25Mode(_0x2e64ac['payload'], _0x2e64ac['currentBody']);
  if (_0x56e2bc === 'multimodal2video') return 'reference';
  if (_0x56e2bc === 'image2video' || _0x56e2bc === 'frames2video') return 'image';
  return 'text';
}
function removeTransientFields(_0x5195bf) {
  (delete _0x5195bf['rh_seedance_2_mode'],
    delete _0x5195bf['firstFrameUrl'],
    delete _0x5195bf['lastFrameUrl'],
    delete _0x5195bf['imageUrls'],
    delete _0x5195bf['videoUrls'],
    delete _0x5195bf['audioUrls']);
}
function removeUnsupportedFields(_0x544439, _0x376e0d) {
  if (_0x376e0d !== 'text') delete _0x544439['webSearch'];
  if (_0x376e0d !== 'reference') delete _0x544439['omniReferenceTaskType'];
  _0x376e0d === 'text' && (delete _0x544439['realPersonMode'], delete _0x544439['conversionSlots']);
}
function normalizeConversionSlots(_0x32b1a2) {
  const _0x424440 = Array['isArray'](_0x32b1a2) ? _0x32b1a2 : ['all'],
    _0x20334f = _0x424440['map']((_0x2b37a7) => String(_0x2b37a7 || '')['trim']())['filter'](Boolean);
  return _0x20334f['length'] > 0x0 ? _0x20334f : ['all'];
}
function applyRealPersonConversionSlots(_0x1b9e21) {
  _0x1b9e21['realPersonMode'] === !![]
    ? (_0x1b9e21['conversionSlots'] = normalizeConversionSlots(_0x1b9e21['conversionSlots']))
    : delete _0x1b9e21['conversionSlots'];
}
export function runninghubSeedance25Video({
  currentBody: _0x333a38,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x451ebd = { ..._0x333a38 },
    _0x2383b2 = String(_0x451ebd['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!_0x2383b2) throw new Error('RunningHub Seedance 2.5 prompt is required');
  const _0x19d394 = getRunningHubSeedance25Mode(payload, _0x451ebd),
    _0x51acb9 = getRunningHubSeedance25MediaCounts({
      payload: payload,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
    }),
    _0x5902d1 = _0x51acb9['image'] + _0x51acb9['video'] + _0x51acb9['audio'] > 0x0,
    _0x345d9a = _0x5902d1 ? _0x19d394 : 'text2video',
    _0x188339 =
      _0x345d9a === 'multimodal2video'
        ? 'reference'
        : _0x345d9a === 'image2video' || _0x345d9a === 'frames2video'
          ? 'image'
          : 'text',
    _0x572e2c = collectSlotImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['firstFrame', 'lastFrame'],
    }),
    _0x401024 = collectSlotImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['referenceImage'],
    }),
    _0x4836f0 = normalizeInputList(inputVideos),
    _0x1eb2df = normalizeInputList(inputAudios);
  _0x451ebd['prompt'] = _0x2383b2;
  const _0x29903f = normalizeOptionalIntegerInRange(_0x451ebd['seed'], { min: -0x1, max: 0x7fffffff });
  if (_0x29903f === null) delete _0x451ebd['seed'];
  else _0x451ebd['seed'] = _0x29903f;
  (removeTransientFields(_0x451ebd), removeUnsupportedFields(_0x451ebd, _0x188339));
  if (_0x188339 === 'text') {
    if (_0x5902d1)
      throw new Error(
        'RunningHub Seedance 2.5 text-to-video mode does not accept media input; choose image, frames, or multimodal mode',
      );
    return _0x451ebd;
  }
  if (_0x188339 === 'reference') {
    if (_0x401024['length'] + _0x4836f0['length'] + _0x1eb2df['length'] <= 0x0)
      throw new Error('RunningHub Seedance 2.5 multimodal mode requires image, video, or audio input');
    if (_0x51acb9['image'] > 0x1e)
      throw new Error('RunningHub Seedance 2.5 multimodal mode supports at most 30 image inputs');
    if (_0x51acb9['video'] > 0xa)
      throw new Error(
        'RunningHub\x20Seedance\x202.5\x20multimodal\x20mode\x20supports\x20at\x20most\x2010\x20video\x20inputs',
      );
    if (_0x51acb9['audio'] > 0xa)
      throw new Error('RunningHub Seedance 2.5 multimodal mode supports at most 10 audio inputs');
    _0x401024['length'] > 0x0 && (_0x451ebd['imageUrls'] = _0x401024['slice'](0x0, 0x1e));
    if (_0x4836f0['length'] > 0x0) _0x451ebd['videoUrls'] = _0x4836f0['slice'](0x0, 0xa);
    if (_0x1eb2df['length'] > 0x0) _0x451ebd['audioUrls'] = _0x1eb2df['slice'](0x0, 0xa);
    return (
      (_0x451ebd['omniReferenceTaskType'] = getRunningHubSeedance25OmniReferenceTaskType(payload, _0x451ebd)),
      applyRealPersonConversionSlots(_0x451ebd),
      _0x451ebd
    );
  }
  if (_0x51acb9['video'] > 0x0 || _0x51acb9['audio'] > 0x0)
    throw new Error(
      'RunningHub Seedance 2.5 image/frame modes only accept image input; use multimodal mode for video or audio',
    );
  if (_0x345d9a === 'image2video' && _0x572e2c['length'] !== 0x1)
    throw new Error('RunningHub Seedance 2.5 image-to-video mode requires exactly 1 image input');
  if (_0x345d9a === 'frames2video' && _0x572e2c['length'] !== 0x2)
    throw new Error('RunningHub Seedance 2.5 first-last-frame mode requires exactly 2 image inputs');
  _0x451ebd['firstFrameUrl'] = _0x572e2c[0x0];
  if (_0x572e2c[0x1]) _0x451ebd['lastFrameUrl'] = _0x572e2c[0x1];
  return ((_0x451ebd['ratio'] = 'adaptive'), applyRealPersonConversionSlots(_0x451ebd), _0x451ebd);
}
export function runninghubSeedance25VideoEndpoint(_0x3c51ca = {}) {
  return RUNNINGHUB_SEEDANCE_2_5_ENDPOINTS[resolveRunningHubSeedance25Route(_0x3c51ca)];
}
