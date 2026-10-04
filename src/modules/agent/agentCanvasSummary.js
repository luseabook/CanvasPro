import { getExecutionManifest, listModelManifests, resolveModelExecution } from '../../manifests/index.js';
import { buildCanvasSummary } from '../canvasCommands/graphCommands.js';
const DEFAULT_PROMPT_PREVIEW_LIMIT = 0x1f4,
  REFERENCE_PROMPT_PREVIEW_LIMIT = 180,
  DEFAULT_MODEL_LIMIT = 22,
  NO_INTENT_MODEL_LIMIT = 12,
  MODEL_KINDS = new Set(['image', 'video', 'audio', 'text']),
  NODE_TYPE_KIND_HINTS = Object.freeze({
    'ai-image': 'image',
    'source-image': 'image',
    storyboard: 'image',
    'ai-video': 'video',
    'source-video': 'video',
    'media-clip': 'video',
    'ai-audio': 'audio',
    'source-audio': 'audio',
    'ai-text': 'text',
    'source-text': 'text',
    'comment-note': 'text',
    'storyboard-script': 'text',
  }),
  MESSAGE_KIND_PATTERNS = Object.freeze({
    image: Object.freeze([
      /\bimage\b/i,
      /\bpicture\b/i,
      /\bphoto\b/i,
      /\bposter\b/i,
      /\bthumbnail\b/i,
      /\billustration\b/i,
      /[图圖]片/,
      /图像/,
      /照片/,
      /海报/,
      /封面/,
    ]),
    video: Object.freeze([
      /\bvideo\b/i,
      /\bmovie\b/i,
      /\bfilm\b/i,
      /\banimation\b/i,
      /\banimate\b/i,
      /\bclip\b/i,
      /视频/,
      /影片/,
      /动画/,
      /运镜/,
    ]),
    audio: Object.freeze([
      /\baudio\b/i,
      /\bvoice\b/i,
      /\bspeech\b/i,
      /\bsound\b/i,
      /\bmusic\b/i,
      /音频/,
      /声音/,
      /配音/,
      /音乐/,
    ]),
    text: Object.freeze([
      /\btext\b/i,
      /\bcopy\b/i,
      /\bscript\b/i,
      /\bprompt\b/i,
      /\bstoryboard\b/i,
      /文本/,
      /文字/,
      /脚本/,
      /分镜/,
      /提示词/,
    ]),
  }),
  MESSAGE_KIND_PRIORITY = Object.freeze({ video: 4, image: 3, audio: 2, text: 1 });
