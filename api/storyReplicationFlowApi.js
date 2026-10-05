import { generateText } from './aiTextApi.js';
import { invokeStoryGenerationRequest } from './story-generation/storyInvocationEvidence.js';
import { parseStrictJson } from './utils/strictJson.js';
import { assertVideoAnalysisModel } from '../src/manifests/textVideoUnderstanding.js';
import {
  requireFlow,
  validateFlowSource,
  classifyFlowReview,
  applyFlowRepairIndividually,
  flowEvidenceWindows,
  inspectFlowSpeech,
  applyFlowSpeechRecovery,
  createFlowReviewWindows,
  mapFlowReviewTimes,
} from '../src/domain/storyGeneration/videoReplicationFlowContract.js';
import {
  compileReplicationFlow,
  finalizeReplicationFlow,
} from '../src/domain/storyGeneration/videoReplicationFlowPlanning.js';
import { resolveReplicationFlowOptions } from '../src/domain/storyGeneration/videoReplicationFlowPrompt.js';
import {
  flowObservationPrompt,
  flowReviewPrompt,
  flowRepairPrompt,
  flowVerifyPrompt,
  flowSpeechRecoveryPrompt,
} from './story-generation/storyReplicationFlowPrompts.js';
export async function runStoryReplicationFlow({
  videoRef: videoRef,
  durationSec: durationSec,
  model: model,
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  maxClipSeconds: maxClipSeconds,
  promptMode: promptMode,
  cutHints: cutHints = [],
  request: request = generateText,
  prepareEvidence: prepareEvidence,
  onInvocation: onInvocation,
  onCheckpoint: onCheckpoint,
  onProgress: onProgress,
  signal: signal,
  isActive: isActive = () => !![],
  totalMs: totalMs = 8 * 60000,
  stageMs: stageMs = 180000,
  reviewWindowSec: reviewWindowSec = 35,
} = {}) {
  (requireFlow(
    typeof videoRef === 'string' &&
      videoRef['trim']() &&
      Number['isFinite'](durationSec) &&
      durationSec > 0,
    '原视频或时长无效',
  ),
    assertVideoAnalysisModel(model));
  const args = resolveReplicationFlowOptions({ promptMode: promptMode, maxSeconds: maxClipSeconds }),
    handler = (value) => compileReplicationFlow(value, args['maxSeconds'], args),
    item = Date['now'](),
    stages = [],
    notes = [];
  let source = null,
    stage = 'observe',
    key,
    transportRetries = 0,
    index = '';
  const run = () => {
      requireFlow(!signal?.['aborted'] && isActive(), '流程已取消或项目已失效');
    },
    handler2 = async (stage2, args2 = {}) => {
      (run(),
        await onCheckpoint?.({
          stage: stage2,
          source: source,
          stages: structuredClone(stages),
          notes: structuredClone(notes),
          ...args2,
        }));
    },
    handler3 = async (windows) =>
      prepareEvidence
        ? prepareEvidence({ videoRef: videoRef, durationSec: durationSec, windows: windows, signal: signal })
        : {
            videoRef: videoRef,
            windows: [
              { sourceStartSec: 0, sourceEndSec: durationSec, reelStartSec: 0, reelEndSec: durationSec },
            ],
          };
  async function run2(stage3, args3, result, maxOutputTokens, attempt = 1) {
    (run(), (stage = stage3));
    const count = totalMs - (Date['now']() - item);
    requireFlow(count > 1000, '自动流程总时限已到');
    const signal2 = new AbortController(),
      data = () => signal2['abort'](signal['reason']);
    signal?.['addEventListener']('abort', data, { once: !![] });
    const options = Math['min'](stageMs, count),
      setTimeout2 = setTimeout(() => signal2['abort'](new Error('自动流程请求达到时限')), options),
      target = Date['now']();
    let enabled = ![];
    onProgress?.({ stage: stage3, status: 'running', elapsedMs: Date['now']() - item });
    try {
      const response = await invokeStoryGenerationRequest({
        request: request,
        stepId: 'replication-flow-' + stage3,
        attempt: attempt,
        onInvocation: onInvocation,
        requestPayload: {
          model: model,
          provider: provider,
          ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
          ...args3,
          inputVideoUrls: [result],
          mediaPolicy: 'image-video',
          allowVideo: !![],
          thinking: { type: 'disabled' },
          temperature: 0.2,
          maxOutputTokens: maxOutputTokens,
          timeoutMs: Math['min'](90000, options),
          signal: signal2['signal'],
          onText: (next) => {
            if (String(next)['trim']()) enabled = !![];
          },
        },
      });
      run();
      const rawResponse = typeof response === 'string' ? response : response['text'];
      index = rawResponse;
      let strictJson;
      try {
        strictJson = parseStrictJson(rawResponse);
      } catch (error) {
        throw Object['assign'](new Error('模型 JSON 格式无效：' + error['message']), {
          rawResponse: rawResponse,
        });
      }
      return (
        stages['push']({
          stage: stage3,
          attempt: attempt,
          status: 'completed',
          elapsedMs: Date['now']() - target,
          responseBytes: new TextEncoder()['encode'](rawResponse)['length'],
        }),
        strictJson
      );
    } catch (error2) {
      stages['push']({
        stage: stage3,
        attempt: attempt,
        status: 'failed',
        elapsedMs: Date['now']() - target,
        error: error2['message'],
      });
      if (
        !enabled &&
        !error2['partialText'] &&
        error2['retryable'] === !![] &&
        transportRetries === 0 &&
        !signal2['signal']['aborted']
      )
        return (
          transportRetries++,
          clearTimeout(setTimeout2),
          signal?.['removeEventListener']('abort', data),
          await handler2(stage3 + '-transport-retry', { error: error2['message'] }),
          run2(stage3, args3, result, maxOutputTokens, attempt + 1)
        );
      throw Object['assign'](error2, { flowRequestFailed: !![] });
    } finally {
      (clearTimeout(setTimeout2), signal?.['removeEventListener']('abort', data));
    }
  }
  try {
    let observed;
    try {
      ((observed = await run2(
        'observe',
        flowObservationPrompt({ durationSec: durationSec, cutHints: cutHints }),
        videoRef,
        16384,
      )),
        (source = validateFlowSource(observed, durationSec, notes)),
        handler(source));
    } catch (validationError) {
      if (!observed && !validationError['rawResponse']) throw validationError;
      ((observed = validationError['rawResponse'] || index || observed),
        await handler2('observe-invalid', {
          observed: observed,
          validationError: validationError['message'],
        }),
        (observed = await run2(
          'structure-repair',
          flowObservationPrompt({
            durationSec: durationSec,
            cutHints: cutHints,
            invalid: observed,
            error: validationError['message'],
          }),
          videoRef,
          16384,
        )),
        (source = validateFlowSource(observed, durationSec, notes)),
        handler(source));
    }
    const missingSpeech = inspectFlowSpeech(source);
    if (missingSpeech['length']) {
      await handler2('speech-incomplete', { missingSpeech: missingSpeech });
      try {
        const current = await run2(
            'speech-recovery',
            flowSpeechRecoveryPrompt(source, durationSec),
            videoRef,
            8192,
          ),
          removedCaptionDuplicates = applyFlowSpeechRecovery(source, current, durationSec);
        (handler(removedCaptionDuplicates['source']),
          (source = removedCaptionDuplicates['source']),
          notes['push'](...removedCaptionDuplicates['notes']),
          await handler2('speech-recovered', {
            removedCaptionDuplicates: removedCaptionDuplicates['removals'],
          }));
      } catch (detail) {
        run();
        if (detail['flowRequestFailed'] && !detail['rawResponse']) throw detail;
        (notes['push']({
          code: 'stage-failed',
          stage: 'speech-recovery',
          blocking: ![],
          detail: detail['message'],
        }),
          await handler2('speech-recovery-skipped'));
      }
    }
    await handler2('observe');
    const id = createFlowReviewWindows(source, durationSec, reviewWindowSec),
      actionable = { actionable: [] };
    let enabled2 = ![];
    for (const [entry, enabled3] of id['entries']()) {
      const stage4 = id['length'] === 1 ? 'review' : 'review-' + (entry + 1);
      let record;
      try {
        (run(), (stage = stage4), (record = await handler3(enabled3['windows'])));
        const payload = Object['fromEntries'](
            ['shots', 'speech']['map']((handle) => [
              handle,
              source[handle]['filter'](
                (state) =>
                  !enabled3['scope'][handle]['some']((config) => config['id'] === state['id']) &&
                  record['windows']['some'](
                    (scope) =>
                      state['endSec'] > scope['sourceStartSec'] && state['startSec'] < scope['sourceEndSec'],
                  ),
              ),
            ]),
          ),
          review = mapFlowReviewTimes(
            await run2(
              stage4,
              flowReviewPrompt(enabled3['scope'], record['windows'], payload),
              record['videoRef'],
              4096,
            ),
            record['windows'],
            notes,
          ),
          args4 = classifyFlowReview(enabled3['scope'], review, durationSec);
        (actionable['actionable']['push'](
          ...args4['actionable']['map']((args5) => ({
            ...args5,
            id: id['length'] === 1 ? args5['id'] : 'w' + (entry + 1) + '-' + args5['id'],
          })),
        ),
          notes['push'](...args4['notes']),
          await handler2(stage4, { review: review, actionable: actionable['actionable'] }));
      } catch (detail2) {
        (run(),
          notes['push']({
            code: 'stage-failed',
            stage: stage4,
            blocking: ![],
            detail: detail2['message'],
          }),
          await handler2(stage4 + '-skipped'));
        if (detail2['flowRequestFailed'] && !detail2['rawResponse']) {
          enabled2 = !![];
          break;
        }
      } finally {
        await record?.['dispose']?.();
      }
    }
    if (actionable['actionable']['length'] && !enabled2) {
      const flowEvidenceWindows2 = flowEvidenceWindows(source, actionable['actionable'], durationSec),
        input = await handler3(flowEvidenceWindows2);
      ((key = input['dispose']),
        requireFlow(
          input['videoRef'] && Array['isArray'](input['windows']) && input['windows']['length'],
          '局部原片证据未就绪',
        ),
        run());
      const repair = await run2(
        'repair',
        flowRepairPrompt(source, actionable['actionable'], input['windows']),
        input['videoRef'],
        6144,
      );
      let candidate;
      try {
        const args6 = applyFlowRepairIndividually(source, actionable['actionable'], repair, durationSec);
        ((candidate = args6['candidate']),
          notes['push'](
            ...args6['rejected']['map']((args7) => ({
              ...args7,
              code: 'patch-rejected',
              blocking: ![],
            })),
          ),
          handler(candidate));
      } catch (detail3) {
        (notes['push']({ code: 'repair-contract', blocking: ![], detail: detail3['message'] }),
          await handler2('repair-rejected', { repair: repair }));
      }
      if (candidate && !notes['some']((output) => output['code'] === 'repair-contract')) {
        await handler2('repair-candidate', { candidate: candidate, repair: repair });
        const verification = await run2(
          'verify',
          flowVerifyPrompt(candidate, actionable['actionable'], input['windows']),
          input['videoRef'],
          4096,
        );
        (requireFlow(
          verification?.['videoObserved'] === !![] &&
            Array['isArray'](verification['checks']) &&
            Array['isArray'](verification['newMaterialIssues']),
          '复验返回结构无效',
        ),
          requireFlow(
            JSON['stringify'](verification['checks']['map']((value2) => value2['issueId'])['sort']()) ===
              JSON['stringify'](actionable['actionable']['map']((value3) => value3['id'])['sort']()),
            '复验没有回应全部问题',
          ));
        for (const response2 of verification['checks']) {
          requireFlow(
            ['resolved', 'unresolved', 'uncertain']['includes'](response2['status']) &&
              typeof response2['evidence'] === 'string' &&
              response2['evidence']['trim'](),
            '复验结论缺少有效状态或证据',
          );
          if (response2['status'] !== 'resolved')
            notes['push']({ ...response2, code: 'verification', blocking: ![] });
        }
        (notes['push'](
          ...verification['newMaterialIssues']['map']((args8) => ({
            ...args8,
            code: 'new-material-issue',
            blocking: ![],
          })),
        ),
          (source = candidate),
          await handler2('verify', { verification: verification }));
      }
    }
  } catch (detail4) {
    if (signal?.['aborted'] || !isActive()) throw detail4;
    notes['push']({
      code: 'stage-failed',
      stage: stage,
      blocking: ![],
      detail: detail4['message'],
    });
  } finally {
    await key?.();
  }
  const promptBytes = finalizeReplicationFlow(source, {
      durationSec: durationSec,
      ...args,
      notes: notes,
    }),
    result2 = {
      ...promptBytes,
      startedAt: new Date(item)['toISOString'](),
      elapsedMs: Date['now']() - item,
      stages: stages,
      promptBytes: promptBytes['clips']['reduce'](
        (value4, value5) => value4 + new TextEncoder()['encode'](value5['prompt'])['length'],
        0,
      ),
      initialObservationRerun: !![],
      importedFindings: ![],
      productionProjectWritten: ![],
      transportRetries: transportRetries,
    };
  return (await handler2('finished', { result: result2 }), result2);
}
