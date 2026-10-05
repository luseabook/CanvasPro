import { getStoryboardCellPixelBounds, resolveStoryboardGridLayout } from '../../core/storyboardCellUtils.js';
export function buildStoryboardActiveGridNode(args, gridGap) {
  const cols = resolveStoryboardGridLayout(args);
  return {
    ...args,
    cols: cols.cols,
    rows: cols.rows,
    gridGap: gridGap,
    gridLayout: { columns: cols.columns, rows: cols.rowTracks },
  };
}
export function buildStoryboardBaseGridLayout(value) {
  const cols2 = Math.max(1, Number(value?.cols) || 1),
    rows = Math.max(1, Number(value?.rows) || 1);
  return {
    cols: cols2,
    rows: rows,
    columns: Array(cols2).fill(1),
    rowTracks: Array(rows).fill(1),
  };
}
export function getStoryboardActiveCellLayoutBounds(width, item, key) {
  return getStoryboardCellPixelBounds(buildStoryboardActiveGridNode(width, key), item, {
    width: width?.width,
    height: width?.height,
    inset: 0,
  });
}
export function getStoryboardBaseCellLayoutBounds(width2, index) {
  return getStoryboardCellPixelBounds({ ...width2, gridGap: 0, gridLayout: null }, index, {
    width: width2?.width,
    height: width2?.height,
    inset: 0,
    gap: 0,
  });
}
export function getStoryboardCellCutoutRect(result, data, options) {
  const box = getStoryboardBaseCellLayoutBounds(result, data),
    storyboardActiveCellLayoutBounds = getStoryboardActiveCellLayoutBounds(result, data, options);
  if (!box || !storyboardActiveCellLayoutBounds || box.width <= 0 || box.height <= 0) return null;
  const x = Math.max(0, storyboardActiveCellLayoutBounds.x0 - box.x0),
    y = Math.max(0, storyboardActiveCellLayoutBounds.y0 - box.y0),
    target = Math.min(box.width, storyboardActiveCellLayoutBounds.x1 - box.x0),
    source = Math.min(box.height, storyboardActiveCellLayoutBounds.y1 - box.y0);
  return {
    x: x,
    y: y,
    width: Math.max(0, target - x),
    height: Math.max(0, source - y),
  };
}
export function isDefaultStoryboardTrackList(next) {
  return (next || []).every((item2) => Math.abs(Number(item2) - 1) < 0.0001);
}
export function hasCustomStoryboardGridLayout(current) {
  return !isDefaultStoryboardTrackList(current?.columns) || !isDefaultStoryboardTrackList(current?.rowTracks);
}
export function areStoryboardTrackListsEqual(list = [], list2 = []) {
  if (!Array.isArray(list) || !Array.isArray(list2) || list.length !== list2.length) return false;
  return list.every((item3, entry) => Math.abs(Number(item3) - Number(list2[entry])) < 0.0001);
}
export function isSameStoryboardGridLayout(cols3, gridLayout) {
  const storyboardGridLayout = resolveStoryboardGridLayout(cols3),
    storyboardGridLayout2 = resolveStoryboardGridLayout({
      cols: cols3?.cols,
      rows: cols3?.rows,
      gridLayout: gridLayout,
    });
  return (
    areStoryboardTrackListsEqual(storyboardGridLayout.columns, storyboardGridLayout2.columns) &&
    areStoryboardTrackListsEqual(storyboardGridLayout.rowTracks, storyboardGridLayout2.rowTracks)
  );
}
export function getStoryboardCustomGridLinePosition(record, count) {
  const payload = count > 0 ? record / count : 0;
  return Math.max(0, Math.min(1, payload)) * 100 + '%';
}
export function adjustAdjacentStoryboardGridTracks(args2, count2, handle) {
  const list3 = [...args2];
  if (count2 < 0 || count2 >= list3.length - 1) return list3;
  const state = list3[count2] + list3[count2 + 1],
    config = Math.min(0.2, state / 2),
    scope = Math.min(Math.max(list3[count2] + handle, config), state - config);
  return (
    (list3[count2] = Math.round(scope * 10000) / 10000),
    (list3[count2 + 1] = Math.round((state - scope) * 10000) / 10000),
    list3
  );
}
