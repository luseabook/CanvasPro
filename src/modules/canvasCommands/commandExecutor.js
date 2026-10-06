import commandRegistry, { CanvasCommandError } from './commandRegistry.js';
import {
  createCanvasCommandFailure,
  createCanvasCommandSuccess,
  isCanvasCommandFailure,
} from './commandResult.js';
function normalizeCommandId(value) {
  return String(value || '').trim();
}
const PLAN_ALIAS_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/,
  SIMPLE_VARIABLE_SOURCE = String.raw`\$([A-Za-z_][A-Za-z0-9_]*(?:\.(?:[A-Za-z_][A-Za-z0-9_]*|\d+))*)`,
  EXACT_VARIABLE_PATTERN = new RegExp(
    String.raw`^(?:\$\{([^}]+)\}|\{\{\s*([^}]+?)\s*\}\}|${SIMPLE_VARIABLE_SOURCE})$`,
  ),
  VARIABLE_PATTERN = new RegExp(
    String.raw`\$\{([^}]+)\}|\{\{\s*([^}]+?)\s*\}\}|${SIMPLE_VARIABLE_SOURCE}`,
    'g',
  ),
  VARIABLE_TEST_PATTERN = new RegExp(String.raw`\$\{[^}]+\}|\{\{\s*[^}]+?\s*\}\}|${SIMPLE_VARIABLE_SOURCE}`);
