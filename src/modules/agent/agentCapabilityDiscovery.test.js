import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAgentSearchText,
  normalizeAgentSearchKey,
  searchAgentCommands,
  describeAgentCommand,
  searchAgentModels,
} from './agentCapabilityDiscovery.js';
import { listModelManifests } from '../../manifests/index.js';

function commandFixture(overrides = {}) {
  return {
    id: 'node.create',
    description: '在画布上创建一个节点',
    riskLevel: 'safe',
    capabilitySchema: { reads: ['canvas'], writes: ['canvas', 'canvas', ''] },
    argsSchema: { properties: { type: {}, prompt: {} } },
    returnSchema: { aliasFields: ['nodeId', 'nodeId', 'ids'] },
    ...overrides,
  };
}

function registryFixtures(commands) {
  return {
    list: () => commands,
    get: (id) => commands.find((command) => command.id === id) || null,
  };
}

test('检索文本归一：NFKC + trim + 小写', () => {
  assert.equal(normalizeAgentSearchText(' ＡＢＣ  '), 'abc');
  assert.equal(normalizeAgentSearchText('Seedance'), 'seedance');
  assert.equal(normalizeAgentSearchText(null), '');
  assert.equal(normalizeAgentSearchText(undefined), '');
});

test('检索键归一：额外剔除空白与常见分隔标点', () => {
  assert.equal(normalizeAgentSearchKey('Qwen-Edit 2511/2509'), 'qwenedit25112509');
  assert.equal(normalizeAgentSearchKey('图【生】视频（v2）,测试。'), '图生视频v2测试');
  assert.equal(normalizeAgentSearchKey('a|b,c'), 'abc');
});

test('结果上限钳位：非有限值走默认 6，其余截断到 1..12', () => {
  const commands = Array.from({ length: 14 }, (_, i) => commandFixture({ id: 'cmd-' + i }));
  const registry = registryFixtures(commands);
  const limitOf = (limit) =>
    searchAgentCommands({ commandRegistry: registry, query: '', limit }).commands.length;
  assert.equal(limitOf(undefined), 6);
  assert.equal(limitOf(NaN), 6);
  assert.equal(limitOf(Infinity), 6);
  assert.equal(limitOf(0), 1);
  assert.equal(limitOf(-5), 1);
  assert.equal(limitOf(2.9), 2);
  assert.equal(limitOf(99), 12);
});

test('命令检索：空查询时每条命令都得 1 分（全量命中，端口现状）', () => {
  const registry = registryFixtures([commandFixture(), commandFixture({ id: 'node.delete' })]);
  const res = searchAgentCommands({ commandRegistry: registry, query: '   ' });
  assert.deepEqual(res.commandIds, ['node.create', 'node.delete']);
  assert.equal(res.totalMatched, 2);
  assert.equal(res.query, '');
});

test('命令检索：命令 id 精确命中优先于描述命中，同分按注册表原序', () => {
  const registry = registryFixtures([
    commandFixture({ id: 'alpha', description: '提到 node 这个词' }),
    commandFixture({ id: 'node', description: '无关描述' }),
  ]);
  const res = searchAgentCommands({ commandRegistry: registry, query: 'node' });
  assert.deepEqual(res.commandIds, ['node', 'alpha']);
  assert.equal(res.totalMatched, 2);
});

test('命令检索：注册表不可用时返回空集合而不是抛异常', () => {
  for (const registry of [undefined, null, {}, { list: null }]) {
    const res = searchAgentCommands({ commandRegistry: registry, query: 'node' });
    assert.deepEqual(res.commandIds, []);
    assert.equal(res.totalMatched, 0);
  }
});

test('命令摘要：reads/writes 去空去重，argNames 取 argsSchema.properties 键序', () => {
  const registry = registryFixtures([commandFixture()]);
  const [summary] = searchAgentCommands({ commandRegistry: registry, query: 'create' }).commands;
  assert.deepEqual(summary, {
    commandId: 'node.create',
    description: '在画布上创建一个节点',
    riskLevel: 'safe',
    reads: ['canvas'],
    writes: ['canvas'],
    argNames: ['type', 'prompt'],
  });
});

test('命令摘要：riskLevel 缺失回落 safe，非数组能力面回落空数组', () => {
  const registry = registryFixtures([commandFixture({ riskLevel: undefined, capabilitySchema: undefined })]);
  const [summary] = searchAgentCommands({ commandRegistry: registry, query: 'node.create' }).commands;
  assert.ok(summary);
  assert.equal(summary.riskLevel, 'safe');
  assert.deepEqual(summary.reads, []);
  assert.deepEqual(summary.writes, []);
  assert.deepEqual(summary.argNames, ['type', 'prompt']);
});

