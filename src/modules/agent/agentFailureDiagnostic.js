const MAX_DRAFT_CHARS = 4000,
  DIAGNOSTIC_COPY = Object['freeze']({
    'zh-CN': Object['freeze']({
      planning: '规划阶段',
      execution: '执行阶段',
      PLANNER_AUTH_ERROR: ['模型服务鉴权失败', '请检查当前文本模型的密钥或服务配置，然后从检查点继续。'],
      PLANNER_RATE_LIMITED: ['模型服务请求过于频繁', '服务暂时限制了规划请求，稍后可以从当前检查点继续。'],
      PLANNER_TIMEOUT: ['模型服务响应超时', '规划请求没有在时限内完成，已保留原任务和已完成步骤。'],
      PLANNER_NETWORK_ERROR: ['模型服务网络请求失败', '未收到可执行的规划结果，可以从当前检查点继续。'],
      PLANNER_NO_ACTION: ['规划器没有返回画布动作', '原任务包含明确操作，但模型没有给出可执行动作。'],
      PLANNER_REPORTED_FAILURE: ['模型主动结束了规划', '模型返回了失败状态，原任务和已完成步骤已保留。'],
      PLANNER_INVALID_ACTION: ['规划动作参数无效', '模型返回的动作不符合画布命令契约，已停止重复修正。'],
      PLANNER_UNSUPPORTED_ACTION: ['规划动作当前不可执行', '模型选择了本轮未开放或不受支持的画布命令。'],
      PLANNER_REQUEST_ERROR: ['模型规划请求失败', '规划请求未返回可执行结果，原任务和已完成步骤已保留。'],
      EXECUTION_ACTION_FAILED: ['画布动作执行失败', '已保留执行前完成的步骤，可以重试失败动作或调整需求。'],
      retryPlanner: '自动修复并继续',
      editRequest: '修改需求',
      changeModel: '换模型',
    }),
    'en-US': Object['freeze']({
      planning: 'Planning',
      execution: 'Execution',
      PLANNER_AUTH_ERROR: [
        'Model service authentication failed',
        'Check the text-model credentials or service settings, then resume from the checkpoint.',
      ],
      PLANNER_RATE_LIMITED: [
        'Model service rate limited the request',
        'The planning request was throttled. Resume from the current checkpoint later.',
      ],
      PLANNER_TIMEOUT: [
        'Model service timed out',
        'The planning request did not finish in time. The task and completed steps were preserved.',
      ],
      PLANNER_NETWORK_ERROR: [
        'Model service network request failed',
        'No executable plan was received. Resume from the current checkpoint.',
      ],
      PLANNER_NO_ACTION: [
        'Planner returned no canvas action',
        'The request required a canvas change, but the model returned no executable action.',
      ],
      PLANNER_REPORTED_FAILURE: [
        'The model ended planning',
        'The model returned a failed status. The task and completed steps were preserved.',
      ],
      PLANNER_INVALID_ACTION: [
        'Planner action arguments were invalid',
        'The returned action did not satisfy the canvas command contract.',
      ],
      PLANNER_UNSUPPORTED_ACTION: [
        'Planner action is unavailable',
        'The model selected an unsupported or undisclosed command for this turn.',
      ],
      PLANNER_REQUEST_ERROR: [
        'Model planning request failed',
        'The request returned no executable plan. The task and completed steps were preserved.',
      ],
      EXECUTION_ACTION_FAILED: [
        'Canvas action failed',
        'Completed preparation was preserved. Retry the failed action or revise the request.',
      ],
      retryPlanner: 'Repair and continue',
      editRequest: 'Edit request',
      changeModel: 'Change model',
    }),
  });
