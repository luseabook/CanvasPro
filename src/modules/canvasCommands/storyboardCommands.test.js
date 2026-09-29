import test from 'node:test';
import assert from 'node:assert/strict';
import { registerStoryboardCommands } from './storyboardCommands.js';

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

function createHost({ nodes = {}, selectedNodeIds = [] } = {}) {
  const calls = { added: [], selected: [], batches: 0, commits: 0 };
  const store = {
    getStateRaw: () => ({ nodes, selectedNodeIds }),
    addNode: (node) => {
      calls.added.push(node);
      nodes[node.id] = node;
    },
    setSelectedNodes: (ids) => {
      calls.selected.push(ids);
    },
    batch: (fn) => {
      calls.batches += 1;
      fn();
    },
  };
  const host = {
    store,
    graphStore: store,
    commit: () => {
      calls.commits += 1;
    },
  };
  return { host, calls, nodes };
}

function setup(options = {}) {
  const registry = createRegistry();
  registerStoryboardCommands(registry);
  const { host, calls, nodes } = createHost(options);
  return { registry, host, calls, nodes, command: (id) => registry.commands.get(id) };
}

// 所有夹具都带显式 x/y：源节点缺坐标会让 findAvailablePosition 得到 NaN 并死循环（见收工报告）。
function sourceImage(extra = {}) {
  return {
    type: 'source-image',
    x: 0,
    y: 0,
    width: 512,
    height: 288,
    imageWidth: 512,
    imageHeight: 288,
    imageUrl: 'http://cdn/a.png',
    ...extra,
  };
}

function makeNodes(count) {
  const nodes = {};
  const ids = [];
  for (let index = 1; index <= count; index += 1) {
    const id = 'id-' + index;
    ids.push(id);
    nodes[id] = sourceImage();
  }
  return { nodes, ids };
}

test('storyboardCommands: 注册 2 条 safe 命令与参数/返回值 schema', () => {
  const { registry } = setup();
  assert.deepEqual(
    [...registry.commands.values()].map(({ id, riskLevel }) => [id, riskLevel]),
    [
      ['storyboard.createFromImages', 'safe'],
      ['storyboard.createGridFromNode', 'safe'],
    ],
  );
  const images = registry.commands.get('storyboard.createFromImages');
  const grid = registry.commands.get('storyboard.createGridFromNode');
  assert.deepEqual(
    {
      imagesDefaults: images.argsSchema.defaults,
      imagesReads: images.capabilitySchema.reads,
      imagesWrites: images.capabilitySchema.writes,
      imagesAliases: images.returnSchema.aliasFields,
      gridRequired: grid.argsSchema.required,
      gridDefaults: grid.argsSchema.defaults,
      gridReads: grid.capabilitySchema.reads,
      gridWrites: grid.capabilitySchema.writes,
    },
    {
      imagesDefaults: { orderBy: 'selection', placement: 'right-of-first-image' },
      imagesReads: ['nodes', 'selection'],
      imagesWrites: ['nodes', 'selection'],
      imagesAliases: ['nodeId', 'node', 'sourceNodeIds', 'cols', 'rows', 'cellCount'],
      gridRequired: ['sourceId', 'cols', 'rows'],
      gridDefaults: { baseShortSide: 400, placement: 'right-of-source' },
      gridReads: ['nodes'],
      gridWrites: ['nodes', 'selection'],
    },
  );
});

test('storyboardCommands: createFromImages validate 归一 ids/name 与选区回退', () => {
  const { host, command } = setup({
    nodes: { im1: sourceImage(), im2: sourceImage(), tx: { type: 'source-text' } },
    selectedNodeIds: ['tx', 'im2'],
  });
  const cmd = command('storyboard.createFromImages');
  const validated = cmd.validate({ ids: ['im1', 'im1', '', 'im2'] }, host).args;
  assert.deepEqual(
    [
      validated.ids,
      { cols: validated.cols, rows: validated.rows },
      validated.name,
      validated.orderBy,
      cmd.validate({ ids: ['im1'], name: '  ' }, host).args.name,
      cmd.validate({ ids: ['im1'], name: ' 分镜板 ' }, host).args.name,
      cmd.validate({ ids: [], nodeId: ' im1 ' }, host).args.ids,
      cmd.validate({}, host).args.ids,
      cmd.validate({ nodeId: 'im1' }, host).args.ids,
      cmd.validate({ ids: ['im1'], orderBy: 'visual' }, host).args.orderBy,
    ],
    [['im1', 'im2'], { cols: 2, rows: 1 }, 'Storyboard', undefined, 'Storyboard', '分镜板', ['im1'], ['im2'], ['im1'], 'visual'],
  );
});

