import { deriveRequestedCreatedNodeType } from './agentCompletionEvidence.js';
const EXISTING_TARGET_PATTERN =
    /(?:当前|选中|这个|该|刚才|上一个|已有|原有).{0,8}(?:节点|图片|图像|视频|音频|文本)|(?:重新生成|再次生成|重做|重生成)|\b(?:current|selected|existing|this|that)\s+(?:node|image|video|audio|text)\b|\b(?:regenerate|rerun)\b/i,
  EXPLICIT_NEW_TARGET_PATTERN =
    /(?:创建|新建|添加|新增|插入|制作)(?:一|1|个|张|幅|段|份|些|几|两|三|四|五|六|七|八|九|十|新的?){0,6}|(?:来|做|画)(?:一|1|个|张|幅|段|份|些|几|两|三|四|五|六|七|八|九|十)|出(?:图|一张|一个|一段)|\b(?:create|add|insert|new|make|draw)\b/i;
export function normalizeAgentPrecreatedNode(enabled = {}) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return null;
  const nodeId = String(enabled['nodeId'] || '')['trim'](),
    type = String(enabled['type'] || '')['trim']();
  if (!nodeId || !type) return null;
  return { nodeId: nodeId, type: type };
}
export function deriveAgentPrecreatedNodeType({
  message: message = '',
  plannerExtra: plannerExtra = {},
  canvasState: canvasState = {},
} = {}) {
  const list = String(message || '')['trim'](),
    requestedCreatedNodeType = deriveRequestedCreatedNodeType(list, plannerExtra, {
      includeGenerateVerb: true,
    });
  if (!requestedCreatedNodeType) return '';
  const list2 = Array['isArray'](canvasState?.['selectedNodeIds']) ? canvasState['selectedNodeIds'] : [],
    value = list2['some'](
      (item) => String(canvasState?.['nodes']?.[item]?.['type'] || '')['trim']() === requestedCreatedNodeType,
    );
  if (value && EXISTING_TARGET_PATTERN['test'](list) && !EXPLICIT_NEW_TARGET_PATTERN['test'](list)) return '';
  const key = Object['values'](canvasState?.['nodes'] || {})['some']((error) => {
    if (String(error?.['type'] || '')['trim']() !== requestedCreatedNodeType) return false;
    const list3 = String(error?.['name'] || '')['trim']();
    return list3['length'] >= 2 && list['includes'](list3);
  });
  if (!EXPLICIT_NEW_TARGET_PATTERN['test'](list) && (value || key)) return '';
  return requestedCreatedNodeType;
}
export function doesActionConsumePrecreatedNode(options = {}, index = null) {
  const agentPrecreatedNode = normalizeAgentPrecreatedNode(index);
  if (!agentPrecreatedNode) return false;
  const result = String(options['type'] || options['commandId'] || '')['trim'](),
    data = String(options['args']?.['type'] || '')['trim']();
  return result === 'node.create' && data === agentPrecreatedNode['type'];
}
export function createAgentPrecreatedNodeRuntime({
  plannerAvailable: plannerAvailable = () => false,
  hasCanvasActionIntent: hasCanvasActionIntent = () => false,
  readCanvasState: readCanvasState = () => ({}),
  executeActions: executeActions = async () => null,
  buildExecutionOptions: buildExecutionOptions = () => ({}),
  isActiveRun: isActiveRun = () => true,
  sessionStore: sessionStore = null,
  markUnfinishedOperation: markUnfinishedOperation = () => {},
  commandContext: commandContext = {},
} = {}) {
  return {
    async reserve(message2 = {}) {
      if (
        !plannerAvailable() ||
        !hasCanvasActionIntent(message2['originalMessage'], message2['plannerExtra'])
      )
        return message2;
      const canvasState2 = readCanvasState() || {},
        type2 = deriveAgentPrecreatedNodeType({
          message: message2['originalMessage'],
          plannerExtra: message2['plannerExtra'],
          canvasState: canvasState2,
        });
      if (!type2) return message2;
      const ids = Array['isArray'](canvasState2['selectedNodeIds'])
          ? [...canvasState2['selectedNodeIds']]
          : [],
        response = await executeActions([{ type: 'node.create', args: { type: type2 } }], {
          commandContext: commandContext,
          precreateReservation: true,
          ...buildExecutionOptions(message2['runId']),
        });
      if (!isActiveRun(message2['runId'])) return message2;
      const nodeId2 = String(response?.['createdNodeIds']?.[0] || '')['trim']();
      if (response?.['ok'] !== true || !nodeId2)
        return (
          sessionStore?.['recordTrace']?.({
            type: 'agent_precreated_node_failed',
            commandId: 'node.create',
            nodeType: type2,
            errorCode: String(response?.['errorCode'] || ''),
          }),
          message2
        );
      ids['length'] > 0 &&
        (await executeActions([{ type: 'node.select', args: { ids: ids } }], {
          commandContext: commandContext,
          ...buildExecutionOptions(message2['runId']),
        }));
      const args = { ...message2, precreatedNode: { nodeId: nodeId2, type: type2 } };
      return (
        sessionStore?.['setPendingLoopRun']?.({ ...args, pendingKind: 'interrupted' }),
        markUnfinishedOperation(args['originalMessage']),
        sessionStore?.['recordTrace']?.({
          type: 'agent_precreated_node_ready',
          commandId: 'node.create',
          nodeId: nodeId2,
          nodeType: type2,
        }),
        args
      );
    },
  };
}
