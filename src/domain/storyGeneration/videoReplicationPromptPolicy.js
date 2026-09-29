import { replicationVisualSchema } from './videoReplicationVisualContract.js';
import { isStoryContinuousTimelinePromptMode } from './promptModes.js';
import {
  REPLICATION_VISUAL_ELEMENTS_RULE,
  REPLICATION_VISUAL_STATE_RULE,
} from './videoReplicationVisualState.js';
import {
  replicationRoutePolicy,
  REPLICATION_CONTENT_TYPES,
  resolveReplicationContentType,
} from './videoReplicationContentRouting.js';
import {
  buildReplicationTimingContract,
  getReplicationClipTiming,
  REPLICATION_INTEGER_TIMING_RULE,
  REPLICATION_SOURCE_CUT_RULE,
  isValidIntegerTimelineShot,
} from './videoReplicationTimingContract.js';
export const REPLICATION_SOURCE_SPEECH_RULE =
  '先逐句转写实际人声，再记录画面。dialogue 只记角色实际对人或电话说的话；voiceover 记叙述或内心独白。每次说话人或声音类型变化都另起一条，按 speechOrder 排列；被对白打断的旁白拆为前后两条，不能跨过对白合并。相同音色、第一人称或连续字幕不证明都是对白或内心独白。回顾发生的事情通常是 narration，只有明确的未说出口心理活动才是 inner_monologue；听不清或类型不确定标 uncertain，不补词、不重复接缝文字、不按剧情猜测。听不到音轨时在 uncertainties 如实说明，字幕只能作为辅助证据。';
export const REPLICATION_TIMELINE_RULE =
  '时间以已确定的 segmentPlan 为准：片段 ref、原片起止、片段总时长固定，生成和修补均不得延长、缩短或另拆 clip。在原时间范围内按原片 shots 的切点组织镜头；修补缺镜只补回对应切点，不改变其他镜头的时间位置。原语言人声已有原片节奏，不按字数估算重新分配时间；译后确实无法容纳时保留疑点，不能删词、加速或擅改时间。';
export const REPLICATION_CONTENT_RULE =
  '人声原文、类型、说话人和\x20speechOrder\x20是声音依据，shots\x20与\x20speechRefs\x20是画面及对应关系依据；不根据\x20scriptMode\x20或剧情摘要重新分类。source\x20语言逐字保留，其他目标语言只翻译一次并保留信息、语气、类型与顺序。已有译文和人物替换沿用当前候选，不改回原演员。没有的人声不得补写，无旁白不作为缺失错误。只修有证据的错误，不确定就保留并指出需核对的事件；不从叙述推演新动作、表演、对白或音效。';
export const REPLICATION_VISUAL_RULE =
  '逐镜将来源 shots 的可见信息组织成可执行的视频画面描述，不压缩成剧情摘要。visual 写清出镜主体在场景中的位置与朝向、人物之间及人物与道具的关系，再按发生顺序描述主要动作及结果，并保留来源已记录的视线、可见表情、身体状态和背景变化。动作先清楚概括，影响还原的动作衔接再写具体；静物镜头可简短，不设最低字数，不为凑细节逐项补全。camera 写来源明确的景别、机位、构图和运镜；过肩镜头说清谁的肩背在前景、主要看谁，固定或跟随及运动方向仅在来源有依据时写。来源没记录的信息不从台词或剧情推演，不把缺失信息猜成黑屏、过渡或无动作。人声进入独立声音字段；文字逐项进入 textElements，以 kind 区分物体文字、设计图文与转录字幕，程序按路由组织呈现。场景切换可作为新 shot 的开始，不在同一个 shot 串写多次切镜，不虚构转身、走位或连续运镜。以素材绑定替换主体身份和外貌，保留原片场景、道具及动作关系，不重复整段人设。';
export const REPLICATION_SPEECH_OUTPUT_RULE =
  '每句人声只在起始 shot 的 dialogue/q 或 voiceover/o 转写一次，使用‘人物名：原话’或‘旁白（人物名）：原话’，未知叙述者用‘旁白：原话’。跨镜画外音在起始镜头 audio/a 写‘画外音时间：起秒-止秒’，必须使用片段内相对秒数，不能填原片绝对时间；覆盖范围按 speechRefs 定位，不跨过插入的对白。后续镜头不重复台词，也不需要延续标记；无独立环境音时 audio 留空。对白前后旁白分别放到对应镜头，不能按声音类型重新排序。';
