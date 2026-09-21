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
function truncate(_0x104648, _0x1c6fff = DEFAULT_PROMPT_PREVIEW_LIMIT) {
  const _0x4e178a = String(_0x104648 || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/data:[^\s"'<>)]{20,}/gi, '[omitted-data-url]')
    .replace(/[A-Za-z0-9+/]{120,}={0,2}/g, '[omitted-base64]')
    .replace(/\s+/g, ' ')
    .trim();
  if (_0x4e178a.length <= _0x1c6fff) return _0x4e178a;
  return _0x4e178a.slice(0, Math.max(0, _0x1c6fff - 3)) + '...';
}
function normalizeKind(_0x2cf575) {
  const _0x305882 = String(_0x2cf575 || '')
    .trim()
    .toLowerCase();
  return MODEL_KINDS.has(_0x305882) ? _0x305882 : '';
}
function normalizeStringArray(_0x2dc509) {
  if (!Array.isArray(_0x2dc509)) return [];
  const _0x382276 = [],
    _0x18de62 = new Set();
  for (const _0x245aaf of _0x2dc509) {
    const _0x374d70 = String(_0x245aaf || '').trim();
    if (!_0x374d70 || _0x18de62.has(_0x374d70)) continue;
    (_0x382276.push(_0x374d70), _0x18de62.add(_0x374d70));
  }
  return _0x382276;
}
function nodeTypeToInputKind(_0x570887 = '') {
  return NODE_TYPE_KIND_HINTS[String(_0x570887 || '').trim()] || '';
}
function getSelectedInputKinds(_0x311a16 = []) {
  return new Set(_0x311a16.map((_0x1b4b01) => nodeTypeToInputKind(_0x1b4b01?.type)).filter(Boolean));
}
function getManifestUiFieldIds(_0x34d10e) {
  return new Set(
    (Array.isArray(_0x34d10e?.uiSchema?.fields) ? _0x34d10e.uiSchema.fields : [])
      .map((_0x10477c) => String(_0x10477c?.id || '').trim())
      .filter(Boolean),
  );
}
function getManifestInputSlots(_0x3a54f2) {
  return _0x3a54f2?.inputSlots && typeof _0x3a54f2.inputSlots === 'object' ? _0x3a54f2.inputSlots : {};
}
function manifestAllowsInputKind(_0x325e18, _0x2716bf) {
  const _0xdfba99 = getManifestInputSlots(_0x325e18),
    _0x55069f = normalizeStringArray(_0xdfba99.allowedKinds);
  if (_0x55069f.includes(_0x2716bf)) return true;
  const _0x2a5622 = Number(_0xdfba99.maxByKind?.[_0x2716bf]);
  if (Number.isFinite(_0x2a5622) && _0x2a5622 > 0) return true;
  const _0x1558ec = Array.isArray(_0xdfba99.fixedSlots) ? _0xdfba99.fixedSlots : [];
  return _0x1558ec.some((_0x34164f) => String(_0x34164f?.kind || '') === _0x2716bf);
}
function getRequiredInputKinds(_0x3c9194) {
  const _0x3de13e = getManifestInputSlots(_0x3c9194),
    _0x344b35 = new Set();
  for (const [_0x12e458, _0x410b88] of Object.entries(_0x3de13e.minByKind || {})) {
    if (Number(_0x410b88) > 0 && _0x12e458 !== 'text') _0x344b35.add(_0x12e458);
  }
  for (const _0x38bdb4 of Array.isArray(_0x3de13e.fixedSlots) ? _0x3de13e.fixedSlots : []) {
    const _0x3e7461 = String(_0x38bdb4?.kind || '');
    if (_0x3e7461 && _0x3e7461 !== 'text' && _0x38bdb4?.required === true) _0x344b35.add(_0x3e7461);
  }
  return _0x344b35;
}
function scoreSelectedInputCompatibility(
  _0x33753f,
  {
    selectedInputKinds: selectedInputKinds = new Set(),
    targetKind: targetKind = '',
    userMessage: userMessage = '',
  } = {},
) {
  if (!targetKind || selectedInputKinds.size === 0) return 0;
  let _0x358375 = 0;
  for (const _0x321ca7 of selectedInputKinds) {
    _0x358375 += manifestAllowsInputKind(_0x33753f, _0x321ca7) ? 180 : -120;
  }
  for (const _0x25b78e of getRequiredInputKinds(_0x33753f)) {
    if (!selectedInputKinds.has(_0x25b78e)) _0x358375 -= 0x1a4;
  }
  if (targetKind === 'video' && selectedInputKinds.has('image')) {
    const _0x313294 = getManifestUiFieldIds(_0x33753f);
    (_0x313294.has('duration') && /\d+\s*(?:s|sec|second|seconds|秒)/i.test(userMessage) && (_0x358375 += 35),
      _0x313294.has('aspectRatio') &&
        /(?:16:9|9:16|1:1|aspect|ratio|比例)/i.test(userMessage) &&
        (_0x358375 += 20));
  }
  return _0x358375;
}
function compactObject(
  _0x5b25d7,
  {
    maxKeys: maxKeys = 12,
    maxArrayItems: maxArrayItems = 8,
    maxString: maxString = 160,
    depth: depth = 0,
  } = {},
) {
  if (_0x5b25d7 == null) return _0x5b25d7;
  if (typeof _0x5b25d7 === 'string') return truncate(_0x5b25d7, maxString);
  if (typeof _0x5b25d7 !== 'object') return _0x5b25d7;
  if (depth >= 2) {
    if (Array.isArray(_0x5b25d7)) return '[array:' + _0x5b25d7.length + ']';
    return '[object]';
  }
  if (Array.isArray(_0x5b25d7))
    return _0x5b25d7.slice(0, maxArrayItems).map((_0x44b696) =>
      compactObject(_0x44b696, {
        maxKeys: maxKeys,
        maxArrayItems: maxArrayItems,
        maxString: maxString,
        depth: depth + 1,
      }),
    );
  const _0x23437a = Object.entries(_0x5b25d7).filter(([, _0x5596d9]) => _0x5596d9 !== undefined),
    _0x1e67e3 = {};
  for (const [_0x2746af, _0x25670e] of _0x23437a.slice(0, maxKeys)) {
    _0x1e67e3[_0x2746af] = compactObject(_0x25670e, {
      maxKeys: maxKeys,
      maxArrayItems: maxArrayItems,
      maxString: maxString,
      depth: depth + 1,
    });
  }
  if (_0x23437a.length > maxKeys) _0x1e67e3._truncatedKeys = _0x23437a.length - maxKeys;
  return _0x1e67e3;
}
function normalizeViewport(_0x4c9cb1 = {}) {
  return {
    x: Number.isFinite(Number(_0x4c9cb1.x)) ? Number(_0x4c9cb1.x) : 0,
    y: Number.isFinite(Number(_0x4c9cb1.y)) ? Number(_0x4c9cb1.y) : 0,
    zoom: Number.isFinite(Number(_0x4c9cb1.zoom)) ? Number(_0x4c9cb1.zoom) : 1,
  };
}
function summarizeModel(_0x565ffc, { fieldLimit: fieldLimit = 6, optionLimit: optionLimit = 8 } = {}) {
  const _0x12a019 = getExecutionManifest(_0x565ffc?.executionId),
    _0x22b73b = Array.isArray(_0x565ffc?.uiSchema?.fields) ? _0x565ffc.uiSchema.fields : [];
  return {
    modelId: String(_0x565ffc?.modelId || ''),
    provider: String(_0x565ffc?.provider || ''),
    kind: String(_0x565ffc?.kind || ''),
    adapterType: String(_0x565ffc?.adapterType || _0x12a019?.adapterType || ''),
    displayName: String(_0x565ffc?.displayName || _0x565ffc?.modelId || ''),
    inputSlots: compactObject(_0x565ffc?.inputSlots || {}),
    outputType: String(_0x565ffc?.outputType || ''),
    vip: _0x565ffc?.vip === true,
    async: _0x565ffc?.async === true,
    cancellable: _0x565ffc?.cancellable === true,
    uiSchema: {
      fieldCount: _0x22b73b.length,
      fields: _0x22b73b.slice(0, fieldLimit).map((_0x4625df) => ({
        id: String(_0x4625df?.id || ''),
        type: String(_0x4625df?.type || ''),
        label: String(_0x4625df?.label || _0x4625df?.id || ''),
        defaultValue: _0x4625df?.defaultValue,
        displayRole: String(_0x4625df?.displayRole || ''),
        options: Array.isArray(_0x4625df?.options)
          ? _0x4625df.options.slice(0, optionLimit).map((_0xfea4df) => ({
              value: _0xfea4df?.value ?? _0xfea4df,
              label: String(_0xfea4df?.label || _0xfea4df?.value || _0xfea4df || ''),
            }))
          : undefined,
      })),
    },
  };
}
function summarizeWorkflow(_0x22c6de) {
  return {
    modelId: _0x22c6de.modelId,
    provider: _0x22c6de.provider,
    kind: _0x22c6de.kind,
    adapterType: _0x22c6de.adapterType,
    displayName: _0x22c6de.displayName,
  };
}
function summarizeTaskNode(_0x359acf = {}) {
  const _0x2d9384 = String(
    _0x359acf.jobStatus ||
      _0x359acf.storyboardScript?.jobStatus ||
      (_0x359acf.isGenerating ? 'running' : 'idle'),
  );
  if (_0x2d9384 !== 'running' && _0x2d9384 !== 'pending') return null;
  return {
    nodeId: String(_0x359acf.id || ''),
    type: String(_0x359acf.type || ''),
    model: String(_0x359acf.model || ''),
    provider: String(_0x359acf.provider || ''),
    jobStatus: _0x2d9384,
    taskId: String(_0x359acf.taskId || _0x359acf.rhTaskId || _0x359acf.asyncTaskId || ''),
  };
}
function getSelectedNodes(_0x5747ac = {}, _0x3b63ca = {}) {
  const _0x19d386 = Array.isArray(_0x3b63ca.selectedNodeIds)
    ? _0x3b63ca.selectedNodeIds
    : Array.isArray(_0x5747ac.selectedNodeIds)
      ? _0x5747ac.selectedNodeIds
      : [];
  return _0x19d386.map((_0x45f1de) => _0x5747ac.nodes?.[_0x45f1de]).filter(Boolean);
}
function getSelectedNodeTypes(_0xa6dd73 = []) {
  return normalizeStringArray(_0xa6dd73.map((_0xf74b7d) => _0xf74b7d?.type));
}
function getInputRefSelectedNodes(_0x1f1702 = [], _0x1ea215 = {}) {
  if (!Array.isArray(_0x1f1702)) return [];
  return _0x1f1702
    .map((_0xf2352e = {}) => {
      const _0x97399c = String(_0xf2352e.nodeId || _0xf2352e.id || '').trim();
      if (!_0x97399c) return null;
      const _0x251caa = _0x1ea215.nodes?.[_0x97399c];
      if (_0x251caa) return _0x251caa;
      const _0x274a4d = String(_0xf2352e.type || '').trim() || 'source-' + String(_0xf2352e.kind || 'node');
      return {
        id: _0x97399c,
        type: _0x274a4d,
        name: String(_0xf2352e.label || _0xf2352e.name || _0x97399c).trim(),
        width: Number(_0xf2352e.width) || undefined,
        height: Number(_0xf2352e.height) || undefined,
      };
    })
    .filter(Boolean);
}
function resolveNodeKind(_0x50c187 = {}) {
  if (!_0x50c187 || typeof _0x50c187 !== 'object') return '';
  return (
    resolveSelectedNodeModelKind(_0x50c187) ||
    NODE_TYPE_KIND_HINTS[String(_0x50c187?.type || '').trim()] ||
    ''
  );
}
function isMaterialNodeSummary(_0x31dbbd = {}) {
  return MODEL_KINDS.has(resolveNodeKind(_0x31dbbd));
}
function summarizeReferenceInputRef(_0x1811b4 = {}) {
  const _0x37a4bb = String(_0x1811b4.nodeId || _0x1811b4.id || '').trim();
  if (!_0x37a4bb) return null;
  const _0x3b269f = String(_0x1811b4.type || '').trim(),
    _0x5658d3 = normalizeKind(_0x1811b4.kind) || nodeTypeToInputKind(_0x3b269f),
    _0x2e3186 = {
      nodeId: _0x37a4bb,
      id: _0x37a4bb,
      type: _0x3b269f,
      kind: _0x5658d3,
      label: truncate(_0x1811b4.label || _0x1811b4.name || _0x37a4bb, 80),
      source: String(_0x1811b4.source || 'agent-panel').trim(),
    },
    _0x547b6e = Number(_0x1811b4.width),
    _0x41c7e5 = Number(_0x1811b4.height);
  if (Number.isFinite(_0x547b6e) && _0x547b6e > 0) _0x2e3186.width = Math.round(_0x547b6e);
  if (Number.isFinite(_0x41c7e5) && _0x41c7e5 > 0) _0x2e3186.height = Math.round(_0x41c7e5);
  return _0x2e3186;
}
function summarizeReferenceNode(
  _0x35225e = {},
  { promptPreviewLimit: promptPreviewLimit = REFERENCE_PROMPT_PREVIEW_LIMIT } = {},
) {
  if (!_0x35225e || typeof _0x35225e !== 'object') return null;
  const _0x4c8b68 = String(_0x35225e.id || _0x35225e.nodeId || '').trim();
  if (!_0x4c8b68) return null;
  const _0x276785 = Number(_0x35225e.width),
    _0x5696b9 = Number(_0x35225e.height),
    _0x1d931c = {
      nodeId: _0x4c8b68,
      id: _0x4c8b68,
      type: String(_0x35225e.type || ''),
      kind: resolveNodeKind(_0x35225e),
      name: String(_0x35225e.name || ''),
      promptPreview: truncate(_0x35225e.promptPreview || _0x35225e.prompt || '', promptPreviewLimit),
      contentPreview: truncate(_0x35225e.contentPreview || _0x35225e.content || '', promptPreviewLimit),
      model: String(_0x35225e.model || ''),
      provider: String(_0x35225e.provider || ''),
      adapterType: String(_0x35225e.adapterType || ''),
      status: String(_0x35225e.jobStatus || _0x35225e.status || ''),
    };
  if (Number.isFinite(_0x276785) && _0x276785 > 0) _0x1d931c.width = Math.round(_0x276785);
  if (Number.isFinite(_0x5696b9) && _0x5696b9 > 0) _0x1d931c.height = Math.round(_0x5696b9);
  return _0x1d931c;
}
function summarizeRelatedEdge(_0x38b8a2 = {}, _0x261da8, _0x440499) {
  const _0x42065b = String(_0x38b8a2.sourceId || '').trim(),
    _0x552ff8 = String(_0x38b8a2.targetId || '').trim();
  if (!_0x42065b && !_0x552ff8) return null;
  const _0x509df3 = _0x440499.has(_0x42065b),
    _0x15c294 = _0x440499.has(_0x552ff8),
    _0x533a72 = [_0x509df3 ? _0x42065b : '', _0x15c294 ? _0x552ff8 : ''].filter(Boolean),
    _0x2c55bb = _0x509df3 && _0x15c294 ? 'internal' : _0x509df3 ? 'out' : 'in';
  return {
    id: String(_0x38b8a2.id || ''),
    sourceId: _0x42065b,
    targetId: _0x552ff8,
    refSlot: String(_0x38b8a2.refSlot || ''),
    type: String(_0x38b8a2.type || ''),
    direction: _0x2c55bb,
    referenceNodeIds: _0x533a72,
    sourceNode: summarizeReferenceNode(_0x261da8.get(_0x42065b) || {}),
    targetNode: summarizeReferenceNode(_0x261da8.get(_0x552ff8) || {}),
  };
}
function buildReferenceContext({ inputRefs: inputRefs = [], nodes: nodes = [], edges: edges = [] } = {}) {
  const _0x56cc3e = Array.isArray(inputRefs) ? inputRefs.map(summarizeReferenceInputRef).filter(Boolean) : [],
    _0x5f185a = normalizeStringArray(_0x56cc3e.map((_0xf5b730) => _0xf5b730.nodeId || _0xf5b730.id)),
    _0xa0f33b = new Set(_0x5f185a),
    _0x2ebbf2 = new Map(
      (Array.isArray(nodes) ? nodes : [])
        .map((_0x4acdcd) => [String(_0x4acdcd?.id || _0x4acdcd?.nodeId || '').trim(), _0x4acdcd])
        .filter(([_0x411ec8]) => Boolean(_0x411ec8)),
    ),
    _0x2c722c = _0x5f185a
      .map((_0x59173c) => _0x2ebbf2.get(_0x59173c))
      .filter(isMaterialNodeSummary)
      .map((_0x2d8b7c) => summarizeReferenceNode(_0x2d8b7c))
      .filter(Boolean),
    _0x30bc70 = (Array.isArray(edges) ? edges : [])
      .filter(
        (_0x2e6b3c) =>
          _0xa0f33b.has(String(_0x2e6b3c?.sourceId || '')) ||
          _0xa0f33b.has(String(_0x2e6b3c?.targetId || '')),
      )
      .map((_0x373e15) => summarizeRelatedEdge(_0x373e15, _0x2ebbf2, _0xa0f33b))
      .filter(Boolean),
    _0x1273be = new Set();
  _0x30bc70.forEach((_0x372f35) => {
    (_0xa0f33b.has(_0x372f35.sourceId) &&
      _0x372f35.targetId &&
      !_0xa0f33b.has(_0x372f35.targetId) &&
      _0x1273be.add(_0x372f35.targetId),
      _0xa0f33b.has(_0x372f35.targetId) &&
        _0x372f35.sourceId &&
        !_0xa0f33b.has(_0x372f35.sourceId) &&
        _0x1273be.add(_0x372f35.sourceId));
  });
  const _0xaf6581 = Array.from(_0x1273be)
    .map((_0xb588db) => _0x2ebbf2.get(_0xb588db))
    .map((_0xdd0d3d) => summarizeReferenceNode(_0xdd0d3d))
    .filter(Boolean);
  return {
    inputRefs: _0x56cc3e,
    referencedNodes: _0x2c722c,
    relatedEdges: _0x30bc70,
    neighborNodes: _0xaf6581,
  };
}
function inferKindFromMessage(_0x169a74) {
  const _0x47f5f7 = String(_0x169a74 || '').trim();
  if (!_0x47f5f7) return '';
  let _0x12fe10 = '',
    _0x353a89 = 0;
  for (const [_0x2ea7f2, _0x3dc02e] of Object.entries(MESSAGE_KIND_PATTERNS)) {
    let _0x2e913f = 0;
    for (const _0xfd7951 of _0x3dc02e) {
      if (_0xfd7951.test(_0x47f5f7)) _0x2e913f += 1;
    }
    (_0x2e913f > _0x353a89 ||
      (_0x2e913f === _0x353a89 &&
        _0x2e913f > 0 &&
        (MESSAGE_KIND_PRIORITY[_0x2ea7f2] || 0) > (MESSAGE_KIND_PRIORITY[_0x12fe10] || 0))) &&
      ((_0x12fe10 = _0x2ea7f2), (_0x353a89 = _0x2e913f));
  }
  return _0x12fe10;
}
function inferKindFromSelectedNodes(_0x2fd480 = []) {
  const _0x55dfe6 = new Map();
  for (const _0x32cbd1 of _0x2fd480) {
    const _0x5a6010 = resolveSelectedNodeModelKind(_0x32cbd1),
      _0x1e3360 = _0x5a6010 || NODE_TYPE_KIND_HINTS[String(_0x32cbd1?.type || '').trim()] || '';
    if (!_0x1e3360) continue;
    _0x55dfe6.set(_0x1e3360, (_0x55dfe6.get(_0x1e3360) || 0) + 1);
  }
  return (
    Array.from(_0x55dfe6.entries()).sort((_0x32309c, _0x2c9733) => _0x2c9733[1] - _0x32309c[1])[0]?.[0] || ''
  );
}
function resolveSelectedNodeModelKind(_0x5d1baf = {}) {
  const _0xfc709a = String(_0x5d1baf.model || '').trim();
  if (!_0xfc709a) return '';
  return normalizeKind(
    resolveModelExecution(_0xfc709a, { providerHint: _0x5d1baf.provider })?.modelManifest?.kind,
  );
}
function resolveTargetKind({
  targetKind: _0x4781f5,
  intent: intent = null,
  userMessage: userMessage = '',
  selectedNodes: selectedNodes = [],
} = {}) {
  return (
    normalizeKind(_0x4781f5) ||
    normalizeKind(intent?.targetKind) ||
    normalizeKind(intent?.kind) ||
    inferKindFromMessage(userMessage) ||
    inferKindFromSelectedNodes(selectedNodes)
  );
}
function scoreModel(
  _0x34c0e6,
  {
    targetKind: targetKind = '',
    selectedModelIds: selectedModelIds = [],
    selectedProviders: selectedProviders = [],
    selectedInputKinds: selectedInputKinds = new Set(),
    userMessage: userMessage = '',
  } = {},
) {
  let _0x604b = 0;
  const _0xe98d3c = normalizeKind(_0x34c0e6?.kind);
  if (targetKind && _0xe98d3c === targetKind) _0x604b += 0x3e8;
  if (selectedModelIds.includes(_0x34c0e6?.modelId)) _0x604b += 0x1f4;
  if (selectedProviders.includes(_0x34c0e6?.provider)) _0x604b += 80;
  if (_0x34c0e6?.adapterType === 'workflow') _0x604b += 20;
  if (_0x34c0e6?.vip !== true) _0x604b += 4;
  const _0x40ddce =
    Number(_0x34c0e6?.extensions?.imageMenu?.order) ||
    Number(_0x34c0e6?.extensions?.videoMenu?.order) ||
    Number(_0x34c0e6?.extensions?.audioMenu?.order) ||
    Number(_0x34c0e6?.extensions?.textMenu?.order) ||
    0;
  ((_0x604b += Math.max(0, 100 - _0x40ddce) / 100),
    (_0x604b += scoreSelectedInputCompatibility(_0x34c0e6, {
      selectedInputKinds: selectedInputKinds,
      targetKind: targetKind,
      userMessage: userMessage,
    })));
  const _0x51e039 = [_0x34c0e6?.modelId, _0x34c0e6?.provider, _0x34c0e6?.displayName, _0x34c0e6?.description]
    .join(' ')
    .toLowerCase();
  for (const _0x291b78 of String(userMessage || '')
    .toLowerCase()
    .split(/\s+/)) {
    if (_0x291b78.length >= 3 && _0x51e039.includes(_0x291b78)) _0x604b += 10;
  }
  return _0x604b;
}
function filterModelManifests({
  targetKind: targetKind = '',
  selectedNodes: selectedNodes = [],
  userMessage: userMessage = '',
  modelLimit: modelLimit = undefined,
} = {}) {
  const _0x56106a = listModelManifests(),
    _0x1167fc = normalizeStringArray(selectedNodes.map((_0x3b4207) => _0x3b4207?.model)),
    _0x3fd438 = normalizeStringArray(selectedNodes.map((_0x256ec4) => _0x256ec4?.provider)),
    _0x4afd90 = getSelectedInputKinds(selectedNodes),
    _0x3f7d54 = Boolean(targetKind),
    _0x1e8fdb = Number(modelLimit),
    _0x1cffcf = _0x3f7d54 ? DEFAULT_MODEL_LIMIT : NO_INTENT_MODEL_LIMIT,
    _0x469344 = Math.max(0, Math.trunc(Number.isFinite(_0x1e8fdb) ? _0x1e8fdb : _0x1cffcf)),
    _0x499cb0 = _0x56106a
      .filter((_0x3d1206) => {
        if (!_0x3d1206?.modelId) return false;
        if (_0x1167fc.includes(_0x3d1206.modelId)) return true;
        return !_0x3f7d54 || normalizeKind(_0x3d1206.kind) === targetKind;
      })
      .map((_0x53ebbc) => ({
        manifest: _0x53ebbc,
        score: scoreModel(_0x53ebbc, {
          targetKind: targetKind,
          selectedModelIds: _0x1167fc,
          selectedProviders: _0x3fd438,
          selectedInputKinds: _0x4afd90,
          userMessage: userMessage,
        }),
      }))
      .sort((_0x54fd38, _0x5641f0) => {
        if (_0x5641f0.score !== _0x54fd38.score) return _0x5641f0.score - _0x54fd38.score;
        return String(_0x54fd38.manifest.modelId).localeCompare(String(_0x5641f0.manifest.modelId));
      }),
    _0x30675f = _0x499cb0.slice(0, _0x469344).map((_0x415205) => _0x415205.manifest);
  return {
    manifests: _0x30675f,
    totalAvailable: _0x56106a.length,
    totalMatched: _0x499cb0.length,
    truncated: _0x499cb0.length > _0x30675f.length,
    targetKind: targetKind,
    selectedModelIds: _0x1167fc,
    selectedInputKinds: Array.from(_0x4afd90),
  };
}
export function buildAgentCanvasSummary({
  store: _0x641790,
  recentCommands: recentCommands = [],
  includeCommands: includeCommands = true,
  userMessage: userMessage = '',
  intent: intent = null,
  targetKind: targetKind = '',
  inputRefs: inputRefs = [],
  modelLimit: modelLimit = undefined,
  promptPreviewLimit: promptPreviewLimit = DEFAULT_PROMPT_PREVIEW_LIMIT,
} = {}) {
  const _0x590849 = _0x641790?.getStateRaw?.() || _0x641790?.getState?.() || {},
    _0x52a737 = buildCanvasSummary({ store: _0x641790 }),
    _0x40a854 = (_0x52a737.nodes || []).map((_0x2176df) => ({
      ..._0x2176df,
      promptPreview: truncate(_0x2176df.promptPreview, promptPreviewLimit),
      contentPreview: truncate(_0x2176df.contentPreview, promptPreviewLimit),
    })),
    _0x3d8ebc = getSelectedNodes(_0x590849, _0x52a737),
    _0x65e11c = new Set(_0x3d8ebc.map((_0x2d0b35) => String(_0x2d0b35?.id || '')).filter(Boolean)),
    _0x33c72e = getInputRefSelectedNodes(inputRefs, _0x590849).filter(
      (_0x19bd08) => !_0x65e11c.has(String(_0x19bd08.id || '')),
    ),
    _0x4a7adb = [..._0x3d8ebc, ..._0x33c72e],
    _0x527c88 = resolveTargetKind({
      targetKind: targetKind,
      intent: intent,
      userMessage: userMessage,
      selectedNodes: _0x4a7adb,
    }),
    _0x3e8ef8 = filterModelManifests({
      targetKind: _0x527c88,
      selectedNodes: _0x4a7adb,
      userMessage: userMessage,
      modelLimit: modelLimit,
    }),
    _0x367130 = _0x3e8ef8.manifests.map((_0x382566) => summarizeModel(_0x382566)),
    _0x569340 = _0x367130.filter((_0xe5ce5c) => _0xe5ce5c.adapterType === 'workflow').map(summarizeWorkflow),
    _0x17f54e = Array.isArray(recentCommands) ? recentCommands : [],
    _0x3bdf6b = new Set((_0x52a737.selectedNodeIds || []).map((_0x4a13ae) => String(_0x4a13ae || ''))),
    _0x5ca6bd = _0x40a854
      .filter((_0x24881a) => _0x3bdf6b.has(String(_0x24881a?.id || '')))
      .map((_0x13b147) => ({
        id: _0x13b147.id,
        type: _0x13b147.type,
        name: _0x13b147.name,
        promptPreview: _0x13b147.promptPreview,
        contentPreview: _0x13b147.contentPreview,
        model: _0x13b147.model,
        provider: _0x13b147.provider,
        adapterType: _0x13b147.adapterType,
        x: _0x13b147.x,
        y: _0x13b147.y,
        width: _0x13b147.width,
        height: _0x13b147.height,
        jobStatus: _0x13b147.jobStatus,
      })),
    _0x87098c = _0x52a737.edges || [],
    _0x22ace6 = buildReferenceContext({ inputRefs: inputRefs, nodes: _0x40a854, edges: _0x87098c });
  return {
    selectedNodeIds: _0x52a737.selectedNodeIds || [],
    selectedNodes: _0x5ca6bd,
    nodes: _0x40a854,
    edges: _0x87098c,
    referenceContext: _0x22ace6,
    viewport: normalizeViewport(_0x52a737.viewport),
    availableModels: _0x367130,
    availableWorkflows: _0x569340,
    modelCatalog: {
      targetKind: _0x3e8ef8.targetKind,
      selectedNodeTypes: getSelectedNodeTypes(_0x4a7adb),
      selectedInputKinds: _0x3e8ef8.selectedInputKinds,
      selectedNodeModels: _0x3e8ef8.selectedModelIds,
      selectedModelIds: _0x3e8ef8.selectedModelIds,
      totalAvailable: _0x3e8ef8.totalAvailable,
      totalMatched: _0x3e8ef8.totalMatched,
      includedModels: _0x367130.length,
      truncated: _0x3e8ef8.truncated,
    },
    runningTasks: Object.values(_0x590849.nodes || {})
      .map(summarizeTaskNode)
      .filter(Boolean),
    recentCommands: includeCommands ? _0x17f54e.slice(-20) : [],
  };
}
export const agentCanvasSummaryInternals = Object.freeze({
  inferKindFromMessage: inferKindFromMessage,
  resolveTargetKind: resolveTargetKind,
  filterModelManifests: filterModelManifests,
  buildReferenceContext: buildReferenceContext,
});
