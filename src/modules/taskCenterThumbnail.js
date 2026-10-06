import { localPathToUrl } from '../utils/localMediaPath.js';
const STILL_IMAGE = /\.(?:png|jpe?g|webp|avif|bmp)$/i;
export function resolveTaskCenterThumbnail(enabled, value = '') {
  if (!enabled || typeof enabled !== 'object') return null;
  const item = ['images', 'videos', 'audios'].find(
      (key) => Array.isArray(enabled[key]) && enabled[key].length,
    ),
    count = item ? enabled[item] : [enabled],
    index = count[0] || {},
    kind = item
      ? { images: 'image', videos: 'video', audios: 'audio' }[item]
      : /video/.test(value)
        ? 'video'
        : /audio/.test(value)
          ? 'audio'
          : /image|appearance/.test(value)
            ? 'image'
            : 'text',
    list = [
      'thumbLocalPath',
      'thumbnailLocalPath',
      'posterLocalPath',
      'coverLocalPath',
      'thumbUrl',
      'thumbnailUrl',
      'posterUrl',
      'coverUrl',
    ],
    src =
      list.map((result) => localPathToUrl(index[result])).find((data) => STILL_IMAGE.test(data)) ||
      '';
  return { src: src, kind: kind, count: count.length };
}
