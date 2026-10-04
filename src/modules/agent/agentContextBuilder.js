import { canvasCommandRegistry } from '../canvasCommands/index.js';
import { buildAgentCanvasSummary } from './agentCanvasSummary.js';
import { listAgentSkills } from './agentSkillCatalog.js';
export const DEFAULT_AGENT_CONTEXT_BUDGET_CHARS = 0x8ca0;
export const MAX_EMPTY_CANVAS_CONTEXT_CHARS = 0x9c40;
const AGENT_INPUT_REF_CONTEXT_LIMIT = 12;
function estimateJsonChars(value) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}
function normalizeContextBudget(item) {
  const count = Number(item);
  if (!Number.isFinite(count) || count <= 0) return DEFAULT_AGENT_CONTEXT_BUDGET_CHARS;
  return Math.trunc(count);
}
function getModelLimitForBudget(count2) {
  if (count2 <= 0x61a8) return 10;
  if (count2 <= 0x7d00) return 14;
  return 22;
}
function summarizeWorkflowsFromModels(list = []) {
  return list
    .filter((item2) => item2?.adapterType === 'workflow')
    .map((modelId) => ({
      modelId: modelId.modelId,
      provider: modelId.provider,
      kind: modelId.kind,
      adapterType: modelId.adapterType,
      executionId: modelId.executionId,
      displayName: modelId.displayName,
    }));
}
function markCanvasCatalogTruncated(enabled = {}) {
  if (!enabled.modelCatalog) enabled.modelCatalog = {};
  ((enabled.modelCatalog.truncated = true),
    (enabled.modelCatalog.includedModels = Array.isArray(enabled.availableModels)
      ? enabled.availableModels.length
      : 0));
}
function truncatePreviewText(key, index) {
  const list2 = String(key || '');
  if (list2.length <= index) return list2;
  return list2.slice(0, Math.max(0, index - 3)) + '...';
}
function normalizeInputKind(result = '') {
  const list3 = String(result || '').trim();
  if (list3.includes('image')) return 'image';
  if (list3.includes('video')) return 'video';
  if (list3.includes('audio')) return 'audio';
  if (list3.includes('text')) return 'text';
  return list3 || 'node';
}
function normalizeAgentInputRefs(list4 = []) {
  if (!Array.isArray(list4)) return [];
  const map = new Set();
  return list4
    .map((box = {}) => {
      const nodeId = String(box.nodeId || box.id || '').trim();
      if (!nodeId || map.has(nodeId)) return null;
      map.add(nodeId);
      const type = String(box.type || '').trim(),
        count3 = Number(box.width),
        count4 = Number(box.height),
        box2 = {
          nodeId: nodeId,
          id: nodeId,
          type: type,
          kind: String(box.kind || normalizeInputKind(type)).trim(),
          label: truncatePreviewText(box.label || box.name || nodeId, 80),
          source: String(box.source || 'agent-panel').trim(),
        };
      if (Number.isFinite(count3) && count3 > 0) box2.width = Math.round(count3);
      if (Number.isFinite(count4) && count4 > 0) box2.height = Math.round(count4);
      return box2;
    })
    .filter(Boolean)
    .slice(0, AGENT_INPUT_REF_CONTEXT_LIMIT);
}
function updateBudgetMetadata(canvas, maxChars, truncated = false) {
  return (
    (canvas.contextBudget = {
      maxChars: maxChars,
      estimatedChars: 0,
      truncated: truncated === true || canvas.canvas?.modelCatalog?.truncated === true,
      availableModels: Array.isArray(canvas.canvas?.availableModels)
        ? canvas.canvas.availableModels.length
        : 0,
    }),
    (canvas.contextBudget.estimatedChars = estimateJsonChars(canvas)),
    (canvas.contextBudget.estimatedChars = estimateJsonChars(canvas)),
    canvas.contextBudget.estimatedChars
  );
}
function enforceContextBudget(canvas2, data) {
  let updateBudgetMetadata2 = updateBudgetMetadata(canvas2, data),
    options = canvas2.contextBudget.truncated;
  const target = canvas2.canvas || {};
  for (const source of [14, 10, 6, 3, 0]) {
    if (updateBudgetMetadata2 <= data) break;
    if (!Array.isArray(target.availableModels) || target.availableModels.length <= source) continue;
    ((target.availableModels = target.availableModels.slice(0, source)),
      (target.availableWorkflows = summarizeWorkflowsFromModels(target.availableModels)),
      markCanvasCatalogTruncated(target),
      (options = true),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, data, options)));
  }
  for (const next of [10, 5, 0]) {
    if (updateBudgetMetadata2 <= data) break;
    if (!Array.isArray(target.recentCommands) || target.recentCommands.length <= next) continue;
    ((target.recentCommands = target.recentCommands.slice(-next)),
      (options = true),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, data, options)));
  }
  for (const current of [240, 120, 60]) {
    if (updateBudgetMetadata2 <= data) break;
    if (!Array.isArray(target.nodes) || target.nodes.length === 0) continue;
    ((target.nodes = target.nodes.map((args) => ({
      ...args,
      promptPreview: truncatePreviewText(args.promptPreview, current),
      contentPreview: truncatePreviewText(args.contentPreview, current),
    }))),
      (options = true),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, data, options)));
  }
  return (
    updateBudgetMetadata2 > data &&
      Array.isArray(canvas2.commands) &&
      ((canvas2.commands = canvas2.commands.map((id) => ({
        id: id.id,
        riskLevel: id.riskLevel,
      }))),
      (options = true),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, data, options))),
    updateBudgetMetadata(canvas2, data, options),
    canvas2
  );
}
export function buildAgentContext({
  store: store,
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
  const contextBudget = normalizeContextBudget(contextBudgetChars),
    inputRefs2 = normalizeAgentInputRefs(inputRefs),
    commands = typeof commandRegistry?.list === 'function' ? commandRegistry.list() : [],
    recentCommands2 =
      recentCommands !== undefined ? recentCommands : sessionStore?.getRecentCommands?.() || [],
    canvas3 = {
      schemaVersion: 1,
      canvas: buildAgentCanvasSummary({
        store: store,
        recentCommands: recentCommands2,
        userMessage: userMessage,
        intent: intent,
        targetKind: targetKind,
        inputRefs: inputRefs2,
        modelLimit: modelLimit ?? getModelLimitForBudget(contextBudget),
      }),
      commands: commands,
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
  return ((canvas3.canvas.inputRefs = inputRefs2), enforceContextBudget(canvas3, contextBudget));
}
