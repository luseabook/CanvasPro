import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeOptionalIntegerInRange,
} from './sharedResolverUtils.js';
import { isPublicHttpMediaUrl, uploadModelApiMediaInputs } from '../../mediaInputUploadRouter.js';
import { isConfiguredObjectStorageEnabled } from '../../objectStorageApi.js';
import { convertImageBlobToDataUrl } from '../../../src/services/imagePngConversionService.js';
function isReusableAgnesImageInput(_0x3ed1ab) {
  const _0x2324b7 = String(_0x3ed1ab || '')['trim']();
  return (
    /^data:image\/[a-z0-9.+-]+;base64,/i['test'](_0x2324b7) ||
    (/^https:\/\//i['test'](_0x2324b7) && isPublicHttpMediaUrl(_0x2324b7))
  );
}
async function resolveAgnesImageInputs(_0x3cb2eb, _0x2a150f = {}) {
  const _0x34a19e = normalizeInputList(_0x3cb2eb);
  if (_0x34a19e['length'] === 0x0) return [];
  if (isConfiguredObjectStorageEnabled())
    return uploadModelApiMediaInputs('image', _0x34a19e, _0x2a150f, { strictUpload: !![] });
  const _0xc3d7fc = [];
  for (const _0x508e4c of _0x34a19e) {
    if (isReusableAgnesImageInput(_0x508e4c)) {
      _0xc3d7fc['push'](_0x508e4c);
      continue;
    }
    if (typeof _0x2a150f['loadInputImageBlob'] !== 'function')
      throw new Error('Agnes 图生图无法读取本地参考图');
    const _0x5b1cd5 = await _0x2a150f['loadInputImageBlob'](_0x508e4c),
      _0x117a74 = await convertImageBlobToDataUrl(_0x5b1cd5, _0x508e4c);
    if (!_0x117a74) throw new Error('Agnes\x20图生图无法读取本地参考图');
    _0xc3d7fc['push'](_0x117a74);
  }
  return _0xc3d7fc;
}
export async function agnesImage({ currentBody: _0x4cfac6, ctx: _0x19d2bc }) {
  const _0x40e4f6 = { ..._0x4cfac6 },
    _0xa8a45a = await resolveAgnesImageInputs(_0x40e4f6['extra_body']?.['image'], _0x19d2bc),
    _0x20cd83 =
      _0x40e4f6['extra_body'] &&
      typeof _0x40e4f6['extra_body'] === 'object' &&
      !Array['isArray'](_0x40e4f6['extra_body'])
        ? { ..._0x40e4f6['extra_body'] }
        : {};
  return (
    delete _0x40e4f6['tags'],
    (_0x20cd83['response_format'] = _0xa8a45a['length'] > 0x0 ? 'b64_json' : 'url'),
    _0xa8a45a['length'] > 0x0 ? (_0x20cd83['image'] = _0xa8a45a) : delete _0x20cd83['image'],
    Object['keys'](_0x20cd83)['length'] > 0x0
      ? (_0x40e4f6['extra_body'] = _0x20cd83)
      : delete _0x40e4f6['extra_body'],
    _0x40e4f6
  );
}
function normalizeAgnesVideoFrameCount(_0x375456) {
  const _0x393edf = Number(_0x375456);
  if (!Number['isFinite'](_0x393edf)) return _0x375456;
  const _0x2c64de = 0x31,
    _0x1eddcd = 0x1b9,
    _0x23e2c9 = Math['min'](Math['max'](_0x2c64de, Math['trunc'](_0x393edf)), _0x1eddcd),
    _0x5bb9c1 = Math['round']((_0x23e2c9 - 0x1) / 0x8) * 0x8 + 0x1;
  return Math['min'](_0x1eddcd, Math['max'](_0x2c64de, _0x5bb9c1));
}
function normalizeAgnesVideoFrameRate(_0x3fb32f) {
  const _0x39456b = Number(_0x3fb32f);
  if (!Number['isFinite'](_0x39456b)) return _0x3fb32f;
  const _0x5e7a00 = Math['min'](Math['max'](0x1, Math['trunc'](_0x39456b)), 0x3c);
  return _0x5e7a00;
}
export function agnesVideo({ currentBody: _0x1968fc }) {
  const _0xac82c7 = { ..._0x1968fc },
    _0x5bd710 = normalizeOptionalIntegerInRange(_0xac82c7['seed']);
  if (_0x5bd710 === null) delete _0xac82c7['seed'];
  else _0xac82c7['seed'] = _0x5bd710;
  delete _0xac82c7['agnes_video_mode'];
  _0xac82c7['num_frames'] !== undefined &&
    (_0xac82c7['num_frames'] = normalizeAgnesVideoFrameCount(_0xac82c7['num_frames']));
  _0xac82c7['frame_rate'] !== undefined &&
    (_0xac82c7['frame_rate'] = normalizeAgnesVideoFrameRate(_0xac82c7['frame_rate']));
  const _0x15149a = normalizeInputList(_0xac82c7['extra_body']?.['image']),
    _0x18ccd4 = _0x15149a['slice'](0x0, 0x2);
  if (_0x18ccd4['length'] === 0x0)
    return (delete _0xac82c7['image'], delete _0xac82c7['extra_body'], _0xac82c7);
  if (_0x18ccd4['length'] === 0x1)
    return ((_0xac82c7['image'] = _0x18ccd4[0x0]), delete _0xac82c7['extra_body'], _0xac82c7);
  return (
    (_0xac82c7['extra_body'] = { image: _0x18ccd4, mode: 'keyframes' }),
    delete _0xac82c7['image'],
    _0xac82c7
  );
}
function normalizeAgnesVideo25Mode(_0x2f2acf) {
  const _0x292550 = String(_0x2f2acf || '')
    ['trim']()
    ['toLowerCase']();
  return _0x292550 === 'reference' ? 'reference' : 'keyframe';
}
function normalizeAgnesVideo25PromptReferences(_0x129ae0) {
  return String(_0x129ae0 || '')
    ['replace'](/@\s*(?:图片|图像)\s*([1-9]\d*)/gu, '<Picture $1>')
    ['replace'](/@\s*视频\s*([1-9]\d*)/gu, '<Video\x20$1>')
    ['replace'](/@\s*(?:声音|音频)\s*([1-9]\d*)/gu, '<Audio $1>');
}
function getAgnesVideo25Policy(_0x28538d = {}) {
  const _0x23c626 = _0x28538d?.['extensions']?.['agnesVideo25'];
  return _0x23c626 && typeof _0x23c626 === 'object' && !Array['isArray'](_0x23c626) ? _0x23c626 : {};
}
function getAgnesVideo25Maximum(_0x10aaa3, _0xf08479, _0x280fa3) {
  const _0x5ee7e5 = Number(_0x10aaa3?.[_0xf08479]);
  return Number['isInteger'](_0x5ee7e5) && _0x5ee7e5 >= 0x0 ? _0x5ee7e5 : _0x280fa3;
}
function collectAgnesVideo25Images({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  selectedSlots: selectedSlots = [],
}) {
  const _0x5893db = [],
    _0xad3173 = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x4953ff = new Set(normalizeInputList(Object['values'](_0xad3173)));
  return (
    selectedSlots['forEach']((_0x322a60) => appendUniqueUrl(_0x5893db, _0xad3173[_0x322a60])),
    normalizeInputList(inputImages)['forEach']((_0x3b8534) => {
      if (!_0x4953ff['has'](_0x3b8534)) appendUniqueUrl(_0x5893db, _0x3b8534);
    }),
    { images: _0x5893db, slotUrls: _0xad3173 }
  );
}
function assertAgnesVideo25Maximum(_0x5d4537, _0x47527b, _0x467f38) {
  if (_0x47527b['length'] <= _0x467f38) return;
  throw new Error(
    'Agnes Video 2.5 ' +
      _0x5d4537 +
      '最多支持 ' +
      _0x467f38 +
      '\x20个，当前传入\x20' +
      _0x47527b['length'] +
      '\x20个',
  );
}
export function agnesVideo25({
  currentBody: _0x3a515f,
  executionManifest: _0x2b0d95,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x1a904e = { ..._0x3a515f },
    _0x527722 = normalizeOptionalIntegerInRange(_0x1a904e['seed']);
  if (_0x527722 === null) delete _0x1a904e['seed'];
  else _0x1a904e['seed'] = _0x527722;
  const _0x377b13 = normalizeAgnesVideo25Mode(_0x1a904e['mode']),
    _0xc357 = normalizeInputList(inputVideos),
    _0x1149b0 = normalizeInputList(inputAudios),
    _0xa05c7f = getAgnesVideo25Policy(_0x2b0d95),
    _0x45aede = getAgnesVideo25Maximum(_0xa05c7f, 'maxReferenceImages', 0x9),
    _0x398493 = getAgnesVideo25Maximum(_0xa05c7f, 'maxReferenceVideos', 0x3),
    _0x291600 = getAgnesVideo25Maximum(_0xa05c7f, 'maxReferenceAudios', 0x3);
  _0x1a904e['mode'] = _0x377b13;
  if (_0x377b13 === 'keyframe') {
    if (_0xc357['length'] > 0x0 || _0x1149b0['length'] > 0x0)
      throw new Error('Agnes\x20Video\x202.5\x20首尾帧模式只接受图片输入');
    const { images: _0x1dc06b, slotUrls: _0x4c7b53 } = collectAgnesVideo25Images({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      selectedSlots: ['firstFrame', 'lastFrame'],
    });
    if (_0x1dc06b['length'] === 0x0) return ((_0x1a904e['mode'] = 'text'), _0x1a904e);
    if (_0x1dc06b['length'] > 0x2) throw new Error('Agnes Video 2.5 首尾帧模式最多支持两张图片');
    const _0x38bf79 = Boolean(_0x4c7b53['firstFrame'] || _0x4c7b53['lastFrame']),
      _0x255930 = String(_0x38bf79 ? _0x4c7b53['firstFrame'] || '' : _0x1dc06b[0x0] || '')['trim'](),
      _0x17ede3 = String(_0x38bf79 ? _0x4c7b53['lastFrame'] || '' : _0x1dc06b[0x1] || '')['trim']();
    if (_0x255930) _0x1a904e['first_frame'] = _0x255930;
    if (_0x17ede3) _0x1a904e['last_frame'] = _0x17ede3;
    return _0x1a904e;
  }
  _0x1a904e['prompt'] = normalizeAgnesVideo25PromptReferences(_0x1a904e['prompt']);
  const { images: _0x406c18 } = collectAgnesVideo25Images({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
    selectedSlots: ['referenceImage'],
  });
  (assertAgnesVideo25Maximum('参考图片', _0x406c18, _0x45aede),
    assertAgnesVideo25Maximum('参考视频', _0xc357, _0x398493),
    assertAgnesVideo25Maximum('参考音频', _0x1149b0, _0x291600));
  if (_0x406c18['length'] === 0x0 && _0xc357['length'] === 0x0 && _0x1149b0['length'] === 0x0)
    throw new Error('Agnes Video 2.5 多模态参考模式至少需要一种参考素材');
  if (_0x406c18['length'] > 0x0) _0x1a904e['images'] = _0x406c18;
  if (_0x1149b0['length'] > 0x0) _0x1a904e['audios'] = _0x1149b0;
  return (
    _0xc357['length'] > 0x0 &&
      (_0x1a904e['videos'] = _0xc357['map']((_0x1127ca) => ({
        url: _0x1127ca,
        start_seconds: 0x0,
        require_audio: ![],
      }))),
    _0x1a904e
  );
}
