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
import { DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS } from './promptPresetCatalog/doubaoAudio1PromptPresets.js';
import { resolvePresetDefaultCoverDataUrl } from './presetCoverResolver.js';
import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { beginModalInteraction } from '../services/modalInteractionScope.js';
function promptPresetsText(value, item = {}) {
  return t('promptPresets.' + value, item);
}
function optionalPromptPresetsText(key, index = {}) {
  const result = 'promptPresets.' + key,
    t2 = t(result, index);
  return t2 === result ? '' : t2;
}
export const PROMPT_PRESET_TRIGGER_MODE_DIRECT = 'direct';
export const PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT = 'insertPrompt';
const PROMPT_PRESET_TRIGGER_MODES = new Set([
  PROMPT_PRESET_TRIGGER_MODE_DIRECT,
  PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
]);
function applyPromptPresetLeafTriggerMode(data, options) {
  return (Array['isArray'](data) ? data : [])['map']((args) => {
    const target = { ...args };
    return (
      Array['isArray'](args?.['subItems'])
        ? (target['subItems'] = applyPromptPresetLeafTriggerMode(args['subItems'], options))
        : (target['triggerMode'] = options),
      target
    );
  });
}
export const REVERSE_IMAGE_PROMPT_PRESET_TITLE = '反推图片提示词';
export const REVERSE_IMAGE_PROMPT_PRESET_PROMPT =
  '你是一名专业 AI 图像提示词反推工程师。\n\n我将上传一张图片，请你根据图片内容，反推出一段可以用于 AI 生图模型生成同款图片的提示词。\n\n要求：\n1. 不要只是普通描述图片，而是要写成“可直接用于 AI 生图”的提示词。\n2. 请完整分析画面中的：主体、人物数量、性别年龄、外貌特征、服装、发型、动作、姿态、表情、视线方向、手部动作。\n3. 请分析景别与构图：特写/近景/中景/全身/远景，正面/侧面/背影，俯拍/仰拍/平视，人物在画面中的位置，背景虚化程度。\n4. 请分析环境：室内/室外、地点、时间、天气、背景元素、前景/中景/远景。\n5. 请分析光线：自然光/棚拍光/逆光/侧光/柔光/硬光、光源方向、阴影、高光。\n6. 请分析色彩与氛围：主色调、冷暖、饱和度、对比度、情绪氛围。\n7. 请分析风格：真实摄影、电影感、杂志大片、日系写真、商业广告、动漫、3D、油画等。\n8. 请分析镜头语言：镜头焦段、景深、画质、胶片感、颗粒感、清晰度。\n9. 如果图片中有无法确定的信息，请根据画面合理推断，但不要编造明显不存在的元素。\n10. 最终请输出一段完整的中文提示词、一段英文提示词，以及一段反向提示词。\n\n\n输出格式如下：\n\n【画面拆解】\n主体：\n景别与构图：\n人物动作：\n表情与视线：\n服装与造型：\n场景环境：\n光线：\n色彩氛围：\n风格：\n镜头与画质：\n\n【中文完整提示词】\n把上面的信息整合成一段流畅、专业、可直接用于 AI 生图的中文提示词。\n\n【English Prompt】\nTranslate and optimize the prompt into natural English for AI image generation.\n\n【反向提示词】\n输出用于避免低质量、畸变、错误细节、文字水印等问题的中文反向提示词。';
export const MINIMAX_H3_FULL_CHARACTER_REPLACEMENT_PROMPT =
  '将 <Video 1> 中的主要人物完整替换为 <Picture 1> 中的人物，包括人物身份、面部、发型、身体特征、服装和配饰。\n\n新人物完整采用 <Picture 1> 的外貌与穿搭，但严格继承 <Video 1> 中原人物的动作、姿势、表演、走位、视线、表情、口型和动作时间。\n\n语音沿用 <Video 1> 原始音轨，不重新生成或修改。新人物的表情和口型逐帧匹配原人物并与原语音同步；不说话时自然闭口。\n\n完整保留原视频的镜头运动、构图、背景、场景、道具、环境光线、阴影、遮挡关系和剪辑节奏。服装在快速动作、转身和遮挡时保持结构稳定，人物面部在所有角度保持一致。\n\n忽略 <Picture 1> 的背景、姿势、光线和相机角度，不要将参考图背景带入视频。';
export const MINIMAX_H3_GENERAL_CHARACTER_REPLACEMENT_PROMPT =
  '以 <Video 1> 为基础进行人物替换。\n\n将视频中的主要人物完整替换为 <Picture 1> 中的人物。准确保留 <Picture 1> 中人物的面部身份、五官比例、脸型、发型、发色、肤色、年龄特征和身体比例。\n\n严格继承 <Video 1> 中原人物的全部动作、姿势、走位、头部转动、视线、表情变化、口型变化和动作节奏。保持原视频的镜头角度、景别、运镜、构图、场景、背景、光线、阴影、道具、遮挡关系和时间节奏不变。\n\n语音沿用 <Video 1> 原始音轨，不重新生成或修改。新人物的表情和口型逐帧匹配原人物并与原语音同步；不说话时自然闭口。\n\n替换后的人物自然融入原场景，身体与环境光线一致，面部在正脸、侧脸和快速运动中保持稳定。不要改变背景，不要增加人物，不要删除其他人物，不要改变原视频镜头，不要出现原人物面孔残留、双脸、五官漂移、身体变形或服装闪烁。';
export const MINIMAX_H3_CHARACTER_AND_BACKGROUND_REPLACEMENT_PROMPT =
  '将 <Video 1> 中的主要人物完整替换为 <Picture 1> 中的人物，包括人物身份、面部、发型、身体特征、服装和配饰。\n\n新人物完整采用 <Picture 1> 的外貌与穿搭，但严格继承 <Video 1> 中原人物的动作、姿势、表演、走位、视线、表情、口型和动作时间。\n\n同时，将 <Video 1> 的原背景和场景完整替换为 <Picture 1> 中的背景与场景，包括空间环境、家具、道具、材质、光线、色彩和整体视觉风格。人物始终在 <Picture 1> 的场景中完成原视频表演。\n\n语音沿用 <Video 1> 原始音轨，不重新生成或修改。新人物的表情和口型逐帧匹配原人物，并与原语音同步；不说话时自然闭口。\n\n完整保留 <Video 1> 的镜头运动、构图、景别、剪辑节奏和动作时间，但不要保留原视频的背景和场景。根据原视频的镜头变化，自然重建 <Picture 1> 背景的视角、透视、遮挡、环境光线和阴影，保持背景风格和空间结构连续稳定。\n\n服装在快速动作、转身和遮挡时保持结构稳定，人物面部在所有角度保持一致。人物与新背景自然融合，保持正确的空间关系、接触阴影和环境光照。\n\n忽略 <Picture 1> 中人物原本的姿势，只参考其中的人物形象、服装、背景和场景。不要带入 <Video 1> 的原人物外貌、服装、背景和场景。';
export const MINIMAX_H3_UNIVERSAL_OBJECT_REPLACEMENT_PROMPT =
  '以 <Video 1> 为基础进行局部物体替换。\n\n将视频中的【原物体及其位置特征】完整替换为 <Picture 1> 中的【新物体】。准确保留新物体的形状、结构、比例、材质、颜色、纹理、图案、标识和细节。\n\n新物体严格继承原物体在 <Video 1> 中的位置、尺寸、朝向、透视、运动轨迹、速度、旋转、形变状态以及与人物和环境的互动关系。\n\n完整保留原视频中的人物、场景、背景、镜头、构图、运镜、光线、阴影、反射、遮挡、景深、动作节奏和音频。根据原场景的光照和透视自然重建新物体的阴影、反射和接触关系。\n\n只替换指定物体。不要改变人物身份、面部、服装、动作和身体；不要改变其他物体；不要带入 <Picture 1> 的背景、手部、人物、姿势或光线；不要出现原物体残留、物体融合、尺寸漂移、纹理闪烁、穿模、悬浮、复制或额外物体。';
export const MINIMAX_H3_HANDHELD_ITEM_REPLACEMENT_PROMPT =
  '将 <Video 1> 中人物右手握着的黑色手机，完整替换为 <Picture 1> 中的红色饮料罐。\n\n准确保留饮料罐的圆柱结构、尺寸比例、红色金属材质、标签、拉环和表面高光。饮料罐严格继承原手机的位置、移动轨迹、速度和朝向，同时根据新物体形状自然调整人物右手的握持方式。\n\n保持手掌、手腕、手指数量和关节结构正确。手指自然环绕饮料罐，拇指位于罐体一侧，其他手指产生正确遮挡和接触阴影。物体不得穿过手掌，不得悬浮，不得粘连或复制。\n\n完整保留人物身份、面部、发型、服装、身体动作、背景、镜头、光线和音频。只替换手中的物体，不要改变人物，不要带入参考图中的手、人物和背景，不要出现多余手指、原物体残留或标签闪烁。';
export const MINIMAX_H3_VEHICLE_REPLACEMENT_PROMPT =
  '将 <Video 1> 中正在道路上行驶的白色轿车，完整替换为 <Picture 1> 中的黑色越野车。\n\n准确保留新车辆的车身结构、车型比例、前脸、车灯、轮毂、车漆、车窗、标识和材质细节。新车辆继承原车辆的行驶路线、速度、转向、刹车、车身起伏和镜头中的空间位置。\n\n车轮与道路正确接触并按照行驶速度自然旋转，车辆运动符合真实物理规律。根据原场景重新生成车漆反射、玻璃反射、车身阴影、轮胎阴影和运动模糊。\n\n保持道路、驾驶员、其他车辆、行人、建筑、天气、镜头运动、构图和音频不变。只替换指定车辆，不要改变道路和其他车辆，不要出现车轮滑动、车身漂移、尺寸突变、车牌乱码或原车辆残留。';
