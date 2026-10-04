import {
  buildStoryboardCropRect,
  detachStoryboardCellSourceContext,
  isFrozenStoryboardDisplayCell,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  resolveStoryboardCellAssetSrc,
  resolveStoryboardCellPreviewSrc,
  resolveStoryboardCellSourceIndex,
} from '../../core/storyboardCellUtils.js';
const storyboardSourceImageCache = new Map();
function toPositiveNumber(value, item = null) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : item;
}
export function normalizeStoryboardImageUrl(key) {
  const enabled = String(key || '').trim();
  if (!enabled) return '';
  if (/^(?:https?:|blob:|data:)/i.test(enabled)) return enabled;
  if (enabled.startsWith('/')) return enabled;
  return '/' + enabled.replace(/^\/+/, '');
}
export function isSameStoryboardImageSrc(index, result) {
  const enabled2 = String(result || '').trim();
  if (!enabled2) return true;
  const enabled3 = String(index || '').trim();
  if (!enabled3) return false;
  if (enabled3 === enabled2) return true;
  return normalizeStoryboardImageUrl(enabled3) === normalizeStoryboardImageUrl(enabled2);
}
export function getStoryboardCellSourceImageUrl(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return '';
  if (isStoryboardCellEmpty(enabled4)) return '';
  const storyboardImageUrl =
    normalizeStoryboardImageUrl(enabled4.sourceLocalPath) || normalizeStoryboardImageUrl(enabled4.sourceUrl);
  if (storyboardImageUrl) return storyboardImageUrl;
  return '';
}
export function getStoryboardNodeSourceImageUrl(data) {
  return (
    normalizeStoryboardImageUrl(data?.storyboardSourceLocalPath) ||
    normalizeStoryboardImageUrl(data?.storyboardSourceUrl) ||
    normalizeStoryboardImageUrl(data?.storyboardBackdropLocalPath) ||
    normalizeStoryboardImageUrl(data?.storyboardBackdropUrl) ||
    normalizeStoryboardImageUrl(data?.sourceLocalPath) ||
    normalizeStoryboardImageUrl(data?.sourceUrl)
  );
}
export function getStoryboardNodeSourceContext(options) {
  let sourceLocalPath =
      options?.storyboardSourceLocalPath ||
      options?.storyboardBackdropLocalPath ||
      options?.sourceLocalPath ||
      null,
    sourceUrl = sourceLocalPath
      ? ''
      : String(
          options?.storyboardSourceUrl || options?.storyboardBackdropUrl || options?.sourceUrl || '',
        ).trim();
  if (!sourceLocalPath && !sourceUrl) {
    const target = Array.isArray(options?.cells) ? options.cells : [];
    for (const source of target) {
      const enabled5 = source?.sourceLocalPath || null,
        enabled6 = String(source?.sourceUrl || '').trim();
      if (!enabled5 && !enabled6) continue;
      ((sourceLocalPath = enabled5), (sourceUrl = enabled5 ? '' : enabled6));
      break;
    }
  }
  return { sourceLocalPath: sourceLocalPath || null, sourceUrl: sourceUrl };
}
export function getStoryboardPieceSourceImageUrl(enabled7, next) {
  if (isFrozenStoryboardDisplayCell(enabled7)) return '';
  const storyboardCellSourceImageUrl = getStoryboardCellSourceImageUrl(enabled7);
  if (storyboardCellSourceImageUrl) return storyboardCellSourceImageUrl;
  if (!enabled7 || typeof enabled7 !== 'object' || isStoryboardCellEmpty(enabled7)) return '';
  if (enabled7.storyboardPiece === true) return getStoryboardNodeSourceImageUrl(next);
  return '';
}
export function getStoryboardCellDisplaySrc(current) {
  if (isFrozenStoryboardDisplayCell(current))
    return resolveStoryboardCellPreviewSrc(current) || resolveStoryboardCellAssetSrc(current);
  const storyboardCellSourceImageUrl2 = getStoryboardCellSourceImageUrl(current);
  if (storyboardCellSourceImageUrl2) return storyboardCellSourceImageUrl2;
  return resolveStoryboardCellPreviewSrc(current);
}
function isLoadedImageElement(enabled8) {
  if (!enabled8 || enabled8.complete !== true) return false;
  const count2 = Math.trunc(Number(enabled8.naturalWidth) || 0),
    count3 = Math.trunc(Number(enabled8.naturalHeight) || 0);
  return count2 > 0 && count3 > 0;
}
function rememberStoryboardSourceImage(entry, record) {
  const enabled9 = String(entry || '').trim();
  if (!enabled9 || !isLoadedImageElement(record)) return;
  storyboardSourceImageCache.set(enabled9, record);
}
function getCachedStoryboardSourceImage(payload) {
  const enabled10 = String(payload || '').trim();
  if (!enabled10) return null;
  const handle = storyboardSourceImageCache.get(enabled10) || null;
  if (isLoadedImageElement(handle)) return handle;
  return (storyboardSourceImageCache.delete(enabled10), null);
}
function getLoadedStoryboardSourceImage(state, config, scope = '') {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('cell-' + state + '-' + config),
    input = el?.querySelector?.('img.storyboard-cell-img--source-crop'),
    enabled11 = String(scope || '').trim();
  if (isLoadedImageElement(input)) {
    const enabled12 = String(input.getAttribute?.('src') || input.currentSrc || input.src || '').trim();
    if (!enabled11 || !enabled12 || enabled12 === enabled11)
      return (rememberStoryboardSourceImage(scope, input), input);
  }
  const el2 = document.getElementById('sb-node-' + state),
    output = el2?.querySelector?.('.storyboard-source-backdrop');
  if (!isLoadedImageElement(output)) return null;
  if (enabled11) {
    const value2 = String(output.getAttribute?.('src') || output.currentSrc || output.src || '').trim();
    if (value2 && value2 !== enabled11) return null;
  }
  return (rememberStoryboardSourceImage(scope, output), output);
}
export function buildStoryboardSourceCropExtractFromImage(
  value3,
  value4,
  enabled13,
  fileName,
  value5 = value4,
) {
  if (!enabled13 || typeof document === 'undefined' || typeof document.createElement !== 'function')
    return null;
  const width = Math.max(1, Math.trunc(Number(enabled13.naturalWidth) || 0)),
    height = Math.max(1, Math.trunc(Number(enabled13.naturalHeight) || 0)),
    storyboardCropRect = buildStoryboardCropRect(value3, value5, {
      width: width,
      height: height,
      inset: 0,
    });
  if (!storyboardCropRect || storyboardCropRect.sw <= 0 || storyboardCropRect.sh <= 0) return null;
  const value6 = storyboardCropRect.sx,
    value7 = storyboardCropRect.sy,
    width2 = storyboardCropRect.sw,
    height2 = storyboardCropRect.sh,
    canvas = document.createElement('canvas');
  ((canvas.width = width2), (canvas.height = height2));
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;
  try {
    ((ctx.imageSmoothingEnabled = true),
      (ctx.imageSmoothingQuality = 'high'),
      ctx.drawImage(enabled13, value6, value7, width2, height2, 0, 0, width2, height2));
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (!String(dataUrl || '').startsWith('data:image/')) return null;
    return {
      canvas: canvas,
      dataUrl: dataUrl,
      fileName: fileName,
      width: width2,
      height: height2,
      sourceWidth: width,
      sourceHeight: height,
    };
  } catch {
    return null;
  }
}
export function buildStoryboardSourceCropExtract(value8, value9, value10, value11) {
  const storyboardPieceSourceImageUrl = getStoryboardPieceSourceImageUrl(value10, value8);
  if (!storyboardPieceSourceImageUrl) return null;
  const storyboardCellSourceIndex = resolveStoryboardCellSourceIndex(value10, value9, value8),
    loadedStoryboardSourceImage =
      getLoadedStoryboardSourceImage(value8?.id, value9, storyboardPieceSourceImageUrl) ||
      getCachedStoryboardSourceImage(storyboardPieceSourceImageUrl);
  if (!loadedStoryboardSourceImage) return null;
  return buildStoryboardSourceCropExtractFromImage(
    value8,
    value9,
    loadedStoryboardSourceImage,
    value11,
    storyboardCellSourceIndex,
  );
}
export function loadStoryboardSourceImage(value12) {
  const cachedStoryboardSourceImage = getCachedStoryboardSourceImage(value12);
  if (cachedStoryboardSourceImage) return Promise.resolve(cachedStoryboardSourceImage);
  if (typeof Image !== 'function') return Promise.resolve(null);
  return new Promise((handler) => {
    const image = new Image();
    ((image.crossOrigin = 'anonymous'),
      (image.onload = () => {
        (rememberStoryboardSourceImage(value12, image), handler(image));
      }),
      (image.onerror = () => handler(null)),
      (image.src = value12));
  });
}
export function trimStoryboardImageRef(value13) {
  return String(value13 || '').trim();
}
export function isDataImageRef(value14) {
  return trimStoryboardImageRef(value14).startsWith('data:image/');
}
export function getDataImageExtension(value15) {
  const list =
    String(value15 || '')
      .match(/^data:(image\/[a-z0-9.+-]+)[;,]/i)?.[1]
      ?.toLowerCase() || '';
  if (list.includes('png')) return 'png';
  if (list.includes('webp')) return 'webp';
  if (list.includes('gif')) return 'gif';
  return 'jpg';
}
export function dataImageUrlToBlob(value16) {
  const trimStoryboardImageRef2 = trimStoryboardImageRef(value16),
    enabled14 = trimStoryboardImageRef2.match(/^data:([^;,]+)?(;base64)?,(.*)$/i);
  if (!enabled14 || typeof Blob !== 'function') return null;
  const type = enabled14[1] || 'image/jpeg',
    value17 = !!enabled14[2],
    value18 = enabled14[3] || '';
  if (value17) {
    if (typeof atob !== 'function') return null;
    try {
      const list2 = atob(value18),
        uint8Array = new Uint8Array(list2.length);
      for (let value19 = 0; value19 < list2.length; value19 += 1) {
        uint8Array[value19] = list2.charCodeAt(value19);
      }
      return new Blob([uint8Array], { type: type });
    } catch {
      return null;
    }
  }
  try {
    return new Blob([decodeURIComponent(value18)], { type: type });
  } catch {
    return null;
  }
}
function isNonLocalImageRef(value20) {
  return /^(?:https?:|blob:|data:|aic-local-preview:)/i.test(trimStoryboardImageRef(value20));
}
function toStoredStoryboardLocalPath(value21) {
  const trimStoryboardImageRef3 = trimStoryboardImageRef(value21);
  if (!trimStoryboardImageRef3 || isNonLocalImageRef(trimStoryboardImageRef3)) return null;
  return trimStoryboardImageRef3.replace(/^\/+/, '') || null;
}
function isSameStoryboardImageRef(value22, value23) {
  const trimStoryboardImageRef4 = trimStoryboardImageRef(value22),
    trimStoryboardImageRef5 = trimStoryboardImageRef(value23);
  if (!trimStoryboardImageRef4 || !trimStoryboardImageRef5) return false;
  if (trimStoryboardImageRef4 === trimStoryboardImageRef5) return true;
  return (
    normalizeStoryboardImageUrl(trimStoryboardImageRef4) ===
    normalizeStoryboardImageUrl(trimStoryboardImageRef5)
  );
}
function isStoryboardPayloadSourceContextRef(value24, enabled15) {
  const trimStoryboardImageRef6 = trimStoryboardImageRef(value24);
  if (!trimStoryboardImageRef6 || !enabled15 || typeof enabled15 !== 'object') return false;
  return [
    enabled15.sourceLocalPath,
    enabled15.sourceUrl,
    enabled15.storyboardSourceLocalPath,
    enabled15.storyboardSourceUrl,
  ].some((item2) => isSameStoryboardImageRef(trimStoryboardImageRef6, item2));
}
export function getImageElementDisplaySrc(enabled16) {
  if (!enabled16) return '';
  return trimStoryboardImageRef(
    enabled16.currentSrc ||
      enabled16.src ||
      (typeof enabled16.getAttribute === 'function' ? enabled16.getAttribute('src') : ''),
  );
}
function pickStoryboardCellStoredLocalPath(value25, value26 = '') {
  const value27 = [
    value25?.localPath,
    value25?.displayLocalPath,
    value25?.originalLocalPath,
    value25?.thumbLocalPath,
    value26,
  ];
  for (const value28 of value27) {
    const toStoredStoryboardLocalPath2 = toStoredStoryboardLocalPath(value28);
    if (toStoredStoryboardLocalPath2) return toStoredStoryboardLocalPath2;
  }
  return null;
}
function buildStoryboardCellAssetSnapshot(value29, id, value30) {
  const src = resolveStoryboardCellAssetSrc(id);
  if (!src) return null;
  const originalLocalPath = isDataImageRef(id?.capturePreviewUrl)
      ? trimStoryboardImageRef(id.capturePreviewUrl)
      : isDataImageRef(src)
        ? trimStoryboardImageRef(src)
        : '',
    localPath = originalLocalPath ? null : pickStoryboardCellStoredLocalPath(id, src),
    externalUrl = !localPath && !originalLocalPath ? src : '',
    width3 =
      toPositiveNumber(id?.imageWidth) ||
      toPositiveNumber(id?.originalWidth) ||
      toPositiveNumber(id?.w) ||
      null,
    height3 =
      toPositiveNumber(id?.imageHeight) ||
      toPositiveNumber(id?.originalHeight) ||
      toPositiveNumber(id?.h) ||
      null;
  return {
    kind: 'asset',
    id: id?.id || null,
    src: src,
    localPath: localPath,
    originalLocalPath: originalLocalPath ? null : toStoredStoryboardLocalPath(id?.originalLocalPath),
    displayLocalPath: originalLocalPath ? '' : toStoredStoryboardLocalPath(id?.displayLocalPath) || '',
    thumbLocalPath: originalLocalPath ? null : toStoredStoryboardLocalPath(id?.thumbLocalPath),
    capturePreviewUrl: originalLocalPath,
    externalUrl: externalUrl,
    fileName: trimStoryboardImageRef(id?.fileName),
    width: width3,
    height: height3,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(id, value30, value29),
    storyboardExtractedCell: id?.storyboardExtractedCell === true,
    storyboardLockedCell: id?.storyboardLockedCell === true,
    wasSourceBacked: !!getStoryboardPieceSourceImageUrl(id, value29),
  };
}
function buildStoryboardCellCropSnapshot(value31, id2, value32, src2) {
  if (!src2?.dataUrl) return null;
  return {
    kind: 'source-crop',
    id: id2?.id || null,
    src: src2.dataUrl,
    localPath: null,
    originalLocalPath: null,
    displayLocalPath: '',
    thumbLocalPath: null,
    capturePreviewUrl: src2.dataUrl,
    externalUrl: '',
    fileName: src2.fileName || '',
    width: src2.width || null,
    height: src2.height || null,
    sourceWidth: src2.sourceWidth || id2?.sourceWidth || null,
    sourceHeight: src2.sourceHeight || id2?.sourceHeight || null,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(id2, value32, value31),
    storyboardExtractedCell: false,
    storyboardLockedCell: true,
    crop: src2,
    wasSourceBacked: true,
  };
}
export function resolveStoryboardPayloadDisplaySnapshot(storyboardExtractedCell, value33 = {}) {
  if (!storyboardExtractedCell || typeof storyboardExtractedCell !== 'object') return null;
  const trimStoryboardImageRef7 = trimStoryboardImageRef(value33.visibleSrc),
    trimStoryboardImageRef8 = trimStoryboardImageRef(storyboardExtractedCell.url),
    isStoryboardPayloadSourceContextRef2 = isStoryboardPayloadSourceContextRef(
      trimStoryboardImageRef8,
      storyboardExtractedCell,
    )
      ? ''
      : trimStoryboardImageRef8,
    capturePreviewUrl = isDataImageRef(trimStoryboardImageRef7)
      ? trimStoryboardImageRef7
      : isDataImageRef(storyboardExtractedCell.capturePreviewUrl)
        ? trimStoryboardImageRef(storyboardExtractedCell.capturePreviewUrl)
        : isDataImageRef(isStoryboardPayloadSourceContextRef2)
          ? isStoryboardPayloadSourceContextRef2
          : '',
    localPath2 = capturePreviewUrl
      ? null
      : toStoredStoryboardLocalPath(trimStoryboardImageRef7) ||
        toStoredStoryboardLocalPath(storyboardExtractedCell.localPath) ||
        toStoredStoryboardLocalPath(storyboardExtractedCell.displayLocalPath) ||
        toStoredStoryboardLocalPath(storyboardExtractedCell.thumbLocalPath) ||
        toStoredStoryboardLocalPath(isStoryboardPayloadSourceContextRef2),
    src3 =
      capturePreviewUrl ||
      normalizeStoryboardImageUrl(localPath2) ||
      normalizeStoryboardImageUrl(trimStoryboardImageRef7) ||
      normalizeStoryboardImageUrl(storyboardExtractedCell.thumbLocalPath) ||
      normalizeStoryboardImageUrl(isStoryboardPayloadSourceContextRef2);
  if (!src3) return null;
  const storyboardSourceIndex = Number(storyboardExtractedCell.storyboardSourceIndex);
  return {
    kind: 'asset',
    src: src3,
    localPath: localPath2,
    originalLocalPath: toStoredStoryboardLocalPath(storyboardExtractedCell.originalLocalPath),
    displayLocalPath: toStoredStoryboardLocalPath(storyboardExtractedCell.displayLocalPath) || '',
    thumbLocalPath: toStoredStoryboardLocalPath(storyboardExtractedCell.thumbLocalPath),
    capturePreviewUrl: capturePreviewUrl,
    externalUrl: !localPath2 && !capturePreviewUrl ? src3 : '',
    fileName: trimStoryboardImageRef(storyboardExtractedCell.fileName),
    width:
      toPositiveNumber(storyboardExtractedCell.imageWidth) ||
      toPositiveNumber(storyboardExtractedCell.originalWidth) ||
      null,
    height:
      toPositiveNumber(storyboardExtractedCell.imageHeight) ||
      toPositiveNumber(storyboardExtractedCell.originalHeight) ||
      null,
    ...(Number.isInteger(storyboardSourceIndex) && storyboardSourceIndex >= 0
      ? { storyboardSourceIndex: storyboardSourceIndex }
      : {}),
    storyboardExtractedCell: storyboardExtractedCell.storyboardExtractedCell === true,
    storyboardLockedCell: false,
  };
}
export function resolveCollagePayloadDisplaySnapshot(value34, value35 = {}) {
  const src4 = resolveStoryboardPayloadDisplaySnapshot(value34, value35);
  if (!src4?.src) return null;
  return {
    src: src4.src,
    localPath: src4.localPath || '',
    thumbLocalPath: src4.thumbLocalPath || null,
    width: src4.width || null,
    height: src4.height || null,
  };
}
export function resolveStoryboardCellDisplaySnapshot(value36, enabled17, value37, value38) {
  if (!enabled17 || typeof enabled17 !== 'object' || isStoryboardCellEmpty(enabled17)) return null;
  const storyboardCellAssetSnapshot = buildStoryboardCellAssetSnapshot(value36, enabled17, value37);
  if (isFrozenStoryboardDisplayCell(enabled17)) return storyboardCellAssetSnapshot;
  const storyboardPieceSourceImageUrl2 = getStoryboardPieceSourceImageUrl(enabled17, value36);
  if (!storyboardPieceSourceImageUrl2) return storyboardCellAssetSnapshot;
  const storyboardSourceCropExtract = buildStoryboardSourceCropExtract(
    value36,
    value37,
    enabled17,
    value38?.fileName || 'storyboard_snapshot_' + (value36?.id || 'node') + '_' + value37 + '.jpg',
  );
  return (
    buildStoryboardCellCropSnapshot(value36, enabled17, value37, storyboardSourceCropExtract) ||
    storyboardCellAssetSnapshot
  );
}
function getStoryboardCellPositionPatch(value39, col) {
  return {
    col: col % Math.max(1, Number(value39?.cols) || 1),
    row: Math.floor(col / Math.max(1, Number(value39?.cols) || 1)),
  };
}
function getStoryboardCellSourceIndexPatch(value40, value41, value42) {
  return { storyboardSourceIndex: resolveStoryboardCellSourceIndex(value40, value42, value41) };
}
function cloneStoryboardCellForGridPosition(value43, value44, value45) {
  return {
    ...(value43 && typeof value43 === 'object' ? value43 : {}),
    ...getStoryboardCellSourceIndexPatch(value43, value44, value45),
    ...getStoryboardCellPositionPatch(value44, value45),
  };
}
function buildLockedStoryboardCellFromCrop(value46, value47, value48, capturePreviewUrl2) {
  if (!capturePreviewUrl2?.dataUrl) return null;
  return detachStoryboardCellSourceContext(
    {
      ...(value46 && typeof value46 === 'object' ? value46 : {}),
      ...getStoryboardCellSourceIndexPatch(value46, value47, value48),
      ...getStoryboardCellPositionPatch(value47, value48),
      url: '',
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: '',
      thumbLocalPath: '',
      thumbUrl: '',
      thumbId: null,
      capturePreviewUrl: capturePreviewUrl2.dataUrl,
      fileName: capturePreviewUrl2.fileName || '',
      originalWidth: capturePreviewUrl2.width,
      originalHeight: capturePreviewUrl2.height,
      imageWidth: capturePreviewUrl2.width,
      imageHeight: capturePreviewUrl2.height,
      w: capturePreviewUrl2.width,
      h: capturePreviewUrl2.height,
      sourceWidth: capturePreviewUrl2.sourceWidth || value46?.sourceWidth || null,
      sourceHeight: capturePreviewUrl2.sourceHeight || value46?.sourceHeight || null,
      storyboardLockedCell: true,
      storyboardExtractedCell: false,
      isEmpty: false,
    },
    { locked: true, extracted: false },
  );
}
export function buildFrozenStoryboardCellFromSnapshot(id3, value49, value50, id4 = {}) {
  const trimStoryboardImageRef9 = trimStoryboardImageRef(id3?.src);
  if (!trimStoryboardImageRef9) return null;
  const originalLocalPath2 = isDataImageRef(id3.capturePreviewUrl)
      ? trimStoryboardImageRef(id3.capturePreviewUrl)
      : isDataImageRef(trimStoryboardImageRef9)
        ? trimStoryboardImageRef9
        : '',
    localPath3 = originalLocalPath2
      ? null
      : toStoredStoryboardLocalPath(id3.localPath) || toStoredStoryboardLocalPath(trimStoryboardImageRef9),
    url =
      !localPath3 && !originalLocalPath2
        ? trimStoryboardImageRef(id3.externalUrl || trimStoryboardImageRef9)
        : '',
    originalWidth =
      toPositiveNumber(id3.width) ||
      toPositiveNumber(id3.imageWidth) ||
      toPositiveNumber(id3.originalWidth) ||
      null,
    originalHeight =
      toPositiveNumber(id3.height) ||
      toPositiveNumber(id3.imageHeight) ||
      toPositiveNumber(id3.originalHeight) ||
      null,
    storyboardSourceIndex2 = Number(id3.storyboardSourceIndex);
  return {
    ...(id4.id ? { id: id4.id } : id3.id ? { id: id3.id } : {}),
    url: url || '',
    localPath: localPath3,
    originalLocalPath: originalLocalPath2 ? null : toStoredStoryboardLocalPath(id3.originalLocalPath),
    displayLocalPath: originalLocalPath2 ? '' : toStoredStoryboardLocalPath(id3.displayLocalPath) || '',
    thumbLocalPath: originalLocalPath2 ? null : toStoredStoryboardLocalPath(id3.thumbLocalPath),
    thumbUrl: '',
    thumbId: null,
    capturePreviewUrl: originalLocalPath2,
    fileName: trimStoryboardImageRef(id3.fileName),
    originalWidth: originalWidth,
    originalHeight: originalHeight,
    imageWidth: originalWidth,
    imageHeight: originalHeight,
    w: originalWidth,
    h: originalHeight,
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: false,
    storyboardExtractedCell: id3.storyboardExtractedCell === true,
    storyboardLockedCell:
      id3.storyboardLockedCell === true || id3.kind === 'source-crop' || id4.locked === true,
    ...(Number.isInteger(storyboardSourceIndex2) && storyboardSourceIndex2 >= 0
      ? { storyboardSourceIndex: storyboardSourceIndex2 }
      : {}),
    isEmpty: false,
    ...getStoryboardCellPositionPatch(value49, value50),
  };
}
export function buildEmptyStoryboardCellForSlot(value51, value52, value53) {
  return normalizeEmptyStoryboardCell({
    ...(value51 && typeof value51 === 'object' ? value51 : {}),
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: false,
    storyboardLockedCell: false,
    ...getStoryboardCellPositionPatch(value52, value53),
  });
}
function updateStoryboardSwapCells(store, value54, value55, cells, cells2) {
  if (value54.id === value55.id) {
    if (typeof store.updateNodeData !== 'function') return false;
    return (store.updateNodeData(value54.id, { cells: cells }), true);
  }
  if (typeof store.updateNodesData === 'function')
    return (
      store.updateNodesData({
        [value54.id]: { cells: cells },
        [value55.id]: { cells: cells2 },
      }),
      true
    );
  if (typeof store.updateNodeData !== 'function') return false;
  return (
    store.updateNodeData(value54.id, { cells: cells }),
    store.updateNodeData(value55.id, { cells: cells2 }),
    true
  );
}
export function swapStoryboardCellsWithDisplaySnapshots({
  store: store2,
  sourceNode: sourceNode,
  sourceCellIndex: sourceCellIndex,
  targetNode: targetNode,
  targetCellIndex: targetCellIndex,
  sourceSnapshot: sourceSnapshot = null,
  targetSnapshot: targetSnapshot = null,
}) {
  if (!sourceNode || !targetNode) return false;
  const value56 = sourceNode.cells?.[sourceCellIndex],
    value57 = targetNode.cells?.[targetCellIndex];
  !sourceSnapshot &&
    (sourceSnapshot = resolveStoryboardCellDisplaySnapshot(sourceNode, value56, sourceCellIndex));
  if (!sourceSnapshot) return false;
  const value58 = value57 && !isStoryboardCellEmpty(value57);
  value58 &&
    !targetSnapshot &&
    (targetSnapshot = resolveStoryboardCellDisplaySnapshot(targetNode, value57, targetCellIndex));
  if (value58 && !targetSnapshot) return false;
  const enabled18 = [...(sourceNode.cells || [])],
    enabled19 = sourceNode.id === targetNode.id ? enabled18 : [...(targetNode.cells || [])];
  ((enabled19[targetCellIndex] = buildFrozenStoryboardCellFromSnapshot(
    sourceSnapshot,
    targetNode,
    targetCellIndex,
  )),
    (enabled18[sourceCellIndex] = value58
      ? buildFrozenStoryboardCellFromSnapshot(targetSnapshot, sourceNode, sourceCellIndex)
      : buildEmptyStoryboardCellForSlot(value56, sourceNode, sourceCellIndex)));
  if (!enabled19[targetCellIndex] || (value58 && !enabled18[sourceCellIndex])) return false;
  return updateStoryboardSwapCells(store2, sourceNode, targetNode, enabled18, enabled19);
}
export function lockStoryboardCellForCurrentGrid(value59, value60, value61) {
  const enabled20 = value59?.cells?.[value60];
  if (!enabled20 || isStoryboardCellEmpty(enabled20))
    return normalizeEmptyStoryboardCell({
      ...(enabled20 && typeof enabled20 === 'object' ? enabled20 : {}),
      ...getStoryboardCellPositionPatch(value59, value60),
    });
  const storyboardSourceCropExtract2 = buildStoryboardSourceCropExtract(value59, value60, enabled20, value61);
  if (storyboardSourceCropExtract2?.dataUrl)
    return buildLockedStoryboardCellFromCrop(enabled20, value59, value60, storyboardSourceCropExtract2);
  if (enabled20.storyboardLockedCell === true || enabled20.storyboardExtractedCell === true)
    return cloneStoryboardCellForGridPosition(enabled20, value59, value60);
  if (getStoryboardPieceSourceImageUrl(enabled20, value59)) return null;
  return cloneStoryboardCellForGridPosition(enabled20, value59, value60);
}
export function swapStoryboardCellsWithLockedBlocks({
  store: store3,
  sourceNode: sourceNode2,
  sourceCellIndex: sourceCellIndex2,
  targetNode: targetNode2,
  targetCellIndex: targetCellIndex2,
}) {
  if (!sourceNode2 || !targetNode2) return false;
  const args = sourceNode2.cells?.[sourceCellIndex2],
    value62 = targetNode2.cells?.[targetCellIndex2],
    enabled21 = !!getStoryboardPieceSourceImageUrl(args, sourceNode2),
    enabled22 =
      value62 && !isStoryboardCellEmpty(value62)
        ? !!getStoryboardPieceSourceImageUrl(value62, targetNode2)
        : false;
  if (!enabled21 && !enabled22) return false;
  if (sourceNode2.id === targetNode2.id && typeof store3.updateNodeData !== 'function') return false;
  if (sourceNode2.id !== targetNode2.id && typeof store3.updateNodesData !== 'function') return false;
  const args2 = lockStoryboardCellForCurrentGrid(
    sourceNode2,
    sourceCellIndex2,
    'storyboard_lock_' + sourceNode2.id + '_' + sourceCellIndex2 + '.jpg',
  );
  if (!args2 || isStoryboardCellEmpty(args2)) return false;
  const args3 = lockStoryboardCellForCurrentGrid(
    targetNode2,
    targetCellIndex2,
    'storyboard_lock_' + targetNode2.id + '_' + targetCellIndex2 + '.jpg',
  );
  if (value62 && !isStoryboardCellEmpty(value62) && !args3) return false;
  if (sourceNode2.id === targetNode2.id) {
    const cells3 = [...(sourceNode2.cells || [])];
    return (
      (cells3[targetCellIndex2] = {
        ...args2,
        ...getStoryboardCellPositionPatch(sourceNode2, targetCellIndex2),
      }),
      (cells3[sourceCellIndex2] =
        value62 && !isStoryboardCellEmpty(value62)
          ? { ...args3, ...getStoryboardCellPositionPatch(sourceNode2, sourceCellIndex2) }
          : normalizeEmptyStoryboardCell({
              ...args,
              ...getStoryboardCellPositionPatch(sourceNode2, sourceCellIndex2),
            })),
      store3.updateNodeData(sourceNode2.id, { cells: cells3 }),
      true
    );
  }
  const cells4 = [...(sourceNode2.cells || [])],
    cells5 = [...(targetNode2.cells || [])];
  return (
    (cells5[targetCellIndex2] = {
      ...args2,
      ...getStoryboardCellPositionPatch(targetNode2, targetCellIndex2),
    }),
    (cells4[sourceCellIndex2] =
      value62 && !isStoryboardCellEmpty(value62)
        ? { ...args3, ...getStoryboardCellPositionPatch(sourceNode2, sourceCellIndex2) }
        : normalizeEmptyStoryboardCell({
            ...args,
            ...getStoryboardCellPositionPatch(sourceNode2, sourceCellIndex2),
          })),
    store3.updateNodesData({ [sourceNode2.id]: { cells: cells4 }, [targetNode2.id]: { cells: cells5 } }),
    true
  );
}
export function requiresLockedStoryboardSwap({
  sourceNode: sourceNode3,
  sourceCellIndex: sourceCellIndex3,
  targetNode: targetNode3,
  targetCellIndex: targetCellIndex3,
}) {
  const value63 = sourceNode3?.cells?.[sourceCellIndex3],
    value64 = targetNode3?.cells?.[targetCellIndex3];
  return !!(
    getStoryboardPieceSourceImageUrl(value63, sourceNode3) ||
    (value64 && !isStoryboardCellEmpty(value64) && getStoryboardPieceSourceImageUrl(value64, targetNode3))
  );
}
