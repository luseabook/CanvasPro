const WRITING_SUBJECT =
    /故事|小说|剧情|走向|章节|主角|人物|第一人称|第二人称|第三人称|叙事|结局|对白|台词|文案|脚本|大纲|\b(?:story|stories|novel|chapter|protagonist|plot|narrative|dialogue|ending|first.person|third.person)\b/iu,
  WRITING_REQUEST =
    /写|创作|生成|改|续|扩|缩|润色|走向|选择|\b(?:write|create|generate|revise|continue|rewrite|expand|shorten|choose)\b/iu,
  CONTINUATION =
    /^(?:(?:请|帮我|麻烦|再)\s*)?(?:继续|接着|续写|改成|改为|改写|换成|换个结局|再来|更.{0,24}(?:一点|一些)|短一点|长一点|扩写|缩写|润色|第.{1,8}(?:版|章|个)|选(?:择)?第|就选|都不选|你(?:来)?决定|随便|按(?:这个|刚才|上一)|用(?:这个|刚才|上一)|让(?:他|她|它|主角))|^\s*(?:continue|rewrite|revise|shorten|expand|make (?:it|this)|the (?:first|second|third)|choose|you decide|go with)\b/iu,
  NEW_TOPIC =
    /换个话题|另外问|另一个问题|重新开始|不要.{0,12}(?:skill|技能)|不用.{0,12}(?:skill|技能)|\b(?:new topic|different question|start over|stop using)\b/iu;
export function isAgentWritingRequest(value = '') {
  const item = String(value || '');
  return (
    (WRITING_SUBJECT.test(item) || /第[一二三四五六七八九十百\d]+章/u.test(item)) &&
    WRITING_REQUEST.test(item)
  );
}
export function isAgentConversationContinuation(key = '') {
  const index = String(key || '').trim();
  return !NEW_TOPIC.test(index) && CONTINUATION.test(index);
}
export function isAgentCustomChoiceAnswer(result = '') {
  const data = String(result || '').trim();
  return (
    Boolean(data) &&
    !NEW_TOPIC.test(data) &&
    !/^(?:请问|什么是|怎么|如何|为什么|解释一下|介绍一下|what\b|why\b|how\b)/iu.test(data)
  );
}
export function isAgentStoryDeliverable(options = '') {
  return /^(?:(?:请|帮我|给我|麻烦)\s*)?(?:写|创作|生成|续写|改写|扩写).{0,28}(?:故事|小说|剧情|章节)(?!板|视频|图片|节点)|^\s*(?:please\s+)?(?:write|create|generate|continue|rewrite)\b.{0,36}\b(?:story|stories|novel|chapter)\b/iu.test(String(options || ''));
}