export const MINIMAX_H3_MULTI_PERSON_REPLACEMENT_PROMPT =
  '以 <Video 1> 为基础进行双人物同步替换。<Picture 1> 只用于定义两个替换角色的外观，忽略参考图中的背景、墙面、阴影、姿势、动作、构图和光线。\n\n角色定义：\n<Subject 1> 是 <Picture 1> 左侧的银色头部、红蓝银配色角色，保留其头部造型、面部结构、胸前发光装置、服装配色、身体比例和全部外观细节。\n\n<Subject 2> 是 <Picture 1> 右侧的黑银色装甲角色，保留其尖锐头部轮廓、黑银装甲结构、胸前红色装置、身体比例、材质和全部外观细节。\n\n人物对应关系：\n将 <Video 1> 中位于前景中央、穿米色毛衣的男子完整替换为 <Subject 1>。\n\n将 <Video 1> 中位于画面右后方、靠近墙壁、穿黑色衣服的男子完整替换为 <Subject 2>。\n\n两名替换角色分别严格继承各自对应原人物的空间位置、身体动作、姿势、手势、头部转动、视线方向、表情节奏、口型变化、走位、运动轨迹和遮挡关系。\n\n语音沿用 <Video 1> 原始音轨，不重新生成或修改。<Subject 1> 和 <Subject 2> 的表情和口型分别逐帧匹配对应原人物及对白时间，禁止串用；不说话时自然闭口。\n\n保持两个人物的对应关系从视频开始到结束始终不变：\n前景人物始终是 <Subject 1>；\n右后方人物始终是 <Subject 2>。\n禁止两名角色身份交换、外观融合、服装互换或在不同帧中互相变成对方。\n\n完整保留 <Video 1> 的场景、墙壁、光线、窗户投影、背景、镜头角度、构图、运镜、景深、剪辑节奏和原始音频。根据原视频光线自然生成两名角色的高光、阴影、墙面投影和环境反射，使其自然融入现场。\n\n只替换这两名指定人物。不要增加第三个人物，不要保留原人物的脸、头发或服装，不要带入 <Picture 1> 的背景。不要出现双脸、原人物残留、角色复制、身份串位、装甲融合、肢体变形、材质闪烁、穿模或人物位置改变。';
export const MINIMAX_H3_CLOTHING_ONLY_REPLACEMENT_PROMPT =
  '以 <Video 1> 为基础进行人物换装。\n\n仅将 <Picture 1> 中的衣服穿到 <Video 1> 的主要人物身上。准确保留衣服的款式、版型、颜色、材质、纹理、图案、领口、袖口、纽扣、装饰和标识。\n\n完整保留 <Video 1> 中人物原本的身份、面部、五官、发型、肤色、年龄、体型和身体比例，不得替换人物，不得参考 <Picture 1> 中的模特、人体、姿势、背景、光线和构图。\n\n完整保留原视频的动作、表情、走位、镜头、构图、场景、背景、道具、光线、阴影、剪辑节奏和音频。\n\n只替换人物原来的衣服，其他内容全部保持不变。不要改变人物面孔和身体，不要带入参考图中的模特或背景，不要出现原衣服残留、双层衣服、衣服穿模、身体变形、纹理闪烁、图案漂移或多余肢体。';
export const MINIMAX_H3_CLOTHING_AND_HAIRSTYLE_REPLACEMENT_PROMPT =
  '以 <Video 1> 为基础，仅替换主要人物的衣服和发型。\n\n人物穿着 <Picture 1> 中的完整服装，并采用其中的发型、发色、头发长度和造型。衣服自然贴合身体并随动作产生合理的褶皱和摆动；发型适配人物头型，在运动中保持稳定。\n\n严格保留原视频人物的身份、面孔、五官、脸型、肤色、体型、表情、动作和走位。仅参考 <Picture 1> 的服装与发型，忽略其中的人脸、身体、姿势、背景和光线。\n\n保持原视频的镜头、场景、构图、道具、光影、节奏和音频不变。不要改变人物长相，不要出现身份融合、原服装残留、双层衣服、穿模或纹理闪烁。';
export const MINIMAX_H3_REPLACE_ONE_OF_TWO_PEOPLE_PROMPT =
  '将 <Video 1> 中位于画面左侧、穿黑色上衣的人物替换为 <Picture 1> 中的人物。\n\n画面右侧人物必须完整保留，身份、面部、服装、动作和位置均不得改变。新人物严格继承左侧原人物的动作、表情、视线、口型、走位及与右侧人物的互动。\n\n语音沿用 <Video 1> 原始音轨，不重新生成或修改。左侧新人物的表情和口型逐帧匹配左侧原人物及对白时间；右侧人物的口型和语音保持不变，不说话时自然闭口。\n\n保持原视频的镜头、背景、灯光、道具、遮挡、空间关系、对白时间和音频不变。只替换指定的左侧人物，不要交换两个人的身份，不要让两张脸融合。';
export const HAILUO_H3_STANDARD_PROMPT =
  'subject_definitions:\n<Subject 1> 是 <Picture 1> 中的林夏，25岁中国女性，肩长黑发，面色苍白，穿湿润的米色风衣。完整保留她的面部身份、发型、年龄特征、服装颜色和身材比例。\n<Subject 2> 是 <Picture 2> 中的周沉，28岁中国男性，短黑发，轮廓消瘦，穿黑色旧外套。完整保留他的面部身份、发型、冷淡表情、服装和身材比例。\n<Subject 3> 是 <Picture 3> 中的废弃医院走廊，保留剥落的墙皮、闪烁灯管、绿色墙裙、积水地面、废弃病床和走廊尽头的全身镜。\n\nsummary:\n[reference generation] 目标视频是一段15秒双人悬疑短剧。<Subject 1> 在 <Subject 3> 中遇见本应已经死亡的 <Subject 2>。两人经过四句简短对话后，<Subject 2> 揭示真正死亡的人是 <Subject 1>，并通过镜中没有她的倒影完成剧情反转。\n\nretention_analysis:\n<Subject 1> (出现在 [Shot 1]、[Shot 2]、[Shot 3]): fully_preserved - 始终保留林夏的面部身份、黑色肩长发、米色风衣和年轻女性外形，情绪从震惊逐渐转为恐惧。\n<Subject 2> (出现在 [Shot 1]、[Shot 2]、[Shot 3]): fully_preserved - 始终保留周沉的面部身份、短黑发、黑色旧外套和冷淡克制的神态。\n<Subject 3> (出现在 [Shot 1]、[Shot 2]、[Shot 3]): fully_preserved - 保留医院走廊的空间结构、绿色墙裙、积水、闪烁灯管和尽头的全身镜。\n\ndetailed_description:\n目标视频采用真人电影质感、冷色悬疑风格和低照度照明，竖屏构图，浅景深，人物动作自然克制。\n\n[Shot 1] 中景镜头建立 <Subject 3>。闪烁的灯光映在积水地面上，<Subject 1> 林夏站在画面前景，湿润的米色风衣紧贴肩膀。<Subject 2> 周沉从走廊尽头的阴影中缓慢走出。镜头以较小幅度缓慢推向林夏。林夏（S1）盯着周沉，声音颤抖地问：<d>[Chinese] 你不是三年前就死了吗？</d>\n\n[Shot 2] At 00:04.500，镜头切至 <Subject 2> 的面部近景。周沉停在一盏闪烁的灯管下，半张脸藏在阴影中。他（S2）平静回答：<d>[Chinese] 你认错尸体了。</d> 镜头迅速切回林夏。她握紧手电筒，向前迈出半步，追问：<d>[Chinese] 那棺材里的人是谁？</d>\n\n[Shot 3] At 00:09.500，镜头切至周沉的正面特写。他没有立刻回答，而是把目光缓慢移向林夏身后的全身镜。周沉（S2）低声说：<d>[Chinese] 棺材里的人，是你。</d> 镜头以较小幅度缓慢环绕林夏，最终对准走廊尽头的镜子。镜中清晰映出周沉、灯光和废弃病床，却没有林夏的倒影。林夏低头看见自己手腕上的白色停尸标签，瞳孔骤然放大。灯光完全熄灭，画面立即切黑。\n\noverall_soundscape:\n暴雨敲打破损的窗户，老旧灯管持续发出电流噪声。空旷走廊中回荡着脚步、积水踩踏声、衣料摩擦声和林夏逐渐急促的呼吸。最后一句对白结束后，所有环境声突然停止。\n\nnon_diegetic_music:\n缓慢、稀疏的钢琴单音贯穿前两个镜头，低沉的大提琴长音逐渐增强。镜中显露真相时加入一次短促的低频冲击，画面切黑后音乐立即停止。';
export const HAILUO_H3_AUDIO_PROMPT_VIDEO_PROMPT =
  '根据提示词【视频内容】生成视频，并以 <Audio 1> 作为原始语音。画面内容、人物表演和镜头节奏跟随语音推进。';
export const HAILUO_H3_AUDIO_IMAGE_LIP_SYNC_PROMPT =
  '让 <Picture 1> 中的【指定人物】按照提示词【动作和运镜】进行表演，并跟随 <Audio 1> 说话，口型、表情和节奏与语音准确同步。';
export const HAILUO_H3_AUDIO_VIDEO_LIP_SYNC_PROMPT =
  '让 <Video 1> 中的【指定人物】跟随 <Audio 1> 说话，口型、表情和说话节奏与语音准确同步；停顿时自然闭口。直接使用 <Audio 1> 的原始语音，不改变台词、音色、语速和情绪。';
export const HAILUO_H3_AUDIO_IMAGE_VIDEO_MOTION_TRANSFER_PROMPT =
  '以 <Picture 1> 提供人物、背景和整体画面，将 <Video 1> 中的人物动作和运镜迁移到参考图，并让人物跟随 <Audio 1> 说话，口型、表情和节奏与语音准确同步。';
