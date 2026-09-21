const STORYBOARD_CELL_GAP = 0,
  STORYBOARD_CELL_INSET = 1.5,
  STORYBOARD_MIN_TRACK_WEIGHT = 0.2;
export const STORYBOARD_GRID_GAP_MAX = 80;
function _trimString(_0x4cae0f) {
  return typeof _0x4cae0f === 'string' ? _0x4cae0f.trim() : '';
}
function _normalizeLocalPath(_0xd3dc6b) {
  const _0x38c667 = _trimString(_0xd3dc6b);
  if (!_0x38c667) return '';
  return _0x38c667.startsWith('/') ? _0x38c667 : '/' + _0x38c667;
}
function _toPositiveNumber(_0x5f21e5) {
  const _0x5ddf37 = Number(_0x5f21e5);
  return Number.isFinite(_0x5ddf37) && _0x5ddf37 > 0 ? _0x5ddf37 : null;
}
function _isUsableNonDataSrc(_0x9a0a96) {
  const _0x1d6cb2 = _trimString(_0x9a0a96);
  return !!_0x1d6cb2 && !_0x1d6cb2.startsWith('data:');
}
function _isUsablePreviewSrc(_0x262b46) {
  return !!_trimString(_0x262b46);
}
function _getSafeGridCount(_0x334370) {
  const _0xb056ee = Math.round(Number(_0x334370) || 0);
  return Math.max(1, _0xb056ee);
}
export function resolveStoryboardCellSourceIndex(_0x59cdcb, _0x1ad950, _0xffb840 = null) {
  const _0x3ec7ca = Math.trunc(Number(_0x1ad950)),
    _0x1d7265 = Number.isInteger(_0x3ec7ca) && _0x3ec7ca >= 0 ? _0x3ec7ca : 0,
    _0x43c914 = Math.trunc(Number(_0x59cdcb?.storyboardSourceIndex)),
    _0x3b14f8 = _getSafeGridCount(_0xffb840?.cols) * _getSafeGridCount(_0xffb840?.rows),
    _0x124e9c = Number.isInteger(_0x43c914) && _0x43c914 >= 0 ? _0x43c914 : _0x1d7265;
  if (!Number.isInteger(_0x124e9c) || _0x124e9c < 0) return _0x1d7265;
  if (_0xffb840 && _0x124e9c >= _0x3b14f8) return _0x1d7265;
  return _0x124e9c;
}
function _clamp(_0x4606eb, _0x1d5005, _0x2f5ff0) {
  return Math.min(Math.max(_0x4606eb, _0x1d5005), _0x2f5ff0);
}
function _roundTrackWeight(_0x3d5e36) {
  return Math.round(_0x3d5e36 * 0x2710) / 0x2710;
}
function _getTrackTotal(_0x4b1ba0) {
  return _0x4b1ba0.reduce((_0x486c20, _0x5220f7) => _0x486c20 + _0x5220f7, 0);
}
function _getEqualTracks(_0x39496b) {
  return Array.from({ length: _0x39496b }, () => 1);
}
export function resolveStoryboardGridTracks(_0x12828b, _0x3bd8c7) {
  const _0x1480d3 = _getSafeGridCount(_0x3bd8c7);
  if (!Array.isArray(_0x12828b) || _0x12828b.length !== _0x1480d3) return _getEqualTracks(_0x1480d3);
  const _0x456db4 = _0x12828b.map((_0xe43c2a) => Number(_0xe43c2a));
  if (_0x456db4.some((_0x146690) => !Number.isFinite(_0x146690) || _0x146690 < STORYBOARD_MIN_TRACK_WEIGHT))
    return _getEqualTracks(_0x1480d3);
  const _0x1801f8 = _getTrackTotal(_0x456db4);
  if (!Number.isFinite(_0x1801f8) || _0x1801f8 <= 0) return _getEqualTracks(_0x1480d3);
  const _0x5b1ac0 = _0x1480d3 / _0x1801f8;
  return _0x456db4.map((_0x1264b5) => _roundTrackWeight(_0x1264b5 * _0x5b1ac0));
}
export function resolveStoryboardGridLayout(_0x1f41d3) {
  const _0x4ff5a3 = _getSafeGridCount(_0x1f41d3?.cols),
    _0x35341e = _getSafeGridCount(_0x1f41d3?.rows),
    _0x30c450 = _0x1f41d3?.gridLayout && typeof _0x1f41d3.gridLayout === 'object' ? _0x1f41d3.gridLayout : {};
  return {
    cols: _0x4ff5a3,
    rows: _0x35341e,
    columns: resolveStoryboardGridTracks(_0x30c450.columns, _0x4ff5a3),
    rowTracks: resolveStoryboardGridTracks(_0x30c450.rows, _0x35341e),
  };
}
export function normalizeStoryboardGridGap(_0x564976, _0x43d64b = STORYBOARD_CELL_GAP) {
  const _0x2df243 = Number(_0x564976),
    _0x85eeaa = Number(_0x43d64b),
    _0x3d8dd6 = Number.isFinite(_0x2df243) ? _0x2df243 : Number.isFinite(_0x85eeaa) ? _0x85eeaa : 0;
  return Math.round(_clamp(_0x3d8dd6, 0, STORYBOARD_GRID_GAP_MAX));
}
export function buildStoryboardGridTemplate(_0x3ded85, _0x5176c6) {
  return resolveStoryboardGridTracks(_0x3ded85, _0x5176c6)
    .map((_0x3b905a) => _roundTrackWeight(_0x3b905a) + 'fr')
    .join(' ');
}
export function getStoryboardGridDividerPositions(_0x5ef06, _0x4a224b = {}) {
  if (!_0x5ef06 || typeof _0x5ef06 !== 'object') return { vertical: [], horizontal: [] };
  const _0x18eb15 = resolveStoryboardGridLayout(_0x5ef06),
    _0x5037d6 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(_0x4a224b, 'width') ? _0x4a224b.width : _0x5ef06.width) ||
        0,
    ),
    _0x24b67c = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(_0x4a224b, 'height') ? _0x4a224b.height : _0x5ef06.height,
      ) || 0,
    ),
    _0x57fbda = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(_0x4a224b, 'inset') ? _0x4a224b.inset : STORYBOARD_CELL_INSET,
      ) || 0,
    ),
    _0x2426b6 = Math.max(0, _0x5037d6 - _0x57fbda * 2),
    _0x50cb52 = Math.max(0, _0x24b67c - _0x57fbda * 2),
    _0x2f236b = (_0x250c6b, _0x1a6c99) => {
      const _0x51bfaf = _getTrackTotal(_0x250c6b);
      if (_0x51bfaf <= 0 || _0x1a6c99 <= 0) return [];
      const _0x2fe763 = [];
      let _0x4663d7 = 0;
      for (let _0x2735bc = 0; _0x2735bc < _0x250c6b.length - 1; _0x2735bc++) {
        _0x4663d7 += _0x250c6b[_0x2735bc];
        const _0x4508b8 = _0x4663d7 / _0x51bfaf;
        _0x2fe763.push({ index: _0x2735bc, ratio: _0x4508b8, position: _0x57fbda + _0x4508b8 * _0x1a6c99 });
      }
      return _0x2fe763;
    };
  return {
    vertical: _0x2f236b(_0x18eb15.columns, _0x2426b6),
    horizontal: _0x2f236b(_0x18eb15.rowTracks, _0x50cb52),
    cols: _0x18eb15.cols,
    rows: _0x18eb15.rows,
    width: _0x5037d6,
    height: _0x24b67c,
    inset: _0x57fbda,
    innerWidth: _0x2426b6,
    innerHeight: _0x50cb52,
  };
}
export function getStoryboardScaledGridGap(_0x228ab8, _0x611c1d = {}) {
  const _0x3bb0a3 = normalizeStoryboardGridGap(_0x228ab8?.gridGap),
    _0x37584a = Math.max(0, Number(_0x611c1d.width) || 0),
    _0x5cdafa = Math.max(0, Number(_0x611c1d.height) || 0),
    _0x1ff11b = Math.max(1, Number(_0x611c1d.nodeWidth ?? _0x228ab8?.width ?? _0x37584a) || _0x37584a || 1),
    _0xed4e7b = Math.max(1, Number(_0x611c1d.nodeHeight ?? _0x228ab8?.height ?? _0x5cdafa) || _0x5cdafa || 1);
  return {
    x: _0x37584a > 0 ? _0x3bb0a3 * (_0x37584a / _0x1ff11b) : _0x3bb0a3,
    y: _0x5cdafa > 0 ? _0x3bb0a3 * (_0x5cdafa / _0xed4e7b) : _0x3bb0a3,
  };
}
function _getTrackBounds(_0x4687dc, _0x5ec0d2, _0x47549f, _0xf4b887) {
  const _0x105b8d = _getTrackTotal(_0x4687dc);
  if (_0x105b8d <= 0 || _0x47549f <= 0) return { start: 0, end: 0 };
  let _0x9e417c = 0;
  for (let _0x5e9ef7 = 0; _0x5e9ef7 < _0x4687dc.length; _0x5e9ef7++) {
    const _0xa57e40 = (_0x4687dc[_0x5e9ef7] / _0x105b8d) * _0x47549f,
      _0x591c0b = _0x9e417c,
      _0x3ec312 = _0x9e417c + _0xa57e40;
    if (_0x5e9ef7 === _0x5ec0d2) return { start: _0x591c0b, end: _0x3ec312 };
    _0x9e417c = _0x3ec312 + Math.max(0, _0xf4b887);
  }
  return { start: 0, end: 0 };
}
function _getCenteredGapTrackBounds(_0x18ff71, _0x533eb0, _0x252fb, _0x3eb2b2) {
  const _0x856434 = _getTrackTotal(_0x18ff71);
  if (_0x856434 <= 0 || _0x252fb <= 0) return { start: 0, end: 0 };
  const _0x1e5aa5 = Math.max(0, Number(_0x3eb2b2) || 0) / 2;
  let _0x4d4a38 = 0,
    _0x256bee = 0,
    _0x92ccc1 = _0x252fb;
  for (let _0x63873d = 0; _0x63873d < _0x18ff71.length - 1; _0x63873d++) {
    _0x4d4a38 += _0x18ff71[_0x63873d];
    const _0x3a9820 = (_0x4d4a38 / _0x856434) * _0x252fb;
    if (_0x63873d === _0x533eb0 - 1) _0x256bee = _0x3a9820;
    if (_0x63873d === _0x533eb0) {
      _0x92ccc1 = _0x3a9820;
      break;
    }
  }
  let _0x101fe7 = _0x533eb0 === 0 ? 0 : _0x256bee + _0x1e5aa5,
    _0x4dc8c7 = _0x533eb0 === _0x18ff71.length - 1 ? _0x252fb : _0x92ccc1 - _0x1e5aa5;
  ((_0x101fe7 = _clamp(_0x101fe7, 0, _0x252fb)), (_0x4dc8c7 = _clamp(_0x4dc8c7, 0, _0x252fb)));
  if (_0x4dc8c7 < _0x101fe7) {
    const _0x1a6700 = _clamp((_0x101fe7 + _0x4dc8c7) / 2, 0, _0x252fb);
    return { start: _0x1a6700, end: _0x1a6700 };
  }
  return { start: _0x101fe7, end: _0x4dc8c7 };
}
export function resolveStoryboardCellPreviewSrc(_0x1e87b1) {
  if (!_0x1e87b1 || typeof _0x1e87b1 !== 'object') return '';
  const _0x964309 = _normalizeLocalPath(_0x1e87b1.thumbLocalPath);
  if (_0x964309) return _0x964309;
  const _0x326c16 = _normalizeLocalPath(_0x1e87b1.displayLocalPath);
  if (_0x326c16) return _0x326c16;
  const _0x36ce5c = _normalizeLocalPath(_0x1e87b1.localPath);
  if (_0x36ce5c) return _0x36ce5c;
  if (_isUsablePreviewSrc(_0x1e87b1.capturePreviewUrl)) return _trimString(_0x1e87b1.capturePreviewUrl);
  if (_isUsableNonDataSrc(_0x1e87b1.thumbUrl)) return _trimString(_0x1e87b1.thumbUrl);
  if (_isUsableNonDataSrc(_0x1e87b1.url)) return _trimString(_0x1e87b1.url);
  return '';
}
export function resolveStoryboardCellAssetSrc(_0x4d4d38) {
  if (!_0x4d4d38 || typeof _0x4d4d38 !== 'object') return '';
  const _0x2b5b40 = _normalizeLocalPath(_0x4d4d38.localPath);
  if (_0x2b5b40) return _0x2b5b40;
  const _0x12de76 = _normalizeLocalPath(_0x4d4d38.originalLocalPath);
  if (_0x12de76) return _0x12de76;
  const _0x42829b = _normalizeLocalPath(_0x4d4d38.displayLocalPath);
  if (_0x42829b) return _0x42829b;
  const _0x3b3ec8 = _normalizeLocalPath(_0x4d4d38.thumbLocalPath);
  if (_0x3b3ec8) return _0x3b3ec8;
  if (_isUsablePreviewSrc(_0x4d4d38.capturePreviewUrl)) return _trimString(_0x4d4d38.capturePreviewUrl);
  if (_isUsableNonDataSrc(_0x4d4d38.url)) return _trimString(_0x4d4d38.url);
  if (_isUsableNonDataSrc(_0x4d4d38.thumbUrl)) return _trimString(_0x4d4d38.thumbUrl);
  return '';
}
export function isStoryboardCellEmpty(_0x226a9c) {
  if (!_0x226a9c || typeof _0x226a9c !== 'object') return true;
  if (_0x226a9c.isEmpty === true) return true;
  return !(
    _trimString(_0x226a9c.url) ||
    _trimString(_0x226a9c.localPath) ||
    _trimString(_0x226a9c.originalLocalPath) ||
    _trimString(_0x226a9c.displayLocalPath) ||
    _trimString(_0x226a9c.capturePreviewUrl) ||
    _trimString(_0x226a9c.thumbUrl) ||
    _trimString(_0x226a9c.thumbLocalPath) ||
    _trimString(_0x226a9c.thumbId) ||
    _trimString(_0x226a9c.sourceId) ||
    _trimString(_0x226a9c.sourceLocalPath) ||
    _trimString(_0x226a9c.sourceUrl)
  );
}
function _hasLocalStoryboardCellAsset(_0x1ad63f) {
  return !!(
    _trimString(_0x1ad63f?.localPath) ||
    _trimString(_0x1ad63f?.originalLocalPath) ||
    _trimString(_0x1ad63f?.displayLocalPath) ||
    _trimString(_0x1ad63f?.thumbLocalPath)
  );
}
function _hasStoryboardCellSwapAsset(_0x2adf40) {
  return !!(
    _hasLocalStoryboardCellAsset(_0x2adf40) ||
    _trimString(_0x2adf40?.capturePreviewUrl) ||
    _trimString(_0x2adf40?.url) ||
    _trimString(_0x2adf40?.thumbUrl)
  );
}
function _isSourceBackedStoryboardCell(_0x1a0e66) {
  return !!(
    _0x1a0e66?.storyboardSourceCrop === true ||
    _trimString(_0x1a0e66?.sourceLocalPath) ||
    _trimString(_0x1a0e66?.sourceUrl)
  );
}
export function isFrozenStoryboardDisplayCell(_0x343869) {
  if (!_0x343869 || typeof _0x343869 !== 'object' || isStoryboardCellEmpty(_0x343869)) return false;
  if (!resolveStoryboardCellAssetSrc(_0x343869)) return false;
  if (_0x343869.storyboardPiece === true && _0x343869.storyboardExtractedCell !== true) return false;
  if (_0x343869.storyboardExtractedCell === true || _0x343869.storyboardLockedCell === true) return true;
  return !_isSourceBackedStoryboardCell(_0x343869) && _0x343869.storyboardPiece !== true;
}
export function detachStoryboardCellSourceContext(_0x2ed024, _0x247415 = {}) {
  const _0x11870e = _0x2ed024 && typeof _0x2ed024 === 'object' ? { ..._0x2ed024 } : {},
    _0x4954f9 = _trimString(_0x11870e.pieceId) || _trimString(_0x11870e.id) || _trimString(_0x247415.pieceId);
  if (_0x4954f9) _0x11870e.pieceId = _0x4954f9;
  ((_0x11870e.sourceId = null),
    (_0x11870e.sourceLocalPath = null),
    (_0x11870e.sourceUrl = ''),
    (_0x11870e.sourceWidth = null),
    (_0x11870e.sourceHeight = null),
    (_0x11870e.storyboardSourceCrop = false),
    (_0x11870e.storyboardPiece = false));
  if (_0x247415.locked === true) _0x11870e.storyboardLockedCell = true;
  return (
    Object.prototype.hasOwnProperty.call(_0x247415, 'extracted') &&
      (_0x11870e.storyboardExtractedCell = _0x247415.extracted === true),
    _0x11870e
  );
}
export function cloneStoryboardCellForSwap(_0x1814d0) {
  const _0x71e819 = _0x1814d0 && typeof _0x1814d0 === 'object' ? { ..._0x1814d0 } : {};
  if (_hasLocalStoryboardCellAsset(_0x71e819)) {
    if (_trimString(_0x71e819.url).startsWith('data:')) _0x71e819.url = '';
    if (_trimString(_0x71e819.thumbUrl).startsWith('data:')) _0x71e819.thumbUrl = '';
  }
  return _0x71e819;
}
export function cloneStoryboardCellForSwapDestination(_0x15df02) {
  const _0x477d09 = cloneStoryboardCellForSwap(_0x15df02);
  if (
    _isSourceBackedStoryboardCell(_0x477d09) &&
    !isStoryboardCellEmpty(_0x477d09) &&
    _hasStoryboardCellSwapAsset(_0x477d09)
  )
    return detachStoryboardCellSourceContext(_0x477d09, {
      extracted: true,
      locked: _0x477d09.storyboardLockedCell === true,
    });
  return _0x477d09;
}
export function normalizeEmptyStoryboardCell(_0x336aec) {
  const _0x2cd330 = _trimString(_0x336aec?.sourceLocalPath),
    _0x3dd9d9 = _trimString(_0x336aec?.sourceUrl),
    _0x3a50dc =
      _trimString(_0x336aec?.localPath) ||
      _trimString(_0x336aec?.originalLocalPath) ||
      _trimString(_0x336aec?.displayLocalPath) ||
      _trimString(_0x336aec?.thumbLocalPath),
    _0x910c02 =
      _trimString(_0x336aec?.url) ||
      _trimString(_0x336aec?.capturePreviewUrl) ||
      _trimString(_0x336aec?.thumbUrl),
    _0x230054 = !!(_0x2cd330 || _0x3dd9d9),
    _0x179486 = _trimString(_0x336aec?.residualImageLocalPath) || _0x2cd330 || _0x3a50dc,
    _0x43af70 = _trimString(_0x336aec?.residualImageUrl) || _0x3dd9d9 || _0x910c02,
    _0x1455af =
      _trimString(_0x336aec?.residualImageMode) ||
      (_0x230054 ? 'source' : _0x179486 || _0x43af70 ? 'cell' : ''),
    _0x5c8848 = {
      ...(_0x336aec && typeof _0x336aec === 'object' ? _0x336aec : {}),
      url: '',
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: null,
      thumbUrl: '',
      thumbLocalPath: null,
      thumbId: null,
      sourceId: null,
      sourceLocalPath: null,
      sourceUrl: '',
      sourceWidth: null,
      sourceHeight: null,
      storyboardSourceCrop: false,
      storyboardPiece: false,
      storyboardLockedCell: false,
      residualImageLocalPath: _0x179486 || null,
      residualImageUrl: _0x43af70 || '',
      residualImageWidth:
        _toPositiveNumber(_0x336aec?.residualImageWidth) ||
        _toPositiveNumber(_0x336aec?.sourceWidth) ||
        _toPositiveNumber(_0x336aec?.originalWidth) ||
        _toPositiveNumber(_0x336aec?.imageWidth) ||
        null,
      residualImageHeight:
        _toPositiveNumber(_0x336aec?.residualImageHeight) ||
        _toPositiveNumber(_0x336aec?.sourceHeight) ||
        _toPositiveNumber(_0x336aec?.originalHeight) ||
        _toPositiveNumber(_0x336aec?.imageHeight) ||
        null,
      residualImageMode: _0x1455af,
      isEmpty: true,
    };
  return (
    _0x336aec &&
      Object.prototype.hasOwnProperty.call(_0x336aec, 'capturePreviewUrl') &&
      (_0x5c8848.capturePreviewUrl = ''),
    _0x336aec &&
      Object.prototype.hasOwnProperty.call(_0x336aec, 'storyboardExtractedCell') &&
      (_0x5c8848.storyboardExtractedCell = false),
    _0x5c8848
  );
}
export function getStoryboardCellMetrics(_0x4d4764) {
  const _0x50fc25 = _getSafeGridCount(_0x4d4764?.cols),
    _0x15b0ba = _getSafeGridCount(_0x4d4764?.rows),
    _0x71e0e3 = resolveStoryboardGridLayout(_0x4d4764),
    _0x1d17ce = STORYBOARD_CELL_GAP,
    _0x403c5b = Math.max(0, Number(_0x4d4764?.width) || 0),
    _0x27cacf = Math.max(0, Number(_0x4d4764?.height) || 0),
    _0xde7c73 = Math.max(0, _0x403c5b - STORYBOARD_CELL_INSET * 2),
    _0x32c82e = Math.max(0, _0x27cacf - STORYBOARD_CELL_INSET * 2),
    _0x319f93 = Math.max(0, (_0xde7c73 - (_0x50fc25 - 1) * _0x1d17ce) / _0x50fc25),
    _0x324e45 = Math.max(0, (_0x32c82e - (_0x15b0ba - 1) * _0x1d17ce) / _0x15b0ba);
  return {
    cols: _0x50fc25,
    rows: _0x15b0ba,
    width: _0x403c5b,
    height: _0x27cacf,
    gap: _0x1d17ce,
    inset: STORYBOARD_CELL_INSET,
    innerWidth: _0xde7c73,
    innerHeight: _0x32c82e,
    cellWidth: _0x319f93,
    cellHeight: _0x324e45,
    columnWeights: _0x71e0e3.columns,
    rowWeights: _0x71e0e3.rowTracks,
  };
}
export function getStoryboardCellBounds(_0x39d653, _0x164d86, _0x46fea7 = {}) {
  if (!_0x39d653 || typeof _0x39d653 !== 'object') return null;
  const _0xdb660e = resolveStoryboardGridLayout(_0x39d653),
    _0x4f4760 = Math.trunc(Number(_0x164d86));
  if (!Number.isInteger(_0x4f4760) || _0x4f4760 < 0) return null;
  if (_0x4f4760 >= _0xdb660e.cols * _0xdb660e.rows) return null;
  const _0xcfb352 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(_0x46fea7, 'width') ? _0x46fea7.width : _0x39d653.width) ||
        0,
    ),
    _0xc4d344 = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(_0x46fea7, 'height') ? _0x46fea7.height : _0x39d653.height,
      ) || 0,
    ),
    _0x1e4f59 = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(_0x46fea7, 'inset') ? _0x46fea7.inset : STORYBOARD_CELL_INSET,
      ) || 0,
    ),
    _0x72178e = Object.prototype.hasOwnProperty.call(_0x46fea7, 'gap'),
    _0x2b1860 = Object.prototype.hasOwnProperty.call(_0x46fea7, 'gapX'),
    _0x1cd360 = Object.prototype.hasOwnProperty.call(_0x46fea7, 'gapY'),
    _0x20552b = Math.max(
      0,
      Number(_0x72178e ? _0x46fea7.gap : normalizeStoryboardGridGap(_0x39d653.gridGap)) || 0,
    ),
    _0x9199f5 = Math.max(0, Number(_0x2b1860 ? _0x46fea7.gapX : _0x20552b) || 0),
    _0x9f104b = Math.max(0, Number(_0x1cd360 ? _0x46fea7.gapY : _0x20552b) || 0),
    _0x1a15f7 = _0x46fea7.gapMode !== 'track',
    _0x135478 = _0x46fea7.gapMode !== 'track',
    _0x4e5148 = Math.max(0, _0xcfb352 - _0x1e4f59 * 2),
    _0x3d57ba = Math.max(0, _0xc4d344 - _0x1e4f59 * 2),
    _0x2dfea6 = _0x1a15f7 ? _0x4e5148 : Math.max(0, _0x4e5148 - (_0xdb660e.cols - 1) * _0x9199f5),
    _0x1fc2ee = _0x135478 ? _0x3d57ba : Math.max(0, _0x3d57ba - (_0xdb660e.rows - 1) * _0x9f104b),
    _0x250df9 = _0x4f4760 % _0xdb660e.cols,
    _0x4fd1bc = Math.floor(_0x4f4760 / _0xdb660e.cols),
    _0x18207a = _0x1a15f7
      ? _getCenteredGapTrackBounds(_0xdb660e.columns, _0x250df9, _0x2dfea6, _0x9199f5)
      : _getTrackBounds(_0xdb660e.columns, _0x250df9, _0x2dfea6, _0x9199f5),
    _0x1a4bd7 = _0x135478
      ? _getCenteredGapTrackBounds(_0xdb660e.rowTracks, _0x4fd1bc, _0x1fc2ee, _0x9f104b)
      : _getTrackBounds(_0xdb660e.rowTracks, _0x4fd1bc, _0x1fc2ee, _0x9f104b),
    _0x37a344 = _0x1e4f59 + _0x18207a.start,
    _0x535696 = _0x1e4f59 + _0x18207a.end,
    _0xf51bd5 = _0x1e4f59 + _0x1a4bd7.start,
    _0x49d285 = _0x1e4f59 + _0x1a4bd7.end;
  return {
    col: _0x250df9,
    row: _0x4fd1bc,
    x0: _0x37a344,
    y0: _0xf51bd5,
    x1: _0x535696,
    y1: _0x49d285,
    width: Math.max(0, _0x535696 - _0x37a344),
    height: Math.max(0, _0x49d285 - _0xf51bd5),
  };
}
export function getStoryboardCellPixelBounds(_0xd36d0c, _0x3cccec, _0x1e7dd4 = {}) {
  const _0x3ca8d9 = getStoryboardCellBounds(_0xd36d0c, _0x3cccec, _0x1e7dd4);
  if (!_0x3ca8d9) return null;
  const _0x444c82 = resolveStoryboardGridLayout(_0xd36d0c),
    _0xbf97af = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(_0x1e7dd4, 'width') ? _0x1e7dd4.width : _0xd36d0c?.width) ||
        0,
    ),
    _0x49f0df = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(_0x1e7dd4, 'height') ? _0x1e7dd4.height : _0xd36d0c?.height,
      ) || 0,
    ),
    _0x40d77e = Math.max(
      0,
      Number(
        Object.prototype.hasOwnProperty.call(_0x1e7dd4, 'inset') ? _0x1e7dd4.inset : STORYBOARD_CELL_INSET,
      ) || 0,
    ),
    _0x178a6b = Math.floor(_0x40d77e),
    _0x39f49 = Math.floor(_0x40d77e),
    _0x136287 = Math.max(_0x178a6b, Math.ceil(_0xbf97af - _0x40d77e)),
    _0x59664d = Math.max(_0x39f49, Math.ceil(_0x49f0df - _0x40d77e));
  let _0x53f4f3 = _clamp(Math.floor(_0x3ca8d9.x0), _0x178a6b, _0x136287),
    _0x147b58 = _clamp(Math.floor(_0x3ca8d9.y0), _0x39f49, _0x59664d),
    _0x348a62 = _clamp(Math.ceil(_0x3ca8d9.x1), _0x178a6b, _0x136287),
    _0x561053 = _clamp(Math.ceil(_0x3ca8d9.y1), _0x39f49, _0x59664d);
  if (_0x3ca8d9.col <= 0) _0x53f4f3 = _0x178a6b;
  if (_0x3ca8d9.row <= 0) _0x147b58 = _0x39f49;
  if (_0x3ca8d9.col >= _0x444c82.cols - 1) _0x348a62 = _0x136287;
  if (_0x3ca8d9.row >= _0x444c82.rows - 1) _0x561053 = _0x59664d;
  if (_0x348a62 < _0x53f4f3) _0x348a62 = _0x53f4f3;
  if (_0x561053 < _0x147b58) _0x561053 = _0x147b58;
  return {
    ..._0x3ca8d9,
    x0: _0x53f4f3,
    y0: _0x147b58,
    x1: _0x348a62,
    y1: _0x561053,
    width: Math.max(0, _0x348a62 - _0x53f4f3),
    height: Math.max(0, _0x561053 - _0x147b58),
  };
}
export function buildStoryboardCropRect(_0x426cfb, _0x841b5e, _0x584b8b = {}) {
  if (!_0x426cfb || typeof _0x426cfb !== 'object') return null;
  const _0x964f26 = Math.max(1, Math.trunc(Number(_0x584b8b.width) || 0)),
    _0x13abc1 = Math.max(1, Math.trunc(Number(_0x584b8b.height) || 0));
  if (_0x964f26 <= 0 || _0x13abc1 <= 0) return null;
  const _0x15c7b8 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(_0x584b8b, 'inset') ? _0x584b8b.inset : 0) || 0,
    ),
    _0x5ab5c1 = Object.prototype.hasOwnProperty.call(_0x584b8b, 'gap'),
    _0x17a6db = Object.prototype.hasOwnProperty.call(_0x584b8b, 'gapX'),
    _0x3e2094 = Object.prototype.hasOwnProperty.call(_0x584b8b, 'gapY'),
    _0x22877f = getStoryboardScaledGridGap(_0x426cfb, { width: _0x964f26, height: _0x13abc1 }),
    _0x5d2a92 = _0x5ab5c1 ? Math.max(0, Number(_0x584b8b.gap) || 0) : undefined,
    _0x427aac = _0x17a6db ? Math.max(0, Number(_0x584b8b.gapX) || 0) : _0x5ab5c1 ? _0x5d2a92 : _0x22877f.x,
    _0x2d04b3 = _0x3e2094 ? Math.max(0, Number(_0x584b8b.gapY) || 0) : _0x5ab5c1 ? _0x5d2a92 : _0x22877f.y,
    _0xe3074f = getStoryboardCellPixelBounds(_0x426cfb, _0x841b5e, {
      width: _0x964f26,
      height: _0x13abc1,
      inset: _0x15c7b8,
      gapX: _0x427aac,
      gapY: _0x2d04b3,
      ...(Object.prototype.hasOwnProperty.call(_0x584b8b, 'gapMode') ? { gapMode: _0x584b8b.gapMode } : {}),
    });
  if (!_0xe3074f || _0xe3074f.width <= 0 || _0xe3074f.height <= 0) return null;
  const _0x331808 = _clamp(_0xe3074f.x0, 0, Math.max(0, _0x964f26 - 1)),
    _0x5ca25d = _clamp(_0xe3074f.y0, 0, Math.max(0, _0x13abc1 - 1)),
    _0x3c96eb = _clamp(_0xe3074f.x1, _0x331808 + 1, _0x964f26),
    _0x22d227 = _clamp(_0xe3074f.y1, _0x5ca25d + 1, _0x13abc1),
    _0x48e077 = Math.max(1, _0x3c96eb - _0x331808),
    _0x4bfe65 = Math.max(1, _0x22d227 - _0x5ca25d);
  return {
    sx: _0x331808,
    sy: _0x5ca25d,
    sw: _0x48e077,
    sh: _0x4bfe65,
    x0: _0x331808,
    y0: _0x5ca25d,
    x1: _0x3c96eb,
    y1: _0x22d227,
    width: _0x48e077,
    height: _0x4bfe65,
    bounds: _0xe3074f,
  };
}
export function getStoryboardCellIndexAtWorldPoint(_0x505963, _0xaa643b, _0x58cc75) {
  if (!_0x505963 || typeof _0x505963 !== 'object') return -1;
  const _0x1c4aaf = Number(_0x505963.x) || 0,
    _0x19ddfa = Number(_0x505963.y) || 0,
    _0x23f4db = _0xaa643b - _0x1c4aaf,
    _0x2e57cc = _0x58cc75 - _0x19ddfa,
    _0x5f2a8e = getStoryboardCellMetrics(_0x505963);
  if (_0x23f4db < 0 || _0x23f4db > _0x5f2a8e.width || _0x2e57cc < 0 || _0x2e57cc > _0x5f2a8e.height)
    return -1;
  const _0x3203f0 = _0x5f2a8e.cols * _0x5f2a8e.rows;
  for (let _0x59a18c = 0; _0x59a18c < _0x3203f0; _0x59a18c++) {
    const _0xaaba01 = getStoryboardCellPixelBounds(_0x505963, _0x59a18c);
    if (!_0xaaba01 || _0xaaba01.width <= 0 || _0xaaba01.height <= 0) continue;
    if (
      _0x23f4db >= _0xaaba01.x0 &&
      _0x23f4db <= _0xaaba01.x1 &&
      _0x2e57cc >= _0xaaba01.y0 &&
      _0x2e57cc <= _0xaaba01.y1
    )
      return _0x59a18c;
  }
  return -1;
}
export function getStoryboardNearestCellIndexAtWorldPoint(_0x2d8acb, _0x2e4132, _0x57c66a) {
  if (!_0x2d8acb || typeof _0x2d8acb !== 'object') return -1;
  const _0x4f2bc6 = getStoryboardCellIndexAtWorldPoint(_0x2d8acb, _0x2e4132, _0x57c66a);
  if (_0x4f2bc6 >= 0) return _0x4f2bc6;
  const _0x13b789 = Number(_0x2d8acb.x) || 0,
    _0x55f96c = Number(_0x2d8acb.y) || 0,
    _0x3ad63d = _0x2e4132 - _0x13b789,
    _0x5e127b = _0x57c66a - _0x55f96c,
    _0x1e7586 = getStoryboardCellMetrics(_0x2d8acb);
  if (_0x3ad63d < 0 || _0x3ad63d > _0x1e7586.width || _0x5e127b < 0 || _0x5e127b > _0x1e7586.height)
    return -1;
  const _0x440b9e = _0x1e7586.cols * _0x1e7586.rows;
  let _0x377cb3 = -1,
    _0x50117e = Infinity;
  for (let _0x2a7003 = 0; _0x2a7003 < _0x440b9e; _0x2a7003++) {
    const _0x4925d1 = getStoryboardCellPixelBounds(_0x2d8acb, _0x2a7003, { gap: 0 });
    if (!_0x4925d1 || _0x4925d1.width <= 0 || _0x4925d1.height <= 0) continue;
    if (
      _0x3ad63d >= _0x4925d1.x0 &&
      _0x3ad63d <= _0x4925d1.x1 &&
      _0x5e127b >= _0x4925d1.y0 &&
      _0x5e127b <= _0x4925d1.y1
    )
      return _0x2a7003;
    const _0x5b33fa = _0x4925d1.x0 + _0x4925d1.width / 2,
      _0x136d2b = _0x4925d1.y0 + _0x4925d1.height / 2,
      _0x386001 = (_0x3ad63d - _0x5b33fa) ** 2 + (_0x5e127b - _0x136d2b) ** 2;
    _0x386001 < _0x50117e && ((_0x50117e = _0x386001), (_0x377cb3 = _0x2a7003));
  }
  return _0x377cb3;
}
