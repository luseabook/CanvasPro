import { buildClipboardGraphSnapshot, prepareClipboardGraphPaste } from '../clipboardGraph.js';
import { stripImageGenerationRuntimeState } from '../../core/imageTaskRuntimeState.js';
import { computeNodesWorldBounds, generateId } from '../../core/math.js';
import { validateShortcutGraph } from './shortcutCatalog.js';
export function captureShortcutGraph(_0x31b36d, _0x5e9241 = null) {
  const _0x6540c0 = _0x31b36d['getState'](),
    _0x5ddda9 = new Set(_0x5e9241 || _0x6540c0['selectedNodeIds'] || []);
  if (!_0x5ddda9['size']) throw new Error('请先在画布中选中需要保存的节点');
  const _0x273653 = _0x31b36d['serialize']();
  let _0x5dc404 = !![];
  while (_0x5dc404) {
    _0x5dc404 = ![];
    for (const _0x47d52f of _0x273653['nodes']) {
      _0x5ddda9['has'](_0x47d52f['parentId']) &&
        !_0x5ddda9['has'](_0x47d52f['id']) &&
        (_0x5ddda9['add'](_0x47d52f['id']), (_0x5dc404 = !![]));
    }
  }
  const _0x59e958 = buildClipboardGraphSnapshot({
    nodesById: Object['fromEntries'](_0x273653['nodes']['map']((_0x5322b4) => [_0x5322b4['id'], _0x5322b4])),
    edgesById: _0x273653['edges'],
    selectedIds: [..._0x5ddda9],
    sanitizeNode: stripImageGenerationRuntimeState,
  });
  for (const _0x58b1ee of _0x59e958['nodes']) {
    if (!_0x5ddda9['has'](_0x58b1ee['parentId'])) _0x58b1ee['parentId'] = null;
  }
  return validateShortcutGraph(_0x59e958);
}
export function prepareShortcutGraph(_0x30c60a, _0x33bc0b) {
  validateShortcutGraph(_0x30c60a);
  const _0x51e559 = computeNodesWorldBounds(
      Object['fromEntries'](_0x30c60a['nodes']['map']((_0x580745) => [_0x580745['id'], _0x580745])),
    ),
    _0x3458a4 = prepareClipboardGraphPaste({
      graph: _0x30c60a,
      x: _0x33bc0b['x'] - _0x51e559['width'] / 0x2,
      y: _0x33bc0b['y'] - _0x51e559['height'] / 0x2,
      generateNodeId: () => generateId('node'),
      generateEdgeId: () => generateId('edge'),
      sanitizeNode: stripImageGenerationRuntimeState,
    });
  return _0x3458a4;
}
export function insertShortcutGraph({
  store: _0x2271a3,
  graph: _0x1e1c1a,
  center: _0x54471e,
  commit: _0x5978db,
}) {
  const _0x5d69dd = prepareShortcutGraph(_0x1e1c1a, _0x54471e),
    _0x17d8af = [...(_0x2271a3['getState']()['selectedNodeIds'] || [])];
  return (
    _0x2271a3['batch'](() => {
      try {
        (_0x5d69dd['nodes']['forEach']((_0x583fd8) => _0x2271a3['addNode'](_0x583fd8)),
          _0x5d69dd['edges']['forEach']((_0x2501ee) => _0x2271a3['addEdge'](_0x2501ee)),
          _0x2271a3['setSelectedNodes'](_0x5d69dd['newIds']));
      } catch (_0x7084ce) {
        (_0x2271a3['deleteNodes'](_0x5d69dd['newIds']), _0x2271a3['setSelectedNodes'](_0x17d8af));
        throw _0x7084ce;
      }
    }),
    _0x5978db(),
    _0x5d69dd['newIds']
  );
}
