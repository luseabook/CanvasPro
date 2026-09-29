import test from 'node:test';
import assert from 'node:assert/strict';
import { registerMediaToolCommands } from './mediaToolCommands.js';

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

function createHost({ nodes = {}, selectedNodeIds = [], mediaTools = {}, ...extra } = {}) {
  const calls = { updated: [], batches: 0, commits: 0 };
  const store = {
    getStateRaw: () => ({ nodes, selectedNodeIds }),
    updateNodeData: (id, patch) => {
      calls.updated.push([id, patch]);
    },
    batch: (fn) => {
      calls.batches += 1;
      fn();
    },
  };
  const host = {
    store,
    graphStore: store,
    mediaTools,
    commit: () => {
      calls.commits += 1;
    },
    ...extra,
  };
  return { host, calls };
}

function setup(options = {}) {
  const registry = createRegistry();
  registerMediaToolCommands(registry);
  const { host, calls } = createHost(options);
  return { registry, host, calls, command: (id) => registry.commands.get(id) };
}

function videoNode(extra = {}) {
  return { type: 'ai-video', ...extra };
}

function imageNode(extra = {}) {
  return { type: 'source-image', ...extra };
}

test('mediaToolCommands: 注册 6 条命令，id、顺序与风险等级冻结', () => {
  const { registry } = setup();
  assert.deepEqual(
    [...registry.commands.values()].map(({ id, riskLevel }) => [id, riskLevel]),
    [
      ['video.reverse', 'confirm'],
      ['video.extractKeyframes', 'confirm'],
      ['video.separateAv', 'confirm'],
      ['audio.separate', 'confirm'],
      ['image.splitGrid', 'confirm'],
      ['media.resetSize', 'safe'],
    ],
  );
});

test('mediaToolCommands: 单跑命令共享 nodeId 必填与 nodes 读写能力面', () => {
  const { registry } = setup();
  for (const id of ['video.reverse', 'video.separateAv', 'audio.separate']) {
    const command = registry.commands.get(id);
    assert.deepEqual(
      {
        required: command.argsSchema.required,
        argsFallback: command.argsSchema.selectionFallback,
        reads: command.capabilitySchema.reads,
        writes: command.capabilitySchema.writes,
        mounted: command.capabilitySchema.requiresMountedRuntime,
        aliases: command.returnSchema.aliasFields,
      },
      {
        required: ['nodeId'],
        argsFallback: true,
        reads: ['nodes'],
        writes: ['nodes'],
        mounted: false,
        aliases: ['nodeId', 'nodeIds', 'value'],
      },
      String(id),
    );
  }
  assert.deepEqual(
    {
      extractDefaults: registry.commands.get('video.extractKeyframes').argsSchema.defaults,
      gridDefaults: registry.commands.get('image.splitGrid').argsSchema.defaults,
      gridAliases: registry.commands.get('image.splitGrid').returnSchema.aliasFields,
      resetAliases: registry.commands.get('media.resetSize').returnSchema.aliasFields,
    },
    {
      extractDefaults: { options: {} },
      gridDefaults: { cols: 2, rows: 2 },
      gridAliases: ['nodeId', 'nodeIds', 'cols', 'rows', 'value'],
      resetAliases: ['nodeIds', 'sizes'],
    },
  );
});

test('mediaToolCommands: video.reverse validate 支持显式、大小写无关与选区回退', () => {
  const { host, command } = setup({
    nodes: { v1: videoNode(), v2: { type: ' AI-VIDEO ' }, i1: imageNode() },
    selectedNodeIds: ['i1', 'v1'],
  });
  const cmd = command('video.reverse');
  assert.deepEqual(
    [cmd.validate({ nodeId: ' v1 ' }, host), cmd.validate({ nodeId: 'v2' }, host), cmd.validate({}, host)],
    [{ args: { nodeId: 'v1' } }, { args: { nodeId: 'v2' } }, { args: { nodeId: 'v1' } }],
  );
  assert.throws(
    () => cmd.validate({ nodeId: 'i1' }, host),
    (error) => error.errorCode === 'UNSUPPORTED_NODE_TYPE' && error.details.nodeId === 'i1',
  );
  assert.throws(
    () => cmd.validate({ nodeId: 'nope' }, host),
    (error) => error.errorCode === 'NODE_NOT_FOUND',
  );
  assert.throws(
    () => cmd.validate({}, { store: { getStateRaw: () => ({ nodes: {}, selectedNodeIds: [] }) } }),
    (error) => error.errorCode === 'MISSING_NODE_ID',
  );
});

