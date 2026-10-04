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
  store: store,
  getScopeId: getScopeId,
  registry: registry = nodeRuntimeRegistry,
  dependencies: dependencies = {},
}) {
  const resolve = createImageGenerationExecutionOwner({
      store: store,
      getScopeId: getScopeId,
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
    handler = registry['registerResolver']('ai-image', (value, item) => resolve['resolve'](value, item));
  return {
    resolve: resolve['resolve'],
    dispose() {
      (handler(), resolve['dispose']());
    },
  };
}
