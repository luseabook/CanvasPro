import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneGraph,
  sharedValue,
  projectGraph,
  mergeSharedNode,
  graphChanges,
  applyGraphChanges,
  invertChanges,
  graphChangesConflict,
} from './collaborationDocument.js';

test('cloneGraph：只保留 nodes、edges 并深拷贝，缺省为空对象', () => {
  const graph = { nodes: { a: { id: 'a', data: [1] } }, edges: { e: { id: 'e' } }, viewport: { x: 1 } };
  const out = cloneGraph(graph);
  assert.deepEqual(out, { nodes: graph.nodes, edges: graph.edges });
  assert.notEqual(out.nodes.a, graph.nodes.a);
  assert.notEqual(out.nodes.a.data, graph.nodes.a.data);
  assert.deepEqual(cloneGraph(), { nodes: {}, edges: {} });
  assert.deepEqual(cloneGraph({ nodes: null }), { nodes: {}, edges: {} });
});

test('sharedValue：去掉私有字段（密钥、运行态、下划线开头等），大小写不敏感', () => {
  const node = {
    id: 'n1',
    title: '标题',
    apiKey: 'k',
    openaiApiKey: 'k2',
    Authorization: 'Bearer x',
    password: 'p',
    _cache: 1,
    selected: true,
    isGenerating: true,
    progress: 0.5,
    generationStartTime: 1,
    generationTaskId: 't',
    rhTaskId: 'r',
    taskId: 'x',
    jobState: 'y',
    error: 'e',
    statusMessage: 's',
    waveformUrl: 'w',
    providerProfileId: 'p1',
    width: 100,
  };
  assert.deepEqual(sharedValue(node), { id: 'n1', title: '标题', width: 100 });
});

test('sharedValue：去掉下划线和连字符后再匹配私有字段', () => {
  assert.deepEqual(sharedValue({ 'api-key': 1, access_token: 2, 'is-selected': 3, keep_me: 4 }), {
    keep_me: 4,
  });
});

test('sharedValue：去掉 __proto__、constructor、prototype 和 undefined 值，递归处理数组', () => {
  const input = JSON.parse('{"__proto__":{"polluted":true},"constructor":1,"prototype":2,"ok":1}');
  input.missing = undefined;
  input.list = [{ apiKey: 'x', v: 1 }, 2];
  const out = sharedValue(input);
  assert.deepEqual(out, { ok: 1, list: [{ v: 1 }, 2] });
  assert.equal(Object.hasOwn(out, '__proto__'), false);
  assert.equal({}.polluted, undefined);
});

test('sharedValue：只对媒体键上的媒体地址调用映射函数', () => {
  const seen = [];
  const map = (value) => (seen.push(value), `mapped:${value}`);
  const out = sharedValue(
    {
      src: 'C:\\out\\a.png',
      imageUrl: 'https://x/y.png',
      thumbLocalPath: '/output/t.webp',
      references: ['data:image/png;base64,AA', 'plain text'],
      videoUrls: ['blob:abc'],
      title: 'https://not-media-key',
      src2: 'output/x.png',
      poster: 'file:///p.png',
      audio: 'api/v2/file',
      prompt: 'uploads/should-not-map',
      image: 'relative/name.png',
    },
    '',
    map,
  );
  assert.deepEqual(out, {
    src: 'mapped:C:\\out\\a.png',
    imageUrl: 'mapped:https://x/y.png',
    thumbLocalPath: 'mapped:/output/t.webp',
    references: ['mapped:data:image/png;base64,AA', 'plain text'],
    videoUrls: ['mapped:blob:abc'],
    title: 'https://not-media-key',
    src2: 'output/x.png',
    poster: 'mapped:file:///p.png',
    audio: 'mapped:api/v2/file',
    prompt: 'uploads/should-not-map',
    image: 'relative/name.png',
  });
  assert.equal(seen.length, 7);
});