const TEMPLATES = {
    SceneReference:
      '{用户输入}, 生成一张四宫格场景图（没有人物）包含（顶视图 (Plan View)，轴测图/45° 俯视图 (Axonometric View)，2个多个正交立面图 (Elevations)）',
    SceneNineView:
      '根据用户输入的场景描述或上传的参考图，生成一张3×3九宫格场景设定图。\n\n九张图必须表现同一个连续、完整的场景。若提供参考图，以参考图中的空间结构、物体造型、家具位置、门窗位置、材质、颜色、灯光和整体风格为主要依据。参考图未展示的区域只进行最小合理补全，不得随意重新设计场景。\n\n九格固定顺序：\n\n1. 正面视角\n2. 左前方45°\n3. 右前方45°\n4. 左侧视角\n5. 右侧视角\n6. 后方视角\n7. 入口视角\n8. 高空45°俯视\n9. 正交俯视平面布局图\n\n前八格只改变摄影机位置，不改变场景。所有画面中的空间比例、门窗、建筑、家具、主要物体、物品数量、颜色、材质、灯光、天气和物品分布必须保持一致。\n\n第八格是高处45度斜俯视，不是垂直俯视。\n\n第九格必须是与前八格严格对应的二维正交平面布局图。室内场景表现墙体、门窗、房间、家具和入口；户外场景表现建筑、道路、地形、设施和出入口。使用简洁中文标注主要区域。\n\n严格3×3等尺寸排版，每格有细边框和白色中文标题栏。标题依次为：正面视角、左前方45°、右前方45°、左侧视角、右侧视角、后方视角、入口视角、高空45°俯视、平面布局图。\n\n禁止九个不同场景、重复视角、物体随机移动、左右关系颠倒、错误镜像、跨格画面、平面图与场景不一致、中文乱码和英文标签。\n\n{{用户输入}}',
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
    characterFrontBackViewFace:
      '专业角色素材分页布局。左侧则展示角色脸部的大面积高细节特写肖像，突出发型、眼、肤质、妆容及表情。右侧展示同一女性角色的两个全身图，分别为正面和背面视角，重点呈现服装、轮廓、比例及靴子，头部被裁剪，不要显示头部，以突出身体与服饰设计。背景为干净的白色无缝设计，采用极简风格，现代编辑排版，留白整洁\n\n{用户输入}',
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
  staticPromptTemplate = (text) => ({
    type: PROMPT_PRESET_TEMPLATE_TYPE_STATIC,
    text: text,
    requireInput: true,
    emptyInputMessage: IMAGE_PRESET_EMPTY_INPUT_MESSAGE,
  }),
  storyboardInsertPromptPreset = ({ templateKey: templateKey, title: title, desc: desc }) => ({
    icon: '🎬',
    title: title,
    desc: desc,
    triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
    template: staticPromptTemplate(STORYBOARD_PROMPT_TEMPLATES[templateKey]),
  });
function localizePromptPresetTemplate(args2, source = '') {
  const next = source ? optionalPromptPresetsText('presets.' + source + '.template') : '';
  if (typeof args2 === 'string') return next || args2;
  if (!args2 || typeof args2 !== 'object') return args2;
  const response = { ...args2 };
  next && response['type'] === PROMPT_PRESET_TEMPLATE_TYPE_STATIC && (response['text'] = next);
  if (response['type'] === PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT) {
    const current = source
        ? optionalPromptPresetsText('presets.' + source + '.imageInputTemplate')
        : '',
      entry = source ? optionalPromptPresetsText('presets.' + source + '.textInputTemplate') : '';
    (current && (response['imageInputTemplate'] = current),
      entry && (response['textInputTemplate'] = entry));
  }
  const record = String(response['emptyInputMessage'] || '');
  if (record === IMAGE_PRESET_EMPTY_INPUT_MESSAGE)
    response['emptyInputMessage'] = promptPresetsText('emptyInput.image');
  else
    record === TEMPLATES['Panorama360Seamless']['emptyInputMessage'] &&
      (response['emptyInputMessage'] = promptPresetsText('emptyInput.panorama'));
  return response;
}
function localizePromptPresetItem(args3 = {}) {
  const payload = String(args3?.['title'] || ''),
    handle = PROMPT_PRESET_TITLE_I18N_KEYS[payload] || '',
    state = { ...args3 };
  if (payload) state['title'] = getLocalizedPresetTitle(payload);
  return (
    Object['prototype']['hasOwnProperty']['call'](args3, 'desc') &&
      (state['desc'] = getLocalizedPresetDesc(payload, args3['desc'])),
    Array['isArray'](args3['subItems']) &&
      (state['subItems'] = args3['subItems']['map'](localizePromptPresetItem)),
    Object['prototype']['hasOwnProperty']['call'](args3, 'template') &&
      (state['template'] = localizePromptPresetTemplate(args3['template'], handle)),
    state
  );
}
function localizePromptPresetItems(list = []) {
  return (Array['isArray'](list) ? list : [])['map'](localizePromptPresetItem);
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
          template: staticPromptTemplate(TEMPLATES['SceneReference']),
        },
        {
          icon: '▦',
          title: '场景九视图',
          desc: '同一场景的 9 个连续多视角设定图',
          template: staticPromptTemplate(TEMPLATES['SceneNineView']),
        },
        {
          icon: '🌐',
          title: '360°无缝全景图',
          desc: '生成适合 VR 查看的一张无缝 360° 全景图',
          template: TEMPLATES['Panorama360Seamless'],
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
          template: staticPromptTemplate(TEMPLATES['characterRef3View']),
        },
        {
          icon: '🧍',
          title: '人物三视图+脸部',
          desc: '带脸部特写的三视图',
          template: staticPromptTemplate(TEMPLATES['characterRef3ViewFace']),
        },
        {
          icon: '🧍',
          title: '前后视图+脸部',
          desc: '脸部特写与无头前后全身视图',
          template: staticPromptTemplate(TEMPLATES['characterFrontBackViewFace']),
        },
        {
          icon: '🧍',
          title: '人设解析图',
          desc: '包含细节拆解的设定集',
          template: staticPromptTemplate(TEMPLATES['characterRefAnalysis']),
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
          template: staticPromptTemplate(TEMPLATES['multiGrid4']),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="4" height="4"></rect><rect x="10" y="3" width="4" height="4"></rect><rect x="17" y="3" width="4" height="4"></rect><rect x="3" y="10" width="4" height="4"></rect><rect x="10" y="10" width="4" height="4"></rect><rect x="17" y="10" width="4" height="4"></rect><rect x="3" y="17" width="4" height="4"></rect><rect x="10" y="17" width="4" height="4"></rect><rect x="17" y="17" width="4" height="4"></rect></svg>',
          title: '9宫格',
          desc: '3x3 更细动作与情绪递进',
          template: staticPromptTemplate(TEMPLATES['multiGrid9']),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 3h18v18H3z"></path><path d="M7.5 3v18"></path><path d="M12 3v18"></path><path d="M16.5 3v18"></path><path d="M3 7.5h18"></path><path d="M3 12h18"></path><path d="M3 16.5h18"></path></svg>',
          title: '16宫格',
          desc: '4x4 更密的节奏推进与镜头切换',
          template: staticPromptTemplate(TEMPLATES['multiGrid16']),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 3h18v18H3z"></path><path d="M6.6 3v18"></path><path d="M10.2 3v18"></path><path d="M13.8 3v18"></path><path d="M17.4 3v18"></path><path d="M3 6.6h18"></path><path d="M3 10.2h18"></path><path d="M3 13.8h18"></path><path d="M3 17.4h18"></path></svg>',
          title: '25宫格',
          desc: '5x5 长连续剧情，适合完整片段',
          template: staticPromptTemplate(TEMPLATES['multiGrid25']),
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
          template: staticPromptTemplate(TEMPLATES['storyboardVertical']),
        },
        {
          icon: '🎬',
          title: '竖版故事分镜+场景',
          desc: '竖版分镜，包含场景设定参考',
          template: staticPromptTemplate(TEMPLATES['storyboardVerticalScene']),
        },
        {
          icon: '🎬',
          title: '横版故事分镜',
          desc: '横版分镜，从左到右推进',
          template: staticPromptTemplate(TEMPLATES['storyboardHorizontal']),
        },
        {
          icon: '🎬',
          title: '横版故事分镜+场景',
          desc: '横版分镜，包含场景设定参考',
          template: staticPromptTemplate(TEMPLATES['storyboardHorizontalScene']),
        },
        ...STORYBOARD_INSERT_PROMPT_PRESETS['map'](storyboardInsertPromptPreset),
      ],
    },
  ],
  'ai-text': [
    {
      icon: '🖼️',
      title: REVERSE_IMAGE_PROMPT_PRESET_TITLE,
      desc: '根据参考图反推出中英文生图提示词',
      triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      template: REVERSE_IMAGE_PROMPT_PRESET_PROMPT,
    },
    { icon: '📝', title: '长篇精缩V1', desc: '一键把长篇内容精缩成短篇', template: TEMPLATES['longToShort'] },
    {
      icon: '📝',
      title: '提取人物场景道具信息',
      desc: '提取文本中的人物、场景、道具信息',
      template: TEMPLATES['extractInfo'],
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
          template: TEMPLATES['Storyboard1'],
        },
        {
          icon: '📝',
          title: '影视级叙事分镜脚本-秒级',
          desc: '精确到秒的光影渲染、运镜与音效控制，专为AI短剧视频量身定制',
          template: TEMPLATES['Storyboard2'],
        },
        {
          icon: '🎬',
          title: 'Seedance2.0视频格式',
          desc: '按用户秒数或默认15秒输出 Seedance 2.0 秒级视频提示词',
          template: TEMPLATES['Seedance2VideoFormat'],
        },
      ],
    },
  ],
  'ai-video': [
    {
      icon: '🎬',
      title: '海螺H3',
      desc: '标准视频生成提示词预设',
      subItems: [
        {
          icon: '📝',
          title: '标准提示词',
          desc: '15秒双人悬疑短剧参考生成示例',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: HAILUO_H3_STANDARD_PROMPT,
        },
      ],
    },
    {
      icon: '🎬',
      title: '海螺H3 视频编辑',
      desc: '人物替换提示词预设',
      subItems: [
        {
          icon: '🧍',
          title: '完整人物替换',
          desc: '完整替换人物外貌与穿搭',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_FULL_CHARACTER_REPLACEMENT_PROMPT,
        },
        {
          icon: '🧍',
          title: '通用人物替换',
          desc: '通用人物身份与动作继承提示词',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_GENERAL_CHARACTER_REPLACEMENT_PROMPT,
        },
        {
          icon: '🖼️',
          title: '人物+背景替换',
          desc: '保留参考图人物与场景并迁移动作',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_CHARACTER_AND_BACKGROUND_REPLACEMENT_PROMPT,
        },
        {
          icon: '🔄',
          title: '万能换物提示词',
          desc: '局部替换指定物体并保持场景',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_UNIVERSAL_OBJECT_REPLACEMENT_PROMPT,
        },
        {
          icon: '🥤',
          title: '手持物品替换',
          desc: '替换手中物品并保持自然握持',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_HANDHELD_ITEM_REPLACEMENT_PROMPT,
        },
        {
          icon: '🚙',
          title: '车辆替换',
          desc: '替换行驶车辆并保持物理运动',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_VEHICLE_REPLACEMENT_PROMPT,
        },
        {
          icon: '👥',
          title: '多人替换',
          desc: '同步替换两名指定人物',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_MULTI_PERSON_REPLACEMENT_PROMPT,
        },
        {
          icon: '👕',
          title: '仅衣服替换',
          desc: '只替换主要人物服装',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_CLOTHING_ONLY_REPLACEMENT_PROMPT,
        },
        {
          icon: '💇',
          title: '衣服+发型替换',
          desc: '只替换主要人物服装与发型',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_CLOTHING_AND_HAIRSTYLE_REPLACEMENT_PROMPT,
        },
        {
          icon: '👤',
          title: '双人替换其中一个',
          desc: '只替换画面左侧指定人物',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: MINIMAX_H3_REPLACE_ONE_OF_TWO_PEOPLE_PROMPT,
        },
      ],
    },
    {
      icon: '🎙️',
      title: '海螺H3 语音驱动',
      desc: '语音驱动视频提示词预设',
      subItems: [
        {
          icon: '🎬',
          title: '语音＋提示词生成视频',
          desc: '使用语音时间轴和提示词生成视频画面',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: HAILUO_H3_AUDIO_PROMPT_VIDEO_PROMPT,
        },
        {
          icon: '🖼️',
          title: '语音＋图像生成对口型视频',
          desc: '参考图人物按语音精准对口型',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: HAILUO_H3_AUDIO_IMAGE_LIP_SYNC_PROMPT,
        },
        {
          icon: '🎞️',
          title: '语音＋视频生成人物对口型视频',
          desc: '保持原视频画面并同步指定人物口型',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: HAILUO_H3_AUDIO_VIDEO_LIP_SYNC_PROMPT,
        },
        {
          icon: '🔄',
          title: '语音＋图像＋视频动作迁移',
          desc: '参考图提供视觉，参考视频提供动作和运镜',
          triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
          template: HAILUO_H3_AUDIO_IMAGE_VIDEO_MOTION_TRANSFER_PROMPT,
        },
      ],
    },
  ],
  'ai-audio': [
    {
      icon: '🎧',
      title: '豆包音频1.0',
      desc: '影视级对白、配乐、环境声与拟音模板',
      subItems: applyPromptPresetLeafTriggerMode(
        DOUBAO_AUDIO_1_0_PROMPT_PRESET_GROUPS,
        PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      ),
    },
  ],
};
let customPresets = {},
  promptPresetSettings = { defaultQuickCaptureNodeType: '' },
  promptPresetSettingsLoaded = false,
  promptPresetSettingsLoadPromise = null,
  activePresetManagerOverlay = null,
  closeActivePresetManager = null;
