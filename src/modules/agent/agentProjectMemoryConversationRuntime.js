import {
  AGENT_PROJECT_MEMORY_CATEGORIES,
  detectAgentProjectMemoryIntent,
  isAgentProjectMemoryEmpty,
} from './agentProjectMemory.js';
const TEXT = Object['freeze']({
  'zh-CN': Object['freeze']({
    empty: '当前项目还没有长期记忆。你可以说“记住：品牌语气年轻直接”。',
    inspect: '当前项目长期记忆：\n{lines}',
    remembered: '已记入当前项目长期记忆：{items}。',
    unchanged: '这些内容已经存在于当前项目长期记忆中。',
    forgotten: '已从当前项目长期记忆中移除 {count} 条内容。',
    notFound: '没有找到匹配的项目长期记忆。',
    cleared: '已清空当前项目长期记忆。',
    brandVoice: '品牌语气',
    preferredModels: '常用模型',
    namingRules: '命名规则',
    preferences: '其他偏好',
  }),
  'en-US': Object['freeze']({
    empty: 'This project has no long-term memory yet. Say “Remember: our brand voice is concise and direct.”',
    inspect: 'Long-term\x20memory\x20for\x20this\x20project:\x0a{lines}',
    remembered: "Saved to this project's long-term memory: {items}.",
    unchanged: "Those details are already in this project's long-term memory.",
    forgotten: "Removed {count} item(s) from this project's long-term memory.",
    notFound: 'No matching project memory was found.',
    cleared: 'Cleared\x20this\x20project\x27s\x20long-term\x20memory.',
    brandVoice: 'Brand\x20voice',
    preferredModels: 'Preferred models',
    namingRules: 'Naming rules',
    preferences: 'Other preferences',
  }),
});
function localeKey(_0x2a743c = '') {
  return String(_0x2a743c || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function formatText(_0x4f3173, _0x321734 = {}, _0x6a96ac = 'zh-CN') {
  return (TEXT[localeKey(_0x6a96ac)]?.[_0x4f3173] || TEXT['zh-CN'][_0x4f3173] || _0x4f3173)['replace'](
    /\{(\w+)\}/g,
    (_0x191987, _0x1d9e9e) => String(_0x321734[_0x1d9e9e] ?? ''),
  );
}
export function createAgentProjectMemoryConversationRuntime({
  projectMemoryStore: projectMemoryStore = null,
  sessionStore: sessionStore = null,
  localeProvider: localeProvider = () => 'zh-CN',
} = {}) {
  const _0x2d16c4 = (_0x1dbbc8, _0x30e288, _0x21f50a) => {
    return (
      sessionStore?.['pushHistory']?.({
        role: 'assistant',
        status: 'success',
        content: _0x30e288,
        turnId: _0x1dbbc8,
      }),
      sessionStore?.['setCurrentRun']?.({ id: _0x1dbbc8, status: 'success', stopped: ![] }),
      {
        ok: !![],
        status: 'success',
        reply: _0x30e288,
        responseChannel: 'project.memory',
        projectMemory: _0x21f50a,
      }
    );
  };
  function _0x38f2dc(_0x391144) {
    const _0x3040e0 = projectMemoryStore['getMemory']();
    if (isAgentProjectMemoryEmpty(_0x3040e0))
      return _0x2d16c4(_0x391144, formatText('empty', {}, localeProvider?.()), _0x3040e0);
    const _0x5e552d = AGENT_PROJECT_MEMORY_CATEGORIES['filter'](
      (_0x3e9798) => _0x3040e0[_0x3e9798]['length'] > 0x0,
    )
      ['map'](
        (_0x1fcf0a) =>
          '-\x20' + formatText(_0x1fcf0a, {}, localeProvider?.()) + '：' + _0x3040e0[_0x1fcf0a]['join']('；'),
      )
      ['join']('\x0a');
    return _0x2d16c4(_0x391144, formatText('inspect', { lines: _0x5e552d }, localeProvider?.()), _0x3040e0);
  }
  function _0x52f532({ message: message = '', runId: runId = '' } = {}) {
    if (!projectMemoryStore) return null;
    const _0x47f225 = detectAgentProjectMemoryIntent(message);
    if (!_0x47f225) return null;
    sessionStore?.['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'project.memory',
      reason: 'project-memory-' + _0x47f225['operation'],
    });
    if (_0x47f225['operation'] === 'inspect') return _0x38f2dc(runId);
    if (_0x47f225['operation'] === 'remember') {
      const _0x539a41 = projectMemoryStore['remember'](_0x47f225['records']),
        _0x5c27ab =
          _0x539a41['added']['length'] > 0x0
            ? formatText(
                'remembered',
                {
                  items: _0x539a41['added']
                    ['map'](
                      ({ category: _0x5b278a, value: _0x1b4da0 }) =>
                        formatText(_0x5b278a, {}, localeProvider?.()) + '：' + _0x1b4da0,
                    )
                    ['join']('；'),
                },
                localeProvider?.(),
              )
            : formatText('unchanged', {}, localeProvider?.());
      return _0x2d16c4(runId, _0x5c27ab, _0x539a41['memory']);
    }
    if (_0x47f225['operation'] === 'forget') {
      const _0x4ed1e4 = projectMemoryStore['forget'](_0x47f225);
      return _0x2d16c4(
        runId,
        formatText(
          _0x4ed1e4['removed'] > 0x0 ? 'forgotten' : 'notFound',
          { count: _0x4ed1e4['removed'] },
          localeProvider?.(),
        ),
        _0x4ed1e4['memory'],
      );
    }
    const _0x1cb669 = projectMemoryStore['clearMemory']();
    return _0x2d16c4(runId, formatText('cleared', {}, localeProvider?.()), _0x1cb669['memory']);
  }
  return { handle: _0x52f532 };
}
