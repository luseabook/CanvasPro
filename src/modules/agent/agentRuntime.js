import { canvasCommandRegistry } from '../canvasCommands/index.js';
import { buildAgentContext } from './agentContextBuilder.js';
import { buildSelectedAgentSkillUsage } from './agentSkillUsage.js';
import { createAgentConversationCapabilityRuntime } from './agentConversationCapabilityRuntime.js';
import { validateAgentPlan } from './agentPlanValidator.js';
import { executeAgentActions } from './agentActionExecutor.js';
import { createAgentSessionStore } from './agentSessionStore.js';
import { createAgentTaskBindingRuntime } from './agentTaskBindingRuntime.js';
import { createAgentPlanLifecycle } from './agentPlanLifecycle.js';
import { getLocale } from '../../i18n/index.js';
import {
  buildAgentToolResult,
  deriveAgentCapabilityDiscovery,
  deriveAgentRuntimeProvenance,
  fingerprintAgentAction,
} from './agentToolResult.js';
import { registerAgentDiscoveryCommands } from './agentDiscoveryCommands.js';
import {
  createAgentLoopActionBudget,
  isAgentLoopRecoveryEditMessage,
  isAgentLoopRetryMessage,
  recordAgentLoopActionBudgetResult,
  shouldRetryAgentLoopNoop,
  validateAgentLoopActionBudget,
} from './agentLoopRecovery.js';
import { shouldUseCreativeDefaults } from './agentClarificationPolicy.js';
import { verifyAgentLoopCompletionEvidence } from './agentCompletionEvidence.js';
import { selectAgentLoopPlanAction } from './agentLoopPlanSelection.js';
import {
  createAgentPrecreatedNodeRuntime,
  doesActionConsumePrecreatedNode,
  normalizeAgentPrecreatedNode,
} from './agentPrecreatedNode.js';
import {
  buildAgentExecutionDiagnostic,
  buildAgentPlannerDiagnostic,
  buildAgentPlannerRecovery,
} from './agentFailureDiagnostic.js';
import { hasAgentCanvasActionIntent, routeAgentTurn } from './agentTurnRouter.js';
import { createAgentConversationCanvasTransferRuntime } from './agentConversationCanvasTransferRuntime.js';
import { createAgentAssistantConversationRuntime } from './agentAssistantConversationRuntime.js';
import { getAgentContinuationSkillIds } from './agentAssistantConversation.js';
const DEFAULT_MAX_LOOP_STEPS = 0x10,
  PLANNER_NETWORK_RETRY_LIMIT = 0x1;
