import { extractAgentDuplicateCountHint } from './agentParameterHints.js';
const LOOP_RETRY_MESSAGE_PATTERNS = Object['freeze']([
    /^[?？]+$/,
    /^(?:重试|再试(?:一次)?|继续|重新来|重新试|请重试|再来一次)[。！!？?]*$/,
    /^(?:retry|try again|continue|resume)[.!?]*$/i,
  ]),
  LOOP_RECOVERY_EDIT_MESSAGE_PATTERNS = Object['freeze']([
    /(?:刚才|上次|之前|原来).{0,24}(?:失败|任务|生成|节点)/,
    /(?:失败|原任务|原生成).{0,24}(?:换|改|切换|继续|重做)/,
    /(?:换|更换|切换|改成|模型改成).{0,18}模型/,
    /修改.{0,12}(?:需求|提示词|prompt)/i,
    /\b(?:change|switch|replace).{0,18}\bmodel\b/i,
    /\b(?:edit|change|revise).{0,18}\b(?:request|prompt)\b/i,
  ]);
export function isAgentLoopRetryMessage(value = '') {
  const item = String(value || '')['trim']();
  return Boolean(item) && LOOP_RETRY_MESSAGE_PATTERNS['some']((key) => key['test'](item));
}
export function isAgentLoopRecoveryEditMessage(index = '') {
  const result = String(index || '')['trim']();
  return Boolean(result) && LOOP_RECOVERY_EDIT_MESSAGE_PATTERNS['some']((data) => data['test'](result));
}
export function shouldRetryAgentLoopNoop({
  hasActionIntent: hasActionIntent = ![],
  toolResultCount: toolResultCount = 0,
  retryCount: retryCount = 0,
  status: status = '',
} = {}) {
  return (
    hasActionIntent === !![] &&
    Number(toolResultCount || 0) === 0 &&
    Number(retryCount || 0) < 1 &&
    String(status || '') !== 'chat'
  );
}
export function createAgentLoopActionBudget(options = '') {
  return { duplicateNodeLimit: extractAgentDuplicateCountHint(options) || 0, duplicatedNodeCount: 0 };
}
function getPlannedDuplicateNodeCount(options2 = {}) {
  if (String(options2['type'] || '') !== 'node.duplicate') return 0;
  const target =
      Array['isArray'](options2['args']?.['ids']) && options2['args']['ids']['length'] > 0
        ? options2['args']['ids']['length']
        : 1,
    source = Math['max'](1, Math['trunc'](Number(options2['args']?.['copies'] || 1)));
  return target * source;
}
export function validateAgentLoopActionBudget(options3 = {}, next = {}) {
  const limit = Math['max'](0, Math['trunc'](Number(next['duplicateNodeLimit'] || 0)));
  if (String(options3['type'] || '') !== 'node.duplicate' || limit === 0) return { ok: !![] };
  const completed = Math['max'](0, Math['trunc'](Number(next['duplicatedNodeCount'] || 0))),
    planned = getPlannedDuplicateNodeCount(options3),
    remaining = Math['max'](0, limit - completed);
  if (planned <= remaining) return { ok: !![], planned: planned, remaining: remaining };
  return {
    ok: ![],
    errorCode: 'DUPLICATE_BUDGET_EXCEEDED',
    limit: limit,
    completed: completed,
    planned: planned,
    remaining: remaining,
  };
}
export function recordAgentLoopActionBudgetResult(args = {}, current = {}, response = {}) {
  if (String(current['type'] || '') !== 'node.duplicate' || response['ok'] !== !![]) return args;
  const entry = Array['isArray'](response['results']) ? response['results']['at'](-1) : null,
    record = entry?.['result'] || {},
    list = Array['isArray'](record['nodeIds'])
      ? record['nodeIds']
      : Array['isArray'](record['ids'])
        ? record['ids']
        : [];
  return {
    ...args,
    duplicatedNodeCount:
      Math['max'](0, Math['trunc'](Number(args['duplicatedNodeCount'] || 0))) + list['length'],
  };
}
