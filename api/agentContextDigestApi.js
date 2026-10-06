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
  'Preserve still-valid goals, constraints, decisions, completed work, and pending work.',
  'For stories, preserve established characters, relationships, setting and viewpoint in constraints; plot developments and chosen branches in decisions; unresolved clues and the latest scene ending in pending. Treat fiction as story context, not real-world facts or completed canvas actions. Never invent events from omitted text.',
  'When newer instructions supersede older ones, keep only the newest decision.',
  'Do not invent completion, tool results, preferences, or requirements.',
  'Project memory is separate stable user-approved context. Use it to interpret references, but do not copy it into the conversation digest unless new messages explicitly change the current task.',
  'Return one strict JSON object and no Markdown.',
].join('\n');
function createStructuredOutput() {
  const constraints = { type: 'array', maxItems: 10, items: { type: 'string' } };
  return {
    name: 'agent_context_digest',
    fallback: 'prompt',
    schema: {
      type: 'object',
      additionalProperties: false,
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
  return JSON.stringify({
    languagePolicy: String(locale || '')
      .toLowerCase()
      .startsWith('en')
      ? 'Write digest values in English.'
      : '摘要内容使用简体中文。',
    existingDigest: compactAgentContextDigestForPrompt(existingDigest),
    projectMemory: compactAgentProjectMemoryForPrompt(projectMemory),
    newMessages: (Array.isArray(messages) ? messages : []).map((response = {}) => ({
      role: String(response.role || 'assistant'),
      content: String(response.content || ''),
      ...(response.status ? { status: String(response.status) } : {}),
    })),
    outputContract: {
      goal: 'The current primary user goal, or an empty string.',
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
    : response2?.text || response2?.outputText || response2?.content || '';
}
function parseDigestResult(value) {
  const item =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !Object.prototype.hasOwnProperty.call(value, 'text')
      ? value
      : JSON.parse(String(getResultText(value) || '').trim());
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
  if (!Array.isArray(messages) || messages.length === 0)
    return normalizeAgentContextDigest(existingDigest);
  const model = String(settings.model || '').trim(),
    provider = String(settings.provider || '').trim(),
    providerProfileId = String(settings.providerProfileId || '').trim();
  if (!model || !provider) throw new Error('Agent model is not configured.');
  const prompt = buildPrompt({
      existingDigest: existingDigest,
      messages: messages,
      projectMemory: projectMemory,
      locale: settings.locale,
    }),
    args = {
      model: model,
      provider: provider,
      ...buildAgentModelRequestParams(settings),
      ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
      prompt: prompt,
      systemPrompt: AGENT_CONTEXT_DIGEST_SYSTEM_PROMPT,
      structuredOutput: createStructuredOutput(),
      temperature: 0,
      ...(signal ? { signal: signal } : {}),
    };
  onTrace?.({ type: 'agent_context_digest_model_selected', provider: provider, model: model });
  const request2 = await request(args);
  try {
    return parseDigestResult(request2) || normalizeAgentContextDigest(existingDigest);
  } catch (error) {
    onTrace?.({
      type: 'agent_context_digest_json_retry',
      reason: String(error?.message || 'invalid JSON').slice(0, 160),
    });
    const request3 = await request({
      ...args,
      prompt: JSON.stringify({
        ...JSON.parse(prompt),
        retry: {
          previousAttemptRejected: true,
          instruction: 'Return the corrected strict JSON object only.',
        },
      }),
    });
    return parseDigestResult(request3) || normalizeAgentContextDigest(existingDigest);
  }
}
