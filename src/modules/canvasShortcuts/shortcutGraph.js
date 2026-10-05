import { buildClipboardGraphSnapshot, prepareClipboardGraphPaste } from '../clipboardGraph.js';
import { stripImageGenerationRuntimeState } from '../../core/imageTaskRuntimeState.js';
import { computeNodesWorldBounds, generateId } from '../../core/math.js';
import { validateShortcutGraph } from './shortcutCatalog.js';
export function captureShortcutGraph(store, value = null) {
  const state = store['getState'](),
    map = new Set(value || state['selectedNodeIds'] || []);
  if (!map['size']) throw new Error('请先在画布中选中需要保存的节点');
  const edgesById = store['serialize']();
  let item = true;
  while (item) {
    item = false;
    for (const key of edgesById['nodes']) {
      map['has'](key['parentId']) && !map['has'](key['id']) && (map['add'](key['id']), (item = true));
    }
  }
  const clipboardGraphSnapshot = buildClipboardGraphSnapshot({
    nodesById: Object['fromEntries'](edgesById['nodes']['map']((index) => [index['id'], index])),
    edgesById: edgesById['edges'],
    selectedIds: [...map],
    sanitizeNode: stripImageGenerationRuntimeState,
  });
  for (const result of clipboardGraphSnapshot['nodes']) {
    if (!map['has'](result['parentId'])) result['parentId'] = null;
  }
  return validateShortcutGraph(clipboardGraphSnapshot);
}
export function prepareShortcutGraph(graph, x) {
  validateShortcutGraph(graph);
  const box = computeNodesWorldBounds(
      Object['fromEntries'](graph['nodes']['map']((data) => [data['id'], data])),
    ),
    prepareClipboardGraphPaste2 = prepareClipboardGraphPaste({
      graph: graph,
      x: x['x'] - box['width'] / 2,
      y: x['y'] - box['height'] / 2,
      generateNodeId: () => generateId('node'),
      generateEdgeId: () => generateId('edge'),
      sanitizeNode: stripImageGenerationRuntimeState,
    });
  return prepareClipboardGraphPaste2;
}
export function insertShortcutGraph({ store: store2, graph: graph2, center: center, commit: commit }) {
  const prepareShortcutGraph2 = prepareShortcutGraph(graph2, center),
    options = [...(store2['getState']()['selectedNodeIds'] || [])];
  return (
    store2['batch'](() => {
      try {
        (prepareShortcutGraph2['nodes']['forEach']((target) => store2['addNode'](target)),
          prepareShortcutGraph2['edges']['forEach']((source) => store2['addEdge'](source)),
          store2['setSelectedNodes'](prepareShortcutGraph2['newIds']));
      } catch (next) {
        (store2['deleteNodes'](prepareShortcutGraph2['newIds']), store2['setSelectedNodes'](options));
        throw next;
      }
    }),
    commit(),
    prepareShortcutGraph2['newIds']
  );
}
