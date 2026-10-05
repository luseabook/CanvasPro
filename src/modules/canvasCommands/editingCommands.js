import { generateId } from '../../core/math.js';
import { stripImageGenerationRuntimeState } from '../../core/imageTaskRuntimeState.js';
import { getClipboard, getClipboardGraph, setClipboard } from '../clipboard.js';
import { buildClipboardGraphSnapshot, prepareClipboardGraphPaste } from '../clipboardGraph.js';
import { buildCollageNodeDataFromSelection, isCollageImageNode } from '../collage/collageFactory.js';
import { calculateGroupNodeBounds } from '../groupNodeLayout.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { createCanvasCommandError } from './commandRegistry.js';
function getState(value) {
  return value['store']?.['getStateRaw']?.() || value['store']?.['getState']?.() || {};
}
function getStore(item) {
  return item['graphStore'] || item['store'];
}
function normalizeIds(options = {}, key = {}, { min: min = 1 } = {}) {
  const state = getState(key),
    index =
      Array['isArray'](options['ids']) && options['ids']['length'] > 0
        ? options['ids']
        : options['nodeId']
          ? [options['nodeId']]
          : state['selectedNodeIds'] || [],
    list = [],
    map = new Set();
  for (const result of index) {
    const enabled = String(result || '')['trim']();
    if (!enabled || map['has'](enabled) || !state['nodes']?.[enabled]) continue;
    (map['add'](enabled), list['push'](enabled));
  }
  if (list['length'] < min)
    throw createCanvasCommandError(
      'MISSING_NODE_ID',
      'Canvas command requires at least ' + min + ' existing node' + (min === 1 ? '' : 's') + '.',
    );
  return list;
}
function validateIds(args, data, target) {
  try {
    return { args: { ...args, ids: normalizeIds(args, data, target) } };
  } catch (errorCode) {
    return {
      ok: ![],
      errorCode: errorCode['errorCode'] || 'INVALID_NODE_IDS',
      message: errorCode['message'],
      details: errorCode['details'],
    };
  }
}
function getClipboardApi(getClipboard2) {
  return {
    getClipboard: getClipboard2['clipboard']?.['getClipboard'] || getClipboard,
    getClipboardGraph: getClipboard2['clipboard']?.['getClipboardGraph'] || getClipboardGraph,
    setClipboard: getClipboard2['clipboard']?.['setClipboard'] || setClipboard,
  };
}
function translate(source, next, current) {
  const entry = source['translate']?.(next);
  return entry && entry !== next ? entry : current;
}
function showToast(record, payload, handle) {
  const config = record['showToast'] || record['windowObject']?.['showToast'];
  config?.(payload, handle);
}
export function registerEditingCommands(scope) {
  (scope['register']({
    id: 'node.group',
    description: 'Wrap canvas nodes in a group node.',
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
    validate(options2 = {}, input = {}) {
      return validateIds(options2, input, { min: 1 });
    },
    execute(ids, store) {
      const state2 = getState(store),
        store2 = getStore(store),
        output = ids['ids']['map']((value2) => state2['nodes'][value2])['filter'](Boolean),
        args2 = calculateGroupNodeBounds(output),
        id = generateId('group'),
        node = {
          id: id,
          type: 'group',
          ...args2,
          name: String(ids['name'] || '')['trim']() || translate(store, 'groupNode.defaultName', 'New group'),
          color: 'var(--indigo)',
        },
        handler = () => {
          (store2?.['addNode']?.(node),
            store2?.['groupNodes']?.(ids['ids'], id),
            store2?.['setSelectedNodes']?.([id]));
        };
      if (typeof store2?.['batch'] === 'function') store2['batch'](handler);
      else handler();
      return (store['commit']?.(), { groupId: id, nodeId: id, ids: ids['ids'], node: node });
    },
  }),
    scope['register']({
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
      validate(options3 = {}, value3 = {}) {
        const response = validateIds(options3, value3, { min: 1 });
        if (response['ok'] === ![]) return response;
        const state3 = getState(value3),
          ids2 = response['args']['ids']['filter'](
            (value4) => String(state3['nodes']?.[value4]?.['type'] || '') === 'group',
          );
        if (ids2['length'] === 0)
          return {
            ok: ![],
            errorCode: 'GROUP_NOT_FOUND',
            message: 'node.ungroup requires at least one group node.',
          };
        return { args: { ...response['args'], ids: ids2 } };
      },
      execute(groupIds, store3) {
        const state4 = getState(store3),
          store4 = getStore(store3),
          map2 = new Set(groupIds['ids']),
          childIds = Object['values'](state4['nodes'] || {})
            ['filter']((value5) => map2['has'](String(value5?.['parentId'] || '')))
            ['map']((value6) => value6['id']),
          handler2 = () => {
            childIds['length'] > 0 && typeof store4?.['groupNodes'] === 'function'
              ? store4['groupNodes'](childIds, null)
              : childIds['forEach']((value7) =>
                  store4?.['updateNodeData']?.(value7, { parentId: undefined }),
                );
            store4?.['deleteNodes']?.(groupIds['ids']);
            if (typeof store4?.['clearSelection'] === 'function') store4['clearSelection']();
            else store4?.['setSelectedNodes']?.([]);
          };
        if (typeof store4?.['batch'] === 'function') store4['batch'](handler2);
        else handler2();
        return (store3['commit']?.(), { groupIds: groupIds['ids'], childIds: childIds });
      },
    }),
    scope['register']({
      id: 'clipboard.copy',
      description: 'Copy selected canvas nodes and their internal edges.',
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
      validate(options4 = {}, value8 = {}) {
        return validateIds(options4, value8, { min: 1 });
      },
      execute(selectedIds, value9) {
        const nodesById = getState(value9),
          edges2 = buildClipboardGraphSnapshot({
            nodesById: nodesById['nodes'],
            edgesById: nodesById['edges'],
            selectedIds: selectedIds['ids'],
            sanitizeNode(value10) {
              return stripImageGenerationRuntimeState(value10);
            },
          });
        return (
          getClipboardApi(value9)['setClipboard'](edges2['nodes'], { edges: edges2['edges'] }),
          {
            ids: edges2['nodes']['map']((value11) => value11['id']),
            nodeCount: edges2['nodes']['length'],
            edgeCount: edges2['edges']['length'],
          }
        );
      },
    }),
    scope['register']({
      id: 'clipboard.paste',
      description: 'Paste the internal canvas clipboard at a world position.',
      riskLevel: 'confirm',
      argsSchema: { properties: { x: { type: 'number' }, y: { type: 'number' } } },
      capabilitySchema: { reads: ['clipboard'], writes: ['nodes', 'edges', 'selection'] },
      returnSchema: { aliasFields: ['ids', 'nodeIds', 'edgeIds', 'idMap'] },
      execute(x = {}, store5) {
        const clipboardApi = getClipboardApi(store5),
          graph = clipboardApi['getClipboardGraph'](),
          nodes2 = graph?.['nodes']?.['length'] ? graph['nodes'] : clipboardApi['getClipboard']();
        if (!Array['isArray'](nodes2) || nodes2['length'] === 0)
          return { ids: [], nodeIds: [], edgeIds: [], idMap: {} };
        const value12 = Date['now'](),
          value13 = Math['random']()['toString'](36)['slice'](2, 5),
          ids3 = prepareClipboardGraphPaste({
            graph: graph || { schemaVersion: 1, nodes: nodes2, edges: [] },
            x: x['x'],
            y: x['y'],
            generateNodeId(value14, value15) {
              return (
                String(value14 || 'node')['split']('_copy_')[0] +
                '_copy_' +
                value12 +
                '_' +
                value13 +
                value15
              );
            },
            generateEdgeId() {
              return generateId('edge');
            },
            sanitizeNode(value16) {
              return stripImageGenerationRuntimeState(value16);
            },
          }),
          store6 = getStore(store5),
          handler3 = () => {
            (ids3['nodes']['forEach']((value17) => store6?.['addNode']?.(value17)),
              ids3['edges']['length'] > 0 &&
                (typeof store6?.['updateEdgesBatch'] === 'function'
                  ? store6['updateEdgesBatch']([], ids3['edges'])
                  : ids3['edges']['forEach']((value18) => store6?.['addEdge']?.(value18))),
              store6?.['setSelectedNodes']?.(ids3['newIds']));
          };
        if (typeof store6?.['batch'] === 'function') store6['batch'](handler3);
        else handler3();
        if (ids3['nodes']['length'] > 0) store5['commit']?.();
        return {
          ids: ids3['newIds'],
          nodeIds: ids3['newIds'],
          edgeIds: ids3['edges']['map']((value19) => value19['id']),
          idMap: ids3['idMap'],
        };
      },
    }),
    scope['register']({
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
      validate(options5 = {}, value20 = {}) {
        const response2 = validateIds(options5, value20, { min: 1 });
        if (response2['ok'] === ![]) return response2;
        const state5 = getState(value20),
          imageNodeIds = response2['args']['ids']
            ['map']((value21) => state5['nodes']?.[value21])
            ['filter'](isCollageImageNode);
        if (imageNodeIds['length'] === 0)
          return {
            ok: ![],
            errorCode: 'NO_COLLAGE_IMAGES',
            message: translate(
              value20,
              'canvasInteraction.grids.noImages',
              'No usable image nodes were selected.',
            ),
          };
        return {
          args: { ...response2['args'], imageNodeIds: imageNodeIds['map']((value22) => value22['id']) },
        };
      },
      execute(sourceNodeIds, store7) {
        const state6 = getState(store7),
          nodes3 = sourceNodeIds['imageNodeIds']
            ['map']((value23) => state6['nodes'][value23])
            ['filter'](Boolean),
          id2 = generateId('collage'),
          box = buildCollageNodeDataFromSelection({
            id: id2,
            nodes: nodes3,
            name: translate(store7, 'canvasInteraction.grids.collageName', 'Collage'),
          });
        if (!box)
          throw createCanvasCommandError(
            'COLLAGE_BOUNDS_FAILED',
            translate(store7, 'canvasInteraction.grids.boundsFailed', 'Unable to create collage bounds.'),
          );
        const x2 = calcSafeSpawnPosNearNode(state6['nodes'] || {}, box, box['width'], box['height']),
          node2 = { ...box, x: x2['x'], y: x2['y'] },
          store8 = getStore(store7);
        (store8?.['addNode']?.(node2), store8?.['setSelectedNodes']?.([id2]), store7['commit']?.());
        const run = () => store7['focusNodes']?.([...sourceNodeIds['imageNodeIds'], id2]);
        if (typeof store7['scheduleFrame'] === 'function') store7['scheduleFrame'](run);
        else run();
        return (
          showToast(
            store7,
            translate(store7, 'canvasInteraction.grids.created', 'Collage created.'),
            'success',
          ),
          { nodeId: id2, sourceNodeIds: sourceNodeIds['imageNodeIds'], node: node2 }
        );
      },
    }));
}
