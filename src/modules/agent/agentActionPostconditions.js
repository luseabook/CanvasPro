import { executeCanvasCommand } from '../canvasCommands/index.js';
const AUTO_REPAIRABLE_COMMANDS = new Set([
    'graph.connect',
    'graph.disconnect',
    'layout.align',
    'layout.arrangeColumn',
    'layout.arrangeGrid',
    'layout.arrangeRow',
    'layout.distribute',
    'layout.moveNearNode',
    'media.resetSize',
    'node.changeModel',
    'node.rename',
    'node.select',
    'node.setInputSlot',
    'node.setModel',
    'node.setParams',
    'node.setPrompt',
  ]),
  STORE_VERIFIED_COMMANDS = new Set([
    'audio.separate',
    'clipboard.paste',
    'collage.createFromSelection',
    'generation.cancel',
    'generation.resume',
    'generation.run',
    'generation.runBatch',
    'graph.connect',
    'graph.disconnect',
    'image.splitGrid',
    'layout.align',
    'layout.arrangeColumn',
    'layout.arrangeGrid',
    'layout.arrangeRow',
    'layout.distribute',
    'layout.moveNearNode',
    'media.resetSize',
    'node.appendPrompt',
    'node.changeModel',
    'node.create',
    'node.createConnected',
    'node.delete',
    'node.duplicate',
    'node.group',
    'node.rename',
    'node.select',
    'node.setInputSlot',
    'node.setModel',
    'node.setParams',
    'node.setPrompt',
    'node.ungroup',
    'scene.camera.addKeyframe',
    'scene.camera.updateTimeline',
    'scene.compose',
    'scene.mannequin.setPose',
    'storyboard.createFromImages',
    'storyboard.createGridFromNode',
    'task.retry',
    'video.extractKeyframes',
    'video.reverse',
    'video.separateAv',
  ]),
  RESULT_VERIFIED_COMMANDS = new Set([
    'clipboard.copy',
    'node.exportSelected',
    'task.focusResult',
    'viewport.fitAll',
    'viewport.focusNodes',
  ]);
export function getAgentActionPostconditionPolicy(_0x2f084e = '') {
  const _0x6cd88 = normalizeId(_0x2f084e);
  if (STORE_VERIFIED_COMMANDS['has'](_0x6cd88)) return 'store';
  if (RESULT_VERIFIED_COMMANDS['has'](_0x6cd88)) return 'result';
  return 'unclassified';
}
const TERMINAL_GENERATION_STATUSES = new Set(['completed', 'complete', 'success', 'succeeded']),
  ACCEPTED_GENERATION_STATUSES = new Set([
    ...TERMINAL_GENERATION_STATUSES,
    'submitted',
    'pending',
    'queued',
    'running',
    'processing',
  ]);
