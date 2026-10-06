import {
  createAgentConversationStore,
  createAgentSessionStore,
  createAgentTextConversationRuntime,
  createAgentModelRequestRuntime,
  initAgentPanel,
} from '../agent/index.js';
export function createStoryAgentComposition({
  collaboration: collaboration,
  modelSettings: modelSettings,
  requestAssistant: requestAssistant,
  summarizeContext: summarizeContext,
  canvasPanel: canvasPanel,
}) {
  if (!collaboration) return null;
  let value = '',
    runtime = null,
    initAgentPanel2 = null,
    enabled = false,
    enabled2 = false;
  function run() {
    (initAgentPanel2?.destroy(),
      runtime?.dispose(),
      (initAgentPanel2 = null),
      (runtime = null),
      (value = ''),
      (enabled = false),
      (enabled2 = false));
  }
  const run2 = collaboration.subscribe(
    ({
      destroyed: destroyed,
      active: active,
      enabled: enabled3,
      projectId: projectId,
      editing: editing,
      host: host,
      root: root,
      trigger: trigger,
    }) => {
      if (destroyed) return run();
      if (projectId !== value) run();
      if (active) canvasPanel?.close();
      if (!active || !enabled3 || !projectId) {
        ((enabled2 ||= Boolean(initAgentPanel2?.panel.classList.contains('is-open'))),
          initAgentPanel2?.close());
        return;
      }
      const response = collaboration.takeInitialMessage(projectId);
      if (response) modelSettings.updateSettings({ ...response.settings, generationParams: {} });
      if (!initAgentPanel2) {
        value = projectId;
        const sessionStore = createAgentSessionStore({
            conversationStore: createAgentConversationStore({
              getProjectId: () => projectId,
              persistence: {
                read: () => collaboration.readConversations(projectId),
                write: (item) => collaboration.writeConversations(projectId, item),
              },
            }),
          }),
          assistant = createAgentModelRequestRuntime({
            sessionStore: sessionStore,
            getSettings: () => modelSettings.getSettings(),
            requestAssistant: requestAssistant,
            summarizeContext: summarizeContext,
          });
        ((runtime = createAgentTextConversationRuntime({
          sessionStore: sessionStore,
          assistant: assistant.assistant,
          getContext: () => collaboration.context(projectId),
        })),
          (initAgentPanel2 = initAgentPanel({
            runtime: runtime,
            modelSettings: modelSettings,
            root: host,
            stateRoot: root,
            fabBtnEl: trigger,
            surface: {
              textOnly: true,
              title: '剧本创作助手',
              kicker: '一起把想法写成故事',
              greeting: '从哪个方向开始？',
              placeholder: '聊聊你的想法，或告诉我这段怎么改…',
              quickActions: [
                { label: '探索方向', prompt: '根据当前创作设定，给我三个不同的故事方向，先不要写完整剧本。' },
                {
                  label: '打磨选段',
                  prompt:
                    '打磨我选中的正文，保留人物和事实，只输出修改后的这段正文。没有选中文字时请提醒我先选择。',
                },
                {
                  label: '继续写作',
                  prompt: '从当前正文结尾继续写，只输出新增正文，保持前文人物、语气和逻辑。',
                },
              ],
            },
            replyActions: [
              {
                label: '采用为剧本',
                className: 'agent-adopt-script',
                apply: (key) => collaboration.apply(key, { projectId: projectId }),
              },
              {
                label: '应用到选中段落',
                className: 'agent-adopt-selection',
                apply: (index) => collaboration.apply(index, { projectId: projectId, selectedOnly: true }),
              },
            ],
          })));
      }
      if (enabled2 || (editing && !enabled)) initAgentPanel2.open();
      ((enabled2 = false), (enabled = editing));
      if (response) void initAgentPanel2.sendMessage(response.text);
    },
  );
  return {
    destroy() {
      (run2(), run());
    },
  };
}
