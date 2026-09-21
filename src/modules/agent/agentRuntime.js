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
function normalizeRuntimeLocale(_0x50a185 = getLocale()) {
  return String(_0x50a185 || '')
    .toLowerCase()
    .startsWith('en')
    ? 'en-US'
    : 'zh-CN';
}
function runtimeText(_0x2fd09a, _0x46deb0 = getLocale()) {
  const _0x4e0398 = normalizeRuntimeLocale(_0x46deb0);
  return RUNTIME_TEXT[_0x4e0398]?.[_0x2fd09a] || RUNTIME_TEXT['zh-CN'][_0x2fd09a] || _0x2fd09a;
}
function createFailedReply(_0x142768, _0x2ff5e9 = {}) {
  return { ok: false, status: 'failed', reply: _0x142768, message: _0x142768, ..._0x2ff5e9 };
}
function summarizeExecution(_0x4beff5, _0x34a745 = getLocale()) {
  if (_0x4beff5.ok) return runtimeText('done', _0x34a745);
  return _0x4beff5.message || runtimeText('actionExecutionFailed', _0x34a745);
}
function isSafeAction(_0x125128 = {}) {
  return String(_0x125128.riskLevel || 'safe') === 'safe';
}
function createChatReply(_0x2bda9c, _0x386de1 = {}) {
  const _0x36933e = String(_0x2bda9c || '');
  return { ok: true, status: 'chat', reply: _0x36933e, message: _0x36933e, ..._0x386de1 };
}
function hasExplicitCanvasActionIntent(_0x57a437 = '', _0x17fa14 = {}) {
  if (_0x17fa14?.clarificationAnswer || _0x17fa14?.pendingPlan) return true;
  if (_0x17fa14?.intent?.canvasAction === true || _0x17fa14?.intent?.mutatesCanvas === true) return true;
  const _0x27ad7f = String(_0x57a437 || '').trim();
  if (!_0x27ad7f) return false;
  return EXPLICIT_CANVAS_ACTION_PATTERNS.some((_0x13ff5a) => _0x13ff5a.test(_0x27ad7f));
}
function shouldHoldCanvasActionsForChat(_0x36daa0 = {}, _0x75bae1 = '', _0x453454 = {}) {
  if (_0x36daa0.status !== 'ready' && _0x36daa0.status !== 'need_confirmation') return false;
  if (!Array.isArray(_0x36daa0.plan?.actions) || _0x36daa0.plan.actions.length === 0) return false;
  return !hasExplicitCanvasActionIntent(_0x75bae1, _0x453454);
}
function getState({ store: _0x5a2c0f, commandContext: _0x8e22d2 } = {}) {
  return (
    _0x5a2c0f?.getStateRaw?.() ||
    _0x5a2c0f?.getState?.() ||
    _0x8e22d2?.store?.getStateRaw?.() ||
    _0x8e22d2?.store?.getState?.() ||
    {}
  );
}
function stripMarkup(_0x1feafd) {
  return String(_0x1feafd || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateText(_0x19910b, _0x5d08c8 = 80) {
  const _0x5573f5 = stripMarkup(_0x19910b);
  return _0x5573f5.length <= _0x5d08c8 ? _0x5573f5 : _0x5573f5.slice(0, Math.max(0, _0x5d08c8 - 3)) + '...';
}
function getProjectId(_0x55a1df = {}) {
  return String(
    _0x55a1df.commandContext?.windowObject?.currentProjectId ||
      globalThis.window?.currentProjectId ||
      'default_v2_project',
  );
}
function getCollectionSize(_0xa207ce) {
  if (Array.isArray(_0xa207ce)) return _0xa207ce.length;
  if (_0xa207ce && typeof _0xa207ce === 'object') return Object.keys(_0xa207ce).length;
  return 0;
}
function buildCanvasSnapshotDigest(_0x5395ce = {}) {
  const _0x518f1c = getState(_0x5395ce);
  return {
    projectId: getProjectId(_0x5395ce),
    nodeCount: getCollectionSize(_0x518f1c.nodes),
    edgeCount: getCollectionSize(_0x518f1c.edges),
    selectedNodeIds: Array.isArray(_0x518f1c.selectedNodeIds)
      ? _0x518f1c.selectedNodeIds.map((_0x32333f) => String(_0x32333f || '')).filter(Boolean)
      : [],
  };
}
function buildPlanSummary(_0xc3b269 = {}) {
  const _0x405c6f = _0xc3b269.confirmationSummary || {},
    _0x150707 = Array.isArray(_0x405c6f.pendingActions) ? _0x405c6f.pendingActions : [],
    _0x4c38d6 = Array.isArray(_0x405c6f.completedActions) ? _0x405c6f.completedActions : [],
    _0x30023d = _0x150707
      .map((_0x3420ff) => _0x3420ff?.label || _0x3420ff?.type || '')
      .filter(Boolean)
      .slice(0, 3),
    _0x21c033 = [];
  if (_0x4c38d6.length) _0x21c033.push('已准备 ' + _0x4c38d6.length + ' 步');
  if (_0x30023d.length) _0x21c033.push('待确认：' + _0x30023d.join('，'));
  if (_0x405c6f.generation?.modelLabel) _0x21c033.push('模型：' + _0x405c6f.generation.modelLabel);
  return (
    _0x405c6f.generation?.promptSummary && _0x21c033.push('Prompt：' + _0x405c6f.generation.promptSummary),
    truncateText(_0x21c033.join('；') || _0xc3b269.reply || '', 240)
  );
}
function buildRecoverySummary(_0x550ca6 = {}) {
  const _0x5db386 = _0x550ca6.failedAction || {},
    _0x3abce8 = _0x5db386.label || _0x5db386.type || '';
  return truncateText(_0x3abce8 ? '失败动作：' + _0x3abce8 : '上次生成失败，可重新规划。', 240);
}
function formatTraceReason(_0x353949 = '') {
  const _0x382b3e = String(_0x353949 || ''),
    _0x572ef8 = {
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
  return _0x572ef8[_0x382b3e] || _0x382b3e || '需要确认';
}
function summarizeDebugTraceForConfirmation(_0x47eea6 = []) {
  if (!Array.isArray(_0x47eea6) || _0x47eea6.length === 0) return [];
  const _0x178fc4 = [];
  for (const _0x104c9c of _0x47eea6) {
    if (_0x104c9c?.type === 'contextual_default_applied' && _0x104c9c.field === 'model') {
      const _0x384141 = String(_0x104c9c.modelId || '').trim();
      _0x178fc4.push(
        _0x384141
          ? '模型选择：' + _0x384141 + '。' + formatTraceReason(_0x104c9c.reason) + '。'
          : '模型选择：' + formatTraceReason(_0x104c9c.reason) + '。',
      );
    }
    if (_0x104c9c?.type === 'params_filtered') {
      const _0x3c1e1e = Array.isArray(_0x104c9c.removedParamIds) ? _0x104c9c.removedParamIds.join('，') : '',
        _0x49f839 = Array.isArray(_0x104c9c.keptParamIds) ? _0x104c9c.keptParamIds.join('，') : '';
      _0x178fc4.push(
        '参数过滤：移除' +
          (_0x3c1e1e || '无') +
          '；保留' +
          (_0x49f839 || '无') +
          '。' +
          formatTraceReason(_0x104c9c.reason) +
          '。',
      );
    }
    _0x104c9c?.type === 'confirmation_required' &&
      _0x178fc4.push('确认原因：' + formatTraceReason(_0x104c9c.reason) + '。');
  }
  return _0x178fc4.slice(0, 6);
}
function getPlainObject(_0x273c8c) {
  return _0x273c8c && typeof _0x273c8c === 'object' && !Array.isArray(_0x273c8c) ? _0x273c8c : {};
}
function readPathSegment(_0x536cbd, _0x20c206) {
  if (_0x536cbd == null) return undefined;
  if (Array.isArray(_0x536cbd) && /^\d+$/.test(_0x20c206)) return _0x536cbd[Number(_0x20c206)];
  return _0x536cbd?.[_0x20c206];
}
function resolveScopedExpression(_0x50853f, _0x57fd9c = {}) {
  const _0x5c71df = String(_0x50853f || '')
      .trim()
      .split('.')
      .map((_0x482409) => _0x482409.trim())
      .filter(Boolean),
    _0xa723d = _0x5c71df.shift();
  if (!_0xa723d || !Object.prototype.hasOwnProperty.call(_0x57fd9c, _0xa723d)) return { ok: false };
  let _0x2d55bc = _0x57fd9c[_0xa723d];
  for (const _0x1f1a53 of _0x5c71df) {
    _0x2d55bc = readPathSegment(_0x2d55bc, _0x1f1a53);
    if (_0x2d55bc === undefined) return { ok: false };
  }
  return { ok: true, value: _0x2d55bc };
}
function resolveScopedValue(_0x3deec0, _0x525e93 = {}) {
  if (typeof _0x3deec0 === 'string') {
    const _0x32353c = /^\$([A-Za-z_][A-Za-z0-9_]*(?:\.(?:[A-Za-z_][A-Za-z0-9_]*|\d+))*)$/.exec(
      _0x3deec0.trim(),
    );
    if (!_0x32353c) return _0x3deec0;
    const _0x5fc438 = resolveScopedExpression(_0x32353c[1], _0x525e93);
    return _0x5fc438.ok ? _0x5fc438.value : _0x3deec0;
  }
  if (Array.isArray(_0x3deec0)) return _0x3deec0.map((_0x303c80) => resolveScopedValue(_0x303c80, _0x525e93));
  if (_0x3deec0 && typeof _0x3deec0 === 'object') {
    const _0x282c4b = {};
    for (const [_0x88d92c, _0x1de3c9] of Object.entries(_0x3deec0)) {
      _0x282c4b[_0x88d92c] = resolveScopedValue(_0x1de3c9, _0x525e93);
    }
    return _0x282c4b;
  }
  return _0x3deec0;
}
function resolveActionArgs(_0x3d534a = {}, _0x46fc92 = {}) {
  return resolveScopedValue(_0x3d534a.args || {}, _0x46fc92);
}
function getCreateActionLabel(_0x1c4c1f, _0x4ed5c3) {
  const _0x4e24c3 = String(_0x1c4c1f || '');
  if (_0x4e24c3 === 'ai-image') return runtimeText('nodeCreateImage', _0x4ed5c3);
  if (_0x4e24c3 === 'ai-video') return runtimeText('nodeCreateVideo', _0x4ed5c3);
  if (_0x4e24c3 === 'ai-audio') return runtimeText('nodeCreateAudio', _0x4ed5c3);
  if (_0x4e24c3 === 'ai-text' || _0x4e24c3 === 'source-text') return runtimeText('nodeCreateText', _0x4ed5c3);
  return runtimeText('nodeCreate', _0x4ed5c3);
}
function getActionLabel(_0x5cb9cc, _0x2000eb = {}, _0x3634f5) {
  const _0x4c6171 = String(_0x5cb9cc || '');
  if (_0x4c6171 === 'node.create') return getCreateActionLabel(_0x2000eb.type, _0x3634f5);
  if (_0x4c6171 === 'node.setPrompt' || _0x4c6171 === 'node.appendPrompt')
    return runtimeText('nodeSetPrompt', _0x3634f5);
  if (_0x4c6171 === 'node.setParams') return runtimeText('nodeSetParams', _0x3634f5);
  if (_0x4c6171 === 'graph.connect') return runtimeText('graphConnect', _0x3634f5);
  if (_0x4c6171 === 'layout.align') return runtimeText('layoutAlign', _0x3634f5);
  if (_0x4c6171 === 'layout.arrangeRow') return runtimeText('layoutArrangeRow', _0x3634f5);
  if (_0x4c6171 === 'layout.arrangeColumn') return runtimeText('layoutArrangeColumn', _0x3634f5);
  if (_0x4c6171 === 'layout.arrangeGrid') return runtimeText('layoutArrangeGrid', _0x3634f5);
  if (_0x4c6171 === 'generation.run') return runtimeText('generationRun', _0x3634f5);
  if (_0x4c6171 === 'node.delete') return runtimeText('nodeDelete', _0x3634f5);
  return _0x4c6171;
}
function summarizeAction(_0xbf1ffc = {}, _0x56eeb1 = {}, _0xacb5c7 = getLocale()) {
  const _0x3f7a11 = resolveActionArgs(_0xbf1ffc, _0x56eeb1);
  return {
    type: String(_0xbf1ffc.type || ''),
    label: getActionLabel(_0xbf1ffc.type, _0x3f7a11, _0xacb5c7),
    args: _0x3f7a11,
    promptSummary: truncateText(_0x3f7a11.prompt || _0x3f7a11.text || '', 60),
  };
}
function getNode(_0x25c262 = {}, _0x4b655f = '') {
  const _0x2f0d40 = String(_0x4b655f || '').trim();
  return _0x2f0d40 ? _0x25c262.nodes?.[_0x2f0d40] || null : null;
}
function isImageNodeType(_0x5199cd = '') {
  return String(_0x5199cd || '') === 'ai-image' || String(_0x5199cd || '') === 'source-image';
}
function summarizeInputSource(_0x138ddb = {}, _0x2a5241 = '', _0x472995 = getLocale()) {
  const _0xf47ec2 = Object.values(_0x138ddb.edges || {}).filter(
      (_0x3822a5) => String(_0x3822a5?.targetId || '') === String(_0x2a5241 || ''),
    ),
    _0x3ce293 = new Set((_0x138ddb.selectedNodeIds || []).map((_0xcf839d) => String(_0xcf839d || ''))),
    _0x4498bd = _0xf47ec2
      .map((_0x1fe2e7) => {
        const _0x40b914 = getNode(_0x138ddb, _0x1fe2e7.sourceId);
        if (!_0x40b914) return '';
        const _0xb3193 = String(_0x40b914.name || _0x40b914.id || _0x1fe2e7.sourceId),
          _0x7cd7ae =
            _0x3ce293.has(String(_0x40b914.id || '')) && isImageNodeType(_0x40b914.type)
              ? runtimeText('selectedImageInput', _0x472995)
              : runtimeText('inputNode', _0x472995);
        return _0x7cd7ae + '：' + _0xb3193;
      })
      .filter(Boolean);
  return _0x4498bd.join('，') || runtimeText('noInputSource', _0x472995);
}
function summarizeGeneration(_0x2c72a4 = {}, _0x295f7d = {}) {
  const _0x1a1754 = _0x295f7d.locale || getLocale(),
    _0x5a301c = _0x2c72a4.scope || {},
    _0x329b02 = (_0x2c72a4.actions || []).find((_0x2b3cae) => _0x2b3cae?.type === 'generation.run');
  if (!_0x329b02) return null;
  const _0x2c0d0e = resolveActionArgs(_0x329b02, _0x5a301c),
    _0x57d406 = String(_0x2c0d0e.nodeId || '').trim(),
    _0x2b99fe = getState(_0x295f7d),
    _0x4cdfd7 = getNode(_0x2b99fe, _0x57d406) || {},
    _0x515471 = resolveModelExecution(_0x4cdfd7.model, { providerHint: _0x4cdfd7.provider }),
    _0x4303ce =
      _0x515471?.modelManifest?.displayName ||
      _0x515471?.modelManifest?.title ||
      _0x4cdfd7.model ||
      runtimeText('defaultModel', _0x1a1754),
    _0x274441 = {
      ...getPlainObject(_0x4cdfd7.generationParams),
      ...getPlainObject(_0x2c0d0e.options?.params),
    };
  return {
    nodeId: _0x57d406,
    model: String(_0x4cdfd7.model || ''),
    modelLabel: _0x4303ce,
    provider: String(_0x4cdfd7.provider || _0x515471?.modelManifest?.provider || ''),
    promptSummary: truncateText(_0x4cdfd7.prompt || _0x4cdfd7.storyboardScript?.prompt || '', 120),
    params: _0x274441,
    inputSource: summarizeInputSource(_0x2b99fe, _0x57d406, _0x1a1754),
  };
}
function buildConfirmationSummary(_0x281a19 = {}, _0x1ff33a = {}) {
  const _0xd6bbdb = _0x1ff33a.locale || getLocale(),
    _0x4878ae = _0x281a19.scope || {};
  return {
    completedActions: (_0x281a19.preExecutedActions || []).map((_0xf81ae3) =>
      summarizeAction(_0xf81ae3, _0x4878ae, _0xd6bbdb),
    ),
    pendingActions: (_0x281a19.actions || []).map((_0x1d8666) =>
      summarizeAction(_0x1d8666, _0x4878ae, _0xd6bbdb),
    ),
    generation: summarizeGeneration(_0x281a19, _0x1ff33a),
    debugTraceSummary: summarizeDebugTraceForConfirmation(_0x1ff33a.debugTrace),
    cancelNotice: runtimeText('cancelNotice', _0xd6bbdb),
  };
}
function buildRecoveryOptions(_0x1a375c = getLocale()) {
  return [
    { id: 'retry', label: runtimeText('retry', _0x1a375c) },
    { id: 'editPrompt', label: runtimeText('editPrompt', _0x1a375c) },
    { id: 'changeModel', label: runtimeText('changeModel', _0x1a375c) },
    { id: 'keepPrepared', label: runtimeText('keepPrepared', _0x1a375c) },
  ];
}
function buildRecovery(_0x357eb0 = {}, _0x27eb81 = {}, _0x2232c6 = getLocale()) {
  const _0x3f47ac = Number(_0x357eb0.raw?.result?.failedIndex),
    _0x166b3c =
      Number.isFinite(_0x3f47ac) && _0x3f47ac >= 0
        ? _0x27eb81.actions?.[_0x3f47ac] || null
        : _0x27eb81.actions?.find((_0x3d1d93) => _0x3d1d93?.type === 'generation.run') || null;
  if (!_0x166b3c) return null;
  return {
    errorCode: _0x357eb0.errorCode || _0x357eb0.raw?.errorCode || '',
    failedAction: summarizeAction(_0x166b3c, _0x27eb81.scope || {}, _0x2232c6),
    options: buildRecoveryOptions(_0x2232c6),
  };
}
function splitSafePrefix(_0x5b81bc = []) {
  const _0x402e7b = _0x5b81bc.findIndex((_0x31a737) => !isSafeAction(_0x31a737));
  if (_0x402e7b <= 0) return { prefix: [], pending: _0x5b81bc };
  return { prefix: _0x5b81bc.slice(0, _0x402e7b), pending: _0x5b81bc.slice(_0x402e7b) };
}
export function createAgentRuntime({
  store: _0x35560c,
  commandContext: _0x52bb15,
  commandRegistry: commandRegistry = canvasCommandRegistry,
  sessionStore: sessionStore = createAgentSessionStore(),
  planner: planner = null,
  buildContext: buildContext = buildAgentContext,
  validatePlan: validatePlan = validateAgentPlan,
  executeActions: executeActions = executeAgentActions,
  localeProvider: localeProvider = getLocale,
} = {}) {
  let _0x390a64 = 0,
    _0x4108bd = null;
  function _0x3be814() {
    return normalizeRuntimeLocale(localeProvider?.() || getLocale());
  }
  function _0x298ae2(_0x4324b1) {
    sessionStore.markUnfinishedOperation?.({
      lastPlanSummary: _0x4324b1,
      lastCanvasSnapshotDigest: buildCanvasSnapshotDigest({ store: _0x35560c, commandContext: _0x52bb15 }),
    });
  }
  function _0x272d23() {
    sessionStore.clearUnfinishedOperation?.();
  }
  async function _0x19d5db(_0x22fe02, _0x185a0c = {}) {
    if (typeof planner !== 'function') return createFailedReply(runtimeText('plannerMissing', _0x3be814()));
    const _0x13794d = buildContext({
      store: _0x35560c || _0x52bb15?.store,
      commandRegistry: commandRegistry,
      sessionStore: sessionStore,
      userMessage: _0x22fe02,
      intent: _0x185a0c.intent,
      targetKind: _0x185a0c.targetKind,
      inputRefs: _0x185a0c.inputRefs,
      contextBudgetChars: _0x185a0c.contextBudgetChars,
    });
    return (
      (_0x4108bd = _0x13794d),
      planner({
        message: _0x22fe02,
        context: _0x13794d,
        history: sessionStore.getHistory?.() || [],
        pendingClarification: sessionStore.getPendingClarification?.(),
        onTrace: (_0x21da81) => sessionStore.recordTrace?.(_0x21da81),
        ..._0x185a0c,
      })
    );
  }
  async function _0xf6ccb9(_0x4a14d0) {
    const _0x54cc1d = await executeActions(_0x4a14d0.plan.actions, {
        commandContext: _0x52bb15,
        initialScope: _0x4a14d0.plan.scope || _0x4a14d0.plan.aliases || {},
      }),
      _0xfe843d =
        _0x4a14d0.plan.preExecutedActions?.length > 0
          ? summarizeExecution(_0x54cc1d, _0x3be814())
          : _0x4a14d0.plan.reply || summarizeExecution(_0x54cc1d, _0x3be814()),
      _0x591b13 = _0x54cc1d.ok ? null : buildRecovery(_0x54cc1d, _0x4a14d0.plan, _0x3be814());
    if (_0x54cc1d.ok) (sessionStore.clearPendingPlan?.(), sessionStore.clearPendingRecovery?.(), _0x272d23());
    else
      _0x591b13
        ? (sessionStore.clearPendingPlan?.(),
          sessionStore.setPendingRecovery?.({ plan: _0x4a14d0.plan, recovery: _0x591b13 }),
          _0x298ae2(buildRecoverySummary(_0x591b13)))
        : (sessionStore.clearPendingPlan?.(), sessionStore.clearPendingRecovery?.(), _0x272d23());
    return (
      sessionStore.pushHistory?.({
        role: 'assistant',
        status: _0x54cc1d.ok ? 'success' : 'failed',
        content: _0xfe843d,
        execution: _0x54cc1d,
        recovery: _0x591b13,
      }),
      {
        ok: _0x54cc1d.ok,
        status: _0x54cc1d.status,
        reply: _0xfe843d,
        plan: _0x4a14d0.plan,
        execution: _0x54cc1d,
        ...(_0x591b13 ? { recovery: _0x591b13 } : {}),
      }
    );
  }
  async function _0x495f8a(_0x54d1ba) {
    const { prefix: _0xc81b3e, pending: _0x966d70 } = splitSafePrefix(_0x54d1ba.plan.actions);
    if (_0xc81b3e.length === 0) return { ok: true, plan: _0x54d1ba.plan, preExecution: null };
    const _0x50aa40 = await executeActions(_0xc81b3e, { commandContext: _0x52bb15 });
    if (!_0x50aa40.ok)
      return (
        sessionStore.pushHistory?.({
          role: 'assistant',
          status: 'failed',
          content: _0x50aa40.message || runtimeText('preActionsFailed', _0x3be814()),
          execution: _0x50aa40,
        }),
        {
          ok: false,
          status: 'failed',
          reply: _0x50aa40.message || runtimeText('preActionsFailed', _0x3be814()),
          message: _0x50aa40.message || runtimeText('preActionsFailed', _0x3be814()),
          execution: _0x50aa40,
        }
      );
    return {
      ok: true,
      preExecution: _0x50aa40,
      plan: {
        ..._0x54d1ba.plan,
        actions: _0x966d70,
        preExecutedActions: _0xc81b3e,
        scope: _0x50aa40.raw?.result?.aliases || {},
      },
    };
  }
  async function _0x4c6cae(
    _0x3c7eba,
    {
      agentContext: agentContext = _0x4108bd,
      userMessage: userMessage = '',
      plannerExtra: plannerExtra = {},
    } = {},
  ) {
    const _0x58b208 = [],
      _0x52e95d = validatePlan(_0x3c7eba, {
        commandRegistry: commandRegistry,
        commandContext: _0x52bb15,
        agentContext: agentContext,
        traceRecorder: (_0x244100) => {
          (_0x58b208.push(_0x244100), sessionStore.recordTrace?.(_0x244100));
        },
      });
    if (!_0x52e95d.ok)
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'failed', content: _0x52e95d.message }),
        createFailedReply(_0x52e95d.message, { validation: _0x52e95d })
      );
    if (_0x52e95d.status === 'chat') {
      const _0x3b06b0 = _0x52e95d.plan.reply || runtimeText('chatFallback', _0x3be814());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'chat', content: _0x3b06b0 }),
        createChatReply(_0x3b06b0, { plan: _0x52e95d.plan })
      );
    }
    if (shouldHoldCanvasActionsForChat(_0x52e95d, userMessage, plannerExtra)) {
      const _0x4fb537 = _0x52e95d.plan.reply || runtimeText('chatIntentRequired', _0x3be814());
      return (
        sessionStore.recordTrace?.({
          type: 'canvas_action_held_for_chat',
          actionTypes: (_0x52e95d.plan.actions || []).map((_0x3a6038) => _0x3a6038.type),
          reason: 'missing explicit canvas action intent',
        }),
        sessionStore.pushHistory?.({ role: 'assistant', status: 'chat', content: _0x4fb537 }),
        createChatReply(_0x4fb537, {
          plan: { ..._0x52e95d.plan, status: 'chat', actions: [], requiresConfirmation: false },
          heldActions: _0x52e95d.plan.actions,
        })
      );
    }
    if (_0x52e95d.status === 'need_clarification')
      return (
        sessionStore.setPendingClarification?.(_0x52e95d.plan),
        sessionStore.pushHistory?.({
          role: 'assistant',
          status: 'need_clarification',
          content: _0x52e95d.plan.question,
        }),
        {
          ok: true,
          status: 'need_clarification',
          reply: _0x52e95d.plan.reply || _0x52e95d.plan.question,
          question: _0x52e95d.plan.question,
          options: _0x52e95d.plan.options,
          plan: _0x52e95d.plan,
        }
      );
    if (_0x52e95d.status === 'need_confirmation') {
      const _0x4d55d9 = await _0x495f8a(_0x52e95d);
      if (!_0x4d55d9.ok) return _0x4d55d9;
      return (
        sessionStore.setPendingPlan?.(_0x4d55d9.plan),
        (_0x4d55d9.plan.confirmationSummary = buildConfirmationSummary(_0x4d55d9.plan, {
          store: _0x35560c,
          commandContext: _0x52bb15,
          locale: _0x3be814(),
          debugTrace: _0x58b208,
        })),
        _0x298ae2(buildPlanSummary(_0x4d55d9.plan)),
        sessionStore.pushHistory?.({
          role: 'assistant',
          status: 'need_confirmation',
          content: _0x4d55d9.plan.reply,
        }),
        {
          ok: true,
          status: 'need_confirmation',
          reply: _0x4d55d9.plan.reply || runtimeText('confirmFallback', _0x3be814()),
          riskLevel: _0x52e95d.riskLevel,
          plan: _0x4d55d9.plan,
          preExecution: _0x4d55d9.preExecution,
        }
      );
    }
    return _0xf6ccb9(_0x52e95d);
  }
  async function _0xb46f69(_0x5b0225, _0x34d5ec = {}) {
    const _0x3d4e25 = String(_0x5b0225 || '').trim();
    if (!_0x3d4e25) return createFailedReply(runtimeText('emptyMessage', _0x3be814()));
    const _0xdffcc = 'agent-run-' + ++_0x390a64;
    (sessionStore.clearPendingPlan?.(),
      sessionStore.clearPendingRecovery?.(),
      sessionStore.clearPendingClarification?.(),
      _0x272d23(),
      sessionStore.setCurrentRun?.({ id: _0xdffcc, status: 'planning', stopped: false }),
      sessionStore.pushHistory?.({ role: 'user', content: _0x3d4e25 }));
    let _0x268bfa;
    try {
      _0x268bfa = await _0x19d5db(_0x3d4e25, _0x34d5ec);
    } catch (_0x106932) {
      const _0x34353c = _0x106932?.message || runtimeText('plannerFailed', _0x3be814());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'failed', content: _0x34353c }),
        sessionStore.setCurrentRun?.({ id: _0xdffcc, status: 'failed', stopped: false }),
        createFailedReply(_0x34353c)
      );
    }
    const _0x5f8bfe = sessionStore.getCurrentRun?.();
    if (_0x5f8bfe?.id === _0xdffcc && _0x5f8bfe.stopped)
      return createFailedReply(runtimeText('runStopped', _0x3be814()), { status: 'stopped' });
    const _0x178442 = await _0x4c6cae(_0x268bfa, { userMessage: _0x3d4e25, plannerExtra: _0x34d5ec });
    return (
      sessionStore.setCurrentRun?.({ id: _0xdffcc, status: _0x178442.status, stopped: false }),
      _0x178442
    );
  }
  async function _0x343c1a(_0x385f76, _0x380915 = {}) {
    const _0x545615 = sessionStore.getPendingClarification?.();
    if (!_0x545615) return createFailedReply(runtimeText('noPendingClarification', _0x3be814()));
    sessionStore.clearPendingClarification?.();
    const _0x3452e9 = String(_0x380915.displayAnswer || _0x385f76 || '').trim(),
      _0x19a02b = { ..._0x380915, clarificationAnswer: _0x385f76, pendingPlan: _0x545615 };
    return (delete _0x19a02b.displayAnswer, _0xb46f69(_0x3452e9, _0x19a02b));
  }
  return {
    sessionStore: sessionStore,
    handleUserMessage: _0xb46f69,
    answerClarification: _0x343c1a,
    async confirmPendingPlan(_0x24263e = {}) {
      const _0x4eb032 = sessionStore.getPendingPlan?.();
      if (!_0x4eb032) return createFailedReply(runtimeText('noPendingPlan', _0x3be814()));
      const _0x278f8a = String(_0x24263e.displayAnswer || '').trim();
      return (
        _0x278f8a && sessionStore.pushHistory?.({ role: 'user', content: _0x278f8a }),
        _0xf6ccb9({
          ok: true,
          status: 'ready',
          plan: { ..._0x4eb032, status: 'ready', requiresConfirmation: false },
        })
      );
    },
    async retryFailedPlan() {
      const _0x5558cd = sessionStore.getPendingRecovery?.();
      if (!_0x5558cd?.plan) return createFailedReply(runtimeText('noPendingRecovery', _0x3be814()));
      return _0xf6ccb9({
        ok: true,
        status: 'ready',
        plan: { ..._0x5558cd.plan, status: 'ready', requiresConfirmation: false },
      });
    },
    keepPreparedPlan() {
      (sessionStore.clearPendingRecovery?.(), sessionStore.clearPendingPlan?.(), _0x272d23());
      const _0x5cab0b = runtimeText('recoveryKept', _0x3be814());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'recovery_kept', content: _0x5cab0b }),
        { ok: true, status: 'recovery_kept', reply: _0x5cab0b }
      );
    },
    cancelPendingPlan() {
      (sessionStore.clearPendingPlan?.(), _0x272d23());
      const _0x1ed0c1 = runtimeText('planCancelled', _0x3be814());
      return (
        sessionStore.pushHistory?.({ role: 'assistant', status: 'cancelled', content: _0x1ed0c1 }),
        { ok: true, status: 'cancelled', reply: _0x1ed0c1 }
      );
    },
    stop() {
      const _0x5c313b = sessionStore.stopCurrentRun?.();
      return { ok: true, status: 'stopped', reply: runtimeText('runStopped', _0x3be814()), run: _0x5c313b };
    },
    resetSession() {
      return (
        sessionStore.reset?.(),
        _0x272d23(),
        { ok: true, status: 'reset', reply: runtimeText('reset', _0x3be814()) }
      );
    },
    startNewConversation() {
      return sessionStore.startNewConversation?.() || null;
    },
    switchConversation(_0x45a544) {
      return sessionStore.switchConversation?.(_0x45a544) || null;
    },
    deleteConversation(_0x3833c6) {
      return sessionStore.deleteConversation?.(_0x3833c6) || null;
    },
    listConversations() {
      return sessionStore.listConversations?.() || [];
    },
    getActiveConversation() {
      return sessionStore.getActiveConversation?.() || null;
    },
  };
}