const speechOutput = REPLICATION_SPEECH_OUTPUT_RULE,
  references =
    'assetUsages 只引用素材清单中实际可见的人物、场景和道具及其 appearanceRef；仅被提及的人物不算出镜。正文不写 @、URL、图片编号或内部 ID，最终素材声明与时间轴格式由编译器生成。';
export function getReplicationGenerationSystemPrompt() {
  return [
    '你将原片观察记录转换成可执行的视频分镜，不重新创作故事。只返回输入\x20outputFormat/output\x20指定的完整\x20JSON。',
    REPLICATION_CONTENT_RULE,
    REPLICATION_TIMELINE_RULE,
  ]['join']('\x0a');
}
export function projectReplicationPromptEvidence(_0x20a3fc, _0x84ef65) {
  if (!_0x20a3fc) return _0x20a3fc;
  const _0x41e533 = _0x20a3fc['segmentPlan']?.['length']
    ? _0x20a3fc['segmentPlan']['filter']((_0x302c93) => !_0x84ef65 || _0x84ef65['has'](_0x302c93['ref']))
    : null;
  return {
    sourceDurationSec: _0x20a3fc['sourceDurationSec'],
    sourceLanguage: _0x20a3fc['sourceLanguage'],
    contentType: _0x20a3fc['contentType'],
    contentTypeReason: _0x20a3fc['contentTypeReason'],
    characters: _0x20a3fc['characters'],
    speechPolicy: _0x20a3fc['speechPolicy'],
    ...(_0x41e533 ? { segmentPlan: _0x41e533 } : { events: _0x20a3fc['events'] }),
    adaptation: _0x20a3fc['adaptation'] && {
      targetLocale: _0x20a3fc['adaptation']['targetLocale'],
      audioLanguage: _0x20a3fc['adaptation']['audioLanguage'],
      characterBindings: _0x20a3fc['adaptation']['characterBindings'],
      replacements: _0x20a3fc['adaptation']['replacements']?.['map'](
        ({ assetId: _0x2bc74c, assetRef: _0x4f4e5f, targetName: _0x44ee10, original: _0x593915 }) => ({
          assetId: _0x2bc74c,
          assetRef: _0x4f4e5f,
          targetName: _0x44ee10,
          original: _0x593915,
        }),
      ),
    },
  };
}
export function serializeReplicationGenerationPrompt(_0x5df13a, _0x199f1a) {
  if (!_0x199f1a['replication']?.['sourceAnalysis']) return JSON['stringify'](_0x5df13a);
  const _0x360387 = isStoryContinuousTimelinePromptMode(_0x5df13a['promptMode']);
  return JSON['stringify']({
    task: _0x5df13a['task'],
    schemaVersion: _0x5df13a['schemaVersion'],
    promptMode: _0x5df13a['promptMode'] || 'seedance-2.0',
    episode: {
      ref: _0x5df13a['episode']['ref'],
      title: _0x5df13a['episode']['title'],
      ...(_0x199f1a['replication']['generationPrepared']
        ? { preparedScript: _0x5df13a['episode']['text'] }
        : {}),
    },
    sourceVideoEvidence: projectReplicationPromptEvidence(_0x5df13a['sourceVideoEvidence']),
    assets: _0x5df13a['assets'],
    scenes: _0x5df13a['scenes'] || _0x5df13a['episode']['scenes'],
    constraints: _0x5df13a['constraints'] || { clipMaxSeconds: _0x5df13a['clipMaxSeconds'] },
    timingContract: buildReplicationTimingContract(_0x199f1a, _0x5df13a['promptMode']),
    promptRoute: replicationRoutePolicy(_0x199f1a['replication']['sourceAnalysis']['contentType']),
    ...(resolveReplicationContentType(_0x199f1a['replication']['sourceAnalysis']['contentType']) === 'unknown'
      ? { availableRoutes: REPLICATION_CONTENT_TYPES['map'](replicationRoutePolicy) }
      : {}),
    requirements: [
      '逐个返回 segmentPlan 中的片段，ref 原样保留；s 使用 scenes.code，可在同一 clip 中通过各 shot.assetUsages 绑定不同场景。原片证据只在 sourceVideoEvidence 中出现，摘要和素材描述不能补写人声。',
      'contentType 沿用 promptRoute.contentType 并执行对应模板。若为 unknown，在本次生成中根据现有原片观察证据为全片选择 availableRoutes 中最符合的类型，并返回 contentType，不重做识别；仍不确定则 unknown，继续交付。广告不能只因出现商品而判定。',
      REPLICATION_VISUAL_RULE,
      speechOutput,
      references,
      REPLICATION_VISUAL_ELEMENTS_RULE,
      REPLICATION_VISUAL_STATE_RULE,
      '字段职责：v 写动作和表情，c 写摄影，textElements 写有用途分类和承载位置的文字，spatialStart/spatialEnd 写边界空间关系，q/o 写人声，a 写环境声音及画外音时间。来源旧文字字段仅是观察证据，不能照抄为新的分类条目；按其实际用途拆分。场戏、镜头和片段边界不得改动，空间关系只使用对应边界有依据的信息。',
      '原片已识别的人声全部保留，包括存疑的字和[听不清]占位。错字与说话人疑点留给用户修改，不因 uncertain 删除、概括或擅自改写台词；局部占位不得吞掉前后文字。',
      ...(_0x199f1a['replication']['generationPrepared']
        ? [
            'episode.preparedScript 是已确认的目标语言正文，沿用其中的译文和人物对应；来源只用于核对声音类型、顺序、画面与时间，不把已确认译文重新翻译。',
          ]
        : []),
      REPLICATION_SOURCE_CUT_RULE,
      _0x360387
        ? REPLICATION_INTEGER_TIMING_RULE
        : '镜头\x20durationSec/d\x20使用当前模式允许的秒数，按顺序合计等于计划\x20durationSec，不重新估算动作时长。',
      'visual/v 与 camera/c 使用简体中文；声音使用 adaptation.targetLocale 指定语言。v 与 c 保留来源逐镜记录中有助于还原的具体信息，不把动作过程缩成‘交谈、递东西、离开’等结果摘要；a 仅写有依据的声音。不写创作解释、审片结论或重复素材外观。来源细节不足时如实沿用，不靠扩写编造，直接交给用户编辑。',
    ],
    shotVisualSchema: replicationVisualSchema(),
    outputFormat:
      '{\x22contentType\x22:\x22story/narrated_story/advertisement/unknown\x22,\x22clips\x22:[{\x22ref\x22:\x22计划ref\x22,\x22s\x22:\x22scenes.code\x22,\x22durationSec\x22:计划秒数,\x22shots\x22:[{\x22d\x22:镜头秒数,' +
      (_0x360387 ? '"startSec":局部起秒,"endSec":局部止秒,' : '') +
      '"v":"画面","c":"摄影","sceneKey":"场戏标识","textElements":[],"spatialStart":[],"spatialEnd":[],"q":"人物对白","o":"画外音","a":"环境声音及画外音时间","assetUsages":[{"assetRef":"素材ref","appearanceRef":"形象ref"}]}]}]}',
  });
}
export function getReplicationLockedTiming(_0x43bdfc, _0x391d3f) {
  const _0x39119f = _0x391d3f['replication']?.['segmentPlan']?.['find'](
    (_0x171a20) => _0x171a20['ref'] === _0x43bdfc['ref'],
  );
  let _0x555ece = 0x0;
  return {
    durationSec: Number(_0x39119f?.['durationSec'] ?? _0x43bdfc['durationSec']),
    sourceStartSec: _0x39119f?.['sourceStartSec'] ?? _0x43bdfc['sourceStartSec'],
    sourceEndSec: _0x39119f?.['sourceEndSec'] ?? _0x43bdfc['sourceEndSec'],
    shotBoundaries: (_0x43bdfc['shots'] || [])
      ['slice'](0x0, -0x1)
      ['map']((_0x56bb8e) => (_0x555ece += Number(_0x56bb8e['durationSec']))),
  };
}
export function buildReplicationReviewRequest(_0xf2d474, _0x1307fe, _0x9c2fd5, _0x98a7d0 = {}) {
  const _0x58d714 = JSON['parse'](_0xf2d474['prompt']),
    _0x458db6 = _0x58d714['task'] === 'repair_story_episode_split_quality',
    _0xc8b7b7 = _0x458db6
      ? _0x58d714['failedClips']['map']((_0x4f92c7) => _0x4f92c7['clip'])
      : _0x58d714['clips'],
    _0x5711b2 = projectReplicationPromptEvidence(
      _0x1307fe,
      new Set(_0xc8b7b7['map']((_0x2faa66) => _0x2faa66['ref'])),
    ),
    _0x4491d0 = {
      task: _0x58d714['task'],
      schemaVersion: _0x58d714['schemaVersion'],
      episodeRef: _0x58d714['episodeRef'],
      timingContract: buildReplicationTimingContract(
        _0x9c2fd5,
        _0x98a7d0['promptMode'] || _0x9c2fd5['promptMode'] || 'seedance-2.0',
        _0xc8b7b7,
      ),
      sourceVideoEvidence: _0x5711b2,
      assets: _0x58d714['assets'],
      productionLimits: { maxClipDurationSeconds: _0x58d714['productionLimits']['maxClipDurationSeconds'] },
      promptRoute: replicationRoutePolicy(
        resolveReplicationContentType(_0x1307fe['contentType'], _0xc8b7b7[0x0]?.['replicationContentType']),
      ),
      outputContract:
        (_0x58d714['outputContract'] || '') +
        '；复刻 shots 还须原样保留 sceneKey、textElements、spatialStart、spatialEnd。',
    },
    _0x287363 = _0x458db6
      ? {
          ..._0x4491d0,
          repairRound: _0x58d714['repairRound'],
          failedClips: _0x58d714['failedClips']['map'](({ timingBudget: _0x30471c, ..._0x51aa21 }) => ({
            ..._0x51aa21,
            lockedTiming: getReplicationLockedTiming(_0x51aa21['clip'], _0x9c2fd5),
          })),
          readOnlyNeighboringClips: _0x58d714['readOnlyNeighboringClips'],
          allowedAssetReferences: _0x58d714['allowedAssetReferences'],
          instruction: [
            '只返回 failedClips 的修补，每个 sourceClipRef 恰好一个同 ref 的 clip。lockedTiming 固定原片起止、总时长及 shotBoundaries 中的已有切点；允许按原片补充切点，但不能删除或移动已有切点。',
            REPLICATION_VISUAL_RULE,
            speechOutput,
            references,
            '只修改\x20issues\x20指出的字段。未涉及的台词、声音类型、顺序和时间保持；相邻片段只读。已有镜头可按原片证据补切点，不能移动其他切点。无法确定的保留原候选，不能造内容通过校验。',
          ],
        }
      : {
          ..._0x4491d0,
          batchRef: _0x58d714['batchRef'],
          phase: _0x58d714['phase'],
          clips: _0x58d714['clips'],
          neighboringClips: _0x58d714['neighboringClips'],
          localSignals: _0x58d714['localSignals'],
          criteria: [
            '对照来源逐句检查人声重复、遗漏、说话人、类型与穿插顺序，再检查画面和资产对应，最后检查切点与固定片段时长。',
            REPLICATION_VISUAL_RULE,
            speechOutput,
            '原片旁白可覆盖多个镜头，不要求每个镜头重复台词，也不按单镜字数强制延长或新增片段。不按景别词数量机械拆镜，以原片记录的切点为依据。',
            '只点名有证据的问题，引用具体 clip、shot 或事件编号。对来源本身的疑点标记需核对，不能假称重新看过视频或凭剧情纠正转写。',
            '每个输入片段返回一次 pass/repair，问题 reason 和 repairInstruction 各不超过80字。',
          ],
        };
  return {
    ..._0xf2d474,
    prompt: JSON['stringify'](_0x287363),
    systemPrompt: [
      _0x458db6
        ? '你是原片分镜的局部纠错员。只修指定问题，返回严格 JSON。'
        : '你在核对已识别的原片证据和候选分镜，未提供原视频时不声称回看。只返回严格 JSON。',
      REPLICATION_CONTENT_RULE,
      REPLICATION_TIMELINE_RULE,
      REPLICATION_SOURCE_CUT_RULE,
      ...(isStoryContinuousTimelinePromptMode(_0x98a7d0['promptMode'] || _0x9c2fd5['promptMode'])
        ? [REPLICATION_INTEGER_TIMING_RULE]
        : []),
      ...(_0x1307fe['adaptation']?.['audioLanguage'] ? [_0x1307fe['adaptation']['audioLanguage']] : []),
    ]['join']('\x0a'),
  };
}
export function assertReplicationRepairTiming(_0x311e12, _0x314649, _0x1bbbbd, _0x1dbb4a = {}) {
  const _0x22b260 = getReplicationLockedTiming(_0x314649, _0x1bbbbd);
  if (_0x311e12['length'] !== 0x1 || _0x311e12[0x0]['ref'] !== _0x314649['ref'])
    throw new Error('复刻修补不得改变片段数量或引用。');
  const _0x44af9c = _0x311e12[0x0],
    _0x34ab98 = (_0x44af9c['shots'] || [])['reduce'](
      (_0x495a56, _0x1c73c4) => _0x495a56 + Number(_0x1c73c4['durationSec']),
      0x0,
    );
  if (
    !Number['isFinite'](_0x34ab98) ||
    !Number['isFinite'](Number(_0x44af9c['durationSec'])) ||
    Math['abs'](_0x34ab98 - _0x22b260['durationSec']) > 0.001 ||
    Math['abs'](Number(_0x44af9c['durationSec']) - _0x22b260['durationSec']) > 0.001 ||
    ['sourceStartSec', 'sourceEndSec']['some'](
      (_0x850c02) =>
        _0x44af9c[_0x850c02] != null &&
        _0x22b260[_0x850c02] != null &&
        _0x44af9c[_0x850c02] !== _0x22b260[_0x850c02],
    )
  )
    throw new Error(
      '复刻修补时间已锁定为\x20' + _0x22b260['durationSec'] + ' 秒，禁止改变原片范围或片段总时长。',
    );
  let _0x2a698 = 0x0;
  const _0x402976 = [];
  for (const _0x28c2b2 of _0x44af9c['shots'] || []) {
    if (
      isStoryContinuousTimelinePromptMode(_0x1dbb4a['promptMode']) &&
      !isValidIntegerTimelineShot(_0x28c2b2)
    )
      throw new Error(
        '复刻修补必须使用片段局部连续整数秒；小数切点须按 timingContract 映射，不能改变已有时间。',
      );
    const _0x55de08 = _0x2a698;
    _0x2a698 += Number(_0x28c2b2['durationSec']);
    if (
      !(_0x2a698 > _0x55de08) ||
      ['startSec', 'endSec']['some'](
        (_0x1185f7, _0x56bda0) =>
          _0x28c2b2[_0x1185f7] != null &&
          (!Number['isFinite'](Number(_0x28c2b2[_0x1185f7])) ||
            Math['abs'](Number(_0x28c2b2[_0x1185f7]) - [_0x55de08, _0x2a698][_0x56bda0]) > 0.001),
      )
    )
      throw new Error('复刻修补镜头时间无效，起止必须与原位累计时长一致。');
    _0x402976['push'](_0x2a698);
  }
  if (
    _0x22b260['shotBoundaries']['some'](
      (_0x3fcdb2) =>
        Number['isFinite'](_0x3fcdb2) &&
        _0x3fcdb2 > 0x0 &&
        _0x3fcdb2 < _0x22b260['durationSec'] &&
        !_0x402976['some']((_0x57b1bf) => Math['abs'](_0x57b1bf - _0x3fcdb2) <= 0.001),
    )
  )
    throw new Error('复刻修补不得移动或删除已有镜头切点，原镜头时间已锁定。');
  const _0x49bf3e = getReplicationClipTiming(_0x314649, _0x1bbbbd, _0x1dbb4a['promptMode']);
  if (
    _0x1bbbbd['replication']?.['segmentPlan']?.['length'] &&
    _0x402976['slice'](0x0, -0x1)['some'](
      (_0x1a91d1) =>
        !_0x22b260['shotBoundaries']['includes'](_0x1a91d1) &&
        !_0x49bf3e['observedBoundaries']['includes'](_0x1a91d1),
    )
  )
    throw new Error('修补新增切点缺少原片逐镜依据，未采用猜测的镜头时间；请先核对原片镜头。');
}
