const STORYBOARD_CELL_GAP = 0,
  STORYBOARD_CELL_INSET = 1.5,
  STORYBOARD_MIN_TRACK_WEIGHT = 0.2;
export const STORYBOARD_GRID_GAP_MAX = 80;
function _trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function _normalizeLocalPath(item) {
  const _trimString2 = _trimString(item);
  if (!_trimString2) return '';
  return _trimString2.startsWith('/') ? _trimString2 : '/' + _trimString2;
}
function _toPositiveNumber(key) {
  const count = Number(key);
  return Number.isFinite(count) && count > 0 ? count : null;
}
function _isUsableNonDataSrc(index) {
  const _trimString3 = _trimString(index);
  return !!_trimString3 && !_trimString3.startsWith('data:');
}
function _isUsablePreviewSrc(result) {
  return !!_trimString(result);
}
function _getSafeGridCount(data) {
  const options = Math.round(Number(data) || 0);
  return Math.max(1, options);
}
export function resolveStoryboardCellSourceIndex(target, source, next = null) {
  const count2 = Math.trunc(Number(source)),
    current = Number.isInteger(count2) && count2 >= 0 ? count2 : 0,
    count3 = Math.trunc(Number(target?.storyboardSourceIndex)),
    _getSafeGridCount2 = _getSafeGridCount(next?.cols) * _getSafeGridCount(next?.rows),
    count4 = Number.isInteger(count3) && count3 >= 0 ? count3 : current;
  if (!Number.isInteger(count4) || count4 < 0) return current;
  if (next && count4 >= _getSafeGridCount2) return current;
  return count4;
}
function _clamp(entry, record, payload) {
  return Math.min(Math.max(entry, record), payload);
}
function _roundTrackWeight(handle) {
  return Math.round(handle * 10000) / 10000;
}
function _getTrackTotal(list) {
  return list.reduce((item2, state) => item2 + state, 0);
}
function _getEqualTracks(length) {
  return Array.from({ length: length }, () => 1);
}
export function resolveStoryboardGridTracks(list2, config) {
  const _getSafeGridCount3 = _getSafeGridCount(config);
  if (!Array.isArray(list2) || list2.length !== _getSafeGridCount3)
    return _getEqualTracks(_getSafeGridCount3);
  const list3 = list2.map((item3) => Number(item3));
  if (list3.some((item4) => !Number.isFinite(item4) || item4 < STORYBOARD_MIN_TRACK_WEIGHT))
    return _getEqualTracks(_getSafeGridCount3);
  const _getTrackTotal2 = _getTrackTotal(list3);
  if (!Number.isFinite(_getTrackTotal2) || _getTrackTotal2 <= 0) return _getEqualTracks(_getSafeGridCount3);
  const scope = _getSafeGridCount3 / _getTrackTotal2;
  return list3.map((item5) => _roundTrackWeight(item5 * scope));
}
export function resolveStoryboardGridLayout(input) {
  const cols = _getSafeGridCount(input?.cols),
    rows = _getSafeGridCount(input?.rows),
    output = input?.gridLayout && typeof input.gridLayout === 'object' ? input.gridLayout : {};
  return {
    cols: cols,
    rows: rows,
    columns: resolveStoryboardGridTracks(output.columns, cols),
    rowTracks: resolveStoryboardGridTracks(output.rows, rows),
  };
}
export function normalizeStoryboardGridGap(value2, value3 = STORYBOARD_CELL_GAP) {
  const value4 = Number(value2),
    value5 = Number(value3),
    value6 = Number.isFinite(value4) ? value4 : Number.isFinite(value5) ? value5 : 0;
  return Math.round(_clamp(value6, 0, STORYBOARD_GRID_GAP_MAX));
}
export function buildStoryboardGridTemplate(value7, value8) {
  return resolveStoryboardGridTracks(value7, value8)
    .map((item6) => _roundTrackWeight(item6) + 'fr')
    .join(' ');
}
export function getStoryboardGridDividerPositions(box, box2 = {}) {
  if (!box || typeof box !== 'object') return { vertical: [], horizontal: [] };
  const cols2 = resolveStoryboardGridLayout(box),
    width = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box2, 'width') ? box2.width : box.width) || 0,
    ),
    height = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box2, 'height') ? box2.height : box.height) || 0,
    ),
    position = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box2, 'inset') ? box2.inset : STORYBOARD_CELL_INSET) || 0,
    ),
    innerWidth = Math.max(0, width - position * 2),
    innerHeight = Math.max(0, height - position * 2),
    vertical = (list4, count5) => {
      const _getTrackTotal3 = _getTrackTotal(list4);
      if (_getTrackTotal3 <= 0 || count5 <= 0) return [];
      const list5 = [];
      let value9 = 0;
      for (let index2 = 0; index2 < list4.length - 1; index2++) {
        value9 += list4[index2];
        const ratio = value9 / _getTrackTotal3;
        list5.push({ index: index2, ratio: ratio, position: position + ratio * count5 });
      }
      return list5;
    };
  return {
    vertical: vertical(cols2.columns, innerWidth),
    horizontal: vertical(cols2.rowTracks, innerHeight),
    cols: cols2.cols,
    rows: cols2.rows,
    width: width,
    height: height,
    inset: position,
    innerWidth: innerWidth,
    innerHeight: innerHeight,
  };
}
export function getStoryboardScaledGridGap(box3, box4 = {}) {
  const storyboardGridGap = normalizeStoryboardGridGap(box3?.gridGap),
    x = Math.max(0, Number(box4.width) || 0),
    y = Math.max(0, Number(box4.height) || 0),
    value10 = Math.max(1, Number(box4.nodeWidth ?? box3?.width ?? x) || x || 1),
    value11 = Math.max(1, Number(box4.nodeHeight ?? box3?.height ?? y) || y || 1);
  return {
    x: x > 0 ? storyboardGridGap * (x / value10) : storyboardGridGap,
    y: y > 0 ? storyboardGridGap * (y / value11) : storyboardGridGap,
  };
}
function _getTrackBounds(list6, value12, count6, value13) {
  const _getTrackTotal4 = _getTrackTotal(list6);
  if (_getTrackTotal4 <= 0 || count6 <= 0) return { start: 0, end: 0 };
  let value14 = 0;
  for (let value15 = 0; value15 < list6.length; value15++) {
    const value16 = (list6[value15] / _getTrackTotal4) * count6,
      start = value14,
      end = value14 + value16;
    if (value15 === value12) return { start: start, end: end };
    value14 = end + Math.max(0, value13);
  }
  return { start: 0, end: 0 };
}
function _getCenteredGapTrackBounds(list7, count7, count8, value17) {
  const _getTrackTotal5 = _getTrackTotal(list7);
  if (_getTrackTotal5 <= 0 || count8 <= 0) return { start: 0, end: 0 };
  const value18 = Math.max(0, Number(value17) || 0) / 2;
  let value19 = 0,
    value20 = 0,
    value21 = count8;
  for (let value22 = 0; value22 < list7.length - 1; value22++) {
    value19 += list7[value22];
    const value23 = (value19 / _getTrackTotal5) * count8;
    if (value22 === count7 - 1) value20 = value23;
    if (value22 === count7) {
      value21 = value23;
      break;
    }
  }
  let start2 = count7 === 0 ? 0 : value20 + value18,
    end2 = count7 === list7.length - 1 ? count8 : value21 - value18;
  ((start2 = _clamp(start2, 0, count8)), (end2 = _clamp(end2, 0, count8)));
  if (end2 < start2) {
    const start3 = _clamp((start2 + end2) / 2, 0, count8);
    return { start: start3, end: start3 };
  }
  return { start: start2, end: end2 };
}
export function resolveStoryboardCellPreviewSrc(response) {
  if (!response || typeof response !== 'object') return '';
  const _normalizeLocalPath2 = _normalizeLocalPath(response.thumbLocalPath);
  if (_normalizeLocalPath2) return _normalizeLocalPath2;
  const _normalizeLocalPath3 = _normalizeLocalPath(response.displayLocalPath);
  if (_normalizeLocalPath3) return _normalizeLocalPath3;
  const _normalizeLocalPath4 = _normalizeLocalPath(response.localPath);
  if (_normalizeLocalPath4) return _normalizeLocalPath4;
  if (_isUsablePreviewSrc(response.capturePreviewUrl)) return _trimString(response.capturePreviewUrl);
  if (_isUsableNonDataSrc(response.thumbUrl)) return _trimString(response.thumbUrl);
  if (_isUsableNonDataSrc(response.url)) return _trimString(response.url);
  return '';
}
export function resolveStoryboardCellAssetSrc(response2) {
  if (!response2 || typeof response2 !== 'object') return '';
  const _normalizeLocalPath5 = _normalizeLocalPath(response2.localPath);
  if (_normalizeLocalPath5) return _normalizeLocalPath5;
  const _normalizeLocalPath6 = _normalizeLocalPath(response2.originalLocalPath);
  if (_normalizeLocalPath6) return _normalizeLocalPath6;
  const _normalizeLocalPath7 = _normalizeLocalPath(response2.displayLocalPath);
  if (_normalizeLocalPath7) return _normalizeLocalPath7;
  const _normalizeLocalPath8 = _normalizeLocalPath(response2.thumbLocalPath);
  if (_normalizeLocalPath8) return _normalizeLocalPath8;
  if (_isUsablePreviewSrc(response2.capturePreviewUrl)) return _trimString(response2.capturePreviewUrl);
  if (_isUsableNonDataSrc(response2.url)) return _trimString(response2.url);
  if (_isUsableNonDataSrc(response2.thumbUrl)) return _trimString(response2.thumbUrl);
  return '';
}
export function isStoryboardCellEmpty(response3) {
  if (!response3 || typeof response3 !== 'object') return true;
  if (response3.isEmpty === true) return true;
  return !(
    _trimString(response3.url) ||
    _trimString(response3.localPath) ||
    _trimString(response3.originalLocalPath) ||
    _trimString(response3.displayLocalPath) ||
    _trimString(response3.capturePreviewUrl) ||
    _trimString(response3.thumbUrl) ||
    _trimString(response3.thumbLocalPath) ||
    _trimString(response3.thumbId) ||
    _trimString(response3.sourceId) ||
    _trimString(response3.sourceLocalPath) ||
    _trimString(response3.sourceUrl)
  );
}
function _hasLocalStoryboardCellAsset(value24) {
  return !!(
    _trimString(value24?.localPath) ||
    _trimString(value24?.originalLocalPath) ||
    _trimString(value24?.displayLocalPath) ||
    _trimString(value24?.thumbLocalPath)
  );
}
function _hasStoryboardCellSwapAsset(response4) {
  return !!(
    _hasLocalStoryboardCellAsset(response4) ||
    _trimString(response4?.capturePreviewUrl) ||
    _trimString(response4?.url) ||
    _trimString(response4?.thumbUrl)
  );
}
function _isSourceBackedStoryboardCell(value25) {
  return !!(
    value25?.storyboardSourceCrop === true ||
    _trimString(value25?.sourceLocalPath) ||
    _trimString(value25?.sourceUrl)
  );
}
export function isFrozenStoryboardDisplayCell(enabled) {
  if (!enabled || typeof enabled !== 'object' || isStoryboardCellEmpty(enabled)) return false;
  if (!resolveStoryboardCellAssetSrc(enabled)) return false;
  if (enabled.storyboardPiece === true && enabled.storyboardExtractedCell !== true) return false;
  if (enabled.storyboardExtractedCell === true || enabled.storyboardLockedCell === true) return true;
  return !_isSourceBackedStoryboardCell(enabled) && enabled.storyboardPiece !== true;
}
export function detachStoryboardCellSourceContext(args, value26 = {}) {
  const value27 = args && typeof args === 'object' ? { ...args } : {},
    _trimString4 = _trimString(value27.pieceId) || _trimString(value27.id) || _trimString(value26.pieceId);
  if (_trimString4) value27.pieceId = _trimString4;
  ((value27.sourceId = null),
    (value27.sourceLocalPath = null),
    (value27.sourceUrl = ''),
    (value27.sourceWidth = null),
    (value27.sourceHeight = null),
    (value27.storyboardSourceCrop = false),
    (value27.storyboardPiece = false));
  if (value26.locked === true) value27.storyboardLockedCell = true;
  return (
    Object.prototype.hasOwnProperty.call(value26, 'extracted') &&
      (value27.storyboardExtractedCell = value26.extracted === true),
    value27
  );
}
export function cloneStoryboardCellForSwap(args2) {
  const response5 = args2 && typeof args2 === 'object' ? { ...args2 } : {};
  if (_hasLocalStoryboardCellAsset(response5)) {
    if (_trimString(response5.url).startsWith('data:')) response5.url = '';
    if (_trimString(response5.thumbUrl).startsWith('data:')) response5.thumbUrl = '';
  }
  return response5;
}
export function cloneStoryboardCellForSwapDestination(value28) {
  const locked = cloneStoryboardCellForSwap(value28);
  if (
    _isSourceBackedStoryboardCell(locked) &&
    !isStoryboardCellEmpty(locked) &&
    _hasStoryboardCellSwapAsset(locked)
  )
    return detachStoryboardCellSourceContext(locked, {
      extracted: true,
      locked: locked.storyboardLockedCell === true,
    });
  return locked;
}
export function normalizeEmptyStoryboardCell(response6) {
  const _trimString5 = _trimString(response6?.sourceLocalPath),
    _trimString6 = _trimString(response6?.sourceUrl),
    _trimString7 =
      _trimString(response6?.localPath) ||
      _trimString(response6?.originalLocalPath) ||
      _trimString(response6?.displayLocalPath) ||
      _trimString(response6?.thumbLocalPath),
    _trimString8 =
      _trimString(response6?.url) ||
      _trimString(response6?.capturePreviewUrl) ||
      _trimString(response6?.thumbUrl),
    value29 = !!(_trimString5 || _trimString6),
    residualImageLocalPath = _trimString(response6?.residualImageLocalPath) || _trimString5 || _trimString7,
    residualImageUrl = _trimString(response6?.residualImageUrl) || _trimString6 || _trimString8,
    residualImageMode =
      _trimString(response6?.residualImageMode) ||
      (value29 ? 'source' : residualImageLocalPath || residualImageUrl ? 'cell' : ''),
    value30 = {
      ...(response6 && typeof response6 === 'object' ? response6 : {}),
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
      residualImageLocalPath: residualImageLocalPath || null,
      residualImageUrl: residualImageUrl || '',
      residualImageWidth:
        _toPositiveNumber(response6?.residualImageWidth) ||
        _toPositiveNumber(response6?.sourceWidth) ||
        _toPositiveNumber(response6?.originalWidth) ||
        _toPositiveNumber(response6?.imageWidth) ||
        null,
      residualImageHeight:
        _toPositiveNumber(response6?.residualImageHeight) ||
        _toPositiveNumber(response6?.sourceHeight) ||
        _toPositiveNumber(response6?.originalHeight) ||
        _toPositiveNumber(response6?.imageHeight) ||
        null,
      residualImageMode: residualImageMode,
      isEmpty: true,
    };
  return (
    response6 &&
      Object.prototype.hasOwnProperty.call(response6, 'capturePreviewUrl') &&
      (value30.capturePreviewUrl = ''),
    response6 &&
      Object.prototype.hasOwnProperty.call(response6, 'storyboardExtractedCell') &&
      (value30.storyboardExtractedCell = false),
    value30
  );
}
export function getStoryboardCellMetrics(box5) {
  const cols3 = _getSafeGridCount(box5?.cols),
    rows2 = _getSafeGridCount(box5?.rows),
    columnWeights = resolveStoryboardGridLayout(box5),
    gap = STORYBOARD_CELL_GAP,
    width2 = Math.max(0, Number(box5?.width) || 0),
    height2 = Math.max(0, Number(box5?.height) || 0),
    innerWidth2 = Math.max(0, width2 - STORYBOARD_CELL_INSET * 2),
    innerHeight2 = Math.max(0, height2 - STORYBOARD_CELL_INSET * 2),
    cellWidth = Math.max(0, (innerWidth2 - (cols3 - 1) * gap) / cols3),
    cellHeight = Math.max(0, (innerHeight2 - (rows2 - 1) * gap) / rows2);
  return {
    cols: cols3,
    rows: rows2,
    width: width2,
    height: height2,
    gap: gap,
    inset: STORYBOARD_CELL_INSET,
    innerWidth: innerWidth2,
    innerHeight: innerHeight2,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    columnWeights: columnWeights.columns,
    rowWeights: columnWeights.rowTracks,
  };
}
export function getStoryboardCellBounds(box6, value31, box7 = {}) {
  if (!box6 || typeof box6 !== 'object') return null;
  const storyboardGridLayout = resolveStoryboardGridLayout(box6),
    count9 = Math.trunc(Number(value31));
  if (!Number.isInteger(count9) || count9 < 0) return null;
  if (count9 >= storyboardGridLayout.cols * storyboardGridLayout.rows) return null;
  const value32 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box7, 'width') ? box7.width : box6.width) || 0,
    ),
    value33 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box7, 'height') ? box7.height : box6.height) || 0,
    ),
    value34 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box7, 'inset') ? box7.inset : STORYBOARD_CELL_INSET) || 0,
    ),
    value35 = Object.prototype.hasOwnProperty.call(box7, 'gap'),
    value36 = Object.prototype.hasOwnProperty.call(box7, 'gapX'),
    value37 = Object.prototype.hasOwnProperty.call(box7, 'gapY'),
    value38 = Math.max(0, Number(value35 ? box7.gap : normalizeStoryboardGridGap(box6.gridGap)) || 0),
    value39 = Math.max(0, Number(value36 ? box7.gapX : value38) || 0),
    value40 = Math.max(0, Number(value37 ? box7.gapY : value38) || 0),
    value41 = box7.gapMode !== 'track',
    value42 = box7.gapMode !== 'track',
    value43 = Math.max(0, value32 - value34 * 2),
    value44 = Math.max(0, value33 - value34 * 2),
    value45 = value41 ? value43 : Math.max(0, value43 - (storyboardGridLayout.cols - 1) * value39),
    value46 = value42 ? value44 : Math.max(0, value44 - (storyboardGridLayout.rows - 1) * value40),
    col = count9 % storyboardGridLayout.cols,
    row = Math.floor(count9 / storyboardGridLayout.cols),
    value47 = value41
      ? _getCenteredGapTrackBounds(storyboardGridLayout.columns, col, value45, value39)
      : _getTrackBounds(storyboardGridLayout.columns, col, value45, value39),
    value48 = value42
      ? _getCenteredGapTrackBounds(storyboardGridLayout.rowTracks, row, value46, value40)
      : _getTrackBounds(storyboardGridLayout.rowTracks, row, value46, value40),
    x0 = value34 + value47.start,
    x1 = value34 + value47.end,
    y0 = value34 + value48.start,
    y1 = value34 + value48.end;
  return {
    col: col,
    row: row,
    x0: x0,
    y0: y0,
    x1: x1,
    y1: y1,
    width: Math.max(0, x1 - x0),
    height: Math.max(0, y1 - y0),
  };
}
export function getStoryboardCellPixelBounds(box8, value49, box9 = {}) {
  const args3 = getStoryboardCellBounds(box8, value49, box9);
  if (!args3) return null;
  const storyboardGridLayout2 = resolveStoryboardGridLayout(box8),
    value50 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box9, 'width') ? box9.width : box8?.width) || 0,
    ),
    value51 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box9, 'height') ? box9.height : box8?.height) || 0,
    ),
    value52 = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(box9, 'inset') ? box9.inset : STORYBOARD_CELL_INSET) || 0,
    ),
    value53 = Math.floor(value52),
    value54 = Math.floor(value52),
    value55 = Math.max(value53, Math.ceil(value50 - value52)),
    value56 = Math.max(value54, Math.ceil(value51 - value52));
  let x02 = _clamp(Math.floor(args3.x0), value53, value55),
    y02 = _clamp(Math.floor(args3.y0), value54, value56),
    x12 = _clamp(Math.ceil(args3.x1), value53, value55),
    y12 = _clamp(Math.ceil(args3.y1), value54, value56);
  if (args3.col <= 0) x02 = value53;
  if (args3.row <= 0) y02 = value54;
  if (args3.col >= storyboardGridLayout2.cols - 1) x12 = value55;
  if (args3.row >= storyboardGridLayout2.rows - 1) y12 = value56;
  if (x12 < x02) x12 = x02;
  if (y12 < y02) y12 = y02;
  return {
    ...args3,
    x0: x02,
    y0: y02,
    x1: x12,
    y1: y12,
    width: Math.max(0, x12 - x02),
    height: Math.max(0, y12 - y02),
  };
}
export function buildStoryboardCropRect(enabled2, value57, gapMode = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return null;
  const width3 = Math.max(1, Math.trunc(Number(gapMode.width) || 0)),
    height3 = Math.max(1, Math.trunc(Number(gapMode.height) || 0));
  if (width3 <= 0 || height3 <= 0) return null;
  const inset = Math.max(
      0,
      Number(Object.prototype.hasOwnProperty.call(gapMode, 'inset') ? gapMode.inset : 0) || 0,
    ),
    value58 = Object.prototype.hasOwnProperty.call(gapMode, 'gap'),
    value59 = Object.prototype.hasOwnProperty.call(gapMode, 'gapX'),
    value60 = Object.prototype.hasOwnProperty.call(gapMode, 'gapY'),
    box10 = getStoryboardScaledGridGap(enabled2, { width: width3, height: height3 }),
    value61 = value58 ? Math.max(0, Number(gapMode.gap) || 0) : undefined,
    gapX = value59 ? Math.max(0, Number(gapMode.gapX) || 0) : value58 ? value61 : box10.x,
    gapY = value60 ? Math.max(0, Number(gapMode.gapY) || 0) : value58 ? value61 : box10.y,
    bounds = getStoryboardCellPixelBounds(enabled2, value57, {
      width: width3,
      height: height3,
      inset: inset,
      gapX: gapX,
      gapY: gapY,
      ...(Object.prototype.hasOwnProperty.call(gapMode, 'gapMode') ? { gapMode: gapMode.gapMode } : {}),
    });
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
  const sx = _clamp(bounds.x0, 0, Math.max(0, width3 - 1)),
    sy = _clamp(bounds.y0, 0, Math.max(0, height3 - 1)),
    x13 = _clamp(bounds.x1, sx + 1, width3),
    y13 = _clamp(bounds.y1, sy + 1, height3),
    sw = Math.max(1, x13 - sx),
    sh = Math.max(1, y13 - sy);
  return {
    sx: sx,
    sy: sy,
    sw: sw,
    sh: sh,
    x0: sx,
    y0: sy,
    x1: x13,
    y1: y13,
    width: sw,
    height: sh,
    bounds: bounds,
  };
}
export function getStoryboardCellIndexAtWorldPoint(box11, value62, value63) {
  if (!box11 || typeof box11 !== 'object') return -1;
  const value64 = Number(box11.x) || 0,
    value65 = Number(box11.y) || 0,
    count10 = value62 - value64,
    count11 = value63 - value65,
    box12 = getStoryboardCellMetrics(box11);
  if (count10 < 0 || count10 > box12.width || count11 < 0 || count11 > box12.height) return -1;
  const value66 = box12.cols * box12.rows;
  for (let value67 = 0; value67 < value66; value67++) {
    const box13 = getStoryboardCellPixelBounds(box11, value67);
    if (!box13 || box13.width <= 0 || box13.height <= 0) continue;
    if (count10 >= box13.x0 && count10 <= box13.x1 && count11 >= box13.y0 && count11 <= box13.y1)
      return value67;
  }
  return -1;
}
export function getStoryboardNearestCellIndexAtWorldPoint(box14, value68, value69) {
  if (!box14 || typeof box14 !== 'object') return -1;
  const storyboardCellIndexAtWorldPoint = getStoryboardCellIndexAtWorldPoint(box14, value68, value69);
  if (storyboardCellIndexAtWorldPoint >= 0) return storyboardCellIndexAtWorldPoint;
  const value70 = Number(box14.x) || 0,
    value71 = Number(box14.y) || 0,
    count12 = value68 - value70,
    count13 = value69 - value71,
    box15 = getStoryboardCellMetrics(box14);
  if (count12 < 0 || count12 > box15.width || count13 < 0 || count13 > box15.height) return -1;
  const value72 = box15.cols * box15.rows;
  let value73 = -1,
    value74 = Infinity;
  for (let value75 = 0; value75 < value72; value75++) {
    const box16 = getStoryboardCellPixelBounds(box14, value75, { gap: 0 });
    if (!box16 || box16.width <= 0 || box16.height <= 0) continue;
    if (count12 >= box16.x0 && count12 <= box16.x1 && count13 >= box16.y0 && count13 <= box16.y1)
      return value75;
    const value76 = box16.x0 + box16.width / 2,
      value77 = box16.y0 + box16.height / 2,
      value78 = (count12 - value76) ** 2 + (count13 - value77) ** 2;
    value78 < value74 && ((value74 = value78), (value73 = value75));
  }
  return value73;
}
