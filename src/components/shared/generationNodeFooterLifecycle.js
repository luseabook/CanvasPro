import { bindGenerationNodeCredentialLifecycle } from './generationNodeCredentialLifecycle.js';
import { bindGenerationNodePricing } from './generationNodePricing.js';
export function bindGenerationNodeFooterLifecycle(_0x31215a, _0x298129) {
  const _0xb4cf23 = bindGenerationNodeCredentialLifecycle(_0x31215a, _0x298129),
    _0x369c2a = bindGenerationNodePricing(_0x31215a);
  return () => {
    (_0x369c2a(), _0xb4cf23());
  };
}