test('命令详情：未注册时给结构化 not-found，注册时原样透传三张 schema', () => {
  const registry = registryFixtures([commandFixture()]);
  const miss = describeAgentCommand({ commandRegistry: registry, commandId: 'nope ' });
  assert.equal(miss.found, false);
  assert.equal(miss.commandId, 'nope');
  assert.equal(miss.errorCode, 'AGENT_COMMAND_NOT_FOUND');
  assert.equal(miss.message, 'Canvas command is not registered: nope');

  const hit = describeAgentCommand({ commandRegistry: registry, commandId: 'node.create' });
  assert.equal(hit.found, true);
  assert.equal(hit.argsSchema, registry.list()[0].argsSchema);
  assert.deepEqual(hit.returnAliasFields, ['nodeId', 'ids']);
  assert.equal(describeAgentCommand({ commandRegistry: {}, commandId: 'node.create' }).found, false);
});

test('模型检索：无条件时 totalMatched 为清单全量，返回体仍受 12 上限约束', () => {
  const all = listModelManifests();
  const res = searchAgentModels({ query: '', limit: all.length });
  assert.equal(res.totalMatched, all.length);
  assert.equal(res.models.length, 12);
  const byId = new Map(all.map((manifest) => [manifest.modelId, manifest]));
  for (const model of res.models) {
    const source = byId.get(model.modelId);
    assert.ok(source, model.modelId);
    assert.equal(model.displayName, source.displayName || source.modelId);
    assert.equal(model.fieldCount, model.uiSchema.fields.length);
  }
});

test('模型检索：kind 与 provider 精确过滤（大小写无关）', () => {
  const all = listModelManifests();
  const image = all.filter((manifest) => manifest.kind === 'image');
  const res = searchAgentModels({ kind: 'IMAGE', limit: image.length });
  assert.equal(res.totalMatched, image.length);
  assert.equal(res.models.length, Math.min(12, image.length));
  const imageIds = new Set(image.map((manifest) => manifest.modelId));
  for (const model of res.models) {
    assert.ok(imageIds.has(model.modelId), model.modelId);
    assert.equal(model.kind, 'image');
  }
  const provider = image[0].provider;
  const scoped = searchAgentModels({ kind: 'image', provider, limit: 12 });
  assert.ok(scoped.models.length > 0);
  assert.ok(scoped.models.every((model) => model.provider === provider));
});

test('模型检索：inputKinds 只放行接受该输入位的模型，且与 kind 过滤取交集', () => {
  const all = listModelManifests();
  const res = searchAgentModels({ kind: 'image', inputKinds: ['image'], limit: all.length });
  assert.ok(res.models.length > 0);
  for (const model of res.models) {
    const slots = model.inputSlots;
    const accepted =
      (slots.allowedKinds || []).includes('image') ||
      Number(slots.maxByKind?.image) > 0 ||
      Number(slots.minByKind?.image) > 0 ||
      (slots.fixedSlots || []).some((slot) => slot.kind === 'image');
    assert.ok(accepted, model.modelId);
  }
  assert.ok(res.totalMatched < all.length);
});

test('模型检索：inputSlots 摘要只保留有 id 的固定槽位并按存在与否出现键', () => {
  const res = searchAgentModels({ query: '', limit: 12 });
  for (const model of res.models) {
    assert.equal(typeof model.inputSlots, 'object');
    if (Array.isArray(model.inputSlots.fixedSlots)) {
      assert.ok(model.inputSlots.fixedSlots.length > 0);
      for (const slot of model.inputSlots.fixedSlots) {
        assert.ok(slot.id);
        assert.equal(typeof slot.required, 'boolean');
      }
    }
  }
});

test('模型检索：参数字段摘要保留白名单键，defaultValue 不在其中（端口现状）', () => {
  const withOptions = listModelManifests().find((manifest) =>
    (manifest.uiSchema?.fields || []).some((field) => Array.isArray(field.options) && field.options.length),
  );
  assert.ok(withOptions);
  const res = searchAgentModels({ query: withOptions.modelId, limit: 12 });
  const model = res.models.find((candidate) => candidate.modelId === withOptions.modelId);
  const source = withOptions.uiSchema.fields.find((field) => Array.isArray(field.options));
  const field = model.uiSchema.fields.find((candidate) => candidate.id === source.id);
  assert.equal(field.required, source.required === true);
  assert.equal('defaultValue' in field, false);
  assert.equal('description' in field, false);
  assert.deepEqual(
    field.options.map((option) => Object.keys(option)),
    source.options
      .slice(0, 60)
      .map((option) => (option.label === undefined ? ['value'] : ['value', 'label'])),
  );
});
