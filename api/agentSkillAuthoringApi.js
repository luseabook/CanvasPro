import { generateText } from './aiTextApi.js';
import { buildAgentModelRequestParams } from './agentModelRequestParams.js';
const AUTHORING_HISTORY_LIMIT = 0xc,
  AUTHORING_TEXT_LIMIT = 0xbb8,
  AUTHORING_PROMPT_LIMIT = 0x4e20;
export const AGENT_SKILL_AUTHORING_SYSTEM_PROMPT = [
  'You design declarative SKILL.md capability packages for SHUO Canvas.',
  'Return only the requested JSON object and never Markdown or prose outside JSON.',
  'A Skill contains an ASCII lowercase kebab-case id, a user-facing title, a concise description of when to use it, trigger phrases, and plain-text instructions.',
  'Infer\x20safe\x20professional\x20defaults\x20whenever\x20the\x20user\x27s\x20purpose\x20is\x20clear.',
  "Use need_clarification only when the Skill's actual purpose cannot be inferred, and ask one concise question.",
  'Do\x20not\x20request\x20confirmation\x20for\x20optional\x20wording,\x20tone,\x20format,\x20or\x20naming\x20details.',
  'Skills are declarative guidance only. Never add scripts, executable code, filesystem paths, secrets, or claims that the Skill can bypass product policy.',
  'Choose an id that does not conflict with existingSkills.',
  'For\x20update\x20operations,\x20preserve\x20targetSkill.id\x20exactly\x20and\x20revise\x20only\x20the\x20requested\x20title,\x20description,\x20triggers,\x20or\x20instructions.',
  'For clone operations, keep the source meaning unless the user requests changes and choose a new non-conflicting id.',
]['join']('\x0a');
const AGENT_SKILL_AUTHORING_STRUCTURED_OUTPUT = Object['freeze']({
  name: 'agent_skill_draft',
  strict: ![],
  fallback: 'prompt',
  schema: Object['freeze']({
    type: 'object',
    additionalProperties: ![],
    required: ['status', 'reply', 'question', 'definition'],
    properties: {
      status: { type: 'string', enum: ['ready', 'need_clarification', 'failed'] },
      reply: { type: 'string' },
      question: { type: 'string' },
      definition: {
        type: 'object',
        additionalProperties: ![],
        required: ['id', 'title', 'description', 'triggers', 'instructions'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          triggers: { type: 'array', items: { type: 'string' } },
          instructions: { type: 'string' },
        },
      },
    },
  }),
});
function truncateText(_0x2f33cd, _0x47034a = AUTHORING_TEXT_LIMIT) {
  const _0x12395d = String(_0x2f33cd || '');
  return _0x12395d['length'] <= _0x47034a
    ? _0x12395d
    : _0x12395d['slice'](0x0, Math['max'](0x0, _0x47034a - 0x3)) + '...';
}
function normalizeLocale(_0x5e5050 = '') {
  return String(_0x5e5050 || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function buildPrompt({
  message: message = '',
  originalMessage: originalMessage = '',
  clarificationAnswer: clarificationAnswer = '',
  history: history = [],
  existingSkills: existingSkills = [],
  locale: locale = 'zh-CN',
  retryReason: retryReason = '',
  repairReason: repairReason = '',
  operation: operation = 'create',
  targetSkill: targetSkill = null,
} = {}) {
  const _0x22e568 = {
    languagePolicy:
      normalizeLocale(locale) === 'en-US'
        ? 'Write title, description, triggers, instructions, reply, and question in English.'
        : '标题、描述、触发词、执行说明、回复和问题使用简体中文；id 使用小写英文 kebab-case。',
    originalRequest: truncateText(originalMessage || message),
    userMessage: truncateText(message),
    clarificationAnswer: truncateText(clarificationAnswer),
    history: (Array['isArray'](history) ? history : [])
      ['map']((_0x52ed53 = {}) => ({
        role: String(_0x52ed53['role'] || 'assistant') === 'user' ? 'user' : 'assistant',
        content: truncateText(_0x52ed53['content'] || _0x52ed53['reply'] || _0x52ed53['message'] || ''),
      }))
      ['filter']((_0x4c539d) => _0x4c539d['content'])
      ['slice'](-AUTHORING_HISTORY_LIMIT),
    existingSkills: (Array['isArray'](existingSkills) ? existingSkills : [])
      ['map']((_0x448d7f = {}) => ({
        id: truncateText(_0x448d7f['id'], 0x40),
        title: truncateText(_0x448d7f['title'] || _0x448d7f['id'], 0x78),
      }))
      ['filter']((_0x1dc57a) => _0x1dc57a['id'])
      ['slice'](0x0, 0x64),
    operation: ['create', 'update', 'clone']['includes'](String(operation)) ? String(operation) : 'create',
    targetSkill:
      targetSkill && typeof targetSkill === 'object'
        ? {
            id: truncateText(targetSkill['id'], 0x40),
            title: truncateText(targetSkill['title'] || targetSkill['id'], 0x78),
            description: truncateText(targetSkill['description'], 0x258),
            triggers: (Array['isArray'](targetSkill['triggers']) ? targetSkill['triggers'] : [])
              ['slice'](0x0, 0x18)
              ['map']((_0x4f751a) => truncateText(_0x4f751a, 0xa0)),
            instructions: truncateText(targetSkill['instructions'], 0x2ee0),
          }
        : null,
    outputContract: {
      status: 'ready|need_clarification|failed',
      reply: 'string',
      question: 'string; empty unless clarification is required',
      definition: {
        id: 'lowercase-kebab-case',
        title: 'string',
        description: 'when this Skill should be used',
        triggers: ['short\x20phrases'],
        instructions: 'complete declarative instructions',
      },
    },
    ...(retryReason || repairReason
      ? {
          retry: {
            previousAttemptRejected: !![],
            reason: truncateText(retryReason || repairReason, 0xc8),
            instruction: 'Return the corrected JSON object only.',
          },
        }
      : {}),
  };
  return JSON['stringify'](_0x22e568)['slice'](0x0, AUTHORING_PROMPT_LIMIT);
}
function getResultText(_0x42d877) {
  return typeof _0x42d877 === 'string'
    ? _0x42d877
    : _0x42d877?.['text'] || _0x42d877?.['outputText'] || _0x42d877?.['content'] || '';
}
function parseResult(_0x85a190) {
  if (
    _0x85a190 &&
    typeof _0x85a190 === 'object' &&
    !Array['isArray'](_0x85a190) &&
    (Object['prototype']['hasOwnProperty']['call'](_0x85a190, 'status') || _0x85a190['definition'])
  )
    return _0x85a190;
  const _0x4e8139 = String(getResultText(_0x85a190) || '')['trim']();
  if (!_0x4e8139) throw new Error('Agent Skill author returned empty text.');
  try {
    return JSON['parse'](_0x4e8139);
  } catch {
    throw new Error('Agent\x20Skill\x20author\x20returned\x20invalid\x20JSON.');
  }
}
export async function requestAgentSkillDraft({
  message: _0x170d9f,
  originalMessage: originalMessage = '',
  clarificationAnswer: clarificationAnswer = '',
  history: history = [],
  existingSkills: existingSkills = [],
  settings: settings = {},
  request: request = generateText,
  signal: signal = null,
  onTrace: onTrace = null,
  operation: operation = 'create',
  targetSkill: targetSkill = null,
  repairReason: repairReason = '',
} = {}) {
  const _0x2fdd91 = String(settings['model'] || '')['trim'](),
    _0xd56b1e = String(settings['provider'] || '')['trim'](),
    _0x39b53f = String(settings['providerProfileId'] || '')['trim']();
  if (!_0x2fdd91 || !_0xd56b1e) throw new Error('Agent model is not configured.');
  onTrace?.({
    type: 'agent_skill_authoring_model_selected',
    channel: 'skill.authoring',
    provider: _0xd56b1e,
    model: _0x2fdd91,
  });
  const _0x39722f = {
      model: _0x2fdd91,
      provider: _0xd56b1e,
      ...buildAgentModelRequestParams(settings),
      ...(_0x39b53f ? { providerProfileId: _0x39b53f } : {}),
      prompt: buildPrompt({
        message: _0x170d9f,
        originalMessage: originalMessage,
        clarificationAnswer: clarificationAnswer,
        history: history,
        existingSkills: existingSkills,
        locale: settings['locale'],
        operation: operation,
        targetSkill: targetSkill,
        repairReason: repairReason,
      }),
      systemPrompt: AGENT_SKILL_AUTHORING_SYSTEM_PROMPT,
      structuredOutput: AGENT_SKILL_AUTHORING_STRUCTURED_OUTPUT,
      temperature: 0.2,
      ...(signal ? { signal: signal } : {}),
    },
    _0x4cbb8b = await request(_0x39722f);
  try {
    return parseResult(_0x4cbb8b);
  } catch (_0x57c080) {
    onTrace?.({ type: 'agent_skill_authoring_json_retry', reason: _0x57c080?.['message'] || 'invalid JSON' });
    const _0x5deffb = await request({
      ..._0x39722f,
      prompt: buildPrompt({
        message: _0x170d9f,
        originalMessage: originalMessage,
        clarificationAnswer: clarificationAnswer,
        history: history,
        existingSkills: existingSkills,
        locale: settings['locale'],
        operation: operation,
        targetSkill: targetSkill,
        retryReason: _0x57c080?.['message'],
      }),
    });
    return parseResult(_0x5deffb);
  }
}
