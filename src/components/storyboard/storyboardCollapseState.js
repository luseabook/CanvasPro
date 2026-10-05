export function calculateStoryboardDimsByAspect(box, value) {
  const item = String(value || '1:1')
      .split(':')
      .map(Number),
    key = item[0],
    index = item[1],
    w = box?.width || 800;
  return { w: w, h: Math.round(w * (index / key)) };
}
export function buildStoryboardCollapsePatch(box2, enabled) {
  const box3 = { isCollapsed: !!enabled };
  if (enabled) {
    const result = box2?.aspectRatio || '1:1',
      data = result.split(':').map(Number),
      options = data[0],
      target = data[1],
      count = options / target;
    let source, next;
    return (
      count >= 1
        ? ((next = 300), (source = Math.round(next * count)))
        : ((source = 300), (next = Math.round(source / count))),
      (box3._originalWidth = box2?.width),
      (box3._originalHeight = box2?.height),
      (box3.width = source),
      (box3.height = next),
      box3
    );
  }
  return (
    box2?._originalWidth &&
      box2?._originalHeight &&
      ((box3.width = box2._originalWidth), (box3.height = box2._originalHeight)),
    box3
  );
}
