import { serializeManagedAgentSkillDefinition } from './agentSkillPackage.js';
export const AGENT_SKILL_AUTHORING_TARGET_KIND = 'agent-skill-authoring';
const SKILL_TERM_PATTERN = '(?:skills?|技能)',
  CREATE_TERM_PATTERN = '(?:创建|新建|制作|生成|做一个|写一个|create|build|make|draft|define)',
  NEGATED_AUTHORING_PATTERN =
    /(?:不要|别|不用|无需).{0,12}(?:创建|新建|制作|生成).{0,12}(?:skills?|技能)|\b(?:do not|don't|dont)\b.{0,24}\b(?:create|build|make)\b.{0,16}\bskills?\b/iu,
  AUTHORING_QUESTION_PATTERN =
    /^(?:如何|怎么|怎样).{0,16}(?:创建|新建|制作).{0,12}(?:skills?|技能)|^how\s+(?:do\s+i|to)\s+(?:create|build|make)\s+(?:a\s+)?skill/iu,
  AUTHORING_PATTERNS = Object.freeze([
    new RegExp(CREATE_TERM_PATTERN + '.{0,32}' + SKILL_TERM_PATTERN, 'iu'),
    new RegExp(SKILL_TERM_PATTERN + '.{0,32}' + CREATE_TERM_PATTERN, 'iu'),
  ]);
export function isAgentSkillAuthoringIntent(value = '') {
  const enabled = String(value || '').trim();
  if (!enabled || NEGATED_AUTHORING_PATTERN.test(enabled) || AUTHORING_QUESTION_PATTERN.test(enabled))
    return false;
  return AUTHORING_PATTERNS.some((item) => item.test(enabled));
}
export function isAgentSkillAuthoringCancelMessage(key = '') {
  return /^(?:取消(?:创建)?|不创建了|算了|cancel|never\s*mind)\s*[。.!！]?$/iu.test(
    String(key || '').trim(),
  );
}
function failed(index, result) {
  return {
    ok: false,
    status: 'failed',
    errorCode: String(index || 'SKILL_AUTHORING_INVALID'),
    message: String(result || 'Skill draft is invalid.'),
  };
}
export function normalizeAgentSkillAuthoringResult(error = {}) {
  if (!error || typeof error !== 'object' || Array.isArray(error))
    return failed('SKILL_AUTHORING_INVALID', 'Skill authoring returned an invalid result.');
  const status = String(error.status || '').trim();
  if (status === 'need_clarification') {
    const question = String(error.question || error.reply || '').trim();
    if (!question)
      return failed('SKILL_AUTHORING_QUESTION_MISSING', 'Skill clarification question is missing.');
    return {
      ok: true,
      status: status,
      reply: String(error.reply || question).trim(),
      question: question,
      options: Array.isArray(error.options) ? error.options.slice(0, 6) : [],
    };
  }
  if (status === 'failed')
    return failed(
      error.errorCode || 'SKILL_AUTHORING_FAILED',
      error.reply || error.message || 'Skill authoring failed.',
    );
  const error2 = serializeManagedAgentSkillDefinition(error.definition || {});
  if (!error2.ok) return failed(error2.errorCode, error2.message);
  const {
    id: id,
    title: title,
    description: description,
    triggers: triggers,
    instructions: instructions,
  } = error2.definition;
  return {
    ok: true,
    status: 'ready',
    reply: String(error.reply || '').trim(),
    definition: {
      id: id,
      title: title,
      description: description,
      triggers: triggers,
      instructions: instructions,
    },
  };
}
export async function requestNormalizedAgentSkillDraft({
  author: author,
  payload: payload = {},
  onTrace: onTrace = null,
} = {}) {
  if (typeof author !== 'function')
    return failed('SKILL_AUTHORING_UNAVAILABLE', 'Skill authoring is unavailable.');
  let errorCode = normalizeAgentSkillAuthoringResult(await author(payload));
  if (errorCode.ok || errorCode.errorCode === 'SKILL_AUTHORING_FAILED') return errorCode;
  return (
    onTrace?.({ type: 'agent_skill_authoring_schema_retry', errorCode: errorCode.errorCode }),
    (errorCode = normalizeAgentSkillAuthoringResult(
      await author({ ...payload, repairReason: errorCode.errorCode + ': ' + errorCode.message }),
    )),
    errorCode
  );
}
export function createAvailableAgentSkillId(data = 'skill', options = []) {
  const list =
      String(data || 'skill')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || 'skill',
    map = new Set(
      (Array.isArray(options) ? options : [])
        .map((target) =>
          String(target || '')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );
  if (!map.has(list)) return list;
  const source = list.match(/^(.*?)-(\d+)$/),
    list2 = source?.[1] || list,
    next = source ? Math.max(2, Number(source[2]) + 1) : 2;
  for (let count = next; count < 1000; count += 1) {
    const list3 = '-' + count,
      current = '' + list2.slice(0, 64 - list3.length) + list3;
    if (!map.has(current)) return current;
  }
  return list.slice(0, 55) + '-' + Date.now().toString(36).slice(-8);
}
