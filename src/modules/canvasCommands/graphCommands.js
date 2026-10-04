import { generateId } from '../../core/math.js';
import { listModelManifests, resolveModelExecution } from '../../manifests/index.js';
import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import { createCanvasCommandError } from './commandRegistry.js';
const SUPPORTED_CREATE_TYPES = new Set([
    'ai-text',
    'ai-image',
    'ai-video',
    'ai-audio',
    'source-text',
    'comment-note',
    'storyboard-script',
  ]),
  PROMPT_NODE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard-script']),
  CREATE_TYPE_MODEL_KINDS = Object.freeze({
    'ai-text': 'text',
    'ai-image': 'image',
    'ai-video': 'video',
    'ai-audio': 'audio',
    'storyboard-script': 'text',
  }),
  DEFAULT_NODE_SIZES = Object.freeze({
    'ai-text': Object.freeze({ width: 0x180, height: 0x120 }),
    'ai-image': Object.freeze({ width: 0x120, height: 0x120 }),
    'ai-video': Object.freeze({ width: 0x120, height: 0x120 }),
    'ai-audio': Object.freeze({ width: 0x140, height: 240 }),
    'source-text': Object.freeze({ width: 0x140, height: 180 }),
    'comment-note': Object.freeze({ width: 0x104, height: 120 }),
    'storyboard-script': Object.freeze({ width: 0x2d0, height: 0x1a4 }),
  }),
  MEDIA_PREVIEW_KEYS = new Set([
    'base64',
    'dataUrl',
    'imageBase64',
    'videoBase64',
    'audioBase64',
    'thumbnailBase64',
    'blob',
    'file',
    'frames',
    'images',
    'videos',
    'audios',
  ]);
