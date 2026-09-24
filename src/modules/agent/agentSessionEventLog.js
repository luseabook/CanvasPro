import { normalizeAgentRunEvent } from './agentRunEventLog.js';
import {
  normalizeAgentReplyVersions,
  normalizeAgentReplyVersionChange,
  createAgentReplyVersionChange,
  applyAgentReplyVersionChange,
} from './agentReplyVersions.js';
import { normalizeAgentAssistantContext } from './agentAssistantConversation.js';
import { AGENT_MESSAGE_CONTENT_LIMIT, compactAgentConversationText } from './agentConversationText.js';
import { normalizeAgentOperation, normalizeAgentTaskBinding } from './agentDurableRunState.js';
const SESSION_EVENT_TYPES = new Set([
    'turn.started',
    'turn.updated',
    'turn.completed',
    'item.started',
    'item.updated',
    'item.completed',
    'audit.recorded',
  ]),
  SESSION_ITEM_TYPES = new Set(['message', 'tool', 'approval', 'task', 'audit']),
  TERMINAL_TURN_STATUSES = new Set([
    'cancelled',
    'chat',
    'completed',
    'failed',
    'need_clarification',
    'stopped',
    'success',
  ]),
  TERMINAL_ITEM_STATUSES = new Set([
    'cancelled',
    'completed',
    'complete',
    'done',
    'error',
    'fail',
    'failed',
    'stopped',
    'success',
    'succeeded',
    'undone',
  ]),
  MAX_MESSAGE_CONTENT_CHARS = AGENT_MESSAGE_CONTENT_LIMIT,
  MAX_PROJECTED_RUN_EVENTS = 0x78,
  MAX_PROJECTED_OPERATIONS = 0x78,
  MAX_PROJECTED_TASK_BINDINGS = 0x18;
