import { resolveAgentConversationCanvasTransfer } from './agentConversationCanvasTransfer.js';
function getSelectedNodeIds(canvasState = {}) {
  return Array['from'](
    new Set(
      (Array['isArray'](canvasState['selectedNodeIds']) ? canvasState['selectedNodeIds'] : [])
        ['map']((id) => String(id || '')['trim']())
        ['filter'](Boolean),
    ),
  );
}
export function createAgentConversationCanvasTransferRuntime({
  sessionStore: sessionStore,
  readCanvasState: readCanvasState,
  executeActions: executeActions,
  handlePlan: handlePlan,
  buildExecutionGuard: buildExecutionGuard,
  isActiveRun: isActiveRun,
  createStoppedReply: createStoppedReply,
  commandContext: commandContext,
  text: text,
} = {}) {
  function replyWithText(runId, content, { ok: ok = !![], status: status = 'chat', extra: extra = {} } = {}) {
    return (
      sessionStore['pushHistory']?.({ role: 'assistant', status: status, content: content, ...extra }),
      sessionStore['setCurrentRun']?.({ id: runId, status: status, stopped: ![] }),
      {
        ok: ok,
        status: status,
        reply: content,
        message: content,
        responseChannel: 'canvas.tool',
        ...extra,
      }
    );
  }
  async function handlePromptTransfer(transfer, message, runId) {
    const selectedIds = getSelectedNodeIds(readCanvasState?.() || {});
    if (selectedIds['length'] !== 1) return replyWithText(runId, text('promptTransferTargetRequired'));
    const action = {
        type: transfer['mode'] === 'append' ? 'node.appendPrompt' : 'node.setPrompt',
        args: { nodeId: selectedIds[0], text: transfer['content'] },
      },
      planResult = await handlePlan(
        { status: 'ready', reply: text('promptTransferCompleted'), actions: [action] },
        {
          agentContext: {},
          userMessage: message,
          turnId: runId,
          confirmationReply: text('promptTransferConfirmation'),
          completionReply: text('promptTransferCompleted'),
        },
      );
    return (
      isActiveRun(runId) &&
        sessionStore['setCurrentRun']?.({ id: runId, status: planResult['status'], stopped: ![] }),
      { ...planResult, responseChannel: 'canvas.tool' }
    );
  }
  async function handle(message, runId) {
    const transfer = resolveAgentConversationCanvasTransfer({
      message: message,
      history: sessionStore['getHistory']?.() || [],
    });
    if (!transfer) return null;
    sessionStore['recordTrace']?.({
      type: 'agent_turn_routed',
      channel: 'canvas.tool',
      reason:
        transfer['target'] === 'selected_prompt'
          ? 'conversation-prompt-transfer'
          : 'conversation-text-transfer',
    });
    if (!transfer['content']) return replyWithText(runId, text('textSourceMissing'));
    if (transfer['target'] === 'selected_prompt') return handlePromptTransfer(transfer, message, runId);
    const action = {
        type: 'node.create',
        args: { type: transfer['nodeType'], prompt: transfer['content'] },
      },
      execution = await executeActions([action], {
        commandContext: commandContext,
        ...buildExecutionGuard(runId),
      });
    if (!isActiveRun(runId)) return createStoppedReply();
    const reply = execution['ok']
      ? text('textPlacedOnCanvas')
      : execution['message'] || text('actionExecutionFailed');
    return replyWithText(runId, reply, {
      ok: execution['ok'],
      status: execution['ok'] ? 'success' : 'failed',
      extra: { plan: { status: 'ready', reply: reply, actions: [action] }, execution: execution },
    });
  }
  return Object['freeze']({ handle: handle });
}