function truncate(value, item = DEFAULT_PROMPT_PREVIEW_LIMIT) {
  const list = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/data:[^\s"'<>)]{20,}/gi, '[omitted-data-url]')
    .replace(/[A-Za-z0-9+/]{120,}={0,2}/g, '[omitted-base64]')
    .replace(/\s+/g, ' ')
    .trim();
  if (list.length <= item) return list;
  return list.slice(0, Math.max(0, item - 3)) + '...';
}
function normalizeKind(key) {
  const index = String(key || '')
    .trim()
    .toLowerCase();
  return MODEL_KINDS.has(index) ? index : '';
}
function normalizeStringArray(result) {
  if (!Array.isArray(result)) return [];
  const list2 = [],
    map = new Set();
  for (const data of result) {
    const enabled = String(data || '').trim();
    if (!enabled || map.has(enabled)) continue;
    (list2.push(enabled), map.add(enabled));
  }
  return list2;
}
function nodeTypeToInputKind(options = '') {
  return NODE_TYPE_KIND_HINTS[String(options || '').trim()] || '';
}
function getSelectedInputKinds(list3 = []) {
  return new Set(list3.map((item2) => nodeTypeToInputKind(item2?.type)).filter(Boolean));
}
function getManifestUiFieldIds(target) {
  return new Set(
    (Array.isArray(target?.uiSchema?.fields) ? target.uiSchema.fields : [])
      .map((item3) => String(item3?.id || '').trim())
      .filter(Boolean),
  );
}
function getManifestInputSlots(source) {
  return source?.inputSlots && typeof source.inputSlots === 'object' ? source.inputSlots : {};
}
function manifestAllowsInputKind(next, current) {
  const manifestInputSlots = getManifestInputSlots(next),
    list4 = normalizeStringArray(manifestInputSlots.allowedKinds);
  if (list4.includes(current)) return true;
  const count = Number(manifestInputSlots.maxByKind?.[current]);
  if (Number.isFinite(count) && count > 0) return true;
  const list5 = Array.isArray(manifestInputSlots.fixedSlots) ? manifestInputSlots.fixedSlots : [];
  return list5.some((item4) => String(item4?.kind || '') === current);
}
function getRequiredInputKinds(entry) {
  const manifestInputSlots2 = getManifestInputSlots(entry),
    record = new Set();
  for (const [payload, handle] of Object.entries(manifestInputSlots2.minByKind || {})) {
    if (Number(handle) > 0 && payload !== 'text') record.add(payload);
  }
  for (const state of Array.isArray(manifestInputSlots2.fixedSlots) ? manifestInputSlots2.fixedSlots : []) {
    const config = String(state?.kind || '');
    if (config && config !== 'text' && state?.required === true) record.add(config);
  }
  return record;
}
function scoreSelectedInputCompatibility(
  scope,
  {
    selectedInputKinds: selectedInputKinds = new Set(),
    targetKind: targetKind = '',
    userMessage: userMessage = '',
  } = {},
) {
  if (!targetKind || selectedInputKinds.size === 0) return 0;
  let input = 0;
  for (const output of selectedInputKinds) {
    input += manifestAllowsInputKind(scope, output) ? 180 : -120;
  }
  for (const value2 of getRequiredInputKinds(scope)) {
    if (!selectedInputKinds.has(value2)) input -= 0x1a4;
  }
  if (targetKind === 'video' && selectedInputKinds.has('image')) {
    const map2 = getManifestUiFieldIds(scope);
    (map2.has('duration') && /\d+\s*(?:s|sec|second|seconds|秒)/i.test(userMessage) && (input += 35),
      map2.has('aspectRatio') && /(?:16:9|9:16|1:1|aspect|ratio|比例)/i.test(userMessage) && (input += 20));
  }
  return input;
}
function compactObject(
  list6,
  {
    maxKeys: maxKeys = 12,
    maxArrayItems: maxArrayItems = 8,
    maxString: maxString = 160,
    depth: depth = 0,
  } = {},
) {
  if (list6 == null) return list6;
  if (typeof list6 === 'string') return truncate(list6, maxString);
  if (typeof list6 !== 'object') return list6;
  if (depth >= 2) {
    if (Array.isArray(list6)) return '[array:' + list6.length + ']';
    return '[object]';
  }
  if (Array.isArray(list6))
    return list6.slice(0, maxArrayItems).map((item5) =>
      compactObject(item5, {
        maxKeys: maxKeys,
        maxArrayItems: maxArrayItems,
        maxString: maxString,
        depth: depth + 1,
      }),
    );
  const list7 = Object.entries(list6).filter(([, value3]) => value3 !== undefined),
    value4 = {};
  for (const [value5, value6] of list7.slice(0, maxKeys)) {
    value4[value5] = compactObject(value6, {
      maxKeys: maxKeys,
      maxArrayItems: maxArrayItems,
      maxString: maxString,
      depth: depth + 1,
    });
  }
  if (list7.length > maxKeys) value4._truncatedKeys = list7.length - maxKeys;
  return value4;
}
function normalizeViewport(box = {}) {
  return {
    x: Number.isFinite(Number(box.x)) ? Number(box.x) : 0,
    y: Number.isFinite(Number(box.y)) ? Number(box.y) : 0,
    zoom: Number.isFinite(Number(box.zoom)) ? Number(box.zoom) : 1,
  };
}
function summarizeModel(vip, { fieldLimit: fieldLimit = 6, optionLimit: optionLimit = 8 } = {}) {
  const executionManifest = getExecutionManifest(vip?.executionId),
    fieldCount = Array.isArray(vip?.uiSchema?.fields) ? vip.uiSchema.fields : [];
  return {
    modelId: String(vip?.modelId || ''),
    provider: String(vip?.provider || ''),
    kind: String(vip?.kind || ''),
    adapterType: String(vip?.adapterType || executionManifest?.adapterType || ''),
    displayName: String(vip?.displayName || vip?.modelId || ''),
    inputSlots: compactObject(vip?.inputSlots || {}),
    outputType: String(vip?.outputType || ''),
    vip: vip?.vip === true,
    async: vip?.async === true,
    cancellable: vip?.cancellable === true,
    uiSchema: {
      fieldCount: fieldCount.length,
      fields: fieldCount.slice(0, fieldLimit).map((defaultValue) => ({
        id: String(defaultValue?.id || ''),
        type: String(defaultValue?.type || ''),
        label: String(defaultValue?.label || defaultValue?.id || ''),
        defaultValue: defaultValue?.defaultValue,
        displayRole: String(defaultValue?.displayRole || ''),
        options: Array.isArray(defaultValue?.options)
          ? defaultValue.options.slice(0, optionLimit).map((value7) => ({
              value: value7?.value ?? value7,
              label: String(value7?.label || value7?.value || value7 || ''),
            }))
          : undefined,
      })),
    },
  };
}
function summarizeWorkflow(modelId) {
  return {
    modelId: modelId.modelId,
    provider: modelId.provider,
    kind: modelId.kind,
    adapterType: modelId.adapterType,
    displayName: modelId.displayName,
  };
}
function summarizeTaskNode(options2 = {}) {
  const jobStatus = String(
    options2.jobStatus ||
      options2.storyboardScript?.jobStatus ||
      (options2.isGenerating ? 'running' : 'idle'),
  );
  if (jobStatus !== 'running' && jobStatus !== 'pending') return null;
  return {
    nodeId: String(options2.id || ''),
    type: String(options2.type || ''),
    model: String(options2.model || ''),
    provider: String(options2.provider || ''),
    jobStatus: jobStatus,
    taskId: String(options2.taskId || options2.rhTaskId || options2.asyncTaskId || ''),
  };
}
function getSelectedNodes(options3 = {}, value8 = {}) {
  const list8 = Array.isArray(value8.selectedNodeIds)
    ? value8.selectedNodeIds
    : Array.isArray(options3.selectedNodeIds)
      ? options3.selectedNodeIds
      : [];
  return list8.map((item6) => options3.nodes?.[item6]).filter(Boolean);
}
function getSelectedNodeTypes(list9 = []) {
  return normalizeStringArray(list9.map((item7) => item7?.type));
}
function getInputRefSelectedNodes(list10 = [], value9 = {}) {
  if (!Array.isArray(list10)) return [];
  return list10
    .map((box2 = {}) => {
      const id = String(box2.nodeId || box2.id || '').trim();
      if (!id) return null;
      const value10 = value9.nodes?.[id];
      if (value10) return value10;
      const type = String(box2.type || '').trim() || 'source-' + String(box2.kind || 'node');
      return {
        id: id,
        type: type,
        name: String(box2.label || box2.name || id).trim(),
        width: Number(box2.width) || undefined,
        height: Number(box2.height) || undefined,
      };
    })
    .filter(Boolean);
}
function resolveNodeKind(enabled2 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return '';
  return (
    resolveSelectedNodeModelKind(enabled2) || NODE_TYPE_KIND_HINTS[String(enabled2?.type || '').trim()] || ''
  );
}
function isMaterialNodeSummary(options4 = {}) {
  return MODEL_KINDS.has(resolveNodeKind(options4));
}
function summarizeReferenceInputRef(box3 = {}) {
  const nodeId = String(box3.nodeId || box3.id || '').trim();
  if (!nodeId) return null;
  const type2 = String(box3.type || '').trim(),
    kind = normalizeKind(box3.kind) || nodeTypeToInputKind(type2),
    box4 = {
      nodeId: nodeId,
      id: nodeId,
      type: type2,
      kind: kind,
      label: truncate(box3.label || box3.name || nodeId, 80),
      source: String(box3.source || 'agent-panel').trim(),
    },
    count2 = Number(box3.width),
    count3 = Number(box3.height);
  if (Number.isFinite(count2) && count2 > 0) box4.width = Math.round(count2);
  if (Number.isFinite(count3) && count3 > 0) box4.height = Math.round(count3);
  return box4;
}
function summarizeReferenceNode(
  box5 = {},
  { promptPreviewLimit: promptPreviewLimit = REFERENCE_PROMPT_PREVIEW_LIMIT } = {},
) {
  if (!box5 || typeof box5 !== 'object') return null;
  const nodeId2 = String(box5.id || box5.nodeId || '').trim();
  if (!nodeId2) return null;
  const count4 = Number(box5.width),
    count5 = Number(box5.height),
    box6 = {
      nodeId: nodeId2,
      id: nodeId2,
      type: String(box5.type || ''),
      kind: resolveNodeKind(box5),
      name: String(box5.name || ''),
      promptPreview: truncate(box5.promptPreview || box5.prompt || '', promptPreviewLimit),
      contentPreview: truncate(box5.contentPreview || box5.content || '', promptPreviewLimit),
      model: String(box5.model || ''),
      provider: String(box5.provider || ''),
      adapterType: String(box5.adapterType || ''),
      status: String(box5.jobStatus || box5.status || ''),
    };
  if (Number.isFinite(count4) && count4 > 0) box6.width = Math.round(count4);
  if (Number.isFinite(count5) && count5 > 0) box6.height = Math.round(count5);
  return box6;
}
function summarizeRelatedEdge(options5 = {}, map3, map4) {
  const sourceId = String(options5.sourceId || '').trim(),
    targetId = String(options5.targetId || '').trim();
  if (!sourceId && !targetId) return null;
  const value11 = map4.has(sourceId),
    value12 = map4.has(targetId),
    referenceNodeIds = [value11 ? sourceId : '', value12 ? targetId : ''].filter(Boolean),
    direction = value11 && value12 ? 'internal' : value11 ? 'out' : 'in';
  return {
    id: String(options5.id || ''),
    sourceId: sourceId,
    targetId: targetId,
    refSlot: String(options5.refSlot || ''),
    type: String(options5.type || ''),
    direction: direction,
    referenceNodeIds: referenceNodeIds,
    sourceNode: summarizeReferenceNode(map3.get(sourceId) || {}),
    targetNode: summarizeReferenceNode(map3.get(targetId) || {}),
  };
}
function buildReferenceContext({ inputRefs: inputRefs = [], nodes: nodes = [], edges: edges = [] } = {}) {
  const inputRefs2 = Array.isArray(inputRefs)
      ? inputRefs.map(summarizeReferenceInputRef).filter(Boolean)
      : [],
    list11 = normalizeStringArray(inputRefs2.map((item8) => item8.nodeId || item8.id)),
    map5 = new Set(list11),
    map6 = new Map(
      (Array.isArray(nodes) ? nodes : [])
        .map((item9) => [String(item9?.id || item9?.nodeId || '').trim(), item9])
        .filter(([value13]) => Boolean(value13)),
    ),
    referencedNodes = list11
      .map((item10) => map6.get(item10))
      .filter(isMaterialNodeSummary)
      .map((item11) => summarizeReferenceNode(item11))
      .filter(Boolean),
    relatedEdges = (Array.isArray(edges) ? edges : [])
      .filter(
        (item12) => map5.has(String(item12?.sourceId || '')) || map5.has(String(item12?.targetId || '')),
      )
      .map((item13) => summarizeRelatedEdge(item13, map6, map5))
      .filter(Boolean),
    value14 = new Set();
  relatedEdges.forEach((item14) => {
    (map5.has(item14.sourceId) &&
      item14.targetId &&
      !map5.has(item14.targetId) &&
      value14.add(item14.targetId),
      map5.has(item14.targetId) &&
        item14.sourceId &&
        !map5.has(item14.sourceId) &&
        value14.add(item14.sourceId));
  });
  const neighborNodes = Array.from(value14)
    .map((item15) => map6.get(item15))
    .map((item16) => summarizeReferenceNode(item16))
    .filter(Boolean);
  return {
    inputRefs: inputRefs2,
    referencedNodes: referencedNodes,
    relatedEdges: relatedEdges,
    neighborNodes: neighborNodes,
  };
}
function inferKindFromMessage(value15) {
  const enabled3 = String(value15 || '').trim();
  if (!enabled3) return '';
  let value16 = '',
    value17 = 0;
  for (const [value18, value19] of Object.entries(MESSAGE_KIND_PATTERNS)) {
    let count6 = 0;
    for (const value20 of value19) {
      if (value20.test(enabled3)) count6 += 1;
    }
    (count6 > value17 ||
      (count6 === value17 &&
        count6 > 0 &&
        (MESSAGE_KIND_PRIORITY[value18] || 0) > (MESSAGE_KIND_PRIORITY[value16] || 0))) &&
      ((value16 = value18), (value17 = count6));
  }
  return value16;
}
function inferKindFromSelectedNodes(list12 = []) {
  const map7 = new Map();
  for (const value21 of list12) {
    const selectedNodeModelKind = resolveSelectedNodeModelKind(value21),
      enabled4 = selectedNodeModelKind || NODE_TYPE_KIND_HINTS[String(value21?.type || '').trim()] || '';
    if (!enabled4) continue;
    map7.set(enabled4, (map7.get(enabled4) || 0) + 1);
  }
  return Array.from(map7.entries()).sort((item17, value22) => value22[1] - item17[1])[0]?.[0] || '';
}
function resolveSelectedNodeModelKind(providerHint = {}) {
  const enabled5 = String(providerHint.model || '').trim();
  if (!enabled5) return '';
  return normalizeKind(
    resolveModelExecution(enabled5, { providerHint: providerHint.provider })?.modelManifest?.kind,
  );
}
function resolveTargetKind({
  targetKind: targetKind2,
  intent: intent = null,
  userMessage: userMessage = '',
  selectedNodes: selectedNodes = [],
} = {}) {
  return (
    normalizeKind(targetKind2) ||
    normalizeKind(intent?.targetKind) ||
    normalizeKind(intent?.kind) ||
    inferKindFromMessage(userMessage) ||
    inferKindFromSelectedNodes(selectedNodes)
  );
}
function scoreModel(
  value23,
  {
    targetKind: targetKind = '',
    selectedModelIds: selectedModelIds = [],
    selectedProviders: selectedProviders = [],
    selectedInputKinds: selectedInputKinds = new Set(),
    userMessage: userMessage = '',
  } = {},
) {
  let value24 = 0;
  const kind2 = normalizeKind(value23?.kind);
  if (targetKind && kind2 === targetKind) value24 += 0x3e8;
  if (selectedModelIds.includes(value23?.modelId)) value24 += 0x1f4;
  if (selectedProviders.includes(value23?.provider)) value24 += 80;
  if (value23?.adapterType === 'workflow') value24 += 20;
  if (value23?.vip !== true) value24 += 4;
  const value25 =
    Number(value23?.extensions?.imageMenu?.order) ||
    Number(value23?.extensions?.videoMenu?.order) ||
    Number(value23?.extensions?.audioMenu?.order) ||
    Number(value23?.extensions?.textMenu?.order) ||
    0;
  ((value24 += Math.max(0, 100 - value25) / 100),
    (value24 += scoreSelectedInputCompatibility(value23, {
      selectedInputKinds: selectedInputKinds,
      targetKind: targetKind,
      userMessage: userMessage,
    })));
  const list13 = [value23?.modelId, value23?.provider, value23?.displayName, value23?.description]
    .join(' ')
    .toLowerCase();
  for (const list14 of String(userMessage || '')
    .toLowerCase()
    .split(/\s+/)) {
    if (list14.length >= 3 && list13.includes(list14)) value24 += 10;
  }
  return value24;
}
function filterModelManifests({
  targetKind: targetKind = '',
  selectedNodes: selectedNodes = [],
  userMessage: userMessage = '',
  modelLimit: modelLimit = undefined,
} = {}) {
  const totalAvailable = listModelManifests(),
    selectedModelIds2 = normalizeStringArray(selectedNodes.map((item18) => item18?.model)),
    selectedProviders2 = normalizeStringArray(selectedNodes.map((item19) => item19?.provider)),
    selectedInputKinds2 = getSelectedInputKinds(selectedNodes),
    enabled6 = Boolean(targetKind),
    value26 = Number(modelLimit),
    value27 = enabled6 ? DEFAULT_MODEL_LIMIT : NO_INTENT_MODEL_LIMIT,
    value28 = Math.max(0, Math.trunc(Number.isFinite(value26) ? value26 : value27)),
    totalMatched = totalAvailable
      .filter((enabled7) => {
        if (!enabled7?.modelId) return false;
        if (selectedModelIds2.includes(enabled7.modelId)) return true;
        return !enabled6 || normalizeKind(enabled7.kind) === targetKind;
      })
      .map((manifest) => ({
        manifest: manifest,
        score: scoreModel(manifest, {
          targetKind: targetKind,
          selectedModelIds: selectedModelIds2,
          selectedProviders: selectedProviders2,
          selectedInputKinds: selectedInputKinds2,
          userMessage: userMessage,
        }),
      }))
      .sort((item20, value29) => {
        if (value29.score !== item20.score) return value29.score - item20.score;
        return String(item20.manifest.modelId).localeCompare(String(value29.manifest.modelId));
      }),
    manifests = totalMatched.slice(0, value28).map((item21) => item21.manifest);
  return {
    manifests: manifests,
    totalAvailable: totalAvailable.length,
    totalMatched: totalMatched.length,
    truncated: totalMatched.length > manifests.length,
    targetKind: targetKind,
    selectedModelIds: selectedModelIds2,
    selectedInputKinds: Array.from(selectedInputKinds2),
  };
}
export function buildAgentCanvasSummary({
  store: store,
  recentCommands: recentCommands = [],
  includeCommands: includeCommands = true,
  userMessage: userMessage = '',
  intent: intent = null,
  targetKind: targetKind = '',
  inputRefs: inputRefs = [],
  modelLimit: modelLimit = undefined,
  promptPreviewLimit: promptPreviewLimit = DEFAULT_PROMPT_PREVIEW_LIMIT,
} = {}) {
  const value30 = store?.getStateRaw?.() || store?.getState?.() || {},
    selectedNodeIds = buildCanvasSummary({ store: store }),
    nodes2 = (selectedNodeIds.nodes || []).map((args) => ({
      ...args,
      promptPreview: truncate(args.promptPreview, promptPreviewLimit),
      contentPreview: truncate(args.contentPreview, promptPreviewLimit),
    })),
    list15 = getSelectedNodes(value30, selectedNodeIds),
    map8 = new Set(list15.map((item22) => String(item22?.id || '')).filter(Boolean)),
    args2 = getInputRefSelectedNodes(inputRefs, value30).filter(
      (item23) => !map8.has(String(item23.id || '')),
    ),
    selectedNodes2 = [...list15, ...args2],
    targetKind3 = resolveTargetKind({
      targetKind: targetKind,
      intent: intent,
      userMessage: userMessage,
      selectedNodes: selectedNodes2,
    }),
    targetKind4 = filterModelManifests({
      targetKind: targetKind3,
      selectedNodes: selectedNodes2,
      userMessage: userMessage,
      modelLimit: modelLimit,
    }),
    availableModels = targetKind4.manifests.map((item24) => summarizeModel(item24)),
    availableWorkflows = availableModels
      .filter((item25) => item25.adapterType === 'workflow')
      .map(summarizeWorkflow),
    list16 = Array.isArray(recentCommands) ? recentCommands : [],
    map9 = new Set((selectedNodeIds.selectedNodeIds || []).map((item26) => String(item26 || ''))),
    selectedNodes3 = nodes2
      .filter((item27) => map9.has(String(item27?.id || '')))
      .map((id2) => ({
        id: id2.id,
        type: id2.type,
        name: id2.name,
        promptPreview: id2.promptPreview,
        contentPreview: id2.contentPreview,
        model: id2.model,
        provider: id2.provider,
        adapterType: id2.adapterType,
        x: id2.x,
        y: id2.y,
        width: id2.width,
        height: id2.height,
        jobStatus: id2.jobStatus,
      })),
    edges2 = selectedNodeIds.edges || [],
    referenceContext = buildReferenceContext({ inputRefs: inputRefs, nodes: nodes2, edges: edges2 });
  return {
    selectedNodeIds: selectedNodeIds.selectedNodeIds || [],
    selectedNodes: selectedNodes3,
    nodes: nodes2,
    edges: edges2,
    referenceContext: referenceContext,
    viewport: normalizeViewport(selectedNodeIds.viewport),
    availableModels: availableModels,
    availableWorkflows: availableWorkflows,
    modelCatalog: {
      targetKind: targetKind4.targetKind,
      selectedNodeTypes: getSelectedNodeTypes(selectedNodes2),
      selectedInputKinds: targetKind4.selectedInputKinds,
      selectedNodeModels: targetKind4.selectedModelIds,
      selectedModelIds: targetKind4.selectedModelIds,
      totalAvailable: targetKind4.totalAvailable,
      totalMatched: targetKind4.totalMatched,
      includedModels: availableModels.length,
      truncated: targetKind4.truncated,
    },
    runningTasks: Object.values(value30.nodes || {})
      .map(summarizeTaskNode)
      .filter(Boolean),
    recentCommands: includeCommands ? list16.slice(-20) : [],
  };
}
export const agentCanvasSummaryInternals = Object.freeze({
  inferKindFromMessage: inferKindFromMessage,
  resolveTargetKind: resolveTargetKind,
  filterModelManifests: filterModelManifests,
  buildReferenceContext: buildReferenceContext,
});
