import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import {
  computeSingleNodeSnapGuides,
  computeMultiNodeSnapGuides,
  createNodeSpatialIndex,
  snapToCanvasGrid,
} from '../../core/math.js';
import {
  getStoryboardCellPixelBounds,
  getStoryboardCellIndexAtWorldPoint,
  getStoryboardCellMetrics,
  getStoryboardNearestCellIndexAtWorldPoint,
  isStoryboardCellEmpty,
  resolveStoryboardCellSourceIndex,
} from '../../core/storyboardCellUtils.js';
import { isPerfProbeEnabled, recordEdgeRedrawSample } from '../perf/perfProbe.js';
import { collectGroupContainmentReparentOps } from '../groupMembership.js';
import { saveOutputBlob } from '../project.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import {
  getCollageItemIndexAtWorldPoint,
  isCollageItemEmpty,
  resolveCollageItemFrames,
} from '../collage/collageFactory.js';
import {
  buildEmptyStoryboardCellForSlot,
  buildFrozenStoryboardCellFromSnapshot,
  buildStoryboardSourceCropExtract,
  buildStoryboardSourceCropExtractFromImage,
  dataImageUrlToBlob,
  getDataImageExtension,
  getImageElementDisplaySrc,
  getStoryboardCellDisplaySrc,
  getStoryboardNodeSourceContext,
  getStoryboardNodeSourceImageUrl,
  getStoryboardPieceSourceImageUrl,
  isDataImageRef,
  loadStoryboardSourceImage,
  normalizeStoryboardImageUrl,
  resolveCollagePayloadDisplaySnapshot,
  resolveStoryboardCellDisplaySnapshot,
  resolveStoryboardPayloadDisplaySnapshot,
  swapStoryboardCellsWithDisplaySnapshots,
  trimStoryboardImageRef,
} from '../storyboard/storyboardDisplaySnapshot.js';
function _looksLikeImageRef(enabled) {
  if (!enabled) return false;
  const value = String(enabled);
  if (value.startsWith('data:image/')) return true;
  const item = value.split('#')[0].split('?')[0],
    key = item.toLowerCase();
  if (
    key.endsWith('.mp4') ||
    key.endsWith('.webm') ||
    key.endsWith('.mov') ||
    key.endsWith('.mkv') ||
    key.endsWith('.mp3') ||
    key.endsWith('.wav') ||
    key.endsWith('.m4a') ||
    key.endsWith('.aac') ||
    key.endsWith('.ogg')
  )
    return false;
  if (
    key.endsWith('.png') ||
    key.endsWith('.jpg') ||
    key.endsWith('.jpeg') ||
    key.endsWith('.webp') ||
    key.endsWith('.gif') ||
    key.endsWith('.bmp') ||
    key.endsWith('.svg')
  )
    return true;
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/') ||
    value.startsWith('aic-local-preview:') ||
    value.startsWith('blob:')
  );
}
function _toPositiveNumber(index, result = null) {
  const count = Number(index);
  return Number.isFinite(count) && count > 0 ? count : result;
}
function _getImagePayloadFromNode(handler, enabled2) {
  if (!enabled2) return null;
  let url = '',
    localPath = null,
    thumbLocalPath = null,
    thumbUrl = '',
    thumbId = null,
    sourceId = null,
    sourceLocalPath = null,
    sourceUrl = '',
    sourceWidth = null,
    sourceHeight = null,
    imageWidth = null,
    imageHeight = null,
    storyboardSourceCrop = false,
    storyboardExtractedCell = false,
    capturePreviewUrl = '',
    storyboardSourceIndex = null,
    storyboardSourceNodeId = '',
    storyboardSourceLocalPath = null,
    storyboardSourceUrl = '';
  if (Array.isArray(enabled2.images) && enabled2.images.length > 0) {
    let count2 = typeof enabled2.mainImageIndex === 'number' ? enabled2.mainImageIndex : 0;
    if (count2 < 0 || count2 >= enabled2.images.length) count2 = 0;
    const box = enabled2.images[count2] || {};
    ((storyboardSourceCrop = box.storyboardSourceCrop === true || !!box.sourceLocalPath || !!box.sourceUrl),
      (storyboardExtractedCell =
        box.storyboardExtractedCell === true || enabled2.storyboardExtractedCell === true));
    const data = box.storyboardSourceIndex ?? enabled2.storyboardSourceIndex,
      count3 = Number(data);
    (Number.isInteger(count3) && count3 >= 0 && (storyboardSourceIndex = count3),
      (storyboardSourceNodeId = String(
        box.storyboardSourceNodeId || enabled2.storyboardSourceNodeId || '',
      ).trim()),
      (storyboardSourceLocalPath =
        box.storyboardSourceLocalPath || enabled2.storyboardSourceLocalPath || null),
      (storyboardSourceUrl = box.storyboardSourceUrl || enabled2.storyboardSourceUrl || ''),
      (capturePreviewUrl = box.capturePreviewUrl || enabled2.capturePreviewUrl || ''),
      (url = box.imageUrl || box.url || capturePreviewUrl || ''),
      (localPath = box.localPath || null),
      (thumbLocalPath = box.thumbLocalPath || null),
      (thumbUrl = box.thumbUrl || ''),
      (thumbId = box.thumbId || null),
      (sourceId = box.sourceId || null),
      (imageWidth = box.imageWidth || box.width || enabled2.imageWidth || null),
      (imageHeight = box.imageHeight || box.height || enabled2.imageHeight || null),
      storyboardSourceCrop &&
        ((sourceLocalPath = box.sourceLocalPath || null),
        (sourceUrl = box.sourceUrl || ''),
        (sourceWidth = box.sourceWidth || null),
        (sourceHeight = box.sourceHeight || null)));
  } else {
    ((storyboardSourceCrop =
      enabled2.storyboardSourceCrop === true || !!enabled2.sourceLocalPath || !!enabled2.sourceUrl),
      (storyboardExtractedCell = enabled2.storyboardExtractedCell === true));
    const count4 = Number(enabled2.storyboardSourceIndex);
    (Number.isInteger(count4) && count4 >= 0 && (storyboardSourceIndex = count4),
      (storyboardSourceNodeId = String(enabled2.storyboardSourceNodeId || '').trim()),
      (storyboardSourceLocalPath = enabled2.storyboardSourceLocalPath || null),
      (storyboardSourceUrl = enabled2.storyboardSourceUrl || ''),
      (capturePreviewUrl =
        enabled2.capturePreviewUrl ||
        (String(enabled2.src || '').startsWith('data:image/') ? enabled2.src : '')),
      (url = enabled2.imageUrl || enabled2.src || capturePreviewUrl || ''),
      (localPath = enabled2.localPath || null),
      (thumbLocalPath = enabled2.thumbLocalPath || null),
      (thumbUrl = enabled2.thumbUrl || ''),
      (thumbId = enabled2.thumbId || null),
      (sourceId = enabled2.sourceId || null),
      (imageWidth = enabled2.imageWidth || null),
      (imageHeight = enabled2.imageHeight || null),
      storyboardSourceCrop &&
        ((sourceLocalPath = enabled2.sourceLocalPath || null),
        (sourceUrl = enabled2.sourceUrl || ''),
        (sourceWidth = enabled2.sourceWidth || null),
        (sourceHeight = enabled2.sourceHeight || null)));
  }
  if (
    !url &&
    !localPath &&
    !thumbLocalPath &&
    !thumbUrl &&
    !thumbId &&
    !sourceId &&
    !capturePreviewUrl &&
    !sourceLocalPath &&
    !sourceUrl
  )
    return null;
  if (handler(enabled2, 'source-image')) {
    if (thumbId || sourceId)
      return {
        url: url,
        localPath: localPath,
        thumbLocalPath: thumbLocalPath,
        thumbUrl: thumbUrl,
        thumbId: thumbId,
        sourceId: sourceId,
        sourceLocalPath: sourceLocalPath,
        sourceUrl: sourceUrl,
        sourceWidth: sourceWidth,
        sourceHeight: sourceHeight,
        imageWidth: imageWidth,
        imageHeight: imageHeight,
        storyboardSourceCrop: storyboardSourceCrop,
        storyboardExtractedCell: storyboardExtractedCell,
        capturePreviewUrl: capturePreviewUrl,
        storyboardSourceIndex: storyboardSourceIndex,
        storyboardSourceNodeId: storyboardSourceNodeId,
        storyboardSourceLocalPath: storyboardSourceLocalPath,
        storyboardSourceUrl: storyboardSourceUrl,
      };
  }
  if (
    !_looksLikeImageRef(thumbUrl) &&
    !_looksLikeImageRef(thumbLocalPath) &&
    !_looksLikeImageRef(localPath) &&
    !_looksLikeImageRef(url) &&
    !_looksLikeImageRef(capturePreviewUrl) &&
    !_looksLikeImageRef(sourceLocalPath) &&
    !_looksLikeImageRef(sourceUrl)
  )
    return null;
  return {
    url: url,
    localPath: localPath,
    thumbLocalPath: thumbLocalPath,
    thumbUrl: thumbUrl,
    thumbId: thumbId,
    sourceId: sourceId,
    sourceLocalPath: sourceLocalPath,
    sourceUrl: sourceUrl,
    sourceWidth: sourceWidth,
    sourceHeight: sourceHeight,
    imageWidth: imageWidth,
    imageHeight: imageHeight,
    storyboardSourceCrop: storyboardSourceCrop,
    storyboardExtractedCell: storyboardExtractedCell,
    capturePreviewUrl: capturePreviewUrl,
    storyboardSourceIndex: storyboardSourceIndex,
    storyboardSourceNodeId: storyboardSourceNodeId,
    storyboardSourceLocalPath: storyboardSourceLocalPath,
    storyboardSourceUrl: storyboardSourceUrl,
  };
}
function _isCellEmpty(options) {
  return isStoryboardCellEmpty(options);
}
function _resolveStoryboardReplayDropContext(enabled3, enabled4) {
  if (!enabled3 || !enabled4) return { isReplay: false };
  const sourceIndex = Number(enabled3.storyboardSourceIndex);
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0) return { isReplay: false };
  const target = String(enabled3.storyboardSourceNodeId || '').trim(),
    storyboardImageUrl =
      normalizeStoryboardImageUrl(enabled3.storyboardSourceLocalPath) ||
      normalizeStoryboardImageUrl(enabled3.storyboardSourceUrl),
    storyboardNodeSourceImageUrl = getStoryboardNodeSourceImageUrl(enabled4),
    enabled5 = !!(target && target === String(enabled4.id)),
    enabled6 = !!(
      storyboardImageUrl &&
      storyboardNodeSourceImageUrl &&
      storyboardImageUrl === storyboardNodeSourceImageUrl
    );
  if (!enabled5 && !enabled6) return { isReplay: false };
  const sourceLocalPath2 = getStoryboardNodeSourceContext(enabled4);
  return {
    isReplay: true,
    sourceIndex: sourceIndex,
    sourceLocalPath: sourceLocalPath2.sourceLocalPath,
    sourceUrl: sourceLocalPath2.sourceUrl,
    sourceWidth: Number(enabled4.storyboardSourceWidth || enabled4.sourceWidth) || null,
    sourceHeight: Number(enabled4.storyboardSourceHeight || enabled4.sourceHeight) || null,
  };
}
function _getStoryboardCellInfoAt(source, next, current, entry = {}) {
  for (const nodeId of Object.values(current)) {
    if (nodeId.type !== 'storyboard') continue;
    let cellIndex = getStoryboardCellIndexAtWorldPoint(nodeId, source, next);
    cellIndex < 0 &&
      entry.nearestInGap === true &&
      (cellIndex = getStoryboardNearestCellIndexAtWorldPoint(nodeId, source, next));
    if (cellIndex >= 0) return { nodeId: nodeId.id, cellIndex: cellIndex };
  }
  return null;
}
function _getLastHoveredStoryboardCellInfo(record, payload, handle, state) {
  const nodeId2 = record?.lastHoverNodeId || null,
    cellIndex2 = Number(record?.lastHoverCellIndex);
  if (!nodeId2 || !Number.isInteger(cellIndex2) || cellIndex2 < 0) return null;
  if (record?.lastHoverKind && record.lastHoverKind !== 'storyboard') return null;
  const box2 = state?.[nodeId2];
  if (!box2 || box2.type !== 'storyboard') return null;
  const box3 = getStoryboardCellMetrics(box2),
    config = box3.cols * box3.rows;
  if (cellIndex2 >= config) return null;
  const scope = Number(box2.x) || 0,
    input = Number(box2.y) || 0,
    output = Math.max(8, Math.min(40, (Number(box2.gridGap) || 0) / 2 + 8));
  if (
    payload < scope - output ||
    payload > scope + box3.width + output ||
    handle < input - output ||
    handle > input + box3.height + output
  )
    return null;
  return { nodeId: nodeId2, cellIndex: cellIndex2 };
}
function _getCollageSlotInfoAt(value2, value3, value4) {
  for (const nodeId3 of Object.values(value4)) {
    if (nodeId3.type !== 'collage') continue;
    const itemIndex = getCollageItemIndexAtWorldPoint(nodeId3, value2, value3);
    if (itemIndex >= 0) return { nodeId: nodeId3.id, itemIndex: itemIndex };
  }
  return null;
}
function _getCollageItemFrameInfo(value5, value6) {
  return resolveCollageItemFrames(value5).find((item2) => item2.index === value6) || null;
}
function _getCollageItemCenterWorldPoint(box4, value7) {
  const _getCollageItemFrameInfo2 = _getCollageItemFrameInfo(box4, value7),
    box5 = _getCollageItemFrameInfo2?.frame;
  if (!box5)
    return {
      x: (Number(box4?.x) || 0) + (Number(box4?.width) || 1) / 2,
      y: (Number(box4?.y) || 0) + (Number(box4?.height) || 1) / 2,
    };
  return {
    x: (Number(box4?.x) || 0) + box5.x + box5.width / 2,
    y: (Number(box4?.y) || 0) + box5.y + box5.height / 2,
  };
}
function _clearStoryboardHighlight(enabled7) {
  if (!enabled7) return;
  const value8 = window.v2Renderer?.nodeInstances?.get(enabled7);
  if (value8 && typeof value8.highlightCell === 'function') value8.highlightCell(-1);
}
function _clearDropSlotHighlight(enabled8) {
  if (!enabled8) return;
  const value9 = window.v2Renderer?.nodeInstances?.get(enabled8);
  if (value9 && typeof value9.highlightCell === 'function') value9.highlightCell(-1);
  if (value9 && typeof value9.highlightSlot === 'function') value9.highlightSlot(-1);
}
function _highlightDropSlot(enabled9, value10, value11) {
  if (!enabled9) return;
  const value12 = window.v2Renderer?.nodeInstances?.get(enabled9);
  if (value10 === 'storyboard' && value12 && typeof value12.highlightCell === 'function')
    value12.highlightCell(value11);
  else
    value10 === 'collage' &&
      value12 &&
      typeof value12.highlightSlot === 'function' &&
      value12.highlightSlot(value11);
}
function _worldToScreen(x, y, value13) {
  const { x: x2, y: y2, zoom: zoom } = value13;
  return { x: x * zoom + x2, y: y * zoom + y2 };
}
function _getStoryboardCellCenterWorldPoint(box6, value14) {
  const storyboardCellMetrics = getStoryboardCellMetrics(box6),
    box7 = getStoryboardCellPixelBounds(box6, value14);
  if (box7)
    return {
      x: (Number(box6?.x) || 0) + box7.x0 + box7.width / 2,
      y: (Number(box6?.y) || 0) + box7.y0 + box7.height / 2,
    };
  const value15 = value14 % storyboardCellMetrics.cols,
    value16 = Math.floor(value14 / storyboardCellMetrics.cols);
  return {
    x:
      (Number(box6?.x) || 0) +
      storyboardCellMetrics.inset +
      value15 * (storyboardCellMetrics.cellWidth + storyboardCellMetrics.gap) +
      storyboardCellMetrics.cellWidth / 2,
    y:
      (Number(box6?.y) || 0) +
      storyboardCellMetrics.inset +
      value16 * (storyboardCellMetrics.cellHeight + storyboardCellMetrics.gap) +
      storyboardCellMetrics.cellHeight / 2,
  };
}
function _canvasToJpegBlob(enabled10) {
  if (!enabled10 || typeof enabled10.toBlob !== 'function') return Promise.resolve(null);
  return new Promise((value17) => enabled10.toBlob(value17, 'image/jpeg', 0.9));
}
function _buildExtractNodeCropPatch(capturePreviewUrl2) {
  if (!capturePreviewUrl2?.dataUrl) return null;
  return {
    src: '',
    capturePreviewUrl: capturePreviewUrl2.dataUrl,
    localPath: '',
    fileName: capturePreviewUrl2.fileName,
    originalWidth: capturePreviewUrl2.width,
    originalHeight: capturePreviewUrl2.height,
    imageWidth: capturePreviewUrl2.width,
    imageHeight: capturePreviewUrl2.height,
    needsAutoResize: false,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardExtractedCell: true,
  };
}
async function _saveStoryboardDataImageSnapshot(value18, value19, handler2) {
  const trimStoryboardImageRef2 = trimStoryboardImageRef(value18?.capturePreviewUrl);
  if (!isDataImageRef(trimStoryboardImageRef2)) return null;
  const type = dataImageUrlToBlob(trimStoryboardImageRef2);
  if (!type) return null;
  const ext = getDataImageExtension(trimStoryboardImageRef2),
    value20 = value19 || value18?.fileName || 'storyboard_extract.' + ext,
    value21 =
      typeof File === 'function'
        ? new File([type], value20, {
            type: type.type || 'image/' + (ext === 'jpg' ? 'jpeg' : ext),
          })
        : type,
    saved = await handler2(value21, { ext: ext }),
    localPath2 = pickResultLocalPath(saved),
    src = String(saved?.url || '').trim() || localPathToUrl(localPath2);
  if (!src || !localPath2) return null;
  return { saved: saved, localPath: localPath2, src: src };
}
function _buildPersistedStoryboardImagePatch(box8, value22) {
  const fileName = value22?.saved || {},
    localPath3 = value22?.localPath || '',
    src2 = value22?.src || localPathToUrl(localPath3),
    originalWidth = _toPositiveNumber(fileName.originalWidth) || _toPositiveNumber(box8?.width) || null,
    originalHeight = _toPositiveNumber(fileName.originalHeight) || _toPositiveNumber(box8?.height) || null;
  return {
    src: src2,
    url: '',
    localPath: localPath3,
    originalLocalPath: normalizeLocalPath(fileName.originalLocalPath || localPath3),
    displayLocalPath: normalizeLocalPath(fileName.displayLocalPath),
    thumbLocalPath: normalizeLocalPath(fileName.thumbLocalPath),
    capturePreviewUrl: '',
    fileName: fileName.filename || box8?.fileName || '',
    originalWidth: originalWidth,
    originalHeight: originalHeight,
    imageWidth: originalWidth,
    imageHeight: originalHeight,
  };
}
async function _persistStoryboardSnapshotPreviewToNode(
  store,
  value23,
  value24,
  value25,
  value26 = saveOutputBlob,
) {
  if (!isDataImageRef(value24?.capturePreviewUrl)) return;
  try {
    const _saveStoryboardDataImageSnapshot2 = await _saveStoryboardDataImageSnapshot(
      value24,
      value25,
      value26,
    );
    if (!_saveStoryboardDataImageSnapshot2) return;
    if (!store.getStateRaw().nodes?.[value23]) return;
    store.updateNodeData(
      value23,
      _buildPersistedStoryboardImagePatch(value24, _saveStoryboardDataImageSnapshot2),
    );
  } catch (value27) {
    console.warn('[DragController] 分镜临时预览落盘失败:', value27);
  }
}
async function _persistStoryboardSnapshotPreviewToCell(
  store2,
  value28,
  value29,
  value30,
  value31,
  value32,
  value33 = saveOutputBlob,
) {
  const trimStoryboardImageRef3 = trimStoryboardImageRef(value31?.capturePreviewUrl);
  if (!isDataImageRef(trimStoryboardImageRef3)) return;
  try {
    const _saveStoryboardDataImageSnapshot3 = await _saveStoryboardDataImageSnapshot(
      value31,
      value32,
      value33,
    );
    if (!_saveStoryboardDataImageSnapshot3) return;
    const value34 = store2.getStateRaw().nodes?.[value28],
      args = Array.isArray(value34?.cells) ? value34.cells : [],
      args2 = args[value29];
    if (!args2 || _isCellEmpty(args2)) return;
    if (value30 && String(args2.id || '') !== String(value30)) return;
    if (trimStoryboardImageRef(args2.capturePreviewUrl) !== trimStoryboardImageRef3) return;
    const cells = [...args];
    ((cells[value29] = {
      ...args2,
      ..._buildPersistedStoryboardImagePatch(value31, _saveStoryboardDataImageSnapshot3),
      sourceLocalPath: null,
      sourceUrl: '',
      sourceWidth: null,
      sourceHeight: null,
      storyboardSourceCrop: false,
      storyboardPiece: false,
      isEmpty: false,
    }),
      store2.updateNodeData(value28, { cells: cells }));
  } catch (value35) {
    console.warn('[DragController] 分镜宫格临时预览落盘失败:', value35);
  }
}
async function _persistStoryboardSourceCropExtract(
  store3,
  enabled11,
  imageWidth2,
  handler3 = saveOutputBlob,
) {
  if (typeof window === 'undefined') return;
  if (!imageWidth2?.canvas || !imageWidth2.dataUrl || !enabled11) return;
  try {
    const _canvasToJpegBlob2 = await _canvasToJpegBlob(imageWidth2.canvas);
    if (!_canvasToJpegBlob2) return;
    const value36 =
        typeof File === 'function'
          ? new File([_canvasToJpegBlob2], imageWidth2.fileName, { type: 'image/jpeg' })
          : _canvasToJpegBlob2,
      fileName2 = await handler3(value36, { ext: 'jpg' }),
      localPath4 = pickResultLocalPath(fileName2),
      src3 = String(fileName2?.url || '').trim() || localPathToUrl(localPath4);
    if (!src3 || !localPath4) return;
    if (!store3.getStateRaw().nodes?.[enabled11]) return;
    store3.updateNodeData(enabled11, {
      src: src3,
      localPath: localPath4,
      originalLocalPath: normalizeLocalPath(fileName2?.originalLocalPath || localPath4),
      displayLocalPath: normalizeLocalPath(fileName2?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(fileName2?.thumbLocalPath),
      fileName: fileName2?.filename || imageWidth2.fileName,
      originalWidth: Number(fileName2?.originalWidth || imageWidth2.width) || imageWidth2.width,
      originalHeight: Number(fileName2?.originalHeight || imageWidth2.height) || imageWidth2.height,
      imageWidth: imageWidth2.width,
      imageHeight: imageWidth2.height,
      needsAutoResize: false,
    });
  } catch (value37) {
    console.warn('[DragController] 保存自定义分镜提取结果失败:', value37);
  }
}
function _refreshStoryboardSourceCropExtractInBackground(store4, enabled12, cols, value38, value39, value40) {
  const storyboardPieceSourceImageUrl = getStoryboardPieceSourceImageUrl(value39, cols);
  if (!storyboardPieceSourceImageUrl || !enabled12) return;
  const value41 = {
    cols: cols?.cols,
    rows: cols?.rows,
    width: cols?.width,
    height: cols?.height,
    gridGap: cols?.gridGap,
    gridLayout: cols?.gridLayout,
  };
  loadStoryboardSourceImage(storyboardPieceSourceImageUrl)
    .then((enabled13) => {
      if (!enabled13 || !store4.getStateRaw().nodes?.[enabled12]) return;
      const storyboardCellSourceIndex = resolveStoryboardCellSourceIndex(value39, value38, cols),
        storyboardSourceCropExtractFromImage = buildStoryboardSourceCropExtractFromImage(
          value41,
          value38,
          enabled13,
          value40,
          storyboardCellSourceIndex,
        ),
        _buildExtractNodeCropPatch2 = _buildExtractNodeCropPatch(storyboardSourceCropExtractFromImage);
      if (!_buildExtractNodeCropPatch2 || !store4.getStateRaw().nodes?.[enabled12]) return;
      (store4.updateNodeData(enabled12, _buildExtractNodeCropPatch2),
        _persistStoryboardSourceCropExtract(store4, enabled12, storyboardSourceCropExtractFromImage));
    })
    .catch((value42) => {
      console.warn('[DragController] 异步刷新自定义分镜提取预览失败:', value42);
    });
}
let _cachedMultiSelectBoxEl = null;
const TITLE_DRAG_ACTIVATE_THRESHOLD_PX = 5,
  HEAVY_EDGE_DRAG_MIN_ZOOM = 0.24,
  HEAVY_EDGE_DRAG_MAX_ZOOM = 0.48,
  HEAVY_EDGE_DRAG_MIN_EDGES = 3,
  HEAVY_EDGE_DRAG_SUPPRESS_LIVE_PAINT_EDGES = 0x190,
  DRAG_SNAP_GUIDE_NODE_LIMIT = 160,
  DRAG_EDGE_SCREEN_EPSILON_PX = 6,
  EDGE_INTERACTION_LITE_CLASS = 'is-edge-interaction-lite',
  _dragSnapSpatialIndexCache = { nodes: null, persistRev: -1, index: null };
function _resolveDragSnapNodeRect(x3) {
  if (!x3 || typeof x3 !== 'object') return null;
  return { x: x3.x, y: x3.y, width: x3.width || 200, height: x3.height || 200 };
}
function _getDragSnapSpatialIndex(value43) {
  const enabled14 = value43?.nodes;
  if (!enabled14 || typeof enabled14 !== 'object') return null;
  const value44 = Number.isFinite(value43?._persistRev) ? value43._persistRev : -1;
  if (_dragSnapSpatialIndexCache.nodes === enabled14 && _dragSnapSpatialIndexCache.persistRev === value44)
    return _dragSnapSpatialIndexCache.index;
  const nodeSpatialIndex = createNodeSpatialIndex(enabled14, { resolveRect: _resolveDragSnapNodeRect });
  return (
    (_dragSnapSpatialIndexCache.nodes = enabled14),
    (_dragSnapSpatialIndexCache.persistRev = value44),
    (_dragSnapSpatialIndexCache.index = nodeSpatialIndex),
    nodeSpatialIndex
  );
}
function _shouldUseDragSnapGuides(value45, value46) {
  if (value45?.ui?.snapGuidesEnabled === false || value46) return false;
  const value47 = Number.isFinite(value45?._nodeCount)
    ? value45._nodeCount
    : Object.keys(value45?.nodes || {}).length;
  return value47 <= DRAG_SNAP_GUIDE_NODE_LIMIT;
}
function _collectAffectedEdgesForTargets(value48, value49) {
  const value50 = window.v2Renderer;
  if (value50 && typeof value50.getEdgeIdsForNode === 'function') {
    const value51 = new Set();
    for (const value52 of value48 || []) {
      const list = value50.getEdgeIdsForNode(value52);
      if (!Array.isArray(list) || list.length === 0) continue;
      for (const value53 of list) value51.add(value53);
    }
    return Array.from(value51)
      .map((item3) => value49?.[item3])
      .filter(Boolean);
  }
  const map = value48 instanceof Set ? value48 : new Set(value48 || []);
  return Object.values(value49 || {}).filter((item4) => map.has(item4?.sourceId) || map.has(item4?.targetId));
}
function _flushStoryboardNodesNow(...list2) {
  const enabled15 = typeof window !== 'undefined' ? window.v2Renderer : null;
  if (!enabled15 || typeof enabled15.flushNodes !== 'function') return false;
  return enabled15.flushNodes(Array.from(new Set(list2.filter(Boolean))));
}
function _applyImmediateCellSwapPreview(value54, value55, value56) {
  const value57 = typeof window !== 'undefined' ? window.v2Renderer : null,
    enabled16 = value57?.nodeInstances?.get?.(value54);
  if (!enabled16 || typeof enabled16.applyImmediateCellSwap !== 'function') return { ok: false, revert() {} };
  const response = enabled16.applyImmediateCellSwap(value55, value56);
  if (!response || response.ok !== true || typeof response.revert !== 'function')
    return { ok: false, revert() {} };
  return response;
}
function _getDragEdgeScheduler(enabled17) {
  return (
    !enabled17._dragEdgeScheduler &&
      (enabled17._dragEdgeScheduler = {
        rafId: 0,
        pendingPayload: null,
        lastPayload: null,
        lastPaintDx: null,
        lastPaintDy: null,
        liteClassActive: false,
        transformedEdgeIds: new Set(),
      }),
    enabled17._dragEdgeScheduler
  );
}
function _setEdgeInteractionLiteClass(enabled18, value58) {
  if (!enabled18 || enabled18.liteClassActive === value58) return;
  const el = typeof document !== 'undefined' ? document.body : null;
  if (!el || !el.classList) {
    enabled18.liteClassActive = value58;
    return;
  }
  (el.classList.toggle(EDGE_INTERACTION_LITE_CLASS, value58), (enabled18.liteClassActive = value58));
}
function _getRafFns() {
  const raf =
      (typeof requestAnimationFrame === 'function' && requestAnimationFrame) ||
      (typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function' &&
        window.requestAnimationFrame.bind(window)),
    cancel =
      (typeof cancelAnimationFrame === 'function' && cancelAnimationFrame) ||
      (typeof window !== 'undefined' &&
        typeof window.cancelAnimationFrame === 'function' &&
        window.cancelAnimationFrame.bind(window));
  return {
    raf: raf || ((value59) => setTimeout(value59, 0)),
    cancel: cancel || ((value60) => clearTimeout(value60)),
  };
}
function _isDraggedEdgeVisible(value61, value62, value63, value64, value65) {
  const value66 = typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 0,
    value67 = typeof window !== 'undefined' && Number.isFinite(window.innerHeight) ? window.innerHeight : 0,
    value68 = 200,
    { x: x4, y: y3, zoom: zoom2 } = value65,
    value69 = value61 * zoom2 + x4,
    value70 = value62 * zoom2 + y3,
    value71 = value63 * zoom2 + x4,
    value72 = value64 * zoom2 + y3,
    value73 = Math.min(value69, value71),
    value74 = Math.min(value70, value72),
    value75 = Math.max(value69, value71),
    value76 = Math.max(value70, value72);
  return (
    value75 > -value68 && value73 < value66 + value68 && value76 > -value68 && value74 < value67 + value68
  );
}
function _formatEdgeTranslate(value77, value78) {
  return 'translate(' + (Number(value77) || 0) + ' ' + (Number(value78) || 0) + ')';
}
function _collectDraggedEdgeUpdates(value79) {
  const {
      affectedEdges: affectedEdges,
      edgeDomCache: edgeDomCache,
      nodes: nodes,
      targetSet: targetSet,
      viewport: viewport,
      pendingDx: pendingDx,
      pendingDy: pendingDy,
      useEdgeGroupTransform: useEdgeGroupTransform = false,
    } = value79,
    pathsToUpdate = [],
    transformsToUpdate = [];
  return (
    affectedEdges.forEach((edgeId) => {
      const domCache = edgeDomCache.get(edgeId.id);
      if (!domCache) return;
      const value80 = edgeId.sourceId,
        value81 = edgeId.targetId,
        box9 = nodes[value80],
        box10 = nodes[value81];
      if (!box9 || !box10) return;
      const value82 = targetSet.has(value80),
        value83 = targetSet.has(value81),
        value84 = value82 ? box9.x + pendingDx : box9.x,
        value85 = value82 ? box9.y + pendingDy : box9.y,
        value86 = value83 ? box10.x + pendingDx : box10.x,
        value87 = value83 ? box10.y + pendingDy : box10.y,
        value88 = value84 + (box9.width || 0x104),
        value89 = value85 + (box9.height || 100) / 2,
        value90 = value86,
        value91 = value87 + (box10.height || 100) / 2;
      if (!_isDraggedEdgeVisible(value88, value89, value90, value91, viewport)) return;
      if (useEdgeGroupTransform && value82 && value83) {
        transformsToUpdate.push({
          edgeId: edgeId.id,
          domCache: domCache,
          transform: _formatEdgeTranslate(pendingDx, pendingDy),
        });
        return;
      }
      const value92 = Math.abs(value90 - value88),
        value93 = Math.max(value92 * 0.5, 60),
        d =
          'M ' +
          value88 +
          ' ' +
          value89 +
          ' C ' +
          (value88 + value93) +
          ' ' +
          value89 +
          ', ' +
          (value90 - value93) +
          ' ' +
          value91 +
          ', ' +
          value90 +
          ' ' +
          value91;
      pathsToUpdate.push({ domCache: domCache, d: d });
    }),
    { pathsToUpdate: pathsToUpdate, transformsToUpdate: transformsToUpdate }
  );
}
function _applyDraggedEdgePathUpdates(value94, { mainOnly: mainOnly = false } = {}) {
  for (const value95 of value94) {
    if (!mainOnly) value95.domCache.hoverPath?.setAttribute?.('d', value95.d);
    value95.domCache.pathEl?.setAttribute?.('d', value95.d);
  }
}
function _applyDraggedEdgeTransformUpdates(value96, value97 = null) {
  for (const enabled19 of value96) {
    if (!enabled19?.domCache?.groupEl) continue;
    enabled19.transform
      ? (enabled19.domCache.groupEl.setAttribute?.('transform', enabled19.transform),
        value97?.transformedEdgeIds?.add?.(enabled19.edgeId))
      : (enabled19.domCache.groupEl.removeAttribute?.('transform'),
        value97?.transformedEdgeIds?.delete?.(enabled19.edgeId));
  }
}
function _clearDragEdgeTransformPreview(value98) {
  const enabled20 = value98?._dragEdgeScheduler;
  if (!enabled20?.transformedEdgeIds?.size) return;
  const map2 = typeof window !== 'undefined' ? window._edgeDomCache : null;
  if (!map2 || typeof map2.get !== 'function') {
    enabled20.transformedEdgeIds.clear();
    return;
  }
  for (const value99 of enabled20.transformedEdgeIds) {
    map2.get(value99)?.groupEl?.removeAttribute?.('transform');
  }
  enabled20.transformedEdgeIds.clear();
}
function _paintDraggedEdges(value100, value101, { force: force = false, mainOnly: mainOnly = false } = {}) {
  const value102 = Number(value100?.viewport?.zoom) || 1;
  if (!force && value101) {
    const value103 = value101.lastPaintDx,
      value104 = value101.lastPaintDy;
    if (Number.isFinite(value103) && Number.isFinite(value104)) {
      const value105 = Math.abs((value100.pendingDx - value103) * value102),
        value106 = Math.abs((value100.pendingDy - value104) * value102);
      if (value105 < DRAG_EDGE_SCREEN_EPSILON_PX && value106 < DRAG_EDGE_SCREEN_EPSILON_PX) return false;
    }
  }
  const isPerfProbeEnabled2 = isPerfProbeEnabled(),
    value107 =
      isPerfProbeEnabled2 && typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : 0,
    { pathsToUpdate: pathsToUpdate2, transformsToUpdate: transformsToUpdate2 } =
      _collectDraggedEdgeUpdates(value100);
  (_applyDraggedEdgeTransformUpdates(transformsToUpdate2, value101),
    _applyDraggedEdgePathUpdates(pathsToUpdate2, { mainOnly: mainOnly }));
  if (isPerfProbeEnabled2) {
    const value108 =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now(),
      edgeCount = Array.isArray(value100?.affectedEdges) ? value100.affectedEdges.length : 0,
      visibleEdgeCount = pathsToUpdate2.length + transformsToUpdate2.length;
    recordEdgeRedrawSample('partial', value108 - value107, {
      reason: 'drag-controller',
      edgeCount: edgeCount,
      visibleEdgeCount: visibleEdgeCount,
      updatedCount: visibleEdgeCount,
      createdCount: 0,
      removedCount: 0,
      reusedCount: visibleEdgeCount,
      skippedInvisibleCount: Math.max(0, edgeCount - visibleEdgeCount),
      cacheSize: Number.isFinite(value100?.edgeDomCache?.size) ? value100.edgeDomCache.size : 0,
    });
  }
  return (
    value101 &&
      ((value101.lastPaintDx = value100.pendingDx),
      (value101.lastPaintDy = value100.pendingDy),
      (value101.lastPayload = value100)),
    true
  );
}
function _flushDragEdgeScheduler(value109) {
  const enabled21 = value109?._dragEdgeScheduler;
  if (!enabled21) return;
  const value110 = enabled21.pendingPayload || enabled21.lastPayload;
  ((enabled21.pendingPayload = null), (enabled21.lastPayload = null));
  if (enabled21.rafId) {
    const { cancel: cancel2 } = _getRafFns();
    (cancel2(enabled21.rafId), (enabled21.rafId = 0));
  }
  (value110 && _paintDraggedEdges(value110, enabled21, { force: true }),
    (enabled21.lastPaintDx = null),
    (enabled21.lastPaintDy = null),
    _setEdgeInteractionLiteClass(enabled21, false));
}
function _scheduleDraggedEdges(value111, value112) {
  const _getDragEdgeScheduler2 = _getDragEdgeScheduler(value111);
  ((_getDragEdgeScheduler2.pendingPayload = value112),
    (_getDragEdgeScheduler2.lastPayload = value112),
    _setEdgeInteractionLiteClass(_getDragEdgeScheduler2, true));
  if (_getDragEdgeScheduler2.rafId) return;
  const { raf: raf2 } = _getRafFns();
  _getDragEdgeScheduler2.rafId = raf2(() => {
    _getDragEdgeScheduler2.rafId = 0;
    const value113 = _getDragEdgeScheduler2.pendingPayload;
    ((_getDragEdgeScheduler2.pendingPayload = null),
      value113 && _paintDraggedEdges(value113, _getDragEdgeScheduler2, { mainOnly: true }));
  });
}
function _updateDraggedEdges(value114, value115) {
  const _getDragEdgeScheduler3 = _getDragEdgeScheduler(value114),
    value116 = Number(value115?.viewport?.zoom) || 1,
    value117 = Number.isFinite(value115?.edgeCount) ? value115.edgeCount : 0,
    value118 = Math.max(value117, value115.affectedEdges.length),
    enabled22 =
      value116 >= HEAVY_EDGE_DRAG_MIN_ZOOM &&
      value116 <= HEAVY_EDGE_DRAG_MAX_ZOOM &&
      value118 >= HEAVY_EDGE_DRAG_MIN_EDGES &&
      value115.edgeDomCache &&
      value115.edgeDomCache.size > 0;
  if (!enabled22) {
    (_getDragEdgeScheduler3.pendingPayload || _getDragEdgeScheduler3.rafId) &&
      _flushDragEdgeScheduler(value114);
    ((_getDragEdgeScheduler3.lastPaintDx = null),
      (_getDragEdgeScheduler3.lastPaintDy = null),
      _setEdgeInteractionLiteClass(_getDragEdgeScheduler3, false),
      _paintDraggedEdges(value115, _getDragEdgeScheduler3, { force: true }));
    return;
  }
  if (value117 >= HEAVY_EDGE_DRAG_SUPPRESS_LIVE_PAINT_EDGES) {
    ((_getDragEdgeScheduler3.pendingPayload = value115),
      (_getDragEdgeScheduler3.lastPayload = value115),
      _setEdgeInteractionLiteClass(_getDragEdgeScheduler3, true));
    return;
  }
  _scheduleDraggedEdges(value114, value115);
}
function _getNodeWrapperEl(enabled23) {
  if (!enabled23) return null;
  if (typeof window === 'undefined') return null;
  return window.v2Renderer?.getMountedWrapper?.(enabled23) || null;
}
function _syncNodeDragPreview(enabled24, value119) {
  if (!enabled24) return;
  const value120 = window.v2Renderer?.nodeInstances?.get?.(enabled24);
  value120 && typeof value120.syncDragPreview === 'function' && value120.syncDragPreview(value119);
}
function _getMultiSelectBoxEl() {
  if (_cachedMultiSelectBoxEl && _cachedMultiSelectBoxEl.isConnected) return _cachedMultiSelectBoxEl;
  return (
    (_cachedMultiSelectBoxEl = document.getElementById('v2-multi-select-box')),
    _cachedMultiSelectBoxEl
  );
}
function _collectDragTargetIds(value121, value122) {
  const map3 = new Set(value122 || []),
    value123 = value121._parentToChildren || {},
    list3 = Array.from(map3);
  while (list3.length > 0) {
    const value124 = list3.pop(),
      value125 = value123[value124];
    if (value125 && typeof value125[Symbol.iterator] === 'function') {
      for (const value126 of value125) {
        !map3.has(value126) && (map3.add(value126), list3.push(value126));
      }
      continue;
    }
    for (const value127 of Object.values(value121.nodes || {})) {
      value127?.parentId === value124 &&
        !map3.has(value127.id) &&
        (map3.add(value127.id), list3.push(value127.id));
    }
  }
  return map3;
}
function _getNodeDragSessionCache(targetNodeId, value128, list4, isGroupDrag, value129) {
  const selectionKey = Array.isArray(list4) ? list4.join('\x1f') : '',
    origNode = value128?.nodes || {},
    edges = value128?.edges || {},
    parentToChildren = value128?._parentToChildren || null,
    value130 = targetNodeId?._nodeDragSessionCache;
  if (
    value130 &&
    value130.targetNodeId === targetNodeId.targetNodeId &&
    value130.selectionKey === selectionKey &&
    value130.nodes === origNode &&
    value130.edges === edges &&
    value130.parentToChildren === parentToChildren &&
    value130.isGroupDrag === isGroupDrag
  )
    return value130;
  const directTargetSet = new Set(list4 || []),
    targetSet2 = _collectDragTargetIds(value128, list4 || []),
    targets = Array.from(targetSet2),
    targetEntries = targets
      .map((id) => ({
        id: id,
        el: _getNodeWrapperEl(id),
        origNode: origNode[id],
        minimapDot:
          !isGroupDrag || directTargetSet.has(id)
            ? window._v2MinimapDotMap?.get(id) || document.getElementById('minimap-node-' + id)
            : null,
      }))
      .filter((item5) => item5.origNode),
    value131 = {
      targetNodeId: targetNodeId.targetNodeId,
      selectionKey: selectionKey,
      nodes: origNode,
      edges: edges,
      parentToChildren: parentToChildren,
      isGroupDrag: isGroupDrag,
      directTargetSet: directTargetSet,
      targetSet: targetSet2,
      targets: targets,
      targetEntries: targetEntries,
      affectedEdges: _collectAffectedEdgesForTargets(targetSet2, edges),
      edgeCount: Object.keys(edges || {}).length,
      dragPayload:
        Array.isArray(list4) && list4.length === 1 && typeof value129 === 'function'
          ? _getImagePayloadFromNode(value129, origNode[targetNodeId.targetNodeId])
          : null,
    };
  return ((targetNodeId._nodeDragSessionCache = value131), value131);
}
function _markNodeDraggingUiHidden(enabled25, el2, enabled26) {
  if (!enabled25 || !el2 || !enabled26) return;
  if (!enabled25._draggingClassAppliedIds) enabled25._draggingClassAppliedIds = new Set();
  if (enabled25._draggingClassAppliedIds.has(enabled26)) return;
  (el2.classList.add('is-ui-hidden'),
    el2.classList.add('is-dragging'),
    enabled25._draggingClassAppliedIds.add(enabled26));
}
function _waitForCollageItemImage(value132, value133, enabled27, handler4) {
  if (typeof document === 'undefined') {
    handler4();
    return;
  }
  const value134 = performance.now(),
    value135 = 0x708,
    value136 = () => {
      const value137 = typeof window !== 'undefined' ? window.v2Renderer?.nodeInstances?.get(value132) : null,
        el3 = value137?.el || document,
        el4 = el3?.querySelector?.('.collage-item[data-collage-slot-index="' + value133 + '"]'),
        value138 = el4 ? el4.querySelector('img') : null;
      if (value138 && value138.complete && value138.naturalWidth > 0) {
        const value139 = value138.getAttribute('src') || '';
        if (!enabled27 || value139 === enabled27) {
          handler4();
          return;
        }
      }
      if (performance.now() - value134 >= value135) {
        handler4();
        return;
      }
      requestAnimationFrame(value136);
    };
  requestAnimationFrame(value136);
}
function _fadeOutGhost(el5, value140 = 160) {
  if (!el5) return;
  const value141 = 'opacity ' + value140 / 0x3e8 + 's cubic-bezier(0.4, 0, 0.2, 1)',
    value142 = String(el5.style.transition || '').trim();
  ((el5.style.transition = value142 && value142 !== 'none' ? value142 + ', ' + value141 : value141),
    (el5.style.opacity = '0'),
    setTimeout(() => el5.remove(), value140));
}
function _drawImageCover(ctx, box11, value143, value144) {
  const value145 = Math.max(1, Number(box11?.naturalWidth || box11?.width) || 1),
    value146 = Math.max(1, Number(box11?.naturalHeight || box11?.height) || 1),
    value147 = Math.max(1, Number(value143) || 1),
    value148 = Math.max(1, Number(value144) || 1),
    value149 = value145 / value146,
    value150 = value147 / value148;
  let value151 = 0,
    value152 = 0,
    value153 = value145,
    value154 = value146;
  if (value149 > value150)
    ((value153 = Math.max(1, value146 * value150)), (value151 = (value145 - value153) / 2));
  else
    value149 < value150 &&
      ((value154 = Math.max(1, value145 / value150)), (value152 = (value146 - value154) / 2));
  ctx.drawImage(box11, value151, value152, value153, value154, 0, 0, value147, value148);
}
function _createGhostFromImage(value155, width, height, value156) {
  const el6 = document.createElement('div');
  ((el6.className = 'v2-ghost-image'),
    Object.assign(el6.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: width + 'px',
      height: height + 'px',
      opacity: '0.92',
      pointerEvents: 'none',
      zIndex: '10000',
      borderRadius: '8px',
      border: 'none',
      boxShadow: '0 0 0 2px var(--white-80), 0 0 30px 0 var(--white-40), 0 12px 40px var(--black-60)',
      overflow: 'hidden',
      willChange: 'transform, opacity',
      transition: 'none',
      background: 'var(--bg-node)',
    }));
  if (value155 && value155.complete && value155.naturalWidth > 0 && value155.naturalHeight > 0) {
    const el7 = document.createElement('canvas');
    ((el7.width = Math.max(1, Math.round(width))),
      (el7.height = Math.max(1, Math.round(height))),
      Object.assign(el7.style, { width: '100%', height: '100%', display: 'block' }));
    const value157 = el7.getContext('2d', { alpha: false });
    if (value157)
      try {
        return (
          (value157.imageSmoothingEnabled = true),
          (value157.imageSmoothingQuality = 'high'),
          _drawImageCover(value157, value155, el7.width, el7.height),
          el6.appendChild(el7),
          el6
        );
      } catch {}
  }
  const el8 = document.createElement('img'),
    value158 = (value155 && (value155.currentSrc || value155.src)) || value156 || '';
  if (value158) el8.setAttribute('src', value158);
  return (
    Object.assign(el8.style, {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transition: 'none',
    }),
    el6.appendChild(el8),
    el6
  );
}
export function createDragController({
  store: store5,
  isNodeType: isNodeType,
  getShortcuts: getShortcuts,
  hitTestNode: hitTestNode,
  screenToWorld: screenToWorld,
  generateId: generateId,
  cloneNodesWithEdges: cloneNodesWithEdges,
  commit: commit,
  saveOutputBlobImpl: saveOutputBlobImpl = saveOutputBlob,
}) {
  function tryStartTitleDrag(value159, event, value160, value161) {
    if (!event || !event.target) return false;
    const el9 = event.target.closest('.node-label');
    if (!el9 || el9.contentEditable === 'true') return false;
    const enabled28 = el9.dataset.nodeId || (el9.parentElement && el9.parentElement.id);
    if (!enabled28) return false;
    const list5 = store5.getStateRaw().selectedNodeIds || [],
      value162 = list5.includes(enabled28);
    return (
      (value159.isDragging = true),
      (value159.dragSource = 'title'),
      (value159.targetNodeId = enabled28),
      (value159.lastWorldX = value160),
      (value159.lastWorldY = value161),
      (value159.pendingDx = 0),
      (value159.pendingDy = 0),
      (value159.hasMoved = false),
      (value159.wasSelectedOnDown = value162),
      (value159.titleDragStartScreenX = Number.isFinite(event.clientX) ? event.clientX : 0),
      (value159.titleDragStartScreenY = Number.isFinite(event.clientY) ? event.clientY : 0),
      (value159.titleDragActivated = false),
      (value159.titleDragPendingSelectNodeId = value162 ? null : enabled28),
      true
    );
  }
  function tryStartNodeDrag(value163, value164, value165, value166, value167, value168, event2) {
    const { viewport: viewport2, nodes: nodes2 } = store5.getStateRaw(),
      value169 = hitTestNode(value164, value165, nodes2, viewport2),
      enabled29 = value169 ? nodes2[value169] : null;
    if (!enabled29) return false;
    const value170 = enabled29;
    if (value168) {
      const list6 = store5.getStateRaw().selectedNodeIds,
        value171 = list6.includes(value170.id) ? [...list6] : [value170.id],
        value172 = cloneNodesWithEdges(value171, 0, 0),
        value173 = Object.values(value172);
      store5.setSelectedNodes(value173);
      const value174 = value172[value170.id] || value173[0];
      return (
        (value163.isDragging = true),
        (value163.dragSource = 'node'),
        (value163.targetNodeId = value174),
        (value163.lastWorldX = value166),
        (value163.lastWorldY = value167),
        (value163.titleDragPendingSelectNodeId = null),
        (value163.titleDragActivated = false),
        (value163.titleDragStartScreenX = 0),
        (value163.titleDragStartScreenY = 0),
        document.body.classList.add('is-dragging'),
        true
      );
    }
    if (isNodeType(value170, 'storyboard') && value170.isEditing) {
      const storyboardCellMetrics2 = getStoryboardCellMetrics(value170),
        storyboardCellIndexAtWorldPoint = getStoryboardCellIndexAtWorldPoint(value170, value166, value167),
        args3 = value170.cells && value170.cells[storyboardCellIndexAtWorldPoint];
      if (storyboardCellIndexAtWorldPoint >= 0 && args3 && !_isCellEmpty(args3)) {
        const box12 = getStoryboardCellPixelBounds(value170, storyboardCellIndexAtWorldPoint),
          width2 = (box12?.width || storyboardCellMetrics2.cellWidth) * viewport2.zoom,
          height2 = (box12?.height || storyboardCellMetrics2.cellHeight) * viewport2.zoom,
          value175 = value164 - width2 / 2,
          value176 = value165 - height2 / 2,
          el10 = document.createElement('div');
        ((el10.className = 'v2-ghost-image'),
          Object.assign(el10.style, {
            position: 'fixed',
            left: '0',
            top: '0',
            width: width2 + 'px',
            height: height2 + 'px',
            transform: 'translate(' + value175 + 'px, ' + value176 + 'px)',
            opacity: '0.85',
            pointerEvents: 'none',
            zIndex: '10000',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 0 0 2px var(--white-80), 0 0 30px 0 var(--white-40), 0 12px 40px var(--black-60)',
            overflow: 'hidden',
            willChange: 'transform',
            transition: 'none',
          }));
        const el11 = document.getElementById('cell-' + value170.id + '-' + storyboardCellIndexAtWorldPoint),
          value177 = el11?.querySelector('img.storyboard-cell-img--source-crop') || null,
          value178 = el11?.querySelector('.storyboard-cell-img') || null,
          storyboardCellDisplaySrc = getStoryboardCellDisplaySrc(args3),
          box13 = value177
            ? buildStoryboardSourceCropExtract(
                value170,
                storyboardCellIndexAtWorldPoint,
                args3,
                'storyboard_drag_' + value170.id + '_' + storyboardCellIndexAtWorldPoint + '.jpg',
              )
            : null;
        if (box13?.dataUrl) {
          const box14 = getAutoMediaSizeByShortSide(box13.width, box13.height),
            width3 = box14.width * viewport2.zoom,
            height3 = box14.height * viewport2.zoom;
          Object.assign(el10.style, {
            width: width3 + 'px',
            height: height3 + 'px',
            transform: 'translate(' + value164 + 'px, ' + value165 + 'px) translate(-50%, -50%)',
          });
          const el12 = document.createElement('img');
          (el12.setAttribute('src', box13.dataUrl),
            Object.assign(el12.style, {
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
              transition: 'none',
            }),
            el10.appendChild(el12));
        } else {
          if (value178) {
            const value179 = Math.max(1, Math.round(width2)),
              value180 = Math.max(1, Math.round(height2)),
              el13 = document.createElement('canvas');
            ((el13.width = value179),
              (el13.height = value180),
              Object.assign(el13.style, { width: '100%', height: '100%', display: 'block' }));
            const ctx2 = el13.getContext('2d', { alpha: false });
            if (ctx2 && value178.complete && value178.naturalWidth > 0)
              try {
                ((ctx2.imageSmoothingEnabled = true),
                  (ctx2.imageSmoothingQuality = 'high'),
                  ctx2.drawImage(value178, 0, 0, value179, value180),
                  el10.appendChild(el13));
              } catch {
                const el14 = document.createElement('img'),
                  value181 = value178.currentSrc || value178.src || storyboardCellDisplaySrc;
                if (value181) el14.setAttribute('src', value181);
                (Object.assign(el14.style, {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'none',
                }),
                  el10.appendChild(el14));
              }
            else {
              const el15 = document.createElement('img'),
                value182 = value178.currentSrc || value178.src || storyboardCellDisplaySrc;
              if (value182) el15.setAttribute('src', value182);
              (Object.assign(el15.style, {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'none',
              }),
                el10.appendChild(el15));
            }
          } else {
            const el16 = document.createElement('img');
            if (storyboardCellDisplaySrc) el16.setAttribute('src', storyboardCellDisplaySrc);
            (Object.assign(el16.style, {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'none',
            }),
              el10.appendChild(el16));
          }
        }
        document.body.appendChild(el10);
        const el17 = event2?.target?.closest('.sb-cell') || null;
        if (el17) el17.classList.add('is-drag-source');
        return (
          (value163.isDraggingCell = true),
          (value163.dragSource = 'cell'),
          (value163.targetNodeId = value170.id),
          (value163.sourceCellIndex = storyboardCellIndexAtWorldPoint),
          (value163.draggedCellData = { ...args3 }),
          (value163.ghostEl = el10),
          (value163.sourceCellEl = el17),
          (value163.lastWorldX = value166),
          (value163.lastWorldY = value167),
          (value163.titleDragPendingSelectNodeId = null),
          (value163.titleDragActivated = false),
          (value163.titleDragStartScreenX = 0),
          (value163.titleDragStartScreenY = 0),
          document.body.classList.add('is-dragging'),
          true
        );
      }
    }
    const list7 = store5.getStateRaw().selectedNodeIds,
      value183 = list7.includes(value170.id);
    ((value163.isDragging = true),
      (value163.dragSource = 'node'),
      (value163.targetNodeId = value170.id),
      (value163.lastWorldX = value166),
      (value163.lastWorldY = value167),
      (value163.titleDragPendingSelectNodeId = null),
      (value163.titleDragActivated = false),
      (value163.titleDragStartScreenX = 0),
      (value163.titleDragStartScreenY = 0),
      (value163.wasSelectedOnDown = value183),
      document.body.classList.add('is-dragging'));
    const value184 = getShortcuts(),
      value185 = value184['multi-select'] ? value184['multi-select'].keys[0] : 'Shift';
    let value186 = false;
    if (value185 === 'Ctrl') value186 = event2?.ctrlKey || event2?.metaKey;
    else {
      if (value185 === 'Shift') value186 = event2?.shiftKey;
      else {
        if (value185 === 'Alt') value186 = event2?.altKey;
      }
    }
    return (
      value186
        ? list7.includes(value170.id)
          ? (store5.setSelectionMeta({ source: 'shift' }),
            store5.setSelectedNodes(list7.filter((item6) => item6 !== value170.id)),
            (value163.isDragging = false),
            (value163.dragSource = null),
            (value163.targetNodeId = null))
          : (store5.setSelectionMeta({ source: 'shift' }), store5.setSelectedNodes([...list7, value170.id]))
        : !list7.includes(value170.id) &&
          (store5.setSelectionMeta({ source: 'click' }), store5.setSelectedNodes([value170.id])),
      true
    );
  }
  function updateDraggingCell(value187, value188, value189, value190, value191, value192) {
    value187.ghostEl &&
      (value187.ghostEl.style.transform =
        'translate(' + value188 + 'px, ' + value189 + 'px) translate(-50%, -50%)');
    const _getStoryboardCellInfoAt2 = _getStoryboardCellInfoAt(value190, value191, value192, {
        nearestInGap: true,
      }),
      value193 = _getStoryboardCellInfoAt2 ? _getStoryboardCellInfoAt2.nodeId : null,
      value194 = value187.lastHoverNodeId || null;
    if (
      value193 !== value194 ||
      (_getStoryboardCellInfoAt2 && _getStoryboardCellInfoAt2.cellIndex !== value187.lastHoverCellIndex)
    ) {
      if (value194) {
        const value195 = window.v2Renderer?.nodeInstances?.get(value194);
        if (value195 && typeof value195.highlightCell === 'function') value195.highlightCell(-1);
      }
      if (value193) {
        const value196 = window.v2Renderer?.nodeInstances?.get(value193);
        if (value196 && typeof value196.highlightCell === 'function')
          value196.highlightCell(_getStoryboardCellInfoAt2.cellIndex);
      }
      ((value187.lastHoverNodeId = value193),
        (value187.lastHoverCellIndex = _getStoryboardCellInfoAt2 ? _getStoryboardCellInfoAt2.cellIndex : -1));
    }
    ((value187.lastWorldX = value190), (value187.lastWorldY = value191));
  }
  function updateDraggingNodes(
    dragNodeId,
    value197,
    value198,
    value199,
    value200,
    value201,
    value202,
    nodesById,
  ) {
    const { viewport: viewport3, nodes: nodes3, selectedNodeIds: selectedNodeIds, edges: edges2 } = nodesById,
      list8 = selectedNodeIds.includes(dragNodeId.targetNodeId) ? selectedNodeIds : [dragNodeId.targetNodeId],
      value203 = nodes3[dragNodeId.targetNodeId],
      useEdgeGroupTransform2 = list8.length === 1 && isNodeType(value203, 'group'),
      {
        targetSet: targetSet3,
        targets: targets2,
        targetEntries: targetEntries2,
        affectedEdges: affectedEdges2,
        edgeCount: edgeCount2,
        dragPayload: dragPayload,
      } = _getNodeDragSessionCache(dragNodeId, nodesById, list8, useEdgeGroupTransform2, isNodeType);
    if (dragNodeId.dragSource === 'title' && dragNodeId.titleDragActivated !== true) {
      const value204 = Number.isFinite(dragNodeId.titleDragStartScreenX)
          ? dragNodeId.titleDragStartScreenX
          : value197,
        value205 = Number.isFinite(dragNodeId.titleDragStartScreenY)
          ? dragNodeId.titleDragStartScreenY
          : value198,
        value206 = Math.hypot(value197 - value204, value198 - value205);
      if (value206 <= TITLE_DRAG_ACTIVATE_THRESHOLD_PX) return;
      ((dragNodeId.titleDragActivated = true), document.body.classList.add('is-dragging'));
      const value207 = dragNodeId.titleDragPendingSelectNodeId;
      (value207 &&
        !selectedNodeIds.includes(value207) &&
        (typeof store5.setSelectionMeta === 'function' && store5.setSelectionMeta({ source: 'click' }),
        store5.setSelectedNodes([value207])),
        (dragNodeId.titleDragPendingSelectNodeId = null));
    }
    if (list8.length === 1) {
      const enabled30 = dragPayload;
      if (enabled30) {
        const _getStoryboardCellInfoAt3 = _getStoryboardCellInfoAt(value201, value202, nodes3),
          enabled31 = _getStoryboardCellInfoAt3 ? nodes3[_getStoryboardCellInfoAt3.nodeId] : null,
          enabled32 =
            !!enabled30 &&
            !!enabled31 &&
            (!!enabled31.isEditing ||
              _isCellEmpty((enabled31.cells || [])[_getStoryboardCellInfoAt3.cellIndex]));
        let value208 = enabled32 ? _getStoryboardCellInfoAt3.nodeId : null,
          value209 = enabled32 ? _getStoryboardCellInfoAt3.cellIndex : -1,
          value210 = enabled32 ? 'storyboard' : '';
        if (!enabled32) {
          const _getCollageSlotInfoAt2 = _getCollageSlotInfoAt(value201, value202, nodes3),
            enabled33 = _getCollageSlotInfoAt2 ? nodes3[_getCollageSlotInfoAt2.nodeId] : null,
            value211 = (enabled33?.items || [])[_getCollageSlotInfoAt2?.itemIndex],
            value212 = !!enabled30 && !!enabled33 && (!!enabled33.isEditing || isCollageItemEmpty(value211));
          ((value208 = value212 ? _getCollageSlotInfoAt2.nodeId : null),
            (value209 = value212 ? _getCollageSlotInfoAt2.itemIndex : -1),
            (value210 = value212 ? 'collage' : ''));
        }
        const value213 = dragNodeId.lastHoverNodeId || null;
        if (
          value208 !== value213 ||
          value209 !== (dragNodeId.lastHoverCellIndex ?? -1) ||
          value210 !== (dragNodeId.lastHoverKind || '')
        ) {
          if (value213) _clearDropSlotHighlight(value213);
          if (value208) _highlightDropSlot(value208, value210, value209);
          ((dragNodeId.lastHoverNodeId = value208),
            (dragNodeId.lastHoverCellIndex = value209),
            (dragNodeId.lastHoverKind = value210));
        }
      } else
        dragNodeId.lastHoverNodeId &&
          (_clearDropSlotHighlight(dragNodeId.lastHoverNodeId),
          (dragNodeId.lastHoverNodeId = null),
          (dragNodeId.lastHoverCellIndex = -1),
          (dragNodeId.lastHoverKind = ''));
    }
    let value214 = value199,
      value215 = value200;
    if (window.v2SnapToGrid) {
      const value216 = dragNodeId.pendingDx || 0,
        value217 = dragNodeId.pendingDy || 0,
        value218 = value214 - dragNodeId.lastWorldX,
        value219 = value215 - dragNodeId.lastWorldY;
      if (list8.length === 1) {
        const box15 = nodes3[dragNodeId.targetNodeId];
        if (box15) {
          const value220 = box15.x + value216 + value218,
            value221 = box15.y + value217 + value219;
          ((value214 += snapToCanvasGrid(value220) - value220),
            (value215 += snapToCanvasGrid(value221) - value221));
        }
      } else {
        let value222 = Infinity,
          value223 = Infinity;
        targets2.forEach((item7) => {
          const box16 = nodes3[item7];
          if (!box16) return;
          ((value222 = Math.min(value222, (box16.x || 0) + value216)),
            (value223 = Math.min(value223, (box16.y || 0) + value217)));
        });
        if (Number.isFinite(value222) && Number.isFinite(value223)) {
          const value224 = value222 + value218,
            value225 = value223 + value219;
          ((value214 += snapToCanvasGrid(value224) - value224),
            (value215 += snapToCanvasGrid(value225) - value225));
        }
      }
    }
    const _shouldUseDragSnapGuides2 = _shouldUseDragSnapGuides(nodesById, useEdgeGroupTransform2),
      spatialIndex = _shouldUseDragSnapGuides2 ? _getDragSnapSpatialIndex(nodesById) : null;
    if (_shouldUseDragSnapGuides2 && list8.length === 1) {
      const width4 = value203;
      if (width4) {
        const value226 = dragNodeId.pendingDx || 0,
          value227 = dragNodeId.pendingDy || 0,
          proposedX = width4.x + value226 + (value214 - dragNodeId.lastWorldX),
          proposedY = width4.y + value227 + (value215 - dragNodeId.lastWorldY),
          singleNodeSnapGuides = computeSingleNodeSnapGuides({
            nodesById: nodesById.nodes,
            dragNodeId: dragNodeId.targetNodeId,
            proposedX: proposedX,
            proposedY: proposedY,
            width: width4.width || 200,
            height: width4.height || 200,
            viewport: viewport3,
            thresholdPx: 8,
            spatialIndex: spatialIndex,
          });
        (Number.isFinite(singleNodeSnapGuides.snappedX) &&
          (value214 += singleNodeSnapGuides.snappedX - proposedX),
          Number.isFinite(singleNodeSnapGuides.snappedY) &&
            (value215 += singleNodeSnapGuides.snappedY - proposedY),
          Array.isArray(singleNodeSnapGuides.guideLines) && singleNodeSnapGuides.guideLines.length > 0
            ? window._showSnapGuideLines?.(singleNodeSnapGuides.guideLines)
            : window._clearSnapGuideLines?.());
      } else window._clearSnapGuideLines?.();
    } else {
      if (_shouldUseDragSnapGuides2 && list8.length >= 2) {
        const value228 = dragNodeId.pendingDx || 0,
          value229 = dragNodeId.pendingDy || 0,
          value230 = value214 - dragNodeId.lastWorldX,
          value231 = value215 - dragNodeId.lastWorldY;
        let value232 = Infinity,
          value233 = Infinity,
          width5 = -Infinity,
          height4 = -Infinity,
          count5 = 0;
        targets2.forEach((item8) => {
          const box17 = nodes3[item8];
          if (!box17) return;
          count5 += 1;
          const value234 = (box17.x || 0) + value228,
            value235 = (box17.y || 0) + value229,
            value236 = box17.width || 200,
            value237 = box17.height || 200;
          ((value232 = Math.min(value232, value234)),
            (value233 = Math.min(value233, value235)),
            (width5 = Math.max(width5, value234 + value236)),
            (height4 = Math.max(height4, value235 + value237)));
        });
        if (count5 > 0 && Number.isFinite(value232) && Number.isFinite(value233)) {
          const minX = value232 + value230,
            minY = value233 + value231,
            multiNodeSnapGuides = computeMultiNodeSnapGuides({
              nodesById: nodesById.nodes,
              movingNodeIds: targets2,
              proposedBounds: {
                minX: minX,
                minY: minY,
                width: width5 - value232,
                height: height4 - value233,
              },
              viewport: viewport3,
              thresholdPx: 8,
              spatialIndex: spatialIndex,
            });
          (Number.isFinite(multiNodeSnapGuides.snappedX) && (value214 += multiNodeSnapGuides.snappedX - minX),
            Number.isFinite(multiNodeSnapGuides.snappedY) &&
              (value215 += multiNodeSnapGuides.snappedY - minY),
            Array.isArray(multiNodeSnapGuides.guideLines) && multiNodeSnapGuides.guideLines.length > 0
              ? window._showSnapGuideLines?.(multiNodeSnapGuides.guideLines)
              : window._clearSnapGuideLines?.());
        } else window._clearSnapGuideLines?.();
      } else window._clearSnapGuideLines?.();
    }
    const count6 = value214 - dragNodeId.lastWorldX,
      count7 = value215 - dragNodeId.lastWorldY;
    if (count6 !== 0 || count7 !== 0) {
      ((dragNodeId.pendingDx = (dragNodeId.pendingDx || 0) + count6),
        (dragNodeId.pendingDy = (dragNodeId.pendingDy || 0) + count7));
      !dragNodeId.hasMoved &&
        Math.hypot(dragNodeId.pendingDx, dragNodeId.pendingDy) > 3 &&
        (dragNodeId.hasMoved = true);
      const list9 = [],
        list10 = [];
      (targetEntries2.forEach(({ id: id2, el: el18, origNode: origNode2, minimapDot: minimapDot }) => {
        (el18 &&
          list9.push({
            id: id2,
            el: el18,
            origNode: origNode2,
            pendingDx: dragNodeId.pendingDx,
            pendingDy: dragNodeId.pendingDy,
            hasMoved: dragNodeId.hasMoved,
          }),
          minimapDot &&
            window._v2MinimapScale &&
            list10.push({
              minimapDot: minimapDot,
              pendingDx: dragNodeId.pendingDx,
              pendingDy: dragNodeId.pendingDy,
              scale: window._v2MinimapScale,
            }));
      }),
        list9.forEach(
          ({
            id: id3,
            el: el19,
            origNode: origNode3,
            pendingDx: pendingDx2,
            pendingDy: pendingDy2,
            hasMoved: hasMoved,
          }) => {
            const value238 = origNode3.x + pendingDx2,
              value239 = origNode3.y + pendingDy2;
            ((el19.style.transform = 'translate(' + value238 + 'px, ' + value239 + 'px)'),
              hasMoved && _markNodeDraggingUiHidden(dragNodeId, el19, id3),
              isNodeType(origNode3, 'group') &&
                _syncNodeDragPreview(id3, { dx: pendingDx2, dy: pendingDy2, active: hasMoved }));
          },
        ),
        list10.forEach(
          ({ minimapDot: minimapDot2, pendingDx: pendingDx3, pendingDy: pendingDy3, scale: scale }) => {
            minimapDot2.style.transform =
              'translate(' + pendingDx3 * scale + 'px, ' + pendingDy3 * scale + 'px)';
          },
        ));
      const edgeDomCache2 = window._edgeDomCache;
      edgeDomCache2 && edgeDomCache2.size > 0
        ? _updateDraggedEdges(dragNodeId, {
            affectedEdges: affectedEdges2,
            edgeDomCache: edgeDomCache2,
            nodes: nodesById.nodes,
            targetSet: targetSet3,
            viewport: viewport3,
            edgeCount: edgeCount2,
            pendingDx: dragNodeId.pendingDx,
            pendingDy: dragNodeId.pendingDy,
            useEdgeGroupTransform: useEdgeGroupTransform2,
          })
        : _flushDragEdgeScheduler(dragNodeId);
      ((dragNodeId.lastWorldX = value214), (dragNodeId.lastWorldY = value215));
      const el20 = _getMultiSelectBoxEl();
      if (list8.length >= 2 && el20 && el20.style.display !== 'none') {
        const list11 = selectedNodeIds.length > 0 ? selectedNodeIds : [dragNodeId.targetNodeId];
        let value240 = Infinity,
          value241 = Infinity,
          value242 = -Infinity,
          value243 = -Infinity,
          count8 = 0;
        list11.forEach((item9) => {
          const box18 = nodesById.nodes[item9];
          if (!box18) return;
          count8++;
          const value244 = box18.x + (targetSet3.has(item9) ? dragNodeId.pendingDx : 0),
            value245 = box18.y + (targetSet3.has(item9) ? dragNodeId.pendingDy : 0),
            value246 = box18.width || 0x104,
            value247 = box18.height || 100,
            value248 = box18.type !== 'group' ? value245 - 30 : value245;
          ((value240 = Math.min(value240, value244)),
            (value241 = Math.min(value241, value248)),
            (value242 = Math.max(value242, value244 + value246)),
            (value243 = Math.max(value243, value245 + value247)));
        });
        if (count8 >= 2) {
          const value249 = 18;
          ((el20.style.left = value240 - value249 + 'px'),
            (el20.style.top = value241 - value249 + 'px'),
            (el20.style.width = value242 - value240 + value249 * 2 + 'px'),
            (el20.style.height = value243 - value241 + value249 * 2 + 'px'));
        }
      }
    }
  }
  function finishDraggingCell(value250, value251, value252) {
    const value253 = store5.getStateRaw(),
      { viewport: viewport4, nodes: nodes4 } = value253,
      { x: x5, y: y4 } = screenToWorld(value251, value252, viewport4),
      el21 = value250.ghostEl;
    value250.sourceCellEl &&
      (value250.sourceCellEl.classList.remove('is-drag-source'), (value250.sourceCellEl = null));
    const sourceNode = nodes4[value250.targetNodeId],
      sourceCellIndex = value250.sourceCellIndex,
      value254 = value250.draggedCellData;
    if (!sourceNode) {
      if (el21) el21.remove();
      return ((value250.ghostEl = null), { didAct: false, committed: false });
    }
    const _getStoryboardCellInfoAt4 =
      _getStoryboardCellInfoAt(x5, y4, nodes4, { nearestInGap: true }) ||
      _getLastHoveredStoryboardCellInfo(value250, x5, y4, nodes4);
    let didAct = false;
    if (_getStoryboardCellInfoAt4) {
      const targetNode = nodes4[_getStoryboardCellInfoAt4.nodeId],
        targetCellIndex = _getStoryboardCellInfoAt4.cellIndex;
      if (targetNode.id === sourceNode.id && targetCellIndex === sourceCellIndex) {
        if (el21) el21.remove();
        didAct = false;
      } else {
        const value255 = sourceNode.cells?.[sourceCellIndex] || value254,
          value256 = targetNode.cells?.[targetCellIndex],
          sourceSnapshot = resolveStoryboardCellDisplaySnapshot(sourceNode, value255, sourceCellIndex),
          targetSnapshot =
            value256 && !_isCellEmpty(value256)
              ? resolveStoryboardCellDisplaySnapshot(targetNode, value256, targetCellIndex)
              : null;
        if (!sourceSnapshot || (value256 && !_isCellEmpty(value256) && !targetSnapshot)) {
          if (el21) el21.remove();
          didAct = false;
        } else {
          const response2 =
            targetNode.id === sourceNode.id
              ? _applyImmediateCellSwapPreview(sourceNode.id, sourceCellIndex, targetCellIndex)
              : { ok: false, revert() {} };
          if (response2.ok && el21) el21.remove();
          didAct = swapStoryboardCellsWithDisplaySnapshots({
            store: store5,
            sourceNode: sourceNode,
            sourceCellIndex: sourceCellIndex,
            targetNode: targetNode,
            targetCellIndex: targetCellIndex,
            sourceSnapshot: sourceSnapshot,
            targetSnapshot: targetSnapshot,
          });
          !didAct && response2.ok && response2.revert();
          if (didAct) {
            _flushStoryboardNodesNow(sourceNode.id, targetNode.id);
            if (!response2.ok && el21) el21.remove();
          } else el21 && el21.remove();
        }
      }
    } else {
      const storyboardCellMetrics3 = getStoryboardCellMetrics(sourceNode),
        value257 = sourceNode?.cells?.[sourceCellIndex],
        value258 = value257 && !_isCellEmpty(value257) ? value257 : value254,
        value259 = value258 || {},
        id4 = generateId('source-image'),
        src4 = resolveStoryboardCellDisplaySnapshot(sourceNode, value259, sourceCellIndex, {
          fileName: 'storyboard_extract_' + id4 + '.jpg',
        });
      if (!src4?.src) {
        if (el21) el21.remove();
        didAct = false;
      } else {
        const count9 = Number(src4.storyboardSourceIndex),
          storyboardSourceIndex2 =
            Number.isInteger(count9) && count9 >= 0
              ? count9
              : resolveStoryboardCellSourceIndex(value259, sourceCellIndex, sourceNode),
          box19 = getStoryboardCellPixelBounds(sourceNode, storyboardSourceIndex2),
          storyboardSourceLocalPath2 = getStoryboardNodeSourceContext(sourceNode);
        store5.batch(() => {
          const value260 = (sourceCellIndex % sourceNode.cols) + 1,
            value261 = Math.floor(sourceCellIndex / sourceNode.cols) + 1,
            value262 = src4.width || box19?.width || storyboardCellMetrics3.cellWidth,
            value263 = src4.height || box19?.height || storyboardCellMetrics3.cellHeight,
            width6 = getAutoMediaSizeByShortSide(value262, value263);
          (store5.addNode(
            buildSourceMediaNodePayload({
              id: id4,
              type: 'source-image',
              src: src4.capturePreviewUrl ? '' : src4.src,
              capturePreviewUrl: src4.capturePreviewUrl || '',
              localPath: src4.capturePreviewUrl ? null : src4.localPath,
              thumbUrl: null,
              fileName: src4.fileName || value259.fileName || '',
              originalWidth: src4.width || value259.originalWidth,
              originalHeight: src4.height || value259.originalHeight,
              imageWidth: src4.width || value259.imageWidth,
              imageHeight: src4.height || value259.imageHeight,
              sourceLocalPath: null,
              sourceUrl: '',
              sourceWidth: null,
              sourceHeight: null,
              storyboardSourceCrop: false,
              storyboardExtractedCell: true,
              storyboardSourceIndex: storyboardSourceIndex2,
              storyboardSourceNodeId: sourceNode.id,
              storyboardSourceLocalPath: storyboardSourceLocalPath2.sourceLocalPath,
              storyboardSourceUrl: storyboardSourceLocalPath2.sourceUrl,
              naturalWidth: src4.width,
              naturalHeight: src4.height,
              x: x5 - width6.width / 2,
              y: y4 - width6.height / 2,
              width: width6.width,
              height: width6.height,
              name: '提取分镜' + value261 + '-' + value260,
              fixedSize: true,
              needsAutoResize: false,
            }),
          ),
            store5.setSelectedNodes([id4]));
          const cells2 = [...sourceNode.cells];
          ((cells2[sourceCellIndex] = buildEmptyStoryboardCellForSlot(
            cells2[sourceCellIndex],
            sourceNode,
            sourceCellIndex,
          )),
            store5.updateNodeData(sourceNode.id, { cells: cells2 }));
        });
        src4.crop
          ? _persistStoryboardSourceCropExtract(store5, id4, src4.crop, saveOutputBlobImpl)
          : _persistStoryboardSnapshotPreviewToNode(
              store5,
              id4,
              src4,
              src4.fileName || 'storyboard_extract_' + id4 + '.jpg',
              saveOutputBlobImpl,
            );
        if (el21 && id4) {
          const value264 = performance.now(),
            value265 = 0x640,
            value266 = () => {
              const el22 = _getNodeWrapperEl(id4),
                value267 = el22 ? el22.querySelector('img') : null;
              if (value267 && value267.complete && value267.naturalWidth > 0) {
                ((el21.style.transition = 'opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1)'),
                  (el21.style.opacity = '0'),
                  setTimeout(() => el21.remove(), 180));
                return;
              }
              if (performance.now() - value264 >= value265) {
                el21.remove();
                return;
              }
              requestAnimationFrame(value266);
            };
          requestAnimationFrame(value266);
        } else el21 && el21.remove();
        didAct = true;
      }
    }
    value250.ghostEl = null;
    if (value250.lastHoverNodeId) {
      const value268 = window.v2Renderer?.nodeInstances?.get(value250.lastHoverNodeId);
      if (value268 && typeof value268.highlightCell === 'function') value268.highlightCell(-1);
    }
    return { didAct: didAct, committed: didAct };
  }
  function finishDraggingNodes(value269, value270, value271) {
    _flushDragEdgeScheduler(value269);
    if (value269.dragSource === 'title' && value269.titleDragActivated !== true)
      return { earlyCommit: false, didAct: false };
    const value272 = store5.getStateRaw(),
      { viewport: viewport5, nodes: nodes5 } = value272,
      { x: x6, y: y5 } = screenToWorld(value270, value271, viewport5),
      { selectedNodeIds: selectedNodeIds2 } = value272,
      list12 = selectedNodeIds2.includes(value269.targetNodeId)
        ? Array.from(selectedNodeIds2)
        : [value269.targetNodeId];
    if (list12.length === 1) {
      const sourceNodeId = nodes5[list12[0]],
        response3 = _getImagePayloadFromNode(isNodeType, sourceNodeId);
      if (response3) {
        const _getStoryboardCellInfoAt5 = _getStoryboardCellInfoAt(x6, y5, nodes5);
        if (_getStoryboardCellInfoAt5) {
          const enabled34 = nodes5[_getStoryboardCellInfoAt5.nodeId],
            residualImageLocalPath = (enabled34?.cells || [])[_getStoryboardCellInfoAt5.cellIndex],
            value273 =
              !!response3 && !!enabled34 && (!!enabled34.isEditing || _isCellEmpty(residualImageLocalPath));
          if (value273) {
            const el23 = _getNodeWrapperEl(sourceNodeId.id),
              value274 = el23 ? el23.querySelector('img') : null,
              storyboardPayloadDisplaySnapshot = resolveStoryboardPayloadDisplaySnapshot(response3, {
                visibleSrc: getImageElementDisplaySrc(value274),
              });
            if (!storyboardPayloadDisplaySnapshot?.src) return { earlyCommit: false, didAct: false };
            const cells3 = [...(enabled34.cells || [])],
              value275 = response3.storyboardExtractedCell === true,
              value276 = value275 && _isCellEmpty(residualImageLocalPath),
              args4 = value276
                ? {
                    ...(residualImageLocalPath?.residualImageLocalPath
                      ? { residualImageLocalPath: residualImageLocalPath.residualImageLocalPath }
                      : {}),
                    ...(residualImageLocalPath?.residualImageUrl
                      ? { residualImageUrl: residualImageLocalPath.residualImageUrl }
                      : {}),
                    ...(residualImageLocalPath?.residualImageWidth
                      ? { residualImageWidth: residualImageLocalPath.residualImageWidth }
                      : {}),
                    ...(residualImageLocalPath?.residualImageHeight
                      ? { residualImageHeight: residualImageLocalPath.residualImageHeight }
                      : {}),
                    ...(residualImageLocalPath?.residualImageMode
                      ? { residualImageMode: residualImageLocalPath.residualImageMode }
                      : {}),
                  }
                : {},
              storyboardCellMetrics4 = getStoryboardCellMetrics(enabled34),
              box20 = getStoryboardCellPixelBounds(enabled34, _getStoryboardCellInfoAt5.cellIndex),
              value277 = Math.max(
                1,
                Math.round((box20?.width || storyboardCellMetrics4.cellWidth) * viewport5.zoom),
              ),
              value278 = Math.max(
                1,
                Math.round((box20?.height || storyboardCellMetrics4.cellHeight) * viewport5.zoom),
              ),
              box21 = _getStoryboardCellCenterWorldPoint(enabled34, _getStoryboardCellInfoAt5.cellIndex),
              box22 = _worldToScreen(box21.x, box21.y, viewport5),
              el24 = _createGhostFromImage(
                value274,
                value277,
                value278,
                storyboardPayloadDisplaySnapshot.src || response3.thumbUrl || response3.url || '',
              );
            ((el24.style.transform =
              'translate(' + value270 + 'px, ' + value271 + 'px) translate(-50%, -50%)'),
              document.body.appendChild(el24),
              requestAnimationFrame(() => {
                ((el24.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)'),
                  (el24.style.transform =
                    'translate(' + box22.x + 'px, ' + box22.y + 'px) translate(-50%, -50%)'));
              }));
            const args5 = buildFrozenStoryboardCellFromSnapshot(
              storyboardPayloadDisplaySnapshot,
              enabled34,
              _getStoryboardCellInfoAt5.cellIndex,
              { id: generateId('cell') },
            );
            ((cells3[_getStoryboardCellInfoAt5.cellIndex] = { ...args5, ...args4 }),
              store5.updateNodeData(enabled34.id, { cells: cells3 }),
              _flushStoryboardNodesNow(enabled34.id),
              _persistStoryboardSnapshotPreviewToCell(
                store5,
                enabled34.id,
                _getStoryboardCellInfoAt5.cellIndex,
                args5?.id,
                storyboardPayloadDisplaySnapshot,
                storyboardPayloadDisplaySnapshot.fileName ||
                  'storyboard_cell_' + enabled34.id + '_' + _getStoryboardCellInfoAt5.cellIndex + '.jpg',
                saveOutputBlobImpl,
              ));
            const run = () => {
              (store5.setSelectedNodes([]), store5.deleteNodes([sourceNodeId.id]));
            };
            return (
              typeof store5.batch === 'function' ? store5.batch(run) : run(),
              requestAnimationFrame(() => {
                setTimeout(() => commit(), 0);
              }),
              _fadeOutGhost(el24, 0),
              { earlyCommit: true, didAct: true }
            );
          }
        }
        const _getCollageSlotInfoAt3 = _getCollageSlotInfoAt(x6, y5, nodes5);
        if (_getCollageSlotInfoAt3) {
          const enabled35 = nodes5[_getCollageSlotInfoAt3.nodeId],
            value279 = (enabled35?.items || [])[_getCollageSlotInfoAt3.itemIndex];
          if (enabled35 && (!!enabled35.isEditing || isCollageItemEmpty(value279))) {
            const el25 = _getNodeWrapperEl(sourceNodeId.id),
              value280 = el25 ? el25.querySelector('img') : null,
              imageWidth3 = resolveCollagePayloadDisplaySnapshot(response3, {
                visibleSrc: getImageElementDisplaySrc(value280),
              });
            if (!imageWidth3?.src) return { earlyCommit: false, didAct: false };
            const value281 = imageWidth3.localPath || '',
              url2 = imageWidth3.src;
            if (url2) {
              let el26 = null;
              const _getCollageItemFrameInfo3 = _getCollageItemFrameInfo(
                enabled35,
                _getCollageSlotInfoAt3.itemIndex,
              );
              if (typeof document !== 'undefined' && document.body && _getCollageItemFrameInfo3?.frame) {
                const value282 = Math.max(
                    1,
                    Math.round(_getCollageItemFrameInfo3.frame.width * viewport5.zoom),
                  ),
                  value283 = Math.max(1, Math.round(_getCollageItemFrameInfo3.frame.height * viewport5.zoom)),
                  box23 = _getCollageItemCenterWorldPoint(enabled35, _getCollageSlotInfoAt3.itemIndex),
                  box24 = _worldToScreen(box23.x, box23.y, viewport5);
                ((el26 = _createGhostFromImage(value280, value282, value283, url2)),
                  (el26.style.transform =
                    'translate(' + value270 + 'px, ' + value271 + 'px) translate(-50%, -50%)'),
                  document.body.appendChild(el26),
                  requestAnimationFrame(() => {
                    ((el26.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)'),
                      (el26.style.transform =
                        'translate(' + box24.x + 'px, ' + box24.y + 'px) translate(-50%, -50%)'));
                  }));
              }
              const items = [...(enabled35.items || [])];
              items[_getCollageSlotInfoAt3.itemIndex] = {
                ...(value279 || {}),
                id: generateId('collage-item'),
                sourceNodeId: sourceNodeId.id,
                url: url2,
                localPath: normalizeLocalPath(value281),
                thumbLocalPath: normalizeLocalPath(imageWidth3.thumbLocalPath),
                sourceLocalPath: '',
                sourceUrl: '',
                sourceWidth: null,
                sourceHeight: null,
                imageWidth: imageWidth3.width || null,
                imageHeight: imageWidth3.height || null,
                sourceDisplayWidth: _toPositiveNumber(sourceNodeId.width),
                sourceDisplayHeight: _toPositiveNumber(sourceNodeId.height),
                label: sourceNodeId.name || sourceNodeId.fileName || '拼图图片',
                fit: 'cover',
                focusX: 0.5,
                focusY: 0.5,
                isEmpty: false,
              };
              const value284 = window.v2Renderer?.nodeInstances?.get(enabled35.id);
              value284 && typeof value284.previewItems === 'function' && value284.previewItems(items);
              const run2 = () => {
                (store5.updateNodeData(enabled35.id, { items: items }),
                  store5.setSelectedNodes([enabled35.id]),
                  store5.deleteNodes([sourceNodeId.id]));
              };
              if (typeof store5.batch === 'function') store5.batch(run2);
              else run2();
              return (
                requestAnimationFrame(() => {
                  commit();
                }),
                el26 &&
                  _waitForCollageItemImage(enabled35.id, _getCollageSlotInfoAt3.itemIndex, url2, () =>
                    _fadeOutGhost(el26),
                  ),
                value284 && typeof value284.highlightSlot === 'function' && value284.highlightSlot(-1),
                { earlyCommit: true, didAct: true }
              );
            }
          }
        }
      }
    }
    let didAct2 = false;
    (value269.pendingDx || value269.pendingDy) &&
      ((value269.isCommittingDrag = true),
      selectedNodeIds2.includes(value269.targetNodeId)
        ? store5.moveNodes(selectedNodeIds2, value269.pendingDx, value269.pendingDy)
        : store5.updateNodePosition(value269.targetNodeId, value269.pendingDx, value269.pendingDy),
      list12.forEach((item10) => {
        const el27 = _getNodeWrapperEl(item10);
        el27 &&
          (el27.classList.remove('is-ui-hidden'),
          el27.classList.remove('is-dragging'),
          delete el27.style.transform,
          delete el27._posKey);
      }),
      (value269.pendingDx = 0),
      (value269.pendingDy = 0),
      _clearDragEdgeTransformPreview(value269),
      (didAct2 = true));
    const value285 = store5.getStateRaw(),
      list13 = collectGroupContainmentReparentOps(value285.nodes, list12);
    return (
      list13.length > 0 &&
        (store5.batch(() => {
          list13.forEach(({ nodeId: nodeId4, parentId: parentId }) => {
            store5.groupNodes([nodeId4], parentId);
          });
        }),
        (didAct2 = true)),
      { earlyCommit: false, didAct: didAct2 }
    );
  }
  return {
    tryStartTitleDrag: tryStartTitleDrag,
    tryStartNodeDrag: tryStartNodeDrag,
    updateDraggingCell: updateDraggingCell,
    updateDraggingNodes: updateDraggingNodes,
    finishDraggingCell: finishDraggingCell,
    finishDraggingNodes: finishDraggingNodes,
  };
}
