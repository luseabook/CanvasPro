import { localPathToUrl } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
import { calcWorkflowBounds } from './workflowCanvas.js';
export const DEFAULT_WORKFLOW_COVER_ID = '__workflow_default_cover__';
export const WORKFLOW_SNAPSHOT_COVER_ID = '__workflow_snapshot_cover__';
const SNAPSHOT_WIDTH = 0x280,
  SNAPSHOT_HEIGHT = 0x168,
  SNAPSHOT_FRAME = { x: 42, y: 74, width: 0x22c, height: 244, padding: 28 },
  SNAPSHOT_MAX_NODES = 24,
  CSS_CUSTOM_PROPERTY_RE = /^var\(\s*(--[\w-]+)(?:\s*,\s*(.+))?\s*\)$/,
  CSS_TOKEN_OPACITY_RE = /^(--[\w-]+)-(\d{2})$/,
  CSS_RGBA_FUNCTION = 'rgba',
  SNAPSHOT_COLOR_TOKENS = Object.freeze({
    accentVideo: '--indigo-text',
    accentAudio: '--green',
    accentText: '--gold-text',
    accentImage: '--blue',
    accentMask: '--purple-bright',
    accentGroup: '--gold',
    accentDefault: '--group-slate',
    edge: '--edge-draft-stroke',
    nodeFill: '--bg-node',
    nodeStroke: '--stroke-14',
    nodeText: '--text-strong',
    nodeContentFill: '--bg-panel-dark',
    nodeTypeText: '--text-secondary',
    gridDot: '--stroke-08',
    shadow: '--black',
    frameGlowStart: '--gold-text',
    frameGlowEnd: '--gold',
    background: '--bg',
    titleText: '--text-strong',
    toolbarFill: '--surface-panel',
    toolbarStroke: '--stroke-14',
    toolbarIcon: '--text-secondary',
    toolbarDotFill: '--gold-text',
    toolbarDotStroke: '--gold',
    frameFill: '--surface-float',
    frameInnerStroke: '--gold-text',
    summaryText: '--text-secondary',
  }),
  SNAPSHOT_COLOR_FALLBACKS = Object.freeze({
    accentVideo: [124, 141, 246],
    accentAudio: [52, 194, 168],
    accentText: [240, 185, 74],
    accentImage: [94, 161, 255],
    accentMask: [214, 119, 255],
    accentGroup: [219, 143, 22],
    accentDefault: [139, 149, 167],
    edge: [104, 113, 129],
    nodeFill: [31, 35, 43],
    nodeStroke: [66, 74, 87],
    nodeText: [215, 220, 231],
    nodeContentFill: [17, 21, 27],
    nodeTypeText: [142, 151, 166],
    gridDot: [42, 48, 58],
    shadow: [0, 0, 0],
    frameGlowStart: [240, 165, 29],
    frameGlowEnd: [185, 110, 16],
    background: [16, 20, 27],
    titleText: [237, 241, 247],
    toolbarFill: [22, 26, 34],
    toolbarStroke: [48, 56, 70],
    toolbarIcon: [170, 178, 192],
    toolbarDotFill: [241, 167, 39],
    toolbarDotStroke: [138, 92, 16],
    frameFill: [23, 26, 31],
    frameInnerStroke: [244, 178, 59],
    summaryText: [141, 150, 166],
  }),
  CSS_TOKEN_COLOR_FALLBACKS = Object.freeze({
    '--indigo': [99, 102, 241],
    '--green': [16, 185, 129],
    '--gold': [245, 158, 11],
    '--red': [239, 68, 68],
    '--purple': [139, 92, 246],
    '--group-pink': [236, 72, 153],
    '--group-slate': [100, 116, 139],
    '--cyan': [6, 182, 212],
  });
