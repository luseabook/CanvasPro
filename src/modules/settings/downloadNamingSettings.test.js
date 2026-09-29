import test from 'node:test';
import assert from 'node:assert/strict';

import { initDownloadNamingSettings } from './downloadNamingSettings.js';

const SELECTOR = '#downloadUseOriginalFilenameGroup [data-download-original-filename]';
const STORAGE_KEY = 'v2-download-use-original-filename';

function makeOption(value, over = {}) {
  const option = {
    dataset: { downloadOriginalFilename: value },
    toggles: [],
    attrs: {},
    bindings: [],
    setAttribute(name, attributeValue) {
      option.attrs[name] = attributeValue;
    },
    addEventListener(type, handler) {
      option.bindings.push([type, handler]);
    },
    classList: {
      toggle(name, on) {
        option.toggles.push([name, on]);
      },
    },
  };
  if ('bound' in over) option.__downloadNamingBound = over.bound;
  return option;
}

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    gets: [],
    sets: [],
    getItem(key) {
      this.gets.push(key);
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      this.sets.push([key, value]);
      map.set(key, value);
    },
  };
}

function withDom(over, run) {
  const previousDocument = globalThis.document;
  const previousStorage = globalThis.localStorage;
  const selectors = [];
  globalThis.document = {
    querySelectorAll(selector) {
      selectors.push(selector);
      return 'elements' in over ? over.elements : [];
    },
  };
  if (over.storage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = over.storage;
  try {
    return run({ selectors });
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
}

test('downloadNamingSettings: 按固定选择器查询并同步初始选中态', () => {
  const on = makeOption('on');
  const off = makeOption('off');
  const storage = makeStorage({ [STORAGE_KEY]: '1' });
  withDom({ elements: [on, off], storage }, ({ selectors }) => {
    initDownloadNamingSettings();
    assert.deepEqual(selectors, [SELECTOR]);
    assert.deepEqual(on.toggles, [['active', true]]);
    assert.deepEqual(off.toggles, [['active', false]]);
    assert.equal(on.attrs['aria-pressed'], 'true');
    assert.equal(off.attrs['aria-pressed'], 'false');
    assert.equal(on.__downloadNamingBound, true);
    assert.equal(off.__downloadNamingBound, true);
    assert.deepEqual(storage.gets, [STORAGE_KEY]);
  });
});

test('downloadNamingSettings: 存储为空时全部按未选中处理', () => {
  const on = makeOption('on');
  withDom({ elements: [on], storage: makeStorage() }, () => {
    initDownloadNamingSettings();
    assert.deepEqual(on.toggles, [['active', false]]);
    assert.equal(on.attrs['aria-pressed'], 'false');
  });
});

test('downloadNamingSettings: 存储值非 1 时按未选中处理', () => {
  const on = makeOption('on');
  withDom({ elements: [on], storage: makeStorage({ [STORAGE_KEY]: '0' }) }, () => {
    initDownloadNamingSettings();
    assert.deepEqual(on.toggles, [['active', false]]);
  });
});

test('downloadNamingSettings: 无 localStorage 时按未选中处理', () => {
  const on = makeOption('on');
  withDom({ elements: [on], storage: undefined }, () => {
    initDownloadNamingSettings();
    assert.deepEqual(on.toggles, [['active', false]]);
    assert.equal(on.attrs['aria-pressed'], 'false');
  });
});

test('downloadNamingSettings: 点击 dataset=on 的选项写入 1 并同步全部选项', () => {
  const on = makeOption('on');
  const off = makeOption('off');
  const storage = makeStorage();
  withDom({ elements: [on, off], storage }, () => {
    initDownloadNamingSettings();
    assert.deepEqual(storage.sets, []);
    assert.deepEqual(on.bindings.map(([type]) => type), ['click']);
    on.bindings[0][1]();
    assert.deepEqual(storage.sets, [[STORAGE_KEY, '1']]);
    assert.deepEqual(on.toggles.at(-1), ['active', true]);
    assert.deepEqual(off.toggles.at(-1), ['active', false]);
    assert.equal(on.attrs['aria-pressed'], 'true');
    assert.equal(off.attrs['aria-pressed'], 'false');
  });
});

test('downloadNamingSettings: 点击 dataset=off 的选项写入 0 并覆盖已有值', () => {
  const on = makeOption('on');
  const off = makeOption('off');
  const storage = makeStorage({ [STORAGE_KEY]: '1' });
  withDom({ elements: [on, off], storage }, () => {
    initDownloadNamingSettings();
    assert.deepEqual(on.toggles.at(-1), ['active', true]);
    off.bindings[0][1]();
    assert.deepEqual(storage.sets, [[STORAGE_KEY, '0']]);
    assert.deepEqual(on.toggles.at(-1), ['active', false]);
    assert.deepEqual(off.toggles.at(-1), ['active', true]);
  });
});

test('downloadNamingSettings: 重复初始化不会重复绑定点击', () => {
  const on = makeOption('on');
  withDom({ elements: [on], storage: makeStorage() }, () => {
    initDownloadNamingSettings();
    initDownloadNamingSettings();
    initDownloadNamingSettings();
    assert.equal(on.bindings.length, 1);
    assert.equal(on.__downloadNamingBound, true);
  });
});

test('downloadNamingSettings: 已绑定的选项跳过绑定但仍同步状态', () => {
  const on = makeOption('on', { bound: true });
  withDom({ elements: [on], storage: makeStorage({ [STORAGE_KEY]: '1' }) }, () => {
    initDownloadNamingSettings();
    assert.equal(on.bindings.length, 0);
    assert.deepEqual(on.toggles, [['active', true]]);
    assert.equal(on.attrs['aria-pressed'], 'true');
  });
});

test('downloadNamingSettings: __downloadNamingBound 为假值时重新绑定', () => {
  const on = makeOption('on', { bound: false });
  withDom({ elements: [on], storage: makeStorage() }, () => {
    initDownloadNamingSettings();
    assert.equal(on.bindings.length, 1);
    assert.equal(on.__downloadNamingBound, true);
  });
});

test('downloadNamingSettings: 无匹配选项时安全返回', () => {
  withDom({ elements: [], storage: makeStorage() }, () => {
    assert.equal(initDownloadNamingSettings(), undefined);
  });
});

test('downloadNamingSettings: localStorage 抛错时降级为未选中且不抛出', () => {
  const on = makeOption('on');
  const storage = makeStorage();
  storage.getItem = () => {
    throw new Error('blocked');
  };
  storage.setItem = () => {
    throw new Error('blocked');
  };
  withDom({ elements: [on], storage }, () => {
    initDownloadNamingSettings();
    assert.deepEqual(on.toggles, [['active', false]]);
    assert.doesNotThrow(() => on.bindings[0][1]());
    assert.deepEqual(on.toggles.at(-1), ['active', false]);
  });
});
