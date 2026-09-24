import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAgentCapabilities, agentCapabilityRouterInternals } from './agentCapabilityRouter.js';

const ALWAYS_IDS = [
  'agent.capabilities.search',
  'agent.command.describe',
  'agent.models.search',
  'graph.getCanvasSummary',
  'graph.getSelection',
  'node.getSummary',
];
const EXTRA_IDS = [
  'node.create',
  'node.delete',
  'node.rename',
  'node.duplicate',
  'node.setParams',
  'graph.connect',
  'layout.align',
  'storyboard.createFromImages',
  'node.exportSelected',
  'task.retry',
  'media.resetSize',
  'video.reverse',
];
function makeCommands(ids) {
  return ids.map((id) => ({ id }));
}
function idsOf(result) {
  return result.commands.map((command) => command.id);
}

test('能力路由：命令表为空或缺省时走 full 模式，目录字段齐全', () => {
  const empty = routeAgentCapabilities();
  assert.equal(empty.catalog.mode, 'full');
  assert.deepEqual(empty.commands, []);
  assert.deepEqual(empty.catalog, {
    mode: 'full',
    selectedNamespaces: [],
    includedCommandIds: [],
    deferredCommandIds: [],
    namespaces: [],
    totalAvailable: 0,
  });
});

test('能力路由：≤12 条命令整表披露，命名空间目录按注册表顺序只留有可用命令的项', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands([
      'agent.capabilities.search',
      'node.create',
      'node.delete',
      'graph.connect',
      'task.retry',
      'node.exportSelected',
    ]),
  });
  assert.equal(result.catalog.mode, 'full');
  assert.equal(result.catalog.totalAvailable, 6);
  assert.deepEqual(result.catalog.includedCommandIds, [
    'agent.capabilities.search',
    'node.create',
    'node.delete',
    'graph.connect',
    'task.retry',
    'node.exportSelected',
  ]);
  assert.deepEqual(result.catalog.deferredCommandIds, []);
  assert.deepEqual(result.catalog.namespaces, [
    { id: 'generation', commandIds: ['node.create', 'graph.connect'] },
    { id: 'edit', commandIds: ['node.create', 'node.delete', 'graph.connect'] },
    { id: 'task', commandIds: ['task.retry'] },
    { id: 'export', commandIds: ['node.exportSelected'] },
    { id: 'scene', commandIds: ['node.create'] },
  ]);
});

test('能力路由：full 模式仍然给出推断出的命名空间，只是不做延迟披露', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands(['node.create', 'node.rename', 'node.delete']),
    userMessage: '重命名这个节点',
  });
  assert.equal(result.catalog.mode, 'full');
  assert.deepEqual(result.catalog.selectedNamespaces, ['edit']);
  assert.equal(result.commands.length, 3);
});

test('能力路由：缺 id / id 为假值的命令条目在进入路由前被剔除，其余对象原样返回', () => {
  const keep = { id: 'node.create', label: '创建节点' };
  const result = routeAgentCapabilities({
    commands: [null, {}, { id: '' }, { id: 0 }, keep, 'not-an-object'],
  });
  assert.equal(result.catalog.totalAvailable, 1);
  assert.deepEqual(result.catalog.includedCommandIds, ['node.create']);
  assert.deepEqual(result.commands, [keep]);
});

test('能力路由：>12 条走 progressive，命中不到任何优先级来源时只保留 6 条常驻命令', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '',
    maxCommands: 100,
  });
  assert.equal(result.catalog.mode, 'progressive');
  assert.equal(result.catalog.totalAvailable, 18);
  // 打分表里没有的 id 不会被选中，maxCommands 再大也补不满
  assert.deepEqual(idsOf(result), ALWAYS_IDS);
  assert.deepEqual(result.catalog.deferredCommandIds, EXTRA_IDS);
});

