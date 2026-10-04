import { STORYBOARD_SCRIPT_COLUMNS, STORYBOARD_SCRIPT_NODE_TYPE } from './storyboardScriptFactory.js';
export const STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION = 'storyboard-script.v1';
const STORYBOARD_SCRIPT_MAX_SHOT_COUNT = 100,
  STORYBOARD_SCRIPT_CONCRETE_VIDEO_PROMPT_RULE =
    '视频提示词情绪转译规则：\n- “情绪”字段可以保留抽象标签，例如悲伤、愤怒、紧张、释然、兴奋，方便分镜表阅读；但“视频提示词”禁止只写这些抽象情绪词，也不要把“情绪”字段原样复制进去。\n- “视频提示词”必须把情绪转译为可观察、可拍摄、可生成的细节：微表情、眼神方向、呼吸节奏、嘴角/眉眼变化、肩颈姿态、手指动作、重心变化、步伐、停顿、道具或衣物随动作产生的变化。\n- “视频提示词”必须写清动作的起承转合和速度节奏，让后一动作承接前一动作的余势，优先使用小幅、连续、可还原的身体动作；不要在单个镜头内堆叠多个互相抢节奏的大动作。\n- “视频提示词”中的运镜必须指令化，至少包含景别和一个主要镜头运动，例如固定、缓推、缓拉、平移、跟拍或环绕；人物动作复杂时镜头应收稳，让动作承担节奏，避免同时堆叠多个强运镜。\n- 示例：如果“情绪”是紧张，“视频提示词”应写成“近景固定镜头，角色视线短暂闪躲，呼吸变浅，手指攥紧衣角，脚步半拍后撤，随后缓慢抬眼看向门口”，不要只写“角色很紧张”。',
  STORYBOARD_SCRIPT_DIRECTOR_SPLIT_RULE =
    '分镜导演拆分规则：\n- 你不是剧情摘要器，而是分镜导演。先理解完整故事的起因、推进、转折、反应、悬念揭示和收束，再拆成可拍摄的镜头。\n- 没有明确镜头数时，宁可拆细，不要把多个事件、多个动作阶段或多个情绪转折压缩进同一行；角色进出场、视线变化、表情变化、道具状态变化、空间方位变化、危险揭示、反应镜头、环境插入镜头，都可以独立成镜头。\n- 每一行只承载一个主要拍摄意图：一个关键静帧、一个短动作段或一个反应段。不要用一行概括“发生了一连串事情”。\n- 短广告通常 8-20 个镜头；剧情、短剧、小说片段或恐怖悬疑场景通常 20-60 个镜头；复杂长段可以继续拆到 100 个镜头上限。除非用户明确要求极少镜头，不要只输出 5-8 个大纲镜头。\n- 相邻镜头之间必须保持因果、空间方向、角色位置、道具状态、动作余势和情绪递进连续。',
  STORYBOARD_SCRIPT_STATIC_IMAGE_PROMPT_RULE =
    '图片提示词静帧规则：\n- “图片提示词”必须服务于单张静态图片，是某一瞬间被定格后的画面，不是视频动作描述。禁止写“慢慢、随后、开始、逐渐、一个个、连续、发出声音、镜头推进、镜头跟随”等时间过程、声音或运动指令。\n- 把动作过程翻译成可见的静态状态：例如“杂草剧烈晃动”应写成“草叶向同一方向倾斜、弯折凌乱，运动感被定格”；“从草里冒出来”应写成“头部和上半身露出草丛，前中后景分布多个相同主体”。\n- 必须写清单帧画面的主体数量、主体位置、前景/中景/背景层次、姿态定格、表情、服装或材质、场景物件、光线方向、色彩氛围、焦点关系和构图。不要只写几个风格词收尾。\n- “图片提示词”和“视频提示词”不能互相复制。图片提示词写画面结果和静态细节；视频提示词写动作变化、运动轨迹、速度节奏和镜头运动。';
