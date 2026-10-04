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
function truncateText(value, item = AUTHORING_TEXT_LIMIT) {
  const list = String(value || '');
  return list['length'] <= item ? list : list['slice'](0x0, Math['max'](0x0, item - 0x3)) + '...';
}
function normalizeLocale(key = '') {
  return String(key || '')
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
  const index = {
    languagePolicy:
      normalizeLocale(locale) === 'en-US'
        ? 'Write title, description, triggers, instructions, reply, and question in English.'
        : '标题、描述、触发词、执行说明、回复和问题使用简体中文；id 使用小写英文 kebab-case。',
    originalRequest: truncateText(originalMessage || message),
    userMessage: truncateText(message),
    clarificationAnswer: truncateText(clarificationAnswer),
    history: (Array['isArray'](history) ? history : [])
      ['map']((error = {}) => ({
        role: String(error['role'] || 'assistant') === 'user' ? 'user' : 'assistant',
        content: truncateText(error['content'] || error['reply'] || error['message'] || ''),
      }))
      ['filter']((result) => result['content'])
      ['slice'](-AUTHORING_HISTORY_LIMIT),
    existingSkills: (Array['isArray'](existingSkills) ? existingSkills : [])
      ['map']((options = {}) => ({
        id: truncateText(options['id'], 0x40),
        title: truncateText(options['title'] || options['id'], 0x78),
      }))
      ['filter']((data) => data['id'])
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
              ['map']((target) => truncateText(target, 0xa0)),
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
  return JSON['stringify'](index)['slice'](0x0, AUTHORING_PROMPT_LIMIT);
}
function getResultText(response) {
  return typeof response === 'string'
    ? response
    : response?.['text'] || response?.['outputText'] || response?.['content'] || '';
}
function parseResult(source) {
  if (
    source &&
    typeof source === 'object' &&
    !Array['isArray'](source) &&
    (Object['prototype']['hasOwnProperty']['call'](source, 'status') || source['definition'])
  )
    return source;
  const enabled = String(getResultText(source) || '')['trim']();
  if (!enabled) throw new Error('Agent Skill author returned empty text.');
  try {
    return JSON['parse'](enabled);
  } catch {
    throw new Error('Agent\x20Skill\x20author\x20returned\x20invalid\x20JSON.');
  }
}
export async function requestAgentSkillDraft({
  message: message2,
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
  const model = String(settings['model'] || '')['trim'](),
    provider = String(settings['provider'] || '')['trim'](),
    providerProfileId = String(settings['providerProfileId'] || '')['trim']();
  if (!model || !provider) throw new Error('Agent model is not configured.');
  onTrace?.({
    type: 'agent_skill_authoring_model_selected',
    channel: 'skill.authoring',
    provider: provider,
    model: model,
  });
  const args = {
      model: model,
      provider: provider,
      ...buildAgentModelRequestParams(settings),
      ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
      prompt: buildPrompt({
        message: message2,
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
    request2 = await request(args);
  try {
    return parseResult(request2);
  } catch (reason) {
    onTrace?.({ type: 'agent_skill_authoring_json_retry', reason: reason?.['message'] || 'invalid JSON' });
    const request3 = await request({
      ...args,
      prompt: buildPrompt({
        message: message2,
        originalMessage: originalMessage,
        clarificationAnswer: clarificationAnswer,
        history: history,
        existingSkills: existingSkills,
        locale: settings['locale'],
        operation: operation,
        targetSkill: targetSkill,
        retryReason: reason?.['message'],
      }),
    });
    return parseResult(request3);
  }
}
