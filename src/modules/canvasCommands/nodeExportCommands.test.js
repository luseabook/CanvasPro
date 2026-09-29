import test from 'node:test';
import assert from 'node:assert/strict';
import { registerNodeExportCommands } from './nodeExportCommands.js';

function createRegistry() {
  const commands = new Map();
  return {
    commands,
    register(command) {
      commands.set(command.id, command);
      return this;
    },
  };
}

function setup({ nodes = {}, selectedNodeIds = [], nodeExport, windowObject } = {}) {
  const store = { getStateRaw: () => ({ nodes, selectedNodeIds }) };
  const host = { store, graphStore: store };
  if (nodeExport !== undefined) host.nodeExport = nodeExport;
  if (windowObject !== undefined) host.windowObject = windowObject;
  const registry = createRegistry();
  registerNodeExportCommands(registry);
  return { registry, host, nodes, command: () => registry.commands.get('node.exportSelected') };
}

const textNode = (extra = {}) => ({ type: 'source-text', name: '文本', content: 'hello', ...extra });

test('nodeExportCommands: 注册 1 条 confirm 命令与能力/返回值 schema', () => {
  const { registry } = setup();
  assert.deepEqual([...registry.commands.keys()], ['node.exportSelected']);
  const command = registry.commands.get('node.exportSelected');
  assert.equal(command.riskLevel, 'confirm');
  assert.equal(command.argsSchema.selectionFallback, true);
  assert.deepEqual(command.capabilitySchema.reads, ['nodes', 'selection']);
  assert.deepEqual(command.capabilitySchema.writes, ['filesystem']);
  assert.equal(command.capabilitySchema.selectionFallback, true);
  assert.equal(command.capabilitySchema.requiresSystemAccess, true);
  assert.equal(Object.hasOwn(command.capabilitySchema, 'requiresMountedRuntime'), false);
  assert.deepEqual(command.returnSchema.aliasFields, ['path', 'filename', 'exportedCount', 'counts']);
});

test('nodeExportCommands: validate 在无 nodeExport 能力时返回 NODE_EXPORT_UNAVAILABLE', () => {
  const bare = setup({ nodes: { t1: textNode() } });
  const unavailable = bare.command().validate({ nodeId: 't1' }, bare.host);
  assert.deepEqual(
    { ok: unavailable.ok, errorCode: unavailable.errorCode, message: unavailable.message },
    {
      ok: false,
      errorCode: 'NODE_EXPORT_UNAVAILABLE',
      message: 'Node export is unavailable in this environment.',
    },
  );
  const wrongShape = setup({ nodes: { t1: textNode() }, nodeExport: { exportSelected: 'nope' } });
  assert.equal(wrongShape.command().validate({ nodeId: 't1' }, wrongShape.host).errorCode, 'NODE_EXPORT_UNAVAILABLE');
  const throughWindow = setup({
    nodes: { t1: textNode() },
    windowObject: { electronAPI: { nodeExport: { exportSelected: async () => ({ success: true }) } } },
  });
  assert.equal(throughWindow.command().validate({ nodeId: 't1' }, throughWindow.host).ok, undefined);
});

test('nodeExportCommands: validate 归一选择集合与目录别名', () => {
  const api = { exportSelected: async () => ({ success: true }) };
  const { host, command } = setup({
    nodes: { t1: textNode(), t2: textNode() },
    selectedNodeIds: ['t2'],
    nodeExport: api,
  });
  const argsFor = (input) => command().validate(input, host).args;
  assert.deepEqual(argsFor({ nodeId: ' t1 ' }).ids, ['t1']);
  assert.deepEqual(argsFor({ ids: ['t1', 't1', ''] }).ids, ['t1']);
  assert.deepEqual(argsFor({}).ids, ['t2']);
  assert.deepEqual(
    {
      directory: argsFor({ nodeId: 't1', downloadDir: ' D ' }).directory,
      outputPath: argsFor({ nodeId: 't1', filePath: ' p ' }).outputPath,
      filename: argsFor({ nodeId: 't1', fileName: ' f ' }).filename,
    },
    { directory: 'D', outputPath: 'p', filename: 'f' },
  );
  assert.deepEqual(
    {
      directory: argsFor({ nodeId: 't1', targetDir: 'x' }).directory,
      outputPath: argsFor({ nodeId: 't1', path: 'y' }).outputPath,
      filename: argsFor({ nodeId: 't1', filename: 'z' }).filename,
    },
    { directory: 'x', outputPath: 'y', filename: 'z' },
  );
  assert.deepEqual(
    {
      directory: argsFor({ nodeId: 't1' }).directory,
      outputPath: argsFor({ nodeId: 't1' }).outputPath,
      filename: argsFor({ nodeId: 't1' }).filename,
    },
    { directory: '', outputPath: '', filename: '' },
  );
});

