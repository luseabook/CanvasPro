import { canvasCommandRegistry } from '../canvasCommands/index.js';
import { buildAgentContext } from './agentContextBuilder.js';
import { validateAgentPlan } from './agentPlanValidator.js';
import { executeAgentActions } from './agentActionExecutor.js';
import { createAgentSessionStore } from './agentSessionStore.js';
import { getLocale } from '../../i18n/index.js';
import { resolveModelExecution } from '../../manifests/index.js';
const RUNTIME_TEXT = Object.freeze({
    'zh-CN': Object.freeze({
      actionExecutionFailed: 'Agent 动作执行失败。',
      done: '已执行。',
      emptyMessage: 'Agent 消息为空。',
      noPendingClarification: '当前没有待回答的问题。',
      noPendingPlan: '当前没有待确认的计划。',
      noPendingRecovery: '当前没有可恢复的失败计划。',
      recoveryKept: '已保留准备步骤。你可以修改提示词或换模型后重新规划。',
      planCancelled: '已取消执行。',
      plannerFailed: 'Agent 规划失败。',
      plannerMissing: 'Agent 文本模型尚未配置。',
      preActionsFailed: 'Agent 准备步骤执行失败。',
      reset: 'Agent 会话已重置。',
      runStopped: 'Agent 已停止。',
      confirmFallback: '请确认后继续执行。',
      cancelNotice: '取消只会取消待确认的生成，不会撤回已完成的创建、连接或排列。',
      retry: '重试',
      editPrompt: '修改提示词',
      changeModel: '换模型',
      keepPrepared: '只保留已创建节点',
      nodeCreate: '创建节点',
      nodeCreateImage: '创建图片节点',
      nodeCreateVideo: '创建视频节点',
      nodeCreateAudio: '创建音频节点',
      nodeCreateText: '创建文本节点',
      graphConnect: '连接节点',
      layoutAlign: '对齐节点',
      layoutArrangeRow: '横向排列节点',
      layoutArrangeColumn: '纵向排列节点',
      layoutArrangeGrid: '网格排列节点',
      generationRun: '开始生成',
      nodeSetParams: '设置生成参数',
      nodeSetPrompt: '写入提示词',
      nodeDelete: '删除节点',
      selectedImageInput: '当前选中的图片节点',
      inputNode: '输入节点',
      traceSummary: '策略摘要',
      noInputSource: '无输入节点',
      defaultModel: '节点默认模型',
      chatFallback: '可以，我们先聊。需要我创建、生成或修改画布时，请明确说出要执行的操作。',
      chatIntentRequired:
        '我先不动当前画布。可以继续讨论；如果需要我创建、生成、连接、排列或修改节点，请明确告诉我要执行的操作。',
    }),
    'en-US': Object.freeze({
      actionExecutionFailed: 'Agent action execution failed.',
      done: 'Done.',
      emptyMessage: 'Agent message is empty.',
      noPendingClarification: 'No pending clarification.',
      noPendingPlan: 'No pending plan to confirm.',
      noPendingRecovery: 'No failed plan can be recovered.',
      recoveryKept: 'Prepared steps are kept. You can edit the prompt or switch model before replanning.',
      planCancelled: 'Plan cancelled.',
      plannerFailed: 'Agent planner failed.',
      plannerMissing: 'Agent planner is not configured.',
      preActionsFailed: 'Agent pre-confirmation actions failed.',
      reset: 'Agent session reset.',
      runStopped: 'Agent run stopped.',
      confirmFallback: 'Please confirm this action plan.',
      cancelNotice:
        'Cancel only cancels the pending generation. It will not undo created nodes, connections, or layout changes.',
      retry: 'Retry',
      editPrompt: 'Edit prompt',
      changeModel: 'Switch model',
      keepPrepared: 'Keep prepared nodes',
      nodeCreate: 'Create node',
      nodeCreateImage: 'Create image node',
      nodeCreateVideo: 'Create video node',
      nodeCreateAudio: 'Create audio node',
      nodeCreateText: 'Create text node',
      graphConnect: 'Connect nodes',
      layoutAlign: 'Align nodes',
      layoutArrangeRow: 'Arrange nodes horizontally',
      layoutArrangeColumn: 'Arrange nodes vertically',
      layoutArrangeGrid: 'Arrange nodes in a grid',
      generationRun: 'Start generation',
      nodeSetParams: 'Set generation parameters',
      nodeSetPrompt: 'Set prompt',
      nodeDelete: 'Delete node',
      selectedImageInput: 'Selected image node',
      inputNode: 'Input node',
      traceSummary: 'Policy summary',
      noInputSource: 'No input node',
      defaultModel: 'Node default model',
      chatFallback:
        'Sure, we can talk first. Tell me explicitly when you want me to create, generate, or modify the canvas.',
      chatIntentRequired:
        'I will leave the canvas unchanged for now. We can keep discussing; tell me explicitly if you want me to create, generate, connect, arrange, or edit nodes.',
    }),
  }),
  EXPLICIT_CANVAS_ACTION_PATTERNS = Object.freeze([
    /\b(create|generate|draw|render|add|insert|modify|change|edit|arrange|align|connect|delete|duplicate|select|run|start|continue|execute)\b/i,
    /\bmake\s+(?:an?|the|this|that|it|image|picture|video|clip|node|canvas)\b/i,
    /生成|创建|新建|添加|插入|画图|画(?:一|个|张|幅)|制作|做(?:一个|一张|一段|一版|成|出)|出图|出视频/,
    /修改|改成|调整|重排|排列|对齐|连接|删除|复制|选中|选择|运行|开始|继续|执行/,
  ]);
