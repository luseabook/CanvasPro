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
function getState(_0x319c89) {
  return _0x319c89.store?.getStateRaw?.() || _0x319c89.store?.getState?.() || {};
}
function getStore(_0x204867) {
  return _0x204867.graphStore || _0x204867.store;
}
function clonePlain(_0x480975) {
  if (typeof structuredClone === 'function') return structuredClone(_0x480975);
  return JSON.parse(JSON.stringify(_0x480975));
}
function normalizeNodeType(_0xdc8991) {
  return String(_0xdc8991 || '').trim();
}
function toFinitePositiveNumber(_0x24aee4, _0x4ff600) {
  const _0x5ce00e = Number(_0x24aee4);
  return Number.isFinite(_0x5ce00e) && _0x5ce00e > 0 ? _0x5ce00e : _0x4ff600;
}
function toFiniteNumber(_0x324bae, _0xc571d7 = 0) {
  const _0x5480a4 = Number(_0x324bae);
  return Number.isFinite(_0x5480a4) ? _0x5480a4 : _0xc571d7;
}
function getNode(_0x49132a, _0x578745) {
  const _0x144217 = String(_0x578745 || '').trim();
  return _0x144217 ? getState(_0x49132a).nodes?.[_0x144217] || null : null;
}
function getNodes(_0x30d247) {
  return getState(_0x30d247).nodes || {};
}
function getEdges(_0x58bc6a) {
  return getState(_0x58bc6a).edges || {};
}
function getInitialText(_0x4ab811 = {}) {
  if (Object.prototype.hasOwnProperty.call(_0x4ab811, 'prompt')) return _0x4ab811.prompt;
  if (Object.prototype.hasOwnProperty.call(_0x4ab811, 'text')) return _0x4ab811.text;
  if (Object.prototype.hasOwnProperty.call(_0x4ab811, 'content')) return _0x4ab811.content;
  return undefined;
}
function truncateText(_0x1e7e02, _0x540e3b = 0x1f4) {
  const _0x296441 = String(_0x1e7e02 || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (_0x296441.length <= _0x540e3b) return _0x296441;
  return _0x296441.slice(0, Math.max(0, _0x540e3b - 3)) + '...';
}
function omitLargeMedia(_0x2e50e3, _0x582f28 = 0) {
  if (_0x2e50e3 == null) return _0x2e50e3;
  if (typeof _0x2e50e3 !== 'object') return _0x2e50e3;
  if (_0x582f28 > 2) return '[omitted]';
  if (Array.isArray(_0x2e50e3)) return '[array:' + _0x2e50e3.length + ']';
  const _0x2fdb56 = {};
  for (const [_0x2c0a9e, _0x193e16] of Object.entries(_0x2e50e3)) {
    if (MEDIA_PREVIEW_KEYS.has(_0x2c0a9e)) _0x2fdb56[_0x2c0a9e] = '[omitted]';
    else {
      if (typeof _0x193e16 === 'string' && _0x193e16.length > 0x1f4)
        _0x2fdb56[_0x2c0a9e] = _0x193e16.slice(0, 120) + '...';
      else
        _0x193e16 && typeof _0x193e16 === 'object'
          ? (_0x2fdb56[_0x2c0a9e] = omitLargeMedia(_0x193e16, _0x582f28 + 1))
          : (_0x2fdb56[_0x2c0a9e] = _0x193e16);
    }
  }
  return _0x2fdb56;
}
function normalizeNodeIds(
  _0x2969ce = {},
  _0xe02f7e = {},
  { min: min = 1, allowSelection: allowSelection = true } = {},
) {
  const _0x4bdb41 = getNodes(_0xe02f7e),
    _0x1e37b5 = getState(_0xe02f7e),
    _0x5a2801 =
      Array.isArray(_0x2969ce.ids) && _0x2969ce.ids.length > 0
        ? _0x2969ce.ids
        : _0x2969ce.nodeId
          ? [_0x2969ce.nodeId]
          : allowSelection
            ? _0x1e37b5.selectedNodeIds || []
            : [],
    _0x5da206 = [],
    _0x42e334 = new Set();
  for (const _0x4463e2 of _0x5a2801) {
    const _0x3b7b38 = String(_0x4463e2 || '').trim();
    if (!_0x3b7b38 || _0x42e334.has(_0x3b7b38)) continue;
    if (!_0x4bdb41[_0x3b7b38])
      throw createCanvasCommandError('NODE_NOT_FOUND', 'Canvas node not found: ' + _0x3b7b38, {
        nodeId: _0x3b7b38,
      });
    (_0x5da206.push(_0x3b7b38), _0x42e334.add(_0x3b7b38));
  }
  if (_0x5da206.length < min)
    throw createCanvasCommandError(
      'INSUFFICIENT_NODES',
      'At least ' + min + ' canvas node id(s) are required.',
    );
  return _0x5da206;
}
function normalizeEdgeId(_0xc1c79f) {
  return String(_0xc1c79f || '').trim();
}
function normalizeEdgeArgs(_0x393983 = {}) {
  return {
    edgeId: normalizeEdgeId(_0x393983.edgeId || _0x393983.id),
    sourceId: String(_0x393983.sourceId || _0x393983.source || '').trim(),
    targetId: String(_0x393983.targetId || _0x393983.target || '').trim(),
    refSlot: String(_0x393983.refSlot || _0x393983.slot || '').trim(),
  };
}
function findEdgesByEndpoints(
  _0x1c81a8,
  { sourceId: _0x2c88fe, targetId: _0x2d3817, refSlot: refSlot = '' },
) {
  return Object.values(getEdges(_0x1c81a8)).filter((_0x2c49f2) => {
    if (!_0x2c49f2) return false;
    if (_0x2c88fe && _0x2c49f2.sourceId !== _0x2c88fe) return false;
    if (_0x2d3817 && _0x2c49f2.targetId !== _0x2d3817) return false;
    if (refSlot && String(_0x2c49f2.refSlot || '') !== refSlot) return false;
    return true;
  });
}
function hasExplicitCreatePosition(_0x272665 = {}) {
  return Number['isFinite'](Number(_0x272665['x'])) && Number['isFinite'](Number(_0x272665['y']));
}
function resolveCreateSize(_0x106fdf, _0x43b010 = {}, _0x46ac6f = {}) {
  const _0x45e1e1 = DEFAULT_NODE_SIZES[_0x106fdf] || { width: 0x12c, height: 0x12c };
  let _0x889012 = null;
  if (PROMPT_NODE_TYPES.has(_0x106fdf) && typeof _0x46ac6f.getAIGenerationDefaultSizeByType === 'function')
    _0x889012 = _0x46ac6f.getAIGenerationDefaultSizeByType(_0x106fdf);
  else
    typeof _0x46ac6f.getNodeDefaultSize === 'function' &&
      (_0x889012 = _0x46ac6f.getNodeDefaultSize(_0x106fdf));
  const _0xf23c4b = _0x889012 && typeof _0x889012 === 'object' ? _0x889012 : _0x45e1e1;
  return {
    width: toFinitePositiveNumber(_0x43b010.width, toFinitePositiveNumber(_0xf23c4b.width, _0x45e1e1.width)),
    height: toFinitePositiveNumber(
      _0x43b010.height,
      toFinitePositiveNumber(_0xf23c4b.height, _0x45e1e1.height),
    ),
  };
}
function applyInitialNodeText(_0x4c2ac5, _0x201977, _0x5ce3c2) {
  const _0x4471ef = getInitialText(_0x201977);
  if (_0x4471ef === undefined || _0x4471ef === null) return _0x4c2ac5;
  const _0x355258 = String(_0x4c2ac5?.id || '').trim(),
    _0x1ee9e9 = String(_0x4c2ac5?.type || '').trim();
  if (!_0x355258) return _0x4c2ac5;
  let _0x4774f3 = null;
  if (PROMPT_NODE_TYPES.has(_0x1ee9e9))
    _0x4774f3 = { prompt: sanitizePromptHtmlForCommit(String(_0x4471ef)) };
  else
    (_0x1ee9e9 === 'source-text' || _0x1ee9e9 === 'comment-note') &&
      (_0x4774f3 = { content: String(_0x4471ef || '') });
  if (!_0x4774f3) return _0x4c2ac5;
  return (
    getStore(_0x5ce3c2)?.updateNodeData?.(_0x355258, _0x4774f3),
    _0x5ce3c2.commit?.(),
    getNode(_0x5ce3c2, _0x355258) || { ..._0x4c2ac5, ..._0x4774f3 }
  );
}
function isImageNodeType(_0x375721 = '') {
  const _0x2b5f94 = String(_0x375721 || '');
  return _0x2b5f94 === 'ai-image' || _0x2b5f94 === 'source-image';
}
function hasSelectedImageInput(_0x5f4feb = {}) {
  const _0x74b9e5 = getState(_0x5f4feb),
    _0x31b8a8 = Array.isArray(_0x74b9e5.selectedNodeIds) ? _0x74b9e5.selectedNodeIds : [];
  return _0x31b8a8.some((_0x1f350e) => isImageNodeType(_0x74b9e5.nodes?.[_0x1f350e]?.type));
}
function manifestAllowsImageInput(_0x11a1aa = {}) {
  const _0x1f536d =
      _0x11a1aa?.inputSlots && typeof _0x11a1aa.inputSlots === 'object' ? _0x11a1aa.inputSlots : {},
    _0x363df3 = Array.isArray(_0x1f536d.allowedKinds) ? _0x1f536d.allowedKinds : [];
  if (_0x363df3.includes('image')) return true;
  const _0x1c9fb8 = Number(_0x1f536d.maxByKind?.image);
  return Number.isFinite(_0x1c9fb8) && _0x1c9fb8 > 0;
}
function manifestAllowsTextInput(_0xf26e9f = {}) {
  const _0x3062b5 =
      _0xf26e9f?.inputSlots && typeof _0xf26e9f.inputSlots === 'object' ? _0xf26e9f.inputSlots : {},
    _0x1277cd = Array.isArray(_0x3062b5.allowedKinds) ? _0x3062b5.allowedKinds : [];
  return _0x1277cd.length === 0 || _0x1277cd.includes('text');
}
function manifestRequiresMissingMedia(_0x153914 = {}, { hasImageInput: hasImageInput = false } = {}) {
  const _0x13cd30 =
      _0x153914?.inputSlots && typeof _0x153914.inputSlots === 'object' ? _0x153914.inputSlots : {},
    _0xedf34d = _0x13cd30.minByKind || {};
  if (!hasImageInput && Number(_0xedf34d.image) > 0) return true;
  if (Number(_0xedf34d.video) > 0) return true;
  if (Number(_0xedf34d.audio) > 0) return true;
  const _0x48e4b5 = Array.isArray(_0x13cd30.fixedSlots) ? _0x13cd30.fixedSlots : [];
  return _0x48e4b5.some((_0x50227f) => {
    if (_0x50227f?.required !== true) return false;
    const _0x2b8fed = String(_0x50227f?.kind || '');
    if (_0x2b8fed === 'image') return !hasImageInput;
    return _0x2b8fed === 'video' || _0x2b8fed === 'audio';
  });
}
function getManifestFieldIds(_0x40f819 = {}) {
  return new Set(
    (Array.isArray(_0x40f819?.uiSchema?.fields) ? _0x40f819.uiSchema.fields : [])
      .map((_0x117fc3) => String(_0x117fc3?.id || '').trim())
      .filter(Boolean),
  );
}
function findAutoCreateModel(_0x547dea = {}, _0x3cb769 = '', _0x4596d8 = {}) {
  if (_0x3cb769 !== 'ai-video') return null;
  const _0x2f18ff = hasSelectedImageInput(_0x4596d8),
    _0x3fc1f2 =
      _0x547dea.params && typeof _0x547dea.params === 'object' && !Array.isArray(_0x547dea.params)
        ? Object.keys(_0x547dea.params)
        : [],
    _0x1867b8 = listModelManifests()
      .filter(
        (_0x3bf39b) =>
          _0x3bf39b?.kind === 'video' &&
          _0x3bf39b?.modelId &&
          (_0x2f18ff ? manifestAllowsImageInput(_0x3bf39b) : manifestAllowsTextInput(_0x3bf39b)) &&
          !manifestRequiresMissingMedia(_0x3bf39b, { hasImageInput: _0x2f18ff }),
      )
      .map((_0x2f64d6) => {
        const _0x58d1cf = getManifestFieldIds(_0x2f64d6);
        let _0x4dce0a = _0x2f64d6.vip === true ? 0 : 10;
        if (!_0x2f18ff && !manifestAllowsImageInput(_0x2f64d6)) _0x4dce0a += 8;
        for (const _0x2faa6a of _0x3fc1f2) {
          if (_0x58d1cf.has(_0x2faa6a)) _0x4dce0a += 20;
        }
        if (_0x58d1cf.has('duration')) _0x4dce0a += 8;
        if (_0x58d1cf.has('aspectRatio')) _0x4dce0a += 4;
        const _0xfaee70 = Number(_0x2f64d6.extensions?.videoMenu?.order) || 0;
        return ((_0x4dce0a += Math.max(0, 100 - _0xfaee70) / 100), { manifest: _0x2f64d6, score: _0x4dce0a });
      })
      .sort((_0x243865, _0x5cd76a) => {
        if (_0x5cd76a.score !== _0x243865.score) return _0x5cd76a.score - _0x243865.score;
        return String(_0x243865.manifest.modelId).localeCompare(String(_0x5cd76a.manifest.modelId));
      });
  return _0x1867b8[0]?.manifest || null;
}
function isAutoModelPlaceholder(_0x46144e = '') {
  const _0x4d08c2 = String(_0x46144e || '')
    .trim()
    .toLowerCase();
  return !_0x4d08c2 || _0x4d08c2 === 'auto' || _0x4d08c2 === 'default' || _0x4d08c2 === 'unknown';
}
function validateCreateModelArgs(_0x2ad2a3 = {}, _0x3174d7 = '', _0x59c6b8 = {}) {
  const _0xb80d45 = String(_0x2ad2a3.model || _0x2ad2a3.modelId || '').trim();
  if (isAutoModelPlaceholder(_0xb80d45)) {
    const _0x57153d = findAutoCreateModel(_0x2ad2a3, _0x3174d7, _0x59c6b8);
    return _0x57153d
      ? { args: { model: _0x57153d.modelId, provider: _0x57153d.provider || '' } }
      : { args: {} };
  }
  const _0x5158d2 = String(_0x2ad2a3.provider || '').trim(),
    _0x321a2c = resolveModelExecution(_0xb80d45, { providerHint: _0x5158d2 }),
    _0x8b76 = _0x321a2c?.modelManifest;
  if (!_0x8b76)
    return {
      ok: false,
      errorCode: 'MODEL_MANIFEST_NOT_FOUND',
      message: 'Model manifest not found: ' + _0xb80d45,
    };
  const _0x46e9b6 = CREATE_TYPE_MODEL_KINDS[_0x3174d7] || '';
  if (_0x46e9b6 && String(_0x8b76.kind || '') !== _0x46e9b6)
    return {
      ok: false,
      errorCode: 'MODEL_KIND_MISMATCH',
      message: 'Model ' + _0xb80d45 + ' is ' + (_0x8b76.kind || '(unknown)') + ', not ' + _0x46e9b6 + '.',
    };
  return { args: { model: _0x8b76.modelId || _0xb80d45, provider: _0x8b76.provider || _0x5158d2 } };
}
function applyInitialNodeModel(_0x517ef3, _0x163acf, _0x4bab25) {
  const _0x479842 = String(_0x163acf.model || '').trim();
  if (!_0x479842) return _0x517ef3;
  const _0x47080a = String(_0x517ef3?.id || '').trim();
  if (!_0x47080a) return _0x517ef3;
  const _0x27689b = { model: _0x479842, provider: String(_0x163acf.provider || '').trim() };
  return (
    getStore(_0x4bab25)?.updateNodeData?.(_0x47080a, _0x27689b),
    _0x4bab25.commit?.(),
    getNode(_0x4bab25, _0x47080a) || { ..._0x517ef3, ..._0x27689b }
  );
}
function buildNodeSummary(_0x26bab7, _0x592014, { includeData: includeData = false } = {}) {
  const _0x5a63b0 = getNode(_0x26bab7, _0x592014);
  if (!_0x5a63b0) return null;
  const _0x524580 = resolveModelExecution(_0x5a63b0.model, { providerHint: _0x5a63b0.provider }),
    _0x4b0d38 = {
      id: String(_0x5a63b0.id || _0x592014),
      type: String(_0x5a63b0.type || ''),
      name: String(_0x5a63b0.name || ''),
      promptPreview: truncateText(_0x5a63b0.prompt || _0x5a63b0.storyboardScript?.prompt || ''),
      contentPreview: truncateText(_0x5a63b0.content || ''),
      model: String(_0x5a63b0.model || ''),
      provider: String(_0x5a63b0.provider || ''),
      adapterType: String(
        _0x524580?.modelManifest?.adapterType || _0x524580?.executionManifest?.adapterType || '',
      ),
      x: toFiniteNumber(_0x5a63b0.x),
      y: toFiniteNumber(_0x5a63b0.y),
      width: toFiniteNumber(_0x5a63b0.width),
      height: toFiniteNumber(_0x5a63b0.height),
      jobStatus: String(
        _0x5a63b0.jobStatus ||
          _0x5a63b0.storyboardScript?.jobStatus ||
          (_0x5a63b0.isGenerating ? 'running' : 'idle'),
      ),
    };
  if (includeData) _0x4b0d38.data = omitLargeMedia(_0x5a63b0);
  return _0x4b0d38;
}
function buildCanvasSummary(_0x371373) {
  const _0x1aacab = getState(_0x371373),
    _0x459f9f = Object.keys(_0x1aacab.nodes || {}).map((_0x2eae75) => buildNodeSummary(_0x371373, _0x2eae75)),
    _0x35b9e6 = Object.values(_0x1aacab.edges || {}).map((_0x48538d) => ({
      id: String(_0x48538d?.id || ''),
      sourceId: String(_0x48538d?.sourceId || ''),
      targetId: String(_0x48538d?.targetId || ''),
      refSlot: String(_0x48538d?.refSlot || ''),
      type: String(_0x48538d?.type || ''),
    }));
  return {
    selectedNodeIds: Array.isArray(_0x1aacab.selectedNodeIds) ? [..._0x1aacab.selectedNodeIds] : [],
    nodes: _0x459f9f,
    edges: _0x35b9e6,
    viewport: {
      x: toFiniteNumber(_0x1aacab.viewport?.x),
      y: toFiniteNumber(_0x1aacab.viewport?.y),
      zoom: toFiniteNumber(_0x1aacab.viewport?.zoom, 1),
    },
    nodeCount: _0x459f9f.length,
    edgeCount: _0x35b9e6.length,
  };
}
function validateNodeIds(_0x482891, _0x3d5b58, _0x3749e9) {
  try {
    return { args: { ..._0x482891, ids: normalizeNodeIds(_0x482891, _0x3d5b58, _0x3749e9) } };
  } catch (_0x538d90) {
    return {
      ok: false,
      errorCode: _0x538d90.errorCode || 'INVALID_NODE_IDS',
      message: _0x538d90.message,
      details: _0x538d90.details,
    };
  }
}
export function registerGraphCommands(_0x3030e3) {
  (_0x3030e3.register({
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
    validate(_0xe54d94 = {}, _0x3441a2 = {}) {
      const _0x2b16b3 = normalizeNodeType(_0xe54d94.type);
      if (!SUPPORTED_CREATE_TYPES.has(_0x2b16b3))
        return {
          ok: false,
          errorCode: 'UNSUPPORTED_NODE_TYPE',
          message: 'Unsupported node.create type: ' + (_0x2b16b3 || '(empty)'),
        };
      const _0x264310 =
        hasExplicitCreatePosition(_0xe54d94) && typeof _0x3441a2['buildNodeData'] === 'function';
      if (!_0x264310 && typeof _0x3441a2['createNodeAtCursor'] !== 'function')
        return {
          ok: false,
          errorCode: 'NODE_CREATE_UNAVAILABLE',
          message: 'Canvas node creation flow is unavailable.',
        };
      const _0x5ed415 = validateCreateModelArgs(_0xe54d94, _0x2b16b3, _0x3441a2);
      if (_0x5ed415.ok === false) return _0x5ed415;
      return { args: { ..._0xe54d94, ..._0x5ed415.args, type: _0x2b16b3 } };
    },
    execute(_0x1c25e4, _0x3e312a) {
      const { width: _0x54e37d, height: _0x5930a6 } = resolveCreateSize(
          _0x1c25e4['type'],
          _0x1c25e4,
          _0x3e312a,
        ),
        _0xaff048 = String(_0x1c25e4['name'] || _0x1c25e4['label'] || ''),
        _0x3ff79f = _0x1c25e4['agentReservation'] === !![],
        _0xd98c54 = _0x3ff79f
          ? [
              ...(Array['isArray'](getState(_0x3e312a)['selectedNodeIds'])
                ? getState(_0x3e312a)['selectedNodeIds']
                : []),
            ]
          : [],
        _0x2baee0 = String(_0x1c25e4['reuseNodeId'] || '')['trim'](),
        _0x4cea57 = _0x2baee0 ? getNode(_0x3e312a, _0x2baee0) : null;
      if (_0x4cea57 && String(_0x4cea57['type'] || '')['trim']() === _0x1c25e4['type']) {
        const _0x1d0908 = getStore(_0x3e312a),
          _0x5cb9c2 = { ..._0x3e312a, commit: null };
        (Object['prototype']['hasOwnProperty']['call'](_0x1c25e4, 'name') || _0x1c25e4['label'] != null) &&
          _0x1d0908?.['updateNodeData']?.(_0x2baee0, { name: _0xaff048 });
        const _0x2ce34a = applyInitialNodeModel(
            getNode(_0x3e312a, _0x2baee0) || _0x4cea57,
            _0x1c25e4,
            _0x5cb9c2,
          ),
          _0xfd4956 = applyInitialNodeText(_0x2ce34a, _0x1c25e4, _0x5cb9c2);
        return (
          _0x1d0908?.['setSelectedNodes']?.([_0x2baee0]),
          _0x3e312a['commit']?.(),
          { nodeId: _0x2baee0, node: getNode(_0x3e312a, _0x2baee0) || _0xfd4956 || _0x4cea57, reused: !![] }
        );
      }
      if (hasExplicitCreatePosition(_0x1c25e4) && typeof _0x3e312a['buildNodeData'] === 'function') {
        const _0x47d206 = generateId(_0x1c25e4['type']),
          _0x429d97 = _0x3e312a['buildNodeData']({
            ..._0x1c25e4,
            id: _0x47d206,
            type: _0x1c25e4['type'],
            name: _0xaff048,
            width: _0x54e37d,
            height: _0x5930a6,
            x: Number(_0x1c25e4['x']),
            y: Number(_0x1c25e4['y']),
          });
        if (!_0x429d97 || typeof _0x429d97 !== 'object')
          throw createCanvasCommandError(
            'NODE_CREATE_FAILED',
            'Canvas node factory did not return data for type: ' + _0x1c25e4['type'],
          );
        (getStore(_0x3e312a)?.['addNode']?.(_0x429d97),
          getStore(_0x3e312a)?.['setSelectedNodes']?.(_0x3ff79f ? _0xd98c54 : [_0x47d206]));
        const _0x4c7f17 = { ..._0x3e312a, commit: null },
          _0x1cc2d8 = applyInitialNodeModel(_0x429d97, _0x1c25e4, _0x4c7f17),
          _0x26f868 = applyInitialNodeText(_0x1cc2d8, _0x1c25e4, _0x4c7f17);
        return (
          _0x3e312a['commit']?.(),
          { nodeId: _0x26f868?.['id'] || _0x47d206, node: _0x26f868 || _0x429d97 }
        );
      }
      const _0x537841 = String(_0x1c25e4['placement'] || 'viewport-center-sequence')['trim'](),
        _0x513c09 = String(_0x1c25e4['sequenceKey'] || _0x3e312a['createNodeSequenceKey'] || '')['trim'](),
        _0x48e365 = _0x3e312a['createNodeAtCursor'](_0x1c25e4['type'], _0x54e37d, _0x5930a6, _0xaff048, {
          placement: _0x537841,
          sequenceKey: _0x513c09,
        });
      if (_0x3ff79f) getStore(_0x3e312a)?.['setSelectedNodes']?.(_0xd98c54);
      const _0x332660 = applyInitialNodeModel(_0x48e365, _0x1c25e4, _0x3e312a),
        _0x218b1a = applyInitialNodeText(_0x332660, _0x1c25e4, _0x3e312a);
      return { nodeId: _0x218b1a?.['id'] || _0x48e365?.['id'] || '', node: _0x218b1a || _0x48e365 };
    },
  }),
    _0x3030e3.register({
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
      validate(_0x5849e7 = {}, _0x3469eb = {}) {
        return validateNodeIds(_0x5849e7, _0x3469eb, { min: 1, allowSelection: true });
      },
      execute(_0x51aa83, _0x4f0552) {
        return (
          getStore(_0x4f0552)?.deleteNodes?.(_0x51aa83.ids),
          _0x4f0552.commit?.(),
          { ids: _0x51aa83.ids }
        );
      },
    }),
    _0x3030e3.register({
      id: 'node.rename',
      description: 'Rename a canvas node.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['nodeId', 'name'],
        properties: { nodeId: { type: 'string' }, name: { type: 'string' } },
      },
      capabilitySchema: { reads: ['nodes'], writes: ['nodes'] },
      returnSchema: { aliasFields: ['nodeId', 'name'] },
      validate(_0x4cd2b9 = {}, _0x13527c = {}) {
        const _0x363afb = String(_0x4cd2b9.nodeId || '').trim();
        if (!_0x363afb)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.rename requires nodeId.' };
        if (!getNode(_0x13527c, _0x363afb))
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + _0x363afb };
        if (!Object.prototype.hasOwnProperty.call(_0x4cd2b9, 'name'))
          return { ok: false, errorCode: 'MISSING_NODE_NAME', message: 'node.rename requires name.' };
        return { args: { nodeId: _0x363afb, name: String(_0x4cd2b9.name || '').trim() } };
      },
      execute(_0x44391a, _0x3600bf) {
        const _0x55ff06 = getStore(_0x3600bf);
        return (
          typeof _0x55ff06?.renameNode === 'function'
            ? _0x55ff06.renameNode(_0x44391a.nodeId, _0x44391a.name)
            : _0x55ff06?.updateNodeData?.(_0x44391a.nodeId, { name: _0x44391a.name }),
          _0x3600bf.commit?.(),
          { nodeId: _0x44391a.nodeId, name: _0x44391a.name }
        );
      },
    }),
    _0x3030e3.register({
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
      validate(_0x162fdc = {}, _0x430dae = {}) {
        return validateNodeIds(_0x162fdc, _0x430dae, { min: 1, allowSelection: true });
      },
      execute(_0xf5e28a, _0x59a77c) {
        const _0x394894 = getState(_0x59a77c),
          _0xa18114 = getStore(_0x59a77c),
          _0x3c7d26 = toFiniteNumber(_0xf5e28a.dx, 40),
          _0x4c9d05 = toFiniteNumber(_0xf5e28a.dy, 40),
          _0x58c5a0 = new Map(),
          _0x19d356 = [],
          _0x3b2879 = () => {
            for (const _0x59978f of _0xf5e28a.ids) {
              const _0x302a3f = _0x394894.nodes?.[_0x59978f];
              if (!_0x302a3f) continue;
              const _0x34147a = generateId(String(_0x302a3f.type || 'node'));
              _0x58c5a0.set(_0x59978f, _0x34147a);
              const _0x50ea31 = {
                ...clonePlain(_0x302a3f),
                id: _0x34147a,
                x: toFiniteNumber(_0x302a3f.x) + _0x3c7d26,
                y: toFiniteNumber(_0x302a3f.y) + _0x4c9d05,
                _bizRev: undefined,
              };
              (delete _0x50ea31._bizRev, _0xa18114?.addNode?.(_0x50ea31), _0x19d356.push(_0x34147a));
            }
            for (const _0x3410cd of Object.values(_0x394894.edges || {})) {
              if (!_0x58c5a0.has(_0x3410cd?.sourceId) || !_0x58c5a0.has(_0x3410cd?.targetId)) continue;
              _0xa18114?.addEdge?.({
                ...clonePlain(_0x3410cd),
                id: generateId('edge'),
                sourceId: _0x58c5a0.get(_0x3410cd.sourceId),
                targetId: _0x58c5a0.get(_0x3410cd.targetId),
              });
            }
            _0xa18114?.setSelectedNodes?.(_0x19d356);
          };
        if (typeof _0xa18114?.batch === 'function') _0xa18114.batch(_0x3b2879);
        else _0x3b2879();
        return (_0x59a77c.commit?.(), { ids: _0x19d356, sourceIds: _0xf5e28a.ids });
      },
    }),
    _0x3030e3.register({
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
      validate(_0x2d60ab = {}, _0x58108c = {}) {
        const _0x54ff5d = String(_0x2d60ab.nodeId || '').trim();
        if (!_0x54ff5d)
          return { ok: false, errorCode: 'MISSING_NODE_ID', message: 'node.getSummary requires nodeId.' };
        if (!getNode(_0x58108c, _0x54ff5d))
          return { ok: false, errorCode: 'NODE_NOT_FOUND', message: 'Canvas node not found: ' + _0x54ff5d };
        return { args: { nodeId: _0x54ff5d, includeData: _0x2d60ab.includeData === true } };
      },
      execute(_0x42966f, _0x5463b2) {
        return buildNodeSummary(_0x5463b2, _0x42966f.nodeId, { includeData: _0x42966f.includeData });
      },
    }),
    _0x3030e3.register({
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
      validate(_0x4f34bd = {}, _0x112e8a = {}) {
        const _0x1cfa36 = normalizeEdgeArgs(_0x4f34bd);
        if (!_0x1cfa36.sourceId || !_0x1cfa36.targetId)
          return {
            ok: false,
            errorCode: 'MISSING_EDGE_ENDPOINTS',
            message: 'graph.connect requires sourceId and targetId.',
          };
        if (_0x1cfa36.sourceId === _0x1cfa36.targetId)
          return {
            ok: false,
            errorCode: 'INVALID_EDGE_ENDPOINTS',
            message: 'graph.connect cannot connect a node to itself.',
          };
        if (!getNode(_0x112e8a, _0x1cfa36.sourceId))
          return {
            ok: false,
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + _0x1cfa36.sourceId,
          };
        if (!getNode(_0x112e8a, _0x1cfa36.targetId))
          return {
            ok: false,
            errorCode: 'NODE_NOT_FOUND',
            message: 'Canvas node not found: ' + _0x1cfa36.targetId,
          };
        return {
          args: {
            ..._0x1cfa36,
            edgeId: _0x1cfa36.edgeId || generateId('edge'),
            type: _0x4f34bd.type ?? null,
          },
        };
      },
      execute(_0x13a4e2, _0x1f1371) {
        const _0x4b0083 = findEdgesByEndpoints(_0x1f1371, _0x13a4e2)[0];
        if (_0x4b0083) return { edgeId: _0x4b0083.id, edge: _0x4b0083, reused: true };
        const _0x15881d = {
          id: _0x13a4e2.edgeId,
          sourceId: _0x13a4e2.sourceId,
          targetId: _0x13a4e2.targetId,
          type: _0x13a4e2.type,
        };
        if (_0x13a4e2.refSlot) _0x15881d.refSlot = _0x13a4e2.refSlot;
        return (
          getStore(_0x1f1371)?.addEdge?.(_0x15881d),
          _0x1f1371.commit?.(),
          { edgeId: _0x15881d.id, edge: _0x15881d, reused: false }
        );
      },
    }),
    _0x3030e3.register({
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
      validate(_0x3c9c0e = {}, _0x36c058 = {}) {
        const _0x4b7ea4 = normalizeEdgeArgs(_0x3c9c0e),
          _0x284e79 =
            Object.prototype.hasOwnProperty.call(_0x3c9c0e, 'refSlot') ||
            Object.prototype.hasOwnProperty.call(_0x3c9c0e, 'slot') ||
            Object.prototype.hasOwnProperty.call(_0x3c9c0e, 'inputSlot');
        if (!_0x284e79)
          return {
            ok: false,
            errorCode: 'MISSING_REF_SLOT',
            message: 'node.setInputSlot requires refSlot, slot, or inputSlot.',
          };
        const _0x462ff1 = String(_0x3c9c0e.refSlot ?? _0x3c9c0e.slot ?? _0x3c9c0e.inputSlot ?? '').trim();
        let _0x1a1dd8 = null;
        if (_0x4b7ea4.edgeId) {
          _0x1a1dd8 = getEdges(_0x36c058)[_0x4b7ea4.edgeId] || null;
          if (!_0x1a1dd8)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'Canvas edge not found: ' + _0x4b7ea4.edgeId,
            };
        } else {
          if (!_0x4b7ea4.sourceId || !_0x4b7ea4.targetId)
            return {
              ok: false,
              errorCode: 'MISSING_EDGE_SELECTOR',
              message: 'node.setInputSlot requires edgeId or sourceId/targetId.',
            };
          _0x1a1dd8 = findEdgesByEndpoints(_0x36c058, _0x4b7ea4)[0] || null;
          if (!_0x1a1dd8)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'No canvas edge matched node.setInputSlot.',
            };
        }
        return { args: { edgeId: String(_0x1a1dd8.id || ''), refSlot: _0x462ff1 } };
      },
      execute(_0x447678, _0x3a7d65) {
        const _0x42a365 = getEdges(_0x3a7d65)[_0x447678.edgeId];
        if (!_0x42a365)
          throw createCanvasCommandError('EDGE_NOT_FOUND', 'Canvas edge not found: ' + _0x447678.edgeId, {
            edgeId: _0x447678.edgeId,
          });
        const _0xfa706c = { ..._0x42a365 };
        if (_0x447678.refSlot) _0xfa706c.refSlot = _0x447678.refSlot;
        else delete _0xfa706c.refSlot;
        const _0x36389a = getStore(_0x3a7d65);
        return (
          typeof _0x36389a?.updateEdgesBatch === 'function'
            ? _0x36389a.updateEdgesBatch([_0x447678.edgeId], [_0xfa706c])
            : (_0x36389a?.removeEdge?.(_0x447678.edgeId), _0x36389a?.addEdge?.(_0xfa706c)),
          _0x3a7d65.commit?.(),
          { edgeId: _0x447678.edgeId, refSlot: _0x447678.refSlot, edge: _0xfa706c }
        );
      },
    }),
    _0x3030e3.register({
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
      validate(_0x21214a = {}, _0x5c30d8 = {}) {
        const _0x1c5ece = normalizeEdgeArgs(_0x21214a);
        if (_0x1c5ece.edgeId) {
          const _0x2af4cd = getEdges(_0x5c30d8)[_0x1c5ece.edgeId];
          if (!_0x2af4cd)
            return {
              ok: false,
              errorCode: 'EDGE_NOT_FOUND',
              message: 'Canvas edge not found: ' + _0x1c5ece.edgeId,
            };
          return { args: { edgeIds: [_0x1c5ece.edgeId] } };
        }
        if (!_0x1c5ece.sourceId && !_0x1c5ece.targetId)
          return {
            ok: false,
            errorCode: 'MISSING_EDGE_SELECTOR',
            message: 'graph.disconnect requires edgeId or endpoint selectors.',
          };
        const _0x51cb0a = findEdgesByEndpoints(_0x5c30d8, _0x1c5ece);
        if (_0x51cb0a.length === 0)
          return {
            ok: false,
            errorCode: 'EDGE_NOT_FOUND',
            message: 'No canvas edge matched graph.disconnect.',
          };
        return { args: { edgeIds: _0x51cb0a.map((_0x15fd5e) => _0x15fd5e.id) } };
      },
      execute(_0x146d4f, _0x146147) {
        const _0x3742b2 = getStore(_0x146147);
        for (const _0x4c5bb8 of _0x146d4f.edgeIds) _0x3742b2?.removeEdge?.(_0x4c5bb8);
        return (_0x146147.commit?.(), { edgeIds: _0x146d4f.edgeIds });
      },
    }),
    _0x3030e3.register({
      id: 'graph.getCanvasSummary',
      description: 'Get a safe canvas summary.',
      riskLevel: 'safe',
      argsSchema: {},
      capabilitySchema: { reads: ['nodes', 'edges', 'selection', 'viewport'], writes: [] },
      returnSchema: { aliasFields: ['selectedNodeIds', 'nodes', 'edges', 'nodeCount', 'edgeCount'] },
      execute(_0x3a37f7, _0x33655c) {
        return buildCanvasSummary(_0x33655c);
      },
    }));
}
export { buildCanvasSummary, buildNodeSummary, normalizeNodeIds };