function getRegistry(options = {}) {
  return options.commandRegistry || options.registry || commandRegistry;
}
function normalizeValidation(commandId, message, args) {
  if (message === undefined || message === null || message === true) return { ok: true, args: args };
  if (typeof message === 'string')
    return { ok: false, commandId: commandId, errorCode: 'VALIDATION_FAILED', message: message };
  if (isCanvasCommandFailure(message))
    return {
      ok: false,
      commandId: commandId,
      errorCode: message.errorCode || 'VALIDATION_FAILED',
      message: message.message || 'Canvas command validation failed.',
      details: message.details,
    };
  if (message && typeof message === 'object')
    return {
      ok: true,
      args: Object.prototype.hasOwnProperty.call(message, 'args') ? message.args : args,
    };
  if (message === false)
    return {
      ok: false,
      commandId: commandId,
      errorCode: 'VALIDATION_FAILED',
      message: 'Canvas command validation failed.',
    };
  return { ok: true, args: args };
}
function buildFailure(commandId2, errorCode, message2, details = undefined) {
  return createCanvasCommandFailure({
    commandId: commandId2,
    errorCode: errorCode,
    message: message2,
    details: details,
  });
}
function normalizeThrownError(item, error) {
  if (error instanceof CanvasCommandError)
    return buildFailure(item, error.errorCode, error.message, error.details);
  return buildFailure(item, 'COMMAND_EXECUTION_FAILED', error?.message || 'Canvas command execution failed.');
}
function normalizeActionAlias(options2 = {}) {
  const key = options2.alias ?? options2.resultAlias ?? options2.as ?? '',
    alias = String(key || '').trim();
  if (!alias) return { ok: true, alias: '' };
  if (!PLAN_ALIAS_PATTERN.test(alias))
    return {
      ok: false,
      errorCode: 'INVALID_ACTION_ALIAS',
      message: 'Canvas command plan action alias is invalid: ' + alias,
    };
  return { ok: true, alias: alias };
}
function readPathSegment(index, result) {
  if (index == null) return undefined;
  if (Array.isArray(index) && /^\d+$/.test(result)) return index[Number(result)];
  return index?.[result];
}
function resolveVariable(expression, map) {
  const data = String(expression || '')
      .trim()
      .split('.')
      .map((item2) => item2.trim())
      .filter(Boolean),
    enabled = data.shift();
  if (!enabled || !map.has(enabled)) return { ok: false, expression: expression };
  let value2 = map.get(enabled);
  for (const target of data) {
    value2 = readPathSegment(value2, target);
    if (value2 === undefined) return { ok: false, expression: expression };
  }
  return { ok: true, value: value2 };
}
function stringifyInterpolatedValue(source) {
  if (source == null) return '';
  if (typeof source === 'string') return source;
  if (typeof source === 'number' || typeof source === 'boolean') return String(source);
  return JSON.stringify(source);
}
function interpolateString(next, current) {
  const entry = next.match(EXACT_VARIABLE_PATTERN);
  if (entry) {
    const expression2 = resolveVariable(entry[1] || entry[2] || entry[3], current);
    if (!expression2.ok)
      throw new CanvasCommandError(
        'UNRESOLVED_PLAN_VARIABLE',
        'Canvas command plan variable is not available: ' + expression2.expression,
        { expression: expression2.expression },
      );
    return expression2.value;
  }
  return next.replace(VARIABLE_PATTERN, (record, payload, handle, state) => {
    const config = payload || handle || state,
      expression3 = resolveVariable(config, current);
    if (!expression3.ok)
      throw new CanvasCommandError(
        'UNRESOLVED_PLAN_VARIABLE',
        'Canvas command plan variable is not available: ' + expression3.expression,
        { expression: expression3.expression },
      );
    return stringifyInterpolatedValue(expression3.value);
  });
}
function interpolatePlanValue(list, scope) {
  if (typeof list === 'string') return interpolateString(list, scope);
  if (Array.isArray(list)) return list.map((item3) => interpolatePlanValue(item3, scope));
  if (list && typeof list === 'object') {
    const input = {};
    for (const [output, value3] of Object.entries(list)) {
      input[output] = interpolatePlanValue(value3, scope);
    }
    return input;
  }
  return list;
}
function interpolatePlanArgs(value4, value5) {
  try {
    return { ok: true, args: interpolatePlanValue(value4 || {}, value5) };
  } catch (errorCode2) {
    if (errorCode2 instanceof CanvasCommandError)
      return {
        ok: false,
        errorCode: errorCode2.errorCode,
        message: errorCode2.message,
        details: errorCode2.details,
      };
    return {
      ok: false,
      errorCode: 'PLAN_INTERPOLATION_FAILED',
      message: errorCode2?.message || 'Canvas command plan argument interpolation failed.',
    };
  }
}
function snapshotVariables(map2) {
  const value6 = {};
  for (const [value7, value8] of map2.entries()) value6[value7] = value8;
  return value6;
}
function createPlanScope(map3 = {}) {
  const map4 = new Map();
  if (map3 instanceof Map) {
    for (const [value9, value10] of map3.entries()) {
      const value11 = String(value9 || '').trim();
      PLAN_ALIAS_PATTERN.test(value11) && map4.set(value11, value10);
    }
    return map4;
  }
  if (map3 && typeof map3 === 'object')
    for (const [value12, value13] of Object.entries(map3)) {
      const value14 = String(value12 || '').trim();
      PLAN_ALIAS_PATTERN.test(value14) && map4.set(value14, value13);
    }
  return map4;
}
export function hasCanvasCommandPlanVariableReference(list2) {
  if (typeof list2 === 'string') return VARIABLE_TEST_PATTERN.test(list2);
  if (Array.isArray(list2)) return list2.some((item4) => hasCanvasCommandPlanVariableReference(item4));
  if (list2 && typeof list2 === 'object')
    return Object.values(list2).some((item5) => hasCanvasCommandPlanVariableReference(item5));
  return false;
}
export async function executeCanvasCommand(value15, args2 = {}, value16 = {}) {
  const commandId3 = normalizeCommandId(value15);
  if (!commandId3) return buildFailure('', 'MISSING_COMMAND_ID', 'Canvas command id is required.');
  const map5 = getRegistry(value16),
    message3 = map5?.get?.(commandId3) || null;
  if (!message3) return buildFailure(commandId3, 'UNKNOWN_COMMAND', 'Unknown canvas command: ' + commandId3);
  try {
    const args3 = normalizeValidation(commandId3, message3.validate?.(args2, value16), args2);
    if (!args3.ok) return args3;
    const result2 = await message3.execute(args3.args, value16),
      result3 = createCanvasCommandSuccess({
        commandId: commandId3,
        result: result2,
        message: message3.description || commandId3,
        riskLevel: message3.riskLevel || 'safe',
      });
    return (
      value16.recordCommand?.({
        commandId: commandId3,
        args: args3.args,
        result: result3,
        riskLevel: message3.riskLevel || 'safe',
        ts: Date.now(),
      }),
      result3
    );
  } catch (value17) {
    const result4 = normalizeThrownError(commandId3, value17);
    return (
      value16.recordCommand?.({ commandId: commandId3, args: args2, result: result4, ts: Date.now() }),
      result4
    );
  }
}
function normalizePlanAction(args4, value18) {
  if (!args4 || typeof args4 !== 'object' || Array.isArray(args4))
    return {
      ok: false,
      errorCode: 'INVALID_PLAN_ACTION',
      message: 'Canvas command plan action at index ' + value18 + ' must be an object.',
    };
  const commandId4 = normalizeCommandId(args4.commandId || args4.type || args4.id);
  if (!commandId4)
    return {
      ok: false,
      errorCode: 'MISSING_COMMAND_ID',
      message: 'Canvas command plan action at index ' + value18 + ' is missing commandId or type.',
    };
  return {
    ok: true,
    commandId: commandId4,
    args: args4.args && typeof args4.args === 'object' ? args4.args : {},
    alias: '',
  };
}
export async function executeCanvasCommandPlan(list3 = [], value19 = {}, value20 = {}) {
  if (!Array.isArray(list3))
    return buildFailure('plan', 'INVALID_COMMAND_PLAN', 'Canvas command plan must be an array.');
  const actions = [],
    map6 = createPlanScope(value20.initialScope || value20.scope);
  for (let failedIndex = 0; failedIndex < list3.length; failedIndex += 1) {
    const error2 = normalizePlanAction(list3[failedIndex], failedIndex);
    if (!error2.ok)
      return {
        ...buildFailure('plan', error2.errorCode, error2.message),
        result: { actions: actions, failedIndex: failedIndex },
      };
    const alias2 = normalizeActionAlias(list3[failedIndex]);
    if (!alias2.ok)
      return {
        ...buildFailure('plan', alias2.errorCode, alias2.message),
        result: { actions: actions, failedIndex: failedIndex, aliases: snapshotVariables(map6) },
      };
    const error3 = interpolatePlanArgs(error2.args, map6);
    if (!error3.ok)
      return {
        ...buildFailure('plan', error3.errorCode, error3.message, error3.details),
        result: { actions: actions, failedIndex: failedIndex, aliases: snapshotVariables(map6) },
      };
    const error4 = await executeCanvasCommand(error2.commandId, error3.args, value19),
      value21 = alias2.alias ? { ...error4, alias: alias2.alias } : error4;
    actions.push(value21);
    if (!error4.ok)
      return {
        ...buildFailure('plan', error4.errorCode, error4.message),
        result: { actions: actions, failedIndex: failedIndex, aliases: snapshotVariables(map6) },
      };
    if (alias2.alias) map6.set(alias2.alias, error4.result);
  }
  return {
    ok: true,
    commandId: 'plan',
    result: { actions: actions, aliases: snapshotVariables(map6) },
    message: 'Canvas command plan executed.',
  };
}
export function executeCanvasCommandSync(value22, args5 = {}, value23 = {}) {
  const commandId5 = normalizeCommandId(value22);
  if (!commandId5) return buildFailure('', 'MISSING_COMMAND_ID', 'Canvas command id is required.');
  const map7 = getRegistry(value23),
    message4 = map7?.get?.(commandId5) || null;
  if (!message4) return buildFailure(commandId5, 'UNKNOWN_COMMAND', 'Unknown canvas command: ' + commandId5);
  try {
    const args6 = normalizeValidation(commandId5, message4.validate?.(args5, value23), args5);
    if (!args6.ok) return args6;
    if (message4.execute?.constructor?.name === 'AsyncFunction')
      return buildFailure(
        commandId5,
        'ASYNC_COMMAND_UNSUPPORTED',
        commandId5 + ' cannot run through a synchronous command entry.',
      );
    const result5 = message4.execute(args6.args, value23);
    if (result5 && typeof result5.then === 'function')
      return (
        Promise.resolve(result5).catch(() => {}),
        buildFailure(
          commandId5,
          'ASYNC_COMMAND_UNSUPPORTED',
          commandId5 + ' cannot run through a synchronous command entry.',
        )
      );
    const result6 = createCanvasCommandSuccess({
      commandId: commandId5,
      result: result5,
      message: message4.description || commandId5,
      riskLevel: message4.riskLevel || 'safe',
    });
    return (
      value23.recordCommand?.({
        commandId: commandId5,
        args: args6.args,
        result: result6,
        riskLevel: message4.riskLevel || 'safe',
        ts: Date.now(),
      }),
      result6
    );
  } catch (value24) {
    const result7 = normalizeThrownError(commandId5, value24);
    return (
      value23.recordCommand?.({
        commandId: commandId5,
        args: args5,
        result: result7,
        ts: Date.now(),
      }),
      result7
    );
  }
}
