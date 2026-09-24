import {
  deletePromptPresetFromServer,
  fetchPromptPresetSettingsFromServer,
  fetchPromptPresetsFromServer,
  savePromptPresetSettingsToServer,
  savePromptPresetToServer,
} from '../../api/promptPresetsApi.js';
import {
  PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT,
  PROMPT_PRESET_TEMPLATE_TYPE_STATIC,
  PROMPT_PRESET_USER_INPUT_PLACEHOLDER,
} from './promptPresetTemplate.js';
import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { isSubscriptionActive } from './subscriptionAccess.js';
import { openSettingsPanel } from './settings/panelSettings.js';
function promptPresetsText(_0x29c539, _0x43b6fe = {}) {
  return t('promptPresets.' + _0x29c539, _0x43b6fe);
}
function optionalPromptPresetsText(_0x5b61ef, _0x47273e = {}) {
  const _0xc82f10 = 'promptPresets.' + _0x5b61ef,
    _0x20fb4c = t(_0xc82f10, _0x47273e);
  return _0x20fb4c === _0xc82f10 ? '' : _0x20fb4c;
}
export const PROMPT_PRESET_TRIGGER_MODE_DIRECT = 'direct';
export const PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT = 'insertPrompt';
const PROMPT_PRESET_TRIGGER_MODES = new Set([
  PROMPT_PRESET_TRIGGER_MODE_DIRECT,
  PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
]);
export const REVERSE_IMAGE_PROMPT_PRESET_TITLE = '反推图片提示词';
export const REVERSE_IMAGE_PROMPT_PRESET_PROMPT =
  '你是一名专业 AI 图像提示词反推工程师。\n\n我将上传一张图片，请你根据图片内容，反推出一段可以用于 AI 生图模型生成同款图片的提示词。\n\n要求：\n1. 不要只是普通描述图片，而是要写成“可直接用于 AI 生图”的提示词。\n2. 请完整分析画面中的：主体、人物数量、性别年龄、外貌特征、服装、发型、动作、姿态、表情、视线方向、手部动作。\n3. 请分析景别与构图：特写/近景/中景/全身/远景，正面/侧面/背影，俯拍/仰拍/平视，人物在画面中的位置，背景虚化程度。\n4. 请分析环境：室内/室外、地点、时间、天气、背景元素、前景/中景/远景。\n5. 请分析光线：自然光/棚拍光/逆光/侧光/柔光/硬光、光源方向、阴影、高光。\n6. 请分析色彩与氛围：主色调、冷暖、饱和度、对比度、情绪氛围。\n7. 请分析风格：真实摄影、电影感、杂志大片、日系写真、商业广告、动漫、3D、油画等。\n8. 请分析镜头语言：镜头焦段、景深、画质、胶片感、颗粒感、清晰度。\n9. 如果图片中有无法确定的信息，请根据画面合理推断，但不要编造明显不存在的元素。\n10. 最终请输出一段完整的中文提示词、一段英文提示词，以及一段反向提示词。\n\n\n输出格式如下：\n\n【画面拆解】\n主体：\n景别与构图：\n人物动作：\n表情与视线：\n服装与造型：\n场景环境：\n光线：\n色彩氛围：\n风格：\n镜头与画质：\n\n【中文完整提示词】\n把上面的信息整合成一段流畅、专业、可直接用于 AI 生图的中文提示词。\n\n【English Prompt】\nTranslate and optimize the prompt into natural English for AI image generation.\n\n【反向提示词】\n输出用于避免低质量、畸变、错误细节、文字水印等问题的中文反向提示词。';
