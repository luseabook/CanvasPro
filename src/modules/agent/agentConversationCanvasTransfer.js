const TEXT_NODE_TRANSFER_PATTERNS = Object['freeze']([
    /(?:放到|放进|放入|写入|写进|保存到|添加到).{0,16}画布.{0,12}(?:文本|文字).{0,4}节点/iu,
    /(?:放到|放进|放入|写入|写进|保存到|添加到).{0,12}(?:文本|文字).{0,4}节点/iu,
    /\b(?:put|place|save|write|add)\b.{0,40}\b(?:canvas|text node)\b/iu,
  ]),
  SELECTED_PROMPT_TRANSFER_PATTERNS = Object['freeze']([
    /(?:把|将|用).{0,24}(?:填入|写入|写进|放到|放进|放入|替换|覆盖|设为|追加到|补充到).{0,16}(?:选中|当前|这个|该).{0,12}节点.{0,6}(?:的)?(?:提示词|prompt)/iu,
    /(?:把|将).{0,8}(?:选中|当前|这个|该).{0,12}节点.{0,6}(?:的)?(?:提示词|prompt).{0,12}(?:改成|换成|替换为|设为).{0,16}(?:第\s*[一二三四五六七八九十\d]+\s*版|这版|文案|内容|它)/iu,
    /\b(?:put|place|write|save|insert|add|append|replace)\b.{0,40}\b(?:copy|draft|version|text|it|this)\b.{0,40}\b(?:selected|current)\b.{0,16}\bnode(?:'s)?\b.{0,12}\bprompt\b/iu,
  ]),
  APPEND_PROMPT_PATTERN = /追加|补充|append|add\s+to/iu,
  VERSION_NUMBER_MAP = Object['freeze']({
    一: 0x1,
    二: 0x2,
    三: 0x3,
    四: 0x4,
    五: 0x5,
    六: 0x6,
    七: 0x7,
    八: 0x8,
    九: 0x9,
    十: 0xa,
  });
function parseVersionNumber(value = '') {
  const item = String(value || '')['trim']();
  if (/^\d+$/['test'](item)) return Number(item);
  return VERSION_NUMBER_MAP[item] || 0x0;
}
function getRequestedVersion(key = '') {
  const index = String(key || '')['match'](/第\s*([一二三四五六七八九十\d]+)\s*版/iu);
  return index ? parseVersionNumber(index[0x1]) : 0x0;
}
function collectVersionBlocks(result = '') {
  const enabled = String(result || '')['trim']();
  if (!enabled) return [];
  const data = enabled['split'](/\r?\n/),
    list = [];
  let options = null;
  for (const target of data) {
    const source = target['match'](
      /^\s*(?:(?:修改|调整|优化|改写)后(?:的)?\s*)?(?:第\s*([一二三四五六七八九十\d]+)\s*版|([1-9]\d*)[.、])\s*[：:]?\s*(.*)$/u,
    );
    if (source) {
      if (options) list['push'](options);
      options = {
        version: parseVersionNumber(source[0x1] || source[0x2]),
        lines: [target['trim']()],
      };
    } else options && options['lines']['push'](target);
  }
  if (options) list['push'](options);
  return list;
}
function extractVersionBlock(next = '', count = 0x0) {
  const enabled2 = String(next || '')['trim']();
  if (!enabled2 || count <= 0x0) return enabled2;
  const versionBlocks = collectVersionBlocks(enabled2)['find']((current) => current['version'] === count);
  return versionBlocks ? versionBlocks['lines']['join']('\x0a')['trim']() : enabled2;
}
function getAssistantText(error = {}) {
  return String(error['content'] || error['reply'] || error['message'] || error['question'] || '')['trim']();
}
function resolveSourceEntry(list2 = [], count2 = 0x0) {
  if (count2 > 0x0)
    for (let count3 = list2['length'] - 0x1; count3 >= 0x0; count3 -= 0x1) {
      const entry = list2[count3],
        content = collectVersionBlocks(getAssistantText(entry))['find'](
          (record) => record['version'] === count2,
        );
      if (content) return { entry: entry, content: content['lines']['join']('\x0a')['trim']() };
    }
  const entry2 = list2['at'](-0x1) || null;
  return { entry: entry2, content: extractVersionBlock(getAssistantText(entry2), count2) };
}
export function resolveAgentConversationCanvasTransfer({
  message: message = '',
  history: history = [],
} = {}) {
  const payload = String(message || '')['trim'](),
    enabled3 = SELECTED_PROMPT_TRANSFER_PATTERNS['some']((handle) => handle['test'](payload)),
    enabled4 = TEXT_NODE_TRANSFER_PATTERNS['some']((state) => state['test'](payload));
  if (!enabled3 && !enabled4) return null;
  const config = (Array['isArray'](history) ? history : [])['filter'](
      (response) =>
        String(response?.['role'] || '') === 'assistant' &&
        String(response?.['status'] || 'chat') === 'chat' &&
        getAssistantText(response),
    ),
    requestedVersion = getRequestedVersion(payload),
    content2 = resolveSourceEntry(config, requestedVersion);
  if (enabled3)
    return {
      matched: !![],
      target: 'selected_prompt',
      mode: APPEND_PROMPT_PATTERN['test'](payload) ? 'append' : 'replace',
      content: content2['content'],
      requestedVersion: requestedVersion,
      sourceItemId: String(content2['entry']?.['itemId'] || '')['trim'](),
      sourceTurnId: String(content2['entry']?.['turnId'] || '')['trim'](),
    };
  return {
    matched: !![],
    nodeType: 'ai-text',
    content: content2['content'],
    requestedVersion: requestedVersion,
    sourceItemId: String(content2['entry']?.['itemId'] || '')['trim'](),
    sourceTurnId: String(content2['entry']?.['turnId'] || '')['trim'](),
  };
}
