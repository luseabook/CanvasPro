import { normalizeTextResultSources, normalizeTextToolUsage } from '../../src/utils/textResultMetadata.js';
import { normalizeTextResultImages, parseTextResultImages } from '../../src/utils/textResultImages.js';
export function extractTextResponseMetadata(_0x45bcaf, _0x46ca2e) {
  if (_0x46ca2e['responseMapping']?.['includeSources'] !== !![]) return {};
  const _0x1358e5 = Array['isArray'](_0x45bcaf?.['output']) ? _0x45bcaf : _0x45bcaf?.['data'] || _0x45bcaf,
    _0x335289 = (Array['isArray'](_0x1358e5?.['output']) ? _0x1358e5['output'] : [])
      ['filter'](
        (_0x544e35) =>
          (_0x544e35?.['type'] === 'message' || _0x544e35?.['role'] === 'assistant') &&
          Array['isArray'](_0x544e35?.['content']),
      )
      ['at'](-0x1),
    _0x2c106e = (Array['isArray'](_0x335289?.['content']) ? _0x335289['content'] : [])
      ['filter']((_0xb23bd) => _0xb23bd['type'] === 'output_text')
      ['flatMap']((_0x4b6f70) => (Array['isArray'](_0x4b6f70['annotations']) ? _0x4b6f70['annotations'] : []))
      ['filter']((_0x159627) => _0x159627?.['type'] === 'url_citation'),
    _0x5d6c39 =
      _0x46ca2e['body']?.['tools']?.['some']((_0x4a4491) =>
        ['web_search_image', 'image_search']['includes'](_0x4a4491['type']),
      ) === !![],
    _0x29f6eb =
      (_0x335289?.['content'] || [])
        ['filter']((_0x38a595) => _0x38a595['type'] === 'output_text')
        ['map']((_0x2be61a) => _0x2be61a['text'] || '')
        ['join']('\x0a') ||
      _0x1358e5?.['output_text'] ||
      '';
  return {
    images:
      _0x46ca2e['responseMapping']['imageResults'] === 'markdown' && _0x5d6c39
        ? normalizeTextResultImages(parseTextResultImages(_0x29f6eb))
        : [],
    imageSearchRequested: _0x5d6c39,
    sources: normalizeTextResultSources(_0x2c106e),
    toolUsage: normalizeTextToolUsage(_0x1358e5?.['usage']?.['x_tools']),
    webSearchRequested:
      _0x46ca2e['body']?.['tools']?.['some']((_0x50c7ab) => _0x50c7ab['type'] === 'web_search') === !![],
  };
}
