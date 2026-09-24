import { normalizeGenerationParams } from '../src/modules/modelGenerationParamMemory.js';
export function buildAgentModelRequestParams(_0x2c99f0 = {}) {
  const _0x225ce4 = normalizeGenerationParams(_0x2c99f0?.['generationParams']);
  return Object['keys'](_0x225ce4)['length'] ? { generationParams: _0x225ce4 } : {};
}
