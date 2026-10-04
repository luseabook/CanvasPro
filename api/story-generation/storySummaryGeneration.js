function normalizeStorySummaryMode(value) {
  if (value === 'upload' || value === 'rewrite') return value;
  return 'generate';
}
function isSourceBackedMode(item) {
  return item === 'upload' || item === 'rewrite';
}
export function createStorySummaryGenerationApi({
  generateText: generateText,
  assertPlanningModel: assertPlanningModel,
  normalizeText: normalizeText,
  splitStorySourceText: splitStorySourceText,
  sourceChunkCharacters: sourceChunkCharacters,
  buildStorySourceDigestPrompt: buildStorySourceDigestPrompt,
  parseStorySourceDigest: parseStorySourceDigest,
  sourceDigestSystemPrompt: sourceDigestSystemPrompt,
  summarySystemPrompt: summarySystemPrompt,
  textRequestTimeoutMs: textRequestTimeoutMs,
  textMaxOutputTokens: textMaxOutputTokens,
  buildStoryTextProviderProfilePayload: buildStoryTextProviderProfilePayload,
  requestStrictResult: requestStrictResult,
  createStoryInvocationLifecycle: createStoryInvocationLifecycle,
  getResultText: getResultText,
  storySummaryBlueprint: storySummaryBlueprint,
  defaultScriptMode: defaultScriptMode,
} = {}) {
  async function generateStorySummary({
    mode: mode = 'generate',
    scriptMode: scriptMode = defaultScriptMode,
    idea: idea = '',
    sourceText: sourceText = '',
    fileName: fileName = '',
    rewriteInstruction: rewriteInstruction = '',
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    visualStyle: visualStyle = '',
    planning: planning = {},
    request: request = generateText,
    onProgress: onProgress = null,
    onInvocation: onInvocation = null,
  } = {}) {
    assertPlanningModel(model, provider);
    const mode2 = normalizeStorySummaryMode(mode);
    let sourceDigests = [],
      sourceText2 = normalizeText(sourceText);
    if (isSourceBackedMode(mode2) && sourceText2['length'] > sourceChunkCharacters) {
      const total = splitStorySourceText(sourceText2);
      for (let current = 0x0; current < total['length']; current += 0x1) {
        onProgress?.({
          stage: 'digesting',
          current: current + 0x1,
          total: total['length'],
          message:
            (mode2 === 'rewrite' ? '正在整理参考剧本' : '正在整理原始剧本') +
            '\x20' +
            (current + 0x1) +
            '/' +
            total['length'],
        });
        const args = await requestStrictResult({
          request: request,
          requestPayload: {
            model: normalizeText(model),
            provider: normalizeText(provider),
            ...buildStoryTextProviderProfilePayload(providerProfileId),
            prompt: buildStorySourceDigestPrompt(total[current], current, total['length']),
            systemPrompt: sourceDigestSystemPrompt,
            temperature: 0.1,
            timeoutMs: textRequestTimeoutMs,
            maxOutputTokens: textMaxOutputTokens,
          },
          parse: parseStorySourceDigest,
          outputContract: 'characters/settings/events arrays and continuity/endingState strings',
          ...createStoryInvocationLifecycle('source-digest:' + (current + 0x1), onInvocation, {
            serializeResponse: getResultText,
          }),
        });
        sourceDigests['push']({ part: current + 0x1, ...args });
      }
      sourceText2 = '';
    }
    onProgress?.({ stage: 'summarizing', current: 0x1, total: 0x1, message: '正在生成剧本摘要' });
    const prompt = storySummaryBlueprint['buildStorySummaryPrompt']({
      mode: mode2,
      scriptMode: scriptMode,
      idea: idea,
      sourceText: sourceText2,
      fileName: fileName,
      sourceDigests: sourceDigests,
      rewriteInstruction: rewriteInstruction,
      visualStyle: visualStyle,
      planning: planning,
    });
    return await requestStrictResult({
      request: request,
      requestPayload: {
        model: normalizeText(model),
        provider: normalizeText(provider),
        ...buildStoryTextProviderProfilePayload(providerProfileId),
        prompt: prompt,
        systemPrompt: summarySystemPrompt,
        structuredOutput: storySummaryBlueprint['createStructuredOutput'](),
        thinking: { type: 'disabled' },
        temperature: mode2 === 'upload' ? 0.25 : mode2 === 'rewrite' ? 0.45 : 0.65,
        timeoutMs: textRequestTimeoutMs,
        maxOutputTokens: textMaxOutputTokens,
      },
      parse: storySummaryBlueprint['parseStorySummaryResult'],
      outputContract:
        'title/storyType/targetAudience/storySummary/storyBackground/storySetting/coreHook/logline strings, storyContract{protagonistGoal,centralConflict,stakes,progressionDriver,constraints,climax,ending}, plotBeats[{stage,event,consequence}], continuityFacts[], and characters[{name,roleType,fixedTraits,coreTags[],profile,motivation,relationships,personality,arc}]',
      repairInstruction:
        '只修复故事蓝图\x20JSON；补齐故事契约、因果剧情节点、连续性事实和核心人物字段，不生成分集、视觉提示词或声音设定。',
      retryTemperature: 0.2,
      ...createStoryInvocationLifecycle('summary', onInvocation, { serializeResponse: getResultText }),
    });
  }
  return Object['freeze']({ generateStorySummary: generateStorySummary });
}
