import { AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT, AGENT_EXTERNAL_DOCUMENT_TOOL_ID } from './agentDocumentInput.js';
export const AGENT_EXTERNAL_INFORMATION_TOOL_ID = 'web.read_url';
export const AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT = 0x3;
export const AGENT_EXTERNAL_INFORMATION_CONTENT_LIMIT = 0x36b0;
const URL_PATTERN = /https?:\/\/[^\s<>"'，。；！？、）】》」』]+/giu,
  READ_INTENT_PATTERNS = [
    /(?:阅读|读取|打开|查看|看看|总结|概括|分析|提取|了解|检查|根据|参考).{0,20}(?:网页|页面|网址|链接|url)/i,
    /(?:网页|页面|网址|链接|url).{0,20}(?:内容|正文|说了什么|讲了什么|总结|概括|分析|提取|阅读|读取|打开|查看)/i,
    /\b(?:read|open|inspect|review|summari[sz]e|analy[sz]e|extract|check)\b.{0,40}\b(?:url|link|page|website|article)\b/i,
    /\b(?:url|link|page|website|article)\b.{0,40}\b(?:read|open|inspect|review|summari[sz]e|analy[sz]e|extract|say)\b/i,
    /(?:阅读|读取|打开|查看|看看|总结|概括|分析|提取|了解|检查)/i,
    /\b(?:read|open|inspect|review|summari[sz]e|analy[sz]e|extract|check)\b/i,
  ],
  NEGATED_READ_PATTERNS = [
    /(?:不要|不用|无需|别)(?:打开|读取|访问|查看)(?:网页|页面|网址|链接|url)?/i,
    /\b(?:do not|don't|dont|no need to)\s+(?:open|read|visit|inspect)\b/i,
  ],
  SHORT_READ_INTENT_PATTERN =
    /^(?:(?:请)?(?:帮我)?(?:看看|看一下|看下|读一下|读下|阅读|总结|分析|打开|检查)|(?:please\s+)?(?:read|open|check|summari[sz]e|analy[sz]e)(?:\s+this)?)?$/i;
function stripUrlPunctuation(_0x53b1ce = '') {
  return String(_0x53b1ce || '')['replace'](/[),.;!?，。；！？、）】》」』]+$/u, '');
}
function truncateText(_0x34c98e, _0x327918) {
  const _0x34fa9a = String(_0x34c98e || '')
    ['replace'](/\u0000/g, '')
    ['trim']();
  return _0x34fa9a['length'] <= _0x327918
    ? _0x34fa9a
    : _0x34fa9a['slice'](0x0, Math['max'](0x0, _0x327918 - 0x3)) + '...';
}
function normalizeCount(_0x5aeb99, _0x23b080 = 0x0) {
  const _0x4d5c90 = Number(_0x5aeb99);
  return Number['isFinite'](_0x4d5c90) ? Math['max'](0x0, _0x4d5c90) : _0x23b080;
}
export function extractAgentExternalUrls(_0x478e7e = '') {
  const _0xb49cd6 = String(_0x478e7e || '')['match'](URL_PATTERN) || [];
  return [...new Set(_0xb49cd6['map'](stripUrlPunctuation)['filter'](Boolean))]['slice'](
    0x0,
    AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT,
  );
}
export function detectAgentExternalInformationIntent(_0xc4fe09 = '') {
  const _0x194c87 = String(_0xc4fe09 || '')['trim'](),
    _0x191dd9 = extractAgentExternalUrls(_0x194c87);
  if (
    _0x191dd9['length'] === 0x0 ||
    NEGATED_READ_PATTERNS['some']((_0x5dc713) => _0x5dc713['test'](_0x194c87))
  )
    return null;
  const _0xe324dc = _0x194c87['replace'](URL_PATTERN, '')
      ['replace'](/[:：,，。.!！?？]/g, '\x20')
      ['trim'](),
    _0x5d6c87 = READ_INTENT_PATTERNS['some']((_0x2742f9) => _0x2742f9['test'](_0x194c87));
  if (!_0x5d6c87 && !SHORT_READ_INTENT_PATTERN['test'](_0xe324dc)) return null;
  return {
    toolId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
    requests: _0x191dd9['map']((_0x4e98da) => ({ url: _0x4e98da })),
    reason: _0x5d6c87 ? 'explicit-url-reading' : 'url-only-message',
  };
}
export function createAgentExternalInformationRequests({
  message: message = '',
  documentFiles: documentFiles = [],
} = {}) {
  const _0x429614 = (Array['isArray'](documentFiles) ? documentFiles : [])
      ['filter']((_0x185583) => _0x185583 && String(_0x185583['name'] || '')['trim']())
      ['slice'](0x0, AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT)
      ['map']((_0x4485c7) => ({
        toolId: AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
        args: { file: _0x4485c7 },
        sourceKind: 'document',
      })),
    _0x5637da = detectAgentExternalInformationIntent(message);
  _0x5637da &&
    _0x429614['push'](
      ..._0x5637da['requests']['map']((_0x1b001b) => ({
        toolId: _0x5637da['toolId'],
        args: _0x1b001b,
        sourceKind: 'url',
      })),
    );
  const _0x3c4b03 = _0x429614['slice'](0x0, AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT);
  if (_0x3c4b03['length'] === 0x0) return null;
  return {
    reason: [
      _0x3c4b03['some']((_0x3f0060) => _0x3f0060['sourceKind'] === 'document') ? 'attached-document' : '',
      _0x3c4b03['some']((_0x371ca0) => _0x371ca0['sourceKind'] === 'url') ? _0x5637da?.['reason'] || '' : '',
    ]
      ['filter'](Boolean)
      ['join']('+'),
    requests: _0x3c4b03,
  };
}
export function compactAgentExternalInformationForPrompt(
  _0x43df28 = null,
  { maxContentChars: maxContentChars = AGENT_EXTERNAL_INFORMATION_CONTENT_LIMIT } = {},
) {
  const _0x49ff9f = Array['isArray'](_0x43df28?.['sources']) ? _0x43df28['sources'] : [],
    _0x86bb28 = _0x49ff9f['slice'](0x0, AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT),
    _0xd29a2f = Math['max'](0x3e8, Math['floor'](maxContentChars / Math['max'](0x1, _0x86bb28['length'])));
  return _0x86bb28['map']((_0x35478 = {}, _0x3b6070) => {
    const _0x50b7e3 = _0x35478['sourceKind'] === 'document' ? 'document' : 'url',
      _0x2423a0 = String(_0x35478['content'] || '')
        ['replace'](/\u0000/g, '')
        ['trim'](),
      _0x46d3a1 = truncateText(_0x35478['displayName'] || _0x35478['fileName'], 0xff)['replace'](
        /\s+/g,
        '\x20',
      ),
      _0x24b692 = truncateText(_0x35478['finalUrl'] || _0x35478['url'], 0x7d0);
    return {
      sourceId: String(_0x35478['sourceId'] || 'external-source-' + (_0x3b6070 + 0x1))['slice'](0x0, 0x50),
      toolId: String(
        _0x35478['toolId'] ||
          (_0x50b7e3 === 'document' ? AGENT_EXTERNAL_DOCUMENT_TOOL_ID : AGENT_EXTERNAL_INFORMATION_TOOL_ID),
      )['slice'](0x0, 0x50),
      sourceKind: _0x50b7e3,
      ...(_0x50b7e3 === 'url'
        ? {
            requestedUrl: truncateText(_0x35478['requestedUrl'] || _0x35478['url'], 0x7d0),
            finalUrl: _0x24b692,
          }
        : {
            displayName: _0x46d3a1,
            extension: truncateText(_0x35478['extension'], 0xc),
            characterCount: normalizeCount(_0x35478['characterCount'], _0x2423a0['length']),
            ...(Number['isFinite'](Number(_0x35478['pageCount']))
              ? { pageCount: normalizeCount(_0x35478['pageCount']) }
              : {}),
            warnings: (Array['isArray'](_0x35478['warnings']) ? _0x35478['warnings'] : [])
              ['map']((_0x2936d3) => truncateText(_0x2936d3, 0x12c))
              ['filter'](Boolean)
              ['slice'](0x0, 0x8),
          }),
      title: truncateText(_0x35478['title'] || _0x46d3a1, 0x12c),
      contentType: truncateText(_0x35478['contentType'], 0xa0),
      content: truncateText(_0x2423a0, _0xd29a2f),
      truncated: _0x35478['truncated'] === !![] || _0x2423a0['length'] > _0xd29a2f,
      trust: 'untrusted_external',
    };
  })['filter'](
    (_0x21dd1c) =>
      _0x21dd1c['content'] &&
      (_0x21dd1c['sourceKind'] === 'document' ? _0x21dd1c['displayName'] : _0x21dd1c['finalUrl']),
  );
}
