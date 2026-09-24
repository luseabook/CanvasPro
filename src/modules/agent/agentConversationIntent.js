const WRITING_SUBJECT =
    /故事|小说|剧情|走向|章节|主角|人物|第一人称|第二人称|第三人称|叙事|结局|对白|台词|文案|脚本|大纲|\b(?:story|stories|novel|chapter|protagonist|plot|narrative|dialogue|ending|first.person|third.person)\b/iu,
  WRITING_REQUEST =
    /写|创作|生成|改|续|扩|缩|润色|走向|选择|\b(?:write|create|generate|revise|continue|rewrite|expand|shorten|choose)\b/iu,
  CONTINUATION =
    /^(?:(?:请|帮我|麻烦|再)\s*)?(?:继续|接着|续写|改成|改为|改写|换成|换个结局|再来|更.{0,24}(?:一点|一些)|短一点|长一点|扩写|缩写|润色|第.{1,8}(?:版|章|个)|选(?:择)?第|就选|都不选|你(?:来)?决定|随便|按(?:这个|刚才|上一)|用(?:这个|刚才|上一)|让(?:他|她|它|主角))|^\s*(?:continue|rewrite|revise|shorten|expand|make (?:it|this)|the (?:first|second|third)|choose|you decide|go with)\b/iu,
  NEW_TOPIC =
    /换个话题|另外问|另一个问题|重新开始|不要.{0,12}(?:skill|技能)|不用.{0,12}(?:skill|技能)|\b(?:new topic|different question|start over|stop using)\b/iu;
export function isAgentWritingRequest(_0x1a7359 = '') {
  const _0x5905be = String(_0x1a7359 || '');
  return (
    (WRITING_SUBJECT['test'](_0x5905be) || /第[一二三四五六七八九十百\d]+章/u['test'](_0x5905be)) &&
    WRITING_REQUEST['test'](_0x5905be)
  );
}
export function isAgentConversationContinuation(_0xde1a44 = '') {
  const _0x16695c = String(_0xde1a44 || '')['trim']();
  return !NEW_TOPIC['test'](_0x16695c) && CONTINUATION['test'](_0x16695c);
}
export function isAgentCustomChoiceAnswer(_0x2c9713 = '') {
  const _0xd67215 = String(_0x2c9713 || '')['trim']();
  return (
    Boolean(_0xd67215) &&
    !NEW_TOPIC['test'](_0xd67215) &&
    !/^(?:请问|什么是|怎么|如何|为什么|解释一下|介绍一下|what\b|why\b|how\b)/iu['test'](_0xd67215)
  );
}
export function isAgentStoryDeliverable(_0x3bed50 = '') {
  return /^(?:(?:请|帮我|给我|麻烦)\s*)?(?:写|创作|生成|续写|改写|扩写).{0,28}(?:故事|小说|剧情|章节)(?!板|视频|图片|节点)|^\s*(?:please\s+)?(?:write|create|generate|continue|rewrite)\b.{0,36}\b(?:story|stories|novel|chapter)\b/iu[
    'test'
  ](String(_0x3bed50 || ''));
}
