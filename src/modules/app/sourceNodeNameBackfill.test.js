import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceNodeNameBackfill } from './sourceNodeNameBackfill.js';

function node(over = {}) {
  return {
    id: 'id' in over ? over.id : 'n1',
    type: 'type' in over ? over.type : 'source-image',
    name: 'name' in over ? over.name : 'image',
    fileName: 'fileName' in over ? over.fileName : 'D:/shots/hero.png',
  };
}

function applyFixture(over = {}) {
  const calls = [];
  const api = createSourceNodeNameBackfill({
    getBaseName:
      'getBaseName' in over
        ? over.getBaseName
        : (fileName) =>
            String(fileName || '')
              .split('/')
              .pop(),
    ...(over.translate === undefined ? {} : { translate: over.translate }),
  });
  return {
    api,
    calls,
    apply(state) {
      return api.applySourceNamesFromFileNameToCanvas(state);
    },
  };
}

test('a source node still carrying its default name takes the file base name', () => {
  const fixture = applyFixture();
  const target = node({ name: 'image' });
  const state = { nodes: [target] };
  assert.equal(fixture.apply(state), state);
  assert.equal(target.name, 'hero.png');
});

test('a legacy Chinese default name is recognised too', () => {
  const fixture = applyFixture();
  const nodes = [
    node({ id: 'a', type: 'source-image', name: '图片' }),
    node({ id: 'b', type: 'source-video', name: '视频', fileName: 'clip.mp4' }),
    node({ id: 'c', type: 'source-audio', name: '音频', fileName: 'take.wav' }),
    node({ id: 'd', type: 'source-text', name: '文本', fileName: 'note.txt' }),
    node({ id: 'e', type: 'source-thing', name: '节点', fileName: 'blob.bin' }),
  ];
  fixture.apply({ nodes });
  assert.deepEqual(
    nodes.map((entry) => entry.name),
    ['hero.png', 'clip.mp4', 'take.wav', 'note.txt', 'blob.bin'],
  );
});

test('a user-chosen name is never overwritten', () => {
  const fixture = applyFixture();
  const target = node({ name: '主角特写' });
  fixture.apply({ nodes: [target] });
  assert.equal(target.name, '主角特写');
});

test('an empty name counts as a default and gets replaced', () => {
  const fixture = applyFixture();
  const target = node({ name: '' });
  fixture.apply({ nodes: [target] });
  assert.equal(target.name, 'hero.png');
});

test('the kind comes from the type token, not the name token', () => {
  const fixture = applyFixture();
  const kept = node({ type: 'source-image', name: 'video', fileName: 'a.png' });
  const renamed = node({ id: 'n2', type: 'source-video', name: 'video', fileName: 'b.mp4' });
  fixture.apply({ nodes: [kept, renamed] });
  assert.equal(kept.name, 'video');
  assert.equal(renamed.name, 'b.mp4');
});

test('non-source nodes are skipped entirely', () => {
  const fixture = applyFixture();
  const nodes = [
    node({ id: 'a', type: 'text', name: 'image' }),
    node({ id: 'b', type: undefined, name: 'image' }),
  ];
  fixture.apply({ nodes });
  assert.deepEqual(
    nodes.map((entry) => entry.name),
    ['image', 'image'],
  );
});

test('a source node without a usable base name is left alone', () => {
  const fixture = applyFixture({ getBaseName: () => '' });
  const nodes = [
    node({ id: 'a', name: 'image', fileName: 'hero.png' }),
    node({ id: 'b', name: 'image', fileName: undefined }),
  ];
  fixture.apply({ nodes });
  assert.deepEqual(
    nodes.map((entry) => entry.name),
    ['image', 'image'],
  );
});

test('a custom translate drives the default-name lookup', () => {
  const calls = [];
  const fixture = applyFixture({
    translate: (key) => {
      calls.push(key);
      return key === 'sourceDefaults.video' ? '影片' : 'x';
    },
  });
  const nodes = [
    node({ id: 'a', type: 'source-image', name: 'x', fileName: 'a.png' }),
    node({ id: 'b', type: 'source-video', name: '影片', fileName: 'b.mp4' }),
  ];
  fixture.apply({ nodes });
  assert.deepEqual(calls, ['sourceDefaults.image', 'sourceDefaults.video']);
  assert.deepEqual(
    nodes.map((entry) => entry.name),
    ['a.png', 'b.mp4'],
  );
});

