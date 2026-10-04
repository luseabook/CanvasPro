export function planNodeMovement(state, value, item) {
  const enabled = state['nodes'] || {},
    key = state['_parentToChildren'] || {},
    index = {};
  if (value !== 'moveNodesByOffsets') {
    const list = value === 'updateNodePosition' ? [item[0x0]] : item[0x0],
      dx = Number(item[0x1]),
      dy = Number(item[0x2]);
    if (!list?.['length'] || !Number['isFinite'](dx) || !Number['isFinite'](dy) || (!dx && !dy)) return index;
    const map = new Set(),
      list2 = [...list];
    while (list2['length']) {
      const result = list2['pop']();
      if (map['has'](result)) continue;
      map['add'](result);
      if (enabled[result]) index[result] = { dx: dx, dy: dy };
      for (const data of key[result] || []) if (enabled[data]) list2['push'](data);
    }
    return index;
  }
  const options = {};
  for (const [target, enabled2] of Object['entries'](item[0x0] || {})) {
    if (!enabled[target] || !enabled2) continue;
    const dx2 = Number(enabled2['dx']),
      dy2 = Number(enabled2['dy']);
    if (Number['isFinite'](dx2) && Number['isFinite'](dy2) && (dx2 || dy2))
      options[target] = { dx: dx2, dy: dy2 };
  }
  const map2 = new Set(Object['keys'](options));
  for (const source of map2) {
    const map3 = new Set(),
      list3 = [source];
    while (list3['length']) {
      const next = list3['pop']();
      if (map3['has'](next)) continue;
      (map3['add'](next), (index[next] = options[source]));
      for (const current of key[next] || []) {
        if (enabled[current] && !map2['has'](current)) list3['push'](current);
      }
    }
  }
  return index;
}
export function describeGraphMutation(name, args, state2) {
  const entry = state2['nodes'] || {},
    record = state2['edges'] || {},
    payload = { name: name, args: args, nodeIds: [], removedNodeIds: [] },
    handler = (list4) => [
      ...new Set(
        list4['flatMap']((handle) => [handle?.['sourceId'], handle?.['targetId']])['filter'](Boolean),
      ),
    ];
  if (['updateNodePosition', 'moveNodes', 'moveNodesByOffsets']['includes'](name))
    payload['nodeIds'] = Object['keys'](planNodeMovement(state2, name, args));
  else {
    if (name === 'deleteNodes') {
      payload['removedNodeIds'] = [...new Set(args[0x0] || [])];
      const map4 = new Set(payload['removedNodeIds']);
      payload['nodeIds'] = [
        ...new Set([
          ...map4,
          ...handler(
            Object['values'](record)['filter'](
              (config) => map4['has'](config['sourceId']) || map4['has'](config['targetId']),
            ),
          ),
        ]),
      ];
    } else {
      if (name === 'groupNodes')
        payload['nodeIds'] = (args[0x0] || [])['filter'](
          (scope) => entry[scope] && (entry[scope]['parentId'] || null) !== (args[0x1] || null),
        );
      else {
        if (name === 'addEdge') payload['nodeIds'] = handler([record[args[0x0]?.['id']], args[0x0]]);
        else {
          if (name === 'removeEdge') payload['nodeIds'] = handler([record[args[0x0]]]);
          else {
            if (name === 'updateEdgesBatch') {
              const list5 = (args[0x1] || [])['filter']((input) => input?.['id']);
              payload['nodeIds'] = handler([
                ...(args[0x0] || [])['map']((output) => record[output]),
                ...list5['map']((value2) => record[value2['id']]),
                ...list5,
              ]);
            } else {
              if (name === 'updateNodesData') payload['nodeIds'] = Object['keys'](args[0x0] || {});
              else {
                if (name === 'swapStoryboardCells')
                  payload['nodeIds'] = [args[0x0], args[0x2]]['filter'](Boolean);
                else {
                  if (name === 'addNode') payload['nodeIds'] = [args[0x0]?.['id']]['filter'](Boolean);
                  else {
                    if (['updateNodeData', 'renameNode']['includes'](name)) payload['nodeIds'] = [args[0x0]];
                    else throw new Error('Unknown graph mutation: ' + name);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return payload;
}
