import { createImageGenerationExecutionOwner } from './imageGenerationExecutionOwner.js';
import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import { getDisplayModelName } from '../../modules/providers.js';
import { getRefKindByNodeType } from '../../modules/nodeMeta.js';
import { getImage } from '../../modules/storage.js';
import { ensureConfig, getProviderConfig } from '../../../api/configApi.js';
import {
  buildGenerateImageRequest,
  cancelRunningHubImageTask,
  generateImage,
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from '../../../api/aiImageApi.js';
import { fetchDreaminaCliStatusFromServer, getCachedDreaminaCliStatus } from '../../../api/dreaminaCliApi.js';
export function installImageGenerationExecution({
  store: _0x51a6e8,
  getScopeId: _0x4354b2,
  registry: registry = nodeRuntimeRegistry,
  dependencies: dependencies = {},
}) {
  const _0x2b5acc = createImageGenerationExecutionOwner({
      store: _0x51a6e8,
      getScopeId: _0x4354b2,
      dependencies: {
        getDisplayModelName: getDisplayModelName,
        getRefKindByNodeType: getRefKindByNodeType,
        getImage: getImage,
        ensureConfig: ensureConfig,
        getProviderConfig: getProviderConfig,
        api: {
          buildGenerateImageRequest: buildGenerateImageRequest,
          cancelRunningHubWorkflowTask: cancelRunningHubImageTask,
          generateImage: generateImage,
          resumeAsyncImageTask: resumeAsyncImageTask,
          resumeDreaminaImageTask: resumeDreaminaImageTask,
          resumeRunningHubImageTask: resumeRunningHubImageTask,
          fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
          getCachedDreaminaCliStatus: getCachedDreaminaCliStatus,
        },
        ...dependencies,
      },
    }),
    _0x48cc98 = registry['registerResolver']('ai-image', (_0x83155, _0x35fd90) =>
      _0x2b5acc['resolve'](_0x83155, _0x35fd90),
    );
  return {
    resolve: _0x2b5acc['resolve'],
    dispose() {
      (_0x48cc98(), _0x2b5acc['dispose']());
    },
  };
}
