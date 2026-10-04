import { createMissingModelCredentialError } from '../../services/modelGenerationReadiness.js';
import { guardModelGenerationCredentials } from '../modelCredentialUi.js';
function buildStoryModelCredentialOptions(modelId = {}) {
  return {
    modelId: modelId['model'] || modelId['modelId'],
    provider: modelId['provider'],
    providerProfileId: modelId['providerProfileId'] || modelId['rhProviderProfileId'],
    adapterType: modelId['adapterType'],
    payload: modelId,
  };
}
export async function requireStoryModelCredentials(
  options = {},
  {
    guardCredentials: guardCredentials = guardModelGenerationCredentials,
    createCredentialError: createCredentialError = createMissingModelCredentialError,
  } = {},
) {
  const guardCredentials2 = await guardCredentials({
    ...buildStoryModelCredentialOptions(options),
    waitForConfig: !![],
  });
  if (guardCredentials2?.['ready'] !== ![]) return guardCredentials2;
  const credentialError = createCredentialError(guardCredentials2);
  credentialError['credentialPromptShown'] = !![];
  throw credentialError;
}
export function guardStoryModelTaskCredentials(handler, value) {
  if (typeof handler !== 'function') return handler;
  return async (options2 = {}, ...args) => {
    return (await requireStoryModelCredentials(options2, value), handler(options2, ...args));
  };
}
