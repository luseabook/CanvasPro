import {
  attachAgentContextDigestCursor,
  normalizeAgentContextDigest,
  selectAgentContextDigestBatch,
} from './agentContextDigest.js';
export function createAgentContextDigestRuntime({
  sessionStore: _0x1fe10e,
  summarize: _0x2ff5e2,
  recentMessageLimit: _0x57e787,
  minBatchMessages: _0x3a5597,
} = {}) {
  const _0x3f53d3 = new Map();
  async function _0x407abc({
    history: history = [],
    projectMemory: projectMemory = null,
    signal: signal = null,
    onTrace: onTrace = null,
  } = {}) {
    const _0x40e9ed = _0x1fe10e?.['getActiveConversation']?.() || null,
      _0x56919f = String(_0x40e9ed?.['id'] || '')['trim'](),
      _0x415355 = normalizeAgentContextDigest(
        _0x1fe10e?.['getContextDigest']?.() || _0x40e9ed?.['contextDigest'],
      );
    if (!_0x56919f || typeof _0x2ff5e2 !== 'function') return _0x415355;
    const _0x365831 = selectAgentContextDigestBatch({
      history: history,
      contextDigest: _0x415355,
      ...(_0x57e787 == null ? {} : { recentMessageLimit: _0x57e787 }),
      ...(_0x3a5597 == null ? {} : { minBatchMessages: _0x3a5597 }),
    });
    if (_0x365831['messages']['length'] === 0x0) return _0x415355;
    const _0x415b89 = [
        _0x56919f,
        _0x365831['coveredThrough']?.['itemId'] ||
          _0x365831['coveredThrough']?.['ts'] ||
          _0x365831['messages']['length'],
      ]['join'](':'),
      _0x2ce95b = _0x3f53d3['get'](_0x56919f);
    if (_0x2ce95b) return _0x2ce95b['promise'];
    const _0x358d7f = (async () => {
      onTrace?.({
        type: 'agent_context_digest_started',
        conversationId: _0x56919f,
        messageCount: _0x365831['messages']['length'],
      });
      try {
        const _0x507fb3 = await _0x2ff5e2({
            existingDigest: _0x365831['contextDigest'],
            messages: _0x365831['messages'],
            projectMemory: projectMemory,
            signal: signal,
            onTrace: onTrace,
          }),
          _0x7dfb5a = attachAgentContextDigestCursor(_0x507fb3, {
            previousDigest: _0x365831['contextDigest'],
            coveredThrough: _0x365831['coveredThrough'],
            messageCount: _0x365831['messages']['length'],
          });
        if (!_0x7dfb5a) return _0x415355;
        return (
          _0x1fe10e?.['setContextDigest']?.(_0x7dfb5a, { conversationId: _0x56919f }),
          onTrace?.({
            type: 'agent_context_digest_completed',
            conversationId: _0x56919f,
            coveredMessageCount: _0x7dfb5a['coveredMessageCount'],
          }),
          _0x7dfb5a
        );
      } catch (_0x371651) {
        return (
          onTrace?.({
            type: 'agent_context_digest_failed',
            conversationId: _0x56919f,
            reason: String(_0x371651?.['message'] || _0x371651 || 'context digest failed')['slice'](
              0x0,
              0xf0,
            ),
          }),
          _0x415355
        );
      } finally {
        const _0x358228 = _0x3f53d3['get'](_0x56919f);
        if (_0x358228?.['key'] === _0x415b89) _0x3f53d3['delete'](_0x56919f);
      }
    })();
    return (_0x3f53d3['set'](_0x56919f, { key: _0x415b89, promise: _0x358d7f }), _0x358d7f);
  }
  return { prepare: _0x407abc };
}
