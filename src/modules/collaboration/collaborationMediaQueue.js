import { createCollaborationMedia } from './collaborationMedia.js';
import { projectGraph } from './collaborationDocument.js';
import { normalizeCollaborationMediaSource } from '../../../api/canvasCollaborationApi.js';
const PENDING = /^aic-(pending|failed):([\w-]+)$/,
  PREVIEW_FIELDS = [
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'originalWidth',
    'originalHeight',
  ];
function walk(list, handler, args = []) {
  if (typeof list === 'string') return handler(list, args);
  if (Array['isArray'](list)) return list['map']((value, item) => walk(value, handler, [...args, item]));
  if (list && typeof list === 'object')
    return Object['fromEntries'](
      Object['entries'](list)['map'](([key, index]) => [key, walk(index, handler, [...args, key])]),
    );
  return list;
}
export function createCollaborationMediaQueue({
  onChange: onChange = () => {},
  onPreview: onPreview = () => {},
  readGraph: readGraph,
  ...args2
}) {
  const collaborationMedia = createCollaborationMedia(args2),
    map = new Map(),
    map2 = new Map(),
    list2 = [],
    map3 = new Set();
  let enabled = ![],
    setTimeout2 = null,
    result = 0x0,
    value2 = null,
    value3 = null,
    args3 = null,
    value4 = null,
    args4 = [];
  const run = (data) =>
      Number['isFinite'](data['_nodesRev'])
        ? data['_nodesRev'] + ':' + data['_edgesRev'] + ':' + result
        : null,
    handler2 = () => !enabled && !args2['signal']?.['aborted'];
  function run2(options) {
    const source = normalizeCollaborationMediaSource(options);
    if (!map['has'](source)) {
      const target = { source: source, token: crypto['randomUUID'](), phase: 'queued', ref: null };
      (map['set'](source, target), map2['set'](target['token'], target));
    }
    return map['get'](source);
  }
  function node(next) {
    const list3 = next['_collaborationPendingMedia'] || [];
    if (!list3['length']) return next;
    return walk(next, (current, entry) => {
      if (current !== '') return current;
      return (
        list3['find']((record) => JSON['stringify'](record['path']) === JSON['stringify'](entry))?.[
          'value'
        ] || current
      );
    });
  }
  function project(edges) {
    const payload = run(edges);
    if (payload !== null && payload === value3)
      return { nodes: { ...args3['nodes'] }, edges: { ...args3['edges'] } };
    const nodes = Object['fromEntries'](
        Object['entries'](edges['nodes'] || {})['map'](([handle, state]) => [handle, node(state)]),
      ),
      projectGraph2 = projectGraph({ nodes: nodes, edges: edges['edges'] || {} }, (config) => {
        const scope = collaborationMedia['resolveSource'](config);
        if (scope !== config) return scope;
        const input = run2(config);
        return (
          input['ref'] || 'aic-' + (input['phase'] === 'failed' ? 'failed' : 'pending') + ':' + input['token']
        );
      }),
      args5 = resolveWire(projectGraph2);
    return (
      payload !== null && ((value3 = payload), (args3 = args5)),
      { nodes: { ...args5['nodes'] }, edges: { ...args5['edges'] } }
    );
  }
  function resolveWire(output) {
    return walk(output, (value5) => {
      const value6 = value5['match'](PENDING),
        value7 = value6 && map2['get'](value6[0x2]);
      return value7
        ? value7['ref'] ||
            'aic-' + (value7['phase'] === 'failed' ? 'failed' : 'pending') + ':' + value7['token']
        : value5;
    });
  }
  function run3(value8) {
    const args6 = new Set();
    return (
      projectGraph({ nodes: { node: node(value8) }, edges: {} }, (value9) => {
        if (collaborationMedia['resolveSource'](value9) === value9)
          args6['add'](normalizeCollaborationMediaSource(value9));
        return value9;
      }),
      [...args6]
    );
  }
  function prepare(state2) {
    if (Number['isFinite'](state2['_nodesRev']) && state2['_nodesRev'] === value2) return project(state2);
    ((value2 = Number['isFinite'](state2['_nodesRev']) ? state2['_nodesRev'] : null), project(state2));
    for (const [id, value10] of Object['entries'](state2['nodes'] || {})) {
      const needed = run3(value10)
        ['map'](run2)
        ['filter']((value11) => value11['phase'] === 'queued');
      if (!needed['length']) continue;
      for (const value12 of needed) value12['phase'] = 'waiting';
      list2['push']({ id: id, node: structuredClone(value10), needed: needed });
    }
    return (run4(), project(state2));
  }
  function run4() {
    while (handler2() && map3['size'] < 0x1 && list2['length']) {
      const enabled2 = list2['shift']();
      (map3['add'](enabled2),
        void (async () => {
          try {
            const enabled3 = readGraph?.()['nodes'][enabled2['id']];
            if (
              readGraph &&
              (!enabled3 ||
                !enabled2['needed']['some']((value13) => run3(enabled3)['includes'](value13['source'])))
            ) {
              for (const value14 of enabled2['needed']) value14['phase'] = 'queued';
              value2 = null;
              return;
            }
            for (const value15 of enabled2['needed']) value15['phase'] = 'preparing';
            const value16 = await collaborationMedia['prepare']({
              nodes: { [enabled2['id']]: enabled2['node'] },
              edges: {},
            });
            if (!handler2()) return;
            for (const src of enabled2['needed']) {
              ((src['ref'] = collaborationMedia['project']({ nodes: { source: { src: src['source'] } } })[
                'nodes'
              ]['source']['src']),
                (src['phase'] = 'ready'));
            }
            const state3 = await collaborationMedia['materialize'](value16);
            if (!handler2()) return;
            const value17 = Object['fromEntries'](
              PREVIEW_FIELDS['filter'](
                (value18) =>
                  state3['nodes'][enabled2['id']][value18] !== undefined &&
                  state3['nodes'][enabled2['id']][value18] !== enabled2['node'][value18],
              )['map']((value19) => [value19, state3['nodes'][enabled2['id']][value19]]),
            );
            if (Object['keys'](value17)['length']) onPreview(enabled2['id'], enabled2['node'], value17);
          } catch (error) {
            if (!handler2()) return;
            for (const error2 of enabled2['needed']) {
              ((error2['phase'] = 'failed'), (error2['message'] = error['message']));
            }
          } finally {
            map3['delete'](enabled2);
            if (handler2()) {
              (result++, onChange());
              if (list2['length'] && !setTimeout2)
                setTimeout2 = setTimeout(() => {
                  ((setTimeout2 = null), run4());
                }, 0x0);
            }
          }
        })());
    }
  }
  return {
    project: project,
    resolveWire: resolveWire,
    snapshotBindings: (value20) => collaborationMedia['snapshotBindings'](value20),
    restoreBindings(value21) {
      (collaborationMedia['restoreBindings'](value21), (value3 = null), (value4 = null), (value2 = null));
    },
    afterEdit({ name: name, args: args7 }, state4, handler3) {
      const value22 =
        name === 'updateNodeData'
          ? { [args7[0x0]]: args7[0x1] }
          : name === 'updateNodesData'
            ? args7[0x0]
            : {};
      for (const [value23, enabled4] of Object['entries'](value22 || {})) {
        const list4 = state4['nodes'][value23]?.['_collaborationPendingMedia'];
        if (!list4 || !enabled4 || enabled4['_collaborationPendingMedia']) continue;
        const list5 = list4['filter']((value24) => !Object['hasOwn'](enabled4, value24['path'][0x0]));
        if (list5['length'] !== list4['length']) handler3(value23, list5);
      }
    },
    prepare: prepare,
    async materialize(value25) {
      const state5 = await collaborationMedia['materialize'](resolveWire(value25));
      for (const value26 of Object['values'](state5['nodes'] || {})) {
        const list6 = [],
          walk2 = walk(value26, (value27, path) => {
            const enabled5 = value27['match'](PENDING);
            if (!enabled5) return value27;
            const value28 = map2['get'](enabled5[0x2]);
            return (list6['push']({ path: path, value: value27 }), value28?.['source'] || '');
          });
        Object['assign'](value26, walk2);
        if (list6['length']) value26['_collaborationPendingMedia'] = list6;
      }
      return state5;
    },
    states(value29) {
      const value30 = run(value29);
      if (value30 !== null && value30 === value4) return [...args4];
      const list7 = [];
      for (const [id2, value31] of Object['entries'](project(value29)['nodes'])) {
        let value32 = ![],
          failed = ![],
          retry2 = ![],
          owned = ![],
          message = '';
        walk(value31, (value33) => {
          const value34 = value33['match'](PENDING);
          if (value34) {
            ((value32 = !![]),
              (failed ||= value34[0x1] === 'failed'),
              (owned ||= map2['has'](value34[0x2])),
              (retry2 ||= map2['has'](value34[0x2]) && value34[0x1] === 'failed'));
            if (value34[0x1] === 'failed') message ||= map2['get'](value34[0x2])?.['message'] || '';
          }
          return value33;
        });
        if (value32)
          list7['push']({
            id: id2,
            failed: failed,
            retry: retry2,
            owned: owned,
            ...(message ? { message: message } : {}),
          });
      }
      return (value30 !== null && ((value4 = value30), (args4 = list7)), [...list7]);
    },
    retry(value35, state6) {
      const enabled6 = state6['nodes'][value35];
      if (!enabled6) return;
      for (const value36 of run3(enabled6)) {
        const value37 = run2(value36);
        if (value37['phase'] === 'failed') value37['phase'] = 'queued';
      }
      (result++, (value2 = null), prepare(state6), onChange());
    },
    snapshot() {
      return [...map['values']()]['map'](({ source: source2, token: token, ref: ref }) => ({
        source: source2,
        token: token,
        ref: ref,
      }));
    },
    restore(value38) {
      (result++, (value2 = null));
      for (const args8 of value38 || []) {
        if (typeof args8['source'] !== 'string' || !/^[\w-]+$/['test'](args8['token'])) continue;
        const value39 = { ...args8, phase: 'queued' };
        (map['set'](args8['source'], value39), map2['set'](args8['token'], value39));
      }
    },
    dispose() {
      ((enabled = !![]),
        clearTimeout(setTimeout2),
        (list2['length'] = 0x0),
        (args3 = null),
        (args4 = []),
        collaborationMedia['dispose'](),
        map['clear'](),
        map2['clear']());
    },
  };
}
