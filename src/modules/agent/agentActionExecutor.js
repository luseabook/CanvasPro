import { executeCanvasCommandPlan } from '../canvasCommands/index.js';
import { worldToScreen } from '../../core/math.js';
import { createAgentActionPostconditionHandler } from './agentActionPostconditions.js';
import { normalizeAgentPrecreatedNode } from './agentPrecreatedNode.js';
const NODE_CREATING_COMMANDS = new Set([
  'node.create',
  'node.createConnected',
  'node.duplicate',
  'collage.createFromSelection',
]);
function normalizeAgentActionArgs(
  args = {},
  value = null,
  { precreateReservation: precreateReservation = ![] } = {},
) {
  const box =
    args['args'] && typeof args['args'] === 'object' && !Array['isArray'](args['args'])
      ? { ...args['args'] }
      : {};
  if (String(args['type'] || args['commandId'] || '')['trim']() !== 'node.create') {
    if (String(args['type'] || args['commandId'] || '')['trim']() === 'node.duplicate')
      return (
        delete box['dx'],
        delete box['dy'],
        { ...box, placement: 'spawn-preferences' }
      );
    return box;
  }
  (delete box['x'],
    delete box['y'],
    delete box['sequenceKey'],
    delete box['reuseNodeId'],
    delete box['agentReservation']);
  const agentPrecreatedNode = normalizeAgentPrecreatedNode(value),
    reuseNodeId =
      agentPrecreatedNode && String(box['type'] || '')['trim']() === agentPrecreatedNode['type'] ? agentPrecreatedNode['nodeId'] : '';
  return {
    ...box,
    placement: 'viewport-center-sequence',
    ...(reuseNodeId ? { reuseNodeId: reuseNodeId } : {}),
    ...(precreateReservation ? { agentReservation: !![] } : {}),
  };
}
function readCanvasState(options = {}) {
  const store = options['store'] || options['graphStore'];
  return store?.['getStateRaw']?.() ?? store?.['getState']?.() ?? null;
}
function collectCreatedNodeResult(list = [], item = []) {
  const args2 = new Set(),
    args3 = new Set(),
    args4 = new Set(),
    unresolvedCommandIds = [];
  return (
    list['forEach']((key, index) => {
      const result = String(key?.['type'] || key?.['commandId'] || '')['trim']();
      if (!NODE_CREATING_COMMANDS['has'](result)) return;
      const response = item[index];
      if (response?.['ok'] !== !![]) return;
      const data = response['result'] || {};
      if (data['reused'] === !![]) {
        const target = String(data['nodeId'] || data['node']?.['id'] || '')['trim']();
        if (target) args4['add'](target);
      }
      const list2 =
          result === 'node.duplicate'
            ? [
                ...(Array['isArray'](data['nodeIds']) ? data['nodeIds'] : []),
                ...(Array['isArray'](data['ids']) ? data['ids'] : []),
              ]
            : [data['nodeId'], data['node']?.['id']],
        source = args2['size'];
      list2['forEach']((next) => {
        const enabled = String(next || '')['trim']();
        if (!enabled) return;
        args2['add'](enabled);
        if (result !== 'node.create') args3['add'](enabled);
      });
      result === 'node.duplicate' &&
        (Array['isArray'](data['sourceIds']) ? data['sourceIds'] : [])['forEach']((current) => {
          const entry = String(current || '')['trim']();
          if (entry) args3['add'](entry);
        });
      if (args2['size'] === source) unresolvedCommandIds['push'](result);
    }),
    {
      nodeIds: [...args2],
      revealNodeIds: [...args3],
      reusedNodeIds: [...args4],
      unresolvedCommandIds: unresolvedCommandIds,
    }
  );
}
function getAgentSidebarViewportInsets(options2 = {}) {
  const dom = options2['windowObject'] || globalThis['window'],
    el = dom?.['document']?.['body'];
  if (
    !el?.['classList']?.['contains']?.('agent-sidebar-open') ||
    el['classList']['contains']('agent-sidebar-collapsed')
  )
    return null;
  const el2 = dom['document']['querySelector']?.('.agent-sidebar.is-open'),
    right = Number(el2?.['getBoundingClientRect']?.()?.['width']);
  return Number['isFinite'](right) && right > 0 ? { right: right } : null;
}
function revealCreatedNodes(options3 = {}, list3 = []) {
  if (typeof options3['focusNodes'] !== 'function' || list3['length'] === 0) return;
  const viewportInsets = getAgentSidebarViewportInsets(options3),
    handler = () =>
      options3['focusNodes'](list3, 96, 500, {
        maxZoom: 1,
        ...(viewportInsets ? { viewportInsets: viewportInsets } : {}),
      });
  typeof options3['scheduleFrame'] === 'function' ? options3['scheduleFrame'](handler) : handler();
}
function collectCreatedNodesOutsideVisibleCanvas(options4 = {}, record = {}, list4 = []) {
  const payload = options4['windowObject'] || globalThis['window'],
    count = Number(payload?.['innerWidth']),
    count2 = Number(payload?.['innerHeight']);
  if (!(count > 0) || !(count2 > 0)) return [];
  const box2 = getAgentSidebarViewportInsets(options4) || {},
    handle = Math['max'](1, count - Math['max'](0, Number(box2['right']) || 0)),
    box3 = record?.['viewport'] || { x: 0, y: 0, zoom: 1 },
    state = Math['max'](0.0001, Number(box3['zoom']) || 1),
    config = 16;
  return list4['filter']((scope) => {
    const box4 = record?.['nodes']?.[scope];
    if (!box4) return ![];
    const box5 = worldToScreen(Number(box4['x']) || 0, Number(box4['y']) || 0, box3),
      input = Math['max'](1, Number(box4['width']) || 160) * state,
      output = Math['max'](1, Number(box4['height']) || 120) * state;
    return (
      box5['x'] < config ||
      box5['y'] < config ||
      box5['x'] + input > handle - config ||
      box5['y'] + output > count2 - config
    );
  });
}
export async function executeAgentActions(
  list5 = [],
  {
    commandContext: commandContext = {},
    executePlan: executePlan = executeCanvasCommandPlan,
    executeCommand: executeCommand,
    initialScope: initialScope = {},
    shouldContinue: shouldContinue = null,
    createNodeSequenceKey: createNodeSequenceKey = '',
    precreatedNode: precreatedNode = null,
    precreateReservation: precreateReservation = ![],
  } = {},
) {
  if (!Array['isArray'](list5))
    return {
      ok: ![],
      status: 'failed',
      errorCode: 'INVALID_AGENT_ACTIONS',
      message: 'Agent actions must be an array.',
      results: [],
    };
  const value2 = list5['map']((type) => ({
      type: type['type'],
      ...(type['alias'] || type['resultAlias'] || type['as']
        ? { alias: type['alias'] || type['resultAlias'] || type['as'] }
        : {}),
      args: normalizeAgentActionArgs(type, precreatedNode, {
        precreateReservation: precreateReservation,
      }),
    })),
    raw = await executePlan(value2, commandContext, {
      initialScope: initialScope,
      ...(typeof shouldContinue === 'function' ? { shouldContinue: shouldContinue } : {}),
      ...(createNodeSequenceKey ? { createNodeSequenceKey: createNodeSequenceKey } : {}),
      afterAction: createAgentActionPostconditionHandler({
        commandContext: commandContext,
        ...(typeof executeCommand === 'function' ? { executeCommand: executeCommand } : {}),
        shouldContinue: shouldContinue,
      }),
    }),
    results = raw?.['result']?.['actions'] || [],
    unresolvedCommandIds2 = collectCreatedNodeResult(value2, results),
    createdNodeIds = unresolvedCommandIds2['nodeIds'],
    canvasState = readCanvasState(commandContext),
    missingNodeIds = canvasState?.['nodes']
      ? createdNodeIds['filter']((value3) => !canvasState['nodes'][value3])
      : [];
  if (
    raw['ok'] === !![] &&
    (unresolvedCommandIds2['unresolvedCommandIds']['length'] > 0 || missingNodeIds['length'] > 0)
  )
    return {
      ok: ![],
      status: 'failed',
      errorCode: 'AGENT_CREATED_NODE_MISSING',
      message:
        'Agent node creation returned success, but the new node was not committed to the canvas store.',
      results: results,
      raw: raw,
      createdNodeIds: createdNodeIds,
      missingNodeIds: missingNodeIds,
      unresolvedCommandIds: unresolvedCommandIds2['unresolvedCommandIds'],
    };
  const args5 = collectCreatedNodesOutsideVisibleCanvas(
    commandContext,
    canvasState,
    createdNodeIds['filter']((value4) => !unresolvedCommandIds2['reusedNodeIds']['includes'](value4)),
  );
  return (
    revealCreatedNodes(commandContext, [...new Set([...unresolvedCommandIds2['revealNodeIds'], ...args5])]),
    {
      ok: raw['ok'] === !![],
      status: raw['ok'] === !![] ? 'success' : 'failed',
      errorCode: raw['errorCode'] || '',
      message: raw['message'] || '',
      results: results,
      raw: raw,
      createdNodeIds: createdNodeIds,
    }
  );
}
