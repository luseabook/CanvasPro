import appStore from '../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import { t } from '../i18n/index.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { cropGridTiles, saveOutputBlob } from './project.js';
import { getNodeSpawnPrefs } from './nodeSpawn.js';
import { normalizeGridTileResult, resolveGridCropImageRef, toPositiveInt } from './imageToolbarHelpers.js';
const getCanvasFillColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--canvas-white').trim();
function imageGridCropText(_0x32401b, _0x1eb7aa = {}) {
  return t('imageGridCrop.' + _0x32401b, _0x1eb7aa);
}
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function loadImageForGridCrop(_0x41531a, _0x201df8) {
  return new Promise((_0x3b0d8a, _0xfcd478) => {
    const _0x4d750b = new Image();
    ((_0x4d750b.crossOrigin = 'anonymous'),
      (_0x4d750b.onload = () => _0x3b0d8a(_0x4d750b)),
      (_0x4d750b.onerror = () => _0xfcd478(new Error(_0x201df8))),
      (_0x4d750b.src = _0x41531a));
  });
}
function cropLoadedImageTile({
  loadedImg: _0x376fb8,
  tileW: _0x1a02df,
  tileH: _0x58beea,
  col: _0x12d5b1,
  row: _0x5ad041,
  quality: _0x5c35c6,
  idPrefix: _0x43b790,
  fileNamePrefix: _0x587930,
  oneBasedFileName: oneBasedFileName = true,
  subDir: _0xa03185,
}) {
  return new Promise((_0x2b7a05, _0x4347aa) => {
    try {
      const _0xea3986 = document.createElement('canvas');
      ((_0xea3986.width = _0x1a02df), (_0xea3986.height = _0x58beea));
      const _0x35c4f3 = _0xea3986.getContext('2d');
      ((_0x35c4f3.fillStyle = getCanvasFillColor()),
        _0x35c4f3.fillRect(0, 0, _0x1a02df, _0x58beea),
        _0x35c4f3.drawImage(
          _0x376fb8,
          _0x12d5b1 * _0x1a02df,
          _0x5ad041 * _0x58beea,
          _0x1a02df,
          _0x58beea,
          0,
          0,
          _0x1a02df,
          _0x58beea,
        ),
        _0xea3986.toBlob(
          async (_0x467a59) => {
            if (!_0x467a59) {
              _0x4347aa(new Error(imageGridCropText('errors.canvasBlobFailed')));
              return;
            }
            try {
              const _0x1ce8f4 = generateId(_0x43b790),
                _0x2dc24a = oneBasedFileName ? _0x5ad041 + 1 : _0x5ad041,
                _0x530c33 = oneBasedFileName ? _0x12d5b1 + 1 : _0x12d5b1,
                _0x3e305c = new File(
                  [_0x467a59],
                  _0x587930 + '_' + _0x1ce8f4 + '_' + _0x2dc24a + '_' + _0x530c33 + '.jpg',
                  { type: 'image/jpeg' },
                ),
                _0x242a26 = await saveOutputBlob(_0x3e305c, {
                  ext: 'jpg',
                  ...(_0xa03185 ? { subDir: _0xa03185 } : {}),
                });
              _0x2b7a05(
                normalizeGridTileResult(_0x242a26, {
                  row: _0x5ad041,
                  col: _0x12d5b1,
                  fileName: _0x3e305c.name,
                  w: _0x1a02df,
                  h: _0x58beea,
                }),
              );
            } catch (_0x18c0a3) {
              _0x4347aa(_0x18c0a3);
            }
          },
          'image/jpeg',
          _0x5c35c6,
        ));
    } catch {
      _0x4347aa(new Error(imageGridCropText('errors.canvasCorsBlocked')));
    }
  });
}
export async function tryCropGridTilesOnServer(_0x2a3be8, _0x286441, _0xeb0692, _0x11609b = {}) {
  const { localPath: _0x573698 } = resolveGridCropImageRef(_0x2a3be8);
  if (!_0x573698) return null;
  try {
    const _0x4630d5 = await cropGridTiles({
        localPath: _0x573698,
        cols: _0x286441,
        rows: _0xeb0692,
        ext: _0x11609b.ext || 'jpg',
        quality: _0x11609b.quality || 85,
        subDir: _0x11609b.subDir || '',
      }),
      _0x76b2c = Array.isArray(_0x4630d5?.tiles) ? _0x4630d5.tiles : [];
    if (_0x76b2c.length !== _0x286441 * _0xeb0692) return null;
    return {
      ..._0x4630d5,
      tiles: _0x76b2c.map((_0x106cc7, _0x8d26d2) =>
        normalizeGridTileResult(_0x106cc7, {
          row: Math.floor(_0x8d26d2 / _0x286441),
          col: _0x8d26d2 % _0x286441,
          w: _0x4630d5.tileWidth,
          h: _0x4630d5.tileHeight,
        }),
      ),
    };
  } catch (_0x4c4dcc) {
    return (console.warn('[GridCrop] server crop failed, falling back to browser crop:', _0x4c4dcc), null);
  }
}
async function cropGridTilesInBrowser({
  nodeData: _0x3066e2,
  cols: _0x1fcc82,
  rows: _0x3723ba,
  quality: _0x477472,
  idPrefix: _0x24b4e1,
  fileNamePrefix: _0x30c914,
  oneBasedFileName: oneBasedFileName = true,
  subDir: subDir = '',
  fallbackTile: _0x2aab03,
}) {
  const { imgUrl: _0x4abb16 } = resolveGridCropImageRef(_0x3066e2),
    _0xa2204 = await loadImageForGridCrop(
      _0x4abb16,
      _0x2aab03?.loadErrorMessage || imageGridCropText('errors.localImageLoadFailed'),
    ),
    _0x37fb95 = Math.floor(_0xa2204.naturalWidth / _0x1fcc82),
    _0x339973 = Math.floor(_0xa2204.naturalHeight / _0x3723ba),
    _0x483aba = [];
  for (let _0x19c493 = 0; _0x19c493 < _0x3723ba; _0x19c493++) {
    for (let _0x3ab509 = 0; _0x3ab509 < _0x1fcc82; _0x3ab509++) {
      const _0x5aab0c = cropLoadedImageTile({
        loadedImg: _0xa2204,
        tileW: _0x37fb95,
        tileH: _0x339973,
        col: _0x3ab509,
        row: _0x19c493,
        quality: _0x477472,
        idPrefix: _0x24b4e1,
        fileNamePrefix: _0x30c914,
        oneBasedFileName: oneBasedFileName,
        subDir: subDir,
      });
      _0x2aab03?.onError
        ? _0x483aba.push(
            _0x5aab0c.catch((_0x14c526) =>
              _0x2aab03.onError({
                err: _0x14c526,
                row: _0x19c493,
                col: _0x3ab509,
                tileW: _0x37fb95,
                tileH: _0x339973,
              }),
            ),
          )
        : _0x483aba.push(_0x5aab0c);
    }
  }
  const _0x4497cb = await Promise.all(_0x483aba);
  return {
    tiles: _0x4497cb,
    tileW: _0x37fb95,
    tileH: _0x339973,
    sourceWidth: _0xa2204.naturalWidth,
    sourceHeight: _0xa2204.naturalHeight,
  };
}
export async function executeGridCrop({ nodeData: _0x37cdff, cols: _0x4458c3, rows: _0x100946 }) {
  const { imgUrl: _0x40ce35 } = resolveGridCropImageRef(_0x37cdff);
  if (!_0x40ce35) throw new Error(imageGridCropText('errors.noImage'));
  let _0x255cb2 = null,
    _0x4a3fae = 0,
    _0x17e39e = 0;
  const _0x29408c = await tryCropGridTilesOnServer(_0x37cdff, _0x4458c3, _0x100946, {
    ext: 'jpg',
    quality: 88,
    subDir: 'Multiple grids',
  });
  _0x29408c &&
    ((_0x255cb2 = _0x29408c.tiles),
    (_0x4a3fae = toPositiveInt(_0x29408c.tileWidth, _0x255cb2[0]?.w || 0)),
    (_0x17e39e = toPositiveInt(_0x29408c.tileHeight, _0x255cb2[0]?.h || 0)));
  if (!_0x255cb2)
    try {
      const _0x44b4fb = await cropGridTilesInBrowser({
        nodeData: _0x37cdff,
        cols: _0x4458c3,
        rows: _0x100946,
        quality: 0.88,
        idPrefix: 'crop',
        fileNamePrefix: 'crop',
        oneBasedFileName: true,
        subDir: 'Multiple grids',
        fallbackTile: {
          loadErrorMessage: imageGridCropText('errors.localFileReadFailed'),
          onError: ({
            err: _0x3eb767,
            row: _0x406248,
            col: _0x1a1c58,
            tileW: _0x41e1ec,
            tileH: _0x1cbb87,
          }) => {
            return (
              console.error('[GridCrop] tile ' + _0x406248 + '-' + _0x1a1c58 + ' failed:', _0x3eb767),
              { row: _0x406248, col: _0x1a1c58, url: null, localPath: '', w: _0x41e1ec, h: _0x1cbb87 }
            );
          },
        },
      });
      ((_0x255cb2 = _0x44b4fb.tiles), (_0x4a3fae = _0x44b4fb.tileW), (_0x17e39e = _0x44b4fb.tileH));
    } catch (_0x3dc02c) {
      console.error('[GridCrop] load local image failed:', _0x40ce35, _0x3dc02c);
      throw new Error(imageGridCropText('errors.sourceMaybeRemoved'));
    }
  const { direction: _0x3308dc, spacing: _0x1c32c4, avoidOverlap: _0x1ef8ab } = getNodeSpawnPrefs(),
    _0x104890 = getStateSnapshot(),
    _0x3e66a8 = _0x104890.nodes[_0x37cdff.id];
  if (!_0x3e66a8) throw new Error(imageGridCropText('errors.sourceNodeMissing'));
  const { width: _0x57464d, height: _0x427155 } = getAutoMediaSizeByShortSide(_0x4a3fae, _0x17e39e),
    _0x257e6d = 12,
    _0x1bfa33 = _0x4458c3 * _0x57464d + (_0x4458c3 - 1) * _0x257e6d,
    _0x32f1b5 = _0x100946 * _0x427155 + (_0x100946 - 1) * _0x257e6d;
  let _0x13ea9d, _0x493b7f;
  _0x3308dc === 'right'
    ? ((_0x13ea9d = _0x3e66a8.x + (_0x3e66a8.width || 0x104) + _0x1c32c4),
      (_0x493b7f = _0x3e66a8.y + ((_0x3e66a8.height || 0x104) - _0x32f1b5) / 2))
    : ((_0x13ea9d = _0x3e66a8.x + ((_0x3e66a8.width || 0x104) - _0x1bfa33) / 2),
      (_0x493b7f = _0x3e66a8.y + (_0x3e66a8.height || 0x104) + _0x1c32c4));
  if (_0x1ef8ab) {
    const _0x53a38c = findAvailablePosition(
      _0x104890.nodes,
      _0x13ea9d,
      _0x493b7f,
      _0x1bfa33,
      _0x32f1b5,
      _0x1c32c4,
      _0x3308dc,
    );
    ((_0x13ea9d = _0x53a38c.x), (_0x493b7f = _0x53a38c.y));
  }
  const _0x13985a = [];
  return (
    _0x255cb2.forEach((_0x26aa19) => {
      const {
        row: _0x3fd420,
        col: _0x3af300,
        url: _0x120611,
        localPath: _0x2da368,
        fileName: _0x47fa2a,
      } = _0x26aa19;
      if (!_0x120611 || !_0x2da368) return;
      const _0x56392d =
          'source-image-crop-' +
          Date.now() +
          '-' +
          _0x3fd420 +
          '-' +
          _0x3af300 +
          '-' +
          Math.random().toString(36).slice(2, 6),
        _0x5712c7 = _0x13ea9d + _0x3af300 * (_0x57464d + _0x257e6d),
        _0x1a8f63 = _0x493b7f + _0x3fd420 * (_0x427155 + _0x257e6d),
        _0x185dc8 = _0x2da368.startsWith('/') ? _0x2da368.slice(1) : _0x2da368;
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: _0x56392d,
          type: 'source-image',
          x: _0x5712c7,
          y: _0x1a8f63,
          width: _0x57464d,
          height: _0x427155,
          name: imageGridCropText('output.nodeName', { row: _0x3fd420 + 1, col: _0x3af300 + 1 }),
          src: '',
          localPath: _0x185dc8,
          originalLocalPath: _0x26aa19.originalLocalPath || _0x185dc8,
          displayLocalPath: _0x26aa19.displayLocalPath || '',
          thumbLocalPath: _0x26aa19.thumbLocalPath || '',
          originalWidth: _0x26aa19.originalWidth || _0x26aa19.w || _0x4a3fae,
          originalHeight: _0x26aa19.originalHeight || _0x26aa19.h || _0x17e39e,
          fileName: _0x47fa2a || '',
          needsAutoResize: false,
        }),
      ),
        _0x13985a.push(_0x56392d));
    }),
    _0x13985a.length > 0 &&
      (appStore.setSelectedNodes(_0x13985a),
      window.v2FocusOnNodes?.([_0x3e66a8.id, ..._0x13985a]),
      window._triggerLocalCacheSave?.()),
    { newIds: _0x13985a, srcNode: _0x3e66a8 }
  );
}
export async function prepareGridCells({ nodeData: _0x40ea56, cols: _0x392920, rows: _0x2cd1b4 }) {
  const { localPath: _0x100c5c, imgUrl: _0x5e719d } = resolveGridCropImageRef(_0x40ea56);
  if (!_0x5e719d) throw new Error(imageGridCropText('errors.noImage'));
  const _0x81e18f = await tryCropGridTilesOnServer(_0x40ea56, _0x392920, _0x2cd1b4, {
    ext: 'jpg',
    quality: 85,
  });
  if (_0x81e18f)
    return _0x81e18f.tiles.map((_0x413121) => ({
      id: generateId('cell'),
      url: '',
      localPath: _0x413121.localPath,
      originalLocalPath: _0x413121.originalLocalPath || _0x413121.localPath,
      displayLocalPath: _0x413121.displayLocalPath || '',
      thumbLocalPath: _0x413121.thumbLocalPath || '',
      fileName: _0x413121.fileName || '',
      originalWidth: _0x413121.originalWidth || _0x413121.w || _0x81e18f.tileWidth,
      originalHeight: _0x413121.originalHeight || _0x413121.h || _0x81e18f.tileHeight,
      sourceLocalPath: _0x100c5c || '',
      sourceUrl: _0x100c5c ? '' : _0x5e719d,
      sourceWidth: _0x81e18f.sourceWidth || _0x81e18f.tileWidth * _0x392920,
      sourceHeight: _0x81e18f.sourceHeight || _0x81e18f.tileHeight * _0x2cd1b4,
      w: _0x413121.w || _0x81e18f.tileWidth,
      h: _0x413121.h || _0x81e18f.tileHeight,
      row: _0x413121.row,
      col: _0x413121.col,
      isEmpty: false,
    }));
  const {
    tiles: _0x2fe0c8,
    sourceWidth: _0x26c431,
    sourceHeight: _0xdebaf,
  } = await cropGridTilesInBrowser({
    nodeData: _0x40ea56,
    cols: _0x392920,
    rows: _0x2cd1b4,
    quality: 0.85,
    idPrefix: 'tile',
    fileNamePrefix: 'sb',
    oneBasedFileName: false,
    fallbackTile: { loadErrorMessage: imageGridCropText('errors.localImageLoadFailed') },
  });
  return _0x2fe0c8.map((_0x49d820) => ({
    id: generateId('cell'),
    url: '',
    localPath: _0x49d820.localPath,
    originalLocalPath: _0x49d820.originalLocalPath || _0x49d820.localPath,
    displayLocalPath: _0x49d820.displayLocalPath || '',
    thumbLocalPath: _0x49d820.thumbLocalPath || '',
    fileName: _0x49d820.fileName || '',
    originalWidth: _0x49d820.originalWidth || _0x49d820.w,
    originalHeight: _0x49d820.originalHeight || _0x49d820.h,
    sourceLocalPath: _0x100c5c || '',
    sourceUrl: _0x100c5c ? '' : _0x5e719d,
    sourceWidth: _0x26c431 || _0x392920 * _0x49d820.w,
    sourceHeight: _0xdebaf || _0x2cd1b4 * _0x49d820.h,
    w: _0x49d820.w,
    h: _0x49d820.h,
    row: _0x49d820.row,
    col: _0x49d820.col,
    isEmpty: false,
  }));
}
