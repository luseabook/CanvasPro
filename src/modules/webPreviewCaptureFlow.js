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
  MIN_EXTRACT_IMAGE_AREA = 12000,
  STREAM_MEDIA_URL_EXTENSION_RE = /\.(?:m3u8|mpd|m4s)(?:[?#].*)?$/i,
  WEB_PREVIEW_REVERSE_IMAGE_PROMPT_NODE_NAME = '反推提示词-创建';
function webPreviewCaptureText(value, item = {}) {
  return t('webPreview.capture.' + value, item);
}
function dispatchWebPreviewPickerSync(reason) {
  const key = globalThis.window;
  if (typeof key?.dispatchEvent !== 'function') return;
  try {
    const index =
      typeof globalThis.CustomEvent === 'function'
        ? new CustomEvent('web-preview:force-sync', { detail: { reason: reason } })
        : { type: 'web-preview:force-sync', detail: { reason: reason } };
    key.dispatchEvent(index);
  } catch {}
}
function normalizeHttpUrl(result) {
  const enabled = String(result || '').trim();
  if (!enabled) return '';
  try {
    const uRL = new URL(enabled, globalThis.location?.href || 'https://example.invalid/');
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.href);
  } catch {
    return '';
  }
}
function getGraphState(store = appStore) {
  return store.getStateRaw?.() || store.getState?.() || {};
}
function getAnchorNode(data, options = appStore) {
  const graphState = getGraphState(options);
  return graphState.nodes?.[data] || null;
}
function isExtractableImageSize(target, source) {
  const enabled2 = Math.max(0, Math.round(Number(target || 0) || 0)),
    enabled3 = Math.max(0, Math.round(Number(source || 0) || 0));
  if (!enabled2 || !enabled3) return true;
  return (
    enabled2 >= MIN_EXTRACT_IMAGE_WIDTH &&
    enabled3 >= MIN_EXTRACT_IMAGE_HEIGHT &&
    enabled2 * enabled3 >= MIN_EXTRACT_IMAGE_AREA
  );
}
function normalizeImageCandidate(box = {}) {
  const url = normalizeHttpUrl(box?.url);
  if (!url) return null;
  const box2 = {
    url: url,
    title: String(box?.title || box?.alt || webPreviewCaptureText('fallback.image'))
      .trim()
      .slice(0, 160),
    pageUrl: normalizeHttpUrl(box?.pageUrl || box?.sourceUrl || ''),
    pageTitle: String(box?.pageTitle || '')
      .trim()
      .slice(0, 160),
    nodeId: String(box?.nodeId || '').trim(),
    tabId: String(box?.tabId || '').trim(),
    width: Math.max(0, Math.round(Number(box?.width || 0) || 0)),
    height: Math.max(0, Math.round(Number(box?.height || 0) || 0)),
  };
  if (!isExtractableImageSize(box2.width, box2.height)) return null;
  return box2;
}
function normalizeImageCandidates(list = []) {
  const map = new Set(),
    list2 = [];
  for (const next of Array.isArray(list) ? list : []) {
    const response = normalizeImageCandidate(next);
    if (!response || map.has(response.url)) continue;
    (map.add(response.url), list2.push(response));
  }
  return list2;
}
function isStreamMediaUrl(current) {
  const httpUrl = normalizeHttpUrl(current);
  if (!httpUrl) return false;
  try {
    return STREAM_MEDIA_URL_EXTENSION_RE.test(new URL(httpUrl).pathname);
  } catch {
    return false;
  }
}
function normalizeVideoCandidate(box3 = {}) {
  const url2 = normalizeHttpUrl(box3?.url);
  if (!url2 || isStreamMediaUrl(url2)) return null;
  return {
    kind: 'video',
    url: url2,
    title: String(box3?.title || webPreviewCaptureText('fallback.video'))
      .trim()
      .slice(0, 160),
    pageUrl: normalizeHttpUrl(box3?.pageUrl || box3?.sourceUrl || ''),
    pageTitle: String(box3?.pageTitle || '')
      .trim()
      .slice(0, 160),
    nodeId: String(box3?.nodeId || '').trim(),
    tabId: String(box3?.tabId || '').trim(),
    width: Math.max(0, Math.round(Number(box3?.width || 0) || 0)),
    height: Math.max(0, Math.round(Number(box3?.height || 0) || 0)),
    duration: Math.max(0, Number(box3?.duration || 0) || 0),
    mimeType: String(box3?.mimeType || '').trim(),
    sourceType: String(box3?.sourceType || '')
      .trim()
      .toLowerCase(),
  };
}
function normalizeVideoCandidates(list3 = []) {
  const map2 = new Set(),
    list4 = [];
  for (const entry of Array.isArray(list3) ? list3 : []) {
    const response2 = normalizeVideoCandidate(entry);
    if (!response2 || map2.has(response2.url)) continue;
    (map2.add(response2.url), list4.push(response2));
  }
  return list4;
}
function getViewportCenterTopLeft(box4, record = appStore) {
  const graphState2 = getGraphState(record),
    handle = (globalThis.window?.innerWidth || 1280) / 2,
    state = (globalThis.window?.innerHeight || 720) / 2,
    x = screenToWorld(handle, state, graphState2.viewport || {});
  return { x: x.x - box4.width / 2, y: x.y - box4.height / 2 };
}
function getSingleNodeSpawnPosition({
  nodeId: nodeId,
  storeInstance: storeInstance = appStore,
  size: size,
} = {}) {
  const graphState3 = getGraphState(storeInstance),
    anchorNode = getAnchorNode(nodeId, storeInstance);
  return anchorNode
    ? calcSafeSpawnPosNearNode(graphState3.nodes || {}, anchorNode, size.width, size.height)
    : getViewportCenterTopLeft(size, storeInstance);
}
export function createWebPreviewTextNodeFromSelection({
  nodeId: nodeId2,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const prompt = String(payload?.text || '').trim();
  if (!prompt) return null;
  const width = getAIGenerationDefaultSizeByType('ai-text'),
    graphState4 = getGraphState(storeInstance),
    anchorNode2 = getAnchorNode(nodeId2 || payload?.nodeId, storeInstance),
    x2 = anchorNode2
      ? calcSafeSpawnPosNearNode(graphState4.nodes || {}, anchorNode2, width.width, width.height)
      : getViewportCenterTopLeft(width, storeInstance),
    id = generateId('ai-text'),
    config = {
      id: id,
      type: 'ai-text',
      x: x2.x,
      y: x2.y,
      width: width.width,
      height: width.height,
      name: webPreviewCaptureText('nodeNames.generatedText'),
      prompt: prompt,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (storeInstance.addNode?.(config), storeInstance.setSelectedNodes?.([id]), commitFn?.(), config);
}
export function createWebPreviewSourceTextNodeFromSelection({
  nodeId: nodeId3,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const content = String(payload?.text || '').trim();
  if (!content) return null;
  const size2 = getNodeDefaultSize('source-text'),
    x3 = getSingleNodeSpawnPosition({
      nodeId: nodeId3 || payload?.nodeId,
      storeInstance: storeInstance,
      size: size2,
    }),
    id2 = generateId('source-text'),
    scope = {
      id: id2,
      type: 'source-text',
      x: x3.x,
      y: x3.y,
      width: size2.width,
      height: size2.height,
      name: webPreviewCaptureText('nodeNames.sourceText'),
      content: content,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (storeInstance.addNode?.(scope), storeInstance.setSelectedNodes?.([id2]), commitFn?.(), scope);
}
export function createWebPreviewImagePromptNodeFromSelection({
  nodeId: nodeId4,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const prompt2 = String(payload?.text || '').trim();
  if (!prompt2) return null;
  const size3 = getAIGenerationDefaultSizeByType('ai-image'),
    x4 = getSingleNodeSpawnPosition({
      nodeId: nodeId4 || payload?.nodeId,
      storeInstance: storeInstance,
      size: size3,
    }),
    id3 = generateId('ai-image'),
    input = {
      id: id3,
      type: 'ai-image',
      x: x4.x,
      y: x4.y,
      width: size3.width,
      height: size3.height,
      name: webPreviewCaptureText('nodeNames.imagePrompt'),
      prompt: prompt2,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (storeInstance.addNode?.(input), storeInstance.setSelectedNodes?.([id3]), commitFn?.(), input);
}
export function createWebPreviewVideoPromptNodeFromSelection({
  nodeId: nodeId5,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const prompt3 = String(payload?.text || '').trim();
  if (!prompt3) return null;
  const size4 = getAIGenerationDefaultSizeByType('ai-video'),
    x5 = getSingleNodeSpawnPosition({
      nodeId: nodeId5 || payload?.nodeId,
      storeInstance: storeInstance,
      size: size4,
    }),
    id4 = generateId('ai-video'),
    output = {
      id: id4,
      type: 'ai-video',
      x: x5.x,
      y: x5.y,
      width: size4.width,
      height: size4.height,
      name: webPreviewCaptureText('nodeNames.videoPrompt'),
      prompt: prompt3,
      webPageUrl: normalizeHttpUrl(payload?.pageUrl || ''),
      webSourceTitle: String(payload?.webSourceTitle || '')
        .trim()
        .slice(0, 160),
    };
  return (storeInstance.addNode?.(output), storeInstance.setSelectedNodes?.([id4]), commitFn?.(), output);
}
export function createWebPreviewImageNodeFromContext({
  nodeId: nodeId6,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  importRemote: importRemote = true,
  importRemoteAsset: importRemoteAsset,
} = {}) {
  const title = normalizeImageCandidate(payload);
  if (!title) return null;
  const size5 = getNodeDefaultSize('source-image'),
    worldX = getSingleNodeSpawnPosition({
      nodeId: nodeId6 || title.nodeId,
      storeInstance: storeInstance,
      size: size5,
    }),
    webImageSourceNode = createWebImageSourceNode({
      payload: {
        ...title,
        title: title.title || title.pageTitle || webPreviewCaptureText('fallback.image'),
        pageUrl: title.pageUrl,
      },
      worldX: worldX.x,
      worldY: worldX.y,
      storeInstance: storeInstance,
      projectId: projectId,
      select: true,
      importRemote: importRemote,
      importRemoteAsset: importRemoteAsset,
    });
  if (webImageSourceNode) commitFn?.();
  return webImageSourceNode;
}
export function createWebPreviewReverseImagePromptNodes({
  nodeId: nodeId7,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  importRemote: importRemote = true,
  importRemoteAsset: importRemoteAsset2,
} = {}) {
  const title2 = normalizeImageCandidate(payload);
  if (!title2) return null;
  const size6 = getNodeDefaultSize('source-image'),
    worldX2 = getSingleNodeSpawnPosition({
      nodeId: nodeId7 || title2.nodeId,
      storeInstance: storeInstance,
      size: size6,
    }),
    sourceId = createWebImageSourceNode({
      payload: {
        ...title2,
        title: title2.title || title2.pageTitle || webPreviewCaptureText('fallback.image'),
        pageUrl: title2.pageUrl,
      },
      worldX: worldX2.x,
      worldY: worldX2.y,
      storeInstance: storeInstance,
      projectId: projectId,
      select: false,
      importRemote: importRemote,
      importRemoteAsset: importRemoteAsset2,
    });
  if (!sourceId) return null;
  const width2 = getAIGenerationDefaultSizeByType('ai-text'),
    graphState5 = getGraphState(storeInstance),
    x6 = calcSafeSpawnPosNearNode(
      { ...(graphState5.nodes || {}), [sourceId.id]: sourceId },
      sourceId,
      width2.width,
      width2.height,
    ),
    id5 = generateId('ai-text'),
    targetId = {
      id: id5,
      type: 'ai-text',
      x: x6.x,
      y: x6.y,
      width: width2.width,
      height: width2.height,
      name: WEB_PREVIEW_REVERSE_IMAGE_PROMPT_NODE_NAME,
      prompt: REVERSE_IMAGE_PROMPT_PRESET_PROMPT,
      webPageUrl: title2.pageUrl,
      webSourceTitle: (title2.pageTitle || title2.title || '').slice(0, 160),
    },
    edge = { id: generateId('edge'), sourceId: sourceId.id, targetId: targetId.id };
  return (
    storeInstance.addNode?.(targetId),
    storeInstance.addEdge?.(edge),
    storeInstance.setSelectedNodes?.([targetId.id]),
    commitFn?.(),
    { imageNode: sourceId, textNode: targetId, edge: edge }
  );
}
export function createBatchWebImageNodes({
  nodeId: nodeId8,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
} = {}) {
  const itemCount = normalizeImageCandidates(candidates).slice(0, MAX_BATCH_CREATE_COUNT);
  if (!itemCount.length) return [];
  const nodes = getGraphState(storeInstance),
    anchorNode3 = getAnchorNode(nodeId8, storeInstance),
    itemWidth = getNodeDefaultSize('source-image'),
    value2 = anchorNode3
      ? createBatchSpawnLayoutNearNode({
          nodes: nodes.nodes || {},
          anchorNode: anchorNode3,
          itemCount: itemCount.length,
          itemWidth: itemWidth.width,
          itemHeight: itemWidth.height,
        })
      : null,
    x7 = value2 ? null : getViewportCenterTopLeft(itemWidth, storeInstance),
    list5 = [];
  return (
    itemCount.forEach((title3, value3) => {
      const worldX3 = value2
          ? value2.getItemPosition(value3)
          : { x: x7.x + value3 * 30, y: x7.y + value3 * 30 },
        webImageSourceNode2 = createWebImageSourceNode({
          payload: {
            ...title3,
            title: title3.title || title3.pageTitle || webPreviewCaptureText('fallback.image'),
            pageUrl: title3.pageUrl,
          },
          worldX: worldX3.x,
          worldY: worldX3.y,
          storeInstance: storeInstance,
          projectId: projectId,
          select: false,
        });
      if (webImageSourceNode2) list5.push(webImageSourceNode2);
    }),
    list5.length && (storeInstance.setSelectedNodes?.(list5.map((item2) => item2.id)), commitFn?.()),
    list5
  );
}
export function createBatchWebVideoNodes({
  nodeId: nodeId9,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  rightsConfirmed: rightsConfirmed = false,
  importRemoteAsset: importRemoteAsset3,
} = {}) {
  const itemCount2 = normalizeVideoCandidates(candidates).slice(0, MAX_VIDEO_CREATE_COUNT);
  if (!itemCount2.length || rightsConfirmed !== true) return [];
  const nodes2 = getGraphState(storeInstance),
    anchorNode4 = getAnchorNode(nodeId9, storeInstance),
    itemWidth2 = getNodeDefaultSize('source-video'),
    value4 = anchorNode4
      ? createBatchSpawnLayoutNearNode({
          nodes: nodes2.nodes || {},
          anchorNode: anchorNode4,
          itemCount: itemCount2.length,
          itemWidth: itemWidth2.width,
          itemHeight: itemWidth2.height,
        })
      : null,
    x8 = value4 ? null : getViewportCenterTopLeft(itemWidth2, storeInstance),
    list6 = [];
  return (
    itemCount2.forEach((title4, value5) => {
      const worldX4 = value4
          ? value4.getItemPosition(value5)
          : { x: x8.x + value5 * 30, y: x8.y + value5 * 30 },
        webVideoSourceNode = createWebVideoSourceNode({
          payload: {
            ...title4,
            title: title4.title || title4.pageTitle || webPreviewCaptureText('fallback.video'),
            pageUrl: title4.pageUrl,
            rightsConfirmed: rightsConfirmed,
          },
          worldX: worldX4.x,
          worldY: worldX4.y,
          storeInstance: storeInstance,
          projectId: projectId,
          importRemoteAsset: importRemoteAsset3,
          select: false,
        });
      if (webVideoSourceNode) list6.push(webVideoSourceNode);
    }),
    list6.length && (storeInstance.setSelectedNodes?.(list6.map((item3) => item3.id)), commitFn?.()),
    list6
  );
}
export function createBatchWebMediaNodes({
  nodeId: nodeId10,
  imageCandidates: imageCandidates = [],
  videoCandidates: videoCandidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  projectId: projectId = globalThis.window?.currentProjectId,
  rightsConfirmed: rightsConfirmed = false,
  importRemoteAsset: importRemoteAsset4,
} = {}) {
  const list7 = normalizeImageCandidates(imageCandidates).slice(0, MAX_BATCH_CREATE_COUNT),
    list8 =
      rightsConfirmed === true
        ? normalizeVideoCandidates(videoCandidates).slice(0, MAX_VIDEO_CREATE_COUNT)
        : [],
    itemCount3 = [
      ...list7.map((candidate) => ({ kind: 'image', candidate: candidate })),
      ...list8.map((candidate2) => ({ kind: 'video', candidate: candidate2 })),
    ];
  if (!itemCount3.length) return [];
  const nodes3 = getGraphState(storeInstance),
    anchorNode5 = getAnchorNode(nodeId10, storeInstance),
    itemWidth3 = getNodeDefaultSize('source-image'),
    value6 = anchorNode5
      ? createBatchSpawnLayoutNearNode({
          nodes: nodes3.nodes || {},
          anchorNode: anchorNode5,
          itemCount: itemCount3.length,
          itemWidth: itemWidth3.width,
          itemHeight: itemWidth3.height,
        })
      : null,
    x9 = value6 ? null : getViewportCenterTopLeft(itemWidth3, storeInstance),
    list9 = [];
  return (
    itemCount3.forEach((title5, value7) => {
      const worldX5 = value6
          ? value6.getItemPosition(value7)
          : { x: x9.x + value7 * 30, y: x9.y + value7 * 30 },
        args = {
          worldX: worldX5.x,
          worldY: worldX5.y,
          storeInstance: storeInstance,
          projectId: projectId,
          select: false,
          importRemoteAsset: importRemoteAsset4,
        },
        value8 =
          title5.kind === 'video'
            ? createWebVideoSourceNode({
                ...args,
                payload: {
                  ...title5.candidate,
                  title:
                    title5.candidate.title ||
                    title5.candidate.pageTitle ||
                    webPreviewCaptureText('fallback.video'),
                  pageUrl: title5.candidate.pageUrl,
                  rightsConfirmed: true,
                },
              })
            : createWebImageSourceNode({
                ...args,
                payload: {
                  ...title5.candidate,
                  title:
                    title5.candidate.title ||
                    title5.candidate.pageTitle ||
                    webPreviewCaptureText('fallback.image'),
                  pageUrl: title5.candidate.pageUrl,
                },
              });
      if (value8) list9.push(value8);
    }),
    list9.length && (storeInstance.setSelectedNodes?.(list9.map((item4) => item4.id)), commitFn?.()),
    list9
  );
}
export function createWebReferenceCardNode({
  nodeId: nodeId11,
  payload: payload = {},
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
} = {}) {
  const webPageUrl = normalizeHttpUrl(payload?.pageUrl || payload?.url || ''),
    webSourceTitle = String(
      payload?.pageTitle || payload?.title || webPageUrl || webPreviewCaptureText('fallback.reference'),
    )
      .trim()
      .slice(0, 160),
    webSelectedText = String(payload?.selectedText || payload?.text || '')
      .trim()
      .slice(0, 5000),
    webScreenshotUrl = String(payload?.screenshotDataUrl || payload?.screenshot || ''),
    webCapturedAt = String(payload?.capturedAt || new Date().toISOString()).trim(),
    width3 = getNodeDefaultSize('web-reference-card'),
    graphState6 = getGraphState(storeInstance),
    anchorNode6 = getAnchorNode(nodeId11 || payload?.nodeId, storeInstance),
    x10 = anchorNode6
      ? calcSafeSpawnPosNearNode(graphState6.nodes || {}, anchorNode6, width3.width, width3.height)
      : getViewportCenterTopLeft(width3, storeInstance),
    id6 = generateId('web-reference-card'),
    value9 = {
      id: id6,
      type: 'web-reference-card',
      x: x10.x,
      y: x10.y,
      width: width3.width,
      height: width3.height,
      name: webPreviewCaptureText('nodeNames.webReference'),
      webSourceTitle: webSourceTitle,
      webPageUrl: webPageUrl,
      webScreenshotUrl: webScreenshotUrl.startsWith('data:image/') ? webScreenshotUrl : '',
      webSelectedText: webSelectedText,
      webCapturedAt: webCapturedAt,
    };
  return (storeInstance.addNode?.(value9), storeInstance.setSelectedNodes?.([id6]), commitFn?.(), value9);
}
function createImagePickerItem(el, box5, map3, handler) {
  const el2 = el.createElement('label');
  el2.className = 'web-preview-image-picker-item';
  const el3 = el.createElement('input');
  ((el3.type = 'checkbox'),
    (el3.checked = map3.has(box5.url)),
    el3.addEventListener('change', () => handler(box5.url, el3.checked)));
  const value10 = el.createElement('img');
  ((value10.className = 'web-preview-image-picker-thumb'),
    (value10.src = box5.url),
    (value10.alt = box5.title || ''),
    (value10.loading = 'lazy'),
    (value10.decoding = 'async'),
    (value10.referrerPolicy = 'no-referrer'));
  const el4 = el.createElement('span');
  ((el4.className = 'web-preview-image-picker-title'),
    (el4.textContent = box5.title || webPreviewCaptureText('fallback.image')));
  const el5 = el.createElement('span');
  return (
    (el5.className = 'web-preview-image-picker-meta'),
    (el5.textContent = box5.width && box5.height ? box5.width + ' x ' + box5.height : ''),
    el2.appendChild(el3),
    el2.appendChild(value10),
    el2.appendChild(el4),
    el2.appendChild(el5),
    el2
  );
}
function formatVideoDuration(value11) {
  const enabled4 = Math.round(Number(value11 || 0) || 0);
  if (!enabled4) return '';
  const value12 = Math.floor(enabled4 / 60),
    value13 = enabled4 % 60;
  return value12 + ':' + String(value13).padStart(2, '0');
}
function formatVideoCandidateIndex(value14) {
  const value15 = Math.max(1, Math.round(Number(value14 || 0) || 0) + 1);
  return '#' + String(value15).padStart(2, '0');
}
function getUrlHost(value16) {
  try {
    return new URL(value16).hostname;
  } catch {
    return '';
  }
}
function shortenVideoToken(value17, value18 = 24) {
  const list10 = String(value17 || '').trim();
  if (list10.length <= value18) return list10;
  return list10.slice(0, Math.max(6, value18 - 7)) + '...' + list10.slice(-4);
}
function getVideoUrlFingerprint(value19) {
  try {
    const uRL2 = new URL(value19),
      value20 = ['video_id', 'vid', 'item_id', 'aweme_id', 'note_id', 'id', 'aid', 'file_id'];
    for (const value21 of value20) {
      const value22 = uRL2.searchParams.get(value21);
      if (value22) return value21 + '=' + shortenVideoToken(value22, 22);
    }
    const value23 = uRL2.pathname.split('/').filter(Boolean),
      decodeURIComponent2 = decodeURIComponent(value23.at(-1) || '').trim();
    if (decodeURIComponent2 && decodeURIComponent2 !== 'play' && decodeURIComponent2 !== 'video')
      return shortenVideoToken(decodeURIComponent2, 28);
    const value24 = Array.from(uRL2.searchParams.entries())[0];
    if (value24) return value24[0] + '=' + shortenVideoToken(value24[1], 22);
    return uRL2.hostname;
  } catch {
    return '';
  }
}
function getVideoSourceLabel(value25) {
  const value26 = String(value25 || '')
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
    }[value26] || webPreviewCaptureText('videoSources.videoSource')
  );
}
function buildVideoCandidateTooltip(url3, value27) {
  const list11 = [
    value27 + ' ' + (url3.title || webPreviewCaptureText('fallback.video')),
    webPreviewCaptureText('videoTooltip.source', { source: getVideoSourceLabel(url3.sourceType) }),
    url3.url ? webPreviewCaptureText('videoTooltip.url', { url: url3.url }) : '',
    url3.pageUrl ? webPreviewCaptureText('videoTooltip.page', { url: url3.pageUrl }) : '',
  ];
  return list11.filter(Boolean).join('\n');
}
function createVideoPickerItem(el6, box6, map4, handler2, value28 = 0) {
  const el7 = el6.createElement('label');
  el7.className = 'web-preview-image-picker-item web-preview-video-picker-item';
  const formatVideoCandidateIndex2 = formatVideoCandidateIndex(value28);
  el7.title = buildVideoCandidateTooltip(box6, formatVideoCandidateIndex2);
  const el8 = el6.createElement('input');
  ((el8.type = 'checkbox'),
    (el8.checked = map4.has(box6.url)),
    el8.addEventListener('change', () => handler2(box6.url, el8.checked)));
  const el9 = el6.createElement('div');
  el9.className = 'web-preview-video-picker-thumb';
  const el10 = el6.createElement('span');
  ((el10.className = 'web-preview-video-picker-index'), (el10.textContent = formatVideoCandidateIndex2));
  const el11 = el6.createElement('span');
  ((el11.className = 'web-preview-video-picker-source'),
    (el11.textContent = getVideoSourceLabel(box6.sourceType)));
  const el12 = el6.createElement('span');
  ((el12.className = 'web-preview-video-picker-fingerprint'),
    (el12.textContent = getVideoUrlFingerprint(box6.url) || getUrlHost(box6.url)),
    el9.appendChild(el10),
    el9.appendChild(el11),
    el9.appendChild(el12));
  const el13 = el6.createElement('span');
  ((el13.className = 'web-preview-image-picker-title'),
    (el13.textContent =
      formatVideoCandidateIndex2 + ' ' + (box6.title || webPreviewCaptureText('fallback.video'))));
  const el14 = el6.createElement('span');
  el14.className = 'web-preview-image-picker-meta';
  const value29 = box6.width && box6.height ? box6.width + ' x ' + box6.height : '',
    formatVideoDuration2 = formatVideoDuration(box6.duration),
    urlHost = getUrlHost(box6.url),
    videoUrlFingerprint = getVideoUrlFingerprint(box6.url);
  return (
    (el14.textContent = [
      value29,
      formatVideoDuration2,
      urlHost,
      videoUrlFingerprint && videoUrlFingerprint !== urlHost ? videoUrlFingerprint : '',
    ]
      .filter(Boolean)
      .join(' · ')),
    el7.appendChild(el8),
    el7.appendChild(el9),
    el7.appendChild(el13),
    el7.appendChild(el14),
    el7
  );
}
function createPickerSection(el15, value30, value31) {
  const el16 = el15.createElement('section');
  el16.className = 'web-preview-media-picker-section';
  const el17 = el15.createElement('h4');
  return (
    (el17.className = 'web-preview-media-picker-section-title'),
    (el17.textContent = value30),
    el16.appendChild(el17),
    el16.appendChild(value31),
    el16
  );
}
function createMediaFilterButton(el18, value32, value33, value34, enabled5, handler3) {
  const el19 = el18.createElement('button');
  return (
    (el19.type = 'button'),
    (el19.className = 'web-preview-media-picker-filter' + (value33 === value34 ? ' is-active' : '')),
    (el19.textContent = value32),
    (el19.disabled = !!enabled5),
    (el19.ariaPressed = value33 === value34 ? 'true' : 'false'),
    el19.addEventListener('click', () => {
      if (el19.disabled) return;
      handler3(value33);
    }),
    el19
  );
}
function selectCandidateUrls(map5, list12, value35) {
  map5.clear();
  for (const response3 of list12.slice(0, value35)) {
    if (response3?.url) map5.add(response3.url);
  }
}
export function openWebPreviewMediaPicker({
  nodeId: nodeId12,
  imageCandidates: imageCandidates = [],
  videoCandidates: videoCandidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const el20 = globalThis.document;
  if (!el20?.body) return false;
  const list13 = normalizeImageCandidates(imageCandidates),
    list14 = normalizeVideoCandidates(videoCandidates);
  if (!list13.length && !list14.length)
    return (showToast?.(webPreviewCaptureText('toasts.noMedia'), 'warning'), false);
  el20.querySelector('.web-preview-image-picker-overlay')?.remove();
  const imageSelected = new Set(),
    videoSelected = new Set(),
    el21 = el20.createElement('div');
  let value36 = false;
  ((el21.className = 'web-preview-image-picker-overlay'),
    el21.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      if (event.target === el21) run();
    }));
  const el22 = el20.createElement('section');
  ((el22.className = 'web-preview-image-picker web-preview-media-picker'),
    el22.addEventListener('pointerdown', (event2) => event2.stopPropagation()));
  const el23 = el20.createElement('div');
  el23.className = 'web-preview-image-picker-header';
  const el24 = el20.createElement('h3');
  el24.textContent = webPreviewCaptureText('mediaPicker.title');
  const el25 = el20.createElement('span');
  ((el25.className = 'web-preview-image-picker-count'), el23.appendChild(el24), el23.appendChild(el25));
  const value37 = el20.createElement('div');
  value37.className = 'web-preview-media-picker-content';
  let value38 = 'all';
  const value39 = el20.createElement('div');
  value39.className = 'web-preview-image-picker-grid';
  const value40 = el20.createElement('div');
  value40.className = 'web-preview-image-picker-grid web-preview-video-picker-grid';
  const el26 = el20.createElement('p');
  ((el26.className = 'web-preview-video-picker-notice'),
    (el26.textContent = webPreviewCaptureText('mediaPicker.videoNotice')));
  const el27 = el20.createElement('label');
  el27.className = 'web-preview-video-picker-consent';
  const el28 = el20.createElement('input');
  el28.type = 'checkbox';
  const el29 = el20.createElement('span');
  ((el29.textContent = webPreviewCaptureText('mediaPicker.consent')),
    el27.appendChild(el28),
    el27.appendChild(el29));
  const el30 = el20.createElement('div');
  el30.className = 'web-preview-media-picker-controls';
  const value41 = el20.createElement('div');
  ((value41.className = 'web-preview-media-picker-filter-group'), el30.appendChild(value41));
  const el31 = el20.createElement('div');
  el31.className = 'web-preview-image-picker-actions';
  const el32 = el20.createElement('button');
  ((el32.type = 'button'),
    (el32.className = 'web-preview-image-picker-btn web-preview-media-picker-select-all'),
    (el32.textContent = webPreviewCaptureText('buttons.selectAll')),
    el30.appendChild(el32));
  const el33 = el20.createElement('button');
  ((el33.type = 'button'),
    (el33.className = 'web-preview-image-picker-btn'),
    (el33.textContent = webPreviewCaptureText('buttons.cancel')));
  const el34 = el20.createElement('button');
  ((el34.type = 'button'),
    (el34.className = 'web-preview-image-picker-btn web-preview-image-picker-btn--primary'),
    (el34.textContent = webPreviewCaptureText('buttons.addToCanvas')),
    el31.appendChild(el33),
    el31.appendChild(el34));
  const run2 = () => value38 === 'all' || value38 === 'image',
    handler4 = () => value38 === 'all' || value38 === 'video',
    handler5 = () => {
      if (value38 === 'image') return list13.length > 0;
      if (value38 === 'video') return list14.length > 0;
      return list13.length > 0 || list14.length > 0;
    },
    handler6 = () => {
      const count = Math.min(list13.length, MAX_BATCH_CREATE_COUNT),
        count2 = Math.min(list14.length, MAX_VIDEO_CREATE_COUNT);
      if (value38 === 'image') return count > 0 && imageSelected.size >= count;
      if (value38 === 'video') return count2 > 0 && videoSelected.size >= count2;
      return (count === 0 || imageSelected.size >= count) && (count2 === 0 || videoSelected.size >= count2);
    },
    handler7 = () => {
      value41.replaceChildren(
        createMediaFilterButton(el20, webPreviewCaptureText('filters.all'), 'all', value38, false, run3),
        createMediaFilterButton(
          el20,
          webPreviewCaptureText('filters.image'),
          'image',
          value38,
          list13.length === 0,
          run3,
        ),
        createMediaFilterButton(
          el20,
          webPreviewCaptureText('filters.video'),
          'video',
          value38,
          list14.length === 0,
          run3,
        ),
      );
    };
  function run3(value42) {
    ((value38 = value42), run4(), run5());
  }
  function run6() {
    ((value38 === 'all' || value38 === 'image') &&
      selectCandidateUrls(imageSelected, list13, MAX_BATCH_CREATE_COUNT),
      (value38 === 'all' || value38 === 'video') &&
        selectCandidateUrls(videoSelected, list14, MAX_VIDEO_CREATE_COUNT));
  }
  function run7() {
    ((value38 === 'all' || value38 === 'image') &&
      list13.forEach((response4) => imageSelected.delete(response4.url)),
      (value38 === 'all' || value38 === 'video') &&
        list14.forEach((response5) => videoSelected.delete(response5.url)));
  }
  const run5 = () => {
      const imageMax = Math.min(list13.length, MAX_BATCH_CREATE_COUNT),
        videoMax = Math.min(list14.length, MAX_VIDEO_CREATE_COUNT);
      el25.textContent = webPreviewCaptureText('mediaPicker.count', {
        imageSelected: imageSelected.size,
        imageMax: imageMax,
        videoSelected: videoSelected.size,
        videoMax: videoMax,
      });
      const enabled6 = imageSelected.size > 0 || videoSelected.size > 0;
      el34.disabled = !enabled6 || (videoSelected.size > 0 && el28.checked !== true);
      const value43 = handler6();
      ((el32.textContent = value43
        ? webPreviewCaptureText('buttons.clearSelection')
        : webPreviewCaptureText('buttons.selectAll')),
        (el32.disabled = !handler5()));
    },
    value44 = (value45, value46) => {
      if (value46) {
        if (imageSelected.size >= MAX_BATCH_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.imageLimit', { limit: MAX_BATCH_CREATE_COUNT }),
            'warning',
          ),
            handler8());
          return;
        }
        imageSelected.add(value45);
      } else imageSelected.delete(value45);
      run5();
    },
    value47 = (value48, value49) => {
      if (value49) {
        if (videoSelected.size >= MAX_VIDEO_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.videoLimit', { limit: MAX_VIDEO_CREATE_COUNT }),
            'warning',
          ),
            handler9());
          return;
        }
        videoSelected.add(value48);
      } else videoSelected.delete(value48);
      run5();
    },
    handler8 = () => {
      (value39.replaceChildren(
        ...list13.map((item5) => createImagePickerItem(el20, item5, imageSelected, value44)),
      ),
        run5());
    },
    handler9 = () => {
      (value40.replaceChildren(
        ...list14.map((item6, value50) =>
          createVideoPickerItem(el20, item6, videoSelected, value47, value50),
        ),
      ),
        run5());
    };
  function run4() {
    handler7();
    const list15 = [el30];
    (run2() &&
      list13.length &&
      list15.push(createPickerSection(el20, webPreviewCaptureText('filters.image'), value39)),
      handler4() &&
        list14.length &&
        list15.push(el26, el27, createPickerSection(el20, webPreviewCaptureText('filters.video'), value40)),
      value37.replaceChildren(...list15));
  }
  function run() {
    if (value36) return;
    ((value36 = true),
      el21.remove(),
      el20.removeEventListener('keydown', value51, true),
      dispatchWebPreviewPickerSync('media-picker-close'));
  }
  const value51 = (event3) => {
    if (event3.key === 'Escape') run();
  };
  return (
    el28.addEventListener('change', run5),
    el32.addEventListener('click', () => {
      (handler6() ? run7() : run6(), handler8(), handler9());
    }),
    el33.addEventListener('click', run),
    el34.addEventListener('click', () => {
      const imageCandidates2 = list13.filter((response6) => imageSelected.has(response6.url)),
        videoCandidates2 = list14.filter((response7) => videoSelected.has(response7.url)),
        count3 = createBatchWebMediaNodes({
          nodeId: nodeId12,
          imageCandidates: imageCandidates2,
          videoCandidates: videoCandidates2,
          storeInstance: storeInstance,
          commitFn: commitFn,
          rightsConfirmed: videoSelected.size > 0 && el28.checked === true,
        });
      if (count3.length)
        showToast?.(webPreviewCaptureText('toasts.mediaAdded', { count: count3.length }), 'success');
      run();
    }),
    handler8(),
    handler9(),
    run4(),
    el22.appendChild(el23),
    el22.appendChild(value37),
    el22.appendChild(el31),
    el21.appendChild(el22),
    el20.body.appendChild(el21),
    el20.addEventListener('keydown', value51, true),
    dispatchWebPreviewPickerSync('media-picker-open'),
    true
  );
}
export function openWebPreviewVideoPicker({
  nodeId: nodeId13,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const el35 = globalThis.document;
  if (!el35?.body) return false;
  const list16 = normalizeVideoCandidates(candidates);
  if (!list16.length) return (showToast?.(webPreviewCaptureText('toasts.noVideos'), 'warning'), false);
  el35.querySelector('.web-preview-image-picker-overlay')?.remove();
  const map6 = new Set(),
    el36 = el35.createElement('div');
  let value52 = false;
  ((el36.className = 'web-preview-image-picker-overlay'),
    el36.addEventListener('pointerdown', (event4) => {
      event4.stopPropagation();
      if (event4.target === el36) run8();
    }));
  const el37 = el35.createElement('section');
  ((el37.className = 'web-preview-image-picker web-preview-video-picker'),
    el37.addEventListener('pointerdown', (event5) => event5.stopPropagation()));
  const el38 = el35.createElement('div');
  el38.className = 'web-preview-image-picker-header';
  const el39 = el35.createElement('h3');
  el39.textContent = webPreviewCaptureText('videoPicker.title');
  const el40 = el35.createElement('span');
  ((el40.className = 'web-preview-image-picker-count'), el38.appendChild(el39), el38.appendChild(el40));
  const el41 = el35.createElement('p');
  ((el41.className = 'web-preview-video-picker-notice'),
    (el41.textContent = webPreviewCaptureText('videoPicker.notice')));
  const el42 = el35.createElement('label');
  el42.className = 'web-preview-video-picker-consent';
  const rightsConfirmed2 = el35.createElement('input');
  rightsConfirmed2.type = 'checkbox';
  const el43 = el35.createElement('span');
  ((el43.textContent = webPreviewCaptureText('mediaPicker.consent')),
    el42.appendChild(rightsConfirmed2),
    el42.appendChild(el43));
  const value53 = el35.createElement('div');
  value53.className = 'web-preview-image-picker-grid web-preview-video-picker-grid';
  const el44 = el35.createElement('div');
  el44.className = 'web-preview-image-picker-actions';
  const el45 = el35.createElement('button');
  ((el45.type = 'button'),
    (el45.className = 'web-preview-image-picker-btn'),
    (el45.textContent = webPreviewCaptureText('buttons.selectAll')));
  const el46 = el35.createElement('button');
  ((el46.type = 'button'),
    (el46.className = 'web-preview-image-picker-btn'),
    (el46.textContent = webPreviewCaptureText('buttons.cancel')));
  const el47 = el35.createElement('button');
  ((el47.type = 'button'),
    (el47.className = 'web-preview-image-picker-btn web-preview-image-picker-btn--primary'),
    (el47.textContent = webPreviewCaptureText('buttons.saveAsSourceVideo')),
    el44.appendChild(el45),
    el44.appendChild(el46),
    el44.appendChild(el47));
  const run9 = () => {
      const value54 = Math.min(list16.length, MAX_VIDEO_CREATE_COUNT);
      ((el40.textContent = map6.size + '/' + value54),
        (el47.disabled = map6.size === 0 || rightsConfirmed2.checked !== true),
        (el45.disabled = map6.size >= value54));
    },
    value55 = (value56, value57) => {
      if (value57) {
        if (map6.size >= MAX_VIDEO_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.videoLimit', { limit: MAX_VIDEO_CREATE_COUNT }),
            'warning',
          ),
            handler10());
          return;
        }
        map6.add(value56);
      } else map6.delete(value56);
      run9();
    },
    handler10 = () => {
      (value53.replaceChildren(
        ...list16.map((item7, value58) => createVideoPickerItem(el35, item7, map6, value55, value58)),
      ),
        run9());
    };
  function run8() {
    if (value52) return;
    ((value52 = true),
      el36.remove(),
      el35.removeEventListener('keydown', value59, true),
      dispatchWebPreviewPickerSync('video-picker-close'));
  }
  const value59 = (event6) => {
    if (event6.key === 'Escape') run8();
  };
  return (
    rightsConfirmed2.addEventListener('change', run9),
    el45.addEventListener('click', () => {
      (selectCandidateUrls(map6, list16, MAX_VIDEO_CREATE_COUNT), handler10());
    }),
    el46.addEventListener('click', run8),
    el47.addEventListener('click', () => {
      const candidates2 = list16.filter((response8) => map6.has(response8.url)),
        count4 = createBatchWebVideoNodes({
          nodeId: nodeId13,
          candidates: candidates2,
          storeInstance: storeInstance,
          commitFn: commitFn,
          rightsConfirmed: rightsConfirmed2.checked === true,
        });
      (count4.length &&
        showToast?.(webPreviewCaptureText('toasts.videosSaved', { count: count4.length }), 'success'),
        run8());
    }),
    handler10(),
    el37.appendChild(el38),
    el37.appendChild(el41),
    el37.appendChild(el42),
    el37.appendChild(value53),
    el37.appendChild(el44),
    el36.appendChild(el37),
    el35.body.appendChild(el36),
    el35.addEventListener('keydown', value59, true),
    dispatchWebPreviewPickerSync('video-picker-open'),
    true
  );
}
export function openWebPreviewImagePicker({
  nodeId: nodeId14,
  candidates: candidates = [],
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
} = {}) {
  const el48 = globalThis.document;
  if (!el48?.body) return false;
  const list17 = normalizeImageCandidates(candidates);
  if (!list17.length) return (showToast?.(webPreviewCaptureText('toasts.noImages'), 'warning'), false);
  el48.querySelector('.web-preview-image-picker-overlay')?.remove();
  const map7 = new Set(),
    el49 = el48.createElement('div');
  let value60 = false;
  ((el49.className = 'web-preview-image-picker-overlay'),
    el49.addEventListener('pointerdown', (event7) => {
      event7.stopPropagation();
      if (event7.target === el49) run10();
    }));
  const el50 = el48.createElement('section');
  ((el50.className = 'web-preview-image-picker'),
    el50.addEventListener('pointerdown', (event8) => event8.stopPropagation()));
  const el51 = el48.createElement('div');
  el51.className = 'web-preview-image-picker-header';
  const el52 = el48.createElement('h3');
  el52.textContent = webPreviewCaptureText('imagePicker.title');
  const el53 = el48.createElement('span');
  ((el53.className = 'web-preview-image-picker-count'), el51.appendChild(el52), el51.appendChild(el53));
  const value61 = el48.createElement('div');
  value61.className = 'web-preview-image-picker-grid';
  const el54 = el48.createElement('div');
  el54.className = 'web-preview-image-picker-actions';
  const el55 = el48.createElement('button');
  ((el55.type = 'button'),
    (el55.className = 'web-preview-image-picker-btn'),
    (el55.textContent = webPreviewCaptureText('buttons.selectAll')));
  const el56 = el48.createElement('button');
  ((el56.type = 'button'),
    (el56.className = 'web-preview-image-picker-btn'),
    (el56.textContent = webPreviewCaptureText('buttons.cancel')));
  const el57 = el48.createElement('button');
  ((el57.type = 'button'),
    (el57.className = 'web-preview-image-picker-btn web-preview-image-picker-btn--primary'),
    (el57.textContent = webPreviewCaptureText('buttons.addToCanvas')),
    el54.appendChild(el55),
    el54.appendChild(el56),
    el54.appendChild(el57));
  const run11 = () => {
      const value62 = Math.min(list17.length, MAX_BATCH_CREATE_COUNT);
      ((el53.textContent = map7.size + '/' + value62),
        (el57.disabled = map7.size === 0),
        (el55.disabled = map7.size >= value62));
    },
    value63 = (value64, value65) => {
      if (value65) {
        if (map7.size >= MAX_BATCH_CREATE_COUNT) {
          (showToast?.(
            webPreviewCaptureText('toasts.imageLimit', { limit: MAX_BATCH_CREATE_COUNT }),
            'warning',
          ),
            handler11());
          return;
        }
        map7.add(value64);
      } else map7.delete(value64);
      run11();
    },
    handler11 = () => {
      (value61.replaceChildren(...list17.map((item8) => createImagePickerItem(el48, item8, map7, value63))),
        run11());
    };
  function run10() {
    if (value60) return;
    ((value60 = true),
      el49.remove(),
      el48.removeEventListener('keydown', value66, true),
      dispatchWebPreviewPickerSync('image-picker-close'));
  }
  const value66 = (event9) => {
    if (event9.key === 'Escape') run10();
  };
  return (
    el55.addEventListener('click', () => {
      (selectCandidateUrls(map7, list17, MAX_BATCH_CREATE_COUNT), handler11());
    }),
    el56.addEventListener('click', run10),
    el57.addEventListener('click', () => {
      const candidates3 = list17.filter((response9) => map7.has(response9.url)),
        count5 = createBatchWebImageNodes({
          nodeId: nodeId14,
          candidates: candidates3,
          storeInstance: storeInstance,
          commitFn: commitFn,
        });
      (count5.length &&
        showToast?.(webPreviewCaptureText('toasts.imagesAdded', { count: count5.length }), 'success'),
        run10());
    }),
    handler11(),
    el50.appendChild(el51),
    el50.appendChild(value61),
    el50.appendChild(el54),
    el49.appendChild(el50),
    el48.body.appendChild(el49),
    el48.addEventListener('keydown', value66, true),
    dispatchWebPreviewPickerSync('image-picker-open'),
    true
  );
}