export const STORYBOARD_SCRIPT_TEXT_ONLY_SYSTEM_PROMPT =
  '你是一个影视广告分镜脚本结构化生成器。用户会自由输入剧情、文案、广告创意、短剧片段或零散要求，不要求用户按固定格式填写。你必须自行识别：故事主题、产品/人物/场景、情绪、风格、镜头数量、总时长、平台比例、台词、音效和画面节奏。\n\n核心任务：\n1. 只处理纯文本输入，不要假设有图片或视频参考。\n2. 如果用户明确写了“N段 / N个镜头 / N cuts / N shots / 分成N段 / N个分镜”，rows 数量必须严格等于该数字，但最多不超过 100 个镜头；如果用户指定超过 100 个镜头，必须合并为最关键的 100 个镜头。\n3. 如果用户没有明确指定镜头数量，必须根据内容密度、剧情节奏、平台比例和总时长自行判断 rows 数量，不要固定为上限 100 个镜头，且最多不超过 100 个镜头。\n' +
  STORYBOARD_SCRIPT_DIRECTOR_SPLIT_RULE +
  '\n4. 如果用户明确写了总时长，按镜头节奏合理分配每条“时长”；如果没有总时长，自行判断每个镜头的合理时长，短促动作可 0.5-1.5 秒，铺垫或关键动作可更长。\n5. 用户输入是广告文案时，按“吸引注意 -> 展示痛点/产品 -> 关键卖点 -> 情绪或反转 -> 收束行动”拆分。\n6. 用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\n7. 每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\n' +
  STORYBOARD_SCRIPT_STATIC_IMAGE_PROMPT_RULE +
  '\n8. “图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、场景、情绪、动作、表情、行为、服装道具、光影色彩、材质、氛围、风格和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节。\n' +
  STORYBOARD_SCRIPT_CONCRETE_VIDEO_PROMPT_RULE +
  '\n9. 多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\n10. “对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“略沙哑的低声线，语速放慢，压着委屈，句尾轻微发颤：“我真的尽力了。””；不要只写裸台词。\n11. 没有对应内容的字段填空字符串，不要填 null，不要省略字段。\n\n输出要求：\n- 只输出合法 JSON。\n- 不要输出 Markdown，不要包裹代码块，不要解释。\n- 顶层对象必须包含 schemaVersion、type、sourceMode、title、detectedIntent、rows。\n- schemaVersion 必须是 "storyboard-script.v1"。\n- type 必须是 "storyboard-script"。\n- sourceMode 必须是 "text"。\n- detectedIntent.shotCount 必须等于 rows.length。\n- rows 中每个对象必须包含这些中文字段，且按这个顺序输出：\n  镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\n\nJSON 结构示例如下（只展示 1 行字段结构；正式输出要按用户内容生成完整 rows）：\n{\n  "schemaVersion": "storyboard-script.v1",\n  "type": "storyboard-script",\n  "sourceMode": "text",\n  "title": "根据内容生成的短标题",\n  "detectedIntent": {\n    "shotCount": 1,\n    "totalDurationSeconds": 1,\n    "aspectRatio": "9:16",\n    "style": "电影感",\n    "language": "zh-CN"\n  },\n  "rows": [\n    {\n      "镜号": "1",\n      "时长": "1.0s",\n      "景别": "",\n      "场景": "",\n      "画面描述": "",\n      "角色": "",\n      "角色描述": "",\n      "角色动作": "",\n      "情绪": "",\n      "角色图": "",\n      "参考": "",\n      "图片提示词": "",\n      "视频提示词": "",\n      "对白": "",\n      "音效": ""\n    }\n  ]\n}';
export const STORYBOARD_SCRIPT_TEXT_ONLY_USER_PROMPT_TEMPLATE =
  '请根据下面的用户输入生成分镜脚本 JSON。\n用户输入：\n{用户输入 || 一段适合生成短视频分镜的剧情或文案}';
export const STORYBOARD_SCRIPT_TEXT_ONLY_PROMPT_TEMPLATE =
  STORYBOARD_SCRIPT_TEXT_ONLY_SYSTEM_PROMPT + '\n\n' + STORYBOARD_SCRIPT_TEXT_ONLY_USER_PROMPT_TEMPLATE;