function normalizeTimestamp(_0x101b33, _0x5f410f = Date['now']()) {
  const _0x38f61b = Number(_0x101b33);
  return Number['isFinite'](_0x38f61b) && _0x38f61b > 0x0 ? _0x38f61b : _0x5f410f;
}
function normalizeSequence(_0x5e6eec, _0x2d3653 = 0x1) {
  const _0x4e9f25 = Math['trunc'](Number(_0x5e6eec));
  return Number['isFinite'](_0x4e9f25) && _0x4e9f25 > 0x0 ? _0x4e9f25 : _0x2d3653;
}
function cloneJson(_0x43f5d7, _0x597ed1 = null) {
  try {
    return JSON['parse'](JSON['stringify'](_0x43f5d7));
  } catch {
    return _0x597ed1;
  }
}
function normalizeMessageSnapshot(_0x1838df = {}, _0x189530 = Date['now']()) {
  if (!_0x1838df || typeof _0x1838df !== 'object' || Array['isArray'](_0x1838df)) return null;
  const _0x4ba5d0 = compactAgentConversationText(
      _0x1838df['content'] || _0x1838df['reply'] || _0x1838df['message'] || _0x1838df['question'] || '',
      MAX_MESSAGE_CONTENT_CHARS,
    ),
    _0x36d854 = String(_0x1838df['status'] || '')
      ['trim']()
      ['slice'](0x0, 0x78);
  if (!_0x4ba5d0 && !_0x36d854) return null;
  const _0x11bed2 = {
      role:
        String(_0x1838df['role'] || 'assistant')
          ['trim']()
          ['slice'](0x0, 0x20) || 'assistant',
      content: _0x4ba5d0,
      status: _0x36d854,
      ts: normalizeTimestamp(_0x1838df['ts'], _0x189530),
    },
    _0x2ce876 = String(_0x1838df['messageType'] || _0x1838df['type'] || 'text')['trim']();
  if (_0x2ce876 && _0x2ce876 !== 'text') _0x11bed2['messageType'] = _0x2ce876['slice'](0x0, 0x28);
  _0x11bed2['role'] === 'user' &&
    Array['isArray'](_0x1838df['inputRefs']) &&
    (_0x11bed2['inputRefs'] = cloneJson(_0x1838df['inputRefs']['slice'](0x0, 0xc), []));
  _0x11bed2['role'] === 'assistant' &&
    _0x1838df['diagnostic'] &&
    (_0x11bed2['diagnostic'] = cloneJson(_0x1838df['diagnostic'], null));
  if (_0x11bed2['role'] === 'assistant') {
    const _0x7d6246 = normalizeAgentAssistantContext(_0x1838df['assistantContext']);
    if (_0x7d6246) _0x11bed2['assistantContext'] = _0x7d6246;
    const _0x49dc5b = normalizeAgentReplyVersions(_0x1838df['replyVersions']);
    if (_0x49dc5b) _0x11bed2['replyVersions'] = _0x49dc5b;
  }
  return (
    _0x11bed2['messageType'] && _0x1838df['task'] && (_0x11bed2['task'] = cloneJson(_0x1838df['task'], null)),
    _0x11bed2
  );
}
function normalizePayload(_0xe4638c = {}, _0x4d5f30 = Date['now']()) {
  const _0x6880f =
    _0xe4638c['payload'] && typeof _0xe4638c['payload'] === 'object' ? _0xe4638c['payload'] : {};
  if (_0xe4638c['itemType'] === 'message') {
    const _0x2904ec = normalizeMessageSnapshot(_0x6880f['message'], _0x4d5f30),
      _0x245bc7 = normalizeAgentReplyVersionChange(_0x6880f['replyVersionChange']);
    return _0x2904ec ? { message: _0x2904ec, ...(_0x245bc7 ? { replyVersionChange: _0x245bc7 } : {}) } : null;
  }
  if (_0xe4638c['itemType'] === 'tool') {
    const _0x10accc = normalizeAgentOperation(_0x6880f['operation'], _0x4d5f30);
    return _0x10accc ? { operation: _0x10accc } : null;
  }
  if (_0xe4638c['itemType'] === 'task') {
    const _0xbe1789 = normalizeAgentTaskBinding(_0x6880f['taskBinding']);
    return _0xbe1789 ? { taskBinding: _0xbe1789 } : null;
  }
  const _0x6cb37e = normalizeAgentRunEvent(_0x6880f['runEvent'], _0x4d5f30);
  return _0x6cb37e ? { runEvent: _0x6cb37e } : null;
}
export function normalizeAgentSessionEvent(
  _0x1715d8 = {},
  { fallbackTs: fallbackTs = Date['now'](), fallbackSeq: fallbackSeq = 0x1 } = {},
) {
  if (!_0x1715d8 || typeof _0x1715d8 !== 'object' || Array['isArray'](_0x1715d8)) return null;
  const _0x527093 = String(_0x1715d8['id'] || '')['trim'](),
    _0xcb05df = String(_0x1715d8['conversationId'] || '')['trim'](),
    _0x18a904 = String(_0x1715d8['type'] || '')['trim'](),
    _0x24f3f8 = String(_0x1715d8['itemType'] || 'audit')['trim']();
  if (
    !_0x527093 ||
    !_0xcb05df ||
    !SESSION_EVENT_TYPES['has'](_0x18a904) ||
    !SESSION_ITEM_TYPES['has'](_0x24f3f8)
  )
    return null;
  const _0x4fc40e = normalizeTimestamp(_0x1715d8['ts'], fallbackTs),
    _0x3d60c8 = normalizePayload({ ..._0x1715d8, itemType: _0x24f3f8 }, _0x4fc40e);
  if (!_0x3d60c8) return null;
  return {
    id: _0x527093,
    seq: normalizeSequence(_0x1715d8['seq'], fallbackSeq),
    conversationId: _0xcb05df,
    projectId: String(_0x1715d8['projectId'] || '')['trim'](),
    turnId: String(_0x1715d8['turnId'] || '')['trim'](),
    itemId: String(_0x1715d8['itemId'] || '')['trim'](),
    type: _0x18a904,
    itemType: _0x24f3f8,
    status: String(_0x1715d8['status'] || '')
      ['trim']()
      ['slice'](0x0, 0x50),
    ts: _0x4fc40e,
    payload: _0x3d60c8,
  };
}
export function createAgentMessageSessionEvent({
  id: id = '',
  seq: seq = 0x0,
  conversationId: conversationId = '',
  projectId: projectId = '',
  turnId: turnId = '',
  itemId: itemId = '',
  message: message = {},
  previousMessage: previousMessage = null,
} = {}) {
  const _0x1da5c2 = createAgentReplyVersionChange(message, previousMessage),
    _0x32943f = { ...message };
  if (_0x1da5c2) delete _0x32943f['replyVersions'];
  return normalizeAgentSessionEvent({
    id: id,
    seq: seq,
    conversationId: conversationId,
    projectId: projectId,
    turnId: turnId,
    itemId: itemId,
    type: 'item.completed',
    itemType: 'message',
    status: String(message['status'] || 'completed')['trim']() || 'completed',
    ts: message['ts'],
    payload: { message: _0x32943f, ...(_0x1da5c2 ? { replyVersionChange: _0x1da5c2 } : {}) },
  });
}
function getRunSessionEventShape(_0x564f3f = {}) {
  const _0x3c3f50 = String(_0x564f3f['type'] || '')['trim'](),
    _0x59ed71 = String(_0x564f3f['status'] || '')['trim']();
  if (_0x3c3f50 === 'run.status')
    return {
      type:
        _0x59ed71 === 'planning'
          ? 'turn.started'
          : TERMINAL_TURN_STATUSES['has'](_0x59ed71)
            ? 'turn.completed'
            : 'turn.updated',
      itemType: 'audit',
      itemId: '',
    };
  if (_0x3c3f50 === 'approval.requested') return { type: 'item.started', itemType: 'approval' };
  if (_0x3c3f50 === 'approval.confirmed' || _0x3c3f50 === 'approval.cancelled')
    return { type: 'item.completed', itemType: 'approval' };
  return { type: 'audit.recorded', itemType: 'audit', itemId: '' };
}
export function createAgentRunSessionEvent({
  id: id = '',
  seq: seq = 0x0,
  conversationId: conversationId = '',
  projectId: projectId = '',
  itemId: itemId = '',
  runEvent: runEvent = {},
} = {}) {
  const _0x254813 = getRunSessionEventShape(runEvent),
    _0x4210cd = String(runEvent['commandId'] || '')['trim'](),
    _0x51959c = Math['max'](0x0, Math['trunc'](Number(runEvent['step'] || 0x0))),
    _0x2ba855 =
      _0x254813['itemType'] === 'approval'
        ? String(runEvent['runId'] || '')['trim']() + ':approval:' + _0x51959c + ':' + (_0x4210cd || 'plan')
        : '';
  return normalizeAgentSessionEvent({
    id: id,
    seq: seq,
    conversationId: conversationId,
    projectId: projectId,
    turnId: runEvent['runId'],
    itemId: itemId || _0x2ba855 || _0x254813['itemId'],
    type: _0x254813['type'],
    itemType: _0x254813['itemType'],
    status: runEvent['status'],
    ts: runEvent['ts'],
    payload: { runEvent: runEvent },
  });
}
function getItemLifecycleType(_0x2950d7 = '') {
  const _0x512563 = String(_0x2950d7 || '')['trim']();
  if (TERMINAL_ITEM_STATUSES['has'](_0x512563)) return 'item.completed';
  if (['pending', 'queued', 'running', 'submitted']['includes'](_0x512563)) return 'item.started';
  return 'item.updated';
}
export function createAgentOperationSessionEvent({
  id: id = '',
  seq: seq = 0x0,
  conversationId: conversationId = '',
  projectId: projectId = '',
  operation: operation = {},
} = {}) {
  return normalizeAgentSessionEvent({
    id: id,
    seq: seq,
    conversationId: conversationId,
    projectId: projectId,
    turnId: operation['runId'],
    itemId: operation['id'] || operation['operationId'],
    type: getItemLifecycleType(operation['status']),
    itemType: 'tool',
    status: operation['status'],
    ts: operation['completedAt'] || operation['startedAt'],
    payload: { operation: operation },
  });
}
export function createAgentTaskSessionEvent({
  id: id = '',
  seq: seq = 0x0,
  conversationId: conversationId = '',
  projectId: projectId = '',
  taskBinding: taskBinding = {},
} = {}) {
  return normalizeAgentSessionEvent({
    id: id,
    seq: seq,
    conversationId: conversationId,
    projectId: projectId,
    turnId: taskBinding['turnId'],
    itemId: taskBinding['id'],
    type: getItemLifecycleType(taskBinding['status']),
    itemType: 'task',
    status: taskBinding['status'],
    ts: taskBinding['updatedAt'] || taskBinding['createdAt'],
    payload: { taskBinding: taskBinding },
  });
}
function sortSessionEvents(_0x34a5bf = []) {
  return [..._0x34a5bf]['sort']((_0x450179, _0x32fa0b) => {
    const _0x44f345 = Number(_0x450179['seq'] || 0x0) - Number(_0x32fa0b['seq'] || 0x0);
    if (_0x44f345 !== 0x0) return _0x44f345;
    const _0x2f5889 = Number(_0x450179['ts'] || 0x0) - Number(_0x32fa0b['ts'] || 0x0);
    if (_0x2f5889 !== 0x0) return _0x2f5889;
    return String(_0x450179['id'] || '')['localeCompare'](String(_0x32fa0b['id'] || ''));
  });
}
export function projectAgentSessionEvents(_0x30bd12 = []) {
  const _0x5a0fbd = sortSessionEvents(
      (Array['isArray'](_0x30bd12) ? _0x30bd12 : [])
        ['map']((_0x42a7d8, _0x556ab9) =>
          normalizeAgentSessionEvent(_0x42a7d8, { fallbackSeq: _0x556ab9 + 0x1 }),
        )
        ['filter'](Boolean),
    ),
    _0x167dc6 = new Map(),
    _0x1f2779 = [],
    _0x3daa5b = new Map(),
    _0x134874 = new Map(),
    _0x124438 = new Map(),
    _0x58b211 = new Map();
  for (const _0x350550 of _0x5a0fbd) {
    const _0x56d579 = _0x350550['turnId'];
    if (_0x56d579) {
      const _0x12ba59 = _0x124438['get'](_0x56d579) || {
        id: _0x56d579,
        status: '',
        startedAt: _0x350550['ts'],
        updatedAt: _0x350550['ts'],
        completedAt: 0x0,
        itemIds: [],
      };
      _0x12ba59['updatedAt'] = _0x350550['ts'];
      if (_0x350550['status']) _0x12ba59['status'] = _0x350550['status'];
      if (_0x350550['type'] === 'turn.started') _0x12ba59['startedAt'] = _0x350550['ts'];
      if (_0x350550['type'] === 'turn.completed') _0x12ba59['completedAt'] = _0x350550['ts'];
      (_0x350550['itemId'] &&
        !_0x12ba59['itemIds']['includes'](_0x350550['itemId']) &&
        _0x12ba59['itemIds']['push'](_0x350550['itemId']),
        _0x124438['set'](_0x56d579, _0x12ba59));
    }
    if (_0x350550['itemId']) {
      const _0x10ce46 = _0x58b211['get'](_0x350550['itemId']) || {
        id: _0x350550['itemId'],
        turnId: _0x56d579,
        type: _0x350550['itemType'],
        status: '',
        startedAt: _0x350550['ts'],
        updatedAt: _0x350550['ts'],
        completedAt: 0x0,
      };
      ((_0x10ce46['turnId'] = _0x56d579 || _0x10ce46['turnId']),
        (_0x10ce46['type'] = _0x350550['itemType']),
        (_0x10ce46['status'] = _0x350550['status'] || _0x10ce46['status']),
        (_0x10ce46['updatedAt'] = _0x350550['ts']));
      if (_0x350550['type'] === 'item.completed') _0x10ce46['completedAt'] = _0x350550['ts'];
      _0x58b211['set'](_0x350550['itemId'], _0x10ce46);
    }
    if (_0x350550['payload']['message']) {
      const _0xa357f1 = _0x350550['itemId'] || _0x350550['id'],
        _0xd34e4a = cloneJson(_0x350550['payload']['message'], {});
      (_0x350550['payload']['replyVersionChange'] &&
        (_0xd34e4a['replyVersions'] = applyAgentReplyVersionChange(
          _0x167dc6['get'](_0xa357f1),
          _0x350550['payload']['replyVersionChange'],
        )),
        _0x167dc6['set'](_0xa357f1, _0xd34e4a));
    }
    if (_0x350550['payload']['runEvent']) _0x1f2779['push'](cloneJson(_0x350550['payload']['runEvent'], {}));
    (_0x350550['payload']['operation'] &&
      _0x3daa5b['set'](
        _0x350550['payload']['operation']['id'],
        cloneJson(_0x350550['payload']['operation'], {}),
      ),
      _0x350550['payload']['taskBinding'] &&
        _0x134874['set'](
          _0x350550['payload']['taskBinding']['id'],
          cloneJson(_0x350550['payload']['taskBinding'], {}),
        ));
  }
  return {
    events: _0x5a0fbd['map']((_0xc0b745) => cloneJson(_0xc0b745, {})),
    messages: [..._0x167dc6['values']()],
    runEvents: _0x1f2779['slice'](-MAX_PROJECTED_RUN_EVENTS),
    operationLedger: [..._0x3daa5b['values']()]['slice'](-MAX_PROJECTED_OPERATIONS),
    taskBindings: [..._0x134874['values']()]['slice'](-MAX_PROJECTED_TASK_BINDINGS),
    turns: [..._0x124438['values']()]['map']((_0x2154e1) => cloneJson(_0x2154e1, {})),
    items: [..._0x58b211['values']()]['map']((_0x16a68d) => cloneJson(_0x16a68d, {})),
  };
}
function valuesMatch(_0x3eb213, _0x1bdda1) {
  return JSON['stringify'](_0x3eb213) === JSON['stringify'](_0x1bdda1);
}
export function compareAgentSessionProjection({
  projection: projection = {},
  messages: messages = [],
  runEvents: runEvents = [],
  operationLedger: operationLedger = [],
  taskBindings: taskBindings = [],
} = {}) {
  const _0x250902 = (Array['isArray'](messages) ? messages : [])
      ['map']((_0x5c1482) => normalizeMessageSnapshot(_0x5c1482, _0x5c1482?.['ts']))
      ['filter'](Boolean),
    _0x22855c = (Array['isArray'](runEvents) ? runEvents : [])
      ['map']((_0x2262aa) => normalizeAgentRunEvent(_0x2262aa, _0x2262aa?.['ts']))
      ['filter'](Boolean),
    _0x2a7e15 = (Array['isArray'](operationLedger) ? operationLedger : [])
      ['map']((_0x27af88) => normalizeAgentOperation(_0x27af88, _0x27af88?.['startedAt']))
      ['filter'](Boolean),
    _0x5718b0 = (Array['isArray'](taskBindings) ? taskBindings : [])
      ['map']((_0x18f909) => normalizeAgentTaskBinding(_0x18f909))
      ['filter'](Boolean),
    _0x528df9 = {
      messages: valuesMatch(projection['messages'] || [], _0x250902),
      runEvents: valuesMatch(projection['runEvents'] || [], _0x22855c),
      operationLedger: valuesMatch(projection['operationLedger'] || [], _0x2a7e15),
      taskBindings: valuesMatch(projection['taskBindings'] || [], _0x5718b0),
    };
  return {
    ..._0x528df9,
    ok: Object['values'](_0x528df9)['every'](Boolean),
    mismatches: Object['entries'](_0x528df9)
      ['filter'](([, _0x13155f]) => !_0x13155f)
      ['map'](([_0x53abab]) => _0x53abab),
  };
}
export function createAgentSessionEventsFromLegacyState({
  conversationId: conversationId = '',
  projectId: projectId = '',
  messages: messages = [],
  runEvents: runEvents = [],
  operationLedger: operationLedger = [],
  taskBindings: taskBindings = [],
} = {}) {
  const _0x17ef56 = [];
  let _0x20ced6 = 0x0;
  const _0x396ff5 = (_0x2bfce8, _0x51d5d2, _0x288db7, _0x4f362c) => {
    const _0x42371b = ++_0x20ced6,
      _0x31bc30 = _0x2bfce8({
        id: conversationId + ':migrated:' + _0x288db7 + ':' + (_0x4f362c + 0x1),
        seq: _0x42371b,
        conversationId: conversationId,
        projectId: projectId,
        ...(_0x288db7 === 'message' ? { itemId: conversationId + ':message:' + (_0x4f362c + 0x1) } : {}),
        ...(_0x288db7 === 'message' ? { message: _0x51d5d2 } : {}),
        ...(_0x288db7 === 'run' ? { runEvent: _0x51d5d2 } : {}),
        ...(_0x288db7 === 'operation' ? { operation: _0x51d5d2 } : {}),
        ...(_0x288db7 === 'task' ? { taskBinding: _0x51d5d2 } : {}),
      });
    if (_0x31bc30) _0x17ef56['push'](_0x31bc30);
  };
  return (
    messages['forEach']((_0x4b9463, _0x2c9e08) =>
      _0x396ff5(createAgentMessageSessionEvent, _0x4b9463, 'message', _0x2c9e08),
    ),
    runEvents['forEach']((_0x4582f5, _0x5ea4e0) =>
      _0x396ff5(createAgentRunSessionEvent, _0x4582f5, 'run', _0x5ea4e0),
    ),
    operationLedger['forEach']((_0x5e73ec, _0x103f83) =>
      _0x396ff5(createAgentOperationSessionEvent, _0x5e73ec, 'operation', _0x103f83),
    ),
    taskBindings['forEach']((_0x15f15a, _0x2f9619) =>
      _0x396ff5(createAgentTaskSessionEvent, _0x15f15a, 'task', _0x2f9619),
    ),
    _0x17ef56
  );
}
