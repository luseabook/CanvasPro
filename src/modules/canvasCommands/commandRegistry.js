export class CanvasCommandError extends Error {
  constructor(_0x7751d3, _0xdde0df, _0x2e3e78 = null) {
    (super(_0xdde0df),
      (this.name = 'CanvasCommandError'),
      (this.errorCode = String(_0x7751d3 || 'CANVAS_COMMAND_ERROR')),
      (this.details = _0x2e3e78));
  }
}
export function createCanvasCommandError(_0x5a0c1c, _0x3834bc, _0x103774 = null) {
  return new CanvasCommandError(_0x5a0c1c, _0x3834bc, _0x103774);
}
function normalizeCommandId(_0x3aca03) {
  return String(_0x3aca03 || '').trim();
}
function assertCommandShape(_0x1f0c91) {
  if (!_0x1f0c91 || typeof _0x1f0c91 !== 'object' || Array.isArray(_0x1f0c91))
    throw new TypeError('[canvasCommands] command must be an object');
  const _0xa90d13 = normalizeCommandId(_0x1f0c91.id);
  if (!_0xa90d13) throw new TypeError('[canvasCommands] command.id is required');
  if (typeof _0x1f0c91.execute !== 'function')
    throw new TypeError('[canvasCommands] command "' + _0xa90d13 + '" must define execute()');
  if (_0x1f0c91.validate !== undefined && typeof _0x1f0c91.validate !== 'function')
    throw new TypeError('[canvasCommands] command "' + _0xa90d13 + '" validate must be a function');
  return _0xa90d13;
}
function cloneJson(_0x1ab67c, _0x395ce6) {
  if (_0x1ab67c === undefined) return _0x395ce6;
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x1ab67c);
    } catch {
      return _0x395ce6;
    }
  try {
    return JSON.parse(JSON.stringify(_0x1ab67c));
  } catch {
    return _0x395ce6;
  }
}
function normalizeStringArray(_0x37b9f6) {
  return Array.isArray(_0x37b9f6)
    ? _0x37b9f6.map((_0x4b182a) => String(_0x4b182a || '').trim()).filter(Boolean)
    : [];
}
function normalizeArgsSchema(_0xaffb1c = {}) {
  const _0x5e0196 = _0xaffb1c && typeof _0xaffb1c === 'object' && !Array.isArray(_0xaffb1c) ? _0xaffb1c : {};
  return {
    type: 'object',
    required: normalizeStringArray(_0x5e0196.required),
    properties: cloneJson(_0x5e0196.properties, {}),
    defaults: cloneJson(_0x5e0196.defaults, {}),
    selectionFallback: _0x5e0196.selectionFallback === true,
  };
}
function normalizeCapabilitySchema(_0x4d840d = {}) {
  const _0x54d775 = _0x4d840d && typeof _0x4d840d === 'object' && !Array.isArray(_0x4d840d) ? _0x4d840d : {};
  return {
    reads: normalizeStringArray(_0x54d775.reads),
    writes: normalizeStringArray(_0x54d775.writes),
    selectionFallback: _0x54d775.selectionFallback === true,
    requiresMountedRuntime: _0x54d775.requiresMountedRuntime === true,
    requiresSystemAccess: _0x54d775.requiresSystemAccess === true,
  };
}
function normalizeReturnSchema(_0x4345fc = {}) {
  const _0x14a902 = _0x4345fc && typeof _0x4345fc === 'object' && !Array.isArray(_0x4345fc) ? _0x4345fc : {};
  return {
    aliasFields: normalizeStringArray(_0x14a902.aliasFields || _0x14a902.returnAliasFields),
    properties: cloneJson(_0x14a902.properties, {}),
  };
}
export class CanvasCommandRegistry {
  constructor(_0x29d438 = []) {
    this._commands = new Map();
    for (const _0xed0ba1 of _0x29d438) {
      this.register(_0xed0ba1);
    }
  }
  ['register'](_0x220650) {
    const _0x2f93d3 = assertCommandShape(_0x220650);
    if (this._commands.has(_0x2f93d3)) throw new Error('[canvasCommands] duplicate command id: ' + _0x2f93d3);
    return (
      this._commands.set(_0x2f93d3, {
        riskLevel: 'safe',
        description: '',
        ..._0x220650,
        id: _0x2f93d3,
        argsSchema: normalizeArgsSchema(_0x220650.argsSchema),
        capabilitySchema: normalizeCapabilitySchema(_0x220650.capabilitySchema),
        returnSchema: normalizeReturnSchema(_0x220650.returnSchema),
      }),
      this
    );
  }
  ['has'](_0xdbc77b) {
    return this._commands.has(normalizeCommandId(_0xdbc77b));
  }
  ['get'](_0x54cbb1) {
    return this._commands.get(normalizeCommandId(_0x54cbb1)) || null;
  }
  ['list']() {
    return Array.from(this._commands.values()).map((_0x5939f1) => ({
      id: _0x5939f1.id,
      description: _0x5939f1.description,
      riskLevel: _0x5939f1.riskLevel,
      argsSchema: cloneJson(_0x5939f1.argsSchema, {}),
      capabilitySchema: cloneJson(_0x5939f1.capabilitySchema, {}),
      returnSchema: cloneJson(_0x5939f1.returnSchema, {}),
      returnAliasFields: normalizeStringArray(_0x5939f1.returnSchema?.aliasFields),
    }));
  }
}
export function createCanvasCommandRegistry(_0x355897 = []) {
  return new CanvasCommandRegistry(_0x355897);
}
export const canvasCommandRegistry = new CanvasCommandRegistry();
export default canvasCommandRegistry;
