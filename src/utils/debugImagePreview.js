import { localPathToUrl } from './localMediaPath.js';
const IMAGE_FIELDS = new Set([
  'imageUrls',
  'inputUrls',
  'images',
  'referenceImages',
  'imageUrl',
  'image_url',
  'image',
  'firstFrameUrl',
  'lastFrameUrl',
  'startImageUrl',
  'endImageUrl',
  'maskUrl',
]);
export function resolveDebugImageSource(enabled) {
  if (typeof enabled !== 'string' || !enabled || /\*\*\*/['test'](enabled)) return '';
  if (/\.(?:mp4|webm|mov|mp3|wav|ogg|flac)(?:[?#]|$)/i['test'](enabled)) return '';
  if (
    /^https?:\/\//i['test'](enabled) ||
    /^blob:https?:\/\//i['test'](enabled) ||
    /^data:image\/(?:png|jpeg|jpg|webp|gif|avif|svg\+xml)[;,]/i['test'](enabled)
  )
    return enabled;
  return localPathToUrl(enabled);
}
export function buildDebugJsonPreview(value, { imageContext: imageContext = ![] } = {}) {
  const content = JSON['stringify'](value, null, 2) ?? '',
    images = [];
  let end = 0;
  function run(list, path, item = ![], label = 0) {
    if (Array['isArray'](list))
      list['forEach']((key, index) => run(key, path + '[' + index + ']', item, index + 1));
    else {
      if (list && typeof list === 'object')
        Object['entries'](list)['forEach'](([result, data]) => {
          if (data === undefined || typeof data === 'function') return;
          const list2 = JSON['stringify'](result) + ':';
          ((end = content['indexOf'](list2, end) + list2['length']),
            run(
              data,
              path ? path + '.' + result : result,
              IMAGE_FIELDS['has'](result) || (item && ['url', 'ref']['includes'](result)),
              Number(list['slot']) || label,
            ));
        });
      else {
        const list3 = JSON['stringify'](list) ?? 'null',
          start = content['indexOf'](list3, end);
        end = start + list3['length'];
        const src = item ? resolveDebugImageSource(list) : '';
        if (src && start >= 0)
          images['push']({
            start: start,
            end: end,
            src: src,
            path: path,
            label: label ? '图' + label : path,
          });
      }
    }
  }
  if (content) run(JSON['parse'](content), '', imageContext);
  return { content: content, images: images };
}