test('storyboardCommands: createFromImages 网格归一覆盖自动、单列与钳制分支', () => {
  const { nodes, ids } = makeNodes(5);
  const { host, command } = setup({ nodes });
  const cmd = command('storyboard.createFromImages');
  const grid = (input) => {
    const args = cmd.validate(input, host).args;
    return { cols: args.cols, rows: args.rows };
  };
  assert.deepEqual(
    [
      grid({ ids }),
      grid({ ids: ids.slice(0, 4) }),
      grid({ ids: ids.slice(0, 1) }),
      grid({ ids, cols: 4 }),
      grid({ ids, rows: 2 }),
      grid({ ids, cols: 2, rows: 2 }),
      grid({ ids, cols: 0 }),
      grid({ ids, cols: 99, rows: 99 }),
      grid({ ids, columns: 5 }),
      grid({ ids: ids.slice(0, 2), cols: 'abc' }),
    ],
    [
      { cols: 3, rows: 2 },
      { cols: 2, rows: 2 },
      { cols: 1, rows: 1 },
      { cols: 4, rows: 2 },
      { cols: 3, rows: 2 },
      { cols: 2, rows: 3 },
      { cols: 1, rows: 5 },
      { cols: 12, rows: 12 },
      { cols: 5, rows: 1 },
      { cols: 1, rows: 2 },
    ],
  );
});

test('storyboardCommands: createFromImages orderBy 归一与坐标排序', () => {
  const { host, command } = setup({
    nodes: {
      im1: sourceImage({ x: 0, y: 0 }),
      im2: sourceImage({ x: 300, y: 0 }),
      im3: sourceImage({ x: 0, y: 200 }),
    },
  });
  const cmd = command('storyboard.createFromImages');
  const idsFor = (orderBy, ids) => cmd.validate({ ids, orderBy }, host).args.ids;
  assert.deepEqual(
    [
      idsFor('selection', ['im2', 'im1']),
      idsFor('', ['im2', 'im1']),
      idsFor('left-to-right', ['im2', 'im1']),
      idsFor('horizontal', ['im2', 'im1']),
      idsFor('top-to-bottom', ['im3', 'im1']),
      idsFor('vertical', ['im3', 'im1']),
      idsFor('visual', ['im2', 'im3', 'im1']),
      idsFor('grid', ['im2', 'im3', 'im1']),
      idsFor('reading', ['im2', 'im1']),
    ],
    [
      ['im2', 'im1'],
      ['im2', 'im1'],
      ['im1', 'im2'],
      ['im1', 'im2'],
      ['im1', 'im3'],
      ['im1', 'im3'],
      ['im1', 'im2', 'im3'],
      ['im1', 'im2', 'im3'],
      ['im1', 'im2'],
    ],
  );
});

test('storyboardCommands: createFromImages validate 的错误分支返回 ok:false', () => {
  const { host, command } = setup({
    nodes: { im1: sourceImage(), tx: { type: 'source-text' } },
    selectedNodeIds: [],
  });
  const cmd = command('storyboard.createFromImages');
  assert.deepEqual(
    [
      [cmd.validate({ ids: ['nope'] }, host).ok, cmd.validate({ ids: ['nope'] }, host).errorCode],
      [cmd.validate({ ids: ['tx'] }, host).ok, cmd.validate({ ids: ['tx'] }, host).errorCode],
      [cmd.validate({}, host).ok, cmd.validate({}, host).errorCode],
    ],
    [
      [false, 'NODE_NOT_FOUND'],
      [false, 'UNSUPPORTED_NODE_TYPE'],
      [false, 'MISSING_IMAGE_NODES'],
    ],
  );
  assert.equal(cmd.validate({ ids: ['im1'] }, host).ok, undefined);
});

