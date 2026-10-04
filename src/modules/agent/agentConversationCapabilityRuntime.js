import { createAgentExternalInformationRuntime } from './agentExternalInformationRuntime.js';
import { createAgentProjectMemoryConversationRuntime } from './agentProjectMemoryConversationRuntime.js';
import { createAgentSkillConversationRuntime } from './agentSkillConversationRuntime.js';
export function createAgentConversationCapabilityRuntime({
  sessionStore: sessionStore,
  skillRegistry: skillRegistry,
  author: author,
  saveSkill: saveSkill,
  deleteSkill: deleteSkill,
  setSkillEnabled: setSkillEnabled,
  projectMemoryStore: projectMemoryStore,
  externalToolRegistry: externalToolRegistry,
  localeProvider: localeProvider,
  isActiveRun: isActiveRun,
} = {}) {
  const getPendingSkillConversation = createAgentSkillConversationRuntime({
      sessionStore: sessionStore,
      skillRegistry: skillRegistry,
      author: author,
      saveSkill: saveSkill,
      deleteSkill: deleteSkill,
      setSkillEnabled: setSkillEnabled,
      localeProvider: localeProvider,
      isActiveRun: isActiveRun,
    }),
    agentProjectMemoryConversationRuntime = createAgentProjectMemoryConversationRuntime({
      projectMemoryStore: projectMemoryStore,
      sessionStore: sessionStore,
      localeProvider: localeProvider,
    }),
    prepareExternalInformation = createAgentExternalInformationRuntime({
      toolRegistry: externalToolRegistry,
      sessionStore: sessionStore,
    });
  return {
    getPendingSkillConversation: getPendingSkillConversation['getPending'],
    async handleCommand({
      message: message,
      pendingSkillConversation: pendingSkillConversation,
      runId: runId,
      signal: signal,
    } = {}) {
      const value = await getPendingSkillConversation['handle']({
        message: message,
        pending: pendingSkillConversation,
        runId: runId,
        signal: signal,
      });
      return value || agentProjectMemoryConversationRuntime['handle']({ message: message, runId: runId });
    },
    prepareExternalInformation: prepareExternalInformation['prepare'],
  };
}
