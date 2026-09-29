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
export const STORY_GENERATION_SCHEMA_VERSION = 0x2;
export const STORY_PLANNING_SCHEMA_VERSION = 0x1;
export const STORY_EPISODE_SPLIT_SCHEMA_VERSION = 0x3;
export const STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION = 0x3;
export const STORY_EPISODE_OUTLINE_SCHEMA_VERSION = 0x2;
export const STORY_EPISODE_SCRIPT_SCHEMA_VERSION = 0x2;
export const STORY_SOURCE_CHUNK_CHARACTERS = 0x5dc0;
export const STORY_CHAPTER_MIN_CHARACTERS = 0x5dc;
export const STORY_CHAPTER_MAX_CHARACTERS = 0xbb8;
export const STORY_TEXT_REQUEST_TIMEOUT_MS = 0xa * 0x3c * 0x3e8;
export const STORY_TEXT_MAX_OUTPUT_TOKENS = 0x4000;
export const STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS = 0x8000;
export const STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS = 0x8 * 0x3c * 0x3e8;
const STORY_EPISODE_DEV_RESPONSE_HISTORY_LIMIT = 0x6,
  STORY_EPISODE_OUTLINE_BATCH_SIZE = 0x4,
  STORY_CONTINUITY_MAX_CHARACTER_STATES = 0xc,
  STORY_CONTINUITY_MAX_PROP_STATES = 0xa,
  STORY_CONTINUITY_MAX_UNRESOLVED_THREADS = 0x8,
  STORY_CONTINUITY_MAX_FACTS = 0xc,
  STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH = 0x8,
  STORY_EPISODE_EXPERIMENTAL_BATCH_TARGET_DURATION_SECONDS = 0x4b,
  STORY_EPISODE_EXPERIMENTAL_FALLBACK_PLAN_DURATION_SECONDS = 0xf,
  STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP = 0x0,
  STORY_EPISODE_EXPERIMENTAL_PREFERRED_SHOTS_PER_CLIP = 0x4,
  STORY_EPISODE_EXPERIMENTAL_MAX_FINAL_SHOTS_PER_CLIP = 0x5,
  STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_TARGET_CHARACTERS = 0x1a4,
  STORY_EPISODE_SPLIT_TEMPERATURE = 0.2,
  STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_MAX_CHARACTERS = 0x26c,
  STORY_EPISODE_EXPERIMENTAL_MAX_CONCURRENT_BATCHES = 0x3,
  STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS = 0x4;
export const STORY_GENERATION_SYSTEM_PROMPT = [
  '你是一名专业的短剧故事策划与剧本编辑。',
  '你的任务仅是创建或整理故事剧情，不生成分镜、镜头提示词、角色绘图提示词、场景绘图提示词或分集方案。',
  '故事必须具备清晰的主角目标、人物动机、主要阻力、因果推进、关键转折、高潮和结局。',
  '不要使用空泛评价代替剧情，不要写创作说明，不要向用户提问。',
  '所有输出使用简体中文。',
  '只返回一个严格 JSON 对象；不要输出 Markdown、代码块、前后说明、注释或尾随逗号。',
  'JSON 必须且只能包含 title、storyType、storySummary、storyBackground、storySetting、logline、chapters 七个字段。',
  'storySummary 是可独立阅读的故事梗概，概括主角、目标、核心冲突、主要转折和结局。',
  'storyBackground\x20说明故事发生的时代、地点、社会环境和初始处境。',
  'storySetting 说明世界规则、核心机制、人物必须遵守的限制和关键设定。',
  'logline 用一句话概括主角、目标、阻力和故事钩子。',
  'chapters 是章节数组，每章必须包含 title 和 content；title 是小说式主标题，content 使用自然段连续叙事。',
  '每章 content 必须为 ' +
    STORY_CHAPTER_MIN_CHARACTERS +
    ' 至 ' +
    STORY_CHAPTER_MAX_CHARACTERS +
    ' 个汉字，不能用提纲、重复句或无意义内容凑字数。',
  '所有章节合在一起必须完整覆盖故事的起因、发展、转折、高潮和结局，不能只输出片段或章节提纲。',
]['join']('\x0a');
const STORY_SOURCE_DIGEST_SYSTEM_PROMPT = [
    '你是长篇剧本信息整理助手。',
    '只提取原文事实，不续写、不评价、不改变人物关系和事件结果。',
    '每个分段摘要的 JSON 总内容控制在 1500 个汉字以内。',
    '只返回严格 JSON，不要输出 Markdown 或其他说明。',
    'JSON\x20必须包含\x20characters、settings、events、continuity、endingState。',
  ]['join']('\x0a'),
  STORY_ASSET_EXTRACTION_SYSTEM_PROMPT = [
    '你是专业的影视资产策划 Agent。',
    '你的任务是从已经确认的故事中提取需要保持视觉一致的角色、场景和关键道具资产。',
    '只依据输入故事提取，不续写剧情，不创建分集或分镜。',
    '角色的显著外观变化应拆成\x20appearances；普通情绪变化不要创建新形象。',
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
  ]['join']('\x0a'),
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
  ]['join']('\x0a'),
  STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE =
    '时长按当前人物把对白和表演自然完成所需来判断。口播字数只是参考之一，同时结合人物性格、语速、情绪、句式、呼吸、动作、停顿和反应；同样字数可以说得快，也可以说得慢，表情、动作与反应也可以同步发生。每个\x20shot.d\x20直接给出足以让该镜头\x20q\x20与\x20o\x20自然说完并完成必要动作和反应的时长；当前片段容纳不下时，在自然叙事位置续到下一\x20clip。不得依靠不自然的高速口播塞入对白，也不要按固定字数或固定每秒字数计算。',
  STORY_EPISODE_SPLIT_GROUPING_GUIDANCE =
    'clip\x20表示一次可独立生成的连续叙事片段，shots\x20表示该片段内部按观看节奏切换的镜头。先确定\x20clip\x20的连续表演过程，再在每个\x20clip\x20内设计\x20shots；不要先逐个设计\x20shot\x20再把每个\x20shot\x20分别包装成\x20clip。相邻内容仍处于同一场景与时段，并共同完成一段连续动作、同一轮对话及其表情或反应时，把它们组织为同一\x20clip\x20的连续\x20shots。说话人、景别、机位、视角、构图、运镜、表情或反应镜头的变化属于\x20shot\x20层级，不会单独决定片段边界。进入新的场景或时空、动作与情绪自然转入新的叙事阶段，或继续组织将超过用户设置的单片最大时长时，再自然进入下一\x20clip；片段与镜头数量按正文实际结构自然决定。',
  STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE =
    '单片时长上限只是生成能力造成的技术切片边界，不是剧情重新开场。相邻内容仍在同一\x20sourceSceneRef\x20和连续时空时，后一片段必须从前一片段结束的可观察状态继续：继承人物位置、朝向、动作进度、情绪、视线、手持道具、车辆或设备状态及空间方向；不得让人物返回更早位置、重复已经完成的动作、复原已经改变的道具或重新建立场景，除非原文明确写出返回、重复、复原、换场或时间跳跃。',
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
    '格式只能是\x20{\x22clips\x22:[{\x22s\x22:\x22场景代码\x22,\x22shots\x22:[{\x22d\x22:镜头秒数,\x22v\x22:\x22连续可观察画面\x22,\x22c\x22:\x22景别、机位与运镜\x22,\x22q\x22:\x22完整对白或空字符串\x22,\x22o\x22:\x22完整旁白或空字符串\x22,\x22a\x22:\x22必要音效或空字符串\x22},{\x22d\x22:后续镜头秒数,\x22v\x22:\x22后续连续可观察画面\x22,\x22c\x22:\x22后续景别、机位与运镜\x22,\x22q\x22:\x22完整对白或空字符串\x22,\x22o\x22:\x22完整旁白或空字符串\x22,\x22a\x22:\x22必要音效或空字符串\x22}]}]}。示意中的两个\x20shot\x20只展示同一\x20clip\x20内的层级关系，实际数量按当前片段内容自然确定；不得增加其他键。',
    'clips 中每一项是一个最终视频片段；s 必须逐字使用输入 scenes 中的 code，不得填写场景名称或编造代码。',
    '人物对白按原文顺序放入\x20q，旁白按原文顺序放入\x20o，都必须逐字完整保留；说出口或画外叙述的文字不得放入\x20v。',
    '严格读取输入 scriptMode，并按剧情模式或解说模式分别处理普通动作叙述与明确画外音。',
    STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
    STORY_EPISODE_SPLIT_VISUAL_GUIDANCE,
    STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
    '有对白时让人物表情、视线、姿态和动作与台词同步，听者反应按当前表演节拍自然安排；a 记录对画面有帮助的环境声、动作声和表演声。q、o、a 没有内容时返回空字符串。',
    '每镜内容与 d 保持自然匹配；保持原剧情事实和资产，不额外扩写事件、人物、能力、道具或结果，也不输出表头、序号、@、人物外貌或结构标签。',
    '忽略“（本集完）”“（全剧终）”“待续”等编辑标记；只有原文明示为屏幕字幕的文字才表现字幕。',
  ]['join']('\x0a'),
  STORY_EPISODES_SPLIT_SYSTEM_PROMPT = [
    '按输入剧本原顺序拆分分镜，不分析、不续写。',
    '严格读取输入 scriptMode，并按剧情模式或解说模式分别处理普通动作叙述与明确画外音。',
    STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
    STORY_EPISODE_SPLIT_VISUAL_GUIDANCE,
    STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
    '只返回一个完整 JSON 对象。',
  ]['join']('\x0a'),
  getStoryEpisodeSplitRequestSystemPrompt = ({
    compactPrompt: compactPrompt = ![],
    promptMode: promptMode = 'seedance-2.0',
  } = {}) =>
    appendStoryEpisodePromptModeSystemPrompt(
      compactPrompt ? STORY_EPISODES_SPLIT_SYSTEM_PROMPT : STORY_EPISODE_SPLIT_SYSTEM_PROMPT,
      promptMode,
      { announceTimelineContract: !![] },
    ),
  STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT =
    '只检查并修复已有分镜结果的\x20JSON\x20格式和字段包装。不得增删、改写或重新生成分镜内容。只返回修复后的完整\x20JSON。',
  STORY_EPISODE_BATCHED_BLUEPRINT_SYSTEM_PROMPT = [
    '你是专业的短剧分镜总规划 Agent。',
    '你的任务是先为一整集建立连续片段蓝图，不写具体分镜、镜头语言或最终视频提示词。',
    '必须按原剧本顺序完整覆盖全部 sourceBeats；每个 sourceBeatRef 必须且只能出现一次，每个 clipPlan 代表一个之后会独立生成的视频片段。',
    '每个 clipPlan 只能覆盖同一个 sourceSceneRef 中连续的 sourceBeatRefs，换场必须新建 clipPlan。',
    'sourceBeat\x20用于跟踪原文覆盖，不直接决定片段边界；一个\x20clipPlan\x20可以承载多个相互关联的动作、对白和反应。',
    STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
    STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
    STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE,
    'entryState 与 exitState 必须明确记录人物位置、动作状态、情绪、视线、关键道具和空间方向，供后续分批生成保持连续。',
    '同一 sourceSceneRef 的相邻 clipPlan 必须形成状态链：后一项 entryState 逐项继承前一项 exitState，再从该状态推进当前 beat；禁止把每个 clipPlan 当成独立开场。',
    'beat、entryState、exitState 各只写一句必要信息，不复述原文，不输出镜头细节。',
    '不得新增输入中不存在的人物、对白、资产、事件、规则或结局。',
    '只返回严格 JSON，不要输出 Markdown、注释、说明或具体 shots。',
  ]['join']('\x0a'),
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
    '每个分镜中，画面实际出现的已登记角色必须来自\x20clipPlan.characterAssetRefs，并逐个把具体\x20appearanceRef\x20写入\x20shot.assetRefs；资产没有形象时才写\x20assetRef。角色只在\x20visual\x20首次出现时使用\x20assets[].name，后续优先使用他/她/该角色；存在指代歧义时使用普通姓名。dialogue\x20的说话人标签始终使用普通姓名，任何文本字段都不要输出\x20@。',
    '只返回生成当前分镜必需的紧凑字段；script、creativeIntent、transition 和 time 由客户端依据蓝图本地补全。' +
      STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
      '\x20camera\x20聚焦当前分镜的观察方式。',
    'shot.audio 只写必要的环境声、动作音效和可听见的表演声；允许呼吸、喘息、啜泣、衣物摩擦等与当前动作直接相关的声音。禁止固定人物音色设定、对白内容复述和脱离剧情的配乐分析；没有必要音效时返回空字符串。',
    '不得使用‘上一片段’‘下一片段’等外部上下文表达；连续状态要直接改写为当前 clip 内可观察的起始状态。',
    '不得新增输入中不存在的人物、对白、资产、事件、规则或结局。',
    '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
  ]['join']('\x0a'),
  STORY_EPISODE_DIRECTOR_CONTINUITY_BLUEPRINT_SYSTEM_PROMPT = [
    STORY_EPISODE_BATCHED_BLUEPRINT_SYSTEM_PROMPT,
    '当前是开发测试专用的导演连续性提示词实验。',
    '除人物空间状态外，为每个 clipPlan 返回 openingShotIntent 与 closingShotIntent，用来表达镜头的叙事关注点和与相邻计划的画面关系；具体观察方式由剧情和表演决定。',
    '场景图片是固定空间锚点，人物位置必须使用可观察地标描述；镜头变化不得镜像或重构场景。',
  ]['join']('\x0a'),
  STORY_EPISODE_DIRECTOR_CONTINUITY_EXPANSION_SYSTEM_PROMPT = [
    STORY_EPISODE_BATCHED_EXPANSION_SYSTEM_PROMPT,
    '当前是开发测试专用的导演连续性提示词实验。',
    '由你根据剧情和表演自主设计镜头数量、角度、构图、运镜和剪辑方式。',
    '每个 shot 必须返回 transitionFromPrevious，说明切镜、动作匹配、视线匹配、反应镜头、道具插入或连续长镜等衔接选择及叙事原因。',
    '避免无动机地连续重复同一主体、景别、机位和构图；也不要把普通争吵默认处理成双人纯侧面一镜到底。',
  ]['join']('\x0a'),
  getStoryEpisodeExperimentalExpansionSystemPrompt = ({
    promptExperiment: promptExperiment = ![],
    promptMode: promptMode = 'seedance-2.0',
  } = {}) =>
    appendStoryEpisodePromptModeSystemPrompt(
      promptExperiment
        ? STORY_EPISODE_DIRECTOR_CONTINUITY_EXPANSION_SYSTEM_PROMPT
        : STORY_EPISODE_BATCHED_EXPANSION_SYSTEM_PROMPT,
      promptMode,
    );
function createStoryEpisodeExperimentalStructuredOutput(_0x5690b7, _0xe455b3) {
  return { name: _0x5690b7, schema: _0xe455b3, strict: !![], fallback: 'prompt' };
}
function normalizeStoryContinuityFacts(_0x586c42) {
  return normalizeStringArray(_0x586c42)['slice'](0x0, STORY_CONTINUITY_MAX_FACTS);
}
function normalizeStoryContinuityState(_0x5dc72a = {}) {
  const _0x38cd50 =
    _0x5dc72a && typeof _0x5dc72a === 'object' && !Array['isArray'](_0x5dc72a) ? _0x5dc72a : {};
  return {
    characters: normalizeStringArray(_0x38cd50['characters'] || _0x38cd50['characterStates'])['slice'](
      0x0,
      STORY_CONTINUITY_MAX_CHARACTER_STATES,
    ),
    props: normalizeStringArray(_0x38cd50['props'] || _0x38cd50['propStates'] || _0x38cd50['items'])['slice'](
      0x0,
      STORY_CONTINUITY_MAX_PROP_STATES,
    ),
    unresolvedThreads: normalizeStringArray(
      _0x38cd50['unresolvedThreads'] || _0x38cd50['threads'] || _0x38cd50['openThreads'],
    )['slice'](0x0, STORY_CONTINUITY_MAX_UNRESOLVED_THREADS),
  };
}
function hasStoryContinuityState(_0x3d476f = {}) {
  const _0x274977 = normalizeStoryContinuityState(_0x3d476f);
  return (
    _0x274977['characters']['length'] > 0x0 ||
    _0x274977['props']['length'] > 0x0 ||
    _0x274977['unresolvedThreads']['length'] > 0x0
  );
}
function normalizeStoryProjectInput(_0xf77a07 = {}) {
  const _0x2f8723 = Array['isArray'](_0xf77a07?.['chapters'])
    ? _0xf77a07['chapters']
        ['map']((_0x2951ff, _0x50923b) => ({
          id: normalizeText(_0x2951ff?.['id']) || 'chapter-' + (_0x50923b + 0x1),
          title: normalizeText(_0x2951ff?.['title']),
          content: normalizeText(_0x2951ff?.['content']),
        }))
        ['filter']((_0x2a0506) => _0x2a0506['title'] || _0x2a0506['content'])
    : [];
  return {
    title: normalizeText(_0xf77a07?.['title']),
    storyType: normalizeText(_0xf77a07?.['storyType']),
    summary: normalizeText(_0xf77a07?.['summary'] || _0xf77a07?.['storySummary']),
    background: normalizeText(_0xf77a07?.['background'] || _0xf77a07?.['storyBackground']),
    setting: normalizeText(_0xf77a07?.['setting'] || _0xf77a07?.['storySetting']),
    logline: normalizeText(_0xf77a07?.['logline']),
    scriptMode: normalizeStoryScriptMode(_0xf77a07?.['scriptMode']),
    aspectRatio: normalizeText(_0xf77a07?.['aspectRatio']) || '16:9',
    visualStyle: normalizeText(
      _0xf77a07?.['videoStylePrompt'] || _0xf77a07?.['visualStyle'] || _0xf77a07?.['videoStyle'],
    ),
    promptMode: normalizeText(_0xf77a07?.['planning']?.['promptMode'])['toLowerCase']() || 'seedance-2.0',
    chapters: _0x2f8723,
    planning: normalizeStoryPlanningConstraints(_0xf77a07?.['planning']),
  };
}
function assertStoryProjectInput(_0x4258d3) {
  if (!_0x4258d3['title'] || !_0x4258d3['chapters']['length'])
    throw new Error('请先完成故事大纲和章节内容。');
}
function resolveStoryPlanningConstraints(_0x47036a = {}, _0x5b80e9 = {}) {
  const _0x2aee5b =
    _0x5b80e9 &&
    typeof _0x5b80e9 === 'object' &&
    (Object['prototype']['hasOwnProperty']['call'](_0x5b80e9, 'episodeCount') ||
      Object['prototype']['hasOwnProperty']['call'](_0x5b80e9, 'sceneMaxSeconds'));
  return validateStoryPlanningConstraints(_0x2aee5b ? _0x5b80e9 : _0x47036a?.['planning']);
}
function resolveStoryPromptMode(_0x39fc05 = {}, _0x48ceff = {}) {
  const _0x1653b1 = normalizeText(_0x48ceff?.['promptMode'])['toLowerCase']();
  return (
    _0x1653b1 || normalizeText(_0x39fc05?.['planning']?.['promptMode'])['toLowerCase']() || 'seedance-2.0'
  );
}
function normalizeStoryMode(_0x58e9b3) {
  return _0x58e9b3 === 'upload' ? 'upload' : 'generate';
}
function stringifyStoryEpisodeDevResponse(_0x310015) {
  if (typeof _0x310015 === 'string') return _0x310015;
  try {
    return JSON['stringify'](_0x310015);
  } catch {
    return String(_0x310015 || '');
  }
}
export function captureStoryEpisodeScriptDevResponse({
  response: _0x55ff55,
  attempt: attempt = 0x1,
  episodeRef: episodeRef = '',
  episodeNumber: episodeNumber = 0x1,
  model: model = '',
  provider: provider = '',
  windowObject: windowObject = globalThis['window'],
  consoleObject: consoleObject = globalThis['console'],
  capturedAt: capturedAt = new Date()['toISOString'](),
} = {}) {
  if (windowObject?.['AI_CANVAS_IS_DEV_BUILD'] !== !![]) return null;
  const _0x1c580c = {
      capturedAt: normalizeText(capturedAt),
      attempt: Math['max'](0x1, Math['trunc'](Number(attempt) || 0x1)),
      episodeRef: normalizeText(episodeRef),
      episodeNumber: Math['max'](0x1, Math['trunc'](Number(episodeNumber) || 0x1)),
      model: normalizeText(model),
      provider: normalizeText(provider),
      responseText: stringifyStoryEpisodeDevResponse(getResultText(_0x55ff55)),
    },
    _0x49cc34 = Array['isArray'](windowObject['__AIC_DEV_EPISODE_SCRIPT_RESPONSES__'])
      ? windowObject['__AIC_DEV_EPISODE_SCRIPT_RESPONSES__']
      : [];
  return (
    (windowObject['__AIC_DEV_EPISODE_SCRIPT_RESPONSES__'] = [..._0x49cc34, _0x1c580c]['slice'](
      -STORY_EPISODE_DEV_RESPONSE_HISTORY_LIMIT,
    )),
    consoleObject?.['info']?.('[storyWorkspace][episode-script][dev-response]', _0x1c580c),
    _0x1c580c
  );
}
function countStoryChapterCharacters(_0x10c17c) {
  return Array['from'](normalizeText(_0x10c17c)['replace'](/\s/g, ''))['length'];
}
export function parseStoryGenerationResult(
  _0x5531d0,
  {
    minChapters: minChapters = 0x1,
    minChapterCharacters: minChapterCharacters = 0x0,
    maxChapterCharacters: maxChapterCharacters = Number['POSITIVE_INFINITY'],
  } = {},
) {
  const _0x4ad748 = parseStrictJson(getResultText(_0x5531d0), 'Agent 未返回剧情内容。'),
    _0x754a22 = normalizeText(_0x4ad748['title']),
    _0x4d3cdc = normalizeText(_0x4ad748['storyType']),
    _0x45279d = normalizeText(_0x4ad748['storySummary']),
    _0x3cc47a = normalizeText(_0x4ad748['storyBackground']),
    _0x499b82 = normalizeText(_0x4ad748['storySetting']),
    _0x272d11 = normalizeText(_0x4ad748['logline']),
    _0x43e8a4 = Array['isArray'](_0x4ad748['chapters'])
      ? _0x4ad748['chapters']
          ['map']((_0x53225c) => ({
            title: normalizeText(_0x53225c?.['title']),
            content: normalizeText(_0x53225c?.['content']),
          }))
          ['filter']((_0x46beee) => _0x46beee['title'] && _0x46beee['content'])
      : [];
  if (!_0x754a22) throw new Error('Agent 返回结果缺少故事标题。');
  if (!_0x4d3cdc) throw new Error('Agent 返回结果缺少故事类型。');
  if (!_0x45279d) throw new Error('Agent 返回结果缺少故事梗概。');
  if (!_0x3cc47a) throw new Error('Agent 返回结果缺少故事背景。');
  if (!_0x499b82) throw new Error('Agent 返回结果缺少故事设定。');
  if (!_0x272d11) throw new Error('Agent 返回结果缺少一句话故事。');
  const _0x5e3d00 = Math['max'](0x1, Math['trunc'](Number(minChapters) || 0x1));
  if (_0x43e8a4['length'] < _0x5e3d00) throw new Error('Agent 返回的有效章节不足 ' + _0x5e3d00 + '\x20章。');
  const _0x2edcb8 = Math['max'](0x0, Math['trunc'](Number(minChapterCharacters) || 0x0)),
    _0x46e575 = Number(maxChapterCharacters),
    _0x5b8409 = Number['isFinite'](_0x46e575)
      ? Math['max'](_0x2edcb8, Math['trunc'](_0x46e575))
      : Number['POSITIVE_INFINITY'];
  for (const _0x261d05 of _0x43e8a4) {
    const _0x3c5caf = countStoryChapterCharacters(_0x261d05['content']);
    if (_0x3c5caf < _0x2edcb8)
      throw new Error(
        'Agent 返回的章节“' +
          _0x261d05['title'] +
          '”正文不足 ' +
          _0x2edcb8 +
          ' 个字（当前 ' +
          _0x3c5caf +
          '\x20个字）。',
      );
    if (_0x3c5caf > _0x5b8409)
      throw new Error(
        'Agent\x20返回的章节“' +
          _0x261d05['title'] +
          '”正文超过 ' +
          _0x5b8409 +
          ' 个字（当前 ' +
          _0x3c5caf +
          '\x20个字）。',
      );
  }
  return {
    schemaVersion: STORY_GENERATION_SCHEMA_VERSION,
    title: _0x754a22,
    storyType: _0x4d3cdc,
    storySummary: _0x45279d,
    storyBackground: _0x3cc47a,
    storySetting: _0x499b82,
    logline: _0x272d11,
    chapters: _0x43e8a4,
  };
}
export function splitStorySourceText(_0x585012, _0x593a6a = STORY_SOURCE_CHUNK_CHARACTERS) {
  const _0x33fe09 = normalizeText(_0x585012),
    _0x39f635 = Math['max'](0x7d0, Math['trunc'](Number(_0x593a6a) || 0x0));
  if (!_0x33fe09) return [];
  if (_0x33fe09['length'] <= _0x39f635) return [_0x33fe09];
  const _0x42a82b = [];
  let _0x4d3635 = 0x0;
  while (_0x4d3635 < _0x33fe09['length']) {
    let _0x60e23b = Math['min'](_0x33fe09['length'], _0x4d3635 + _0x39f635);
    if (_0x60e23b < _0x33fe09['length']) {
      const _0x18f2bb = _0x33fe09['lastIndexOf']('\x0a', _0x60e23b);
      if (_0x18f2bb > _0x4d3635 + Math['floor'](_0x39f635 * 0.55)) _0x60e23b = _0x18f2bb;
    }
    (_0x42a82b['push'](_0x33fe09['slice'](_0x4d3635, _0x60e23b)['trim']()), (_0x4d3635 = _0x60e23b));
    while (_0x33fe09[_0x4d3635] === '\x0a' || _0x33fe09[_0x4d3635] === '\x0d') _0x4d3635 += 0x1;
  }
  return _0x42a82b['filter'](Boolean);
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
  const _0x36bd41 = normalizeStoryMode(mode),
    _0x1afccb = normalizeText(idea),
    _0x3b27e1 = normalizeText(sourceText),
    _0x395931 = Array['isArray'](sourceDigests) ? sourceDigests : [],
    _0x54c37b = validateStoryPlanningConstraints(planning);
  if (_0x36bd41 === 'generate' && !_0x1afccb) throw new Error('请先输入故事设定。');
  if (_0x36bd41 === 'upload' && !_0x3b27e1 && _0x395931['length'] === 0x0)
    throw new Error('没有可供整理的剧本文本。');
  const _0x297d09 =
    _0x36bd41 === 'upload'
      ? '在不改变原文人物姓名、人物关系、关键事件和结局的前提下，整理因果逻辑、补足必要衔接并统一表达；原文未明确的信息应保守处理，不得擅自重写核心剧情。'
      : '根据用户提供的故事设定扩写为完整剧情；可以补充必要人物与事件，但所有新增内容必须服务于主角目标和核心冲突。';
  return JSON['stringify']({
    task: 'create_story',
    schemaVersion: STORY_GENERATION_SCHEMA_VERSION,
    mode: _0x36bd41,
    modeInstruction: _0x297d09,
    visualDirection: {
      aspectRatio: normalizeText(aspectRatio) || '16:9',
      style: normalizeText(visualStyle),
      instruction: '视觉方向仅用于让人物、场景与叙事氛围保持一致，不要输出绘图提示词或创作说明。',
    },
    pacingConstraints: {
      ..._0x54c37b,
      instruction:
        'episodeCount 和 sceneMaxSeconds 均为上限，仅用于控制故事容量和节奏；当前任务仍只输出完整故事，不输出分集或分镜。',
    },
    writingRequirements: [
      '故事梗概建议 250 至 500 个汉字，必须包含结局，不能只写悬念。',
      '每章正文必须为 ' +
        STORY_CHAPTER_MIN_CHARACTERS +
        ' 至 ' +
        STORY_CHAPTER_MAX_CHARACTERS +
        '\x20个汉字，每章都要有清晰主标题；不能用提纲、重复句或无意义内容凑字数。',
      '开篇尽快建立人物、处境和触发事件。',
      '中段通过行动与代价升级冲突，避免只有设定介绍。',
      '高潮必须由前文因果推动，结局回应主角目标并完成主要人物弧光。',
      '不要生成分镜编号、镜头语言、绘图提示词、资产清单或分集标题。',
      _0x36bd41 === 'generate'
        ? 'AI 写故事模式必须生成至少 3 章，每章都要有独立主标题和完整正文。'
        : '上传文案模式不固定章节数量，由原文结构与叙事节奏决定应拆成多少章，不得为了凑数强行拆章。',
    ],
    input:
      _0x36bd41 === 'upload'
        ? { fileName: normalizeText(fileName), sourceText: _0x3b27e1, sourceDigests: _0x395931 }
        : { idea: _0x1afccb },
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
function buildStorySourceDigestPrompt(_0x58b271, _0x82c31f, _0x30cabd) {
  return JSON['stringify']({
    task: 'digest_story_source_chunk',
    chunk: { index: _0x82c31f + 0x1, total: _0x30cabd, text: _0x58b271 },
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
function parseStorySourceDigest(_0x42a832) {
  const _0x549832 = parseStrictJson(getResultText(_0x42a832), 'Agent 未返回剧本分段摘要。');
  return {
    characters: Array['isArray'](_0x549832['characters'])
      ? _0x549832['characters']['map'](normalizeText)['filter'](Boolean)
      : [],
    settings: Array['isArray'](_0x549832['settings'])
      ? _0x549832['settings']['map'](normalizeText)['filter'](Boolean)
      : [],
    events: Array['isArray'](_0x549832['events'])
      ? _0x549832['events']['map'](normalizeText)['filter'](Boolean)
      : [],
    continuity: normalizeText(_0x549832['continuity']),
    endingState: normalizeText(_0x549832['endingState']),
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
  const _0x51260f = normalizeStoryMode(mode),
    _0x4c4e59 = normalizeText(model),
    _0x4f1763 = normalizeText(provider);
  if (!_0x4c4e59 || !_0x4f1763) throw new Error('请先选择可用的文本模型。');
  let _0x1d8bf6 = [],
    _0x13a7d6 = normalizeText(sourceText);
  if (_0x51260f === 'upload' && _0x13a7d6['length'] > STORY_SOURCE_CHUNK_CHARACTERS) {
    const _0x38a7d3 = splitStorySourceText(_0x13a7d6);
    for (let _0x3f8cca = 0x0; _0x3f8cca < _0x38a7d3['length']; _0x3f8cca += 0x1) {
      onProgress?.({
        stage: 'digesting',
        current: _0x3f8cca + 0x1,
        total: _0x38a7d3['length'],
        message: '正在整理剧本 ' + (_0x3f8cca + 0x1) + '/' + _0x38a7d3['length'],
      });
      const _0x2d2bff = buildStorySourceDigestPrompt(_0x38a7d3[_0x3f8cca], _0x3f8cca, _0x38a7d3['length']),
        _0xb12519 = await requestStrictResult({
          request: request,
          requestPayload: {
            model: _0x4c4e59,
            provider: _0x4f1763,
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: _0x2d2bff,
            systemPrompt: STORY_SOURCE_DIGEST_SYSTEM_PROMPT,
            temperature: 0.1,
            timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
          },
          parse: parseStorySourceDigest,
          outputContract: 'characters/settings/events arrays and continuity/endingState strings',
        });
      _0x1d8bf6['push']({ part: _0x3f8cca + 0x1, ..._0xb12519 });
    }
    _0x13a7d6 = '';
  }
  onProgress?.({
    stage: 'writing',
    current: 0x1,
    total: 0x1,
    message: _0x51260f === 'upload' ? '正在整理故事内容' : '正在创建完整剧情',
  });
  const _0x31dfbb = buildStoryGenerationPrompt({
    mode: _0x51260f,
    idea: idea,
    sourceText: _0x13a7d6,
    fileName: fileName,
    sourceDigests: _0x1d8bf6,
    aspectRatio: aspectRatio,
    visualStyle: visualStyle,
    planning: planning,
  });
  return await requestStrictResult({
    request: request,
    requestPayload: {
      model: _0x4c4e59,
      provider: _0x4f1763,
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: _0x31dfbb,
      systemPrompt: STORY_GENERATION_SYSTEM_PROMPT,
      temperature: _0x51260f === 'upload' ? 0.35 : 0.7,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
    },
    parse: (_0x23ce91) =>
      parseStoryGenerationResult(_0x23ce91, {
        minChapters: _0x51260f === 'generate' ? 0x3 : 0x1,
        minChapterCharacters: STORY_CHAPTER_MIN_CHARACTERS,
        maxChapterCharacters: STORY_CHAPTER_MAX_CHARACTERS,
      }),
    outputContract:
      _0x51260f === 'generate'
        ? 'title/storyType/storySummary/storyBackground/storySetting/logline strings and at least 3 chapters[{title,content}], with each content containing ' +
          STORY_CHAPTER_MIN_CHARACTERS +
          '-' +
          STORY_CHAPTER_MAX_CHARACTERS +
          '\x20characters'
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
export const buildStorySummaryPrompt = storySummaryBlueprint['buildStorySummaryPrompt'];
export const parseStorySummaryResult = storySummaryBlueprint['parseStorySummaryResult'];
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
export const generateStorySummary = storySummaryGenerationApi['generateStorySummary'];
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
export const buildStoryEpisodeScriptPrompt = storyEpisodeScriptPromptApi['buildPrompt'];
const buildStoryEpisodeScriptContentRevisionPrompt =
    storyEpisodeScriptPromptApi['buildContentRevisionPrompt'],
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
export const adjustStoryClipPrompt = storyClipAdjustmentApi['adjustStoryClipPrompt'];
export const buildStoryClipAdjustmentPrompt = storyClipAdjustmentApi['buildStoryClipAdjustmentPrompt'];
export const parseStoryClipAdjustmentResult = storyClipAdjustmentApi['parseStoryClipAdjustmentResult'];
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
  storyEpisodeOutlinePlanningApi['buildStoryEpisodeOutlinePrompt'];
export const parseStoryEpisodeOutlineSkeletonResult =
  storyEpisodeOutlinePlanningApi['parseStoryEpisodeOutlineSkeletonResult'];
export const createStoryEpisodeOutlineBatches =
  storyEpisodeOutlinePlanningApi['createStoryEpisodeOutlineBatches'];
export const buildStoryEpisodeOutlineBatchPrompt =
  storyEpisodeOutlinePlanningApi['buildStoryEpisodeOutlineBatchPrompt'];
export const parseStoryEpisodeOutlineBatchResult =
  storyEpisodeOutlinePlanningApi['parseStoryEpisodeOutlineBatchResult'];
export const parseStoryEpisodeOutlineResult =
  storyEpisodeOutlinePlanningApi['parseStoryEpisodeOutlineResult'];
export const planStoryEpisodeOutlines = storyEpisodeOutlinePlanningApi['planStoryEpisodeOutlines'];
function formatEpisodeSceneText(_0xd2904d, _0x207a53, _0x1e693b) {
  const _0x5c21cf = _0xd2904d['characters']['length']
    ? '\n出场人物：' + _0xd2904d['characters']['join']('、')
    : '';
  return (
    '###\x20场' +
    _0x207a53 +
    '-' +
    (_0x1e693b + 0x1) +
    '\x0a' +
    _0xd2904d['heading'] +
    _0x5c21cf +
    '\x0a' +
    _0xd2904d['body']
  );
}
function normalizeStoryEpisodeScriptDialogueContent(_0x11f432 = '') {
  const _0x94a81d = normalizeText(_0x11f432);
  if (!_0x94a81d) return _0x94a81d;
  const _0x42a870 = _0x94a81d['match'](/^((?:(?:（[^）]*）|\([^)]*\))\s*)+)([\s\S]+)$/u),
    _0xd895f0 = normalizeText(_0x42a870?.[0x1]),
    _0x4a23c6 = normalizeText(_0x42a870?.[0x2] || _0x94a81d);
  if (!_0x4a23c6) return _0x94a81d;
  const _0x2a3da4 = _0x4a23c6['match'](/^(?:“([\s\S]*)”|「([\s\S]*)」|『([\s\S]*)』|"([\s\S]*)")$/u);
  if (_0x2a3da4) {
    const _0x4d9dbf = normalizeText(_0x2a3da4[0x1] || _0x2a3da4[0x2] || _0x2a3da4[0x3] || _0x2a3da4[0x4]);
    return _0xd895f0 + '“' + _0x4d9dbf + '”';
  }
  if (/[“”「」『』"]/u['test'](_0x4a23c6)) return _0x94a81d;
  return _0xd895f0 + '“' + _0x4a23c6 + '”';
}
function normalizeStoryEpisodeScriptSceneBody(_0x507502 = '', _0x342f6d = []) {
  const _0x1010ce = new Set(normalizeStringArray(_0x342f6d)),
    _0x6b4a66 = new Set(['旁白', '画外音', '音效', '屏幕字幕', '字幕', '时间', '地点', '场景']);
  return String(_0x507502 || '')
    ['split'](/\r?\n/u)
    ['flatMap']((_0x3102db) => {
      const _0x195d54 = _0x3102db['trim']();
      if (!_0x195d54) return [''];
      if (isStoryEpisodeEditorialMarker(_0x195d54)) return [];
      const _0x13a12f = _0x195d54['match'](/^([^：:\n]{1,40})[：:]\s*(.+)$/u),
        _0x29eaad = normalizeText(_0x13a12f?.[0x1]);
      if (!_0x13a12f || !_0x1010ce['has'](_0x29eaad) || _0x6b4a66['has'](_0x29eaad)) return [_0x195d54];
      const _0x5e3015 = normalizeStoryEpisodeScriptDialogueContent(_0x13a12f[0x2]);
      return [_0x29eaad + '：' + _0x5e3015];
    })
    ['join']('\x0a')
    ['replace'](/\n{2,}/gu, '\x0a')
    ['trim']();
}
function normalizeStoryEpisodeScriptCharacters(_0x4ea4a7) {
  if (Array['isArray'](_0x4ea4a7)) return normalizeStringArray(_0x4ea4a7);
  return normalizeStringArray(
    normalizeText(_0x4ea4a7)
      ['split'](/[、，,;/|]+/u)
      ['map']((_0x1e7436) => _0x1e7436['trim']()),
  );
}
function normalizeStoryEpisodeScriptBodyValue(_0x12621d) {
  if (Array['isArray'](_0x12621d))
    return _0x12621d['map']((_0x192ee5) => normalizeText(_0x192ee5))
      ['filter'](Boolean)
      ['join']('\x0a');
  if (_0x12621d && typeof _0x12621d === 'object')
    return normalizeText(_0x12621d['text'] || _0x12621d['content'] || _0x12621d['body']);
  return normalizeText(_0x12621d);
}
function getStoryEpisodeScriptSceneEntries(_0x32973c = {}) {
  const _0x443348 =
      _0x32973c && typeof _0x32973c === 'object' && !Array['isArray'](_0x32973c) ? _0x32973c : {},
    _0x408461 = [
      _0x443348['scenes'],
      _0x443348['sceneList'],
      _0x443348['scene_list'],
      _0x443348['scriptScenes'],
      _0x443348['script_scenes'],
    ];
  return _0x408461['find'](Array['isArray']) || [];
}
function findStoryEpisodeScriptPayload(_0x43df30) {
  const _0x2c38c6 = [_0x43df30],
    _0x52b048 = new Set();
  let _0x22bfe2 = null;
  while (_0x2c38c6['length']) {
    const _0x3d1ff7 = _0x2c38c6['shift']();
    if (Array['isArray'](_0x3d1ff7)) return { scenes: _0x3d1ff7 };
    if (!_0x3d1ff7 || typeof _0x3d1ff7 !== 'object' || _0x52b048['has'](_0x3d1ff7)) continue;
    (_0x52b048['add'](_0x3d1ff7), (_0x22bfe2 ||= _0x3d1ff7));
    if (getStoryEpisodeScriptSceneEntries(_0x3d1ff7)['length']) return _0x3d1ff7;
    ['result', 'data', 'output', 'response', 'episode', 'script']['forEach']((_0x41b0ee) => {
      const _0x28494b = _0x3d1ff7[_0x41b0ee];
      if (_0x28494b && typeof _0x28494b === 'object') _0x2c38c6['push'](_0x28494b);
    });
  }
  return _0x22bfe2 || {};
}
function extractStoryEpisodeScriptStringProperty(_0x242fb4, _0x3e1fd7 = []) {
  for (const _0x16964b of _0x3e1fd7) {
    const _0x33d7aa = extractJsonStringProperty(_0x242fb4, _0x16964b);
    if (_0x33d7aa) return _0x33d7aa;
  }
  return '';
}
function isStoryEpisodeScriptArrayClosed(_0x435d23, _0x16eafa) {
  const _0x19b3b3 = getResultText(_0x435d23);
  if (typeof _0x19b3b3 !== 'string' || !_0x19b3b3 || !_0x16eafa) return ![];
  const _0x4825c1 = '\x22' + _0x16eafa + '\x22',
    _0x457488 = _0x19b3b3['indexOf'](_0x4825c1);
  if (_0x457488 < 0x0) return ![];
  const _0x3b4e74 = _0x19b3b3['indexOf'](':', _0x457488 + _0x4825c1['length']),
    _0x1055f2 = _0x3b4e74 >= 0x0 ? _0x19b3b3['indexOf']('[', _0x3b4e74 + 0x1) : -0x1;
  if (_0x1055f2 < 0x0) return ![];
  let _0x195ad0 = 0x0,
    _0xe2f1a8 = ![],
    _0x4b5f0c = ![];
  for (let _0x3be7af = _0x1055f2; _0x3be7af < _0x19b3b3['length']; _0x3be7af += 0x1) {
    const _0x2d5b1d = _0x19b3b3[_0x3be7af];
    if (_0xe2f1a8) {
      if (_0x4b5f0c) _0x4b5f0c = ![];
      else {
        if (_0x2d5b1d === '\x5c') _0x4b5f0c = !![];
        else {
          if (_0x2d5b1d === '\x22') _0xe2f1a8 = ![];
        }
      }
      continue;
    }
    if (_0x2d5b1d === '\x22') {
      _0xe2f1a8 = !![];
      continue;
    }
    if (_0x2d5b1d === '[') _0x195ad0 += 0x1;
    else {
      if (_0x2d5b1d === ']') {
        _0x195ad0 -= 0x1;
        if (_0x195ad0 === 0x0) return !![];
      }
    }
  }
  return ![];
}
function parseStoryEpisodeScriptPayload(_0x3308ce) {
  const _0x48a648 = getResultText(_0x3308ce),
    _0x277512 = repairStoryEpisodeScriptMissingBodyTerminators(_0x48a648),
    _0x443527 = _0x277512['repairedCount'] ? _0x277512['text'] : _0x48a648;
  let _0x505bf9 = null,
    _0x1f575e = null;
  const _0x5c0c73 = _0x277512['repairedCount'];
  try {
    _0x505bf9 = parseStrictJson(_0x443527, 'Agent 未返回完整分集剧本。');
  } catch (_0x4eaf38) {
    _0x1f575e = _0x4eaf38;
  }
  let _0xa35496 = findStoryEpisodeScriptPayload(_0x505bf9),
    _0x87b7d2 = getStoryEpisodeScriptSceneEntries(_0xa35496),
    _0xd470ba = ![],
    _0x94b52d = ![];
  if (!_0x87b7d2['length'])
    for (const _0x3c23c9 of ['scenes', 'sceneList', 'scene_list', 'scriptScenes', 'script_scenes']) {
      const _0x1b4527 = extractCompleteJsonArrayItems(_0x443527, _0x3c23c9);
      if (!_0x1b4527['length']) continue;
      ((_0x87b7d2 = _0x1b4527),
        (_0x94b52d = isStoryEpisodeScriptArrayClosed(_0x443527, _0x3c23c9)),
        (_0xd470ba = !_0x94b52d));
      break;
    }
  if (!_0x87b7d2['length'] && _0x1f575e) throw _0x1f575e;
  return {
    data: {
      ...(_0xa35496 && typeof _0xa35496 === 'object' && !Array['isArray'](_0xa35496) ? _0xa35496 : {}),
      episodeRef: normalizeText(
        _0xa35496?.['episodeRef'] ||
          _0xa35496?.['episodeId'] ||
          _0xa35496?.['episode_id'] ||
          extractStoryEpisodeScriptStringProperty(_0x443527, ['episodeRef', 'episodeId', 'episode_id']),
      ),
      title: normalizeText(
        _0xa35496?.['title'] ||
          _0xa35496?.['episodeTitle'] ||
          _0xa35496?.['episode_title'] ||
          extractStoryEpisodeScriptStringProperty(_0x443527, ['title', 'episodeTitle', 'episode_title']),
      ),
      scenes: _0x87b7d2,
    },
    recovery:
      _0x5c0c73 && _0x505bf9
        ? {
            mode: 'missing-scene-body-string-terminators',
            incompleteJson: ![],
            repairedBodyTerminators: _0x5c0c73,
          }
        : _0xd470ba || _0x94b52d
          ? {
              mode: _0xd470ba
                ? 'complete-scenes-from-incomplete-json'
                : 'complete-scenes-from-invalid-json-shell',
              incompleteJson: _0xd470ba,
            }
          : null,
  };
}
export function parseStoryEpisodeScriptResult(
  _0x374bd1,
  {
    episodeRef: episodeRef = 'episode-1',
    episodeNumber: episodeNumber = 0x1,
    episodeTitle: episodeTitle = '',
    requireEndingState: requireEndingState = ![],
    fallbackContinuityFacts: fallbackContinuityFacts = [],
    fallbackEndingState: fallbackEndingState = null,
  } = {},
) {
  const { data: _0x2ab58c, recovery: _0x5af09c } = parseStoryEpisodeScriptPayload(_0x374bd1),
    _0x32f8d1 =
      normalizeText(_0x2ab58c['episodeRef'] || _0x2ab58c['episodeId'] || _0x2ab58c['episode_id']) ||
      normalizeText(episodeRef) ||
      'episode-1';
  if (normalizeText(episodeRef) && _0x32f8d1 !== normalizeText(episodeRef))
    throw new Error('Agent 返回的分集引用与请求不一致。');
  const _0x54f861 =
      normalizeText(_0x2ab58c['title'] || _0x2ab58c['episodeTitle'] || _0x2ab58c['episode_title']) ||
      normalizeText(episodeTitle) ||
      '第\x20' + episodeNumber + '\x20集',
    _0x541953 = getStoryEpisodeScriptSceneEntries(_0x2ab58c),
    _0x554249 = _0x541953['length']
      ? _0x541953['map']((_0xb12c8e, _0x5d95f2) => {
          const _0x1d842b = normalizeStoryEpisodeScriptCharacters(
            _0xb12c8e?.['characters'] ||
              _0xb12c8e?.['characterNames'] ||
              _0xb12c8e?.['character_names'] ||
              _0xb12c8e?.['cast'] ||
              _0xb12c8e?.['roles'],
          );
          return {
            ref:
              normalizeText(
                _0xb12c8e?.['ref'] ||
                  _0xb12c8e?.['sceneRef'] ||
                  _0xb12c8e?.['scene_ref'] ||
                  _0xb12c8e?.['id'],
              ) || _0x32f8d1 + '-scene-' + (_0x5d95f2 + 0x1),
            heading: normalizeText(
              _0xb12c8e?.['heading'] ||
                _0xb12c8e?.['sceneHeading'] ||
                _0xb12c8e?.['scene_heading'] ||
                _0xb12c8e?.['location'] ||
                _0xb12c8e?.['title'],
            ),
            characters: _0x1d842b,
            body: normalizeStoryEpisodeScriptSceneBody(
              normalizeStoryEpisodeScriptBodyValue(
                _0xb12c8e?.['body'] || _0xb12c8e?.['content'] || _0xb12c8e?.['script'] || _0xb12c8e?.['text'],
              ),
              _0x1d842b,
            ),
          };
        })['filter']((_0x23612f) => _0x23612f['heading'] && _0x23612f['body'])
      : [];
  if (!_0x554249['length']) throw new Error('Agent\x20返回结果没有可用场次。');
  const _0x39992d = Math['max'](0x1, Math['trunc'](Number(episodeNumber) || 0x1)),
    _0x32e4e5 = [
      '## 第' + _0x39992d + '集：' + _0x54f861,
      ..._0x554249['map']((_0x5463b8, _0x555722) => formatEpisodeSceneText(_0x5463b8, _0x39992d, _0x555722)),
    ]['join']('\x0a'),
    _0x39e3fd = normalizeStoryContinuityFacts(
      _0x2ab58c['continuityFacts'] || _0x2ab58c['facts'] || _0x2ab58c['continuity_facts'],
    ),
    _0x9c95a3 = _0x39e3fd['length'] ? _0x39e3fd : normalizeStoryContinuityFacts(fallbackContinuityFacts),
    _0x41a28d = normalizeStoryContinuityState(
      _0x2ab58c['endingState'] ||
        _0x2ab58c['finalState'] ||
        _0x2ab58c['continuityState'] ||
        _0x2ab58c['ending_state'],
    ),
    _0x9fffc = hasStoryContinuityState(_0x41a28d)
      ? _0x41a28d
      : normalizeStoryContinuityState(fallbackEndingState);
  if (requireEndingState && !hasStoryContinuityState(_0x9fffc))
    throw new Error('Agent\x20返回的完整分集剧本缺少有效结束状态。');
  return {
    schemaVersion: STORY_EPISODE_SCRIPT_SCHEMA_VERSION,
    episodeRef: _0x32f8d1,
    title: _0x54f861,
    scenes: _0x554249,
    fullText: _0x32e4e5,
    continuityFacts: _0x9c95a3,
    endingState: _0x9fffc,
    ...(_0x5af09c ? { recovery: _0x5af09c } : {}),
  };
}
function getStoryEpisodeScriptFinishReason(_0x4ba301) {
  return normalizeText(
    _0x4ba301?.['finishReason'] ||
      _0x4ba301?.['finish_reason'] ||
      _0x4ba301?.['choices']?.[0x0]?.['finish_reason'] ||
      _0x4ba301?.['data']?.['choices']?.[0x0]?.['finish_reason'],
  )['toLowerCase']();
}
function serializeStoryEpisodeScriptResponse(_0x39291f) {
  const _0x495ee9 = getResultText(_0x39291f);
  return typeof _0x495ee9 === 'string' ? _0x495ee9 : stringifyStoryEpisodeDevResponse(_0x495ee9);
}
function normalizeStoryEpisodeScriptRawResponses(_0x2b05b2 = null) {
  const _0x1945a7 = Array['isArray'](_0x2b05b2?.['rawResponses'])
    ? _0x2b05b2['rawResponses']
    : normalizeText(_0x2b05b2?.['rawResponse'])
      ? [
          {
            attempt: _0x2b05b2?.['attempts'],
            phase: 'generation',
            finishReason: _0x2b05b2?.['finishReason'],
            text: _0x2b05b2['rawResponse'],
          },
        ]
      : [];
  return _0x1945a7['map']((_0x5cfc71, _0x2dc27b) => ({
    attempt: Math['max'](0x1, Math['trunc'](Number(_0x5cfc71?.['attempt']) || _0x2dc27b + 0x1)),
    phase: normalizeText(_0x5cfc71?.['phase']) || (_0x2dc27b ? 'repair' : 'generation'),
    finishReason: normalizeText(_0x5cfc71?.['finishReason'])['toLowerCase'](),
    text:
      typeof _0x5cfc71?.['text'] === 'string'
        ? _0x5cfc71['text']
        : stringifyStoryEpisodeDevResponse(_0x5cfc71?.['text']),
  }));
}
function createStoryEpisodeScriptRawResponseRecord(
  _0x293bd4,
  { attempt: attempt = 0x1, phase: phase = 'generation' } = {},
) {
  return {
    attempt: Math['max'](0x1, Math['trunc'](Number(attempt) || 0x1)),
    phase: normalizeText(phase) || 'generation',
    finishReason: getStoryEpisodeScriptFinishReason(_0x293bd4),
    text: serializeStoryEpisodeScriptResponse(_0x293bd4),
  };
}
function selectStoryEpisodeScriptRepairSource(_0x28144c = []) {
  return _0x28144c['reduce']((_0x5af74b, _0x2cd2aa) => {
    if (!normalizeText(_0x2cd2aa?.['text'])) return _0x5af74b;
    if (!_0x5af74b || String(_0x2cd2aa['text'])['length'] >= String(_0x5af74b['text'])['length'])
      return _0x2cd2aa;
    return _0x5af74b;
  }, null);
}
function buildStoryEpisodeScriptRepairPrompt({
  episode: episode = {},
  episodeRef: episodeRef = 'episode-1',
  episodeNumber: episodeNumber = 0x1,
  rejectedResponse: rejectedResponse = '',
  finishReason: finishReason = '',
  error: error = null,
} = {}) {
  const _0x18b891 = normalizeStoryContinuityState(episode?.['endingState']);
  return JSON['stringify']({
    task: 'repair_story_episode_script_response',
    episode: {
      ref: normalizeText(episodeRef) || 'episode-' + episodeNumber,
      number: Math['max'](0x1, Math['trunc'](Number(episodeNumber) || 0x1)),
      title: normalizeText(episode?.['title']),
      synopsis: normalizeText(episode?.['synopsis']),
      hook: normalizeText(episode?.['hook']),
      continuityFacts: normalizeStoryContinuityFacts(episode?.['continuityFacts']),
      requiredEndingState: _0x18b891,
    },
    issue: {
      reason: normalizeText(error?.['message'] || error) || '上一次返回无法完整解析',
      finishReason: normalizeText(finishReason),
    },
    rejectedResponse: String(rejectedResponse || ''),
    instructions: [
      '优先做最小修改，完整保留 rejectedResponse 中已经存在的场次正文、动作和对白。',
      '如果只是 JSON 语法或字段名错误，只修复语法和字段名，不改写剧情。',
      '如果返回在中途截断，只从截断位置继续，补完当前场次、本集钩子、continuityFacts 和 endingState。',
      '返回内容包含\x20episodeRef、title、scenes、continuityFacts、endingState\x20即可；不要添加解释。',
    ],
  });
}
function tryParseStoryEpisodeScriptResponse(_0x232679, _0x538667) {
  try {
    return { result: parseStoryEpisodeScriptResult(_0x232679, _0x538667), error: null };
  } catch (_0x39c2ec) {
    return { result: null, error: _0x39c2ec };
  }
}
function isCompleteStoryEpisodeScriptResponse(_0x212fbd) {
  return Boolean(
    _0x212fbd &&
    Array['isArray'](_0x212fbd['scenes']) &&
    _0x212fbd['scenes']['length'] &&
    normalizeText(_0x212fbd['fullText']) &&
    _0x212fbd['recovery']?.['incompleteJson'] !== !![],
  );
}
function chooseBestStoryEpisodeScriptResult(_0x469569 = []) {
  return (
    _0x469569['filter'](
      (_0x5c0874) => _0x5c0874 && Array['isArray'](_0x5c0874['scenes']) && _0x5c0874['scenes']['length'],
    )['sort'](
      (_0x486a8c, _0x485d39) =>
        Number(_0x485d39['scenes']['length'] || 0x0) - Number(_0x486a8c['scenes']['length'] || 0x0) ||
        normalizeText(_0x485d39['fullText'])['length'] - normalizeText(_0x486a8c['fullText'])['length'],
    )[0x0] || null
  );
}
function createStoryEpisodeScriptPartialError({
  episodeRef: episodeRef = 'episode-1',
  rawResponses: rawResponses = [],
  attempts: attempts = 0x1,
  parseResults: parseResults = [],
  cause: cause = null,
} = {}) {
  const _0xe1193c = normalizeText(cause?.['message'] || cause) || '返回无法完整解析',
    _0x3938e3 = {
      schemaVersion: STORY_EPISODE_SCRIPT_SCHEMA_VERSION,
      status: 'failed',
      episodeRef: normalizeText(episodeRef) || 'episode-1',
      attempts: Math['max'](
        0x1,
        Math['trunc'](Number(attempts) || 0x1),
        ...rawResponses['map']((_0x434925) => Math['trunc'](Number(_0x434925?.['attempt']) || 0x0)),
      ),
      rawResponses: rawResponses['map']((_0x5d89ce) => ({ ..._0x5d89ce })),
      bestEffort: chooseBestStoryEpisodeScriptResult(parseResults),
      lastError: {
        message: _0xe1193c,
        code: normalizeText(cause?.['code']),
        type: normalizeText(cause?.['type'] || cause?.['name']) || 'Error',
      },
    },
    _0x406b74 = new Error(
      '完整分集剧本返回仍不完整，已保存本次返回；再次点击时会优先修复，不会重新生成整集。' +
        (_0xe1193c ? '\x20' + _0xe1193c : ''),
    );
  return (
    (_0x406b74['name'] = 'StoryEpisodeScriptPartialError'),
    (_0x406b74['code'] = 'STORY_EPISODE_SCRIPT_PARTIAL'),
    (_0x406b74['partialResult'] = _0x3938e3),
    _0x406b74
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
  const _0x2bb150 = Math['max'](0x1, Math['trunc'](Number(episode?.['number']) || 0x1)),
    _0x5348a1 =
      normalizeText(episode?.['ref'] || episode?.['planningRef'] || episode?.['id']) ||
      'episode-' + _0x2bb150,
    _0x1a2b0f = buildStoryEpisodeScriptPrompt({
      project: project,
      episode: episode,
      previousEpisode: previousEpisode,
      nextEpisode: nextEpisode,
    }),
    _0x21e161 = {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: _0x1a2b0f,
      systemPrompt: STORY_EPISODE_SCRIPT_SYSTEM_PROMPT,
      temperature:
        normalizeStoryScriptMode(project?.['scriptMode']) === STORY_SCRIPT_MODE_NARRATION ? 0.35 : 0.45,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
    },
    _0x14f6a1 = {
      episodeRef: _0x5348a1,
      episodeNumber: _0x2bb150,
      episodeTitle: episode?.['title'],
      requireEndingState: !![],
      fallbackContinuityFacts: episode?.['continuityFacts'],
      fallbackEndingState: episode?.['endingState'],
    },
    _0x50f45e = normalizeStoryEpisodeScriptRawResponses(repairDraft),
    _0x5f3a92 = Math['max'](
      Math['trunc'](Number(repairDraft?.['attempts']) || 0x0),
      ..._0x50f45e['map']((_0xd66be1) => Math['trunc'](Number(_0xd66be1?.['attempt']) || 0x0)),
    ),
    _0x10b649 = [];
  let _0x2a1d99 = 0x0,
    _0x53e0ed = 0x0;
  const _0x351904 = () => _0x5f3a92 + ++_0x53e0ed,
    _0x392ec0 = async (_0x527ec2, _0x36e368) => {
      const _0x4f4603 = _0x351904(),
        _0x594687 = await invokeStoryGenerationRequest({
          request: request,
          requestPayload: _0x527ec2,
          stepId: _0x36e368,
          attempt: _0x4f4603,
          onInvocation: onInvocation,
          allowTruncatedOutput: !![],
          serializeResponse: serializeStoryEpisodeScriptResponse,
        });
      return (
        (_0x2a1d99 += 0x1),
        captureStoryEpisodeScriptDevResponse({
          response: _0x594687,
          attempt: _0x4f4603,
          episodeRef: _0x5348a1,
          episodeNumber: _0x2bb150,
          model: model,
          provider: provider,
        }),
        _0x50f45e['push'](
          createStoryEpisodeScriptRawResponseRecord(_0x594687, { attempt: _0x4f4603, phase: _0x36e368 }),
        ),
        _0x594687
      );
    },
    _0x8482c7 = (_0x43ee2e) =>
      ensureStoryEpisodeScriptTiming({
        scriptResult: _0x43ee2e,
        episode: episode,
        review: (_0x949141, _0x2db165, _0x4dd1dd) =>
          requestStoryEpisodeScriptTimingReview({
            request: request,
            requestPayload: _0x21e161,
            episode: episode,
            script: _0x949141,
            onInvocation: onInvocation,
            attempt: _0x351904(),
            phase: _0x2db165,
            priorReview: _0x4dd1dd,
          }),
      }),
    _0x2e53ea = JSON['parse'](_0x1a2b0f),
    _0x49d6d5 = async (_0x1b9f0b) => {
      const _0x469498 = await _0x8482c7(_0x1b9f0b);
      if (normalizeText(_0x469498?.['timingReview']?.['verdict']) !== 'needs_revision') return _0x469498;
      onProgress?.({
        stage: 'revising-episode-script-content',
        current: _0x2bb150,
        total: _0x2bb150,
        message: '第\x20' + _0x2bb150 + ' 集内容审查未通过，正在按分集大纲和连续性自动精简修订',
      });
      const _0x111e11 = {
        ..._0x21e161,
        prompt: buildStoryEpisodeScriptContentRevisionPrompt({
          grounding: _0x2e53ea,
          script: _0x469498,
          timingReview: _0x469498['timingReview'],
        }),
        systemPrompt: STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT,
        temperature: 0.2,
      };
      try {
        const _0xd59a87 = await _0x392ec0(_0x111e11, 'content-revision'),
          _0x3c1671 = tryParseStoryEpisodeScriptResponse(_0xd59a87, _0x14f6a1);
        if (_0x3c1671['result']) _0x10b649['push'](_0x3c1671['result']);
        if (!isCompleteStoryEpisodeScriptResponse(_0x3c1671['result']))
          return preserveStoryEpisodeScriptWithoutTimingReview(
            _0x469498,
            episode,
            _0x3c1671['error'] || new Error('内容修订返回不完整。'),
          );
        const _0x353d45 = await _0x8482c7(_0x3c1671['result']);
        if (normalizeText(_0x353d45?.['timingReview']?.['verdict']) === 'needs_revision')
          return preserveStoryEpisodeScriptWithoutTimingReview(
            _0x469498,
            episode,
            new Error(
              '自动内容修订后仍未通过：' +
                (normalizeText(_0x353d45?.['timingReview']?.['reason']) || '存在重复内容'),
            ),
          );
        return _0x353d45;
      } catch (_0x557dd1) {
        return preserveStoryEpisodeScriptWithoutTimingReview(_0x469498, episode, _0x557dd1);
      }
    },
    _0x173d77 = repairDraft?.['skipPostGenerationReview'] === !![],
    _0x70bad4 = async ({
      rejectedResponse: _0x286383,
      finishReason: finishReason = '',
      cause: cause = null,
    } = {}) => {
      onProgress?.({
        stage: 'repairing-episode-script',
        current: _0x2bb150,
        total: _0x2bb150,
        message: '第\x20' + _0x2bb150 + ' 集返回格式异常，正在修复已有正文',
      });
      const _0x577368 = {
        ..._0x21e161,
        prompt: buildStoryEpisodeScriptRepairPrompt({
          episode: episode,
          episodeRef: _0x5348a1,
          episodeNumber: _0x2bb150,
          rejectedResponse: _0x286383,
          finishReason: finishReason,
          error: cause,
        }),
        systemPrompt: STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT,
        temperature: 0.15,
      };
      let _0x3ed767;
      try {
        _0x3ed767 = await _0x392ec0(_0x577368, 'repair');
      } catch (_0x242c39) {
        throw createStoryEpisodeScriptPartialError({
          episodeRef: _0x5348a1,
          rawResponses: _0x50f45e,
          attempts: _0x5f3a92 + _0x2a1d99 + 0x1,
          parseResults: _0x10b649,
          cause: _0x242c39,
        });
      }
      const _0x3318b7 = tryParseStoryEpisodeScriptResponse(_0x3ed767, _0x14f6a1);
      if (_0x3318b7['result']) _0x10b649['push'](_0x3318b7['result']);
      if (isCompleteStoryEpisodeScriptResponse(_0x3318b7['result'])) return _0x49d6d5(_0x3318b7['result']);
      throw createStoryEpisodeScriptPartialError({
        episodeRef: _0x5348a1,
        rawResponses: _0x50f45e,
        attempts: _0x5f3a92 + _0x2a1d99,
        parseResults: _0x10b649,
        cause: _0x3318b7['error'] || new Error('修复返回仍然被截断。'),
      });
    };
  for (const _0x548594 of [..._0x50f45e]['reverse']()) {
    if (!_0x548594?.['text']) continue;
    const _0x42decb = tryParseStoryEpisodeScriptResponse(_0x548594['text'], _0x14f6a1);
    if (_0x42decb['result']) _0x10b649['push'](_0x42decb['result']);
    if (isCompleteStoryEpisodeScriptResponse(_0x42decb['result']))
      return _0x173d77
        ? preserveStoryEpisodeScriptWithoutTimingReview(
            _0x42decb['result'],
            episode,
            new Error('上次正文生成后的时长审查被中断。'),
          )
        : _0x49d6d5(_0x42decb['result']);
  }
  const _0x39bd9c = selectStoryEpisodeScriptRepairSource(_0x50f45e);
  if (_0x39bd9c?.['text']) {
    const _0x3440bf = tryParseStoryEpisodeScriptResponse(_0x39bd9c['text'], _0x14f6a1);
    return _0x70bad4({
      rejectedResponse: _0x39bd9c['text'],
      finishReason: _0x39bd9c['finishReason'],
      cause: _0x3440bf['error'] || new Error('上次返回在完整剧本结束前被截断。'),
    });
  }
  onProgress?.({
    stage: 'writing-episode-script',
    current: _0x2bb150,
    total: _0x2bb150,
    message: '正在生成第 ' + _0x2bb150 + ' 集完整剧本',
  });
  const _0x5cd4d4 = await _0x392ec0(_0x21e161, 'generation'),
    _0x998e92 = tryParseStoryEpisodeScriptResponse(_0x5cd4d4, _0x14f6a1);
  if (_0x998e92['result']) _0x10b649['push'](_0x998e92['result']);
  if (isCompleteStoryEpisodeScriptResponse(_0x998e92['result'])) return _0x49d6d5(_0x998e92['result']);
  return _0x70bad4({
    rejectedResponse: serializeStoryEpisodeScriptResponse(_0x5cd4d4),
    finishReason: getStoryEpisodeScriptFinishReason(_0x5cd4d4),
    cause: _0x998e92['error'] || new Error('首次返回在完整剧本结束前被截断。'),
  });
}
function normalizePlanningAssetSummary(_0x5a638d = {}, _0x4dc282 = 0x0) {
  const _0x4a3db6 = ['scene', 'prop']['includes'](_0x5a638d['kind']) ? _0x5a638d['kind'] : 'character',
    _0x224dc6 = Array['isArray'](_0x5a638d?.['appearances']) ? _0x5a638d['appearances'] : [],
    _0x110458 = _0x224dc6['map']((_0xb333b6) => ({
      ref: resolveStoryGenerationAppearanceRef(_0xb333b6),
      name: normalizeText(_0xb333b6?.['name']),
      description: normalizeText(_0xb333b6?.['description']),
      prompt: normalizeText(_0xb333b6?.['prompt']),
      sourceEpisodeRefs: normalizeStringArray(_0xb333b6?.['sourceEpisodeRefs']),
      sourceSceneRefs: normalizeStringArray(_0xb333b6?.['sourceSceneRefs']),
    }))['filter']((_0x2c2117) => _0x2c2117['ref'] && (_0x2c2117['name'] || _0x2c2117['prompt'])),
    _0x4c54bb = normalizeText(_0x5a638d?.['baseAppearanceRef']),
    _0xcaa671 = normalizeText(_0x5a638d?.['baseAppearanceId']),
    _0x8d5aea = _0x4c54bb || _0xcaa671,
    _0xa737fe = _0x8d5aea
      ? _0x224dc6['find']((_0xc8c806) =>
          [_0xc8c806?.['id'], _0xc8c806?.['ref'], _0xc8c806?.['planningRef']]['some'](
            (_0x566162) => normalizeText(_0x566162) === _0x8d5aea,
          ),
        )
      : null,
    _0x1106e2 = normalizeStoryAssetReference(
      resolveStoryGenerationAppearanceRef(_0xa737fe),
      _0x110458['length'] === 0x1 ? _0x110458[0x0]['ref'] : '',
    );
  return {
    ref: resolveStoryGenerationAssetRef(_0x5a638d, _0x4dc282),
    kind: _0x4a3db6,
    name: normalizeText(_0x5a638d['name']),
    role: normalizeText(_0x5a638d['role']),
    description: normalizeText(_0x5a638d['description']),
    baseAppearanceRef: _0x1106e2,
    sourceEpisodeRefs: normalizeStringArray(_0x5a638d?.['sourceEpisodeRefs']),
    sourceSceneRefs: normalizeStringArray(_0x5a638d?.['sourceSceneRefs']),
    appearances: _0x110458,
  };
}
function compactStoryEpisodePromptAsset(
  _0x51976f = {},
  { includeVisualDetails: includeVisualDetails = ![], includeBindings: includeBindings = ![] } = {},
) {
  const _0x458567 = normalizeText(_0x51976f?.['kind']),
    _0x408d0c = includeVisualDetails && _0x458567 !== 'character',
    _0x35ff0e = (Array['isArray'](_0x51976f?.['appearances']) ? _0x51976f['appearances'] : [])['map'](
      (_0x396716) => ({
        ref: normalizeText(_0x396716?.['ref']),
        name: normalizeText(_0x396716?.['name']),
        ...(includeBindings && normalizeStringArray(_0x396716?.['sourceEpisodeRefs'])['length']
          ? { sourceEpisodeRefs: normalizeStringArray(_0x396716['sourceEpisodeRefs']) }
          : {}),
        ...(includeBindings && normalizeStringArray(_0x396716?.['sourceSceneRefs'])['length']
          ? { sourceSceneRefs: normalizeStringArray(_0x396716['sourceSceneRefs']) }
          : {}),
        ...(_0x408d0c && normalizeText(_0x396716?.['description'])
          ? { description: normalizeText(_0x396716['description']) }
          : {}),
        ...(_0x408d0c && normalizeText(_0x396716?.['prompt'])
          ? { prompt: normalizeText(_0x396716['prompt']) }
          : {}),
      }),
    );
  return {
    ref: normalizeText(_0x51976f?.['ref']),
    kind: _0x458567,
    name: normalizeText(_0x51976f?.['name']),
    ...(includeBindings && normalizeText(_0x51976f?.['baseAppearanceRef'])
      ? { baseAppearanceRef: normalizeText(_0x51976f['baseAppearanceRef']) }
      : {}),
    ...(includeBindings && normalizeStringArray(_0x51976f?.['sourceEpisodeRefs'])['length']
      ? { sourceEpisodeRefs: normalizeStringArray(_0x51976f['sourceEpisodeRefs']) }
      : {}),
    ...(includeBindings && normalizeStringArray(_0x51976f?.['sourceSceneRefs'])['length']
      ? { sourceSceneRefs: normalizeStringArray(_0x51976f['sourceSceneRefs']) }
      : {}),
    ...(_0x408d0c && normalizeText(_0x51976f?.['description'])
      ? { description: normalizeText(_0x51976f['description']) }
      : {}),
    appearances: _0x35ff0e,
  };
}
function createStoryEpisodeSplitCompactAssetCatalog(_0x292ef0 = []) {
  const _0x13aa94 = [];
  return (
    (Array['isArray'](_0x292ef0) ? _0x292ef0 : [])['forEach']((_0x158897) => {
      const _0x3a906b = Array['isArray'](_0x158897?.['appearances'])
          ? _0x158897['appearances']['filter']((_0x4205fd) => normalizeText(_0x4205fd?.['ref']))
          : [],
        _0x16a6d7 = _0x3a906b['length']
          ? [..._0x3a906b]['sort']((_0x46b474, _0x309083) => {
              const _0x472f4d = normalizeText(_0x158897?.['baseAppearanceRef']);
              return (
                Number(normalizeText(_0x309083?.['ref']) === _0x472f4d) -
                Number(normalizeText(_0x46b474?.['ref']) === _0x472f4d)
              );
            })
          : [null];
      _0x16a6d7['forEach']((_0x2b1f88) => {
        const _0xa505da = 'a' + (_0x13aa94['length'] + 0x1),
          _0x249784 = normalizeText(_0x2b1f88?.['name']);
        _0x13aa94['push']({
          code: _0xa505da,
          kind: normalizeText(_0x158897?.['kind']),
          name: [normalizeText(_0x158897?.['name']), _0x249784]['filter'](Boolean)['join']('·'),
          assetName: normalizeText(_0x158897?.['name']),
          ref: normalizeText(_0x2b1f88?.['ref']) || normalizeText(_0x158897?.['ref']),
          assetRef: normalizeText(_0x158897?.['ref']),
        });
      });
    }),
    _0x13aa94
  );
}
function createStoryEpisodeSplitCompactDialogueCatalog(_0x4e602d = {}, _0x4ce0fc = []) {
  let _0x2c451f = [];
  try {
    _0x2c451f = normalizeStoryEpisodeSplitSourceBeats(_0x4e602d)['flatMap']((_0x1c3334) =>
      Array['isArray'](_0x1c3334?.['dialogueUnits']) ? _0x1c3334['dialogueUnits'] : [],
    );
  } catch {
    _0x2c451f = extractStoryEpisodeDialogueUnits(
      _0x4e602d?.['script']?.['fullText'] ||
        _0x4e602d?.['fullScript'] ||
        _0x4e602d?.['scriptText'] ||
        _0x4e602d?.['synopsis'] ||
        _0x4e602d?.['content'],
      getStoryEpisodeReferenceAliases(_0x4e602d)[0x0] || 'episode-1',
    );
  }
  const _0x4b4eef = createStoryEpisodeSplitCompactAssetCatalog(_0x4ce0fc)['filter'](
    (_0x336226) => _0x336226['kind'] === 'character',
  );
  return _0x2c451f['map']((_0x145ae6, _0x760c78) => {
    const _0xa42796 = normalizeText(_0x145ae6?.['speaker']),
      _0x1219b0 = _0xa42796
        ? _0x4b4eef['filter']((_0x568ada) =>
            getStoryEpisodeSplitAssetNameAliases(_0x568ada['assetName'])['some'](
              (_0x5b4c86) => _0x5b4c86 === _0xa42796,
            ),
          )
        : [];
    return {
      code: 'q' + (_0x760c78 + 0x1),
      ...(_0xa42796 ? { speaker: _0xa42796 } : {}),
      ...(_0x1219b0['length'] === 0x1 ? { speakerAssetCode: _0x1219b0[0x0]['code'] } : {}),
      text: normalizeText(_0x145ae6?.['text']),
    };
  })['filter']((_0x19e13b) => _0x19e13b['text']);
}
function decodeStoryEpisodeSplitCompactDialogue(
  _0x38d45b,
  { dialogueByCode: dialogueByCode = new Map(), assetByCode: assetByCode = new Map() } = {},
) {
  const _0x3a33a5 = normalizeText(_0x38d45b);
  if (!_0x3a33a5) return { text: '', assetCode: '' };
  const [_0x36d778, _0x43fc0a = ''] = _0x3a33a5['split']('@')['map'](normalizeText),
    _0x5c608e = dialogueByCode['get'](_0x36d778);
  if (!_0x5c608e) return { text: _0x3a33a5, assetCode: '' };
  const _0x1ea1e2 = assetByCode['get'](_0x43fc0a),
    _0x1f60be = _0x1ea1e2?.['kind'] === 'character' ? _0x43fc0a : '',
    _0x237882 = _0x1f60be || normalizeText(_0x5c608e?.['speakerAssetCode']),
    _0x3daa62 = assetByCode['get'](_0x237882),
    _0x293700 = normalizeText(_0x3daa62?.['assetName']) || normalizeText(_0x5c608e?.['speaker']) || '人物';
  return { text: _0x293700 + '：“' + _0x5c608e['text'] + '”', assetCode: _0x237882 };
}
function expandStoryEpisodeSplitCompactData(
  _0x166d24 = {},
  { episodeRef: episodeRef = '', episode: episode = {}, assets: assets = [] } = {},
) {
  if (!_0x166d24 || typeof _0x166d24 !== 'object' || !Array['isArray'](_0x166d24['clips'])) return _0x166d24;
  const _0x16d6e8 = createStoryEpisodeSplitCompactAssetCatalog(assets),
    _0x409eb6 = createStoryEpisodeSplitCompactSceneCatalog(assets),
    _0x1dd192 = new Map([..._0x16d6e8, ..._0x409eb6]['map']((_0x2a0da0) => [_0x2a0da0['code'], _0x2a0da0])),
    _0x2a59c4 = _0x16d6e8['filter'](
      (_0x17a846, _0x913559) =>
        _0x16d6e8['findIndex']((_0x53bb14) => _0x53bb14['assetRef'] === _0x17a846['assetRef']) === _0x913559,
    ),
    _0x25399c = createStoryEpisodeSplitCompactDialogueCatalog(episode, assets),
    _0x53f000 = new Map(_0x25399c['map']((_0x46ca03) => [_0x46ca03['code'], _0x46ca03]));
  return {
    ..._0x166d24,
    episodeRef: normalizeText(_0x166d24['episodeRef']) || episodeRef,
    clips: _0x166d24['clips']['map']((_0x58872a, _0x2e1fca) => ({
      ..._0x58872a,
      ref: normalizeText(_0x58872a?.['ref']) || 'clip-' + (_0x2e1fca + 0x1),
      shots: (Array['isArray'](_0x58872a?.['shots']) ? _0x58872a['shots'] : [])['map']((_0x528326) => {
        if (!_0x528326 || typeof _0x528326 !== 'object' || Array['isArray'](_0x528326)) return _0x528326;
        const _0x1d512a = ['d', 'r', 'v', 'c', 'q', 'o', 'a']['some']((_0x45bfb8) =>
          Object['prototype']['hasOwnProperty']['call'](_0x528326, _0x45bfb8),
        );
        if (!_0x1d512a) return _0x528326;
        const _0x4f15b0 = Math['trunc'](Number(_0x528326['c'])),
          _0x1ee924 = episode['replication']?.['sourceAnalysis']
            ? normalizeText(_0x528326['c'])
            : Number['isInteger'](_0x4f15b0) && STORY_EPISODE_SPLIT_CAMERA_PRESETS[_0x4f15b0]
              ? STORY_EPISODE_SPLIT_CAMERA_PRESETS[_0x4f15b0]
              : normalizeText(_0x528326['c']) || STORY_EPISODE_SPLIT_CAMERA_PRESETS[0x0],
          _0x46eac8 = decodeStoryEpisodeSplitCompactDialogue(_0x528326['q'], {
            dialogueByCode: _0x53f000,
            assetByCode: _0x1dd192,
          }),
          _0x1cc6da = normalizeText(_0x528326['v']),
          _0x2d7f06 = _0x2a59c4['filter']((_0x336d4b) =>
            getStoryEpisodeSplitAssetNameAliases(_0x336d4b['assetName'])['some'](
              (_0x5b9758) => _0x5b9758 && _0x1cc6da['includes'](_0x5b9758),
            ),
          )['map']((_0x4c2ef1) => _0x4c2ef1['code']),
          _0x26f233 = normalizeStringArray([
            _0x46eac8['assetCode'],
            ..._0x2d7f06,
            ...normalizeStringArray(_0x528326['r']),
            normalizeText(_0x58872a?.['s']),
          ])
            ['map']((_0x2e6b82) => _0x1dd192['get'](_0x2e6b82))
            ['filter'](Boolean),
          _0x3e6eb3 = Array['isArray'](_0x528326['assetUsages'])
            ? _0x528326['assetUsages']['map']((_0x2ce905) => ({ ..._0x2ce905 }))
            : [
                ...new Map(
                  _0x26f233['map']((_0x15e7f7) => [
                    _0x15e7f7['assetRef'] + ':' + _0x15e7f7['ref'],
                    {
                      assetRef: _0x15e7f7['assetRef'],
                      appearanceRef: _0x15e7f7['ref'] === _0x15e7f7['assetRef'] ? '' : _0x15e7f7['ref'],
                    },
                  ]),
                )['values'](),
              ];
        return {
          durationSec: _0x528326['d'],
          ...replicationVisualFields(_0x528326),
          ...(Object['prototype']['hasOwnProperty']['call'](_0x528326, 'startSec')
            ? { startSec: _0x528326['startSec'] }
            : {}),
          ...(Object['prototype']['hasOwnProperty']['call'](_0x528326, 'endSec')
            ? { endSec: _0x528326['endSec'] }
            : {}),
          assetUsages: _0x3e6eb3,
          visual: _0x1cc6da,
          camera: _0x1ee924,
          dialogue: _0x46eac8['text'],
          voiceover: normalizeText(_0x528326['o']),
          audio: normalizeText(_0x528326['a']),
        };
      }),
    })),
  };
}
function isStoryEpisodeEditorialMarker(_0x5a487c = '') {
  return /^(?:[（(]\s*)?(?:本集完|本章完|全剧终|未完待续|待续|完)(?:\s*[）)])?[。.!！]?$/iu['test'](
    normalizeText(_0x5a487c),
  );
}
function sanitizeStoryEpisodeSplitSourceText(_0x5cc460 = '') {
  return String(_0x5cc460 || '')
    ['split'](/\r?\n/u)
    ['filter']((_0x52d191) => !isStoryEpisodeEditorialMarker(_0x52d191))
    ['join']('\x0a')
    ['trim']();
}
function getStoryEpisodeSplitSourceSceneMetadata(_0x26b1e9 = {}) {
  return (Array['isArray'](_0x26b1e9?.['script']?.['scenes']) ? _0x26b1e9['script']['scenes'] : [])
    ['map']((_0x1b096a) => ({
      heading: normalizeText(_0x1b096a?.['heading']),
      characters: normalizeStringArray(_0x1b096a?.['characters']),
    }))
    ['filter']((_0x137f5f) => _0x137f5f['heading'] || _0x137f5f['characters']['length']);
}
function isStoryEpisodeSplitSourceMetadataLine(_0x2aabd3 = '', _0x5499de = {}) {
  const _0x4734e8 = normalizeText(_0x2aabd3);
  if (!_0x4734e8) return ![];
  if (/[。！？!?；;“”「」]|\.(?:\s|$)/u['test'](_0x4734e8)) return ![];
  const _0x746973 = new Set(
    getStoryEpisodeSplitSourceSceneMetadata(_0x5499de)
      ['map']((_0x131ecc) => _0x131ecc['heading'])
      ['filter'](Boolean),
  );
  return (
    _0x746973['has'](_0x4734e8) ||
    /^#{1,6}\s*(?:第?\s*\d+\s*集|场(?:景)?\s*\d)/u['test'](_0x4734e8) ||
    /^(?:出场人物|人物列表|时间|地点|场景)[：:]/u['test'](_0x4734e8)
  );
}
function sanitizeStoryEpisodeSplitPromptText(_0x278c77 = '', _0x5b9130 = {}) {
  return sanitizeStoryEpisodeSplitSourceText(_0x278c77)
    ['split'](/\r?\n/u)
    ['filter']((_0x2d9787) => !isStoryEpisodeSplitSourceMetadataLine(_0x2d9787, _0x5b9130))
    ['join']('\x0a')
    ['trim']();
}
function filterStoryEpisodeBlueprintEpisodeBindings(_0x3a49a3 = [], _0x4e3aa3 = []) {
  const _0x94b4ac = new Set(normalizeStringArray(_0x4e3aa3));
  return normalizeStringArray(_0x3a49a3)['filter']((_0x270743) => _0x94b4ac['has'](_0x270743));
}
function filterStoryEpisodeBlueprintSceneBindings(
  _0x4cde61 = [],
  _0x16c04e = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  const _0x504222 = normalizeStringArray(_0x16c04e);
  return normalizeStringArray(_0x4cde61)['filter']((_0xc74e18) =>
    _0x504222['some']((_0x2d15f8) => storyEpisodeSourceSceneRefsMatch(_0xc74e18, _0x2d15f8, episodeRefs)),
  );
}
function compactStoryEpisodeBlueprintAsset(
  _0x15dbd8 = {},
  { episodeRefs: episodeRefs = [], sourceSceneRefs: sourceSceneRefs = [] } = {},
) {
  const _0x4d15ba = compactStoryEpisodePromptAsset(_0x15dbd8),
    _0x30c53e = (_0x23b258 = {}) => {
      const _0x29080e = normalizeStringArray(_0x23b258?.['sourceEpisodeRefs']),
        _0x467af3 = filterStoryEpisodeBlueprintEpisodeBindings(_0x29080e, episodeRefs),
        _0x4b37f0 =
          _0x29080e['length'] && !_0x467af3['length']
            ? []
            : filterStoryEpisodeBlueprintSceneBindings(_0x23b258?.['sourceSceneRefs'], sourceSceneRefs, {
                episodeRefs: episodeRefs,
              });
      return {
        ...(_0x467af3['length'] ? { sourceEpisodeRefs: _0x467af3 } : {}),
        ...(_0x4b37f0['length'] ? { sourceSceneRefs: _0x4b37f0 } : {}),
      };
    },
    _0x152cf7 = new Map(
      (Array['isArray'](_0x15dbd8?.['appearances']) ? _0x15dbd8['appearances'] : [])['map']((_0x4b91a6) => [
        normalizeText(_0x4b91a6?.['ref']),
        _0x4b91a6,
      ]),
    );
  return {
    ..._0x4d15ba,
    ...(normalizeText(_0x15dbd8?.['baseAppearanceRef'])
      ? { baseAppearanceRef: normalizeText(_0x15dbd8['baseAppearanceRef']) }
      : {}),
    ..._0x30c53e(_0x15dbd8),
    appearances: _0x4d15ba['appearances']['map']((_0x36cb97) => ({
      ..._0x36cb97,
      ..._0x30c53e(_0x152cf7['get'](_0x36cb97['ref'])),
    })),
  };
}
function buildStoryEpisodeSplitAssetCatalog(_0x47e46e = [], _0x13c3a3 = []) {
  const _0x3a4941 = new Map(),
    _0x58b3ae = new Map();
  for (const _0x4fb8d4 of Array['isArray'](_0x47e46e) ? _0x47e46e : []) {
    const _0x21d3bb = normalizeStoryAssetReference(_0x4fb8d4?.['ref'], '');
    if (!_0x21d3bb) continue;
    const _0xed8bb7 = [];
    for (const _0x2edd3a of Array['isArray'](_0x4fb8d4?.['appearances']) ? _0x4fb8d4['appearances'] : []) {
      const _0x3bfaae = normalizeStoryAssetReference(_0x2edd3a?.['ref'], '');
      if (!_0x3bfaae) continue;
      _0xed8bb7['push'](_0x3bfaae);
      const _0xd7f742 = _0x58b3ae['get'](_0x3bfaae) || new Set();
      (_0xd7f742['add'](_0x21d3bb), _0x58b3ae['set'](_0x3bfaae, _0xd7f742));
    }
    const _0x81caf4 = ['scene', 'prop']['includes'](_0x4fb8d4?.['kind']) ? _0x4fb8d4['kind'] : 'character',
      _0x1cb95e = _0xed8bb7['includes'](_0x21d3bb + '-appearance-1') ? _0x21d3bb + '-appearance-1' : '';
    _0x3a4941['set'](_0x21d3bb, {
      assetRef: _0x21d3bb,
      kind: _0x81caf4,
      name: normalizeText(_0x4fb8d4?.['name']),
      appearanceRefs: _0xed8bb7,
      defaultAppearanceRef:
        normalizeStoryAssetReference(_0x4fb8d4?.['baseAppearanceRef'], '') ||
        _0x1cb95e ||
        (_0xed8bb7['length'] === 0x1 ? _0xed8bb7[0x0] : ''),
    });
  }
  for (const _0x279eca of normalizeStringArray(_0x13c3a3)) {
    !_0x3a4941['has'](_0x279eca) &&
      _0x3a4941['set'](_0x279eca, {
        assetRef: _0x279eca,
        kind: 'unknown',
        name: '',
        appearanceRefs: [],
        defaultAppearanceRef: '',
      });
  }
  return { assetByRef: _0x3a4941, appearanceOwnerRefsByRef: _0x58b3ae };
}
function getStoryEpisodeSplitAssetNameAliases(_0xf023b4 = '') {
  const _0x5c3beb = normalizeText(_0xf023b4);
  if (!_0x5c3beb) return [];
  const _0x4ff725 = new Set([_0x5c3beb]),
    _0xdfc760 = normalizeText(_0x5c3beb['split'](/[（(]/u, 0x1)[0x0]);
  if (_0xdfc760) _0x4ff725['add'](_0xdfc760);
  const _0x3ab934 = [..._0x5c3beb['matchAll'](/[（(]([^）)]+)[）)]/gu)]
    ['map']((_0x1bfa52) => normalizeText(_0x1bfa52[0x1]))
    ['filter'](Boolean);
  _0x3ab934['forEach']((_0x6278e1) => _0x4ff725['add'](_0x6278e1));
  const _0x574d3b = _0x5c3beb['replace'](
    /^(?:实习生|调查记者|记者|刑警|警官|警察|房东|高中生|师父|掌门|宗主|老板|总编|编辑)/u,
    '',
  );
  if (_0x574d3b) _0x4ff725['add'](_0x574d3b);
  return [..._0x4ff725];
}
function resolveStoryEpisodeSplitLegacyAppearanceOwner(_0x5a1605, _0x403fbb, _0x59fc3e, _0x3094f9 = {}) {
  const _0x347e90 = [...(_0x403fbb || [])];
  if (_0x347e90['length'] <= 0x1) return _0x347e90[0x0] || '';
  const _0x27bddd = [
      _0x3094f9?.['visual'],
      _0x3094f9?.['camera'],
      _0x3094f9?.['dialogue'],
      _0x3094f9?.['voiceover'],
    ]
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['join']('\x20'),
    _0x5ae475 = _0x347e90['filter']((_0x38373a) => {
      const _0x1538ba = _0x59fc3e['assetByRef']['get'](_0x38373a)?.['name'];
      return getStoryEpisodeSplitAssetNameAliases(_0x1538ba)['some'](
        (_0x26880f) => _0x26880f && _0x27bddd['includes'](_0x26880f),
      );
    });
  if (_0x5ae475['length'] === 0x1) return _0x5ae475[0x0];
  const _0x2aa2b5 = _0x347e90['filter']((_0x105e24) => _0x5a1605['startsWith'](_0x105e24 + '-appearance-'));
  return _0x2aa2b5['length'] === 0x1 ? _0x2aa2b5[0x0] : '';
}
function resolveStoryEpisodeSplitUnknownLegacyAppearance(_0x4c15bf, _0x3d0fac, _0x4094e6 = {}) {
  const _0x12d880 = [..._0x3d0fac['assetByRef']['values']()],
    _0x187354 = _0x12d880['filter']((_0x24ca39) =>
      _0x4c15bf['startsWith'](_0x24ca39['assetRef'] + '-appearance-'),
    );
  if (_0x187354['length'] === 0x1) return _0x187354[0x0];
  const _0x140289 = [
      _0x4094e6?.['visual'],
      _0x4094e6?.['camera'],
      _0x4094e6?.['dialogue'],
      _0x4094e6?.['voiceover'],
    ]
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['join']('\x20'),
    _0x17d092 = _0x12d880['filter']((_0x5c158d) =>
      getStoryEpisodeSplitAssetNameAliases(_0x5c158d['name'])['some'](
        (_0xf38f4a) => _0xf38f4a && _0x140289['includes'](_0xf38f4a),
      ),
    );
  return _0x17d092['length'] === 0x1 ? _0x17d092[0x0] : null;
}
function assertKnownReferences(_0x15eb2e, _0x4b254c, _0x23d5d6) {
  const _0x2d0fa5 = _0x15eb2e['filter']((_0x3ecaea) => !_0x4b254c['has'](_0x3ecaea));
  if (_0x2d0fa5['length'])
    throw new Error(_0x23d5d6 + '引用了不存在的资产：' + _0x2d0fa5['join']('、') + '。');
}
function normalizeStoryEpisodeSplitAssetUsage(_0x416129 = {}, _0x4ef6c1, _0x4bf20a) {
  const _0x5dda64 = normalizeStoryAssetReference(_0x416129?.['assetRef'], '');
  let _0x192013 = normalizeStoryAssetReference(_0x416129?.['appearanceRef'], '');
  if (!_0x5dda64) throw new Error(_0x4bf20a + '缺少\x20assetRef。');
  const _0x25eddf = _0x4ef6c1['assetByRef']['get'](_0x5dda64);
  if (!_0x25eddf) throw new Error(_0x4bf20a + '引用了不存在的资产：' + _0x5dda64 + '。');
  _0x192013 === _0x5dda64 &&
    !_0x25eddf['appearanceRefs']['includes'](_0x192013) &&
    (_0x192013 = _0x25eddf['defaultAppearanceRef']);
  if (_0x192013) {
    const _0x3cfa27 = _0x4ef6c1['appearanceOwnerRefsByRef']['get'](_0x192013);
    if (!_0x3cfa27?.['size']) throw new Error(_0x4bf20a + '引用了不存在的形象：' + _0x192013 + '。');
    if (!_0x25eddf['appearanceRefs']['includes'](_0x192013))
      throw new Error(_0x4bf20a + '的形象“' + _0x192013 + '”不属于资产“' + _0x5dda64 + '”。');
  } else {
    if (_0x25eddf['defaultAppearanceRef']) _0x192013 = _0x25eddf['defaultAppearanceRef'];
    else {
      if (_0x25eddf['appearanceRefs']['length'])
        throw new Error(_0x4bf20a + '必须为资产“' + _0x5dda64 + '”选择一个具体形象。');
    }
  }
  return { assetRef: _0x5dda64, appearanceRef: _0x192013 };
}
export function buildStoryAssetExtractionPrompt({
  project: project = {},
  aspectRatio: aspectRatio = '',
  visualStyle: visualStyle = '',
  assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
  requiredAssetNamesByKind: requiredAssetNamesByKind = null,
  candidateAssetsByKind: candidateAssetsByKind = null,
  requiredAssetsByKind: requiredAssetsByKind = null,
  compactOutput: compactOutput = ![],
} = {}) {
  const _0x2112c4 = resolveStoryPlanningConstraints(project),
    _0x5cbdc6 = normalizeStoryProjectInput(project);
  ((_0x5cbdc6['planning'] = _0x2112c4), assertStoryProjectInput(_0x5cbdc6));
  const _0x1d4ce8 = normalizeText(visualStyle) || _0x5cbdc6['visualStyle'],
    _0x5b3b6f = normalizeStringArray(assetKinds)['filter']((_0x454cea) =>
      STORY_ASSET_EXTRACTION_KINDS['includes'](_0x454cea),
    );
  if (!_0x5b3b6f['length']) throw new Error('资产提取至少需要指定角色、场景或道具中的一种。');
  const _0x5c3994 = { character: '角色', scene: '场景', prop: '道具' },
    _0x412f06 = createStoryAssetPromptContracts(
      _0x5b3b6f,
      requiredAssetNamesByKind,
      candidateAssetsByKind,
      requiredAssetsByKind,
      { includeClientKeys: compactOutput },
    ),
    _0xc1edf3 = {
      task: compactOutput
        ? 'complete_story_asset_visual_design_by_client_key'
        : _0x5b3b6f['length'] === 0x1
          ? 'extract_story_assets_by_kind'
          : 'extract_story_assets',
      schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
      assetKinds: _0x5b3b6f,
      project: { title: _0x5cbdc6['title'], chapters: _0x5cbdc6['chapters'] },
      visualDirection: {
        aspectRatio: normalizeText(aspectRatio) || _0x5cbdc6['aspectRatio'] || '16:9',
        style: _0x1d4ce8,
      },
      ..._0x412f06['payload'],
      requirements: [
        '本次只返回 ' +
          _0x5b3b6f['map']((_0x28ba5e) => _0x5c3994[_0x28ba5e])['join']('、') +
          '资产，禁止返回其他 kind。',
        ..._0x412f06['requirements'],
        ...(compactOutput
          ? [
              '这是紧凑视觉裁决模式：requiredAssets\x20与\x20candidateAssets\x20中的每一个\x20clientKey\x20都必须恰好返回一行，顺序不限，禁止省略、重复或编造\x20clientKey。',
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
              '角色\x20name\x20只能是姓名或简短身份名：优先使用原文姓名；没有姓名时给出不超过\x206\x20个汉字的身份短称，不得写人物介绍。',
              '角色 role 只能是主角、配角、反派或路人，必须依据人物在完整故事中的实际叙事作用分类；任何身份、关系、经历和叙事说明都写入 description。',
              STORY_ASSET_VOICE_DESCRIPTION_RULE,
              '每项资产至少提供一个信息充分、可直接用于图片生成的 appearance prompt，不得用‘符合设定’‘电影感人物’等空泛表述代替可见细节。',
              '角色\x20prompt\x20必须写清脸型、五官、肤色肤质、发型发色、身材体态、服装材质层次、鞋履和必要穿戴细节，并采用正面全身人物设定图构图。',
              '角色\x20prompt\x20只生成人设图，不生成人物剧照：聚焦脸部、发型、体态、服装、鞋履和必要穿戴细节，采用自然站立的正面全身人物设定图构图，不写剧情道具、动作表演、地点、家具、其他人物或剧情场面。',
              '最终\x20prompt\x20只能写需要呈现的正向视觉内容，不得复述任何规则、限制、处理流程、模型说明或其他元说明措辞。',
              '每个场景资产只能对应一个可独立复用的物理空间；遇到用“/”“／”等并列多个地点的复合场景标题，必须拆成多个原子场景资产，禁止直接复制复合标题作为资产名。',
              '场景 prompt 必须写清空间布局、结构材质、前中后景、关键陈设、光源与色温、时间天气、色彩、镜头视角及景别，并默认无人。',
              '道具 prompt 必须写清用途、轮廓、尺寸比例、材质工艺、颜色纹样、磨损、关键结构及产品设定构图，并默认无人手持。',
              '每个 appearance 都必须提供具体形象名称；角色首个形象也要按服装、身份或时期命名，禁止留空或使用笼统的‘基础形象’。角色显著换装、年龄变化或受伤状态可拆成多个 appearances；其他形象必须重复稳定的脸部、发型和体态特征，只修改剧情差异。同一物理空间在不同年代、完好/损毁、正常/异变、干燥/积水等显著状态下必须拆成多个场景 appearances；道具仍只保留一个形象。',
              _0x1d4ce8
                ? '每个\x20appearance\x20prompt\x20必须逐字以\x20visualDirection.style\x20的完整内容开头，再续写资产描述；不得省略、改写或重复此前缀。'
                : '提示词遵循项目视觉方向，但不要把画面比例写进角色身份描述。',
            ]),
      ],
      outputSchema: compactOutput
        ? {
            assets: [
              {
                clientKey: '输入中原样提供的短键',
                include: !![],
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
                kind: _0x5b3b6f['join']('、'),
                name: '角色姓名或简短身份名；场景或道具名称',
                role: '角色只能是主角、配角、反派或路人；场景和道具使用简短叙事作用',
                description: '故事内身份或空间说明',
                voiceDescription:
                  '角色可选，有依据才写，没有则留空；可用标签：年龄：…；性别：…；身份：…；口音：…；情绪底色：…；声线：…；语速：…；说话方式：…；音色特征：…，不要求凑齐。',
                occurrences: '人类可读的出现范围',
                sourceChapterIds: ['chapter\x20id'],
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
    '本次仅提取：' + _0x5b3b6f['map']((_0x114914) => _0x5c3994[_0x114914])['join']('、') + '。',
    '返回\x20JSON\x20的顶层必须且只能包含\x20assets\x20字段。',
    '下面的\x20JSON\x20仅是待分析的输入数据，禁止在答案中复述：',
    '<story_input_json>',
    JSON['stringify'](compactOutput ? _0xc1edf3 : addReplicationAssetFrameContract(_0xc1edf3, project)),
    '</story_input_json>',
    '现在直接输出 {"assets":[...]}，不要输出输入内容。',
  ]['join']('\x0a');
}
const STORY_ASSET_FORMAT_REPAIR_SYSTEM_PROMPT = [
  '你是严格的 JSON 结果修复器。',
  '只修复输入结果的\x20JSON\x20语法、字段名称、字段类型和必填字段，不重新分析剧本。',
  '不得返回原始请求、任务说明、校验说明或 Markdown。',
  '不得删除原结果中已经存在的资产；不得编造原结果无法支持的新人物、场景、道具或剧情事实。',
  '只返回一个顶层仅包含 assets 字段的严格 JSON 对象。',
]['join']('\x0a');
function getStoryAssetExtractionFinishReason(_0x29fc7d) {
  return normalizeText(
    _0x29fc7d?.['finishReason'] ||
      _0x29fc7d?.['finish_reason'] ||
      _0x29fc7d?.['choices']?.[0x0]?.['finish_reason'] ||
      _0x29fc7d?.['data']?.['choices']?.[0x0]?.['finish_reason'],
  )['toLowerCase']();
}
function isStoryAssetExtractionInputEcho(_0x4ce17c, _0x2f5486) {
  const _0x58d94e = normalizeText(getResultText(_0x4ce17c)),
    _0x3ae60d = normalizeText(_0x2f5486);
  if (!_0x58d94e || !_0x3ae60d) return ![];
  if (_0x58d94e === _0x3ae60d) return !![];
  const _0x23e7b1 = _0x3ae60d['slice'](0x0, 0xf0);
  if (_0x23e7b1['length'] >= 0x78 && _0x58d94e['startsWith'](_0x23e7b1)) return !![];
  return (
    _0x58d94e['includes']('<story_input_json>') ||
    (/"task"\s*:\s*"extract_story_assets(?:_by_kind)?"/u['test'](_0x58d94e) &&
      /"project"\s*:/u['test'](_0x58d94e) &&
      /"outputSchema"\s*:/u['test'](_0x58d94e))
  );
}
function classifyStoryAssetExtractionRecovery(_0x27da22, _0x5001bf, _0xb6f688) {
  const _0x463c52 = getStoryAssetExtractionFinishReason(_0x27da22);
  if (_0x463c52 === 'length' || _0x463c52 === 'max_tokens' || _0x463c52 === 'max_output_tokens')
    return { mode: 'rerun', reason: 'length' };
  if (isStoryAssetExtractionInputEcho(_0x27da22, _0xb6f688)) return { mode: 'rerun', reason: 'echo' };
  if (_0x5001bf?.['code'] === 'STORY_ASSET_VISUAL_PROMPT_MISSING')
    return { mode: 'visual-repair', reason: 'missing-visual-prompt' };
  const _0x5a9cf2 = normalizeText(getResultText(_0x27da22));
  if (!_0x5a9cf2) return { mode: 'rerun', reason: 'empty' };
  if (
    /没有可用的(?:角色|场景|角色或场景)资产/u['test'](normalizeText(_0x5001bf?.['message'] || _0x5001bf)) &&
    Math['max'](0x0, Math['trunc'](Number(_0x5001bf?.['raw']?.['returnedAssetCount']) || 0x0)) === 0x0
  )
    return { mode: 'rerun', reason: 'missing-assets' };
  return { mode: 'format-repair', reason: 'invalid-structure' };
}
function buildStoryAssetExtractionFormatRepairPrompt({
  response: _0x1f6726,
  error: _0x3b0a62,
  assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
  chapterIds: chapterIds = [],
  outputContract: outputContract = '',
} = {}) {
  return [
    '仅修复下面这份已返回结果的 JSON 格式和字段结构。',
    '不要重新分析剧本，不要复述原始请求，不要添加原结果中不存在的资产。',
    '允许的 kind：' +
      (normalizeStringArray(assetKinds)['join']('、') || STORY_ASSET_EXTRACTION_KINDS['join']('、')) +
      '。',
    '允许的\x20sourceChapterIds：' +
      (normalizeStringArray(chapterIds)['join']('、') || '仅使用原结果已有值') +
      '。',
    '本地校验错误：' + (normalizeText(_0x3b0a62?.['message'] || _0x3b0a62) || '返回格式不合格'),
    '目标结构：' + normalizeText(outputContract),
    '<rejected_response>',
    normalizeText(getResultText(_0x1f6726)),
    '</rejected_response>',
    '输出前自行检查：顶层只能有 assets，JSON 必须闭合，所有必填字段必须存在。',
    '现在只返回修复后的\x20JSON。',
  ]['join']('\x0a');
}
function buildStoryAssetExtractionRerunPrompt(_0x3e2d66, _0x5e77f0) {
  const _0x8eb32e =
    _0x5e77f0 === 'length'
      ? '上一次输出被截断，缺失内容无法通过格式修复恢复。'
      : _0x5e77f0 === 'echo'
        ? '上一次错误地复述了输入，没有生成资产结果。'
        : '上一次没有返回可用的资产内容。';
  return [
    _0x8eb32e,
    '请重新执行当前这一类资产提取；这是唯一一次自动重试。',
    '输出前自行检查：不要复述输入，顶层只能有 assets，JSON 必须完整闭合。',
    _0x3e2d66,
  ]['join']('\x0a');
}
async function requestStoryAssetExtractionResult({
  request: _0xbc55fc,
  requestPayload: _0x3292f7,
  parse: _0x498798,
  outputContract: _0x2449f6,
  assetKinds: _0x306e7b,
  chapterIds: _0x4f0e65,
  onProgress: _0x378974,
  automaticRecovery: automaticRecovery = ![],
}) {
  const _0x4925e8 = await _0xbc55fc(_0x3292f7);
  try {
    return _0x498798(_0x4925e8);
  } catch (_0x4576b7) {
    if (!automaticRecovery) throw _0x4576b7;
    const _0x2cb4df = classifyStoryAssetExtractionRecovery(_0x4925e8, _0x4576b7, _0x3292f7['prompt']),
      _0x5e041b = { character: '角色', scene: '场景', prop: '道具' },
      _0x4adc7f =
        normalizeStringArray(_0x306e7b)
          ['map']((_0x1e53f9) => _0x5e041b[_0x1e53f9] || _0x1e53f9)
          ['join']('、') || '资产',
      _0x13e159 = _0x2cb4df['mode'] === 'visual-repair',
      _0x313472 = _0x2cb4df['mode'] === 'format-repair';
    _0x378974?.({
      stage: _0x313472 ? 'repairing-assets' : 'retrying-assets',
      current: 0x1,
      total: 0x1,
      message: _0x13e159
        ? _0x4adc7f + '缺少图片提示词，正在依据原片证据补全（1/1）'
        : _0x313472
          ? _0x4adc7f + '返回格式不合格，正在自动纠错（1/1）'
          : _0x4adc7f + '返回内容不完整，正在仅重试当前类别（1/1）',
    });
    const _0x1fe459 = _0x13e159
        ? {
            ..._0x3292f7,
            prompt: [
              '上次结果存在空白或无有效视觉内容的 appearance.prompt；这是唯一一次图片提示词补全。',
              '依据下方原始证据及视觉规则，只补全缺失的图片提示词；保留原资产、形象、引用、来源和已有有效提示词，不增删资产，不把 description 直接复制为 prompt。',
              '每个\x20appearance.prompt\x20必须包含可直接生图的具体正向视觉内容，场景默认无人，道具默认无人手持；禁止空字符串和规则说明。',
              '<rejected_response>',
              normalizeText(getResultText(_0x4925e8)),
              '</rejected_response>',
              _0x3292f7['prompt'],
            ]['join']('\x0a'),
            temperature: 0.1,
          }
        : _0x313472
          ? {
              ..._0x3292f7,
              prompt: buildStoryAssetExtractionFormatRepairPrompt({
                response: _0x4925e8,
                error: _0x4576b7,
                assetKinds: _0x306e7b,
                chapterIds: _0x4f0e65,
                outputContract: _0x2449f6,
              }),
              systemPrompt: STORY_ASSET_FORMAT_REPAIR_SYSTEM_PROMPT,
              temperature: 0x0,
            }
          : {
              ..._0x3292f7,
              prompt: buildStoryAssetExtractionRerunPrompt(_0x3292f7['prompt'], _0x2cb4df['reason']),
              temperature: 0.1,
            },
      _0x10d41e = await _0xbc55fc(_0x1fe459);
    try {
      return _0x498798(
        _0x13e159 ? mergeStoryAssetVisualPromptRepair(_0x4925e8, _0x10d41e, _0x306e7b) : _0x10d41e,
      );
    } catch (_0xc1911d) {
      const _0x4409f0 = classifyStoryAssetExtractionRecovery(_0x10d41e, _0xc1911d, _0x1fe459['prompt']);
      if (_0x4409f0['reason'] === 'length') {
        const _0xe064c8 = new Error('自动纠错后输出仍被截断。');
        ((_0xe064c8['type'] = 'OUTPUT_LENGTH'), (_0xe064c8['cause'] = _0xc1911d));
        throw _0xe064c8;
      }
      if (_0x4409f0['reason'] === 'echo') {
        const _0x4eaf41 = new Error('自动纠错后模型仍在复述输入。');
        ((_0x4eaf41['type'] = 'INPUT_ECHO'), (_0x4eaf41['cause'] = _0xc1911d));
        throw _0x4eaf41;
      }
      _0xc1911d['automaticRecovery'] = {
        attempted: !![],
        mode: _0x2cb4df['mode'],
        reason: _0x2cb4df['reason'],
      };
      throw _0xc1911d;
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
  compactOutput: compactOutput = ![],
  maxOutputTokens: maxOutputTokens = 0x0,
  allowOversizedPrompt: allowOversizedPrompt = ![],
  automaticRecovery: automaticRecovery = ![],
  structuredOutputFallback: structuredOutputFallback = 'none',
  request: request = generateText,
  onProgress: onProgress = null,
} = {}) {
  assertPlanningModel(model, provider);
  const _0x4f38fd = resolveStoryPlanningConstraints(project),
    _0x4df478 = normalizeStoryProjectInput(project);
  ((_0x4df478['planning'] = _0x4f38fd),
    assertStoryProjectInput(_0x4df478),
    onProgress?.({
      stage: 'extracting-assets',
      current: 0x1,
      total: 0x1,
      message: '正在提取角色、场景与道具',
    }),
    (request = withReplicationRequestPolicy(request, project)));
  const _0x18c140 = buildStoryAssetExtractionPrompt({
      project: project,
      aspectRatio: aspectRatio,
      visualStyle: visualStyle,
      assetKinds: assetKinds,
      requiredAssetNamesByKind: requiredAssetNamesByKind,
      candidateAssetsByKind: candidateAssetsByKind,
      requiredAssetsByKind: requiredAssetsByKind,
      compactOutput: compactOutput,
    }),
    _0x4e2139 = _0x4df478['chapters']['map']((_0x1e8748) => _0x1e8748['id']),
    _0x2ce014 = normalizeStringArray(assetKinds)['filter']((_0x343c01) =>
      STORY_ASSET_EXTRACTION_KINDS['includes'](_0x343c01),
    ),
    _0x319a93 =
      _0x2ce014['length'] === 0x1 &&
      Array['isArray'](requiredAssetNamesByKind?.[_0x2ce014[0x0]]) &&
      requiredAssetNamesByKind[_0x2ce014[0x0]]['length'] === 0x0,
    _0x4d982f = compactOutput
      ? 'assets[{clientKey,include,description,visualPrompt,voiceDescription}]'
      : 'assets[{ref,kind(character|scene|prop),name,role(character: 主角|配角|反派|路人),description,voiceDescription(optional character voice evidence; empty when unknown),occurrences,sourceChapterIds,appearances[{ref,name(required specific visual state),description,occurrences,sourceChapterIds,prompt}]}]',
    _0x3ff055 = compactOutput
      ? createStoryAssetPromptContracts(
          assetKinds,
          requiredAssetNamesByKind,
          candidateAssetsByKind,
          requiredAssetsByKind,
          { includeClientKeys: !![] },
        )['payload']
      : {},
    _0x188be0 = [...(_0x3ff055['requiredAssets'] || []), ...(_0x3ff055['candidateAssets'] || [])]['map'](
      (_0x358a73) => _0x358a73['clientKey'],
    );
  return await requestStoryAssetExtractionResult({
    request: request,
    requestPayload: {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: _0x18c140,
      systemPrompt: STORY_ASSET_EXTRACTION_SYSTEM_PROMPT,
      structuredOutput: createStoryAssetExtractionStructuredOutput({
        assetKinds: assetKinds,
        schema: compactOutput
          ? createStoryAssetCompactExtractionResponseSchema(assetKinds, _0x188be0)
          : addReplicationAssetFrameSchema(createStoryAssetExtractionResponseSchema(assetKinds), project),
        fallback: structuredOutputFallback,
        mode: compactOutput ? 'compact' : 'detailed',
      }),
      thinking: { type: 'disabled' },
      temperature: 0.2,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      ...(Math['trunc'](Number(maxOutputTokens) || 0x0) > 0x0
        ? { maxOutputTokens: Math['trunc'](Number(maxOutputTokens)) }
        : {}),
      ...(allowOversizedPrompt ? { allowOversizedPrompt: !![] } : {}),
    },
    parse: (_0x44310e) =>
      compactOutput
        ? parseStoryAssetCompactExtractionResult(_0x44310e, {
            assetKinds: assetKinds,
            chapterIds: _0x4e2139,
            requiredAssetNamesByKind: requiredAssetNamesByKind,
            requiredAssetsByKind: requiredAssetsByKind,
            candidateAssetsByKind: candidateAssetsByKind,
            visualStyle: normalizeText(visualStyle) || _0x4df478['visualStyle'],
          })
        : attachReplicationAssetFrames(
            parseStoryAssetExtractionResult(_0x44310e, {
              chapterIds: _0x4e2139,
              allowedKinds: assetKinds,
              allowEmptyResult: _0x319a93,
            }),
            _0x44310e,
            project,
          ),
    outputContract:
      !compactOutput && project['replicationFrameSources']?.['length']
        ? _0x4d982f +
          '; 场景与道具另含 sourceFrame: null 或 {episodeId,eventId,timeSec}，只能引用输入 sourceVideos 中的原片事件与时间。'
        : _0x4d982f,
    assetKinds: assetKinds,
    chapterIds: _0x4e2139,
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
  const _0x201765 = normalizeStoryProjectInput(project);
  assertStoryProjectInput(_0x201765);
  const _0x247025 = Array['isArray'](assets)
    ? assets['map'](normalizePlanningAssetSummary)['filter']((_0x18a7a2) => _0x18a7a2['name'])
    : [];
  if (!_0x247025['length']) throw new Error('请先提取并确认角色、场景与道具资产。');
  const _0x536c60 = resolveStoryPlanningConstraints(project, constraints),
    _0x146e51 = _0x536c60['episodeCount'],
    _0x9d58a = Math['max'](0x1, Math['ceil'](_0x146e51 * 0.9));
  return JSON['stringify']({
    task: 'plan_story_episodes',
    schemaVersion: STORY_PLANNING_SCHEMA_VERSION,
    project: _0x201765,
    assets: _0x247025,
    constraints: _0x536c60,
    requirements: [
      '目标规划约\x20' +
        _0x146e51 +
        ' 集，建议保持在 ' +
        _0x9d58a +
        '-' +
        _0x146e51 +
        ' 集；不要求机械凑满，但不得超过 ' +
        _0x146e51 +
        ' 集。',
      '先在内部完成全剧集数与主要剧情节点的分配，再输出分集；不得为了缩短输出而压缩中段或提前收束结局。',
      '只有故事容量确实不足时才可少于 ' + _0x9d58a + ' 集；模型输出限制不能作为大幅缩减集数的理由。',
      '后续每个视频片段的时长上限是 ' + _0x536c60['sceneMaxSeconds'] + ' 秒；这不是整集时长限制。',
      '每集预计时长只能按该集必要剧情的自然表演时间估算；不设固定最低或最高集长，不得为接近某个秒数注水或删减必要剧情。',
      '覆盖完整故事起因、发展、高潮和结局，不遗漏结局。',
      '每集 sourceChapterIds 和 assetRefs 必须引用输入中真实存在的值。',
      '只规划分集，不生成\x20clips、分镜、镜头语言或视频提示词。',
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
  _0x15f129,
  { constraints: constraints = {}, chapterIds: chapterIds = [], assetRefs: assetRefs = [] } = {},
) {
  const _0x13ffbe = normalizeStoryPlanningConstraints(constraints),
    _0x5f8b9 = parseStrictJson(getResultText(_0x15f129), 'Agent 未返回分集规划结果。'),
    _0x5c7013 = new Set(normalizeStringArray(chapterIds)),
    _0x4af058 = new Set(normalizeStringArray(assetRefs)),
    _0x102227 = Array['isArray'](_0x5f8b9['episodes'])
      ? _0x5f8b9['episodes']
          ['map']((_0x310238, _0x7cb5a9) => {
            const _0x5f2f35 = normalizeText(_0x310238?.['title']),
              _0x4dd9f8 = normalizeText(_0x310238?.['synopsis']);
            if (!_0x5f2f35 || !_0x4dd9f8) return null;
            const _0x52010c = normalizeStringArray(_0x310238?.['sourceChapterIds']),
              _0x2c7f00 = normalizeStringArray(_0x310238?.['assetRefs']);
            if (_0x5c7013['size']) {
              const _0x5ee2e9 = _0x52010c['filter']((_0x55c7ba) => !_0x5c7013['has'](_0x55c7ba));
              if (_0x5ee2e9['length'])
                throw new Error(
                  '分集“' + _0x5f2f35 + '”引用了不存在的章节：' + _0x5ee2e9['join']('、') + '。',
                );
            }
            _0x4af058['size'] && assertKnownReferences(_0x2c7f00, _0x4af058, '分集“' + _0x5f2f35 + '”');
            const _0x19d6de = normalizePositiveNumber(
              _0x310238?.['estimatedDurationSeconds'] || _0x310238?.['durationSeconds'],
            );
            return {
              ref: normalizeStoryAssetReference(_0x310238?.['ref'], 'episode-' + (_0x7cb5a9 + 0x1)),
              title: _0x5f2f35,
              synopsis: _0x4dd9f8,
              sourceChapterIds: _0x52010c,
              assetRefs: _0x2c7f00,
              ...(_0x19d6de ? { estimatedDurationSeconds: _0x19d6de } : {}),
            };
          })
          ['filter'](Boolean)
      : [];
  if (!_0x102227['length']) throw new Error('Agent 返回结果没有可用分集。');
  if (_0x102227['length'] > _0x13ffbe['episodeCount'])
    throw new Error(
      'Agent 返回了 ' + _0x102227['length'] + ' 集，超过 ' + _0x13ffbe['episodeCount'] + ' 集上限。',
    );
  const _0x1f9c1d = _0x102227['map']((_0x3ad101) => _0x3ad101['ref']);
  if (new Set(_0x1f9c1d)['size'] !== _0x1f9c1d['length']) throw new Error('Agent 返回了重复的分集引用。');
  return { schemaVersion: STORY_PLANNING_SCHEMA_VERSION, constraints: _0x13ffbe, episodes: _0x102227 };
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
  const _0x5b675f = normalizeStoryProjectInput(project);
  assertStoryProjectInput(_0x5b675f);
  const _0x1a61f2 = Array['isArray'](assets)
    ? assets['map'](normalizePlanningAssetSummary)['filter']((_0x2ca162) => _0x2ca162['name'])
    : [];
  if (!_0x1a61f2['length']) throw new Error('请先提取并确认角色、场景与道具资产。');
  const _0x3fed5a = resolveStoryPlanningConstraints(project, constraints);
  onProgress?.({ stage: 'planning-episodes', current: 0x1, total: 0x1, message: '正在规划分集' });
  const _0x58772d = buildStoryEpisodePlanningPrompt({
    project: _0x5b675f,
    assets: _0x1a61f2,
    constraints: _0x3fed5a,
  });
  return await requestStrictResult({
    request: request,
    requestPayload: {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: _0x58772d,
      systemPrompt: STORY_EPISODE_PLANNING_SYSTEM_PROMPT,
      temperature: 0.35,
      timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
      maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
    },
    parse: (_0x42782f) =>
      parseStoryEpisodePlanningResult(_0x42782f, {
        constraints: _0x3fed5a,
        chapterIds: _0x5b675f['chapters']['map']((_0x352352) => _0x352352['id']),
        assetRefs: _0x1a61f2['map']((_0x235ca5) => _0x235ca5['ref']),
      }),
    outputContract:
      'episodes (1-' +
      _0x3fed5a['episodeCount'] +
      ') [{ref,title,synopsis,sourceChapterIds,assetRefs,estimatedDurationSeconds?}]',
  });
}
function buildStoryEpisodeSplitProjectContext(
  _0x43b51b = {},
  _0x2f6f2b = {},
  { sourceBeats: sourceBeats = null } = {},
) {
  const _0x232d51 = Array['isArray'](sourceBeats),
    _0x36092b = new Set(
      (Array['isArray'](sourceBeats) ? sourceBeats : [])['flatMap']((_0x1d5257) =>
        normalizeStringArray(_0x1d5257?.['characters']),
      ),
    ),
    _0x378552 = (Array['isArray'](sourceBeats) ? sourceBeats : [])
      ['flatMap']((_0x16fcde) => [_0x16fcde?.['heading'], _0x16fcde?.['body']])
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['join']('\x0a');
  return {
    title: _0x2f6f2b['title'],
    storyType: _0x2f6f2b['storyType'],
    targetAudience: normalizeText(_0x43b51b?.['targetAudience']),
    summary: _0x2f6f2b['summary'],
    background: _0x2f6f2b['background'],
    setting: _0x2f6f2b['setting'],
    coreHook: normalizeText(_0x43b51b?.['coreHook']),
    logline: _0x2f6f2b['logline'],
    scriptMode: _0x2f6f2b['scriptMode'],
    aspectRatio: _0x2f6f2b['aspectRatio'],
    visualStyle: _0x2f6f2b['visualStyle'],
    characters: Array['isArray'](_0x43b51b?.['characters'])
      ? _0x43b51b['characters']
          ['map']((_0x3c0b37, _0x3d8926) => {
            const _0x1a2cf6 = normalizeStorySummaryCharacter(_0x3c0b37, _0x3d8926);
            if (!_0x1a2cf6) return null;
            if (
              _0x232d51 &&
              !_0x36092b['has'](_0x1a2cf6['name']) &&
              !_0x378552['includes'](_0x1a2cf6['name'])
            )
              return null;
            const _0x174e2c = {
              ref: _0x1a2cf6['ref'],
              name: _0x1a2cf6['name'],
              roleType: _0x1a2cf6['roleType'],
            };
            return {
              ..._0x174e2c,
              coreTags: _0x1a2cf6['coreTags'],
              profile: _0x1a2cf6['profile'],
              motivation: _0x1a2cf6['motivation'],
              relationships: _0x1a2cf6['relationships'],
              personality: _0x1a2cf6['personality'],
              arc: _0x1a2cf6['arc'],
            };
          })
          ['filter'](Boolean)
      : [],
    planning: _0x2f6f2b['planning'],
  };
}
function selectStoryEpisodeSplitAssets(_0x560b0d = [], _0x227866 = {}) {
  const _0x1cbb74 = (Array['isArray'](_0x560b0d) ? _0x560b0d : [])
    ['map']((_0x458450, _0x5250fe) => ({
      asset: _0x458450,
      normalized: normalizePlanningAssetSummary(_0x458450, _0x5250fe),
    }))
    ['filter'](({ normalized: _0x282c04 }) => _0x282c04['name']);
  if (!_0x1cbb74['length']) return [];
  const _0x545c83 = new Set(
      [...normalizeStringArray(_0x227866?.['assetRefs']), ...normalizeStringArray(_0x227866?.['assetIds'])]
        ['map']((_0x11bad1) => normalizeStoryAssetReference(_0x11bad1, ''))
        ['filter'](Boolean),
    ),
    _0x594fbd = new Set(
      (Array['isArray'](_0x227866?.['script']?.['scenes']) ? _0x227866['script']['scenes'] : [])
        ['map']((_0x4b5217) => normalizeStoryAssetReference(_0x4b5217?.['ref'] || _0x4b5217?.['id'], ''))
        ['filter'](Boolean),
    ),
    _0x4daa6e = [
      _0x227866?.['title'],
      _0x227866?.['synopsis'],
      _0x227866?.['hook'],
      _0x227866?.['script']?.['fullText'],
      _0x227866?.['fullScript'],
      _0x227866?.['scriptText'],
      ...(Array['isArray'](_0x227866?.['script']?.['scenes'])
        ? _0x227866['script']['scenes']['flatMap']((_0x5064ef) => [
            _0x5064ef?.['heading'],
            ...(Array['isArray'](_0x5064ef?.['characters']) ? _0x5064ef['characters'] : []),
            _0x5064ef?.['body'],
          ])
        : []),
    ]
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['join']('\x0a'),
    _0x6d6397 = _0x1cbb74['filter'](({ asset: _0x343ba2, normalized: _0x34083f }) => {
      const _0x302847 = [_0x343ba2?.['ref'], _0x343ba2?.['planningRef'], _0x343ba2?.['id'], _0x34083f['ref']]
        ['map']((_0x214e7d) => normalizeStoryAssetReference(_0x214e7d, ''))
        ['filter'](Boolean);
      return (
        _0x302847['some']((_0x3f72a5) => _0x545c83['has'](_0x3f72a5)) ||
        (_0x34083f['name'] && _0x4daa6e['includes'](_0x34083f['name']))
      );
    }),
    _0x11381d = getStoryEpisodeReferenceAliases(_0x227866),
    _0x3e4bf4 = (_0x24aa44, _0x2e46a3) =>
      normalizeStringArray([
        ...normalizeStringArray(_0x24aa44?.[_0x2e46a3]),
        ...(Array['isArray'](_0x24aa44?.['appearances'])
          ? _0x24aa44['appearances']['flatMap']((_0x12e720) => normalizeStringArray(_0x12e720?.[_0x2e46a3]))
          : []),
      ]),
    _0x58b2f7 = _0x1cbb74['filter'](({ normalized: _0x41623d }) =>
      _0x3e4bf4(_0x41623d, 'sourceSceneRefs')['some']((_0x1a03c7) =>
        [..._0x594fbd]['some']((_0x5d6854) =>
          storyEpisodeSourceSceneRefsMatch(_0x1a03c7, _0x5d6854, _0x11381d),
        ),
      ),
    ),
    _0x3a878a = _0x1cbb74['filter'](({ normalized: _0xba31dd }) =>
      _0x3e4bf4(_0xba31dd, 'sourceEpisodeRefs')['some']((_0x453e93) => _0x11381d['includes'](_0x453e93)),
    ),
    _0xa1595d = new Set();
  return [..._0x6d6397, ..._0x58b2f7, ..._0x3a878a]
    ['map'](({ normalized: _0x112168 }) => _0x112168)
    ['filter']((_0x4c3426) => {
      if (_0xa1595d['has'](_0x4c3426['ref'])) return ![];
      return (_0xa1595d['add'](_0x4c3426['ref']), !![]);
    });
}
function getStoryEpisodeReferenceAliases(_0x1f8cb4 = {}) {
  return [
    ...new Set(
      [
        _0x1f8cb4?.['id'],
        _0x1f8cb4?.['ref'],
        _0x1f8cb4?.['planningRef'],
        _0x1f8cb4?.['script']?.['episodeRef'],
      ]
        ['map']((_0x5a8dd2) => normalizeStoryAssetReference(_0x5a8dd2, ''))
        ['filter'](Boolean),
    ),
  ];
}
function storyEpisodeSourceSceneRefsMatch(_0x388347 = '', _0xa9aa99 = '', _0x4a48e4 = []) {
  const _0x452d87 = normalizeText(_0x388347),
    _0xc6caf = normalizeText(_0xa9aa99);
  if (!_0x452d87 || !_0xc6caf) return ![];
  if (_0x452d87 === _0xc6caf) return !![];
  const _0x5f5148 = normalizeStringArray(_0x4a48e4),
    _0x34ecd1 = (_0x50a2cd) => {
      for (const _0x2ca2ec of _0x5f5148) {
        const _0x457ef5 = _0x2ca2ec + ':';
        if (_0x50a2cd['startsWith'](_0x457ef5)) return _0x50a2cd['slice'](_0x457ef5['length']);
      }
      return _0x50a2cd;
    };
  return _0x34ecd1(_0x452d87) === _0x34ecd1(_0xc6caf);
}
function storyAssetMatchesEpisode(_0x56c9c0 = {}, _0x108a9f = []) {
  const _0x3dcf94 = normalizeStringArray(_0x56c9c0?.['sourceEpisodeRefs']);
  if (!_0x3dcf94['length']) return !![];
  const _0x5e0c1f = new Set(normalizeStringArray(_0x108a9f));
  return _0x3dcf94['some']((_0x470290) => _0x5e0c1f['has'](_0x470290));
}
function getStoryEpisodeSceneAssetCandidates(
  _0x533d61 = {},
  _0x497fc0 = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  return (Array['isArray'](_0x497fc0) ? _0x497fc0 : [])['filter']((_0x38462b) => {
    if (_0x38462b?.['kind'] !== 'scene') return ![];
    if (!storyAssetMatchesEpisode(_0x38462b, episodeRefs)) return ![];
    const _0x1a6389 = normalizeStringArray(_0x38462b?.['sourceSceneRefs']);
    return _0x1a6389['some']((_0x336a6) =>
      storyEpisodeSourceSceneRefsMatch(_0x336a6, _0x533d61?.['ref'], episodeRefs),
    );
  });
}
function getStoryEpisodeBlueprintSceneAssetRefs(
  _0x3737d8 = [],
  _0x36388a = [],
  _0x44ad2b = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  const _0x6c4053 = new Map(
      (Array['isArray'](_0x36388a) ? _0x36388a : [])['map']((_0x56d354) => [
        normalizeText(_0x56d354?.['ref']),
        _0x56d354,
      ]),
    ),
    _0xb55a6 = new Map();
  return (
    normalizeStringArray(_0x3737d8)['forEach']((_0x478be1) => {
      const _0x2d2697 = getStoryEpisodeSceneAssetCandidates(_0x6c4053['get'](_0x478be1), _0x44ad2b, {
        episodeRefs: episodeRefs,
      });
      _0x2d2697['length'] === 0x1 && _0xb55a6['set'](_0x478be1, normalizeText(_0x2d2697[0x0]?.['ref']));
    }),
    _0xb55a6
  );
}
function assertStoryEpisodeSceneAssetCoverage(
  _0x587eb6 = [],
  _0x55f27f = [],
  { episodeRefs: episodeRefs = [] } = {},
) {
  const _0x17a221 = (Array['isArray'](_0x55f27f) ? _0x55f27f : [])['filter'](
    (_0x4e02d0) => _0x4e02d0?.['kind'] === 'scene',
  );
  if (!_0x17a221['some']((_0x2a6834) => normalizeStringArray(_0x2a6834?.['sourceSceneRefs'])['length']))
    return;
  const _0x93d978 = _0x587eb6['filter'](
    (_0x3263f6) =>
      !getStoryEpisodeSceneAssetCandidates(_0x3263f6, _0x17a221, { episodeRefs: episodeRefs })['length'],
  );
  if (_0x93d978['length']) {
    const _0x542276 = _0x93d978['map'](
      (_0xf9b074) =>
        normalizeStorySceneHeadingIdentity(_0xf9b074?.['heading']) || normalizeText(_0xf9b074?.['heading']),
    )
      ['filter'](Boolean)
      ['join']('、');
    throw new Error(
      '场景资产未完整覆盖当前分集正文：' +
        (_0x542276 || '存在未绑定场景') +
        '。请先重新提取场景资产；本次未调用模型。',
    );
  }
  const _0x5a1f65 = _0x587eb6['filter'](
    (_0x589997) =>
      getStoryEpisodeSceneAssetCandidates(_0x589997, _0x17a221, { episodeRefs: episodeRefs })['length'] > 0x1,
  );
  if (_0x5a1f65['length']) {
    const _0x16d72 = _0x5a1f65['map'](
      (_0x22e554) =>
        normalizeStorySceneHeadingIdentity(_0x22e554?.['heading']) || normalizeText(_0x22e554?.['heading']),
    )
      ['filter'](Boolean)
      ['join']('、');
    throw new Error(
      '场景资产存在重复绑定：' +
        (_0x16d72 || '存在多重绑定场景') +
        '。请先重新提取场景资产；本次未调用模型。',
    );
  }
}
function normalizeStoryEpisodeSplitContinuityEpisode(
  _0x564825 = null,
  { includeEnding: includeEnding = ![] } = {},
) {
  if (!_0x564825 || typeof _0x564825 !== 'object') return null;
  const _0x1de11e = Array['isArray'](_0x564825?.['script']?.['scenes']) ? _0x564825['script']['scenes'] : [],
    _0xa3a04b = _0x1de11e['at'](-0x1),
    _0x5ce605 = normalizeText(
      _0x564825?.['script']?.['fullText'] || _0x564825?.['fullScript'] || _0x564825?.['scriptText'],
    );
  return {
    number: Math['max'](0x1, Math['trunc'](Number(_0x564825?.['number']) || 0x1)),
    title: normalizeText(_0x564825?.['title']),
    synopsis: normalizeText(_0x564825?.['synopsis']),
    hook: normalizeText(_0x564825?.['hook']),
    ...(includeEnding && _0xa3a04b
      ? {
          endingScene: {
            heading: normalizeText(_0xa3a04b?.['heading']),
            characters: normalizeStringArray(_0xa3a04b?.['characters']),
            body: normalizeText(_0xa3a04b?.['body']),
          },
        }
      : includeEnding && _0x5ce605
        ? { endingExcerpt: _0x5ce605['slice'](-0x4b0) }
        : {}),
  };
}
function normalizeStoryEpisodeClipDurationConstraints(_0x4d4143 = null) {
  if (!_0x4d4143 || typeof _0x4d4143 !== 'object') return null;
  const _0x19d181 = [
      ...new Set(
        (Array['isArray'](_0x4d4143['allowedSeconds']) ? _0x4d4143['allowedSeconds'] : [])
          ['map']((_0x50541f) => normalizePositiveNumber(_0x50541f))
          ['filter'](Boolean),
      ),
    ]['sort']((_0x156e6c, _0x12773c) => _0x156e6c - _0x12773c),
    _0x242b1a = normalizePositiveNumber(_0x4d4143['minSeconds']) || _0x19d181[0x0] || 0x0,
    _0x1e1d4f = normalizePositiveNumber(_0x4d4143['maxSeconds']) || _0x19d181['at'](-0x1) || 0x0,
    _0x775db9 = normalizePositiveNumber(_0x4d4143['stepSeconds']) || 0x0;
  if (!_0x242b1a && !_0x1e1d4f && !_0x775db9 && !_0x19d181['length']) return null;
  return { minSeconds: _0x242b1a, maxSeconds: _0x1e1d4f, stepSeconds: _0x775db9, allowedSeconds: _0x19d181 };
}
export function buildStoryEpisodeSplitPrompt({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
} = {}) {
  const _0x24b8f1 = normalizeStoryProjectInput(project),
    _0x4d2de7 = getStoryEpisodeSplitSourceSceneMetadata(episode),
    _0x4236c5 = {
      ref: normalizeStoryAssetReference(
        episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
        'episode-1',
      ),
      title: normalizeText(episode?.['title']),
      text: sanitizeStoryEpisodeSplitPromptText(
        episode?.['script']?.['fullText'] ||
          episode?.['fullScript'] ||
          episode?.['scriptText'] ||
          episode?.['synopsis'] ||
          episode?.['content'],
        episode,
      ),
      ...(_0x4d2de7['length'] ? { sourceScenes: _0x4d2de7 } : {}),
    };
  if (!_0x4236c5['title'] || !_0x4236c5['text']) throw new Error('分集缺少标题或正文，无法生成分镜脚本。');
  const _0x25d4d3 = selectStoryEpisodeSplitAssets(assets, episode);
  if (!_0x25d4d3['some']((_0x523099) => _0x523099['kind'] === 'scene'))
    throw new Error('分集缺少可用的场景资产，无法生成必需的片段场景设定。');
  const _0x15f747 = resolveStoryPlanningConstraints(project, constraints),
    _0x2174d5 = resolveStoryPromptMode(project, constraints),
    _0x5671cc = resolveStoryPromptModeClipMaxSeconds(_0x2174d5, _0x15f747['sceneMaxSeconds']),
    _0x530da6 = createStoryEpisodeSplitPromptSceneCatalog(_0x25d4d3, _0x2174d5),
    _0x368192 = '每个 clip 的 shots 总时长不超过用户设置的 ' + _0x5671cc + ' 秒。';
  return serializeReplicationGenerationPrompt(
    {
      task: 'format_story_episode_as_compact_json',
      schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
      scriptMode: _0x24b8f1['scriptMode'],
      ...(_0x2174d5 !== 'seedance-2.0' ? { promptMode: _0x2174d5 } : {}),
      episode: _0x4236c5,
      ...(episode['replication']?.['sourceAnalysis']
        ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
        : {}),
      assets: _0x25d4d3['map']((_0xb92505) => compactStoryEpisodePromptAsset(_0xb92505)),
      scenes: _0x530da6,
      constraints: { clipMaxSeconds: _0x5671cc },
      requirements: [
        _0x368192,
        ...[buildVideoReplicationTimingGuidance(episode)]['filter'](Boolean),
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
          (_0x24b8f1['scriptMode'] === STORY_SCRIPT_MODE_NARRATION
            ? STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE
            : STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE),
        ...getStoryEpisodeTimelinePlanningRequirements(_0x2174d5),
      ],
      outputFormat: isStoryContinuousTimelinePromptMode(_0x2174d5)
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
  const _0x2ae551 = normalizeStoryProjectInput(project),
    _0x2f024e = resolveStoryPlanningConstraints(project, constraints),
    _0x385779 = resolveStoryPromptMode(project, constraints),
    _0x2ab3ab = resolveStoryPromptModeClipMaxSeconds(_0x385779, _0x2f024e['sceneMaxSeconds']),
    _0x23a8a2 = normalizeStoryAssetReference(
      episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
      'episode-1',
    ),
    _0x645f7a = normalizeText(episode?.['title']) || '本集',
    _0x32d70 = sanitizeStoryEpisodeSplitPromptText(
      episode?.['script']?.['fullText'] ||
        episode?.['fullScript'] ||
        episode?.['scriptText'] ||
        episode?.['synopsis'] ||
        episode?.['content'],
      episode,
    );
  if (!_0x32d70) throw new Error('分集缺少正文，无法生成分镜脚本。');
  const _0x73f9d1 = selectStoryEpisodeSplitAssets(assets, episode),
    _0x68fe27 = createStoryEpisodeSplitPromptSceneCatalog(_0x73f9d1, _0x385779);
  if (!_0x68fe27['length']) throw new Error('分集缺少可用的场景资产，无法生成分镜脚本。');
  return serializeReplicationGenerationPrompt(
    {
      task: 'split_story_episode',
      ...(episode['replication']?.['sourceAnalysis']
        ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
        : {}),
      scriptMode: _0x2ae551['scriptMode'],
      ...(_0x385779 !== 'seedance-2.0' ? { promptMode: _0x385779 } : {}),
      episode: { ref: _0x23a8a2, title: _0x645f7a, text: _0x32d70, scenes: _0x68fe27 },
      assets: _0x73f9d1['map']((_0x2a4f5f) => compactStoryEpisodePromptAsset(_0x2a4f5f)),
      clipMaxSeconds: _0x2ab3ab,
      instruction: [
        ...[buildVideoReplicationTimingGuidance(episode)]['filter'](Boolean),
        '按正文顺序完整拆分，场景变化时切换 s，原对白放 q。' +
          (getVideoReplicationSpeechGuidance(episode) ||
            (_0x2ae551['scriptMode'] === STORY_SCRIPT_MODE_NARRATION
              ? STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE
              : STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE)) +
          STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE +
          STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE +
          STORY_EPISODE_SPLIT_GROUPING_GUIDANCE +
          STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
          STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
        'assets 只包含本集已确认出场的角色、场景和道具；不得调用或编造其他集资产。',
        ...getStoryEpisodeTimelinePlanningRequirements(_0x385779),
      ]['join']('\x0a'),
      output: isStoryContinuousTimelinePromptMode(_0x385779)
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
  const _0x2486f3 = normalizeStoryProjectInput(project),
    _0x19362d = resolveStoryPlanningConstraints(project, constraints),
    _0x38f0c0 = resolveStoryPromptMode(project, constraints),
    _0x717735 = resolveStoryPromptModeClipMaxSeconds(_0x38f0c0, _0x19362d['sceneMaxSeconds']),
    _0x13d662 = (Array['isArray'](episodes) ? episodes : [])['map']((_0xe6e260, _0x1ce777) => {
      const _0x6a513b = normalizeStoryAssetReference(
          _0xe6e260?.['ref'] || _0xe6e260?.['planningRef'] || _0xe6e260?.['id'],
          'episode-' + (_0x1ce777 + 0x1),
        ),
        _0x10c7db = normalizeText(_0xe6e260?.['title']) || '第\x20' + (_0x1ce777 + 0x1) + '\x20集',
        _0x58195d = sanitizeStoryEpisodeSplitPromptText(
          _0xe6e260?.['script']?.['fullText'] ||
            _0xe6e260?.['fullScript'] ||
            _0xe6e260?.['scriptText'] ||
            _0xe6e260?.['synopsis'] ||
            _0xe6e260?.['content'],
          _0xe6e260,
        );
      if (!_0x58195d) throw new Error('第\x20' + (_0x1ce777 + 0x1) + '\x20集缺少正文，无法生成分镜脚本。');
      const _0x55f377 = selectStoryEpisodeSplitAssets(assets, _0xe6e260),
        _0x250fff = createStoryEpisodeSplitPromptSceneCatalog(_0x55f377, _0x38f0c0);
      if (!_0x250fff['length'])
        throw new Error('第\x20' + (_0x1ce777 + 0x1) + '\x20集缺少可用的场景资产，无法生成分镜脚本。');
      return {
        ref: _0x6a513b,
        title: _0x10c7db,
        text: _0x58195d,
        assets: _0x55f377['map']((_0x261521) => compactStoryEpisodePromptAsset(_0x261521)),
        scenes: _0x250fff,
        ...(_0xe6e260['replication']?.['sourceAnalysis']
          ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(_0xe6e260, project, assets) }
          : {}),
      };
    });
  if (!_0x13d662['length']) throw new Error('没有可生成分镜的分集。');
  return JSON['stringify']({
    task: 'split_story_episodes',
    scriptMode: _0x2486f3['scriptMode'],
    ...(_0x38f0c0 !== 'seedance-2.0' ? { promptMode: _0x38f0c0 } : {}),
    episodes: _0x13d662,
    clipMaxSeconds: _0x717735,
    instruction: [
      '按正文顺序完整拆分，场景变化时切换 s，原对白放 q。' +
        (_0x13d662['find']((_0x138f0c) => _0x138f0c['sourceVideoEvidence'])?.['sourceVideoEvidence'][
          'speechGuidance'
        ] ||
          (_0x2486f3['scriptMode'] === STORY_SCRIPT_MODE_NARRATION
            ? STORY_EPISODE_SPLIT_NARRATION_MODE_GUIDANCE
            : STORY_EPISODE_SPLIT_PLOT_MODE_GUIDANCE)) +
        STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE +
        STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE +
        STORY_EPISODE_SPLIT_GROUPING_GUIDANCE +
        STORY_EPISODE_SPLIT_VISUAL_GUIDANCE +
        STORY_EPISODE_SPLIT_CAMERA_GUIDANCE,
      '每个 episode.assets 只包含该集已确认出场的角色、场景和道具；不得跨集调用资产。',
      ...getStoryEpisodeTimelinePlanningRequirements(_0x38f0c0),
    ]['join']('\x0a'),
    output: isStoryContinuousTimelinePromptMode(_0x38f0c0)
      ? '{\x22episodes\x22:[{\x22episodeRef\x22:\x22episodeRef\x22,\x22clips\x22:[{\x22s\x22:\x22sceneCode\x22,\x22shots\x22:[{\x22d\x22:integerSeconds,\x22startSec\x22:0,\x22endSec\x22:integerSeconds,\x22v\x22:\x22cameraVisibleAction\x22,\x22c\x22:\x22cameraViewAndMovement\x22,\x22q\x22:\x22dialogueOrEmpty\x22,\x22o\x22:\x22voiceoverOrEmpty\x22,\x22a\x22:\x22audioOrEmpty\x22},{\x22d\x22:integerSeconds,\x22startSec\x22:previousEndSec,\x22endSec\x22:integerSeconds,\x22v\x22:\x22nextCameraVisibleAction\x22,\x22c\x22:\x22nextCameraViewAndMovement\x22,\x22q\x22:\x22dialogueOrEmpty\x22,\x22o\x22:\x22voiceoverOrEmpty\x22,\x22a\x22:\x22audioOrEmpty\x22}]}]}]}'
      : '{\x22episodes\x22:[{\x22episodeRef\x22:\x22episodeRef\x22,\x22clips\x22:[{\x22s\x22:\x22sceneCode\x22,\x22shots\x22:[{\x22d\x22:seconds,\x22v\x22:\x22cameraVisibleAction\x22,\x22c\x22:\x22cameraViewAndMovement\x22,\x22q\x22:\x22dialogueOrEmpty\x22,\x22o\x22:\x22voiceoverOrEmpty\x22,\x22a\x22:\x22audioOrEmpty\x22},{\x22d\x22:seconds,\x22v\x22:\x22nextCameraVisibleAction\x22,\x22c\x22:\x22nextCameraViewAndMovement\x22,\x22q\x22:\x22dialogueOrEmpty\x22,\x22o\x22:\x22voiceoverOrEmpty\x22,\x22a\x22:\x22audioOrEmpty\x22}]}]}]}',
  });
}
function buildStoryEpisodesSplitValidationPrompt({
  episodeRefs: episodeRefs = [],
  result: result = '',
  promptMode: promptMode = 'seedance-2.0',
} = {}) {
  return [
    '任务：检查下面的批量分镜返回，并修复\x20JSON\x20语法、外层包装或字段名称。',
    '必须完整保留已有剧集、片段以及每个镜头原本所属的\x20clip，只修复格式，不改变\x20shots\x20数量或归属；不要重新创作。',
    '剧集引用：' + normalizeStringArray(episodeRefs)['join']('、'),
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '必须保留每个 shot 的 startSec、endSec 和 d，只修复字段包装；不得删除或重算时间轴。'
      : '',
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '返回格式：{"episodes":[{"episodeRef":"episodeRef","clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}]}。'
      : '返回格式：{"episodes":[{"episodeRef":"episodeRef","clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextVisual","c":"nextCamera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}]}。示意中的两个 shot 只说明同一 clip 可以承载连续镜头，不代表固定数量。',
    '待检查结果：',
    String(result || ''),
  ]['join']('\x0a');
}
function buildStoryEpisodeSplitValidationPrompt({
  episodeRef: episodeRef = '',
  result: result = '',
  promptMode: promptMode = 'seedance-2.0',
} = {}) {
  return [
    '任务：检查下面这一集的分镜返回，并修复\x20JSON\x20语法、外层包装或字段名称。',
    '必须完整保留已有片段以及每个镜头原本所属的\x20clip，只修复格式，不改变\x20shots\x20数量或归属；不要重新创作。',
    '剧集引用：' + normalizeText(episodeRef),
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '必须保留每个 shot 的 startSec、endSec 和 d，只修复字段包装；不得删除或重算时间轴。'
      : '',
    isStoryContinuousTimelinePromptMode(promptMode)
      ? '返回格式：{"clips":[{"s":"sceneCode","shots":[{"d":integerSeconds,"startSec":0,"endSec":integerSeconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}。'
      : '返回格式：{"clips":[{"s":"sceneCode","shots":[{"d":seconds,"v":"visual","c":"camera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"},{"d":seconds,"v":"nextVisual","c":"nextCamera","q":"dialogueOrEmpty","o":"voiceoverOrEmpty","a":"audioOrEmpty"}]}]}。示意中的两个 shot 只说明同一 clip 可以承载连续镜头，不代表固定数量。',
    '待检查结果：',
    String(result || ''),
  ]['join']('\x0a');
}
function normalizeStoryEpisodeSplitSourceScenes(_0x3a4ef1 = {}) {
  const _0x3e2030 = getStoryEpisodeReferenceAliases(_0x3a4ef1)[0x0] || 'episode-1',
    _0x1204c6 = (Array['isArray'](_0x3a4ef1?.['script']?.['scenes']) ? _0x3a4ef1['script']['scenes'] : [])
      ['map']((_0x50eee8, _0x413e57) => ({
        ref: normalizeStoryAssetReference(
          _0x50eee8?.['ref'] || _0x50eee8?.['id'],
          _0x3e2030 + '-scene-' + (_0x413e57 + 0x1),
        ),
        heading: normalizeText(_0x50eee8?.['heading']),
        characters: normalizeStringArray(_0x50eee8?.['characters']),
        body: normalizeText(_0x50eee8?.['body']),
      }))
      ['filter']((_0x3442d8) => _0x3442d8['heading'] || _0x3442d8['body']);
  if (_0x1204c6['length']) return _0x1204c6;
  const _0x3a48d2 = normalizeText(
    _0x3a4ef1?.['script']?.['fullText'] ||
      _0x3a4ef1?.['fullScript'] ||
      _0x3a4ef1?.['scriptText'] ||
      _0x3a4ef1?.['synopsis'] ||
      _0x3a4ef1?.['content'],
  );
  return splitStorySourceText(_0x3a48d2, 0xfa0)['map']((_0x554726, _0x5316e0) => ({
    ref: _0x3e2030 + '-source-section-' + (_0x5316e0 + 0x1),
    heading: (normalizeText(_0x3a4ef1?.['title']) || '本集') + '·文本段' + (_0x5316e0 + 0x1),
    characters: [],
    body: _0x554726,
  }));
}
function splitStoryEpisodeSourceBeatLine(_0x52bdb7 = '', _0x2854b5 = 0xf0) {
  const _0x11881a = normalizeText(_0x52bdb7);
  if (!_0x11881a) return [];
  const _0x1cab2f = Math['max'](0x50, Math['trunc'](Number(_0x2854b5) || 0xf0));
  if (_0x11881a['length'] <= _0x1cab2f) return [_0x11881a];
  const _0x245f21 = _0x11881a['match'](/^[^：:\r\n]{1,24}[：:]\s*/u)?.[0x0] || '',
    _0x35d4d2 = [];
  let _0x37474c = _0x245f21 ? _0x11881a['slice'](_0x245f21['length'])['trim']() : _0x11881a;
  const _0x5bd31f = Math['max'](0x3c, _0x1cab2f - _0x245f21['length']);
  while (_0x37474c['length'] > _0x5bd31f) {
    const _0x3dd5b7 = _0x37474c['slice'](0x0, _0x5bd31f + 0x1),
      _0x4db991 = [..._0x3dd5b7['matchAll'](/[。！？；.!?;]/gu)],
      _0x4c7433 = _0x4db991['map']((_0x414643) => Number(_0x414643['index']) + 0x1)
        ['filter']((_0x22baad) => _0x22baad >= Math['floor'](_0x5bd31f * 0.45) && _0x22baad <= _0x5bd31f)
        ['at'](-0x1),
      _0x20b0d9 = _0x4c7433 || _0x5bd31f;
    (_0x35d4d2['push']('' + _0x245f21 + _0x37474c['slice'](0x0, _0x20b0d9)['trim']()),
      (_0x37474c = _0x37474c['slice'](_0x20b0d9)['trim']()));
  }
  if (_0x37474c) _0x35d4d2['push']('' + _0x245f21 + _0x37474c);
  return _0x35d4d2['filter'](Boolean);
}
function extractStoryEpisodeDialogueUnits(_0x1d9b4b = '', _0x2badd7 = 'source-beat', _0x5c9ce7 = []) {
  const _0x2b290e = [],
    _0x53e1fc = normalizeStringArray(_0x5c9ce7),
    _0x3e13ec = new Set(['旁白', '出场人物', '人物', '时间', '地点', '场景', '音效']);
  return (
    String(_0x1d9b4b || '')
      ['split'](/\r?\n/u)
      ['forEach']((_0x5f3b6a) => {
        const _0x21e9ed = _0x5f3b6a['trim']();
        if (!_0x21e9ed) return;
        const _0x1c1a1f = _0x21e9ed['match'](/^([^：:\n]{1,20})[：:]\s*(.+)$/u),
          _0x974f06 = normalizeText(_0x1c1a1f?.[0x1])['replace'](/\s*[（(][^）)]*[）)]\s*$/u, ''),
          _0x57c030 = _0x21e9ed['search'](/[“「『"]/u),
          _0x597fac = _0x57c030 >= 0x0 ? _0x21e9ed['slice'](0x0, _0x57c030) : '',
          _0x24c322 = _0x53e1fc['filter']((_0x291e6c) => _0x291e6c && _0x597fac['includes'](_0x291e6c)),
          _0x174d44 = _0x53e1fc['includes'](_0x974f06)
            ? _0x974f06
            : _0x24c322['length'] === 0x1
              ? _0x24c322[0x0]
              : _0x974f06 &&
                  !_0x3e13ec['has'](_0x974f06) &&
                  !/(?:说道|问道|答道|喊道|叫道|叫住[他她]|开口|低声道|高声道|轻声道|冷声道|厉声道|喃喃道|嘀咕道)$/u[
                    'test'
                  ](_0x974f06)
                ? _0x974f06
                : '',
          _0x3d4dd7 = [],
          _0x22198f = /“([^”\n]+)”|「([^」\n]+)」|『([^』\n]+)』|"([^"\n]+)"/gu;
        for (const _0x26b166 of _0x21e9ed['matchAll'](_0x22198f)) {
          const _0x423795 = normalizeText(
            _0x26b166[0x1] || _0x26b166[0x2] || _0x26b166[0x3] || _0x26b166[0x4],
          );
          if (_0x423795)
            _0x3d4dd7['push']({ text: _0x423795, sourceOffset: Number(_0x26b166['index']) || 0x0 });
        }
        if (_0x3d4dd7['length']) {
          _0x2b290e['push'](
            ..._0x3d4dd7['map']((_0x5c4ee9) => ({
              ..._0x5c4ee9,
              ...(_0x174d44 ? { speaker: _0x174d44 } : {}),
            })),
          );
          return;
        }
        if (!_0x1c1a1f) return;
        const _0x20898a = _0x174d44,
          _0x18a66b = normalizeText(_0x1c1a1f[0x2])
            ['replace'](/^(?:(?:（[^）]*）|\([^)]*\))\s*)+/u, '')
            ['trim']();
        if (!_0x20898a || !_0x18a66b || _0x3e13ec['has'](_0x20898a)) return;
        _0x2b290e['push']({ speaker: _0x20898a, text: _0x18a66b, sourceOffset: 0x0 });
      }),
    _0x2b290e['map']((_0x6ee425, _0x2c69b5) => ({
      ref: _0x2badd7 + '-dialogue-' + (_0x2c69b5 + 0x1),
      ...(_0x6ee425['speaker'] ? { speaker: _0x6ee425['speaker'] } : {}),
      text: _0x6ee425['text'],
    }))
  );
}
function createStoryEpisodeSourceBeat({
  ref: ref = '',
  sourceSceneRef: sourceSceneRef = '',
  order: order = 0x0,
  heading: heading = '',
  characters: characters = [],
  body: body = '',
} = {}) {
  const _0x4b8307 = normalizeText(ref),
    _0x455bd1 = normalizeText(body);
  return {
    ref: _0x4b8307,
    sourceSceneRef: sourceSceneRef,
    order: order,
    heading: heading,
    characters: characters,
    body: _0x455bd1,
    dialogueUnits: extractStoryEpisodeDialogueUnits(_0x455bd1, _0x4b8307, characters),
  };
}
export function normalizeStoryEpisodeSplitSourceBeats(_0x23df89 = {}) {
  const _0x5992b0 = normalizeStoryEpisodeSplitSourceScenes(_0x23df89),
    _0x4ca969 = [];
  _0x5992b0['forEach']((_0x35860d) => {
    const _0xf7c4c5 = normalizeText(_0x35860d['body'])
        ['split'](/\r?\n/u)
        ['map'](normalizeText)
        ['filter'](Boolean)
        ['flatMap']((_0x458bc3) => splitStoryEpisodeSourceBeatLine(_0x458bc3)),
      _0x314927 = _0xf7c4c5['length'] ? _0xf7c4c5 : [normalizeText(_0x35860d['heading'])]['filter'](Boolean);
    _0x314927['forEach']((_0x39d410, _0x916cf0) => {
      _0x4ca969['push'](
        createStoryEpisodeSourceBeat({
          ref: _0x35860d['ref'] + '-beat-' + (_0x916cf0 + 0x1),
          sourceSceneRef: _0x35860d['ref'],
          order: _0x4ca969['length'] + 0x1,
          heading: _0x35860d['heading'],
          characters: _0x35860d['characters'],
          body: _0x39d410,
        }),
      );
    });
  });
  if (!_0x4ca969['length']) throw new Error('实验分批拆分没有找到可用的原文块。');
  const _0x4879fd = _0x4ca969['map']((_0x257a66) => _0x257a66['ref']);
  if (new Set(_0x4879fd)['size'] !== _0x4879fd['length'])
    throw new Error('实验分批拆分生成了重复的原文块引用。');
  return _0x4ca969;
}
export function normalizeStoryEpisodeExperimentalSourceBeats(_0x55d1f1 = {}) {
  const _0x48c000 = normalizeStoryEpisodeSplitSourceBeats(_0x55d1f1);
  if (_0x48c000['length'] <= STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH * 0x2) return _0x48c000;
  const _0x5d0b61 = normalizeStoryEpisodeSplitSourceScenes(_0x55d1f1),
    _0x3eaa03 = [];
  _0x5d0b61['forEach']((_0x565a5b) => {
    const _0x37e88d = normalizeText(_0x565a5b['body'])
        ['split'](/\r?\n/u)
        ['map'](normalizeText)
        ['filter'](Boolean)
        ['flatMap']((_0x26ce73) =>
          splitStoryEpisodeSourceBeatLine(_0x26ce73, STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_MAX_CHARACTERS),
        ),
      _0x5ebfb8 = _0x37e88d['length'] ? _0x37e88d : [normalizeText(_0x565a5b['heading'])]['filter'](Boolean);
    let _0x17ee62 = [],
      _0x4b6242 = 0x0;
    const _0x5a6d0a = () => {
      if (!_0x17ee62['length']) return;
      const _0x2f3af8 =
          _0x3eaa03['filter']((_0xc2e596) => _0xc2e596['sourceSceneRef'] === _0x565a5b['ref'])['length'] +
          0x1,
        _0x4f0dd8 = _0x565a5b['ref'] + '-semantic-beat-' + _0x2f3af8;
      (_0x3eaa03['push'](
        createStoryEpisodeSourceBeat({
          ref: _0x4f0dd8,
          sourceSceneRef: _0x565a5b['ref'],
          order: _0x3eaa03['length'] + 0x1,
          heading: _0x565a5b['heading'],
          characters: _0x565a5b['characters'],
          body: _0x17ee62['join']('\x0a'),
        }),
      ),
        (_0x17ee62 = []),
        (_0x4b6242 = 0x0));
    };
    (_0x5ebfb8['forEach']((_0x20a264) => {
      const _0x4b078e = _0x4b6242 + (_0x17ee62['length'] ? 0x1 : 0x0) + _0x20a264['length'];
      (_0x17ee62['length'] &&
        _0x4b078e > STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_MAX_CHARACTERS &&
        _0x5a6d0a(),
        _0x17ee62['push'](_0x20a264),
        (_0x4b6242 += (_0x17ee62['length'] > 0x1 ? 0x1 : 0x0) + _0x20a264['length']),
        _0x4b6242 >= STORY_EPISODE_EXPERIMENTAL_SOURCE_BEAT_TARGET_CHARACTERS && _0x5a6d0a());
    }),
      _0x5a6d0a());
  });
  if (!_0x3eaa03['length']) throw new Error('实验分批拆分没有找到可用的语义原文块。');
  return _0x3eaa03;
}
function normalizeStoryEpisodeSplitBlueprintAssetRefs(
  _0x4513d5,
  { assetsByRef: assetsByRef = new Map(), kind: kind = '', label: label = '片段计划' } = {},
) {
  return normalizeStringArray(_0x4513d5)['map']((_0x462aff) => {
    const _0x5b05f7 = assetsByRef['get'](_0x462aff);
    if (!_0x5b05f7 || (kind && _0x5b05f7['kind'] !== kind))
      throw new Error(
        label +
          ' 引用了无效的' +
          (kind === 'character' ? '角色' : kind === 'prop' ? '道具' : '') +
          '资产“' +
          _0x462aff +
          '”。',
      );
    return _0x462aff;
  });
}
export function parseStoryEpisodeSplitBlueprint(
  _0x336bc4,
  {
    episodeRef: episodeRef = '',
    episodeRefs: episodeRefs = [],
    sourceScenes: sourceScenes = [],
    sourceBeats: sourceBeats = [],
    assets: assets = [],
    constraints: constraints = {},
    enforceMaxDuration: enforceMaxDuration = !![],
    includeDirectorContinuity: includeDirectorContinuity = ![],
  } = {},
) {
  const _0x357af6 = parseStrictJson(getResultText(_0x336bc4), 'Agent 未返回分镜蓝图。'),
    _0x17aeab = normalizeStoryAssetReference(episodeRef, 'episode-1');
  if (normalizeStoryAssetReference(_0x357af6?.['episodeRef'], '') !== _0x17aeab)
    throw new Error('Agent 返回的分镜蓝图与当前分集不一致。');
  const _0x30a865 = normalizeStoryPlanningConstraints(constraints),
    _0xcd2187 = new Set(
      (Array['isArray'](sourceScenes) ? sourceScenes : [])['map']((_0xa162c) =>
        normalizeText(_0xa162c?.['ref']),
      ),
    ),
    _0x3c9f47 = new Map(
      (Array['isArray'](sourceScenes) ? sourceScenes : [])['map']((_0x3cf29d) => [
        normalizeText(_0x3cf29d?.['ref']),
        _0x3cf29d,
      ]),
    ),
    _0x1ef67a = Array['isArray'](sourceBeats) ? sourceBeats : [],
    _0x5a88c8 = new Map(_0x1ef67a['map']((_0x5cd408) => [normalizeText(_0x5cd408?.['ref']), _0x5cd408]));
  if (!_0x5a88c8['size'] || _0x5a88c8['size'] !== _0x1ef67a['length'])
    throw new Error('实验分批拆分缺少唯一、有效的原文块引用。');
  const _0x3db789 = new Map(
      (Array['isArray'](assets) ? assets : [])['map']((_0xe17e6f) => [
        normalizeText(_0xe17e6f?.['ref']),
        _0xe17e6f,
      ]),
    ),
    _0x1f52c6 = (Array['isArray'](_0x357af6?.['clipPlans']) ? _0x357af6['clipPlans'] : [])['map'](
      (_0x1cb873, _0xb8ba5) => {
        const _0x3f07a6 = '片段计划 ' + (_0xb8ba5 + 0x1),
          _0x14fc79 = normalizeStoryAssetReference(
            _0x1cb873?.['ref'],
            _0x17aeab + '-plan-' + (_0xb8ba5 + 0x1),
          ),
          _0x5af1b0 = (Array['isArray'](_0x1cb873?.['sourceBeatRefs']) ? _0x1cb873['sourceBeatRefs'] : [])
            ['map'](normalizeText)
            ['filter'](Boolean),
          _0x59ff47 = normalizeText(_0x1cb873?.['beat']),
          _0x397c9a = normalizeText(_0x1cb873?.['time']),
          _0x17feb3 = normalizeText(_0x1cb873?.['entryState']),
          _0x1597c8 = normalizeText(_0x1cb873?.['exitState']),
          _0x47f602 = normalizeText(_0x1cb873?.['openingShotIntent']),
          _0x848a7 = normalizeText(_0x1cb873?.['closingShotIntent']),
          _0x59fb96 =
            normalizeText(_0x1cb873?.['continuityNotes']) ||
            '以相邻计划的 exitState 和 entryState 保持连续。',
          _0x2b8fd2 = normalizePositiveNumber(_0x1cb873?.['targetDurationSec']);
        if (!_0x5af1b0['length'] || new Set(_0x5af1b0)['size'] !== _0x5af1b0['length'])
          throw new Error(_0x3f07a6 + ' 缺少唯一、有效的 sourceBeatRefs。');
        const _0x187594 = _0x5af1b0['find']((_0x5a214a) => !_0x5a88c8['has'](_0x5a214a));
        if (_0x187594) throw new Error(_0x3f07a6 + ' 引用了不存在的原文块“' + _0x187594 + '”。');
        const _0x2abe5a = [
          ...new Set(
            _0x5af1b0['map']((_0x5a06a0) => normalizeText(_0x5a88c8['get'](_0x5a06a0)?.['sourceSceneRef'])),
          ),
        ];
        if (_0x2abe5a['length'] !== 0x1 || !_0xcd2187['has'](_0x2abe5a[0x0]))
          throw new Error(_0x3f07a6 + ' 的 sourceBeatRefs 跨越或缺少有效场景。');
        const _0x25c6c9 = normalizeText(_0x1cb873?.['sourceSceneRef']),
          _0x53365c = _0x25c6c9 || _0x2abe5a[0x0];
        if (_0x53365c !== _0x2abe5a[0x0])
          throw new Error(_0x3f07a6 + '\x20的\x20sourceSceneRef\x20与\x20sourceBeatRefs\x20不一致。');
        const _0x5f33a5 = getStoryEpisodeSceneAssetCandidates(_0x3c9f47['get'](_0x53365c), assets, {
            episodeRefs: episodeRefs,
          }),
          _0x5a4bf6 =
            normalizeText(_0x1cb873?.['sceneAssetRef']) ||
            (_0x5f33a5['length'] === 0x1 ? normalizeText(_0x5f33a5[0x0]?.['ref']) : ''),
          _0x15105a = _0x3db789['get'](_0x5a4bf6);
        if (!_0x14fc79) throw new Error(_0x3f07a6 + ' 缺少有效的 ref。');
        if (!_0x15105a || _0x15105a['kind'] !== 'scene')
          throw new Error(_0x3f07a6 + ' 缺少有效的 sceneAssetRef。');
        const _0x281605 = normalizeStringArray(
            (Array['isArray'](_0x15105a?.['appearances']) ? _0x15105a['appearances'] : [])['map'](
              (_0x517c14) => _0x517c14?.['ref'],
            ),
          ),
          _0x3024db = normalizeText(_0x1cb873?.['sceneAppearanceRef']),
          _0x2196eb = _0x281605['length'] ? _0x3024db : '';
        if (_0x281605['length'] && !_0x281605['includes'](_0x2196eb))
          throw new Error(_0x3f07a6 + ' 缺少有效的 sceneAppearanceRef。');
        if (!_0x59ff47 || !_0x17feb3 || !_0x1597c8)
          throw new Error(_0x3f07a6 + ' 缺少 beat、entryState 或 exitState。');
        if (includeDirectorContinuity && (!_0x47f602 || !_0x848a7))
          throw new Error(_0x3f07a6 + ' 缺少 openingShotIntent 或 closingShotIntent。');
        if (!_0x2b8fd2 || (enforceMaxDuration && _0x2b8fd2 > _0x30a865['sceneMaxSeconds']))
          throw new Error(
            enforceMaxDuration
              ? _0x3f07a6 +
                  ' 的 targetDurationSec 必须大于 0 且不超过 ' +
                  _0x30a865['sceneMaxSeconds'] +
                  ' 秒。'
              : _0x3f07a6 + ' 的 targetDurationSec 必须大于 0。',
          );
        const _0x4abdd2 = _0x5af1b0['flatMap']((_0x2feda2) => {
          const _0x4498a2 = _0x5a88c8['get'](_0x2feda2);
          return Array['isArray'](_0x4498a2?.['dialogueUnits']) ? _0x4498a2['dialogueUnits'] : [];
        })
          ['map']((_0x52e08b) => ({
            ref: normalizeText(_0x52e08b?.['ref']),
            ...(normalizeText(_0x52e08b?.['speaker'])
              ? { speaker: normalizeText(_0x52e08b['speaker']) }
              : {}),
            text: normalizeText(_0x52e08b?.['text']),
          }))
          ['filter']((_0x449487) => _0x449487['ref'] && _0x449487['text']);
        return {
          ref: _0x14fc79,
          sourceSceneRef: _0x53365c,
          sourceBeatRefs: _0x5af1b0,
          beat: _0x59ff47,
          sceneAssetRef: _0x5a4bf6,
          sceneAppearanceRef: _0x2196eb,
          time: _0x397c9a,
          entryState: _0x17feb3,
          exitState: _0x1597c8,
          ...(includeDirectorContinuity ? { openingShotIntent: _0x47f602, closingShotIntent: _0x848a7 } : {}),
          continuityNotes: _0x59fb96,
          characterAssetRefs: normalizeStoryEpisodeSplitBlueprintAssetRefs(
            _0x1cb873?.['characterAssetRefs'],
            { assetsByRef: _0x3db789, kind: 'character', label: _0x3f07a6 },
          ),
          propAssetRefs: normalizeStoryEpisodeSplitBlueprintAssetRefs(_0x1cb873?.['propAssetRefs'], {
            assetsByRef: _0x3db789,
            kind: 'prop',
            label: _0x3f07a6,
          }),
          dialogueUnits: _0x4abdd2,
          targetDurationSec: _0x2b8fd2,
        };
      },
    );
  if (!_0x1f52c6['length']) throw new Error('Agent\x20返回的分镜蓝图没有可用片段计划。');
  const _0x388619 = _0x1f52c6['map']((_0x2965a7) => _0x2965a7['ref']);
  if (new Set(_0x388619)['size'] !== _0x388619['length']) throw new Error('Agent 返回了重复的片段计划引用。');
  const _0x2d2e07 = _0x1ef67a['map']((_0x422781) => normalizeText(_0x422781?.['ref'])),
    _0x8d6618 = _0x1f52c6['flatMap']((_0x45a017) => _0x45a017['sourceBeatRefs']);
  if (
    _0x2d2e07['length'] !== _0x8d6618['length'] ||
    _0x2d2e07['some']((_0x3984f5, _0xb44563) => _0x3984f5 !== _0x8d6618[_0xb44563])
  )
    throw new Error('Agent\x20分镜蓝图未按原文顺序完整且唯一地覆盖全部\x20sourceBeats。');
  return { episodeRef: _0x17aeab, clipPlans: _0x1f52c6 };
}
function createLocalStoryEpisodeSplitBlueprint({
  episodeRef: episodeRef = '',
  episodeRefs: episodeRefs = [],
  sourceScenes: sourceScenes = [],
  sourceBeats: sourceBeats = [],
  assets: assets = [],
  includeDirectorContinuity: includeDirectorContinuity = ![],
} = {}) {
  const _0x51ca85 = normalizeStoryAssetReference(episodeRef, 'episode-1'),
    _0x104af6 = new Map(
      (Array['isArray'](sourceScenes) ? sourceScenes : [])['map']((_0x393583) => [
        normalizeText(_0x393583?.['ref']),
        _0x393583,
      ]),
    ),
    _0x287dfd = (Array['isArray'](assets) ? assets : [])['filter'](
      (_0x51dbda) => _0x51dbda?.['kind'] === 'scene',
    ),
    _0x5eb62d = (Array['isArray'](assets) ? assets : [])['filter'](
      (_0x3b095c) => _0x3b095c?.['kind'] === 'character',
    ),
    _0x324d8e = (Array['isArray'](assets) ? assets : [])['filter'](
      (_0x4a1dfd) => _0x4a1dfd?.['kind'] === 'prop',
    ),
    _0x28c82d = _0x287dfd['some'](
      (_0x37abfe) => normalizeStringArray(_0x37abfe?.['sourceSceneRefs'])['length'],
    ),
    _0xeeb270 = (Array['isArray'](sourceBeats) ? sourceBeats : [])['map']((_0x2866e7, _0x34dc5c) => {
      const _0x26149c = normalizeText(_0x2866e7?.['sourceSceneRef']),
        _0xfb3d87 = _0x104af6['get'](_0x26149c) || {},
        _0xa9b7e8 = _0x28c82d
          ? getStoryEpisodeSceneAssetCandidates(_0xfb3d87, _0x287dfd, { episodeRefs: episodeRefs })[0x0]
          : _0x287dfd['find']((_0xc19167) =>
              storySceneIdentitiesOverlap(_0xc19167?.['name'], _0xfb3d87?.['heading']),
            ) || _0x287dfd[0x0];
      if (!_0xa9b7e8)
        throw new Error(
          '无法为场景“' + (normalizeText(_0xfb3d87?.['heading']) || _0x26149c) + '”建立本地分镜蓝图。',
        );
      const _0x319dfd = Array['isArray'](_0xa9b7e8?.['appearances']) ? _0xa9b7e8['appearances'] : [],
        _0x2cb099 =
          _0x319dfd['find']((_0x429940) =>
            normalizeStringArray(_0x429940?.['sourceSceneRefs'])['some']((_0x1b79cf) =>
              storyEpisodeSourceSceneRefsMatch(_0x1b79cf, _0x26149c, episodeRefs),
            ),
          ) ||
          _0x319dfd['find'](
            (_0x4323ad) =>
              normalizeText(_0x4323ad?.['ref']) === normalizeText(_0xa9b7e8?.['baseAppearanceRef']),
          ) ||
          _0x319dfd[0x0],
        _0x382d2b = normalizeText(_0x2866e7?.['body'] || _0xfb3d87?.['body'] || _0xfb3d87?.['heading']),
        _0xdd4218 = new Set([
          ...normalizeStringArray(_0xfb3d87?.['characters']),
          ...normalizeStringArray(_0x2866e7?.['characters']),
        ]),
        _0x51209c = _0x5eb62d['filter'](
          (_0xce573f) => _0xdd4218['has'](_0xce573f['name']) || _0x382d2b['includes'](_0xce573f['name']),
        )['map']((_0x279864) => _0x279864['ref']),
        _0x5c853d = _0x324d8e['filter'](
          (_0x3544c1) => _0x3544c1['name'] && _0x382d2b['includes'](_0x3544c1['name']),
        )['map']((_0x1c1552) => _0x1c1552['ref']),
        _0x329e32 = normalizeText(_0xfb3d87?.['heading'] || _0x2866e7?.['heading']),
        _0x5c04bb = _0x382d2b['slice'](0x0, 0x78) || _0x329e32 || '原文块 ' + (_0x34dc5c + 0x1);
      return {
        ref: _0x51ca85 + '-local-plan-' + (_0x34dc5c + 0x1),
        sourceSceneRef: _0x26149c,
        sourceBeatRefs: [normalizeText(_0x2866e7?.['ref'])],
        beat: _0x382d2b,
        sceneAssetRef: _0xa9b7e8['ref'],
        sceneAppearanceRef: normalizeText(_0x2cb099?.['ref']),
        entryState: '从原文动作起点进入：' + _0x5c04bb,
        exitState: '完整呈现该原文块后结束：' + _0x5c04bb,
        ...(includeDirectorContinuity
          ? {
              openingShotIntent: '根据当前剧情、表演重点和相邻画面自主选择开场镜头。',
              closingShotIntent: '根据当前动作结果与情绪落点自主选择结束镜头。',
            }
          : {}),
        continuityNotes: '严格保持原文顺序、人物状态、场景方位和动作承接。',
        characterAssetRefs: _0x51209c,
        propAssetRefs: _0x5c853d,
        dialogueUnits: Array['isArray'](_0x2866e7?.['dialogueUnits'])
          ? _0x2866e7['dialogueUnits']['map']((_0x97f6c7) => ({ ..._0x97f6c7 }))
          : [],
        targetDurationSec: Math['max'](0x4, Math['ceil']([..._0x382d2b]['length'] / 0x8)),
      };
    });
  if (!_0xeeb270['length']) throw new Error('无法从原文建立本地分镜蓝图。');
  return { episodeRef: _0x51ca85, clipPlans: _0xeeb270 };
}
function distributeStoryEpisodePlanDurationTargets(_0x965afa = [], _0x1edb51 = 0x0) {
  const _0x78cd95 = Array['isArray'](_0x965afa) ? _0x965afa : [],
    _0x37befc = normalizePositiveNumber(_0x1edb51);
  if (!_0x78cd95['length'] || !_0x37befc) return _0x78cd95;
  const _0x1d39e3 = _0x78cd95['map'](
      (_0x336cff) => normalizePositiveNumber(_0x336cff?.['targetDurationSec']) || 0x1,
    ),
    _0x315b1e = _0x1d39e3['reduce']((_0xe9a8b, _0x1f64cb) => _0xe9a8b + _0x1f64cb, 0x0);
  let _0x55a522 = 0x0;
  return _0x78cd95['map']((_0x28ca24, _0x41e5be) => {
    const _0xa9f2ab =
      _0x41e5be === _0x78cd95['length'] - 0x1
        ? Number((_0x37befc - _0x55a522)['toFixed'](0x1))
        : Number((_0x37befc * (_0x1d39e3[_0x41e5be] / _0x315b1e))['toFixed'](0x1));
    return (
      (_0x55a522 = Number((_0x55a522 + _0xa9f2ab)['toFixed'](0x1))),
      { ..._0x28ca24, targetDurationSec: Math['max'](0.1, _0xa9f2ab) }
    );
  });
}
function reconcileStoryEpisodeSplitBlueprintTiming(_0x3ae4f7 = {}, _0x34d2aa = {}) {
  const _0x15f3da = resolveStoryEpisodeSplitTimingBudget(_0x34d2aa),
    _0x209e73 = Array['isArray'](_0x3ae4f7?.['clipPlans']) ? _0x3ae4f7['clipPlans'] : [];
  if (!_0x15f3da || !_0x209e73['length']) return _0x3ae4f7;
  const _0x4a7d96 = _0x209e73['reduce'](
      (_0x157fda, _0x336860) =>
        _0x157fda + (normalizePositiveNumber(_0x336860?.['targetDurationSec']) || 0x0),
      0x0,
    ),
    _0x1cab5b = _0x15f3da['allowedProductionRangeSeconds'];
  if (_0x4a7d96 >= _0x1cab5b['minimum'] && _0x4a7d96 <= _0x1cab5b['maximum']) return _0x3ae4f7;
  const _0x5381cb = new Map(
      _0x15f3da['sceneTimings']['map']((_0x344b5c) => [normalizeText(_0x344b5c?.['sceneRef']), _0x344b5c]),
    ),
    _0x1ba263 = [...new Set(_0x209e73['map']((_0x43b654) => normalizeText(_0x43b654?.['sourceSceneRef'])))],
    _0x10a9b8 = _0x1ba263['length'] && _0x1ba263['every']((_0x3f71c6) => _0x5381cb['has'](_0x3f71c6));
  let _0x4eb102;
  if (_0x10a9b8) {
    const _0x256120 = new Map();
    _0x209e73['forEach']((_0x4f6677) => {
      const _0x468d23 = normalizeText(_0x4f6677?.['sourceSceneRef']),
        _0x1a69b8 = _0x256120['get'](_0x468d23) || [];
      (_0x1a69b8['push'](_0x4f6677), _0x256120['set'](_0x468d23, _0x1a69b8));
    });
    const _0x5ec8b2 = new Map();
    (_0x256120['forEach']((_0x9e8c36, _0x3536b2) => {
      distributeStoryEpisodePlanDurationTargets(_0x9e8c36, _0x5381cb['get'](_0x3536b2)?.['totalSeconds'])[
        'forEach'
      ]((_0x3f185b) => _0x5ec8b2['set'](_0x3f185b['ref'], _0x3f185b));
    }),
      (_0x4eb102 = _0x209e73['map']((_0x34558b) => _0x5ec8b2['get'](_0x34558b['ref']) || _0x34558b)));
  } else _0x4eb102 = distributeStoryEpisodePlanDurationTargets(_0x209e73, _0x15f3da['targetDurationSeconds']);
  return { ..._0x3ae4f7, clipPlans: _0x4eb102 };
}
export function buildStoryEpisodeSplitBlueprintPrompt({
  project: project = {},
  episode: episode = {},
  previousEpisode: previousEpisode = null,
  nextEpisode: nextEpisode = null,
  assets: assets = [],
  constraints: constraints = {},
  enforceMaxDuration: enforceMaxDuration = !![],
  sourceBeatsOverride: sourceBeatsOverride = null,
  promptExperiment: promptExperiment = ![],
  promptMode: promptMode = '',
} = {}) {
  const _0x18d8ba = normalizeStoryProjectInput(project);
  assertStoryProjectInput(_0x18d8ba);
  const _0x438a60 = selectStoryEpisodeSplitAssets(assets, episode);
  if (!_0x438a60['some']((_0x4b86e6) => _0x4b86e6['kind'] === 'scene'))
    throw new Error('分集缺少可用的场景资产，无法规划分镜蓝图。');
  const _0x1c02db = normalizeStoryEpisodeSplitSourceScenes(episode),
    _0x267a67 =
      Array['isArray'](sourceBeatsOverride) && sourceBeatsOverride['length']
        ? sourceBeatsOverride
        : normalizeStoryEpisodeSplitSourceBeats(episode);
  if (!_0x1c02db['length'] || !_0x267a67['length'] || !normalizeText(episode?.['title']))
    throw new Error('分集缺少标题或剧本正文，无法规划分镜蓝图。');
  const _0x905886 = resolveStoryPlanningConstraints(project, constraints),
    _0x935489 = normalizeText(promptMode)['toLowerCase']() || resolveStoryPromptMode(project, constraints),
    _0x2e9d06 = resolveStoryPromptModeClipMaxSeconds(_0x935489, _0x905886['sceneMaxSeconds']),
    _0x296014 = normalizeStoryAssetReference(
      episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
      'episode-1',
    ),
    _0x53aba3 = getStoryEpisodeReferenceAliases(episode),
    _0x747709 = normalizeStringArray(
      _0x267a67['map']((_0x8ef29c) => normalizeText(_0x8ef29c?.['sourceSceneRef'])),
    ),
    _0x2fdd04 = getStoryEpisodeBlueprintSceneAssetRefs(_0x747709, _0x1c02db, _0x438a60, {
      episodeRefs: _0x53aba3,
    }),
    _0x3d9e95 = _0x747709['some']((_0x2dbdc3) => !_0x2fdd04['has'](_0x2dbdc3)),
    _0xa91c56 = resolveStoryEpisodeSplitTimingBudget(episode);
  return JSON['stringify']({
    task: 'plan_story_episode_split_blueprint',
    ...(episode['replication']?.['sourceAnalysis']
      ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
      : {}),
    schemaVersion: STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION,
    scriptMode: _0x18d8ba['scriptMode'],
    project: buildStoryEpisodeSplitProjectContext(project, _0x18d8ba, { sourceBeats: _0x267a67 }),
    episode: {
      ref: _0x296014,
      title: normalizeText(episode?.['title']),
      synopsis: normalizeText(episode?.['synopsis']),
      sourceBeats: _0x267a67,
      ...(_0xa91c56 ? { timingBudget: _0xa91c56 } : {}),
    },
    assets: _0x438a60['map']((_0x32025b) =>
      compactStoryEpisodeBlueprintAsset(_0x32025b, { episodeRefs: _0x53aba3, sourceSceneRefs: _0x747709 }),
    ),
    continuity: {
      previousEpisode: normalizeStoryEpisodeSplitContinuityEpisode(previousEpisode, { includeEnding: !![] }),
      nextEpisode: normalizeStoryEpisodeSplitContinuityEpisode(nextEpisode),
    },
    constraints: enforceMaxDuration ? _0x905886 : { episodeCount: _0x905886['episodeCount'] },
    requirements: [
      '先只规划整集片段蓝图，不要返回 shots、camera、dialogue、voiceover 或 audio。',
      ...[buildVideoReplicationTimingGuidance(episode)]['filter'](Boolean),
      '按 sourceBeats 原顺序完整覆盖剧情；每个 sourceBeats[].ref 必须且只能在一个 clipPlan.sourceBeatRefs 中出现一次。',
      'sourceBeat 用于跟踪原文覆盖，不直接决定片段边界；一个 clipPlan 可以承载多个相互关联的动作、对白、表情和反应。',
      STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
      STORY_EPISODE_SPLIT_CONTINUITY_CHAIN_GUIDANCE,
      enforceMaxDuration
        ? 'targetDurationSec\x20体现当前连续叙事自然完成所需，并在视频模型的\x20' +
          _0x2e9d06 +
          '\x20秒能力内安排。' +
          STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE
        : 'targetDurationSec 体现当前连续叙事自然完成所需。' + STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
      ...(_0xa91c56
        ? [
            'episode.timingBudget 是正文完成后的独立逐场审时账本，不是大纲目标。全部 clipPlans.targetDurationSec 合计应接近 ' +
              _0xa91c56['targetDurationSeconds'] +
              ' 秒，并且必须落在制作允许区间 ' +
              _0xa91c56['allowedProductionRangeSeconds']['minimum'] +
              '-' +
              _0xa91c56['allowedProductionRangeSeconds']['maximum'] +
              '\x20秒。',
            '按\x20episode.timingBudget.sceneTimings\x20为对应\x20sourceSceneRef\x20分配时间；必须呈现账本中已经存在的对白、动作、等待、反应和转场，不得靠重复动作、空镜、慢动作或新增剧情凑时长。',
          ]
        : []),
      '客户端会按 clipPlans 顺序本地生成 ref，并从 sourceBeatRefs 推导 sourceSceneRef；不要返回 ref、sourceSceneRef 或 continuityNotes。',
      _0x3d9e95
        ? '每个 clipPlan 必须返回一个与 sourceBeatRefs 所属场景匹配的 kind=scene 的 assets[].ref。'
        : '当前 sourceSceneRef 均有唯一场景资产绑定，客户端会本地推导 sceneAssetRef；不要返回 sceneAssetRef。',
      '每个 clipPlan 必须返回该场景有效的 sceneAppearanceRef；场景没有形象时返回空字符串，多候选时不得猜测。',
      'entryState\x20和\x20exitState\x20必须写成可观察状态，记录人物站位、动作、情绪、视线、道具和空间方向，供相邻计划直接承接。',
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
      ...getStoryEpisodeTimelinePlanningRequirements(_0x935489)['filter'](
        (_0x5b7f28) => !isStoryEpisodeTimelineGuidance(_0x5b7f28),
      ),
    ],
    outputSchema: {
      episodeRef: _0x296014,
      clipPlans: [
        {
          sourceBeatRefs: ['按原顺序逐字使用一个或多个连续\x20sourceBeats[].ref'],
          beat: '概括当前连续片段内相互关联的动作、对白推进与情绪变化，不展开镜头细节',
          ...(_0x3d9e95 ? { sceneAssetRef: '逐字使用一个 kind=scene 的 assets[].ref' } : {}),
          sceneAppearanceRef: '该场景有效的 appearances[].ref；没有形象时为空字符串',
          entryState: '片段开头可观察的人物、动作、视线、道具与空间状态',
          exitState: '片段结束可观察的人物、动作、视线、道具与空间状态',
          ...(promptExperiment
            ? {
                openingShotIntent: 'AI 自主决定的开场镜头叙事意图，不写固定模板',
                closingShotIntent: 'AI\x20自主决定的结束镜头叙事意图，并考虑相邻计划衔接',
              }
            : {}),
          characterAssetRefs: ['当前片段实际出现的角色 assets[].ref'],
          propAssetRefs: ['当前片段实际出现的道具 assets[].ref'],
          targetDurationSec: enforceMaxDuration
            ? '正数且不超过 ' + _0x905886['sceneMaxSeconds']
            : '按剧情内容如实估算的正数秒数，无硬上限',
        },
      ],
    },
  });
}
export function createStoryEpisodeSplitBlueprintBatches(
  _0xd6f714 = [],
  { minSize: minSize = 0x1, maxSize: maxSize = STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH } = {},
) {
  const _0x5b8e85 = Array['isArray'](_0xd6f714) ? _0xd6f714 : [];
  if (!_0x5b8e85['length']) return [];
  const _0x412cdc = Math['max'](0x1, Math['trunc'](Number(minSize) || 0x1)),
    _0x5452a5 = Math['max'](
      _0x412cdc,
      Math['trunc'](Number(maxSize) || STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH),
    );
  if (_0x5b8e85['length'] <= _0x5452a5) return [_0x5b8e85['slice']()];
  const _0x347087 = Math['ceil'](_0x5b8e85['length'] / _0x5452a5),
    _0x38a71b = Math['floor'](_0x5b8e85['length'] / _0x347087),
    _0x331e79 = _0x5b8e85['length'] % _0x347087,
    _0x15de9f = [];
  let _0xe3e1a2 = 0x0;
  for (let _0x25815d = 0x0; _0x25815d < _0x347087; _0x25815d += 0x1) {
    const _0x1549fc = _0x38a71b + (_0x25815d < _0x331e79 ? 0x1 : 0x0);
    (_0x15de9f['push'](_0x5b8e85['slice'](_0xe3e1a2, _0xe3e1a2 + Math['max'](_0x412cdc, _0x1549fc))),
      (_0xe3e1a2 += Math['max'](_0x412cdc, _0x1549fc)));
  }
  if (_0xe3e1a2 < _0x5b8e85['length']) _0x15de9f['at'](-0x1)['push'](..._0x5b8e85['slice'](_0xe3e1a2));
  return _0x15de9f['filter']((_0x2e0e1e) => _0x2e0e1e['length']);
}
export function createStoryEpisodeExperimentalConcurrentBatches(
  _0x450ba8 = [],
  {
    maxPlansPerBatch: maxPlansPerBatch = STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH,
    targetDurationSeconds: targetDurationSeconds = STORY_EPISODE_EXPERIMENTAL_BATCH_TARGET_DURATION_SECONDS,
  } = {},
) {
  const _0x8b8345 = Array['isArray'](_0x450ba8) ? _0x450ba8 : [];
  if (!_0x8b8345['length']) return [];
  const _0x595900 = Math['max'](
      0x1,
      Math['trunc'](Number(maxPlansPerBatch) || STORY_EPISODE_EXPERIMENTAL_MAX_PLANS_PER_BATCH),
    ),
    _0x48fc79 = Math['max'](
      0x1,
      normalizePositiveNumber(targetDurationSeconds) ||
        STORY_EPISODE_EXPERIMENTAL_BATCH_TARGET_DURATION_SECONDS,
    ),
    _0x53d9c1 = [];
  let _0x188f1c = [],
    _0x2f2404 = 0x0;
  const _0x229c3a = () => {
    if (!_0x188f1c['length']) return;
    (_0x53d9c1['push'](_0x188f1c), (_0x188f1c = []), (_0x2f2404 = 0x0));
  };
  return (
    _0x8b8345['forEach']((_0x34d7ac) => {
      const _0xabaa7f =
        normalizePositiveNumber(_0x34d7ac?.['targetDurationSec']) ||
        STORY_EPISODE_EXPERIMENTAL_FALLBACK_PLAN_DURATION_SECONDS;
      (_0x188f1c['length'] &&
        (_0x188f1c['length'] >= _0x595900 || _0x2f2404 + _0xabaa7f > _0x48fc79) &&
        _0x229c3a(),
        _0x188f1c['push'](_0x34d7ac),
        (_0x2f2404 += _0xabaa7f));
    }),
    _0x229c3a(),
    _0x53d9c1
  );
}
function selectStoryEpisodeSplitBatchAssets(_0x1cdf50 = [], _0x10c436 = [], _0x137d59 = [], _0x12a594 = []) {
  const _0x2c9dc0 = new Set(
      _0x10c436['flatMap']((_0x13a4c6) => [
        _0x13a4c6?.['sceneAssetRef'],
        ...(Array['isArray'](_0x13a4c6?.['characterAssetRefs']) ? _0x13a4c6['characterAssetRefs'] : []),
        ...(Array['isArray'](_0x13a4c6?.['propAssetRefs']) ? _0x13a4c6['propAssetRefs'] : []),
      ])
        ['map'](normalizeText)
        ['filter'](Boolean),
    ),
    _0x2f43b5 = _0x137d59['flatMap']((_0x9e4a83) => [
      _0x9e4a83?.['heading'],
      ...(Array['isArray'](_0x9e4a83?.['characters']) ? _0x9e4a83['characters'] : []),
      _0x9e4a83?.['body'],
    ])
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['join']('\x0a'),
    _0x4a5886 = _0x137d59['map']((_0x25927b) => normalizeText(_0x25927b?.['ref']));
  return (Array['isArray'](_0x1cdf50) ? _0x1cdf50 : [])['filter'](
    (_0x36599e) =>
      _0x2c9dc0['has'](normalizeText(_0x36599e?.['ref'])) ||
      (storyAssetMatchesEpisode(_0x36599e, _0x12a594) &&
        _0x36599e['sourceSceneRefs']['some']((_0x5b8cfd) =>
          _0x4a5886['some']((_0x2dcd37) => storyEpisodeSourceSceneRefsMatch(_0x5b8cfd, _0x2dcd37, _0x12a594)),
        )) ||
      (normalizeText(_0x36599e?.['name']) && _0x2f43b5['includes'](normalizeText(_0x36599e['name']))),
  );
}
export function buildStoryEpisodeSplitBatchPrompt({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
  blueprint: blueprint = {},
  batchIndex: batchIndex = 0x0,
  batches: batches = [],
  planBatch: planBatch = null,
  batchNumber: batchNumber = 0x0,
  batchTotal: batchTotal = 0x0,
  enforceMaxDuration: enforceMaxDuration = !![],
  sourceBeatsOverride: sourceBeatsOverride = null,
  promptExperiment: promptExperiment = ![],
  promptMode: promptMode = '',
  timingCorrection: timingCorrection = null,
} = {}) {
  const _0x4efaf0 = normalizeStoryProjectInput(project),
    _0x2047ae = resolveStoryPlanningConstraints(project, constraints),
    _0x2719cc = normalizeText(promptMode)['toLowerCase']() || resolveStoryPromptMode(project, constraints),
    _0x520677 = resolveStoryPromptModeClipMaxSeconds(_0x2719cc, _0x2047ae['sceneMaxSeconds']),
    _0x51e042 = (Array['isArray'](assets) ? assets : [])
      ['map']((_0x29b0e3, _0xca52df) => normalizePlanningAssetSummary(_0x29b0e3, _0xca52df))
      ['filter']((_0xb542fb) => _0xb542fb['name']),
    _0x3af631 = Array['isArray'](blueprint?.['clipPlans']) ? blueprint['clipPlans'] : [],
    _0x115e60 =
      Array['isArray'](planBatch) && planBatch['length']
        ? planBatch
        : Array['isArray'](batches?.[batchIndex])
          ? batches[batchIndex]
          : [];
  if (!_0x115e60['length']) throw new Error('实验分批拆分缺少当前批次计划。');
  const _0x55a5e6 = normalizeStoryAssetReference(
      episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
      'episode-1',
    ),
    _0x2ca0e6 =
      Array['isArray'](sourceBeatsOverride) && sourceBeatsOverride['length']
        ? sourceBeatsOverride
        : normalizeStoryEpisodeSplitSourceBeats(episode),
    _0x1c7476 = new Set(
      _0x115e60['flatMap']((_0x1a912c) =>
        Array['isArray'](_0x1a912c?.['sourceBeatRefs']) ? _0x1a912c['sourceBeatRefs'] : [],
      ),
    ),
    _0x1b38ae = _0x2ca0e6['filter']((_0x1a47d2) => _0x1c7476['has'](_0x1a47d2['ref']));
  if (_0x1b38ae['length'] !== _0x1c7476['size'])
    throw new Error('实验分批拆分当前批次缺少蓝图引用的原文块。');
  const _0x3ea64f = selectStoryEpisodeSplitBatchAssets(
      _0x51e042,
      _0x115e60,
      _0x1b38ae,
      getStoryEpisodeReferenceAliases(episode),
    )['map']((_0x397da3) =>
      compactStoryEpisodePromptAsset(_0x397da3, {
        includeVisualDetails: !![],
        includeBindings: Array['isArray'](sourceBeatsOverride),
      }),
    ),
    _0x2b8f74 = new Set(
      _0x3ea64f['filter']((_0x16035a) => _0x16035a?.['kind'] === 'scene')['map']((_0x2ec480) =>
        normalizeText(_0x2ec480?.['ref']),
      ),
    ),
    _0x28bd16 = _0x115e60['map']((_0x1edccc) => normalizeText(_0x1edccc?.['sceneAssetRef']))['find'](
      (_0x1e91bf) => !_0x2b8f74['has'](_0x1e91bf),
    );
  if (_0x28bd16) throw new Error('实验分批拆分缺少场景资产“' + _0x28bd16 + '”。');
  const _0x26985e = _0x3af631['findIndex']((_0x227665) => _0x227665?.['ref'] === _0x115e60[0x0]?.['ref']),
    _0xdb635e = _0x3af631['findIndex']((_0x394dbd) => _0x394dbd?.['ref'] === _0x115e60['at'](-0x1)?.['ref']),
    _0x99275c = _0x26985e > 0x0 ? _0x3af631[_0x26985e - 0x1] : null,
    _0x1f3f31 = _0xdb635e >= 0x0 ? _0x3af631[_0xdb635e + 0x1] || null : null;
  return JSON['stringify']({
    task: 'expand_story_episode_split_batch',
    ...(episode['replication']?.['sourceAnalysis']
      ? { sourceVideoEvidence: buildVideoReplicationSourceEvidence(episode, project, assets) }
      : {}),
    schemaVersion: STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION,
    scriptMode: _0x4efaf0['scriptMode'],
    episode: { ref: _0x55a5e6, title: normalizeText(episode?.['title']) },
    batch: {
      index: Math['max'](0x1, Math['trunc'](Number(batchNumber) || batchIndex + 0x1)),
      total: Math['max'](0x1, Math['trunc'](Number(batchTotal) || batches['length'] || 0x1)),
      clipPlans: _0x115e60,
    },
    sourceBeats: _0x1b38ae,
    assets: _0x3ea64f,
    continuityLedger: {
      previousBoundary: _0x99275c
        ? {
            ref: _0x99275c['ref'],
            exitState: _0x99275c['exitState'],
            continuityNotes: _0x99275c['continuityNotes'],
            ...(promptExperiment ? { closingShotIntent: normalizeText(_0x99275c['closingShotIntent']) } : {}),
          }
        : null,
      currentEntry: {
        ref: _0x115e60[0x0]['ref'],
        entryState: _0x115e60[0x0]['entryState'],
        ...(promptExperiment
          ? { openingShotIntent: normalizeText(_0x115e60[0x0]['openingShotIntent']) }
          : {}),
      },
      nextBoundary: _0x1f3f31
        ? {
            ref: _0x1f3f31['ref'],
            entryState: _0x1f3f31['entryState'],
            continuityNotes: _0x1f3f31['continuityNotes'],
            ...(promptExperiment ? { openingShotIntent: normalizeText(_0x1f3f31['openingShotIntent']) } : {}),
          }
        : null,
    },
    constraints: enforceMaxDuration ? _0x2047ae : { episodeCount: _0x2047ae['episodeCount'] },
    visualDirection: { aspectRatio: _0x4efaf0['aspectRatio'] || '16:9', style: _0x4efaf0['visualStyle'] },
    timingBudget: {
      ...(!enforceMaxDuration ? { preserveSourceDialogueUnits: !![] } : {}),
      singleActionBeatPerShot: !![],
      singleContinuousCameraPerShot: !![],
    },
    durationBudgets: _0x115e60['map']((_0x3308a0) => ({
      ref: _0x3308a0['ref'],
      targetDurationSec: _0x3308a0['targetDurationSec'],
      ...(enforceMaxDuration ? { maxDurationSec: _0x520677 } : {}),
    })),
    ...(timingCorrection ? { timingCorrection: timingCorrection } : {}),
    requirements: [
      '只展开\x20batch.clipPlans；按给定顺序为每个计划准确返回一个同\x20ref\x20的\x20clip，不得增加、合并、遗漏或重排。',
      ...[buildVideoReplicationTimingGuidance(episode)]['filter'](Boolean),
      ...(buildVideoReplicationTimingGuidance(episode)
        ? [
            '原片总时长是整集所有批次的合计参考，不是当前批次或单个片段的目标；本批只分配其覆盖内容所需的时间。',
          ]
        : []),
      '只依据当前\x20sourceBeats\x20写剧情、对白和旁白；不得补写未提供的整集内容，也不得遗漏\x20clipPlan.sourceBeatRefs\x20对应的信息。',
      '返回的 clips 是按计划分开的中间展开容器，不直接提交给视频模型；按当前剧情和表演节拍展开原子分镜，客户端会依据用户设置的单片段最大时长重新分组。',
      enforceMaxDuration
        ? '根据当前连续叙事与表演节拍自主决定分镜组织方式；durationBudgets.targetDurationSec 用于安排参考，shots.durationSec 总和在视频模型的 ' +
          _0x520677 +
          ' 秒能力内。'
        : '把每个 clip 展开为自然连贯的原子分镜流，每镜时长按当前表演需要判断，并在视频模型的 ' +
          _0x520677 +
          ' 秒能力内。',
      ...(resolveStoryEpisodeSplitTimingBudget(episode)
        ? [
            'durationBudgets.targetDurationSec\x20来自正文逐场审时账本。每个计划全部\x20shots.durationSec\x20的合计必须落在对应\x20targetDurationSec\x20的\x2080%-120%\x20内；通过补全原文已有的动作过程、等待、反应和转场实现，不得重复内容或新增剧情。',
          ]
        : []),
      ...(timingCorrection
        ? [
            '这是自动时长复检后的定点重做。先根据\x20timingCorrection.previousFailure\x20修正上一轮时长缺口，再逐项自算每个计划\x20shots.durationSec\x20合计，确认达到\x20durationBudgets\x20后才返回。',
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
      ...getStoryEpisodeTimelinePlanningRequirements(_0x2719cc),
    ],
    outputSchema: {
      episodeRef: _0x55a5e6,
      clips: [
        {
          ref: '必须逐字使用对应 batch.clipPlans[].ref',
          shots: [
            {
              durationSec:
                '当前原子分镜精确秒数；结合口播内容、人物语速、情绪、句式、呼吸、动作、停顿与反应判断，并在视频模型的 ' +
                _0x520677 +
                '\x20秒能力内',
              ...(isStoryContinuousTimelinePromptMode(_0x2719cc)
                ? {
                    startSec: '当前 clip 内的整数开始秒数；首镜必须为 0，后续等于上一镜 endSec',
                    endSec:
                      '当前\x20clip\x20内的整数结束秒数；必须大于\x20startSec，且\x20endSec-startSec\x20等于\x20durationSec',
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
                '角色名：正文中的一条完整\x20dialogueUnit\x20原文；禁止自行断句或改写；没有则为空字符串',
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
  _0x2dce1d,
  {
    episodeRef: episodeRef = '',
    clipPlans: clipPlans = [],
    constraints: constraints = {},
    assets: assets = [],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const _0x29eaff = parseStoryEpisodeSplitResult(_0x2dce1d, {
      episodeRef: episodeRef,
      constraints: isStoryMinimaxH3PromptMode(promptMode)
        ? { ...constraints, sceneMaxSeconds: 0xf }
        : constraints,
      assets: assets,
      clipPlans: clipPlans,
      promptMode: promptMode,
    }),
    _0x4f4c89 = clipPlans['map']((_0x19f32a) => normalizeText(_0x19f32a?.['ref'])),
    _0x5b1b64 = _0x29eaff['clips']['map']((_0x34c443) => normalizeText(_0x34c443?.['ref']));
  if (
    _0x4f4c89['length'] !== _0x5b1b64['length'] ||
    _0x4f4c89['some']((_0x557516, _0x485e3c) => _0x557516 !== _0x5b1b64[_0x485e3c])
  )
    throw new Error('Agent 未按当前批次计划逐项返回同 ref 的片段。');
  return _0x29eaff;
}
function stripStoryShotSpeakerLabels(_0x14eb5e = '') {
  return normalizeText(_0x14eb5e)['replace'](
    /(^|[\n；;。！？!?])\s*[\p{Script=Han}A-Za-z0-9·_-]{1,16}\s*[：:]\s*/gu,
    '$1',
  );
}
function normalizeStoryDialogueComparisonText(_0x8b5430 = '') {
  return (stripStoryShotSpeakerLabels(_0x8b5430)['match'](/[\p{Script=Han}\p{L}\p{N}]/gu) || [])
    ['join']('')
    ['toLowerCase']();
}
function getStoryDialogueSpeakerPrefix(_0xb2f623 = '') {
  return (
    String(_0xb2f623 || '')
      ['trim']()
      ['match'](/^([\p{Script=Han}A-Za-z0-9·_-]{1,16}\s*[：:]\s*)/u)?.[0x1] || ''
  );
}
function completeStoryEpisodeSplitDialogueSpeaker(_0x44279e = '', _0x3dda34 = []) {
  const _0xb4ddad = normalizeText(_0x44279e);
  if (!_0xb4ddad || getStoryDialogueSpeakerPrefix(_0xb4ddad)) return _0xb4ddad;
  const _0x5c99d2 = normalizeStoryDialogueComparisonText(_0xb4ddad);
  if (!_0x5c99d2) return _0xb4ddad;
  const _0xcda5c4 = [
    ...new Set(
      (Array['isArray'](_0x3dda34) ? _0x3dda34 : [])
        ['filter']((_0x69028e) => normalizeStoryDialogueComparisonText(_0x69028e?.['text']) === _0x5c99d2)
        ['map']((_0x21c64f) => normalizeText(_0x21c64f?.['speaker']))
        ['filter'](Boolean),
    ),
  ];
  return _0xcda5c4['length'] === 0x1 ? _0xcda5c4[0x0] + '：' + _0xb4ddad : _0xb4ddad;
}
function mergeStoryEpisodeSplitDialogueFragments(_0xa96f2d = [], _0x265804 = []) {
  const _0x442218 = Array['isArray'](_0xa96f2d) ? _0xa96f2d : [],
    _0x5eb773 = (Array['isArray'](_0x265804) ? _0x265804 : [])
      ['map']((_0x218427) => ({
        ..._0x218427,
        text: normalizeText(_0x218427?.['text']),
        comparisonText: normalizeStoryDialogueComparisonText(_0x218427?.['text']),
      }))
      ['filter']((_0x3a3bbf) => _0x3a3bbf['text'] && _0x3a3bbf['comparisonText']);
  if (!_0x442218['length'] || !_0x5eb773['length']) return _0x442218;
  const _0x296364 = new Map();
  let _0x1c50ea = 0x0;
  _0x5eb773['forEach']((_0x224bf9) => {
    let _0x278cde = -0x1,
      _0x1a8e3a = -0x1,
      _0x18874b = '';
    for (let _0x47ae15 = _0x1c50ea; _0x47ae15 < _0x442218['length']; _0x47ae15 += 0x1) {
      const _0x500c80 = normalizeStoryDialogueComparisonText(_0x442218[_0x47ae15]?.['dialogue']);
      if (!_0x500c80) continue;
      if (_0x278cde < 0x0) {
        if (!_0x224bf9['comparisonText']['startsWith'](_0x500c80)) continue;
        ((_0x278cde = _0x47ae15), (_0x18874b = _0x500c80));
      } else {
        const _0x355b89 = '' + _0x18874b + _0x500c80;
        if (!_0x224bf9['comparisonText']['startsWith'](_0x355b89)) break;
        _0x18874b = _0x355b89;
      }
      if (_0x18874b === _0x224bf9['comparisonText']) {
        _0x1a8e3a = _0x47ae15;
        break;
      }
    }
    if (_0x278cde < 0x0 || _0x1a8e3a < _0x278cde) return;
    const _0x200d3f = _0x442218['slice'](_0x278cde, _0x1a8e3a + 0x1),
      _0x18f6a6 = _0x200d3f[0x0],
      _0x3da7f3 = _0x200d3f['at'](-0x1),
      _0x564155 =
        getStoryDialogueSpeakerPrefix(_0x18f6a6?.['dialogue']) ||
        (normalizeText(_0x224bf9?.['speaker']) ? normalizeText(_0x224bf9['speaker']) + '：' : ''),
      _0x529f4 = [
        ...new Map(
          _0x200d3f['flatMap']((_0x73d6ab) =>
            Array['isArray'](_0x73d6ab?.['assetUsages']) ? _0x73d6ab['assetUsages'] : [],
          )['map']((_0x3dd67d) => [
            normalizeText(_0x3dd67d?.['assetRef']) + '|' + normalizeText(_0x3dd67d?.['appearanceRef']),
            _0x3dd67d,
          ]),
        )['values'](),
      ],
      _0x3ee295 = [
        ...new Set(_0x200d3f['map']((_0x1ddb92) => normalizeText(_0x1ddb92?.['audio']))['filter'](Boolean)),
      ]['join']('；');
    (_0x296364['set'](_0x278cde, {
      endIndex: _0x1a8e3a,
      shot: {
        ..._0x18f6a6,
        durationSec: Number(
          _0x200d3f['reduce'](
            (_0x3ad7dc, _0x6b2689) => _0x3ad7dc + Number(_0x6b2689?.['durationSec'] || 0x0),
            0x0,
          )['toFixed'](0x1),
        ),
        ...(Number['isInteger'](Number(_0x18f6a6?.['startSec'])) &&
        Number['isInteger'](Number(_0x3da7f3?.['endSec']))
          ? { startSec: Number(_0x18f6a6['startSec']), endSec: Number(_0x3da7f3['endSec']) }
          : {}),
        assetUsages: _0x529f4,
        assetRefs: [
          ...new Set(
            _0x529f4['map']((_0xeb1a6d) => normalizeText(_0xeb1a6d?.['assetRef']))['filter'](Boolean),
          ),
        ],
        dialogue: '' + _0x564155 + _0x224bf9['text'],
        audio: _0x3ee295,
        cutAfter:
          normalizeText(_0x3da7f3?.['cutAfter']) === 'forbidden'
            ? 'allowed'
            : normalizeText(_0x3da7f3?.['cutAfter']) || 'preferred',
      },
    }),
      (_0x1c50ea = _0x1a8e3a + 0x1));
  });
  if (!_0x296364['size']) return _0x442218;
  const _0xc3d882 = [];
  for (let _0xce1320 = 0x0; _0xce1320 < _0x442218['length']; _0xce1320 += 0x1) {
    const _0x59ad1d = _0x296364['get'](_0xce1320);
    if (!_0x59ad1d) {
      _0xc3d882['push'](_0x442218[_0xce1320]);
      continue;
    }
    (_0xc3d882['push'](_0x59ad1d['shot']), (_0xce1320 = _0x59ad1d['endIndex']));
  }
  return _0xc3d882;
}
function normalizeStoryEpisodeSplitShotCamera(_0x1882ad = '') {
  const _0x4f276b = normalizeText(_0x1882ad);
  return _0x4f276b['replace'](/再切(?:至|到)/gu, '，随后镜头连续调整构图至')
    ['replace'](/再切/gu, '，随后镜头连续调整构图')
    ['replace'](/转场(?:至|到)/gu, '，镜头平滑衔接至')
    ['replace'](/转场/gu, '，镜头平滑衔接')
    ['replace'](/镜头切换(?:至|到)|镜头切(?:至|到)/gu, '镜头连续调整构图至')
    ['replace'](/切至|切到/gu, '，镜头连续调整构图至')
    ['replace'](/镜头切换/gu, '镜头连续调整构图')
    ['replace'](/，{2,}/gu, '，')
    ['replace'](/^，/u, '');
}
function normalizeStoryEpisodeSplitShot(
  _0x57f190 = {},
  {
    clipTitle: clipTitle = '片段',
    index: index = 0x0,
    assetCatalog: assetCatalog = buildStoryEpisodeSplitAssetCatalog(),
    fallbacks: fallbacks = {},
    allowEmptyAudio: allowEmptyAudio = !![],
    includeCutAfter: includeCutAfter = ![],
    includeTimeline: includeTimeline = ![],
    preserveCameraCuts: preserveCameraCuts = ![],
  } = {},
) {
  const _0x134cb3 =
      normalizePositiveNumber(_0x57f190?.['durationSec'] || _0x57f190?.['durationSeconds']) ||
      normalizePositiveNumber(fallbacks?.['durationSec']),
    _0x1086b9 = normalizeText(_0x57f190?.['time']) || normalizeText(fallbacks?.['time']),
    _0x560798 = normalizeText(_0x57f190?.['visual']) || normalizeText(fallbacks?.['visual']),
    _0x228b39 = normalizeText(_0x57f190?.['camera']) || normalizeText(fallbacks?.['camera']),
    _0x4e3999 = normalizeText(_0x57f190?.['audio']) || normalizeText(fallbacks?.['audio']);
  if (!_0x134cb3 || (!preserveCameraCuts && (!_0x560798 || !_0x228b39)) || (!allowEmptyAudio && !_0x4e3999))
    throw new Error(
      '片段“' +
        clipTitle +
        '”的分镜 ' +
        (index + 0x1) +
        '\x20缺少\x20durationSec、visual、camera\x20或\x20audio。',
    );
  const _0x43c116 = '片段“' + clipTitle + '”的分镜 ' + (index + 0x1),
    _0x31371e = preserveCameraCuts ? _0x228b39 : normalizeStoryEpisodeSplitShotCamera(_0x228b39),
    _0x3a5793 = normalizeText(_0x57f190?.['transitionFromPrevious'] || fallbacks?.['transitionFromPrevious']),
    _0x597799 = normalizeText(_0x57f190?.['dialogue']),
    _0x5f2326 = normalizeText(_0x57f190?.['voiceover']),
    _0x4e7e52 = normalizeText(_0x57f190?.['cutAfter'] || fallbacks?.['cutAfter'])['toLowerCase'](),
    _0x84b3 = ['preferred', 'allowed', 'forbidden']['includes'](_0x4e7e52) ? _0x4e7e52 : 'allowed',
    _0xdb86a4 = Number(_0x134cb3),
    _0x397fa8 = Number(_0x57f190?.['startSec']),
    _0x129870 = Number(_0x57f190?.['endSec']);
  if (includeTimeline && !isValidIntegerTimelineShot({ ..._0x57f190, durationSec: _0xdb86a4 }))
    throw new Error(
      '片段“' +
        clipTitle +
        '”的分镜 ' +
        (index + 0x1) +
        ' 必须提供连续整数 startSec/endSec，且 durationSec 等于二者之差。',
    );
  const _0x12d5cb = Array['isArray'](_0x57f190?.['assetUsages'])
      ? _0x57f190['assetUsages']
      : normalizeStringArray(_0x57f190?.['assetRefs'])['map']((_0x3757da) => {
          const _0x27a81d = assetCatalog['assetByRef']['get'](_0x3757da);
          if (_0x27a81d)
            return { assetRef: _0x3757da, appearanceRef: _0x27a81d['appearanceRefs'][0x0] || '' };
          const _0x23ac3d = assetCatalog['appearanceOwnerRefsByRef']['get'](_0x3757da);
          if (_0x23ac3d?.['size'] === 0x1) return { assetRef: [..._0x23ac3d][0x0], appearanceRef: _0x3757da };
          if (_0x23ac3d?.['size'] > 0x1) {
            const _0x26c51a = resolveStoryEpisodeSplitLegacyAppearanceOwner(
              _0x3757da,
              _0x23ac3d,
              assetCatalog,
              _0x57f190,
            );
            if (_0x26c51a) return { assetRef: _0x26c51a, appearanceRef: _0x3757da };
            throw new Error(
              _0x43c116 +
                '的旧形象引用“' +
                _0x3757da +
                '”存在多个所属资产；请同时提供\x20assetRef\x20和\x20appearanceRef。',
            );
          }
          const _0xf45f51 = resolveStoryEpisodeSplitUnknownLegacyAppearance(
            _0x3757da,
            assetCatalog,
            _0x57f190,
          );
          if (_0xf45f51)
            return { assetRef: _0xf45f51['assetRef'], appearanceRef: _0xf45f51['defaultAppearanceRef'] };
          return { assetRef: _0x3757da, appearanceRef: '' };
        }),
    _0x5454c9 = _0x12d5cb['map']((_0x19e403) =>
      normalizeStoryEpisodeSplitAssetUsage(_0x19e403, assetCatalog, _0x43c116),
    ),
    _0x56f922 = [...new Set(_0x5454c9['map']((_0x51adf5) => _0x51adf5['assetRef']))];
  return {
    durationSec: _0xdb86a4,
    ...(preserveCameraCuts ? replicationVisualFields(_0x57f190) : {}),
    ...(includeTimeline ? { startSec: _0x397fa8, endSec: _0x129870 } : {}),
    time: _0x1086b9,
    assetUsages: _0x5454c9,
    assetRefs: _0x56f922,
    visual: _0x560798,
    camera: _0x31371e,
    ...(_0x3a5793 ? { transitionFromPrevious: _0x3a5793 } : {}),
    dialogue: _0x597799,
    voiceover: _0x5f2326,
    audio: _0x4e3999,
    ...(includeCutAfter ? { cutAfter: _0x84b3 } : {}),
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
function getStoryEpisodeSplitShotCharacterText(_0x9551b2 = {}) {
  return [_0x9551b2?.['visual'], _0x9551b2?.['camera']]
    ['map'](normalizeText)
    ['filter'](Boolean)
    ['join']('\x20');
}
function hasStoryEpisodeSplitVisualCharacterReference(_0x4a6143, _0x16d2a3) {
  if (normalizeText(_0x4a6143?.['camera'])['includes'](_0x16d2a3)) return !![];
  const _0x3770c4 = normalizeText(_0x4a6143?.['visual'])
    ['split'](/[，,。；;！？!?：:\r\n]+/u)
    ['map']((_0x462b1c) => _0x462b1c['trim']())
    ['filter']((_0x3cea7f) => _0x3cea7f['includes'](_0x16d2a3));
  return _0x3770c4['some']((_0x4edeb4) => {
    const _0x1835f0 = _0x4edeb4['indexOf'](_0x16d2a3),
      _0x1f0ebc = _0x4edeb4['slice'](0x0, _0x1835f0),
      _0x11e044 = _0x4edeb4['slice'](_0x1835f0 + _0x16d2a3['length']),
      _0x3a8e18 =
        STORY_EPISODE_CHARACTER_VISIBLE_SUBJECT_PATTERN['test'](_0x11e044) ||
        STORY_EPISODE_CHARACTER_VISIBLE_OBJECT_PATTERN['test'](_0x1f0ebc) ||
        STORY_EPISODE_CHARACTER_VISUAL_PRESENCE_PATTERN['test'](_0x11e044['slice'](0x0, 0xc));
    if (_0x3a8e18) return !![];
    if (STORY_EPISODE_AUDIO_ONLY_CHARACTER_REFERENCE_PATTERN['test'](_0x4edeb4)) return ![];
    return !STORY_EPISODE_INDIRECT_CHARACTER_REFERENCE_PATTERN['test'](_0x4edeb4);
  });
}
function completeStoryEpisodeSplitCharacterAssetUsages(
  _0x3197b3 = [],
  {
    clipPlan: clipPlan = null,
    assetCatalog: assetCatalog = buildStoryEpisodeSplitAssetCatalog(),
    clipTitle: clipTitle = '片段',
    requireAllPlanCharacters: requireAllPlanCharacters = !![],
  } = {},
) {
  const _0x1688ee = [
      ...new Set(
        normalizeStringArray(clipPlan?.['characterAssetRefs'])['filter'](
          (_0x39d395) => assetCatalog['assetByRef']['get'](_0x39d395)?.['kind'] === 'character',
        ),
      ),
    ],
    _0xd943c3 = [...assetCatalog['assetByRef']['values']()]
      ['filter']((_0x3999ad) => _0x3999ad['kind'] === 'character')
      ['map']((_0x2e1313) => _0x2e1313['assetRef']);
  if (!_0xd943c3['length']) return _0x3197b3;
  const _0x27f3ee = new Set();
  let _0x24fe6c = [];
  const _0x22f8bf = _0x3197b3['map']((_0x57165f, _0xee4633) => {
      const _0x1a68af = getStoryEpisodeSplitShotCharacterText(_0x57165f),
        _0x46a57a = new Set(_0x57165f['assetUsages']['map']((_0x240336) => _0x240336['assetRef'])),
        _0x416af6 = _0xd943c3['filter']((_0x9f21b2) => _0x46a57a['has'](_0x9f21b2)),
        _0x3f5d9d = _0xd943c3['filter']((_0x3397b1) => {
          const _0x22bf81 = assetCatalog['assetByRef']['get'](_0x3397b1)?.['name'];
          return _0x22bf81 && hasStoryEpisodeSplitVisualCharacterReference(_0x57165f, _0x22bf81);
        });
      let _0x57a8df = [...new Set([..._0x416af6, ..._0x3f5d9d])];
      if (!_0x57a8df['length']) {
        const _0x3caaa2 = STORY_EPISODE_EXPLICIT_ENVIRONMENT_SHOT_PATTERN['test'](_0x1a68af);
        if (
          !_0x3caaa2 &&
          _0x1688ee['length'] === 0x1 &&
          (STORY_EPISODE_CHARACTER_SINGULAR_REFERENCE_PATTERN['test'](_0x1a68af) ||
            STORY_EPISODE_CHARACTER_ACTION_PATTERN['test'](_0x1a68af) ||
            normalizeText(_0x57165f?.['dialogue']) ||
            normalizeText(_0x57165f?.['voiceover']))
        )
          _0x57a8df = [..._0x1688ee];
        else {
          if (
            !_0x3caaa2 &&
            _0x24fe6c['length'] &&
            STORY_EPISODE_CHARACTER_GROUP_REFERENCE_PATTERN['test'](_0x1a68af)
          )
            _0x57a8df = [..._0x24fe6c];
          else
            !_0x3caaa2 &&
              _0x24fe6c['length'] === 0x1 &&
              STORY_EPISODE_CHARACTER_SINGULAR_REFERENCE_PATTERN['test'](_0x1a68af) &&
              (_0x57a8df = [..._0x24fe6c]);
        }
      }
      const _0x37870f = [..._0x57165f['assetUsages']];
      for (const _0x272eda of _0x57a8df) {
        _0x27f3ee['add'](_0x272eda);
        if (_0x46a57a['has'](_0x272eda)) continue;
        const _0x54f178 = assetCatalog['assetByRef']['get'](_0x272eda)?.['name'] || _0x272eda;
        (_0x37870f['push'](
          normalizeStoryEpisodeSplitAssetUsage(
            { assetRef: _0x272eda, appearanceRef: '' },
            assetCatalog,
            '片段“' + clipTitle + '”的分镜 ' + (_0xee4633 + 0x1) + ' 自动补全人物“' + _0x54f178 + '”',
          ),
        ),
          _0x46a57a['add'](_0x272eda));
      }
      if (_0x57a8df['length']) _0x24fe6c = _0x57a8df;
      return {
        ..._0x57165f,
        assetUsages: _0x37870f,
        assetRefs: [...new Set(_0x37870f['map']((_0x4a99e4) => _0x4a99e4['assetRef']))],
      };
    }),
    _0x28240b = _0x1688ee['filter']((_0x5db79c) => !_0x27f3ee['has'](_0x5db79c));
  if (requireAllPlanCharacters && _0x28240b['length']) {
    const _0x41d892 = _0x28240b['map'](
      (_0x383dd3) => assetCatalog['assetByRef']['get'](_0x383dd3)?.['name'] || _0x383dd3,
    );
    throw new Error(
      '片段“' +
        clipTitle +
        '”人物资产引用不完整：蓝图人物“' +
        _0x41d892['join']('、') +
        '”未出现在任何分镜的 assetUsages 中。',
    );
  }
  return _0x22f8bf;
}
function completeStoryEpisodeSplitSceneAssetUsage(
  _0xdd4b14 = [],
  {
    clipPlan: clipPlan = null,
    assetCatalog: assetCatalog = buildStoryEpisodeSplitAssetCatalog(),
    clipTitle: clipTitle = '片段',
  } = {},
) {
  if (!_0xdd4b14['length']) return _0xdd4b14;
  const _0x4fe229 = normalizeText(clipPlan?.['sceneAssetRef']);
  if (!_0x4fe229 || assetCatalog['assetByRef']['get'](_0x4fe229)?.['kind'] !== 'scene') return _0xdd4b14;
  const _0x5d5456 = _0xdd4b14['some']((_0x43b704) =>
    _0x43b704['assetUsages']['some']((_0x391a0e) => _0x391a0e['assetRef'] === _0x4fe229),
  );
  if (_0x5d5456) return _0xdd4b14;
  const _0x413330 = normalizeStoryEpisodeSplitAssetUsage(
    { assetRef: _0x4fe229, appearanceRef: normalizeText(clipPlan?.['sceneAppearanceRef']) },
    assetCatalog,
    '片段“' + clipTitle + '”自动补全场景',
  );
  return _0xdd4b14['map']((_0x1c408c, _0x1b43fe) => {
    if (_0x1b43fe !== 0x0) return _0x1c408c;
    const _0x36ad38 = [_0x413330, ..._0x1c408c['assetUsages']];
    return {
      ..._0x1c408c,
      assetUsages: _0x36ad38,
      assetRefs: [...new Set(_0x36ad38['map']((_0x224493) => _0x224493['assetRef']))],
    };
  });
}
function formatStoryEpisodeClipTitle(_0x3b496b = 0x0) {
  return '片段' + String(_0x3b496b + 0x1)['padStart'](0x2, '0');
}
function validateStoryEpisodeSplitClipIndependence({
  clipLabel: clipLabel = '片段',
  script: script = '',
  creativeIntent: creativeIntent = '',
  transition: transition = '',
} = {}) {
  const _0xe7470c = [script, creativeIntent, transition]['join']('\x20'),
    _0x47c4bb = _0xe7470c['match'](
      /当前为原片段第\s*\d+\s*\/\s*\d+\s*段|原片段第\s*\d+\s*\/\s*\d+\s*段|承接(?:上一|下一)片段|参见(?:上一|下一)片段/u,
    );
  if (_0x47c4bb)
    throw new Error(
      clipLabel + '\x20包含依赖其他视频上下文的描述“' + _0x47c4bb[0x0] + '”，每个片段必须独立完整。',
    );
}
function normalizeStoryEpisodeExperimentalStandaloneText(_0x4c08b5 = '') {
  return normalizeText(_0x4c08b5)
    ['replace'](/当前为原片段第\s*\d+\s*\/\s*\d+\s*段/gu, '当前剧情段落')
    ['replace'](/原片段第\s*\d+\s*\/\s*\d+\s*段/gu, '当前剧情段落')
    ['replace'](/承接(?:上一|下一)片段/gu, '从当前可观察状态开始')
    ['replace'](/参见(?:上一|下一)片段/gu, '以当前画面状态为准')
    ['replace'](/(?:上一|下一)片段/gu, '相邻剧情');
}
function getStoryEpisodeSplitShotsDuration(_0x36e7cd = []) {
  return _0x36e7cd['reduce'](
    (_0x227b6d, _0xa5d340) => _0x227b6d + Number(_0xa5d340?.['durationSec'] || 0x0),
    0x0,
  );
}
function tokenizeStoryEpisodeExperimentalShotText(
  _0x51c3de = '',
  { preserveSpeaker: preserveSpeaker = ![] } = {},
) {
  const _0x305dad = String(_0x51c3de || '')['trim']();
  if (!_0x305dad) return [];
  const _0x479f0d = [],
    _0x2ee05d = preserveSpeaker ? _0x305dad['split'](/\n+/u) : [_0x305dad];
  return (
    _0x2ee05d['forEach']((_0x362c82) => {
      const _0x4cb238 = _0x362c82['trim']();
      if (!_0x4cb238) return;
      const _0x497fb4 = preserveSpeaker ? _0x4cb238['match'](/^([^：:\n]{1,20}[：:])\s*(.*)$/u) : null,
        _0x43d8c8 = _0x497fb4?.[0x1] || '',
        _0x450561 = _0x497fb4?.[0x2] || _0x4cb238,
        _0x1e95c2 = _0x450561['match'](
          preserveSpeaker
            ? /[^。！？!?\n]+(?:[。！？!?]+|$)/gu
            : /[^。！？!?；;，,\n]+(?:[。！？!?；;，,]+|$)/gu,
        ) || [_0x450561];
      _0x1e95c2['map']((_0x4fa649) => _0x4fa649['trim']())
        ['filter'](Boolean)
        ['forEach']((_0x4f9920) => {
          _0x479f0d['push']('' + _0x43d8c8 + _0x4f9920);
        });
    }),
    _0x479f0d
  );
}
function splitStoryEpisodeExperimentalClause(_0xdc196e = '', _0x5b0b3a = ![]) {
  const _0x1f8ae4 = _0x5b0b3a ? _0xdc196e['match'](/^([^：:\n]{1,20}[：:])(.*)$/u) : null,
    _0xcd095 = _0x1f8ae4?.[0x1] || '',
    _0x56560b = _0x1f8ae4?.[0x2] || _0xdc196e,
    _0x4aa05e = [..._0x56560b];
  if (_0x4aa05e['length'] < 0x2) return [_0xdc196e];
  const _0x3e88c8 = Math['ceil'](_0x4aa05e['length'] / 0x2);
  return [
    '' + _0xcd095 + _0x4aa05e['slice'](0x0, _0x3e88c8)['join'](''),
    '' + _0xcd095 + _0x4aa05e['slice'](_0x3e88c8)['join'](''),
  ];
}
function splitStoryEpisodeExperimentalShotText(
  _0x1f5f55 = '',
  _0x557da9 = 0x1,
  { preserveSpeaker: preserveSpeaker = ![], splitFragments: splitFragments = !![] } = {},
) {
  const _0x9a65cd = Math['max'](0x1, Math['trunc'](Number(_0x557da9) || 0x1)),
    _0x3bf1a4 = tokenizeStoryEpisodeExperimentalShotText(_0x1f5f55, { preserveSpeaker: preserveSpeaker });
  while (splitFragments && _0x3bf1a4['length'] && _0x3bf1a4['length'] < _0x9a65cd) {
    let _0x1576f3 = 0x0;
    for (let _0x216d4f = 0x1; _0x216d4f < _0x3bf1a4['length']; _0x216d4f += 0x1) {
      if ([..._0x3bf1a4[_0x216d4f]]['length'] > [..._0x3bf1a4[_0x1576f3]]['length']) _0x1576f3 = _0x216d4f;
    }
    const _0x502f58 = splitStoryEpisodeExperimentalClause(_0x3bf1a4[_0x1576f3], preserveSpeaker);
    if (_0x502f58['length'] < 0x2) break;
    _0x3bf1a4['splice'](_0x1576f3, 0x1, ..._0x502f58);
  }
  if (!_0x3bf1a4['length']) return Array['from']({ length: _0x9a65cd }, () => '');
  if (!splitFragments && _0x3bf1a4['length'] < _0x9a65cd) {
    const _0x4c3bd0 = Array['from']({ length: _0x9a65cd }, () => '');
    return (
      _0x3bf1a4['forEach']((_0x22b40f, _0x10b28f) => {
        const _0x161ef3 = Math['min'](
          _0x9a65cd - 0x1,
          Math['floor']((_0x10b28f * _0x9a65cd) / _0x3bf1a4['length']),
        );
        _0x4c3bd0[_0x161ef3] = _0x4c3bd0[_0x161ef3] ? _0x4c3bd0[_0x161ef3] + '\x0a' + _0x22b40f : _0x22b40f;
      }),
      _0x4c3bd0
    );
  }
  const _0x1f95d1 = [];
  let _0x373ddc = 0x0;
  for (let _0x483c69 = 0x0; _0x483c69 < _0x9a65cd; _0x483c69 += 0x1) {
    const _0x253796 = _0x9a65cd - _0x483c69,
      _0x1535d8 = _0x3bf1a4['length'] - _0x373ddc;
    if (_0x1535d8 <= 0x0) {
      _0x1f95d1['push']('');
      continue;
    }
    if (_0x253796 === 0x1) {
      (_0x1f95d1['push'](_0x3bf1a4['slice'](_0x373ddc)['join'](preserveSpeaker ? '\x0a' : '')),
        (_0x373ddc = _0x3bf1a4['length']));
      continue;
    }
    const _0x4bcd60 = Math['max'](0x1, _0x1535d8 - (_0x253796 - 0x1)),
      _0x4fdb51 = _0x3bf1a4['slice'](_0x373ddc)['reduce'](
        (_0x37b833, _0x2cf943) => _0x37b833 + [..._0x2cf943]['length'],
        0x0,
      ),
      _0x487347 = _0x4fdb51 / _0x253796;
    let _0x28f72f = 0x1,
      _0x12327c = [..._0x3bf1a4[_0x373ddc]]['length'];
    while (_0x28f72f < _0x4bcd60 && _0x12327c < _0x487347) {
      ((_0x12327c += [..._0x3bf1a4[_0x373ddc + _0x28f72f]]['length']), (_0x28f72f += 0x1));
    }
    (_0x1f95d1['push'](
      _0x3bf1a4['slice'](_0x373ddc, _0x373ddc + _0x28f72f)['join'](preserveSpeaker ? '\x0a' : ''),
    ),
      (_0x373ddc += _0x28f72f));
  }
  return _0x1f95d1;
}
function splitStoryEpisodeExperimentalOverlongEntry(
  _0x29b880 = {},
  { maximum: maximum = 0xf, targetMaximum: targetMaximum = maximum, entryIndex: entryIndex = 0x0 } = {},
) {
  const _0x408fd7 = _0x29b880?.['shot'] || {},
    _0x2cb06d = normalizePositiveNumber(_0x408fd7?.['durationSec']);
  if (!_0x2cb06d || _0x2cb06d <= maximum + 0.001) return [_0x29b880];
  const _0x1109da = Math['max'](0x1, normalizePositiveNumber(targetMaximum) || maximum),
    _0x52063b = Math['max'](0x2, Math['ceil'](_0x2cb06d / _0x1109da)),
    _0x10262c = splitStoryEpisodeExperimentalShotText(_0x408fd7['visual'], _0x52063b, {
      splitFragments: ![],
    }),
    _0x3c8f1f = splitStoryEpisodeExperimentalShotText(_0x408fd7['dialogue'], _0x52063b, {
      preserveSpeaker: !![],
      splitFragments: ![],
    }),
    _0x568ff9 = splitStoryEpisodeExperimentalShotText(_0x408fd7['voiceover'], _0x52063b, {
      preserveSpeaker: !![],
      splitFragments: ![],
    }),
    _0x4912bf = splitStoryEpisodeExperimentalShotText(_0x408fd7['audio'], _0x52063b, { splitFragments: ![] });
  let _0x16118d = Number(_0x2cb06d['toFixed'](0x1));
  const _0x1f9ee6 = normalizeText(_0x29b880?.['sourceClip']?.['ref']) || 'clip-' + (entryIndex + 0x1);
  return Array['from']({ length: _0x52063b }, (_0x215714, _0x4d6de9) => {
    const _0x3302b4 = _0x52063b - _0x4d6de9,
      _0x4e5e16 = _0x4d6de9 === _0x52063b - 0x1 ? _0x16118d : Number((_0x16118d / _0x3302b4)['toFixed'](0x1));
    _0x16118d = Number((_0x16118d - _0x4e5e16)['toFixed'](0x1));
    const _0x2c8bc0 = _0x10262c[_0x4d6de9] || normalizeText(_0x408fd7['visual']),
      _0x41f3a5 = _0x3c8f1f[_0x4d6de9] || '',
      _0x24f300 = _0x568ff9[_0x4d6de9] || '',
      _0x3d67d4 = _0x4912bf[_0x4d6de9] || '';
    return {
      ..._0x29b880,
      sourceClip: {
        ..._0x29b880['sourceClip'],
        ref: _0x1f9ee6 + '-local-part-' + (entryIndex + 0x1) + '-' + (_0x4d6de9 + 0x1),
        script: [_0x2c8bc0, _0x41f3a5, _0x24f300]['filter'](Boolean)['join']('\x20'),
        transition:
          _0x4d6de9 === _0x52063b - 0x1
            ? normalizeText(_0x29b880?.['sourceClip']?.['transition'])
            : '当前动作在下一镜中连续完成。',
      },
      shot: {
        ..._0x408fd7,
        durationSec: _0x4e5e16,
        visual: _0x2c8bc0,
        dialogue: _0x41f3a5,
        voiceover: _0x24f300,
        audio: _0x3d67d4,
        cutAfter:
          _0x4d6de9 === _0x52063b - 0x1 ? normalizeText(_0x408fd7?.['cutAfter']) || 'allowed' : 'allowed',
      },
    };
  });
}
function compareStoryEpisodeExperimentalPartitionCandidate(_0x155627, _0x4de9a6) {
  if (!_0x4de9a6) return -0x1;
  if (_0x155627['groupCount'] !== _0x4de9a6['groupCount'])
    return _0x155627['groupCount'] - _0x4de9a6['groupCount'];
  return _0x155627['penalty'] - _0x4de9a6['penalty'];
}
function partitionStoryEpisodeExperimentalSceneShots(
  _0x55a5b4 = [],
  {
    maxDurationSeconds: maxDurationSeconds = 0xf,
    minDurationSeconds: minDurationSeconds = STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS,
  } = {},
) {
  if (!_0x55a5b4['length']) return [];
  const _0xcf166c = Math['max'](0x1, normalizePositiveNumber(maxDurationSeconds) || 0xf),
    _0x56e099 = Math['max'](0x0, normalizePositiveNumber(minDurationSeconds) || 0x0);
  _0x55a5b4 = _0x55a5b4['flatMap']((_0x4a7218, _0x31db38) =>
    splitStoryEpisodeExperimentalOverlongEntry(_0x4a7218, {
      maximum: _0xcf166c,
      targetMaximum: _0xcf166c,
      entryIndex: _0x31db38,
    }),
  );
  const _0x295242 = Math['max'](_0x56e099, _0xcf166c * 0.68),
    _0x389c44 = new Map(),
    _0x1e2d07 = (_0x4debd6) => {
      if (_0x4debd6 >= _0x55a5b4['length']) return { groupCount: 0x0, penalty: 0x0, groups: [] };
      if (_0x389c44['has'](_0x4debd6)) return _0x389c44['get'](_0x4debd6);
      let _0x2f945a = 0x0,
        _0x36c29b = null;
      for (let _0x4778e1 = _0x4debd6; _0x4778e1 < _0x55a5b4['length']; _0x4778e1 += 0x1) {
        const _0x4fdba1 = _0x4778e1 - _0x4debd6 + 0x1;
        if (_0x4fdba1 > STORY_EPISODE_EXPERIMENTAL_MAX_FINAL_SHOTS_PER_CLIP) break;
        _0x2f945a += Number(_0x55a5b4[_0x4778e1]?.['shot']?.['durationSec'] || 0x0);
        if (_0x2f945a > _0xcf166c + 0.001) break;
        const _0x1d781d = _0x1e2d07(_0x4778e1 + 0x1);
        if (!_0x1d781d) continue;
        const _0x1d8a7b = normalizeText(_0x55a5b4[_0x4778e1]?.['shot']?.['cutAfter'])['toLowerCase'](),
          _0xc41c7f =
            _0x4778e1 === _0x55a5b4['length'] - 0x1 || _0x1d8a7b === 'preferred'
              ? 0x0
              : _0x1d8a7b === 'forbidden'
                ? 0x9c4
                : 0x19,
          _0x106c03 = _0x2f945a < _0x56e099 ? (_0x56e099 - _0x2f945a) * 0x12c : 0x0,
          _0x34b156 = (_0x2f945a - _0x295242) ** 0x2,
          _0x3ac5d5 =
            (_0x4fdba1 - STORY_EPISODE_EXPERIMENTAL_PREFERRED_SHOTS_PER_CLIP) ** 0x2 * 0x4b +
            (_0x4fdba1 < 0x3 ? (0x3 - _0x4fdba1) * 0x1f4 : 0x0),
          _0x5e5617 = {
            groupCount: _0x1d781d['groupCount'] + 0x1,
            penalty: _0x1d781d['penalty'] + _0xc41c7f + _0x106c03 + _0x34b156 + _0x3ac5d5,
            groups: [_0x55a5b4['slice'](_0x4debd6, _0x4778e1 + 0x1), ..._0x1d781d['groups']],
          };
        compareStoryEpisodeExperimentalPartitionCandidate(_0x5e5617, _0x36c29b) < 0x0 &&
          (_0x36c29b = _0x5e5617);
      }
      return (_0x389c44['set'](_0x4debd6, _0x36c29b), _0x36c29b);
    },
    _0x49d680 = _0x1e2d07(0x0);
  if (!_0x49d680) {
    const _0x19459a = _0x55a5b4['find'](
        (_0x2e6d97) => Number(_0x2e6d97?.['shot']?.['durationSec'] || 0x0) > _0xcf166c + 0.001,
      ),
      _0x28ae29 = Number(_0x19459a?.['shot']?.['durationSec'] || 0x0);
    throw new Error(
      _0x28ae29
        ? '实验分镜存在单镜 ' +
            _0x28ae29['toFixed'](0x1) +
            ' 秒，超过 ' +
            _0xcf166c +
            ' 秒上限；单镜必须由 Agent 拆成连续镜头。'
        : '实验分镜无法在场景内组成有效视频片段。',
    );
  }
  return _0x49d680['groups'];
}
function joinStoryEpisodeExperimentalClipText(_0x2cd946 = []) {
  return [...new Set(_0x2cd946['map'](normalizeText)['filter'](Boolean))]['join']('；');
}
export function repackStoryEpisodeExperimentalClips({
  episodeRef: episodeRef = '',
  clipPlans: clipPlans = [],
  completedPlanResults: completedPlanResults = [],
  maxDurationSeconds: maxDurationSeconds = 0xf,
  minDurationSeconds: minDurationSeconds = STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS,
  promptExperiment: promptExperiment = ![],
  preserveSourceGroups: preserveSourceGroups = ![],
} = {}) {
  const _0x2f41a5 = normalizeStoryAssetReference(episodeRef, 'episode-1'),
    _0x2761c3 = new Map(
      (Array['isArray'](clipPlans) ? clipPlans : [])['map']((_0x57f737) => [
        normalizeText(_0x57f737?.['ref']),
        _0x57f737,
      ]),
    ),
    _0x2db90d = new Map(
      (Array['isArray'](completedPlanResults) ? completedPlanResults : [])['map']((_0x46228a) => [
        normalizeText(_0x46228a?.['sourcePlanRef']),
        _0x46228a,
      ]),
    ),
    _0x20a89c = [];
  for (const _0x296e2f of _0x2761c3['values']()) {
    const _0xe6c1d5 = _0x2db90d['get'](normalizeText(_0x296e2f?.['ref']));
    for (const _0x2a0884 of Array['isArray'](_0xe6c1d5?.['clips']) ? _0xe6c1d5['clips'] : []) {
      const _0x46ca73 = Array['isArray'](_0x2a0884?.['shots']) ? _0x2a0884['shots'] : [];
      _0x46ca73['forEach']((_0x68db6e, _0x587736) => {
        _0x20a89c['push']({
          plan: _0x296e2f,
          sourceClip: _0x2a0884,
          shot: {
            ..._0x68db6e,
            cutAfter:
              normalizeText(_0x68db6e?.['cutAfter']) ||
              (_0x587736 === _0x46ca73['length'] - 0x1 ? 'preferred' : 'allowed'),
          },
        });
      });
    }
  }
  if (!_0x20a89c['length']) throw new Error('实验分批没有可用于重组的分镜。');
  if (preserveSourceGroups) {
    const _0x17b1bc = [];
    for (const _0x4c9cc5 of _0x2761c3['values']()) {
      const _0x534712 = _0x2db90d['get'](normalizeText(_0x4c9cc5?.['ref']));
      for (const _0x57cbe9 of Array['isArray'](_0x534712?.['clips']) ? _0x534712['clips'] : []) {
        const _0x18e076 = Array['isArray'](_0x57cbe9?.['shots']) ? _0x57cbe9['shots'] : [];
        if (!_0x18e076['length']) continue;
        _0x17b1bc['push']({
          ..._0x57cbe9,
          ref: _0x2f41a5 + '-experimental-clip-' + (_0x17b1bc['length'] + 0x1),
          title: formatStoryEpisodeClipTitle(_0x17b1bc['length']),
          shots: _0x18e076,
          contentDurationSec: Number(getStoryEpisodeSplitShotsDuration(_0x18e076)['toFixed'](0x1)),
          durationSec: Number(getStoryEpisodeSplitShotsDuration(_0x18e076)['toFixed'](0x1)),
          assetRefs: [...new Set(_0x18e076['flatMap']((_0x2ecd76) => _0x2ecd76?.['assetRefs'] || []))],
          sourcePlanRefs: [normalizeText(_0x4c9cc5?.['ref'])]['filter'](Boolean),
        });
      }
    }
    return promptExperiment ? addStoryEpisodeDirectorContinuityHandoffs(_0x17b1bc) : _0x17b1bc;
  }
  const _0x4b4af4 = [];
  let _0x3a7c62 = [],
    _0xde6791 = '';
  _0x20a89c['forEach']((_0x1e0b00) => {
    const _0x558730 = [
      normalizeText(_0x1e0b00['plan']?.['sourceSceneRef']),
      normalizeText(_0x1e0b00['plan']?.['sceneAssetRef']),
      normalizeText(_0x1e0b00['plan']?.['sceneAppearanceRef']),
    ]['join']('|');
    (_0x3a7c62['length'] && _0x558730 !== _0xde6791 && (_0x4b4af4['push'](_0x3a7c62), (_0x3a7c62 = [])),
      (_0xde6791 = _0x558730),
      _0x3a7c62['push'](_0x1e0b00));
  });
  if (_0x3a7c62['length']) _0x4b4af4['push'](_0x3a7c62);
  const _0x26a709 = _0x4b4af4['flatMap']((_0x12d5be) =>
      partitionStoryEpisodeExperimentalSceneShots(_0x12d5be, {
        maxDurationSeconds: maxDurationSeconds,
        minDurationSeconds: minDurationSeconds,
      }),
    ),
    _0x52c60a = _0x26a709['map']((_0x20d5d5, _0x2f9d14) => {
      const _0x37daff = [
          ...new Map(
            _0x20d5d5['map']((_0x59cbdf) => [
              normalizeText(_0x59cbdf['sourceClip']?.['ref']),
              _0x59cbdf['sourceClip'],
            ]),
          )['values'](),
        ],
        _0x1bf986 = [...new Set(_0x20d5d5['map']((_0x27a740) => normalizeText(_0x27a740['plan']?.['ref'])))],
        _0x56b130 = _0x20d5d5['map']((_0x2d1f99) => _0x2d1f99['shot']),
        _0x3c034a = Number(getStoryEpisodeSplitShotsDuration(_0x56b130)['toFixed'](0x1)),
        _0x1a0ac9 = Number(
          Math['max'](normalizePositiveNumber(minDurationSeconds) || 0x0, _0x3c034a)['toFixed'](0x1),
        );
      return {
        ref: _0x2f41a5 + '-experimental-clip-' + (_0x2f9d14 + 0x1),
        title: formatStoryEpisodeClipTitle(_0x2f9d14),
        script: joinStoryEpisodeExperimentalClipText(_0x37daff['map']((_0x249b1d) => _0x249b1d?.['script'])),
        creativeIntent: joinStoryEpisodeExperimentalClipText(
          _0x37daff['map']((_0x50eb08) => _0x50eb08?.['creativeIntent']),
        ),
        transition: joinStoryEpisodeExperimentalClipText(
          _0x37daff['map']((_0x592269) => _0x592269?.['transition']),
        ),
        shots: _0x56b130,
        contentDurationSec: _0x3c034a,
        durationSec: _0x1a0ac9,
        assetRefs: [...new Set(_0x56b130['flatMap']((_0x139bd7) => _0x139bd7?.['assetRefs'] || []))],
        sourcePlanRefs: _0x1bf986,
      };
    });
  if (!promptExperiment) return _0x52c60a;
  return addStoryEpisodeDirectorContinuityHandoffs(_0x52c60a);
}
function addStoryEpisodeDirectorContinuityHandoffs(_0x805b89 = []) {
  return _0x805b89['map']((_0x416e82, _0x5103b8) => {
    const _0x2ff92f = _0x5103b8 > 0x0 ? _0x805b89[_0x5103b8 - 0x1] : null,
      _0x2b6deb = _0x2ff92f?.['shots']?.['at'](-0x1) || null,
      _0xf12fe4 = _0x416e82?.['shots']?.[0x0] || null;
    return {
      ..._0x416e82,
      directorContinuityTest: !![],
      continuityHandoff: {
        previousExitState: normalizeText(_0x2b6deb?.['visual']),
        previousEndCamera: normalizeText(_0x2b6deb?.['camera']),
        currentEntryState: normalizeText(_0xf12fe4?.['visual']),
        currentOpeningCamera: normalizeText(_0xf12fe4?.['camera']),
        transitionFromPrevious: normalizeText(_0xf12fe4?.['transitionFromPrevious']),
      },
    };
  });
}
function createStoryEpisodeClipDurationError({
  clip: clip = {},
  clipIndex: clipIndex = 0x0,
  clipCount: clipCount = 0x0,
  sourceShots: sourceShots = [],
  shots: shots = [],
  durationSec: durationSec = 0x0,
  maxDurationSeconds: maxDurationSeconds = 0xf,
} = {}) {
  const _0x171698 = formatStoryEpisodeClipTitle(clipIndex),
    _0x2cffa9 = Number(durationSec['toFixed'](0x1)),
    _0x2ea99d = new Error(
      '片段“' +
        _0x171698 +
        '”片段总时长\x20' +
        _0x2cffa9 +
        ' 秒超过 ' +
        maxDurationSeconds +
        ' 秒上限；需要由 Agent 按完整动作节拍、对白轮次或情绪转折重新规划。',
    );
  return (
    (_0x2ea99d['validationDetails'] = {
      type: 'clip_duration_overflow',
      clip: {
        index: clipIndex + 0x1,
        count: clipCount,
        ref: normalizeStoryAssetReference(clip?.['ref'], 'clip-' + (clipIndex + 0x1)),
        correctedDurationSec: _0x2cffa9,
        maxDurationSec: maxDurationSeconds,
        overflowSeconds: Number((durationSec - maxDurationSeconds)['toFixed'](0x1)),
        shots: shots['map']((_0x3ae73d, _0x409f2f) => ({
          index: _0x409f2f + 0x1,
          providedDurationSec: normalizePositiveNumber(
            sourceShots[_0x409f2f]?.['durationSec'] || sourceShots[_0x409f2f]?.['durationSeconds'],
          ),
          correctedDurationSec: Number(Number(_0x3ae73d['durationSec'])['toFixed'](0x1)),
          time: _0x3ae73d['time'],
          visual: _0x3ae73d['visual'],
          dialogue: _0x3ae73d['dialogue'],
          voiceover: _0x3ae73d['voiceover'],
        })),
      },
    }),
    _0x2ea99d
  );
}
function createStoryEpisodeClipDurationConstraintError({
  clip: clip = {},
  clipIndex: clipIndex = 0x0,
  clipCount: clipCount = 0x0,
  durationSec: durationSec = 0x0,
  durationConstraints: durationConstraints = {},
} = {}) {
  const _0x512004 = formatStoryEpisodeClipTitle(clipIndex),
    _0xdc7b82 = Number(Number(durationSec)['toFixed'](0x1)),
    _0x3bef31 = Array['isArray'](durationConstraints['allowedSeconds'])
      ? durationConstraints['allowedSeconds']
      : [],
    _0x1e9464 = _0x3bef31['length']
      ? '只允许 ' + _0x3bef31['join']('、') + '\x20秒'
      : (durationConstraints['minSeconds'] || 0x0) +
        ' 至 ' +
        (durationConstraints['maxSeconds'] || '不限') +
        '\x20秒' +
        (durationConstraints['stepSeconds'] ? '、步进 ' + durationConstraints['stepSeconds'] + '\x20秒' : ''),
    _0x1d9d58 = new Error(
      '片段“' +
        _0x512004 +
        '”总时长\x20' +
        _0xdc7b82 +
        ' 秒不符合当前视频模型时长约束（' +
        _0x1e9464 +
        '）；必须由 Agent 重新分组，客户端未修改原始时长。',
    );
  return (
    (_0x1d9d58['validationDetails'] = {
      type: 'clip_duration_unsupported',
      clip: {
        index: clipIndex + 0x1,
        count: clipCount,
        ref: normalizeStoryAssetReference(clip?.['ref'], 'clip-' + (clipIndex + 0x1)),
        durationSec: _0xdc7b82,
        minDurationSec: durationConstraints['minSeconds'] || 0x0,
        maxDurationSec: durationConstraints['maxSeconds'] || 0x0,
        stepDurationSec: durationConstraints['stepSeconds'] || 0x0,
        allowedDurationSeconds: _0x3bef31,
      },
    }),
    _0x1d9d58
  );
}
function isStoryEpisodeClipDurationSupported(_0x5c0de7, _0x1bf358 = null) {
  if (!_0x1bf358) return !![];
  const _0x4207bc = Number(_0x5c0de7);
  if (!Number['isFinite'](_0x4207bc) || _0x4207bc <= 0x0) return ![];
  const _0x10fe12 = Array['isArray'](_0x1bf358['allowedSeconds']) ? _0x1bf358['allowedSeconds'] : [];
  if (_0x10fe12['length'])
    return _0x10fe12['some']((_0xfd112d) => Math['abs'](Number(_0xfd112d) - _0x4207bc) < 0.000001);
  if (_0x1bf358['minSeconds'] && _0x4207bc < _0x1bf358['minSeconds']) return ![];
  if (_0x1bf358['maxSeconds'] && _0x4207bc > _0x1bf358['maxSeconds']) return ![];
  if (_0x1bf358['stepSeconds']) {
    const _0x5e0975 = _0x1bf358['minSeconds'] || 0x0,
      _0x213899 = (_0x4207bc - _0x5e0975) / _0x1bf358['stepSeconds'];
    if (Math['abs'](_0x213899 - Math['round'](_0x213899)) >= 0.000001) return ![];
  }
  return !![];
}
function tokenizeStorySpokenTextAtAuthoredPauses(_0xac239f = '') {
  const _0x21abd2 = normalizeText(_0xac239f);
  if (!_0x21abd2) return { speakerPrefix: '', units: [] };
  const _0xfd01c7 = getStoryDialogueSpeakerPrefix(_0x21abd2),
    _0x51b8fa = _0xfd01c7 ? _0x21abd2['slice'](_0xfd01c7['length']) : _0x21abd2,
    _0x134f16 = /(?:…{2,}|\.{3,}|—{2,}|[。！？!?；;])(?:[”"’']+)?/gu,
    _0x1802a1 = [];
  let _0x22208b = 0x0,
    _0x3b515d;
  while ((_0x3b515d = _0x134f16['exec'](_0x51b8fa)) !== null) {
    const _0x425f10 = _0x3b515d['index'] + _0x3b515d[0x0]['length'],
      _0x59dabb = _0x51b8fa['slice'](_0x22208b, _0x425f10);
    if (_0x59dabb['trim']()) _0x1802a1['push'](_0x59dabb);
    _0x22208b = _0x425f10;
  }
  const _0x2a3354 = _0x51b8fa['slice'](_0x22208b);
  if (_0x2a3354['trim']()) _0x1802a1['push'](_0x2a3354);
  const _0x237bfe = [];
  return (
    _0x1802a1['forEach']((_0x26e876) => {
      if (/^[\s“”"'‘’…—.]+$/u['test'](_0x26e876) && _0x237bfe['length']) {
        _0x237bfe[_0x237bfe['length'] - 0x1] += _0x26e876;
        return;
      }
      _0x237bfe['push'](_0x26e876);
    }),
    { speakerPrefix: _0xfd01c7, units: _0x237bfe }
  );
}
function getStorySpokenSegmentMinimumSeconds(_0x1f8938 = {}, _0x14c018 = '', _0x3d29fd = '') {
  return countStorySpokenUnits(_0x3d29fd) / STORY_MAX_SPOKEN_UNITS_PER_SECOND;
}
function getStorySpokenChunkText(_0x5c83f7 = {}, _0xc71605 = '') {
  const _0x62c34b = (Array['isArray'](_0x5c83f7['units']) ? _0x5c83f7['units'] : [])['join']('');
  return _0xc71605 && _0x62c34b['startsWith'](_0xc71605) ? _0x62c34b : '' + _0xc71605 + _0x62c34b;
}
function getStorySpokenChunkMinimumSeconds(_0xf647bf, _0xc5ab84, _0x1aee39, _0x105094) {
  return getStorySpokenSegmentMinimumSeconds(
    _0xf647bf,
    _0xc5ab84,
    getStorySpokenChunkText(_0x1aee39, _0x105094),
  );
}
function getStoryAuthoredPauseBoundaryPriority(_0x581cd2 = {}) {
  const _0x48ea4a = (Array['isArray'](_0x581cd2?.['units']) ? _0x581cd2['units'] : [])['join']('');
  if (/[。！？!?；;][”"’']?$/u['test'](_0x48ea4a)) return 0x64;
  if (/[”"’']—{2,}$/u['test'](_0x48ea4a)) return 0x5a;
  if (/—{2,}[”"’']?$/u['test'](_0x48ea4a)) return 0x32;
  if (/(?:…{2,}|\.{3,})[”"’']?$/u['test'](_0x48ea4a)) return 0x28;
  return 0x0;
}
function splitStoryEpisodeOverlongSpokenShot(_0x505a9f = {}, { maximum: maximum = 0xf } = {}) {
  const _0x2a54a8 = normalizePositiveNumber(_0x505a9f?.['durationSec']);
  if (!_0x2a54a8 || _0x2a54a8 <= maximum + 0.001) return [_0x505a9f];
  const _0x43f758 = ['dialogue', 'voiceover']['filter']((_0x7992cc) => normalizeText(_0x505a9f?.[_0x7992cc]));
  if (_0x43f758['length'] !== 0x1) return [_0x505a9f];
  const _0x56f845 = _0x43f758[0x0],
    { speakerPrefix: _0x413795, units: _0x39a007 } = tokenizeStorySpokenTextAtAuthoredPauses(
      _0x505a9f[_0x56f845],
    );
  if (_0x39a007['length'] < 0x2) return [_0x505a9f];
  let _0x242e9a = _0x39a007['map']((_0x533840) => ({ units: [_0x533840] }));
  for (const _0x130c64 of _0x242e9a) {
    const _0x294dc1 = getStorySpokenChunkMinimumSeconds(_0x505a9f, _0x56f845, _0x130c64, _0x413795);
    if (_0x294dc1 > maximum + 0.001) return [_0x505a9f];
  }
  while (_0x242e9a['length'] > 0x1) {
    let _0x51905d = null;
    for (let _0x2cf62d = 0x0; _0x2cf62d < _0x242e9a['length'] - 0x1; _0x2cf62d += 0x1) {
      const _0x32e243 = { units: [..._0x242e9a[_0x2cf62d]['units'], ..._0x242e9a[_0x2cf62d + 0x1]['units']] },
        _0x1dadaf = getStorySpokenChunkMinimumSeconds(_0x505a9f, _0x56f845, _0x32e243, _0x413795);
      if (_0x1dadaf > maximum + 0.001) continue;
      const _0x357863 = [
          ..._0x242e9a['slice'](0x0, _0x2cf62d),
          _0x32e243,
          ..._0x242e9a['slice'](_0x2cf62d + 0x2),
        ],
        _0x2b45fd = _0x357863['reduce'](
          (_0x43af36, _0x2ea311) =>
            _0x43af36 + getStorySpokenChunkMinimumSeconds(_0x505a9f, _0x56f845, _0x2ea311, _0x413795),
          0x0,
        ),
        _0x4c4e34 = Math['max'](_0x2a54a8, _0x2b45fd);
      if (_0x4c4e34 > _0x357863['length'] * maximum + 0.001) continue;
      const _0x3f18b9 = getStoryAuthoredPauseBoundaryPriority(_0x242e9a[_0x2cf62d]);
      (!_0x51905d ||
        _0x3f18b9 < _0x51905d['removedBoundaryPriority'] ||
        (_0x3f18b9 === _0x51905d['removedBoundaryPriority'] &&
          _0x1dadaf < _0x51905d['mergedMinimumSeconds'])) &&
        (_0x51905d = {
          chunks: _0x357863,
          mergedMinimumSeconds: _0x1dadaf,
          removedBoundaryPriority: _0x3f18b9,
        });
    }
    if (!_0x51905d) break;
    _0x242e9a = _0x51905d['chunks'];
  }
  const _0x4b1728 = _0x242e9a['map']((_0x94ea02) =>
      Math['ceil'](
        getStorySpokenChunkMinimumSeconds(_0x505a9f, _0x56f845, _0x94ea02, _0x413795) * 0xa - 0.001,
      ),
    ),
    _0x3d2b91 = Math['round'](maximum * 0xa),
    _0x5829cd = Math['max'](
      Math['round'](_0x2a54a8 * 0xa),
      _0x4b1728['reduce']((_0x22c7f2, _0x56c4d9) => _0x22c7f2 + _0x56c4d9, 0x0),
    );
  if (_0x5829cd > _0x242e9a['length'] * _0x3d2b91) return [_0x505a9f];
  const _0x3d0ae8 = [..._0x4b1728];
  let _0x4d1b66 = _0x5829cd - _0x3d0ae8['reduce']((_0x43b184, _0x504c8f) => _0x43b184 + _0x504c8f, 0x0);
  while (_0x4d1b66 > 0x0) {
    let _0x36b669 = ![];
    for (let _0x3d9135 = 0x0; _0x3d9135 < _0x3d0ae8['length'] && _0x4d1b66 > 0x0; _0x3d9135 += 0x1) {
      if (_0x3d0ae8[_0x3d9135] >= _0x3d2b91) continue;
      ((_0x3d0ae8[_0x3d9135] += 0x1), (_0x4d1b66 -= 0x1), (_0x36b669 = !![]));
    }
    if (!_0x36b669) break;
  }
  return _0x242e9a['map']((_0xa962a7, _0x4b4632) => ({
    ..._0x505a9f,
    durationSec: _0x3d0ae8[_0x4b4632] / 0xa,
    [_0x56f845]: getStorySpokenChunkText(_0xa962a7, _0x413795),
  }));
}
function repackStoryEpisodeSplitClipsLocally(
  _0x469aca = [],
  { maxDurationSeconds: maxDurationSeconds = 0xf } = {},
) {
  const _0x3dedaf = normalizePositiveNumber(maxDurationSeconds) || 0xf;
  return (Array['isArray'](_0x469aca) ? _0x469aca : [])['flatMap']((_0x1dde2f, _0x5989b5) => {
    const _0x4b5018 = [];
    let _0x2bf16 = [],
      _0x355ce4 = 0x0;
    const _0xe79c61 = (Array['isArray'](_0x1dde2f?.['shots']) ? _0x1dde2f['shots'] : [])['flatMap'](
      (_0x38a6e0) => splitStoryEpisodeOverlongSpokenShot(_0x38a6e0, { maximum: _0x3dedaf }),
    );
    for (const _0x5d7b70 of _0xe79c61) {
      const _0x1ac7be = normalizePositiveNumber(_0x5d7b70?.['durationSec']);
      if (!_0x1ac7be)
        throw createStoryEpisodeClipDurationError({
          clip: _0x1dde2f,
          clipIndex: _0x5989b5,
          clipCount: _0x469aca['length'],
          sourceShots: [_0x5d7b70],
          shots: [_0x5d7b70],
          durationSec: _0x1ac7be || 0x0,
          maxDurationSeconds: _0x3dedaf,
        });
      if (_0x1ac7be > _0x3dedaf) {
        _0x2bf16['length'] && (_0x4b5018['push'](_0x2bf16), (_0x2bf16 = []), (_0x355ce4 = 0x0));
        _0x4b5018['push']([_0x5d7b70]);
        continue;
      }
      (_0x2bf16['length'] &&
        _0x355ce4 + _0x1ac7be > _0x3dedaf &&
        (_0x4b5018['push'](_0x2bf16), (_0x2bf16 = []), (_0x355ce4 = 0x0)),
        _0x2bf16['push'](_0x5d7b70),
        (_0x355ce4 += _0x1ac7be));
    }
    if (_0x2bf16['length']) _0x4b5018['push'](_0x2bf16);
    if (_0x4b5018['length'] <= 0x1) return [_0x1dde2f];
    return _0x4b5018['map']((_0x2198e2, _0x42349d) => {
      const _0x1a513a = _0x2198e2['flatMap']((_0x5cc7f8) => [
        normalizeText(_0x5cc7f8?.['visual']),
        normalizeText(_0x5cc7f8?.['dialogue']),
        normalizeText(_0x5cc7f8?.['voiceover']),
      ])
        ['filter'](Boolean)
        ['join']('；');
      return {
        ..._0x1dde2f,
        ref: _0x1dde2f['ref'] + '-part-' + (_0x42349d + 0x1),
        script: _0x1a513a || _0x1dde2f['script'],
        shots: _0x2198e2,
        durationSec: Number(getStoryEpisodeSplitShotsDuration(_0x2198e2)['toFixed'](0x1)),
        assetRefs: [...new Set(_0x2198e2['flatMap']((_0x2f30c4) => _0x2f30c4['assetRefs'] || []))],
      };
    });
  });
}
function hasExplicitStoryEpisodeVoiceover(_0x450f8f = {}) {
  const _0x2a4b93 = [
    _0x450f8f?.['script']?.['fullText'],
    _0x450f8f?.['fullScript'],
    _0x450f8f?.['scriptText'],
    ...(Array['isArray'](_0x450f8f?.['script']?.['scenes'])
      ? _0x450f8f['script']['scenes']['map']((_0x32f446) => _0x32f446?.['body'])
      : []),
  ]
    ['map']((_0x1c0c2c) => String(_0x1c0c2c || ''))
    ['filter'](Boolean);
  return _0x2a4b93['some']((_0x32991e) =>
    /^\s*(?:解说\s*[／/]\s*旁白|旁白|解说|内心独白|画外音|VO|V\.O\.?|OS|O\.S\.?)(?:[^\S\r\n]*(?:（[^）\r\n]*）|\([^\)\r\n]*\)))?[^\S\r\n]*[：:]/imu[
      'test'
    ](_0x32991e),
  );
}
export function parseStoryEpisodeSplitResult(
  _0x418e00,
  {
    episodeRef: episodeRef = '',
    episode: episode = {},
    scriptMode: scriptMode = '',
    constraints: constraints = {},
    assets: assets = [],
    assetRefs: assetRefs = [],
    clipPlans: clipPlans = [],
    minimumShotsPerClip: minimumShotsPerClip = 0x2,
    maximumShotsPerClip: maximumShotsPerClip = 0x5,
    enforceMaxDuration: enforceMaxDuration = !![],
    repairMissingShotFields: repairMissingShotFields = ![],
    allowEmptyAudio: allowEmptyAudio = !![],
    requireAllPlanCharacters: requireAllPlanCharacters = !![],
    completeCharacterAssetUsages: completeCharacterAssetUsages = !![],
    completePlanSceneUsage: completePlanSceneUsage = ![],
    includeCutAfter: includeCutAfter = ![],
    repackOverlongClips: repackOverlongClips = ![],
    enforceSingleSceneAssetUsage: enforceSingleSceneAssetUsage = !![],
    clipDurationConstraints: clipDurationConstraints = null,
    rejectUnsupportedClipDuration: rejectUnsupportedClipDuration = !![],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const _0x4ee8df =
      !episode['replication']?.['sourceAnalysis'] &&
      normalizeText(scriptMode) === STORY_SCRIPT_MODE_PLOT &&
      !hasExplicitStoryEpisodeVoiceover(episode),
    _0x4fef13 = createStoryEpisodeSplitCompactDialogueCatalog(episode, assets),
    _0x2dd24f = normalizeStoryPlanningConstraints(constraints),
    _0x48ac42 = isStoryContinuousTimelinePromptMode(promptMode),
    _0x34c4ac = normalizeStoryEpisodeClipDurationConstraints(clipDurationConstraints),
    _0x520041 = Math['max'](0x1, Math['min'](0x5, Math['trunc'](Number(minimumShotsPerClip) || 0x2))),
    _0x82232 = Math['max'](0x0, Math['trunc'](Number(maximumShotsPerClip) || 0x0)),
    _0x1ba389 = parseStrictJson(getResultText(_0x418e00), 'Agent\x20未返回片段拆分结果。'),
    _0x2d092d = applyReplicationAsrDelivery(
      expandStoryEpisodeSplitCompactData(_0x1ba389, {
        episodeRef: episodeRef,
        episode: episode,
        assets: assets,
      }),
      episode,
      { planning: { promptMode: promptMode } },
      assets,
    ),
    _0x291b29 = buildStoryEpisodeSplitAssetCatalog(assets, assetRefs),
    _0x3a07ae = new Map(
      (Array['isArray'](clipPlans) ? clipPlans : [])['map']((_0x196539) => [
        normalizeStoryAssetReference(_0x196539?.['ref'], ''),
        _0x196539,
      ]),
    ),
    _0x312e2d = Array['isArray'](_0x2d092d['clips'])
      ? _0x2d092d['clips']
          ['map']((_0x27c63c, _0x59c362) => {
            const _0x597df1 = formatStoryEpisodeClipTitle(_0x59c362),
              _0x51cc6f = normalizeStoryAssetReference(_0x27c63c?.['ref'], 'clip-' + (_0x59c362 + 0x1)),
              _0x574fa4 = _0x3a07ae['get'](_0x51cc6f) || null,
              _0x2b8671 = repairMissingShotFields
                ? normalizeStoryEpisodeExperimentalStandaloneText
                : normalizeText,
              _0x178611 = Array['isArray'](_0x27c63c?.['shots']) ? _0x27c63c['shots'] : [],
              _0x3bb849 = _0x178611['flatMap']((_0x4ed7a9) => [
                normalizeText(_0x4ed7a9?.['visual']),
                normalizeText(_0x4ed7a9?.['dialogue']),
                _0x4ee8df ? '' : normalizeText(_0x4ed7a9?.['voiceover']),
              ])
                ['filter'](Boolean)
                ['join']('；'),
              _0x591ac3 =
                _0x2b8671(_0x27c63c?.['script']) ||
                (repairMissingShotFields ? normalizeText(_0x574fa4?.['beat']) || _0x2b8671(_0x3bb849) : ''),
              _0x3cfe6c = _0x2b8671(_0x27c63c?.['creativeIntent']),
              _0xecbb1 = _0x2b8671(_0x27c63c?.['transition']);
            if (!_0x591ac3 || (!repairMissingShotFields && (!_0x3cfe6c || !_0xecbb1)))
              throw new Error(_0x597df1 + ' 缺少 script、creativeIntent 或 transition。');
            validateStoryEpisodeSplitClipIndependence({
              clipLabel: _0x597df1,
              script: _0x591ac3,
              creativeIntent: _0x3cfe6c,
              transition: _0xecbb1,
            });
            if (_0x178611['length'] < _0x520041)
              throw new Error('片段“' + _0x597df1 + '”至少包含 ' + _0x520041 + ' 个分镜。');
            if (_0x82232 && _0x178611['length'] > _0x82232)
              throw new Error('片段“' + _0x597df1 + '”最多包含\x20' + _0x82232 + '\x20个分镜。');
            const _0x4c3d48 = _0x178611['map']((_0x511bb4, _0x293e22) => {
                const _0x497045 = _0x293e22 === 0x0,
                  _0x15c891 = _0x293e22 === _0x178611['length'] - 0x1,
                  _0x4ab767 =
                    [
                      ...new Set(
                        [
                          _0x497045 ? normalizeText(_0x574fa4?.['entryState']) : '',
                          _0x15c891 ? normalizeText(_0x574fa4?.['exitState']) : '',
                        ]['filter'](Boolean),
                      ),
                    ]['join']('；') || _0x591ac3,
                  _0x236057 = normalizeStoryEpisodeSplitShot(_0x511bb4, {
                    clipTitle: _0x597df1,
                    index: _0x293e22,
                    assetCatalog: _0x291b29,
                    fallbacks:
                      repairMissingShotFields && !episode['replication']?.['sourceAnalysis']
                        ? {
                            time: normalizeText(_0x574fa4?.['time']),
                            visual: _0x4ab767,
                            camera: '中景，平视机位，固定拍摄，主体居中构图，50mm标准镜头。',
                            audio: allowEmptyAudio
                              ? ''
                              : normalizeText(_0x511bb4?.['dialogue'] || _0x511bb4?.['voiceover'])
                                ? '对白与环境底噪。'
                                : '环境音。',
                            cutAfter: _0x15c891 ? 'preferred' : 'allowed',
                          }
                        : {},
                    allowEmptyAudio: allowEmptyAudio,
                    includeCutAfter: includeCutAfter,
                    includeTimeline: _0x48ac42,
                    preserveCameraCuts: Boolean(episode['replication']?.['sourceAnalysis']),
                  }),
                  _0x432bd2 = completeStoryEpisodeSplitDialogueSpeaker(_0x236057['dialogue'], _0x4fef13),
                  _0x2ea2bd =
                    _0x432bd2 === _0x236057['dialogue'] ? _0x236057 : { ..._0x236057, dialogue: _0x432bd2 };
                return _0x4ee8df ? { ..._0x2ea2bd, voiceover: '' } : _0x2ea2bd;
              }),
              _0x5ef469 = mergeStoryEpisodeSplitDialogueFragments(_0x4c3d48, _0x574fa4?.['dialogueUnits']);
            _0x48ac42 &&
              _0x5ef469['forEach']((_0x42ab7c, _0x224608) => {
                const _0x1ee162 = _0x224608 === 0x0 ? 0x0 : _0x5ef469[_0x224608 - 0x1]['endSec'];
                if (_0x42ab7c['startSec'] !== _0x1ee162)
                  throw new Error(
                    '片段“' +
                      _0x597df1 +
                      '”的时间轴不连续：分镜\x20' +
                      (_0x224608 + 0x1) +
                      ' 应从 ' +
                      _0x1ee162 +
                      ' 秒开始。',
                  );
              });
            const _0x4bb2dd = completeCharacterAssetUsages
                ? completeStoryEpisodeSplitCharacterAssetUsages(_0x5ef469, {
                    clipPlan: _0x574fa4,
                    assetCatalog: _0x291b29,
                    clipTitle: _0x597df1,
                    requireAllPlanCharacters: requireAllPlanCharacters,
                  })
                : _0x5ef469,
              _0x4d4ac3 = completePlanSceneUsage
                ? completeStoryEpisodeSplitSceneAssetUsage(_0x4bb2dd, {
                    clipPlan: _0x574fa4,
                    assetCatalog: _0x291b29,
                    clipTitle: _0x597df1,
                  })
                : _0x4bb2dd,
              _0x2e9bb2 = _0x178611['some']((_0x1a7811) => Array['isArray'](_0x1a7811?.['assetUsages'])),
              _0x2a3405 = new Set(
                [..._0x291b29['assetByRef']['values']()]
                  ['filter']((_0x3adfc7) => _0x3adfc7['kind'] === 'scene')
                  ['map']((_0x1739df) => _0x1739df['assetRef']),
              );
            if (enforceSingleSceneAssetUsage && _0x2e9bb2 && _0x2a3405['size']) {
              const _0x41fefb = [
                ...new Set(
                  _0x4d4ac3['flatMap']((_0xe0a741) => _0xe0a741['assetUsages'])
                    ['map']((_0x360e00) => _0x360e00['assetRef'])
                    ['filter']((_0x4ed12b) => _0x2a3405['has'](_0x4ed12b)),
                ),
              ];
              if (_0x41fefb['length'] !== 0x1)
                throw new Error(
                  _0x41fefb['length']
                    ? '片段“' + _0x597df1 + '”引用了多个场景资产；每个片段只能设定在一个场景。'
                    : '片段“' + _0x597df1 + '”缺少场景资产；每个片段必须设定在一个场景。',
                );
            }
            const _0x127875 = Number(getStoryEpisodeSplitShotsDuration(_0x4d4ac3)['toFixed'](0x1)),
              _0x50b373 = !isStoryEpisodeClipDurationSupported(_0x127875, _0x34c4ac)
                ? createStoryEpisodeClipDurationConstraintError({
                    clip: _0x27c63c,
                    clipIndex: _0x59c362,
                    clipCount: _0x2d092d['clips']['length'],
                    durationSec: _0x127875,
                    durationConstraints: _0x34c4ac,
                  })
                : null;
            if (_0x50b373 && rejectUnsupportedClipDuration) throw _0x50b373;
            if (enforceMaxDuration && _0x127875 > _0x2dd24f['sceneMaxSeconds'])
              throw createStoryEpisodeClipDurationError({
                clip: _0x27c63c,
                clipIndex: _0x59c362,
                clipCount: _0x2d092d['clips']['length'],
                sourceShots: _0x178611,
                shots: _0x4d4ac3,
                durationSec: _0x127875,
                maxDurationSeconds: _0x2dd24f['sceneMaxSeconds'],
              });
            const _0x445aab = [...new Set(_0x4d4ac3['flatMap']((_0x98b3b4) => _0x98b3b4['assetRefs']))];
            return {
              ref: _0x51cc6f,
              title: _0x597df1,
              script: _0x591ac3,
              creativeIntent: _0x3cfe6c,
              transition: _0xecbb1,
              ...(episode['replication']?.['sourceAnalysis']
                ? {
                    replicationContentType: resolveReplicationContentType(
                      episode['replication']['sourceAnalysis']['contentType'],
                      _0x2d092d['contentType'],
                      _0x27c63c['replicationContentType'],
                    ),
                  }
                : {}),
              shots: _0x4d4ac3,
              durationSec: _0x127875,
              assetRefs: _0x445aab,
              ...(_0x50b373
                ? {
                    durationValidation: {
                      status: 'unsupported',
                      message: _0x50b373['message'],
                      details: _0x50b373['validationDetails'],
                    },
                  }
                : {}),
            };
          })
          ['filter'](Boolean)
      : [],
    _0x23af05 = repackOverlongClips
      ? repackStoryEpisodeSplitClipsLocally(_0x312e2d, { maxDurationSeconds: _0x2dd24f['sceneMaxSeconds'] })
      : _0x312e2d,
    _0xae982 = _0x23af05['map']((_0x65b3bb, _0x2baaf3) => ({
      ..._0x65b3bb,
      title: formatStoryEpisodeClipTitle(_0x2baaf3),
    }));
  if (!_0xae982['length']) throw new Error('Agent 返回结果没有可用片段。');
  const _0x164876 = _0xae982['reduce']((_0xaff4ce, _0x11784c) => _0xaff4ce + _0x11784c['durationSec'], 0x0),
    _0x56a718 = _0xae982['map']((_0xb3ef3a) => _0xb3ef3a['ref']);
  if (new Set(_0x56a718)['size'] !== _0x56a718['length']) throw new Error('Agent\x20返回了重复的片段引用。');
  const _0x46e01d = normalizeStoryAssetReference(_0x2d092d['episodeRef'] || episodeRef, 'episode-1');
  if (episodeRef && _0x46e01d !== normalizeStoryAssetReference(episodeRef, 'episode-1'))
    throw new Error('Agent\x20返回的分集引用与当前分集不一致。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    episodeRef: _0x46e01d,
    totalDurationSeconds: _0x164876,
    clips: _0xae982,
  };
}
function serializeStoryEpisodeSplitValidationError(
  _0x3f74f0,
  { clipIndex: clipIndex = 0x0, clipCount: clipCount = 0x0 } = {},
) {
  const _0x4b1813 = _0x3f74f0?.['validationDetails']
    ? JSON['parse'](JSON['stringify'](_0x3f74f0['validationDetails']))
    : null;
  return (
    _0x4b1813?.['clip'] &&
      ((_0x4b1813['clip']['index'] = clipIndex + 0x1), (_0x4b1813['clip']['count'] = clipCount)),
    {
      message: normalizeText(_0x3f74f0?.['message'] || _0x3f74f0) || '片段校验失败。',
      ...(_0x4b1813 ? { validationDetails: _0x4b1813 } : {}),
    }
  );
}
function normalizeStoryEpisodeSplitDraft(
  _0x624372,
  {
    episodeRef: episodeRef = '',
    episode: episode = {},
    scriptMode: scriptMode = '',
    constraints: constraints = {},
    assets: assets = [],
    clipPlans: clipPlans = [],
    minimumShotsPerClip: minimumShotsPerClip = 0x2,
    maximumShotsPerClip: maximumShotsPerClip = 0x5,
    enforceMaxDuration: enforceMaxDuration = !![],
    repairMissingShotFields: repairMissingShotFields = ![],
    allowEmptyAudio: allowEmptyAudio = !![],
    requireAllPlanCharacters: requireAllPlanCharacters = !![],
    completePlanSceneUsage: completePlanSceneUsage = ![],
    includeCutAfter: includeCutAfter = ![],
    repackOverlongClips: repackOverlongClips = ![],
    enforceSingleSceneAssetUsage: enforceSingleSceneAssetUsage = !![],
    clipDurationConstraints: clipDurationConstraints = null,
    rejectUnsupportedClipDuration: rejectUnsupportedClipDuration = !![],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const _0x469188 = getResultText(_0x624372);
  let _0x3c290e,
    _0x13096b = null;
  try {
    _0x3c290e = parseStrictJson(_0x469188, 'Agent 未返回片段拆分结果。');
  } catch (_0x4540bc) {
    _0x13096b = _0x4540bc;
  }
  if (!Array['isArray'](_0x3c290e?.['clips'])) {
    const _0x38e60d = extractCompleteJsonArrayItems(_0x469188, 'clips');
    if (_0x38e60d['length'])
      _0x3c290e = {
        episodeRef: extractJsonStringProperty(_0x469188, 'episodeRef') || episodeRef,
        clips: _0x38e60d,
      };
    else {
      if (_0x13096b) throw _0x13096b;
    }
  }
  if (!Array['isArray'](_0x3c290e['clips']) || !_0x3c290e['clips']['length'])
    throw new Error('Agent\x20返回结果没有可用片段。');
  const _0x5a269d = normalizeStoryAssetReference(_0x3c290e['episodeRef'] || episodeRef, 'episode-1');
  if (episodeRef && _0x5a269d !== normalizeStoryAssetReference(episodeRef, 'episode-1'))
    throw new Error('Agent 返回的分集引用与当前分集不一致。');
  const _0xafa97a = new Set(),
    _0x4b358e = _0x3c290e['clips']['map']((_0x43f3cc, _0x10d739) => {
      const _0x140c35 = normalizeStoryAssetReference(_0x43f3cc?.['ref'], 'clip-' + (_0x10d739 + 0x1)),
        _0x7e9819 = normalizeText(_0x43f3cc?.['ref']) ? _0x43f3cc : { ..._0x43f3cc, ref: _0x140c35 };
      try {
        const _0x102072 = parseStoryEpisodeSplitResult(
            { episodeRef: _0x5a269d, clips: [_0x7e9819] },
            {
              episodeRef: _0x5a269d,
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
          _0x14893a = _0x102072['clips']['find']((_0x246bcd) => _0xafa97a['has'](_0x246bcd['ref']));
        if (_0x14893a) throw new Error('Agent 返回了重复的片段引用“' + _0x14893a['ref'] + '”。');
        return (
          _0x102072['clips']['forEach']((_0x4f1374) => _0xafa97a['add'](_0x4f1374['ref'])),
          { status: 'valid', sourceIndex: _0x10d739, sourceClipRef: _0x140c35, clips: _0x102072['clips'] }
        );
      } catch (_0x472b23) {
        return {
          status: 'invalid',
          sourceIndex: _0x10d739,
          sourceClipRef: _0x140c35,
          rawClips: [_0x7e9819],
          error: serializeStoryEpisodeSplitValidationError(_0x472b23, {
            clipIndex: _0x10d739,
            clipCount: _0x3c290e['clips']['length'],
          }),
        };
      }
    });
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'draft',
    episodeRef: _0x5a269d,
    items: _0x4b358e,
    attempts: 0x1,
  };
}
function restoreStoryEpisodeSplitDraft(_0x18b026 = {}, { episodeRef: episodeRef = '' } = {}) {
  const _0x2f7cfd = normalizeStoryAssetReference(_0x18b026?.['episodeRef'] || episodeRef, 'episode-1');
  if (episodeRef && _0x2f7cfd !== normalizeStoryAssetReference(episodeRef, 'episode-1'))
    throw new Error('保存的分集草稿与当前分集不一致。');
  const _0x3b86fe = Array['isArray'](_0x18b026?.['items']) ? _0x18b026['items'] : [];
  if (!_0x3b86fe['length']) throw new Error('没有可继续修复的分集草稿。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'draft',
    episodeRef: _0x2f7cfd,
    items: _0x3b86fe['map']((_0x1bc1f5, _0x524cd4) => ({
      ..._0x1bc1f5,
      status: _0x1bc1f5?.['status'] === 'valid' ? 'valid' : 'invalid',
      sourceIndex: Number['isInteger'](_0x1bc1f5?.['sourceIndex']) ? _0x1bc1f5['sourceIndex'] : _0x524cd4,
      sourceClipRef: normalizeStoryAssetReference(_0x1bc1f5?.['sourceClipRef'], 'clip-' + (_0x524cd4 + 0x1)),
      clips:
        _0x1bc1f5?.['status'] === 'valid' && Array['isArray'](_0x1bc1f5?.['clips']) ? _0x1bc1f5['clips'] : [],
      rawClips:
        _0x1bc1f5?.['status'] === 'valid'
          ? []
          : Array['isArray'](_0x1bc1f5?.['rawClips'])
            ? _0x1bc1f5['rawClips']
            : [],
      error:
        _0x1bc1f5?.['status'] === 'valid'
          ? null
          : {
              message: normalizeText(_0x1bc1f5?.['error']?.['message']) || '片段仍需修复。',
              ...(_0x1bc1f5?.['error']?.['validationDetails']
                ? { validationDetails: _0x1bc1f5['error']['validationDetails'] }
                : {}),
            },
    })),
    attempts: Math['max'](0x1, Math['trunc'](Number(_0x18b026?.['attempts']) || 0x1)),
  };
}
function getStoryEpisodeSplitDraftCounts(_0x1809df = {}) {
  const _0x28af87 = Array['isArray'](_0x1809df?.['items']) ? _0x1809df['items'] : [];
  return {
    validClipCount: _0x28af87['reduce'](
      (_0x287cb2, _0x515b4a) =>
        _0x287cb2 +
        (_0x515b4a?.['status'] === 'valid' && Array['isArray'](_0x515b4a?.['clips'])
          ? _0x515b4a['clips']['length']
          : 0x0),
      0x0,
    ),
    invalidItemCount: _0x28af87['filter']((_0x4cf558) => _0x4cf558?.['status'] !== 'valid')['length'],
  };
}
function finalizeStoryEpisodeSplitDraft(_0x334d4d = {}) {
  const { invalidItemCount: _0x3f0cfd } = getStoryEpisodeSplitDraftCounts(_0x334d4d);
  if (_0x3f0cfd) return null;
  const _0x283523 = _0x334d4d['items']
    ['flatMap']((_0x8efbe1) => _0x8efbe1['clips'] || [])
    ['map']((_0x466a13, _0xff70a2) => ({ ..._0x466a13, title: formatStoryEpisodeClipTitle(_0xff70a2) }));
  if (!_0x283523['length']) throw new Error('Agent 返回结果没有可用片段。');
  const _0x551500 = _0x283523['map']((_0x1b2f25) => _0x1b2f25['ref']);
  if (new Set(_0x551500)['size'] !== _0x551500['length']) throw new Error('Agent 返回了重复的片段引用。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    episodeRef: _0x334d4d['episodeRef'],
    totalDurationSeconds: _0x283523['reduce'](
      (_0x59545, _0x200e60) => _0x59545 + _0x200e60['durationSec'],
      0x0,
    ),
    clips: _0x283523,
    ...(typeof _0x334d4d?.['rawResponse'] === 'string' ? { rawResponse: _0x334d4d['rawResponse'] } : {}),
  };
}
function createStoryEpisodeSplitPartialResult(_0x2cc27f = {}) {
  const _0x363b09 = _0x2cc27f['items']
      ['flatMap']((_0xdecfdc) =>
        _0xdecfdc?.['status'] === 'valid' && Array['isArray'](_0xdecfdc?.['clips']) ? _0xdecfdc['clips'] : [],
      )
      ['map']((_0x5f0928, _0x9cfae) => ({ ..._0x5f0928, title: formatStoryEpisodeClipTitle(_0x9cfae) })),
    _0x4407cf = _0x2cc27f['items']
      ['filter']((_0x519ea8) => _0x519ea8?.['status'] !== 'valid')
      ['map']((_0x4a1a08) => ({
        sourceIndex: _0x4a1a08['sourceIndex'],
        sourceClipRef: _0x4a1a08['sourceClipRef'],
        message: normalizeText(_0x4a1a08?.['error']?.['message']) || '片段仍需修复。',
        ...(_0x4a1a08?.['error']?.['validationDetails']
          ? { validationDetails: _0x4a1a08['error']['validationDetails'] }
          : {}),
      }));
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'partial',
    episodeRef: _0x2cc27f['episodeRef'],
    items: _0x2cc27f['items'],
    clips: _0x363b09,
    rejectedClips: _0x4407cf,
    totalDurationSeconds: _0x363b09['reduce'](
      (_0x52c4bb, _0x5b9a9e) => _0x52c4bb + _0x5b9a9e['durationSec'],
      0x0,
    ),
    attempts: Math['max'](0x1, Math['trunc'](Number(_0x2cc27f?.['attempts']) || 0x1)),
    ...(typeof _0x2cc27f?.['rawResponse'] === 'string' ? { rawResponse: _0x2cc27f['rawResponse'] } : {}),
  };
}
function throwStoryEpisodeSplitPartialResult(_0x3200f9 = {}) {
  const _0x3c8535 = createStoryEpisodeSplitPartialResult(_0x3200f9),
    _0x10bf70 = _0x3c8535['clips']['length'],
    _0x1cb3be = _0x3c8535['rejectedClips']['length'],
    _0x47d072 = _0x1cb3be === 0x1 ? normalizeText(_0x3c8535['rejectedClips'][0x0]?.['message']) : '',
    _0x65d41c = new Error(
      '分集拆分未完全通过：已保留\x20' +
        _0x10bf70 +
        ' 个合格片段，' +
        _0x1cb3be +
        '\x20个片段仍需修复。' +
        (_0x47d072 ? '\x20' + _0x47d072 : ''),
    );
  ((_0x65d41c['name'] = 'StoryEpisodeSplitPartialError'), (_0x65d41c['partialResult'] = _0x3c8535));
  throw _0x65d41c;
}
function reportStoryEpisodeSplitRequestDiagnostics(
  _0x4dd0a7,
  {
    phase: phase = 'full-generation',
    prompt: prompt = '',
    systemPrompt: systemPrompt = '',
    failedClipCount: failedClipCount = 0x0,
    carriesFullEpisodeContext: carriesFullEpisodeContext = phase !== 'targeted-repair',
    automaticCallLimit: automaticCallLimit = 0x2,
    details: details = {},
  } = {},
) {
  const _0x4c92aa = _0x4dd0a7?.['info'] || _0x4dd0a7?.['log'];
  if (typeof _0x4c92aa !== 'function') return null;
  const _0xe67d5 = String(prompt || ''),
    _0x2b6a2b = String(systemPrompt || ''),
    _0x37e05c =
      typeof TextEncoder === 'function'
        ? new TextEncoder()['encode'](_0xe67d5)['length']
        : _0xe67d5['length'],
    _0x3ffab7 =
      typeof TextEncoder === 'function'
        ? new TextEncoder()['encode'](_0x2b6a2b)['length']
        : _0x2b6a2b['length'];
  return _0x4c92aa['call'](_0x4dd0a7, '[storyWorkspace][episode-split-request]', {
    phase: phase,
    ...(details && typeof details === 'object' ? details : {}),
    promptCharacters: [..._0xe67d5]['length'],
    promptBytes: _0x37e05c,
    systemPromptCharacters: [..._0x2b6a2b]['length'],
    systemPromptBytes: _0x3ffab7,
    inputCharacters: [..._0xe67d5]['length'] + [..._0x2b6a2b]['length'],
    inputBytes: _0x37e05c + _0x3ffab7,
    failedClipCount: Math['max'](0x0, Math['trunc'](Number(failedClipCount) || 0x0)),
    carriesFullEpisodeContext: Boolean(carriesFullEpisodeContext),
    automaticCallLimit: Math['max'](0x1, Math['trunc'](Number(automaticCallLimit) || 0x1)),
  });
}
function getStoryEpisodeSplitSerializedMetrics(_0x1d45e9) {
  let _0x2daecb = '';
  try {
    _0x2daecb = typeof _0x1d45e9 === 'string' ? _0x1d45e9 : JSON['stringify'](_0x1d45e9);
  } catch {
    _0x2daecb = String(_0x1d45e9 || '');
  }
  const _0x128482 =
    typeof TextEncoder === 'function'
      ? new TextEncoder()['encode'](_0x2daecb)['length']
      : _0x2daecb['length'];
  return { characters: [..._0x2daecb]['length'], bytes: _0x128482 };
}
function getStoryEpisodeSplitResponseTiming(_0x197e6b = {}) {
  const _0x58518d =
      _0x197e6b?.['transportTiming'] && typeof _0x197e6b['transportTiming'] === 'object'
        ? _0x197e6b['transportTiming']
        : {},
    _0x34839a = (_0x22b669) => {
      const _0x3be327 = _0x58518d[_0x22b669];
      if (_0x3be327 === null || _0x3be327 === undefined || _0x3be327 === '') return null;
      const _0x553349 = Number(_0x3be327);
      return Number['isFinite'](_0x553349) && _0x553349 >= 0x0 ? _0x553349 : null;
    };
  return {
    responseHeadersMs: _0x34839a('responseHeadersMs'),
    responseBodyMs: _0x34839a('responseBodyMs'),
    transportTotalMs: _0x34839a('totalMs'),
    firstByteMs: _0x34839a('firstByteMs'),
    firstTokenMs: _0x34839a('firstTokenMs'),
  };
}
function getStoryEpisodeExperimentalPromptSectionCharacters(_0x52417e) {
  if (!_0x52417e || typeof _0x52417e !== 'object') return {};
  return Object['fromEntries'](
    Object['entries'](_0x52417e)['map'](([_0x2d4bcf, _0x28e9a1]) => [
      _0x2d4bcf,
      getStoryEpisodeSplitSerializedMetrics(_0x28e9a1)['characters'],
    ]),
  );
}
function reportStoryEpisodeSplitRequestDiagnosticsInBackground(_0xa70e48, _0xa1840d) {
  try {
    const _0x3b0d38 = reportStoryEpisodeSplitRequestDiagnostics(_0xa70e48, _0xa1840d);
    _0x3b0d38 &&
      typeof _0x3b0d38['then'] === 'function' &&
      void Promise['resolve'](_0x3b0d38)['catch'](() => undefined);
  } catch {}
}
function createStoryEpisodeExperimentalDiagnosticRequest({
  request: _0x34cd03,
  diagnostics: _0x1d6a7b,
  runId: _0x49df72,
  phase: _0x49d6e0,
  nextRequestSequence: _0x2e0d38,
  carriesFullEpisodeContext: carriesFullEpisodeContext = ![],
  context: context = {},
} = {}) {
  let _0x43dfa4 = 0x0;
  return async (_0x5f2eca = {}) => {
    _0x43dfa4 += 0x1;
    const _0x1bfdc8 = Math['max'](0x1, Math['trunc'](Number(_0x2e0d38?.()) || _0x43dfa4)),
      _0x3c4e18 = _0x49df72 + ':' + _0x1bfdc8,
      _0x3a4aea = getStoryEpisodeSplitSerializedMetrics(_0x5f2eca),
      _0x43305f = {
        status: 'started',
        countsTowardRequestTotal: !![],
        runId: _0x49df72,
        requestId: _0x3c4e18,
        requestSequence: _0x1bfdc8,
        phaseAttempt: _0x43dfa4,
        model: normalizeText(_0x5f2eca?.['model']),
        provider: normalizeText(_0x5f2eca?.['provider']),
        structuredOutputRequested: Boolean(_0x5f2eca?.['structuredOutput']),
        timeoutMs: Math['max'](0x0, Math['trunc'](Number(_0x5f2eca?.['timeoutMs']) || 0x0)),
        requestPayloadCharacters: _0x3a4aea['characters'],
        requestPayloadBytes: _0x3a4aea['bytes'],
        strictAttemptLimit: 0x1,
        transportAttemptLimit: STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS,
        maximumActualCallsForPhase: STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS,
        ...(context && typeof context === 'object' ? context : {}),
      };
    return enqueueStoryEpisodeExperimentalRequest(async () => {
      const _0x51f574 = Date['now']();
      reportStoryEpisodeSplitRequestDiagnosticsInBackground(_0x1d6a7b, {
        phase: _0x49d6e0,
        prompt: _0x5f2eca?.['prompt'],
        systemPrompt: _0x5f2eca?.['systemPrompt'],
        carriesFullEpisodeContext: carriesFullEpisodeContext,
        automaticCallLimit: _0x43305f['maximumActualCallsForPhase'],
        details: _0x43305f,
      });
      try {
        const _0x5a8c49 = await _0x34cd03(_0x5f2eca),
          _0x6f2ab6 = getStoryEpisodeSplitSerializedMetrics(getResultText(_0x5a8c49));
        return (
          reportStoryEpisodeSplitRequestDiagnosticsInBackground(_0x1d6a7b, {
            phase: _0x49d6e0,
            prompt: _0x5f2eca?.['prompt'],
            systemPrompt: _0x5f2eca?.['systemPrompt'],
            carriesFullEpisodeContext: carriesFullEpisodeContext,
            automaticCallLimit: _0x43305f['maximumActualCallsForPhase'],
            details: {
              ..._0x43305f,
              status: 'succeeded',
              countsTowardRequestTotal: ![],
              elapsedMs: Math['max'](0x0, Date['now']() - _0x51f574),
              responseCharacters: _0x6f2ab6['characters'],
              responseBytes: _0x6f2ab6['bytes'],
              ...getStoryEpisodeSplitResponseTiming(_0x5a8c49),
              ...(_0x5a8c49?.['structuredOutputFallback']
                ? {
                    structuredOutputFallbackMode: normalizeText(
                      _0x5a8c49['structuredOutputFallback']['mode'],
                    ),
                    structuredOutputFallbackStatus: Math['max'](
                      0x0,
                      Math['trunc'](Number(_0x5a8c49['structuredOutputFallback']['status']) || 0x0),
                    ),
                  }
                : {}),
            },
          }),
          _0x5a8c49
        );
      } catch (_0x4ef2e7) {
        reportStoryEpisodeSplitRequestDiagnosticsInBackground(_0x1d6a7b, {
          phase: _0x49d6e0,
          prompt: _0x5f2eca?.['prompt'],
          systemPrompt: _0x5f2eca?.['systemPrompt'],
          carriesFullEpisodeContext: carriesFullEpisodeContext,
          automaticCallLimit: _0x43305f['maximumActualCallsForPhase'],
          details: {
            ..._0x43305f,
            status: 'failed',
            countsTowardRequestTotal: ![],
            elapsedMs: Math['max'](0x0, Date['now']() - _0x51f574),
            errorType: normalizeText(_0x4ef2e7?.['type'] || _0x4ef2e7?.['name']),
            errorStatus: Math['max'](
              0x0,
              Math['trunc'](Number(_0x4ef2e7?.['status'] || _0x4ef2e7?.['statusCode']) || 0x0),
            ),
            errorMessage: normalizeText(_0x4ef2e7?.['message'] || _0x4ef2e7),
            retryable: Boolean(_0x4ef2e7?.['retryable'] || isStoryEpisodeExperimentalRetryable(_0x4ef2e7)),
          },
        });
        throw _0x4ef2e7;
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
  const _0x1ae66f = isStoryContinuousTimelinePromptMode(promptMode),
    _0x4c7e03 = isStoryMinimaxH3PromptMode(promptMode)
      ? { ...constraints, sceneMaxSeconds: 0xf }
      : constraints;
  return {
    episodeRef: episodeRef,
    episode: episode,
    scriptMode: scriptMode,
    constraints: _0x4c7e03,
    assets: assets,
    minimumShotsPerClip: 0x1,
    maximumShotsPerClip: 0x0,
    enforceMaxDuration: ![],
    repairMissingShotFields: !![],
    allowEmptyAudio: !![],
    requireAllPlanCharacters: ![],
    completeCharacterAssetUsages: !episode['replication']?.['sourceAnalysis'],
    completePlanSceneUsage: ![],
    repackOverlongClips: Boolean(clipDurationConstraints) && !_0x1ae66f,
    enforceSingleSceneAssetUsage: ![],
    clipDurationConstraints: clipDurationConstraints,
    rejectUnsupportedClipDuration: ![],
    promptMode: promptMode,
  };
}
function createStoryEpisodeSplitRawResponsePartialResult({
  episodeRef: episodeRef = '',
  rawResponse: rawResponse = '',
  attempts: attempts = 0x1,
  error: error = null,
} = {}) {
  const _0x7dd708 = serializeStoryEpisodeSplitValidationError(error);
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    status: 'partial',
    episodeRef: episodeRef,
    items: [
      {
        status: 'invalid',
        sourceIndex: 0x0,
        sourceClipRef: 'raw-response',
        rawClips: [],
        rawResponse: rawResponse,
        error: _0x7dd708,
      },
    ],
    clips: [],
    rejectedClips: [{ sourceIndex: 0x0, sourceClipRef: 'raw-response', message: _0x7dd708['message'] }],
    totalDurationSeconds: 0x0,
    attempts: Math['max'](0x1, Math['trunc'](Number(attempts) || 0x1)),
    rawResponse: rawResponse,
  };
}
function serializeStoryEpisodeSplitTransportRaw(_0x333f75) {
  const _0x3cda4c = _0x333f75?.['raw'];
  if (typeof _0x3cda4c === 'string') return _0x3cda4c;
  if (_0x3cda4c === undefined || _0x3cda4c === null) return '';
  try {
    return JSON['stringify'](_0x3cda4c);
  } catch {
    return String(_0x3cda4c || '');
  }
}
function hasStoryEpisodeSplitTransportModelOutput(_0x4bf6a6) {
  if (!_0x4bf6a6) return ![];
  if (typeof _0x4bf6a6 === 'string') {
    const _0x181d91 = normalizeText(_0x4bf6a6);
    if (!_0x181d91) return ![];
    try {
      return hasStoryEpisodeSplitTransportModelOutput(JSON['parse'](_0x181d91));
    } catch {
      return ![];
    }
  }
  if (Array['isArray'](_0x4bf6a6))
    return _0x4bf6a6['some']((_0x57fbdc) => hasStoryEpisodeSplitTransportModelOutput(_0x57fbdc));
  if (typeof _0x4bf6a6 !== 'object') return ![];
  if (Array['isArray'](_0x4bf6a6['clips']) && _0x4bf6a6['clips']['length']) return !![];
  const _0x1a1f8c = [
    _0x4bf6a6['text'],
    _0x4bf6a6['outputText'],
    _0x4bf6a6['content'],
    _0x4bf6a6['reasoning_content'],
    _0x4bf6a6['reasoningContent'],
  ]
    ['map'](normalizeText)
    ['find'](Boolean);
  if (_0x1a1f8c) return !![];
  const _0x1db8c0 = Array['isArray'](_0x4bf6a6['choices']) ? _0x4bf6a6['choices'] : [];
  if (
    _0x1db8c0['some']((_0x46f5fe) =>
      hasStoryEpisodeSplitTransportModelOutput(_0x46f5fe?.['message'] || _0x46f5fe?.['delta'] || _0x46f5fe),
    )
  )
    return !![];
  return [_0x4bf6a6['data'], _0x4bf6a6['result'], _0x4bf6a6['response'], _0x4bf6a6['output']]['some'](
    (_0x25e4f2) =>
      _0x25e4f2 && _0x25e4f2 !== _0x4bf6a6 && hasStoryEpisodeSplitTransportModelOutput(_0x25e4f2),
  );
}
export function recoverStoryEpisodeSplitDraftLocally({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
  constraints: constraints = {},
  draft: draft = episode?.['splitDraft'],
} = {}) {
  const _0x231c63 = Array['isArray'](draft?.['items']) ? [...draft['items']] : [];
  if (!_0x231c63['length']) throw new Error('没有可在本地恢复的分镜结果。');
  const _0xd1adb2 = Array['isArray'](assets) ? assets : [],
    _0x2bba03 = resolveStoryPlanningConstraints(project, constraints),
    _0x381ae5 = normalizeStoryAssetReference(
      draft?.['episodeRef'] || episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
      'episode-1',
    ),
    _0x1d5305 = createStoryEpisodeDefaultSplitParseContext({
      episodeRef: _0x381ae5,
      episode: episode,
      scriptMode: normalizeStoryScriptMode(project?.['scriptMode']),
      constraints: _0x2bba03,
      assets: _0xd1adb2,
      promptMode: resolveStoryPromptMode(project, constraints),
    }),
    _0x3ce58f = _0x231c63['sort'](
      (_0x544f2e, _0x1d6d1e) =>
        Number(_0x544f2e?.['sourceIndex'] || 0x0) - Number(_0x1d6d1e?.['sourceIndex'] || 0x0),
    )
      ['flatMap']((_0x6027a4) => {
        if (_0x6027a4?.['status'] === 'valid' && Array['isArray'](_0x6027a4?.['clips']))
          return _0x6027a4['clips'];
        const _0x139e16 = (Array['isArray'](_0x6027a4?.['rawClips']) ? _0x6027a4['rawClips'] : [])['map'](
          (_0x32cbe1, _0x2578d2) =>
            normalizeText(_0x32cbe1?.['ref'])
              ? _0x32cbe1
              : {
                  ..._0x32cbe1,
                  ref: normalizeStoryAssetReference(
                    _0x6027a4?.['sourceClipRef'],
                    'clip-' + (Number(_0x6027a4?.['sourceIndex'] || 0x0) + _0x2578d2 + 0x1),
                  ),
                },
        );
        if (!_0x139e16['length']) return [];
        const _0x5badd5 = normalizeStoryEpisodeSplitDraft(
            { episodeRef: _0x381ae5, clips: _0x139e16 },
            _0x1d5305,
          ),
          _0x5b6c9d = finalizeStoryEpisodeSplitDraft(_0x5badd5);
        if (_0x5b6c9d) return _0x5b6c9d['clips'];
        throwStoryEpisodeSplitPartialResult(_0x5badd5);
      })
      ['map']((_0x5bfc28, _0x3f1366) => ({ ..._0x5bfc28, title: formatStoryEpisodeClipTitle(_0x3f1366) }));
  if (!_0x3ce58f['length']) throw new Error('保存的分镜结果中没有可恢复片段。');
  const _0x58bc57 = _0x3ce58f['map']((_0x1e634e) => _0x1e634e['ref']);
  if (new Set(_0x58bc57)['size'] !== _0x58bc57['length']) throw new Error('保存的分镜结果包含重复片段引用。');
  return {
    schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
    episodeRef: _0x381ae5,
    totalDurationSeconds: _0x3ce58f['reduce'](
      (_0x45b680, _0x47af9a) => _0x45b680 + _0x47af9a['durationSec'],
      0x0,
    ),
    clips: _0x3ce58f,
  };
}
function getStoryEpisodesSplitResponseEntries(_0x593feb) {
  const _0x26c5a7 = [_0x593feb],
    _0x29d8bb = new Set();
  while (_0x26c5a7['length']) {
    const _0x4e9c79 = _0x26c5a7['shift']();
    if (Array['isArray'](_0x4e9c79)) return _0x4e9c79;
    if (!_0x4e9c79 || typeof _0x4e9c79 !== 'object' || _0x29d8bb['has'](_0x4e9c79)) continue;
    _0x29d8bb['add'](_0x4e9c79);
    for (const _0x1c134f of ['episodes', 'results', 'items']) {
      if (Array['isArray'](_0x4e9c79[_0x1c134f])) return _0x4e9c79[_0x1c134f];
    }
    if (Array['isArray'](_0x4e9c79['clips'])) return [_0x4e9c79];
    for (const _0x5ac993 of ['result', 'data', 'output', 'response']) {
      if (_0x4e9c79[_0x5ac993] && typeof _0x4e9c79[_0x5ac993] === 'object')
        _0x26c5a7['push'](_0x4e9c79[_0x5ac993]);
    }
  }
  return [];
}
function getStoryEpisodesSplitEntryRef(_0x1621af = {}) {
  return normalizeStoryAssetReference(
    _0x1621af?.['episodeRef'] ||
      _0x1621af?.['episode_ref'] ||
      _0x1621af?.['ref'] ||
      _0x1621af?.['id'] ||
      _0x1621af?.['episode']?.['ref'] ||
      _0x1621af?.['episode']?.['id'],
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
  const _0x52ce5e = getStoryEpisodeReferenceAliases(episode)[0x0] || 'episode-1',
    _0x196160 = Array['isArray'](entry?.['clips'])
      ? entry['clips']
      : Array['isArray'](entry?.['segments'])
        ? entry['segments']
        : [];
  if (!_0x196160['length']) throw new Error('Agent 返回结果没有可用镜头。');
  const _0x2f522f = expandStoryEpisodeSplitCompactData(
      { ...entry, episodeRef: _0x52ce5e, clips: _0x196160 },
      { episodeRef: _0x52ce5e, episode: episode, assets: assets },
    ),
    _0x26ba4b = JSON['stringify'](entry),
    _0x5dbee9 = {
      ...normalizeStoryEpisodeSplitDraft(
        { text: JSON['stringify'](_0x2f522f) },
        createStoryEpisodeDefaultSplitParseContext({
          episodeRef: _0x52ce5e,
          episode: episode,
          scriptMode: scriptMode,
          constraints: constraints,
          assets: assets,
          clipDurationConstraints: clipDurationConstraints,
          promptMode: promptMode,
        }),
      ),
      rawResponse: _0x26ba4b,
    },
    _0x1dd8f8 = finalizeStoryEpisodeSplitDraft(_0x5dbee9);
  if (_0x1dd8f8) return assertStoryEpisodeSplitTiming(_0x1dd8f8, episode);
  throwStoryEpisodeSplitPartialResult(_0x5dbee9);
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
  const _0x204f4c = Array['isArray'](episodes) ? episodes['filter'](Boolean) : [];
  if (!_0x204f4c['length']) throw new Error('没有可生成分镜的分集。');
  const _0x1a8b05 = resolveStoryPlanningConstraints(project, constraints),
    _0x4617f4 = resolveStoryPromptMode(project, constraints),
    _0x2900c7 = normalizeStoryEpisodeClipDurationConstraints(clipDurationConstraints),
    _0x17612a = buildStoryEpisodesSplitPrompt({
      project: project,
      episodes: _0x204f4c,
      assets: assets,
      constraints: { ..._0x1a8b05, promptMode: _0x4617f4 },
      clipDurationConstraints: _0x2900c7,
    }),
    _0x5606e = {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: _0x17612a,
      systemPrompt: getStoryEpisodeSplitRequestSystemPrompt({ compactPrompt: !![], promptMode: _0x4617f4 }),
      thinking: { type: 'disabled' },
      temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
      maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
      timeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
    };
  (onProgress?.({
    stage: 'splitting-episodes',
    current: 0x1,
    total: 0x2,
    message: '正在一次生成 ' + _0x204f4c['length'] + '\x20集分镜',
  }),
    reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
      phase: 'batch-generation',
      prompt: _0x17612a,
      systemPrompt: _0x5606e['systemPrompt'],
      automaticCallLimit: 0x2,
      details: {
        status: 'started',
        requestIndex: 0x1,
        requestCount: 0x2,
        episodeCount: _0x204f4c['length'],
        outputTokenLimitMode: 'provider-default',
        requestTimeoutMode: 'provider-default',
        assetDetailsIncluded: ![],
      },
    }));
  const _0xacfdf = Date['now']();
  let _0x2c6698;
  try {
    _0x2c6698 = await request(_0x5606e);
    const _0x3f4802 = getStoryEpisodeSplitSerializedMetrics(getResultText(_0x2c6698));
    reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
      phase: 'batch-generation',
      prompt: _0x17612a,
      systemPrompt: _0x5606e['systemPrompt'],
      automaticCallLimit: 0x2,
      details: {
        status: 'succeeded',
        requestIndex: 0x1,
        requestCount: 0x2,
        episodeCount: _0x204f4c['length'],
        elapsedMs: Math['max'](0x0, Date['now']() - _0xacfdf),
        responseCharacters: _0x3f4802['characters'],
        responseBytes: _0x3f4802['bytes'],
        ...getStoryEpisodeSplitResponseTiming(_0x2c6698),
      },
    });
  } catch (_0x13597a) {
    (reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
      phase: 'batch-generation',
      prompt: _0x17612a,
      systemPrompt: _0x5606e['systemPrompt'],
      automaticCallLimit: 0x2,
      details: {
        status: 'failed',
        requestIndex: 0x1,
        requestCount: 0x2,
        episodeCount: _0x204f4c['length'],
        elapsedMs: Math['max'](0x0, Date['now']() - _0xacfdf),
        errorType: normalizeText(_0x13597a?.['type'] || _0x13597a?.['name']),
        errorMessage: normalizeText(_0x13597a?.['message'] || _0x13597a),
      },
    }),
      (_0x13597a['message'] =
        (normalizeText(_0x13597a?.['message']) || '批量分镜生成请求失败。') +
        '（生成请求失败，未执行结果检查。）'));
    if (hasStoryEpisodeSplitTransportModelOutput(_0x13597a?.['raw'])) {
      const _0x24e7ec = getStoryEpisodeReferenceAliases(_0x204f4c[0x0])[0x0] || 'episode-1';
      _0x13597a['partialResults'] = [
        createStoryEpisodeSplitRawResponsePartialResult({
          episodeRef: _0x24e7ec,
          rawResponse: serializeStoryEpisodeSplitTransportRaw(_0x13597a),
          attempts: 0x1,
          error: _0x13597a,
        }),
      ];
    }
    throw _0x13597a;
  }
  const _0x4b59a4 = getResultText(_0x2c6698),
    _0x4e8ad7 = _0x204f4c['map'](
      (_0x5b7e3d, _0x1cab91) =>
        getStoryEpisodeReferenceAliases(_0x5b7e3d)[0x0] || 'episode-' + (_0x1cab91 + 0x1),
    ),
    _0x50007f = buildStoryEpisodesSplitValidationPrompt({
      episodeRefs: _0x4e8ad7,
      result: _0x4b59a4,
      promptMode: _0x4617f4,
    }),
    _0x5054ee = {
      model: normalizeText(model),
      provider: normalizeText(provider),
      ...buildStoryTextProviderProfilePayload(providerProfileId),
      prompt: _0x50007f,
      systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
      temperature: 0.1,
    };
  (onProgress?.({
    stage: 'validating-episodes',
    current: 0x2,
    total: 0x2,
    message: '正在检查并修复分镜返回格式',
  }),
    reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
      phase: 'batch-validation',
      prompt: _0x50007f,
      systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
      automaticCallLimit: 0x2,
      details: {
        status: 'started',
        requestIndex: 0x2,
        requestCount: 0x2,
        episodeCount: _0x204f4c['length'],
        outputTokenLimitMode: 'provider-default',
        requestTimeoutMode: 'provider-default',
        includesOriginalScripts: ![],
      },
    }));
  const _0x4a3323 = Date['now']();
  let _0x2568bb = null,
    _0x58760b = null;
  try {
    _0x2568bb = await request(_0x5054ee);
    const _0x53e098 = getStoryEpisodeSplitSerializedMetrics(getResultText(_0x2568bb));
    reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
      phase: 'batch-validation',
      prompt: _0x50007f,
      systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
      automaticCallLimit: 0x2,
      details: {
        status: 'succeeded',
        requestIndex: 0x2,
        requestCount: 0x2,
        episodeCount: _0x204f4c['length'],
        elapsedMs: Math['max'](0x0, Date['now']() - _0x4a3323),
        responseCharacters: _0x53e098['characters'],
        responseBytes: _0x53e098['bytes'],
        ...getStoryEpisodeSplitResponseTiming(_0x2568bb),
      },
    });
  } catch (_0x36f650) {
    ((_0x58760b = _0x36f650),
      reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
        phase: 'batch-validation',
        prompt: _0x50007f,
        systemPrompt: STORY_EPISODES_SPLIT_VALIDATION_SYSTEM_PROMPT,
        automaticCallLimit: 0x2,
        details: {
          status: 'failed',
          requestIndex: 0x2,
          requestCount: 0x2,
          episodeCount: _0x204f4c['length'],
          elapsedMs: Math['max'](0x0, Date['now']() - _0x4a3323),
          errorType: normalizeText(_0x36f650?.['type'] || _0x36f650?.['name']),
          errorMessage: normalizeText(_0x36f650?.['message'] || _0x36f650),
        },
      }));
  }
  const _0x2ed15e = _0x2568bb
      ? getResultText(_0x2568bb)
      : hasStoryEpisodeSplitTransportModelOutput(_0x58760b?.['raw'])
        ? serializeStoryEpisodeSplitTransportRaw(_0x58760b)
        : '',
    _0x550218 = [
      ...(normalizeText(_0x2ed15e) ? [{ phase: 'validation', rawResponse: _0x2ed15e }] : []),
      { phase: 'generation', rawResponse: _0x4b59a4 },
    ];
  let _0x59e1fd = [],
    _0x4b7894 = '',
    _0xa1c16 = null;
  for (const _0x31ad4d of _0x550218) {
    try {
      const _0x10328f = getStoryEpisodesSplitResponseEntries(
        parseStrictJson(_0x31ad4d['rawResponse'], 'Agent 未返回批量分镜结果。'),
      );
      if (!_0x10328f['length']) throw new Error('Agent\x20返回结果没有可用分集。');
      ((_0x59e1fd = _0x10328f), (_0x4b7894 = _0x31ad4d['rawResponse']));
      break;
    } catch (_0x29339e) {
      _0xa1c16 = _0x29339e;
    }
  }
  if (!_0x59e1fd['length']) {
    const _0xff34b3 = _0xa1c16 || _0x58760b || new Error('批量分镜返回无法解析。'),
      _0x2dc75f = getStoryEpisodeReferenceAliases(_0x204f4c[0x0])[0x0] || 'episode-1',
      _0x470387 = [
        '首次生成返回：',
        _0x4b59a4,
        ...(normalizeText(_0x2ed15e) ? ['', '检查修复返回：', _0x2ed15e] : []),
      ]['join']('\x0a');
    ((_0xff34b3['partialResults'] = [
      createStoryEpisodeSplitRawResponsePartialResult({
        episodeRef: _0x2dc75f,
        rawResponse: _0x470387,
        attempts: _0x2568bb || _0x58760b ? 0x2 : 0x1,
        error: _0xff34b3,
      }),
    ]),
      (_0xff34b3['message'] =
        (normalizeText(_0xff34b3?.['message']) || '批量分镜返回无法解析。') +
        '（生成和检查结果均无法解析，已保存原始返回；未发起第三次请求。）'));
    throw _0xff34b3;
  }
  const _0x307d78 = new Set(_0x59e1fd['map']((_0x69b959, _0x778dc5) => _0x778dc5)),
    _0x273210 = _0x204f4c['map']((_0x3613ae, _0x340ad8) => {
      const _0x1ebcc1 = new Set(getStoryEpisodeReferenceAliases(_0x3613ae));
      let _0x375a6b = _0x59e1fd['findIndex'](
        (_0x3d4a87, _0x3be563) =>
          _0x307d78['has'](_0x3be563) && _0x1ebcc1['has'](getStoryEpisodesSplitEntryRef(_0x3d4a87)),
      );
      if (_0x375a6b < 0x0 && _0x307d78['has'](_0x340ad8)) _0x375a6b = _0x340ad8;
      if (_0x375a6b < 0x0) _0x375a6b = [..._0x307d78][0x0] ?? -0x1;
      const _0x1f14e4 = getStoryEpisodeReferenceAliases(_0x3613ae)[0x0] || 'episode-' + (_0x340ad8 + 0x1);
      if (_0x375a6b < 0x0)
        return {
          episodeRef: _0x1f14e4,
          status: 'rejected',
          error: new Error('Agent 未返回该分集的分镜结果。'),
        };
      _0x307d78['delete'](_0x375a6b);
      const _0xaedd86 = _0x59e1fd[_0x375a6b],
        _0x5e5a61 = selectStoryEpisodeSplitAssets(assets, _0x3613ae);
      try {
        return {
          episodeRef: _0x1f14e4,
          status: 'fulfilled',
          result: parseStoryEpisodesSplitEntry({
            entry: _0xaedd86,
            episode: _0x3613ae,
            scriptMode: normalizeStoryScriptMode(project?.['scriptMode']),
            assets: _0x5e5a61,
            constraints: _0x1a8b05,
            clipDurationConstraints: _0x2900c7,
            promptMode: _0x4617f4,
          }),
        };
      } catch (_0x5dc823) {
        return {
          episodeRef: _0x1f14e4,
          status: 'rejected',
          error: _0x5dc823,
          partialResult:
            _0x5dc823?.['partialResult'] ||
            createStoryEpisodeSplitRawResponsePartialResult({
              episodeRef: _0x1f14e4,
              rawResponse: JSON['stringify'](_0xaedd86),
              attempts: 0x1,
              error: _0x5dc823,
            }),
        };
      }
    });
  return { rawResponse: _0x4b7894, items: _0x273210 };
}
export function splitStoryEpisodeChecked(_0xe98d5b = {}) {
  return splitStoryEpisode({ ..._0xe98d5b, compactPrompt: !![], skipRequestQueue: !![] });
}
export async function splitStoryEpisodesBatch({
  episodes: episodes = [],
  onProgress: onProgress = null,
  ..._0x3e9607
} = {}) {
  const _0xa0ed89 = Array['isArray'](episodes) ? episodes['filter'](Boolean) : [];
  if (!_0xa0ed89['length']) throw new Error('没有可生成分镜的分集。');
  const _0x56dfd1 = await Promise['all'](
    _0xa0ed89['map'](async (_0x484798, _0x17dc20) => {
      const _0x19ef5c = getStoryEpisodeReferenceAliases(_0x484798)[0x0] || 'episode-' + (_0x17dc20 + 0x1);
      try {
        const _0x13a766 = await splitStoryEpisodeChecked({
          ..._0x3e9607,
          episode: _0x484798,
          onInvocation: (_0x54e9b6) =>
            _0x3e9607['onInvocation']?.({ ..._0x54e9b6, episodeRef: _0x19ef5c, episodeIndex: _0x17dc20 }),
          onProgress: (_0x382250 = {}) =>
            onProgress?.({
              ..._0x382250,
              episodeRef: _0x19ef5c,
              episodeIndex: _0x17dc20,
              episodeCount: _0xa0ed89['length'],
            }),
        });
        return { episodeRef: _0x19ef5c, status: 'fulfilled', result: _0x13a766 };
      } catch (_0xb133b3) {
        return {
          episodeRef: _0x19ef5c,
          status: 'rejected',
          error: _0xb133b3,
          ...(_0xb133b3?.['partialResult'] ? { partialResult: _0xb133b3['partialResult'] } : {}),
        };
      }
    }),
  );
  return { items: _0x56dfd1 };
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
  compactPrompt: compactPrompt = ![],
  skipRequestQueue: skipRequestQueue = ![],
  onInvocation: onInvocation = null,
} = {}) {
  assertPlanningModel(model, provider);
  const _0x57a705 = selectStoryEpisodeSplitAssets(assets, episode),
    _0x46e11f = resolveStoryPlanningConstraints(project, constraints),
    _0x228ca1 = resolveStoryPromptMode(project, constraints),
    _0x40d71c = normalizeStoryEpisodeClipDurationConstraints(clipDurationConstraints),
    _0x59c5cd = normalizeStoryAssetReference(
      episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
      'episode-1',
    ),
    _0x52f2d1 = [episode],
    _0x268faf = _0x52f2d1['length'],
    _0x5260ad = STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
    _0x2e8e94 = episode['replication']?.['sourceAnalysis']
      ? getReplicationGenerationSystemPrompt()
      : [
          getStoryEpisodeSplitRequestSystemPrompt({ compactPrompt: compactPrompt, promptMode: _0x228ca1 }),
          buildVideoReplicationTimingGuidance(episode),
        ]
          ['filter'](Boolean)
          ['join']('\x0a'),
    _0x14bfbe = createStoryEpisodeDefaultSplitParseContext({
      episodeRef: _0x59c5cd,
      episode: episode,
      scriptMode: normalizeStoryScriptMode(project?.['scriptMode']),
      constraints: _0x46e11f,
      assets: _0x57a705,
      clipDurationConstraints: _0x40d71c,
      promptMode: _0x228ca1,
    }),
    _0x426a1c = [];
  for (let _0x40d591 = 0x0; _0x40d591 < _0x268faf; _0x40d591 += 0x1) {
    const _0x3a1fd1 = _0x52f2d1[_0x40d591],
      _0x50200d = selectStoryEpisodeSplitAssets(_0x57a705, _0x3a1fd1);
    onProgress?.({
      stage: 'splitting-episode',
      current: _0x40d591 + 0x1,
      total: _0x268faf,
      message: repairDraft ? '正在重新生成整集分镜' : '正在生成分镜脚本',
    });
    const _0xd14187 = (compactPrompt ? buildStoryEpisodeMinimalSplitPrompt : buildStoryEpisodeSplitPrompt)({
        project: project,
        episode: _0x3a1fd1,
        assets: _0x50200d,
        constraints: { ..._0x46e11f, promptMode: _0x228ca1 },
        clipDurationConstraints: _0x40d71c,
      }),
      _0x5c2118 = {
        model: normalizeText(model),
        provider: normalizeText(provider),
        ...buildStoryTextProviderProfilePayload(providerProfileId),
        prompt: _0xd14187,
        systemPrompt: _0x2e8e94,
        ...(episode['replication']?.['sourceAnalysis']
          ? {
              structuredOutput: createReplicationSplitOutput({
                assets: _0x50200d,
                promptMode: _0x228ca1,
                segmentPlan: _0x3a1fd1['replication']?.['segmentPlan'],
              }),
            }
          : {}),
        thinking: { type: 'disabled' },
        temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
        maxOutputTokens: _0x5260ad,
        timeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
      },
      _0x2b2c3d = Date['now']();
    reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
      phase: repairDraft ? 'manual-regeneration' : 'full-generation',
      prompt: _0xd14187,
      systemPrompt: _0x2e8e94,
      automaticCallLimit: _0x268faf,
      details: {
        status: 'queued',
        requestIndex: _0x40d591 + 0x1,
        requestCount: _0x268faf,
        outputTokenLimitMode: 'explicit',
        maxOutputTokens: _0x5260ad,
        requestTimeoutMode: 'bounded',
        requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
        assetCount: _0x57a705['length'],
        includesAdjacentEpisodes: ![],
        blueprintRequestCount: 0x0,
      },
    });
    let _0x2aad3b;
    try {
      const _0x419480 = async () => {
        const _0x4cc291 = Date['now'](),
          _0x2b65eb = Math['max'](0x0, _0x4cc291 - _0x2b2c3d);
        reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
          phase: repairDraft ? 'manual-regeneration' : 'full-generation',
          prompt: _0xd14187,
          systemPrompt: _0x2e8e94,
          automaticCallLimit: _0x268faf,
          details: {
            status: 'started',
            requestIndex: _0x40d591 + 0x1,
            requestCount: _0x268faf,
            queueWaitMs: _0x2b65eb,
            maxOutputTokens: _0x5260ad,
            requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
          },
        });
        try {
          const _0x4d46f6 = await invokeStoryGenerationRequest({
              request: request,
              requestPayload: _0x5c2118,
              stepId: repairDraft ? 'manual-regeneration' : 'generation',
              attempt: _0x40d591 + 0x1,
              onInvocation: onInvocation,
              serializeResponse: getResultText,
            }),
            _0x31c6ea = getStoryEpisodeSplitSerializedMetrics(getResultText(_0x4d46f6));
          return (
            reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
              phase: repairDraft ? 'manual-regeneration' : 'full-generation',
              prompt: _0xd14187,
              systemPrompt: _0x2e8e94,
              automaticCallLimit: _0x268faf,
              details: {
                status: 'succeeded',
                requestIndex: _0x40d591 + 0x1,
                requestCount: _0x268faf,
                queueWaitMs: _0x2b65eb,
                elapsedMs: Math['max'](0x0, Date['now']() - _0x4cc291),
                responseCharacters: _0x31c6ea['characters'],
                responseBytes: _0x31c6ea['bytes'],
                ...getStoryEpisodeSplitResponseTiming(_0x4d46f6),
                maxOutputTokens: _0x5260ad,
                requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
              },
            }),
            episode['replication']?.['sourceAnalysis']
              ? completeReplicationMissingClips(_0x4d46f6, _0x5c2118, (_0x2432d1) =>
                  invokeStoryGenerationRequest({
                    request: request,
                    requestPayload: _0x2432d1,
                    stepId: 'replication-missing-clips',
                    attempt: 0x1,
                    onInvocation: onInvocation,
                    serializeResponse: getResultText,
                  }),
                )
              : _0x4d46f6
          );
        } catch (_0x26af79) {
          reportStoryEpisodeSplitRequestDiagnosticsInBackground(diagnostics, {
            phase: repairDraft ? 'manual-regeneration' : 'full-generation',
            prompt: _0xd14187,
            systemPrompt: _0x2e8e94,
            automaticCallLimit: _0x268faf,
            details: {
              status: 'failed',
              requestIndex: _0x40d591 + 0x1,
              requestCount: _0x268faf,
              queueWaitMs: _0x2b65eb,
              elapsedMs: Math['max'](0x0, Date['now']() - _0x4cc291),
              errorType: normalizeText(_0x26af79?.['type'] || _0x26af79?.['name']),
              errorMessage: normalizeText(_0x26af79?.['message'] || _0x26af79),
              maxOutputTokens: _0x5260ad,
              requestTimeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
            },
          });
          throw _0x26af79;
        }
      };
      _0x2aad3b = skipRequestQueue ? await _0x419480() : await enqueueStoryEpisodeRequest(_0x419480);
    } catch (_0x1b49ab) {
      _0x1b49ab['message'] =
        (normalizeText(_0x1b49ab?.['message']) || '分镜生成请求失败。') +
        '（未自动重试，未生成本地替代分镜。）';
      hasStoryEpisodeSplitTransportModelOutput(_0x1b49ab?.['raw']) &&
        (_0x1b49ab['partialResult'] = createStoryEpisodeSplitRawResponsePartialResult({
          episodeRef: _0x59c5cd,
          rawResponse: serializeStoryEpisodeSplitTransportRaw(_0x1b49ab),
          attempts: _0x40d591 + 0x1,
          error: _0x1b49ab,
        }));
      throw _0x1b49ab;
    }
    try {
      const _0xa4e07c = parseStrictJson(getResultText(_0x2aad3b), 'Agent 未返回片段拆分结果。');
      if (!Array['isArray'](_0xa4e07c?.['clips']) || !_0xa4e07c['clips']['length'])
        throw new Error('Agent\x20返回结果没有可用镜头。');
      _0x426a1c['push']({
        response: _0x2aad3b,
        requestEpisode: _0x3a1fd1,
        requestAssets: _0x50200d,
        responseData: _0xa4e07c,
      });
    } catch (_0x54667e) {
      ((_0x54667e['partialResult'] = createStoryEpisodeSplitRawResponsePartialResult({
        episodeRef: _0x59c5cd,
        rawResponse: getResultText(_0x2aad3b),
        attempts: _0x40d591 + 0x1,
        error: _0x54667e,
      })),
        (_0x54667e['message'] =
          (normalizeText(_0x54667e?.['message']) || '当前返回无法解析。') +
          '（已保留原始返回；未用本地内容替换，未自动重试。）'));
      throw _0x54667e;
    }
  }
  let _0x132267;
  try {
    const _0x8929ca = _0x426a1c['flatMap'](
        ({
          response: _0x374af5,
          requestEpisode: _0x43415c,
          requestAssets: _0x5e9110,
          responseData: _0x4449ce,
        }) => {
          return (
            expandStoryEpisodeSplitCompactData(_0x4449ce, {
              episodeRef: _0x59c5cd,
              episode: _0x43415c,
              assets: _0x5e9110,
            })['clips'] || []
          );
        },
      ),
      _0x23594a =
        _0x268faf > 0x1
          ? _0x8929ca['map']((_0x33511f, _0x2bf67c) => ({ ..._0x33511f, ref: 'clip-' + (_0x2bf67c + 0x1) }))
          : _0x8929ca;
    _0x132267 = {
      ...normalizeStoryEpisodeSplitDraft(
        { text: JSON['stringify']({ episodeRef: _0x59c5cd, clips: _0x23594a }) },
        _0x14bfbe,
      ),
      rawResponse: _0x426a1c['map'](({ response: _0x470b78 }) => getResultText(_0x470b78))['join'](
        '\x0a\x0a',
      ),
    };
  } catch (_0x7f261a) {
    const _0x531391 = _0x426a1c['map'](({ response: _0x2d6230 }) => getResultText(_0x2d6230))['join'](
      '\x0a\x0a',
    );
    ((_0x7f261a['partialResult'] = createStoryEpisodeSplitRawResponsePartialResult({
      episodeRef: _0x59c5cd,
      rawResponse: _0x531391,
      attempts: _0x268faf,
      error: _0x7f261a,
    })),
      (_0x7f261a['message'] =
        (normalizeText(_0x7f261a?.['message']) || 'Agent 返回格式无法解析。') +
        '（已保存本次原始返回；未自动发起第二次请求。）'));
    throw _0x7f261a;
  }
  let _0x817982 = finalizeStoryEpisodeSplitDraft(_0x132267);
  if (_0x817982) return _0x817982;
  if (canRepairStoryEpisodeSplitPartialDraft(_0x132267)) {
    const _0x565dd7 = _0x132267['items']['filter']((_0x45d736) => _0x45d736?.['status'] !== 'valid')[
        'length'
      ],
      _0x36b19d = buildStoryEpisodeSplitPartialRepairPrompt({
        draft: _0x132267,
        episode: episode,
        assets: _0x57a705,
        constraints: _0x46e11f,
        schemaVersion: STORY_EPISODE_SPLIT_SCHEMA_VERSION,
        clipMaxSeconds: resolveStoryPromptModeClipMaxSeconds(_0x228ca1, _0x46e11f['sceneMaxSeconds']),
        timingGuidance: [
          STORY_EPISODE_SPLIT_ADAPTIVE_TIMING_GUIDANCE,
          buildVideoReplicationTimingGuidance(episode),
        ]
          ['filter'](Boolean)
          ['join']('\x0a'),
        dialogueSpeakerGuidance: STORY_EPISODE_SPLIT_DIALOGUE_SPEAKER_GUIDANCE,
        groupingGuidance: STORY_EPISODE_SPLIT_GROUPING_GUIDANCE,
        timelineRequirements: getStoryEpisodeTimelinePlanningRequirements(_0x228ca1),
        continuousTimeline: isStoryContinuousTimelinePromptMode(_0x228ca1),
      });
    (onProgress?.({
      stage: 'repairing-episode-split',
      current: 0x0,
      total: _0x565dd7,
      message: '正在定点修复 ' + _0x565dd7 + '\x20个格式或校验未通过的片段',
    }),
      reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
        phase: 'targeted-repair',
        prompt: _0x36b19d,
        systemPrompt: _0x2e8e94,
        failedClipCount: _0x565dd7,
        carriesFullEpisodeContext: ![],
        automaticCallLimit: 0x1,
        details: { status: 'queued', requestIndex: 0x1, requestCount: 0x1 },
      }));
    let _0xfbca5e = null;
    try {
      const _0x5ee411 = () =>
        invokeStoryGenerationRequest({
          request: request,
          requestPayload: {
            model: normalizeText(model),
            provider: normalizeText(provider),
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: _0x36b19d,
            systemPrompt: _0x2e8e94,
            thinking: { type: 'disabled' },
            temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
            maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
            timeoutMs: STORY_EPISODE_SPLIT_REQUEST_TIMEOUT_MS,
          },
          stepId: 'generation-repair',
          attempt: 0x2,
          onInvocation: onInvocation,
          serializeResponse: getResultText,
        });
      _0xfbca5e = skipRequestQueue ? await _0x5ee411() : await enqueueStoryEpisodeRequest(_0x5ee411);
      const _0x559d10 = parseStrictJson(getResultText(_0xfbca5e), 'Agent 未返回片段局部修复结果。');
      _0x132267 = applyStoryEpisodeSplitPartialRepairs(_0x559d10, _0x132267, {
        parseReplacementClips: (_0x2d23cd) =>
          parseStoryEpisodeSplitResult({ episodeRef: _0x132267['episodeRef'], clips: _0x2d23cd }, _0x14bfbe)[
            'clips'
          ],
        serializeValidationError: (_0x59ee6f, _0x14c958) =>
          serializeStoryEpisodeSplitValidationError(_0x59ee6f, {
            clipIndex: _0x14c958['sourceIndex'],
            clipCount: _0x132267['items']['length'],
          }),
      });
    } catch (_0x33595e) {
      _0x132267 = appendStoryEpisodeSplitPartialRepairFailure(_0x132267, _0x33595e);
    }
    const _0x45a337 = getResultText(_0xfbca5e);
    _0x45a337 &&
      (_0x132267['rawResponse'] = [_0x132267['rawResponse'], '局部修复返回：', _0x45a337]
        ['filter'](Boolean)
        ['join']('\x0a\x0a'));
    _0x817982 = finalizeStoryEpisodeSplitDraft(_0x132267);
    if (_0x817982) return assertStoryEpisodeSplitTiming(_0x817982, episode);
  }
  throwStoryEpisodeSplitPartialResult(_0x132267);
}
const STORY_EPISODE_EXPERIMENTAL_DRAFT_STRATEGY = 'semantic-shot-batches-v3',
  STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS = 0x2,
  STORY_EPISODE_EXPERIMENTAL_RETRY_DELAY_MS = 0x258;
function cloneStoryEpisodeExperimentalValue(_0x115b4c) {
  if (!_0x115b4c || typeof _0x115b4c !== 'object') return null;
  try {
    return JSON['parse'](JSON['stringify'](_0x115b4c));
  } catch {
    return null;
  }
}
function hashStoryEpisodeExperimentalValue(_0x1497e8) {
  const _0x3e8588 = JSON['stringify'](_0x1497e8);
  let _0x5d5b83 = 0x811c9dc5;
  for (let _0x7dc690 = 0x0; _0x7dc690 < _0x3e8588['length']; _0x7dc690 += 0x1) {
    ((_0x5d5b83 ^= _0x3e8588['charCodeAt'](_0x7dc690)), (_0x5d5b83 = Math['imul'](_0x5d5b83, 0x1000193)));
  }
  return (
    STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION +
    '-' +
    (_0x5d5b83 >>> 0x0)['toString'](0x10)['padStart'](0x8, '0') +
    '-' +
    _0x3e8588['length']
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
  promptExperiment: promptExperiment = ![],
  promptMode: promptMode = 'seedance-2.0',
  timingBudget: timingBudget = null,
} = {}) {
  const _0x2e1e23 = normalizeStoryProjectInput(project);
  return hashStoryEpisodeExperimentalValue({
    episodeRef: episodeRef,
    sourceBeats: sourceBeats,
    assets: assets,
    constraints: constraints,
    model: normalizeText(model),
    provider: normalizeText(provider),
    providerProfileId: normalizeText(providerProfileId),
    promptExperiment: promptExperiment === !![],
    promptMode: normalizeText(promptMode)['toLowerCase']() || 'seedance-2.0',
    timingBudget: timingBudget,
    scriptMode: _0x2e1e23['scriptMode'],
    aspectRatio: _0x2e1e23['aspectRatio'],
    visualStyle: _0x2e1e23['visualStyle'],
  });
}
function isStoryEpisodeExperimentalTimeout(_0x3a0ff4) {
  const _0x94782 = normalizeText(_0x3a0ff4?.['type'])['toUpperCase'](),
    _0x48d4e5 = normalizeText(_0x3a0ff4?.['name'])['toLowerCase'](),
    _0x36f57a = normalizeText(_0x3a0ff4?.['message'])['toLowerCase']();
  return _0x94782 === 'TIMEOUT' || _0x48d4e5 === 'aborterror' || /timeout|timed out|超时/u['test'](_0x36f57a);
}
function isStoryEpisodeExperimentalPromptTooLong(_0x4d9933) {
  const _0x555f90 = Number(_0x4d9933?.['status'] || _0x4d9933?.['statusCode'] || 0x0),
    _0xafd0c = normalizeText(_0x4d9933?.['message'])['toLowerCase']();
  return (
    _0x555f90 === 0x19d ||
    /提示词过长|prompt.{0,24}too long|context.{0,24}(length|limit)|request entity too large/u['test'](
      _0xafd0c,
    )
  );
}
function isStoryEpisodeExperimentalBatchShrinkable(_0x5c824e) {
  return isStoryEpisodeExperimentalTimeout(_0x5c824e) || isStoryEpisodeExperimentalPromptTooLong(_0x5c824e);
}
function isStoryEpisodeExperimentalRetryable(_0x111c5a) {
  const _0x53c545 = Number(_0x111c5a?.['status'] || _0x111c5a?.['statusCode'] || 0x0);
  return (
    _0x111c5a?.['retryable'] === !![] ||
    isStoryEpisodeExperimentalTimeout(_0x111c5a) ||
    _0x53c545 === 0x1ad ||
    _0x53c545 >= 0x1f4
  );
}
function waitForStoryEpisodeExperimentalRetry(_0x2fe60d) {
  return new Promise((_0x151556) => setTimeout(_0x151556, _0x2fe60d));
}
async function settleStoryEpisodeExperimentalBatches(
  _0xed05a = [],
  _0x439a1a,
  _0x20542d = STORY_EPISODE_EXPERIMENTAL_MAX_CONCURRENT_BATCHES,
) {
  const _0x5464ad = Array['isArray'](_0xed05a) ? _0xed05a : [],
    _0x5e9e9e = new Array(_0x5464ad['length']);
  let _0x369b21 = 0x0;
  const _0xc12e75 = Math['min'](
      _0x5464ad['length'],
      Math['max'](0x1, Math['trunc'](Number(_0x20542d) || 0x1)),
    ),
    _0x31053c = Array['from']({ length: _0xc12e75 }, async () => {
      while (_0x369b21 < _0x5464ad['length']) {
        const _0x5aaf5c = _0x369b21;
        _0x369b21 += 0x1;
        try {
          _0x5e9e9e[_0x5aaf5c] = {
            status: 'fulfilled',
            value: await _0x439a1a(_0x5464ad[_0x5aaf5c], _0x5aaf5c),
          };
        } catch (_0xe55b65) {
          _0x5e9e9e[_0x5aaf5c] = { status: 'rejected', reason: _0xe55b65 };
        }
      }
    });
  return (await Promise['all'](_0x31053c), _0x5e9e9e);
}
async function requestStoryEpisodeExperimentalWithRetry(
  _0x34c42f,
  {
    maxAttempts: maxAttempts = STORY_EPISODE_EXPERIMENTAL_TRANSPORT_ATTEMPTS,
    retryWait: retryWait = waitForStoryEpisodeExperimentalRetry,
    splitOversizedBatch: splitOversizedBatch = ![],
  } = {},
) {
  const _0x167208 = Math['max'](0x1, Math['trunc'](Number(maxAttempts) || 0x1));
  let _0x4ad3c1 = null;
  for (let _0x20b132 = 0x1; _0x20b132 <= _0x167208; _0x20b132 += 0x1) {
    try {
      return await _0x34c42f(_0x20b132, _0x4ad3c1);
    } catch (_0xc25697) {
      if (splitOversizedBatch && isStoryEpisodeExperimentalBatchShrinkable(_0xc25697)) throw _0xc25697;
      if (!isStoryEpisodeExperimentalRetryable(_0xc25697) || _0x20b132 >= _0x167208) throw _0xc25697;
      ((_0x4ad3c1 = _0xc25697),
        await retryWait(
          STORY_EPISODE_EXPERIMENTAL_RETRY_DELAY_MS * 0x2 ** (_0x20b132 - 0x1),
          _0xc25697,
          _0x20b132,
        ));
    }
  }
  throw new Error('实验分批请求重试失败。');
}
function restoreStoryEpisodeExperimentalDraft(
  _0x4e1eeb,
  {
    episodeRef: episodeRef = '',
    sourceFingerprint: sourceFingerprint = '',
    sourceScenes: sourceScenes = [],
    sourceBeats: sourceBeats = [],
    assets: assets = [],
    constraints: constraints = {},
    promptExperiment: promptExperiment = ![],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const _0x18574d = cloneStoryEpisodeExperimentalValue(_0x4e1eeb);
  if (
    !_0x18574d ||
    _0x18574d['strategy'] !== STORY_EPISODE_EXPERIMENTAL_DRAFT_STRATEGY ||
    _0x18574d['schemaVersion'] !== STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION ||
    normalizeText(_0x18574d['episodeRef']) !== episodeRef ||
    normalizeText(_0x18574d['sourceFingerprint']) !== sourceFingerprint
  )
    return null;
  try {
    const _0x3eb0fa = parseStoryEpisodeSplitBlueprint(_0x18574d['blueprint'], {
        episodeRef: episodeRef,
        sourceScenes: sourceScenes,
        sourceBeats: sourceBeats,
        assets: assets,
        constraints: constraints,
        enforceMaxDuration: ![],
        includeDirectorContinuity: promptExperiment === !![],
      }),
      _0x5a086c = new Map(
        _0x3eb0fa['clipPlans']['map']((_0x33e628) => [normalizeText(_0x33e628?.['ref']), _0x33e628]),
      ),
      _0x27b515 = Array['isArray'](_0x18574d['completedClips']) ? _0x18574d['completedClips'] : [],
      _0x402796 = Array['isArray'](_0x18574d['completedPlanResults'])
        ? _0x18574d['completedPlanResults']
        : _0x27b515['filter']((_0x258867) => _0x5a086c['has'](normalizeText(_0x258867?.['ref'])))['map'](
            (_0x3d3020) => ({ sourcePlanRef: normalizeText(_0x3d3020?.['ref']), clips: [_0x3d3020] }),
          ),
      _0x3db6ef = new Map(
        _0x402796['map']((_0xae85e1) => [normalizeText(_0xae85e1?.['sourcePlanRef']), _0xae85e1]),
      );
    if (
      _0x3db6ef['size'] !== _0x402796['length'] ||
      _0x402796['some']((_0x5e94ac) => !_0x5a086c['has'](normalizeText(_0x5e94ac?.['sourcePlanRef'])))
    )
      return null;
    const _0x2810a9 = [],
      _0x1983f2 = new Set();
    _0x3eb0fa['clipPlans']['forEach']((_0x51bb92) => {
      const _0x5d464c = _0x3db6ef['get'](_0x51bb92['ref']);
      if (!_0x5d464c) return;
      const _0x2047cd = parseStoryEpisodeSplitResult(
        { episodeRef: episodeRef, clips: Array['isArray'](_0x5d464c['clips']) ? _0x5d464c['clips'] : [] },
        {
          episodeRef: episodeRef,
          constraints: constraints,
          assets: assets,
          clipPlans: [_0x51bb92],
          minimumShotsPerClip: 0x1,
          maximumShotsPerClip: STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP,
          enforceMaxDuration: ![],
          repairMissingShotFields: !![],
          allowEmptyAudio: !![],
          requireAllPlanCharacters: ![],
          completePlanSceneUsage: !![],
          includeCutAfter: !![],
          promptMode: promptMode,
        },
      );
      if (_0x2047cd['clips']['some']((_0x217cbd) => _0x1983f2['has'](_0x217cbd['ref'])))
        throw new Error('实验分批断点包含重复的片段引用。');
      (_0x2047cd['clips']['forEach']((_0x534183) => _0x1983f2['add'](_0x534183['ref'])),
        _0x2810a9['push']({ sourcePlanRef: _0x51bb92['ref'], clips: _0x2047cd['clips'] }));
    });
    const _0x4d7d59 = new Set(_0x2810a9['map']((_0x3d7ae5) => _0x3d7ae5['sourcePlanRef'])),
      _0x2197b2 = _0x2810a9['flatMap']((_0x268bc8) => _0x268bc8['clips']);
    return {
      ..._0x18574d,
      blueprint: _0x3eb0fa,
      completedPlanResults: _0x2810a9,
      completedClips: _0x2197b2,
      failedBatchRefs: normalizeStringArray(_0x18574d['failedBatchRefs'])['filter'](
        (_0xcac2b3) => !_0x4d7d59['has'](_0xcac2b3) && _0x5a086c['has'](_0xcac2b3),
      ),
      attempts: Math['max'](0x0, Math['trunc'](Number(_0x18574d['attempts']) || 0x0)),
    };
  } catch {
    return null;
  }
}
async function saveStoryEpisodeExperimentalCheckpoint(_0x548b54, _0x126f86) {
  return (
    (_0x548b54['updatedAt'] = Date['now']()),
    typeof _0x126f86 === 'function' && (await _0x126f86(cloneStoryEpisodeExperimentalValue(_0x548b54))),
    _0x548b54
  );
}
function createStoryEpisodeExperimentalBatchDraft(
  _0x338072,
  {
    episodeRef: episodeRef = '',
    clipPlans: clipPlans = [],
    constraints: constraints = {},
    assets: assets = [],
    promptMode: promptMode = 'seedance-2.0',
  } = {},
) {
  const _0x56f980 = normalizeStoryEpisodeSplitDraft(_0x338072, {
      episodeRef: episodeRef,
      constraints: constraints,
      assets: assets,
      clipPlans: clipPlans,
      minimumShotsPerClip: 0x1,
      maximumShotsPerClip: STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP,
      enforceMaxDuration: ![],
      repairMissingShotFields: !![],
      allowEmptyAudio: !![],
      requireAllPlanCharacters: ![],
      completePlanSceneUsage: !![],
      includeCutAfter: !![],
      promptMode: promptMode,
    }),
    _0x581488 = clipPlans['map']((_0x38bb8b) => normalizeText(_0x38bb8b?.['ref'])),
    _0x1da8be = new Set(_0x581488),
    _0x303251 = new Map();
  _0x56f980['items']['forEach']((_0x4e4679) => {
    const _0x38e2d0 = normalizeText(_0x4e4679?.['sourceClipRef']);
    if (!_0x38e2d0 || !_0x1da8be['has'](_0x38e2d0)) return;
    if (_0x303251['has'](_0x38e2d0)) {
      _0x303251['set'](_0x38e2d0, {
        status: 'invalid',
        sourceIndex: _0x581488['indexOf'](_0x38e2d0),
        sourceClipRef: _0x38e2d0,
        rawClips: [],
        error: { message: 'Agent 重复返回了计划“' + _0x38e2d0 + '”。' },
      });
      return;
    }
    _0x303251['set'](_0x38e2d0, _0x4e4679);
  });
  const _0x460fae = _0x581488['map']((_0x27a73e, _0x3a0c34) => {
    const _0x20e7df = _0x303251['get'](_0x27a73e);
    if (_0x20e7df) return { ..._0x20e7df, sourceIndex: _0x3a0c34, sourceClipRef: _0x27a73e };
    return {
      status: 'invalid',
      sourceIndex: _0x3a0c34,
      sourceClipRef: _0x27a73e,
      rawClips: [],
      error: { message: 'Agent 未完整返回计划“' + _0x27a73e + '”。' },
    };
  });
  return { ..._0x56f980, items: _0x460fae };
}
function finalizeStoryEpisodeExperimentalBatchDraft(_0x129e17 = {}) {
  const _0x488a56 = finalizeStoryEpisodeSplitDraft(_0x129e17);
  if (!_0x488a56) return null;
  return {
    ..._0x488a56,
    planResults: _0x129e17['items']['map']((_0x62b3f4) => ({
      sourcePlanRef: _0x62b3f4['sourceClipRef'],
      clips: _0x62b3f4['clips'],
    })),
  };
}
function assertStoryEpisodeExperimentalPlanTiming(_0x3a3c09 = {}, _0x2529f5 = []) {
  const _0x3e575a = new Map(
      (Array['isArray'](_0x3a3c09?.['planResults']) ? _0x3a3c09['planResults'] : [])['map']((_0x2522d6) => [
        normalizeText(_0x2522d6?.['sourcePlanRef']),
        _0x2522d6,
      ]),
    ),
    _0xc749eb = (Array['isArray'](_0x2529f5) ? _0x2529f5 : [])['flatMap']((_0x19d04e) => {
      const _0x2f98ba = normalizeText(_0x19d04e?.['ref']),
        _0x521c53 = normalizePositiveNumber(_0x19d04e?.['targetDurationSec']),
        _0xd21b5e = _0x3e575a['get'](_0x2f98ba);
      if (!_0x2f98ba || !_0x521c53 || !_0xd21b5e) return [];
      const _0x3732dd = (Array['isArray'](_0xd21b5e?.['clips']) ? _0xd21b5e['clips'] : [])['reduce'](
          (_0x2395c3, _0x27ced2) => _0x2395c3 + (normalizePositiveNumber(_0x27ced2?.['durationSec']) || 0x0),
          0x0,
        ),
        _0x2292eb = Number((_0x521c53 * 0.8)['toFixed'](0x1)),
        _0x386d89 = Number((_0x521c53 * 1.2)['toFixed'](0x1));
      if (_0x3732dd >= _0x2292eb && _0x3732dd <= _0x386d89) return [];
      return [
        {
          planRef: _0x2f98ba,
          totalDurationSeconds: _0x3732dd,
          targetDurationSec: _0x521c53,
          minimum: _0x2292eb,
          maximum: _0x386d89,
        },
      ];
    });
  if (!_0xc749eb['length']) return _0x3a3c09;
  const _0x52af49 = _0xc749eb['slice'](0x0, 0x4)
      ['map'](
        (_0x1ecca0) =>
          '计划“' +
          _0x1ecca0['planRef'] +
          '”分镜合计 ' +
          _0x1ecca0['totalDurationSeconds'] +
          ' 秒，审时预算 ' +
          _0x1ecca0['targetDurationSec'] +
          ' 秒（允许 ' +
          _0x1ecca0['minimum'] +
          '-' +
          _0x1ecca0['maximum'] +
          ' 秒）',
      )
      ['join']('；'),
    _0x44a068 = new Error('实验分批时长自检未通过：' + _0x52af49 + '。');
  ((_0x44a068['code'] = 'STORY_EPISODE_EXPERIMENTAL_PLAN_TIMING_MISMATCH'),
    (_0x44a068['retryable'] = !![]),
    (_0x44a068['timingMismatches'] = _0xc749eb));
  throw _0x44a068;
}
async function requestStoryEpisodeExperimentalBatchResult({
  request: _0x52f99d,
  requestPayload: _0x147353,
  episodeRef: episodeRef = '',
  clipPlans: clipPlans = [],
  constraints: constraints = {},
  assets: assets = [],
  promptMode: promptMode = 'seedance-2.0',
  enforcePlanDurationTargets: enforcePlanDurationTargets = ![],
} = {}) {
  const _0xb38fd9 = {
      episodeRef: episodeRef,
      clipPlans: clipPlans,
      constraints: constraints,
      assets: assets,
      promptMode: promptMode,
    },
    _0x2a0498 = await _0x52f99d(_0x147353),
    _0x4f0c92 = createStoryEpisodeExperimentalBatchDraft(_0x2a0498, _0xb38fd9),
    _0x332696 = getStoryEpisodeScriptFinishReason(_0x2a0498),
    _0x11f8a6 = finalizeStoryEpisodeExperimentalBatchDraft(_0x4f0c92);
  if (_0x11f8a6)
    return enforcePlanDurationTargets
      ? assertStoryEpisodeExperimentalPlanTiming(_0x11f8a6, clipPlans)
      : _0x11f8a6;
  const _0x9311df = _0x4f0c92['items']
      ['filter']((_0x2c5e8d) => _0x2c5e8d?.['status'] === 'valid')
      ['map']((_0x4d9788) => ({ sourcePlanRef: _0x4d9788['sourceClipRef'], clips: _0x4d9788['clips'] })),
    _0xb1f8a5 = _0x4f0c92['items']['find']((_0x566dc5) => _0x566dc5?.['status'] !== 'valid'),
    _0x38b630 = new Error(
      ['length', 'max_tokens', 'max_output_tokens']['includes'](_0x332696)
        ? '实验分批输出被截断（finish reason: ' + _0x332696 + '）。'
        : normalizeText(_0xb1f8a5?.['error']?.['message']) || '实验分批仍有片段未通过校验。',
    );
  ['length', 'max_tokens', 'max_output_tokens']['includes'](_0x332696) &&
    ((_0x38b630['type'] = 'OUTPUT_LENGTH'), (_0x38b630['finishReason'] = _0x332696));
  _0xb1f8a5?.['error']?.['validationDetails'] &&
    (_0x38b630['validationDetails'] = _0xb1f8a5['error']['validationDetails']);
  _0x38b630['partialPlanResults'] = _0x9311df;
  throw _0x38b630;
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
  promptExperiment: promptExperiment = ![],
  request: request = generateText,
  onProgress: onProgress = null,
  onCheckpoint: onCheckpoint = null,
  onInvocation: onInvocation = null,
  resumeDraft: resumeDraft = null,
  retryWait: retryWait = waitForStoryEpisodeExperimentalRetry,
  diagnostics: diagnostics = null,
} = {}) {
  assertPlanningModel(model, provider);
  const _0x4b55b2 = normalizeText(model),
    _0x296c01 = normalizeText(provider),
    _0x475bdb = selectStoryEpisodeSplitAssets(assets, episode),
    _0xbcf7ca = [
      ...new Map(
        (Array['isArray'](assets) ? assets : [])
          ['map']((_0x13a2e8, _0x2763a9) => normalizePlanningAssetSummary(_0x13a2e8, _0x2763a9))
          ['filter']((_0x27aa41) => _0x27aa41['name'])
          ['map']((_0x452ef9) => [_0x452ef9['ref'], _0x452ef9]),
      )['values'](),
    ],
    _0x131b87 = resolveStoryPlanningConstraints(project, constraints),
    _0x4a6f5b = resolveStoryPromptMode(project, constraints),
    _0x258806 = normalizeStoryEpisodeSplitSourceScenes(episode),
    _0xf93943 = normalizeStoryEpisodeExperimentalSourceBeats(episode),
    _0x115c68 = getStoryEpisodeReferenceAliases(episode);
  assertStoryEpisodeSceneAssetCoverage(_0x258806, _0x475bdb, { episodeRefs: _0x115c68 });
  const _0x50e0a2 = normalizeStoryAssetReference(
      episode?.['ref'] || episode?.['planningRef'] || episode?.['id'],
      'episode-1',
    ),
    _0x57f725 = resolveStoryEpisodeSplitTimingBudget(episode),
    _0x3cf4e5 = createStoryEpisodeExperimentalFingerprint({
      project: project,
      episodeRef: _0x50e0a2,
      sourceBeats: _0xf93943,
      assets: _0x475bdb,
      constraints: _0x131b87,
      model: _0x4b55b2,
      provider: _0x296c01,
      providerProfileId: providerProfileId,
      promptExperiment: promptExperiment === !![],
      promptMode: _0x4a6f5b,
      timingBudget: _0x57f725,
    }),
    _0x3d6650 = 'episode-split-' + Date['now']()['toString'](0x24) + '-' + _0x3cf4e5['slice'](-0xc);
  let _0x6b9e84 = 0x0,
    _0x567fe6 = 0x0;
  const _0xea321d = (_0xa03b09, _0x49eedd, _0x2d6a45) => {
      return (
        (_0x567fe6 += 0x1),
        invokeStoryGenerationRequest({
          request: _0xa03b09,
          requestPayload: _0x49eedd,
          allowTruncatedOutput: !![],
          stepId: _0x2d6a45,
          attempt: _0x567fe6,
          onInvocation: onInvocation,
          serializeResponse: getResultText,
        })
      );
    },
    _0x40bcee = () => {
      return ((_0x6b9e84 += 0x1), _0x6b9e84);
    },
    _0x9cee28 = {
      projectId: normalizeText(project?.['id']),
      episodeId: normalizeText(episode?.['id']),
      episodeRef: _0x50e0a2,
      episodeNumber: Math['max'](0x1, Math['trunc'](Number(episode?.['number']) || 0x1)),
      sourceBeatCount: _0xf93943['length'],
      selectedAssetCount: _0x475bdb['length'],
      resumed: Boolean(resumeDraft),
    };
  let _0x488194 = restoreStoryEpisodeExperimentalDraft(resumeDraft, {
      episodeRef: _0x50e0a2,
      sourceFingerprint: _0x3cf4e5,
      sourceScenes: _0x258806,
      sourceBeats: _0xf93943,
      assets: _0xbcf7ca,
      constraints: _0x131b87,
      promptExperiment: promptExperiment === !![],
      promptMode: _0x4a6f5b,
    }),
    _0x3a8b17 = _0x488194?.['blueprint']
      ? reconcileStoryEpisodeSplitBlueprintTiming(_0x488194['blueprint'], episode)
      : null;
  if (_0x488194 && _0x3a8b17) _0x488194['blueprint'] = _0x3a8b17;
  if (!_0x3a8b17) {
    onProgress?.({
      stage: 'planning-episode-split-blueprint',
      current: 0x1,
      total: 0x1,
      message: '正在规划整集分镜蓝图',
    });
    const _0x1e6352 = buildStoryEpisodeSplitBlueprintPrompt({
        project: project,
        episode: episode,
        previousEpisode: previousEpisode,
        nextEpisode: nextEpisode,
        assets: _0x475bdb,
        constraints: _0x131b87,
        enforceMaxDuration: ![],
        sourceBeatsOverride: _0xf93943,
        promptExperiment: promptExperiment === !![],
        promptMode: _0x4a6f5b,
      }),
      _0x11d1ee = JSON['parse'](_0x1e6352),
      _0x19d39f = createStoryEpisodeExperimentalDiagnosticRequest({
        request: request,
        diagnostics: diagnostics,
        runId: _0x3d6650,
        phase: 'experimental-blueprint',
        nextRequestSequence: _0x40bcee,
        carriesFullEpisodeContext: !![],
        context: {
          ..._0x9cee28,
          promptSectionCharacters: getStoryEpisodeExperimentalPromptSectionCharacters(_0x11d1ee),
        },
      });
    ((_0x3a8b17 = await requestStoryEpisodeExperimentalWithRetry(
      () =>
        requestStrictResult({
          request: (_0x5c2058) => _0xea321d(_0x19d39f, _0x5c2058, 'experimental-blueprint'),
          requestPayload: {
            model: _0x4b55b2,
            provider: _0x296c01,
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: _0x1e6352,
            systemPrompt: promptExperiment
              ? STORY_EPISODE_DIRECTOR_CONTINUITY_BLUEPRINT_SYSTEM_PROMPT
              : STORY_EPISODE_BATCHED_BLUEPRINT_SYSTEM_PROMPT,
            thinking: { type: 'disabled' },
            allowOversizedPrompt: !![],
            structuredOutput: createStoryEpisodeExperimentalStructuredOutput(
              'story_episode_split_blueprint_v3',
              buildStoryEpisodeSplitBlueprintResponseSchema({
                ..._0x131b87,
                enforceMaxDuration: ![],
                includeSceneAssetRef: Object['prototype']['hasOwnProperty']['call'](
                  _0x11d1ee?.['outputSchema']?.['clipPlans']?.[0x0] || {},
                  'sceneAssetRef',
                ),
                includeDirectorContinuity: promptExperiment === !![],
              }),
            ),
            temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
            timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
          },
          parse: (_0xc7ac16) => {
            try {
              const _0x4dd3a9 = getStoryEpisodeScriptFinishReason(_0xc7ac16);
              if (['length', 'max_tokens', 'max_output_tokens']['includes'](_0x4dd3a9))
                throw Object['assign'](
                  new Error('实验分批蓝图输出被截断（finish reason: ' + _0x4dd3a9 + '）。'),
                  { type: 'OUTPUT_LENGTH', finishReason: _0x4dd3a9 },
                );
              return parseStoryEpisodeSplitBlueprint(_0xc7ac16, {
                episodeRef: _0x50e0a2,
                episodeRefs: _0x115c68,
                sourceScenes: _0x258806,
                sourceBeats: _0xf93943,
                assets: _0x475bdb,
                constraints: _0x131b87,
                enforceMaxDuration: ![],
                includeDirectorContinuity: promptExperiment === !![],
              });
            } catch (_0x23a516) {
              if (_0x23a516?.['type'] === 'OUTPUT_LENGTH') throw _0x23a516;
              return (
                reportStoryEpisodeSplitRequestDiagnostics(diagnostics, {
                  phase: 'experimental-blueprint-local-fallback',
                  carriesFullEpisodeContext: ![],
                  automaticCallLimit: 0x1,
                  details: {
                    status: 'recovered-locally',
                    countsTowardRequestTotal: ![],
                    runId: _0x3d6650,
                    errorCode: normalizeText(_0x23a516?.['code']),
                    errorMessage: normalizeText(_0x23a516?.['message'] || _0x23a516),
                    responsePreview: normalizeText(_0x23a516?.['responsePreview']),
                  },
                }),
                createLocalStoryEpisodeSplitBlueprint({
                  episodeRef: _0x50e0a2,
                  episodeRefs: _0x115c68,
                  sourceScenes: _0x258806,
                  sourceBeats: _0xf93943,
                  assets: _0x475bdb,
                  includeDirectorContinuity: promptExperiment === !![],
                })
              );
            }
          },
          outputContract: promptExperiment
            ? 'episodeRef\x20and\x20ordered\x20clipPlans[{sourceBeatRefs,beat,optional\x20sceneAssetRef,sceneAppearanceRef,entryState,exitState,openingShotIntent,closingShotIntent,characterAssetRefs,propAssetRefs,targetDurationSec}]\x20covering\x20every\x20sourceBeat\x20exactly\x20once;\x20local\x20code\x20derives\x20plan\x20refs,\x20source\x20scenes,\x20continuity\x20notes,\x20and\x20uniquely\x20bound\x20scene\x20assets'
            : 'episodeRef\x20and\x20ordered\x20clipPlans[{sourceBeatRefs,beat,optional\x20sceneAssetRef,sceneAppearanceRef,entryState,exitState,characterAssetRefs,propAssetRefs,targetDurationSec}]\x20covering\x20every\x20sourceBeat\x20exactly\x20once;\x20local\x20code\x20derives\x20plan\x20refs,\x20source\x20scenes,\x20continuity\x20notes,\x20and\x20uniquely\x20bound\x20scene\x20assets',
          maxAttempts: 0x1,
        }),
      { retryWait: retryWait },
    )),
      (_0x3a8b17 = reconcileStoryEpisodeSplitBlueprintTiming(_0x3a8b17, episode)),
      (_0x488194 = {
        schemaVersion: STORY_EPISODE_BATCHED_SPLIT_SCHEMA_VERSION,
        strategy: STORY_EPISODE_EXPERIMENTAL_DRAFT_STRATEGY,
        episodeRef: _0x50e0a2,
        sourceFingerprint: _0x3cf4e5,
        status: 'expanding',
        blueprint: _0x3a8b17,
        completedPlanResults: [],
        completedClips: [],
        failedBatchRefs: [],
        attempts: 0x0,
        error: '',
        createdAt: Date['now'](),
        updatedAt: Date['now'](),
      }),
      await saveStoryEpisodeExperimentalCheckpoint(_0x488194, onCheckpoint));
  } else {
    const _0x5bb9e5 = Array['isArray'](_0x488194['completedPlanResults'])
      ? _0x488194['completedPlanResults']['length']
      : 0x0;
    onProgress?.({
      stage: 'resuming-episode-split-batches',
      current: _0x5bb9e5,
      total: _0x3a8b17['clipPlans']['length'],
      message:
        '正在从断点继续，已完成 ' + _0x5bb9e5 + '/' + _0x3a8b17['clipPlans']['length'] + '\x20个蓝图计划',
    });
  }
  const _0x332451 = new Map(
      (Array['isArray'](_0x488194['completedPlanResults']) ? _0x488194['completedPlanResults'] : [])['map'](
        (_0x1adb73) => [normalizeText(_0x1adb73?.['sourcePlanRef']), _0x1adb73],
      ),
    ),
    _0xe8c00f = _0x3a8b17['clipPlans']['filter']((_0x10a751) => !_0x332451['has'](_0x10a751['ref'])),
    _0x28af4f = createStoryEpisodeExperimentalConcurrentBatches(_0xe8c00f);
  let _0x5e862e = 0x0;
  const _0x359393 = async (_0x337f41) => {
      (_0x337f41['planResults']['forEach']((_0x18f855) => {
        _0x332451['set'](_0x18f855['sourcePlanRef'], _0x18f855);
      }),
        (_0x488194['completedPlanResults'] = _0x3a8b17['clipPlans']
          ['map']((_0x5e34eb) => _0x332451['get'](_0x5e34eb['ref']))
          ['filter'](Boolean)),
        (_0x488194['completedClips'] = _0x488194['completedPlanResults']['flatMap'](
          (_0x5ddc8a) => _0x5ddc8a['clips'],
        )),
        (_0x488194['status'] = 'expanding'),
        (_0x488194['failedBatchRefs'] = []),
        (_0x488194['error'] = ''),
        await saveStoryEpisodeExperimentalCheckpoint(_0x488194, onCheckpoint));
    },
    _0x111efb = async (_0x5a63b4, { previousError: previousError = null } = {}) => {
      ((_0x5e862e += 0x1),
        (_0x488194['attempts'] += 0x1),
        onProgress?.({
          stage: 'expanding-episode-split-batch',
          current: _0x332451['size'],
          total: _0x3a8b17['clipPlans']['length'],
          message:
            '正在展开\x20' +
            _0x5a63b4['length'] +
            ' 个蓝图计划，已完成 ' +
            _0x332451['size'] +
            '/' +
            _0x3a8b17['clipPlans']['length'],
        }));
      const _0x4bc43a = buildStoryEpisodeSplitBatchPrompt({
          project: project,
          episode: episode,
          assets: _0x475bdb,
          constraints: _0x131b87,
          blueprint: _0x3a8b17,
          planBatch: _0x5a63b4,
          batchNumber: _0x5e862e,
          batchTotal: _0x28af4f['length'],
          enforceMaxDuration: ![],
          sourceBeatsOverride: _0xf93943,
          promptExperiment: promptExperiment === !![],
          promptMode: _0x4a6f5b,
          timingCorrection:
            previousError?.['code'] === 'STORY_EPISODE_EXPERIMENTAL_PLAN_TIMING_MISMATCH'
              ? {
                  previousFailure: normalizeText(previousError?.['message']),
                  instruction: '重新分配原文已有动作、等待、反应与转场的镜头时长，逐项验算后返回。',
                }
              : null,
        }),
        _0x465488 = JSON['parse'](_0x4bc43a),
        _0x395011 = Array['isArray'](_0x465488?.['assets']) ? _0x465488['assets'] : [],
        _0x279317 = createStoryEpisodeExperimentalDiagnosticRequest({
          request: request,
          diagnostics: diagnostics,
          runId: _0x3d6650,
          phase: 'experimental-batch-' + _0x5e862e,
          nextRequestSequence: _0x40bcee,
          carriesFullEpisodeContext: ![],
          context: {
            ..._0x9cee28,
            batchSequence: _0x5e862e,
            batchClipCount: _0x5a63b4['length'],
            batchClipRefs: _0x5a63b4['map']((_0x1e1c1d) => _0x1e1c1d['ref']),
            completedPlanCount: _0x332451['size'],
            completedClipCount: _0x488194['completedClips']['length'],
            plannedClipCount: _0x3a8b17['clipPlans']['length'],
            promptSectionCharacters: getStoryEpisodeExperimentalPromptSectionCharacters(_0x465488),
          },
        });
      return await requestStoryEpisodeExperimentalBatchResult({
        request: (_0x2632ca) =>
          _0xea321d(
            _0x279317,
            _0x2632ca,
            'experimental-batch:' + _0x5a63b4['map']((_0x20feba) => _0x20feba['ref'])['join'](','),
          ),
        requestPayload: {
          model: _0x4b55b2,
          provider: _0x296c01,
          ...buildStoryTextProviderProfilePayload(providerProfileId),
          prompt: _0x4bc43a,
          systemPrompt: getStoryEpisodeExperimentalExpansionSystemPrompt({
            promptExperiment: promptExperiment,
            promptMode: _0x4a6f5b,
          }),
          thinking: { type: 'disabled' },
          allowOversizedPrompt: !![],
          structuredOutput: createStoryEpisodeExperimentalStructuredOutput(
            'story_episode_split_batch_v3',
            buildStoryEpisodeSplitBatchResponseSchema({
              clipCount: _0x5a63b4['length'],
              maxDurationSeconds: _0x131b87['sceneMaxSeconds'],
              minimumShotsPerClip: 0x1,
              maximumShotsPerClip: STORY_EPISODE_EXPERIMENTAL_MAX_SHOTS_PER_CLIP,
              requiredClipFields: ['ref', 'shots'],
              requiredShotFields: [
                'durationSec',
                ...(isStoryContinuousTimelinePromptMode(_0x4a6f5b) ? ['startSec', 'endSec'] : []),
                'assetRefs',
                'visual',
                'camera',
                ...(promptExperiment ? ['transitionFromPrevious'] : []),
              ],
              compactExperimental: !![],
              includeDirectorContinuity: promptExperiment === !![],
              includeTimeline: isStoryContinuousTimelinePromptMode(_0x4a6f5b),
            }),
          ),
          temperature: STORY_EPISODE_SPLIT_TEMPERATURE,
          timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
          maxOutputTokens: STORY_EPISODE_SPLIT_MAX_OUTPUT_TOKENS,
        },
        episodeRef: _0x50e0a2,
        clipPlans: _0x5a63b4,
        constraints: _0x131b87,
        assets: _0x395011,
        promptMode: _0x4a6f5b,
        enforcePlanDurationTargets: Boolean(_0x57f725),
      });
    },
    _0x363e4a = async (_0x5547fc) => {
      let _0x553321 = null;
      try {
        _0x553321 = await requestStoryEpisodeExperimentalWithRetry(
          (_0x180122, _0x3c007c) => _0x111efb(_0x5547fc, { previousError: _0x3c007c }),
          { retryWait: retryWait, splitOversizedBatch: _0x5547fc['length'] > 0x1 },
        );
      } catch (_0x4b6bc3) {
        Array['isArray'](_0x4b6bc3?.['partialPlanResults']) &&
          _0x4b6bc3['partialPlanResults']['length'] &&
          (await _0x359393({
            planResults: _0x4b6bc3['partialPlanResults'],
            clips: _0x4b6bc3['partialPlanResults']['flatMap']((_0x5285df) => _0x5285df['clips']),
          }));
        if (isStoryEpisodeExperimentalBatchShrinkable(_0x4b6bc3) && _0x5547fc['length'] > 0x1) {
          const _0x24dd44 = _0x5547fc['filter']((_0x33f513) => !_0x332451['has'](_0x33f513['ref'])),
            _0x17a28d = Math['floor'](_0x24dd44['length'] / 0x2),
            _0x4e017a = _0x24dd44['slice'](0x0, _0x17a28d),
            _0x4e9c1a = _0x24dd44['slice'](_0x17a28d);
          onProgress?.({
            stage: 'shrinking-episode-split-batch',
            current: _0x332451['size'],
            total: _0x3a8b17['clipPlans']['length'],
            message:
              '当前批次内容较多，正在缩小为 ' +
              _0x4e017a['length'] +
              '+' +
              _0x4e9c1a['length'] +
              ' 个片段继续生成',
          });
          if (_0x4e017a['length']) await _0x363e4a(_0x4e017a);
          if (_0x4e9c1a['length']) await _0x363e4a(_0x4e9c1a);
          return;
        }
        throw _0x4b6bc3;
      }
      await _0x359393(_0x553321);
    },
    _0x5e9a50 = await settleStoryEpisodeExperimentalBatches(
      _0x28af4f,
      (_0x46a26c) => _0x363e4a(_0x46a26c),
      STORY_EPISODE_EXPERIMENTAL_MAX_CONCURRENT_BATCHES,
    ),
    _0x1a8ae3 = _0x5e9a50['find']((_0x2ac3e4) => _0x2ac3e4['status'] === 'rejected');
  if (_0x1a8ae3) {
    const _0x20ec5d =
      _0x1a8ae3['reason'] instanceof Error
        ? _0x1a8ae3['reason']
        : new Error(normalizeText(_0x1a8ae3['reason']) || '实验分批生成失败。');
    ((_0x488194['status'] = 'failed'),
      (_0x488194['failedBatchRefs'] = _0xe8c00f['map']((_0x566558) => _0x566558['ref'])['filter'](
        (_0x53e5ef) => !_0x332451['has'](_0x53e5ef),
      )),
      (_0x488194['error'] = normalizeText(_0x20ec5d?.['message'] || _0x20ec5d) || '实验分批生成失败。'),
      await saveStoryEpisodeExperimentalCheckpoint(_0x488194, onCheckpoint),
      (_0x20ec5d['experimentalDraft'] = cloneStoryEpisodeExperimentalValue(_0x488194)));
    _0x332451['size'] &&
      (_0x20ec5d['message'] =
        _0x488194['error'] +
        '（已完成\x20' +
        _0x332451['size'] +
        '/' +
        _0x3a8b17['clipPlans']['length'] +
        '\x20个蓝图计划，保留\x20' +
        _0x488194['completedClips']['length'] +
        ' 个片段；再次点击实验分批可继续。）');
    throw _0x20ec5d;
  }
  const _0x2afa86 = _0x3a8b17['clipPlans']
    ['map']((_0x4f12c7) => _0x332451['get'](_0x4f12c7['ref']))
    ['filter'](Boolean);
  if (_0x2afa86['length'] !== _0x3a8b17['clipPlans']['length'])
    throw new Error('实验分批拆分未完整覆盖整集蓝图。');
  const _0xb3b7eb = repackStoryEpisodeExperimentalClips({
    episodeRef: _0x50e0a2,
    clipPlans: _0x3a8b17['clipPlans'],
    completedPlanResults: _0x2afa86,
    maxDurationSeconds: resolveStoryPromptModeClipMaxSeconds(_0x4a6f5b, _0x131b87['sceneMaxSeconds']),
    minDurationSeconds: STORY_EPISODE_EXPERIMENTAL_MIN_CLIP_DURATION_SECONDS,
    promptExperiment: promptExperiment === !![],
    preserveSourceGroups: isStoryContinuousTimelinePromptMode(_0x4a6f5b),
  });
  return (
    (_0x488194['status'] = 'completed'),
    (_0x488194['completedPlanResults'] = _0x2afa86),
    (_0x488194['completedClips'] = _0xb3b7eb),
    (_0x488194['failedBatchRefs'] = []),
    (_0x488194['error'] = ''),
    await saveStoryEpisodeExperimentalCheckpoint(_0x488194, onCheckpoint),
    assertStoryEpisodeSplitTiming({ episodeRef: _0x50e0a2, clips: _0xb3b7eb }, episode)
  );
}
