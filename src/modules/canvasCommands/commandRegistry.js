export class CanvasCommandError extends Error {
  constructor(value, item, key = null) {
    (super(item),
      (this.name = 'CanvasCommandError'),
      (this.errorCode = String(value || 'CANVAS_COMMAND_ERROR')),
      (this.details = key));
  }
}
export function createCanvasCommandError(index, result, data = null) {
  return new CanvasCommandError(index, result, data);
}
function normalizeCommandId(options) {
  return String(options || '').trim();
}
function assertCommandShape(enabled) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled))
    throw new TypeError('[canvasCommands] command must be an object');
  const commandId = normalizeCommandId(enabled.id);
  if (!commandId) throw new TypeError('[canvasCommands] command.id is required');
  if (typeof enabled.execute !== 'function')
    throw new TypeError('[canvasCommands] command "' + commandId + '" must define execute()');
  if (enabled.validate !== undefined && typeof enabled.validate !== 'function')
    throw new TypeError('[canvasCommands] command "' + commandId + '" validate must be a function');
  return commandId;
}
function cloneJson(target, source) {
  if (target === undefined) return source;
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(target);
    } catch {
      return source;
    }
  try {
    return JSON.parse(JSON.stringify(target));
  } catch {
    return source;
  }
}
function normalizeStringArray(list) {
  return Array.isArray(list) ? list.map((item2) => String(item2 || '').trim()).filter(Boolean) : [];
}
function normalizeArgsSchema(options2 = {}) {
  const selectionFallback =
    options2 && typeof options2 === 'object' && !Array.isArray(options2) ? options2 : {};
  return {
    type: 'object',
    required: normalizeStringArray(selectionFallback.required),
    properties: cloneJson(selectionFallback.properties, {}),
    defaults: cloneJson(selectionFallback.defaults, {}),
    selectionFallback: selectionFallback.selectionFallback === true,
  };
}
function normalizeCapabilitySchema(options3 = {}) {
  const selectionFallback2 =
    options3 && typeof options3 === 'object' && !Array.isArray(options3) ? options3 : {};
  return {
    reads: normalizeStringArray(selectionFallback2.reads),
    writes: normalizeStringArray(selectionFallback2.writes),
    selectionFallback: selectionFallback2.selectionFallback === true,
    requiresMountedRuntime: selectionFallback2.requiresMountedRuntime === true,
    requiresSystemAccess: selectionFallback2.requiresSystemAccess === true,
  };
}
function normalizeReturnSchema(options4 = {}) {
  const next = options4 && typeof options4 === 'object' && !Array.isArray(options4) ? options4 : {};
  return {
    aliasFields: normalizeStringArray(next.aliasFields || next.returnAliasFields),
    properties: cloneJson(next.properties, {}),
  };
}
export class CanvasCommandRegistry {
  constructor(list2 = []) {
    this._commands = new Map();
    for (const current of list2) {
      this.register(current);
    }
  }
  ['register'](args) {
    const id = assertCommandShape(args);
    if (this._commands.has(id)) throw new Error('[canvasCommands] duplicate command id: ' + id);
    return (
      this._commands.set(id, {
        riskLevel: 'safe',
        description: '',
        ...args,
        id: id,
        argsSchema: normalizeArgsSchema(args.argsSchema),
        capabilitySchema: normalizeCapabilitySchema(args.capabilitySchema),
        returnSchema: normalizeReturnSchema(args.returnSchema),
      }),
      this
    );
  }
  ['has'](entry) {
    return this._commands.has(normalizeCommandId(entry));
  }
  ['get'](record) {
    return this._commands.get(normalizeCommandId(record)) || null;
  }
  ['list']() {
    return Array.from(this._commands.values()).map((id2) => ({
      id: id2.id,
      description: id2.description,
      riskLevel: id2.riskLevel,
      argsSchema: cloneJson(id2.argsSchema, {}),
      capabilitySchema: cloneJson(id2.capabilitySchema, {}),
      returnSchema: cloneJson(id2.returnSchema, {}),
      returnAliasFields: normalizeStringArray(id2.returnSchema?.aliasFields),
    }));
  }
}
export function createCanvasCommandRegistry(list3 = []) {
  return new CanvasCommandRegistry(list3);
}
export const canvasCommandRegistry = new CanvasCommandRegistry();
export default canvasCommandRegistry;
