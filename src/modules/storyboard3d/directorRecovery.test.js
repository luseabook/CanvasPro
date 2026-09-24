import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordDirectorDeletions,
  normalizeDirectorRecycleBin,
  restoreDirectorRecycleEntry,
  directorDeletionImpact,
} from './directorRecovery.js';

test('recordDirectorDeletions 在 id 不一致或场景非数组时原样返回', () => {
  const after = { id: 'p1', scenes: [] };
  assert.equal(recordDirectorDeletions({ id: 'p2', scenes: [] }, after), after);
  assert.equal(recordDirectorDeletions({ id: 'p1' }, after), after);
  assert.equal(after.recycleBin, undefined);
});

test('recordDirectorDeletions 记录被删对象与镜头并追加回收记录', () => {
  const before = {
    id: 'p1',
    scenes: [{ id: 's1', objects: [{ id: 'o1' }, { id: 'o2' }], shots: [{ id: 'sh1' }, { id: 'sh2' }] }],
  };
  const after = {
    id: 'p1',
    scenes: [{ id: 's1', objects: [{ id: 'o1' }], shots: [{ id: 'sh1' }] }],
  };
  assert.equal(recordDirectorDeletions(before, after), after);
  assert.equal(after.recycleBin.length, 1);
  const entry = after.recycleBin[0];
  assert.ok(entry.id.startsWith('recycle-'));
  assert.equal(entry.label, '删除内容');
  assert.equal(typeof entry.deletedAt, 'number');
  assert.equal(entry.removed.length, 1);
  assert.equal(entry.removed[0].wholeScene, false);
  assert.deepEqual(entry.removed[0].objectIds, ['o2']);
  assert.deepEqual(entry.removed[0].shotIds, ['sh2']);
  assert.deepEqual(entry.removed[0].scene, before.scenes[0]);
  assert.notEqual(entry.removed[0].scene, before.scenes[0]);
});

test('recordDirectorDeletions 整场消失时标记 wholeScene 并保留最近 20 条', () => {
  const before = { id: 'p', scenes: [{ id: 's', objects: [{ id: 'x' }], shots: [] }] };
  const after = { id: 'p', scenes: [] };
  recordDirectorDeletions(before, after, '删除场景');
  assert.equal(after.recycleBin.length, 1);
  assert.equal(after.recycleBin[0].label, '删除场景');
  assert.equal(after.recycleBin[0].removed[0].wholeScene, true);
  assert.deepEqual(after.recycleBin[0].removed[0].objectIds, ['x']);
  const crowded = {
    id: 'p',
    scenes: [],
    recycleBin: Array.from({ length: 20 }, (_, i) => ({ id: 'r' + i })),
  };
  recordDirectorDeletions(before, crowded);
  assert.equal(crowded.recycleBin.length, 20);
  assert.equal(crowded.recycleBin[0].id, 'r1');
  assert.ok(crowded.recycleBin.at(-1).id.startsWith('recycle-'));
});

test('normalizeDirectorRecycleBin 收敛窗口、标签、时间与条目字段', () => {
  assert.deepEqual(
    normalizeDirectorRecycleBin(undefined, (s) => s),
    [],
  );
  assert.deepEqual(
    normalizeDirectorRecycleBin([{ id: 42 }], (s) => s),
    [],
  );
  const removed = [
    ...Array.from({ length: 99 }, (_, i) => ({
      scene: { id: 's' + i },
      wholeScene: false,
      objectIds: [],
      shotIds: [],
    })),
    { scene: { id: 'keep' }, wholeScene: true, objectIds: ['o1', 2], shotIds: ['k', null] },
    { noScene: true },
  ];
  const raw = Array.from({ length: 21 }, (_, i) => ({ id: 'r' + i, removed: [] }));
  raw[20] = { id: 'r20', label: 'x'.repeat(200), deletedAt: 'abc', removed };
  const bin = normalizeDirectorRecycleBin(raw, (scene, index) => ({ ...scene, index }));
  assert.equal(bin.length, 20);
  assert.equal(bin[0].id, 'r1');
  const last = bin.at(-1);
  assert.equal(last.id, 'r20');
  assert.equal(last.label.length, 120);
  assert.equal(last.deletedAt, 0);
  assert.equal(last.removed.length, 100);
  assert.deepEqual(last.removed.at(-1).scene, { id: 'keep', index: 99 });
  assert.equal(last.removed.at(-1).wholeScene, true);
  assert.deepEqual(last.removed.at(-1).objectIds, ['o1']);
  assert.deepEqual(last.removed.at(-1).shotIds, ['k']);
});

