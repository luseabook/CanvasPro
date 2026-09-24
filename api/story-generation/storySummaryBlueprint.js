import { parseStrictJson } from '../utils/strictJson.js';
import { getResultText } from './storyTextRequest.js';
export const STORY_SUMMARY_SCHEMA_VERSION = 0x4;
export const STORY_SUMMARY_MAX_CORE_CHARACTERS = 0x8;
export const STORY_SUMMARY_MAX_PLOT_BEATS = 0x8;
export const STORY_SUMMARY_SYSTEM_PROMPT = [
  '你是一名专业的短剧总编剧与故事策划。',
  '当前阶段只生成结构化故事蓝图和核心人物叙事设定，不生成分集大纲、分集正文、分镜、视觉资产提示词或声音设定。',
  '输入 creativeDirection.selectedStyle 是正式的故事创作约束，不是待拼接到提示词开头的风格标签；应把它转译为与原始创意兼容的题材气质、世界与场景选择、情绪基调、冲突表达、叙事节奏和语言质感。',
  '摘要必须完整交代主角目标、主要阻力、关键转折、高潮方向与最终结局，不能只留下悬念。',
  'storyContract 明确主角目标、核心冲突、失败代价、推进动力、约束条件、高潮与结局；任何题材都必须使用具体剧情事实表达。',
  'plotBeats 根据故事复杂度给出足够的因果节点，前一节点的结果必须能推动后一节点，不按字数凑内容。',
  'continuityFacts\x20记录后续不能无理由改变的事实；战斗题材可记录武器和能力，言情题材可记录关系阶段、承诺、秘密与知情范围，悬疑或职场题材记录对应的线索、身份、职位和归属。',
  '人物小传只描述核心人物的剧情身份、固定特征、核心标签、动机、关系、性格和成长弧；fixedTraits 只写影响剧情连续性的身份、年龄段、伤疤、身体限制或伪装等固定事实，不设计服装、发型、画面风格或声线。',
  '输入 scriptMode 只决定后续剧本的叙事载体：plot 以人物行动与对白推进，narration 以第三人称旁白推进；当前摘要仍使用客观梗概表达。',
  '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
  'JSON 必须且只能包含 title、storyType、targetAudience、storySummary、storyBackground、storySetting、coreHook、logline、storyContract、plotBeats、continuityFacts、characters 十二个字段。',
]['join']('\x0a');
function normalizeText(_0x190f94) {
  return String(_0x190f94 || '')['trim']();
}
function normalizeStringArray(_0x427d16) {
  return Array['isArray'](_0x427d16) ? [...new Set(_0x427d16['map'](normalizeText)['filter'](Boolean))] : [];
}
function createStorySummaryResponseSchema(_0x7177cf) {
  return {
    type: 'object',
    additionalProperties: ![],
    required: [
      'title',
      'storyType',
      'targetAudience',
      'storySummary',
      'storyBackground',
      'storySetting',
      'coreHook',
      'logline',
      'storyContract',
      'plotBeats',
      'continuityFacts',
      'characters',
    ],
    properties: {
      title: { type: 'string' },
      storyType: { type: 'string' },
      targetAudience: { type: 'string' },
      storySummary: { type: 'string' },
      storyBackground: { type: 'string' },
      storySetting: { type: 'string' },
      coreHook: { type: 'string' },
      logline: { type: 'string' },
      storyContract: {
        type: 'object',
        additionalProperties: ![],
        required: [
          'protagonistGoal',
          'centralConflict',
          'stakes',
          'progressionDriver',
          'constraints',
          'climax',
          'ending',
        ],
        properties: {
          protagonistGoal: { type: 'string' },
          centralConflict: { type: 'string' },
          stakes: { type: 'string' },
          progressionDriver: { type: 'string' },
          constraints: { type: 'string' },
          climax: { type: 'string' },
          ending: { type: 'string' },
        },
      },
      plotBeats: {
        type: 'array',
        minItems: 0x4,
        maxItems: STORY_SUMMARY_MAX_PLOT_BEATS,
        items: {
          type: 'object',
          additionalProperties: ![],
          required: ['stage', 'event', 'consequence'],
          properties: {
            stage: { type: 'string' },
            event: { type: 'string' },
            consequence: { type: 'string' },
          },
        },
      },
      continuityFacts: { type: 'array', minItems: 0x1, maxItems: _0x7177cf, items: { type: 'string' } },
      characters: {
        type: 'array',
        minItems: 0x1,
        maxItems: STORY_SUMMARY_MAX_CORE_CHARACTERS,
        items: {
          type: 'object',
          additionalProperties: ![],
          required: [
            'ref',
            'name',
            'roleType',
            'fixedTraits',
            'coreTags',
            'profile',
            'motivation',
            'relationships',
            'personality',
            'arc',
          ],
          properties: {
            ref: { type: 'string' },
            name: { type: 'string' },
            roleType: { type: 'string' },
            fixedTraits: { type: 'string' },
            coreTags: { type: 'array', minItems: 0x1, maxItems: 0x5, items: { type: 'string' } },
            profile: { type: 'string' },
            motivation: { type: 'string' },
            relationships: { type: 'string' },
            personality: { type: 'string' },
            arc: { type: 'string' },
          },
        },
      },
    },
  };
}
export function createStorySummaryBlueprint({
  normalizeStoryScriptMode: _0x5cd969,
  validateStoryPlanningConstraints: _0x12ec13,
  continuityMaxFacts: continuityMaxFacts = 0xc,
} = {}) {
  if (typeof _0x5cd969 !== 'function')
    throw new TypeError('Story Summary Blueprint 需要剧本模式规范化函数。');
  if (typeof _0x12ec13 !== 'function') throw new TypeError('Story Summary Blueprint 需要规划约束校验函数。');
  function _0x1b3e98(_0x18e61c = {}, _0x2ff0eb = 0x0) {
    const _0x150fe2 = normalizeText(_0x18e61c?.['name']);
    if (!_0x150fe2) return null;
    return {
      ref: normalizeText(_0x18e61c?.['ref']) || 'character-' + (_0x2ff0eb + 0x1),
      name: _0x150fe2,
      roleType: normalizeText(_0x18e61c?.['roleType'] || _0x18e61c?.['role']) || '其他角色',
      fixedTraits: normalizeText(_0x18e61c?.['fixedTraits']),
      visualAppearance: normalizeText(_0x18e61c?.['visualAppearance']),
      voiceDescription: normalizeText(_0x18e61c?.['voiceDescription']),
      coreTags: normalizeStringArray(_0x18e61c?.['coreTags']),
      profile: normalizeText(_0x18e61c?.['profile']),
      motivation: normalizeText(_0x18e61c?.['motivation']),
      relationships: normalizeText(_0x18e61c?.['relationships']),
      personality: normalizeText(_0x18e61c?.['personality']),
      arc: normalizeText(_0x18e61c?.['arc']),
    };
  }
  function _0x51a103(_0x84f2aa = {}) {
    const _0x5a0dad =
      _0x84f2aa && typeof _0x84f2aa === 'object' && !Array['isArray'](_0x84f2aa) ? _0x84f2aa : {};
    return {
      protagonistGoal: normalizeText(_0x5a0dad['protagonistGoal']),
      centralConflict: normalizeText(_0x5a0dad['centralConflict']),
      stakes: normalizeText(_0x5a0dad['stakes']),
      progressionDriver: normalizeText(_0x5a0dad['progressionDriver']),
      constraints: normalizeText(_0x5a0dad['constraints']),
      climax: normalizeText(_0x5a0dad['climax']),
      ending: normalizeText(_0x5a0dad['ending']),
    };
  }
  function _0x1b2c8c(_0x5a0913 = {}, _0x5c1d55 = 0x0) {
    const _0x3109c0 =
        _0x5a0913 && typeof _0x5a0913 === 'object' && !Array['isArray'](_0x5a0913) ? _0x5a0913 : {},
      _0x36614d = normalizeText(_0x3109c0['stage']),
      _0x4e41e6 = normalizeText(_0x3109c0['event']),
      _0xb4fc0b = normalizeText(_0x3109c0['consequence']);
    if (!_0x36614d && !_0x4e41e6 && !_0xb4fc0b) return null;
    return {
      ref: normalizeText(_0x3109c0['ref']) || 'plot-beat-' + (_0x5c1d55 + 0x1),
      stage: _0x36614d,
      event: _0x4e41e6,
      consequence: _0xb4fc0b,
    };
  }
  function _0x3fca33(_0x37e305) {
    const _0x2d3d95 = parseStrictJson(getResultText(_0x37e305), 'Agent\x20未返回剧本摘要。'),
      _0x2e9602 = {
        schemaVersion: STORY_SUMMARY_SCHEMA_VERSION,
        title: normalizeText(_0x2d3d95['title']),
        storyType: normalizeText(_0x2d3d95['storyType']),
        targetAudience: normalizeText(_0x2d3d95['targetAudience']),
        storySummary: normalizeText(_0x2d3d95['storySummary']),
        storyBackground: normalizeText(_0x2d3d95['storyBackground']),
        storySetting: normalizeText(_0x2d3d95['storySetting']),
        coreHook: normalizeText(_0x2d3d95['coreHook']),
        logline: normalizeText(_0x2d3d95['logline']),
        storyContract: _0x51a103(_0x2d3d95['storyContract']),
        plotBeats: Array['isArray'](_0x2d3d95['plotBeats'])
          ? _0x2d3d95['plotBeats']
              ['map'](_0x1b2c8c)
              ['filter'](Boolean)
              ['slice'](0x0, STORY_SUMMARY_MAX_PLOT_BEATS)
          : [],
        continuityFacts: normalizeStringArray(_0x2d3d95['continuityFacts'])['slice'](0x0, continuityMaxFacts),
        characters: Array['isArray'](_0x2d3d95['characters'])
          ? _0x2d3d95['characters']
              ['map'](_0x1b3e98)
              ['filter'](Boolean)
              ['slice'](0x0, STORY_SUMMARY_MAX_CORE_CHARACTERS)
          : [],
      },
      _0x45edac = [
        ['title', '故事标题'],
        ['storyType', '故事类型'],
        ['targetAudience', '目标受众'],
        ['storySummary', '故事梗概'],
        ['storyBackground', '故事背景'],
        ['storySetting', '故事设定'],
        ['coreHook', '核心梗'],
        ['logline', '一句话故事'],
      ];
    for (const [_0x43f1ff, _0x498141] of _0x45edac) {
      if (!_0x2e9602[_0x43f1ff]) throw new Error('Agent 返回结果缺少' + _0x498141 + '。');
    }
    const _0x53f92b = Object['entries'](_0x2e9602['storyContract'])['find'](([, _0x54b8c]) => !_0x54b8c);
    if (_0x53f92b) throw new Error('Agent\x20返回结果缺少故事契约字段：' + _0x53f92b[0x0] + '。');
    if (_0x2e9602['plotBeats']['length'] < 0x4) throw new Error('Agent\x20返回结果缺少完整的因果剧情节点。');
    const _0xf69b5f = _0x2e9602['plotBeats']['find'](
      (_0x423e33) => !_0x423e33['stage'] || !_0x423e33['event'] || !_0x423e33['consequence'],
    );
    if (_0xf69b5f) throw new Error('Agent 返回的剧情节点缺少阶段、事件或结果。');
    if (!_0x2e9602['continuityFacts']['length']) throw new Error('Agent\x20返回结果缺少连续性事实。');
    if (!_0x2e9602['characters']['length']) throw new Error('Agent 返回结果缺少人物小传。');
    const _0x4d6083 = _0x2e9602['characters']['find'](
      (_0x4a451a) => !_0x4a451a['fixedTraits'] || !_0x4a451a['coreTags']['length'],
    );
    if (_0x4d6083) throw new Error('Agent 返回的人物“' + _0x4d6083['name'] + '”缺少剧情固定特征或核心标签。');
    return _0x2e9602;
  }
  function _0x599a0e({
    mode: mode = 'generate',
    scriptMode: scriptMode = 'plot',
    idea: idea = '',
    sourceText: sourceText = '',
    fileName: fileName = '',
    sourceDigests: sourceDigests = [],
    rewriteInstruction: rewriteInstruction = '',
    visualStyle: visualStyle = '',
    planning: planning = {},
  } = {}) {
    const _0x12e917 = mode === 'upload' || mode === 'rewrite' ? mode : 'generate',
      _0x381748 = _0x5cd969(scriptMode),
      _0x5ccd12 = normalizeText(idea),
      _0x32b411 = normalizeText(sourceText),
      _0x3ec940 = normalizeText(rewriteInstruction),
      _0x46810a = normalizeText(visualStyle),
      _0x49533b = Array['isArray'](sourceDigests) ? sourceDigests : [],
      _0x442a84 = _0x12ec13(planning);
    if (_0x12e917 === 'generate' && !_0x5ccd12) throw new Error('请先输入故事设定。');
    if (_0x12e917 !== 'generate' && !_0x32b411 && !_0x49533b['length'])
      throw new Error('没有可供整理的剧本文本。');
    if (_0x12e917 === 'rewrite' && !_0x3ec940) throw new Error('请先填写改写要求。');
    return JSON['stringify']({
      task: 'create_story_summary',
      schemaVersion: STORY_SUMMARY_SCHEMA_VERSION,
      mode: _0x12e917,
      scriptMode: _0x381748,
      episodeLimit: _0x442a84['episodeCount'],
      creativeDirection: {
        selectedStyle: _0x46810a,
        instruction: _0x46810a
          ? _0x12e917 === 'rewrite'
            ? '把所选视觉风格作为改写要求的辅助制作方向，贯穿故事蓝图的场景、情绪与语言质感；不得覆盖用户改写要求，也不得擅自改变未获授权的原稿事实。'
            : '把所选风格贯穿故事蓝图的题材气质、世界与场景选择、情绪基调、冲突表达、叙事节奏和语言质感；它不是待输出或机械复述的提示词前缀。仅采用与原始创意兼容的风格语义，不得覆盖用户明确给出的角色、关系、事件或结局。'
          : _0x12e917 === 'rewrite'
            ? '未指定额外视觉风格，以用户改写要求和参考剧本共同确定故事气质。'
            : '未指定额外风格，按原始创意本身确定故事气质。',
      },
      modeInstruction:
        _0x12e917 === 'upload'
          ? '忠于原文人物、关系、关键事件和结局，整理成可继续规划分集的剧本摘要。'
          : _0x12e917 === 'rewrite'
            ? '按用户改写要求重构参考剧本，生成新的故事蓝图与世界设定。改写要求明确授权的内容可以改变；未要求改动的人物身份、关系、关键事实和因果锚点应保持一致，不提前写分集正文。'
            : '根据原始创意设计完整故事蓝图，只写故事结构、连续性事实和核心人物叙事设定，不提前写分集正文。',
      requirements: [
        ...(_0x12e917 === 'rewrite'
          ? [
              '执行优先级为：输出结构与安全约束、用户改写要求、原稿中被明确授权改动的内容、未被要求改动的原稿事实、所选视觉风格与分集目标。',
            ]
          : []),
        _0x46810a
          ? '围绕所选风格“' +
            _0x46810a +
            '”设计故事本身；在\x20storyType、storySummary、storyBackground、storySetting、storyContract、plotBeats\x20和人物弧光中落实适用的叙事语义，不要只把风格词复制到输出文本。'
          : '未指定额外风格时，不要自行套用固定的画面风格或类型模板。',
        'storySummary 按故事实际复杂度完整交代主线因果和主要结局；不设固定字数，不为篇幅重复或注水。',
        'coreHook\x20用简洁短语概括最有传播力的题材组合、能力机制或冲突卖点。',
        'storyContract 使用题材无关的剧情事实明确目标、冲突、代价、推进动力、约束、高潮和结局。',
        'plotBeats 根据故事复杂度输出 4 至 8 个因果节点；每个 consequence 必须成为下一节点的条件或压力。',
        'continuityFacts\x20只登记后续不能无理由改变的事实，并覆盖原始创意中明确给出的身份、关系、承诺、秘密、知情范围、能力、物品归属或世界规则。',
        'characters 只包含主角和推动主要冲突的核心人物，最多 ' +
          STORY_SUMMARY_MAX_CORE_CHARACTERS +
          '\x20人；临时路人和单集功能角色留到分集阶段。',
        '人物小传需写明角色类型、剧情固定特征、3\x20至\x205\x20个核心标签、身份、动机、关系、性格和成长弧。',
        '本阶段禁止生成服装、发型、图片提示词和声音设定；这些制作资料在分集正文确认后的资产提取阶段生成。',
        '后续最多规划 ' +
          _0x442a84['episodeCount'] +
          '\x20集；摘要应完整承载故事，但不得为了凑满上限注水。本次禁止输出分集。',
        _0x381748 === 'narration'
          ? '后续采用解说模式：摘要要形成可由第三人称旁白串联的清晰因果链，避免让核心冲突只能依靠大段人物对白成立。'
          : '后续采用剧情模式：为人物行动、关系碰撞和关键对白保留充分的戏剧空间。',
      ],
      input:
        _0x12e917 !== 'generate'
          ? {
              fileName: normalizeText(fileName),
              sourceText: _0x32b411,
              sourceDigests: _0x49533b,
              ...(_0x12e917 === 'rewrite' ? { rewriteInstruction: _0x3ec940 } : {}),
            }
          : { idea: _0x5ccd12 },
      outputSchema: {
        title: '故事标题',
        storyType: '故事类型',
        targetAudience: '目标受众',
        storySummary: '包含结局的完整故事梗概',
        storyBackground: '时代、地点、社会环境和初始处境',
        storySetting: '世界规则、核心机制与限制',
        coreHook: '核心题材或冲突卖点',
        logline: '一句话故事',
        storyContract: {
          protagonistGoal: '主角想实现的具体目标',
          centralConflict: '持续阻碍目标的核心矛盾或对立力量',
          stakes: '失败会造成的具体后果',
          progressionDriver: '持续推动剧情升级的关系、任务、调查、竞争或其他动力',
          constraints: '人物必须遵守的现实条件、关系边界、世界规则或能力限制',
          climax: '主角必须作出最终行动或选择的高潮事件',
          ending: '主要矛盾解决后的明确结局',
        },
        plotBeats: [
          {
            stage: '剧情阶段，例如开端、诱因、转折、危机、高潮或结局',
            event: '本阶段实际发生的关键事件',
            consequence: '该事件造成并推动下一阶段的结果',
          },
        ],
        continuityFacts: [
          '后续不能无理由改变的单一事实；根据题材记录关系、承诺、秘密、知情范围、身份、职位、线索、能力、物品归属或规则',
        ],
        characters: [
          {
            ref: '稳定唯一引用',
            name: '角色名',
            roleType: '主角、配角或反派',
            fixedTraits: '只写影响剧情连续性的固定身份、年龄段、身体特征或限制；不设计服装、发型和声音',
            coreTags: ['3 至 5 个概括身份、性格或戏剧功能的简短标签'],
            profile: '身份背景',
            motivation: '核心动机',
            relationships: '主要角色关系',
            personality: '性格特点',
            arc: '成长弧线',
          },
        ],
      },
    });
  }
  function _0x5a42ee(_0xbe76ac = 'story_summary_blueprint') {
    return {
      name: _0xbe76ac,
      schema: createStorySummaryResponseSchema(continuityMaxFacts),
      strict: !![],
      fallback: 'prompt',
    };
  }
  return Object['freeze']({
    buildStorySummaryPrompt: _0x599a0e,
    createStructuredOutput: _0x5a42ee,
    normalizeStoryContract: _0x51a103,
    normalizeStoryPlotBeat: _0x1b2c8c,
    normalizeStorySummaryCharacter: _0x1b3e98,
    parseStorySummaryResult: _0x3fca33,
  });
}
