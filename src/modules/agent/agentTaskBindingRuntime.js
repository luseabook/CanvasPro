const TASK_TERMINAL_STATUSES = new Set([
    'success',
    'succeeded',
    'completed',
    'complete',
    'done',
    'failed',
    'fail',
    'error',
    'cancelled',
    'canceled',
  ]),
  TASK_SUCCESS_STATUSES = new Set(['success', 'succeeded', 'completed', 'complete', 'done']),
  TASK_FAILURE_STATUSES = new Set(['failed', 'fail', 'error']),
  TASK_CANCELLED_STATUSES = new Set(['cancelled', 'canceled']),
  MAX_TASK_MEDIA_ITEMS = 12;
function getNode(state = {}, value = '') {
  const item = String(value || '')['trim']();
  return item ? state['nodes']?.[item] || null : null;
}
function normalizeTaskStatus(key = '') {
  const index = String(key || '')
    ['trim']()
    ['toLowerCase']();
  if (index === 'queued' || index === 'submitted') return 'pending';
  if (index === 'generating' || index === 'processing') return 'running';
  return index;
}
function isTerminalTaskStatus(result = '') {
  return TASK_TERMINAL_STATUSES['has'](normalizeTaskStatus(result));
}
function getNodeTaskStatus(options = {}) {
  return normalizeTaskStatus(
    options['jobStatus'] ||
      options['rhTaskStatus'] ||
      options['asyncTaskStatus'] ||
      options['textJobStatus'] ||
      options['videoJobStatus'] ||
      options['storyboardScript']?.['jobStatus'] ||
      (options['isGenerating'] ? 'running' : ''),
  );
}
function getNodeTaskId(options2 = {}) {
  return String(options2['taskId'] || options2['rhTaskId'] || options2['asyncTaskId'] || '')['trim']();
}
function getNodeLabel(error2 = {}, data = '') {
  const list = String(error2['type'] || ''),
    target = list['includes']('video')
      ? '视频'
      : list['includes']('audio')
        ? '音频'
        : list['includes']('text')
          ? '文本'
          : '图片',
    source = String(error2['name'] || error2['title'] || '')['trim']();
  return source ? source + '（' + target + '节点）' : (data || '目标') + '（' + target + '节点）';
}
function getResultKindFromNode(options3 = {}) {
  const list2 = String(options3['type'] || '')['toLowerCase']();
  if (list2['includes']('video')) return 'video';
  if (list2['includes']('audio')) return 'audio';
  if (list2['includes']('text')) return 'text';
  if (list2['includes']('image')) return 'image';
  return '';
}
function normalizeTaskMediaUrl(next = '') {
  const enabled = String(next || '')['trim']();
  if (!enabled || /^data:/i['test'](enabled)) return '';
  return enabled;
}
function normalizeImageTaskMediaItem(response = {}, current = '') {
  if (!response || typeof response !== 'object') return null;
  if (response['error'] || response['status'] === 'failed') return null;
  const url = normalizeTaskMediaUrl(
      response['imageUrl'] ||
        response['url'] ||
        response['sourceUrl'] ||
        response['localPath'] ||
        response['displayLocalPath'],
    ),
    thumbUrl = normalizeTaskMediaUrl(
      response['thumbUrl'] ||
        response['thumbnailUrl'] ||
        response['previewUrl'] ||
        response['imageUrl'] ||
        response['url'] ||
        url,
    );
  if (!url && !thumbUrl) return null;
  return {
    url: url || thumbUrl,
    thumbUrl: thumbUrl || url,
    name: String(response['name'] || response['title'] || current || '')['trim'](),
  };
}
function buildImageTaskMedia(imageUrl = {}, entry = '') {
  const name = getNodeLabel(imageUrl, entry),
    list3 = Array['isArray'](imageUrl['images'])
      ? imageUrl['images']
          ['map']((record) => normalizeImageTaskMediaItem(record, name))
          ['filter'](Boolean)
          ['slice'](0, MAX_TASK_MEDIA_ITEMS)
      : [],
    imageTaskMediaItem = normalizeImageTaskMediaItem(
      {
        imageUrl:
          imageUrl['imageUrl'] ||
          imageUrl['url'] ||
          imageUrl['sourceUrl'] ||
          imageUrl['localPath'] ||
          imageUrl['displayLocalPath'],
        thumbUrl: imageUrl['thumbUrl'] || imageUrl['thumbnailUrl'] || imageUrl['previewUrl'],
        name: name,
      },
      name,
    ),
    items = list3['length'] > 0 ? list3 : imageTaskMediaItem ? [imageTaskMediaItem] : [];
  if (items['length'] === 0) return null;
  const url2 = items[0];
  return {
    kind: 'image',
    url: url2['url'],
    thumbUrl: url2['thumbUrl'],
    name: name,
    items: items,
  };
}
function getTaskErrorText(options4 = {}, payload = '') {
  return String(
    options4['jobError'] ||
      options4['rhStatusMessage'] ||
      options4['asyncTaskError'] ||
      options4['textError'] ||
      options4['videoError'] ||
      options4['storyboardScript']?.['jobError'] ||
      payload ||
      '',
  )['trim']();
}
function getGenerationResponses(options5 = {}) {
  const list4 = Array['isArray'](options5['results'])
    ? options5['results']
    : Array['isArray'](options5['raw']?.['result']?.['actions'])
      ? options5['raw']['result']['actions']
      : [];
  return list4['flatMap']((handle) => {
    const commandId = String(handle?.['commandId'] || '');
    if (commandId === 'generation.run') return [handle];
    if (commandId !== 'generation.runBatch') return [];
    return (Array['isArray'](handle?.['result']?.['results']) ? handle['result']['results'] : [])['map'](
      (result2) => ({
        commandId: commandId,
        ok: !TASK_FAILURE_STATUSES['has'](normalizeTaskStatus(result2?.['status'])),
        result: result2,
      }),
    );
  });
}
function normalizeGenerationResponseStatus(response2 = {}) {
  const el = response2['result'] || {},
    response3 = el['value'] || {},
    taskStatus = normalizeTaskStatus(
      el['status'] ||
        response3['status'] ||
        response3['jobStatus'] ||
        response3['result']?.['status'] ||
        (response2['ok'] === false ? 'failed' : ''),
    );
  if (taskStatus) return taskStatus;
  if (response2['ok'] === true && (el['taskId'] || response3['taskId'])) return 'running';
  return '';
}
function getGenerationResponseNodeId(options6 = {}) {
  const el2 = options6['result'] || {};
  return String(
    el2['nodeId'] || el2['targetNodeId'] || el2['value']?.['nodeId'] || el2['value']?.['targetNodeId'] || '',
  )['trim']();
}
function getGenerationResponseTaskId(options7 = {}) {
  const el3 = options7['result'] || {},
    config = el3['value'] || {};
  return String(
    el3['taskId'] ||
      el3['rhTaskId'] ||
      config['taskId'] ||
      config['rhTaskId'] ||
      config['result']?.['taskId'] ||
      '',
  )['trim']();
}
function buildTaskBindingId({
  conversationId: conversationId = '',
  turnId: turnId = '',
  nodeId: nodeId = '',
  taskId: taskId = '',
} = {}) {
  return [
    'agent-task',
    conversationId || 'conversation',
    turnId || 'turn',
    nodeId || 'node',
    taskId || 'local',
  ]
    ['map']((scope) => String(scope || '')['replace'](/[^A-Za-z0-9_-]+/g, '_'))
    ['join'](':');
}
function getTaskMessageStatus(input = '') {
  const taskStatus2 = normalizeTaskStatus(input);
  if (TASK_SUCCESS_STATUSES['has'](taskStatus2)) return 'success';
  if (TASK_FAILURE_STATUSES['has'](taskStatus2)) return 'failed';
  if (TASK_CANCELLED_STATUSES['has'](taskStatus2)) return 'cancelled';
  if (taskStatus2 === 'pending') return 'pending';
  return taskStatus2 || 'running';
}
export function createAgentTaskBindingRuntime({
  store: store,
  sessionStore: sessionStore,
  readCanvasState: readCanvasState,
  getActiveConversationId: getActiveConversationId,
  getCurrentTurnId: getCurrentTurnId,
  formatText: formatText,
  onBindingsChanged: onBindingsChanged = null,
} = {}) {
  if (!sessionStore || typeof readCanvasState !== 'function')
    throw new TypeError(
      '[agentTaskBindingRuntime] sessionStore and readCanvasState are required',
    );
  function run(output, value2 = {}) {
    return typeof formatText === 'function' ? formatText(output, value2) : output;
  }
  function content({ node: node = {}, nodeId: nodeId = '', status: status = '', error: error = '' } = {}) {
    const taskStatus3 = normalizeTaskStatus(status),
      nodeLabel = getNodeLabel(node, nodeId);
    if (TASK_SUCCESS_STATUSES['has'](taskStatus3)) return run('taskCompleted', { nodeLabel: nodeLabel });
    if (TASK_FAILURE_STATUSES['has'](taskStatus3))
      return run('taskFailed', {
        nodeLabel: nodeLabel,
        error: error || run('actionExecutionFailed'),
      });
    if (TASK_CANCELLED_STATUSES['has'](taskStatus3)) return run('taskCancelled', { nodeLabel: nodeLabel });
    if (taskStatus3 === 'pending') return run('taskPending', { nodeLabel: nodeLabel });
    return run('taskStarted', { nodeLabel: nodeLabel });
  }
  function run2({ binding: binding = {}, node: node = {}, status: status = '', error: error = '' } = {}) {
    const nodeId2 = String(binding['nodeId'] || binding['targetNodeId'] || node['id'] || '')['trim'](),
      status2 = getTaskMessageStatus(status),
      resultKind = getResultKindFromNode(node),
      value3 = status2 === 'success' && resultKind === 'image' ? buildImageTaskMedia(node, nodeId2) : null,
      task = {
        nodeId: nodeId2,
        taskId: String(binding['taskId'] || '')['trim'](),
        commandId: String(binding['commandId'] || 'generation.run')['trim'](),
        status: status2,
        resultKind: resultKind,
      };
    if (value3) task['media'] = value3;
    return {
      role: 'assistant',
      status: status2,
      messageType: isTerminalTaskStatus(status2) ? 'task_result' : 'task_status',
      content: content({ node: node, nodeId: nodeId2, status: status2, error: error }),
      task: task,
    };
  }
  function run3(options8 = {}, { turnId: turnId = '' } = {}) {
    const nodeId3 = getGenerationResponseNodeId(options8);
    if (!nodeId3) return null;
    const value4 = readCanvasState(),
      node2 = getNode(value4, nodeId3) || {},
      taskId2 = getGenerationResponseTaskId(options8) || getNodeTaskId(node2),
      status3 = normalizeGenerationResponseStatus(options8) || getNodeTaskStatus(node2);
    if (!status3 && !taskId2) return null;
    const conversationId2 = String(getActiveConversationId?.() || '')['trim'](),
      turnId2 = String(getCurrentTurnId?.(turnId) || turnId || '')['trim']();
    return {
      id: buildTaskBindingId({
        conversationId: conversationId2,
        turnId: turnId2,
        nodeId: nodeId3,
        taskId: taskId2,
      }),
      conversationId: conversationId2,
      turnId: turnId2,
      nodeId: nodeId3,
      targetNodeId: nodeId3,
      taskId: taskId2,
      commandId: String(options8['commandId'] || 'generation.run'),
      status: status3 || 'running',
      notifiedTerminal: false,
    };
  }
  function run4(binding2 = {}, { node: node = {}, status: status = '', error: error = '' } = {}) {
    const value5 = run2({
      binding: binding2,
      node: node,
      status: status || binding2['status'],
      error: error,
    });
    return (sessionStore['pushHistory']?.(value5), value5);
  }
  function run5(enabled2 = {}, value6 = {}) {
    if (!enabled2?.['id'] || typeof sessionStore['updateTaskBinding'] !== 'function') return null;
    return sessionStore['updateTaskBinding'](enabled2['id'], value6);
  }
  function sync(value7 = readCanvasState()) {
    const value8 = sessionStore['getTaskBindings']?.() || [];
    for (const taskId3 of value8) {
      if (!taskId3?.['nodeId'] || taskId3['notifiedTerminal'] === true) continue;
      const node3 = getNode(value7, taskId3['nodeId']) || {},
        status4 = getNodeTaskStatus(node3);
      if (!status4) continue;
      const messageStatus = getTaskMessageStatus(status4),
        args = {
          status: status4,
          messageStatus: messageStatus,
          taskId: taskId3['taskId'] || getNodeTaskId(node3),
        };
      if (isTerminalTaskStatus(status4))
        (run4(
          { ...taskId3, ...args, notifiedTerminal: true },
          { node: node3, status: status4, error: getTaskErrorText(node3) },
        ),
          run5(taskId3, { ...args, notifiedTerminal: true }));
      else
        (messageStatus !== taskId3['messageStatus'] || status4 !== taskId3['status']) && run5(taskId3, args);
    }
    onBindingsChanged?.();
  }
  function registerExecution(options9 = {}, { turnId: turnId = '' } = {}) {
    const list5 = getGenerationResponses(options9),
      value9 = readCanvasState(),
      list6 = list5['map']((response4) => {
        const response5 = run3(response4, { turnId: turnId });
        if (!response5) return null;
        const node4 = getNode(value9, response5['nodeId']) || {},
          status5 = normalizeTaskStatus(response5['status'] || getNodeTaskStatus(node4) || 'running');
        return {
          response: response4,
          node: node4,
          binding: {
            ...response5,
            status: status5,
            messageStatus: getTaskMessageStatus(status5),
            notifiedTerminal: isTerminalTaskStatus(status5),
          },
        };
      })['filter'](Boolean),
      value10 =
        typeof sessionStore['upsertTaskBindings'] === 'function'
          ? sessionStore['upsertTaskBindings'](list6['map']((value11) => value11['binding']))
          : list6['map'](
              (value12) => sessionStore['upsertTaskBinding']?.(value12['binding']) || value12['binding'],
            ),
      value13 = list6['map']((node5, value14) =>
        run4(value10[value14] || node5['binding'], {
          node: node5['node'],
          status: node5['binding']['status'],
          error: getTaskErrorText(
            node5['node'],
            node5['response']['message'] || node5['response']['result']?.['message'] || '',
          ),
        }),
      );
    return (
      list5['some']((value15) =>
        isTerminalTaskStatus(getNodeTaskStatus(getNode(value9, getGenerationResponseNodeId(value15)) || {})),
      ) && sync(value9),
      value13
    );
  }
  function getPending(value16 = '') {
    const value17 = String(value16 || '')['trim'](),
      value18 = readCanvasState();
    return (sessionStore['getTaskBindings']?.() || [])['filter']((response6) => {
      if (value17 && response6['turnId'] !== value17) return false;
      if (isTerminalTaskStatus(response6['status'])) return false;
      const nodeTaskStatus = getNodeTaskStatus(getNode(value18, response6['nodeId']) || {});
      return Boolean(
        response6['taskId'] || ['pending', 'running']['includes'](normalizeTaskStatus(nodeTaskStatus)),
      );
    });
  }
  function getSettlement(list7 = []) {
    const map = new Set(list7),
      bindings = (sessionStore['getTaskBindings']?.() || [])['filter']((value19) =>
        map['has'](value19['id']),
      );
    if (
      map['size'] === 0 ||
      bindings['length'] !== map['size'] ||
      bindings['some']((response7) => !isTerminalTaskStatus(response7['status']))
    )
      return { settled: false, allSucceeded: false, bindings: bindings };
    const allSucceeded = bindings['every']((response8) =>
        TASK_SUCCESS_STATUSES['has'](normalizeTaskStatus(response8['status'])),
      ),
      failedBinding = allSucceeded
        ? null
        : bindings['find'](
            (response9) => !TASK_SUCCESS_STATUSES['has'](normalizeTaskStatus(response9['status'])),
          ) || null,
      value20 = readCanvasState();
    return {
      settled: true,
      allSucceeded: allSucceeded,
      bindings: bindings,
      failedBinding: failedBinding,
      failureMessage: failedBinding
        ? content({
            node: getNode(value20, failedBinding['nodeId']) || {},
            nodeId: failedBinding['nodeId'],
            status: failedBinding['status'] || 'failed',
          })
        : '',
    };
  }
  let enabled3 = false,
    value21 = null;
  function start() {
    if (enabled3) return;
    enabled3 = true;
    if (typeof store?.['subscribeSelector'] === 'function')
      value21 = store['subscribeSelector'](
        (value22) => Number(value22?.['_persistRev'] || 0),
        () => sync(readCanvasState()),
      );
    else {
      if (typeof store?.['subscribeRaw'] === 'function')
        value21 = store['subscribeRaw']((value23) => sync(value23 || readCanvasState()));
      else
        typeof store?.['subscribe'] === 'function' &&
          (value21 = store['subscribe']((value24) => sync(value24 || readCanvasState())));
    }
  }
  return Object['freeze']({
    getPending: getPending,
    getSettlement: getSettlement,
    registerExecution: registerExecution,
    start: start,
    sync: sync,
    dispose() {
      (value21?.(), (value21 = null), (enabled3 = false));
    },
  });
}
