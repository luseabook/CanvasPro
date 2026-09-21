import { resolveStoryboardGridLayout } from '../../core/storyboardCellUtils.js';
import { areStoryboardTrackListsEqual } from './storyboardGridLayoutState.js';
const EDITING_ONLY_DISPLAY_FIELDS = [
  'aspectRatio',
  'cols',
  'rows',
  'width',
  'height',
  'gridGap',
  'isCollapsed',
];
export function areStoryboardCellsDisplayEqual(
  _0x77feb1 = [],
  _0x2cc3f7 = [],
  {
    isCellEmpty: _0x409273,
    getCellDisplayImageUrl: _0x2c1241,
    getCellSourceImageUrl: _0x1ac4fb,
    getCellLiveSourceImageUrl: _0x2f6b70,
  } = {},
) {
  if (!Array.isArray(_0x77feb1) || !Array.isArray(_0x2cc3f7)) return false;
  if (_0x77feb1.length !== _0x2cc3f7.length) return false;
  return _0x77feb1.every((_0x2e4e9b, _0x1f161b) => {
    const _0x3765f7 = _0x2cc3f7[_0x1f161b];
    return (
      _0x409273?.(_0x2e4e9b) === _0x409273?.(_0x3765f7) &&
      _0x2c1241?.(_0x2e4e9b) === _0x2c1241?.(_0x3765f7) &&
      _0x1ac4fb?.(_0x2e4e9b) === _0x1ac4fb?.(_0x3765f7) &&
      _0x2f6b70?.(_0x2e4e9b) === _0x2f6b70?.(_0x3765f7) &&
      _0x2e4e9b?.storyboardSourceIndex === _0x3765f7?.storyboardSourceIndex &&
      _0x2e4e9b?.storyboardExtractedCell === _0x3765f7?.storyboardExtractedCell &&
      _0x2e4e9b?.storyboardLockedCell === _0x3765f7?.storyboardLockedCell &&
      _0x2e4e9b?.storyboardSourceCrop === _0x3765f7?.storyboardSourceCrop &&
      _0x2e4e9b?.sourceWidth === _0x3765f7?.sourceWidth &&
      _0x2e4e9b?.sourceHeight === _0x3765f7?.sourceHeight &&
      _0x2e4e9b?.residualImageLocalPath === _0x3765f7?.residualImageLocalPath &&
      _0x2e4e9b?.residualImageUrl === _0x3765f7?.residualImageUrl
    );
  });
}
export function isStoryboardEditingOnlyDisplayUpdate(_0x3d3555 = {}, _0x497882 = {}, _0xfe3f70 = {}) {
  if (_0x3d3555?.isEditing === _0x497882?.isEditing) return false;
  if (EDITING_ONLY_DISPLAY_FIELDS.some((_0x50f213) => _0x3d3555?.[_0x50f213] !== _0x497882?.[_0x50f213]))
    return false;
  const _0x3fdb4d = resolveStoryboardGridLayout(_0x3d3555),
    _0x597184 = resolveStoryboardGridLayout(_0x497882);
  return (
    areStoryboardTrackListsEqual(_0x3fdb4d.columns, _0x597184.columns) &&
    areStoryboardTrackListsEqual(_0x3fdb4d.rowTracks, _0x597184.rowTracks) &&
    areStoryboardCellsDisplayEqual(_0x3d3555.cells || [], _0x497882.cells || [], _0xfe3f70)
  );
}
