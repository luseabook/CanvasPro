import { generateText } from './aiTextApi.js';
import { withReplicationRequestPolicy } from './story-generation/storyRequestPolicy.js';
import {
  resolveStoryGenerationAssetRef,
  resolveStoryGenerationAppearanceRef,
} from './story-generation/storyAssetReferenceContract.js';
import {
  addReplicationAssetFrameContract,
  addReplicationAssetFrameSchema,
  attachReplicationAssetFrames,
} from './story-generation/storyReplicationAssetFrames.js';
import { getVideoReplicationSpeechGuidance } from '../src/domain/storyGeneration/videoReplicationSpeechPolicy.js';
import { STORY_ASSET_VOICE_DESCRIPTION_RULE } from './story-generation/storyAssetVoicePolicy.js';
import {
  buildVideoReplicationSourceEvidence,
  buildVideoReplicationTimingGuidance,
} from '../src/domain/storyGeneration/videoReplicationSourceAnalysis.js';
import {
  serializeReplicationGenerationPrompt,
  getReplicationGenerationSystemPrompt,
} from '../src/domain/storyGeneration/videoReplicationPromptPolicy.js';
import { isValidIntegerTimelineShot } from '../src/domain/storyGeneration/videoReplicationTimingContract.js';
import { createReplicationSplitOutput } from './story-generation/storyReplicationOutputContract.js';
import { applyReplicationAsrDelivery } from '../src/domain/storyGeneration/videoReplicationAsrDelivery.js';
import { completeReplicationMissingClips } from './story-generation/storyReplicationMissingClips.js';
import { replicationVisualFields } from '../src/domain/storyGeneration/videoReplicationVisualState.js';
import { resolveReplicationContentType } from '../src/domain/storyGeneration/videoReplicationContentRouting.js';
import {
  extractCompleteJsonArrayItems,
  extractJsonStringProperty,
  parseStrictJson,
} from './utils/strictJson.js';
import {
  normalizePositiveNumber,
  normalizeStringArray,
  normalizeText,
} from './utils/storyGenerationValues.js';
import {
  normalizeStorySceneHeadingIdentity,
  storySceneIdentitiesOverlap,
} from './utils/storySceneIdentity.js';
import { enqueueStoryEpisodeExperimentalRequest } from './storyEpisodeExperimentalRequestQueue.js';
import { enqueueStoryEpisodeRequest } from './storyEpisodeRequestQueue.js';
import {
  STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION,
  STORY_CLIP_ADJUSTMENT_SYSTEM_PROMPT,
  createStoryClipAdjustmentApi,
} from './story-generation/storyClipAdjustment.js';
import { createParallelStoryAssetExtractor } from './story-generation/storyAssetParallelExtraction.js';
import {
  createStoryAssetPromptContracts,
  createStoryAssetExtractionStructuredOutput,
} from './story-generation/storyAssetExtractionRequest.js';
import {
  STORY_ASSET_EXTRACTION_KINDS,
  STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
  createStoryAssetCompactExtractionResponseSchema,
  createStoryAssetExtractionResponseSchema,
  normalizeStoryAssetReference,
  parseStoryAssetCompactExtractionResult,
  parseStoryAssetExtractionResult,
  mergeStoryAssetVisualPromptRepair,
} from './story-generation/storyAssetExtractionResult.js';
import { createStoryEpisodeOutlinePlanningApi } from './story-generation/storyEpisodeOutlinePlanning.js';
import {
  createStoryInvocationLifecycle,
  invokeStoryGenerationRequest,
} from './story-generation/storyInvocationEvidence.js';
import { repairStoryEpisodeScriptMissingBodyTerminators } from './story-generation/storyEpisodeScriptResponseRecovery.js';
import {
  STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT,
  STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT,
  STORY_EPISODE_SCRIPT_SYSTEM_PROMPT,
  createStoryEpisodeScriptPromptApi,
} from './story-generation/storyEpisodeScriptPrompt.js';
import {
  assertStoryEpisodeSplitTiming,
  createStoryEpisodeScriptRuntimeGuidance,
  ensureStoryEpisodeScriptTiming,
  preserveStoryEpisodeScriptWithoutTimingReview,
  requestStoryEpisodeScriptTimingReview,
  resolveStoryEpisodeSplitTimingBudget,
} from './story-generation/storyEpisodeScriptTiming.js';
import {
  STORY_MAX_SPOKEN_UNITS_PER_SECOND,
  countStorySpokenUnits,
} from './story-generation/storyEpisodeSpokenTiming.js';
import {
  appendStoryEpisodeSplitPartialRepairFailure,
  applyStoryEpisodeSplitPartialRepairs,
  buildStoryEpisodeSplitPartialRepairPrompt,
  canRepairStoryEpisodeSplitPartialDraft,
} from './story-generation/storyEpisodeSplitPartialRepair.js';
import {
  assertPlanningModel,
  buildStoryTextProviderProfilePayload,
  getResultText,
  requestStrictResult,
} from './story-generation/storyTextRequest.js';
import {
  STORY_SUMMARY_MAX_PLOT_BEATS,
  STORY_SUMMARY_SCHEMA_VERSION,
  STORY_SUMMARY_SYSTEM_PROMPT,
  createStorySummaryBlueprint,
} from './story-generation/storySummaryBlueprint.js';
import { createStorySummaryGenerationApi } from './story-generation/storySummaryGeneration.js';
import {
  isStoryContinuousTimelinePromptMode,
  isStoryMinimaxH3PromptMode,
} from '../src/domain/storyGeneration/promptModes.js';
import {
  createStoryEpisodeSplitCompactSceneCatalog,
  createStoryEpisodeSplitPromptSceneCatalog,
} from './story-generation/storyEpisodeScenePromptCatalog.js';
import {
  appendStoryEpisodePromptModeSystemPrompt,
  getStoryEpisodeTimelinePlanningRequirements,
  isStoryEpisodeTimelineGuidance,
  resolveStoryPromptModeClipMaxSeconds,
} from '../src/domain/storyGeneration/promptModeRules.js';
import {
  STORY_EPISODE_COUNT_MAX,
  STORY_EPISODE_COUNT_OPTIONS,
  STORY_SCENE_MAX_SECONDS_OPTIONS,
  STORY_SCRIPT_MODE_NARRATION,
  STORY_SCRIPT_MODE_PLOT,
  normalizeStoryPlanningConstraints,
  normalizeStoryScriptMode,
  validateStoryPlanningConstraints,
} from '../src/domain/storyGeneration/planningContract.js';
import {
  STORY_EPISODE_SPLIT_CAMERA_PRESETS,
  buildStoryEpisodeSplitBatchResponseSchema,
  buildStoryEpisodeSplitBlueprintResponseSchema,
  buildStoryEpisodeSplitSingleResponseSchema,
} from '../src/domain/storyGeneration/episodeSplitContract.js';
export {
  STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION,
  STORY_CLIP_ADJUSTMENT_SYSTEM_PROMPT,
  STORY_ASSET_EXTRACTION_KINDS,
  STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
  STORY_SUMMARY_SCHEMA_VERSION,
  STORY_SUMMARY_SYSTEM_PROMPT,
  parseStoryAssetExtractionResult,
};
export {
  STORY_EPISODE_COUNT_MAX,
  STORY_EPISODE_COUNT_OPTIONS,
  STORY_SCENE_MAX_SECONDS_OPTIONS,
  STORY_SCRIPT_MODE_NARRATION,
  STORY_SCRIPT_MODE_PLOT,
  buildStoryEpisodeSplitBatchResponseSchema,
  buildStoryEpisodeSplitBlueprintResponseSchema,
  buildStoryEpisodeSplitSingleResponseSchema,
  normalizeStoryPlanningConstraints,
  normalizeStoryScriptMode,
  validateStoryPlanningConstraints,
};
export const STORY_GENERATION_SCHEMA_VERSION = 2;
export const STORY_PLANNING_SCHEMA_VERSION = 1;
export const STORY_EPISODE_SPLIT_SCHEMA_VERSION = 3;
export const STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION = 3;
export const STORY_EPISODE_OUTLINE_SCHEMA_VERSION = 2;
export const STORY_EPISODE_SCRIPT_SCHEMA_VERSION = 2;
export const STORY_SOURCE_CHUNK_CHARACTERS = 24000;
export const STORY_CHAPTER_MIN_CHARACTERS = 1500;
export const STORY_CHAPTER_MAX_CHARACTERS = 3000;
export const STORY_TEXT_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
export const STORY_TEXT_MAX_OUTPUT_TOKENS = 16384;
export const STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS = 32768;
export const STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS = 8 * 60 * 1000;
const STORY_EPISODE_DEV_RESPONSE_HISTORY_LIMIT = 6,
  STORY_EPISODE_OUTLINE_BATCH_SIZE = 4,
  STORY_CONTINUITY_MAX_CHARACTER_STATES = 12,
  STORY_CONTINUITY_MAX_PROP_STATES = 10,
  STORY_CONTINUITY_MAX_UNRESOLVED_THREADS = 8,
  STORY_CONTINUITY_MAX_FACTS = 12,
  STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH = 8,
  STORY_EPISODE_EXPERIMENTAL_BATCH_TARGET_DURATION_SECONDS = 75,
  STORY_EPISODE_EXPERIMENTAL_FALLBACK_PLAN_DURATION_SECONDS = 15,
  STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP = 0,
  STORY_EPISODE_EXPERIMENTAL_PREFERRED_SHOTS_PER_CLIP = 4,
  STORY_EPISODE_EXPERIMENTAL_MAX_FINAL_SHOTS_PER_CLIP = 5,
  STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_TARGET_CHARACTERS = 420,
  STORY_EPISODE_SPLIT_TEMPERATURE = 0.2,
  STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_MAX_CHARACTERS = 620,
  STORY_EPISODE_EXPERIMENTAL_MAX_CONCURRENT_BATCHES = 3,
  STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS = 4;
export const STORY_GENERATION_SYSTEM_PROMPT = [
  '你是一名专业的短剧故事策划与剧本编辑。',
  '你的任务仅是创建或整理故事剧情，不生成分镜、镜头提示词、角色绘图提示词、场景绘图提示词或分集方案。',
  '故事必须具备清晰的主角目标、人物动机、主要阻力、因果推进、关键转折、高潮和结局。',
  '不要使用空泛评价代替剧情，不要写创作说明，不要向用户提问。',
  '所有输出使用简体中文。',
  '只返回一个严格 JSON 对象；不要输出 Markdown、代码块、前后说明、注释或尾随逗号。',
  'JSON 必须且只能包含 title、storyType、storySummary、storyBackground、storySetting、logline、chapters 七个字段。',
  'storySummary 是可独立阅读的故事梗概，概括主角、目标、核心冲突、主要转折和结局。',
  'storyBackground 说明故事发生的时代、地点、社会环境和初始处境。',
  'storySetting 说明世界规则、核心机制、人物必须遵守的限制和关键设定。',
  'logline 用一句话概括主角、目标、阻力和故事钩子。',
  'chapters 是章节数组，每章必须包含 title 和 content；title 是小说式主标题，content 使用自然段连续叙事。',
  '每章 content 必须为 ' +
    STORY_CHAPTER_MIN_CHARACTERS +
    ' 至 ' +
    STORY_CHAPTER_MAX_CHARACTERS +
    ' 个汉字，不能用提纲、重复句或无意义内容凑字数。',
  '所有章节合在一起必须完整覆盖故事的起因、发展、转折、高潮和结局，不能只输出片段或章节提纲。',
].join('\n');
const STORY_SOURCE_DIGEST_SYSTEM_PROMPT = [
    '你是长篇剧本信息整理助手。',
    '只提取原文事实，不续写、不评价、不改变人物关系和事件结果。',
    '每个分段摘要的 JSON 总内容控制在 1500 个汉字以内。',
    '只返回严格 JSON，不要输出 Markdown 或其他说明。',
    'JSON 必须包含 characters、settings、events、continuity、endingState。',
  ].join('\n'),
  STORY_ASSET_EXTRACTION_SYSTEM_PROMPT = [
    '你是专业的影视资产策划 Agent。',
    '你的任务是从已经确认的故事中提取需要保持视觉一致的角色、场景和关键道具资产。',
    '只依据输入故事提取，不续写剧情，不创建分集或分镜。',
    '角色的显著外观变化应拆成 appearances；普通情绪变化不要创建新形象。',
    '同一物理空间在不同年代、完好/损毁、正常/异变、干燥/积水等会明显改变参考画面的状态下，必须保留为同一个场景资产并拆成多个 appearances；普通镜头角度、短暂人物活动或不改变空间视觉基准的情绪氛围不拆形象。',
    '多形象角色的第一个 appearance 视为基础形象；每个 appearance name 都必须填写能区分视觉状态的通用具体名称，例如“日常装束”“正式装束”，禁止使用空值或笼统的“基础形象”。其他形象必须完整复述基础形象中的稳定身份特征，只改变剧情明确要求的服饰、年龄、伤势或状态。',
    '角色 name 只能填写原文姓名；原文没有姓名时使用不超过 6 个汉字的简短身份名，禁止写身份说明、剧情经历或逗号分隔的描述。',
    '原文中明确列入出场人物、登场人物或出场角色名单的每一个独立称谓，以及拥有对白、独立动作或被单独指代的每一个角色，都必须逐项返回；不同姓名、称谓或编号的角色不得合并。原文以群体身份出场且需要画面表现时，也必须返回对应的群体角色资产。',
    '角色 role 只能是“主角”“配角”“反派”“路人”之一：故事核心主人公标记为主角，推动剧情但不与主角长期对立的重要人物标记为配角，主要阻碍或敌对人物标记为反派，纯背景人物标记为路人。',
    STORY_ASSET_VOICE_DESCRIPTION_RULE,
    '角色提示词必须具体描述年龄与地域特征、脸型、眉眼、瞳色、鼻形、唇形、肤色与肤质、发型发色、身材体态、服装分层与材质、鞋履和必要穿戴细节，并使用正面全身人物设定图构图；禁止只写性别、年龄和服装等概括词。',
    '角色提示词只用于生成独立人设图，不是人物剧照：聚焦脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身人物设定图构图，不写剧情道具、动作表演、地点、家具、其他人物或剧情场面。',
    '最终 prompt 只能写需要呈现的正向视觉内容，不得复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
    '每个场景资产只能表示一个可独立复用的物理空间；原文场景标题用“/”“／”等并列多个地点时，必须拆成多个原子场景资产，禁止把复合场景标题原样当作资产名称。',
    '场景提示词必须具体描述时代地点、空间用途、整体布局、前中后景、建筑或室内结构、表面材质、关键陈设、光源方向与色温、时间天气、色彩关系、镜头视角和景别，且默认无人；禁止只写地点与氛围。',
    '道具提示词必须具体描述用途、造型轮廓、尺寸比例、材质工艺、主辅颜色、纹样标识、磨损状态、关键结构和便于复用的产品设定构图，默认无人物手持。',
    '输入提供视觉风格时，每个 appearance prompt 必须逐字以完整视觉风格开头，后接资产描述；不得省略、改写或移动到提示词中部。',
    '所有引用的章节 ID 必须来自输入 chapters。',
    '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    '绝对不要复述、复制或改写输入剧本，也不要返回任务说明、输入参数或输出格式说明。',
    '返回 JSON 的顶层必须且只能包含 assets 字段；第一个字符必须是 {，最后一个字符必须是 }。',
  ].join('\n'),
  STORY_EPISODE_PLANNING_SYSTEM_PROMPT = [
    '你是专业的短剧分集策划 Agent。',
    '你的任务是把已经确认的故事规划成若干连续分集，不生成镜头或视频提示词。',
    '每集必须有清晰的推进、冲突或信息增量，并在自然节奏点结束。',
    'episodeCount 是目标分集数，不要求机械地精确凑满；应优先接近目标，通常保持在目标数的 90% 到 100%，且不得超过目标数。',
    '只有故事容量确实不足时才可低于建议范围；不得因输出篇幅、模型省略或提前收束剧情而大幅减少集数。',
    'sceneMaxSeconds 是后续单个视频片段的时长上限，不是整集时长。',
    '每集时长只能根据本集必要剧情、对白、动作、反应和自然停顿估算；不得套用固定集长，也不得为了接近某个秒数增加或删除剧情。',
    'assetRefs 必须逐字使用输入资产 ref，不得编造不存在的资产引用。',
    '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ].join('\n'),
  STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE =
    '时长按当前人物把对白和表演自然完成所需来判断。口播字数只是参考之一，同时结合人物性格、语速、情绪、句式、呼吸、动作、停顿和反应；同样字数可以说得快，也可以说得慢，表情、动作与反应也可以同步发生。每个 shot.d 直接给出足以让该镜头 q 与 o 自然说完并完成必要动作和反应的时长；当前片段容纳不下时，在自然叙事位置续到下一 clip。不得依靠不自然的高速口播塞入对白，也不要按固定字数或固定每秒字数计算。',
  STORY_EPISODE_SPLIT_GROUPING_GUIDANCE =
    'clip 表示一次可独立生成的连续叙事片段，shots 表示该片段内部按观看节奏切换的镜头。先确定 clip 的连续表演过程，再在每个 clip 内设计 shots；不要先逐个设计 shot 再把每个 shot 分别包装成 clip。相邻内容仍处于同一场景与时段，并共同完成一段连续动作、同一轮对话及其表情或反应时，把它们组织为同一 clip 的连续 shots。说话人、景别、机位、视角、构图、运镜、表情或反应镜头的变化属于 shot 层级，不会单独决定片段边界。进入新的场景或时空、动作与情绪自然转入新的叙事阶段，或继续组织将超过用户设置的单片最大时长时，再自然进入下一 clip；片段与镜头数量按正文实际结构自然决定。',
  STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE =
    '单片时长上限只是生成能力造成的技术切片边界，不是剧情重新开场。相邻内容仍在同一 sourceSceneRef 和连续时空时，后一片段必须从前一片段结束的可观察状态继续：继承人物位置、朝向、动作进度、情绪、视线、手持道具、车辆或设备状态及空间方向；不得让人物返回更早位置、重复已经完成的动作、复原已经改变的道具或重新建立场景，除非原文明确写出返回、重复、复原、换场或时间跳跃。',
  STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE =
    'scriptMode 为 plot（剧情模式）时，剧本中未标注说话人的普通动作和环境叙述用于设计画面 v，不作为可听见的解说。只有原剧本明确标注为旁白、画外音、VO 或 O.S. 的文字才放入 o；没有这种明确标注时 o 为空字符串。',
  STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE =
    'scriptMode 为 narration（解说模式）时，所有“旁白：”文本逐字放入对应 shot.o；shot.q 只保留原剧本已经存在的关键人物对白。',
  STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE =
    'q 中每段人物对白都必须明确保留原文说话人，使用“说话人姓名：对白原文”的格式；不得只写台词正文，也不得因画面中只有一个人物而省略姓名。没有人物对白时 q 为空字符串。',
  STORY_EPISODE_SPLIT_VISUAL_GUIDANCE =
    'shot.visual 是可直接交给 AI 视频模型执行的正向画面提示词，不是剧情摘要、文学描述或创作说明。把原文转译成摄像机实际可见、可连续生成的画面；每一个 shot.visual 都必须明确当前可见主体、人物位置与朝向、正在发生的具体动作或状态变化、表情与视线、必要的环境层次、道具互动、光影变化以及动作落点。环境、心理、背景和情绪信息只要有叙事价值，就必须转换为原文能够支持的可观察行为或画面变化；禁止只写“他很害怕”“气氛紧张”“她意识到危险”“内心挣扎”等抽象结论。对白或旁白镜头也必须有与语义同步的可见表演、听者反应或环境事件，不能只让人物站着说话或只复述台词。',
  STORY_EPISODE_SPLIT_CAMERA_GUIDANCE =
    '镜头语言根据当前剧情、动作和情绪选择观众的观察方式，可交代对本镜头有意义的景别、机位与角度、构图、运镜、焦点和落点。静止或运动镜头都可以；中景、平视、固定镜头在适合当前叙事时也是有效选择。',
  STORY_EPISODE_SPLIT_SYSTEM_PROMPT = [
    '把输入正文按原顺序直接整理为采用可执行视频描述方式的短剧视频片段，不分析、不续写。',
    '只返回一个完整、闭合的 JSON 对象；不要输出 Markdown、代码块、解释、注释或任何前后缀。',
    '格式只能是 {"clips":[{"s":"场景代码","shots":[{"d":镜头秒数,"v":"连续可观察画面","c":"景别、机位与运镜","q":"完整对白或空字符串","o":"完整旁白或空字符串","a":"必要音效或空字符串"},{"d":后续镜头秒数,"v":"后续连续可观察画面","c":"后续景别、机位与运镜","q":"完整对白或空字符串","o":"完整旁白或空字符串","a":"必要音效或空字符串"}]}]}。示意中的两个 shot 只展示同一 clip 内的层级关系，实际数量按当前片段内容自然确定；不得增加其他键。',
    'clips 中每一项是一个最终视频片段；s 必须逐字使用输入 scenes 中的 code，不得填写场景名称或编造代码。',
    '人物对白按原文顺序放入 q，旁白按原文顺序放入 o，都必须逐字完整保留；说出口或画外叙述的文字不得放入 v。',
    '严格读取输入 scriptMode，并按剧情模式或解说模式分别处理普通动作叙述与明确画外音。',
    STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
    STORY_EPISODE_SPLIT_VISUAL_GUIDANCE,
    STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
    '有对白时让人物表情、视线、姿态和动作与台词同步，听者反应按当前表演节拍自然安排；a 记录对画面有帮助的环境声、动作声和表演声。q、o、a 没有内容时返回空字符串。',
    '每镜内容与 d 保持自然匹配；保持原剧情事实和资产，不额外扩写事件、人物、能力、道具或结果，也不输出表头、序号、@、人物外貌或结构标签。',
    '忽略“（本集完）”“（全剧终）”“待续”等编辑标记；只有原文明示为屏幕字幕的文字才表现字幕。',
  ].join('\n'),
  STORY_EPISODES_SPLIT_SYSTEM_PROMPT = [
    '按输入剧本原顺序拆分分镜，不分析、不续写。',
    '严格读取输入 scriptMode，并按剧情模式或解说模式分别处理普通动作叙述与明确画外音。',
    STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
    STORY_EPISODE_SPLIT_VISUAL_GUIDANCE,
    STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
    '只返回一个完整 JSON 对象。',
  ].join('\n'),
  getStoryEpisodeSplitRequestSystemPrompt = ({
    compactPrompt: compactPrompt = false,
    promptMode: promptMode = 'seedance-2.0',
  } = {}) =>
    appendStoryEpisodePromptModeSystemPrompt(
      compactPrompt ? STORY_EPISODES_SPLIT_SYSTEM_PROMPT : STORY_EPISODE_SPLIT_SYSTEM_PROMPT,
      promptMode,
      { announceTimelineContract: true },
    ),
  STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT =
    '只检查并修复已有分镜结果的 JSON 格式和字段包装。不得增删、改写或重新生成分镜内容。只返回修复后的完整 JSON。',
  STORY_EPISODE_BATCHED_BLUEPRINT_SYSTEM_PROMPT = [
    '你是专业的短剧分镜总规划 Agent。',
    '你的任务是先为一整集建立连续片段蓝图，不写具体分镜、镜头语言或最终视频提示词。',
    '必须按原剧本顺序完整覆盖全部 sourceBeats；每个 sourceBeatRef 必须且只能出现一次，每个 clipPlan 代表一个之后会独立生成的视频片段。',
    '每个 clipPlan 只能覆盖同一个 sourceSceneRef 中连续的 sourceBeatRefs，换场必须新建 clipPlan。',
    'sourceBeat 用于跟踪原文覆盖，不直接决定片段边界；一个 clipPlan 可以承载多个相互关联的动作、对白和反应。',
    STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE,
    'entryState 与 exitState 必须明确记录人物位置、动作状态、情绪、视线、关键道具和空间方向，供后续分批生成保持连续。',
    '同一 sourceSceneRef 的相邻 clipPlan 必须形成状态链：后一项 entryState 逐项继承前一项 exitState，再从该状态推进当前 beat；禁止把每个 clipPlan 当成独立开场。',
    'beat、entryState、exitState 各只写一句必要信息，不复述原文，不输出镜头细节。',
    '不得新增输入中不存在的人物、对白、资产、事件、规则或结局。',
    '只返回严格 JSON，不要输出 Markdown、注释、说明或具体 shots。',
  ].join('\n'),
  STORY_EPISODE_BATCHED_EXPANSION_SYSTEM_PROMPT = [
    '你是专业的短剧分镜脚本 Agent。',
    '你当前只展开输入 batch.clipPlans，不重新规划整集；必须按给定顺序为每个计划准确返回一个同 ref 的 clip。',
    '返回的 clip 只是按 clipPlan 分开的中间展开容器，不直接提交给视频模型；客户端会把同场景的原子分镜按动作切点重组为最终视频段。',
    '每个 clip 只能绑定 clipPlan 指定的一个场景资产；至少一个 shot.assetUsages 必须引用该场景的 assetRef 和 appearanceRef。',
    '输出供客户端重组的原子分镜流，而不是最终视频段；正文中的完整对白或旁白发言单元在一个 shot.dialogue 或 shot.voiceover 中逐字保留。',
    STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE,
    '只有正文已经明确写出说话人停顿、动作介入、他人插话或新的独立引号发言时，才能建立新的发言分镜；不得依据逗号、字数、时长偏好或镜头数量自行给正文断句。',
    '如实规划每个 shot 的 durationSec；实验分批不限制单个 clip 的总时长，不得为了凑时长压缩对白、动作或表演停顿。',
    '每个 shot 可返回 cutAfter：完整发言结束后可用 preferred 或 allowed；完整发言尚未结束时必须为 forbidden。客户端只会在完整发言之间结合场景边界和时长上限完成最终分组。',
    STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
    '每个分镜中，画面实际出现的已登记角色必须来自 clipPlan.characterAssetRefs，并逐个把具体 appearanceRef 写入 shot.assetRefs；资产没有形象时才写 assetRef。角色只在 visual 首次出现时使用 assets[].name，后续优先使用他/她/该角色；存在指代歧义时使用普通姓名。dialogue 的说话人标签始终使用普通姓名，任何文本字段都不要输出 @。',
    '只返回生成当前分镜必需的紧凑字段；script、creativeIntent、transition 和 time 由客户端依据蓝图本地补全。' +
      STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
      ' camera 聚焦当前分镜的观察方式。',
    'shot.audio 只写必要的环境声、动作音效和可听见的表演声；允许呼吸、喘息、啜泣、衣物摩擦等与当前动作直接相关的声音。禁止固定人物音色设定、对白内容复述和脱离剧情的配乐分析；没有必要音效时返回空字符串。',
    '不得使用‘上一片段’‘下一片段’等外部上下文表达；连续状态要直接改写为当前 clip 内可观察的起始状态。',
    '不得新增输入中不存在的人物、对白、资产、事件、规则或结局。',
    '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ].join('\n'),
  STORY_EPISODE_DIRECTOR_CONTINUITY_BLUEPRINT_SYSTEM_PROMPT = [
    STORY_EPISODE_BATCHED_BLUEPRINT_SYSTEM_PROMPT,
    '当前是开发测试专用的导演连续性提示词实验。',
    '除人物空间状态外，为每个 clipPlan 返回 openingShotIntent 与 closingShotIntent，用来表达镜头的叙事关注点和与相邻计划的画面关系；具体观察方式由剧情和表演决定。',
    '场景图片是固定空间锚点，人物位置必须使用可观察地标描述；镜头变化不得镜像或重构场景。',
  ].join('\n'),
  STORY_EPISODE_DIRECTOR_CONTINUITY_EXPANSION_SYSTEM_PROMPT = [
    STORY_EPISODE_BATCHED_EXPANSION_SYSTEM_PROMPT,
    '当前是开发测试专用的导演连续性提示词实验。',
    '由你根据剧情和表演自主设计镜头数量、角度、构图、运镜和剪辑方式。',
    '每个 shot 必须返回 transitionFromPrevious，说明切镜、动作匹配、视线匹配、反应镜头、道具插入或连续长镜等衔接选择及叙事原因。',
    '避免无动机地连续重复同一主体、景别、机位和构图；也不要把普通争吵默认处理成双人纯侧面一镜到底。',
  ].join('\n'),
  getStoryEpisodeExperimentalExpansionSystemPrompt = ({
    promptExperiment: promptExperiment = false,
    promptMode: promptMode = 'seedance-2.0',
  } = {}) =>
    appendStoryEpisodePromptModeSystemPrompt(
      promptExperiment
        ? STORY_EPISODE_DIRECTOR_CONTINUITY_EXPANSION_SYSTEM_PROMPT
        : STORY_EPISODE_BATCHED_EXPANSION_SYSTEM_PROMPT,
      promptMode,
    );
function createStoryEpisodeExperimentalStructuredOutput(name, schema) {
  return { name: name, schema: schema, strict: true, fallback: 'prompt' };
}
function normalizeStoryContinuityFacts(value) {
  return normalizeStringArray(value).slice(0, STORY_CONTINUITY_MAX_FACTS);
}
function normalizeStoryContinuityState(options = {}) {
  const item = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
  return {
    characters: normalizeStringArray(item.characters || item.characterStates).slice(
      0,
      STORY_CONTINUITY_MAX_CHARACTER_STATES,
    ),
    props: normalizeStringArray(item.props || item.propStates || item.items).slice(
      0,
      STORY_CONTINUITY_MAX_PROP_STATES,
    ),
    unresolvedThreads: normalizeStringArray(
      item.unresolvedThreads || item.threads || item.openThreads,
    ).slice(0, STORY_CONTINUITY_MAX_UNRESOLVED_THREADS),
  };
}
function hasStoryContinuityState(options2 = {}) {
  const storyContinuityState = normalizeStoryContinuityState(options2);
  return (
    storyContinuityState.characters.length > 0 ||
    storyContinuityState.props.length > 0 ||
    storyContinuityState.unresolvedThreads.length > 0
  );
}
function normalizeStoryProjectInput(options3 = {}) {
  const chapters = Array.isArray(options3?.chapters)
    ? options3.chapters
        .map((key, data) => ({
          id: normalizeText(key?.id) || 'chapter-' + (data + 1),
          title: normalizeText(key?.title),
          content: normalizeText(key?.content),
        }))
        .filter((target) => target.title || target.content)
    : [];
  return {
    title: normalizeText(options3?.title),
    storyType: normalizeText(options3?.storyType),
    summary: normalizeText(options3?.summary || options3?.storySummary),
    background: normalizeText(options3?.background || options3?.storyBackground),
    setting: normalizeText(options3?.setting || options3?.storySetting),
    logline: normalizeText(options3?.logline),
    scriptMode: normalizeStoryScriptMode(options3?.scriptMode),
    aspectRatio: normalizeText(options3?.aspectRatio) || '16:9',
    visualStyle: normalizeText(
      options3?.videoStylePrompt || options3?.visualStyle || options3?.videoStyle,
    ),
    promptMode: normalizeText(options3?.planning?.promptMode).toLowerCase() || 'seedance-2.0',
    chapters: chapters,
    planning: normalizeStoryPlanningConstraints(options3?.planning),
  };
}
function assertStoryProjectInput(enabled) {
  if (!enabled.title || !enabled.chapters.length) throw new Error('请先完成故事大纲和章节内容。');
}
function resolveStoryPlanningConstraints(options4 = {}, source = {}) {
  const next =
    source &&
    typeof source === 'object' &&
    (Object.prototype.hasOwnProperty.call(source, 'episodeCount') ||
      Object.prototype.hasOwnProperty.call(source, 'sceneMaxSeconds'));
  return validateStoryPlanningConstraints(next ? source : options4?.planning);
}
function resolveStoryPromptMode(options5 = {}, current = {}) {
  const text = normalizeText(current?.promptMode).toLowerCase();
  return text || normalizeText(options5?.planning?.promptMode).toLowerCase() || 'seedance-2.0';
}
function normalizeStoryMode(record) {
  return record === 'upload' ? 'upload' : 'generate';
}
function stringifyStoryEpisodeDevResponse(payload) {
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload || '');
  }
}
export function captureStoryEpisodeScriptDevResponse({
  response: response,
  attempt: attempt = 1,
  episodeRef: episodeRef = '',
  episodeNumber: episodeNumber = 1,
  model: model = '',
  provider: provider = '',
  windowObject: windowObject = globalThis.window,
  consoleObject: consoleObject = globalThis.console,
  capturedAt: capturedAt = new Date().toISOString(),
} = {}) {
  if (windowObject?.AI_CANVAS_IS_DEV_BUILD !== true) return null;
  const handle = {
      capturedAt: normalizeText(capturedAt),
      attempt: Math.max(1, Math.trunc(Number(attempt) || 1)),
      episodeRef: normalizeText(episodeRef),
      episodeNumber: Math.max(1, Math.trunc(Number(episodeNumber) || 1)),
      model: normalizeText(model),
      provider: normalizeText(provider),
      responseText: stringifyStoryEpisodeDevResponse(getResultText(response)),
    },
    args = Array.isArray(windowObject.__AIC_DEV_EPISODE_SCRIPT_RESPONSES__)
      ? windowObject.__AIC_DEV_EPISODE_SCRIPT_RESPONSES__
      : [];
  return (
    (windowObject.__AIC_DEV_EPISODE_SCRIPT_RESPONSES__ = [...args, handle].slice(
      -STORY_EPISODE_DEV_RESPONSE_HISTORY_LIMIT,
    )),
    consoleObject?.info?.('[storyWorkspace][episode-script][dev-response]', handle),
    handle
  );
}
function countStoryChapterCharacters(state) {
  return Array.from(normalizeText(state).replace(/\s/g, '')).length;
}
export function parseStoryGenerationResult(
  config,
  {
    minChapters: minChapters = 1,
    minChapterCharacters: minChapterCharacters = 0,
    maxChapterCharacters: maxChapterCharacters = Number.POSITIVE_INFINITY,
  } = {},
) {
  const strictJson = parseStrictJson(getResultText(config), 'Agent 未返回剧情内容。'),
    title = normalizeText(strictJson.title),
    storyType = normalizeText(strictJson.storyType),
    storySummary = normalizeText(strictJson.storySummary),
    storyBackground = normalizeText(strictJson.storyBackground),
    storySetting = normalizeText(strictJson.storySetting),
    logline = normalizeText(strictJson.logline),
    chapters2 = Array.isArray(strictJson.chapters)
      ? strictJson.chapters
          .map((scope) => ({
            title: normalizeText(scope?.title),
            content: normalizeText(scope?.content),
          }))
          .filter((input) => input.title && input.content)
      : [];
  if (!title) throw new Error('Agent 返回结果缺少故事标题。');
  if (!storyType) throw new Error('Agent 返回结果缺少故事类型。');
  if (!storySummary) throw new Error('Agent 返回结果缺少故事梗概。');
  if (!storyBackground) throw new Error('Agent 返回结果缺少故事背景。');
  if (!storySetting) throw new Error('Agent 返回结果缺少故事设定。');
  if (!logline) throw new Error('Agent 返回结果缺少一句话故事。');
  const output = Math.max(1, Math.trunc(Number(minChapters) || 1));
  if (chapters2.length < output) throw new Error('Agent 返回的有效章节不足 ' + output + ' 章。');
  const value2 = Math.max(0, Math.trunc(Number(minChapterCharacters) || 0)),
    value3 = Number(maxChapterCharacters),
    value4 = Number.isFinite(value3)
      ? Math.max(value2, Math.trunc(value3))
      : Number.POSITIVE_INFINITY;
  for (const value5 of chapters2) {
    const countStoryChapterCharacters2 = countStoryChapterCharacters(value5.content);
    if (countStoryChapterCharacters2 < value2)
      throw new Error(
        'Agent 返回的章节“' +
          value5.title +
          '”正文不足 ' +
          value2 +
          ' 个字（当前 ' +
          countStoryChapterCharacters2 +
          ' 个字）。',
      );
    if (countStoryChapterCharacters2 > value4)
      throw new Error(
        'Agent 返回的章节“' +
          value5.title +
          '”正文超过 ' +
          value4 +
          ' 个字（当前 ' +
          countStoryChapterCharacters2 +
          ' 个字）。',
      );
  }
  return {
    schemaVersion: STORY_GENERATION_SCHEMA_VERSION,
    title: title,
    storyType: storyType,
    storySummary: storySummary,
    storyBackground: storyBackground,
    storySetting: storySetting,
    logline: logline,
    chapters: chapters2,
  };
}
export function splitStorySourceText(value6, value7 = STORY_SOURCE_CHUNK_CHARACTERS) {
  const list = normalizeText(value6),
    value8 = Math.max(2000, Math.trunc(Number(value7) || 0));
  if (!list) return [];
  if (list.length <= value8) return [list];
  const list2 = [];
  let value9 = 0;
  while (value9 < list.length) {
    let value10 = Math.min(list.length, value9 + value8);
    if (value10 < list.length) {
      const value11 = list.lastIndexOf('\n', value10);
      if (value11 > value9 + Math.floor(value8 * 0.55)) value10 = value11;
    }
    (list2.push(list.slice(value9, value10).trim()), (value9 = value10));
    while (list[value9] === '\n' || list[value9] === '\r') value9 += 1;
  }
  return list2.filter(Boolean);
}
export function buildStoryGenerationPrompt({
  mode: mode = 'generate',
  idea: idea = '',
  sourceText: sourceText = '',
  fileName: fileName = '',
  sourceDigests: sourceDigests = [],
  aspectRatio: aspectRatio = '16:9',
  visualStyle: visualStyle = '',
  planning: planning = {},
} = {}) {
  const mode2 = normalizeStoryMode(mode),
    idea2 = normalizeText(idea),
    sourceText2 = normalizeText(sourceText),
    sourceDigests2 = Array.isArray(sourceDigests) ? sourceDigests : [],
    args2 = validateStoryPlanningConstraints(planning);
  if (mode2 === 'generate' && !idea2) throw new Error('请先输入故事设定。');
  if (mode2 === 'upload' && !sourceText2 && sourceDigests2.length === 0)
    throw new Error('没有可供整理的剧本文本。');
  const modeInstruction =
    mode2 === 'upload'
      ? '在不改变原文人物姓名、人物关系、关键事件和结局的前提下，整理因果逻辑、补足必要衔接并统一表达；原文未明确的信息应保守处理，不得擅自重写核心剧情。'
      : '根据用户提供的故事设定扩写为完整剧情；可以补充必要人物与事件，但所有新增内容必须服务于主角目标和核心冲突。';
  return JSON.stringify({
    task: 'create_story',
    schemaVersion: STORY_GENERATION_SCHEMA_VERSION,
    mode: mode2,
    modeInstruction: modeInstruction,
    visualDirection: {
      aspectRatio: normalizeText(aspectRatio) || '16:9',
      style: normalizeText(visualStyle),
      instruction: '视觉方向仅用于让人物、场景与叙事氛围保持一致，不要输出绘图提示词或创作说明。',
    },
    pacingConstraints: {
      ...args2,
      instruction:
        'episodeCount 和 sceneMaxSeconds 均为上限，仅用于控制故事容量和节奏；当前任务仍只输出完整故事，不输出分集或分镜。',
    },
    writingRequirements: [
      '故事梗概建议 250 至 500 个汉字，必须包含结局，不能只写悬念。',
      '每章正文必须为 ' +
        STORY_CHAPTER_MIN_CHARACTERS +
        ' 至 ' +
        STORY_CHAPTER_MAX_CHARACTERS +
        ' 个汉字，每章都要有清晰主标题；不能用提纲、重复句或无意义内容凑字数。',
      '开篇尽快建立人物、处境和触发事件。',
      '中段通过行动与代价升级冲突，避免只有设定介绍。',
      '高潮必须由前文因果推动，结局回应主角目标并完成主要人物弧光。',
      '不要生成分镜编号、镜头语言、绘图提示词、资产清单或分集标题。',
      mode2 === 'generate'
        ? 'AI 写故事模式必须生成至少 3 章，每章都要有独立主标题和完整正文。'
        : '上传文案模式不固定章节数量，由原文结构与叙事节奏决定应拆成多少章，不得为了凑数强行拆章。',
    ],
    input:
      mode2 === 'upload'
        ? { fileName: normalizeText(fileName), sourceText: sourceText2, sourceDigests: sourceDigests2 }
        : { idea: idea2 },
    outputSchema: {
      title: '故事标题，字符串',
      storyType: '故事类型，字符串，例如悬疑、都市奇幻、科幻',
      storySummary: '故事梗概，字符串',
      storyBackground: '故事背景，字符串',
      storySetting: '故事设定，字符串',
      logline: '一句话故事，字符串',
      chapters: [{ title: '章节主标题', content: '章节正文' }],
    },
  });
}
function buildStorySourceDigestPrompt(text2, index2, total) {
  return JSON.stringify({
    task: 'digest_story_source_chunk',
    chunk: { index: index2 + 1, total: total, text: text2 },
    requirements: [
      '按原文记录本段出现的人物、身份、关系与动机。',
      '按发生顺序记录关键事件、选择、结果和伏笔。',
      '记录场景、时间及与前后文衔接所需的信息。',
      '不得续写，不得修改原文事实。',
    ],
    outputSchema: {
      characters: ['人物及关系'],
      settings: ['时间与场景'],
      events: ['按顺序排列的事件'],
      continuity: '未解决冲突、伏笔及承接信息',
      endingState: '本段结束时人物与事件状态',
    },
  });
}
function parseStorySourceDigest(value12) {
  const strictJson2 = parseStrictJson(getResultText(value12), 'Agent 未返回剧本分段摘要。');
  return {
    characters: Array.isArray(strictJson2.characters)
      ? strictJson2.characters.map(normalizeText).filter(Boolean)
      : [],
    settings: Array.isArray(strictJson2.settings)
      ? strictJson2.settings.map(normalizeText).filter(Boolean)
      : [],
    events: Array.isArray(strictJson2.events)
      ? strictJson2.events.map(normalizeText).filter(Boolean)
      : [],
    continuity: normalizeText(strictJson2.continuity),
    endingState: normalizeText(strictJson2.endingState),
  };
}
export async function generateStoryDraft({
  mode: mode = 'generate',
  idea: idea = '',
  sourceText: sourceText = '',
  fileName: fileName = '',
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  aspectRatio: aspectRatio = '16:9',
  visualStyle: visualStyle = '',
  planning: planning = {},
  request: request = generateText,
  onProgress: onProgress = null,
} = {}) {
  const message = normalizeStoryMode(mode),
    model2 = normalizeText(model),
    provider2 = normalizeText(provider);
  if (!model2 || !provider2) throw new Error('请先选择可用的文本模型。');
  let sourceDigests3 = [],
    sourceText3 = normalizeText(sourceText);
  if (message === 'upload' && sourceText3.length > STORY_SOURCE_CHUNK_CHARACTERS) {
    const total2 = splitStorySourceText(sourceText3);
    for (let current2 = 0; current2 < total2.length; current2 += 1) {
      onProgress?.({
        stage: 'digesting',
        current: current2 + 1,
        total: total2.length,
        message: '正在整理剧本 ' + (current2 + 1) + '/' + total2.length,
      });
      const prompt2 = buildStorySourceDigestPrompt(total2[current2], current2, total2.length),
        args3 = await requestStrictResult({
          request: request,
          requestPayload: {
            model: model2,
            provider: provider2,
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: prompt2,
            systemPrompt: STORY_SOURCE_DIGEST_SYSTEM_PROMPT,
            temperature: 0.1,
            timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
          },
          parse: parseStorySourceDigest,
          outputContract: 'characters/settings/events arrays and continuity/endingState strings',
        });
      sourceDigests3.push({ part: current2 + 1, ...args3 });
    }
    sourceText3 = '';
  }
  onProgress?.({
    stage: 'writing',
    current: 1,
    total: 1,
    message: message === 'upload' ? '正在整理故事内容' : '正在创建完整剧情',
  });
  const prompt3 = buildStoryGenerationPrompt({
    mode: message,
    idea: idea,
    sourceText: sourceText3,
    fileName: fileName,
    sourceDigests: sourceDigests3,
    aspectRatio: aspectRatio,
    visualStyle: visualStyle,
    planning: planning,
  });
  return await requestStrictResult({
    request: request,
    requestPayload: {
      model: model2,
      provider: provider2,
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: prompt3,
      systemPrompt: STORY_GENERATION_SYSTEM_PROMPT,
      temperature: message === 'upload' ? 0.35 : 0.7,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
    },
    parse: (value13) =>
      parseStoryGenerationResult(value13, {
        minChapters: message === 'generate' ? 3 : 1,
        minChapterCharacters: STORY_CHAPTER_MIN_CHARACTERS,
        maxChapterCharacters: STORY_CHAPTER_MAX_CHARACTERS,
      }),
    outputContract:
      message === 'generate'
        ? 'title/storyType/storySummary/storyBackground/storySetting/logline strings and at least 3 chapters[{title,content}], with each content containing ' +
          STORY_CHAPTER_MIN_CHARACTERS +
          '-' +
          STORY_CHAPTER_MAX_CHARACTERS +
          ' characters'
        : 'title/storyType/storySummary/storyBackground/storySetting/logline strings and agent-determined chapters[{title,content}], with each content containing ' +
          STORY_CHAPTER_MIN_CHARACTERS +
          '-' +
          STORY_CHAPTER_MAX_CHARACTERS +
          ' characters',
  });
}
const storySummaryBlueprint = createStorySummaryBlueprint({
    normalizeStoryScriptMode: normalizeStoryScriptMode,
    validateStoryPlanningConstraints: validateStoryPlanningConstraints,
    continuityMaxFacts: STORY_CONTINUITY_MAX_FACTS,
  }),
  { normalizeStoryContract, normalizeStoryPlotBeat, normalizeStorySummaryCharacter } = storySummaryBlueprint;
export const buildStorySummaryPrompt = storySummaryBlueprint.buildStorySummaryPrompt;
export const parseStorySummaryResult = storySummaryBlueprint.parseStorySummaryResult;
const storySummaryGenerationApi = createStorySummaryGenerationApi({
  generateText: generateText,
  assertPlanningModel: assertPlanningModel,
  normalizeText: normalizeText,
  splitStorySourceText: splitStorySourceText,
  sourceChunkCharacters: STORY_SOURCE_CHUNK_CHARACTERS,
  buildStorySourceDigestPrompt: buildStorySourceDigestPrompt,
  parseStorySourceDigest: parseStorySourceDigest,
  sourceDigestSystemPrompt: STORY_SOURCE_DIGEST_SYSTEM_PROMPT,
  summarySystemPrompt: STORY_SUMMARY_SYSTEM_PROMPT,
  textRequestTimeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
  textMaxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
  buildStoryTextProviderProfilePayload: buildStoryTextProviderProfilePayload,
  requestStrictResult: requestStrictResult,
  createStoryInvocationLifecycle: createStoryInvocationLifecycle,
  getResultText: getResultText,
  storySummaryBlueprint: storySummaryBlueprint,
  defaultScriptMode: STORY_SCRIPT_MODE_PLOT,
});
export const generateStorySummary = storySummaryGenerationApi.generateStorySummary;
const storyEpisodeScriptPromptApi = createStoryEpisodeScriptPromptApi({
  normalizeText: normalizeText,
  normalizeStringArray: normalizeStringArray,
  normalizePositiveNumber: normalizePositiveNumber,
  normalizeStoryScriptMode: normalizeStoryScriptMode,
  normalizeStorySummaryCharacter: normalizeStorySummaryCharacter,
  normalizeStoryContinuityFacts: normalizeStoryContinuityFacts,
  normalizeStoryContinuityState: normalizeStoryContinuityState,
  createStoryEpisodeScriptRuntimeGuidance: createStoryEpisodeScriptRuntimeGuidance,
  schemaVersion: STORY_EPISODE_SCRIPT_SCHEMA_VERSION,
  narrationMode: STORY_SCRIPT_MODE_NARRATION,
});
export const buildStoryEpisodeScriptPrompt = storyEpisodeScriptPromptApi.buildPrompt;
const buildStoryEpisodeScriptContentRevisionPrompt =
    storyEpisodeScriptPromptApi.buildContentRevisionPrompt,
  storyClipAdjustmentApi = createStoryClipAdjustmentApi({
    generateText: generateText,
    parseStrictJson: parseStrictJson,
    normalizeText: normalizeText,
    normalizePositiveNumber: normalizePositiveNumber,
    getResultText: getResultText,
    assertPlanningModel: assertPlanningModel,
    buildStoryTextProviderProfilePayload: buildStoryTextProviderProfilePayload,
    requestStrictResult: requestStrictResult,
    requestTimeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
  });
export const adjustStoryClipPrompt = storyClipAdjustmentApi.adjustStoryClipPrompt;
export const buildStoryClipAdjustmentPrompt = storyClipAdjustmentApi.buildStoryClipAdjustmentPrompt;
export const parseStoryClipAdjustmentResult = storyClipAdjustmentApi.parseStoryClipAdjustmentResult;
const storyEpisodeOutlinePlanningApi = createStoryEpisodeOutlinePlanningApi({
    generateText: generateText,
    parseStrictJson: parseStrictJson,
    normalizeText: normalizeText,
    normalizeStringArray: normalizeStringArray,
    normalizeStoryContinuityFacts: normalizeStoryContinuityFacts,
    normalizeStoryContinuityState: normalizeStoryContinuityState,
    hasStoryContinuityState: hasStoryContinuityState,
    normalizePositiveNumber: normalizePositiveNumber,
    normalizeStorySummaryCharacter: normalizeStorySummaryCharacter,
    normalizeStoryContract: normalizeStoryContract,
    normalizeStoryPlotBeat: normalizeStoryPlotBeat,
    normalizeStoryScriptMode: normalizeStoryScriptMode,
    normalizeStoryPlanningConstraints: normalizeStoryPlanningConstraints,
    resolveStoryPlanningConstraints: resolveStoryPlanningConstraints,
    getResultText: getResultText,
    assertPlanningModel: assertPlanningModel,
    buildStoryTextProviderProfilePayload: buildStoryTextProviderProfilePayload,
    requestStrictResult: requestStrictResult,
    STORY_EPISODE_OUTLINE_SCHEMA_VERSION: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
    STORY_SCRIPT_MODE_NARRATION: STORY_SCRIPT_MODE_NARRATION,
    STORY_EPISODE_OUTLINE_BATCH_SIZE: STORY_EPISODE_OUTLINE_BATCH_SIZE,
    STORY_SUMMARY_MAX_PLOT_BEATS: STORY_SUMMARY_MAX_PLOT_BEATS,
    STORY_CONTINUITY_MAX_FACTS: STORY_CONTINUITY_MAX_FACTS,
    STORY_CONTINUITY_MAX_CHARACTER_STATES: STORY_CONTINUITY_MAX_CHARACTER_STATES,
    STORY_CONTINUITY_MAX_PROP_STATES: STORY_CONTINUITY_MAX_PROP_STATES,
    STORY_CONTINUITY_MAX_UNRESOLVED_THREADS: STORY_CONTINUITY_MAX_UNRESOLVED_THREADS,
    STORY_TEXT_REQUEST_TIMEOUT_MS: STORY_TEXT_REQUEST_TIMEOUT_MS,
    STORY_TEXT_MAX_OUTPUT_TOKENS: STORY_TEXT_MAX_OUTPUT_TOKENS,
  }),
  { buildStoryNarrativeSummary } = storyEpisodeOutlinePlanningApi;
export const buildStoryEpisodeOutlinePrompt =
  storyEpisodeOutlinePlanningApi.buildStoryEpisodeOutlinePrompt;
export const parseStoryEpisodeOutlineSkeletonResult =
  storyEpisodeOutlinePlanningApi.parseStoryEpisodeOutlineSkeletonResult;
export const createStoryEpisodeOutlineBatches =
  storyEpisodeOutlinePlanningApi.createStoryEpisodeOutlineBatches;
export const buildStoryEpisodeOutlineBatchPrompt =
  storyEpisodeOutlinePlanningApi.buildStoryEpisodeOutlineBatchPrompt;
export const parseStoryEpisodeOutlineBatchResult =
  storyEpisodeOutlinePlanningApi.parseStoryEpisodeOutlineBatchResult;
export const parseStoryEpisodeOutlineResult =
  storyEpisodeOutlinePlanningApi.parseStoryEpisodeOutlineResult;
export const planStoryEpisodeOutlines = storyEpisodeOutlinePlanningApi.planStoryEpisodeOutlines;
function formatEpisodeSceneText(dom, value14, value15) {
  const value16 = dom.characters.length ? '\n出场人物：' + dom.characters.join('、') : '';
  return (
    '### 场' + value14 + '-' + (value15 + 1) + '\n' + dom.heading + value16 + '\n' + dom.body
  );
}
function normalizeStoryEpisodeScriptDialogueContent(value17 = '') {
  const text3 = normalizeText(value17);
  if (!text3) return text3;
  const value18 = text3.match(/^((?:(?:（[^）]*）|\([^)]*\))\s*)+)([\s\S]+)$/u),
    text4 = normalizeText(value18?.[1]),
    text5 = normalizeText(value18?.[2] || text3);
  if (!text5) return text3;
  const value19 = text5.match(/^(?:“([\s\S]*)”|「([\s\S]*)」|『([\s\S]*)』|"([\s\S]*)")$/u);
  if (value19) {
    const text6 = normalizeText(value19[1] || value19[2] || value19[3] || value19[4]);
    return text4 + '“' + text6 + '”';
  }
  if (/[“”「」『』"]/u.test(text5)) return text3;
  return text4 + '“' + text5 + '”';
}
function normalizeStoryEpisodeScriptSceneBody(value20 = '', value21 = []) {
  const map = new Set(normalizeStringArray(value21)),
    map2 = new Set(['旁白', '画外音', '音效', '屏幕字幕', '字幕', '时间', '地点', '场景']);
  return String(value20 || '')
    .split(/\r?\n/u)
    .flatMap((value22) => {
      const enabled2 = value22.trim();
      if (!enabled2) return [''];
      if (isStoryEpisodeEditorialMarker(enabled2)) return [];
      const enabled3 = enabled2.match(/^([^：:\n]{1,40})[：:]\s*(.+)$/u),
        text7 = normalizeText(enabled3?.[1]);
      if (!enabled3 || !map.has(text7) || map2.has(text7)) return [enabled2];
      const storyEpisodeScriptDialogueContent = normalizeStoryEpisodeScriptDialogueContent(enabled3[2]);
      return [text7 + '：' + storyEpisodeScriptDialogueContent];
    })
    .join('\n')
    .replace(/\n{2,}/gu, '\n')
    .trim();
}
function normalizeStoryEpisodeScriptCharacters(value23) {
  if (Array.isArray(value23)) return normalizeStringArray(value23);
  return normalizeStringArray(
    normalizeText(value23)
      .split(/[、，,;/|]+/u)
      .map((value24) => value24.trim()),
  );
}
function normalizeStoryEpisodeScriptBodyValue(list3) {
  if (Array.isArray(list3))
    return list3.map((value25) => normalizeText(value25))
      .filter(Boolean)
      .join('\n');
  if (list3 && typeof list3 === 'object')
    return normalizeText(list3.text || list3.content || list3.body);
  return normalizeText(list3);
}
function getStoryEpisodeScriptSceneEntries(options6 = {}) {
  const value26 = options6 && typeof options6 === 'object' && !Array.isArray(options6) ? options6 : {},
    list4 = [
      value26.scenes,
      value26.sceneList,
      value26.scene_list,
      value26.scriptScenes,
      value26.script_scenes,
    ];
  return list4.find(Array.isArray) || [];
}
function findStoryEpisodeScriptPayload(value27) {
  const list5 = [value27],
    map3 = new Set();
  let value28 = null;
  while (list5.length) {
    const scenes = list5.shift();
    if (Array.isArray(scenes)) return { scenes: scenes };
    if (!scenes || typeof scenes !== 'object' || map3.has(scenes)) continue;
    (map3.add(scenes), (value28 ||= scenes));
    if (getStoryEpisodeScriptSceneEntries(scenes).length) return scenes;
    ['result', 'data', 'output', 'response', 'episode', 'script'].forEach((value29) => {
      const value30 = scenes[value29];
      if (value30 && typeof value30 === 'object') list5.push(value30);
    });
  }
  return value28 || {};
}
function extractStoryEpisodeScriptStringProperty(value31, value32 = []) {
  for (const value33 of value32) {
    const extractJsonStringProperty2 = extractJsonStringProperty(value31, value33);
    if (extractJsonStringProperty2) return extractJsonStringProperty2;
  }
  return '';
}
function isStoryEpisodeScriptArrayClosed(value34, enabled4) {
  const list6 = getResultText(value34);
  if (typeof list6 !== 'string' || !list6 || !enabled4) return false;
  const list7 = '"' + enabled4 + '"',
    count = list6.indexOf(list7);
  if (count < 0) return false;
  const count2 = list6.indexOf(':', count + list7.length),
    count3 = count2 >= 0 ? list6.indexOf('[', count2 + 1) : -1;
  if (count3 < 0) return false;
  let count4 = 0,
    value35 = false,
    value36 = false;
  for (let value37 = count3; value37 < list6.length; value37 += 1) {
    const value38 = list6[value37];
    if (value35) {
      if (value36) value36 = false;
      else {
        if (value38 === '\\') value36 = true;
        else {
          if (value38 === '"') value35 = false;
        }
      }
      continue;
    }
    if (value38 === '"') {
      value35 = true;
      continue;
    }
    if (value38 === '[') count4 += 1;
    else {
      if (value38 === ']') {
        count4 -= 1;
        if (count4 === 0) return true;
      }
    }
  }
  return false;
}
function parseStoryEpisodeScriptPayload(value39) {
  const resultText = getResultText(value39),
    response2 = repairStoryEpisodeScriptMissingBodyTerminators(resultText),
    value40 = response2.repairedCount ? response2.text : resultText;
  let strictJson3 = null,
    value41 = null;
  const recovery = response2.repairedCount;
  try {
    strictJson3 = parseStrictJson(value40, 'Agent 未返回完整分集剧本。');
  } catch (value42) {
    value41 = value42;
  }
  let storyEpisodeScriptPayload = findStoryEpisodeScriptPayload(strictJson3),
    scenes2 = getStoryEpisodeScriptSceneEntries(storyEpisodeScriptPayload),
    mode3 = false,
    isStoryEpisodeScriptArrayClosed2 = false;
  if (!scenes2.length)
    for (const value43 of ['scenes', 'sceneList', 'scene_list', 'scriptScenes', 'script_scenes']) {
      const list8 = extractCompleteJsonArrayItems(value40, value43);
      if (!list8.length) continue;
      ((scenes2 = list8),
        (isStoryEpisodeScriptArrayClosed2 = isStoryEpisodeScriptArrayClosed(value40, value43)),
        (mode3 = !isStoryEpisodeScriptArrayClosed2));
      break;
    }
  if (!scenes2.length && value41) throw value41;
  return {
    data: {
      ...(storyEpisodeScriptPayload &&
      typeof storyEpisodeScriptPayload === 'object' &&
      !Array.isArray(storyEpisodeScriptPayload)
        ? storyEpisodeScriptPayload
        : {}),
      episodeRef: normalizeText(
        storyEpisodeScriptPayload?.episodeRef ||
          storyEpisodeScriptPayload?.episodeId ||
          storyEpisodeScriptPayload?.episode_id ||
          extractStoryEpisodeScriptStringProperty(value40, ['episodeRef', 'episodeId', 'episode_id']),
      ),
      title: normalizeText(
        storyEpisodeScriptPayload?.title ||
          storyEpisodeScriptPayload?.episodeTitle ||
          storyEpisodeScriptPayload?.episode_title ||
          extractStoryEpisodeScriptStringProperty(value40, ['title', 'episodeTitle', 'episode_title']),
      ),
      scenes: scenes2,
    },
    recovery:
      recovery && strictJson3
        ? {
            mode: 'missing-scene-body-string-terminators',
            incompleteJson: false,
            repairedBodyTerminators: recovery,
          }
        : mode3 || isStoryEpisodeScriptArrayClosed2
          ? {
              mode: mode3
                ? 'complete-scenes-from-incomplete-json'
                : 'complete-scenes-from-invalid-json-shell',
              incompleteJson: mode3,
            }
          : null,
  };
}
export function parseStoryEpisodeScriptResult(
  value44,
  {
    episodeRef: episodeRef = 'episode-1',
    episodeNumber: episodeNumber = 1,
    episodeTitle: episodeTitle = '',
    requireEndingState: requireEndingState = false,
    fallbackContinuityFacts: fallbackContinuityFacts = [],
    fallbackEndingState: fallbackEndingState = null,
  } = {},
) {
  const { data: data2, recovery: recovery2 } = parseStoryEpisodeScriptPayload(value44),
    episodeRef2 =
      normalizeText(data2.episodeRef || data2.episodeId || data2.episode_id) ||
      normalizeText(episodeRef) ||
      'episode-1';
  if (normalizeText(episodeRef) && episodeRef2 !== normalizeText(episodeRef))
    throw new Error('Agent 返回的分集引用与请求不一致。');
  const title2 =
      normalizeText(data2.title || data2.episodeTitle || data2.episode_title) ||
      normalizeText(episodeTitle) ||
      '第 ' + episodeNumber + ' 集',
    list9 = getStoryEpisodeScriptSceneEntries(data2),
    scenes3 = list9.length
      ? list9.map((dom2, value45) => {
          const characters2 = normalizeStoryEpisodeScriptCharacters(
            dom2?.characters ||
              dom2?.characterNames ||
              dom2?.character_names ||
              dom2?.cast ||
              dom2?.roles,
          );
          return {
            ref:
              normalizeText(dom2?.ref || dom2?.sceneRef || dom2?.scene_ref || dom2?.id) ||
              episodeRef2 + '-scene-' + (value45 + 1),
            heading: normalizeText(
              dom2?.heading ||
                dom2?.sceneHeading ||
                dom2?.scene_heading ||
                dom2?.location ||
                dom2?.title,
            ),
            characters: characters2,
            body: normalizeStoryEpisodeScriptSceneBody(
              normalizeStoryEpisodeScriptBodyValue(
                dom2?.body || dom2?.content || dom2?.script || dom2?.text,
              ),
              characters2,
            ),
          };
        }).filter((dom3) => dom3.heading && dom3.body)
      : [];
  if (!scenes3.length) throw new Error('Agent 返回结果没有可用场次。');
  const value46 = Math.max(1, Math.trunc(Number(episodeNumber) || 1)),
    fullText = [
      '## 第' + value46 + '集：' + title2,
      ...scenes3.map((value47, value48) => formatEpisodeSceneText(value47, value46, value48)),
    ].join('\n'),
    list10 = normalizeStoryContinuityFacts(
      data2.continuityFacts || data2.facts || data2.continuity_facts,
    ),
    continuityFacts = list10.length ? list10 : normalizeStoryContinuityFacts(fallbackContinuityFacts),
    storyContinuityState2 = normalizeStoryContinuityState(
      data2.endingState || data2.finalState || data2.continuityState || data2.ending_state,
    ),
    endingState = hasStoryContinuityState(storyContinuityState2)
      ? storyContinuityState2
      : normalizeStoryContinuityState(fallbackEndingState);
  if (requireEndingState && !hasStoryContinuityState(endingState))
    throw new Error('Agent 返回的完整分集剧本缺少有效结束状态。');
  return {
    schemaVersion: STORY_EPISODE_SCRIPT_SCHEMA_VERSION,
    episodeRef: episodeRef2,
    title: title2,
    scenes: scenes3,
    fullText: fullText,
    continuityFacts: continuityFacts,
    endingState: endingState,
    ...(recovery2 ? { recovery: recovery2 } : {}),
  };
}
function getStoryEpisodeScriptFinishReason(value49) {
  return normalizeText(
    value49?.finishReason ||
      value49?.finish_reason ||
      value49?.choices?.[0]?.finish_reason ||
      value49?.data?.choices?.[0]?.finish_reason,
  ).toLowerCase();
}
function serializeStoryEpisodeScriptResponse(value50) {
  const resultText2 = getResultText(value50);
  return typeof resultText2 === 'string' ? resultText2 : stringifyStoryEpisodeDevResponse(resultText2);
}
function normalizeStoryEpisodeScriptRawResponses(attempt2 = null) {
  const list11 = Array.isArray(attempt2?.rawResponses)
    ? attempt2.rawResponses
    : normalizeText(attempt2?.rawResponse)
      ? [
          {
            attempt: attempt2?.attempts,
            phase: 'generation',
            finishReason: attempt2?.finishReason,
            text: attempt2.rawResponse,
          },
        ]
      : [];
  return list11.map((response3, value51) => ({
    attempt: Math.max(1, Math.trunc(Number(response3?.attempt) || value51 + 1)),
    phase: normalizeText(response3?.phase) || (value51 ? 'repair' : 'generation'),
    finishReason: normalizeText(response3?.finishReason).toLowerCase(),
    text:
      typeof response3?.text === 'string'
        ? response3.text
        : stringifyStoryEpisodeDevResponse(response3?.text),
  }));
}
function createStoryEpisodeScriptRawResponseRecord(
  value52,
  { attempt: attempt = 1, phase: phase = 'generation' } = {},
) {
  return {
    attempt: Math.max(1, Math.trunc(Number(attempt) || 1)),
    phase: normalizeText(phase) || 'generation',
    finishReason: getStoryEpisodeScriptFinishReason(value52),
    text: serializeStoryEpisodeScriptResponse(value52),
  };
}
function selectStoryEpisodeScriptRepairSource(list12 = []) {
  return list12.reduce((response4, response5) => {
    if (!normalizeText(response5?.text)) return response4;
    if (!response4 || String(response5.text).length >= String(response4.text).length)
      return response5;
    return response4;
  }, null);
}
function buildStoryEpisodeScriptRepairPrompt({
  episode: episode = {},
  episodeRef: episodeRef = 'episode-1',
  episodeNumber: episodeNumber = 1,
  rejectedResponse: rejectedResponse = '',
  finishReason: finishReason = '',
  error: error = null,
} = {}) {
  const requiredEndingState = normalizeStoryContinuityState(episode?.endingState);
  return JSON.stringify({
    task: 'repair_story_episode_script_response',
    episode: {
      ref: normalizeText(episodeRef) || 'episode-' + episodeNumber,
      number: Math.max(1, Math.trunc(Number(episodeNumber) || 1)),
      title: normalizeText(episode?.title),
      synopsis: normalizeText(episode?.synopsis),
      hook: normalizeText(episode?.hook),
      continuityFacts: normalizeStoryContinuityFacts(episode?.continuityFacts),
      requiredEndingState: requiredEndingState,
    },
    issue: {
      reason: normalizeText(error?.message || error) || '上一次返回无法完整解析',
      finishReason: normalizeText(finishReason),
    },
    rejectedResponse: String(rejectedResponse || ''),
    instructions: [
      '优先做最小修改，完整保留 rejectedResponse 中已经存在的场次正文、动作和对白。',
      '如果只是 JSON 语法或字段名错误，只修复语法和字段名，不改写剧情。',
      '如果返回在中途截断，只从截断位置继续，补完当前场次、本集钩子、continuityFacts 和 endingState。',
      '返回内容包含 episodeRef、title、scenes、continuityFacts、endingState 即可；不要添加解释。',
    ],
  });
}
function tryParseStoryEpisodeScriptResponse(value53, value54) {
  try {
    return { result: parseStoryEpisodeScriptResult(value53, value54), error: null };
  } catch (error2) {
    return { result: null, error: error2 };
  }
}
function isCompleteStoryEpisodeScriptResponse(value55) {
  return Boolean(
    value55 &&
    Array.isArray(value55.scenes) &&
    value55.scenes.length &&
    normalizeText(value55.fullText) &&
    value55.recovery?.incompleteJson !== true,
  );
}
function chooseBestStoryEpisodeScriptResult(list13 = []) {
  return (
    list13.filter(
      (value56) => value56 && Array.isArray(value56.scenes) && value56.scenes.length,
    ).sort(
      (value57, value58) =>
        Number(value58.scenes.length || 0) - Number(value57.scenes.length || 0) ||
        normalizeText(value58.fullText).length - normalizeText(value57.fullText).length,
    )[0] || null
  );
}
function createStoryEpisodeScriptPartialError({
  episodeRef: episodeRef = 'episode-1',
  rawResponses: rawResponses = [],
  attempts: attempts = 1,
  parseResults: parseResults = [],
  cause: cause = null,
} = {}) {
  const message2 = normalizeText(cause?.message || cause) || '返回无法完整解析',
    value59 = {
      schemaVersion: STORY_EPISODE_SCRIPT_SCHEMA_VERSION,
      status: 'failed',
      episodeRef: normalizeText(episodeRef) || 'episode-1',
      attempts: Math.max(
        1,
        Math.trunc(Number(attempts) || 1),
        ...rawResponses.map((value60) => Math.trunc(Number(value60?.attempt) || 0)),
      ),
      rawResponses: rawResponses.map((args4) => ({ ...args4 })),
      bestEffort: chooseBestStoryEpisodeScriptResult(parseResults),
      lastError: {
        message: message2,
        code: normalizeText(cause?.code),
        type: normalizeText(cause?.type || cause?.name) || 'Error',
      },
    },
    error3 = new Error(
      '完整分集剧本返回仍不完整，已保存本次返回；再次点击时会优先修复，不会重新生成整集。' +
        (message2 ? ' ' + message2 : ''),
    );
  return (
    (error3.name = 'StoryEpisodeScriptPartialError'),
    (error3.code = 'STORY_EPISODE_SCRIPT_PARTIAL'),
    (error3.partialResult = value59),
    error3
  );
}
export async function generateStoryEpisodeScript({
  project: project = {},
  episode: episode = {},
  previousEpisode: previousEpisode = null,
  nextEpisode: nextEpisode = null,
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  request: request = generateText,
  onProgress: onProgress = null,
  repairDraft: repairDraft = null,
  onInvocation: onInvocation = null,
} = {}) {
  assertPlanningModel(model, provider);
  const episodeNumber2 = Math.max(1, Math.trunc(Number(episode?.number) || 1)),
    episodeRef3 =
      normalizeText(episode?.ref || episode?.planningRef || episode?.id) ||
      'episode-' + episodeNumber2,
    prompt4 = buildStoryEpisodeScriptPrompt({
      project: project,
      episode: episode,
      previousEpisode: previousEpisode,
      nextEpisode: nextEpisode,
    }),
    requestPayload = {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: prompt4,
      systemPrompt: STORY_EPISODE_SCRIPT_SYSTEM_PROMPT,
      temperature:
        normalizeStoryScriptMode(project?.scriptMode) === STORY_SCRIPT_MODE_NARRATION ? 0.35 : 0.45,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
    },
    value61 = {
      episodeRef: episodeRef3,
      episodeNumber: episodeNumber2,
      episodeTitle: episode?.title,
      requireEndingState: true,
      fallbackContinuityFacts: episode?.continuityFacts,
      fallbackEndingState: episode?.endingState,
    },
    rawResponses2 = normalizeStoryEpisodeScriptRawResponses(repairDraft),
    attempts2 = Math.max(
      Math.trunc(Number(repairDraft?.attempts) || 0),
      ...rawResponses2.map((value62) => Math.trunc(Number(value62?.attempt) || 0)),
    ),
    parseResults2 = [];
  let value63 = 0,
    value64 = 0;
  const attempt3 = () => attempts2 + ++value64,
    handler = async (requestPayload2, stepId) => {
      const attempt4 = attempt3(),
        response6 = await invokeStoryGenerationRequest({
          request: request,
          requestPayload: requestPayload2,
          stepId: stepId,
          attempt: attempt4,
          onInvocation: onInvocation,
          allowTruncatedOutput: true,
          serializeResponse: serializeStoryEpisodeScriptResponse,
        });
      return (
        (value63 += 1),
        captureStoryEpisodeScriptDevResponse({
          response: response6,
          attempt: attempt4,
          episodeRef: episodeRef3,
          episodeNumber: episodeNumber2,
          model: model,
          provider: provider,
        }),
        rawResponses2.push(
          createStoryEpisodeScriptRawResponseRecord(response6, { attempt: attempt4, phase: stepId }),
        ),
        response6
      );
    },
    handler2 = (scriptResult) =>
      ensureStoryEpisodeScriptTiming({
        scriptResult: scriptResult,
        episode: episode,
        review: (script2, phase2, priorReview) =>
          requestStoryEpisodeScriptTimingReview({
            request: request,
            requestPayload: requestPayload,
            episode: episode,
            script: script2,
            onInvocation: onInvocation,
            attempt: attempt3(),
            phase: phase2,
            priorReview: priorReview,
          }),
      }),
    grounding = JSON.parse(prompt4),
    handler3 = async (value65) => {
      const script3 = await handler2(value65);
      if (normalizeText(script3?.timingReview?.verdict) !== 'needs_revision') return script3;
      onProgress?.({
        stage: 'revising-episode-script-content',
        current: episodeNumber2,
        total: episodeNumber2,
        message: '第 ' + episodeNumber2 + ' 集内容审查未通过，正在按分集大纲和连续性自动精简修订',
      });
      const value66 = {
        ...requestPayload,
        prompt: buildStoryEpisodeScriptContentRevisionPrompt({
          grounding: grounding,
          script: script3,
          timingReview: script3.timingReview,
        }),
        systemPrompt: STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT,
        temperature: 0.2,
      };
      try {
        const value67 = await handler(value66, 'content-revision'),
          tryParseStoryEpisodeScriptResponse2 = tryParseStoryEpisodeScriptResponse(value67, value61);
        if (tryParseStoryEpisodeScriptResponse2.result)
          parseResults2.push(tryParseStoryEpisodeScriptResponse2.result);
        if (!isCompleteStoryEpisodeScriptResponse(tryParseStoryEpisodeScriptResponse2.result))
          return preserveStoryEpisodeScriptWithoutTimingReview(
            script3,
            episode,
            tryParseStoryEpisodeScriptResponse2.error || new Error('内容修订返回不完整。'),
          );
        const value68 = await handler2(tryParseStoryEpisodeScriptResponse2.result);
        if (normalizeText(value68?.timingReview?.verdict) === 'needs_revision')
          return preserveStoryEpisodeScriptWithoutTimingReview(
            script3,
            episode,
            new Error(
              '自动内容修订后仍未通过：' +
                (normalizeText(value68?.timingReview?.reason) || '存在重复内容'),
            ),
          );
        return value68;
      } catch (value69) {
        return preserveStoryEpisodeScriptWithoutTimingReview(script3, episode, value69);
      }
    },
    value70 = repairDraft?.skipPostGenerationReview === true,
    handler4 = async ({
      rejectedResponse: rejectedResponse2,
      finishReason: finishReason = '',
      cause: cause = null,
    } = {}) => {
      onProgress?.({
        stage: 'repairing-episode-script',
        current: episodeNumber2,
        total: episodeNumber2,
        message: '第 ' + episodeNumber2 + ' 集返回格式异常，正在修复已有正文',
      });
      const value71 = {
        ...requestPayload,
        prompt: buildStoryEpisodeScriptRepairPrompt({
          episode: episode,
          episodeRef: episodeRef3,
          episodeNumber: episodeNumber2,
          rejectedResponse: rejectedResponse2,
          finishReason: finishReason,
          error: cause,
        }),
        systemPrompt: STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT,
        temperature: 0.15,
      };
      let value72;
      try {
        value72 = await handler(value71, 'repair');
      } catch (cause2) {
        throw createStoryEpisodeScriptPartialError({
          episodeRef: episodeRef3,
          rawResponses: rawResponses2,
          attempts: attempts2 + value63 + 1,
          parseResults: parseResults2,
          cause: cause2,
        });
      }
      const cause3 = tryParseStoryEpisodeScriptResponse(value72, value61);
      if (cause3.result) parseResults2.push(cause3.result);
      if (isCompleteStoryEpisodeScriptResponse(cause3.result)) return handler3(cause3.result);
      throw createStoryEpisodeScriptPartialError({
        episodeRef: episodeRef3,
        rawResponses: rawResponses2,
        attempts: attempts2 + value63,
        parseResults: parseResults2,
        cause: cause3.error || new Error('修复返回仍然被截断。'),
      });
    };
  for (const response7 of [...rawResponses2].reverse()) {
    if (!response7?.text) continue;
    const tryParseStoryEpisodeScriptResponse3 = tryParseStoryEpisodeScriptResponse(
      response7.text,
      value61,
    );
    if (tryParseStoryEpisodeScriptResponse3.result)
      parseResults2.push(tryParseStoryEpisodeScriptResponse3.result);
    if (isCompleteStoryEpisodeScriptResponse(tryParseStoryEpisodeScriptResponse3.result))
      return value70
        ? preserveStoryEpisodeScriptWithoutTimingReview(
            tryParseStoryEpisodeScriptResponse3.result,
            episode,
            new Error('上次正文生成后的时长审查被中断。'),
          )
        : handler3(tryParseStoryEpisodeScriptResponse3.result);
  }
  const rejectedResponse3 = selectStoryEpisodeScriptRepairSource(rawResponses2);
  if (rejectedResponse3?.text) {
    const cause4 = tryParseStoryEpisodeScriptResponse(rejectedResponse3.text, value61);
    return handler4({
      rejectedResponse: rejectedResponse3.text,
      finishReason: rejectedResponse3.finishReason,
      cause: cause4.error || new Error('上次返回在完整剧本结束前被截断。'),
    });
  }
  onProgress?.({
    stage: 'writing-episode-script',
    current: episodeNumber2,
    total: episodeNumber2,
    message: '正在生成第 ' + episodeNumber2 + ' 集完整剧本',
  });
  const value73 = await handler(requestPayload, 'generation'),
    cause5 = tryParseStoryEpisodeScriptResponse(value73, value61);
  if (cause5.result) parseResults2.push(cause5.result);
  if (isCompleteStoryEpisodeScriptResponse(cause5.result)) return handler3(cause5.result);
  return handler4({
    rejectedResponse: serializeStoryEpisodeScriptResponse(value73),
    finishReason: getStoryEpisodeScriptFinishReason(value73),
    cause: cause5.error || new Error('首次返回在完整剧本结束前被截断。'),
  });
}
function normalizePlanningAssetSummary(error4 = {}, value74 = 0) {
  const kind2 = ['scene', 'prop'].includes(error4.kind) ? error4.kind : 'character',
    list14 = Array.isArray(error4?.appearances) ? error4.appearances : [],
    appearances = list14.map((error5) => ({
      ref: resolveStoryGenerationAppearanceRef(error5),
      name: normalizeText(error5?.name),
      description: normalizeText(error5?.description),
      prompt: normalizeText(error5?.prompt),
      sourceEpisodeRefs: normalizeStringArray(error5?.sourceEpisodeRefs),
      sourceSceneRefs: normalizeStringArray(error5?.sourceSceneRefs),
    })).filter((error6) => error6.ref && (error6.name || error6.prompt)),
    text8 = normalizeText(error4?.baseAppearanceRef),
    text9 = normalizeText(error4?.baseAppearanceId),
    value75 = text8 || text9,
    value76 = value75
      ? list14.find((value77) =>
          [value77?.id, value77?.ref, value77?.planningRef].some(
            (value78) => normalizeText(value78) === value75,
          ),
        )
      : null,
    baseAppearanceRef = normalizeStoryAssetReference(
      resolveStoryGenerationAppearanceRef(value76),
      appearances.length === 1 ? appearances[0].ref : '',
    );
  return {
    ref: resolveStoryGenerationAssetRef(error4, value74),
    kind: kind2,
    name: normalizeText(error4.name),
    role: normalizeText(error4.role),
    description: normalizeText(error4.description),
    baseAppearanceRef: baseAppearanceRef,
    sourceEpisodeRefs: normalizeStringArray(error4?.sourceEpisodeRefs),
    sourceSceneRefs: normalizeStringArray(error4?.sourceSceneRefs),
    appearances: appearances,
  };
}
function compactStoryEpisodePromptAsset(
  error7 = {},
  { includeVisualDetails: includeVisualDetails = false, includeBindings: includeBindings = false } = {},
) {
  const kind3 = normalizeText(error7?.kind),
    value79 = includeVisualDetails && kind3 !== 'character',
    appearances2 = (Array.isArray(error7?.appearances) ? error7.appearances : []).map(
      (error8) => ({
        ref: normalizeText(error8?.ref),
        name: normalizeText(error8?.name),
        ...(includeBindings && normalizeStringArray(error8?.sourceEpisodeRefs).length
          ? { sourceEpisodeRefs: normalizeStringArray(error8.sourceEpisodeRefs) }
          : {}),
        ...(includeBindings && normalizeStringArray(error8?.sourceSceneRefs).length
          ? { sourceSceneRefs: normalizeStringArray(error8.sourceSceneRefs) }
          : {}),
        ...(value79 && normalizeText(error8?.description)
          ? { description: normalizeText(error8.description) }
          : {}),
        ...(value79 && normalizeText(error8?.prompt) ? { prompt: normalizeText(error8.prompt) } : {}),
      }),
    );
  return {
    ref: normalizeText(error7?.ref),
    kind: kind3,
    name: normalizeText(error7?.name),
    ...(includeBindings && normalizeText(error7?.baseAppearanceRef)
      ? { baseAppearanceRef: normalizeText(error7.baseAppearanceRef) }
      : {}),
    ...(includeBindings && normalizeStringArray(error7?.sourceEpisodeRefs).length
      ? { sourceEpisodeRefs: normalizeStringArray(error7.sourceEpisodeRefs) }
      : {}),
    ...(includeBindings && normalizeStringArray(error7?.sourceSceneRefs).length
      ? { sourceSceneRefs: normalizeStringArray(error7.sourceSceneRefs) }
      : {}),
    ...(value79 && normalizeText(error7?.description)
      ? { description: normalizeText(error7.description) }
      : {}),
    appearances: appearances2,
  };
}
function createStoryEpisodeSplitCompactAssetCatalog(list15 = []) {
  const list16 = [];
  return (
    (Array.isArray(list15) ? list15 : []).forEach((error9) => {
      const list17 = Array.isArray(error9?.appearances)
          ? error9.appearances.filter((value80) => normalizeText(value80?.ref))
          : [],
        list18 = list17.length
          ? [...list17].sort((value81, value82) => {
              const text10 = normalizeText(error9?.baseAppearanceRef);
              return (
                Number(normalizeText(value82?.ref) === text10) -
                Number(normalizeText(value81?.ref) === text10)
              );
            })
          : [null];
      list18.forEach((error10) => {
        const code = 'a' + (list16.length + 1),
          text11 = normalizeText(error10?.name);
        list16.push({
          code: code,
          kind: normalizeText(error9?.kind),
          name: [normalizeText(error9?.name), text11].filter(Boolean).join('·'),
          assetName: normalizeText(error9?.name),
          ref: normalizeText(error10?.ref) || normalizeText(error9?.ref),
          assetRef: normalizeText(error9?.ref),
        });
      });
    }),
    list16
  );
}
function createStoryEpisodeSplitCompactDialogueCatalog(options7 = {}, value83 = []) {
  let list19 = [];
  try {
    list19 = normalizeStoryEpisodeSplitSourceBeats(options7).flatMap((value84) =>
      Array.isArray(value84?.dialogueUnits) ? value84.dialogueUnits : [],
    );
  } catch {
    list19 = extractStoryEpisodeDialogueUnits(
      options7?.script?.fullText ||
        options7?.fullScript ||
        options7?.scriptText ||
        options7?.synopsis ||
        options7?.content,
      getStoryEpisodeReferenceAliases(options7)[0] || 'episode-1',
    );
  }
  const list20 = createStoryEpisodeSplitCompactAssetCatalog(value83).filter(
    (value85) => value85.kind === 'character',
  );
  return list19.map((response8, value86) => {
    const speaker = normalizeText(response8?.speaker),
      speakerAssetCode = speaker
        ? list20.filter((value87) =>
            getStoryEpisodeSplitAssetNameAliases(value87.assetName).some(
              (value88) => value88 === speaker,
            ),
          )
        : [];
    return {
      code: 'q' + (value86 + 1),
      ...(speaker ? { speaker: speaker } : {}),
      ...(speakerAssetCode.length === 1 ? { speakerAssetCode: speakerAssetCode[0].code } : {}),
      text: normalizeText(response8?.text),
    };
  }).filter((response9) => response9.text);
}
function decodeStoryEpisodeSplitCompactDialogue(
  value89,
  { dialogueByCode: dialogueByCode = new Map(), assetByCode: assetByCode = new Map() } = {},
) {
  const text12 = normalizeText(value89);
  if (!text12) return { text: '', assetCode: '' };
  const [value90, value91 = ''] = text12.split('@').map(normalizeText),
    response10 = dialogueByCode.get(value90);
  if (!response10) return { text: text12, assetCode: '' };
  const value92 = assetByCode.get(value91),
    value93 = value92?.kind === 'character' ? value91 : '',
    assetCode = value93 || normalizeText(response10?.speakerAssetCode),
    value94 = assetByCode.get(assetCode),
    text13 = normalizeText(value94?.assetName) || normalizeText(response10?.speaker) || '人物';
  return { text: text13 + '：“' + response10.text + '”', assetCode: assetCode };
}
function expandStoryEpisodeSplitCompactData(
  clips = {},
  { episodeRef: episodeRef = '', episode: episode = {}, assets: assets = [] } = {},
) {
  if (!clips || typeof clips !== 'object' || !Array.isArray(clips.clips)) return clips;
  const list21 = createStoryEpisodeSplitCompactAssetCatalog(assets),
    args5 = createStoryEpisodeSplitCompactSceneCatalog(assets),
    assetByCode2 = new Map([...list21, ...args5].map((value95) => [value95.code, value95])),
    list22 = list21.filter(
      (value96, value97) =>
        list21.findIndex((value98) => value98.assetRef === value96.assetRef) === value97,
    ),
    list23 = createStoryEpisodeSplitCompactDialogueCatalog(episode, assets),
    dialogueByCode2 = new Map(list23.map((value99) => [value99.code, value99]));
  return {
    ...clips,
    episodeRef: normalizeText(clips.episodeRef) || episodeRef,
    clips: clips.clips.map((args6, value100) => ({
      ...args6,
      ref: normalizeText(args6?.ref) || 'clip-' + (value100 + 1),
      shots: (Array.isArray(args6?.shots) ? args6.shots : []).map((durationSec2) => {
        if (!durationSec2 || typeof durationSec2 !== 'object' || Array.isArray(durationSec2))
          return durationSec2;
        const enabled5 = ['d', 'r', 'v', 'c', 'q', 'o', 'a'].some((value101) =>
          Object.prototype.hasOwnProperty.call(durationSec2, value101),
        );
        if (!enabled5) return durationSec2;
        const value102 = Math.trunc(Number(durationSec2.c)),
          camera = episode.replication?.sourceAnalysis
            ? normalizeText(durationSec2.c)
            : Number.isInteger(value102) && STORY_EPISODE_SPLIT_CAMERA_PRESETS[value102]
              ? STORY_EPISODE_SPLIT_CAMERA_PRESETS[value102]
              : normalizeText(durationSec2.c) || STORY_EPISODE_SPLIT_CAMERA_PRESETS[0],
          dialogue = decodeStoryEpisodeSplitCompactDialogue(durationSec2.q, {
            dialogueByCode: dialogueByCode2,
            assetByCode: assetByCode2,
          }),
          visual = normalizeText(durationSec2.v),
          args7 = list22.filter((value103) =>
            getStoryEpisodeSplitAssetNameAliases(value103.assetName).some(
              (value104) => value104 && visual.includes(value104),
            ),
          ).map((value105) => value105.code),
          list24 = normalizeStringArray([
            dialogue.assetCode,
            ...args7,
            ...normalizeStringArray(durationSec2.r),
            normalizeText(args6?.s),
          ])
            .map((value106) => assetByCode2.get(value106))
            .filter(Boolean),
          assetUsages = Array.isArray(durationSec2.assetUsages)
            ? durationSec2.assetUsages.map((args8) => ({ ...args8 }))
            : [
                ...new Map(
                  list24.map((assetRef) => [
                    assetRef.assetRef + ':' + assetRef.ref,
                    {
                      assetRef: assetRef.assetRef,
                      appearanceRef: assetRef.ref === assetRef.assetRef ? '' : assetRef.ref,
                    },
                  ]),
                ).values(),
              ];
        return {
          durationSec: durationSec2.d,
          ...replicationVisualFields(durationSec2),
          ...(Object.prototype.hasOwnProperty.call(durationSec2, 'startSec')
            ? { startSec: durationSec2.startSec }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(durationSec2, 'endSec')
            ? { endSec: durationSec2.endSec }
            : {}),
          assetUsages: assetUsages,
          visual: visual,
          camera: camera,
          dialogue: dialogue.text,
          voiceover: normalizeText(durationSec2.o),
          audio: normalizeText(durationSec2.a),
        };
      }),
    })),
  };
}
function isStoryEpisodeEditorialMarker(value107 = '') {
  return /^(?:[（(]\s*)?(?:本集完|本章完|全剧终|未完待续|待续|完)(?:\s*[）)])?[。.!！]?$/iu.test(
    normalizeText(value107),
  );
}
function sanitizeStoryEpisodeSplitSourceText(value108 = '') {
  return String(value108 || '')
    .split(/\r?\n/u)
    .filter((value109) => !isStoryEpisodeEditorialMarker(value109))
    .join('\n')
    .trim();
}
function getStoryEpisodeSplitSourceSceneMetadata(options8 = {}) {
  return (Array.isArray(options8?.script?.scenes) ? options8.script.scenes : [])
    .map((value110) => ({
      heading: normalizeText(value110?.heading),
      characters: normalizeStringArray(value110?.characters),
    }))
    .filter((value111) => value111.heading || value111.characters.length);
}
function isStoryEpisodeSplitSourceMetadataLine(value112 = '', value113 = {}) {
  const text14 = normalizeText(value112);
  if (!text14) return false;
  if (/[。！？!?；;“”「」]|\.(?:\s|$)/u.test(text14)) return false;
  const map4 = new Set(
    getStoryEpisodeSplitSourceSceneMetadata(value113)
      .map((value114) => value114.heading)
      .filter(Boolean),
  );
  return (
    map4.has(text14) ||
    /^#{1,6}\s*(?:第?\s*\d+\s*集|场(?:景)?\s*\d)/u.test(text14) ||
    /^(?:出场人物|人物列表|时间|地点|场景)[：:]/u.test(text14)
  );
}
function sanitizeStoryEpisodeSplitPromptText(value115 = '', value116 = {}) {
  return sanitizeStoryEpisodeSplitSourceText(value115)
    .split(/\r?\n/u)
    .filter((value117) => !isStoryEpisodeSplitSourceMetadataLine(value117, value116))
    .join('\n')
    .trim();
}
function filterStoryEpisodeBlueprintEpisodeBindings(list25 = [], value118 = []) {
  const map5 = new Set(normalizeStringArray(value118));
  return normalizeStringArray(list25).filter((value119) => map5.has(value119));
}
function filterStoryEpisodeBlueprintSceneBindings(
  list26 = [],
  value120 = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  const list27 = normalizeStringArray(value120);
  return normalizeStringArray(list26).filter((value121) =>
    list27.some((value122) => storyEpisodeSourceSceneRefsMatch(value121, value122, episodeRefs)),
  );
}
function compactStoryEpisodeBlueprintAsset(
  options9 = {},
  { episodeRefs: episodeRefs = [], sourceSceneRefs: sourceSceneRefs = [] } = {},
) {
  const appearances3 = compactStoryEpisodePromptAsset(options9),
    handler5 = (options10 = {}) => {
      const list28 = normalizeStringArray(options10?.sourceEpisodeRefs),
        sourceEpisodeRefs = filterStoryEpisodeBlueprintEpisodeBindings(list28, episodeRefs),
        sourceSceneRefs2 =
          list28.length && !sourceEpisodeRefs.length
            ? []
            : filterStoryEpisodeBlueprintSceneBindings(options10?.sourceSceneRefs, sourceSceneRefs, {
                episodeRefs: episodeRefs,
              });
      return {
        ...(sourceEpisodeRefs.length ? { sourceEpisodeRefs: sourceEpisodeRefs } : {}),
        ...(sourceSceneRefs2.length ? { sourceSceneRefs: sourceSceneRefs2 } : {}),
      };
    },
    map6 = new Map(
      (Array.isArray(options9?.appearances) ? options9.appearances : []).map((value123) => [
        normalizeText(value123?.ref),
        value123,
      ]),
    );
  return {
    ...appearances3,
    ...(normalizeText(options9?.baseAppearanceRef)
      ? { baseAppearanceRef: normalizeText(options9.baseAppearanceRef) }
      : {}),
    ...handler5(options9),
    appearances: appearances3.appearances.map((args9) => ({
      ...args9,
      ...handler5(map6.get(args9.ref)),
    })),
  };
}
function buildStoryEpisodeSplitAssetCatalog(list29 = [], value124 = []) {
  const assetByRef = new Map(),
    appearanceOwnerRefsByRef = new Map();
  for (const error11 of Array.isArray(list29) ? list29 : []) {
    const assetRef2 = normalizeStoryAssetReference(error11?.ref, '');
    if (!assetRef2) continue;
    const appearanceRefs = [];
    for (const value125 of Array.isArray(error11?.appearances) ? error11.appearances : []) {
      const storyAssetReference = normalizeStoryAssetReference(value125?.ref, '');
      if (!storyAssetReference) continue;
      appearanceRefs.push(storyAssetReference);
      const value126 = appearanceOwnerRefsByRef.get(storyAssetReference) || new Set();
      (value126.add(assetRef2), appearanceOwnerRefsByRef.set(storyAssetReference, value126));
    }
    const kind4 = ['scene', 'prop'].includes(error11?.kind) ? error11.kind : 'character',
      value127 = appearanceRefs.includes(assetRef2 + '-appearance-1') ? assetRef2 + '-appearance-1' : '';
    assetByRef.set(assetRef2, {
      assetRef: assetRef2,
      kind: kind4,
      name: normalizeText(error11?.name),
      appearanceRefs: appearanceRefs,
      defaultAppearanceRef:
        normalizeStoryAssetReference(error11?.baseAppearanceRef, '') ||
        value127 ||
        (appearanceRefs.length === 1 ? appearanceRefs[0] : ''),
    });
  }
  for (const assetRef3 of normalizeStringArray(value124)) {
    !assetByRef.has(assetRef3) &&
      assetByRef.set(assetRef3, {
        assetRef: assetRef3,
        kind: 'unknown',
        name: '',
        appearanceRefs: [],
        defaultAppearanceRef: '',
      });
  }
  return { assetByRef: assetByRef, appearanceOwnerRefsByRef: appearanceOwnerRefsByRef };
}
function getStoryEpisodeSplitAssetNameAliases(value128 = '') {
  const args10 = normalizeText(value128);
  if (!args10) return [];
  const args11 = new Set([args10]),
    text15 = normalizeText(args10.split(/[（(]/u, 1)[0]);
  if (text15) args11.add(text15);
  const list30 = [...args10.matchAll(/[（(]([^）)]+)[）)]/gu)]
    .map((value129) => normalizeText(value129[1]))
    .filter(Boolean);
  list30.forEach((value130) => args11.add(value130));
  const value131 = args10.replace(
    /^(?:实习生|调查记者|记者|刑警|警官|警察|房东|高中生|师父|掌门|宗主|老板|总编|编辑)/u,
    '',
  );
  if (value131) args11.add(value131);
  return [...args11];
}
function resolveStoryEpisodeSplitLegacyAppearanceOwner(value132, value133, value134, value135 = {}) {
  const list31 = [...(value133 || [])];
  if (list31.length <= 1) return list31[0] || '';
  const list32 = [value135?.visual, value135?.camera, value135?.dialogue, value135?.voiceover]
      .map(normalizeText)
      .filter(Boolean)
      .join(' '),
    list33 = list31.filter((value136) => {
      const value137 = value134.assetByRef.get(value136)?.name;
      return getStoryEpisodeSplitAssetNameAliases(value137).some(
        (value138) => value138 && list32.includes(value138),
      );
    });
  if (list33.length === 1) return list33[0];
  const list34 = list31.filter((value139) => value132.startsWith(value139 + '-appearance-'));
  return list34.length === 1 ? list34[0] : '';
}
function resolveStoryEpisodeSplitUnknownLegacyAppearance(value140, args12, value141 = {}) {
  const list35 = [...args12.assetByRef.values()],
    list36 = list35.filter((value142) => value140.startsWith(value142.assetRef + '-appearance-'));
  if (list36.length === 1) return list36[0];
  const list37 = [value141?.visual, value141?.camera, value141?.dialogue, value141?.voiceover]
      .map(normalizeText)
      .filter(Boolean)
      .join(' '),
    list38 = list35.filter((error12) =>
      getStoryEpisodeSplitAssetNameAliases(error12.name).some(
        (value143) => value143 && list37.includes(value143),
      ),
    );
  return list38.length === 1 ? list38[0] : null;
}
function assertKnownReferences(list39, map7, value144) {
  const list40 = list39.filter((value145) => !map7.has(value145));
  if (list40.length) throw new Error(value144 + '引用了不存在的资产：' + list40.join('、') + '。');
}
function normalizeStoryEpisodeSplitAssetUsage(options11 = {}, value146, value147) {
  const assetRef4 = normalizeStoryAssetReference(options11?.assetRef, '');
  let appearanceRef = normalizeStoryAssetReference(options11?.appearanceRef, '');
  if (!assetRef4) throw new Error(value147 + '缺少 assetRef。');
  const enabled6 = value146.assetByRef.get(assetRef4);
  if (!enabled6) throw new Error(value147 + '引用了不存在的资产：' + assetRef4 + '。');
  appearanceRef === assetRef4 &&
    !enabled6.appearanceRefs.includes(appearanceRef) &&
    (appearanceRef = enabled6.defaultAppearanceRef);
  if (appearanceRef) {
    const enabled7 = value146.appearanceOwnerRefsByRef.get(appearanceRef);
    if (!enabled7?.size) throw new Error(value147 + '引用了不存在的形象：' + appearanceRef + '。');
    if (!enabled6.appearanceRefs.includes(appearanceRef))
      throw new Error(value147 + '的形象“' + appearanceRef + '”不属于资产“' + assetRef4 + '”。');
  } else {
    if (enabled6.defaultAppearanceRef) appearanceRef = enabled6.defaultAppearanceRef;
    else {
      if (enabled6.appearanceRefs.length)
        throw new Error(value147 + '必须为资产“' + assetRef4 + '”选择一个具体形象。');
    }
  }
  return { assetRef: assetRef4, appearanceRef: appearanceRef };
}
export function buildStoryAssetExtractionPrompt({
  project: project = {},
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
  requiredAssetNamesByKind: requiredAssetNamesByKind = null,
  candidateAssetsByKind: candidateAssetsByKind = null,
  requiredAssetsByKind: requiredAssetsByKind = null,
  compactOutput: compactOutput = false,
} = {}) {
  const storyPlanningConstraints = resolveStoryPlanningConstraints(project),
    title3 = normalizeStoryProjectInput(project);
  ((title3.planning = storyPlanningConstraints), assertStoryProjectInput(title3));
  const style = normalizeText(visualStyle) || title3.visualStyle,
    assetKinds2 = normalizeStringArray(assetKinds).filter((value148) =>
      STORY_ASSET_EXTRACTION_KINDS.includes(value148),
    );
  if (!assetKinds2.length) throw new Error('资产提取至少需要指定角色、场景或道具中的一种。');
  const value149 = { character: '角色', scene: '场景', prop: '道具' },
    args13 = createStoryAssetPromptContracts(
      assetKinds2,
      requiredAssetNamesByKind,
      candidateAssetsByKind,
      requiredAssetsByKind,
      { includeClientKeys: compactOutput },
    ),
    value150 = {
      task: compactOutput
        ? 'complete_story_asset_visual_design_by_client_key'
        : assetKinds2.length === 1
          ? 'extract_story_assets_by_kind'
          : 'extract_story_assets',
      schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
      assetKinds: assetKinds2,
      project: { title: title3.title, chapters: title3.chapters },
      visualDirection: {
        aspectRatio: normalizeText(aspectRatio) || title3.aspectRatio || '16:9',
        style: style,
      },
      ...args13.payload,
      requirements: [
        '本次只返回 ' +
          assetKinds2.map((value151) => value149[value151]).join('、') +
          '资产，禁止返回其他 kind。',
        ...args13.requirements,
        ...(compactOutput
          ? [
              '这是紧凑视觉裁决模式：requiredAssets 与 candidateAssets 中的每一个 clientKey 都必须恰好返回一行，顺序不限，禁止省略、重复或编造 clientKey。',
              'requiredAssets 必须 include=true；candidateAssets 必须逐项明确返回 include=true 或 include=false。即使 include=false，也必须保留 description、visualPrompt、voiceDescription 三个字符串字段，可返回空字符串。',
              'include=true 时，description 是可直接展示的最终资产简介，visualPrompt 是可直接提交图片模型的最终正向提示词；客户端不会补写、扩写或套用模板。',
              STORY_ASSET_VOICE_DESCRIPTION_RULE,
              '禁止返回或改写 name、ref、来源、集数或 appearance 等客户端权威字段。不要复述剧情、证据、检索过程或规则。',
            ]
          : [
              '提取后续画面中需要保持视觉一致的全部角色、场景和关键道具；普通背景杂物不单独提取为道具。',
              '必须通读 project.chapters 中提供的剧本证据后自行识别资产；不得依赖输入之外的预置角色、题材词表或候选清单，也不得因为角色戏份少、没有姓名、属于群体身份或只在单场出现而省略证据中实际出场且需要画面表现的角色。',
              '提取角色时，原文出场人物、登场人物或出场角色名单中的每一个独立称谓，以及有对白、独立动作或单独指代的角色都必须逐项返回；不得合并不同姓名、称谓或编号，群体身份需要画面表现时也必须返回群体角色资产。',
              '所有身份、外观、关系、物品归属和连续性事实都以所提供的剧本证据为准；不得为了视觉效果改写原文事实。',
              'ref 使用简短且在本次响应内唯一的英文或数字标识；它只是本次规划引用，不是持久 ID。',
              'sourceChapterIds 只能引用 project.chapters 中存在的 id。',
              '角色 name 只能是姓名或简短身份名：优先使用原文姓名；没有姓名时给出不超过 6 个汉字的身份短称，不得写人物介绍。',
              '角色 role 只能是主角、配角、反派或路人，必须依据人物在完整故事中的实际叙事作用分类；任何身份、关系、经历和叙事说明都写入 description。',
              STORY_ASSET_VOICE_DESCRIPTION_RULE,
              '每项资产至少提供一个信息充分、可直接用于图片生成的 appearance prompt，不得用‘符合设定’‘电影感人物’等空泛表述代替可见细节。',
              '角色 prompt 必须写清脸型、五官、肤色肤质、发型发色、身材体态、服装材质层次、鞋履和必要穿戴细节，并采用正面全身人物设定图构图。',
              '角色 prompt 只生成人设图，不生成人物剧照：聚焦脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身人物设定图构图，不写剧情道具、动作表演、地点、家具、其他人物或剧情场面。',
              '最终 prompt 只能写需要呈现的正向视觉内容，不得复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
              '每个场景资产只能对应一个可独立复用的物理空间；遇到用“/”“／”等并列多个地点的复合场景标题，必须拆成多个原子场景资产，禁止直接复制复合标题作为资产名。',
              '场景 prompt 必须写清空间布局、结构材质、前中后景、关键陈设、光源与色温、时间天气、色彩、镜头视角及景别，并默认无人。',
              '道具 prompt 必须写清用途、轮廓、尺寸比例、材质工艺、颜色纹样、磨损、关键结构及产品设定构图，并默认无人手持。',
              '每个 appearance 都必须提供具体形象名称；角色首个形象也要按服装、身份或时期命名，禁止留空或使用笼统的‘基础形象’。角色显著换装、年龄变化或受伤状态可拆成多个 appearances；其他形象必须重复稳定的脸部、发型和体态特征，只修改剧情差异。同一物理空间在不同年代、完好/损毁、正常/异变、干燥/积水等显著状态下必须拆成多个场景 appearances；道具仍只保留一个形象。',
              style
                ? '每个 appearance prompt 必须逐字以 visualDirection.style 的完整内容开头，再续写资产描述；不得省略、改写或重复此前缀。'
                : '提示词遵循项目视觉方向，但不要把画面比例写进角色身份描述。',
            ]),
      ],
      outputSchema: compactOutput
        ? {
            assets: [
              {
                clientKey: '输入中原样提供的短键',
                include: true,
                description: '可直接公开展示的最终资产简介；未采纳候选可为空字符串',
                visualPrompt: '可直接提交图片模型的最终正向提示词；未采纳候选可为空字符串',
                voiceDescription: STORY_ASSET_VOICE_DESCRIPTION_RULE,
              },
            ],
          }
        : {
            assets: [
              {
                ref: '本次规划中的唯一引用',
                kind: assetKinds2.join('、'),
                name: '角色姓名或简短身份名；场景或道具名称',
                role: '角色只能是主角、配角、反派或路人；场景和道具使用简短叙事作用',
                description: '故事内身份或空间说明',
                voiceDescription:
                  '角色可选，有依据才写，没有则留空；可用标签：年龄：…；性别：…；身份：…；口音：…；情绪底色：…；声线：…；语速：…；说话方式：…；音色特征：…，不要求凑齐。',
                occurrences: '人类可读的出现范围',
                sourceChapterIds: ['chapter id'],
                appearances: [
                  {
                    ref: '资产内唯一形象引用',
                    name: '必填的具体形象名称；按服装、身份或时期命名，禁止使用笼统的基础形象',
                    description: '该形象与基础状态的差异',
                    occurrences: '人类可读的出现范围',
                    sourceChapterIds: ['chapter id'],
                    prompt:
                      '以完整视觉风格开头、可直接用于图片生成的中文提示词；角色采用自然站立的正面全身独立人设图，画面只呈现单个人物',
                  },
                ],
              },
            ],
          },
    };
  return [
    '请执行影视资产提取，并直接返回最终 JSON 结果。',
    '不要复述、复制或改写输入剧本；不要返回任务说明、输入参数、规则或输出格式说明。',
    '本次仅提取：' + assetKinds2.map((value152) => value149[value152]).join('、') + '。',
    '返回 JSON 的顶层必须且只能包含 assets 字段。',
    '下面的 JSON 仅是待分析的输入数据，禁止在答案中复述：',
    '<story_input_json>',
    JSON.stringify(compactOutput ? value150 : addReplicationAssetFrameContract(value150, project)),
    '</story_input_json>',
    '现在直接输出 {"assets":[...]}，不要输出输入内容。',
  ].join('\n');
}
const STORY_ASSET_FORMAT_REPAIR_SYSTEM_PROMPT = [
  '你是严格的 JSON 结果修复器。',
  '只修复输入结果的 JSON 语法、字段名称、字段类型和必填字段，不重新分析剧本。',
  '不得返回原始请求、任务说明、校验说明或 Markdown。',
  '不得删除原结果中已经存在的资产；不得编造原结果无法支持的新人物、场景、道具或剧情事实。',
  '只返回一个顶层仅包含 assets 字段的严格 JSON 对象。',
].join('\n');
function getStoryAssetExtractionFinishReason(value153) {
  return normalizeText(
    value153?.finishReason ||
      value153?.finish_reason ||
      value153?.choices?.[0]?.finish_reason ||
      value153?.data?.choices?.[0]?.finish_reason,
  ).toLowerCase();
}
function isStoryAssetExtractionInputEcho(value154, value155) {
  const list41 = normalizeText(getResultText(value154)),
    list42 = normalizeText(value155);
  if (!list41 || !list42) return false;
  if (list41 === list42) return true;
  const list43 = list42.slice(0, 240);
  if (list43.length >= 120 && list41.startsWith(list43)) return true;
  return (
    list41.includes('<story_input_json>') ||
    (/"task"\s*:\s*"extract_story_assets(?:_by_kind)?"/u.test(list41) &&
      /"project"\s*:/u.test(list41) &&
      /"outputSchema"\s*:/u.test(list41))
  );
}
function classifyStoryAssetExtractionRecovery(value156, error13, value157) {
  const storyAssetExtractionFinishReason = getStoryAssetExtractionFinishReason(value156);
  if (
    storyAssetExtractionFinishReason === 'length' ||
    storyAssetExtractionFinishReason === 'max_tokens' ||
    storyAssetExtractionFinishReason === 'max_output_tokens'
  )
    return { mode: 'rerun', reason: 'length' };
  if (isStoryAssetExtractionInputEcho(value156, value157)) return { mode: 'rerun', reason: 'echo' };
  if (error13?.code === 'STORY_ASSET_VISUAL_PROMPT_MISSING')
    return { mode: 'visual-repair', reason: 'missing-visual-prompt' };
  const text16 = normalizeText(getResultText(value156));
  if (!text16) return { mode: 'rerun', reason: 'empty' };
  if (
    /没有可用的(?:角色|场景|角色或场景)资产/u.test(normalizeText(error13?.message || error13)) &&
    Math.max(0, Math.trunc(Number(error13?.raw?.returnedAssetCount) || 0)) === 0
  )
    return { mode: 'rerun', reason: 'missing-assets' };
  return { mode: 'format-repair', reason: 'invalid-structure' };
}
function buildStoryAssetExtractionFormatRepairPrompt({
  response: response11,
  error: error14,
  assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
  chapterIds: chapterIds = [],
  outputContract: outputContract = '',
} = {}) {
  return [
    '仅修复下面这份已返回结果的 JSON 格式和字段结构。',
    '不要重新分析剧本，不要复述原始请求，不要添加原结果中不存在的资产。',
    '允许的 kind：' +
      (normalizeStringArray(assetKinds).join('、') || STORY_ASSET_EXTRACTION_KINDS.join('、')) +
      '。',
    '允许的 sourceChapterIds：' +
      (normalizeStringArray(chapterIds).join('、') || '仅使用原结果已有值') +
      '。',
    '本地校验错误：' + (normalizeText(error14?.message || error14) || '返回格式不合格'),
    '目标结构：' + normalizeText(outputContract),
    '<rejected_response>',
    normalizeText(getResultText(response11)),
    '</rejected_response>',
    '输出前自行检查：顶层只能有 assets，JSON 必须闭合，所有必填字段必须存在。',
    '现在只返回修复后的 JSON。',
  ].join('\n');
}
function buildStoryAssetExtractionRerunPrompt(value158, value159) {
  const value160 =
    value159 === 'length'
      ? '上一次输出被截断，缺失内容无法通过格式修复恢复。'
      : value159 === 'echo'
        ? '上一次错误地复述了输入，没有生成资产结果。'
        : '上一次没有返回可用的资产内容。';
  return [
    value160,
    '请重新执行当前这一类资产提取；这是唯一一次自动重试。',
    '输出前自行检查：不要复述输入，顶层只能有 assets，JSON 必须完整闭合。',
    value158,
  ].join('\n');
}
async function requestStoryAssetExtractionResult({
  request: request2,
  requestPayload: requestPayload3,
  parse: parse,
  outputContract: outputContract2,
  assetKinds: assetKinds3,
  chapterIds: chapterIds2,
  onProgress: onProgress2,
  automaticRecovery: automaticRecovery = false,
}) {
  const response12 = await request2(requestPayload3);
  try {
    return parse(response12);
  } catch (error15) {
    if (!automaticRecovery) throw error15;
    const mode4 = classifyStoryAssetExtractionRecovery(response12, error15, requestPayload3.prompt),
      value161 = { character: '角色', scene: '场景', prop: '道具' },
      stringArray =
        normalizeStringArray(assetKinds3)
          .map((value162) => value161[value162] || value162)
          .join('、') || '资产',
      message3 = mode4.mode === 'visual-repair',
      stage = mode4.mode === 'format-repair';
    onProgress2?.({
      stage: stage ? 'repairing-assets' : 'retrying-assets',
      current: 1,
      total: 1,
      message: message3
        ? stringArray + '缺少图片提示词，正在依据原片证据补全（1/1）'
        : stage
          ? stringArray + '返回格式不合格，正在自动纠错（1/1）'
          : stringArray + '返回内容不完整，正在仅重试当前类别（1/1）',
    });
    const value163 = message3
        ? {
            ...requestPayload3,
            prompt: [
              '上次结果存在空白或无有效视觉内容的 appearance.prompt；这是唯一一次图片提示词补全。',
              '依据下方原始证据及视觉规则，只补全缺失的图片提示词；保留原资产、形象、引用、来源和已有有效提示词，不增删资产，不把 description 直接复制为 prompt。',
              '每个 appearance.prompt 必须包含可直接生图的具体正向视觉内容，场景默认无人，道具默认无人手持；禁止空字符串和规则说明。',
              '<rejected_response>',
              normalizeText(getResultText(response12)),
              '</rejected_response>',
              requestPayload3.prompt,
            ].join('\n'),
            temperature: 0.1,
          }
        : stage
          ? {
              ...requestPayload3,
              prompt: buildStoryAssetExtractionFormatRepairPrompt({
                response: response12,
                error: error15,
                assetKinds: assetKinds3,
                chapterIds: chapterIds2,
                outputContract: outputContract2,
              }),
              systemPrompt: STORY_ASSET_FORMAT_REPAIR_SYSTEM_PROMPT,
              temperature: 0,
            }
          : {
              ...requestPayload3,
              prompt: buildStoryAssetExtractionRerunPrompt(requestPayload3.prompt, mode4.reason),
              temperature: 0.1,
            },
      value164 = await request2(value163);
    try {
      return parse(
        message3 ? mergeStoryAssetVisualPromptRepair(response12, value164, assetKinds3) : value164,
      );
    } catch (value165) {
      const classifyStoryAssetExtractionRecovery2 = classifyStoryAssetExtractionRecovery(
        value164,
        value165,
        value163.prompt,
      );
      if (classifyStoryAssetExtractionRecovery2.reason === 'length') {
        const error16 = new Error('自动纠错后输出仍被截断。');
        ((error16.type = 'OUTPUT_LENGTH'), (error16.cause = value165));
        throw error16;
      }
      if (classifyStoryAssetExtractionRecovery2.reason === 'echo') {
        const error17 = new Error('自动纠错后模型仍在复述输入。');
        ((error17.type = 'INPUT_ECHO'), (error17.cause = value165));
        throw error17;
      }
      value165.automaticRecovery = {
        attempted: true,
        mode: mode4.mode,
        reason: mode4.reason,
      };
      throw value165;
    }
  }
}
export async function extractStoryAssets({
  project: project = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
  requiredAssetNamesByKind: requiredAssetNamesByKind = null,
  candidateAssetsByKind: candidateAssetsByKind = null,
  requiredAssetsByKind: requiredAssetsByKind = null,
  compactOutput: compactOutput = false,
  maxOutputTokens: maxOutputTokens = 0,
  allowOversizedPrompt: allowOversizedPrompt = false,
  automaticRecovery: automaticRecovery = false,
  structuredOutputFallback: structuredOutputFallback = 'none',
  request: request = generateText,
  onProgress: onProgress = null,
} = {}) {
  assertPlanningModel(model, provider);
  const storyPlanningConstraints2 = resolveStoryPlanningConstraints(project),
    storyProjectInput = normalizeStoryProjectInput(project);
  ((storyProjectInput.planning = storyPlanningConstraints2),
    assertStoryProjectInput(storyProjectInput),
    onProgress?.({
      stage: 'extracting-assets',
      current: 1,
      total: 1,
      message: '正在提取角色、场景与道具',
    }),
    (request = withReplicationRequestPolicy(request, project)));
  const prompt5 = buildStoryAssetExtractionPrompt({
      project: project,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle,
      assetKinds: assetKinds,
      requiredAssetNamesByKind: requiredAssetNamesByKind,
      candidateAssetsByKind: candidateAssetsByKind,
      requiredAssetsByKind: requiredAssetsByKind,
      compactOutput: compactOutput,
    }),
    chapterIds3 = storyProjectInput.chapters.map((value166) => value166.id),
    list44 = normalizeStringArray(assetKinds).filter((value167) =>
      STORY_ASSET_EXTRACTION_KINDS.includes(value167),
    ),
    allowEmptyResult =
      list44.length === 1 &&
      Array.isArray(requiredAssetNamesByKind?.[list44[0]]) &&
      requiredAssetNamesByKind[list44[0]].length === 0,
    value168 = compactOutput
      ? 'assets[{clientKey,include,description,visualPrompt,voiceDescription}]'
      : 'assets[{ref,kind(character|scene|prop),name,role(character: 主角|配角|反派|路人),description,voiceDescription(optional character voice evidence; empty when unknown),occurrences,sourceChapterIds,appearances[{ref,name(required specific visual state),description,occurrences,sourceChapterIds,prompt}]}]',
    value169 = compactOutput
      ? createStoryAssetPromptContracts(
          assetKinds,
          requiredAssetNamesByKind,
          candidateAssetsByKind,
          requiredAssetsByKind,
          { includeClientKeys: true },
        ).payload
      : {},
    value170 = [...(value169.requiredAssets || []), ...(value169.candidateAssets || [])].map(
      (value171) => value171.clientKey,
    );
  return await requestStoryAssetExtractionResult({
    request: request,
    requestPayload: {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: prompt5,
      systemPrompt: STORY_ASSET_EXTRACTION_SYSTEM_PROMPT,
      structuredOutput: createStoryAssetExtractionStructuredOutput({
        assetKinds: assetKinds,
        schema: compactOutput
          ? createStoryAssetCompactExtractionResponseSchema(assetKinds, value170)
          : addReplicationAssetFrameSchema(createStoryAssetExtractionResponseSchema(assetKinds), project),
        fallback: structuredOutputFallback,
        mode: compactOutput ? 'compact' : 'detailed',
      }),
      thinking: { type: 'disabled' },
      temperature: 0.2,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      ...(Math.trunc(Number(maxOutputTokens) || 0) > 0
        ? { maxOutputTokens: Math.trunc(Number(maxOutputTokens)) }
        : {}),
      ...(allowOversizedPrompt ? { allowOversizedPrompt: true } : {}),
    },
    parse: (value172) =>
      compactOutput
        ? parseStoryAssetCompactExtractionResult(value172, {
            assetKinds: assetKinds,
            chapterIds: chapterIds3,
            requiredAssetNamesByKind: requiredAssetNamesByKind,
            requiredAssetsByKind: requiredAssetsByKind,
            candidateAssetsByKind: candidateAssetsByKind,
            visualStyle: normalizeText(visualStyle) || storyProjectInput.visualStyle,
          })
        : attachReplicationAssetFrames(
            parseStoryAssetExtractionResult(value172, {
              chapterIds: chapterIds3,
              allowedKinds: assetKinds,
              allowEmptyResult: allowEmptyResult,
            }),
            value172,
            project,
          ),
    outputContract:
      !compactOutput && project.replicationFrameSources?.length
        ? value168 +
          '; 场景与道具另含 sourceFrame: null 或 {episodeId,eventId,timeSec}，只能引用输入 sourceVideos 中的原片事件与时间。'
        : value168,
    assetKinds: assetKinds,
    chapterIds: chapterIds3,
    onProgress: onProgress,
    automaticRecovery: automaticRecovery,
  });
}
export const extractStoryAssetsParallel = createParallelStoryAssetExtractor({
  schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
  assetKinds: STORY_ASSET_EXTRACTION_KINDS,
  generateText: generateText,
  normalizeText: normalizeText,
  getResultText: getResultText,
  normalizeStoryProjectInput: normalizeStoryProjectInput,
  normalizeAssetReference: normalizeStoryAssetReference,
  parseStoryAssetExtractionResult: parseStoryAssetExtractionResult,
  parseStoryAssetCompactExtractionResult: parseStoryAssetCompactExtractionResult,
  extractStoryAssets: extractStoryAssets,
});
export function buildStoryEpisodePlanningPrompt({
  project: project = {},
  assets: assets = [],
  constraints: constraints = {},
} = {}) {
  const project2 = normalizeStoryProjectInput(project);
  assertStoryProjectInput(project2);
  const assets2 = Array.isArray(assets)
    ? assets.map(normalizePlanningAssetSummary).filter((error18) => error18.name)
    : [];
  if (!assets2.length) throw new Error('请先提取并确认角色、场景与道具资产。');
  const constraints2 = resolveStoryPlanningConstraints(project, constraints),
    value173 = constraints2.episodeCount,
    value174 = Math.max(1, Math.ceil(value173 * 0.9));
  return JSON.stringify({
    task: 'plan_story_episodes',
    schemaVersion: STORY_PLANNING_SCHEMA_VERSION,
    project: project2,
    assets: assets2,
    constraints: constraints2,
    requirements: [
      '目标规划约 ' +
        value173 +
        ' 集，建议保持在 ' +
        value174 +
        '-' +
        value173 +
        ' 集；不要求机械凑满，但不得超过 ' +
        value173 +
        ' 集。',
      '先在内部完成全剧集数与主要剧情节点的分配，再输出分集；不得为了缩短输出而压缩中段或提前收束结局。',
      '只有故事容量确实不足时才可少于 ' + value174 + ' 集；模型输出限制不能作为大幅缩减集数的理由。',
      '后续每个视频片段的时长上限是 ' + constraints2.sceneMaxSeconds + ' 秒；这不是整集时长限制。',
      '每集预计时长只能按该集必要剧情的自然表演时间估算；不设固定最低或最高集长，不得为接近某个秒数注水或删减必要剧情。',
      '覆盖完整故事起因、发展、高潮和结局，不遗漏结局。',
      '每集 sourceChapterIds 和 assetRefs 必须引用输入中真实存在的值。',
      '只规划分集，不生成 clips、分镜、镜头语言或视频提示词。',
    ],
    outputSchema: {
      episodes: [
        {
          ref: '本次规划中的唯一引用',
          title: '分集标题',
          synopsis: '本集完整剧情摘要',
          sourceChapterIds: ['chapter id'],
          assetRefs: ['asset ref'],
          estimatedDurationSeconds:
            '可选；按本集必要剧情、对白、动作、反应和停顿自然估算的正数，不套固定集长',
        },
      ],
    },
  });
}
export function parseStoryEpisodePlanningResult(
  value175,
  { constraints: constraints = {}, chapterIds: chapterIds = [], assetRefs: assetRefs = [] } = {},
) {
  const constraints3 = normalizeStoryPlanningConstraints(constraints),
    strictJson4 = parseStrictJson(getResultText(value175), 'Agent 未返回分集规划结果。'),
    map8 = new Set(normalizeStringArray(chapterIds)),
    value176 = new Set(normalizeStringArray(assetRefs)),
    episodes2 = Array.isArray(strictJson4.episodes)
      ? strictJson4.episodes
          .map((value177, value178) => {
            const title4 = normalizeText(value177?.title),
              synopsis = normalizeText(value177?.synopsis);
            if (!title4 || !synopsis) return null;
            const sourceChapterIds = normalizeStringArray(value177?.sourceChapterIds),
              assetRefs2 = normalizeStringArray(value177?.assetRefs);
            if (map8.size) {
              const list45 = sourceChapterIds.filter((value179) => !map8.has(value179));
              if (list45.length)
                throw new Error('分集“' + title4 + '”引用了不存在的章节：' + list45.join('、') + '。');
            }
            value176.size && assertKnownReferences(assetRefs2, value176, '分集“' + title4 + '”');
            const estimatedDurationSeconds = normalizePositiveNumber(
              value177?.estimatedDurationSeconds || value177?.durationSeconds,
            );
            return {
              ref: normalizeStoryAssetReference(value177?.ref, 'episode-' + (value178 + 1)),
              title: title4,
              synopsis: synopsis,
              sourceChapterIds: sourceChapterIds,
              assetRefs: assetRefs2,
              ...(estimatedDurationSeconds ? { estimatedDurationSeconds: estimatedDurationSeconds } : {}),
            };
          })
          .filter(Boolean)
      : [];
  if (!episodes2.length) throw new Error('Agent 返回结果没有可用分集。');
  if (episodes2.length > constraints3.episodeCount)
    throw new Error(
      'Agent 返回了 ' + episodes2.length + ' 集，超过 ' + constraints3.episodeCount + ' 集上限。',
    );
  const list46 = episodes2.map((value180) => value180.ref);
  if (new Set(list46).size !== list46.length) throw new Error('Agent 返回了重复的分集引用。');
  return { schemaVersion: STORY_PLANNING_SCHEMA_VERSION, constraints: constraints3, episodes: episodes2 };
}
export async function planStoryEpisodes({
  project: project = {},
  assets: assets = [],
  constraints: constraints = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  request: request = generateText,
  onProgress: onProgress = null,
} = {}) {
  assertPlanningModel(model, provider);
  const project3 = normalizeStoryProjectInput(project);
  assertStoryProjectInput(project3);
  const assets3 = Array.isArray(assets)
    ? assets.map(normalizePlanningAssetSummary).filter((error19) => error19.name)
    : [];
  if (!assets3.length) throw new Error('请先提取并确认角色、场景与道具资产。');
  const constraints4 = resolveStoryPlanningConstraints(project, constraints);
  onProgress?.({ stage: 'planning-episodes', current: 1, total: 1, message: '正在规划分集' });
  const prompt6 = buildStoryEpisodePlanningPrompt({
    project: project3,
    assets: assets3,
    constraints: constraints4,
  });
  return await requestStrictResult({
    request: request,
    requestPayload: {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: prompt6,
      systemPrompt: STORY_EPISODE_PLANNING_SYSTEM_PROMPT,
      temperature: 0.35,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
    },
    parse: (value181) =>
      parseStoryEpisodePlanningResult(value181, {
        constraints: constraints4,
        chapterIds: project3.chapters.map((value182) => value182.id),
        assetRefs: assets3.map((value183) => value183.ref),
      }),
    outputContract:
      'episodes (1-' +
      constraints4.episodeCount +
      ') [{ref,title,synopsis,sourceChapterIds,assetRefs,estimatedDurationSeconds?}]',
  });
}
function buildStoryEpisodeSplitProjectContext(
  options12 = {},
  title5 = {},
  { sourceBeats: sourceBeats = null } = {},
) {
  const value184 = Array.isArray(sourceBeats),
    map9 = new Set(
      (Array.isArray(sourceBeats) ? sourceBeats : []).flatMap((value185) =>
        normalizeStringArray(value185?.characters),
      ),
    ),
    list47 = (Array.isArray(sourceBeats) ? sourceBeats : [])
      .flatMap((dom4) => [dom4?.heading, dom4?.body])
      .map(normalizeText)
      .filter(Boolean)
      .join('\n');
  return {
    title: title5.title,
    storyType: title5.storyType,
    targetAudience: normalizeText(options12?.targetAudience),
    summary: title5.summary,
    background: title5.background,
    setting: title5.setting,
    coreHook: normalizeText(options12?.coreHook),
    logline: title5.logline,
    scriptMode: title5.scriptMode,
    aspectRatio: title5.aspectRatio,
    visualStyle: title5.visualStyle,
    characters: Array.isArray(options12?.characters)
      ? options12.characters
          .map((value186, value187) => {
            const ref2 = normalizeStorySummaryCharacter(value186, value187);
            if (!ref2) return null;
            if (value184 && !map9.has(ref2.name) && !list47.includes(ref2.name)) return null;
            const args14 = {
              ref: ref2.ref,
              name: ref2.name,
              roleType: ref2.roleType,
            };
            return {
              ...args14,
              coreTags: ref2.coreTags,
              profile: ref2.profile,
              motivation: ref2.motivation,
              relationships: ref2.relationships,
              personality: ref2.personality,
              arc: ref2.arc,
            };
          })
          .filter(Boolean)
      : [],
    planning: title5.planning,
  };
}
function selectStoryEpisodeSplitAssets(list48 = [], value188 = {}) {
  const list49 = (Array.isArray(list48) ? list48 : [])
    .map((asset, value189) => ({
      asset: asset,
      normalized: normalizePlanningAssetSummary(asset, value189),
    }))
    .filter(({ normalized: normalized }) => normalized.name);
  if (!list49.length) return [];
  const map10 = new Set(
      [...normalizeStringArray(value188?.assetRefs), ...normalizeStringArray(value188?.assetIds)]
        .map((value190) => normalizeStoryAssetReference(value190, ''))
        .filter(Boolean),
    ),
    args15 = new Set(
      (Array.isArray(value188?.script?.scenes) ? value188.script.scenes : [])
        .map((value191) => normalizeStoryAssetReference(value191?.ref || value191?.id, ''))
        .filter(Boolean),
    ),
    list50 = [
      value188?.title,
      value188?.synopsis,
      value188?.hook,
      value188?.script?.fullText,
      value188?.fullScript,
      value188?.scriptText,
      ...(Array.isArray(value188?.script?.scenes)
        ? value188.script.scenes.flatMap((dom5) => [
            dom5?.heading,
            ...(Array.isArray(dom5?.characters) ? dom5.characters : []),
            dom5?.body,
          ])
        : []),
    ]
      .map(normalizeText)
      .filter(Boolean)
      .join('\n'),
    args16 = list49.filter(({ asset: asset2, normalized: normalized2 }) => {
      const list51 = [asset2?.ref, asset2?.planningRef, asset2?.id, normalized2.ref]
        .map((value192) => normalizeStoryAssetReference(value192, ''))
        .filter(Boolean);
      return (
        list51.some((value193) => map10.has(value193)) ||
        (normalized2.name && list50.includes(normalized2.name))
      );
    }),
    list52 = getStoryEpisodeReferenceAliases(value188),
    handler6 = (value194, value195) =>
      normalizeStringArray([
        ...normalizeStringArray(value194?.[value195]),
        ...(Array.isArray(value194?.appearances)
          ? value194.appearances.flatMap((value196) => normalizeStringArray(value196?.[value195]))
          : []),
      ]),
    args17 = list49.filter(({ normalized: normalized3 }) =>
      handler6(normalized3, 'sourceSceneRefs').some((value197) =>
        [...args15].some((value198) => storyEpisodeSourceSceneRefsMatch(value197, value198, list52)),
      ),
    ),
    args18 = list49.filter(({ normalized: normalized4 }) =>
      handler6(normalized4, 'sourceEpisodeRefs').some((value199) => list52.includes(value199)),
    ),
    map11 = new Set();
  return [...args16, ...args17, ...args18]
    .map(({ normalized: normalized5 }) => normalized5)
    .filter((value200) => {
      if (map11.has(value200.ref)) return false;
      return (map11.add(value200.ref), true);
    });
}
function getStoryEpisodeReferenceAliases(options13 = {}) {
  return [
    ...new Set(
      [
        options13?.id,
        options13?.ref,
        options13?.planningRef,
        options13?.script?.episodeRef,
      ]
        .map((value201) => normalizeStoryAssetReference(value201, ''))
        .filter(Boolean),
    ),
  ];
}
function storyEpisodeSourceSceneRefsMatch(value202 = '', value203 = '', value204 = []) {
  const text17 = normalizeText(value202),
    text18 = normalizeText(value203);
  if (!text17 || !text18) return false;
  if (text17 === text18) return true;
  const stringArray2 = normalizeStringArray(value204),
    handler7 = (list53) => {
      for (const value205 of stringArray2) {
        const list54 = value205 + ':';
        if (list53.startsWith(list54)) return list53.slice(list54.length);
      }
      return list53;
    };
  return handler7(text17) === handler7(text18);
}
function storyAssetMatchesEpisode(options14 = {}, value206 = []) {
  const list55 = normalizeStringArray(options14?.sourceEpisodeRefs);
  if (!list55.length) return true;
  const map12 = new Set(normalizeStringArray(value206));
  return list55.some((value207) => map12.has(value207));
}
function getStoryEpisodeSceneAssetCandidates(
  options15 = {},
  value208 = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  return (Array.isArray(value208) ? value208 : []).filter((value209) => {
    if (value209?.kind !== 'scene') return false;
    if (!storyAssetMatchesEpisode(value209, episodeRefs)) return false;
    const list56 = normalizeStringArray(value209?.sourceSceneRefs);
    return list56.some((value210) =>
      storyEpisodeSourceSceneRefsMatch(value210, options15?.ref, episodeRefs),
    );
  });
}
function getStoryEpisodeBlueprintSceneAssetRefs(
  list57 = [],
  value211 = [],
  value212 = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  const map13 = new Map(
      (Array.isArray(value211) ? value211 : []).map((value213) => [
        normalizeText(value213?.ref),
        value213,
      ]),
    ),
    map14 = new Map();
  return (
    normalizeStringArray(list57).forEach((value214) => {
      const list58 = getStoryEpisodeSceneAssetCandidates(map13.get(value214), value212, {
        episodeRefs: episodeRefs,
      });
      list58.length === 1 && map14.set(value214, normalizeText(list58[0]?.ref));
    }),
    map14
  );
}
function assertStoryEpisodeSceneAssetCoverage(
  list59 = [],
  value215 = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  const list60 = (Array.isArray(value215) ? value215 : []).filter(
    (value216) => value216?.kind === 'scene',
  );
  if (!list60.some((value217) => normalizeStringArray(value217?.sourceSceneRefs).length)) return;
  const list61 = list59.filter(
    (value218) =>
      !getStoryEpisodeSceneAssetCandidates(value218, list60, { episodeRefs: episodeRefs }).length,
  );
  if (list61.length) {
    const value219 = list61.map(
      (value220) =>
        normalizeStorySceneHeadingIdentity(value220?.heading) || normalizeText(value220?.heading),
    )
      .filter(Boolean)
      .join('、');
    throw new Error(
      '场景资产未完整覆盖当前分集正文：' +
        (value219 || '存在未绑定场景') +
        '。请先重新提取场景资产；本次未调用模型。',
    );
  }
  const list62 = list59.filter(
    (value221) =>
      getStoryEpisodeSceneAssetCandidates(value221, list60, { episodeRefs: episodeRefs }).length > 1,
  );
  if (list62.length) {
    const value222 = list62.map(
      (value223) =>
        normalizeStorySceneHeadingIdentity(value223?.heading) || normalizeText(value223?.heading),
    )
      .filter(Boolean)
      .join('、');
    throw new Error(
      '场景资产存在重复绑定：' +
        (value222 || '存在多重绑定场景') +
        '。请先重新提取场景资产；本次未调用模型。',
    );
  }
}
function normalizeStoryEpisodeSplitContinuityEpisode(
  enabled8 = null,
  { includeEnding: includeEnding = false } = {},
) {
  if (!enabled8 || typeof enabled8 !== 'object') return null;
  const value224 = Array.isArray(enabled8?.script?.scenes) ? enabled8.script.scenes : [],
    dom6 = value224.at(-1),
    endingExcerpt = normalizeText(
      enabled8?.script?.fullText || enabled8?.fullScript || enabled8?.scriptText,
    );
  return {
    number: Math.max(1, Math.trunc(Number(enabled8?.number) || 1)),
    title: normalizeText(enabled8?.title),
    synopsis: normalizeText(enabled8?.synopsis),
    hook: normalizeText(enabled8?.hook),
    ...(includeEnding && dom6
      ? {
          endingScene: {
            heading: normalizeText(dom6?.heading),
            characters: normalizeStringArray(dom6?.characters),
            body: normalizeText(dom6?.body),
          },
        }
      : includeEnding && endingExcerpt
        ? { endingExcerpt: endingExcerpt.slice(-1200) }
        : {}),
  };
}
function normalizeStoryEpisodeClipDurationConstraints(enabled9 = null) {
  if (!enabled9 || typeof enabled9 !== 'object') return null;
  const allowedSeconds = [
      ...new Set(
        (Array.isArray(enabled9.allowedSeconds) ? enabled9.allowedSeconds : [])
          .map((value225) => normalizePositiveNumber(value225))
          .filter(Boolean),
      ),
    ].sort((value226, value227) => value226 - value227),
    minSeconds = normalizePositiveNumber(enabled9.minSeconds) || allowedSeconds[0] || 0,
    maxSeconds = normalizePositiveNumber(enabled9.maxSeconds) || allowedSeconds.at(-1) || 0,
    stepSeconds = normalizePositiveNumber(enabled9.stepSeconds) || 0;
  if (!minSeconds && !maxSeconds && !stepSeconds && !allowedSeconds.length) return null;
  return {
    minSeconds: minSeconds,
    maxSeconds: maxSeconds,
    stepSeconds: stepSeconds,
    allowedSeconds: allowedSeconds,
  };
}
export function buildStoryEpisodeSplitPrompt({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
} = {}) {
  const scriptMode2 = normalizeStoryProjectInput(project),
    sourceScenes2 = getStoryEpisodeSplitSourceSceneMetadata(episode),
    episode2 = {
      ref: normalizeStoryAssetReference(
        episode?.ref || episode?.planningRef || episode?.id,
        'episode-1',
      ),
      title: normalizeText(episode?.title),
      text: sanitizeStoryEpisodeSplitPromptText(
        episode?.script?.fullText ||
          episode?.fullScript ||
          episode?.scriptText ||
          episode?.synopsis ||
          episode?.content,
        episode,
      ),
      ...(sourceScenes2.length ? { sourceScenes: sourceScenes2 } : {}),
    };
  if (!episode2.title || !episode2.text) throw new Error('分集缺少标题或正文，无法生成分镜脚本。');
  const assets4 = selectStoryEpisodeSplitAssets(assets, episode);
  if (!assets4.some((value228) => value228.kind === 'scene'))
    throw new Error('分集缺少可用的场景资产，无法生成必需的片段场景设定。');
  const storyPlanningConstraints3 = resolveStoryPlanningConstraints(project, constraints),
    promptMode2 = resolveStoryPromptMode(project, constraints),
    clipMaxSeconds = resolveStoryPromptModeClipMaxSeconds(
      promptMode2,
      storyPlanningConstraints3.sceneMaxSeconds,
    ),
    scenes4 = createStoryEpisodeSplitPromptSceneCatalog(assets4, promptMode2),
    value229 = '每个 clip 的 shots 总时长不超过用户设置的 ' + clipMaxSeconds + ' 秒。';
  return serializeReplicationGenerationPrompt(
    {
      task: 'format_story_episode_as_compact_json',
      schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
      scriptMode: scriptMode2.scriptMode,
      ...(promptMode2 !== 'seedance-2.0' ? { promptMode: promptMode2 } : {}),
      episode: episode2,
      ...(episode.replication?.sourceAnalysis
        ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
        : {}),
      assets: assets4.map((value230) => compactStoryEpisodePromptAsset(value230)),
      scenes: scenes4,
      constraints: { clipMaxSeconds: clipMaxSeconds },
      requirements: [
        value229,
        ...[buildVideoReplicationTimingGuidance(episode)].filter(Boolean),
        '完整覆盖正文从开头到结尾，对白逐字保留，原剧本明确标注的旁白也逐字保留，并保持剧情事件、因果、人物关系和结尾。整集总时长、片段数量与每片段的镜头数量由正文实际结构决定。' +
          STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
        STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
        STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
        'assets 只包含本集已确认出场的角色、场景和道具；仅在当前镜头实际可见时使用对应资产，不得调用或编造其他集资产。',
        '' +
          STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
          STORY_EPISODE_SPLIT_CAMERA_GUIDANCE +
          'a 记录与当前画面同步的环境声、动作声和表演声。',
        getVideoReplicationSpeechGuidance(episode) ||
          (scriptMode2.scriptMode === STORY_SCRIPT_MODE_NARRATION
            ? STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE
            : STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE),
        ...getStoryEpisodeTimelinePlanningRequirements(promptMode2),
      ],
      outputFormat: isStoryContinuousTimelinePromptMode(promptMode2)
        ? '{"clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":integerSeconds,"startSec":previousEndSec,"endSec":integerSeconds,"v":"nextVisual","c":"nextCamera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}'
        : '{"clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextVisual","c":"nextCamera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}',
    },
    episode,
  );
}
function buildStoryEpisodeMinimalSplitPrompt({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
} = {}) {
  const scriptMode3 = normalizeStoryProjectInput(project),
    storyPlanningConstraints4 = resolveStoryPlanningConstraints(project, constraints),
    promptMode3 = resolveStoryPromptMode(project, constraints),
    clipMaxSeconds2 = resolveStoryPromptModeClipMaxSeconds(
      promptMode3,
      storyPlanningConstraints4.sceneMaxSeconds,
    ),
    ref3 = normalizeStoryAssetReference(
      episode?.ref || episode?.planningRef || episode?.id,
      'episode-1',
    ),
    title6 = normalizeText(episode?.title) || '本集',
    text19 = sanitizeStoryEpisodeSplitPromptText(
      episode?.script?.fullText ||
        episode?.fullScript ||
        episode?.scriptText ||
        episode?.synopsis ||
        episode?.content,
      episode,
    );
  if (!text19) throw new Error('分集缺少正文，无法生成分镜脚本。');
  const assets5 = selectStoryEpisodeSplitAssets(assets, episode),
    scenes5 = createStoryEpisodeSplitPromptSceneCatalog(assets5, promptMode3);
  if (!scenes5.length) throw new Error('分集缺少可用的场景资产，无法生成分镜脚本。');
  return serializeReplicationGenerationPrompt(
    {
      task: 'split_story_episode',
      ...(episode.replication?.sourceAnalysis
        ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
        : {}),
      scriptMode: scriptMode3.scriptMode,
      ...(promptMode3 !== 'seedance-2.0' ? { promptMode: promptMode3 } : {}),
      episode: { ref: ref3, title: title6, text: text19, scenes: scenes5 },
      assets: assets5.map((value231) => compactStoryEpisodePromptAsset(value231)),
      clipMaxSeconds: clipMaxSeconds2,
      instruction: [
        ...[buildVideoReplicationTimingGuidance(episode)].filter(Boolean),
        '按正文顺序完整拆分，场景变化时切换 s，原对白放 q。' +
          (getVideoReplicationSpeechGuidance(episode) ||
            (scriptMode3.scriptMode === STORY_SCRIPT_MODE_NARRATION
              ? STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE
              : STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE)) +
          STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE +
          STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE +
          STORY_EPISODE_SPLIT_GROUPING_GUIDANCE +
          STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
          STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
        'assets 只包含本集已确认出场的角色、场景和道具；不得调用或编造其他集资产。',
        ...getStoryEpisodeTimelinePlanningRequirements(promptMode3),
      ].join('\n'),
      output: isStoryContinuousTimelinePromptMode(promptMode3)
        ? '{"clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"cameraVisibleAction","c":"cameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":integerSeconds,"startSec":previousEndSec,"endSec":integerSeconds,"v":"nextCameraVisibleAction","c":"nextCameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}'
        : '{"clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"cameraVisibleAction","c":"cameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextCameraVisibleAction","c":"nextCameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}',
    },
    episode,
  );
}
export function buildStoryEpisodesSplitPrompt({
  project: project = {},
  episodes: episodes = [],
  assets: assets = [],
  constraints: constraints = {},
} = {}) {
  const scriptMode4 = normalizeStoryProjectInput(project),
    storyPlanningConstraints5 = resolveStoryPlanningConstraints(project, constraints),
    promptMode4 = resolveStoryPromptMode(project, constraints),
    clipMaxSeconds3 = resolveStoryPromptModeClipMaxSeconds(
      promptMode4,
      storyPlanningConstraints5.sceneMaxSeconds,
    ),
    episodes3 = (Array.isArray(episodes) ? episodes : []).map((value232, value233) => {
      const ref4 = normalizeStoryAssetReference(
          value232?.ref || value232?.planningRef || value232?.id,
          'episode-' + (value233 + 1),
        ),
        title7 = normalizeText(value232?.title) || '第 ' + (value233 + 1) + ' 集',
        text20 = sanitizeStoryEpisodeSplitPromptText(
          value232?.script?.fullText ||
            value232?.fullScript ||
            value232?.scriptText ||
            value232?.synopsis ||
            value232?.content,
          value232,
        );
      if (!text20) throw new Error('第 ' + (value233 + 1) + ' 集缺少正文，无法生成分镜脚本。');
      const assets6 = selectStoryEpisodeSplitAssets(assets, value232),
        scenes6 = createStoryEpisodeSplitPromptSceneCatalog(assets6, promptMode4);
      if (!scenes6.length)
        throw new Error('第 ' + (value233 + 1) + ' 集缺少可用的场景资产，无法生成分镜脚本。');
      return {
        ref: ref4,
        title: title7,
        text: text20,
        assets: assets6.map((value234) => compactStoryEpisodePromptAsset(value234)),
        scenes: scenes6,
        ...(value232.replication?.sourceAnalysis
          ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(value232, project, assets) }
          : {}),
      };
    });
  if (!episodes3.length) throw new Error('没有可生成分镜的分集。');
  return JSON.stringify({
    task: 'split_story_episodes',
    scriptMode: scriptMode4.scriptMode,
    ...(promptMode4 !== 'seedance-2.0' ? { promptMode: promptMode4 } : {}),
    episodes: episodes3,
    clipMaxSeconds: clipMaxSeconds3,
    instruction: [
      '按正文顺序完整拆分，场景变化时切换 s，原对白放 q。' +
        (episodes3.find((value235) => value235.sourceVideoEvidence)?.sourceVideoEvidence.speechGuidance ||
          (scriptMode4.scriptMode === STORY_SCRIPT_MODE_NARRATION
            ? STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE
            : STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE)) +
        STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE +
        STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE +
        STORY_EPISODE_SPLIT_GROUPING_GUIDANCE +
        STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
        STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
      '每个 episode.assets 只包含该集已确认出场的角色、场景和道具；不得跨集调用资产。',
      ...getStoryEpisodeTimelinePlanningRequirements(promptMode4),
    ].join('\n'),
    output: isStoryContinuousTimelinePromptMode(promptMode4)
      ? '{"episodes":[{"episodeRef":"episodeRef","clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"cameraVisibleAction","c":"cameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":integerSeconds,"startSec":previousEndSec,"endSec":integerSeconds,"v":"nextCameraVisibleAction","c":"nextCameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}]}'
      : '{"episodes":[{"episodeRef":"episodeRef","clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"cameraVisibleAction","c":"cameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextCameraVisibleAction","c":"nextCameraViewAndMovement","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}]}',
  });
}
function buildStoryEpisodesSplitValidationPrompt({
  episodeRefs: episodeRefs = [],
  result: result = '',
  promptMode: promptMode = 'seedance-2.0',
} = {}) {
  return [
    '任务：检查下面的批量分镜返回，并修复 JSON 语法、外层包装或字段名称。',
    '必须完整保留已有剧集、片段以及每个镜头原本所属的 clip，只修复格式，不改变 shots 数量或归属；不要重新创作。',
    '剧集引用：' + normalizeStringArray(episodeRefs).join('、'),
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '必须保留每个 shot 的 startSec、endSec 和 d，只修复字段包装；不得删除或重算时间轴。'
      : '',
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '返回格式：{"episodes":[{"episodeRef":"episodeRef","clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}]}。'
      : '返回格式：{"episodes":[{"episodeRef":"episodeRef","clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextVisual","c":"nextCamera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}]}。示意中的两个 shot 只说明同一 clip 可以承载连续镜头，不代表固定数量。',
    '待检查结果：',
    String(result || ''),
  ].join('\n');
}
function buildStoryEpisodeSplitValidationPrompt({
  episodeRef: episodeRef = '',
  result: result = '',
  promptMode: promptMode = 'seedance-2.0',
} = {}) {
  return [
    '任务：检查下面这一集的分镜返回，并修复 JSON 语法、外层包装或字段名称。',
    '必须完整保留已有片段以及每个镜头原本所属的 clip，只修复格式，不改变 shots 数量或归属；不要重新创作。',
    '剧集引用：' + normalizeText(episodeRef),
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '必须保留每个 shot 的 startSec、endSec 和 d，只修复字段包装；不得删除或重算时间轴。'
      : '',
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '返回格式：{"clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}。'
      : '返回格式：{"clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextVisual","c":"nextCamera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}。示意中的两个 shot 只说明同一 clip 可以承载连续镜头，不代表固定数量。',
    '待检查结果：',
    String(result || ''),
  ].join('\n');
}
function normalizeStoryEpisodeSplitSourceScenes(options16 = {}) {
  const ref5 = getStoryEpisodeReferenceAliases(options16)[0] || 'episode-1',
    list63 = (Array.isArray(options16?.script?.scenes) ? options16.script.scenes : [])
      .map((dom7, value236) => ({
        ref: normalizeStoryAssetReference(dom7?.ref || dom7?.id, ref5 + '-scene-' + (value236 + 1)),
        heading: normalizeText(dom7?.heading),
        characters: normalizeStringArray(dom7?.characters),
        body: normalizeText(dom7?.body),
      }))
      .filter((dom8) => dom8.heading || dom8.body);
  if (list63.length) return list63;
  const text21 = normalizeText(
    options16?.script?.fullText ||
      options16?.fullScript ||
      options16?.scriptText ||
      options16?.synopsis ||
      options16?.content,
  );
  return splitStorySourceText(text21, 4000).map((body2, value237) => ({
    ref: ref5 + '-source-section-' + (value237 + 1),
    heading: (normalizeText(options16?.title) || '本集') + '·文本段' + (value237 + 1),
    characters: [],
    body: body2,
  }));
}
function splitStoryEpisodeSourceBeatLine(value238 = '', value239 = 240) {
  const list64 = normalizeText(value238);
  if (!list64) return [];
  const value240 = Math.max(80, Math.trunc(Number(value239) || 240));
  if (list64.length <= value240) return [list64];
  const list65 = list64.match(/^[^：:\r\n]{1,24}[：:]\s*/u)?.[0] || '',
    list66 = [];
  let list67 = list65 ? list64.slice(list65.length).trim() : list64;
  const value241 = Math.max(60, value240 - list65.length);
  while (list67.length > value241) {
    const args19 = list67.slice(0, value241 + 1),
      list68 = [...args19.matchAll(/[。！？；.!?;]/gu)],
      value242 = list68.map((value243) => Number(value243.index) + 1)
        .filter((value244) => value244 >= Math.floor(value241 * 0.45) && value244 <= value241)
        .at(-1),
      value245 = value242 || value241;
    (list66.push('' + list65 + list67.slice(0, value245).trim()),
      (list67 = list67.slice(value245).trim()));
  }
  if (list67) list66.push('' + list65 + list67);
  return list66.filter(Boolean);
}
function extractStoryEpisodeDialogueUnits(value246 = '', ref6 = 'source-beat', value247 = []) {
  const list69 = [],
    list70 = normalizeStringArray(value247),
    map15 = new Set(['旁白', '出场人物', '人物', '时间', '地点', '场景', '音效']);
  return (
    String(value246 || '')
      .split(/\r?\n/u)
      .forEach((value248) => {
        const list71 = value248.trim();
        if (!list71) return;
        const enabled10 = list71.match(/^([^：:\n]{1,20})[：:]\s*(.+)$/u),
          text22 = normalizeText(enabled10?.[1]).replace(/\s*[（(][^）)]*[）)]\s*$/u, ''),
          count5 = list71.search(/[“「『"]/u),
          list72 = count5 >= 0 ? list71.slice(0, count5) : '',
          list73 = list70.filter((value249) => value249 && list72.includes(value249)),
          speaker2 = list70.includes(text22)
            ? text22
            : list73.length === 1
              ? list73[0]
              : text22 &&
                  !map15.has(text22) &&
                  !/(?:说道|问道|答道|喊道|叫道|叫住[他她]|开口|低声道|高声道|轻声道|冷声道|厉声道|喃喃道|嘀咕道)$/u.test(text22)
                ? text22
                : '',
          list74 = [],
          value250 = /“([^”\n]+)”|「([^」\n]+)」|『([^』\n]+)』|"([^"\n]+)"/gu;
        for (const value251 of list71.matchAll(value250)) {
          const text23 = normalizeText(value251[1] || value251[2] || value251[3] || value251[4]);
          if (text23) list74.push({ text: text23, sourceOffset: Number(value251.index) || 0 });
        }
        if (list74.length) {
          list69.push(
            ...list74.map((args20) => ({
              ...args20,
              ...(speaker2 ? { speaker: speaker2 } : {}),
            })),
          );
          return;
        }
        if (!enabled10) return;
        const speaker3 = speaker2,
          text24 = normalizeText(enabled10[2])
            .replace(/^(?:(?:（[^）]*）|\([^)]*\))\s*)+/u, '')
            .trim();
        if (!speaker3 || !text24 || map15.has(speaker3)) return;
        list69.push({ speaker: speaker3, text: text24, sourceOffset: 0 });
      }),
    list69.map((speaker4, value252) => ({
      ref: ref6 + '-dialogue-' + (value252 + 1),
      ...(speaker4.speaker ? { speaker: speaker4.speaker } : {}),
      text: speaker4.text,
    }))
  );
}
function createStoryEpisodeSourceBeat({
  ref: ref = '',
  sourceSceneRef: sourceSceneRef = '',
  order: order = 0,
  heading: heading = '',
  characters: characters = [],
  body: body = '',
} = {}) {
  const ref7 = normalizeText(ref),
    body3 = normalizeText(body);
  return {
    ref: ref7,
    sourceSceneRef: sourceSceneRef,
    order: order,
    heading: heading,
    characters: characters,
    body: body3,
    dialogueUnits: extractStoryEpisodeDialogueUnits(body3, ref7, characters),
  };
}
export function normalizeStoryEpisodeSplitSourceBeats(options17 = {}) {
  const list75 = normalizeStoryEpisodeSplitSourceScenes(options17),
    order2 = [];
  list75.forEach((ref8) => {
    const list76 = normalizeText(ref8.body)
        .split(/\r?\n/u)
        .map(normalizeText)
        .filter(Boolean)
        .flatMap((value253) => splitStoryEpisodeSourceBeatLine(value253)),
      list77 = list76.length ? list76 : [normalizeText(ref8.heading)].filter(Boolean);
    list77.forEach((body4, value254) => {
      order2.push(
        createStoryEpisodeSourceBeat({
          ref: ref8.ref + '-beat-' + (value254 + 1),
          sourceSceneRef: ref8.ref,
          order: order2.length + 1,
          heading: ref8.heading,
          characters: ref8.characters,
          body: body4,
        }),
      );
    });
  });
  if (!order2.length) throw new Error('实验分批拆分没有找到可用的原文块。');
  const list78 = order2.map((value255) => value255.ref);
  if (new Set(list78).size !== list78.length) throw new Error('实验分批拆分生成了重复的原文块引用。');
  return order2;
}
export function normalizeStoryEpisodeExperimentalSourceBeats(options18 = {}) {
  const list79 = normalizeStoryEpisodeSplitSourceBeats(options18);
  if (list79.length <= STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH * 2) return list79;
  const list80 = normalizeStoryEpisodeSplitSourceScenes(options18),
    order3 = [];
  list80.forEach((sourceSceneRef2) => {
    const list81 = normalizeText(sourceSceneRef2.body)
        .split(/\r?\n/u)
        .map(normalizeText)
        .filter(Boolean)
        .flatMap((value256) =>
          splitStoryEpisodeSourceBeatLine(value256, STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_MAX_CHARACTERS),
        ),
      list82 = list81.length ? list81 : [normalizeText(sourceSceneRef2.heading)].filter(Boolean);
    let body5 = [],
      value257 = 0;
    const run = () => {
      if (!body5.length) return;
      const value258 =
          order3.filter((value259) => value259.sourceSceneRef === sourceSceneRef2.ref).length +
          1,
        ref9 = sourceSceneRef2.ref + '-semantic-beat-' + value258;
      (order3.push(
        createStoryEpisodeSourceBeat({
          ref: ref9,
          sourceSceneRef: sourceSceneRef2.ref,
          order: order3.length + 1,
          heading: sourceSceneRef2.heading,
          characters: sourceSceneRef2.characters,
          body: body5.join('\n'),
        }),
      ),
        (body5 = []),
        (value257 = 0));
    };
    (list82.forEach((list83) => {
      const value260 = value257 + (body5.length ? 1 : 0) + list83.length;
      (body5.length && value260 > STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_MAX_CHARACTERS && run(),
        body5.push(list83),
        (value257 += (body5.length > 1 ? 1 : 0) + list83.length),
        value257 >= STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_TARGET_CHARACTERS && run());
    }),
      run());
  });
  if (!order3.length) throw new Error('实验分批拆分没有找到可用的语义原文块。');
  return order3;
}
function normalizeStoryEpisodeSplitBlueprintAssetRefs(
  value261,
  { assetsByRef: assetsByRef = new Map(), kind: kind = '', label: label = '片段计划' } = {},
) {
  return normalizeStringArray(value261).map((value262) => {
    const enabled11 = assetsByRef.get(value262);
    if (!enabled11 || (kind && enabled11.kind !== kind))
      throw new Error(
        label +
          ' 引用了无效的' +
          (kind === 'character' ? '角色' : kind === 'prop' ? '道具' : '') +
          '资产“' +
          value262 +
          '”。',
      );
    return value262;
  });
}
export function parseStoryEpisodeSplitBlueprint(
  value263,
  {
    episodeRef: episodeRef = '',
    episodeRefs: episodeRefs = [],
    sourceScenes: sourceScenes = [],
    sourceBeats: sourceBeats = [],
    assets: assets = [],
    constraints: constraints = {},
    enforceMaxDuration: enforceMaxDuration = true,
    includeDirectorContinuity: includeDirectorContinuity = false,
  } = {},
) {
  const strictJson5 = parseStrictJson(getResultText(value263), 'Agent 未返回分镜蓝图。'),
    episodeRef4 = normalizeStoryAssetReference(episodeRef, 'episode-1');
  if (normalizeStoryAssetReference(strictJson5?.episodeRef, '') !== episodeRef4)
    throw new Error('Agent 返回的分镜蓝图与当前分集不一致。');
  const storyPlanningConstraints6 = normalizeStoryPlanningConstraints(constraints),
    map16 = new Set(
      (Array.isArray(sourceScenes) ? sourceScenes : []).map((value264) =>
        normalizeText(value264?.ref),
      ),
    ),
    map17 = new Map(
      (Array.isArray(sourceScenes) ? sourceScenes : []).map((value265) => [
        normalizeText(value265?.ref),
        value265,
      ]),
    ),
    list84 = Array.isArray(sourceBeats) ? sourceBeats : [],
    map18 = new Map(list84.map((value266) => [normalizeText(value266?.ref), value266]));
  if (!map18.size || map18.size !== list84.length)
    throw new Error('实验分批拆分缺少唯一、有效的原文块引用。');
  const assetsByRef2 = new Map(
      (Array.isArray(assets) ? assets : []).map((value267) => [
        normalizeText(value267?.ref),
        value267,
      ]),
    ),
    clipPlans2 = (Array.isArray(strictJson5?.clipPlans) ? strictJson5.clipPlans : []).map(
      (value268, value269) => {
        const label2 = '片段计划 ' + (value269 + 1),
          ref10 = normalizeStoryAssetReference(value268?.ref, episodeRef4 + '-plan-' + (value269 + 1)),
          sourceBeatRefs = (Array.isArray(value268?.sourceBeatRefs) ? value268.sourceBeatRefs : [])
            .map(normalizeText)
            .filter(Boolean),
          beat = normalizeText(value268?.beat),
          time = normalizeText(value268?.time),
          entryState = normalizeText(value268?.entryState),
          exitState = normalizeText(value268?.exitState),
          openingShotIntent = normalizeText(value268?.openingShotIntent),
          closingShotIntent = normalizeText(value268?.closingShotIntent),
          continuityNotes =
            normalizeText(value268?.continuityNotes) || '以相邻计划的 exitState 和 entryState 保持连续。',
          targetDurationSec = normalizePositiveNumber(value268?.targetDurationSec);
        if (!sourceBeatRefs.length || new Set(sourceBeatRefs).size !== sourceBeatRefs.length)
          throw new Error(label2 + ' 缺少唯一、有效的 sourceBeatRefs。');
        const value270 = sourceBeatRefs.find((value271) => !map18.has(value271));
        if (value270) throw new Error(label2 + ' 引用了不存在的原文块“' + value270 + '”。');
        const list85 = [
          ...new Set(
            sourceBeatRefs.map((value272) => normalizeText(map18.get(value272)?.sourceSceneRef)),
          ),
        ];
        if (list85.length !== 1 || !map16.has(list85[0]))
          throw new Error(label2 + ' 的 sourceBeatRefs 跨越或缺少有效场景。');
        const text25 = normalizeText(value268?.sourceSceneRef),
          sourceSceneRef3 = text25 || list85[0];
        if (sourceSceneRef3 !== list85[0])
          throw new Error(label2 + ' 的 sourceSceneRef 与 sourceBeatRefs 不一致。');
        const list86 = getStoryEpisodeSceneAssetCandidates(map17.get(sourceSceneRef3), assets, {
            episodeRefs: episodeRefs,
          }),
          sceneAssetRef =
            normalizeText(value268?.sceneAssetRef) ||
            (list86.length === 1 ? normalizeText(list86[0]?.ref) : ''),
          enabled12 = assetsByRef2.get(sceneAssetRef);
        if (!ref10) throw new Error(label2 + ' 缺少有效的 ref。');
        if (!enabled12 || enabled12.kind !== 'scene')
          throw new Error(label2 + ' 缺少有效的 sceneAssetRef。');
        const list87 = normalizeStringArray(
            (Array.isArray(enabled12?.appearances) ? enabled12.appearances : []).map(
              (value273) => value273?.ref,
            ),
          ),
          text26 = normalizeText(value268?.sceneAppearanceRef),
          sceneAppearanceRef = list87.length ? text26 : '';
        if (list87.length && !list87.includes(sceneAppearanceRef))
          throw new Error(label2 + ' 缺少有效的 sceneAppearanceRef。');
        if (!beat || !entryState || !exitState)
          throw new Error(label2 + ' 缺少 beat、entryState 或 exitState。');
        if (includeDirectorContinuity && (!openingShotIntent || !closingShotIntent))
          throw new Error(label2 + ' 缺少 openingShotIntent 或 closingShotIntent。');
        if (
          !targetDurationSec ||
          (enforceMaxDuration && targetDurationSec > storyPlanningConstraints6.sceneMaxSeconds)
        )
          throw new Error(
            enforceMaxDuration
              ? label2 +
                  ' 的 targetDurationSec 必须大于 0 且不超过 ' +
                  storyPlanningConstraints6.sceneMaxSeconds +
                  ' 秒。'
              : label2 + ' 的 targetDurationSec 必须大于 0。',
          );
        const dialogueUnits = sourceBeatRefs.flatMap((value274) => {
          const value275 = map18.get(value274);
          return Array.isArray(value275?.dialogueUnits) ? value275.dialogueUnits : [];
        })
          .map((response13) => ({
            ref: normalizeText(response13?.ref),
            ...(normalizeText(response13?.speaker)
              ? { speaker: normalizeText(response13.speaker) }
              : {}),
            text: normalizeText(response13?.text),
          }))
          .filter((response14) => response14.ref && response14.text);
        return {
          ref: ref10,
          sourceSceneRef: sourceSceneRef3,
          sourceBeatRefs: sourceBeatRefs,
          beat: beat,
          sceneAssetRef: sceneAssetRef,
          sceneAppearanceRef: sceneAppearanceRef,
          time: time,
          entryState: entryState,
          exitState: exitState,
          ...(includeDirectorContinuity
            ? { openingShotIntent: openingShotIntent, closingShotIntent: closingShotIntent }
            : {}),
          continuityNotes: continuityNotes,
          characterAssetRefs: normalizeStoryEpisodeSplitBlueprintAssetRefs(value268?.characterAssetRefs, {
            assetsByRef: assetsByRef2,
            kind: 'character',
            label: label2,
          }),
          propAssetRefs: normalizeStoryEpisodeSplitBlueprintAssetRefs(value268?.propAssetRefs, {
            assetsByRef: assetsByRef2,
            kind: 'prop',
            label: label2,
          }),
          dialogueUnits: dialogueUnits,
          targetDurationSec: targetDurationSec,
        };
      },
    );
  if (!clipPlans2.length) throw new Error('Agent 返回的分镜蓝图没有可用片段计划。');
  const list88 = clipPlans2.map((value276) => value276.ref);
  if (new Set(list88).size !== list88.length) throw new Error('Agent 返回了重复的片段计划引用。');
  const list89 = list84.map((value277) => normalizeText(value277?.ref)),
    list90 = clipPlans2.flatMap((value278) => value278.sourceBeatRefs);
  if (
    list89.length !== list90.length ||
    list89.some((value279, value280) => value279 !== list90[value280])
  )
    throw new Error('Agent 分镜蓝图未按原文顺序完整且唯一地覆盖全部 sourceBeats。');
  return { episodeRef: episodeRef4, clipPlans: clipPlans2 };
}
function createLocalStoryEpisodeSplitBlueprint({
  episodeRef: episodeRef = '',
  episodeRefs: episodeRefs = [],
  sourceScenes: sourceScenes = [],
  sourceBeats: sourceBeats = [],
  assets: assets = [],
  includeDirectorContinuity: includeDirectorContinuity = false,
} = {}) {
  const ref11 = normalizeStoryAssetReference(episodeRef, 'episode-1'),
    map19 = new Map(
      (Array.isArray(sourceScenes) ? sourceScenes : []).map((value281) => [
        normalizeText(value281?.ref),
        value281,
      ]),
    ),
    list91 = (Array.isArray(assets) ? assets : []).filter((value282) => value282?.kind === 'scene'),
    list92 = (Array.isArray(assets) ? assets : []).filter(
      (value283) => value283?.kind === 'character',
    ),
    list93 = (Array.isArray(assets) ? assets : []).filter((value284) => value284?.kind === 'prop'),
    value285 = list91.some((value286) => normalizeStringArray(value286?.sourceSceneRefs).length),
    clipPlans3 = (Array.isArray(sourceBeats) ? sourceBeats : []).map((dom9, value287) => {
      const sourceSceneRef4 = normalizeText(dom9?.sourceSceneRef),
        dom10 = map19.get(sourceSceneRef4) || {},
        sceneAssetRef2 = value285
          ? getStoryEpisodeSceneAssetCandidates(dom10, list91, { episodeRefs: episodeRefs })[0]
          : list91.find((error20) => storySceneIdentitiesOverlap(error20?.name, dom10?.heading)) ||
            list91[0];
      if (!sceneAssetRef2)
        throw new Error(
          '无法为场景“' + (normalizeText(dom10?.heading) || sourceSceneRef4) + '”建立本地分镜蓝图。',
        );
      const list94 = Array.isArray(sceneAssetRef2?.appearances) ? sceneAssetRef2.appearances : [],
        value288 =
          list94.find((value289) =>
            normalizeStringArray(value289?.sourceSceneRefs).some((value290) =>
              storyEpisodeSourceSceneRefsMatch(value290, sourceSceneRef4, episodeRefs),
            ),
          ) ||
          list94.find(
            (value291) =>
              normalizeText(value291?.ref) === normalizeText(sceneAssetRef2?.baseAppearanceRef),
          ) ||
          list94[0],
        beat2 = normalizeText(dom9?.body || dom10?.body || dom10?.heading),
        map20 = new Set([
          ...normalizeStringArray(dom10?.characters),
          ...normalizeStringArray(dom9?.characters),
        ]),
        characterAssetRefs = list92.filter(
          (error21) => map20.has(error21.name) || beat2.includes(error21.name),
        ).map((value292) => value292.ref),
        propAssetRefs = list93.filter((error22) => error22.name && beat2.includes(error22.name)).map((value293) => value293.ref),
        text27 = normalizeText(dom10?.heading || dom9?.heading),
        value294 = beat2.slice(0, 120) || text27 || '原文块 ' + (value287 + 1);
      return {
        ref: ref11 + '-local-plan-' + (value287 + 1),
        sourceSceneRef: sourceSceneRef4,
        sourceBeatRefs: [normalizeText(dom9?.ref)],
        beat: beat2,
        sceneAssetRef: sceneAssetRef2.ref,
        sceneAppearanceRef: normalizeText(value288?.ref),
        entryState: '从原文动作起点进入：' + value294,
        exitState: '完整呈现该原文块后结束：' + value294,
        ...(includeDirectorContinuity
          ? {
              openingShotIntent: '根据当前剧情、表演重点和相邻画面自主选择开场镜头。',
              closingShotIntent: '根据当前动作结果与情绪落点自主选择结束镜头。',
            }
          : {}),
        continuityNotes: '严格保持原文顺序、人物状态、场景方位和动作承接。',
        characterAssetRefs: characterAssetRefs,
        propAssetRefs: propAssetRefs,
        dialogueUnits: Array.isArray(dom9?.dialogueUnits)
          ? dom9.dialogueUnits.map((args21) => ({ ...args21 }))
          : [],
        targetDurationSec: Math.max(4, Math.ceil([...beat2].length / 8)),
      };
    });
  if (!clipPlans3.length) throw new Error('无法从原文建立本地分镜蓝图。');
  return { episodeRef: ref11, clipPlans: clipPlans3 };
}
function distributeStoryEpisodePlanDurationTargets(list95 = [], value295 = 0) {
  const list96 = Array.isArray(list95) ? list95 : [],
    positiveNumber = normalizePositiveNumber(value295);
  if (!list96.length || !positiveNumber) return list96;
  const list97 = list96.map((value296) => normalizePositiveNumber(value296?.targetDurationSec) || 1),
    value297 = list97.reduce((value298, value299) => value298 + value299, 0);
  let value300 = 0;
  return list96.map((args22, value301) => {
    const value302 =
      value301 === list96.length - 1
        ? Number((positiveNumber - value300).toFixed(1))
        : Number((positiveNumber * (list97[value301] / value297)).toFixed(1));
    return (
      (value300 = Number((value300 + value302).toFixed(1))),
      { ...args22, targetDurationSec: Math.max(0.1, value302) }
    );
  });
}
function reconcileStoryEpisodeSplitBlueprintTiming(args23 = {}, value303 = {}) {
  const storyEpisodeSplitTimingBudget = resolveStoryEpisodeSplitTimingBudget(value303),
    list98 = Array.isArray(args23?.clipPlans) ? args23.clipPlans : [];
  if (!storyEpisodeSplitTimingBudget || !list98.length) return args23;
  const value304 = list98.reduce(
      (value305, value306) => value305 + (normalizePositiveNumber(value306?.targetDurationSec) || 0),
      0,
    ),
    value307 = storyEpisodeSplitTimingBudget.allowedProductionRangeSeconds;
  if (value304 >= value307.minimum && value304 <= value307.maximum) return args23;
  const map21 = new Map(
      storyEpisodeSplitTimingBudget.sceneTimings.map((value308) => [
        normalizeText(value308?.sceneRef),
        value308,
      ]),
    ),
    list99 = [...new Set(list98.map((value309) => normalizeText(value309?.sourceSceneRef)))],
    value310 = list99.length && list99.every((value311) => map21.has(value311));
  let clipPlans4;
  if (value310) {
    const map22 = new Map();
    list98.forEach((value312) => {
      const text28 = normalizeText(value312?.sourceSceneRef),
        list100 = map22.get(text28) || [];
      (list100.push(value312), map22.set(text28, list100));
    });
    const map23 = new Map();
    (map22.forEach((value313, value314) => {
      distributeStoryEpisodePlanDurationTargets(value313, map21.get(value314)?.totalSeconds).forEach((value315) => map23.set(value315.ref, value315));
    }),
      (clipPlans4 = list98.map((value316) => map23.get(value316.ref) || value316)));
  } else
    clipPlans4 = distributeStoryEpisodePlanDurationTargets(
      list98,
      storyEpisodeSplitTimingBudget.targetDurationSeconds,
    );
  return { ...args23, clipPlans: clipPlans4 };
}
export function buildStoryEpisodeSplitBlueprintPrompt({
  project: project = {},
  episode: episode = {},
  previousEpisode: previousEpisode = null,
  nextEpisode: nextEpisode = null,
  assets: assets = [],
  constraints: constraints = {},
  enforceMaxDuration: enforceMaxDuration = true,
  sourceBeatsOverride: sourceBeatsOverride = null,
  promptExperiment: promptExperiment = false,
  promptMode: promptMode = '',
} = {}) {
  const scriptMode5 = normalizeStoryProjectInput(project);
  assertStoryProjectInput(scriptMode5);
  const assets7 = selectStoryEpisodeSplitAssets(assets, episode);
  if (!assets7.some((value317) => value317.kind === 'scene'))
    throw new Error('分集缺少可用的场景资产，无法规划分镜蓝图。');
  const list101 = normalizeStoryEpisodeSplitSourceScenes(episode),
    sourceBeats2 =
      Array.isArray(sourceBeatsOverride) && sourceBeatsOverride.length
        ? sourceBeatsOverride
        : normalizeStoryEpisodeSplitSourceBeats(episode);
  if (!list101.length || !sourceBeats2.length || !normalizeText(episode?.title))
    throw new Error('分集缺少标题或剧本正文，无法规划分镜蓝图。');
  const episodeCount = resolveStoryPlanningConstraints(project, constraints),
    text29 = normalizeText(promptMode).toLowerCase() || resolveStoryPromptMode(project, constraints),
    storyPromptModeClipMaxSeconds = resolveStoryPromptModeClipMaxSeconds(
      text29,
      episodeCount.sceneMaxSeconds,
    ),
    ref12 = normalizeStoryAssetReference(
      episode?.ref || episode?.planningRef || episode?.id,
      'episode-1',
    ),
    episodeRefs2 = getStoryEpisodeReferenceAliases(episode),
    sourceSceneRefs3 = normalizeStringArray(
      sourceBeats2.map((value318) => normalizeText(value318?.sourceSceneRef)),
    ),
    map24 = getStoryEpisodeBlueprintSceneAssetRefs(sourceSceneRefs3, list101, assets7, {
      episodeRefs: episodeRefs2,
    }),
    value319 = sourceSceneRefs3.some((value320) => !map24.has(value320)),
    timingBudget2 = resolveStoryEpisodeSplitTimingBudget(episode);
  return JSON.stringify({
    task: 'plan_story_episode_split_blueprint',
    ...(episode.replication?.sourceAnalysis
      ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
      : {}),
    schemaVersion: STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION,
    scriptMode: scriptMode5.scriptMode,
    project: buildStoryEpisodeSplitProjectContext(project, scriptMode5, { sourceBeats: sourceBeats2 }),
    episode: {
      ref: ref12,
      title: normalizeText(episode?.title),
      synopsis: normalizeText(episode?.synopsis),
      sourceBeats: sourceBeats2,
      ...(timingBudget2 ? { timingBudget: timingBudget2 } : {}),
    },
    assets: assets7.map((value321) =>
      compactStoryEpisodeBlueprintAsset(value321, {
        episodeRefs: episodeRefs2,
        sourceSceneRefs: sourceSceneRefs3,
      }),
    ),
    continuity: {
      previousEpisode: normalizeStoryEpisodeSplitContinuityEpisode(previousEpisode, { includeEnding: true }),
      nextEpisode: normalizeStoryEpisodeSplitContinuityEpisode(nextEpisode),
    },
    constraints: enforceMaxDuration ? episodeCount : { episodeCount: episodeCount.episodeCount },
    requirements: [
      '先只规划整集片段蓝图，不要返回 shots、camera、dialogue、voiceover 或 audio。',
      ...[buildVideoReplicationTimingGuidance(episode)].filter(Boolean),
      '按 sourceBeats 原顺序完整覆盖剧情；每个 sourceBeats[].ref 必须且只能在一个 clipPlan.sourceBeatRefs 中出现一次。',
      'sourceBeat 用于跟踪原文覆盖，不直接决定片段边界；一个 clipPlan 可以承载多个相互关联的动作、对白、表情和反应。',
      STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
      STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE,
      enforceMaxDuration
        ? 'targetDurationSec 体现当前连续叙事自然完成所需，并在视频模型的 ' +
          storyPromptModeClipMaxSeconds +
          ' 秒能力内安排。' +
          STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE
        : 'targetDurationSec 体现当前连续叙事自然完成所需。' + STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
      ...(timingBudget2
        ? [
            'episode.timingBudget 是正文完成后的独立逐场审时账本，不是大纲目标。全部 clipPlans.targetDurationSec 合计应接近 ' +
              timingBudget2.targetDurationSeconds +
              ' 秒，并且必须落在制作允许区间 ' +
              timingBudget2.allowedProductionRangeSeconds.minimum +
              '-' +
              timingBudget2.allowedProductionRangeSeconds.maximum +
              ' 秒。',
            '按 episode.timingBudget.sceneTimings 为对应 sourceSceneRef 分配时间；必须呈现账本中已经存在的对白、动作、等待、反应和转场，不得靠重复动作、空镜、慢动作或新增剧情凑时长。',
          ]
        : []),
      '客户端会按 clipPlans 顺序本地生成 ref，并从 sourceBeatRefs 推导 sourceSceneRef；不要返回 ref、sourceSceneRef 或 continuityNotes。',
      value319
        ? '每个 clipPlan 必须返回一个与 sourceBeatRefs 所属场景匹配的 kind=scene 的 assets[].ref。'
        : '当前 sourceSceneRef 均有唯一场景资产绑定，客户端会本地推导 sceneAssetRef；不要返回 sceneAssetRef。',
      '每个 clipPlan 必须返回该场景有效的 sceneAppearanceRef；场景没有形象时返回空字符串，多候选时不得猜测。',
      'entryState 和 exitState 必须写成可观察状态，记录人物站位、动作、情绪、视线、道具和空间方向，供相邻计划直接承接。',
      '同一 sourceSceneRef 的相邻 clipPlan 必须组成一条连续状态链：后一项 entryState 完整继承前一项 exitState，再描述当前 beat 如何从该状态继续；15 秒等单片时长上限不得被理解成重新入场、重新走位或重新执行动作。',
      ...(promptExperiment
        ? [
            '场景图片是空间锚点；entryState 与 exitState 必须使用可见地标描述人物相对位置、朝向和移动结果，禁止只写抽象情绪或‘原地’。',
            'openingShotIntent 与 closingShotIntent 规划镜头叙事意图，由 Agent 根据剧情自主选择关注主体、景别层级和构图变化。',
            '相邻计划保持人物状态连续，画面衔接体现当前动作、视线或情绪关系。',
          ]
        : []),
      'beat、entryState、exitState 各只写一句必要信息，不复述原文，不展开镜头语言。',
      'characterAssetRefs 与 propAssetRefs 只列当前计划实际出现的已登记资产；不得编造引用。',
      ...getStoryEpisodeTimelinePlanningRequirements(text29).filter(
        (value322) => !isStoryEpisodeTimelineGuidance(value322),
      ),
    ],
    outputSchema: {
      episodeRef: ref12,
      clipPlans: [
        {
          sourceBeatRefs: ['按原顺序逐字使用一个或多个连续 sourceBeats[].ref'],
          beat: '概括当前连续片段内相互关联的动作、对白推进与情绪变化，不展开镜头细节',
          ...(value319 ? { sceneAssetRef: '逐字使用一个 kind=scene 的 assets[].ref' } : {}),
          sceneAppearanceRef: '该场景有效的 appearances[].ref；没有形象时为空字符串',
          entryState: '片段开头可观察的人物、动作、视线、道具与空间状态',
          exitState: '片段结束可观察的人物、动作、视线、道具与空间状态',
          ...(promptExperiment
            ? {
                openingShotIntent: 'AI 自主决定的开场镜头叙事意图，不写固定模板',
                closingShotIntent: 'AI 自主决定的结束镜头叙事意图，并考虑相邻计划衔接',
              }
            : {}),
          characterAssetRefs: ['当前片段实际出现的角色 assets[].ref'],
          propAssetRefs: ['当前片段实际出现的道具 assets[].ref'],
          targetDurationSec: enforceMaxDuration
            ? '正数且不超过 ' + episodeCount.sceneMaxSeconds
            : '按剧情内容如实估算的正数秒数，无硬上限',
        },
      ],
    },
  });
}
export function createStoryEpisodeSplitBlueprintBatches(
  list102 = [],
  { minSize: minSize = 1, maxSize: maxSize = STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH } = {},
) {
  const list103 = Array.isArray(list102) ? list102 : [];
  if (!list103.length) return [];
  const value323 = Math.max(1, Math.trunc(Number(minSize) || 1)),
    value324 = Math.max(
      value323,
      Math.trunc(Number(maxSize) || STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH),
    );
  if (list103.length <= value324) return [list103.slice()];
  const value325 = Math.ceil(list103.length / value324),
    value326 = Math.floor(list103.length / value325),
    value327 = list103.length % value325,
    list104 = [];
  let value328 = 0;
  for (let value329 = 0; value329 < value325; value329 += 1) {
    const value330 = value326 + (value329 < value327 ? 1 : 0);
    (list104.push(list103.slice(value328, value328 + Math.max(value323, value330))),
      (value328 += Math.max(value323, value330)));
  }
  if (value328 < list103.length) list104.at(-1).push(...list103.slice(value328));
  return list104.filter((list105) => list105.length);
}
export function createStoryEpisodeExperimentalConcurrentBatches(
  list106 = [],
  {
    maxPlansPerBatch: maxPlansPerBatch = STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH,
    targetDurationSeconds: targetDurationSeconds = STORY_EPISODE_EXPERIMENTAL_BATCH_TARGET_DURATION_SECONDS,
  } = {},
) {
  const list107 = Array.isArray(list106) ? list106 : [];
  if (!list107.length) return [];
  const value331 = Math.max(
      1,
      Math.trunc(Number(maxPlansPerBatch) || STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH),
    ),
    value332 = Math.max(
      1,
      normalizePositiveNumber(targetDurationSeconds) ||
        STORY_EPISODE_EXPERIMENTAL_BATCH_TARGET_DURATION_SECONDS,
    ),
    list108 = [];
  let list109 = [],
    value333 = 0;
  const run2 = () => {
    if (!list109.length) return;
    (list108.push(list109), (list109 = []), (value333 = 0));
  };
  return (
    list107.forEach((value334) => {
      const positiveNumber2 =
        normalizePositiveNumber(value334?.targetDurationSec) ||
        STORY_EPISODE_EXPERIMENTAL_FALLBACK_PLAN_DURATION_SECONDS;
      (list109.length &&
        (list109.length >= value331 || value333 + positiveNumber2 > value332) &&
        run2(),
        list109.push(value334),
        (value333 += positiveNumber2));
    }),
    run2(),
    list108
  );
}
function selectStoryEpisodeSplitBatchAssets(list110 = [], list111 = [], list112 = [], value335 = []) {
  const map25 = new Set(
      list111.flatMap((value336) => [
        value336?.sceneAssetRef,
        ...(Array.isArray(value336?.characterAssetRefs) ? value336.characterAssetRefs : []),
        ...(Array.isArray(value336?.propAssetRefs) ? value336.propAssetRefs : []),
      ])
        .map(normalizeText)
        .filter(Boolean),
    ),
    list113 = list112.flatMap((dom11) => [
      dom11?.heading,
      ...(Array.isArray(dom11?.characters) ? dom11.characters : []),
      dom11?.body,
    ])
      .map(normalizeText)
      .filter(Boolean)
      .join('\n'),
    list114 = list112.map((value337) => normalizeText(value337?.ref));
  return (Array.isArray(list110) ? list110 : []).filter(
    (error23) =>
      map25.has(normalizeText(error23?.ref)) ||
      (storyAssetMatchesEpisode(error23, value335) &&
        error23.sourceSceneRefs.some((value338) =>
          list114.some((value339) => storyEpisodeSourceSceneRefsMatch(value338, value339, value335)),
        )) ||
      (normalizeText(error23?.name) && list113.includes(normalizeText(error23.name))),
  );
}
export function buildStoryEpisodeSplitBatchPrompt({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
  blueprint: blueprint = {},
  batchIndex: batchIndex = 0,
  batches: batches = [],
  planBatch: planBatch = null,
  batchNumber: batchNumber = 0,
  batchTotal: batchTotal = 0,
  enforceMaxDuration: enforceMaxDuration = true,
  sourceBeatsOverride: sourceBeatsOverride = null,
  promptExperiment: promptExperiment = false,
  promptMode: promptMode = '',
  timingCorrection: timingCorrection = null,
} = {}) {
  const scriptMode6 = normalizeStoryProjectInput(project),
    episodeCount2 = resolveStoryPlanningConstraints(project, constraints),
    text30 = normalizeText(promptMode).toLowerCase() || resolveStoryPromptMode(project, constraints),
    maxDurationSec = resolveStoryPromptModeClipMaxSeconds(text30, episodeCount2.sceneMaxSeconds),
    value340 = (Array.isArray(assets) ? assets : [])
      .map((value341, value342) => normalizePlanningAssetSummary(value341, value342))
      .filter((error24) => error24.name),
    list115 = Array.isArray(blueprint?.clipPlans) ? blueprint.clipPlans : [],
    clipPlans5 =
      Array.isArray(planBatch) && planBatch.length
        ? planBatch
        : Array.isArray(batches?.[batchIndex])
          ? batches[batchIndex]
          : [];
  if (!clipPlans5.length) throw new Error('实验分批拆分缺少当前批次计划。');
  const ref13 = normalizeStoryAssetReference(
      episode?.ref || episode?.planningRef || episode?.id,
      'episode-1',
    ),
    list116 =
      Array.isArray(sourceBeatsOverride) && sourceBeatsOverride.length
        ? sourceBeatsOverride
        : normalizeStoryEpisodeSplitSourceBeats(episode),
    map26 = new Set(
      clipPlans5.flatMap((value343) =>
        Array.isArray(value343?.sourceBeatRefs) ? value343.sourceBeatRefs : [],
      ),
    ),
    sourceBeats3 = list116.filter((value344) => map26.has(value344.ref));
  if (sourceBeats3.length !== map26.size) throw new Error('实验分批拆分当前批次缺少蓝图引用的原文块。');
  const assets8 = selectStoryEpisodeSplitBatchAssets(
      value340,
      clipPlans5,
      sourceBeats3,
      getStoryEpisodeReferenceAliases(episode),
    ).map((value345) =>
      compactStoryEpisodePromptAsset(value345, {
        includeVisualDetails: true,
        includeBindings: Array.isArray(sourceBeatsOverride),
      }),
    ),
    map27 = new Set(
      assets8.filter((value346) => value346?.kind === 'scene').map((value347) =>
        normalizeText(value347?.ref),
      ),
    ),
    value348 = clipPlans5.map((value349) => normalizeText(value349?.sceneAssetRef)).find(
      (value350) => !map27.has(value350),
    );
  if (value348) throw new Error('实验分批拆分缺少场景资产“' + value348 + '”。');
  const count6 = list115.findIndex((value351) => value351?.ref === clipPlans5[0]?.ref),
    count7 = list115.findIndex((value352) => value352?.ref === clipPlans5.at(-1)?.ref),
    previousBoundary = count6 > 0 ? list115[count6 - 1] : null,
    nextBoundary = count7 >= 0 ? list115[count7 + 1] || null : null;
  return JSON.stringify({
    task: 'expand_story_episode_split_batch',
    ...(episode.replication?.sourceAnalysis
      ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
      : {}),
    schemaVersion: STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION,
    scriptMode: scriptMode6.scriptMode,
    episode: { ref: ref13, title: normalizeText(episode?.title) },
    batch: {
      index: Math.max(1, Math.trunc(Number(batchNumber) || batchIndex + 1)),
      total: Math.max(1, Math.trunc(Number(batchTotal) || batches.length || 1)),
      clipPlans: clipPlans5,
    },
    sourceBeats: sourceBeats3,
    assets: assets8,
    continuityLedger: {
      previousBoundary: previousBoundary
        ? {
            ref: previousBoundary.ref,
            exitState: previousBoundary.exitState,
            continuityNotes: previousBoundary.continuityNotes,
            ...(promptExperiment
              ? { closingShotIntent: normalizeText(previousBoundary.closingShotIntent) }
              : {}),
          }
        : null,
      currentEntry: {
        ref: clipPlans5[0].ref,
        entryState: clipPlans5[0].entryState,
        ...(promptExperiment
          ? { openingShotIntent: normalizeText(clipPlans5[0].openingShotIntent) }
          : {}),
      },
      nextBoundary: nextBoundary
        ? {
            ref: nextBoundary.ref,
            entryState: nextBoundary.entryState,
            continuityNotes: nextBoundary.continuityNotes,
            ...(promptExperiment
              ? { openingShotIntent: normalizeText(nextBoundary.openingShotIntent) }
              : {}),
          }
        : null,
    },
    constraints: enforceMaxDuration ? episodeCount2 : { episodeCount: episodeCount2.episodeCount },
    visualDirection: { aspectRatio: scriptMode6.aspectRatio || '16:9', style: scriptMode6.visualStyle },
    timingBudget: {
      ...(!enforceMaxDuration ? { preserveSourceDialogueUnits: true } : {}),
      singleActionBeatPerShot: true,
      singleContinuousCameraPerShot: true,
    },
    durationBudgets: clipPlans5.map((ref14) => ({
      ref: ref14.ref,
      targetDurationSec: ref14.targetDurationSec,
      ...(enforceMaxDuration ? { maxDurationSec: maxDurationSec } : {}),
    })),
    ...(timingCorrection ? { timingCorrection: timingCorrection } : {}),
    requirements: [
      '只展开 batch.clipPlans；按给定顺序为每个计划准确返回一个同 ref 的 clip，不得增加、合并、遗漏或重排。',
      ...[buildVideoReplicationTimingGuidance(episode)].filter(Boolean),
      ...(buildVideoReplicationTimingGuidance(episode)
        ? [
            '原片总时长是整集所有批次的合计参考，不是当前批次或单个片段的目标；本批只分配其覆盖内容所需的时间。',
          ]
        : []),
      '只依据当前 sourceBeats 写剧情、对白和旁白；不得补写未提供的整集内容，也不得遗漏 clipPlan.sourceBeatRefs 对应的信息。',
      '返回的 clips 是按计划分开的中间展开容器，不直接提交给视频模型；按当前剧情和表演节拍展开原子分镜，客户端会依据用户设置的单片段最大时长重新分组。',
      enforceMaxDuration
        ? '根据当前连续叙事与表演节拍自主决定分镜组织方式；durationBudgets.targetDurationSec 用于安排参考，shots.durationSec 总和在视频模型的 ' +
          maxDurationSec +
          ' 秒能力内。'
        : '把每个 clip 展开为自然连贯的原子分镜流，每镜时长按当前表演需要判断，并在视频模型的 ' +
          maxDurationSec +
          ' 秒能力内。',
      ...(resolveStoryEpisodeSplitTimingBudget(episode)
        ? [
            'durationBudgets.targetDurationSec 来自正文逐场审时账本。每个计划全部 shots.durationSec 的合计必须落在对应 targetDurationSec 的 80%-120% 内；通过补全原文已有的动作过程、等待、反应和转场实现，不得重复内容或新增剧情。',
          ]
        : []),
      ...(timingCorrection
        ? [
            '这是自动时长复检后的定点重做。先根据 timingCorrection.previousFailure 修正上一轮时长缺口，再逐项自算每个计划 shots.durationSec 合计，确认达到 durationBudgets 后才返回。',
          ]
        : []),
      'batch.clipPlans[].dialogueUnits 是客户端从故事正文逐字提取的完整发言。每个 dialogueUnits[].text 必须且只能完整出现在一个 shot.dialogue 中；不得改写、删减、按逗号拆开或分散到多个 shots。正文通过动作、停顿、他人插话或独立引号形成的不同 dialogueUnits 才是允许的发言边界。',
      '每个 clip 只能使用其 clipPlan.sceneAssetRef 指定的一个场景；至少一个 shot.assetUsages 必须引用该场景及指定 sceneAppearanceRef。',
      '把 entryState 直接写入首镜可观察画面，把 exitState 落到末镜可观察结果；不得用‘承接上一片段’等外部上下文表达。',
      '把 batch.clipPlans 和 continuityLedger 视为同一场景时间线的连续部分。每个计划的首镜必须从给定 entryState 直接续演，计划内每个后续镜头必须从前一镜头的动作落点继续；不得因为进入新计划或新的 15 秒技术切片而重新建立人物、位置、道具、车辆、设备或场景。',
      ...(promptExperiment
        ? [
            '场景参考图是固定空间锚点。镜头变化只能改变观察方式，不得改变建筑、家具、出入口、固定地标和光线方向的相对关系，不得镜像场景。',
            '由 Agent 根据剧情、对白、人物反应、动作连续性和情绪变化自主决定镜头数量、景别、机位、构图、运镜和剪辑方式。',
            '侧脸、双人镜头、过肩、正反打、特写、一镜到底或静止观察都可以，选择服务当前剧情的表达方式。',
            '每个 shot.transitionFromPrevious 说明与前一原子分镜的衔接方式和叙事原因，可选择切镜、动作匹配、视线匹配、反应镜头、道具插入或连续长镜。',
            '相邻 shot 的观察方式根据动作连续性和情绪发展决定，可变化，也可有意保持。',
            '每个 shot.visual 都要写清当前可观察的人物位置、朝向、动作、视线和道具状态；人物换位必须通过连续移动完成，禁止瞬移、镜像换位和无动作的位置重置。',
          ]
        : []),
      STORY_EPISODE_SPLIT_VISUAL_GUIDANCE,
      STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
      '每个分镜中，画面实际出现的已登记角色必须来自对应 clipPlan.characterAssetRefs，并逐个把具体 appearanceRef 写入 shot.assetRefs；资产没有形象时才写 assetRef。角色只在首次出现时使用 assets[].name，后续优先使用他/她/该角色；有指代歧义时继续使用普通姓名。dialogue 说话人标签使用普通姓名，任何文本字段都不要输出 @。',
      STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
      '听者反应、说话人的表情落点和动作结果，根据当前表演节拍安排在口播镜头内或独立反应镜头中。',
      '每个分镜围绕清晰的表演节拍组织；连续动作可以在镜头内完成，也可以在有叙事动机时切换观察方式。',
      '由 Agent 根据正文已存在的动作完成、发言结束和情绪落点判断每镜 cutAfter：完整 dialogueUnit 结束后用 preferred 或 allowed；不得在 dialogueUnit 内建立切点。场景变化由客户端强制换片段。',
      '不要返回 script、creativeIntent、transition 或 shot.time，这些字段由客户端依据蓝图本地补全。visual、camera 只写当前分镜必需信息，不复述 clipPlan、资产描述或前后镜头。',
      'visual、camera 和 audio 保持紧凑完整，选择当前分镜真正有表达价值的信息；dialogue、voiceover、audio 没有内容时省略字段。',
      'audio 记录与当前画面相配的环境声、动作音效和可听见的表演声。',
      '不要返回 title 或已拼接 prompt；客户端会统一命名并构建最终视频提示词。',
      ...getStoryEpisodeTimelinePlanningRequirements(text30),
    ],
    outputSchema: {
      episodeRef: ref13,
      clips: [
        {
          ref: '必须逐字使用对应 batch.clipPlans[].ref',
          shots: [
            {
              durationSec:
                '当前原子分镜精确秒数；结合口播内容、人物语速、情绪、句式、呼吸、动作、停顿与反应判断，并在视频模型的 ' +
                maxDurationSec +
                ' 秒能力内',
              ...(isStoryContinuousTimelinePromptMode(text30)
                ? {
                    startSec: '当前 clip 内的整数开始秒数；首镜必须为 0，后续等于上一镜 endSec',
                    endSec:
                      '当前 clip 内的整数结束秒数；必须大于 startSec，且 endSec-startSec 等于 durationSec',
                  }
                : {}),
              assetRefs: ['画面实际使用的 appearanceRef；资产没有形象时使用 assetRef'],
              visual:
                '可直接交给 AI 视频模型执行的正向画面提示词；写清摄像机实际可见的主体、人物位置与朝向、具体动作或状态变化、表情与视线、环境层次、道具互动、光影变化和动作落点，不写抽象心理或气氛结论',
              camera:
                '根据剧情、动作和情绪选择观察方式；写对本镜头有意义的景别、机位与角度、构图、运镜、焦点和落点，静止或运动均可',
              ...(promptExperiment
                ? {
                    transitionFromPrevious: 'AI 自主决定与前一原子分镜的衔接方式及叙事原因；首镜说明开场选择',
                  }
                : {}),
              dialogue:
                '角色名：正文中的一条完整 dialogueUnit 原文；禁止自行断句或改写；没有则为空字符串',
              voiceover: '画外音或旁白；没有则为空字符串',
              audio:
                '必要环境声、动作音效或可听见的表演声；允许呼吸、喘息、啜泣、衣物摩擦，禁止固定人物音色、对白复述与脱离剧情的配乐说明',
              cutAfter: 'preferred、allowed 或 forbidden；可省略，客户端按 allowed 处理',
            },
          ],
        },
      ],
    },
  });
}
function parseStoryEpisodeSplitBatchResult(
  value353,
  {
    episodeRef: episodeRef = '',
    clipPlans: clipPlans = [],
    constraints: constraints = {},
    assets: assets = [],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const storyEpisodeSplitResult = parseStoryEpisodeSplitResult(value353, {
      episodeRef: episodeRef,
      constraints: isStoryMinimaxH3PromptMode(promptMode)
        ? { ...constraints, sceneMaxSeconds: 15 }
        : constraints,
      assets: assets,
      clipPlans: clipPlans,
      promptMode: promptMode,
    }),
    list117 = clipPlans.map((value354) => normalizeText(value354?.ref)),
    list118 = storyEpisodeSplitResult.clips.map((value355) => normalizeText(value355?.ref));
  if (
    list117.length !== list118.length ||
    list117.some((value356, value357) => value356 !== list118[value357])
  )
    throw new Error('Agent 未按当前批次计划逐项返回同 ref 的片段。');
  return storyEpisodeSplitResult;
}
function stripStoryShotSpeakerLabels(value358 = '') {
  return normalizeText(value358).replace(
    /(^|[\n；;。！？!?])\s*[\p{Script=Han}A-Za-z0-9·_-]{1,16}\s*[：:]\s*/gu,
    '$1',
  );
}
function normalizeStoryDialogueComparisonText(value359 = '') {
  return (stripStoryShotSpeakerLabels(value359).match(/[\p{Script=Han}\p{L}\p{N}]/gu) || [])
    .join('')
    .toLowerCase();
}
function getStoryDialogueSpeakerPrefix(value360 = '') {
  return (
    String(value360 || '')
      .trim()
      .match(/^([\p{Script=Han}A-Za-z0-9·_-]{1,16}\s*[：:]\s*)/u)?.[1] || ''
  );
}
function completeStoryEpisodeSplitDialogueSpeaker(value361 = '', value362 = []) {
  const text31 = normalizeText(value361);
  if (!text31 || getStoryDialogueSpeakerPrefix(text31)) return text31;
  const storyDialogueComparisonText = normalizeStoryDialogueComparisonText(text31);
  if (!storyDialogueComparisonText) return text31;
  const list119 = [
    ...new Set(
      (Array.isArray(value362) ? value362 : [])
        .filter(
          (response15) =>
            normalizeStoryDialogueComparisonText(response15?.text) === storyDialogueComparisonText,
        )
        .map((value363) => normalizeText(value363?.speaker))
        .filter(Boolean),
    ),
  ];
  return list119.length === 1 ? list119[0] + '：' + text31 : text31;
}
function mergeStoryEpisodeSplitDialogueFragments(list120 = [], value364 = []) {
  const list121 = Array.isArray(list120) ? list120 : [],
    list122 = (Array.isArray(value364) ? value364 : [])
      .map((response16) => ({
        ...response16,
        text: normalizeText(response16?.text),
        comparisonText: normalizeStoryDialogueComparisonText(response16?.text),
      }))
      .filter((response17) => response17.text && response17.comparisonText);
  if (!list121.length || !list122.length) return list121;
  const map28 = new Map();
  let value365 = 0;
  list122.forEach((response18) => {
    let count8 = -1,
      endIndex = -1,
      value366 = '';
    for (let value367 = value365; value367 < list121.length; value367 += 1) {
      const storyDialogueComparisonText2 = normalizeStoryDialogueComparisonText(
        list121[value367]?.dialogue,
      );
      if (!storyDialogueComparisonText2) continue;
      if (count8 < 0) {
        if (!response18.comparisonText.startsWith(storyDialogueComparisonText2)) continue;
        ((count8 = value367), (value366 = storyDialogueComparisonText2));
      } else {
        const value368 = '' + value366 + storyDialogueComparisonText2;
        if (!response18.comparisonText.startsWith(value368)) break;
        value366 = value368;
      }
      if (value366 === response18.comparisonText) {
        endIndex = value367;
        break;
      }
    }
    if (count8 < 0 || endIndex < count8) return;
    const list123 = list121.slice(count8, endIndex + 1),
      args24 = list123[0],
      value369 = list123.at(-1),
      storyDialogueSpeakerPrefix =
        getStoryDialogueSpeakerPrefix(args24?.dialogue) ||
        (normalizeText(response18?.speaker) ? normalizeText(response18.speaker) + '：' : ''),
      assetUsages2 = [
        ...new Map(
          list123.flatMap((value370) =>
            Array.isArray(value370?.assetUsages) ? value370.assetUsages : [],
          ).map((value371) => [
            normalizeText(value371?.assetRef) + '|' + normalizeText(value371?.appearanceRef),
            value371,
          ]),
        ).values(),
      ],
      audio = [
        ...new Set(list123.map((value372) => normalizeText(value372?.audio)).filter(Boolean)),
      ].join('；');
    (map28.set(count8, {
      endIndex: endIndex,
      shot: {
        ...args24,
        durationSec: Number(
          list123.reduce((value373, value374) => value373 + Number(value374?.durationSec || 0), 0).toFixed(1),
        ),
        ...(Number.isInteger(Number(args24?.startSec)) &&
        Number.isInteger(Number(value369?.endSec))
          ? { startSec: Number(args24.startSec), endSec: Number(value369.endSec) }
          : {}),
        assetUsages: assetUsages2,
        assetRefs: [
          ...new Set(
            assetUsages2.map((value375) => normalizeText(value375?.assetRef)).filter(Boolean),
          ),
        ],
        dialogue: '' + storyDialogueSpeakerPrefix + response18.text,
        audio: audio,
        cutAfter:
          normalizeText(value369?.cutAfter) === 'forbidden'
            ? 'allowed'
            : normalizeText(value369?.cutAfter) || 'preferred',
      },
    }),
      (value365 = endIndex + 1));
  });
  if (!map28.size) return list121;
  const list124 = [];
  for (let value376 = 0; value376 < list121.length; value376 += 1) {
    const enabled13 = map28.get(value376);
    if (!enabled13) {
      list124.push(list121[value376]);
      continue;
    }
    (list124.push(enabled13.shot), (value376 = enabled13.endIndex));
  }
  return list124;
}
function normalizeStoryEpisodeSplitShotCamera(value377 = '') {
  const text32 = normalizeText(value377);
  return text32.replace(/再切(?:至|到)/gu, '，随后镜头连续调整构图至')
    .replace(/再切/gu, '，随后镜头连续调整构图')
    .replace(/转场(?:至|到)/gu, '，镜头平滑衔接至')
    .replace(/转场/gu, '，镜头平滑衔接')
    .replace(/镜头切换(?:至|到)|镜头切(?:至|到)/gu, '镜头连续调整构图至')
    .replace(/切至|切到/gu, '，镜头连续调整构图至')
    .replace(/镜头切换/gu, '镜头连续调整构图')
    .replace(/，{2,}/gu, '，')
    .replace(/^，/u, '');
}
function normalizeStoryEpisodeSplitShot(
  args25 = {},
  {
    clipTitle: clipTitle = '片段',
    index: index = 0,
    assetCatalog: assetCatalog = buildStoryEpisodeSplitAssetCatalog(),
    fallbacks: fallbacks = {},
    allowEmptyAudio: allowEmptyAudio = true,
    includeCutAfter: includeCutAfter = false,
    includeTimeline: includeTimeline = false,
    preserveCameraCuts: preserveCameraCuts = false,
  } = {},
) {
  const positiveNumber3 =
      normalizePositiveNumber(args25?.durationSec || args25?.durationSeconds) ||
      normalizePositiveNumber(fallbacks?.durationSec),
    time2 = normalizeText(args25?.time) || normalizeText(fallbacks?.time),
    visual2 = normalizeText(args25?.visual) || normalizeText(fallbacks?.visual),
    text33 = normalizeText(args25?.camera) || normalizeText(fallbacks?.camera),
    audio2 = normalizeText(args25?.audio) || normalizeText(fallbacks?.audio);
  if (!positiveNumber3 || (!preserveCameraCuts && (!visual2 || !text33)) || (!allowEmptyAudio && !audio2))
    throw new Error(
      '片段“' +
        clipTitle +
        '”的分镜 ' +
        (index + 1) +
        ' 缺少 durationSec、visual、camera 或 audio。',
    );
  const value378 = '片段“' + clipTitle + '”的分镜 ' + (index + 1),
    camera2 = preserveCameraCuts ? text33 : normalizeStoryEpisodeSplitShotCamera(text33),
    transitionFromPrevious = normalizeText(
      args25?.transitionFromPrevious || fallbacks?.transitionFromPrevious,
    ),
    dialogue2 = normalizeText(args25?.dialogue),
    voiceover = normalizeText(args25?.voiceover),
    text34 = normalizeText(args25?.cutAfter || fallbacks?.cutAfter).toLowerCase(),
    cutAfter = ['preferred', 'allowed', 'forbidden'].includes(text34) ? text34 : 'allowed',
    durationSec3 = Number(positiveNumber3),
    startSec = Number(args25?.startSec),
    endSec = Number(args25?.endSec);
  if (includeTimeline && !isValidIntegerTimelineShot({ ...args25, durationSec: durationSec3 }))
    throw new Error(
      '片段“' +
        clipTitle +
        '”的分镜 ' +
        (index + 1) +
        ' 必须提供连续整数 startSec/endSec，且 durationSec 等于二者之差。',
    );
  const list125 = Array.isArray(args25?.assetUsages)
      ? args25.assetUsages
      : normalizeStringArray(args25?.assetRefs).map((assetRef5) => {
          const appearanceRef2 = assetCatalog.assetByRef.get(assetRef5);
          if (appearanceRef2)
            return { assetRef: assetRef5, appearanceRef: appearanceRef2.appearanceRefs[0] || '' };
          const args26 = assetCatalog.appearanceOwnerRefsByRef.get(assetRef5);
          if (args26?.size === 1) return { assetRef: [...args26][0], appearanceRef: assetRef5 };
          if (args26?.size > 1) {
            const assetRef6 = resolveStoryEpisodeSplitLegacyAppearanceOwner(
              assetRef5,
              args26,
              assetCatalog,
              args25,
            );
            if (assetRef6) return { assetRef: assetRef6, appearanceRef: assetRef5 };
            throw new Error(
              value378 +
                '的旧形象引用“' +
                assetRef5 +
                '”存在多个所属资产；请同时提供 assetRef 和 appearanceRef。',
            );
          }
          const assetRef7 = resolveStoryEpisodeSplitUnknownLegacyAppearance(assetRef5, assetCatalog, args25);
          if (assetRef7)
            return { assetRef: assetRef7.assetRef, appearanceRef: assetRef7.defaultAppearanceRef };
          return { assetRef: assetRef5, appearanceRef: '' };
        }),
    assetUsages3 = list125.map((value379) =>
      normalizeStoryEpisodeSplitAssetUsage(value379, assetCatalog, value378),
    ),
    assetRefs3 = [...new Set(assetUsages3.map((value380) => value380.assetRef))];
  return {
    durationSec: durationSec3,
    ...(preserveCameraCuts ? replicationVisualFields(args25) : {}),
    ...(includeTimeline ? { startSec: startSec, endSec: endSec } : {}),
    time: time2,
    assetUsages: assetUsages3,
    assetRefs: assetRefs3,
    visual: visual2,
    camera: camera2,
    ...(transitionFromPrevious ? { transitionFromPrevious: transitionFromPrevious } : {}),
    dialogue: dialogue2,
    voiceover: voiceover,
    audio: audio2,
    ...(includeCutAfter ? { cutAfter: cutAfter } : {}),
  };
}
const STORY_EPISODE_CHARACTER_SINGULAR_REFERENCE_PATTERN =
    /(?:他|她|此人|那人|对方|来者|男人|女人|男孩|女孩|少年|少女|老人|老者|人物|角色|人影|身影)/u,
  STORY_EPISODE_CHARACTER_GROUP_REFERENCE_PATTERN = /(?:他们|她们|两人|二人|双方|众人|人群|一行人)/u,
  STORY_EPISODE_CHARACTER_ACTION_PATTERN =
    /(?:面部|脸上|眼神|目光|手部|双手|手指|脚步|背影|呼吸|喘息|开口|说(?:道|话)?|回答|走|跑|转身|回头|抬头|低头|俯身|起身|检查|观察|看向|望向|握住|伸手|跪|站|坐)/u,
  STORY_EPISODE_EXPLICIT_ENVIRONMENT_SHOT_PATTERN = /(?:空镜|无人|纯环境镜头)/u,
  STORY_EPISODE_AUDIO_ONLY_CHARACTER_REFERENCE_PATTERN =
    /(?:O\.?S\.?|V\.?O\.?|画外音|旁白|声音|语音|录音|音频|电话|通话|广播|扬声器|耳机|对讲机|传声器)/iu,
  STORY_EPISODE_CHARACTER_VISUAL_PRESENCE_PATTERN =
    /(?:本人|本尊|出镜|入镜|现身|身影|面部|脸上|眼神|目光|手部|双手|手指|脚步|背影|走|跑|转身|回头|抬头|低头|俯身|起身|检查|观察|看向|望向|握住|伸手|跪|站|坐|躺|进入|离开)/u,
  STORY_EPISODE_INDIRECT_CHARACTER_REFERENCE_PATTERN =
    /(?:回忆|提到|提及|说起|谈及|复述|指出|说明|承认|表示|交代|声称|听见|得知|想到|想起|记得|名单|记录|编号|权限|办公室|命令|委托)/u,
  STORY_EPISODE_CHARACTER_VISIBLE_SUBJECT_PATTERN =
    /^(?:(?:本人|正|正在|随即|缓慢|突然|仍|继续|立刻|艰难|猛地|轻轻)\s*)?(?:盯|看|望|走|跑|站|坐|躺|跪|转身|回头|抬头|低头|俯身|起身|检查|观察|握住|伸手|扶住|抓住|推开|拉住|抱住|哭|笑|点头|摇头|开口|指向|面对|递出|接过|拿起|放下|冲向|进入|离开)/u,
  STORY_EPISODE_CHARACTER_VISIBLE_OBJECT_PATTERN =
    /(?:面对|看向|望向|盯着|扶住|抓住|推开|拉住|抱住|递给|靠近|转向|照片中的|屏幕中的)$/u;
function getStoryEpisodeSplitShotCharacterText(options19 = {}) {
  return [options19?.visual, options19?.camera]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ');
}
function hasStoryEpisodeSplitVisualCharacterReference(value381, list126) {
  if (normalizeText(value381?.camera).includes(list126)) return true;
  const list127 = normalizeText(value381?.visual)
    .split(/[，,。；;！？!?：:\r\n]+/u)
    .map((value382) => value382.trim())
    .filter((list128) => list128.includes(list126));
  return list127.some((list129) => {
    const value383 = list129.indexOf(list126),
      value384 = list129.slice(0, value383),
      list130 = list129.slice(value383 + list126.length),
      value385 =
        STORY_EPISODE_CHARACTER_VISIBLE_SUBJECT_PATTERN.test(list130) ||
        STORY_EPISODE_CHARACTER_VISIBLE_OBJECT_PATTERN.test(value384) ||
        STORY_EPISODE_CHARACTER_VISUAL_PRESENCE_PATTERN.test(list130.slice(0, 12));
    if (value385) return true;
    if (STORY_EPISODE_AUDIO_ONLY_CHARACTER_REFERENCE_PATTERN.test(list129)) return false;
    return !STORY_EPISODE_INDIRECT_CHARACTER_REFERENCE_PATTERN.test(list129);
  });
}
function completeStoryEpisodeSplitCharacterAssetUsages(
  list131 = [],
  {
    clipPlan: clipPlan = null,
    assetCatalog: assetCatalog = buildStoryEpisodeSplitAssetCatalog(),
    clipTitle: clipTitle = '片段',
    requireAllPlanCharacters: requireAllPlanCharacters = true,
  } = {},
) {
  const list132 = [
      ...new Set(
        normalizeStringArray(clipPlan?.characterAssetRefs).filter(
          (value386) => assetCatalog.assetByRef.get(value386)?.kind === 'character',
        ),
      ),
    ],
    list133 = [...assetCatalog.assetByRef.values()]
      .filter((value387) => value387.kind === 'character')
      .map((value388) => value388.assetRef);
  if (!list133.length) return list131;
  const map29 = new Set();
  let list134 = [];
  const value389 = list131.map((args27, value390) => {
      const storyEpisodeSplitShotCharacterText = getStoryEpisodeSplitShotCharacterText(args27),
        map30 = new Set(args27.assetUsages.map((value391) => value391.assetRef)),
        args28 = list133.filter((value392) => map30.has(value392)),
        args29 = list133.filter((value393) => {
          const value394 = assetCatalog.assetByRef.get(value393)?.name;
          return value394 && hasStoryEpisodeSplitVisualCharacterReference(args27, value394);
        });
      let list135 = [...new Set([...args28, ...args29])];
      if (!list135.length) {
        const enabled14 = STORY_EPISODE_EXPLICIT_ENVIRONMENT_SHOT_PATTERN.test(
          storyEpisodeSplitShotCharacterText,
        );
        if (
          !enabled14 &&
          list132.length === 1 &&
          (STORY_EPISODE_CHARACTER_SINGULAR_REFERENCE_PATTERN.test(storyEpisodeSplitShotCharacterText) ||
            STORY_EPISODE_CHARACTER_ACTION_PATTERN.test(storyEpisodeSplitShotCharacterText) ||
            normalizeText(args27?.dialogue) ||
            normalizeText(args27?.voiceover))
        )
          list135 = [...list132];
        else {
          if (
            !enabled14 &&
            list134.length &&
            STORY_EPISODE_CHARACTER_GROUP_REFERENCE_PATTERN.test(storyEpisodeSplitShotCharacterText)
          )
            list135 = [...list134];
          else
            !enabled14 &&
              list134.length === 1 &&
              STORY_EPISODE_CHARACTER_SINGULAR_REFERENCE_PATTERN.test(
                storyEpisodeSplitShotCharacterText,
              ) &&
              (list135 = [...list134]);
        }
      }
      const assetUsages4 = [...args27.assetUsages];
      for (const assetRef8 of list135) {
        map29.add(assetRef8);
        if (map30.has(assetRef8)) continue;
        const value395 = assetCatalog.assetByRef.get(assetRef8)?.name || assetRef8;
        (assetUsages4.push(
          normalizeStoryEpisodeSplitAssetUsage(
            { assetRef: assetRef8, appearanceRef: '' },
            assetCatalog,
            '片段“' + clipTitle + '”的分镜 ' + (value390 + 1) + ' 自动补全人物“' + value395 + '”',
          ),
        ),
          map30.add(assetRef8));
      }
      if (list135.length) list134 = list135;
      return {
        ...args27,
        assetUsages: assetUsages4,
        assetRefs: [...new Set(assetUsages4.map((value396) => value396.assetRef))],
      };
    }),
    list136 = list132.filter((value397) => !map29.has(value397));
  if (requireAllPlanCharacters && list136.length) {
    const list137 = list136.map(
      (value398) => assetCatalog.assetByRef.get(value398)?.name || value398,
    );
    throw new Error(
      '片段“' +
        clipTitle +
        '”人物资产引用不完整：蓝图人物“' +
        list137.join('、') +
        '”未出现在任何分镜的 assetUsages 中。',
    );
  }
  return value389;
}
function completeStoryEpisodeSplitSceneAssetUsage(
  list138 = [],
  {
    clipPlan: clipPlan = null,
    assetCatalog: assetCatalog = buildStoryEpisodeSplitAssetCatalog(),
    clipTitle: clipTitle = '片段',
  } = {},
) {
  if (!list138.length) return list138;
  const assetRef9 = normalizeText(clipPlan?.sceneAssetRef);
  if (!assetRef9 || assetCatalog.assetByRef.get(assetRef9)?.kind !== 'scene') return list138;
  const value399 = list138.some((value400) =>
    value400.assetUsages.some((value401) => value401.assetRef === assetRef9),
  );
  if (value399) return list138;
  const storyEpisodeSplitAssetUsage = normalizeStoryEpisodeSplitAssetUsage(
    { assetRef: assetRef9, appearanceRef: normalizeText(clipPlan?.sceneAppearanceRef) },
    assetCatalog,
    '片段“' + clipTitle + '”自动补全场景',
  );
  return list138.map((args30, count9) => {
    if (count9 !== 0) return args30;
    const assetUsages5 = [storyEpisodeSplitAssetUsage, ...args30.assetUsages];
    return {
      ...args30,
      assetUsages: assetUsages5,
      assetRefs: [...new Set(assetUsages5.map((value402) => value402.assetRef))],
    };
  });
}
function formatStoryEpisodeClipTitle(value403 = 0) {
  return '片段' + String(value403 + 1).padStart(2, '0');
}
function validateStoryEpisodeSplitClipIndependence({
  clipLabel: clipLabel = '片段',
  script: script = '',
  creativeIntent: creativeIntent = '',
  transition: transition = '',
} = {}) {
  const value404 = [script, creativeIntent, transition].join(' '),
    value405 = value404.match(
      /当前为原片段第\s*\d+\s*\/\s*\d+\s*段|原片段第\s*\d+\s*\/\s*\d+\s*段|承接(?:上一|下一)片段|参见(?:上一|下一)片段/u,
    );
  if (value405)
    throw new Error(
      clipLabel + ' 包含依赖其他视频上下文的描述“' + value405[0] + '”，每个片段必须独立完整。',
    );
}
function normalizeStoryEpisodeExperimentalStandaloneText(value406 = '') {
  return normalizeText(value406)
    .replace(/当前为原片段第\s*\d+\s*\/\s*\d+\s*段/gu, '当前剧情段落')
    .replace(/原片段第\s*\d+\s*\/\s*\d+\s*段/gu, '当前剧情段落')
    .replace(/承接(?:上一|下一)片段/gu, '从当前可观察状态开始')
    .replace(/参见(?:上一|下一)片段/gu, '以当前画面状态为准')
    .replace(/(?:上一|下一)片段/gu, '相邻剧情');
}
function getStoryEpisodeSplitShotsDuration(list139 = []) {
  return list139.reduce((value407, value408) => value407 + Number(value408?.durationSec || 0), 0);
}
function tokenizeStoryEpisodeExperimentalShotText(
  value409 = '',
  { preserveSpeaker: preserveSpeaker = false } = {},
) {
  const enabled15 = String(value409 || '').trim();
  if (!enabled15) return [];
  const list140 = [],
    list141 = preserveSpeaker ? enabled15.split(/\n+/u) : [enabled15];
  return (
    list141.forEach((value410) => {
      const enabled16 = value410.trim();
      if (!enabled16) return;
      const value411 = preserveSpeaker ? enabled16.match(/^([^：:\n]{1,20}[：:])\s*(.*)$/u) : null,
        value412 = value411?.[1] || '',
        value413 = value411?.[2] || enabled16,
        list142 = value413.match(
          preserveSpeaker
            ? /[^。！？!?\n]+(?:[。！？!?]+|$)/gu
            : /[^。！？!?；;，,\n]+(?:[。！？!?；;，,]+|$)/gu,
        ) || [value413];
      list142.map((value414) => value414.trim())
        .filter(Boolean)
        .forEach((value415) => {
          list140.push('' + value412 + value415);
        });
    }),
    list140
  );
}
function splitStoryEpisodeExperimentalClause(value416 = '', value417 = false) {
  const value418 = value417 ? value416.match(/^([^：:\n]{1,20}[：:])(.*)$/u) : null,
    value419 = value418?.[1] || '',
    args31 = value418?.[2] || value416,
    list143 = [...args31];
  if (list143.length < 2) return [value416];
  const value420 = Math.ceil(list143.length / 2);
  return [
    '' + value419 + list143.slice(0, value420).join(''),
    '' + value419 + list143.slice(value420).join(''),
  ];
}
function splitStoryEpisodeExperimentalShotText(
  value421 = '',
  value422 = 1,
  { preserveSpeaker: preserveSpeaker = false, splitFragments: splitFragments = true } = {},
) {
  const length = Math.max(1, Math.trunc(Number(value422) || 1)),
    list144 = tokenizeStoryEpisodeExperimentalShotText(value421, { preserveSpeaker: preserveSpeaker });
  while (splitFragments && list144.length && list144.length < length) {
    let value423 = 0;
    for (let value424 = 1; value424 < list144.length; value424 += 1) {
      if ([...list144[value424]].length > [...list144[value423]].length) value423 = value424;
    }
    const list145 = splitStoryEpisodeExperimentalClause(list144[value423], preserveSpeaker);
    if (list145.length < 2) break;
    list144.splice(value423, 1, ...list145);
  }
  if (!list144.length) return Array.from({ length: length }, () => '');
  if (!splitFragments && list144.length < length) {
    const value425 = Array.from({ length: length }, () => '');
    return (
      list144.forEach((value426, value427) => {
        const value428 = Math.min(length - 1, Math.floor((value427 * length) / list144.length));
        value425[value428] = value425[value428] ? value425[value428] + '\n' + value426 : value426;
      }),
      value425
    );
  }
  const list146 = [];
  let value429 = 0;
  for (let value430 = 0; value430 < length; value430 += 1) {
    const count10 = length - value430,
      count11 = list144.length - value429;
    if (count11 <= 0) {
      list146.push('');
      continue;
    }
    if (count10 === 1) {
      (list146.push(list144.slice(value429).join(preserveSpeaker ? '\n' : '')),
        (value429 = list144.length));
      continue;
    }
    const value431 = Math.max(1, count11 - (count10 - 1)),
      value432 = list144.slice(value429).reduce(
        (value433, args32) => value433 + [...args32].length,
        0,
      ),
      value434 = value432 / count10;
    let value435 = 1,
      value436 = [...list144[value429]].length;
    while (value435 < value431 && value436 < value434) {
      ((value436 += [...list144[value429 + value435]].length), (value435 += 1));
    }
    (list146.push(list144.slice(value429, value429 + value435).join(preserveSpeaker ? '\n' : '')),
      (value429 += value435));
  }
  return list146;
}
function splitStoryEpisodeExperimentalOverlongEntry(
  args33 = {},
  { maximum: maximum = 15, targetMaximum: targetMaximum = maximum, entryIndex: entryIndex = 0 } = {},
) {
  const args34 = args33?.shot || {},
    positiveNumber4 = normalizePositiveNumber(args34?.durationSec);
  if (!positiveNumber4 || positiveNumber4 <= maximum + 0.001) return [args33];
  const value437 = Math.max(1, normalizePositiveNumber(targetMaximum) || maximum),
    length2 = Math.max(2, Math.ceil(positiveNumber4 / value437)),
    splitStoryEpisodeExperimentalShotText2 = splitStoryEpisodeExperimentalShotText(
      args34.visual,
      length2,
      {
        splitFragments: false,
      },
    ),
    splitStoryEpisodeExperimentalShotText3 = splitStoryEpisodeExperimentalShotText(
      args34.dialogue,
      length2,
      {
        preserveSpeaker: true,
        splitFragments: false,
      },
    ),
    splitStoryEpisodeExperimentalShotText4 = splitStoryEpisodeExperimentalShotText(
      args34.voiceover,
      length2,
      {
        preserveSpeaker: true,
        splitFragments: false,
      },
    ),
    splitStoryEpisodeExperimentalShotText5 = splitStoryEpisodeExperimentalShotText(args34.audio, length2, {
      splitFragments: false,
    });
  let value438 = Number(positiveNumber4.toFixed(1));
  const ref15 = normalizeText(args33?.sourceClip?.ref) || 'clip-' + (entryIndex + 1);
  return Array.from({ length: length2 }, (value439, transition2) => {
    const value440 = length2 - transition2,
      durationSec4 = transition2 === length2 - 1 ? value438 : Number((value438 / value440).toFixed(1));
    value438 = Number((value438 - durationSec4).toFixed(1));
    const visual3 = splitStoryEpisodeExperimentalShotText2[transition2] || normalizeText(args34.visual),
      dialogue3 = splitStoryEpisodeExperimentalShotText3[transition2] || '',
      voiceover2 = splitStoryEpisodeExperimentalShotText4[transition2] || '',
      audio3 = splitStoryEpisodeExperimentalShotText5[transition2] || '';
    return {
      ...args33,
      sourceClip: {
        ...args33.sourceClip,
        ref: ref15 + '-local-part-' + (entryIndex + 1) + '-' + (transition2 + 1),
        script: [visual3, dialogue3, voiceover2].filter(Boolean).join(' '),
        transition:
          transition2 === length2 - 1
            ? normalizeText(args33?.sourceClip?.transition)
            : '当前动作在下一镜中连续完成。',
      },
      shot: {
        ...args34,
        durationSec: durationSec4,
        visual: visual3,
        dialogue: dialogue3,
        voiceover: voiceover2,
        audio: audio3,
        cutAfter:
          transition2 === length2 - 1 ? normalizeText(args34?.cutAfter) || 'allowed' : 'allowed',
      },
    };
  });
}
function compareStoryEpisodeExperimentalPartitionCandidate(value441, enabled17) {
  if (!enabled17) return -1;
  if (value441.groupCount !== enabled17.groupCount)
    return value441.groupCount - enabled17.groupCount;
  return value441.penalty - enabled17.penalty;
}
function partitionStoryEpisodeExperimentalSceneShots(
  list147 = [],
  {
    maxDurationSeconds: maxDurationSeconds = 15,
    minDurationSeconds: minDurationSeconds = STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS,
  } = {},
) {
  if (!list147.length) return [];
  const maximum2 = Math.max(1, normalizePositiveNumber(maxDurationSeconds) || 15),
    value442 = Math.max(0, normalizePositiveNumber(minDurationSeconds) || 0);
  list147 = list147.flatMap((value443, entryIndex2) =>
    splitStoryEpisodeExperimentalOverlongEntry(value443, {
      maximum: maximum2,
      targetMaximum: maximum2,
      entryIndex: entryIndex2,
    }),
  );
  const value444 = Math.max(value442, maximum2 * 0.68),
    map31 = new Map(),
    handler8 = (value445) => {
      if (value445 >= list147.length) return { groupCount: 0, penalty: 0, groups: [] };
      if (map31.has(value445)) return map31.get(value445);
      let value446 = 0,
        value447 = null;
      for (let value448 = value445; value448 < list147.length; value448 += 1) {
        const count12 = value448 - value445 + 1;
        if (count12 > STORY_EPISODE_EXPERIMENTAL_MAX_FINAL_SHOTS_PER_CLIP) break;
        value446 += Number(list147[value448]?.shot?.durationSec || 0);
        if (value446 > maximum2 + 0.001) break;
        const groupCount = handler8(value448 + 1);
        if (!groupCount) continue;
        const text35 = normalizeText(list147[value448]?.shot?.cutAfter).toLowerCase(),
          value449 =
            value448 === list147.length - 1 || text35 === 'preferred'
              ? 0
              : text35 === 'forbidden'
                ? 2500
                : 25,
          value450 = value446 < value442 ? (value442 - value446) * 300 : 0,
          value451 = (value446 - value444) ** 2,
          value452 =
            (count12 - STORY_EPISODE_EXPERIMENTAL_PREFERRED_SHOTS_PER_CLIP) ** 2 * 75 +
            (count12 < 3 ? (3 - count12) * 500 : 0),
          value453 = {
            groupCount: groupCount.groupCount + 1,
            penalty: groupCount.penalty + value449 + value450 + value451 + value452,
            groups: [list147.slice(value445, value448 + 1), ...groupCount.groups],
          };
        compareStoryEpisodeExperimentalPartitionCandidate(value453, value447) < 0 && (value447 = value453);
      }
      return (map31.set(value445, value447), value447);
    },
    enabled18 = handler8(0);
  if (!enabled18) {
    const value454 = list147.find(
        (value455) => Number(value455?.shot?.durationSec || 0) > maximum2 + 0.001,
      ),
      value456 = Number(value454?.shot?.durationSec || 0);
    throw new Error(
      value456
        ? '实验分镜存在单镜 ' +
            value456.toFixed(1) +
            ' 秒，超过 ' +
            maximum2 +
            ' 秒上限；单镜必须由 Agent 拆成连续镜头。'
        : '实验分镜无法在场景内组成有效视频片段。',
    );
  }
  return enabled18.groups;
}
function joinStoryEpisodeExperimentalClipText(list148 = []) {
  return [...new Set(list148.map(normalizeText).filter(Boolean))].join('；');
}
export function repackStoryEpisodeExperimentalClips({
  episodeRef: episodeRef = '',
  clipPlans: clipPlans = [],
  completedPlanResults: completedPlanResults = [],
  maxDurationSeconds: maxDurationSeconds = 15,
  minDurationSeconds: minDurationSeconds = STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS,
  promptExperiment: promptExperiment = false,
  preserveSourceGroups: preserveSourceGroups = false,
} = {}) {
  const ref16 = normalizeStoryAssetReference(episodeRef, 'episode-1'),
    map32 = new Map(
      (Array.isArray(clipPlans) ? clipPlans : []).map((value457) => [
        normalizeText(value457?.ref),
        value457,
      ]),
    ),
    map33 = new Map(
      (Array.isArray(completedPlanResults) ? completedPlanResults : []).map((value458) => [
        normalizeText(value458?.sourcePlanRef),
        value458,
      ]),
    ),
    list149 = [];
  for (const plan of map32.values()) {
    const value459 = map33.get(normalizeText(plan?.ref));
    for (const sourceClip of Array.isArray(value459?.clips) ? value459.clips : []) {
      const list150 = Array.isArray(sourceClip?.shots) ? sourceClip.shots : [];
      list150.forEach((args35, value460) => {
        list149.push({
          plan: plan,
          sourceClip: sourceClip,
          shot: {
            ...args35,
            cutAfter:
              normalizeText(args35?.cutAfter) ||
              (value460 === list150.length - 1 ? 'preferred' : 'allowed'),
          },
        });
      });
    }
  }
  if (!list149.length) throw new Error('实验分批没有可用于重组的分镜。');
  if (preserveSourceGroups) {
    const list151 = [];
    for (const value461 of map32.values()) {
      const value462 = map33.get(normalizeText(value461?.ref));
      for (const args36 of Array.isArray(value462?.clips) ? value462.clips : []) {
        const shots2 = Array.isArray(args36?.shots) ? args36.shots : [];
        if (!shots2.length) continue;
        list151.push({
          ...args36,
          ref: ref16 + '-experimental-clip-' + (list151.length + 1),
          title: formatStoryEpisodeClipTitle(list151.length),
          shots: shots2,
          contentDurationSec: Number(getStoryEpisodeSplitShotsDuration(shots2).toFixed(1)),
          durationSec: Number(getStoryEpisodeSplitShotsDuration(shots2).toFixed(1)),
          assetRefs: [...new Set(shots2.flatMap((value463) => value463?.assetRefs || []))],
          sourcePlanRefs: [normalizeText(value461?.ref)].filter(Boolean),
        });
      }
    }
    return promptExperiment ? addStoryEpisodeDirectorContinuityHandoffs(list151) : list151;
  }
  const list152 = [];
  let list153 = [],
    value464 = '';
  list149.forEach((value465) => {
    const value466 = [
      normalizeText(value465.plan?.sourceSceneRef),
      normalizeText(value465.plan?.sceneAssetRef),
      normalizeText(value465.plan?.sceneAppearanceRef),
    ].join('|');
    (list153.length && value466 !== value464 && (list152.push(list153), (list153 = [])),
      (value464 = value466),
      list153.push(value465));
  });
  if (list153.length) list152.push(list153);
  const list154 = list152.flatMap((value467) =>
      partitionStoryEpisodeExperimentalSceneShots(value467, {
        maxDurationSeconds: maxDurationSeconds,
        minDurationSeconds: minDurationSeconds,
      }),
    ),
    value468 = list154.map((list155, value469) => {
      const list156 = [
          ...new Map(
            list155.map((value470) => [
              normalizeText(value470.sourceClip?.ref),
              value470.sourceClip,
            ]),
          ).values(),
        ],
        sourcePlanRefs = [...new Set(list155.map((value471) => normalizeText(value471.plan?.ref)))],
        shots3 = list155.map((value472) => value472.shot),
        contentDurationSec = Number(getStoryEpisodeSplitShotsDuration(shots3).toFixed(1)),
        durationSec5 = Number(
          Math.max(normalizePositiveNumber(minDurationSeconds) || 0, contentDurationSec).toFixed(1),
        );
      return {
        ref: ref16 + '-experimental-clip-' + (value469 + 1),
        title: formatStoryEpisodeClipTitle(value469),
        script: joinStoryEpisodeExperimentalClipText(list156.map((value473) => value473?.script)),
        creativeIntent: joinStoryEpisodeExperimentalClipText(
          list156.map((value474) => value474?.creativeIntent),
        ),
        transition: joinStoryEpisodeExperimentalClipText(
          list156.map((value475) => value475?.transition),
        ),
        shots: shots3,
        contentDurationSec: contentDurationSec,
        durationSec: durationSec5,
        assetRefs: [...new Set(shots3.flatMap((value476) => value476?.assetRefs || []))],
        sourcePlanRefs: sourcePlanRefs,
      };
    });
  if (!promptExperiment) return value468;
  return addStoryEpisodeDirectorContinuityHandoffs(value468);
}
function addStoryEpisodeDirectorContinuityHandoffs(list157 = []) {
  return list157.map((args37, count13) => {
    const value477 = count13 > 0 ? list157[count13 - 1] : null,
      value478 = value477?.shots?.at(-1) || null,
      value479 = args37?.shots?.[0] || null;
    return {
      ...args37,
      directorContinuityTest: true,
      continuityHandoff: {
        previousExitState: normalizeText(value478?.visual),
        previousEndCamera: normalizeText(value478?.camera),
        currentEntryState: normalizeText(value479?.visual),
        currentOpeningCamera: normalizeText(value479?.camera),
        transitionFromPrevious: normalizeText(value479?.transitionFromPrevious),
      },
    };
  });
}
function createStoryEpisodeClipDurationError({
  clip: clip = {},
  clipIndex: clipIndex = 0,
  clipCount: clipCount = 0,
  sourceShots: sourceShots = [],
  shots: shots = [],
  durationSec: durationSec = 0,
  maxDurationSeconds: maxDurationSeconds = 15,
} = {}) {
  const formatStoryEpisodeClipTitle2 = formatStoryEpisodeClipTitle(clipIndex),
    correctedDurationSec = Number(durationSec.toFixed(1)),
    error25 = new Error(
      '片段“' +
        formatStoryEpisodeClipTitle2 +
        '”片段总时长 ' +
        correctedDurationSec +
        ' 秒超过 ' +
        maxDurationSeconds +
        ' 秒上限；需要由 Agent 按完整动作节拍、对白轮次或情绪转折重新规划。',
    );
  return (
    (error25.validationDetails = {
      type: 'clip_duration_overflow',
      clip: {
        index: clipIndex + 1,
        count: clipCount,
        ref: normalizeStoryAssetReference(clip?.ref, 'clip-' + (clipIndex + 1)),
        correctedDurationSec: correctedDurationSec,
        maxDurationSec: maxDurationSeconds,
        overflowSeconds: Number((durationSec - maxDurationSeconds).toFixed(1)),
        shots: shots.map((time3, index3) => ({
          index: index3 + 1,
          providedDurationSec: normalizePositiveNumber(
            sourceShots[index3]?.durationSec || sourceShots[index3]?.durationSeconds,
          ),
          correctedDurationSec: Number(Number(time3.durationSec).toFixed(1)),
          time: time3.time,
          visual: time3.visual,
          dialogue: time3.dialogue,
          voiceover: time3.voiceover,
        })),
      },
    }),
    error25
  );
}
function createStoryEpisodeClipDurationConstraintError({
  clip: clip = {},
  clipIndex: clipIndex = 0,
  clipCount: clipCount = 0,
  durationSec: durationSec = 0,
  durationConstraints: durationConstraints = {},
} = {}) {
  const formatStoryEpisodeClipTitle3 = formatStoryEpisodeClipTitle(clipIndex),
    durationSec6 = Number(Number(durationSec).toFixed(1)),
    allowedDurationSeconds = Array.isArray(durationConstraints.allowedSeconds)
      ? durationConstraints.allowedSeconds
      : [],
    value480 = allowedDurationSeconds.length
      ? '只允许 ' + allowedDurationSeconds.join('、') + ' 秒'
      : (durationConstraints.minSeconds || 0) +
        ' 至 ' +
        (durationConstraints.maxSeconds || '不限') +
        ' 秒' +
        (durationConstraints.stepSeconds ? '、步进 ' + durationConstraints.stepSeconds + ' 秒' : ''),
    error26 = new Error(
      '片段“' +
        formatStoryEpisodeClipTitle3 +
        '”总时长 ' +
        durationSec6 +
        ' 秒不符合当前视频模型时长约束（' +
        value480 +
        '）；必须由 Agent 重新分组，客户端未修改原始时长。',
    );
  return (
    (error26.validationDetails = {
      type: 'clip_duration_unsupported',
      clip: {
        index: clipIndex + 1,
        count: clipCount,
        ref: normalizeStoryAssetReference(clip?.ref, 'clip-' + (clipIndex + 1)),
        durationSec: durationSec6,
        minDurationSec: durationConstraints.minSeconds || 0,
        maxDurationSec: durationConstraints.maxSeconds || 0,
        stepDurationSec: durationConstraints.stepSeconds || 0,
        allowedDurationSeconds: allowedDurationSeconds,
      },
    }),
    error26
  );
}
function isStoryEpisodeClipDurationSupported(value481, enabled19 = null) {
  if (!enabled19) return true;
  const count14 = Number(value481);
  if (!Number.isFinite(count14) || count14 <= 0) return false;
  const list158 = Array.isArray(enabled19.allowedSeconds) ? enabled19.allowedSeconds : [];
  if (list158.length)
    return list158.some((value482) => Math.abs(Number(value482) - count14) < 0.000001);
  if (enabled19.minSeconds && count14 < enabled19.minSeconds) return false;
  if (enabled19.maxSeconds && count14 > enabled19.maxSeconds) return false;
  if (enabled19.stepSeconds) {
    const value483 = enabled19.minSeconds || 0,
      value484 = (count14 - value483) / enabled19.stepSeconds;
    if (Math.abs(value484 - Math.round(value484)) >= 0.000001) return false;
  }
  return true;
}
function tokenizeStorySpokenTextAtAuthoredPauses(value485 = '') {
  const list159 = normalizeText(value485);
  if (!list159) return { speakerPrefix: '', units: [] };
  const speakerPrefix = getStoryDialogueSpeakerPrefix(list159),
    list160 = speakerPrefix ? list159.slice(speakerPrefix.length) : list159,
    value486 = /(?:…{2,}|\.{3,}|—{2,}|[。！？!?；;])(?:[”"’']+)?/gu,
    list161 = [];
  let value487 = 0,
    value488;
  while ((value488 = value486.exec(list160)) !== null) {
    const value489 = value488.index + value488[0].length,
      value490 = list160.slice(value487, value489);
    if (value490.trim()) list161.push(value490);
    value487 = value489;
  }
  const value491 = list160.slice(value487);
  if (value491.trim()) list161.push(value491);
  const units = [];
  return (
    list161.forEach((value492) => {
      if (/^[\s“”"'‘’…—.]+$/u.test(value492) && units.length) {
        units[units.length - 1] += value492;
        return;
      }
      units.push(value492);
    }),
    { speakerPrefix: speakerPrefix, units: units }
  );
}
function getStorySpokenSegmentMinimumSeconds(options20 = {}, value493 = '', value494 = '') {
  return countStorySpokenUnits(value494) / STORY_MAX_SPOKEN_UNITS_PER_SECOND;
}
function getStorySpokenChunkText(options21 = {}, value495 = '') {
  const value496 = (Array.isArray(options21.units) ? options21.units : []).join('');
  return value495 && value496.startsWith(value495) ? value496 : '' + value495 + value496;
}
function getStorySpokenChunkMinimumSeconds(value497, value498, value499, value500) {
  return getStorySpokenSegmentMinimumSeconds(value497, value498, getStorySpokenChunkText(value499, value500));
}
function getStoryAuthoredPauseBoundaryPriority(options22 = {}) {
  const value501 = (Array.isArray(options22?.units) ? options22.units : []).join('');
  if (/[。！？!?；;][”"’']?$/u.test(value501)) return 100;
  if (/[”"’']—{2,}$/u.test(value501)) return 90;
  if (/—{2,}[”"’']?$/u.test(value501)) return 50;
  if (/(?:…{2,}|\.{3,})[”"’']?$/u.test(value501)) return 40;
  return 0;
}
function splitStoryEpisodeOverlongSpokenShot(args38 = {}, { maximum: maximum = 15 } = {}) {
  const positiveNumber5 = normalizePositiveNumber(args38?.durationSec);
  if (!positiveNumber5 || positiveNumber5 <= maximum + 0.001) return [args38];
  const list162 = ['dialogue', 'voiceover'].filter((value502) => normalizeText(args38?.[value502]));
  if (list162.length !== 1) return [args38];
  const value503 = list162[0],
    { speakerPrefix: speakerPrefix2, units: units2 } = tokenizeStorySpokenTextAtAuthoredPauses(
      args38[value503],
    );
  if (units2.length < 2) return [args38];
  let list163 = units2.map((value504) => ({ units: [value504] }));
  for (const value505 of list163) {
    const storySpokenChunkMinimumSeconds = getStorySpokenChunkMinimumSeconds(
      args38,
      value503,
      value505,
      speakerPrefix2,
    );
    if (storySpokenChunkMinimumSeconds > maximum + 0.001) return [args38];
  }
  while (list163.length > 1) {
    let enabled20 = null;
    for (let value506 = 0; value506 < list163.length - 1; value506 += 1) {
      const value507 = { units: [...list163[value506].units, ...list163[value506 + 1].units] },
        mergedMinimumSeconds = getStorySpokenChunkMinimumSeconds(args38, value503, value507, speakerPrefix2);
      if (mergedMinimumSeconds > maximum + 0.001) continue;
      const chunks = [...list163.slice(0, value506), value507, ...list163.slice(value506 + 2)],
        value508 = chunks.reduce(
          (value509, value510) =>
            value509 + getStorySpokenChunkMinimumSeconds(args38, value503, value510, speakerPrefix2),
          0,
        ),
        value511 = Math.max(positiveNumber5, value508);
      if (value511 > chunks.length * maximum + 0.001) continue;
      const removedBoundaryPriority = getStoryAuthoredPauseBoundaryPriority(list163[value506]);
      (!enabled20 ||
        removedBoundaryPriority < enabled20.removedBoundaryPriority ||
        (removedBoundaryPriority === enabled20.removedBoundaryPriority &&
          mergedMinimumSeconds < enabled20.mergedMinimumSeconds)) &&
        (enabled20 = {
          chunks: chunks,
          mergedMinimumSeconds: mergedMinimumSeconds,
          removedBoundaryPriority: removedBoundaryPriority,
        });
    }
    if (!enabled20) break;
    list163 = enabled20.chunks;
  }
  const list164 = list163.map((value512) =>
      Math.ceil(
        getStorySpokenChunkMinimumSeconds(args38, value503, value512, speakerPrefix2) * 10 - 0.001,
      ),
    ),
    value513 = Math.round(maximum * 10),
    value514 = Math.max(
      Math.round(positiveNumber5 * 10),
      list164.reduce((value515, value516) => value515 + value516, 0),
    );
  if (value514 > list163.length * value513) return [args38];
  const durationSec7 = [...list164];
  let count15 = value514 - durationSec7.reduce((value517, value518) => value517 + value518, 0);
  while (count15 > 0) {
    let enabled21 = false;
    for (let value519 = 0; value519 < durationSec7.length && count15 > 0; value519 += 1) {
      if (durationSec7[value519] >= value513) continue;
      ((durationSec7[value519] += 1), (count15 -= 1), (enabled21 = true));
    }
    if (!enabled21) break;
  }
  return list163.map((value520, value521) => ({
    ...args38,
    durationSec: durationSec7[value521] / 10,
    [value503]: getStorySpokenChunkText(value520, speakerPrefix2),
  }));
}
function repackStoryEpisodeSplitClipsLocally(
  clipCount2 = [],
  { maxDurationSeconds: maxDurationSeconds = 15 } = {},
) {
  const maximum3 = normalizePositiveNumber(maxDurationSeconds) || 15;
  return (Array.isArray(clipCount2) ? clipCount2 : []).flatMap((clip2, clipIndex2) => {
    const list165 = [];
    let list166 = [],
      value522 = 0;
    const value523 = (Array.isArray(clip2?.shots) ? clip2.shots : []).flatMap((value524) =>
      splitStoryEpisodeOverlongSpokenShot(value524, { maximum: maximum3 }),
    );
    for (const value525 of value523) {
      const durationSec8 = normalizePositiveNumber(value525?.durationSec);
      if (!durationSec8)
        throw createStoryEpisodeClipDurationError({
          clip: clip2,
          clipIndex: clipIndex2,
          clipCount: clipCount2.length,
          sourceShots: [value525],
          shots: [value525],
          durationSec: durationSec8 || 0,
          maxDurationSeconds: maximum3,
        });
      if (durationSec8 > maximum3) {
        list166.length && (list165.push(list166), (list166 = []), (value522 = 0));
        list165.push([value525]);
        continue;
      }
      (list166.length &&
        value522 + durationSec8 > maximum3 &&
        (list165.push(list166), (list166 = []), (value522 = 0)),
        list166.push(value525),
        (value522 += durationSec8));
    }
    if (list166.length) list165.push(list166);
    if (list165.length <= 1) return [clip2];
    return list165.map((shots4, value526) => {
      const script4 = shots4.flatMap((value527) => [
        normalizeText(value527?.visual),
        normalizeText(value527?.dialogue),
        normalizeText(value527?.voiceover),
      ])
        .filter(Boolean)
        .join('；');
      return {
        ...clip2,
        ref: clip2.ref + '-part-' + (value526 + 1),
        script: script4 || clip2.script,
        shots: shots4,
        durationSec: Number(getStoryEpisodeSplitShotsDuration(shots4).toFixed(1)),
        assetRefs: [...new Set(shots4.flatMap((value528) => value528.assetRefs || []))],
      };
    });
  });
}
function hasExplicitStoryEpisodeVoiceover(options23 = {}) {
  const list167 = [
    options23?.script?.fullText,
    options23?.fullScript,
    options23?.scriptText,
    ...(Array.isArray(options23?.script?.scenes)
      ? options23.script.scenes.map((dom12) => dom12?.body)
      : []),
  ]
    .map((value529) => String(value529 || ''))
    .filter(Boolean);
  return list167.some((value530) =>
    /^\s*(?:解说\s*[／/]\s*旁白|旁白|解说|内心独白|画外音|VO|V\.O\.?|OS|O\.S\.?)(?:[^\S\r\n]*(?:（[^）\r\n]*）|\([^\)\r\n]*\)))?[^\S\r\n]*[：:]/imu.test(value530),
  );
}
export function parseStoryEpisodeSplitResult(
  value531,
  {
    episodeRef: episodeRef = '',
    episode: episode = {},
    scriptMode: scriptMode = '',
    constraints: constraints = {},
    assets: assets = [],
    assetRefs: assetRefs = [],
    clipPlans: clipPlans = [],
    minimumShotsPerClip: minimumShotsPerClip = 2,
    maximumShotsPerClip: maximumShotsPerClip = 5,
    enforceMaxDuration: enforceMaxDuration = true,
    repairMissingShotFields: repairMissingShotFields = false,
    allowEmptyAudio: allowEmptyAudio = true,
    requireAllPlanCharacters: requireAllPlanCharacters = true,
    completeCharacterAssetUsages: completeCharacterAssetUsages = true,
    completePlanSceneUsage: completePlanSceneUsage = false,
    includeCutAfter: includeCutAfter = false,
    repackOverlongClips: repackOverlongClips = false,
    enforceSingleSceneAssetUsage: enforceSingleSceneAssetUsage = true,
    clipDurationConstraints: clipDurationConstraints = null,
    rejectUnsupportedClipDuration: rejectUnsupportedClipDuration = true,
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const value532 =
      !episode.replication?.sourceAnalysis &&
      normalizeText(scriptMode) === STORY_SCRIPT_MODE_PLOT &&
      !hasExplicitStoryEpisodeVoiceover(episode),
    storyEpisodeSplitCompactDialogueCatalog = createStoryEpisodeSplitCompactDialogueCatalog(episode, assets),
    maxDurationSeconds2 = normalizeStoryPlanningConstraints(constraints),
    includeTimeline2 = isStoryContinuousTimelinePromptMode(promptMode),
    durationConstraints2 = normalizeStoryEpisodeClipDurationConstraints(clipDurationConstraints),
    value533 = Math.max(1, Math.min(5, Math.trunc(Number(minimumShotsPerClip) || 2))),
    value534 = Math.max(0, Math.trunc(Number(maximumShotsPerClip) || 0)),
    strictJson6 = parseStrictJson(getResultText(value531), 'Agent 未返回片段拆分结果。'),
    clipCount3 = applyReplicationAsrDelivery(
      expandStoryEpisodeSplitCompactData(strictJson6, {
        episodeRef: episodeRef,
        episode: episode,
        assets: assets,
      }),
      episode,
      { planning: { promptMode: promptMode } },
      assets,
    ),
    assetCatalog2 = buildStoryEpisodeSplitAssetCatalog(assets, assetRefs),
    map34 = new Map(
      (Array.isArray(clipPlans) ? clipPlans : []).map((value535) => [
        normalizeStoryAssetReference(value535?.ref, ''),
        value535,
      ]),
    ),
    value536 = Array.isArray(clipCount3.clips)
      ? clipCount3.clips
          .map((clip3, clipIndex3) => {
            const clipLabel2 = formatStoryEpisodeClipTitle(clipIndex3),
              ref17 = normalizeStoryAssetReference(clip3?.ref, 'clip-' + (clipIndex3 + 1)),
              clipPlan2 = map34.get(ref17) || null,
              handler9 = repairMissingShotFields
                ? normalizeStoryEpisodeExperimentalStandaloneText
                : normalizeText,
              sourceShots2 = Array.isArray(clip3?.shots) ? clip3.shots : [],
              value537 = sourceShots2.flatMap((value538) => [
                normalizeText(value538?.visual),
                normalizeText(value538?.dialogue),
                value532 ? '' : normalizeText(value538?.voiceover),
              ])
                .filter(Boolean)
                .join('；'),
              script5 =
                handler9(clip3?.script) ||
                (repairMissingShotFields ? normalizeText(clipPlan2?.beat) || handler9(value537) : ''),
              creativeIntent2 = handler9(clip3?.creativeIntent),
              transition3 = handler9(clip3?.transition);
            if (!script5 || (!repairMissingShotFields && (!creativeIntent2 || !transition3)))
              throw new Error(clipLabel2 + ' 缺少 script、creativeIntent 或 transition。');
            validateStoryEpisodeSplitClipIndependence({
              clipLabel: clipLabel2,
              script: script5,
              creativeIntent: creativeIntent2,
              transition: transition3,
            });
            if (sourceShots2.length < value533)
              throw new Error('片段“' + clipLabel2 + '”至少包含 ' + value533 + ' 个分镜。');
            if (value534 && sourceShots2.length > value534)
              throw new Error('片段“' + clipLabel2 + '”最多包含 ' + value534 + ' 个分镜。');
            const value539 = sourceShots2.map((value540, index4) => {
                const value541 = index4 === 0,
                  cutAfter2 = index4 === sourceShots2.length - 1,
                  visual4 =
                    [
                      ...new Set(
                        [
                          value541 ? normalizeText(clipPlan2?.entryState) : '',
                          cutAfter2 ? normalizeText(clipPlan2?.exitState) : '',
                        ].filter(Boolean),
                      ),
                    ].join('；') || script5,
                  args39 = normalizeStoryEpisodeSplitShot(value540, {
                    clipTitle: clipLabel2,
                    index: index4,
                    assetCatalog: assetCatalog2,
                    fallbacks:
                      repairMissingShotFields && !episode.replication?.sourceAnalysis
                        ? {
                            time: normalizeText(clipPlan2?.time),
                            visual: visual4,
                            camera: '中景，平视机位，固定拍摄，主体居中构图，50mm标准镜头。',
                            audio: allowEmptyAudio
                              ? ''
                              : normalizeText(value540?.dialogue || value540?.voiceover)
                                ? '对白与环境底噪。'
                                : '环境音。',
                            cutAfter: cutAfter2 ? 'preferred' : 'allowed',
                          }
                        : {},
                    allowEmptyAudio: allowEmptyAudio,
                    includeCutAfter: includeCutAfter,
                    includeTimeline: includeTimeline2,
                    preserveCameraCuts: Boolean(episode.replication?.sourceAnalysis),
                  }),
                  dialogue4 = completeStoryEpisodeSplitDialogueSpeaker(
                    args39.dialogue,
                    storyEpisodeSplitCompactDialogueCatalog,
                  ),
                  args40 = dialogue4 === args39.dialogue ? args39 : { ...args39, dialogue: dialogue4 };
                return value532 ? { ...args40, voiceover: '' } : args40;
              }),
              list168 = mergeStoryEpisodeSplitDialogueFragments(value539, clipPlan2?.dialogueUnits);
            includeTimeline2 &&
              list168.forEach((value542, count16) => {
                const value543 = count16 === 0 ? 0 : list168[count16 - 1].endSec;
                if (value542.startSec !== value543)
                  throw new Error(
                    '片段“' +
                      clipLabel2 +
                      '”的时间轴不连续：分镜 ' +
                      (count16 + 1) +
                      ' 应从 ' +
                      value543 +
                      ' 秒开始。',
                  );
              });
            const value544 = completeCharacterAssetUsages
                ? completeStoryEpisodeSplitCharacterAssetUsages(list168, {
                    clipPlan: clipPlan2,
                    assetCatalog: assetCatalog2,
                    clipTitle: clipLabel2,
                    requireAllPlanCharacters: requireAllPlanCharacters,
                  })
                : list168,
              shots5 = completePlanSceneUsage
                ? completeStoryEpisodeSplitSceneAssetUsage(value544, {
                    clipPlan: clipPlan2,
                    assetCatalog: assetCatalog2,
                    clipTitle: clipLabel2,
                  })
                : value544,
              value545 = sourceShots2.some((value546) => Array.isArray(value546?.assetUsages)),
              map35 = new Set(
                [...assetCatalog2.assetByRef.values()]
                  .filter((value547) => value547.kind === 'scene')
                  .map((value548) => value548.assetRef),
              );
            if (enforceSingleSceneAssetUsage && value545 && map35.size) {
              const list169 = [
                ...new Set(
                  shots5.flatMap((value549) => value549.assetUsages)
                    .map((value550) => value550.assetRef)
                    .filter((value551) => map35.has(value551)),
                ),
              ];
              if (list169.length !== 1)
                throw new Error(
                  list169.length
                    ? '片段“' + clipLabel2 + '”引用了多个场景资产；每个片段只能设定在一个场景。'
                    : '片段“' + clipLabel2 + '”缺少场景资产；每个片段必须设定在一个场景。',
                );
            }
            const durationSec9 = Number(getStoryEpisodeSplitShotsDuration(shots5).toFixed(1)),
              message4 = !isStoryEpisodeClipDurationSupported(durationSec9, durationConstraints2)
                ? createStoryEpisodeClipDurationConstraintError({
                    clip: clip3,
                    clipIndex: clipIndex3,
                    clipCount: clipCount3.clips.length,
                    durationSec: durationSec9,
                    durationConstraints: durationConstraints2,
                  })
                : null;
            if (message4 && rejectUnsupportedClipDuration) throw message4;
            if (enforceMaxDuration && durationSec9 > maxDurationSeconds2.sceneMaxSeconds)
              throw createStoryEpisodeClipDurationError({
                clip: clip3,
                clipIndex: clipIndex3,
                clipCount: clipCount3.clips.length,
                sourceShots: sourceShots2,
                shots: shots5,
                durationSec: durationSec9,
                maxDurationSeconds: maxDurationSeconds2.sceneMaxSeconds,
              });
            const assetRefs4 = [...new Set(shots5.flatMap((value552) => value552.assetRefs))];
            return {
              ref: ref17,
              title: clipLabel2,
              script: script5,
              creativeIntent: creativeIntent2,
              transition: transition3,
              ...(episode.replication?.sourceAnalysis
                ? {
                    replicationContentType: resolveReplicationContentType(
                      episode.replication.sourceAnalysis.contentType,
                      clipCount3.contentType,
                      clip3.replicationContentType,
                    ),
                  }
                : {}),
              shots: shots5,
              durationSec: durationSec9,
              assetRefs: assetRefs4,
              ...(message4
                ? {
                    durationValidation: {
                      status: 'unsupported',
                      message: message4.message,
                      details: message4.validationDetails,
                    },
                  }
                : {}),
            };
          })
          .filter(Boolean)
      : [],
    list170 = repackOverlongClips
      ? repackStoryEpisodeSplitClipsLocally(value536, {
          maxDurationSeconds: maxDurationSeconds2.sceneMaxSeconds,
        })
      : value536,
    clips2 = list170.map((args41, value553) => ({
      ...args41,
      title: formatStoryEpisodeClipTitle(value553),
    }));
  if (!clips2.length) throw new Error('Agent 返回结果没有可用片段。');
  const totalDurationSeconds = clips2.reduce(
      (value554, value555) => value554 + value555.durationSec,
      0,
    ),
    list171 = clips2.map((value556) => value556.ref);
  if (new Set(list171).size !== list171.length) throw new Error('Agent 返回了重复的片段引用。');
  const episodeRef5 = normalizeStoryAssetReference(clipCount3.episodeRef || episodeRef, 'episode-1');
  if (episodeRef && episodeRef5 !== normalizeStoryAssetReference(episodeRef, 'episode-1'))
    throw new Error('Agent 返回的分集引用与当前分集不一致。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    episodeRef: episodeRef5,
    totalDurationSeconds: totalDurationSeconds,
    clips: clips2,
  };
}
function serializeStoryEpisodeSplitValidationError(
  error27,
  { clipIndex: clipIndex = 0, clipCount: clipCount = 0 } = {},
) {
  const validationDetails = error27?.validationDetails
    ? JSON.parse(JSON.stringify(error27.validationDetails))
    : null;
  return (
    validationDetails?.clip &&
      ((validationDetails.clip.index = clipIndex + 1),
      (validationDetails.clip.count = clipCount)),
    {
      message: normalizeText(error27?.message || error27) || '片段校验失败。',
      ...(validationDetails ? { validationDetails: validationDetails } : {}),
    }
  );
}
function normalizeStoryEpisodeSplitDraft(
  value557,
  {
    episodeRef: episodeRef = '',
    episode: episode = {},
    scriptMode: scriptMode = '',
    constraints: constraints = {},
    assets: assets = [],
    clipPlans: clipPlans = [],
    minimumShotsPerClip: minimumShotsPerClip = 2,
    maximumShotsPerClip: maximumShotsPerClip = 5,
    enforceMaxDuration: enforceMaxDuration = true,
    repairMissingShotFields: repairMissingShotFields = false,
    allowEmptyAudio: allowEmptyAudio = true,
    requireAllPlanCharacters: requireAllPlanCharacters = true,
    completePlanSceneUsage: completePlanSceneUsage = false,
    includeCutAfter: includeCutAfter = false,
    repackOverlongClips: repackOverlongClips = false,
    enforceSingleSceneAssetUsage: enforceSingleSceneAssetUsage = true,
    clipDurationConstraints: clipDurationConstraints = null,
    rejectUnsupportedClipDuration: rejectUnsupportedClipDuration = true,
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const resultText3 = getResultText(value557);
  let clipCount4,
    value558 = null;
  try {
    clipCount4 = parseStrictJson(resultText3, 'Agent 未返回片段拆分结果。');
  } catch (value559) {
    value558 = value559;
  }
  if (!Array.isArray(clipCount4?.clips)) {
    const clips3 = extractCompleteJsonArrayItems(resultText3, 'clips');
    if (clips3.length)
      clipCount4 = {
        episodeRef: extractJsonStringProperty(resultText3, 'episodeRef') || episodeRef,
        clips: clips3,
      };
    else {
      if (value558) throw value558;
    }
  }
  if (!Array.isArray(clipCount4.clips) || !clipCount4.clips.length)
    throw new Error('Agent 返回结果没有可用片段。');
  const episodeRef6 = normalizeStoryAssetReference(clipCount4.episodeRef || episodeRef, 'episode-1');
  if (episodeRef && episodeRef6 !== normalizeStoryAssetReference(episodeRef, 'episode-1'))
    throw new Error('Agent 返回的分集引用与当前分集不一致。');
  const map36 = new Set(),
    items = clipCount4.clips.map((args42, sourceIndex) => {
      const ref18 = normalizeStoryAssetReference(args42?.ref, 'clip-' + (sourceIndex + 1)),
        text36 = normalizeText(args42?.ref) ? args42 : { ...args42, ref: ref18 };
      try {
        const clips4 = parseStoryEpisodeSplitResult(
            { episodeRef: episodeRef6, clips: [text36] },
            {
              episodeRef: episodeRef6,
              episode: episode,
              scriptMode: scriptMode,
              constraints: constraints,
              assets: assets,
              clipPlans: clipPlans,
              minimumShotsPerClip: minimumShotsPerClip,
              maximumShotsPerClip: maximumShotsPerClip,
              enforceMaxDuration: enforceMaxDuration,
              repairMissingShotFields: repairMissingShotFields,
              allowEmptyAudio: allowEmptyAudio,
              requireAllPlanCharacters: requireAllPlanCharacters,
              completePlanSceneUsage: completePlanSceneUsage,
              includeCutAfter: includeCutAfter,
              repackOverlongClips: repackOverlongClips,
              enforceSingleSceneAssetUsage: enforceSingleSceneAssetUsage,
              clipDurationConstraints: clipDurationConstraints,
              rejectUnsupportedClipDuration: rejectUnsupportedClipDuration,
              promptMode: promptMode,
            },
          ),
          value560 = clips4.clips.find((value561) => map36.has(value561.ref));
        if (value560) throw new Error('Agent 返回了重复的片段引用“' + value560.ref + '”。');
        return (
          clips4.clips.forEach((value562) => map36.add(value562.ref)),
          { status: 'valid', sourceIndex: sourceIndex, sourceClipRef: ref18, clips: clips4.clips }
        );
      } catch (value563) {
        return {
          status: 'invalid',
          sourceIndex: sourceIndex,
          sourceClipRef: ref18,
          rawClips: [text36],
          error: serializeStoryEpisodeSplitValidationError(value563, {
            clipIndex: sourceIndex,
            clipCount: clipCount4.clips.length,
          }),
        };
      }
    });
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'draft',
    episodeRef: episodeRef6,
    items: items,
    attempts: 1,
  };
}
function restoreStoryEpisodeSplitDraft(options24 = {}, { episodeRef: episodeRef = '' } = {}) {
  const episodeRef7 = normalizeStoryAssetReference(options24?.episodeRef || episodeRef, 'episode-1');
  if (episodeRef && episodeRef7 !== normalizeStoryAssetReference(episodeRef, 'episode-1'))
    throw new Error('保存的分集草稿与当前分集不一致。');
  const items2 = Array.isArray(options24?.items) ? options24.items : [];
  if (!items2.length) throw new Error('没有可继续修复的分集草稿。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'draft',
    episodeRef: episodeRef7,
    items: items2.map((status, value564) => ({
      ...status,
      status: status?.status === 'valid' ? 'valid' : 'invalid',
      sourceIndex: Number.isInteger(status?.sourceIndex) ? status.sourceIndex : value564,
      sourceClipRef: normalizeStoryAssetReference(status?.sourceClipRef, 'clip-' + (value564 + 1)),
      clips: status?.status === 'valid' && Array.isArray(status?.clips) ? status.clips : [],
      rawClips:
        status?.status === 'valid'
          ? []
          : Array.isArray(status?.rawClips)
            ? status.rawClips
            : [],
      error:
        status?.status === 'valid'
          ? null
          : {
              message: normalizeText(status?.error?.message) || '片段仍需修复。',
              ...(status?.error?.validationDetails
                ? { validationDetails: status.error.validationDetails }
                : {}),
            },
    })),
    attempts: Math.max(1, Math.trunc(Number(options24?.attempts) || 1)),
  };
}
function getStoryEpisodeSplitDraftCounts(options25 = {}) {
  const validClipCount = Array.isArray(options25?.items) ? options25.items : [];
  return {
    validClipCount: validClipCount.reduce(
      (value565, response19) =>
        value565 +
        (response19?.status === 'valid' && Array.isArray(response19?.clips)
          ? response19.clips.length
          : 0),
      0,
    ),
    invalidItemCount: validClipCount.filter((response20) => response20?.status !== 'valid').length,
  };
}
function finalizeStoryEpisodeSplitDraft(episodeRef8 = {}) {
  const { invalidItemCount: invalidItemCount } = getStoryEpisodeSplitDraftCounts(episodeRef8);
  if (invalidItemCount) return null;
  const totalDurationSeconds2 = episodeRef8.items
    .flatMap((value566) => value566.clips || [])
    .map((args43, value567) => ({ ...args43, title: formatStoryEpisodeClipTitle(value567) }));
  if (!totalDurationSeconds2.length) throw new Error('Agent 返回结果没有可用片段。');
  const list172 = totalDurationSeconds2.map((value568) => value568.ref);
  if (new Set(list172).size !== list172.length) throw new Error('Agent 返回了重复的片段引用。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    episodeRef: episodeRef8.episodeRef,
    totalDurationSeconds: totalDurationSeconds2.reduce(
      (value569, value570) => value569 + value570.durationSec,
      0,
    ),
    clips: totalDurationSeconds2,
    ...(typeof episodeRef8?.rawResponse === 'string' ? { rawResponse: episodeRef8.rawResponse } : {}),
  };
}
function createStoryEpisodeSplitPartialResult(episodeRef9 = {}) {
  const clips5 = episodeRef9.items
      .flatMap((response21) =>
        response21?.status === 'valid' && Array.isArray(response21?.clips)
          ? response21.clips
          : [],
      )
      .map((args44, value571) => ({ ...args44, title: formatStoryEpisodeClipTitle(value571) })),
    rejectedClips = episodeRef9.items
      .filter((response22) => response22?.status !== 'valid')
      .map((sourceIndex2) => ({
        sourceIndex: sourceIndex2.sourceIndex,
        sourceClipRef: sourceIndex2.sourceClipRef,
        message: normalizeText(sourceIndex2?.error?.message) || '片段仍需修复。',
        ...(sourceIndex2?.error?.validationDetails
          ? { validationDetails: sourceIndex2.error.validationDetails }
          : {}),
      }));
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'partial',
    episodeRef: episodeRef9.episodeRef,
    items: episodeRef9.items,
    clips: clips5,
    rejectedClips: rejectedClips,
    totalDurationSeconds: clips5.reduce((value572, value573) => value572 + value573.durationSec, 0),
    attempts: Math.max(1, Math.trunc(Number(episodeRef9?.attempts) || 1)),
    ...(typeof episodeRef9?.rawResponse === 'string' ? { rawResponse: episodeRef9.rawResponse } : {}),
  };
}
function throwStoryEpisodeSplitPartialResult(options26 = {}) {
  const storyEpisodeSplitPartialResult = createStoryEpisodeSplitPartialResult(options26),
    value574 = storyEpisodeSplitPartialResult.clips.length,
    count17 = storyEpisodeSplitPartialResult.rejectedClips.length,
    value575 =
      count17 === 1 ? normalizeText(storyEpisodeSplitPartialResult.rejectedClips[0]?.message) : '',
    error28 = new Error(
      '分集拆分未完全通过：已保留 ' +
        value574 +
        ' 个合格片段，' +
        count17 +
        ' 个片段仍需修复。' +
        (value575 ? ' ' + value575 : ''),
    );
  ((error28.name = 'StoryEpisodeSplitPartialError'),
    (error28.partialResult = storyEpisodeSplitPartialResult));
  throw error28;
}
function reportStoryEpisodeSplitRequestDiagnostics(
  value576,
  {
    phase: phase = 'full-generation',
    prompt: prompt = '',
    systemPrompt: systemPrompt = '',
    failedClipCount: failedClipCount = 0,
    carriesFullEpisodeContext: carriesFullEpisodeContext = phase !== 'targeted-repair',
    automaticCallLimit: automaticCallLimit = 2,
    details: details = {},
  } = {},
) {
  const value577 = value576?.info || value576?.log;
  if (typeof value577 !== 'function') return null;
  const list173 = String(prompt || ''),
    list174 = String(systemPrompt || ''),
    promptBytes =
      typeof TextEncoder === 'function' ? new TextEncoder().encode(list173).length : list173.length,
    systemPromptBytes =
      typeof TextEncoder === 'function' ? new TextEncoder().encode(list174).length : list174.length;
  return value577.call(value576, '[storyWorkspace][episode-split-request]', {
    phase: phase,
    ...(details && typeof details === 'object' ? details : {}),
    promptCharacters: [...list173].length,
    promptBytes: promptBytes,
    systemPromptCharacters: [...list174].length,
    systemPromptBytes: systemPromptBytes,
    inputCharacters: [...list173].length + [...list174].length,
    inputBytes: promptBytes + systemPromptBytes,
    failedClipCount: Math.max(0, Math.trunc(Number(failedClipCount) || 0)),
    carriesFullEpisodeContext: Boolean(carriesFullEpisodeContext),
    automaticCallLimit: Math.max(1, Math.trunc(Number(automaticCallLimit) || 1)),
  });
}
function getStoryEpisodeSplitSerializedMetrics(value578) {
  let list175 = '';
  try {
    list175 = typeof value578 === 'string' ? value578 : JSON.stringify(value578);
  } catch {
    list175 = String(value578 || '');
  }
  const bytes =
    typeof TextEncoder === 'function' ? new TextEncoder().encode(list175).length : list175.length;
  return { characters: [...list175].length, bytes: bytes };
}
function getStoryEpisodeSplitResponseTiming(options27 = {}) {
  const value579 =
      options27?.transportTiming && typeof options27.transportTiming === 'object'
        ? options27.transportTiming
        : {},
    responseHeadersMs = (value580) => {
      const value581 = value579[value580];
      if (value581 === null || value581 === undefined || value581 === '') return null;
      const count18 = Number(value581);
      return Number.isFinite(count18) && count18 >= 0 ? count18 : null;
    };
  return {
    responseHeadersMs: responseHeadersMs('responseHeadersMs'),
    responseBodyMs: responseHeadersMs('responseBodyMs'),
    transportTotalMs: responseHeadersMs('totalMs'),
    firstByteMs: responseHeadersMs('firstByteMs'),
    firstTokenMs: responseHeadersMs('firstTokenMs'),
  };
}
function getStoryEpisodeExperimentalPromptSectionCharacters(enabled22) {
  if (!enabled22 || typeof enabled22 !== 'object') return {};
  return Object.fromEntries(
    Object.entries(enabled22).map(([value582, value583]) => [
      value582,
      getStoryEpisodeSplitSerializedMetrics(value583).characters,
    ]),
  );
}
function reportStoryEpisodeSplitRequestDiagnosticsInBackground(value584, value585) {
  try {
    const promise = reportStoryEpisodeSplitRequestDiagnostics(value584, value585);
    promise &&
      typeof promise.then === 'function' &&
      void Promise.resolve(promise).catch(() => undefined);
  } catch {}
}
function createStoryEpisodeExperimentalDiagnosticRequest({
  request: request3,
  diagnostics: diagnostics2,
  runId: runId,
  phase: phase3,
  nextRequestSequence: nextRequestSequence,
  carriesFullEpisodeContext: carriesFullEpisodeContext = false,
  context: context = {},
} = {}) {
  let phaseAttempt = 0;
  return async (prompt7 = {}) => {
    phaseAttempt += 1;
    const requestSequence = Math.max(1, Math.trunc(Number(nextRequestSequence?.()) || phaseAttempt)),
      requestId = runId + ':' + requestSequence,
      requestPayloadCharacters = getStoryEpisodeSplitSerializedMetrics(prompt7),
      automaticCallLimit2 = {
        status: 'started',
        countsTowardRequestTotal: true,
        runId: runId,
        requestId: requestId,
        requestSequence: requestSequence,
        phaseAttempt: phaseAttempt,
        model: normalizeText(prompt7?.model),
        provider: normalizeText(prompt7?.provider),
        structuredOutputRequested: Boolean(prompt7?.structuredOutput),
        timeoutMs: Math.max(0, Math.trunc(Number(prompt7?.timeoutMs) || 0)),
        requestPayloadCharacters: requestPayloadCharacters.characters,
        requestPayloadBytes: requestPayloadCharacters.bytes,
        strictAttemptLimit: 1,
        transportAttemptLimit: STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS,
        maximumActualCallsForPhase: STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS,
        ...(context && typeof context === 'object' ? context : {}),
      };
    return enqueueStoryEpisodeExperimentalRequest(async () => {
      const value586 = Date.now();
      reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics2, {
        phase: phase3,
        prompt: prompt7?.prompt,
        systemPrompt: prompt7?.systemPrompt,
        carriesFullEpisodeContext: carriesFullEpisodeContext,
        automaticCallLimit: automaticCallLimit2.maximumActualCallsForPhase,
        details: automaticCallLimit2,
      });
      try {
        const value587 = await request3(prompt7),
          responseCharacters = getStoryEpisodeSplitSerializedMetrics(getResultText(value587));
        return (
          reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics2, {
            phase: phase3,
            prompt: prompt7?.prompt,
            systemPrompt: prompt7?.systemPrompt,
            carriesFullEpisodeContext: carriesFullEpisodeContext,
            automaticCallLimit: automaticCallLimit2.maximumActualCallsForPhase,
            details: {
              ...automaticCallLimit2,
              status: 'succeeded',
              countsTowardRequestTotal: false,
              elapsedMs: Math.max(0, Date.now() - value586),
              responseCharacters: responseCharacters.characters,
              responseBytes: responseCharacters.bytes,
              ...getStoryEpisodeSplitResponseTiming(value587),
              ...(value587?.structuredOutputFallback
                ? {
                    structuredOutputFallbackMode: normalizeText(value587.structuredOutputFallback.mode),
                    structuredOutputFallbackStatus: Math.max(
                      0,
                      Math.trunc(Number(value587.structuredOutputFallback.status) || 0),
                    ),
                  }
                : {}),
            },
          }),
          value587
        );
      } catch (error29) {
        reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics2, {
          phase: phase3,
          prompt: prompt7?.prompt,
          systemPrompt: prompt7?.systemPrompt,
          carriesFullEpisodeContext: carriesFullEpisodeContext,
          automaticCallLimit: automaticCallLimit2.maximumActualCallsForPhase,
          details: {
            ...automaticCallLimit2,
            status: 'failed',
            countsTowardRequestTotal: false,
            elapsedMs: Math.max(0, Date.now() - value586),
            errorType: normalizeText(error29?.type || error29?.name),
            errorStatus: Math.max(
              0,
              Math.trunc(Number(error29?.status || error29?.statusCode) || 0),
            ),
            errorMessage: normalizeText(error29?.message || error29),
            retryable: Boolean(error29?.retryable || isStoryEpisodeExperimentalRetryable(error29)),
          },
        });
        throw error29;
      }
    });
  };
}
export function createStoryEpisodeDefaultSplitParseContext({
  episodeRef: episodeRef = '',
  episode: episode = {},
  scriptMode: scriptMode = '',
  constraints: constraints = {},
  assets: assets = [],
  clipDurationConstraints: clipDurationConstraints = null,
  promptMode: promptMode = 'seedance-2.0',
} = {}) {
  const isStoryContinuousTimelinePromptMode2 = isStoryContinuousTimelinePromptMode(promptMode),
    constraints5 = isStoryMinimaxH3PromptMode(promptMode)
      ? { ...constraints, sceneMaxSeconds: 15 }
      : constraints;
  return {
    episodeRef: episodeRef,
    episode: episode,
    scriptMode: scriptMode,
    constraints: constraints5,
    assets: assets,
    minimumShotsPerClip: 1,
    maximumShotsPerClip: 0,
    enforceMaxDuration: false,
    repairMissingShotFields: true,
    allowEmptyAudio: true,
    requireAllPlanCharacters: false,
    completeCharacterAssetUsages: !episode.replication?.sourceAnalysis,
    completePlanSceneUsage: false,
    repackOverlongClips: Boolean(clipDurationConstraints) && !isStoryContinuousTimelinePromptMode2,
    enforceSingleSceneAssetUsage: false,
    clipDurationConstraints: clipDurationConstraints,
    rejectUnsupportedClipDuration: false,
    promptMode: promptMode,
  };
}
function createStoryEpisodeSplitRawResponsePartialResult({
  episodeRef: episodeRef = '',
  rawResponse: rawResponse = '',
  attempts: attempts = 1,
  error: error = null,
} = {}) {
  const error30 = serializeStoryEpisodeSplitValidationError(error);
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'partial',
    episodeRef: episodeRef,
    items: [
      {
        status: 'invalid',
        sourceIndex: 0,
        sourceClipRef: 'raw-response',
        rawClips: [],
        rawResponse: rawResponse,
        error: error30,
      },
    ],
    clips: [],
    rejectedClips: [{ sourceIndex: 0, sourceClipRef: 'raw-response', message: error30.message }],
    totalDurationSeconds: 0,
    attempts: Math.max(1, Math.trunc(Number(attempts) || 1)),
    rawResponse: rawResponse,
  };
}
function serializeStoryEpisodeSplitTransportRaw(value588) {
  const value589 = value588?.raw;
  if (typeof value589 === 'string') return value589;
  if (value589 === undefined || value589 === null) return '';
  try {
    return JSON.stringify(value589);
  } catch {
    return String(value589 || '');
  }
}
function hasStoryEpisodeSplitTransportModelOutput(list176) {
  if (!list176) return false;
  if (typeof list176 === 'string') {
    const text37 = normalizeText(list176);
    if (!text37) return false;
    try {
      return hasStoryEpisodeSplitTransportModelOutput(JSON.parse(text37));
    } catch {
      return false;
    }
  }
  if (Array.isArray(list176))
    return list176.some((value590) => hasStoryEpisodeSplitTransportModelOutput(value590));
  if (typeof list176 !== 'object') return false;
  if (Array.isArray(list176.clips) && list176.clips.length) return true;
  const value591 = [
    list176.text,
    list176.outputText,
    list176.content,
    list176.reasoning_content,
    list176.reasoningContent,
  ]
    .map(normalizeText)
    .find(Boolean);
  if (value591) return true;
  const list177 = Array.isArray(list176.choices) ? list176.choices : [];
  if (
    list177.some((error31) =>
      hasStoryEpisodeSplitTransportModelOutput(error31?.message || error31?.delta || error31),
    )
  )
    return true;
  return [list176.data, list176.result, list176.response, list176.output].some(
    (value592) => value592 && value592 !== list176 && hasStoryEpisodeSplitTransportModelOutput(value592),
  );
}
export function recoverStoryEpisodeSplitDraftLocally({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
  draft: draft = episode?.splitDraft,
} = {}) {
  const list178 = Array.isArray(draft?.items) ? [...draft.items] : [];
  if (!list178.length) throw new Error('没有可在本地恢复的分镜结果。');
  const assets9 = Array.isArray(assets) ? assets : [],
    constraints6 = resolveStoryPlanningConstraints(project, constraints),
    episodeRef10 = normalizeStoryAssetReference(
      draft?.episodeRef || episode?.ref || episode?.planningRef || episode?.id,
      'episode-1',
    ),
    storyEpisodeDefaultSplitParseContext = createStoryEpisodeDefaultSplitParseContext({
      episodeRef: episodeRef10,
      episode: episode,
      scriptMode: normalizeStoryScriptMode(project?.scriptMode),
      constraints: constraints6,
      assets: assets9,
      promptMode: resolveStoryPromptMode(project, constraints),
    }),
    totalDurationSeconds3 = list178.sort(
      (value593, value594) =>
        Number(value593?.sourceIndex || 0) - Number(value594?.sourceIndex || 0),
    )
      .flatMap((response23) => {
        if (response23?.status === 'valid' && Array.isArray(response23?.clips))
          return response23.clips;
        const clips6 = (Array.isArray(response23?.rawClips) ? response23.rawClips : []).map(
          (args45, value595) =>
            normalizeText(args45?.ref)
              ? args45
              : {
                  ...args45,
                  ref: normalizeStoryAssetReference(
                    response23?.sourceClipRef,
                    'clip-' + (Number(response23?.sourceIndex || 0) + value595 + 1),
                  ),
                },
        );
        if (!clips6.length) return [];
        const storyEpisodeSplitDraft = normalizeStoryEpisodeSplitDraft(
            { episodeRef: episodeRef10, clips: clips6 },
            storyEpisodeDefaultSplitParseContext,
          ),
          finalizeStoryEpisodeSplitDraft2 = finalizeStoryEpisodeSplitDraft(storyEpisodeSplitDraft);
        if (finalizeStoryEpisodeSplitDraft2) return finalizeStoryEpisodeSplitDraft2.clips;
        throwStoryEpisodeSplitPartialResult(storyEpisodeSplitDraft);
      })
      .map((args46, value596) => ({ ...args46, title: formatStoryEpisodeClipTitle(value596) }));
  if (!totalDurationSeconds3.length) throw new Error('保存的分镜结果中没有可恢复片段。');
  const list179 = totalDurationSeconds3.map((value597) => value597.ref);
  if (new Set(list179).size !== list179.length) throw new Error('保存的分镜结果包含重复片段引用。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    episodeRef: episodeRef10,
    totalDurationSeconds: totalDurationSeconds3.reduce(
      (value598, value599) => value598 + value599.durationSec,
      0,
    ),
    clips: totalDurationSeconds3,
  };
}
function getStoryEpisodesSplitResponseEntries(value600) {
  const list180 = [value600],
    map37 = new Set();
  while (list180.length) {
    const enabled23 = list180.shift();
    if (Array.isArray(enabled23)) return enabled23;
    if (!enabled23 || typeof enabled23 !== 'object' || map37.has(enabled23)) continue;
    map37.add(enabled23);
    for (const value601 of ['episodes', 'results', 'items']) {
      if (Array.isArray(enabled23[value601])) return enabled23[value601];
    }
    if (Array.isArray(enabled23.clips)) return [enabled23];
    for (const value602 of ['result', 'data', 'output', 'response']) {
      if (enabled23[value602] && typeof enabled23[value602] === 'object')
        list180.push(enabled23[value602]);
    }
  }
  return [];
}
function getStoryEpisodesSplitEntryRef(options28 = {}) {
  return normalizeStoryAssetReference(
    options28?.episodeRef ||
      options28?.episode_ref ||
      options28?.ref ||
      options28?.id ||
      options28?.episode?.ref ||
      options28?.episode?.id,
    '',
  );
}
function parseStoryEpisodesSplitEntry({
  entry: entry = {},
  episode: episode = {},
  scriptMode: scriptMode = '',
  assets: assets = [],
  constraints: constraints = {},
  clipDurationConstraints: clipDurationConstraints = null,
  promptMode: promptMode = 'seedance-2.0',
} = {}) {
  const episodeRef11 = getStoryEpisodeReferenceAliases(episode)[0] || 'episode-1',
    clips7 = Array.isArray(entry?.clips)
      ? entry.clips
      : Array.isArray(entry?.segments)
        ? entry.segments
        : [];
  if (!clips7.length) throw new Error('Agent 返回结果没有可用镜头。');
  const expandStoryEpisodeSplitCompactData2 = expandStoryEpisodeSplitCompactData(
      { ...entry, episodeRef: episodeRef11, clips: clips7 },
      { episodeRef: episodeRef11, episode: episode, assets: assets },
    ),
    rawResponse2 = JSON.stringify(entry),
    value603 = {
      ...normalizeStoryEpisodeSplitDraft(
        { text: JSON.stringify(expandStoryEpisodeSplitCompactData2) },
        createStoryEpisodeDefaultSplitParseContext({
          episodeRef: episodeRef11,
          episode: episode,
          scriptMode: scriptMode,
          constraints: constraints,
          assets: assets,
          clipDurationConstraints: clipDurationConstraints,
          promptMode: promptMode,
        }),
      ),
      rawResponse: rawResponse2,
    },
    finalizeStoryEpisodeSplitDraft3 = finalizeStoryEpisodeSplitDraft(value603);
  if (finalizeStoryEpisodeSplitDraft3)
    return assertStoryEpisodeSplitTiming(finalizeStoryEpisodeSplitDraft3, episode);
  throwStoryEpisodeSplitPartialResult(value603);
}
async function splitStoryEpisodesCombinedRequest({
  project: project = {},
  episodes: episodes = [],
  assets: assets = [],
  constraints: constraints = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  request: request = generateText,
  onProgress: onProgress = null,
  diagnostics: diagnostics = null,
  clipDurationConstraints: clipDurationConstraints = null,
} = {}) {
  assertPlanningModel(model, provider);
  const episodes4 = Array.isArray(episodes) ? episodes.filter(Boolean) : [];
  if (!episodes4.length) throw new Error('没有可生成分镜的分集。');
  const constraints7 = resolveStoryPlanningConstraints(project, constraints),
    promptMode5 = resolveStoryPromptMode(project, constraints),
    clipDurationConstraints2 = normalizeStoryEpisodeClipDurationConstraints(clipDurationConstraints),
    prompt8 = buildStoryEpisodesSplitPrompt({
      project: project,
      episodes: episodes4,
      assets: assets,
      constraints: { ...constraints7, promptMode: promptMode5 },
      clipDurationConstraints: clipDurationConstraints2,
    }),
    systemPrompt2 = {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: prompt8,
      systemPrompt: getStoryEpisodeSplitRequestSystemPrompt({ compactPrompt: true, promptMode: promptMode5 }),
      thinking: { type: 'disabled' },
      temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
      maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
      timeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
    };
  (onProgress?.({
    stage: 'splitting-episodes',
    current: 1,
    total: 2,
    message: '正在一次生成 ' + episodes4.length + ' 集分镜',
  }),
    reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
      phase: 'batch-generation',
      prompt: prompt8,
      systemPrompt: systemPrompt2.systemPrompt,
      automaticCallLimit: 2,
      details: {
        status: 'started',
        requestIndex: 1,
        requestCount: 2,
        episodeCount: episodes4.length,
        outputTokenLimitMode: 'provider-default',
        requestTimeoutMode: 'provider-default',
        assetDetailsIncluded: false,
      },
    }));
  const value604 = Date.now();
  let request4;
  try {
    request4 = await request(systemPrompt2);
    const responseCharacters2 = getStoryEpisodeSplitSerializedMetrics(getResultText(request4));
    reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
      phase: 'batch-generation',
      prompt: prompt8,
      systemPrompt: systemPrompt2.systemPrompt,
      automaticCallLimit: 2,
      details: {
        status: 'succeeded',
        requestIndex: 1,
        requestCount: 2,
        episodeCount: episodes4.length,
        elapsedMs: Math.max(0, Date.now() - value604),
        responseCharacters: responseCharacters2.characters,
        responseBytes: responseCharacters2.bytes,
        ...getStoryEpisodeSplitResponseTiming(request4),
      },
    });
  } catch (error32) {
    (reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
      phase: 'batch-generation',
      prompt: prompt8,
      systemPrompt: systemPrompt2.systemPrompt,
      automaticCallLimit: 2,
      details: {
        status: 'failed',
        requestIndex: 1,
        requestCount: 2,
        episodeCount: episodes4.length,
        elapsedMs: Math.max(0, Date.now() - value604),
        errorType: normalizeText(error32?.type || error32?.name),
        errorMessage: normalizeText(error32?.message || error32),
      },
    }),
      (error32.message =
        (normalizeText(error32?.message) || '批量分镜生成请求失败。') +
        '（生成请求失败，未执行结果检查。）'));
    if (hasStoryEpisodeSplitTransportModelOutput(error32?.raw)) {
      const episodeRef12 = getStoryEpisodeReferenceAliases(episodes4[0])[0] || 'episode-1';
      error32.partialResults = [
        createStoryEpisodeSplitRawResponsePartialResult({
          episodeRef: episodeRef12,
          rawResponse: serializeStoryEpisodeSplitTransportRaw(error32),
          attempts: 1,
          error: error32,
        }),
      ];
    }
    throw error32;
  }
  const result2 = getResultText(request4),
    episodeRefs3 = episodes4.map(
      (value605, value606) => getStoryEpisodeReferenceAliases(value605)[0] || 'episode-' + (value606 + 1),
    ),
    prompt9 = buildStoryEpisodesSplitValidationPrompt({
      episodeRefs: episodeRefs3,
      result: result2,
      promptMode: promptMode5,
    }),
    value607 = {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: prompt9,
      systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
      temperature: 0.1,
    };
  (onProgress?.({
    stage: 'validating-episodes',
    current: 2,
    total: 2,
    message: '正在检查并修复分镜返回格式',
  }),
    reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
      phase: 'batch-validation',
      prompt: prompt9,
      systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
      automaticCallLimit: 2,
      details: {
        status: 'started',
        requestIndex: 2,
        requestCount: 2,
        episodeCount: episodes4.length,
        outputTokenLimitMode: 'provider-default',
        requestTimeoutMode: 'provider-default',
        includesOriginalScripts: false,
      },
    }));
  const value608 = Date.now();
  let attempts3 = null,
    value609 = null;
  try {
    attempts3 = await request(value607);
    const responseCharacters3 = getStoryEpisodeSplitSerializedMetrics(getResultText(attempts3));
    reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
      phase: 'batch-validation',
      prompt: prompt9,
      systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
      automaticCallLimit: 2,
      details: {
        status: 'succeeded',
        requestIndex: 2,
        requestCount: 2,
        episodeCount: episodes4.length,
        elapsedMs: Math.max(0, Date.now() - value608),
        responseCharacters: responseCharacters3.characters,
        responseBytes: responseCharacters3.bytes,
        ...getStoryEpisodeSplitResponseTiming(attempts3),
      },
    });
  } catch (error33) {
    ((value609 = error33),
      reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
        phase: 'batch-validation',
        prompt: prompt9,
        systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
        automaticCallLimit: 2,
        details: {
          status: 'failed',
          requestIndex: 2,
          requestCount: 2,
          episodeCount: episodes4.length,
          elapsedMs: Math.max(0, Date.now() - value608),
          errorType: normalizeText(error33?.type || error33?.name),
          errorMessage: normalizeText(error33?.message || error33),
        },
      }));
  }
  const rawResponse3 = attempts3
      ? getResultText(attempts3)
      : hasStoryEpisodeSplitTransportModelOutput(value609?.raw)
        ? serializeStoryEpisodeSplitTransportRaw(value609)
        : '',
    value610 = [
      ...(normalizeText(rawResponse3) ? [{ phase: 'validation', rawResponse: rawResponse3 }] : []),
      { phase: 'generation', rawResponse: result2 },
    ];
  let list181 = [],
    rawResponse4 = '',
    value611 = null;
  for (const value612 of value610) {
    try {
      const list182 = getStoryEpisodesSplitResponseEntries(
        parseStrictJson(value612.rawResponse, 'Agent 未返回批量分镜结果。'),
      );
      if (!list182.length) throw new Error('Agent 返回结果没有可用分集。');
      ((list181 = list182), (rawResponse4 = value612.rawResponse));
      break;
    } catch (value613) {
      value611 = value613;
    }
  }
  if (!list181.length) {
    const error34 = value611 || value609 || new Error('批量分镜返回无法解析。'),
      episodeRef13 = getStoryEpisodeReferenceAliases(episodes4[0])[0] || 'episode-1',
      rawResponse5 = [
        '首次生成返回：',
        result2,
        ...(normalizeText(rawResponse3) ? ['', '检查修复返回：', rawResponse3] : []),
      ].join('\n');
    ((error34.partialResults = [
      createStoryEpisodeSplitRawResponsePartialResult({
        episodeRef: episodeRef13,
        rawResponse: rawResponse5,
        attempts: attempts3 || value609 ? 2 : 1,
        error: error34,
      }),
    ]),
      (error34.message =
        (normalizeText(error34?.message) || '批量分镜返回无法解析。') +
        '（生成和检查结果均无法解析，已保存原始返回；未发起第三次请求。）'));
    throw error34;
  }
  const map38 = new Set(list181.map((value614, value615) => value615)),
    items3 = episodes4.map((episode3, value616) => {
      const map39 = new Set(getStoryEpisodeReferenceAliases(episode3));
      let count19 = list181.findIndex(
        (value617, value618) =>
          map38.has(value618) && map39.has(getStoryEpisodesSplitEntryRef(value617)),
      );
      if (count19 < 0 && map38.has(value616)) count19 = value616;
      if (count19 < 0) count19 = [...map38][0] ?? -1;
      const episodeRef14 = getStoryEpisodeReferenceAliases(episode3)[0] || 'episode-' + (value616 + 1);
      if (count19 < 0)
        return {
          episodeRef: episodeRef14,
          status: 'rejected',
          error: new Error('Agent 未返回该分集的分镜结果。'),
        };
      map38.delete(count19);
      const entry2 = list181[count19],
        assets10 = selectStoryEpisodeSplitAssets(assets, episode3);
      try {
        return {
          episodeRef: episodeRef14,
          status: 'fulfilled',
          result: parseStoryEpisodesSplitEntry({
            entry: entry2,
            episode: episode3,
            scriptMode: normalizeStoryScriptMode(project?.scriptMode),
            assets: assets10,
            constraints: constraints7,
            clipDurationConstraints: clipDurationConstraints2,
            promptMode: promptMode5,
          }),
        };
      } catch (error35) {
        return {
          episodeRef: episodeRef14,
          status: 'rejected',
          error: error35,
          partialResult:
            error35?.partialResult ||
            createStoryEpisodeSplitRawResponsePartialResult({
              episodeRef: episodeRef14,
              rawResponse: JSON.stringify(entry2),
              attempts: 1,
              error: error35,
            }),
        };
      }
    });
  return { rawResponse: rawResponse4, items: items3 };
}
export function splitStoryEpisodeChecked(args47 = {}) {
  return splitStoryEpisode({ ...args47, compactPrompt: true, skipRequestQueue: true });
}
export async function splitStoryEpisodesBatch({
  episodes: episodes = [],
  onProgress: onProgress = null,
  ...args48
} = {}) {
  const episodeCount3 = Array.isArray(episodes) ? episodes.filter(Boolean) : [];
  if (!episodeCount3.length) throw new Error('没有可生成分镜的分集。');
  const items4 = await Promise.all(
    episodeCount3.map(async (episode4, episodeIndex) => {
      const episodeRef15 =
        getStoryEpisodeReferenceAliases(episode4)[0] || 'episode-' + (episodeIndex + 1);
      try {
        const result3 = await splitStoryEpisodeChecked({
          ...args48,
          episode: episode4,
          onInvocation: (args49) =>
            args48.onInvocation?.({ ...args49, episodeRef: episodeRef15, episodeIndex: episodeIndex }),
          onProgress: (args50 = {}) =>
            onProgress?.({
              ...args50,
              episodeRef: episodeRef15,
              episodeIndex: episodeIndex,
              episodeCount: episodeCount3.length,
            }),
        });
        return { episodeRef: episodeRef15, status: 'fulfilled', result: result3 };
      } catch (error36) {
        return {
          episodeRef: episodeRef15,
          status: 'rejected',
          error: error36,
          ...(error36?.partialResult ? { partialResult: error36.partialResult } : {}),
        };
      }
    }),
  );
  return { items: items4 };
}
export async function splitStoryEpisode({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  request: request = generateText,
  onProgress: onProgress = null,
  repairDraft: repairDraft = null,
  diagnostics: diagnostics = null,
  clipDurationConstraints: clipDurationConstraints = null,
  compactPrompt: compactPrompt = false,
  skipRequestQueue: skipRequestQueue = false,
  onInvocation: onInvocation = null,
} = {}) {
  assertPlanningModel(model, provider);
  const assets11 = selectStoryEpisodeSplitAssets(assets, episode),
    constraints8 = resolveStoryPlanningConstraints(project, constraints),
    promptMode6 = resolveStoryPromptMode(project, constraints),
    clipDurationConstraints3 = normalizeStoryEpisodeClipDurationConstraints(clipDurationConstraints),
    episodeRef16 = normalizeStoryAssetReference(
      episode?.ref || episode?.planningRef || episode?.id,
      'episode-1',
    ),
    list183 = [episode],
    total3 = list183.length,
    maxOutputTokens2 = STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
    systemPrompt3 = episode.replication?.sourceAnalysis
      ? getReplicationGenerationSystemPrompt()
      : [
          getStoryEpisodeSplitRequestSystemPrompt({ compactPrompt: compactPrompt, promptMode: promptMode6 }),
          buildVideoReplicationTimingGuidance(episode),
        ]
          .filter(Boolean)
          .join('\n'),
    storyEpisodeDefaultSplitParseContext2 = createStoryEpisodeDefaultSplitParseContext({
      episodeRef: episodeRef16,
      episode: episode,
      scriptMode: normalizeStoryScriptMode(project?.scriptMode),
      constraints: constraints8,
      assets: assets11,
      clipDurationConstraints: clipDurationConstraints3,
      promptMode: promptMode6,
    }),
    rawResponse6 = [];
  for (let current3 = 0; current3 < total3; current3 += 1) {
    const episode5 = list183[current3],
      assets12 = selectStoryEpisodeSplitAssets(assets11, episode5);
    onProgress?.({
      stage: 'splitting-episode',
      current: current3 + 1,
      total: total3,
      message: repairDraft ? '正在重新生成整集分镜' : '正在生成分镜脚本',
    });
    const prompt10 = (compactPrompt ? buildStoryEpisodeMinimalSplitPrompt : buildStoryEpisodeSplitPrompt)({
        project: project,
        episode: episode5,
        assets: assets12,
        constraints: { ...constraints8, promptMode: promptMode6 },
        clipDurationConstraints: clipDurationConstraints3,
      }),
      requestPayload4 = {
        model: normalizeText(model),
        provider: normalizeText(provider),
        ...buildStoryTextProviderProfilePayload(providerProfileId),
        prompt: prompt10,
        systemPrompt: systemPrompt3,
        ...(episode.replication?.sourceAnalysis
          ? {
              structuredOutput: createReplicationSplitOutput({
                assets: assets12,
                promptMode: promptMode6,
                segmentPlan: episode5.replication?.segmentPlan,
              }),
            }
          : {}),
        thinking: { type: 'disabled' },
        temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
        maxOutputTokens: maxOutputTokens2,
        timeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
      },
      value619 = Date.now();
    reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
      phase: repairDraft ? 'manual-regeneration' : 'full-generation',
      prompt: prompt10,
      systemPrompt: systemPrompt3,
      automaticCallLimit: total3,
      details: {
        status: 'queued',
        requestIndex: current3 + 1,
        requestCount: total3,
        outputTokenLimitMode: 'explicit',
        maxOutputTokens: maxOutputTokens2,
        requestTimeoutMode: 'bounded',
        requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
        assetCount: assets11.length,
        includesAdjacentEpisodes: false,
        blueprintRequestCount: 0,
      },
    });
    let response24;
    try {
      const run3 = async () => {
        const value620 = Date.now(),
          queueWaitMs = Math.max(0, value620 - value619);
        reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
          phase: repairDraft ? 'manual-regeneration' : 'full-generation',
          prompt: prompt10,
          systemPrompt: systemPrompt3,
          automaticCallLimit: total3,
          details: {
            status: 'started',
            requestIndex: current3 + 1,
            requestCount: total3,
            queueWaitMs: queueWaitMs,
            maxOutputTokens: maxOutputTokens2,
            requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
          },
        });
        try {
          const invokeStoryGenerationRequest2 = await invokeStoryGenerationRequest({
              request: request,
              requestPayload: requestPayload4,
              stepId: repairDraft ? 'manual-regeneration' : 'generation',
              attempt: current3 + 1,
              onInvocation: onInvocation,
              serializeResponse: getResultText,
            }),
            responseCharacters4 = getStoryEpisodeSplitSerializedMetrics(
              getResultText(invokeStoryGenerationRequest2),
            );
          return (
            reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
              phase: repairDraft ? 'manual-regeneration' : 'full-generation',
              prompt: prompt10,
              systemPrompt: systemPrompt3,
              automaticCallLimit: total3,
              details: {
                status: 'succeeded',
                requestIndex: current3 + 1,
                requestCount: total3,
                queueWaitMs: queueWaitMs,
                elapsedMs: Math.max(0, Date.now() - value620),
                responseCharacters: responseCharacters4.characters,
                responseBytes: responseCharacters4.bytes,
                ...getStoryEpisodeSplitResponseTiming(invokeStoryGenerationRequest2),
                maxOutputTokens: maxOutputTokens2,
                requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
              },
            }),
            episode.replication?.sourceAnalysis
              ? completeReplicationMissingClips(
                  invokeStoryGenerationRequest2,
                  requestPayload4,
                  (requestPayload5) =>
                    invokeStoryGenerationRequest({
                      request: request,
                      requestPayload: requestPayload5,
                      stepId: 'replication-missing-clips',
                      attempt: 1,
                      onInvocation: onInvocation,
                      serializeResponse: getResultText,
                    }),
                )
              : invokeStoryGenerationRequest2
          );
        } catch (error37) {
          reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
            phase: repairDraft ? 'manual-regeneration' : 'full-generation',
            prompt: prompt10,
            systemPrompt: systemPrompt3,
            automaticCallLimit: total3,
            details: {
              status: 'failed',
              requestIndex: current3 + 1,
              requestCount: total3,
              queueWaitMs: queueWaitMs,
              elapsedMs: Math.max(0, Date.now() - value620),
              errorType: normalizeText(error37?.type || error37?.name),
              errorMessage: normalizeText(error37?.message || error37),
              maxOutputTokens: maxOutputTokens2,
              requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
            },
          });
          throw error37;
        }
      };
      response24 = skipRequestQueue ? await run3() : await enqueueStoryEpisodeRequest(run3);
    } catch (error38) {
      error38.message =
        (normalizeText(error38?.message) || '分镜生成请求失败。') +
        '（未自动重试，未生成本地替代分镜。）';
      hasStoryEpisodeSplitTransportModelOutput(error38?.raw) &&
        (error38.partialResult = createStoryEpisodeSplitRawResponsePartialResult({
          episodeRef: episodeRef16,
          rawResponse: serializeStoryEpisodeSplitTransportRaw(error38),
          attempts: current3 + 1,
          error: error38,
        }));
      throw error38;
    }
    try {
      const responseData = parseStrictJson(getResultText(response24), 'Agent 未返回片段拆分结果。');
      if (!Array.isArray(responseData?.clips) || !responseData.clips.length)
        throw new Error('Agent 返回结果没有可用镜头。');
      rawResponse6.push({
        response: response24,
        requestEpisode: episode5,
        requestAssets: assets12,
        responseData: responseData,
      });
    } catch (error39) {
      ((error39.partialResult = createStoryEpisodeSplitRawResponsePartialResult({
        episodeRef: episodeRef16,
        rawResponse: getResultText(response24),
        attempts: current3 + 1,
        error: error39,
      })),
        (error39.message =
          (normalizeText(error39?.message) || '当前返回无法解析。') +
          '（已保留原始返回；未用本地内容替换，未自动重试。）'));
      throw error39;
    }
  }
  let draft2;
  try {
    const list184 = rawResponse6.flatMap(
        ({
          response: response25,
          requestEpisode: requestEpisode,
          requestAssets: requestAssets,
          responseData: responseData2,
        }) => {
          return (
            expandStoryEpisodeSplitCompactData(responseData2, {
              episodeRef: episodeRef16,
              episode: requestEpisode,
              assets: requestAssets,
            }).clips || []
          );
        },
      ),
      clips8 =
        total3 > 1
          ? list184.map((args51, value621) => ({ ...args51, ref: 'clip-' + (value621 + 1) }))
          : list184;
    draft2 = {
      ...normalizeStoryEpisodeSplitDraft(
        { text: JSON.stringify({ episodeRef: episodeRef16, clips: clips8 }) },
        storyEpisodeDefaultSplitParseContext2,
      ),
      rawResponse: rawResponse6.map(({ response: response26 }) => getResultText(response26)).join(
        '\n\n',
      ),
    };
  } catch (error40) {
    const rawResponse7 = rawResponse6.map(({ response: response27 }) => getResultText(response27)).join(
      '\n\n',
    );
    ((error40.partialResult = createStoryEpisodeSplitRawResponsePartialResult({
      episodeRef: episodeRef16,
      rawResponse: rawResponse7,
      attempts: total3,
      error: error40,
    })),
      (error40.message =
        (normalizeText(error40?.message) || 'Agent 返回格式无法解析。') +
        '（已保存本次原始返回；未自动发起第二次请求。）'));
    throw error40;
  }
  let finalizeStoryEpisodeSplitDraft4 = finalizeStoryEpisodeSplitDraft(draft2);
  if (finalizeStoryEpisodeSplitDraft4) return finalizeStoryEpisodeSplitDraft4;
  if (canRepairStoryEpisodeSplitPartialDraft(draft2)) {
    const total4 = draft2.items.filter((response28) => response28?.status !== 'valid').length,
      prompt11 = buildStoryEpisodeSplitPartialRepairPrompt({
        draft: draft2,
        episode: episode,
        assets: assets11,
        constraints: constraints8,
        schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
        clipMaxSeconds: resolveStoryPromptModeClipMaxSeconds(promptMode6, constraints8.sceneMaxSeconds),
        timingGuidance: [
          STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
          buildVideoReplicationTimingGuidance(episode),
        ]
          .filter(Boolean)
          .join('\n'),
        dialogueSpeakerGuidance: STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
        groupingGuidance: STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
        timelineRequirements: getStoryEpisodeTimelinePlanningRequirements(promptMode6),
        continuousTimeline: isStoryContinuousTimelinePromptMode(promptMode6),
      });
    (onProgress?.({
      stage: 'repairing-episode-split',
      current: 0,
      total: total4,
      message: '正在定点修复 ' + total4 + ' 个格式或校验未通过的片段',
    }),
      reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
        phase: 'targeted-repair',
        prompt: prompt11,
        systemPrompt: systemPrompt3,
        failedClipCount: total4,
        carriesFullEpisodeContext: false,
        automaticCallLimit: 1,
        details: { status: 'queued', requestIndex: 1, requestCount: 1 },
      }));
    let value622 = null;
    try {
      const run4 = () =>
        invokeStoryGenerationRequest({
          request: request,
          requestPayload: {
            model: normalizeText(model),
            provider: normalizeText(provider),
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: prompt11,
            systemPrompt: systemPrompt3,
            thinking: { type: 'disabled' },
            temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
            maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
            timeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
          },
          stepId: 'generation-repair',
          attempt: 2,
          onInvocation: onInvocation,
          serializeResponse: getResultText,
        });
      value622 = skipRequestQueue ? await run4() : await enqueueStoryEpisodeRequest(run4);
      const strictJson7 = parseStrictJson(getResultText(value622), 'Agent 未返回片段局部修复结果。');
      draft2 = applyStoryEpisodeSplitPartialRepairs(strictJson7, draft2, {
        parseReplacementClips: (clips9) =>
          parseStoryEpisodeSplitResult(
            { episodeRef: draft2.episodeRef, clips: clips9 },
            storyEpisodeDefaultSplitParseContext2,
          ).clips,
        serializeValidationError: (value623, clipIndex4) =>
          serializeStoryEpisodeSplitValidationError(value623, {
            clipIndex: clipIndex4.sourceIndex,
            clipCount: draft2.items.length,
          }),
      });
    } catch (value624) {
      draft2 = appendStoryEpisodeSplitPartialRepairFailure(draft2, value624);
    }
    const resultText4 = getResultText(value622);
    resultText4 &&
      (draft2.rawResponse = [draft2.rawResponse, '局部修复返回：', resultText4]
        .filter(Boolean)
        .join('\n\n'));
    finalizeStoryEpisodeSplitDraft4 = finalizeStoryEpisodeSplitDraft(draft2);
    if (finalizeStoryEpisodeSplitDraft4)
      return assertStoryEpisodeSplitTiming(finalizeStoryEpisodeSplitDraft4, episode);
  }
  throwStoryEpisodeSplitPartialResult(draft2);
}
const STORY_EPISODE_EXPERIMENTAL_DRAFT_STRATEGY = 'semantic-shot-batches-v3',
  STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS = 2,
  STORY_EPISODE_EXPERIMENTAL_RETRY_DELAY_MS = 600;
function cloneStoryEpisodeExperimentalValue(enabled24) {
  if (!enabled24 || typeof enabled24 !== 'object') return null;
  try {
    return JSON.parse(JSON.stringify(enabled24));
  } catch {
    return null;
  }
}
function hashStoryEpisodeExperimentalValue(value625) {
  const list185 = JSON.stringify(value625);
  let value626 = 0x811c9dc5;
  for (let value627 = 0; value627 < list185.length; value627 += 1) {
    ((value626 ^= list185.charCodeAt(value627)), (value626 = Math.imul(value626, 0x1000193)));
  }
  return (
    STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION +
    '-' +
    (value626 >>> 0).toString(16).padStart(8, '0') +
    '-' +
    list185.length
  );
}
function createStoryEpisodeExperimentalFingerprint({
  project: project = {},
  episodeRef: episodeRef = '',
  sourceBeats: sourceBeats = [],
  assets: assets = [],
  constraints: constraints = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  promptExperiment: promptExperiment = false,
  promptMode: promptMode = 'seedance-2.0',
  timingBudget: timingBudget = null,
} = {}) {
  const scriptMode7 = normalizeStoryProjectInput(project);
  return hashStoryEpisodeExperimentalValue({
    episodeRef: episodeRef,
    sourceBeats: sourceBeats,
    assets: assets,
    constraints: constraints,
    model: normalizeText(model),
    provider: normalizeText(provider),
    providerProfileId: normalizeText(providerProfileId),
    promptExperiment: promptExperiment === true,
    promptMode: normalizeText(promptMode).toLowerCase() || 'seedance-2.0',
    timingBudget: timingBudget,
    scriptMode: scriptMode7.scriptMode,
    aspectRatio: scriptMode7.aspectRatio,
    visualStyle: scriptMode7.visualStyle,
  });
}
function isStoryEpisodeExperimentalTimeout(error41) {
  const text38 = normalizeText(error41?.type).toUpperCase(),
    text39 = normalizeText(error41?.name).toLowerCase(),
    text40 = normalizeText(error41?.message).toLowerCase();
  return text38 === 'TIMEOUT' || text39 === 'aborterror' || /timeout|timed out|超时/u.test(text40);
}
function isStoryEpisodeExperimentalPromptTooLong(error42) {
  const count20 = Number(error42?.status || error42?.statusCode || 0),
    text41 = normalizeText(error42?.message).toLowerCase();
  return (
    count20 === 413 ||
    /提示词过长|prompt.{0,24}too long|context.{0,24}(length|limit)|request entity too large/u.test(text41)
  );
}
function isStoryEpisodeExperimentalBatchShrinkable(value628) {
  return isStoryEpisodeExperimentalTimeout(value628) || isStoryEpisodeExperimentalPromptTooLong(value628);
}
function isStoryEpisodeExperimentalRetryable(response29) {
  const count21 = Number(response29?.status || response29?.statusCode || 0);
  return (
    response29?.retryable === true ||
    isStoryEpisodeExperimentalTimeout(response29) ||
    count21 === 429 ||
    count21 >= 500
  );
}
function waitForStoryEpisodeExperimentalRetry(value629) {
  return new Promise((value630) => setTimeout(value630, value629));
}
async function settleStoryEpisodeExperimentalBatches(
  list186 = [],
  handler10,
  value631 = STORY_EPISODE_EXPERIMENTAL_MAX_CONCURRENT_BATCHES,
) {
  const list187 = Array.isArray(list186) ? list186 : [],
    value632 = new Array(list187.length);
  let value633 = 0;
  const length3 = Math.min(list187.length, Math.max(1, Math.trunc(Number(value631) || 1))),
    value634 = Array.from({ length: length3 }, async () => {
      while (value633 < list187.length) {
        const value635 = value633;
        value633 += 1;
        try {
          value632[value635] = {
            status: 'fulfilled',
            value: await handler10(list187[value635], value635),
          };
        } catch (reason) {
          value632[value635] = { status: 'rejected', reason: reason };
        }
      }
    });
  return (await Promise.all(value634), value632);
}
async function requestStoryEpisodeExperimentalWithRetry(
  handler11,
  {
    maxAttempts: maxAttempts = STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS,
    retryWait: retryWait = waitForStoryEpisodeExperimentalRetry,
    splitOversizedBatch: splitOversizedBatch = false,
  } = {},
) {
  const value636 = Math.max(1, Math.trunc(Number(maxAttempts) || 1));
  let value637 = null;
  for (let value638 = 1; value638 <= value636; value638 += 1) {
    try {
      return await handler11(value638, value637);
    } catch (value639) {
      if (splitOversizedBatch && isStoryEpisodeExperimentalBatchShrinkable(value639)) throw value639;
      if (!isStoryEpisodeExperimentalRetryable(value639) || value638 >= value636) throw value639;
      ((value637 = value639),
        await retryWait(
          STORY_EPISODE_EXPERIMENTAL_RETRY_DELAY_MS * 2 ** (value638 - 1),
          value639,
          value638,
        ));
    }
  }
  throw new Error('实验分批请求重试失败。');
}
function restoreStoryEpisodeExperimentalDraft(
  value640,
  {
    episodeRef: episodeRef = '',
    sourceFingerprint: sourceFingerprint = '',
    sourceScenes: sourceScenes = [],
    sourceBeats: sourceBeats = [],
    assets: assets = [],
    constraints: constraints = {},
    promptExperiment: promptExperiment = false,
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const args52 = cloneStoryEpisodeExperimentalValue(value640);
  if (
    !args52 ||
    args52.strategy !== STORY_EPISODE_EXPERIMENTAL_DRAFT_STRATEGY ||
    args52.schemaVersion !== STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION ||
    normalizeText(args52.episodeRef) !== episodeRef ||
    normalizeText(args52.sourceFingerprint) !== sourceFingerprint
  )
    return null;
  try {
    const blueprint2 = parseStoryEpisodeSplitBlueprint(args52.blueprint, {
        episodeRef: episodeRef,
        sourceScenes: sourceScenes,
        sourceBeats: sourceBeats,
        assets: assets,
        constraints: constraints,
        enforceMaxDuration: false,
        includeDirectorContinuity: promptExperiment === true,
      }),
      map40 = new Map(
        blueprint2.clipPlans.map((value641) => [normalizeText(value641?.ref), value641]),
      ),
      list188 = Array.isArray(args52.completedClips) ? args52.completedClips : [],
      list189 = Array.isArray(args52.completedPlanResults)
        ? args52.completedPlanResults
        : list188.filter((value642) => map40.has(normalizeText(value642?.ref))).map(
            (value643) => ({ sourcePlanRef: normalizeText(value643?.ref), clips: [value643] }),
          ),
      map41 = new Map(list189.map((value644) => [normalizeText(value644?.sourcePlanRef), value644]));
    if (
      map41.size !== list189.length ||
      list189.some((value645) => !map40.has(normalizeText(value645?.sourcePlanRef)))
    )
      return null;
    const completedPlanResults2 = [],
      map42 = new Set();
    blueprint2.clipPlans.forEach((sourcePlanRef) => {
      const enabled25 = map41.get(sourcePlanRef.ref);
      if (!enabled25) return;
      const clips10 = parseStoryEpisodeSplitResult(
        { episodeRef: episodeRef, clips: Array.isArray(enabled25.clips) ? enabled25.clips : [] },
        {
          episodeRef: episodeRef,
          constraints: constraints,
          assets: assets,
          clipPlans: [sourcePlanRef],
          minimumShotsPerClip: 1,
          maximumShotsPerClip: STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP,
          enforceMaxDuration: false,
          repairMissingShotFields: true,
          allowEmptyAudio: true,
          requireAllPlanCharacters: false,
          completePlanSceneUsage: true,
          includeCutAfter: true,
          promptMode: promptMode,
        },
      );
      if (clips10.clips.some((value646) => map42.has(value646.ref)))
        throw new Error('实验分批断点包含重复的片段引用。');
      (clips10.clips.forEach((value647) => map42.add(value647.ref)),
        completedPlanResults2.push({ sourcePlanRef: sourcePlanRef.ref, clips: clips10.clips }));
    });
    const map43 = new Set(completedPlanResults2.map((value648) => value648.sourcePlanRef)),
      completedClips = completedPlanResults2.flatMap((value649) => value649.clips);
    return {
      ...args52,
      blueprint: blueprint2,
      completedPlanResults: completedPlanResults2,
      completedClips: completedClips,
      failedBatchRefs: normalizeStringArray(args52.failedBatchRefs).filter(
        (value650) => !map43.has(value650) && map40.has(value650),
      ),
      attempts: Math.max(0, Math.trunc(Number(args52.attempts) || 0)),
    };
  } catch {
    return null;
  }
}
async function saveStoryEpisodeExperimentalCheckpoint(value651, handler12) {
  return (
    (value651.updatedAt = Date.now()),
    typeof handler12 === 'function' && (await handler12(cloneStoryEpisodeExperimentalValue(value651))),
    value651
  );
}
function createStoryEpisodeExperimentalBatchDraft(
  value652,
  {
    episodeRef: episodeRef = '',
    clipPlans: clipPlans = [],
    constraints: constraints = {},
    assets: assets = [],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const args53 = normalizeStoryEpisodeSplitDraft(value652, {
      episodeRef: episodeRef,
      constraints: constraints,
      assets: assets,
      clipPlans: clipPlans,
      minimumShotsPerClip: 1,
      maximumShotsPerClip: STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP,
      enforceMaxDuration: false,
      repairMissingShotFields: true,
      allowEmptyAudio: true,
      requireAllPlanCharacters: false,
      completePlanSceneUsage: true,
      includeCutAfter: true,
      promptMode: promptMode,
    }),
    sourceIndex3 = clipPlans.map((value653) => normalizeText(value653?.ref)),
    map44 = new Set(sourceIndex3),
    map45 = new Map();
  args53.items.forEach((value654) => {
    const sourceClipRef = normalizeText(value654?.sourceClipRef);
    if (!sourceClipRef || !map44.has(sourceClipRef)) return;
    if (map45.has(sourceClipRef)) {
      map45.set(sourceClipRef, {
        status: 'invalid',
        sourceIndex: sourceIndex3.indexOf(sourceClipRef),
        sourceClipRef: sourceClipRef,
        rawClips: [],
        error: { message: 'Agent 重复返回了计划“' + sourceClipRef + '”。' },
      });
      return;
    }
    map45.set(sourceClipRef, value654);
  });
  const items5 = sourceIndex3.map((sourceClipRef2, sourceIndex4) => {
    const args54 = map45.get(sourceClipRef2);
    if (args54) return { ...args54, sourceIndex: sourceIndex4, sourceClipRef: sourceClipRef2 };
    return {
      status: 'invalid',
      sourceIndex: sourceIndex4,
      sourceClipRef: sourceClipRef2,
      rawClips: [],
      error: { message: 'Agent 未完整返回计划“' + sourceClipRef2 + '”。' },
    };
  });
  return { ...args53, items: items5 };
}
function finalizeStoryEpisodeExperimentalBatchDraft(planResults = {}) {
  const args55 = finalizeStoryEpisodeSplitDraft(planResults);
  if (!args55) return null;
  return {
    ...args55,
    planResults: planResults.items.map((sourcePlanRef2) => ({
      sourcePlanRef: sourcePlanRef2.sourceClipRef,
      clips: sourcePlanRef2.clips,
    })),
  };
}
function assertStoryEpisodeExperimentalPlanTiming(options29 = {}, value655 = []) {
  const map46 = new Map(
      (Array.isArray(options29?.planResults) ? options29.planResults : []).map((value656) => [
        normalizeText(value656?.sourcePlanRef),
        value656,
      ]),
    ),
    list190 = (Array.isArray(value655) ? value655 : []).flatMap((value657) => {
      const planRef = normalizeText(value657?.ref),
        targetDurationSec2 = normalizePositiveNumber(value657?.targetDurationSec),
        enabled26 = map46.get(planRef);
      if (!planRef || !targetDurationSec2 || !enabled26) return [];
      const totalDurationSeconds4 = (Array.isArray(enabled26?.clips) ? enabled26.clips : []).reduce(
          (value658, value659) => value658 + (normalizePositiveNumber(value659?.durationSec) || 0),
          0,
        ),
        minimum = Number((targetDurationSec2 * 0.8).toFixed(1)),
        maximum4 = Number((targetDurationSec2 * 1.2).toFixed(1));
      if (totalDurationSeconds4 >= minimum && totalDurationSeconds4 <= maximum4) return [];
      return [
        {
          planRef: planRef,
          totalDurationSeconds: totalDurationSeconds4,
          targetDurationSec: targetDurationSec2,
          minimum: minimum,
          maximum: maximum4,
        },
      ];
    });
  if (!list190.length) return options29;
  const value660 = list190.slice(0, 4)
      .map(
        (value661) =>
          '计划“' +
          value661.planRef +
          '”分镜合计 ' +
          value661.totalDurationSeconds +
          ' 秒，审时预算 ' +
          value661.targetDurationSec +
          ' 秒（允许 ' +
          value661.minimum +
          '-' +
          value661.maximum +
          ' 秒）',
      )
      .join('；'),
    error43 = new Error('实验分批时长自检未通过：' + value660 + '。');
  ((error43.code = 'STORY_EPISODE_EXPERIMENTAL_PLAN_TIMING_MISMATCH'),
    (error43.retryable = true),
    (error43.timingMismatches = list190));
  throw error43;
}
async function requestStoryEpisodeExperimentalBatchResult({
  request: request5,
  requestPayload: requestPayload6,
  episodeRef: episodeRef = '',
  clipPlans: clipPlans = [],
  constraints: constraints = {},
  assets: assets = [],
  promptMode: promptMode = 'seedance-2.0',
  enforcePlanDurationTargets: enforcePlanDurationTargets = false,
} = {}) {
  const value662 = {
      episodeRef: episodeRef,
      clipPlans: clipPlans,
      constraints: constraints,
      assets: assets,
      promptMode: promptMode,
    },
    value663 = await request5(requestPayload6),
    storyEpisodeExperimentalBatchDraft = createStoryEpisodeExperimentalBatchDraft(value663, value662),
    storyEpisodeScriptFinishReason = getStoryEpisodeScriptFinishReason(value663),
    finalizeStoryEpisodeExperimentalBatchDraft2 = finalizeStoryEpisodeExperimentalBatchDraft(
      storyEpisodeExperimentalBatchDraft,
    );
  if (finalizeStoryEpisodeExperimentalBatchDraft2)
    return enforcePlanDurationTargets
      ? assertStoryEpisodeExperimentalPlanTiming(finalizeStoryEpisodeExperimentalBatchDraft2, clipPlans)
      : finalizeStoryEpisodeExperimentalBatchDraft2;
  const value664 = storyEpisodeExperimentalBatchDraft.items
      .filter((response30) => response30?.status === 'valid')
      .map((sourcePlanRef3) => ({
        sourcePlanRef: sourcePlanRef3.sourceClipRef,
        clips: sourcePlanRef3.clips,
      })),
    value665 = storyEpisodeExperimentalBatchDraft.items.find(
      (response31) => response31?.status !== 'valid',
    ),
    error44 = new Error(
      ['length', 'max_tokens', 'max_output_tokens'].includes(storyEpisodeScriptFinishReason)
        ? '实验分批输出被截断（finish reason: ' + storyEpisodeScriptFinishReason + '）。'
        : normalizeText(value665?.error?.message) || '实验分批仍有片段未通过校验。',
    );
  ['length', 'max_tokens', 'max_output_tokens'].includes(storyEpisodeScriptFinishReason) &&
    ((error44.type = 'OUTPUT_LENGTH'), (error44.finishReason = storyEpisodeScriptFinishReason));
  value665?.error?.validationDetails &&
    (error44.validationDetails = value665.error.validationDetails);
  error44.partialPlanResults = value664;
  throw error44;
}
export async function splitStoryEpisodeExperimental({
  project: project = {},
  episode: episode = {},
  previousEpisode: previousEpisode = null,
  nextEpisode: nextEpisode = null,
  assets: assets = [],
  constraints: constraints = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  promptExperiment: promptExperiment = false,
  request: request = generateText,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  onInvocation: onInvocation = null,
  resumeDraft: resumeDraft = null,
  retryWait: retryWait = waitForStoryEpisodeExperimentalRetry,
  diagnostics: diagnostics = null,
} = {}) {
  assertPlanningModel(model, provider);
  const model3 = normalizeText(model),
    provider3 = normalizeText(provider),
    assets13 = selectStoryEpisodeSplitAssets(assets, episode),
    assets14 = [
      ...new Map(
        (Array.isArray(assets) ? assets : [])
          .map((value666, value667) => normalizePlanningAssetSummary(value666, value667))
          .filter((error45) => error45.name)
          .map((value668) => [value668.ref, value668]),
      ).values(),
    ],
    constraints9 = resolveStoryPlanningConstraints(project, constraints),
    promptMode7 = resolveStoryPromptMode(project, constraints),
    sourceScenes3 = normalizeStoryEpisodeSplitSourceScenes(episode),
    sourceBeats4 = normalizeStoryEpisodeExperimentalSourceBeats(episode),
    episodeRefs4 = getStoryEpisodeReferenceAliases(episode);
  assertStoryEpisodeSceneAssetCoverage(sourceScenes3, assets13, { episodeRefs: episodeRefs4 });
  const episodeRef17 = normalizeStoryAssetReference(
      episode?.ref || episode?.planningRef || episode?.id,
      'episode-1',
    ),
    timingBudget3 = resolveStoryEpisodeSplitTimingBudget(episode),
    sourceFingerprint2 = createStoryEpisodeExperimentalFingerprint({
      project: project,
      episodeRef: episodeRef17,
      sourceBeats: sourceBeats4,
      assets: assets13,
      constraints: constraints9,
      model: model3,
      provider: provider3,
      providerProfileId: providerProfileId,
      promptExperiment: promptExperiment === true,
      promptMode: promptMode7,
      timingBudget: timingBudget3,
    }),
    runId2 = 'episode-split-' + Date.now().toString(36) + '-' + sourceFingerprint2.slice(-12);
  let value669 = 0,
    attempt5 = 0;
  const run5 = (request6, requestPayload7, stepId2) => {
      return (
        (attempt5 += 1),
        invokeStoryGenerationRequest({
          request: request6,
          requestPayload: requestPayload7,
          allowTruncatedOutput: true,
          stepId: stepId2,
          attempt: attempt5,
          onInvocation: onInvocation,
          serializeResponse: getResultText,
        })
      );
    },
    nextRequestSequence2 = () => {
      return ((value669 += 1), value669);
    },
    args56 = {
      projectId: normalizeText(project?.id),
      episodeId: normalizeText(episode?.id),
      episodeRef: episodeRef17,
      episodeNumber: Math.max(1, Math.trunc(Number(episode?.number) || 1)),
      sourceBeatCount: sourceBeats4.length,
      selectedAssetCount: assets13.length,
      resumed: Boolean(resumeDraft),
    };
  let completedClipCount = restoreStoryEpisodeExperimentalDraft(resumeDraft, {
      episodeRef: episodeRef17,
      sourceFingerprint: sourceFingerprint2,
      sourceScenes: sourceScenes3,
      sourceBeats: sourceBeats4,
      assets: assets14,
      constraints: constraints9,
      promptExperiment: promptExperiment === true,
      promptMode: promptMode7,
    }),
    blueprint3 = completedClipCount?.blueprint
      ? reconcileStoryEpisodeSplitBlueprintTiming(completedClipCount.blueprint, episode)
      : null;
  if (completedClipCount && blueprint3) completedClipCount.blueprint = blueprint3;
  if (!blueprint3) {
    onProgress?.({
      stage: 'planning-episode-split-blueprint',
      current: 1,
      total: 1,
      message: '正在规划整集分镜蓝图',
    });
    const prompt12 = buildStoryEpisodeSplitBlueprintPrompt({
        project: project,
        episode: episode,
        previousEpisode: previousEpisode,
        nextEpisode: nextEpisode,
        assets: assets13,
        constraints: constraints9,
        enforceMaxDuration: false,
        sourceBeatsOverride: sourceBeats4,
        promptExperiment: promptExperiment === true,
        promptMode: promptMode7,
      }),
      value670 = JSON.parse(prompt12),
      storyEpisodeExperimentalDiagnosticRequest = createStoryEpisodeExperimentalDiagnosticRequest({
        request: request,
        diagnostics: diagnostics,
        runId: runId2,
        phase: 'experimental-blueprint',
        nextRequestSequence: nextRequestSequence2,
        carriesFullEpisodeContext: true,
        context: {
          ...args56,
          promptSectionCharacters: getStoryEpisodeExperimentalPromptSectionCharacters(value670),
        },
      });
    ((blueprint3 = await requestStoryEpisodeExperimentalWithRetry(
      () =>
        requestStrictResult({
          request: (value671) =>
            run5(storyEpisodeExperimentalDiagnosticRequest, value671, 'experimental-blueprint'),
          requestPayload: {
            model: model3,
            provider: provider3,
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: prompt12,
            systemPrompt: promptExperiment
              ? STORY_EPISODE_DIRECTOR_CONTINUITY_BLUEPRINT_SYSTEM_PROMPT
              : STORY_EPISODE_BATCHED_BLUEPRINT_SYSTEM_PROMPT,
            thinking: { type: 'disabled' },
            allowOversizedPrompt: true,
            structuredOutput: createStoryEpisodeExperimentalStructuredOutput(
              'story_episode_split_blueprint_v3',
              buildStoryEpisodeSplitBlueprintResponseSchema({
                ...constraints9,
                enforceMaxDuration: false,
                includeSceneAssetRef: Object.prototype.hasOwnProperty.call(
                  value670?.outputSchema?.clipPlans?.[0] || {},
                  'sceneAssetRef',
                ),
                includeDirectorContinuity: promptExperiment === true,
              }),
            ),
            temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
            timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
          },
          parse: (value672) => {
            try {
              const finishReason2 = getStoryEpisodeScriptFinishReason(value672);
              if (['length', 'max_tokens', 'max_output_tokens'].includes(finishReason2))
                throw Object.assign(
                  new Error('实验分批蓝图输出被截断（finish reason: ' + finishReason2 + '）。'),
                  { type: 'OUTPUT_LENGTH', finishReason: finishReason2 },
                );
              return parseStoryEpisodeSplitBlueprint(value672, {
                episodeRef: episodeRef17,
                episodeRefs: episodeRefs4,
                sourceScenes: sourceScenes3,
                sourceBeats: sourceBeats4,
                assets: assets13,
                constraints: constraints9,
                enforceMaxDuration: false,
                includeDirectorContinuity: promptExperiment === true,
              });
            } catch (error46) {
              if (error46?.type === 'OUTPUT_LENGTH') throw error46;
              return (
                reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
                  phase: 'experimental-blueprint-local-fallback',
                  carriesFullEpisodeContext: false,
                  automaticCallLimit: 1,
                  details: {
                    status: 'recovered-locally',
                    countsTowardRequestTotal: false,
                    runId: runId2,
                    errorCode: normalizeText(error46?.code),
                    errorMessage: normalizeText(error46?.message || error46),
                    responsePreview: normalizeText(error46?.responsePreview),
                  },
                }),
                createLocalStoryEpisodeSplitBlueprint({
                  episodeRef: episodeRef17,
                  episodeRefs: episodeRefs4,
                  sourceScenes: sourceScenes3,
                  sourceBeats: sourceBeats4,
                  assets: assets13,
                  includeDirectorContinuity: promptExperiment === true,
                })
              );
            }
          },
          outputContract: promptExperiment
            ? 'episodeRef and ordered clipPlans[{sourceBeatRefs,beat,optional sceneAssetRef,sceneAppearanceRef,entryState,exitState,openingShotIntent,closingShotIntent,characterAssetRefs,propAssetRefs,targetDurationSec}] covering every sourceBeat exactly once; local code derives plan refs, source scenes, continuity notes, and uniquely bound scene assets'
            : 'episodeRef and ordered clipPlans[{sourceBeatRefs,beat,optional sceneAssetRef,sceneAppearanceRef,entryState,exitState,characterAssetRefs,propAssetRefs,targetDurationSec}] covering every sourceBeat exactly once; local code derives plan refs, source scenes, continuity notes, and uniquely bound scene assets',
          maxAttempts: 1,
        }),
      { retryWait: retryWait },
    )),
      (blueprint3 = reconcileStoryEpisodeSplitBlueprintTiming(blueprint3, episode)),
      (completedClipCount = {
        schemaVersion: STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION,
        strategy: STORY_EPISODE_EXPERIMENTAL_DRAFT_STRATEGY,
        episodeRef: episodeRef17,
        sourceFingerprint: sourceFingerprint2,
        status: 'expanding',
        blueprint: blueprint3,
        completedPlanResults: [],
        completedClips: [],
        failedBatchRefs: [],
        attempts: 0,
        error: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
      await saveStoryEpisodeExperimentalCheckpoint(completedClipCount, onCheckpoint));
  } else {
    const current4 = Array.isArray(completedClipCount.completedPlanResults)
      ? completedClipCount.completedPlanResults.length
      : 0;
    onProgress?.({
      stage: 'resuming-episode-split-batches',
      current: current4,
      total: blueprint3.clipPlans.length,
      message:
        '正在从断点继续，已完成 ' + current4 + '/' + blueprint3.clipPlans.length + ' 个蓝图计划',
    });
  }
  const current5 = new Map(
      (Array.isArray(completedClipCount.completedPlanResults)
        ? completedClipCount.completedPlanResults
        : []).map((value673) => [normalizeText(value673?.sourcePlanRef), value673]),
    ),
    list191 = blueprint3.clipPlans.filter((value674) => !current5.has(value674.ref)),
    batchTotal2 = createStoryEpisodeExperimentalConcurrentBatches(list191);
  let batchNumber2 = 0;
  const run6 = async (value675) => {
      (value675.planResults.forEach((value676) => {
        current5.set(value676.sourcePlanRef, value676);
      }),
        (completedClipCount.completedPlanResults = blueprint3.clipPlans
          .map((value677) => current5.get(value677.ref))
          .filter(Boolean)),
        (completedClipCount.completedClips = completedClipCount.completedPlanResults.flatMap(
          (value678) => value678.clips,
        )),
        (completedClipCount.status = 'expanding'),
        (completedClipCount.failedBatchRefs = []),
        (completedClipCount.error = ''),
        await saveStoryEpisodeExperimentalCheckpoint(completedClipCount, onCheckpoint));
    },
    handler13 = async (planBatch2, { previousError: previousError = null } = {}) => {
      ((batchNumber2 += 1),
        (completedClipCount.attempts += 1),
        onProgress?.({
          stage: 'expanding-episode-split-batch',
          current: current5.size,
          total: blueprint3.clipPlans.length,
          message:
            '正在展开 ' +
            planBatch2.length +
            ' 个蓝图计划，已完成 ' +
            current5.size +
            '/' +
            blueprint3.clipPlans.length,
        }));
      const prompt13 = buildStoryEpisodeSplitBatchPrompt({
          project: project,
          episode: episode,
          assets: assets13,
          constraints: constraints9,
          blueprint: blueprint3,
          planBatch: planBatch2,
          batchNumber: batchNumber2,
          batchTotal: batchTotal2.length,
          enforceMaxDuration: false,
          sourceBeatsOverride: sourceBeats4,
          promptExperiment: promptExperiment === true,
          promptMode: promptMode7,
          timingCorrection:
            previousError?.code === 'STORY_EPISODE_EXPERIMENTAL_PLAN_TIMING_MISMATCH'
              ? {
                  previousFailure: normalizeText(previousError?.message),
                  instruction: '重新分配原文已有动作、等待、反应与转场的镜头时长，逐项验算后返回。',
                }
              : null,
        }),
        value679 = JSON.parse(prompt13),
        assets15 = Array.isArray(value679?.assets) ? value679.assets : [],
        storyEpisodeExperimentalDiagnosticRequest2 = createStoryEpisodeExperimentalDiagnosticRequest({
          request: request,
          diagnostics: diagnostics,
          runId: runId2,
          phase: 'experimental-batch-' + batchNumber2,
          nextRequestSequence: nextRequestSequence2,
          carriesFullEpisodeContext: false,
          context: {
            ...args56,
            batchSequence: batchNumber2,
            batchClipCount: planBatch2.length,
            batchClipRefs: planBatch2.map((value680) => value680.ref),
            completedPlanCount: current5.size,
            completedClipCount: completedClipCount.completedClips.length,
            plannedClipCount: blueprint3.clipPlans.length,
            promptSectionCharacters: getStoryEpisodeExperimentalPromptSectionCharacters(value679),
          },
        });
      return await requestStoryEpisodeExperimentalBatchResult({
        request: (value681) =>
          run5(
            storyEpisodeExperimentalDiagnosticRequest2,
            value681,
            'experimental-batch:' + planBatch2.map((value682) => value682.ref).join(','),
          ),
        requestPayload: {
          model: model3,
          provider: provider3,
          ...buildStoryTextProviderProfilePayload(providerProfileId),
          prompt: prompt13,
          systemPrompt: getStoryEpisodeExperimentalExpansionSystemPrompt({
            promptExperiment: promptExperiment,
            promptMode: promptMode7,
          }),
          thinking: { type: 'disabled' },
          allowOversizedPrompt: true,
          structuredOutput: createStoryEpisodeExperimentalStructuredOutput(
            'story_episode_split_batch_v3',
            buildStoryEpisodeSplitBatchResponseSchema({
              clipCount: planBatch2.length,
              maxDurationSeconds: constraints9.sceneMaxSeconds,
              minimumShotsPerClip: 1,
              maximumShotsPerClip: STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP,
              requiredClipFields: ['ref', 'shots'],
              requiredShotFields: [
                'durationSec',
                ...(isStoryContinuousTimelinePromptMode(promptMode7) ? ['startSec', 'endSec'] : []),
                'assetRefs',
                'visual',
                'camera',
                ...(promptExperiment ? ['transitionFromPrevious'] : []),
              ],
              compactExperimental: true,
              includeDirectorContinuity: promptExperiment === true,
              includeTimeline: isStoryContinuousTimelinePromptMode(promptMode7),
            }),
          ),
          temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
          timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
          maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
        },
        episodeRef: episodeRef17,
        clipPlans: planBatch2,
        constraints: constraints9,
        assets: assets15,
        promptMode: promptMode7,
        enforcePlanDurationTargets: Boolean(timingBudget3),
      });
    },
    handler14 = async (splitOversizedBatch2) => {
      let requestStoryEpisodeExperimentalWithRetry2 = null;
      try {
        requestStoryEpisodeExperimentalWithRetry2 = await requestStoryEpisodeExperimentalWithRetry(
          (value683, previousError2) => handler13(splitOversizedBatch2, { previousError: previousError2 }),
          { retryWait: retryWait, splitOversizedBatch: splitOversizedBatch2.length > 1 },
        );
      } catch (planResults2) {
        Array.isArray(planResults2?.partialPlanResults) &&
          planResults2.partialPlanResults.length &&
          (await run6({
            planResults: planResults2.partialPlanResults,
            clips: planResults2.partialPlanResults.flatMap((value684) => value684.clips),
          }));
        if (isStoryEpisodeExperimentalBatchShrinkable(planResults2) && splitOversizedBatch2.length > 1) {
          const list192 = splitOversizedBatch2.filter((value685) => !current5.has(value685.ref)),
            value686 = Math.floor(list192.length / 2),
            list193 = list192.slice(0, value686),
            list194 = list192.slice(value686);
          onProgress?.({
            stage: 'shrinking-episode-split-batch',
            current: current5.size,
            total: blueprint3.clipPlans.length,
            message:
              '当前批次内容较多，正在缩小为 ' +
              list193.length +
              '+' +
              list194.length +
              ' 个片段继续生成',
          });
          if (list193.length) await handler14(list193);
          if (list194.length) await handler14(list194);
          return;
        }
        throw planResults2;
      }
      await run6(requestStoryEpisodeExperimentalWithRetry2);
    },
    list195 = await settleStoryEpisodeExperimentalBatches(
      batchTotal2,
      (value687) => handler14(value687),
      STORY_EPISODE_EXPERIMENTAL_MAX_CONCURRENT_BATCHES,
    ),
    value688 = list195.find((response32) => response32.status === 'rejected');
  if (value688) {
    const error47 =
      value688.reason instanceof Error
        ? value688.reason
        : new Error(normalizeText(value688.reason) || '实验分批生成失败。');
    ((completedClipCount.status = 'failed'),
      (completedClipCount.failedBatchRefs = list191.map((value689) => value689.ref).filter(
        (value690) => !current5.has(value690),
      )),
      (completedClipCount.error = normalizeText(error47?.message || error47) || '实验分批生成失败。'),
      await saveStoryEpisodeExperimentalCheckpoint(completedClipCount, onCheckpoint),
      (error47.experimentalDraft = cloneStoryEpisodeExperimentalValue(completedClipCount)));
    current5.size &&
      (error47.message =
        completedClipCount.error +
        '（已完成 ' +
        current5.size +
        '/' +
        blueprint3.clipPlans.length +
        ' 个蓝图计划，保留 ' +
        completedClipCount.completedClips.length +
        ' 个片段；再次点击实验分批可继续。）');
    throw error47;
  }
  const completedPlanResults3 = blueprint3.clipPlans
    .map((value691) => current5.get(value691.ref))
    .filter(Boolean);
  if (completedPlanResults3.length !== blueprint3.clipPlans.length)
    throw new Error('实验分批拆分未完整覆盖整集蓝图。');
  const clips11 = repackStoryEpisodeExperimentalClips({
    episodeRef: episodeRef17,
    clipPlans: blueprint3.clipPlans,
    completedPlanResults: completedPlanResults3,
    maxDurationSeconds: resolveStoryPromptModeClipMaxSeconds(promptMode7, constraints9.sceneMaxSeconds),
    minDurationSeconds: STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS,
    promptExperiment: promptExperiment === true,
    preserveSourceGroups: isStoryContinuousTimelinePromptMode(promptMode7),
  });
  return (
    (completedClipCount.status = 'completed'),
    (completedClipCount.completedPlanResults = completedPlanResults3),
    (completedClipCount.completedClips = clips11),
    (completedClipCount.failedBatchRefs = []),
    (completedClipCount.error = ''),
    await saveStoryEpisodeExperimentalCheckpoint(completedClipCount, onCheckpoint),
    assertStoryEpisodeSplitTiming({ episodeRef: episodeRef17, clips: clips11 }, episode)
  );
}
