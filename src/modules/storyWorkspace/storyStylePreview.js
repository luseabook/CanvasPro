export const STORY_STYLE_FALLBACK_URL = new URL('../../../images/story-style-placeholder.svg', import.meta.url).href;
/** Optional preview assets are not shipped in every source distribution. Never show broken image glyphs. */
export function handleStoryStyleThumbnailError(event) {
  const image = event?.target;
  if (!image?.matches?.('img[data-story-style-thumbnail]')) return false;
  if (image.dataset.storyStyleFallback === 'true') {
    image.hidden = true; // No retry loop if the fallback itself is unavailable.
    return true;
  }
  image.dataset.storyStyleFallback = 'true';
  image.title = '原始风格预览图未提供，风格选择与提示词仍可使用';
  image.src = STORY_STYLE_FALLBACK_URL;
  return true;
}
