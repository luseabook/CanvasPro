import test from 'node:test';
import assert from 'node:assert/strict';

import { readTutorialCache, writeTutorialCache } from './tutorialContentCache.js';

const KEY = 'aicanvas.tutorial-content.v1';

const CATALOG = {
  schemaVersion: 1,
  revision: 5,
  guide: { enabled: false, title: '指南', url: '' },
  categories: [
    { id: 'guide', title: 'A', layout: 'list', sort: 0 },
    { id: 'basic', title: 'B', layout: 'list', sort: 1 },
    { id: 'play', title: 'C', layout: 'grid', sort: 2 },
    { id: 'updates', title: 'D', layout: 'list', sort: 3 },
  ],
  tutorials: [],
  updates: [],
  guides: [],
};

function createStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

test('tutorialContentCache: 写入成功返回 true，并落在固定 storage key 上', () => {
  const storage = createStorage();
  assert.equal(writeTutorialCache(storage, CATALOG), true);
  assert.deepEqual([...storage.map.keys()], [KEY]);
  const stored = JSON.parse(storage.map.get(KEY));
  assert.equal(stored.schemaVersion, 1);
  assert.equal(stored.revision, 5);
});

test('tutorialContentCache: 写入的是规范化结果，读回来与之一致', () => {
  const storage = createStorage();
  writeTutorialCache(storage, CATALOG);
  const read = readTutorialCache(storage);
  assert.deepEqual(read, JSON.parse(storage.map.get(KEY)));
  assert.equal(read.revision, 5);
  assert.equal(read.categories.length, 4);
});

test('tutorialContentCache: 没有缓存时读回 null', () => {
  assert.equal(readTutorialCache(createStorage()), null);
});

test('tutorialContentCache: JSON 坏了读回 null，不抛错', () => {
  assert.equal(readTutorialCache(createStorage({ [KEY]: '{不是 JSON' })), null);
});

test('tutorialContentCache: 内容不合规时读回 null，写入返回 false 且不落盘', () => {
  const storage = createStorage({ [KEY]: JSON.stringify({ schemaVersion: 9 }) });
  assert.equal(readTutorialCache(storage), null);

  const blank = createStorage();
  assert.equal(writeTutorialCache(blank, {}), false);
  assert.equal(blank.map.size, 0);
});

test('tutorialContentCache: 存储本身抛错时两个方向都安全返回', () => {
  const broken = {
    getItem() {
      throw new Error('配额');
    },
    setItem() {
      throw new Error('配额');
    },
  };
  assert.equal(readTutorialCache(broken), null);
  assert.equal(writeTutorialCache(broken, CATALOG), false);
});
