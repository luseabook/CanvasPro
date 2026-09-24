import { normalizeAgentSkillUsageSnapshots } from './agentSkillUsage.js';
const MAX_EVENT_MESSAGE_CHARS = 0x140,
  MAX_EVENT_IDS = 0x18;
function truncateText(_0x228542, _0x1a5245 = MAX_EVENT_MESSAGE_CHARS) {
  const _0x31c296 = String(_0x228542 || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
  return _0x31c296['length'] <= _0x1a5245
    ? _0x31c296
    : _0x31c296['slice'](0x0, Math['max'](0x0, _0x1a5245 - 0x3)) + '...';
}
function normalizeStringArray(_0x5df154) {
  return Array['isArray'](_0x5df154)
    ? [...new Set(_0x5df154['map']((_0x364cc6) => String(_0x364cc6 || '')['trim']())['filter'](Boolean))][
        'slice'
      ](0x0, MAX_EVENT_IDS)
    : [];
}
function normalizeTimestamp(_0x9a3b3a, _0x4266ea = Date['now']()) {
  const _0x32bcc6 = Number(_0x9a3b3a);
  return Number['isFinite'](_0x32bcc6) && _0x32bcc6 > 0x0 ? _0x32bcc6 : _0x4266ea;
}
export function normalizeAgentRunEvent(_0x4c0029 = {}, _0x301b38 = Date['now']()) {
  const _0x4364ba = String(_0x4c0029['type'] || '')['trim']();
  if (!_0x4364ba) return null;
  const _0x59b6a3 = normalizeTimestamp(_0x4c0029['ts'], _0x301b38),
    _0x250924 = {
      id: String(_0x4c0029['id'] || '')['trim'](),
      runId: String(_0x4c0029['runId'] || '')['trim'](),
      conversationId: String(_0x4c0029['conversationId'] || '')['trim'](),
      projectId: String(_0x4c0029['projectId'] || '')['trim'](),
      type: _0x4364ba,
      status: String(_0x4c0029['status'] || '')['trim'](),
      step: Math['max'](0x0, Math['trunc'](Number(_0x4c0029['step'] || 0x0))),
      commandId: String(_0x4c0029['commandId'] || '')['trim'](),
      ok: _0x4c0029['ok'] === !![] ? !![] : _0x4c0029['ok'] === ![] ? ![] : null,
      errorCode: String(_0x4c0029['errorCode'] || '')['trim'](),
      message: truncateText(_0x4c0029['message'] || _0x4c0029['reason'] || ''),
      channel: String(_0x4c0029['channel'] || '')
        ['trim']()
        ['slice'](0x0, 0x50),
      ts: _0x59b6a3,
    },
    _0x131edd = normalizeStringArray(_0x4c0029['commandIds']),
    _0x4f7204 = normalizeStringArray(_0x4c0029['modelIds']);
  if (_0x131edd['length'] > 0x0) _0x250924['commandIds'] = _0x131edd;
  if (_0x4f7204['length'] > 0x0) _0x250924['modelIds'] = _0x4f7204;
  const _0x404c67 = normalizeStringArray(_0x4c0029['skillIds']),
    _0x18b600 = normalizeAgentSkillUsageSnapshots(_0x4c0029['skillSnapshots']);
  if (_0x404c67['length'] > 0x0) _0x250924['skillIds'] = _0x404c67;
  if (_0x18b600['length'] > 0x0) _0x250924['skillSnapshots'] = _0x18b600;
  if (_0x4c0029['confirmed'] === !![]) _0x250924['confirmed'] = !![];
  return _0x250924;
}
export function replayAgentRunEvents(_0x58f58c = [], { runId: runId = '' } = {}) {
  const _0x116398 = String(runId || '')['trim'](),
    _0x57a22a = (Array['isArray'](_0x58f58c) ? _0x58f58c : [])
      ['map']((_0x16f7c6) => normalizeAgentRunEvent(_0x16f7c6))
      ['filter']((_0x4d816e) => _0x4d816e && (!_0x116398 || _0x4d816e['runId'] === _0x116398))
      ['sort']((_0x266a07, _0x1f3a5c) => _0x266a07['ts'] - _0x1f3a5c['ts']),
    _0x4a6b4f = _0x57a22a[0x0] || null,
    _0x175cee = _0x57a22a['at'](-0x1) || null,
    _0x23970a = _0x57a22a['filter'](
      (_0x407775) => _0x407775['type'] === 'tool.completed' && _0x407775['commandId'],
    )['map']((_0x5d159d) => ({
      commandId: _0x5d159d['commandId'],
      ok: _0x5d159d['ok'],
      step: _0x5d159d['step'],
      confirmed: _0x5d159d['confirmed'] === !![],
    })),
    _0x4d06e0 = _0x57a22a['filter']((_0x4e4971) => _0x4e4971['type']['startsWith']('approval.')),
    _0x32d74a = _0x57a22a['filter'](
      (_0x5dc622) => _0x5dc622['ok'] === ![] || _0x5dc622['status'] === 'failed' || _0x5dc622['errorCode'],
    ),
    _0x2f776d =
      [..._0x57a22a]
        ['reverse']()
        ['find']((_0x4f109e) => _0x4f109e['type'] === 'run.status' && _0x4f109e['status'])?.['status'] || '';
  return {
    runId: _0x116398 || _0x4a6b4f?.['runId'] || '',
    status: _0x2f776d,
    startedAt: _0x4a6b4f?.['ts'] || 0x0,
    endedAt: _0x175cee?.['ts'] || 0x0,
    durationMs: _0x4a6b4f && _0x175cee ? Math['max'](0x0, _0x175cee['ts'] - _0x4a6b4f['ts']) : 0x0,
    eventCount: _0x57a22a['length'],
    commandSequence: _0x23970a,
    toolSuccessCount: _0x23970a['filter']((_0x2c87b6) => _0x2c87b6['ok'] === !![])['length'],
    toolFailureCount: _0x23970a['filter']((_0xf03d06) => _0xf03d06['ok'] === ![])['length'],
    approvalRequestedCount: _0x4d06e0['filter']((_0x2eaf11) => _0x2eaf11['type'] === 'approval.requested')[
      'length'
    ],
    approvalConfirmedCount: _0x4d06e0['filter']((_0x23361f) => _0x23361f['type'] === 'approval.confirmed')[
      'length'
    ],
    approvalCancelledCount: _0x4d06e0['filter']((_0x31374a) => _0x31374a['type'] === 'approval.cancelled')[
      'length'
    ],
    discoveryCount: _0x57a22a['filter']((_0x3f66f2) => _0x3f66f2['type'] === 'capability.discovered')[
      'length'
    ],
    errors: _0x32d74a['map']((_0x2c10a0) => ({
      type: _0x2c10a0['type'],
      commandId: _0x2c10a0['commandId'],
      errorCode: _0x2c10a0['errorCode'],
      message: _0x2c10a0['message'],
    })),
    events: _0x57a22a,
  };
}
