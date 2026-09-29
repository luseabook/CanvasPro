import { createMissingModelCredentialError } from '../../services/modelGenerationReadiness.js';
import { guardModelGenerationCredentials } from '../modelCredentialUi.js';
function buildStoryModelCredentialOptions(_0x2d3b79 = {}) {
  return {
    modelId: _0x2d3b79['model'] || _0x2d3b79['modelId'],
    provider: _0x2d3b79['provider'],
    providerProfileId: _0x2d3b79['providerProfileId'] || _0x2d3b79['rhProviderProfileId'],
    adapterType: _0x2d3b79['adapterType'],
    payload: _0x2d3b79,
  };
}
export async function requireStoryModelCredentials(
  _0x2dbbcf = {},
  {
    guardCredentials: guardCredentials = guardModelGenerationCredentials,
    createCredentialError: createCredentialError = createMissingModelCredentialError,
  } = {},
) {
  const _0x1ab87d = await guardCredentials({
    ...buildStoryModelCredentialOptions(_0x2dbbcf),
    waitForConfig: !![],
  });
  if (_0x1ab87d?.['ready'] !== ![]) return _0x1ab87d;
  const _0x3cb819 = createCredentialError(_0x1ab87d);
  _0x3cb819['credentialPromptShown'] = !![];
  throw _0x3cb819;
}
export function guardStoryModelTaskCredentials(_0x36dc69, _0x317427) {
  if (typeof _0x36dc69 !== 'function') return _0x36dc69;
  return async (_0x1de6a7 = {}, ..._0x393a23) => {
    return (await requireStoryModelCredentials(_0x1de6a7, _0x317427), _0x36dc69(_0x1de6a7, ..._0x393a23));
  };
}
