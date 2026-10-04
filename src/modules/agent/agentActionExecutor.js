import { executeCanvasCommandPlan } from '../canvasCommands/index.js';
export async function executeAgentActions(
  list = [],
  {
    commandContext: commandContext = {},
    executePlan: executePlan = executeCanvasCommandPlan,
    initialScope: initialScope = {},
  } = {},
) {
  if (!Array.isArray(list))
    return {
      ok: false,
      status: 'failed',
      errorCode: 'INVALID_AGENT_ACTIONS',
      message: 'Agent actions must be an array.',
      results: [],
    };
  const value = list.map((type) => ({
      type: type.type,
      ...(type.alias || type.resultAlias || type.as
        ? { alias: type.alias || type.resultAlias || type.as }
        : {}),
      args: type.args || {},
    })),
    ok = await executePlan(value, commandContext, { initialScope: initialScope });
  return {
    ok: ok.ok === true,
    status: ok.ok === true ? 'success' : 'failed',
    errorCode: ok.errorCode || '',
    message: ok.message || '',
    results: ok.result?.actions || [],
    raw: ok,
  };
}
