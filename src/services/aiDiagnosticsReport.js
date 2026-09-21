import { getCanvasMediaSchedulerStats } from '../modules/canvasMediaScheduler.js';
import { getPerfProbeSnapshot } from '../modules/perf/perfProbe.js';
const REPORT_SCHEMA_VERSION = 1,
  MAX_DIAGNOSTIC_NODES = 12,
  MAX_LIST_ITEMS = 6,
  MAX_DOM_MEDIA = 8;
function toText(_0x4e606e) {
  return String(_0x4e606e || '').trim();
}
function toNumber(_0x1a9571, _0x13ac32 = 0) {
  const _0x5117b8 = Number(_0x1a9571);
  return Number.isFinite(_0x5117b8) ? _0x5117b8 : _0x13ac32;
}
function normalizeIndex(_0x49c77c, _0x2c094c = Infinity) {
  const _0x202f70 = Math.max(0, Math.trunc(toNumber(_0x49c77c, 0)));
  if (!Number.isFinite(_0x2c094c)) return _0x202f70;
  return Math.min(Math.max(0, _0x2c094c - 1), _0x202f70);
}
function hashText(_0x3da42b) {
  const _0x49f379 = toText(_0x3da42b);
  let _0x5ddad9 = 0x811c9dc5;
  for (let _0xe72b89 = 0; _0xe72b89 < _0x49f379.length; _0xe72b89 += 1) {
    ((_0x5ddad9 ^= _0x49f379.charCodeAt(_0xe72b89)), (_0x5ddad9 = Math.imul(_0x5ddad9, 0x1000193)));
  }
  return (_0x5ddad9 >>> 0).toString(36);
}
function normalizeComparableRef(_0x4ca756) {
  let _0x1a1a8c = toText(_0x4ca756).replace(/\\/g, '/');
  if (!_0x1a1a8c) return '';
  try {
    _0x1a1a8c = decodeURIComponent(_0x1a1a8c);
  } catch {}
  return (
    (_0x1a1a8c = _0x1a1a8c.split('#')[0].split('?')[0].replace(/\\/g, '/').toLowerCase()),
    (_0x1a1a8c = _0x1a1a8c.replace(/^https?:\/\/[^/]+\//, '')),
    (_0x1a1a8c = _0x1a1a8c.replace(/^file:\/\/\/?/, '')),
    (_0x1a1a8c = _0x1a1a8c.replace(/^\/+/, '')),
    _0x1a1a8c
  );
}
function getRefKind(_0x461d5d) {
  const _0x49b53b = toText(_0x461d5d);
  if (!_0x49b53b) return 'empty';
  if (/^data:/i.test(_0x49b53b)) return 'data';
  if (/^blob:/i.test(_0x49b53b)) return 'blob';
  if (/^aic-local-preview:/i.test(_0x49b53b)) return 'localPreview';
  if (/^https?:/i.test(_0x49b53b)) return 'remote';
  if (/^file:/i.test(_0x49b53b)) return 'file';
  return 'local';
}
function getRefExtension(_0x50f71e) {
  const _0x16ed59 = normalizeComparableRef(_0x50f71e),
    _0x50de3d = _0x16ed59.match(/\.([a-z0-9]{1,8})$/i);
  return _0x50de3d ? '.' + _0x50de3d[1].toLowerCase() : '';
}
function sanitizeMediaRef(_0x515a0e) {
  const _0x1ff40c = toText(_0x515a0e);
  if (!_0x1ff40c) return { present: false };
  const _0x1c7c69 = getRefExtension(_0x1ff40c);
  return {
    present: true,
    kind: getRefKind(_0x1ff40c),
    ext: _0x1c7c69,
    hash: hashText(normalizeComparableRef(_0x1ff40c) || _0x1ff40c),
    isImage: /\.(?:png|jpe?g|webp|gif|avif|bmp)$/i.test(_0x1c7c69),
    isVideo: /\.(?:mp4|mov|webm|m4v|avi|mkv)$/i.test(_0x1c7c69),
    length: _0x1ff40c.length,
  };
}
function getPrimaryListItem(_0x25c5ec, _0x25c5c9 = 0) {
  if (!Array.isArray(_0x25c5ec) || _0x25c5ec.length === 0) return null;
  const _0xd83360 = normalizeIndex(_0x25c5c9, _0x25c5ec.length);
  return _0x25c5ec[_0xd83360] || _0x25c5ec[0] || null;
}
function pushCandidate(_0x3120a2, _0x2eed8d, _0x2be4f1) {
  const _0x243121 = toText(_0x2be4f1);
  if (!_0x243121) return;
  const _0x17e647 = normalizeComparableRef(_0x243121);
  _0x3120a2.push({ label: _0x2eed8d, comparable: _0x17e647, ref: sanitizeMediaRef(_0x243121) });
}
function collectVideoPosterCandidates(_0x5255dd = {}) {
  const _0x20814f = Array.isArray(_0x5255dd.videos) ? _0x5255dd.videos : [],
    _0x662bf9 = normalizeIndex(_0x5255dd.mainVideoIndex, _0x20814f.length || 1),
    _0x3d4173 = getPrimaryListItem(_0x20814f, _0x662bf9),
    _0x16c5a3 = [],
    _0x4ad9a1 = (_0x5415a0, _0x38c22b) => {
      if (!_0x5415a0 || typeof _0x5415a0 !== 'object') return;
      (pushCandidate(_0x16c5a3, _0x38c22b + '.posterLocalPath', _0x5415a0.posterLocalPath),
        pushCandidate(_0x16c5a3, _0x38c22b + '.thumbLocalPath', _0x5415a0.thumbLocalPath),
        pushCandidate(_0x16c5a3, _0x38c22b + '.previewLocalPath', _0x5415a0.previewLocalPath),
        pushCandidate(_0x16c5a3, _0x38c22b + '.thumbnailLocalPath', _0x5415a0.thumbnailLocalPath),
        pushCandidate(_0x16c5a3, _0x38c22b + '.posterUrl', _0x5415a0.posterUrl),
        pushCandidate(_0x16c5a3, _0x38c22b + '.thumbUrl', _0x5415a0.thumbUrl),
        pushCandidate(_0x16c5a3, _0x38c22b + '.previewUrl', _0x5415a0.previewUrl),
        pushCandidate(_0x16c5a3, _0x38c22b + '.thumbnailUrl', _0x5415a0.thumbnailUrl));
    };
  if (_0x3d4173) _0x4ad9a1(_0x3d4173, 'videos[' + _0x662bf9 + ']');
  return (
    _0x4ad9a1(_0x5255dd, 'node'),
    _0x20814f.slice(0, MAX_LIST_ITEMS).forEach((_0x41afd2, _0x396948) => {
      if (_0x396948 === _0x662bf9) return;
      _0x4ad9a1(_0x41afd2, 'videos[' + _0x396948 + ']');
    }),
    _0x16c5a3
  );
}
function collectVideoSourceCandidates(_0x1cc4b7 = {}) {
  const _0x1ca2cc = Array.isArray(_0x1cc4b7.videos) ? _0x1cc4b7.videos : [],
    _0x56b5a5 = normalizeIndex(_0x1cc4b7.mainVideoIndex, _0x1ca2cc.length || 1),
    _0x288a63 = getPrimaryListItem(_0x1ca2cc, _0x56b5a5),
    _0x5f2cf1 = [],
    _0x2737b8 = (_0x4d474f, _0x1fa7f2) => {
      if (!_0x4d474f || typeof _0x4d474f !== 'object') return;
      (pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.displayLocalPath', _0x4d474f.displayLocalPath),
        pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.localPath', _0x4d474f.localPath),
        pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.videoLocalPath', _0x4d474f.videoLocalPath),
        pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.videoUrl', _0x4d474f.videoUrl),
        pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.src', _0x4d474f.src),
        pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.url', _0x4d474f.url),
        pushCandidate(_0x5f2cf1, _0x1fa7f2 + '.resultUrl', _0x4d474f.resultUrl));
    };
  if (_0x288a63) _0x2737b8(_0x288a63, 'videos[' + _0x56b5a5 + ']');
  return (
    _0x2737b8(_0x1cc4b7, 'node'),
    _0x1ca2cc.slice(0, MAX_LIST_ITEMS).forEach((_0x5bdff5, _0x51f81b) => {
      if (_0x51f81b === _0x56b5a5) return;
      _0x2737b8(_0x5bdff5, 'videos[' + _0x51f81b + ']');
    }),
    _0x5f2cf1
  );
}
function matchCandidateLabels(_0x207ca1, _0x1ce42a = []) {
  const _0x57a42c = normalizeComparableRef(_0x207ca1);
  if (!_0x57a42c) return [];
  const _0x4c8f7e = [];
  for (const _0x5092b5 of _0x1ce42a) {
    _0x5092b5.comparable && _0x5092b5.comparable === _0x57a42c && _0x4c8f7e.push(_0x5092b5.label);
  }
  return _0x4c8f7e;
}
function getElementSrc(_0x1a90ea) {
  return toText(
    _0x1a90ea?.currentSrc ||
      _0x1a90ea?.src ||
      _0x1a90ea?.getAttribute?.('src') ||
      _0x1a90ea?.getAttribute?.('poster') ||
      '',
  );
}
function getVideoSrc(_0x462d22) {
  return toText(
    _0x462d22?.currentSrc ||
      _0x462d22?.src ||
      _0x462d22?.getAttribute?.('src') ||
      _0x462d22?.querySelector?.('source')?.src ||
      _0x462d22?.querySelector?.('source')?.getAttribute?.('src') ||
      '',
  );
}
function escapeAttr(_0x4f0b83) {
  return String(_0x4f0b83 || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
function queryNodeDom(_0x28c7be, _0x1fe3a9) {
  if (!_0x28c7be || !_0x1fe3a9) return {};
  const _0x3ae947 = escapeAttr(_0x1fe3a9),
    _0x1bccf5 =
      _0x28c7be.getElementById?.(_0x1fe3a9) ||
      _0x28c7be.querySelector?.('.v2-node[data-node-id="' + _0x3ae947 + '"]') ||
      null,
    _0x16b2d1 = _0x28c7be.querySelector?.('.v2-fast-preview-node[data-node-id="' + _0x3ae947 + '"]') || null;
  return { wrapper: _0x1bccf5, fastPreview: _0x16b2d1 };
}
function summarizeImageElement(_0xc22bc2, _0x5befd3 = []) {
  const _0x19bee5 = getElementSrc(_0xc22bc2);
  return {
    className: toText(_0xc22bc2?.className),
    src: { ...sanitizeMediaRef(_0x19bee5), matches: matchCandidateLabels(_0x19bee5, _0x5befd3) },
    complete: _0xc22bc2?.complete !== false,
    naturalWidth: toNumber(_0xc22bc2?.naturalWidth || _0xc22bc2?.width, 0),
    display: toText(_0xc22bc2?.style?.display),
    visibility: toText(_0xc22bc2?.style?.visibility),
    opacity: toText(_0xc22bc2?.style?.opacity),
  };
}
function summarizeVideoElement(_0x454247, _0x474942 = [], _0x22f7e5 = []) {
  const _0xcb5f69 = getVideoSrc(_0x454247),
    _0x1961ac = toText(_0x454247?.poster || _0x454247?.getAttribute?.('poster'));
  return {
    src: { ...sanitizeMediaRef(_0xcb5f69), matches: matchCandidateLabels(_0xcb5f69, _0x474942) },
    poster: { ...sanitizeMediaRef(_0x1961ac), matches: matchCandidateLabels(_0x1961ac, _0x22f7e5) },
    readyState: toNumber(_0x454247?.readyState, 0),
    preload: toText(_0x454247?.preload || _0x454247?.getAttribute?.('preload')),
    paused: _0x454247?.paused !== false,
    display: toText(_0x454247?.style?.display),
    visibility: toText(_0x454247?.style?.visibility),
    opacity: toText(_0x454247?.style?.opacity),
  };
}
function summarizeNodeData(_0x1e7cbb = {}) {
  const _0x2259f9 = Array.isArray(_0x1e7cbb.videos) ? _0x1e7cbb.videos : [],
    _0xfebe96 = Array.isArray(_0x1e7cbb.images) ? _0x1e7cbb.images : [];
  return {
    id: toText(_0x1e7cbb.id),
    type: toText(_0x1e7cbb.type),
    selected: false,
    geometry: {
      x: toNumber(_0x1e7cbb.x, 0),
      y: toNumber(_0x1e7cbb.y, 0),
      width: toNumber(_0x1e7cbb.width, 0),
      height: toNumber(_0x1e7cbb.height, 0),
    },
    mediaIndexes: {
      mainVideoIndex: normalizeIndex(_0x1e7cbb.mainVideoIndex, _0x2259f9.length || 1),
      mainImageIndex: normalizeIndex(_0x1e7cbb.mainImageIndex, _0xfebe96.length || 1),
      videosLength: _0x2259f9.length,
      imagesLength: _0xfebe96.length,
    },
    taskState: {
      isGenerating: _0x1e7cbb.isGenerating === true,
      jobStatus: toText(_0x1e7cbb.jobStatus),
      rhTaskStatus: toText(_0x1e7cbb.rhTaskStatus),
      dreaminaTaskStatus: toText(_0x1e7cbb.dreaminaTaskStatus),
      asyncTaskStatus: toText(_0x1e7cbb.asyncTaskStatus),
      mediaUnavailable: _0x1e7cbb.mediaUnavailable === true,
    },
  };
}
function summarizeNodeDom(_0x572912, _0x748dd5) {
  const _0x22e57b = toText(_0x572912?.id),
    { wrapper: _0x4b2dae, fastPreview: _0x1f26b5 } = queryNodeDom(_0x748dd5, _0x22e57b),
    _0x4b8c4e = collectVideoPosterCandidates(_0x572912),
    _0x2015ab = collectVideoSourceCandidates(_0x572912),
    _0x215a8d =
      _0x1f26b5?.querySelector?.('.v2-fast-preview-media') || _0x1f26b5?.querySelector?.('img') || null,
    _0x2d8db0 = getElementSrc(_0x215a8d),
    _0x520de6 =
      _0x4b2dae?.querySelector?.('.source-video-poster-frame') ||
      _0x4b2dae?.querySelector?.('.ai-video-deferred-poster') ||
      null,
    _0x3c4665 = getElementSrc(_0x520de6),
    _0x5331ac = Array.from(_0x4b2dae?.querySelectorAll?.('img') || [])
      .slice(0, MAX_DOM_MEDIA)
      .map((_0x3c0b18) => summarizeImageElement(_0x3c0b18, _0x4b8c4e)),
    _0x251f15 = Array.from(_0x4b2dae?.querySelectorAll?.('video') || [])
      .slice(0, MAX_DOM_MEDIA)
      .map((_0x4770d9) => summarizeVideoElement(_0x4770d9, _0x2015ab, _0x4b8c4e));
  return {
    mounted: !!_0x4b2dae,
    hasFastPreview: !!_0x1f26b5,
    detailStage: toText(_0x4b2dae?.dataset?.detailStage),
    mediaLod: toText(_0x4b2dae?.dataset?.mediaLod),
    className: toText(_0x4b2dae?.className).slice(0, 240),
    actual: {
      fastPreviewSrc: { ...sanitizeMediaRef(_0x2d8db0), matches: matchCandidateLabels(_0x2d8db0, _0x4b8c4e) },
      posterFrameSrc: { ...sanitizeMediaRef(_0x3c4665), matches: matchCandidateLabels(_0x3c4665, _0x4b8c4e) },
      imageElements: _0x5331ac,
      videoElements: _0x251f15,
    },
    expected: {
      posterCandidates: _0x4b8c4e
        .slice(0, MAX_LIST_ITEMS)
        .map((_0x3ba9bc) => ({ label: _0x3ba9bc.label, ref: _0x3ba9bc.ref })),
      videoSourceCandidates: _0x2015ab
        .slice(0, MAX_LIST_ITEMS)
        .map((_0x5e12bb) => ({ label: _0x5e12bb.label, ref: _0x5e12bb.ref })),
    },
  };
}
function getProblemLayer(_0x57d95d) {
  const _0x4c5efc = _0x57d95d?.type || '';
  if (!_0x4c5efc.includes('video')) return null;
  const _0x3bdaea = _0x57d95d.mediaIndexes?.mainVideoIndex ?? 0,
    _0x5605a3 = 'videos[' + _0x3bdaea + ']',
    _0x5527d3 = _0x57d95d.dom?.actual?.fastPreviewSrc?.matches || [],
    _0x18171c = _0x57d95d.dom?.actual?.posterFrameSrc?.matches || [],
    _0x56c281 = (_0x3b7e11) =>
      _0x3b7e11.find((_0x274184) => /^videos\[\d+\]\./.test(_0x274184) && !_0x274184.startsWith(_0x5605a3));
  if (_0x5527d3.length > 0 && !_0x5527d3.some((_0x8757fb) => _0x8757fb.startsWith(_0x5605a3)))
    return {
      code: 'fast_preview_poster_mismatch',
      severity: 'warn',
      message: 'Fast preview poster does not match videos[mainVideoIndex].',
      likelyLayer: 'fastPreviewLayer',
      evidence: {
        mainVideoIndex: _0x3bdaea,
        actualFastPreviewMatches: _0x5527d3,
        unexpectedMatch: _0x56c281(_0x5527d3) || '',
      },
    };
  if (_0x18171c.length > 0 && !_0x18171c.some((_0x32f9fe) => _0x32f9fe.startsWith(_0x5605a3)))
    return {
      code: 'poster_frame_mismatch',
      severity: 'warn',
      message: 'Poster frame does not match videos[mainVideoIndex].',
      likelyLayer: 'nodePosterResolver',
      evidence: {
        mainVideoIndex: _0x3bdaea,
        actualPosterMatches: _0x18171c,
        unexpectedMatch: _0x56c281(_0x18171c) || '',
      },
    };
  return null;
}
function getDocumentBodyClasses(_0x74eb3f) {
  const _0x54d341 = toText(_0x74eb3f?.body?.className);
  if (_0x54d341) return _0x54d341.split(/\s+/).filter(Boolean).slice(0, 20);
  const _0x393ff1 = _0x74eb3f?.body?.classList;
  if (!_0x393ff1 || typeof _0x393ff1[Symbol.iterator] !== 'function') return [];
  return Array.from(_0x393ff1).slice(0, 20);
}
function collectCandidateNodeIds(_0x159808 = {}, _0x1ee52a) {
  const _0xa2078a = Array.isArray(_0x159808.selectedNodeIds) ? _0x159808.selectedNodeIds : [],
    _0x7053bd = [],
    _0x5f011c = (_0x3ac8ed) => {
      const _0x469b69 = toText(_0x3ac8ed);
      if (_0x469b69 && !_0x7053bd.includes(_0x469b69)) _0x7053bd.push(_0x469b69);
    };
  _0xa2078a.forEach(_0x5f011c);
  for (const _0x23b2a8 of _0x1ee52a?.querySelectorAll?.(
    '#v2-canvas .v2-node, #v2-canvas .v2-fast-preview-node',
  ) || []) {
    _0x5f011c(_0x23b2a8?.id || _0x23b2a8?.dataset?.nodeId);
    if (_0x7053bd.length >= MAX_DIAGNOSTIC_NODES) break;
  }
  for (const _0x4e36e9 of Object.values(_0x159808.nodes || {})) {
    const _0x4e758e = toText(_0x4e36e9?.type).toLowerCase();
    if (_0x4e758e.includes('video') || _0x4e758e.includes('image')) _0x5f011c(_0x4e36e9?.id);
    if (_0x7053bd.length >= MAX_DIAGNOSTIC_NODES) break;
  }
  return _0x7053bd.slice(0, MAX_DIAGNOSTIC_NODES);
}
function buildAiAnalysis(_0x65f521 = []) {
  const _0x56b6a2 = [];
  for (const _0x90965f of _0x65f521) {
    const _0x251448 = getProblemLayer(_0x90965f);
    _0x251448 && _0x56b6a2.push({ nodeId: _0x90965f.id, nodeType: _0x90965f.type, ..._0x251448 });
  }
  return {
    summary:
      _0x56b6a2.length > 0
        ? 'Potential media resolution issues were detected. See findings for the likely layer.'
        : 'No obvious media preview mismatch was detected in the captured node set.',
    findings: _0x56b6a2,
    nextChecks:
      _0x56b6a2.length > 0
        ? [
            'Compare actualFastPreviewMatches with videos[mainVideoIndex].',
            'Check whether top-level node poster fields are stale mirrors of another result.',
          ]
        : [
            'If the user still sees a mismatch, ask them to select the problematic node and generate a new diagnostics package.',
          ],
  };
}
export function createAiDiagnosticsReport({
  graphStore: graphStore = null,
  state: state = null,
  documentRef: documentRef = typeof document !== 'undefined' ? document : null,
  reason: reason = 'settings_diagnostics_package',
} = {}) {
  const _0x474001 = state || graphStore?.getStateRaw?.() || graphStore?.getState?.() || {},
    _0x574477 = _0x474001.nodes || {},
    _0x244268 = collectCandidateNodeIds(_0x474001, documentRef),
    _0xda452c = new Set(
      Array.isArray(_0x474001.selectedNodeIds) ? _0x474001.selectedNodeIds.map(String) : [],
    ),
    _0x51a5b5 = _0x244268
      .map((_0x1e661e) => _0x574477[_0x1e661e])
      .filter(Boolean)
      .map((_0x3fc861) => {
        const _0x2d2c88 = summarizeNodeData(_0x3fc861);
        return (
          (_0x2d2c88.selected = _0xda452c.has(_0x2d2c88.id)),
          (_0x2d2c88.dom = summarizeNodeDom(_0x3fc861, documentRef)),
          _0x2d2c88
        );
      }),
    _0x575989 = {
      schemaVersion: REPORT_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      reason: toText(reason) || 'settings_diagnostics_package',
      privacy:
        'No project JSON, asset files, prompts, API keys, or raw media paths are included. Media references are represented by kind/ext/hash only.',
      canvas: {
        nodeCount: Object.keys(_0x574477).length,
        edgeCount: Object.keys(_0x474001.edges || {}).length,
        selectedNodeIds: Array.from(_0xda452c).slice(0, MAX_DIAGNOSTIC_NODES),
        viewport: {
          x: toNumber(_0x474001.viewport?.x, 0),
          y: toNumber(_0x474001.viewport?.y, 0),
          zoom: toNumber(_0x474001.viewport?.zoom, 1),
        },
        bodyClasses: getDocumentBodyClasses(documentRef),
        mountedNodeCount: documentRef?.querySelectorAll?.('#v2-canvas .v2-node')?.length || 0,
        fastPreviewCount: documentRef?.querySelectorAll?.('#v2-canvas .v2-fast-preview-node')?.length || 0,
        videoElementCount: documentRef?.querySelectorAll?.('#v2-canvas video')?.length || 0,
      },
      mediaScheduler: getCanvasMediaSchedulerStats(),
      performance: getPerfProbeSnapshot(),
      nodes: _0x51a5b5,
    };
  return { ..._0x575989, aiAnalysis: buildAiAnalysis(_0x51a5b5) };
}
