import { deriveRequestedCreatedNodeType } from './agentCompletionEvidence.js';
const EXISTING_TARGET_PATTERN =
    /(?:当前|选中|这个|该|刚才|上一个|已有|原有).{0,8}(?:节点|图片|图像|视频|音频|文本)|(?:重新生成|再次生成|重做|重生成)|\b(?:current|selected|existing|this|that)\s+(?:node|image|video|audio|text)\b|\b(?:regenerate|rerun)\b/i,
  EXPLICIT_NEW_TARGET_PATTERN =
    /(?:创建|新建|添加|新增|插入|制作)(?:一|1|个|张|幅|段|份|些|几|两|三|四|五|六|七|八|九|十|新的?){0,6}|(?:来|做|画)(?:一|1|个|张|幅|段|份|些|几|两|三|四|五|六|七|八|九|十)|出(?:图|一张|一个|一段)|\b(?:create|add|insert|new|make|draw)\b/i;
export function normalizeAgentPrecreatedNode(_0x3c0b58 = {}) {
  if (!_0x3c0b58 || typeof _0x3c0b58 !== 'object' || Array['isArray'](_0x3c0b58)) return null;
  const _0x5dab89 = String(_0x3c0b58['nodeId'] || '')['trim'](),
    _0x1346a1 = String(_0x3c0b58['type'] || '')['trim']();
  if (!_0x5dab89 || !_0x1346a1) return null;
  return { nodeId: _0x5dab89, type: _0x1346a1 };
}
export function deriveAgentPrecreatedNodeType({
  message: message = '',
  plannerExtra: plannerExtra = {},
  canvasState: canvasState = {},
} = {}) {
  const _0x29c6a1 = String(message || '')['trim'](),
    _0x33e5b8 = deriveRequestedCreatedNodeType(_0x29c6a1, plannerExtra, { includeGenerateVerb: !![] });
  if (!_0x33e5b8) return '';
  const _0x5f1e2d = Array['isArray'](canvasState?.['selectedNodeIds']) ? canvasState['selectedNodeIds'] : [],
    _0x5ca2ac = _0x5f1e2d['some'](
      (_0x17dcd0) => String(canvasState?.['nodes']?.[_0x17dcd0]?.['type'] || '')['trim']() === _0x33e5b8,
    );
  if (
    _0x5ca2ac &&
    EXISTING_TARGET_PATTERN['test'](_0x29c6a1) &&
    !EXPLICIT_NEW_TARGET_PATTERN['test'](_0x29c6a1)
  )
    return '';
  const _0x2dbbb3 = Object['values'](canvasState?.['nodes'] || {})['some']((_0x3f2069) => {
    if (String(_0x3f2069?.['type'] || '')['trim']() !== _0x33e5b8) return ![];
    const _0x3f7327 = String(_0x3f2069?.['name'] || '')['trim']();
    return _0x3f7327['length'] >= 0x2 && _0x29c6a1['includes'](_0x3f7327);
  });
  if (!EXPLICIT_NEW_TARGET_PATTERN['test'](_0x29c6a1) && (_0x5ca2ac || _0x2dbbb3)) return '';
  return _0x33e5b8;
}
export function doesActionConsumePrecreatedNode(_0x141665 = {}, _0x519b8f = null) {
  const _0x2d25e2 = normalizeAgentPrecreatedNode(_0x519b8f);
  if (!_0x2d25e2) return ![];
  const _0x35f8f6 = String(_0x141665['type'] || _0x141665['commandId'] || '')['trim'](),
    _0x44ddaf = String(_0x141665['args']?.['type'] || '')['trim']();
  return _0x35f8f6 === 'node.create' && _0x44ddaf === _0x2d25e2['type'];
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
    async reserve(_0x26aa5a = {}) {
      if (
        !plannerAvailable() ||
        !hasCanvasActionIntent(_0x26aa5a['originalMessage'], _0x26aa5a['plannerExtra'])
      )
        return _0x26aa5a;
      const _0x12ece5 = readCanvasState() || {},
        _0x4d46d2 = deriveAgentPrecreatedNodeType({
          message: _0x26aa5a['originalMessage'],
          plannerExtra: _0x26aa5a['plannerExtra'],
          canvasState: _0x12ece5,
        });
      if (!_0x4d46d2) return _0x26aa5a;
      const _0x1cb979 = Array['isArray'](_0x12ece5['selectedNodeIds'])
          ? [..._0x12ece5['selectedNodeIds']]
          : [],
        _0x5b4cc0 = await executeActions([{ type: 'node.create', args: { type: _0x4d46d2 } }], {
          commandContext: commandContext,
          precreateReservation: !![],
          ...buildExecutionOptions(_0x26aa5a['runId']),
        });
      if (!isActiveRun(_0x26aa5a['runId'])) return _0x26aa5a;
      const _0x135406 = String(_0x5b4cc0?.['createdNodeIds']?.[0x0] || '')['trim']();
      if (_0x5b4cc0?.['ok'] !== !![] || !_0x135406)
        return (
          sessionStore?.['recordTrace']?.({
            type: 'agent_precreated_node_failed',
            commandId: 'node.create',
            nodeType: _0x4d46d2,
            errorCode: String(_0x5b4cc0?.['errorCode'] || ''),
          }),
          _0x26aa5a
        );
      _0x1cb979['length'] > 0x0 &&
        (await executeActions([{ type: 'node.select', args: { ids: _0x1cb979 } }], {
          commandContext: commandContext,
          ...buildExecutionOptions(_0x26aa5a['runId']),
        }));
      const _0x586c1b = { ..._0x26aa5a, precreatedNode: { nodeId: _0x135406, type: _0x4d46d2 } };
      return (
        sessionStore?.['setPendingLoopRun']?.({ ..._0x586c1b, pendingKind: 'interrupted' }),
        markUnfinishedOperation(_0x586c1b['originalMessage']),
        sessionStore?.['recordTrace']?.({
          type: 'agent_precreated_node_ready',
          commandId: 'node.create',
          nodeId: _0x135406,
          nodeType: _0x4d46d2,
        }),
        _0x586c1b
      );
    },
  };
}
