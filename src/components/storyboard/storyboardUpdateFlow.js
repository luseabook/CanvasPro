export function normalizeStoryboardUpdateData(_0x386f33) {
  const _0x3dbad6 = _0x386f33 && typeof _0x386f33 === 'object' ? _0x386f33 : {};
  if (Array.isArray(_0x3dbad6.cells)) return _0x3dbad6;
  return { ..._0x3dbad6, cells: [] };
}
export function syncStoryboardToolbarLabels(_0x19da6d, _0x4fb4bc = {}, _0x529589 = {}) {
  const _0x3f0f69 = _0x19da6d?.querySelector?.('.act-aspect span'),
    _0x5375c3 = _0x19da6d?.querySelector?.('.act-grid span');
  (_0x3f0f69 &&
    _0x4fb4bc.aspectRatio !== _0x529589.aspectRatio &&
    (_0x3f0f69.textContent = '比例 ' + (_0x4fb4bc.aspectRatio || '1:1')),
    _0x5375c3 &&
      (_0x4fb4bc.cols !== _0x529589.cols || _0x4fb4bc.rows !== _0x529589.rows) &&
      (_0x5375c3.textContent = '网格 ' + (_0x4fb4bc.cols || 2) + '×' + (_0x4fb4bc.rows || 2)));
}
export function syncStoryboardEditingHint(_0x32625d, _0x487d4e) {
  const _0x5799f5 = _0x32625d?.querySelector?.('.v2-storyboard-hint');
  if (!_0x5799f5) return;
  _0x5799f5.textContent = _0x487d4e ? '拖拽单元格进行互换，或拖出生成新图' : '双击进入分镜编辑';
}
function getStoryboardCellUpdateKind(
  _0x3bc301,
  _0x2509fa,
  {
    isCellEmpty: _0x5a88b8,
    getCellDisplayImageUrl: _0xdb8ced,
    getCellSourceImageUrl: _0x520b9d,
    getCellLiveSourceImageUrl: _0x473001,
  } = {},
) {
  if (!_0x3bc301) return 'content';
  const _0x2a6a53 = _0xdb8ced?.(_0x3bc301),
    _0x39cc36 = _0xdb8ced?.(_0x2509fa),
    _0x209ffe = _0x5a88b8?.(_0x3bc301),
    _0x44e2a7 = _0x5a88b8?.(_0x2509fa);
  if (_0x209ffe !== _0x44e2a7 || _0x39cc36 !== _0x2a6a53) return 'content';
  const _0x2b317e = _0x520b9d?.(_0x3bc301),
    _0x1dd4c0 = _0x520b9d?.(_0x2509fa),
    _0x5e6866 = _0x473001?.(_0x3bc301),
    _0x50e6ff = _0x473001?.(_0x2509fa);
  if (
    _0x2b317e !== _0x1dd4c0 ||
    _0x5e6866 !== _0x50e6ff ||
    _0x3bc301?.storyboardSourceIndex !== _0x2509fa?.storyboardSourceIndex ||
    _0x3bc301?.storyboardSourceCrop !== _0x2509fa?.storyboardSourceCrop ||
    _0x3bc301?.storyboardPiece !== _0x2509fa?.storyboardPiece ||
    _0x3bc301?.storyboardLockedCell !== _0x2509fa?.storyboardLockedCell ||
    _0x3bc301?.sourceWidth !== _0x2509fa?.sourceWidth ||
    _0x3bc301?.sourceHeight !== _0x2509fa?.sourceHeight
  )
    return 'crop';
  return 'none';
}
export function updateStoryboardCellsForDataChange({
  cellEls: _0x4f5077,
  newCells: _0x516c64,
  oldCells: _0x540c13,
  buildReusableImageMap: _0x51aa12,
  updateCellDOM: _0x35a98d,
  applyCellCropStyles: _0x59c2ff,
  renderCells: _0x39175d,
  accessors: _0x2f051a,
} = {}) {
  if (!_0x4f5077 || _0x4f5077.length !== _0x516c64.length) {
    _0x39175d?.();
    return;
  }
  const _0x3eb410 = _0x51aa12?.() || null;
  _0x516c64.forEach((_0x3c51a2, _0x3ddbbd) => {
    const _0x243932 = getStoryboardCellUpdateKind(_0x540c13[_0x3ddbbd], _0x3c51a2, _0x2f051a);
    if (_0x243932 === 'content') _0x35a98d?.(_0x4f5077[_0x3ddbbd], _0x3c51a2, _0x3eb410);
    else _0x243932 === 'crop' && _0x59c2ff?.(_0x4f5077[_0x3ddbbd], _0x3c51a2, _0x3ddbbd);
  });
}
