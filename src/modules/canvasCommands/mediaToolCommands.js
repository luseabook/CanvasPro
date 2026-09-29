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
function getState(_0x4526ae) {
  return _0x4526ae['store']?.['getStateRaw']?.() || _0x4526ae['store']?.['getState']?.() || {};
}
function getStore(_0x2fb6d2) {
  return _0x2fb6d2['graphStore'] || _0x2fb6d2['store'];
}
function getNode(_0x37e149, _0xfca9fe) {
  const _0x2a91cd = String(_0xfca9fe || '')['trim']();
  return _0x2a91cd ? getState(_0x37e149)['nodes']?.[_0x2a91cd] || null : null;
}
function getSelectedNodeIds(_0x3ff3e7) {
  const _0x409ac5 = getState(_0x3ff3e7)['selectedNodeIds'];
  return Array['isArray'](_0x409ac5)
    ? _0x409ac5['map']((_0x4e368b) => String(_0x4e368b || '')['trim']())['filter'](Boolean)
    : [];
}
function isNodeType(_0x151daf, _0x583bb4) {
  const _0x448296 = String(_0x151daf?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x3a51f1 = Array['isArray'](_0x583bb4) ? _0x583bb4 : [_0x583bb4];
  return _0x3a51f1['some'](
    (_0x5a98f9) =>
      String(_0x5a98f9 || '')
        ['trim']()
        ['toLowerCase']() === _0x448296,
  );
}
function normalizeNodeIdForTypes(
  _0x237ae0 = {},
  _0x55c031 = {},
  { commandId: _0x5d53dc, types: _0x36bf84, label: _0x3dbdc9 } = {},
) {
  const _0x2daa8a = String(_0x237ae0['nodeId'] || '')['trim'](),
    _0x4c7f1b = _0x2daa8a
      ? []
      : getSelectedNodeIds(_0x55c031)['filter']((_0x4413f2) =>
          isNodeType(getNode(_0x55c031, _0x4413f2), _0x36bf84),
        ),
    _0x124ff3 = _0x2daa8a || _0x4c7f1b[0x0] || '';
  if (!_0x124ff3)
    throw createCanvasCommandError(
      'MISSING_NODE_ID',
      _0x5d53dc + '\x20requires\x20a\x20' + (_0x3dbdc9 || 'media') + '\x20nodeId.',
    );
  const _0x318714 = getNode(_0x55c031, _0x124ff3);
  if (!_0x318714)
    throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + _0x124ff3, {
      nodeId: _0x124ff3,
    });
  if (!isNodeType(_0x318714, _0x36bf84))
    throw createCanvasCommandError(
      'UNSUPPORTED_NODE_TYPE',
      _0x5d53dc + ' does not support node type: ' + (_0x318714['type'] || '(unknown)'),
      { nodeId: _0x124ff3, nodeType: _0x318714['type'], supportedTypes: [..._0x36bf84] },
    );
  return { nodeId: _0x124ff3, node: _0x318714 };
}
function getMediaTools(_0x499c7c) {
  return _0x499c7c['mediaTools'] && typeof _0x499c7c['mediaTools'] === 'object'
    ? _0x499c7c['mediaTools']
    : {};
}
function requireMediaTool(_0x3a6b89, _0x3609ac, _0x50f6c1) {
  const _0xc88aa6 = getMediaTools(_0x3a6b89)[_0x3609ac];
  if (typeof _0xc88aa6 !== 'function')
    throw createCanvasCommandError(
      'MEDIA_TOOL_UNAVAILABLE',
      _0x50f6c1 + ' requires mediaTools.' + _0x3609ac + '.',
      { tool: _0x3609ac },
    );
  return _0xc88aa6;
}
function assertToolResult(_0x1ed643, _0x4a38bb, _0x562de2 = 'Media tool did not return a result.') {
  if (!_0x1ed643 || _0x1ed643['ok'] === ![])
    throw createCanvasCommandError(
      'MEDIA_TOOL_NO_RESULT',
      _0x1ed643?.['message'] || _0x1ed643?.['reason'] || _0x562de2,
      _0x1ed643 || null,
    );
  return _0x1ed643;
}
function normalizePositiveInt(_0x952d49, _0x349a91, { min: min = 0x1, max: max = 0xc } = {}) {
  const _0x573c36 = Number(_0x952d49),
    _0x2958b9 = Number['isFinite'](_0x573c36) ? Math['trunc'](_0x573c36) : _0x349a91;
  return Math['max'](min, Math['min'](max, _0x2958b9));
}
function asPositiveNumber(_0xb46e66) {
  const _0x30421a = Number(_0xb46e66);
  return Number['isFinite'](_0x30421a) && _0x30421a > 0x0 ? _0x30421a : 0x0;
}
function getDefaultNodeSize(_0x4db123) {
  return DEFAULT_NODE_SIZES[String(_0x4db123 || '')['trim']()] || { width: 0x140, height: 0xb4 };
}
function getAutoSizeByShortSide(_0xba48da, _0x318301, _0x340316 = SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE) {
  const _0x3602c1 = Math['max'](0x1, Number(_0xba48da) || 0x1),
    _0x109e34 = Math['max'](0x1, Number(_0x318301) || 0x1),
    _0x29fc89 = Math['max'](0x1, Number(_0x340316) || SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE),
    _0x310a65 = _0x29fc89 / Math['min'](_0x3602c1, _0x109e34);
  return {
    width: Math['max'](0x1, Math['round'](_0x3602c1 * _0x310a65)),
    height: Math['max'](0x1, Math['round'](_0x109e34 * _0x310a65)),
  };
}
function getDefaultAIGenerationNodeSize(_0x3a0d0d, _0x262005) {
  const _0x2c8646 = Number(_0x3a0d0d) || 0x0,
    _0xfdf868 = Number(_0x262005) || 0x0;
  if (_0x2c8646 > 0x0 && _0xfdf868 > 0x0)
    return getAutoSizeByShortSide(_0x2c8646, _0xfdf868, AI_GENERATION_NODE_SHORT_SIDE);
  return { width: AI_GENERATION_NODE_SHORT_SIDE, height: AI_GENERATION_NODE_SHORT_SIDE };
}
function pickMainResultItem(_0x52cea9, _0x43f7c0) {
  if (!Array['isArray'](_0x52cea9) || _0x52cea9['length'] === 0x0) return null;
  const _0x437384 = Number(_0x43f7c0),
    _0x3c0369 = Number['isFinite'](_0x437384) ? Math['max'](0x0, Math['trunc'](_0x437384)) : 0x0;
  return _0x52cea9[_0x3c0369] || _0x52cea9[0x0] || null;
}
function parseAspectRatio(_0x4c095d = '') {
  const _0x4940d0 = String(_0x4c095d || '')['trim']();
  if (!_0x4940d0) return { w: 0x0, h: 0x0 };
  const _0x4143b1 = _0x4940d0['match'](/(\d+(?:\.\d+)?)\s*[:：xX/]\s*(\d+(?:\.\d+)?)/);
  if (!_0x4143b1) return { w: 0x0, h: 0x0 };
  return { w: asPositiveNumber(_0x4143b1[0x1]), h: asPositiveNumber(_0x4143b1[0x2]) };
}
function resolveMediaResultSize(_0x23f43f) {
  if (!_0x23f43f || typeof _0x23f43f !== 'object') return { w: 0x0, h: 0x0 };
  if (isNodeType(_0x23f43f, 'source-image'))
    return { w: asPositiveNumber(_0x23f43f['imageWidth']), h: asPositiveNumber(_0x23f43f['imageHeight']) };
  if (isNodeType(_0x23f43f, 'source-video'))
    return {
      w: asPositiveNumber(_0x23f43f['selectedVideoWidth']) || asPositiveNumber(_0x23f43f['videoWidth']),
      h: asPositiveNumber(_0x23f43f['selectedVideoHeight']) || asPositiveNumber(_0x23f43f['videoHeight']),
    };
  if (isNodeType(_0x23f43f, 'ai-image')) {
    const _0x582c3d = pickMainResultItem(_0x23f43f['images'], _0x23f43f['mainImageIndex']);
    let _0x5092f8 =
        asPositiveNumber(_0x582c3d?.['imageWidth']) ||
        asPositiveNumber(_0x582c3d?.['width']) ||
        asPositiveNumber(_0x23f43f['imageWidth']),
      _0x2c807d =
        asPositiveNumber(_0x582c3d?.['imageHeight']) ||
        asPositiveNumber(_0x582c3d?.['height']) ||
        asPositiveNumber(_0x23f43f['imageHeight']);
    if (!(_0x5092f8 > 0x0 && _0x2c807d > 0x0)) {
      const _0x433c6f = parseAspectRatio(_0x23f43f['aspectRatio']);
      ((_0x5092f8 = _0x433c6f['w']), (_0x2c807d = _0x433c6f['h']));
    }
    return (
      !(_0x5092f8 > 0x0 && _0x2c807d > 0x0) &&
        ((_0x5092f8 = asPositiveNumber(_0x23f43f['width'])),
        (_0x2c807d = asPositiveNumber(_0x23f43f['height']))),
      { w: _0x5092f8, h: _0x2c807d }
    );
  }
  if (isNodeType(_0x23f43f, 'ai-video')) {
    const _0x33a51d = pickMainResultItem(_0x23f43f['videos'], _0x23f43f['mainVideoIndex']);
    let _0x28d605 =
        asPositiveNumber(_0x23f43f['selectedVideoWidth']) ||
        asPositiveNumber(_0x33a51d?.['videoWidth']) ||
        asPositiveNumber(_0x23f43f['videoWidth']),
      _0x5e07c3 =
        asPositiveNumber(_0x23f43f['selectedVideoHeight']) ||
        asPositiveNumber(_0x33a51d?.['videoHeight']) ||
        asPositiveNumber(_0x23f43f['videoHeight']);
    if (!(_0x28d605 > 0x0 && _0x5e07c3 > 0x0)) {
      const _0xafdf57 = parseAspectRatio(_0x23f43f['aspectRatio']);
      ((_0x28d605 = _0xafdf57['w']), (_0x5e07c3 = _0xafdf57['h']));
    }
    return (
      !(_0x28d605 > 0x0 && _0x5e07c3 > 0x0) &&
        ((_0x28d605 = asPositiveNumber(_0x23f43f['width'])),
        (_0x5e07c3 = asPositiveNumber(_0x23f43f['height']))),
      { w: _0x28d605, h: _0x5e07c3 }
    );
  }
  return { w: 0x0, h: 0x0 };
}
function resolveMediaResetSize(_0x485ed6, _0x3520b8 = {}) {
  const _0xa5ff9e = _0x3520b8['getNodeDefaultSize'] || getDefaultNodeSize,
    _0x165c33 = _0x3520b8['getAIGenerationNodeSize'] || getDefaultAIGenerationNodeSize;
  if (!_0x485ed6 || typeof _0x485ed6 !== 'object') return _0xa5ff9e('source-image');
  const { w: _0x3662ae, h: _0xa23e56 } = resolveMediaResultSize(_0x485ed6);
  if (_0x3662ae > 0x0 && _0xa23e56 > 0x0) {
    if (isNodeType(_0x485ed6, ['ai-image', 'ai-video'])) return _0x165c33(_0x3662ae, _0xa23e56);
    return getAutoSizeByShortSide(_0x3662ae, _0xa23e56);
  }
  if (isNodeType(_0x485ed6, ['ai-image', 'ai-video'])) return _0x165c33();
  if (isNodeType(_0x485ed6, 'source-video')) return _0xa5ff9e('source-video');
  if (isNodeType(_0x485ed6, 'source-image')) return _0xa5ff9e('source-image');
  return _0xa5ff9e('source-image');
}
function normalizeResetIds(_0x8861e7 = {}, _0xb2c206 = {}) {
  const _0x259721 = !!String(_0x8861e7['nodeId'] || '')['trim'](),
    _0x27addb =
      Array['isArray'](_0x8861e7['ids']) && _0x8861e7['ids']['length'] > 0x0
        ? _0x8861e7['ids']
        : _0x8861e7['nodeId']
          ? [_0x8861e7['nodeId']]
          : getSelectedNodeIds(_0xb2c206),
    _0x4cadfd = [],
    _0x154768 = new Set();
  for (const _0x4b9542 of _0x27addb) {
    const _0x32f0f1 = String(_0x4b9542 || '')['trim']();
    if (!_0x32f0f1 || _0x154768['has'](_0x32f0f1)) continue;
    const _0x560667 = getNode(_0xb2c206, _0x32f0f1);
    if (!_0x560667) {
      if (!_0x259721) continue;
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + _0x32f0f1, {
        nodeId: _0x32f0f1,
      });
    }
    if (!isNodeType(_0x560667, RESETTABLE_MEDIA_NODE_TYPES)) {
      if (!_0x259721) continue;
      throw createCanvasCommandError(
        'UNSUPPORTED_NODE_TYPE',
        'media.resetSize does not support node type: ' + (_0x560667['type'] || '(unknown)'),
        { nodeId: _0x32f0f1, nodeType: _0x560667['type'] },
      );
    }
    (_0x4cadfd['push'](_0x32f0f1), _0x154768['add'](_0x32f0f1));
  }
  if (_0x4cadfd['length'] === 0x0)
    throw createCanvasCommandError(
      'MISSING_NODE_ID',
      'media.resetSize\x20requires\x20ids,\x20nodeId,\x20or\x20selected\x20media\x20nodes.',
    );
  return _0x4cadfd;
}
function registerSingleRunnerCommand(
  _0x522d72,
  {
    id: _0x1195b7,
    description: _0x512304,
    types: _0x28b0ad,
    label: _0x4017b3,
    toolName: _0x34c44d,
    resultMapper: _0x40bba0,
    writes: writes = ['nodes'],
  },
) {
  _0x522d72['register']({
    id: _0x1195b7,
    description: _0x512304,
    riskLevel: 'confirm',
    argsSchema: { required: ['nodeId'], properties: { nodeId: { type: 'string' } }, selectionFallback: !![] },
    capabilitySchema: {
      reads: ['nodes'],
      writes: writes,
      selectionFallback: !![],
      requiresMountedRuntime: ![],
    },
    returnSchema: { aliasFields: ['nodeId', 'nodeIds', 'value'] },
    validate(_0x680820 = {}, _0x18452d = {}) {
      const _0xe4415b = normalizeNodeIdForTypes(_0x680820, _0x18452d, {
        commandId: _0x1195b7,
        types: _0x28b0ad,
        label: _0x4017b3,
      });
      return { args: { nodeId: _0xe4415b['nodeId'] } };
    },
    async execute(_0x4f5689, _0x11a2e2) {
      const _0xe3a6cc = requireMediaTool(_0x11a2e2, _0x34c44d, _0x1195b7),
        _0x1bcfbd = assertToolResult(await _0xe3a6cc(_0x4f5689['nodeId']), _0x1195b7);
      return _0x40bba0(_0x4f5689['nodeId'], _0x1bcfbd);
    },
  });
}
export function registerMediaToolCommands(_0x107f1d) {
  (registerSingleRunnerCommand(_0x107f1d, {
    id: 'video.reverse',
    description: 'Reverse a video node into a new source video node.',
    types: VIDEO_NODE_TYPES,
    label: 'video',
    toolName: 'runVideoReverseFromNode',
    resultMapper: (_0x3b62e7, _0x169e73) => ({
      nodeId: _0x3b62e7,
      nodeIds: [String(_0x169e73['videoId'] || '')]['filter'](Boolean),
      videoId: String(_0x169e73['videoId'] || ''),
      value: _0x169e73,
    }),
  }),
    _0x107f1d['register']({
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
      validate(_0x446b1b = {}, _0x40d56f = {}) {
        const _0x5e3969 = normalizeNodeIdForTypes(_0x446b1b, _0x40d56f, {
          commandId: 'video.extractKeyframes',
          types: VIDEO_NODE_TYPES,
          label: 'video',
        });
        return {
          args: {
            nodeId: _0x5e3969['nodeId'],
            options:
              _0x446b1b['options'] &&
              typeof _0x446b1b['options'] === 'object' &&
              !Array['isArray'](_0x446b1b['options'])
                ? _0x446b1b['options']
                : {},
          },
        };
      },
      async execute(_0x5a994a, _0x54b9d4) {
        const _0x5199d9 = requireMediaTool(
            _0x54b9d4,
            'runSmartClipKeyframeExtractionFromVideoNode',
            'video.extractKeyframes',
          ),
          _0x549d47 = assertToolResult(
            await _0x5199d9({ nodeId: _0x5a994a['nodeId'], options: _0x5a994a['options'] }),
            'video.extractKeyframes',
            'No keyframes were extracted.',
          ),
          _0x522f66 = Array['isArray'](_0x549d47['nodeIds'])
            ? _0x549d47['nodeIds']['map']((_0x13bc4b) => String(_0x13bc4b || '')['trim']())['filter'](Boolean)
            : [];
        if (_0x522f66['length'] === 0x0)
          throw createCanvasCommandError(
            'MEDIA_TOOL_NO_RESULT',
            'No keyframe nodes were created.',
            _0x549d47,
          );
        return { nodeId: _0x5a994a['nodeId'], nodeIds: _0x522f66, value: _0x549d47 };
      },
    }),
    registerSingleRunnerCommand(_0x107f1d, {
      id: 'video.separateAv',
      description: 'Separate a video node into muted video and audio source nodes.',
      types: VIDEO_NODE_TYPES,
      label: 'video',
      toolName: 'runVideoAudioSeparationFromNode',
      resultMapper: (_0x1bfe98, _0x28aaa2) => {
        const _0x5e3ec1 = String(_0x28aaa2['videoId'] || ''),
          _0x2f81aa = String(_0x28aaa2['audioId'] || '');
        return {
          nodeId: _0x1bfe98,
          nodeIds: [_0x5e3ec1, _0x2f81aa]['filter'](Boolean),
          videoId: _0x5e3ec1,
          audioId: _0x2f81aa,
          value: _0x28aaa2,
        };
      },
    }),
    registerSingleRunnerCommand(_0x107f1d, {
      id: 'audio.separate',
      description: 'Separate an audio node into vocals and background audio nodes.',
      types: AUDIO_NODE_TYPES,
      label: 'audio',
      toolName: 'runAudioSeparationFromNode',
      resultMapper: (_0x23a75d, _0x2613c1) => {
        const _0x10237f = String(_0x2613c1['leaderId'] || ''),
          _0x2ef43c = String(_0x2613c1['peerId'] || '');
        return {
          nodeId: _0x23a75d,
          nodeIds: [_0x10237f, _0x2ef43c]['filter'](Boolean),
          leaderId: _0x10237f,
          peerId: _0x2ef43c,
          value: _0x2613c1,
        };
      },
    }),
    _0x107f1d['register']({
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
      validate(_0x540180 = {}, _0x3aeb81 = {}) {
        const _0x33623c = normalizeNodeIdForTypes(_0x540180, _0x3aeb81, {
          commandId: 'image.splitGrid',
          types: IMAGE_NODE_TYPES,
          label: 'image',
        });
        return {
          args: {
            nodeId: _0x33623c['nodeId'],
            cols: normalizePositiveInt(_0x540180['cols'], 0x2),
            rows: normalizePositiveInt(_0x540180['rows'], 0x2),
          },
        };
      },
      async execute(_0x28f672, _0x1fd171) {
        const _0x449abe = requireMediaTool(_0x1fd171, 'executeGridCrop', 'image.splitGrid'),
          _0x54db2d = getNode(_0x1fd171, _0x28f672['nodeId']),
          _0x10800b = assertToolResult(
            await _0x449abe({ nodeData: _0x54db2d, cols: _0x28f672['cols'], rows: _0x28f672['rows'] }),
            'image.splitGrid',
            'No image grid nodes were created.',
          ),
          _0x58e74f = Array['isArray'](_0x10800b['newIds'])
            ? _0x10800b['newIds']['map']((_0x256656) => String(_0x256656 || '')['trim']())['filter'](Boolean)
            : [];
        if (_0x58e74f['length'] === 0x0)
          throw createCanvasCommandError(
            'MEDIA_TOOL_NO_RESULT',
            'No image grid nodes were created.',
            _0x10800b,
          );
        return {
          nodeId: _0x28f672['nodeId'],
          nodeIds: _0x58e74f,
          cols: _0x28f672['cols'],
          rows: _0x28f672['rows'],
          value: _0x10800b,
        };
      },
    }),
    _0x107f1d['register']({
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
      validate(_0x1ede4a = {}, _0x34c7ac = {}) {
        return { args: { ids: normalizeResetIds(_0x1ede4a, _0x34c7ac) } };
      },
      execute(_0x576789, _0xb0871c) {
        const _0x1d77a6 = getStore(_0xb0871c),
          _0x2bc789 = {},
          _0x5099f1 = () => {
            _0x576789['ids']['forEach']((_0x275c53) => {
              const _0xeae9a4 = getNode(_0xb0871c, _0x275c53),
                _0x526ae6 = resolveMediaResetSize(_0xeae9a4, _0xb0871c),
                _0x385fc7 = Math['max'](0x1, Math['round'](Number(_0x526ae6['width']) || 0x1)),
                _0x3c461e = Math['max'](0x1, Math['round'](Number(_0x526ae6['height']) || 0x1));
              ((_0x2bc789[_0x275c53] = { width: _0x385fc7, height: _0x3c461e }),
                _0x1d77a6['updateNodeData'](_0x275c53, {
                  width: _0x385fc7,
                  height: _0x3c461e,
                  needsAutoResize: ![],
                }));
            });
          };
        return (
          typeof _0x1d77a6['batch'] === 'function' ? _0x1d77a6['batch'](_0x5099f1) : _0x5099f1(),
          _0xb0871c['commit']?.(),
          { nodeIds: [..._0x576789['ids']], sizes: _0x2bc789 }
        );
      },
    }));
}
