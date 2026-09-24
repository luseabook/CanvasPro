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
function parseVersionNumber(_0x1f5272 = '') {
  const _0x4b9b1e = String(_0x1f5272 || '')['trim']();
  if (/^\d+$/['test'](_0x4b9b1e)) return Number(_0x4b9b1e);
  return VERSION_NUMBER_MAP[_0x4b9b1e] || 0x0;
}
function getRequestedVersion(_0x29bbe2 = '') {
  const _0x7d8cd5 = String(_0x29bbe2 || '')['match'](/第\s*([一二三四五六七八九十\d]+)\s*版/iu);
  return _0x7d8cd5 ? parseVersionNumber(_0x7d8cd5[0x1]) : 0x0;
}
function collectVersionBlocks(_0x475060 = '') {
  const _0x16fcc2 = String(_0x475060 || '')['trim']();
  if (!_0x16fcc2) return [];
  const _0x5409fa = _0x16fcc2['split'](/\r?\n/),
    _0x5332f = [];
  let _0x55432a = null;
  for (const _0x30ba66 of _0x5409fa) {
    const _0x21c5bd = _0x30ba66['match'](
      /^\s*(?:(?:修改|调整|优化|改写)后(?:的)?\s*)?(?:第\s*([一二三四五六七八九十\d]+)\s*版|([1-9]\d*)[.、])\s*[：:]?\s*(.*)$/u,
    );
    if (_0x21c5bd) {
      if (_0x55432a) _0x5332f['push'](_0x55432a);
      _0x55432a = {
        version: parseVersionNumber(_0x21c5bd[0x1] || _0x21c5bd[0x2]),
        lines: [_0x30ba66['trim']()],
      };
    } else _0x55432a && _0x55432a['lines']['push'](_0x30ba66);
  }
  if (_0x55432a) _0x5332f['push'](_0x55432a);
  return _0x5332f;
}
function extractVersionBlock(_0x3e4f8c = '', _0x10ca9e = 0x0) {
  const _0x292de8 = String(_0x3e4f8c || '')['trim']();
  if (!_0x292de8 || _0x10ca9e <= 0x0) return _0x292de8;
  const _0x174a8c = collectVersionBlocks(_0x292de8)['find'](
    (_0x5702d6) => _0x5702d6['version'] === _0x10ca9e,
  );
  return _0x174a8c ? _0x174a8c['lines']['join']('\x0a')['trim']() : _0x292de8;
}
function getAssistantText(_0x1752c4 = {}) {
  return String(
    _0x1752c4['content'] || _0x1752c4['reply'] || _0x1752c4['message'] || _0x1752c4['question'] || '',
  )['trim']();
}
function resolveSourceEntry(_0x408778 = [], _0x59b099 = 0x0) {
  if (_0x59b099 > 0x0)
    for (let _0x2dfb00 = _0x408778['length'] - 0x1; _0x2dfb00 >= 0x0; _0x2dfb00 -= 0x1) {
      const _0x397951 = _0x408778[_0x2dfb00],
        _0x59e771 = collectVersionBlocks(getAssistantText(_0x397951))['find'](
          (_0x28ed5d) => _0x28ed5d['version'] === _0x59b099,
        );
      if (_0x59e771) return { entry: _0x397951, content: _0x59e771['lines']['join']('\x0a')['trim']() };
    }
  const _0x24c940 = _0x408778['at'](-0x1) || null;
  return { entry: _0x24c940, content: extractVersionBlock(getAssistantText(_0x24c940), _0x59b099) };
}
export function resolveAgentConversationCanvasTransfer({
  message: message = '',
  history: history = [],
} = {}) {
  const _0x1a7081 = String(message || '')['trim'](),
    _0x2674b9 = SELECTED_PROMPT_TRANSFER_PATTERNS['some']((_0xcd09ad) => _0xcd09ad['test'](_0x1a7081)),
    _0x2a9b38 = TEXT_NODE_TRANSFER_PATTERNS['some']((_0x189e83) => _0x189e83['test'](_0x1a7081));
  if (!_0x2674b9 && !_0x2a9b38) return null;
  const _0x2606f7 = (Array['isArray'](history) ? history : [])['filter'](
      (_0x4b5d39) =>
        String(_0x4b5d39?.['role'] || '') === 'assistant' &&
        String(_0x4b5d39?.['status'] || 'chat') === 'chat' &&
        getAssistantText(_0x4b5d39),
    ),
    _0x4cc385 = getRequestedVersion(_0x1a7081),
    _0x2db77a = resolveSourceEntry(_0x2606f7, _0x4cc385);
  if (_0x2674b9)
    return {
      matched: !![],
      target: 'selected_prompt',
      mode: APPEND_PROMPT_PATTERN['test'](_0x1a7081) ? 'append' : 'replace',
      content: _0x2db77a['content'],
      requestedVersion: _0x4cc385,
      sourceItemId: String(_0x2db77a['entry']?.['itemId'] || '')['trim'](),
      sourceTurnId: String(_0x2db77a['entry']?.['turnId'] || '')['trim'](),
    };
  return {
    matched: !![],
    nodeType: 'ai-text',
    content: _0x2db77a['content'],
    requestedVersion: _0x4cc385,
    sourceItemId: String(_0x2db77a['entry']?.['itemId'] || '')['trim'](),
    sourceTurnId: String(_0x2db77a['entry']?.['turnId'] || '')['trim'](),
  };
}
