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
  MAX_PROJECTED_RUN_EVENTS = 120,
  MAX_PROJECTED_OPERATIONS = 120,
  MAX_PROJECTED_TASK_BINDINGS = 24;
function normalizeTimestamp(value, item = Date['now']()) {
  const count = Number(value);
  return Number['isFinite'](count) && count > 0 ? count : item;
}
function normalizeSequence(key, index = 1) {
  const count2 = Math['trunc'](Number(key));
  return Number['isFinite'](count2) && count2 > 0 ? count2 : index;
}
function cloneJson(result, data = null) {
  try {
    return JSON['parse'](JSON['stringify'](result));
  } catch {
    return data;
  }
}
function normalizeMessageSnapshot(error = {}, options = Date['now']()) {
  if (!error || typeof error !== 'object' || Array['isArray'](error)) return null;
  const content = compactAgentConversationText(
      error['content'] || error['reply'] || error['message'] || error['question'] || '',
      MAX_MESSAGE_CONTENT_CHARS,
    ),
    status2 = String(error['status'] || '')
      ['trim']()
      ['slice'](0, 120);
  if (!content && !status2) return null;
  const target = {
      role:
        String(error['role'] || 'assistant')
          ['trim']()
          ['slice'](0, 32) || 'assistant',
      content: content,
      status: status2,
      ts: normalizeTimestamp(error['ts'], options),
    },
    list = String(error['messageType'] || error['type'] || 'text')['trim']();
  if (list && list !== 'text') target['messageType'] = list['slice'](0, 40);
  target['role'] === 'user' &&
    Array['isArray'](error['inputRefs']) &&
    (target['inputRefs'] = cloneJson(error['inputRefs']['slice'](0, 12), []));
  target['role'] === 'assistant' &&
    error['diagnostic'] &&
    (target['diagnostic'] = cloneJson(error['diagnostic'], null));
  if (target['role'] === 'assistant') {
    const agentAssistantContext = normalizeAgentAssistantContext(error['assistantContext']);
    if (agentAssistantContext) target['assistantContext'] = agentAssistantContext;
    const agentReplyVersions = normalizeAgentReplyVersions(error['replyVersions']);
    if (agentReplyVersions) target['replyVersions'] = agentReplyVersions;
  }
  return (
    target['messageType'] && error['task'] && (target['task'] = cloneJson(error['task'], null)),
    target
  );
}
function normalizePayload(options2 = {}, source = Date['now']()) {
  const error2 = options2['payload'] && typeof options2['payload'] === 'object' ? options2['payload'] : {};
  if (options2['itemType'] === 'message') {
    const message2 = normalizeMessageSnapshot(error2['message'], source),
      replyVersionChange = normalizeAgentReplyVersionChange(error2['replyVersionChange']);
    return message2
      ? { message: message2, ...(replyVersionChange ? { replyVersionChange: replyVersionChange } : {}) }
      : null;
  }
  if (options2['itemType'] === 'tool') {
    const operation2 = normalizeAgentOperation(error2['operation'], source);
    return operation2 ? { operation: operation2 } : null;
  }
  if (options2['itemType'] === 'task') {
    const taskBinding2 = normalizeAgentTaskBinding(error2['taskBinding']);
    return taskBinding2 ? { taskBinding: taskBinding2 } : null;
  }
  const runEvent2 = normalizeAgentRunEvent(error2['runEvent'], source);
  return runEvent2 ? { runEvent: runEvent2 } : null;
}
export function normalizeAgentSessionEvent(
  response = {},
  { fallbackTs: fallbackTs = Date['now'](), fallbackSeq: fallbackSeq = 1 } = {},
) {
  if (!response || typeof response !== 'object' || Array['isArray'](response)) return null;
  const id2 = String(response['id'] || '')['trim'](),
    conversationId2 = String(response['conversationId'] || '')['trim'](),
    type2 = String(response['type'] || '')['trim'](),
    itemType = String(response['itemType'] || 'audit')['trim']();
  if (!id2 || !conversationId2 || !SESSION_EVENT_TYPES['has'](type2) || !SESSION_ITEM_TYPES['has'](itemType))
    return null;
  const ts = normalizeTimestamp(response['ts'], fallbackTs),
    payload = normalizePayload({ ...response, itemType: itemType }, ts);
  if (!payload) return null;
  return {
    id: id2,
    seq: normalizeSequence(response['seq'], fallbackSeq),
    conversationId: conversationId2,
    projectId: String(response['projectId'] || '')['trim'](),
    turnId: String(response['turnId'] || '')['trim'](),
    itemId: String(response['itemId'] || '')['trim'](),
    type: type2,
    itemType: itemType,
    status: String(response['status'] || '')
      ['trim']()
      ['slice'](0, 80),
    ts: ts,
    payload: payload,
  };
}
export function createAgentMessageSessionEvent({
  id: id = '',
  seq: seq = 0,
  conversationId: conversationId = '',
  projectId: projectId = '',
  turnId: turnId = '',
  itemId: itemId = '',
  message: message = {},
  previousMessage: previousMessage = null,
} = {}) {
  const replyVersionChange2 = createAgentReplyVersionChange(message, previousMessage),
    message3 = { ...message };
  if (replyVersionChange2) delete message3['replyVersions'];
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
    payload: {
      message: message3,
      ...(replyVersionChange2 ? { replyVersionChange: replyVersionChange2 } : {}),
    },
  });
}
function getRunSessionEventShape(response2 = {}) {
  const next = String(response2['type'] || '')['trim'](),
    type3 = String(response2['status'] || '')['trim']();
  if (next === 'run.status')
    return {
      type:
        type3 === 'planning'
          ? 'turn.started'
          : TERMINAL_TURN_STATUSES['has'](type3)
            ? 'turn.completed'
            : 'turn.updated',
      itemType: 'audit',
      itemId: '',
    };
  if (next === 'approval.requested') return { type: 'item.started', itemType: 'approval' };
  if (next === 'approval.confirmed' || next === 'approval.cancelled')
    return { type: 'item.completed', itemType: 'approval' };
  return { type: 'audit.recorded', itemType: 'audit', itemId: '' };
}
export function createAgentRunSessionEvent({
  id: id = '',
  seq: seq = 0,
  conversationId: conversationId = '',
  projectId: projectId = '',
  itemId: itemId = '',
  runEvent: runEvent = {},
} = {}) {
  const type4 = getRunSessionEventShape(runEvent),
    current = String(runEvent['commandId'] || '')['trim'](),
    entry = Math['max'](0, Math['trunc'](Number(runEvent['step'] || 0))),
    record =
      type4['itemType'] === 'approval'
        ? String(runEvent['runId'] || '')['trim']() + ':approval:' + entry + ':' + (current || 'plan')
        : '';
  return normalizeAgentSessionEvent({
    id: id,
    seq: seq,
    conversationId: conversationId,
    projectId: projectId,
    turnId: runEvent['runId'],
    itemId: itemId || record || type4['itemId'],
    type: type4['type'],
    itemType: type4['itemType'],
    status: runEvent['status'],
    ts: runEvent['ts'],
    payload: { runEvent: runEvent },
  });
}
function getItemLifecycleType(handle = '') {
  const state = String(handle || '')['trim']();
  if (TERMINAL_ITEM_STATUSES['has'](state)) return 'item.completed';
  if (['pending', 'queued', 'running', 'submitted']['includes'](state)) return 'item.started';
  return 'item.updated';
}
export function createAgentOperationSessionEvent({
  id: id = '',
  seq: seq = 0,
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
  seq: seq = 0,
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
function sortSessionEvents(args = []) {
  return [...args]['sort']((config, scope) => {
    const count3 = Number(config['seq'] || 0) - Number(scope['seq'] || 0);
    if (count3 !== 0) return count3;
    const count4 = Number(config['ts'] || 0) - Number(scope['ts'] || 0);
    if (count4 !== 0) return count4;
    return String(config['id'] || '')['localeCompare'](String(scope['id'] || ''));
  });
}
export function projectAgentSessionEvents(list2 = []) {
  const events = sortSessionEvents(
      (Array['isArray'](list2) ? list2 : [])
        ['map']((input, fallbackSeq2) =>
          normalizeAgentSessionEvent(input, { fallbackSeq: fallbackSeq2 + 1 }),
        )
        ['filter'](Boolean),
    ),
    map = new Map(),
    runEvents2 = [],
    map2 = new Map(),
    map3 = new Map(),
    map4 = new Map(),
    map5 = new Map();
  for (const startedAt2 of events) {
    const id3 = startedAt2['turnId'];
    if (id3) {
      const response3 = map4['get'](id3) || {
        id: id3,
        status: '',
        startedAt: startedAt2['ts'],
        updatedAt: startedAt2['ts'],
        completedAt: 0,
        itemIds: [],
      };
      response3['updatedAt'] = startedAt2['ts'];
      if (startedAt2['status']) response3['status'] = startedAt2['status'];
      if (startedAt2['type'] === 'turn.started') response3['startedAt'] = startedAt2['ts'];
      if (startedAt2['type'] === 'turn.completed') response3['completedAt'] = startedAt2['ts'];
      (startedAt2['itemId'] &&
        !response3['itemIds']['includes'](startedAt2['itemId']) &&
        response3['itemIds']['push'](startedAt2['itemId']),
        map4['set'](id3, response3));
    }
    if (startedAt2['itemId']) {
      const response4 = map5['get'](startedAt2['itemId']) || {
        id: startedAt2['itemId'],
        turnId: id3,
        type: startedAt2['itemType'],
        status: '',
        startedAt: startedAt2['ts'],
        updatedAt: startedAt2['ts'],
        completedAt: 0,
      };
      ((response4['turnId'] = id3 || response4['turnId']),
        (response4['type'] = startedAt2['itemType']),
        (response4['status'] = startedAt2['status'] || response4['status']),
        (response4['updatedAt'] = startedAt2['ts']));
      if (startedAt2['type'] === 'item.completed') response4['completedAt'] = startedAt2['ts'];
      map5['set'](startedAt2['itemId'], response4);
    }
    if (startedAt2['payload']['message']) {
      const output = startedAt2['itemId'] || startedAt2['id'],
        cloneJson2 = cloneJson(startedAt2['payload']['message'], {});
      (startedAt2['payload']['replyVersionChange'] &&
        (cloneJson2['replyVersions'] = applyAgentReplyVersionChange(
          map['get'](output),
          startedAt2['payload']['replyVersionChange'],
        )),
        map['set'](output, cloneJson2));
    }
    if (startedAt2['payload']['runEvent'])
      runEvents2['push'](cloneJson(startedAt2['payload']['runEvent'], {}));
    (startedAt2['payload']['operation'] &&
      map2['set'](
        startedAt2['payload']['operation']['id'],
        cloneJson(startedAt2['payload']['operation'], {}),
      ),
      startedAt2['payload']['taskBinding'] &&
        map3['set'](
          startedAt2['payload']['taskBinding']['id'],
          cloneJson(startedAt2['payload']['taskBinding'], {}),
        ));
  }
  return {
    events: events['map']((value2) => cloneJson(value2, {})),
    messages: [...map['values']()],
    runEvents: runEvents2['slice'](-MAX_PROJECTED_RUN_EVENTS),
    operationLedger: [...map2['values']()]['slice'](-MAX_PROJECTED_OPERATIONS),
    taskBindings: [...map3['values']()]['slice'](-MAX_PROJECTED_TASK_BINDINGS),
    turns: [...map4['values']()]['map']((value3) => cloneJson(value3, {})),
    items: [...map5['values']()]['map']((value4) => cloneJson(value4, {})),
  };
}
function valuesMatch(value5, value6) {
  return JSON['stringify'](value5) === JSON['stringify'](value6);
}
export function compareAgentSessionProjection({
  projection: projection = {},
  messages: messages = [],
  runEvents: runEvents = [],
  operationLedger: operationLedger = [],
  taskBindings: taskBindings = [],
} = {}) {
  const value7 = (Array['isArray'](messages) ? messages : [])
      ['map']((value8) => normalizeMessageSnapshot(value8, value8?.['ts']))
      ['filter'](Boolean),
    value9 = (Array['isArray'](runEvents) ? runEvents : [])
      ['map']((value10) => normalizeAgentRunEvent(value10, value10?.['ts']))
      ['filter'](Boolean),
    value11 = (Array['isArray'](operationLedger) ? operationLedger : [])
      ['map']((value12) => normalizeAgentOperation(value12, value12?.['startedAt']))
      ['filter'](Boolean),
    value13 = (Array['isArray'](taskBindings) ? taskBindings : [])
      ['map']((value14) => normalizeAgentTaskBinding(value14))
      ['filter'](Boolean),
    args2 = {
      messages: valuesMatch(projection['messages'] || [], value7),
      runEvents: valuesMatch(projection['runEvents'] || [], value9),
      operationLedger: valuesMatch(projection['operationLedger'] || [], value11),
      taskBindings: valuesMatch(projection['taskBindings'] || [], value13),
    };
  return {
    ...args2,
    ok: Object['values'](args2)['every'](Boolean),
    mismatches: Object['entries'](args2)
      ['filter'](([, enabled]) => !enabled)
      ['map'](([value15]) => value15),
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
  const list3 = [];
  let value16 = 0;
  const run = (handler, message4, value17, value18) => {
    const seq2 = ++value16,
      value19 = handler({
        id: conversationId + ':migrated:' + value17 + ':' + (value18 + 1),
        seq: seq2,
        conversationId: conversationId,
        projectId: projectId,
        ...(value17 === 'message' ? { itemId: conversationId + ':message:' + (value18 + 1) } : {}),
        ...(value17 === 'message' ? { message: message4 } : {}),
        ...(value17 === 'run' ? { runEvent: message4 } : {}),
        ...(value17 === 'operation' ? { operation: message4 } : {}),
        ...(value17 === 'task' ? { taskBinding: message4 } : {}),
      });
    if (value19) list3['push'](value19);
  };
  return (
    messages['forEach']((value20, value21) =>
      run(createAgentMessageSessionEvent, value20, 'message', value21),
    ),
    runEvents['forEach']((value22, value23) => run(createAgentRunSessionEvent, value22, 'run', value23)),
    operationLedger['forEach']((value24, value25) =>
      run(createAgentOperationSessionEvent, value24, 'operation', value25),
    ),
    taskBindings['forEach']((value26, value27) => run(createAgentTaskSessionEvent, value26, 'task', value27)),
    list3
  );
}
