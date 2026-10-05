import { describeAgentCommand, searchAgentCommands, searchAgentModels } from './agentCapabilityDiscovery.js';
export const AGENT_DISCOVERY_COMMAND_IDS = Object['freeze']([
  'agent.capabilities.search',
  'agent.command.describe',
  'agent.models.search',
]);
const SAFE_DISCOVERY_CAPABILITY = Object['freeze']({ reads: ['agent.capabilityCatalog'], writes: [] });
export function registerAgentDiscoveryCommands(commandRegistry) {
  if (!commandRegistry?.['register'] || !commandRegistry?.['has']) return commandRegistry;
  return (
    !commandRegistry['has']('agent.capabilities.search') &&
      commandRegistry['register']({
        id: 'agent.capabilities.search',
        description:
          'Search registered Canvas Commands by user intent without executing them.',
        riskLevel: 'safe',
        argsSchema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 12, default: 6 },
          },
        },
        capabilitySchema: SAFE_DISCOVERY_CAPABILITY,
        returnSchema: {
          properties: {
            commandIds: { type: 'array', items: { type: 'string' } },
            commands: { type: 'array' },
          },
        },
        execute(args = {}) {
          return searchAgentCommands({ commandRegistry: commandRegistry, ...args });
        },
      }),
    !commandRegistry['has']('agent.command.describe') &&
      commandRegistry['register']({
        id: 'agent.command.describe',
        description: 'Load the complete planning schema for one registered Canvas Command.',
        riskLevel: 'safe',
        argsSchema: {
          type: 'object',
          required: ['commandId'],
          properties: { commandId: { type: 'string' } },
        },
        capabilitySchema: SAFE_DISCOVERY_CAPABILITY,
        returnSchema: {
          properties: {
            commandId: { type: 'string' },
            argsSchema: { type: 'object' },
            capabilitySchema: { type: 'object' },
          },
        },
        execute(args2 = {}) {
          return describeAgentCommand({ commandRegistry: commandRegistry, ...args2 });
        },
      }),
    !commandRegistry['has']('agent.models.search') &&
      commandRegistry['register']({
        id: 'agent.models.search',
        description: 'Search model manifests and return planning-safe model fields and input slots.',
        riskLevel: 'safe',
        argsSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', default: '' },
            kind: { type: 'string', enum: ['image', 'video', 'audio', 'text'] },
            provider: { type: 'string' },
            inputKinds: {
              type: 'array',
              items: { type: 'string', enum: ['image', 'video', 'audio', 'text'] },
            },
            limit: { type: 'integer', minimum: 1, maximum: 12, default: 6 },
          },
        },
        capabilitySchema: SAFE_DISCOVERY_CAPABILITY,
        returnSchema: {
          properties: { modelIds: { type: 'array', items: { type: 'string' } }, models: { type: 'array' } },
        },
        execute(options = {}) {
          return searchAgentModels(options);
        },
      }),
    commandRegistry
  );
}
