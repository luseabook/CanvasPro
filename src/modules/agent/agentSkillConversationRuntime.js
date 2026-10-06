import { createAgentSkillAuthoringRuntime } from './agentSkillAuthoringRuntime.js';
import { AGENT_SKILL_LIFECYCLE_TARGET_KIND } from './agentSkillLifecycle.js';
import { createAgentSkillLifecycleRuntime } from './agentSkillLifecycleRuntime.js';
export function createAgentSkillConversationRuntime(options = {}) {
  const agentSkillAuthoringRuntime = createAgentSkillAuthoringRuntime(options),
    agentSkillLifecycleRuntime = createAgentSkillLifecycleRuntime(options);
  return {
    getPending() {
      return agentSkillLifecycleRuntime.getPending() || agentSkillAuthoringRuntime.getPending();
    },
    async handle({
      message: message,
      pending: pending = null,
      runId: runId = '',
      signal: signal = null,
    } = {}) {
      if (pending) {
        const value =
          pending.targetKind === AGENT_SKILL_LIFECYCLE_TARGET_KIND
            ? agentSkillLifecycleRuntime
            : agentSkillAuthoringRuntime;
        return value.answer({ answer: message, pending: pending, runId: runId, signal: signal });
      }
      if (agentSkillLifecycleRuntime.matches(message))
        return agentSkillLifecycleRuntime.run({ message: message, runId: runId, signal: signal });
      if (agentSkillAuthoringRuntime.matches(message))
        return agentSkillAuthoringRuntime.run({ message: message, runId: runId, signal: signal });
      return null;
    },
  };
}
