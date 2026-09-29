import { generateText } from '../aiTextApi.js';
import { inspectReplicationSegmentTiming } from '../../src/domain/storyGeneration/videoReplicationSegmentPlan.js';
import { REPLICATION_SHOT_GUIDANCE } from '../../src/domain/storyGeneration/videoReplicationShotEvidence.js';
import {
  buildReplicationReviewRequest,
  assertReplicationRepairTiming,
  REPLICATION_TIMELINE_RULE,
} from '../../src/domain/storyGeneration/videoReplicationPromptPolicy.js';
import { replicationVisualFields } from '../../src/domain/storyGeneration/videoReplicationVisualState.js';
import { REPLICATION_SPEECH_INTEGRITY_GUIDANCE } from '../../src/domain/storyGeneration/videoReplicationSpeechIntegrity.js';
import { inspectReplicationSourceCompleteness } from '../../src/domain/storyGeneration/videoReplicationTimingContract.js';
import {
  invokeCheckpointedStoryReview,
  assertStoryReviewResolved,
  requestStoryReviewRepairs,
} from './storyReviewRequestJournal.js';
import {
  STORY_ASSET_REFERENCE_RULES,
  buildStoryAssetReferenceContract,
  normalizeStoryGenerationAssetReferences,
} from './storyAssetReferenceContract.js';
import { buildVideoReplicationSpeechReviewContext } from '../../src/domain/storyGeneration/videoReplicationSpeechPolicy.js';
import {
  buildVideoReplicationTimingGuidance,
  buildVideoReplicationSourceEvidence,
} from '../../src/domain/storyGeneration/videoReplicationSourceAnalysis.js';
import {
  getVideoReplicationAudioLanguage,
  buildVideoReplicationAudioLanguageRule,
} from '../../src/domain/storyGeneration/videoReplicationLanguage.js';
import {
  parseReviewResponse,
  parseRepairResponse,
  requestStoryReviewOutput,
} from './storyReviewOutputContract.js';
import { validateStoryRepairTiming, getStoryRepairResumeCandidates } from './storyRepairTimingValidation.js';
import {
  getStoryEpisodeClipGroupingRequirements,
  getStoryEpisodePromptModePlanningRequirements,
} from '../../src/domain/storyGeneration/promptModeRules.js';
import { isStoryContinuousTimelinePromptMode } from '../../src/domain/storyGeneration/promptModes.js';
import { invokeStoryGenerationRequest } from './storyInvocationEvidence.js';
import { buildStoryTextProviderProfilePayload, getResultText } from './storyTextRequest.js';
import {
  STORY_MAX_SPOKEN_UNITS_PER_SECOND,
  countStorySpokenUnits,
  normalizeStoryEpisodeSpokenTiming,
} from './storyEpisodeSpokenTiming.js';
export const STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION = 0x4;
export const STORY_EPISODE_SPLIT_QUALITY_BATCH_SIZE = 0xa;
const MAX_SOURCE_CHARACTERS = 0x8ca0,
  MAX_OUTPUT_TOKENS = 0x2ee0,
  REQUEST_TIMEOUT_MS = 0x8 * 0x3c * 0x3e8,
  MAX_SPOKEN_UNITS_PER_SECOND = STORY_MAX_SPOKEN_UNITS_PER_SECOND,
  BLOCKING_LOCAL_SIGNAL_CODES = new Set([
    'replication_duration_extreme',
    'replication_shot_collapsed',
    'replication_shot_coverage_missing',
    'replication_shot_boundary_missing',
    'replication_shot_internal_cut',
    'replication_speech_duplicate',
    'replication_speech_mismatch',
    'replication_speech_order',
    'duration_sum_mismatch',
    'dialogue_timing_suspicious',
  ]),
  REVIEW_SYSTEM_PROMPT = [
    '你是短剧分镜成片前的独立审片员。你的任务是发现具体片段的问题，不是重新规划整集。',
    '片段数量和整集总时长没有固定正确值，绝不能因为片段多、片段少、整集长或整集短而判失败。',
    '时长必须按当前剧本内容判断：对白能否自然说完、动作是否能完成、情绪停顿和镜头调度是否有足够时间。',
    '只根据给出的原剧本、候选片段和邻接关系判定；没有明确问题就通过。只返回严格\x20JSON。',
    '每项 reason 和 repairInstruction 各不超过 80 字，只写问题结论与修改动作，不复述台词、不复制 JSON、不输出推理过程；字符串内部若含 ASCII 双引号必须按 JSON 转义。',
  ]['join']('\x0a');
