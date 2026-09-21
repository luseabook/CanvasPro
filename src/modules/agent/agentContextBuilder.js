import { canvasCommandRegistry } from '../canvasCommands/index.js';
import { buildAgentCanvasSummary } from './agentCanvasSummary.js';
import { listAgentSkills } from './agentSkillCatalog.js';
export const DEFAULT_AGENT_CONTEXT_BUDGET_CHARS = 0x8ca0;
export const MAX_EMPTY_CANVAS_CONTEXT_CHARS = 0x9c40;
const AGENT_INPUT_REF_CONTEXT_LIMIT = 12;
function estimateJsonChars(_0x30226e) {
  try {
    return JSON.stringify(_0x30226e).length;
  } catch {
    return 0;
  }
}
function normalizeContextBudget(_0x4004a4) {
  const _0x32fa88 = Number(_0x4004a4);
  if (!Number.isFinite(_0x32fa88) || _0x32fa88 <= 0) return DEFAULT_AGENT_CONTEXT_BUDGET_CHARS;
  return Math.trunc(_0x32fa88);
}
function getModelLimitForBudget(_0xce18e6) {
  if (_0xce18e6 <= 0x61a8) return 10;
  if (_0xce18e6 <= 0x7d00) return 14;
  return 22;
}
function summarizeWorkflowsFromModels(_0x6630f1 = []) {
  return _0x6630f1
    .filter((_0x145632) => _0x145632?.adapterType === 'workflow')
    .map((_0x2bd8b1) => ({
      modelId: _0x2bd8b1.modelId,
      provider: _0x2bd8b1.provider,
      kind: _0x2bd8b1.kind,
      adapterType: _0x2bd8b1.adapterType,
      executionId: _0x2bd8b1.executionId,
      displayName: _0x2bd8b1.displayName,
    }));
}
function markCanvasCatalogTruncated(_0x22e05f = {}) {
  if (!_0x22e05f.modelCatalog) _0x22e05f.modelCatalog = {};
  ((_0x22e05f.modelCatalog.truncated = true),
    (_0x22e05f.modelCatalog.includedModels = Array.isArray(_0x22e05f.availableModels)
      ? _0x22e05f.availableModels.length
      : 0));
}
function truncatePreviewText(_0x1fe933, _0x566a73) {
  const _0xfefb8e = String(_0x1fe933 || '');
  if (_0xfefb8e.length <= _0x566a73) return _0xfefb8e;
  return _0xfefb8e.slice(0, Math.max(0, _0x566a73 - 3)) + '...';
}
function normalizeInputKind(_0x40eb9d = '') {
  const _0x312e85 = String(_0x40eb9d || '').trim();
  if (_0x312e85.includes('image')) return 'image';
  if (_0x312e85.includes('video')) return 'video';
  if (_0x312e85.includes('audio')) return 'audio';
  if (_0x312e85.includes('text')) return 'text';
  return _0x312e85 || 'node';
}
function normalizeAgentInputRefs(_0x42cc23 = []) {
  if (!Array.isArray(_0x42cc23)) return [];
  const _0x395ad1 = new Set();
  return _0x42cc23
    .map((_0x3e1fd5 = {}) => {
      const _0x321d55 = String(_0x3e1fd5.nodeId || _0x3e1fd5.id || '').trim();
      if (!_0x321d55 || _0x395ad1.has(_0x321d55)) return null;
      _0x395ad1.add(_0x321d55);
      const _0x2e949c = String(_0x3e1fd5.type || '').trim(),
        _0x1ff51c = Number(_0x3e1fd5.width),
        _0x3d601d = Number(_0x3e1fd5.height),
        _0xa00946 = {
          nodeId: _0x321d55,
          id: _0x321d55,
          type: _0x2e949c,
          kind: String(_0x3e1fd5.kind || normalizeInputKind(_0x2e949c)).trim(),
          label: truncatePreviewText(_0x3e1fd5.label || _0x3e1fd5.name || _0x321d55, 80),
          source: String(_0x3e1fd5.source || 'agent-panel').trim(),
        };
      if (Number.isFinite(_0x1ff51c) && _0x1ff51c > 0) _0xa00946.width = Math.round(_0x1ff51c);
      if (Number.isFinite(_0x3d601d) && _0x3d601d > 0) _0xa00946.height = Math.round(_0x3d601d);
      return _0xa00946;
    })
    .filter(Boolean)
    .slice(0, AGENT_INPUT_REF_CONTEXT_LIMIT);
}
function updateBudgetMetadata(_0x476b05, _0x399f62, _0x4a861c = false) {
  return (
    (_0x476b05.contextBudget = {
      maxChars: _0x399f62,
      estimatedChars: 0,
      truncated: _0x4a861c === true || _0x476b05.canvas?.modelCatalog?.truncated === true,
      availableModels: Array.isArray(_0x476b05.canvas?.availableModels)
        ? _0x476b05.canvas.availableModels.length
        : 0,
    }),
    (_0x476b05.contextBudget.estimatedChars = estimateJsonChars(_0x476b05)),
    (_0x476b05.contextBudget.estimatedChars = estimateJsonChars(_0x476b05)),
    _0x476b05.contextBudget.estimatedChars
  );
}
function enforceContextBudget(_0x6fc54b, _0x32f095) {
  let _0x4748cb = updateBudgetMetadata(_0x6fc54b, _0x32f095),
    _0x2fe9dd = _0x6fc54b.contextBudget.truncated;
  const _0x2e619f = _0x6fc54b.canvas || {};
  for (const _0x215e5e of [14, 10, 6, 3, 0]) {
    if (_0x4748cb <= _0x32f095) break;
    if (!Array.isArray(_0x2e619f.availableModels) || _0x2e619f.availableModels.length <= _0x215e5e) continue;
    ((_0x2e619f.availableModels = _0x2e619f.availableModels.slice(0, _0x215e5e)),
      (_0x2e619f.availableWorkflows = summarizeWorkflowsFromModels(_0x2e619f.availableModels)),
      markCanvasCatalogTruncated(_0x2e619f),
      (_0x2fe9dd = true),
      (_0x4748cb = updateBudgetMetadata(_0x6fc54b, _0x32f095, _0x2fe9dd)));
  }
  for (const _0x19f3fd of [10, 5, 0]) {
    if (_0x4748cb <= _0x32f095) break;
    if (!Array.isArray(_0x2e619f.recentCommands) || _0x2e619f.recentCommands.length <= _0x19f3fd) continue;
    ((_0x2e619f.recentCommands = _0x2e619f.recentCommands.slice(-_0x19f3fd)),
      (_0x2fe9dd = true),
      (_0x4748cb = updateBudgetMetadata(_0x6fc54b, _0x32f095, _0x2fe9dd)));
  }
  for (const _0x1fe287 of [240, 120, 60]) {
    if (_0x4748cb <= _0x32f095) break;
    if (!Array.isArray(_0x2e619f.nodes) || _0x2e619f.nodes.length === 0) continue;
    ((_0x2e619f.nodes = _0x2e619f.nodes.map((_0x257bec) => ({
      ..._0x257bec,
      promptPreview: truncatePreviewText(_0x257bec.promptPreview, _0x1fe287),
      contentPreview: truncatePreviewText(_0x257bec.contentPreview, _0x1fe287),
    }))),
      (_0x2fe9dd = true),
      (_0x4748cb = updateBudgetMetadata(_0x6fc54b, _0x32f095, _0x2fe9dd)));
  }
  return (
    _0x4748cb > _0x32f095 &&
      Array.isArray(_0x6fc54b.commands) &&
      ((_0x6fc54b.commands = _0x6fc54b.commands.map((_0x38c694) => ({
        id: _0x38c694.id,
        riskLevel: _0x38c694.riskLevel,
      }))),
      (_0x2fe9dd = true),
      (_0x4748cb = updateBudgetMetadata(_0x6fc54b, _0x32f095, _0x2fe9dd))),
    updateBudgetMetadata(_0x6fc54b, _0x32f095, _0x2fe9dd),
    _0x6fc54b
  );
}
export function buildAgentContext({
  store: _0x43b119,
  commandRegistry: commandRegistry = canvasCommandRegistry,
  sessionStore: sessionStore = null,
  recentCommands: recentCommands = undefined,
  userMessage: userMessage = '',
  intent: intent = null,
  targetKind: targetKind = '',
  inputRefs: inputRefs = [],
  contextBudgetChars: contextBudgetChars = DEFAULT_AGENT_CONTEXT_BUDGET_CHARS,
  modelLimit: modelLimit = undefined,
} = {}) {
  const _0x10a461 = normalizeContextBudget(contextBudgetChars),
    _0x3e45fb = normalizeAgentInputRefs(inputRefs),
    _0x36927f = typeof commandRegistry?.list === 'function' ? commandRegistry.list() : [],
    _0x3f58d9 = recentCommands !== undefined ? recentCommands : sessionStore?.getRecentCommands?.() || [],
    _0x530ff7 = {
      schemaVersion: 1,
      canvas: buildAgentCanvasSummary({
        store: _0x43b119,
        recentCommands: _0x3f58d9,
        userMessage: userMessage,
        intent: intent,
        targetKind: targetKind,
        inputRefs: _0x3e45fb,
        modelLimit: modelLimit ?? getModelLimitForBudget(_0x10a461),
      }),
      commands: _0x36927f,
      skills: listAgentSkills(),
      policies: {
        actionPlanOnly: true,
        skillsProduceActionPlansOnly: true,
        noDomAccess: true,
        noArbitraryStoreWrites: true,
        noDirectNetwork: true,
        noElectronAccess: true,
        batchConfirmThreshold: 5,
      },
    };
  return ((_0x530ff7.canvas.inputRefs = _0x3e45fb), enforceContextBudget(_0x530ff7, _0x10a461));
}
