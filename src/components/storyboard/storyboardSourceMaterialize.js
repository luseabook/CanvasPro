import { generateId } from '../../core/math.js';
import {
  buildStoryboardCropRect,
  detachStoryboardCellSourceContext,
  isStoryboardCellEmpty,
  resolveStoryboardCellPreviewSrc,
  resolveStoryboardCellSourceIndex,
} from '../../core/storyboardCellUtils.js';
import {
  getStoryboardCellCommitSourceUrl,
  getStoryboardCellSourceImageUrl,
  isStoryboardCellSourceCropRequired,
} from './storyboardAssetRefs.js';
function drawStoryboardCropToDataUrl(_0x1e2061, _0x23c419) {
  const _0x175c99 = document.createElement('canvas');
  if (!_0x175c99 || typeof _0x175c99.getContext !== 'function') return '';
  ((_0x175c99.width = _0x23c419.sw), (_0x175c99.height = _0x23c419.sh));
  const _0x10db83 = _0x175c99.getContext('2d', { alpha: false });
  if (!_0x10db83 || typeof _0x10db83.drawImage !== 'function') return '';
  ((_0x10db83.imageSmoothingEnabled = true),
    (_0x10db83.imageSmoothingQuality = 'high'),
    _0x10db83.drawImage(
      _0x1e2061,
      _0x23c419.sx,
      _0x23c419.sy,
      _0x23c419.sw,
      _0x23c419.sh,
      0,
      0,
      _0x23c419.sw,
      _0x23c419.sh,
    ));
  const _0x21b932 = _0x175c99.toDataURL('image/jpeg', 0.9);
  return String(_0x21b932 || '').startsWith('data:image/') ? _0x21b932 : '';
}
export function buildStoryboardMaterializedCellCrop({
  cell: _0x42bc2a,
  index: _0x4701f4,
  img: _0x215ca4,
  sourceNode: _0x4b8ea8,
} = {}) {
  if (!_0x215ca4 || typeof document === 'undefined') return null;
  const _0x1fb6e9 = Math.max(1, Math.trunc(Number(_0x215ca4.naturalWidth) || 0)),
    _0x63a532 = Math.max(1, Math.trunc(Number(_0x215ca4.naturalHeight) || 0));
  if (_0x1fb6e9 <= 0 || _0x63a532 <= 0) return null;
  const _0x3acbde = resolveStoryboardCellSourceIndex(_0x42bc2a, _0x4701f4, _0x4b8ea8),
    _0x114d66 = buildStoryboardCropRect(_0x4b8ea8, _0x3acbde, {
      width: _0x1fb6e9,
      height: _0x63a532,
      inset: 0,
    });
  if (!_0x114d66 || _0x114d66.sw <= 0 || _0x114d66.sh <= 0) return null;
  try {
    const _0x3d4c97 = drawStoryboardCropToDataUrl(_0x215ca4, _0x114d66);
    if (!_0x3d4c97) return null;
    return {
      capturePreviewUrl: _0x3d4c97,
      fileName: _0x42bc2a?.fileName || 'storyboard_piece_' + generateId('storyboard-cell') + '.jpg',
      originalWidth: _0x114d66.sw,
      originalHeight: _0x114d66.sh,
      imageWidth: _0x114d66.sw,
      imageHeight: _0x114d66.sh,
      w: _0x114d66.sw,
      h: _0x114d66.sh,
    };
  } catch {
    return null;
  }
}
export function materializeStoryboardSourceBackedCellsForEditing({
  node: _0x22a5ae,
  cells: _0x51955f,
  getLoadedSourceImageForCell: _0x175295,
} = {}) {
  const _0x1ced46 = Array.isArray(_0x51955f) ? _0x51955f : [];
  let _0x57d441 = false;
  const _0x416692 = _0x22a5ae,
    _0x510498 = _0x1ced46.map((_0x3abb9c, _0x3dedbd) => {
      const _0x32d870 = getStoryboardCellSourceImageUrl(_0x3abb9c);
      if (!_0x32d870 || isStoryboardCellEmpty(_0x3abb9c)) return _0x3abb9c;
      const _0x3271e0 = _0x175295(_0x3dedbd, _0x32d870),
        _0x528744 = buildStoryboardMaterializedCellCrop({
          cell: _0x3abb9c,
          index: _0x3dedbd,
          img: _0x3271e0,
          sourceNode: _0x416692,
        }),
        _0x5b1717 = !!(_0x528744?.capturePreviewUrl || resolveStoryboardCellPreviewSrc(_0x3abb9c));
      if (!_0x5b1717) return _0x3abb9c;
      return (
        (_0x57d441 = true),
        detachStoryboardCellSourceContext(
          {
            ...(_0x3abb9c && typeof _0x3abb9c === 'object' ? _0x3abb9c : {}),
            ...(_0x528744 || {}),
            localPath: _0x528744?.capturePreviewUrl ? null : _0x3abb9c.localPath || null,
            originalLocalPath: _0x528744?.capturePreviewUrl ? null : _0x3abb9c.originalLocalPath || null,
            displayLocalPath: _0x528744?.capturePreviewUrl ? '' : _0x3abb9c.displayLocalPath || '',
            thumbLocalPath: _0x528744?.capturePreviewUrl ? '' : _0x3abb9c.thumbLocalPath || '',
            thumbUrl: _0x528744?.capturePreviewUrl ? '' : _0x3abb9c.thumbUrl || '',
            thumbId: null,
            storyboardSourceIndex: resolveStoryboardCellSourceIndex(_0x3abb9c, _0x3dedbd, _0x416692),
            storyboardLockedCell: true,
            isEmpty: false,
          },
          { locked: true, extracted: _0x3abb9c.storyboardExtractedCell === true },
        )
      );
    });
  return _0x57d441 ? _0x510498 : null;
}
export async function cropStoryboardCellFromSource({
  cell: _0x43df0f,
  index: _0x1641f8,
  sourceNode: _0x3e5668,
  imageCache: _0x247c57,
  resolveSourceImage: _0x5494a2,
} = {}) {
  const _0x1417cd = getStoryboardCellCommitSourceUrl(_0x43df0f, _0x3e5668);
  if (!_0x1417cd) {
    if (isStoryboardCellSourceCropRequired(_0x43df0f)) return { cell: _0x43df0f, ok: false, skipped: false };
    return { cell: _0x43df0f, ok: true, skipped: true };
  }
  const _0x933f98 = await _0x5494a2(_0x1641f8, _0x1417cd, _0x247c57);
  if (!_0x933f98) return { cell: _0x43df0f, ok: false, skipped: false };
  const _0x5b31c6 = resolveStoryboardCellSourceIndex(_0x43df0f, _0x1641f8, _0x3e5668),
    _0x7e5ff4 = buildStoryboardCropRect(_0x3e5668, _0x5b31c6, {
      width: _0x933f98.naturalWidth,
      height: _0x933f98.naturalHeight,
      inset: 0,
    });
  if (!_0x7e5ff4 || _0x7e5ff4.sw <= 0 || _0x7e5ff4.sh <= 0)
    return { cell: _0x43df0f, ok: false, skipped: false };
  let _0x68f81b = '';
  try {
    _0x68f81b = drawStoryboardCropToDataUrl(_0x933f98, _0x7e5ff4);
  } catch {
    _0x68f81b = '';
  }
  if (!_0x68f81b) return { cell: _0x43df0f, ok: false, skipped: false };
  const _0x26ff83 = detachStoryboardCellSourceContext(
    {
      ...(_0x43df0f && typeof _0x43df0f === 'object' ? _0x43df0f : {}),
      url: '',
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: '',
      thumbLocalPath: '',
      thumbUrl: '',
      thumbId: null,
      capturePreviewUrl: _0x68f81b,
      fileName: 'storyboard_cell_' + generateId('storyboard-cell') + '.jpg',
      originalWidth: _0x7e5ff4.sw,
      originalHeight: _0x7e5ff4.sh,
      imageWidth: _0x7e5ff4.sw,
      imageHeight: _0x7e5ff4.sh,
      w: _0x7e5ff4.sw,
      h: _0x7e5ff4.sh,
      storyboardPiece: true,
      storyboardSourceIndex: _0x5b31c6,
      storyboardLockedCell: true,
      storyboardExtractedCell: false,
      isEmpty: false,
    },
    { locked: true, extracted: false },
  );
  return { cell: _0x26ff83, ok: true, skipped: false };
}
export async function materializeStoryboardCellsForConfirmedGrid({
  node: _0xc848a3,
  gridLayout: _0x44bbb9,
  gridGap: _0x58fbfd,
  cellsOverride: cellsOverride = null,
  cropCell: _0x123f80,
} = {}) {
  const _0x5da144 = Array.isArray(cellsOverride)
    ? cellsOverride
    : Array.isArray(_0xc848a3?.cells)
      ? _0xc848a3.cells
      : [];
  if (!Array.isArray(_0x5da144) || _0x5da144.length <= 0) return { cells: _0x5da144, partialFailure: false };
  const _0x459de2 = { ..._0xc848a3, gridLayout: _0x44bbb9, gridGap: _0x58fbfd },
    _0x25d128 = new Map(),
    _0x58825c = [],
    _0x5a21d8 = [..._0x5da144];
  for (let _0x9c5ac5 = 0; _0x9c5ac5 < _0x5da144.length; _0x9c5ac5 += 1) {
    const _0x5018a9 = _0x5da144[_0x9c5ac5];
    if (isStoryboardCellEmpty(_0x5018a9)) continue;
    const _0xd73126 = await _0x123f80(_0x5018a9, _0x9c5ac5, _0x459de2, _0x25d128);
    if (!_0xd73126.ok && !_0xd73126.skipped) {
      _0x58825c.push(_0x9c5ac5);
      continue;
    }
    _0x5a21d8[_0x9c5ac5] = _0xd73126.cell;
  }
  const _0x42ca5f = _0x58825c.length === 0;
  return { ok: _0x42ca5f, cells: _0x42ca5f ? _0x5a21d8 : _0x5da144, failedIndices: _0x58825c };
}
