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
export function normalizeAgentActionAlias(value) {
  const item = String(value || '').trim();
  return AGENT_ACTION_ALIAS_PATTERN.test(item) ? item : '';
}
export function normalizeAgentAction(args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return null;
  const type = String(args.type || args.commandId || args.id || '').trim();
  if (!type) return null;
  const alias = normalizeAgentActionAlias(args.alias ?? args.resultAlias ?? args.as);
  return {
    type: type,
    ...(alias ? { alias: alias } : {}),
    args: args.args && typeof args.args === 'object' && !Array.isArray(args.args) ? args.args : {},
  };
}
export function normalizeAgentPlan(options = {}) {
  const requiresConfirmation =
      typeof options === 'string'
        ? safeParseJson(options)
        : options && typeof options === 'object'
          ? options
          : {},
    status = AGENT_PLAN_STATUSES.includes(requiresConfirmation.status)
      ? requiresConfirmation.status
      : 'failed';
  return {
    reply: String(requiresConfirmation.reply || ''),
    status: status,
    question: String(requiresConfirmation.question || ''),
    options: Array.isArray(requiresConfirmation.options)
      ? requiresConfirmation.options
          .map((item2) => ({
            id: String(item2?.id || ''),
            label: String(item2?.label || item2?.id || ''),
          }))
          .filter((item3) => item3.id && item3.label)
      : [],
    requiresConfirmation: requiresConfirmation.requiresConfirmation === true,
    riskLevel: AGENT_RISK_LEVELS.includes(requiresConfirmation.riskLevel)
      ? requiresConfirmation.riskLevel
      : 'safe',
    actions: Array.isArray(requiresConfirmation.actions)
      ? requiresConfirmation.actions.map(normalizeAgentAction).filter(Boolean)
      : [],
    raw: requiresConfirmation,
  };
}
function safeParseJson(key) {
  try {
    return JSON.parse(key);
  } catch {
    return { status: 'failed', reply: 'Agent planner returned invalid JSON.' };
  }
}
