import test from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_DISCOVERY_COMMAND_IDS, registerAgentDiscoveryCommands } from './agentDiscoveryCommands.js';

function makeRegistry(over = {}) {
  const registry = {
    defs: [],
    known: new Set('known' in over ? over.known : []),
    entries: 'entries' in over ? over.entries : [],
    register(def) {
      registry.defs.push(def);
      registry.known.add(def.id);
      return def;
    },
    has(id) {
      return registry.known.has(id);
    },
    list() {
      return registry.entries;
    },
    get(id) {
      return registry.entries.find((def) => def.id === id) || null;
    },
  };
  return registry;
}

test('发现命令 ID 常量冻结为三个只读命令', () => {
  assert.deepEqual(
    [...AGENT_DISCOVERY_COMMAND_IDS],
    ['agent.capabilities.search', 'agent.command.describe', 'agent.models.search'],
  );
  assert.equal(Object.isFrozen(AGENT_DISCOVERY_COMMAND_IDS), true);
});

test('注册表缺少 register / has 时原样返回入参且不抛错', () => {
  assert.equal(registerAgentDiscoveryCommands(null), null);
  const empty = {};
  assert.equal(registerAgentDiscoveryCommands(undefined), undefined);
  assert.equal(registerAgentDiscoveryCommands(empty), empty);
  const onlyRegister = { register() {}, has: undefined };
  assert.equal(registerAgentDiscoveryCommands(onlyRegister), onlyRegister);
  const onlyHas = { register: null, has: () => false };
  assert.equal(registerAgentDiscoveryCommands(onlyHas), onlyHas);
});

test('干净注册表注册三个 safe 命令并返回同一注册表', () => {
  const registry = makeRegistry();
  assert.equal(registerAgentDiscoveryCommands(registry), registry);
  assert.deepEqual(
    registry.defs.map((def) => def.id),
    [...AGENT_DISCOVERY_COMMAND_IDS],
  );
  assert.deepEqual(
    registry.defs.map((def) => def.riskLevel),
    ['safe', 'safe', 'safe'],
  );
  assert.equal(registry.defs.length, 3);
});

test('三个命令共享同一份冻结能力声明：只读能力目录、零写入', () => {
  const registry = makeRegistry();
  registerAgentDiscoveryCommands(registry);
  const [first, second, third] = registry.defs;
  assert.equal(first.capabilitySchema, second.capabilitySchema);
  assert.equal(second.capabilitySchema, third.capabilitySchema);
  assert.equal(Object.isFrozen(first.capabilitySchema), true);
  assert.deepEqual(first.capabilitySchema, { reads: ['agent.capabilityCatalog'], writes: [] });
});

test('已注册的命令不会被重复注册或覆盖', () => {
  const registry = makeRegistry({ known: ['agent.capabilities.search'] });
  registerAgentDiscoveryCommands(registry);
  assert.deepEqual(
    registry.defs.map((def) => def.id),
    ['agent.command.describe', 'agent.models.search'],
  );
  const all = makeRegistry({ known: AGENT_DISCOVERY_COMMAND_IDS });
  assert.equal(registerAgentDiscoveryCommands(all), all);
  assert.deepEqual(all.defs, []);
});

test('argsSchema：query 与 commandId 的必填约束、limit 边界一致', () => {
  const registry = makeRegistry();
  registerAgentDiscoveryCommands(registry);
  const [search, describe, models] = registry.defs;
  assert.deepEqual(search.argsSchema.required, ['query']);
  assert.deepEqual(describe.argsSchema.required, ['commandId']);
  assert.equal(models.argsSchema.required, undefined);
  for (const def of [search, models]) {
    assert.deepEqual(def.argsSchema.properties.limit, {
      type: 'integer',
      minimum: 1,
      maximum: 12,
      default: 6,
    });
  }
  assert.deepEqual(models.argsSchema.properties.kind.enum, ['image', 'video', 'audio', 'text']);
  assert.deepEqual(models.argsSchema.properties.inputKinds.items.enum, ['image', 'video', 'audio', 'text']);
  assert.deepEqual(models.argsSchema.properties.query, { type: 'string', default: '' });
});

