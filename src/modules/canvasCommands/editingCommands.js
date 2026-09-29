import { generateId } from '../../core/math.js';
import { stripImageGenerationRuntimeState } from '../../core/imageTaskRuntimeState.js';
import { getClipboard, getClipboardGraph, setClipboard } from '../clipboard.js';
import { buildClipboardGraphSnapshot, prepareClipboardGraphPaste } from '../clipboardGraph.js';
import { buildCollageNodeDataFromSelection, isCollageImageNode } from '../collage/collageFactory.js';
import { calculateGroupNodeBounds } from '../groupNodeLayout.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { createCanvasCommandError } from './commandRegistry.js';
function getState(_0x2fb862) {
  return _0x2fb862['store']?.['getStateRaw']?.() || _0x2fb862['store']?.['getState']?.() || {};
}
function getStore(_0x4edc47) {
  return _0x4edc47['graphStore'] || _0x4edc47['store'];
}
function normalizeIds(_0x16c1c8 = {}, _0x362187 = {}, { min: min = 0x1 } = {}) {
  const _0x55c0c6 = getState(_0x362187),
    _0xc1f51e =
      Array['isArray'](_0x16c1c8['ids']) && _0x16c1c8['ids']['length'] > 0x0
        ? _0x16c1c8['ids']
        : _0x16c1c8['nodeId']
          ? [_0x16c1c8['nodeId']]
          : _0x55c0c6['selectedNodeIds'] || [],
    _0x22d5d6 = [],
    _0x107719 = new Set();
  for (const _0x499a51 of _0xc1f51e) {
    const _0x59cfbb = String(_0x499a51 || '')['trim']();
    if (!_0x59cfbb || _0x107719['has'](_0x59cfbb) || !_0x55c0c6['nodes']?.[_0x59cfbb]) continue;
    (_0x107719['add'](_0x59cfbb), _0x22d5d6['push'](_0x59cfbb));
  }
  if (_0x22d5d6['length'] < min)
    throw createCanvasCommandError(
      'MISSING_NODE_ID',
      'Canvas command requires at least ' + min + '\x20existing\x20node' + (min === 0x1 ? '' : 's') + '.',
    );
  return _0x22d5d6;
}
function validateIds(_0x124a82, _0x364cbb, _0x569502) {
  try {
    return { args: { ..._0x124a82, ids: normalizeIds(_0x124a82, _0x364cbb, _0x569502) } };
  } catch (_0x29aed4) {
    return {
      ok: ![],
      errorCode: _0x29aed4['errorCode'] || 'INVALID_NODE_IDS',
      message: _0x29aed4['message'],
      details: _0x29aed4['details'],
    };
  }
}
function getClipboardApi(_0x571624) {
  return {
    getClipboard: _0x571624['clipboard']?.['getClipboard'] || getClipboard,
    getClipboardGraph: _0x571624['clipboard']?.['getClipboardGraph'] || getClipboardGraph,
    setClipboard: _0x571624['clipboard']?.['setClipboard'] || setClipboard,
  };
}
function translate(_0x395259, _0x3794fc, _0x3291ae) {
  const _0x4a2f22 = _0x395259['translate']?.(_0x3794fc);
  return _0x4a2f22 && _0x4a2f22 !== _0x3794fc ? _0x4a2f22 : _0x3291ae;
}
function showToast(_0x1cbaeb, _0x4d3bec, _0x478445) {
  const _0x4ce9bb = _0x1cbaeb['showToast'] || _0x1cbaeb['windowObject']?.['showToast'];
  _0x4ce9bb?.(_0x4d3bec, _0x478445);
}
export function registerEditingCommands(_0x305510) {
  (_0x305510['register']({
    id: 'node.group',
    description: 'Wrap\x20canvas\x20nodes\x20in\x20a\x20group\x20node.',
    riskLevel: 'safe',
    argsSchema: {
      properties: { ids: { type: 'array', items: { type: 'string' } }, name: { type: 'string' } },
      selectionFallback: !![],
    },
    capabilitySchema: {
      reads: ['nodes', 'selection'],
      writes: ['nodes', 'selection'],
      selectionFallback: !![],
    },
    returnSchema: { aliasFields: ['groupId', 'nodeId', 'ids'] },
    validate(_0x4f1dd6 = {}, _0x31f0d2 = {}) {
      return validateIds(_0x4f1dd6, _0x31f0d2, { min: 0x1 });
    },
    execute(_0x59d217, _0x2eb027) {
      const _0x1c073e = getState(_0x2eb027),
        _0x1d08fe = getStore(_0x2eb027),
        _0x172155 = _0x59d217['ids']['map']((_0x19039b) => _0x1c073e['nodes'][_0x19039b])['filter'](Boolean),
        _0x52a3c4 = calculateGroupNodeBounds(_0x172155),
        _0x25990b = generateId('group'),
        _0x1d7ad3 = {
          id: _0x25990b,
          type: 'group',
          ..._0x52a3c4,
          name:
            String(_0x59d217['name'] || '')['trim']() ||
            translate(_0x2eb027, 'groupNode.defaultName', 'New group'),
          color: 'var(--indigo)',
        },
        _0x22feaa = () => {
          (_0x1d08fe?.['addNode']?.(_0x1d7ad3),
            _0x1d08fe?.['groupNodes']?.(_0x59d217['ids'], _0x25990b),
            _0x1d08fe?.['setSelectedNodes']?.([_0x25990b]));
        };
      if (typeof _0x1d08fe?.['batch'] === 'function') _0x1d08fe['batch'](_0x22feaa);
      else _0x22feaa();
      return (
        _0x2eb027['commit']?.(),
        { groupId: _0x25990b, nodeId: _0x25990b, ids: _0x59d217['ids'], node: _0x1d7ad3 }
      );
    },
  }),
    _0x305510['register']({
      id: 'node.ungroup',
      description: 'Remove group shells while preserving their child nodes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: { ids: { type: 'array', items: { type: 'string' } }, nodeId: { type: 'string' } },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes', 'selection'],
        writes: ['nodes', 'selection'],
        selectionFallback: !![],
      },
      returnSchema: { aliasFields: ['groupIds', 'childIds'] },
      validate(_0x2d4cb1 = {}, _0x5adca5 = {}) {
        const _0x55cc13 = validateIds(_0x2d4cb1, _0x5adca5, { min: 0x1 });
        if (_0x55cc13['ok'] === ![]) return _0x55cc13;
        const _0x426647 = getState(_0x5adca5),
          _0x171b4a = _0x55cc13['args']['ids']['filter'](
            (_0x54e700) => String(_0x426647['nodes']?.[_0x54e700]?.['type'] || '') === 'group',
          );
        if (_0x171b4a['length'] === 0x0)
          return {
            ok: ![],
            errorCode: 'GROUP_NOT_FOUND',
            message: 'node.ungroup\x20requires\x20at\x20least\x20one\x20group\x20node.',
          };
        return { args: { ..._0x55cc13['args'], ids: _0x171b4a } };
      },
      execute(_0xea6ef4, _0x4bd2f4) {
        const _0x25ac10 = getState(_0x4bd2f4),
          _0x12cb21 = getStore(_0x4bd2f4),
          _0x4cd57f = new Set(_0xea6ef4['ids']),
          _0x39650b = Object['values'](_0x25ac10['nodes'] || {})
            ['filter']((_0x43f3f7) => _0x4cd57f['has'](String(_0x43f3f7?.['parentId'] || '')))
            ['map']((_0x1fbcce) => _0x1fbcce['id']),
          _0x1fe3c6 = () => {
            _0x39650b['length'] > 0x0 && typeof _0x12cb21?.['groupNodes'] === 'function'
              ? _0x12cb21['groupNodes'](_0x39650b, null)
              : _0x39650b['forEach']((_0x4fd671) =>
                  _0x12cb21?.['updateNodeData']?.(_0x4fd671, { parentId: undefined }),
                );
            _0x12cb21?.['deleteNodes']?.(_0xea6ef4['ids']);
            if (typeof _0x12cb21?.['clearSelection'] === 'function') _0x12cb21['clearSelection']();
            else _0x12cb21?.['setSelectedNodes']?.([]);
          };
        if (typeof _0x12cb21?.['batch'] === 'function') _0x12cb21['batch'](_0x1fe3c6);
        else _0x1fe3c6();
        return (_0x4bd2f4['commit']?.(), { groupIds: _0xea6ef4['ids'], childIds: _0x39650b });
      },
    }),
    _0x305510['register']({
      id: 'clipboard.copy',
      description: 'Copy\x20selected\x20canvas\x20nodes\x20and\x20their\x20internal\x20edges.',
      riskLevel: 'safe',
      argsSchema: {
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes', 'edges', 'selection'],
        writes: ['clipboard'],
        selectionFallback: !![],
      },
      returnSchema: { aliasFields: ['ids', 'nodeCount', 'edgeCount'] },
      validate(_0x1b3887 = {}, _0x11ae52 = {}) {
        return validateIds(_0x1b3887, _0x11ae52, { min: 0x1 });
      },
      execute(_0x1e6c39, _0xabaebf) {
        const _0x26114a = getState(_0xabaebf),
          _0xe45ca0 = buildClipboardGraphSnapshot({
            nodesById: _0x26114a['nodes'],
            edgesById: _0x26114a['edges'],
            selectedIds: _0x1e6c39['ids'],
            sanitizeNode(_0x157b5b) {
              return stripImageGenerationRuntimeState(_0x157b5b);
            },
          });
        return (
          getClipboardApi(_0xabaebf)['setClipboard'](_0xe45ca0['nodes'], { edges: _0xe45ca0['edges'] }),
          {
            ids: _0xe45ca0['nodes']['map']((_0x425005) => _0x425005['id']),
            nodeCount: _0xe45ca0['nodes']['length'],
            edgeCount: _0xe45ca0['edges']['length'],
          }
        );
      },
    }),
    _0x305510['register']({
      id: 'clipboard.paste',
      description: 'Paste the internal canvas clipboard at a world position.',
      riskLevel: 'confirm',
      argsSchema: { properties: { x: { type: 'number' }, y: { type: 'number' } } },
      capabilitySchema: { reads: ['clipboard'], writes: ['nodes', 'edges', 'selection'] },
      returnSchema: { aliasFields: ['ids', 'nodeIds', 'edgeIds', 'idMap'] },
      execute(_0x53bb4b = {}, _0x55b58c) {
        const _0x3fd08d = getClipboardApi(_0x55b58c),
          _0x308496 = _0x3fd08d['getClipboardGraph'](),
          _0x2e217a = _0x308496?.['nodes']?.['length'] ? _0x308496['nodes'] : _0x3fd08d['getClipboard']();
        if (!Array['isArray'](_0x2e217a) || _0x2e217a['length'] === 0x0)
          return { ids: [], nodeIds: [], edgeIds: [], idMap: {} };
        const _0x46b8a0 = Date['now'](),
          _0x12db72 = Math['random']()['toString'](0x24)['slice'](0x2, 0x5),
          _0x295605 = prepareClipboardGraphPaste({
            graph: _0x308496 || { schemaVersion: 0x1, nodes: _0x2e217a, edges: [] },
            x: _0x53bb4b['x'],
            y: _0x53bb4b['y'],
            generateNodeId(_0x205d41, _0x5e79fe) {
              return (
                String(_0x205d41 || 'node')['split']('_copy_')[0x0] +
                '_copy_' +
                _0x46b8a0 +
                '_' +
                _0x12db72 +
                _0x5e79fe
              );
            },
            generateEdgeId() {
              return generateId('edge');
            },
            sanitizeNode(_0x2e0209) {
              return stripImageGenerationRuntimeState(_0x2e0209);
            },
          }),
          _0x2f9da2 = getStore(_0x55b58c),
          _0x1f7f83 = () => {
            (_0x295605['nodes']['forEach']((_0x3df0ff) => _0x2f9da2?.['addNode']?.(_0x3df0ff)),
              _0x295605['edges']['length'] > 0x0 &&
                (typeof _0x2f9da2?.['updateEdgesBatch'] === 'function'
                  ? _0x2f9da2['updateEdgesBatch']([], _0x295605['edges'])
                  : _0x295605['edges']['forEach']((_0x43c0dd) => _0x2f9da2?.['addEdge']?.(_0x43c0dd))),
              _0x2f9da2?.['setSelectedNodes']?.(_0x295605['newIds']));
          };
        if (typeof _0x2f9da2?.['batch'] === 'function') _0x2f9da2['batch'](_0x1f7f83);
        else _0x1f7f83();
        if (_0x295605['nodes']['length'] > 0x0) _0x55b58c['commit']?.();
        return {
          ids: _0x295605['newIds'],
          nodeIds: _0x295605['newIds'],
          edgeIds: _0x295605['edges']['map']((_0x57a974) => _0x57a974['id']),
          idMap: _0x295605['idMap'],
        };
      },
    }),
    _0x305510['register']({
      id: 'collage.createFromSelection',
      description: 'Create a collage node from selected image nodes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        selectionFallback: !![],
      },
      capabilitySchema: {
        reads: ['nodes', 'selection'],
        writes: ['nodes', 'selection'],
        selectionFallback: !![],
      },
      returnSchema: { aliasFields: ['nodeId', 'sourceNodeIds'] },
      validate(_0x8afca = {}, _0x9d987e = {}) {
        const _0x4cb21a = validateIds(_0x8afca, _0x9d987e, { min: 0x1 });
        if (_0x4cb21a['ok'] === ![]) return _0x4cb21a;
        const _0x11dfa2 = getState(_0x9d987e),
          _0x2d870c = _0x4cb21a['args']['ids']
            ['map']((_0x5d5d2a) => _0x11dfa2['nodes']?.[_0x5d5d2a])
            ['filter'](isCollageImageNode);
        if (_0x2d870c['length'] === 0x0)
          return {
            ok: ![],
            errorCode: 'NO_COLLAGE_IMAGES',
            message: translate(
              _0x9d987e,
              'canvasInteraction.grids.noImages',
              'No usable image nodes were selected.',
            ),
          };
        return {
          args: { ..._0x4cb21a['args'], imageNodeIds: _0x2d870c['map']((_0x5c22f0) => _0x5c22f0['id']) },
        };
      },
      execute(_0x36e6f8, _0x25f137) {
        const _0x45149f = getState(_0x25f137),
          _0x381f41 = _0x36e6f8['imageNodeIds']
            ['map']((_0x1c96eb) => _0x45149f['nodes'][_0x1c96eb])
            ['filter'](Boolean),
          _0x39550b = generateId('collage'),
          _0x1c1040 = buildCollageNodeDataFromSelection({
            id: _0x39550b,
            nodes: _0x381f41,
            name: translate(_0x25f137, 'canvasInteraction.grids.collageName', 'Collage'),
          });
        if (!_0x1c1040)
          throw createCanvasCommandError(
            'COLLAGE_BOUNDS_FAILED',
            translate(_0x25f137, 'canvasInteraction.grids.boundsFailed', 'Unable to create collage bounds.'),
          );
        const _0x618691 = calcSafeSpawnPosNearNode(
            _0x45149f['nodes'] || {},
            _0x1c1040,
            _0x1c1040['width'],
            _0x1c1040['height'],
          ),
          _0x3ff947 = { ..._0x1c1040, x: _0x618691['x'], y: _0x618691['y'] },
          _0x10eb5c = getStore(_0x25f137);
        (_0x10eb5c?.['addNode']?.(_0x3ff947),
          _0x10eb5c?.['setSelectedNodes']?.([_0x39550b]),
          _0x25f137['commit']?.());
        const _0x1e9f98 = () => _0x25f137['focusNodes']?.([..._0x36e6f8['imageNodeIds'], _0x39550b]);
        if (typeof _0x25f137['scheduleFrame'] === 'function') _0x25f137['scheduleFrame'](_0x1e9f98);
        else _0x1e9f98();
        return (
          showToast(
            _0x25f137,
            translate(_0x25f137, 'canvasInteraction.grids.created', 'Collage created.'),
            'success',
          ),
          { nodeId: _0x39550b, sourceNodeIds: _0x36e6f8['imageNodeIds'], node: _0x3ff947 }
        );
      },
    }));
}
