import { describeGraphMutation } from './graphMutationImpact.js';
const MUTATIONS = new Set([
    'addNode',
    'updateNodePosition',
    'moveNodes',
    'moveNodesByOffsets',
    'deleteNodes',
    'updateNodeData',
    'updateNodesData',
    'swapStoryboardCells',
    'addEdge',
    'removeEdge',
    'updateEdgesBatch',
    'groupNodes',
    'renameNode',
  ]),
  REPLACEMENTS = new Set(['loadState', 'loadHistorySnapshot', 'hydrate', 'hydrateTrustedSnapshot']);
export function withGraphMutationBoundary(args) {
  let value = null,
    item = 0;
  const key = { ...args };
  for (const index of [...MUTATIONS, ...REPLACEMENTS]) {
    if (typeof args[index] !== 'function') continue;
    key[index] = (...args2) => {
      const result = item ? null : value,
        data =
          result && MUTATIONS['has'](index)
            ? describeGraphMutation(index, args2, args['getStateRaw']())
            : null;
      if (REPLACEMENTS['has'](index)) {
        if (result?.['beforeReplace']?.(index, args2) === ![])
          throw new Error('请先完成协作同步或结束当前生成任务');
      } else {
        if (result?.['before']?.(data) === ![])
          throw new Error('当前协作画布不可编辑，或节点正在被其他成员编辑');
      }
      const options = args[index](...args2);
      if (MUTATIONS['has'](index)) result?.['after']?.(data);
      return options;
    };
  }
  return (
    (key['setGraphMutationPolicy'] = (target) => {
      if (target && value && target !== value) throw new Error('Graph mutation policy already installed');
      return (
        (value = target),
        () => {
          if (value === target) value = null;
        }
      );
    }),
    (key['getGraphMutationPolicy'] = () => value),
    (key['withGraphMutationBypass'] = (handler) => {
      item += 1;
      try {
        return handler();
      } finally {
        item -= 1;
      }
    }),
    key
  );
}
