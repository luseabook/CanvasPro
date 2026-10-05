import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeOptionalIntegerInRange,
} from './sharedResolverUtils.js';
import { isPublicHttpMediaUrl, uploadModelApiMediaInputs } from '../../mediaInputUploadRouter.js';
import { isConfiguredObjectStorageEnabled } from '../../objectStorageApi.js';
import { convertImageBlobToDataUrl } from '../../../src/services/imagePngConversionService.js';
function isReusableAgnesImageInput(value) {
  const item = String(value || '')['trim']();
  return (
    /^data:image\/[a-z0-9.+-]+;base64,/i['test'](item) ||
    (/^https:\/\//i['test'](item) && isPublicHttpMediaUrl(item))
  );
}
async function resolveAgnesImageInputs(key, index = {}) {
  const list = normalizeInputList(key);
  if (list['length'] === 0) return [];
  if (isConfiguredObjectStorageEnabled())
    return uploadModelApiMediaInputs('image', list, index, { strictUpload: !![] });
  const list2 = [];
  for (const result of list) {
    if (isReusableAgnesImageInput(result)) {
      list2['push'](result);
      continue;
    }
    if (typeof index['loadInputImageBlob'] !== 'function') throw new Error('Agnes 图生图无法读取本地参考图');
    const data = await index['loadInputImageBlob'](result),
      dataUrl = await convertImageBlobToDataUrl(data, result);
    if (!dataUrl) throw new Error('Agnes 图生图无法读取本地参考图');
    list2['push'](dataUrl);
  }
  return list2;
}
export async function agnesImage({ currentBody: currentBody, ctx: ctx }) {
  const args = { ...currentBody },
    list3 = await resolveAgnesImageInputs(args['extra_body']?.['image'], ctx),
    options =
      args['extra_body'] && typeof args['extra_body'] === 'object' && !Array['isArray'](args['extra_body'])
        ? { ...args['extra_body'] }
        : {};
  return (
    delete args['tags'],
    (options['response_format'] = list3['length'] > 0 ? 'b64_json' : 'url'),
    list3['length'] > 0 ? (options['image'] = list3) : delete options['image'],
    Object['keys'](options)['length'] > 0 ? (args['extra_body'] = options) : delete args['extra_body'],
    args
  );
}
function normalizeAgnesVideoFrameCount(target) {
  const source = Number(target);
  if (!Number['isFinite'](source)) return target;
  const next = 49,
    current = 441,
    entry = Math['min'](Math['max'](next, Math['trunc'](source)), current),
    record = Math['round']((entry - 1) / 8) * 8 + 1;
  return Math['min'](current, Math['max'](next, record));
}
function normalizeAgnesVideoFrameRate(payload) {
  const handle = Number(payload);
  if (!Number['isFinite'](handle)) return payload;
  const state = Math['min'](Math['max'](1, Math['trunc'](handle)), 60);
  return state;
}
export function agnesVideo({ currentBody: currentBody2 }) {
  const config = { ...currentBody2 },
    optionalIntegerInRange = normalizeOptionalIntegerInRange(config['seed']);
  if (optionalIntegerInRange === null) delete config['seed'];
  else config['seed'] = optionalIntegerInRange;
  delete config['agnes_video_mode'];
  config['num_frames'] !== undefined &&
    (config['num_frames'] = normalizeAgnesVideoFrameCount(config['num_frames']));
  config['frame_rate'] !== undefined &&
    (config['frame_rate'] = normalizeAgnesVideoFrameRate(config['frame_rate']));
  const list4 = normalizeInputList(config['extra_body']?.['image']),
    image = list4['slice'](0, 2);
  if (image['length'] === 0) return (delete config['image'], delete config['extra_body'], config);
  if (image['length'] === 1) return ((config['image'] = image[0]), delete config['extra_body'], config);
  return ((config['extra_body'] = { image: image, mode: 'keyframes' }), delete config['image'], config);
}
function normalizeAgnesVideo25Mode(scope) {
  const input = String(scope || '')
    ['trim']()
    ['toLowerCase']();
  return input === 'reference' ? 'reference' : 'keyframe';
}
function normalizeAgnesVideo25PromptReferences(output) {
  return String(output || '')
    ['replace'](/@\s*(?:图片|图像)\s*([1-9]\d*)/gu, '<Picture $1>')
    ['replace'](/@\s*视频\s*([1-9]\d*)/gu, '<Video $1>')
    ['replace'](/@\s*(?:声音|音频)\s*([1-9]\d*)/gu, '<Audio $1>');
}
function getAgnesVideo25Policy(options2 = {}) {
  const value2 = options2?.['extensions']?.['agnesVideo25'];
  return value2 && typeof value2 === 'object' && !Array['isArray'](value2) ? value2 : {};
}
function getAgnesVideo25Maximum(value3, value4, value5) {
  const count = Number(value3?.[value4]);
  return Number['isInteger'](count) && count >= 0 ? count : value5;
}
function collectAgnesVideo25Images({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  selectedSlots: selectedSlots = [],
}) {
  const images = [],
    slotUrls = normalizeInputUrlsBySlot(finalUrlsBySlot),
    map = new Set(normalizeInputList(Object['values'](slotUrls)));
  return (
    selectedSlots['forEach']((value6) => appendUniqueUrl(images, slotUrls[value6])),
    normalizeInputList(inputImages)['forEach']((value7) => {
      if (!map['has'](value7)) appendUniqueUrl(images, value7);
    }),
    { images: images, slotUrls: slotUrls }
  );
}
function assertAgnesVideo25Maximum(value8, list5, value9) {
  if (list5['length'] <= value9) return;
  throw new Error(
    'Agnes Video 2.5 ' + value8 + '最多支持 ' + value9 + ' 个，当前传入 ' + list5['length'] + ' 个',
  );
}
export function agnesVideo25({
  currentBody: currentBody3,
  executionManifest: executionManifest,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const value10 = { ...currentBody3 },
    optionalIntegerInRange2 = normalizeOptionalIntegerInRange(value10['seed']);
  if (optionalIntegerInRange2 === null) delete value10['seed'];
  else value10['seed'] = optionalIntegerInRange2;
  const agnesVideo25Mode = normalizeAgnesVideo25Mode(value10['mode']),
    list6 = normalizeInputList(inputVideos),
    list7 = normalizeInputList(inputAudios),
    agnesVideo25Policy = getAgnesVideo25Policy(executionManifest),
    agnesVideo25Maximum = getAgnesVideo25Maximum(agnesVideo25Policy, 'maxReferenceImages', 9),
    agnesVideo25Maximum2 = getAgnesVideo25Maximum(agnesVideo25Policy, 'maxReferenceVideos', 3),
    agnesVideo25Maximum3 = getAgnesVideo25Maximum(agnesVideo25Policy, 'maxReferenceAudios', 3);
  value10['mode'] = agnesVideo25Mode;
  if (agnesVideo25Mode === 'keyframe') {
    if (list6['length'] > 0 || list7['length'] > 0)
      throw new Error('Agnes Video 2.5 首尾帧模式只接受图片输入');
    const { images: images2, slotUrls: slotUrls2 } = collectAgnesVideo25Images({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      selectedSlots: ['firstFrame', 'lastFrame'],
    });
    if (images2['length'] === 0) return ((value10['mode'] = 'text'), value10);
    if (images2['length'] > 2) throw new Error('Agnes Video 2.5 首尾帧模式最多支持两张图片');
    const value11 = Boolean(slotUrls2['firstFrame'] || slotUrls2['lastFrame']),
      value12 = String(value11 ? slotUrls2['firstFrame'] || '' : images2[0] || '')['trim'](),
      value13 = String(value11 ? slotUrls2['lastFrame'] || '' : images2[1] || '')['trim']();
    if (value12) value10['first_frame'] = value12;
    if (value13) value10['last_frame'] = value13;
    return value10;
  }
  value10['prompt'] = normalizeAgnesVideo25PromptReferences(value10['prompt']);
  const { images: images3 } = collectAgnesVideo25Images({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
    selectedSlots: ['referenceImage'],
  });
  (assertAgnesVideo25Maximum('参考图片', images3, agnesVideo25Maximum),
    assertAgnesVideo25Maximum('参考视频', list6, agnesVideo25Maximum2),
    assertAgnesVideo25Maximum('参考音频', list7, agnesVideo25Maximum3));
  if (images3['length'] === 0 && list6['length'] === 0 && list7['length'] === 0)
    throw new Error('Agnes Video 2.5 多模态参考模式至少需要一种参考素材');
  if (images3['length'] > 0) value10['images'] = images3;
  if (list7['length'] > 0) value10['audios'] = list7;
  return (
    list6['length'] > 0 &&
      (value10['videos'] = list6['map']((url) => ({
        url: url,
        start_seconds: 0,
        require_audio: ![],
      }))),
    value10
  );
}