test('the default translate falls back to the last dotted segment', () => {
  const fixture = applyFixture();
  const nodes = [
    node({ id: 'a', type: 'source-video', name: 'video', fileName: 'clip.mp4' }),
    node({ id: 'b', type: 'source-audio', name: 'audio', fileName: 'take.wav' }),
    node({ id: 'c', type: 'source-text', name: 'text', fileName: 'note.txt' }),
  ];
  fixture.apply({ nodes });
  assert.deepEqual(
    nodes.map((entry) => entry.name),
    ['clip.mp4', 'take.wav', 'note.txt'],
  );
});

test('a record-shaped node collection is patched through its values', () => {
  const fixture = applyFixture();
  const target = node({ id: 'a', name: 'image' });
  const state = { nodes: { a: target, b: node({ id: 'b', name: 'custom' }) } };
  assert.equal(fixture.apply(state), state);
  assert.equal(target.name, 'hero.png');
  assert.equal(state.nodes.b.name, 'custom');
});

test('state without a node collection is returned untouched', () => {
  const fixture = applyFixture();
  for (const state of [null, undefined, {}, { nodes: null }]) {
    assert.equal(fixture.apply(state), state);
  }
  const weird = { nodes: 'nope' };
  assert.equal(fixture.apply(weird), weird);
});

function patchFixture(over = {}) {
  const renames = [];
  const reads = [];
  const graphStore = {
    getState: () => {
      reads.push('getState');
      return 'state' in over ? over.state : undefined;
    },
    getStateRaw: () => {
      reads.push('getStateRaw');
      return 'rawState' in over ? over.rawState : {};
    },
    renameNode:
      'renameNode' in over
        ? over.renameNode
        : (id, name) => {
            renames.push([id, name]);
          },
  };
  const api = createSourceNodeNameBackfill({
    graphStore,
    getBaseName: 'getBaseName' in over ? over.getBaseName : () => 'hero.png',
  });
  return { api, renames, reads, graphStore };
}

test('patching renames only the default-named source nodes', () => {
  const { api, renames } = patchFixture({
    state: {
      nodes: {
        a: node({ id: 'a', type: 'source-image', name: 'image' }),
        b: node({ id: 'b', type: 'text', name: 'image' }),
        c: node({ id: 'c', type: 'source-image', name: '主角' }),
        d: node({ id: 'd', type: 'source-video', name: '视频' }),
      },
    },
  });
  api.patchStoreSourceNodeNamesFromFileName();
  assert.deepEqual(renames, [
    ['a', 'hero.png'],
    ['d', 'hero.png'],
  ]);
});

test('patching falls back to getStateRaw when getState returns nothing', () => {
  const { api, reads, renames } = patchFixture({
    rawState: { nodes: { a: node({ id: 'a', name: 'image' }) } },
  });
  api.patchStoreSourceNodeNamesFromFileName();
  assert.deepEqual(reads, ['getState', 'getStateRaw']);
  assert.deepEqual(renames, [['a', 'hero.png']]);
});

test('patching tolerates a missing renameNode', () => {
  const { api } = patchFixture({
    state: { nodes: { a: node({ id: 'a', name: 'image' }) } },
    renameNode: undefined,
  });
  assert.equal(api.patchStoreSourceNodeNamesFromFileName(), undefined);
});

test('patching without a base-name resolver performs no rename', () => {
  const { api, renames } = patchFixture({
    state: { nodes: { a: node({ id: 'a', name: 'image' }) } },
    getBaseName: undefined,
  });
  api.patchStoreSourceNodeNamesFromFileName();
  assert.deepEqual(renames, []);
});

test('patching a store without state is safe', () => {
  const { api, renames } = patchFixture({ rawState: {} });
  assert.equal(api.patchStoreSourceNodeNamesFromFileName(), undefined);
  assert.deepEqual(renames, []);
  const bare = createSourceNodeNameBackfill();
  assert.equal(bare.patchStoreSourceNodeNamesFromFileName(), undefined);
});
