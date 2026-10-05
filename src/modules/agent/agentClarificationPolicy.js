const EXPLICIT_CREATIVE_CREATE_PATTERNS = Object['freeze']([
    /\b(?:create|generate|make|draw|render|design)\b.{0,80}\b(?:image|picture|photo|video|audio|music|illustration|poster|cover)\b/i,
    /(?:创建|新建|生成|制作|设计|画|做).{0,40}(?:产品图|商品图|图片|图像|照片|视频|音频|音乐|海报|封面|插画|头像)/,
  ]),
  NON_INFERABLE_INPUT_PATTERNS = Object['freeze']([
    /(?:哪个|哪一个|哪张|哪段|请选择|选择哪个|请上传|请添加|请引用).{0,16}(?:节点|素材|参考图|源图|文件|输入|来源)/,
    /(?:文生视频|图生视频|文本生成|图片生成).{0,20}(?:还是|或者|选择|确认)/,
    /\bwhich\b.{0,20}\b(?:node|file|input|source|reference)\b/i,
    /\b(?:select|upload|attach|provide)\b.{0,20}\b(?:node|file|input|source|reference (?:image|video|audio))\b/i,
    /\b(?:text-to-video|image-to-video)\b.{0,24}\b(?:or|which|choose)\b/i,
  ]);
function matchesAny(value, list) {
  return list['some']((item) => item['test'](value));
}
export function shouldUseCreativeDefaults({
  userMessage: userMessage = '',
  plan: plan = {},
  agentContext: agentContext = {},
  toolResultCount: toolResultCount = 0,
} = {}) {
  if (plan?.['status'] !== 'need_clarification' || Number(toolResultCount || 0) > 0) return ![];
  const key = String(userMessage || '')['trim']();
  if (!matchesAny(key, EXPLICIT_CREATIVE_CREATE_PATTERNS)) return ![];
  const map = new Set(
    (Array['isArray'](agentContext?.['commands']) ? agentContext['commands'] : [])
      ['map']((index) => String(index?.['id'] || index || '')['trim']())
      ['filter'](Boolean),
  );
  if (!map['has']('node.create')) return ![];
  const result = String(plan?.['question'] || plan?.['reply'] || '')['trim']();
  if (matchesAny(result, NON_INFERABLE_INPUT_PATTERNS)) return ![];
  return !![];
}