const SUPPORTED_PRESET_NODE_TYPES = new Set([
    'ai-image',
    'ai-text',
    'ai-video',
    'ai-audio',
    'storyboard-script',
  ]),
  PRESET_MANAGER_TABS = [
    { nodeType: 'ai-text', label: '文本预设', desc: '管理 文本节点 的生成预设', icon: 'text' },
    { nodeType: 'ai-image', label: '图像预设', desc: '管理 图像节点 的生成预设', icon: 'image' },
    { nodeType: 'ai-video', label: '视频预设', desc: '管理 视频节点 的生成预设', icon: 'video' },
    { nodeType: 'ai-audio', label: '音频预设', desc: '管理 音频节点 的生成预设', icon: 'audio' },
    {
      nodeType: 'storyboard-script',
      label: '分镜脚本预设',
      desc: '管理 分镜脚本节点 的生成预设',
      icon: 'text',
    },
  ],
  USER_INPUT_PLACEHOLDER = PROMPT_PRESET_USER_INPUT_PLACEHOLDER,
  NODE_TYPE_I18N_KEYS = Object['freeze']({
    'ai-image': 'image',
    'ai-text': 'text',
    'ai-video': 'video',
    'ai-audio': 'audio',
    'storyboard-script': 'storyboardScript',
  }),
  PROMPT_PRESET_TITLE_I18N_KEYS = Object['freeze']({
    场景参考: 'sceneReferenceGroup',
    场景四视图: 'sceneFourView',
    场景九视图: 'sceneNineView',
    '360°无缝全景图': 'panorama360',
    人设参考: 'characterReferenceGroup',
    人物三视图: 'characterThreeView',
    '人物三视图+脸部': 'characterThreeViewFace',
    '前后视图+脸部': 'characterFrontBackViewFace',
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
    海螺H3: 'hailuoH3Group',
    标准提示词: 'hailuoH3StandardPrompt',
    '海螺H3 视频编辑': 'minimaxH3Group',
    完整人物替换: 'minimaxH3FullCharacterReplacement',
    通用人物替换: 'minimaxH3GeneralCharacterReplacement',
    '人物+背景替换': 'minimaxH3CharacterAndBackgroundReplacement',
    万能换物提示词: 'minimaxH3UniversalObjectReplacement',
    手持物品替换: 'minimaxH3HandheldItemReplacement',
    车辆替换: 'minimaxH3VehicleReplacement',
    多人替换: 'minimaxH3MultiPersonReplacement',
    仅衣服替换: 'minimaxH3ClothingOnlyReplacement',
    '衣服+发型替换': 'minimaxH3ClothingAndHairstyleReplacement',
    双人替换其中一个: 'minimaxH3ReplaceOneOfTwoPeople',
    '海螺H3 语音驱动': 'hailuoH3AudioDrivenGroup',
    '语音＋提示词生成视频': 'hailuoH3AudioPromptVideo',
    '语音＋图像生成对口型视频': 'hailuoH3AudioImageLipSync',
    '语音＋视频生成人物对口型视频': 'hailuoH3AudioVideoLipSync',
    '语音＋图像＋视频动作迁移': 'hailuoH3AudioImageVideoMotionTransfer',
    '豆包音频1.0': 'doubaoAudio1Group',
    文本生成: 'doubaoAudio1TextGenerationGroup',
    参考生成: 'doubaoAudio1ReferenceGenerationGroup',
    时间控制: 'doubaoAudio1TimingControlGroup',
    多语种: 'doubaoAudio1MultilingualGroup',
    悬疑刑侦片: 'doubaoAudio1CrimeSuspense',
    宫廷试药: 'doubaoAudio1PalaceMedicineTrial',
    灵山宣战: 'doubaoAudio1LingshanDeclaration',
    古装喜剧片: 'doubaoAudio1PeriodComedy',
    未来科幻片: 'doubaoAudio1FutureSciFi',
    双人播客对谈: 'doubaoAudio1TwoHostPodcast',
    火场追踪: 'doubaoAudio1FireSceneInvestigation',
    悬疑追踪: 'doubaoAudio1SuspenseInvestigation',
    李米的回忆: 'doubaoAudio1LiMiMemory',
    带货双人: 'doubaoAudio1LivestreamDuo',
    警局对峙: 'doubaoAudio1PoliceStationConfrontation',
    播客聊天: 'doubaoAudio1PodcastChat',
    多角演绎: 'doubaoAudio1MultiRolePerformance',
    控制音效卡点: 'doubaoAudio1SoundEffectTiming',
    控制情绪递进: 'doubaoAudio1EmotionProgression',
    控制叙事转场: 'doubaoAudio1NarrativeTransition',
    控制旁白推进: 'doubaoAudio1NarrationProgression',
    法语: 'doubaoAudio1French',
    日语: 'doubaoAudio1Japanese',
    韩语: 'doubaoAudio1Korean',
    英语: 'doubaoAudio1English',
  });