test('restoreDirectorRecycleEntry 缺记录抛错，整场记录直接回填', () => {
  assert.throws(
    () => restoreDirectorRecycleEntry({ id: 'p', scenes: [], recycleBin: [] }, 'nope'),
    /回收记录不存在。/,
  );
  const project = {
    id: 'p',
    scenes: [],
    recycleBin: [
      {
        id: 'r1',
        label: '删除内容',
        deletedAt: 1,
        removed: [
          {
            scene: { id: 's1', objects: [{ id: 'o1' }], shots: [] },
            wholeScene: true,
            objectIds: [],
            shotIds: [],
          },
        ],
      },
    ],
  };
  const next = restoreDirectorRecycleEntry(project, 'r1');
  assert.equal(next.scenes.length, 1);
  assert.deepEqual(next.scenes[0], { id: 's1', objects: [{ id: 'o1' }], shots: [] });
  assert.deepEqual(next.recycleBin, []);
  assert.equal(project.scenes.length, 0);
  assert.equal(project.recycleBin.length, 1);
});

test('restoreDirectorRecycleEntry 合并对象、轨道、运动片段与跟拍约束', () => {
  const project = {
    id: 'p',
    scenes: [
      {
        id: 's1',
        objects: [{ id: 'o1' }, { id: 'o2', parentId: 'gone' }],
        shots: [
          {
            id: 'sh1',
            animation: {
              objectTracks: [],
              actionClips: [],
              motionClips: [],
              objectPaths: {},
              cameraConstraint: {},
              cameraConstraintClips: [],
            },
          },
        ],
      },
    ],
    recycleBin: [
      {
        id: 'r2',
        removed: [
          {
            scene: {
              id: 's1',
              objects: [{ id: 'o1' }, { id: 'o2', parentId: 'gone' }, { id: 'o3' }],
              shots: [
                {
                  id: 'sh1',
                  animation: {
                    objectTracks: [
                      {
                        objectId: 'o3',
                        positionKeyframes: [{ id: 'k1' }, { id: 'k2' }],
                        rotationKeyframes: [{ id: 'k3' }],
                        scaleKeyframes: [{ id: 'k4' }],
                      },
                    ],
                    actionClips: [{ id: 'a1', objectId: 'o3' }],
                    motionClips: [
                      { id: 'm1', keyframeIds: ['k1'] },
                      { id: 'm2', keyframeIds: ['zz'] },
                    ],
                    objectPaths: { o3: { points: [1] } },
                    cameraConstraint: { followObjectId: 'o3', lookAtObjectId: 'o1' },
                    cameraConstraintClips: [
                      { id: 'c1', followObjectId: 'o3' },
                      { id: 'c2', lookAtObjectId: 'o1' },
                    ],
                  },
                },
              ],
            },
            wholeScene: false,
            objectIds: ['o3'],
            shotIds: [],
          },
        ],
      },
    ],
  };
  const next = restoreDirectorRecycleEntry(project, 'r2');
  const scene = next.scenes[0];
  assert.deepEqual(
    scene.objects.map((o) => o.id),
    ['o1', 'o2', 'o3'],
  );
  assert.equal(scene.objects.find((o) => o.id === 'o2').parentId, undefined);
  const animation = scene.shots[0].animation;
  assert.deepEqual(
    animation.objectTracks.map((t) => t.objectId),
    ['o3'],
  );
  assert.deepEqual(
    animation.actionClips.map((c) => c.id),
    ['a1'],
  );
  assert.deepEqual(
    animation.motionClips.map((c) => c.id),
    ['m1'],
  );
  assert.deepEqual(animation.objectPaths.o3, { points: [1] });
  assert.equal(animation.cameraConstraint.followObjectId, 'o3');
  assert.equal(animation.cameraConstraint.lookAtObjectId, undefined);
  assert.deepEqual(
    animation.cameraConstraintClips.map((c) => c.id),
    ['c1'],
  );
  assert.deepEqual(next.recycleBin, []);
});

test('directorDeletionImpact 汇总受影响的镜头、轨道与跟拍约束', () => {
  const project = {
    shots: [
      {
        cameraId: 'o1',
        animation: {
          objectTracks: [{ objectId: 'o1' }, { objectId: 'o9' }],
          cameraConstraint: { followObjectId: 'o1' },
          cameraConstraintClips: [{ followObjectId: 'o2' }, { lookAtObjectId: 'o9' }],
        },
      },
      {
        cameraId: 'cam2',
        animation: {
          objectTracks: [{ objectId: 'o2' }],
          cameraConstraint: {},
          cameraConstraintClips: [{ followObjectId: 'o1' }, { lookAtObjectId: 'o2' }],
        },
      },
    ],
  };
  assert.equal(
    directorDeletionImpact(project, ['o1', 'o2']),
    '已移入回收站：2 个对象，关联 1 个镜头、2 条运动轨道、4 项跟拍约束。可在导演编排中恢复。',
  );
  assert.equal(
    directorDeletionImpact({ shots: [] }, []),
    '已移入回收站：0 个对象，关联 0 个镜头、0 条运动轨道、0 项跟拍约束。可在导演编排中恢复。',
  );
});