test('storyboardCommands: createFromImages 超过 100 个图片节点被拒，恰好 100 个通过', () => {
  const over = makeNodes(101);
  const { host: overHost, command: overCommand } = setup({ nodes: over.nodes });
  const tooMany = overCommand('storyboard.createFromImages').validate({ ids: over.ids }, overHost);
  const exact = makeNodes(100);
  const { host: exactHost, command: exactCommand } = setup({ nodes: exact.nodes });
  const accepted = exactCommand('storyboard.createFromImages').validate({ ids: exact.ids }, exactHost);
  assert.deepEqual(
    [
      tooMany.ok,
      tooMany.errorCode,
      tooMany.details,
      accepted.ok,
      { cols: accepted.args.cols, rows: accepted.args.rows },
    ],
    [false, 'TOO_MANY_STORYBOARD_CELLS', { count: 101, max: 100 }, undefined, { cols: 10, rows: 10 }],
  );
});

test('storyboardCommands: createFromImages execute 建节点、选中并提交', () => {
  const { host, calls, command } = setup({
    nodes: { im1: sourceImage(), im2: sourceImage({ x: 600, y: 0, imageUrl: 'http://cdn/b.png' }) },
  });
  const cmd = command('storyboard.createFromImages');
  const args = cmd.validate({ ids: ['im1', 'im2'], cols: 2, rows: 1, name: '板' }, host).args;
  const result = cmd.execute(args, host);
  assert.ok(result.nodeId.startsWith('storyboard-'));
  assert.deepEqual(
    {
      resultId: result.node.id === result.nodeId,
      sourceNodeIds: result.sourceNodeIds,
      cols: result.cols,
      rows: result.rows,
      cellCount: result.cellCount,
    },
    { resultId: true, sourceNodeIds: ['im1', 'im2'], cols: 2, rows: 1, cellCount: 2 },
  );
  assert.deepEqual(
    {
      type: result.node.type,
      name: result.node.name,
      nodeCols: result.node.cols,
      nodeRows: result.node.rows,
      x: result.node.x,
      y: result.node.y,
      width: result.node.width,
      height: result.node.height,
      aspectRatio: result.node.aspectRatio,
      isEditing: result.node.isEditing,
      hasSourceUrl: Object.hasOwn(result.node, 'storyboardSourceUrl'),
    },
    {
      type: 'storyboard',
      name: '板',
      nodeCols: 2,
      nodeRows: 1,
      x: 1152,
      y: 0,
      width: 600,
      height: 338,
      aspectRatio: '16:9',
      isEditing: false,
      hasSourceUrl: false,
    },
  );
  assert.deepEqual([calls.selected, calls.added, calls.batches, calls.commits], [[[result.nodeId]], [result.node], 1, 1]);
});

test('storyboardCommands: createFromImages 单元格带来源与锁定标记', () => {
  const { host, command } = setup({ nodes: { im1: sourceImage({ imageWidth: 800, imageHeight: 600 }) } });
  const cmd = command('storyboard.createFromImages');
  const args = cmd.validate({ ids: ['im1'] }, host).args;
  const result = cmd.execute(args, host);
  const cell = result.node.cells[0];
  assert.deepEqual(
    {
      cellCount: result.cellCount,
      id: cell.id,
      pieceIdIsId: cell.pieceId === cell.id,
      url: cell.url,
      localPath: cell.localPath,
      storyboardSourceNodeId: cell.storyboardSourceNodeId,
      locked: cell.storyboardLockedCell,
      extracted: cell.storyboardExtractedCell,
      piece: cell.storyboardPiece,
      sourceIndex: cell.storyboardSourceIndex,
      sourceUrl: cell.sourceUrl,
      isEmpty: cell.isEmpty,
      aspectRatio: result.node.aspectRatio,
      width: result.node.width,
      height: result.node.height,
    },
    {
      cellCount: 1,
      id: result.nodeId + '-cell-1',
      pieceIdIsId: true,
      url: 'http://cdn/a.png',
      localPath: null,
      storyboardSourceNodeId: 'im1',
      locked: true,
      extracted: true,
      piece: true,
      sourceIndex: 0,
      sourceUrl: '',
      isEmpty: false,
      aspectRatio: '4:3',
      width: 400,
      height: 300,
    },
  );
});

