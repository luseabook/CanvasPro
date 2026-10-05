export function createStoryEpisodeOutlinePlanningApi({
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
} = {}) {
  const version = 1,
    value = 20,
    systemPrompt = [
      '你是一名专业的短剧分集大纲策划。',
      '当前阶段必须在一次响应中完成全剧结构规划和全部详细分集简介，不要拆成骨架与细化两个响应。',
      'episodeCount 是目标分集数，不要求机械地精确凑满；应优先规划接近目标的完整故事，通常保持在目标数的 90% 到 100%，且不得超过目标数。',
      '先在内部完成起因、发展、转折、高潮和结局的分配，再一次性输出 storyFacts 与全部 episodes。',
      '每集必须有不可被相邻集替代的核心推进、完整剧情简介、已经发生的结束事件和由该事件包装出的 hook。',
      '相邻分集必须因果连续；人物、武器、道具、地点和关系发生变化时，在 synopsis 中交代原因，并在 endingState 中记录结果。',
      '最后一集必须完成摘要已经确定的主要结局。',
      '不生成分场正文、对白、分镜或视觉提示词。',
      '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    ]['join']('\n'),
    systemPrompt2 = [
      '你是一名专业的短剧全剧结构策划。',
      '当前阶段只根据已经确认的剧本摘要生成紧凑的全剧骨架和跨集事实台账，不生成详细分集简介、对白、分镜或视觉提示词。',
      'episodeCount 是目标分集数，不要求机械地精确凑满；应优先规划接近目标的完整故事，通常保持在目标数的 90% 到 100%，且不得超过目标数。',
      '只有故事容量确实不足时才可低于建议范围；不得因输出篇幅、模型省略或提前收束剧情而大幅减少集数。',
      '按顺序覆盖完整故事的起因、发展、转折、高潮与结局。',
      '每集只规划一个核心推进和一个已经发生的结束事件；结束事件不是额外创造的悬念。',
      '每集核心推进必须不可被相邻集替代或删除；禁止拆分同一结果、换句话复述前集、重复总结已发生事件或用纯尾声凑集数。',
      'storyFacts 只保存跨集必须保持一致的姓名、身份、关系、能力、武器、关键道具与世界规则；同一事实只写一次。',
      '相同人物、武器和道具必须始终使用同一名称；发生更换、损毁、转移时，必须把原因规划为明确事件。',
      '最后一集必须完成摘要已经确定的主要结局。',
      '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    ]['join']('\n'),
    systemPrompt3 = [
      '你是一名专业的短剧分集大纲策划。',
      '当前只细化输入 batch.episodes，不得改写全剧骨架、storyFacts、previousEndingState 或摘要中的结局。',
      '必须按 batch.episodes 的顺序逐集推进；前一集 endingState 是后一集的起始事实。',
      'synopsis 写清本集开端、主要行动、冲突升级、关系或信息变化，并以骨架指定的 endingEvent 收束。',
      'synopsis 中每个事件只写一次；禁止在末尾用同义句复述前文结论，也禁止把同一行动重复描述为过程和总结。',
      'hook 只负责把 endingEvent 表现成观众可感知的悬念或期待，不得新增人物、武器、道具、秘密、规则或事件。',
      'continuityFacts 只列本集写作时必须保持的事实，尤其是出场人物的身份、关系、能力、当前武器和关键道具。',
      'endingState 只记录本集结束时仍会影响后续的人物、道具和未解决线索；保持简洁，不复述 synopsis。',
      '人物更换武器、获得道具、受伤、死亡、转移地点或改变关系时，synopsis 必须明确交代原因，endingState 必须反映结果。',
      '只返回当前批次的详细分集大纲，不生成分场正文、对白、分镜或视觉提示词。',
      '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    ]['join']('\n');
  function structuredOutput(name, schema) {
    return { name: name, schema: schema, strict: true, fallback: 'prompt' };
  }
  function endingState() {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['characters', 'props', 'unresolvedThreads'],
      properties: {
        characters: {
          type: 'array',
          maxItems: STORY_CONTINUITY_MAX_CHARACTER_STATES,
          items: { type: 'string' },
        },
        props: { type: 'array', maxItems: STORY_CONTINUITY_MAX_PROP_STATES, items: { type: 'string' } },
        unresolvedThreads: {
          type: 'array',
          maxItems: STORY_CONTINUITY_MAX_UNRESOLVED_THREADS,
          items: { type: 'string' },
        },
      },
    };
  }
  function items({ includeArcFields: includeArcFields = true } = {}) {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'ref',
        'number',
        'title',
        ...(includeArcFields ? ['coreBeat', 'endingEvent', 'activeCharacters'] : []),
        'synopsis',
        'hook',
        'continuityFacts',
        'endingState',
      ],
      properties: {
        ref: { type: 'string' },
        number: { type: 'integer', minimum: 1 },
        title: { type: 'string' },
        ...(includeArcFields
          ? {
              coreBeat: { type: 'string' },
              endingEvent: { type: 'string' },
              activeCharacters: { type: 'array', items: { type: 'string' } },
            }
          : {}),
        synopsis: { type: 'string' },
        hook: { type: 'string' },
        continuityFacts: { type: 'array', maxItems: STORY_CONTINUITY_MAX_FACTS, items: { type: 'string' } },
        endingState: endingState(),
        estimatedDurationSeconds: { type: 'number', exclusiveMinimum: 0 },
      },
    };
  }
  function run(item) {
    const maxItems = Math['max'](1, Math['trunc'](Number(item) || 1));
    return {
      type: 'object',
      additionalProperties: false,
      required: ['storyFacts', 'episodes'],
      properties: {
        storyFacts: { type: 'array', maxItems: STORY_CONTINUITY_MAX_FACTS, items: { type: 'string' } },
        episodes: { type: 'array', minItems: 1, maxItems: maxItems, items: items() },
      },
    };
  }
  function run2(key) {
    const maxItems2 = Math['max'](1, Math['trunc'](Number(key) || 1));
    return {
      type: 'object',
      additionalProperties: false,
      required: ['storyFacts', 'episodes'],
      properties: {
        storyFacts: { type: 'array', maxItems: STORY_CONTINUITY_MAX_FACTS, items: { type: 'string' } },
        episodes: {
          type: 'array',
          minItems: 1,
          maxItems: maxItems2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['ref', 'number', 'title', 'coreBeat', 'endingEvent', 'activeCharacters'],
            properties: {
              ref: { type: 'string' },
              number: { type: 'integer', minimum: 1 },
              title: { type: 'string' },
              coreBeat: { type: 'string' },
              endingEvent: { type: 'string' },
              activeCharacters: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    };
  }
  function run3(index) {
    const minItems = Math['max'](1, Math['trunc'](Number(index) || 1));
    return {
      type: 'object',
      additionalProperties: false,
      required: ['episodes'],
      properties: {
        episodes: {
          type: 'array',
          minItems: minItems,
          maxItems: minItems,
          items: items({ includeArcFields: false }),
        },
      },
    };
  }
  function run4(options = {}) {
    const characters = Array['isArray'](options?.['characters'])
        ? options['characters']['map'](normalizeStorySummaryCharacter)['filter'](Boolean)
        : [],
      enabled = {
        title: normalizeText(options?.['title']),
        storyType: normalizeText(options?.['storyType']),
        targetAudience: normalizeText(options?.['targetAudience']),
        summary: normalizeText(options?.['summary'] || options?.['storySummary']),
        background: normalizeText(options?.['background'] || options?.['storyBackground']),
        setting: normalizeText(options?.['setting'] || options?.['storySetting']),
        coreHook: normalizeText(options?.['coreHook']),
        logline: normalizeText(options?.['logline']),
        storyContract: normalizeStoryContract(options?.['storyContract']),
        plotBeats: Array['isArray'](options?.['plotBeats'])
          ? options['plotBeats']
              ['map'](normalizeStoryPlotBeat)
              ['filter'](Boolean)
              ['slice'](0, STORY_SUMMARY_MAX_PLOT_BEATS)
          : [],
        continuityFacts: normalizeStringArray(options?.['continuityFacts'])['slice'](
          0,
          STORY_CONTINUITY_MAX_FACTS,
        ),
        characters: characters,
      };
    if (!enabled['title'] || !enabled['summary'] || !enabled['logline'])
      throw new Error('请先生成剧本摘要。');
    return enabled;
  }
  function storySummary(options2 = {}) {
    const characters2 = run4(options2);
    return {
      ...characters2,
      storyFacts: normalizeStoryContinuityFacts([
        ...characters2['continuityFacts'],
        ...(Array['isArray'](options2?.['storyFacts']) ? options2['storyFacts'] : []),
      ]),
      characters: characters2['characters']['map']((ref) => ({
        ref: ref['ref'],
        name: ref['name'],
        roleType: ref['roleType'],
        fixedTraits: ref['fixedTraits'],
        coreTags: ref['coreTags'],
        profile: ref['profile'],
        motivation: ref['motivation'],
        relationships: ref['relationships'],
        personality: ref['personality'],
        arc: ref['arc'],
      })),
    };
  }
  function run5({ project: project = {}, constraints: constraints = {} } = {}) {
    const storySummary2 = storySummary(project),
      scriptMode = normalizeStoryScriptMode(project?.['scriptMode']),
      constraints2 = resolveStoryPlanningConstraints(project, constraints),
      result = constraints2['episodeCount'],
      data = Math['max'](1, Math['ceil'](result * 0.9));
    return JSON['stringify']({
      task: 'plan_story_episode_outlines',
      schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
      phase: 'skeleton',
      scriptMode: scriptMode,
      storySummary: storySummary2,
      constraints: constraints2,
      requirements: [
        '目标生成约 ' +
          result +
          ' 集，建议保持在 ' +
          data +
          '-' +
          result +
          ' 集；不要求机械凑满，但不得超过 ' +
          result +
          ' 集。',
        '先在内部完成全剧集数和起因、发展、转折、高潮、结局的分配，再输出骨架；不得为了缩短输出而压缩中段、合并关键推进或提前进入结局。',
        '只有故事容量确实不足时才可少于 ' +
          data +
          ' 集；此时仍须保证完整因果链，不能把模型输出限制当作缩减集数的理由。',
        '先建立紧凑全剧骨架；每集 coreBeat 和 endingEvent 各只写一句，不展开成详细简介。',
        'storyFacts 统一登记跨集不应漂移的人物身份、关系、能力、武器、关键道具和世界规则。',
        '相邻分集必须因果连续；人物、武器或道具发生改变时，必须把原因安排为明确的 coreBeat 或 endingEvent。',
        '每集必须提供不可被相邻集替代的新行动、新信息或不可逆状态变化；禁止把同一事件拆成多集、重复总结或用尾声注水。',
        '最后一集必须完成摘要中已经确定的主要结局。',
        scriptMode === STORY_SCRIPT_MODE_NARRATION
          ? '按解说口播可清晰串联的因果节拍规划骨架，但不要提前写解说成稿。'
          : '按剧情短剧节奏规划骨架，为人物行动、关系变化和关键对白保留承载空间。',
      ],
      outputSchema: {
        storyFacts: ['跨集必须保持一致的单一事实；不要重复'],
        episodes: [
          {
            ref: 'episode-1',
            number: '从 1 开始的连续整数',
            title: '分集标题',
            coreBeat: '本集唯一核心推进',
            endingEvent: '本集结尾已经发生的剧情事件',
            activeCharacters: ['本集实际参与核心剧情的人物名'],
          },
        ],
      },
    });
  }
  function buildStoryEpisodeOutlinePrompt(options3 = {}) {
    const args = JSON['parse'](run5(options3)),
      target = args['scriptMode'];
    return JSON['stringify']({
      ...args,
      phase: 'complete',
      requirements: [
        args['requirements'][0],
        '先在内部完成全剧骨架和跨集事实分配，再在同一次响应中输出全部详细分集简介；不要输出中间骨架。',
        '不得为了缩短输出而压缩中段、合并关键推进或提前进入结局。',
        args['requirements'][2],
        args['requirements'][4],
        args['requirements'][5],
        '每集 coreBeat 和 endingEvent 各只描述一个不可替代的核心推进与已发生的结束事件。',
        'synopsis 写清本集开端、主要行动、冲突升级、关系或信息变化，并以 endingEvent 收束；每个事件只写一次。',
        'hook 只包装 endingEvent，不得新增 synopsis、storyFacts 或故事摘要中不存在的人物、道具、秘密、规则或事件。',
        'continuityFacts 只列本集创作时必须保持的事实；endingState 只记录本集结束后仍会影响后续的人物、道具与未解决线索。',
        '相邻分集必须直接继承前一集 endingState；状态发生改变时，synopsis 必须明确交代原因。',
        'estimatedDurationSeconds 仅在能够根据本集必要剧情自然估算时返回；它不是写作约束，不设固定最低或最高集长。',
        args['requirements'][6],
        args['requirements'][7],
        target === STORY_SCRIPT_MODE_NARRATION
          ? '按第三人称旁白可顺畅串联的因果节拍组织 synopsis，不写旁白成稿。'
          : '按人物行动、关系碰撞和关键对白可承载的节拍组织 synopsis。',
      ],
      outputSchema: {
        storyFacts: ['跨集必须保持一致的单一事实；不要重复'],
        episodes: [
          {
            ref: 'episode-1',
            number: '从 1 开始的连续整数',
            title: '分集标题',
            coreBeat: '本集唯一核心推进',
            endingEvent: '本集结尾已经发生的剧情事件',
            activeCharacters: ['本集实际参与核心剧情的人物名'],
            synopsis: '本集完整剧情简介，以 endingEvent 收束',
            hook: '仅包装 endingEvent 的结尾钩子，不新增事实',
            continuityFacts: ['本集必须保持的单一事实'],
            endingState: {
              characters: ['人物：本集结束时的位置、状态、关系、能力、武器或持有物'],
              props: ['道具：本集结束时的归属、位置或状态'],
              unresolvedThreads: ['尚未解决且后续必须承接的线索、任务或威胁'],
            },
            estimatedDurationSeconds: '可选；按本集必要剧情自然估算的整集时长，正数，不套固定集长',
          },
        ],
      },
    });
  }
  function parseStoryEpisodeOutlineSkeletonResult(source, { episodeCount: episodeCount = 3 } = {}) {
    const next = parseStrictJson(getResultText(source), 'Agent 未返回全剧分集骨架。'),
      current = normalizeStoryPlanningConstraints({ episodeCount: episodeCount })['episodeCount'],
      list = Array['isArray'](next['episodes']) ? next['episodes'] : [],
      episodes = list['map']((entry, number) => ({
        ref: normalizeText(entry?.['ref']) || 'episode-' + (number + 1),
        number: number + 1,
        title: normalizeText(entry?.['title']),
        coreBeat: normalizeText(entry?.['coreBeat']),
        endingEvent: normalizeText(entry?.['endingEvent']),
        activeCharacters: normalizeStringArray(entry?.['activeCharacters']),
      }));
    if (!episodes['length']) throw new Error('Agent 返回结果没有可用全剧分集骨架。');
    const record = episodes['find'](
      (enabled2) => !enabled2['title'] || !enabled2['coreBeat'] || !enabled2['endingEvent'],
    );
    if (record)
      throw new Error('Agent 返回的第 ' + record['number'] + ' 集骨架缺少标题、核心推进或结束事件。');
    if (episodes['length'] > current)
      throw new Error(
        'Agent 返回了 ' + episodes['length'] + ' 集分集骨架，超过 ' + current + ' 集上限。',
      );
    if (new Set(episodes['map']((payload) => payload['ref']))['size'] !== episodes['length'])
      throw new Error('Agent 返回了重复的分集骨架引用。');
    return {
      schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
      storyFacts: normalizeStoryContinuityFacts(next['storyFacts']),
      episodes: episodes,
    };
  }
  function createStoryEpisodeOutlineBatches(
    list2 = [],
    { batchSize: batchSize = STORY_EPISODE_OUTLINE_BATCH_SIZE } = {},
  ) {
    const list3 = Array['isArray'](list2) ? list2 : [],
      handle = Math['max'](1, Math['trunc'](Number(batchSize) || 1)),
      list4 = [];
    for (let state = 0; state < list3['length']; state += handle) {
      list4['push'](list3['slice'](state, state + handle));
    }
    return list4;
  }
  function run6(options4 = {}, config = []) {
    const title = storySummary(options4),
      map = new Set(
        (Array['isArray'](config) ? config : [])['flatMap']((scope) =>
          normalizeStringArray(scope?.['activeCharacters']),
        ),
      );
    return {
      title: title['title'],
      storyType: title['storyType'],
      summary: title['summary'],
      setting: title['setting'],
      coreHook: title['coreHook'],
      logline: title['logline'],
      characters: title['characters']
        ['filter']((error) => map['has'](error['name']))
        ['map']((ref2) => ({
          ref: ref2['ref'],
          name: ref2['name'],
          roleType: ref2['roleType'],
          coreTags: ref2['coreTags'],
          motivation: ref2['motivation'],
          relationships: ref2['relationships'],
          personality: ref2['personality'],
          arc: ref2['arc'],
        })),
    };
  }
  function run7(options5 = {}) {
    return {
      number: Math['max'](1, Math['trunc'](Number(options5?.['number']) || 1)),
      coreBeat: normalizeText(options5?.['coreBeat']),
      endingEvent: normalizeText(options5?.['endingEvent']),
    };
  }
  function buildStoryEpisodeOutlineBatchPrompt({
    project: project = {},
    constraints: constraints = {},
    skeleton: skeleton = {},
    batchEpisodes: batchEpisodes = [],
    batchIndex: batchIndex = 0,
    batchTotal: batchTotal = 1,
    previousEndingState: previousEndingState = null,
  } = {}) {
    const scriptMode2 = normalizeStoryScriptMode(project?.['scriptMode']),
      constraints3 = resolveStoryPlanningConstraints(project, constraints),
      storyArc = Array['isArray'](skeleton?.['episodes']) ? skeleton['episodes'] : [],
      episodes2 = Array['isArray'](batchEpisodes) ? batchEpisodes : [];
    if (!episodes2['length']) throw new Error('当前没有可细化的分集骨架。');
    const input = normalizeText(episodes2['at'](-1)?.['ref']),
      count = storyArc['findIndex']((output) => normalizeText(output?.['ref']) === input),
      nextEpisode = count >= 0 ? storyArc[count + 1] || null : null,
      storyContext = run6(project, [...episodes2, ...(nextEpisode ? [nextEpisode] : [])]),
      value2 = normalizeStoryContinuityState(previousEndingState);
    return JSON['stringify']({
      task: 'plan_story_episode_outline_batch',
      schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
      phase: 'detail',
      scriptMode: scriptMode2,
      storyContext: storyContext,
      storyFacts: normalizeStoryContinuityFacts(skeleton?.['storyFacts']),
      storyArc: storyArc['map'](run7),
      batch: {
        index: Math['max'](1, Math['trunc'](Number(batchIndex) || 1)),
        total: Math['max'](1, Math['trunc'](Number(batchTotal) || 1)),
        episodes: episodes2,
      },
      continuity: {
        previousEndingState: hasStoryContinuityState(value2) ? value2 : null,
        nextEpisode: nextEpisode,
      },
      constraints: constraints3,
      requirements: [
        '逐集细化 batch.episodes，返回数量、ref、number 与顺序必须完全一致。',
        'synopsis 以当前骨架的 endingEvent 收束，不得再创造第二个结尾事件。',
        'synopsis 按一次连续因果链描述，每个事件只出现一次；结尾直接落在 endingEvent，禁止追加同义总结或复述本集结果。',
        'hook 只能包装 endingEvent，不得引入 synopsis、storyFacts 或骨架中不存在的新事实。',
        'continuityFacts 优先列出本集出场人物当前使用的武器、关键道具、能力限制和关系状态。',
        'endingState 中每条状态使用“对象：状态”的短句；只保留后续仍需知道的信息。',
        '后一集必须继承前一集 endingState；若状态改变，synopsis 必须明确交代改变原因。',
        '最后一集收束主要结局，unresolvedThreads 可以为空；其他集不得凭空丢弃未解决线索。',
        'estimatedDurationSeconds 仅在能够根据本集必要剧情自然估算时返回；不得套固定集长或为了秒数改变剧情。',
        scriptMode2 === STORY_SCRIPT_MODE_NARRATION
          ? '按第三人称旁白可顺畅串联的因果节拍组织 synopsis，不写旁白成稿。'
          : '按人物行动、关系碰撞和关键对白可承载的节拍组织 synopsis。',
      ],
      outputSchema: {
        episodes: [
          {
            ref: '逐字使用 batch.episodes[].ref',
            number: '逐字使用 batch.episodes[].number',
            title: '沿用或小幅润色骨架标题，不改变剧情',
            synopsis: '本集完整剧情简介，以指定 endingEvent 收束',
            hook: '仅包装 endingEvent 的结尾钩子，不新增事实',
            continuityFacts: ['本集必须保持的单一事实'],
            endingState: {
              characters: ['人物：本集结束时的位置、状态、关系、能力、武器或持有物'],
              props: ['道具：本集结束时的归属、位置或状态'],
              unresolvedThreads: ['尚未解决且后续必须承接的线索、任务或威胁'],
            },
            estimatedDurationSeconds: '可选；按本集必要剧情自然估算的整集时长，正数，不套固定集长',
          },
        ],
      },
    });
  }
  function parseStoryEpisodeOutlineBatchResult(value3, { expectedEpisodes: expectedEpisodes = [] } = {}) {
    const value4 = parseStrictJson(getResultText(value3), 'Agent 未返回分批分集大纲。'),
      list5 = Array['isArray'](expectedEpisodes) ? expectedEpisodes : [],
      list6 = Array['isArray'](value4['episodes']) ? value4['episodes'] : [];
    if (list6['length'] !== list5['length'])
      throw new Error(
        'Agent 应返回 ' +
          list5['length'] +
          ' 集分集大纲，实际返回 ' +
          list6['length'] +
          ' 集。',
      );
    const episodes3 = list6['map']((value5, value6) => {
      const args2 = list5[value6] || {},
        ref3 = normalizeText(args2?.['ref']),
        enabled3 = normalizeText(value5?.['ref']);
      if (!enabled3 || enabled3 !== ref3)
        throw new Error(
          'Agent 返回的第 ' + (value6 + 1) + ' 个分集引用应为 ' + (ref3 || '指定引用') + '。',
        );
      const synopsis = normalizeText(value5?.['synopsis']),
        hook = normalizeText(value5?.['hook']),
        endingState2 = normalizeStoryContinuityState(value5?.['endingState']);
      if (!synopsis || !hook)
        throw new Error(
          'Agent 返回的分集“' + (normalizeText(value5?.['title']) || ref3) + '”缺少简介或钩子。',
        );
      if (!hasStoryContinuityState(endingState2))
        throw new Error(
          'Agent 返回的分集“' + (normalizeText(value5?.['title']) || ref3) + '”缺少有效结束状态。',
        );
      const estimatedDurationSeconds = normalizePositiveNumber(value5?.['estimatedDurationSeconds']);
      return {
        ...args2,
        ref: ref3,
        number: Math['max'](1, Math['trunc'](Number(args2?.['number']) || value6 + 1)),
        title: normalizeText(value5?.['title']) || normalizeText(args2?.['title']),
        synopsis: synopsis,
        hook: hook,
        continuityFacts: normalizeStoryContinuityFacts(value5?.['continuityFacts']),
        endingState: endingState2,
        sourceChapterIds: [],
        assetRefs: [],
        ...(estimatedDurationSeconds ? { estimatedDurationSeconds: estimatedDurationSeconds } : {}),
      };
    });
    return { schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION, episodes: episodes3 };
  }
  function parseStoryEpisodeOutlineResult(value7, { episodeCount: episodeCount = 3 } = {}) {
    const value8 = parseStrictJson(getResultText(value7), 'Agent 未返回分集大纲。'),
      episodeCount2 = normalizeStoryPlanningConstraints({ episodeCount: episodeCount })['episodeCount'],
      episodes4 = Array['isArray'](value8['episodes'])
        ? value8['episodes']
            ['map']((value9, number2) => {
              const estimatedDurationSeconds2 = normalizePositiveNumber(value9?.['estimatedDurationSeconds']);
              return {
                ref: normalizeText(value9?.['ref']) || 'episode-' + (number2 + 1),
                number: number2 + 1,
                title: normalizeText(value9?.['title']),
                synopsis: normalizeText(value9?.['synopsis']),
                hook: normalizeText(value9?.['hook']),
                coreBeat: normalizeText(value9?.['coreBeat']),
                endingEvent: normalizeText(value9?.['endingEvent']),
                activeCharacters: normalizeStringArray(value9?.['activeCharacters']),
                continuityFacts: normalizeStoryContinuityFacts(value9?.['continuityFacts']),
                endingState: normalizeStoryContinuityState(value9?.['endingState']),
                sourceChapterIds: [],
                assetRefs: [],
                ...(estimatedDurationSeconds2 ? { estimatedDurationSeconds: estimatedDurationSeconds2 } : {}),
              };
            })
            ['filter']((value10) => value10['title'] && value10['synopsis'] && value10['hook'])
        : [];
    if (!episodes4['length']) throw new Error('Agent 返回结果没有可用分集大纲。');
    if (episodes4['length'] > episodeCount2)
      throw new Error(
        'Agent 返回了 ' + episodes4['length'] + ' 集分集大纲，超过 ' + episodeCount2 + ' 集上限。',
      );
    if (new Set(episodes4['map']((value11) => value11['ref']))['size'] !== episodes4['length'])
      throw new Error('Agent 返回了重复的分集引用。');
    return {
      schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
      constraints: normalizeStoryPlanningConstraints({ episodeCount: episodeCount2 }),
      storyFacts: normalizeStoryContinuityFacts(value8['storyFacts']),
      episodes: episodes4,
    };
  }
  function run8(value12, value13) {
    const value14 = parseStoryEpisodeOutlineResult(value12, value13),
      value15 = value14['episodes']['find'](
        (enabled4) =>
          !enabled4['coreBeat'] ||
          !enabled4['endingEvent'] ||
          !hasStoryContinuityState(enabled4['endingState']),
      );
    if (value15)
      throw new Error('Agent 返回的第 ' + value15['number'] + ' 集缺少核心推进、结束事件或有效结束状态。');
    return value14;
  }
  function skeleton2(value16) {
    return value16 == null ? value16 : JSON['parse'](JSON['stringify'](value16));
  }
  function run9(value17) {
    if (value17 === null || value17 === undefined) return '';
    if (typeof value17 !== 'object' || Array['isArray'](value17)) return normalizeText(value17);
    const value18 = normalizeText(value17['ref'] || value17['episodeRef'] || value17['location']),
      value19 = normalizeText(value17['issue'] || value17['reason'] || value17['description']),
      value20 = normalizeText(value17['evidence'] || value17['example']),
      list7 = [value18 ? '[' + value18 + ']' : '', value19, value20 ? '证据：' + value20 : '']['filter'](
        Boolean,
      );
    return list7['join'](' ') || normalizeText(JSON['stringify'](value17));
  }
  function prompt(value21, outline) {
    return JSON['stringify']({
      task: 'review_story_episode_outline_timing',
      schemaVersion: 1,
      storySummary: storySummary(value21),
      outline: outline,
      criteria: [
        '逐集独立估算 synopsis 从开端到 endingEvent 的自然可拍时长，包含对白、等待、移动、操作、环境建立、反应和必要悬念停顿。',
        '允许真实同步发生的动作与对白重叠，但不能把所有顺序动作假设为同时完成。',
        'estimatedDurationSeconds 只是待复核的自然时长估算，不是集长限制；必须根据 synopsis 重新核算，不能直接沿用。',
        '自然时长合理区间包含原估算时 verdict=consistent，否则 verdict=estimate_mismatch；差异只说明时长数字需要更新，不代表剧情必须压缩或扩写。',
        '只测量和举证，不改写大纲，不按固定事件数、场次数、字数或统一集长裁决。',
      ],
      outputContract:
        'episodes exact refs [{ref,verdict(\'consistent\'|\'estimate_mismatch\'),naturalDurationSeconds,reasonableRangeSeconds{minimum,maximum},reason,findings string[]}]',
    });
  }
  function run10(value22, value23) {
    const value24 = parseStrictJson(getResultText(value22), '分集大纲审时 Agent 未返回有效 JSON。'),
      list8 = Array['isArray'](value23?.['episodes']) ? value23['episodes'] : [],
      list9 = Array['isArray'](value24?.['episodes']) ? value24['episodes'] : [];
    if (list9['length'] !== list8['length'])
      throw new Error(
        '分集大纲审时 Agent 应返回 ' + list8['length'] + ' 集，实际返回 ' + list9['length'] + ' 集。',
      );
    const assessments = list8['map']((value25, value26) => {
      const value27 = list9[value26] || {},
        ref4 = normalizeText(value25?.['ref']);
      if (normalizeText(value27?.['ref']) !== ref4)
        throw new Error('分集大纲审时 Agent 第 ' + (value26 + 1) + ' 项引用与原大纲不一致。');
      const naturalDurationSeconds = normalizePositiveNumber(value27?.['naturalDurationSeconds']),
        minimum = normalizePositiveNumber(value27?.['reasonableRangeSeconds']?.['minimum']),
        maximum = normalizePositiveNumber(value27?.['reasonableRangeSeconds']?.['maximum']);
      if (
        !naturalDurationSeconds ||
        !minimum ||
        !maximum ||
        minimum > naturalDurationSeconds ||
        maximum < naturalDurationSeconds
      )
        throw new Error('第 ' + (value26 + 1) + ' 集大纲审时区间无效。');
      const value28 = normalizePositiveNumber(value25?.['estimatedDurationSeconds']),
        verdict = value28 && value28 >= minimum && value28 <= maximum ? 'consistent' : 'estimate_mismatch',
        reason = normalizeText(value27?.['reason']),
        findings = Array['isArray'](value27?.['findings'])
          ? value27['findings']['map'](run9)['filter'](Boolean)['slice'](0, 8)
          : [];
      return {
        ref: ref4,
        verdict: verdict,
        naturalDurationSeconds: naturalDurationSeconds,
        reasonableRangeSeconds: { minimum: minimum, maximum: maximum },
        reason: reason,
        findings: findings,
      };
    });
    return { assessments: assessments };
  }
  async function run11({
    project: project2,
    result: result2,
    normalizedConstraints: normalizedConstraints,
    request: request2,
    requestPayload: requestPayload,
    onProgress: onProgress2,
    onInvocation: onInvocation2,
  }) {
    if (!normalizeText(project2?.['originalCreative'])) return result2;
    onProgress2?.({
      stage: 'reviewing-episode-outline-timing',
      current: 1,
      total: 1,
      message: '正在独立复核分集大纲自然时长',
    });
    const estimatedDurationSeconds3 = await requestStrictResult({
      request: request2,
      requestPayload: {
        ...requestPayload,
        prompt: prompt(project2, result2),
        systemPrompt:
          '你是独立的短剧分集大纲审时员。只根据每集实际内容测量自然表演时长；没有固定集长，不改写大纲，只返回严格 JSON。',
        temperature: 0.1,
      },
      parse: (value29) => run10(value29, result2),
      outputContract: 'episodes exact refs with independent natural timing estimates',
      maxAttempts: 1,
      ...run12('outline-timing-review', onInvocation2),
    });
    return {
      ...result2,
      episodes: result2['episodes']['map']((args3, value30) => ({
        ...args3,
        estimatedDurationSeconds: estimatedDurationSeconds3['assessments'][value30]['naturalDurationSeconds'],
        outlineTimingReview: estimatedDurationSeconds3['assessments'][value30],
      })),
    };
  }
  function run12(stepId, handler) {
    if (typeof handler !== 'function') return {};
    return {
      onRequest: ({ attempt: attempt, requestPayload: requestPayload2 }) =>
        handler({ state: 'prepared', stepId: stepId, attempt: attempt, requestPayload: requestPayload2 }),
      onResponse: ({ attempt: attempt2, response: response, requestPayload: requestPayload3 }) =>
        handler({
          state: 'completed',
          stepId: stepId,
          attempt: attempt2,
          requestPayload: requestPayload3,
          rawResponse: getResultText(response),
        }),
      onRequestError: ({ attempt: attempt3, error: error2, requestPayload: requestPayload4 }) =>
        handler({
          state:
            error2?.['safeToRetry'] === true || error2?.['requestSubmitted'] === false
              ? 'not-submitted'
              : 'outcome-unknown',
          stepId: stepId,
          attempt: attempt3,
          requestPayload: requestPayload4,
          error: error2?.['message'] || String(error2 || '模型请求失败'),
        }),
    };
  }
  function run13(enabled5, episodeCount3) {
    if (!enabled5) return null;
    if (
      typeof enabled5 !== 'object' ||
      Array['isArray'](enabled5) ||
      Number(enabled5['version']) !== version ||
      Number(enabled5['episodeCount']) !== episodeCount3['episodeCount'] ||
      !enabled5['skeleton'] ||
      !Array['isArray'](enabled5['skeleton']['episodes']) ||
      !Array['isArray'](enabled5['plannedEpisodes'])
    ) {
      const error3 = new Error('分集大纲断点版本或输入不兼容，不能安全续跑。');
      error3['code'] = 'CHECKPOINT_INCOMPATIBLE';
      throw error3;
    }
    return {
      version: version,
      episodeCount: episodeCount3['episodeCount'],
      skeleton: skeleton2(enabled5['skeleton']),
      plannedEpisodes: skeleton2(enabled5['plannedEpisodes']),
      nextBatchIndex: Math['max'](0, Math['trunc'](Number(enabled5['nextBatchIndex']) || 0)),
      previousEndingState: skeleton2(enabled5['previousEndingState'] || null),
    };
  }
  async function planStoryEpisodeOutlines({
    project: project = {},
    constraints: constraints = {},
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    request: request = generateText,
    onProgress: onProgress = null,
    resumeCheckpoint: resumeCheckpoint = null,
    resumeResponses: resumeResponses = {},
    onCheckpoint: onCheckpoint = null,
    onInvocation: onInvocation = null,
  } = {}) {
    assertPlanningModel(model, provider);
    const constraints4 = resolveStoryPlanningConstraints(project, constraints);
    if (constraints4['episodeCount'] <= value) {
      if (resumeCheckpoint) {
        const error4 = new Error('单次分集大纲与旧分批断点不兼容，不能安全续跑。');
        error4['code'] = 'CHECKPOINT_INCOMPATIBLE';
        throw error4;
      }
      onProgress?.({
        stage: 'planning-episode-outlines',
        current: 1,
        total: 1,
        message: '正在一次生成全部 ' + constraints4['episodeCount'] + ' 集分集大纲',
      });
      const prompt2 = buildStoryEpisodeOutlinePrompt({ project: project, constraints: constraints4 }),
        result3 = await requestStrictResult({
          request: request,
          requestPayload: {
            model: normalizeText(model),
            provider: normalizeText(provider),
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: prompt2,
            systemPrompt: systemPrompt,
            structuredOutput: structuredOutput(
              'story_episode_outlines_complete',
              run(constraints4['episodeCount']),
            ),
            temperature: 0.35,
            timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
          },
          parse: (value31) => run8(value31, constraints4),
          outputContract:
            'storyFacts[] and 1-' +
            constraints4['episodeCount'] +
            ' complete episodes [{ref,number,title,coreBeat,endingEvent,activeCharacters[],synopsis,hook,continuityFacts[],endingState{characters[],props[],unresolvedThreads[]},estimatedDurationSeconds?}]',
          maxAttempts: 2,
          repairInstruction:
            '只修复这一份完整分集大纲 JSON；保留全部有效分集和既定结局，补齐缺失字段，不要改成骨架或分批结果。',
          retryTemperature: 0.15,
          ...(resumeResponses?.['complete'] ? { resumeResponse: resumeResponses['complete'] } : {}),
          ...run12('complete', onInvocation),
        });
      return run11({
        project: project,
        result: result3,
        normalizedConstraints: constraints4,
        request: request,
        requestPayload: {
          model: normalizeText(model),
          provider: normalizeText(provider),
          ...buildStoryTextProviderProfilePayload(providerProfileId),
          timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
          maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
        },
        onProgress: onProgress,
        onInvocation: onInvocation,
      });
    }
    const value32 = run13(resumeCheckpoint, constraints4);
    let skeleton3 = value32?.['skeleton'] || null;
    if (!skeleton3) {
      onProgress?.({
        stage: 'planning-episode-skeleton',
        current: 1,
        total: 1,
        message: '正在规划全剧分集骨架',
      });
      const prompt3 = run5({ project: project, constraints: constraints4 });
      ((skeleton3 = await requestStrictResult({
        request: request,
        requestPayload: {
          model: normalizeText(model),
          provider: normalizeText(provider),
          ...buildStoryTextProviderProfilePayload(providerProfileId),
          prompt: prompt3,
          systemPrompt: systemPrompt2,
          structuredOutput: structuredOutput(
            'story_episode_outline_skeleton',
            run2(constraints4['episodeCount']),
          ),
          temperature: 0.35,
          timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
          maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
        },
        parse: (value33) => parseStoryEpisodeOutlineSkeletonResult(value33, constraints4),
        outputContract:
          'storyFacts[] and episodes (1-' +
          constraints4['episodeCount'] +
          ') [{ref,number,title,coreBeat,endingEvent,activeCharacters[]}]',
        repairInstruction: '只修复全剧骨架 JSON；保持紧凑，不要提前生成详细 synopsis 或 hook。',
        retryTemperature: 0.2,
        ...(resumeResponses?.['skeleton'] ? { resumeResponse: resumeResponses['skeleton'] } : {}),
        ...run12('skeleton', onInvocation),
      })),
        await onCheckpoint?.({
          version: version,
          episodeCount: constraints4['episodeCount'],
          skeleton: skeleton2(skeleton3),
          plannedEpisodes: [],
          nextBatchIndex: 0,
          previousEndingState: null,
        }));
    }
    const total = createStoryEpisodeOutlineBatches(skeleton3['episodes']),
      value34 = value32?.['nextBatchIndex'] || 0,
      value35 = total['slice'](0, value34)['reduce']((value36, list10) => value36 + list10['length'], 0);
    if (value34 > total['length'] || (value32 && value32['plannedEpisodes']['length'] !== value35)) {
      const error5 = new Error('分集大纲断点内容不完整，不能安全续跑。');
      error5['code'] = 'CHECKPOINT_INCOMPATIBLE';
      throw error5;
    }
    const episodes5 = value32?.['plannedEpisodes'] || [];
    let previousEndingState2 =
      value32?.['previousEndingState'] || episodes5['at'](-1)?.['endingState'] || null;
    for (let current2 = value34; current2 < total['length']; current2 += 1) {
      const batchEpisodes2 = total[current2],
        value37 = batchEpisodes2[0]?.['number'] || episodes5['length'] + 1,
        value38 = batchEpisodes2['at'](-1)?.['number'] || value37;
      onProgress?.({
        stage: 'planning-episode-outlines',
        current: current2 + 1,
        total: total['length'],
        message:
          '正在细化第 ' +
          value37 +
          '-' +
          value38 +
          ' 集大纲（' +
          (current2 + 1) +
          '/' +
          total['length'] +
          '）',
      });
      const prompt4 = buildStoryEpisodeOutlineBatchPrompt({
          project: project,
          constraints: constraints4,
          skeleton: skeleton3,
          batchEpisodes: batchEpisodes2,
          batchIndex: current2 + 1,
          batchTotal: total['length'],
          previousEndingState: previousEndingState2,
        }),
        args4 = await requestStrictResult({
          request: request,
          requestPayload: {
            model: normalizeText(model),
            provider: normalizeText(provider),
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: prompt4,
            systemPrompt: systemPrompt3,
            structuredOutput: structuredOutput(
              'story_episode_outline_batch_' + (current2 + 1),
              run3(batchEpisodes2['length']),
            ),
            temperature: 0.3,
            timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
            maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
          },
          parse: (value39) =>
            parseStoryEpisodeOutlineBatchResult(value39, { expectedEpisodes: batchEpisodes2 }),
          outputContract:
            'exactly ' +
            batchEpisodes2['length'] +
            ' episodes [{ref,number,title,synopsis,hook,continuityFacts[],endingState{characters[],props[],unresolvedThreads[]},estimatedDurationSeconds?}]',
          repairInstruction: '只修复当前批次 JSON；严格沿用骨架和上一批结束状态，hook 不得新增事实。',
          retryTemperature: 0.15,
          ...(resumeResponses?.['detail:' + (current2 + 1)]
            ? { resumeResponse: resumeResponses['detail:' + (current2 + 1)] }
            : {}),
          ...run12('detail:' + (current2 + 1), onInvocation),
        });
      (episodes5['push'](...args4['episodes']),
        (previousEndingState2 = args4['episodes']['at'](-1)?.['endingState'] || previousEndingState2),
        await onCheckpoint?.({
          version: version,
          episodeCount: constraints4['episodeCount'],
          skeleton: skeleton2(skeleton3),
          plannedEpisodes: skeleton2(episodes5),
          nextBatchIndex: current2 + 1,
          previousEndingState: skeleton2(previousEndingState2),
        }));
    }
    const result4 = {
      schemaVersion: STORY_EPISODE_OUTLINE_SCHEMA_VERSION,
      constraints: constraints4,
      storyFacts: skeleton3['storyFacts'],
      episodes: episodes5,
    };
    return run11({
      project: project,
      result: result4,
      normalizedConstraints: constraints4,
      request: request,
      requestPayload: {
        model: normalizeText(model),
        provider: normalizeText(provider),
        ...buildStoryTextProviderProfilePayload(providerProfileId),
        timeoutMs: STORY_TEXT_REQUEST_TIMEOUT_MS,
        maxOutputTokens: STORY_TEXT_MAX_OUTPUT_TOKENS,
      },
      onProgress: onProgress,
      onInvocation: onInvocation,
    });
  }
  return {
    buildStoryNarrativeSummary: storySummary,
    buildStoryEpisodeOutlinePrompt: buildStoryEpisodeOutlinePrompt,
    parseStoryEpisodeOutlineSkeletonResult: parseStoryEpisodeOutlineSkeletonResult,
    createStoryEpisodeOutlineBatches: createStoryEpisodeOutlineBatches,
    buildStoryEpisodeOutlineBatchPrompt: buildStoryEpisodeOutlineBatchPrompt,
    parseStoryEpisodeOutlineBatchResult: parseStoryEpisodeOutlineBatchResult,
    parseStoryEpisodeOutlineResult: parseStoryEpisodeOutlineResult,
    planStoryEpisodeOutlines: planStoryEpisodeOutlines,
    STORY_EPISODE_OUTLINE_CHECKPOINT_VERSION: version,
  };
}
