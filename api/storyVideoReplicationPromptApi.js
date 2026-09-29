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
  onSourceAnalysis: _0x4442dd,
  onProgress: _0x3869ac,
  isActive: isActive = () => !![],
  request: request = generateText,
} = {}) {
  if (!String(videoRef || '')['trim']()) throw new Error('待分析片段缺少视频地址');
  if (!isActive()) throw new Error('视频分析所属项目已失效。');
  if (!sourceAnalysis) {
    (assertVideoAnalysisModel(modelId), _0x3869ac?.('正在分析原片故事、人物、镜头及对白、解说与独白'));
    const _0x588e26 = speechEvidence ? buildReplicationAsrWords(speechEvidence) : null,
      _0x3c02d3 = createVideoReplicationSourceOutput({ durationSec: durationSec }),
      _0x42387a = _0x588e26 ? createAsrVisualOutput(_0x3c02d3) : _0x3c02d3,
      _0x1cc778 = (_0x5e9114) => {
        if (!_0x588e26) return parseVideoReplicationSourceResult(_0x5e9114, { durationSec: durationSec });
        const _0x58dafb = JSON['parse'](
            String(_0x5e9114?.['text'] ?? _0x5e9114)
              ['trim']()
              ['replace'](/^```(?:json)?\s*|\s*```$/gu, ''),
          ),
          _0x1ada55 = hydrateAsrSource(_0x58dafb, speechEvidence, _0x588e26);
        return attachAsrSourceEvidence(
          parseVideoReplicationSourceResult(JSON['stringify'](_0x1ada55), { durationSec: durationSec }),
          _0x1ada55,
          speechEvidence,
        );
      },
      _0x526c49 = {
        model: modelId,
        provider: provider,
        ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
        prompt: _0x588e26
          ? buildAsrVisualPrompt({ durationSec: durationSec, words: _0x588e26 })
          : buildVideoReplicationSourcePrompt({ durationSec: durationSec }),
        systemPrompt: buildTextStructuredOutputSystemPrompt(
          'Observe the source video faithfully. Do not translate, adapt, or generate video prompts. Character visualPrompt describes only observed appearance for a standalone character reference image; keep review notes in description and identityNotes.',
          _0x42387a,
          { mode: 'prompt' },
        ),
        inputVideoUrls: [String(videoRef)['trim']()],
        mediaPolicy: 'image-video',
        allowVideo: !![],
        structuredOutput: _0x42387a,
        thinking: { type: 'disabled' },
        temperature: 0.2,
        maxOutputTokens: 0x4000,
        timeoutMs: 0x5 * 0x3c * 0x3e8,
      },
      _0x35e9e2 = (_0x4eb752, _0x1ea6f5) =>
        invokeStoryGenerationRequest({
          request: request,
          requestPayload: _0x4eb752,
          stepId: 'replication-source-analysis',
          attempt: _0x1ea6f5,
        });
    let _0x3b25c7 = await _0x35e9e2(_0x526c49, 0x1);
    if (!isActive()) throw new Error('视频分析所属项目已失效。');
    try {
      sourceAnalysis = _0x1cc778(_0x3b25c7);
    } catch (_0x1ee3fe) {
      if (_0x1ee3fe['code'] !== 'SOURCE_ANALYSIS_REPAIRABLE') throw _0x1ee3fe;
      (_0x3869ac?.('原片分析的镜头、人声或角色字段不完整，正在核对原视频纠正（1/1）'),
        (_0x3b25c7 = await _0x35e9e2(
          {
            ..._0x526c49,
            temperature: 0x0,
            prompt: [
              _0x526c49['prompt'],
              '上次校验失败：' + _0x1ee3fe['message'],
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
              typeof _0x3b25c7 === 'string' ? _0x3b25c7 : String(_0x3b25c7?.['text'] || ''),
              '</rejected_response>',
            ]['join']('\x0a'),
          },
          0x2,
        )));
      if (!isActive()) throw new Error('视频分析所属项目已失效。');
      sourceAnalysis = _0x1cc778(_0x3b25c7);
    }
    const _0x12ac9c = getReplicationSourceSpeechReviewReasons(sourceAnalysis, { durationSec: durationSec });
    (_0x12ac9c['length'] &&
      sourceAnalysis['events']['length'] &&
      (sourceAnalysis['events'][0x0]['uncertainties'] = [
        ...new Set([...sourceAnalysis['events'][0x0]['uncertainties'], ..._0x12ac9c]),
      ]),
      await _0x4442dd?.(sourceAnalysis));
  }
  if (!isActive()) throw new Error('视频分析所属项目已失效。');
  return { sourceAnalysis: sourceAnalysis };
}
