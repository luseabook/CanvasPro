import {
  createAgentConversationStore,
  createAgentSessionStore,
  createAgentTextConversationRuntime,
  createAgentModelRequestRuntime,
  initAgentPanel,
} from '../agent/index.js';
export function createStoryAgentComposition({
  collaboration: _0x5da337,
  modelSettings: _0x59b930,
  requestAssistant: _0x246419,
  summarizeContext: _0x35ac6d,
  canvasPanel: _0x18eace,
}) {
  if (!_0x5da337) return null;
  let _0xbad863 = '',
    _0x136211 = null,
    _0xd6ac0c = null,
    _0x1e6f44 = ![],
    _0x1781e9 = ![];
  function _0x3438b8() {
    (_0xd6ac0c?.['destroy'](),
      _0x136211?.['dispose'](),
      (_0xd6ac0c = null),
      (_0x136211 = null),
      (_0xbad863 = ''),
      (_0x1e6f44 = ![]),
      (_0x1781e9 = ![]));
  }
  const _0x26f41a = _0x5da337['subscribe'](
    ({
      destroyed: _0x4fe8dd,
      active: _0x4ddf18,
      enabled: _0x82189c,
      projectId: _0x290b7f,
      editing: _0x4fa6be,
      host: _0x490d1d,
      root: _0x146205,
      trigger: _0x5f3116,
    }) => {
      if (_0x4fe8dd) return _0x3438b8();
      if (_0x290b7f !== _0xbad863) _0x3438b8();
      if (_0x4ddf18) _0x18eace?.['close']();
      if (!_0x4ddf18 || !_0x82189c || !_0x290b7f) {
        ((_0x1781e9 ||= Boolean(_0xd6ac0c?.['panel']['classList']['contains']('is-open'))),
          _0xd6ac0c?.['close']());
        return;
      }
      const _0x1a9f5a = _0x5da337['takeInitialMessage'](_0x290b7f);
      if (_0x1a9f5a) _0x59b930['updateSettings']({ ..._0x1a9f5a['settings'], generationParams: {} });
      if (!_0xd6ac0c) {
        _0xbad863 = _0x290b7f;
        const _0xe42378 = createAgentSessionStore({
            conversationStore: createAgentConversationStore({
              getProjectId: () => _0x290b7f,
              persistence: {
                read: () => _0x5da337['readConversations'](_0x290b7f),
                write: (_0x3c3d04) => _0x5da337['writeConversations'](_0x290b7f, _0x3c3d04),
              },
            }),
          }),
          _0x5a9afd = createAgentModelRequestRuntime({
            sessionStore: _0xe42378,
            getSettings: () => _0x59b930['getSettings'](),
            requestAssistant: _0x246419,
            summarizeContext: _0x35ac6d,
          });
        ((_0x136211 = createAgentTextConversationRuntime({
          sessionStore: _0xe42378,
          assistant: _0x5a9afd['assistant'],
          getContext: () => _0x5da337['context'](_0x290b7f),
        })),
          (_0xd6ac0c = initAgentPanel({
            runtime: _0x136211,
            modelSettings: _0x59b930,
            root: _0x490d1d,
            stateRoot: _0x146205,
            fabBtnEl: _0x5f3116,
            surface: {
              textOnly: !![],
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
                apply: (_0x599f4b) => _0x5da337['apply'](_0x599f4b, { projectId: _0x290b7f }),
              },
              {
                label: '应用到选中段落',
                className: 'agent-adopt-selection',
                apply: (_0x30ee67) =>
                  _0x5da337['apply'](_0x30ee67, { projectId: _0x290b7f, selectedOnly: !![] }),
              },
            ],
          })));
      }
      if (_0x1781e9 || (_0x4fa6be && !_0x1e6f44)) _0xd6ac0c['open']();
      ((_0x1781e9 = ![]), (_0x1e6f44 = _0x4fa6be));
      if (_0x1a9f5a) void _0xd6ac0c['sendMessage'](_0x1a9f5a['text']);
    },
  );
  return {
    destroy() {
      (_0x26f41a(), _0x3438b8());
    },
  };
}
