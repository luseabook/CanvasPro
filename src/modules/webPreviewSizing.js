export const WEB_PREVIEW_MIN_WIDTH = 0x400;
export const WEB_PREVIEW_MIN_HEIGHT = 0x240;
export const WEB_PREVIEW_MIN_SIZE = Object.freeze({
  width: WEB_PREVIEW_MIN_WIDTH,
  height: WEB_PREVIEW_MIN_HEIGHT,
});
export function clampWebPreviewNodeSize(box = {}) {
  return {
    width: Math.max(WEB_PREVIEW_MIN_WIDTH, Number(box.width) || 0),
    height: Math.max(WEB_PREVIEW_MIN_HEIGHT, Number(box.height) || 0),
  };
}