function normalizeLocale(value = '') {
  return String(value || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function normalizeErrorCode(item = '', key = '') {
  const index = String(item || '')
    ['trim']()
    ['toUpperCase']()
    ['replace'](/[^A-Z0-9_.-]/g, '_')
    ['slice'](0, 80);
  return index || key;
}
function classifyPlannerFailure({
  validation: validation = null,
  cause: cause = '',
  reason: reason = '',
} = {}) {
  if (reason === 'no_action') return 'PLANNER_NO_ACTION';
  const errorCode = normalizeErrorCode(validation?.['errorCode']);
  if (errorCode === 'AGENT_PLAN_FAILED') return 'PLANNER_REPORTED_FAILURE';
  if (['UNKNOWN_AGENT_ACTION', 'DEFERRED_AGENT_ACTION', 'BLOCKED_AGENT_ACTION']['includes'](errorCode))
    return 'PLANNER_UNSUPPORTED_ACTION';
  if (errorCode) return 'PLANNER_INVALID_ACTION';
  const result = String(cause || '')['toLowerCase']();
  if (/\b(?:401|403)\b|unauthori[sz]ed|forbidden|api[ _-]?key|authentication/['test'](result))
    return 'PLANNER_AUTH_ERROR';
  if (/\b429\b|rate.?limit|too many requests|quota/['test'](result)) return 'PLANNER_RATE_LIMITED';
  if (/timeout|timed out|deadline/['test'](result)) return 'PLANNER_TIMEOUT';
  if (/fetch|network|econn|enotfound|socket|offline|connection/['test'](result))
    return 'PLANNER_NETWORK_ERROR';
  return 'PLANNER_REQUEST_ERROR';
}
function getDiagnosticCopy(data, options, target) {
  const phaseLabel = DIAGNOSTIC_COPY[normalizeLocale(data)],
    [summary, detail] = phaseLabel[target] || phaseLabel['PLANNER_REQUEST_ERROR'];
  return { phaseLabel: phaseLabel[options] || phaseLabel['planning'], summary: summary, detail: detail };
}
function countCompletedSteps(list = []) {
  return (Array['isArray'](list) ? list : [])['filter']((response) => response?.['ok'] === true)['length'];
}
export function buildAgentPlannerDiagnostic({
  loopState: loopState = {},
  validation: validation = null,
  cause: cause = '',
  reason: reason = '',
  locale: locale = 'zh-CN',
} = {}) {
  const errorCode2 = classifyPlannerFailure({ validation: validation, cause: cause, reason: reason }),
    phaseLabel2 = getDiagnosticCopy(locale, 'planning', errorCode2),
    source = Array['isArray'](loopState['validationFeedback'])
      ? loopState['validationFeedback']['at'](-1)
      : null;
  return {
    phase: 'planning',
    phaseLabel: phaseLabel2['phaseLabel'],
    summary: phaseLabel2['summary'],
    detail: phaseLabel2['detail'],
    errorCode: errorCode2,
    sourceErrorCode: normalizeErrorCode(validation?.['errorCode'] || source?.['errorCode']),
    commandId: String(validation?.['plan']?.['actions']?.[0]?.['type'] || source?.['commandId'] || '')
      ['trim']()
      ['slice'](0, 120),
    step: Math['max'](1, Math['trunc'](Number(loopState['step'] || 0)) + 1),
    completedSteps: countCompletedSteps(loopState['toolResults']),
    retryable: true,
  };
}
export function buildAgentExecutionDiagnostic({
  execution: execution = {},
  recovery: recovery = null,
  step: step = 0,
  completedSteps: completedSteps = null,
  locale: locale = 'zh-CN',
} = {}) {
  const errorCode3 = normalizeErrorCode(
      execution['errorCode'] || execution['raw']?.['errorCode'],
      'EXECUTION_ACTION_FAILED',
    ),
    phaseLabel3 = getDiagnosticCopy(locale, 'execution', 'EXECUTION_ACTION_FAILED'),
    next = (Array['isArray'](execution['results']) ? execution['results'] : [])['filter'](
      (response2) => response2?.['ok'] !== false,
    )['length'],
    completedSteps2 =
      completedSteps != null && Number['isFinite'](Number(completedSteps))
        ? Math['max'](0, Math['trunc'](Number(completedSteps)))
        : next;
  return {
    phase: 'execution',
    phaseLabel: phaseLabel3['phaseLabel'],
    summary: phaseLabel3['summary'],
    detail: phaseLabel3['detail'],
    errorCode: errorCode3,
    sourceErrorCode: '',
    commandId: String(recovery?.['failedAction']?.['type'] || '')
      ['trim']()
      ['slice'](0, 120),
    step: Math['max'](1, Math['trunc'](Number(step || 0)) + 1),
    completedSteps: completedSteps2,
    retryable: Boolean(recovery),
  };
}
export function buildAgentPlannerRecovery({
  originalMessage: originalMessage = '',
  locale: locale = 'zh-CN',
} = {}) {
  const label = DIAGNOSTIC_COPY[normalizeLocale(locale)];
  return {
    kind: 'planner',
    options: [
      { id: 'retryPlanner', label: label['retryPlanner'] },
      {
        id: 'editRequest',
        label: label['editRequest'],
        draft: String(originalMessage || '')
          ['trim']()
          ['slice'](0, MAX_DRAFT_CHARS),
      },
      { id: 'changeModel', label: label['changeModel'] },
    ],
  };
}
export const agentFailureDiagnosticInternals = Object['freeze']({
  classifyPlannerFailure: classifyPlannerFailure,
  normalizeErrorCode: normalizeErrorCode,
});
