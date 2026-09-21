import commandRegistry, { CanvasCommandError } from './commandRegistry.js';
import {
  createCanvasCommandFailure,
  createCanvasCommandSuccess,
  isCanvasCommandFailure,
} from './commandResult.js';
function normalizeCommandId(_0x522207) {
  return String(_0x522207 || '').trim();
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
function getRegistry(_0x2fb60e = {}) {
  return _0x2fb60e.commandRegistry || _0x2fb60e.registry || commandRegistry;
}
function normalizeValidation(_0x241c19, _0x49f513, _0x37f588) {
  if (_0x49f513 === undefined || _0x49f513 === null || _0x49f513 === true)
    return { ok: true, args: _0x37f588 };
  if (typeof _0x49f513 === 'string')
    return { ok: false, commandId: _0x241c19, errorCode: 'VALIDATION_FAILED', message: _0x49f513 };
  if (isCanvasCommandFailure(_0x49f513))
    return {
      ok: false,
      commandId: _0x241c19,
      errorCode: _0x49f513.errorCode || 'VALIDATION_FAILED',
      message: _0x49f513.message || 'Canvas command validation failed.',
      details: _0x49f513.details,
    };
  if (_0x49f513 && typeof _0x49f513 === 'object')
    return {
      ok: true,
      args: Object.prototype.hasOwnProperty.call(_0x49f513, 'args') ? _0x49f513.args : _0x37f588,
    };
  if (_0x49f513 === false)
    return {
      ok: false,
      commandId: _0x241c19,
      errorCode: 'VALIDATION_FAILED',
      message: 'Canvas command validation failed.',
    };
  return { ok: true, args: _0x37f588 };
}
function buildFailure(_0x486b76, _0x3c9e2b, _0x3b0ebf, _0x3a61de = undefined) {
  return createCanvasCommandFailure({
    commandId: _0x486b76,
    errorCode: _0x3c9e2b,
    message: _0x3b0ebf,
    details: _0x3a61de,
  });
}
function normalizeThrownError(_0x4a8ad8, _0x22fda4) {
  if (_0x22fda4 instanceof CanvasCommandError)
    return buildFailure(_0x4a8ad8, _0x22fda4.errorCode, _0x22fda4.message, _0x22fda4.details);
  return buildFailure(
    _0x4a8ad8,
    'COMMAND_EXECUTION_FAILED',
    _0x22fda4?.message || 'Canvas command execution failed.',
  );
}
function normalizeActionAlias(_0x380987 = {}) {
  const _0x17273d = _0x380987.alias ?? _0x380987.resultAlias ?? _0x380987.as ?? '',
    _0x3b01ad = String(_0x17273d || '').trim();
  if (!_0x3b01ad) return { ok: true, alias: '' };
  if (!PLAN_ALIAS_PATTERN.test(_0x3b01ad))
    return {
      ok: false,
      errorCode: 'INVALID_ACTION_ALIAS',
      message: 'Canvas command plan action alias is invalid: ' + _0x3b01ad,
    };
  return { ok: true, alias: _0x3b01ad };
}
function readPathSegment(_0x186828, _0x23484a) {
  if (_0x186828 == null) return undefined;
  if (Array.isArray(_0x186828) && /^\d+$/.test(_0x23484a)) return _0x186828[Number(_0x23484a)];
  return _0x186828?.[_0x23484a];
}
function resolveVariable(_0x39ac37, _0x4285ae) {
  const _0x1676f4 = String(_0x39ac37 || '')
      .trim()
      .split('.')
      .map((_0x545231) => _0x545231.trim())
      .filter(Boolean),
    _0x56d7e6 = _0x1676f4.shift();
  if (!_0x56d7e6 || !_0x4285ae.has(_0x56d7e6)) return { ok: false, expression: _0x39ac37 };
  let _0x4f7559 = _0x4285ae.get(_0x56d7e6);
  for (const _0x43c92e of _0x1676f4) {
    _0x4f7559 = readPathSegment(_0x4f7559, _0x43c92e);
    if (_0x4f7559 === undefined) return { ok: false, expression: _0x39ac37 };
  }
  return { ok: true, value: _0x4f7559 };
}
function stringifyInterpolatedValue(_0x3a4d7f) {
  if (_0x3a4d7f == null) return '';
  if (typeof _0x3a4d7f === 'string') return _0x3a4d7f;
  if (typeof _0x3a4d7f === 'number' || typeof _0x3a4d7f === 'boolean') return String(_0x3a4d7f);
  return JSON.stringify(_0x3a4d7f);
}
function interpolateString(_0x40897a, _0x2235a3) {
  const _0x5ac2e7 = _0x40897a.match(EXACT_VARIABLE_PATTERN);
  if (_0x5ac2e7) {
    const _0x1bba89 = resolveVariable(_0x5ac2e7[1] || _0x5ac2e7[2] || _0x5ac2e7[3], _0x2235a3);
    if (!_0x1bba89.ok)
      throw new CanvasCommandError(
        'UNRESOLVED_PLAN_VARIABLE',
        'Canvas command plan variable is not available: ' + _0x1bba89.expression,
        { expression: _0x1bba89.expression },
      );
    return _0x1bba89.value;
  }
  return _0x40897a.replace(VARIABLE_PATTERN, (_0x3106b7, _0xa96817, _0x11d390, _0x4435fe) => {
    const _0x191cd9 = _0xa96817 || _0x11d390 || _0x4435fe,
      _0x5a3627 = resolveVariable(_0x191cd9, _0x2235a3);
    if (!_0x5a3627.ok)
      throw new CanvasCommandError(
        'UNRESOLVED_PLAN_VARIABLE',
        'Canvas command plan variable is not available: ' + _0x5a3627.expression,
        { expression: _0x5a3627.expression },
      );
    return stringifyInterpolatedValue(_0x5a3627.value);
  });
}
function interpolatePlanValue(_0x5d234a, _0x4eeb06) {
  if (typeof _0x5d234a === 'string') return interpolateString(_0x5d234a, _0x4eeb06);
  if (Array.isArray(_0x5d234a))
    return _0x5d234a.map((_0x28438d) => interpolatePlanValue(_0x28438d, _0x4eeb06));
  if (_0x5d234a && typeof _0x5d234a === 'object') {
    const _0x4f42af = {};
    for (const [_0x253d65, _0x4f82a9] of Object.entries(_0x5d234a)) {
      _0x4f42af[_0x253d65] = interpolatePlanValue(_0x4f82a9, _0x4eeb06);
    }
    return _0x4f42af;
  }
  return _0x5d234a;
}
function interpolatePlanArgs(_0x494d5f, _0x3f7091) {
  try {
    return { ok: true, args: interpolatePlanValue(_0x494d5f || {}, _0x3f7091) };
  } catch (_0xb0dea8) {
    if (_0xb0dea8 instanceof CanvasCommandError)
      return {
        ok: false,
        errorCode: _0xb0dea8.errorCode,
        message: _0xb0dea8.message,
        details: _0xb0dea8.details,
      };
    return {
      ok: false,
      errorCode: 'PLAN_INTERPOLATION_FAILED',
      message: _0xb0dea8?.message || 'Canvas command plan argument interpolation failed.',
    };
  }
}
function snapshotVariables(_0x5321f7) {
  const _0x564378 = {};
  for (const [_0x3f195a, _0x22ecd2] of _0x5321f7.entries()) _0x564378[_0x3f195a] = _0x22ecd2;
  return _0x564378;
}
function createPlanScope(_0x815b35 = {}) {
  const _0xc8385b = new Map();
  if (_0x815b35 instanceof Map) {
    for (const [_0x5b8366, _0x48868c] of _0x815b35.entries()) {
      const _0x151a55 = String(_0x5b8366 || '').trim();
      PLAN_ALIAS_PATTERN.test(_0x151a55) && _0xc8385b.set(_0x151a55, _0x48868c);
    }
    return _0xc8385b;
  }
  if (_0x815b35 && typeof _0x815b35 === 'object')
    for (const [_0x547bb3, _0x2fadac] of Object.entries(_0x815b35)) {
      const _0x250ec0 = String(_0x547bb3 || '').trim();
      PLAN_ALIAS_PATTERN.test(_0x250ec0) && _0xc8385b.set(_0x250ec0, _0x2fadac);
    }
  return _0xc8385b;
}
export function hasCanvasCommandPlanVariableReference(_0x440b2e) {
  if (typeof _0x440b2e === 'string') return VARIABLE_TEST_PATTERN.test(_0x440b2e);
  if (Array.isArray(_0x440b2e))
    return _0x440b2e.some((_0x55f46e) => hasCanvasCommandPlanVariableReference(_0x55f46e));
  if (_0x440b2e && typeof _0x440b2e === 'object')
    return Object.values(_0x440b2e).some((_0x376393) => hasCanvasCommandPlanVariableReference(_0x376393));
  return false;
}
export async function executeCanvasCommand(_0x3ffd29, _0x459610 = {}, _0x274579 = {}) {
  const _0x830846 = normalizeCommandId(_0x3ffd29);
  if (!_0x830846) return buildFailure('', 'MISSING_COMMAND_ID', 'Canvas command id is required.');
  const _0x55c1c7 = getRegistry(_0x274579),
    _0x100785 = _0x55c1c7?.get?.(_0x830846) || null;
  if (!_0x100785) return buildFailure(_0x830846, 'UNKNOWN_COMMAND', 'Unknown canvas command: ' + _0x830846);
  try {
    const _0x73d0f4 = normalizeValidation(_0x830846, _0x100785.validate?.(_0x459610, _0x274579), _0x459610);
    if (!_0x73d0f4.ok) return _0x73d0f4;
    const _0x278ce4 = await _0x100785.execute(_0x73d0f4.args, _0x274579),
      _0x2aa718 = createCanvasCommandSuccess({
        commandId: _0x830846,
        result: _0x278ce4,
        message: _0x100785.description || _0x830846,
        riskLevel: _0x100785.riskLevel || 'safe',
      });
    return (
      _0x274579.recordCommand?.({
        commandId: _0x830846,
        args: _0x73d0f4.args,
        result: _0x2aa718,
        riskLevel: _0x100785.riskLevel || 'safe',
        ts: Date.now(),
      }),
      _0x2aa718
    );
  } catch (_0x308ce4) {
    const _0x5a631b = normalizeThrownError(_0x830846, _0x308ce4);
    return (
      _0x274579.recordCommand?.({ commandId: _0x830846, args: _0x459610, result: _0x5a631b, ts: Date.now() }),
      _0x5a631b
    );
  }
}
function normalizePlanAction(_0x88db81, _0x49090e) {
  if (!_0x88db81 || typeof _0x88db81 !== 'object' || Array.isArray(_0x88db81))
    return {
      ok: false,
      errorCode: 'INVALID_PLAN_ACTION',
      message: 'Canvas command plan action at index ' + _0x49090e + ' must be an object.',
    };
  const _0x446182 = normalizeCommandId(_0x88db81.commandId || _0x88db81.type || _0x88db81.id);
  if (!_0x446182)
    return {
      ok: false,
      errorCode: 'MISSING_COMMAND_ID',
      message: 'Canvas command plan action at index ' + _0x49090e + ' is missing commandId or type.',
    };
  return {
    ok: true,
    commandId: _0x446182,
    args: _0x88db81.args && typeof _0x88db81.args === 'object' ? _0x88db81.args : {},
    alias: '',
  };
}
export async function executeCanvasCommandPlan(_0xa72015 = [], _0x105788 = {}, _0x52a4bc = {}) {
  if (!Array.isArray(_0xa72015))
    return buildFailure('plan', 'INVALID_COMMAND_PLAN', 'Canvas command plan must be an array.');
  const _0x3ffdfa = [],
    _0x383968 = createPlanScope(_0x52a4bc.initialScope || _0x52a4bc.scope);
  for (let _0x1ae547 = 0; _0x1ae547 < _0xa72015.length; _0x1ae547 += 1) {
    const _0x35acfe = normalizePlanAction(_0xa72015[_0x1ae547], _0x1ae547);
    if (!_0x35acfe.ok)
      return {
        ...buildFailure('plan', _0x35acfe.errorCode, _0x35acfe.message),
        result: { actions: _0x3ffdfa, failedIndex: _0x1ae547 },
      };
    const _0x109da0 = normalizeActionAlias(_0xa72015[_0x1ae547]);
    if (!_0x109da0.ok)
      return {
        ...buildFailure('plan', _0x109da0.errorCode, _0x109da0.message),
        result: { actions: _0x3ffdfa, failedIndex: _0x1ae547, aliases: snapshotVariables(_0x383968) },
      };
    const _0x4e2cd7 = interpolatePlanArgs(_0x35acfe.args, _0x383968);
    if (!_0x4e2cd7.ok)
      return {
        ...buildFailure('plan', _0x4e2cd7.errorCode, _0x4e2cd7.message, _0x4e2cd7.details),
        result: { actions: _0x3ffdfa, failedIndex: _0x1ae547, aliases: snapshotVariables(_0x383968) },
      };
    const _0x899a45 = await executeCanvasCommand(_0x35acfe.commandId, _0x4e2cd7.args, _0x105788),
      _0x3e2474 = _0x109da0.alias ? { ..._0x899a45, alias: _0x109da0.alias } : _0x899a45;
    _0x3ffdfa.push(_0x3e2474);
    if (!_0x899a45.ok)
      return {
        ...buildFailure('plan', _0x899a45.errorCode, _0x899a45.message),
        result: { actions: _0x3ffdfa, failedIndex: _0x1ae547, aliases: snapshotVariables(_0x383968) },
      };
    if (_0x109da0.alias) _0x383968.set(_0x109da0.alias, _0x899a45.result);
  }
  return {
    ok: true,
    commandId: 'plan',
    result: { actions: _0x3ffdfa, aliases: snapshotVariables(_0x383968) },
    message: 'Canvas command plan executed.',
  };
}
