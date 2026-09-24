import {
  isAgentConversationContinuation,
  isAgentStoryDeliverable,
  isAgentWritingRequest,
} from './agentConversationIntent.js';
const NEGATED_CANVAS_ACTION_PATTERNS = Object['freeze']([
    /\b(?:do not|don't|dont|please don't)\s+(?:change|edit|modify|touch|move|create|generate|alter)(?:\s+the)?\s+(?:canvas|nodes?)\b/i,
    /(?:不要|别|先不|不用|无需).{0,8}(?:动|修改|改变|编辑|操作|调整).{0,6}(?:画布|节点)/,
  ]),
  CANVAS_TARGET_PATTERN =
    /\b(?:canvas|nodes?|selection|selected|layout|grid|collage|task)\b|画布|节点|选中|连线|连接|排列|对齐|网格|拼贴|副本|任务/iu,
  CANVAS_TARGET_ACTION_PATTERN =
    /\b(?:create|generate|draw|render|add|insert|put|place|save|write|modify|change|edit|rename|label|arrange|align|connect|delete|duplicate|select|export|download|run|start|continue|execute)\b|生成|创建|新建|添加|插入|放到|放进|填入|写(?:入|到|进|上)|保存到|修改|改成|设为|替换|覆盖|追加到|补充到|调整|重排|排列|对齐|连接|删除|复制|选中(?!的)|选择(?!的)|导出|下载|运行|开始|继续|执行/iu,
  CANVAS_TARGETED_WRITE_PATTERN =
    /(?:给|为).{0,10}(?:选中(?:的)?|当前)?\s*(?:文本)?节点.{0,10}写|(?:在|往).{0,8}(?:画布|节点).{0,8}写/iu,
  MEDIA_GENERATION_PATTERN =
    /(?:\b(?:create|generate|draw|render|make)\b.{0,24}\b(?:image|picture|photo|poster|video(?!\s+(?:copy|script))|animation|audio|voice|music)\b)|(?:(?:生成|创建|新建|制作|做|画|出).{0,16}(?:图片|图像|海报|产品图|商品图|视频(?!文案|脚本)|动画|音频|配音|音乐))/iu,
  MODEL_CHANGE_PATTERN =
    /(?:\b(?:change|switch|set|use)\b.{0,24}\bmodel\b)|(?:(?:改成|改用|换成|更换|切换|设置|使用).{0,24}模型)/iu,
  TEXT_CREATION_PATTERN =
    /\b(?:copywriting|copy|slogan|tagline|headline|article|paragraph|script|prompt|caption|description|outline|proposal)\b|文案|广告语|宣传语|标题|脚本|提示词|简介|介绍|口播|文章|段落|大纲|方案|策划/iu,
  EXPLICIT_TEXT_DELIVERABLE_PATTERN =
    /(?:写|改写|润色|优化|创作|整理|输出|提供|给我|做|生成|创建).{0,28}(?:文案|广告语|宣传语|标题|脚本|提示词|简介|介绍|口播|文章|段落|大纲|方案|策划)|\b(?:write|draft|revise|polish|create|generate|make|give me)\b.{0,48}\b(?:copywriting|copy|slogans?|taglines?|headlines?|articles?|paragraphs?|scripts?|prompts?|captions?|descriptions?|outlines?|proposals?)\b/iu,
  NEGATED_MEDIA_GENERATION_PATTERN =
    /(?:不要|别|先不|不用|无需|暂不|暂时不).{0,12}(?:生成|创建|制作|做|画|出).{0,12}(?:图片|图像|海报|产品图|商品图|视频|动画|音频|配音|音乐|图)|\b(?:do not|don't|dont|not yet|without)\b.{0,18}\b(?:create|generate|draw|render|make)\b.{0,18}\b(?:image|picture|photo|poster|video|animation|audio|music)\b/iu,
  DISCUSSION_ONLY_PATTERN =
    /(?:先|只|先来|先从).{0,6}(?:聊聊|讨论|分析|评估|看看|解释)|^(?:请)?(?:解释|介绍|说明|分析|评估|比较|对比|讨论).{0,40}(?:流程|方案|思路|方法|构图|效果|画面|图片|视频)|\b(?:first|just)\s+(?:discuss|analy[sz]e|review|explain|compare|brainstorm)\b/iu,
  LATER_EXPLICIT_ACTION_PATTERN =
    /(?:然后|再|接着|随后|并且|并).{0,12}(?:生成|创建|新建|添加|修改|调整|排列|连接|删除|复制|导出|运行|执行)|\b(?:then|and then)\b.{0,20}\b(?:create|generate|add|modify|edit|arrange|connect|delete|duplicate|export|run|execute)\b/iu,
  CONVERSATIONAL_CONTINUATION_PATTERN =
    /^(?:继续(?:写|改|润色|优化)?|再来(?:一版|一个|一些)?|换(?:一版|一个|一种)|更.{0,16}(?:一点|一些))\s*[。.!！]?$/iu,
  IMPLICIT_CANVAS_OPERATION_PATTERN =
    /\b(?:arrange|align|connect|delete|duplicate|select|export|download)\b|重排|横向排列|纵向排列|网格排列|对齐|连线|删除|复制.{0,8}(?:份|个|张)|选中(?!的)|批量下载|批量导出/iu,
  GENERAL_ACTION_PATTERN = Object['freeze']([
    /\b(create|generate|draw|render|add|insert|modify|change|edit|rename|label|arrange|align|connect|delete|duplicate|select|run|start|continue|execute)\b/i,
    /\bmake\s+(?:an?|the|this|that|it|image|picture|video|clip|node|canvas)\b/i,
    /生成|创建|新建|添加|插入|画图|画(?:一|个|张|幅)|制作|做(?:一个|一张|一段|一版|成|出)|出图|出视频/,
    /修改|改成|调整|重排|排列|对齐|连接|删除|复制|选中(?!的)|选择(?!的)|运行|开始|继续|执行/,
  ]);
function isInformationalQuestion(_0x219be7) {
  if (
    /(?:我想了解|讲讲|解释|告诉我|帮我看看).{0,12}(?:如何|怎么).{0,48}(?:生成|创建|制作|修改|切换|使用)/u[
      'test'
    ](_0x219be7)
  )
    return !![];
  if (
    /^(?:请问)?(?:如何|怎么|为什么|为何|哪些|什么|是否|能否|可否).{0,64}(?:生成|创建|制作|修改|切换|使用|模型|画布|节点|图片|视频)/u[
      'test'
    ](_0x219be7)
  )
    return !![];
  if (
    /^(?:你|这个产品)?(?:支持|能|会|可以).{0,24}(?:生成|创建|制作).{0,16}(?:吗|么)[？?]?$/u['test'](
      _0x219be7,
    ) &&
    !/(?:帮我|替我|为我|给我|一张|一幅|一个|一段)/u['test'](_0x219be7)
  )
    return !![];
  if (
    /^\s*(?:how|what|why|which|where)\b.{0,80}\b(?:create|generate|make|edit|change|switch|use|model|canvas|node|image|video)\b/iu[
      'test'
    ](_0x219be7)
  )
    return !![];
  return /^\s*(?:can|could|do)\s+you\s+(?:create|generate|make)\s+(?:images?|pictures?|videos?|audio|music)\s*[?？]?$/iu[
    'test'
  ](_0x219be7);
}
function isDiscussionOnly(_0x2d7605) {
  return DISCUSSION_ONLY_PATTERN['test'](_0x2d7605) && !LATER_EXPLICIT_ACTION_PATTERN['test'](_0x2d7605);
}
export function routeAgentTurn({
  message: message = '',
  intent: intent = null,
  clarificationAnswer: clarificationAnswer = ![],
  pendingPlan: pendingPlan = ![],
  conversationHistory: conversationHistory = [],
} = {}) {
  if (clarificationAnswer || pendingPlan) return { channel: 'canvas.tool', reason: 'continuation' };
  if (intent?.['canvasAction'] === !![] || intent?.['mutatesCanvas'] === !![])
    return { channel: 'canvas.tool', reason: 'explicit-intent' };
  const _0x3e95d4 = String(message || '')['trim']();
  if (!_0x3e95d4) return { channel: 'assistant.message', reason: 'empty' };
  if (NEGATED_CANVAS_ACTION_PATTERNS['some']((_0x4fb8fc) => _0x4fb8fc['test'](_0x3e95d4)))
    return { channel: 'assistant.message', reason: 'canvas-action-negated' };
  if (isInformationalQuestion(_0x3e95d4))
    return { channel: 'assistant.message', reason: 'informational-question' };
  const _0x27919d =
    /(?:放到|放进|写入|写到|写进|填入|保存到).{0,16}(?:画布|节点)|\b(?:put|place|save)\b.{0,24}\b(?:canvas|node)\b/iu[
      'test'
    ](_0x3e95d4);
  if (isAgentStoryDeliverable(_0x3e95d4) && !LATER_EXPLICIT_ACTION_PATTERN['test'](_0x3e95d4) && !_0x27919d)
    return { channel: 'assistant.message', reason: 'story-deliverable' };
  if (
    CANVAS_TARGET_PATTERN['test'](_0x3e95d4) &&
    (CANVAS_TARGET_ACTION_PATTERN['test'](_0x3e95d4) || CANVAS_TARGETED_WRITE_PATTERN['test'](_0x3e95d4))
  )
    return { channel: 'canvas.tool', reason: 'canvas-target' };
  if (
    EXPLICIT_TEXT_DELIVERABLE_PATTERN['test'](_0x3e95d4) &&
    !LATER_EXPLICIT_ACTION_PATTERN['test'](_0x3e95d4)
  )
    return { channel: 'assistant.message', reason: 'text-deliverable' };
  if (isDiscussionOnly(_0x3e95d4)) return { channel: 'assistant.message', reason: 'discussion-only' };
  if (NEGATED_MEDIA_GENERATION_PATTERN['test'](_0x3e95d4))
    return { channel: 'assistant.message', reason: 'media-generation-negated' };
  if (MEDIA_GENERATION_PATTERN['test'](_0x3e95d4))
    return { channel: 'canvas.tool', reason: 'media-generation' };
  if (MODEL_CHANGE_PATTERN['test'](_0x3e95d4)) return { channel: 'canvas.tool', reason: 'model-change' };
  const _0x3975b8 = conversationHistory['findLast'](
    (_0x2bcd8e) => _0x2bcd8e['role'] === 'assistant' && !_0x2bcd8e['messageType'],
  );
  if (
    isAgentWritingRequest(_0x3e95d4) ||
    (_0x3975b8?.['assistantContext'] && isAgentConversationContinuation(_0x3e95d4))
  )
    return { channel: 'assistant.message', reason: 'creative-conversation' };
  if (TEXT_CREATION_PATTERN['test'](_0x3e95d4))
    return { channel: 'assistant.message', reason: 'text-creation' };
  if (CONVERSATIONAL_CONTINUATION_PATTERN['test'](_0x3e95d4))
    return { channel: 'assistant.message', reason: 'conversation-continuation' };
  if (IMPLICIT_CANVAS_OPERATION_PATTERN['test'](_0x3e95d4))
    return { channel: 'canvas.tool', reason: 'canvas-operation' };
  if (GENERAL_ACTION_PATTERN['some']((_0x3c27f7) => _0x3c27f7['test'](_0x3e95d4)))
    return { channel: 'canvas.tool', reason: 'general-action' };
  return { channel: 'assistant.message', reason: 'conversation' };
}
export function hasAgentCanvasActionIntent(_0x331f60 = '', _0xe60994 = {}) {
  return (
    routeAgentTurn({
      message: _0x331f60,
      intent: _0xe60994?.['intent'],
      clarificationAnswer: Boolean(_0xe60994?.['clarificationAnswer']),
      pendingPlan: Boolean(_0xe60994?.['pendingPlan']),
      conversationHistory: _0xe60994?.['conversationHistory'] || [],
    })['channel'] === 'canvas.tool'
  );
}
