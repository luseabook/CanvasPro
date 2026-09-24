export const AGENT_PROJECT_MEMORY_SCHEMA_VERSION = 0x1;
export const AGENT_PROJECT_MEMORY_ENTRY_LIMIT = 0xc;
export const AGENT_PROJECT_MEMORY_TEXT_LIMIT = 0xf0;
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
function normalizeText(_0x282299, _0x3b503d = AGENT_PROJECT_MEMORY_TEXT_LIMIT) {
  return String(_0x282299 || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']()
    ['slice'](0x0, _0x3b503d);
}
function normalizeProjectId(_0x41fd84 = '') {
  return normalizeText(_0x41fd84, 0xa0) || 'default_v2_project';
}
function normalizeEntries(_0x17d787) {
  const _0x257727 = new Set();
  return (Array['isArray'](_0x17d787) ? _0x17d787 : [])
    ['map']((_0x1cbeb7) => normalizeText(_0x1cbeb7))
    ['filter']((_0xe40870) => {
      const _0x56af11 = _0xe40870['toLocaleLowerCase']();
      if (!_0xe40870 || _0x257727['has'](_0x56af11)) return ![];
      return (_0x257727['add'](_0x56af11), !![]);
    })
    ['slice'](-AGENT_PROJECT_MEMORY_ENTRY_LIMIT);
}
function detectCategory(_0x456c2d = '') {
  return CATEGORY_PATTERNS['find'](([, _0x136be0]) => _0x136be0['test'](_0x456c2d))?.[0x0] || 'preferences';
}
function stripCategoryLabel(_0x5357c5 = '', _0x7dda34 = 'preferences') {
  const _0x126877 = {
    brandVoice:
      /^(?:品牌(?:语气|调性)|文案(?:语气|风格)|brand\s+voice|tone\s+of\s+voice)\s*(?:是|为|用|使用|[:：])?\s*/i,
    preferredModels: /^(?:(?:常用|首选|优先|默认)?模型|model)\s*(?:是|为|用|使用|选择|[:：])?\s*/i,
    namingRules:
      /^(?:命名(?:规则)?|名称(?:规则|格式)?|文件名|节点名|naming|name\s+(?:rule|format))\s*(?:是|为|用|使用|[:：])?\s*/i,
    preferences: /^(?:项目)?(?:其他)?偏好\s*(?:是|为|[:：])?\s*/i,
  };
  return _0x5357c5['replace'](_0x126877[_0x7dda34], '');
}
function cleanMemoryValue(_0x5e136b = '', _0x9897a5 = 'preferences') {
  let _0x159d02 = normalizeText(_0x5e136b);
  for (const _0x49e89e of [REMEMBER_PREFIX_PATTERN, PROJECT_SCOPE_PREFIX_PATTERN, FUTURE_PREFIX_PATTERN]) {
    _0x159d02 = _0x159d02['replace'](_0x49e89e, '');
  }
  return (
    (_0x159d02 = stripCategoryLabel(_0x159d02, _0x9897a5)),
    _0x9897a5 === 'preferredModels' &&
      (_0x159d02 = _0x159d02['replace'](/^(?:默认|优先)?(?:都)?(?:用|使用|选择)\s*/i, '')),
    normalizeText(_0x159d02['replace'](/^[：:，,。.!！]+|[。.!！]+$/g, ''))
  );
}
function parseRememberRecords(_0x1a4714 = '') {
  const _0x38adfb = normalizeText(_0x1a4714, 0x4b0)
      ['split'](/[；;\n]+/)
      ['map']((_0x203f49) => _0x203f49['trim']())
      ['filter'](Boolean),
    _0x56095a = [];
  for (const _0x5ddb3b of _0x38adfb) {
    const _0x18ea96 = detectCategory(_0x5ddb3b),
      _0x59bc37 = cleanMemoryValue(_0x5ddb3b, _0x18ea96);
    if (_0x59bc37) _0x56095a['push']({ category: _0x18ea96, value: _0x59bc37 });
  }
  return _0x56095a;
}
function hasExplicitRememberIntent(_0x1e7378 = '') {
  const _0x4a18f5 = normalizeText(_0x1e7378, 0x4b0);
  if (!_0x4a18f5 || MEMORY_QUESTION_PATTERN['test'](_0x4a18f5)) return ![];
  if (REMEMBER_PREFIX_PATTERN['test'](_0x4a18f5) || FUTURE_PREFIX_PATTERN['test'](_0x4a18f5)) return !![];
  if (PROJECT_SCOPE_PREFIX_PATTERN['test'](_0x4a18f5))
    return (
      CATEGORY_PATTERNS['some'](([, _0x227df4]) => _0x227df4['test'](_0x4a18f5)) || /偏好/['test'](_0x4a18f5)
    );
  return ![];
}
export function normalizeAgentProjectMemory(
  _0xa01b64 = {},
  { projectId: projectId = '', now: now = 0x0 } = {},
) {
  const _0x28432e =
    _0xa01b64 && typeof _0xa01b64 === 'object' && !Array['isArray'](_0xa01b64) ? _0xa01b64 : {};
  return {
    schemaVersion: AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
    projectId: normalizeProjectId(projectId || _0x28432e['projectId']),
    brandVoice: normalizeEntries(_0x28432e['brandVoice']),
    preferredModels: normalizeEntries(_0x28432e['preferredModels']),
    namingRules: normalizeEntries(_0x28432e['namingRules']),
    preferences: normalizeEntries(_0x28432e['preferences']),
    updatedAt: Math['max'](0x0, Number(_0x28432e['updatedAt'] || now) || 0x0),
  };
}
export function isAgentProjectMemoryEmpty(_0x4f4cae = {}) {
  const _0x50dc72 = normalizeAgentProjectMemory(_0x4f4cae, { projectId: _0x4f4cae?.['projectId'] });
  return AGENT_PROJECT_MEMORY_CATEGORIES['every']((_0x30dc0a) => _0x50dc72[_0x30dc0a]['length'] === 0x0);
}
export function compactAgentProjectMemoryForPrompt(_0x272101 = {}) {
  const _0xa68e90 = normalizeAgentProjectMemory(_0x272101, { projectId: _0x272101?.['projectId'] });
  if (isAgentProjectMemoryEmpty(_0xa68e90)) return null;
  return Object['fromEntries'](
    AGENT_PROJECT_MEMORY_CATEGORIES['filter']((_0x5be1cb) => _0xa68e90[_0x5be1cb]['length'] > 0x0)['map'](
      (_0x3c0dad) => [_0x3c0dad, _0xa68e90[_0x3c0dad]],
    ),
  );
}
export function detectAgentProjectMemoryIntent(_0x3e1b72 = '') {
  const _0x2570f9 = normalizeText(_0x3e1b72, 0x4b0);
  if (!_0x2570f9) return null;
  if (INSPECT_PATTERNS['some']((_0x56de88) => _0x56de88['test'](_0x2570f9))) return { operation: 'inspect' };
  if (CLEAR_PATTERNS['some']((_0xe46f6f) => _0xe46f6f['test'](_0x2570f9))) return { operation: 'clear' };
  if (FORGET_PREFIX_PATTERN['test'](_0x2570f9)) {
    const _0x3d85fd = _0x2570f9['replace'](FORGET_PREFIX_PATTERN, '')['replace'](
        PROJECT_SCOPE_PREFIX_PATTERN,
        '',
      ),
      _0x3232e0 = detectCategory(_0x3d85fd),
      _0x3b9e58 =
        CATEGORY_PATTERNS['some'](([, _0x5f2ea7]) => _0x5f2ea7['test'](_0x3d85fd)) ||
        /偏好/['test'](_0x3d85fd);
    return {
      operation: 'forget',
      category: _0x3b9e58 ? _0x3232e0 : '',
      query: cleanMemoryValue(_0x3d85fd, _0x3232e0),
    };
  }
  if (!hasExplicitRememberIntent(_0x2570f9)) return null;
  const _0x339d8f = parseRememberRecords(_0x2570f9);
  return _0x339d8f['length'] > 0x0 ? { operation: 'remember', records: _0x339d8f } : null;
}