test('sharedValue：data: 只认 image/video/audio；顶层字符串没有键名时不映射', () => {
  const map = (v) => `m:${v}`;
  assert.deepEqual(sharedValue({ url: 'data:text/plain,hi', dataUrl: 'data:audio/wav;base64,A' }, '', map), {
    url: 'data:text/plain,hi',
    dataUrl: 'm:data:audio/wav;base64,A',
  });
  assert.equal(sharedValue('https://x', '', map), 'https://x');
  assert.equal(sharedValue('https://x', 'url', map), 'm:https://x');
  // 默认映射为恒等
  assert.equal(sharedValue('https://x', 'url'), 'https://x');
});

test('projectGraph：只投影 nodes、edges，并套用映射', () => {
  const out = projectGraph(
    { nodes: { a: { id: 'a', src: 'https://a.png', selected: true } }, viewport: 1 },
    (v) => v.toUpperCase(),
  );
  assert.deepEqual(out, { nodes: { a: { id: 'a', src: 'HTTPS://A.PNG' } }, edges: {} });
});

test('mergeSharedNode：共享字段取远端，本地私有字段保留（深拷贝）', () => {
  const local = { id: 'n', title: 'old', apiKey: 'secret', _ui: { open: true }, progress: 0.3 };
  const remote = { id: 'n', title: 'new', width: 5, apiKey: 'remote-should-drop' };
  const out = mergeSharedNode(local, remote);
  assert.deepEqual(out, {
    apiKey: 'secret',
    _ui: { open: true },
    progress: 0.3,
    id: 'n',
    title: 'new',
    width: 5,
  });
  assert.notEqual(out._ui, local._ui);
});

test('mergeSharedNode：媒体来源变化时丢弃本地波形字段，未变化时保留', () => {
  const local = { src: 'a.mp3', waveformLocalPath: 'w.png', waveformUrl: 'w' };
  assert.deepEqual(mergeSharedNode(local, { src: 'a.mp3' }), {
    waveformLocalPath: 'w.png',
    waveformUrl: 'w',
    src: 'a.mp3',
  });
  assert.deepEqual(mergeSharedNode(local, { src: 'b.mp3' }), { src: 'b.mp3' });
  assert.deepEqual(mergeSharedNode({ ...local, localPath: 'x' }, { src: 'a.mp3' }), { src: 'a.mp3' });
});

test('mergeSharedNode：数组按 id 对齐本地元素再合并，没有 id 时不继承私有字段', () => {
  const local = [
    { id: 'a', _open: true, v: 1 },
    { id: 'b', _open: false, v: 2 },
    { _open: 'no-id', v: 3 },
  ];
  const remote = [{ id: 'b', v: 20 }, { id: 'a', v: 10 }, { v: 30 }, 'text'];
  assert.deepEqual(mergeSharedNode(local, remote), [
    { _open: false, id: 'b', v: 20 },
    { _open: true, id: 'a', v: 10 },
    { v: 30 },
    'text',
  ]);
});

test('mergeSharedNode：远端为标量时直接返回远端；过滤原型污染键', () => {
  assert.equal(mergeSharedNode({ a: 1 }, 5), 5);
  assert.equal(mergeSharedNode(undefined, null), null);
  const remote = JSON.parse('{"__proto__":{"x":1},"ok":true}');
  const out = mergeSharedNode(undefined, remote);
  assert.deepEqual(out, { ok: true });
  assert.equal({}.x, undefined);
});

test('graphChanges：列出增删改，缺失视为 null，按 nodes 后 edges 的顺序', () => {
  const before = { nodes: { a: { v: 1 }, b: { v: 2 } }, edges: { e1: { s: 'a' } } };
  const after = { nodes: { a: { v: 1 }, b: { v: 3 }, c: { v: 4 } }, edges: {} };
  assert.deepEqual(graphChanges(before, after), [
    { kind: 'nodes', id: 'b', before: { v: 2 }, after: { v: 3 } },
    { kind: 'nodes', id: 'c', before: null, after: { v: 4 } },
    { kind: 'edges', id: 'e1', before: { s: 'a' }, after: null },
  ]);
  assert.deepEqual(graphChanges({}, {}), []);
});

