import { createAgentExternalInformationRuntime } from './agentExternalInformationRuntime.js';
import { createAgentProjectMemoryConversationRuntime } from './agentProjectMemoryConversationRuntime.js';
import { createAgentSkillConversationRuntime } from './agentSkillConversationRuntime.js';
export function createAgentConversationCapabilityRuntime({
  sessionStore: _0x4ffafe,
  skillRegistry: _0x521171,
  author: _0x323e9d,
  saveSkill: _0x17ba40,
  deleteSkill: _0x118383,
  setSkillEnabled: _0x362924,
  projectMemoryStore: _0x340d36,
  externalToolRegistry: _0x1329bb,
  localeProvider: _0x55c7d0,
  isActiveRun: _0x59e05f,
} = {}) {
  const _0xe8c18b = createAgentSkillConversationRuntime({
      sessionStore: _0x4ffafe,
      skillRegistry: _0x521171,
      author: _0x323e9d,
      saveSkill: _0x17ba40,
      deleteSkill: _0x118383,
      setSkillEnabled: _0x362924,
      localeProvider: _0x55c7d0,
      isActiveRun: _0x59e05f,
    }),
    _0x1d1961 = createAgentProjectMemoryConversationRuntime({
      projectMemoryStore: _0x340d36,
      sessionStore: _0x4ffafe,
      localeProvider: _0x55c7d0,
    }),
    _0x483dda = createAgentExternalInformationRuntime({ toolRegistry: _0x1329bb, sessionStore: _0x4ffafe });
  return {
    getPendingSkillConversation: _0xe8c18b['getPending'],
    async handleCommand({
      message: _0x246328,
      pendingSkillConversation: _0x55aa49,
      runId: _0x2d3bdf,
      signal: _0x53e27a,
    } = {}) {
      const _0x17e545 = await _0xe8c18b['handle']({
        message: _0x246328,
        pending: _0x55aa49,
        runId: _0x2d3bdf,
        signal: _0x53e27a,
      });
      return _0x17e545 || _0x1d1961['handle']({ message: _0x246328, runId: _0x2d3bdf });
    },
    prepareExternalInformation: _0x483dda['prepare'],
  };
}
