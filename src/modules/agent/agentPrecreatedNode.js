import { deriveRequestedCreatedNodeType } from './agentCompletionEvidence.js';
const EXISTING_TARGET_PATTERN =
    /(?:当前|选中|这个|该|刚才|上一个|已有|原有).{0,8}(?:节点|图片|图像|视频|音频|文本)|(?:重新生成|再次生成|重做|重生成)|\b(?:current|selected|existing|this|that)\s+(?:node|image|video|audio|text)\b|\b(?:regenerate|rerun)\b/i,
  EXPLICIT_NEW_TARGET_PATTERN =
    /(?:创建|新建|添加|新增|插入|制作)(?:一|1|个|张|幅|段|份|些|几|两|三|四|五|六|七|八|九|十|新的?){0,6}|(?:来|做|画)(?:一|1|个|张|幅|段|份|些|几|两|三|四|五|六|七|八|九|十)|出(?:图|一张|一个|一段)|\b(?:create|add|insert|new|make|draw)\b/i;
export function normalizeAgentPrecreatedNode(value = {}) {
  if (!value || typeof value !== 'object' || Array['isArray'](value)) return null;
  const nodeId = String(value['nodeId'] || '')['trim'](),
    type = String(value['type'] || '')['trim']();
  if (!nodeId || !type) return null;
  return { nodeId: nodeId, type: type };
}
export function deriveAgentPrecreatedNodeType({
  message: message = '',
  plannerExtra: plannerExtra = {},
  canvasState: canvasState = {},
} = {}) {
  const normalizedMessage = String(message || '')['trim'](),
    requestedType = deriveRequestedCreatedNodeType(normalizedMessage, plannerExtra, {
      includeGenerateVerb: !![],
    });
  if (!requestedType) return '';
  const selectedNodeIds = Array['isArray'](canvasState?.['selectedNodeIds'])
      ? canvasState['selectedNodeIds']
      : [],
    hasSelectedType = selectedNodeIds['some'](
      (nodeId) => String(canvasState?.['nodes']?.[nodeId]?.['type'] || '')['trim']() === requestedType,
    );
  if (
    hasSelectedType &&
    EXISTING_TARGET_PATTERN['test'](normalizedMessage) &&
    !EXPLICIT_NEW_TARGET_PATTERN['test'](normalizedMessage)
  )
    return '';
  const hasNamedMatch = Object['values'](canvasState?.['nodes'] || {})['some']((node) => {
    if (String(node?.['type'] || '')['trim']() !== requestedType) return ![];
    const name = String(node?.['name'] || '')['trim']();
    return name['length'] >= 0x2 && normalizedMessage['includes'](name);
  });
  if (!EXPLICIT_NEW_TARGET_PATTERN['test'](normalizedMessage) && (hasSelectedType || hasNamedMatch))
    return '';
  return requestedType;
}
export function doesActionConsumePrecreatedNode(action = {}, precreatedNode = null) {
  const normalized = normalizeAgentPrecreatedNode(precreatedNode);
  if (!normalized) return ![];
  const actionType = String(action['type'] || action['commandId'] || '')['trim'](),
    argType = String(action['args']?.['type'] || '')['trim']();
  return actionType === 'node.create' && argType === normalized['type'];
}
export function createAgentPrecreatedNodeRuntime({
  plannerAvailable: plannerAvailable = () => ![],
  hasCanvasActionIntent: hasCanvasActionIntent = () => ![],
  readCanvasState: readCanvasState = () => ({}),
  executeActions: executeActions = async () => null,
  buildExecutionOptions: buildExecutionOptions = () => ({}),
  isActiveRun: isActiveRun = () => !![],
  sessionStore: sessionStore = null,
  markUnfinishedOperation: markUnfinishedOperation = () => {},
  commandContext: commandContext = {},
} = {}) {
  return {
    async reserve(request = {}) {
      if (!plannerAvailable() || !hasCanvasActionIntent(request['originalMessage'], request['plannerExtra']))
        return request;
      const canvasState = readCanvasState() || {},
        nodeType = deriveAgentPrecreatedNodeType({
          message: request['originalMessage'],
          plannerExtra: request['plannerExtra'],
          canvasState: canvasState,
        });
      if (!nodeType) return request;
      const previousSelection = Array['isArray'](canvasState['selectedNodeIds'])
          ? [...canvasState['selectedNodeIds']]
          : [],
        result = await executeActions([{ type: 'node.create', args: { type: nodeType } }], {
          commandContext: commandContext,
          precreateReservation: !![],
          ...buildExecutionOptions(request['runId']),
        });
      if (!isActiveRun(request['runId'])) return request;
      const createdNodeId = String(result?.['createdNodeIds']?.[0x0] || '')['trim']();
      if (result?.['ok'] !== !![] || !createdNodeId)
        return (
          sessionStore?.['recordTrace']?.({
            type: 'agent_precreated_node_failed',
            commandId: 'node.create',
            nodeType: nodeType,
            errorCode: String(result?.['errorCode'] || ''),
          }),
          request
        );
      previousSelection['length'] > 0x0 &&
        (await executeActions([{ type: 'node.select', args: { ids: previousSelection } }], {
          commandContext: commandContext,
          ...buildExecutionOptions(request['runId']),
        }));
      const reservedRequest = { ...request, precreatedNode: { nodeId: createdNodeId, type: nodeType } };
      return (
        sessionStore?.['setPendingLoopRun']?.({ ...reservedRequest, pendingKind: 'interrupted' }),
        markUnfinishedOperation(reservedRequest['originalMessage']),
        sessionStore?.['recordTrace']?.({
          type: 'agent_precreated_node_ready',
          commandId: 'node.create',
          nodeId: createdNodeId,
          nodeType: nodeType,
        }),
        reservedRequest
      );
    },
  };
}
