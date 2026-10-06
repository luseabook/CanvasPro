import { createAgentContextDigestRuntime } from './agentContextDigestRuntime.js';
export function createAgentModelRequestRuntime({
  sessionStore: sessionStore,
  projectMemoryStore: projectMemoryStore,
  getSettings: getSettings,
  getLocale: getLocale,
  summarizeContext: summarizeContext,
  requestAssistant: requestAssistant,
  requestPlanner: requestPlanner,
} = {}) {
  const settings = () => ({
      ...(typeof getSettings === 'function' ? getSettings() : {}),
      ...(typeof getLocale === 'function' ? { locale: getLocale() } : {}),
    }),
    prepareContextDigest = createAgentContextDigestRuntime({
      sessionStore: sessionStore,
      summarize: ({
        existingDigest: existingDigest,
        messages: messages,
        projectMemory: projectMemory,
        signal: signal,
        onTrace: onTrace,
      }) =>
        summarizeContext({
          existingDigest: existingDigest,
          messages: messages,
          projectMemory: projectMemory,
          signal: signal,
          onTrace: onTrace,
          settings: settings(),
        }),
    });
  async function run(args, handler) {
    const projectMemory2 = projectMemoryStore?.getMemory?.() || null,
      contextDigest = await prepareContextDigest.prepare({ ...args, projectMemory: projectMemory2 });
    return handler({
      ...args,
      contextDigest: contextDigest,
      projectMemory: projectMemory2,
      settings: settings(),
    });
  }
  return {
    assistant(options = {}) {
      return run(options, requestAssistant);
    },
    planner(options2 = {}) {
      return run(options2, requestPlanner);
    },
    prepareContextDigest: prepareContextDigest.prepare,
  };
}