test('nodeExportCommands: validate 的节点校验错误以 ok:false 返回', () => {
  const api = { exportSelected: async () => ({ success: true }) };
  const { host, command } = setup({
    nodes: { t1: textNode(), c1: { type: 'comment-note', name: '便签' } },
    selectedNodeIds: ['t1'],
    nodeExport: api,
  });
  const cmd = command();
  const missing = cmd.validate({ nodeId: 'ghost' }, host);
  assert.deepEqual({ ok: missing.ok, errorCode: missing.errorCode, details: missing.details }, {
    ok: false,
    errorCode: 'NODE_NOT_FOUND',
    details: { nodeId: 'ghost' },
  });
  const selectionWithGhost = setup({
    nodes: { t1: textNode() },
    selectedNodeIds: ['t1', 'ghost'],
    nodeExport: api,
  });
  assert.equal(selectionWithGhost.command().validate({}, selectionWithGhost.host).errorCode, 'NODE_NOT_FOUND');
  const emptySelection = setup({ nodes: {}, selectedNodeIds: [], nodeExport: api });
  assert.equal(emptySelection.command().validate({}, emptySelection.host).errorCode, 'INSUFFICIENT_NODES');
  const nothingExportable = cmd.validate({ nodeId: 'c1' }, host);
  assert.equal(nothingExportable.ok, false);
  assert.equal(nothingExportable.errorCode, 'NO_EXPORTABLE_ITEMS');
  assert.deepEqual(nothingExportable.details.ids, ['c1']);
  assert.deepEqual(nothingExportable.details.skipped, [
    { nodeId: 'c1', nodeName: '便签', nodeType: 'comment-note', reason: 'NO_EXPORTABLE_CONTENT' },
  ]);
});

test('nodeExportCommands: validate 收集文本导出项，无内容节点计入 skipped', () => {
  const api = { exportSelected: async () => ({ success: true }) };
  const { host, command } = setup({
    nodes: {
      t1: textNode(),
      t2: { type: 'ai-text', outputText: ' 生成结果 ', mainImageIndex: 0 },
      t3: { type: 'ai-text' },
      img: { type: 'source-image' },
    },
    nodeExport: api,
  });
  const args = command().validate({ ids: ['t1', 't2', 't3', 'img'] }, host).args;
  assert.deepEqual(args.ids, ['t1', 't2', 't3', 'img']);
  assert.deepEqual(args.items[0], {
    nodeId: 't1',
    nodeName: '文本',
    nodeType: 'source-text',
    kind: 'text',
    text: 'hello',
  });
  assert.deepEqual(args.items[1], {
    nodeId: 't2',
    nodeName: 't2',
    nodeType: 'ai-text',
    kind: 'text',
    text: ' 生成结果 ',
  });
  assert.deepEqual(args.skipped, [
    { nodeId: 't3', nodeName: 't3', nodeType: 'ai-text', reason: 'NO_EXPORTABLE_CONTENT' },
    { nodeId: 'img', nodeName: 'img', nodeType: 'source-image', reason: 'NO_EXPORTABLE_CONTENT' },
  ]);
});