function cleanText(_0x3730db) {
  return String(_0x3730db ?? '').trim();
}
function workflowCoverText(_0x1561e7, _0x47bb96 = {}) {
  return t('workflows.covers.' + _0x1561e7, _0x47bb96);
}
function rgbToSvgColor(_0x265b18, _0x28efaa, _0x4110df) {
  return (
    '#' +
    [_0x265b18, _0x28efaa, _0x4110df]
      .map((_0x5539fa) =>
        Math.max(0, Math.min(255, Number(_0x5539fa) || 0))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
function fallbackSnapshotColor(_0x407681) {
  return rgbToSvgColor(...(SNAPSHOT_COLOR_FALLBACKS[_0x407681] || SNAPSHOT_COLOR_FALLBACKS.accentDefault));
}
function fallbackCssTokenColor(_0x3fa75c) {
  const _0xfd4ad3 = cleanText(_0x3fa75c),
    _0x32f398 = CSS_TOKEN_COLOR_FALLBACKS[_0xfd4ad3];
  if (_0x32f398) return rgbToSvgColor(..._0x32f398);
  const _0xa3051e = _0xfd4ad3.match(CSS_TOKEN_OPACITY_RE);
  if (!_0xa3051e) return '';
  const _0x26940c = CSS_TOKEN_COLOR_FALLBACKS[_0xa3051e[1]];
  if (!_0x26940c) return '';
  const _0x4e4284 = Math.max(0, Math.min(100, Number(_0xa3051e[2]) || 0)) / 100;
  return (
    CSS_RGBA_FUNCTION +
    '(' +
    _0x26940c[0] +
    ', ' +
    _0x26940c[1] +
    ', ' +
    _0x26940c[2] +
    ', ' +
    _0x4e4284 +
    ')'
  );
}
function getRootComputedStyle() {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return null;
  return getComputedStyle(document.documentElement);
}
function resolveCssCustomProperty(_0xee6d88, _0xa1e9f5, _0x5134cc = new Set()) {
  const _0x4fae1c = cleanText(_0xee6d88);
  if (!_0x4fae1c || !_0xa1e9f5 || _0x5134cc.has(_0x4fae1c)) return '';
  _0x5134cc.add(_0x4fae1c);
  const _0x184b96 = cleanText(_0xa1e9f5.getPropertyValue(_0x4fae1c));
  if (!_0x184b96) return '';
  const _0x28dafd = _0x184b96.match(CSS_CUSTOM_PROPERTY_RE);
  if (!_0x28dafd) return _0x184b96;
  return resolveCssCustomProperty(_0x28dafd[1], _0xa1e9f5, _0x5134cc) || cleanText(_0x28dafd[2]);
}
function snapshotColor(_0x2b50b7) {
  const _0x35c349 = fallbackSnapshotColor(_0x2b50b7),
    _0x2a6ab5 = SNAPSHOT_COLOR_TOKENS[_0x2b50b7],
    _0x3c4c70 = getRootComputedStyle();
  return resolveCssCustomProperty(_0x2a6ab5, _0x3c4c70) || _0x35c349;
}
function resolveSnapshotColorValue(_0x1dd4dc, _0x4b3cac = 'accentDefault', _0x21cdd2 = new Set()) {
  const _0x2b41bf = cleanText(_0x1dd4dc);
  if (!_0x2b41bf) return snapshotColor(_0x4b3cac);
  const _0xbbce22 = _0x2b41bf.match(CSS_CUSTOM_PROPERTY_RE);
  if (!_0xbbce22) return _0x2b41bf;
  const _0x2e8b2c = _0xbbce22[1];
  if (_0x21cdd2.has(_0x2e8b2c)) return fallbackSnapshotColor(_0x4b3cac);
  _0x21cdd2.add(_0x2e8b2c);
  const _0x3f49f1 = resolveCssCustomProperty(_0x2e8b2c, getRootComputedStyle());
  if (_0x3f49f1) return resolveSnapshotColorValue(_0x3f49f1, _0x4b3cac, _0x21cdd2);
  const _0x54ddd8 = cleanText(_0xbbce22[2]);
  if (_0x54ddd8) return resolveSnapshotColorValue(_0x54ddd8, _0x4b3cac, _0x21cdd2);
  return fallbackCssTokenColor(_0x2e8b2c) || fallbackSnapshotColor(_0x4b3cac);
}
function withOpacityToken(_0x3edb18, _0x4915c9) {
  const _0x437faa = cleanText(_0x3edb18).match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (!_0x437faa) return _0x3edb18;
  return 'var(' + _0x437faa[1] + '-' + _0x4915c9 + ')';
}
function normalizeNodeList(_0x337a92) {
  return Array.isArray(_0x337a92)
    ? _0x337a92
    : _0x337a92 && typeof _0x337a92 === 'object'
      ? Object.values(_0x337a92)
      : [];
}
function normalizeEdgeList(_0x1e682d) {
  return Array.isArray(_0x1e682d)
    ? _0x1e682d
    : _0x1e682d && typeof _0x1e682d === 'object'
      ? Object.values(_0x1e682d)
      : [];
}
function escapeSvgText(_0x5ccbb3) {
  return cleanText(_0x5ccbb3).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function truncateSvgText(_0x3ece3e, _0x109da5 = 10) {
  const _0x561d1c = cleanText(_0x3ece3e);
  if (_0x561d1c.length <= _0x109da5) return _0x561d1c;
  return _0x561d1c.slice(0, _0x109da5 - 1) + '…';
}
function edgeSourceId(_0x3f2e09) {
  return cleanText(_0x3f2e09?.sourceId ?? _0x3f2e09?.source);
}
function edgeTargetId(_0x278dfc) {
  return cleanText(_0x278dfc?.targetId ?? _0x278dfc?.target);
}
function nodeTypeKey(_0x17e666) {
  return cleanText(_0x17e666?.type).toLowerCase();
}
function isGroupNode(_0x12c636) {
  return nodeTypeKey(_0x12c636) === 'group';
}
function nodeSize(_0x514881) {
  return {
    width: Math.max(24, Number(_0x514881?.width ?? _0x514881?.w) || 100),
    height: Math.max(24, Number(_0x514881?.height ?? _0x514881?.h) || 100),
  };
}
function nodePosition(_0x588268) {
  return { x: Number(_0x588268?.x) || 0, y: Number(_0x588268?.y) || 0 };
}
function pickSnapshotTitle(_0x313a0a, _0x57e1b4 = {}) {
  const _0x1b16c8 = cleanText(_0x57e1b4.title || _0x57e1b4.name);
  if (_0x1b16c8) return _0x1b16c8;
  const _0x332e24 = _0x313a0a.find((_0x4d38b1) => isGroupNode(_0x4d38b1) && !cleanText(_0x4d38b1?.parentId));
  return (
    cleanText(_0x332e24?.name || _0x332e24?.title || _0x332e24?.label) || workflowCoverText('titleFallback')
  );
}
function pickSnapshotGroupColor(_0x11522e, _0x1b6dd3 = {}) {
  const _0x4f2da4 = cleanText(_0x1b6dd3.groupColor || _0x1b6dd3.accentColor || _0x1b6dd3.color);
  if (_0x4f2da4) return _0x4f2da4;
  const _0x45a1a8 = _0x11522e.find((_0x14d75f) => isGroupNode(_0x14d75f) && !cleanText(_0x14d75f?.parentId));
  return cleanText(_0x45a1a8?.color);
}
function createSnapshotTheme(_0x331153, _0x3f0e02 = {}) {
  const _0x4569d6 = pickSnapshotGroupColor(_0x331153, _0x3f0e02);
  if (!_0x4569d6)
    return {
      frameGlowStart: snapshotColor('frameGlowStart'),
      frameGlowEnd: snapshotColor('frameGlowEnd'),
      frameInnerStroke: snapshotColor('frameInnerStroke'),
      toolbarDotFill: snapshotColor('toolbarDotFill'),
      toolbarDotStroke: snapshotColor('toolbarDotStroke'),
      groupAccent: snapshotColor('accentGroup'),
    };
  const _0x56ae1b = resolveSnapshotColorValue(_0x4569d6, 'accentGroup'),
    _0x44dec2 = resolveSnapshotColorValue(withOpacityToken(_0x4569d6, '60'), 'frameGlowEnd');
  return {
    frameGlowStart: _0x56ae1b,
    frameGlowEnd: _0x44dec2,
    frameInnerStroke: _0x56ae1b,
    toolbarDotFill: _0x56ae1b,
    toolbarDotStroke: _0x44dec2,
    groupAccent: _0x56ae1b,
  };
}
function pickNodeLabel(_0xa41d33) {
  return (
    cleanText(_0xa41d33?.name || _0xa41d33?.title || _0xa41d33?.label) ||
    pickNodeTypeLabel(_0xa41d33) ||
    workflowCoverText('nodeTypes.node')
  );
}
function pickNodeTypeLabel(_0x10110c) {
  const _0x2bd603 = nodeTypeKey(_0x10110c);
  if (_0x2bd603.includes('video')) return workflowCoverText('nodeTypes.video');
  if (_0x2bd603.includes('audio')) return workflowCoverText('nodeTypes.audio');
  if (_0x2bd603.includes('image') || _0x2bd603.includes('photo')) return workflowCoverText('nodeTypes.image');
  if (_0x2bd603.includes('text') || _0x2bd603.includes('prompt')) return workflowCoverText('nodeTypes.text');
  if (_0x2bd603.includes('mask')) return workflowCoverText('nodeTypes.mask');
  if (_0x2bd603.includes('group')) return workflowCoverText('nodeTypes.group');
  return workflowCoverText('nodeTypes.node');
}
function pickNodeAccent(_0x51bc6b, _0xc0a069 = null) {
  const _0x486148 = nodeTypeKey(_0x51bc6b);
  if (_0x486148.includes('video')) return snapshotColor('accentVideo');
  if (_0x486148.includes('audio')) return snapshotColor('accentAudio');
  if (_0x486148.includes('text') || _0x486148.includes('prompt')) return snapshotColor('accentText');
  if (_0x486148.includes('image') || _0x486148.includes('photo')) return snapshotColor('accentImage');
  if (_0x486148.includes('mask')) return snapshotColor('accentMask');
  if (_0x486148.includes('group'))
    return cleanText(_0x51bc6b?.color)
      ? resolveSnapshotColorValue(_0x51bc6b.color, 'accentGroup')
      : _0xc0a069?.groupAccent || snapshotColor('accentGroup');
  return snapshotColor('accentDefault');
}
function projectNode(_0x10303f, _0x3c86af, _0x20f2a3, _0x2f7ac4) {
  const _0xbf6404 = nodePosition(_0x10303f),
    _0x187baa = nodeSize(_0x10303f),
    _0x409d9f = _0x2f7ac4.x + (_0xbf6404.x - _0x3c86af.minX) * _0x20f2a3,
    _0x1f0085 = _0x2f7ac4.y + (_0xbf6404.y - _0x3c86af.minY) * _0x20f2a3,
    _0x3b22bc = _0x187baa.width * _0x20f2a3,
    _0x59c0e4 = _0x187baa.height * _0x20f2a3,
    _0x1f9783 = Math.max(48, _0x3b22bc),
    _0x290949 = Math.max(34, _0x59c0e4);
  return {
    x: _0x409d9f - (_0x1f9783 - _0x3b22bc) / 2,
    y: _0x1f0085 - (_0x290949 - _0x59c0e4) / 2,
    width: _0x1f9783,
    height: _0x290949,
    cx: _0x409d9f + _0x3b22bc / 2,
    cy: _0x1f0085 + _0x59c0e4 / 2,
  };
}
function renderSnapshotEdges(_0x73a84e, _0x58c083) {
  const _0x3255bd = [];
  for (const _0x308540 of _0x73a84e) {
    const _0x14e1dd = _0x58c083.get(edgeSourceId(_0x308540)),
      _0xda0e55 = _0x58c083.get(edgeTargetId(_0x308540));
    if (!_0x14e1dd || !_0xda0e55) continue;
    const _0x1eb6b7 = _0x14e1dd.x + _0x14e1dd.width,
      _0x1670b4 = _0x14e1dd.y + _0x14e1dd.height / 2,
      _0x41bedc = _0xda0e55.x,
      _0x1f59e5 = _0xda0e55.y + _0xda0e55.height / 2,
      _0x2cd6be = Math.max(34, Math.abs(_0x41bedc - _0x1eb6b7) * 0.45);
    _0x3255bd.push(
      '<path d="M ' +
        _0x1eb6b7.toFixed(1) +
        ' ' +
        _0x1670b4.toFixed(1) +
        ' C ' +
        (_0x1eb6b7 + _0x2cd6be).toFixed(1) +
        ' ' +
        _0x1670b4.toFixed(1) +
        ', ' +
        (_0x41bedc - _0x2cd6be).toFixed(1) +
        ' ' +
        _0x1f59e5.toFixed(1) +
        ', ' +
        _0x41bedc.toFixed(1) +
        ' ' +
        _0x1f59e5.toFixed(1) +
        '" fill="none" stroke="' +
        snapshotColor('edge') +
        '" stroke-width="2.2" stroke-linecap="round" opacity="0.72"/>',
    );
  }
  return _0x3255bd.join('');
}
function renderSnapshotNodes(_0x2df368, _0x205150, _0x15dd47 = null) {
  return _0x2df368
    .map((_0x1b458c) => {
      const _0x2934fe = cleanText(_0x1b458c?.id),
        _0x30682a = _0x205150.get(_0x2934fe);
      if (!_0x30682a) return '';
      const _0x5b6402 = escapeSvgText(
          truncateSvgText(pickNodeLabel(_0x1b458c), _0x30682a.width > 92 ? 12 : 8),
        ),
        _0x30e210 = escapeSvgText(pickNodeTypeLabel(_0x1b458c)),
        _0x3c0f51 = pickNodeAccent(_0x1b458c, _0x15dd47),
        _0x26b0fa = _0x30682a.y + 27,
        _0x1a21d0 = Math.max(8, _0x30682a.height - 37);
      return [
        '<g filter="url(#nodeShadow)">',
        '<rect x="' +
          _0x30682a.x.toFixed(1) +
          '" y="' +
          _0x30682a.y.toFixed(1) +
          '" width="' +
          _0x30682a.width.toFixed(1) +
          '" height="' +
          _0x30682a.height.toFixed(1) +
          '" rx="10" fill="' +
          snapshotColor('nodeFill') +
          '" stroke="' +
          snapshotColor('nodeStroke') +
          '" stroke-width="1"/>',
        '<rect x="' +
          (_0x30682a.x + 1).toFixed(1) +
          '" y="' +
          (_0x30682a.y + 1).toFixed(1) +
          '" width="' +
          (_0x30682a.width - 2).toFixed(1) +
          '" height="6" rx="5" fill="' +
          _0x3c0f51 +
          '"/>',
        '<text x="' +
          (_0x30682a.x + 12).toFixed(1) +
          '" y="' +
          (_0x30682a.y + 22).toFixed(1) +
          '" fill="' +
          snapshotColor('nodeText') +
          '" font-size="12" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700">' +
          _0x5b6402 +
          '</text>',
        '<rect x="' +
          (_0x30682a.x + 12).toFixed(1) +
          '" y="' +
          _0x26b0fa.toFixed(1) +
          '" width="' +
          Math.max(10, _0x30682a.width - 24).toFixed(1) +
          '" height="' +
          _0x1a21d0.toFixed(1) +
          '" rx="7" fill="' +
          snapshotColor('nodeContentFill') +
          '" opacity="0.76"/>',
        _0x30682a.width >= 70 && _0x30682a.height >= 54
          ? '<text x="' +
            (_0x30682a.x + 17).toFixed(1) +
            '" y="' +
            (_0x26b0fa + 19).toFixed(1) +
            '" fill="' +
            snapshotColor('nodeTypeText') +
            '" font-size="10" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif">' +
            _0x30e210 +
            '</text>'
          : '',
        '</g>',
      ].join('');
    })
    .join('');
}
function createWorkflowSnapshotSvg(_0x364c62, _0x2e4ce3 = {}) {
  const _0x19809e = normalizeNodeList(_0x364c62?.nodes).filter(Boolean);
  if (_0x19809e.length === 0) return '';
  const _0xcc6ff2 = createSnapshotTheme(_0x19809e, _0x2e4ce3),
    _0x839578 = normalizeEdgeList(_0x364c62?.edges),
    _0x53dc6c = calcWorkflowBounds(_0x19809e);
  if (!_0x53dc6c.width && !_0x53dc6c.height) return '';
  const _0x1bc78c = _0x19809e.filter((_0x2c010a) => !isGroupNode(_0x2c010a)),
    _0x293651 = (_0x1bc78c.length > 0 ? _0x1bc78c : _0x19809e).slice(0, SNAPSHOT_MAX_NODES),
    _0x3e61d2 = new Set(_0x293651.map((_0x44a7df) => cleanText(_0x44a7df?.id)).filter(Boolean)),
    _0xd2f1d8 = _0x839578.filter(
      (_0x181320) => _0x3e61d2.has(edgeSourceId(_0x181320)) && _0x3e61d2.has(edgeTargetId(_0x181320)),
    ),
    _0x475b90 = SNAPSHOT_FRAME.width - SNAPSHOT_FRAME.padding * 2,
    _0x4d77e9 = SNAPSHOT_FRAME.height - SNAPSHOT_FRAME.padding * 2,
    _0x2fd046 = Math.min(
      _0x475b90 / Math.max(_0x53dc6c.width, 1),
      _0x4d77e9 / Math.max(_0x53dc6c.height, 1),
      1.45,
    ),
    _0x290d5e = _0x53dc6c.width * _0x2fd046,
    _0x18f102 = _0x53dc6c.height * _0x2fd046,
    _0x20302e = {
      x: SNAPSHOT_FRAME.x + SNAPSHOT_FRAME.padding + (_0x475b90 - _0x290d5e) / 2,
      y: SNAPSHOT_FRAME.y + SNAPSHOT_FRAME.padding + (_0x4d77e9 - _0x18f102) / 2,
    },
    _0x28a3e0 = new Map();
  for (const _0x39cebb of _0x293651) {
    const _0x5788f1 = cleanText(_0x39cebb?.id);
    if (!_0x5788f1) continue;
    _0x28a3e0.set(_0x5788f1, projectNode(_0x39cebb, _0x53dc6c, _0x2fd046, _0x20302e));
  }
  const _0x44fe54 = escapeSvgText(truncateSvgText(pickSnapshotTitle(_0x19809e, _0x2e4ce3), 18)),
    _0x303441 = workflowCoverText('summary', { nodeCount: _0x19809e.length, edgeCount: _0x839578.length });
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    SNAPSHOT_WIDTH +
    '" height="' +
    SNAPSHOT_HEIGHT +
    '" viewBox="0 0 ' +
    SNAPSHOT_WIDTH +
    ' ' +
    SNAPSHOT_HEIGHT +
    '" role="img" aria-label="workflow snapshot">\n<defs>\n  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">\n    <circle cx="2" cy="2" r="1.2" fill="' +
    snapshotColor('gridDot') +
    '" opacity="0.72"/>\n  </pattern>\n  <filter id="nodeShadow" x="-16%" y="-20%" width="132%" height="140%">\n    <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="' +
    snapshotColor('shadow') +
    '" flood-opacity="0.25"/>\n  </filter>\n  <linearGradient id="frameGlow" x1="0" x2="1" y1="0" y2="1">\n    <stop offset="0" stop-color="' +
    _0xcc6ff2.frameGlowStart +
    '"/>\n    <stop offset="1" stop-color="' +
    _0xcc6ff2.frameGlowEnd +
    '"/>\n  </linearGradient>\n</defs>\n<rect width="' +
    SNAPSHOT_WIDTH +
    '" height="' +
    SNAPSHOT_HEIGHT +
    '" fill="' +
    snapshotColor('background') +
    '"/>\n<rect width="' +
    SNAPSHOT_WIDTH +
    '" height="' +
    SNAPSHOT_HEIGHT +
    '" fill="url(#grid)"/>\n<text x="52" y="48" fill="' +
    snapshotColor('titleText') +
    '" font-size="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="800">' +
    _0x44fe54 +
    '</text>\n<g opacity="0.92">\n  <rect x="252" y="28" width="136" height="44" rx="14" fill="' +
    snapshotColor('toolbarFill') +
    '" stroke="' +
    snapshotColor('toolbarStroke') +
    '" stroke-width="1.2"/>\n  <path d="M 280 42 L 280 58 L 294 50 Z" fill="none" stroke="' +
    snapshotColor('toolbarIcon') +
    '" stroke-width="2" stroke-linejoin="round"/>\n  <circle cx="320" cy="50" r="9" fill="' +
    _0xcc6ff2.toolbarDotFill +
    '" stroke="' +
    _0xcc6ff2.toolbarDotStroke +
    '" stroke-width="2"/>\n  <rect x="352" y="41" width="18" height="18" rx="2" fill="none" stroke="' +
    snapshotColor('toolbarIcon') +
    '" stroke-width="2"/>\n</g>\n<rect x="' +
    SNAPSHOT_FRAME.x +
    '" y="' +
    SNAPSHOT_FRAME.y +
    '" width="' +
    SNAPSHOT_FRAME.width +
    '" height="' +
    SNAPSHOT_FRAME.height +
    '" rx="18" fill="' +
    snapshotColor('frameFill') +
    '" fill-opacity="0.9" stroke="url(#frameGlow)" stroke-width="8"/>\n<rect x="' +
    (SNAPSHOT_FRAME.x + 6) +
    '" y="' +
    (SNAPSHOT_FRAME.y + 6) +
    '" width="' +
    (SNAPSHOT_FRAME.width - 12) +
    '" height="' +
    (SNAPSHOT_FRAME.height - 12) +
    '" rx="13" fill="none" stroke="' +
    _0xcc6ff2.frameInnerStroke +
    '" stroke-width="1" opacity="0.9"/>\n<text x="' +
    (SNAPSHOT_FRAME.x + 26) +
    '" y="' +
    (SNAPSHOT_FRAME.y + 34) +
    '" fill="' +
    snapshotColor('summaryText') +
    '" font-size="15" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700">' +
    escapeSvgText(_0x303441) +
    '</text>\n<g>' +
    renderSnapshotEdges(_0xd2f1d8, _0x28a3e0) +
    renderSnapshotNodes(_0x293651, _0x28a3e0, _0xcc6ff2) +
    '</g>\n</svg>'
  );
}
export function createWorkflowSnapshotCoverDataUrl(_0x249052, _0x44eb2c = {}) {
  const _0x1ec829 = createWorkflowSnapshotSvg(_0x249052, _0x44eb2c);
  if (!_0x1ec829) return '';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(_0x1ec829);
}
export function createWorkflowSnapshotCoverCandidate(_0x21b9d9, _0x2e302b = {}) {
  const _0x4bfbe1 = createWorkflowSnapshotCoverDataUrl(_0x21b9d9, _0x2e302b);
  if (!_0x4bfbe1) return null;
  return {
    id: WORKFLOW_SNAPSHOT_COVER_ID,
    src: _0x4bfbe1,
    nodeId: '',
    label: cleanText(_0x2e302b.label) || workflowCoverText('snapshotLabel'),
  };
}
function normalizePath(_0x1b7b18) {
  const _0x185c51 = cleanText(_0x1b7b18);
  if (!_0x185c51) return '';
  if (
    _0x185c51.startsWith('/') ||
    _0x185c51.startsWith('data:') ||
    _0x185c51.startsWith('blob:') ||
    /^https?:\/\//i.test(_0x185c51)
  )
    return _0x185c51;
  const _0x5728f2 = localPathToUrl(_0x185c51);
  return _0x5728f2 || '/' + _0x185c51.replace(/^\/+/, '');
}
function pickMediaSrc(_0x47855a) {
  if (!_0x47855a || typeof _0x47855a !== 'object') return '';
  return normalizePath(
    _0x47855a.localPath ||
      _0x47855a.thumbLocalPath ||
      _0x47855a.thumbUrl ||
      _0x47855a.coverUrl ||
      _0x47855a.poster ||
      _0x47855a.imageUrl ||
      _0x47855a.src ||
      _0x47855a.url,
  );
}
function pickArrayMediaSrc(_0x48add4, _0x2f99ed, _0x226bd0) {
  const _0x10bf35 = Array.isArray(_0x48add4?.[_0x2f99ed]) ? _0x48add4[_0x2f99ed] : [];
  if (_0x10bf35.length === 0) return '';
  const _0x165bc9 = Number(_0x48add4?.[_0x226bd0]),
    _0x40eb3e = Number.isInteger(_0x165bc9) && _0x165bc9 >= 0 ? _0x10bf35[_0x165bc9] : null;
  return pickMediaSrc(_0x40eb3e) || pickMediaSrc(_0x10bf35[0]);
}
function getCoverCandidatePriority(_0x446de4) {
  const _0x5a33b3 = cleanText(_0x446de4?.type).toLowerCase(),
    _0x4dc406 = [
      _0x5a33b3,
      cleanText(_0x446de4?.name),
      cleanText(_0x446de4?.title),
      cleanText(_0x446de4?.label),
    ]
      .join(' ')
      .toLowerCase();
  if (
    _0x5a33b3.startsWith('ai-') ||
    _0x5a33b3.includes('result') ||
    _0x4dc406.includes('输出') ||
    _0x4dc406.includes('生成')
  )
    return 0;
  if (_0x5a33b3.startsWith('source-') || _0x4dc406.includes('输入') || _0x4dc406.includes('参考')) return 1;
  return 2;
}
export function resolveWorkflowNodeThumbSrc(_0x347aa1) {
  if (!_0x347aa1 || typeof _0x347aa1 !== 'object') return '';
  return (
    normalizePath(
      _0x347aa1.localPath ||
        _0x347aa1.thumbLocalPath ||
        _0x347aa1.thumbUrl ||
        _0x347aa1.coverUrl ||
        _0x347aa1.thumbnailUrl ||
        _0x347aa1.thumbnail ||
        _0x347aa1.poster ||
        _0x347aa1.src ||
        _0x347aa1.imageUrl,
    ) ||
    pickArrayMediaSrc(_0x347aa1, 'images', 'mainImageIndex') ||
    pickArrayMediaSrc(_0x347aa1, 'videos', 'mainVideoIndex')
  );
}
export function extractWorkflowCoverCandidates(_0x4072d4) {
  const _0x5adf60 = normalizeNodeList(_0x4072d4),
    _0x2e34b5 = new Set(),
    _0x5c9aa4 = [];
  for (const _0x56be6b of _0x5adf60) {
    const _0x111eb3 = resolveWorkflowNodeThumbSrc(_0x56be6b);
    if (!_0x111eb3 || _0x2e34b5.has(_0x111eb3)) continue;
    (_0x2e34b5.add(_0x111eb3),
      _0x5c9aa4.push({
        id: 'cover-' + (_0x5c9aa4.length + 1),
        src: _0x111eb3,
        nodeId: cleanText(_0x56be6b?.id),
        label:
          cleanText(_0x56be6b?.name) || workflowCoverText('coverNodeLabel', { index: _0x5c9aa4.length + 1 }),
        priority: getCoverCandidatePriority(_0x56be6b),
        order: _0x5c9aa4.length,
      }));
  }
  return _0x5c9aa4
    .sort(
      (_0x2b4987, _0x557daf) => _0x2b4987.priority - _0x557daf.priority || _0x2b4987.order - _0x557daf.order,
    )
    .map(({ priority: _0x26c83f, order: _0x198c28, ..._0x3c12fb }) => _0x3c12fb);
}
export function getDefaultWorkflowCoverCandidate() {
  return { id: DEFAULT_WORKFLOW_COVER_ID, src: '', nodeId: '', label: 'updream canvas' };
}
export function isDataImageCover(_0x6ce797) {
  return cleanText(_0x6ce797).startsWith('data:image/');
}
export function isSvgDataImageCover(_0x528cbd) {
  return /^data:image\/svg\+xml(?:[;,]|$)/i.test(cleanText(_0x528cbd));
}
