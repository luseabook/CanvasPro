import { getAssetInputRefsFromNodeData } from '../modules/promptAssetInputRefs.js';
import { resolveGenerationInputImageUrl } from './imageReferenceUrlService.js';
import { resolveCanvasVideoUrl, resolveCanvasAudioUrl } from './canvasMediaLocalService.js';
export function resolveModelPricingInputs(value, item = [], key = {}) {
  const list = [...getAssetInputRefsFromNodeData(value)],
    handler = (type, refSlot, index = '') => {
      const url = typeof refSlot === 'string' ? refSlot : refSlot?.['url'];
      if (url) list['push']({ type: type, url: url, refSlot: refSlot?.['refSlot'] || index });
    };
  for (const [result, data] of Object['entries']({
    image: ['inputUrls', 'image_urls', 'inputImageUrls', 'referenceImageUrls', 'imageRefs'],
    video: ['videoUrls', 'videoRefs'],
    audio: ['audioUrls', 'audioRefs'],
  })) {
    for (const options of data)
      for (const target of Array['isArray'](value[options]) ? value[options] : []) handler(result, target);
  }
  for (const source of item) {
    const next = key[source['sourceId']],
      list2 = String(next?.['type'] || '');
    if (list2['includes']('image')) handler('image', resolveGenerationInputImageUrl(next), source['refSlot']);
    else {
      if (list2['includes']('video')) handler('video', resolveCanvasVideoUrl(next), source['refSlot']);
      else {
        if (list2['includes']('audio')) handler('audio', resolveCanvasAudioUrl(next), source['refSlot']);
      }
    }
  }
  const map = new Set();
  return list['filter']((response) => {
    if (!['image', 'video', 'audio']['includes'](response['type']) || !response['url']) return false;
    const current = response['type'] + '|' + (response['refSlot'] || '') + '|' + response['url'];
    if (map['has'](current)) return false;
    return (map['add'](current), true);
  });
}