test('能力路由：intent(500) 压过常驻(350)，命名空间层(200) 整层被裁掉；输出按注册表原序', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '重命名并复制这个节点',
    maxCommands: 6,
  });
  // 打分只决定「入选集合」，最终 commands / includedCommandIds 仍是注册表顺序
  assert.deepEqual(result.catalog.selectedNamespaces, ['edit']);
  assert.deepEqual(idsOf(result), [
    'agent.capabilities.search',
    'agent.command.describe',
    'agent.models.search',
    'graph.getCanvasSummary',
    'node.rename',
    'node.duplicate',
  ]);
  assert.deepEqual(result.catalog.deferredCommandIds, [
    'graph.getSelection',
    'node.getSummary',
    'node.create',
    'node.delete',
    'node.setParams',
    'graph.connect',
    'layout.align',
    'storyboard.createFromImages',
    'node.exportSelected',
    'task.retry',
    'media.resetSize',
    'video.reverse',
  ]);
});

test('能力路由：requiredCommandIds 压过一切，显式命令名字面量次之', () => {
  const required = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '',
    requiredCommandIds: ['video.reverse'],
    maxCommands: 6,
  });
  // 700 分的必选命令占掉一格，常驻层只能留前 5 条
  assert.deepEqual(idsOf(required), [...ALWAYS_IDS.slice(0, 5), 'video.reverse']);
  const explicit = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '请调用 layout.align 命令',
    maxCommands: 8,
  });
  // 显式串命中 600，「layout」词面命中命名空间 200，取 max 后只入选一次
  assert.equal(idsOf(explicit).filter((id) => id === 'layout.align').length, 1);
  assert.deepEqual(idsOf(explicit), [...ALWAYS_IDS, 'layout.align']);
  assert.equal(explicit.catalog.deferredCommandIds.length, 11);
});

test('能力路由：技能自带命令(400) 压过常驻(350)，名额吃紧时常驻层被裁', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '',
    skills: [{ commands: ['task.retry', 'node.setParams'] }],
    maxCommands: 6,
  });
  // 两条技能命令占掉 2 格，6 格常驻只能留下注册表前 4 条
  assert.deepEqual(idsOf(result), [
    'agent.capabilities.search',
    'agent.command.describe',
    'agent.models.search',
    'graph.getCanvasSummary',
    'node.setParams',
    'task.retry',
  ]);
});

test('能力路由：空串与未注册 id 不进打分表，缺 commands 或整个技能为 null 也不报错', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '',
    skills: [{ commands: ['media.resetSize', '', 'never-registered-id'] }, {}, null],
    maxCommands: 7,
  });
  assert.deepEqual(idsOf(result), [...ALWAYS_IDS, 'media.resetSize']);
  assert.equal(result.catalog.deferredCommandIds.includes('never-registered-id'), false);
});

test('能力路由：同一命名空间内按注册表原序排,跨命名空间按推断顺序递减优先级', () => {
  const result = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '把这些对齐并导出',
    maxCommands: 8,
  });
  assert.deepEqual(result.catalog.selectedNamespaces, ['layout', 'export']);
  assert.deepEqual(idsOf(result), [...ALWAYS_IDS, 'layout.align', 'node.exportSelected']);
});

test('能力路由：maxCommands 下限为常驻命令数，非法值回落到 18', () => {
  const floor = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '把这些对齐并导出',
    maxCommands: 2,
  });
  assert.equal(floor.commands.length, 6);
  const nan = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '把这些对齐并导出',
    maxCommands: 'abc',
  });
  assert.equal(nan.commands.length, 8);
  const negative = routeAgentCapabilities({
    commands: makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]),
    userMessage: '',
    maxCommands: -5,
  });
  assert.equal(negative.commands.length, 6);
});

test('命名空间推断：intent 的五个别名字段与 namespaces 数组都参与，未知名字被丢弃', () => {
  const { inferNamespaces } = agentCapabilityRouterInternals;
  assert.deepEqual(inferNamespaces({ intent: { namespace: 'Task' } }), ['task']);
  assert.deepEqual(inferNamespaces({ intent: { route: 'Export' } }), ['export']);
  assert.deepEqual(inferNamespaces({ intent: { capability: 'Selection' } }), ['selection']);
  assert.deepEqual(inferNamespaces({ intent: { action: 'EDIT' } }), ['edit']);
  assert.deepEqual(inferNamespaces({ intent: { operation: 'Generation' } }), ['generation']);
  assert.deepEqual(inferNamespaces({ intent: { namespaces: ['bogus', 'media', '  '] } }), ['media']);
  assert.deepEqual(inferNamespaces({ userMessage: '', intent: {} }), []);
});