const TEMPLATES = {
    SceneReference:
      '{用户输入}, 生成一张四宫格场景图（没有人物）包含（顶视图 (Plan View)，轴测图/45° 俯视图 (Axonometric View)，2个多个正交立面图 (Elevations)）',
    SceneGrid9:
      '用户描述：{用户输入 || 参考图中的场景}\n请基于以上用户描述，生成一张3x3九宫格多视角场景设定图。九个格子必须是同一个场景的不同视角，不是九个不同场景。保持相同空间、相同主体物、相同陈设、相同材质和相同灯光风格。可以合理补充环境细节、材质质感、光影氛围和空间层次，但不要改变用户描述的核心内容。九个视角依次为：正面大全景、入口远景、主体中景、主体特写、左45度斜侧、右45度斜侧、低机位仰视、高位俯视、主体后方反打视角。请在宫格图上为每个视角添加对应中文标注。3x3 grid layout, multi-view environment concept art, same scene, consistent layout, consistent objects, cinematic composition, realistic, highly detailed, no characters, view labels only, no extra text, no watermark, clean thin borders between panels.',
    Panorama360Seamless: {
      type: PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT,
      imageInputTemplate:
        '360-degree equirectangular panorama, spherical panorama for VR viewing, seamless 360° wrap-around environment 参考图片场景生成{用户输入}',
      textInputTemplate:
        '360-degree equirectangular panorama, spherical panorama for VR viewing, seamless 360° wrap-around environment 场景为：{用户输入}',
      emptyInputMessage: '请输入场景或添加参考图片',
    },
    characterRef3View: '生成全身三视图，右边放正视图，45度的侧视图，后视图，{用户输入 || 灰色背景}',
    characterRef3ViewFace:
      '生成全身三视图以及一张脸部特写（最左边占满三分之一的位置是上半身特写），右边三分之二放正视图，45度的侧视图，后视图，{用户输入 || 灰色背景}',
    characterRefAnalysis:
      '生成人设解析图，包含正视图、侧视图、背视图，以及服装细节拆解、面部特征特写，排版紧凑，{用户输入 || 灰色背景}',
    multiGrid4:
      '生成一张无缝的四宫格（2x2）的连贯剧情分镜图。要求：同一角色的外观、服饰、发型保持一致；场景与光影风格统一；镜头从左上到右下依次推进；每一格都有明确动作与主体，构图干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}',
    multiGrid9:
      '生成一张无缝的九宫格（3x3）的连贯剧情分镜图。要求：角色一致性极强（外观、服饰、配色不变）；同一场景基调延续；每格推进一个小动作或情绪变化；分镜顺序从左上到右下；画面干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}',
    multiGrid16:
      '生成一张无缝的十六宫格（4x4）的连贯剧情分镜图。要求：角色与关键道具保持完全一致；每一个分镜都必须是下一个分镜的时间上或因果上的延续，不能跳跃，每格节奏更细（动作拆分、表情递进、镜头切换合理）；整体风格统一；分镜顺序从左上到右下；画面干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}',
    multiGrid25:
      '生成一张无缝的二十五宫格（5x5）的连贯剧情分镜图。要求：连续叙事、强一致性（角色/服饰/配色/画风固定）；每一个分镜都必须是下一个分镜的时间上或因果上的延续，不能跳跃；镜头语言清晰；分镜顺序从左上到右下；画面干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}',
    storyboardVertical:
      '请根据我后面提供的【用户输入】，生成一张“专业影视分镜设定板 / Storyboard Board”。\n\n要求：\n1. 输出的是一整张竖版分镜板，不是单张插画，不是漫画页，不是海报。\n2. 整体风格为：黑灰底、细线分栏、专业影视项目提案风格。\n3. 参考图规则：如果用户输入中写了“某角色参考@图片1 / 场景参考@图片2”，则必须严格参考对应图片，保持角色外观、服装、发型、年龄气质、场景结构、时代背景、光影氛围的一致性。\n4. 整张图固定分为三部分：\n   - 顶部标题区：标题、总时长、风格关键词\n   - 中部 Storyboard 区：按用户输入中的时间段拆成 4-6 个 CUT，每行分为左中右三栏：\n     左栏：CUT编号 + 时间段\n     中栏：该镜头对应的电影感画面\n     右栏：主体 / 动作 / 描述 / 镜头 / 台词 / 音效\n5. 分镜画面必须叙事连贯、角色一致、场景一致、服装一致、光影一致。\n6. 所有中间画面都要像电影剧照，镜头语言明确，严格体现用户输入中的动作、表情、氛围和情绪推进。\n7. 右侧说明栏必须用简洁专业的中文排版，字段固定为：\n   主体：\n   动作：\n   描述：\n   镜头：\n   台词：\n   音效：\n8. 文字尽量清晰可读，不要乱码，排版整洁克制，高级感强。\n9. 最终输出只生成一张完整的、专业的、电影级影视分镜设定板。\n\n# 【用户输入】\n{用户输入 || 一段简短剧情}',
    storyboardVerticalScene:
      '请根据我后面提供的【用户输入】，生成一张“专业影视分镜设定板 / Storyboard Board”。\n\n要求：\n1. 输出的是一整张竖版分镜板，不是单张插画，不是漫画页，不是海报。\n2. 整体风格为：黑灰底、细线分栏、专业影视项目提案风格。\n3. 参考图规则：如果用户输入中写了“某角色参考@图片1 / 场景参考@图片2”，则必须严格参考对应图片，保持角色外观、服装、发型、年龄气质、场景结构、时代背景、光影氛围的一致性。\n4. 整张图固定分为三部分：\n   - 顶部标题区：标题、总时长、风格关键词\n   - 中部 Storyboard 区：按用户输入中的时间段拆成 4-6 个 CUT，每行分为左中右三栏：\n     左栏：CUT编号 + 时间段\n     中栏：该镜头对应的电影感画面\n     右栏：主体 / 动作 / 描述 / 镜头 / 台词 / 音效\n   - 底部补充区：场景图 Secondary（2张小图）+ 光影与氛围 Lighting & Mood（1张小图）+ 色彩板与风格说明（5-6个色块）\n5. 分镜画面必须叙事连贯、角色一致、场景一致、服装一致、光影一致。\n6. 所有中间画面都要像电影剧照，镜头语言明确，严格体现用户输入中的动作、表情、氛围和情绪推进。\n7. 右侧说明栏必须用简洁专业的中文排版，字段固定为：\n   主体：\n   动作：\n   描述：\n   镜头：\n   台词：\n   音效：\n8. 文字尽量清晰可读，不要乱码，排版整洁克制，高级感强。\n9. 最终输出只生成一张完整的、专业的、电影级影视分镜设定板。\n\n# 【用户输入】\n{用户输入 || 一段简短剧情}',
    storyboardHorizontal:
      '请根据我后面提供的【用户输入】，生成一张“横版专业影视故事板 / Storyboard Sheet”。  \n要求： \n1. 输出必须是一整张横版16:9故事板表格，不是海报，不是漫画页，不是竖版分镜板。 \n2. 主体必须是“表格结构”，每一行对应一个 CUT。 \n3. 表头固定为： CUT｜秒数｜图片内容｜场景｜主体｜动作｜描述｜镜头｜台词｜音效｜色彩/光影 \n4. 按用户输入中的时间顺序，从上到下排列所有 CUT。 \n5. “图片内容”列中，每个 CUT 必须对应一张横向16:9的电影感分镜画面，真实人物质感，镜头语言明确。 \n6. “场景”列用于写该镜头的环境与空间信息。 \n7. “色彩/光影”列用于写该镜头的色调、光源、冷暖关系与氛围重点。 \n8. 其余列分别填写该镜头的主体、动作、描述、镜头、台词、音效，文字风格必须像正规影视故事板备注，简洁、专业、整齐。 \n9. 如果用户输入中有“角色参考@图片1 / 场景参考@图片2 / 道具参考@图片3”，必须严格参考并保持角色、服装、场景、氛围一致。 \n10. 整体风格为黑灰底、细线分栏、专业影视提案风格。 \n11. 最终只输出一张完整的横版故事板表格图。  \n#【用户输入】\n{用户输入 || 一段简短剧情}',
    storyboardHorizontalScene:
      '请根据我后面提供的【用户输入】，生成一张“横版专业影视故事板 / Storyboard Sheet”。  \n要求： \n1. 输出必须是一整张横版16:9故事板表格，不是海报，不是漫画页，不是竖版分镜板。 \n2. 主体必须是“表格结构”，每一行对应一个 CUT。 \n3. 表头固定为： CUT｜秒数｜图片内容｜场景｜主体｜动作｜描述｜镜头｜台词｜音效｜色彩/光影 \n4. 按用户输入中的时间顺序，从上到下排列所有 CUT。 \n5. “图片内容”列中，每个 CUT 必须对应一张横向16:9的电影感分镜画面，真实人物质感，镜头语言明确。 \n6. “场景”列用于写该镜头的环境与空间信息。 \n7. “色彩/光影”列用于写该镜头的色调、光源、冷暖关系与氛围重点。 \n8. 其余列分别填写该镜头的主体、动作、描述、镜头、台词、音效，文字风格必须像正规影视故事板备注，简洁、专业、整齐。 \n9. 如果用户输入中有“角色参考@图片1 / 场景参考@图片2 / 道具参考@图片3”，必须严格参考并保持角色、服装、场景、氛围一致。 \n10. 整体风格为黑灰底、细线分栏、专业影视提案风格。 \n11. 表格底部增加一条补充信息区，包含：场景总设定、综合色彩色板、整体风格说明。 \n12. 最终只输出一张完整的横版故事板表格图。  \n#【用户输入】\n{用户输入 || 一段简短剧情}',
    longToShort:
      '\n    {用户输入} # 对以上的小说剧情文案进行大幅精简（目标篇幅约为原文的50*-70%）\n完整保留原文对话，同时按照“对白驱动剧情”的结构重新梳理旁白与独白，保留原文段落结构与标点符号。\n用第一人称进行改文\n锁定所有对话： 识别并保护所有直接引语，确保一字不改。\n构建开篇（10%）： 提炼原文关键背景（时代、世界观、人物身份），用简短叙事交代框架。\n精简叙事（20%）： 大幅删减环境描写和过度修饰，仅保留连接对话必要的动作和场景推进。\n筛选独白（30%）： 保留能强化冲突、体现人物压力和真实状态的核心心理描写，删去流水账式的心理活动。\n格式输出： 保持小说文本格式，保留标点符号，保留原段落分行（必要时可合并过碎的描述段落，但不可合并对话段落）。\n# 结构与内容规则\n## 【整体篇幅控制】\n总字数目标： 控制在原文的 50-70% 左右。\n精简策略： 由于对话不能动，主要通过大幅删减“非对话部分的废话”来达成字数减半的目标。\n## 【文本结构比例】\n对白（核心）： 占比最高。严格保持原文，不得增删改一字。\n内心独白（约30%）： 紧贴对话，用于强化情绪、痛感、压迫或绝望。\n叙事（约20%）： 仅作铺垫和连接，禁止写成分镜（如“镜头一转”），禁止扩写。\n背景（约10%）： 开篇必须交代，不可省略。\n##【写作形式与风格】\n输出格式： 纯正的小说文本，保留标点符号，保留段落感。\n风格要求： 对白驱动剧情。通过精简旁白，让对话节奏更紧凑，冲突更集中。\n## 禁止项：\n❌ 禁止出现分镜词（特写、远景、淡入淡出）。\n❌ 禁止出现时间轴（0-5秒）。\n❌ 禁止删除或修改任何一句对话。\n❌ 禁止新增原文没有的情节或设定。\n## 情绪与逻辑\n逻辑： 尽管大幅删减了旁白，必须确保对话与动作的衔接流畅，事件顺序严格遵照原文。\n氛围： 突出原文中的冲突与张力，保留关键的情绪转折点。\n## 输出要求\n直接输出修改后的完整文案。\n保留标点符号和段落格式。',
    extractInfo:
      '{用户输入}\n# 筛选出以上故事里的角色（包括主要怪物）、场景以及道具物品\n把以上每个角色根据剧情写出详细中文提示词包括五官相貌，脸型，发型，全身服饰提示词。重要物品，场景\n用 --- 符号来分割每一个角色,先把人设输出完毕，最后再输出场景，如有角色不同状态也需要标注出来(但不需要太详细)，不用输出多余说明，不带有格式\n# 输出示例：\n\n#人设\n1. 主角：沈仪\n# 中文提示词：\n1个青年男性，古风，捕快，英俊硬朗，剑眉星目，黑色长发，凌乱发髻，身穿古代黑色官差制服，衣衫不整，暗黑武侠，电影光效。\n# 中文提示词(受伤状态)：\n.....\n\n---\n\n2. 配角：刘家丫头\n...\n...\n...\n\n---\n# 重要物品\n1. 腰间佩戴的一把制式长刀（佩刀），刀柄古旧；\n2. 。。。。\n# 场景：\n1. 昏暗的破旧土屋或夜晚的院落，月光惨白，暗黑压抑氛围。\n2. ....\n',
    Storyboard1:
      '## 核心任务\n你是一个专业的AI分镜脚本生成器。任务是基于提供的文本信息，生成“视频提示词”的分镜脚本，分割后的上下分镜必须十分丝滑的连贯。\n\n# 输入信息\n\n**故事情节：**\n{用户输入}\n\n# 视频提示词原则\n\n## 视觉关键词密集度\n\n- 规则：为最大化 AI 模型对画面的控制力，必须使用大量具体的、高辨识度的视觉描述词汇\n- 场景、角色、光影、特效必须混合使用（例如：“幽蓝色的霓虹线路”、“血红色的赛博月亮”、“凌厉的金色电光”、“数码化的爆炸效果”）。\n\n## 运镜的专业化和指令化\n\n- 规则：采用专业电影术语而非简单描述，以明确规定画面的动态行为。\n- 严格使用【超广角】、【特写】等**景别**，以及【慢速推轨】、【环绕慢摇】、【动态手持】等**镜头运动**指令。\n\n## *动作的分解与强调\n\n- 逻辑：复杂的动作不能一笔带过，必须分解成关键帧和关键特写，确保动作的冲击力。\n- 使用【爆发式跃出】（远景）接【腰部极限扭转】（近景），再接【接触的瞬间】（慢动作特写），突出高速和高冲击。\n\n## 人物台词\n- 原文中的对话内容不允许进行擅自删改。要把输入文案作为唯一的信息来源，忠实地将其内容转化为分镜脚本，避免添加任何文案中未提及的情节、动作、场景或角色心理活动。\n- 对话要用“”标示出来。\n\n## 时长与节奏的控制：\n\n- 为每个分镜设定一个合理的时长，以控制最终视频的节奏感。短时间用于高冲击特写，长时间用于场景铺垫或关键动作。\n- 提示词应用的视频时长15秒及以内，剧本包含画面，运镜，所以每一幕的提示词不能超过该时间\n\n## 听觉元素\n\n- 在关键动作后备注音效提示，如“尖锐的破空声与低沉的能量轰鸣”或“无台词，只有金属、能量、符文破碎的声音”。\n\n# 输出格式严格遵循的规则：\n1.  保持连续性：\n    - 为保证场景一致性，若前后剧情为统一场景则需要延续上一则剧本的场景\n\n2.  剧情不能改变：\n    - 保留剧情上的所有对话。 \n\n3.  设定角色、场景映射：\n    - 但凡该幕出场的所有角色都应该有角色映射（[人名]参考@图片参考@音频）\n\n4.  输出格式：\n    - 按顺序输出分镜描述，不需要解释或分析过程。\n    - 输出的内容应当没字体样式。\n\n5. **提示词推理限制：不得出现任何违禁词，违禁词包括词典如下**：\n\n“ 血液相关：血液飞溅、喷血、鲜血淋漓、血池、血祭、断头血、内脏出血、血腥场面、血债、血洗\n暴力场景：分尸、碎尸、斩首、砍头、挖眼、掏心、剥皮、凌迟、虐杀、酷刑、断肢、爆头、穿刺、撕咬\n其他暴力：屠杀、灭门、焚尸、鞭尸、尸横遍野、血肉模糊、骨裂、脑浆、内脏外露、残肢断臂\n裸露低俗类：全裸、半裸、袒胸露背、露脐、露臀、露私密部位、一丝不挂、裸体、赤裸 低俗暗示：性感暴露、挑逗性裸露、低俗姿势、暴露隐私部位、酥胸半露、衣不蔽体\n违规场景：色情暗示、艳情、低俗互动、性挑逗、裸露祭祀\n色情与性暗示类：色情、淫秽、嫖娼、卖淫、性交易、一夜情、通奸、乱伦、恋童、兽交 暗示类：约炮、撩骚、打炮、床上戏、胸器、美腿诱惑、性感撩拨、暧昧低俗、艳舞、脱衣舞 敏感部位描述：乳房、阴部、阴茎、臀部\n其他高危敏感词封建迷信：血腥祭祀、活人献祭、血咒、尸变、僵尸吸血、妖魔鬼怪（恐怖化描述，如 "食人恶鬼"） \n危害公序良俗：自残、自杀、暴力教唆、聚众斗殴、黑帮火拼、恐怖袭击、校园暴力\n敏感宗教 / 政治：邪教仪式、极端宗教、分裂、恐怖组织、反动、颠）”\n\n# 固定的模板格式\n    - 使用 ---  作为每一幕提示词的分隔符。 \n    - 提示词第一部分：最顶部固定是（第X幕）无字幕，无BGM\n    - 第二部分为内容（每一幕都用动作来收尾，为了更好的衔接视频上下文）。\n    - 场景基调要固定好！为了更好的衔接上下镜头（如：秋季，大风，漆黑的夜晚）。\n\n## 输出样例\n第一幕：\n无字幕，无BGM\n沈仪的形象参考@图片1音色参考@音频1，犬妖参考@图片2音色参考@音频2\n夜晚，破旧院落。\n【中景镜头】，沈仪脸上挤出僵硬的笑容，用肩膀撞了一下犬妖的胳膊。\n（人声强颜欢笑） 沈仪说：“老弟的本事你还不清楚，哪里快的起来。走走走，今晚我请酒。”\n沈仪试图推着犬妖往外走，但犬妖纹丝不动。\n犬妖低头俯视沈仪，眼神冰冷漠然。\n犬妖甩开沈仪的手，转身走向院内。沈仪下意识伸手去拦，被犬妖毛茸茸的爪子一把抓住手腕。\n（人声冷漠）犬妖说：“伱当我是蠢猪？”\n【特写镜头】，犬妖猛然贴近沈仪的脸，张开满是尖牙的大嘴，唾液拉丝。\n\n--- \n\n第二幕：\n无字幕，无BGM\n沈仪的形象参考@图片1音色参考@音频1，犬妖参考@图片4音色参考@音频3\n夜晚，破旧院落。\n【特写镜头】，犬妖猛然贴近沈仪的脸，张开满是尖牙的大嘴，唾液拉丝。\n（人声愤怒）犬妖说：“姓沈的，你好像真拿自己当个东西了。里面的动静我听的清清楚楚，你他妈敢反水？！”\n【镜头快速后拉】，犬妖抬起粗壮的大腿猛地蹬向沈仪腹部。\n沈仪面部表情扭曲，整个人如破麻袋般倒飞出去，撞破屋门摔入屋内。\n（人声痛苦）沈仪说：“不是，你属狗的？说翻脸就翻脸？”\n（人声愤怒）犬妖说：“给脸不要脸的东西，合该拿你一起来祭我五脏六腑。”\n沈仪瘫软在地，用力捂住小腹\n',
    Storyboard2:
      '## 核心任务\n你是一个专业的AI分镜脚本生成器。任务是基于提供的文本信息，生成“视频提示词”的分镜脚本，分割后的上下分镜必须十分丝滑的连贯。\n# 输入信息\n\n**故事情节：**\n{用户输入}\n\n# 视频提示词原则\n\n## 视觉关键词密集度\n\n- 规则：为最大化 AI 模型对画面的控制力，必须使用大量具体的、高辨识度的视觉描述词汇\n- 场景、角色、光影、特效必须混合使用（例如：“幽蓝色的霓虹线路”、“血红色的赛博月亮”、“凌厉的金色电光”、“数码化的爆炸效果”）。\n\n## 运镜的专业化和指令化\n\n- 规则：采用专业电影术语而非简单描述，以明确规定画面的动态行为。\n- 严格使用【超广角】、【特写】等**景别**，以及【慢速推轨】、【环绕慢摇】、【动态手持】等**镜头运动**指令。\n\n## *动作的分解与强调\n\n- 逻辑：复杂的动作不能一笔带过，必须分解成关键帧和关键特写，确保动作的冲击力。\n- 使用【爆发式跃出】（远景）接【腰部极限扭转】（近景），再接【接触的瞬间】（慢动作特写），突出高速和高冲击。\n\n## 人物台词\n- 原文中的对话内容不允许进行擅自删改。要把输入文案作为唯一的信息来源，忠实地将其内容转化为分镜脚本，避免添加任何文案中未提及的情节、动作、场景或角色心理活动。\n- 对话要用“”标示出来。\n\n## 时长与节奏的控制：\n\n- 为每个分镜设定一个合理的时长，以控制最终视频的节奏感。短时间用于高冲击特写，长时间用于场景铺垫或关键动作。\n- 提示词应用的视频时长15秒及以内，剧本包含画面，运镜，所以每一幕的提示词不能超过该时间\n\n## 听觉元素\n\n- 在关键动作后备注音效提示，如“尖锐的破空声与低沉的能量轰鸣”或“无台词，只有金属、能量、符文破碎的声音”。\n\n# 输出格式严格遵循的规则：\n1.  保持连续性：\n    - 为保证场景一致性，若前后剧情为统一场景则需要延续上一则剧本的场景\n\n2.  剧情不能改变：\n    - 保留剧情上的所有对话。 \n\n3.  设定角色、场景映射：\n    - 但凡该幕出场的所有角色都应该有角色映射（[人名]参考@图片参考@音频）\n\n4.  输出格式：\n    - 按顺序输出分镜描述，不需要解释或分析过程。\n    - 输出给我的内容应当没字体样式。\n\n5. **提示词推理限制：不得出现任何违禁词，违禁词包括词典如下**：\n\n“ 血液相关：血液飞溅、喷血、鲜血淋漓、血池、血祭、断头血、内脏出血、血腥场面、血债、血洗\n暴力场景：分尸、碎尸、斩首、砍头、挖眼、掏心、剥皮、凌迟、虐杀、酷刑、断肢、爆头、穿刺、撕咬\n其他暴力：屠杀、灭门、焚尸、鞭尸、尸横遍野、血肉模糊、骨裂、脑浆、内脏外露、残肢断臂\n裸露低俗类：全裸、半裸、袒胸露背、露脐、露臀、露私密部位、一丝不挂、裸体、赤裸 低俗暗示：性感暴露、挑逗性裸露、低俗姿势、暴露隐私部位、酥胸半露、衣不蔽体\n违规场景：色情暗示、艳情、低俗互动、性挑逗、裸露祭祀\n色情与性暗示类：色情、淫秽、嫖娼、卖淫、性交易、一夜情、通奸、乱伦、恋童、兽交 暗示类：约炮、撩骚、打炮、床上戏、胸器、美腿诱惑、性感撩拨、暧昧低俗、艳舞、脱衣舞 敏感部位描述：乳房、阴部、阴茎、臀部\n其他高危敏感词封建迷信：血腥祭祀、活人献祭、血咒、尸变、僵尸吸血、妖魔鬼怪（恐怖化描述，如 "食人恶鬼"） \n危害公序良俗：自残、自杀、暴力教唆、聚众斗殴、黑帮火拼、恐怖袭击、校园暴力\n敏感宗教 / 政治：邪教仪式、极端宗教、分裂、恐怖组织、反动、颠）”\n\n# 固定的模板格式\n    - 使用 ---  作为每一幕提示词的分隔符。 \n    - 提示词第一部分：最顶部固定是（第X幕）无字幕，无BGM\n    - 第二部分为内容（可以的话每一幕都用动作来收尾，为了更好的衔接视频上下文）。\n    - 场景基调要固定好！为了更好的衔接上下镜头（如：秋季，大风，漆黑的夜晚）。\n\n# 输出样例\n第1幕\n无字幕，无BGM\n沈仪参考@图片1，刘家丫头参考@图片2\n场景参考@图片4 昏暗潮湿的土屋，夜间，油灯摇曳，阴冷压抑的色调，空气中漂浮尘埃。\n0-1.5s：【特写】沈仪猛然睁眼，满头冷汗，呼吸急促。镜头快速推向其手掌，指缝间沾染暗红印记\n1.5-3s：【主观镜头】沈仪视线。床脚刘家丫头衣衫凌乱、瑟瑟发抖；身侧老头佝偻，手中木棒顶端滴落粘稠暗色液体。\n3-6s：【中景】沈仪按着后脑，神情痛苦狰狞，戾气在眉宇间聚集。\n6-9s：【特写】沈仪咬牙，眼神凶狠，胸膛剧烈起伏。\n（愤怒）沈仪：“嗬哧！……我说……”\n音效：沉重的喘息声，心跳如鼓点，油灯爆裂的滋滋声。\n9-15s：【低角度特写】刘丫头突然扑上前来，双手死死抱住沈仪小腿，神情绝望癫狂。\n（惊恐）刘丫头：“爷！我给您！我什么都给您！您放俺爹回乡下好不好？”\n\n--- \n\n第2幕\n.....\n.....\n.....',
    Seedance2VideoFormat:
      '{用户输入}\n如用户指定秒数就按照用户的来，如没指定就按照15秒来写提示词，不要输出多余内容。严格按照下面格式输出提示词\nx-xs：景别，行为\nx-xs：景别，行为\nx-xs：景别，行为\n示例：0-1s：特写镜头，人物拿起刀.............../',
  },
  STORYBOARD_PROMPT_TEMPLATES = {
    filmStoryboard:
      '做一张 3×4 的电影分镜网格，共 12 格，所有画面都出现同一个角色：一位短发亚洲女性，25岁左右，黑色齐耳短发，五官清冷精致，穿米白色长风衣、白色内搭、浅蓝牛仔裤和黑色短靴，气质独立、安静、有故事感。场景设定为：晴天下午的东京街头，干净街道、便利店、斑马线、路边电线杆、远处城市建筑，光线明亮柔和，有空气感。\n  12 格分别表现不同景别与镜头语言：正面近景、眼神特写、背影中景、侧脸特写、过肩镜头、全身远景、低角度仰拍、街角行走、回头瞬间、手部细节、风吹衣摆、黄昏街头收尾镜头。\n  每一格都要保持角色身份高度一致，包括脸型、发型、服装、气质和色彩设定。画面整体明亮、清晰、有电影感，构图丰富但统一，像专业影视前期分镜稿。风格参考：都市电影前期分镜、日系清新电影感、明亮写实插画。避免角色变脸、服装变化过大、画面过暗、杂乱背景、低质量线稿。',
    advertisingStoryboard:
      '生成一张 16:9 横版高清广告前期制作板，主题为「泰国冰汽水广告故事板」。整体采用深蓝色信息板底色，白色细线分区，画面整洁、商业感强，像专业广告提案板。\n  包含艺术指导、角色与风格参考、环境与场景设计、8 格故事板、灯光情绪、关键词、音频音调、镜头类型等模块。整体是明亮清凉的热带动漫广告风格，画面中冰块、气泡、水花、冷凝水、阳光高光非常明显，色彩清爽，角色一致性高，场景统一，适合品牌广告前期制作展示。',
    gameStoryStoryboard:
      '生成一张「修仙缘起」的 15 秒剧情分镜图，整体风格为黑金复古、东方美学、水墨意境。画面采用专业游戏 CG 动画前期分镜版式，包含 6 个连续分镜。\n  6 个分镜依次表现：灵根觉醒的神秘山门场景、古老测试石碑发出微光、主角缓缓走近并触碰石碑、金色符文从石碑中浮现、天灵根被选中的震撼瞬间、主角手指悬停在发光符文前的特写。\n  要求画面风格统一，角色形象一致，动作连贯，镜头衔接自然，情绪从疑惑、紧张到震撼与觉醒逐步变化。整体具有黑金东方玄幻质感、水墨氛围、电影级光影和游戏剧情宣传片的视觉冲击力。',
    sportsTrainingStoryboard:
      '生成一张 16 步篮球训练动作示意图，采用 4×4 网格布局。主角是一名年轻篮球运动员，穿着 oversized 篮球衫、黑色短裤、连脚袜和高帮运动鞋。每个格子展示一个不同的篮球训练动作，包括原地运球、交叉步运球、胯下运球、背后运球、变向突破、急停跳投、三威胁姿势、防守滑步、转身护球、上篮起步、抛投动作、后撤步投篮、接球投篮、低位脚步、传球姿势、投篮收尾。\n  风格为彩色铅笔画，色调柔和，能看出铅笔纹理。要求动作清晰，身体姿势、篮球位置、手部动作、脚的站位和重心变化明显不同。背景干净，网格排版整齐，适合作为篮球训练教学动作示意图。',
    animationStoryboard:
      '生成一张「发光森林冒险」的动画故事板，整体风格为可爱卡通、明亮奇幻、童话冒险。画面采用专业动画前期分镜版式，包含 8 个连续分镜。\n  8 个分镜依次表现：萤火虫入口发出微光，小主角走进森林；主角发现一颗发光种子；沿着盘绕的树根小路前进；古树裂缝缓缓睁开像眼睛一样发光；神秘守夜者从树影中出现并开口说话；主角在藤蔓追赶中惊险躲避；发光种子被放入古树中心，点亮整片森林；最后以蓝色月光下的森林全景收尾。\n  每个分镜包含简单对白气泡，例如「这里好亮！」「它在呼唤我们」「快跑！」「森林醒来了」。要求角色一致，动作连贯，情绪从好奇、惊讶、紧张到温暖治愈逐步变化。画面风格统一，色彩明亮，分镜清晰，像专业动画故事板。',
    musicVideoStoryboard:
      '生成一张「霓虹雨夜」的 MV 音乐视频故事版，整体风格为赛博都市、霓虹灯光、孤独浪漫。画面采用专业音乐视频前期分镜版式，包含 8 个连续分镜。\n  8 个分镜依次表现：雨夜城市远景，霓虹灯在湿润街道上反射；女歌手撑着透明雨伞走进画面；近景拍摄她低头轻唱第一句歌词；街边广告屏闪烁蓝紫色光；副歌部分她站在天桥中央，身后车流形成光轨；舞蹈段落中多人剪影在雨中起舞；情绪高潮时女歌手抬头看向天空，雨滴被霓虹照亮；最后以清晨微光下空荡街道收尾。\n  每个分镜加入简短歌词片段或情绪提示，例如「雨落下时，我还在等你」「城市不说话」「灯光替我记得你」。要求角色一致，情绪从孤独、克制到释放再到释然，画面统一，灯光高级，像专业 MV 故事板。',
    comicStoryboardPage:
      '生成一张「午夜觉醒」的漫画分镜页，整体风格为现代热血青年漫画、黑白墨线、局部红色强调。画面采用专业漫画页构图，包含 8 个大小不同的分镜。\n  8 个分镜依次表现：深夜城市天台，男主独自站在风中；眼神特写，瞳孔中出现红色光芒；手机收到神秘信息「你被选中了」；天空突然裂开，黑色能量降落；男主被冲击波震退，手臂浮现金色符文；敌人剪影从烟雾中出现；男主握紧拳头，能量爆发；最后一格为大画幅英雄站姿，男主说「从现在开始，由我决定命运。」\n  加入对白气泡、速度线、冲击线、墨迹飞溅和音效字，例如「轰！！」「咔嚓」「嗡——」。要求分镜节奏紧张，情绪从疑惑、震惊到觉醒爆发，画面统一，像正式漫画连载页。',
    socialShortVideoStoryboard:
      '生成一张「5分钟整理书桌」的社交媒体短视频分镜图，整体风格为清新生活方式、小红书感、明亮治愈。画面采用短视频脚本前期分镜版式，包含 8 个连续分镜。\n  8 个分镜依次表现：开头钩子，凌乱书桌特写，字幕「你的桌面是不是也这样？」；人物皱眉看着桌面；清空桌面，把物品分类；擦拭桌面，阳光照进房间；摆放收纳盒、笔筒和台灯；整理前后对比画面；人物坐下开始学习，表情放松；最后展示干净桌面全景，字幕「5分钟，让学习状态回来」。\n  要求字幕清晰，镜头有近景、俯拍、对比镜头和全景，节奏从混乱到治愈，画面明亮统一，适合短视频拍摄前期分镜。',
    brandPromotionStoryboard:
      '生成一张「LUMO 智能台灯」的品牌宣传故事版，整体风格为现代极简、温暖科技、生活方式广告。画面采用专业品牌宣传片前期分镜版式，包含 8 个连续分镜。\n  8 个分镜依次表现：夜晚书桌前，年轻设计师疲惫地揉眼睛；桌面光线昏暗，设计稿散落；LUMO 智能台灯轻轻亮起，柔和光线覆盖桌面；手机 App 自动调节亮度与色温；设计师重新开始绘图，表情放松；清晨阳光进入房间，作品完成；台灯与整洁桌面形成高级产品特写；最后品牌口号出现：「LUMO，让灵感被温柔照亮。」\n  要求品牌感高级，产品出现自然，人物情绪从疲惫到专注再到满足，画面干净统一，像真实品牌宣传片故事板。',
    tutorialStoryboard:
      '生成一张「手冲咖啡教学」的教程类分镜图，整体风格为温暖生活方式、极简插画、咖啡馆氛围。画面采用清晰步骤教学版式，包含 8 个连续步骤分镜。\n  8 个步骤依次表现：准备滤杯、滤纸、咖啡豆和手冲壶；研磨咖啡豆；放入滤纸并用热水润湿；倒入咖啡粉并轻轻铺平；第一次注水进行闷蒸；分三次画圈注水；咖啡滴滤完成；倒入杯中并展示成品咖啡。\n  每个分镜加入箭头、编号和简短说明文字，例如「研磨」「润湿滤纸」「闷蒸30秒」「缓慢注水」。要求动作清晰、器具位置准确、步骤连贯，画面干净高级，像专业教程信息图。',
    hdFilmProductionBoard:
      '创建一张 16:9 横版高清电影制作板 / 视觉规划表，主题为「奔驰跑车性能广告」。整体呈现高端汽车广告前期制作板风格，布局简洁、结构清晰、分区明确，具有影视级商业质感，适合作为导演拍摄指南。\n  画面主体围绕一辆银灰色奔驰 AMG 跑车，强调速度、精准、豪华、操控和夜间赛道性能。整体视觉为深色高级底板，搭配白色细线分区、冷蓝灯光、银灰金属质感、红色尾灯轨迹和少量品牌红色点缀。\n  顶部栏为艺术指导区，展示项目概述：16:9 赛车性能短片、8 个主要镜头、夜晚赛车场环境、统一色卡、影片基调关键词。色卡包括深黑、炭灰、银灰、冷蓝、尾灯红。\n  左侧为车辆与赛车手风格参考区：展示奔驰跑车的正面、侧面、背面、车灯特写、轮毂特写、内饰方向盘、车标细节；同时展示赛车手在车内的驾驶姿态参考，赛车手必须佩戴黑色全盔、黑色赛车服、赛车手套，形象保持一致，不出现车外站立画面。\n  中上区域为环境与场景设计：展示一个极具电影感的夜晚赛车场，湿润赛道反射冷蓝灯光，远处看台、泛光灯、赛道护栏、弯道漂移区域清晰可见。旁边加入俯视赛道示意图，用红色路线标出赛车移动路径，并标注摄像机位置、跟拍点、漂移弯道、低机位、车内镜头、无人机俯拍等镜头类型。\n  中部为 8 格故事板分镜，所有分镜为 16:9 小画幅，编号清晰，展示完整拍摄流程：\n  1. 夜晚赛车场广角建立镜头，奔驰跑车进入赛道；\n  2. 低机位车头推进，车灯划破黑暗；\n  3. 车内特写，赛车手戴头盔握紧方向盘；\n  4. 轮胎与地面微距，轮胎打滑，水花和烟雾飞溅；\n  5. 跑车高速过弯漂移，加入强烈运动模糊；\n  6. 车尾跟拍，红色尾灯形成光轨；\n  7. 无人机俯拍，车辆沿赛道路线高速穿梭；\n  8. 英雄收尾镜头，跑车停在赛道灯光下，车身反射高级冷光。\n  每个分镜下方加入小型信息条，标注镜头类型、景别、运动方式、动作描述和情绪进展，例如：广角 / 中景 / 特写 / 微距，静态 / 跟拍 / 低机位 / 手持 / 航拍，速度感、压迫感、精准操控、胜利收束。\n  底部模块包含灯光与情绪、关键词、音频音调、镜头语言与后期风格。灯光强调冷蓝赛道灯、红色尾灯、金属反光、湿地反射和高对比阴影；关键词包括性能、速度、精准、控制、豪华、夜赛、漂移；音频包括低频电子音乐、引擎轰鸣、轮胎摩擦、水花飞溅、风噪和加速声浪；镜头语言包括低角度推进、车内主观镜头、轮胎微距、跟车镜头、无人机俯拍、运动模糊和高速剪辑。\n  整体画面必须保持专业、整洁、连贯、商业广告感强，分镜节奏清晰，禁止出现赛车手在车外的画面，赛车手始终在车内并佩戴头盔。画面要一眼传达奔驰跑车的速度、力量、精密操控和高级豪华气质。',
    xianxiaGuomanStoryboard:
      '创建一张 16:9 横版高清「30 秒科幻修仙国漫影视视觉开发板」，参考好莱坞工业化电影前期制作标准，整体为冷调写实电影质感、东方玄幻美学、未来科技感和国漫高燃叙事风格。\n  画面采用高级深色信息板排版，分为 6 大模块：顶部项目信息栏，展示片名、时长、类型、调性、镜头数量和主色调；左上双主角人设设计栏，展示两位主角的正面、侧面、背面三视图、面部特写、服装细节、武器法器和科技装备，角色造型必须高度一致；右上核心场景概念图，展示悬浮仙城、灵能天门、赛博仙山或量子阵法等宏大科幻修仙场景；中部 3 组连续镜头故事板序列，展示镜头编号、景别、运镜、动作和情绪推进；镜头运动与技术示意区，包含运镜轨迹、相机运动流程、机位图标和空间调度；底部专业技术参数栏，展示灯光氛围、色卡、镜头参数、后期风格、音频基调和视觉关键词。\n  整体要求专业影视工业级排版，信息密度高但清晰有序，画面统一精致，角色不变脸，文字不混乱，无低质拼贴。色调以冷蓝、玄黑、银灰、暗金、灵能青和能量白为主。4K 超清，ultra-detailed，professional film production layout，cinematic shot design，适配 Seedance 2.0 专业视频生成。」\n  整体视觉要求：\n   高级教程海报、清晰排版、上下结构明确、标题醒目、提示词区域可读性强、留白合理、设计感强。严格保持 3:4 教程图模板结构，不要把整张图做成横版影视视觉开发板。不要杂乱，不要低质截图感，不要文字堆叠混乱，不要廉价海报风。',
  },
  STORYBOARD_INSERT_PROMPT_PRESETS = [
    { templateKey: 'filmStoryboard', title: '电影分镜故事板', desc: '电影镜头故事板模板' },
    { templateKey: 'advertisingStoryboard', title: '广告故事板', desc: '广告创意故事板模板' },
    { templateKey: 'gameStoryStoryboard', title: '游戏剧情故事板', desc: '游戏剧情演出故事板模板' },
    { templateKey: 'sportsTrainingStoryboard', title: '体育训练故事板', desc: '体育训练动作故事板模板' },
    { templateKey: 'animationStoryboard', title: '动画故事板', desc: '动画镜头故事板模板' },
    { templateKey: 'musicVideoStoryboard', title: 'MV音乐视频故事板', desc: '音乐视频画面故事板模板' },
    { templateKey: 'comicStoryboardPage', title: '漫画分镜页', desc: '漫画页面分镜模板' },
    { templateKey: 'socialShortVideoStoryboard', title: '社交媒体短视频分镜', desc: '短视频节奏分镜模板' },
    { templateKey: 'brandPromotionStoryboard', title: '品牌宣传故事版', desc: '品牌宣传画面故事版模板' },
    { templateKey: 'tutorialStoryboard', title: '教程类分镜图', desc: '教程步骤画面分镜模板' },
    { templateKey: 'hdFilmProductionBoard', title: '高清电影制作板', desc: '高清电影制作板模板' },
    { templateKey: 'xianxiaGuomanStoryboard', title: '修仙国漫故事板', desc: '修仙国漫剧情故事板模板' },
  ],
  IMAGE_PRESET_EMPTY_INPUT_MESSAGE = '请输入提示词或添加参考图片',
  staticPromptTemplate = (_0xfe9c46) => ({
    type: PROMPT_PRESET_TEMPLATE_TYPE_STATIC,
    text: _0xfe9c46,
    requireInput: true,
    emptyInputMessage: IMAGE_PRESET_EMPTY_INPUT_MESSAGE,
  }),
  storyboardInsertPromptPreset = ({ templateKey: _0x1e6e15, title: _0x38304f, desc: _0x117a6d }) => ({
    icon: '🎬',
    title: _0x38304f,
    desc: _0x117a6d,
    triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
    template: staticPromptTemplate(STORYBOARD_PROMPT_TEMPLATES[_0x1e6e15]),
  });
