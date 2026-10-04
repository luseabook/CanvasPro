import { compactAgentConversationText } from './agentConversationText.js';
export const AGENT_CONTEXT_DIGEST_SCHEMA_VERSION = 0x1;
export const AGENT_CONTEXT_DIGEST_RECENT_MESSAGE_LIMIT = 0xc;
export const AGENT_CONTEXT_DIGEST_MIN_BATCH_MESSAGES = 0x8;
const MAX_GOAL_CHARS = 0x320,
  MAX_ITEM_CHARS = 0x1e0,
  MAX_ITEMS_PER_SECTION = 0xa,
  MAX_MESSAGE_CHARS = 0x7d0,
  DIGEST_ARRAY_FIELDS = Object['freeze'](['constraints', 'decisions', 'completed', 'pending']);
function compactWhitespace(value = '') {
  return String(value || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function truncateText(item, key) {
  const list = compactWhitespace(item);
  if (list['length'] <= key) return list;
  return list['slice'](0x0, Math['max'](0x0, key - 0x3)) + '...';
}
function normalizeDigestItems(index) {
  if (!Array['isArray'](index)) return [];
  const map = new Set(),
    list2 = [];
  for (const result of index) {
    const truncateText2 = truncateText(result, MAX_ITEM_CHARS);
    if (!truncateText2 || map['has'](truncateText2)) continue;
    (map['add'](truncateText2), list2['push'](truncateText2));
    if (list2['length'] >= MAX_ITEMS_PER_SECTION) break;
  }
  return list2;
}
export function normalizeAgentContextDigest(enabled = null) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return null;
  const data = {
      schemaVersion: AGENT_CONTEXT_DIGEST_SCHEMA_VERSION,
      goal: truncateText(enabled['goal'], MAX_GOAL_CHARS),
      constraints: normalizeDigestItems(enabled['constraints']),
      decisions: normalizeDigestItems(enabled['decisions']),
      completed: normalizeDigestItems(enabled['completed']),
      pending: normalizeDigestItems(enabled['pending']),
      coveredThroughItemId: String(enabled['coveredThroughItemId'] || '')
        ['trim']()
        ['slice'](0x0, 0xa0),
      coveredThroughTs: Math['max'](0x0, Math['trunc'](Number(enabled['coveredThroughTs'] || 0x0))),
      coveredMessageCount: Math['max'](0x0, Math['trunc'](Number(enabled['coveredMessageCount'] || 0x0))),
    },
    options = Boolean(data['goal'] || DIGEST_ARRAY_FIELDS['some']((target) => data[target]['length'] > 0x0)),
    source = Boolean(data['coveredThroughItemId'] || data['coveredThroughTs'] || data['coveredMessageCount']);
  return options || source ? data : null;
}
function getMessageItemId(options2 = {}) {
  return String(options2['itemId'] || '')['trim']();
}
function findCoveredMessageIndex(list3, next) {
  const current = String(next?.['coveredThroughItemId'] || '')['trim']();
  if (current) {
    const count = list3['findIndex']((entry) => getMessageItemId(entry) === current);
    if (count >= 0x0) return count;
  }
  const count2 = Number(next?.['coveredThroughTs'] || 0x0);
  if (count2 > 0x0)
    for (let count3 = list3['length'] - 0x1; count3 >= 0x0; count3 -= 0x1) {
      if (Number(list3[count3]?.['ts'] || 0x0) <= count2) return count3;
    }
  return -0x1;
}
function normalizeDigestMessage(error = {}) {
  const role = String(error['role'] || 'assistant') === 'user' ? 'user' : 'assistant',
    content = compactAgentConversationText(
      error['content'] || error['reply'] || error['message'] || error['question'] || '',
      MAX_MESSAGE_CHARS,
    ),
    status = String(error['status'] || '')
      ['trim']()
      ['slice'](0x0, 0x50);
  if (!content && !status) return null;
  return {
    role: role,
    content: content,
    ...(status ? { status: status } : {}),
    itemId: getMessageItemId(error),
    ts: Math['max'](0x0, Math['trunc'](Number(error['ts'] || 0x0))),
  };
}
export function selectAgentContextDigestBatch({
  history: history = [],
  contextDigest: contextDigest = null,
  recentMessageLimit: recentMessageLimit = AGENT_CONTEXT_DIGEST_RECENT_MESSAGE_LIMIT,
  minBatchMessages: minBatchMessages = AGENT_CONTEXT_DIGEST_MIN_BATCH_MESSAGES,
} = {}) {
  const list4 = Array['isArray'](history) ? history : [],
    contextDigest2 = normalizeAgentContextDigest(contextDigest),
    record = Math['max'](
      0x0,
      list4['length'] - Math['max'](0x1, Math['trunc'](Number(recentMessageLimit) || 0x1)),
    ),
    coveredMessageIndex = findCoveredMessageIndex(list4, contextDigest2),
    payload = coveredMessageIndex >= 0x0 ? coveredMessageIndex + 0x1 : 0x0,
    messages = list4['slice'](payload, record)['map'](normalizeDigestMessage)['filter'](Boolean);
  if (messages['length'] < Math['max'](0x1, Math['trunc'](Number(minBatchMessages) || 0x1)))
    return { contextDigest: contextDigest2, messages: [], coveredThrough: null };
  const itemId = messages['at'](-0x1);
  return {
    contextDigest: contextDigest2,
    messages: messages,
    coveredThrough: { itemId: itemId['itemId'], ts: itemId['ts'] },
  };
}
export function attachAgentContextDigestCursor(
  handle,
  {
    previousDigest: previousDigest = null,
    coveredThrough: coveredThrough = null,
    messageCount: messageCount = 0x0,
  } = {},
) {
  return normalizeAgentContextDigest({
    ...(handle || {}),
    coveredThroughItemId: String(coveredThrough?.['itemId'] || '')['trim'](),
    coveredThroughTs: Math['max'](0x0, Math['trunc'](Number(coveredThrough?.['ts'] || 0x0))),
    coveredMessageCount:
      Math['max'](0x0, Math['trunc'](Number(previousDigest?.['coveredMessageCount'] || 0x0))) +
      Math['max'](0x0, Math['trunc'](Number(messageCount || 0x0))),
  });
}
export function compactAgentContextDigestForPrompt(value2 = null) {
  const schemaVersion = normalizeAgentContextDigest(value2);
  if (!schemaVersion) return null;
  return {
    schemaVersion: schemaVersion['schemaVersion'],
    goal: schemaVersion['goal'],
    constraints: schemaVersion['constraints'],
    decisions: schemaVersion['decisions'],
    completed: schemaVersion['completed'],
    pending: schemaVersion['pending'],
    instruction: 'This summarizes earlier turns. Prefer newer explicit user instructions when they conflict.',
  };
}