test('capabilities.search 的 execute 把自身注册表注入检索上下文', async () => {
  const registry = makeRegistry({
    entries: [
      { id: 'node.create', description: '创建节点', argsSchema: { properties: { type: {} } } },
      { id: 'canvas.export', description: '导出画布' },
    ],
  });
  registerAgentDiscoveryCommands(registry);
  const search = registry.defs.find((def) => def.id === 'agent.capabilities.search');
  const result = await search.execute({ query: 'node.create', limit: 1 });
  assert.equal(result.query, 'node.create');
  assert.deepEqual(result.commandIds, ['node.create']);
  assert.equal(result.commands[0].commandId, 'node.create');
  assert.deepEqual(result.commands[0].argNames, ['type']);
  // 只有 node.create 的 id 命中查询串，canvas.export 得分为 0 被过滤。
  assert.equal(result.totalMatched, 1);
  const empty = await search.execute({ query: '' });
  assert.equal(empty.totalMatched, 2);
  assert.equal(empty.commands.length, 2);
});

test('command.describe 的 execute 命中已注册命令并回全量 schema', async () => {
  const target = {
    id: 'node.create',
    description: '创建节点',
    riskLevel: 'low',
    argsSchema: { type: 'object', properties: { type: {} } },
    capabilitySchema: { reads: ['canvas.nodes'], writes: ['canvas.nodes'] },
    returnSchema: { aliasFields: ['nodeIds'] },
  };
  const registry = makeRegistry({ entries: [target] });
  registerAgentDiscoveryCommands(registry);
  const describe = registry.defs.find((def) => def.id === 'agent.command.describe');
  assert.equal(await describe.execute({ commandId: ' node.create ' }).argsSchema, target.argsSchema);
  const found = await describe.execute({ commandId: 'node.create' });
  assert.equal(found.found, true);
  assert.deepEqual(found.returnAliasFields, ['nodeIds']);
  const missing = await describe.execute({ commandId: 'nope' });
  assert.equal(missing.found, false);
  assert.equal(missing.errorCode, 'AGENT_COMMAND_NOT_FOUND');
  assert.equal(missing.message, 'Canvas command is not registered: nope');
});

test('models.search 的 execute 只按参数检索模型清单，不接收注册表', async () => {
  const registry = makeRegistry();
  registerAgentDiscoveryCommands(registry);
  const models = registry.defs.find((def) => def.id === 'agent.models.search');
  const result = await models.execute({ kind: 'image', limit: 2 });
  assert.equal(result.models.length, 2);
  assert.deepEqual(
    result.models.map((model) => model.kind),
    ['image', 'image'],
  );
  assert.deepEqual(Object.keys(result).sort(), ['modelIds', 'models', 'query', 'totalMatched']);
  const empty = await models.execute();
  assert.equal(empty.query, '');
  assert.equal(empty.models.length, 6);
});

test('models.search 会按输入槽位过滤清单', async () => {
  const registry = makeRegistry();
  registerAgentDiscoveryCommands(registry);
  const models = registry.defs.find((def) => def.id === 'agent.models.search');
  const result = await models.execute({ inputKinds: ['image'], kind: 'video', limit: 3 });
  assert.equal(result.totalMatched <= 143, true);
  for (const model of result.models) {
    assert.equal(model.kind, 'video');
    assert.equal(model.inputSlots.allowedKinds.includes('image'), true);
  }
});

test('三个命令的 execute 都以函数暴露且 returnSchema 覆盖结果字段', () => {
  const registry = makeRegistry();
  registerAgentDiscoveryCommands(registry);
  for (const def of registry.defs) {
    assert.equal(typeof def.execute, 'function');
    assert.equal(typeof def.description, 'string');
    assert.ok(def.description.length > 10);
    assert.equal(def.argsSchema.type, 'object');
    assert.equal(typeof def.returnSchema.properties, 'object');
  }
  assert.deepEqual(Object.keys(registry.defs[0].returnSchema.properties).sort(), ['commandIds', 'commands']);
  assert.deepEqual(Object.keys(registry.defs[2].returnSchema.properties).sort(), ['modelIds', 'models']);
});
