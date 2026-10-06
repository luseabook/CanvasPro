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
export const STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION = 4;
export const STORY_EPISODE_SPLIT_QUALITY_BATCH_SIZE = 10;
const MAX_SOURCE_CHARACTERS = 36000,
  MAX_OUTPUT_TOKENS = 12000,
  REQUEST_TIMEOUT_MS = 8 * 60 * 1000,
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
    '只根据给出的原剧本、候选片段和邻接关系判定；没有明确问题就通过。只返回严格 JSON。',
    '每项 reason 和 repairInstruction 各不超过 80 字，只写问题结论与修改动作，不复述台词、不复制 JSON、不输出推理过程；字符串内部若含 ASCII 双引号必须按 JSON 转义。',
  ].join('\n');
function normalizeText(value) {
  return String(value || '').trim();
}
function cloneJson(item) {
  if (item == null) return item;
  return JSON.parse(JSON.stringify(item));
}
function stableSerialize(list) {
  if (Array.isArray(list)) return '[' + list.map(stableSerialize).join(',') + ']';
  if (list && typeof list === 'object')
    return (
      '{' +
      Object.keys(list)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + stableSerialize(list[key]))
        .join(',') +
      '}'
    );
  return JSON.stringify(list ?? null);
}
function fingerprint(index) {
  const list2 = stableSerialize(index);
  let data = 0x811c9dc5;
  for (let options = 0; options < list2.length; options += 1) {
    ((data ^= list2.charCodeAt(options)), (data = Math.imul(data, 0x1000193)));
  }
  return 'fnv1a-' + (data >>> 0).toString(16).padStart(8, '0');
}
function getEpisodeRef(options2 = {}, target = {}) {
  return (
    normalizeText(
      target?.episodeRef || options2?.ref || options2?.planningRef || options2?.id,
    ) || 'episode-1'
  );
}
function getEpisodeSource(options3 = {}) {
  const list3 = normalizeText(options3?.script?.fullText);
  if (list3) return list3.slice(0, MAX_SOURCE_CHARACTERS);
  return (Array.isArray(options3?.script?.scenes) ? options3.script.scenes : [])
    .map((dom) =>
      [dom?.heading, dom?.body].map(normalizeText).filter(Boolean).join('\n'),
    )
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_SOURCE_CHARACTERS);
}
function getSpokenText(options4 = {}) {
  return [options4?.dialogue, options4?.voiceover]
    .map(normalizeText)
    .filter(Boolean)
    .join('\n');
}
export function inspectStoryEpisodeSplitLocalSignals({ clips: clips = [] } = {}) {
  const list4 = [];
  return (
    (Array.isArray(clips) ? clips : []).forEach((source) => {
      const clipRef = normalizeText(source?.ref),
        list5 = Array.isArray(source?.shots) ? source.shots : [],
        next = list5.reduce(
          (current, entry) => current + Math.max(0, Number(entry?.durationSec) || 0),
          0,
        ),
        record = Math.max(0, Number(source?.durationSec) || 0);
      (Math.abs(next - record) > 0.11 &&
        list4.push({
          clipRef: clipRef,
          code: 'duration_sum_mismatch',
          message: '片段时长 ' + record + ' 秒与镜头合计 ' + Number(next.toFixed(1)) + ' 秒不一致',
        }),
        list5.forEach((payload, shotIndex) => {
          const spokenText = getSpokenText(payload),
            countStorySpokenUnits2 = countStorySpokenUnits(spokenText),
            handle = Math.max(0, Number(payload?.durationSec) || 0),
            state = handle ? countStorySpokenUnits2 / handle : 0;
          countStorySpokenUnits2 >= 8 &&
            state > MAX_SPOKEN_UNITS_PER_SECOND &&
            list4.push({
              clipRef: clipRef,
              shotIndex: shotIndex,
              code: 'dialogue_timing_suspicious',
              message:
                '镜头 ' +
                (shotIndex + 1) +
                ' 约 ' +
                Number(state.toFixed(1)) +
                ' 字/词每秒，需结合语气与表演复核',
            });
        }));
    }),
    list4
  );
}
function getBlockingStoryEpisodeSplitLocalSignals(list6 = []) {
  return (Array.isArray(list6) ? list6 : []).filter((config) =>
    BLOCKING_LOCAL_SIGNAL_CODES.has(normalizeText(config?.code)),
  );
}
function getStoryEpisodeSplitLocalRepairInstruction(options5 = {}) {
  if (options5.code?.startsWith('replication_speech_')) return REPLICATION_SPEECH_INTEGRITY_GUIDANCE;
  if (['replication_shot_boundary_missing', 'replication_shot_internal_cut'].includes(options5.code))
    return REPLICATION_SHOT_GUIDANCE;
  if (options5.code === 'replication_shot_coverage_missing')
    return (
      REPLICATION_SHOT_GUIDANCE +
      ' 对照本段原片镜头补全独立 shots，保持 clip 引用、来源区间和总时长；不要只改写 camera 或增加‘随后’来假装完成拆镜。'
    );
  if (options5.code === 'replication_duration_extreme') return REPLICATION_TIMELINE_RULE;
  if (options5.code === 'replication_shot_collapsed')
    return '保持本片段总时长、原话、人物绑定和动作顺序；仅将混在一个 shot 中的动作、切镜及多轮问答拆成连续时间区间的 shots，每镜就地放对应人声，跨镜人声在起始镜头完整保留一次及声音时间。不要新建 clip，不加剧情，不机械均分秒数。';
  return options5?.code === 'dialogue_timing_suspicious'
    ? '拆成足够多个连续片段或镜头，为完整对白保留自然说话时间；禁止删改对白或依靠高速口播。'
    : '修正片段与镜头的时长分项，使片段总时长等于全部镜头时长之和。';
}
function applyBlockingLocalSignalsToAssessments(list7 = [], scope = []) {
  const map = new Map();
  return (
    getBlockingStoryEpisodeSplitLocalSignals(scope).forEach((input) => {
      const text = normalizeText(input?.clipRef);
      if (!text) return;
      const list8 = map.get(text) || [];
      (list8.push(input), map.set(text, list8));
    }),
    list7.map((args) => {
      const list9 = map.get(normalizeText(args?.clipRef)) || [];
      if (!list9.length) return args;
      const issues = Array.isArray(args?.issues) ? [...args.issues] : [];
      return (
        list9.forEach((error) => {
          const reason = normalizeText(error?.message);
          if (issues.some((output) => output?.code === error.code && output?.reason === reason))
            return;
          issues.push({
            code: normalizeText(error?.code),
            reason: reason,
            repairInstruction: getStoryEpisodeSplitLocalRepairInstruction(error),
          });
        }),
        { ...args, verdict: 'repair', issues: issues }
      );
    })
  );
}
function assertStoryEpisodeSplitLocalTiming(clips2 = [], handler = inspectStoryEpisodeSplitLocalSignals) {
  const list10 = getBlockingStoryEpisodeSplitLocalSignals(handler({ clips: clips2 }));
  if (!list10.length) return clips2;
  const error2 = new Error(
    list10.map((error3) => normalizeText(error3?.message))
      .filter(Boolean)
      .join('；'),
  );
  error2.code = 'STORY_LOCAL_TIMING';
  throw error2;
}
function getStoryEpisodeSplitSpokenTimingBudget(options6 = {}, minimumClipCountForSpokenContent = 0) {
  const spokenUnits = (Array.isArray(options6?.shots) ? options6.shots : []).reduce(
    (value2, value3) =>
      value2 +
      countStorySpokenUnits(
        [normalizeText(value3?.dialogue), normalizeText(value3?.voiceover)]
          .filter(Boolean)
          .join('\n'),
      ),
    0,
  );
  if (!spokenUnits) return null;
  const minimumSpokenDurationSeconds = Math.ceil((spokenUnits / MAX_SPOKEN_UNITS_PER_SECOND) * 10) / 10;
  return {
    spokenUnits: spokenUnits,
    maxSpokenUnitsPerSecond: MAX_SPOKEN_UNITS_PER_SECOND,
    minimumSpokenDurationSeconds: minimumSpokenDurationSeconds,
    minimumClipCountForSpokenContent: minimumClipCountForSpokenContent
      ? Math.max(1, Math.ceil(minimumSpokenDurationSeconds / minimumClipCountForSpokenContent))
      : 1,
  };
}
function compactClip(options7 = {}) {
  return {
    ref: normalizeText(options7.ref),
    script: normalizeText(options7.script),
    durationSec: Number(options7.durationSec) || 0,
    shots: (Array.isArray(options7.shots) ? options7.shots : []).map((startSec, index2) => ({
      index: index2 + 1,
      ...replicationVisualFields(startSec),
      durationSec: Number(startSec?.durationSec) || 0,
      ...(Number.isFinite(startSec?.startSec) ? { startSec: startSec.startSec } : {}),
      ...(Number.isFinite(startSec?.endSec) ? { endSec: startSec.endSec } : {}),
      assetUsages: Array.isArray(startSec?.assetUsages) ? startSec.assetUsages : [],
      assetRefs: Array.isArray(startSec?.assetRefs) ? startSec.assetRefs : [],
      visual: normalizeText(startSec?.visual),
      camera: normalizeText(startSec?.camera),
      dialogue: normalizeText(startSec?.dialogue),
      voiceover: normalizeText(startSec?.voiceover),
      audio: normalizeText(startSec?.audio),
    })),
  };
}
function compactAssets(list11 = [], list12 = [], value4 = '') {
  const map2 = new Set(
      list12.flatMap((value5) => (Array.isArray(value5?.assetRefs) ? value5.assetRefs : [])),
    ),
    list13 = normalizeText(value4);
  return (Array.isArray(list11) ? list11 : [])
    .filter(
      (error4) =>
        map2.has(normalizeText(error4?.ref)) ||
        list13.includes(normalizeText(error4?.ref)) ||
        list13.includes(normalizeText(error4?.name)),
    )
    .map((error5) => ({
      ref: normalizeText(error5?.ref),
      name: normalizeText(error5?.name),
      kind: normalizeText(error5?.kind),
      description: normalizeText(error5?.description),
      occurrences: normalizeText(error5?.occurrences),
      sourceChapterIds: (Array.isArray(error5?.sourceChapterIds) ? error5.sourceChapterIds : [])
        .map(normalizeText)
        .filter(Boolean),
      appearances: (Array.isArray(error5?.appearances) ? error5.appearances : []).map(
        (error6) => ({
          ref: normalizeText(error6?.ref),
          name: normalizeText(error6?.name),
          description: normalizeText(error6?.description),
          occurrences: normalizeText(error6?.occurrences),
          sourceChapterIds: (Array.isArray(error6?.sourceChapterIds) ? error6.sourceChapterIds : [])
            .map(normalizeText)
            .filter(Boolean),
        }),
      ),
    }));
}
function createBatches(list14, value6) {
  const list15 = [];
  for (let startIndex = 0; startIndex < list14.length; startIndex += value6) {
    const clipRefs = list14.slice(startIndex, startIndex + value6);
    list15.push({
      ref: 'quality-batch-' + (list15.length + 1),
      startIndex: startIndex,
      clipRefs: clipRefs.map((value7) => value7.ref),
    });
  }
  return list15;
}
function buildReviewPrompt({
  episodeRef: episodeRef,
  episode: episode2,
  batchRef: batchRef,
  clips: clips3,
  neighboringClips: neighboringClips,
  assets: assets2,
  localSignals: localSignals,
  phase: phase,
  constraints: constraints2,
}) {
  const maxClipDurationSeconds = Math.max(0, Number(constraints2?.sceneMaxSeconds) || 0);
  return JSON.stringify({
    task: 'review_story_episode_split_quality',
    ...buildVideoReplicationSpeechReviewContext(episode2),
    schemaVersion: STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION,
    phase: phase,
    episodeRef: episodeRef,
    batchRef: batchRef,
    episode: {
      title: normalizeText(episode2?.title),
      synopsis: normalizeText(episode2?.synopsis),
      sourceScript: getEpisodeSource(episode2),
    },
    clips: clips3.map(compactClip),
    neighboringClips: neighboringClips.map(compactClip),
    assets: compactAssets(assets2, [...clips3, ...neighboringClips]),
    localSignals: localSignals,
    productionLimits: { maxClipDurationSeconds: maxClipDurationSeconds },
    criteria: [
      ...STORY_ASSET_REFERENCE_RULES,
      '逐项核对原剧本信息是否遗漏、重复、乱序或被改写成相反含义。',
      '对白必须与原文一致；按人物语气、停顿和表演判断镜头时间是否足够，不使用固定字数公式直接定罪。',
      '动作、情绪反应和运镜必须能在各镜头 durationSec 内自然完成；一个镜头需要 15 秒时，15 秒就是正确的。',
      '检查相邻片段的地点、人物状态、道具、动作起止和视线是否连续。',
      '检查画面、摄影、声音和资产引用是否与当前剧情一致且可执行。',
      '人物资产只应绑定画面中实际可见的角色；仅在对白、语音、电话、名单、记录、照片文字或他人口述中被提及的人物，不得作为出镜人物资产绑定。',
      '人物已在前一片段或前一镜头明确离场时，后续镜头不得继续绑定其人物资产，除非原剧本明确让其重新入镜。',
      '选择 appearanceRef 时必须核对形象的 description、occurrences 与 sourceChapterIds，尤其区分回忆、当前时间、受伤和换装状态。',
      maxClipDurationSeconds
        ? '单个片段不得超过 ' +
          maxClipDurationSeconds +
          ' 秒；需要更多时间时，修复建议必须要求拆成多个连续片段，禁止建议把单片段延长到上限之外。'
        : '如果当前任务没有单片段时长上限，按剧情实际需要判断。',
      '禁止以片段数量或整集总时长作为问题；只点名有明确证据的片段。',
    ],
    outputContract:
      "episodeRef,batchRef,assessments[{clipRef,verdict:'pass'|'repair',issues[{code,reason,repairInstruction}]}]；每个输入片段恰好返回一次",
  });
}
function getNeighboringClips(list16, count, value8, map3 = new Map()) {
  const run = (enabled, value9) => {
    if (!enabled) return null;
    const list17 = map3.get(normalizeText(enabled.ref));
    if (!Array.isArray(list17) || !list17.length) return enabled;
    return value9 === 'left' ? list17.at(-1) : list17[0];
  };
  return [
    run(count > 0 ? list16[count - 1] : null, 'left'),
    run(count + value8 < list16.length ? list16[count + value8] : null, 'right'),
  ].filter(Boolean);
}
function buildRepairPrompt({
  episodeRef: episodeRef2,
  episode: episode3,
  failedClips: failedClips,
  assessments: assessments,
  neighbors: neighbors,
  assets: assets3,
  constraints: constraints3,
  repairRound: repairRound = 1,
  previousErrorsByRef: previousErrorsByRef = {},
  previousClipsByRef: previousClipsByRef = {},
}) {
  const issues2 = new Map(assessments.map((value10) => [value10.clipRef, value10])),
    list18 = getStoryEpisodeClipGroupingRequirements(constraints3?.promptMode),
    args2 = getStoryEpisodePromptModePlanningRequirements(constraints3?.promptMode),
    isStoryContinuousTimelinePromptMode2 = isStoryContinuousTimelinePromptMode(constraints3?.promptMode),
    maxClipDurationSeconds2 = Math.max(0, Number(constraints3?.sceneMaxSeconds) || 0),
    args3 = Object.values(previousClipsByRef || {}).flatMap((value11) =>
      Array.isArray(value11) ? value11 : [],
    ),
    assets4 = compactAssets(
      assets3,
      [...failedClips, ...args3, ...neighbors],
      JSON.stringify(assessments),
    );
  return JSON.stringify({
    task: 'repair_story_episode_split_quality',
    ...buildVideoReplicationSpeechReviewContext(episode3),
    schemaVersion: STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION,
    episodeRef: episodeRef2,
    repairRound: repairRound,
    episode: { title: normalizeText(episode3?.title), sourceScript: getEpisodeSource(episode3) },
    failedClips: failedClips.map((sourceClipRef) => {
      const timingBudget = getStoryEpisodeSplitSpokenTimingBudget(sourceClipRef, maxClipDurationSeconds2);
      return {
        sourceClipRef: sourceClipRef.ref,
        issues: issues2.get(sourceClipRef.ref)?.issues || [],
        ...(timingBudget ? { timingBudget: timingBudget } : {}),
        ...(normalizeText(previousErrorsByRef?.[sourceClipRef.ref])
          ? { previousAttemptError: normalizeText(previousErrorsByRef[sourceClipRef.ref]) }
          : {}),
        ...(Array.isArray(previousClipsByRef?.[sourceClipRef.ref])
          ? { previousAttemptClips: previousClipsByRef[sourceClipRef.ref].map(compactClip) }
          : {}),
        clip: compactClip(sourceClipRef),
      };
    }),
    readOnlyNeighboringClips: neighbors.map(compactClip),
    assets: assets4,
    productionLimits: {
      maxClipDurationSeconds: maxClipDurationSeconds2,
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
      ...args2,
      ...(list18.length
        ? [
            '修复结果的每个 clip 用 startsNewNarrativeBeat 标记是否开始新的独立叙事阶段：换场、时间跳跃或剧情阶段结束后开始新阶段时为 true；同一段连续对话中的换说话人、切镜头或因时长上限续段为 false。',
          ]
        : []),
      repairRound > 1
        ? '这是定点重试。必须先解决 failedClips.previousAttemptError 指出的上一轮校验或复审错误，禁止原样重复上一轮结果。'
        : '这是第一轮定点修复。',
      maxClipDurationSeconds2
        ? '每个修复后片段不得超过 ' +
          maxClipDurationSeconds2 +
          ' 秒；内容需要更长时间时必须拆分，禁止用超限延长解决。'
        : '当前任务未设置单片段时长上限。',
      '对白与旁白必须满足每个镜头不超过 ' +
        MAX_SPOKEN_UNITS_PER_SECOND +
        ' 字/词每秒。failedClips.timingBudget 是只计算说话内容得到的最低时间与最低片段数；动作、停顿和反应还应在此基础上增加时间。',
      '保留原对白文字、剧情顺序和资产真实性。只返回严格 JSON。',
    ],
    allowedAssetReferences: buildStoryAssetReferenceContract(assets4),
    outputContract:
      'episodeRef,repairs[{sourceClipRef,clips[{ref,' +
      (list18.length ? 'startsNewNarrativeBeat,' : '') +
      'script,creativeIntent,transition,shots[{durationSec,' +
      (isStoryContinuousTimelinePromptMode2 ? 'startSec,endSec,' : '') +
      'assetUsages:[{assetRef,appearanceRef}],assetRefs,visual,camera,dialogue,voiceover,audio}],durationSec,assetRefs}]}]',
  });
}
function normalizeResumeDraft(
  enabled2,
  { episodeRef: episodeRef3, candidateFingerprint: candidateFingerprint, batches: batches },
) {
  if (
    !enabled2 ||
    Number(enabled2.schemaVersion) !== STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION ||
    normalizeText(enabled2.episodeRef) !== episodeRef3 ||
    normalizeText(enabled2.candidateFingerprint) !== candidateFingerprint
  )
    return null;
  const map4 = new Map(
    (Array.isArray(enabled2.batches) ? enabled2.batches : []).map((value12) => [
      value12.ref,
      value12,
    ]),
  );
  return {
    ...cloneJson(enabled2),
    batches: batches.map((args4) => ({
      ...args4,
      ...(cloneJson(map4.get(args4.ref)) || {}),
    })),
  };
}
function createDraft({
  episodeRef: episodeRef4,
  candidateFingerprint: candidateFingerprint2,
  batches: batches2,
}) {
  const createdAt = Date.now();
  return {
    schemaVersion: STORY_EPISODE_SPLIT_QUALITY_SCHEMA_VERSION,
    episodeRef: episodeRef4,
    candidateFingerprint: candidateFingerprint2,
    status: 'reviewing',
    batches: batches2.map((args5) => ({ ...args5, status: 'pending' })),
    requestCount: 0,
    unresolvedClipRefs: [],
    completedClips: null,
    createdAt: createdAt,
    updatedAt: createdAt,
  };
}
function createQualityReviewSummary(verificationScope = {}) {
  const status = Array.isArray(verificationScope.unresolvedClipRefs)
      ? verificationScope.unresolvedClipRefs
      : [],
    map5 = new Set(status),
    unresolvedItems = (Array.isArray(verificationScope.batches) ? verificationScope.batches : []).flatMap((value13) =>
      (Array.isArray(value13?.clipRefs) ? value13.clipRefs : [])
        .filter((value14) => map5.has(value14))
        .map((clipRef2) => ({
          clipRef: clipRef2,
          issues: cloneJson([
            ...((Array.isArray(value13?.replacements?.[clipRef2])
              ? []
              : Array.isArray(value13?.assessments)
                ? value13.assessments
                : []).find((value15) => value15?.clipRef === clipRef2)?.issues || []),
            ...[...(verificationScope.timingNotes || []), ...(verificationScope.contentNotes || [])]
              .filter((value16) => value16.clipRef === clipRef2)
              .map((code) => ({ code: code.code, reason: code.message })),
          ]),
          error: normalizeText(
            value13?.repairErrors?.[clipRef2] || value13?.repairError || value13?.error,
          ),
        })),
    );
  return {
    status: status.length ? 'completed_with_unresolved' : 'passed',
    ...(verificationScope.verificationScope
      ? { verificationScope: verificationScope.verificationScope }
      : {}),
    requestCount: Math.max(0, Number(verificationScope.requestCount) || 0),
    unresolvedClipRefs: cloneJson(status),
    unresolvedItems: unresolvedItems,
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
  validateClips: validateClips = ({ clips: clips4 }) => clips4,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  onInvocation: onInvocation = null,
  resumeDraft: resumeDraft = null,
  batchSize: batchSize = STORY_EPISODE_SPLIT_QUALITY_BATCH_SIZE,
} = {}) {
  const clips5 = Array.isArray(result?.clips) ? result.clips : [],
    reviewPolicy = project.sourceMode === 'video-replication',
    localSignals2 = (value17) => [
      ...inspectStoryEpisodeSplitLocalSignals(value17).filter(
        (value18) => !reviewPolicy || value18.code !== 'dialogue_timing_suspicious',
      ),
      ...(reviewPolicy
        ? inspectReplicationSegmentTiming(value17, episode, Number(constraints.sceneMaxSeconds))
        : []),
    ],
    sourceVideoEvidence = reviewPolicy ? buildVideoReplicationSourceEvidence(episode, project, assets) : null;
  assets = normalizeStoryGenerationAssetReferences(assets);
  if (!clips5.length) throw new Error('没有可审片的分镜片段。');
  const map6 = new Map(clips5.map((value19, value20) => [normalizeText(value19?.ref), value20])),
    handler2 = (args6) =>
      [...args6].sort(
        (value21, value22) =>
          (map6.get(value21) ?? Number.MAX_SAFE_INTEGER) -
          (map6.get(value22) ?? Number.MAX_SAFE_INTEGER),
      ),
    episodeRef5 = getEpisodeRef(episode, result),
    value23 = Math.max(1, Math.min(20, Math.trunc(Number(batchSize) || 10))),
    batches3 = createBatches(clips5, value23),
    timingGuidance = buildVideoReplicationTimingGuidance(episode),
    candidateFingerprint3 = fingerprint({
      episodeRef: episodeRef5,
      clips: clips5,
      timingGuidance: timingGuidance,
      source: getEpisodeSource(episode),
      speech: buildVideoReplicationSpeechReviewContext(episode),
      audioLanguage: getVideoReplicationAudioLanguage(episode, project),
      assets: compactAssets(assets, clips5, JSON.stringify(assets.map((value24) => value24.ref))),
      constraints: constraints,
      model: model,
      provider: provider,
      providerProfileId: providerProfileId,
      sourceVideoEvidence: sourceVideoEvidence,
      reviewPolicy: reviewPolicy ? 'replication-format-timing-v8-user-review' : 'strict',
    });
  let totalDurationSeconds =
    normalizeResumeDraft(resumeDraft, {
      episodeRef: episodeRef5,
      candidateFingerprint: candidateFingerprint3,
      batches: batches3,
    }) ||
    createDraft({ episodeRef: episodeRef5, candidateFingerprint: candidateFingerprint3, batches: batches3 });
  if (reviewPolicy) totalDurationSeconds.verificationScope = 'format-and-timing';
  if (
    totalDurationSeconds.status === 'completed' &&
    Array.isArray(totalDurationSeconds.completedClips)
  )
    return {
      ...result,
      clips: cloneJson(totalDurationSeconds.completedClips),
      totalDurationSeconds: totalDurationSeconds.completedClips.reduce(
        (value25, value26) => value25 + Math.max(0, Number(value26?.durationSec) || 0),
        0,
      ),
      qualityReview: createQualityReviewSummary(totalDurationSeconds),
    };
  const map7 = new Map();
  totalDurationSeconds.batches.forEach((value27) => {
    Object.entries(value27?.replacements || {}).forEach(([value28, value29]) => {
      map7.set(value28, cloneJson(value29));
    });
  });
  const map8 = new Set(totalDurationSeconds.unresolvedClipRefs || []);
  for (const response of totalDurationSeconds.batches) {
    const list19 = Object.keys(response.repairErrors || {});
    list19.forEach((value30) => map8.add(value30));
    if (list19.length) response.status = 'reviewed';
  }
  let attempt = Math.max(0, Number(totalDurationSeconds.requestCount) || 0);
  const checkpoint = async () => {
      ((totalDurationSeconds.updatedAt = Date.now()),
        (totalDurationSeconds.requestCount = attempt),
        (totalDurationSeconds.unresolvedClipRefs = handler2(map8)),
        await onCheckpoint?.(cloneJson(totalDurationSeconds)));
    },
    invoke = async (payload2, stepId) =>
      invokeCheckpointedStoryReview({
        draft: totalDurationSeconds,
        key: fingerprint({
          payload: payload2,
          stepId: stepId,
          model: model,
          provider: provider,
          providerProfileId: providerProfileId,
        }),
        checkpoint: checkpoint,
        invoke: async () => {
          return (
            (attempt += 1),
            invokeStoryGenerationRequest({
              request: request,
              requestPayload: {
                model: normalizeText(model),
                provider: normalizeText(provider),
                ...buildStoryTextProviderProfilePayload(providerProfileId),
                ...payload2,
                systemPrompt: [
                  payload2.systemPrompt,
                  timingGuidance,
                  reviewPolicy ? REPLICATION_SHOT_GUIDANCE : '',
                  buildVideoReplicationAudioLanguageRule(getVideoReplicationAudioLanguage(episode, project)),
                  reviewPolicy
                    ? '以原片 events 和人物绑定为依据。只修明确的关键剧情遗漏、说话人错配、动作与人声脱节；轻微措辞、位置和镜头差异通过。不确定就保留，不凭常识改写原片；用户的角色替换和语言翻译不是错误。字幕仅用于理解，不要求生成屏幕字幕。'
                    : '',
                ]
                  .filter(Boolean)
                  .join('\n'),
                ...(reviewPolicy
                  ? buildReplicationReviewRequest(payload2, sourceVideoEvidence, episode, constraints)
                  : {}),
                thinking: { type: 'disabled' },
                temperature: 0.1,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                timeoutMs: reviewPolicy ? 180000 : REQUEST_TIMEOUT_MS,
              },
              stepId: stepId,
              attempt: attempt,
              onInvocation: onInvocation,
              serializeResponse: getResultText,
            })
          );
        },
      }),
    invoke2 = (payload3, stepId2) =>
      requestStoryReviewOutput({
        payload: payload3,
        stepId: stepId2,
        draft: totalDurationSeconds,
        checkpoint: checkpoint,
        invoke: invoke,
        onProgress: onProgress,
        key: fingerprint({
          payload: payload3,
          stepId: stepId2,
          model: model,
          provider: provider,
          providerProfileId: providerProfileId,
        }),
      });
  for (let current2 = 0; current2 < totalDurationSeconds.batches.length; current2 += 1) {
    const batchRef2 = totalDurationSeconds.batches[current2];
    if (batchRef2.status === 'completed') continue;
    const clips6 = clips5.slice(
        batchRef2.startIndex,
        batchRef2.startIndex + batchRef2.clipRefs.length,
      ),
      neighboringClips2 = getNeighboringClips(clips5, batchRef2.startIndex, clips6.length, map7),
      localSignals3 = localSignals2({ clips: clips6 });
    onProgress?.({
      stage: 'reviewing-episode-split-quality',
      current: current2 + 1,
      total: totalDurationSeconds.batches.length,
      message: reviewPolicy
        ? '正在检查格式与时间 ' + (current2 + 1) + '/' + totalDurationSeconds.batches.length
        : '正在审片 ' +
          (current2 + 1) +
          '/' +
          totalDurationSeconds.batches.length +
          '，检查剧情、时长与连续性',
    });
    let assessments2 =
      batchRef2.status === 'reviewed' && Array.isArray(batchRef2.assessments)
        ? batchRef2.assessments
        : null;
    try {
      if (!assessments2) {
        const value31 = reviewPolicy
          ? JSON.stringify({
              episodeRef: episodeRef5,
              batchRef: batchRef2.ref,
              assessments: clips6.map((clipRef3) => ({
                clipRef: clipRef3.ref,
                verdict: 'pass',
                issues: [],
              })),
            })
          : await invoke2(
              {
                prompt: buildReviewPrompt({
                  episodeRef: episodeRef5,
                  episode: episode,
                  batchRef: batchRef2.ref,
                  clips: clips6,
                  neighboringClips: neighboringClips2,
                  assets: assets,
                  localSignals: localSignals3,
                  phase: 'initial-review',
                  constraints: constraints,
                }),
                systemPrompt: REVIEW_SYSTEM_PROMPT,
              },
              'quality-review:' + batchRef2.ref,
            );
        ((assessments2 = applyBlockingLocalSignalsToAssessments(
          parseReviewResponse(value31, {
            episodeRef: episodeRef5,
            batchRef: batchRef2.ref,
            clipRefs: batchRef2.clipRefs,
          }),
          localSignals3,
        )),
          (batchRef2.assessments = assessments2),
          (batchRef2.status = 'reviewed'),
          batchRef2.clipRefs.forEach((value32) => map8.delete(value32)),
          delete batchRef2.error,
          await checkpoint());
      }
    } catch (error7) {
      if (error7.storyReviewInterrupted) throw error7;
      ((batchRef2.status = 'completed'),
        (batchRef2.error = normalizeText(error7?.message || error7)),
        batchRef2.clipRefs.forEach((value33) => map8.add(value33)),
        await checkpoint());
      continue;
    }
    const list20 = assessments2.filter(
      (value34) => value34.verdict === 'repair' && !batchRef2.replacements?.[value34.clipRef],
    )
      .filter((enabled3) => {
        if (
          !reviewPolicy ||
          !enabled3.issues?.length ||
          !enabled3.issues.every((value35) => /^replication_shot_/u.test(value35.code))
        )
          return true;
        const value36 = clips6.find((value37) => value37.ref === enabled3.clipRef);
        if (!inspectReplicationSourceCompleteness({ clips: [value36] }, episode).length) return true;
        return (map8.add(enabled3.clipRef), false);
      })
      .map((value38) => value38.clipRef);
    if (!list20.length) {
      ((batchRef2.status = 'completed'), (batchRef2.replacements ||= {}), await checkpoint());
      continue;
    }
    const failedClips2 = clips6.filter((value39) => list20.includes(value39.ref));
    onProgress?.({
      stage: 'repairing-episode-split-quality',
      current: current2 + 1,
      total: totalDurationSeconds.batches.length,
      message: '正在定点修复 ' + failedClips2.length + ' 个未通过片段',
    });
    try {
      const storyRepairResumeCandidates = getStoryRepairResumeCandidates(
          batchRef2,
          list20,
          project,
          constraints,
        ),
        map9 = await requestStoryReviewRepairs({
          failedClips: failedClips2.filter((value40) => !storyRepairResumeCandidates[value40.ref]),
          invoke: invoke2,
          stepId: 'quality-repair:' + batchRef2.ref,
          parseResponse: (value41, failedClipRefs) =>
            parseRepairResponse(value41, { episodeRef: episodeRef5, failedClipRefs: failedClipRefs }),
          buildPrompt: (failedClips3) =>
            buildRepairPrompt({
              episodeRef: episodeRef5,
              episode: episode,
              failedClips: failedClips3,
              assessments: assessments2,
              neighbors: neighboringClips2,
              assets: assets,
              constraints: constraints,
              previousErrorsByRef: batchRef2.repairErrors,
              previousClipsByRef: batchRef2.attemptedClips,
            }),
          systemPrompt: '你是分镜定点修复师。只处理被点名的失败片段，绝不改写已通过片段。只返回严格 JSON。',
        });
      for (const value42 of list20) {
        if (storyRepairResumeCandidates[value42])
          map9.set(value42, cloneJson(storyRepairResumeCandidates[value42]));
      }
      const map10 = new Map(),
        previousErrorsByRef2 = {},
        value43 = {},
        previousClipsByRef2 = cloneJson(batchRef2.attemptedClips || {}),
        handler3 = async (map11, value44) => {
          for (const sourceClipRef2 of value44) {
            try {
              const clips7 = map11.get(sourceClipRef2);
              if (!Array.isArray(clips7) || !clips7.length)
                throw new Error('修复结果遗漏片段 ' + sourceClipRef2 + '。');
              previousClipsByRef2[sourceClipRef2] = cloneJson(clips7);
              if (reviewPolicy)
                assertReplicationRepairTiming(
                  clips7,
                  failedClips2.find((value45) => value45.ref === sourceClipRef2),
                  episode,
                  constraints,
                );
              const list21 = await validateStoryRepairTiming({
                validateClips: validateClips,
                episodeRef: episodeRef5,
                sourceClipRef: sourceClipRef2,
                clips: clips7,
                project: project,
                episode: episode,
                assets: assets,
                constraints: constraints,
              });
              if (!Array.isArray(list21) || !list21.length)
                throw new Error('片段 ' + sourceClipRef2 + ' 的修复结果未通过本地结构校验。');
              if (reviewPolicy)
                assertReplicationRepairTiming(
                  list21,
                  failedClips2.find((value46) => value46.ref === sourceClipRef2),
                  episode,
                  constraints,
                );
              (assertStoryEpisodeSplitLocalTiming(list21, localSignals2),
                map10.set(sourceClipRef2, list21),
                delete previousErrorsByRef2[sourceClipRef2],
                delete value43[sourceClipRef2],
                map8.delete(sourceClipRef2));
            } catch (error8) {
              ((previousErrorsByRef2[sourceClipRef2] = normalizeText(error8?.message || error8)),
                (value43[sourceClipRef2] = error8.code || 'STRUCTURE'),
                map8.add(sourceClipRef2));
            }
          }
        },
        value47 = { ...(batchRef2.replacements || {}) },
        list22 = [];
      let list23 = [...list20],
        requestStoryReviewRepairs2 = map9,
        value48 = 'initial';
      const value49 = reviewPolicy ? 1 : 3;
      for (let repairRound2 = 1; repairRound2 <= value49 && list23.length; repairRound2 += 1) {
        if (repairRound2 > 1) {
          const failedClips4 = failedClips2.filter((value50) => list23.includes(value50.ref));
          try {
            requestStoryReviewRepairs2 = await requestStoryReviewRepairs({
              failedClips: failedClips4,
              invoke: invoke2,
              stepId: 'quality-repair:' + batchRef2.ref + ':round-' + repairRound2 + ':' + value48,
              parseResponse: (value51, failedClipRefs2) =>
                parseRepairResponse(value51, { episodeRef: episodeRef5, failedClipRefs: failedClipRefs2 }),
              buildPrompt: (failedClips5) =>
                buildRepairPrompt({
                  episodeRef: episodeRef5,
                  episode: episode,
                  failedClips: failedClips5,
                  assessments: assessments2,
                  neighbors: neighboringClips2,
                  assets: assets,
                  constraints: constraints,
                  repairRound: repairRound2,
                  previousErrorsByRef: previousErrorsByRef2,
                  previousClipsByRef: previousClipsByRef2,
                }),
              systemPrompt:
                '你是分镜定点修复师。根据上一轮精确错误只重修被点名的失败片段，绝不改写已通过片段。只返回严格 JSON。',
            });
          } catch (error9) {
            if (error9.storyReviewInterrupted) throw error9;
            const text2 = normalizeText(error9?.message || error9);
            list23.forEach((value52) => {
              ((previousErrorsByRef2[value52] = text2),
                (value43[value52] = 'REPAIR_RESPONSE'),
                map8.add(value52));
            });
            break;
          }
        }
        (list23.forEach((value53) => map10.delete(value53)),
          await handler3(requestStoryReviewRepairs2, list23));
        const list24 = list23.filter((value54) => !map10.has(value54)),
          list25 = list23.filter((value55) => map10.has(value55)),
          list26 = [...list24];
        let value56 = false;
        if (list25.length) {
          const assessments3 = list25.flatMap((value57) => map10.get(value57) || []),
            batchRef3 = batchRef2.ref + '-repair-recheck' + (repairRound2 > 1 ? '-' + repairRound2 : '');
          try {
            const value58 = reviewPolicy
                ? JSON.stringify({
                    episodeRef: episodeRef5,
                    batchRef: batchRef3,
                    assessments: assessments3.map((clipRef4) => ({
                      clipRef: clipRef4.ref,
                      verdict: 'pass',
                      issues: [],
                    })),
                  })
                : await invoke2(
                    {
                      prompt: buildReviewPrompt({
                        episodeRef: episodeRef5,
                        episode: episode,
                        batchRef: batchRef3,
                        clips: assessments3,
                        neighboringClips: [
                          ...neighboringClips2,
                          ...clips6.filter((value59) => !list25.includes(value59.ref)).flatMap(
                            (value60) => map7.get(value60.ref) || [value60],
                          ),
                        ],
                        assets: assets,
                        localSignals: localSignals2({ clips: assessments3 }),
                        phase: 'repair-recheck',
                        constraints: constraints,
                      }),
                      systemPrompt: REVIEW_SYSTEM_PROMPT,
                    },
                    'quality-recheck:' +
                      batchRef2.ref +
                      (repairRound2 > 1 ? ':round-' + repairRound2 : ''),
                  ),
              list27 = applyBlockingLocalSignalsToAssessments(
                parseReviewResponse(value58, {
                  episodeRef: episodeRef5,
                  batchRef: batchRef3,
                  clipRefs: assessments3.map((value61) => value61.ref),
                }),
                localSignals2({ clips: assessments3 }),
              );
            list22.push(cloneJson(list27));
            if (repairRound2 === 1) batchRef2.recheck = cloneJson(list27);
            const map12 = new Map(list27.map((value62) => [value62.clipRef, value62]));
            list25.forEach((value63) => {
              if (batchRef2.pendingRecheck) delete batchRef2.pendingRecheck[value63];
              const list28 = map10.get(value63) || [];
              previousClipsByRef2[value63] = cloneJson(list28);
              const list29 = list28.map((value64) => map12.get(normalizeText(value64?.ref))).filter((value65) => value65?.verdict === 'repair');
              if (list29.length) {
                ((value43[value63] = list29.every(
                  (value66) =>
                    value66.issues.length &&
                    value66.issues.every((value67) =>
                      BLOCKING_LOCAL_SIGNAL_CODES.has(value67.code),
                    ),
                )
                  ? 'STORY_LOCAL_TIMING'
                  : 'CONTENT'),
                  (previousErrorsByRef2[value63] =
                    list29.flatMap((value68) => value68.issues)
                      .map((value69) => value69.reason || value69.repairInstruction)
                      .filter(Boolean)
                      .join('；') || '定点修复结果复审仍未通过。'),
                  map8.add(value63),
                  list26.push(value63),
                  (value56 = true));
                return;
              }
              ((value47[value63] = cloneJson(list28)),
                map7.set(value63, cloneJson(list28)),
                delete previousErrorsByRef2[value63],
                delete value43[value63],
                map8.delete(value63));
            });
          } catch (error10) {
            if (error10.storyReviewInterrupted) throw error10;
            const text3 = normalizeText(error10?.message || error10);
            (list25.forEach((value70) => {
              (error10.code === 'STORY_REVIEW_PROTOCOL' &&
                ((batchRef2.pendingRecheck ||= {}),
                (batchRef2.pendingRecheck[value70] = cloneJson(map10.get(value70)))),
                (previousErrorsByRef2[value70] = text3),
                (value43[value70] = 'REVIEW_RESPONSE'),
                map8.add(value70),
                list26.push(value70));
            }),
              (value56 = true));
            if (error10.code === 'STORY_REVIEW_PROTOCOL') break;
          }
        }
        ((list23 = [...new Set(list26)]),
          (value48 = list24.length && value56 ? 'mixed' : list24.length ? 'validation' : 'recheck'));
      }
      (list22.length > 1 && (batchRef2.recheckRounds = list22),
        (batchRef2.replacements = value47),
        (batchRef2.repairErrors = previousErrorsByRef2),
        (batchRef2.repairErrorCodes = value43),
        (batchRef2.attemptedClips = previousClipsByRef2),
        (batchRef2.status = 'completed'),
        await checkpoint());
    } catch (error11) {
      if (error11.storyReviewInterrupted) throw error11;
      ((batchRef2.status = 'completed'),
        (batchRef2.repairError = normalizeText(error11?.message || error11)),
        list20.forEach((value71) => map8.add(value71)),
        await checkpoint());
    }
  }
  let clips8 = clips5.flatMap((value72) =>
    map7.has(value72.ref) ? map7.get(value72.ref) : [value72],
  );
  const list30 = clips8.map((value73) => normalizeText(value73?.ref));
  if (list30.some((enabled4) => !enabled4) || new Set(list30).size !== list30.length)
    throw new Error('审片修复后出现空片段引用或重复片段引用，未提交修复结果。');
  let list31 = getBlockingStoryEpisodeSplitLocalSignals(localSignals2({ clips: clips8 }));
  if (reviewPolicy) totalDurationSeconds.contentNotes = [];
  if (
    list31.length &&
    !reviewPolicy &&
    !isStoryContinuousTimelinePromptMode(constraints?.promptMode)
  ) {
    const clips9 = normalizeStoryEpisodeSpokenTiming(clips8, {
        maxClipDurationSeconds: Math.max(0, Number(constraints?.sceneMaxSeconds) || 0),
        maxSpokenUnitsPerSecond: MAX_SPOKEN_UNITS_PER_SECOND,
      }),
      list32 = getBlockingStoryEpisodeSplitLocalSignals(
        inspectStoryEpisodeSplitLocalSignals({ clips: clips9 }),
      );
    if (!list32.length) {
      ((clips8 = clips9), (list31 = []));
      for (const value74 of totalDurationSeconds.batches) {
        for (const value75 of value74.assessments || []) {
          value74.repairErrorCodes?.[value75.clipRef] === 'STORY_LOCAL_TIMING' &&
            value75.issues?.length &&
            value75.issues.every((value76) => BLOCKING_LOCAL_SIGNAL_CODES.has(value76.code)) &&
            (map8.delete(value75.clipRef),
            delete value74.repairErrors[value75.clipRef],
            delete value74.repairErrorCodes[value75.clipRef]);
        }
      }
    }
  }
  if (list31.length) {
    const list33 = new Set(
      list31.map((value77) => normalizeText(value77?.clipRef)).filter(Boolean),
    );
    (list33.forEach((value78) => map8.add(value78)),
      (totalDurationSeconds.status = 'failed_retryable'),
      (totalDurationSeconds.completedClips = null),
      (totalDurationSeconds.batches = totalDurationSeconds.batches.map((args7) =>
        (Array.isArray(args7?.clipRefs) ? args7.clipRefs : []).some((value79) =>
          list33.has(value79),
        )
          ? { ...args7, status: 'pending' }
          : args7,
      )),
      await checkpoint());
    throw new Error(
      reviewPolicy
        ? '片段 ' +
            [...list33].join('、') +
            ' 局部修复后仍有明显' +
            (list31.some((value80) => /replication_(?:shot|speech)_/u.test(value80.code))
              ? '分镜结构异常或人声异常'
              : '时长异常') +
            '，候选结果已保留，未提交。'
        : '片段 ' + [...list33].join('、') + ' 的对白或镜头时长仍无法自然说完，未提交分镜结果。',
    );
  }
  reviewPolicy && (totalDurationSeconds.timingNotes = []);
  try {
    if (!reviewPolicy) assertStoryReviewResolved(totalDurationSeconds, map8);
  } catch (value81) {
    await checkpoint();
    throw value81;
  }
  return (
    (totalDurationSeconds.status = 'completed'),
    (totalDurationSeconds.responses = {}),
    (totalDurationSeconds.completedClips = cloneJson(clips8)),
    await checkpoint(),
    {
      ...result,
      clips: clips8,
      totalDurationSeconds: clips8.reduce(
        (value82, value83) => value82 + Math.max(0, Number(value83?.durationSec) || 0),
        0,
      ),
      qualityReview: createQualityReviewSummary(totalDurationSeconds),
    }
  );
}
