import { compactAgentConversationText } from './agentConversationText.js';
export const AGENT_CONTEXT_DIGEST_SCHEMA_VERSION = 0x1;
export const AGENT_CONTEXT_DIGEST_RECENT_MESSAGE_LIMIT = 0xc;
export const AGENT_CONTEXT_DIGEST_MIN_BATCH_MESSAGES = 0x8;
const MAX_GOAL_CHARS = 0x320,
  MAX_ITEM_CHARS = 0x1e0,
  MAX_ITEMS_PER_SECTION = 0xa,
  MAX_MESSAGE_CHARS = 0x7d0,
  DIGEST_ARRAY_FIELDS = Object['freeze'](['constraints', 'decisions', 'completed', 'pending']);
function compactWhitespace(_0x10ce35 = '') {
  return String(_0x10ce35 || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function truncateText(_0x2064dc, _0x1d16da) {
  const _0x57c3ee = compactWhitespace(_0x2064dc);
  if (_0x57c3ee['length'] <= _0x1d16da) return _0x57c3ee;
  return _0x57c3ee['slice'](0x0, Math['max'](0x0, _0x1d16da - 0x3)) + '...';
}
function normalizeDigestItems(_0x97f3c0) {
  if (!Array['isArray'](_0x97f3c0)) return [];
  const _0x3c0bd6 = new Set(),
    _0x5675b8 = [];
  for (const _0x182402 of _0x97f3c0) {
    const _0x35225f = truncateText(_0x182402, MAX_ITEM_CHARS);
    if (!_0x35225f || _0x3c0bd6['has'](_0x35225f)) continue;
    (_0x3c0bd6['add'](_0x35225f), _0x5675b8['push'](_0x35225f));
    if (_0x5675b8['length'] >= MAX_ITEMS_PER_SECTION) break;
  }
  return _0x5675b8;
}
export function normalizeAgentContextDigest(_0x52164a = null) {
  if (!_0x52164a || typeof _0x52164a !== 'object' || Array['isArray'](_0x52164a)) return null;
  const _0x49f568 = {
      schemaVersion: AGENT_CONTEXT_DIGEST_SCHEMA_VERSION,
      goal: truncateText(_0x52164a['goal'], MAX_GOAL_CHARS),
      constraints: normalizeDigestItems(_0x52164a['constraints']),
      decisions: normalizeDigestItems(_0x52164a['decisions']),
      completed: normalizeDigestItems(_0x52164a['completed']),
      pending: normalizeDigestItems(_0x52164a['pending']),
      coveredThroughItemId: String(_0x52164a['coveredThroughItemId'] || '')
        ['trim']()
        ['slice'](0x0, 0xa0),
      coveredThroughTs: Math['max'](0x0, Math['trunc'](Number(_0x52164a['coveredThroughTs'] || 0x0))),
      coveredMessageCount: Math['max'](0x0, Math['trunc'](Number(_0x52164a['coveredMessageCount'] || 0x0))),
    },
    _0x47dd3d = Boolean(
      _0x49f568['goal'] || DIGEST_ARRAY_FIELDS['some']((_0x514e59) => _0x49f568[_0x514e59]['length'] > 0x0),
    ),
    _0x569a25 = Boolean(
      _0x49f568['coveredThroughItemId'] || _0x49f568['coveredThroughTs'] || _0x49f568['coveredMessageCount'],
    );
  return _0x47dd3d || _0x569a25 ? _0x49f568 : null;
}
function getMessageItemId(_0x5ce761 = {}) {
  return String(_0x5ce761['itemId'] || '')['trim']();
}
function findCoveredMessageIndex(_0x1efed6, _0x110eed) {
  const _0x23d6be = String(_0x110eed?.['coveredThroughItemId'] || '')['trim']();
  if (_0x23d6be) {
    const _0x542097 = _0x1efed6['findIndex']((_0x2e4c07) => getMessageItemId(_0x2e4c07) === _0x23d6be);
    if (_0x542097 >= 0x0) return _0x542097;
  }
  const _0x37b394 = Number(_0x110eed?.['coveredThroughTs'] || 0x0);
  if (_0x37b394 > 0x0)
    for (let _0x2957e5 = _0x1efed6['length'] - 0x1; _0x2957e5 >= 0x0; _0x2957e5 -= 0x1) {
      if (Number(_0x1efed6[_0x2957e5]?.['ts'] || 0x0) <= _0x37b394) return _0x2957e5;
    }
  return -0x1;
}
function normalizeDigestMessage(_0x58db5f = {}) {
  const _0xaed4f8 = String(_0x58db5f['role'] || 'assistant') === 'user' ? 'user' : 'assistant',
    _0x1b007b = compactAgentConversationText(
      _0x58db5f['content'] || _0x58db5f['reply'] || _0x58db5f['message'] || _0x58db5f['question'] || '',
      MAX_MESSAGE_CHARS,
    ),
    _0xcc1e36 = String(_0x58db5f['status'] || '')
      ['trim']()
      ['slice'](0x0, 0x50);
  if (!_0x1b007b && !_0xcc1e36) return null;
  return {
    role: _0xaed4f8,
    content: _0x1b007b,
    ...(_0xcc1e36 ? { status: _0xcc1e36 } : {}),
    itemId: getMessageItemId(_0x58db5f),
    ts: Math['max'](0x0, Math['trunc'](Number(_0x58db5f['ts'] || 0x0))),
  };
}
export function selectAgentContextDigestBatch({
  history: history = [],
  contextDigest: contextDigest = null,
  recentMessageLimit: recentMessageLimit = AGENT_CONTEXT_DIGEST_RECENT_MESSAGE_LIMIT,
  minBatchMessages: minBatchMessages = AGENT_CONTEXT_DIGEST_MIN_BATCH_MESSAGES,
} = {}) {
  const _0x358ca0 = Array['isArray'](history) ? history : [],
    _0x393355 = normalizeAgentContextDigest(contextDigest),
    _0x4dbcda = Math['max'](
      0x0,
      _0x358ca0['length'] - Math['max'](0x1, Math['trunc'](Number(recentMessageLimit) || 0x1)),
    ),
    _0xb82559 = findCoveredMessageIndex(_0x358ca0, _0x393355),
    _0x1899da = _0xb82559 >= 0x0 ? _0xb82559 + 0x1 : 0x0,
    _0x388273 = _0x358ca0['slice'](_0x1899da, _0x4dbcda)['map'](normalizeDigestMessage)['filter'](Boolean);
  if (_0x388273['length'] < Math['max'](0x1, Math['trunc'](Number(minBatchMessages) || 0x1)))
    return { contextDigest: _0x393355, messages: [], coveredThrough: null };
  const _0x332a1e = _0x388273['at'](-0x1);
  return {
    contextDigest: _0x393355,
    messages: _0x388273,
    coveredThrough: { itemId: _0x332a1e['itemId'], ts: _0x332a1e['ts'] },
  };
}
export function attachAgentContextDigestCursor(
  _0x4577e1,
  {
    previousDigest: previousDigest = null,
    coveredThrough: coveredThrough = null,
    messageCount: messageCount = 0x0,
  } = {},
) {
  return normalizeAgentContextDigest({
    ...(_0x4577e1 || {}),
    coveredThroughItemId: String(coveredThrough?.['itemId'] || '')['trim'](),
    coveredThroughTs: Math['max'](0x0, Math['trunc'](Number(coveredThrough?.['ts'] || 0x0))),
    coveredMessageCount:
      Math['max'](0x0, Math['trunc'](Number(previousDigest?.['coveredMessageCount'] || 0x0))) +
      Math['max'](0x0, Math['trunc'](Number(messageCount || 0x0))),
  });
}
export function compactAgentContextDigestForPrompt(_0x3cfea9 = null) {
  const _0x20d793 = normalizeAgentContextDigest(_0x3cfea9);
  if (!_0x20d793) return null;
  return {
    schemaVersion: _0x20d793['schemaVersion'],
    goal: _0x20d793['goal'],
    constraints: _0x20d793['constraints'],
    decisions: _0x20d793['decisions'],
    completed: _0x20d793['completed'],
    pending: _0x20d793['pending'],
    instruction: 'This summarizes earlier turns. Prefer newer explicit user instructions when they conflict.',
  };
}
