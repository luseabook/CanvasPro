import { generateText } from './aiTextApi.js';
import { buildTextStructuredOutputSystemPrompt } from './adapters/textStructuredOutput.js';
import { invokeStoryGenerationRequest } from './story-generation/storyInvocationEvidence.js';
import { buildVideoReplicationSourceEvidence } from '../src/domain/storyGeneration/videoReplicationSourceAnalysis.js';
import { parseStrictJson } from './utils/strictJson.js';
export function buildStoryReplicationAdaptationInput({ project: project, episode: episode, assets: assets }) {
  return { source: buildVideoReplicationSourceEvidence(episode, project, assets) };
}
export async function prepareStoryReplicationGenerationScript({
  input: input,
  model: model,
  provider: provider,
  providerProfileId: providerProfileId,
  onInvocation: onInvocation,
  request: request = generateText,
} = {}) {
  const structuredOutput = {
      name: 'story_replication_adapted_script',
      strict: !![],
      fallback: 'prompt',
      schema: {
        type: 'object',
        additionalProperties: ![],
        required: ['title', 'fullScript'],
        properties: { title: { type: 'string' }, fullScript: { type: 'string', minLength: 1 } },
      },
    },
    response = await invokeStoryGenerationRequest({
      request: request,
      onInvocation: onInvocation,
      stepId: 'replication-adaptation',
      attempt: 1,
      requestPayload: {
        model: model,
        provider: provider,
        ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
        mediaPolicy: 'text-only',
        structuredOutput: structuredOutput,
        systemPrompt:
          buildTextStructuredOutputSystemPrompt(
            '忠实复刻原剧情，只执行用户确认的人物对应替换和对白语言选择。targetLocale 为 source 时保持原语言、原对白；其他语言逐句翻译，保持原意、信息量、语气、说话顺序和说话人对应。角色称呼使用绑定的目标人物名称，这些名称仅用于角色对应，不作为参考图的性别、年龄或外貌设定；已选替换图的角色，动作和镜头描述不得沿用原演员外貌、发型和服装，不根据图片猜测新的人物关系。对白中的亲属称呼和身份表述仍保留原话。替换物种时只调整完成同一动作所需的身体表现，不改变动作目的或结果。保留原片人物关系、事件顺序、关键动作、场景、道具、冲突和结局，禁止新增、删减或改写剧情。原镜头时间用于核对，不输出时间标签或视频提示词。说话人未知和听不清的内容保留疑点。场景标题使用原片场景，正文写明实际出场的目标人物。只返回完整剧本 JSON。',
            structuredOutput,
            { mode: 'prompt' },
          ) +
          (input?.['source']?.['timingGuidance'] ? '\n' + input['source']['timingGuidance'] : '') +
          (input?.['source']?.['speechGuidance'] ? '\n' + input['source']['speechGuidance'] : '') +
          (input?.['source']?.['adaptation']?.['audioLanguage']
            ? '\n' + input['source']['adaptation']['audioLanguage']
            : ''),
        prompt: JSON['stringify'](input),
        thinking: { type: 'disabled' },
        temperature: 0.2,
        maxOutputTokens: 16384,
        timeoutMs: 5 * 60 * 1000,
      },
    }),
    fullScript = parseStrictJson(response?.['text'] ?? response);
  if (typeof fullScript?.['fullScript'] !== 'string' || !fullScript['fullScript']['trim']())
    throw new Error('复刻剧本未返回完整正文；原片分析与替换设置已保留。');
  return {
    title: String(fullScript['title'] || '')['trim'](),
    fullScript: fullScript['fullScript']['trim'](),
  };
}