test('nodeExportCommands: execute 调 exportSelected 并按参数传目录与文件项', async () => {
  const exportCalls = [];
  const api = {
    exportSelected: async (payload) => {
      exportCalls.push(payload);
      return { success: true, path: '/tmp/out.zip', filename: 'out.zip', exportedCount: 2 };
    },
  };
  const { host, command } = setup({ nodes: { t1: textNode() }, nodeExport: api });
  const cmd = command();
  const args = cmd.validate({ nodeId: 't1' }, host).args;
  const result = await cmd.execute(args, host);
  assert.deepEqual(exportCalls, [
    { items: args.items, directory: '', outputPath: '', filename: '' },
  ]);
  assert.deepEqual(result, {
    success: true,
    path: '/tmp/out.zip',
    filename: 'out.zip',
    exportedCount: 2,
    ids: ['t1'],
    skipped: [],
  });
});

test('nodeExportCommands: execute 合并 skipped 并透传结果字段', async () => {
  const exportCalls = [];
  const api = {
    exportSelected: async (payload) => {
      exportCalls.push(payload);
      return {
        success: true,
        path: '/tmp/out.zip',
        exportedCount: 1,
        skipped: [{ nodeId: 'x', reason: 'LOCKED' }],
      };
    },
  };
  const { host, command } = setup({
    nodes: { t1: textNode(), c1: { type: 'comment-note' } },
    nodeExport: api,
  });
  const cmd = command();
  const args = cmd.validate({ ids: ['t1', 'c1'], filename: ' z.zip ' }, host).args;
  assert.equal(args.skipped.length, 1);
  const result = await cmd.execute(args, host);
  assert.deepEqual(result.ids, ['t1', 'c1']);
  assert.deepEqual(result.skipped, [
    { nodeId: 'c1', nodeName: 'c1', nodeType: 'comment-note', reason: 'NO_EXPORTABLE_CONTENT' },
    { nodeId: 'x', reason: 'LOCKED' },
  ]);
  assert.deepEqual(
    { path: result.path, exportedCount: result.exportedCount },
    { path: '/tmp/out.zip', exportedCount: 1 },
  );
  assert.equal(exportCalls[0].filename, 'z.zip');
  assert.deepEqual(exportCalls[0].items, args.items);
});

test('nodeExportCommands: execute 的取消、失败与缺能力错误码', async () => {
  const makeHost = (exportImpl) => setup({ nodes: { t1: textNode() }, nodeExport: { exportSelected: exportImpl } });
  const canceled = makeHost(async () => ({ canceled: true }));
  const canceledArgs = canceled.command().validate({ nodeId: 't1' }, canceled.host).args;
  await assert.rejects(
    () => canceled.command().execute(canceledArgs, canceled.host),
    (error) => error.errorCode === 'NODE_EXPORT_CANCELED' && error.message === 'Node export was canceled.',
  );
  const coded = makeHost(async () => ({ success: false, code: 'DISK_FULL', message: 'disk full' }));
  const codedArgs = coded.command().validate({ nodeId: 't1' }, coded.host).args;
  await assert.rejects(
    () => coded.command().execute(codedArgs, coded.host),
    (error) => error.errorCode === 'DISK_FULL' && error.message === 'disk full' && error.details.code === 'DISK_FULL',
  );
  const uncoded = makeHost(async () => ({ success: false, error: 'bad' }));
  const uncodedArgs = uncoded.command().validate({ nodeId: 't1' }, uncoded.host).args;
  await assert.rejects(
    () => uncoded.command().execute(uncodedArgs, uncoded.host),
    (error) => error.errorCode === 'NODE_EXPORT_FAILED' && error.message === 'bad',
  );
  const silent = makeHost(async () => undefined);
  const silentArgs = silent.command().validate({ nodeId: 't1' }, silent.host).args;
  await assert.rejects(
    () => silent.command().execute(silentArgs, silent.host),
    (error) => error.errorCode === 'NODE_EXPORT_FAILED' && error.message === 'Node export failed.',
  );
  const unavailable = setup({ nodes: { t1: textNode() } });
  const unavailableArgs = unavailable.command().validate({ nodeId: 't1' }, unavailable.host);
  assert.equal(unavailableArgs.ok, false);
  await assert.rejects(
    () => unavailable.command().execute({ items: [], ids: [] }, unavailable.host),
    (error) => error.errorCode === 'NODE_EXPORT_UNAVAILABLE',
  );
});
