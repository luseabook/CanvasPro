import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCanvasMcpTools,
  canExposeCanvasCommand,
  describeCanvasMcpModels,
  sanitizeMcpResult,
} from './canvasMcpTools.js';

function command(over = {}) {
  return {
    id: 'graph.addNode',
    riskLevel: 'safe',
    description: 'Adds a node.',
    capabilitySchema: { writes: ['nodes'] },
    argsSchema: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] },
    ...over,
  };
}

function registry(commands) {
  return { list: () => commands };
}

test('sanitizeMcpResult 保留普通标量与普通字符串', () => {
  assert.equal(sanitizeMcpResult(7), 7);
  assert.equal(sanitizeMcpResult(null), null);
  assert.equal(sanitizeMcpResult(true), true);
  assert.equal(sanitizeMcpResult('hello'), 'hello');
});

test('sanitizeMcpResult 把内联媒体替换为占位符', () => {
  assert.equal(sanitizeMcpResult('data:image/png;base64,AAAA'), '[inline media omitted]');
  assert.equal(sanitizeMcpResult('blob:http://x/y'), '[inline media omitted]');
  assert.equal(sanitizeMcpResult('DATA:image/png;base64,AAAA'), '[inline media omitted]');
  assert.equal(sanitizeMcpResult('https://x/y.png'), 'https://x/y.png');
});

test('sanitizeMcpResult 截断超长字符串', () => {
  const long = 'a'.repeat(24001);
  const result = sanitizeMcpResult(long);
  assert.equal(result.length, 24000 + '…[truncated]'.length);
  assert.ok(result.endsWith('…[truncated]'));
  assert.equal(sanitizeMcpResult('a'.repeat(24000)), 'a'.repeat(24000));
});

test('sanitizeMcpResult 丢弃敏感键与函数值', () => {
  const result = sanitizeMcpResult({
    apiKey: 'secret',
    Authorization: 'Bearer x',
    manifestBundle: { a: 1 },
    providerConfig: {},
    nested: { executionManifest: 1, keep: 2 },
    handler: () => {},
    plain: 3,
  });
  assert.deepEqual(result, { nested: { keep: 2 }, plain: 3 });
});

test('sanitizeMcpResult 递归处理数组并保留长度', () => {
  assert.deepEqual(sanitizeMcpResult([1, 'x', { token: 't', ok: true }]), [1, 'x', { ok: true }]);
});

test('sanitizeMcpResult 条目过多时抛错并提示不要重放变更', () => {
  assert.throws(
    () => sanitizeMcpResult(new Array(2001).fill(1)),
    /too many entries; request a smaller selection\. Do not resubmit a mutation\./,
  );
  assert.equal(sanitizeMcpResult(new Array(2000).fill(1)).length, 2000);
});

test('sanitizeMcpResult 在 18 层以内继续下钻，第 19 层起替换为占位符', () => {
  let shallow = 'leaf';
  for (let i = 0; i < 18; i += 1) shallow = { next: shallow };
  assert.ok(JSON.stringify(sanitizeMcpResult(shallow)).includes('"leaf"'));
  let deep = 'leaf';
  for (let i = 0; i < 19; i += 1) deep = { next: deep };
  const result = JSON.stringify(sanitizeMcpResult(deep));
  assert.equal(result.includes('"leaf"'), false);
  assert.ok(result.includes('[depth limit]'));
});

test('canExposeCanvasCommand 接受可写的画布安全命令', () => {
  assert.equal(canExposeCanvasCommand(command()), true);
  assert.equal(canExposeCanvasCommand(command({ riskLevel: 'confirm' })), true);
});

test('canExposeCanvasCommand 拒绝缺 writes、需系统访问或非法风险等级', () => {
  assert.equal(canExposeCanvasCommand(command({ capabilitySchema: {} })), false);
  assert.equal(canExposeCanvasCommand(command({ capabilitySchema: { writes: 'nodes' } })), false);
  assert.equal(
    canExposeCanvasCommand(command({ capabilitySchema: { writes: ['nodes'], requiresSystemAccess: true } })),
    false,
  );
  assert.equal(canExposeCanvasCommand(command({ riskLevel: 'dangerous' })), false);
  assert.equal(canExposeCanvasCommand(command({ riskLevel: undefined })), false);
});

