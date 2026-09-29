import { generateText } from './aiTextApi.js';
import { buildAgentModelRequestParams } from './agentModelRequestParams.js';
import {
  compactAgentContextDigestForPrompt,
  normalizeAgentContextDigest,
} from '../src/modules/agent/agentContextDigest.js';
import { compactAgentProjectMemoryForPrompt } from '../src/modules/agent/agentProjectMemory.js';
export const AGENT_CONTEXT_DIGEST_SYSTEM_PROMPT = [
  'You maintain a durable context digest for a creative canvas agent.',
  'Update the existing digest using only facts explicitly supported by the supplied messages.',
  'Preserve\x20still-valid\x20goals,\x20constraints,\x20decisions,\x20completed\x20work,\x20and\x20pending\x20work.',
  'For stories, preserve established characters, relationships, setting and viewpoint in constraints; plot developments and chosen branches in decisions; unresolved clues and the latest scene ending in pending. Treat fiction as story context, not real-world facts or completed canvas actions. Never invent events from omitted text.',
  'When newer instructions supersede older ones, keep only the newest decision.',
  'Do not invent completion, tool results, preferences, or requirements.',
  'Project\x20memory\x20is\x20separate\x20stable\x20user-approved\x20context.\x20Use\x20it\x20to\x20interpret\x20references,\x20but\x20do\x20not\x20copy\x20it\x20into\x20the\x20conversation\x20digest\x20unless\x20new\x20messages\x20explicitly\x20change\x20the\x20current\x20task.',
  'Return one strict JSON object and no Markdown.',
]['join']('\x0a');
function createStructuredOutput() {
  const _0x4bb932 = { type: 'array', maxItems: 0xa, items: { type: 'string' } };
  return {
    name: 'agent_context_digest',
    fallback: 'prompt',
    schema: {
      type: 'object',
      additionalProperties: ![],
      required: ['goal', 'constraints', 'decisions', 'completed', 'pending'],
      properties: {
        goal: { type: 'string' },
        constraints: _0x4bb932,
        decisions: _0x4bb932,
        completed: _0x4bb932,
        pending: _0x4bb932,
      },
    },
  };
}
function buildPrompt({
  existingDigest: existingDigest = null,
  messages: messages = [],
  projectMemory: projectMemory = null,
  locale: locale = '',
} = {}) {
  return JSON['stringify']({
    languagePolicy: String(locale || '')
      ['toLowerCase']()
      ['startsWith']('en')
      ? 'Write digest values in English.'
      : '摘要内容使用简体中文。',
    existingDigest: compactAgentContextDigestForPrompt(existingDigest),
    projectMemory: compactAgentProjectMemoryForPrompt(projectMemory),
    newMessages: (Array['isArray'](messages) ? messages : [])['map']((_0x161dbc = {}) => ({
      role: String(_0x161dbc['role'] || 'assistant'),
      content: String(_0x161dbc['content'] || ''),
      ...(_0x161dbc['status'] ? { status: String(_0x161dbc['status']) } : {}),
    })),
    outputContract: {
      goal: 'The\x20current\x20primary\x20user\x20goal,\x20or\x20an\x20empty\x20string.',
      constraints: ['Stable requirements, prohibitions, preferences, and boundaries.'],
      decisions: ['Choices already made that should guide later turns.'],
      completed: ['Work explicitly completed or verified.'],
      pending: ['Open work, questions, and next steps.'],
    },
  });
}
function getResultText(_0x2b36cc) {
  return typeof _0x2b36cc === 'string'
    ? _0x2b36cc
    : _0x2b36cc?.['text'] || _0x2b36cc?.['outputText'] || _0x2b36cc?.['content'] || '';
}
function parseDigestResult(_0x779a4a) {
  const _0x57cc3c =
    _0x779a4a &&
    typeof _0x779a4a === 'object' &&
    !Array['isArray'](_0x779a4a) &&
    !Object['prototype']['hasOwnProperty']['call'](_0x779a4a, 'text')
      ? _0x779a4a
      : JSON['parse'](String(getResultText(_0x779a4a) || '')['trim']());
  return normalizeAgentContextDigest(_0x57cc3c);
}
export async function requestAgentContextDigest({
  existingDigest: existingDigest = null,
  messages: messages = [],
  projectMemory: projectMemory = null,
  settings: settings = {},
  request: request = generateText,
  signal: signal = null,
  onTrace: onTrace = null,
} = {}) {
  if (!Array['isArray'](messages) || messages['length'] === 0x0)
    return normalizeAgentContextDigest(existingDigest);
  const _0x10e910 = String(settings['model'] || '')['trim'](),
    _0x53f0d3 = String(settings['provider'] || '')['trim'](),
    _0xf7c419 = String(settings['providerProfileId'] || '')['trim']();
  if (!_0x10e910 || !_0x53f0d3) throw new Error('Agent\x20model\x20is\x20not\x20configured.');
  const _0x396f9a = buildPrompt({
      existingDigest: existingDigest,
      messages: messages,
      projectMemory: projectMemory,
      locale: settings['locale'],
    }),
    _0x47c850 = {
      model: _0x10e910,
      provider: _0x53f0d3,
      ...buildAgentModelRequestParams(settings),
      ...(_0xf7c419 ? { providerProfileId: _0xf7c419 } : {}),
      prompt: _0x396f9a,
      systemPrompt: AGENT_CONTEXT_DIGEST_SYSTEM_PROMPT,
      structuredOutput: createStructuredOutput(),
      temperature: 0x0,
      ...(signal ? { signal: signal } : {}),
    };
  onTrace?.({ type: 'agent_context_digest_model_selected', provider: _0x53f0d3, model: _0x10e910 });
  const _0x4422b6 = await request(_0x47c850);
  try {
    return parseDigestResult(_0x4422b6) || normalizeAgentContextDigest(existingDigest);
  } catch (_0x56311b) {
    onTrace?.({
      type: 'agent_context_digest_json_retry',
      reason: String(_0x56311b?.['message'] || 'invalid JSON')['slice'](0x0, 0xa0),
    });
    const _0x2027f5 = await request({
      ..._0x47c850,
      prompt: JSON['stringify']({
        ...JSON['parse'](_0x396f9a),
        retry: {
          previousAttemptRejected: !![],
          instruction: 'Return the corrected strict JSON object only.',
        },
      }),
    });
    return parseDigestResult(_0x2027f5) || normalizeAgentContextDigest(existingDigest);
  }
}