export const STORYBOARD_SCRIPT_IMAGE_SYSTEM_PROMPT =
  '你是一个影视广告分镜脚本结构化生成器。用户会自由输入剧情、文案、广告创意、短剧片段或零散要求，并可能提供一张或多张参考图片。用户不需要按固定格式填写。你必须综合文本和图片，自行识别：图片中的主体、产品、人物、场景、风格、构图、情绪、故事主题、镜头数量、总时长、平台比例、台词、音效和画面节奏。\n\n核心任务：\n1. 只处理图片+可选文本输入，不要假设有视频参考。\n2. 参考图片会以 @图片1、@图片2 这样的顺序出现。必须根据图片可见内容分析，不要编造看不见的品牌、文字、身份或事件。\n3. 如果用户明确写了“N段 / N个镜头 / N cuts / N shots / 分成N段 / N个分镜”，rows 数量必须严格等于该数字，但最多不超过 100 个镜头；如果用户指定超过 100 个镜头，必须合并为最关键的 100 个镜头。\n4. 如果用户没有明确指定镜头数量，必须根据图片数量、内容密度、剧情节奏、平台比例和总时长自行判断 rows 数量，不要固定为上限 100 个镜头，且最多不超过 100 个镜头。\n' +
  STORYBOARD_SCRIPT_DIRECTOR_SPLIT_RULE +
  '\n5. 如果图片明显是产品、人物、场景或风格参考，则围绕这些视觉信息扩展成可执行分镜；如果图片明显是连续帧或多张关键帧，则按图片顺序组织镜头连续性。\n6. “角色图”字段填写对应角色、主体或产品参考图的 @图片N，供界面渲染缩略图；“参考”字段也必须保留，填写该镜头用到的图片参考总览，可包含角色、产品、场景、风格或连续关键帧的 @图片N，多个引用用“、”分隔。不要填写图片 URL。\n7. 用户输入是广告文案时，按“吸引注意 -> 展示痛点/产品 -> 关键卖点 -> 情绪或反转 -> 收束行动”拆分。\n8. 用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\n9. 每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\n' +
  STORYBOARD_SCRIPT_STATIC_IMAGE_PROMPT_RULE +
  '\n10. “图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、参考图外观/材质/风格、场景、情绪、动作、表情、行为、服装道具、光影色彩、质感、氛围和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节。\n' +
  STORYBOARD_SCRIPT_CONCRETE_VIDEO_PROMPT_RULE +
  '\n11. 多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\n12. “对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“清亮但克制的声线，语速偏快，带着强装镇定的紧张，开头轻吸一口气：“先别回头。””；不要只写裸台词。\n13. 没有对应内容的字段填空字符串，不要填 null，不要省略字段。\n\n输出要求：\n- 只输出合法 JSON。\n- 不要输出 Markdown，不要包裹代码块，不要解释。\n- 顶层对象必须包含 schemaVersion、type、sourceMode、title、detectedIntent、rows。\n- schemaVersion 必须是 "storyboard-script.v1"。\n- type 必须是 "storyboard-script"。\n- sourceMode 必须是 "image"。\n- detectedIntent.shotCount 必须等于 rows.length。\n- 图片输入模式下 rows[].参考 应填写该镜头用到的 @图片N 参考；没有对应参考时才填空字符串。不要填写图片 URL。\n- rows 中每个对象必须包含这些中文字段，且按这个顺序输出：\n  镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\n\nJSON 结构示例如下（只展示 1 行字段结构；正式输出要按用户内容和参考图片生成完整 rows）：\n{\n  "schemaVersion": "storyboard-script.v1",\n  "type": "storyboard-script",\n  "sourceMode": "image",\n  "title": "根据内容生成的短标题",\n  "detectedIntent": {\n    "shotCount": 1,\n    "totalDurationSeconds": 1,\n    "aspectRatio": "9:16",\n    "style": "电影感",\n    "language": "zh-CN"\n  },\n  "rows": [\n    {\n      "镜号": "1",\n      "时长": "1.0s",\n      "景别": "",\n      "场景": "",\n      "画面描述": "",\n      "角色": "",\n      "角色描述": "",\n      "角色动作": "",\n      "情绪": "",\n      "角色图": "@图片1",\n      "参考": "@图片1",\n      "图片提示词": "",\n      "视频提示词": "",\n      "对白": "",\n      "音效": ""\n    }\n  ]\n}';
export const STORYBOARD_SCRIPT_IMAGE_USER_PROMPT_TEMPLATE =
  '请根据下面的用户输入和参考图片生成分镜脚本 JSON。\n参考图片：\n{参考图片 || @图片1}\n\n用户输入：\n{用户输入 || 请根据参考图片生成短视频分镜脚本}';
export const STORYBOARD_SCRIPT_IMAGE_PROMPT_TEMPLATE =
  STORYBOARD_SCRIPT_IMAGE_SYSTEM_PROMPT + '\n\n' + STORYBOARD_SCRIPT_IMAGE_USER_PROMPT_TEMPLATE;
