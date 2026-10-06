import { buildVideoReplicationAudioLanguageRule } from '../../src/domain/storyGeneration/videoReplicationLanguage.js';
import {
  buildStoryPromptLanguageRule,
  normalizeStoryPromptLanguage,
} from '../../src/domain/storyGeneration/promptLanguage.js';
import { withReplicationRequestPolicy } from './storyRequestPolicy.js';
import {
  getStoryPromptModeLabel,
  isStoryMinimaxH3PromptMode,
  isStorySeedance25PromptMode,
  isStoryWan30PromptMode,
  normalizeStoryMinimaxH3OfficialTags,
  normalizeStoryPromptMode,
} from '../../src/domain/storyGeneration/promptModes.js';
import { getStoryClipPromptModeRewriteRequirements } from '../../src/domain/storyGeneration/promptModeRules.js';
export const STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION = 3;
export const STORY_CLIP_ADJUSTMENT_SYSTEM_PROMPT = [
  '你是一名专业的短剧分镜提示词编辑。',
  '你的任务是按照用户说明，只调整指定的视频提示词内容，不扩写整集、不创建新片段，也不生成视频。',
  '保持当前卡片中的人物、场景、道具、剧情事件、对白、画外音和上下文连续；按照用户说明调整镜头组织、节奏与时间，并细化当前情境能够自然呈现的表演。',
  '候选提示词采用可直接交给视频生成模型执行的画面描述。根据当前镜头选择有表达价值的环境层次、人物位置与朝向、动作过程、姿态或手势、面部表情与视线、道具互动、光影变化和动作落点。',
  '镜头语言根据剧情、动作和情绪选择观众的观察方式，可写对当前镜头有意义的景别、机位与角度、构图、运镜、焦点和落点。静止或运动都可以；中景、平视、固定镜头在适合当前叙事时也是有效选择。',
  '用户要求保持的资产引用必须逐字保留；不得为了缩短单镜时长而删除、概括或新增当前卡片的剧情内容。',
  '如请求包含 targetPromptMode，必须严格执行其中对应的目标提示词结构；不同模式的镜头时间语法不可混用。',
  'scope 为 selection 时，只返回选中文字的替换文本；scope 为 prompt 或 clip 时，返回完整的候选视频提示词。',
  '不要输出 HTML、Markdown、代码块、解释、修改说明或多个方案。MiniMax H3 官方格式要求的 <Subject N>、<Picture N>、<Video N>、<Audio N>、<d>、<scenetrans>、<cutoff> 是提示词文本标签，不是 HTML。',
  '除目标提示词模式必要的英文字段名和官方结构标签外，candidateText 的叙述、对白、画外音、歌词和画面文字全部直接输出简体中文。返回 JSON 前先自行检查并把草稿中的英文正文改写为中文，不要把英文正文交给客户端处理。只返回严格 JSON 对象，且只能包含 candidateText、candidateDurationSeconds 两个字段；无需调整总时长时 candidateDurationSeconds 可以省略。',
].join('\n');
export function createStoryClipAdjustmentApi({
  generateText: generateText,
  parseStrictJson: parseStrictJson,
  normalizeText: normalizeText,
  normalizePositiveNumber: normalizePositiveNumber,
  getResultText: getResultText,
  assertPlanningModel: assertPlanningModel,
  buildStoryTextProviderProfilePayload: buildStoryTextProviderProfilePayload,
  requestStrictResult: requestStrictResult,
  requestTimeoutMs: requestTimeoutMs,
} = {}) {
  function run(value) {
    return ['selection', 'prompt', 'clip'].includes(value) ? value : 'prompt';
  }
  function run2(item) {
    return [...new Set((Array.isArray(item) ? item : []).map(normalizeText).filter(Boolean))].slice(0, 50);
  }
  function run3(options = {}) {
    const args = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
    return {
      projectTitle: normalizeText(args.projectTitle),
      ...(args.sourceMode === 'video-replication'
        ? {
            audioLanguage: buildVideoReplicationAudioLanguageRule({
              targetLocale: normalizeText(args.targetLocale) || 'source',
              sourceLanguage: normalizeText(args.sourceLanguage),
            }),
          }
        : {}),
      storySummary: normalizeText(args.storySummary),
      episodeNumber: Math.max(1, Math.trunc(Number(args.episodeNumber) || 1)),
      episodeTitle: normalizeText(args.episodeTitle),
      episodeSynopsis: normalizeText(args.episodeSynopsis),
      clipTitle: normalizeText(args.clipTitle),
      clipScript: normalizeText(args.clipScript),
      creativeIntent: normalizeText(args.creativeIntent),
      transition: normalizeText(args.transition),
    };
  }
  function run4({
    scope: scope = 'prompt',
    instruction: instruction = '',
    currentPrompt: currentPrompt = '',
    selectedText: selectedText = '',
    preserveAssetRefs: preserveAssetRefs = true,
    preserveDuration: preserveDuration = true,
    lockedAssetTokens: lockedAssetTokens = [],
    lockedDurationTokens: lockedDurationTokens = [],
    duration: duration = '',
    maxDurationSeconds: maxDurationSeconds = 0,
    context: context = {},
    sourcePromptMode: sourcePromptMode = '',
    targetPromptMode: targetPromptMode = '',
    targetLanguage: targetLanguage = '',
  } = {}) {
    const args2 = run(scope),
      count = normalizePositiveNumber(maxDurationSeconds),
      key = preserveDuration !== true && args2 !== 'selection' && count > 0,
      args3 = Boolean(normalizeText(targetPromptMode)),
      storyPromptMode = normalizeStoryPromptMode(sourcePromptMode, { allowDeveloperModes: true }),
      storyPromptMode2 = normalizeStoryPromptMode(targetPromptMode, { allowDeveloperModes: true }),
      args4 = args3
        ? getStoryClipPromptModeRewriteRequirements(storyPromptMode2, {
            hasAssetRefs: run2(lockedAssetTokens).length > 0,
          })
        : [];
    return JSON.stringify({
      task: 'adjust_story_clip_prompt',
      schemaVersion: STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION,
      scope: args2,
      instruction: normalizeText(instruction),
      targetLanguage: normalizeStoryPromptLanguage(targetLanguage),
      currentPrompt: normalizeText(currentPrompt),
      ...(args2 === 'selection' ? { selectedText: normalizeText(selectedText) } : {}),
      locked: {
        preserveAssetRefs: preserveAssetRefs === true,
        preserveDuration: preserveDuration === true,
        assetTokens: preserveAssetRefs === true ? run2(lockedAssetTokens) : [],
        durationTokens: preserveDuration === true ? run2(lockedDurationTokens) : [],
        clipDuration: preserveDuration === true ? normalizeText(duration) : '',
      },
      timing: {
        sourceDuration: normalizeText(duration),
        maxDurationSeconds: count,
        allowReallocation: key,
        minimumShotDurationSeconds: 0.5,
        durationStepSeconds: 0.5,
      },
      ...(args3
        ? {
            promptMode: {
              source: storyPromptMode,
              sourceLabel: getStoryPromptModeLabel(storyPromptMode),
              target: storyPromptMode2,
              targetLabel: getStoryPromptModeLabel(storyPromptMode2),
              converting: storyPromptMode !== storyPromptMode2,
            },
          }
        : {}),
      context: run3(context),
      requirements: [
        buildStoryPromptLanguageRule(targetLanguage, {
          translateOnly:
            !normalizeText(instruction) && (!targetPromptMode || storyPromptMode2 === storyPromptMode),
        }),
        args2 === 'selection'
          ? 'candidateText 只返回选中文字的替换内容，不要返回完整提示词。'
          : 'candidateText 返回调整后的完整视频提示词。',
        '严格执行 instruction，不改变未要求修改的剧情事实。',
        args2 === 'selection'
          ? '在 selectedText 范围内补充 instruction 要求的可观察表演，选区外内容保持原样。'
          : '当 instruction 要求增强画面、电影感或情绪表现时，把原叙述转译成摄像机实际拍到的连续画面，并根据当前镜头选择有表达价值的环境、人物位置、动作过程、表情视线、道具、光影以及镜头观察方式。',
        args2 === 'selection'
          ? '替换内容的信息密度与原镜头时长自然匹配。'
          : '镜头语言与动作节拍、情绪落点和对应时长自然匹配；静止或运动镜头都按当前表达需要选择。',
        preserveAssetRefs === true
          ? key
            ? 'assetTokens 中的每个引用必须在最终候选中逐字保留，不能改名或删除；因重新拆分镜头，可以在不同镜头中按需要重复引用同一资产。'
            : 'assetTokens 中的每个引用必须在最终候选中逐字保留，不能改名、删除或重复添加。'
          : '可以按用户说明调整资产引用。',
        ...args4,
        preserveDuration === true
          ? '保持 clipDuration 和 durationTokens，不增加超过当前时长的动作、对白或镜头节拍。'
          : key
            ? args3
              ? '根据 targetPromptMode 的时间语法重新组织完整提示词；候选总时长不得超过 ' +
                count +
                ' 秒，candidateDurationSeconds 必须与目标模式的时间结构一致。完整保留 currentPrompt 的人物、场景、道具、剧情事件、动作、对白与声音内容。'
              : '根据 instruction 决定是否重新拆分镜头和分配时间；instruction 未要求改变节奏时，候选总时长应尽量接近 sourceDuration。完整保留 currentPrompt 的人物、场景、道具、剧情事件、动作、对白与声音内容。每个镜头使用“⏱ 数字s”标记，单镜至少 0.5 秒并按 0.5 秒递增；总时长不得超过 ' +
                count +
                ' 秒。candidateDurationSeconds 必须等于所有镜头时间标记之和。'
            : '可以按用户说明调整时间表达，但不得删减当前卡片内容。',
        key
          ? '只返回 JSON：{"candidateText":"...","candidateDurationSeconds":15}。'
          : '只返回 JSON：{"candidateText":"..."}。',
      ],
    });
  }
  function run5(index) {
    const result = String(index ?? '').match(/\d+(?:\.\d+)?/),
      count2 = Number(result?.[0]);
    return Number.isFinite(count2) && count2 > 0 ? Number(count2.toFixed(1)) : 0;
  }
  function run6(data) {
    const target = [],
      source = /⏱\s*(\d+(?:\.\d+)?)\s*(?:s|秒)/gi;
    let next = null;
    while ((next = source.exec(String(data || '')))) {
      const count3 = Number(next[1]);
      if (Number.isFinite(count3) && count3 > 0) target.push(count3);
    }
    return target;
  }
  function run7(current, { allowMinimaxH3Tags: allowMinimaxH3Tags = false } = {}) {
    const entry = [],
      record = (payload) => {
        const handle = 'story-h3-tag-' + entry.length + '';
        return (entry.push({ token: handle, tag: payload }), handle);
      };
    let state = String(current || '');
    return (
      allowMinimaxH3Tags &&
        (state = state.replace(
          /<\/?d>|<(?:scenetrans|cutoff)>|<(?:Subject|Picture|Video|Audio)\s+\d+>/giu,
          record,
        )),
      (state = state.replace(/<!--[\s\S]*?-->/gu, '')
        .replace(
          /<\s*(script|style|iframe|object|embed|svg|math|template|noscript)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/giu,
          '',
        )
        .replace(
          /<\s*\/?\s*(?:script|style|iframe|object|embed|svg|math|template|noscript)\b[^>]*>/giu,
          '',
        )
        .replace(/<\s*\/?\s*[a-z][^>]*>/giu, '')),
      entry.reduce((config, { token: token, tag: tag }) => config.split(token).join(tag), state).trim()
    );
  }
  function run8(input, enabled, output, value2 = '') {
    const count4 = normalizePositiveNumber(output);
    if (!enabled) throw new Error('AI 没有返回候选片段总时长。');
    if (count4 > 0 && enabled > count4 + 0.001)
      throw new Error('候选片段总时长不能超过 ' + count4 + ' 秒。');
    const storyPromptMode3 = normalizeStoryPromptMode(value2, { allowDeveloperModes: true });
    if (isStorySeedance25PromptMode(storyPromptMode3) || isStoryWan30PromptMode(storyPromptMode3)) {
      const enabled2 = [
        ...String(input || '').matchAll(/(?:\[)?(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)秒(?:\])?/gu),
      ].map((value3) => ({ start: Number(value3[1]), end: Number(value3[2]) }));
      if (!enabled2.length) throw new Error('候选提示词没有连续时间区间。');
      let value4 = 0;
      enabled2.forEach(({ start: start, end: end }) => {
        if (start !== value4 || end <= start) throw new Error('候选提示词的时间区间不连续。');
        value4 = end;
      });
      if (Math.abs(value4 - enabled) > 0.001)
        throw new Error('candidateDurationSeconds 必须等于最后一个时间区间的终点。');
      return;
    }
    if (isStoryMinimaxH3PromptMode(storyPromptMode3)) {
      if (!Number.isInteger(enabled) || enabled < 4 || enabled > 15)
        throw new Error('MiniMax H3 候选片段总时长必须为 4 至 15 秒的整数。');
      if (!/(?:integrated_multimodal_description|detailed_description):/u.test(input))
        throw new Error('MiniMax H3 候选提示词缺少官方镜头描述段落。');
      if (/⏱/u.test(input)) throw new Error('MiniMax H3 候选提示词不能包含 ⏱ 时长标签。');
      const value5 = [
        ...String(input || '').matchAll(/\[Shot\s+\d+\]\s+At\s+(\d{2}):(\d{2}(?:\.\d{3})?)/gu),
      ].map((value6) => Number(value6[1]) * 60 + Number(value6[2]));
      if (
        value5.some(
          (count5, count6) =>
            count5 <= 0 || count5 >= enabled || (count6 > 0 && count5 <= value5[count6 - 1]),
        )
      )
        throw new Error('MiniMax H3 候选提示词的切镜时间无效。');
      return;
    }
    const list = run6(input);
    if (!list.length) throw new Error('候选提示词没有为每个镜头分配时间标记。');
    const value7 = list.find(
      (count7) => count7 < 0.5 || Math.abs(count7 * 2 - Math.round(count7 * 2)) > 0.001,
    );
    if (value7 !== undefined) throw new Error('候选镜头时长必须至少为 0.5 秒，并按 0.5 秒递增。');
    const value8 = Number(list.reduce((value9, value10) => value9 + value10, 0).toFixed(1));
    if (Math.abs(value8 - enabled) > 0.001)
      throw new Error('candidateDurationSeconds 必须等于所有镜头时间标记之和。');
  }
  function run9(
    value11,
    {
      requireDuration: requireDuration = false,
      maxDurationSeconds: maxDurationSeconds = 0,
      promptMode: promptMode = '',
    } = {},
  ) {
    const value12 = parseStrictJson(getResultText(value11), 'AI 没有返回候选提示词。');
    let enabled3 = normalizeText(value12.candidateText);
    if (!enabled3) throw new Error('AI 返回的候选提示词为空。');
    const storyPromptMode4 = normalizeStoryPromptMode(promptMode, { allowDeveloperModes: true }),
      isStoryMinimaxH3PromptMode2 = isStoryMinimaxH3PromptMode(storyPromptMode4);
    isStoryMinimaxH3PromptMode2 && (enabled3 = normalizeStoryMinimaxH3OfficialTags(enabled3));
    enabled3 = run7(enabled3, { allowMinimaxH3Tags: isStoryMinimaxH3PromptMode2 });
    if (!enabled3) throw new Error('AI 返回的候选提示词为空。');
    const value13 = run5(value12.candidateDurationSeconds);
    return (
      requireDuration && run8(enabled3, value13, maxDurationSeconds, promptMode),
      { candidateText: enabled3, candidateDurationSeconds: value13 }
    );
  }
  function run10(value14, value15) {
    return String(value14 || '').split(value15).length - 1;
  }
  function run11(value16, value17, value18, value19, { allowCountChange: allowCountChange = false } = {}) {
    const list2 = run2(value18).filter((value20) =>
      allowCountChange ? run10(value16, value20) < 1 : run10(value16, value20) !== run10(value17, value20),
    );
    if (list2.length)
      throw new Error(
        allowCountChange
          ? '候选内容缺少' + value19 + '：' + list2.join('、')
          : '候选内容没有原样保留' + value19 + '：' + list2.join('、'),
      );
  }
  async function run12({
    project: project = {},
    scope: scope = 'prompt',
    instruction: instruction = '',
    currentPrompt: currentPrompt = '',
    selection: selection = null,
    preserveAssetRefs: preserveAssetRefs = true,
    preserveDuration: preserveDuration = true,
    lockedAssetTokens: lockedAssetTokens = [],
    lockedDurationTokens: lockedDurationTokens = [],
    duration: duration = '',
    maxDurationSeconds: maxDurationSeconds = 0,
    context: context = {},
    sourcePromptMode: sourcePromptMode = '',
    targetPromptMode: targetPromptMode = '',
    targetLanguage: targetLanguage = '',
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    request: request = generateText,
    onProgress: onProgress = null,
  } = {}) {
    ((request = withReplicationRequestPolicy(request, project)), assertPlanningModel(model, provider));
    const value21 = run(scope),
      enabled4 = normalizeText(instruction),
      storyPromptMode5 = normalizeStoryPromptMode(sourcePromptMode, { allowDeveloperModes: true }),
      enabled5 = Boolean(normalizeText(targetPromptMode)),
      storyPromptMode6 = normalizeStoryPromptMode(targetPromptMode, { allowDeveloperModes: true }),
      list3 = normalizeText(currentPrompt),
      count8 = normalizePositiveNumber(maxDurationSeconds),
      value22 = preserveDuration !== true && value21 !== 'selection' && count8 > 0,
      value23 = run5(duration),
      storyPromptLanguage = normalizeStoryPromptLanguage(targetLanguage);
    if (targetLanguage && !storyPromptLanguage) throw new Error('请选择支持的转换语言。');
    if (!enabled4 && !enabled5 && !storyPromptLanguage)
      throw new Error('请先填写希望 AI 如何调整，或选择提示词模式。');
    if (!list3) throw new Error('当前片段还没有可调整的视频提示词。');
    let enabled6 = '',
      value24 = 0,
      value25 = 0;
    if (value21 === 'selection') {
      ((value24 = Math.max(0, Math.trunc(Number(selection?.start) || 0))),
        (value25 = Math.max(value24, Math.trunc(Number(selection?.end) || 0))),
        (enabled6 = normalizeText(selection?.text || list3.slice(value24, value25))));
      if (!enabled6 || list3.slice(value24, value25) !== enabled6)
        throw new Error('选中文字已经变化，请重新选择后再调整。');
    }
    const value26 = run4({
      scope: value21,
      instruction: enabled4,
      currentPrompt: list3,
      selectedText: enabled6,
      preserveAssetRefs: preserveAssetRefs,
      preserveDuration: preserveDuration,
      lockedAssetTokens: lockedAssetTokens,
      lockedDurationTokens: lockedDurationTokens,
      duration: duration,
      maxDurationSeconds: count8,
      context: context,
      sourcePromptMode: storyPromptMode5,
      targetPromptMode: enabled5 ? storyPromptMode6 : '',
      targetLanguage: storyPromptLanguage,
    });
    return (
      onProgress?.({ stage: 'adjusting-story-clip', current: 1, total: 1, message: '正在生成候选版本' }),
      await requestStrictResult({
        request: request,
        requestPayload: {
          model: normalizeText(model),
          provider: normalizeText(provider),
          ...buildStoryTextProviderProfilePayload(providerProfileId),
          prompt: value26,
          systemPrompt: [
            STORY_CLIP_ADJUSTMENT_SYSTEM_PROMPT,
            buildStoryPromptLanguageRule(storyPromptLanguage, {
              translateOnly: !enabled4 && (!enabled5 || storyPromptMode6 === storyPromptMode5),
            }) || run3(context).audioLanguage,
          ]
            .filter(Boolean)
            .join('\n'),
          temperature: 0.45,
          timeoutMs: requestTimeoutMs,
        },
        parse: (value27) => {
          const value28 = run9(value27, {
              requireDuration: value22,
              maxDurationSeconds: count8,
              promptMode: enabled5 ? storyPromptMode6 : '',
            }),
            value29 =
              value21 === 'selection'
                ? normalizeText(
                    '' + list3.slice(0, value24) + value28.candidateText + list3.slice(value25),
                  )
                : value28.candidateText;
          return (
            preserveAssetRefs === true &&
              run11(value29, list3, lockedAssetTokens, '资产引用', { allowCountChange: value22 }),
            preserveDuration === true && run11(value29, list3, lockedDurationTokens, '时间标记'),
            {
              schemaVersion: STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION,
              scope: value21,
              candidateText: value29,
              targetLanguage: storyPromptLanguage,
              candidateDurationSeconds: value22
                ? value28.candidateDurationSeconds
                : value23 || value28.candidateDurationSeconds,
              replacementText: value21 === 'selection' ? value28.candidateText : '',
              sourcePromptMode: storyPromptMode5,
              targetPromptMode: enabled5 ? storyPromptMode6 : storyPromptMode5,
            }
          );
        },
        outputContract: value22
          ? enabled5
            ? 'candidateText and candidateDurationSeconds; strictly use ' +
              storyPromptMode6 +
              ' prompt structure; keep all source content and asset tokens; timing is within maxDurationSeconds'
            : 'candidateText and candidateDurationSeconds; keep all source content and asset tokens; each shot uses a 0.5-second-step timing token; timing sum is within maxDurationSeconds'
          : 'candidateText string; preserve every locked asset and duration token',
        repairInstruction: value22
          ? enabled5
            ? '只修复候选提示词，使其严格符合 ' +
              storyPromptMode6 +
              ' 的目标结构、资产引用与时间语法；完整保留当前卡片剧情信息，candidateDurationSeconds 不超过上限；不要解释。'
            : '只修复候选提示词的格式、资产引用与镜头时间分配；完整保留当前卡片内容，确保每镜至少 0.5 秒、按 0.5 秒递增，时间标记总和等于 candidateDurationSeconds 且不超过上限；不要解释。'
          : '只修复候选提示词的格式与锁定内容；不要解释。',
        retryTemperature: 0.2,
      })
    );
  }
  return {
    adjustStoryClipPrompt: run12,
    buildStoryClipAdjustmentPrompt: run4,
    parseStoryClipAdjustmentResult: run9,
  };
}
