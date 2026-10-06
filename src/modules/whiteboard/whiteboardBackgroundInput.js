import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
  toCanvasLocalUrl,
} from '../../services/canvasMediaLocalService.js';
import { WHITEBOARD_DEFAULT_SIZE, WHITEBOARD_DEFAULT_VIEW } from './whiteboardNodeData.js';
export const WHITEBOARD_BACKGROUND_SOURCE_TYPES = Object.freeze(['source-image', 'ai-image']);
const BACKGROUND_SOURCE_TYPE_SET = new Set(WHITEBOARD_BACKGROUND_SOURCE_TYPES);
function normalizeText(value) {
  return String(value ?? '').trim();
}
function positiveNumber(...args) {
  for (const item of args) {
    const count = Number(item);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}
function resolveAiImagePrimaryItem(key) {
  if (normalizeText(key?.type) !== 'ai-image') return null;
  const list = Array.isArray(key?.images) ? key.images : [];
  if (list.length === 0) return null;
  const index = Number(key?.mainImageIndex),
    result = Number.isFinite(index)
      ? Math.max(0, Math.min(list.length - 1, Math.trunc(index)))
      : 0;
  return list[result] || list[0] || null;
}
function uniqueUrls(data) {
  return Array.from(new Set((data || []).map(normalizeText).filter(Boolean)));
}
function resolveRenderableImageSourceGroups(response) {
  if (!response || typeof response !== 'object')
    return { previewUrls: [], fullUrls: [], compositionUrls: [], thumbnailCacheRefs: [] };
  const previewUrls = Boolean(
      normalizeText(
        response.thumbLocalPath ||
          response.previewLocalPath ||
          response.thumbnailLocalPath ||
          response.thumbUrl ||
          response.previewUrl ||
          response.thumbnailUrl,
      ),
    ),
    options = Boolean(normalizeText(response.thumbLocalPath || response.thumbUrl));
  return {
    previewUrls: previewUrls
      ? uniqueUrls([
          options ? resolveCanvasImageThumbUrl(response) : '',
          toCanvasLocalUrl(response.previewLocalPath),
          toCanvasLocalUrl(response.thumbnailLocalPath),
          response.thumbUrl,
          response.previewUrl,
          response.thumbnailUrl,
        ])
      : [],
    fullUrls: uniqueUrls([
      resolveCanvasImageDisplayUrl(response),
      resolveCanvasImageSourceUrl(response),
      response.displayUrl,
      response.imageUrl,
      response.sourceUrl,
      response.url,
      response.resultUrl,
      response.src,
    ]),
    compositionUrls: uniqueUrls([
      resolveCanvasImageSourceUrl(response),
      toCanvasLocalUrl(response.originalLocalPath),
      response.originalUrl,
      response.sourceUrl,
      response.imageUrl,
      response.url,
      response.resultUrl,
      response.src,
    ]),
    thumbnailCacheRefs: uniqueUrls([
      response.localPath,
      response.originalLocalPath,
      response.displayLocalPath,
      response.src,
      response.imageUrl,
      response.sourceUrl,
    ]),
  };
}
function appendIdentityParts(list2, target, enabled) {
  if (!enabled || typeof enabled !== 'object') return;
  [
    'assetId',
    'sourceId',
    'thumbId',
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'src',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'previewLocalPath',
    'thumbnailLocalPath',
    'previewUrl',
    'thumbnailUrl',
    'derivativeStatus',
    'generationStartTime',
    'generationDuration',
    'taskId',
    'submitId',
    'mediaTaskId',
    'updatedAt',
  ].forEach((source) => {
    const text = normalizeText(enabled[source]);
    if (text) list2.push(target + '.' + source + '=' + text);
  });
}
function hashIdentity(next) {
  const list3 = normalizeText(next);
  let current = 5381;
  for (let entry = 0; entry < list3.length; entry += 1) {
    ((current = ((current << 5) + current) ^ list3.charCodeAt(entry)), (current >>>= 0));
  }
  return current.toString(36);
}
function versionLocalImageUrl(record, payload) {
  const text2 = normalizeText(record);
  if (!text2 || !text2.startsWith('/')) return text2;
  const [list4, handle = ''] = text2.split('#', 2),
    state = list4.includes('?') ? '&' : '?';
  return '' + list4 + state + 'aicv=' + hashIdentity(payload) + (handle ? '#' + handle : '');
}
function edgeCreatedAt(config) {
  const scope = Number(config?.createdAt);
  return Number.isFinite(scope) ? scope : 0;
}
function findLatestBackgroundEdge(input, output, value2) {
  const text3 = normalizeText(input);
  if (!text3) return null;
  return (
    Object.values(value2 || {})
      .filter((value3) => {
        if (normalizeText(value3?.targetId) !== text3) return false;
        const value4 = output?.[value3?.sourceId];
        return BACKGROUND_SOURCE_TYPE_SET.has(normalizeText(value4?.type));
      })
      .sort((value5, value6) => {
        const edgeCreatedAt2 = edgeCreatedAt(value5) - edgeCreatedAt(value6);
        if (edgeCreatedAt2 !== 0) return edgeCreatedAt2;
        return normalizeText(value5?.id).localeCompare(normalizeText(value6?.id));
      })
      .at(-1) || null
  );
}
export function isWhiteboardBackgroundSourceType(value7) {
  return BACKGROUND_SOURCE_TYPE_SET.has(normalizeText(value7));
}
export function resolveWhiteboardBackgroundInput({
  whiteboardId: whiteboardId,
  nodes: nodes,
  edges: edges,
} = {}) {
  const latestBackgroundEdge = findLatestBackgroundEdge(whiteboardId, nodes, edges);
  if (!latestBackgroundEdge) return null;
  const enabled2 = nodes?.[latestBackgroundEdge.sourceId];
  if (!enabled2) return null;
  const aiImagePrimaryItem = resolveAiImagePrimaryItem(enabled2),
    value8 = aiImagePrimaryItem || enabled2,
    args2 = resolveRenderableImageSourceGroups(value8),
    args3 = resolveRenderableImageSourceGroups(enabled2),
    list5 = uniqueUrls([...args2.previewUrls, ...args3.previewUrls]),
    list6 = uniqueUrls([...args2.fullUrls, ...args3.fullUrls]),
    list7 = uniqueUrls([...args2.compositionUrls, ...args3.compositionUrls]),
    thumbnailCacheRefs = uniqueUrls([...args2.thumbnailCacheRefs, ...args3.thumbnailCacheRefs]),
    uniqueUrls2 = uniqueUrls([...list6, ...list5]),
    rawUrl = uniqueUrls2[0] || '',
    list8 = [
      'edge=' + normalizeText(latestBackgroundEdge.id),
      'edgeCreatedAt=' + edgeCreatedAt(latestBackgroundEdge),
      'node=' + normalizeText(enabled2.id),
      'type=' + normalizeText(enabled2.type),
      'mainImageIndex=' + normalizeText(enabled2.mainImageIndex),
    ];
  (appendIdentityParts(list8, 'node', enabled2), appendIdentityParts(list8, 'primary', aiImagePrimaryItem));
  const identity = list8.join('|'),
    previewUrls2 = list5.map((value9) => versionLocalImageUrl(value9, identity)),
    fullUrls = list6.map((value10) => versionLocalImageUrl(value10, identity)),
    compositionUrls = list7.map((value11) => versionLocalImageUrl(value11, identity)),
    url = uniqueUrls([...fullUrls, ...previewUrls2]),
    width = positiveNumber(
      value8?.originalWidth,
      value8?.imageWidth,
      value8?.naturalWidth,
      enabled2.originalWidth,
      enabled2.imageWidth,
      enabled2.naturalWidth,
    ),
    height = positiveNumber(
      value8?.originalHeight,
      value8?.imageHeight,
      value8?.naturalHeight,
      enabled2.originalHeight,
      enabled2.imageHeight,
      enabled2.naturalHeight,
    ),
    thumbIds = Array.from(
      new Set([value8?.thumbId, enabled2.thumbId].map(normalizeText).filter(Boolean)),
    );
  return {
    edgeId: normalizeText(latestBackgroundEdge.id),
    sourceId: normalizeText(enabled2.id),
    sourceType: normalizeText(enabled2.type),
    identity: identity,
    url: url[0] || '',
    urls: url,
    previewUrls: previewUrls2,
    fullUrls: fullUrls,
    compositionUrls: compositionUrls,
    rawUrl: rawUrl,
    width: width,
    height: height,
    thumbIds: thumbIds,
    thumbnailCacheRefs: thumbnailCacheRefs,
  };
}
export function getWhiteboardBackgroundInputSignature(box) {
  if (!box) return '';
  return [
    box.identity,
    ...(box.previewUrls || []),
    ...(box.fullUrls || box.urls || []),
    ...(box.compositionUrls || []),
    box.width,
    box.height,
    ...box.thumbIds,
    ...(box.thumbnailCacheRefs || []),
  ].join('|');
}
export function getWhiteboardBackgroundWorldRect({
  imageWidth: imageWidth,
  imageHeight: imageHeight,
  frameWidth: frameWidth,
  frameHeight: frameHeight,
} = {}) {
  const positiveNumber2 = positiveNumber(
      frameWidth,
      WHITEBOARD_DEFAULT_SIZE.width / WHITEBOARD_DEFAULT_VIEW.zoom,
    ),
    positiveNumber3 = positiveNumber(
      frameHeight,
      WHITEBOARD_DEFAULT_SIZE.height / WHITEBOARD_DEFAULT_VIEW.zoom,
    ),
    positiveNumber4 = positiveNumber(imageWidth, positiveNumber2),
    positiveNumber5 = positiveNumber(imageHeight, positiveNumber3),
    value12 = Math.min(positiveNumber2 / positiveNumber4, positiveNumber3 / positiveNumber5),
    width2 = positiveNumber4 * value12,
    height2 = positiveNumber5 * value12;
  return {
    x: (positiveNumber2 - width2) / 2,
    y: (positiveNumber3 - height2) / 2,
    width: width2,
    height: height2,
  };
}
export function drawWhiteboardBackgroundImage({
  ctx: ctx,
  image: image,
  viewport: viewport,
  imageWidth: imageWidth2,
  imageHeight: imageHeight2,
  frameWidth: frameWidth2,
  frameHeight: frameHeight2,
} = {}) {
  if (!ctx || !image || !viewport) return false;
  const count2 = Number(viewport.zoom);
  if (!Number.isFinite(count2) || count2 <= 0) return false;
  const box2 = getWhiteboardBackgroundWorldRect({
      imageWidth: imageWidth2,
      imageHeight: imageHeight2,
      frameWidth: frameWidth2,
      frameHeight: frameHeight2,
    }),
    value13 = (box2.x - Number(viewport.x || 0)) * count2,
    value14 = (box2.y - Number(viewport.y || 0)) * count2;
  return (
    ctx.save(),
    (ctx.globalAlpha = 1),
    ctx.drawImage(image, value13, value14, box2.width * count2, box2.height * count2),
    ctx.restore(),
    true
  );
}
export function getWhiteboardSizeForBackground({
  imageWidth: imageWidth3,
  imageHeight: imageHeight3,
  currentWidth: currentWidth = WHITEBOARD_DEFAULT_SIZE.width,
  currentHeight: currentHeight = WHITEBOARD_DEFAULT_SIZE.height,
  minWidth: minWidth = 1,
  minHeight: minHeight = 1,
} = {}) {
  const positiveNumber6 = positiveNumber(imageWidth3),
    positiveNumber7 = positiveNumber(imageHeight3);
  if (!positiveNumber6 || !positiveNumber7) return null;
  const positiveNumber8 = positiveNumber(currentWidth, WHITEBOARD_DEFAULT_SIZE.width),
    positiveNumber9 = positiveNumber(currentHeight, WHITEBOARD_DEFAULT_SIZE.height),
    positiveNumber10 = positiveNumber(minWidth, 1),
    positiveNumber11 = positiveNumber(minHeight, 1),
    value15 = Math.max(positiveNumber8 * positiveNumber9, positiveNumber10 * positiveNumber11),
    value16 = positiveNumber6 / positiveNumber7;
  let value17 = Math.sqrt(value15 * value16),
    value18 = value17 / value16;
  const value19 = Math.max(1, positiveNumber10 / value17, positiveNumber11 / value18);
  return (
    (value17 *= value19),
    (value18 *= value19),
    { width: Math.max(1, Math.round(value17)), height: Math.max(1, Math.round(value18)) }
  );
}