export const STORYBOARD_SCRIPT_VIDEO_SYSTEM_PROMPT =
  '你是一个影视广告分镜脚本结构化生成器。用户会自由输入剧情、文案、广告创意、短剧片段或零散要求，并可能提供一个或多个参考视频。用户不需要按固定格式填写。你必须综合文本和视频，自行识别：视频中的镜头边界、场景变化、动作节奏、运镜、主体、产品/人物/场景、情绪、风格、镜头数量、总时长、平台比例、台词、音效和画面节奏。\n\n核心任务：\n1. 只处理视频+可选文本输入。系统会先把视频用本地 ffmpeg 预处理成分段代表帧，这些帧会以 @图片1、@图片2 的顺序出现；原始视频仍会以 @视频1、@视频2 的顺序出现在文字说明里。\n2. 必须优先根据“视频切片参考”里的 @图片N 和对应 @视频N 时间段生成分镜，不要把单个抽帧误当作完整镜头，也不要忽略相邻切片之间的连续关系。\n3. 如果用户明确写了“N段 / N个镜头 / N cuts / N shots / 分成N段 / N个分镜 / 自动裁剪N段”，rows 数量必须严格等于该数字，但最多不超过 100 个镜头；如果用户指定超过 100 个镜头，必须合并为最关键的 100 个镜头。\n4. 如果用户没有明确指定镜头数量，必须根据视频切片参考、主体动作变化、场景变化、节奏段落和文本意图自行判断 rows 数量，不要固定为上限 100 个镜头，且最多不超过 100 个镜头。\n' +
  STORYBOARD_SCRIPT_DIRECTOR_SPLIT_RULE +
  '\n5. 对视频拆分时，一行对应一个语义镜头或可执行剪辑段，不要逐帧罗列；如果切片没有明显剪切，可按动作阶段、运镜阶段、情绪节奏或叙事节点拆分。\n6. “参考”字段必须优先填写对应的 @图片N；如果该帧带有视频时间段，则写成“@图片N / @视频1 00:01.2-00:03.0”。不要填写图片 URL 或视频 URL。\n7. “角色图”字段在纯视频输入模式必须填空字符串；视频代表帧统一放在“参考”字段，供界面渲染缩略图和后续追溯参考素材。\n8. 用户输入是广告文案时，按“吸引注意 -> 展示痛点/产品 -> 关键卖点 -> 情绪或反转 -> 收束行动”拆分。\n9. 用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\n10. 每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\n' +
  STORYBOARD_SCRIPT_STATIC_IMAGE_PROMPT_RULE +
  '\n11. “图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、代表性关键帧、场景、情绪、动作、表情、行为、服装道具、光影色彩、质感、氛围、风格和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，并尽量继承参考视频的运动逻辑，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节；例如同样是走路，要区分轻快小步、沉稳慢步、疲惫拖步、紧张快走等不同身体节奏。\n' +
  STORYBOARD_SCRIPT_CONCRETE_VIDEO_PROMPT_RULE +
  '\n12. 多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\n13. “对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“气息很轻的耳语感，语速缓慢，带着疲惫后的释然，句中有短暂停顿：“终于……结束了。””；不要只写裸台词。\n14. 没有对应内容的字段填空字符串，不要填 null，不要省略字段。\n\n输出要求：\n- 只输出合法 JSON。\n- 不要输出 Markdown，不要包裹代码块，不要解释。\n- 顶层对象必须包含 schemaVersion、type、sourceMode、title、detectedIntent、rows。\n- schemaVersion 必须是 "storyboard-script.v1"。\n- type 必须是 "storyboard-script"。\n- sourceMode 必须是 "video"。\n- detectedIntent.shotCount 必须等于 rows.length。\n- 视频输入模式下 rows[].参考 必须引用 @图片N；如果有时间段，同时附带 @视频N 时间段。不要把 @视频N 或 @图片N 写入“角色图”。\n- rows 中每个对象必须包含这些中文字段，且按这个顺序输出：\n  镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\n\nJSON 结构示例如下（只展示 1 行字段结构；正式输出要按用户内容和参考视频生成完整 rows）：\n{\n  "schemaVersion": "storyboard-script.v1",\n  "type": "storyboard-script",\n  "sourceMode": "video",\n  "title": "根据内容生成的短标题",\n  "detectedIntent": {\n    "shotCount": 1,\n    "totalDurationSeconds": 1,\n    "aspectRatio": "9:16",\n    "style": "电影感",\n    "language": "zh-CN"\n  },\n  "rows": [\n    {\n      "镜号": "1",\n      "时长": "1.0s",\n      "景别": "",\n      "场景": "",\n      "画面描述": "",\n      "角色": "",\n      "角色描述": "",\n      "角色动作": "",\n      "情绪": "",\n      "角色图": "",\n      "参考": "@图片1 / @视频1 00:00.0-00:01.0",\n      "图片提示词": "",\n      "视频提示词": "",\n      "对白": "",\n      "音效": ""\n    }\n  ]\n}';
export const STORYBOARD_SCRIPT_VIDEO_USER_PROMPT_TEMPLATE =
  '请根据下面的用户输入和参考视频生成分镜脚本 JSON。\n视频切片参考：\n{视频切片参考 || 无；请直接根据参考视频理解时间线}\n\n参考视频：\n{参考视频 || @视频1}\n\n用户输入：\n{用户输入 || 请根据参考视频自动拆分镜头并生成短视频分镜脚本}';
export const STORYBOARD_SCRIPT_VIDEO_PROMPT_TEMPLATE =
  STORYBOARD_SCRIPT_VIDEO_SYSTEM_PROMPT + '\n\n' + STORYBOARD_SCRIPT_VIDEO_USER_PROMPT_TEMPLATE;
