export function buildChatCompletionThinkingOptions(options = {}, value = {}) {
  const enable_thinking = String(options['thinking']?.['type'] || '')['trim']();
  if (value['reasoningEffortMode'] === 'openai') {
    const item = String(options['reasoningEffort'] || options['reasoning_effort'] || '')
        ['trim']()
        ['toLowerCase'](),
      reasoning_effort = ['none', 'minimal', 'low', 'medium', 'high']['includes'](item)
        ? item
        : enable_thinking === 'disabled'
          ? 'minimal'
          : enable_thinking === 'enabled'
            ? 'medium'
            : '';
    if (reasoning_effort) return { reasoning_effort: reasoning_effort };
  }
  if (
    value['thinkingControlMode'] === 'enable_thinking' &&
    ['enabled', 'disabled']['includes'](enable_thinking)
  )
    return { enable_thinking: enable_thinking === 'enabled' };
  return enable_thinking && value['thinkingControlMode'] === 'thinking'
    ? { thinking: { type: enable_thinking } }
    : {};
}
