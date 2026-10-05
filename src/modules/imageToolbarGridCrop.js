import appStore from '../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import { t } from '../i18n/index.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { cropGridTiles, saveOutputBlob } from './project.js';
import { getNodeSpawnPrefs } from './nodeSpawn.js';
import { normalizeGridTileResult, resolveGridCropImageRef, toPositiveInt } from './imageToolbarHelpers.js';
const getCanvasFillColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--canvas-white').trim();
function imageGridCropText(value, item = {}) {
  return t('imageGridCrop.' + value, item);
}
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function loadImageForGridCrop(key, index) {
  return new Promise((handler, handler2) => {
    const image = new Image();
    ((image.crossOrigin = 'anonymous'),
      (image.onload = () => handler(image)),
      (image.onerror = () => handler2(new Error(index))),
      (image.src = key));
  });
}
function cropLoadedImageTile({
  loadedImg: loadedImg,
  tileW: tileW,
  tileH: tileH,
  col: col,
  row: row,
  quality: quality,
  idPrefix: idPrefix,
  fileNamePrefix: fileNamePrefix,
  oneBasedFileName: oneBasedFileName = true,
  subDir: subDir2,
}) {
  return new Promise((handler3, handler4) => {
    try {
      const box = document.createElement('canvas');
      ((box.width = tileW), (box.height = tileH));
      const ctx = box.getContext('2d');
      ((ctx.fillStyle = getCanvasFillColor()),
        ctx.fillRect(0, 0, tileW, tileH),
        ctx.drawImage(loadedImg, col * tileW, row * tileH, tileW, tileH, 0, 0, tileW, tileH),
        box.toBlob(
          async (enabled) => {
            if (!enabled) {
              handler4(new Error(imageGridCropText('errors.canvasBlobFailed')));
              return;
            }
            try {
              const generateId2 = generateId(idPrefix),
                result = oneBasedFileName ? row + 1 : row,
                data = oneBasedFileName ? col + 1 : col,
                fileName = new File(
                  [enabled],
                  fileNamePrefix + '_' + generateId2 + '_' + result + '_' + data + '.jpg',
                  { type: 'image/jpeg' },
                ),
                saveOutputBlob2 = await saveOutputBlob(fileName, {
                  ext: 'jpg',
                  ...(subDir2 ? { subDir: subDir2 } : {}),
                });
              handler3(
                normalizeGridTileResult(saveOutputBlob2, {
                  row: row,
                  col: col,
                  fileName: fileName.name,
                  w: tileW,
                  h: tileH,
                }),
              );
            } catch (options) {
              handler4(options);
            }
          },
          'image/jpeg',
          quality,
        ));
    } catch {
      handler4(new Error(imageGridCropText('errors.canvasCorsBlocked')));
    }
  });
}
export async function tryCropGridTilesOnServer(target, cols, rows, ext = {}) {
  const { localPath: localPath } = resolveGridCropImageRef(target);
  if (!localPath) return null;
  try {
    const w = await cropGridTiles({
        localPath: localPath,
        cols: cols,
        rows: rows,
        ext: ext.ext || 'jpg',
        quality: ext.quality || 85,
        subDir: ext.subDir || '',
      }),
      tiles = Array.isArray(w?.tiles) ? w.tiles : [];
    if (tiles.length !== cols * rows) return null;
    return {
      ...w,
      tiles: tiles.map((item2, col2) =>
        normalizeGridTileResult(item2, {
          row: Math.floor(col2 / cols),
          col: col2 % cols,
          w: w.tileWidth,
          h: w.tileHeight,
        }),
      ),
    };
  } catch (source) {
    return (console.warn('[GridCrop] server crop failed, falling back to browser crop:', source), null);
  }
}
async function cropGridTilesInBrowser({
  nodeData: nodeData,
  cols: cols2,
  rows: rows2,
  quality: quality2,
  idPrefix: idPrefix2,
  fileNamePrefix: fileNamePrefix2,
  oneBasedFileName: oneBasedFileName = true,
  subDir: subDir = '',
  fallbackTile: fallbackTile,
}) {
  const { imgUrl: imgUrl } = resolveGridCropImageRef(nodeData),
    loadedImg2 = await loadImageForGridCrop(
      imgUrl,
      fallbackTile?.loadErrorMessage || imageGridCropText('errors.localImageLoadFailed'),
    ),
    tileW2 = Math.floor(loadedImg2.naturalWidth / cols2),
    tileH2 = Math.floor(loadedImg2.naturalHeight / rows2),
    list = [];
  for (let row2 = 0; row2 < rows2; row2++) {
    for (let col3 = 0; col3 < cols2; col3++) {
      const promise = cropLoadedImageTile({
        loadedImg: loadedImg2,
        tileW: tileW2,
        tileH: tileH2,
        col: col3,
        row: row2,
        quality: quality2,
        idPrefix: idPrefix2,
        fileNamePrefix: fileNamePrefix2,
        oneBasedFileName: oneBasedFileName,
        subDir: subDir,
      });
      fallbackTile?.onError
        ? list.push(
            promise.catch((err) =>
              fallbackTile.onError({
                err: err,
                row: row2,
                col: col3,
                tileW: tileW2,
                tileH: tileH2,
              }),
            ),
          )
        : list.push(promise);
    }
  }
  const tiles2 = await Promise.all(list);
  return {
    tiles: tiles2,
    tileW: tileW2,
    tileH: tileH2,
    sourceWidth: loadedImg2.naturalWidth,
    sourceHeight: loadedImg2.naturalHeight,
  };
}
export async function executeGridCrop({ nodeData: nodeData2, cols: cols3, rows: rows3 }) {
  const { imgUrl: imgUrl2 } = resolveGridCropImageRef(nodeData2);
  if (!imgUrl2) throw new Error(imageGridCropText('errors.noImage'));
  let list2 = null,
    toPositiveInt2 = 0,
    toPositiveInt3 = 0;
  const tryCropGridTilesOnServer2 = await tryCropGridTilesOnServer(nodeData2, cols3, rows3, {
    ext: 'jpg',
    quality: 88,
    subDir: 'Multiple grids',
  });
  tryCropGridTilesOnServer2 &&
    ((list2 = tryCropGridTilesOnServer2.tiles),
    (toPositiveInt2 = toPositiveInt(tryCropGridTilesOnServer2.tileWidth, list2[0]?.w || 0)),
    (toPositiveInt3 = toPositiveInt(tryCropGridTilesOnServer2.tileHeight, list2[0]?.h || 0)));
  if (!list2)
    try {
      const cropGridTilesInBrowser2 = await cropGridTilesInBrowser({
        nodeData: nodeData2,
        cols: cols3,
        rows: rows3,
        quality: 0.88,
        idPrefix: 'crop',
        fileNamePrefix: 'crop',
        oneBasedFileName: true,
        subDir: 'Multiple grids',
        fallbackTile: {
          loadErrorMessage: imageGridCropText('errors.localFileReadFailed'),
          onError: ({ err: err2, row: row3, col: col4, tileW: tileW3, tileH: tileH3 }) => {
            return (
              console.error('[GridCrop] tile ' + row3 + '-' + col4 + ' failed:', err2),
              { row: row3, col: col4, url: null, localPath: '', w: tileW3, h: tileH3 }
            );
          },
        },
      });
      ((list2 = cropGridTilesInBrowser2.tiles),
        (toPositiveInt2 = cropGridTilesInBrowser2.tileW),
        (toPositiveInt3 = cropGridTilesInBrowser2.tileH));
    } catch (next) {
      console.error('[GridCrop] load local image failed:', imgUrl2, next);
      throw new Error(imageGridCropText('errors.sourceMaybeRemoved'));
    }
  const { direction: direction, spacing: spacing, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
    stateSnapshot = getStateSnapshot(),
    srcNode = stateSnapshot.nodes[nodeData2.id];
  if (!srcNode) throw new Error(imageGridCropText('errors.sourceNodeMissing'));
  const { width: width, height: height } = getAutoMediaSizeByShortSide(toPositiveInt2, toPositiveInt3),
    current = 12,
    entry = cols3 * width + (cols3 - 1) * current,
    record = rows3 * height + (rows3 - 1) * current;
  let payload, handle;
  direction === 'right'
    ? ((payload = srcNode.x + (srcNode.width || 260) + spacing),
      (handle = srcNode.y + ((srcNode.height || 260) - record) / 2))
    : ((payload = srcNode.x + ((srcNode.width || 260) - entry) / 2),
      (handle = srcNode.y + (srcNode.height || 260) + spacing));
  if (avoidOverlap) {
    const box2 = findAvailablePosition(
      stateSnapshot.nodes,
      payload,
      handle,
      entry,
      record,
      spacing,
      direction,
    );
    ((payload = box2.x), (handle = box2.y));
  }
  const newIds = [];
  return (
    list2.forEach((originalLocalPath) => {
      const {
        row: row4,
        col: col5,
        url: url,
        localPath: localPath2,
        fileName: fileName2,
      } = originalLocalPath;
      if (!url || !localPath2) return;
      const id =
          'source-image-crop-' +
          Date.now() +
          '-' +
          row4 +
          '-' +
          col5 +
          '-' +
          Math.random().toString(36).slice(2, 6),
        x = payload + col5 * (width + current),
        y = handle + row4 * (height + current),
        localPath3 = localPath2.startsWith('/') ? localPath2.slice(1) : localPath2;
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: id,
          type: 'source-image',
          x: x,
          y: y,
          width: width,
          height: height,
          name: imageGridCropText('output.nodeName', { row: row4 + 1, col: col5 + 1 }),
          src: '',
          localPath: localPath3,
          originalLocalPath: originalLocalPath.originalLocalPath || localPath3,
          displayLocalPath: originalLocalPath.displayLocalPath || '',
          thumbLocalPath: originalLocalPath.thumbLocalPath || '',
          originalWidth: originalLocalPath.originalWidth || originalLocalPath.w || toPositiveInt2,
          originalHeight: originalLocalPath.originalHeight || originalLocalPath.h || toPositiveInt3,
          fileName: fileName2 || '',
          needsAutoResize: false,
        }),
      ),
        newIds.push(id));
    }),
    newIds.length > 0 &&
      (appStore.setSelectedNodes(newIds),
      window.v2FocusOnNodes?.([srcNode.id, ...newIds]),
      window._triggerLocalCacheSave?.()),
    { newIds: newIds, srcNode: srcNode }
  );
}
export async function prepareGridCells({ nodeData: nodeData3, cols: cols4, rows: rows4 }) {
  const { localPath: localPath4, imgUrl: imgUrl3 } = resolveGridCropImageRef(nodeData3);
  if (!imgUrl3) throw new Error(imageGridCropText('errors.noImage'));
  const sourceWidth = await tryCropGridTilesOnServer(nodeData3, cols4, rows4, {
    ext: 'jpg',
    quality: 85,
  });
  if (sourceWidth)
    return sourceWidth.tiles.map((localPath5) => ({
      id: generateId('cell'),
      url: '',
      localPath: localPath5.localPath,
      originalLocalPath: localPath5.originalLocalPath || localPath5.localPath,
      displayLocalPath: localPath5.displayLocalPath || '',
      thumbLocalPath: localPath5.thumbLocalPath || '',
      fileName: localPath5.fileName || '',
      originalWidth: localPath5.originalWidth || localPath5.w || sourceWidth.tileWidth,
      originalHeight: localPath5.originalHeight || localPath5.h || sourceWidth.tileHeight,
      sourceLocalPath: localPath4 || '',
      sourceUrl: localPath4 ? '' : imgUrl3,
      sourceWidth: sourceWidth.sourceWidth || sourceWidth.tileWidth * cols4,
      sourceHeight: sourceWidth.sourceHeight || sourceWidth.tileHeight * rows4,
      w: localPath5.w || sourceWidth.tileWidth,
      h: localPath5.h || sourceWidth.tileHeight,
      row: localPath5.row,
      col: localPath5.col,
      isEmpty: false,
    }));
  const {
    tiles: tiles3,
    sourceWidth: sourceWidth2,
    sourceHeight: sourceHeight,
  } = await cropGridTilesInBrowser({
    nodeData: nodeData3,
    cols: cols4,
    rows: rows4,
    quality: 0.85,
    idPrefix: 'tile',
    fileNamePrefix: 'sb',
    oneBasedFileName: false,
    fallbackTile: { loadErrorMessage: imageGridCropText('errors.localImageLoadFailed') },
  });
  return tiles3.map((localPath6) => ({
    id: generateId('cell'),
    url: '',
    localPath: localPath6.localPath,
    originalLocalPath: localPath6.originalLocalPath || localPath6.localPath,
    displayLocalPath: localPath6.displayLocalPath || '',
    thumbLocalPath: localPath6.thumbLocalPath || '',
    fileName: localPath6.fileName || '',
    originalWidth: localPath6.originalWidth || localPath6.w,
    originalHeight: localPath6.originalHeight || localPath6.h,
    sourceLocalPath: localPath4 || '',
    sourceUrl: localPath4 ? '' : imgUrl3,
    sourceWidth: sourceWidth2 || cols4 * localPath6.w,
    sourceHeight: sourceHeight || rows4 * localPath6.h,
    w: localPath6.w,
    h: localPath6.h,
    row: localPath6.row,
    col: localPath6.col,
    isEmpty: false,
  }));
}
