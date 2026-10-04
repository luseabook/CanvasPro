import nodeRuntimeRegistry from './nodeRuntimeRegistry.js';
const GENERATION_RUNTIME_METHODS = Object.freeze([
  'runGeneration',
  'getGenerationStatus',
  'cancelGeneration',
  'resumeGeneration',
]);
function buildNodeGenerationRuntime(enabled) {
  if (!enabled || typeof enabled !== 'object') return null;
  const value = {};
  for (const item of GENERATION_RUNTIME_METHODS) {
    typeof enabled[item] === 'function' && (value[item] = enabled[item].bind(enabled));
  }
  return Object.keys(value).length > 0 ? value : null;
}
export function createRendererNodeRuntimeBridge({
  getInstance: getInstance,
  registry: registry = nodeRuntimeRegistry,
} = {}) {
  return {
    register(key) {
      const nodeGenerationRuntime = buildNodeGenerationRuntime(getInstance?.(key));
      if (!nodeGenerationRuntime) {
        registry.unregister(key);
        return;
      }
      registry.register(key, nodeGenerationRuntime);
    },
    unregister(index) {
      registry.unregister(index);
    },
  };
}
