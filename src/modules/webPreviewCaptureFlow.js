import appStore from '../core/stores/appStore.js';
import { generateId, screenToWorld } from '../core/math.js';
import { t } from '../i18n/index.js';
import { commit } from './history.js';
import { createBatchSpawnLayoutNearNode, calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import {
  createWebImageSourceNode,
  createWebVideoSourceNode,
  getAIGenerationDefaultSizeByType,
  getNodeDefaultSize,
} from '../services/fileService.js';
import { REVERSE_IMAGE_PROMPT_PRESET_PROMPT } from './promptPresets.js';
const MAX_BATCH_CREATE_COUNT = 60,
  MAX_VIDEO_CREATE_COUNT = 12,
  MIN_EXTRACT_IMAGE_WIDTH = 96,
  MIN_EXTRACT_IMAGE_HEIGHT = 96,
  MIN_EXTRACT_IMAGE_AREA = 0x2ee0,
  STREAM_MEDIA_URL_EXTENSION_RE = /\.(?:m3u8|mpd|m4s)(?:[?#].*)?$/i,
  WEB_PREVIEW_REVERSE_IMAGE_PROMPT_NODE_NAME = '反推提示词-创建';
function webPreviewCaptureText(_0x1f6835, _0x3ab5a2 = {}) {
  return t('webPreview.capture.' + _0x1f6835, _0x3ab5a2);
}
function dispatchWebPreviewPickerSync(_0x32996e) {
  const _0x3d90c5 = globalThis.window;
  if (typeof _0x3d90c5?.dispatchEvent !== 'function') return;
  try {
    const _0x7b9c2 =
      typeof globalThis.CustomEvent === 'function'
        ? new CustomEvent('web-preview:force-sync', { detail: { reason: _0x32996e } })
        : { type: 'web-preview:force-sync', detail: { reason: _0x32996e } };
    _0x3d90c5.dispatchEvent(_0x7b9c2);
  } catch {}
}
function normalizeHttpUrl(_0x2dd682) {
  const _0x9524b3 = String(_0x2dd682 || '').trim();
  if (!_0x9524b3) return '';
  try {
    const _0x3e9de5 = new URL(_0x9524b3, globalThis.location?.href || 'https://example.invalid/');
    if (_0x3e9de5.protocol !== 'http:' && _0x3e9de5.protocol !== 'https:') return '';
    return ((_0x3e9de5.username = ''), (_0x3e9de5.password = ''), _0x3e9de5.href);
  } catch {
    return '';
  }
}
function getGraphState(_0x4b0fd2 = appStore) {
  return _0x4b0fd2.getStateRaw?.() || _0x4b0fd2.getState?.() || {};
}
function getAnchorNode(_0x2171a4, _0x38eca0 = appStore) {
  const _0x3af383 = getGraphState(_0x38eca0);
  return _0x3af383.nodes?.[_0x2171a4] || null;
}
function isExtractableImageSize(_0x15a2ce, _0x423381) {
  const _0x2b4b57 = Math.max(0, Math.round(Number(_0x15a2ce || 0) || 0)),
    _0x3d09b7 = Math.max(0, Math.round(Number(_0x423381 || 0) || 0));
  if (!_0x2b4b57 || !_0x3d09b7) return true;
  return (
    _0x2b4b57 >= MIN_EXTRACT_IMAGE_WIDTH &&
    _0x3d09b7 >= MIN_EXTRACT_IMAGE_HEIGHT &&
    _0x2b4b57 * _0x3d09b7 >= MIN_EXTRACT_IMAGE_AREA
  );
}
function normalizeImageCandidate(_0x520e1c = {}) {
  const _0x32ab18 = normalizeHttpUrl(_0x520e1c?.url);
  if (!_0x32ab18) return null;
  const _0x5e3c54 = {
    url: _0x32ab18,
    title: String(_0x520e1c?.title || _0x520e1c?.alt || webPreviewCaptureText('fallback.image'))
      .trim()
      .slice(0, 160),
    pageUrl: normalizeHttpUrl(_0x520e1c?.pageUrl || _0x520e1c?.sourceUrl || ''),
    pageTitle: String(_0x520e1c?.pageTitle || '')
      .trim()
      .slice(0, 160),
    nodeId: String(_0x520e1c?.nodeId || '').trim(),
    tabId: String(_0x520e1c?.tabId || '').trim(),
    width: Math.max(0, Math.round(Number(_0x520e1c?.width || 0) || 0)),
    height: Math.max(0, Math.round(Number(_0x520e1c?.height || 0) || 0)),
  };
  if (!isExtractableImageSize(_0x5e3c54.width, _0x5e3c54.height)) return null;
  return _0x5e3c54;
}
function normalizeImageCandidates(_0x3cd7e1 = []) {
  const _0x4329db = new Set(),
    _0xde6163 = [];
  for (const _0x236efc of Array.isArray(_0x3cd7e1) ? _0x3cd7e1 : []) {
    const _0x1f2e6c = normalizeImageCandidate(_0x236efc);
    if (!_0x1f2e6c || _0x4329db.has(_0x1f2e6c.url)) continue;
    (_0x4329db.add(_0x1f2e6c.url), _0xde6163.push(_0x1f2e6c));
  }
  return _0xde6163;
}
function isStreamMediaUrl(_0x1566ea) {
  const _0x36dde2 = normalizeHttpUrl(_0x1566ea);
  if (!_0x36dde2) return false;
  try {
    return STREAM_MEDIA_URL_EXTENSION_RE.test(new URL(_0x36dde2).pathname);
  } catch {
    return false;
  }
}
function normalizeVideoCandidate(_0x2a8c8e = {}) {
  const _0x5beb2a = normalizeHttpUrl(_0x2a8c8e?.url);
  if (!_0x5beb2a || isStreamMediaUrl(_0x5beb2a)) return null;
  return {
    kind: 'video',
    url: _0x5beb2a,
    title: String(_0x2a8c8e?.title || webPreviewCaptureText('fallback.video'))
      .trim()
      .slice(0, 160),
    pageUrl: normalizeHttpUrl(_0x2a8c8e?.pageUrl || _0x2a8c8e?.sourceUrl || ''),
    pageTitle: String(_0x2a8c8e?.pageTitle || '')
      .trim()
      .slice(0, 160),
    nodeId: String(_0x2a8c8e?.nodeId || '').trim(),
    tabId: String(_0x2a8c8e?.tabId || '').trim(),
    width: Math.max(0, Math.round(Number(_0x2a8c8e?.width || 0) || 0)),
    height: Math.max(0, Math.round(Number(_0x2a8c8e?.height || 0) || 0)),
    duration: Math.max(0, Number(_0x2a8c8e?.duration || 0) || 0),
    mimeType: String(_0x2a8c8e?.mimeType || '').trim(),
    sourceType: String(_0x2a8c8e?.sourceType || '')
      .trim()
      .toLowerCase(),
  };
}
function normalizeVideoCandidates(_0x194073 = []) {
  const _0x31ff69 = new Set(),
    _0x2bb370 = [];
  for (const _0x52d6a2 of Array.isArray(_0x194073) ? _0x194073 : []) {
    const _0x564c15 = normalizeVideoCandidate(_0x52d6a2);
    if (!_0x564c15 || _0x31ff69.has(_0x564c15.url)) continue;
    (_0x31ff69.add(_0x564c15.url), _0x2bb370.push(_0x564c15));
  }
  return _0x2bb370;
}
function getViewportCenterTopLeft(_0x1e141a, _0x36575d = appStore) {
  const _0x12e9fe = getGraphState(_0x36575d),
    _0x58e7a0 = (globalThis.window?.innerWidth || 0x500) / 2,
    _0x2ebc10 = (globalThis.window?.innerHeight || 0x2d0) / 2,
    _0x59dfd2 = screenToWorld(_0x58e7a0, _0x2ebc10, _0x12e9fe.viewport || {});
  return { x: _0x59dfd2.x - _0x1e141a.width / 2, y: _0x59dfd2.y - _0x1e141a.height / 2 };
}
function getSingleNodeSpawnPosition({
  nodeId: _0x5c3f70,
  storeInstance: storeInstance = appStore,
  size: _0x1673f8,
} = {}) {
  const _0x28de6f = getGraphState(storeInstance),
    _0xea15bb = getAnchorNode(_0x5c3f70, storeInstance);
  return _0xea15bb
    ? calcSafeSpawnPosNearNode(_0x28de6f.nodes || {}, _0xea15bb, _0x1673f8.width, _0x1673f8.height)
    : getViewportCenterTopLeft(_0x1673f8, storeInstance);
}
export function createWebPreviewTextNodeFromSelection({
  nodeId: _0x50a241,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const _0x23720b = String(payload?.text || '').trim();
  if (!_0x23720b) return null;
  const _0xd2a1e8 = getAIGenerationDefaultSizeByType('ai-text'),
    _0x419478 = getGraphState(storeInstance),
    _0x53ce72 = getAnchorNode(_0x50a241 || payload?.nodeId, storeInstance),
    _0x4ecdba = _0x53ce72
      ? calcSafeSpawnPosNearNode(_0x419478.nodes || {}, _0x53ce72, _0xd2a1e8.width, _0xd2a1e8.height)
      : getViewportCenterTopLeft(_0xd2a1e8, storeInstance),
    _0x30fb34 = generateId('ai-text'),
    _0x15e36f = {
      id: _0x30fb34,
      type: 'ai-text',
      x: _0x4ecdba.x,
      y: _0x4ecdba.y,
      width: _0xd2a1e8.width,
      height: _0xd2a1e8.height,
      name: webPreviewCaptureText('nodeNames.generatedText'),
      prompt: _0x23720b,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (
    storeInstance.addNode?.(_0x15e36f),
    storeInstance.setSelectedNodes?.([_0x30fb34]),
    commitFn?.(),
    _0x15e36f
  );
}
export function createWebPreviewSourceTextNodeFromSelection({
  nodeId: _0x45b7d6,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const _0x8ca3a9 = String(payload?.text || '').trim();
  if (!_0x8ca3a9) return null;
  const _0x44d584 = getNodeDefaultSize('source-text'),
    _0x5a89f3 = getSingleNodeSpawnPosition({
      nodeId: _0x45b7d6 || payload?.nodeId,
      storeInstance: storeInstance,
      size: _0x44d584,
    }),
    _0x4e34f1 = generateId('source-text'),
    _0x5068c7 = {
      id: _0x4e34f1,
      type: 'source-text',
      x: _0x5a89f3.x,
      y: _0x5a89f3.y,
      width: _0x44d584.width,
      height: _0x44d584.height,
      name: webPreviewCaptureText('nodeNames.sourceText'),
      content: _0x8ca3a9,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (
    storeInstance.addNode?.(_0x5068c7),
    storeInstance.setSelectedNodes?.([_0x4e34f1]),
    commitFn?.(),
    _0x5068c7
  );
}
export function createWebPreviewImagePromptNodeFromSelection({
  nodeId: _0x344b00,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const _0x127f5b = String(payload?.text || '').trim();
  if (!_0x127f5b) return null;
  const _0x48cec6 = getAIGenerationDefaultSizeByType('ai-image'),
    _0x12f44f = getSingleNodeSpawnPosition({
      nodeId: _0x344b00 || payload?.nodeId,
      storeInstance: storeInstance,
      size: _0x48cec6,
    }),
    _0x2e2c48 = generateId('ai-image'),
    _0x54d4a0 = {
      id: _0x2e2c48,
      type: 'ai-image',
      x: _0x12f44f.x,
      y: _0x12f44f.y,
      width: _0x48cec6.width,
      height: _0x48cec6.height,
      name: webPreviewCaptureText('nodeNames.imagePrompt'),
      prompt: _0x127f5b,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (
    storeInstance.addNode?.(_0x54d4a0),
    storeInstance.setSelectedNodes?.([_0x2e2c48]),
    commitFn?.(),
    _0x54d4a0
  );
}
export function createWebPreviewVideoPromptNodeFromSelection({
  nodeId: _0x506345,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const _0xdf7336 = String(payload?.text || '').trim();
  if (!_0xdf7336) return null;
  const _0x51767c = getAIGenerationDefaultSizeByType('ai-video'),
    _0x3b2c9c = getSingleNodeSpawnPosition({
      nodeId: _0x506345 || payload?.nodeId,
      storeInstance: storeInstance,
      size: _0x51767c,
    }),
    _0x371bda = generateId('ai-video'),
    _0x363c42 = {
      id: _0x371bda,
      type: 'ai-video',
      x: _0x3b2c9c.x,
      y: _0x3b2c9c.y,
      width: _0x51767c.width,
      height: _0x51767c.height,
      name: webPreviewCaptureText('nodeNames.videoPrompt'),
      prompt: _0xdf7336,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (
    storeInstance.addNode?.(_0x363c42),
    storeInstance.setSelectedNodes?.([_0x371bda]),
    commitFn?.(),
    _0x363c42
  );
}
export function createWebPreviewImageNodeFromContext({
  nodeId: _0x474c44,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  importRemote: importRemote = true,
  importRemoteAsset: _0x1d46a2,
} = {}) {
  const _0x43f2b8 = normalizeImageCandidate(payload);
  if (!_0x43f2b8) return null;
  const _0x30db58 = getNodeDefaultSize('source-image'),
    _0x50d4e6 = getSingleNodeSpawnPosition({
      nodeId: _0x474c44 || _0x43f2b8.nodeId,
      storeInstance: storeInstance,
      size: _0x30db58,
    }),
    _0x387f9c = createWebImageSourceNode({
      payload: {
        ..._0x43f2b8,
        title: _0x43f2b8.title || _0x43f2b8.pageTitle || webPreviewCaptureText('fallback.image'),
        pageUrl: _0x43f2b8.pageUrl,
      },
      worldX: _0x50d4e6.x,
      worldY: _0x50d4e6.y,
      storeInstance: storeInstance,
      projectId: projectId,
      select: true,
      importRemote: importRemote,
      importRemoteAsset: _0x1d46a2,
    });
  if (_0x387f9c) commitFn?.();
  return _0x387f9c;
}
export function createWebPreviewReverseImagePromptNodes({
  nodeId: _0x52f977,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  importRemote: importRemote = true,
  importRemoteAsset: _0x2e3f84,
} = {}) {
  const _0x351ec6 = normalizeImageCandidate(payload);
  if (!_0x351ec6) return null;
  const _0x818043 = getNodeDefaultSize('source-image'),
    _0x176f9d = getSingleNodeSpawnPosition({
      nodeId: _0x52f977 || _0x351ec6.nodeId,
      storeInstance: storeInstance,
      size: _0x818043,
    }),
    _0x4c3f5e = createWebImageSourceNode({
      payload: {
        ..._0x351ec6,
        title: _0x351ec6.title || _0x351ec6.pageTitle || webPreviewCaptureText('fallback.image'),
        pageUrl: _0x351ec6.pageUrl,
      },
      worldX: _0x176f9d.x,
      worldY: _0x176f9d.y,
      storeInstance: storeInstance,
      projectId: projectId,
      select: false,
      importRemote: importRemote,
      importRemoteAsset: _0x2e3f84,
    });
  if (!_0x4c3f5e) return null;
  const _0x155fb0 = getAIGenerationDefaultSizeByType('ai-text'),
    _0x517461 = getGraphState(storeInstance),
    _0x505c81 = calcSafeSpawnPosNearNode(
      { ...(_0x517461.nodes || {}), [_0x4c3f5e.id]: _0x4c3f5e },
      _0x4c3f5e,
      _0x155fb0.width,
      _0x155fb0.height,
    ),
    _0x28a45d = generateId('ai-text'),
    _0x1d9d41 = {
      id: _0x28a45d,
      type: 'ai-text',
      x: _0x505c81.x,
      y: _0x505c81.y,
      width: _0x155fb0.width,
      height: _0x155fb0.height,
      name: WEB_PREVIEW_REVERSE_IMAGE_PROMPT_NODE_NAME,
      prompt: REVERSE_IMAGE_PROMPT_PRESET_PROMPT,
      webPageUrl: _0x351ec6.pageUrl,
      webSourceTitle: (_0x351ec6.pageTitle || _0x351ec6.title || '').slice(0, 160),
    },
    _0x3c2e1a = { id: generateId('edge'), sourceId: _0x4c3f5e.id, targetId: _0x1d9d41.id };
  return (
    storeInstance.addNode?.(_0x1d9d41),
    storeInstance.addEdge?.(_0x3c2e1a),
    storeInstance.setSelectedNodes?.([_0x1d9d41.id]),
    commitFn?.(),
    { imageNode: _0x4c3f5e, textNode: _0x1d9d41, edge: _0x3c2e1a }
  );
}
export function createBatchWebImageNodes({
  nodeId: _0x2639c2,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
} = {}) {
  const _0xdbb60d = normalizeImageCandidates(candidates).slice(0, MAX_BATCH_CREATE_COUNT);
  if (!_0xdbb60d.length) return [];
  const _0x2003aa = getGraphState(storeInstance),
    _0x3bce09 = getAnchorNode(_0x2639c2, storeInstance),
    _0x2495eb = getNodeDefaultSize('source-image'),
    _0x59c8da = _0x3bce09
      ? createBatchSpawnLayoutNearNode({
          nodes: _0x2003aa.nodes || {},
          anchorNode: _0x3bce09,
          itemCount: _0xdbb60d.length,
          itemWidth: _0x2495eb.width,
          itemHeight: _0x2495eb.height,
        })
      : null,
    _0x441d68 = _0x59c8da ? null : getViewportCenterTopLeft(_0x2495eb, storeInstance),
    _0x1e62c5 = [];
  return (
    _0xdbb60d.forEach((_0x28e70f, _0x2324aa) => {
      const _0x5c7cf8 = _0x59c8da
          ? _0x59c8da.getItemPosition(_0x2324aa)
          : { x: _0x441d68.x + _0x2324aa * 30, y: _0x441d68.y + _0x2324aa * 30 },
        _0x3e6c8f = createWebImageSourceNode({
          payload: {
            ..._0x28e70f,
            title: _0x28e70f.title || _0x28e70f.pageTitle || webPreviewCaptureText('fallback.image'),
            pageUrl: _0x28e70f.pageUrl,
          },
          worldX: _0x5c7cf8.x,
          worldY: _0x5c7cf8.y,
          storeInstance: storeInstance,
          projectId: projectId,
          select: false,
        });
      if (_0x3e6c8f) _0x1e62c5.push(_0x3e6c8f);
    }),
    _0x1e62c5.length &&
      (storeInstance.setSelectedNodes?.(_0x1e62c5.map((_0x5a3531) => _0x5a3531.id)), commitFn?.()),
    _0x1e62c5
  );
}
export function createBatchWebVideoNodes({
  nodeId: _0x2f161b,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  rightsConfirmed: rightsConfirmed = false,
  importRemoteAsset: _0x2f74df,
} = {}) {
  const _0x16fc1b = normalizeVideoCandidates(candidates).slice(0, MAX_VIDEO_CREATE_COUNT);
  if (!_0x16fc1b.length || rightsConfirmed !== true) return [];
  const _0x463fd3 = getGraphState(storeInstance),
    _0x4da816 = getAnchorNode(_0x2f161b, storeInstance),
    _0x4c9d9e = getNodeDefaultSize('source-video'),
    _0x480564 = _0x4da816
      ? createBatchSpawnLayoutNearNode({
          nodes: _0x463fd3.nodes || {},
          anchorNode: _0x4da816,
          itemCount: _0x16fc1b.length,
          itemWidth: _0x4c9d9e.width,
          itemHeight: _0x4c9d9e.height,
        })
      : null,
    _0xa11c46 = _0x480564 ? null : getViewportCenterTopLeft(_0x4c9d9e, storeInstance),
    _0x47766d = [];
  return (
    _0x16fc1b.forEach((_0x16beaf, _0x3a1ba9) => {
      const _0x181648 = _0x480564
          ? _0x480564.getItemPosition(_0x3a1ba9)
          : { x: _0xa11c46.x + _0x3a1ba9 * 30, y: _0xa11c46.y + _0x3a1ba9 * 30 },
        _0x1e0489 = createWebVideoSourceNode({
          payload: {
            ..._0x16beaf,
            title: _0x16beaf.title || _0x16beaf.pageTitle || webPreviewCaptureText('fallback.video'),
            pageUrl: _0x16beaf.pageUrl,
            rightsConfirmed: rightsConfirmed,
          },
          worldX: _0x181648.x,
          worldY: _0x181648.y,
          storeInstance: storeInstance,
          projectId: projectId,
          importRemoteAsset: _0x2f74df,
          select: false,
        });
      if (_0x1e0489) _0x47766d.push(_0x1e0489);
    }),
    _0x47766d.length &&
      (storeInstance.setSelectedNodes?.(_0x47766d.map((_0x5c2761) => _0x5c2761.id)), commitFn?.()),
    _0x47766d
  );
}
export function createBatchWebMediaNodes({
  nodeId: _0x26349e,
  imageCandidates: imageCandidates = [],
  videoCandidates: videoCandidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  rightsConfirmed: rightsConfirmed = false,
  importRemoteAsset: _0x5cb147,
} = {}) {
  const _0x332025 = normalizeImageCandidates(imageCandidates).slice(0, MAX_BATCH_CREATE_COUNT),
    _0x30a895 =
      rightsConfirmed === true
        ? normalizeVideoCandidates(videoCandidates).slice(0, MAX_VIDEO_CREATE_COUNT)
        : [],
    _0xd46c77 = [
      ..._0x332025.map((_0x34c15d) => ({ kind: 'image', candidate: _0x34c15d })),
      ..._0x30a895.map((_0x1db36e) => ({ kind: 'video', candidate: _0x1db36e })),
    ];
  if (!_0xd46c77.length) return [];
  const _0x401b90 = getGraphState(storeInstance),
    _0x72a2e3 = getAnchorNode(_0x26349e, storeInstance),
    _0x5e43c9 = getNodeDefaultSize('source-image'),
    _0x5cb47f = _0x72a2e3
      ? createBatchSpawnLayoutNearNode({
          nodes: _0x401b90.nodes || {},
          anchorNode: _0x72a2e3,
          itemCount: _0xd46c77.length,
          itemWidth: _0x5e43c9.width,
          itemHeight: _0x5e43c9.height,
        })
      : null,
    _0xe3fb44 = _0x5cb47f ? null : getViewportCenterTopLeft(_0x5e43c9, storeInstance),
    _0x486bd4 = [];
  return (
    _0xd46c77.forEach((_0xcb9fa7, _0x513aca) => {
      const _0x5d8af0 = _0x5cb47f
          ? _0x5cb47f.getItemPosition(_0x513aca)
          : { x: _0xe3fb44.x + _0x513aca * 30, y: _0xe3fb44.y + _0x513aca * 30 },
        _0x4301fd = {
          worldX: _0x5d8af0.x,
          worldY: _0x5d8af0.y,
          storeInstance: storeInstance,
          projectId: projectId,
          select: false,
          importRemoteAsset: _0x5cb147,
        },
        _0xb060f6 =
          _0xcb9fa7.kind === 'video'
            ? createWebVideoSourceNode({
                ..._0x4301fd,
                payload: {
                  ..._0xcb9fa7.candidate,
                  title:
                    _0xcb9fa7.candidate.title ||
                    _0xcb9fa7.candidate.pageTitle ||
                    webPreviewCaptureText('fallback.video'),
                  pageUrl: _0xcb9fa7.candidate.pageUrl,
                  rightsConfirmed: true,
                },
              })
            : createWebImageSourceNode({
                ..._0x4301fd,
                payload: {
                  ..._0xcb9fa7.candidate,
                  title:
                    _0xcb9fa7.candidate.title ||
                    _0xcb9fa7.candidate.pageTitle ||
                    webPreviewCaptureText('fallback.image'),
                  pageUrl: _0xcb9fa7.candidate.pageUrl,
                },
              });
      if (_0xb060f6) _0x486bd4.push(_0xb060f6);
    }),
    _0x486bd4.length &&
      (storeInstance.setSelectedNodes?.(_0x486bd4.map((_0x522d9f) => _0x522d9f.id)), commitFn?.()),
    _0x486bd4
  );
}
export function createWebReferenceCardNode({
  nodeId: _0x5c3e93,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const _0x33f014 = normalizeHttpUrl(payload?.pageUrl || payload?.url || ''),
    _0x1a7205 = String(
      payload?.pageTitle || payload?.title || _0x33f014 || webPreviewCaptureText('fallback.reference'),
    )
      .trim()
      .slice(0, 160),
    _0x392976 = String(payload?.selectedText || payload?.text || '')
      .trim()
      .slice(0, 0x1388),
    _0x5cdfc0 = String(payload?.screenshotDataUrl || payload?.screenshot || ''),
    _0x5415b5 = String(payload?.capturedAt || new Date().toISOString()).trim(),
    _0x6d63af = getNodeDefaultSize('web-reference-card'),
    _0xbd4bc8 = getGraphState(storeInstance),
    _0x49a793 = getAnchorNode(_0x5c3e93 || payload?.nodeId, storeInstance),
    _0x521936 = _0x49a793
      ? calcSafeSpawnPosNearNode(_0xbd4bc8.nodes || {}, _0x49a793, _0x6d63af.width, _0x6d63af.height)
      : getViewportCenterTopLeft(_0x6d63af, storeInstance),
    _0x57b632 = generateId('web-reference-card'),
    _0x3ad4a0 = {
      id: _0x57b632,
      type: 'web-reference-card',
      x: _0x521936.x,
      y: _0x521936.y,
      width: _0x6d63af.width,
      height: _0x6d63af.height,
      name: webPreviewCaptureText('nodeNames.webReference'),
      webSourceTitle: _0x1a7205,
      webPageUrl: _0x33f014,
      webScreenshotUrl: _0x5cdfc0.startsWith('data:image/') ? _0x5cdfc0 : '',
      webSelectedText: _0x392976,
      webCapturedAt: _0x5415b5,
    };
  return (
    storeInstance.addNode?.(_0x3ad4a0),
    storeInstance.setSelectedNodes?.([_0x57b632]),
    commitFn?.(),
    _0x3ad4a0
  );
}
function createImagePickerItem(_0x13f681, _0x2fa146, _0x13af02, _0x22abbc) {
  const _0x20d7e4 = _0x13f681.createElement('label');
  _0x20d7e4.className = 'web-preview-image-picker-item';
  const _0x5c7062 = _0x13f681.createElement('input');
  ((_0x5c7062.type = 'checkbox'),
    (_0x5c7062.checked = _0x13af02.has(_0x2fa146.url)),
    _0x5c7062.addEventListener('change', () => _0x22abbc(_0x2fa146.url, _0x5c7062.checked)));
  const _0x264873 = _0x13f681.createElement('img');
  ((_0x264873.className = 'web-preview-image-picker-thumb'),
    (_0x264873.src = _0x2fa146.url),
    (_0x264873.alt = _0x2fa146.title || ''),
    (_0x264873.loading = 'lazy'),
    (_0x264873.decoding = 'async'),
    (_0x264873.referrerPolicy = 'no-referrer'));
  const _0x5a2039 = _0x13f681.createElement('span');
  ((_0x5a2039.className = 'web-preview-image-picker-title'),
    (_0x5a2039.textContent = _0x2fa146.title || webPreviewCaptureText('fallback.image')));
  const _0x589d1a = _0x13f681.createElement('span');
  return (
    (_0x589d1a.className = 'web-preview-image-picker-meta'),
    (_0x589d1a.textContent =
      _0x2fa146.width && _0x2fa146.height ? _0x2fa146.width + ' x ' + _0x2fa146.height : ''),
    _0x20d7e4.appendChild(_0x5c7062),
    _0x20d7e4.appendChild(_0x264873),
    _0x20d7e4.appendChild(_0x5a2039),
    _0x20d7e4.appendChild(_0x589d1a),
    _0x20d7e4
  );
}
function formatVideoDuration(_0x5b6792) {
  const _0x47c369 = Math.round(Number(_0x5b6792 || 0) || 0);
  if (!_0x47c369) return '';
  const _0x2c7526 = Math.floor(_0x47c369 / 60),
    _0x191cfb = _0x47c369 % 60;
  return _0x2c7526 + ':' + String(_0x191cfb).padStart(2, '0');
}
function formatVideoCandidateIndex(_0x504441) {
  const _0x4bd098 = Math.max(1, Math.round(Number(_0x504441 || 0) || 0) + 1);
  return '#' + String(_0x4bd098).padStart(2, '0');
}
function getUrlHost(_0x498318) {
  try {
    return new URL(_0x498318).hostname;
  } catch {
    return '';
  }
}
function shortenVideoToken(_0x98dbc8, _0x4a27ca = 24) {
  const _0x129fc1 = String(_0x98dbc8 || '').trim();
  if (_0x129fc1.length <= _0x4a27ca) return _0x129fc1;
  return _0x129fc1.slice(0, Math.max(6, _0x4a27ca - 7)) + '...' + _0x129fc1.slice(-4);
}
function getVideoUrlFingerprint(_0x50d86b) {
  try {
    const _0x812d84 = new URL(_0x50d86b),
      _0x495b31 = ['video_id', 'vid', 'item_id', 'aweme_id', 'note_id', 'id', 'aid', 'file_id'];
    for (const _0x7d30c1 of _0x495b31) {
      const _0x2d8412 = _0x812d84.searchParams.get(_0x7d30c1);
      if (_0x2d8412) return _0x7d30c1 + '=' + shortenVideoToken(_0x2d8412, 22);
    }
    const _0x275d55 = _0x812d84.pathname.split('/').filter(Boolean),
      _0x5371af = decodeURIComponent(_0x275d55.at(-1) || '').trim();
    if (_0x5371af && _0x5371af !== 'play' && _0x5371af !== 'video') return shortenVideoToken(_0x5371af, 28);
    const _0x22a499 = Array.from(_0x812d84.searchParams.entries())[0];
    if (_0x22a499) return _0x22a499[0] + '=' + shortenVideoToken(_0x22a499[1], 22);
    return _0x812d84.hostname;
  } catch {
    return '';
  }
}
function getVideoSourceLabel(_0x26050c) {
  const _0x6d0aeb = String(_0x26050c || '')
    .trim()
    .toLowerCase();
  return (
    {
      video: webPreviewCaptureText('videoSources.player'),
      'video-source': webPreviewCaptureText('videoSources.player'),
      source: webPreviewCaptureText('videoSources.player'),
      link: webPreviewCaptureText('videoSources.pageLink'),
      'data-attribute': webPreviewCaptureText('videoSources.pageAttribute'),
      'video-resource': webPreviewCaptureText('videoSources.loadedResource'),
      'embedded-url': webPreviewCaptureText('videoSources.scriptUrl'),
      'structured-data': webPreviewCaptureText('videoSources.structuredData'),
      'douyin-detail': webPreviewCaptureText('videoSources.douyinDetail'),
    }[_0x6d0aeb] || webPreviewCaptureText('videoSources.videoSource')
  );
}
function buildVideoCandidateTooltip(_0x56e5b9, _0x54e9a2) {
  const _0x29392a = [
    _0x54e9a2 + ' ' + (_0x56e5b9.title || webPreviewCaptureText('fallback.video')),
    webPreviewCaptureText('videoTooltip.source', { source: getVideoSourceLabel(_0x56e5b9.sourceType) }),
    _0x56e5b9.url ? webPreviewCaptureText('videoTooltip.url', { url: _0x56e5b9.url }) : '',
    _0x56e5b9.pageUrl ? webPreviewCaptureText('videoTooltip.page', { url: _0x56e5b9.pageUrl }) : '',
  ];
  return _0x29392a.filter(Boolean).join('\n');
}
function createVideoPickerItem(_0x3f5f4f, _0x1b57fc, _0x2305a2, _0x1e1044, _0x4feda1 = 0) {
  const _0x184dd4 = _0x3f5f4f.createElement('label');
  _0x184dd4.className = 'web-preview-image-picker-item web-preview-video-picker-item';
  const _0x14f453 = formatVideoCandidateIndex(_0x4feda1);
  _0x184dd4.title = buildVideoCandidateTooltip(_0x1b57fc, _0x14f453);
  const _0x373b41 = _0x3f5f4f.createElement('input');
  ((_0x373b41.type = 'checkbox'),
    (_0x373b41.checked = _0x2305a2.has(_0x1b57fc.url)),
    _0x373b41.addEventListener('change', () => _0x1e1044(_0x1b57fc.url, _0x373b41.checked)));
  const _0x65e18 = _0x3f5f4f.createElement('div');
  _0x65e18.className = 'web-preview-video-picker-thumb';
  const _0x5e71b6 = _0x3f5f4f.createElement('span');
  ((_0x5e71b6.className = 'web-preview-video-picker-index'), (_0x5e71b6.textContent = _0x14f453));
  const _0xea39ae = _0x3f5f4f.createElement('span');
  ((_0xea39ae.className = 'web-preview-video-picker-source'),
    (_0xea39ae.textContent = getVideoSourceLabel(_0x1b57fc.sourceType)));
  const _0x2db67a = _0x3f5f4f.createElement('span');
  ((_0x2db67a.className = 'web-preview-video-picker-fingerprint'),
    (_0x2db67a.textContent = getVideoUrlFingerprint(_0x1b57fc.url) || getUrlHost(_0x1b57fc.url)),
    _0x65e18.appendChild(_0x5e71b6),
    _0x65e18.appendChild(_0xea39ae),
    _0x65e18.appendChild(_0x2db67a));
  const _0x8eb04b = _0x3f5f4f.createElement('span');
  ((_0x8eb04b.className = 'web-preview-image-picker-title'),
    (_0x8eb04b.textContent = _0x14f453 + ' ' + (_0x1b57fc.title || webPreviewCaptureText('fallback.video'))));
  const _0x548216 = _0x3f5f4f.createElement('span');
  _0x548216.className = 'web-preview-image-picker-meta';
  const _0x2c4f82 = _0x1b57fc.width && _0x1b57fc.height ? _0x1b57fc.width + ' x ' + _0x1b57fc.height : '',
    _0x4fc012 = formatVideoDuration(_0x1b57fc.duration),
    _0x5a79c5 = getUrlHost(_0x1b57fc.url),
    _0x43bdd6 = getVideoUrlFingerprint(_0x1b57fc.url);
  return (
    (_0x548216.textContent = [
      _0x2c4f82,
      _0x4fc012,
      _0x5a79c5,
      _0x43bdd6 && _0x43bdd6 !== _0x5a79c5 ? _0x43bdd6 : '',
    ]
      .filter(Boolean)
      .join(' · ')),
    _0x184dd4.appendChild(_0x373b41),
    _0x184dd4.appendChild(_0x65e18),
    _0x184dd4.appendChild(_0x8eb04b),
    _0x184dd4.appendChild(_0x548216),
    _0x184dd4
  );
}
function createPickerSection(_0x4c50d1, _0x473b78, _0x1ba995) {
  const _0x33b361 = _0x4c50d1.createElement('section');
  _0x33b361.className = 'web-preview-media-picker-section';
  const _0x2eba1 = _0x4c50d1.createElement('h4');
  return (
    (_0x2eba1.className = 'web-preview-media-picker-section-title'),
    (_0x2eba1.textContent = _0x473b78),
    _0x33b361.appendChild(_0x2eba1),
    _0x33b361.appendChild(_0x1ba995),
    _0x33b361
  );
}
function createMediaFilterButton(_0x5edd43, _0x6305d4, _0x5d4db2, _0xe80855, _0x124558, _0x406799) {
  const _0x459802 = _0x5edd43.createElement('button');
  return (
    (_0x459802.type = 'button'),
    (_0x459802.className = 'web-preview-media-picker-filter' + (_0x5d4db2 === _0xe80855 ? ' is-active' : '')),
    (_0x459802.textContent = _0x6305d4),
    (_0x459802.disabled = !!_0x124558),
    (_0x459802.ariaPressed = _0x5d4db2 === _0xe80855 ? 'true' : 'false'),
    _0x459802.addEventListener('click', () => {
      if (_0x459802.disabled) return;
      _0x406799(_0x5d4db2);
    }),
    _0x459802
  );
}
function selectCandidateUrls(_0x503f86, _0x477634, _0x272695) {
  _0x503f86.clear();
  for (const _0x523ac3 of _0x477634.slice(0, _0x272695)) {
    if (_0x523ac3?.url) _0x503f86.add(_0x523ac3.url);
  }
}
export function openWebPreviewMediaPicker({
  nodeId: _0x5bed49,
  imageCandidates: imageCandidates = [],
  videoCandidates: videoCandidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const _0x4be5a2 = globalThis.document;
  if (!_0x4be5a2?.body) return false;
  const _0x54246e = normalizeImageCandidates(imageCandidates),
    _0x3ef2ee = normalizeVideoCandidates(videoCandidates);
  if (!_0x54246e.length && !_0x3ef2ee.length)
    return (showToast?.(webPreviewCaptureText('toasts.noMedia'), 'warning'), false);
  _0x4be5a2.querySelector('.web-preview-image-picker-overlay')?.remove();
  const _0x157d80 = new Set(),
    _0x3628ac = new Set(),
    _0x310446 = _0x4be5a2.createElement('div');
  let _0x14fe72 = false;
  ((_0x310446.className = 'web-preview-image-picker-overlay'),
    _0x310446.addEventListener('pointerdown', (_0x57c358) => {
      _0x57c358.stopPropagation();
      if (_0x57c358.target === _0x310446) _0x15d091();
    }));
  const _0xd81d9c = _0x4be5a2.createElement('section');
  ((_0xd81d9c.className = 'web-preview-image-picker web-preview-media-picker'),
    _0xd81d9c.addEventListener('pointerdown', (_0x2bfd2e) => _0x2bfd2e.stopPropagation()));
  const _0x3ee484 = _0x4be5a2.createElement('div');
  _0x3ee484.className = 'web-preview-image-picker-header';
  const _0x3509e9 = _0x4be5a2.createElement('h3');
  _0x3509e9.textContent = webPreviewCaptureText('mediaPicker.title');
  const _0x50de62 = _0x4be5a2.createElement('span');
  ((_0x50de62.className = 'web-preview-image-picker-count'),
    _0x3ee484.appendChild(_0x3509e9),
    _0x3ee484.appendChild(_0x50de62));
  const _0x49537b = _0x4be5a2.createElement('div');
  _0x49537b.className = 'web-preview-media-picker-content';
  let _0x1014be = 'all';
  const _0x1d4e31 = _0x4be5a2.createElement('div');
  _0x1d4e31.className = 'web-preview-image-picker-grid';
  const _0x10cce2 = _0x4be5a2.createElement('div');
  _0x10cce2.className = 'web-preview-image-picker-grid web-preview-video-picker-grid';
  const _0x15a406 = _0x4be5a2.createElement('p');
  ((_0x15a406.className = 'web-preview-video-picker-notice'),
    (_0x15a406.textContent = webPreviewCaptureText('mediaPicker.videoNotice')));
  const _0x3ac7a8 = _0x4be5a2.createElement('label');
  _0x3ac7a8.className = 'web-preview-video-picker-consent';
  const _0x14b810 = _0x4be5a2.createElement('input');
  _0x14b810.type = 'checkbox';
  const _0xc195c0 = _0x4be5a2.createElement('span');
  ((_0xc195c0.textContent = webPreviewCaptureText('mediaPicker.consent')),
    _0x3ac7a8.appendChild(_0x14b810),
    _0x3ac7a8.appendChild(_0xc195c0));
  const _0x301917 = _0x4be5a2.createElement('div');
  _0x301917.className = 'web-preview-media-picker-controls';
  const _0x1eec52 = _0x4be5a2.createElement('div');
  ((_0x1eec52.className = 'web-preview-media-picker-filter-group'), _0x301917.appendChild(_0x1eec52));
  const _0x47ce30 = _0x4be5a2.createElement('div');
  _0x47ce30.className = 'web-preview-image-picker-actions';
  const _0x3573c9 = _0x4be5a2.createElement('button');
  ((_0x3573c9.type = 'button'),
    (_0x3573c9.className = 'web-preview-image-picker-btn web-preview-media-picker-select-all'),
    (_0x3573c9.textContent = webPreviewCaptureText('buttons.selectAll')),
    _0x301917.appendChild(_0x3573c9));
  const _0x1d877b = _0x4be5a2.createElement('button');
  ((_0x1d877b.type = 'button'),
    (_0x1d877b.className = 'web-preview-image-picker-btn'),
    (_0x1d877b.textContent = webPreviewCaptureText('buttons.cancel')));
  const _0x4fd9c9 = _0x4be5a2.createElement('button');
  ((_0x4fd9c9.type = 'button'),
    (_0x4fd9c9.className = 'web-preview-image-picker-btn web-preview-image-picker-btn--primary'),
    (_0x4fd9c9.textContent = webPreviewCaptureText('buttons.addToCanvas')),
    _0x47ce30.appendChild(_0x1d877b),
    _0x47ce30.appendChild(_0x4fd9c9));
  const _0x2d9034 = () => _0x1014be === 'all' || _0x1014be === 'image',
    _0x5c0aee = () => _0x1014be === 'all' || _0x1014be === 'video',
    _0x2c368f = () => {
      if (_0x1014be === 'image') return _0x54246e.length > 0;
      if (_0x1014be === 'video') return _0x3ef2ee.length > 0;
      return _0x54246e.length > 0 || _0x3ef2ee.length > 0;
    },
    _0x2648ae = () => {
      const _0x3df4e2 = Math.min(_0x54246e.length, MAX_BATCH_CREATE_COUNT),
        _0x10faa3 = Math.min(_0x3ef2ee.length, MAX_VIDEO_CREATE_COUNT);
      if (_0x1014be === 'image') return _0x3df4e2 > 0 && _0x157d80.size >= _0x3df4e2;
      if (_0x1014be === 'video') return _0x10faa3 > 0 && _0x3628ac.size >= _0x10faa3;
      return (
        (_0x3df4e2 === 0 || _0x157d80.size >= _0x3df4e2) && (_0x10faa3 === 0 || _0x3628ac.size >= _0x10faa3)
      );
    },
    _0x144686 = () => {
      _0x1eec52.replaceChildren(
        createMediaFilterButton(
          _0x4be5a2,
          webPreviewCaptureText('filters.all'),
          'all',
          _0x1014be,
          false,
          _0x587187,
        ),
        createMediaFilterButton(
          _0x4be5a2,
          webPreviewCaptureText('filters.image'),
          'image',
          _0x1014be,
          _0x54246e.length === 0,
          _0x587187,
        ),
        createMediaFilterButton(
          _0x4be5a2,
          webPreviewCaptureText('filters.video'),
          'video',
          _0x1014be,
          _0x3ef2ee.length === 0,
          _0x587187,
        ),
      );
    };
  function _0x587187(_0x28b0a6) {
    ((_0x1014be = _0x28b0a6), _0x43fd2b(), _0x37171a());
  }
  function _0x4debee() {
    ((_0x1014be === 'all' || _0x1014be === 'image') &&
      selectCandidateUrls(_0x157d80, _0x54246e, MAX_BATCH_CREATE_COUNT),
      (_0x1014be === 'all' || _0x1014be === 'video') &&
        selectCandidateUrls(_0x3628ac, _0x3ef2ee, MAX_VIDEO_CREATE_COUNT));
  }
  function _0xb26d51() {
    ((_0x1014be === 'all' || _0x1014be === 'image') &&
      _0x54246e.forEach((_0x5dc4f6) => _0x157d80.delete(_0x5dc4f6.url)),
      (_0x1014be === 'all' || _0x1014be === 'video') &&
        _0x3ef2ee.forEach((_0x4bef41) => _0x3628ac.delete(_0x4bef41.url)));
  }
  const _0x37171a = () => {
      const _0x3fdc1b = Math.min(_0x54246e.length, MAX_BATCH_CREATE_COUNT),
        _0x325334 = Math.min(_0x3ef2ee.length, MAX_VIDEO_CREATE_COUNT);
      _0x50de62.textContent = webPreviewCaptureText('mediaPicker.count', {
        imageSelected: _0x157d80.size,
        imageMax: _0x3fdc1b,
        videoSelected: _0x3628ac.size,
        videoMax: _0x325334,
      });
      const _0x1fa2fb = _0x157d80.size > 0 || _0x3628ac.size > 0;
      _0x4fd9c9.disabled = !_0x1fa2fb || (_0x3628ac.size > 0 && _0x14b810.checked !== true);
      const _0x1bbcd6 = _0x2648ae();
      ((_0x3573c9.textContent = _0x1bbcd6
        ? webPreviewCaptureText('buttons.clearSelection')
        : webPreviewCaptureText('buttons.selectAll')),
        (_0x3573c9.disabled = !_0x2c368f()));
    },
    _0x21c63e = (_0x26456a, _0x3b7354) => {
      if (_0x3b7354) {
        if (_0x157d80.size >= MAX_BATCH_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.imageLimit', { limit: MAX_BATCH_CREATE_COUNT }),
            'warning',
          ),
            _0x39270e());
          return;
        }
        _0x157d80.add(_0x26456a);
      } else _0x157d80.delete(_0x26456a);
      _0x37171a();
    },
    _0x3415ce = (_0x5a1721, _0x35c1cd) => {
      if (_0x35c1cd) {
        if (_0x3628ac.size >= MAX_VIDEO_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.videoLimit', { limit: MAX_VIDEO_CREATE_COUNT }),
            'warning',
          ),
            _0x376fe2());
          return;
        }
        _0x3628ac.add(_0x5a1721);
      } else _0x3628ac.delete(_0x5a1721);
      _0x37171a();
    },
    _0x39270e = () => {
      (_0x1d4e31.replaceChildren(
        ..._0x54246e.map((_0x3fb928) => createImagePickerItem(_0x4be5a2, _0x3fb928, _0x157d80, _0x21c63e)),
      ),
        _0x37171a());
    },
    _0x376fe2 = () => {
      (_0x10cce2.replaceChildren(
        ..._0x3ef2ee.map((_0x49b654, _0x206509) =>
          createVideoPickerItem(_0x4be5a2, _0x49b654, _0x3628ac, _0x3415ce, _0x206509),
        ),
      ),
        _0x37171a());
    };
  function _0x43fd2b() {
    _0x144686();
    const _0x47a38d = [_0x301917];
    (_0x2d9034() &&
      _0x54246e.length &&
      _0x47a38d.push(createPickerSection(_0x4be5a2, webPreviewCaptureText('filters.image'), _0x1d4e31)),
      _0x5c0aee() &&
        _0x3ef2ee.length &&
        _0x47a38d.push(
          _0x15a406,
          _0x3ac7a8,
          createPickerSection(_0x4be5a2, webPreviewCaptureText('filters.video'), _0x10cce2),
        ),
      _0x49537b.replaceChildren(..._0x47a38d));
  }
  function _0x15d091() {
    if (_0x14fe72) return;
    ((_0x14fe72 = true),
      _0x310446.remove(),
      _0x4be5a2.removeEventListener('keydown', _0x8b834c, true),
      dispatchWebPreviewPickerSync('media-picker-close'));
  }
  const _0x8b834c = (_0x28510e) => {
    if (_0x28510e.key === 'Escape') _0x15d091();
  };
  return (
    _0x14b810.addEventListener('change', _0x37171a),
    _0x3573c9.addEventListener('click', () => {
      (_0x2648ae() ? _0xb26d51() : _0x4debee(), _0x39270e(), _0x376fe2());
    }),
    _0x1d877b.addEventListener('click', _0x15d091),
    _0x4fd9c9.addEventListener('click', () => {
      const _0x206acd = _0x54246e.filter((_0xa0a535) => _0x157d80.has(_0xa0a535.url)),
        _0x3277cf = _0x3ef2ee.filter((_0x5e88e2) => _0x3628ac.has(_0x5e88e2.url)),
        _0x301622 = createBatchWebMediaNodes({
          nodeId: _0x5bed49,
          imageCandidates: _0x206acd,
          videoCandidates: _0x3277cf,
          storeInstance: storeInstance,
          commitFn: commitFn,
          rightsConfirmed: _0x3628ac.size > 0 && _0x14b810.checked === true,
        });
      if (_0x301622.length)
        showToast?.(webPreviewCaptureText('toasts.mediaAdded', { count: _0x301622.length }), 'success');
      _0x15d091();
    }),
    _0x39270e(),
    _0x376fe2(),
    _0x43fd2b(),
    _0xd81d9c.appendChild(_0x3ee484),
    _0xd81d9c.appendChild(_0x49537b),
    _0xd81d9c.appendChild(_0x47ce30),
    _0x310446.appendChild(_0xd81d9c),
    _0x4be5a2.body.appendChild(_0x310446),
    _0x4be5a2.addEventListener('keydown', _0x8b834c, true),
    dispatchWebPreviewPickerSync('media-picker-open'),
    true
  );
}
export function openWebPreviewVideoPicker({
  nodeId: _0x37d943,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const _0x597ef2 = globalThis.document;
  if (!_0x597ef2?.body) return false;
  const _0x5a38ce = normalizeVideoCandidates(candidates);
  if (!_0x5a38ce.length) return (showToast?.(webPreviewCaptureText('toasts.noVideos'), 'warning'), false);
  _0x597ef2.querySelector('.web-preview-image-picker-overlay')?.remove();
  const _0x2eaa55 = new Set(),
    _0x3209bb = _0x597ef2.createElement('div');
  let _0x2a64ed = false;
  ((_0x3209bb.className = 'web-preview-image-picker-overlay'),
    _0x3209bb.addEventListener('pointerdown', (_0x1f613b) => {
      _0x1f613b.stopPropagation();
      if (_0x1f613b.target === _0x3209bb) _0xa1e7c0();
    }));
  const _0x188254 = _0x597ef2.createElement('section');
  ((_0x188254.className = 'web-preview-image-picker web-preview-video-picker'),
    _0x188254.addEventListener('pointerdown', (_0x3fc4aa) => _0x3fc4aa.stopPropagation()));
  const _0x3fe0a1 = _0x597ef2.createElement('div');
  _0x3fe0a1.className = 'web-preview-image-picker-header';
  const _0x50a257 = _0x597ef2.createElement('h3');
  _0x50a257.textContent = webPreviewCaptureText('videoPicker.title');
  const _0x3ca0d5 = _0x597ef2.createElement('span');
  ((_0x3ca0d5.className = 'web-preview-image-picker-count'),
    _0x3fe0a1.appendChild(_0x50a257),
    _0x3fe0a1.appendChild(_0x3ca0d5));
  const _0x488b11 = _0x597ef2.createElement('p');
  ((_0x488b11.className = 'web-preview-video-picker-notice'),
    (_0x488b11.textContent = webPreviewCaptureText('videoPicker.notice')));
  const _0x2e0d19 = _0x597ef2.createElement('label');
  _0x2e0d19.className = 'web-preview-video-picker-consent';
  const _0x250436 = _0x597ef2.createElement('input');
  _0x250436.type = 'checkbox';
  const _0x3ce8c = _0x597ef2.createElement('span');
  ((_0x3ce8c.textContent = webPreviewCaptureText('mediaPicker.consent')),
    _0x2e0d19.appendChild(_0x250436),
    _0x2e0d19.appendChild(_0x3ce8c));
  const _0x205a79 = _0x597ef2.createElement('div');
  _0x205a79.className = 'web-preview-image-picker-grid web-preview-video-picker-grid';
  const _0x37ff84 = _0x597ef2.createElement('div');
  _0x37ff84.className = 'web-preview-image-picker-actions';
  const _0x2bc67b = _0x597ef2.createElement('button');
  ((_0x2bc67b.type = 'button'),
    (_0x2bc67b.className = 'web-preview-image-picker-btn'),
    (_0x2bc67b.textContent = webPreviewCaptureText('buttons.selectAll')));
  const _0x5ead9b = _0x597ef2.createElement('button');
  ((_0x5ead9b.type = 'button'),
    (_0x5ead9b.className = 'web-preview-image-picker-btn'),
    (_0x5ead9b.textContent = webPreviewCaptureText('buttons.cancel')));
  const _0x13f78c = _0x597ef2.createElement('button');
  ((_0x13f78c.type = 'button'),
    (_0x13f78c.className = 'web-preview-image-picker-btn web-preview-image-picker-btn--primary'),
    (_0x13f78c.textContent = webPreviewCaptureText('buttons.saveAsSourceVideo')),
    _0x37ff84.appendChild(_0x2bc67b),
    _0x37ff84.appendChild(_0x5ead9b),
    _0x37ff84.appendChild(_0x13f78c));
  const _0x50a311 = () => {
      const _0xdc387 = Math.min(_0x5a38ce.length, MAX_VIDEO_CREATE_COUNT);
      ((_0x3ca0d5.textContent = _0x2eaa55.size + '/' + _0xdc387),
        (_0x13f78c.disabled = _0x2eaa55.size === 0 || _0x250436.checked !== true),
        (_0x2bc67b.disabled = _0x2eaa55.size >= _0xdc387));
    },
    _0x2fcba1 = (_0x279746, _0x44c2a1) => {
      if (_0x44c2a1) {
        if (_0x2eaa55.size >= MAX_VIDEO_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.videoLimit', { limit: MAX_VIDEO_CREATE_COUNT }),
            'warning',
          ),
            _0x1a7387());
          return;
        }
        _0x2eaa55.add(_0x279746);
      } else _0x2eaa55.delete(_0x279746);
      _0x50a311();
    },
    _0x1a7387 = () => {
      (_0x205a79.replaceChildren(
        ..._0x5a38ce.map((_0x15302c, _0xbaaf64) =>
          createVideoPickerItem(_0x597ef2, _0x15302c, _0x2eaa55, _0x2fcba1, _0xbaaf64),
        ),
      ),
        _0x50a311());
    };
  function _0xa1e7c0() {
    if (_0x2a64ed) return;
    ((_0x2a64ed = true),
      _0x3209bb.remove(),
      _0x597ef2.removeEventListener('keydown', _0x3c272d, true),
      dispatchWebPreviewPickerSync('video-picker-close'));
  }
  const _0x3c272d = (_0xa5ab7d) => {
    if (_0xa5ab7d.key === 'Escape') _0xa1e7c0();
  };
  return (
    _0x250436.addEventListener('change', _0x50a311),
    _0x2bc67b.addEventListener('click', () => {
      (selectCandidateUrls(_0x2eaa55, _0x5a38ce, MAX_VIDEO_CREATE_COUNT), _0x1a7387());
    }),
    _0x5ead9b.addEventListener('click', _0xa1e7c0),
    _0x13f78c.addEventListener('click', () => {
      const _0x23cf3a = _0x5a38ce.filter((_0x235bde) => _0x2eaa55.has(_0x235bde.url)),
        _0x2c3aa6 = createBatchWebVideoNodes({
          nodeId: _0x37d943,
          candidates: _0x23cf3a,
          storeInstance: storeInstance,
          commitFn: commitFn,
          rightsConfirmed: _0x250436.checked === true,
        });
      (_0x2c3aa6.length &&
        showToast?.(webPreviewCaptureText('toasts.videosSaved', { count: _0x2c3aa6.length }), 'success'),
        _0xa1e7c0());
    }),
    _0x1a7387(),
    _0x188254.appendChild(_0x3fe0a1),
    _0x188254.appendChild(_0x488b11),
    _0x188254.appendChild(_0x2e0d19),
    _0x188254.appendChild(_0x205a79),
    _0x188254.appendChild(_0x37ff84),
    _0x3209bb.appendChild(_0x188254),
    _0x597ef2.body.appendChild(_0x3209bb),
    _0x597ef2.addEventListener('keydown', _0x3c272d, true),
    dispatchWebPreviewPickerSync('video-picker-open'),
    true
  );
}
export function openWebPreviewImagePicker({
  nodeId: _0x326fcd,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const _0xbc5010 = globalThis.document;
  if (!_0xbc5010?.body) return false;
  const _0x234bb9 = normalizeImageCandidates(candidates);
  if (!_0x234bb9.length) return (showToast?.(webPreviewCaptureText('toasts.noImages'), 'warning'), false);
  _0xbc5010.querySelector('.web-preview-image-picker-overlay')?.remove();
  const _0x4172cc = new Set(),
    _0x19f6db = _0xbc5010.createElement('div');
  let _0xcc56c1 = false;
  ((_0x19f6db.className = 'web-preview-image-picker-overlay'),
    _0x19f6db.addEventListener('pointerdown', (_0x704138) => {
      _0x704138.stopPropagation();
      if (_0x704138.target === _0x19f6db) _0x347003();
    }));
  const _0x2e3c60 = _0xbc5010.createElement('section');
  ((_0x2e3c60.className = 'web-preview-image-picker'),
    _0x2e3c60.addEventListener('pointerdown', (_0xd064f0) => _0xd064f0.stopPropagation()));
  const _0x4edf87 = _0xbc5010.createElement('div');
  _0x4edf87.className = 'web-preview-image-picker-header';
  const _0x15a9ba = _0xbc5010.createElement('h3');
  _0x15a9ba.textContent = webPreviewCaptureText('imagePicker.title');
  const _0x56b092 = _0xbc5010.createElement('span');
  ((_0x56b092.className = 'web-preview-image-picker-count'),
    _0x4edf87.appendChild(_0x15a9ba),
    _0x4edf87.appendChild(_0x56b092));
  const _0x5dcb42 = _0xbc5010.createElement('div');
  _0x5dcb42.className = 'web-preview-image-picker-grid';
  const _0x4ef996 = _0xbc5010.createElement('div');
  _0x4ef996.className = 'web-preview-image-picker-actions';
  const _0x6caf2a = _0xbc5010.createElement('button');
  ((_0x6caf2a.type = 'button'),
    (_0x6caf2a.className = 'web-preview-image-picker-btn'),
    (_0x6caf2a.textContent = webPreviewCaptureText('buttons.selectAll')));
  const _0x548a57 = _0xbc5010.createElement('button');
  ((_0x548a57.type = 'button'),
    (_0x548a57.className = 'web-preview-image-picker-btn'),
    (_0x548a57.textContent = webPreviewCaptureText('buttons.cancel')));
  const _0x2e7a51 = _0xbc5010.createElement('button');
  ((_0x2e7a51.type = 'button'),
    (_0x2e7a51.className = 'web-preview-image-picker-btn web-preview-image-picker-btn--primary'),
    (_0x2e7a51.textContent = webPreviewCaptureText('buttons.addToCanvas')),
    _0x4ef996.appendChild(_0x6caf2a),
    _0x4ef996.appendChild(_0x548a57),
    _0x4ef996.appendChild(_0x2e7a51));
  const _0x3ce2bd = () => {
      const _0x1086cd = Math.min(_0x234bb9.length, MAX_BATCH_CREATE_COUNT);
      ((_0x56b092.textContent = _0x4172cc.size + '/' + _0x1086cd),
        (_0x2e7a51.disabled = _0x4172cc.size === 0),
        (_0x6caf2a.disabled = _0x4172cc.size >= _0x1086cd));
    },
    _0x719d8a = (_0x430055, _0x3838dc) => {
      if (_0x3838dc) {
        if (_0x4172cc.size >= MAX_BATCH_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.imageLimit', { limit: MAX_BATCH_CREATE_COUNT }),
            'warning',
          ),
            _0x56d2e5());
          return;
        }
        _0x4172cc.add(_0x430055);
      } else _0x4172cc.delete(_0x430055);
      _0x3ce2bd();
    },
    _0x56d2e5 = () => {
      (_0x5dcb42.replaceChildren(
        ..._0x234bb9.map((_0x12a18f) => createImagePickerItem(_0xbc5010, _0x12a18f, _0x4172cc, _0x719d8a)),
      ),
        _0x3ce2bd());
    };
  function _0x347003() {
    if (_0xcc56c1) return;
    ((_0xcc56c1 = true),
      _0x19f6db.remove(),
      _0xbc5010.removeEventListener('keydown', _0x8f61a, true),
      dispatchWebPreviewPickerSync('image-picker-close'));
  }
  const _0x8f61a = (_0x290ad7) => {
    if (_0x290ad7.key === 'Escape') _0x347003();
  };
  return (
    _0x6caf2a.addEventListener('click', () => {
      (selectCandidateUrls(_0x4172cc, _0x234bb9, MAX_BATCH_CREATE_COUNT), _0x56d2e5());
    }),
    _0x548a57.addEventListener('click', _0x347003),
    _0x2e7a51.addEventListener('click', () => {
      const _0x134b6a = _0x234bb9.filter((_0x194bd2) => _0x4172cc.has(_0x194bd2.url)),
        _0x3ac293 = createBatchWebImageNodes({
          nodeId: _0x326fcd,
          candidates: _0x134b6a,
          storeInstance: storeInstance,
          commitFn: commitFn,
        });
      (_0x3ac293.length &&
        showToast?.(webPreviewCaptureText('toasts.imagesAdded', { count: _0x3ac293.length }), 'success'),
        _0x347003());
    }),
    _0x56d2e5(),
    _0x2e3c60.appendChild(_0x4edf87),
    _0x2e3c60.appendChild(_0x5dcb42),
    _0x2e3c60.appendChild(_0x4ef996),
    _0x19f6db.appendChild(_0x2e3c60),
    _0xbc5010.body.appendChild(_0x19f6db),
    _0xbc5010.addEventListener('keydown', _0x8f61a, true),
    dispatchWebPreviewPickerSync('image-picker-open'),
    true
  );
}
