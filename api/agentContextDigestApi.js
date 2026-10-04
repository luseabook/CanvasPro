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
  const constraints = { type: 'array', maxItems: 0xa, items: { type: 'string' } };
  return {
    name: 'agent_context_digest',
    fallback: 'prompt',
    schema: {
      type: 'object',
      additionalProperties: ![],
      required: ['goal', 'constraints', 'decisions', 'completed', 'pending'],
      properties: {
        goal: { type: 'string' },
        constraints: constraints,
        decisions: constraints,
        completed: constraints,
        pending: constraints,
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
    newMessages: (Array['isArray'](messages) ? messages : [])['map']((response = {}) => ({
      role: String(response['role'] || 'assistant'),
      content: String(response['content'] || ''),
      ...(response['status'] ? { status: String(response['status']) } : {}),
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
function getResultText(response2) {
  return typeof response2 === 'string'
    ? response2
    : response2?.['text'] || response2?.['outputText'] || response2?.['content'] || '';
}
function parseDigestResult(value) {
  const item =
    value &&
    typeof value === 'object' &&
    !Array['isArray'](value) &&
    !Object['prototype']['hasOwnProperty']['call'](value, 'text')
      ? value
      : JSON['parse'](String(getResultText(value) || '')['trim']());
  return normalizeAgentContextDigest(item);
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
  const model = String(settings['model'] || '')['trim'](),
    provider = String(settings['provider'] || '')['trim'](),
    providerProfileId = String(settings['providerProfileId'] || '')['trim']();
  if (!model || !provider) throw new Error('Agent\x20model\x20is\x20not\x20configured.');
  const prompt = buildPrompt({
      existingDigest: existingDigest,
      messages: messages,
      projectMemory: projectMemory,
      locale: settings['locale'],
    }),
    args = {
      model: model,
      provider: provider,
      ...buildAgentModelRequestParams(settings),
      ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
      prompt: prompt,
      systemPrompt: AGENT_CONTEXT_DIGEST_SYSTEM_PROMPT,
      structuredOutput: createStructuredOutput(),
      temperature: 0x0,
      ...(signal ? { signal: signal } : {}),
    };
  onTrace?.({ type: 'agent_context_digest_model_selected', provider: provider, model: model });
  const request2 = await request(args);
  try {
    return parseDigestResult(request2) || normalizeAgentContextDigest(existingDigest);
  } catch (error) {
    onTrace?.({
      type: 'agent_context_digest_json_retry',
      reason: String(error?.['message'] || 'invalid JSON')['slice'](0x0, 0xa0),
    });
    const request3 = await request({
      ...args,
      prompt: JSON['stringify']({
        ...JSON['parse'](prompt),
        retry: {
          previousAttemptRejected: !![],
          instruction: 'Return the corrected strict JSON object only.',
        },
      }),
    });
    return parseDigestResult(request3) || normalizeAgentContextDigest(existingDigest);
  }
}
