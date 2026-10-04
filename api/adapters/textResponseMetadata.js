import { normalizeTextResultSources, normalizeTextToolUsage } from '../../src/utils/textResultMetadata.js';
import { normalizeTextResultImages, parseTextResultImages } from '../../src/utils/textResultImages.js';
export function extractTextResponseMetadata(value, images) {
  if (images['responseMapping']?.['includeSources'] !== !![]) return {};
  const item = Array['isArray'](value?.['output']) ? value : value?.['data'] || value,
    key = (Array['isArray'](item?.['output']) ? item['output'] : [])
      ['filter'](
        (index) =>
          (index?.['type'] === 'message' || index?.['role'] === 'assistant') &&
          Array['isArray'](index?.['content']),
      )
      ['at'](-0x1),
    result = (Array['isArray'](key?.['content']) ? key['content'] : [])
      ['filter']((data) => data['type'] === 'output_text')
      ['flatMap']((options) => (Array['isArray'](options['annotations']) ? options['annotations'] : []))
      ['filter']((target) => target?.['type'] === 'url_citation'),
    imageSearchRequested =
      images['body']?.['tools']?.['some']((source) =>
        ['web_search_image', 'image_search']['includes'](source['type']),
      ) === !![],
    next =
      (key?.['content'] || [])
        ['filter']((current) => current['type'] === 'output_text')
        ['map']((response) => response['text'] || '')
        ['join']('\x0a') ||
      item?.['output_text'] ||
      '';
  return {
    images:
      images['responseMapping']['imageResults'] === 'markdown' && imageSearchRequested
        ? normalizeTextResultImages(parseTextResultImages(next))
        : [],
    imageSearchRequested: imageSearchRequested,
    sources: normalizeTextResultSources(result),
    toolUsage: normalizeTextToolUsage(item?.['usage']?.['x_tools']),
    webSearchRequested:
      images['body']?.['tools']?.['some']((entry) => entry['type'] === 'web_search') === !![],
  };
}
