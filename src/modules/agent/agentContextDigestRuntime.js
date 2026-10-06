import {
  attachAgentContextDigestCursor,
  normalizeAgentContextDigest,
  selectAgentContextDigestBatch,
} from './agentContextDigest.js';
export function createAgentContextDigestRuntime({
  sessionStore: sessionStore,
  summarize: summarize,
  recentMessageLimit: recentMessageLimit,
  minBatchMessages: minBatchMessages,
} = {}) {
  const map = new Map();
  async function prepare({
    history: history = [],
    projectMemory: projectMemory = null,
    signal: signal = null,
    onTrace: onTrace = null,
  } = {}) {
    const value = sessionStore?.getActiveConversation?.() || null,
      conversationId = String(value?.id || '').trim(),
      contextDigest = normalizeAgentContextDigest(
        sessionStore?.getContextDigest?.() || value?.contextDigest,
      );
    if (!conversationId || typeof summarize !== 'function') return contextDigest;
    const messageCount = selectAgentContextDigestBatch({
      history: history,
      contextDigest: contextDigest,
      ...(recentMessageLimit == null ? {} : { recentMessageLimit: recentMessageLimit }),
      ...(minBatchMessages == null ? {} : { minBatchMessages: minBatchMessages }),
    });
    if (messageCount.messages.length === 0) return contextDigest;
    const key = [
        conversationId,
        messageCount.coveredThrough?.itemId ||
          messageCount.coveredThrough?.ts ||
          messageCount.messages.length,
      ].join(':'),
      item = map.get(conversationId);
    if (item) return item.promise;
    const promise = (async () => {
      onTrace?.({
        type: 'agent_context_digest_started',
        conversationId: conversationId,
        messageCount: messageCount.messages.length,
      });
      try {
        const index = await summarize({
            existingDigest: messageCount.contextDigest,
            messages: messageCount.messages,
            projectMemory: projectMemory,
            signal: signal,
            onTrace: onTrace,
          }),
          coveredMessageCount = attachAgentContextDigestCursor(index, {
            previousDigest: messageCount.contextDigest,
            coveredThrough: messageCount.coveredThrough,
            messageCount: messageCount.messages.length,
          });
        if (!coveredMessageCount) return contextDigest;
        return (
          sessionStore?.setContextDigest?.(coveredMessageCount, { conversationId: conversationId }),
          onTrace?.({
            type: 'agent_context_digest_completed',
            conversationId: conversationId,
            coveredMessageCount: coveredMessageCount.coveredMessageCount,
          }),
          coveredMessageCount
        );
      } catch (error) {
        return (
          onTrace?.({
            type: 'agent_context_digest_failed',
            conversationId: conversationId,
            reason: String(error?.message || error || 'context digest failed').slice(0, 240),
          }),
          contextDigest
        );
      } finally {
        const event = map.get(conversationId);
        if (event?.key === key) map.delete(conversationId);
      }
    })();
    return (map.set(conversationId, { key: key, promise: promise }), promise);
  }
  return { prepare: prepare };
}
