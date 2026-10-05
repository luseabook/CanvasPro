import { canvasCommandRegistry } from '../canvasCommands/index.js';
import { buildAgentCanvasSummary } from './agentCanvasSummary.js';
import { buildAgentReferenceContext } from './agentReferenceContext.js';
import { routeAgentCapabilities } from './agentCapabilityRouter.js';
import { defaultAgentSkillRegistry, listAgentSkillCatalog, selectAgentSkills } from './agentSkillCatalog.js';
export const DEFAULT_AGENT_CONTEXT_BUDGET_CHARS = 36000;
export const MAX_EMPTY_CANVAS_CONTEXT_CHARS = 40000;
const AGENT_INPUT_REF_CONTEXT_LIMIT = 12,
  AGENT_SELECTED_NODE_DETAIL_LIMIT = 12;
function estimateJsonChars(value) {
  try {
    return JSON['stringify'](value)['length'];
  } catch {
    return 0;
  }
}
function normalizeContextBudget(item) {
  const count = Number(item);
  if (!Number['isFinite'](count) || count <= 0) return DEFAULT_AGENT_CONTEXT_BUDGET_CHARS;
  return Math['trunc'](count);
}
function getModelLimitForBudget(count2) {
  if (count2 <= 25000) return 6;
  if (count2 <= 32000) return 8;
  return 10;
}
function summarizeWorkflowsFromModels(list = []) {
  return list['filter']((key) => key?.['adapterType'] === 'workflow')['map'](
    (modelId) => ({
      modelId: modelId['modelId'],
      provider: modelId['provider'],
      kind: modelId['kind'],
      adapterType: modelId['adapterType'],
      executionId: modelId['executionId'],
      displayName: modelId['displayName'],
    }),
  );
}
function markCanvasCatalogTruncated(enabled = {}) {
  if (!enabled['modelCatalog']) enabled['modelCatalog'] = {};
  ((enabled['modelCatalog']['truncated'] = !![]),
    (enabled['modelCatalog']['includedModels'] = Array['isArray'](enabled['availableModels'])
      ? enabled['availableModels']['length']
      : 0));
}
function truncatePreviewText(index, result) {
  const list2 = String(index || '');
  if (list2['length'] <= result) return list2;
  return list2['slice'](0, Math['max'](0, result - 3)) + '...';
}
function normalizeInputKind(data = '') {
  const list3 = String(data || '')['trim']();
  if (list3['includes']('image')) return 'image';
  if (list3['includes']('video')) return 'video';
  if (list3['includes']('audio')) return 'audio';
  if (list3['includes']('text')) return 'text';
  return list3 || 'node';
}
function normalizeAgentInputRefs(list4 = []) {
  if (!Array['isArray'](list4)) return [];
  const map = new Set();
  return list4['map']((box = {}) => {
    const nodeId = String(box['nodeId'] || box['id'] || '')['trim']();
    if (!nodeId || map['has'](nodeId)) return null;
    map['add'](nodeId);
    const type = String(box['type'] || '')['trim'](),
      count3 = Number(box['width']),
      count4 = Number(box['height']),
      box2 = {
        nodeId: nodeId,
        id: nodeId,
        type: type,
        kind: String(box['kind'] || normalizeInputKind(type))['trim'](),
        label: truncatePreviewText(box['label'] || box['name'] || nodeId, 80),
        source: String(box['source'] || 'agent-panel')['trim'](),
      };
    if (Number['isFinite'](count3) && count3 > 0) box2['width'] = Math['round'](count3);
    if (Number['isFinite'](count4) && count4 > 0) box2['height'] = Math['round'](count4);
    return box2;
  })
    ['filter'](Boolean)
    ['slice'](0, AGENT_INPUT_REF_CONTEXT_LIMIT);
}
function updateBudgetMetadata(canvas, maxChars, truncated = ![]) {
  const commandSchemasRetained = Array['isArray'](canvas['commands'])
    ? canvas['commands']['every'](
        (options) =>
          options?.['argsSchema'] &&
          typeof options['argsSchema'] === 'object' &&
          options['argsSchema']['properties'] &&
          typeof options['argsSchema']['properties'] === 'object',
      )
    : !![];
  canvas['contextBudget'] = {
    maxChars: maxChars,
    estimatedChars: 0,
    truncated: truncated === !![] || canvas['canvas']?.['modelCatalog']?.['truncated'] === !![],
    availableModels: Array['isArray'](canvas['canvas']?.['availableModels'])
      ? canvas['canvas']['availableModels']['length']
      : 0,
    commandSchemasRetained: commandSchemasRetained,
    schemaIntegrity: commandSchemasRetained,
    budgetExceeded: ![],
  };
  for (let count5 = 0; count5 < 3; count5 += 1) {
    canvas['contextBudget']['estimatedChars'] = estimateJsonChars(canvas);
  }
  return (
    (canvas['contextBudget']['budgetExceeded'] = canvas['contextBudget']['estimatedChars'] > maxChars),
    (canvas['contextBudget']['estimatedChars'] = estimateJsonChars(canvas)),
    canvas['contextBudget']['estimatedChars']
  );
}
function compactCommandDescription(id = {}) {
  return {
    id: id['id'],
    riskLevel: id['riskLevel'],
    argsSchema: id['argsSchema'],
    capabilitySchema: id['capabilitySchema'],
    returnSchema: id['returnSchema'],
    returnAliasFields: id['returnAliasFields'],
  };
}
function compactSelectedSkill(args = {}, target = 4000, source = 4000) {
  const instructions = truncatePreviewText(args['instructions'], target);
  return {
    ...args,
    instructions: instructions,
    resourceNames: Array['isArray'](args['resourceNames'])
      ? args['resourceNames']['slice'](0, 12)
      : [],
    resources: (Array['isArray'](args['resources']) ? args['resources'] : [])
      ['slice'](0, 8)
      ['map']((error = {}) => ({
        name: truncatePreviewText(error['name'], 160),
        content: truncatePreviewText(error['content'], source),
      })),
  };
}
function getPinnedCanvasNodeIds(options2 = {}) {
  const next = new Set(),
    handler = (current) => {
      const entry = String(current || '')['trim']();
      if (entry) next['add'](entry);
    };
  return (
    (options2['selectedNodes'] || [])
      ['slice'](0, AGENT_SELECTED_NODE_DETAIL_LIMIT)
      ['forEach']((record) => handler(record?.['id'] || record?.['nodeId'])),
    (options2['inputRefs'] || [])['forEach']((payload) =>
      handler(payload?.['nodeId'] || payload?.['id']),
    ),
    (options2['referenceContext']?.['referencedNodes'] || [])['forEach']((handle) =>
      handler(handle?.['nodeId'] || handle?.['id']),
    ),
    (options2['referenceContext']?.['neighborNodes'] || [])['forEach']((state) =>
      handler(state?.['nodeId'] || state?.['id']),
    ),
    (options2['referenceContext']?.['relatedEdges'] || [])['forEach']((config) => {
      (handler(config?.['sourceId']), handler(config?.['targetId']));
    }),
    (options2['runningTasks'] || [])['forEach']((scope) => handler(scope?.['nodeId'])),
    (options2['agentReferences']?.['recentCreatedNodeIds'] || [])['forEach'](handler),
    next
  );
}
function pruneCanvasGraph(state2 = {}, input = 30) {
  const list5 = Array['isArray'](state2['nodes']) ? state2['nodes'] : [],
    list6 = Array['isArray'](state2['edges']) ? state2['edges'] : [],
    totalSelected = Array['isArray'](state2['selectedNodes']) ? state2['selectedNodes'] : [],
    includedSelectedNodeDetails = totalSelected['slice'](0, AGENT_SELECTED_NODE_DETAIL_LIMIT),
    map2 = getPinnedCanvasNodeIds(state2),
    pinnedNodes = list5['filter']((output) => map2['has'](String(output?.['id'] || ''))),
    list7 = list5['filter']((value2) => !map2['has'](String(value2?.['id'] || ''))),
    value3 = Math['max'](input, pinnedNodes['length']),
    includedNodes = [...pinnedNodes, ...list7['slice'](0, Math['max'](0, value3 - pinnedNodes['length']))],
    map3 = new Set(includedNodes['map']((value4) => String(value4?.['id'] || ''))['filter'](Boolean)),
    list8 = list6['filter'](
      (value5) =>
        map3['has'](String(value5?.['sourceId'] || '')) &&
        map3['has'](String(value5?.['targetId'] || '')),
    ),
    value6 = Math['max'](24, value3 * 3),
    includedEdges = list8['slice'](0, value6),
    totalNodes = Number(state2['graphCatalog']?.['totalNodes'] ?? list5['length']),
    totalEdges = Number(state2['graphCatalog']?.['totalEdges'] ?? list6['length']),
    enabled2 =
      includedNodes['length'] < list5['length'] ||
      includedEdges['length'] < list6['length'] ||
      includedSelectedNodeDetails['length'] < totalSelected['length'];
  if (!enabled2) return ![];
  return (
    (state2['nodes'] = includedNodes),
    (state2['edges'] = includedEdges),
    (state2['selectedNodes'] = includedSelectedNodeDetails),
    includedSelectedNodeDetails['length'] < totalSelected['length'] &&
      (state2['selectionCatalog'] = {
        totalSelected: totalSelected['length'],
        includedSelectedNodeDetails: includedSelectedNodeDetails['length'],
        selectedNodeIdsRetained: Array['isArray'](state2['selectedNodeIds'])
          ? state2['selectedNodeIds']['length']
          : 0,
        truncated: !![],
      }),
    (state2['graphCatalog'] = {
      totalNodes: totalNodes,
      totalEdges: totalEdges,
      includedNodes: includedNodes['length'],
      includedEdges: includedEdges['length'],
      pinnedNodes: pinnedNodes['length'],
      truncated: !![],
    }),
    !![]
  );
}
function enforceContextBudget(canvas2, value7) {
  let updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7),
    value8 = canvas2['contextBudget']['truncated'];
  const state3 = canvas2['canvas'] || {};
  for (const value9 of [60, 30, 12]) {
    if (updateBudgetMetadata2 <= value7) break;
    if (!pruneCanvasGraph(state3, value9)) continue;
    ((value8 = !![]), (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  }
  for (const value10 of [14, 10, 6]) {
    if (updateBudgetMetadata2 <= value7) break;
    if (
      !Array['isArray'](state3['availableModels']) ||
      state3['availableModels']['length'] <= value10
    )
      continue;
    ((state3['availableModels'] = state3['availableModels']['slice'](0, value10)),
      (state3['availableWorkflows'] = summarizeWorkflowsFromModels(state3['availableModels'])),
      markCanvasCatalogTruncated(state3),
      (value8 = !![]),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  }
  for (const value11 of [10, 5, 0]) {
    if (updateBudgetMetadata2 <= value7) break;
    if (!Array['isArray'](state3['recentCommands']) || state3['recentCommands']['length'] <= value11)
      continue;
    ((state3['recentCommands'] = state3['recentCommands']['slice'](-value11)),
      (value8 = !![]),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  }
  for (const value12 of [240, 120, 60]) {
    if (updateBudgetMetadata2 <= value7) break;
    if (!Array['isArray'](state3['nodes']) || state3['nodes']['length'] === 0) continue;
    ((state3['nodes'] = state3['nodes']['map']((args2) => ({
      ...args2,
      promptPreview: truncatePreviewText(args2['promptPreview'], value12),
      contentPreview: truncatePreviewText(args2['contentPreview'], value12),
    }))),
      (value8 = !![]),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  }
  for (const [value13, value14] of [
    [6000, 6000],
    [3000, 3000],
    [1200, 1200],
  ]) {
    if (updateBudgetMetadata2 <= value7) break;
    if (!Array['isArray'](canvas2['skills']) || canvas2['skills']['length'] === 0) continue;
    ((canvas2['skills'] = canvas2['skills']['map']((value15) =>
      compactSelectedSkill(value15, value13, value14),
    )),
      (value8 = !![]),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  }
  updateBudgetMetadata2 > value7 &&
    Array['isArray'](canvas2['commands']) &&
    ((canvas2['commands'] = canvas2['commands']['map'](compactCommandDescription)),
    (value8 = !![]),
    (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  for (const value16 of [3, 1, 0]) {
    if (updateBudgetMetadata2 <= value7) break;
    if (
      !Array['isArray'](state3['availableModels']) ||
      state3['availableModels']['length'] <= value16
    )
      continue;
    ((state3['availableModels'] = state3['availableModels']['slice'](0, value16)),
      (state3['availableWorkflows'] = summarizeWorkflowsFromModels(state3['availableModels'])),
      markCanvasCatalogTruncated(state3),
      (value8 = !![]),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8)));
  }
  return (
    updateBudgetMetadata2 > value7 &&
      Array['isArray'](canvas2['skillCatalog']?.['available']) &&
      ((canvas2['skillCatalog']['available'] = canvas2['skillCatalog']['available']['map'](
        (id2) => ({ id: id2['id'], title: id2['title'], category: id2['category'] }),
      )),
      (value8 = !![]),
      (updateBudgetMetadata2 = updateBudgetMetadata(canvas2, value7, value8))),
    updateBudgetMetadata(canvas2, value7, value8),
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
  disclosedCommandIds: disclosedCommandIds = [],
  disclosedModelIds: disclosedModelIds = [],
  selectedSkillIds: selectedSkillIds = [],
  skillRegistry: skillRegistry = defaultAgentSkillRegistry,
} = {}) {
  const contextBudget = normalizeContextBudget(contextBudgetChars),
    inputRefs2 = normalizeAgentInputRefs(inputRefs),
    commands = typeof commandRegistry?.['list'] === 'function' ? commandRegistry['list']() : [],
    recentCommands2 = recentCommands !== undefined ? recentCommands : sessionStore?.['getRecentCommands']?.() || [],
    canvas3 = buildAgentCanvasSummary({
      store: store,
      recentCommands: recentCommands2,
      userMessage: userMessage,
      intent: intent,
      targetKind: targetKind,
      inputRefs: inputRefs2,
      modelLimit: modelLimit ?? getModelLimitForBudget(contextBudget),
      disclosedModelIds: disclosedModelIds,
    });
  canvas3['agentReferences'] = buildAgentReferenceContext({
    canvas: canvas3,
    operationLedger: sessionStore?.['getOperationLedger']?.() || [],
  });
  const list9 = selectAgentSkills({
      userMessage: userMessage,
      targetKind: canvas3['modelCatalog']?.['targetKind'],
      selectedInputKinds: canvas3['modelCatalog']?.['selectedInputKinds'],
      selectedSkillIds: selectedSkillIds,
      registry: skillRegistry,
    }),
    map4 = new Set(
      commands['map']((value17) => String(value17?.['id'] || '')['trim']())['filter'](Boolean),
    ),
    skills = list9['filter']((value18) =>
      value18['commands']['every']((value19) => map4['has'](value19)),
    ),
    commands2 = routeAgentCapabilities({
      commands: commands,
      skills: skills,
      userMessage: userMessage,
      intent: intent,
      targetKind: canvas3['modelCatalog']?.['targetKind'],
      requiredCommandIds: disclosedCommandIds,
    }),
    enabled3 =
      commands2['catalog']['selectedNamespaces']['includes']('generation') ||
      (Boolean(canvas3['modelCatalog']?.['targetKind']) &&
        commands2['commands']['some']((value20) =>
          ['node.setModel', 'node.changeModel', 'node.setParams', 'generation.run']['includes'](
            value20['id'],
          ),
        ));
  !enabled3 &&
    ((canvas3['availableModels'] = []),
    (canvas3['availableWorkflows'] = []),
    canvas3['modelCatalog'] &&
      ((canvas3['modelCatalog']['includedModels'] = 0),
      (canvas3['modelCatalog']['truncated'] = canvas3['modelCatalog']['totalMatched'] > 0)));
  const deferredSkillIds = listAgentSkillCatalog({ registry: skillRegistry }),
    value21 = skillRegistry?.['getState']?.() || {},
    includedSkillIds = skills['map']((value22) => value22['id']),
    map5 = new Set(includedSkillIds),
    canvas4 = {
      schemaVersion: 1,
      canvas: canvas3,
      commands: commands2['commands'],
      skills: skills,
      capabilityRouting: commands2['catalog'],
      skillCatalog: {
        mode: 'progressive',
        includedSkillIds: includedSkillIds,
        deferredSkillIds: deferredSkillIds['map']((value23) => value23['id'])['filter'](
          (value24) => !map5['has'](value24),
        ),
        available: deferredSkillIds,
        totalAvailable: deferredSkillIds['length'],
        installedCount: Number(value21['installedCount'] || 0),
        diagnosticCount: Array['isArray'](value21['diagnostics'])
          ? value21['diagnostics']['length']
          : 0,
      },
      policies: {
        actionPlanOnly: !![],
        skillsProduceActionPlansOnly: !![],
        progressiveCapabilityDisclosure: !![],
        commandSchemasProtected: !![],
        noDomAccess: !![],
        noArbitraryStoreWrites: !![],
        noDirectNetwork: !![],
        noElectronAccess: !![],
        batchConfirmThreshold: 5,
      },
    };
  return ((canvas4['canvas']['inputRefs'] = inputRefs2), enforceContextBudget(canvas4, contextBudget));
}
