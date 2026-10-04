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
  list = [],
  list2 = [],
  {
    isCellEmpty: isCellEmpty,
    getCellDisplayImageUrl: getCellDisplayImageUrl,
    getCellSourceImageUrl: getCellSourceImageUrl,
    getCellLiveSourceImageUrl: getCellLiveSourceImageUrl,
  } = {},
) {
  if (!Array.isArray(list) || !Array.isArray(list2)) return false;
  if (list.length !== list2.length) return false;
  return list.every((item, value) => {
    const key = list2[value];
    return (
      isCellEmpty?.(item) === isCellEmpty?.(key) &&
      getCellDisplayImageUrl?.(item) === getCellDisplayImageUrl?.(key) &&
      getCellSourceImageUrl?.(item) === getCellSourceImageUrl?.(key) &&
      getCellLiveSourceImageUrl?.(item) === getCellLiveSourceImageUrl?.(key) &&
      item?.storyboardSourceIndex === key?.storyboardSourceIndex &&
      item?.storyboardExtractedCell === key?.storyboardExtractedCell &&
      item?.storyboardLockedCell === key?.storyboardLockedCell &&
      item?.storyboardSourceCrop === key?.storyboardSourceCrop &&
      item?.sourceWidth === key?.sourceWidth &&
      item?.sourceHeight === key?.sourceHeight &&
      item?.residualImageLocalPath === key?.residualImageLocalPath &&
      item?.residualImageUrl === key?.residualImageUrl
    );
  });
}
export function isStoryboardEditingOnlyDisplayUpdate(options = {}, index = {}, result = {}) {
  if (options?.isEditing === index?.isEditing) return false;
  if (EDITING_ONLY_DISPLAY_FIELDS.some((item2) => options?.[item2] !== index?.[item2])) return false;
  const storyboardGridLayout = resolveStoryboardGridLayout(options),
    storyboardGridLayout2 = resolveStoryboardGridLayout(index);
  return (
    areStoryboardTrackListsEqual(storyboardGridLayout.columns, storyboardGridLayout2.columns) &&
    areStoryboardTrackListsEqual(storyboardGridLayout.rowTracks, storyboardGridLayout2.rowTracks) &&
    areStoryboardCellsDisplayEqual(options.cells || [], index.cells || [], result)
  );
}
