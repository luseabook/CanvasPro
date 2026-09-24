import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION,
  normalizePersonReplacementProjectLibrary,
  upsertPersonReplacementProject,
  removePersonReplacementProject,
} from './personReplacementProjectLibrary.js';

const A = { id: 'a', updatedAt: '2020-01-01T00:00:00.000Z', name: 'A' };
const B = { id: 'b', updatedAt: '2021-01-01T00:00:00.000Z', name: 'B' };

test('projectLibrary: schema 版本为 2', () => {
  assert.equal(PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION, 2);
});

test('projectLibrary: 归一化按 updatedAt 降序排列，currentProjectId 缺失时回落到首个', () => {
  const lib = normalizePersonReplacementProjectLibrary({ projects: [A, B] });
  assert.equal(lib.schemaVersion, 2);
  assert.deepEqual(
    lib.projects.map((p) => p.id),
    ['b', 'a'],
  );
  assert.equal(lib.currentProjectId, 'b');
});

test('projectLibrary: currentProjectId 取自三处候选，且须确实存在于列表中', () => {
  assert.equal(
    normalizePersonReplacementProjectLibrary({ projects: [A, B], currentProjectId: 'a' }).currentProjectId,
    'a',
  );
  assert.equal(normalizePersonReplacementProjectLibrary({ project: B }).currentProjectId, 'b');
  assert.equal(normalizePersonReplacementProjectLibrary({ currentProject: A }).currentProjectId, 'a');
  assert.equal(
    normalizePersonReplacementProjectLibrary({ projects: [A, B], currentProjectId: 'nope' }).currentProjectId,
    'b',
  );
  assert.equal(normalizePersonReplacementProjectLibrary({}).currentProjectId, '');
});

test('projectLibrary: 同 id 去重保留 updatedAt 更晚者，时间并列时后者胜', () => {
  const later = normalizePersonReplacementProjectLibrary({
    projects: [
      { id: 'd', updatedAt: '2020-01-01T00:00:00.000Z', tag: 'first' },
      { id: 'd', updatedAt: '2022-01-01T00:00:00.000Z', tag: 'second' },
    ],
  });
  assert.equal(later.projects.length, 1);
  assert.equal(later.projects[0].tag, 'second');

  const tied = normalizePersonReplacementProjectLibrary({
    projects: [
      { id: 'd', updatedAt: '2020-01-01T00:00:00.000Z', tag: 'first' },
      { id: 'd', updatedAt: '2020-01-01T00:00:00.000Z', tag: 'second' },
    ],
  });
  assert.equal(tied.projects[0].tag, 'second');
});

test('projectLibrary: 条目剥离运行时字段，无 id / 非对象 / 数组一律丢弃', () => {
  const lib = normalizePersonReplacementProjectLibrary({
    projects: [
      {
        id: 'r',
        updatedAt: '2020-01-01T00:00:00.000Z',
        libraryProjects: [1],
        libraryAssets: [2],
        sourcePreviewRefs: [3],
        keep: true,
      },
      { name: 'no-id' },
      null,
      [1, 2],
      'text',
    ],
  });
  assert.equal(lib.projects.length, 1);
  assert.deepEqual(Object.keys(lib.projects[0]).sort(), ['id', 'keep', 'updatedAt']);
  assert.equal(lib.projects[0].keep, true);
});

test('projectLibrary: 非对象与非法时间下退化，不抛异常', () => {
  const empty = normalizePersonReplacementProjectLibrary(null);
  assert.deepEqual(empty, { schemaVersion: 2, currentProjectId: '', projects: [] });
  assert.deepEqual(normalizePersonReplacementProjectLibrary(undefined), empty);

  const bad = normalizePersonReplacementProjectLibrary({
    projects: [{ id: 'x', updatedAt: 'not-a-date' }],
  });
  assert.equal(bad.projects.length, 1);
  assert.equal(bad.currentProjectId, 'x');
});

test('projectLibrary: 输入形态兼容 projects / project / currentProject / data / 裸条目', () => {
  const pick = (input) => normalizePersonReplacementProjectLibrary(input).projects.map((p) => p.id);
  assert.deepEqual(pick({ projects: [A] }), ['a']);
  assert.deepEqual(pick({ project: A }), ['a']);
  assert.deepEqual(pick({ currentProject: A }), ['a']);
  assert.deepEqual(pick({ data: A }), ['a']);
  assert.deepEqual(pick({ id: 'a', updatedAt: A.updatedAt }), ['a']);
  assert.deepEqual(pick({}), []);
});

test('projectLibrary: upsert 置为当前项目并重新按时间降序，坏条目原样返回', () => {
  const lib = normalizePersonReplacementProjectLibrary({ projects: [A, B] });
  const withC = upsertPersonReplacementProject(lib, {
    id: 'c',
    updatedAt: '2022-01-01T00:00:00.000Z',
  });
  assert.equal(withC.currentProjectId, 'c');
  assert.deepEqual(
    withC.projects.map((p) => p.id),
    ['c', 'b', 'a'],
  );

  const touched = upsertPersonReplacementProject(lib, {
    id: 'a',
    updatedAt: '2023-01-01T00:00:00.000Z',
  });
  assert.deepEqual(
    touched.projects.map((p) => p.id),
    ['a', 'b'],
  );
  assert.equal(touched.currentProjectId, 'a');

  assert.deepEqual(upsertPersonReplacementProject(lib, { name: 'bad' }), lib);
});

test('projectLibrary: remove 删除指定项目，当前项目被删时回落到剩余首个', () => {
  const lib = normalizePersonReplacementProjectLibrary({ projects: [A, B], currentProjectId: 'a' });
  const removedCurrent = removePersonReplacementProject(lib, ' a ');
  assert.equal(removedCurrent.currentProjectId, 'b');
  assert.deepEqual(
    removedCurrent.projects.map((p) => p.id),
    ['b'],
  );

  const removedOther = removePersonReplacementProject(lib, 'b');
  assert.equal(removedOther.currentProjectId, 'a');
  assert.deepEqual(
    removedOther.projects.map((p) => p.id),
    ['a'],
  );

  const only = removePersonReplacementProject(
    normalizePersonReplacementProjectLibrary({ projects: [A], currentProjectId: 'a' }),
    'a',
  );
  assert.equal(only.currentProjectId, '');
  assert.deepEqual(only.projects, []);
});
