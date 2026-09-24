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
export function isAgentLoopRetryMessage(_0x589bec = '') {
  const _0x2b07b6 = String(_0x589bec || '')['trim']();
  return (
    Boolean(_0x2b07b6) && LOOP_RETRY_MESSAGE_PATTERNS['some']((_0x2d0941) => _0x2d0941['test'](_0x2b07b6))
  );
}
export function isAgentLoopRecoveryEditMessage(_0x3621da = '') {
  const _0x1dcb03 = String(_0x3621da || '')['trim']();
  return (
    Boolean(_0x1dcb03) &&
    LOOP_RECOVERY_EDIT_MESSAGE_PATTERNS['some']((_0x2ef9fe) => _0x2ef9fe['test'](_0x1dcb03))
  );
}
export function shouldRetryAgentLoopNoop({
  hasActionIntent: hasActionIntent = ![],
  toolResultCount: toolResultCount = 0x0,
  retryCount: retryCount = 0x0,
  status: status = '',
} = {}) {
  return (
    hasActionIntent === !![] &&
    Number(toolResultCount || 0x0) === 0x0 &&
    Number(retryCount || 0x0) < 0x1 &&
    String(status || '') !== 'chat'
  );
}
export function createAgentLoopActionBudget(_0xe37a97 = '') {
  return { duplicateNodeLimit: extractAgentDuplicateCountHint(_0xe37a97) || 0x0, duplicatedNodeCount: 0x0 };
}
function getPlannedDuplicateNodeCount(_0x150035 = {}) {
  if (String(_0x150035['type'] || '') !== 'node.duplicate') return 0x0;
  const _0x2e7c67 =
      Array['isArray'](_0x150035['args']?.['ids']) && _0x150035['args']['ids']['length'] > 0x0
        ? _0x150035['args']['ids']['length']
        : 0x1,
    _0x5e6665 = Math['max'](0x1, Math['trunc'](Number(_0x150035['args']?.['copies'] || 0x1)));
  return _0x2e7c67 * _0x5e6665;
}
export function validateAgentLoopActionBudget(_0x352785 = {}, _0x16e307 = {}) {
  const _0x524f5c = Math['max'](0x0, Math['trunc'](Number(_0x16e307['duplicateNodeLimit'] || 0x0)));
  if (String(_0x352785['type'] || '') !== 'node.duplicate' || _0x524f5c === 0x0) return { ok: !![] };
  const _0x5eeeca = Math['max'](0x0, Math['trunc'](Number(_0x16e307['duplicatedNodeCount'] || 0x0))),
    _0x591b0c = getPlannedDuplicateNodeCount(_0x352785),
    _0x19cdf7 = Math['max'](0x0, _0x524f5c - _0x5eeeca);
  if (_0x591b0c <= _0x19cdf7) return { ok: !![], planned: _0x591b0c, remaining: _0x19cdf7 };
  return {
    ok: ![],
    errorCode: 'DUPLICATE_BUDGET_EXCEEDED',
    limit: _0x524f5c,
    completed: _0x5eeeca,
    planned: _0x591b0c,
    remaining: _0x19cdf7,
  };
}
export function recordAgentLoopActionBudgetResult(_0x413c6e = {}, _0x1f5ef5 = {}, _0x8b31aa = {}) {
  if (String(_0x1f5ef5['type'] || '') !== 'node.duplicate' || _0x8b31aa['ok'] !== !![]) return _0x413c6e;
  const _0x4a5daf = Array['isArray'](_0x8b31aa['results']) ? _0x8b31aa['results']['at'](-0x1) : null,
    _0x548393 = _0x4a5daf?.['result'] || {},
    _0x4e0fb5 = Array['isArray'](_0x548393['nodeIds'])
      ? _0x548393['nodeIds']
      : Array['isArray'](_0x548393['ids'])
        ? _0x548393['ids']
        : [];
  return {
    ..._0x413c6e,
    duplicatedNodeCount:
      Math['max'](0x0, Math['trunc'](Number(_0x413c6e['duplicatedNodeCount'] || 0x0))) + _0x4e0fb5['length'],
  };
}
