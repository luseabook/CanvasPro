import { generateText } from './aiTextApi.js';
export const AGENT_PLANNER_PROMPT_MAX_CHARS = 0xb3b0;
const AGENT_PLANNER_HISTORY_LIMIT = 6,
  AGENT_PLANNER_HISTORY_TEXT_LIMIT = 0x1e0;
export const AGENT_SYSTEM_PROMPT = [
  'You are the updream canvas action planner.',
  'Return only one strict JSON object.',
  'The first non-whitespace character must be { and the last non-whitespace character must be }.',
  'Do not use Markdown, code fences, lead-in prose, comments, or trailing commas.',
  'Do not return JavaScript.',
  'Do not request unregistered tools.',
  'Use only actions listed in context.commands.',
  'Use context.commands[].argsSchema, capabilitySchema, and returnAliasFields as the source of truth for action args, selection fallback, runtime requirements, and $alias fields.',
  'Use context.skills only as planning guidance; skills must produce action plans and must not execute directly.',
  'Default to status chat with actions [] for greetings, capability questions, brainstorming, critique, explanation, or any message that does not clearly ask to create, generate, edit, connect, arrange, select, delete, or otherwise modify the canvas.',
  'Only return canvas actions when the user has explicit canvas action intent. Mere discussion of an image, video, material, or idea is not enough.',
  'For status chat, include a helpful reply and keep actions empty.',
  'If intent is ambiguous, return status need_clarification.',
  'If an action is risky, return status need_confirmation.',
  'Prefer model and workflow capabilities from manifest data in context.',
  'Use the languagePolicy in the JSON prompt for all user-facing reply, question, and option labels.',
  'When a later action needs an earlier result, set as on the earlier action and reference it as $alias.nodeId.',
  'Use generation.run only after the target node exists; generation.run will require confirmation.',
  "When creating an AI node, include model and provider from context.canvas.availableModels if a listed model better matches the user's selected inputs.",
  'context.canvas.inputRefs and context.canvas.referenceContext are explicit material inputs supplied by the user from the Agent panel.',
  'When context.canvas.inputRefs is non-empty, prefer those node IDs over guessing from selectedNodes or the wider canvas.',
  'For image-to-video, first use an image input from context.canvas.inputRefs/referenceContext before falling back to selected image nodes.',
  'If the user says this, these, the attached material, or the just-added material, resolve that wording to context.canvas.inputRefs.',
  "If multiple inputRefs could match and the user's intent does not identify which one to use, ask a clarification question instead of guessing.",
  "Use node.setParams only with field IDs present in the chosen model's uiSchema.fields; omit unsupported requested params instead of inventing fields.",
  'When no explicit image inputRef is available, image-to-video using the current or selected image must use the exact selected image node id from context.canvas.selectedNodes or context.canvas.selectedNodeIds.',
  'For image-to-video, always create an ai-video node, graph.connect the selected image node to the new video node, optionally arrange them, then generation.run the video node.',
  'If the user asks for text-to-video or provides a clear text-only video idea and no usable image is selected, create an ai-video node, set text-to-video params supported by its model, then generation.run it.',
  'If the user asks for video but the source or content is ambiguous, ask a clarification question instead of guessing.',
].join('\n');
const BASE_AGENT_PLAN_EXAMPLES = Object.freeze([
  {
    user: 'What can you help me do on this canvas?',
    plan: {
      status: 'chat',
      reply:
        'I can help discuss ideas first. When you want me to act, tell me to create, generate, connect, arrange, or edit something on the canvas.',
      actions: [],
    },
  },
  {
    user: 'Create an image node with prompt cyberpunk city night, then generate.',
    plan: {
      status: 'ready',
      reply: 'I will create the image node first, then ask before generation.',
      actions: [
        { type: 'node.create', as: 'imageNode', args: { type: 'ai-image', prompt: 'cyberpunk city night' } },
        { type: 'generation.run', args: { nodeId: '$imageNode.nodeId' } },
      ],
    },
  },
  {
    user: 'Arrange selected nodes horizontally with gap 80 and align top.',
    plan: {
      status: 'ready',
      reply: 'I will arrange and align the selected nodes.',
      actions: [
        { type: 'layout.arrangeRow', args: { gap: 80 } },
        { type: 'layout.align', args: { mode: 'top' } },
      ],
    },
  },
  {
    user: 'Create a 5 second video from text: a paper boat floating through a neon canal.',
    plan: {
      status: 'ready',
      reply: 'I will create a text-to-video node, set supported parameters, then ask before generation.',
      actions: [
        {
          type: 'node.create',
          as: 'videoNode',
          args: { type: 'ai-video', prompt: 'a paper boat floating through a neon canal' },
        },
        { type: 'node.setParams', args: { nodeId: '$videoNode.nodeId', params: { duration: 5 } } },
        { type: 'generation.run', args: { nodeId: '$videoNode.nodeId' } },
      ],
    },
  },
  {
    user: 'Generate a video.',
    plan: {
      status: 'need_clarification',
      reply: 'I need one detail before creating the video.',
      question:
        'Should this be text-to-video or image-to-video? If image-to-video, select or provide a reference image.',
      options: [
        { id: 'text-to-video', label: 'Text-to-video' },
        { id: 'image-to-video', label: 'Image-to-video' },
      ],
      actions: [],
    },
  },
]);
function isImageNodeType(_0x36f222 = '') {
  return String(_0x36f222 || '') === 'ai-image' || String(_0x36f222 || '') === 'source-image';
}
function findImageInputRefNodeId(_0x577cc0 = {}) {
  const _0x32d1f8 = _0x577cc0?.canvas || {},
    _0x5026b1 = _0x32d1f8.referenceContext || {},
    _0x43a0ac = [
      ...(Array.isArray(_0x32d1f8.inputRefs) ? _0x32d1f8.inputRefs : []),
      ...(Array.isArray(_0x5026b1.inputRefs) ? _0x5026b1.inputRefs : []),
    ],
    _0x502b01 = _0x43a0ac.find(
      (_0x2249a4) => isImageNodeType(_0x2249a4?.type) || String(_0x2249a4?.kind || '') === 'image',
    );
  if (_0x502b01?.nodeId || _0x502b01?.id) return String(_0x502b01.nodeId || _0x502b01.id);
  const _0x2205e6 = Array.isArray(_0x5026b1.referencedNodes) ? _0x5026b1.referencedNodes : [],
    _0x36d18f = _0x2205e6.find(
      (_0x470eef) => isImageNodeType(_0x470eef?.type) || String(_0x470eef?.kind || '') === 'image',
    );
  return _0x36d18f?.nodeId || _0x36d18f?.id ? String(_0x36d18f.nodeId || _0x36d18f.id) : '';
}
function findSelectedImageNodeId(_0x45b1f4 = {}) {
  const _0x28c17b = findImageInputRefNodeId(_0x45b1f4);
  if (_0x28c17b) return _0x28c17b;
  const _0x1ad17c = _0x45b1f4?.canvas || {},
    _0x359b75 = Array.isArray(_0x1ad17c.selectedNodes) ? _0x1ad17c.selectedNodes : [],
    _0x4438db = _0x359b75.find((_0x1b01f0) => isImageNodeType(_0x1b01f0?.type));
  if (_0x4438db?.id) return String(_0x4438db.id);
  const _0x2b44cf = Array.isArray(_0x1ad17c.selectedNodeIds)
    ? _0x1ad17c.selectedNodeIds.map((_0x43205c) => String(_0x43205c || '')).filter(Boolean)
    : [];
  if (_0x2b44cf.length === 0) return '';
  const _0x1e95ef = Array.isArray(_0x1ad17c.nodes) ? _0x1ad17c.nodes : [],
    _0x4dc59a = new Set(_0x2b44cf),
    _0x2e328 = _0x1e95ef.find(
      (_0x4319de) => _0x4dc59a.has(String(_0x4319de?.id || '')) && isImageNodeType(_0x4319de?.type),
    );
  return _0x2e328?.id ? String(_0x2e328.id) : '';
}
function modelAllowsImageInput(_0xa8b15f = {}) {
  const _0x2e39aa =
      _0xa8b15f?.inputSlots && typeof _0xa8b15f.inputSlots === 'object' ? _0xa8b15f.inputSlots : {},
    _0x1e7e57 = Array.isArray(_0x2e39aa.allowedKinds) ? _0x2e39aa.allowedKinds : [];
  if (_0x1e7e57.includes('image')) return true;
  const _0x49f99d = Number(_0x2e39aa.maxByKind?.image);
  return Number.isFinite(_0x49f99d) && _0x49f99d > 0;
}
function modelRequiresMissingMedia(_0x5c12cd = {}) {
  const _0x4af7ef =
      _0x5c12cd?.inputSlots && typeof _0x5c12cd.inputSlots === 'object' ? _0x5c12cd.inputSlots : {},
    _0x495d4e = _0x4af7ef.minByKind || {};
  if (Number(_0x495d4e.video) > 0) return true;
  if (Number(_0x495d4e.audio) > 0) return true;
  const _0x3c9435 = Array.isArray(_0x4af7ef.fixedSlots) ? _0x4af7ef.fixedSlots : [];
  return _0x3c9435.some(
    (_0x1f15aa) =>
      _0x1f15aa?.required === true &&
      (String(_0x1f15aa?.kind || '') === 'video' || String(_0x1f15aa?.kind || '') === 'audio'),
  );
}
function getModelFieldIds(_0x36a86e = {}) {
  return new Set(
    (Array.isArray(_0x36a86e?.uiSchema?.fields) ? _0x36a86e.uiSchema.fields : [])
      .map((_0x3ec35d) => String(_0x3ec35d?.id || '').trim())
      .filter(Boolean),
  );
}
function findImageToVideoModel(_0x1e3d12 = {}) {
  const _0x54a923 = Array.isArray(_0x1e3d12?.canvas?.availableModels) ? _0x1e3d12.canvas.availableModels : [];
  return (
    _0x54a923.find(
      (_0x23a134) =>
        _0x23a134?.kind === 'video' &&
        _0x23a134?.modelId &&
        modelAllowsImageInput(_0x23a134) &&
        !modelRequiresMissingMedia(_0x23a134),
    ) || null
  );
}
function buildImageToVideoExample(
  _0x47a370,
  _0x22a200 = null,
  { fromInputRefs: fromInputRefs = false } = {},
) {
  const _0x12ca4f = { type: 'ai-video', prompt: 'slow camera push in' };
  _0x22a200?.modelId &&
    ((_0x12ca4f.model = _0x22a200.modelId), (_0x12ca4f.provider = _0x22a200.provider || ''));
  const _0x14df98 = [{ type: 'node.create', as: 'videoNode', args: _0x12ca4f }],
    _0x54f0e2 = getModelFieldIds(_0x22a200);
  return (
    (!_0x22a200 || _0x54f0e2.has('duration')) &&
      _0x14df98.push({
        type: 'node.setParams',
        args: { nodeId: '$videoNode.nodeId', params: { duration: 5 } },
      }),
    _0x14df98.push(
      { type: 'graph.connect', args: { sourceId: _0x47a370, targetId: '$videoNode.nodeId' } },
      { type: 'layout.arrangeRow', args: { ids: [_0x47a370, '$videoNode.nodeId'], gap: 80 } },
      { type: 'generation.run', args: { nodeId: '$videoNode.nodeId' } },
    ),
    {
      user: fromInputRefs
        ? 'Use the explicit image inputRef to create a 5 second video with a slow push in, then generate.'
        : 'Use the currently selected image to create a 5 second video with a slow push in, then generate.',
      plan: {
        status: 'ready',
        reply: fromInputRefs
          ? 'I will create a video node, connect the referenced image to it, arrange the nodes, then ask before generation.'
          : 'I will create a video node, connect the selected image to it, arrange the nodes, then ask before generation.',
        actions: _0x14df98,
      },
    }
  );
}
function buildAgentPlanExamples(_0x56d10d = {}) {
  const _0x2aa5d6 = findImageInputRefNodeId(_0x56d10d),
    _0x2d9205 = _0x2aa5d6 || findSelectedImageNodeId(_0x56d10d);
  if (!_0x2d9205) return BASE_AGENT_PLAN_EXAMPLES;
  const _0x38fe9a = findImageToVideoModel(_0x56d10d);
  return [
    BASE_AGENT_PLAN_EXAMPLES[0],
    buildImageToVideoExample(_0x2d9205, _0x38fe9a, { fromInputRefs: Boolean(_0x2aa5d6) }),
    BASE_AGENT_PLAN_EXAMPLES[1],
    BASE_AGENT_PLAN_EXAMPLES[2],
    BASE_AGENT_PLAN_EXAMPLES[3],
    BASE_AGENT_PLAN_EXAMPLES[4],
  ];
}
const AGENT_RESPONSE_CONTRACT = Object.freeze({
  format: 'strict-json-object',
  firstNonWhitespaceChar: '{',
  lastNonWhitespaceChar: '}',
  forbidden: ['markdown', 'code fences', 'lead-in prose', 'comments', 'trailing commas'],
  noExecutionOutsidePlan: true,
});
function truncatePlannerText(_0x10353d, _0x19dc03 = AGENT_PLANNER_HISTORY_TEXT_LIMIT) {
  const _0x44a79c = String(_0x10353d || '');
  if (_0x44a79c.length <= _0x19dc03) return _0x44a79c;
  return _0x44a79c.slice(0, Math.max(0, _0x19dc03 - 3)) + '...';
}
function normalizeAgentLocale(_0x21dcaa = '') {
  const _0x4194e7 = String(_0x21dcaa || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  if (_0x4194e7.startsWith('en')) return 'en-US';
  return 'zh-CN';
}
function getPlannerLanguagePolicy(_0x4dcd8b) {
  const _0x571f16 = normalizeAgentLocale(_0x4dcd8b);
  if (_0x571f16 === 'en-US')
    return {
      locale: 'en-US',
      responseLanguage: 'English',
      instruction: 'All user-facing reply, question, and option labels must be in English.',
    };
  return {
    locale: 'zh-CN',
    responseLanguage: '简体中文',
    instruction: '所有面向用户的 reply、question、options.label 必须使用简体中文。',
  };
}
function normalizePlannerHistory(
  _0x23c5a1 = [],
  {
    limit: limit = AGENT_PLANNER_HISTORY_LIMIT,
    textLimit: textLimit = AGENT_PLANNER_HISTORY_TEXT_LIMIT,
  } = {},
) {
  if (!Array.isArray(_0x23c5a1)) return [];
  return _0x23c5a1
    .slice(-limit)
    .map((_0x87ff9e = {}) => ({
      role: String(_0x87ff9e.role || 'assistant'),
      status: String(_0x87ff9e.status || ''),
      content: truncatePlannerText(
        _0x87ff9e.content || _0x87ff9e.reply || _0x87ff9e.message || _0x87ff9e.question || '',
        textLimit,
      ),
    }))
    .filter((_0x155234) => _0x155234.content || _0x155234.status);
}
function cloneJson(_0x28c848) {
  try {
    return JSON.parse(JSON.stringify(_0x28c848 || {}));
  } catch {
    return {};
  }
}
function truncateList(_0xb417af, _0x362986) {
  return Array.isArray(_0xb417af) ? _0xb417af.slice(0, _0x362986) : [];
}
function compactCommand(_0x13c78b = {}) {
  const _0x547d91 =
      _0x13c78b.argsSchema && typeof _0x13c78b.argsSchema === 'object' ? _0x13c78b.argsSchema : {},
    _0x1bd038 =
      _0x13c78b.capabilitySchema && typeof _0x13c78b.capabilitySchema === 'object'
        ? _0x13c78b.capabilitySchema
        : {};
  return {
    id: _0x13c78b.id,
    riskLevel: _0x13c78b.riskLevel,
    argsSchema: {
      required: Array.isArray(_0x547d91.required) ? _0x547d91.required : [],
      defaults: _0x547d91.defaults && typeof _0x547d91.defaults === 'object' ? _0x547d91.defaults : {},
      selectionFallback: _0x547d91.selectionFallback === true,
    },
    capabilitySchema: {
      selectionFallback: _0x1bd038.selectionFallback === true,
      requiresMountedRuntime: _0x1bd038.requiresMountedRuntime === true,
    },
    returnAliasFields: Array.isArray(_0x13c78b.returnAliasFields) ? _0x13c78b.returnAliasFields : [],
  };
}
function compactPlannerContext(_0x1c56ad, _0x26286d = 0) {
  const _0x44fe16 = cloneJson(_0x1c56ad),
    _0x45c8bd = _0x44fe16.canvas || {};
  Array.isArray(_0x44fe16.commands) &&
    _0x26286d >= 1 &&
    (_0x44fe16.commands = _0x44fe16.commands.map(compactCommand));
  Array.isArray(_0x45c8bd.recentCommands) &&
    _0x26286d >= 1 &&
    (_0x45c8bd.recentCommands = _0x45c8bd.recentCommands.slice(-5));
  if (Array.isArray(_0x45c8bd.availableModels)) {
    const _0x8a9221 = [22, 14, 10, 6, 3, 0],
      _0x5b705e = _0x8a9221[Math.min(_0x26286d, _0x8a9221.length - 1)];
    ((_0x45c8bd.availableModels = truncateList(_0x45c8bd.availableModels, _0x5b705e)),
      _0x45c8bd.modelCatalog &&
        ((_0x45c8bd.modelCatalog.truncated = true),
        (_0x45c8bd.modelCatalog.includedModels = _0x45c8bd.availableModels.length)));
  }
  Array.isArray(_0x45c8bd.availableWorkflows) && _0x26286d >= 2 && (_0x45c8bd.availableWorkflows = []);
  if (Array.isArray(_0x45c8bd.nodes) && _0x26286d >= 2) {
    const _0x31a362 = _0x26286d >= 4 ? 60 : 160,
      _0x5521a6 = _0x26286d >= 5 ? 10 : 30;
    _0x45c8bd.nodes = _0x45c8bd.nodes.slice(0, _0x5521a6).map((_0x71dc69) => ({
      ..._0x71dc69,
      promptPreview: truncatePlannerText(_0x71dc69.promptPreview, _0x31a362),
      contentPreview: truncatePlannerText(_0x71dc69.contentPreview, _0x31a362),
    }));
  }
  return (
    Array.isArray(_0x45c8bd.edges) && _0x26286d >= 3 && (_0x45c8bd.edges = _0x45c8bd.edges.slice(0, 20)),
    _0x26286d >= 5 && ((_0x45c8bd.edges = []), (_0x45c8bd.recentCommands = [])),
    (_0x44fe16.canvas = _0x45c8bd),
    _0x44fe16.contextBudget &&
      (_0x44fe16.contextBudget = { ..._0x44fe16.contextBudget, plannerCompacted: _0x26286d > 0 }),
    _0x44fe16
  );
}
function buildPlannerPayload({
  message: _0x253242,
  context: _0x2c76b4,
  history: history = [],
  locale: locale = '',
} = {}) {
  return {
    system: AGENT_SYSTEM_PROMPT,
    responseContract: AGENT_RESPONSE_CONTRACT,
    languagePolicy: getPlannerLanguagePolicy(locale),
    userMessage: String(_0x253242 || ''),
    history: normalizePlannerHistory(history),
    context: _0x2c76b4,
    examples: buildAgentPlanExamples(_0x2c76b4),
    outputSchema: {
      reply: 'string',
      status: 'chat|ready|need_clarification|need_confirmation|failed',
      requiresConfirmation: 'boolean',
      question: 'string when clarification is needed',
      options: [{ id: 'string', label: 'string' }],
      actions: [
        {
          type: 'canvas command id',
          as: 'optional action result alias',
          args: 'object matching context.commands[].argsSchema; may reference earlier aliases with $alias.path from returnAliasFields. node.create may include model/provider from context.canvas.availableModels.',
        },
      ],
    },
  };
}
function buildPlannerPrompt({
  message: _0x488ae1,
  context: _0x2c6cef,
  history: history = [],
  locale: locale = '',
} = {}) {
  let _0x54d936 = buildPlannerPayload({
      message: _0x488ae1,
      context: _0x2c6cef,
      history: history,
      locale: locale,
    }),
    _0x5e17a6 = JSON.stringify(_0x54d936);
  if (_0x5e17a6.length <= AGENT_PLANNER_PROMPT_MAX_CHARS) return _0x5e17a6;
  ((_0x54d936.history = normalizePlannerHistory(history, { limit: 4, textLimit: 180 })),
    (_0x5e17a6 = JSON.stringify(_0x54d936)));
  if (_0x5e17a6.length <= AGENT_PLANNER_PROMPT_MAX_CHARS) return _0x5e17a6;
  for (let _0x108841 = 1; _0x108841 <= 5; _0x108841 += 1) {
    ((_0x54d936 = { ..._0x54d936, context: compactPlannerContext(_0x2c6cef, _0x108841) }),
      (_0x5e17a6 = JSON.stringify(_0x54d936)));
    if (_0x5e17a6.length <= AGENT_PLANNER_PROMPT_MAX_CHARS) return _0x5e17a6;
  }
  return JSON.stringify({
    system: AGENT_SYSTEM_PROMPT,
    userMessage: String(_0x488ae1 || ''),
    history: [],
    context: compactPlannerContext(_0x2c6cef, 5),
    responseContract: AGENT_RESPONSE_CONTRACT,
    examples: buildAgentPlanExamples(_0x2c6cef).slice(0, 2),
    outputSchema: buildPlannerPayload({ locale: locale }).outputSchema,
  });
}
function buildPlannerRetryPrompt(_0x48ce4f, _0xc63f8 = '') {
  let _0x1888c6 = null;
  try {
    _0x1888c6 = JSON.parse(String(_0x48ce4f || ''));
  } catch {
    return _0x48ce4f;
  }
  const _0x1f6a43 = JSON.stringify({
    ..._0x1888c6,
    retry: {
      previousAttemptRejectedBeforeExecution: true,
      reason: String(_0xc63f8 || 'invalid JSON'),
      instruction:
        'Return the corrected strict JSON object only. Do not include Markdown, prose, comments, or code fences.',
    },
  });
  return _0x1f6a43.length <= AGENT_PLANNER_PROMPT_MAX_CHARS ? _0x1f6a43 : _0x48ce4f;
}
function extractJsonObject(_0x160b7e) {
  if (_0x160b7e && typeof _0x160b7e === 'object') return _0x160b7e;
  const _0x22e074 = String(_0x160b7e || '').trim();
  if (!_0x22e074) throw new Error('Agent planner returned empty text.');
  try {
    return JSON.parse(_0x22e074);
  } catch {
    throw new Error('Agent planner returned invalid JSON.');
  }
}
function getPlannerText(_0x1253e5) {
  return typeof _0x1253e5 === 'string'
    ? _0x1253e5
    : _0x1253e5?.text || _0x1253e5?.outputText || _0x1253e5?.content || '';
}
export async function requestAgentActionPlan({
  message: _0x3a2ea7,
  context: _0x50f067,
  history: history = [],
  settings: settings = {},
  request: request = generateText,
  onTrace: onTrace = null,
} = {}) {
  const _0x137bac = String(settings.model || '').trim(),
    _0x2873d4 = String(settings.provider || '').trim();
  if (!_0x137bac || !_0x2873d4)
    return { status: 'failed', reply: 'Agent model is not configured.', actions: [] };
  const _0x54e380 = buildPlannerPrompt({
    message: _0x3a2ea7,
    context: _0x50f067,
    history: history,
    locale: settings.locale,
  });
  onTrace?.({
    type: 'planner_model_selected',
    provider: _0x2873d4,
    model: _0x137bac,
    reason: 'agentModelSettings',
  });
  const _0x539267 = {
      model: _0x137bac,
      provider: _0x2873d4,
      prompt: _0x54e380,
      systemPrompt: AGENT_SYSTEM_PROMPT,
      temperature: Number.isFinite(Number(settings.temperature)) ? Number(settings.temperature) : 0,
    },
    _0x35d0fe = await request(_0x539267);
  try {
    return extractJsonObject(getPlannerText(_0x35d0fe));
  } catch (_0x22d7bd) {
    onTrace?.({
      type: 'planner_json_retry',
      reason: _0x22d7bd?.message || 'invalid JSON',
      rawPreview: truncatePlannerText(getPlannerText(_0x35d0fe), 160),
    });
    const _0x2eea07 = buildPlannerRetryPrompt(_0x54e380, _0x22d7bd?.message),
      _0x4b05ed = await request({ ..._0x539267, prompt: _0x2eea07 });
    try {
      return extractJsonObject(getPlannerText(_0x4b05ed));
    } catch (_0x34cbbd) {
      onTrace?.({
        type: 'planner_json_retry_failed',
        reason: _0x34cbbd?.message || 'invalid JSON',
        rawPreview: truncatePlannerText(getPlannerText(_0x4b05ed), 160),
      });
      throw _0x34cbbd;
    }
  }
}