test('mediaToolCommands: video.reverse execute 调 runVideoReverseFromNode 并按原样映射 videoId', async () => {
  const toolArgs = [];
  const { host, command } = setup({
    nodes: { v1: videoNode() },
    mediaTools: {
      runVideoReverseFromNode: async (nodeId) => {
        toolArgs.push(nodeId);
        return { ok: true, videoId: 'out-1' };
      },
    },
  });
  const result = await command('video.reverse').execute({ nodeId: 'v1' }, host);
  assert.deepEqual(
    [toolArgs, result.nodeId, result.nodeIds, result.videoId, result.value],
    [['v1'], 'v1', ['out-1'], 'out-1', { ok: true, videoId: 'out-1' }],
  );
});

test('mediaToolCommands: video.reverse 结果映射不做 trim，空白 videoId 仍进 nodeIds', async () => {
  const { host, command } = setup({
    nodes: { v1: videoNode() },
    mediaTools: { runVideoReverseFromNode: async () => ({ videoId: '  ' }) },
  });
  const result = await command('video.reverse').execute({ nodeId: 'v1' }, host);
  assert.deepEqual({ videoId: result.videoId, nodeIds: result.nodeIds }, { videoId: '  ', nodeIds: ['  '] });
});

test('mediaToolCommands: 工具缺失、工具返回失败、工具无返回时的错误码', async () => {
  const noTool = setup({ nodes: { v1: videoNode() } });
  await assert.rejects(
    () => noTool.command('video.reverse').execute({ nodeId: 'v1' }, noTool.host),
    (error) => error.errorCode === 'MEDIA_TOOL_UNAVAILABLE' && error.details.tool === 'runVideoReverseFromNode',
  );
  const failedTool = setup({
    nodes: { v1: videoNode() },
    mediaTools: { runVideoReverseFromNode: async () => ({ ok: false, message: 'boom' }) },
  });
  await assert.rejects(
    () => failedTool.command('video.reverse').execute({ nodeId: 'v1' }, failedTool.host),
    (error) => error.errorCode === 'MEDIA_TOOL_NO_RESULT' && error.message === 'boom',
  );
  const emptyTool = setup({
    nodes: { v1: videoNode() },
    mediaTools: { runVideoReverseFromNode: async () => undefined },
  });
  await assert.rejects(
    () => emptyTool.command('video.reverse').execute({ nodeId: 'v1' }, emptyTool.host),
    (error) => error.errorCode === 'MEDIA_TOOL_NO_RESULT' && error.message === 'Media tool did not return a result.',
  );
});

test('mediaToolCommands: video.extractKeyframes validate 只收普通对象 options', () => {
  const { host, command } = setup({ nodes: { v1: videoNode() } });
  const cmd = command('video.extractKeyframes');
  assert.deepEqual(
    [
      cmd.validate({ nodeId: 'v1' }, host),
      cmd.validate({ nodeId: 'v1', options: { every: 5 } }, host),
      cmd.validate({ nodeId: 'v1', options: [1, 2] }, host),
      cmd.validate({ nodeId: 'v1', options: 'x' }, host),
    ],
    [
      { args: { nodeId: 'v1', options: {} } },
      { args: { nodeId: 'v1', options: { every: 5 } } },
      { args: { nodeId: 'v1', options: {} } },
      { args: { nodeId: 'v1', options: {} } },
    ],
  );
});

