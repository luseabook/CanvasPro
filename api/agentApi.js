import { generateText } from './aiTextApi.js';
export const AGENT_PLANNER_PROMPT_MAX_CHARS = 46000;
const AGENT_PLANNER_HISTORY_LIMIT = 6,
  AGENT_PLANNER_HISTORY_TEXT_LIMIT = 480;
export const AGENT_SYSTEM_PROMPT = [
  'You are the Canvas action planner.',
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
function isImageNodeType(value = '') {
  return String(value || '') === 'ai-image' || String(value || '') === 'source-image';
}
function findImageInputRefNodeId(canvas = {}) {
  const item = canvas?.canvas || {},
    key = item.referenceContext || {},
    list = [
      ...(Array.isArray(item.inputRefs) ? item.inputRefs : []),
      ...(Array.isArray(key.inputRefs) ? key.inputRefs : []),
    ],
    index = list.find((item2) => isImageNodeType(item2?.type) || String(item2?.kind || '') === 'image');
  if (index?.nodeId || index?.id) return String(index.nodeId || index.id);
  const list2 = Array.isArray(key.referencedNodes) ? key.referencedNodes : [],
    result = list2.find((item3) => isImageNodeType(item3?.type) || String(item3?.kind || '') === 'image');
  return result?.nodeId || result?.id ? String(result.nodeId || result.id) : '';
}
function findSelectedImageNodeId(canvas2 = {}) {
  const imageInputRefNodeId = findImageInputRefNodeId(canvas2);
  if (imageInputRefNodeId) return imageInputRefNodeId;
  const data = canvas2?.canvas || {},
    list3 = Array.isArray(data.selectedNodes) ? data.selectedNodes : [],
    options = list3.find((item4) => isImageNodeType(item4?.type));
  if (options?.id) return String(options.id);
  const list4 = Array.isArray(data.selectedNodeIds)
    ? data.selectedNodeIds.map((item5) => String(item5 || '')).filter(Boolean)
    : [];
  if (list4.length === 0) return '';
  const list5 = Array.isArray(data.nodes) ? data.nodes : [],
    map = new Set(list4),
    target = list5.find((item6) => map.has(String(item6?.id || '')) && isImageNodeType(item6?.type));
  return target?.id ? String(target.id) : '';
}
function modelAllowsImageInput(options2 = {}) {
  const source = options2?.inputSlots && typeof options2.inputSlots === 'object' ? options2.inputSlots : {},
    list6 = Array.isArray(source.allowedKinds) ? source.allowedKinds : [];
  if (list6.includes('image')) return true;
  const count = Number(source.maxByKind?.image);
  return Number.isFinite(count) && count > 0;
}
function modelRequiresMissingMedia(options3 = {}) {
  const next = options3?.inputSlots && typeof options3.inputSlots === 'object' ? options3.inputSlots : {},
    current = next.minByKind || {};
  if (Number(current.video) > 0) return true;
  if (Number(current.audio) > 0) return true;
  const list7 = Array.isArray(next.fixedSlots) ? next.fixedSlots : [];
  return list7.some(
    (item7) =>
      item7?.required === true &&
      (String(item7?.kind || '') === 'video' || String(item7?.kind || '') === 'audio'),
  );
}
function getModelFieldIds(options4 = {}) {
  return new Set(
    (Array.isArray(options4?.uiSchema?.fields) ? options4.uiSchema.fields : [])
      .map((item8) => String(item8?.id || '').trim())
      .filter(Boolean),
  );
}
function findImageToVideoModel(canvas3 = {}) {
  const list8 = Array.isArray(canvas3?.canvas?.availableModels) ? canvas3.canvas.availableModels : [];
  return (
    list8.find(
      (item9) =>
        item9?.kind === 'video' &&
        item9?.modelId &&
        modelAllowsImageInput(item9) &&
        !modelRequiresMissingMedia(item9),
    ) || null
  );
}
function buildImageToVideoExample(sourceId, enabled = null, { fromInputRefs: fromInputRefs = false } = {}) {
  const args = { type: 'ai-video', prompt: 'slow camera push in' };
  enabled?.modelId && ((args.model = enabled.modelId), (args.provider = enabled.provider || ''));
  const actions = [{ type: 'node.create', as: 'videoNode', args: args }],
    map2 = getModelFieldIds(enabled);
  return (
    (!enabled || map2.has('duration')) &&
      actions.push({
        type: 'node.setParams',
        args: { nodeId: '$videoNode.nodeId', params: { duration: 5 } },
      }),
    actions.push(
      { type: 'graph.connect', args: { sourceId: sourceId, targetId: '$videoNode.nodeId' } },
      { type: 'layout.arrangeRow', args: { ids: [sourceId, '$videoNode.nodeId'], gap: 80 } },
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
        actions: actions,
      },
    }
  );
}
function buildAgentPlanExamples(options5 = {}) {
  const imageInputRefNodeId2 = findImageInputRefNodeId(options5),
    enabled2 = imageInputRefNodeId2 || findSelectedImageNodeId(options5);
  if (!enabled2) return BASE_AGENT_PLAN_EXAMPLES;
  const videoModel = findImageToVideoModel(options5);
  return [
    BASE_AGENT_PLAN_EXAMPLES[0],
    buildImageToVideoExample(enabled2, videoModel, { fromInputRefs: Boolean(imageInputRefNodeId2) }),
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
function truncatePlannerText(entry, record = AGENT_PLANNER_HISTORY_TEXT_LIMIT) {
  const list9 = String(entry || '');
  if (list9.length <= record) return list9;
  return list9.slice(0, Math.max(0, record - 3)) + '...';
}
function normalizeAgentLocale(payload = '') {
  const handle = String(payload || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  if (handle.startsWith('en')) return 'en-US';
  return 'zh-CN';
}
function getPlannerLanguagePolicy(state) {
  const agentLocale = normalizeAgentLocale(state);
  if (agentLocale === 'en-US')
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
  list10 = [],
  {
    limit: limit = AGENT_PLANNER_HISTORY_LIMIT,
    textLimit: textLimit = AGENT_PLANNER_HISTORY_TEXT_LIMIT,
  } = {},
) {
  if (!Array.isArray(list10)) return [];
  return list10
    .slice(-limit)
    .map((error = {}) => ({
      role: String(error.role || 'assistant'),
      status: String(error.status || ''),
      content: truncatePlannerText(
        error.content || error.reply || error.message || error.question || '',
        textLimit,
      ),
    }))
    .filter((response) => response.content || response.status);
}
function cloneJson(config) {
  try {
    return JSON.parse(JSON.stringify(config || {}));
  } catch {
    return {};
  }
}
function truncateList(list11, scope) {
  return Array.isArray(list11) ? list11.slice(0, scope) : [];
}
function compactCommand(id = {}) {
  const defaults = id.argsSchema && typeof id.argsSchema === 'object' ? id.argsSchema : {},
    selectionFallback =
      id.capabilitySchema && typeof id.capabilitySchema === 'object' ? id.capabilitySchema : {};
  return {
    id: id.id,
    riskLevel: id.riskLevel,
    argsSchema: {
      required: Array.isArray(defaults.required) ? defaults.required : [],
      defaults: defaults.defaults && typeof defaults.defaults === 'object' ? defaults.defaults : {},
      selectionFallback: defaults.selectionFallback === true,
    },
    capabilitySchema: {
      selectionFallback: selectionFallback.selectionFallback === true,
      requiresMountedRuntime: selectionFallback.requiresMountedRuntime === true,
    },
    returnAliasFields: Array.isArray(id.returnAliasFields) ? id.returnAliasFields : [],
  };
}
function compactPlannerContext(input, plannerCompacted = 0) {
  const canvas4 = cloneJson(input),
    output = canvas4.canvas || {};
  Array.isArray(canvas4.commands) &&
    plannerCompacted >= 1 &&
    (canvas4.commands = canvas4.commands.map(compactCommand));
  Array.isArray(output.recentCommands) &&
    plannerCompacted >= 1 &&
    (output.recentCommands = output.recentCommands.slice(-5));
  if (Array.isArray(output.availableModels)) {
    const list12 = [22, 14, 10, 6, 3, 0],
      value2 = list12[Math.min(plannerCompacted, list12.length - 1)];
    ((output.availableModels = truncateList(output.availableModels, value2)),
      output.modelCatalog &&
        ((output.modelCatalog.truncated = true),
        (output.modelCatalog.includedModels = output.availableModels.length)));
  }
  Array.isArray(output.availableWorkflows) && plannerCompacted >= 2 && (output.availableWorkflows = []);
  if (Array.isArray(output.nodes) && plannerCompacted >= 2) {
    const value3 = plannerCompacted >= 4 ? 60 : 160,
      value4 = plannerCompacted >= 5 ? 10 : 30;
    output.nodes = output.nodes.slice(0, value4).map((args2) => ({
      ...args2,
      promptPreview: truncatePlannerText(args2.promptPreview, value3),
      contentPreview: truncatePlannerText(args2.contentPreview, value3),
    }));
  }
  return (
    Array.isArray(output.edges) && plannerCompacted >= 3 && (output.edges = output.edges.slice(0, 20)),
    plannerCompacted >= 5 && ((output.edges = []), (output.recentCommands = [])),
    (canvas4.canvas = output),
    canvas4.contextBudget &&
      (canvas4.contextBudget = { ...canvas4.contextBudget, plannerCompacted: plannerCompacted > 0 }),
    canvas4
  );
}
function buildPlannerPayload({
  message: message,
  context: context,
  history: history = [],
  locale: locale = '',
} = {}) {
  return {
    system: AGENT_SYSTEM_PROMPT,
    responseContract: AGENT_RESPONSE_CONTRACT,
    languagePolicy: getPlannerLanguagePolicy(locale),
    userMessage: String(message || ''),
    history: normalizePlannerHistory(history),
    context: context,
    examples: buildAgentPlanExamples(context),
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
  message: message2,
  context: context2,
  history: history = [],
  locale: locale = '',
} = {}) {
  let args3 = buildPlannerPayload({
      message: message2,
      context: context2,
      history: history,
      locale: locale,
    }),
    list13 = JSON.stringify(args3);
  if (list13.length <= AGENT_PLANNER_PROMPT_MAX_CHARS) return list13;
  ((args3.history = normalizePlannerHistory(history, { limit: 4, textLimit: 180 })),
    (list13 = JSON.stringify(args3)));
  if (list13.length <= AGENT_PLANNER_PROMPT_MAX_CHARS) return list13;
  for (let count2 = 1; count2 <= 5; count2 += 1) {
    ((args3 = { ...args3, context: compactPlannerContext(context2, count2) }),
      (list13 = JSON.stringify(args3)));
    if (list13.length <= AGENT_PLANNER_PROMPT_MAX_CHARS) return list13;
  }
  return JSON.stringify({
    system: AGENT_SYSTEM_PROMPT,
    userMessage: String(message2 || ''),
    history: [],
    context: compactPlannerContext(context2, 5),
    responseContract: AGENT_RESPONSE_CONTRACT,
    examples: buildAgentPlanExamples(context2).slice(0, 2),
    outputSchema: buildPlannerPayload({ locale: locale }).outputSchema,
  });
}
function buildPlannerRetryPrompt(value5, value6 = '') {
  let args4 = null;
  try {
    args4 = JSON.parse(String(value5 || ''));
  } catch {
    return value5;
  }
  const list14 = JSON.stringify({
    ...args4,
    retry: {
      previousAttemptRejectedBeforeExecution: true,
      reason: String(value6 || 'invalid JSON'),
      instruction:
        'Return the corrected strict JSON object only. Do not include Markdown, prose, comments, or code fences.',
    },
  });
  return list14.length <= AGENT_PLANNER_PROMPT_MAX_CHARS ? list14 : value5;
}
function extractJsonObject(value7) {
  if (value7 && typeof value7 === 'object') return value7;
  const enabled3 = String(value7 || '').trim();
  if (!enabled3) throw new Error('Agent planner returned empty text.');
  try {
    return JSON.parse(enabled3);
  } catch {
    throw new Error('Agent planner returned invalid JSON.');
  }
}
function getPlannerText(response2) {
  return typeof response2 === 'string'
    ? response2
    : response2?.text || response2?.outputText || response2?.content || '';
}
export async function requestAgentActionPlan({
  message: message3,
  context: context3,
  history: history = [],
  settings: settings = {},
  request: request = generateText,
  onTrace: onTrace = null,
} = {}) {
  const model = String(settings.model || '').trim(),
    provider = String(settings.provider || '').trim();
  if (!model || !provider) return { status: 'failed', reply: 'Agent model is not configured.', actions: [] };
  const prompt = buildPlannerPrompt({
    message: message3,
    context: context3,
    history: history,
    locale: settings.locale,
  });
  onTrace?.({
    type: 'planner_model_selected',
    provider: provider,
    model: model,
    reason: 'agentModelSettings',
  });
  const args5 = {
      model: model,
      provider: provider,
      prompt: prompt,
      systemPrompt: AGENT_SYSTEM_PROMPT,
      temperature: Number.isFinite(Number(settings.temperature)) ? Number(settings.temperature) : 0,
    },
    request2 = await request(args5);
  try {
    return extractJsonObject(getPlannerText(request2));
  } catch (reason) {
    onTrace?.({
      type: 'planner_json_retry',
      reason: reason?.message || 'invalid JSON',
      rawPreview: truncatePlannerText(getPlannerText(request2), 160),
    });
    const prompt2 = buildPlannerRetryPrompt(prompt, reason?.message),
      request3 = await request({ ...args5, prompt: prompt2 });
    try {
      return extractJsonObject(getPlannerText(request3));
    } catch (reason2) {
      onTrace?.({
        type: 'planner_json_retry_failed',
        reason: reason2?.message || 'invalid JSON',
        rawPreview: truncatePlannerText(getPlannerText(request3), 160),
      });
      throw reason2;
    }
  }
}
