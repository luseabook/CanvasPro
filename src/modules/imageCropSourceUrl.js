import { resolveImageNodeOriginalUrl, resolveImageNodePreviewUrl } from './imageNodeImageUrl.js';
export function resolveImageCropSourceUrl(_0xf995ee = {}) {
  return resolveImageNodePreviewUrl(_0xf995ee) || resolveImageNodeOriginalUrl(_0xf995ee);
}
