import { canvasCommandRegistry, hasCanvasCommandPlanVariableReference } from '../canvasCommands/index.js';
import { AGENT_BATCH_CONFIRM_THRESHOLD, normalizeAgentPlan } from './agentActionSchema.js';
const RISK_ORDER = Object.freeze({ safe: 0, confirm: 1, danger: 2, blocked: 3 });
function maxRisk(_0x226877, _0x4ba7f4) {
  return (RISK_ORDER[_0x4ba7f4] || 0) > (RISK_ORDER[_0x226877] || 0) ? _0x4ba7f4 : _0x226877;
}
function actionSize(_0x43bb88 = {}) {
  const _0x77132e = _0x43bb88.args?.ids;
  if (Array.isArray(_0x77132e)) return _0x77132e.length;
  return _0x43bb88.args?.nodeId ? 1 : 0;
}
function getAliasNodeIdReference(_0x1d48a0) {
  const _0x7cd9d2 = /^\$([A-Za-z_][A-Za-z0-9_]*)\.nodeId$/.exec(String(_0x1d48a0 || '').trim());
  return _0x7cd9d2?.[1] || '';
}
function getAliasEdgeIdReference(_0x222843) {
  const _0x3e965f = /^\$([A-Za-z_][A-Za-z0-9_]*)\.edgeId$/.exec(String(_0x222843 || '').trim());
  return _0x3e965f?.[1] || '';
}
function isSamePlanCreatedNodeReference(_0x4fda11, _0x1dc71f = {}) {
  const _0x2eb6c3 = getAliasNodeIdReference(_0x4fda11);
  return !!_0x2eb6c3 && _0x1dc71f.createdNodeAliases?.has?.(_0x2eb6c3);
}
function isSamePlanCreatedEdgeReference(_0x35b180, _0x2a0685 = {}) {
  const _0x371c55 = getAliasEdgeIdReference(_0x35b180);
  return !!_0x371c55 && _0x2a0685.createdEdgeAliases?.has?.(_0x371c55);
}
function isSamePlanConnectionPreparation(_0x3ed469 = {}, _0x35d3ec = {}) {
  if (_0x3ed469.type !== 'graph.connect') return false;
  return (
    isSamePlanCreatedNodeReference(_0x3ed469.args?.sourceId, _0x35d3ec) ||
    isSamePlanCreatedNodeReference(_0x3ed469.args?.targetId, _0x35d3ec)
  );
}
function isSamePlanNodePreparation(_0x2fabbe = {}, _0x59f369 = {}) {
  if (
    _0x2fabbe.type === 'node.setPrompt' ||
    _0x2fabbe.type === 'node.appendPrompt' ||
    _0x2fabbe.type === 'node.setParams' ||
    _0x2fabbe.type === 'node.setModel' ||
    _0x2fabbe.type === 'node.changeModel'
  )
    return isSamePlanCreatedNodeReference(_0x2fabbe.args?.nodeId, _0x59f369);
  if (_0x2fabbe.type === 'node.setInputSlot') {
    if (isSamePlanCreatedEdgeReference(_0x2fabbe.args?.edgeId, _0x59f369)) return true;
    return (
      isSamePlanCreatedNodeReference(_0x2fabbe.args?.sourceId, _0x59f369) ||
      isSamePlanCreatedNodeReference(_0x2fabbe.args?.targetId, _0x59f369)
    );
  }
  return false;
}
function isExistingNodeMutationAction(_0x18c65f = {}) {
  return (
    _0x18c65f.type === 'graph.connect' ||
    _0x18c65f.type === 'node.setPrompt' ||
    _0x18c65f.type === 'node.appendPrompt' ||
    _0x18c65f.type === 'node.setParams' ||
    _0x18c65f.type === 'node.setModel' ||
    _0x18c65f.type === 'node.changeModel' ||
    _0x18c65f.type === 'node.setInputSlot'
  );
}
function getMutationConfirmReason(_0x2c6539 = {}) {
  if (_0x2c6539.type === 'graph.connect') return 'existing node connection change requires confirmation';
  if (_0x2c6539.type === 'node.setPrompt' || _0x2c6539.type === 'node.appendPrompt')
    return 'existing node prompt change requires confirmation';
  if (_0x2c6539.type === 'node.setParams')
    return 'existing node generation params change requires confirmation';
  if (_0x2c6539.type === 'node.setModel' || _0x2c6539.type === 'node.changeModel')
    return 'existing node model change requires confirmation';
  if (_0x2c6539.type === 'node.setInputSlot') return 'existing input slot change requires confirmation';
  return '';
}
function getActionRisk(_0x5709a0, _0x5d843d, _0x4e0ccd = {}) {
  let _0x3dcbc6 = _0x5d843d?.riskLevel || 'safe',
    _0x51cb07 = _0x3dcbc6 !== 'safe' ? 'command risk requires confirmation' : '';
  return (
    _0x5709a0.type === 'generation.run' &&
      ((_0x3dcbc6 = maxRisk(_0x3dcbc6, 'confirm')), (_0x51cb07 = 'generation run requires confirmation')),
    _0x5709a0.type === 'node.delete' &&
      ((_0x3dcbc6 = maxRisk(_0x3dcbc6, 'danger')), (_0x51cb07 = 'node delete requires confirmation')),
    isExistingNodeMutationAction(_0x5709a0) &&
      !isSamePlanNodePreparation(_0x5709a0, _0x4e0ccd) &&
      !isSamePlanConnectionPreparation(_0x5709a0, _0x4e0ccd) &&
      ((_0x3dcbc6 = maxRisk(_0x3dcbc6, 'confirm')), (_0x51cb07 = getMutationConfirmReason(_0x5709a0))),
    actionSize(_0x5709a0) > AGENT_BATCH_CONFIRM_THRESHOLD &&
      ((_0x3dcbc6 = maxRisk(_0x3dcbc6, 'confirm')), (_0x51cb07 = 'large batch requires confirmation')),
    { risk: _0x3dcbc6, reason: _0x51cb07 }
  );
}
function buildFailure(_0x14d1cc, _0x1b9d0a = undefined) {
  return {
    ok: false,
    status: 'failed',
    errorCode: 'AGENT_PLAN_INVALID',
    message: _0x14d1cc,
    details: _0x1b9d0a,
  };
}
function isImageNodeType(_0x386236 = '') {
  const _0x166cc7 = String(_0x386236 || '');
  return _0x166cc7 === 'ai-image' || _0x166cc7 === 'source-image';
}
function findSelectedImageNodeId(_0x2dbbdc = {}) {
  const _0x476f9c = _0x2dbbdc?.canvas || {},
    _0xffb5cd = Array.isArray(_0x476f9c.selectedNodes) ? _0x476f9c.selectedNodes : [],
    _0x5cce40 = _0xffb5cd.find((_0x2c22bc) => isImageNodeType(_0x2c22bc?.type));
  if (_0x5cce40?.id) return String(_0x5cce40.id);
  const _0x5b2866 = Array.isArray(_0x476f9c.selectedNodeIds)
    ? _0x476f9c.selectedNodeIds.map((_0x3ac5f8) => String(_0x3ac5f8 || '')).filter(Boolean)
    : [];
  if (_0x5b2866.length === 0) return '';
  const _0x5dfa26 = new Set(_0x5b2866),
    _0x5da47b = Array.isArray(_0x476f9c.nodes) ? _0x476f9c.nodes : [];
  return String(
    _0x5da47b.find(
      (_0x2cf931) => _0x5dfa26.has(String(_0x2cf931?.id || '')) && isImageNodeType(_0x2cf931?.type),
    )?.id || '',
  );
}
function modelAllowsImageInput(_0x4fa863 = {}) {
  const _0x239c92 =
      _0x4fa863?.inputSlots && typeof _0x4fa863.inputSlots === 'object' ? _0x4fa863.inputSlots : {},
    _0x53978a = Array.isArray(_0x239c92.allowedKinds) ? _0x239c92.allowedKinds : [];
  if (_0x53978a.includes('image')) return true;
  const _0x39aaf8 = Number(_0x239c92.maxByKind?.image);
  return Number.isFinite(_0x39aaf8) && _0x39aaf8 > 0;
}
function modelRequiresMissingMedia(_0x3fd00b = {}) {
  const _0x21df37 =
      _0x3fd00b?.inputSlots && typeof _0x3fd00b.inputSlots === 'object' ? _0x3fd00b.inputSlots : {},
    _0x23dc17 = _0x21df37.minByKind || {};
  if (Number(_0x23dc17.video) > 0) return true;
  if (Number(_0x23dc17.audio) > 0) return true;
  const _0x1f1f0c = Array.isArray(_0x21df37.fixedSlots) ? _0x21df37.fixedSlots : [];
  return _0x1f1f0c.some(
    (_0x5d05e3) =>
      _0x5d05e3?.required === true &&
      (String(_0x5d05e3?.kind || '') === 'video' || String(_0x5d05e3?.kind || '') === 'audio'),
  );
}
function getModelFieldIds(_0x1a50d4 = {}) {
  return new Set(
    (Array.isArray(_0x1a50d4?.uiSchema?.fields) ? _0x1a50d4.uiSchema.fields : [])
      .map((_0x3d6db6) => String(_0x3d6db6?.id || '').trim())
      .filter(Boolean),
  );
}
function findImageToVideoModel(_0x39c656 = {}) {
  const _0x38059b = Array.isArray(_0x39c656?.canvas?.availableModels) ? _0x39c656.canvas.availableModels : [];
  return (
    _0x38059b.find(
      (_0x53f363) =>
        _0x53f363?.kind === 'video' &&
        _0x53f363?.modelId &&
        modelAllowsImageInput(_0x53f363) &&
        !modelRequiresMissingMedia(_0x53f363),
    ) || null
  );
}
function findContextModel(_0x5b60ae = {}, _0x3deca4 = '') {
  const _0x5ec9ad = String(_0x3deca4 || '').trim();
  if (!_0x5ec9ad) return null;
  const _0x39cced = Array.isArray(_0x5b60ae?.canvas?.availableModels) ? _0x5b60ae.canvas.availableModels : [];
  return _0x39cced.find((_0x21cd98) => _0x21cd98?.modelId === _0x5ec9ad) || null;
}
function applyContextualPlanDefaults(_0x2adf85, _0x1e8258 = {}) {
  const _0x43c392 = findSelectedImageNodeId(_0x1e8258),
    _0x367544 = _0x43c392 ? findImageToVideoModel(_0x1e8258) : null;
  if (!_0x43c392 || !_0x367544) return { plan: _0x2adf85, trace: [] };
  const _0x46eaf7 = new Map(),
    _0x4c9a3d = [];
  let _0x35a44b = false;
  const _0x295ee1 = [];
  for (const _0x5f3911 of _0x2adf85.actions) {
    let _0x351091 = _0x5f3911;
    if (_0x5f3911.type === 'node.create' && _0x5f3911.args?.type === 'ai-video') {
      const _0x138610 = String(_0x5f3911.args.model || _0x5f3911.args.modelId || '').trim(),
        _0x925c24 = _0x138610 ? findContextModel(_0x1e8258, _0x138610) : null,
        _0x5b5b15 = _0x925c24 || _0x367544;
      ((!_0x138610 || !_0x925c24) &&
        _0x5b5b15?.modelId &&
        ((_0x351091 = {
          ..._0x5f3911,
          args: { ..._0x5f3911.args, model: _0x5b5b15.modelId, provider: _0x5b5b15.provider || '' },
        }),
        (_0x35a44b = true),
        _0x295ee1.push({
          type: 'contextual_default_applied',
          field: 'model',
          actionType: _0x5f3911.type,
          alias: String(_0x5f3911.alias || _0x5f3911.as || ''),
          selectedImageId: _0x43c392,
          modelId: _0x5b5b15.modelId,
          provider: _0x5b5b15.provider || '',
          reason: _0x925c24
            ? 'requested model was available in context'
            : 'selected image has compatible image-to-video model',
        })),
        _0x5f3911.alias && _0x5b5b15 && _0x46eaf7.set(_0x5f3911.alias, getModelFieldIds(_0x5b5b15)));
    }
    if (_0x351091.type === 'node.setParams') {
      const _0x5067f4 = getAliasNodeIdReference(_0x351091.args?.nodeId),
        _0x4556ec = _0x5067f4 ? _0x46eaf7.get(_0x5067f4) : null,
        _0x859546 =
          _0x351091.args?.params &&
          typeof _0x351091.args.params === 'object' &&
          !Array.isArray(_0x351091.args.params)
            ? _0x351091.args.params
            : null;
      if (_0x4556ec && _0x859546) {
        const _0x107aa8 = {};
        for (const [_0xfd2eea, _0x4de2e8] of Object.entries(_0x859546)) {
          if (_0x4556ec.has(_0xfd2eea)) _0x107aa8[_0xfd2eea] = _0x4de2e8;
        }
        if (Object.keys(_0x107aa8).length !== Object.keys(_0x859546).length) {
          ((_0x35a44b = true),
            _0x295ee1.push({
              type: 'params_filtered',
              actionType: _0x351091.type,
              alias: _0x5067f4,
              keptParamIds: Object.keys(_0x107aa8),
              removedParamIds: Object.keys(_0x859546).filter((_0x3a1bdd) => !_0x4556ec.has(_0x3a1bdd)),
              reason: 'target model uiSchema does not declare removed params',
            }));
          if (Object.keys(_0x107aa8).length === 0) continue;
          _0x351091 = { ..._0x351091, args: { ..._0x351091.args, params: _0x107aa8 } };
        }
      }
    }
    _0x4c9a3d.push(_0x351091);
  }
  return { plan: _0x35a44b ? { ..._0x2adf85, actions: _0x4c9a3d } : _0x2adf85, trace: _0x295ee1 };
}
function buildRiskContext() {
  return { createdNodeAliases: new Set(), createdEdgeAliases: new Set() };
}
function rememberActionAlias(_0x876b8a = {}, _0x4c30d2 = {}) {
  const _0x1f14ad = String(_0x876b8a.alias || '').trim();
  if (!_0x1f14ad) return;
  (_0x876b8a.type === 'node.create' && _0x4c30d2.createdNodeAliases.add(_0x1f14ad),
    isSamePlanConnectionPreparation(_0x876b8a, _0x4c30d2) && _0x4c30d2.createdEdgeAliases.add(_0x1f14ad));
}
export function validateAgentPlan(
  _0x57cbdf,
  {
    commandRegistry: commandRegistry = canvasCommandRegistry,
    commandContext: commandContext = {},
    agentContext: agentContext = {},
    traceRecorder: traceRecorder = null,
  } = {},
) {
  const _0x383e2d = applyContextualPlanDefaults(normalizeAgentPlan(_0x57cbdf), agentContext),
    _0x40d80d = _0x383e2d.plan;
  for (const _0x37a850 of _0x383e2d.trace) traceRecorder?.(_0x37a850);
  if (_0x40d80d.status === 'failed')
    return {
      ok: false,
      status: 'failed',
      errorCode: 'AGENT_PLAN_FAILED',
      message: _0x40d80d.reply || 'Agent planner failed.',
      plan: _0x40d80d,
    };
  if (_0x40d80d.status === 'chat')
    return {
      ok: true,
      status: 'chat',
      riskLevel: 'safe',
      plan: { ..._0x40d80d, status: 'chat', actions: [], requiresConfirmation: false },
    };
  if (_0x40d80d.status === 'need_clarification') {
    if (!_0x40d80d.question)
      return buildFailure('Clarification plans require question.', { plan: _0x40d80d });
    return { ok: true, status: 'need_clarification', plan: _0x40d80d, riskLevel: 'safe' };
  }
  if (_0x40d80d.actions.length === 0)
    return buildFailure('Ready or confirmation plans require at least one action.', { plan: _0x40d80d });
  let _0x4ae281 = _0x40d80d.riskLevel || 'safe';
  const _0x8e762b = [],
    _0x4eac85 = buildRiskContext();
  for (const _0x29a580 of _0x40d80d.actions) {
    const _0x26b455 = commandRegistry?.get?.(_0x29a580.type);
    if (!_0x26b455)
      return {
        ok: false,
        status: 'failed',
        errorCode: 'UNKNOWN_AGENT_ACTION',
        message: 'Unknown canvas command in agent plan: ' + _0x29a580.type,
        plan: _0x40d80d,
      };
    const { risk: _0x3dee98, reason: _0x477731 } = getActionRisk(_0x29a580, _0x26b455, _0x4eac85);
    if (_0x3dee98 === 'blocked')
      return {
        ok: false,
        status: 'failed',
        errorCode: 'BLOCKED_AGENT_ACTION',
        message: 'Blocked canvas command in agent plan: ' + _0x29a580.type,
        plan: _0x40d80d,
      };
    const _0x20beca = hasCanvasCommandPlanVariableReference(_0x29a580.args);
    if (!_0x20beca && typeof _0x26b455.validate === 'function') {
      const _0x4dbfa0 = _0x26b455.validate(_0x29a580.args, commandContext);
      if (_0x4dbfa0?.ok === false)
        return {
          ok: false,
          status: 'failed',
          errorCode: _0x4dbfa0.errorCode || 'ACTION_ARGS_INVALID',
          message: _0x4dbfa0.message || 'Invalid args for ' + _0x29a580.type,
          details: _0x4dbfa0.details,
          plan: _0x40d80d,
        };
    }
    _0x4ae281 = maxRisk(_0x4ae281, _0x3dee98);
    _0x3dee98 !== 'safe' &&
      _0x477731 &&
      traceRecorder?.({
        type: 'action_risk_elevated',
        actionType: _0x29a580.type,
        riskLevel: _0x3dee98,
        reason: _0x477731,
      });
    const _0xc416b1 = { ..._0x29a580, riskLevel: _0x3dee98, ...(_0x477731 ? { riskReason: _0x477731 } : {}) };
    (_0x8e762b.push(_0xc416b1), rememberActionAlias(_0x29a580, _0x4eac85));
  }
  const _0x162754 =
    _0x4ae281 === 'confirm' ||
    _0x4ae281 === 'danger' ||
    _0x40d80d.requiresConfirmation === true ||
    _0x40d80d.status === 'need_confirmation';
  if (_0x162754) {
    const _0x1c0e02 =
      _0x8e762b.find((_0xd89f38) => String(_0xd89f38.riskLevel || 'safe') !== 'safe') || _0x8e762b[0] || null;
    return (
      traceRecorder?.({
        type: 'confirmation_required',
        actionType: String(_0x1c0e02?.type || ''),
        riskLevel: _0x4ae281,
        reason:
          _0x40d80d.requiresConfirmation === true || _0x40d80d.status === 'need_confirmation'
            ? 'planner requested confirmation'
            : _0x1c0e02?.riskReason || 'action risk requires confirmation',
      }),
      {
        ok: true,
        status: 'need_confirmation',
        riskLevel: _0x4ae281,
        plan: { ..._0x40d80d, status: 'need_confirmation', requiresConfirmation: true, actions: _0x8e762b },
      }
    );
  }
  return {
    ok: true,
    status: 'ready',
    riskLevel: _0x4ae281,
    plan: { ..._0x40d80d, status: 'ready', actions: _0x8e762b },
  };
}