function localizePromptPresetTemplate(_0x4faec8, _0x154a5c = '') {
  const _0x48bcfe = _0x154a5c ? optionalPromptPresetsText('presets.' + _0x154a5c + '.template') : '';
  if (typeof _0x4faec8 === 'string') return _0x48bcfe || _0x4faec8;
  if (!_0x4faec8 || typeof _0x4faec8 !== 'object') return _0x4faec8;
  const _0x6515bb = { ..._0x4faec8 };
  _0x48bcfe && _0x6515bb.type === PROMPT_PRESET_TEMPLATE_TYPE_STATIC && (_0x6515bb.text = _0x48bcfe);
  if (_0x6515bb.type === PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT) {
    const _0x17704f = _0x154a5c
        ? optionalPromptPresetsText('presets.' + _0x154a5c + '.imageInputTemplate')
        : '',
      _0x9d8b97 = _0x154a5c ? optionalPromptPresetsText('presets.' + _0x154a5c + '.textInputTemplate') : '';
    (_0x17704f && (_0x6515bb.imageInputTemplate = _0x17704f),
      _0x9d8b97 && (_0x6515bb.textInputTemplate = _0x9d8b97));
  }
  const _0x2a5454 = String(_0x6515bb.emptyInputMessage || '');
  if (_0x2a5454 === IMAGE_PRESET_EMPTY_INPUT_MESSAGE)
    _0x6515bb.emptyInputMessage = promptPresetsText('emptyInput.image');
  else
    _0x2a5454 === TEMPLATES.Panorama360Seamless.emptyInputMessage &&
      (_0x6515bb.emptyInputMessage = promptPresetsText('emptyInput.panorama'));
  return _0x6515bb;
}
function localizePromptPresetItem(_0x40f9a0 = {}) {
  const _0x5a149a = String(_0x40f9a0?.title || ''),
    _0x362fbe = PROMPT_PRESET_TITLE_I18N_KEYS[_0x5a149a] || '',
    _0xac2d3b = { ..._0x40f9a0 };
  if (_0x5a149a) _0xac2d3b.title = getLocalizedPresetTitle(_0x5a149a);
  return (
    Object.prototype.hasOwnProperty.call(_0x40f9a0, 'desc') &&
      (_0xac2d3b.desc = getLocalizedPresetDesc(_0x5a149a, _0x40f9a0.desc)),
    Array.isArray(_0x40f9a0.subItems) &&
      (_0xac2d3b.subItems = _0x40f9a0.subItems.map(localizePromptPresetItem)),
    Object.prototype.hasOwnProperty.call(_0x40f9a0, 'template') &&
      (_0xac2d3b.template = localizePromptPresetTemplate(_0x40f9a0.template, _0x362fbe)),
    _0xac2d3b
  );
}
function localizePromptPresetItems(_0x5a273b = []) {
  return (Array.isArray(_0x5a273b) ? _0x5a273b : []).map(localizePromptPresetItem);
}
export const PROMPT_PRESETS = {
  'ai-image': [
    {
      icon: '📐',
      title: '场景参考',
      desc: '一键生成场景多视图和全景图',
      subItems: [
        {
          icon: '📐',
          title: '场景四视图',
          desc: '一键生成场景多视图',
          template: staticPromptTemplate(TEMPLATES.SceneReference),
        },
        {
          icon: '▦',
          title: '场景九宫格',
          desc: '同一场景的 9 个连续多视角设定图',
          template: staticPromptTemplate(TEMPLATES.SceneGrid9),
        },
        {
          icon: '🌐',
          title: '360°无缝全景图',
          desc: '生成适合 VR 查看的一张无缝 360° 全景图',
          template: TEMPLATES.Panorama360Seamless,
        },
      ],
    },
    {
      icon: '🧍',
      title: '人设参考',
      desc: '一键生成人物多视图 三视图、三视图加脸部、人设拆解图',
      subItems: [
        {
          icon: '🧍',
          title: '人物三视图',
          desc: '纯正的三向视图展示',
          template: staticPromptTemplate(TEMPLATES.characterRef3View),
        },
        {
          icon: '🧍',
          title: '人物三视图+脸部',
          desc: '带脸部特写的三视图',
          template: staticPromptTemplate(TEMPLATES.characterRef3ViewFace),
        },
        {
          icon: '🧍',
          title: '人设解析图',
          desc: '包含细节拆解的设定集',
          template: staticPromptTemplate(TEMPLATES.characterRefAnalysis),
        },
      ],
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      title: '多宫格',
      desc: '一键生成剧情连续的多宫格图片',
      subItems: [
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
          title: '4宫格',
          desc: '起承转合更清晰，适合一句话剧情',
          template: staticPromptTemplate(TEMPLATES.multiGrid4),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="4" height="4"></rect><rect x="10" y="3" width="4" height="4"></rect><rect x="17" y="3" width="4" height="4"></rect><rect x="3" y="10" width="4" height="4"></rect><rect x="10" y="10" width="4" height="4"></rect><rect x="17" y="10" width="4" height="4"></rect><rect x="3" y="17" width="4" height="4"></rect><rect x="10" y="17" width="4" height="4"></rect><rect x="17" y="17" width="4" height="4"></rect></svg>',
          title: '9宫格',
          desc: '3x3 更细动作与情绪递进',
          template: staticPromptTemplate(TEMPLATES.multiGrid9),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 3h18v18H3z"></path><path d="M7.5 3v18"></path><path d="M12 3v18"></path><path d="M16.5 3v18"></path><path d="M3 7.5h18"></path><path d="M3 12h18"></path><path d="M3 16.5h18"></path></svg>',
          title: '16宫格',
          desc: '4x4 更密的节奏推进与镜头切换',
          template: staticPromptTemplate(TEMPLATES.multiGrid16),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 3h18v18H3z"></path><path d="M6.6 3v18"></path><path d="M10.2 3v18"></path><path d="M13.8 3v18"></path><path d="M17.4 3v18"></path><path d="M3 6.6h18"></path><path d="M3 10.2h18"></path><path d="M3 13.8h18"></path><path d="M3 17.4h18"></path></svg>',
          title: '25宫格',
          desc: '5x5 长连续剧情，适合完整片段',
          template: staticPromptTemplate(TEMPLATES.multiGrid25),
        },
      ],
    },
    {
      icon: '🎬',
      title: '故事板分镜',
      desc: '一键生成故事板分镜',
      subItems: [
        {
          icon: '🎬',
          title: '竖版故事分镜',
          desc: '竖版分镜，从上到下推进',
          template: staticPromptTemplate(TEMPLATES.storyboardVertical),
        },
        {
          icon: '🎬',
          title: '竖版故事分镜+场景',
          desc: '竖版分镜，包含场景设定参考',
          template: staticPromptTemplate(TEMPLATES.storyboardVerticalScene),
        },
        {
          icon: '🎬',
          title: '横版故事分镜',
          desc: '横版分镜，从左到右推进',
          template: staticPromptTemplate(TEMPLATES.storyboardHorizontal),
        },
        {
          icon: '🎬',
          title: '横版故事分镜+场景',
          desc: '横版分镜，包含场景设定参考',
          template: staticPromptTemplate(TEMPLATES.storyboardHorizontalScene),
        },
        ...STORYBOARD_INSERT_PROMPT_PRESETS.map(storyboardInsertPromptPreset),
      ],
    },
  ],
  'ai-text': [
    {
      icon: '🖼️',
      title: REVERSE_IMAGE_PROMPT_PRESET_TITLE,
      desc: '根据参考图反推出中英文生图提示词',
      triggerMode: PROMPT_PRESET_TRIGGER_MODE_DIRECT,
      template: REVERSE_IMAGE_PROMPT_PRESET_PROMPT,
    },
    { icon: '📝', title: '长篇精缩V1', desc: '一键把长篇内容精缩成短篇', template: TEMPLATES.longToShort },
    {
      icon: '📝',
      title: '提取人物场景道具信息',
      desc: '提取文本中的人物、场景、道具信息',
      template: TEMPLATES.extractInfo,
    },
    {
      icon: '🧍',
      title: '格式化短剧提示词',
      desc: '将小说一键转化为标准AI视频提示词脚本',
      subItems: [
        {
          icon: '📝',
          title: '影视级叙事分镜脚本',
          desc: '将小说一键转化为标准戏剧化脚本，专为AI短剧视频量身定制',
          template: TEMPLATES.Storyboard1,
        },
        {
          icon: '📝',
          title: '影视级叙事分镜脚本-秒级',
          desc: '精确到秒的光影渲染、运镜与音效控制，专为AI短剧视频量身定制',
          template: TEMPLATES.Storyboard2,
        },
        {
          icon: '🎬',
          title: 'Seedance2.0视频格式',
          desc: '按用户秒数或默认15秒输出 Seedance 2.0 秒级视频提示词',
          template: TEMPLATES.Seedance2VideoFormat,
        },
      ],
    },
  ],
  'ai-video': [],
};
let customPresets = {},
  promptPresetSettings = { defaultQuickCaptureNodeType: '' },
  promptPresetSettingsLoaded = false,
  promptPresetSettingsLoadPromise = null,
  activePresetManagerOverlay = null,
  closeActivePresetManager = null;
