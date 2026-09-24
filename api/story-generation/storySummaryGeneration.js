function normalizeStorySummaryMode(_0x4fb261) {
  if (_0x4fb261 === 'upload' || _0x4fb261 === 'rewrite') return _0x4fb261;
  return 'generate';
}
function isSourceBackedMode(_0x3fca66) {
  return _0x3fca66 === 'upload' || _0x3fca66 === 'rewrite';
}
export function createStorySummaryGenerationApi({
  generateText: _0x29aaf8,
  assertPlanningModel: _0x3693a7,
  normalizeText: _0x5cab7f,
  splitStorySourceText: _0x5ec697,
  sourceChunkCharacters: _0x152ac9,
  buildStorySourceDigestPrompt: _0x4c4936,
  parseStorySourceDigest: _0x32fdd9,
  sourceDigestSystemPrompt: _0x4f7ed5,
  summarySystemPrompt: _0x56b3b5,
  textRequestTimeoutMs: _0x2d18d2,
  textMaxOutputTokens: _0x501554,
  buildStoryTextProviderProfilePayload: _0x28e72a,
  requestStrictResult: _0x2f32a6,
  createStoryInvocationLifecycle: _0x1b65cc,
  getResultText: _0x4fc9ea,
  storySummaryBlueprint: _0x45388c,
  defaultScriptMode: _0x49cc9f,
} = {}) {
  async function _0xe32c3a({
    mode: mode = 'generate',
    scriptMode: scriptMode = _0x49cc9f,
    idea: idea = '',
    sourceText: sourceText = '',
    fileName: fileName = '',
    rewriteInstruction: rewriteInstruction = '',
    model: model = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    visualStyle: visualStyle = '',
    planning: planning = {},
    request: request = _0x29aaf8,
    onProgress: onProgress = null,
    onInvocation: onInvocation = null,
  } = {}) {
    _0x3693a7(model, provider);
    const _0x47a52c = normalizeStorySummaryMode(mode);
    let _0x4c2dd8 = [],
      _0x2ea510 = _0x5cab7f(sourceText);
    if (isSourceBackedMode(_0x47a52c) && _0x2ea510['length'] > _0x152ac9) {
      const _0x4004ba = _0x5ec697(_0x2ea510);
      for (let _0x3e0e95 = 0x0; _0x3e0e95 < _0x4004ba['length']; _0x3e0e95 += 0x1) {
        onProgress?.({
          stage: 'digesting',
          current: _0x3e0e95 + 0x1,
          total: _0x4004ba['length'],
          message:
            (_0x47a52c === 'rewrite' ? '正在整理参考剧本' : '正在整理原始剧本') +
            '\x20' +
            (_0x3e0e95 + 0x1) +
            '/' +
            _0x4004ba['length'],
        });
        const _0x58363d = await _0x2f32a6({
          request: request,
          requestPayload: {
            model: _0x5cab7f(model),
            provider: _0x5cab7f(provider),
            ..._0x28e72a(providerProfileId),
            prompt: _0x4c4936(_0x4004ba[_0x3e0e95], _0x3e0e95, _0x4004ba['length']),
            systemPrompt: _0x4f7ed5,
            temperature: 0.1,
            timeoutMs: _0x2d18d2,
            maxOutputTokens: _0x501554,
          },
          parse: _0x32fdd9,
          outputContract: 'characters/settings/events arrays and continuity/endingState strings',
          ..._0x1b65cc('source-digest:' + (_0x3e0e95 + 0x1), onInvocation, { serializeResponse: _0x4fc9ea }),
        });
        _0x4c2dd8['push']({ part: _0x3e0e95 + 0x1, ..._0x58363d });
      }
      _0x2ea510 = '';
    }
    onProgress?.({ stage: 'summarizing', current: 0x1, total: 0x1, message: '正在生成剧本摘要' });
    const _0x27a743 = _0x45388c['buildStorySummaryPrompt']({
      mode: _0x47a52c,
      scriptMode: scriptMode,
      idea: idea,
      sourceText: _0x2ea510,
      fileName: fileName,
      sourceDigests: _0x4c2dd8,
      rewriteInstruction: rewriteInstruction,
      visualStyle: visualStyle,
      planning: planning,
    });
    return await _0x2f32a6({
      request: request,
      requestPayload: {
        model: _0x5cab7f(model),
        provider: _0x5cab7f(provider),
        ..._0x28e72a(providerProfileId),
        prompt: _0x27a743,
        systemPrompt: _0x56b3b5,
        structuredOutput: _0x45388c['createStructuredOutput'](),
        thinking: { type: 'disabled' },
        temperature: _0x47a52c === 'upload' ? 0.25 : _0x47a52c === 'rewrite' ? 0.45 : 0.65,
        timeoutMs: _0x2d18d2,
        maxOutputTokens: _0x501554,
      },
      parse: _0x45388c['parseStorySummaryResult'],
      outputContract:
        'title/storyType/targetAudience/storySummary/storyBackground/storySetting/coreHook/logline strings, storyContract{protagonistGoal,centralConflict,stakes,progressionDriver,constraints,climax,ending}, plotBeats[{stage,event,consequence}], continuityFacts[], and characters[{name,roleType,fixedTraits,coreTags[],profile,motivation,relationships,personality,arc}]',
      repairInstruction:
        '只修复故事蓝图\x20JSON；补齐故事契约、因果剧情节点、连续性事实和核心人物字段，不生成分集、视觉提示词或声音设定。',
      retryTemperature: 0.2,
      ..._0x1b65cc('summary', onInvocation, { serializeResponse: _0x4fc9ea }),
    });
  }
  return Object['freeze']({ generateStorySummary: _0xe32c3a });
}