export const STORYBOARD_SCRIPT_MULTIMODAL_PROMPT_TEMPLATE =
  '你是一个影视广告分镜脚本结构化生成器。用户可能同时提供文本、图片参考和视频参考。你必须综合这些输入，自行识别：故事主题、产品/人物/场景、情绪、风格、镜头数量、总时长、平台比例、台词、音效和画面节奏。\n\n核心任务：\n1. 同时理解文本、图片和视频参考；图片可作为角色、产品、场景、风格或构图参考，视频可作为动作、运镜、节奏、场景连续性参考。\n2. 如果用户明确写了“N段 / N个镜头 / N cuts / N shots / 分成N段 / N个分镜”，rows 数量必须严格等于该数字，但最多不超过 100 个镜头；如果用户指定超过 100 个镜头，必须合并为最关键的 100 个镜头。\n3. 如果用户明确写了总时长，按镜头节奏合理分配每条“时长”；如果没有总时长，必须根据参考素材的真实镜头切换、动作阶段、内容密度和剧情节奏自行判断 rows 数量，不要固定为上限 100 个镜头，且最多不超过 100 个镜头。\n' +
  STORYBOARD_SCRIPT_DIRECTOR_SPLIT_RULE +
  '\n4. 用户输入是广告文案时，按“吸引注意 -> 展示痛点/产品 -> 关键卖点 -> 情绪或反转 -> 收束行动”拆分。\n5. 用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\n6. 每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\n7. 图片参考可写入“角色图”或“参考”字段，格式为 @图片N；视频参考写入“参考”字段，格式为 @视频N 或 @视频N 时间段；不要填写图片或视频 URL。\n' +
  STORYBOARD_SCRIPT_STATIC_IMAGE_PROMPT_RULE +
  '\n8. “图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、参考图外观/材质/风格、场景、情绪、动作、表情、行为、服装道具、光影色彩、质感、氛围、风格和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节。\n' +
  STORYBOARD_SCRIPT_CONCRETE_VIDEO_PROMPT_RULE +
  '\n9. 多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\n10. “对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“温柔偏低的声线，语速平稳，底色带安抚，咬字轻但清晰：“你先听我说。””；不要只写裸台词。\n11. 没有对应内容的字段填空字符串，不要填 null，不要省略字段。\n\n输出要求：\n- 只输出合法 JSON。\n- 不要输出 Markdown，不要包裹代码块，不要解释。\n- 顶层对象必须包含 schemaVersion、type、sourceMode、title、detectedIntent、rows。\n- schemaVersion 必须是 "storyboard-script.v1"。\n- type 必须是 "storyboard-script"。\n- sourceMode 必须是 "multimodal"。\n- rows 中每个对象必须包含这些中文字段，且按这个顺序输出：\n  镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\n\nJSON 结构如下：\n{\n  "schemaVersion": "storyboard-script.v1",\n  "type": "storyboard-script",\n  "sourceMode": "multimodal",\n  "title": "根据内容生成的短标题",\n  "detectedIntent": {\n    "shotCount": 1,\n    "totalDurationSeconds": 1,\n    "aspectRatio": "9:16",\n    "style": "电影感",\n    "language": "zh-CN"\n  },\n  "rows": [\n    {\n      "镜号": "1",\n      "时长": "1.0s",\n      "景别": "",\n      "场景": "",\n      "画面描述": "",\n      "角色": "",\n      "角色描述": "",\n      "角色动作": "",\n      "情绪": "",\n      "角色图": "",\n      "参考": "",\n      "图片提示词": "",\n      "视频提示词": "",\n      "对白": "",\n      "音效": ""\n    }\n  ]\n}\n\n用户输入：\n{用户输入 || 请根据参考素材生成短视频分镜脚本}';
export function buildStoryboardScriptTextOnlyPrompt(value) {
  const item = String(value || '').trim();
  return STORYBOARD_SCRIPT_TEXT_ONLY_USER_PROMPT_TEMPLATE.replace(
    /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (key, index) => item || index || '',
  );
}
export function buildStoryboardScriptTextOnlySystemPrompt() {
  return STORYBOARD_SCRIPT_TEXT_ONLY_SYSTEM_PROMPT;
}
function normalizePositiveInteger(result) {
  const count = Number(result);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}
