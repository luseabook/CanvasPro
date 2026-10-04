import { normalizeAgentSkillUsageSnapshots } from './agentSkillUsage.js';
const MAX_EVENT_MESSAGE_CHARS = 0x140,
  MAX_EVENT_IDS = 0x18;
function truncateText(value, item = MAX_EVENT_MESSAGE_CHARS) {
  const list = String(value || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
  return list['length'] <= item ? list : list['slice'](0x0, Math['max'](0x0, item - 0x3)) + '...';
}
function normalizeStringArray(list2) {
  return Array['isArray'](list2)
    ? [...new Set(list2['map']((key) => String(key || '')['trim']())['filter'](Boolean))]['slice'](
        0x0,
        MAX_EVENT_IDS,
      )
    : [];
}
function normalizeTimestamp(index, result = Date['now']()) {
  const count = Number(index);
  return Number['isFinite'](count) && count > 0x0 ? count : result;
}
export function normalizeAgentRunEvent(ok = {}, data = Date['now']()) {
  const type = String(ok['type'] || '')['trim']();
  if (!type) return null;
  const ts = normalizeTimestamp(ok['ts'], data),
    options = {
      id: String(ok['id'] || '')['trim'](),
      runId: String(ok['runId'] || '')['trim'](),
      conversationId: String(ok['conversationId'] || '')['trim'](),
      projectId: String(ok['projectId'] || '')['trim'](),
      type: type,
      status: String(ok['status'] || '')['trim'](),
      step: Math['max'](0x0, Math['trunc'](Number(ok['step'] || 0x0))),
      commandId: String(ok['commandId'] || '')['trim'](),
      ok: ok['ok'] === !![] ? !![] : ok['ok'] === ![] ? ![] : null,
      errorCode: String(ok['errorCode'] || '')['trim'](),
      message: truncateText(ok['message'] || ok['reason'] || ''),
      channel: String(ok['channel'] || '')
        ['trim']()
        ['slice'](0x0, 0x50),
      ts: ts,
    },
    list3 = normalizeStringArray(ok['commandIds']),
    list4 = normalizeStringArray(ok['modelIds']);
  if (list3['length'] > 0x0) options['commandIds'] = list3;
  if (list4['length'] > 0x0) options['modelIds'] = list4;
  const list5 = normalizeStringArray(ok['skillIds']),
    list6 = normalizeAgentSkillUsageSnapshots(ok['skillSnapshots']);
  if (list5['length'] > 0x0) options['skillIds'] = list5;
  if (list6['length'] > 0x0) options['skillSnapshots'] = list6;
  if (ok['confirmed'] === !![]) options['confirmed'] = !![];
  return options;
}
export function replayAgentRunEvents(list7 = [], { runId: runId = '' } = {}) {
  const runId2 = String(runId || '')['trim'](),
    eventCount = (Array['isArray'](list7) ? list7 : [])
      ['map']((target) => normalizeAgentRunEvent(target))
      ['filter']((source) => source && (!runId2 || source['runId'] === runId2))
      ['sort']((next, current) => next['ts'] - current['ts']),
    startedAt = eventCount[0x0] || null,
    endedAt = eventCount['at'](-0x1) || null,
    commandSequence = eventCount['filter'](
      (entry) => entry['type'] === 'tool.completed' && entry['commandId'],
    )['map']((commandId) => ({
      commandId: commandId['commandId'],
      ok: commandId['ok'],
      step: commandId['step'],
      confirmed: commandId['confirmed'] === !![],
    })),
    approvalRequestedCount = eventCount['filter']((record) => record['type']['startsWith']('approval.')),
    errors = eventCount['filter'](
      (response) => response['ok'] === ![] || response['status'] === 'failed' || response['errorCode'],
    ),
    status =
      [...eventCount]
        ['reverse']()
        ['find']((response2) => response2['type'] === 'run.status' && response2['status'])?.['status'] || '';
  return {
    runId: runId2 || startedAt?.['runId'] || '',
    status: status,
    startedAt: startedAt?.['ts'] || 0x0,
    endedAt: endedAt?.['ts'] || 0x0,
    durationMs: startedAt && endedAt ? Math['max'](0x0, endedAt['ts'] - startedAt['ts']) : 0x0,
    eventCount: eventCount['length'],
    commandSequence: commandSequence,
    toolSuccessCount: commandSequence['filter']((response3) => response3['ok'] === !![])['length'],
    toolFailureCount: commandSequence['filter']((response4) => response4['ok'] === ![])['length'],
    approvalRequestedCount: approvalRequestedCount['filter'](
      (payload) => payload['type'] === 'approval.requested',
    )['length'],
    approvalConfirmedCount: approvalRequestedCount['filter'](
      (handle) => handle['type'] === 'approval.confirmed',
    )['length'],
    approvalCancelledCount: approvalRequestedCount['filter'](
      (state) => state['type'] === 'approval.cancelled',
    )['length'],
    discoveryCount: eventCount['filter']((config) => config['type'] === 'capability.discovered')['length'],
    errors: errors['map']((type2) => ({
      type: type2['type'],
      commandId: type2['commandId'],
      errorCode: type2['errorCode'],
      message: type2['message'],
    })),
    events: eventCount,
  };
}
