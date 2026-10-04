import {
  AI_GENERATION_NODE_SHORT_SIDE,
  SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
} from '../../services/mediaSizingPolicy.js';
import { createCanvasCommandError } from './commandRegistry.js';
const VIDEO_NODE_TYPES = Object['freeze'](['source-video', 'ai-video', 'video']),
  AUDIO_NODE_TYPES = Object['freeze'](['source-audio', 'ai-audio', 'audio']),
  IMAGE_NODE_TYPES = Object['freeze'](['source-image', 'ai-image', 'image']),
  RESETTABLE_MEDIA_NODE_TYPES = Object['freeze'](['source-image', 'source-video', 'ai-image', 'ai-video']),
  DEFAULT_NODE_SIZES = Object['freeze']({
    'source-image': Object['freeze']({ width: 0x200, height: 0x120 }),
    'source-video': Object['freeze']({ width: 0x200, height: 0x120 }),
  });
function getState(value) {
  return value['store']?.['getStateRaw']?.() || value['store']?.['getState']?.() || {};
}
function getStore(item) {
  return item['graphStore'] || item['store'];
}
function getNode(key, index) {
  const result = String(index || '')['trim']();
  return result ? getState(key)['nodes']?.[result] || null : null;
}
function getSelectedNodeIds(data) {
  const list = getState(data)['selectedNodeIds'];
  return Array['isArray'](list)
    ? list['map']((options) => String(options || '')['trim']())['filter'](Boolean)
    : [];
}
function isNodeType(target, source) {
  const next = String(target?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    list2 = Array['isArray'](source) ? source : [source];
  return list2['some'](
    (current) =>
      String(current || '')
        ['trim']()
        ['toLowerCase']() === next,
  );
}
function normalizeNodeIdForTypes(
  options2 = {},
  entry = {},
  { commandId: commandId, types: types, label: label } = {},
) {
  const record = String(options2['nodeId'] || '')['trim'](),
    payload = record
      ? []
      : getSelectedNodeIds(entry)['filter']((handle) => isNodeType(getNode(entry, handle), types)),
    nodeId = record || payload[0x0] || '';
  if (!nodeId)
    throw createCanvasCommandError(
      'MISSING_NODE_ID',
      commandId + '\x20requires\x20a\x20' + (label || 'media') + '\x20nodeId.',
    );
  const nodeType = getNode(entry, nodeId);
  if (!nodeType)
    throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + nodeId, {
      nodeId: nodeId,
    });
  if (!isNodeType(nodeType, types))
    throw createCanvasCommandError(
      'UNSUPPORTED_NODE_TYPE',
      commandId + ' does not support node type: ' + (nodeType['type'] || '(unknown)'),
      { nodeId: nodeId, nodeType: nodeType['type'], supportedTypes: [...types] },
    );
  return { nodeId: nodeId, node: nodeType };
}
function getMediaTools(state) {
  return state['mediaTools'] && typeof state['mediaTools'] === 'object' ? state['mediaTools'] : {};
}
function requireMediaTool(config, tool, scope) {
  const mediaTools = getMediaTools(config)[tool];
  if (typeof mediaTools !== 'function')
    throw createCanvasCommandError('MEDIA_TOOL_UNAVAILABLE', scope + ' requires mediaTools.' + tool + '.', {
      tool: tool,
    });
  return mediaTools;
}
function assertToolResult(error, input, output = 'Media tool did not return a result.') {
  if (!error || error['ok'] === ![])
    throw createCanvasCommandError(
      'MEDIA_TOOL_NO_RESULT',
      error?.['message'] || error?.['reason'] || output,
      error || null,
    );
  return error;
}
function normalizePositiveInt(value2, value3, { min: min = 0x1, max: max = 0xc } = {}) {
  const value4 = Number(value2),
    value5 = Number['isFinite'](value4) ? Math['trunc'](value4) : value3;
  return Math['max'](min, Math['min'](max, value5));
}
function asPositiveNumber(value6) {
  const count = Number(value6);
  return Number['isFinite'](count) && count > 0x0 ? count : 0x0;
}
function getDefaultNodeSize(value7) {
  return DEFAULT_NODE_SIZES[String(value7 || '')['trim']()] || { width: 0x140, height: 0xb4 };
}
function getAutoSizeByShortSide(value8, value9, value10 = SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE) {
  const value11 = Math['max'](0x1, Number(value8) || 0x1),
    value12 = Math['max'](0x1, Number(value9) || 0x1),
    value13 = Math['max'](0x1, Number(value10) || SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE),
    value14 = value13 / Math['min'](value11, value12);
  return {
    width: Math['max'](0x1, Math['round'](value11 * value14)),
    height: Math['max'](0x1, Math['round'](value12 * value14)),
  };
}
function getDefaultAIGenerationNodeSize(value15, value16) {
  const count2 = Number(value15) || 0x0,
    count3 = Number(value16) || 0x0;
  if (count2 > 0x0 && count3 > 0x0)
    return getAutoSizeByShortSide(count2, count3, AI_GENERATION_NODE_SHORT_SIDE);
  return { width: AI_GENERATION_NODE_SHORT_SIDE, height: AI_GENERATION_NODE_SHORT_SIDE };
}
function pickMainResultItem(list3, value17) {
  if (!Array['isArray'](list3) || list3['length'] === 0x0) return null;
  const value18 = Number(value17),
    value19 = Number['isFinite'](value18) ? Math['max'](0x0, Math['trunc'](value18)) : 0x0;
  return list3[value19] || list3[0x0] || null;
}
function parseAspectRatio(value20 = '') {
  const enabled = String(value20 || '')['trim']();
  if (!enabled) return { w: 0x0, h: 0x0 };
  const enabled2 = enabled['match'](/(\d+(?:\.\d+)?)\s*[:：xX/]\s*(\d+(?:\.\d+)?)/);
  if (!enabled2) return { w: 0x0, h: 0x0 };
  return { w: asPositiveNumber(enabled2[0x1]), h: asPositiveNumber(enabled2[0x2]) };
}
function resolveMediaResultSize(box) {
  if (!box || typeof box !== 'object') return { w: 0x0, h: 0x0 };
  if (isNodeType(box, 'source-image'))
    return { w: asPositiveNumber(box['imageWidth']), h: asPositiveNumber(box['imageHeight']) };
  if (isNodeType(box, 'source-video'))
    return {
      w: asPositiveNumber(box['selectedVideoWidth']) || asPositiveNumber(box['videoWidth']),
      h: asPositiveNumber(box['selectedVideoHeight']) || asPositiveNumber(box['videoHeight']),
    };
  if (isNodeType(box, 'ai-image')) {
    const box2 = pickMainResultItem(box['images'], box['mainImageIndex']);
    let w =
        asPositiveNumber(box2?.['imageWidth']) ||
        asPositiveNumber(box2?.['width']) ||
        asPositiveNumber(box['imageWidth']),
      h =
        asPositiveNumber(box2?.['imageHeight']) ||
        asPositiveNumber(box2?.['height']) ||
        asPositiveNumber(box['imageHeight']);
    if (!(w > 0x0 && h > 0x0)) {
      const aspectRatio = parseAspectRatio(box['aspectRatio']);
      ((w = aspectRatio['w']), (h = aspectRatio['h']));
    }
    return (
      !(w > 0x0 && h > 0x0) && ((w = asPositiveNumber(box['width'])), (h = asPositiveNumber(box['height']))),
      { w: w, h: h }
    );
  }
  if (isNodeType(box, 'ai-video')) {
    const mainResultItem = pickMainResultItem(box['videos'], box['mainVideoIndex']);
    let w2 =
        asPositiveNumber(box['selectedVideoWidth']) ||
        asPositiveNumber(mainResultItem?.['videoWidth']) ||
        asPositiveNumber(box['videoWidth']),
      h2 =
        asPositiveNumber(box['selectedVideoHeight']) ||
        asPositiveNumber(mainResultItem?.['videoHeight']) ||
        asPositiveNumber(box['videoHeight']);
    if (!(w2 > 0x0 && h2 > 0x0)) {
      const aspectRatio2 = parseAspectRatio(box['aspectRatio']);
      ((w2 = aspectRatio2['w']), (h2 = aspectRatio2['h']));
    }
    return (
      !(w2 > 0x0 && h2 > 0x0) &&
        ((w2 = asPositiveNumber(box['width'])), (h2 = asPositiveNumber(box['height']))),
      { w: w2, h: h2 }
    );
  }
  return { w: 0x0, h: 0x0 };
}
function resolveMediaResetSize(enabled3, value21 = {}) {
  const run = value21['getNodeDefaultSize'] || getDefaultNodeSize,
    handler = value21['getAIGenerationNodeSize'] || getDefaultAIGenerationNodeSize;
  if (!enabled3 || typeof enabled3 !== 'object') return run('source-image');
  const { w: w3, h: h3 } = resolveMediaResultSize(enabled3);
  if (w3 > 0x0 && h3 > 0x0) {
    if (isNodeType(enabled3, ['ai-image', 'ai-video'])) return handler(w3, h3);
    return getAutoSizeByShortSide(w3, h3);
  }
  if (isNodeType(enabled3, ['ai-image', 'ai-video'])) return handler();
  if (isNodeType(enabled3, 'source-video')) return run('source-video');
  if (isNodeType(enabled3, 'source-image')) return run('source-image');
  return run('source-image');
}
function normalizeResetIds(options3 = {}, value22 = {}) {
  const enabled4 = !!String(options3['nodeId'] || '')['trim'](),
    value23 =
      Array['isArray'](options3['ids']) && options3['ids']['length'] > 0x0
        ? options3['ids']
        : options3['nodeId']
          ? [options3['nodeId']]
          : getSelectedNodeIds(value22),
    list4 = [],
    map = new Set();
  for (const value24 of value23) {
    const nodeId2 = String(value24 || '')['trim']();
    if (!nodeId2 || map['has'](nodeId2)) continue;
    const nodeType2 = getNode(value22, nodeId2);
    if (!nodeType2) {
      if (!enabled4) continue;
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + nodeId2, {
        nodeId: nodeId2,
      });
    }
    if (!isNodeType(nodeType2, RESETTABLE_MEDIA_NODE_TYPES)) {
      if (!enabled4) continue;
      throw createCanvasCommandError(
        'UNSUPPORTED_NODE_TYPE',
        'media.resetSize does not support node type: ' + (nodeType2['type'] || '(unknown)'),
        { nodeId: nodeId2, nodeType: nodeType2['type'] },
      );
    }
    (list4['push'](nodeId2), map['add'](nodeId2));
  }
  if (list4['length'] === 0x0)
    throw createCanvasCommandError(
      'MISSING_NODE_ID',
      'media.resetSize\x20requires\x20ids,\x20nodeId,\x20or\x20selected\x20media\x20nodes.',
    );
  return list4;
}
function registerSingleRunnerCommand(
  value25,
  {
    id: id,
    description: description,
    types: types2,
    label: label2,
    toolName: toolName,
    resultMapper: resultMapper,
    writes: writes = ['nodes'],
  },
) {
  value25['register']({
    id: id,
    description: description,
    riskLevel: 'confirm',
    argsSchema: { required: ['nodeId'], properties: { nodeId: { type: 'string' } }, selectionFallback: !![] },
    capabilitySchema: {
      reads: ['nodes'],
      writes: writes,
      selectionFallback: !![],
      requiresMountedRuntime: ![],
    },
    returnSchema: { aliasFields: ['nodeId', 'nodeIds', 'value'] },
    validate(options4 = {}, value26 = {}) {
      const nodeId3 = normalizeNodeIdForTypes(options4, value26, {
        commandId: id,
        types: types2,
        label: label2,
      });
      return { args: { nodeId: nodeId3['nodeId'] } };
    },
    async execute(value27, value28) {
      const run2 = requireMediaTool(value28, toolName, id),
        assertToolResult2 = assertToolResult(await run2(value27['nodeId']), id);
      return resultMapper(value27['nodeId'], assertToolResult2);
    },
  });
}
export function registerMediaToolCommands(value29) {
  (registerSingleRunnerCommand(value29, {
    id: 'video.reverse',
    description: 'Reverse a video node into a new source video node.',
    types: VIDEO_NODE_TYPES,
    label: 'video',
    toolName: 'runVideoReverseFromNode',
    resultMapper: (nodeId4, value30) => ({
      nodeId: nodeId4,
      nodeIds: [String(value30['videoId'] || '')]['filter'](Boolean),
      videoId: String(value30['videoId'] || ''),
      value: value30,
    }),
  }),
    value29['register']({
      id: 'video.extractKeyframes',
      description: 'Extract\x20keyframes\x20from\x20a\x20video\x20node\x20into\x20source\x20image\x20nodes.',
      riskLevel: 'confirm',
      argsSchema: {
        required: ['nodeId'],
        properties: { nodeId: { type: 'string' }, options: { type: 'object' } },
        defaults: { options: {} },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes'],
        writes: ['nodes'],
        selectionFallback: !![],
        requiresMountedRuntime: ![],
      },
      returnSchema: { aliasFields: ['nodeId', 'nodeIds', 'value'] },
      validate(options5 = {}, value31 = {}) {
        const nodeId5 = normalizeNodeIdForTypes(options5, value31, {
          commandId: 'video.extractKeyframes',
          types: VIDEO_NODE_TYPES,
          label: 'video',
        });
        return {
          args: {
            nodeId: nodeId5['nodeId'],
            options:
              options5['options'] &&
              typeof options5['options'] === 'object' &&
              !Array['isArray'](options5['options'])
                ? options5['options']
                : {},
          },
        };
      },
      async execute(nodeId6, value32) {
        const run3 = requireMediaTool(
            value32,
            'runSmartClipKeyframeExtractionFromVideoNode',
            'video.extractKeyframes',
          ),
          value33 = assertToolResult(
            await run3({ nodeId: nodeId6['nodeId'], options: nodeId6['options'] }),
            'video.extractKeyframes',
            'No keyframes were extracted.',
          ),
          nodeIds = Array['isArray'](value33['nodeIds'])
            ? value33['nodeIds']['map']((value34) => String(value34 || '')['trim']())['filter'](Boolean)
            : [];
        if (nodeIds['length'] === 0x0)
          throw createCanvasCommandError('MEDIA_TOOL_NO_RESULT', 'No keyframe nodes were created.', value33);
        return { nodeId: nodeId6['nodeId'], nodeIds: nodeIds, value: value33 };
      },
    }),
    registerSingleRunnerCommand(value29, {
      id: 'video.separateAv',
      description: 'Separate a video node into muted video and audio source nodes.',
      types: VIDEO_NODE_TYPES,
      label: 'video',
      toolName: 'runVideoAudioSeparationFromNode',
      resultMapper: (nodeId7, value35) => {
        const videoId = String(value35['videoId'] || ''),
          audioId = String(value35['audioId'] || '');
        return {
          nodeId: nodeId7,
          nodeIds: [videoId, audioId]['filter'](Boolean),
          videoId: videoId,
          audioId: audioId,
          value: value35,
        };
      },
    }),
    registerSingleRunnerCommand(value29, {
      id: 'audio.separate',
      description: 'Separate an audio node into vocals and background audio nodes.',
      types: AUDIO_NODE_TYPES,
      label: 'audio',
      toolName: 'runAudioSeparationFromNode',
      resultMapper: (nodeId8, value36) => {
        const leaderId = String(value36['leaderId'] || ''),
          peerId = String(value36['peerId'] || '');
        return {
          nodeId: nodeId8,
          nodeIds: [leaderId, peerId]['filter'](Boolean),
          leaderId: leaderId,
          peerId: peerId,
          value: value36,
        };
      },
    }),
    value29['register']({
      id: 'image.splitGrid',
      description: 'Split an image node into a grid of source image nodes.',
      riskLevel: 'confirm',
      argsSchema: {
        required: ['nodeId'],
        properties: { nodeId: { type: 'string' }, cols: { type: 'number' }, rows: { type: 'number' } },
        defaults: { cols: 0x2, rows: 0x2 },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes'],
        writes: ['nodes'],
        selectionFallback: !![],
        requiresMountedRuntime: ![],
      },
      returnSchema: { aliasFields: ['nodeId', 'nodeIds', 'cols', 'rows', 'value'] },
      validate(options6 = {}, value37 = {}) {
        const nodeId9 = normalizeNodeIdForTypes(options6, value37, {
          commandId: 'image.splitGrid',
          types: IMAGE_NODE_TYPES,
          label: 'image',
        });
        return {
          args: {
            nodeId: nodeId9['nodeId'],
            cols: normalizePositiveInt(options6['cols'], 0x2),
            rows: normalizePositiveInt(options6['rows'], 0x2),
          },
        };
      },
      async execute(cols, value38) {
        const run4 = requireMediaTool(value38, 'executeGridCrop', 'image.splitGrid'),
          nodeData = getNode(value38, cols['nodeId']),
          value39 = assertToolResult(
            await run4({ nodeData: nodeData, cols: cols['cols'], rows: cols['rows'] }),
            'image.splitGrid',
            'No image grid nodes were created.',
          ),
          nodeIds2 = Array['isArray'](value39['newIds'])
            ? value39['newIds']['map']((value40) => String(value40 || '')['trim']())['filter'](Boolean)
            : [];
        if (nodeIds2['length'] === 0x0)
          throw createCanvasCommandError(
            'MEDIA_TOOL_NO_RESULT',
            'No image grid nodes were created.',
            value39,
          );
        return {
          nodeId: cols['nodeId'],
          nodeIds: nodeIds2,
          cols: cols['cols'],
          rows: cols['rows'],
          value: value39,
        };
      },
    }),
    value29['register']({
      id: 'media.resetSize',
      description: 'Reset selected image or video media nodes to their source aspect size.',
      riskLevel: 'safe',
      argsSchema: {
        properties: { nodeId: { type: 'string' }, ids: { type: 'array' } },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes', 'selection'],
        writes: ['nodes'],
        selectionFallback: !![],
        requiresMountedRuntime: ![],
      },
      returnSchema: { aliasFields: ['nodeIds', 'sizes'] },
      validate(options7 = {}, value41 = {}) {
        return { args: { ids: normalizeResetIds(options7, value41) } };
      },
      execute(args, store) {
        const store2 = getStore(store),
          sizes = {},
          handler2 = () => {
            args['ids']['forEach']((value42) => {
              const node = getNode(store, value42),
                box3 = resolveMediaResetSize(node, store),
                width2 = Math['max'](0x1, Math['round'](Number(box3['width']) || 0x1)),
                height2 = Math['max'](0x1, Math['round'](Number(box3['height']) || 0x1));
              ((sizes[value42] = { width: width2, height: height2 }),
                store2['updateNodeData'](value42, {
                  width: width2,
                  height: height2,
                  needsAutoResize: ![],
                }));
            });
          };
        return (
          typeof store2['batch'] === 'function' ? store2['batch'](handler2) : handler2(),
          store['commit']?.(),
          { nodeIds: [...args['ids']], sizes: sizes }
        );
      },
    }));
}