function normalizeRuntimeLocale(locale = getLocale()) {
  return String(locale || '')
    .toLowerCase()
    .startsWith('en')
    ? 'en-US'
    : 'zh-CN';
}
function runtimeText(value, locale2 = getLocale()) {
  const runtimeLocale = normalizeRuntimeLocale(locale2);
  return RUNTIME_TEXT[runtimeLocale]?.[value] || RUNTIME_TEXT['zh-CN'][value] || value;
}
function createFailedReply(reply, args = {}) {
  return { ok: false, status: 'failed', reply: reply, message: reply, ...args };
}
function summarizeExecution(error, locale3 = getLocale()) {
  if (error.ok) return runtimeText('done', locale3);
  return error.message || runtimeText('actionExecutionFailed', locale3);
}
function isSafeAction(options = {}) {
  return String(options.riskLevel || 'safe') === 'safe';
}
function createChatReply(item, args2 = {}) {
  const reply2 = String(item || '');
  return { ok: true, status: 'chat', reply: reply2, message: reply2, ...args2 };
}
function hasExplicitCanvasActionIntent(key = '', index = {}) {
  if (index?.clarificationAnswer || index?.pendingPlan) return true;
  if (index?.intent?.canvasAction === true || index?.intent?.mutatesCanvas === true) return true;
  const enabled = String(key || '').trim();
  if (!enabled) return false;
  return EXPLICIT_CANVAS_ACTION_PATTERNS.some((item2) => item2.test(enabled));
}
function shouldHoldCanvasActionsForChat(response = {}, result = '', data = {}) {
  if (response.status !== 'ready' && response.status !== 'need_confirmation') return false;
  if (!Array.isArray(response.plan?.actions) || response.plan.actions.length === 0) return false;
  return !hasExplicitCanvasActionIntent(result, data);
}
function getState({ store: store, commandContext: commandContext } = {}) {
  return (
    store?.getStateRaw?.() ||
    store?.getState?.() ||
    commandContext?.store?.getStateRaw?.() ||
    commandContext?.store?.getState?.() ||
    {}
  );
}
function stripMarkup(target) {
  return String(target || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(source, next = 80) {
  const list = stripMarkup(source);
  return list.length <= next ? list : list.slice(0, Math.max(0, next - 3)) + '...';
}
function getProjectId(options2 = {}) {
  return String(
    options2.commandContext?.windowObject?.currentProjectId ||
      globalThis.window?.currentProjectId ||
      'default_v2_project',
  );
}
function getCollectionSize(list2) {
  if (Array.isArray(list2)) return list2.length;
  if (list2 && typeof list2 === 'object') return Object.keys(list2).length;
  return 0;
}
function buildCanvasSnapshotDigest(options3 = {}) {
  const state = getState(options3);
  return {
    projectId: getProjectId(options3),
    nodeCount: getCollectionSize(state.nodes),
    edgeCount: getCollectionSize(state.edges),
    selectedNodeIds: Array.isArray(state.selectedNodeIds)
      ? state.selectedNodeIds.map((item3) => String(item3 || '')).filter(Boolean)
      : [],
  };
}
function buildPlanSummary(options4 = {}) {
  const current = options4.confirmationSummary || {},
    list3 = Array.isArray(current.pendingActions) ? current.pendingActions : [],
    list4 = Array.isArray(current.completedActions) ? current.completedActions : [],
    list5 = list3
      .map((item4) => item4?.label || item4?.type || '')
      .filter(Boolean)
      .slice(0, 3),
    list6 = [];
  if (list4.length) list6.push('已准备 ' + list4.length + ' 步');
  if (list5.length) list6.push('待确认：' + list5.join('，'));
  if (current.generation?.modelLabel) list6.push('模型：' + current.generation.modelLabel);
  return (
    current.generation?.promptSummary && list6.push('Prompt：' + current.generation.promptSummary),
    truncateText(list6.join('；') || options4.reply || '', 240)
  );
}
function buildRecoverySummary(options5 = {}) {
  const entry = options5.failedAction || {},
    record = entry.label || entry.type || '';
  return truncateText(record ? '失败动作：' + record : '上次生成失败，可重新规划。', 240);
}
function formatTraceReason(payload = '') {
  const handle = String(payload || ''),
    config = {
      'selected image has compatible image-to-video model': '已根据选中图片选择兼容的图生视频模型',
      'requested model was available in context': '已使用上下文中的请求模型',
      'target model uiSchema does not declare removed params': '已移除目标模型不支持的参数',
      'generation run requires confirmation': '生成执行需要确认',
      'existing node connection change requires confirmation': '修改已有节点连接需要确认',
      'existing node prompt change requires confirmation': '修改已有节点 Prompt 需要确认',
      'existing node generation params change requires confirmation': '修改已有节点参数需要确认',
      'existing node model change requires confirmation': '修改已有节点模型需要确认',
      'existing input slot change requires confirmation': '修改已有输入槽需要确认',
      'node delete requires confirmation': '删除节点需要确认',
      'large batch requires confirmation': '批量操作数量较多，需要确认',
      'planner requested confirmation': '规划器要求确认',
      'action risk requires confirmation': '动作风险要求确认',
      'command risk requires confirmation': '命令风险要求确认',
    };
  return config[handle] || handle || '需要确认';
}
function summarizeDebugTraceForConfirmation(list7 = []) {
  if (!Array.isArray(list7) || list7.length === 0) return [];
  const list8 = [];
  for (const scope of list7) {
    if (scope?.type === 'contextual_default_applied' && scope.field === 'model') {
      const input = String(scope.modelId || '').trim();
      list8.push(
        input
          ? '模型选择：' + input + '。' + formatTraceReason(scope.reason) + '。'
          : '模型选择：' + formatTraceReason(scope.reason) + '。',
      );
    }
    if (scope?.type === 'params_filtered') {
      const output = Array.isArray(scope.removedParamIds) ? scope.removedParamIds.join('，') : '',
        value2 = Array.isArray(scope.keptParamIds) ? scope.keptParamIds.join('，') : '';
      list8.push(
        '参数过滤：移除' +
          (output || '无') +
          '；保留' +
          (value2 || '无') +
          '。' +
          formatTraceReason(scope.reason) +
          '。',
      );
    }
    scope?.type === 'confirmation_required' &&
      list8.push('确认原因：' + formatTraceReason(scope.reason) + '。');
  }
  return list8.slice(0, 6);
}
function getPlainObject(value3) {
  return value3 && typeof value3 === 'object' && !Array.isArray(value3) ? value3 : {};
}
function readPathSegment(value4, value5) {
  if (value4 == null) return undefined;
  if (Array.isArray(value4) && /^\d+$/.test(value5)) return value4[Number(value5)];
  return value4?.[value5];
}
function resolveScopedExpression(value6, value7 = {}) {
  const value8 = String(value6 || '')
      .trim()
      .split('.')
      .map((item5) => item5.trim())
      .filter(Boolean),
    enabled2 = value8.shift();
  if (!enabled2 || !Object.prototype.hasOwnProperty.call(value7, enabled2)) return { ok: false };
  let value9 = value7[enabled2];
  for (const value10 of value8) {
    value9 = readPathSegment(value9, value10);
    if (value9 === undefined) return { ok: false };
  }
  return { ok: true, value: value9 };
}
function resolveScopedValue(list9, value11 = {}) {
  if (typeof list9 === 'string') {
    const enabled3 = /^\$([A-Za-z_][A-Za-z0-9_]*(?:\.(?:[A-Za-z_][A-Za-z0-9_]*|\d+))*)$/.exec(list9.trim());
    if (!enabled3) return list9;
    const el = resolveScopedExpression(enabled3[1], value11);
    return el.ok ? el.value : list9;
  }
  if (Array.isArray(list9)) return list9.map((item6) => resolveScopedValue(item6, value11));
  if (list9 && typeof list9 === 'object') {
    const value12 = {};
    for (const [value13, value14] of Object.entries(list9)) {
      value12[value13] = resolveScopedValue(value14, value11);
    }
    return value12;
  }
  return list9;
}
function resolveActionArgs(options6 = {}, value15 = {}) {
  return resolveScopedValue(options6.args || {}, value15);
}
function getCreateActionLabel(value16, value17) {
  const value18 = String(value16 || '');
  if (value18 === 'ai-image') return runtimeText('nodeCreateImage', value17);
  if (value18 === 'ai-video') return runtimeText('nodeCreateVideo', value17);
  if (value18 === 'ai-audio') return runtimeText('nodeCreateAudio', value17);
  if (value18 === 'ai-text' || value18 === 'source-text') return runtimeText('nodeCreateText', value17);
  return runtimeText('nodeCreate', value17);
}
function getActionLabel(value19, value20 = {}, value21) {
  const value22 = String(value19 || '');
  if (value22 === 'node.create') return getCreateActionLabel(value20.type, value21);
  if (value22 === 'node.setPrompt' || value22 === 'node.appendPrompt')
    return runtimeText('nodeSetPrompt', value21);
  if (value22 === 'node.setParams') return runtimeText('nodeSetParams', value21);
  if (value22 === 'graph.connect') return runtimeText('graphConnect', value21);
  if (value22 === 'layout.align') return runtimeText('layoutAlign', value21);
  if (value22 === 'layout.arrangeRow') return runtimeText('layoutArrangeRow', value21);
  if (value22 === 'layout.arrangeColumn') return runtimeText('layoutArrangeColumn', value21);
  if (value22 === 'layout.arrangeGrid') return runtimeText('layoutArrangeGrid', value21);
  if (value22 === 'generation.run') return runtimeText('generationRun', value21);
  if (value22 === 'node.delete') return runtimeText('nodeDelete', value21);
  return value22;
}
function summarizeAction(options7 = {}, value23 = {}, locale4 = getLocale()) {
  const args3 = resolveActionArgs(options7, value23);
  return {
    type: String(options7.type || ''),
    label: getActionLabel(options7.type, args3, locale4),
    args: args3,
    promptSummary: truncateText(args3.prompt || args3.text || '', 60),
  };
}
function getNode(options8 = {}, value24 = '') {
  const value25 = String(value24 || '').trim();
  return value25 ? options8.nodes?.[value25] || null : null;
}
function isImageNodeType(value26 = '') {
  return String(value26 || '') === 'ai-image' || String(value26 || '') === 'source-image';
}
function summarizeInputSource(options9 = {}, value27 = '', locale5 = getLocale()) {
  const list10 = Object.values(options9.edges || {}).filter(
      (item7) => String(item7?.targetId || '') === String(value27 || ''),
    ),
    map = new Set((options9.selectedNodeIds || []).map((item8) => String(item8 || ''))),
    list11 = list10
      .map((item9) => {
        const error2 = getNode(options9, item9.sourceId);
        if (!error2) return '';
        const value28 = String(error2.name || error2.id || item9.sourceId),
          value29 =
            map.has(String(error2.id || '')) && isImageNodeType(error2.type)
              ? runtimeText('selectedImageInput', locale5)
              : runtimeText('inputNode', locale5);
        return value29 + '：' + value28;
      })
      .filter(Boolean);
  return list11.join('，') || runtimeText('noInputSource', locale5);
}
function summarizeGeneration(options10 = {}, value30 = {}) {
  const value31 = value30.locale || getLocale(),
    value32 = options10.scope || {},
    enabled4 = (options10.actions || []).find((item10) => item10?.type === 'generation.run');
  if (!enabled4) return null;
  const actionArgs = resolveActionArgs(enabled4, value32),
    nodeId = String(actionArgs.nodeId || '').trim(),
    state2 = getState(value30),
    providerHint = getNode(state2, nodeId) || {},
    modelExecution = resolveModelExecution(providerHint.model, { providerHint: providerHint.provider }),
    modelLabel =
      modelExecution?.modelManifest?.displayName ||
      modelExecution?.modelManifest?.title ||
      providerHint.model ||
      runtimeText('defaultModel', value31),
    params = {
      ...getPlainObject(providerHint.generationParams),
      ...getPlainObject(actionArgs.options?.params),
    };
  return {
    nodeId: nodeId,
    model: String(providerHint.model || ''),
    modelLabel: modelLabel,
    provider: String(providerHint.provider || modelExecution?.modelManifest?.provider || ''),
    promptSummary: truncateText(providerHint.prompt || providerHint.storyboardScript?.prompt || '', 120),
    params: params,
    inputSource: summarizeInputSource(state2, nodeId, value31),
  };
}
function buildConfirmationSummary(options11 = {}, value33 = {}) {
  const value34 = value33.locale || getLocale(),
    value35 = options11.scope || {};
  return {
    completedActions: (options11.preExecutedActions || []).map((item11) =>
      summarizeAction(item11, value35, value34),
    ),
    pendingActions: (options11.actions || []).map((item12) => summarizeAction(item12, value35, value34)),
    generation: summarizeGeneration(options11, value33),
    debugTraceSummary: summarizeDebugTraceForConfirmation(value33.debugTrace),
    cancelNotice: runtimeText('cancelNotice', value34),
  };
}
function buildRecoveryOptions(locale6 = getLocale()) {
  return [
    { id: 'retry', label: runtimeText('retry', locale6) },
    { id: 'editPrompt', label: runtimeText('editPrompt', locale6) },
    { id: 'changeModel', label: runtimeText('changeModel', locale6) },
    { id: 'keepPrepared', label: runtimeText('keepPrepared', locale6) },
  ];
}
function buildRecovery(errorCode = {}, value36 = {}, locale7 = getLocale()) {
  const count = Number(errorCode.raw?.result?.failedIndex),
    enabled5 =
      Number.isFinite(count) && count >= 0
        ? value36.actions?.[count] || null
        : value36.actions?.find((item13) => item13?.type === 'generation.run') || null;
  if (!enabled5) return null;
  return {
    errorCode: errorCode.errorCode || errorCode.raw?.errorCode || '',
    failedAction: summarizeAction(enabled5, value36.scope || {}, locale7),
    options: buildRecoveryOptions(locale7),
  };
}
function splitSafePrefix(pending = []) {
  const count2 = pending.findIndex((item14) => !isSafeAction(item14));
  if (count2 <= 0) return { prefix: [], pending: pending };
  return { prefix: pending.slice(0, count2), pending: pending.slice(count2) };
}
export function createAgentRuntime({
  store: store2,
  commandContext: commandContext2,
  commandRegistry: commandRegistry = canvasCommandRegistry,
  sessionStore: sessionStore = createAgentSessionStore(),
  planner: planner = null,
  buildContext: buildContext = buildAgentContext,
  validatePlan: validatePlan = validateAgentPlan,
  executeActions: executeActions = executeAgentActions,
  localeProvider: localeProvider = getLocale,
} = {}) {
  let value37 = 0,
    value38 = null;
  function locale8() {
    return normalizeRuntimeLocale(localeProvider?.() || getLocale());
  }
  function run(lastPlanSummary) {
    sessionStore.markUnfinishedOperation?.({
      lastPlanSummary: lastPlanSummary,
      lastCanvasSnapshotDigest: buildCanvasSnapshotDigest({ store: store2, commandContext: commandContext2 }),
    });
  }
  function run2() {
    sessionStore.clearUnfinishedOperation?.();
  }
  async function run3(userMessage2, intent = {}) {
    if (typeof planner !== 'function') return createFailedReply(runtimeText('plannerMissing', locale8()));
    const context = buildContext({
      store: store2 || commandContext2?.store,
      commandRegistry: commandRegistry,
      sessionStore: sessionStore,
      userMessage: userMessage2,
      intent: intent.intent,
      targetKind: intent.targetKind,
      inputRefs: intent.inputRefs,
      contextBudgetChars: intent.contextBudgetChars,
    });
    return (
      (value38 = context),
      planner({
        message: userMessage2,
        context: context,
        history: sessionStore.getHistory?.() || [],
        pendingClarification: sessionStore.getPendingClarification?.(),
        onTrace: (value39) => sessionStore.recordTrace?.(value39),
        ...intent,
      })
    );
  }
  async function run4(initialScope) {
    const status = await executeActions(initialScope.plan.actions, {
        commandContext: commandContext2,
        initialScope: initialScope.plan.scope || initialScope.plan.aliases || {},
      }),
      content =
        initialScope.plan.preExecutedActions?.length > 0
          ? summarizeExecution(status, locale8())
          : initialScope.plan.reply || summarizeExecution(status, locale8()),
      recovery = status.ok ? null : buildRecovery(status, initialScope.plan, locale8());
    if (status.ok) (sessionStore.clearPendingPlan?.(), sessionStore.clearPendingRecovery?.(), run2());
    else
      recovery
        ? (sessionStore.clearPendingPlan?.(),
          sessionStore.setPendingRecovery?.({ plan: initialScope.plan, recovery: recovery }),
          run(buildRecoverySummary(recovery)))
        : (sessionStore.clearPendingPlan?.(), sessionStore.clearPendingRecovery?.(), run2());
    return (
      sessionStore.pushHistory?.({
        role: 'assistant',
        status: status.ok ? 'success' : 'failed',
        content: content,
        execution: status,
        recovery: recovery,
      }),
      {
        ok: status.ok,
        status: status.status,
        reply: content,
        plan: initialScope.plan,
        execution: status,
        ...(recovery ? { recovery: recovery } : {}),
      }
    );
  }
  async function run5(plan) {
    const { prefix: prefix, pending: pending2 } = splitSafePrefix(plan.plan.actions);
    if (prefix.length === 0) return { ok: true, plan: plan.plan, preExecution: null };
    const content2 = await executeActions(prefix, { commandContext: commandContext2 });
    if (!content2.ok)
      return (
        sessionStore.pushHistory?.({
          role: 'assistant',
          status: 'failed',
          content: content2.message || runtimeText('preActionsFailed', locale8()),
          execution: content2,
        }),
        {
          ok: false,
          status: 'failed',
          reply: content2.message || runtimeText('preActionsFailed', locale8()),
          message: content2.message || runtimeText('preActionsFailed', locale8()),
          execution: content2,
        }
      );
    return {
      ok: true,
      preExecution: content2,
      plan: {
        ...plan.plan,
        actions: pending2,
        preExecutedActions: prefix,
        scope: content2.raw?.result?.aliases || {},
      },
    };
  }
  async function run6(
    value40,
    {
      agentContext: agentContext = value38,
      userMessage: userMessage = '',
      plannerExtra: plannerExtra = {},
    } = {},
  ) {
    const debugTrace = [],
      content3 = validatePlan(value40, {
        commandRegistry: commandRegistry,
        commandContext: commandContext2,
        agentContext: agentContext,
        traceRecorder: (value41) => {
          (debugTrace.push(value41), sessionStore.recordTrace?.(value41));
        },
      });
    if (!content3.ok)
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'failed', content: content3.message }),
        createFailedReply(content3.message, { validation: content3 })
      );
    if (content3.status === 'chat') {
      const content4 = content3.plan.reply || runtimeText('chatFallback', locale8());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'chat', content: content4 }),
        createChatReply(content4, { plan: content3.plan })
      );
    }
    if (shouldHoldCanvasActionsForChat(content3, userMessage, plannerExtra)) {
      const content5 = content3.plan.reply || runtimeText('chatIntentRequired', locale8());
      return (
        sessionStore.recordTrace?.({
          type: 'canvas_action_held_for_chat',
          actionTypes: (content3.plan.actions || []).map((item15) => item15.type),
          reason: 'missing explicit canvas action intent',
        }),
        sessionStore.pushHistory?.({ role: 'assistant', status: 'chat', content: content5 }),
        createChatReply(content5, {
          plan: { ...content3.plan, status: 'chat', actions: [], requiresConfirmation: false },
          heldActions: content3.plan.actions,
        })
      );
    }
    if (content3.status === 'need_clarification')
      return (
        sessionStore.setPendingClarification?.(content3.plan),
        sessionStore.pushHistory?.({
          role: 'assistant',
          status: 'need_clarification',
          content: content3.plan.question,
        }),
        {
          ok: true,
          status: 'need_clarification',
          reply: content3.plan.reply || content3.plan.question,
          question: content3.plan.question,
          options: content3.plan.options,
          plan: content3.plan,
        }
      );
    if (content3.status === 'need_confirmation') {
      const content6 = await run5(content3);
      if (!content6.ok) return content6;
      return (
        sessionStore.setPendingPlan?.(content6.plan),
        (content6.plan.confirmationSummary = buildConfirmationSummary(content6.plan, {
          store: store2,
          commandContext: commandContext2,
          locale: locale8(),
          debugTrace: debugTrace,
        })),
        run(buildPlanSummary(content6.plan)),
        sessionStore.pushHistory?.({
          role: 'assistant',
          status: 'need_confirmation',
          content: content6.plan.reply,
        }),
        {
          ok: true,
          status: 'need_confirmation',
          reply: content6.plan.reply || runtimeText('confirmFallback', locale8()),
          riskLevel: content3.riskLevel,
          plan: content6.plan,
          preExecution: content6.preExecution,
        }
      );
    }
    return run4(content3);
  }
  async function handleUserMessage(value42, plannerExtra2 = {}) {
    const content7 = String(value42 || '').trim();
    if (!content7) return createFailedReply(runtimeText('emptyMessage', locale8()));
    const id = 'agent-run-' + ++value37;
    (sessionStore.clearPendingPlan?.(),
      sessionStore.clearPendingRecovery?.(),
      sessionStore.clearPendingClarification?.(),
      run2(),
      sessionStore.setCurrentRun?.({ id: id, status: 'planning', stopped: false }),
      sessionStore.pushHistory?.({ role: 'user', content: content7 }));
    let value43;
    try {
      value43 = await run3(content7, plannerExtra2);
    } catch (error3) {
      const content8 = error3?.message || runtimeText('plannerFailed', locale8());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'failed', content: content8 }),
        sessionStore.setCurrentRun?.({ id: id, status: 'failed', stopped: false }),
        createFailedReply(content8)
      );
    }
    const value44 = sessionStore.getCurrentRun?.();
    if (value44?.id === id && value44.stopped)
      return createFailedReply(runtimeText('runStopped', locale8()), { status: 'stopped' });
    const status2 = await run6(value43, { userMessage: content7, plannerExtra: plannerExtra2 });
    return (sessionStore.setCurrentRun?.({ id: id, status: status2.status, stopped: false }), status2);
  }
  async function answerClarification(clarificationAnswer, args4 = {}) {
    const pendingPlan = sessionStore.getPendingClarification?.();
    if (!pendingPlan) return createFailedReply(runtimeText('noPendingClarification', locale8()));
    sessionStore.clearPendingClarification?.();
    const value45 = String(args4.displayAnswer || clarificationAnswer || '').trim(),
      value46 = { ...args4, clarificationAnswer: clarificationAnswer, pendingPlan: pendingPlan };
    return (delete value46.displayAnswer, handleUserMessage(value45, value46));
  }
  return {
    sessionStore: sessionStore,
    handleUserMessage: handleUserMessage,
    answerClarification: answerClarification,
    async confirmPendingPlan(options12 = {}) {
      const args5 = sessionStore.getPendingPlan?.();
      if (!args5) return createFailedReply(runtimeText('noPendingPlan', locale8()));
      const content9 = String(options12.displayAnswer || '').trim();
      return (
        content9 && sessionStore.pushHistory?.({ role: 'user', content: content9 }),
        run4({
          ok: true,
          status: 'ready',
          plan: { ...args5, status: 'ready', requiresConfirmation: false },
        })
      );
    },
    async retryFailedPlan() {
      const args6 = sessionStore.getPendingRecovery?.();
      if (!args6?.plan) return createFailedReply(runtimeText('noPendingRecovery', locale8()));
      return run4({
        ok: true,
        status: 'ready',
        plan: { ...args6.plan, status: 'ready', requiresConfirmation: false },
      });
    },
    keepPreparedPlan() {
      (sessionStore.clearPendingRecovery?.(), sessionStore.clearPendingPlan?.(), run2());
      const content10 = runtimeText('recoveryKept', locale8());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'recovery_kept', content: content10 }),
        { ok: true, status: 'recovery_kept', reply: content10 }
      );
    },
    cancelPendingPlan() {
      (sessionStore.clearPendingPlan?.(), run2());
      const content11 = runtimeText('planCancelled', locale8());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'cancelled', content: content11 }),
        { ok: true, status: 'cancelled', reply: content11 }
      );
    },
    stop() {
      const run7 = sessionStore.stopCurrentRun?.();
      return { ok: true, status: 'stopped', reply: runtimeText('runStopped', locale8()), run: run7 };
    },
    resetSession() {
      return (
        sessionStore.reset?.(),
        run2(),
        { ok: true, status: 'reset', reply: runtimeText('reset', locale8()) }
      );
    },
    startNewConversation() {
      return sessionStore.startNewConversation?.() || null;
    },
    switchConversation(value47) {
      return sessionStore.switchConversation?.(value47) || null;
    },
    deleteConversation(value48) {
      return sessionStore.deleteConversation?.(value48) || null;
    },
    listConversations() {
      return sessionStore.listConversations?.() || [];
    },
    getActiveConversation() {
      return sessionStore.getActiveConversation?.() || null;
    },
  };
}
