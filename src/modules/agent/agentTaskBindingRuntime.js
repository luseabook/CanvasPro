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
  MAX_TASK_MEDIA_ITEMS = 0xc;
function getNode(_0x578947 = {}, _0x3b451a = '') {
  const _0x39572d = String(_0x3b451a || '')['trim']();
  return _0x39572d ? _0x578947['nodes']?.[_0x39572d] || null : null;
}
function normalizeTaskStatus(_0x1a5cc0 = '') {
  const _0x39b1c7 = String(_0x1a5cc0 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x39b1c7 === 'queued' || _0x39b1c7 === 'submitted') return 'pending';
  if (_0x39b1c7 === 'generating' || _0x39b1c7 === 'processing') return 'running';
  return _0x39b1c7;
}
function isTerminalTaskStatus(_0x5ad3d5 = '') {
  return TASK_TERMINAL_STATUSES['has'](normalizeTaskStatus(_0x5ad3d5));
}
function getNodeTaskStatus(_0x48c38f = {}) {
  return normalizeTaskStatus(
    _0x48c38f['jobStatus'] ||
      _0x48c38f['rhTaskStatus'] ||
      _0x48c38f['asyncTaskStatus'] ||
      _0x48c38f['textJobStatus'] ||
      _0x48c38f['videoJobStatus'] ||
      _0x48c38f['storyboardScript']?.['jobStatus'] ||
      (_0x48c38f['isGenerating'] ? 'running' : ''),
  );
}
function getNodeTaskId(_0x2ff279 = {}) {
  return String(_0x2ff279['taskId'] || _0x2ff279['rhTaskId'] || _0x2ff279['asyncTaskId'] || '')['trim']();
}
function getNodeLabel(_0x1f2a37 = {}, _0x5b0243 = '') {
  const _0x18829d = String(_0x1f2a37['type'] || ''),
    _0x5afaa3 = _0x18829d['includes']('video')
      ? '视频'
      : _0x18829d['includes']('audio')
        ? '音频'
        : _0x18829d['includes']('text')
          ? '文本'
          : '图片',
    _0x5c5e03 = String(_0x1f2a37['name'] || _0x1f2a37['title'] || '')['trim']();
  return _0x5c5e03
    ? _0x5c5e03 + '（' + _0x5afaa3 + '节点）'
    : (_0x5b0243 || '目标') + '（' + _0x5afaa3 + '节点）';
}
function getResultKindFromNode(_0x53a21d = {}) {
  const _0x5acfed = String(_0x53a21d['type'] || '')['toLowerCase']();
  if (_0x5acfed['includes']('video')) return 'video';
  if (_0x5acfed['includes']('audio')) return 'audio';
  if (_0x5acfed['includes']('text')) return 'text';
  if (_0x5acfed['includes']('image')) return 'image';
  return '';
}
function normalizeTaskMediaUrl(_0x3fdaa5 = '') {
  const _0x2b34d6 = String(_0x3fdaa5 || '')['trim']();
  if (!_0x2b34d6 || /^data:/i['test'](_0x2b34d6)) return '';
  return _0x2b34d6;
}
function normalizeImageTaskMediaItem(_0x5e542a = {}, _0x395825 = '') {
  if (!_0x5e542a || typeof _0x5e542a !== 'object') return null;
  if (_0x5e542a['error'] || _0x5e542a['status'] === 'failed') return null;
  const _0x35afdc = normalizeTaskMediaUrl(
      _0x5e542a['imageUrl'] ||
        _0x5e542a['url'] ||
        _0x5e542a['sourceUrl'] ||
        _0x5e542a['localPath'] ||
        _0x5e542a['displayLocalPath'],
    ),
    _0x11eb3f = normalizeTaskMediaUrl(
      _0x5e542a['thumbUrl'] ||
        _0x5e542a['thumbnailUrl'] ||
        _0x5e542a['previewUrl'] ||
        _0x5e542a['imageUrl'] ||
        _0x5e542a['url'] ||
        _0x35afdc,
    );
  if (!_0x35afdc && !_0x11eb3f) return null;
  return {
    url: _0x35afdc || _0x11eb3f,
    thumbUrl: _0x11eb3f || _0x35afdc,
    name: String(_0x5e542a['name'] || _0x5e542a['title'] || _0x395825 || '')['trim'](),
  };
}
function buildImageTaskMedia(_0x166520 = {}, _0x501cdd = '') {
  const _0x5a146a = getNodeLabel(_0x166520, _0x501cdd),
    _0x3ca07e = Array['isArray'](_0x166520['images'])
      ? _0x166520['images']
          ['map']((_0x5c2f87) => normalizeImageTaskMediaItem(_0x5c2f87, _0x5a146a))
          ['filter'](Boolean)
          ['slice'](0x0, MAX_TASK_MEDIA_ITEMS)
      : [],
    _0x4c2c5c = normalizeImageTaskMediaItem(
      {
        imageUrl:
          _0x166520['imageUrl'] ||
          _0x166520['url'] ||
          _0x166520['sourceUrl'] ||
          _0x166520['localPath'] ||
          _0x166520['displayLocalPath'],
        thumbUrl: _0x166520['thumbUrl'] || _0x166520['thumbnailUrl'] || _0x166520['previewUrl'],
        name: _0x5a146a,
      },
      _0x5a146a,
    ),
    _0x44f381 = _0x3ca07e['length'] > 0x0 ? _0x3ca07e : _0x4c2c5c ? [_0x4c2c5c] : [];
  if (_0x44f381['length'] === 0x0) return null;
  const _0xa73ca5 = _0x44f381[0x0];
  return {
    kind: 'image',
    url: _0xa73ca5['url'],
    thumbUrl: _0xa73ca5['thumbUrl'],
    name: _0x5a146a,
    items: _0x44f381,
  };
}
function getTaskErrorText(_0x541b40 = {}, _0x5b4046 = '') {
  return String(
    _0x541b40['jobError'] ||
      _0x541b40['rhStatusMessage'] ||
      _0x541b40['asyncTaskError'] ||
      _0x541b40['textError'] ||
      _0x541b40['videoError'] ||
      _0x541b40['storyboardScript']?.['jobError'] ||
      _0x5b4046 ||
      '',
  )['trim']();
}
function getGenerationResponses(_0x289474 = {}) {
  const _0x104a65 = Array['isArray'](_0x289474['results'])
    ? _0x289474['results']
    : Array['isArray'](_0x289474['raw']?.['result']?.['actions'])
      ? _0x289474['raw']['result']['actions']
      : [];
  return _0x104a65['flatMap']((_0x3e3bad) => {
    const _0x3fb7e3 = String(_0x3e3bad?.['commandId'] || '');
    if (_0x3fb7e3 === 'generation.run') return [_0x3e3bad];
    if (_0x3fb7e3 !== 'generation.runBatch') return [];
    return (Array['isArray'](_0x3e3bad?.['result']?.['results']) ? _0x3e3bad['result']['results'] : [])[
      'map'
    ]((_0x59eade) => ({
      commandId: _0x3fb7e3,
      ok: !TASK_FAILURE_STATUSES['has'](normalizeTaskStatus(_0x59eade?.['status'])),
      result: _0x59eade,
    }));
  });
}
function normalizeGenerationResponseStatus(_0x31771e = {}) {
  const _0x55438e = _0x31771e['result'] || {},
    _0x5a9597 = _0x55438e['value'] || {},
    _0x3c1c08 = normalizeTaskStatus(
      _0x55438e['status'] ||
        _0x5a9597['status'] ||
        _0x5a9597['jobStatus'] ||
        _0x5a9597['result']?.['status'] ||
        (_0x31771e['ok'] === ![] ? 'failed' : ''),
    );
  if (_0x3c1c08) return _0x3c1c08;
  if (_0x31771e['ok'] === !![] && (_0x55438e['taskId'] || _0x5a9597['taskId'])) return 'running';
  return '';
}
function getGenerationResponseNodeId(_0x28be3b = {}) {
  const _0x3601d2 = _0x28be3b['result'] || {};
  return String(
    _0x3601d2['nodeId'] ||
      _0x3601d2['targetNodeId'] ||
      _0x3601d2['value']?.['nodeId'] ||
      _0x3601d2['value']?.['targetNodeId'] ||
      '',
  )['trim']();
}
function getGenerationResponseTaskId(_0x12b4ed = {}) {
  const _0x318d1d = _0x12b4ed['result'] || {},
    _0x247da5 = _0x318d1d['value'] || {};
  return String(
    _0x318d1d['taskId'] ||
      _0x318d1d['rhTaskId'] ||
      _0x247da5['taskId'] ||
      _0x247da5['rhTaskId'] ||
      _0x247da5['result']?.['taskId'] ||
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
    ['map']((_0x456f27) => String(_0x456f27 || '')['replace'](/[^A-Za-z0-9_-]+/g, '_'))
    ['join'](':');
}
function getTaskMessageStatus(_0x1df117 = '') {
  const _0x1c081f = normalizeTaskStatus(_0x1df117);
  if (TASK_SUCCESS_STATUSES['has'](_0x1c081f)) return 'success';
  if (TASK_FAILURE_STATUSES['has'](_0x1c081f)) return 'failed';
  if (TASK_CANCELLED_STATUSES['has'](_0x1c081f)) return 'cancelled';
  if (_0x1c081f === 'pending') return 'pending';
  return _0x1c081f || 'running';
}
export function createAgentTaskBindingRuntime({
  store: _0x2585c6,
  sessionStore: _0x52d0b1,
  readCanvasState: _0x3340f4,
  getActiveConversationId: _0x58f29e,
  getCurrentTurnId: _0x502beb,
  formatText: _0x4602d7,
  onBindingsChanged: onBindingsChanged = null,
} = {}) {
  if (!_0x52d0b1 || typeof _0x3340f4 !== 'function')
    throw new TypeError(
      '[agentTaskBindingRuntime]\x20sessionStore\x20and\x20readCanvasState\x20are\x20required',
    );
  function _0x25f562(_0x17ff36, _0x234a80 = {}) {
    return typeof _0x4602d7 === 'function' ? _0x4602d7(_0x17ff36, _0x234a80) : _0x17ff36;
  }
  function _0xce4a71({ node: node = {}, nodeId: nodeId = '', status: status = '', error: error = '' } = {}) {
    const _0xcd460 = normalizeTaskStatus(status),
      _0x2dfc0e = getNodeLabel(node, nodeId);
    if (TASK_SUCCESS_STATUSES['has'](_0xcd460)) return _0x25f562('taskCompleted', { nodeLabel: _0x2dfc0e });
    if (TASK_FAILURE_STATUSES['has'](_0xcd460))
      return _0x25f562('taskFailed', {
        nodeLabel: _0x2dfc0e,
        error: error || _0x25f562('actionExecutionFailed'),
      });
    if (TASK_CANCELLED_STATUSES['has'](_0xcd460)) return _0x25f562('taskCancelled', { nodeLabel: _0x2dfc0e });
    if (_0xcd460 === 'pending') return _0x25f562('taskPending', { nodeLabel: _0x2dfc0e });
    return _0x25f562('taskStarted', { nodeLabel: _0x2dfc0e });
  }
  function _0x243e72({
    binding: binding = {},
    node: node = {},
    status: status = '',
    error: error = '',
  } = {}) {
    const _0x57878d = String(binding['nodeId'] || binding['targetNodeId'] || node['id'] || '')['trim'](),
      _0x5953c4 = getTaskMessageStatus(status),
      _0x589667 = getResultKindFromNode(node),
      _0x56a919 =
        _0x5953c4 === 'success' && _0x589667 === 'image' ? buildImageTaskMedia(node, _0x57878d) : null,
      _0x110cb0 = {
        nodeId: _0x57878d,
        taskId: String(binding['taskId'] || '')['trim'](),
        commandId: String(binding['commandId'] || 'generation.run')['trim'](),
        status: _0x5953c4,
        resultKind: _0x589667,
      };
    if (_0x56a919) _0x110cb0['media'] = _0x56a919;
    return {
      role: 'assistant',
      status: _0x5953c4,
      messageType: isTerminalTaskStatus(_0x5953c4) ? 'task_result' : 'task_status',
      content: _0xce4a71({ node: node, nodeId: _0x57878d, status: _0x5953c4, error: error }),
      task: _0x110cb0,
    };
  }
  function _0xb5c11a(_0x127327 = {}, { turnId: turnId = '' } = {}) {
    const _0x20f6ff = getGenerationResponseNodeId(_0x127327);
    if (!_0x20f6ff) return null;
    const _0x3801a6 = _0x3340f4(),
      _0x207121 = getNode(_0x3801a6, _0x20f6ff) || {},
      _0x1d72bf = getGenerationResponseTaskId(_0x127327) || getNodeTaskId(_0x207121),
      _0x3c24d2 = normalizeGenerationResponseStatus(_0x127327) || getNodeTaskStatus(_0x207121);
    if (!_0x3c24d2 && !_0x1d72bf) return null;
    const _0x4a6018 = String(_0x58f29e?.() || '')['trim'](),
      _0x110221 = String(_0x502beb?.(turnId) || turnId || '')['trim']();
    return {
      id: buildTaskBindingId({
        conversationId: _0x4a6018,
        turnId: _0x110221,
        nodeId: _0x20f6ff,
        taskId: _0x1d72bf,
      }),
      conversationId: _0x4a6018,
      turnId: _0x110221,
      nodeId: _0x20f6ff,
      targetNodeId: _0x20f6ff,
      taskId: _0x1d72bf,
      commandId: String(_0x127327['commandId'] || 'generation.run'),
      status: _0x3c24d2 || 'running',
      notifiedTerminal: ![],
    };
  }
  function _0x22197b(_0x2194bc = {}, { node: node = {}, status: status = '', error: error = '' } = {}) {
    const _0x1b00c9 = _0x243e72({
      binding: _0x2194bc,
      node: node,
      status: status || _0x2194bc['status'],
      error: error,
    });
    return (_0x52d0b1['pushHistory']?.(_0x1b00c9), _0x1b00c9);
  }
  function _0x485f61(_0xedfbf9 = {}, _0x53fb94 = {}) {
    if (!_0xedfbf9?.['id'] || typeof _0x52d0b1['updateTaskBinding'] !== 'function') return null;
    return _0x52d0b1['updateTaskBinding'](_0xedfbf9['id'], _0x53fb94);
  }
  function _0x2224dd(_0xe435dd = _0x3340f4()) {
    const _0x339ce4 = _0x52d0b1['getTaskBindings']?.() || [];
    for (const _0x437dd0 of _0x339ce4) {
      if (!_0x437dd0?.['nodeId'] || _0x437dd0['notifiedTerminal'] === !![]) continue;
      const _0x4aae70 = getNode(_0xe435dd, _0x437dd0['nodeId']) || {},
        _0x4a4b5c = getNodeTaskStatus(_0x4aae70);
      if (!_0x4a4b5c) continue;
      const _0x463c7a = getTaskMessageStatus(_0x4a4b5c),
        _0xbad9ae = {
          status: _0x4a4b5c,
          messageStatus: _0x463c7a,
          taskId: _0x437dd0['taskId'] || getNodeTaskId(_0x4aae70),
        };
      if (isTerminalTaskStatus(_0x4a4b5c))
        (_0x22197b(
          { ..._0x437dd0, ..._0xbad9ae, notifiedTerminal: !![] },
          { node: _0x4aae70, status: _0x4a4b5c, error: getTaskErrorText(_0x4aae70) },
        ),
          _0x485f61(_0x437dd0, { ..._0xbad9ae, notifiedTerminal: !![] }));
      else
        (_0x463c7a !== _0x437dd0['messageStatus'] || _0x4a4b5c !== _0x437dd0['status']) &&
          _0x485f61(_0x437dd0, _0xbad9ae);
    }
    onBindingsChanged?.();
  }
  function _0x4757db(_0x4705eb = {}, { turnId: turnId = '' } = {}) {
    const _0x42bb80 = getGenerationResponses(_0x4705eb),
      _0x2a90b9 = _0x3340f4(),
      _0x234dee = _0x42bb80['map']((_0x2eb2b7) => {
        const _0x557499 = _0xb5c11a(_0x2eb2b7, { turnId: turnId });
        if (!_0x557499) return null;
        const _0x2afce5 = getNode(_0x2a90b9, _0x557499['nodeId']) || {},
          _0xa5e0f1 = normalizeTaskStatus(_0x557499['status'] || getNodeTaskStatus(_0x2afce5) || 'running');
        return {
          response: _0x2eb2b7,
          node: _0x2afce5,
          binding: {
            ..._0x557499,
            status: _0xa5e0f1,
            messageStatus: getTaskMessageStatus(_0xa5e0f1),
            notifiedTerminal: isTerminalTaskStatus(_0xa5e0f1),
          },
        };
      })['filter'](Boolean),
      _0x11f948 =
        typeof _0x52d0b1['upsertTaskBindings'] === 'function'
          ? _0x52d0b1['upsertTaskBindings'](_0x234dee['map']((_0x15a767) => _0x15a767['binding']))
          : _0x234dee['map'](
              (_0x407d4e) => _0x52d0b1['upsertTaskBinding']?.(_0x407d4e['binding']) || _0x407d4e['binding'],
            ),
      _0x5c510b = _0x234dee['map']((_0x4dde68, _0x343930) =>
        _0x22197b(_0x11f948[_0x343930] || _0x4dde68['binding'], {
          node: _0x4dde68['node'],
          status: _0x4dde68['binding']['status'],
          error: getTaskErrorText(
            _0x4dde68['node'],
            _0x4dde68['response']['message'] || _0x4dde68['response']['result']?.['message'] || '',
          ),
        }),
      );
    return (
      _0x42bb80['some']((_0x3bbfdd) =>
        isTerminalTaskStatus(
          getNodeTaskStatus(getNode(_0x2a90b9, getGenerationResponseNodeId(_0x3bbfdd)) || {}),
        ),
      ) && _0x2224dd(_0x2a90b9),
      _0x5c510b
    );
  }
  function _0x38136e(_0x2f10e0 = '') {
    const _0x34d358 = String(_0x2f10e0 || '')['trim'](),
      _0x5172b9 = _0x3340f4();
    return (_0x52d0b1['getTaskBindings']?.() || [])['filter']((_0x1fa8b3) => {
      if (_0x34d358 && _0x1fa8b3['turnId'] !== _0x34d358) return ![];
      if (isTerminalTaskStatus(_0x1fa8b3['status'])) return ![];
      const _0x2a2a1e = getNodeTaskStatus(getNode(_0x5172b9, _0x1fa8b3['nodeId']) || {});
      return Boolean(
        _0x1fa8b3['taskId'] || ['pending', 'running']['includes'](normalizeTaskStatus(_0x2a2a1e)),
      );
    });
  }
  function _0x57965a(_0xe30d44 = []) {
    const _0x8871be = new Set(_0xe30d44),
      _0x4394c4 = (_0x52d0b1['getTaskBindings']?.() || [])['filter']((_0x3cf159) =>
        _0x8871be['has'](_0x3cf159['id']),
      );
    if (
      _0x8871be['size'] === 0x0 ||
      _0x4394c4['length'] !== _0x8871be['size'] ||
      _0x4394c4['some']((_0x35c702) => !isTerminalTaskStatus(_0x35c702['status']))
    )
      return { settled: ![], allSucceeded: ![], bindings: _0x4394c4 };
    const _0x1e62b6 = _0x4394c4['every']((_0x29a82f) =>
        TASK_SUCCESS_STATUSES['has'](normalizeTaskStatus(_0x29a82f['status'])),
      ),
      _0x5ab5f5 = _0x1e62b6
        ? null
        : _0x4394c4['find'](
            (_0x5623d5) => !TASK_SUCCESS_STATUSES['has'](normalizeTaskStatus(_0x5623d5['status'])),
          ) || null,
      _0x533c8c = _0x3340f4();
    return {
      settled: !![],
      allSucceeded: _0x1e62b6,
      bindings: _0x4394c4,
      failedBinding: _0x5ab5f5,
      failureMessage: _0x5ab5f5
        ? _0xce4a71({
            node: getNode(_0x533c8c, _0x5ab5f5['nodeId']) || {},
            nodeId: _0x5ab5f5['nodeId'],
            status: _0x5ab5f5['status'] || 'failed',
          })
        : '',
    };
  }
  let _0x30c5dc = ![],
    _0x466ccb = null;
  function _0x4631a9() {
    if (_0x30c5dc) return;
    _0x30c5dc = !![];
    if (typeof _0x2585c6?.['subscribeSelector'] === 'function')
      _0x466ccb = _0x2585c6['subscribeSelector'](
        (_0x1e5dfb) => Number(_0x1e5dfb?.['_persistRev'] || 0x0),
        () => _0x2224dd(_0x3340f4()),
      );
    else {
      if (typeof _0x2585c6?.['subscribeRaw'] === 'function')
        _0x466ccb = _0x2585c6['subscribeRaw']((_0x58b9c7) => _0x2224dd(_0x58b9c7 || _0x3340f4()));
      else
        typeof _0x2585c6?.['subscribe'] === 'function' &&
          (_0x466ccb = _0x2585c6['subscribe']((_0x252dc9) => _0x2224dd(_0x252dc9 || _0x3340f4())));
    }
  }
  return Object['freeze']({
    getPending: _0x38136e,
    getSettlement: _0x57965a,
    registerExecution: _0x4757db,
    start: _0x4631a9,
    sync: _0x2224dd,
    dispose() {
      (_0x466ccb?.(), (_0x466ccb = null), (_0x30c5dc = ![]));
    },
  });
}
