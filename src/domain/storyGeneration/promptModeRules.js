import { VIDEO_REPLICATION_AUDIO_LANGUAGE_SYSTEM_RULE } from './videoReplicationLanguage.js';
import {
  isStoryContinuousTimelinePromptMode,
  isStoryMinimaxH3PromptMode,
  isStorySeedance25PromptMode,
  isStoryWan30PromptMode,
  normalizeStoryPromptMode,
} from './promptModes.js';
export function getStoryEpisodeClipGroupingRequirements(value = '') {
  if (normalizeStoryPromptMode(value, { allowDeveloperModes: true }) !== 'seedance-2.0') return [];
  return [
    'Seedance 2.0 的 15 秒是单片上限，不是目标时长；用户设置更短上限时遵从该上限。连续剧情、同一轮对白和对应动作或反应组织在同一个 clip 内，换说话人、换景别或切镜头只增加 shot，不单独新建 clip。仅在继续内容会超过上限，或确有换场、时间跳跃、独立叙事阶段时拆段；自然结束的短片段保留，不拉长表演、不补空镜、不增删台词凑秒数。',
  ];
}
const STORY_EPISODE_SEEDANCE_2_5_TIMELINE_GUIDANCE =
    '当前 promptMode 为 seedance-2.5。每个 clip 是一次独立生成的 Seedance 2.5 视频片段；为 clip.shots 按顺序返回整数秒时间区间，首镜 startSec 必须为 0，后一镜 startSec 必须等于前一镜 endSec，末镜 endSec 必须等于该 clip 总时长，全程无空档、无重叠。durationSec 必须等于 endSec-startSec，且片段总时长不得超过 30 秒。',
  STORY_EPISODE_SEEDANCE_2_5_REFERENCE_GUIDANCE =
    '参考素材只通过 assetUsages 或 compact assetRefs 绑定真实存在的 assetRef 与 appearanceRef；不要在 visual、camera、dialogue、voiceover 或 audio 中输出 @、图片编号、视频编号、URL 或内部素材 ID。角色参考图仅参考身份、五官、发型、体型和服装，不采用图中背景、表情、动作或构图；场景参考图仅参考空间布局、材质、固定地标、出入口和光线，不采用图中人物或前景；道具参考图仅参考外观、结构、材质与当前状态，不采用图中背景或构图。人物表情、动作、视线和手部表演由当前 shot 描述。',
  STORY_EPISODE_SEEDANCE_2_5_SPATIAL_ANCHOR_GUIDANCE =
    '在 Seedance 2.5 提示词中，把场景参考图作为空间连续性参考锚点。输入中的 scenes[].spatialAnchor 或场景资产 description/prompt 提供该场景可用的空间依据；同一连续时空内，除非正文通过可见事件明确改变，建筑、家具、出入口、固定地标和光线方向的相对关系保持连续。镜头变化只改变观察方式，不得整体镜像或重排世界空间布局。',
  STORY_EPISODE_SEEDANCE_2_5_POSITION_HANDOFF_GUIDANCE =
    '每个有人物的 shot.visual 都按当前阶段写清开始状态、主要变化和结束状态，并至少用可见固定地标或主体相对关系描述人物具体站位、身体朝向、视线与动作方向、左右手持物、移动路径和落点；画面左/右只作为当前机位下的补充。后一 shot 的开始状态必须承接前一 shot 的结束状态；换位、持物及其他状态变化必须由可观察动作连接，禁止瞬移或无动作位置重置。不得在无人移动时对调人物相对场景地标的世界位置；仅由机位变化产生的屏幕左右变化不算换位。人物的动作、站位和台词不得互相交换。',
  STORY_EPISODE_SEEDANCE_2_5_PERFORMANCE_GUIDANCE =
    '每个人物表演镜头都写出当前画面真正需要的可见表演信息：面部变化、视线、身体姿态、手部动作、动作节奏和对白情绪；不要只写抽象情绪。保持人物位置、朝向、左右手持物、服装、道具状态和场景方向连续，换位与状态变化必须通过可观察动作完成。',
  STORY_EPISODE_OPENING_POSITION_GUIDANCE =
    '每个 clip 的首镜画面描述必须以“人物站位：”开头，并用第一个完整句子写清本片段开场所有可见人物的位置、朝向、视线和持物；若与前一个 clip 处于同一场景和连续时间，必须承接前一个 clip 末镜，不得重新安排站位；换场或时间跳跃时才重新建立站位。',
  STORY_EPISODE_WAN_3_0_TIMELINE_GUIDANCE =
    '当前 promptMode 为 wan-3.0。每个 clip 是一次独立生成、最长 30 秒的 Wan 3.0 视频片段；为 clip.shots 按顺序返回整数秒时间区间，首镜 startSec 必须为 0，后一镜 startSec 必须等于前一镜 endSec，末镜 endSec 必须等于该 clip 总时长，全程无空档、无重叠。durationSec 必须等于 endSec-startSec。',
  STORY_EPISODE_WAN_3_0_REFERENCE_GUIDANCE =
    '参考素材只通过 assetUsages 或 compact assetRefs 绑定真实存在的 assetRef 与 appearanceRef；不要在 visual、camera、dialogue、voiceover 或 audio 中输出 @、图像/视频/音频编号、URL 或内部素材 ID。角色、场景、道具素材用于锁定身份与外观、空间和物件，最终提交时由客户端按图1、视频1、音频1的实际上传顺序统一建立一次素材绑定。',
  STORY_EPISODE_WAN_3_0_AUDIO_GUIDANCE =
    'Wan 3.0 原生生成声音：dialogue 必须保留唯一且稳定的说话人姓名和对白原文；audio 只写当前镜头可听见的环境声、动作声与必要配乐变化。没有对白、旁白或配乐时保持对应字段为空，不得自动补写。多人对话先写当前说话人的可见动作和情绪，再写该人物对白，避免代词造成说话人混淆。',
  STORY_EPISODE_MINIMAX_H3_DURATION_GUIDANCE =
    '当前 promptMode 为 minimax-h3。每个 clip 是一次独立生成的 MiniMax H3 视频，shots 总时长必须为 4 至 15 秒的整数；优先在 5 至 6 秒内完成一个清晰的连续动作或表演节拍，内容容纳不下时在自然动作、对白轮次或情绪落点处拆成下一个 clip。不要返回 startSec 或 endSec。',
  STORY_EPISODE_MINIMAX_H3_REFERENCE_GUIDANCE =
    '参考素材只通过 assetUsages 或 compact assetRefs 绑定真实存在的 assetRef 与 appearanceRef；不要在 visual、camera、dialogue、voiceover 或 audio 中输出 @、<Subject N>、<Picture N>、<Video N>、<Audio N>、URL 或内部素材 ID。客户端会按 MiniMax 官方 h3-prompt-writing 规则，将人物、场景和道具定义为稳定的 <Subject N>，将真实输入顺序映射为 <Picture N>/<Video N>/<Audio N>；仅用于定义人物、场景、服装、道具或风格的图片只写进对应 Subject 定义，不单独作为关键帧条目。',
  STORY_EPISODE_MINIMAX_H3_DIRECTING_GUIDANCE =
    '围绕一个明确的核心故事与关系张力组织分镜；首镜 visual 必须用简体中文落实项目 visualStyle，并写清初始构图，所有 visual 必须用简体中文写清主体位置、环境与光线、可见动作和状态变化，camera 必须用自然、具体的简体中文写清景别、机位、运镜类型、幅度、速度和最终落点。audio 只写当前镜头可听见的环境声、物理动作声、非语言人声或用户明确要求的配乐事件本身，不要添加任何字段内前缀；客户端会将非配乐声音统一写为“画面内音效：…”，与 dialogue 和 voiceover 明确分离。多镜头只在叙事需要新信息时使用，避免在一个 5 至 6 秒动作内堆叠过度复杂的运镜；在不改变原剧情、不新增事件的前提下，提供足够具体的中文视听细节，不要自动补写输入不存在的对白、旁白、声音或配乐。',
  STORY_EPISODE_MINIMAX_H3_LANGUAGE_GUIDANCE =
    '为满足 MiniMax 官方 h3-prompt-writing 输出结构，当前模式的 creativeIntent、transition、transitionFromPrevious、visual、camera、dialogue、voiceover 与 audio 必须使用自然、具体的简体中文，并保留唯一说话人姓名；不得输出或保留英文对白、画外音、歌词、画面文字或英文叙述。客户端会把有参考素材的 clip 组装为 subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music 六段式 Ref2VA 提示词；无参考素材时组装为 T2VA 三段式提示词。除字段名、<Subject N> 等引用标签、[Shot N] At MM:SS.mmm、[reference generation]、fully_preserved、<d>[Chinese] 等官方结构标签外，所有提示词正文只能使用简体中文。';
