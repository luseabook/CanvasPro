const MAX_DRAFT_CHARS = 0xfa0,
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
        'Model\x20service\x20network\x20request\x20failed',
        'No executable plan was received. Resume from the current checkpoint.',
      ],
      PLANNER_NO_ACTION: [
        'Planner\x20returned\x20no\x20canvas\x20action',
        'The\x20request\x20required\x20a\x20canvas\x20change,\x20but\x20the\x20model\x20returned\x20no\x20executable\x20action.',
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
        'Planner\x20action\x20is\x20unavailable',
        'The model selected an unsupported or undisclosed command for this turn.',
      ],
      PLANNER_REQUEST_ERROR: [
        'Model\x20planning\x20request\x20failed',
        'The request returned no executable plan. The task and completed steps were preserved.',
      ],
      EXECUTION_ACTION_FAILED: [
        'Canvas action failed',
        'Completed\x20preparation\x20was\x20preserved.\x20Retry\x20the\x20failed\x20action\x20or\x20revise\x20the\x20request.',
      ],
      retryPlanner: 'Repair\x20and\x20continue',
      editRequest: 'Edit request',
      changeModel: 'Change model',
    }),
  });
function normalizeLocale(_0x1cc773 = '') {
  return String(_0x1cc773 || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function normalizeErrorCode(_0x278d49 = '', _0x530cae = '') {
  const _0xad876 = String(_0x278d49 || '')
    ['trim']()
    ['toUpperCase']()
    ['replace'](/[^A-Z0-9_.-]/g, '_')
    ['slice'](0x0, 0x50);
  return _0xad876 || _0x530cae;
}
function classifyPlannerFailure({
  validation: validation = null,
  cause: cause = '',
  reason: reason = '',
} = {}) {
  if (reason === 'no_action') return 'PLANNER_NO_ACTION';
  const _0x20a2dc = normalizeErrorCode(validation?.['errorCode']);
  if (_0x20a2dc === 'AGENT_PLAN_FAILED') return 'PLANNER_REPORTED_FAILURE';
  if (['UNKNOWN_AGENT_ACTION', 'DEFERRED_AGENT_ACTION', 'BLOCKED_AGENT_ACTION']['includes'](_0x20a2dc))
    return 'PLANNER_UNSUPPORTED_ACTION';
  if (_0x20a2dc) return 'PLANNER_INVALID_ACTION';
  const _0x544399 = String(cause || '')['toLowerCase']();
  if (/\b(?:401|403)\b|unauthori[sz]ed|forbidden|api[ _-]?key|authentication/['test'](_0x544399))
    return 'PLANNER_AUTH_ERROR';
  if (/\b429\b|rate.?limit|too many requests|quota/['test'](_0x544399)) return 'PLANNER_RATE_LIMITED';
  if (/timeout|timed out|deadline/['test'](_0x544399)) return 'PLANNER_TIMEOUT';
  if (/fetch|network|econn|enotfound|socket|offline|connection/['test'](_0x544399))
    return 'PLANNER_NETWORK_ERROR';
  return 'PLANNER_REQUEST_ERROR';
}
function getDiagnosticCopy(_0x1399a7, _0x49b651, _0x54ebc9) {
  const _0x4705b2 = DIAGNOSTIC_COPY[normalizeLocale(_0x1399a7)],
    [_0xe4a283, _0x4b5905] = _0x4705b2[_0x54ebc9] || _0x4705b2['PLANNER_REQUEST_ERROR'];
  return { phaseLabel: _0x4705b2[_0x49b651] || _0x4705b2['planning'], summary: _0xe4a283, detail: _0x4b5905 };
}
function countCompletedSteps(_0x457caa = []) {
  return (Array['isArray'](_0x457caa) ? _0x457caa : [])['filter']((_0x40764d) => _0x40764d?.['ok'] === !![])[
    'length'
  ];
}
export function buildAgentPlannerDiagnostic({
  loopState: loopState = {},
  validation: validation = null,
  cause: cause = '',
  reason: reason = '',
  locale: locale = 'zh-CN',
} = {}) {
  const _0x59ff40 = classifyPlannerFailure({ validation: validation, cause: cause, reason: reason }),
    _0x3a66d7 = getDiagnosticCopy(locale, 'planning', _0x59ff40),
    _0x278788 = Array['isArray'](loopState['validationFeedback'])
      ? loopState['validationFeedback']['at'](-0x1)
      : null;
  return {
    phase: 'planning',
    phaseLabel: _0x3a66d7['phaseLabel'],
    summary: _0x3a66d7['summary'],
    detail: _0x3a66d7['detail'],
    errorCode: _0x59ff40,
    sourceErrorCode: normalizeErrorCode(validation?.['errorCode'] || _0x278788?.['errorCode']),
    commandId: String(validation?.['plan']?.['actions']?.[0x0]?.['type'] || _0x278788?.['commandId'] || '')
      ['trim']()
      ['slice'](0x0, 0x78),
    step: Math['max'](0x1, Math['trunc'](Number(loopState['step'] || 0x0)) + 0x1),
    completedSteps: countCompletedSteps(loopState['toolResults']),
    retryable: !![],
  };
}
export function buildAgentExecutionDiagnostic({
  execution: execution = {},
  recovery: recovery = null,
  step: step = 0x0,
  completedSteps: _0x31095c = null,
  locale: locale = 'zh-CN',
} = {}) {
  const _0x3e8091 = normalizeErrorCode(
      execution['errorCode'] || execution['raw']?.['errorCode'],
      'EXECUTION_ACTION_FAILED',
    ),
    _0x53d2c3 = getDiagnosticCopy(locale, 'execution', 'EXECUTION_ACTION_FAILED'),
    _0x334cfc = (Array['isArray'](execution['results']) ? execution['results'] : [])['filter'](
      (_0x3a7977) => _0x3a7977?.['ok'] !== ![],
    )['length'],
    _0x5bbf97 =
      _0x31095c != null && Number['isFinite'](Number(_0x31095c))
        ? Math['max'](0x0, Math['trunc'](Number(_0x31095c)))
        : _0x334cfc;
  return {
    phase: 'execution',
    phaseLabel: _0x53d2c3['phaseLabel'],
    summary: _0x53d2c3['summary'],
    detail: _0x53d2c3['detail'],
    errorCode: _0x3e8091,
    sourceErrorCode: '',
    commandId: String(recovery?.['failedAction']?.['type'] || '')
      ['trim']()
      ['slice'](0x0, 0x78),
    step: Math['max'](0x1, Math['trunc'](Number(step || 0x0)) + 0x1),
    completedSteps: _0x5bbf97,
    retryable: Boolean(recovery),
  };
}
export function buildAgentPlannerRecovery({
  originalMessage: originalMessage = '',
  locale: locale = 'zh-CN',
} = {}) {
  const _0x400475 = DIAGNOSTIC_COPY[normalizeLocale(locale)];
  return {
    kind: 'planner',
    options: [
      { id: 'retryPlanner', label: _0x400475['retryPlanner'] },
      {
        id: 'editRequest',
        label: _0x400475['editRequest'],
        draft: String(originalMessage || '')
          ['trim']()
          ['slice'](0x0, MAX_DRAFT_CHARS),
      },
      { id: 'changeModel', label: _0x400475['changeModel'] },
    ],
  };
}
export const agentFailureDiagnosticInternals = Object['freeze']({
  classifyPlannerFailure: classifyPlannerFailure,
  normalizeErrorCode: normalizeErrorCode,
});
