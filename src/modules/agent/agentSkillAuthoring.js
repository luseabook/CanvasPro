import { serializeManagedAgentSkillDefinition } from './agentSkillPackage.js';
export const AGENT_SKILL_AUTHORING_TARGET_KIND = 'agent-skill-authoring';
const SKILL_TERM_PATTERN = '(?:skills?|技能)',
  CREATE_TERM_PATTERN = '(?:创建|新建|制作|生成|做一个|写一个|create|build|make|draft|define)',
  NEGATED_AUTHORING_PATTERN =
    /(?:不要|别|不用|无需).{0,12}(?:创建|新建|制作|生成).{0,12}(?:skills?|技能)|\b(?:do not|don't|dont)\b.{0,24}\b(?:create|build|make)\b.{0,16}\bskills?\b/iu,
  AUTHORING_QUESTION_PATTERN =
    /^(?:如何|怎么|怎样).{0,16}(?:创建|新建|制作).{0,12}(?:skills?|技能)|^how\s+(?:do\s+i|to)\s+(?:create|build|make)\s+(?:a\s+)?skill/iu,
  AUTHORING_PATTERNS = Object['freeze']([
    new RegExp(CREATE_TERM_PATTERN + '.{0,32}' + SKILL_TERM_PATTERN, 'iu'),
    new RegExp(SKILL_TERM_PATTERN + '.{0,32}' + CREATE_TERM_PATTERN, 'iu'),
  ]);
export function isAgentSkillAuthoringIntent(_0x4cb53e = '') {
  const _0x20dd9a = String(_0x4cb53e || '')['trim']();
  if (
    !_0x20dd9a ||
    NEGATED_AUTHORING_PATTERN['test'](_0x20dd9a) ||
    AUTHORING_QUESTION_PATTERN['test'](_0x20dd9a)
  )
    return ![];
  return AUTHORING_PATTERNS['some']((_0x24c369) => _0x24c369['test'](_0x20dd9a));
}
export function isAgentSkillAuthoringCancelMessage(_0x620dd0 = '') {
  return /^(?:取消(?:创建)?|不创建了|算了|cancel|never\s*mind)\s*[。.!！]?$/iu['test'](
    String(_0x620dd0 || '')['trim'](),
  );
}
function failed(_0x1ec129, _0x551e0f) {
  return {
    ok: ![],
    status: 'failed',
    errorCode: String(_0x1ec129 || 'SKILL_AUTHORING_INVALID'),
    message: String(_0x551e0f || 'Skill draft is invalid.'),
  };
}
export function normalizeAgentSkillAuthoringResult(_0x17f4e2 = {}) {
  if (!_0x17f4e2 || typeof _0x17f4e2 !== 'object' || Array['isArray'](_0x17f4e2))
    return failed('SKILL_AUTHORING_INVALID', 'Skill\x20authoring\x20returned\x20an\x20invalid\x20result.');
  const _0x397ccd = String(_0x17f4e2['status'] || '')['trim']();
  if (_0x397ccd === 'need_clarification') {
    const _0x59096d = String(_0x17f4e2['question'] || _0x17f4e2['reply'] || '')['trim']();
    if (!_0x59096d)
      return failed('SKILL_AUTHORING_QUESTION_MISSING', 'Skill clarification question is missing.');
    return {
      ok: !![],
      status: _0x397ccd,
      reply: String(_0x17f4e2['reply'] || _0x59096d)['trim'](),
      question: _0x59096d,
      options: Array['isArray'](_0x17f4e2['options']) ? _0x17f4e2['options']['slice'](0x0, 0x6) : [],
    };
  }
  if (_0x397ccd === 'failed')
    return failed(
      _0x17f4e2['errorCode'] || 'SKILL_AUTHORING_FAILED',
      _0x17f4e2['reply'] || _0x17f4e2['message'] || 'Skill authoring failed.',
    );
  const _0x347c00 = serializeManagedAgentSkillDefinition(_0x17f4e2['definition'] || {});
  if (!_0x347c00['ok']) return failed(_0x347c00['errorCode'], _0x347c00['message']);
  const {
    id: _0x7967ea,
    title: _0x521817,
    description: _0x3bd19f,
    triggers: _0x425efc,
    instructions: _0x5b60d1,
  } = _0x347c00['definition'];
  return {
    ok: !![],
    status: 'ready',
    reply: String(_0x17f4e2['reply'] || '')['trim'](),
    definition: {
      id: _0x7967ea,
      title: _0x521817,
      description: _0x3bd19f,
      triggers: _0x425efc,
      instructions: _0x5b60d1,
    },
  };
}
export async function requestNormalizedAgentSkillDraft({
  author: _0x3a7c04,
  payload: payload = {},
  onTrace: onTrace = null,
} = {}) {
  if (typeof _0x3a7c04 !== 'function')
    return failed('SKILL_AUTHORING_UNAVAILABLE', 'Skill authoring is unavailable.');
  let _0x2e7a42 = normalizeAgentSkillAuthoringResult(await _0x3a7c04(payload));
  if (_0x2e7a42['ok'] || _0x2e7a42['errorCode'] === 'SKILL_AUTHORING_FAILED') return _0x2e7a42;
  return (
    onTrace?.({ type: 'agent_skill_authoring_schema_retry', errorCode: _0x2e7a42['errorCode'] }),
    (_0x2e7a42 = normalizeAgentSkillAuthoringResult(
      await _0x3a7c04({ ...payload, repairReason: _0x2e7a42['errorCode'] + ':\x20' + _0x2e7a42['message'] }),
    )),
    _0x2e7a42
  );
}
export function createAvailableAgentSkillId(_0x27b9f9 = 'skill', _0x451d41 = []) {
  const _0x20ea6f =
      String(_0x27b9f9 || 'skill')
        ['trim']()
        ['toLowerCase']()
        ['replace'](/[^a-z0-9-]+/g, '-')
        ['replace'](/^-+|-+$/g, '')
        ['slice'](0x0, 0x40) || 'skill',
    _0x1fae08 = new Set(
      (Array['isArray'](_0x451d41) ? _0x451d41 : [])
        ['map']((_0x4716ac) =>
          String(_0x4716ac || '')
            ['trim']()
            ['toLowerCase'](),
        )
        ['filter'](Boolean),
    );
  if (!_0x1fae08['has'](_0x20ea6f)) return _0x20ea6f;
  const _0x29ed1c = _0x20ea6f['match'](/^(.*?)-(\d+)$/),
    _0x4cf250 = _0x29ed1c?.[0x1] || _0x20ea6f,
    _0x10d937 = _0x29ed1c ? Math['max'](0x2, Number(_0x29ed1c[0x2]) + 0x1) : 0x2;
  for (let _0x246d50 = _0x10d937; _0x246d50 < 0x3e8; _0x246d50 += 0x1) {
    const _0x454f44 = '-' + _0x246d50,
      _0x4ec3ed = '' + _0x4cf250['slice'](0x0, 0x40 - _0x454f44['length']) + _0x454f44;
    if (!_0x1fae08['has'](_0x4ec3ed)) return _0x4ec3ed;
  }
  return _0x20ea6f['slice'](0x0, 0x37) + '-' + Date['now']()['toString'](0x24)['slice'](-0x8);
}
