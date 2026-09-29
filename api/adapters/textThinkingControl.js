export function buildChatCompletionThinkingOptions(_0x2f7695 = {}, _0xdaedd4 = {}) {
  const _0x39b00b = String(_0x2f7695['thinking']?.['type'] || '')['trim']();
  if (_0xdaedd4['reasoningEffortMode'] === 'openai') {
    const _0x123260 = String(_0x2f7695['reasoningEffort'] || _0x2f7695['reasoning_effort'] || '')
        ['trim']()
        ['toLowerCase'](),
      _0x235652 = ['none', 'minimal', 'low', 'medium', 'high']['includes'](_0x123260)
        ? _0x123260
        : _0x39b00b === 'disabled'
          ? 'minimal'
          : _0x39b00b === 'enabled'
            ? 'medium'
            : '';
    if (_0x235652) return { reasoning_effort: _0x235652 };
  }
  if (
    _0xdaedd4['thinkingControlMode'] === 'enable_thinking' &&
    ['enabled', 'disabled']['includes'](_0x39b00b)
  )
    return { enable_thinking: _0x39b00b === 'enabled' };
  return _0x39b00b && _0xdaedd4['thinkingControlMode'] === 'thinking'
    ? { thinking: { type: _0x39b00b } }
    : {};
}
