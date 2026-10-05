import { localPathToUrl } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
import { calcWorkflowBounds } from './workflowCanvas.js';
export const DEFAULT_WORKFLOW_COVER_ID = '__workflow_default_cover__';
export const WORKFLOW_SNAPSHOT_COVER_ID = '__workflow_snapshot_cover__';
const SNAPSHOT_WIDTH = 640,
  SNAPSHOT_HEIGHT = 360,
  SNAPSHOT_FRAME = { x: 42, y: 74, width: 556, height: 244, padding: 28 },
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
function cleanText(value) {
  return String(value ?? '').trim();
}
function workflowCoverText(item, key = {}) {
  return t('workflows.covers.' + item, key);
}
function rgbToSvgColor(index, result, data) {
  return (
    '#' +
    [index, result, data]
      .map((item2) =>
        Math.max(0, Math.min(255, Number(item2) || 0))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
function fallbackSnapshotColor(options) {
  return rgbToSvgColor(...(SNAPSHOT_COLOR_FALLBACKS[options] || SNAPSHOT_COLOR_FALLBACKS.accentDefault));
}
function fallbackCssTokenColor(target) {
  const cleanText2 = cleanText(target),
    args = CSS_TOKEN_COLOR_FALLBACKS[cleanText2];
  if (args) return rgbToSvgColor(...args);
  const enabled = cleanText2.match(CSS_TOKEN_OPACITY_RE);
  if (!enabled) return '';
  const enabled2 = CSS_TOKEN_COLOR_FALLBACKS[enabled[1]];
  if (!enabled2) return '';
  const source = Math.max(0, Math.min(100, Number(enabled[2]) || 0)) / 100;
  return (
    CSS_RGBA_FUNCTION + '(' + enabled2[0] + ', ' + enabled2[1] + ', ' + enabled2[2] + ', ' + source + ')'
  );
}
function getRootComputedStyle() {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return null;
  return getComputedStyle(document.documentElement);
}
function resolveCssCustomProperty(next, enabled3, map = new Set()) {
  const cleanText3 = cleanText(next);
  if (!cleanText3 || !enabled3 || map.has(cleanText3)) return '';
  map.add(cleanText3);
  const cleanText4 = cleanText(enabled3.getPropertyValue(cleanText3));
  if (!cleanText4) return '';
  const enabled4 = cleanText4.match(CSS_CUSTOM_PROPERTY_RE);
  if (!enabled4) return cleanText4;
  return resolveCssCustomProperty(enabled4[1], enabled3, map) || cleanText(enabled4[2]);
}
function snapshotColor(current) {
  const fallbackSnapshotColor2 = fallbackSnapshotColor(current),
    entry = SNAPSHOT_COLOR_TOKENS[current],
    rootComputedStyle = getRootComputedStyle();
  return resolveCssCustomProperty(entry, rootComputedStyle) || fallbackSnapshotColor2;
}
function resolveSnapshotColorValue(record, payload = 'accentDefault', map2 = new Set()) {
  const cleanText5 = cleanText(record);
  if (!cleanText5) return snapshotColor(payload);
  const enabled5 = cleanText5.match(CSS_CUSTOM_PROPERTY_RE);
  if (!enabled5) return cleanText5;
  const handle = enabled5[1];
  if (map2.has(handle)) return fallbackSnapshotColor(payload);
  map2.add(handle);
  const cssCustomProperty = resolveCssCustomProperty(handle, getRootComputedStyle());
  if (cssCustomProperty) return resolveSnapshotColorValue(cssCustomProperty, payload, map2);
  const cleanText6 = cleanText(enabled5[2]);
  if (cleanText6) return resolveSnapshotColorValue(cleanText6, payload, map2);
  return fallbackCssTokenColor(handle) || fallbackSnapshotColor(payload);
}
function withOpacityToken(state, config) {
  const cleanText7 = cleanText(state).match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (!cleanText7) return state;
  return 'var(' + cleanText7[1] + '-' + config + ')';
}
function normalizeNodeList(scope) {
  return Array.isArray(scope) ? scope : scope && typeof scope === 'object' ? Object.values(scope) : [];
}
function normalizeEdgeList(input) {
  return Array.isArray(input) ? input : input && typeof input === 'object' ? Object.values(input) : [];
}
function escapeSvgText(output) {
  return cleanText(output).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function truncateSvgText(value2, value3 = 10) {
  const list = cleanText(value2);
  if (list.length <= value3) return list;
  return list.slice(0, value3 - 1) + '…';
}
function edgeSourceId(value4) {
  return cleanText(value4?.sourceId ?? value4?.source);
}
function edgeTargetId(event) {
  return cleanText(event?.targetId ?? event?.target);
}
function nodeTypeKey(value5) {
  return cleanText(value5?.type).toLowerCase();
}
function isGroupNode(value6) {
  return nodeTypeKey(value6) === 'group';
}
function nodeSize(box) {
  return {
    width: Math.max(24, Number(box?.width ?? box?.w) || 100),
    height: Math.max(24, Number(box?.height ?? box?.h) || 100),
  };
}
function nodePosition(box2) {
  return { x: Number(box2?.x) || 0, y: Number(box2?.y) || 0 };
}
function pickSnapshotTitle(list2, error = {}) {
  const cleanText8 = cleanText(error.title || error.name);
  if (cleanText8) return cleanText8;
  const error2 = list2.find((item3) => isGroupNode(item3) && !cleanText(item3?.parentId));
  return cleanText(error2?.name || error2?.title || error2?.label) || workflowCoverText('titleFallback');
}
function pickSnapshotGroupColor(list3, value7 = {}) {
  const cleanText9 = cleanText(value7.groupColor || value7.accentColor || value7.color);
  if (cleanText9) return cleanText9;
  const value8 = list3.find((item4) => isGroupNode(item4) && !cleanText(item4?.parentId));
  return cleanText(value8?.color);
}
function createSnapshotTheme(value9, value10 = {}) {
  const snapshotGroupColor = pickSnapshotGroupColor(value9, value10);
  if (!snapshotGroupColor)
    return {
      frameGlowStart: snapshotColor('frameGlowStart'),
      frameGlowEnd: snapshotColor('frameGlowEnd'),
      frameInnerStroke: snapshotColor('frameInnerStroke'),
      toolbarDotFill: snapshotColor('toolbarDotFill'),
      toolbarDotStroke: snapshotColor('toolbarDotStroke'),
      groupAccent: snapshotColor('accentGroup'),
    };
  const frameGlowStart = resolveSnapshotColorValue(snapshotGroupColor, 'accentGroup'),
    frameGlowEnd = resolveSnapshotColorValue(withOpacityToken(snapshotGroupColor, '60'), 'frameGlowEnd');
  return {
    frameGlowStart: frameGlowStart,
    frameGlowEnd: frameGlowEnd,
    frameInnerStroke: frameGlowStart,
    toolbarDotFill: frameGlowStart,
    toolbarDotStroke: frameGlowEnd,
    groupAccent: frameGlowStart,
  };
}
function pickNodeLabel(error3) {
  return (
    cleanText(error3?.name || error3?.title || error3?.label) ||
    pickNodeTypeLabel(error3) ||
    workflowCoverText('nodeTypes.node')
  );
}
function pickNodeTypeLabel(value11) {
  const list4 = nodeTypeKey(value11);
  if (list4.includes('video')) return workflowCoverText('nodeTypes.video');
  if (list4.includes('audio')) return workflowCoverText('nodeTypes.audio');
  if (list4.includes('image') || list4.includes('photo')) return workflowCoverText('nodeTypes.image');
  if (list4.includes('text') || list4.includes('prompt')) return workflowCoverText('nodeTypes.text');
  if (list4.includes('mask')) return workflowCoverText('nodeTypes.mask');
  if (list4.includes('group')) return workflowCoverText('nodeTypes.group');
  return workflowCoverText('nodeTypes.node');
}
function pickNodeAccent(value12, value13 = null) {
  const list5 = nodeTypeKey(value12);
  if (list5.includes('video')) return snapshotColor('accentVideo');
  if (list5.includes('audio')) return snapshotColor('accentAudio');
  if (list5.includes('text') || list5.includes('prompt')) return snapshotColor('accentText');
  if (list5.includes('image') || list5.includes('photo')) return snapshotColor('accentImage');
  if (list5.includes('mask')) return snapshotColor('accentMask');
  if (list5.includes('group'))
    return cleanText(value12?.color)
      ? resolveSnapshotColorValue(value12.color, 'accentGroup')
      : value13?.groupAccent || snapshotColor('accentGroup');
  return snapshotColor('accentDefault');
}
function projectNode(value14, value15, value16, box3) {
  const box4 = nodePosition(value14),
    box5 = nodeSize(value14),
    x = box3.x + (box4.x - value15.minX) * value16,
    y = box3.y + (box4.y - value15.minY) * value16,
    value17 = box5.width * value16,
    value18 = box5.height * value16,
    width = Math.max(48, value17),
    height = Math.max(34, value18);
  return {
    x: x - (width - value17) / 2,
    y: y - (height - value18) / 2,
    width: width,
    height: height,
    cx: x + value17 / 2,
    cy: y + value18 / 2,
  };
}
function renderSnapshotEdges(value19, map3) {
  const list6 = [];
  for (const value20 of value19) {
    const box6 = map3.get(edgeSourceId(value20)),
      box7 = map3.get(edgeTargetId(value20));
    if (!box6 || !box7) continue;
    const value21 = box6.x + box6.width,
      value22 = box6.y + box6.height / 2,
      value23 = box7.x,
      value24 = box7.y + box7.height / 2,
      value25 = Math.max(34, Math.abs(value23 - value21) * 0.45);
    list6.push(
      '<path d="M ' +
        value21.toFixed(1) +
        ' ' +
        value22.toFixed(1) +
        ' C ' +
        (value21 + value25).toFixed(1) +
        ' ' +
        value22.toFixed(1) +
        ', ' +
        (value23 - value25).toFixed(1) +
        ' ' +
        value24.toFixed(1) +
        ', ' +
        value23.toFixed(1) +
        ' ' +
        value24.toFixed(1) +
        '" fill="none" stroke="' +
        snapshotColor('edge') +
        '" stroke-width="2.2" stroke-linecap="round" opacity="0.72"/>',
    );
  }
  return list6.join('');
}
function renderSnapshotNodes(list7, map4, value26 = null) {
  return list7
    .map((item5) => {
      const cleanText10 = cleanText(item5?.id),
        box8 = map4.get(cleanText10);
      if (!box8) return '';
      const escapeSvgText2 = escapeSvgText(truncateSvgText(pickNodeLabel(item5), box8.width > 92 ? 12 : 8)),
        escapeSvgText3 = escapeSvgText(pickNodeTypeLabel(item5)),
        nodeAccent = pickNodeAccent(item5, value26),
        value27 = box8.y + 27,
        value28 = Math.max(8, box8.height - 37);
      return [
        '<g filter="url(#nodeShadow)">',
        '<rect x="' +
          box8.x.toFixed(1) +
          '" y="' +
          box8.y.toFixed(1) +
          '" width="' +
          box8.width.toFixed(1) +
          '" height="' +
          box8.height.toFixed(1) +
          '" rx="10" fill="' +
          snapshotColor('nodeFill') +
          '" stroke="' +
          snapshotColor('nodeStroke') +
          '" stroke-width="1"/>',
        '<rect x="' +
          (box8.x + 1).toFixed(1) +
          '" y="' +
          (box8.y + 1).toFixed(1) +
          '" width="' +
          (box8.width - 2).toFixed(1) +
          '" height="6" rx="5" fill="' +
          nodeAccent +
          '"/>',
        '<text x="' +
          (box8.x + 12).toFixed(1) +
          '" y="' +
          (box8.y + 22).toFixed(1) +
          '" fill="' +
          snapshotColor('nodeText') +
          '" font-size="12" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700">' +
          escapeSvgText2 +
          '</text>',
        '<rect x="' +
          (box8.x + 12).toFixed(1) +
          '" y="' +
          value27.toFixed(1) +
          '" width="' +
          Math.max(10, box8.width - 24).toFixed(1) +
          '" height="' +
          value28.toFixed(1) +
          '" rx="7" fill="' +
          snapshotColor('nodeContentFill') +
          '" opacity="0.76"/>',
        box8.width >= 70 && box8.height >= 54
          ? '<text x="' +
            (box8.x + 17).toFixed(1) +
            '" y="' +
            (value27 + 19).toFixed(1) +
            '" fill="' +
            snapshotColor('nodeTypeText') +
            '" font-size="10" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif">' +
            escapeSvgText3 +
            '</text>'
          : '',
        '</g>',
      ].join('');
    })
    .join('');
}
function createWorkflowSnapshotSvg(value29, value30 = {}) {
  const nodeCount = normalizeNodeList(value29?.nodes).filter(Boolean);
  if (nodeCount.length === 0) return '';
  const snapshotTheme = createSnapshotTheme(nodeCount, value30),
    edgeCount = normalizeEdgeList(value29?.edges),
    box9 = calcWorkflowBounds(nodeCount);
  if (!box9.width && !box9.height) return '';
  const list8 = nodeCount.filter((item6) => !isGroupNode(item6)),
    list9 = (list8.length > 0 ? list8 : nodeCount).slice(0, SNAPSHOT_MAX_NODES),
    map5 = new Set(list9.map((item7) => cleanText(item7?.id)).filter(Boolean)),
    value31 = edgeCount.filter((item8) => map5.has(edgeSourceId(item8)) && map5.has(edgeTargetId(item8))),
    value32 = SNAPSHOT_FRAME.width - SNAPSHOT_FRAME.padding * 2,
    value33 = SNAPSHOT_FRAME.height - SNAPSHOT_FRAME.padding * 2,
    value34 = Math.min(value32 / Math.max(box9.width, 1), value33 / Math.max(box9.height, 1), 1.45),
    value35 = box9.width * value34,
    value36 = box9.height * value34,
    value37 = {
      x: SNAPSHOT_FRAME.x + SNAPSHOT_FRAME.padding + (value32 - value35) / 2,
      y: SNAPSHOT_FRAME.y + SNAPSHOT_FRAME.padding + (value33 - value36) / 2,
    },
    map6 = new Map();
  for (const value38 of list9) {
    const cleanText11 = cleanText(value38?.id);
    if (!cleanText11) continue;
    map6.set(cleanText11, projectNode(value38, box9, value34, value37));
  }
  const escapeSvgText4 = escapeSvgText(truncateSvgText(pickSnapshotTitle(nodeCount, value30), 18)),
    workflowCoverText2 = workflowCoverText('summary', {
      nodeCount: nodeCount.length,
      edgeCount: edgeCount.length,
    });
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
    snapshotTheme.frameGlowStart +
    '"/>\n    <stop offset="1" stop-color="' +
    snapshotTheme.frameGlowEnd +
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
    escapeSvgText4 +
    '</text>\n<g opacity="0.92">\n  <rect x="252" y="28" width="136" height="44" rx="14" fill="' +
    snapshotColor('toolbarFill') +
    '" stroke="' +
    snapshotColor('toolbarStroke') +
    '" stroke-width="1.2"/>\n  <path d="M 280 42 L 280 58 L 294 50 Z" fill="none" stroke="' +
    snapshotColor('toolbarIcon') +
    '" stroke-width="2" stroke-linejoin="round"/>\n  <circle cx="320" cy="50" r="9" fill="' +
    snapshotTheme.toolbarDotFill +
    '" stroke="' +
    snapshotTheme.toolbarDotStroke +
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
    snapshotTheme.frameInnerStroke +
    '" stroke-width="1" opacity="0.9"/>\n<text x="' +
    (SNAPSHOT_FRAME.x + 26) +
    '" y="' +
    (SNAPSHOT_FRAME.y + 34) +
    '" fill="' +
    snapshotColor('summaryText') +
    '" font-size="15" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700">' +
    escapeSvgText(workflowCoverText2) +
    '</text>\n<g>' +
    renderSnapshotEdges(value31, map6) +
    renderSnapshotNodes(list9, map6, snapshotTheme) +
    '</g>\n</svg>'
  );
}
export function createWorkflowSnapshotCoverDataUrl(value39, value40 = {}) {
  const workflowSnapshotSvg = createWorkflowSnapshotSvg(value39, value40);
  if (!workflowSnapshotSvg) return '';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(workflowSnapshotSvg);
}
export function createWorkflowSnapshotCoverCandidate(value41, value42 = {}) {
  const src = createWorkflowSnapshotCoverDataUrl(value41, value42);
  if (!src) return null;
  return {
    id: WORKFLOW_SNAPSHOT_COVER_ID,
    src: src,
    nodeId: '',
    label: cleanText(value42.label) || workflowCoverText('snapshotLabel'),
  };
}
function normalizePath(value43) {
  const cleanText12 = cleanText(value43);
  if (!cleanText12) return '';
  if (
    cleanText12.startsWith('/') ||
    cleanText12.startsWith('data:') ||
    cleanText12.startsWith('blob:') ||
    /^https?:\/\//i.test(cleanText12)
  )
    return cleanText12;
  const url = localPathToUrl(cleanText12);
  return url || '/' + cleanText12.replace(/^\/+/, '');
}
function pickMediaSrc(response) {
  if (!response || typeof response !== 'object') return '';
  return normalizePath(
    response.localPath ||
      response.thumbLocalPath ||
      response.thumbUrl ||
      response.coverUrl ||
      response.poster ||
      response.imageUrl ||
      response.src ||
      response.url,
  );
}
function pickArrayMediaSrc(value44, value45, value46) {
  const list10 = Array.isArray(value44?.[value45]) ? value44[value45] : [];
  if (list10.length === 0) return '';
  const count = Number(value44?.[value46]),
    value47 = Number.isInteger(count) && count >= 0 ? list10[count] : null;
  return pickMediaSrc(value47) || pickMediaSrc(list10[0]);
}
function getCoverCandidatePriority(error4) {
  const list11 = cleanText(error4?.type).toLowerCase(),
    list12 = [list11, cleanText(error4?.name), cleanText(error4?.title), cleanText(error4?.label)]
      .join(' ')
      .toLowerCase();
  if (
    list11.startsWith('ai-') ||
    list11.includes('result') ||
    list12.includes('输出') ||
    list12.includes('生成')
  )
    return 0;
  if (list11.startsWith('source-') || list12.includes('输入') || list12.includes('参考')) return 1;
  return 2;
}
export function resolveWorkflowNodeThumbSrc(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return '';
  return (
    normalizePath(
      enabled6.localPath ||
        enabled6.thumbLocalPath ||
        enabled6.thumbUrl ||
        enabled6.coverUrl ||
        enabled6.thumbnailUrl ||
        enabled6.thumbnail ||
        enabled6.poster ||
        enabled6.src ||
        enabled6.imageUrl,
    ) ||
    pickArrayMediaSrc(enabled6, 'images', 'mainImageIndex') ||
    pickArrayMediaSrc(enabled6, 'videos', 'mainVideoIndex')
  );
}
export function extractWorkflowCoverCandidates(value48) {
  const nodeList = normalizeNodeList(value48),
    map7 = new Set(),
    index2 = [];
  for (const error5 of nodeList) {
    const src2 = resolveWorkflowNodeThumbSrc(error5);
    if (!src2 || map7.has(src2)) continue;
    (map7.add(src2),
      index2.push({
        id: 'cover-' + (index2.length + 1),
        src: src2,
        nodeId: cleanText(error5?.id),
        label: cleanText(error5?.name) || workflowCoverText('coverNodeLabel', { index: index2.length + 1 }),
        priority: getCoverCandidatePriority(error5),
        order: index2.length,
      }));
  }
  return index2
    .sort((item9, value49) => item9.priority - value49.priority || item9.order - value49.order)
    .map(({ priority: priority, order: order, ...args2 }) => args2);
}
export function getDefaultWorkflowCoverCandidate() {
  return { id: DEFAULT_WORKFLOW_COVER_ID, src: '', nodeId: '', label: 'updream canvas' };
}
export function isDataImageCover(value50) {
  return cleanText(value50).startsWith('data:image/');
}
export function isSvgDataImageCover(value51) {
  return /^data:image\/svg\+xml(?:[;,]|$)/i.test(cleanText(value51));
}
