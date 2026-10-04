import { resolveImageNodeOriginalUrl, resolveImageNodePreviewUrl } from './imageNodeImageUrl.js';
export function resolveImageCropSourceUrl(options = {}) {
  return resolveImageNodePreviewUrl(options) || resolveImageNodeOriginalUrl(options);
}
