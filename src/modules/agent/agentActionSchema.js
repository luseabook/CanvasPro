export const AGENT_PLAN_STATUSES = Object.freeze([
  'chat',
  'ready',
  'need_clarification',
  'need_confirmation',
  'failed',
]);
export const AGENT_RISK_LEVELS = Object.freeze(['safe', 'confirm', 'danger', 'blocked']);
export const AGENT_BATCH_CONFIRM_THRESHOLD = 5;
const AGENT_ACTION_ALIAS_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
export function normalizeAgentActionAlias(_0x61b878) {
  const _0x2981fe = String(_0x61b878 || '').trim();
  return AGENT_ACTION_ALIAS_PATTERN.test(_0x2981fe) ? _0x2981fe : '';
}
export function normalizeAgentAction(_0x367cba = {}) {
  if (!_0x367cba || typeof _0x367cba !== 'object' || Array.isArray(_0x367cba)) return null;
  const _0x14ed0e = String(_0x367cba.type || _0x367cba.commandId || _0x367cba.id || '').trim();
  if (!_0x14ed0e) return null;
  const _0x5da4fc = normalizeAgentActionAlias(_0x367cba.alias ?? _0x367cba.resultAlias ?? _0x367cba.as);
  return {
    type: _0x14ed0e,
    ...(_0x5da4fc ? { alias: _0x5da4fc } : {}),
    args:
      _0x367cba.args && typeof _0x367cba.args === 'object' && !Array.isArray(_0x367cba.args)
        ? _0x367cba.args
        : {},
  };
}
export function normalizeAgentPlan(_0x2ad288 = {}) {
  const _0x231eb5 =
      typeof _0x2ad288 === 'string'
        ? safeParseJson(_0x2ad288)
        : _0x2ad288 && typeof _0x2ad288 === 'object'
          ? _0x2ad288
          : {},
    _0x3ee577 = AGENT_PLAN_STATUSES.includes(_0x231eb5.status) ? _0x231eb5.status : 'failed';
  return {
    reply: String(_0x231eb5.reply || ''),
    status: _0x3ee577,
    question: String(_0x231eb5.question || ''),
    options: Array.isArray(_0x231eb5.options)
      ? _0x231eb5.options
          .map((_0x302ecd) => ({
            id: String(_0x302ecd?.id || ''),
            label: String(_0x302ecd?.label || _0x302ecd?.id || ''),
          }))
          .filter((_0x575cde) => _0x575cde.id && _0x575cde.label)
      : [],
    requiresConfirmation: _0x231eb5.requiresConfirmation === true,
    riskLevel: AGENT_RISK_LEVELS.includes(_0x231eb5.riskLevel) ? _0x231eb5.riskLevel : 'safe',
    actions: Array.isArray(_0x231eb5.actions)
      ? _0x231eb5.actions.map(normalizeAgentAction).filter(Boolean)
      : [],
    raw: _0x231eb5,
  };
}
function safeParseJson(_0xb862e9) {
  try {
    return JSON.parse(_0xb862e9);
  } catch {
    return { status: 'failed', reply: 'Agent planner returned invalid JSON.' };
  }
}