function getPresetNodeTypeLabel(config) {
  const scope = NODE_TYPE_I18N_KEYS[config];
  return scope ? promptPresetsText('nodeTypes.' + scope) : promptPresetsText('nodeTypes.node');
}
function getPresetManagerTabLabel(input) {
  return getPromptPresetCollectionLabel(input?.['nodeType']) || String(input?.['label'] || '');
}
export function getPromptPresetCollectionLabel(output) {
  const value2 = NODE_TYPE_I18N_KEYS[output];
  return value2 ? promptPresetsText('tabs.' + value2 + '.label') : '';
}
function getPresetManagerDesc(value3) {
  return promptPresetsText('manager.desc', { nodeType: getPresetNodeTypeLabel(value3) });
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
function getLocalizedPresetTitle(value4) {
  const value5 = PROMPT_PRESET_TITLE_I18N_KEYS[value4];
  return value5 ? promptPresetsText('presets.' + value5 + '.title') : value4;
}
function getLocalizedPresetDesc(value6, value7) {
  const value8 = PROMPT_PRESET_TITLE_I18N_KEYS[value6];
  return value8 ? promptPresetsText('presets.' + value8 + '.desc') : value7;
}
export function normalizePromptPresetTriggerMode(value9) {
  const value10 = String(value9 || '')['trim']();
  return PROMPT_PRESET_TRIGGER_MODES['has'](value10) ? value10 : PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT;
}
export function shouldInsertPromptForPreset(options2 = {}) {
  return (
    normalizePromptPresetTriggerMode(options2?.['triggerMode']) === PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT
  );
}
export function isPromptPresetNodeTypeSupported(value11) {
  return SUPPORTED_PRESET_NODE_TYPES['has'](String(value11 || '')['trim']());
}
function getPromptPresetTriggerModeLabel(options3 = {}) {
  return shouldInsertPromptForPreset(options3)
    ? promptPresetsText('triggerModes.insertPrompt')
    : promptPresetsText('triggerModes.direct');
}
export async function loadCustomPresets() {
  try {
    const [value12] = await Promise['all']([fetchPromptPresetsFromServer(), loadPromptPresetSettings()]);
    customPresets = value12;
  } catch (value13) {
    console['warn'](
      '[promptPresets] No custom presets found or load failed.',
      value13,
    );
  }
}
export function getPromptPresets(value14) {
  const value15 = PROMPT_PRESETS[value14] || [],
    args4 = customPresets[value14] || [];
  return [...localizePromptPresetItems(value15), ...args4];
}
function normalizePresetNodeType(value16) {
  const value17 = String(value16 || '')['trim']();
  return SUPPORTED_PRESET_NODE_TYPES['has'](value17) ? value17 : 'ai-image';
}
function normalizePresetManagerNodeType(value18) {
  const value19 = String(value18 || '')['trim']();
  return PRESET_MANAGER_TABS['some']((value20) => value20['nodeType'] === value19)
    ? value19
    : 'ai-text';
}
function normalizePromptPresetSettings(options4 = {}) {
  const value21 = String(options4?.['defaultQuickCaptureNodeType'] || '')['trim']();
  return {
    defaultQuickCaptureNodeType: PRESET_MANAGER_TABS['some'](
      (value22) => value22['nodeType'] === value21,
    )
      ? value21
      : '',
  };
}
export async function loadPromptPresetSettings({ force: force = false } = {}) {
  if (promptPresetSettingsLoaded && !force) return { ...promptPresetSettings };
  if (promptPresetSettingsLoadPromise && !force) return promptPresetSettingsLoadPromise;
  const value23 = (async () => {
    const fetchPromptPresetSettingsFromServer2 = await fetchPromptPresetSettingsFromServer();
    return (
      (promptPresetSettings = normalizePromptPresetSettings(fetchPromptPresetSettingsFromServer2)),
      (promptPresetSettingsLoaded = true),
      { ...promptPresetSettings }
    );
  })()['catch']((value24) => {
    return (
      console['warn']('[promptPresets] Failed to load preset settings.', value24),
      (promptPresetSettingsLoaded = true),
      { ...promptPresetSettings }
    );
  });
  promptPresetSettingsLoadPromise = value23;
  try {
    return await value23;
  } finally {
    promptPresetSettingsLoadPromise === value23 && (promptPresetSettingsLoadPromise = null);
  }
}
export function getDefaultQuickCapturePresetNodeType() {
  return promptPresetSettings['defaultQuickCaptureNodeType'] || '';
}
export async function setDefaultQuickCapturePresetNodeType(value25) {
  const defaultQuickCaptureNodeType = String(value25 || '')['trim']();
  if (!PRESET_MANAGER_TABS['some']((value26) => value26['nodeType'] === defaultQuickCaptureNodeType))
    throw new Error('Invalid quick capture preset node type');
  return (
    await savePromptPresetSettingsToServer({ defaultQuickCaptureNodeType: defaultQuickCaptureNodeType }),
    (promptPresetSettings = { ...promptPresetSettings, defaultQuickCaptureNodeType: defaultQuickCaptureNodeType }),
    (promptPresetSettingsLoaded = true),
    { ...promptPresetSettings }
  );
}
export function getCustomPromptPresets(value27) {
  const presetNodeType = normalizePresetNodeType(value27);
  return Array['isArray'](customPresets[presetNodeType]) ? [...customPresets[presetNodeType]] : [];
}
export function getSlashPromptPresetEntries(value28) {
  const value29 = PROMPT_PRESETS[value28] || [],
    subItems = getCustomPromptPresets(value28),
    args5 = localizePromptPresetItems(value29);
  if (subItems['length'] === 0) return args5;
  return [
    ...args5,
    {
      title: promptPresetsText('customGroupTitle'),
      desc: promptPresetsText('customGroupDesc'),
      subItems: subItems,
    },
  ];
}
export function __setCustomPromptPresetsForTest(args6 = {}) {
  customPresets = args6 && typeof args6 === 'object' ? { ...args6 } : {};
}
export function __setPromptPresetSettingsForTest(options5 = {}) {
  ((promptPresetSettings = normalizePromptPresetSettings(options5)),
    (promptPresetSettingsLoaded = true),
    (promptPresetSettingsLoadPromise = null));
}
function escapePresetTemplateHtml(value30) {
  return String(value30 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;');
}
export function renderPresetTemplateEditorHtml(value31 = '') {
  return String(value31 ?? '')
    ['split'](USER_INPUT_PLACEHOLDER)
    ['map']((value32) => escapePresetTemplateHtml(value32)['replace'](/\r?\n/g, '<br>'))
    ['join'](getUserInputPillHtml());
}
export function serializePresetTemplateEditorHtml(value33 = '') {
  const value34 = '__AIC_USER_INPUT_PLACEHOLDER__',
    value35 = String(value33 ?? '')
      ['replace'](
        /<span\b[^>]*\bdata-preset-placeholder=["']user-input["'][^>]*>[\s\S]*?<\/span>/gi,
        value34,
      )
      ['replace'](/<br\b[^>]*\/?>/gi, '\n')
      ['replace'](/<\/(div|p)>/gi, '\n')
      ['replace'](/<[^>]+>/g, '');
  if (typeof document === 'undefined' || typeof document['createElement'] !== 'function')
    return value35['replace'](/&nbsp;/g, ' ')
      ['replace'](/&lt;/g, '<')
      ['replace'](/&gt;/g, '>')
      ['replace'](/&quot;/g, '"')
      ['replace'](/&#39;/g, '\'')
      ['replace'](/&amp;/g, '&')
      ['replace'](new RegExp(value34, 'g'), USER_INPUT_PLACEHOLDER)
      ['replace'](/\n{3,}/g, '\n\n')
      ['trim']();
  const el = document['createElement']('textarea');
  return (
    (el['innerHTML'] = value35),
    el['value']
      ['replace'](new RegExp(value34, 'g'), USER_INPUT_PLACEHOLDER)
      ['replace'](/\u00a0/g, ' ')
      ['replace'](/\n{3,}/g, '\n\n')
      ['trim']()
  );
}
function editorHasUserInputPill(el2) {
  return !!el2?.['querySelector']?.('[data-preset-placeholder="user-input"]');
}
function moveCaretAfterNode(value36) {
  const enabled = window['getSelection']?.();
  if (!enabled) return;
  const value37 = document['createRange']();
  (value37['setStartAfter'](value36),
    value37['collapse'](true),
    enabled['removeAllRanges'](),
    enabled['addRange'](value37));
}
function insertUserInputPill(el3) {
  if (editorHasUserInputPill(el3))
    return (showPresetManagerToast(promptPresetsText('editor.duplicateUserInput'), 'warn'), false);
  const el4 = document['createElement']('span');
  el4['innerHTML'] = getUserInputPillHtml();
  const value38 = el4['firstElementChild'],
    value39 = document['createTextNode'](' '),
    value40 = window['getSelection']?.(),
    value41 =
      value40?.['rangeCount'] &&
      el3['contains'](value40['getRangeAt'](0)['commonAncestorContainer'])
        ? value40['getRangeAt'](0)
        : null;
  return (
    value41
      ? (value41['deleteContents'](),
        value41['insertNode'](value39),
        value41['insertNode'](value38))
      : (el3['appendChild'](value38), el3['appendChild'](value39)),
    moveCaretAfterNode(value39),
    el3['focus'](),
    true
  );
}
function buildPresetModalButton(value42, value43) {
  const el5 = document['createElement']('button');
  return (
    (el5['type'] = 'button'),
    (el5['className'] = value43),
    (el5['textContent'] = value42),
    el5
  );
}
function buildPresetTriggerModeControl(value44) {
  let promptPresetTriggerMode = normalizePromptPresetTriggerMode(value44);
  const element = document['createElement']('div');
  ((element['className'] = 'preset-manager-trigger-modes'),
    element['setAttribute']('role', 'group'),
    element['setAttribute']('aria-label', promptPresetsText('triggerModes.aria')));
  const el6 = document['createElement']('span');
  ((el6['className'] = 'preset-manager-trigger-mode-label'),
    (el6['textContent'] = promptPresetsText('triggerModes.label')),
    element['appendChild'](el6));
  const run = (value45, value46) => {
      const el7 = buildPresetModalButton(value46, 'preset-manager-trigger-mode');
      return (
        (el7['dataset']['triggerMode'] = value45),
        el7['setAttribute']('aria-pressed', 'false'),
        el7['addEventListener']('click', () => {
          ((promptPresetTriggerMode = value45), run2());
        }),
        element['appendChild'](el7),
        el7
      );
    },
    value47 = run(PROMPT_PRESET_TRIGGER_MODE_DIRECT, promptPresetsText('triggerModes.direct')),
    value48 = run(
      PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      promptPresetsText('triggerModes.insertPrompt'),
    );
  function run2() {
    [value47, value48]['forEach']((el8) => {
      const value49 = el8['dataset']['triggerMode'] === promptPresetTriggerMode;
      (el8['classList']['toggle']('is-active', value49),
        el8['setAttribute']('aria-pressed', value49 ? 'true' : 'false'));
    });
  }
  return (run2(), { element: element, getValue: () => promptPresetTriggerMode });
}
function buildPresetManagerIcon(value50) {
  const el9 = document['createElement']('span');
  return (
    (el9['className'] = 'preset-manager-list-icon preset-manager-list-icon--' + value50),
    el9['setAttribute']('aria-hidden', 'true'),
    el9
  );
}
export function getPromptPresetThumbSrc(value51) {
  const value52 = String(value51?.['thumbnailDataUrl'] || '')['trim']();
  if (value52) return value52;
  const value53 = String(
    value51?.['thumbUrl'] ||
      value51?.['thumbnailUrl'] ||
      value51?.['posterUrl'] ||
      value51?.['coverUrl'] ||
      '',
  )['trim']();
  if (value53) return value53;
  const value54 = String(
    value51?.['thumbLocalPath'] ||
      value51?.['thumbnailLocalPath'] ||
      value51?.['posterLocalPath'] ||
      value51?.['coverLocalPath'] ||
      '',
  )['trim']();
  return value54 ? '/' + value54['replace'](/^\/+/, '') : '';
}
function readPresetThumbnailFile(enabled2) {
  return new Promise((handler, handler2) => {
    if (!enabled2 || !String(enabled2['type'] || '')['startsWith']('image/')) {
      handler2(new Error(promptPresetsText('thumbnail.chooseImage')));
      return;
    }
    const fileReader = new FileReader();
    ((fileReader['onload'] = () => handler(String(fileReader['result'] || ''))),
      (fileReader['onerror'] = () => handler2(new Error(promptPresetsText('thumbnail.readFailed')))),
      fileReader['readAsDataURL'](enabled2));
  });
}
function buildPresetThumbnailControl({ preset: preset2, onUpload: onUpload }) {
  const el10 = document['createElement']('label');
  ((el10['className'] = 'preset-manager-list-thumb'),
    (el10['title'] = promptPresetsText('thumbnail.upload')),
    el10['addEventListener']('click', (event) => event['stopPropagation']()));
  const promptPresetThumbSrc = getPromptPresetThumbSrc(preset2);
  if (promptPresetThumbSrc) {
    const value55 = document['createElement']('img');
    ((value55['className'] = 'preset-manager-list-thumb-img'),
      (value55['src'] = promptPresetThumbSrc),
      (value55['alt'] = ''),
      el10['appendChild'](value55));
  } else {
    const el11 = document['createElement']('span');
    ((el11['className'] = 'preset-manager-list-thumb-plus'),
      (el11['textContent'] = '+'),
      el10['appendChild'](el11));
  }
  const el12 = document['createElement']('input');
  return (
    (el12['className'] = 'preset-manager-thumb-input'),
    (el12['type'] = 'file'),
    (el12['accept'] = 'image/*'),
    el12['addEventListener']('click', (event2) => event2['stopPropagation']()),
    el12['addEventListener']('change', async () => {
      const enabled3 = el12['files']?.[0];
      if (!enabled3) return;
      try {
        const presetThumbnailFile = await readPresetThumbnailFile(enabled3);
        onUpload?.(presetThumbnailFile);
      } catch (error) {
        showPresetManagerToast(
          error?.['message'] || promptPresetsText('thumbnail.uploadFailed'),
          'error',
        );
      } finally {
        el12['value'] = '';
      }
    }),
    el10['appendChild'](el12),
    el10
  );
}
function buildPresetEditorPlaceholder() {
  const el13 = document['createElement']('div');
  ((el13['className'] = 'preset-manager-editor-placeholder'),
    el13['setAttribute']('aria-hidden', 'true'),
    el13['appendChild'](document['createTextNode'](getPresetTemplatePlaceholderText() + ' ')));
  const el14 = document['createElement']('span');
  return (
    (el14['innerHTML'] = getUserInputPillHtml()),
    el13['appendChild'](el14['firstElementChild']),
    el13
  );
}
function isPresetTemplateEditorEmpty(el15) {
  return !serializePresetTemplateEditorHtml(el15?.['innerHTML'] || '');
}
function syncPresetEditorPlaceholder(value56, el16) {
  el16['hidden'] = !isPresetTemplateEditorEmpty(value56);
}
function buildPresetManagerTabIcon(value57) {
  const el17 = document['createElementNS']('http://www.w3.org/2000/svg', 'svg');
  (el17['setAttribute']('class', 'preset-manager-tab-icon'),
    el17['setAttribute']('width', '16'),
    el17['setAttribute']('height', '16'),
    el17['setAttribute']('viewBox', '0 0 24 24'),
    el17['setAttribute']('fill', 'none'),
    el17['setAttribute']('stroke', 'currentColor'),
    el17['setAttribute']('stroke-width', '2'),
    el17['setAttribute']('aria-hidden', 'true'));
  const run3 = (value58, value59) => {
    const el18 = document['createElementNS']('http://www.w3.org/2000/svg', value58);
    (Object['entries'](value59)['forEach'](([value60, value61]) =>
      el18['setAttribute'](value60, value61),
    ),
      el17['appendChild'](el18));
  };
  if (value57 === 'text')
    return (
      run3('polyline', { points: '4 7 4 4 20 4 20 7' }),
      run3('line', { x1: '9', y1: '20', x2: '15', y2: '20' }),
      run3('line', { x1: '12', y1: '4', x2: '12', y2: '20' }),
      el17
    );
  if (value57 === 'image')
    return (
      run3('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }),
      run3('circle', { cx: '8.5', cy: '8.5', r: '1.5' }),
      run3('polyline', { points: '21 15 16 10 5 21' }),
      el17
    );
  if (value57 === 'video')
    return (
      run3('polygon', { points: '23 7 16 12 23 17 23 7' }),
      run3('rect', { x: '1', y: '5', width: '15', height: '14', rx: '2' }),
      el17
    );
  if (value57 === 'audio')
    return (
      run3('path', { d: 'M9 18V5l12-2v13' }),
      run3('circle', { cx: '6', cy: '18', r: '3' }),
      run3('circle', { cx: '18', cy: '16', r: '3' }),
      el17
    );
  return el17;
}
function getUniqueDraftTitle(value62) {
  const map = new Set(
    (value62 || [])['map']((value63) => String(value63?.['title'] || '')['trim']()),
  );
  let index2 = 1,
    customPresetFallbackTitle = getCustomPresetFallbackTitle();
  while (map['has'](customPresetFallbackTitle)) {
    ((index2 += 1),
      (customPresetFallbackTitle = promptPresetsText('customPresetFallbackWithIndex', { index: index2 })));
  }
  return customPresetFallbackTitle;
}
function showPresetManagerToast(value64, value65 = 'info') {
  window['showToast']?.(value64, value65);
}
function showPresetButtonPending(el19, value66) {
  ((el19['disabled'] = true),
    el19['setAttribute']('aria-busy', 'true'),
    (el19['textContent'] = value66));
  const el20 = document['createElement']('span');
  ((el20['className'] = 'project-package-loading-spinner preset-manager-action-spinner'),
    el20['setAttribute']('aria-hidden', 'true'),
    el19['appendChild'](el20));
}
function createPresetEditor({
  nodeType: nodeType,
  preset: preset = null,
  isDraft: isDraft = false,
  onSaved: onSaved,
}) {
  const element2 = document['createElement']('div');
  element2['className'] = 'preset-manager-detail';
  let originalTitle = isDraft ? '' : String(preset?.['title'] || '')['trim']();
  const value67 = String(preset?.['title'] || '')['trim'](),
    el21 = document['createElement']('label');
  el21['className'] = 'preset-manager-field';
  const el22 = document['createElement']('span');
  ((el22['className'] = 'preset-manager-label'),
    (el22['textContent'] = promptPresetsText('editor.name')));
  const el23 = document['createElement']('input');
  ((el23['className'] = 'preset-manager-input'),
    (el23['type'] = 'text'),
    (el23['placeholder'] = promptPresetsText('editor.namePlaceholder')),
    (el23['value'] = value67),
    el21['appendChild'](el22),
    el21['appendChild'](el23));
  const el24 = document['createElement']('label');
  el24['className'] = 'preset-manager-field';
  const el25 = document['createElement']('span');
  ((el25['className'] = 'preset-manager-label'),
    (el25['textContent'] = promptPresetsText('editor.desc')));
  const desc2 = document['createElement']('input');
  ((desc2['className'] = 'preset-manager-input'),
    (desc2['type'] = 'text'),
    (desc2['placeholder'] = promptPresetsText('editor.descPlaceholder')),
    (desc2['value'] = String(preset?.['desc'] || '')['trim']()),
    el24['appendChild'](el25),
    el24['appendChild'](desc2));
  const el26 = document['createElement']('div');
  el26['className'] = 'preset-manager-template-tools';
  const el27 = document['createElement']('span');
  ((el27['className'] = 'preset-manager-label'),
    (el27['textContent'] = promptPresetsText('editor.template')));
  const el28 = buildPresetModalButton(
    promptPresetsText('editor.insertPrompt'),
    'preset-modal-btn-secondary preset-manager-insert-btn',
  );
  (el26['appendChild'](el27), el26['appendChild'](el28));
  const el29 = document['createElement']('div');
  el29['className'] = 'preset-manager-editor-wrap';
  const el30 = document['createElement']('div');
  ((el30['className'] = 'preset-manager-textarea preset-manager-editor'),
    (el30['contentEditable'] = 'true'),
    (el30['spellcheck'] = false),
    (el30['innerHTML'] = renderPresetTemplateEditorHtml(preset?.['template'] || '')),
    el28['addEventListener']('click', () => insertUserInputPill(el30)));
  const presetEditorPlaceholder = buildPresetEditorPlaceholder();
  (el30['addEventListener']('input', () => syncPresetEditorPlaceholder(el30, presetEditorPlaceholder)),
    el30['addEventListener']('blur', () => syncPresetEditorPlaceholder(el30, presetEditorPlaceholder)),
    el29['addEventListener']('click', () => {
      el30['focus']();
    }),
    el29['appendChild'](el30),
    el29['appendChild'](presetEditorPlaceholder),
    syncPresetEditorPlaceholder(el30, presetEditorPlaceholder));
  const triggerMode = buildPresetTriggerModeControl(preset?.['triggerMode']),
    saveButton = buildPresetModalButton(promptPresetsText('editor.save'), 'preset-modal-btn-primary');
  return (
    saveButton['addEventListener']('click', async () => {
      if (saveButton['disabled']) return;
      const title2 = el23['value']['trim'](),
        template = serializePresetTemplateEditorHtml(el30['innerHTML']);
      if (!title2) {
        (showPresetManagerToast(promptPresetsText('editor.titleRequired'), 'warn'), el23['focus']());
        return;
      }
      if (!template) {
        (showPresetManagerToast(promptPresetsText('editor.templateRequired'), 'warn'), el30['focus']());
        return;
      }
      showPresetButtonPending(saveButton, promptPresetsText('editor.saving'));
      try {
        (await savePromptPresetToServer({
          nodeType: nodeType,
          title: title2,
          desc: desc2['value']['trim'](),
          template: template,
          triggerMode: triggerMode['getValue'](),
          thumbnailDataUrl: String(preset?.['thumbnailDataUrl'] || '')['trim'](),
          thumbLocalPath: String(preset?.['thumbLocalPath'] || '')['trim'](),
          originalTitle: originalTitle,
          installId: String(window['__aicInstallId'] || globalThis['__aicInstallId'] || '')['trim'](),
        }),
          await loadCustomPresets(),
          (originalTitle = title2),
          showPresetManagerToast(promptPresetsText('editor.saved'), 'success'),
          onSaved?.({ title: title2 }));
      } catch (error2) {
        showPresetManagerToast(error2?.['message'] || promptPresetsText('editor.saveFailed'), 'error');
      } finally {
        ((saveButton['disabled'] = false),
          saveButton['removeAttribute']('aria-busy'),
          (saveButton['textContent'] = promptPresetsText('editor.save')));
      }
    }),
    element2['appendChild'](el21),
    element2['appendChild'](el24),
    element2['appendChild'](el26),
    element2['appendChild'](el29),
    {
      element: element2,
      triggerModeControl: triggerMode['element'],
      saveButton: saveButton,
      updatePreset: (value68) => {
        preset = value68;
      },
    }
  );
}
export function openCustomPresetsManager({
  nodeType: nodeType2,
  sourceNodeId: sourceNodeId = '',
  initialDraftTemplate: initialDraftTemplate = '',
} = {}) {
  const template2 = String(initialDraftTemplate || '')['trim']();
  let nodeType3 = normalizePresetManagerNodeType(nodeType2 || getDefaultQuickCapturePresetNodeType());
  const enabled4 = String(sourceNodeId || '')['trim']();
  closeActivePresetManager?.();
  const root = document['createElement']('div');
  root['className'] = 'preset-modal-overlay';
  let beginModalInteraction2 = null,
    mutationObserver = null,
    value69 = false;
  const onClose = () => {
      ((value69 = true),
        mutationObserver?.['disconnect'](),
        root['remove'](),
        beginModalInteraction2?.(),
        activePresetManagerOverlay === root &&
          ((activePresetManagerOverlay = null), (closeActivePresetManager = null)));
    },
    el31 = document['createElement']('div');
  ((el31['className'] = 'preset-modal preset-modal--manager'),
    el31['addEventListener']('click', (event3) => event3['stopPropagation']()));
  const el32 = document['createElement']('div');
  el32['className'] = 'preset-manager-title-row';
  const el33 = document['createElement']('div');
  el33['className'] = 'preset-manager-title-group';
  const el34 = document['createElement']('div');
  ((el34['textContent'] = promptPresetsText('manager.title')),
    (el34['className'] = 'preset-modal-title'));
  const el35 = document['createElement']('div');
  ((el35['className'] = 'preset-modal-desc'),
    (el35['textContent'] = getPresetManagerDesc(nodeType3)),
    el33['appendChild'](el34),
    el33['appendChild'](el35));
  const el36 = buildPresetModalButton('×', 'preset-manager-close-btn');
  (el36['setAttribute']('aria-label', promptPresetsText('manager.close')),
    el36['addEventListener']('click', onClose),
    el32['appendChild'](el33),
    el32['appendChild'](el36));
  const el37 = document['createElement']('div');
  ((el37['className'] = 'preset-manager-tabs'), el37['setAttribute']('role', 'tablist'));
  const list2 = new Map();
  let value70 = false;
  PRESET_MANAGER_TABS['forEach']((defaultQuickCaptureNodeType2) => {
    const button = buildPresetModalButton('', 'preset-manager-tab');
    (button['setAttribute']('role', 'tab'),
      (button['dataset']['nodeType'] = defaultQuickCaptureNodeType2['nodeType']),
      button['appendChild'](buildPresetManagerTabIcon(defaultQuickCaptureNodeType2['icon'])));
    const el38 = document['createElement']('span');
    ((el38['textContent'] = getPresetManagerTabLabel(defaultQuickCaptureNodeType2)), button['appendChild'](el38));
    const star = document['createElement']('span');
    ((star['className'] = 'preset-manager-tab-star'),
      (star['textContent'] = '★'),
      star['setAttribute']('aria-hidden', 'true'),
      button['appendChild'](star),
      button['addEventListener']('click', () => {
        if (nodeType3 === defaultQuickCaptureNodeType2['nodeType']) return;
        ((nodeType3 = defaultQuickCaptureNodeType2['nodeType']), run4());
      }),
      button['addEventListener']('contextmenu', async (event4) => {
        (event4['preventDefault'](), event4['stopPropagation']());
        if (value70) return;
        const defaultQuickCaptureNodeType3 = getDefaultQuickCapturePresetNodeType();
        if (defaultQuickCaptureNodeType3 === defaultQuickCaptureNodeType2['nodeType']) return;
        ((value70 = true),
          (promptPresetSettings = {
            ...promptPresetSettings,
            defaultQuickCaptureNodeType: defaultQuickCaptureNodeType2['nodeType'],
          }),
          run4());
        try {
          (await setDefaultQuickCapturePresetNodeType(defaultQuickCaptureNodeType2['nodeType']),
            showPresetManagerToast(
              promptPresetsText('manager.quickCaptureDefaultSet', {
                preset: getPresetManagerTabLabel(defaultQuickCaptureNodeType2),
              }),
              'success',
            ));
        } catch (error3) {
          ((promptPresetSettings = { ...promptPresetSettings, defaultQuickCaptureNodeType: defaultQuickCaptureNodeType3 }),
            run4(),
            showPresetManagerToast(
              error3?.['message'] || promptPresetsText('manager.quickCaptureDefaultFailed'),
              'error',
            ));
        } finally {
          value70 = false;
        }
      }),
      list2['set'](defaultQuickCaptureNodeType2['nodeType'], { button: button, star: star }),
      el37['appendChild'](button));
  });
  const el39 = document['createElement']('div');
  el39['className'] = 'preset-manager-shell';
  const el40 = document['createElement']('div');
  el40['className'] = 'preset-manager-sidebar';
  const el41 = buildPresetModalButton(promptPresetsText('manager.new'), 'preset-manager-new-btn'),
    el42 = document['createElement']('div');
  ((el42['className'] = 'preset-manager-list'),
    el40['appendChild'](el41),
    el40['appendChild'](el42));
  const value71 = document['createElement']('div');
  ((value71['className'] = 'preset-manager-detail-pane'),
    el39['appendChild'](el40),
    el39['appendChild'](value71));
  const value72 = document['createElement']('div');
  value72['className'] = 'preset-modal-actions';
  const map2 = new Map(
    PRESET_MANAGER_TABS['map']((value73) => [
      value73['nodeType'],
      {
        selectedKey: '',
        draftPreset: null,
        draftCounter: 0,
        editors: new Map(),
        rows: new Map(),
        deletingKeys: new Set(),
        scrollTop: 0,
      },
    ]),
  );
  if (template2) {
    const id = map2['get'](nodeType3);
    ((id['draftCounter'] = 1),
      (id['draftPreset'] = {
        id: id['draftCounter'],
        title: getUniqueDraftTitle(getCustomPromptPresets(nodeType3)),
        desc: '',
        template: template2,
        triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      }),
      (id['selectedKey'] = 'draft:' + id['draftPreset']['id']));
  }
  const run5 = (value74) =>
      map2['get'](value74) || { selectedKey: '', draftPreset: null, draftCounter: 0 },
    key2 = (value75) => 'saved:' + String(value75?.['title'] || ''),
    key3 = (value76) => (value76 ? 'draft:' + value76['id'] : '');
  let value77 = null,
    value78 = null;
  const run4 = () => {
      if (value69) return;
      if (value77) value77['scrollTop'] = el42['scrollTop'];
      ((el35['textContent'] = getPresetManagerDesc(nodeType3)),
        list2['forEach'](({ button: button2, star: star2 }, value79) => {
          const value80 = value79 === nodeType3,
            enabled5 = value79 === getDefaultQuickCapturePresetNodeType(),
            value81 = PRESET_MANAGER_TABS['find']((value82) => value82['nodeType'] === value79),
            value83 = enabled5
              ? promptPresetsText('manager.quickCaptureDefaultAria', {
                  preset: getPresetManagerTabLabel(value81),
                })
              : promptPresetsText('manager.quickCaptureSetAria', {
                  preset: getPresetManagerTabLabel(value81),
                });
          (button2['classList']['toggle']('is-active', value80),
            button2['classList']['toggle']('is-quick-capture-default', enabled5),
            button2['setAttribute']('aria-selected', value80 ? 'true' : 'false'),
            button2['setAttribute']('aria-label', value83),
            (button2['title'] = value83),
            (star2['hidden'] = !enabled5));
        }));
      const preset3 = run5(nodeType3);
      value77 = preset3;
      const list3 = getCustomPromptPresets(nodeType3),
        list4 = [];
      preset3['draftPreset'] &&
        list4['push']({
          key: key3(preset3['draftPreset']),
          preset: preset3['draftPreset'],
          isDraft: true,
        });
      list3['forEach']((preset4) => {
        list4['push']({ key: key2(preset4), preset: preset4, isDraft: false });
      });
      !preset3['selectedKey'] &&
        list4['length'] > 0 &&
        (preset3['selectedKey'] = list4[0]['key']);
      preset3['selectedKey'] &&
        list4['length'] > 0 &&
        !list4['some']((event5) => event5['key'] === preset3['selectedKey']) &&
        (preset3['selectedKey'] = list4[0]['key']);
      const list5 = [],
        map3 = new Set(list4['map'](({ key: key4 }) => key4));
      for (const value84 of preset3['rows']['keys']()) {
        if (!map3['has'](value84)) preset3['rows']['delete'](value84);
      }
      if (list4['length'] === 0) {
        const el43 = document['createElement']('div');
        ((el43['className'] = 'preset-manager-empty'),
          (el43['textContent'] = promptPresetsText('manager.emptyList')),
          list5['push'](el43));
      }
      list4['forEach'](({ key: key5, preset: preset5, isDraft: isDraft2 }) => {
        const signature = JSON['stringify']([
            preset5,
            isDraft2,
            preset3['deletingKeys']['has'](key5),
          ]),
          value85 = preset3['rows']['get'](key5);
        if (value85?.['signature'] === signature) {
          (value85['updatePreset'](preset5),
            value85['element']['classList']['toggle']('is-active', key5 === preset3['selectedKey']),
            list5['push'](value85['element']));
          return;
        }
        const nodeType4 = nodeType3,
          element3 = document['createElement']('div');
        (element3['setAttribute']('role', 'button'),
          (element3['tabIndex'] = 0),
          (element3['className'] = 'preset-manager-list-item'),
          element3['classList']['toggle']('is-active', key5 === preset3['selectedKey']),
          element3['classList']['toggle']('has-trigger-badge', !isDraft2),
          element3['appendChild'](
            buildPresetThumbnailControl({
              preset: preset5,
              onUpload: (value86) => {
                ((preset5['thumbnailDataUrl'] = value86),
                  (preset5['thumbLocalPath'] = ''),
                  (preset5['thumbUrl'] = ''),
                  (preset3['selectedKey'] = key5),
                  showPresetManagerToast(promptPresetsText('thumbnail.updated'), 'success'),
                  run4());
              },
            }),
          ));
        const el44 = document['createElement']('span');
        el44['className'] = 'preset-manager-list-text';
        const el45 = document['createElement']('span');
        ((el45['className'] = 'preset-manager-list-title'),
          (el45['textContent'] = preset5?.['title'] || getCustomPresetFallbackTitle()));
        const el46 = document['createElement']('span');
        ((el46['className'] = 'preset-manager-list-desc'),
          (el46['textContent'] =
            preset5?.['desc'] || preset5?.['template'] || promptPresetsText('presetDescFallback')),
          el44['appendChild'](el45),
          el44['appendChild'](el46),
          element3['appendChild'](el44));
        if (!isDraft2) {
          const el47 = document['createElement']('span');
          ((el47['className'] = 'preset-manager-list-trigger-badge'),
            (el47['textContent'] = getPromptPresetTriggerModeLabel(preset5)),
            element3['appendChild'](el47));
        }
        (element3['addEventListener']('click', () => {
          if (preset3['selectedKey'] === key5) return;
          ((preset3['selectedKey'] = key5), run4());
        }),
          element3['addEventListener']('keydown', (event6) => {
            if (event6['target'] !== element3) return;
            if (event6['key'] !== 'Enter' && event6['key'] !== ' ') return;
            (event6['preventDefault'](), (preset3['selectedKey'] = key5), run4());
          }));
        const el48 = buildPresetModalButton('×', 'preset-manager-list-delete');
        el48['setAttribute'](
          'aria-label',
          promptPresetsText('manager.deleteAria', {
            title: preset5?.['title'] || getCustomPresetFallbackTitle(),
          }),
        );
        if (preset3['deletingKeys']['has'](key5)) showPresetButtonPending(el48, '');
        (el48['addEventListener']('click', async (event7) => {
          (event7['preventDefault'](), event7['stopPropagation']());
          if (preset3['deletingKeys']['has'](key5)) return;
          if (isDraft2) {
            (preset3['editors']['delete'](key5), (preset3['draftPreset'] = null));
            preset3['selectedKey'] === key5 && (preset3['selectedKey'] = '');
            run4();
            return;
          }
          (preset3['deletingKeys']['add'](key5),
            preset3['rows']['delete'](key5),
            showPresetButtonPending(el48, ''));
          try {
            (await deletePromptPresetFromServer({
              nodeType: nodeType4,
              title: String(preset5?.['title'] || ''),
            }),
              await loadCustomPresets(),
              preset3['editors']['delete'](key5),
              showPresetManagerToast(promptPresetsText('delete.deleted'), 'success'),
              preset3['selectedKey'] === key5 && (preset3['selectedKey'] = ''));
          } catch (error4) {
            showPresetManagerToast(error4?.['message'] || promptPresetsText('delete.failed'), 'error');
          } finally {
            (preset3['deletingKeys']['delete'](key5), run4());
          }
        }),
          element3['appendChild'](el48),
          preset3['rows']['set'](key5, {
            signature: signature,
            element: element3,
            updatePreset: (value87) => {
              preset5 = value87;
            },
          }),
          list5['push'](element3));
      });
      const map4 = new Set(list5);
      for (const el49 of Array['from'](el42['childNodes'])) {
        if (!map4['has'](el49)) el49['remove']();
      }
      let value88 = el42['firstChild'];
      for (const value89 of list5) {
        if (value89 !== value88) el42['insertBefore'](value89, value88);
        value88 = value89['nextSibling'];
      }
      const preset6 = list4['find']((event8) => event8['key'] === preset3['selectedKey']);
      if (preset6) {
        let presetEditor = preset3['editors']['get'](preset6['key']);
        if (!presetEditor) {
          let value90 = preset6['key'];
          ((presetEditor = createPresetEditor({
            nodeType: nodeType3,
            preset: preset6['preset'],
            isDraft: preset6['isDraft'],
            onSaved: ({ title: title3 } = {}) => {
              preset6['isDraft'] &&
                preset3['draftPreset'] === preset6['preset'] &&
                (preset3['draftPreset'] = null);
              const value91 = 'saved:' + String(title3 || '')['trim']();
              (preset3['editors']['delete'](value90), preset3['editors']['set'](value91, presetEditor));
              if (preset3['selectedKey'] === value90) preset3['selectedKey'] = value91;
              ((value90 = value91), run4());
            },
          })),
            preset3['editors']['set'](preset6['key'], presetEditor));
        }
        (presetEditor['updatePreset'](preset6['preset']),
          value78 !== presetEditor &&
            (value71['replaceChildren'](presetEditor['element']),
            value72['replaceChildren'](presetEditor['triggerModeControl'], presetEditor['saveButton']),
            (value78 = presetEditor)));
      } else {
        const el50 = document['createElement']('div');
        ((el50['className'] = 'preset-manager-detail-empty'),
          (el50['textContent'] = promptPresetsText('manager.emptyDetail')),
          value71['replaceChildren'](el50),
          value72['replaceChildren'](),
          (value78 = null));
      }
      el42['scrollTop'] = preset3['scrollTop'];
    },
    handler3 = (value92) => {
      if (!enabled4) return null;
      const enabled6 = appStore['getStateRaw']()['nodes']?.[enabled4];
      if (!enabled6 || typeof enabled6 !== 'object') return null;
      return String(enabled6['type'] || '') === value92 ? enabled6 : null;
    },
    handler4 = async ({ nodeType: nodeType5, draftPreset: draftPreset2 }) => {
      const enabled7 = handler3(nodeType5);
      if (!enabled7) return;
      const presetDefaultCoverDataUrl = await resolvePresetDefaultCoverDataUrl(enabled7);
      if (!presetDefaultCoverDataUrl) return;
      const value93 = run5(nodeType5);
      if (value93['draftPreset'] !== draftPreset2) return;
      if (
        String(draftPreset2['thumbnailDataUrl'] || '')['trim']() ||
        String(draftPreset2['thumbLocalPath'] || '')['trim']() ||
        String(draftPreset2['thumbUrl'] || '')['trim']()
      )
        return;
      ((draftPreset2['thumbnailDataUrl'] = presetDefaultCoverDataUrl),
        (draftPreset2['thumbLocalPath'] = ''),
        (draftPreset2['thumbUrl'] = ''),
        run4());
    };
  return (
    el41['addEventListener']('click', () => {
      const id2 = run5(nodeType3);
      if (id2['draftPreset']) {
        ((id2['selectedKey'] = key3(id2['draftPreset'])), run4());
        return;
      }
      id2['draftCounter'] += 1;
      const nodeType6 = nodeType3;
      ((id2['draftPreset'] = {
        id: id2['draftCounter'],
        title: getUniqueDraftTitle(getCustomPromptPresets(nodeType6)),
        desc: '',
        template: '',
        triggerMode: PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
      }),
        (id2['selectedKey'] = 'draft:' + id2['draftPreset']['id']),
        run4(),
        void handler4({ nodeType: nodeType6, draftPreset: id2['draftPreset'] }));
    }),
    el31['appendChild'](el32),
    el31['appendChild'](el37),
    el31['appendChild'](el39),
    el31['appendChild'](value72),
    root['appendChild'](el31),
    run4(),
    root['addEventListener']('mousedown', (event9) => {
      event9['target'] === root && onClose();
    }),
    document['body']['appendChild'](root),
    (activePresetManagerOverlay = root),
    (closeActivePresetManager = onClose),
    (beginModalInteraction2 = beginModalInteraction({ root: root, onClose: onClose })),
    typeof MutationObserver === 'function' &&
      ((mutationObserver = new MutationObserver(() => {
        if (!root['isConnected']) onClose();
      })),
      mutationObserver['observe'](document['body'], { childList: true })),
    root
  );
}
export async function openQuickCapturePromptPresetDraft(initialDraftTemplate2) {
  await loadPromptPresetSettings();
  const defaultQuickCapturePresetNodeType = getDefaultQuickCapturePresetNodeType(),
    nodeType7 = defaultQuickCapturePresetNodeType || 'ai-text',
    overlay = openCustomPresetsManager({ nodeType: nodeType7, initialDraftTemplate: initialDraftTemplate2 });
  return { overlay: overlay, nodeType: nodeType7, hasConfiguredDefault: Boolean(defaultQuickCapturePresetNodeType) };
}