test('mediaToolCommands: video.extractKeyframes execute 归一 nodeIds，空结果抛错', async () => {
  const toolArgs = [];
  const { host, command } = setup({
    nodes: { v1: videoNode() },
    mediaTools: {
      runSmartClipKeyframeExtractionFromVideoNode: async (args) => {
        toolArgs.push(args);
        return { ok: true, nodeIds: [' k1 ', '', 'k2'] };
      },
    },
  });
  const result = await command('video.extractKeyframes').execute({ nodeId: 'v1', options: { every: 2 } }, host);
  assert.deepEqual([toolArgs, result.nodeId, result.nodeIds], [[{ nodeId: 'v1', options: { every: 2 } }], 'v1', ['k1', 'k2']]);

  const emptyResult = setup({
    nodes: { v1: videoNode() },
    mediaTools: { runSmartClipKeyframeExtractionFromVideoNode: async () => ({ ok: true, nodeIds: ['   '] }) },
  });
  await assert.rejects(
    () => emptyResult.command('video.extractKeyframes').execute({ nodeId: 'v1', options: {} }, emptyResult.host),
    (error) => error.errorCode === 'MEDIA_TOOL_NO_RESULT' && error.message === 'No keyframe nodes were created.',
  );
});

test('mediaToolCommands: video.separateAv 与 audio.separate 的结果映射与类型域', async () => {
  const { host, command } = setup({
    nodes: { v1: videoNode(), a1: { type: 'source-audio' } },
    mediaTools: {
      runVideoAudioSeparationFromNode: async () => ({ videoId: 'mv', audioId: 'ma' }),
      runAudioSeparationFromNode: async () => ({ leaderId: 'lead', peerId: 'peer' }),
    },
  });
  assert.deepEqual(
    [command('video.separateAv').validate({ nodeId: 'v1' }, host), command('audio.separate').validate({ nodeId: 'a1' }, host)],
    [{ args: { nodeId: 'v1' } }, { args: { nodeId: 'a1' } }],
  );
  assert.throws(
    () => command('audio.separate').validate({ nodeId: 'v1' }, host),
    (error) => error.errorCode === 'UNSUPPORTED_NODE_TYPE',
  );
  const separated = await command('video.separateAv').execute({ nodeId: 'v1' }, host);
  const audio = await command('audio.separate').execute({ nodeId: 'a1' }, host);
  assert.deepEqual(
    [
      { nodeId: separated.nodeId, nodeIds: separated.nodeIds, videoId: separated.videoId, audioId: separated.audioId },
      { nodeId: audio.nodeId, nodeIds: audio.nodeIds, leaderId: audio.leaderId, peerId: audio.peerId },
    ],
    [
      { nodeId: 'v1', nodeIds: ['mv', 'ma'], videoId: 'mv', audioId: 'ma' },
      { nodeId: 'a1', nodeIds: ['lead', 'peer'], leaderId: 'lead', peerId: 'peer' },
    ],
  );
});

test('mediaToolCommands: image.splitGrid 的 cols/rows 归一为 1..12 的截断整数', () => {
  const { host, command } = setup({ nodes: { i1: imageNode() } });
  const cmd = command('image.splitGrid');
  const cols = (input) => cmd.validate(input, host).args.cols;
  const rows = (input) => cmd.validate(input, host).args.rows;
  assert.deepEqual(
    [
      cols({ nodeId: 'i1' }),
      rows({ nodeId: 'i1' }),
      cols({ nodeId: 'i1', cols: null }),
      cols({ nodeId: 'i1', cols: -5 }),
      cols({ nodeId: 'i1', cols: 0 }),
      cols({ nodeId: 'i1', cols: 3.7 }),
      cols({ nodeId: 'i1', cols: 99 }),
      cols({ nodeId: 'i1', cols: Infinity }),
      cols({ nodeId: 'i1', cols: 'abc' }),
      rows({ nodeId: 'i1', rows: '4' }),
    ],
    [2, 2, 1, 1, 1, 3, 12, 2, 2, 4],
  );
  assert.ok(cols({ nodeId: 'i1', cols: -0 }) === 1);
});