test('canExposeCanvasCommand 拒绝私有命名空间', () => {
  for (const ns of ['agent', 'clipboard', 'video', 'audio', 'image']) {
    assert.equal(canExposeCanvasCommand(command({ id: ns + '.do' })), false);
  }
  assert.equal(canExposeCanvasCommand(command({ id: 'graph.do' })), true);
});

test('canExposeCanvasCommand 拒绝越界的写入目标', () => {
  assert.equal(
    canExposeCanvasCommand(command({ capabilitySchema: { writes: ['nodes', 'secrets'] } })),
    false,
  );
});

test('canExposeCanvasCommand 对生成任务需要额外授权，generation.cancel 例外', () => {
  const schema = { writes: ['generationTasks'] };
  assert.equal(canExposeCanvasCommand(command({ id: 'generation.run', capabilitySchema: schema })), false);
  assert.equal(
    canExposeCanvasCommand(command({ id: 'generation.run', capabilitySchema: schema }), {
      allowGeneration: true,
    }),
    true,
  );
  assert.equal(canExposeCanvasCommand(command({ id: 'generation.cancel', capabilitySchema: schema })), true);
});

test('buildCanvasMcpTools 生成工具名、输入模式与注记', () => {
  const { tools, commandIds } = buildCanvasMcpTools(registry([command()]));
  assert.equal(tools.length, 2);
  const [tool] = tools;
  assert.equal(tool.name, 'canvas_graph_addNode');
  assert.equal(tool.inputSchema.type, 'object');
  assert.deepEqual(tool.inputSchema.required, ['nodeId', 'requestKey']);
  assert.deepEqual(tool.inputSchema.properties.nodeId, { type: 'string' });
  assert.deepEqual(tool.inputSchema.properties.requestKey, {
    type: 'string',
    minLength: 8,
    maxLength: 100,
    description: 'Unique operation ID; reuse only when retrying exactly the same call.',
  });
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.deepEqual(tool.annotations, {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: false,
  });
  assert.equal(commandIds.get('canvas_graph_addNode'), 'graph.addNode');
  assert.equal(commandIds.has('canvas_models'), false);
});

test('buildCanvasMcpTools 补全数组参数的 items 并对只读命令标注', () => {
  const readOnly = command({
    id: 'graph.list',
    riskLevel: 'safe',
    capabilitySchema: { writes: [] },
    argsSchema: {
      type: 'object',
      properties: { filters: { type: 'array' }, nested: { type: 'array', items: { type: 'string' } } },
      required: [],
    },
  });
  const { tools } = buildCanvasMcpTools(registry([readOnly]));
  assert.deepEqual(tools[0].inputSchema.properties.filters, { type: 'array', items: {} });
  assert.deepEqual(tools[0].inputSchema.properties.nested, { type: 'array', items: { type: 'string' } });
  assert.equal(tools[0].annotations.readOnlyHint, true);
});

test('buildCanvasMcpTools 对生成类命令追加额度提示并标 openWorldHint', () => {
  const generation = command({
    id: 'generation.run',
    capabilitySchema: { writes: ['generationTasks'] },
  });
  const { tools } = buildCanvasMcpTools(registry([generation]), { allowGeneration: true });
  assert.equal(
    tools[0].description,
    "Adds a node. Uses the connected canvas. Generation may consume provider credits; follow the user's authorized scope. Reuse requestKey when retrying an uncertain submission.",
  );
  assert.equal(tools[0].annotations.openWorldHint, true);
});

test('buildCanvasMcpTools 过滤掉不可暴露的命令', () => {
  const hidden = command({ id: 'video.render' });
  const { tools } = buildCanvasMcpTools(registry([command(), hidden]));
  assert.equal(tools.length, 2);
  assert.equal(tools[0].name, 'canvas_graph_addNode');
  assert.equal(tools[1].name, 'canvas_models');
});