function isTransientPlannerNetworkError(error) {
  const value = [error?.['name'], error?.['code'], error?.['message']]
    ['map']((item) => String(item || '')['trim']())
    ['filter'](Boolean)
    ['join']('\x20')
    ['toLowerCase']();
  return (
    /failed to fetch|fetch failed|network(?: request)? (?:error|failed|failure)|networkerror/['test'](
      value,
    ) ||
    /econnreset|econnrefused|enotfound|enetunreach|socket hang up/['test'](value) ||
    /网络(?:连接|请求)?失败|网络错误|无法连接/['test'](value)
  );
}
const RUNTIME_TEXT = Object['freeze']({
  'zh-CN': Object['freeze']({
    actionExecutionFailed: 'Agent\x20动作执行失败。',
    done: '已执行。',
    emptyMessage: 'Agent 消息为空。',
    noPendingClarification: '当前没有待回答的问题。',
    noPendingPlan: '当前没有待确认的计划。',
    noPendingRecovery: '当前没有可恢复的失败计划。',
    noInterruptedRun: '当前没有需要结束的\x20Agent\x20任务。',
    noUndoableRun: '当前没有可撤销的 Agent 画布操作，或画布在任务后已经发生变化。',
    runResumed: '正在从上次中断的位置继续。',
    runDiscarded: '已结束上次 Agent 任务。已完成的画布操作不会撤销，已经提交的生成仍会继续。',
    runUndone: '已撤销\x20Agent\x20本轮对画布的修改。',
    recoveryKept: '已保留准备步骤。你可以修改提示词或换模型后重新规划。',
    planCancelled: '已取消执行。',
    plannerFailed: 'Agent 规划失败。',
    plannerRetryAvailable: 'Agent\x20规划失败，但原任务已保留。回复“重试”或“？”即可继续。',
    plannerReturnedNoAction: 'Agent 没有返回可执行的画布动作，原任务已保留。回复“重试”继续。',
    plannerMissing: 'Agent 文本模型尚未配置。',
    preActionsFailed: 'Agent\x20准备步骤执行失败。',
    reset: 'Agent\x20会话已重置。',
    runStopped: 'Agent 已停止。',
    loopLimitReached: 'Agent 已达到本轮最大步骤数，已停止以避免重复执行。',
    loopRepeatedAction: 'Agent 尝试重复执行已完成的动作，已停止。',
    loopRepeatedActionCorrection:
      '这个动作已经成功完成。不要再次执行；请根据工具结果继续下一个尚未完成的动作，或在任务完成时返回空 actions。',
    loopDuplicateBudgetCorrection:
      '用户要求的副本数量已经满足，或这个复制动作会超过数量。不要再复制节点；请继续生成、拼贴等剩余步骤，完成后返回空 actions。',
    loopCompletionEvidenceCorrection:
      '尚未验证到本轮创建的目标节点。必须先成功执行节点创建，再声称已经创建；不要把查询、选择或计划当作完成。',
    loopResumeExpired: '待继续的 Agent 运行已失效，请重新发起。',
    creativeDefaultsInstruction:
      '请自行采用合理的专业默认值完成创作；风格、构图、配色和提示词由你决定，不要再次追问这些可推断细节。',
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
    generationRunBatch: '批量开始生成',
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
    taskStarted: '生成已开始：{nodeLabel} 正在生成，完成后我会继续更新这里。',
    taskPending: '生成已提交：{nodeLabel} 正在排队或生成中。',
    taskWaiting: '生成任务正在执行，全部完成后\x20Agent\x20会自动继续后续步骤。',
    taskResumed: '生成任务已结束，Agent 正在继续后续步骤。',
    taskCompleted: '生成已完成：结果已写入 {nodeLabel}。',
    taskFailed: '生成失败：{nodeLabel}。{error}',
    taskCancelled: '生成已取消：{nodeLabel}。',
    textPlacedOnCanvas: '已将文案放入画布文本节点。',
    textSourceMissing: '没有找到可放入画布的上一条文案，请先让我生成或修改文案。',
    promptTransferTargetRequired: '请先只选择一个要写入提示词的节点，然后重试。',
    promptTransferConfirmation: '将把这版文案写入选中节点的提示词，请确认后继续。',
    promptTransferCompleted: '已将文案写入选中节点的提示词。',
  }),
  'en-US': Object['freeze']({
    actionExecutionFailed: 'Agent action execution failed.',
    done: 'Done.',
    emptyMessage: 'Agent message is empty.',
    noPendingClarification: 'No\x20pending\x20clarification.',
    noPendingPlan: 'No\x20pending\x20plan\x20to\x20confirm.',
    noPendingRecovery: 'No\x20failed\x20plan\x20can\x20be\x20recovered.',
    noInterruptedRun: 'There is no Agent run to end.',
    noUndoableRun: 'There is no undoable Agent canvas run, or the canvas changed after it.',
    runResumed: 'Resuming from the interrupted Agent checkpoint.',
    runDiscarded:
      'Ended the previous Agent run. Completed canvas changes stay in place, and submitted generations keep running.',
    runUndone: "Undid the Agent's canvas changes from this run.",
    recoveryKept: 'Prepared steps are kept. You can edit the prompt or switch model before replanning.',
    planCancelled: 'Plan cancelled.',
    plannerFailed: 'Agent planner failed.',
    plannerRetryAvailable:
      'Agent planning failed, but the original task was preserved. Reply “retry” or “?” to continue.',
    plannerReturnedNoAction:
      'The Agent returned no executable canvas action. The original task was preserved; reply “retry” to continue.',
    plannerMissing: 'Agent planner is not configured.',
    preActionsFailed: 'Agent pre-confirmation actions failed.',
    reset: 'Agent session reset.',
    runStopped: 'Agent\x20run\x20stopped.',
    loopLimitReached:
      'The\x20Agent\x20reached\x20the\x20step\x20limit\x20and\x20stopped\x20to\x20avoid\x20repeated\x20actions.',
    loopRepeatedAction:
      'The\x20Agent\x20tried\x20to\x20repeat\x20a\x20completed\x20action\x20and\x20was\x20stopped.',
    loopRepeatedActionCorrection:
      'This action already succeeded. Do not execute it again; use the tool result to continue with the next unfinished action, or return empty actions when done.',
    loopDuplicateBudgetCorrection:
      'The requested copy count is already satisfied, or this action would exceed it. Do not duplicate more nodes; continue with generation, collage, or other unfinished work, then return empty actions.',
    loopCompletionEvidenceCorrection:
      'The requested node has not been verified as created in this run. Complete node creation before claiming success; do not treat discovery, selection, or planning as completion.',
    loopResumeExpired: 'The pending Agent run is no longer valid. Please start it again.',
    creativeDefaultsInstruction:
      'Use reasonable professional defaults and make the creative choices yourself, including style, composition, color, and prompt. Do not ask again for inferable details.',
    confirmFallback: 'Please confirm this action plan.',
    cancelNotice:
      'Cancel only cancels the pending generation. It will not undo created nodes, connections, or layout changes.',
    retry: 'Retry',
    editPrompt: 'Edit prompt',
    changeModel: 'Switch model',
    keepPrepared: 'Keep prepared nodes',
    nodeCreate: 'Create node',
    nodeCreateImage: 'Create\x20image\x20node',
    nodeCreateVideo: 'Create video node',
    nodeCreateAudio: 'Create audio node',
    nodeCreateText: 'Create text node',
    graphConnect: 'Connect\x20nodes',
    layoutAlign: 'Align\x20nodes',
    layoutArrangeRow: 'Arrange nodes horizontally',
    layoutArrangeColumn: 'Arrange nodes vertically',
    layoutArrangeGrid: 'Arrange nodes in a grid',
    generationRun: 'Start generation',
    generationRunBatch: 'Start batch generation',
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
    taskStarted: 'Generation started: {nodeLabel} is running. I will update this chat when it finishes.',
    taskPending: 'Generation submitted: {nodeLabel} is queued or running.',
    taskWaiting:
      'Generation\x20is\x20running.\x20The\x20Agent\x20will\x20continue\x20automatically\x20when\x20all\x20tasks\x20finish.',
    taskResumed: 'Generation finished. The Agent is continuing with the remaining steps.',
    taskCompleted: 'Generation complete: the result was written to {nodeLabel}.',
    taskFailed: 'Generation failed: {nodeLabel}. {error}',
    taskCancelled: 'Generation\x20cancelled:\x20{nodeLabel}.',
    textPlacedOnCanvas: 'Placed the copy in a canvas text node.',
    textSourceMissing: 'I could not find a previous assistant draft to place on the canvas.',
    promptTransferTargetRequired:
      'Select exactly one node whose prompt should receive the copy, then try again.',
    promptTransferConfirmation:
      'The selected node prompt will be replaced with this copy. Confirm to continue.',
    promptTransferCompleted: 'Placed the copy in the selected node prompt.',
  }),
});
function normalizeRuntimeLocale(locale = getLocale()) {
  return String(locale || '')
    ['toLowerCase']()
    ['startsWith']('en')
    ? 'en-US'
    : 'zh-CN';
}
function runtimeText(key, locale2 = getLocale()) {
  const runtimeLocale = normalizeRuntimeLocale(locale2);
  return RUNTIME_TEXT[runtimeLocale]?.[key] || RUNTIME_TEXT['zh-CN'][key] || key;
}
function formatRuntimeText(index, result = {}, locale3 = getLocale()) {
  return runtimeText(index, locale3)['replace'](/\{(\w+)\}/g, (data, options) =>
    result[options] == null ? '' : String(result[options]),
  );
}
function createFailedReply(reply, args = {}) {
  return { ok: ![], status: 'failed', reply: reply, message: reply, ...args };
}
function summarizeExecution(error2, locale4 = getLocale()) {
  if (error2['ok']) return runtimeText('done', locale4);
  return error2['message'] || runtimeText('actionExecutionFailed', locale4);
}
function isSafeAction(options2 = {}) {
  return String(options2['riskLevel'] || 'safe') === 'safe';
}
function createChatReply(target, args2 = {}) {
  const reply2 = String(target || '');
  return { ok: !![], status: 'chat', reply: reply2, message: reply2, ...args2 };
}
function hasExplicitCanvasActionIntent(source = '', next = {}) {
  return hasAgentCanvasActionIntent(source, next);
}
function shouldHoldCanvasActionsForChat(response = {}, current = '', entry = {}) {
  if (response['status'] !== 'ready' && response['status'] !== 'need_confirmation') return ![];
  if (!Array['isArray'](response['plan']?.['actions']) || response['plan']['actions']['length'] === 0x0)
    return ![];
  return !hasExplicitCanvasActionIntent(current, entry);
}
function getState({ store: store, commandContext: commandContext } = {}) {
  return (
    store?.['getStateRaw']?.() ||
    store?.['getState']?.() ||
    commandContext?.['store']?.['getStateRaw']?.() ||
    commandContext?.['store']?.['getState']?.() ||
    {}
  );
}
function getProjectId(options3 = {}) {
  return String(
    options3['commandContext']?.['windowObject']?.['currentProjectId'] ||
      globalThis['window']?.['currentProjectId'] ||
      'default_v2_project',
  );
}
function getCollectionSize(list) {
  if (Array['isArray'](list)) return list['length'];
  if (list && typeof list === 'object') return Object['keys'](list)['length'];
  return 0x0;
}
function buildCanvasSnapshotDigest(options4 = {}) {
  const state = getState(options4);
  return {
    projectId: getProjectId(options4),
    nodeCount: getCollectionSize(state['nodes']),
    edgeCount: getCollectionSize(state['edges']),
    selectedNodeIds: Array['isArray'](state['selectedNodeIds'])
      ? state['selectedNodeIds']['map']((record) => String(record || ''))['filter'](Boolean)
      : [],
  };
}
function getPlainObject(payload) {
  return payload && typeof payload === 'object' && !Array['isArray'](payload) ? payload : {};
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
  assistant: assistant = null,
  projectMemoryStore: projectMemoryStore = null,
  externalToolRegistry: externalToolRegistry = null,
  skillRegistry: skillRegistry = null,
  skillAuthor: skillAuthor = null,
  saveSkill: saveSkill = null,
  deleteSkill: deleteSkill = null,
  setSkillEnabled: setSkillEnabled = null,
  loopMode: loopMode = ![],
  maxLoopSteps: maxLoopSteps = DEFAULT_MAX_LOOP_STEPS,
} = {}) {
  registerAgentDiscoveryCommands(commandRegistry);
  let handle = 0x0,
    agentContext2 = null,
    agentTaskBindingRuntime = null,
    config = null,
    scope = null,
    signal = null,
    input = 0x0;
  const map = new Map(),
    map2 = new Map();
  let runId = null;
  function localeProvider2() {
    return normalizeRuntimeLocale(localeProvider?.() || getLocale());
  }
  const agentPlanLifecycle = createAgentPlanLifecycle({
      readCanvasState: () => getState({ store: store2, commandContext: commandContext2 }),
      localeProvider: localeProvider2,
      formatText: (output) => runtimeText(output, localeProvider2()),
      isSafeAction: isSafeAction,
    }),
    agentPrecreatedNodeRuntime = createAgentPrecreatedNodeRuntime({
      plannerAvailable: () => typeof planner === 'function',
      hasCanvasActionIntent: hasExplicitCanvasActionIntent,
      readCanvasState: () => getState({ store: store2, commandContext: commandContext2 }),
      executeActions: executeActions2,
      buildExecutionOptions: buildExecutionOptions,
      isActiveRun: isActiveRun,
      sessionStore: sessionStore,
      markUnfinishedOperation: markUnfinishedOperation,
      commandContext: commandContext2,
    }),
    prepareExternalInformation = createAgentConversationCapabilityRuntime({
      sessionStore: sessionStore,
      skillRegistry: skillRegistry,
      author: skillAuthor,
      saveSkill: saveSkill,
      deleteSkill: deleteSkill,
      setSkillEnabled: setSkillEnabled,
      projectMemoryStore: projectMemoryStore,
      externalToolRegistry: externalToolRegistry,
      localeProvider: localeProvider2,
      isActiveRun: isActiveRun,
    }),
    agentConversationCanvasTransferRuntime = createAgentConversationCanvasTransferRuntime({
      sessionStore: sessionStore,
      readCanvasState: () => getState({ store: store2, commandContext: commandContext2 }),
      executeActions: executeActions2,
      handlePlan: handlePlan,
      buildExecutionGuard: buildExecutionOptions,
      isActiveRun: isActiveRun,
      createStoppedReply: createStoppedReply,
      commandContext: commandContext2,
      text: (value2) => runtimeText(value2, localeProvider2()),
    }),
    selectAssistantVersion = createAgentAssistantConversationRuntime({
      sessionStore: sessionStore,
      replyFromMessage: replyFromMessage,
      isActiveRun: isActiveRun,
      createFailedReply: createFailedReply,
      handleUserMessage: handleUserMessage,
      prepareExternalInformation: prepareExternalInformation['prepareExternalInformation'],
      createStoppedReply: createStoppedReply,
      getSignal: () => signal?.['signal'],
      startRun: () => {
        run();
        const id = 'agent-run-' + ++handle;
        return (
          sessionStore['setCurrentRun']?.({ id: id, status: 'planning', stopped: ![] }),
          id
        );
      },
      text: (value3) => runtimeText(value3, localeProvider2()),
    });
  function conversationId() {
    return String(sessionStore['getActiveConversation']?.()?.['id'] || '')['trim']();
  }
  function getCurrentTurnId(value4 = '') {
    return String(sessionStore['getCurrentRun']?.()?.['id'] || value4 || 'agent-turn-' + handle)[
      'trim'
    ]();
  }
  function run2(context, userMessage2, { channel: channel = '' } = {}) {
    const args3 = buildSelectedAgentSkillUsage({
      context: context,
      userMessage: userMessage2,
      channel: channel,
    });
    if (!args3) return null;
    const runId2 = getCurrentTurnId(),
      value5 = JSON['stringify']([
        args3['channel'],
        args3['skillSnapshots']['map']((value6) => [value6['id'], value6['match']]),
      ]);
    if (map2['get'](runId2) === value5) return args3;
    return (
      map2['set'](runId2, value5),
      map2['size'] > 0x64 && map2['delete'](map2['keys']()['next']()['value']),
      sessionStore['recordRunEvent']?.({ runId: runId2, ...args3, status: 'selected' }),
      args3
    );
  }
  function turnId2(value7 = 'agent-turn') {
    const value8 = String(sessionStore['getCurrentRun']?.()?.['id'] || '')['trim']();
    return value8 || value7 + '-' + ++handle;
  }
  function isActiveRun(value9 = '') {
    const enabled = String(value9 || '')['trim']();
    if (!enabled) return !![];
    const value10 = sessionStore['getCurrentRun']?.();
    return value10?.['id'] === enabled && value10['stopped'] !== !![];
  }
  function createStoppedReply() {
    return createFailedReply(runtimeText('runStopped', localeProvider2()), { status: 'stopped' });
  }
  function buildExecutionOptions(value11 = '') {
    const agentRunId = String(value11 || '')['trim']();
    if (!agentRunId) return {};
    return {
      agentRunId: agentRunId,
      shouldContinue: () => isActiveRun(agentRunId),
      createNodeSequenceKey: 'agent-command-plan-' + agentRunId,
    };
  }
  function run3(value12 = '') {
    const runId3 = String(value12 || '')['trim']();
    if (!runId3 || map['has'](runId3)) return map['get'](runId3) || null;
    const start = commandContext2?.['history']?.['createCheckpoint']?.() || null,
      value13 = {
        runId: runId3,
        conversationId: conversationId(),
        projectId: getProjectId({ commandContext: commandContext2 }),
        start: start,
        end: start,
      };
    return (map['set'](runId3, value13), value13);
  }
  function run4(value14 = '') {
    const args4 = run3(value14);
    if (!args4) return null;
    return (
      (args4['end'] = commandContext2?.['history']?.['createCheckpoint']?.() || args4['end']),
      args4['start']?.['id'] &&
        args4['end']?.['id'] &&
        args4['start']['id'] !== args4['end']['id'] &&
        (runId = { ...args4 }),
      args4
    );
  }
  async function executeActions2(list2 = [], value15 = {}) {
    const list3 = Array['isArray'](list2) ? list2 : [],
      id2 = String(
        value15['agentRunId'] || sessionStore['getCurrentRun']?.()?.['id'] || 'agent-run-' + handle,
      )['trim'](),
      step = Math['max'](0x0, Math['trunc'](Number(sessionStore['getCurrentRun']?.()?.['step'] || 0x0)));
    run3(id2);
    const list4 = list3['map']((value16, value17) => {
        const fingerprint = fingerprintAgentAction(value16),
          value18 = {
            id: id2 + ':' + step + ':' + value17 + ':' + fingerprint + ':' + ++input,
            runId: id2,
            conversationId: conversationId(),
            projectId: getProjectId({ commandContext: commandContext2 }),
            step: step,
            commandId: String(value16?.['type'] || value16?.['commandId'] || '')['trim'](),
            fingerprint: fingerprint,
            status: 'running',
            startedAt: Date['now'](),
          };
        return (sessionStore['upsertOperation']?.(value18), value18);
      }),
      executeActions3 = await executeActions(list3, value15),
      value19 = Array['isArray'](executeActions3?.['results']) ? executeActions3['results'] : [];
    return (
      list4['forEach']((args5, value20) => {
        const ok = value19[value20] || null,
          action = list3[value20] || {},
          createdNodeIds = ok
            ? deriveAgentRuntimeProvenance({
                action: action,
                execution: {
                  ok: ok['ok'] === !![],
                  status: ok['ok'] === !![] ? 'success' : 'failed',
                  results: [ok],
                },
              })
            : { createdNodeIds: [], createdEdgeIds: [] };
        sessionStore['upsertOperation']?.({
          ...args5,
          status: ok ? (ok['ok'] === !![] ? 'success' : 'failed') : 'skipped',
          ok: ok ? ok['ok'] === !![] : null,
          errorCode: String(ok?.['errorCode'] || ''),
          verificationStatus: String(ok?.['verification']?.['status'] || ''),
          repairAttempts: Math['max'](
            0x0,
            Math['min'](0x1, Math['trunc'](Number(ok?.['verification']?.['attempts'] || 0x0))),
          ),
          createdNodeIds: createdNodeIds['createdNodeIds'],
          createdEdgeIds: createdNodeIds['createdEdgeIds'],
          completedAt: Date['now'](),
        });
      }),
      run4(id2),
      executeActions3
    );
  }
  function run5(
    id3,
    { taskMessages: taskMessages = [], recoveryCheckpoint: recoveryCheckpoint = null } = {},
  ) {
    const list5 = agentTaskBindingRuntime['getPending'](id3['runId']);
    if (list5['length'] === 0x0) return null;
    const waitingTaskBindingIds = (sessionStore['getTaskBindings']?.() || [])['filter'](
        (value21) => value21['turnId'] === id3['runId'],
      ),
      value22 = {
        ...id3,
        pendingKind: 'task_wait',
        waitingTaskBindingIds: waitingTaskBindingIds['map']((value23) => value23['id']),
        ...(recoveryCheckpoint ? { taskRecoveryCheckpoint: recoveryCheckpoint } : {}),
      };
    (sessionStore['setPendingLoopRun']?.(value22),
      markUnfinishedOperation(id3['originalMessage']),
      sessionStore['setCurrentRun']?.({
        id: id3['runId'],
        status: 'waiting_tasks',
        stopped: ![],
        step: id3['step'],
      }),
      sessionStore['recordRunEvent']?.({
        runId: id3['runId'],
        type: 'task.waiting',
        status: 'waiting_tasks',
        step: id3['step'],
        message: runtimeText('taskWaiting', localeProvider2()),
      }));
    const content = runtimeText('taskWaiting', localeProvider2());
    return (
      sessionStore['pushHistory']?.({ role: 'assistant', status: 'waiting_tasks', content: content }),
      { ok: !![], status: 'waiting_tasks', reply: content, taskMessages: taskMessages }
    );
  }
  function onBindingsChanged() {
    if (scope) return;
    const runId4 = sessionStore['getPendingLoopRun']?.();
    if (runId4?.['pendingKind'] !== 'task_wait' || !isActiveRun(runId4['runId'])) return;
    const enabled2 = agentTaskBindingRuntime['getSettlement'](runId4['waitingTaskBindingIds'] || []);
    if (!enabled2['settled']) return;
    (sessionStore['clearPendingLoopRun']?.(),
      (scope = Promise['resolve']()
        ['then'](async () => {
          if (!isActiveRun(runId4['runId']) || !run6(runId4)) return null;
          const { allSucceeded: allSucceeded } = enabled2;
          sessionStore['recordRunEvent']?.({
            runId: runId4['runId'],
            type: 'task.resumed',
            status: allSucceeded ? 'planning' : 'failed',
            step: runId4['step'],
            message: runtimeText('taskResumed', localeProvider2()),
          });
          if (!allSucceeded) {
            const message = enabled2['failureMessage'],
              args6 = runId4['taskRecoveryCheckpoint'];
            if (args6?.['action'] && args6?.['loopState'])
              return run7(
                { ...args6['loopState'], runId: runId4['runId'] },
                args6['action'],
                {
                  ok: ![],
                  status: 'failed',
                  errorCode: 'ASYNC_TASK_FAILED',
                  message: message,
                  results: [{ ok: ![], errorCode: 'ASYNC_TASK_FAILED', message: message }],
                  raw: { result: { failedIndex: 0x0 } },
                },
              );
            return run8(runId4, message);
          }
          return (
            run(),
            run9({
              ...runId4,
              pendingKind: '',
              waitingTaskBindingIds: [],
              taskRecoveryCheckpoint: null,
              validationFeedback: [
                ...(runId4['validationFeedback'] || []),
                {
                  step: runId4['step'],
                  commandId: 'generation.run',
                  status: 'tasks_completed',
                  ok: !![],
                  message: runtimeText('taskResumed', localeProvider2()),
                },
              ]['slice'](-0x4),
            })
          );
        })
        ['catch']((error3) => {
          isActiveRun(runId4['runId']) &&
            run8(
              runId4,
              String(error3?.['message'] || runtimeText('actionExecutionFailed', localeProvider2())),
            );
        })
        ['finally'](() => {
          scope = null;
        })));
  }
  ((agentTaskBindingRuntime = createAgentTaskBindingRuntime({
    store: store2,
    sessionStore: sessionStore,
    readCanvasState: () => getState({ store: store2, commandContext: commandContext2 }),
    getActiveConversationId: conversationId,
    getCurrentTurnId: getCurrentTurnId,
    formatText: (value24, value25) => formatRuntimeText(value24, value25, localeProvider2()),
    onBindingsChanged: onBindingsChanged,
  })),
    agentTaskBindingRuntime['start']());
  const id4 = sessionStore['getPendingLoopRun']?.();
  id4?.['pendingKind'] === 'task_wait' &&
    run6(id4) &&
    (sessionStore['setCurrentRun']?.({
      id: id4['runId'],
      status: 'waiting_tasks',
      stopped: ![],
      step: id4['step'],
    }),
    agentTaskBindingRuntime['sync'](getState({ store: store2, commandContext: commandContext2 })));
  function markUnfinishedOperation(lastPlanSummary) {
    sessionStore['markUnfinishedOperation']?.({
      lastPlanSummary: lastPlanSummary,
      lastCanvasSnapshotDigest: buildCanvasSnapshotDigest({ store: store2, commandContext: commandContext2 }),
    });
  }
  function run10() {
    sessionStore['clearUnfinishedOperation']?.();
  }
  function run11(value26 = 'superseded') {
    selectAssistantVersion['stop']();
    const enabled3 = signal;
    signal = null;
    if (!enabled3 || enabled3['signal']['aborted']) return;
    try {
      enabled3['abort'](value26);
    } catch {
      enabled3['abort']();
    }
  }
  function run() {
    return (
      run11('superseded'),
      (signal = typeof AbortController === 'function' ? new AbortController() : null),
      signal
    );
  }
  function run12() {
    return { conversationId: conversationId(), projectId: getProjectId({ commandContext: commandContext2 }) };
  }
  function run6(options5 = {}) {
    const value27 = run12();
    return (
      String(options5['conversationId'] || '') === value27['conversationId'] &&
      String(options5['projectId'] || '') === value27['projectId']
    );
  }
  function run13({ runId: runId5, message: message2, plannerExtra: plannerExtra = {} } = {}) {
    return {
      runId: runId5,
      originalMessage: String(message2 || ''),
      plannerExtra: { ...plannerExtra },
      ...run12(),
      step: 0x0,
      toolResults: [],
      validationFeedback: [],
      runtimeProvenance: { createdNodeIds: [], createdEdgeIds: [] },
      actionBudget: createAgentLoopActionBudget(message2),
      completedFingerprints: [],
      failedFingerprints: {},
      validationFailureCounts: {},
      noActionRetryCount: 0x0,
      disclosedCommandIds: [],
      disclosedModelIds: [],
    };
  }
  function run14(step2, action2, execution) {
    const commandIds = deriveAgentCapabilityDiscovery({ action: action2, execution: execution }),
      disclosedCommandIds = [...new Set([...(step2['disclosedCommandIds'] || []), ...commandIds['commandIds']])],
      disclosedModelIds = [...new Set([...(step2['disclosedModelIds'] || []), ...commandIds['modelIds']])];
    return (
      (disclosedCommandIds['length'] !== (step2['disclosedCommandIds'] || [])['length'] ||
        disclosedModelIds['length'] !== (step2['disclosedModelIds'] || [])['length']) &&
        sessionStore['recordTrace']?.({
          type: 'agent_capability_discovered',
          step: step2['step'],
          sourceCommandId: action2['type'],
          commandIds: commandIds['commandIds'],
          modelIds: commandIds['modelIds'],
        }),
      { ...step2, disclosedCommandIds: disclosedCommandIds, disclosedModelIds: disclosedModelIds }
    );
  }
  function loopState(runtimeProvenance = {}) {
    const precreatedNode = normalizeAgentPrecreatedNode(runtimeProvenance['precreatedNode']);
    return {
      enabled: !![],
      step: Number(runtimeProvenance['step'] || 0x0),
      maxSteps: Math['max'](0x1, Number(maxLoopSteps || DEFAULT_MAX_LOOP_STEPS)),
      toolResults: Array['isArray'](runtimeProvenance['toolResults']) ? runtimeProvenance['toolResults'] : [],
      validationFeedback: Array['isArray'](runtimeProvenance['validationFeedback'])
        ? runtimeProvenance['validationFeedback']
        : [],
      runtimeProvenance: runtimeProvenance['runtimeProvenance'] || {},
      ...(precreatedNode ? { precreatedNode: precreatedNode } : {}),
      ...(runtimeProvenance['recoveryInstruction']
        ? { recoveryInstruction: String(runtimeProvenance['recoveryInstruction']) }
        : {}),
      ...(runtimeProvenance['clarificationAnswer']
        ? { clarificationAnswer: String(runtimeProvenance['clarificationAnswer']) }
        : {}),
      instruction:
        'Return at most one canvas action. After a tool result, decide the next single action or finish with actions []. Never repeat a successful action.',
    };
  }
  function run8(id5, content2, value28 = {}) {
    return (
      sessionStore['clearPendingLoopRun']?.(),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['clearPendingClarification']?.(),
      run10(),
      sessionStore['pushHistory']?.({ role: 'assistant', status: 'failed', content: content2 }),
      isActiveRun(id5['runId']) &&
        sessionStore['setCurrentRun']?.({ id: id5['runId'], status: 'failed', stopped: ![] }),
      createFailedReply(content2, value28)
    );
  }
  function run15(loopState2, value29, validation = {}) {
    const plannerFailureMessage = String(value29 || runtimeText('plannerRetryAvailable', localeProvider2())),
      plannerDiagnostic = buildAgentPlannerDiagnostic({
        loopState: loopState2,
        validation: validation['validation'] || null,
        cause: validation['cause'] || '',
        reason: validation['diagnosticReason'] || '',
        locale: localeProvider2(),
      }),
      recovery = buildAgentPlannerRecovery({
        originalMessage: loopState2['originalMessage'],
        locale: localeProvider2(),
      }),
      value30 = {
        ...loopState2,
        pendingKind: 'planner_retry',
        plannerFailureMessage: plannerFailureMessage,
        plannerDiagnostic: plannerDiagnostic,
      };
    return (
      sessionStore['setPendingLoopRun']?.(value30),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['clearPendingClarification']?.(),
      markUnfinishedOperation(loopState2['originalMessage']),
      sessionStore['pushHistory']?.({
        role: 'assistant',
        status: 'failed',
        content: plannerFailureMessage,
        diagnostic: plannerDiagnostic,
      }),
      isActiveRun(loopState2['runId']) &&
        sessionStore['setCurrentRun']?.({
          id: loopState2['runId'],
          status: 'failed',
          stopped: ![],
          step: loopState2['step'],
        }),
      sessionStore['recordRunEvent']?.({
        runId: loopState2['runId'],
        type: 'planner.retry_available',
        status: 'failed',
        step: loopState2['step'],
        errorCode: plannerDiagnostic['errorCode'],
        message: plannerFailureMessage,
      }),
      createFailedReply(plannerFailureMessage, { retryable: !![], diagnostic: plannerDiagnostic, recovery: recovery })
    );
  }
  function run7(step3, loopAction, execution2) {
    const reply3 = String(execution2?.['message'] || runtimeText('actionExecutionFailed', localeProvider2())),
      value31 = { status: 'ready', reply: reply3, actions: [loopAction], requiresConfirmation: ![] },
      { recovery: recovery2, retryPlan: retryPlan } = agentPlanLifecycle['recover'](execution2, value31),
      diagnostic = buildAgentExecutionDiagnostic({
        execution: execution2,
        recovery: recovery2,
        step: step3['step'],
        completedSteps: (step3['toolResults'] || [])['filter']((response2) => response2?.['ok'] === !![])[
          'length'
        ],
        locale: localeProvider2(),
      });
    return (
      sessionStore['clearPendingLoopRun']?.(),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['clearPendingClarification']?.(),
      recovery2
        ? (sessionStore['setPendingRecovery']?.({
            plan: retryPlan,
            recovery: recovery2,
            loopCheckpoint: { ...step3, pendingKind: '', pendingValidatedPlan: null },
            loopAction: loopAction,
          }),
          markUnfinishedOperation(agentPlanLifecycle['describe']({ recovery: recovery2 })))
        : (sessionStore['clearPendingRecovery']?.(), run10()),
      sessionStore['pushHistory']?.({
        role: 'assistant',
        status: 'failed',
        content: reply3,
        execution: execution2,
        recovery: recovery2,
        diagnostic: diagnostic,
      }),
      isActiveRun(step3['runId']) &&
        sessionStore['setCurrentRun']?.({
          id: step3['runId'],
          status: 'failed',
          stopped: ![],
          step: step3['step'],
        }),
      sessionStore['recordRunEvent']?.({
        runId: step3['runId'],
        type: 'action.recovery_available',
        status: 'failed',
        step: step3['step'],
        commandId: loopAction?.['type'],
        errorCode: diagnostic['errorCode'],
        message: reply3,
      }),
      createFailedReply(reply3, {
        execution: execution2,
        diagnostic: diagnostic,
        ...(recovery2 ? { recovery: recovery2 } : {}),
      })
    );
  }
  function run16(turnId3, action3, execution3, { confirmed: confirmed = ![] } = {}) {
    const taskMessages2 = agentTaskBindingRuntime['registerExecution'](execution3, { turnId: turnId3['runId'] }),
      fingerprintAgentAction2 = fingerprintAgentAction(action3),
      agentToolResult = buildAgentToolResult({ step: turnId3['step'], action: action3, execution: execution3 });
    let step4 = {
      ...turnId3,
      pendingKind: '',
      pendingValidatedPlan: null,
      precreatedNode:
        execution3['ok'] === !![] && doesActionConsumePrecreatedNode(action3, turnId3['precreatedNode'])
          ? null
          : turnId3['precreatedNode'] || null,
      step: turnId3['step'] + 0x1,
      toolResults: [...(turnId3['toolResults'] || []), agentToolResult],
      runtimeProvenance: deriveAgentRuntimeProvenance({
        action: action3,
        execution: execution3,
        previous: turnId3['runtimeProvenance'],
      }),
      actionBudget: recordAgentLoopActionBudgetResult(turnId3['actionBudget'], action3, execution3),
      completedFingerprints: execution3['ok']
        ? [...(turnId3['completedFingerprints'] || []), fingerprintAgentAction2]
        : turnId3['completedFingerprints'] || [],
      failedFingerprints: execution3['ok']
        ? Object['fromEntries'](
            Object['entries'](turnId3['failedFingerprints'] || {})['filter'](
              ([value32]) => value32 !== fingerprintAgentAction2,
            ),
          )
        : {
            ...(turnId3['failedFingerprints'] || {}),
            [fingerprintAgentAction2]: Number(turnId3['failedFingerprints']?.[fingerprintAgentAction2] || 0x0) + 0x1,
          },
    };
    return (
      (step4 = run14(step4, action3, execution3)),
      sessionStore['recordTrace']?.({
        type: 'agent_loop_tool_result',
        step: step4['step'],
        commandId: action3['type'],
        ok: execution3['ok'] === !![],
        ...(confirmed ? { confirmed: !![] } : {}),
      }),
      execution3['ok'] === !![] &&
        (sessionStore['setPendingLoopRun']?.({ ...step4, pendingKind: 'interrupted' }),
        markUnfinishedOperation(step4['originalMessage'])),
      {
        nextLoop: step4,
        taskMessages: taskMessages2,
        recoveryCheckpoint: {
          loopState: { ...turnId3, pendingKind: '', pendingValidatedPlan: null },
          action: action3,
        },
      }
    );
  }
  async function run17({
    checkpoint: checkpoint = null,
    displayMessage: displayMessage = '',
    recoveryInstruction: recoveryInstruction = '',
  } = {}) {
    const args7 = checkpoint || sessionStore['getPendingLoopRun']?.();
    if (args7?.['pendingKind'] !== 'planner_retry' || !run6(args7))
      return createFailedReply(runtimeText('noPendingRecovery', localeProvider2()));
    const id6 = 'agent-run-' + ++handle;
    return (
      run(),
      sessionStore['clearPendingLoopRun']?.(),
      sessionStore['setCurrentRun']?.({ id: id6, status: 'planning', stopped: ![] }),
      displayMessage && sessionStore['pushHistory']?.({ role: 'user', content: displayMessage }),
      run9({
        ...args7,
        runId: id6,
        recoveryInstruction: String(recoveryInstruction || args7['recoveryInstruction'] || '')['trim'](),
        pendingKind: '',
        plannerFailureMessage: '',
        plannerDiagnostic: null,
        noActionRetryCount: 0x0,
      })
    );
  }
  async function resumeInterruptedRun({ displayMessage: displayMessage = '' } = {}) {
    const checkpoint2 = sessionStore['getPendingLoopRun']?.();
    if (!checkpoint2 || !run6(checkpoint2))
      return createFailedReply(runtimeText('noPendingRecovery', localeProvider2()));
    if (checkpoint2['pendingKind'] === 'planner_retry')
      return run17({ checkpoint: checkpoint2, displayMessage: displayMessage });
    if (['clarification', 'task_wait']['includes'](String(checkpoint2['pendingKind'] || '')))
      return createFailedReply(runtimeText('noPendingRecovery', localeProvider2()));
    const id7 = 'agent-run-' + ++handle;
    return (
      run(),
      sessionStore['clearPendingLoopRun']?.(),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['setCurrentRun']?.({
        id: id7,
        status: 'planning',
        stopped: ![],
        step: checkpoint2['step'],
      }),
      displayMessage && sessionStore['pushHistory']?.({ role: 'user', content: displayMessage }),
      sessionStore['pushHistory']?.({
        role: 'assistant',
        status: 'planning',
        content: runtimeText('runResumed', localeProvider2()),
      }),
      run9({
        ...checkpoint2,
        runId: id7,
        pendingKind: '',
        pendingValidatedPlan: null,
        validationFeedback: Array['isArray'](checkpoint2['validationFeedback'])
          ? checkpoint2['validationFeedback']
          : [],
        validationFailureCounts: checkpoint2['validationFailureCounts'] || {},
      })
    );
  }
  function discardInterruptedRun() {
    const enabled4 = sessionStore['getPendingLoopRun']?.(),
      enabled5 = sessionStore['getPendingPlan']?.(),
      enabled6 = sessionStore['getPendingRecovery']?.(),
      enabled7 = sessionStore['getPendingClarification']?.(),
      value33 = sessionStore['getActiveConversation']?.();
    if (
      !enabled4 &&
      !enabled5 &&
      !enabled6 &&
      !enabled7 &&
      value33?.['hasUnfinishedOperation'] !== !![]
    )
      return createFailedReply(runtimeText('noInterruptedRun', localeProvider2()));
    run11('discarded');
    const run18 = sessionStore['stopCurrentRun']?.() || null;
    (sessionStore['clearPendingLoopRun']?.(),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['clearPendingRecovery']?.(),
      sessionStore['clearPendingClarification']?.(),
      run10());
    const content3 = runtimeText('runDiscarded', localeProvider2());
    return (
      sessionStore['pushHistory']?.({ role: 'assistant', status: 'discarded', content: content3 }),
      { ok: !![], status: 'discarded', reply: content3, run: run18 }
    );
  }
  function undoLastAgentRun() {
    const expectedHead = runId,
      enabled8 = Boolean(
        expectedHead &&
        expectedHead['conversationId'] === conversationId() &&
        expectedHead['projectId'] === getProjectId({ commandContext: commandContext2 }),
      ),
      list6 = agentTaskBindingRuntime['getPending'](expectedHead?.['runId']);
    if (
      !enabled8 ||
      !expectedHead?.['start']?.['id'] ||
      !expectedHead?.['end']?.['id'] ||
      list6['length'] > 0x0
    )
      return createFailedReply(runtimeText('noUndoableRun', localeProvider2()));
    const errorCode = commandContext2?.['history']?.['undoToCheckpoint']?.(expectedHead['start'], {
      expectedHead: expectedHead['end'],
    });
    if (errorCode?.['ok'] !== !![])
      return createFailedReply(runtimeText('noUndoableRun', localeProvider2()), {
        errorCode: errorCode?.['errorCode'] || 'AGENT_UNDO_UNAVAILABLE',
      });
    for (const response3 of sessionStore['getOperationLedger']?.() || []) {
      if (response3['runId'] !== expectedHead['runId'] || response3['status'] !== 'success') continue;
      sessionStore['upsertOperation']?.({ ...response3, status: 'undone' });
    }
    return (
      sessionStore['recordRunEvent']?.({
        runId: expectedHead['runId'],
        type: 'run.undone',
        status: 'undone',
        message: runtimeText('runUndone', localeProvider2()),
      }),
      sessionStore['pushHistory']?.({
        role: 'assistant',
        status: 'success',
        content: runtimeText('runUndone', localeProvider2()),
      }),
      (runId = null),
      {
        ok: !![],
        status: 'undone',
        reply: runtimeText('runUndone', localeProvider2()),
        undone: errorCode['undone'],
      }
    );
  }
  function run19(toolResults, plan = {}) {
    const value34 = Object['values'](toolResults['failedFingerprints'] || {})['some'](
      (value35) => Number(value35 || 0x0) > 0x0,
    );
    if (value34) {
      const error4 = [...(toolResults['toolResults'] || [])]
        ['reverse']()
        ['find']((response4) => response4?.['ok'] === ![]);
      return run8(
        toolResults,
        String(error4?.['message'] || runtimeText('actionExecutionFailed', localeProvider2())),
        { toolResults: toolResults['toolResults'] },
      );
    }
    const content4 = String(plan['reply'] || runtimeText('done', localeProvider2())),
      value36 = toolResults['toolResults']['length'] > 0x0,
      status = value36 ? 'success' : 'chat';
    return (
      sessionStore['clearPendingLoopRun']?.(),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['clearPendingClarification']?.(),
      run10(),
      sessionStore['pushHistory']?.({ role: 'assistant', status: status, content: content4 }),
      isActiveRun(toolResults['runId']) &&
        sessionStore['setCurrentRun']?.({ id: toolResults['runId'], status: status, stopped: ![] }),
      {
        ok: !![],
        status: status,
        reply: content4,
        message: content4,
        plan: plan,
        toolResults: toolResults['toolResults'],
      }
    );
  }
  async function run9(id8) {
    if (!run6(id8)) return run8(id8, runtimeText('loopResumeExpired', localeProvider2()));
    const value37 = Math['max'](0x1, Math['trunc'](Number(maxLoopSteps || DEFAULT_MAX_LOOP_STEPS)));
    while (id8['step'] <= value37) {
      if (!isActiveRun(id8['runId'])) return createStoppedReply();
      sessionStore['setCurrentRun']?.({
        id: id8['runId'],
        status: 'planning',
        stopped: ![],
        step: id8['step'],
      });
      let status2;
      try {
        ((status2 = await run20(id8['originalMessage'], {
          ...id8['plannerExtra'],
          loopState: loopState(id8),
          signal: signal?.['signal'],
          disclosedCommandIds: id8['disclosedCommandIds'],
          disclosedModelIds: id8['disclosedModelIds'],
        })),
          (id8['plannerNetworkRetryCount'] = 0x0));
      } catch (error5) {
        if (!isActiveRun(id8['runId']) || signal?.['signal']?.['aborted']) return createStoppedReply();
        const value38 = Number(id8['plannerNetworkRetryCount'] || 0x0);
        if (isTransientPlannerNetworkError(error5) && value38 < PLANNER_NETWORK_RETRY_LIMIT) {
          ((id8['plannerNetworkRetryCount'] = value38 + 0x1),
            sessionStore['recordTrace']?.({
              type: 'agent_loop_planner_network_retry',
              step: id8['step'],
              attempt: id8['plannerNetworkRetryCount'],
            }));
          continue;
        }
        return run15(id8, runtimeText('plannerRetryAvailable', localeProvider2()), {
          cause: String(error5?.['message'] || runtimeText('plannerFailed', localeProvider2())),
        });
      }
      if (!isActiveRun(id8['runId'])) return createStoppedReply();
      const actionTypes = Array['isArray'](status2?.['actions']) ? status2['actions'] : [];
      if (
        actionTypes['length'] === 0x0 &&
        !['need_clarification', 'failed']['includes'](status2?.['status'])
      ) {
        const hasActionIntent = hasExplicitCanvasActionIntent(
            id8['originalMessage'],
            id8['plannerExtra'],
          ),
          errorCode2 = verifyAgentLoopCompletionEvidence({
            userMessage: id8['originalMessage'],
            plannerExtra: id8['plannerExtra'],
            runtimeProvenance: id8['runtimeProvenance'],
            canvasState: getState({ store: store2, commandContext: commandContext2 }),
          });
        if (hasActionIntent && errorCode2['ok'] === ![]) {
          const value39 = 'completion:' + (errorCode2['requestedNodeType'] || 'unknown'),
            retryCount = Number(id8['validationFailureCounts']?.[value39] || 0x0) + 0x1,
            message3 = runtimeText('loopCompletionEvidenceCorrection', localeProvider2());
          if (retryCount <= 0x2) {
            ((id8['validationFailureCounts'] = {
              ...id8['validationFailureCounts'],
              [value39]: retryCount,
            }),
              (id8['validationFeedback'] = [
                ...(id8['validationFeedback'] || []),
                {
                  step: id8['step'],
                  commandId: 'agent.plan',
                  status: 'validation_failed',
                  ok: ![],
                  errorCode: errorCode2['errorCode'],
                  message: message3,
                  details: errorCode2,
                },
              ]['slice'](-0x4)),
              sessionStore['recordTrace']?.({
                type: 'agent_loop_completion_evidence_retry',
                step: id8['step'],
                retryCount: retryCount,
                requestedNodeType: errorCode2['requestedNodeType'],
              }));
            continue;
          }
          return run15(id8, runtimeText('plannerReturnedNoAction', localeProvider2()), {
            diagnosticReason: errorCode2['errorCode'],
          });
        }
        if (id8['toolResults']['length'] > 0x0 || status2?.['status'] === 'chat' || !hasActionIntent)
          return run19(id8, status2);
        if (
          shouldRetryAgentLoopNoop({
            hasActionIntent: hasActionIntent,
            toolResultCount: id8['toolResults']['length'],
            retryCount: id8['noActionRetryCount'],
            status: status2?.['status'],
          })
        ) {
          ((id8['noActionRetryCount'] = Number(id8['noActionRetryCount'] || 0x0) + 0x1),
            sessionStore['recordTrace']?.({
              type: 'agent_loop_no_action_retry',
              step: id8['step'],
              reply: String(status2?.['reply'] || ''),
            }));
          continue;
        }
        return run15(id8, runtimeText('plannerReturnedNoAction', localeProvider2()), {
          diagnosticReason: 'no_action',
        });
      }
      if (id8['step'] >= value37 && actionTypes['length'] > 0x0)
        return run8(id8, runtimeText('loopLimitReached', localeProvider2()));
      actionTypes['length'] > 0x1 &&
        sessionStore['recordTrace']?.({
          type: 'agent_loop_multiple_actions_compacted',
          step: id8['step'],
          actionTypes: actionTypes['map']((value40) => value40?.['type']),
        });
      const debugTrace = [],
        validate = (value41) =>
          validatePlan(value41, {
            commandRegistry: commandRegistry,
            commandContext: commandContext2,
            agentContext: agentContext2,
            userMessage: id8['originalMessage'],
            runtimeProvenance: id8['runtimeProvenance'],
            traceRecorder: (value42) => {
              (debugTrace['push'](value42), sessionStore['recordTrace']?.(value42));
            },
          }),
        agentLoopPlanAction = selectAgentLoopPlanAction({
          rawPlan: status2,
          actions: actionTypes,
          validate: validate,
          completedFingerprints: id8['completedFingerprints'],
          fingerprint: fingerprintAgentAction,
          onCompletedPrefix: (commandId, actionIndex) =>
            sessionStore['recordTrace']?.({
              type: 'agent_loop_completed_prefix_skipped',
              step: id8['step'],
              commandId: commandId['type'],
              actionIndex: actionIndex,
            }),
        }),
        value43 = agentLoopPlanAction['plan'],
        validation2 = agentLoopPlanAction['validation'];
      if (!validation2['ok']) {
        if (validation2['errorCode'] === 'AGENT_PLAN_FAILED')
          return run15(id8, runtimeText('plannerRetryAvailable', localeProvider2()), {
            validation: validation2,
          });
        const enabled9 = value43?.['actions']?.[0x0] || null,
          value44 = !enabled9 && validation2['errorCode'] === 'AGENT_PLAN_INVALID',
          enabled10 = ['UNKNOWN_AGENT_ACTION', 'DEFERRED_AGENT_ACTION', 'BLOCKED_AGENT_ACTION']['includes'](
            String(validation2['errorCode'] || ''),
          );
        if ((enabled9 || value44) && !enabled10) {
          const commandId2 = enabled9?.['type'] || 'agent.plan',
            value45 = enabled9
              ? fingerprintAgentAction(enabled9)
              : 'agent.plan:' + String(status2?.['status'] || 'unknown') + ':' + validation2['errorCode'],
            count = Number(id8['validationFailureCounts']?.[value45] || 0x0) + 0x1;
          if (count <= 0x2) {
            ((id8['validationFailureCounts'] = {
              ...id8['validationFailureCounts'],
              [value45]: count,
            }),
              (id8['validationFeedback'] = [
                ...(id8['validationFeedback'] || []),
                {
                  step: id8['step'],
                  commandId: commandId2,
                  status: 'validation_failed',
                  ok: ![],
                  errorCode: validation2['errorCode'],
                  message: validation2['message'],
                },
              ]['slice'](-0x4)),
              sessionStore['recordTrace']?.({
                type: 'agent_loop_validation_retry',
                step: id8['step'],
                commandId: commandId2,
                errorCode: validation2['errorCode'],
              }));
            continue;
          }
          return run15(id8, runtimeText('plannerRetryAvailable', localeProvider2()), {
            validation: validation2,
          });
        }
        return run8(id8, validation2['message'], { validation: validation2 });
      }
      if (
        id8['step'] === 0x0 &&
        shouldHoldCanvasActionsForChat(validation2, id8['originalMessage'], id8['plannerExtra'])
      )
        return run19(id8, {
          ...validation2['plan'],
          status: 'chat',
          actions: [],
          reply: validation2['plan']['reply'] || runtimeText('chatIntentRequired', localeProvider2()),
        });
      if (validation2['status'] === 'chat') return run19(id8, validation2['plan']);
      if (validation2['status'] === 'need_clarification') {
        if (
          shouldUseCreativeDefaults({
            userMessage: id8['originalMessage'],
            plan: validation2['plan'],
            agentContext: agentContext2,
            toolResultCount: id8['toolResults']['length'],
          })
        ) {
          const value46 = 'agent.plan:unnecessary_clarification',
            retryCount2 = Number(id8['validationFailureCounts']?.[value46] || 0x0) + 0x1;
          if (retryCount2 <= 0x2) {
            ((id8['validationFailureCounts'] = {
              ...id8['validationFailureCounts'],
              [value46]: retryCount2,
            }),
              (id8['clarificationAnswer'] = runtimeText('creativeDefaultsInstruction', localeProvider2())),
              (id8['validationFeedback'] = [
                ...(id8['validationFeedback'] || []),
                {
                  step: id8['step'],
                  commandId: 'agent.plan',
                  status: 'validation_failed',
                  ok: ![],
                  errorCode: 'UNNECESSARY_CLARIFICATION',
                  message: id8['clarificationAnswer'],
                },
              ]['slice'](-0x4)),
              sessionStore['recordTrace']?.({
                type: 'agent_loop_clarification_replaced_with_defaults',
                step: id8['step'],
                retryCount: retryCount2,
              }));
            continue;
          }
        }
        const value47 = { ...id8, pendingKind: 'clarification' },
          value48 = {
            ...validation2['plan'],
            originalMessage: id8['originalMessage'],
            targetKind: id8['plannerExtra']?.['targetKind'] || '',
            inputRefs: id8['plannerExtra']?.['inputRefs'] || [],
          };
        return (
          sessionStore['setPendingLoopRun']?.(value47),
          sessionStore['setPendingClarification']?.(value48),
          markUnfinishedOperation(validation2['plan']['question'] || validation2['plan']['reply']),
          sessionStore['pushHistory']?.({
            role: 'assistant',
            status: 'need_clarification',
            content: validation2['plan']['question'],
          }),
          {
            ok: !![],
            status: 'need_clarification',
            reply: validation2['plan']['reply'] || validation2['plan']['question'],
            question: validation2['plan']['question'],
            options: validation2['plan']['options'],
            plan: validation2['plan'],
          }
        );
      }
      const commandId3 = validation2['plan']['actions'][0x0],
        fingerprintAgentAction3 = fingerprintAgentAction(commandId3);
      if (id8['completedFingerprints']['includes'](fingerprintAgentAction3)) {
        const value49 = 'completed:' + fingerprintAgentAction3,
          repeatCount = Number(id8['validationFailureCounts']?.[value49] || 0x0) + 0x1;
        if (repeatCount <= 0x2) {
          const message4 = runtimeText('loopRepeatedActionCorrection', localeProvider2());
          ((id8['validationFailureCounts'] = {
            ...id8['validationFailureCounts'],
            [value49]: repeatCount,
          }),
            (id8['validationFeedback'] = [
              ...(id8['validationFeedback'] || []),
              {
                step: id8['step'],
                commandId: commandId3['type'],
                status: 'validation_failed',
                ok: ![],
                errorCode: 'ACTION_ALREADY_COMPLETED',
                message: message4,
              },
            ]['slice'](-0x4)),
            sessionStore['recordTrace']?.({
              type: 'agent_loop_repeated_action_corrected',
              step: id8['step'],
              commandId: commandId3['type'],
              repeatCount: repeatCount,
            }));
          continue;
        }
        return run8(id8, runtimeText('loopRepeatedAction', localeProvider2()));
      }
      const errorCode3 = validateAgentLoopActionBudget(commandId3, id8['actionBudget']);
      if (!errorCode3['ok']) {
        const value50 = 'budget:' + errorCode3['errorCode'],
          count2 = Number(id8['validationFailureCounts']?.[value50] || 0x0) + 0x1,
          message5 = runtimeText('loopDuplicateBudgetCorrection', localeProvider2());
        ((id8['validationFailureCounts'] = {
          ...id8['validationFailureCounts'],
          [value50]: count2,
        }),
          (id8['validationFeedback'] = [
            ...(id8['validationFeedback'] || []),
            {
              step: id8['step'],
              commandId: commandId3['type'],
              status: 'validation_failed',
              ok: ![],
              errorCode: errorCode3['errorCode'],
              message: message5,
              details: errorCode3,
            },
          ]['slice'](-0x4)),
          sessionStore['recordTrace']?.({
            type: 'agent_loop_action_budget_rejected',
            step: id8['step'],
            commandId: commandId3['type'],
            ...errorCode3,
          }));
        if (count2 <= 0x2) continue;
        return run15(id8, runtimeText('plannerRetryAvailable', localeProvider2()), {
          validation: { errorCode: errorCode3['errorCode'], plan: { actions: [commandId3] } },
        });
      }
      if (validation2['status'] === 'need_confirmation') {
        const pendingValidatedPlan = agentPlanLifecycle['review'](validation2['plan'], { debugTrace: debugTrace }),
          value51 = { ...id8, pendingKind: 'confirmation', pendingValidatedPlan: pendingValidatedPlan };
        return (
          sessionStore['setPendingLoopRun']?.(value51),
          sessionStore['setPendingPlan']?.(pendingValidatedPlan),
          markUnfinishedOperation(agentPlanLifecycle['describe']({ plan: pendingValidatedPlan })),
          sessionStore['pushHistory']?.({
            role: 'assistant',
            status: 'need_confirmation',
            content: pendingValidatedPlan['reply'],
          }),
          {
            ok: !![],
            status: 'need_confirmation',
            reply: pendingValidatedPlan['reply'] || runtimeText('confirmFallback', localeProvider2()),
            riskLevel: validation2['riskLevel'],
            plan: pendingValidatedPlan,
          }
        );
      }
      sessionStore['setCurrentRun']?.({
        id: id8['runId'],
        status: 'executing',
        stopped: ![],
        step: id8['step'],
      });
      const execution4 = await executeActions2([commandId3], {
        commandContext: commandContext2,
        precreatedNode: id8['precreatedNode'],
        ...buildExecutionOptions(id8['runId']),
      });
      if (!isActiveRun(id8['runId'])) return { ...createStoppedReply(), execution: execution4 };
      const taskMessages3 = agentTaskBindingRuntime['registerExecution'](execution4, { turnId: id8['runId'] }),
        agentToolResult2 = buildAgentToolResult({
          step: id8['step'],
          action: commandId3,
          execution: execution4,
        });
      ((id8['toolResults'] = [...id8['toolResults'], agentToolResult2]),
        (id8['runtimeProvenance'] = deriveAgentRuntimeProvenance({
          action: commandId3,
          execution: execution4,
          previous: id8['runtimeProvenance'],
        })),
        (id8['actionBudget'] = recordAgentLoopActionBudgetResult(
          id8['actionBudget'],
          commandId3,
          execution4,
        )),
        (id8 = run14(id8, commandId3, execution4)));
      execution4['ok'] === !![] &&
        doesActionConsumePrecreatedNode(commandId3, id8['precreatedNode']) &&
        (id8['precreatedNode'] = null);
      if (execution4['ok']) {
        id8['completedFingerprints'] = [...id8['completedFingerprints'], fingerprintAgentAction3];
        const value52 = { ...id8['failedFingerprints'] };
        (delete value52[fingerprintAgentAction3], (id8['failedFingerprints'] = value52));
      } else {
        const count3 = Number(id8['failedFingerprints'][fingerprintAgentAction3] || 0x0) + 0x1;
        id8['failedFingerprints'] = { ...id8['failedFingerprints'], [fingerprintAgentAction3]: count3 };
        if (count3 > 0x1)
          return run8(
            id8,
            execution4['message'] || runtimeText('actionExecutionFailed', localeProvider2()),
            { execution: execution4 },
          );
      }
      ((id8['step'] += 0x1),
        sessionStore['recordTrace']?.({
          type: 'agent_loop_tool_result',
          step: id8['step'],
          commandId: commandId3['type'],
          ok: execution4['ok'] === !![],
        }));
      execution4['ok'] === !![] &&
        (sessionStore['setPendingLoopRun']?.({ ...id8, pendingKind: 'interrupted' }),
        markUnfinishedOperation(id8['originalMessage']));
      const value53 = run5(id8, { taskMessages: taskMessages3 });
      if (value53) return value53;
    }
    return run8(id8, runtimeText('loopLimitReached', localeProvider2()));
  }
  async function run20(message6, intent = {}) {
    if (typeof planner !== 'function') return createFailedReply(runtimeText('plannerMissing', localeProvider2()));
    const value54 = String(intent['loopState']?.['recoveryInstruction'] || '')['trim'](),
      userMessage3 = value54 ? String(message6 || '') + '\x0a' + value54 : message6,
      namespaces = buildContext({
        store: store2 || commandContext2?.['store'],
        commandRegistry: commandRegistry,
        sessionStore: sessionStore,
        userMessage: userMessage3,
        intent: intent['intent'],
        targetKind: intent['targetKind'],
        inputRefs: intent['inputRefs'],
        contextBudgetChars: intent['contextBudgetChars'],
        disclosedCommandIds: intent['disclosedCommandIds'],
        disclosedModelIds: intent['disclosedModelIds'],
        selectedSkillIds: intent['selectedSkillIds'],
        ...(skillRegistry ? { skillRegistry: skillRegistry } : {}),
      });
    return (
      (agentContext2 = namespaces),
      run2(namespaces, userMessage3, { channel: 'canvas.plan' }),
      sessionStore['recordTrace']?.({
        type: 'capability_context_routed',
        namespaces: namespaces['capabilityRouting']?.['selectedNamespaces'] || [],
        commandIds: (namespaces['commands'] || [])['map']((value55) => value55['id']),
        skillIds: (namespaces['skills'] || [])['map']((value56) => value56['id']),
        modelIds: (namespaces['canvas']?.['availableModels'] || [])['map'](
          (value57) => value57['modelId'],
        ),
        estimatedChars: Number(namespaces['contextBudget']?.['estimatedChars'] || 0x0),
        schemaIntegrity: namespaces['contextBudget']?.['schemaIntegrity'] !== ![],
      }),
      planner({
        message: message6,
        context: namespaces,
        history: sessionStore['getHistory']?.() || [],
        pendingClarification: sessionStore['getPendingClarification']?.(),
        onTrace: (value58) => sessionStore['recordTrace']?.(value58),
        ...intent,
      })
    );
  }
  async function replyFromMessage(userMessage4, intent2 = {}) {
    if (typeof assistant !== 'function') return null;
    const context2 = buildContext({
      store: store2 || commandContext2?.['store'],
      commandRegistry: commandRegistry,
      sessionStore: sessionStore,
      userMessage: userMessage4,
      intent: intent2['intent'],
      targetKind: intent2['targetKind'],
      inputRefs: intent2['inputRefs'],
      contextBudgetChars: intent2['contextBudgetChars'],
      selectedSkillIds: intent2['selectedSkillIds'],
      ...(skillRegistry ? { skillRegistry: skillRegistry } : {}),
    });
    ((agentContext2 = context2), intent2['onSkillsSelected']?.(context2['skills'] || []));
    const channel2 =
      intent2['assistantChoice'] === !![]
        ? { channel: 'assistant.message', reason: 'conversation-choice' }
        : routeAgentTurn({
            message: userMessage4,
            intent: intent2['intent'],
            clarificationAnswer: Boolean(intent2['clarificationAnswer']),
            pendingPlan: Boolean(intent2['pendingPlan']),
            conversationHistory: intent2['conversationHistory'] || [],
          });
    (run2(context2, userMessage4, { channel: channel2['channel'] }),
      sessionStore['recordTrace']?.({
        type: 'agent_turn_routed',
        channel: channel2['channel'],
        reason: channel2['reason'],
      }));
    const reply4 = await assistant({
      message: userMessage4,
      context: context2,
      history: sessionStore['getHistory']?.() || [],
      signal: signal?.['signal'],
      onTrace: (value59) => sessionStore['recordTrace']?.(value59),
      ...intent2,
    });
    return {
      ...(typeof reply4 === 'string' ? { reply: reply4 } : reply4),
      selectedSkillIds: (context2['skills'] || [])['map']((value60) => value60['id']),
    };
  }
  async function run21(initialScope, { turnId: turnId = '' } = {}) {
    if (!isActiveRun(turnId)) return createStoppedReply();
    const execution5 = await executeActions2(initialScope['plan']['actions'], {
      commandContext: commandContext2,
      initialScope: initialScope['plan']['scope'] || initialScope['plan']['aliases'] || {},
      ...buildExecutionOptions(turnId),
    });
    if (!isActiveRun(turnId)) return { ...createStoppedReply(), execution: execution5 };
    let taskMessages4 = [];
    const content5 = execution5['ok']
        ? initialScope['plan']['completionReply'] ||
          (initialScope['plan']['preExecutedActions']?.['length'] > 0x0
            ? summarizeExecution(execution5, localeProvider2())
            : initialScope['plan']['reply'] || summarizeExecution(execution5, localeProvider2()))
        : summarizeExecution(execution5, localeProvider2()),
      value61 = execution5['ok']
        ? { recovery: null, retryPlan: initialScope['plan'] }
        : agentPlanLifecycle['recover'](execution5, initialScope['plan']),
      { recovery: recovery3, retryPlan: retryPlan2 } = value61,
      diagnostic2 = execution5['ok']
        ? null
        : buildAgentExecutionDiagnostic({
            execution: execution5,
            recovery: recovery3,
            step: sessionStore['getCurrentRun']?.()?.['step'] || 0x0,
            locale: localeProvider2(),
          });
    if (execution5['ok'])
      (sessionStore['clearPendingPlan']?.(), sessionStore['clearPendingRecovery']?.(), run10());
    else
      recovery3
        ? (sessionStore['clearPendingPlan']?.(),
          sessionStore['setPendingRecovery']?.({ plan: retryPlan2, recovery: recovery3 }),
          markUnfinishedOperation(agentPlanLifecycle['describe']({ recovery: recovery3 })))
        : (sessionStore['clearPendingPlan']?.(), sessionStore['clearPendingRecovery']?.(), run10());
    return (
      sessionStore['pushHistory']?.({
        role: 'assistant',
        status: execution5['ok'] ? 'success' : 'failed',
        content: content5,
        execution: execution5,
        recovery: recovery3,
        diagnostic: diagnostic2,
      }),
      (taskMessages4 = agentTaskBindingRuntime['registerExecution'](execution5, { turnId: getCurrentTurnId(turnId) })),
      {
        ok: execution5['ok'],
        status: execution5['status'],
        reply: content5,
        plan: initialScope['plan'],
        execution: execution5,
        taskMessages: taskMessages4,
        ...(recovery3 ? { recovery: recovery3 } : {}),
        ...(diagnostic2 ? { diagnostic: diagnostic2 } : {}),
      }
    );
  }
  async function run22(plan2, { turnId: turnId = '' } = {}) {
    if (!isActiveRun(turnId)) return createStoppedReply();
    const { prefix: prefix, pending: pending } = agentPlanLifecycle['partition'](plan2['plan']);
    if (prefix['length'] === 0x0) return { ok: !![], plan: plan2['plan'], preExecution: null };
    const execution6 = await executeActions2(prefix, { commandContext: commandContext2, ...buildExecutionOptions(turnId) });
    if (!isActiveRun(turnId)) return { ...createStoppedReply(), execution: execution6 };
    if (!execution6['ok'])
      return (
        sessionStore['pushHistory']?.({
          role: 'assistant',
          status: 'failed',
          content: execution6['message'] || runtimeText('preActionsFailed', localeProvider2()),
          execution: execution6,
        }),
        {
          ok: ![],
          status: 'failed',
          reply: execution6['message'] || runtimeText('preActionsFailed', localeProvider2()),
          message: execution6['message'] || runtimeText('preActionsFailed', localeProvider2()),
          execution: execution6,
        }
      );
    return {
      ok: !![],
      preExecution: execution6,
      plan: {
        ...plan2['plan'],
        actions: pending,
        preExecutedActions: prefix,
        scope: execution6['raw']?.['result']?.['aliases'] || {},
      },
    };
  }
  async function handlePlan(
    value62,
    {
      agentContext: agentContext = agentContext2,
      userMessage: userMessage = '',
      plannerExtra: plannerExtra = {},
      turnId: turnId = '',
      confirmationReply: confirmationReply = '',
      completionReply: completionReply = '',
    } = {},
  ) {
    if (!isActiveRun(turnId)) return createStoppedReply();
    const debugTrace2 = [],
      content6 = validatePlan(value62, {
        commandRegistry: commandRegistry,
        commandContext: commandContext2,
        agentContext: agentContext,
        userMessage: userMessage,
        traceRecorder: (value63) => {
          (debugTrace2['push'](value63), sessionStore['recordTrace']?.(value63));
        },
      });
    if (!content6['ok'])
      return (
        sessionStore['pushHistory']?.({ role: 'assistant', status: 'failed', content: content6['message'] }),
        createFailedReply(content6['message'], { validation: content6 })
      );
    if (content6['status'] === 'chat') {
      const content7 = content6['plan']['reply'] || runtimeText('chatFallback', localeProvider2());
      return (
        sessionStore['pushHistory']?.({ role: 'assistant', status: 'chat', content: content7 }),
        createChatReply(content7, { plan: content6['plan'] })
      );
    }
    if (shouldHoldCanvasActionsForChat(content6, userMessage, plannerExtra)) {
      const content8 = content6['plan']['reply'] || runtimeText('chatIntentRequired', localeProvider2());
      return (
        sessionStore['recordTrace']?.({
          type: 'canvas_action_held_for_chat',
          actionTypes: (content6['plan']['actions'] || [])['map']((value64) => value64['type']),
          reason: 'missing\x20explicit\x20canvas\x20action\x20intent',
        }),
        sessionStore['pushHistory']?.({ role: 'assistant', status: 'chat', content: content8 }),
        createChatReply(content8, {
          plan: { ...content6['plan'], status: 'chat', actions: [], requiresConfirmation: ![] },
          heldActions: content6['plan']['actions'],
        })
      );
    }
    if (content6['status'] === 'need_clarification')
      return (
        sessionStore['setPendingClarification']?.(content6['plan']),
        sessionStore['pushHistory']?.({
          role: 'assistant',
          status: 'need_clarification',
          content: content6['plan']['question'],
        }),
        {
          ok: !![],
          status: 'need_clarification',
          reply: content6['plan']['reply'] || content6['plan']['question'],
          question: content6['plan']['question'],
          options: content6['plan']['options'],
          plan: content6['plan'],
        }
      );
    if (content6['status'] === 'need_confirmation') {
      const plan3 = await run22(content6, { turnId: turnId });
      if (!plan3['ok']) return plan3;
      if (confirmationReply) plan3['plan']['reply'] = confirmationReply;
      if (completionReply) plan3['plan']['completionReply'] = completionReply;
      return (
        (plan3['plan'] = agentPlanLifecycle['review'](plan3['plan'], { debugTrace: debugTrace2 })),
        sessionStore['setPendingPlan']?.(plan3['plan']),
        markUnfinishedOperation(agentPlanLifecycle['describe']({ plan: plan3['plan'] })),
        sessionStore['pushHistory']?.({
          role: 'assistant',
          status: 'need_confirmation',
          content: plan3['plan']['reply'],
        }),
        {
          ok: !![],
          status: 'need_confirmation',
          reply: plan3['plan']['reply'] || runtimeText('confirmFallback', localeProvider2()),
          riskLevel: content6['riskLevel'],
          plan: plan3['plan'],
          preExecution: plan3['preExecution'],
        }
      );
    }
    return run21(content6, { turnId: turnId });
  }
  async function handleUserMessage(value65, selectedSkillIds = {}) {
    const displayMessage2 = String(value65 || '')['trim']();
    if (!displayMessage2) return createFailedReply(runtimeText('emptyMessage', localeProvider2()));
    selectedSkillIds = { ...selectedSkillIds, conversationHistory: sessionStore['getHistory']?.() || [] };
    (!hasExplicitCanvasActionIntent(displayMessage2, selectedSkillIds) || selectedSkillIds['assistantChoice'] === !![]) &&
      (selectedSkillIds = {
        ...selectedSkillIds,
        selectedSkillIds: selectedSkillIds['selectedSkillIds']?.['length']
          ? selectedSkillIds['selectedSkillIds']
          : getAgentContinuationSkillIds(displayMessage2, sessionStore['getHistory']?.() || []),
      });
    const pendingSkillConversation = prepareExternalInformation['getPendingSkillConversation'](),
      value66 = loopMode === !![] ? sessionStore['getPendingLoopRun']?.() : null;
    if (
      value66 &&
      !['clarification', 'task_wait']['includes'](String(value66['pendingKind'] || '')) &&
      isAgentLoopRetryMessage(displayMessage2) &&
      run6(value66)
    )
      return resumeInterruptedRun({ displayMessage: displayMessage2 });
    if (
      sessionStore['getPendingClarification']?.() &&
      !pendingSkillConversation &&
      !selectedSkillIds['pendingPlan'] &&
      !selectedSkillIds['clarificationAnswer']
    )
      return answerClarification(displayMessage2, { ...selectedSkillIds, displayAnswer: displayMessage2 });
    const checkpoint3 = loopMode === !![] ? sessionStore['getPendingLoopRun']?.() : null;
    if (
      checkpoint3?.['pendingKind'] === 'planner_retry' &&
      isAgentLoopRetryMessage(displayMessage2) &&
      run6(checkpoint3)
    )
      return run17({ checkpoint: checkpoint3, displayMessage: displayMessage2 });
    if (
      checkpoint3?.['pendingKind'] === 'planner_retry' &&
      isAgentLoopRecoveryEditMessage(displayMessage2) &&
      run6(checkpoint3)
    )
      return run17({ checkpoint: checkpoint3, displayMessage: displayMessage2, recoveryInstruction: displayMessage2 });
    const id9 = 'agent-run-' + ++handle;
    (run(),
      sessionStore['clearPendingPlan']?.(),
      sessionStore['clearPendingRecovery']?.(),
      sessionStore['clearPendingClarification']?.(),
      sessionStore['clearPendingLoopRun']?.(),
      run10(),
      sessionStore['setCurrentRun']?.({ id: id9, status: 'planning', stopped: ![] }));
    const value67 =
      Array['isArray'](selectedSkillIds['documentFiles']) && selectedSkillIds['documentFiles']['length'] > 0x0;
    sessionStore['pushHistory']?.({
      role: 'user',
      content: displayMessage2,
      inputRefs: Array['isArray'](selectedSkillIds['displayInputRefs'])
        ? selectedSkillIds['displayInputRefs']
        : Array['isArray'](selectedSkillIds['inputRefs'])
          ? selectedSkillIds['inputRefs']
          : [],
    });
    const value68 =
      selectedSkillIds['assistantChoice'] === !![]
        ? null
        : await prepareExternalInformation['handleCommand']({
            message: displayMessage2,
            pendingSkillConversation: pendingSkillConversation,
            runId: id9,
            signal: signal?.['signal'],
          });
    if (value68) return value68;
    const value69 =
      value67 || selectedSkillIds['assistantChoice'] === !![]
        ? null
        : await agentConversationCanvasTransferRuntime['handle'](displayMessage2, id9);
    if (value69) return value69;
    if (
      typeof assistant === 'function' &&
      (value67 ||
        selectedSkillIds['assistantChoice'] === !![] ||
        !hasExplicitCanvasActionIntent(displayMessage2, selectedSkillIds))
    )
      return selectAssistantVersion['handle'](displayMessage2, selectedSkillIds, id9);
    if (loopMode === !![]) {
      let value70 = run13({ runId: id9, message: displayMessage2, plannerExtra: selectedSkillIds });
      value70 = await agentPrecreatedNodeRuntime['reserve'](value70);
      if (!isActiveRun(id9)) return createStoppedReply();
      return run9(value70);
    }
    let value71;
    try {
      value71 = await run20(displayMessage2, { ...selectedSkillIds, signal: signal?.['signal'] });
    } catch (error6) {
      if (!isActiveRun(id9) || signal?.['signal']?.['aborted']) return createStoppedReply();
      const content9 = error6?.['message'] || runtimeText('plannerFailed', localeProvider2());
      return (
        sessionStore['pushHistory']?.({ role: 'assistant', status: 'failed', content: content9 }),
        sessionStore['setCurrentRun']?.({ id: id9, status: 'failed', stopped: ![] }),
        createFailedReply(content9)
      );
    }
    if (!isActiveRun(id9)) return createStoppedReply();
    const status3 = await handlePlan(value71, {
      userMessage: displayMessage2,
      plannerExtra: selectedSkillIds,
      turnId: id9,
    });
    return (
      isActiveRun(id9) &&
        sessionStore['setCurrentRun']?.({ id: id9, status: status3['status'], stopped: ![] }),
      status3
    );
  }
  async function answerClarification(clarificationAnswer, args8 = {}) {
    const pendingPlan = sessionStore['getPendingClarification']?.();
    if (!pendingPlan) return createFailedReply(runtimeText('noPendingClarification', localeProvider2()));
    const args9 = loopMode === !![] ? sessionStore['getPendingLoopRun']?.() : null;
    sessionStore['clearPendingClarification']?.();
    const content10 = String(args8['displayAnswer'] || clarificationAnswer || '')['trim']();
    if (args9?.['pendingKind'] === 'clarification') {
      const id10 = 'agent-run-' + ++handle;
      (run(),
        sessionStore['clearPendingLoopRun']?.(),
        sessionStore['setCurrentRun']?.({ id: id10, status: 'planning', stopped: ![] }));
      if (content10) sessionStore['pushHistory']?.({ role: 'user', content: content10 });
      return run9({
        ...args9,
        runId: id10,
        pendingKind: '',
        clarificationAnswer: String(clarificationAnswer || content10),
        plannerExtra: {
          ...args9['plannerExtra'],
          ...args8,
          clarificationAnswer: clarificationAnswer,
          pendingPlan: pendingPlan,
        },
      });
    }
    if (loopMode === !![] && pendingPlan['originalMessage']) {
      const id11 = 'agent-run-' + ++handle;
      (run(), sessionStore['setCurrentRun']?.({ id: id11, status: 'planning', stopped: ![] }));
      if (content10) sessionStore['pushHistory']?.({ role: 'user', content: content10 });
      const args10 = run13({
        runId: id11,
        message: pendingPlan['originalMessage'],
        plannerExtra: {
          ...args8,
          targetKind: pendingPlan['targetKind'] || args8['targetKind'],
          inputRefs: pendingPlan['inputRefs'] || args8['inputRefs'] || [],
        },
      });
      return run9({ ...args10, clarificationAnswer: String(clarificationAnswer || content10) });
    }
    const value72 = { ...args8, clarificationAnswer: clarificationAnswer, pendingPlan: pendingPlan };
    return (delete value72['displayAnswer'], handleUserMessage(content10, value72));
  }
  async function updatePendingGenerationParams(options6 = {}) {
    const value73 = conversationId(),
      enabled11 = sessionStore['getPendingPlan']?.();
    if (!enabled11) return createFailedReply(runtimeText('noPendingPlan', localeProvider2()));
    const params = getPlainObject(options6['params'] || options6);
    if (Object['keys'](params)['length'] === 0x0)
      return createFailedReply(runtimeText('nodeSetParams', localeProvider2()));
    const debugTraceSummary =
        enabled11['confirmationSummary'] || agentPlanLifecycle['review'](enabled11)['confirmationSummary'],
      list7 = (
        Array['isArray'](debugTraceSummary['generation']?.['nodeIds'])
          ? debugTraceSummary['generation']['nodeIds']
          : [debugTraceSummary['generation']?.['nodeId']]
      )
        ['map']((value74) => String(value74 || '')['trim']())
        ['filter'](Boolean);
    if (list7['length'] === 0x0) return createFailedReply(runtimeText('noPendingPlan', localeProvider2()));
    const execution7 = await executeActions2(
      list7['map']((nodeId) => ({
        type: 'node.setParams',
        args: { nodeId: nodeId, params: params },
      })),
      { commandContext: commandContext2 },
    );
    if (conversationId() !== value73 || sessionStore['getPendingPlan']?.() !== enabled11)
      return { ...createStoppedReply(), stale: !![] };
    if (!execution7['ok'])
      return createFailedReply(execution7['message'] || runtimeText('actionExecutionFailed', localeProvider2()), {
        execution: execution7,
      });
    const plan4 = agentPlanLifecycle['review'](enabled11, {
      debugTraceSummary: debugTraceSummary['debugTraceSummary'] || [],
    });
    return (
      sessionStore['setPendingPlan']?.(plan4),
      markUnfinishedOperation(agentPlanLifecycle['describe']({ plan: plan4 })),
      {
        ok: !![],
        status: 'need_confirmation',
        reply: plan4['reply'] || runtimeText('confirmFallback', localeProvider2()),
        plan: plan4,
        execution: execution7,
      }
    );
  }
  return {
    sessionStore: sessionStore,
    handleUserMessage: handleUserMessage,
    reviseAssistantTurn: (value75) => selectAssistantVersion['revise'](value75),
    selectAssistantVersion: selectAssistantVersion['selectVersion'],
    answerClarification: answerClarification,
    getPendingAssistantChoice: selectAssistantVersion['getPendingChoice'],
    answerAssistantChoice: selectAssistantVersion['answerChoice'],
    updatePendingGenerationParams: updatePendingGenerationParams,
    async confirmPendingPlan(options7 = {}) {
      if (config) return config;
      const id12 = loopMode === !![] ? sessionStore['getPendingLoopRun']?.() : null;
      if (id12?.['pendingKind'] === 'confirmation') {
        const value76 = id12['pendingValidatedPlan'],
          commandId4 = value76?.['actions']?.[0x0];
        if (!commandId4 || !run6(id12))
          return (
            sessionStore['clearPendingLoopRun']?.(),
            sessionStore['clearPendingPlan']?.(),
            createFailedReply(runtimeText('loopResumeExpired', localeProvider2()))
          );
        (sessionStore['clearPendingLoopRun']?.(), sessionStore['clearPendingPlan']?.());
        const content11 = String(options7['displayAnswer'] || '')['trim']();
        content11 && sessionStore['pushHistory']?.({ role: 'user', content: content11 });
        (run(),
          sessionStore['setCurrentRun']?.({
            id: id12['runId'],
            status: 'executing',
            stopped: ![],
            step: id12['step'],
          }),
          (config = (async () => {
            sessionStore['recordRunEvent']?.({
              runId: id12['runId'],
              type: 'approval.confirmed',
              status: 'executing',
              step: id12['step'],
              commandId: commandId4['type'],
            });
            const execution8 = await executeActions2([commandId4], {
              commandContext: commandContext2,
              precreatedNode: id12['precreatedNode'],
              ...buildExecutionOptions(id12['runId']),
            });
            if (!isActiveRun(id12['runId'])) return { ...createStoppedReply(), execution: execution8 };
            const {
              nextLoop: nextLoop,
              taskMessages: taskMessages5,
              recoveryCheckpoint: recoveryCheckpoint2,
            } = run16(id12, commandId4, execution8, { confirmed: !![] });
            if (!execution8['ok']) return run7(id12, commandId4, execution8);
            const value77 = run5(nextLoop, { taskMessages: taskMessages5, recoveryCheckpoint: recoveryCheckpoint2 });
            if (value77) return value77;
            return run9(nextLoop);
          })()));
        try {
          return await config;
        } finally {
          config = null;
        }
      }
      const commandId5 = sessionStore['getPendingPlan']?.();
      if (!commandId5) return createFailedReply(runtimeText('noPendingPlan', localeProvider2()));
      sessionStore['clearPendingPlan']?.();
      const content12 = String(options7['displayAnswer'] || '')['trim']();
      content12 && sessionStore['pushHistory']?.({ role: 'user', content: content12 });
      (sessionStore['recordRunEvent']?.({
        runId: sessionStore['getCurrentRun']?.()?.['id'],
        type: 'approval.confirmed',
        status: 'executing',
        commandId: commandId5['actions']?.[0x0]?.['type'],
      }),
        (config = run21(
          { ok: !![], status: 'ready', plan: { ...commandId5, status: 'ready', requiresConfirmation: ![] } },
          { turnId: turnId2('agent-confirm') },
        )));
      try {
        return await config;
      } finally {
        config = null;
      }
    },
    async retryFailedPlan() {
      const initialScope2 = sessionStore['getPendingRecovery']?.();
      if (!initialScope2?.['plan']) return createFailedReply(runtimeText('noPendingRecovery', localeProvider2()));
      if (initialScope2['loopCheckpoint'] && initialScope2['loopAction']) {
        if (!run6(initialScope2['loopCheckpoint']))
          return (
            sessionStore['clearPendingRecovery']?.(),
            run10(),
            createFailedReply(runtimeText('loopResumeExpired', localeProvider2()))
          );
        const runId6 = 'agent-run-' + ++handle,
          step5 = {
            ...initialScope2['loopCheckpoint'],
            runId: runId6,
            pendingKind: '',
            pendingValidatedPlan: null,
          },
          value78 = initialScope2['loopAction'];
        (run(),
          sessionStore['clearPendingRecovery']?.(),
          sessionStore['setCurrentRun']?.({
            id: runId6,
            status: 'executing',
            stopped: ![],
            step: step5['step'],
          }));
        const execution9 = await executeActions2([value78], {
          commandContext: commandContext2,
          initialScope: initialScope2['plan']['scope'] || initialScope2['plan']['aliases'] || {},
          precreatedNode: step5['precreatedNode'],
          ...buildExecutionOptions(runId6),
        });
        if (!isActiveRun(runId6)) return { ...createStoppedReply(), execution: execution9 };
        const {
          nextLoop: nextLoop2,
          taskMessages: taskMessages6,
          recoveryCheckpoint: recoveryCheckpoint3,
        } = run16(step5, value78, execution9);
        if (!execution9['ok']) return run7(step5, value78, execution9);
        const value79 = run5(nextLoop2, { taskMessages: taskMessages6, recoveryCheckpoint: recoveryCheckpoint3 });
        if (value79) return value79;
        return run9(nextLoop2);
      }
      return run21(
        {
          ok: !![],
          status: 'ready',
          plan: { ...initialScope2['plan'], status: 'ready', requiresConfirmation: ![] },
        },
        { turnId: turnId2('agent-retry') },
      );
    },
    async retryPlannerRun() {
      return run17();
    },
    resumeInterruptedRun: resumeInterruptedRun,
    discardInterruptedRun: discardInterruptedRun,
    undoLastAgentRun: undoLastAgentRun,
    getInterruptedRun() {
      const value80 = sessionStore['getPendingLoopRun']?.();
      return value80 && run6(value80) ? value80 : null;
    },
    getLastUndoableRun() {
      if (
        !runId ||
        runId['conversationId'] !== conversationId() ||
        runId['projectId'] !== getProjectId({ commandContext: commandContext2 })
      )
        return null;
      return { runId: runId['runId'] };
    },
    keepPreparedPlan() {
      (sessionStore['clearPendingRecovery']?.(), sessionStore['clearPendingPlan']?.(), run10());
      const content13 = runtimeText('recoveryKept', localeProvider2());
      return (
        sessionStore['pushHistory']?.({ role: 'assistant', status: 'recovery_kept', content: content13 }),
        { ok: !![], status: 'recovery_kept', reply: content13 }
      );
    },
    cancelPendingPlan() {
      const commandId6 = sessionStore['getPendingPlan']?.(),
        runId7 = sessionStore['getCurrentRun']?.();
      (sessionStore['recordRunEvent']?.({
        runId: runId7?.['id'],
        type: 'approval.cancelled',
        status: 'cancelled',
        step: runId7?.['step'],
        commandId: commandId6?.['actions']?.[0x0]?.['type'],
      }),
        sessionStore['clearPendingPlan']?.(),
        sessionStore['clearPendingLoopRun']?.(),
        sessionStore['clearPendingClarification']?.(),
        run10());
      const content14 = runtimeText('planCancelled', localeProvider2());
      return (
        sessionStore['pushHistory']?.({ role: 'assistant', status: 'cancelled', content: content14 }),
        { ok: !![], status: 'cancelled', reply: content14 }
      );
    },
    stop() {
      const notice = selectAssistantVersion['stop'](),
        run23 = sessionStore['stopCurrentRun']?.();
      (run11('stopped'),
        sessionStore['clearPendingLoopRun']?.(),
        sessionStore['clearPendingPlan']?.(),
        sessionStore['clearPendingClarification']?.(),
        run10());
      const content15 = runtimeText('runStopped', localeProvider2());
      return (
        run23 &&
          !notice &&
          sessionStore['pushHistory']?.({ role: 'assistant', status: 'stopped', content: content15 }),
        {
          ok: !![],
          status: 'stopped',
          reply: content15,
          run: run23,
          ...(notice?.['error'] ? { notice: notice['error']['message'] } : {}),
        }
      );
    },
    resetSession() {
      return (
        run11('reset'),
        sessionStore['reset']?.(),
        run10(),
        { ok: !![], status: 'reset', reply: runtimeText('reset', localeProvider2()) }
      );
    },
    startNewConversation() {
      return (run11('conversation_changed'), sessionStore['startNewConversation']?.() || null);
    },
    switchConversation(value81) {
      return (run11('conversation_changed'), sessionStore['switchConversation']?.(value81) || null);
    },
    deleteConversation(value82) {
      if (String(value82 || '')['trim']() === sessionStore['getActiveConversation']?.()?.['id'])
        run11('conversation_changed');
      return sessionStore['deleteConversation']?.(value82) || null;
    },
    listConversations() {
      return sessionStore['listConversations']?.() || [];
    },
    getActiveConversation() {
      return sessionStore['getActiveConversation']?.() || null;
    },
    dispose() {
      (run11('disposed'), agentTaskBindingRuntime?.['dispose']?.());
    },
  };
}
