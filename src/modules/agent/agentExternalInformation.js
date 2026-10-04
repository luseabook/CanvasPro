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
function stripUrlPunctuation(value = '') {
  return String(value || '')['replace'](/[),.;!?，。；！？、）】》」』]+$/u, '');
}
function truncateText(item, key) {
  const list = String(item || '')
    ['replace'](/\u0000/g, '')
    ['trim']();
  return list['length'] <= key ? list : list['slice'](0x0, Math['max'](0x0, key - 0x3)) + '...';
}
function normalizeCount(index, result = 0x0) {
  const data = Number(index);
  return Number['isFinite'](data) ? Math['max'](0x0, data) : result;
}
export function extractAgentExternalUrls(options = '') {
  const list2 = String(options || '')['match'](URL_PATTERN) || [];
  return [...new Set(list2['map'](stripUrlPunctuation)['filter'](Boolean))]['slice'](
    0x0,
    AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT,
  );
}
export function detectAgentExternalInformationIntent(target = '') {
  const source = String(target || '')['trim'](),
    requests = extractAgentExternalUrls(source);
  if (requests['length'] === 0x0 || NEGATED_READ_PATTERNS['some']((next) => next['test'](source)))
    return null;
  const current = source['replace'](URL_PATTERN, '')
      ['replace'](/[:：,，。.!！?？]/g, '\x20')
      ['trim'](),
    reason = READ_INTENT_PATTERNS['some']((entry) => entry['test'](source));
  if (!reason && !SHORT_READ_INTENT_PATTERN['test'](current)) return null;
  return {
    toolId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
    requests: requests['map']((url) => ({ url: url })),
    reason: reason ? 'explicit-url-reading' : 'url-only-message',
  };
}
export function createAgentExternalInformationRequests({
  message: message = '',
  documentFiles: documentFiles = [],
} = {}) {
  const list3 = (Array['isArray'](documentFiles) ? documentFiles : [])
      ['filter']((error) => error && String(error['name'] || '')['trim']())
      ['slice'](0x0, AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT)
      ['map']((file) => ({
        toolId: AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
        args: { file: file },
        sourceKind: 'document',
      })),
    toolId = detectAgentExternalInformationIntent(message);
  toolId &&
    list3['push'](
      ...toolId['requests']['map']((args) => ({
        toolId: toolId['toolId'],
        args: args,
        sourceKind: 'url',
      })),
    );
  const requests2 = list3['slice'](0x0, AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT);
  if (requests2['length'] === 0x0) return null;
  return {
    reason: [
      requests2['some']((record) => record['sourceKind'] === 'document') ? 'attached-document' : '',
      requests2['some']((payload) => payload['sourceKind'] === 'url') ? toolId?.['reason'] || '' : '',
    ]
      ['filter'](Boolean)
      ['join']('+'),
    requests: requests2,
  };
}
export function compactAgentExternalInformationForPrompt(
  value2 = null,
  { maxContentChars: maxContentChars = AGENT_EXTERNAL_INFORMATION_CONTENT_LIMIT } = {},
) {
  const list4 = Array['isArray'](value2?.['sources']) ? value2['sources'] : [],
    list5 = list4['slice'](0x0, AGENT_EXTERNAL_INFORMATION_SOURCE_LIMIT),
    handle = Math['max'](0x3e8, Math['floor'](maxContentChars / Math['max'](0x1, list5['length'])));
  return list5['map']((truncated = {}, state) => {
    const sourceKind = truncated['sourceKind'] === 'document' ? 'document' : 'url',
      list6 = String(truncated['content'] || '')
        ['replace'](/\u0000/g, '')
        ['trim'](),
      displayName = truncateText(truncated['displayName'] || truncated['fileName'], 0xff)['replace'](
        /\s+/g,
        '\x20',
      ),
      finalUrl = truncateText(truncated['finalUrl'] || truncated['url'], 0x7d0);
    return {
      sourceId: String(truncated['sourceId'] || 'external-source-' + (state + 0x1))['slice'](0x0, 0x50),
      toolId: String(
        truncated['toolId'] ||
          (sourceKind === 'document' ? AGENT_EXTERNAL_DOCUMENT_TOOL_ID : AGENT_EXTERNAL_INFORMATION_TOOL_ID),
      )['slice'](0x0, 0x50),
      sourceKind: sourceKind,
      ...(sourceKind === 'url'
        ? {
            requestedUrl: truncateText(truncated['requestedUrl'] || truncated['url'], 0x7d0),
            finalUrl: finalUrl,
          }
        : {
            displayName: displayName,
            extension: truncateText(truncated['extension'], 0xc),
            characterCount: normalizeCount(truncated['characterCount'], list6['length']),
            ...(Number['isFinite'](Number(truncated['pageCount']))
              ? { pageCount: normalizeCount(truncated['pageCount']) }
              : {}),
            warnings: (Array['isArray'](truncated['warnings']) ? truncated['warnings'] : [])
              ['map']((config) => truncateText(config, 0x12c))
              ['filter'](Boolean)
              ['slice'](0x0, 0x8),
          }),
      title: truncateText(truncated['title'] || displayName, 0x12c),
      contentType: truncateText(truncated['contentType'], 0xa0),
      content: truncateText(list6, handle),
      truncated: truncated['truncated'] === !![] || list6['length'] > handle,
      trust: 'untrusted_external',
    };
  })['filter'](
    (scope) =>
      scope['content'] && (scope['sourceKind'] === 'document' ? scope['displayName'] : scope['finalUrl']),
  );
}
