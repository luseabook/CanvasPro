import { canvasCommandRegistry, hasCanvasCommandPlanVariableReference } from '../canvasCommands/index.js';
import { AGENT_BATCH_CONFIRM_THRESHOLD, normalizeAgentPlan } from './agentActionSchema.js';
const RISK_ORDER = Object.freeze({ safe: 0, confirm: 1, danger: 2, blocked: 3 });
function maxRisk(value, item) {
  return (RISK_ORDER[item] || 0) > (RISK_ORDER[value] || 0) ? item : value;
}
function actionSize(options = {}) {
  const list = options.args?.ids;
  if (Array.isArray(list)) return list.length;
  return options.args?.nodeId ? 1 : 0;
}
function getAliasNodeIdReference(key) {
  const index = /^\$([A-Za-z_][A-Za-z0-9_]*)\.nodeId$/.exec(String(key || '').trim());
  return index?.[1] || '';
}
function getAliasEdgeIdReference(result) {
  const data = /^\$([A-Za-z_][A-Za-z0-9_]*)\.edgeId$/.exec(String(result || '').trim());
  return data?.[1] || '';
}
function isSamePlanCreatedNodeReference(target, source = {}) {
  const aliasNodeIdReference = getAliasNodeIdReference(target);
  return !!aliasNodeIdReference && source.createdNodeAliases?.has?.(aliasNodeIdReference);
}
function isSamePlanCreatedEdgeReference(next, current = {}) {
  const aliasEdgeIdReference = getAliasEdgeIdReference(next);
  return !!aliasEdgeIdReference && current.createdEdgeAliases?.has?.(aliasEdgeIdReference);
}
function isSamePlanConnectionPreparation(options2 = {}, entry = {}) {
  if (options2.type !== 'graph.connect') return false;
  return (
    isSamePlanCreatedNodeReference(options2.args?.sourceId, entry) ||
    isSamePlanCreatedNodeReference(options2.args?.targetId, entry)
  );
}
function isSamePlanNodePreparation(options3 = {}, record = {}) {
  if (
    options3.type === 'node.setPrompt' ||
    options3.type === 'node.appendPrompt' ||
    options3.type === 'node.setParams' ||
    options3.type === 'node.setModel' ||
    options3.type === 'node.changeModel'
  )
    return isSamePlanCreatedNodeReference(options3.args?.nodeId, record);
  if (options3.type === 'node.setInputSlot') {
    if (isSamePlanCreatedEdgeReference(options3.args?.edgeId, record)) return true;
    return (
      isSamePlanCreatedNodeReference(options3.args?.sourceId, record) ||
      isSamePlanCreatedNodeReference(options3.args?.targetId, record)
    );
  }
  return false;
}
function isExistingNodeMutationAction(options4 = {}) {
  return (
    options4.type === 'graph.connect' ||
    options4.type === 'node.setPrompt' ||
    options4.type === 'node.appendPrompt' ||
    options4.type === 'node.setParams' ||
    options4.type === 'node.setModel' ||
    options4.type === 'node.changeModel' ||
    options4.type === 'node.setInputSlot'
  );
}
function getMutationConfirmReason(options5 = {}) {
  if (options5.type === 'graph.connect') return 'existing node connection change requires confirmation';
  if (options5.type === 'node.setPrompt' || options5.type === 'node.appendPrompt')
    return 'existing node prompt change requires confirmation';
  if (options5.type === 'node.setParams')
    return 'existing node generation params change requires confirmation';
  if (options5.type === 'node.setModel' || options5.type === 'node.changeModel')
    return 'existing node model change requires confirmation';
  if (options5.type === 'node.setInputSlot') return 'existing input slot change requires confirmation';
  return '';
}
function getActionRisk(payload, handle, state = {}) {
  let risk = handle?.riskLevel || 'safe',
    reason = risk !== 'safe' ? 'command risk requires confirmation' : '';
  return (
    payload.type === 'generation.run' &&
      ((risk = maxRisk(risk, 'confirm')), (reason = 'generation run requires confirmation')),
    payload.type === 'node.delete' &&
      ((risk = maxRisk(risk, 'danger')), (reason = 'node delete requires confirmation')),
    isExistingNodeMutationAction(payload) &&
      !isSamePlanNodePreparation(payload, state) &&
      !isSamePlanConnectionPreparation(payload, state) &&
      ((risk = maxRisk(risk, 'confirm')), (reason = getMutationConfirmReason(payload))),
    actionSize(payload) > AGENT_BATCH_CONFIRM_THRESHOLD &&
      ((risk = maxRisk(risk, 'confirm')), (reason = 'large batch requires confirmation')),
    { risk: risk, reason: reason }
  );
}
function buildFailure(message, details = undefined) {
  return {
    ok: false,
    status: 'failed',
    errorCode: 'AGENT_PLAN_INVALID',
    message: message,
    details: details,
  };
}
function isImageNodeType(config = '') {
  const scope = String(config || '');
  return scope === 'ai-image' || scope === 'source-image';
}
function findSelectedImageNodeId(canvas = {}) {
  const input = canvas?.canvas || {},
    list2 = Array.isArray(input.selectedNodes) ? input.selectedNodes : [],
    output = list2.find((item2) => isImageNodeType(item2?.type));
  if (output?.id) return String(output.id);
  const list3 = Array.isArray(input.selectedNodeIds)
    ? input.selectedNodeIds.map((item3) => String(item3 || '')).filter(Boolean)
    : [];
  if (list3.length === 0) return '';
  const map = new Set(list3),
    list4 = Array.isArray(input.nodes) ? input.nodes : [];
  return String(
    list4.find((item4) => map.has(String(item4?.id || '')) && isImageNodeType(item4?.type))?.id || '',
  );
}
function modelAllowsImageInput(options6 = {}) {
  const value2 = options6?.inputSlots && typeof options6.inputSlots === 'object' ? options6.inputSlots : {},
    list5 = Array.isArray(value2.allowedKinds) ? value2.allowedKinds : [];
  if (list5.includes('image')) return true;
  const count = Number(value2.maxByKind?.image);
  return Number.isFinite(count) && count > 0;
}
function modelRequiresMissingMedia(options7 = {}) {
  const value3 = options7?.inputSlots && typeof options7.inputSlots === 'object' ? options7.inputSlots : {},
    value4 = value3.minByKind || {};
  if (Number(value4.video) > 0) return true;
  if (Number(value4.audio) > 0) return true;
  const list6 = Array.isArray(value3.fixedSlots) ? value3.fixedSlots : [];
  return list6.some(
    (item5) =>
      item5?.required === true &&
      (String(item5?.kind || '') === 'video' || String(item5?.kind || '') === 'audio'),
  );
}
function getModelFieldIds(options8 = {}) {
  return new Set(
    (Array.isArray(options8?.uiSchema?.fields) ? options8.uiSchema.fields : [])
      .map((item6) => String(item6?.id || '').trim())
      .filter(Boolean),
  );
}
function findImageToVideoModel(canvas2 = {}) {
  const list7 = Array.isArray(canvas2?.canvas?.availableModels) ? canvas2.canvas.availableModels : [];
  return (
    list7.find(
      (item7) =>
        item7?.kind === 'video' &&
        item7?.modelId &&
        modelAllowsImageInput(item7) &&
        !modelRequiresMissingMedia(item7),
    ) || null
  );
}
function findContextModel(canvas3 = {}, value5 = '') {
  const enabled = String(value5 || '').trim();
  if (!enabled) return null;
  const list8 = Array.isArray(canvas3?.canvas?.availableModels) ? canvas3.canvas.availableModels : [];
  return list8.find((item8) => item8?.modelId === enabled) || null;
}
function applyContextualPlanDefaults(plan, value6 = {}) {
  const selectedImageId = findSelectedImageNodeId(value6),
    enabled2 = selectedImageId ? findImageToVideoModel(value6) : null;
  if (!selectedImageId || !enabled2) return { plan: plan, trace: [] };
  const map2 = new Map(),
    actions = [];
  let plan2 = false;
  const trace = [];
  for (const actionType of plan.actions) {
    let actionType2 = actionType;
    if (actionType.type === 'node.create' && actionType.args?.type === 'ai-video') {
      const enabled3 = String(actionType.args.model || actionType.args.modelId || '').trim(),
        reason2 = enabled3 ? findContextModel(value6, enabled3) : null,
        model = reason2 || enabled2;
      ((!enabled3 || !reason2) &&
        model?.modelId &&
        ((actionType2 = {
          ...actionType,
          args: { ...actionType.args, model: model.modelId, provider: model.provider || '' },
        }),
        (plan2 = true),
        trace.push({
          type: 'contextual_default_applied',
          field: 'model',
          actionType: actionType.type,
          alias: String(actionType.alias || actionType.as || ''),
          selectedImageId: selectedImageId,
          modelId: model.modelId,
          provider: model.provider || '',
          reason: reason2
            ? 'requested model was available in context'
            : 'selected image has compatible image-to-video model',
        })),
        actionType.alias && model && map2.set(actionType.alias, getModelFieldIds(model)));
    }
    if (actionType2.type === 'node.setParams') {
      const alias = getAliasNodeIdReference(actionType2.args?.nodeId),
        map3 = alias ? map2.get(alias) : null,
        value7 =
          actionType2.args?.params &&
          typeof actionType2.args.params === 'object' &&
          !Array.isArray(actionType2.args.params)
            ? actionType2.args.params
            : null;
      if (map3 && value7) {
        const params = {};
        for (const [value8, value9] of Object.entries(value7)) {
          if (map3.has(value8)) params[value8] = value9;
        }
        if (Object.keys(params).length !== Object.keys(value7).length) {
          ((plan2 = true),
            trace.push({
              type: 'params_filtered',
              actionType: actionType2.type,
              alias: alias,
              keptParamIds: Object.keys(params),
              removedParamIds: Object.keys(value7).filter((item9) => !map3.has(item9)),
              reason: 'target model uiSchema does not declare removed params',
            }));
          if (Object.keys(params).length === 0) continue;
          actionType2 = { ...actionType2, args: { ...actionType2.args, params: params } };
        }
      }
    }
    actions.push(actionType2);
  }
  return { plan: plan2 ? { ...plan, actions: actions } : plan, trace: trace };
}
function buildRiskContext() {
  return { createdNodeAliases: new Set(), createdEdgeAliases: new Set() };
}
function rememberActionAlias(options9 = {}, value10 = {}) {
  const enabled4 = String(options9.alias || '').trim();
  if (!enabled4) return;
  (options9.type === 'node.create' && value10.createdNodeAliases.add(enabled4),
    isSamePlanConnectionPreparation(options9, value10) && value10.createdEdgeAliases.add(enabled4));
}
export function validateAgentPlan(
  value11,
  {
    commandRegistry: commandRegistry = canvasCommandRegistry,
    commandContext: commandContext = {},
    agentContext: agentContext = {},
    traceRecorder: traceRecorder = null,
  } = {},
) {
  const contextualPlanDefaults = applyContextualPlanDefaults(normalizeAgentPlan(value11), agentContext),
    message2 = contextualPlanDefaults.plan;
  for (const value12 of contextualPlanDefaults.trace) traceRecorder?.(value12);
  if (message2.status === 'failed')
    return {
      ok: false,
      status: 'failed',
      errorCode: 'AGENT_PLAN_FAILED',
      message: message2.reply || 'Agent planner failed.',
      plan: message2,
    };
  if (message2.status === 'chat')
    return {
      ok: true,
      status: 'chat',
      riskLevel: 'safe',
      plan: { ...message2, status: 'chat', actions: [], requiresConfirmation: false },
    };
  if (message2.status === 'need_clarification') {
    if (!message2.question) return buildFailure('Clarification plans require question.', { plan: message2 });
    return { ok: true, status: 'need_clarification', plan: message2, riskLevel: 'safe' };
  }
  if (message2.actions.length === 0)
    return buildFailure('Ready or confirmation plans require at least one action.', { plan: message2 });
  let riskLevel = message2.riskLevel || 'safe';
  const actions2 = [],
    riskContext = buildRiskContext();
  for (const actionType3 of message2.actions) {
    const enabled5 = commandRegistry?.get?.(actionType3.type);
    if (!enabled5)
      return {
        ok: false,
        status: 'failed',
        errorCode: 'UNKNOWN_AGENT_ACTION',
        message: 'Unknown canvas command in agent plan: ' + actionType3.type,
        plan: message2,
      };
    const { risk: risk2, reason: reason3 } = getActionRisk(actionType3, enabled5, riskContext);
    if (risk2 === 'blocked')
      return {
        ok: false,
        status: 'failed',
        errorCode: 'BLOCKED_AGENT_ACTION',
        message: 'Blocked canvas command in agent plan: ' + actionType3.type,
        plan: message2,
      };
    const hasCanvasCommandPlanVariableReference2 = hasCanvasCommandPlanVariableReference(actionType3.args);
    if (!hasCanvasCommandPlanVariableReference2 && typeof enabled5.validate === 'function') {
      const errorCode = enabled5.validate(actionType3.args, commandContext);
      if (errorCode?.ok === false)
        return {
          ok: false,
          status: 'failed',
          errorCode: errorCode.errorCode || 'ACTION_ARGS_INVALID',
          message: errorCode.message || 'Invalid args for ' + actionType3.type,
          details: errorCode.details,
          plan: message2,
        };
    }
    riskLevel = maxRisk(riskLevel, risk2);
    risk2 !== 'safe' &&
      reason3 &&
      traceRecorder?.({
        type: 'action_risk_elevated',
        actionType: actionType3.type,
        riskLevel: risk2,
        reason: reason3,
      });
    const value13 = { ...actionType3, riskLevel: risk2, ...(reason3 ? { riskReason: reason3 } : {}) };
    (actions2.push(value13), rememberActionAlias(actionType3, riskContext));
  }
  const value14 =
    riskLevel === 'confirm' ||
    riskLevel === 'danger' ||
    message2.requiresConfirmation === true ||
    message2.status === 'need_confirmation';
  if (value14) {
    const value15 =
      actions2.find((item10) => String(item10.riskLevel || 'safe') !== 'safe') || actions2[0] || null;
    return (
      traceRecorder?.({
        type: 'confirmation_required',
        actionType: String(value15?.type || ''),
        riskLevel: riskLevel,
        reason:
          message2.requiresConfirmation === true || message2.status === 'need_confirmation'
            ? 'planner requested confirmation'
            : value15?.riskReason || 'action risk requires confirmation',
      }),
      {
        ok: true,
        status: 'need_confirmation',
        riskLevel: riskLevel,
        plan: { ...message2, status: 'need_confirmation', requiresConfirmation: true, actions: actions2 },
      }
    );
  }
  return {
    ok: true,
    status: 'ready',
    riskLevel: riskLevel,
    plan: { ...message2, status: 'ready', actions: actions2 },
  };
}
