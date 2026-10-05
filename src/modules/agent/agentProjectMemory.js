export const AGENT_PROJECT_MEMORY_SCHEMA_VERSION = 1;
export const AGENT_PROJECT_MEMORY_ENTRY_LIMIT = 12;
export const AGENT_PROJECT_MEMORY_TEXT_LIMIT = 240;
export const AGENT_PROJECT_MEMORY_CATEGORIES = Object['freeze']([
  'brandVoice',
  'preferredModels',
  'namingRules',
  'preferences',
]);
const CATEGORY_PATTERNS = Object['freeze']([
    ['brandVoice', /品牌(?:语气|调性)|文案(?:语气|风格)|brand\s+voice|tone\s+of\s+voice/i],
    [
      'preferredModels',
      /(?:常用|首选|优先|默认)?模型|\bmodel\b|\bgpt[-\s\d]|\bgemini\b|\bclaude\b|\bdeepseek\b|\bqwen\b/i,
    ],
    ['namingRules', /命名|名称(?:规则|格式)|文件名|节点名|naming|name\s+(?:rule|format)/i],
  ]),
  INSPECT_PATTERNS = Object['freeze']([
    /^(?:请)?(?:查看|显示|列出|告诉我)(?:这个|当前|本)?项目(?:的)?(?:长期)?(?:记忆|偏好)[？?。.!！]*$/i,
    /^(?:你)?(?:还)?记得(?:这个|当前|本)?项目(?:的)?(?:什么|哪些|偏好)?[？?。.!！]*$/i,
    /^(?:show|list|what (?:do you )?remember about)\s+(?:this\s+)?project(?:'s)?\s*(?:memory|preferences?)?[?.!]*$/i,
  ]),
  CLEAR_PATTERNS = Object['freeze']([
    /^(?:请)?(?:清空|重置|删除)(?:这个|当前|本)?项目(?:的)?(?:长期)?(?:记忆|偏好)[。.!！]*$/i,
    /^(?:please\s+)?(?:clear|reset|delete)\s+(?:this\s+)?project(?:'s)?\s+(?:memory|preferences?)[?.!]*$/i,
  ]),
  MEMORY_QUESTION_PATTERN =
    /(?:能|可以|会)(?:不能|否)?(?:长期)?记住|记得住吗|是否(?:能|可以).*记住|can you remember|do you remember\??$/i,
  REMEMBER_PREFIX_PATTERN =
    /^(?:(?:请)?(?:帮我)?(?:长期)?(?:记住|记一下|保存为项目偏好)|remember|save (?:this )?as (?:a )?project preference)\s*[:：,，]?\s*/i,
  PROJECT_SCOPE_PREFIX_PATTERN =
    /^(?:(?:这个|当前|本)项目(?:的|以后)?|for this project|in this project)\s*[:：,，]?\s*/i,
  FUTURE_PREFIX_PATTERN = /^(?:以后|今后|从现在开始|from now on|always)\s*(?:都|默认|优先)?\s*/i,
  FORGET_PREFIX_PATTERN = /^(?:(?:请)?(?:忘记|移除|不要再记住|删除这条记忆)|forget|remove)\s*[:：,，]?\s*/i;
function normalizeText(value, item = AGENT_PROJECT_MEMORY_TEXT_LIMIT) {
  return String(value || '')
    ['replace'](/\s+/g, ' ')
    ['trim']()
    ['slice'](0, item);
}
function normalizeProjectId(key = '') {
  return normalizeText(key, 160) || 'default_v2_project';
}
function normalizeEntries(index) {
  const map = new Set();
  return (Array['isArray'](index) ? index : [])
    ['map']((result) => normalizeText(result))
    ['filter']((enabled) => {
      const data = enabled['toLocaleLowerCase']();
      if (!enabled || map['has'](data)) return ![];
      return (map['add'](data), !![]);
    })
    ['slice'](-AGENT_PROJECT_MEMORY_ENTRY_LIMIT);
}
function detectCategory(options = '') {
  return CATEGORY_PATTERNS['find'](([, target]) => target['test'](options))?.[0] || 'preferences';
}
function stripCategoryLabel(source = '', next = 'preferences') {
  const current = {
    brandVoice:
      /^(?:品牌(?:语气|调性)|文案(?:语气|风格)|brand\s+voice|tone\s+of\s+voice)\s*(?:是|为|用|使用|[:：])?\s*/i,
    preferredModels: /^(?:(?:常用|首选|优先|默认)?模型|model)\s*(?:是|为|用|使用|选择|[:：])?\s*/i,
    namingRules:
      /^(?:命名(?:规则)?|名称(?:规则|格式)?|文件名|节点名|naming|name\s+(?:rule|format))\s*(?:是|为|用|使用|[:：])?\s*/i,
    preferences: /^(?:项目)?(?:其他)?偏好\s*(?:是|为|[:：])?\s*/i,
  };
  return source['replace'](current[next], '');
}
function cleanMemoryValue(entry = '', record = 'preferences') {
  let text = normalizeText(entry);
  for (const payload of [REMEMBER_PREFIX_PATTERN, PROJECT_SCOPE_PREFIX_PATTERN, FUTURE_PREFIX_PATTERN]) {
    text = text['replace'](payload, '');
  }
  return (
    (text = stripCategoryLabel(text, record)),
    record === 'preferredModels' &&
      (text = text['replace'](/^(?:默认|优先)?(?:都)?(?:用|使用|选择)\s*/i, '')),
    normalizeText(text['replace'](/^[：:，,。.!！]+|[。.!！]+$/g, ''))
  );
}
function parseRememberRecords(handle = '') {
  const text2 = normalizeText(handle, 1200)
      ['split'](/[；;\n]+/)
      ['map']((state) => state['trim']())
      ['filter'](Boolean),
    list = [];
  for (const config of text2) {
    const category = detectCategory(config),
      value2 = cleanMemoryValue(config, category);
    if (value2) list['push']({ category: category, value: value2 });
  }
  return list;
}
function hasExplicitRememberIntent(scope = '') {
  const text3 = normalizeText(scope, 1200);
  if (!text3 || MEMORY_QUESTION_PATTERN['test'](text3)) return ![];
  if (REMEMBER_PREFIX_PATTERN['test'](text3) || FUTURE_PREFIX_PATTERN['test'](text3)) return !![];
  if (PROJECT_SCOPE_PREFIX_PATTERN['test'](text3))
    return CATEGORY_PATTERNS['some'](([, input]) => input['test'](text3)) || /偏好/['test'](text3);
  return ![];
}
export function normalizeAgentProjectMemory(
  options2 = {},
  { projectId: projectId = '', now: now = 0 } = {},
) {
  const output = options2 && typeof options2 === 'object' && !Array['isArray'](options2) ? options2 : {};
  return {
    schemaVersion: AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
    projectId: normalizeProjectId(projectId || output['projectId']),
    brandVoice: normalizeEntries(output['brandVoice']),
    preferredModels: normalizeEntries(output['preferredModels']),
    namingRules: normalizeEntries(output['namingRules']),
    preferences: normalizeEntries(output['preferences']),
    updatedAt: Math['max'](0, Number(output['updatedAt'] || now) || 0),
  };
}
export function isAgentProjectMemoryEmpty(projectId2 = {}) {
  const agentProjectMemory = normalizeAgentProjectMemory(projectId2, {
    projectId: projectId2?.['projectId'],
  });
  return AGENT_PROJECT_MEMORY_CATEGORIES['every']((value3) => agentProjectMemory[value3]['length'] === 0);
}
export function compactAgentProjectMemoryForPrompt(projectId3 = {}) {
  const agentProjectMemory2 = normalizeAgentProjectMemory(projectId3, {
    projectId: projectId3?.['projectId'],
  });
  if (isAgentProjectMemoryEmpty(agentProjectMemory2)) return null;
  return Object['fromEntries'](
    AGENT_PROJECT_MEMORY_CATEGORIES['filter']((value4) => agentProjectMemory2[value4]['length'] > 0)['map'](
      (value5) => [value5, agentProjectMemory2[value5]],
    ),
  );
}
export function detectAgentProjectMemoryIntent(value6 = '') {
  const text4 = normalizeText(value6, 1200);
  if (!text4) return null;
  if (INSPECT_PATTERNS['some']((value7) => value7['test'](text4))) return { operation: 'inspect' };
  if (CLEAR_PATTERNS['some']((value8) => value8['test'](text4))) return { operation: 'clear' };
  if (FORGET_PREFIX_PATTERN['test'](text4)) {
    const value9 = text4['replace'](FORGET_PREFIX_PATTERN, '')['replace'](PROJECT_SCOPE_PREFIX_PATTERN, ''),
      detectCategory2 = detectCategory(value9),
      category2 =
        CATEGORY_PATTERNS['some'](([, value10]) => value10['test'](value9)) || /偏好/['test'](value9);
    return {
      operation: 'forget',
      category: category2 ? detectCategory2 : '',
      query: cleanMemoryValue(value9, detectCategory2),
    };
  }
  if (!hasExplicitRememberIntent(text4)) return null;
  const records = parseRememberRecords(text4);
  return records['length'] > 0 ? { operation: 'remember', records: records } : null;
}