export function extractRequestedStoryboardShotCount(
  data,
  { max: max = STORYBOARD_SCRIPT_MAX_SHOT_COUNT } = {},
) {
  const enabled = String(data || '');
  if (!enabled.trim()) return 0;
  const positiveInteger = normalizePositiveInteger(max) || STORYBOARD_SCRIPT_MAX_SHOT_COUNT,
    options = [
      /(\d{1,3})\s*(?:段|个镜头|个分镜|镜头|分镜)/gi,
      /(?:分成|拆成|裁剪成|自动裁剪|生成|输出|出)\s*(\d{1,3})\s*(?:段|个|镜头|分镜)?/gi,
      /(\d{1,3})\s*(?:cuts?|shots?)/gi,
    ];
  for (const target of options) {
    target.lastIndex = 0;
    const source = target.exec(enabled),
      positiveInteger2 = normalizePositiveInteger(source?.[1]);
    if (positiveInteger2 > 0) return Math.min(positiveInteger2, positiveInteger);
  }
  return 0;
}
function getImageReferenceLabels(options2 = {}) {
  if (Array.isArray(options2.imageLabels) && options2.imageLabels.length > 0)
    return options2.imageLabels.map((item2) => String(item2 || '').trim()).filter(Boolean);
  const length = normalizePositiveInteger(options2.imageCount);
  return Array.from({ length: length }, (next, current) => '@图片' + (current + 1));
}
function buildImageReferenceText(options3 = {}) {
  const list = getImageReferenceLabels(options3);
  return list.length > 0 ? list.join('、') : '@图片1';
}
function getVideoReferenceLabels(options4 = {}) {
  if (Array.isArray(options4.videoLabels) && options4.videoLabels.length > 0)
    return options4.videoLabels.map((item3) => String(item3 || '').trim()).filter(Boolean);
  const length2 = normalizePositiveInteger(options4.videoCount);
  return Array.from({ length: length2 }, (entry, record) => '@视频' + (record + 1));
}
function buildVideoReferenceText(options5 = {}) {
  const list2 = getVideoReferenceLabels(options5);
  return list2.length > 0 ? list2.join('、') : '@视频1';
}
export function buildStoryboardScriptImagePrompt(payload, handle = {}) {
  const state = String(payload || '').trim(),
    imageReferenceText = buildImageReferenceText(handle);
  return STORYBOARD_SCRIPT_IMAGE_USER_PROMPT_TEMPLATE.replace(
    /\{\{?\s*参考图片(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (config, scope) => imageReferenceText || scope || '',
  ).replace(/\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g, (input, output) => state || output || '');
}
export function buildStoryboardScriptImageSystemPrompt() {
  return STORYBOARD_SCRIPT_IMAGE_SYSTEM_PROMPT;
}
export function buildStoryboardScriptVideoPrompt(value2, value3 = {}) {
  const value4 = String(value2 || '').trim(),
    videoReferenceText = buildVideoReferenceText(value3),
    value5 = String(value3.videoFrameSummary || '').trim();
  return STORYBOARD_SCRIPT_VIDEO_USER_PROMPT_TEMPLATE.replace(
    /\{\{?\s*视频切片参考(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (value6, value7) => value5 || value7 || '',
  )
    .replace(
      /\{\{?\s*参考视频(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
      (value8, value9) => videoReferenceText || value9 || '',
    )
    .replace(
      /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
      (value10, value11) => value4 || value11 || '',
    );
}
export function buildStoryboardScriptVideoSystemPrompt() {
  return STORYBOARD_SCRIPT_VIDEO_SYSTEM_PROMPT;
}
function hasMultimodalInputs(options6 = {}) {
  return (
    Number(options6.imageCount || 0) > 0 ||
    Number(options6.videoCount || 0) > 0 ||
    String(options6.summary || '').trim()
  );
}
export function buildStoryboardScriptPrompt(value12, value13 = {}) {
  const value14 = String(value12 || '').trim(),
    value15 = String(value13.summary || '').trim(),
    positiveInteger3 = normalizePositiveInteger(value13.imageCount),
    positiveInteger4 = normalizePositiveInteger(value13.videoCount),
    value16 = [value15, value14].filter(Boolean).join('\n\n');
  if (!hasMultimodalInputs(value13)) return buildStoryboardScriptTextOnlyPrompt(value16);
  if (positiveInteger3 > 0 && positiveInteger4 === 0)
    return buildStoryboardScriptImagePrompt(value16, value13);
  if (positiveInteger4 > 0 && positiveInteger3 === 0)
    return buildStoryboardScriptVideoPrompt(value16, value13);
  return STORYBOARD_SCRIPT_MULTIMODAL_PROMPT_TEMPLATE.replace(
    /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (value17, value18) => value16 || value18 || '',
  );
}
const STORYBOARD_SCRIPT_SOURCE_MODES = new Set(['text', 'image', 'video', 'multimodal']);
function normalizeStoryboardScriptSourceMode(value19) {
  const value20 = String(value19 || '').trim();
  return STORYBOARD_SCRIPT_SOURCE_MODES.has(value20) ? value20 : 'text';
}
const COLUMN_ALIASES = Object.freeze({
  镜号: ['shotNumber', 'shot_number', 'shotNo', 'shotId', 'cut', 'cutNumber'],
  时长: [
    'duration',
    'durationText',
    'durationSeconds',
    'duration_seconds',
    'duration_sec',
    'seconds',
    'time',
    'length',
  ],
  画面描述: [
    'plotDescription',
    'visualDescription',
    'imageDescription',
    'sceneDescription',
    'shotDescription',
    'storyboardDescription',
    'frameDescription',
    'screenDescription',
    'description',
    'content',
    '画面',
    '画面内容',
  ],
  角色: ['character', 'characters', 'characterName', 'role', 'subject', '人物', '主角'],
  角色描述: [
    'characterDescription',
    'characterProfile',
    'characterAppearance',
    'roleDescription',
    'roleProfile',
    'subjectDescription',
    'appearance',
    '人物描述',
    '角色设定',
  ],
  角色图: [
    'characterImage',
    'characterImages',
    'characterImageUrl',
    'characterImageUrls',
    'character_image',
    'roleImage',
    'roleImageUrl',
  ],
  参考: [
    'reference',
    'referenceImage',
    'referenceImages',
    'referenceImageUrl',
    'referenceFrame',
    'referenceFrameImage',
    'referenceVideo',
    'referenceVideoUrl',
    'sourceVideo',
    'sourceVideoUrl',
    'videoReference',
    'referenceUrl',
    'ref',
    'refImage',
    'refVideo',
    '参考图',
    '参考视频',
  ],
  景别: ['shotSize', 'shotScale', 'shotType', 'framing', 'cameraShot', 'viewSize', '镜头景别'],
  场景: ['sceneTags', 'scene', 'setting', 'environment', 'location', 'locationTags', 'tags', '场景标签'],
  角色动作: [
    'characterAction',
    'action',
    'actionDescription',
    'bodyAction',
    'performance',
    'movement',
    '动作',
  ],
  情绪: ['emotion', 'emotionState', 'mood', 'tone', 'feeling', '情感'],
  音效: [
    'audioEffects',
    'soundEffects',
    'soundDesign',
    'ambientSound',
    'sound',
    'sfx',
    'bgm',
    'music',
    '声音',
  ],
  对白: [
    'dialogue',
    'dialog',
    'line',
    'voiceover',
    'voiceOver',
    'narration',
    'subtitle',
    'copy',
    '台词',
    '旁白',
  ],
  图片提示词: [
    'imageGenerationPrompt',
    'imagePrompt',
    'image_prompt',
    'imagePromptCn',
    'stillPrompt',
    'framePrompt',
    'visualPrompt',
    'composition',
    'lighting',
    'lightingAndAtmosphere',
    'artDirection',
    'stylePrompt',
    'prompt',
  ],
  视频提示词: [
    'videoMotionPrompt',
    'videoPrompt',
    'video_prompt',
    'motionPrompt',
    'cameraMovement',
    'cameraMove',
    'cameraMotion',
    'camera',
    'lensMovement',
    'movementDescription',
    'actionPrompt',
    'videoAction',
    'animationPrompt',
    'dynamicPrompt',
  ],
});
function extractJsonCandidate(value21) {
  const list3 = String(value21 || '').trim();
  if (!list3) return '';
  const value22 = list3.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (value22?.[1]) return value22[1].trim();
  if (list3.startsWith('{') || list3.startsWith('[')) return list3;
  const count2 = list3.indexOf('{'),
    value23 = list3.lastIndexOf('}');
  if (count2 >= 0 && value23 > count2) return list3.slice(count2, value23 + 1).trim();
  const count3 = list3.indexOf('['),
    value24 = list3.lastIndexOf(']');
  if (count3 >= 0 && value24 > count3) return list3.slice(count3, value24 + 1).trim();
  return '';
}
function parseJsonInput(value25) {
  if (value25 && typeof value25 === 'object') return value25;
  const extractJsonCandidate2 = extractJsonCandidate(value25);
  if (!extractJsonCandidate2) return null;
  try {
    return JSON.parse(extractJsonCandidate2);
  } catch {
    return null;
  }
}
function isPlainObject(value26) {
  return value26 && typeof value26 === 'object' && !Array.isArray(value26);
}
function pickRows(value27) {
  if (Array.isArray(value27)) return value27;
  if (!isPlainObject(value27)) return [];
  if (Array.isArray(value27.rows)) return value27.rows;
  if (Array.isArray(value27.shots)) return value27.shots;
  if (Array.isArray(value27.scenes)) return value27.scenes;
  if (Array.isArray(value27.items)) return value27.items;
  return [];
}
function toCellString(list4, value28 = '') {
  if (list4 == null) return '';
  if (Array.isArray(list4))
    return list4
      .map((item4) => toCellString(item4, value28))
      .filter(Boolean)
      .join('，');
  if (typeof list4 === 'number') return value28 === '时长' ? list4 + 's' : String(list4);
  if (typeof list4 === 'boolean') return list4 ? '是' : '否';
  if (typeof list4 === 'object') {
    const value29 =
      list4.url || list4.imageUrl || list4.reference_frame_image || list4.referenceFrameImage || '';
    if ((value28 === '参考' || value28 === '角色图') && value29) return String(value29).trim();
    try {
      return JSON.stringify(list4);
    } catch {
      return String(list4);
    }
  }
  return String(list4).trim();
}
function pickColumnValue(value30, value31) {
  if (Object.hasOwn(value30, value31)) return value30[value31];
  const value32 = COLUMN_ALIASES[value31] || [];
  for (const value33 of value32) {
    if (Object.hasOwn(value30, value33)) return value30[value33];
  }
  return '';
}
function normalizeStoryboardRow(value34, value35) {
  const enabled2 = {};
  for (const event of STORYBOARD_SCRIPT_COLUMNS) {
    enabled2[event.key] = toCellString(pickColumnValue(value34, event.key), event.key);
  }
  if (!enabled2['镜号']) enabled2['镜号'] = String(value35 + 1);
  return enabled2;
}
const STORYBOARD_IMAGE_PLACEHOLDER_PATTERN = /@图片\d+/g,
  STORYBOARD_VIDEO_PLACEHOLDER_PATTERN = /@视频\d+/g;
function extractStoryboardImagePlaceholders(value36) {
  return String(value36 || '').match(STORYBOARD_IMAGE_PLACEHOLDER_PATTERN) || [];
}
function extractStoryboardVideoPlaceholders(value37) {
  return String(value37 || '').match(STORYBOARD_VIDEO_PLACEHOLDER_PATTERN) || [];
}
function normalizeStoryboardRowForSourceMode(args, value38) {
  const value39 = { ...args };
  if (value38 === 'image' || value38 === 'multimodal') {
    const list5 = extractStoryboardImagePlaceholders(value39['角色图']),
      list6 = extractStoryboardImagePlaceholders(value39['参考']);
    list5.length === 0 && list6.length > 0 && (value39['角色图'] = list6.join('、'));
  }
  if (value38 === 'video' || value38 === 'multimodal') {
    const list7 = extractStoryboardImagePlaceholders(value39['角色图']),
      list8 = extractStoryboardImagePlaceholders(value39['参考']);
    if (value38 === 'video' && list8.length === 0 && list7.length > 0) {
      const value40 = String(value39['参考'] || '').trim();
      value39['参考'] = value40 ? list7.join('、') + ' / ' + value40 : list7.join('、');
    }
    const list9 = extractStoryboardVideoPlaceholders(value39['角色图']),
      list10 = extractStoryboardVideoPlaceholders(value39['参考']);
    list10.length === 0 && list9.length > 0 && (value39['参考'] = list9.join('、'));
  }
  return (value38 === 'video' && (value39['角色图'] = ''), value39);
}
function hasStoryboardMarker(value41) {
  if (!isPlainObject(value41)) return false;
  return (
    String(value41.schemaVersion || '').trim() === STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION ||
    String(value41.type || '').trim() === STORYBOARD_SCRIPT_NODE_TYPE
  );
}
function normalizeDetectedIntent(args2, list11) {
  const isPlainObject2 = isPlainObject(args2) ? { ...args2 } : {},
    count4 = Number(isPlainObject2.shotCount);
  isPlainObject2.shotCount = Number.isFinite(count4) && count4 > 0 ? Math.trunc(count4) : list11.length;
  if (!isPlainObject2.language) isPlainObject2.language = 'zh-CN';
  return isPlainObject2;
}
export function normalizeStoryboardScriptGenerationResult(
  value42,
  { requireMarker: requireMarker = true, sourceMode: sourceMode = '' } = {},
) {
  const jsonInput = parseJsonInput(value42);
  if (!jsonInput) return { ok: false, error: 'NO_VALID_JSON' };
  if (requireMarker && !hasStoryboardMarker(jsonInput))
    return { ok: false, error: 'NOT_STORYBOARD_SCRIPT_JSON' };
  const sourceMode2 = normalizeStoryboardScriptSourceMode(sourceMode || jsonInput.sourceMode),
    list12 = pickRows(jsonInput).filter(isPlainObject),
    rows = list12
      .map(normalizeStoryboardRow)
      .map((item5) => normalizeStoryboardRowForSourceMode(item5, sourceMode2));
  if (rows.length === 0) return { ok: false, error: 'NO_ROWS' };
  const detectedIntent = normalizeDetectedIntent(jsonInput.detectedIntent, rows),
    title = String(jsonInput.title || '分镜脚本').trim() || '分镜脚本',
    warnings = [];
  Number.isFinite(Number(detectedIntent.shotCount)) &&
    Number(detectedIntent.shotCount) !== rows.length &&
    warnings.push('SHOT_COUNT_MISMATCH');
  const sourceMode3 = {
    schemaVersion: STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
    type: STORYBOARD_SCRIPT_NODE_TYPE,
    sourceMode: sourceMode2,
    title: title,
    detectedIntent: detectedIntent,
    rows: rows,
  };
  return {
    ok: true,
    title: title,
    sourceMode: sourceMode3.sourceMode,
    rows: rows,
    detectedIntent: detectedIntent,
    warnings: warnings,
    rawJson: JSON.stringify(sourceMode3, null, 2),
  };
}