test('storyboardCommands: createFromImages 空位补空单元格，缺素材抛 IMAGE_ASSET_NOT_FOUND', () => {
  const { host, command } = setup({ nodes: { im1: sourceImage() } });
  const cmd = command('storyboard.createFromImages');
  const args = cmd.validate({ ids: ['im1'], cols: 2, rows: 1 }, host).args;
  const result = cmd.execute(args, host);
  assert.deepEqual(
    [result.cellCount, result.node.cells[1]],
    [2, { id: result.nodeId + '-cell-2', url: '', isEmpty: true }],
  );
  const blank = setup({ nodes: { na: { type: 'source-image', x: 0, y: 0 } } });
  assert.throws(
    () => {
      const blankArgs = blank.command('storyboard.createFromImages').validate({ ids: ['na'] }, blank.host).args;
      return blank.command('storyboard.createFromImages').execute(blankArgs, blank.host);
    },
    (error) => error.errorCode === 'IMAGE_ASSET_NOT_FOUND' && error.details.nodeId === 'na',
  );
});

test('storyboardCommands: createGridFromNode validate 拒绝缺节点/缺素材并归一参数', () => {
  const { host, command } = setup({
    nodes: { im1: sourceImage(), tx: { type: 'source-text' } },
  });
  const cmd = command('storyboard.createGridFromNode');
  const validated = cmd.validate({ sourceId: ' im1 ', cols: 3, rows: 2 }, host).args;
  const clamped = cmd.validate({ sourceId: 'im1', cols: 0, rows: 99, baseShortSide: 0 }, host).args;
  const fallback = cmd.validate({ sourceId: 'im1', cols: 'abc', rows: -3, baseShortSide: 'x' }, host).args;
  assert.deepEqual(
    [
      {
        sourceId: validated.sourceId,
        cols: validated.cols,
        rows: validated.rows,
        baseShortSide: validated.baseShortSide,
        name: validated.name,
      },
      { cols: clamped.cols, rows: clamped.rows, baseShortSide: clamped.baseShortSide },
      { cols: fallback.cols, rows: fallback.rows, baseShortSide: fallback.baseShortSide },
    ],
    [
      { sourceId: 'im1', cols: 3, rows: 2, baseShortSide: 400, name: 'Storyboard' },
      { cols: 1, rows: 12, baseShortSide: 400 },
      { cols: 2, rows: 1, baseShortSide: 400 },
    ],
  );
  const empty = cmd.validate({ sourceId: '  ' }, host);
  const noAsset = cmd.validate({ sourceId: 'tx' }, host);
  assert.deepEqual(
    [
      [empty.ok, empty.errorCode, empty.message],
      [noAsset.ok, noAsset.errorCode],
    ],
    [
      [false, 'NODE_NOT_FOUND', 'Canvas node not found: (empty)'],
      [false, 'IMAGE_ASSET_NOT_FOUND'],
    ],
  );
});

test('storyboardCommands: createGridFromNode execute 铺满重复素材单元格并追加在源节点右侧', () => {
  const { host, calls, command } = setup({ nodes: { im1: sourceImage() } });
  const cmd = command('storyboard.createGridFromNode');
  const args = cmd.validate({ sourceId: 'im1', cols: 2, rows: 2, name: '九宫格' }, host).args;
  const result = cmd.execute(args, host);
  assert.ok(result.nodeId.startsWith('storyboard-'));
  assert.deepEqual(
    {
      sourceId: result.sourceId,
      cols: result.cols,
      rows: result.rows,
      cellCount: result.cellCount,
      x: result.node.x,
      y: result.node.y,
      width: result.node.width,
      height: result.node.height,
      aspectRatio: result.node.aspectRatio,
    },
    {
      sourceId: 'im1',
      cols: 2,
      rows: 2,
      cellCount: 4,
      x: 632,
      y: 0,
      width: 711,
      height: 400,
      aspectRatio: '16:9',
    },
  );
  assert.deepEqual(result.node.cells[0], {
    url: 'http://cdn/a.png',
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: '',
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: true,
    storyboardLockedCell: true,
    storyboardExtractedCell: false,
    storyboardSourceIndex: 0,
    isEmpty: false,
  });
  assert.deepEqual([result.node.cells[1], result.node.cells[2], result.node.cells[3]], [
    { url: '', isEmpty: true },
    { url: '', isEmpty: true },
    { url: '', isEmpty: true },
  ]);
  assert.deepEqual([calls.selected, calls.added, calls.commits, calls.batches], [[[result.nodeId]], [result.node], 1, 0]);
});
