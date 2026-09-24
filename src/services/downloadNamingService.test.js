import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY,
  getDownloadUseOriginalFilename,
  setDownloadUseOriginalFilename,
} from './downloadNamingService.js';

function withLocalStorage(store, run) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'localStorage'),
    previous = globalThis.localStorage;
  if (store === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = store;
  try {
    return run();
  } finally {
    if (had) globalThis.localStorage = previous;
    else delete globalThis.localStorage;
  }
}

function createStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

test('downloadNamingService: 存储键常量固定', () => {
  assert.equal(DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY, 'v2-download-use-original-filename');
});

test('downloadNamingService: 无 localStorage 时读取为 false', () => {
  withLocalStorage(undefined, () => {
    assert.equal(getDownloadUseOriginalFilename(), false);
  });
});

test('downloadNamingService: 仅字符串 "1" 视为 true', () => {
  withLocalStorage(createStore({ [DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY]: '1' }), () => {
    assert.equal(getDownloadUseOriginalFilename(), true);
  });
  withLocalStorage(createStore({ [DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY]: '0' }), () => {
    assert.equal(getDownloadUseOriginalFilename(), false);
  });
  withLocalStorage(createStore({ [DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY]: 'true' }), () => {
    assert.equal(getDownloadUseOriginalFilename(), false);
  });
  withLocalStorage(createStore(), () => {
    assert.equal(getDownloadUseOriginalFilename(), false);
  });
});

test('downloadNamingService: 读取抛错时安全降级为 false', () => {
  withLocalStorage(
    {
      getItem() {
        throw new Error('denied');
      },
    },
    () => {
      assert.equal(getDownloadUseOriginalFilename(), false);
    },
  );
});

test('downloadNamingService: 写入归一为 "1"/"0" 并回读实际值', () => {
  const store = createStore();
  withLocalStorage(store, () => {
    (assert.equal(setDownloadUseOriginalFilename(true), true),
      assert.equal(store.getItem(DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY), '1'),
      assert.equal(setDownloadUseOriginalFilename(false), false),
      assert.equal(store.getItem(DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY), '0'));
  });
});

test('downloadNamingService: 非严格 true 一律写 "0"', () => {
  const store = createStore();
  withLocalStorage(store, () => {
    (assert.equal(setDownloadUseOriginalFilename(1), false),
      assert.equal(store.getItem(DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY), '0'),
      assert.equal(setDownloadUseOriginalFilename('1'), false));
  });
});

test('downloadNamingService: 写入抛错时不外泄，回读为 false', () => {
  withLocalStorage(
    {
      getItem: () => null,
      setItem() {
        throw new Error('quota');
      },
    },
    () => {
      assert.equal(setDownloadUseOriginalFilename(true), false);
    },
  );
});

test('downloadNamingService: 无 localStorage 时写入不外泄', () => {
  withLocalStorage(undefined, () => {
    assert.equal(setDownloadUseOriginalFilename(true), false);
  });
});