test('buildCanvasMcpTools 名字冲突时抛错', () => {
  const clash = command({ id: 'graph.addNode' });
  assert.throws(() => buildCanvasMcpTools(registry([clash, command({ id: 'graph.addNode' })])), {
    message: 'Canvas MCP tool name collision',
  });
});

test('buildCanvasMcpTools 总附带 canvas_models 发现工具', () => {
  const { tools } = buildCanvasMcpTools(registry([]));
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, 'canvas_models');
  assert.deepEqual(tools[0].inputSchema.required, ['requestKey']);
  assert.deepEqual(tools[0].inputSchema.properties.kind.enum, ['text', 'image', 'video', 'audio']);
  assert.deepEqual(tools[0].annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  });
});

test('describeCanvasMcpModels 汇总总数并分页', () => {
  const manifests = Array.from({ length: 25 }, (_, i) => ({
    modelId: 'm' + i,
    displayName: 'Model ' + i,
    kind: 'image',
    provider: 'p',
  }));
  const page = describeCanvasMcpModels(manifests, { offset: 0 });
  assert.equal(page.total, 25);
  assert.equal(page.nextOffset, 20);
  assert.equal(page.models.length, 20);
  const last = describeCanvasMcpModels(manifests, { offset: 20 });
  assert.equal(last.nextOffset, null);
  assert.equal(last.models.length, 5);
});

test('describeCanvasMcpModels 按 kind、modelId 与查询词过滤', () => {
  const manifests = [
    { modelId: 'a', displayName: 'Sunset', kind: 'image', provider: 'acme' },
    { modelId: 'b', name: 'Noon', kind: 'video', provider: 'other' },
    { modelId: 'c', label: 'Rain', kind: 'image', provider: 'Acme Cloud' },
  ];
  assert.deepEqual(
    describeCanvasMcpModels(manifests, { kind: 'image' }).models.map((m) => m.modelId),
    ['a', 'c'],
  );
  assert.deepEqual(
    describeCanvasMcpModels(manifests, { modelId: 'b' }).models.map((m) => m.modelId),
    ['b'],
  );
  assert.deepEqual(
    describeCanvasMcpModels(manifests, { query: 'ACME' }).models.map((m) => m.modelId),
    ['a', 'c'],
  );
  assert.deepEqual(
    describeCanvasMcpModels(manifests, { query: 'rain' }).models.map((m) => m.modelId),
    ['c'],
  );
});

test('describeCanvasMcpModels 只在指定 modelId 时附上字段与输入槽', () => {
  const manifests = [
    {
      modelId: 'a',
      displayName: 'A',
      kind: 'text',
      provider: 'p',
      uiSchema: { fields: [{ key: 'prompt' }], inputSlots: { in: {} } },
      inputSlots: { top: {} },
    },
  ];
  const without = describeCanvasMcpModels(manifests, {});
  assert.equal('fields' in without.models[0], false);
  assert.equal('inputSlots' in without.models[0], false);
  const withId = describeCanvasMcpModels(manifests, { modelId: 'a' });
  assert.deepEqual(withId.models[0].fields, [{ key: 'prompt' }]);
  assert.deepEqual(withId.models[0].inputSlots, { top: {} });
});

test('describeCanvasMcpModels 名称回退顺序与非法 offset 归零', () => {
  const manifests = [
    { modelId: 'a', label: 'OnlyLabel', kind: 'text', provider: 'p' },
    { modelId: 'b', kind: 'text', provider: 'p' },
  ];
  const page = describeCanvasMcpModels(manifests, { offset: -5 });
  assert.equal(page.models[0].name, 'OnlyLabel');
  assert.equal(page.models[1].name, undefined);
  assert.equal(describeCanvasMcpModels(manifests, { offset: 1.5 }).models.length, 2);
});

test('describeCanvasMcpModels 在分页刚好用完时不再给出下一段', () => {
  const manifests = Array.from({ length: 20 }, (_, i) => ({
    modelId: 'm' + i,
    displayName: 'Model ' + i,
    kind: 'image',
    provider: 'p',
  }));
  const page = describeCanvasMcpModels(manifests, { offset: 0 });
  assert.equal(page.total, 20);
  assert.equal(page.models.length, 20);
  assert.equal(page.nextOffset, null);
});
