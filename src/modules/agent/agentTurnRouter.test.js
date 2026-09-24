import test from 'node:test';
import assert from 'node:assert/strict';

const { routeAgentTurn, hasAgentCanvasActionIntent } = await import('./agentTurnRouter.js');

// 端口把「通道 + 归因」一起返回，归因字符串就是路由器真实的判定顺序证据。
test('routeAgentTurn：无参调用按空消息回落助手通道', () => {
  assert.deepEqual(routeAgentTurn(), { channel: 'assistant.message', reason: 'empty' });
  assert.deepEqual(routeAgentTurn({}), { channel: 'assistant.message', reason: 'empty' });
  assert.deepEqual(routeAgentTurn({ message: '   \n ' }), {
    channel: 'assistant.message',
    reason: 'empty',
  });
});

test('routeAgentTurn：澄清回答与待执行计划优先于一切文本判定', () => {
  assert.deepEqual(routeAgentTurn({ message: '', clarificationAnswer: true }), {
    channel: 'canvas.tool',
    reason: 'continuation',
  });
  assert.deepEqual(routeAgentTurn({ message: '今天天气不错', pendingPlan: true }), {
    channel: 'canvas.tool',
    reason: 'continuation',
  });
  // 真值判定只作布尔宽松：非布尔字符串同样命中，而 intent 分支用严格 === true。
  assert.deepEqual(routeAgentTurn({ message: 'x', clarificationAnswer: 'no' }), {
    channel: 'canvas.tool',
    reason: 'continuation',
  });
});

test('routeAgentTurn：显式画布意图需严格 true，字符串 truthy 不命中', () => {
  assert.deepEqual(routeAgentTurn({ message: '随便', intent: { canvasAction: true } }), {
    channel: 'canvas.tool',
    reason: 'explicit-intent',
  });
  assert.deepEqual(routeAgentTurn({ message: '随便', intent: { mutatesCanvas: true } }), {
    channel: 'canvas.tool',
    reason: 'explicit-intent',
  });
  assert.notEqual(
    routeAgentTurn({ message: '今天天气不错', intent: { canvasAction: 'true' } }).reason,
    'explicit-intent',
  );
  // intent 缺失同样回落文本判定。
  assert.deepEqual(routeAgentTurn({ message: '今天天气不错', intent: {} }), {
    channel: 'assistant.message',
    reason: 'conversation',
  });
});

test('routeAgentTurn：否定画布动作早于媒体生成判定', () => {
  assert.deepEqual(routeAgentTurn({ message: "don't change the canvas" }), {
    channel: 'assistant.message',
    reason: 'canvas-action-negated',
  });
  assert.deepEqual(routeAgentTurn({ message: '不要动画布' }), {
    channel: 'assistant.message',
    reason: 'canvas-action-negated',
  });
  assert.deepEqual(routeAgentTurn({ message: '请先不要修改节点' }), {
    channel: 'assistant.message',
    reason: 'canvas-action-negated',
  });
});

test('routeAgentTurn：信息型提问一律走助手通道，即便句中含生成动词', () => {
  const informational = [
    '如何生成图片？',
    '怎么切换模型',
    '为什么画布节点会错位',
    '你能创建视频吗',
    'how do I create an image',
    'can you generate pictures?',
    '我想了解如何修改节点',
  ];
  for (const message of informational)
    assert.deepEqual(routeAgentTurn({ message }), {
      channel: 'assistant.message',
      reason: 'informational-question',
    });
});

test('routeAgentTurn：能力提问型若带明确的“给我做/一张”量词则不再算提问', () => {
  // 第三分支显式排除 帮我/替我/为我/给我/一张…，因此转由后续媒体生成判定接管。
  assert.deepEqual(routeAgentTurn({ message: '你能生成一张图片吗' }), {
    channel: 'canvas.tool',
    reason: 'media-generation',
  });
  // 去掉量词即回到提问通道。
  assert.deepEqual(routeAgentTurn({ message: '你能生成图片吗' }), {
    channel: 'assistant.message',
    reason: 'informational-question',
  });
});

test('routeAgentTurn：故事交付型直答，不带后续画布动作', () => {
  assert.deepEqual(routeAgentTurn({ message: '写一个科幻故事' }), {
    channel: 'assistant.message',
    reason: 'story-deliverable',
  });
  assert.deepEqual(routeAgentTurn({ message: 'please write a short story' }), {
    channel: 'assistant.message',
    reason: 'story-deliverable',
  });
});