function normalizeText(_0x40fceb) {
  return String(_0x40fceb || '')['trim']();
}
function cloneJson(_0x29c936) {
  if (_0x29c936 == null) return _0x29c936;
  return JSON['parse'](JSON['stringify'](_0x29c936));
}
function stableSerialize(_0x43b184) {
  if (Array['isArray'](_0x43b184)) return '[' + _0x43b184['map'](stableSerialize)['join'](',') + ']';
  if (_0x43b184 && typeof _0x43b184 === 'object')
    return (
      '{' +
      Object['keys'](_0x43b184)
        ['sort']()
        ['map']((_0x242b54) => JSON['stringify'](_0x242b54) + ':' + stableSerialize(_0x43b184[_0x242b54]))
        ['join'](',') +
      '}'
    );
  return JSON['stringify'](_0x43b184 ?? null);
}
function fingerprint(_0x449567) {
  const _0x269f55 = stableSerialize(_0x449567);
  let _0x1477e2 = 0x811c9dc5;
  for (let _0x25c580 = 0x0; _0x25c580 < _0x269f55['length']; _0x25c580 += 0x1) {
    ((_0x1477e2 ^= _0x269f55['charCodeAt'](_0x25c580)), (_0x1477e2 = Math['imul'](_0x1477e2, 0x1000193)));
  }
  return 'fnv1a-' + (_0x1477e2 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
function getEpisodeRef(_0x3274be = {}, _0x10660d = {}) {
  return (
    normalizeText(
      _0x10660d?.['episodeRef'] || _0x3274be?.['ref'] || _0x3274be?.['planningRef'] || _0x3274be?.['id'],
    ) || 'episode-1'
  );
}
function getEpisodeSource(_0x307343 = {}) {
  const _0x17c3a2 = normalizeText(_0x307343?.['script']?.['fullText']);
  if (_0x17c3a2) return _0x17c3a2['slice'](0x0, MAX_SOURCE_CHARACTERS);
  return (Array['isArray'](_0x307343?.['script']?.['scenes']) ? _0x307343['script']['scenes'] : [])
    ['map']((_0x51a195) =>
      [_0x51a195?.['heading'], _0x51a195?.['body']]['map'](normalizeText)['filter'](Boolean)['join']('\x0a'),
    )
    ['filter'](Boolean)
    ['join']('\x0a\x0a')
    ['slice'](0x0, MAX_SOURCE_CHARACTERS);
}
function getSpokenText(_0x15c2d5 = {}) {
  return [_0x15c2d5?.['dialogue'], _0x15c2d5?.['voiceover']]
    ['map'](normalizeText)
    ['filter'](Boolean)
    ['join']('\x0a');
}
export function inspectStoryEpisodeSplitLocalSignals({ clips: clips = [] } = {}) {
  const _0x58f413 = [];
  return (
    (Array['isArray'](clips) ? clips : [])['forEach']((_0x41859e) => {
      const _0x472699 = normalizeText(_0x41859e?.['ref']),
        _0xd9911d = Array['isArray'](_0x41859e?.['shots']) ? _0x41859e['shots'] : [],
        _0x478384 = _0xd9911d['reduce'](
          (_0x311a61, _0xe30ce3) => _0x311a61 + Math['max'](0x0, Number(_0xe30ce3?.['durationSec']) || 0x0),
          0x0,
        ),
        _0xc7b5e8 = Math['max'](0x0, Number(_0x41859e?.['durationSec']) || 0x0);
      (Math['abs'](_0x478384 - _0xc7b5e8) > 0.11 &&
        _0x58f413['push']({
          clipRef: _0x472699,
          code: 'duration_sum_mismatch',
          message:
            '片段时长\x20' + _0xc7b5e8 + ' 秒与镜头合计 ' + Number(_0x478384['toFixed'](0x1)) + ' 秒不一致',
        }),
        _0xd9911d['forEach']((_0x5eed08, _0x377807) => {
          const _0xdf7e05 = getSpokenText(_0x5eed08),
            _0x46c872 = countStorySpokenUnits(_0xdf7e05),
            _0x52d96 = Math['max'](0x0, Number(_0x5eed08?.['durationSec']) || 0x0),
            _0x36ceb9 = _0x52d96 ? _0x46c872 / _0x52d96 : 0x0;
          _0x46c872 >= 0x8 &&
            _0x36ceb9 > MAX_SPOKEN_UNITS_PER_SECOND &&
            _0x58f413['push']({
              clipRef: _0x472699,
              shotIndex: _0x377807,
              code: 'dialogue_timing_suspicious',
              message:
                '镜头\x20' +
                (_0x377807 + 0x1) +
                ' 约 ' +
                Number(_0x36ceb9['toFixed'](0x1)) +
                ' 字/词每秒，需结合语气与表演复核',
            });
        }));
    }),
    _0x58f413
  );
}
function getBlockingStoryEpisodeSplitLocalSignals(_0x95eeb6 = []) {
  return (Array['isArray'](_0x95eeb6) ? _0x95eeb6 : [])['filter']((_0x488406) =>
    BLOCKING_LOCAL_SIGNAL_CODES['has'](normalizeText(_0x488406?.['code'])),
  );
}
function getStoryEpisodeSplitLocalRepairInstruction(_0x573d01 = {}) {
  if (_0x573d01['code']?.['startsWith']('replication_speech_')) return REPLICATION_SPEECH_INTEGRITY_GUIDANCE;
  if (['replication_shot_boundary_missing', 'replication_shot_internal_cut']['includes'](_0x573d01['code']))
    return REPLICATION_SHOT_GUIDANCE;
  if (_0x573d01['code'] === 'replication_shot_coverage_missing')
    return (
      REPLICATION_SHOT_GUIDANCE +
      '\x20对照本段原片镜头补全独立\x20shots，保持\x20clip\x20引用、来源区间和总时长；不要只改写\x20camera\x20或增加‘随后’来假装完成拆镜。'
    );
  if (_0x573d01['code'] === 'replication_duration_extreme') return REPLICATION_TIMELINE_RULE;
  if (_0x573d01['code'] === 'replication_shot_collapsed')
    return '保持本片段总时长、原话、人物绑定和动作顺序；仅将混在一个\x20shot\x20中的动作、切镜及多轮问答拆成连续时间区间的\x20shots，每镜就地放对应人声，跨镜人声在起始镜头完整保留一次及声音时间。不要新建\x20clip，不加剧情，不机械均分秒数。';
  return _0x573d01?.['code'] === 'dialogue_timing_suspicious'
    ? '拆成足够多个连续片段或镜头，为完整对白保留自然说话时间；禁止删改对白或依靠高速口播。'
    : '修正片段与镜头的时长分项，使片段总时长等于全部镜头时长之和。';
}
function applyBlockingLocalSignalsToAssessments(_0x4a6e15 = [], _0x134152 = []) {
  const _0x582cb0 = new Map();
  return (
    getBlockingStoryEpisodeSplitLocalSignals(_0x134152)['forEach']((_0x15a209) => {
      const _0x5a1f85 = normalizeText(_0x15a209?.['clipRef']);
      if (!_0x5a1f85) return;
      const _0x3d3984 = _0x582cb0['get'](_0x5a1f85) || [];
      (_0x3d3984['push'](_0x15a209), _0x582cb0['set'](_0x5a1f85, _0x3d3984));
    }),
    _0x4a6e15['map']((_0x51f2d8) => {
      const _0x3fab99 = _0x582cb0['get'](normalizeText(_0x51f2d8?.['clipRef'])) || [];
      if (!_0x3fab99['length']) return _0x51f2d8;
      const _0x18e830 = Array['isArray'](_0x51f2d8?.['issues']) ? [..._0x51f2d8['issues']] : [];
      return (
        _0x3fab99['forEach']((_0x417782) => {
          const _0x48ee1a = normalizeText(_0x417782?.['message']);
          if (
            _0x18e830['some'](
              (_0x25cf5a) => _0x25cf5a?.['code'] === _0x417782['code'] && _0x25cf5a?.['reason'] === _0x48ee1a,
            )
          )
            return;
          _0x18e830['push']({
            code: normalizeText(_0x417782?.['code']),
            reason: _0x48ee1a,
            repairInstruction: getStoryEpisodeSplitLocalRepairInstruction(_0x417782),
          });
        }),
        { ..._0x51f2d8, verdict: 'repair', issues: _0x18e830 }
      );
    })
  );
}
function assertStoryEpisodeSplitLocalTiming(
  _0x194bb8 = [],
  _0x61abdb = inspectStoryEpisodeSplitLocalSignals,
) {
  const _0x266f69 = getBlockingStoryEpisodeSplitLocalSignals(_0x61abdb({ clips: _0x194bb8 }));
  if (!_0x266f69['length']) return _0x194bb8;
  const _0x580e1d = new Error(
    _0x266f69['map']((_0x15141c) => normalizeText(_0x15141c?.['message']))
      ['filter'](Boolean)
      ['join']('；'),
  );
  _0x580e1d['code'] = 'STORY_LOCAL_TIMING';
  throw _0x580e1d;
}
function getStoryEpisodeSplitSpokenTimingBudget(_0x2155b2 = {}, _0x46fd82 = 0x0) {
  const _0x228486 = (Array['isArray'](_0x2155b2?.['shots']) ? _0x2155b2['shots'] : [])['reduce'](
    (_0x2afe45, _0x545115) =>
      _0x2afe45 +
      countStorySpokenUnits(
        [normalizeText(_0x545115?.['dialogue']), normalizeText(_0x545115?.['voiceover'])]
          ['filter'](Boolean)
          ['join']('\x0a'),
      ),
    0x0,
  );
  if (!_0x228486) return null;
  const _0x59c5b0 = Math['ceil']((_0x228486 / MAX_SPOKEN_UNITS_PER_SECOND) * 0xa) / 0xa;
  return {
    spokenUnits: _0x228486,
    maxSpokenUnitsPerSecond: MAX_SPOKEN_UNITS_PER_SECOND,
    minimumSpokenDurationSeconds: _0x59c5b0,
    minimumClipCountForSpokenContent: _0x46fd82 ? Math['max'](0x1, Math['ceil'](_0x59c5b0 / _0x46fd82)) : 0x1,
  };
}
function compactClip(_0x2cbffe = {}) {
  return {
    ref: normalizeText(_0x2cbffe['ref']),
    script: normalizeText(_0x2cbffe['script']),
    durationSec: Number(_0x2cbffe['durationSec']) || 0x0,
    shots: (Array['isArray'](_0x2cbffe['shots']) ? _0x2cbffe['shots'] : [])['map'](
      (_0x360f98, _0x184487) => ({
        index: _0x184487 + 0x1,
        ...replicationVisualFields(_0x360f98),
        durationSec: Number(_0x360f98?.['durationSec']) || 0x0,
        ...(Number['isFinite'](_0x360f98?.['startSec']) ? { startSec: _0x360f98['startSec'] } : {}),
        ...(Number['isFinite'](_0x360f98?.['endSec']) ? { endSec: _0x360f98['endSec'] } : {}),
        assetUsages: Array['isArray'](_0x360f98?.['assetUsages']) ? _0x360f98['assetUsages'] : [],
        assetRefs: Array['isArray'](_0x360f98?.['assetRefs']) ? _0x360f98['assetRefs'] : [],
        visual: normalizeText(_0x360f98?.['visual']),
        camera: normalizeText(_0x360f98?.['camera']),
        dialogue: normalizeText(_0x360f98?.['dialogue']),
        voiceover: normalizeText(_0x360f98?.['voiceover']),
        audio: normalizeText(_0x360f98?.['audio']),
      }),
    ),
  };
}
function compactAssets(_0x2d3a0b = [], _0x352c53 = [], _0x57fb02 = '') {
  const _0x214b19 = new Set(
      _0x352c53['flatMap']((_0x1382d9) =>
        Array['isArray'](_0x1382d9?.['assetRefs']) ? _0x1382d9['assetRefs'] : [],
      ),
    ),
    _0x101c00 = normalizeText(_0x57fb02);
  return (Array['isArray'](_0x2d3a0b) ? _0x2d3a0b : [])
    ['filter'](
      (_0x1fc554) =>
        _0x214b19['has'](normalizeText(_0x1fc554?.['ref'])) ||
        _0x101c00['includes'](normalizeText(_0x1fc554?.['ref'])) ||
        _0x101c00['includes'](normalizeText(_0x1fc554?.['name'])),
    )
    ['map']((_0x429d8e) => ({
      ref: normalizeText(_0x429d8e?.['ref']),
      name: normalizeText(_0x429d8e?.['name']),
      kind: normalizeText(_0x429d8e?.['kind']),
      description: normalizeText(_0x429d8e?.['description']),
      occurrences: normalizeText(_0x429d8e?.['occurrences']),
      sourceChapterIds: (Array['isArray'](_0x429d8e?.['sourceChapterIds'])
        ? _0x429d8e['sourceChapterIds']
        : [])
        ['map'](normalizeText)
        ['filter'](Boolean),
      appearances: (Array['isArray'](_0x429d8e?.['appearances']) ? _0x429d8e['appearances'] : [])['map'](
        (_0x4fbf5f) => ({
          ref: normalizeText(_0x4fbf5f?.['ref']),
          name: normalizeText(_0x4fbf5f?.['name']),
          description: normalizeText(_0x4fbf5f?.['description']),
          occurrences: normalizeText(_0x4fbf5f?.['occurrences']),
          sourceChapterIds: (Array['isArray'](_0x4fbf5f?.['sourceChapterIds'])
            ? _0x4fbf5f['sourceChapterIds']
            : [])
            ['map'](normalizeText)
            ['filter'](Boolean),
        }),
      ),
    }));
}
function createBatches(_0x304e28, _0x1393ea) {
  const _0x79e738 = [];
  for (let _0xba3f63 = 0x0; _0xba3f63 < _0x304e28['length']; _0xba3f63 += _0x1393ea) {
    const _0x364778 = _0x304e28['slice'](_0xba3f63, _0xba3f63 + _0x1393ea);
    _0x79e738['push']({
      ref: 'quality-batch-' + (_0x79e738['length'] + 0x1),
      startIndex: _0xba3f63,
      clipRefs: _0x364778['map']((_0x23cd55) => _0x23cd55['ref']),
    });
  }
  return _0x79e738;
}
function buildReviewPrompt({
  episodeRef: _0x330295,
  episode: _0x22a95b,
  batchRef: _0x2c9582,
  clips: _0x53928b,
  neighboringClips: _0x83a84d,
  assets: _0x2141ca,
  localSignals: _0xae3efd,
  phase: _0xaeebfe,
  constraints: _0x2ac748,
}) {
  const _0x336a03 = Math['max'](0x0, Number(_0x2ac748?.['sceneMaxSeconds']) || 0x0);
  return JSON['stringify']({
    task: 'review_story_episode_split_quality',
    ...buildVideoReplicationSpeechReviewContext(_0x22a95b),
    schemaVersion: STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION,
    phase: _0xaeebfe,
    episodeRef: _0x330295,
    batchRef: _0x2c9582,
    episode: {
      title: normalizeText(_0x22a95b?.['title']),
      synopsis: normalizeText(_0x22a95b?.['synopsis']),
      sourceScript: getEpisodeSource(_0x22a95b),
    },
    clips: _0x53928b['map'](compactClip),
    neighboringClips: _0x83a84d['map'](compactClip),
    assets: compactAssets(_0x2141ca, [..._0x53928b, ..._0x83a84d]),
    localSignals: _0xae3efd,
    productionLimits: { maxClipDurationSeconds: _0x336a03 },
    criteria: [
      ...STORY_ASSET_REFERENCE_RULES,
      '逐项核对原剧本信息是否遗漏、重复、乱序或被改写成相反含义。',
      '对白必须与原文一致；按人物语气、停顿和表演判断镜头时间是否足够，不使用固定字数公式直接定罪。',
      '动作、情绪反应和运镜必须能在各镜头\x20durationSec\x20内自然完成；一个镜头需要\x2015\x20秒时，15\x20秒就是正确的。',
      '检查相邻片段的地点、人物状态、道具、动作起止和视线是否连续。',
      '检查画面、摄影、声音和资产引用是否与当前剧情一致且可执行。',
      '人物资产只应绑定画面中实际可见的角色；仅在对白、语音、电话、名单、记录、照片文字或他人口述中被提及的人物，不得作为出镜人物资产绑定。',
      '人物已在前一片段或前一镜头明确离场时，后续镜头不得继续绑定其人物资产，除非原剧本明确让其重新入镜。',
      '选择\x20appearanceRef\x20时必须核对形象的\x20description、occurrences\x20与\x20sourceChapterIds，尤其区分回忆、当前时间、受伤和换装状态。',
      _0x336a03
        ? '单个片段不得超过 ' +
          _0x336a03 +
          ' 秒；需要更多时间时，修复建议必须要求拆成多个连续片段，禁止建议把单片段延长到上限之外。'
        : '如果当前任务没有单片段时长上限，按剧情实际需要判断。',
      '禁止以片段数量或整集总时长作为问题；只点名有明确证据的片段。',
    ],
    outputContract:
      "episodeRef,batchRef,assessments[{clipRef,verdict:'pass'|'repair',issues[{code,reason,repairInstruction}]}]；每个输入片段恰好返回一次",
  });
}
function getNeighboringClips(_0x252cbe, _0x3e2498, _0x5d8641, _0x58b2a5 = new Map()) {
  const _0xea5de = (_0x5a0eaa, _0x309321) => {
    if (!_0x5a0eaa) return null;
    const _0x811c23 = _0x58b2a5['get'](normalizeText(_0x5a0eaa['ref']));
    if (!Array['isArray'](_0x811c23) || !_0x811c23['length']) return _0x5a0eaa;
    return _0x309321 === 'left' ? _0x811c23['at'](-0x1) : _0x811c23[0x0];
  };
  return [
    _0xea5de(_0x3e2498 > 0x0 ? _0x252cbe[_0x3e2498 - 0x1] : null, 'left'),
    _0xea5de(_0x3e2498 + _0x5d8641 < _0x252cbe['length'] ? _0x252cbe[_0x3e2498 + _0x5d8641] : null, 'right'),
  ]['filter'](Boolean);
}
function buildRepairPrompt({
  episodeRef: _0x25c02e,
  episode: _0x122ddd,
  failedClips: _0x2e89ba,
  assessments: _0x59ac3f,
  neighbors: _0x39c836,
  assets: _0x318313,
  constraints: _0x22df7c,
  repairRound: repairRound = 0x1,
  previousErrorsByRef: previousErrorsByRef = {},
  previousClipsByRef: previousClipsByRef = {},
}) {
  const _0x3454f8 = new Map(_0x59ac3f['map']((_0x26489b) => [_0x26489b['clipRef'], _0x26489b])),
    _0x57f972 = getStoryEpisodeClipGroupingRequirements(_0x22df7c?.['promptMode']),
    _0xcb1152 = getStoryEpisodePromptModePlanningRequirements(_0x22df7c?.['promptMode']),
    _0x18776c = isStoryContinuousTimelinePromptMode(_0x22df7c?.['promptMode']),
    _0x201c0a = Math['max'](0x0, Number(_0x22df7c?.['sceneMaxSeconds']) || 0x0),
    _0x5daeb9 = Object['values'](previousClipsByRef || {})['flatMap']((_0x56a62c) =>
      Array['isArray'](_0x56a62c) ? _0x56a62c : [],
    ),
    _0x1630c1 = compactAssets(
      _0x318313,
      [..._0x2e89ba, ..._0x5daeb9, ..._0x39c836],
      JSON['stringify'](_0x59ac3f),
    );
  return JSON['stringify']({
    task: 'repair_story_episode_split_quality',
    ...buildVideoReplicationSpeechReviewContext(_0x122ddd),
    schemaVersion: STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION,
    episodeRef: _0x25c02e,
    repairRound: repairRound,
    episode: { title: normalizeText(_0x122ddd?.['title']), sourceScript: getEpisodeSource(_0x122ddd) },
    failedClips: _0x2e89ba['map']((_0x3fc51e) => {
      const _0xeb239b = getStoryEpisodeSplitSpokenTimingBudget(_0x3fc51e, _0x201c0a);
      return {
        sourceClipRef: _0x3fc51e['ref'],
        issues: _0x3454f8['get'](_0x3fc51e['ref'])?.['issues'] || [],
        ...(_0xeb239b ? { timingBudget: _0xeb239b } : {}),
        ...(normalizeText(previousErrorsByRef?.[_0x3fc51e['ref']])
          ? { previousAttemptError: normalizeText(previousErrorsByRef[_0x3fc51e['ref']]) }
          : {}),
        ...(Array['isArray'](previousClipsByRef?.[_0x3fc51e['ref']])
          ? { previousAttemptClips: previousClipsByRef[_0x3fc51e['ref']]['map'](compactClip) }
          : {}),
        clip: compactClip(_0x3fc51e),
      };
    }),
    readOnlyNeighboringClips: _0x39c836['map'](compactClip),
    assets: _0x1630c1,
    productionLimits: {
      maxClipDurationSeconds: _0x201c0a,
      maxSpokenUnitsPerSecond: MAX_SPOKEN_UNITS_PER_SECOND,
    },
    instruction: [
      ...STORY_ASSET_REFERENCE_RULES,
      '只修复 failedClips，禁止返回或改写已经通过的片段。',
      '修复依据是原剧本与审片问题；时长按对白、动作、情绪和镜头实际需要重新分配。',
      '完整保留原片段中仍然有效的 assetUsages 与 appearanceRef；新增引用严格遵守 allowedAssetReferences。',
      '只给画面中实际可见的人物绑定人物资产；仅通过语音、电话、名单、记录、文字或他人口述被提及，或已经明确离场的人物，必须移除其人物资产引用。',
      '必须根据 assets.appearances 的 description、occurrences 与 sourceChapterIds 选择符合当前时间线和状态的 appearanceRef，禁止猜测不存在的形象 ID。',
      '一个失败片段可重写为一个或多个片段；若拆分，使用 sourceClipRef-part-1、sourceClipRef-part-2 等唯一 ref。',
      ..._0xcb1152,
      ...(_0x57f972['length']
        ? [
            '修复结果的每个 clip 用 startsNewNarrativeBeat 标记是否开始新的独立叙事阶段：换场、时间跳跃或剧情阶段结束后开始新阶段时为 true；同一段连续对话中的换说话人、切镜头或因时长上限续段为 false。',
          ]
        : []),
      repairRound > 0x1
        ? '这是定点重试。必须先解决 failedClips.previousAttemptError 指出的上一轮校验或复审错误，禁止原样重复上一轮结果。'
        : '这是第一轮定点修复。',
      _0x201c0a
        ? '每个修复后片段不得超过 ' + _0x201c0a + ' 秒；内容需要更长时间时必须拆分，禁止用超限延长解决。'
        : '当前任务未设置单片段时长上限。',
      '对白与旁白必须满足每个镜头不超过\x20' +
        MAX_SPOKEN_UNITS_PER_SECOND +
        ' 字/词每秒。failedClips.timingBudget 是只计算说话内容得到的最低时间与最低片段数；动作、停顿和反应还应在此基础上增加时间。',
      '保留原对白文字、剧情顺序和资产真实性。只返回严格 JSON。',
    ],
    allowedAssetReferences: buildStoryAssetReferenceContract(_0x1630c1),
    outputContract:
      'episodeRef,repairs[{sourceClipRef,clips[{ref,' +
      (_0x57f972['length'] ? 'startsNewNarrativeBeat,' : '') +
      'script,creativeIntent,transition,shots[{durationSec,' +
      (_0x18776c ? 'startSec,endSec,' : '') +
      'assetUsages:[{assetRef,appearanceRef}],assetRefs,visual,camera,dialogue,voiceover,audio}],durationSec,assetRefs}]}]',
  });
}
function normalizeResumeDraft(
  _0x39e8d2,
  { episodeRef: _0xcb0834, candidateFingerprint: _0x3b478f, batches: _0x3f4e6d },
) {
  if (
    !_0x39e8d2 ||
    Number(_0x39e8d2['schemaVersion']) !== STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION ||
    normalizeText(_0x39e8d2['episodeRef']) !== _0xcb0834 ||
    normalizeText(_0x39e8d2['candidateFingerprint']) !== _0x3b478f
  )
    return null;
  const _0x5a759c = new Map(
    (Array['isArray'](_0x39e8d2['batches']) ? _0x39e8d2['batches'] : [])['map']((_0x340b42) => [
      _0x340b42['ref'],
      _0x340b42,
    ]),
  );
  return {
    ...cloneJson(_0x39e8d2),
    batches: _0x3f4e6d['map']((_0x3f4ae4) => ({
      ..._0x3f4ae4,
      ...(cloneJson(_0x5a759c['get'](_0x3f4ae4['ref'])) || {}),
    })),
  };
}
function createDraft({ episodeRef: _0x56d442, candidateFingerprint: _0x4728f2, batches: _0x1f966e }) {
  const _0x421a77 = Date['now']();
  return {
    schemaVersion: STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION,
    episodeRef: _0x56d442,
    candidateFingerprint: _0x4728f2,
    status: 'reviewing',
    batches: _0x1f966e['map']((_0x35582f) => ({ ..._0x35582f, status: 'pending' })),
    requestCount: 0x0,
    unresolvedClipRefs: [],
    completedClips: null,
    createdAt: _0x421a77,
    updatedAt: _0x421a77,
  };
}
function createQualityReviewSummary(_0x471365 = {}) {
  const _0x596c27 = Array['isArray'](_0x471365['unresolvedClipRefs']) ? _0x471365['unresolvedClipRefs'] : [],
    _0x176661 = new Set(_0x596c27),
    _0x400376 = (Array['isArray'](_0x471365['batches']) ? _0x471365['batches'] : [])['flatMap']((_0x148add) =>
      (Array['isArray'](_0x148add?.['clipRefs']) ? _0x148add['clipRefs'] : [])
        ['filter']((_0x133d40) => _0x176661['has'](_0x133d40))
        ['map']((_0x362921) => ({
          clipRef: _0x362921,
          issues: cloneJson([
            ...((Array['isArray'](_0x148add?.['replacements']?.[_0x362921])
              ? []
              : Array['isArray'](_0x148add?.['assessments'])
                ? _0x148add['assessments']
                : [])['find']((_0x437ce1) => _0x437ce1?.['clipRef'] === _0x362921)?.['issues'] || []),
            ...[...(_0x471365['timingNotes'] || []), ...(_0x471365['contentNotes'] || [])]
              ['filter']((_0x495378) => _0x495378['clipRef'] === _0x362921)
              ['map']((_0x164d4f) => ({ code: _0x164d4f['code'], reason: _0x164d4f['message'] })),
          ]),
          error: normalizeText(
            _0x148add?.['repairErrors']?.[_0x362921] || _0x148add?.['repairError'] || _0x148add?.['error'],
          ),
        })),
    );
  return {
    status: _0x596c27['length'] ? 'completed_with_unresolved' : 'passed',
    ...(_0x471365['verificationScope'] ? { verificationScope: _0x471365['verificationScope'] } : {}),
    requestCount: Math['max'](0x0, Number(_0x471365['requestCount']) || 0x0),
    unresolvedClipRefs: cloneJson(_0x596c27),
    unresolvedItems: _0x400376,
  };
}
export async function reviewStoryEpisodeSplitQuality({
  project: project = {},
  episode: episode = {},
  result: result = {},
  assets: assets = [],
  constraints: constraints = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  request: request = generateText,
  validateClips: validateClips = ({ clips: _0x3f589b }) => _0x3f589b,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  onInvocation: onInvocation = null,
  resumeDraft: resumeDraft = null,
  batchSize: batchSize = STORY_EPISODE_SPLIT_QUALITY_BATCH_SIZE,
} = {}) {
  const _0x32782d = Array['isArray'](result?.['clips']) ? result['clips'] : [],
    _0x23384f = project['sourceMode'] === 'video-replication',
    _0x481085 = (_0x5268f7) => [
      ...inspectStoryEpisodeSplitLocalSignals(_0x5268f7)['filter'](
        (_0x10ef77) => !_0x23384f || _0x10ef77['code'] !== 'dialogue_timing_suspicious',
      ),
      ...(_0x23384f
        ? inspectReplicationSegmentTiming(_0x5268f7, episode, Number(constraints['sceneMaxSeconds']))
        : []),
    ],
    _0x5c13ff = _0x23384f ? buildVideoReplicationSourceEvidence(episode, project, assets) : null;
  assets = normalizeStoryGenerationAssetReferences(assets);
  if (!_0x32782d['length']) throw new Error('没有可审片的分镜片段。');
  const _0x19381b = new Map(
      _0x32782d['map']((_0x5dce84, _0x257031) => [normalizeText(_0x5dce84?.['ref']), _0x257031]),
    ),
    _0x2e35d8 = (_0x3af643) =>
      [..._0x3af643]['sort'](
        (_0x12bbdd, _0x26f9e5) =>
          (_0x19381b['get'](_0x12bbdd) ?? Number['MAX_SAFE_INTEGER']) -
          (_0x19381b['get'](_0x26f9e5) ?? Number['MAX_SAFE_INTEGER']),
      ),
    _0x21a5e5 = getEpisodeRef(episode, result),
    _0x191ee6 = Math['max'](0x1, Math['min'](0x14, Math['trunc'](Number(batchSize) || 0xa))),
    _0x4ba765 = createBatches(_0x32782d, _0x191ee6),
    _0xd3d5f3 = buildVideoReplicationTimingGuidance(episode),
    _0x37854f = fingerprint({
      episodeRef: _0x21a5e5,
      clips: _0x32782d,
      timingGuidance: _0xd3d5f3,
      source: getEpisodeSource(episode),
      speech: buildVideoReplicationSpeechReviewContext(episode),
      audioLanguage: getVideoReplicationAudioLanguage(episode, project),
      assets: compactAssets(
        assets,
        _0x32782d,
        JSON['stringify'](assets['map']((_0x5d9e0e) => _0x5d9e0e['ref'])),
      ),
      constraints: constraints,
      model: model,
      provider: provider,
      providerProfileId: providerProfileId,
      sourceVideoEvidence: _0x5c13ff,
      reviewPolicy: _0x23384f ? 'replication-format-timing-v8-user-review' : 'strict',
    });
  let _0x1a5a44 =
    normalizeResumeDraft(resumeDraft, {
      episodeRef: _0x21a5e5,
      candidateFingerprint: _0x37854f,
      batches: _0x4ba765,
    }) || createDraft({ episodeRef: _0x21a5e5, candidateFingerprint: _0x37854f, batches: _0x4ba765 });
  if (_0x23384f) _0x1a5a44['verificationScope'] = 'format-and-timing';
  if (_0x1a5a44['status'] === 'completed' && Array['isArray'](_0x1a5a44['completedClips']))
    return {
      ...result,
      clips: cloneJson(_0x1a5a44['completedClips']),
      totalDurationSeconds: _0x1a5a44['completedClips']['reduce'](
        (_0x52b9ae, _0x565557) => _0x52b9ae + Math['max'](0x0, Number(_0x565557?.['durationSec']) || 0x0),
        0x0,
      ),
      qualityReview: createQualityReviewSummary(_0x1a5a44),
    };
  const _0x543f87 = new Map();
  _0x1a5a44['batches']['forEach']((_0x339744) => {
    Object['entries'](_0x339744?.['replacements'] || {})['forEach'](([_0x364077, _0x1a0590]) => {
      _0x543f87['set'](_0x364077, cloneJson(_0x1a0590));
    });
  });
  const _0x5d204a = new Set(_0x1a5a44['unresolvedClipRefs'] || []);
  for (const _0x4623bc of _0x1a5a44['batches']) {
    const _0x4632a8 = Object['keys'](_0x4623bc['repairErrors'] || {});
    _0x4632a8['forEach']((_0x40e69d) => _0x5d204a['add'](_0x40e69d));
    if (_0x4632a8['length']) _0x4623bc['status'] = 'reviewed';
  }
  let _0x56bbbf = Math['max'](0x0, Number(_0x1a5a44['requestCount']) || 0x0);
  const _0x423835 = async () => {
      ((_0x1a5a44['updatedAt'] = Date['now']()),
        (_0x1a5a44['requestCount'] = _0x56bbbf),
        (_0x1a5a44['unresolvedClipRefs'] = _0x2e35d8(_0x5d204a)),
        await onCheckpoint?.(cloneJson(_0x1a5a44)));
    },
    _0x5de314 = async (_0x95aaf, _0x31cbb2) =>
      invokeCheckpointedStoryReview({
        draft: _0x1a5a44,
        key: fingerprint({
          payload: _0x95aaf,
          stepId: _0x31cbb2,
          model: model,
          provider: provider,
          providerProfileId: providerProfileId,
        }),
        checkpoint: _0x423835,
        invoke: async () => {
          return (
            (_0x56bbbf += 0x1),
            invokeStoryGenerationRequest({
              request: request,
              requestPayload: {
                model: normalizeText(model),
                provider: normalizeText(provider),
                ...buildStoryTextProviderProfilePayload(providerProfileId),
                ..._0x95aaf,
                systemPrompt: [
                  _0x95aaf['systemPrompt'],
                  _0xd3d5f3,
                  _0x23384f ? REPLICATION_SHOT_GUIDANCE : '',
                  buildVideoReplicationAudioLanguageRule(getVideoReplicationAudioLanguage(episode, project)),
                  _0x23384f
                    ? '以原片 events 和人物绑定为依据。只修明确的关键剧情遗漏、说话人错配、动作与人声脱节；轻微措辞、位置和镜头差异通过。不确定就保留，不凭常识改写原片；用户的角色替换和语言翻译不是错误。字幕仅用于理解，不要求生成屏幕字幕。'
                    : '',
                ]
                  ['filter'](Boolean)
                  ['join']('\x0a'),
                ...(_0x23384f
                  ? buildReplicationReviewRequest(_0x95aaf, _0x5c13ff, episode, constraints)
                  : {}),
                thinking: { type: 'disabled' },
                temperature: 0.1,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                timeoutMs: _0x23384f ? 0x2bf20 : REQUEST_TIMEOUT_MS,
              },
              stepId: _0x31cbb2,
              attempt: _0x56bbbf,
              onInvocation: onInvocation,
              serializeResponse: getResultText,
            })
          );
        },
      }),
    _0x3cf1f0 = (_0x312dd4, _0x3fa21b) =>
      requestStoryReviewOutput({
        payload: _0x312dd4,
        stepId: _0x3fa21b,
        draft: _0x1a5a44,
        checkpoint: _0x423835,
        invoke: _0x5de314,
        onProgress: onProgress,
        key: fingerprint({
          payload: _0x312dd4,
          stepId: _0x3fa21b,
          model: model,
          provider: provider,
          providerProfileId: providerProfileId,
        }),
      });
  for (let _0x257944 = 0x0; _0x257944 < _0x1a5a44['batches']['length']; _0x257944 += 0x1) {
    const _0xed692f = _0x1a5a44['batches'][_0x257944];
    if (_0xed692f['status'] === 'completed') continue;
    const _0x615307 = _0x32782d['slice'](
        _0xed692f['startIndex'],
        _0xed692f['startIndex'] + _0xed692f['clipRefs']['length'],
      ),
      _0x4f9d0f = getNeighboringClips(_0x32782d, _0xed692f['startIndex'], _0x615307['length'], _0x543f87),
      _0x574938 = _0x481085({ clips: _0x615307 });
    onProgress?.({
      stage: 'reviewing-episode-split-quality',
      current: _0x257944 + 0x1,
      total: _0x1a5a44['batches']['length'],
      message: _0x23384f
        ? '正在检查格式与时间 ' + (_0x257944 + 0x1) + '/' + _0x1a5a44['batches']['length']
        : '正在审片 ' + (_0x257944 + 0x1) + '/' + _0x1a5a44['batches']['length'] + '，检查剧情、时长与连续性',
    });
    let _0xbc29f7 =
      _0xed692f['status'] === 'reviewed' && Array['isArray'](_0xed692f['assessments'])
        ? _0xed692f['assessments']
        : null;
    try {
      if (!_0xbc29f7) {
        const _0x1a74a0 = _0x23384f
          ? JSON['stringify']({
              episodeRef: _0x21a5e5,
              batchRef: _0xed692f['ref'],
              assessments: _0x615307['map']((_0x290803) => ({
                clipRef: _0x290803['ref'],
                verdict: 'pass',
                issues: [],
              })),
            })
          : await _0x3cf1f0(
              {
                prompt: buildReviewPrompt({
                  episodeRef: _0x21a5e5,
                  episode: episode,
                  batchRef: _0xed692f['ref'],
                  clips: _0x615307,
                  neighboringClips: _0x4f9d0f,
                  assets: assets,
                  localSignals: _0x574938,
                  phase: 'initial-review',
                  constraints: constraints,
                }),
                systemPrompt: REVIEW_SYSTEM_PROMPT,
              },
              'quality-review:' + _0xed692f['ref'],
            );
        ((_0xbc29f7 = applyBlockingLocalSignalsToAssessments(
          parseReviewResponse(_0x1a74a0, {
            episodeRef: _0x21a5e5,
            batchRef: _0xed692f['ref'],
            clipRefs: _0xed692f['clipRefs'],
          }),
          _0x574938,
        )),
          (_0xed692f['assessments'] = _0xbc29f7),
          (_0xed692f['status'] = 'reviewed'),
          _0xed692f['clipRefs']['forEach']((_0x5ebaae) => _0x5d204a['delete'](_0x5ebaae)),
          delete _0xed692f['error'],
          await _0x423835());
      }
    } catch (_0x111521) {
      if (_0x111521['storyReviewInterrupted']) throw _0x111521;
      ((_0xed692f['status'] = 'completed'),
        (_0xed692f['error'] = normalizeText(_0x111521?.['message'] || _0x111521)),
        _0xed692f['clipRefs']['forEach']((_0x3fbba3) => _0x5d204a['add'](_0x3fbba3)),
        await _0x423835());
      continue;
    }
    const _0x119082 = _0xbc29f7['filter'](
      (_0x20b3aa) => _0x20b3aa['verdict'] === 'repair' && !_0xed692f['replacements']?.[_0x20b3aa['clipRef']],
    )
      ['filter']((_0xa26d31) => {
        if (
          !_0x23384f ||
          !_0xa26d31['issues']?.['length'] ||
          !_0xa26d31['issues']['every']((_0xb510a2) => /^replication_shot_/u['test'](_0xb510a2['code']))
        )
          return !![];
        const _0x2a886f = _0x615307['find']((_0x46d389) => _0x46d389['ref'] === _0xa26d31['clipRef']);
        if (!inspectReplicationSourceCompleteness({ clips: [_0x2a886f] }, episode)['length']) return !![];
        return (_0x5d204a['add'](_0xa26d31['clipRef']), ![]);
      })
      ['map']((_0x1ad584) => _0x1ad584['clipRef']);
    if (!_0x119082['length']) {
      ((_0xed692f['status'] = 'completed'), (_0xed692f['replacements'] ||= {}), await _0x423835());
      continue;
    }
    const _0x5ed758 = _0x615307['filter']((_0x27ee61) => _0x119082['includes'](_0x27ee61['ref']));
    onProgress?.({
      stage: 'repairing-episode-split-quality',
      current: _0x257944 + 0x1,
      total: _0x1a5a44['batches']['length'],
      message: '正在定点修复 ' + _0x5ed758['length'] + ' 个未通过片段',
    });
    try {
      const _0x1906c4 = getStoryRepairResumeCandidates(_0xed692f, _0x119082, project, constraints),
        _0x461c9a = await requestStoryReviewRepairs({
          failedClips: _0x5ed758['filter']((_0x55016f) => !_0x1906c4[_0x55016f['ref']]),
          invoke: _0x3cf1f0,
          stepId: 'quality-repair:' + _0xed692f['ref'],
          parseResponse: (_0x3f4006, _0x735b6c) =>
            parseRepairResponse(_0x3f4006, { episodeRef: _0x21a5e5, failedClipRefs: _0x735b6c }),
          buildPrompt: (_0x4b4915) =>
            buildRepairPrompt({
              episodeRef: _0x21a5e5,
              episode: episode,
              failedClips: _0x4b4915,
              assessments: _0xbc29f7,
              neighbors: _0x4f9d0f,
              assets: assets,
              constraints: constraints,
              previousErrorsByRef: _0xed692f['repairErrors'],
              previousClipsByRef: _0xed692f['attemptedClips'],
            }),
          systemPrompt: '你是分镜定点修复师。只处理被点名的失败片段，绝不改写已通过片段。只返回严格 JSON。',
        });
      for (const _0x36c689 of _0x119082) {
        if (_0x1906c4[_0x36c689]) _0x461c9a['set'](_0x36c689, cloneJson(_0x1906c4[_0x36c689]));
      }
      const _0x4cf909 = new Map(),
        _0x320777 = {},
        _0x19fb8d = {},
        _0x28fe30 = cloneJson(_0xed692f['attemptedClips'] || {}),
        _0xb76471 = async (_0x4f8aa6, _0xfdc12c) => {
          for (const _0x4a506a of _0xfdc12c) {
            try {
              const _0xf31d1c = _0x4f8aa6['get'](_0x4a506a);
              if (!Array['isArray'](_0xf31d1c) || !_0xf31d1c['length'])
                throw new Error('修复结果遗漏片段 ' + _0x4a506a + '。');
              _0x28fe30[_0x4a506a] = cloneJson(_0xf31d1c);
              if (_0x23384f)
                assertReplicationRepairTiming(
                  _0xf31d1c,
                  _0x5ed758['find']((_0x6c1bd6) => _0x6c1bd6['ref'] === _0x4a506a),
                  episode,
                  constraints,
                );
              const _0x427168 = await validateStoryRepairTiming({
                validateClips: validateClips,
                episodeRef: _0x21a5e5,
                sourceClipRef: _0x4a506a,
                clips: _0xf31d1c,
                project: project,
                episode: episode,
                assets: assets,
                constraints: constraints,
              });
              if (!Array['isArray'](_0x427168) || !_0x427168['length'])
                throw new Error('片段 ' + _0x4a506a + ' 的修复结果未通过本地结构校验。');
              if (_0x23384f)
                assertReplicationRepairTiming(
                  _0x427168,
                  _0x5ed758['find']((_0x4969b5) => _0x4969b5['ref'] === _0x4a506a),
                  episode,
                  constraints,
                );
              (assertStoryEpisodeSplitLocalTiming(_0x427168, _0x481085),
                _0x4cf909['set'](_0x4a506a, _0x427168),
                delete _0x320777[_0x4a506a],
                delete _0x19fb8d[_0x4a506a],
                _0x5d204a['delete'](_0x4a506a));
            } catch (_0x1062d1) {
              ((_0x320777[_0x4a506a] = normalizeText(_0x1062d1?.['message'] || _0x1062d1)),
                (_0x19fb8d[_0x4a506a] = _0x1062d1['code'] || 'STRUCTURE'),
                _0x5d204a['add'](_0x4a506a));
            }
          }
        },
        _0x12e8ac = { ...(_0xed692f['replacements'] || {}) },
        _0x278bac = [];
      let _0x588faa = [..._0x119082],
        _0x4907e8 = _0x461c9a,
        _0x1d18c5 = 'initial';
      const _0x4012d3 = _0x23384f ? 0x1 : 0x3;
      for (let _0x59607f = 0x1; _0x59607f <= _0x4012d3 && _0x588faa['length']; _0x59607f += 0x1) {
        if (_0x59607f > 0x1) {
          const _0x2dc9cd = _0x5ed758['filter']((_0x2991be) => _0x588faa['includes'](_0x2991be['ref']));
          try {
            _0x4907e8 = await requestStoryReviewRepairs({
              failedClips: _0x2dc9cd,
              invoke: _0x3cf1f0,
              stepId: 'quality-repair:' + _0xed692f['ref'] + ':round-' + _0x59607f + ':' + _0x1d18c5,
              parseResponse: (_0x4e4b1d, _0x4d7439) =>
                parseRepairResponse(_0x4e4b1d, { episodeRef: _0x21a5e5, failedClipRefs: _0x4d7439 }),
              buildPrompt: (_0xc94086) =>
                buildRepairPrompt({
                  episodeRef: _0x21a5e5,
                  episode: episode,
                  failedClips: _0xc94086,
                  assessments: _0xbc29f7,
                  neighbors: _0x4f9d0f,
                  assets: assets,
                  constraints: constraints,
                  repairRound: _0x59607f,
                  previousErrorsByRef: _0x320777,
                  previousClipsByRef: _0x28fe30,
                }),
              systemPrompt:
                '你是分镜定点修复师。根据上一轮精确错误只重修被点名的失败片段，绝不改写已通过片段。只返回严格 JSON。',
            });
          } catch (_0x544fa2) {
            if (_0x544fa2['storyReviewInterrupted']) throw _0x544fa2;
            const _0x34d50a = normalizeText(_0x544fa2?.['message'] || _0x544fa2);
            _0x588faa['forEach']((_0xbdb5f0) => {
              ((_0x320777[_0xbdb5f0] = _0x34d50a),
                (_0x19fb8d[_0xbdb5f0] = 'REPAIR_RESPONSE'),
                _0x5d204a['add'](_0xbdb5f0));
            });
            break;
          }
        }
        (_0x588faa['forEach']((_0x4a1bda) => _0x4cf909['delete'](_0x4a1bda)),
          await _0xb76471(_0x4907e8, _0x588faa));
        const _0x391218 = _0x588faa['filter']((_0xbe9649) => !_0x4cf909['has'](_0xbe9649)),
          _0x599f1f = _0x588faa['filter']((_0x162d16) => _0x4cf909['has'](_0x162d16)),
          _0x17b799 = [..._0x391218];
        let _0x179fc3 = ![];
        if (_0x599f1f['length']) {
          const _0x3b453f = _0x599f1f['flatMap']((_0x4640ef) => _0x4cf909['get'](_0x4640ef) || []),
            _0x1efeae = _0xed692f['ref'] + '-repair-recheck' + (_0x59607f > 0x1 ? '-' + _0x59607f : '');
          try {
            const _0x1e9b5c = _0x23384f
                ? JSON['stringify']({
                    episodeRef: _0x21a5e5,
                    batchRef: _0x1efeae,
                    assessments: _0x3b453f['map']((_0x58a9ae) => ({
                      clipRef: _0x58a9ae['ref'],
                      verdict: 'pass',
                      issues: [],
                    })),
                  })
                : await _0x3cf1f0(
                    {
                      prompt: buildReviewPrompt({
                        episodeRef: _0x21a5e5,
                        episode: episode,
                        batchRef: _0x1efeae,
                        clips: _0x3b453f,
                        neighboringClips: [
                          ..._0x4f9d0f,
                          ..._0x615307['filter']((_0x35c2d2) => !_0x599f1f['includes'](_0x35c2d2['ref']))[
                            'flatMap'
                          ]((_0x8db18f) => _0x543f87['get'](_0x8db18f['ref']) || [_0x8db18f]),
                        ],
                        assets: assets,
                        localSignals: _0x481085({ clips: _0x3b453f }),
                        phase: 'repair-recheck',
                        constraints: constraints,
                      }),
                      systemPrompt: REVIEW_SYSTEM_PROMPT,
                    },
                    'quality-recheck:' + _0xed692f['ref'] + (_0x59607f > 0x1 ? ':round-' + _0x59607f : ''),
                  ),
              _0x2d7709 = applyBlockingLocalSignalsToAssessments(
                parseReviewResponse(_0x1e9b5c, {
                  episodeRef: _0x21a5e5,
                  batchRef: _0x1efeae,
                  clipRefs: _0x3b453f['map']((_0x39f632) => _0x39f632['ref']),
                }),
                _0x481085({ clips: _0x3b453f }),
              );
            _0x278bac['push'](cloneJson(_0x2d7709));
            if (_0x59607f === 0x1) _0xed692f['recheck'] = cloneJson(_0x2d7709);
            const _0x3e113e = new Map(_0x2d7709['map']((_0x56e307) => [_0x56e307['clipRef'], _0x56e307]));
            _0x599f1f['forEach']((_0x4d1278) => {
              if (_0xed692f['pendingRecheck']) delete _0xed692f['pendingRecheck'][_0x4d1278];
              const _0x5d1590 = _0x4cf909['get'](_0x4d1278) || [];
              _0x28fe30[_0x4d1278] = cloneJson(_0x5d1590);
              const _0x2d4b9b = _0x5d1590['map']((_0x555eb8) =>
                _0x3e113e['get'](normalizeText(_0x555eb8?.['ref'])),
              )['filter']((_0x3fe2e2) => _0x3fe2e2?.['verdict'] === 'repair');
              if (_0x2d4b9b['length']) {
                ((_0x19fb8d[_0x4d1278] = _0x2d4b9b['every'](
                  (_0x333ffd) =>
                    _0x333ffd['issues']['length'] &&
                    _0x333ffd['issues']['every']((_0x2e09c8) =>
                      BLOCKING_LOCAL_SIGNAL_CODES['has'](_0x2e09c8['code']),
                    ),
                )
                  ? 'STORY_LOCAL_TIMING'
                  : 'CONTENT'),
                  (_0x320777[_0x4d1278] =
                    _0x2d4b9b['flatMap']((_0xbe9613) => _0xbe9613['issues'])
                      ['map']((_0x1246e5) => _0x1246e5['reason'] || _0x1246e5['repairInstruction'])
                      ['filter'](Boolean)
                      ['join']('；') || '定点修复结果复审仍未通过。'),
                  _0x5d204a['add'](_0x4d1278),
                  _0x17b799['push'](_0x4d1278),
                  (_0x179fc3 = !![]));
                return;
              }
              ((_0x12e8ac[_0x4d1278] = cloneJson(_0x5d1590)),
                _0x543f87['set'](_0x4d1278, cloneJson(_0x5d1590)),
                delete _0x320777[_0x4d1278],
                delete _0x19fb8d[_0x4d1278],
                _0x5d204a['delete'](_0x4d1278));
            });
          } catch (_0x5ce682) {
            if (_0x5ce682['storyReviewInterrupted']) throw _0x5ce682;
            const _0x518521 = normalizeText(_0x5ce682?.['message'] || _0x5ce682);
            (_0x599f1f['forEach']((_0x3e02c7) => {
              (_0x5ce682['code'] === 'STORY_REVIEW_PROTOCOL' &&
                ((_0xed692f['pendingRecheck'] ||= {}),
                (_0xed692f['pendingRecheck'][_0x3e02c7] = cloneJson(_0x4cf909['get'](_0x3e02c7)))),
                (_0x320777[_0x3e02c7] = _0x518521),
                (_0x19fb8d[_0x3e02c7] = 'REVIEW_RESPONSE'),
                _0x5d204a['add'](_0x3e02c7),
                _0x17b799['push'](_0x3e02c7));
            }),
              (_0x179fc3 = !![]));
            if (_0x5ce682['code'] === 'STORY_REVIEW_PROTOCOL') break;
          }
        }
        ((_0x588faa = [...new Set(_0x17b799)]),
          (_0x1d18c5 =
            _0x391218['length'] && _0x179fc3 ? 'mixed' : _0x391218['length'] ? 'validation' : 'recheck'));
      }
      (_0x278bac['length'] > 0x1 && (_0xed692f['recheckRounds'] = _0x278bac),
        (_0xed692f['replacements'] = _0x12e8ac),
        (_0xed692f['repairErrors'] = _0x320777),
        (_0xed692f['repairErrorCodes'] = _0x19fb8d),
        (_0xed692f['attemptedClips'] = _0x28fe30),
        (_0xed692f['status'] = 'completed'),
        await _0x423835());
    } catch (_0x2834fa) {
      if (_0x2834fa['storyReviewInterrupted']) throw _0x2834fa;
      ((_0xed692f['status'] = 'completed'),
        (_0xed692f['repairError'] = normalizeText(_0x2834fa?.['message'] || _0x2834fa)),
        _0x119082['forEach']((_0x4978c4) => _0x5d204a['add'](_0x4978c4)),
        await _0x423835());
    }
  }
  let _0x4e5741 = _0x32782d['flatMap']((_0x2e51cf) =>
    _0x543f87['has'](_0x2e51cf['ref']) ? _0x543f87['get'](_0x2e51cf['ref']) : [_0x2e51cf],
  );
  const _0xa61d8 = _0x4e5741['map']((_0x315821) => normalizeText(_0x315821?.['ref']));
  if (_0xa61d8['some']((_0x1d52fe) => !_0x1d52fe) || new Set(_0xa61d8)['size'] !== _0xa61d8['length'])
    throw new Error('审片修复后出现空片段引用或重复片段引用，未提交修复结果。');
  let _0x32d5f1 = getBlockingStoryEpisodeSplitLocalSignals(_0x481085({ clips: _0x4e5741 }));
  if (_0x23384f) _0x1a5a44['contentNotes'] = [];
  if (
    _0x32d5f1['length'] &&
    !_0x23384f &&
    !isStoryContinuousTimelinePromptMode(constraints?.['promptMode'])
  ) {
    const _0x440858 = normalizeStoryEpisodeSpokenTiming(_0x4e5741, {
        maxClipDurationSeconds: Math['max'](0x0, Number(constraints?.['sceneMaxSeconds']) || 0x0),
        maxSpokenUnitsPerSecond: MAX_SPOKEN_UNITS_PER_SECOND,
      }),
      _0x3ef061 = getBlockingStoryEpisodeSplitLocalSignals(
        inspectStoryEpisodeSplitLocalSignals({ clips: _0x440858 }),
      );
    if (!_0x3ef061['length']) {
      ((_0x4e5741 = _0x440858), (_0x32d5f1 = []));
      for (const _0x63600d of _0x1a5a44['batches']) {
        for (const _0x197fa0 of _0x63600d['assessments'] || []) {
          _0x63600d['repairErrorCodes']?.[_0x197fa0['clipRef']] === 'STORY_LOCAL_TIMING' &&
            _0x197fa0['issues']?.['length'] &&
            _0x197fa0['issues']['every']((_0x472895) =>
              BLOCKING_LOCAL_SIGNAL_CODES['has'](_0x472895['code']),
            ) &&
            (_0x5d204a['delete'](_0x197fa0['clipRef']),
            delete _0x63600d['repairErrors'][_0x197fa0['clipRef']],
            delete _0x63600d['repairErrorCodes'][_0x197fa0['clipRef']]);
        }
      }
    }
  }
  if (_0x32d5f1['length']) {
    const _0x179590 = new Set(
      _0x32d5f1['map']((_0x2b972b) => normalizeText(_0x2b972b?.['clipRef']))['filter'](Boolean),
    );
    (_0x179590['forEach']((_0x119a5a) => _0x5d204a['add'](_0x119a5a)),
      (_0x1a5a44['status'] = 'failed_retryable'),
      (_0x1a5a44['completedClips'] = null),
      (_0x1a5a44['batches'] = _0x1a5a44['batches']['map']((_0xaa19c2) =>
        (Array['isArray'](_0xaa19c2?.['clipRefs']) ? _0xaa19c2['clipRefs'] : [])['some']((_0xde2bb2) =>
          _0x179590['has'](_0xde2bb2),
        )
          ? { ..._0xaa19c2, status: 'pending' }
          : _0xaa19c2,
      )),
      await _0x423835());
    throw new Error(
      _0x23384f
        ? '片段\x20' +
            [..._0x179590]['join']('、') +
            ' 局部修复后仍有明显' +
            (_0x32d5f1['some']((_0x518d73) => /replication_(?:shot|speech)_/u['test'](_0x518d73['code']))
              ? '分镜结构异常或人声异常'
              : '时长异常') +
            '，候选结果已保留，未提交。'
        : '片段 ' + [..._0x179590]['join']('、') + ' 的对白或镜头时长仍无法自然说完，未提交分镜结果。',
    );
  }
  _0x23384f && (_0x1a5a44['timingNotes'] = []);
  try {
    if (!_0x23384f) assertStoryReviewResolved(_0x1a5a44, _0x5d204a);
  } catch (_0x5b75ae) {
    await _0x423835();
    throw _0x5b75ae;
  }
  return (
    (_0x1a5a44['status'] = 'completed'),
    (_0x1a5a44['responses'] = {}),
    (_0x1a5a44['completedClips'] = cloneJson(_0x4e5741)),
    await _0x423835(),
    {
      ...result,
      clips: _0x4e5741,
      totalDurationSeconds: _0x4e5741['reduce'](
        (_0x542954, _0x16be57) => _0x542954 + Math['max'](0x0, Number(_0x16be57?.['durationSec']) || 0x0),
        0x0,
      ),
      qualityReview: createQualityReviewSummary(_0x1a5a44),
    }
  );
}