test('命名空间推断：文本命中与 intent 命中合并，注册表顺序决定输出顺序', () => {
  const { inferNamespaces } = agentCapabilityRouterInternals;
  assert.deepEqual(inferNamespaces({ userMessage: '导出结果', intent: { namespace: 'edit' } }), [
    'edit',
    'export',
  ]);
});

test('命名空间推断：带目标类型且声明改动画布时补 generation，已有则不重复', () => {
  const { inferNamespaces } = agentCapabilityRouterInternals;
  assert.deepEqual(inferNamespaces({ targetKind: 'image', intent: { canvasAction: true } }), ['generation']);
  assert.deepEqual(
    inferNamespaces({ targetKind: 'image', intent: { mutatesCanvas: true, namespace: 'task' } }),
    ['task', 'generation'],
  );
  assert.deepEqual(
    inferNamespaces({ targetKind: 'image', intent: { canvasAction: true, namespace: 'generation' } }),
    ['generation'],
  );
  assert.deepEqual(inferNamespaces({ targetKind: '', intent: { canvasAction: true } }), []);
  assert.deepEqual(inferNamespaces({ targetKind: 'image', intent: {} }), []);
});

test('意图命令：仅命中已注册模式组，命中多组时按模式表顺序展开', () => {
  const { findIntentCommandIds } = agentCapabilityRouterInternals;
  assert.deepEqual(findIntentCommandIds(''), []);
  assert.deepEqual(findIntentCommandIds('generate several variants'), ['generation.runBatch']);
  assert.deepEqual(findIntentCommandIds('make it a collage'), ['collage.createFromSelection']);
  assert.deepEqual(findIntentCommandIds('change the model now'), ['node.setModel', 'node.changeModel']);
  assert.deepEqual(findIntentCommandIds('改成竖版比例'), ['node.setParams']);
  assert.deepEqual(findIntentCommandIds('复制3份这个节点'), ['node.duplicate']);
  // 多组命中按模式表顺序展开：delete 在 rename 之前
  assert.deepEqual(findIntentCommandIds('重命名并删除这个节点'), ['node.delete', 'node.rename']);
  // 「批量」同时命中 runBatch 与 setParams 两组，故两命令一起返回
  assert.deepEqual(findIntentCommandIds('批量生成十张产品图'), ['generation.runBatch', 'node.setParams']);
});

test('内部目录：常量表冻结且可枚举，命名空间成员与命令一致', () => {
  const { COMMAND_NAMESPACES } = agentCapabilityRouterInternals;
  assert.equal(Object.isFrozen(COMMAND_NAMESPACES), true);
  assert.deepEqual(Object.keys(COMMAND_NAMESPACES), [
    'generation',
    'edit',
    'selection',
    'layout',
    'media',
    'storyboard',
    'task',
    'export',
    'scene',
  ]);
  assert.equal(Object.isFrozen(COMMAND_NAMESPACES.generation), true);
  assert.equal(COMMAND_NAMESPACES.generation.includes('generation.run'), true);
  assert.deepEqual(COMMAND_NAMESPACES.selection, ['node.select', 'viewport.focusNodes', 'viewport.fitAll']);
});

test('能力路由：catalog.namespaces 按全量可用命令统计，与被选中的子集无关', () => {
  const commands = makeCommands([...ALWAYS_IDS, ...EXTRA_IDS]);
  const progressive = routeAgentCapabilities({ commands, userMessage: '', maxCommands: 7 });
  assert.deepEqual(idsOf(progressive), ALWAYS_IDS);
  assert.equal(progressive.catalog.includedCommandIds.includes('node.create'), false);
  assert.deepEqual(
    progressive.catalog.namespaces.map((entry) => entry.id),
    ['generation', 'edit', 'layout', 'media', 'storyboard', 'task', 'export', 'scene'],
  );
  assert.deepEqual(progressive.catalog.namespaces[0], {
    id: 'generation',
    commandIds: ['node.create', 'graph.connect', 'node.setParams'],
  });
});
