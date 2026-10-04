import { createNodeGeometryOverlay } from './nodeGeometryOverlay.js';
export function previewNodeGeometry(
  value,
  {
    snapshot: snapshot,
    bridge: bridge,
    ensureEdgeIndex: ensureEdgeIndex,
    nodeToEdgeIds: nodeToEdgeIds,
    renderEdgesByIds: renderEdgesByIds,
    cache: cache = new Map(),
  } = {},
) {
  if (!snapshot?.['nodes']) return;
  const item = {},
    key = new Set();
  ensureEdgeIndex?.(snapshot['edges'] || {}, snapshot['_edgesRev'] || 0x0);
  for (const [index, args] of value) {
    const box = snapshot['nodes'][index];
    if (!box) {
      (cache['delete'](index), bridge?.['syncNodeDragPreview']?.(index, { active: ![], remove: !![] }));
      continue;
    }
    const dx = { ...box, ...args },
      el = bridge?.['getMountedWrapper']?.(index),
      result = 'translate(' + dx['x'] + 'px, ' + dx['y'] + 'px)',
      stamp = [dx['x'], dx['y'], dx['width'], dx['height'], box['x'], box['y'], !!args]['join'](':'),
      data = cache['get'](index);
    item[index] = args || {};
    if (
      args &&
      el &&
      data?.['el'] === el &&
      data?.['stamp'] === stamp &&
      el['style']['transform'] === result &&
      el['style']['width'] === dx['width'] + 'px' &&
      el['style']['height'] === dx['height'] + 'px'
    )
      continue;
    if (args) cache['set'](index, { el: el, stamp: stamp });
    else cache['delete'](index);
    if (el) {
      el['style']['transform'] = result;
      if (Number['isFinite'](dx['width'])) el['style']['width'] = dx['width'] + 'px';
      if (Number['isFinite'](dx['height'])) el['style']['height'] = dx['height'] + 'px';
      delete el['_posKey'];
    }
    const options = el && el['dataset']?.['rendererPresentationOwner'] !== 'fast-preview';
    bridge?.['syncNodeDragPreview']?.(
      index,
      options
        ? { remove: !![] }
        : {
            dx: dx['x'] - box['x'],
            dy: dx['y'] - box['y'],
            width: dx['width'],
            height: dx['height'],
            active: !!args,
            settle: !args,
            existingOnly: !el,
          },
    );
    for (const target of nodeToEdgeIds?.['get'](index) || []) key['add'](target);
  }
  if (key['size']) renderEdgesByIds?.(key, createNodeGeometryOverlay(snapshot['nodes'], item), snapshot);
}
