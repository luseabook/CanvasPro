import { getLocale, t } from '../../i18n/index.js';
import { resolveWorkflowNodeThumbSrc } from './workflowCovers.js';
function cleanText(_0x13a38d) {
  return String(_0x13a38d ?? '').trim();
}
function toArray(_0x32c7b9) {
  if (Array.isArray(_0x32c7b9)) return _0x32c7b9;
  if (_0x32c7b9 && typeof _0x32c7b9 === 'object') return Object.values(_0x32c7b9);
  return [];
}
function stripRichText(_0x4f3dd2) {
  return String(_0x4f3dd2 ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(_0x27b948, _0x3ae51f = 88) {
  const _0x231868 = cleanText(_0x27b948);
  if (!_0x231868 || _0x231868.length <= _0x3ae51f) return _0x231868;
  return _0x231868.slice(0, Math.max(0, _0x3ae51f - 1)) + '…';
}
const NODE_TYPE_LABEL_KEYS = {
  group: 'nodeTypes.group',
  text: 'nodeTypes.text',
  'source-text': 'nodeTypes.text',
  'ai-text': 'nodeTypes.aiText',
  image: 'nodeTypes.image',
  'source-image': 'nodeTypes.image',
  'ai-image': 'nodeTypes.aiImage',
  video: 'nodeTypes.video',
  'source-video': 'nodeTypes.video',
  'ai-video': 'nodeTypes.aiVideo',
  audio: 'nodeTypes.audio',
  'source-audio': 'nodeTypes.audio',
  'ai-audio': 'nodeTypes.aiAudio',
  comment: 'nodeTypes.note',
  note: 'nodeTypes.note',
  'comment-note': 'nodeTypes.note',
  debug: 'nodeTypes.debug',
  storyboard: 'nodeTypes.storyboard',
  'storyboard-script': 'nodeTypes.storyboardScript',
  'scene-detection': 'nodeTypes.scene',
  'panorama-scene': 'nodeTypes.panoramaScene',
  'panorama-360': 'nodeTypes.panorama360',
};
function workflowPreviewText(_0x4c05f1, _0x8fa9a2 = {}) {
  return t('workflows.preview.' + _0x4c05f1, _0x8fa9a2);
}
export function getWorkflowNodeTypeLabel(_0x467f35) {
  const _0x3ddc9d = cleanText(_0x467f35).toLowerCase();
  if (!_0x3ddc9d) return workflowPreviewText('nodeTypes.node');
  const _0xd4e67a = NODE_TYPE_LABEL_KEYS[_0x3ddc9d];
  return _0xd4e67a ? workflowPreviewText(_0xd4e67a) : _0x3ddc9d;
}
function getWorkflowNodePlaceholderLabel(_0x1802a0) {
  return getWorkflowNodeTypeLabel(_0x1802a0).replace(/^AI\s+/i, '') || workflowPreviewText('nodeTypes.node');
}
function getWorkflowNodeTitle(_0x3a4fb0) {
  return (
    cleanText(_0x3a4fb0?.name) ||
    cleanText(_0x3a4fb0?.title) ||
    cleanText(_0x3a4fb0?.fileName) ||
    cleanText(_0x3a4fb0?.label) ||
    getWorkflowNodeTypeLabel(_0x3a4fb0?.type)
  );
}
function getWorkflowTagForNode(_0x578101) {
  const _0x1eebb1 = cleanText(_0x578101?.type).toLowerCase(),
    _0x307620 = [
      _0x1eebb1,
      cleanText(_0x578101?.name),
      cleanText(_0x578101?.title),
      cleanText(_0x578101?.label),
      cleanText(_0x578101?.description),
    ]
      .join(' ')
      .toLowerCase();
  if (_0x307620.includes('matting') || _0x307620.includes('keying') || _0x307620.includes('抠图'))
    return workflowPreviewText('tags.matting');
  if (_0x1eebb1.includes('storyboard')) return workflowPreviewText('tags.storyboard');
  if (_0x1eebb1.includes('panorama') || _0x307620.includes('3d')) return '3D';
  if (_0x1eebb1.includes('scene')) return workflowPreviewText('tags.scene');
  if (_0x1eebb1.includes('video')) return workflowPreviewText('tags.video');
  if (_0x1eebb1.includes('audio')) return workflowPreviewText('tags.audio');
  if (_0x1eebb1.includes('image') || _0x1eebb1 === 'photo') return workflowPreviewText('tags.image');
  if (_0x1eebb1.includes('text') || _0x1eebb1.includes('comment') || _0x1eebb1.includes('note'))
    return workflowPreviewText('tags.text');
  return '';
}
function countByTypeLabel(_0x4e43d9) {
  const _0x586eea = new Map();
  for (const _0x3b72b6 of _0x4e43d9) {
    const _0x21ef51 = getWorkflowNodeTypeLabel(_0x3b72b6?.type);
    _0x586eea.set(_0x21ef51, (_0x586eea.get(_0x21ef51) || 0) + 1);
  }
  return [..._0x586eea.entries()]
    .map(([_0x687976, _0x1743d6]) => ({ label: _0x687976, count: _0x1743d6 }))
    .sort(
      (_0xe5c483, _0x46291d) =>
        _0x46291d.count - _0xe5c483.count || _0xe5c483.label.localeCompare(_0x46291d.label, getLocale()),
    );
}
function buildSuggestedTags(_0x3755b4, _0x9ff341 = 5) {
  const _0x2a5451 = [],
    _0x461249 = new Set();
  for (const _0x3ee56f of _0x3755b4) {
    const _0x15968b = getWorkflowTagForNode(_0x3ee56f);
    if (!_0x15968b || _0x461249.has(_0x15968b)) continue;
    (_0x461249.add(_0x15968b), _0x2a5451.push(_0x15968b));
    if (_0x2a5451.length >= _0x9ff341) break;
  }
  return _0x2a5451;
}
function appendWorkflowSuffix(_0x2b35da) {
  const _0x556c90 = cleanText(_0x2b35da);
  if (!_0x556c90) return '';
  if (getLocale() === 'en-US') {
    if (/\b(?:workflow|flow|template)\b/i.test(_0x556c90)) return _0x556c90;
    return workflowPreviewText('suggested.workflowName', { name: _0x556c90 });
  }
  if (/工作流|流程|模板/u.test(_0x556c90)) return _0x556c90;
  return workflowPreviewText('suggested.workflowName', { name: _0x556c90 });
}
function buildSuggestedName(_0x208854, _0x476590, _0x721d53 = {}) {
  const _0x3961ca = appendWorkflowSuffix(_0x721d53.sourceName);
  if (_0x3961ca) return truncateText(_0x3961ca, 50);
  const _0x267a7b = _0x208854.find((_0x4e500e) => {
      const _0x323e3b = getWorkflowNodeTitle(_0x4e500e),
        _0x5cf3ec = getWorkflowNodeTypeLabel(_0x4e500e?.type);
      return _0x323e3b && _0x323e3b !== _0x5cf3ec && cleanText(_0x4e500e?.type).toLowerCase() !== 'group';
    }),
    _0x304a97 = appendWorkflowSuffix(getWorkflowNodeTitle(_0x267a7b));
  if (_0x304a97) return truncateText(_0x304a97, 50);
  if (Array.isArray(_0x476590) && _0x476590.length > 0)
    return truncateText(
      workflowPreviewText('suggested.fromTags', {
        tags: _0x476590.slice(0, 2).join(workflowPreviewText('suggested.tagJoiner')),
      }),
      50,
    );
  if (_0x208854.length > 0) return workflowPreviewText('suggested.nodeFlow', { count: _0x208854.length });
  return workflowPreviewText('suggested.canvasWorkflow');
}
function getWorkflowNodeSummary(_0x19656a) {
  const _0x176c8b = [
    _0x19656a?.content,
    _0x19656a?.text,
    _0x19656a?.prompt,
    _0x19656a?.outputText,
    _0x19656a?.description,
    _0x19656a?.caption,
    _0x19656a?.subtitle,
    _0x19656a?.note,
  ];
  for (const _0x3126a8 of _0x176c8b) {
    const _0x1e9121 = truncateText(stripRichText(_0x3126a8));
    if (_0x1e9121) return _0x1e9121;
  }
  if (resolveWorkflowNodeThumbSrc(_0x19656a))
    return workflowPreviewText('hasContent', { label: getWorkflowNodePlaceholderLabel(_0x19656a?.type) });
  return '';
}
export function buildWorkflowContentPreviewItems(_0x2d1db4) {
  const _0x852a7c = toArray(_0x2d1db4?.workflowData?.nodes),
    _0x370154 = _0x852a7c.some((_0x159ffe) => cleanText(_0x159ffe?.type).toLowerCase() !== 'group')
      ? _0x852a7c.filter((_0x36778d) => cleanText(_0x36778d?.type).toLowerCase() !== 'group')
      : _0x852a7c;
  return _0x370154
    .filter((_0x44f1f3) => _0x44f1f3 && typeof _0x44f1f3 === 'object')
    .sort((_0x592b00, _0x3ef5c8) => {
      const _0x25e9a5 = Number(_0x592b00?.y) || 0,
        _0x325efe = Number(_0x3ef5c8?.y) || 0;
      if (_0x25e9a5 !== _0x325efe) return _0x25e9a5 - _0x325efe;
      const _0x4969d6 = Number(_0x592b00?.x) || 0,
        _0x39c318 = Number(_0x3ef5c8?.x) || 0;
      return _0x4969d6 - _0x39c318;
    })
    .map((_0x4ac1a9, _0x522b89) => {
      const _0x95abcc = getWorkflowNodeTypeLabel(_0x4ac1a9?.type);
      return {
        id: cleanText(_0x4ac1a9?.id) || (cleanText(_0x4ac1a9?.type) || 'node') + '-' + (_0x522b89 + 1),
        typeLabel: _0x95abcc,
        placeholderLabel: getWorkflowNodePlaceholderLabel(_0x4ac1a9?.type),
        title: truncateText(getWorkflowNodeTitle(_0x4ac1a9), 40),
        summary: getWorkflowNodeSummary(_0x4ac1a9),
        thumbSrc: resolveWorkflowNodeThumbSrc(_0x4ac1a9),
      };
    });
}
export function buildWorkflowSourceSummary(_0x1d733e, _0x5af067 = {}) {
  const _0x36936c =
      _0x1d733e?.workflowData && typeof _0x1d733e.workflowData === 'object'
        ? _0x1d733e.workflowData
        : _0x1d733e || {},
    _0x198961 = toArray(_0x36936c.nodes),
    _0x23f045 = _0x198961.some((_0x462895) => cleanText(_0x462895?.type).toLowerCase() !== 'group')
      ? _0x198961.filter((_0xf16c1b) => cleanText(_0xf16c1b?.type).toLowerCase() !== 'group')
      : _0x198961,
    _0x25518e = Array.isArray(_0x36936c.edges) ? _0x36936c.edges : [],
    _0x2b4e2b = countByTypeLabel(_0x23f045),
    _0x352d58 = buildSuggestedTags(_0x23f045),
    _0x3c2581 =
      cleanText(_0x5af067.sourceLabel) ||
      (_0x5af067.sourceGroupId
        ? workflowPreviewText('source.currentGroup')
        : workflowPreviewText('source.wholeCanvas')),
    _0x477520 = cleanText(_0x5af067.sourceName),
    _0x4fde83 = buildWorkflowContentPreviewItems({ workflowData: _0x36936c });
  return {
    sourceLabel: _0x3c2581,
    sourceName: _0x477520,
    sourceGroupId: cleanText(_0x5af067.sourceGroupId),
    nodeCount: _0x198961.length,
    contentNodeCount: _0x23f045.length,
    edgeCount: _0x25518e.length,
    isEmpty: _0x198961.length === 0,
    typeCounts: _0x2b4e2b,
    typeSummary: _0x2b4e2b.map((_0x168887) => _0x168887.label + ' ' + _0x168887.count).join(' · '),
    previewItems: _0x4fde83,
    suggestedName: buildSuggestedName(_0x23f045, _0x352d58, { sourceName: _0x477520 }),
    suggestedTags: _0x352d58,
  };
}
