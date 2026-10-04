import { generateText } from './aiTextApi.js';
import { invokeStoryGenerationRequest } from './story-generation/storyInvocationEvidence.js';
import { buildTextStructuredOutputSystemPrompt } from './adapters/textStructuredOutput.js';
import {
  buildVideoReplicationSourcePrompt,
  createVideoReplicationSourceOutput,
  parseVideoReplicationSourceResult,
} from '../src/domain/storyGeneration/videoReplicationSourceAnalysis.js';
import { VIDEO_REPLICATION_PROMPT_MODEL_ID } from '../src/domain/storyGeneration/videoReplicationPromptAnalysis.js';
import { assertVideoAnalysisModel } from '../src/manifests/textVideoUnderstanding.js';
import { getReplicationSourceSpeechReviewReasons } from '../src/domain/storyGeneration/videoReplicationSpeechIntegrity.js';
import {
  buildReplicationAsrWords,
  buildAsrVisualPrompt,
  createAsrVisualOutput,
  hydrateAsrSource,
  attachAsrSourceEvidence,
} from '../src/domain/storyGeneration/videoReplicationAsrEvidence.js';
export async function analyzeVideoReplicationClip({
  videoRef: videoRef = '',
  durationSec: durationSec = 0x0,
  modelId: modelId = VIDEO_REPLICATION_PROMPT_MODEL_ID,
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  sourceAnalysis: sourceAnalysis = null,
  speechEvidence: speechEvidence = null,
  onSourceAnalysis: onSourceAnalysis,
  onProgress: onProgress,
  isActive: isActive = () => !![],
  request: request = generateText,
} = {}) {
  if (!String(videoRef || '')['trim']()) throw new Error('待分析片段缺少视频地址');
  if (!isActive()) throw new Error('视频分析所属项目已失效。');
  if (!sourceAnalysis) {
    (assertVideoAnalysisModel(modelId), onProgress?.('正在分析原片故事、人物、镜头及对白、解说与独白'));
    const prompt = speechEvidence ? buildReplicationAsrWords(speechEvidence) : null,
      videoReplicationSourceOutput = createVideoReplicationSourceOutput({ durationSec: durationSec }),
      structuredOutput = prompt
        ? createAsrVisualOutput(videoReplicationSourceOutput)
        : videoReplicationSourceOutput,
      handler = (response) => {
        if (!prompt) return parseVideoReplicationSourceResult(response, { durationSec: durationSec });
        const value = JSON['parse'](
            String(response?.['text'] ?? response)
              ['trim']()
              ['replace'](/^```(?:json)?\s*|\s*```$/gu, ''),
          ),
          hydrateAsrSource2 = hydrateAsrSource(value, speechEvidence, prompt);
        return attachAsrSourceEvidence(
          parseVideoReplicationSourceResult(JSON['stringify'](hydrateAsrSource2), {
            durationSec: durationSec,
          }),
          hydrateAsrSource2,
          speechEvidence,
        );
      },
      args = {
        model: modelId,
        provider: provider,
        ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
        prompt: prompt
          ? buildAsrVisualPrompt({ durationSec: durationSec, words: prompt })
          : buildVideoReplicationSourcePrompt({ durationSec: durationSec }),
        systemPrompt: buildTextStructuredOutputSystemPrompt(
          'Observe the source video faithfully. Do not translate, adapt, or generate video prompts. Character visualPrompt describes only observed appearance for a standalone character reference image; keep review notes in description and identityNotes.',
          structuredOutput,
          { mode: 'prompt' },
        ),
        inputVideoUrls: [String(videoRef)['trim']()],
        mediaPolicy: 'image-video',
        allowVideo: !![],
        structuredOutput: structuredOutput,
        thinking: { type: 'disabled' },
        temperature: 0.2,
        maxOutputTokens: 0x4000,
        timeoutMs: 0x5 * 0x3c * 0x3e8,
      },
      handler2 = (requestPayload, attempt) =>
        invokeStoryGenerationRequest({
          request: request,
          requestPayload: requestPayload,
          stepId: 'replication-source-analysis',
          attempt: attempt,
        });
    let response2 = await handler2(args, 0x1);
    if (!isActive()) throw new Error('视频分析所属项目已失效。');
    try {
      sourceAnalysis = handler(response2);
    } catch (error) {
      if (error['code'] !== 'SOURCE_ANALYSIS_REPAIRABLE') throw error;
      (onProgress?.('原片分析的镜头、人声或角色字段不完整，正在核对原视频纠正（1/1）'),
        (response2 = await handler2(
          {
            ...args,
            temperature: 0x0,
            prompt: [
              args['prompt'],
              '上次校验失败：' + error['message'],
              '重新核对所附原视频；视频总长为\x20' +
                durationSec +
                ' 秒，时间全部使用绝对秒数，必须满足 0 <= startSec < endSec <= ' +
                durationSec +
                '，人物代表帧也必须在视频内。1分52秒是112秒，不是152秒。',
              '这是唯一一次纠正。保留全部实际观察到的剧情、人物与逐句人声，不通过删除事件或人声来逃避校验；核对并修正无效编号、时间、镜头边界、人声先后及镜头引用和缺失的角色外观提示词，visualPrompt\x20使用简体中文。',
              speechEvidence
                ? '回看缺失时段及声音关联疑点，纠正画面、切点、人物归属和 speechAssignments；ASR 原文和时间由程序保留，不转写或纠正台词。分类依据不足时保留 uncertain，不假称听到了视频原声。'
                : '本次回听并优先核对报错事件的人声接缝、声音类型、speechOrder 和对应切点；上次响应只是待核对记录，不是证据。若通话画面确实只有解说，在 uncertainties 说明，不凭动作强造对白。',
              '<rejected_response>',
              typeof response2 === 'string' ? response2 : String(response2?.['text'] || ''),
              '</rejected_response>',
            ]['join']('\x0a'),
          },
          0x2,
        )));
      if (!isActive()) throw new Error('视频分析所属项目已失效。');
      sourceAnalysis = handler(response2);
    }
    const list = getReplicationSourceSpeechReviewReasons(sourceAnalysis, { durationSec: durationSec });
    (list['length'] &&
      sourceAnalysis['events']['length'] &&
      (sourceAnalysis['events'][0x0]['uncertainties'] = [
        ...new Set([...sourceAnalysis['events'][0x0]['uncertainties'], ...list]),
      ]),
      await onSourceAnalysis?.(sourceAnalysis));
  }
  if (!isActive()) throw new Error('视频分析所属项目已失效。');
  return { sourceAnalysis: sourceAnalysis };
}
