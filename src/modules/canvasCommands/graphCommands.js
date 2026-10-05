import { generateId } from '../../core/math.js';
import {
  stripImageGenerationResultStateForDerivedNode,
  stripImageGenerationRuntimeState,
} from '../../core/imageTaskRuntimeState.js';
import { calcSafeSpawnPosNearNode, createDuplicateSpawnOffsets } from '../nodeSpawn.js';
import {
  listModelManifests,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import { createCanvasCommandError } from './commandRegistry.js';
import { buildGenerationParamDisplayPatch } from './generationParamDisplay.js';
const SUPPORTED_CREATE_TYPES = new Set([
    'ai-text',
    'ai-image',
    'ai-video',
    'ai-audio',
    'source-text',
    'source-image',
    'source-video',
    'source-audio',
    'comment-note',
    'storyboard',
    'storyboard-script',
    'panorama-scene',
    'panorama-360',
    'collage',
    'whiteboard',
    'media-clip',
    'debug',
  ]),
  PROMPT_NODE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio', 'storyboard-script']),
  CONNECTED_CREATE_TYPES = new Set(['ai-text', 'ai-image', 'ai-video', 'ai-audio']),
  CREATE_TYPE_MODEL_KINDS = Object['freeze']({
    'ai-text': 'text',
    'ai-image': 'image',
    'ai-video': 'video',
    'ai-audio': 'audio',
    'storyboard-script': 'text',
  }),
  DEFAULT_NODE_SIZES = Object['freeze']({
    'ai-text': Object['freeze']({ width: 384, height: 288 }),
    'ai-image': Object['freeze']({ width: 288, height: 288 }),
    'ai-video': Object['freeze']({ width: 288, height: 288 }),
    'ai-audio': Object['freeze']({ width: 320, height: 240 }),
    'source-text': Object['freeze']({ width: 320, height: 180 }),
    'comment-note': Object['freeze']({ width: 260, height: 120 }),
    'storyboard-script': Object['freeze']({ width: 720, height: 420 }),
    'panorama-scene': Object['freeze']({ width: 1024, height: 576 }),
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
  return value['store']?.['getStateRaw']?.() || value['store']?.['getState']?.() || {};
}
function getStore(item) {
  return item['graphStore'] || item['store'];
}
function clonePlain(key) {
  if (typeof structuredClone === 'function') return structuredClone(key);
  return JSON['parse'](JSON['stringify'](key));
}
function normalizeNodeType(result) {
  return String(result || '')['trim']();
}
function toFinitePositiveNumber(data, options) {
  const count = Number(data);
  return Number['isFinite'](count) && count > 0 ? count : options;
}
function toFiniteNumber(target, source = 0) {
  const next = Number(target);
  return Number['isFinite'](next) ? next : source;
}
function getNode(current, entry) {
  const record = String(entry || '')['trim']();
  return record ? getState(current)['nodes']?.[record] || null : null;
}
function getNodes(payload) {
  return getState(payload)['nodes'] || {};
}
function getEdges(handle) {
  return getState(handle)['edges'] || {};
}
function getInitialText(response = {}) {
  if (Object['prototype']['hasOwnProperty']['call'](response, 'prompt')) return response['prompt'];
  if (Object['prototype']['hasOwnProperty']['call'](response, 'text')) return response['text'];
  if (Object['prototype']['hasOwnProperty']['call'](response, 'content')) return response['content'];
  return undefined;
}
function sanitizeInitialPrompt(state) {
  const enabled = String(state ?? '');
  if (!enabled['trim']()) return '';
  return /[<&]/['test'](enabled) ? sanitizePromptHtmlForCommit(enabled) : enabled;
}
function truncateText(config, scope = 500) {
  const list = String(config || '')
    ['replace'](/<[^>]*>/g, ' ')
    ['replace'](/\s+/g, ' ')
    ['trim']();
  if (list['length'] <= scope) return list;
  return list['slice'](0, Math['max'](0, scope - 3)) + '...';
}
function omitLargeMedia(list2, count2 = 0) {
  if (list2 == null) return list2;
  if (typeof list2 !== 'object') return list2;
  if (count2 > 2) return '[omitted]';
  if (Array['isArray'](list2)) return '[array:' + list2['length'] + ']';
  const input = {};
  for (const [output, list3] of Object['entries'](list2)) {
    if (MEDIA_PREVIEW_KEYS['has'](output)) input[output] = '[omitted]';
    else {
      if (typeof list3 === 'string' && list3['length'] > 500)
        input[output] = list3['slice'](0, 120) + '...';
      else
        list3 && typeof list3 === 'object'
          ? (input[output] = omitLargeMedia(list3, count2 + 1))
          : (input[output] = list3);
    }
  }
  return input;
}
function normalizeNodeIds(
  options2 = {},
  value2 = {},
  { min: min = 1, allowSelection: allowSelection = true } = {},
) {
  const nodes = getNodes(value2),
    state2 = getState(value2),
    value3 =
      Array['isArray'](options2['ids']) && options2['ids']['length'] > 0
        ? options2['ids']
        : options2['nodeId']
          ? [options2['nodeId']]
          : allowSelection
            ? state2['selectedNodeIds'] || []
            : [],
    list4 = [],
    map = new Set();
  for (const value4 of value3) {
    const nodeId2 = String(value4 || '')['trim']();
    if (!nodeId2 || map['has'](nodeId2)) continue;
    if (!nodes[nodeId2])
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + nodeId2, {
        nodeId: nodeId2,
      });
    (list4['push'](nodeId2), map['add'](nodeId2));
  }
  if (list4['length'] < min)
    throw createCanvasCommandError(
      'INSUFFICIENT_NODES',
      'At least ' + min + ' canvas node id(s) are required.',
    );
  return list4;
}
function hasOwn(value5, value6) {
  return Object['prototype']['hasOwnProperty']['call'](value5 || {}, value6);
}
function normalizeRenameOrder(value7 = '') {
  const value8 = String(value7 || '')
    ['trim']()
    ['toLowerCase']();
  if (
    value8 === 'top-to-bottom' ||
    value8 === 'top' ||
    value8 === 'vertical' ||
    value8 === 'y' ||
    value8 === 'y-asc'
  )
    return 'top-to-bottom';
  if (value8 === 'bottom-to-top' || value8 === 'bottom' || value8 === 'y-desc')
    return 'bottom-to-top';
  if (
    value8 === 'left-to-right' ||
    value8 === 'left' ||
    value8 === 'horizontal' ||
    value8 === 'x' ||
    value8 === 'x-asc'
  )
    return 'left-to-right';
  if (value8 === 'right-to-left' || value8 === 'right' || value8 === 'x-desc')
    return 'right-to-left';
  return 'selection';
}
function sortRenameIds(list5 = [], value9 = {}, value10 = 'selection') {
  const renameOrder = normalizeRenameOrder(value10);
  if (renameOrder === 'selection' || list5['length'] <= 1) return list5;
  const nodes2 = getNodes(value9),
    map2 = new Map(list5['map']((value11, value12) => [value11, value12])),
    value13 = renameOrder === 'top-to-bottom' || renameOrder === 'bottom-to-top' ? 'y' : 'x',
    value14 = value13 === 'y' ? 'x' : 'y',
    value15 = renameOrder === 'bottom-to-top' || renameOrder === 'right-to-left' ? -1 : 1;
  return [...list5]['sort']((value16, value17) => {
    const value18 = nodes2[value16] || {},
      value19 = nodes2[value17] || {},
      count3 = (toFiniteNumber(value18[value13]) - toFiniteNumber(value19[value13])) * value15;
    if (count3 !== 0) return count3;
    const toFiniteNumber2 = toFiniteNumber(value18[value14]) - toFiniteNumber(value19[value14]);
    if (toFiniteNumber2 !== 0) return toFiniteNumber2;
    return (map2['get'](value16) || 0) - (map2['get'](value17) || 0);
  });
}
function normalizeRenameNodeIds(options3 = {}, value20 = {}) {
  const enabled2 = Array['isArray'](options3['ids']) && options3['ids']['length'] > 0,
    enabled3 = Boolean(String(options3['nodeId'] || '')['trim']()),
    list6 = getState(value20)['selectedNodeIds'],
    enabled4 = Array['isArray'](list6) && list6['length'] > 0;
  if (!enabled2 && !enabled3 && !enabled4)
    throw createCanvasCommandError('MISSING_NODE_ID', 'node.rename requires nodeId or ids.');
  return normalizeNodeIds(options3, value20, { min: 1, allowSelection: true });
}
function getNodeKindFromType(value21 = '') {
  const list7 = String(value21 || '');
  if (list7['includes']('video')) return 'video';
  if (list7['includes']('image')) return 'image';
  if (list7['includes']('audio')) return 'audio';
  if (list7['includes']('text')) return 'text';
  return list7 || 'node';
}
function formatRenameTemplate(
  value22 = '',
  error = {},
  { index: index = 1, zeroIndex: zeroIndex = 0, nodeId: nodeId = '' } = {},
) {
  const type = String(error['type'] || ''),
    value23 = {
      index: String(index),
      n: String(index),
      i: String(index),
      zeroIndex: String(zeroIndex),
      id: nodeId,
      nodeId: nodeId,
      type: type,
      kind: getNodeKindFromType(type),
      name: String(error['name'] || ''),
      originalName: String(error['name'] || ''),
    };
  return String(value22)['replace'](
    /\{(index|n|i|zeroIndex|id|nodeId|type|kind|name|originalName)\}/g,
    (value24, value25) => value23[value25] ?? '',
  );
}
function getRenameStartIndex(options4 = {}) {
  const value26 = Number(options4['startIndex'] ?? options4['start'] ?? 1);
  return Number['isFinite'](value26) ? Math['trunc'](value26) : 1;
}
function buildNumberedRenameName(error2 = {}, value27 = 0) {
  const renameStartIndex = getRenameStartIndex(error2),
    value28 = renameStartIndex + value27,
    value29 = String(error2['separator'] ?? ' '),
    value30 = String(error2['prefix'] ?? ''),
    hasOwn2 = hasOwn(error2, 'name') ? String(error2['name'] ?? '')['trim']() : '',
    value31 = String(error2['suffix'] ?? ''),
    value32 = [String(value28), hasOwn2]['filter']((value33) => value33 !== '')['join'](value29);
  return ('' + value30 + value32 + value31)['trim']();
}
function hasRenameNameInput(options5 = {}) {
  return (
    hasOwn(options5, 'name') ||
    (Array['isArray'](options5['names']) && options5['names']['length'] > 0) ||
    hasOwn(options5, 'nameTemplate') ||
    hasOwn(options5, 'template') ||
    hasOwn(options5, 'pattern') ||
    options5['numbered'] === true ||
    hasOwn(options5, 'startIndex') ||
    hasOwn(options5, 'start')
  );
}
function resolveRenameNames(names = {}, ids = [], value34 = {}) {
  if (!hasRenameNameInput(names))
    throw createCanvasCommandError('MISSING_NODE_NAME', 'node.rename requires name.');
  if (Array['isArray'](names['names']) && names['names']['length'] > 0) {
    if (names['names']['length'] !== ids['length'])
      throw createCanvasCommandError(
        'RENAME_NAME_COUNT_MISMATCH',
        'node.rename names length must match target ids length.',
        { ids: ids, names: names['names'] },
      );
    return names['names']['map']((value35) => String(value35 ?? '')['trim']());
  }
  const value36 = String(names['nameTemplate'] ?? names['template'] ?? names['pattern'] ?? '');
  if (value36) {
    const index2 = getRenameStartIndex(names);
    return ids['map']((nodeId3, zeroIndex2) =>
      formatRenameTemplate(value36, getNode(value34, nodeId3) || {}, {
        index: index2 + zeroIndex2,
        zeroIndex: zeroIndex2,
        nodeId: nodeId3,
      })['trim'](),
    );
  }
  const value37 =
    names['numbered'] === true ||
    hasOwn(names, 'startIndex') ||
    hasOwn(names, 'start') ||
    hasOwn(names, 'separator');
  if (value37)
    return ids['map']((value38, value39) => buildNumberedRenameName(names, value39));
  const value40 = String(names['name'] ?? '')['trim']();
  return ids['map'](() => value40);
}
function buildRenameEntries(options6 = {}, value41 = {}) {
  const list8 = sortRenameIds(
      normalizeRenameNodeIds(options6, value41),
      value41,
      options6['orderBy'] ?? options6['order'],
    ),
    name = resolveRenameNames(options6, list8, value41);
  return list8['map']((nodeId4, value42) => ({ nodeId: nodeId4, name: name[value42] }));
}
function normalizeEdgeId(value43) {
  return String(value43 || '')['trim']();
}
function normalizeEdgeArgs(event = {}) {
  return {
    edgeId: normalizeEdgeId(event['edgeId'] || event['id']),
    sourceId: String(event['sourceId'] || event['source'] || '')['trim'](),
    targetId: String(event['targetId'] || event['target'] || '')['trim'](),
    refSlot: String(event['refSlot'] || event['slot'] || '')['trim'](),
  };
}
function findEdgesByEndpoints(
  value44,
  { sourceId: sourceId, targetId: targetId, refSlot: refSlot = '' },
) {
  return Object['values'](getEdges(value44))['filter']((enabled5) => {
    if (!enabled5) return false;
    if (sourceId && enabled5['sourceId'] !== sourceId) return false;
    if (targetId && enabled5['targetId'] !== targetId) return false;
    if (refSlot && String(enabled5['refSlot'] || '') !== refSlot) return false;
    return true;
  });
}
function resolveCreateSize(value45, box = {}, value46 = {}) {
  const box2 = DEFAULT_NODE_SIZES[value45] || { width: 300, height: 300 };
  let value47 = null;
  if (
    PROMPT_NODE_TYPES['has'](value45) &&
    typeof value46['getAIGenerationDefaultSizeByType'] === 'function'
  )
    value47 = value46['getAIGenerationDefaultSizeByType'](value45);
  else
    typeof value46['getNodeDefaultSize'] === 'function' &&
      (value47 = value46['getNodeDefaultSize'](value45));
  const box3 = value47 && typeof value47 === 'object' ? value47 : box2;
  return {
    width: toFinitePositiveNumber(
      box['width'],
      toFinitePositiveNumber(box3['width'], box2['width']),
    ),
    height: toFinitePositiveNumber(
      box['height'],
      toFinitePositiveNumber(box3['height'], box2['height']),
    ),
  };
}
function hasExplicitCreatePosition(box4 = {}) {
  return Number['isFinite'](Number(box4['x'])) && Number['isFinite'](Number(box4['y']));
}
function buildConnectedNodeData(type2 = {}, value48 = {}) {
  const box5 = getNode(value48, type2['sourceId']),
    box6 = resolveCreateSize(type2['type'], type2, value48),
    value49 =
      (type2['type'] === 'ai-image' || type2['type'] === 'ai-video') &&
      toFinitePositiveNumber(box5?.['width'], 0) > 0 &&
      toFinitePositiveNumber(box5?.['height'], 0) > 0 &&
      typeof value48['getAIGenerationNodeSize'] === 'function',
    box7 = value49
      ? value48['getAIGenerationNodeSize'](box5['width'], box5['height'])
      : box6,
    width2 = toFinitePositiveNumber(box7?.['width'], box6['width']),
    height2 = toFinitePositiveNumber(box7?.['height'], box6['height']),
    x = calcSafeSpawnPosNearNode(getNodes(value48), box5, width2, height2),
    id = generateId(type2['type']);
  let args = {
    id: id,
    type: type2['type'],
    x: x['x'],
    y: x['y'],
    width: width2,
    height: height2,
    name: String(type2['name'] || type2['label'] || ''),
  };
  (type2['type'] === 'ai-image' || type2['type'] === 'ai-video') &&
    !Object['prototype']['hasOwnProperty']['call'](args, 'aspectRatio') &&
    (args['aspectRatio'] = '自适应');
  if (type2['inheritSource'] !== false && box5?.['type'] === type2['type']) {
    const box8 = clonePlain(box5);
    (delete box8['id'],
      delete box8['x'],
      delete box8['y'],
      delete box8['width'],
      delete box8['height'],
      delete box8['name'],
      delete box8['prompt'],
      delete box8['outputText'],
      stripImageGenerationResultStateForDerivedNode(box8),
      (args = { ...box8, ...args }));
  }
  return args;
}
function applyInitialNodeText(args2, value50, store) {
  const initialText = getInitialText(value50);
  if (initialText === undefined || initialText === null) return args2;
  const enabled6 = String(args2?.['id'] || '')['trim'](),
    value51 = String(args2?.['type'] || '')['trim']();
  if (!enabled6) return args2;
  let args3 = null;
  if (PROMPT_NODE_TYPES['has'](value51)) args3 = { prompt: sanitizeInitialPrompt(initialText) };
  else
    (value51 === 'source-text' || value51 === 'comment-note') &&
      (args3 = { content: String(initialText || '') });
  if (!args3) return args2;
  return (
    getStore(store)?.['updateNodeData']?.(enabled6, args3),
    store['commit']?.(),
    getNode(store, enabled6) || { ...args2, ...args3 }
  );
}
function isImageNodeType(value52 = '') {
  const value53 = String(value52 || '');
  return value53 === 'ai-image' || value53 === 'source-image';
}
function hasSelectedImageInput(options7 = {}) {
  const state3 = getState(options7),
    list9 = Array['isArray'](state3['selectedNodeIds']) ? state3['selectedNodeIds'] : [];
  return list9['some']((value54) => isImageNodeType(state3['nodes']?.[value54]?.['type']));
}
function manifestAllowsImageInput(options8 = {}) {
  const value55 =
      options8?.['inputSlots'] && typeof options8['inputSlots'] === 'object' ? options8['inputSlots'] : {},
    list10 = Array['isArray'](value55['allowedKinds']) ? value55['allowedKinds'] : [];
  if (list10['includes']('image')) return true;
  const count4 = Number(value55['maxByKind']?.['image']);
  return Number['isFinite'](count4) && count4 > 0;
}
function manifestAllowsTextInput(options9 = {}) {
  const value56 =
      options9?.['inputSlots'] && typeof options9['inputSlots'] === 'object' ? options9['inputSlots'] : {},
    list11 = Array['isArray'](value56['allowedKinds']) ? value56['allowedKinds'] : [];
  return list11['length'] === 0 || list11['includes']('text');
}
function manifestRequiresMissingMedia(options10 = {}, { hasImageInput: hasImageInput = false } = {}) {
  const value57 =
      options10?.['inputSlots'] && typeof options10['inputSlots'] === 'object' ? options10['inputSlots'] : {},
    value58 = value57['minByKind'] || {};
  if (!hasImageInput && Number(value58['image']) > 0) return true;
  if (Number(value58['video']) > 0) return true;
  if (Number(value58['audio']) > 0) return true;
  const list12 = Array['isArray'](value57['fixedSlots']) ? value57['fixedSlots'] : [];
  return list12['some']((value59) => {
    if (value59?.['required'] !== true) return false;
    const value60 = String(value59?.['kind'] || '');
    if (value60 === 'image') return !hasImageInput;
    return value60 === 'video' || value60 === 'audio';
  });
}
function getManifestFieldIds(options11 = {}) {
  return new Set(
    (Array['isArray'](options11?.['uiSchema']?.['fields']) ? options11['uiSchema']['fields'] : [])
      ['map']((value61) => String(value61?.['id'] || '')['trim']())
      ['filter'](Boolean),
  );
}
function findAutoCreateModel(options12 = {}, value62 = '', value63 = {}) {
  const hasImageInput2 = value62 === 'ai-video',
    enabled7 = value62 === 'ai-image';
  if (!hasImageInput2 && !enabled7) return null;
  const list13 =
    options12['params'] && typeof options12['params'] === 'object' && !Array['isArray'](options12['params'])
      ? Object['keys'](options12['params'])
      : [];
  if (enabled7 && list13['length'] === 0) return null;
  const value64 = hasImageInput2 ? 'video' : 'image',
    enabled8 = hasImageInput2 && hasSelectedImageInput(value63),
    listModelManifests2 = listModelManifests()
      ['filter']((enabled9) => {
        if (enabled9?.['kind'] !== value64 || !enabled9?.['modelId']) return false;
        const enabled10 = hasImageInput2
          ? enabled8
            ? manifestAllowsImageInput(enabled9)
            : manifestAllowsTextInput(enabled9)
          : manifestAllowsTextInput(enabled9);
        if (!enabled10) return false;
        if (manifestRequiresMissingMedia(enabled9, { hasImageInput: hasImageInput2 ? enabled8 : false }))
          return false;
        if (!enabled7) return true;
        const map3 = getManifestFieldIds(enabled9);
        return list13['every']((value65) => map3['has'](value65));
      })
      ['map']((manifest) => {
        const map4 = getManifestFieldIds(manifest);
        let score = manifest['vip'] === true ? 0 : 10;
        hasImageInput2 && !enabled8 && !manifestAllowsImageInput(manifest) && (score += 8);
        for (const value66 of list13) {
          if (map4['has'](value66)) score += 20;
        }
        if (hasImageInput2 && map4['has']('duration')) score += 8;
        if (map4['has']('aspectRatio')) score += 4;
        const value67 =
          Number(
            hasImageInput2
              ? manifest['extensions']?.['videoMenu']?.['order']
              : manifest['extensions']?.['imageMenu']?.['order'],
          ) || 0;
        return (
          (score += Math['max'](0, 100 - value67) / 100),
          { manifest: manifest, score: score }
        );
      })
      ['sort']((value68, value69) => {
        if (value69['score'] !== value68['score']) return value69['score'] - value68['score'];
        return String(value68['manifest']['modelId'])['localeCompare'](
          String(value69['manifest']['modelId']),
        );
      });
  return listModelManifests2[0]?.['manifest'] || null;
}
function isAutoModelPlaceholder(value70 = '') {
  const enabled11 = String(value70 || '')
    ['trim']()
    ['toLowerCase']();
  return !enabled11 || enabled11 === 'auto' || enabled11 === 'default' || enabled11 === 'unknown';
}
function validateCreateModelArgs(options13 = {}, value71 = '', value72 = {}) {
  const value73 = String(options13['model'] || options13['modelId'] || '')['trim']();
  if (isAutoModelPlaceholder(value73)) {
    const model = findAutoCreateModel(options13, value71, value72);
    if (model) return { args: { model: model['modelId'], provider: model['provider'] || '' } };
    const value74 =
      options13['params'] &&
      typeof options13['params'] === 'object' &&
      !Array['isArray'](options13['params']) &&
      Object['keys'](options13['params'])['length'] > 0;
    if (CREATE_TYPE_MODEL_KINDS[value71] && value74)
      return {
        ok: false,
        errorCode: 'MODEL_REQUIRED_FOR_PARAMS',
        message: 'node.create requires a resolvable model when params are provided.',
      };
    return { args: {} };
  }
  const providerHint = String(options13['provider'] || '')['trim'](),
    modelExecution = resolveModelExecution(value73, { providerHint: providerHint }),
    model2 = modelExecution?.['modelManifest'];
  if (!model2)
    return {
      ok: false,
      errorCode: 'MODEL_MANIFEST_NOT_FOUND',
      message: 'Model manifest not found: ' + value73,
    };
  const value75 = CREATE_TYPE_MODEL_KINDS[value71] || '';
  if (value75 && String(model2['kind'] || '') !== value75)
    return {
      ok: false,
      errorCode: 'MODEL_KIND_MISMATCH',
      message:
        'Model ' +
        value73 +
        ' is ' +
        (model2['kind'] || '(unknown)') +
        ', not ' +
        value75 +
        '.',
    };
  return { args: { model: model2['modelId'] || value73, provider: model2['provider'] || providerHint } };
}
function applyInitialNodeModel(nodeData, value76, store2) {
  const model3 = String(value76['model'] || '')['trim']();
  if (!model3) return nodeData;
  const nodeId5 = String(nodeData?.['id'] || '')['trim']();
  if (!nodeId5) return nodeData;
  const modelExecution2 = resolveModelExecution(model3, {
      providerHint: String(value76['provider'] || '')['trim'](),
    }),
    value77 = modelExecution2?.['modelManifest'] || null,
    args4 =
      nodeData?.['generationParams'] &&
      typeof nodeData['generationParams'] === 'object' &&
      !Array['isArray'](nodeData['generationParams'])
        ? nodeData['generationParams']
        : {},
    args5 =
      value76['params'] && typeof value76['params'] === 'object' && !Array['isArray'](value76['params'])
        ? value76['params']
        : {},
    generationParams = value77
      ? sanitizeModelUiSchemaParams(
          value77['modelId'],
          { ...args4, ...args5 },
          { includeDefaults: true },
        )
      : {},
    store3 = getStore(store2),
    args6 = {
      model: model3,
      provider: String(value76['provider'] || '')['trim'](),
      generationParams: generationParams,
      ...buildGenerationParamDisplayPatch({
        store: store3,
        nodeId: nodeId5,
        nodeData: nodeData,
        modelId: model3,
        generationParams: generationParams,
        force: true,
        respectManualDisplaySize: false,
      }),
    };
  return (
    store3?.['updateNodeData']?.(nodeId5, args6),
    store2['commit']?.(),
    getNode(store2, nodeId5) || { ...nodeData, ...args6 }
  );
}
function buildNodeSummary(value78, value79, { includeData: includeData = false } = {}) {
  const providerHint2 = getNode(value78, value79);
  if (!providerHint2) return null;
  const modelExecution3 = resolveModelExecution(providerHint2['model'], { providerHint: providerHint2['provider'] }),
    value80 = {
      id: String(providerHint2['id'] || value79),
      type: String(providerHint2['type'] || ''),
      name: String(providerHint2['name'] || ''),
      promptPreview: truncateText(providerHint2['prompt'] || providerHint2['storyboardScript']?.['prompt'] || ''),
      contentPreview: truncateText(providerHint2['content'] || ''),
      model: String(providerHint2['model'] || ''),
      provider: String(providerHint2['provider'] || ''),
      adapterType: String(
        modelExecution3?.['modelManifest']?.['adapterType'] ||
          modelExecution3?.['executionManifest']?.['adapterType'] ||
          '',
      ),
      x: toFiniteNumber(providerHint2['x']),
      y: toFiniteNumber(providerHint2['y']),
      width: toFiniteNumber(providerHint2['width']),
      height: toFiniteNumber(providerHint2['height']),
      jobStatus: String(
        providerHint2['jobStatus'] ||
          providerHint2['storyboardScript']?.['jobStatus'] ||
          (providerHint2['isGenerating'] ? 'running' : 'idle'),
      ),
    };
  if (includeData) value80['data'] = omitLargeMedia(providerHint2);
  return value80;
}
function buildCanvasSummary(value81) {
  const args7 = getState(value81),
    nodes3 = Object['keys'](args7['nodes'] || {})['map']((value82) =>
      buildNodeSummary(value81, value82),
    ),
    edges = Object['values'](args7['edges'] || {})['map']((value83) => ({
      id: String(value83?.['id'] || ''),
      sourceId: String(value83?.['sourceId'] || ''),
      targetId: String(value83?.['targetId'] || ''),
      refSlot: String(value83?.['refSlot'] || ''),
      type: String(value83?.['type'] || ''),
    }));
  return {
    selectedNodeIds: Array['isArray'](args7['selectedNodeIds']) ? [...args7['selectedNodeIds']] : [],
    nodes: nodes3,
    edges: edges,
    viewport: {
      x: toFiniteNumber(args7['viewport']?.['x']),
      y: toFiniteNumber(args7['viewport']?.['y']),
      zoom: toFiniteNumber(args7['viewport']?.['zoom'], 1),
    },
    nodeCount: nodes3['length'],
    edgeCount: edges['length'],
  };
}
function validateNodeIds(args8, value84, value85) {
  try {
    return { args: { ...args8, ids: normalizeNodeIds(args8, value84, value85) } };
  } catch (errorCode) {
    return {
      ok: false,
      errorCode: errorCode['errorCode'] || 'INVALID_NODE_IDS',
      message: errorCode['message'],
      details: errorCode['details'],
    };
  }
}
function validateDeleteNodeIds(args9 = {}, value86 = {}) {
  if (String(args9['nodeId'] || '')['trim']())
    return validateNodeIds(args9, value86, { min: 1, allowSelection: true });
  const state4 = getState(value86),
    value87 =
      Array['isArray'](args9['ids']) && args9['ids']['length'] > 0
        ? args9['ids']
        : state4['selectedNodeIds'] || [],
    ids2 = [],
    map5 = new Set();
  for (const value88 of value87) {
    const enabled12 = String(value88 || '')['trim']();
    if (!enabled12 || map5['has'](enabled12) || !state4['nodes']?.[enabled12]) continue;
    (map5['add'](enabled12), ids2['push'](enabled12));
  }
  if (ids2['length'] === 0)
    return {
      ok: false,
      errorCode: 'INSUFFICIENT_NODES',
      message: 'node.delete requires at least one existing node.',
    };
  return { args: { ...args9, ids: ids2 } };
}
export function registerGraphCommands(value89) {
  (value89['register']({
    id: 'node.create',
    description: 'Create a canvas node.',
    riskLevel: 'safe',
    argsSchema: {
      required: ['type'],
      properties: {
        type: { type: 'string', enum: Array['from'](SUPPORTED_CREATE_TYPES) },
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
    validate(args10 = {}, value90 = {}) {
      const type3 = normalizeNodeType(args10['type']);
      if (!SUPPORTED_CREATE_TYPES['has'](type3))
        return {
          ok: false,
          errorCode: 'UNSUPPORTED_NODE_TYPE',
          message: 'Unsupported node.create type: ' + (type3 || '(empty)'),
        };
      const hasExplicitCreatePosition2 =
        hasExplicitCreatePosition(args10) && typeof value90['buildNodeData'] === 'function';
      if (!hasExplicitCreatePosition2 && typeof value90['createNodeAtCursor'] !== 'function')
        return {
          ok: false,
          errorCode: 'NODE_CREATE_UNAVAILABLE',
          message: 'Canvas node creation flow is unavailable.',
        };
      const response2 = validateCreateModelArgs(args10, type3, value90);
      if (response2['ok'] === false) return response2;
      return { args: { ...args10, ...response2['args'], type: type3 } };
    },
    execute(type4, store4) {
      const { width: width3, height: height3 } = resolveCreateSize(
          type4['type'],
          type4,
          store4,
        ),
        name2 = String(type4['name'] || type4['label'] || ''),
        value91 = type4['agentReservation'] === true,
        value92 = value91
          ? [
              ...(Array['isArray'](getState(store4)['selectedNodeIds'])
                ? getState(store4)['selectedNodeIds']
                : []),
            ]
          : [],
        nodeId6 = String(type4['reuseNodeId'] || '')['trim'](),
        value93 = nodeId6 ? getNode(store4, nodeId6) : null;
      if (value93 && String(value93['type'] || '')['trim']() === type4['type']) {
        const store5 = getStore(store4),
          value94 = { ...store4, commit: null };
        (Object['prototype']['hasOwnProperty']['call'](type4, 'name') || type4['label'] != null) &&
          store5?.['updateNodeData']?.(nodeId6, { name: name2 });
        const initialNodeModel = applyInitialNodeModel(
            getNode(store4, nodeId6) || value93,
            type4,
            value94,
          ),
          initialNodeText = applyInitialNodeText(initialNodeModel, type4, value94);
        return (
          store5?.['setSelectedNodes']?.([nodeId6]),
          store4['commit']?.(),
          { nodeId: nodeId6, node: getNode(store4, nodeId6) || initialNodeText || value93, reused: true }
        );
      }
      if (hasExplicitCreatePosition(type4) && typeof store4['buildNodeData'] === 'function') {
        const id2 = generateId(type4['type']),
          enabled13 = store4['buildNodeData']({
            ...type4,
            id: id2,
            type: type4['type'],
            name: name2,
            width: width3,
            height: height3,
            x: Number(type4['x']),
            y: Number(type4['y']),
          });
        if (!enabled13 || typeof enabled13 !== 'object')
          throw createCanvasCommandError(
            'NODE_CREATE_FAILED',
            'Canvas node factory did not return data for type: ' + type4['type'],
          );
        (getStore(store4)?.['addNode']?.(enabled13),
          getStore(store4)?.['setSelectedNodes']?.(value91 ? value92 : [id2]));
        const value95 = { ...store4, commit: null },
          initialNodeModel2 = applyInitialNodeModel(enabled13, type4, value95),
          nodeId7 = applyInitialNodeText(initialNodeModel2, type4, value95);
        return (
          store4['commit']?.(),
          { nodeId: nodeId7?.['id'] || id2, node: nodeId7 || enabled13 }
        );
      }
      const placement = String(type4['placement'] || 'viewport-center-sequence')['trim'](),
        sequenceKey = String(type4['sequenceKey'] || store4['createNodeSequenceKey'] || '')['trim'](),
        value96 = store4['createNodeAtCursor'](type4['type'], width3, height3, name2, {
          placement: placement,
          sequenceKey: sequenceKey,
        });
      if (value91) getStore(store4)?.['setSelectedNodes']?.(value92);
      const initialNodeModel3 = applyInitialNodeModel(value96, type4, store4),
        nodeId8 = applyInitialNodeText(initialNodeModel3, type4, store4);
      return { nodeId: nodeId8?.['id'] || value96?.['id'] || '', node: nodeId8 || value96 };
    },
  }),
    value89['register']({
      id: 'node.createConnected',
      description: 'Create a generation node next to a source node and connect them.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['sourceId', 'type'],
        properties: {
          sourceId: { type: 'string' },
          type: { type: 'string', enum: Array['from'](CONNECTED_CREATE_TYPES) },
          name: { type: 'string' },
          label: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          inheritSource: { type: 'boolean' },
        },
        defaults: { inheritSource: true, placement: 'right-of-source' },
      },
      capabilitySchema: { reads: ['nodes', 'edges'], writes: ['nodes', 'edges', 'selection'] },
      returnSchema: { aliasFields: ['nodeId', 'node', 'edgeId', 'sourceId'] },
      validate(args11 = {}, value97 = {}) {
        const sourceId2 = String(args11['sourceId'] || '')['trim'](),
          type5 = normalizeNodeType(args11['type']);
        if (!sourceId2)
          return {
            ok: false,
            errorCode: 'MISSING_SOURCE_NODE_ID',
            message: 'node.createConnected requires sourceId.',
          };
        if (!getNode(value97, sourceId2))
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + sourceId2 };
        if (!CONNECTED_CREATE_TYPES['has'](type5))
          return {
            ok: false,
            errorCode: 'UNSUPPORTED_NODE_TYPE',
            message: 'Unsupported node.createConnected type: ' + (type5 || '(empty)'),
          };
        return { args: { ...args11, sourceId: sourceId2, type: type5 } };
      },
      execute(sourceId3, store6) {
        const store7 = getStore(store6),
          targetId2 = buildConnectedNodeData(sourceId3, store6),
          map6 = new Set(Object['keys'](getEdges(store6)));
        store7?.['addNode']?.(targetId2);
        const value98 =
          typeof store6['connectNodes'] === 'function'
            ? store6['connectNodes']({ sourceId: sourceId3['sourceId'], targetId: targetId2['id'] })
            : false;
        let edgeId = '';
        if (value98)
          edgeId =
            Object['keys'](getEdges(store6))['find']((value99) => !map6['has'](value99)) || '';
        else {
          const value100 = {
            id: generateId('edge'),
            sourceId: sourceId3['sourceId'],
            targetId: targetId2['id'],
            createdAt: Date['now'](),
          };
          (store7?.['addEdge']?.(value100), (edgeId = value100['id']));
        }
        return (
          store7?.['setSelectedNodes']?.([targetId2['id']]),
          store6['commit']?.(),
          { nodeId: targetId2['id'], node: targetId2, edgeId: edgeId, sourceId: sourceId3['sourceId'] }
        );
      },
    }),
    value89['register']({
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
      validate(options14 = {}, value101 = {}) {
        return validateDeleteNodeIds(options14, value101);
      },
      execute(ids3, store8) {
        const store9 = getStore(store8);
        return (
          store9?.['deleteNodes']?.(ids3['ids']),
          typeof store9?.['clearSelection'] === 'function'
            ? store9['clearSelection']()
            : store9?.['setSelectedNodes']?.([]),
          store8['commit']?.(),
          { ids: ids3['ids'] }
        );
      },
    }),
    value89['register']({
      id: 'node.rename',
      description: 'Rename one or more canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          nodeId: { type: 'string' },
          ids: { type: 'array', items: { type: 'string' } },
          name: { type: 'string' },
          names: { type: 'array', items: { type: 'string' } },
          nameTemplate: { type: 'string' },
          template: { type: 'string' },
          pattern: { type: 'string' },
          numbered: { type: 'boolean' },
          startIndex: { type: 'number' },
          start: { type: 'number' },
          separator: { type: 'string' },
          prefix: { type: 'string' },
          suffix: { type: 'string' },
          orderBy: { type: 'string' },
          order: { type: 'string' },
        },
        defaults: { selectionFallback: true, orderBy: 'selection', startIndex: 1 },
        selectionFallback: true,
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'], selectionFallback: true },
      returnSchema: { aliasFields: ['nodeId', 'name', 'ids', 'names', 'renamed'] },
      validate(args12 = {}, value102 = {}) {
        try {
          const entries = buildRenameEntries(args12, value102),
            nodeId9 = entries[0] || {};
          return {
            args: {
              ...args12,
              entries: entries,
              nodeId: nodeId9['nodeId'] || '',
              name: nodeId9['name'] ?? '',
              ids: entries['map']((value103) => value103['nodeId']),
              names: entries['map']((error3) => error3['name']),
            },
          };
        } catch (errorCode2) {
          return {
            ok: false,
            errorCode: errorCode2['errorCode'] || 'INVALID_RENAME_ARGS',
            message: errorCode2['message'] || 'Invalid node.rename args.',
            details: errorCode2['details'],
          };
        }
      },
      execute(nodeId10, store10) {
        const store11 = getStore(store10),
          ids4 = Array['isArray'](nodeId10['entries']) ? nodeId10['entries'] : [],
          handler = () => {
            for (const name3 of ids4) {
              typeof store11?.['renameNode'] === 'function'
                ? store11['renameNode'](name3['nodeId'], name3['name'])
                : store11?.['updateNodeData']?.(name3['nodeId'], { name: name3['name'] });
            }
          };
        if (ids4['length'] > 1 && typeof store11?.['batch'] === 'function')
          store11['batch'](handler);
        else handler();
        return (
          store10['commit']?.(),
          {
            nodeId: nodeId10['nodeId'],
            name: nodeId10['name'],
            ids: ids4['map']((value104) => value104['nodeId']),
            names: ids4['map']((error4) => error4['name']),
            renamed: ids4,
          }
        );
      },
    }),
    value89['register']({
      id: 'node.duplicate',
      description: 'Duplicate canvas nodes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          nodeId: { type: 'string' },
          ids: { type: 'array', items: { type: 'string' } },
          copies: { type: 'integer', minimum: 1, maximum: 12 },
          dx: { type: 'number' },
          dy: { type: 'number' },
          placement: { type: 'string', enum: ['offset', 'spawn-preferences'] },
          edgePolicy: { type: 'string', enum: ['internal', 'all-touching'] },
        },
        defaults: { copies: 1, dx: 40, dy: 40, placement: 'offset', edgePolicy: 'internal' },
        selectionFallback: true,
      },
      capabilitySchema: {
        reads: ['nodes', 'edges', 'selection'],
        writes: ['nodes', 'edges', 'selection'],
        selectionFallback: true,
      },
      returnSchema: { aliasFields: ['ids', 'sourceIds'] },
      validate(placement2 = {}, value105 = {}) {
        const response3 = validateNodeIds(placement2, value105, { min: 1, allowSelection: true });
        if (response3['ok'] === false) return response3;
        const copies = Number(placement2['copies'] ?? 1);
        if (!Number['isInteger'](copies) || copies < 1 || copies > 12)
          return {
            ok: false,
            errorCode: 'INVALID_DUPLICATE_COPIES',
            message: 'node.duplicate copies must be an integer between 1 and 12.',
          };
        return {
          args: {
            ...response3['args'],
            copies: copies,
            placement: placement2['placement'] === 'spawn-preferences' ? 'spawn-preferences' : 'offset',
          },
        };
      },
      execute(sourceNodes, store12) {
        const nodes4 = getState(store12),
          store13 = getStore(store12),
          copies2 = Math['max'](1, Math['min'](12, Math['trunc'](Number(sourceNodes['copies'] || 1)))),
          dx2 = toFiniteNumber(sourceNodes['dx'], 40),
          dy2 = toFiniteNumber(sourceNodes['dy'], 40),
          value106 =
            sourceNodes['placement'] === 'spawn-preferences'
              ? createDuplicateSpawnOffsets({
                  nodes: nodes4['nodes'] || {},
                  sourceNodes: sourceNodes['ids']
                    ['map']((value107) => nodes4['nodes']?.[value107])
                    ['filter'](Boolean),
                  copies: copies2,
                })
              : [],
          value108 =
            String(sourceNodes['edgePolicy'] || 'internal') === 'all-touching' ? 'all-touching' : 'internal',
          value109 = Object['values'](nodes4['edges'] || {})['map']((value110) => clonePlain(value110)),
          idMaps = [],
          ids5 = [],
          edgeIds = [],
          handler2 = () => {
            for (let value111 = 1; value111 <= copies2; value111 += 1) {
              const value112 = value106[value111 - 1] || {
                  dx: dx2 * value111,
                  dy: dy2 * value111,
                },
                map7 = new Map();
              for (const value113 of sourceNodes['ids']) {
                const box9 = nodes4['nodes']?.[value113];
                if (!box9) continue;
                const id3 = generateId(String(box9['type'] || 'node'));
                map7['set'](value113, id3);
                const value114 = {
                  ...clonePlain(box9),
                  id: id3,
                  x: toFiniteNumber(box9['x']) + value112['dx'],
                  y: toFiniteNumber(box9['y']) + value112['dy'],
                  _bizRev: undefined,
                };
                (delete value114['_bizRev'],
                  stripImageGenerationRuntimeState(value114),
                  store13?.['addNode']?.(value114),
                  ids5['push'](id3));
              }
              idMaps['push'](map7);
              for (const args13 of value109) {
                const sourceId4 = map7['has'](args13?.['sourceId']),
                  targetId3 = map7['has'](args13?.['targetId']),
                  enabled14 = value108 === 'all-touching' ? sourceId4 || targetId3 : sourceId4 && targetId3;
                if (!enabled14) continue;
                edgeIds['push']({
                  ...args13,
                  id: generateId('edge'),
                  sourceId: sourceId4 ? map7['get'](args13['sourceId']) : args13['sourceId'],
                  targetId: targetId3 ? map7['get'](args13['targetId']) : args13['targetId'],
                });
              }
            }
            (edgeIds['length'] > 0 &&
              (typeof store13?.['updateEdgesBatch'] === 'function'
                ? store13['updateEdgesBatch']([], edgeIds)
                : edgeIds['forEach']((value115) => store13?.['addEdge']?.(value115))),
              store13?.['setSelectedNodes']?.(ids5));
          };
        if (typeof store13?.['batch'] === 'function') store13['batch'](handler2);
        else handler2();
        return (
          store12['commit']?.(),
          {
            ids: ids5,
            sourceIds: sourceNodes['ids'],
            copies: copies2,
            idMap: Object['fromEntries'](idMaps[0] || []),
            idMaps: idMaps['map']((value116) => Object['fromEntries'](value116)),
            edgeIds: edgeIds['map']((value117) => value117['id']),
          }
        );
      },
    }),
    value89['register']({
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
      validate(includeData2 = {}, value118 = {}) {
        const nodeId11 = String(includeData2['nodeId'] || '')['trim']();
        if (!nodeId11)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.getSummary requires nodeId.' };
        if (!getNode(value118, nodeId11))
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + nodeId11 };
        return { args: { nodeId: nodeId11, includeData: includeData2['includeData'] === true } };
      },
      execute(includeData3, value119) {
        return buildNodeSummary(value119, includeData3['nodeId'], { includeData: includeData3['includeData'] });
      },
    }),
    value89['register']({
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
      validate(type6 = {}, value120 = {}) {
        const edgeId2 = normalizeEdgeArgs(type6);
        if (!edgeId2['sourceId'] || !edgeId2['targetId'])
          return {
            ok: false,
            errorCode: 'MISSING_EDGE_ENDPOINTS',
            message: 'graph.connect requires sourceId and targetId.',
          };
        if (edgeId2['sourceId'] === edgeId2['targetId'])
          return {
            ok: false,
            errorCode: 'INVALID_EDGE_ENDPOINTS',
            message: 'graph.connect cannot connect a node to itself.',
          };
        if (!getNode(value120, edgeId2['sourceId']))
          return {
            ok: false,
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + edgeId2['sourceId'],
          };
        if (!getNode(value120, edgeId2['targetId']))
          return {
            ok: false,
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + edgeId2['targetId'],
          };
        return {
          args: {
            ...edgeId2,
            edgeId: edgeId2['edgeId'] || generateId('edge'),
            type: type6['type'] ?? null,
          },
        };
      },
      execute(id4, store14) {
        const edgeId3 = findEdgesByEndpoints(store14, id4)[0];
        if (edgeId3) return { edgeId: edgeId3['id'], edge: edgeId3, reused: true };
        const edgeId4 = {
          id: id4['edgeId'],
          sourceId: id4['sourceId'],
          targetId: id4['targetId'],
          type: id4['type'],
        };
        if (id4['refSlot']) edgeId4['refSlot'] = id4['refSlot'];
        return (
          getStore(store14)?.['addEdge']?.(edgeId4),
          store14['commit']?.(),
          { edgeId: edgeId4['id'], edge: edgeId4, reused: false }
        );
      },
    }),
    value89['register']({
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
      validate(options15 = {}, value121 = {}) {
        const edgeArgs = normalizeEdgeArgs(options15),
          enabled15 =
            Object['prototype']['hasOwnProperty']['call'](options15, 'refSlot') ||
            Object['prototype']['hasOwnProperty']['call'](options15, 'slot') ||
            Object['prototype']['hasOwnProperty']['call'](options15, 'inputSlot');
        if (!enabled15)
          return {
            ok: false,
            errorCode: 'MISSING_REF_SLOT',
            message: 'node.setInputSlot requires refSlot, slot, or inputSlot.',
          };
        const refSlot2 = String(options15['refSlot'] ?? options15['slot'] ?? options15['inputSlot'] ?? '')[
          'trim'
        ]();
        let edges2 = null;
        if (edgeArgs['edgeId']) {
          edges2 = getEdges(value121)[edgeArgs['edgeId']] || null;
          if (!edges2)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'Canvas edge not found: ' + edgeArgs['edgeId'],
            };
        } else {
          if (!edgeArgs['sourceId'] || !edgeArgs['targetId'])
            return {
              ok: false,
              errorCode: 'MISSING_EDGE_SELECTOR',
              message: 'node.setInputSlot requires edgeId or sourceId/targetId.',
            };
          edges2 = findEdgesByEndpoints(value121, edgeArgs)[0] || null;
          if (!edges2)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'No canvas edge matched node.setInputSlot.',
            };
        }
        return { args: { edgeId: String(edges2['id'] || ''), refSlot: refSlot2 } };
      },
      execute(edgeId5, store15) {
        const args14 = getEdges(store15)[edgeId5['edgeId']];
        if (!args14)
          throw createCanvasCommandError('EDGE_NOT_FOUND', 'Canvas edge not found: ' + edgeId5['edgeId'], {
            edgeId: edgeId5['edgeId'],
          });
        const edge = { ...args14 };
        if (edgeId5['refSlot']) edge['refSlot'] = edgeId5['refSlot'];
        else delete edge['refSlot'];
        const store16 = getStore(store15);
        return (
          typeof store16?.['updateEdgesBatch'] === 'function'
            ? store16['updateEdgesBatch']([edgeId5['edgeId']], [edge])
            : (store16?.['removeEdge']?.(edgeId5['edgeId']), store16?.['addEdge']?.(edge)),
          store15['commit']?.(),
          { edgeId: edgeId5['edgeId'], refSlot: edgeId5['refSlot'], edge: edge }
        );
      },
    }),
    value89['register']({
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
      validate(options16 = {}, value122 = {}) {
        const edgeArgs2 = normalizeEdgeArgs(options16);
        if (edgeArgs2['edgeId']) {
          const edges3 = getEdges(value122)[edgeArgs2['edgeId']];
          if (!edges3)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'Canvas edge not found: ' + edgeArgs2['edgeId'],
            };
          return { args: { edgeIds: [edgeArgs2['edgeId']] } };
        }
        if (!edgeArgs2['sourceId'] && !edgeArgs2['targetId'])
          return {
            ok: false,
            errorCode: 'MISSING_EDGE_SELECTOR',
            message: 'graph.disconnect requires edgeId or endpoint selectors.',
          };
        const edgeIds2 = findEdgesByEndpoints(value122, edgeArgs2);
        if (edgeIds2['length'] === 0)
          return {
            ok: false,
            errorCode: 'EDGE_NOT_FOUND',
            message: 'No canvas edge matched graph.disconnect.',
          };
        return { args: { edgeIds: edgeIds2['map']((value123) => value123['id']) } };
      },
      execute(edgeIds3, store17) {
        const store18 = getStore(store17);
        for (const value124 of edgeIds3['edgeIds']) store18?.['removeEdge']?.(value124);
        return (store17['commit']?.(), { edgeIds: edgeIds3['edgeIds'] });
      },
    }),
    value89['register']({
      id: 'graph.getCanvasSummary',
      description: 'Get a safe canvas summary.',
      riskLevel: 'safe',
      argsSchema: {},
      capabilitySchema: { reads: ['nodes', 'edges', 'selection', 'viewport'], writes: [] },
      returnSchema: { aliasFields: ['selectedNodeIds', 'nodes', 'edges', 'nodeCount', 'edgeCount'] },
      execute(value125, value126) {
        return buildCanvasSummary(value126);
      },
    }));
}
export { buildCanvasSummary, buildNodeSummary, normalizeNodeIds };
