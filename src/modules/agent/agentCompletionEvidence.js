const TARGET_NODE_TYPE_RULES = Object['freeze']([
    {
      type: 'ai-video',
      targetPattern: /视频|影片|短片|video|clip/i,
      createPattern: /创建|新建|添加|制作|做(?:一个|一段|个)?|出视频|create|make|add|insert|generate/i,
    },
    {
      type: 'ai-image',
      targetPattern: /图片|图像|产品图|海报|封面|image|picture|poster|cover/i,
      createPattern: /创建|新建|添加|制作|做(?:一个|一张|个)?|出图|画|create|make|add|insert|generate|draw/i,
    },
    {
      type: 'ai-audio',
      targetPattern: /音频|声音|音乐|配音|audio|sound|music|voice/i,
      createPattern: /创建|新建|添加|制作|做(?:一个|一段|个)?|create|make|add|insert|generate/i,
    },
    {
      type: 'ai-text',
      targetPattern: /文本节点|文字节点|文案节点|text node/i,
      createPattern: /创建|新建|添加|create|make|add|insert/i,
    },
  ]),
  NEGATED_CREATE_PATTERN =
    /(?:不要|别|无需|不用|先不).{0,10}(?:创建|新建|添加)|\b(?:do not|don't|dont|no need to)\s+(?:create|make|add|insert)\b/i;
function normalizeTargetKind(value = '') {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  if (['video', 'ai-video']['includes'](item)) return 'ai-video';
  if (['image', 'ai-image']['includes'](item)) return 'ai-image';
  if (['audio', 'ai-audio']['includes'](item)) return 'ai-audio';
  if (['text', 'ai-text']['includes'](item)) return 'ai-text';
  return '';
}
export function deriveRequestedCreatedNodeType(
  key = '',
  index = {},
  { includeGenerateVerb: includeGenerateVerb = ![] } = {},
) {
  const enabled = String(key || '')['trim']();
  if (!enabled || NEGATED_CREATE_PATTERN['test'](enabled)) return '';
  const run = (result) =>
      result?.['createPattern']['test'](enabled) ||
      (includeGenerateVerb && /生成|绘制|渲染/i['test'](enabled)),
    targetKind = normalizeTargetKind(index?.['targetKind']);
  if (targetKind) {
    const data = TARGET_NODE_TYPE_RULES['find']((options) => options['type'] === targetKind);
    if (run(data)) return targetKind;
  }
  const target = TARGET_NODE_TYPE_RULES['find'](
    (source) => source['targetPattern']['test'](enabled) && run(source),
  );
  return target?.['type'] || '';
}
export function verifyAgentLoopCompletionEvidence({
  userMessage: userMessage = '',
  plannerExtra: plannerExtra = {},
  runtimeProvenance: runtimeProvenance = {},
  canvasState: canvasState = {},
} = {}) {
  const requestedNodeType = deriveRequestedCreatedNodeType(userMessage, plannerExtra);
  if (!requestedNodeType) return { ok: !![] };
  const next = canvasState?.['nodes'] && typeof canvasState['nodes'] === 'object' ? canvasState['nodes'] : {},
    createdNodeIds = Array['isArray'](runtimeProvenance?.['createdNodeIds'])
      ? runtimeProvenance['createdNodeIds']
      : [],
    matchingNodeIds = createdNodeIds['filter'](
      (current) => String(next?.[current]?.['type'] || '')['trim']() === requestedNodeType,
    );
  if (matchingNodeIds['length'] > 0)
    return { ok: !![], requestedNodeType: requestedNodeType, matchingNodeIds: matchingNodeIds };
  return {
    ok: ![],
    errorCode: 'AGENT_COMPLETION_EVIDENCE_MISSING',
    requestedNodeType: requestedNodeType,
    createdNodeIds: createdNodeIds,
  };
}
