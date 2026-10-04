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
function localeKey(value = '') {
  return String(value || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function formatText(item, key = {}, index = 'zh-CN') {
  return (TEXT[localeKey(index)]?.[item] || TEXT['zh-CN'][item] || item)['replace'](
    /\{(\w+)\}/g,
    (result, data) => String(key[data] ?? ''),
  );
}
export function createAgentProjectMemoryConversationRuntime({
  projectMemoryStore: projectMemoryStore = null,
  sessionStore: sessionStore = null,
  localeProvider: localeProvider = () => 'zh-CN',
} = {}) {
  const run = (turnId, content, projectMemory) => {
    return (
      sessionStore?.['pushHistory']?.({
        role: 'assistant',
        status: 'success',
        content: content,
        turnId: turnId,
      }),
      sessionStore?.['setCurrentRun']?.({ id: turnId, status: 'success', stopped: ![] }),
      {
        ok: !![],
        status: 'success',
        reply: content,
        responseChannel: 'project.memory',
        projectMemory: projectMemory,
      }
    );
  };
  function run2(options) {
    const target = projectMemoryStore['getMemory']();
    if (isAgentProjectMemoryEmpty(target))
      return run(options, formatText('empty', {}, localeProvider?.()), target);
    const lines = AGENT_PROJECT_MEMORY_CATEGORIES['filter']((source) => target[source]['length'] > 0x0)
      ['map'](
        (next) => '-\x20' + formatText(next, {}, localeProvider?.()) + '：' + target[next]['join']('；'),
      )
      ['join']('\x0a');
    return run(options, formatText('inspect', { lines: lines }, localeProvider?.()), target);
  }
  function handle({ message: message = '', runId: runId = '' } = {}) {
    if (!projectMemoryStore) return null;
    const detectAgentProjectMemoryIntent2 = detectAgentProjectMemoryIntent(message);
    if (!detectAgentProjectMemoryIntent2) return null;
    sessionStore?.['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'project.memory',
      reason: 'project-memory-' + detectAgentProjectMemoryIntent2['operation'],
    });
    if (detectAgentProjectMemoryIntent2['operation'] === 'inspect') return run2(runId);
    if (detectAgentProjectMemoryIntent2['operation'] === 'remember') {
      const items = projectMemoryStore['remember'](detectAgentProjectMemoryIntent2['records']),
        current =
          items['added']['length'] > 0x0
            ? formatText(
                'remembered',
                {
                  items: items['added']
                    ['map'](
                      ({ category: category, value: value2 }) =>
                        formatText(category, {}, localeProvider?.()) + '：' + value2,
                    )
                    ['join']('；'),
                },
                localeProvider?.(),
              )
            : formatText('unchanged', {}, localeProvider?.());
      return run(runId, current, items['memory']);
    }
    if (detectAgentProjectMemoryIntent2['operation'] === 'forget') {
      const count = projectMemoryStore['forget'](detectAgentProjectMemoryIntent2);
      return run(
        runId,
        formatText(
          count['removed'] > 0x0 ? 'forgotten' : 'notFound',
          { count: count['removed'] },
          localeProvider?.(),
        ),
        count['memory'],
      );
    }
    const entry = projectMemoryStore['clearMemory']();
    return run(runId, formatText('cleared', {}, localeProvider?.()), entry['memory']);
  }
  return { handle: handle };
}
