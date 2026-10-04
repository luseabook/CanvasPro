import { normalizeGenerationParams } from '../src/modules/modelGenerationParamMemory.js';
export function buildAgentModelRequestParams(options = {}) {
  const generationParams = normalizeGenerationParams(options?.['generationParams']);
  return Object['keys'](generationParams)['length'] ? { generationParams: generationParams } : {};
}