const FREE_CUSTOM_PRESET_LIMIT = 2,
  SUPPORTED_PRESET_NODE_TYPES = new Set(['ai-image', 'ai-text', 'ai-video', 'ai-audio']),
  PRESET_MANAGER_TABS = [
    { nodeType: 'ai-text', label: '文本预设', desc: '管理 文本节点 的生成预设', icon: 'text' },
    { nodeType: 'ai-image', label: '图像预设', desc: '管理 图像节点 的生成预设', icon: 'image' },
    { nodeType: 'ai-video', label: '视频预设', desc: '管理 视频节点 的生成预设', icon: 'video' },
    { nodeType: 'ai-audio', label: '音频预设', desc: '管理 音频节点 的生成预设', icon: 'audio' },
  ],
  USER_INPUT_PLACEHOLDER = PROMPT_PRESET_USER_INPUT_PLACEHOLDER,
  NODE_TYPE_I18N_KEYS = Object.freeze({
    'ai-image': 'image',
    'ai-text': 'text',
    'ai-video': 'video',
    'ai-audio': 'audio',
  }),
  PROMPT_PRESET_TITLE_I18N_KEYS = Object.freeze({
    场景参考: 'sceneReferenceGroup',
    场景四视图: 'sceneFourView',
    场景九宫格: 'sceneGrid9',
    '360°无缝全景图': 'panorama360',
    人设参考: 'characterReferenceGroup',
    人物三视图: 'characterThreeView',
    '人物三视图+脸部': 'characterThreeViewFace',
    人设解析图: 'characterAnalysis',
    多宫格: 'multiGridGroup',
    '4宫格': 'multiGrid4',
    '9宫格': 'multiGrid9',
    '16宫格': 'multiGrid16',
    '25宫格': 'multiGrid25',
    故事板分镜: 'storyboardGroup',
    竖版故事分镜: 'storyboardVertical',
    '竖版故事分镜+场景': 'storyboardVerticalScene',
    横版故事分镜: 'storyboardHorizontal',
    '横版故事分镜+场景': 'storyboardHorizontalScene',
    电影分镜故事板: 'filmStoryboard',
    广告故事板: 'advertisingStoryboard',
    游戏剧情故事板: 'gameStoryStoryboard',
    体育训练故事板: 'sportsTrainingStoryboard',
    动画故事板: 'animationStoryboard',
    MV音乐视频故事板: 'musicVideoStoryboard',
    漫画分镜页: 'comicStoryboardPage',
    社交媒体短视频分镜: 'socialShortVideoStoryboard',
    品牌宣传故事版: 'brandPromotionStoryboard',
    教程类分镜图: 'tutorialStoryboard',
    高清电影制作板: 'hdFilmProductionBoard',
    修仙国漫故事板: 'xianxiaGuomanStoryboard',
    [REVERSE_IMAGE_PROMPT_PRESET_TITLE]: 'reverseImagePrompt',
    长篇精缩V1: 'longToShort',
    提取人物场景道具信息: 'extractInfo',
    格式化短剧提示词: 'formatShortDrama',
    影视级叙事分镜脚本: 'storyboardScript',
    '影视级叙事分镜脚本-秒级': 'storyboardScriptTimed',
    'Seedance2.0视频格式': 'seedance2VideoFormat',
  });
