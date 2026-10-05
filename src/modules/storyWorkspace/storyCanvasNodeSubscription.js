import { isStoryCanvasMediaNode } from './storyCanvasMediaSync.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function getMediaNodeRevision(options = {}) {
  return (
    normalizeText(options['id']) +
    ':' +
    (Number(options['_bizRev']) || 0) +
    ':' +
    normalizeText(options['type'])
  );
}
export function getStoryCanvasMediaNodeSnapshot({
  graphStore: graphStore,
  getActiveCanvasId: getActiveCanvasId,
} = {}) {
  const state = graphStore?.['getStateRaw']?.() || graphStore?.['getState']?.() || {};
  return {
    canvasId: normalizeText(getActiveCanvasId?.()),
    nodes: Object['values'](state['nodes'] || {})['filter'](isStoryCanvasMediaNode),
  };
}
export function subscribeStoryCanvasMediaNodeChanges({
  graphStore: graphStore2,
  getActiveCanvasId: getActiveCanvasId2,
  listener: listener,
} = {}) {
  const enabled =
    typeof graphStore2?.['subscribeSelector'] === 'function' ||
    typeof graphStore2?.['subscribeRaw'] === 'function';
  if (!enabled || typeof listener !== 'function')
    throw new Error('story canvas media node subscription dependencies are incomplete');
  let item = '',
    map = new Map();
  const run = (state2 = {}) => {
      const canvasId = normalizeText(getActiveCanvasId2?.());
      if (!canvasId) {
        ((item = ''), (map = new Map()));
        return;
      }
      const list = Object['values'](state2['nodes'] || {})['filter'](isStoryCanvasMediaNode),
        map2 = new Map(list['map']((key) => [normalizeText(key['id']), getMediaNodeRevision(key)]));
      let nodes = list;
      if (canvasId === item) {
        nodes = list['filter'](
          (index) => map['get'](normalizeText(index['id'])) !== getMediaNodeRevision(index),
        );
        for (const id of map['keys']()) {
          if (!map2['has'](id)) nodes['push']({ id: id });
        }
      }
      ((item = canvasId), (map = map2));
      if (!nodes['length']) return;
      try {
        listener({ canvasId: canvasId, nodes: nodes });
      } catch (result) {
        console['warn']('[storyCanvasNodeSubscription] 媒体节点同步失败', result);
      }
    },
    handler = (options2 = {}) =>
      normalizeText(getActiveCanvasId2?.()) + ':' + (Number(options2['_persistRev']) || 0);
  if (typeof graphStore2['subscribeSelector'] === 'function')
    return graphStore2['subscribeSelector'](handler, () =>
      run(graphStore2['getStateRaw']?.() || graphStore2['getState']?.() || {}),
    );
  let data = null;
  return graphStore2['subscribeRaw']((options3 = {}) => {
    const target = handler(options3);
    if (target === data) return;
    ((data = target), run(options3));
  });
}
