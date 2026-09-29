export const VIDEO_REPLICATION_PROMPT_MODEL_ID = 'apimart/gemini-3.8-flash';

function normalizeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function extractJsonObject(input) {
  const text = normalizeText(input?.text ?? input);
  if (!text) return null;

  const candidate = text.match(/```(?:json)?\s*([\s\S]*?)```/iu)?.[1] || text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function createVideoReplicationPromptStructuredOutput() {
  return {
    name: 'video_replication_clip_analysis',
    strict: true,
    fallback: 'prompt',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'synopsis', 'fullScript', 'seedancePrompt', 'camera', 'sound', 'segments'],
      properties: {
        title: { type: 'string', minLength: 1 },
        synopsis: { type: 'string', minLength: 1 },
        fullScript: { type: 'string', minLength: 1 },
        seedancePrompt: { type: 'string', minLength: 1 },
        camera: { type: 'string' },
        sound: { type: 'string' },
        segments: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'startSec', 'endSec', 'script', 'prompt', 'visual', 'camera', 'dialogue', 'sound'],
            properties: {
              title: { type: 'string', minLength: 1 },
              startSec: { type: 'number', minimum: 0 },
              endSec: { type: 'number', exclusiveMinimum: 0 },
              script: { type: 'string' },
              prompt: { type: 'string', minLength: 1 },
              visual: { type: 'string' },
              camera: { type: 'string' },
              dialogue: { type: 'string' },
              sound: { type: 'string' },
            },
          },
        },
      },
    },
  };
}

export function buildVideoReplicationPromptAnalysisPrompt({
  durationSec = 0,
  targetLocale = 'zh-CN',
  targetLocaleLabel = '中国 · 中文',
  visualStyle = '',
} = {}) {
  const seconds = Math.max(1, Number(durationSec) || 15);
  const style = normalizeText(visualStyle, '保持原视频的画面媒介与质感');

  return [
    '你是专业短剧导演、分镜分析师和 Seedance 2.0 提示词工程师。',
    '依据已确认的原片分析，整理可复刻的剧情节拍、主体关系、动作顺序、场景、景别、运镜、光影、台词和声音。',
    '不要保留或猜测原人物真实身份、姓名、明星信息或可识别的真实脸部特征；保留角色在故事中的身份、关系、年龄层、性格、服装功能和连续性，人物外观改为目标地区的虚构角色。',
    '目标地区与语种：' + normalizeText(targetLocaleLabel, targetLocale) + '（' + normalizeText(targetLocale) + '）。所有标题、梗概、完整剧本、台词与提示词必须使用该目标语种；台词保持原意、信息量、说话顺序和戏剧功能，不新增或删改剧情。',
    '目标创作风格：' +
      style +
      '。这是复刻故事与视频生成的正式创作约束，不是只加在 seedancePrompt 开头的风格前缀。',
    '在不改变原视频剧情事实、因果、动作节拍、镜头顺序与台词含义的前提下，把该风格贯穿 synopsis、fullScript 和 segments.script 的叙事语气、场景表达、情绪节奏与动作呈现，并贯穿各级视频提示词的主体、环境、光影和镜头描述。若所选风格只描述视觉媒介，则只调整适用的表现方式，不要据此编造新剧情。',
    '只本地化人物外观、环境文化细节、文字语言和视觉媒介；保留原故事中角色的功能身份、关系、目标、冲突与结局。',
    '目标生成时长约 ' + seconds.toFixed(2) + ' 秒，提示词复杂度必须与时长匹配。',
    seconds > 8
      ? 'seedancePrompt 必须使用清晰的分时段描述，每段时间连续且覆盖完整时长。'
      : 'seedancePrompt 按发生顺序描述动作，不要塞入无法在当前时长完成的额外剧情。',
    'seedancePrompt 必须包含：主体与场景、动作编排、景别与运镜、情绪、光影风格、台词（如有）、背景音乐与关键音效；通过具体内容体现目标风格，不要仅在开头复述风格名称。',
    'seedancePrompt 中不要写 @视频、@图片等素材引用；引用语句由系统根据生成路线统一添加。',
    'fullScript 必须按原视频时间顺序写成可用于后续角色/场景/道具提取的完整分集剧本；保留每句对白的角色归属。角色称呼保留稳定编号，如 person-1（目标角色称呼）；听不清处保留[听不清]，说话人未知处保留[说话人待核对]，禁止补写。',
    'segments 按可独立生成的视频片段划分并覆盖完整时间轴；每段写明 startSec/endSec、局部剧本、画面、运镜、对白、声音及可直接生成的 prompt。',
    '准确复刻结构与节奏，但不要逐字照抄画面内受版权保护的长文本。',
    '只返回指定 JSON 对象，不要附加解释。',
  ].join('\n');
}

export function parseVideoReplicationPromptAnalysisResult(input, { durationSec = 0, requireScriptJson = false } = {}) {
  const parsed = extractJsonObject(input);

  if (requireScriptJson) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('模型未返回有效的创作剧本 JSON');
    }
    for (const field of ['fullScript', 'seedancePrompt']) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
        throw new Error('模型返回的创作剧本缺少 ' + field);
      }
    }
  }

  const rawText = normalizeText(input?.text ?? input);
  const seedancePrompt = normalizeText(parsed?.seedancePrompt, parsed ? '' : rawText);
  if (!seedancePrompt) throw new Error('视频理解模型未返回可用的 Seedance 提示词');

  return {
    title: normalizeText(parsed?.title, '未命名片段'),
    synopsis: normalizeText(parsed?.synopsis, seedancePrompt.slice(0, 120)),
    fullScript: normalizeText(parsed?.fullScript, parsed?.synopsis || seedancePrompt),
    seedancePrompt,
    camera: normalizeText(parsed?.camera),
    sound: normalizeText(parsed?.sound),
    segments: Array.isArray(parsed?.segments)
      ? parsed.segments
          .map((segment) => ({
            title: normalizeText(segment?.title),
            startSec: Math.max(0, Number(segment?.startSec) || 0),
            endSec: Math.max(0, Number(segment?.endSec) || 0),
            script: normalizeText(segment?.script),
            prompt: normalizeText(segment?.prompt),
            visual: normalizeText(segment?.visual),
            camera: normalizeText(segment?.camera),
            dialogue: normalizeText(segment?.dialogue),
            sound: normalizeText(segment?.sound),
          }))
          .filter((segment) => segment.prompt || segment.script)
      : [],
    durationSec: Math.max(0, Number(durationSec) || 0),
  };
}
