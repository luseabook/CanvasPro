import { executeCanvasCommandPlan } from '../canvasCommands/index.js';
export async function executeAgentActions(
  _0x412716 = [],
  {
    commandContext: commandContext = {},
    executePlan: executePlan = executeCanvasCommandPlan,
    initialScope: initialScope = {},
  } = {},
) {
  if (!Array.isArray(_0x412716))
    return {
      ok: false,
      status: 'failed',
      errorCode: 'INVALID_AGENT_ACTIONS',
      message: 'Agent actions must be an array.',
      results: [],
    };
  const _0x50ff8d = _0x412716.map((_0x1d00ca) => ({
      type: _0x1d00ca.type,
      ...(_0x1d00ca.alias || _0x1d00ca.resultAlias || _0x1d00ca.as
        ? { alias: _0x1d00ca.alias || _0x1d00ca.resultAlias || _0x1d00ca.as }
        : {}),
      args: _0x1d00ca.args || {},
    })),
    _0x829174 = await executePlan(_0x50ff8d, commandContext, { initialScope: initialScope });
  return {
    ok: _0x829174.ok === true,
    status: _0x829174.ok === true ? 'success' : 'failed',
    errorCode: _0x829174.errorCode || '',
    message: _0x829174.message || '',
    results: _0x829174.result?.actions || [],
    raw: _0x829174,
  };
}
