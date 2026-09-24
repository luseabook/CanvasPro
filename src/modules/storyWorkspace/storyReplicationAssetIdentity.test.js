import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileStoryReplicationAssetIdentity } from './storyReplicationAssetIdentity.js';

const character = (id, extra = {}) => ({
  id,
  kind: 'character',
  sourceChapterIds: ['e1'],
  replicationSource: { name: '李四', subjectKeys: [] },
  appearances: [],
  ...extra,
});

test('duplicate replication characters merge into the one with the most media', () => {
  const winner = character('A', {
    planningRef: 'char-a',
    appearances: [{ id: 'a1', imageUrl: 'x' }],
    replicationSource: { name: '李四', subjectKeys: ['k0'] },
  });
  const loser = character('B', {
    planningRef: 'char-b',
    appearances: [{ id: 'b1' }, { id: 'a1', name: 'dup' }],
  });
  const scene = { id: 'S', kind: 'scene' };
  const data = {
    assets: [loser, winner, scene],
    project: { replication: { characterBindings: { other: 'B' } } },
    episodes: [
      {
        clips: [
          {
            assetRef: 'B',
            planningRef: 'char-b',
            prompt: '看 story-asset:B:look 和 story-asset:char-b:x',
            refs: ['B', 'C'],
          },
        ],
      },
    ],
  };
  const result = reconcileStoryReplicationAssetIdentity(data, [
    { key: 'k1', episodeId: 'e1', character: { name: ' 李四 ' } },
  ]);
  assert.deepEqual(
    result.map((asset) => asset.id),
    ['A', 'S'],
  );
  assert.deepEqual(
    winner.appearances.map((appearance) => appearance.id),
    ['a1', 'b1'],
  );
  assert.deepEqual(winner.replicationSource, { name: '李四', subjectKeys: ['k0', 'k1'] });
  assert.deepEqual(data.project.replication.characterBindings, { other: 'A', k1: 'A' });
  assert.deepEqual(data.episodes[0].clips[0], {
    assetRef: 'A',
    planningRef: 'char-a',
    prompt: '看 story-asset:A:look 和 story-asset:char-a:x',
    refs: ['A', 'C'],
  });
});

test('ties in media prefer the currently bound asset', () => {
  const first = character('A');
  const bound = character('B');
  const data = {
    assets: [first, bound],
    project: { replication: { characterBindings: { k1: 'B' } } },
    episodes: [],
  };
  const result = reconcileStoryReplicationAssetIdentity(data, [
    { key: 'k1', episodeId: 'e1', character: { name: '李四' } },
  ]);
  assert.deepEqual(
    result.map((asset) => asset.id),
    ['B'],
  );
});

test('ambiguous subjects, foreign bindings and claimed assets are left alone', () => {
  const subjects = [
    { key: 'k1', episodeId: 'e1', character: { name: '李四' } },
    { key: 'k2', episodeId: 'e1', character: { name: '李四' } },
  ];
  const assets = [character('A'), character('B')];
  const same = { assets, project: { replication: {} }, episodes: [] };
  assert.equal(reconcileStoryReplicationAssetIdentity(same, subjects).length, 2);
  assert.deepEqual(same.project.replication.characterBindings, {});
  const foreign = {
    assets: [character('A'), character('B')],
    project: { replication: { characterBindings: { k1: 'Z' } } },
    episodes: [],
  };
  const other = character('Z', { replicationSource: { name: '王五', subjectKeys: [] } });
  foreign.assets.push(other);
  assert.equal(reconcileStoryReplicationAssetIdentity(foreign, [subjects[0]]).length, 3);
  const claimed = {
    assets: [character('A'), character('B', { replicationSource: { name: '李四', subjectKeys: ['k3'] } })],
    project: { replication: {} },
    episodes: [],
  };
  const result = reconcileStoryReplicationAssetIdentity(claimed, [
    subjects[0],
    { key: 'k3', episodeId: 'e2', character: { name: '李四' } },
  ]);
  assert.deepEqual(
    result.map((asset) => asset.id),
    ['A', 'B'],
  );
  assert.deepEqual(claimed.project.replication.characterBindings, { k1: 'A' });
});
