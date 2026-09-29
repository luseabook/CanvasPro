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
  videoRef: _0xb9558c,
  durationSec: _0x2d800e,
  model: _0x49fdf4,
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  maxClipSeconds: _0x20ddae,
  promptMode: _0x10d4e2,
  cutHints: cutHints = [],
  request: request = generateText,
  prepareEvidence: _0x549c99,
  onInvocation: _0x25a9f2,
  onCheckpoint: _0x25a27f,
  onProgress: _0x583e7b,
  signal: _0x2d62b2,
  isActive: isActive = () => !![],
  totalMs: totalMs = 0x8 * 0xea60,
  stageMs: stageMs = 0x2bf20,
  reviewWindowSec: reviewWindowSec = 0x23,
} = {}) {
  (requireFlow(
    typeof _0xb9558c === 'string' && _0xb9558c['trim']() && Number['isFinite'](_0x2d800e) && _0x2d800e > 0x0,
    '原视频或时长无效',
  ),
    assertVideoAnalysisModel(_0x49fdf4));
  const _0x20f84c = resolveReplicationFlowOptions({ promptMode: _0x10d4e2, maxSeconds: _0x20ddae }),
    _0x39d415 = (_0x38e70b) => compileReplicationFlow(_0x38e70b, _0x20f84c['maxSeconds'], _0x20f84c),
    _0x116262 = Date['now'](),
    _0x4809e3 = [],
    _0x577f49 = [];
  let _0x58b2ac = null,
    _0x213915 = 'observe',
    _0x3e3b28,
    _0x3f1f8f = 0x0,
    _0x4e66cd = '';
  const _0xe45b44 = () => {
      requireFlow(!_0x2d62b2?.['aborted'] && isActive(), '流程已取消或项目已失效');
    },
    _0x20a932 = async (_0x3c572a, _0x22e442 = {}) => {
      (_0xe45b44(),
        await _0x25a27f?.({
          stage: _0x3c572a,
          source: _0x58b2ac,
          stages: structuredClone(_0x4809e3),
          notes: structuredClone(_0x577f49),
          ..._0x22e442,
        }));
    },
    _0x6720c1 = async (_0x516a00) =>
      _0x549c99
        ? _0x549c99({ videoRef: _0xb9558c, durationSec: _0x2d800e, windows: _0x516a00, signal: _0x2d62b2 })
        : {
            videoRef: _0xb9558c,
            windows: [
              { sourceStartSec: 0x0, sourceEndSec: _0x2d800e, reelStartSec: 0x0, reelEndSec: _0x2d800e },
            ],
          };
  async function _0x3f17da(_0x3be1e1, _0x29f3ec, _0x54f929, _0x21bfe2, _0x4f3bba = 0x1) {
    (_0xe45b44(), (_0x213915 = _0x3be1e1));
    const _0x5ac8c5 = totalMs - (Date['now']() - _0x116262);
    requireFlow(_0x5ac8c5 > 0x3e8, '自动流程总时限已到');
    const _0x16cb0f = new AbortController(),
      _0x2871b5 = () => _0x16cb0f['abort'](_0x2d62b2['reason']);
    _0x2d62b2?.['addEventListener']('abort', _0x2871b5, { once: !![] });
    const _0x31d3a2 = Math['min'](stageMs, _0x5ac8c5),
      _0x7ed401 = setTimeout(() => _0x16cb0f['abort'](new Error('自动流程请求达到时限')), _0x31d3a2),
      _0x589bc3 = Date['now']();
    let _0x32bbc3 = ![];
    _0x583e7b?.({ stage: _0x3be1e1, status: 'running', elapsedMs: Date['now']() - _0x116262 });
    try {
      const _0xab5551 = await invokeStoryGenerationRequest({
        request: request,
        stepId: 'replication-flow-' + _0x3be1e1,
        attempt: _0x4f3bba,
        onInvocation: _0x25a9f2,
        requestPayload: {
          model: _0x49fdf4,
          provider: provider,
          ...(providerProfileId ? { providerProfileId: providerProfileId } : {}),
          ..._0x29f3ec,
          inputVideoUrls: [_0x54f929],
          mediaPolicy: 'image-video',
          allowVideo: !![],
          thinking: { type: 'disabled' },
          temperature: 0.2,
          maxOutputTokens: _0x21bfe2,
          timeoutMs: Math['min'](0x15f90, _0x31d3a2),
          signal: _0x16cb0f['signal'],
          onText: (_0x31034f) => {
            if (String(_0x31034f)['trim']()) _0x32bbc3 = !![];
          },
        },
      });
      _0xe45b44();
      const _0x180634 = typeof _0xab5551 === 'string' ? _0xab5551 : _0xab5551['text'];
      _0x4e66cd = _0x180634;
      let _0x46bce0;
      try {
        _0x46bce0 = parseStrictJson(_0x180634);
      } catch (_0x3c6fff) {
        throw Object['assign'](new Error('模型 JSON 格式无效：' + _0x3c6fff['message']), {
          rawResponse: _0x180634,
        });
      }
      return (
        _0x4809e3['push']({
          stage: _0x3be1e1,
          attempt: _0x4f3bba,
          status: 'completed',
          elapsedMs: Date['now']() - _0x589bc3,
          responseBytes: new TextEncoder()['encode'](_0x180634)['length'],
        }),
        _0x46bce0
      );
    } catch (_0x3fc646) {
      _0x4809e3['push']({
        stage: _0x3be1e1,
        attempt: _0x4f3bba,
        status: 'failed',
        elapsedMs: Date['now']() - _0x589bc3,
        error: _0x3fc646['message'],
      });
      if (
        !_0x32bbc3 &&
        !_0x3fc646['partialText'] &&
        _0x3fc646['retryable'] === !![] &&
        _0x3f1f8f === 0x0 &&
        !_0x16cb0f['signal']['aborted']
      )
        return (
          _0x3f1f8f++,
          clearTimeout(_0x7ed401),
          _0x2d62b2?.['removeEventListener']('abort', _0x2871b5),
          await _0x20a932(_0x3be1e1 + '-transport-retry', { error: _0x3fc646['message'] }),
          _0x3f17da(_0x3be1e1, _0x29f3ec, _0x54f929, _0x21bfe2, _0x4f3bba + 0x1)
        );
      throw Object['assign'](_0x3fc646, { flowRequestFailed: !![] });
    } finally {
      (clearTimeout(_0x7ed401), _0x2d62b2?.['removeEventListener']('abort', _0x2871b5));
    }
  }
  try {
    let _0x5a5094;
    try {
      ((_0x5a5094 = await _0x3f17da(
        'observe',
        flowObservationPrompt({ durationSec: _0x2d800e, cutHints: cutHints }),
        _0xb9558c,
        0x4000,
      )),
        (_0x58b2ac = validateFlowSource(_0x5a5094, _0x2d800e, _0x577f49)),
        _0x39d415(_0x58b2ac));
    } catch (_0x229940) {
      if (!_0x5a5094 && !_0x229940['rawResponse']) throw _0x229940;
      ((_0x5a5094 = _0x229940['rawResponse'] || _0x4e66cd || _0x5a5094),
        await _0x20a932('observe-invalid', { observed: _0x5a5094, validationError: _0x229940['message'] }),
        (_0x5a5094 = await _0x3f17da(
          'structure-repair',
          flowObservationPrompt({
            durationSec: _0x2d800e,
            cutHints: cutHints,
            invalid: _0x5a5094,
            error: _0x229940['message'],
          }),
          _0xb9558c,
          0x4000,
        )),
        (_0x58b2ac = validateFlowSource(_0x5a5094, _0x2d800e, _0x577f49)),
        _0x39d415(_0x58b2ac));
    }
    const _0x5b208f = inspectFlowSpeech(_0x58b2ac);
    if (_0x5b208f['length']) {
      await _0x20a932('speech-incomplete', { missingSpeech: _0x5b208f });
      try {
        const _0x4c77a6 = await _0x3f17da(
            'speech-recovery',
            flowSpeechRecoveryPrompt(_0x58b2ac, _0x2d800e),
            _0xb9558c,
            0x2000,
          ),
          _0x560dc6 = applyFlowSpeechRecovery(_0x58b2ac, _0x4c77a6, _0x2d800e);
        (_0x39d415(_0x560dc6['source']),
          (_0x58b2ac = _0x560dc6['source']),
          _0x577f49['push'](..._0x560dc6['notes']),
          await _0x20a932('speech-recovered', { removedCaptionDuplicates: _0x560dc6['removals'] }));
      } catch (_0x4a4447) {
        _0xe45b44();
        if (_0x4a4447['flowRequestFailed'] && !_0x4a4447['rawResponse']) throw _0x4a4447;
        (_0x577f49['push']({
          code: 'stage-failed',
          stage: 'speech-recovery',
          blocking: ![],
          detail: _0x4a4447['message'],
        }),
          await _0x20a932('speech-recovery-skipped'));
      }
    }
    await _0x20a932('observe');
    const _0x208cb2 = createFlowReviewWindows(_0x58b2ac, _0x2d800e, reviewWindowSec),
      _0x4330ee = { actionable: [] };
    let _0x38c4eb = ![];
    for (const [_0x3105cd, _0x2e1299] of _0x208cb2['entries']()) {
      const _0x9f662b = _0x208cb2['length'] === 0x1 ? 'review' : 'review-' + (_0x3105cd + 0x1);
      let _0x4f3b2b;
      try {
        (_0xe45b44(), (_0x213915 = _0x9f662b), (_0x4f3b2b = await _0x6720c1(_0x2e1299['windows'])));
        const _0x44a212 = Object['fromEntries'](
            ['shots', 'speech']['map']((_0x320663) => [
              _0x320663,
              _0x58b2ac[_0x320663]['filter'](
                (_0x28a905) =>
                  !_0x2e1299['scope'][_0x320663]['some'](
                    (_0x3a0767) => _0x3a0767['id'] === _0x28a905['id'],
                  ) &&
                  _0x4f3b2b['windows']['some'](
                    (_0x455607) =>
                      _0x28a905['endSec'] > _0x455607['sourceStartSec'] &&
                      _0x28a905['startSec'] < _0x455607['sourceEndSec'],
                  ),
              ),
            ]),
          ),
          _0x54896d = mapFlowReviewTimes(
            await _0x3f17da(
              _0x9f662b,
              flowReviewPrompt(_0x2e1299['scope'], _0x4f3b2b['windows'], _0x44a212),
              _0x4f3b2b['videoRef'],
              0x1000,
            ),
            _0x4f3b2b['windows'],
            _0x577f49,
          ),
          _0x447c03 = classifyFlowReview(_0x2e1299['scope'], _0x54896d, _0x2d800e);
        (_0x4330ee['actionable']['push'](
          ..._0x447c03['actionable']['map']((_0x2e994d) => ({
            ..._0x2e994d,
            id:
              _0x208cb2['length'] === 0x1 ? _0x2e994d['id'] : 'w' + (_0x3105cd + 0x1) + '-' + _0x2e994d['id'],
          })),
        ),
          _0x577f49['push'](..._0x447c03['notes']),
          await _0x20a932(_0x9f662b, { review: _0x54896d, actionable: _0x4330ee['actionable'] }));
      } catch (_0x160619) {
        (_0xe45b44(),
          _0x577f49['push']({
            code: 'stage-failed',
            stage: _0x9f662b,
            blocking: ![],
            detail: _0x160619['message'],
          }),
          await _0x20a932(_0x9f662b + '-skipped'));
        if (_0x160619['flowRequestFailed'] && !_0x160619['rawResponse']) {
          _0x38c4eb = !![];
          break;
        }
      } finally {
        await _0x4f3b2b?.['dispose']?.();
      }
    }
    if (_0x4330ee['actionable']['length'] && !_0x38c4eb) {
      const _0x7d4944 = flowEvidenceWindows(_0x58b2ac, _0x4330ee['actionable'], _0x2d800e),
        _0x3c5f65 = await _0x6720c1(_0x7d4944);
      ((_0x3e3b28 = _0x3c5f65['dispose']),
        requireFlow(
          _0x3c5f65['videoRef'] && Array['isArray'](_0x3c5f65['windows']) && _0x3c5f65['windows']['length'],
          '局部原片证据未就绪',
        ),
        _0xe45b44());
      const _0x324c39 = await _0x3f17da(
        'repair',
        flowRepairPrompt(_0x58b2ac, _0x4330ee['actionable'], _0x3c5f65['windows']),
        _0x3c5f65['videoRef'],
        0x1800,
      );
      let _0x185029;
      try {
        const _0x52ae8b = applyFlowRepairIndividually(
          _0x58b2ac,
          _0x4330ee['actionable'],
          _0x324c39,
          _0x2d800e,
        );
        ((_0x185029 = _0x52ae8b['candidate']),
          _0x577f49['push'](
            ..._0x52ae8b['rejected']['map']((_0x1cf81a) => ({
              ..._0x1cf81a,
              code: 'patch-rejected',
              blocking: ![],
            })),
          ),
          _0x39d415(_0x185029));
      } catch (_0x278df1) {
        (_0x577f49['push']({ code: 'repair-contract', blocking: ![], detail: _0x278df1['message'] }),
          await _0x20a932('repair-rejected', { repair: _0x324c39 }));
      }
      if (_0x185029 && !_0x577f49['some']((_0x45b062) => _0x45b062['code'] === 'repair-contract')) {
        await _0x20a932('repair-candidate', { candidate: _0x185029, repair: _0x324c39 });
        const _0x186f78 = await _0x3f17da(
          'verify',
          flowVerifyPrompt(_0x185029, _0x4330ee['actionable'], _0x3c5f65['windows']),
          _0x3c5f65['videoRef'],
          0x1000,
        );
        (requireFlow(
          _0x186f78?.['videoObserved'] === !![] &&
            Array['isArray'](_0x186f78['checks']) &&
            Array['isArray'](_0x186f78['newMaterialIssues']),
          '复验返回结构无效',
        ),
          requireFlow(
            JSON['stringify'](_0x186f78['checks']['map']((_0x1cc83c) => _0x1cc83c['issueId'])['sort']()) ===
              JSON['stringify'](_0x4330ee['actionable']['map']((_0x283d56) => _0x283d56['id'])['sort']()),
            '复验没有回应全部问题',
          ));
        for (const _0x295334 of _0x186f78['checks']) {
          requireFlow(
            ['resolved', 'unresolved', 'uncertain']['includes'](_0x295334['status']) &&
              typeof _0x295334['evidence'] === 'string' &&
              _0x295334['evidence']['trim'](),
            '复验结论缺少有效状态或证据',
          );
          if (_0x295334['status'] !== 'resolved')
            _0x577f49['push']({ ..._0x295334, code: 'verification', blocking: ![] });
        }
        (_0x577f49['push'](
          ..._0x186f78['newMaterialIssues']['map']((_0x4f6ac1) => ({
            ..._0x4f6ac1,
            code: 'new-material-issue',
            blocking: ![],
          })),
        ),
          (_0x58b2ac = _0x185029),
          await _0x20a932('verify', { verification: _0x186f78 }));
      }
    }
  } catch (_0x4dbf81) {
    if (_0x2d62b2?.['aborted'] || !isActive()) throw _0x4dbf81;
    _0x577f49['push']({
      code: 'stage-failed',
      stage: _0x213915,
      blocking: ![],
      detail: _0x4dbf81['message'],
    });
  } finally {
    await _0x3e3b28?.();
  }
  const _0x2ee257 = finalizeReplicationFlow(_0x58b2ac, {
      durationSec: _0x2d800e,
      ..._0x20f84c,
      notes: _0x577f49,
    }),
    _0x2c3d88 = {
      ..._0x2ee257,
      startedAt: new Date(_0x116262)['toISOString'](),
      elapsedMs: Date['now']() - _0x116262,
      stages: _0x4809e3,
      promptBytes: _0x2ee257['clips']['reduce'](
        (_0x42978d, _0x2a8105) => _0x42978d + new TextEncoder()['encode'](_0x2a8105['prompt'])['length'],
        0x0,
      ),
      initialObservationRerun: !![],
      importedFindings: ![],
      productionProjectWritten: ![],
      transportRetries: _0x3f1f8f,
    };
  return (await _0x20a932('finished', { result: _0x2c3d88 }), _0x2c3d88);
}
