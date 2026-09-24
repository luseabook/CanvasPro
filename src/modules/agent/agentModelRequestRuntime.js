import { createAgentContextDigestRuntime } from './agentContextDigestRuntime.js';
export function createAgentModelRequestRuntime({
  sessionStore: _0x59f160,
  projectMemoryStore: _0x80df7,
  getSettings: _0x5496a7,
  getLocale: _0x49a05a,
  summarizeContext: _0x8fa4d2,
  requestAssistant: _0x48acf8,
  requestPlanner: _0x5a0fe4,
} = {}) {
  const _0x14be78 = () => ({
      ...(typeof _0x5496a7 === 'function' ? _0x5496a7() : {}),
      ...(typeof _0x49a05a === 'function' ? { locale: _0x49a05a() } : {}),
    }),
    _0x42f6b6 = createAgentContextDigestRuntime({
      sessionStore: _0x59f160,
      summarize: ({
        existingDigest: _0x5e0771,
        messages: _0x50d8c2,
        projectMemory: _0x20fd47,
        signal: _0x5abcec,
        onTrace: _0x2b15c6,
      }) =>
        _0x8fa4d2({
          existingDigest: _0x5e0771,
          messages: _0x50d8c2,
          projectMemory: _0x20fd47,
          signal: _0x5abcec,
          onTrace: _0x2b15c6,
          settings: _0x14be78(),
        }),
    });
  async function _0x40ce1c(_0xa28a14, _0x25bb91) {
    const _0x26e898 = _0x80df7?.['getMemory']?.() || null,
      _0x14d696 = await _0x42f6b6['prepare']({ ..._0xa28a14, projectMemory: _0x26e898 });
    return _0x25bb91({
      ..._0xa28a14,
      contextDigest: _0x14d696,
      projectMemory: _0x26e898,
      settings: _0x14be78(),
    });
  }
  return {
    assistant(_0x20b320 = {}) {
      return _0x40ce1c(_0x20b320, _0x48acf8);
    },
    planner(_0x269963 = {}) {
      return _0x40ce1c(_0x269963, _0x5a0fe4);
    },
    prepareContextDigest: _0x42f6b6['prepare'],
  };
}
