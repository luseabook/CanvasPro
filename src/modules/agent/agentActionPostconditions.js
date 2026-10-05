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
export function getAgentActionPostconditionPolicy(value = '') {
  const id2 = normalizeId(value);
  if (STORE_VERIFIED_COMMANDS['has'](id2)) return 'store';
  if (RESULT_VERIFIED_COMMANDS['has'](id2)) return 'result';
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
function normalizeId(item) {
  return String(item || '')['trim']();
}
function uniqueIds(list = []) {
  return [...new Set(list['map'](normalizeId)['filter'](Boolean))];
}
function readCanvasState(options = {}) {
  const store = options['store'] || options['graphStore'];
  return store?.['getStateRaw']?.() ?? store?.['getState']?.() ?? null;
}
function valuesEqual(list2, list3) {
  if (Object['is'](list2, list3)) return true;
  if (!list2 || !list3 || typeof list2 !== 'object' || typeof list3 !== 'object') return false;
  if (Array['isArray'](list2) || Array['isArray'](list3)) {
    if (!Array['isArray'](list2) || !Array['isArray'](list3) || list2['length'] !== list3['length'])
      return false;
    return list2['every']((key, index) => valuesEqual(key, list3[index]));
  }
  const list4 = Object['keys'](list2)['sort'](),
    result = Object['keys'](list3)['sort']();
  if (!valuesEqual(list4, result)) return false;
  return list4['every']((data) => valuesEqual(list2[data], list3[data]));
}
function sameIds(list5 = [], target = []) {
  const uniqueIds2 = uniqueIds(list5)['sort'](),
    uniqueIds3 = uniqueIds(target)['sort']();
  return valuesEqual(uniqueIds2, uniqueIds3);
}
function createVerificationFailure(commandId, reason, details = {}) {
  return { ok: false, commandId: commandId, reason: reason, details: details };
}
function verifyNodeIds(source, enabled, next, args2 = {}) {
  const nodeIds = uniqueIds(next);
  if (nodeIds['length'] === 0) return createVerificationFailure(source, 'missing_result_node_ids', args2);
  const missingNodeIds = nodeIds['filter']((current) => !enabled[current]);
  if (missingNodeIds['length'] > 0)
    return createVerificationFailure(source, 'nodes_not_committed', {
      ...args2,
      nodeIds: nodeIds,
      missingNodeIds: missingNodeIds,
    });
  return { ok: true, nodeIds: nodeIds };
}
function verifyEdge(entry, record, expected = {}) {
  const edgeId = normalizeId(expected['id'] || expected['edgeId']),
    actual = edgeId ? record[edgeId] : null;
  if (!actual) return createVerificationFailure(entry, 'edge_not_committed', { edgeId: edgeId });
  for (const field of ['sourceId', 'targetId', 'refSlot', 'type']) {
    if (
      Object['prototype']['hasOwnProperty']['call'](expected, field) &&
      expected[field] !== undefined &&
      expected[field] !== null &&
      String(actual[field] ?? '') !== String(expected[field] ?? '')
    )
      return createVerificationFailure(entry, 'edge_state_mismatch', {
        edgeId: edgeId,
        field: field,
        expected: expected[field],
        actual: actual[field],
      });
  }
  return { ok: true, edgeId: edgeId };
}
function verifyNodeCreation(payload, handle, id3, state, config) {
  const actualCount = uniqueIds([
      id3['nodeId'],
      id3['node']?.['id'],
      ...(Array['isArray'](id3['nodeIds']) ? id3['nodeIds'] : []),
      ...(Array['isArray'](id3['ids']) ? id3['ids'] : []),
    ]),
    response2 = verifyNodeIds(payload, state, actualCount);
  if (!response2['ok']) return response2;
  if (payload === 'node.duplicate') {
    const sourceIds = uniqueIds([
        ...(Array['isArray'](id3['sourceIds']) ? id3['sourceIds'] : []),
        ...(Array['isArray'](handle['ids']) ? handle['ids'] : []),
        handle['nodeId'],
      ]),
      copies = Math['max'](1, Math['trunc'](Number(id3['copies'] ?? handle['copies'] ?? 1))),
      expectedCount = sourceIds['length'] * copies;
    if (expectedCount > 0 && actualCount['length'] !== expectedCount)
      return createVerificationFailure(payload, 'duplicate_count_mismatch', {
        sourceIds: sourceIds,
        copies: copies,
        expectedCount: expectedCount,
        actualCount: actualCount['length'],
        nodeIds: actualCount,
      });
  }
  if (payload === 'node.createConnected') {
    const scope = id3['edge'] || {
      id: id3['edgeId'],
      sourceId: id3['sourceId'] || handle['sourceId'],
      targetId: id3['nodeId'],
    };
    return verifyEdge(payload, config, scope);
  }
  return { ok: true, nodeIds: actualCount };
}
function verifySelection(input, output, value2) {
  const expectedIds = uniqueIds(output['ids'] || output['nodeIds'] || []);
  if (expectedIds['length'] === 0 || !sameIds(expectedIds, value2))
    return createVerificationFailure(input, 'selection_state_mismatch', {
      expectedIds: expectedIds,
      actualIds: uniqueIds(value2 || []),
    });
  return { ok: true, nodeIds: expectedIds };
}
function verifyGroup(value3, value4, enabled2, value5) {
  const groupId = normalizeId(value4['groupId'] || value4['nodeId']),
    response3 = verifyNodeIds(value3, enabled2, [groupId]);
  if (!response3['ok']) return response3;
  const childIds = uniqueIds(value4['ids'] || []),
    childMismatch = childIds['find'](
      (value6) => !enabled2[value6] || normalizeId(enabled2[value6]['parentId']) !== groupId,
    );
  if (String(enabled2[groupId]?.['type'] || '') !== 'group' || childIds['length'] === 0 || childMismatch)
    return createVerificationFailure(value3, 'group_state_mismatch', {
      groupId: groupId,
      childIds: childIds,
      childMismatch: childMismatch,
    });
  if (!sameIds(value5, [groupId]))
    return createVerificationFailure(value3, 'selection_state_mismatch', {
      expectedIds: [groupId],
      actualIds: uniqueIds(value5 || []),
    });
  return { ok: true, nodeIds: [groupId, ...childIds] };
}
function verifyUngroup(value7, value8, enabled3) {
  const groupIds = uniqueIds(value8['groupIds'] || []),
    childIds2 = uniqueIds(value8['childIds'] || []),
    remainingGroupIds = groupIds['filter']((value9) => enabled3[value9]),
    attachedChildIds = childIds2['filter'](
      (value10) => !enabled3[value10] || groupIds['includes'](normalizeId(enabled3[value10]['parentId'])),
    );
  if (groupIds['length'] === 0 || remainingGroupIds['length'] > 0 || attachedChildIds['length'] > 0)
    return createVerificationFailure(value7, 'ungroup_state_mismatch', {
      groupIds: groupIds,
      childIds: childIds2,
      remainingGroupIds: remainingGroupIds,
      attachedChildIds: attachedChildIds,
    });
  return { ok: true, nodeIds: childIds2 };
}
function verifyPastedGraph(value11, value12, value13, enabled4, value14) {
  const expectedIds2 = uniqueIds(value12['nodeIds'] || value12['ids'] || []),
    response4 = verifyNodeIds(value11, value13, expectedIds2);
  if (!response4['ok']) return response4;
  const edgeIds = uniqueIds(value12['edgeIds'] || []),
    missingEdgeIds = edgeIds['filter']((value15) => !enabled4[value15]);
  if (missingEdgeIds['length'] > 0)
    return createVerificationFailure(value11, 'edges_not_committed', {
      edgeIds: edgeIds,
      missingEdgeIds: missingEdgeIds,
    });
  if (!sameIds(expectedIds2, value14))
    return createVerificationFailure(value11, 'selection_state_mismatch', {
      expectedIds: expectedIds2,
      actualIds: uniqueIds(value14 || []),
    });
  return { ok: true, nodeIds: expectedIds2, edgeIds: edgeIds };
}
function verifyResultContract(value16, response5) {
  if (['viewport.focusNodes', 'viewport.fitAll', 'task.focusResult']['includes'](value16)) {
    const nodeIds2 = uniqueIds(response5['ids'] || response5['nodeIds'] || []);
    return response5['focused'] === true && nodeIds2['length'] > 0
      ? { ok: true, nodeIds: nodeIds2 }
      : createVerificationFailure(value16, 'viewport_effect_not_acknowledged', { ids: nodeIds2 });
  }
  if (value16 === 'clipboard.copy') {
    const nodeIds3 = uniqueIds(response5['ids'] || []),
      nodeCount = Math['max'](0, Math['trunc'](Number(response5['nodeCount']) || 0));
    return nodeIds3['length'] > 0 && nodeCount === nodeIds3['length']
      ? { ok: true, nodeIds: nodeIds3 }
      : createVerificationFailure(value16, 'clipboard_result_mismatch', {
          ids: nodeIds3,
          nodeCount: nodeCount,
        });
  }
  if (value16 === 'node.exportSelected') {
    const exportedCount = Math['max'](0, Math['trunc'](Number(response5['exportedCount']) || 0)),
      path = normalizeId(response5['path'] || response5['outputPath']);
    return response5['success'] === true && exportedCount > 0 && path
      ? { ok: true, path: path, exportedCount: exportedCount }
      : createVerificationFailure(value16, 'export_result_unverified', {
          exportedCount: exportedCount,
          hasPath: Boolean(path),
        });
  }
  return createVerificationFailure(value16, 'postcondition_policy_missing');
}
function verifyPrompt(value17, value18, value19) {
  const nodeId = normalizeId(value18['nodeId']),
    response6 = verifyNodeIds(value17, value19, [nodeId]);
  if (!response6['ok']) return response6;
  if (String(value19[nodeId]['prompt'] || '') !== String(value18['prompt'] || ''))
    return createVerificationFailure(value17, 'prompt_state_mismatch', { nodeId: nodeId });
  return { ok: true, nodeIds: [nodeId] };
}
function verifyModel(value20, value21, value22) {
  const nodeId2 = normalizeId(value21['nodeId']),
    response7 = verifyNodeIds(value20, value22, [nodeId2]);
  if (!response7['ok']) return response7;
  const value23 = value22[nodeId2];
  if (String(value23['model'] || '') !== String(value21['modelId'] || value21['model'] || ''))
    return createVerificationFailure(value20, 'model_state_mismatch', { nodeId: nodeId2 });
  if (
    value21['provider'] !== undefined &&
    String(value23['provider'] || '') !== String(value21['provider'] || '')
  )
    return createVerificationFailure(value20, 'provider_state_mismatch', { nodeId: nodeId2 });
  if (value21['params'] && !valuesEqual(value23['generationParams'] || {}, value21['params']))
    return createVerificationFailure(value20, 'model_params_state_mismatch', { nodeId: nodeId2 });
  return { ok: true, nodeIds: [nodeId2] };
}
function verifyParams(value24, value25, value26) {
  const nodeId3 = normalizeId(value25['nodeId']),
    response8 = verifyNodeIds(value24, value26, [nodeId3]);
  if (!response8['ok']) return response8;
  const value27 = value26[nodeId3]['generationParams'] || {},
    value28 = value25['params'] || {},
    list6 = Object['keys'](value28)['filter']((value29) => !valuesEqual(value27[value29], value28[value29]));
  if (list6['length'] > 0)
    return createVerificationFailure(value24, 'params_state_mismatch', { nodeId: nodeId3 });
  return { ok: true, nodeIds: [nodeId3] };
}
function verifyLayout(value30, value31, value32) {
  const nodeIds4 = uniqueIds(value31['ids'] || value31['movedIds'] || []),
    response9 = verifyNodeIds(value30, value32, nodeIds4);
  if (!response9['ok']) return response9;
  const enabled5 =
    value31['positions'] && typeof value31['positions'] === 'object' ? value31['positions'] : null;
  if (!enabled5) return { ok: true, nodeIds: nodeIds4, status: 'legacy_contract' };
  for (const [nodeId4, expected2] of Object['entries'](enabled5)) {
    const actual2 = value32[nodeId4];
    if (
      !actual2 ||
      Math['abs'](Number(actual2['x']) - Number(expected2?.['x'])) > 0.000001 ||
      Math['abs'](Number(actual2['y']) - Number(expected2?.['y'])) > 0.000001
    )
      return createVerificationFailure(value30, 'layout_position_mismatch', {
        nodeId: nodeId4,
        expected: expected2,
        actual: actual2 ? { x: actual2['x'], y: actual2['y'] } : null,
      });
  }
  return { ok: true, nodeIds: nodeIds4 };
}
function verifyGenerationEntry(value33, response10, value34) {
  const status = String(response10['status'] || '')
      ['trim']()
      ['toLowerCase'](),
    id4 = normalizeId(response10['taskId']);
  if (!status && !id4) return { ok: true, status: 'legacy_contract', nodeIds: [] };
  const nodeId5 = normalizeId(response10['targetNodeId'] || response10['nodeId']),
    response11 = verifyNodeIds(value33, value34, [nodeId5]);
  if (!response11['ok']) return response11;
  if (!ACCEPTED_GENERATION_STATUSES['has'](status) && status !== 'failed')
    return createVerificationFailure(value33, 'generation_status_unverified', {
      nodeId: nodeId5,
      status: status,
    });
  if (!id4 && !TERMINAL_GENERATION_STATUSES['has'](status) && status !== 'failed')
    return createVerificationFailure(value33, 'generation_task_not_bound', {
      nodeId: nodeId5,
      status: status,
    });
  return { ok: true, nodeIds: [nodeId5] };
}
function verifyGeneration(value35, value36, value37) {
  const list7 =
    value35 === 'generation.runBatch'
      ? Array['isArray'](value36['results'])
        ? value36['results']
        : []
      : [value36];
  if (list7['length'] === 0) return createVerificationFailure(value35, 'generation_results_missing');
  for (const value38 of list7) {
    const response12 = verifyGenerationEntry(value35, value38 || {}, value37);
    if (!response12['ok']) return response12;
  }
  return {
    ok: true,
    nodeIds: uniqueIds(list7['map']((value39) => value39?.['targetNodeId'] || value39?.['nodeId'])),
  };
}
export function verifyAgentActionPostcondition({
  commandId: commandId2,
  args: args = {},
  response: response = {},
  commandContext: commandContext = {},
} = {}) {
  const commandId3 = normalizeId(commandId2 || response['commandId']);
  if (response['ok'] !== true) return { ok: true, commandId: commandId3, status: 'not_run' };
  const agentActionPostconditionPolicy = getAgentActionPostconditionPolicy(commandId3),
    id5 = response['result'] && typeof response['result'] === 'object' ? response['result'] : {};
  if (agentActionPostconditionPolicy === 'result') {
    const response13 = verifyResultContract(commandId3, id5);
    return response13['ok']
      ? { ...response13, commandId: commandId3, status: 'verified' }
      : { ...response13, commandId: commandId3, status: 'failed' };
  }
  const canvasState = readCanvasState(commandContext);
  if (!canvasState || typeof canvasState !== 'object')
    return agentActionPostconditionPolicy === 'store'
      ? {
          ...createVerificationFailure(commandId3, 'state_unavailable'),
          commandId: commandId3,
          status: 'failed',
        }
      : { ok: true, commandId: commandId3, status: 'not_applicable' };
  const enabled6 = canvasState['nodes'] || {},
    value40 = canvasState['edges'] || {},
    value41 = Array['isArray'](canvasState['selectedNodeIds']) ? canvasState['selectedNodeIds'] : [];
  let status2;
  if (
    [
      'node.create',
      'node.createConnected',
      'node.duplicate',
      'collage.createFromSelection',
      'storyboard.createFromImages',
      'storyboard.createGridFromNode',
    ]['includes'](commandId3)
  )
    status2 = verifyNodeCreation(commandId3, args, id5, enabled6, value40);
  else {
    if (
      ['audio.separate', 'image.splitGrid', 'video.extractKeyframes', 'video.reverse', 'video.separateAv'][
        'includes'
      ](commandId3)
    )
      status2 = verifyNodeIds(commandId3, enabled6, id5['nodeIds'] || []);
    else {
      if (commandId3 === 'node.select') status2 = verifySelection(commandId3, id5, value41);
      else {
        if (commandId3 === 'node.group') status2 = verifyGroup(commandId3, id5, enabled6, value41);
        else {
          if (commandId3 === 'node.ungroup') status2 = verifyUngroup(commandId3, id5, enabled6);
          else {
            if (commandId3 === 'clipboard.paste')
              status2 = verifyPastedGraph(commandId3, id5, enabled6, value40, value41);
            else {
              if (['node.setPrompt', 'node.appendPrompt']['includes'](commandId3))
                status2 = verifyPrompt(commandId3, id5, enabled6);
              else {
                if (['node.setModel', 'node.changeModel']['includes'](commandId3))
                  status2 = verifyModel(commandId3, id5, enabled6);
                else {
                  if (commandId3 === 'node.setParams') status2 = verifyParams(commandId3, id5, enabled6);
                  else {
                    if (commandId3 === 'graph.connect')
                      status2 = verifyEdge(commandId3, value40, id5['edge'] || { id: id5['edgeId'] });
                    else {
                      if (commandId3 === 'node.setInputSlot')
                        status2 = verifyEdge(
                          commandId3,
                          value40,
                          id5['edge'] || { id: id5['edgeId'], refSlot: id5['refSlot'] },
                        );
                      else {
                        if (commandId3 === 'graph.disconnect') {
                          const edgeIds2 = uniqueIds(id5['edgeIds'] || []),
                            remainingEdgeIds = edgeIds2['filter']((value42) => value40[value42]);
                          status2 =
                            remainingEdgeIds['length'] === 0
                              ? { ok: true, edgeIds: edgeIds2 }
                              : createVerificationFailure(commandId3, 'edges_not_removed', {
                                  remainingEdgeIds: remainingEdgeIds,
                                });
                        } else {
                          if (commandId3 === 'node.delete') {
                            const nodeIds5 = uniqueIds(id5['ids'] || []),
                              remainingNodeIds = nodeIds5['filter']((value43) => enabled6[value43]);
                            status2 =
                              nodeIds5['length'] > 0 && remainingNodeIds['length'] === 0
                                ? { ok: true, nodeIds: nodeIds5 }
                                : createVerificationFailure(commandId3, 'nodes_not_removed', {
                                    nodeIds: nodeIds5,
                                    remainingNodeIds: remainingNodeIds,
                                  });
                          } else {
                            if (commandId3 === 'node.rename') {
                              const list8 = Array['isArray'](id5['renamed'])
                                  ? id5['renamed']
                                  : uniqueIds(id5['ids'] || [id5['nodeId']])['map']((nodeId6, value44) => ({
                                      nodeId: nodeId6,
                                      name: Array['isArray'](id5['names'])
                                        ? id5['names'][value44]
                                        : id5['name'],
                                    })),
                                nodeId7 = list8['find'](
                                  (error) =>
                                    !enabled6[error['nodeId']] ||
                                    String(enabled6[error['nodeId']]['name'] || '') !==
                                      String(error['name'] || ''),
                                );
                              status2 = nodeId7
                                ? createVerificationFailure(commandId3, 'node_name_mismatch', {
                                    nodeId: nodeId7['nodeId'],
                                  })
                                : {
                                    ok: true,
                                    nodeIds: uniqueIds(list8['map']((value45) => value45['nodeId'])),
                                  };
                            } else {
                              if (commandId3['startsWith']('layout.'))
                                status2 = verifyLayout(commandId3, id5, enabled6);
                              else {
                                if (['generation.run', 'generation.runBatch']['includes'](commandId3))
                                  status2 = verifyGeneration(commandId3, id5, enabled6);
                                else {
                                  if (commandId3 === 'task.retry')
                                    status2 = verifyGenerationEntry(commandId3, id5, enabled6);
                                  else {
                                    if (['generation.cancel', 'generation.resume']['includes'](commandId3))
                                      status2 = verifyNodeIds(commandId3, enabled6, [id5['nodeId']]);
                                    else {
                                      if (commandId3['startsWith']('scene.'))
                                        status2 = verifyNodeIds(commandId3, enabled6, [id5['nodeId']]);
                                      else {
                                        if (commandId3 === 'media.resetSize') {
                                          const nodeIds6 = uniqueIds(id5['nodeIds'] || []),
                                            response14 = verifyNodeIds(commandId3, enabled6, nodeIds6),
                                            nodeId8 = response14['ok']
                                              ? nodeIds6['find']((value46) => {
                                                  const box = id5['sizes']?.[value46];
                                                  return (
                                                    box &&
                                                    (Number(enabled6[value46]['width']) !==
                                                      Number(box['width']) ||
                                                      Number(enabled6[value46]['height']) !==
                                                        Number(box['height']))
                                                  );
                                                })
                                              : '';
                                          status2 = !response14['ok']
                                            ? response14
                                            : nodeId8
                                              ? createVerificationFailure(commandId3, 'node_size_mismatch', {
                                                  nodeId: nodeId8,
                                                })
                                              : { ok: true, nodeIds: nodeIds6 };
                                        } else
                                          status2 =
                                            agentActionPostconditionPolicy === 'store'
                                              ? createVerificationFailure(
                                                  commandId3,
                                                  'postcondition_policy_missing',
                                                )
                                              : { ok: true, commandId: commandId3, status: 'not_applicable' };
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
  return status2['ok']
    ? { ...status2, commandId: commandId3, status: status2['status'] || 'verified' }
    : { ...status2, commandId: commandId3, status: 'failed' };
}
function buildPostconditionFailure(commandId4, reason2, repairAttempted = null) {
  return {
    ok: false,
    commandId: commandId4,
    errorCode: 'AGENT_POSTCONDITION_FAILED',
    message: commandId4 + ' returned success, but its canvas result could not be verified.',
    details: {
      reason: reason2['reason'] || 'postcondition_failed',
      ...(reason2['details'] || {}),
      repairAttempted: repairAttempted !== null,
      ...(repairAttempted
        ? {
            repairErrorCode: String(repairAttempted['errorCode'] || ''),
            repairMessage: String(repairAttempted['message'] || ''),
          }
        : {}),
    },
    verification: {
      status: 'failed',
      attempts: repairAttempted === null ? 0 : 1,
      reason: reason2['reason'] || 'postcondition_failed',
    },
  };
}
export function createAgentActionPostconditionHandler({
  commandContext: commandContext = {},
  executeCommand: executeCommand = executeCanvasCommand,
  shouldContinue: shouldContinue = null,
} = {}) {
  return async ({ commandId: commandId5, args: args3, response: response15, context: context }) => {
    if (response15?.['ok'] !== true) return response15;
    const commandContext2 = context || commandContext,
      status3 = verifyAgentActionPostcondition({
        commandId: commandId5,
        args: args3,
        response: response15,
        commandContext: commandContext2,
      });
    if (status3['ok']) return { ...response15, verification: { status: status3['status'], attempts: 0 } };
    if (
      !AUTO_REPAIRABLE_COMMANDS['has'](commandId5) ||
      (typeof shouldContinue === 'function' &&
        shouldContinue({ phase: 'postcondition_repair', commandId: commandId5 }) === false)
    )
      return buildPostconditionFailure(commandId5, status3);
    const response16 = await executeCommand(commandId5, args3, commandContext2);
    if (response16?.['ok'] !== true) return buildPostconditionFailure(commandId5, status3, response16 || {});
    const response17 = verifyAgentActionPostcondition({
      commandId: commandId5,
      args: args3,
      response: response16,
      commandContext: commandContext2,
    });
    if (!response17['ok']) return buildPostconditionFailure(commandId5, response17, response16);
    return {
      ...response16,
      verification: {
        status: 'repaired',
        attempts: 1,
        initialReason: status3['reason'] || 'postcondition_failed',
      },
    };
  };
}
export const AGENT_AUTO_REPAIRABLE_COMMANDS = Object['freeze']([...AUTO_REPAIRABLE_COMMANDS]);