test('routeAgentTurn：故事交付型若含“然后…”的后续动作则让位', () => {
  assert.notEqual(routeAgentTurn({ message: '写一个故事然后生成图片' }).reason, 'story-deliverable');
  assert.deepEqual(routeAgentTurn({ message: '写一个故事然后生成图片' }), {
    channel: 'canvas.tool',
    reason: 'media-generation',
  });
});

test('routeAgentTurn：画布目标加动作直接进工具通道', () => {
  assert.deepEqual(routeAgentTurn({ message: '把这三个节点排列对齐' }), {
    channel: 'canvas.tool',
    reason: 'canvas-target',
  });
  assert.deepEqual(routeAgentTurn({ message: 'delete the selected nodes' }), {
    channel: 'canvas.tool',
    reason: 'canvas-target',
  });
  assert.deepEqual(routeAgentTurn({ message: '把故事写到画布节点' }), {
    channel: 'canvas.tool',
    reason: 'canvas-target',
  });
});

test('routeAgentTurn：画布目标加“给节点写…”属定向写入，动作动词可缺省', () => {
  // 仅 CANVAS_TARGETED_WRITE_PATTERN 命中（“给…节点…写”），动作动词表里没有对应词。
  assert.deepEqual(routeAgentTurn({ message: '给节点写上标题备注文字说明' }), {
    channel: 'canvas.tool',
    reason: 'canvas-target',
  });
});

test('routeAgentTurn：明确文本交付物优先于讨论型与创作对话', () => {
  assert.deepEqual(routeAgentTurn({ message: '帮我写一段宣传文案' }), {
    channel: 'assistant.message',
    reason: 'text-deliverable',
  });
  assert.deepEqual(routeAgentTurn({ message: 'draft a product slogan for me' }), {
    channel: 'assistant.message',
    reason: 'text-deliverable',
  });
});

test('routeAgentTurn：纯讨论句式走助手通道，带“然后执行”则不算纯讨论', () => {
  assert.deepEqual(routeAgentTurn({ message: '先聊聊构图方案' }), {
    channel: 'assistant.message',
    reason: 'discussion-only',
  });
  assert.notEqual(routeAgentTurn({ message: '先讨论一下构图然后排列节点' }).reason, 'discussion-only');
});

test('routeAgentTurn：否定媒体生成早于媒体生成，中文命中而英文复数失守', () => {
  assert.deepEqual(routeAgentTurn({ message: '不要生成图片' }), {
    channel: 'assistant.message',
    reason: 'media-generation-negated',
  });
  // 端口现状（未打补丁）：英文两支媒体模式都以 `\b(?:image|picture|…)\b` 结尾，
  // 复数 "images" 因词尾仍接字母而不匹配，于是既不算否定媒体、也不算媒体生成，
  // 最终被 GENERAL_ACTION_PATTERN 的 `\bgenerate\b` 收进工具通道。
  assert.deepEqual(routeAgentTurn({ message: "don't generate any images" }), {
    channel: 'canvas.tool',
    reason: 'general-action',
  });
  assert.deepEqual(routeAgentTurn({ message: "don't generate image" }), {
    channel: 'assistant.message',
    reason: 'media-generation-negated',
  });
});

test('routeAgentTurn：媒体生成动词表与“视频文案/视频脚本”例外', () => {
  assert.deepEqual(routeAgentTurn({ message: '生成一张产品图' }), {
    channel: 'canvas.tool',
    reason: 'media-generation',
  });
  assert.deepEqual(routeAgentTurn({ message: 'make a poster for launch' }), {
    channel: 'canvas.tool',
    reason: 'media-generation',
  });
  // 例外：紧跟“文案/脚本”的视频属文本交付，媒体模式用 (?!文案|脚本) 排除。
  assert.notEqual(routeAgentTurn({ message: '写一个视频文案' }).reason, 'media-generation');
});

test('routeAgentTurn：模型切换走工具通道', () => {
  assert.deepEqual(routeAgentTurn({ message: '改用即梦模型' }), {
    channel: 'canvas.tool',
    reason: 'model-change',
  });
  assert.deepEqual(routeAgentTurn({ message: 'switch the model now' }), {
    channel: 'canvas.tool',
    reason: 'model-change',
  });
});

