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
function normalizeTargetKind(_0x35a607 = '') {
  const _0x1aae4e = String(_0x35a607 || '')
    ['trim']()
    ['toLowerCase']();
  if (['video', 'ai-video']['includes'](_0x1aae4e)) return 'ai-video';
  if (['image', 'ai-image']['includes'](_0x1aae4e)) return 'ai-image';
  if (['audio', 'ai-audio']['includes'](_0x1aae4e)) return 'ai-audio';
  if (['text', 'ai-text']['includes'](_0x1aae4e)) return 'ai-text';
  return '';
}
export function deriveRequestedCreatedNodeType(
  _0x58a68d = '',
  _0x3ca124 = {},
  { includeGenerateVerb: includeGenerateVerb = ![] } = {},
) {
  const _0x44319d = String(_0x58a68d || '')['trim']();
  if (!_0x44319d || NEGATED_CREATE_PATTERN['test'](_0x44319d)) return '';
  const _0xc8f288 = (_0x223892) =>
      _0x223892?.['createPattern']['test'](_0x44319d) ||
      (includeGenerateVerb && /生成|绘制|渲染/i['test'](_0x44319d)),
    _0x3770ee = normalizeTargetKind(_0x3ca124?.['targetKind']);
  if (_0x3770ee) {
    const _0x2d3a7e = TARGET_NODE_TYPE_RULES['find']((_0x4bb152) => _0x4bb152['type'] === _0x3770ee);
    if (_0xc8f288(_0x2d3a7e)) return _0x3770ee;
  }
  const _0x411a40 = TARGET_NODE_TYPE_RULES['find'](
    (_0xd3af1d) => _0xd3af1d['targetPattern']['test'](_0x44319d) && _0xc8f288(_0xd3af1d),
  );
  return _0x411a40?.['type'] || '';
}
export function verifyAgentLoopCompletionEvidence({
  userMessage: userMessage = '',
  plannerExtra: plannerExtra = {},
  runtimeProvenance: runtimeProvenance = {},
  canvasState: canvasState = {},
} = {}) {
  const _0x3e0672 = deriveRequestedCreatedNodeType(userMessage, plannerExtra);
  if (!_0x3e0672) return { ok: !![] };
  const _0x453a62 =
      canvasState?.['nodes'] && typeof canvasState['nodes'] === 'object' ? canvasState['nodes'] : {},
    _0x417d78 = Array['isArray'](runtimeProvenance?.['createdNodeIds'])
      ? runtimeProvenance['createdNodeIds']
      : [],
    _0x5b74c4 = _0x417d78['filter'](
      (_0x53cb8e) => String(_0x453a62?.[_0x53cb8e]?.['type'] || '')['trim']() === _0x3e0672,
    );
  if (_0x5b74c4['length'] > 0x0)
    return { ok: !![], requestedNodeType: _0x3e0672, matchingNodeIds: _0x5b74c4 };
  return {
    ok: ![],
    errorCode: 'AGENT_COMPLETION_EVIDENCE_MISSING',
    requestedNodeType: _0x3e0672,
    createdNodeIds: _0x417d78,
  };
}
