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
function _looksLikeImageRef(_0x28235c) {
  if (!_0x28235c) return false;
  const _0x20140d = String(_0x28235c);
  if (_0x20140d.startsWith('data:image/')) return true;
  const _0x1b7cb5 = _0x20140d.split('#')[0].split('?')[0],
    _0x501210 = _0x1b7cb5.toLowerCase();
  if (
    _0x501210.endsWith('.mp4') ||
    _0x501210.endsWith('.webm') ||
    _0x501210.endsWith('.mov') ||
    _0x501210.endsWith('.mkv') ||
    _0x501210.endsWith('.mp3') ||
    _0x501210.endsWith('.wav') ||
    _0x501210.endsWith('.m4a') ||
    _0x501210.endsWith('.aac') ||
    _0x501210.endsWith('.ogg')
  )
    return false;
  if (
    _0x501210.endsWith('.png') ||
    _0x501210.endsWith('.jpg') ||
    _0x501210.endsWith('.jpeg') ||
    _0x501210.endsWith('.webp') ||
    _0x501210.endsWith('.gif') ||
    _0x501210.endsWith('.bmp') ||
    _0x501210.endsWith('.svg')
  )
    return true;
  return (
    _0x20140d.startsWith('http://') ||
    _0x20140d.startsWith('https://') ||
    _0x20140d.startsWith('/') ||
    _0x20140d.startsWith('aic-local-preview:') ||
    _0x20140d.startsWith('blob:')
  );
}
function _toPositiveNumber(_0x4109e2, _0x13e22d = null) {
  const _0x598f64 = Number(_0x4109e2);
  return Number.isFinite(_0x598f64) && _0x598f64 > 0 ? _0x598f64 : _0x13e22d;
}
function _getImagePayloadFromNode(_0x29671a, _0x43b867) {
  if (!_0x43b867) return null;
  let _0x4721f9 = '',
    _0x68869f = null,
    _0x2ca4ae = null,
    _0x4706fa = '',
    _0x590dfb = null,
    _0x4e9b6a = null,
    _0x11e297 = null,
    _0x4df451 = '',
    _0x5ac0f3 = null,
    _0x5e66e = null,
    _0x138d2e = null,
    _0x591a51 = null,
    _0x4b3ce9 = false,
    _0x40105a = false,
    _0x554c95 = '',
    _0x18f6f5 = null,
    _0x5c5a34 = '',
    _0x2051e4 = null,
    _0x518a6c = '';
  if (Array.isArray(_0x43b867.images) && _0x43b867.images.length > 0) {
    let _0x3df17e = typeof _0x43b867.mainImageIndex === 'number' ? _0x43b867.mainImageIndex : 0;
    if (_0x3df17e < 0 || _0x3df17e >= _0x43b867.images.length) _0x3df17e = 0;
    const _0x459f8b = _0x43b867.images[_0x3df17e] || {};
    ((_0x4b3ce9 =
      _0x459f8b.storyboardSourceCrop === true || !!_0x459f8b.sourceLocalPath || !!_0x459f8b.sourceUrl),
      (_0x40105a = _0x459f8b.storyboardExtractedCell === true || _0x43b867.storyboardExtractedCell === true));
    const _0x4f1be0 = _0x459f8b.storyboardSourceIndex ?? _0x43b867.storyboardSourceIndex,
      _0x195f44 = Number(_0x4f1be0);
    (Number.isInteger(_0x195f44) && _0x195f44 >= 0 && (_0x18f6f5 = _0x195f44),
      (_0x5c5a34 = String(_0x459f8b.storyboardSourceNodeId || _0x43b867.storyboardSourceNodeId || '').trim()),
      (_0x2051e4 = _0x459f8b.storyboardSourceLocalPath || _0x43b867.storyboardSourceLocalPath || null),
      (_0x518a6c = _0x459f8b.storyboardSourceUrl || _0x43b867.storyboardSourceUrl || ''),
      (_0x554c95 = _0x459f8b.capturePreviewUrl || _0x43b867.capturePreviewUrl || ''),
      (_0x4721f9 = _0x459f8b.imageUrl || _0x459f8b.url || _0x554c95 || ''),
      (_0x68869f = _0x459f8b.localPath || null),
      (_0x2ca4ae = _0x459f8b.thumbLocalPath || null),
      (_0x4706fa = _0x459f8b.thumbUrl || ''),
      (_0x590dfb = _0x459f8b.thumbId || null),
      (_0x4e9b6a = _0x459f8b.sourceId || null),
      (_0x138d2e = _0x459f8b.imageWidth || _0x459f8b.width || _0x43b867.imageWidth || null),
      (_0x591a51 = _0x459f8b.imageHeight || _0x459f8b.height || _0x43b867.imageHeight || null),
      _0x4b3ce9 &&
        ((_0x11e297 = _0x459f8b.sourceLocalPath || null),
        (_0x4df451 = _0x459f8b.sourceUrl || ''),
        (_0x5ac0f3 = _0x459f8b.sourceWidth || null),
        (_0x5e66e = _0x459f8b.sourceHeight || null)));
  } else {
    ((_0x4b3ce9 =
      _0x43b867.storyboardSourceCrop === true || !!_0x43b867.sourceLocalPath || !!_0x43b867.sourceUrl),
      (_0x40105a = _0x43b867.storyboardExtractedCell === true));
    const _0x1ad0e9 = Number(_0x43b867.storyboardSourceIndex);
    (Number.isInteger(_0x1ad0e9) && _0x1ad0e9 >= 0 && (_0x18f6f5 = _0x1ad0e9),
      (_0x5c5a34 = String(_0x43b867.storyboardSourceNodeId || '').trim()),
      (_0x2051e4 = _0x43b867.storyboardSourceLocalPath || null),
      (_0x518a6c = _0x43b867.storyboardSourceUrl || ''),
      (_0x554c95 =
        _0x43b867.capturePreviewUrl ||
        (String(_0x43b867.src || '').startsWith('data:image/') ? _0x43b867.src : '')),
      (_0x4721f9 = _0x43b867.imageUrl || _0x43b867.src || _0x554c95 || ''),
      (_0x68869f = _0x43b867.localPath || null),
      (_0x2ca4ae = _0x43b867.thumbLocalPath || null),
      (_0x4706fa = _0x43b867.thumbUrl || ''),
      (_0x590dfb = _0x43b867.thumbId || null),
      (_0x4e9b6a = _0x43b867.sourceId || null),
      (_0x138d2e = _0x43b867.imageWidth || null),
      (_0x591a51 = _0x43b867.imageHeight || null),
      _0x4b3ce9 &&
        ((_0x11e297 = _0x43b867.sourceLocalPath || null),
        (_0x4df451 = _0x43b867.sourceUrl || ''),
        (_0x5ac0f3 = _0x43b867.sourceWidth || null),
        (_0x5e66e = _0x43b867.sourceHeight || null)));
  }
  if (
    !_0x4721f9 &&
    !_0x68869f &&
    !_0x2ca4ae &&
    !_0x4706fa &&
    !_0x590dfb &&
    !_0x4e9b6a &&
    !_0x554c95 &&
    !_0x11e297 &&
    !_0x4df451
  )
    return null;
  if (_0x29671a(_0x43b867, 'source-image')) {
    if (_0x590dfb || _0x4e9b6a)
      return {
        url: _0x4721f9,
        localPath: _0x68869f,
        thumbLocalPath: _0x2ca4ae,
        thumbUrl: _0x4706fa,
        thumbId: _0x590dfb,
        sourceId: _0x4e9b6a,
        sourceLocalPath: _0x11e297,
        sourceUrl: _0x4df451,
        sourceWidth: _0x5ac0f3,
        sourceHeight: _0x5e66e,
        imageWidth: _0x138d2e,
        imageHeight: _0x591a51,
        storyboardSourceCrop: _0x4b3ce9,
        storyboardExtractedCell: _0x40105a,
        capturePreviewUrl: _0x554c95,
        storyboardSourceIndex: _0x18f6f5,
        storyboardSourceNodeId: _0x5c5a34,
        storyboardSourceLocalPath: _0x2051e4,
        storyboardSourceUrl: _0x518a6c,
      };
  }
  if (
    !_looksLikeImageRef(_0x4706fa) &&
    !_looksLikeImageRef(_0x2ca4ae) &&
    !_looksLikeImageRef(_0x68869f) &&
    !_looksLikeImageRef(_0x4721f9) &&
    !_looksLikeImageRef(_0x554c95) &&
    !_looksLikeImageRef(_0x11e297) &&
    !_looksLikeImageRef(_0x4df451)
  )
    return null;
  return {
    url: _0x4721f9,
    localPath: _0x68869f,
    thumbLocalPath: _0x2ca4ae,
    thumbUrl: _0x4706fa,
    thumbId: _0x590dfb,
    sourceId: _0x4e9b6a,
    sourceLocalPath: _0x11e297,
    sourceUrl: _0x4df451,
    sourceWidth: _0x5ac0f3,
    sourceHeight: _0x5e66e,
    imageWidth: _0x138d2e,
    imageHeight: _0x591a51,
    storyboardSourceCrop: _0x4b3ce9,
    storyboardExtractedCell: _0x40105a,
    capturePreviewUrl: _0x554c95,
    storyboardSourceIndex: _0x18f6f5,
    storyboardSourceNodeId: _0x5c5a34,
    storyboardSourceLocalPath: _0x2051e4,
    storyboardSourceUrl: _0x518a6c,
  };
}
function _isCellEmpty(_0x34d0c7) {
  return isStoryboardCellEmpty(_0x34d0c7);
}
function _resolveStoryboardReplayDropContext(_0x2ab89c, _0x15cbf6) {
  if (!_0x2ab89c || !_0x15cbf6) return { isReplay: false };
  const _0x1f02d9 = Number(_0x2ab89c.storyboardSourceIndex);
  if (!Number.isInteger(_0x1f02d9) || _0x1f02d9 < 0) return { isReplay: false };
  const _0xd7305d = String(_0x2ab89c.storyboardSourceNodeId || '').trim(),
    _0x2c835b =
      normalizeStoryboardImageUrl(_0x2ab89c.storyboardSourceLocalPath) ||
      normalizeStoryboardImageUrl(_0x2ab89c.storyboardSourceUrl),
    _0x48a652 = getStoryboardNodeSourceImageUrl(_0x15cbf6),
    _0x59c8f5 = !!(_0xd7305d && _0xd7305d === String(_0x15cbf6.id)),
    _0x34ec30 = !!(_0x2c835b && _0x48a652 && _0x2c835b === _0x48a652);
  if (!_0x59c8f5 && !_0x34ec30) return { isReplay: false };
  const _0x2840ec = getStoryboardNodeSourceContext(_0x15cbf6);
  return {
    isReplay: true,
    sourceIndex: _0x1f02d9,
    sourceLocalPath: _0x2840ec.sourceLocalPath,
    sourceUrl: _0x2840ec.sourceUrl,
    sourceWidth: Number(_0x15cbf6.storyboardSourceWidth || _0x15cbf6.sourceWidth) || null,
    sourceHeight: Number(_0x15cbf6.storyboardSourceHeight || _0x15cbf6.sourceHeight) || null,
  };
}
function _getStoryboardCellInfoAt(_0x718c7c, _0x37f23a, _0x3c915f, _0x3bec95 = {}) {
  for (const _0x1733ad of Object.values(_0x3c915f)) {
    if (_0x1733ad.type !== 'storyboard') continue;
    let _0x3d26f2 = getStoryboardCellIndexAtWorldPoint(_0x1733ad, _0x718c7c, _0x37f23a);
    _0x3d26f2 < 0 &&
      _0x3bec95.nearestInGap === true &&
      (_0x3d26f2 = getStoryboardNearestCellIndexAtWorldPoint(_0x1733ad, _0x718c7c, _0x37f23a));
    if (_0x3d26f2 >= 0) return { nodeId: _0x1733ad.id, cellIndex: _0x3d26f2 };
  }
  return null;
}
function _getLastHoveredStoryboardCellInfo(_0xb528f4, _0x499dac, _0x476673, _0x14ea24) {
  const _0x8e6e7b = _0xb528f4?.lastHoverNodeId || null,
    _0x5bd991 = Number(_0xb528f4?.lastHoverCellIndex);
  if (!_0x8e6e7b || !Number.isInteger(_0x5bd991) || _0x5bd991 < 0) return null;
  if (_0xb528f4?.lastHoverKind && _0xb528f4.lastHoverKind !== 'storyboard') return null;
  const _0x250927 = _0x14ea24?.[_0x8e6e7b];
  if (!_0x250927 || _0x250927.type !== 'storyboard') return null;
  const _0x398286 = getStoryboardCellMetrics(_0x250927),
    _0x553496 = _0x398286.cols * _0x398286.rows;
  if (_0x5bd991 >= _0x553496) return null;
  const _0x2bd2de = Number(_0x250927.x) || 0,
    _0x4dfd1e = Number(_0x250927.y) || 0,
    _0x4f6fb5 = Math.max(8, Math.min(40, (Number(_0x250927.gridGap) || 0) / 2 + 8));
  if (
    _0x499dac < _0x2bd2de - _0x4f6fb5 ||
    _0x499dac > _0x2bd2de + _0x398286.width + _0x4f6fb5 ||
    _0x476673 < _0x4dfd1e - _0x4f6fb5 ||
    _0x476673 > _0x4dfd1e + _0x398286.height + _0x4f6fb5
  )
    return null;
  return { nodeId: _0x8e6e7b, cellIndex: _0x5bd991 };
}
function _getCollageSlotInfoAt(_0x3b6300, _0x587435, _0x3ea714) {
  for (const _0x59aa51 of Object.values(_0x3ea714)) {
    if (_0x59aa51.type !== 'collage') continue;
    const _0x15f7f6 = getCollageItemIndexAtWorldPoint(_0x59aa51, _0x3b6300, _0x587435);
    if (_0x15f7f6 >= 0) return { nodeId: _0x59aa51.id, itemIndex: _0x15f7f6 };
  }
  return null;
}
function _getCollageItemFrameInfo(_0x8f3f9f, _0x539d3d) {
  return resolveCollageItemFrames(_0x8f3f9f).find((_0xb50926) => _0xb50926.index === _0x539d3d) || null;
}
function _getCollageItemCenterWorldPoint(_0x58d345, _0x339469) {
  const _0x3b5353 = _getCollageItemFrameInfo(_0x58d345, _0x339469),
    _0x36b485 = _0x3b5353?.frame;
  if (!_0x36b485)
    return {
      x: (Number(_0x58d345?.x) || 0) + (Number(_0x58d345?.width) || 1) / 2,
      y: (Number(_0x58d345?.y) || 0) + (Number(_0x58d345?.height) || 1) / 2,
    };
  return {
    x: (Number(_0x58d345?.x) || 0) + _0x36b485.x + _0x36b485.width / 2,
    y: (Number(_0x58d345?.y) || 0) + _0x36b485.y + _0x36b485.height / 2,
  };
}
function _clearStoryboardHighlight(_0x26d542) {
  if (!_0x26d542) return;
  const _0x341514 = window.v2Renderer?.nodeInstances?.get(_0x26d542);
  if (_0x341514 && typeof _0x341514.highlightCell === 'function') _0x341514.highlightCell(-1);
}
function _clearDropSlotHighlight(_0x5e6c3d) {
  if (!_0x5e6c3d) return;
  const _0x226cc0 = window.v2Renderer?.nodeInstances?.get(_0x5e6c3d);
  if (_0x226cc0 && typeof _0x226cc0.highlightCell === 'function') _0x226cc0.highlightCell(-1);
  if (_0x226cc0 && typeof _0x226cc0.highlightSlot === 'function') _0x226cc0.highlightSlot(-1);
}
function _highlightDropSlot(_0x23223f, _0x4898b4, _0x3d8a7a) {
  if (!_0x23223f) return;
  const _0x8a9163 = window.v2Renderer?.nodeInstances?.get(_0x23223f);
  if (_0x4898b4 === 'storyboard' && _0x8a9163 && typeof _0x8a9163.highlightCell === 'function')
    _0x8a9163.highlightCell(_0x3d8a7a);
  else
    _0x4898b4 === 'collage' &&
      _0x8a9163 &&
      typeof _0x8a9163.highlightSlot === 'function' &&
      _0x8a9163.highlightSlot(_0x3d8a7a);
}
function _worldToScreen(_0x40fe90, _0x2c414f, _0x73656) {
  const { x: _0x51077b, y: _0x584a97, zoom: _0x1fe46b } = _0x73656;
  return { x: _0x40fe90 * _0x1fe46b + _0x51077b, y: _0x2c414f * _0x1fe46b + _0x584a97 };
}
function _getStoryboardCellCenterWorldPoint(_0x2061d9, _0x236306) {
  const _0x57cbbf = getStoryboardCellMetrics(_0x2061d9),
    _0x572527 = getStoryboardCellPixelBounds(_0x2061d9, _0x236306);
  if (_0x572527)
    return {
      x: (Number(_0x2061d9?.x) || 0) + _0x572527.x0 + _0x572527.width / 2,
      y: (Number(_0x2061d9?.y) || 0) + _0x572527.y0 + _0x572527.height / 2,
    };
  const _0x7545e3 = _0x236306 % _0x57cbbf.cols,
    _0x58511b = Math.floor(_0x236306 / _0x57cbbf.cols);
  return {
    x:
      (Number(_0x2061d9?.x) || 0) +
      _0x57cbbf.inset +
      _0x7545e3 * (_0x57cbbf.cellWidth + _0x57cbbf.gap) +
      _0x57cbbf.cellWidth / 2,
    y:
      (Number(_0x2061d9?.y) || 0) +
      _0x57cbbf.inset +
      _0x58511b * (_0x57cbbf.cellHeight + _0x57cbbf.gap) +
      _0x57cbbf.cellHeight / 2,
  };
}
function _canvasToJpegBlob(_0x3870ab) {
  if (!_0x3870ab || typeof _0x3870ab.toBlob !== 'function') return Promise.resolve(null);
  return new Promise((_0x50f01e) => _0x3870ab.toBlob(_0x50f01e, 'image/jpeg', 0.9));
}
function _buildExtractNodeCropPatch(_0x23dd94) {
  if (!_0x23dd94?.dataUrl) return null;
  return {
    src: '',
    capturePreviewUrl: _0x23dd94.dataUrl,
    localPath: '',
    fileName: _0x23dd94.fileName,
    originalWidth: _0x23dd94.width,
    originalHeight: _0x23dd94.height,
    imageWidth: _0x23dd94.width,
    imageHeight: _0x23dd94.height,
    needsAutoResize: false,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardExtractedCell: true,
  };
}
async function _saveStoryboardDataImageSnapshot(_0x984f43, _0x4f4118, _0x4347da) {
  const _0x380055 = trimStoryboardImageRef(_0x984f43?.capturePreviewUrl);
  if (!isDataImageRef(_0x380055)) return null;
  const _0x5b1896 = dataImageUrlToBlob(_0x380055);
  if (!_0x5b1896) return null;
  const _0x4ea817 = getDataImageExtension(_0x380055),
    _0x40f1e7 = _0x4f4118 || _0x984f43?.fileName || 'storyboard_extract.' + _0x4ea817,
    _0x3eac8d =
      typeof File === 'function'
        ? new File([_0x5b1896], _0x40f1e7, {
            type: _0x5b1896.type || 'image/' + (_0x4ea817 === 'jpg' ? 'jpeg' : _0x4ea817),
          })
        : _0x5b1896,
    _0x3da1e6 = await _0x4347da(_0x3eac8d, { ext: _0x4ea817 }),
    _0xe862b6 = pickResultLocalPath(_0x3da1e6),
    _0x37af4a = String(_0x3da1e6?.url || '').trim() || localPathToUrl(_0xe862b6);
  if (!_0x37af4a || !_0xe862b6) return null;
  return { saved: _0x3da1e6, localPath: _0xe862b6, src: _0x37af4a };
}
function _buildPersistedStoryboardImagePatch(_0x145629, _0x140c39) {
  const _0x49d517 = _0x140c39?.saved || {},
    _0x3d0a5e = _0x140c39?.localPath || '',
    _0x363b3a = _0x140c39?.src || localPathToUrl(_0x3d0a5e),
    _0x38c438 = _toPositiveNumber(_0x49d517.originalWidth) || _toPositiveNumber(_0x145629?.width) || null,
    _0x28868c = _toPositiveNumber(_0x49d517.originalHeight) || _toPositiveNumber(_0x145629?.height) || null;
  return {
    src: _0x363b3a,
    url: '',
    localPath: _0x3d0a5e,
    originalLocalPath: normalizeLocalPath(_0x49d517.originalLocalPath || _0x3d0a5e),
    displayLocalPath: normalizeLocalPath(_0x49d517.displayLocalPath),
    thumbLocalPath: normalizeLocalPath(_0x49d517.thumbLocalPath),
    capturePreviewUrl: '',
    fileName: _0x49d517.filename || _0x145629?.fileName || '',
    originalWidth: _0x38c438,
    originalHeight: _0x28868c,
    imageWidth: _0x38c438,
    imageHeight: _0x28868c,
  };
}
async function _persistStoryboardSnapshotPreviewToNode(
  _0x53d058,
  _0x40d02e,
  _0x1ed89d,
  _0xa1528,
  _0x2f593e = saveOutputBlob,
) {
  if (!isDataImageRef(_0x1ed89d?.capturePreviewUrl)) return;
  try {
    const _0x5a8ba0 = await _saveStoryboardDataImageSnapshot(_0x1ed89d, _0xa1528, _0x2f593e);
    if (!_0x5a8ba0) return;
    if (!_0x53d058.getStateRaw().nodes?.[_0x40d02e]) return;
    _0x53d058.updateNodeData(_0x40d02e, _buildPersistedStoryboardImagePatch(_0x1ed89d, _0x5a8ba0));
  } catch (_0x321e26) {
    console.warn('[DragController] 分镜临时预览落盘失败:', _0x321e26);
  }
}
async function _persistStoryboardSnapshotPreviewToCell(
  _0x32ebfc,
  _0x1954d0,
  _0x20fe6d,
  _0x23ff13,
  _0x558591,
  _0x3f4fc3,
  _0x2fc81d = saveOutputBlob,
) {
  const _0x5559b9 = trimStoryboardImageRef(_0x558591?.capturePreviewUrl);
  if (!isDataImageRef(_0x5559b9)) return;
  try {
    const _0x2ab80f = await _saveStoryboardDataImageSnapshot(_0x558591, _0x3f4fc3, _0x2fc81d);
    if (!_0x2ab80f) return;
    const _0x3d63a2 = _0x32ebfc.getStateRaw().nodes?.[_0x1954d0],
      _0x1708fa = Array.isArray(_0x3d63a2?.cells) ? _0x3d63a2.cells : [],
      _0x128ce2 = _0x1708fa[_0x20fe6d];
    if (!_0x128ce2 || _isCellEmpty(_0x128ce2)) return;
    if (_0x23ff13 && String(_0x128ce2.id || '') !== String(_0x23ff13)) return;
    if (trimStoryboardImageRef(_0x128ce2.capturePreviewUrl) !== _0x5559b9) return;
    const _0x1f03d2 = [..._0x1708fa];
    ((_0x1f03d2[_0x20fe6d] = {
      ..._0x128ce2,
      ..._buildPersistedStoryboardImagePatch(_0x558591, _0x2ab80f),
      sourceLocalPath: null,
      sourceUrl: '',
      sourceWidth: null,
      sourceHeight: null,
      storyboardSourceCrop: false,
      storyboardPiece: false,
      isEmpty: false,
    }),
      _0x32ebfc.updateNodeData(_0x1954d0, { cells: _0x1f03d2 }));
  } catch (_0x482f6c) {
    console.warn('[DragController] 分镜宫格临时预览落盘失败:', _0x482f6c);
  }
}
async function _persistStoryboardSourceCropExtract(
  _0x481a18,
  _0x47805d,
  _0x12a607,
  _0x187165 = saveOutputBlob,
) {
  if (typeof window === 'undefined') return;
  if (!_0x12a607?.canvas || !_0x12a607.dataUrl || !_0x47805d) return;
  try {
    const _0x50eba2 = await _canvasToJpegBlob(_0x12a607.canvas);
    if (!_0x50eba2) return;
    const _0x316d2c =
        typeof File === 'function'
          ? new File([_0x50eba2], _0x12a607.fileName, { type: 'image/jpeg' })
          : _0x50eba2,
      _0x1be2d8 = await _0x187165(_0x316d2c, { ext: 'jpg' }),
      _0x2a0b97 = pickResultLocalPath(_0x1be2d8),
      _0x46dcbb = String(_0x1be2d8?.url || '').trim() || localPathToUrl(_0x2a0b97);
    if (!_0x46dcbb || !_0x2a0b97) return;
    if (!_0x481a18.getStateRaw().nodes?.[_0x47805d]) return;
    _0x481a18.updateNodeData(_0x47805d, {
      src: _0x46dcbb,
      localPath: _0x2a0b97,
      originalLocalPath: normalizeLocalPath(_0x1be2d8?.originalLocalPath || _0x2a0b97),
      displayLocalPath: normalizeLocalPath(_0x1be2d8?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(_0x1be2d8?.thumbLocalPath),
      fileName: _0x1be2d8?.filename || _0x12a607.fileName,
      originalWidth: Number(_0x1be2d8?.originalWidth || _0x12a607.width) || _0x12a607.width,
      originalHeight: Number(_0x1be2d8?.originalHeight || _0x12a607.height) || _0x12a607.height,
      imageWidth: _0x12a607.width,
      imageHeight: _0x12a607.height,
      needsAutoResize: false,
    });
  } catch (_0x2ea212) {
    console.warn('[DragController] 保存自定义分镜提取结果失败:', _0x2ea212);
  }
}
function _refreshStoryboardSourceCropExtractInBackground(
  _0x39df6f,
  _0x51cc6b,
  _0x5ce6f4,
  _0x273dd1,
  _0x163b45,
  _0x5c3d88,
) {
  const _0x26dadf = getStoryboardPieceSourceImageUrl(_0x163b45, _0x5ce6f4);
  if (!_0x26dadf || !_0x51cc6b) return;
  const _0x41c1d1 = {
    cols: _0x5ce6f4?.cols,
    rows: _0x5ce6f4?.rows,
    width: _0x5ce6f4?.width,
    height: _0x5ce6f4?.height,
    gridGap: _0x5ce6f4?.gridGap,
    gridLayout: _0x5ce6f4?.gridLayout,
  };
  loadStoryboardSourceImage(_0x26dadf)
    .then((_0x5b9ff8) => {
      if (!_0x5b9ff8 || !_0x39df6f.getStateRaw().nodes?.[_0x51cc6b]) return;
      const _0x55a2e3 = resolveStoryboardCellSourceIndex(_0x163b45, _0x273dd1, _0x5ce6f4),
        _0x4f6d10 = buildStoryboardSourceCropExtractFromImage(
          _0x41c1d1,
          _0x273dd1,
          _0x5b9ff8,
          _0x5c3d88,
          _0x55a2e3,
        ),
        _0x6e10f1 = _buildExtractNodeCropPatch(_0x4f6d10);
      if (!_0x6e10f1 || !_0x39df6f.getStateRaw().nodes?.[_0x51cc6b]) return;
      (_0x39df6f.updateNodeData(_0x51cc6b, _0x6e10f1),
        _persistStoryboardSourceCropExtract(_0x39df6f, _0x51cc6b, _0x4f6d10));
    })
    .catch((_0x1039b0) => {
      console.warn('[DragController] 异步刷新自定义分镜提取预览失败:', _0x1039b0);
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
function _resolveDragSnapNodeRect(_0x16cebf) {
  if (!_0x16cebf || typeof _0x16cebf !== 'object') return null;
  return { x: _0x16cebf.x, y: _0x16cebf.y, width: _0x16cebf.width || 200, height: _0x16cebf.height || 200 };
}
function _getDragSnapSpatialIndex(_0x46f27c) {
  const _0x2f8062 = _0x46f27c?.nodes;
  if (!_0x2f8062 || typeof _0x2f8062 !== 'object') return null;
  const _0x35fbbd = Number.isFinite(_0x46f27c?._persistRev) ? _0x46f27c._persistRev : -1;
  if (_dragSnapSpatialIndexCache.nodes === _0x2f8062 && _dragSnapSpatialIndexCache.persistRev === _0x35fbbd)
    return _dragSnapSpatialIndexCache.index;
  const _0x510c26 = createNodeSpatialIndex(_0x2f8062, { resolveRect: _resolveDragSnapNodeRect });
  return (
    (_dragSnapSpatialIndexCache.nodes = _0x2f8062),
    (_dragSnapSpatialIndexCache.persistRev = _0x35fbbd),
    (_dragSnapSpatialIndexCache.index = _0x510c26),
    _0x510c26
  );
}
function _shouldUseDragSnapGuides(_0x5f19da, _0x374f2c) {
  if (_0x5f19da?.ui?.snapGuidesEnabled === false || _0x374f2c) return false;
  const _0x2a705f = Number.isFinite(_0x5f19da?._nodeCount)
    ? _0x5f19da._nodeCount
    : Object.keys(_0x5f19da?.nodes || {}).length;
  return _0x2a705f <= DRAG_SNAP_GUIDE_NODE_LIMIT;
}
function _collectAffectedEdgesForTargets(_0x57e591, _0x5edbbd) {
  const _0x532abd = window.v2Renderer;
  if (_0x532abd && typeof _0x532abd.getEdgeIdsForNode === 'function') {
    const _0x4b33ac = new Set();
    for (const _0x438e7a of _0x57e591 || []) {
      const _0x4abbba = _0x532abd.getEdgeIdsForNode(_0x438e7a);
      if (!Array.isArray(_0x4abbba) || _0x4abbba.length === 0) continue;
      for (const _0x4e8f67 of _0x4abbba) _0x4b33ac.add(_0x4e8f67);
    }
    return Array.from(_0x4b33ac)
      .map((_0x16a625) => _0x5edbbd?.[_0x16a625])
      .filter(Boolean);
  }
  const _0x22b989 = _0x57e591 instanceof Set ? _0x57e591 : new Set(_0x57e591 || []);
  return Object.values(_0x5edbbd || {}).filter(
    (_0x51bcc1) => _0x22b989.has(_0x51bcc1?.sourceId) || _0x22b989.has(_0x51bcc1?.targetId),
  );
}
function _flushStoryboardNodesNow(..._0x5019b8) {
  const _0x1f348d = typeof window !== 'undefined' ? window.v2Renderer : null;
  if (!_0x1f348d || typeof _0x1f348d.flushNodes !== 'function') return false;
  return _0x1f348d.flushNodes(Array.from(new Set(_0x5019b8.filter(Boolean))));
}
function _applyImmediateCellSwapPreview(_0x35f2a1, _0x5f2eca, _0x59470d) {
  const _0x2ea5f7 = typeof window !== 'undefined' ? window.v2Renderer : null,
    _0x13f097 = _0x2ea5f7?.nodeInstances?.get?.(_0x35f2a1);
  if (!_0x13f097 || typeof _0x13f097.applyImmediateCellSwap !== 'function') return { ok: false, revert() {} };
  const _0xb28caf = _0x13f097.applyImmediateCellSwap(_0x5f2eca, _0x59470d);
  if (!_0xb28caf || _0xb28caf.ok !== true || typeof _0xb28caf.revert !== 'function')
    return { ok: false, revert() {} };
  return _0xb28caf;
}
function _getDragEdgeScheduler(_0xeecb67) {
  return (
    !_0xeecb67._dragEdgeScheduler &&
      (_0xeecb67._dragEdgeScheduler = {
        rafId: 0,
        pendingPayload: null,
        lastPayload: null,
        lastPaintDx: null,
        lastPaintDy: null,
        liteClassActive: false,
        transformedEdgeIds: new Set(),
      }),
    _0xeecb67._dragEdgeScheduler
  );
}
function _setEdgeInteractionLiteClass(_0x53217b, _0x214785) {
  if (!_0x53217b || _0x53217b.liteClassActive === _0x214785) return;
  const _0x12f848 = typeof document !== 'undefined' ? document.body : null;
  if (!_0x12f848 || !_0x12f848.classList) {
    _0x53217b.liteClassActive = _0x214785;
    return;
  }
  (_0x12f848.classList.toggle(EDGE_INTERACTION_LITE_CLASS, _0x214785),
    (_0x53217b.liteClassActive = _0x214785));
}
function _getRafFns() {
  const _0x3f37ea =
      (typeof requestAnimationFrame === 'function' && requestAnimationFrame) ||
      (typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function' &&
        window.requestAnimationFrame.bind(window)),
    _0x557025 =
      (typeof cancelAnimationFrame === 'function' && cancelAnimationFrame) ||
      (typeof window !== 'undefined' &&
        typeof window.cancelAnimationFrame === 'function' &&
        window.cancelAnimationFrame.bind(window));
  return {
    raf: _0x3f37ea || ((_0x4ea22d) => setTimeout(_0x4ea22d, 0)),
    cancel: _0x557025 || ((_0x242193) => clearTimeout(_0x242193)),
  };
}
function _isDraggedEdgeVisible(_0x256d4f, _0x43dd2b, _0x443813, _0x230003, _0x1c19f9) {
  const _0x4396cf =
      typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 0,
    _0x3aaddd = typeof window !== 'undefined' && Number.isFinite(window.innerHeight) ? window.innerHeight : 0,
    _0xdc3db8 = 200,
    { x: _0xe3aea, y: _0x3573e0, zoom: _0x50fff4 } = _0x1c19f9,
    _0x439617 = _0x256d4f * _0x50fff4 + _0xe3aea,
    _0x1798b9 = _0x43dd2b * _0x50fff4 + _0x3573e0,
    _0x2bf959 = _0x443813 * _0x50fff4 + _0xe3aea,
    _0x21a18d = _0x230003 * _0x50fff4 + _0x3573e0,
    _0xe8e232 = Math.min(_0x439617, _0x2bf959),
    _0x416c83 = Math.min(_0x1798b9, _0x21a18d),
    _0x207f67 = Math.max(_0x439617, _0x2bf959),
    _0x5ced6b = Math.max(_0x1798b9, _0x21a18d);
  return (
    _0x207f67 > -_0xdc3db8 &&
    _0xe8e232 < _0x4396cf + _0xdc3db8 &&
    _0x5ced6b > -_0xdc3db8 &&
    _0x416c83 < _0x3aaddd + _0xdc3db8
  );
}
function _formatEdgeTranslate(_0x1a9e11, _0xabcbd1) {
  return 'translate(' + (Number(_0x1a9e11) || 0) + ' ' + (Number(_0xabcbd1) || 0) + ')';
}
function _collectDraggedEdgeUpdates(_0x3e3477) {
  const {
      affectedEdges: _0x57a0f6,
      edgeDomCache: _0x3245bb,
      nodes: _0x471327,
      targetSet: _0x9be58f,
      viewport: _0x332dac,
      pendingDx: _0x4e4dd3,
      pendingDy: _0x1d1419,
      useEdgeGroupTransform: useEdgeGroupTransform = false,
    } = _0x3e3477,
    _0x2c58d4 = [],
    _0x36191e = [];
  return (
    _0x57a0f6.forEach((_0x21d3d5) => {
      const _0x4b2743 = _0x3245bb.get(_0x21d3d5.id);
      if (!_0x4b2743) return;
      const _0xaaea47 = _0x21d3d5.sourceId,
        _0x2583b0 = _0x21d3d5.targetId,
        _0x218354 = _0x471327[_0xaaea47],
        _0x19fef0 = _0x471327[_0x2583b0];
      if (!_0x218354 || !_0x19fef0) return;
      const _0x49aa26 = _0x9be58f.has(_0xaaea47),
        _0x2e07bf = _0x9be58f.has(_0x2583b0),
        _0x10bd24 = _0x49aa26 ? _0x218354.x + _0x4e4dd3 : _0x218354.x,
        _0x4db51a = _0x49aa26 ? _0x218354.y + _0x1d1419 : _0x218354.y,
        _0x5d723c = _0x2e07bf ? _0x19fef0.x + _0x4e4dd3 : _0x19fef0.x,
        _0xd26fc0 = _0x2e07bf ? _0x19fef0.y + _0x1d1419 : _0x19fef0.y,
        _0x2e1566 = _0x10bd24 + (_0x218354.width || 0x104),
        _0x595372 = _0x4db51a + (_0x218354.height || 100) / 2,
        _0x3d8f7c = _0x5d723c,
        _0x333f84 = _0xd26fc0 + (_0x19fef0.height || 100) / 2;
      if (!_isDraggedEdgeVisible(_0x2e1566, _0x595372, _0x3d8f7c, _0x333f84, _0x332dac)) return;
      if (useEdgeGroupTransform && _0x49aa26 && _0x2e07bf) {
        _0x36191e.push({
          edgeId: _0x21d3d5.id,
          domCache: _0x4b2743,
          transform: _formatEdgeTranslate(_0x4e4dd3, _0x1d1419),
        });
        return;
      }
      const _0x253848 = Math.abs(_0x3d8f7c - _0x2e1566),
        _0x4a712e = Math.max(_0x253848 * 0.5, 60),
        _0x2016eb =
          'M ' +
          _0x2e1566 +
          ' ' +
          _0x595372 +
          ' C ' +
          (_0x2e1566 + _0x4a712e) +
          ' ' +
          _0x595372 +
          ', ' +
          (_0x3d8f7c - _0x4a712e) +
          ' ' +
          _0x333f84 +
          ', ' +
          _0x3d8f7c +
          ' ' +
          _0x333f84;
      _0x2c58d4.push({ domCache: _0x4b2743, d: _0x2016eb });
    }),
    { pathsToUpdate: _0x2c58d4, transformsToUpdate: _0x36191e }
  );
}
function _applyDraggedEdgePathUpdates(_0x5722a0, { mainOnly: mainOnly = false } = {}) {
  for (const _0x3370dd of _0x5722a0) {
    if (!mainOnly) _0x3370dd.domCache.hoverPath?.setAttribute?.('d', _0x3370dd.d);
    _0x3370dd.domCache.pathEl?.setAttribute?.('d', _0x3370dd.d);
  }
}
function _applyDraggedEdgeTransformUpdates(_0x1b6042, _0x45b5a7 = null) {
  for (const _0x2e985a of _0x1b6042) {
    if (!_0x2e985a?.domCache?.groupEl) continue;
    _0x2e985a.transform
      ? (_0x2e985a.domCache.groupEl.setAttribute?.('transform', _0x2e985a.transform),
        _0x45b5a7?.transformedEdgeIds?.add?.(_0x2e985a.edgeId))
      : (_0x2e985a.domCache.groupEl.removeAttribute?.('transform'),
        _0x45b5a7?.transformedEdgeIds?.delete?.(_0x2e985a.edgeId));
  }
}
function _clearDragEdgeTransformPreview(_0x1e61a6) {
  const _0x846b54 = _0x1e61a6?._dragEdgeScheduler;
  if (!_0x846b54?.transformedEdgeIds?.size) return;
  const _0x5d4833 = typeof window !== 'undefined' ? window._edgeDomCache : null;
  if (!_0x5d4833 || typeof _0x5d4833.get !== 'function') {
    _0x846b54.transformedEdgeIds.clear();
    return;
  }
  for (const _0x4a3266 of _0x846b54.transformedEdgeIds) {
    _0x5d4833.get(_0x4a3266)?.groupEl?.removeAttribute?.('transform');
  }
  _0x846b54.transformedEdgeIds.clear();
}
function _paintDraggedEdges(_0xeaadcb, _0x238800, { force: force = false, mainOnly: mainOnly = false } = {}) {
  const _0x379aa1 = Number(_0xeaadcb?.viewport?.zoom) || 1;
  if (!force && _0x238800) {
    const _0x188037 = _0x238800.lastPaintDx,
      _0x207830 = _0x238800.lastPaintDy;
    if (Number.isFinite(_0x188037) && Number.isFinite(_0x207830)) {
      const _0x4d80c0 = Math.abs((_0xeaadcb.pendingDx - _0x188037) * _0x379aa1),
        _0x44c938 = Math.abs((_0xeaadcb.pendingDy - _0x207830) * _0x379aa1);
      if (_0x4d80c0 < DRAG_EDGE_SCREEN_EPSILON_PX && _0x44c938 < DRAG_EDGE_SCREEN_EPSILON_PX) return false;
    }
  }
  const _0x517089 = isPerfProbeEnabled(),
    _0x72fefb =
      _0x517089 && typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : 0,
    { pathsToUpdate: _0x2b6644, transformsToUpdate: _0x5441d8 } = _collectDraggedEdgeUpdates(_0xeaadcb);
  (_applyDraggedEdgeTransformUpdates(_0x5441d8, _0x238800),
    _applyDraggedEdgePathUpdates(_0x2b6644, { mainOnly: mainOnly }));
  if (_0x517089) {
    const _0x535d9f =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now(),
      _0x2220b9 = Array.isArray(_0xeaadcb?.affectedEdges) ? _0xeaadcb.affectedEdges.length : 0,
      _0x161d13 = _0x2b6644.length + _0x5441d8.length;
    recordEdgeRedrawSample('partial', _0x535d9f - _0x72fefb, {
      reason: 'drag-controller',
      edgeCount: _0x2220b9,
      visibleEdgeCount: _0x161d13,
      updatedCount: _0x161d13,
      createdCount: 0,
      removedCount: 0,
      reusedCount: _0x161d13,
      skippedInvisibleCount: Math.max(0, _0x2220b9 - _0x161d13),
      cacheSize: Number.isFinite(_0xeaadcb?.edgeDomCache?.size) ? _0xeaadcb.edgeDomCache.size : 0,
    });
  }
  return (
    _0x238800 &&
      ((_0x238800.lastPaintDx = _0xeaadcb.pendingDx),
      (_0x238800.lastPaintDy = _0xeaadcb.pendingDy),
      (_0x238800.lastPayload = _0xeaadcb)),
    true
  );
}
function _flushDragEdgeScheduler(_0x146f5b) {
  const _0x3ac50d = _0x146f5b?._dragEdgeScheduler;
  if (!_0x3ac50d) return;
  const _0x42a0e2 = _0x3ac50d.pendingPayload || _0x3ac50d.lastPayload;
  ((_0x3ac50d.pendingPayload = null), (_0x3ac50d.lastPayload = null));
  if (_0x3ac50d.rafId) {
    const { cancel: _0x33bb04 } = _getRafFns();
    (_0x33bb04(_0x3ac50d.rafId), (_0x3ac50d.rafId = 0));
  }
  (_0x42a0e2 && _paintDraggedEdges(_0x42a0e2, _0x3ac50d, { force: true }),
    (_0x3ac50d.lastPaintDx = null),
    (_0x3ac50d.lastPaintDy = null),
    _setEdgeInteractionLiteClass(_0x3ac50d, false));
}
function _scheduleDraggedEdges(_0x153820, _0x5154c7) {
  const _0x26eae9 = _getDragEdgeScheduler(_0x153820);
  ((_0x26eae9.pendingPayload = _0x5154c7),
    (_0x26eae9.lastPayload = _0x5154c7),
    _setEdgeInteractionLiteClass(_0x26eae9, true));
  if (_0x26eae9.rafId) return;
  const { raf: _0x367bf1 } = _getRafFns();
  _0x26eae9.rafId = _0x367bf1(() => {
    _0x26eae9.rafId = 0;
    const _0x5188bf = _0x26eae9.pendingPayload;
    ((_0x26eae9.pendingPayload = null),
      _0x5188bf && _paintDraggedEdges(_0x5188bf, _0x26eae9, { mainOnly: true }));
  });
}
function _updateDraggedEdges(_0x21b4aa, _0x92f2e9) {
  const _0x34e7e9 = _getDragEdgeScheduler(_0x21b4aa),
    _0x3f9b36 = Number(_0x92f2e9?.viewport?.zoom) || 1,
    _0x3aa880 = Number.isFinite(_0x92f2e9?.edgeCount) ? _0x92f2e9.edgeCount : 0,
    _0x18bec8 = Math.max(_0x3aa880, _0x92f2e9.affectedEdges.length),
    _0x4bba0c =
      _0x3f9b36 >= HEAVY_EDGE_DRAG_MIN_ZOOM &&
      _0x3f9b36 <= HEAVY_EDGE_DRAG_MAX_ZOOM &&
      _0x18bec8 >= HEAVY_EDGE_DRAG_MIN_EDGES &&
      _0x92f2e9.edgeDomCache &&
      _0x92f2e9.edgeDomCache.size > 0;
  if (!_0x4bba0c) {
    (_0x34e7e9.pendingPayload || _0x34e7e9.rafId) && _flushDragEdgeScheduler(_0x21b4aa);
    ((_0x34e7e9.lastPaintDx = null),
      (_0x34e7e9.lastPaintDy = null),
      _setEdgeInteractionLiteClass(_0x34e7e9, false),
      _paintDraggedEdges(_0x92f2e9, _0x34e7e9, { force: true }));
    return;
  }
  if (_0x3aa880 >= HEAVY_EDGE_DRAG_SUPPRESS_LIVE_PAINT_EDGES) {
    ((_0x34e7e9.pendingPayload = _0x92f2e9),
      (_0x34e7e9.lastPayload = _0x92f2e9),
      _setEdgeInteractionLiteClass(_0x34e7e9, true));
    return;
  }
  _scheduleDraggedEdges(_0x21b4aa, _0x92f2e9);
}
function _getNodeWrapperEl(_0x264861) {
  if (!_0x264861) return null;
  if (typeof window === 'undefined') return null;
  return window.v2Renderer?.getMountedWrapper?.(_0x264861) || null;
}
function _syncNodeDragPreview(_0x3bd9c5, _0x10a3f3) {
  if (!_0x3bd9c5) return;
  const _0x23454a = window.v2Renderer?.nodeInstances?.get?.(_0x3bd9c5);
  _0x23454a && typeof _0x23454a.syncDragPreview === 'function' && _0x23454a.syncDragPreview(_0x10a3f3);
}
function _getMultiSelectBoxEl() {
  if (_cachedMultiSelectBoxEl && _cachedMultiSelectBoxEl.isConnected) return _cachedMultiSelectBoxEl;
  return (
    (_cachedMultiSelectBoxEl = document.getElementById('v2-multi-select-box')),
    _cachedMultiSelectBoxEl
  );
}
function _collectDragTargetIds(_0x2ca90d, _0x3a60ec) {
  const _0x18b960 = new Set(_0x3a60ec || []),
    _0x53cb1a = _0x2ca90d._parentToChildren || {},
    _0x512800 = Array.from(_0x18b960);
  while (_0x512800.length > 0) {
    const _0x3f5e61 = _0x512800.pop(),
      _0x1c094d = _0x53cb1a[_0x3f5e61];
    if (_0x1c094d && typeof _0x1c094d[Symbol.iterator] === 'function') {
      for (const _0x343b9b of _0x1c094d) {
        !_0x18b960.has(_0x343b9b) && (_0x18b960.add(_0x343b9b), _0x512800.push(_0x343b9b));
      }
      continue;
    }
    for (const _0x33712f of Object.values(_0x2ca90d.nodes || {})) {
      _0x33712f?.parentId === _0x3f5e61 &&
        !_0x18b960.has(_0x33712f.id) &&
        (_0x18b960.add(_0x33712f.id), _0x512800.push(_0x33712f.id));
    }
  }
  return _0x18b960;
}
function _getNodeDragSessionCache(_0xa00d0c, _0x2f5de6, _0x1ababf, _0x1d1620, _0xfeb87f) {
  const _0x376a8a = Array.isArray(_0x1ababf) ? _0x1ababf.join('\x1f') : '',
    _0x3f1efb = _0x2f5de6?.nodes || {},
    _0x19c111 = _0x2f5de6?.edges || {},
    _0x58e181 = _0x2f5de6?._parentToChildren || null,
    _0x1d68ee = _0xa00d0c?._nodeDragSessionCache;
  if (
    _0x1d68ee &&
    _0x1d68ee.targetNodeId === _0xa00d0c.targetNodeId &&
    _0x1d68ee.selectionKey === _0x376a8a &&
    _0x1d68ee.nodes === _0x3f1efb &&
    _0x1d68ee.edges === _0x19c111 &&
    _0x1d68ee.parentToChildren === _0x58e181 &&
    _0x1d68ee.isGroupDrag === _0x1d1620
  )
    return _0x1d68ee;
  const _0xd567a4 = new Set(_0x1ababf || []),
    _0xeb2afd = _collectDragTargetIds(_0x2f5de6, _0x1ababf || []),
    _0x4135ce = Array.from(_0xeb2afd),
    _0x5d511a = _0x4135ce
      .map((_0x5d7a75) => ({
        id: _0x5d7a75,
        el: _getNodeWrapperEl(_0x5d7a75),
        origNode: _0x3f1efb[_0x5d7a75],
        minimapDot:
          !_0x1d1620 || _0xd567a4.has(_0x5d7a75)
            ? window._v2MinimapDotMap?.get(_0x5d7a75) || document.getElementById('minimap-node-' + _0x5d7a75)
            : null,
      }))
      .filter((_0x39091f) => _0x39091f.origNode),
    _0x6370bc = {
      targetNodeId: _0xa00d0c.targetNodeId,
      selectionKey: _0x376a8a,
      nodes: _0x3f1efb,
      edges: _0x19c111,
      parentToChildren: _0x58e181,
      isGroupDrag: _0x1d1620,
      directTargetSet: _0xd567a4,
      targetSet: _0xeb2afd,
      targets: _0x4135ce,
      targetEntries: _0x5d511a,
      affectedEdges: _collectAffectedEdgesForTargets(_0xeb2afd, _0x19c111),
      edgeCount: Object.keys(_0x19c111 || {}).length,
      dragPayload:
        Array.isArray(_0x1ababf) && _0x1ababf.length === 1 && typeof _0xfeb87f === 'function'
          ? _getImagePayloadFromNode(_0xfeb87f, _0x3f1efb[_0xa00d0c.targetNodeId])
          : null,
    };
  return ((_0xa00d0c._nodeDragSessionCache = _0x6370bc), _0x6370bc);
}
function _markNodeDraggingUiHidden(_0x113675, _0x4a60a7, _0x1fad17) {
  if (!_0x113675 || !_0x4a60a7 || !_0x1fad17) return;
  if (!_0x113675._draggingClassAppliedIds) _0x113675._draggingClassAppliedIds = new Set();
  if (_0x113675._draggingClassAppliedIds.has(_0x1fad17)) return;
  (_0x4a60a7.classList.add('is-ui-hidden'),
    _0x4a60a7.classList.add('is-dragging'),
    _0x113675._draggingClassAppliedIds.add(_0x1fad17));
}
function _waitForCollageItemImage(_0x26acf1, _0x3221db, _0x3326be, _0xa0559a) {
  if (typeof document === 'undefined') {
    _0xa0559a();
    return;
  }
  const _0x4fa99e = performance.now(),
    _0x50afac = 0x708,
    _0x3f30c1 = () => {
      const _0x16c43e =
          typeof window !== 'undefined' ? window.v2Renderer?.nodeInstances?.get(_0x26acf1) : null,
        _0x4edf6a = _0x16c43e?.el || document,
        _0x20e5c3 = _0x4edf6a?.querySelector?.('.collage-item[data-collage-slot-index="' + _0x3221db + '"]'),
        _0x2dad78 = _0x20e5c3 ? _0x20e5c3.querySelector('img') : null;
      if (_0x2dad78 && _0x2dad78.complete && _0x2dad78.naturalWidth > 0) {
        const _0x27b6de = _0x2dad78.getAttribute('src') || '';
        if (!_0x3326be || _0x27b6de === _0x3326be) {
          _0xa0559a();
          return;
        }
      }
      if (performance.now() - _0x4fa99e >= _0x50afac) {
        _0xa0559a();
        return;
      }
      requestAnimationFrame(_0x3f30c1);
    };
  requestAnimationFrame(_0x3f30c1);
}
function _fadeOutGhost(_0x33a05d, _0x317c48 = 160) {
  if (!_0x33a05d) return;
  const _0x3c81eb = 'opacity ' + _0x317c48 / 0x3e8 + 's cubic-bezier(0.4, 0, 0.2, 1)',
    _0x540a2b = String(_0x33a05d.style.transition || '').trim();
  ((_0x33a05d.style.transition =
    _0x540a2b && _0x540a2b !== 'none' ? _0x540a2b + ', ' + _0x3c81eb : _0x3c81eb),
    (_0x33a05d.style.opacity = '0'),
    setTimeout(() => _0x33a05d.remove(), _0x317c48));
}
function _drawImageCover(_0x1f4717, _0x31add2, _0x2e50d6, _0x2a944f) {
  const _0x3df7ad = Math.max(1, Number(_0x31add2?.naturalWidth || _0x31add2?.width) || 1),
    _0x422fa1 = Math.max(1, Number(_0x31add2?.naturalHeight || _0x31add2?.height) || 1),
    _0x426ab1 = Math.max(1, Number(_0x2e50d6) || 1),
    _0x3628ec = Math.max(1, Number(_0x2a944f) || 1),
    _0x1d3cde = _0x3df7ad / _0x422fa1,
    _0x57e3c1 = _0x426ab1 / _0x3628ec;
  let _0x430dbb = 0,
    _0x212342 = 0,
    _0xa7aa3e = _0x3df7ad,
    _0x5b810f = _0x422fa1;
  if (_0x1d3cde > _0x57e3c1)
    ((_0xa7aa3e = Math.max(1, _0x422fa1 * _0x57e3c1)), (_0x430dbb = (_0x3df7ad - _0xa7aa3e) / 2));
  else
    _0x1d3cde < _0x57e3c1 &&
      ((_0x5b810f = Math.max(1, _0x3df7ad / _0x57e3c1)), (_0x212342 = (_0x422fa1 - _0x5b810f) / 2));
  _0x1f4717.drawImage(_0x31add2, _0x430dbb, _0x212342, _0xa7aa3e, _0x5b810f, 0, 0, _0x426ab1, _0x3628ec);
}
function _createGhostFromImage(_0x340b04, _0x264722, _0x5b145f, _0x5f23fc) {
  const _0xca897 = document.createElement('div');
  ((_0xca897.className = 'v2-ghost-image'),
    Object.assign(_0xca897.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: _0x264722 + 'px',
      height: _0x5b145f + 'px',
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
  if (_0x340b04 && _0x340b04.complete && _0x340b04.naturalWidth > 0 && _0x340b04.naturalHeight > 0) {
    const _0xf3be4c = document.createElement('canvas');
    ((_0xf3be4c.width = Math.max(1, Math.round(_0x264722))),
      (_0xf3be4c.height = Math.max(1, Math.round(_0x5b145f))),
      Object.assign(_0xf3be4c.style, { width: '100%', height: '100%', display: 'block' }));
    const _0x26696f = _0xf3be4c.getContext('2d', { alpha: false });
    if (_0x26696f)
      try {
        return (
          (_0x26696f.imageSmoothingEnabled = true),
          (_0x26696f.imageSmoothingQuality = 'high'),
          _drawImageCover(_0x26696f, _0x340b04, _0xf3be4c.width, _0xf3be4c.height),
          _0xca897.appendChild(_0xf3be4c),
          _0xca897
        );
      } catch {}
  }
  const _0x24c4de = document.createElement('img'),
    _0x14fa62 = (_0x340b04 && (_0x340b04.currentSrc || _0x340b04.src)) || _0x5f23fc || '';
  if (_0x14fa62) _0x24c4de.setAttribute('src', _0x14fa62);
  return (
    Object.assign(_0x24c4de.style, {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transition: 'none',
    }),
    _0xca897.appendChild(_0x24c4de),
    _0xca897
  );
}
export function createDragController({
  store: _0x547d7b,
  isNodeType: _0x45fb05,
  getShortcuts: _0x527172,
  hitTestNode: _0x302099,
  screenToWorld: _0x301629,
  generateId: _0x2f5e88,
  cloneNodesWithEdges: _0x2f1626,
  commit: _0x2f2170,
  saveOutputBlobImpl: saveOutputBlobImpl = saveOutputBlob,
}) {
  function _0x4303f6(_0x48890e, _0x1f490b, _0xdebe96, _0x1e7ec3) {
    if (!_0x1f490b || !_0x1f490b.target) return false;
    const _0x174f68 = _0x1f490b.target.closest('.node-label');
    if (!_0x174f68 || _0x174f68.contentEditable === 'true') return false;
    const _0x48312c = _0x174f68.dataset.nodeId || (_0x174f68.parentElement && _0x174f68.parentElement.id);
    if (!_0x48312c) return false;
    const _0x4537b4 = _0x547d7b.getStateRaw().selectedNodeIds || [],
      _0x5177df = _0x4537b4.includes(_0x48312c);
    return (
      (_0x48890e.isDragging = true),
      (_0x48890e.dragSource = 'title'),
      (_0x48890e.targetNodeId = _0x48312c),
      (_0x48890e.lastWorldX = _0xdebe96),
      (_0x48890e.lastWorldY = _0x1e7ec3),
      (_0x48890e.pendingDx = 0),
      (_0x48890e.pendingDy = 0),
      (_0x48890e.hasMoved = false),
      (_0x48890e.wasSelectedOnDown = _0x5177df),
      (_0x48890e.titleDragStartScreenX = Number.isFinite(_0x1f490b.clientX) ? _0x1f490b.clientX : 0),
      (_0x48890e.titleDragStartScreenY = Number.isFinite(_0x1f490b.clientY) ? _0x1f490b.clientY : 0),
      (_0x48890e.titleDragActivated = false),
      (_0x48890e.titleDragPendingSelectNodeId = _0x5177df ? null : _0x48312c),
      true
    );
  }
  function _0x245540(_0x3cb247, _0x327d64, _0x35f86d, _0x20f44d, _0x49775c, _0x2f21f8, _0x5d2103) {
    const { viewport: _0x47140b, nodes: _0x24ba61 } = _0x547d7b.getStateRaw(),
      _0x1f6228 = _0x302099(_0x327d64, _0x35f86d, _0x24ba61, _0x47140b),
      _0x1277a8 = _0x1f6228 ? _0x24ba61[_0x1f6228] : null;
    if (!_0x1277a8) return false;
    const _0x4615d4 = _0x1277a8;
    if (_0x2f21f8) {
      const _0x19df0e = _0x547d7b.getStateRaw().selectedNodeIds,
        _0x3d4433 = _0x19df0e.includes(_0x4615d4.id) ? [..._0x19df0e] : [_0x4615d4.id],
        _0x3efb51 = _0x2f1626(_0x3d4433, 0, 0),
        _0x527cf4 = Object.values(_0x3efb51);
      _0x547d7b.setSelectedNodes(_0x527cf4);
      const _0x2dba5f = _0x3efb51[_0x4615d4.id] || _0x527cf4[0];
      return (
        (_0x3cb247.isDragging = true),
        (_0x3cb247.dragSource = 'node'),
        (_0x3cb247.targetNodeId = _0x2dba5f),
        (_0x3cb247.lastWorldX = _0x20f44d),
        (_0x3cb247.lastWorldY = _0x49775c),
        (_0x3cb247.titleDragPendingSelectNodeId = null),
        (_0x3cb247.titleDragActivated = false),
        (_0x3cb247.titleDragStartScreenX = 0),
        (_0x3cb247.titleDragStartScreenY = 0),
        document.body.classList.add('is-dragging'),
        true
      );
    }
    if (_0x45fb05(_0x4615d4, 'storyboard') && _0x4615d4.isEditing) {
      const _0xdd7104 = getStoryboardCellMetrics(_0x4615d4),
        _0x2770d3 = getStoryboardCellIndexAtWorldPoint(_0x4615d4, _0x20f44d, _0x49775c),
        _0x1d63da = _0x4615d4.cells && _0x4615d4.cells[_0x2770d3];
      if (_0x2770d3 >= 0 && _0x1d63da && !_isCellEmpty(_0x1d63da)) {
        const _0x525ecc = getStoryboardCellPixelBounds(_0x4615d4, _0x2770d3),
          _0x302dd7 = (_0x525ecc?.width || _0xdd7104.cellWidth) * _0x47140b.zoom,
          _0x5ca57c = (_0x525ecc?.height || _0xdd7104.cellHeight) * _0x47140b.zoom,
          _0x207448 = _0x327d64 - _0x302dd7 / 2,
          _0x38e31e = _0x35f86d - _0x5ca57c / 2,
          _0xfad6a1 = document.createElement('div');
        ((_0xfad6a1.className = 'v2-ghost-image'),
          Object.assign(_0xfad6a1.style, {
            position: 'fixed',
            left: '0',
            top: '0',
            width: _0x302dd7 + 'px',
            height: _0x5ca57c + 'px',
            transform: 'translate(' + _0x207448 + 'px, ' + _0x38e31e + 'px)',
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
        const _0x1be484 = document.getElementById('cell-' + _0x4615d4.id + '-' + _0x2770d3),
          _0x41384c = _0x1be484?.querySelector('img.storyboard-cell-img--source-crop') || null,
          _0x1ceaa4 = _0x1be484?.querySelector('.storyboard-cell-img') || null,
          _0x3927f5 = getStoryboardCellDisplaySrc(_0x1d63da),
          _0x4055da = _0x41384c
            ? buildStoryboardSourceCropExtract(
                _0x4615d4,
                _0x2770d3,
                _0x1d63da,
                'storyboard_drag_' + _0x4615d4.id + '_' + _0x2770d3 + '.jpg',
              )
            : null;
        if (_0x4055da?.dataUrl) {
          const _0x36b2c8 = getAutoMediaSizeByShortSide(_0x4055da.width, _0x4055da.height),
            _0x5f0424 = _0x36b2c8.width * _0x47140b.zoom,
            _0x4704ee = _0x36b2c8.height * _0x47140b.zoom;
          Object.assign(_0xfad6a1.style, {
            width: _0x5f0424 + 'px',
            height: _0x4704ee + 'px',
            transform: 'translate(' + _0x327d64 + 'px, ' + _0x35f86d + 'px) translate(-50%, -50%)',
          });
          const _0x342d46 = document.createElement('img');
          (_0x342d46.setAttribute('src', _0x4055da.dataUrl),
            Object.assign(_0x342d46.style, {
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
              transition: 'none',
            }),
            _0xfad6a1.appendChild(_0x342d46));
        } else {
          if (_0x1ceaa4) {
            const _0x51c5bb = Math.max(1, Math.round(_0x302dd7)),
              _0x540e1e = Math.max(1, Math.round(_0x5ca57c)),
              _0x1b6b15 = document.createElement('canvas');
            ((_0x1b6b15.width = _0x51c5bb),
              (_0x1b6b15.height = _0x540e1e),
              Object.assign(_0x1b6b15.style, { width: '100%', height: '100%', display: 'block' }));
            const _0x4d5873 = _0x1b6b15.getContext('2d', { alpha: false });
            if (_0x4d5873 && _0x1ceaa4.complete && _0x1ceaa4.naturalWidth > 0)
              try {
                ((_0x4d5873.imageSmoothingEnabled = true),
                  (_0x4d5873.imageSmoothingQuality = 'high'),
                  _0x4d5873.drawImage(_0x1ceaa4, 0, 0, _0x51c5bb, _0x540e1e),
                  _0xfad6a1.appendChild(_0x1b6b15));
              } catch {
                const _0x1dac20 = document.createElement('img'),
                  _0x46320d = _0x1ceaa4.currentSrc || _0x1ceaa4.src || _0x3927f5;
                if (_0x46320d) _0x1dac20.setAttribute('src', _0x46320d);
                (Object.assign(_0x1dac20.style, {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'none',
                }),
                  _0xfad6a1.appendChild(_0x1dac20));
              }
            else {
              const _0x59fac4 = document.createElement('img'),
                _0x1e999e = _0x1ceaa4.currentSrc || _0x1ceaa4.src || _0x3927f5;
              if (_0x1e999e) _0x59fac4.setAttribute('src', _0x1e999e);
              (Object.assign(_0x59fac4.style, {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'none',
              }),
                _0xfad6a1.appendChild(_0x59fac4));
            }
          } else {
            const _0x1684af = document.createElement('img');
            if (_0x3927f5) _0x1684af.setAttribute('src', _0x3927f5);
            (Object.assign(_0x1684af.style, {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'none',
            }),
              _0xfad6a1.appendChild(_0x1684af));
          }
        }
        document.body.appendChild(_0xfad6a1);
        const _0x29d57c = _0x5d2103?.target?.closest('.sb-cell') || null;
        if (_0x29d57c) _0x29d57c.classList.add('is-drag-source');
        return (
          (_0x3cb247.isDraggingCell = true),
          (_0x3cb247.dragSource = 'cell'),
          (_0x3cb247.targetNodeId = _0x4615d4.id),
          (_0x3cb247.sourceCellIndex = _0x2770d3),
          (_0x3cb247.draggedCellData = { ..._0x1d63da }),
          (_0x3cb247.ghostEl = _0xfad6a1),
          (_0x3cb247.sourceCellEl = _0x29d57c),
          (_0x3cb247.lastWorldX = _0x20f44d),
          (_0x3cb247.lastWorldY = _0x49775c),
          (_0x3cb247.titleDragPendingSelectNodeId = null),
          (_0x3cb247.titleDragActivated = false),
          (_0x3cb247.titleDragStartScreenX = 0),
          (_0x3cb247.titleDragStartScreenY = 0),
          document.body.classList.add('is-dragging'),
          true
        );
      }
    }
    const _0x5a977e = _0x547d7b.getStateRaw().selectedNodeIds,
      _0x3f8f7d = _0x5a977e.includes(_0x4615d4.id);
    ((_0x3cb247.isDragging = true),
      (_0x3cb247.dragSource = 'node'),
      (_0x3cb247.targetNodeId = _0x4615d4.id),
      (_0x3cb247.lastWorldX = _0x20f44d),
      (_0x3cb247.lastWorldY = _0x49775c),
      (_0x3cb247.titleDragPendingSelectNodeId = null),
      (_0x3cb247.titleDragActivated = false),
      (_0x3cb247.titleDragStartScreenX = 0),
      (_0x3cb247.titleDragStartScreenY = 0),
      (_0x3cb247.wasSelectedOnDown = _0x3f8f7d),
      document.body.classList.add('is-dragging'));
    const _0x555993 = _0x527172(),
      _0x30350d = _0x555993['multi-select'] ? _0x555993['multi-select'].keys[0] : 'Shift';
    let _0x24975c = false;
    if (_0x30350d === 'Ctrl') _0x24975c = _0x5d2103?.ctrlKey || _0x5d2103?.metaKey;
    else {
      if (_0x30350d === 'Shift') _0x24975c = _0x5d2103?.shiftKey;
      else {
        if (_0x30350d === 'Alt') _0x24975c = _0x5d2103?.altKey;
      }
    }
    return (
      _0x24975c
        ? _0x5a977e.includes(_0x4615d4.id)
          ? (_0x547d7b.setSelectionMeta({ source: 'shift' }),
            _0x547d7b.setSelectedNodes(_0x5a977e.filter((_0x1c6f97) => _0x1c6f97 !== _0x4615d4.id)),
            (_0x3cb247.isDragging = false),
            (_0x3cb247.dragSource = null),
            (_0x3cb247.targetNodeId = null))
          : (_0x547d7b.setSelectionMeta({ source: 'shift' }),
            _0x547d7b.setSelectedNodes([..._0x5a977e, _0x4615d4.id]))
        : !_0x5a977e.includes(_0x4615d4.id) &&
          (_0x547d7b.setSelectionMeta({ source: 'click' }), _0x547d7b.setSelectedNodes([_0x4615d4.id])),
      true
    );
  }
  function _0x4c0820(_0x17b592, _0x3fc86e, _0x486f9e, _0x332a88, _0x3869bf, _0x3fb6a2) {
    _0x17b592.ghostEl &&
      (_0x17b592.ghostEl.style.transform =
        'translate(' + _0x3fc86e + 'px, ' + _0x486f9e + 'px) translate(-50%, -50%)');
    const _0x308b9b = _getStoryboardCellInfoAt(_0x332a88, _0x3869bf, _0x3fb6a2, { nearestInGap: true }),
      _0x4bbb8d = _0x308b9b ? _0x308b9b.nodeId : null,
      _0x397c54 = _0x17b592.lastHoverNodeId || null;
    if (_0x4bbb8d !== _0x397c54 || (_0x308b9b && _0x308b9b.cellIndex !== _0x17b592.lastHoverCellIndex)) {
      if (_0x397c54) {
        const _0xe0f6aa = window.v2Renderer?.nodeInstances?.get(_0x397c54);
        if (_0xe0f6aa && typeof _0xe0f6aa.highlightCell === 'function') _0xe0f6aa.highlightCell(-1);
      }
      if (_0x4bbb8d) {
        const _0x36cfc5 = window.v2Renderer?.nodeInstances?.get(_0x4bbb8d);
        if (_0x36cfc5 && typeof _0x36cfc5.highlightCell === 'function')
          _0x36cfc5.highlightCell(_0x308b9b.cellIndex);
      }
      ((_0x17b592.lastHoverNodeId = _0x4bbb8d),
        (_0x17b592.lastHoverCellIndex = _0x308b9b ? _0x308b9b.cellIndex : -1));
    }
    ((_0x17b592.lastWorldX = _0x332a88), (_0x17b592.lastWorldY = _0x3869bf));
  }
  function _0xd5ae71(_0x48e45b, _0x5e1e02, _0x4cb0e4, _0x217e85, _0x38eb09, _0xfdc14e, _0x1b0710, _0x3089e6) {
    const { viewport: _0x8ad124, nodes: _0x1efdce, selectedNodeIds: _0x218cac, edges: _0x35f383 } = _0x3089e6,
      _0x4c7b34 = _0x218cac.includes(_0x48e45b.targetNodeId) ? _0x218cac : [_0x48e45b.targetNodeId],
      _0x3adffc = _0x1efdce[_0x48e45b.targetNodeId],
      _0x5a4d9d = _0x4c7b34.length === 1 && _0x45fb05(_0x3adffc, 'group'),
      {
        targetSet: _0x32f020,
        targets: _0x209ee3,
        targetEntries: _0x20f060,
        affectedEdges: _0x1a4790,
        edgeCount: _0x455e75,
        dragPayload: _0x57cd8c,
      } = _getNodeDragSessionCache(_0x48e45b, _0x3089e6, _0x4c7b34, _0x5a4d9d, _0x45fb05);
    if (_0x48e45b.dragSource === 'title' && _0x48e45b.titleDragActivated !== true) {
      const _0x217c6e = Number.isFinite(_0x48e45b.titleDragStartScreenX)
          ? _0x48e45b.titleDragStartScreenX
          : _0x5e1e02,
        _0x47dc8e = Number.isFinite(_0x48e45b.titleDragStartScreenY)
          ? _0x48e45b.titleDragStartScreenY
          : _0x4cb0e4,
        _0x3a6de2 = Math.hypot(_0x5e1e02 - _0x217c6e, _0x4cb0e4 - _0x47dc8e);
      if (_0x3a6de2 <= TITLE_DRAG_ACTIVATE_THRESHOLD_PX) return;
      ((_0x48e45b.titleDragActivated = true), document.body.classList.add('is-dragging'));
      const _0xffce69 = _0x48e45b.titleDragPendingSelectNodeId;
      (_0xffce69 &&
        !_0x218cac.includes(_0xffce69) &&
        (typeof _0x547d7b.setSelectionMeta === 'function' && _0x547d7b.setSelectionMeta({ source: 'click' }),
        _0x547d7b.setSelectedNodes([_0xffce69])),
        (_0x48e45b.titleDragPendingSelectNodeId = null));
    }
    if (_0x4c7b34.length === 1) {
      const _0x1a4d5d = _0x57cd8c;
      if (_0x1a4d5d) {
        const _0x31f58d = _getStoryboardCellInfoAt(_0xfdc14e, _0x1b0710, _0x1efdce),
          _0x2e162b = _0x31f58d ? _0x1efdce[_0x31f58d.nodeId] : null,
          _0x27d54e =
            !!_0x1a4d5d &&
            !!_0x2e162b &&
            (!!_0x2e162b.isEditing || _isCellEmpty((_0x2e162b.cells || [])[_0x31f58d.cellIndex]));
        let _0x533d0f = _0x27d54e ? _0x31f58d.nodeId : null,
          _0x3904a3 = _0x27d54e ? _0x31f58d.cellIndex : -1,
          _0x59ddfb = _0x27d54e ? 'storyboard' : '';
        if (!_0x27d54e) {
          const _0x59d1fb = _getCollageSlotInfoAt(_0xfdc14e, _0x1b0710, _0x1efdce),
            _0x34aba2 = _0x59d1fb ? _0x1efdce[_0x59d1fb.nodeId] : null,
            _0xa2c1f = (_0x34aba2?.items || [])[_0x59d1fb?.itemIndex],
            _0x2821a9 = !!_0x1a4d5d && !!_0x34aba2 && (!!_0x34aba2.isEditing || isCollageItemEmpty(_0xa2c1f));
          ((_0x533d0f = _0x2821a9 ? _0x59d1fb.nodeId : null),
            (_0x3904a3 = _0x2821a9 ? _0x59d1fb.itemIndex : -1),
            (_0x59ddfb = _0x2821a9 ? 'collage' : ''));
        }
        const _0x516f7f = _0x48e45b.lastHoverNodeId || null;
        if (
          _0x533d0f !== _0x516f7f ||
          _0x3904a3 !== (_0x48e45b.lastHoverCellIndex ?? -1) ||
          _0x59ddfb !== (_0x48e45b.lastHoverKind || '')
        ) {
          if (_0x516f7f) _clearDropSlotHighlight(_0x516f7f);
          if (_0x533d0f) _highlightDropSlot(_0x533d0f, _0x59ddfb, _0x3904a3);
          ((_0x48e45b.lastHoverNodeId = _0x533d0f),
            (_0x48e45b.lastHoverCellIndex = _0x3904a3),
            (_0x48e45b.lastHoverKind = _0x59ddfb));
        }
      } else
        _0x48e45b.lastHoverNodeId &&
          (_clearDropSlotHighlight(_0x48e45b.lastHoverNodeId),
          (_0x48e45b.lastHoverNodeId = null),
          (_0x48e45b.lastHoverCellIndex = -1),
          (_0x48e45b.lastHoverKind = ''));
    }
    let _0x28c646 = _0x217e85,
      _0x5af30f = _0x38eb09;
    if (window.v2SnapToGrid) {
      const _0x274c9c = _0x48e45b.pendingDx || 0,
        _0xa6c3f2 = _0x48e45b.pendingDy || 0,
        _0x4598aa = _0x28c646 - _0x48e45b.lastWorldX,
        _0x5e432b = _0x5af30f - _0x48e45b.lastWorldY;
      if (_0x4c7b34.length === 1) {
        const _0x51508e = _0x1efdce[_0x48e45b.targetNodeId];
        if (_0x51508e) {
          const _0x3479c5 = _0x51508e.x + _0x274c9c + _0x4598aa,
            _0x3930c8 = _0x51508e.y + _0xa6c3f2 + _0x5e432b;
          ((_0x28c646 += snapToCanvasGrid(_0x3479c5) - _0x3479c5),
            (_0x5af30f += snapToCanvasGrid(_0x3930c8) - _0x3930c8));
        }
      } else {
        let _0x3b61f5 = Infinity,
          _0x5daa98 = Infinity;
        _0x209ee3.forEach((_0x4c3176) => {
          const _0x39099a = _0x1efdce[_0x4c3176];
          if (!_0x39099a) return;
          ((_0x3b61f5 = Math.min(_0x3b61f5, (_0x39099a.x || 0) + _0x274c9c)),
            (_0x5daa98 = Math.min(_0x5daa98, (_0x39099a.y || 0) + _0xa6c3f2)));
        });
        if (Number.isFinite(_0x3b61f5) && Number.isFinite(_0x5daa98)) {
          const _0x379a88 = _0x3b61f5 + _0x4598aa,
            _0x2cdc43 = _0x5daa98 + _0x5e432b;
          ((_0x28c646 += snapToCanvasGrid(_0x379a88) - _0x379a88),
            (_0x5af30f += snapToCanvasGrid(_0x2cdc43) - _0x2cdc43));
        }
      }
    }
    const _0x22d0be = _shouldUseDragSnapGuides(_0x3089e6, _0x5a4d9d),
      _0xd47a64 = _0x22d0be ? _getDragSnapSpatialIndex(_0x3089e6) : null;
    if (_0x22d0be && _0x4c7b34.length === 1) {
      const _0x4d85e2 = _0x3adffc;
      if (_0x4d85e2) {
        const _0x3caa69 = _0x48e45b.pendingDx || 0,
          _0x312686 = _0x48e45b.pendingDy || 0,
          _0x24eafd = _0x4d85e2.x + _0x3caa69 + (_0x28c646 - _0x48e45b.lastWorldX),
          _0x4b9a8b = _0x4d85e2.y + _0x312686 + (_0x5af30f - _0x48e45b.lastWorldY),
          _0x492946 = computeSingleNodeSnapGuides({
            nodesById: _0x3089e6.nodes,
            dragNodeId: _0x48e45b.targetNodeId,
            proposedX: _0x24eafd,
            proposedY: _0x4b9a8b,
            width: _0x4d85e2.width || 200,
            height: _0x4d85e2.height || 200,
            viewport: _0x8ad124,
            thresholdPx: 8,
            spatialIndex: _0xd47a64,
          });
        (Number.isFinite(_0x492946.snappedX) && (_0x28c646 += _0x492946.snappedX - _0x24eafd),
          Number.isFinite(_0x492946.snappedY) && (_0x5af30f += _0x492946.snappedY - _0x4b9a8b),
          Array.isArray(_0x492946.guideLines) && _0x492946.guideLines.length > 0
            ? window._showSnapGuideLines?.(_0x492946.guideLines)
            : window._clearSnapGuideLines?.());
      } else window._clearSnapGuideLines?.();
    } else {
      if (_0x22d0be && _0x4c7b34.length >= 2) {
        const _0x65087e = _0x48e45b.pendingDx || 0,
          _0x3c39bc = _0x48e45b.pendingDy || 0,
          _0x4c56eb = _0x28c646 - _0x48e45b.lastWorldX,
          _0x536ced = _0x5af30f - _0x48e45b.lastWorldY;
        let _0x1ac52f = Infinity,
          _0x77c21 = Infinity,
          _0x46dada = -Infinity,
          _0x1b57f8 = -Infinity,
          _0x852540 = 0;
        _0x209ee3.forEach((_0x437388) => {
          const _0x40d0f8 = _0x1efdce[_0x437388];
          if (!_0x40d0f8) return;
          _0x852540 += 1;
          const _0x14ba94 = (_0x40d0f8.x || 0) + _0x65087e,
            _0x9d05ee = (_0x40d0f8.y || 0) + _0x3c39bc,
            _0x44bbd8 = _0x40d0f8.width || 200,
            _0x17d191 = _0x40d0f8.height || 200;
          ((_0x1ac52f = Math.min(_0x1ac52f, _0x14ba94)),
            (_0x77c21 = Math.min(_0x77c21, _0x9d05ee)),
            (_0x46dada = Math.max(_0x46dada, _0x14ba94 + _0x44bbd8)),
            (_0x1b57f8 = Math.max(_0x1b57f8, _0x9d05ee + _0x17d191)));
        });
        if (_0x852540 > 0 && Number.isFinite(_0x1ac52f) && Number.isFinite(_0x77c21)) {
          const _0x5432a0 = _0x1ac52f + _0x4c56eb,
            _0x44e3e5 = _0x77c21 + _0x536ced,
            _0x1cd3a6 = computeMultiNodeSnapGuides({
              nodesById: _0x3089e6.nodes,
              movingNodeIds: _0x209ee3,
              proposedBounds: {
                minX: _0x5432a0,
                minY: _0x44e3e5,
                width: _0x46dada - _0x1ac52f,
                height: _0x1b57f8 - _0x77c21,
              },
              viewport: _0x8ad124,
              thresholdPx: 8,
              spatialIndex: _0xd47a64,
            });
          (Number.isFinite(_0x1cd3a6.snappedX) && (_0x28c646 += _0x1cd3a6.snappedX - _0x5432a0),
            Number.isFinite(_0x1cd3a6.snappedY) && (_0x5af30f += _0x1cd3a6.snappedY - _0x44e3e5),
            Array.isArray(_0x1cd3a6.guideLines) && _0x1cd3a6.guideLines.length > 0
              ? window._showSnapGuideLines?.(_0x1cd3a6.guideLines)
              : window._clearSnapGuideLines?.());
        } else window._clearSnapGuideLines?.();
      } else window._clearSnapGuideLines?.();
    }
    const _0x58ec45 = _0x28c646 - _0x48e45b.lastWorldX,
      _0xb5b707 = _0x5af30f - _0x48e45b.lastWorldY;
    if (_0x58ec45 !== 0 || _0xb5b707 !== 0) {
      ((_0x48e45b.pendingDx = (_0x48e45b.pendingDx || 0) + _0x58ec45),
        (_0x48e45b.pendingDy = (_0x48e45b.pendingDy || 0) + _0xb5b707));
      !_0x48e45b.hasMoved &&
        Math.hypot(_0x48e45b.pendingDx, _0x48e45b.pendingDy) > 3 &&
        (_0x48e45b.hasMoved = true);
      const _0x6778dc = [],
        _0x3f3fec = [];
      (_0x20f060.forEach(({ id: _0x282d17, el: _0x49e454, origNode: _0xf867f2, minimapDot: _0x1387e6 }) => {
        (_0x49e454 &&
          _0x6778dc.push({
            id: _0x282d17,
            el: _0x49e454,
            origNode: _0xf867f2,
            pendingDx: _0x48e45b.pendingDx,
            pendingDy: _0x48e45b.pendingDy,
            hasMoved: _0x48e45b.hasMoved,
          }),
          _0x1387e6 &&
            window._v2MinimapScale &&
            _0x3f3fec.push({
              minimapDot: _0x1387e6,
              pendingDx: _0x48e45b.pendingDx,
              pendingDy: _0x48e45b.pendingDy,
              scale: window._v2MinimapScale,
            }));
      }),
        _0x6778dc.forEach(
          ({
            id: _0x5f1f60,
            el: _0x300fa5,
            origNode: _0x3f2c36,
            pendingDx: _0x2e07f4,
            pendingDy: _0xbc30cd,
            hasMoved: _0x2b896a,
          }) => {
            const _0x5a7a13 = _0x3f2c36.x + _0x2e07f4,
              _0x1192cd = _0x3f2c36.y + _0xbc30cd;
            ((_0x300fa5.style.transform = 'translate(' + _0x5a7a13 + 'px, ' + _0x1192cd + 'px)'),
              _0x2b896a && _markNodeDraggingUiHidden(_0x48e45b, _0x300fa5, _0x5f1f60),
              _0x45fb05(_0x3f2c36, 'group') &&
                _syncNodeDragPreview(_0x5f1f60, { dx: _0x2e07f4, dy: _0xbc30cd, active: _0x2b896a }));
          },
        ),
        _0x3f3fec.forEach(
          ({ minimapDot: _0x8bf1c2, pendingDx: _0x243965, pendingDy: _0x3a3a82, scale: _0x4e46ef }) => {
            _0x8bf1c2.style.transform =
              'translate(' + _0x243965 * _0x4e46ef + 'px, ' + _0x3a3a82 * _0x4e46ef + 'px)';
          },
        ));
      const _0x1cdfa3 = window._edgeDomCache;
      _0x1cdfa3 && _0x1cdfa3.size > 0
        ? _updateDraggedEdges(_0x48e45b, {
            affectedEdges: _0x1a4790,
            edgeDomCache: _0x1cdfa3,
            nodes: _0x3089e6.nodes,
            targetSet: _0x32f020,
            viewport: _0x8ad124,
            edgeCount: _0x455e75,
            pendingDx: _0x48e45b.pendingDx,
            pendingDy: _0x48e45b.pendingDy,
            useEdgeGroupTransform: _0x5a4d9d,
          })
        : _flushDragEdgeScheduler(_0x48e45b);
      ((_0x48e45b.lastWorldX = _0x28c646), (_0x48e45b.lastWorldY = _0x5af30f));
      const _0x42a692 = _getMultiSelectBoxEl();
      if (_0x4c7b34.length >= 2 && _0x42a692 && _0x42a692.style.display !== 'none') {
        const _0x2a0145 = _0x218cac.length > 0 ? _0x218cac : [_0x48e45b.targetNodeId];
        let _0x183bbd = Infinity,
          _0x11d096 = Infinity,
          _0x344b83 = -Infinity,
          _0x1d8d9e = -Infinity,
          _0xece6e4 = 0;
        _0x2a0145.forEach((_0x104f25) => {
          const _0xaeab98 = _0x3089e6.nodes[_0x104f25];
          if (!_0xaeab98) return;
          _0xece6e4++;
          const _0x2ce59a = _0xaeab98.x + (_0x32f020.has(_0x104f25) ? _0x48e45b.pendingDx : 0),
            _0x404847 = _0xaeab98.y + (_0x32f020.has(_0x104f25) ? _0x48e45b.pendingDy : 0),
            _0x424dd7 = _0xaeab98.width || 0x104,
            _0x7461a8 = _0xaeab98.height || 100,
            _0x45c23e = _0xaeab98.type !== 'group' ? _0x404847 - 30 : _0x404847;
          ((_0x183bbd = Math.min(_0x183bbd, _0x2ce59a)),
            (_0x11d096 = Math.min(_0x11d096, _0x45c23e)),
            (_0x344b83 = Math.max(_0x344b83, _0x2ce59a + _0x424dd7)),
            (_0x1d8d9e = Math.max(_0x1d8d9e, _0x404847 + _0x7461a8)));
        });
        if (_0xece6e4 >= 2) {
          const _0x115971 = 18;
          ((_0x42a692.style.left = _0x183bbd - _0x115971 + 'px'),
            (_0x42a692.style.top = _0x11d096 - _0x115971 + 'px'),
            (_0x42a692.style.width = _0x344b83 - _0x183bbd + _0x115971 * 2 + 'px'),
            (_0x42a692.style.height = _0x1d8d9e - _0x11d096 + _0x115971 * 2 + 'px'));
        }
      }
    }
  }
  function _0x444ae9(_0x41fab6, _0x5ae9e1, _0x1711af) {
    const _0x3ae4f1 = _0x547d7b.getStateRaw(),
      { viewport: _0x3f505f, nodes: _0x3fc649 } = _0x3ae4f1,
      { x: _0x37109f, y: _0x2a39c3 } = _0x301629(_0x5ae9e1, _0x1711af, _0x3f505f),
      _0x250461 = _0x41fab6.ghostEl;
    _0x41fab6.sourceCellEl &&
      (_0x41fab6.sourceCellEl.classList.remove('is-drag-source'), (_0x41fab6.sourceCellEl = null));
    const _0x5034bd = _0x3fc649[_0x41fab6.targetNodeId],
      _0x1289a0 = _0x41fab6.sourceCellIndex,
      _0x1a49aa = _0x41fab6.draggedCellData;
    if (!_0x5034bd) {
      if (_0x250461) _0x250461.remove();
      return ((_0x41fab6.ghostEl = null), { didAct: false, committed: false });
    }
    const _0x516041 =
      _getStoryboardCellInfoAt(_0x37109f, _0x2a39c3, _0x3fc649, { nearestInGap: true }) ||
      _getLastHoveredStoryboardCellInfo(_0x41fab6, _0x37109f, _0x2a39c3, _0x3fc649);
    let _0x33fe5c = false;
    if (_0x516041) {
      const _0x23a026 = _0x3fc649[_0x516041.nodeId],
        _0x14240a = _0x516041.cellIndex;
      if (_0x23a026.id === _0x5034bd.id && _0x14240a === _0x1289a0) {
        if (_0x250461) _0x250461.remove();
        _0x33fe5c = false;
      } else {
        const _0x4584db = _0x5034bd.cells?.[_0x1289a0] || _0x1a49aa,
          _0x3d1427 = _0x23a026.cells?.[_0x14240a],
          _0x3a6b7c = resolveStoryboardCellDisplaySnapshot(_0x5034bd, _0x4584db, _0x1289a0),
          _0xba655 =
            _0x3d1427 && !_isCellEmpty(_0x3d1427)
              ? resolveStoryboardCellDisplaySnapshot(_0x23a026, _0x3d1427, _0x14240a)
              : null;
        if (!_0x3a6b7c || (_0x3d1427 && !_isCellEmpty(_0x3d1427) && !_0xba655)) {
          if (_0x250461) _0x250461.remove();
          _0x33fe5c = false;
        } else {
          const _0x3a5219 =
            _0x23a026.id === _0x5034bd.id
              ? _applyImmediateCellSwapPreview(_0x5034bd.id, _0x1289a0, _0x14240a)
              : { ok: false, revert() {} };
          if (_0x3a5219.ok && _0x250461) _0x250461.remove();
          _0x33fe5c = swapStoryboardCellsWithDisplaySnapshots({
            store: _0x547d7b,
            sourceNode: _0x5034bd,
            sourceCellIndex: _0x1289a0,
            targetNode: _0x23a026,
            targetCellIndex: _0x14240a,
            sourceSnapshot: _0x3a6b7c,
            targetSnapshot: _0xba655,
          });
          !_0x33fe5c && _0x3a5219.ok && _0x3a5219.revert();
          if (_0x33fe5c) {
            _flushStoryboardNodesNow(_0x5034bd.id, _0x23a026.id);
            if (!_0x3a5219.ok && _0x250461) _0x250461.remove();
          } else _0x250461 && _0x250461.remove();
        }
      }
    } else {
      const _0x55f425 = getStoryboardCellMetrics(_0x5034bd),
        _0x5a11fc = _0x5034bd?.cells?.[_0x1289a0],
        _0x365c68 = _0x5a11fc && !_isCellEmpty(_0x5a11fc) ? _0x5a11fc : _0x1a49aa,
        _0xe16a44 = _0x365c68 || {},
        _0x87fe03 = _0x2f5e88('source-image'),
        _0x2352be = resolveStoryboardCellDisplaySnapshot(_0x5034bd, _0xe16a44, _0x1289a0, {
          fileName: 'storyboard_extract_' + _0x87fe03 + '.jpg',
        });
      if (!_0x2352be?.src) {
        if (_0x250461) _0x250461.remove();
        _0x33fe5c = false;
      } else {
        const _0x29b67f = Number(_0x2352be.storyboardSourceIndex),
          _0x58c410 =
            Number.isInteger(_0x29b67f) && _0x29b67f >= 0
              ? _0x29b67f
              : resolveStoryboardCellSourceIndex(_0xe16a44, _0x1289a0, _0x5034bd),
          _0x2853d7 = getStoryboardCellPixelBounds(_0x5034bd, _0x58c410),
          _0x39ee68 = getStoryboardNodeSourceContext(_0x5034bd);
        _0x547d7b.batch(() => {
          const _0x20252a = (_0x1289a0 % _0x5034bd.cols) + 1,
            _0x4946cf = Math.floor(_0x1289a0 / _0x5034bd.cols) + 1,
            _0x285e2e = _0x2352be.width || _0x2853d7?.width || _0x55f425.cellWidth,
            _0x306faa = _0x2352be.height || _0x2853d7?.height || _0x55f425.cellHeight,
            _0x56bdbe = getAutoMediaSizeByShortSide(_0x285e2e, _0x306faa);
          (_0x547d7b.addNode(
            buildSourceMediaNodePayload({
              id: _0x87fe03,
              type: 'source-image',
              src: _0x2352be.capturePreviewUrl ? '' : _0x2352be.src,
              capturePreviewUrl: _0x2352be.capturePreviewUrl || '',
              localPath: _0x2352be.capturePreviewUrl ? null : _0x2352be.localPath,
              thumbUrl: null,
              fileName: _0x2352be.fileName || _0xe16a44.fileName || '',
              originalWidth: _0x2352be.width || _0xe16a44.originalWidth,
              originalHeight: _0x2352be.height || _0xe16a44.originalHeight,
              imageWidth: _0x2352be.width || _0xe16a44.imageWidth,
              imageHeight: _0x2352be.height || _0xe16a44.imageHeight,
              sourceLocalPath: null,
              sourceUrl: '',
              sourceWidth: null,
              sourceHeight: null,
              storyboardSourceCrop: false,
              storyboardExtractedCell: true,
              storyboardSourceIndex: _0x58c410,
              storyboardSourceNodeId: _0x5034bd.id,
              storyboardSourceLocalPath: _0x39ee68.sourceLocalPath,
              storyboardSourceUrl: _0x39ee68.sourceUrl,
              naturalWidth: _0x2352be.width,
              naturalHeight: _0x2352be.height,
              x: _0x37109f - _0x56bdbe.width / 2,
              y: _0x2a39c3 - _0x56bdbe.height / 2,
              width: _0x56bdbe.width,
              height: _0x56bdbe.height,
              name: '提取分镜' + _0x4946cf + '-' + _0x20252a,
              fixedSize: true,
              needsAutoResize: false,
            }),
          ),
            _0x547d7b.setSelectedNodes([_0x87fe03]));
          const _0x1e77c0 = [..._0x5034bd.cells];
          ((_0x1e77c0[_0x1289a0] = buildEmptyStoryboardCellForSlot(
            _0x1e77c0[_0x1289a0],
            _0x5034bd,
            _0x1289a0,
          )),
            _0x547d7b.updateNodeData(_0x5034bd.id, { cells: _0x1e77c0 }));
        });
        _0x2352be.crop
          ? _persistStoryboardSourceCropExtract(_0x547d7b, _0x87fe03, _0x2352be.crop, saveOutputBlobImpl)
          : _persistStoryboardSnapshotPreviewToNode(
              _0x547d7b,
              _0x87fe03,
              _0x2352be,
              _0x2352be.fileName || 'storyboard_extract_' + _0x87fe03 + '.jpg',
              saveOutputBlobImpl,
            );
        if (_0x250461 && _0x87fe03) {
          const _0x76c568 = performance.now(),
            _0x32efb8 = 0x640,
            _0x336bb9 = () => {
              const _0x5ab8e3 = _getNodeWrapperEl(_0x87fe03),
                _0x5aeac5 = _0x5ab8e3 ? _0x5ab8e3.querySelector('img') : null;
              if (_0x5aeac5 && _0x5aeac5.complete && _0x5aeac5.naturalWidth > 0) {
                ((_0x250461.style.transition = 'opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1)'),
                  (_0x250461.style.opacity = '0'),
                  setTimeout(() => _0x250461.remove(), 180));
                return;
              }
              if (performance.now() - _0x76c568 >= _0x32efb8) {
                _0x250461.remove();
                return;
              }
              requestAnimationFrame(_0x336bb9);
            };
          requestAnimationFrame(_0x336bb9);
        } else _0x250461 && _0x250461.remove();
        _0x33fe5c = true;
      }
    }
    _0x41fab6.ghostEl = null;
    if (_0x41fab6.lastHoverNodeId) {
      const _0x458ebb = window.v2Renderer?.nodeInstances?.get(_0x41fab6.lastHoverNodeId);
      if (_0x458ebb && typeof _0x458ebb.highlightCell === 'function') _0x458ebb.highlightCell(-1);
    }
    return { didAct: _0x33fe5c, committed: _0x33fe5c };
  }
  function _0xdc9318(_0x532a50, _0x3daa5e, _0x44ef2a) {
    _flushDragEdgeScheduler(_0x532a50);
    if (_0x532a50.dragSource === 'title' && _0x532a50.titleDragActivated !== true)
      return { earlyCommit: false, didAct: false };
    const _0x280500 = _0x547d7b.getStateRaw(),
      { viewport: _0x2c1371, nodes: _0x139634 } = _0x280500,
      { x: _0x25ca3f, y: _0x5e2428 } = _0x301629(_0x3daa5e, _0x44ef2a, _0x2c1371),
      { selectedNodeIds: _0x471870 } = _0x280500,
      _0x105b00 = _0x471870.includes(_0x532a50.targetNodeId)
        ? Array.from(_0x471870)
        : [_0x532a50.targetNodeId];
    if (_0x105b00.length === 1) {
      const _0x48fe54 = _0x139634[_0x105b00[0]],
        _0xb39854 = _getImagePayloadFromNode(_0x45fb05, _0x48fe54);
      if (_0xb39854) {
        const _0xedda16 = _getStoryboardCellInfoAt(_0x25ca3f, _0x5e2428, _0x139634);
        if (_0xedda16) {
          const _0x2df046 = _0x139634[_0xedda16.nodeId],
            _0x4aaf19 = (_0x2df046?.cells || [])[_0xedda16.cellIndex],
            _0x5445a2 = !!_0xb39854 && !!_0x2df046 && (!!_0x2df046.isEditing || _isCellEmpty(_0x4aaf19));
          if (_0x5445a2) {
            const _0xe737c3 = _getNodeWrapperEl(_0x48fe54.id),
              _0x4dfeb1 = _0xe737c3 ? _0xe737c3.querySelector('img') : null,
              _0x3391a6 = resolveStoryboardPayloadDisplaySnapshot(_0xb39854, {
                visibleSrc: getImageElementDisplaySrc(_0x4dfeb1),
              });
            if (!_0x3391a6?.src) return { earlyCommit: false, didAct: false };
            const _0x47c48d = [...(_0x2df046.cells || [])],
              _0x1f5a44 = _0xb39854.storyboardExtractedCell === true,
              _0x9b15af = _0x1f5a44 && _isCellEmpty(_0x4aaf19),
              _0x3b7c88 = _0x9b15af
                ? {
                    ...(_0x4aaf19?.residualImageLocalPath
                      ? { residualImageLocalPath: _0x4aaf19.residualImageLocalPath }
                      : {}),
                    ...(_0x4aaf19?.residualImageUrl ? { residualImageUrl: _0x4aaf19.residualImageUrl } : {}),
                    ...(_0x4aaf19?.residualImageWidth
                      ? { residualImageWidth: _0x4aaf19.residualImageWidth }
                      : {}),
                    ...(_0x4aaf19?.residualImageHeight
                      ? { residualImageHeight: _0x4aaf19.residualImageHeight }
                      : {}),
                    ...(_0x4aaf19?.residualImageMode
                      ? { residualImageMode: _0x4aaf19.residualImageMode }
                      : {}),
                  }
                : {},
              _0x25be18 = getStoryboardCellMetrics(_0x2df046),
              _0x13ce09 = getStoryboardCellPixelBounds(_0x2df046, _0xedda16.cellIndex),
              _0x1a80a8 = Math.max(1, Math.round((_0x13ce09?.width || _0x25be18.cellWidth) * _0x2c1371.zoom)),
              _0x525510 = Math.max(
                1,
                Math.round((_0x13ce09?.height || _0x25be18.cellHeight) * _0x2c1371.zoom),
              ),
              _0x32b7f8 = _getStoryboardCellCenterWorldPoint(_0x2df046, _0xedda16.cellIndex),
              _0x39787d = _worldToScreen(_0x32b7f8.x, _0x32b7f8.y, _0x2c1371),
              _0x566ce9 = _createGhostFromImage(
                _0x4dfeb1,
                _0x1a80a8,
                _0x525510,
                _0x3391a6.src || _0xb39854.thumbUrl || _0xb39854.url || '',
              );
            ((_0x566ce9.style.transform =
              'translate(' + _0x3daa5e + 'px, ' + _0x44ef2a + 'px) translate(-50%, -50%)'),
              document.body.appendChild(_0x566ce9),
              requestAnimationFrame(() => {
                ((_0x566ce9.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)'),
                  (_0x566ce9.style.transform =
                    'translate(' + _0x39787d.x + 'px, ' + _0x39787d.y + 'px) translate(-50%, -50%)'));
              }));
            const _0x5c2a95 = buildFrozenStoryboardCellFromSnapshot(
              _0x3391a6,
              _0x2df046,
              _0xedda16.cellIndex,
              { id: _0x2f5e88('cell') },
            );
            ((_0x47c48d[_0xedda16.cellIndex] = { ..._0x5c2a95, ..._0x3b7c88 }),
              _0x547d7b.updateNodeData(_0x2df046.id, { cells: _0x47c48d }),
              _flushStoryboardNodesNow(_0x2df046.id),
              _persistStoryboardSnapshotPreviewToCell(
                _0x547d7b,
                _0x2df046.id,
                _0xedda16.cellIndex,
                _0x5c2a95?.id,
                _0x3391a6,
                _0x3391a6.fileName || 'storyboard_cell_' + _0x2df046.id + '_' + _0xedda16.cellIndex + '.jpg',
                saveOutputBlobImpl,
              ));
            const _0x42aca6 = () => {
              (_0x547d7b.setSelectedNodes([]), _0x547d7b.deleteNodes([_0x48fe54.id]));
            };
            return (
              typeof _0x547d7b.batch === 'function' ? _0x547d7b.batch(_0x42aca6) : _0x42aca6(),
              requestAnimationFrame(() => {
                setTimeout(() => _0x2f2170(), 0);
              }),
              _fadeOutGhost(_0x566ce9, 0),
              { earlyCommit: true, didAct: true }
            );
          }
        }
        const _0x2047da = _getCollageSlotInfoAt(_0x25ca3f, _0x5e2428, _0x139634);
        if (_0x2047da) {
          const _0x427ff7 = _0x139634[_0x2047da.nodeId],
            _0x24e670 = (_0x427ff7?.items || [])[_0x2047da.itemIndex];
          if (_0x427ff7 && (!!_0x427ff7.isEditing || isCollageItemEmpty(_0x24e670))) {
            const _0x270457 = _getNodeWrapperEl(_0x48fe54.id),
              _0x53170f = _0x270457 ? _0x270457.querySelector('img') : null,
              _0x4d0dbd = resolveCollagePayloadDisplaySnapshot(_0xb39854, {
                visibleSrc: getImageElementDisplaySrc(_0x53170f),
              });
            if (!_0x4d0dbd?.src) return { earlyCommit: false, didAct: false };
            const _0x4bb031 = _0x4d0dbd.localPath || '',
              _0x327fb0 = _0x4d0dbd.src;
            if (_0x327fb0) {
              let _0x4e7900 = null;
              const _0x2c8c81 = _getCollageItemFrameInfo(_0x427ff7, _0x2047da.itemIndex);
              if (typeof document !== 'undefined' && document.body && _0x2c8c81?.frame) {
                const _0x2c5c22 = Math.max(1, Math.round(_0x2c8c81.frame.width * _0x2c1371.zoom)),
                  _0x23e79c = Math.max(1, Math.round(_0x2c8c81.frame.height * _0x2c1371.zoom)),
                  _0x377202 = _getCollageItemCenterWorldPoint(_0x427ff7, _0x2047da.itemIndex),
                  _0x30120c = _worldToScreen(_0x377202.x, _0x377202.y, _0x2c1371);
                ((_0x4e7900 = _createGhostFromImage(_0x53170f, _0x2c5c22, _0x23e79c, _0x327fb0)),
                  (_0x4e7900.style.transform =
                    'translate(' + _0x3daa5e + 'px, ' + _0x44ef2a + 'px) translate(-50%, -50%)'),
                  document.body.appendChild(_0x4e7900),
                  requestAnimationFrame(() => {
                    ((_0x4e7900.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)'),
                      (_0x4e7900.style.transform =
                        'translate(' + _0x30120c.x + 'px, ' + _0x30120c.y + 'px) translate(-50%, -50%)'));
                  }));
              }
              const _0x3c5c36 = [...(_0x427ff7.items || [])];
              _0x3c5c36[_0x2047da.itemIndex] = {
                ...(_0x24e670 || {}),
                id: _0x2f5e88('collage-item'),
                sourceNodeId: _0x48fe54.id,
                url: _0x327fb0,
                localPath: normalizeLocalPath(_0x4bb031),
                thumbLocalPath: normalizeLocalPath(_0x4d0dbd.thumbLocalPath),
                sourceLocalPath: '',
                sourceUrl: '',
                sourceWidth: null,
                sourceHeight: null,
                imageWidth: _0x4d0dbd.width || null,
                imageHeight: _0x4d0dbd.height || null,
                sourceDisplayWidth: _toPositiveNumber(_0x48fe54.width),
                sourceDisplayHeight: _toPositiveNumber(_0x48fe54.height),
                label: _0x48fe54.name || _0x48fe54.fileName || '拼图图片',
                fit: 'cover',
                focusX: 0.5,
                focusY: 0.5,
                isEmpty: false,
              };
              const _0x57b063 = window.v2Renderer?.nodeInstances?.get(_0x427ff7.id);
              _0x57b063 && typeof _0x57b063.previewItems === 'function' && _0x57b063.previewItems(_0x3c5c36);
              const _0x299f9c = () => {
                (_0x547d7b.updateNodeData(_0x427ff7.id, { items: _0x3c5c36 }),
                  _0x547d7b.setSelectedNodes([_0x427ff7.id]),
                  _0x547d7b.deleteNodes([_0x48fe54.id]));
              };
              if (typeof _0x547d7b.batch === 'function') _0x547d7b.batch(_0x299f9c);
              else _0x299f9c();
              return (
                requestAnimationFrame(() => {
                  _0x2f2170();
                }),
                _0x4e7900 &&
                  _waitForCollageItemImage(_0x427ff7.id, _0x2047da.itemIndex, _0x327fb0, () =>
                    _fadeOutGhost(_0x4e7900),
                  ),
                _0x57b063 && typeof _0x57b063.highlightSlot === 'function' && _0x57b063.highlightSlot(-1),
                { earlyCommit: true, didAct: true }
              );
            }
          }
        }
      }
    }
    let _0x5ebbde = false;
    (_0x532a50.pendingDx || _0x532a50.pendingDy) &&
      ((_0x532a50.isCommittingDrag = true),
      _0x471870.includes(_0x532a50.targetNodeId)
        ? _0x547d7b.moveNodes(_0x471870, _0x532a50.pendingDx, _0x532a50.pendingDy)
        : _0x547d7b.updateNodePosition(_0x532a50.targetNodeId, _0x532a50.pendingDx, _0x532a50.pendingDy),
      _0x105b00.forEach((_0x27f56a) => {
        const _0xe6296a = _getNodeWrapperEl(_0x27f56a);
        _0xe6296a &&
          (_0xe6296a.classList.remove('is-ui-hidden'),
          _0xe6296a.classList.remove('is-dragging'),
          delete _0xe6296a.style.transform,
          delete _0xe6296a._posKey);
      }),
      (_0x532a50.pendingDx = 0),
      (_0x532a50.pendingDy = 0),
      _clearDragEdgeTransformPreview(_0x532a50),
      (_0x5ebbde = true));
    const _0x5df022 = _0x547d7b.getStateRaw(),
      _0x27589e = collectGroupContainmentReparentOps(_0x5df022.nodes, _0x105b00);
    return (
      _0x27589e.length > 0 &&
        (_0x547d7b.batch(() => {
          _0x27589e.forEach(({ nodeId: _0x519168, parentId: _0x2105db }) => {
            _0x547d7b.groupNodes([_0x519168], _0x2105db);
          });
        }),
        (_0x5ebbde = true)),
      { earlyCommit: false, didAct: _0x5ebbde }
    );
  }
  return {
    tryStartTitleDrag: _0x4303f6,
    tryStartNodeDrag: _0x245540,
    updateDraggingCell: _0x4c0820,
    updateDraggingNodes: _0xd5ae71,
    finishDraggingCell: _0x444ae9,
    finishDraggingNodes: _0xdc9318,
  };
}