test('mediaToolCommands: image.splitGrid execute 传 nodeData 并要求非空 newIds', async () => {
  const toolArgs = [];
  const node = imageNode({ id: 'i1', imageWidth: 800 });
  const { host, command } = setup({
    nodes: { i1: node },
    mediaTools: {
      executeGridCrop: async (args) => {
        toolArgs.push(args);
        return { ok: true, newIds: [' g1 ', '', 'g2'] };
      },
    },
  });
  const result = await command('image.splitGrid').execute({ nodeId: 'i1', cols: 3, rows: 2 }, host);
  assert.deepEqual(
    [toolArgs, result.nodeId, result.nodeIds, result.cols, result.rows],
    [[{ nodeData: node, cols: 3, rows: 2 }], 'i1', ['g1', 'g2'], 3, 2],
  );

  const empty = setup({
    nodes: { i1: node },
    mediaTools: { executeGridCrop: async () => ({ ok: true }) },
  });
  await assert.rejects(
    () => empty.command('image.splitGrid').execute({ nodeId: 'i1', cols: 2, rows: 2 }, empty.host),
    (error) => error.errorCode === 'MEDIA_TOOL_NO_RESULT' && error.message === 'No image grid nodes were created.',
  );
});

test('mediaToolCommands: media.resetSize validate 去空去重，显式 nodeId 缺节点即抛错', () => {
  const { host, command } = setup({
    nodes: {
      a: imageNode({ imageWidth: 800, imageHeight: 600 }),
      b: videoNode(),
      t: { type: 'comment-note' },
    },
    selectedNodeIds: ['a', ' t ', 'z'],
  });
  const cmd = command('media.resetSize');
  assert.deepEqual(
    [
      cmd.validate({ ids: ['a', '', 'a', 'b'] }, host).args.ids,
      cmd.validate({ nodeId: 'a' }, host).args.ids,
      cmd.validate({ ids: ['a', 't'] }, host).args.ids,
      cmd.validate({}, host).args.ids,
    ],
    [['a', 'b'], ['a'], ['a'], ['a']],
  );
  assert.throws(
    () => cmd.validate({ nodeId: 'zzz' }, host),
    (error) => error.errorCode === 'NODE_NOT_FOUND' && error.details.nodeId === 'zzz',
  );
  assert.throws(
    () => cmd.validate({ nodeId: 't' }, host),
    (error) => error.errorCode === 'UNSUPPORTED_NODE_TYPE',
  );
  assert.throws(
    () => cmd.validate({}, { store: { getStateRaw: () => ({ nodes: {}, selectedNodeIds: [] }) } }),
    (error) => error.errorCode === 'MISSING_NODE_ID',
  );
});

test('mediaToolCommands: media.resetSize execute 按节点类型算尺寸并批量提交', () => {
  const { host, calls, command } = setup({
    nodes: {
      a: imageNode({ imageWidth: 800, imageHeight: 600 }),
      b: { type: 'source-video' },
      c: { type: 'ai-image' },
      d: { type: 'source-image' },
      e: videoNode(),
    },
  });
  const result = command('media.resetSize').execute({ ids: ['a', 'b', 'c', 'd', 'e'] }, host);
  assert.deepEqual(
    [result.nodeIds, result.sizes, calls.updated, calls.batches, calls.commits],
    [
      ['a', 'b', 'c', 'd', 'e'],
      {
        a: { width: 384, height: 288 },
        b: { width: 512, height: 288 },
        c: { width: 288, height: 288 },
        d: { width: 512, height: 288 },
        e: { width: 288, height: 288 },
      },
      [
        ['a', { width: 384, height: 288, needsAutoResize: false }],
        ['b', { width: 512, height: 288, needsAutoResize: false }],
        ['c', { width: 288, height: 288, needsAutoResize: false }],
        ['d', { width: 512, height: 288, needsAutoResize: false }],
        ['e', { width: 288, height: 288, needsAutoResize: false }],
      ],
      1,
      1,
    ],
  );
});

test('mediaToolCommands: media.resetSize 认 aspectRatio 并用宿主尺寸覆盖钩子', () => {
  const { host, command } = setup({
    nodes: {
      i: { type: 'ai-image', aspectRatio: '16:9' },
      v: { type: 'source-video' },
    },
    getNodeDefaultSize: (type) => ({ width: 111, height: 222, type }),
    getAIGenerationNodeSize: () => ({ width: 333, height: 444 }),
  });
  const result = command('media.resetSize').execute({ ids: ['i', 'v'] }, host);
  assert.deepEqual(result.sizes, {
    i: { width: 333, height: 444 },
    v: { width: 111, height: 222 },
  });
});