export function getStoryEpisodePromptModePlanningRequirements(item = '') {
  if (isStorySeedance25PromptMode(item))
    return [
      STORY_EPISODE_SEEDANCE_2_5_TIMELINE_GUIDANCE,
      STORY_EPISODE_SEEDANCE_2_5_REFERENCE_GUIDANCE,
      STORY_EPISODE_SEEDANCE_2_5_SPATIAL_ANCHOR_GUIDANCE,
      STORY_EPISODE_SEEDANCE_2_5_POSITION_HANDOFF_GUIDANCE,
      STORY_EPISODE_SEEDANCE_2_5_PERFORMANCE_GUIDANCE,
    ];
  if (isStoryWan30PromptMode(item))
    return [
      STORY_EPISODE_OPENING_POSITION_GUIDANCE,
      STORY_EPISODE_WAN_3_0_TIMELINE_GUIDANCE,
      STORY_EPISODE_WAN_3_0_REFERENCE_GUIDANCE,
      STORY_EPISODE_WAN_3_0_AUDIO_GUIDANCE,
    ];
  if (isStoryMinimaxH3PromptMode(item))
    return [
      STORY_EPISODE_OPENING_POSITION_GUIDANCE,
      STORY_EPISODE_MINIMAX_H3_DURATION_GUIDANCE,
      STORY_EPISODE_MINIMAX_H3_REFERENCE_GUIDANCE,
      STORY_EPISODE_MINIMAX_H3_DIRECTING_GUIDANCE,
      STORY_EPISODE_MINIMAX_H3_LANGUAGE_GUIDANCE,
    ];
  return [STORY_EPISODE_OPENING_POSITION_GUIDANCE, ...getStoryEpisodeClipGroupingRequirements(item)];
}
export function isStoryEpisodeTimelineGuidance(key = '') {
  return [STORY_EPISODE_SEEDANCE_2_5_TIMELINE_GUIDANCE, STORY_EPISODE_WAN_3_0_TIMELINE_GUIDANCE].includes(
    key,
  );
}
export function appendStoryEpisodePromptModeSystemPrompt(
  index = '',
  result = '',
  { announceTimelineContract: announceTimelineContract = false } = {},
) {
  const list = getStoryEpisodePromptModePlanningRequirements(result);
  if (!list.length) return index;
  const isStoryWan30PromptMode2 = isStoryWan30PromptMode(result)
      ? 'Wan 3.0'
      : isStoryMinimaxH3PromptMode(result)
        ? 'MiniMax H3'
        : 'Seedance 2.5',
    isStoryContinuousTimelinePromptMode2 = isStoryContinuousTimelinePromptMode(result);
  return [
    index,
    announceTimelineContract && isStoryContinuousTimelinePromptMode2
      ? '当前为 ' +
        isStoryWan30PromptMode2 +
        ' 提示词模式，以下时间轴契约覆盖上方通用 JSON 示例中的字段限制。'
      : '',
    ...list,
    VIDEO_REPLICATION_AUDIO_LANGUAGE_SYSTEM_RULE,
    announceTimelineContract && isStoryContinuousTimelinePromptMode2
      ? '每个 shot 除通用字段外必须返回 startSec 与 endSec；只返回用户消息指定的 ' +
        isStoryWan30PromptMode2 +
        ' JSON 结构。'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
export const getStoryEpisodeTimelinePlanningRequirements = getStoryEpisodePromptModePlanningRequirements;
export function resolveStoryPromptModeClipMaxSeconds(data = '', options = 15) {
  return isStoryMinimaxH3PromptMode(data) ? 15 : options;
}
export function getStorySpatialContinuityPromptLines({ sourceEvidence: sourceEvidence = false } = {}) {
  const target = sourceEvidence ? '原片场景' : '场景参考图',
    source = sourceEvidence ? '原片人物形象' : '已选参考形象';
  return [
    '场景空间连续性参考锚点：同一连续时空内，除非剧情通过可见事件明确改变，' +
      target +
      '中的建筑、家具、出入口、固定地标和光线方向的相对关系保持连续；镜头变化只改变观察方式，不得整体镜像或重排世界空间布局。',
    '人物空间连续性：人物站位优先用场景固定地标或主体相对关系描述，画面左/右只作当前机位补充；位置、朝向、视线与动作方向、左右手持物和动作落点按时间轴连续变化，换位或持物变化必须通过可观察动作完成，不得瞬移或无动作位置重置；不得在无人移动时对调人物相对场景地标的世界位置，仅由机位变化产生的屏幕左右变化不算换位。除非剧情通过可见事件明确改变，人物面部、发型和服装沿用' +
      source +
      '。',
  ];
}
export function getStoryClipPromptModeRewriteRequirements(
  next = '',
  { hasAssetRefs: hasAssetRefs = false } = {},
) {
  if (isStoryMinimaxH3PromptMode(next))
    return hasAssetRefs
      ? [
          '目标为 MiniMax H3 Ref2VA 提示词。严格按 subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music 六段及该顺序输出。',
          '用 <Subject N> 定义可复用人物、场景和道具；每个锁定的 @素材引用只在 subject_definitions 中绑定一次，后续只使用对应 <Subject N>，不得留下没有定义的标签。summary 必须以 [reference generation] 开头，retention_analysis 使用 fully_preserved 等官方英文关系标记。',
          '六段正文直接输出简体中文，仅字段名和官方结构标签保留英文；返回 candidateText 前自行检查，并把草稿中的英文叙述、对白、歌词或画面文字改写为中文。对白写成 <d>[Chinese] 中文原文</d>，说话人使用全片稳定的 (S1)、(S2)。',
          'detailed_description 第一镜写 [Shot 1] 且不带时间；后续镜头写 [Shot N] At MM:SS.mmm，并写清构图、主体、环境光线、动作状态、运镜、声音和参考生效位置。非对白、非画外音的镜内声音统一写为“画面内音效：…”。不得输出其他声音字段前缀或 ⏱ 时长标签。',
        ]
      : [
          '目标为 MiniMax H3 T2VA 提示词。严格按 integrated_multimodal_description、overall_soundscape、non_diegetic_music 三段及该顺序输出，不得创建 Subject、Picture、Video 或 Audio 引用标签。',
          '三段正文直接输出简体中文，仅字段名和官方结构标签保留英文；返回 candidateText 前自行检查，并把草稿中的英文叙述、对白、歌词或画面文字改写为中文。对白写成 <d>[Chinese] 中文原文</d>，说话人使用全片稳定的 (S1)、(S2)。',
          'integrated_multimodal_description 第一镜写 [Shot 1] 且不带时间；后续镜头写 [Shot N] At MM:SS.mmm。非对白、非画外音的镜内声音统一写为“画面内音效：…”。不得输出其他声音字段前缀或 ⏱ 时长标签。',
        ];
  if (isStoryWan30PromptMode(next))
    return [
      '目标为 Wan 3.0 多模态提示词。开头只绑定一次每个锁定的 @素材引用；后续镜头使用普通角色、场景和道具名称，不重复绑定素材。',
      '镜头严格使用“镜头1 [0-3秒]：……”格式；首镜从 0 秒开始，后镜起点等于前镜终点，时间连续、无空档、无重叠，最后终点等于 candidateDurationSeconds。不得输出 ⏱ 标签。',
      '使用中文描述可见动作、表情、运镜、对白与原生声音；多人对白使用唯一角色名，不使用他或她替代说话人。',
    ];
  if (isStorySeedance25PromptMode(next))
    return [
      '目标为 Seedance 2.5 连续时间轴提示词。开头只绑定一次每个已选定的 @素材引用；后续镜头使用普通角色、场景和道具名称，不重复绑定素材。',
      '镜头严格使用“0-3秒：……”格式；首镜从 0 秒开始，后镜起点等于前镜终点，时间连续、无空档、无重叠，最后终点等于 candidateDurationSeconds。不得输出分镜 ⏱ 时长标签。',
      '保留场景空间连续性参考锚点：同一连续时空内，除非可见事件明确改变，建筑、家具、出入口、固定地标和光线方向的相对关系保持连续；镜头变化不得整体镜像或重排世界空间布局。人物站位优先用可见固定地标或主体相对关系描述，画面左/右只作当前机位补充。',
      '每个时间段写清开始状态、主要变化和结束状态；相邻时间段承接人物站位、朝向、视线与动作方向、左右手持物和动作落点。换位或持物变化必须有可观察动作，禁止瞬移或无动作位置重置；不得在无人移动时对调人物相对场景地标的世界位置，仅由机位变化产生的屏幕左右变化不算换位。',
      '使用中文描述可见表演、动作、视线、状态变化、运镜、对白和声音，不新增剧情事实。',
    ];
  return [
    '目标为当前 Seedance 2.0 剧本工作室提示词结构。角色、场景和道具在开头各绑定一次锁定的 @素材引用，后续分镜使用普通名称，不重复绑定素材。',
    '每镜使用“分镜1 ⏱ 3.0s：……”格式，镜头时长至少 0.5 秒并按 0.5 秒递增；所有 ⏱ 时长之和必须等于 candidateDurationSeconds。',
    '使用中文描述画面、可见表演、运镜、对白、画外音和音效，不新增剧情事实。',
  ];
}