function normalizeId(_0xacdb5) {
  return String(_0xacdb5 || '')['trim']();
}
function uniqueIds(_0x1a546a = []) {
  return [...new Set(_0x1a546a['map'](normalizeId)['filter'](Boolean))];
}
function readCanvasState(_0x5471f9 = {}) {
  const _0x2023bd = _0x5471f9['store'] || _0x5471f9['graphStore'];
  return _0x2023bd?.['getStateRaw']?.() ?? _0x2023bd?.['getState']?.() ?? null;
}
function valuesEqual(_0x2a867d, _0x2685b9) {
  if (Object['is'](_0x2a867d, _0x2685b9)) return !![];
  if (!_0x2a867d || !_0x2685b9 || typeof _0x2a867d !== 'object' || typeof _0x2685b9 !== 'object') return ![];
  if (Array['isArray'](_0x2a867d) || Array['isArray'](_0x2685b9)) {
    if (
      !Array['isArray'](_0x2a867d) ||
      !Array['isArray'](_0x2685b9) ||
      _0x2a867d['length'] !== _0x2685b9['length']
    )
      return ![];
    return _0x2a867d['every']((_0x34859d, _0x575b10) => valuesEqual(_0x34859d, _0x2685b9[_0x575b10]));
  }
  const _0x50a7c8 = Object['keys'](_0x2a867d)['sort'](),
    _0x51977c = Object['keys'](_0x2685b9)['sort']();
  if (!valuesEqual(_0x50a7c8, _0x51977c)) return ![];
  return _0x50a7c8['every']((_0x3cc4d0) => valuesEqual(_0x2a867d[_0x3cc4d0], _0x2685b9[_0x3cc4d0]));
}
function sameIds(_0x1de2cb = [], _0x5c3f62 = []) {
  const _0x395bf8 = uniqueIds(_0x1de2cb)['sort'](),
    _0x1d0994 = uniqueIds(_0x5c3f62)['sort']();
  return valuesEqual(_0x395bf8, _0x1d0994);
}
function createVerificationFailure(_0x381846, _0x847a2e, _0xaec70a = {}) {
  return { ok: ![], commandId: _0x381846, reason: _0x847a2e, details: _0xaec70a };
}
function verifyNodeIds(_0x2785c0, _0x2ef953, _0x4c584c, _0x21a7cb = {}) {
  const _0x187834 = uniqueIds(_0x4c584c);
  if (_0x187834['length'] === 0x0)
    return createVerificationFailure(_0x2785c0, 'missing_result_node_ids', _0x21a7cb);
  const _0xdb0dd5 = _0x187834['filter']((_0x467f94) => !_0x2ef953[_0x467f94]);
  if (_0xdb0dd5['length'] > 0x0)
    return createVerificationFailure(_0x2785c0, 'nodes_not_committed', {
      ..._0x21a7cb,
      nodeIds: _0x187834,
      missingNodeIds: _0xdb0dd5,
    });
  return { ok: !![], nodeIds: _0x187834 };
}
function verifyEdge(_0xc29d7b, _0x5479b7, _0x217cab = {}) {
  const _0x1d5fc9 = normalizeId(_0x217cab['id'] || _0x217cab['edgeId']),
    _0x15f73b = _0x1d5fc9 ? _0x5479b7[_0x1d5fc9] : null;
  if (!_0x15f73b) return createVerificationFailure(_0xc29d7b, 'edge_not_committed', { edgeId: _0x1d5fc9 });
  for (const _0x2c1ad5 of ['sourceId', 'targetId', 'refSlot', 'type']) {
    if (
      Object['prototype']['hasOwnProperty']['call'](_0x217cab, _0x2c1ad5) &&
      _0x217cab[_0x2c1ad5] !== undefined &&
      _0x217cab[_0x2c1ad5] !== null &&
      String(_0x15f73b[_0x2c1ad5] ?? '') !== String(_0x217cab[_0x2c1ad5] ?? '')
    )
      return createVerificationFailure(_0xc29d7b, 'edge_state_mismatch', {
        edgeId: _0x1d5fc9,
        field: _0x2c1ad5,
        expected: _0x217cab[_0x2c1ad5],
        actual: _0x15f73b[_0x2c1ad5],
      });
  }
  return { ok: !![], edgeId: _0x1d5fc9 };
}
function verifyNodeCreation(_0x87eb01, _0x4c08a7, _0x58039, _0x578a08, _0x3c5ed9) {
  const _0x578b88 = uniqueIds([
      _0x58039['nodeId'],
      _0x58039['node']?.['id'],
      ...(Array['isArray'](_0x58039['nodeIds']) ? _0x58039['nodeIds'] : []),
      ...(Array['isArray'](_0x58039['ids']) ? _0x58039['ids'] : []),
    ]),
    _0x2a70b8 = verifyNodeIds(_0x87eb01, _0x578a08, _0x578b88);
  if (!_0x2a70b8['ok']) return _0x2a70b8;
  if (_0x87eb01 === 'node.duplicate') {
    const _0x1f1cd5 = uniqueIds([
        ...(Array['isArray'](_0x58039['sourceIds']) ? _0x58039['sourceIds'] : []),
        ...(Array['isArray'](_0x4c08a7['ids']) ? _0x4c08a7['ids'] : []),
        _0x4c08a7['nodeId'],
      ]),
      _0x5eed30 = Math['max'](0x1, Math['trunc'](Number(_0x58039['copies'] ?? _0x4c08a7['copies'] ?? 0x1))),
      _0x5335ad = _0x1f1cd5['length'] * _0x5eed30;
    if (_0x5335ad > 0x0 && _0x578b88['length'] !== _0x5335ad)
      return createVerificationFailure(_0x87eb01, 'duplicate_count_mismatch', {
        sourceIds: _0x1f1cd5,
        copies: _0x5eed30,
        expectedCount: _0x5335ad,
        actualCount: _0x578b88['length'],
        nodeIds: _0x578b88,
      });
  }
  if (_0x87eb01 === 'node.createConnected') {
    const _0x5acfc3 = _0x58039['edge'] || {
      id: _0x58039['edgeId'],
      sourceId: _0x58039['sourceId'] || _0x4c08a7['sourceId'],
      targetId: _0x58039['nodeId'],
    };
    return verifyEdge(_0x87eb01, _0x3c5ed9, _0x5acfc3);
  }
  return { ok: !![], nodeIds: _0x578b88 };
}
function verifySelection(_0x48ad66, _0x3f4785, _0x3dc3eb) {
  const _0x5e95bb = uniqueIds(_0x3f4785['ids'] || _0x3f4785['nodeIds'] || []);
  if (_0x5e95bb['length'] === 0x0 || !sameIds(_0x5e95bb, _0x3dc3eb))
    return createVerificationFailure(_0x48ad66, 'selection_state_mismatch', {
      expectedIds: _0x5e95bb,
      actualIds: uniqueIds(_0x3dc3eb || []),
    });
  return { ok: !![], nodeIds: _0x5e95bb };
}
function verifyGroup(_0x5b2ed2, _0x2bcd79, _0x16fa7d, _0x50e8a7) {
  const _0x6ce2a1 = normalizeId(_0x2bcd79['groupId'] || _0x2bcd79['nodeId']),
    _0x596370 = verifyNodeIds(_0x5b2ed2, _0x16fa7d, [_0x6ce2a1]);
  if (!_0x596370['ok']) return _0x596370;
  const _0x4c3125 = uniqueIds(_0x2bcd79['ids'] || []),
    _0x10942d = _0x4c3125['find'](
      (_0x5945c5) => !_0x16fa7d[_0x5945c5] || normalizeId(_0x16fa7d[_0x5945c5]['parentId']) !== _0x6ce2a1,
    );
  if (String(_0x16fa7d[_0x6ce2a1]?.['type'] || '') !== 'group' || _0x4c3125['length'] === 0x0 || _0x10942d)
    return createVerificationFailure(_0x5b2ed2, 'group_state_mismatch', {
      groupId: _0x6ce2a1,
      childIds: _0x4c3125,
      childMismatch: _0x10942d,
    });
  if (!sameIds(_0x50e8a7, [_0x6ce2a1]))
    return createVerificationFailure(_0x5b2ed2, 'selection_state_mismatch', {
      expectedIds: [_0x6ce2a1],
      actualIds: uniqueIds(_0x50e8a7 || []),
    });
  return { ok: !![], nodeIds: [_0x6ce2a1, ..._0x4c3125] };
}
function verifyUngroup(_0x312c4a, _0x374077, _0x109d0f) {
  const _0x3de042 = uniqueIds(_0x374077['groupIds'] || []),
    _0x1fa8b5 = uniqueIds(_0x374077['childIds'] || []),
    _0x1e9924 = _0x3de042['filter']((_0x1f774e) => _0x109d0f[_0x1f774e]),
    _0x275657 = _0x1fa8b5['filter'](
      (_0x4ece07) =>
        !_0x109d0f[_0x4ece07] || _0x3de042['includes'](normalizeId(_0x109d0f[_0x4ece07]['parentId'])),
    );
  if (_0x3de042['length'] === 0x0 || _0x1e9924['length'] > 0x0 || _0x275657['length'] > 0x0)
    return createVerificationFailure(_0x312c4a, 'ungroup_state_mismatch', {
      groupIds: _0x3de042,
      childIds: _0x1fa8b5,
      remainingGroupIds: _0x1e9924,
      attachedChildIds: _0x275657,
    });
  return { ok: !![], nodeIds: _0x1fa8b5 };
}
function verifyPastedGraph(_0x9ce1f7, _0x44ac2c, _0x643862, _0x2c44a5, _0x4467b8) {
  const _0x534aff = uniqueIds(_0x44ac2c['nodeIds'] || _0x44ac2c['ids'] || []),
    _0xcd8202 = verifyNodeIds(_0x9ce1f7, _0x643862, _0x534aff);
  if (!_0xcd8202['ok']) return _0xcd8202;
  const _0x3c2180 = uniqueIds(_0x44ac2c['edgeIds'] || []),
    _0x36caeb = _0x3c2180['filter']((_0x30e842) => !_0x2c44a5[_0x30e842]);
  if (_0x36caeb['length'] > 0x0)
    return createVerificationFailure(_0x9ce1f7, 'edges_not_committed', {
      edgeIds: _0x3c2180,
      missingEdgeIds: _0x36caeb,
    });
  if (!sameIds(_0x534aff, _0x4467b8))
    return createVerificationFailure(_0x9ce1f7, 'selection_state_mismatch', {
      expectedIds: _0x534aff,
      actualIds: uniqueIds(_0x4467b8 || []),
    });
  return { ok: !![], nodeIds: _0x534aff, edgeIds: _0x3c2180 };
}
function verifyResultContract(_0x7b6e09, _0x5e259a) {
  if (['viewport.focusNodes', 'viewport.fitAll', 'task.focusResult']['includes'](_0x7b6e09)) {
    const _0xc29961 = uniqueIds(_0x5e259a['ids'] || _0x5e259a['nodeIds'] || []);
    return _0x5e259a['focused'] === !![] && _0xc29961['length'] > 0x0
      ? { ok: !![], nodeIds: _0xc29961 }
      : createVerificationFailure(_0x7b6e09, 'viewport_effect_not_acknowledged', { ids: _0xc29961 });
  }
  if (_0x7b6e09 === 'clipboard.copy') {
    const _0x2b2888 = uniqueIds(_0x5e259a['ids'] || []),
      _0x204611 = Math['max'](0x0, Math['trunc'](Number(_0x5e259a['nodeCount']) || 0x0));
    return _0x2b2888['length'] > 0x0 && _0x204611 === _0x2b2888['length']
      ? { ok: !![], nodeIds: _0x2b2888 }
      : createVerificationFailure(_0x7b6e09, 'clipboard_result_mismatch', {
          ids: _0x2b2888,
          nodeCount: _0x204611,
        });
  }
  if (_0x7b6e09 === 'node.exportSelected') {
    const _0x2cb838 = Math['max'](0x0, Math['trunc'](Number(_0x5e259a['exportedCount']) || 0x0)),
      _0x41df89 = normalizeId(_0x5e259a['path'] || _0x5e259a['outputPath']);
    return _0x5e259a['success'] === !![] && _0x2cb838 > 0x0 && _0x41df89
      ? { ok: !![], path: _0x41df89, exportedCount: _0x2cb838 }
      : createVerificationFailure(_0x7b6e09, 'export_result_unverified', {
          exportedCount: _0x2cb838,
          hasPath: Boolean(_0x41df89),
        });
  }
  return createVerificationFailure(_0x7b6e09, 'postcondition_policy_missing');
}
function verifyPrompt(_0x32eae5, _0x73f873, _0x2c9224) {
  const _0x27ac94 = normalizeId(_0x73f873['nodeId']),
    _0x37c9c6 = verifyNodeIds(_0x32eae5, _0x2c9224, [_0x27ac94]);
  if (!_0x37c9c6['ok']) return _0x37c9c6;
  if (String(_0x2c9224[_0x27ac94]['prompt'] || '') !== String(_0x73f873['prompt'] || ''))
    return createVerificationFailure(_0x32eae5, 'prompt_state_mismatch', { nodeId: _0x27ac94 });
  return { ok: !![], nodeIds: [_0x27ac94] };
}
function verifyModel(_0x47cdb4, _0x2d61d8, _0x5254c4) {
  const _0x462373 = normalizeId(_0x2d61d8['nodeId']),
    _0x4878bb = verifyNodeIds(_0x47cdb4, _0x5254c4, [_0x462373]);
  if (!_0x4878bb['ok']) return _0x4878bb;
  const _0x595f78 = _0x5254c4[_0x462373];
  if (String(_0x595f78['model'] || '') !== String(_0x2d61d8['modelId'] || _0x2d61d8['model'] || ''))
    return createVerificationFailure(_0x47cdb4, 'model_state_mismatch', { nodeId: _0x462373 });
  if (
    _0x2d61d8['provider'] !== undefined &&
    String(_0x595f78['provider'] || '') !== String(_0x2d61d8['provider'] || '')
  )
    return createVerificationFailure(_0x47cdb4, 'provider_state_mismatch', { nodeId: _0x462373 });
  if (_0x2d61d8['params'] && !valuesEqual(_0x595f78['generationParams'] || {}, _0x2d61d8['params']))
    return createVerificationFailure(_0x47cdb4, 'model_params_state_mismatch', { nodeId: _0x462373 });
  return { ok: !![], nodeIds: [_0x462373] };
}
function verifyParams(_0x50a6f3, _0x29230d, _0xaf94f5) {
  const _0x35079b = normalizeId(_0x29230d['nodeId']),
    _0x2c037a = verifyNodeIds(_0x50a6f3, _0xaf94f5, [_0x35079b]);
  if (!_0x2c037a['ok']) return _0x2c037a;
  const _0x548fc5 = _0xaf94f5[_0x35079b]['generationParams'] || {},
    _0x14752e = _0x29230d['params'] || {},
    _0x239838 = Object['keys'](_0x14752e)['filter'](
      (_0x4bda2f) => !valuesEqual(_0x548fc5[_0x4bda2f], _0x14752e[_0x4bda2f]),
    );
  if (_0x239838['length'] > 0x0)
    return createVerificationFailure(_0x50a6f3, 'params_state_mismatch', { nodeId: _0x35079b });
  return { ok: !![], nodeIds: [_0x35079b] };
}
function verifyLayout(_0x23056e, _0x507159, _0x317a65) {
  const _0x131271 = uniqueIds(_0x507159['ids'] || _0x507159['movedIds'] || []),
    _0xe125da = verifyNodeIds(_0x23056e, _0x317a65, _0x131271);
  if (!_0xe125da['ok']) return _0xe125da;
  const _0xedd620 =
    _0x507159['positions'] && typeof _0x507159['positions'] === 'object' ? _0x507159['positions'] : null;
  if (!_0xedd620) return { ok: !![], nodeIds: _0x131271, status: 'legacy_contract' };
  for (const [_0x1f7010, _0x2f4d02] of Object['entries'](_0xedd620)) {
    const _0x31f95f = _0x317a65[_0x1f7010];
    if (
      !_0x31f95f ||
      Math['abs'](Number(_0x31f95f['x']) - Number(_0x2f4d02?.['x'])) > 0.000001 ||
      Math['abs'](Number(_0x31f95f['y']) - Number(_0x2f4d02?.['y'])) > 0.000001
    )
      return createVerificationFailure(_0x23056e, 'layout_position_mismatch', {
        nodeId: _0x1f7010,
        expected: _0x2f4d02,
        actual: _0x31f95f ? { x: _0x31f95f['x'], y: _0x31f95f['y'] } : null,
      });
  }
  return { ok: !![], nodeIds: _0x131271 };
}
function verifyGenerationEntry(_0x3c5024, _0x431dca, _0x48d6c4) {
  const _0x164e5e = String(_0x431dca['status'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x305b5f = normalizeId(_0x431dca['taskId']);
  if (!_0x164e5e && !_0x305b5f) return { ok: !![], status: 'legacy_contract', nodeIds: [] };
  const _0x8ad101 = normalizeId(_0x431dca['targetNodeId'] || _0x431dca['nodeId']),
    _0x289dbd = verifyNodeIds(_0x3c5024, _0x48d6c4, [_0x8ad101]);
  if (!_0x289dbd['ok']) return _0x289dbd;
  if (!ACCEPTED_GENERATION_STATUSES['has'](_0x164e5e) && _0x164e5e !== 'failed')
    return createVerificationFailure(_0x3c5024, 'generation_status_unverified', {
      nodeId: _0x8ad101,
      status: _0x164e5e,
    });
  if (!_0x305b5f && !TERMINAL_GENERATION_STATUSES['has'](_0x164e5e) && _0x164e5e !== 'failed')
    return createVerificationFailure(_0x3c5024, 'generation_task_not_bound', {
      nodeId: _0x8ad101,
      status: _0x164e5e,
    });
  return { ok: !![], nodeIds: [_0x8ad101] };
}
function verifyGeneration(_0x198dd9, _0x51795d, _0x109d26) {
  const _0x384463 =
    _0x198dd9 === 'generation.runBatch'
      ? Array['isArray'](_0x51795d['results'])
        ? _0x51795d['results']
        : []
      : [_0x51795d];
  if (_0x384463['length'] === 0x0) return createVerificationFailure(_0x198dd9, 'generation_results_missing');
  for (const _0x9a2ff7 of _0x384463) {
    const _0x670e44 = verifyGenerationEntry(_0x198dd9, _0x9a2ff7 || {}, _0x109d26);
    if (!_0x670e44['ok']) return _0x670e44;
  }
  return {
    ok: !![],
    nodeIds: uniqueIds(_0x384463['map']((_0x1de36f) => _0x1de36f?.['targetNodeId'] || _0x1de36f?.['nodeId'])),
  };
}
export function verifyAgentActionPostcondition({
  commandId: _0x2613d1,
  args: args = {},
  response: response = {},
  commandContext: commandContext = {},
} = {}) {
  const _0x4685c9 = normalizeId(_0x2613d1 || response['commandId']);
  if (response['ok'] !== !![]) return { ok: !![], commandId: _0x4685c9, status: 'not_run' };
  const _0x2c3f73 = getAgentActionPostconditionPolicy(_0x4685c9),
    _0x323ca7 = response['result'] && typeof response['result'] === 'object' ? response['result'] : {};
  if (_0x2c3f73 === 'result') {
    const _0x399be4 = verifyResultContract(_0x4685c9, _0x323ca7);
    return _0x399be4['ok']
      ? { ..._0x399be4, commandId: _0x4685c9, status: 'verified' }
      : { ..._0x399be4, commandId: _0x4685c9, status: 'failed' };
  }
  const _0xfcb13f = readCanvasState(commandContext);
  if (!_0xfcb13f || typeof _0xfcb13f !== 'object')
    return _0x2c3f73 === 'store'
      ? {
          ...createVerificationFailure(_0x4685c9, 'state_unavailable'),
          commandId: _0x4685c9,
          status: 'failed',
        }
      : { ok: !![], commandId: _0x4685c9, status: 'not_applicable' };
  const _0x10106c = _0xfcb13f['nodes'] || {},
    _0x3fb47b = _0xfcb13f['edges'] || {},
    _0x147623 = Array['isArray'](_0xfcb13f['selectedNodeIds']) ? _0xfcb13f['selectedNodeIds'] : [];
  let _0x25199e;
  if (
    [
      'node.create',
      'node.createConnected',
      'node.duplicate',
      'collage.createFromSelection',
      'storyboard.createFromImages',
      'storyboard.createGridFromNode',
    ]['includes'](_0x4685c9)
  )
    _0x25199e = verifyNodeCreation(_0x4685c9, args, _0x323ca7, _0x10106c, _0x3fb47b);
  else {
    if (
      ['audio.separate', 'image.splitGrid', 'video.extractKeyframes', 'video.reverse', 'video.separateAv'][
        'includes'
      ](_0x4685c9)
    )
      _0x25199e = verifyNodeIds(_0x4685c9, _0x10106c, _0x323ca7['nodeIds'] || []);
    else {
      if (_0x4685c9 === 'node.select') _0x25199e = verifySelection(_0x4685c9, _0x323ca7, _0x147623);
      else {
        if (_0x4685c9 === 'node.group') _0x25199e = verifyGroup(_0x4685c9, _0x323ca7, _0x10106c, _0x147623);
        else {
          if (_0x4685c9 === 'node.ungroup') _0x25199e = verifyUngroup(_0x4685c9, _0x323ca7, _0x10106c);
          else {
            if (_0x4685c9 === 'clipboard.paste')
              _0x25199e = verifyPastedGraph(_0x4685c9, _0x323ca7, _0x10106c, _0x3fb47b, _0x147623);
            else {
              if (['node.setPrompt', 'node.appendPrompt']['includes'](_0x4685c9))
                _0x25199e = verifyPrompt(_0x4685c9, _0x323ca7, _0x10106c);
              else {
                if (['node.setModel', 'node.changeModel']['includes'](_0x4685c9))
                  _0x25199e = verifyModel(_0x4685c9, _0x323ca7, _0x10106c);
                else {
                  if (_0x4685c9 === 'node.setParams')
                    _0x25199e = verifyParams(_0x4685c9, _0x323ca7, _0x10106c);
                  else {
                    if (_0x4685c9 === 'graph.connect')
                      _0x25199e = verifyEdge(
                        _0x4685c9,
                        _0x3fb47b,
                        _0x323ca7['edge'] || { id: _0x323ca7['edgeId'] },
                      );
                    else {
                      if (_0x4685c9 === 'node.setInputSlot')
                        _0x25199e = verifyEdge(
                          _0x4685c9,
                          _0x3fb47b,
                          _0x323ca7['edge'] || { id: _0x323ca7['edgeId'], refSlot: _0x323ca7['refSlot'] },
                        );
                      else {
                        if (_0x4685c9 === 'graph.disconnect') {
                          const _0x166a27 = uniqueIds(_0x323ca7['edgeIds'] || []),
                            _0x5c0bdb = _0x166a27['filter']((_0x5643ab) => _0x3fb47b[_0x5643ab]);
                          _0x25199e =
                            _0x5c0bdb['length'] === 0x0
                              ? { ok: !![], edgeIds: _0x166a27 }
                              : createVerificationFailure(_0x4685c9, 'edges_not_removed', {
                                  remainingEdgeIds: _0x5c0bdb,
                                });
                        } else {
                          if (_0x4685c9 === 'node.delete') {
                            const _0x212fa7 = uniqueIds(_0x323ca7['ids'] || []),
                              _0x529d7e = _0x212fa7['filter']((_0x8fa363) => _0x10106c[_0x8fa363]);
                            _0x25199e =
                              _0x212fa7['length'] > 0x0 && _0x529d7e['length'] === 0x0
                                ? { ok: !![], nodeIds: _0x212fa7 }
                                : createVerificationFailure(_0x4685c9, 'nodes_not_removed', {
                                    nodeIds: _0x212fa7,
                                    remainingNodeIds: _0x529d7e,
                                  });
                          } else {
                            if (_0x4685c9 === 'node.rename') {
                              const _0xf062fb = Array['isArray'](_0x323ca7['renamed'])
                                  ? _0x323ca7['renamed']
                                  : uniqueIds(_0x323ca7['ids'] || [_0x323ca7['nodeId']])['map'](
                                      (_0x384f9d, _0x208866) => ({
                                        nodeId: _0x384f9d,
                                        name: Array['isArray'](_0x323ca7['names'])
                                          ? _0x323ca7['names'][_0x208866]
                                          : _0x323ca7['name'],
                                      }),
                                    ),
                                _0x385a82 = _0xf062fb['find'](
                                  (_0x11b783) =>
                                    !_0x10106c[_0x11b783['nodeId']] ||
                                    String(_0x10106c[_0x11b783['nodeId']]['name'] || '') !==
                                      String(_0x11b783['name'] || ''),
                                );
                              _0x25199e = _0x385a82
                                ? createVerificationFailure(_0x4685c9, 'node_name_mismatch', {
                                    nodeId: _0x385a82['nodeId'],
                                  })
                                : {
                                    ok: !![],
                                    nodeIds: uniqueIds(_0xf062fb['map']((_0x29643d) => _0x29643d['nodeId'])),
                                  };
                            } else {
                              if (_0x4685c9['startsWith']('layout.'))
                                _0x25199e = verifyLayout(_0x4685c9, _0x323ca7, _0x10106c);
                              else {
                                if (['generation.run', 'generation.runBatch']['includes'](_0x4685c9))
                                  _0x25199e = verifyGeneration(_0x4685c9, _0x323ca7, _0x10106c);
                                else {
                                  if (_0x4685c9 === 'task.retry')
                                    _0x25199e = verifyGenerationEntry(_0x4685c9, _0x323ca7, _0x10106c);
                                  else {
                                    if (['generation.cancel', 'generation.resume']['includes'](_0x4685c9))
                                      _0x25199e = verifyNodeIds(_0x4685c9, _0x10106c, [_0x323ca7['nodeId']]);
                                    else {
                                      if (_0x4685c9['startsWith']('scene.'))
                                        _0x25199e = verifyNodeIds(_0x4685c9, _0x10106c, [
                                          _0x323ca7['nodeId'],
                                        ]);
                                      else {
                                        if (_0x4685c9 === 'media.resetSize') {
                                          const _0xda3e8e = uniqueIds(_0x323ca7['nodeIds'] || []),
                                            _0x1c59a2 = verifyNodeIds(_0x4685c9, _0x10106c, _0xda3e8e),
                                            _0x2a97a5 = _0x1c59a2['ok']
                                              ? _0xda3e8e['find']((_0x5cc93b) => {
                                                  const _0x5eafdc = _0x323ca7['sizes']?.[_0x5cc93b];
                                                  return (
                                                    _0x5eafdc &&
                                                    (Number(_0x10106c[_0x5cc93b]['width']) !==
                                                      Number(_0x5eafdc['width']) ||
                                                      Number(_0x10106c[_0x5cc93b]['height']) !==
                                                        Number(_0x5eafdc['height']))
                                                  );
                                                })
                                              : '';
                                          _0x25199e = !_0x1c59a2['ok']
                                            ? _0x1c59a2
                                            : _0x2a97a5
                                              ? createVerificationFailure(_0x4685c9, 'node_size_mismatch', {
                                                  nodeId: _0x2a97a5,
                                                })
                                              : { ok: !![], nodeIds: _0xda3e8e };
                                        } else
                                          _0x25199e =
                                            _0x2c3f73 === 'store'
                                              ? createVerificationFailure(
                                                  _0x4685c9,
                                                  'postcondition_policy_missing',
                                                )
                                              : { ok: !![], commandId: _0x4685c9, status: 'not_applicable' };
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return _0x25199e['ok']
    ? { ..._0x25199e, commandId: _0x4685c9, status: _0x25199e['status'] || 'verified' }
    : { ..._0x25199e, commandId: _0x4685c9, status: 'failed' };
}
function buildPostconditionFailure(_0x50d6cb, _0x354a46, _0x432a39 = null) {
  return {
    ok: ![],
    commandId: _0x50d6cb,
    errorCode: 'AGENT_POSTCONDITION_FAILED',
    message: _0x50d6cb + ' returned success, but its canvas result could not be verified.',
    details: {
      reason: _0x354a46['reason'] || 'postcondition_failed',
      ...(_0x354a46['details'] || {}),
      repairAttempted: _0x432a39 !== null,
      ...(_0x432a39
        ? {
            repairErrorCode: String(_0x432a39['errorCode'] || ''),
            repairMessage: String(_0x432a39['message'] || ''),
          }
        : {}),
    },
    verification: {
      status: 'failed',
      attempts: _0x432a39 === null ? 0x0 : 0x1,
      reason: _0x354a46['reason'] || 'postcondition_failed',
    },
  };
}
export function createAgentActionPostconditionHandler({
  commandContext: commandContext = {},
  executeCommand: executeCommand = executeCanvasCommand,
  shouldContinue: shouldContinue = null,
} = {}) {
  return async ({ commandId: _0xf6ad10, args: _0x5d12ac, response: _0x4332b4, context: _0x4bcb8a }) => {
    if (_0x4332b4?.['ok'] !== !![]) return _0x4332b4;
    const _0x6514c8 = _0x4bcb8a || commandContext,
      _0x18470e = verifyAgentActionPostcondition({
        commandId: _0xf6ad10,
        args: _0x5d12ac,
        response: _0x4332b4,
        commandContext: _0x6514c8,
      });
    if (_0x18470e['ok'])
      return { ..._0x4332b4, verification: { status: _0x18470e['status'], attempts: 0x0 } };
    if (
      !AUTO_REPAIRABLE_COMMANDS['has'](_0xf6ad10) ||
      (typeof shouldContinue === 'function' &&
        shouldContinue({ phase: 'postcondition_repair', commandId: _0xf6ad10 }) === ![])
    )
      return buildPostconditionFailure(_0xf6ad10, _0x18470e);
    const _0x1faba2 = await executeCommand(_0xf6ad10, _0x5d12ac, _0x6514c8);
    if (_0x1faba2?.['ok'] !== !![]) return buildPostconditionFailure(_0xf6ad10, _0x18470e, _0x1faba2 || {});
    const _0x2537c6 = verifyAgentActionPostcondition({
      commandId: _0xf6ad10,
      args: _0x5d12ac,
      response: _0x1faba2,
      commandContext: _0x6514c8,
    });
    if (!_0x2537c6['ok']) return buildPostconditionFailure(_0xf6ad10, _0x2537c6, _0x1faba2);
    return {
      ..._0x1faba2,
      verification: {
        status: 'repaired',
        attempts: 0x1,
        initialReason: _0x18470e['reason'] || 'postcondition_failed',
      },
    };
  };
}
export const AGENT_AUTO_REPAIRABLE_COMMANDS = Object['freeze']([...AUTO_REPAIRABLE_COMMANDS]);
