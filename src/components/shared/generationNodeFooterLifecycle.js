import { bindGenerationNodeCredentialLifecycle } from './generationNodeCredentialLifecycle.js';
import { bindGenerationNodePricing } from './generationNodePricing.js';
export function bindGenerationNodeFooterLifecycle(value, item) {
  const run = bindGenerationNodeCredentialLifecycle(value, item),
    handler = bindGenerationNodePricing(value);
  return () => {
    (handler(), run());
  };
}