test('applyGraphChanges：应用到拷贝上，after 为 null 时删除；invertChanges 可撤回', () => {
  const base = { nodes: { a: { v: 1 } }, edges: {} };
  const changes = [
    { kind: 'nodes', id: 'a', before: { v: 1 }, after: null },
    { kind: 'edges', id: 'e', before: null, after: { s: 'x' } },
  ];
  const next = applyGraphChanges(base, changes);
  assert.deepEqual(next, { nodes: {}, edges: { e: { s: 'x' } } });
  assert.deepEqual(base, { nodes: { a: { v: 1 } }, edges: {} });
  assert.notEqual(next.edges.e, changes[1].after);
  const inverted = invertChanges(changes);
  assert.deepEqual(inverted, [
    { kind: 'nodes', id: 'a', before: null, after: { v: 1 } },
    { kind: 'edges', id: 'e', before: { s: 'x' }, after: null },
  ]);
  assert.deepEqual(applyGraphChanges(next, inverted), base);
});

test('graphChangesConflict：同一条目被两边修改算冲突', () => {
  const graph = { nodes: {}, edges: {} };
  const mine = [{ kind: 'nodes', id: 'a', after: { v: 1 } }];
  assert.equal(graphChangesConflict(mine, [{ kind: 'nodes', id: 'a', after: { v: 2 } }], graph), true);
  assert.equal(graphChangesConflict(mine, [{ kind: 'edges', id: 'a', after: {} }], graph), false);
  assert.equal(graphChangesConflict(mine, [{ kind: 'nodes', id: 'b', after: {} }], graph), false);
});

test('graphChangesConflict：对方的连线指向我删掉的节点算冲突', () => {
  const graph = { nodes: {}, edges: {} };
  const mine = [{ kind: 'nodes', id: 'gone', after: null }];
  assert.equal(
    graphChangesConflict(
      mine,
      [{ kind: 'edges', id: 'e', after: { sourceId: 'x', targetId: 'gone' } }],
      graph,
    ),
    true,
  );
  assert.equal(
    graphChangesConflict(mine, [{ kind: 'edges', id: 'e', after: { sourceId: 'x', targetId: 'y' } }], graph),
    false,
  );
  // 对方删连线（after 为 null）不冲突
  assert.equal(graphChangesConflict(mine, [{ kind: 'edges', id: 'e', after: null }], graph), false);
});

test('graphChangesConflict：对方节点的父链上有我删掉的节点算冲突，父链成环时停止', () => {
  const graph = {
    nodes: {
      g1: { parentId: 'g2' },
      g2: { parentId: 'gone' },
      loopA: { parentId: 'loopB' },
      loopB: { parentId: 'loopA' },
    },
    edges: {},
  };
  const mine = [{ kind: 'nodes', id: 'gone', after: null }];
  assert.equal(
    graphChangesConflict(mine, [{ kind: 'nodes', id: 'n', after: { parentId: 'g1' } }], graph),
    true,
  );
  assert.equal(
    graphChangesConflict(mine, [{ kind: 'nodes', id: 'n', after: { parentId: 'loopA' } }], graph),
    false,
  );
  assert.equal(graphChangesConflict(mine, [{ kind: 'nodes', id: 'n', after: null }], graph), false);
  // 我只是修改而不是删除父节点时不冲突
  const edit = [{ kind: 'nodes', id: 'gone', after: { v: 1 } }];
  assert.equal(
    graphChangesConflict(edit, [{ kind: 'nodes', id: 'n', after: { parentId: 'g1' } }], graph),
    false,
  );
});
