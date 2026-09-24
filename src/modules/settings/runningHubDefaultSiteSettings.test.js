import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunningHubDefaultSiteSettings } from './runningHubDefaultSiteSettings.js';

const DOM = 'runninghub';
const INTL = 'runninghub-international';

function makeButton(site) {
  const classes = new Set();
  const listeners = [];
  const attrs = {};
  return {
    dataset: site === undefined ? {} : { runninghubDefaultSite: site },
    classes,
    attrs,
    listeners,
    classList: {
      toggle(name, on) {
        if (on) classes.add(name);
        else classes.delete(name);
      },
    },
    setAttribute(name, value) {
      attrs[name] = value;
    },
    addEventListener(type, handler) {
      if (type === 'click') listeners.push(handler);
    },
    removeEventListener(type, handler) {
      if (type !== 'click') return;
      const i = listeners.indexOf(handler);
      if (i >= 0) listeners.splice(i, 1);
    },
    click() {
      [...listeners].forEach((h) => h());
    },
  };
}

function makeRoot(buttons) {
  return {
    querySelectorAll: (sel) => (sel === '[data-runninghub-default-site]' ? buttons : []),
  };
}

test('工厂：无 root、querySelectorAll 缺失或选择器无命中时得到零按钮，调用面全部可用', () => {
  for (const root of [undefined, null, {}, { querySelectorAll: undefined }]) {
    const s = createRunningHubDefaultSiteSettings({ root });
    assert.equal(s.getSelectedProfileId(), DOM);
    assert.equal(s.loadConfig({}), DOM);
    assert.equal(typeof s.bind, 'function');
    assert.deepEqual(s.bind(), undefined);
    s.destroy();
  }
});

test('初始态：未点击即选中站点恒为国内，setSelectedProfileId 归一后回读', () => {
  const s = createRunningHubDefaultSiteSettings({ root: makeRoot([]) });
  assert.equal(s.getSelectedProfileId(), DOM);
  assert.equal(s.setSelectedProfileId(`  ${INTL.toUpperCase()}  `), INTL);
  assert.equal(s.getSelectedProfileId(), INTL);
  assert.equal(s.setSelectedProfileId('bogus'), DOM);
});

test('loadConfig：未点击时取 workflow 默认站点并覆盖当前选中，假值折叠为国内', () => {
  const s = createRunningHubDefaultSiteSettings({ root: makeRoot([]) });
  s.setSelectedProfileId(INTL);
  assert.equal(s.loadConfig({}), DOM);
  assert.equal(s.getSelectedProfileId(), DOM);
  assert.equal(s.loadConfig({ runningHubWorkflow: { defaultProviderProfileId: INTL } }), INTL);
  assert.equal(s.loadConfig({ runningHubWorkflow: { defaultProviderProfileId: 'bogus' } }), DOM);
  assert.equal(s.loadConfig(), DOM);
});

test('loadConfig：一旦点过按钮就变脏，此后忽略入参保留用户选择', () => {
  const b = makeButton(INTL);
  const s = createRunningHubDefaultSiteSettings({ root: makeRoot([b]) });
  s.bind();
  b.click();
  assert.equal(s.getSelectedProfileId(), INTL);
  assert.equal(s.loadConfig({ runningHubWorkflow: { defaultProviderProfileId: DOM } }), INTL);
});

test('applyToConfig：把当前选中写入 workflow 默认字段并保留同级其它键与顶层键', () => {
  const s = createRunningHubDefaultSiteSettings({ root: makeRoot([]) });
  s.setSelectedProfileId(INTL);
  const state = { keep: 1, runningHubWorkflow: { other: 2 } };
  const next = s.applyToConfig(state);
  assert.deepEqual(next, {
    keep: 1,
    runningHubWorkflow: { other: 2, defaultProviderProfileId: INTL },
  });
  assert.deepEqual(state.runningHubWorkflow, { other: 2 });
  assert.deepEqual(s.applyToConfig(), { runningHubWorkflow: { defaultProviderProfileId: INTL } });
});

test('bind：按当前选中同步 is-active 与 aria-pressed，未知 dataset 折叠国内', () => {
  const a = makeButton(DOM);
  const b = makeButton(INTL);
  const c = makeButton('nope');
  const s = createRunningHubDefaultSiteSettings({ root: makeRoot([a, b, c]) });
  s.bind();
  assert.equal(a.classes.has('is-active'), true);
  assert.equal(a.attrs['aria-pressed'], 'true');
  assert.equal(b.classes.has('is-active'), false);
  assert.equal(b.attrs['aria-pressed'], 'false');
  assert.equal(s.getSelectedProfileId(), DOM);
  s.setSelectedProfileId(INTL);
  assert.equal(b.classes.has('is-active'), true);
  assert.equal(a.classes.has('is-active'), false);
});

test('bind：dataset 完全缺失的按钮也算一次点击，回调收到归一后的国内', () => {
  const b = makeButton(undefined);
  const seen = [];
  const s = createRunningHubDefaultSiteSettings({
    root: makeRoot([b]),
    onSelectionChange: (id) => seen.push(id),
  });
  s.bind();
  b.click();
  assert.deepEqual(seen, [DOM]);
  assert.equal(s.getSelectedProfileId(), DOM);
});

test('bind：点击只回调一次且带归一值，重复 bind 不重复挂监听', () => {
  const b = makeButton(INTL);
  const seen = [];
  const s = createRunningHubDefaultSiteSettings({
    root: makeRoot([b]),
    onSelectionChange: (id) => seen.push(id),
  });
  s.bind();
  s.bind();
  assert.equal(b.listeners.length, 1);
  b.click();
  b.click();
  assert.deepEqual(seen, [INTL, INTL]);
});

test('bind：无回调时点击仍切换选中，不抛异常', () => {
  const b = makeButton(INTL);
  const s = createRunningHubDefaultSiteSettings({ root: makeRoot([b]) });
  s.bind();
  assert.equal(b.click(), undefined);
  assert.equal(s.getSelectedProfileId(), INTL);
});

test('destroy：摘除监听后点击不再影响选中，可再次 bind 重新挂上', () => {
  const b = makeButton(INTL);
  const seen = [];
  const s = createRunningHubDefaultSiteSettings({
    root: makeRoot([b]),
    onSelectionChange: (id) => seen.push(id),
  });
  s.bind();
  s.destroy();
  assert.equal(b.listeners.length, 0);
  b.click();
  assert.deepEqual(seen, []);
  assert.equal(s.getSelectedProfileId(), DOM);
  s.bind();
  assert.equal(b.listeners.length, 1);
  b.click();
  assert.deepEqual(seen, [INTL]);
});

test('按钮列表是工厂创建时的快照：后加入 DOM 的按钮不会被 bind 同步', () => {
  const a = makeButton(DOM);
  const root = makeRoot([a]);
  const s = createRunningHubDefaultSiteSettings({ root });
  const late = makeButton(INTL);
  root.querySelectorAll = (sel) => (sel === '[data-runninghub-default-site]' ? [a, late] : []);
  s.bind();
  assert.equal(late.listeners.length, 0);
  assert.equal(a.classes.has('is-active'), true);
});

test('选择器只认 data-runninghub-default-site，其它选择器的命中被忽略', () => {
  const other = makeButton(INTL);
  const root = { querySelectorAll: (sel) => (sel === '[data-runninghub-default-site]' ? [] : [other]) };
  const s = createRunningHubDefaultSiteSettings({ root });
  s.bind();
  assert.equal(other.listeners.length, 0);
  assert.equal(s.getSelectedProfileId(), DOM);
});
