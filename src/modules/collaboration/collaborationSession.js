import {
  applyGraphChanges,
  cloneGraph,
  graphChanges,
  invertChanges,
  mergeSharedNode,
  sharedValue,
} from './collaborationDocument.js';
import { createCollaborationMediaQueue } from './collaborationMediaQueue.js';
import { setGenerationExecutionPolicy } from '../../core/generationExecutionPolicy.js';
import { createCollaborationPresenceChannel } from './collaborationPresenceChannel.js';
import { createCollaborationChangeFeed } from './collaborationChangeFeed.js';
import { createCollaborationConflicts, partitionCollaborationConflict } from './collaborationConflicts.js';
import { mergeCollaborationFields } from './collaborationFieldMerge.js';
import { createCollaborationJournal } from './collaborationJournal.js';
import { readHostAttention } from './collaborationPreferences.js';
import { createCollaborationEditing } from './collaborationEditing.js';
import { createCollaborationReviewState } from './collaborationReviewState.js';
const PERMANENT_ERRORS = new Set([
  'EDIT_CONFLICT',
  'NODE_BUSY',
  'TASK_BUSY',
  'ROOM_FORBIDDEN',
  'ROLE_FORBIDDEN',
  'ACTIVATION_REQUIRED',
  'SESSION_EXPIRED',
  'VERSION_MISMATCH',
  'HOST_CERT_CHANGED',
  'PRIVATE_DATA',
  'LOCAL_MEDIA',
  'INVALID_DOCUMENT',
  'INVALID_REVISION',
  'ASSET_LIMIT',
  'ASSET_EMPTY',
  'ASSET_TYPE',
  'ASSET_MISSING',
  'ASSET_CHANGED',
  'ROOM_LIMIT',
  'ROOM_STORAGE_FULL',
]);
export function createCollaborationSession({
  store: store,
  api: api,
  room: room,
  actorId: actorId,
  clientId: clientId,
  getCanvasId: getCanvasId,
  hosting: hosting = ![],
  onChange: onChange = () => {},
  onPresence: onPresence = () => {},
  onDetach: onDetach = () => {},
  onConfirmed: onConfirmed = () => {},
  onAttention: onAttention = () => {},
  onNotice: onNotice = () => {},
  onComment: onComment = () => {},
  mediaOptions: mediaOptions = {},
  journal: journal = createCollaborationJournal({
    roomId: room['roomId'],
    actorId: actorId,
    clientId: clientId,
  }),
}) {
  const value = getCanvasId(),
    signal = new AbortController(),
    revision = {
      ...room,
      actorId: actorId,
      clientId: clientId,
      status: 'connecting',
      message: '正在同步画布',
      pending: ![],
    };
  let before2 = cloneGraph(room['document']),
    base = null,
    packet = null,
    enabled = null,
    setTimeout2 = null,
    enabled2 = ![],
    item = null,
    enabled3 = ![];
  const map = new Set();
  let pending = ![],
    enabled4 = ![],
    key = -0x1,
    value2 = null,
    setTimeout3 = null,
    setTimeout4 = null,
    index = 0x0,
    result = 0x0,
    data = '',
    options = Promise['resolve']();
  const map2 = new WeakSet();
  let enabled5 = ![],
    target = room['attention']?.['id'],
    handler = () => {},
    handler2 = () => {},
    presence = { selected: [] };
  const undoCount = [],
    redoCount = [],
    executing = new Map(),
    map3 = new Set(),
    conflicts = createCollaborationConflicts(),
    handler3 = () =>
      map3['size'] > 0x0 ||
      [...executing]['some'](([source, enabled6]) => {
        const next = store['getStateRaw']()['nodes'][source];
        return !enabled6['released'] || next?.['isGenerating'] || next?.['isLoading'];
      }),
    handler4 = () => {
      ((revision['conflicts'] = conflicts['list']()),
        (revision['mediaNodes'] = media['states'](store['getStateRaw']())));
      for (const id of map)
        if (!revision['mediaNodes']['some']((current) => current['id'] === id))
          revision['mediaNodes']['push']({ id: id, owned: !![] });
      if (!enabled2)
        onChange({
          ...revision,
          pending: pending || enabled3 || !!packet || map3['size'] > 0x0,
          executing: executing['size'] > 0x0 || map3['size'] > 0x0,
        });
    },
    rpc = (args) => api['rpc']({ ...args, roomId: room['roomId'], clientId: clientId }, signal['signal']),
    args2 = { roomId: room['roomId'], clientId: clientId },
    media = createCollaborationMediaQueue({
      uploadMedia:
        api['uploadMedia'] && ((entry, record) => api['uploadMedia'](entry, args2, signal['signal'], record)),
      imagePreviews: api['imagePreviews'],
      registerMedia:
        api['registerMedia'] && ((payload) => api['registerMedia'](payload, args2, signal['signal'])),
      bindMedia: api['bindMedia'] && ((handle) => api['bindMedia'](handle, args2, signal['signal'])),
      ...mediaOptions,
      rpc: rpc,
      signal: signal['signal'],
      readGraph: () => store['getStateRaw'](),
      onChange() {
        if (current2()) {
          (result++, (enabled3 = !![]), run());
          if (!setTimeout4)
            setTimeout4 = setTimeout(() => {
              setTimeout4 = null;
              if (current2()) run2();
            }, 0x64);
        }
      },
      onPreview(state, config, scope) {
        const enabled7 = store['getStateRaw']()['nodes'][state];
        if (
          !current2() ||
          !enabled7 ||
          ['src', 'localPath', 'originalLocalPath']['some']((input) => enabled7[input] !== config[input])
        )
          return;
        const output = Object['fromEntries'](
          Object['entries'](scope)['filter'](([value3]) => enabled7[value3] === config[value3]),
        );
        if (Object['keys'](output)['length'])
          store['withGraphMutationBypass'](() => store['updateNodeData'](state, output));
      },
    }),
    current2 = () => !enabled2 && getCanvasId() === value,
    handler5 = () =>
      map['size'] > 0x0 ||
      media['states'](store['getStateRaw']())['some']((value4) => hosting || value4['owned']),
    handler6 = () => {
      if (!current2()) throw new DOMException('Aborted', 'AbortError');
    },
    review = createCollaborationReviewState({
      rpc: rpc,
      current: current2,
      initialRevision: room['reviewRevision'],
      onComment: onComment,
      onChange(value5) {
        ((revision['review'] = value5), handler4());
      },
    }),
    before3 = () => media['project'](store['getStateRaw']()),
    handler7 = (value6) =>
      JSON['stringify'](media['resolveWire'](value6['before'])) === JSON['stringify'](value6['after']),
    handler8 = (value7) => {
      const value8 = revision['locks']?.[value7],
        value9 = revision['jobs']?.['find'](
          (response) => response['node'] === value7 && response['status'] === 'running',
        );
      return (
        (value8 &&
          value8['expiresAt'] * 0x3e8 > Date['now']() &&
          (value8['clientId'] !== clientId || value8['actorId'] !== actorId)) ||
        (value9 && (value9['client'] !== clientId || value9['actor'] !== actorId))
      );
    },
    timer = createCollaborationEditing({
      rpc: rpc,
      flush: async () => {
        if (enabled) await enabled;
        if (pending || enabled3 || packet) await run3();
      },
      current: current2,
      canEdit: (nodeIds) =>
        revision['presenceStatus'] !== 'offline' &&
        run4({ name: 'interaction', args: [], nodeIds: nodeIds, removedNodeIds: [] }),
      async update(value10) {
        (Object['assign'](revision, value10), timer['refresh'](value10['locks']), onPresence(value10));
        if (value10['documentRevision'] > revision['revision']) await run3();
      },
      notify(value11) {
        ((revision['message'] = value11), onNotice(value11), handler4());
      },
      onChange() {
        ((revision['editingPending'] = timer['pending']()),
          (presence['editing'] = timer['presence']()),
          value12?.['changed'](),
          onPresence(revision));
      },
    });
  function run5() {
    (clearTimeout(setTimeout3), (setTimeout3 = null));
    if (!base || !enabled5 || value2) return Promise['resolve']();
    const value13 = JSON['stringify']([
      index,
      result,
      revision['revision'],
      packet?.['operationId'],
      enabled3,
      conflicts['list'](),
    ]);
    if (value13 === data) return options;
    data = value13;
    if (!packet && !enabled3 && !conflicts['list']()['length'] && !media['snapshot']()['length'])
      return (options = journal['clear']()['catch'](() => {
        if (data === value13) data = '';
      }));
    const draft = before3();
    return (options = journal['write']({
      packet: packet,
      base: base,
      draft: draft,
      media: media['snapshot'](),
      conflicts: conflicts['list']()['map']((args3) => ({
        ...args3,
        before: before2[args3['kind']][args3['id']] ?? null,
        after: draft[args3['kind']][args3['id']] ?? null,
      })),
    })['catch'](() => {
      if (data === value13) data = '';
      ((revision['recoveryError'] = '本机恢复记录写入失败，请保持画布开启直到同步完成'), handler4());
    }));
  }
  function run() {
    if (!setTimeout3)
      setTimeout3 = setTimeout(() => {
        void run5();
      }, 0x64);
  }
  const value12 =
      typeof api['presence'] === 'function'
        ? createCollaborationPresenceChannel({
            changeDriven: typeof api['events'] === 'function',
            send: (presence2) => api['presence']({ ...args2, presence: presence2 }, signal['signal']),
            read: () => presence,
            signal: signal['signal'],
            onUpdate(value14) {
              current2() &&
                (Object['assign'](revision, value14),
                timer['refresh'](value14['locks']),
                onPresence(value14));
            },
            onError(value15) {
              current2() &&
                ((revision['presenceStatus'] = 'offline'),
                (revision['latencyMs'] = null),
                onPresence({ presenceStatus: 'offline', latencyMs: null }),
                PERMANENT_ERRORS['has'](value15['code']) && (value12['stop'](), run6(value15)));
            },
          })
        : null,
    value16 =
      typeof api['events'] === 'function'
        ? createCollaborationChangeFeed({
            read: (cursor) => api['events']({ ...args2, cursor: cursor }, signal['signal']),
            signal: signal['signal'],
            onChange(presence3, value17) {
              if (!current2()) return;
              const value18 = { presence: presence3['presence'], locks: presence3['locks'] };
              if (Number['isInteger'](presence3['reviewRevision']))
                void review['refresh'](presence3['reviewRevision']);
              if (
                presence3['attention']?.['id'] &&
                presence3['attention']['id'] !== target &&
                presence3['attention']['actorId'] !== actorId &&
                presence3['attention']['expiresAt'] * 0x3e8 > Date['now']()
              ) {
                target = presence3['attention']['id'];
                const hostAttention = readHostAttention();
                if (hostAttention) revision['locateView'] = presence3['attention']['view'];
                onAttention(hostAttention);
              }
              (Object['assign'](revision, value18), timer['refresh'](value18['locks']), onPresence(value18));
              if (value17) run2();
            },
            onError(value19) {
              PERMANENT_ERRORS['has'](value19['code']) && (value16['stop'](), run6(value19));
            },
          })
        : null;
  let enabled8 = ![];
  function run2() {
    enabled8 = !![];
    if (!enabled)
      queueMicrotask(() => {
        current2() && enabled8 && ((enabled8 = ![]), void run7());
      });
  }
  function run6(error) {
    if (!current2()) return;
    ((revision['status'] = PERMANENT_ERRORS['has'](error['code']) ? 'blocked' : 'offline'),
      (revision['message'] = error['message'] || '连接中断，正在重连；未同步修改保留在本机'),
      (revision['errorCode'] = error['code'] || 'NETWORK_ERROR'),
      handler4());
  }
  async function run8(edges, list = graphChanges(before2, edges)) {
    list = conflicts['reconcile'](list, graphChanges(base, before3()), before3());
    if (!list['length']) return;
    const cloneGraph2 = cloneGraph(store['getStateRaw']()),
      value20 = before3(),
      after2 = new Set(
        graphChanges(base, value20)['map']((value21) => value21['kind'] + ':' + value21['id']),
      ),
      list2 = list['map']((args4) => ({
        ...args4,
        after: after2['has'](args4['kind'] + ':' + args4['id'])
          ? mergeCollaborationFields(
              args4['before'],
              args4['after'],
              value20[args4['kind']][args4['id']] ?? null,
            )
          : args4['after'],
      })),
      state2 = await media['materialize']({
        nodes: Object['fromEntries'](
          list2['filter']((value22) => value22['kind'] === 'nodes' && value22['after'])['map']((value23) => [
            value23['id'],
            value23['after'],
          ]),
        ),
        edges: edges['edges'],
      });
    handler6();
    const graphChanges2 = graphChanges(media['project'](cloneGraph2), before3());
    list = conflicts['reconcile'](list, graphChanges2, before3());
    const list3 = graphChanges(base, before3()),
      map4 = new Set(
        list['filter']((value24) => value24['kind'] === 'nodes')['map']((value25) => value25['id']),
      );
    store['withGraphMutationBypass'](() =>
      store['batch'](() => {
        const list4 = list['filter']((enabled9) => enabled9['kind'] === 'nodes' && !enabled9['after'])['map'](
          (value26) => value26['id'],
        );
        if (list4['length']) store['deleteNodes'](list4);
        for (const [value27, value28] of Object['entries'](state2['nodes'])) {
          if (!map4['has'](value27)) continue;
          const enabled10 = store['getStateRaw']()['nodes'][value27];
          if (!enabled10) store['addNode'](value28);
          const sharedValue2 = sharedValue(cloneGraph2['nodes'][value27] ?? null),
            collaborationFields = mergeCollaborationFields(
              sharedValue2,
              value28,
              sharedValue(enabled10 ?? null),
            ),
            sharedNode = mergeSharedNode(enabled10, collaborationFields);
          delete sharedNode['_collaborationPendingMedia'];
          if (value28['_collaborationPendingMedia'])
            sharedNode['_collaborationPendingMedia'] = value28['_collaborationPendingMedia'];
          store['updateNodeData'](value27, sharedNode, { replace: !![] });
        }
        const list5 = list['filter']((value29) => value29['kind'] === 'edges');
        if (list5['length'] || list4['length'])
          store['updateEdgesBatch'](
            list5['map']((value30) => value30['id']),
            list5['filter']((value31) => value31['after'])['map']((value32) => value32['after']),
          );
      }),
    );
    const value33 = before3();
    for (const value34 of list) {
      const value35 = list3['find'](
          (value36) => value36['kind'] === value34['kind'] && value36['id'] === value34['id'],
        ),
        value37 = value35
          ? mergeCollaborationFields(
              value35['after'],
              value35['before'],
              value33[value34['kind']][value34['id']] ?? null,
            )
          : value33[value34['kind']][value34['id']];
      if (value37) base[value34['kind']][value34['id']] = value37;
      else delete base[value34['kind']][value34['id']];
    }
    media['prepare'](store['getStateRaw']());
  }
  async function run9() {
    if (!enabled3 || packet) return;
    enabled3 = ![];
    const value38 = media['prepare'](store['getStateRaw']());
    (handler6(), map['clear']());
    const changes = graphChanges(base, value38)['filter']((value39) => {
      if (conflicts['has'](value39)) return ![];
      if (value39['kind'] === 'nodes' && handler7(value39) && handler8(value39['id']))
        return (map['add'](value39['id']), ![]);
      return !![];
    });
    changes['length'] &&
      ((packet = {
        operationId: crypto['randomUUID'](),
        changes: changes['map']((args5) => ({
          ...args5,
          before: before2[args5['kind']][args5['id']] ?? null,
        })),
      }),
      (base = applyGraphChanges(base, changes)));
  }
  async function run10() {
    if (!current2() || revision['status'] === 'blocked') return;
    try {
      if (pending) {
        if (enabled4) media['prepare'](cloneGraph(store['getStateRaw']()));
        const list6 = graphChanges(base, before2),
          map5 = new Set(
            list6['filter']((value40) => value40['kind'] === 'nodes')['map']((value41) => value41['id']),
          );
        if (enabled4 && !hosting)
          for (const [id2, before4] of Object['entries'](before2['nodes'])) {
            if (JSON['stringify'](before4)['includes']('aic-asset:') && !map5['has'](id2))
              list6['push']({ kind: 'nodes', id: id2, before: before4, after: before4 });
          }
        await run8(before2, list6);
        if (!enabled4) base = before3();
        else enabled3 = !![];
        ((enabled4 = ![]), (pending = ![]));
      }
      if (value2) {
        const value42 = value2,
          graphChanges3 = applyGraphChanges(
            applyGraphChanges(before2, value42['packet']?.['changes'] || []),
            value42['conflicts'] || [],
          );
        await run8(graphChanges3);
        const value43 = before3(),
          list7 = graphChanges(value42['base'], value42['draft']),
          graphChanges4 = applyGraphChanges(graphChanges3, list7);
        (await run8(graphChanges4, graphChanges(graphChanges3, graphChanges4)),
          (base = value43),
          (packet = value42['packet'] || null),
          (enabled3 = list7['length'] > 0x0),
          conflicts['hold'](value42['conflicts'] || []),
          (value2 = null));
      }
      if (map['size']) enabled3 = !![];
      (await run9(), handler6());
      if (packet) {
        const operationId = packet;
        ((revision['message'] = '正在同步修改'), handler4());
        let value44;
        await run5();
        try {
          value44 = await rpc({
            action: 'apply',
            operationId: operationId['operationId'],
            changes: operationId['changes'],
          });
        } catch (value45) {
          if (!['EDIT_CONFLICT', 'NODE_BUSY', 'TASK_BUSY']['includes'](value45['code'])) throw value45;
          const dom = await rpc({ action: 'sync', revision: -0x1 }),
            changes2 =
              operationId['historyMode'] || !dom['document']
                ? { blocked: operationId['changes'], safe: [] }
                : partitionCollaborationConflict(operationId['changes'], dom, actorId, clientId);
          (['NODE_BUSY', 'TASK_BUSY']['includes'](value45['code']) &&
            !operationId['historyMode'] &&
            (changes2['blocked'] = changes2['blocked']['filter']((value46) => {
              if (!handler7(value46)) return !![];
              return (
                map['add'](value46['id']),
                (base[value46['kind']][value46['id']] = value46['before']),
                ![]
              );
            })),
            conflicts['hold'](changes2['blocked']),
            (packet = changes2['safe']['length']
              ? { operationId: crypto['randomUUID'](), changes: changes2['safe'] }
              : null),
            (revision['message'] = '部分节点需要处理冲突，其他节点可继续协作'));
        }
        handler6();
        if (value44) {
          const list8 = value44['changes'] || operationId['changes'];
          if (!list8['length'] && operationId['changes']['length']) revision['revision'] = -0x1;
          const graphChanges5 = applyGraphChanges(before2, list8);
          if (operationId['historyMode']) {
            await run8(graphChanges5, list8);
            const value47 = operationId['historyMode'] === 'undo' ? undoCount : redoCount;
            (value47['pop'](),
              (operationId['historyMode'] === 'undo' ? redoCount : undoCount)['push'](
                operationId['original'],
              ));
          } else {
            const before5 = new Map(
                operationId['changes']['map']((value48) => [value48['kind'] + ':' + value48['id'], value48]),
              ),
              list9 = list8['filter'](
                (value49) =>
                  JSON['stringify'](value49['after']) !==
                  JSON['stringify'](before5['get'](value49['kind'] + ':' + value49['id'])?.['after']),
              );
            await run8(
              graphChanges5,
              list9['map']((args6) => ({
                ...args6,
                before: before5['has'](args6['kind'] + ':' + args6['id'])
                  ? before5['get'](args6['kind'] + ':' + args6['id'])['after']
                  : args6['before'],
              })),
            );
            const list10 = list8['filter']((value50) => !handler7(value50));
            list10['length'] && (undoCount['push'](list10), (redoCount['length'] = 0x0));
            if (undoCount['length'] > 0x32) undoCount['shift']();
          }
          ((before2 = graphChanges5), (packet = null));
        }
      }
      const dom2 = await rpc({
        action: 'sync',
        revision: revision['revision'],
        ...(value12 ? {} : { presence: presence }),
      });
      handler6();
      if (
        dom2['roomId'] !== room['roomId'] ||
        !Number['isInteger'](dom2['revision']) ||
        !Array['isArray'](dom2['members'])
      )
        throw new Error('协作服务响应无效');
      const list11 = (dom2['operations'] || [])['flatMap']((value51) => value51['changes']),
        value52 = list11['length']
          ? applyGraphChanges(dom2['document'] || before2, list11)
          : dom2['document'] || before2,
        list12 = value52 === before2 ? [] : graphChanges(before2, value52);
      list12['length'] && (await run8(value52, list12), (before2 = cloneGraph(value52)));
      value12 && revision['presenceStatus'] === 'online' && (delete dom2['presence'], delete dom2['locks']);
      (Object['assign'](revision, dom2, {
        status: 'online',
        message: conflicts['list']()['length']
          ? '部分节点有冲突，其他节点可继续协作'
          : '房主已接收修改 · 项目文件由房主保存',
        errorCode: '',
      }),
        timer['refresh'](dom2['locks']),
        delete revision['document'],
        delete revision['operations']);
      if (Number['isInteger'](dom2['reviewRevision'])) void review['refresh'](dom2['reviewRevision']);
      for (const [nodeId, taskId] of executing) {
        const enabled11 = store['getStateRaw']()['nodes'][nodeId];
        if (
          taskId['released'] &&
          !enabled11?.['isGenerating'] &&
          !enabled11?.['isLoading'] &&
          !enabled3 &&
          !packet &&
          !media['states'](store['getStateRaw']())['some']((value53) => value53['id'] === nodeId)
        ) {
          if (
            !taskId['uncertain'] ||
            revision['jobs']['some'](
              (response2) =>
                response2['node'] === nodeId &&
                response2['id'] === taskId['taskId'] &&
                response2['actor'] === actorId &&
                response2['client'] === clientId &&
                response2['status'] === 'running',
            )
          )
            await rpc({ action: 'finishTask', nodeId: nodeId, taskId: taskId['taskId'] });
          executing['delete'](nodeId);
        }
      }
      (handler4(), await run5());
      if (!enabled3 && !packet && !conflicts['list']()['length'] && key !== revision['revision'])
        try {
          (await onConfirmed(before2, media['snapshotBindings'](store['getStateRaw']())),
            (key = revision['revision']));
        } catch {
          ((revision['recoveryError'] = '无法保存本机协作基线，请保持画布开启并重试'), handler4());
        }
    } catch (value54) {
      run6(value54);
    }
  }
  function run7() {
    if (!enabled)
      enabled = run10()['finally'](() => {
        enabled = null;
        if (enabled8) run2();
      });
    return enabled;
  }
  async function run3(handler9 = () => !![]) {
    await run7();
    while (handler9() && current2() && revision['status'] === 'online' && (enabled3 || packet)) await run7();
  }
  function run11() {
    if (enabled2) return;
    setTimeout2 = setTimeout(
      async () => {
        (await run7(), run11());
      },
      revision['status'] === 'offline' ? 0xbb8 : value16 ? 0x2710 : 0x1f4,
    );
  }
  function destroy() {
    (clearTimeout(setTimeout4), (setTimeout4 = null));
    if (enabled2) return item;
    return (
      (enabled2 = !![]),
      clearTimeout(setTimeout2),
      value12?.['stop'](),
      value16?.['stop'](),
      signal['abort'](),
      void run5()['finally'](() => journal['close']()),
      handler(),
      handler2(),
      media['dispose'](),
      timer['dispose'](),
      (item = (
        hosting && api['disconnect']
          ? api['disconnect']()
          : api['rpc']({ action: 'disconnect', roomId: room['roomId'], clientId: clientId })
      )['catch'](() => {})),
      item
    );
  }
  function run4({ name: name, args: args7, nodeIds: nodeIds2, removedNodeIds: removedNodeIds }) {
    if (!current2()) return ![];
    if (
      name === 'updateNodeData' &&
      args7[0x2]?.['replace'] !== !![] &&
      args7[0x1] &&
      Object['keys'](sharedValue(args7[0x1]))['length'] === 0x0
    )
      return !![];
    if (packet?.['historyMode']) return ![];
    const enabled12 = name === 'updateNodeData' && executing['has'](args7[0x0]);
    if (revision['status'] !== 'online' && !enabled12) return ![];
    if (revision['role'] === 'viewer') return ![];
    if (conflicts['blocks'](nodeIds2, store['getStateRaw']())) return ![];
    return nodeIds2['every']((value55) => {
      if (map3['has'](value55)) return ![];
      const enabled13 = revision['locks']?.[value55],
        enabled14 = revision['jobs']?.['find'](
          (response3) => response3['node'] === value55 && response3['status'] === 'running',
        );
      if (removedNodeIds['includes'](value55) && (executing['has'](value55) || enabled14)) return ![];
      return (
        (!enabled13 ||
          (enabled13['clientId'] === clientId && enabled13['actorId'] === actorId) ||
          enabled13['expiresAt'] * 0x3e8 <= Date['now']()) &&
        (!enabled14 || (enabled14['client'] === clientId && enabled14['actor'] === actorId))
      );
    });
  }
  async function run12(historyMode) {
    await run7();
    if (revision['status'] !== 'online' || enabled3 || packet || executing['size'] || map3['size']) return;
    const value56 = historyMode === 'undo' ? undoCount : redoCount,
      original = media['resolveWire'](value56['at'](-0x1));
    if (!original) return;
    const changes3 = historyMode === 'undo' ? invertChanges(original) : original;
    try {
      for (const value57 of changes3)
        mergeCollaborationFields(
          value57['before'],
          value57['after'],
          before2[value57['kind']][value57['id']] ?? null,
        );
    } catch {
      ((revision['message'] = '目标已被其他成员修改，不能撤销或重做这一步'), handler4());
      return;
    }
    ((packet = {
      operationId: crypto['randomUUID'](),
      changes: changes3,
      historyMode: historyMode,
      original: original,
    }),
      await run7());
  }
  const enabled15 = {
    state: revision,
    async start({
      publish: publish = ![],
      hostBase: hostBase = null,
      mediaBindings: mediaBindings = [],
    } = {}) {
      try {
        const value58 = await journal['read']();
        ((enabled5 = !![]), media['restore'](value58?.['media']));
        if (
          value58?.['schema'] === 0x1 &&
          value58['base']?.['nodes'] &&
          value58['draft']?.['nodes'] &&
          (value58['packet'] ||
            value58['conflicts']?.['length'] ||
            graphChanges(value58['base'], value58['draft'])['length'])
        )
          value2 = value58;
      } catch {
        revision['recoveryError'] = '无法读取本机协作恢复记录';
      }
      (media['restoreBindings'](mediaBindings),
        (base = media['project'](store['getStateRaw']())),
        (handler = store['setGraphMutationPolicy']({
          beginInteraction: (value59) => timer['begin'](value59),
          async beforeWorkspaceTransition() {
            await run7();
            if (!enabled15['canDetach']())
              return ((revision['message'] = '请先完成同步和生成任务，再切换画布'), handler4(), ![]);
            return (await enabled15['detach'](), !![]);
          },
          before(value60) {
            if (!run4(value60)) return ![];
            const { name: name2, args: args8 } = value60,
              value61 =
                name2 === 'updateNodeData' && !args8[0x2]?.['replace']
                  ? { [args8[0x0]]: args8[0x1] }
                  : name2 === 'updateNodesData'
                    ? args8[0x0]
                    : null;
            if (
              value61 &&
              Object['entries'](value61)['every'](
                ([value62, value63]) =>
                  value63 &&
                  !store['getStateRaw']()['nodes'][value62]?.['_collaborationPendingMedia']?.['some'](
                    (value64) => Object['hasOwn'](value63, value64['path'][0x0]),
                  ) &&
                  Object['entries'](sharedValue(value63))['every'](
                    ([value65, value66]) =>
                      JSON['stringify'](value66) ===
                      JSON['stringify'](
                        sharedValue(store['getStateRaw']()['nodes'][value62]?.[value65], value65),
                      ),
                  ),
              )
            )
              map2['add'](value60);
            return !![];
          },
          after(value67) {
            if (map2['delete'](value67)) {
              if (value67['nodeIds']['some']((value68) => executing['get'](value68)?.['released'])) run2();
              return;
            }
            (index++,
              media['afterEdit'](value67, store['getStateRaw'](), (value69, _collaborationPendingMedia) =>
                store['withGraphMutationBypass'](() =>
                  store['updateNodeData'](value69, {
                    _collaborationPendingMedia: _collaborationPendingMedia,
                  }),
                ),
              ),
              (enabled3 = !![]),
              handler4(),
              run());
            if (value16) run2();
          },
          beforeReplace() {
            if (!enabled15['canDetach']()) return ![];
            return (enabled15['detach'](), !![]);
          },
          history: {
            commit() {
              return (index++, (enabled3 = !![]), handler4(), run(), { id: 'collaboration-pending' });
            },
            undo: () => {
              void run12('undo');
            },
            redo: () => {
              void run12('redo');
            },
            getHistoryInfo: () => ({ undoCount: undoCount['length'] + 0x1, redoCount: redoCount['length'] }),
          },
        })));
      const value70 = {
          async acquire(value71, enabled16 = {}) {
            if (revision['status'] !== 'online' || revision['role'] === 'viewer')
              throw new Error('当前协作画布不能发起生成');
            const nodeId2 = value71['targetNodeId'] || value71['sourceNodeId'];
            if (map3['has'](nodeId2) || (executing['has'](nodeId2) && !enabled16['recovering']))
              throw new Error('该节点正在请求或执行生成，请等待结束');
            (map3['add'](nodeId2), handler4());
            let taskId2,
              value72 = ![];
            try {
              ((enabled3 = !![]), await run3(), handler6());
              if (enabled3 || packet || revision['status'] !== 'online') throw new Error('请先完成画布同步');
              const map6 = new Set([nodeId2]);
              for (let value73 = -0x1; value73 !== map6['size'];) {
                value73 = map6['size'];
                for (const value74 of Object['values'](store['getStateRaw']()['edges']))
                  if (map6['has'](value74['targetId'])) map6['add'](value74['sourceId']);
              }
              if (media['states'](store['getStateRaw']())['some']((value75) => map6['has'](value75['id'])))
                throw new Error('此节点的素材尚未准备完成，请稍后重试');
              if (enabled16['recovering']) {
                const taskId3 = revision['jobs']?.['find'](
                  (response4) => response4['node'] === nodeId2 && response4['status'] === 'running',
                );
                if (!taskId3 || taskId3['client'] !== clientId || taskId3['actor'] !== actorId)
                  throw new Error('只能恢复当前客户端拥有的协作生成任务');
                const value76 = { taskId: taskId3['id'], released: ![] };
                return (
                  executing['set'](nodeId2, value76),
                  async () => {
                    ((value76['released'] = !![]), (enabled3 = !![]), await run7());
                  }
                );
              }
              ((taskId2 = crypto['randomUUID']()),
                (value72 = !![]),
                await rpc({ action: 'claimTask', nodeId: nodeId2, taskId: taskId2 }),
                handler6());
              const value77 = { taskId: taskId2, released: ![] };
              return (
                executing['set'](nodeId2, value77),
                handler4(),
                async () => {
                  ((value77['released'] = !![]), (enabled3 = !![]), await run7());
                }
              );
            } catch (response5) {
              value72 &&
                current2() &&
                !(response5['status'] >= 0x190 && response5['status'] < 0x1f4) &&
                (executing['set'](nodeId2, { taskId: taskId2, released: !![], uncertain: !![] }),
                (enabled3 = !![]),
                run6(response5));
              throw response5;
            } finally {
              (map3['delete'](nodeId2), handler4());
            }
          },
        },
        list13 = [setGenerationExecutionPolicy(store, value70)];
      if (store['graphStore']) list13['push'](setGenerationExecutionPolicy(store['graphStore'], value70));
      return (
        (handler2 = () => list13['forEach']((handler10) => handler10())),
        publish
          ? ((base = cloneGraph(before2)), (enabled3 = !![]))
          : (hostBase?.['nodes'] && hostBase?.['edges'] && ((base = cloneGraph(hostBase)), (enabled4 = !![])),
            (pending = !![])),
        await run7(),
        run11(),
        handler4(),
        void value12?.['start'](),
        void value16?.['start'](),
        enabled15
      );
    },
    setPresence(args9) {
      ((presence = { ...presence, ...args9 }), value12?.['changed']());
    },
    beginEditing(value78) {
      return timer['begin'](value78);
    },
    follow(value79) {
      ((revision['followActorId'] = value79 || ''), handler4());
    },
    locate(value80) {
      ((revision['locateActorId'] = value80 || ''), (revision['followActorId'] = ''), handler4());
    },
    summon() {
      return enabled15['command']('attention', { view: presence['view'] });
    },
    retryMedia(value81) {
      media['retry'](value81, store['getStateRaw']());
    },
    async resolveConflicts(value82) {
      await run7();
      if (packet || enabled3 || revision['status'] !== 'online') throw new Error('请先完成其他修改的同步');
      const list14 = conflicts['list'](),
        value83 = list14['map']((args10) => ({
          ...args10,
          before: before3()[args10['kind']][args10['id']] ?? null,
          after: before2[args10['kind']][args10['id']] ?? null,
        }));
      conflicts['clear']();
      if (value82) {
        for (const value84 of list14) {
          if (before2[value84['kind']][value84['id']])
            base[value84['kind']][value84['id']] = structuredClone(before2[value84['kind']][value84['id']]);
          else delete base[value84['kind']][value84['id']];
        }
        enabled3 = !![];
      } else await run8(before2, value83);
      (await run7(), handler4());
    },
    async flush() {
      (await value12?.['flush'](), await run3());
    },
    async prepareDetach({ signal: signal2, timeoutMs: timeoutMs = 0x2710 } = {}) {
      const run13 = () => new DOMException('Aborted', 'AbortError');
      if (signal2?.['aborted']) throw run13();
      if (handler3()) throw new Error('请等待当前生成任务结束后退出协作');
      if (handler5())
        throw new Error(
          '素材尚未同步完成，请等待完成；也可选择“结束本次联机 → 确定”，保留当前本机内容后退出',
        );
      if (conflicts['list']()['length'])
        throw new Error('存在未处理的冲突，请先处理；也可选择“结束本次联机 → 确定”，保留当前本机内容后退出');
      if (enabled15['canDetach']()) return;
      let enabled17 = !![],
        setTimeout5,
        value85;
      const value86 = new Promise((value87, handler11) => {
        ((value85 = () => {
          ((enabled17 = ![]), handler11(run13()));
        }),
          signal2?.['addEventListener']('abort', value85, { once: !![] }),
          (setTimeout5 = setTimeout(() => {
            ((enabled17 = ![]),
              handler11(
                new Error('同步等待超时，修改仍保留在当前画布；请重试，或选择“结束本次联机 → 确定”直接退出'),
              ));
          }, timeoutMs)));
      });
      try {
        await Promise['race']([run3(() => enabled17), value86]);
      } finally {
        ((enabled17 = ![]), clearTimeout(setTimeout5), signal2?.['removeEventListener']('abort', value85));
      }
      if (signal2?.['aborted']) throw run13();
      handler6();
      if (!enabled15['canDetach']())
        throw new Error('当前仍有未同步修改，请重试，或选择“结束本次联机 → 确定”保留当前本机内容后退出');
    },
    review: review,
    async command(action, args11 = {}) {
      if (['invite', 'renameSelf']['includes'](action)) {
        handler6();
        const name3 = await rpc({ action: action, ...args11 });
        return (
          handler6(),
          action === 'renameSelf' &&
            ((revision['members'] = revision['members']['map']((args12) =>
              args12['id'] === actorId ? { ...args12, name: name3['displayName'] } : args12,
            )),
            (revision['presence'] = revision['presence']['map']((args13) =>
              args13['actorId'] === actorId ? { ...args13, name: name3['displayName'] } : args13,
            )),
            handler4()),
          name3
        );
      }
      await run7();
      if (packet || enabled3) throw new Error('请先完成同步，或保留画布草稿后退出');
      if (['leave', 'close']['includes'](action) && handler3()) throw new Error('请先结束当前生成任务');
      if (['leave', 'close']['includes'](action) && handler5())
        throw new Error('当前素材尚未同步，请等待完成或保留画布草稿后退出');
      const value88 = await rpc({ action: action, ...args11 });
      if (['leave', 'close']['includes'](action)) await enabled15['detach']();
      else await run7();
      return value88;
    },
    canDetach() {
      return (
        !pending &&
        !handler5() &&
        !enabled3 &&
        !packet &&
        !executing['size'] &&
        !map3['size'] &&
        !conflicts['list']()['length']
      );
    },
    detach({ force: force = ![] } = {}) {
      if (handler3()) throw new Error('请等待当前生成任务结束后退出协作');
      if (!force && (handler5() || packet || enabled3 || conflicts['list']()['length']))
        throw new Error('当前有未同步素材、修改或冲突，请先保留画布草稿');
      if (enabled2) return item;
      const value89 = destroy();
      return (onDetach(), value89);
    },
    destroy: destroy,
  };
  return enabled15;
}
