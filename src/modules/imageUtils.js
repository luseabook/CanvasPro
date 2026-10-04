import { THUMBNAIL, IMAGE_COMPRESSION } from '../utils/constants.js';
import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
export async function generateThumbnail(enabled, value = THUMBNAIL.maxWidth, item = THUMBNAIL.maxHeight) {
  if (!enabled) return '';
  return new Promise((handler) => {
    const image = new Image();
    ((image.crossOrigin = 'anonymous'),
      (image.onload = () => {
        const box = document.createElement('canvas'),
          ctx = box.getContext('2d');
        let key = image.naturalWidth,
          index = image.naturalHeight;
        key > index
          ? key > value && ((index *= value / key), (key = value))
          : index > item && ((key *= item / index), (index = item));
        ((box.width = key), (box.height = index), ctx.drawImage(image, 0, 0, key, index));
        const result = box.toDataURL(THUMBNAIL.format, THUMBNAIL.quality);
        ((box.width = 0), (box.height = 0), handler(result));
      }),
      (image.onerror = () => {
        handler('');
      }),
      (image.src = enabled));
  });
}
export async function compressImage(
  data,
  options = IMAGE_COMPRESSION.maxDimension,
  target = IMAGE_COMPRESSION.quality,
) {
  return new Promise((handler2, handler3) => {
    const image2 = new Image();
    ((image2.crossOrigin = 'Anonymous'),
      (image2.onload = () => {
        let { width: width, height: height } = image2;
        (width > options || height > options) &&
          (width > height
            ? ((height = Math.round((height * options) / width)), (width = options))
            : ((width = Math.round((width * options) / height)), (height = options)));
        const box2 = document.createElement('canvas');
        ((box2.width = width), (box2.height = height));
        const ctx2 = box2.getContext('2d');
        (ctx2.drawImage(image2, 0, 0, width, height),
          box2.toBlob(
            (source) => {
              source ? handler2(source) : handler3(new Error('Canvas toBlob failed'));
            },
            IMAGE_COMPRESSION.format,
            target,
          ));
      }),
      (image2.onerror = (next) => {
        (console.warn('[imageUtils.js] 跨域或加载失败，跳过本地压缩', next), handler3(next));
      }),
      fetchRemoteBlob(data)
        .then((current) => {
          image2.src = URL.createObjectURL(current);
        })
        .catch((entry) => {
          image2.src = data;
        }));
  });
}
