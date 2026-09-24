import { createStoryAiRequestGate } from './storyAiRequestGate.js';
import { assertStoryAiModelAvailable } from './storyAiProviderModel.js';
import { STORY_AI_LIMITS } from './storyAiModel.js';

// Inject the existing executor, not keys or request URLs. Pure enough for offline tests.
export function createStoryAiClient({ execute, resolveExecution }) {
  const gate = createStoryAiRequestGate(execute);
  function assertModel(model) { return assertStoryAiModelAvailable(model, resolveExecution); }
  function request(task, model) {
    const identity = assertModel(model);
    if (typeof task?.prompt !== 'string' || !task.prompt.trim() || task.prompt.length > STORY_AI_LIMITS.prompt ||
        typeof task.systemPrompt !== 'string' || task.systemPrompt.length > 8000) {
      throw new Error('剧本 AI 提示词无效或超过限制，未发送请求');
    }
    // Do not spread untrusted node/task/model objects into the request payload.
    return gate.run({ ...identity, prompt: task.prompt, systemPrompt: task.systemPrompt,
      inputUrls: [], inputImageUrls: [], inputVideoUrls: [] });
  }
  return { request, assertModel, isPending: gate.isPending };
}
