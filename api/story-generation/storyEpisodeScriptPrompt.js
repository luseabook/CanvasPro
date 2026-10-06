export const STORY_EPISODE_SCRIPT_SYSTEM_PROMPT = [
  '你是一名专业的短剧分集编剧。',
  '当前阶段只把指定分集简介扩写为完整可拍摄的分场剧本，不生成分镜、镜头语言、视频提示词或资产提示词。',
  '必须严格承接上一集已经完成的剧本状态，不得改写已确认剧情；同时为下一集简介保留自然衔接。',
  '每场必须包含场次标题、出场人物和完整剧本正文；正文应包含可执行动作、人物反应、对白及必要的画外音。',
  '所有人物对白必须使用标准格式“角色名：“完整对白””；完整台词必须放在中文双引号内，不得使用“角色名：裸台词”，表演动作写在引号外。',
  '不要输出“（本集完）”“（全剧终）”“待续”等编辑标记；如剧情明确需要观众看见文字，必须写成“屏幕字幕：“文字””。',
  '正文体量由当前分集的剧情内容与自然表演时长决定，不设固定字数目标；不得为了篇幅扩写对白或动作。',
  '不得用重复情节、重复对白、冗长环境描写或同义改写凑篇幅。',
  '小说式环境、心理和背景描述必须影视化转译：保留有叙事价值的内容，并改写为摄像机可见的人物动作、表情、视线、环境变化、光影变化或道具状态；不得只写抽象感受、判断和气氛概括。',
  '输入 scriptMode 为 narration 时，正文以第三人称旁白为主要叙事载体，并用“旁白：”明确标注；只保留推动冲突或情绪转折的关键人物对白。',
  '不得跳集生成，不得提前完成后续分集的核心事件。',
  '正文完成后必须从本集实际内容提取 continuityFacts 和 endingState；不得在状态字段中添加正文没有发生的事实。',
  '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
].join('\n');
export const STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT = [
  '你是短剧分集剧本返回修复助手。',
  '只修复上一次返回，不重新分析或重写整集。',
  '必须完整保留已经返回的场次正文、动作和对白；只补齐缺失结尾、修正字段名称或修复 JSON 语法。',
  '如果上次返回在场次中途截断，从截断位置自然续写到本集既定结尾，不得从头重写。',
  '只返回一个 JSON 对象，不要输出 Markdown、解释、校验报告或原始请求。',
].join('\n');
export const STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT = [
  '你是短剧单集正文修订编辑。',
  '只修复 timingReview 已定位的重复解释、重复动作、无效描写或改编预算偏离；不得脱离已确认摘要、分集大纲和连续性新增剧情。',
  '必须保留本集核心因果、人物选择、冲突结果和指定结尾。',
  '修订后的台词、动作、人物和场景仍必须受 grounding 中的摘要、分集计划与连续性约束。',
  '只返回与单集剧本相同结构的严格 JSON，不要输出说明、对比稿或 Markdown。',
].join('\n');
export function createStoryEpisodeScriptPromptApi({
  normalizeText: normalizeText,
  normalizeStringArray: normalizeStringArray,
  normalizePositiveNumber: normalizePositiveNumber,
  normalizeStoryScriptMode: normalizeStoryScriptMode,
  normalizeStorySummaryCharacter: normalizeStorySummaryCharacter,
  normalizeStoryContinuityFacts: normalizeStoryContinuityFacts,
  normalizeStoryContinuityState: normalizeStoryContinuityState,
  createStoryEpisodeScriptRuntimeGuidance: createStoryEpisodeScriptRuntimeGuidance,
  schemaVersion: schemaVersion,
  narrationMode: narrationMode,
} = {}) {
  const value = 800;
  function storyContract(options = {}) {
    const item = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
    return {
      protagonistGoal: normalizeText(item.protagonistGoal),
      centralConflict: normalizeText(item.centralConflict),
      stakes: normalizeText(item.stakes),
      progressionDriver: normalizeText(item.progressionDriver),
      constraints: normalizeText(item.constraints),
      climax: normalizeText(item.climax),
      ending: normalizeText(item.ending),
    };
  }
  function run(options2 = {}) {
    const enabled = {
      title: normalizeText(options2?.title),
      storyType: normalizeText(options2?.storyType),
      targetAudience: normalizeText(options2?.targetAudience),
      summary: normalizeText(options2?.summary || options2?.storySummary),
      background: normalizeText(options2?.background || options2?.storyBackground),
      setting: normalizeText(options2?.setting || options2?.storySetting),
      coreHook: normalizeText(options2?.coreHook),
      logline: normalizeText(options2?.logline),
      storyContract: storyContract(options2?.storyContract),
      plotBeats: (Array.isArray(options2?.plotBeats) ? options2.plotBeats : [])
        .map((key) => ({
          ref: normalizeText(key?.ref),
          stage: normalizeText(key?.stage),
          event: normalizeText(key?.event),
          consequence: normalizeText(key?.consequence),
        }))
        .filter((index) => index.stage || index.event || index.consequence),
      storyFacts: normalizeStoryContinuityFacts([
        ...(Array.isArray(options2?.continuityFacts) ? options2.continuityFacts : []),
        ...(Array.isArray(options2?.storyFacts) ? options2.storyFacts : []),
      ]),
      characters: (Array.isArray(options2?.characters) ? options2.characters : [])
        .map(normalizeStorySummaryCharacter)
        .filter(Boolean)
        .map((ref) => ({
          ref: ref.ref,
          name: ref.name,
          roleType: ref.roleType,
          fixedTraits: ref.fixedTraits,
          coreTags: ref.coreTags,
          profile: ref.profile,
          motivation: ref.motivation,
          relationships: ref.relationships,
          personality: ref.personality,
          arc: ref.arc,
        })),
    };
    if (!enabled.title || !enabled.summary || !enabled.logline)
      throw new Error('请先生成剧本摘要。');
    return enabled;
  }
  function previousEpisode2(enabled2, result, data) {
    if (!enabled2) return null;
    const target = Array.isArray(enabled2?.script?.scenes) ? enabled2.script.scenes : [],
      dom = target.findLast((dom2) => normalizeText(dom2?.body)),
      list = normalizeText(dom?.body || data),
      body = list.length > value ? list.slice(-value) : list;
    return {
      number: Number(enabled2?.number) || result - 1,
      title: normalizeText(enabled2?.title),
      synopsis: normalizeText(enabled2?.synopsis),
      hook: normalizeText(enabled2?.hook),
      continuityFacts: normalizeStoryContinuityFacts(enabled2?.continuityFacts),
      endingState: normalizeStoryContinuityState(enabled2?.endingState),
      ...(dom
        ? {
            endingScene: {
              heading: normalizeText(dom?.heading),
              characters: normalizeStringArray(dom?.characters),
              body: body,
            },
          }
        : { endingExcerpt: body }),
    };
  }
  function buildPrompt({
    project: project = {},
    episode: episode = {},
    previousEpisode: previousEpisode = null,
    nextEpisode: nextEpisode = null,
  } = {}) {
    const storySummary = run(project),
      scriptMode = normalizeStoryScriptMode(project?.scriptMode),
      number = Math.max(1, Math.trunc(Number(episode?.number) || 1)),
      currentEpisode = {
        ref:
          normalizeText(episode?.ref || episode?.planningRef || episode?.id) ||
          'episode-' + number,
        number: number,
        title: normalizeText(episode?.title),
        synopsis: normalizeText(episode?.synopsis),
        hook: normalizeText(episode?.hook),
        coreBeat: normalizeText(episode?.coreBeat),
        endingEvent: normalizeText(episode?.endingEvent),
        outlineEstimateSeconds:
          normalizePositiveNumber(episode?.estimatedDurationSeconds || episode?.durationSeconds) ||
          null,
        continuityFacts: normalizeStoryContinuityFacts(episode?.continuityFacts),
        requiredEndingState: normalizeStoryContinuityState(episode?.endingState),
      };
    if (!currentEpisode.title || !currentEpisode.synopsis)
      throw new Error('当前分集缺少标题或简介，无法生成完整剧本。');
    const enabled3 = normalizeText(
      previousEpisode?.script?.fullText ||
        previousEpisode?.fullScript ||
        previousEpisode?.scriptText,
    );
    if (number > 1 && !enabled3)
      throw new Error('必须先完成第 ' + (number - 1) + ' 集剧本，才能生成第 ' + number + ' 集。');
    return JSON.stringify({
      task: 'write_story_episode_script',
      schemaVersion: schemaVersion,
      scriptMode: scriptMode,
      storySummary: storySummary,
      currentEpisode: currentEpisode,
      runtimeGuidance: createStoryEpisodeScriptRuntimeGuidance(episode),
      continuity: {
        previousEpisode: previousEpisode2(previousEpisode, number, enabled3),
        nextEpisode: nextEpisode
          ? {
              number: Number(nextEpisode?.number) || number + 1,
              title: normalizeText(nextEpisode?.title),
              synopsis: normalizeText(nextEpisode?.synopsis),
              coreBeat: normalizeText(nextEpisode?.coreBeat),
              continuityFacts: normalizeStoryContinuityFacts(nextEpisode?.continuityFacts),
            }
          : null,
      },
      requirements: [
        '完整覆盖 currentEpisode.synopsis，但不得提前完成 continuity.nextEpisode 的核心事件。',
        '连续性优先级为：上一集 endingState 与 continuityFacts > 当前集 continuityFacts > currentEpisode.synopsis > 模型自由发挥。',
        '若 synopsis 与已确认连续性冲突，必须保持已确认的人物、武器、道具和关系状态，并用不新增事实的方式完成本集核心事件。',
        'currentEpisode.requiredEndingState 是本集必须到达的结束状态；状态变化必须在正文中明确交代原因。',
        '同一事实只完整表达一次；后续只有出现新信息、新选择、新阻力或不可逆结果时才能再次提及。',
        '将有叙事价值的环境、心理和背景描述转换成可拍摄的人物动作、表情、视线、环境变化、光影变化或道具状态，为后续每个视频镜头提供明确视觉依据；不得只保留抽象描述。',
        '仅省略既不能转化为有效画面、也不推动事件、人物选择、关系变化或关键信息的枝节；不得把应当可视化的重要内容直接删掉。',
        '正文体量由本集实际剧情和自然表演需要决定；runtimeGuidance.outlineEstimateSeconds 只作非约束参考。没有固定字数下限，不得为凑篇幅增加重复对白、重复动作或解释性复述，也不得为了贴近预计时长删减必要剧情。',
        '建议拆成 2 至 6 场，每场只写可拍摄的剧情动作和对白。',
        'body 使用标准短剧文本表达，可包含动作描述、角色对白、VO 和 OS。',
        '人物对白统一写成“角色名：“完整对白””，完整台词放在中文双引号内；不得写成“角色名：裸台词”。',
        '不得在 body 末尾添加“本集完”“全剧终”“待续”等编辑标记；确需观众看见文字时，明确写成“屏幕字幕：“文字””。',
        '人物称呼、关系、目标和世界规则必须与 storySummary 一致。',
        '只生成完整分场剧本，不写分镜编号、景别、运镜、视频参数或绘图提示词。',
        ...(scriptMode === narrationMode
          ? [
              '以第三人称旁白为主要叙事载体，旁白应占全部可配音文本的 80% 以上，并统一使用“旁白：”标注。',
              '旁白按信息节拍分成短句和短段，每段只推进一个事件、发现、因果或情绪转折，适配单人口播。',
              '保留少量推动冲突、揭示信息或形成情绪爆点的原有关键对白；任务文字、屏幕文字和音效不得改写成人物对白。',
              '动作和环境描述必须可直接画面化，并与旁白表达的事件同步；不要写抽象评价代替可观察行为。',
              '禁止使用“各位观众”“今天要讲的是”等节目开场套话，除非原始创意明确要求主持人口吻。',
              '严格保持已确认事实、专有名词、数字、时间、规则、人物关系、事件顺序和结局；不得新增人物、地点、道具、任务、规则、对白或事件。',
              '每集结尾用本集已有冲突、秘密或行动结果形成钩子，不得为了悬念编造新事实。',
            ]
          : ['以人物行动、关系碰撞和对白推进剧情；旁白只用于无法通过表演清晰传达的必要信息。']),
      ],
      outputSchema: {
        episodeRef: currentEpisode.ref,
        title: currentEpisode.title,
        scenes: [
          {
            ref: currentEpisode.ref + '-scene-1',
            heading: '夜 内 故障电梯',
            characters: ['人物名'],
            body:
              scriptMode === narrationMode
                ? '以“旁白：”为主体，穿插可视化动作和少量“角色名：关键对白”的完整场次正文；体量按本集内容自然决定'
                : '包含动作、标准“角色名：“完整对白””及必要 VO/OS 的完整场次正文；体量按本集内容与自然表演时长决定',
          },
        ],
        continuityFacts: [
          '本集正文新确认且后续必须保持的单一事实，尤其是人物武器、道具、伤势、关系和能力限制',
        ],
        endingState: {
          characters: ['人物：本集结束时的位置、状态、关系、能力、武器或持有物'],
          props: ['道具：本集结束时的归属、位置或状态'],
          unresolvedThreads: ['本集结束时尚未解决且后续必须承接的线索、任务或威胁'],
        },
      },
    });
  }
  function buildContentRevisionPrompt({
    grounding: grounding = {},
    script: script = {},
    timingReview: timingReview = {},
  } = {}) {
    return JSON.stringify({
      task: 'revise_story_episode_script_content',
      grounding: {
        scriptMode: grounding?.scriptMode,
        storySummary: grounding?.storySummary,
        currentEpisode: grounding?.currentEpisode,
        runtimeGuidance: grounding?.runtimeGuidance,
        continuity: grounding?.continuity,
      },
      currentScript: {
        episodeRef: normalizeText(script?.episodeRef),
        title: normalizeText(script?.title),
        scenes: Array.isArray(script?.scenes) ? script.scenes : [],
        continuityFacts: normalizeStoryContinuityFacts(script?.continuityFacts),
        endingState: normalizeStoryContinuityState(script?.endingState),
      },
      timingReview: {
        verdict: normalizeText(timingReview?.verdict),
        naturalDurationSeconds: normalizePositiveNumber(timingReview?.naturalDurationSeconds) || null,
        reasonableRangeSeconds: timingReview?.reasonableRangeSeconds,
        reason: normalizeText(timingReview?.reason),
        findings: normalizeStringArray(timingReview?.findings),
      },
      requirements: [
        '逐项修复 timingReview.findings，不得仅改写措辞后保留同一重复功能。',
        '若时长偏离 grounding.runtimeGuidance.outlineEstimateSeconds，优先合并重复说明、重复动作和无效过场；有叙事价值的环境、心理和背景信息必须改写为简洁、可观察的视觉行为或画面变化，不得直接删除或保留为抽象描述。',
        '不得删除 currentEpisode.coreBeat、endingEvent、关键因果、人物选择和结果。',
        '不得加入 storySummary、currentEpisode 和 continuity 之外的人物、事件、场景或下一集内容。',
        '返回完整 scenes、continuityFacts 和 endingState，不返回修订说明。',
      ],
    });
  }
  return { buildPrompt: buildPrompt, buildContentRevisionPrompt: buildContentRevisionPrompt };
}
