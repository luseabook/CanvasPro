import { generateText } from './aiTextApi.js';
import { STORYBOARD_SCRIPT_TEXT_MODEL, STORYBOARD_SCRIPT_TEXT_PROVIDER } from '../src/core/storyboardScriptFactory.js';
import { getModelsByKind, resolveModelExecution } from '../src/manifests/index.js';
import { collectStoryAiModels } from '../src/modules/storyWorkspace/storyAiProviderModel.js';
import { createStoryAiClient } from '../src/modules/storyWorkspace/storyAiClient.js';

const client = createStoryAiClient({ execute: generateText, resolveExecution: resolveModelExecution });
export function getStoryAiModels(nodes = {}) {
  return collectStoryAiModels({
    defaultModel: { model: STORYBOARD_SCRIPT_TEXT_MODEL, provider: STORYBOARD_SCRIPT_TEXT_PROVIDER },
    manifests: getModelsByKind('text'), nodes, resolveExecution: resolveModelExecution,
  });
}
export function assertStoryAiModelReady(model) { return client.assertModel(model); }
export function isStoryAiPending() { return client.isPending(); }
export function requestStoryAi(task, model) { return client.request(task, model); }