function getPresetNodeTypeLabel(_0x4e365f) {
  const _0x154308 = NODE_TYPE_I18N_KEYS[_0x4e365f];
  return _0x154308 ? promptPresetsText('nodeTypes.' + _0x154308) : promptPresetsText('nodeTypes.node');
}
export function getPromptPresetCollectionLabel(_0x64bb1b) {
  const _0x154308 = NODE_TYPE_I18N_KEYS[_0x64bb1b];
  return _0x154308 ? promptPresetsText('tabs.' + _0x154308 + '.label') : '';
}
function getPresetManagerTabLabel(_0x33e558) {
  return getPromptPresetCollectionLabel(_0x33e558?.nodeType) || String(_0x33e558?.label || '');
}
function getPresetManagerDesc(_0x1d0362) {
  return promptPresetsText('manager.desc', { nodeType: getPresetNodeTypeLabel(_0x1d0362) });
}
function getUserInputPillHtml() {
  return (
    '<span class="preset-placeholder-pill" contenteditable="false" data-preset-placeholder="user-input">' +
    escapePresetTemplateHtml(promptPresetsText('userInputPill')) +
    '</span>'
  );
}
function getPresetTemplatePlaceholderText() {
  return promptPresetsText('templatePlaceholder');
}
function getCustomPresetFallbackTitle() {
  return promptPresetsText('customPresetFallback');
}
function getLocalizedPresetTitle(_0x2411a3) {
  const _0x4b90b9 = PROMPT_PRESET_TITLE_I18N_KEYS[_0x2411a3];
  return _0x4b90b9 ? promptPresetsText('presets.' + _0x4b90b9 + '.title') : _0x2411a3;
}
function getLocalizedPresetDesc(_0x3feeef, _0xe03684) {
  const _0x18213b = PROMPT_PRESET_TITLE_I18N_KEYS[_0x3feeef];
  return _0x18213b ? promptPresetsText('presets.' + _0x18213b + '.desc') : _0xe03684;
}
export function normalizePromptPresetTriggerMode(_0x12d5c6) {
  const _0x5a308e = String(_0x12d5c6 || '').trim();
  return PROMPT_PRESET_TRIGGER_MODES.has(_0x5a308e) ? _0x5a308e : PROMPT_PRESET_TRIGGER_MODE_DIRECT;
}
export function shouldInsertPromptForPreset(_0x185096 = {}) {
  return (
    normalizePromptPresetTriggerMode(_0x185096?.triggerMode) === PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT
  );
}
export function isPromptPresetNodeTypeSupported(_0x212b41) {
  return SUPPORTED_PRESET_NODE_TYPES.has(String(_0x212b41 || '').trim());
}
function getPromptPresetTriggerModeLabel(_0x5e10f8 = {}) {
  return shouldInsertPromptForPreset(_0x5e10f8)
    ? promptPresetsText('triggerModes.insertPrompt')
    : promptPresetsText('triggerModes.direct');
}
export async function loadCustomPresets() {
  try {
    const [_0x2e5b0e] = await Promise.all([fetchPromptPresetsFromServer(), loadPromptPresetSettings()]);
    customPresets = _0x2e5b0e;
  } catch (_0x3eb349) {
    console.warn('[promptPresets] No custom presets found or load failed.', _0x3eb349);
  }
}
export function getPromptPresets(_0x1c9616) {
  const _0x5d23f1 = PROMPT_PRESETS[_0x1c9616] || [],
    _0x2f5717 = customPresets[_0x1c9616] || [];
  return [...localizePromptPresetItems(_0x5d23f1), ..._0x2f5717];
}
function normalizePresetNodeType(_0x1c816e) {
  const _0x312cb4 = String(_0x1c816e || '').trim();
  return SUPPORTED_PRESET_NODE_TYPES.has(_0x312cb4) ? _0x312cb4 : 'ai-image';
}
function normalizePresetManagerNodeType(_0x302940) {
  const _0x1f97a1 = String(_0x302940 || '').trim();
  return PRESET_MANAGER_TABS.some((_0x1415aa) => _0x1415aa.nodeType === _0x1f97a1) ? _0x1f97a1 : 'ai-text';
}
function normalizePromptPresetSettings(_0x5e0a4d = {}) {
  const _0x2b8c17 = String(_0x5e0a4d?.defaultQuickCaptureNodeType || '').trim();
  return {
    defaultQuickCaptureNodeType: PRESET_MANAGER_TABS.some((_0x4f0d92) => _0x4f0d92.nodeType === _0x2b8c17)
      ? _0x2b8c17
      : '',
  };
}
export async function loadPromptPresetSettings({ force: force = false } = {}) {
  if (promptPresetSettingsLoaded && !force) return { ...promptPresetSettings };
  if (promptPresetSettingsLoadPromise && !force) return promptPresetSettingsLoadPromise;
  const _0x4c1e60 = (async () => {
    const _0x3ad7f1 = await fetchPromptPresetSettingsFromServer();
    return (
      (promptPresetSettings = normalizePromptPresetSettings(_0x3ad7f1)),
      (promptPresetSettingsLoaded = true),
      { ...promptPresetSettings }
    );
  })().catch((_0x1b9d4e) => {
    return (
      console.warn('[promptPresets] Failed to load preset settings.', _0x1b9d4e),
      (promptPresetSettingsLoaded = true),
      { ...promptPresetSettings }
    );
  });
  promptPresetSettingsLoadPromise = _0x4c1e60;
  try {
    return await _0x4c1e60;
  } finally {
    promptPresetSettingsLoadPromise === _0x4c1e60 && (promptPresetSettingsLoadPromise = null);
  }
}
export function getDefaultQuickCapturePresetNodeType() {
  return promptPresetSettings.defaultQuickCaptureNodeType || '';
}
export async function setDefaultQuickCapturePresetNodeType(_0x4c4b6c) {
  const _0x49452f = String(_0x4c4b6c || '').trim();
  if (!PRESET_MANAGER_TABS.some((_0x371e2a) => _0x371e2a.nodeType === _0x49452f))
    throw new Error('Invalid quick capture preset node type');
  return (
    await savePromptPresetSettingsToServer({ defaultQuickCaptureNodeType: _0x49452f }),
    (promptPresetSettings = { ...promptPresetSettings, defaultQuickCaptureNodeType: _0x49452f }),
    (promptPresetSettingsLoaded = true),
    { ...promptPresetSettings }
  );
}
export function __setPromptPresetSettingsForTest(_0x30f0a7 = {}) {
  ((promptPresetSettings = normalizePromptPresetSettings(_0x30f0a7)),
    (promptPresetSettingsLoaded = true),
    (promptPresetSettingsLoadPromise = null));
}
export function getCustomPromptPresets(_0x4a2c20) {
  const _0x312496 = normalizePresetNodeType(_0x4a2c20);
  return Array.isArray(customPresets[_0x312496]) ? [...customPresets[_0x312496]] : [];
}
export function getSlashPromptPresetEntries(_0x4830ee) {
  const _0x1f4ba4 = PROMPT_PRESETS[_0x4830ee] || [],
    _0xea66d6 = getCustomPromptPresets(_0x4830ee),
    _0xbb32f3 = localizePromptPresetItems(_0x1f4ba4);
  if (_0xea66d6.length === 0) return _0xbb32f3;
  return [
    ..._0xbb32f3,
    {
      title: promptPresetsText('customGroupTitle'),
      desc: promptPresetsText('customGroupDesc'),
      subItems: _0xea66d6,
    },
  ];
}
export function canCreateCustomPromptPreset(_0x5c8874, _0x4c4940) {
  if (isSubscriptionActive(_0x4c4940 || {})) return true;
  return getCustomPromptPresets(_0x5c8874).length < FREE_CUSTOM_PRESET_LIMIT;
}
export function __setCustomPromptPresetsForTest(_0x1e78a5 = {}) {
  customPresets = _0x1e78a5 && typeof _0x1e78a5 === 'object' ? { ..._0x1e78a5 } : {};
}
function escapePresetTemplateHtml(_0x174853) {
  return String(_0x174853 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
export function renderPresetTemplateEditorHtml(_0x10cd78 = '') {
  return String(_0x10cd78 ?? '')
    .split(USER_INPUT_PLACEHOLDER)
    .map((_0x57b172) => escapePresetTemplateHtml(_0x57b172).replace(/\r?\n/g, '<br>'))
    .join(getUserInputPillHtml());
}
export function serializePresetTemplateEditorHtml(_0x1e83c3 = '') {
  const _0x4f4f04 = '__AIC_USER_INPUT_PLACEHOLDER__',
    _0x1817ec = String(_0x1e83c3 ?? '')
      .replace(/<span\b[^>]*\bdata-preset-placeholder=["']user-input["'][^>]*>[\s\S]*?<\/span>/gi, _0x4f4f04)
      .replace(/<br\b[^>]*\/?>/gi, '\n')
      .replace(/<\/(div|p)>/gi, '\n')
      .replace(/<[^>]+>/g, '');
  if (typeof document === 'undefined' || typeof document.createElement !== 'function')
    return _0x1817ec
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(new RegExp(_0x4f4f04, 'g'), USER_INPUT_PLACEHOLDER)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  const _0x351d32 = document.createElement('textarea');
  return (
    (_0x351d32.innerHTML = _0x1817ec),
    _0x351d32.value
      .replace(new RegExp(_0x4f4f04, 'g'), USER_INPUT_PLACEHOLDER)
      .replace(/\u00a0/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
function editorHasUserInputPill(_0x11d8c3) {
  return !!_0x11d8c3?.querySelector?.('[data-preset-placeholder="user-input"]');
}
function moveCaretAfterNode(_0x14fcfd) {
  const _0x159ffb = window.getSelection?.();
  if (!_0x159ffb) return;
  const _0x2a4a6e = document.createRange();
  (_0x2a4a6e.setStartAfter(_0x14fcfd),
    _0x2a4a6e.collapse(true),
    _0x159ffb.removeAllRanges(),
    _0x159ffb.addRange(_0x2a4a6e));
}
function insertUserInputPill(_0x189416) {
  if (editorHasUserInputPill(_0x189416))
    return (showPresetManagerToast(promptPresetsText('editor.duplicateUserInput'), 'warn'), false);
  const _0x26576f = document.createElement('span');
  _0x26576f.innerHTML = getUserInputPillHtml();
  const _0x4cfcef = _0x26576f.firstElementChild,
    _0x3e799a = document.createTextNode(' '),
    _0x1fd002 = window.getSelection?.(),
    _0x46997d =
      _0x1fd002?.rangeCount && _0x189416.contains(_0x1fd002.getRangeAt(0).commonAncestorContainer)
        ? _0x1fd002.getRangeAt(0)
        : null;
  return (
    _0x46997d
      ? (_0x46997d.deleteContents(), _0x46997d.insertNode(_0x3e799a), _0x46997d.insertNode(_0x4cfcef))
      : (_0x189416.appendChild(_0x4cfcef), _0x189416.appendChild(_0x3e799a)),
    moveCaretAfterNode(_0x3e799a),
    _0x189416.focus(),
    true
  );
}
function buildPresetModalButton(_0x20721f, _0x19490b) {
  const _0x332dff = document.createElement('button');
  return (
    (_0x332dff.type = 'button'),
    (_0x332dff.className = _0x19490b),
    (_0x332dff.textContent = _0x20721f),
    _0x332dff
  );
}
function buildPresetTriggerModeControl(_0x54ad45) {
  let _0x5510b0 = normalizePromptPresetTriggerMode(_0x54ad45);
  const _0x1510da = document.createElement('div');
  ((_0x1510da.className = 'preset-manager-trigger-modes'),
    _0x1510da.setAttribute('role', 'group'),
    _0x1510da.setAttribute('aria-label', promptPresetsText('triggerModes.aria')));
  const _0x36bd99 = document.createElement('span');
  ((_0x36bd99.className = 'preset-manager-trigger-mode-label'),
    (_0x36bd99.textContent = promptPresetsText('triggerModes.label')),
    _0x1510da.appendChild(_0x36bd99));
  const _0x358d2e = (_0x25260c, _0x467873) => {
      const _0x5daff8 = buildPresetModalButton(_0x467873, 'preset-manager-trigger-mode');
      return (
        (_0x5daff8.dataset.triggerMode = _0x25260c),
        _0x5daff8.setAttribute('aria-pressed', 'false'),
        _0x5daff8.addEventListener('click', () => {
          ((_0x5510b0 = _0x25260c), _0x5803a8());
        }),
        _0x1510da.appendChild(_0x5daff8),
        _0x5daff8
      );
    },
    _0x29cb7a = _0x358d2e(PROMPT_PRESET_TRIGGER_MODE_DIRECT, promptPresetsText('triggerModes.direct')),
    _0x4a049c = _0x358d2e(
      PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      promptPresetsText('triggerModes.insertPrompt'),
    );
  function _0x5803a8() {
    [_0x29cb7a, _0x4a049c].forEach((_0x1bd019) => {
      const _0x5ef6a0 = _0x1bd019.dataset.triggerMode === _0x5510b0;
      (_0x1bd019.classList.toggle('is-active', _0x5ef6a0),
        _0x1bd019.setAttribute('aria-pressed', _0x5ef6a0 ? 'true' : 'false'));
    });
  }
  return (_0x5803a8(), { element: _0x1510da, getValue: () => _0x5510b0 });
}
function buildPresetManagerIcon(_0x17370a) {
  const _0x3d27c6 = document.createElement('span');
  return (
    (_0x3d27c6.className = 'preset-manager-list-icon preset-manager-list-icon--' + _0x17370a),
    _0x3d27c6.setAttribute('aria-hidden', 'true'),
    _0x3d27c6
  );
}
function getPresetThumbSrc(_0x45f56a) {
  const _0x5be771 = String(_0x45f56a?.thumbnailDataUrl || '').trim();
  if (_0x5be771) return _0x5be771;
  const _0x947863 = String(_0x45f56a?.thumbUrl || '').trim();
  if (_0x947863) return _0x947863;
  const _0x386862 = String(_0x45f56a?.thumbLocalPath || '').trim();
  return _0x386862 ? '/' + _0x386862.replace(/^\/+/, '') : '';
}
function readPresetThumbnailFile(_0x125f8c) {
  return new Promise((_0x5b99cb, _0xa27276) => {
    if (!_0x125f8c || !String(_0x125f8c.type || '').startsWith('image/')) {
      _0xa27276(new Error(promptPresetsText('thumbnail.chooseImage')));
      return;
    }
    const _0x37acdc = new FileReader();
    ((_0x37acdc.onload = () => _0x5b99cb(String(_0x37acdc.result || ''))),
      (_0x37acdc.onerror = () => _0xa27276(new Error(promptPresetsText('thumbnail.readFailed')))),
      _0x37acdc.readAsDataURL(_0x125f8c));
  });
}
function buildPresetThumbnailControl({ preset: _0xe4f742, onUpload: _0xd6d577 }) {
  const _0x30e44d = document.createElement('label');
  ((_0x30e44d.className = 'preset-manager-list-thumb'),
    (_0x30e44d.title = promptPresetsText('thumbnail.upload')),
    _0x30e44d.addEventListener('click', (_0x585dcf) => _0x585dcf.stopPropagation()));
  const _0x47abc3 = getPresetThumbSrc(_0xe4f742);
  if (_0x47abc3) {
    const _0x35ad63 = document.createElement('img');
    ((_0x35ad63.className = 'preset-manager-list-thumb-img'),
      (_0x35ad63.src = _0x47abc3),
      (_0x35ad63.alt = ''),
      _0x30e44d.appendChild(_0x35ad63));
  } else {
    const _0x18fcec = document.createElement('span');
    ((_0x18fcec.className = 'preset-manager-list-thumb-plus'),
      (_0x18fcec.textContent = '+'),
      _0x30e44d.appendChild(_0x18fcec));
  }
  const _0x46b653 = document.createElement('input');
  return (
    (_0x46b653.className = 'preset-manager-thumb-input'),
    (_0x46b653.type = 'file'),
    (_0x46b653.accept = 'image/*'),
    _0x46b653.addEventListener('click', (_0x3b7586) => _0x3b7586.stopPropagation()),
    _0x46b653.addEventListener('change', async () => {
      const _0x48bdec = _0x46b653.files?.[0];
      if (!_0x48bdec) return;
      try {
        const _0x21bf29 = await readPresetThumbnailFile(_0x48bdec);
        _0xd6d577?.(_0x21bf29);
      } catch (_0x1099da) {
        showPresetManagerToast(_0x1099da?.message || promptPresetsText('thumbnail.uploadFailed'), 'error');
      } finally {
        _0x46b653.value = '';
      }
    }),
    _0x30e44d.appendChild(_0x46b653),
    _0x30e44d
  );
}
function buildPresetEditorPlaceholder() {
  const _0x332876 = document.createElement('div');
  ((_0x332876.className = 'preset-manager-editor-placeholder'),
    _0x332876.setAttribute('aria-hidden', 'true'),
    _0x332876.appendChild(document.createTextNode(getPresetTemplatePlaceholderText() + ' ')));
  const _0x488082 = document.createElement('span');
  return (
    (_0x488082.innerHTML = getUserInputPillHtml()),
    _0x332876.appendChild(_0x488082.firstElementChild),
    _0x332876
  );
}
function isPresetTemplateEditorEmpty(_0x19d75a) {
  return !serializePresetTemplateEditorHtml(_0x19d75a?.innerHTML || '');
}
function syncPresetEditorPlaceholder(_0x287c7b, _0x2f5bb0) {
  _0x2f5bb0.hidden = !isPresetTemplateEditorEmpty(_0x287c7b);
}
function buildPresetManagerTabIcon(_0x531bd4) {
  const _0x2dced5 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  (_0x2dced5.setAttribute('class', 'preset-manager-tab-icon'),
    _0x2dced5.setAttribute('width', '16'),
    _0x2dced5.setAttribute('height', '16'),
    _0x2dced5.setAttribute('viewBox', '0 0 24 24'),
    _0x2dced5.setAttribute('fill', 'none'),
    _0x2dced5.setAttribute('stroke', 'currentColor'),
    _0x2dced5.setAttribute('stroke-width', '2'),
    _0x2dced5.setAttribute('aria-hidden', 'true'));
  const _0x23b053 = (_0x15387a, _0x210e4a) => {
    const _0x4e5fed = document.createElementNS('http://www.w3.org/2000/svg', _0x15387a);
    (Object.entries(_0x210e4a).forEach(([_0x211a87, _0x48e2ed]) =>
      _0x4e5fed.setAttribute(_0x211a87, _0x48e2ed),
    ),
      _0x2dced5.appendChild(_0x4e5fed));
  };
  if (_0x531bd4 === 'text')
    return (
      _0x23b053('polyline', { points: '4 7 4 4 20 4 20 7' }),
      _0x23b053('line', { x1: '9', y1: '20', x2: '15', y2: '20' }),
      _0x23b053('line', { x1: '12', y1: '4', x2: '12', y2: '20' }),
      _0x2dced5
    );
  if (_0x531bd4 === 'image')
    return (
      _0x23b053('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }),
      _0x23b053('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
      _0x23b053('polyline', { points: '21 15 16 10 5 21' }),
      _0x2dced5
    );
  if (_0x531bd4 === 'video')
    return (
      _0x23b053('polygon', { points: '23 7 16 12 23 17 23 7' }),
      _0x23b053('rect', { x: '1', y: '5', width: '15', height: '14', rx: '2' }),
      _0x2dced5
    );
  if (_0x531bd4 === 'audio')
    return (
      _0x23b053('path', { d: 'M9 18V5l12-2v13' }),
      _0x23b053('circle', { cx: '6', cy: '18', r: '3' }),
      _0x23b053('circle', { cx: '18', cy: '16', r: '3' }),
      _0x2dced5
    );
  return _0x2dced5;
}
function getUniqueDraftTitle(_0x599d25) {
  const _0x7ac10c = new Set((_0x599d25 || []).map((_0xc5712f) => String(_0xc5712f?.title || '').trim()));
  let _0x3774e2 = 1,
    _0x5e895c = getCustomPresetFallbackTitle();
  while (_0x7ac10c.has(_0x5e895c)) {
    ((_0x3774e2 += 1),
      (_0x5e895c = promptPresetsText('customPresetFallbackWithIndex', { index: _0x3774e2 })));
  }
  return _0x5e895c;
}
function showPresetManagerToast(_0x492615, _0x3cdbb8 = 'info') {
  window.showToast?.(_0x492615, _0x3cdbb8);
}
function requestSubscriptionFromPresetManager(_0x38a766, { onSuccess: _0x54783b } = {}) {
  _0x38a766?.remove();
  if (typeof window.openSubscriptionDialog === 'function') {
    window.openSubscriptionDialog({ onSuccess: _0x54783b });
    return;
  }
  (openSettingsPanel(), showPresetManagerToast(promptPresetsText('manager.subscriptionRequired'), 'warn'));
}
function createPresetEditor({
  nodeType: _0x130dd6,
  preset: preset = null,
  isDraft: isDraft = false,
  onSaved: _0x497641,
}) {
  const _0x3b17e2 = document.createElement('div');
  _0x3b17e2.className = 'preset-manager-detail';
  const _0x3eac9b = isDraft ? '' : String(preset?.title || '').trim(),
    _0x46a214 = String(preset?.title || '').trim(),
    _0x5f16a3 = document.createElement('label');
  _0x5f16a3.className = 'preset-manager-field';
  const _0x2fe6ca = document.createElement('span');
  ((_0x2fe6ca.className = 'preset-manager-label'),
    (_0x2fe6ca.textContent = promptPresetsText('editor.name')));
  const _0x3fc429 = document.createElement('input');
  ((_0x3fc429.className = 'preset-manager-input'),
    (_0x3fc429.type = 'text'),
    (_0x3fc429.placeholder = promptPresetsText('editor.namePlaceholder')),
    (_0x3fc429.value = _0x46a214),
    _0x5f16a3.appendChild(_0x2fe6ca),
    _0x5f16a3.appendChild(_0x3fc429));
  const _0x2c0696 = document.createElement('label');
  _0x2c0696.className = 'preset-manager-field';
  const _0x46a03b = document.createElement('span');
  ((_0x46a03b.className = 'preset-manager-label'),
    (_0x46a03b.textContent = promptPresetsText('editor.desc')));
  const _0xe23a33 = document.createElement('input');
  ((_0xe23a33.className = 'preset-manager-input'),
    (_0xe23a33.type = 'text'),
    (_0xe23a33.placeholder = promptPresetsText('editor.descPlaceholder')),
    (_0xe23a33.value = String(preset?.desc || '').trim()),
    _0x2c0696.appendChild(_0x46a03b),
    _0x2c0696.appendChild(_0xe23a33));
  const _0x76b337 = document.createElement('div');
  _0x76b337.className = 'preset-manager-template-tools';
  const _0x3a47d6 = document.createElement('span');
  ((_0x3a47d6.className = 'preset-manager-label'),
    (_0x3a47d6.textContent = promptPresetsText('editor.template')));
  const _0x4bdff6 = buildPresetModalButton(
    promptPresetsText('editor.insertPrompt'),
    'preset-modal-btn-secondary preset-manager-insert-btn',
  );
  (_0x76b337.appendChild(_0x3a47d6), _0x76b337.appendChild(_0x4bdff6));
  const _0x5a5a56 = document.createElement('div');
  _0x5a5a56.className = 'preset-manager-editor-wrap';
  const _0x310c2b = document.createElement('div');
  ((_0x310c2b.className = 'preset-manager-textarea preset-manager-editor'),
    (_0x310c2b.contentEditable = 'true'),
    (_0x310c2b.spellcheck = false),
    (_0x310c2b.innerHTML = renderPresetTemplateEditorHtml(preset?.template || '')),
    _0x4bdff6.addEventListener('click', () => insertUserInputPill(_0x310c2b)));
  const _0xbf9f9d = buildPresetEditorPlaceholder();
  (_0x310c2b.addEventListener('input', () => syncPresetEditorPlaceholder(_0x310c2b, _0xbf9f9d)),
    _0x310c2b.addEventListener('blur', () => syncPresetEditorPlaceholder(_0x310c2b, _0xbf9f9d)),
    _0x5a5a56.addEventListener('click', () => {
      _0x310c2b.focus();
    }),
    _0x5a5a56.appendChild(_0x310c2b),
    _0x5a5a56.appendChild(_0xbf9f9d),
    syncPresetEditorPlaceholder(_0x310c2b, _0xbf9f9d));
  const _0x4d4f3d = buildPresetTriggerModeControl(preset?.triggerMode),
    _0x434a1d = buildPresetModalButton(promptPresetsText('editor.save'), 'preset-modal-btn-primary');
  return (
    _0x434a1d.addEventListener('click', async () => {
      const _0xecebe3 = _0x3fc429.value.trim(),
        _0x3bd4cf = serializePresetTemplateEditorHtml(_0x310c2b.innerHTML);
      if (!_0xecebe3) {
        (showPresetManagerToast(promptPresetsText('editor.titleRequired'), 'warn'), _0x3fc429.focus());
        return;
      }
      if (!_0x3bd4cf) {
        (showPresetManagerToast(promptPresetsText('editor.templateRequired'), 'warn'), _0x310c2b.focus());
        return;
      }
      ((_0x434a1d.disabled = true), (_0x434a1d.textContent = promptPresetsText('editor.saving')));
      try {
        (await savePromptPresetToServer({
          nodeType: _0x130dd6,
          title: _0xecebe3,
          desc: _0xe23a33.value.trim(),
          template: _0x3bd4cf,
          triggerMode: _0x4d4f3d.getValue(),
          thumbnailDataUrl: String(preset?.thumbnailDataUrl || '').trim(),
          thumbLocalPath: String(preset?.thumbLocalPath || '').trim(),
          originalTitle: _0x3eac9b,
          installId: String(window.__aicInstallId || globalThis.__aicInstallId || '').trim(),
        }),
          await loadCustomPresets(),
          showPresetManagerToast(promptPresetsText('editor.saved'), 'success'),
          _0x497641?.({ title: _0xecebe3 }));
      } catch (_0x110d2b) {
        showPresetManagerToast(_0x110d2b?.message || promptPresetsText('editor.saveFailed'), 'error');
      } finally {
        ((_0x434a1d.disabled = false), (_0x434a1d.textContent = promptPresetsText('editor.save')));
      }
    }),
    _0x3b17e2.appendChild(_0x5f16a3),
    _0x3b17e2.appendChild(_0x2c0696),
    _0x3b17e2.appendChild(_0x76b337),
    _0x3b17e2.appendChild(_0x5a5a56),
    { element: _0x3b17e2, triggerModeControl: _0x4d4f3d.element, saveButton: _0x434a1d }
  );
}
export function openCustomPresetsManager({
  nodeType: _0x3b61cf,
  initialDraftTemplate: initialDraftTemplate = '',
} = {}) {
  const _0x2f8e15 = String(initialDraftTemplate || '').trim();
  let _0x15d6d4 = normalizePresetManagerNodeType(_0x3b61cf || getDefaultQuickCapturePresetNodeType());
  closeActivePresetManager?.();
  const _0x3446a8 = document.createElement('div');
  _0x3446a8.className = 'preset-modal-overlay';
  const _0x1763c1 = () => {
    (_0x3446a8.remove(),
      activePresetManagerOverlay === _0x3446a8 &&
        ((activePresetManagerOverlay = null), (closeActivePresetManager = null)));
  };
  const _0x431cfe = document.createElement('div');
  ((_0x431cfe.className = 'preset-modal preset-modal--manager'),
    _0x431cfe.addEventListener('click', (_0x1c3832) => _0x1c3832.stopPropagation()));
  const _0x15fddf = document.createElement('div');
  _0x15fddf.className = 'preset-manager-title-row';
  const _0x29214d = document.createElement('div');
  _0x29214d.className = 'preset-manager-title-group';
  const _0x3e573f = document.createElement('div');
  ((_0x3e573f.textContent = promptPresetsText('manager.title')),
    (_0x3e573f.className = 'preset-modal-title'));
  const _0x3f48ef = document.createElement('div');
  ((_0x3f48ef.className = 'preset-modal-desc'),
    (_0x3f48ef.textContent = getPresetManagerDesc(_0x15d6d4)),
    _0x29214d.appendChild(_0x3e573f),
    _0x29214d.appendChild(_0x3f48ef));
  const _0x51ec90 = buildPresetModalButton('×', 'preset-manager-close-btn');
  (_0x51ec90.setAttribute('aria-label', promptPresetsText('manager.close')),
    _0x51ec90.addEventListener('click', () => _0x1763c1()),
    _0x15fddf.appendChild(_0x29214d),
    _0x15fddf.appendChild(_0x51ec90));
  const _0xdb2f87 = document.createElement('div');
  ((_0xdb2f87.className = 'preset-manager-tabs'), _0xdb2f87.setAttribute('role', 'tablist'));
  const _0x474ba5 = new Map();
  let _0x3ee4c4 = false;
  PRESET_MANAGER_TABS.forEach((_0xd63ffe) => {
    const _0x3d71d0 = buildPresetModalButton('', 'preset-manager-tab');
    (_0x3d71d0.setAttribute('role', 'tab'),
      (_0x3d71d0.dataset.nodeType = _0xd63ffe.nodeType),
      _0x3d71d0.appendChild(buildPresetManagerTabIcon(_0xd63ffe.icon)));
    const _0x2eb9eb = document.createElement('span');
    ((_0x2eb9eb.textContent = getPresetManagerTabLabel(_0xd63ffe)), _0x3d71d0.appendChild(_0x2eb9eb));
    const _0x5f3a90 = document.createElement('span');
    ((_0x5f3a90.className = 'preset-manager-tab-star'),
      (_0x5f3a90.textContent = '★'),
      _0x5f3a90.setAttribute('aria-hidden', 'true'),
      _0x3d71d0.appendChild(_0x5f3a90),
      _0x3d71d0.addEventListener('click', () => {
        if (_0x15d6d4 === _0xd63ffe.nodeType) return;
        ((_0x15d6d4 = _0xd63ffe.nodeType), _0x5e7679());
      }),
      _0x3d71d0.addEventListener('contextmenu', async (_0x457218) => {
        (_0x457218.preventDefault(), _0x457218.stopPropagation());
        if (_0x3ee4c4) return;
        const _0x3a7e2b = getDefaultQuickCapturePresetNodeType();
        if (_0x3a7e2b === _0xd63ffe.nodeType) return;
        ((_0x3ee4c4 = true),
          (promptPresetSettings = {
            ...promptPresetSettings,
            defaultQuickCaptureNodeType: _0xd63ffe.nodeType,
          }),
          _0x5e7679());
        try {
          (await setDefaultQuickCapturePresetNodeType(_0xd63ffe.nodeType),
            showPresetManagerToast(
              promptPresetsText('manager.quickCaptureDefaultSet', {
                preset: getPresetManagerTabLabel(_0xd63ffe),
              }),
              'success',
            ));
        } catch (_0x46fd67) {
          ((promptPresetSettings = { ...promptPresetSettings, defaultQuickCaptureNodeType: _0x3a7e2b }),
            _0x5e7679(),
            showPresetManagerToast(
              _0x46fd67?.message || promptPresetsText('manager.quickCaptureDefaultFailed'),
              'error',
            ));
        } finally {
          _0x3ee4c4 = false;
        }
      }),
      _0x474ba5.set(_0xd63ffe.nodeType, { button: _0x3d71d0, star: _0x5f3a90 }),
      _0xdb2f87.appendChild(_0x3d71d0));
  });
  const _0x23e661 = document.createElement('div');
  _0x23e661.className = 'preset-manager-shell';
  const _0x48d877 = document.createElement('div');
  _0x48d877.className = 'preset-manager-sidebar';
  const _0x5a65ee = buildPresetModalButton(promptPresetsText('manager.new'), 'preset-manager-new-btn'),
    _0x5e5377 = document.createElement('div');
  ((_0x5e5377.className = 'preset-manager-list'),
    _0x48d877.appendChild(_0x5a65ee),
    _0x48d877.appendChild(_0x5e5377));
  const _0x4e44b4 = document.createElement('div');
  ((_0x4e44b4.className = 'preset-manager-detail-pane'),
    _0x23e661.appendChild(_0x48d877),
    _0x23e661.appendChild(_0x4e44b4));
  const _0x206d8c = document.createElement('div');
  _0x206d8c.className = 'preset-modal-actions';
  const _0x347663 = new Map(
      PRESET_MANAGER_TABS.map((_0xa82af0) => [
        _0xa82af0.nodeType,
        { selectedKey: '', draftPreset: null, draftCounter: 0 },
      ]),
    ),
    _0x2dd8f0 = (_0x3782eb) =>
      _0x347663.get(_0x3782eb) || { selectedKey: '', draftPreset: null, draftCounter: 0 },
    _0x38255e = (_0x5271ec) => 'saved:' + String(_0x5271ec?.title || ''),
    _0x3080b7 = (_0x27490c) => (_0x27490c ? 'draft:' + _0x27490c.id : ''),
    _0x5e7679 = () => {
      (_0x5e5377.replaceChildren(),
        _0x4e44b4.replaceChildren(),
        _0x206d8c.replaceChildren(),
        (_0x3f48ef.textContent = getPresetManagerDesc(_0x15d6d4)),
        _0x474ba5.forEach(({ button: _0x2b8395, star: _0x2981b7 }, _0x1a3f6c) => {
          const _0x215b2b = _0x1a3f6c === _0x15d6d4,
            _0x4c0c5f = _0x1a3f6c === getDefaultQuickCapturePresetNodeType(),
            _0x2d7f2a = PRESET_MANAGER_TABS.find((_0x5c2cbe) => _0x5c2cbe.nodeType === _0x1a3f6c),
            _0x4e7ab6 = _0x4c0c5f
              ? promptPresetsText('manager.quickCaptureDefaultAria', {
                  preset: getPresetManagerTabLabel(_0x2d7f2a),
                })
              : promptPresetsText('manager.quickCaptureSetAria', {
                  preset: getPresetManagerTabLabel(_0x2d7f2a),
                });
          (_0x2b8395.classList.toggle('is-active', _0x215b2b),
            _0x2b8395.classList.toggle('is-quick-capture-default', _0x4c0c5f),
            _0x2b8395.setAttribute('aria-selected', _0x215b2b ? 'true' : 'false'),
            _0x2b8395.setAttribute('aria-label', _0x4e7ab6),
            (_0x2b8395.title = _0x4e7ab6),
            (_0x2981b7.hidden = !_0x4c0c5f));
        }));
      const _0x149432 = _0x2dd8f0(_0x15d6d4),
        _0x4c86c9 = appStore.getStateRaw().subscription || {},
        _0x933d6a = isSubscriptionActive(_0x4c86c9),
        _0x256c91 = getCustomPromptPresets(_0x15d6d4),
        _0x43da20 = canCreateCustomPromptPreset(_0x15d6d4, _0x4c86c9),
        _0x2ce26b = [];
      _0x149432.draftPreset &&
        _0x2ce26b.push({
          key: _0x3080b7(_0x149432.draftPreset),
          preset: _0x149432.draftPreset,
          isDraft: true,
        });
      _0x256c91.forEach((_0x47d551) => {
        _0x2ce26b.push({ key: _0x38255e(_0x47d551), preset: _0x47d551, isDraft: false });
      });
      !_0x149432.selectedKey && _0x2ce26b.length > 0 && (_0x149432.selectedKey = _0x2ce26b[0].key);
      _0x149432.selectedKey &&
        _0x2ce26b.length > 0 &&
        !_0x2ce26b.some((_0x536522) => _0x536522.key === _0x149432.selectedKey) &&
        (_0x149432.selectedKey = _0x2ce26b[0].key);
      if (_0x2ce26b.length === 0) {
        const _0x665944 = document.createElement('div');
        ((_0x665944.className = 'preset-manager-empty'),
          (_0x665944.textContent = promptPresetsText('manager.emptyList')),
          _0x5e5377.appendChild(_0x665944));
      }
      _0x2ce26b.forEach(({ key: _0x380f8f, preset: _0x57a364, isDraft: _0x4e0df8 }) => {
        const _0x2e076b = document.createElement('div');
        (_0x2e076b.setAttribute('role', 'button'),
          (_0x2e076b.tabIndex = 0),
          (_0x2e076b.className = 'preset-manager-list-item'),
          _0x2e076b.classList.toggle('is-active', _0x380f8f === _0x149432.selectedKey),
          _0x2e076b.classList.toggle('has-trigger-badge', !_0x4e0df8),
          _0x2e076b.appendChild(
            buildPresetThumbnailControl({
              preset: _0x57a364,
              onUpload: (_0x32e4a9) => {
                ((_0x57a364.thumbnailDataUrl = _0x32e4a9),
                  (_0x57a364.thumbLocalPath = ''),
                  (_0x57a364.thumbUrl = ''),
                  (_0x149432.selectedKey = _0x380f8f),
                  showPresetManagerToast(promptPresetsText('thumbnail.updated'), 'success'),
                  _0x5e7679());
              },
            }),
          ));
        const _0x4cdf1d = document.createElement('span');
        _0x4cdf1d.className = 'preset-manager-list-text';
        const _0x313bd2 = document.createElement('span');
        ((_0x313bd2.className = 'preset-manager-list-title'),
          (_0x313bd2.textContent = _0x57a364?.title || getCustomPresetFallbackTitle()));
        const _0x1289c0 = document.createElement('span');
        ((_0x1289c0.className = 'preset-manager-list-desc'),
          (_0x1289c0.textContent =
            _0x57a364?.desc || _0x57a364?.template || promptPresetsText('presetDescFallback')),
          _0x4cdf1d.appendChild(_0x313bd2),
          _0x4cdf1d.appendChild(_0x1289c0),
          _0x2e076b.appendChild(_0x4cdf1d));
        if (!_0x4e0df8) {
          const _0x4b1407 = document.createElement('span');
          ((_0x4b1407.className = 'preset-manager-list-trigger-badge'),
            (_0x4b1407.textContent = getPromptPresetTriggerModeLabel(_0x57a364)),
            _0x2e076b.appendChild(_0x4b1407));
        }
        (_0x2e076b.addEventListener('click', () => {
          ((_0x149432.selectedKey = _0x380f8f), _0x5e7679());
        }),
          _0x2e076b.addEventListener('keydown', (_0x44ce62) => {
            if (_0x44ce62.key !== 'Enter' && _0x44ce62.key !== ' ') return;
            (_0x44ce62.preventDefault(), (_0x149432.selectedKey = _0x380f8f), _0x5e7679());
          }));
        const _0x4651ee = buildPresetModalButton('×', 'preset-manager-list-delete');
        (_0x4651ee.setAttribute(
          'aria-label',
          promptPresetsText('manager.deleteAria', {
            title: _0x57a364?.title || getCustomPresetFallbackTitle(),
          }),
        ),
          _0x4651ee.addEventListener('click', async (_0x5e2e0a) => {
            (_0x5e2e0a.preventDefault(), _0x5e2e0a.stopPropagation(), (_0x4651ee.disabled = true));
            if (_0x4e0df8) {
              _0x149432.draftPreset = null;
              _0x149432.selectedKey === _0x380f8f && (_0x149432.selectedKey = '');
              _0x5e7679();
              return;
            }
            try {
              (await deletePromptPresetFromServer({
                nodeType: _0x15d6d4,
                title: String(_0x57a364?.title || ''),
              }),
                await loadCustomPresets(),
                showPresetManagerToast(promptPresetsText('delete.deleted'), 'success'),
                _0x149432.selectedKey === _0x380f8f && (_0x149432.selectedKey = ''),
                _0x5e7679());
            } catch (_0x32b3de) {
              (showPresetManagerToast(_0x32b3de?.message || promptPresetsText('delete.failed'), 'error'),
                (_0x4651ee.disabled = false));
            }
          }),
          _0x2e076b.appendChild(_0x4651ee),
          _0x5e5377.appendChild(_0x2e076b));
      });
      if (_0x933d6a) {
        const _0x116fe8 = document.createElement('div');
        ((_0x116fe8.className = 'preset-manager-status'),
          (_0x116fe8.textContent = promptPresetsText('manager.authorized')),
          _0x206d8c.appendChild(_0x116fe8));
      }
      const _0x1ea44f = _0x2ce26b.find((_0x129c41) => _0x129c41.key === _0x149432.selectedKey);
      if (_0x1ea44f) {
        const _0x586902 = createPresetEditor({
          nodeType: _0x15d6d4,
          preset: _0x1ea44f.preset,
          isDraft: _0x1ea44f.isDraft,
          onSaved: ({ title: _0x54b2ac } = {}) => {
            ((_0x149432.draftPreset = null),
              (_0x149432.selectedKey = 'saved:' + String(_0x54b2ac || '').trim()),
              _0x5e7679());
          },
        });
        (_0x4e44b4.appendChild(_0x586902.element),
          _0x206d8c.appendChild(_0x586902.triggerModeControl),
          _0x206d8c.appendChild(_0x586902.saveButton));
      } else {
        const _0x4b3368 = document.createElement('div');
        ((_0x4b3368.className = 'preset-manager-detail-empty'),
          (_0x4b3368.textContent = promptPresetsText('manager.emptyDetail')),
          _0x4e44b4.appendChild(_0x4b3368));
      }
      _0x5a65ee.disabled = !_0x43da20;
      if (!_0x43da20) {
        const _0x3d0372 = document.createElement('div');
        ((_0x3d0372.className = 'preset-manager-limit'),
          (_0x3d0372.textContent = promptPresetsText('manager.freeLimit', {
            limit: FREE_CUSTOM_PRESET_LIMIT,
          })));
        const _0x5da392 = buildPresetModalButton(
          promptPresetsText('manager.activate'),
          'preset-modal-btn-secondary',
        );
        (_0x5da392.addEventListener('click', () => requestSubscriptionFromPresetManager(_0x3446a8)),
          _0x3d0372.appendChild(_0x5da392),
          _0x4e44b4.appendChild(_0x3d0372));
      }
    };
  if (_0x2f8e15) {
    const _0x2a6a1f = _0x347663.get(_0x15d6d4);
    ((_0x2a6a1f.draftCounter = 1),
      (_0x2a6a1f.draftPreset = {
        id: _0x2a6a1f.draftCounter,
        title: getUniqueDraftTitle(getCustomPromptPresets(_0x15d6d4)),
        desc: '',
        template: _0x2f8e15,
        triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      }),
      (_0x2a6a1f.selectedKey = 'draft:' + _0x2a6a1f.draftPreset.id));
  }
  return (
    _0x5a65ee.addEventListener('click', () => {
      const _0x4862fe = _0x2dd8f0(_0x15d6d4),
        _0x1d9a2b = appStore.getStateRaw().subscription || {};
      if (!canCreateCustomPromptPreset(_0x15d6d4, _0x1d9a2b)) {
        (showPresetManagerToast(
          promptPresetsText('manager.freeLimitToast', { limit: FREE_CUSTOM_PRESET_LIMIT }),
          'warn',
        ),
          requestSubscriptionFromPresetManager(_0x3446a8));
        return;
      }
      ((_0x4862fe.draftCounter += 1),
        (_0x4862fe.draftPreset = {
          id: _0x4862fe.draftCounter,
          title: getUniqueDraftTitle(getCustomPromptPresets(_0x15d6d4)),
          desc: '',
          template: '',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_DIRECT,
        }),
        (_0x4862fe.selectedKey = 'draft:' + _0x4862fe.draftPreset.id),
        _0x5e7679());
    }),
    _0x431cfe.appendChild(_0x15fddf),
    _0x431cfe.appendChild(_0xdb2f87),
    _0x431cfe.appendChild(_0x23e661),
    _0x431cfe.appendChild(_0x206d8c),
    _0x3446a8.appendChild(_0x431cfe),
    _0x5e7679(),
    _0x3446a8.addEventListener('mousedown', (_0x455733) => {
      _0x455733.target === _0x3446a8 && _0x1763c1();
    }),
    document.body.appendChild(_0x3446a8),
    (activePresetManagerOverlay = _0x3446a8),
    (closeActivePresetManager = _0x1763c1),
    _0x3446a8
  );
}
export async function openQuickCapturePromptPresetDraft(_0x4b7f2a) {
  await loadPromptPresetSettings();
  const _0x32af41 = getDefaultQuickCapturePresetNodeType(),
    _0x1b0a3e = _0x32af41 || 'ai-text',
    _0x4a5e8c = openCustomPresetsManager({
      nodeType: _0x1b0a3e,
      initialDraftTemplate: _0x4b7f2a,
    });
  return { overlay: _0x4a5e8c, nodeType: _0x1b0a3e, hasConfiguredDefault: Boolean(_0x32af41) };
}
