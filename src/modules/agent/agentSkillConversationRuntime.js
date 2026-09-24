import { createAgentSkillAuthoringRuntime } from './agentSkillAuthoringRuntime.js';
import { AGENT_SKILL_LIFECYCLE_TARGET_KIND } from './agentSkillLifecycle.js';
import { createAgentSkillLifecycleRuntime } from './agentSkillLifecycleRuntime.js';
export function createAgentSkillConversationRuntime(_0x3ac813 = {}) {
  const _0x45b13d = createAgentSkillAuthoringRuntime(_0x3ac813),
    _0x23ff1a = createAgentSkillLifecycleRuntime(_0x3ac813);
  return {
    getPending() {
      return _0x23ff1a['getPending']() || _0x45b13d['getPending']();
    },
    async handle({
      message: _0x184326,
      pending: pending = null,
      runId: runId = '',
      signal: signal = null,
    } = {}) {
      if (pending) {
        const _0x3a3754 = pending['targetKind'] === AGENT_SKILL_LIFECYCLE_TARGET_KIND ? _0x23ff1a : _0x45b13d;
        return _0x3a3754['answer']({ answer: _0x184326, pending: pending, runId: runId, signal: signal });
      }
      if (_0x23ff1a['matches'](_0x184326))
        return _0x23ff1a['run']({ message: _0x184326, runId: runId, signal: signal });
      if (_0x45b13d['matches'](_0x184326))
        return _0x45b13d['run']({ message: _0x184326, runId: runId, signal: signal });
      return null;
    },
  };
}