test('routeAgentTurn：创作对话依赖末条助手消息携带 assistantContext', () => {
  const history = [
    { role: 'user', content: '写一个故事' },
    { role: 'assistant', content: '从前……', assistantContext: { skillIds: [] } },
  ];
  assert.deepEqual(routeAgentTurn({ message: '继续', conversationHistory: history }), {
    channel: 'assistant.message',
    reason: 'creative-conversation',
  });
  // 无 assistantContext 时同句落到“对话延续”。
  assert.deepEqual(
    routeAgentTurn({ message: '继续', conversationHistory: [{ role: 'assistant', content: '从前……' }] }),
    { channel: 'assistant.message', reason: 'conversation-continuation' },
  );
});

test('routeAgentTurn：findLast 只认无 messageType 的助手消息', () => {
  const withTyped = [
    { role: 'assistant', content: 'a', assistantContext: { skillIds: [] } },
    { role: 'assistant', content: 'b', messageType: 'task' },
  ];
  // 末条被 messageType 过滤掉后 findLast 取到前一条，因此仍算创作对话。
  assert.deepEqual(routeAgentTurn({ message: '继续', conversationHistory: withTyped }), {
    channel: 'assistant.message',
    reason: 'creative-conversation',
  });
  // 反过来：只有带 messageType 的助手消息时不命中。
  assert.deepEqual(
    routeAgentTurn({
      message: '继续',
      conversationHistory: [{ role: 'assistant', content: 'b', messageType: 'task', assistantContext: {} }],
    }),
    { channel: 'assistant.message', reason: 'conversation-continuation' },
  );
});

test('routeAgentTurn：conversationHistory 传 null 直接抛 TypeError（默认值仅覆盖 undefined）', () => {
  assert.throws(() => routeAgentTurn({ message: '今天天气不错', conversationHistory: null }), TypeError);
});

test('routeAgentTurn：写作请求无需历史即算创作对话', () => {
  assert.deepEqual(routeAgentTurn({ message: '把第三章改短一点' }), {
    channel: 'assistant.message',
    reason: 'creative-conversation',
  });
});

test('routeAgentTurn：文本创作词表兜底', () => {
  assert.deepEqual(routeAgentTurn({ message: '给这个产品想个 slogan 和标题' }), {
    channel: 'assistant.message',
    reason: 'text-creation',
  });
});

test('routeAgentTurn：隐式画布操作在通用动作之前', () => {
  assert.deepEqual(routeAgentTurn({ message: '批量下载这些图' }), {
    channel: 'canvas.tool',
    reason: 'canvas-operation',
  });
  assert.deepEqual(routeAgentTurn({ message: 'export all nodes' }), {
    channel: 'canvas.tool',
    reason: 'canvas-target',
  });
});

test('routeAgentTurn：通用动作与最终回落', () => {
  assert.deepEqual(routeAgentTurn({ message: 'make a cake' }), {
    channel: 'canvas.tool',
    reason: 'general-action',
  });
  assert.deepEqual(routeAgentTurn({ message: '今天天气不错' }), {
    channel: 'assistant.message',
    reason: 'conversation',
  });
  assert.deepEqual(routeAgentTurn({ message: '嗯' }), {
    channel: 'assistant.message',
    reason: 'conversation',
  });
});

test('hasAgentCanvasActionIntent：仅按通道布尔化，且各选项缺省安全', () => {
  assert.equal(hasAgentCanvasActionIntent('把节点对齐'), true);
  assert.equal(hasAgentCanvasActionIntent('今天天气不错'), false);
  assert.equal(hasAgentCanvasActionIntent(), false);
  assert.equal(hasAgentCanvasActionIntent('随便', { pendingPlan: true }), true);
  assert.equal(hasAgentCanvasActionIntent('随便', { clarificationAnswer: 1 }), true);
  assert.equal(hasAgentCanvasActionIntent('随便', { intent: { canvasAction: true } }), true);
  assert.equal(
    hasAgentCanvasActionIntent('继续', {
      conversationHistory: [{ role: 'assistant', content: 'x', assistantContext: {} }],
    }),
    false,
  );
  // 包装函数把假值历史兜底成 []，因此不抛；而 routeAgentTurn 显式收 null 会命中 findLast 抛错。
  assert.deepEqual(hasAgentCanvasActionIntent('今天天气不错', { conversationHistory: null }), false);
  assert.equal(hasAgentCanvasActionIntent('今天天气不错', { conversationHistory: undefined }), false);
});
