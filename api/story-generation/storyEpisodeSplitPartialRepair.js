import {
  STORY_ASSET_REFERENCE_RULES,
  buildStoryAssetReferenceContract,
} from './storyAssetReferenceContract.js';
import { REPLICATION_TIMELINE_RULE } from '../../src/domain/storyGeneration/videoReplicationPromptPolicy.js';
import {
  buildReplicationTimingContract,
  REPLICATION_INTEGER_TIMING_RULE,
} from '../../src/domain/storyGeneration/videoReplicationTimingContract.js';
import { replicationVisualSchema } from '../../src/domain/storyGeneration/videoReplicationVisualContract.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeStringArray(item) {
  return [
    ...new Set((Array['isArray'](item) ? item : [])['map']((key) => normalizeText(key))['filter'](Boolean)),
  ];
}
function normalizeReference(index, result = '') {
  return normalizeText(index) || normalizeText(result);
}
export function canRepairStoryEpisodeSplitPartialDraft(options = {}) {
  const list = Array['isArray'](options?.['items']) ? options['items'] : [];
  return (
    list['some']((data) => data?.['status'] === 'valid') &&
    list['some']((target) => target?.['status'] !== 'valid')
  );
}
function collectRepairAssetRefs(list2 = []) {
  const source = new Set();
  return (
    list2['forEach']((next) => {
      (Array['isArray'](next?.['rawClips']) ? next['rawClips'] : [])['forEach']((current) => {
        (Array['isArray'](current?.['shots']) ? current['shots'] : [])['forEach']((entry) => {
          (normalizeStringArray(entry?.['assetRefs'])['forEach']((record) => source['add'](record)),
            (Array['isArray'](entry?.['assetUsages']) ? entry['assetUsages'] : [])['forEach']((payload) => {
              const reference = normalizeReference(payload?.['assetRef']);
              if (reference) source['add'](reference);
            }));
        });
      });
    }),
    source
  );
}
export function buildStoryEpisodeSplitPartialRepairPrompt({
  draft: draft = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
  schemaVersion: schemaVersion = 1,
  clipMaxSeconds: clipMaxSeconds = 15,
  timingGuidance: timingGuidance = '',
  dialogueSpeakerGuidance: dialogueSpeakerGuidance = '',
  groupingGuidance: groupingGuidance = '',
  timelineRequirements: timelineRequirements = [],
  continuousTimeline: continuousTimeline = false,
} = {}) {
  const handle = (Array['isArray'](draft?.['items']) ? draft['items'] : [])['filter'](
      (state) => state?.['status'] !== 'valid',
    ),
    map = collectRepairAssetRefs(handle),
    config = (Array['isArray'](assets) ? assets : [])['filter'](
      (scope) =>
        map['has'](normalizeReference(scope?.['ref'])) ||
        (Array['isArray'](scope?.['appearances']) &&
          scope['appearances']['some']((input) => map['has'](normalizeReference(input?.['ref'])))),
    ),
    args = Boolean(episode['replication']?.['sourceAnalysis']),
    output = args
      ? buildReplicationTimingContract(
          episode,
          continuousTimeline ? 'seedance-2.5' : 'seedance-2.0',
          handle['map']((value2) => ({ ref: value2['sourceClipRef'] })),
        )
      : null;
  return JSON['stringify']({
    task: 'repair_story_episode_split_clips',
    schemaVersion: schemaVersion,
    episode: {
      ref: normalizeReference(draft?.['episodeRef']),
      title: normalizeText(episode?.['title']),
      synopsis: normalizeText(episode?.['synopsis']),
    },
    constraints: constraints,
    assets: config['length'] ? config : assets,
    ...(args ? { timingContract: output, shotVisualSchema: replicationVisualSchema() } : {}),
    failedClips: handle['map']((args2) => ({
      sourceIndex: args2['sourceIndex'],
      sourceClipRef: args2['sourceClipRef'],
      rejectionReason: normalizeText(args2?.['error']?.['message']),
      ...(args2?.['error']?.['validationDetails']
        ? { validationDetails: args2['error']['validationDetails'] }
        : {}),
      rejectedClips: args2['rawClips'],
    })),
    instruction: (args
      ? [
          ...STORY_ASSET_REFERENCE_RULES,
          REPLICATION_TIMELINE_RULE,
          ...(continuousTimeline ? [REPLICATION_INTEGER_TIMING_RULE] : []),
          '只修 failedClips 的 rejectionReason/validationDetails 指出的结构错误，每个 sourceClipRef 返回一个同 ref 的 clip；已通过的片段不返回。',
          '时间格式按 timingContract 组织，已有合法切点保持；不得重新估算动作或语速，不因换场另拆片段。',
          '未涉及的画面、镜头、声音原文及归属、素材引用、sceneKey、textElements、spatialStart、spatialEnd 原样保留；不重新识别、不润色、不分类或重写内容。',
          '返回 episodeRef 和 repairs，每项含 sourceClipRef、clips；clips 沿用 rejectedClips 的完整结构，只返回严格 JSON。',
        ]
      : [
          ...STORY_ASSET_REFERENCE_RULES,
          '只修复 failedClips，不要重新生成整集，也不要改写已经通过校验的片段。',
          '每个 clip 都会独立提交给视频模型，模型看不到其他 clip；每个 clip 必须自包含地点、角色状态、动作起点、情绪和本片段内的镜头衔接。',
          '每个 clip 必须绑定一个且只能一个 scene 场景资产，至少一个 shot.assetUsages 必须引用其 assetRef 和 appearanceRef；换场时拆成新的 clip。',
          normalizeText(timingGuidance) +
            '修复后的分镜总时长在视频模型的 ' +
            clipMaxSeconds +
            ' 秒能力内。',
          normalizeText(dialogueSpeakerGuidance),
          normalizeText(groupingGuidance),
          ...(Array['isArray'](timelineRequirements) ? timelineRequirements : []),
          '超限时依据完整动作节拍、对白轮次或情绪转折选择语义拆分点；允许重写分镜结构，并将一个失败片段重写成多个独立片段。',
          '禁止按时长均分、按 shots 数量对半切、直接复制失败文案，或遗漏、重复原剧情信息。',
          '不要返回 title；客户端会按最终顺序统一命名为“片段01”“片段02”等。',
          '每个 repairs 项必须逐字返回对应 sourceClipRef；只返回严格 JSON 对象。',
        ])
      ['filter'](Boolean)
      ['join']('\n'),
    allowedAssetReferences: buildStoryAssetReferenceContract(config['length'] ? config : assets),
    outputContract: args
      ? 'episodeRef and repairs[{sourceClipRef,clips[{ref,durationSec,shots[{durationSec,startSec,endSec,assetUsages,visual,camera,dialogue,voiceover,audio,sceneKey,textElements,spatialStart,spatialEnd}]}]}]'
      : continuousTimeline
        ? 'episodeRef and repairs[{sourceClipRef,clips[{ref,script,creativeIntent,transition,shots[]{durationSec,startSec,endSec,assetUsages,visual,camera,dialogue,voiceover,audio}}]}]'
        : 'episodeRef and repairs[{sourceClipRef,clips[{ref,script,creativeIntent,transition,shots[]{durationSec,assetUsages,visual,camera,dialogue,voiceover,audio}}]}]',
  });
}
export function applyStoryEpisodeSplitPartialRepairs(
  value3,
  args3 = {},
  { parseReplacementClips: parseReplacementClips, serializeValidationError: serializeValidationError } = {},
) {
  const reference2 = normalizeReference(value3?.['episodeRef'], args3?.['episodeRef']);
  if (reference2 !== args3?.['episodeRef']) throw new Error('Agent 返回的局部修复结果与当前分集不一致。');
  const map2 = new Map();
  (Array['isArray'](value3?.['repairs']) ? value3['repairs'] : [])['forEach']((value4) => {
    const reference3 = normalizeReference(value4?.['sourceClipRef']);
    reference3 && !map2['has'](reference3) && map2['set'](reference3, value4);
  });
  const value5 = (Array['isArray'](args3?.['items']) ? args3['items'] : [])['map']((args4) => {
      if (args4?.['status'] === 'valid') return args4;
      const enabled = map2['get'](args4['sourceClipRef']);
      if (!enabled)
        return {
          ...args4,
          error: { message: 'Agent 未返回失败片段“' + args4['sourceClipRef'] + '”的修复结果。' },
        };
      const value6 = Array['isArray'](enabled?.['clips']) ? enabled['clips'] : [];
      try {
        return {
          status: 'valid',
          sourceIndex: args4['sourceIndex'],
          sourceClipRef: args4['sourceClipRef'],
          clips: parseReplacementClips(value6),
        };
      } catch (error) {
        return {
          ...args4,
          rawClips: value6,
          error:
            typeof serializeValidationError === 'function'
              ? serializeValidationError(error, args4)
              : { message: normalizeText(error?.['message'] || error) },
        };
      }
    }),
    value7 = new Set(),
    value8 = value5['map']((value9) => {
      if (value9?.['status'] !== 'valid') return value9;
      const value10 = (value9['clips'] || [])
        ['map']((value11) => value11['ref'])
        ['find']((value12) => value7['has'](value12));
      if (value10)
        return {
          status: 'invalid',
          sourceIndex: value9['sourceIndex'],
          sourceClipRef: value9['sourceClipRef'],
          rawClips: value9['clips'],
          error: { message: 'Agent 返回了重复的片段引用“' + value10 + '”。' },
        };
      return ((value9['clips'] || [])['forEach']((value13) => value7['add'](value13['ref'])), value9);
    });
  return {
    ...args3,
    items: value8,
    attempts: Math['max'](1, Math['trunc'](Number(args3?.['attempts']) || 1)) + 1,
  };
}
export function appendStoryEpisodeSplitPartialRepairFailure(args5 = {}, value14) {
  const text = normalizeText(value14?.['message'] || value14) || '局部修复返回无法解析。';
  return {
    ...args5,
    items: (Array['isArray'](args5?.['items']) ? args5['items'] : [])['map']((args6) =>
      args6?.['status'] === 'valid'
        ? args6
        : {
            ...args6,
            error: {
              ...args6?.['error'],
              message:
                (normalizeText(args6?.['error']?.['message']) || '片段仍需修复。') +
                '；局部修复失败：' +
                text,
            },
          },
    ),
    attempts: Math['max'](1, Math['trunc'](Number(args5?.['attempts']) || 1)) + 1,
  };
}