function getState(value) {
  return value.store?.getStateRaw?.() || value.store?.getState?.() || {};
}
function getStore(item) {
  return item.graphStore || item.store;
}
function clonePlain(key) {
  if (typeof structuredClone === 'function') return structuredClone(key);
  return JSON.parse(JSON.stringify(key));
}
function normalizeNodeType(index) {
  return String(index || '').trim();
}
function toFinitePositiveNumber(result, data) {
  const count = Number(result);
  return Number.isFinite(count) && count > 0 ? count : data;
}
function toFiniteNumber(options, target = 0) {
  const source = Number(options);
  return Number.isFinite(source) ? source : target;
}
function getNode(next, current) {
  const entry = String(current || '').trim();
  return entry ? getState(next).nodes?.[entry] || null : null;
}
function getNodes(record) {
  return getState(record).nodes || {};
}
function getEdges(payload) {
  return getState(payload).edges || {};
}
function getInitialText(response = {}) {
  if (Object.prototype.hasOwnProperty.call(response, 'prompt')) return response.prompt;
  if (Object.prototype.hasOwnProperty.call(response, 'text')) return response.text;
  if (Object.prototype.hasOwnProperty.call(response, 'content')) return response.content;
  return undefined;
}
function truncateText(handle, state = 0x1f4) {
  const list = String(handle || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (list.length <= state) return list;
  return list.slice(0, Math.max(0, state - 3)) + '...';
}
function omitLargeMedia(list2, count2 = 0) {
  if (list2 == null) return list2;
  if (typeof list2 !== 'object') return list2;
  if (count2 > 2) return '[omitted]';
  if (Array.isArray(list2)) return '[array:' + list2.length + ']';
  const config = {};
  for (const [scope, list3] of Object.entries(list2)) {
    if (MEDIA_PREVIEW_KEYS.has(scope)) config[scope] = '[omitted]';
    else {
      if (typeof list3 === 'string' && list3.length > 0x1f4) config[scope] = list3.slice(0, 120) + '...';
      else
        list3 && typeof list3 === 'object'
          ? (config[scope] = omitLargeMedia(list3, count2 + 1))
          : (config[scope] = list3);
    }
  }
  return config;
}
function normalizeNodeIds(
  options2 = {},
  input = {},
  { min: min = 1, allowSelection: allowSelection = true } = {},
) {
  const nodes = getNodes(input),
    state2 = getState(input),
    output =
      Array.isArray(options2.ids) && options2.ids.length > 0
        ? options2.ids
        : options2.nodeId
          ? [options2.nodeId]
          : allowSelection
            ? state2.selectedNodeIds || []
            : [],
    list4 = [],
    map = new Set();
  for (const value2 of output) {
    const nodeId = String(value2 || '').trim();
    if (!nodeId || map.has(nodeId)) continue;
    if (!nodes[nodeId])
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + nodeId, {
        nodeId: nodeId,
      });
    (list4.push(nodeId), map.add(nodeId));
  }
  if (list4.length < min)
    throw createCanvasCommandError(
      'INSUFFICIENT_NODES',
      'At least ' + min + ' canvas node id(s) are required.',
    );
  return list4;
}
function normalizeEdgeId(value3) {
  return String(value3 || '').trim();
}
function normalizeEdgeArgs(event = {}) {
  return {
    edgeId: normalizeEdgeId(event.edgeId || event.id),
    sourceId: String(event.sourceId || event.source || '').trim(),
    targetId: String(event.targetId || event.target || '').trim(),
    refSlot: String(event.refSlot || event.slot || '').trim(),
  };
}
function findEdgesByEndpoints(value4, { sourceId: sourceId, targetId: targetId, refSlot: refSlot = '' }) {
  return Object.values(getEdges(value4)).filter((enabled) => {
    if (!enabled) return false;
    if (sourceId && enabled.sourceId !== sourceId) return false;
    if (targetId && enabled.targetId !== targetId) return false;
    if (refSlot && String(enabled.refSlot || '') !== refSlot) return false;
    return true;
  });
}
function hasExplicitCreatePosition(box = {}) {
  return Number['isFinite'](Number(box['x'])) && Number['isFinite'](Number(box['y']));
}
function resolveCreateSize(value5, box2 = {}, value6 = {}) {
  const box3 = DEFAULT_NODE_SIZES[value5] || { width: 0x12c, height: 0x12c };
  let value7 = null;
  if (PROMPT_NODE_TYPES.has(value5) && typeof value6.getAIGenerationDefaultSizeByType === 'function')
    value7 = value6.getAIGenerationDefaultSizeByType(value5);
  else typeof value6.getNodeDefaultSize === 'function' && (value7 = value6.getNodeDefaultSize(value5));
  const box4 = value7 && typeof value7 === 'object' ? value7 : box3;
  return {
    width: toFinitePositiveNumber(box2.width, toFinitePositiveNumber(box4.width, box3.width)),
    height: toFinitePositiveNumber(box2.height, toFinitePositiveNumber(box4.height, box3.height)),
  };
}
function applyInitialNodeText(args, value8, store) {
  const initialText = getInitialText(value8);
  if (initialText === undefined || initialText === null) return args;
  const enabled2 = String(args?.id || '').trim(),
    value9 = String(args?.type || '').trim();
  if (!enabled2) return args;
  let args2 = null;
  if (PROMPT_NODE_TYPES.has(value9)) args2 = { prompt: sanitizePromptHtmlForCommit(String(initialText)) };
  else
    (value9 === 'source-text' || value9 === 'comment-note') &&
      (args2 = { content: String(initialText || '') });
  if (!args2) return args;
  return (
    getStore(store)?.updateNodeData?.(enabled2, args2),
    store.commit?.(),
    getNode(store, enabled2) || { ...args, ...args2 }
  );
}
function isImageNodeType(value10 = '') {
  const value11 = String(value10 || '');
  return value11 === 'ai-image' || value11 === 'source-image';
}
function hasSelectedImageInput(options3 = {}) {
  const state3 = getState(options3),
    list5 = Array.isArray(state3.selectedNodeIds) ? state3.selectedNodeIds : [];
  return list5.some((item2) => isImageNodeType(state3.nodes?.[item2]?.type));
}
function manifestAllowsImageInput(options4 = {}) {
  const value12 = options4?.inputSlots && typeof options4.inputSlots === 'object' ? options4.inputSlots : {},
    list6 = Array.isArray(value12.allowedKinds) ? value12.allowedKinds : [];
  if (list6.includes('image')) return true;
  const count3 = Number(value12.maxByKind?.image);
  return Number.isFinite(count3) && count3 > 0;
}
function manifestAllowsTextInput(options5 = {}) {
  const value13 = options5?.inputSlots && typeof options5.inputSlots === 'object' ? options5.inputSlots : {},
    list7 = Array.isArray(value13.allowedKinds) ? value13.allowedKinds : [];
  return list7.length === 0 || list7.includes('text');
}
function manifestRequiresMissingMedia(options6 = {}, { hasImageInput: hasImageInput = false } = {}) {
  const value14 = options6?.inputSlots && typeof options6.inputSlots === 'object' ? options6.inputSlots : {},
    value15 = value14.minByKind || {};
  if (!hasImageInput && Number(value15.image) > 0) return true;
  if (Number(value15.video) > 0) return true;
  if (Number(value15.audio) > 0) return true;
  const list8 = Array.isArray(value14.fixedSlots) ? value14.fixedSlots : [];
  return list8.some((item3) => {
    if (item3?.required !== true) return false;
    const value16 = String(item3?.kind || '');
    if (value16 === 'image') return !hasImageInput;
    return value16 === 'video' || value16 === 'audio';
  });
}
function getManifestFieldIds(options7 = {}) {
  return new Set(
    (Array.isArray(options7?.uiSchema?.fields) ? options7.uiSchema.fields : [])
      .map((item4) => String(item4?.id || '').trim())
      .filter(Boolean),
  );
}
function findAutoCreateModel(options8 = {}, value17 = '', value18 = {}) {
  if (value17 !== 'ai-video') return null;
  const hasImageInput2 = hasSelectedImageInput(value18),
    value19 =
      options8.params && typeof options8.params === 'object' && !Array.isArray(options8.params)
        ? Object.keys(options8.params)
        : [],
    listModelManifests2 = listModelManifests()
      .filter(
        (item5) =>
          item5?.kind === 'video' &&
          item5?.modelId &&
          (hasImageInput2 ? manifestAllowsImageInput(item5) : manifestAllowsTextInput(item5)) &&
          !manifestRequiresMissingMedia(item5, { hasImageInput: hasImageInput2 }),
      )
      .map((manifest) => {
        const map2 = getManifestFieldIds(manifest);
        let score = manifest.vip === true ? 0 : 10;
        if (!hasImageInput2 && !manifestAllowsImageInput(manifest)) score += 8;
        for (const value20 of value19) {
          if (map2.has(value20)) score += 20;
        }
        if (map2.has('duration')) score += 8;
        if (map2.has('aspectRatio')) score += 4;
        const value21 = Number(manifest.extensions?.videoMenu?.order) || 0;
        return ((score += Math.max(0, 100 - value21) / 100), { manifest: manifest, score: score });
      })
      .sort((item6, value22) => {
        if (value22.score !== item6.score) return value22.score - item6.score;
        return String(item6.manifest.modelId).localeCompare(String(value22.manifest.modelId));
      });
  return listModelManifests2[0]?.manifest || null;
}
function isAutoModelPlaceholder(value23 = '') {
  const enabled3 = String(value23 || '')
    .trim()
    .toLowerCase();
  return !enabled3 || enabled3 === 'auto' || enabled3 === 'default' || enabled3 === 'unknown';
}
function validateCreateModelArgs(options9 = {}, value24 = '', value25 = {}) {
  const value26 = String(options9.model || options9.modelId || '').trim();
  if (isAutoModelPlaceholder(value26)) {
    const model = findAutoCreateModel(options9, value24, value25);
    return model ? { args: { model: model.modelId, provider: model.provider || '' } } : { args: {} };
  }
  const providerHint = String(options9.provider || '').trim(),
    modelExecution = resolveModelExecution(value26, { providerHint: providerHint }),
    model2 = modelExecution?.modelManifest;
  if (!model2)
    return {
      ok: false,
      errorCode: 'MODEL_MANIFEST_NOT_FOUND',
      message: 'Model manifest not found: ' + value26,
    };
  const value27 = CREATE_TYPE_MODEL_KINDS[value24] || '';
  if (value27 && String(model2.kind || '') !== value27)
    return {
      ok: false,
      errorCode: 'MODEL_KIND_MISMATCH',
      message: 'Model ' + value26 + ' is ' + (model2.kind || '(unknown)') + ', not ' + value27 + '.',
    };
  return { args: { model: model2.modelId || value26, provider: model2.provider || providerHint } };
}
function applyInitialNodeModel(args3, value28, store2) {
  const model3 = String(value28.model || '').trim();
  if (!model3) return args3;
  const enabled4 = String(args3?.id || '').trim();
  if (!enabled4) return args3;
  const args4 = { model: model3, provider: String(value28.provider || '').trim() };
  return (
    getStore(store2)?.updateNodeData?.(enabled4, args4),
    store2.commit?.(),
    getNode(store2, enabled4) || { ...args3, ...args4 }
  );
}
function buildNodeSummary(value29, value30, { includeData: includeData = false } = {}) {
  const providerHint2 = getNode(value29, value30);
  if (!providerHint2) return null;
  const modelExecution2 = resolveModelExecution(providerHint2.model, {
      providerHint: providerHint2.provider,
    }),
    value31 = {
      id: String(providerHint2.id || value30),
      type: String(providerHint2.type || ''),
      name: String(providerHint2.name || ''),
      promptPreview: truncateText(providerHint2.prompt || providerHint2.storyboardScript?.prompt || ''),
      contentPreview: truncateText(providerHint2.content || ''),
      model: String(providerHint2.model || ''),
      provider: String(providerHint2.provider || ''),
      adapterType: String(
        modelExecution2?.modelManifest?.adapterType || modelExecution2?.executionManifest?.adapterType || '',
      ),
      x: toFiniteNumber(providerHint2.x),
      y: toFiniteNumber(providerHint2.y),
      width: toFiniteNumber(providerHint2.width),
      height: toFiniteNumber(providerHint2.height),
      jobStatus: String(
        providerHint2.jobStatus ||
          providerHint2.storyboardScript?.jobStatus ||
          (providerHint2.isGenerating ? 'running' : 'idle'),
      ),
    };
  if (includeData) value31.data = omitLargeMedia(providerHint2);
  return value31;
}
function buildCanvasSummary(value32) {
  const args5 = getState(value32),
    nodes2 = Object.keys(args5.nodes || {}).map((item7) => buildNodeSummary(value32, item7)),
    edges = Object.values(args5.edges || {}).map((item8) => ({
      id: String(item8?.id || ''),
      sourceId: String(item8?.sourceId || ''),
      targetId: String(item8?.targetId || ''),
      refSlot: String(item8?.refSlot || ''),
      type: String(item8?.type || ''),
    }));
  return {
    selectedNodeIds: Array.isArray(args5.selectedNodeIds) ? [...args5.selectedNodeIds] : [],
    nodes: nodes2,
    edges: edges,
    viewport: {
      x: toFiniteNumber(args5.viewport?.x),
      y: toFiniteNumber(args5.viewport?.y),
      zoom: toFiniteNumber(args5.viewport?.zoom, 1),
    },
    nodeCount: nodes2.length,
    edgeCount: edges.length,
  };
}
function validateNodeIds(args6, value33, value34) {
  try {
    return { args: { ...args6, ids: normalizeNodeIds(args6, value33, value34) } };
  } catch (errorCode) {
    return {
      ok: false,
      errorCode: errorCode.errorCode || 'INVALID_NODE_IDS',
      message: errorCode.message,
      details: errorCode.details,
    };
  }
}
export function registerGraphCommands(value35) {
  (value35.register({
    id: 'node.create',
    description: 'Create a canvas node.',
    riskLevel: 'safe',
    argsSchema: {
      required: ['type'],
      properties: {
        type: { type: 'string', enum: Array.from(SUPPORTED_CREATE_TYPES) },
        name: { type: 'string' },
        prompt: { type: 'string' },
        text: { type: 'string' },
        content: { type: 'string' },
        model: { type: 'string' },
        modelId: { type: 'string' },
        provider: { type: 'string' },
        params: { type: 'object' },
        width: { type: 'number' },
        height: { type: 'number' },
        x: { type: 'number' },
        y: { type: 'number' },
        placement: { type: 'string' },
        sequenceKey: { type: 'string' },
      },
      defaults: { width: 'node default', height: 'node default', placement: 'viewport-center-sequence' },
    },
    capabilitySchema: { reads: ['cursor', 'selection', 'modelRegistry'], writes: ['nodes', 'selection'] },
    returnSchema: { aliasFields: ['nodeId', 'node'] },
    validate(args7 = {}, value36 = {}) {
      const type = normalizeNodeType(args7.type);
      if (!SUPPORTED_CREATE_TYPES.has(type))
        return {
          ok: false,
          errorCode: 'UNSUPPORTED_NODE_TYPE',
          message: 'Unsupported node.create type: ' + (type || '(empty)'),
        };
      const hasExplicitCreatePosition2 =
        hasExplicitCreatePosition(args7) && typeof value36['buildNodeData'] === 'function';
      if (!hasExplicitCreatePosition2 && typeof value36['createNodeAtCursor'] !== 'function')
        return {
          ok: false,
          errorCode: 'NODE_CREATE_UNAVAILABLE',
          message: 'Canvas node creation flow is unavailable.',
        };
      const response2 = validateCreateModelArgs(args7, type, value36);
      if (response2.ok === false) return response2;
      return { args: { ...args7, ...response2.args, type: type } };
    },
    execute(type2, store3) {
      const { width: width2, height: height2 } = resolveCreateSize(type2['type'], type2, store3),
        name = String(type2['name'] || type2['label'] || ''),
        value37 = type2['agentReservation'] === !![],
        value38 = value37
          ? [
              ...(Array['isArray'](getState(store3)['selectedNodeIds'])
                ? getState(store3)['selectedNodeIds']
                : []),
            ]
          : [],
        nodeId2 = String(type2['reuseNodeId'] || '')['trim'](),
        value39 = nodeId2 ? getNode(store3, nodeId2) : null;
      if (value39 && String(value39['type'] || '')['trim']() === type2['type']) {
        const store4 = getStore(store3),
          value40 = { ...store3, commit: null };
        (Object['prototype']['hasOwnProperty']['call'](type2, 'name') || type2['label'] != null) &&
          store4?.['updateNodeData']?.(nodeId2, { name: name });
        const initialNodeModel = applyInitialNodeModel(getNode(store3, nodeId2) || value39, type2, value40),
          initialNodeText = applyInitialNodeText(initialNodeModel, type2, value40);
        return (
          store4?.['setSelectedNodes']?.([nodeId2]),
          store3['commit']?.(),
          { nodeId: nodeId2, node: getNode(store3, nodeId2) || initialNodeText || value39, reused: !![] }
        );
      }
      if (hasExplicitCreatePosition(type2) && typeof store3['buildNodeData'] === 'function') {
        const id = generateId(type2['type']),
          enabled5 = store3['buildNodeData']({
            ...type2,
            id: id,
            type: type2['type'],
            name: name,
            width: width2,
            height: height2,
            x: Number(type2['x']),
            y: Number(type2['y']),
          });
        if (!enabled5 || typeof enabled5 !== 'object')
          throw createCanvasCommandError(
            'NODE_CREATE_FAILED',
            'Canvas node factory did not return data for type: ' + type2['type'],
          );
        (getStore(store3)?.['addNode']?.(enabled5),
          getStore(store3)?.['setSelectedNodes']?.(value37 ? value38 : [id]));
        const value41 = { ...store3, commit: null },
          initialNodeModel2 = applyInitialNodeModel(enabled5, type2, value41),
          nodeId3 = applyInitialNodeText(initialNodeModel2, type2, value41);
        return (store3['commit']?.(), { nodeId: nodeId3?.['id'] || id, node: nodeId3 || enabled5 });
      }
      const placement = String(type2['placement'] || 'viewport-center-sequence')['trim'](),
        sequenceKey = String(type2['sequenceKey'] || store3['createNodeSequenceKey'] || '')['trim'](),
        value42 = store3['createNodeAtCursor'](type2['type'], width2, height2, name, {
          placement: placement,
          sequenceKey: sequenceKey,
        });
      if (value37) getStore(store3)?.['setSelectedNodes']?.(value38);
      const initialNodeModel3 = applyInitialNodeModel(value42, type2, store3),
        nodeId4 = applyInitialNodeText(initialNodeModel3, type2, store3);
      return { nodeId: nodeId4?.['id'] || value42?.['id'] || '', node: nodeId4 || value42 };
    },
  }),
    value35.register({
      id: 'node.delete',
      description: 'Delete canvas nodes.',
      riskLevel: 'danger',
      argsSchema: {
        properties: { nodeId: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } } },
        selectionFallback: true,
      },
      capabilitySchema: {
        reads: ['nodes', 'selection'],
        writes: ['nodes', 'edges', 'selection'],
        selectionFallback: true,
      },
      returnSchema: { aliasFields: ['ids'] },
      validate(options10 = {}, value43 = {}) {
        return validateNodeIds(options10, value43, { min: 1, allowSelection: true });
      },
      execute(ids, store5) {
        return (getStore(store5)?.deleteNodes?.(ids.ids), store5.commit?.(), { ids: ids.ids });
      },
    }),
    value35.register({
      id: 'node.rename',
      description: 'Rename a canvas node.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId', 'name'],
        properties: { nodeId: { type: 'string' }, name: { type: 'string' } },
      },
      capabilitySchema: { reads: ['nodes'], writes: ['nodes'] },
      returnSchema: { aliasFields: ['nodeId', 'name'] },
      validate(error = {}, value44 = {}) {
        const nodeId5 = String(error.nodeId || '').trim();
        if (!nodeId5)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.rename requires nodeId.' };
        if (!getNode(value44, nodeId5))
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId5 };
        if (!Object.prototype.hasOwnProperty.call(error, 'name'))
          return { ok: false, errorCode: 'MISSING_NODE_NAME', message: 'node.rename requires name.' };
        return { args: { nodeId: nodeId5, name: String(error.name || '').trim() } };
      },
      execute(name2, store6) {
        const store7 = getStore(store6);
        return (
          typeof store7?.renameNode === 'function'
            ? store7.renameNode(name2.nodeId, name2.name)
            : store7?.updateNodeData?.(name2.nodeId, { name: name2.name }),
          store6.commit?.(),
          { nodeId: name2.nodeId, name: name2.name }
        );
      },
    }),
    value35.register({
      id: 'node.duplicate',
      description: 'Duplicate canvas nodes.',
      riskLevel: 'confirm',
      argsSchema: {
        properties: {
          nodeId: { type: 'string' },
          ids: { type: 'array', items: { type: 'string' } },
          dx: { type: 'number' },
          dy: { type: 'number' },
        },
        defaults: { dx: 40, dy: 40 },
        selectionFallback: true,
      },
      capabilitySchema: {
        reads: ['nodes', 'edges', 'selection'],
        writes: ['nodes', 'edges', 'selection'],
        selectionFallback: true,
      },
      returnSchema: { aliasFields: ['ids', 'sourceIds'] },
      validate(options11 = {}, value45 = {}) {
        return validateNodeIds(options11, value45, { min: 1, allowSelection: true });
      },
      execute(sourceIds, store8) {
        const state4 = getState(store8),
          store9 = getStore(store8),
          toFiniteNumber2 = toFiniteNumber(sourceIds.dx, 40),
          toFiniteNumber3 = toFiniteNumber(sourceIds.dy, 40),
          sourceId2 = new Map(),
          ids2 = [],
          handler = () => {
            for (const value46 of sourceIds.ids) {
              const box5 = state4.nodes?.[value46];
              if (!box5) continue;
              const id2 = generateId(String(box5.type || 'node'));
              sourceId2.set(value46, id2);
              const value47 = {
                ...clonePlain(box5),
                id: id2,
                x: toFiniteNumber(box5.x) + toFiniteNumber2,
                y: toFiniteNumber(box5.y) + toFiniteNumber3,
                _bizRev: undefined,
              };
              (delete value47._bizRev, store9?.addNode?.(value47), ids2.push(id2));
            }
            for (const value48 of Object.values(state4.edges || {})) {
              if (!sourceId2.has(value48?.sourceId) || !sourceId2.has(value48?.targetId)) continue;
              store9?.addEdge?.({
                ...clonePlain(value48),
                id: generateId('edge'),
                sourceId: sourceId2.get(value48.sourceId),
                targetId: sourceId2.get(value48.targetId),
              });
            }
            store9?.setSelectedNodes?.(ids2);
          };
        if (typeof store9?.batch === 'function') store9.batch(handler);
        else handler();
        return (store8.commit?.(), { ids: ids2, sourceIds: sourceIds.ids });
      },
    }),
    value35.register({
      id: 'node.getSummary',
      description: 'Get a canvas node summary.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId'],
        properties: { nodeId: { type: 'string' }, includeData: { type: 'boolean' } },
        defaults: { includeData: false },
      },
      capabilitySchema: { reads: ['nodes'], writes: [] },
      returnSchema: { aliasFields: ['id', 'type', 'name', 'model', 'provider'] },
      validate(includeData2 = {}, value49 = {}) {
        const nodeId6 = String(includeData2.nodeId || '').trim();
        if (!nodeId6)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.getSummary requires nodeId.' };
        if (!getNode(value49, nodeId6))
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId6 };
        return { args: { nodeId: nodeId6, includeData: includeData2.includeData === true } };
      },
      execute(includeData3, value50) {
        return buildNodeSummary(value50, includeData3.nodeId, { includeData: includeData3.includeData });
      },
    }),
    value35.register({
      id: 'graph.connect',
      description: 'Connect two canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['sourceId', 'targetId'],
        properties: {
          sourceId: { type: 'string' },
          targetId: { type: 'string' },
          refSlot: { type: 'string' },
          edgeId: { type: 'string' },
          type: { type: 'string' },
        },
      },
      capabilitySchema: { reads: ['nodes', 'edges'], writes: ['edges'] },
      returnSchema: { aliasFields: ['edgeId', 'edge'] },
      validate(type3 = {}, value51 = {}) {
        const edgeId = normalizeEdgeArgs(type3);
        if (!edgeId.sourceId || !edgeId.targetId)
          return {
            ok: false,
            errorCode: 'MISSING_EDGE_ENDPOINTS',
            message: 'graph.connect requires sourceId and targetId.',
          };
        if (edgeId.sourceId === edgeId.targetId)
          return {
            ok: false,
            errorCode: 'INVALID_EDGE_ENDPOINTS',
            message: 'graph.connect cannot connect a node to itself.',
          };
        if (!getNode(value51, edgeId.sourceId))
          return {
            ok: false,
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + edgeId.sourceId,
          };
        if (!getNode(value51, edgeId.targetId))
          return {
            ok: false,
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + edgeId.targetId,
          };
        return {
          args: {
            ...edgeId,
            edgeId: edgeId.edgeId || generateId('edge'),
            type: type3.type ?? null,
          },
        };
      },
      execute(id3, store10) {
        const edgeId2 = findEdgesByEndpoints(store10, id3)[0];
        if (edgeId2) return { edgeId: edgeId2.id, edge: edgeId2, reused: true };
        const edgeId3 = {
          id: id3.edgeId,
          sourceId: id3.sourceId,
          targetId: id3.targetId,
          type: id3.type,
        };
        if (id3.refSlot) edgeId3.refSlot = id3.refSlot;
        return (
          getStore(store10)?.addEdge?.(edgeId3),
          store10.commit?.(),
          { edgeId: edgeId3.id, edge: edgeId3, reused: false }
        );
      },
    }),
    value35.register({
      id: 'node.setInputSlot',
      description: 'Set or clear the input slot/refSlot on an existing edge.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['refSlot'],
        properties: {
          edgeId: { type: 'string' },
          sourceId: { type: 'string' },
          targetId: { type: 'string' },
          refSlot: { type: 'string' },
          slot: { type: 'string' },
          inputSlot: { type: 'string' },
        },
      },
      capabilitySchema: { reads: ['edges'], writes: ['edges'] },
      returnSchema: { aliasFields: ['edgeId', 'refSlot', 'edge'] },
      validate(options12 = {}, value52 = {}) {
        const edgeArgs = normalizeEdgeArgs(options12),
          enabled6 =
            Object.prototype.hasOwnProperty.call(options12, 'refSlot') ||
            Object.prototype.hasOwnProperty.call(options12, 'slot') ||
            Object.prototype.hasOwnProperty.call(options12, 'inputSlot');
        if (!enabled6)
          return {
            ok: false,
            errorCode: 'MISSING_REF_SLOT',
            message: 'node.setInputSlot requires refSlot, slot, or inputSlot.',
          };
        const refSlot2 = String(options12.refSlot ?? options12.slot ?? options12.inputSlot ?? '').trim();
        let edges2 = null;
        if (edgeArgs.edgeId) {
          edges2 = getEdges(value52)[edgeArgs.edgeId] || null;
          if (!edges2)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'Canvas edge not found: ' + edgeArgs.edgeId,
            };
        } else {
          if (!edgeArgs.sourceId || !edgeArgs.targetId)
            return {
              ok: false,
              errorCode: 'MISSING_EDGE_SELECTOR',
              message: 'node.setInputSlot requires edgeId or sourceId/targetId.',
            };
          edges2 = findEdgesByEndpoints(value52, edgeArgs)[0] || null;
          if (!edges2)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'No canvas edge matched node.setInputSlot.',
            };
        }
        return { args: { edgeId: String(edges2.id || ''), refSlot: refSlot2 } };
      },
      execute(edgeId4, store11) {
        const args8 = getEdges(store11)[edgeId4.edgeId];
        if (!args8)
          throw createCanvasCommandError('EDGE_NOT_FOUND', 'Canvas edge not found: ' + edgeId4.edgeId, {
            edgeId: edgeId4.edgeId,
          });
        const edge = { ...args8 };
        if (edgeId4.refSlot) edge.refSlot = edgeId4.refSlot;
        else delete edge.refSlot;
        const store12 = getStore(store11);
        return (
          typeof store12?.updateEdgesBatch === 'function'
            ? store12.updateEdgesBatch([edgeId4.edgeId], [edge])
            : (store12?.removeEdge?.(edgeId4.edgeId), store12?.addEdge?.(edge)),
          store11.commit?.(),
          { edgeId: edgeId4.edgeId, refSlot: edgeId4.refSlot, edge: edge }
        );
      },
    }),
    value35.register({
      id: 'graph.disconnect',
      description: 'Disconnect canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          edgeId: { type: 'string' },
          sourceId: { type: 'string' },
          targetId: { type: 'string' },
          refSlot: { type: 'string' },
        },
      },
      capabilitySchema: { reads: ['edges'], writes: ['edges'] },
      returnSchema: { aliasFields: ['edgeIds'] },
      validate(options13 = {}, value53 = {}) {
        const edgeArgs2 = normalizeEdgeArgs(options13);
        if (edgeArgs2.edgeId) {
          const edges3 = getEdges(value53)[edgeArgs2.edgeId];
          if (!edges3)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'Canvas edge not found: ' + edgeArgs2.edgeId,
            };
          return { args: { edgeIds: [edgeArgs2.edgeId] } };
        }
        if (!edgeArgs2.sourceId && !edgeArgs2.targetId)
          return {
            ok: false,
            errorCode: 'MISSING_EDGE_SELECTOR',
            message: 'graph.disconnect requires edgeId or endpoint selectors.',
          };
        const edgeIds = findEdgesByEndpoints(value53, edgeArgs2);
        if (edgeIds.length === 0)
          return {
            ok: false,
            errorCode: 'EDGE_NOT_FOUND',
            message: 'No canvas edge matched graph.disconnect.',
          };
        return { args: { edgeIds: edgeIds.map((item9) => item9.id) } };
      },
      execute(edgeIds2, store13) {
        const store14 = getStore(store13);
        for (const value54 of edgeIds2.edgeIds) store14?.removeEdge?.(value54);
        return (store13.commit?.(), { edgeIds: edgeIds2.edgeIds });
      },
    }),
    value35.register({
      id: 'graph.getCanvasSummary',
      description: 'Get a safe canvas summary.',
      riskLevel: 'safe',
      argsSchema: {},
      capabilitySchema: { reads: ['nodes', 'edges', 'selection', 'viewport'], writes: [] },
      returnSchema: { aliasFields: ['selectedNodeIds', 'nodes', 'edges', 'nodeCount', 'edgeCount'] },
      execute(value55, value56) {
        return buildCanvasSummary(value56);
      },
    }));
}
export { buildCanvasSummary, buildNodeSummary, normalizeNodeIds };
