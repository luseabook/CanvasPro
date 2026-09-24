export function createStoryEpisodeOutlinePlanningApi({
  generateText: _0x565c4c,
  parseStrictJson: _0x49aac8,
  normalizeText: _0x113d53,
  normalizeStringArray: _0x5a4b14,
  normalizeStoryContinuityFacts: _0x5d5f5a,
  normalizeStoryContinuityState: _0x5e3b09,
  hasStoryContinuityState: _0xc44fe2,
  normalizePositiveNumber: _0x472c45,
  normalizeStorySummaryCharacter: _0x1db8d6,
  normalizeStoryContract: _0x58f367,
  normalizeStoryPlotBeat: _0x4afe27,
  normalizeStoryScriptMode: _0x300e95,
  normalizeStoryPlanningConstraints: _0x5a9a83,
  resolveStoryPlanningConstraints: _0x4451d8,
  getResultText: _0x10d023,
  assertPlanningModel: _0xd3e6d1,
  buildStoryTextProviderProfilePayload: _0x3e0d00,
  requestStrictResult: _0x2d9a39,
  STORY_EPISODE_OUTLINE_SCHEMA_VERSION: _0x4da327,
  STORY_SCRIPT_MODE_NARRATION: _0x52a3b7,
  STORY_EPISODE_OUTLINE_BATCH_SIZE: _0x5052a1,
  STORY_SUMMARY_MAX_PLOT_BEATS: _0xb0cc49,
  STORY_CONTINUITY_MAX_FACTS: _0x5c0466,
  STORY_CONTINUITY_MAX_CHARACTER_STATES: _0xf26ad,
  STORY_CONTINUITY_MAX_PROP_STATES: _0x4781f5,
  STORY_CONTINUITY_MAX_UNRESOLVED_THREADS: _0x19edbd,
  STORY_TEXT_REQUEST_TIMEOUT_MS: _0x143008,
  STORY_TEXT_MAX_OUTPUT_TOKENS: _0x1270bd,
} = {}) {
  const _0x2a9773 = 0x1,
    _0x18d1d0 = 0x14,
    _0x1011c5 = [
      '你是一名专业的短剧分集大纲策划。',
      '当前阶段必须在一次响应中完成全剧结构规划和全部详细分集简介，不要拆成骨架与细化两个响应。',
      'episodeCount 是目标分集数，不要求机械地精确凑满；应优先规划接近目标的完整故事，通常保持在目标数的 90% 到 100%，且不得超过目标数。',
      '先在内部完成起因、发展、转折、高潮和结局的分配，再一次性输出\x20storyFacts\x20与全部\x20episodes。',
      '每集必须有不可被相邻集替代的核心推进、完整剧情简介、已经发生的结束事件和由该事件包装出的 hook。',
      '相邻分集必须因果连续；人物、武器、道具、地点和关系发生变化时，在 synopsis 中交代原因，并在 endingState 中记录结果。',
      '最后一集必须完成摘要已经确定的主要结局。',
      '不生成分场正文、对白、分镜或视觉提示词。',
      '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    ]['join']('\x0a'),
    _0x13cec6 = [
      '你是一名专业的短剧全剧结构策划。',
      '当前阶段只根据已经确认的剧本摘要生成紧凑的全剧骨架和跨集事实台账，不生成详细分集简介、对白、分镜或视觉提示词。',
      'episodeCount\x20是目标分集数，不要求机械地精确凑满；应优先规划接近目标的完整故事，通常保持在目标数的\x2090%\x20到\x20100%，且不得超过目标数。',
      '只有故事容量确实不足时才可低于建议范围；不得因输出篇幅、模型省略或提前收束剧情而大幅减少集数。',
      '按顺序覆盖完整故事的起因、发展、转折、高潮与结局。',
      '每集只规划一个核心推进和一个已经发生的结束事件；结束事件不是额外创造的悬念。',
      '每集核心推进必须不可被相邻集替代或删除；禁止拆分同一结果、换句话复述前集、重复总结已发生事件或用纯尾声凑集数。',
      'storyFacts\x20只保存跨集必须保持一致的姓名、身份、关系、能力、武器、关键道具与世界规则；同一事实只写一次。',
      '相同人物、武器和道具必须始终使用同一名称；发生更换、损毁、转移时，必须把原因规划为明确事件。',
      '最后一集必须完成摘要已经确定的主要结局。',
      '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    ]['join']('\x0a'),
    _0x7e93ad = [
      '你是一名专业的短剧分集大纲策划。',
      '当前只细化输入\x20batch.episodes，不得改写全剧骨架、storyFacts、previousEndingState\x20或摘要中的结局。',
      '必须按\x20batch.episodes\x20的顺序逐集推进；前一集\x20endingState\x20是后一集的起始事实。',
      'synopsis 写清本集开端、主要行动、冲突升级、关系或信息变化，并以骨架指定的 endingEvent 收束。',
      'synopsis 中每个事件只写一次；禁止在末尾用同义句复述前文结论，也禁止把同一行动重复描述为过程和总结。',
      'hook\x20只负责把\x20endingEvent\x20表现成观众可感知的悬念或期待，不得新增人物、武器、道具、秘密、规则或事件。',
      'continuityFacts 只列本集写作时必须保持的事实，尤其是出场人物的身份、关系、能力、当前武器和关键道具。',
      'endingState 只记录本集结束时仍会影响后续的人物、道具和未解决线索；保持简洁，不复述 synopsis。',
      '人物更换武器、获得道具、受伤、死亡、转移地点或改变关系时，synopsis 必须明确交代原因，endingState 必须反映结果。',
      '只返回当前批次的详细分集大纲，不生成分场正文、对白、分镜或视觉提示词。',
      '所有输出使用简体中文，只返回严格 JSON，不要输出 Markdown、注释或说明。',
    ]['join']('\x0a');
  function _0x1d6e37(_0x45c037, _0x2ffe75) {
    return { name: _0x45c037, schema: _0x2ffe75, strict: !![], fallback: 'prompt' };
  }
  function _0x2b9c4b() {
    return {
      type: 'object',
      additionalProperties: ![],
      required: ['characters', 'props', 'unresolvedThreads'],
      properties: {
        characters: { type: 'array', maxItems: _0xf26ad, items: { type: 'string' } },
        props: { type: 'array', maxItems: _0x4781f5, items: { type: 'string' } },
        unresolvedThreads: { type: 'array', maxItems: _0x19edbd, items: { type: 'string' } },
      },
    };
  }
  function _0x540b82({ includeArcFields: includeArcFields = !![] } = {}) {
    return {
      type: 'object',
      additionalProperties: ![],
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
        number: { type: 'integer', minimum: 0x1 },
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
        continuityFacts: { type: 'array', maxItems: _0x5c0466, items: { type: 'string' } },
        endingState: _0x2b9c4b(),
        estimatedDurationSeconds: { type: 'number', exclusiveMinimum: 0x0 },
      },
    };
  }
  function _0x175a38(_0x447452) {
    const _0x3f54f2 = Math['max'](0x1, Math['trunc'](Number(_0x447452) || 0x1));
    return {
      type: 'object',
      additionalProperties: ![],
      required: ['storyFacts', 'episodes'],
      properties: {
        storyFacts: { type: 'array', maxItems: _0x5c0466, items: { type: 'string' } },
        episodes: { type: 'array', minItems: 0x1, maxItems: _0x3f54f2, items: _0x540b82() },
      },
    };
  }
  function _0xb514fd(_0x2e86ec) {
    const _0x28995c = Math['max'](0x1, Math['trunc'](Number(_0x2e86ec) || 0x1));
    return {
      type: 'object',
      additionalProperties: ![],
      required: ['storyFacts', 'episodes'],
      properties: {
        storyFacts: { type: 'array', maxItems: _0x5c0466, items: { type: 'string' } },
        episodes: {
          type: 'array',
          minItems: 0x1,
          maxItems: _0x28995c,
          items: {
            type: 'object',
            additionalProperties: ![],
            required: ['ref', 'number', 'title', 'coreBeat', 'endingEvent', 'activeCharacters'],
            properties: {
              ref: { type: 'string' },
              number: { type: 'integer', minimum: 0x1 },
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
  function _0x352ae7(_0x277baf) {
    const _0x1cbf64 = Math['max'](0x1, Math['trunc'](Number(_0x277baf) || 0x1));
    return {
      type: 'object',
      additionalProperties: ![],
      required: ['episodes'],
      properties: {
        episodes: {
          type: 'array',
          minItems: _0x1cbf64,
          maxItems: _0x1cbf64,
          items: _0x540b82({ includeArcFields: ![] }),
        },
      },
    };
  }
  function _0x2e4c9f(_0x3e6a43 = {}) {
    const _0x58be71 = Array['isArray'](_0x3e6a43?.['characters'])
        ? _0x3e6a43['characters']['map'](_0x1db8d6)['filter'](Boolean)
        : [],
      _0x16c0b9 = {
        title: _0x113d53(_0x3e6a43?.['title']),
        storyType: _0x113d53(_0x3e6a43?.['storyType']),
        targetAudience: _0x113d53(_0x3e6a43?.['targetAudience']),
        summary: _0x113d53(_0x3e6a43?.['summary'] || _0x3e6a43?.['storySummary']),
        background: _0x113d53(_0x3e6a43?.['background'] || _0x3e6a43?.['storyBackground']),
        setting: _0x113d53(_0x3e6a43?.['setting'] || _0x3e6a43?.['storySetting']),
        coreHook: _0x113d53(_0x3e6a43?.['coreHook']),
        logline: _0x113d53(_0x3e6a43?.['logline']),
        storyContract: _0x58f367(_0x3e6a43?.['storyContract']),
        plotBeats: Array['isArray'](_0x3e6a43?.['plotBeats'])
          ? _0x3e6a43['plotBeats']['map'](_0x4afe27)['filter'](Boolean)['slice'](0x0, _0xb0cc49)
          : [],
        continuityFacts: _0x5a4b14(_0x3e6a43?.['continuityFacts'])['slice'](0x0, _0x5c0466),
        characters: _0x58be71,
      };
    if (!_0x16c0b9['title'] || !_0x16c0b9['summary'] || !_0x16c0b9['logline'])
      throw new Error('请先生成剧本摘要。');
    return _0x16c0b9;
  }
  function _0x844f3a(_0x146f40 = {}) {
    const _0x11233b = _0x2e4c9f(_0x146f40);
    return {
      ..._0x11233b,
      storyFacts: _0x5d5f5a([
        ..._0x11233b['continuityFacts'],
        ...(Array['isArray'](_0x146f40?.['storyFacts']) ? _0x146f40['storyFacts'] : []),
      ]),
      characters: _0x11233b['characters']['map']((_0x347cc5) => ({
        ref: _0x347cc5['ref'],
        name: _0x347cc5['name'],
        roleType: _0x347cc5['roleType'],
        fixedTraits: _0x347cc5['fixedTraits'],
        coreTags: _0x347cc5['coreTags'],
        profile: _0x347cc5['profile'],
        motivation: _0x347cc5['motivation'],
        relationships: _0x347cc5['relationships'],
        personality: _0x347cc5['personality'],
        arc: _0x347cc5['arc'],
      })),
    };
  }
  function _0x532b51({ project: project = {}, constraints: constraints = {} } = {}) {
    const _0x35ea54 = _0x844f3a(project),
      _0x284c77 = _0x300e95(project?.['scriptMode']),
      _0x3e306 = _0x4451d8(project, constraints),
      _0x2aca6d = _0x3e306['episodeCount'],
      _0x2601ed = Math['max'](0x1, Math['ceil'](_0x2aca6d * 0.9));
    return JSON['stringify']({
      task: 'plan_story_episode_outlines',
      schemaVersion: _0x4da327,
      phase: 'skeleton',
      scriptMode: _0x284c77,
      storySummary: _0x35ea54,
      constraints: _0x3e306,
      requirements: [
        '目标生成约 ' +
          _0x2aca6d +
          ' 集，建议保持在 ' +
          _0x2601ed +
          '-' +
          _0x2aca6d +
          ' 集；不要求机械凑满，但不得超过 ' +
          _0x2aca6d +
          ' 集。',
        '先在内部完成全剧集数和起因、发展、转折、高潮、结局的分配，再输出骨架；不得为了缩短输出而压缩中段、合并关键推进或提前进入结局。',
        '只有故事容量确实不足时才可少于 ' +
          _0x2601ed +
          ' 集；此时仍须保证完整因果链，不能把模型输出限制当作缩减集数的理由。',
        '先建立紧凑全剧骨架；每集 coreBeat 和 endingEvent 各只写一句，不展开成详细简介。',
        'storyFacts 统一登记跨集不应漂移的人物身份、关系、能力、武器、关键道具和世界规则。',
        '相邻分集必须因果连续；人物、武器或道具发生改变时，必须把原因安排为明确的 coreBeat 或 endingEvent。',
        '每集必须提供不可被相邻集替代的新行动、新信息或不可逆状态变化；禁止把同一事件拆成多集、重复总结或用尾声注水。',
        '最后一集必须完成摘要中已经确定的主要结局。',
        _0x284c77 === _0x52a3b7
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
  function _0x375da1(_0x24270b = {}) {
    const _0x2656af = JSON['parse'](_0x532b51(_0x24270b)),
      _0x2dc3e4 = _0x2656af['scriptMode'];
    return JSON['stringify']({
      ..._0x2656af,
      phase: 'complete',
      requirements: [
        _0x2656af['requirements'][0x0],
        '先在内部完成全剧骨架和跨集事实分配，再在同一次响应中输出全部详细分集简介；不要输出中间骨架。',
        '不得为了缩短输出而压缩中段、合并关键推进或提前进入结局。',
        _0x2656af['requirements'][0x2],
        _0x2656af['requirements'][0x4],
        _0x2656af['requirements'][0x5],
        '每集 coreBeat 和 endingEvent 各只描述一个不可替代的核心推进与已发生的结束事件。',
        'synopsis 写清本集开端、主要行动、冲突升级、关系或信息变化，并以 endingEvent 收束；每个事件只写一次。',
        'hook 只包装 endingEvent，不得新增 synopsis、storyFacts 或故事摘要中不存在的人物、道具、秘密、规则或事件。',
        'continuityFacts\x20只列本集创作时必须保持的事实；endingState\x20只记录本集结束后仍会影响后续的人物、道具与未解决线索。',
        '相邻分集必须直接继承前一集 endingState；状态发生改变时，synopsis 必须明确交代原因。',
        'estimatedDurationSeconds\x20仅在能够根据本集必要剧情自然估算时返回；它不是写作约束，不设固定最低或最高集长。',
        _0x2656af['requirements'][0x6],
        _0x2656af['requirements'][0x7],
        _0x2dc3e4 === _0x52a3b7
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
  function _0x7b3331(_0x3338d4, { episodeCount: episodeCount = 0x3 } = {}) {
    const _0x2b7ec3 = _0x49aac8(_0x10d023(_0x3338d4), 'Agent 未返回全剧分集骨架。'),
      _0x1b8c1f = _0x5a9a83({ episodeCount: episodeCount })['episodeCount'],
      _0x25c386 = Array['isArray'](_0x2b7ec3['episodes']) ? _0x2b7ec3['episodes'] : [],
      _0x3ea9c7 = _0x25c386['map']((_0x43fe79, _0x44d999) => ({
        ref: _0x113d53(_0x43fe79?.['ref']) || 'episode-' + (_0x44d999 + 0x1),
        number: _0x44d999 + 0x1,
        title: _0x113d53(_0x43fe79?.['title']),
        coreBeat: _0x113d53(_0x43fe79?.['coreBeat']),
        endingEvent: _0x113d53(_0x43fe79?.['endingEvent']),
        activeCharacters: _0x5a4b14(_0x43fe79?.['activeCharacters']),
      }));
    if (!_0x3ea9c7['length']) throw new Error('Agent\x20返回结果没有可用全剧分集骨架。');
    const _0x9291f4 = _0x3ea9c7['find'](
      (_0x4c7f04) => !_0x4c7f04['title'] || !_0x4c7f04['coreBeat'] || !_0x4c7f04['endingEvent'],
    );
    if (_0x9291f4)
      throw new Error('Agent 返回的第 ' + _0x9291f4['number'] + '\x20集骨架缺少标题、核心推进或结束事件。');
    if (_0x3ea9c7['length'] > _0x1b8c1f)
      throw new Error(
        'Agent\x20返回了\x20' + _0x3ea9c7['length'] + ' 集分集骨架，超过 ' + _0x1b8c1f + ' 集上限。',
      );
    if (new Set(_0x3ea9c7['map']((_0x49ec2c) => _0x49ec2c['ref']))['size'] !== _0x3ea9c7['length'])
      throw new Error('Agent 返回了重复的分集骨架引用。');
    return { schemaVersion: _0x4da327, storyFacts: _0x5d5f5a(_0x2b7ec3['storyFacts']), episodes: _0x3ea9c7 };
  }
  function _0x58f4d5(_0x239052 = [], { batchSize: batchSize = _0x5052a1 } = {}) {
    const _0xa0e5d9 = Array['isArray'](_0x239052) ? _0x239052 : [],
      _0x51963b = Math['max'](0x1, Math['trunc'](Number(batchSize) || 0x1)),
      _0x3fac81 = [];
    for (let _0x3ff51a = 0x0; _0x3ff51a < _0xa0e5d9['length']; _0x3ff51a += _0x51963b) {
      _0x3fac81['push'](_0xa0e5d9['slice'](_0x3ff51a, _0x3ff51a + _0x51963b));
    }
    return _0x3fac81;
  }
  function _0x3c5218(_0x4ea249 = {}, _0x2f8dce = []) {
    const _0x2cd93c = _0x844f3a(_0x4ea249),
      _0x4ba687 = new Set(
        (Array['isArray'](_0x2f8dce) ? _0x2f8dce : [])['flatMap']((_0x4fc97e) =>
          _0x5a4b14(_0x4fc97e?.['activeCharacters']),
        ),
      );
    return {
      title: _0x2cd93c['title'],
      storyType: _0x2cd93c['storyType'],
      summary: _0x2cd93c['summary'],
      setting: _0x2cd93c['setting'],
      coreHook: _0x2cd93c['coreHook'],
      logline: _0x2cd93c['logline'],
      characters: _0x2cd93c['characters']
        ['filter']((_0xbc9f85) => _0x4ba687['has'](_0xbc9f85['name']))
        ['map']((_0x2c1ad9) => ({
          ref: _0x2c1ad9['ref'],
          name: _0x2c1ad9['name'],
          roleType: _0x2c1ad9['roleType'],
          coreTags: _0x2c1ad9['coreTags'],
          motivation: _0x2c1ad9['motivation'],
          relationships: _0x2c1ad9['relationships'],
          personality: _0x2c1ad9['personality'],
          arc: _0x2c1ad9['arc'],
        })),
    };
  }
  function _0x128c67(_0x3f8d0f = {}) {
    return {
      number: Math['max'](0x1, Math['trunc'](Number(_0x3f8d0f?.['number']) || 0x1)),
      coreBeat: _0x113d53(_0x3f8d0f?.['coreBeat']),
      endingEvent: _0x113d53(_0x3f8d0f?.['endingEvent']),
    };
  }
  function _0x5e7627({
    project: project = {},
    constraints: constraints = {},
    skeleton: skeleton = {},
    batchEpisodes: batchEpisodes = [],
    batchIndex: batchIndex = 0x0,
    batchTotal: batchTotal = 0x1,
    previousEndingState: previousEndingState = null,
  } = {}) {
    const _0x23c5c5 = _0x300e95(project?.['scriptMode']),
      _0x438d1a = _0x4451d8(project, constraints),
      _0x1c20ea = Array['isArray'](skeleton?.['episodes']) ? skeleton['episodes'] : [],
      _0x34f5ef = Array['isArray'](batchEpisodes) ? batchEpisodes : [];
    if (!_0x34f5ef['length']) throw new Error('当前没有可细化的分集骨架。');
    const _0x5de37d = _0x113d53(_0x34f5ef['at'](-0x1)?.['ref']),
      _0x55677f = _0x1c20ea['findIndex']((_0x78e83a) => _0x113d53(_0x78e83a?.['ref']) === _0x5de37d),
      _0x1b2c4a = _0x55677f >= 0x0 ? _0x1c20ea[_0x55677f + 0x1] || null : null,
      _0x1c05fb = _0x3c5218(project, [..._0x34f5ef, ...(_0x1b2c4a ? [_0x1b2c4a] : [])]),
      _0x37d21d = _0x5e3b09(previousEndingState);
    return JSON['stringify']({
      task: 'plan_story_episode_outline_batch',
      schemaVersion: _0x4da327,
      phase: 'detail',
      scriptMode: _0x23c5c5,
      storyContext: _0x1c05fb,
      storyFacts: _0x5d5f5a(skeleton?.['storyFacts']),
      storyArc: _0x1c20ea['map'](_0x128c67),
      batch: {
        index: Math['max'](0x1, Math['trunc'](Number(batchIndex) || 0x1)),
        total: Math['max'](0x1, Math['trunc'](Number(batchTotal) || 0x1)),
        episodes: _0x34f5ef,
      },
      continuity: { previousEndingState: _0xc44fe2(_0x37d21d) ? _0x37d21d : null, nextEpisode: _0x1b2c4a },
      constraints: _0x438d1a,
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
        _0x23c5c5 === _0x52a3b7
          ? '按第三人称旁白可顺畅串联的因果节拍组织\x20synopsis，不写旁白成稿。'
          : '按人物行动、关系碰撞和关键对白可承载的节拍组织\x20synopsis。',
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
  function _0x50cbd1(_0x4a83df, { expectedEpisodes: expectedEpisodes = [] } = {}) {
    const _0x11959c = _0x49aac8(_0x10d023(_0x4a83df), 'Agent 未返回分批分集大纲。'),
      _0x101f8a = Array['isArray'](expectedEpisodes) ? expectedEpisodes : [],
      _0x2b0323 = Array['isArray'](_0x11959c['episodes']) ? _0x11959c['episodes'] : [];
    if (_0x2b0323['length'] !== _0x101f8a['length'])
      throw new Error(
        'Agent\x20应返回\x20' +
          _0x101f8a['length'] +
          '\x20集分集大纲，实际返回\x20' +
          _0x2b0323['length'] +
          '\x20集。',
      );
    const _0x553663 = _0x2b0323['map']((_0x5e99c3, _0x4d9b12) => {
      const _0x15f34b = _0x101f8a[_0x4d9b12] || {},
        _0x94b1e = _0x113d53(_0x15f34b?.['ref']),
        _0x1007c8 = _0x113d53(_0x5e99c3?.['ref']);
      if (!_0x1007c8 || _0x1007c8 !== _0x94b1e)
        throw new Error(
          'Agent 返回的第 ' + (_0x4d9b12 + 0x1) + '\x20个分集引用应为\x20' + (_0x94b1e || '指定引用') + '。',
        );
      const _0x361a9e = _0x113d53(_0x5e99c3?.['synopsis']),
        _0x1f764e = _0x113d53(_0x5e99c3?.['hook']),
        _0x4e1147 = _0x5e3b09(_0x5e99c3?.['endingState']);
      if (!_0x361a9e || !_0x1f764e)
        throw new Error(
          'Agent 返回的分集“' + (_0x113d53(_0x5e99c3?.['title']) || _0x94b1e) + '”缺少简介或钩子。',
        );
      if (!_0xc44fe2(_0x4e1147))
        throw new Error(
          'Agent 返回的分集“' + (_0x113d53(_0x5e99c3?.['title']) || _0x94b1e) + '”缺少有效结束状态。',
        );
      const _0x477861 = _0x472c45(_0x5e99c3?.['estimatedDurationSeconds']);
      return {
        ..._0x15f34b,
        ref: _0x94b1e,
        number: Math['max'](0x1, Math['trunc'](Number(_0x15f34b?.['number']) || _0x4d9b12 + 0x1)),
        title: _0x113d53(_0x5e99c3?.['title']) || _0x113d53(_0x15f34b?.['title']),
        synopsis: _0x361a9e,
        hook: _0x1f764e,
        continuityFacts: _0x5d5f5a(_0x5e99c3?.['continuityFacts']),
        endingState: _0x4e1147,
        sourceChapterIds: [],
        assetRefs: [],
        ...(_0x477861 ? { estimatedDurationSeconds: _0x477861 } : {}),
      };
    });
    return { schemaVersion: _0x4da327, episodes: _0x553663 };
  }
  function _0xc6abf3(_0xd675af, { episodeCount: episodeCount = 0x3 } = {}) {
    const _0x3c4ca5 = _0x49aac8(_0x10d023(_0xd675af), 'Agent\x20未返回分集大纲。'),
      _0x544c40 = _0x5a9a83({ episodeCount: episodeCount })['episodeCount'],
      _0x4e6189 = Array['isArray'](_0x3c4ca5['episodes'])
        ? _0x3c4ca5['episodes']
            ['map']((_0x5c4542, _0x26b59b) => {
              const _0x46bdc1 = _0x472c45(_0x5c4542?.['estimatedDurationSeconds']);
              return {
                ref: _0x113d53(_0x5c4542?.['ref']) || 'episode-' + (_0x26b59b + 0x1),
                number: _0x26b59b + 0x1,
                title: _0x113d53(_0x5c4542?.['title']),
                synopsis: _0x113d53(_0x5c4542?.['synopsis']),
                hook: _0x113d53(_0x5c4542?.['hook']),
                coreBeat: _0x113d53(_0x5c4542?.['coreBeat']),
                endingEvent: _0x113d53(_0x5c4542?.['endingEvent']),
                activeCharacters: _0x5a4b14(_0x5c4542?.['activeCharacters']),
                continuityFacts: _0x5d5f5a(_0x5c4542?.['continuityFacts']),
                endingState: _0x5e3b09(_0x5c4542?.['endingState']),
                sourceChapterIds: [],
                assetRefs: [],
                ...(_0x46bdc1 ? { estimatedDurationSeconds: _0x46bdc1 } : {}),
              };
            })
            ['filter']((_0x50ee63) => _0x50ee63['title'] && _0x50ee63['synopsis'] && _0x50ee63['hook'])
        : [];
    if (!_0x4e6189['length']) throw new Error('Agent 返回结果没有可用分集大纲。');
    if (_0x4e6189['length'] > _0x544c40)
      throw new Error('Agent 返回了 ' + _0x4e6189['length'] + ' 集分集大纲，超过 ' + _0x544c40 + ' 集上限。');
    if (new Set(_0x4e6189['map']((_0x3771d5) => _0x3771d5['ref']))['size'] !== _0x4e6189['length'])
      throw new Error('Agent 返回了重复的分集引用。');
    return {
      schemaVersion: _0x4da327,
      constraints: _0x5a9a83({ episodeCount: _0x544c40 }),
      storyFacts: _0x5d5f5a(_0x3c4ca5['storyFacts']),
      episodes: _0x4e6189,
    };
  }
  function _0x4f7c33(_0x3d6642, _0x2a1c27) {
    const _0x4b9e2c = _0xc6abf3(_0x3d6642, _0x2a1c27),
      _0x49ff66 = _0x4b9e2c['episodes']['find'](
        (_0x178534) =>
          !_0x178534['coreBeat'] || !_0x178534['endingEvent'] || !_0xc44fe2(_0x178534['endingState']),
      );
    if (_0x49ff66)
      throw new Error('Agent 返回的第 ' + _0x49ff66['number'] + ' 集缺少核心推进、结束事件或有效结束状态。');
    return _0x4b9e2c;
  }
  function _0x12e5b0(_0x30eb41) {
    return _0x30eb41 == null ? _0x30eb41 : JSON['parse'](JSON['stringify'](_0x30eb41));
  }
  function _0x4cea84(_0x4c2df1) {
    if (_0x4c2df1 === null || _0x4c2df1 === undefined) return '';
    if (typeof _0x4c2df1 !== 'object' || Array['isArray'](_0x4c2df1)) return _0x113d53(_0x4c2df1);
    const _0x1f50aa = _0x113d53(_0x4c2df1['ref'] || _0x4c2df1['episodeRef'] || _0x4c2df1['location']),
      _0x129a38 = _0x113d53(_0x4c2df1['issue'] || _0x4c2df1['reason'] || _0x4c2df1['description']),
      _0x379ff6 = _0x113d53(_0x4c2df1['evidence'] || _0x4c2df1['example']),
      _0x2ec265 = [_0x1f50aa ? '[' + _0x1f50aa + ']' : '', _0x129a38, _0x379ff6 ? '证据：' + _0x379ff6 : ''][
        'filter'
      ](Boolean);
    return _0x2ec265['join']('\x20') || _0x113d53(JSON['stringify'](_0x4c2df1));
  }
  function _0x5d0acd(_0x205dd1, _0x2c6c11) {
    return JSON['stringify']({
      task: 'review_story_episode_outline_timing',
      schemaVersion: 0x1,
      storySummary: _0x844f3a(_0x205dd1),
      outline: _0x2c6c11,
      criteria: [
        '逐集独立估算 synopsis 从开端到 endingEvent 的自然可拍时长，包含对白、等待、移动、操作、环境建立、反应和必要悬念停顿。',
        '允许真实同步发生的动作与对白重叠，但不能把所有顺序动作假设为同时完成。',
        'estimatedDurationSeconds 只是待复核的自然时长估算，不是集长限制；必须根据 synopsis 重新核算，不能直接沿用。',
        '自然时长合理区间包含原估算时 verdict=consistent，否则 verdict=estimate_mismatch；差异只说明时长数字需要更新，不代表剧情必须压缩或扩写。',
        '只测量和举证，不改写大纲，不按固定事件数、场次数、字数或统一集长裁决。',
      ],
      outputContract:
        'episodes\x20exact\x20refs\x20[{ref,verdict(\x27consistent\x27|\x27estimate_mismatch\x27),naturalDurationSeconds,reasonableRangeSeconds{minimum,maximum},reason,findings\x20string[]}]',
    });
  }
  function _0x469bff(_0x1107c0, _0x391caa) {
    const _0x2bc35f = _0x49aac8(_0x10d023(_0x1107c0), '分集大纲审时 Agent 未返回有效 JSON。'),
      _0x479b63 = Array['isArray'](_0x391caa?.['episodes']) ? _0x391caa['episodes'] : [],
      _0x4bba30 = Array['isArray'](_0x2bc35f?.['episodes']) ? _0x2bc35f['episodes'] : [];
    if (_0x4bba30['length'] !== _0x479b63['length'])
      throw new Error(
        '分集大纲审时 Agent 应返回 ' + _0x479b63['length'] + ' 集，实际返回 ' + _0x4bba30['length'] + ' 集。',
      );
    const _0xbd3010 = _0x479b63['map']((_0x26f10e, _0x5bc1f4) => {
      const _0x90b6be = _0x4bba30[_0x5bc1f4] || {},
        _0x37f083 = _0x113d53(_0x26f10e?.['ref']);
      if (_0x113d53(_0x90b6be?.['ref']) !== _0x37f083)
        throw new Error('分集大纲审时 Agent 第 ' + (_0x5bc1f4 + 0x1) + '\x20项引用与原大纲不一致。');
      const _0x4e774f = _0x472c45(_0x90b6be?.['naturalDurationSeconds']),
        _0x1f8538 = _0x472c45(_0x90b6be?.['reasonableRangeSeconds']?.['minimum']),
        _0x2eb718 = _0x472c45(_0x90b6be?.['reasonableRangeSeconds']?.['maximum']);
      if (!_0x4e774f || !_0x1f8538 || !_0x2eb718 || _0x1f8538 > _0x4e774f || _0x2eb718 < _0x4e774f)
        throw new Error('第\x20' + (_0x5bc1f4 + 0x1) + ' 集大纲审时区间无效。');
      const _0x2d0552 = _0x472c45(_0x26f10e?.['estimatedDurationSeconds']),
        _0xbbb943 =
          _0x2d0552 && _0x2d0552 >= _0x1f8538 && _0x2d0552 <= _0x2eb718 ? 'consistent' : 'estimate_mismatch',
        _0x207d09 = _0x113d53(_0x90b6be?.['reason']),
        _0x468fc5 = Array['isArray'](_0x90b6be?.['findings'])
          ? _0x90b6be['findings']['map'](_0x4cea84)['filter'](Boolean)['slice'](0x0, 0x8)
          : [];
      return {
        ref: _0x37f083,
        verdict: _0xbbb943,
        naturalDurationSeconds: _0x4e774f,
        reasonableRangeSeconds: { minimum: _0x1f8538, maximum: _0x2eb718 },
        reason: _0x207d09,
        findings: _0x468fc5,
      };
    });
    return { assessments: _0xbd3010 };
  }
  async function _0x2167ad({
    project: _0xf8acbd,
    result: _0x208276,
    normalizedConstraints: _0x2f1a61,
    request: _0x5d3021,
    requestPayload: _0x4c1bf2,
    onProgress: _0x2da6ed,
    onInvocation: _0x165f87,
  }) {
    if (!_0x113d53(_0xf8acbd?.['originalCreative'])) return _0x208276;
    _0x2da6ed?.({
      stage: 'reviewing-episode-outline-timing',
      current: 0x1,
      total: 0x1,
      message: '正在独立复核分集大纲自然时长',
    });
    const _0x56b16f = await _0x2d9a39({
      request: _0x5d3021,
      requestPayload: {
        ..._0x4c1bf2,
        prompt: _0x5d0acd(_0xf8acbd, _0x208276),
        systemPrompt:
          '你是独立的短剧分集大纲审时员。只根据每集实际内容测量自然表演时长；没有固定集长，不改写大纲，只返回严格\x20JSON。',
        temperature: 0.1,
      },
      parse: (_0x33869b) => _0x469bff(_0x33869b, _0x208276),
      outputContract: 'episodes exact refs with independent natural timing estimates',
      maxAttempts: 0x1,
      ..._0x57ef4e('outline-timing-review', _0x165f87),
    });
    return {
      ..._0x208276,
      episodes: _0x208276['episodes']['map']((_0x59e165, _0x1e4cba) => ({
        ..._0x59e165,
        estimatedDurationSeconds: _0x56b16f['assessments'][_0x1e4cba]['naturalDurationSeconds'],
        outlineTimingReview: _0x56b16f['assessments'][_0x1e4cba],
      })),
    };
  }
  function _0x57ef4e(_0x483e9d, _0x35554a) {
    if (typeof _0x35554a !== 'function') return {};
    return {
      onRequest: ({ attempt: _0xde8120, requestPayload: _0x5e5f0a }) =>
        _0x35554a({ state: 'prepared', stepId: _0x483e9d, attempt: _0xde8120, requestPayload: _0x5e5f0a }),
      onResponse: ({ attempt: _0xb49b95, response: _0x331e72, requestPayload: _0xb1409a }) =>
        _0x35554a({
          state: 'completed',
          stepId: _0x483e9d,
          attempt: _0xb49b95,
          requestPayload: _0xb1409a,
          rawResponse: _0x10d023(_0x331e72),
        }),
      onRequestError: ({ attempt: _0x12ea7d, error: _0x4cfeca, requestPayload: _0x1e1b8e }) =>
        _0x35554a({
          state:
            _0x4cfeca?.['safeToRetry'] === !![] || _0x4cfeca?.['requestSubmitted'] === ![]
              ? 'not-submitted'
              : 'outcome-unknown',
          stepId: _0x483e9d,
          attempt: _0x12ea7d,
          requestPayload: _0x1e1b8e,
          error: _0x4cfeca?.['message'] || String(_0x4cfeca || '模型请求失败'),
        }),
    };
  }
  function _0x4331e7(_0x54466d, _0x2acb0c) {
    if (!_0x54466d) return null;
    if (
      typeof _0x54466d !== 'object' ||
      Array['isArray'](_0x54466d) ||
      Number(_0x54466d['version']) !== _0x2a9773 ||
      Number(_0x54466d['episodeCount']) !== _0x2acb0c['episodeCount'] ||
      !_0x54466d['skeleton'] ||
      !Array['isArray'](_0x54466d['skeleton']['episodes']) ||
      !Array['isArray'](_0x54466d['plannedEpisodes'])
    ) {
      const _0x1f68a1 = new Error('分集大纲断点版本或输入不兼容，不能安全续跑。');
      _0x1f68a1['code'] = 'CHECKPOINT_INCOMPATIBLE';
      throw _0x1f68a1;
    }
    return {
      version: _0x2a9773,
      episodeCount: _0x2acb0c['episodeCount'],
      skeleton: _0x12e5b0(_0x54466d['skeleton']),
      plannedEpisodes: _0x12e5b0(_0x54466d['plannedEpisodes']),
      nextBatchIndex: Math['max'](0x0, Math['trunc'](Number(_0x54466d['nextBatchIndex']) || 0x0)),
      previousEndingState: _0x12e5b0(_0x54466d['previousEndingState'] || null),
    };
  }
  async function _0x10d0ae({
    project: project = {},
    constraints: constraints = {},
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    request: request = _0x565c4c,
    onProgress: onProgress = null,
    resumeCheckpoint: resumeCheckpoint = null,
    resumeResponses: resumeResponses = {},
    onCheckpoint: onCheckpoint = null,
    onInvocation: onInvocation = null,
  } = {}) {
    _0xd3e6d1(model, provider);
    const _0x22bf1c = _0x4451d8(project, constraints);
    if (_0x22bf1c['episodeCount'] <= _0x18d1d0) {
      if (resumeCheckpoint) {
        const _0x28bc1a = new Error('单次分集大纲与旧分批断点不兼容，不能安全续跑。');
        _0x28bc1a['code'] = 'CHECKPOINT_INCOMPATIBLE';
        throw _0x28bc1a;
      }
      onProgress?.({
        stage: 'planning-episode-outlines',
        current: 0x1,
        total: 0x1,
        message: '正在一次生成全部 ' + _0x22bf1c['episodeCount'] + '\x20集分集大纲',
      });
      const _0x46ac0b = _0x375da1({ project: project, constraints: _0x22bf1c }),
        _0x379dc9 = await _0x2d9a39({
          request: request,
          requestPayload: {
            model: _0x113d53(model),
            provider: _0x113d53(provider),
            ..._0x3e0d00(providerProfileId),
            prompt: _0x46ac0b,
            systemPrompt: _0x1011c5,
            structuredOutput: _0x1d6e37(
              'story_episode_outlines_complete',
              _0x175a38(_0x22bf1c['episodeCount']),
            ),
            temperature: 0.35,
            timeoutMs: _0x143008,
            maxOutputTokens: _0x1270bd,
          },
          parse: (_0x30d1b2) => _0x4f7c33(_0x30d1b2, _0x22bf1c),
          outputContract:
            'storyFacts[] and 1-' +
            _0x22bf1c['episodeCount'] +
            ' complete episodes [{ref,number,title,coreBeat,endingEvent,activeCharacters[],synopsis,hook,continuityFacts[],endingState{characters[],props[],unresolvedThreads[]},estimatedDurationSeconds?}]',
          maxAttempts: 0x2,
          repairInstruction:
            '只修复这一份完整分集大纲 JSON；保留全部有效分集和既定结局，补齐缺失字段，不要改成骨架或分批结果。',
          retryTemperature: 0.15,
          ...(resumeResponses?.['complete'] ? { resumeResponse: resumeResponses['complete'] } : {}),
          ..._0x57ef4e('complete', onInvocation),
        });
      return _0x2167ad({
        project: project,
        result: _0x379dc9,
        normalizedConstraints: _0x22bf1c,
        request: request,
        requestPayload: {
          model: _0x113d53(model),
          provider: _0x113d53(provider),
          ..._0x3e0d00(providerProfileId),
          timeoutMs: _0x143008,
          maxOutputTokens: _0x1270bd,
        },
        onProgress: onProgress,
        onInvocation: onInvocation,
      });
    }
    const _0xc68089 = _0x4331e7(resumeCheckpoint, _0x22bf1c);
    let _0x2bbf0f = _0xc68089?.['skeleton'] || null;
    if (!_0x2bbf0f) {
      onProgress?.({
        stage: 'planning-episode-skeleton',
        current: 0x1,
        total: 0x1,
        message: '正在规划全剧分集骨架',
      });
      const _0x438173 = _0x532b51({ project: project, constraints: _0x22bf1c });
      ((_0x2bbf0f = await _0x2d9a39({
        request: request,
        requestPayload: {
          model: _0x113d53(model),
          provider: _0x113d53(provider),
          ..._0x3e0d00(providerProfileId),
          prompt: _0x438173,
          systemPrompt: _0x13cec6,
          structuredOutput: _0x1d6e37('story_episode_outline_skeleton', _0xb514fd(_0x22bf1c['episodeCount'])),
          temperature: 0.35,
          timeoutMs: _0x143008,
          maxOutputTokens: _0x1270bd,
        },
        parse: (_0x27c2e7) => _0x7b3331(_0x27c2e7, _0x22bf1c),
        outputContract:
          'storyFacts[] and episodes (1-' +
          _0x22bf1c['episodeCount'] +
          ') [{ref,number,title,coreBeat,endingEvent,activeCharacters[]}]',
        repairInstruction: '只修复全剧骨架 JSON；保持紧凑，不要提前生成详细 synopsis 或 hook。',
        retryTemperature: 0.2,
        ...(resumeResponses?.['skeleton'] ? { resumeResponse: resumeResponses['skeleton'] } : {}),
        ..._0x57ef4e('skeleton', onInvocation),
      })),
        await onCheckpoint?.({
          version: _0x2a9773,
          episodeCount: _0x22bf1c['episodeCount'],
          skeleton: _0x12e5b0(_0x2bbf0f),
          plannedEpisodes: [],
          nextBatchIndex: 0x0,
          previousEndingState: null,
        }));
    }
    const _0x612603 = _0x58f4d5(_0x2bbf0f['episodes']),
      _0x501b64 = _0xc68089?.['nextBatchIndex'] || 0x0,
      _0x44b608 = _0x612603['slice'](0x0, _0x501b64)['reduce'](
        (_0x4133b5, _0x14b9f7) => _0x4133b5 + _0x14b9f7['length'],
        0x0,
      );
    if (
      _0x501b64 > _0x612603['length'] ||
      (_0xc68089 && _0xc68089['plannedEpisodes']['length'] !== _0x44b608)
    ) {
      const _0xacd877 = new Error('分集大纲断点内容不完整，不能安全续跑。');
      _0xacd877['code'] = 'CHECKPOINT_INCOMPATIBLE';
      throw _0xacd877;
    }
    const _0x56e1d2 = _0xc68089?.['plannedEpisodes'] || [];
    let _0x2fa16a = _0xc68089?.['previousEndingState'] || _0x56e1d2['at'](-0x1)?.['endingState'] || null;
    for (let _0x5a5d0b = _0x501b64; _0x5a5d0b < _0x612603['length']; _0x5a5d0b += 0x1) {
      const _0x315626 = _0x612603[_0x5a5d0b],
        _0x3f7be8 = _0x315626[0x0]?.['number'] || _0x56e1d2['length'] + 0x1,
        _0x55b73c = _0x315626['at'](-0x1)?.['number'] || _0x3f7be8;
      onProgress?.({
        stage: 'planning-episode-outlines',
        current: _0x5a5d0b + 0x1,
        total: _0x612603['length'],
        message:
          '正在细化第 ' +
          _0x3f7be8 +
          '-' +
          _0x55b73c +
          ' 集大纲（' +
          (_0x5a5d0b + 0x1) +
          '/' +
          _0x612603['length'] +
          '）',
      });
      const _0x3f2492 = _0x5e7627({
          project: project,
          constraints: _0x22bf1c,
          skeleton: _0x2bbf0f,
          batchEpisodes: _0x315626,
          batchIndex: _0x5a5d0b + 0x1,
          batchTotal: _0x612603['length'],
          previousEndingState: _0x2fa16a,
        }),
        _0x5ace0b = await _0x2d9a39({
          request: request,
          requestPayload: {
            model: _0x113d53(model),
            provider: _0x113d53(provider),
            ..._0x3e0d00(providerProfileId),
            prompt: _0x3f2492,
            systemPrompt: _0x7e93ad,
            structuredOutput: _0x1d6e37(
              'story_episode_outline_batch_' + (_0x5a5d0b + 0x1),
              _0x352ae7(_0x315626['length']),
            ),
            temperature: 0.3,
            timeoutMs: _0x143008,
            maxOutputTokens: _0x1270bd,
          },
          parse: (_0x134a57) => _0x50cbd1(_0x134a57, { expectedEpisodes: _0x315626 }),
          outputContract:
            'exactly ' +
            _0x315626['length'] +
            ' episodes [{ref,number,title,synopsis,hook,continuityFacts[],endingState{characters[],props[],unresolvedThreads[]},estimatedDurationSeconds?}]',
          repairInstruction: '只修复当前批次\x20JSON；严格沿用骨架和上一批结束状态，hook\x20不得新增事实。',
          retryTemperature: 0.15,
          ...(resumeResponses?.['detail:' + (_0x5a5d0b + 0x1)]
            ? { resumeResponse: resumeResponses['detail:' + (_0x5a5d0b + 0x1)] }
            : {}),
          ..._0x57ef4e('detail:' + (_0x5a5d0b + 0x1), onInvocation),
        });
      (_0x56e1d2['push'](..._0x5ace0b['episodes']),
        (_0x2fa16a = _0x5ace0b['episodes']['at'](-0x1)?.['endingState'] || _0x2fa16a),
        await onCheckpoint?.({
          version: _0x2a9773,
          episodeCount: _0x22bf1c['episodeCount'],
          skeleton: _0x12e5b0(_0x2bbf0f),
          plannedEpisodes: _0x12e5b0(_0x56e1d2),
          nextBatchIndex: _0x5a5d0b + 0x1,
          previousEndingState: _0x12e5b0(_0x2fa16a),
        }));
    }
    const _0x4d72ea = {
      schemaVersion: _0x4da327,
      constraints: _0x22bf1c,
      storyFacts: _0x2bbf0f['storyFacts'],
      episodes: _0x56e1d2,
    };
    return _0x2167ad({
      project: project,
      result: _0x4d72ea,
      normalizedConstraints: _0x22bf1c,
      request: request,
      requestPayload: {
        model: _0x113d53(model),
        provider: _0x113d53(provider),
        ..._0x3e0d00(providerProfileId),
        timeoutMs: _0x143008,
        maxOutputTokens: _0x1270bd,
      },
      onProgress: onProgress,
      onInvocation: onInvocation,
    });
  }
  return {
    buildStoryNarrativeSummary: _0x844f3a,
    buildStoryEpisodeOutlinePrompt: _0x375da1,
    parseStoryEpisodeOutlineSkeletonResult: _0x7b3331,
    createStoryEpisodeOutlineBatches: _0x58f4d5,
    buildStoryEpisodeOutlineBatchPrompt: _0x5e7627,
    parseStoryEpisodeOutlineBatchResult: _0x50cbd1,
    parseStoryEpisodeOutlineResult: _0xc6abf3,
    planStoryEpisodeOutlines: _0x10d0ae,
    STORY_EPISODE_OUTLINE_CHECKPOINT_VERSION: _0x2a9773,
  };
}
