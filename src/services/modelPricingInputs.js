import { getAssetInputRefsFromNodeData } from '../modules/promptAssetInputRefs.js';
import { resolveGenerationInputImageUrl } from './imageReferenceUrlService.js';
import { resolveCanvasVideoUrl, resolveCanvasAudioUrl } from './canvasMediaLocalService.js';
export function resolveModelPricingInputs(_0x2d66b2, _0x1a3a88 = [], _0x1f242d = {}) {
  const _0x4039d1 = [...getAssetInputRefsFromNodeData(_0x2d66b2)],
    _0x2e00ac = (_0x2846be, _0x2dab94, _0x1ad2f5 = '') => {
      const _0x2522bf = typeof _0x2dab94 === 'string' ? _0x2dab94 : _0x2dab94?.['url'];
      if (_0x2522bf)
        _0x4039d1['push']({ type: _0x2846be, url: _0x2522bf, refSlot: _0x2dab94?.['refSlot'] || _0x1ad2f5 });
    };
  for (const [_0x1fd541, _0x438876] of Object['entries']({
    image: ['inputUrls', 'image_urls', 'inputImageUrls', 'referenceImageUrls', 'imageRefs'],
    video: ['videoUrls', 'videoRefs'],
    audio: ['audioUrls', 'audioRefs'],
  })) {
    for (const _0x43dc25 of _0x438876)
      for (const _0x23198a of Array['isArray'](_0x2d66b2[_0x43dc25]) ? _0x2d66b2[_0x43dc25] : [])
        _0x2e00ac(_0x1fd541, _0x23198a);
  }
  for (const _0x2f1b16 of _0x1a3a88) {
    const _0x8e2970 = _0x1f242d[_0x2f1b16['sourceId']],
      _0x138bce = String(_0x8e2970?.['type'] || '');
    if (_0x138bce['includes']('image'))
      _0x2e00ac('image', resolveGenerationInputImageUrl(_0x8e2970), _0x2f1b16['refSlot']);
    else {
      if (_0x138bce['includes']('video'))
        _0x2e00ac('video', resolveCanvasVideoUrl(_0x8e2970), _0x2f1b16['refSlot']);
      else {
        if (_0x138bce['includes']('audio'))
          _0x2e00ac('audio', resolveCanvasAudioUrl(_0x8e2970), _0x2f1b16['refSlot']);
      }
    }
  }
  const _0x1688cf = new Set();
  return _0x4039d1['filter']((_0x7777b1) => {
    if (!['image', 'video', 'audio']['includes'](_0x7777b1['type']) || !_0x7777b1['url']) return ![];
    const _0x3d9d9c = _0x7777b1['type'] + '|' + (_0x7777b1['refSlot'] || '') + '|' + _0x7777b1['url'];
    if (_0x1688cf['has'](_0x3d9d9c)) return ![];
    return (_0x1688cf['add'](_0x3d9d9c), !![]);
  });
}
