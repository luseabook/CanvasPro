import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiConfigSavePresentation } from './apiConfigSavePresentation.js';
import { setLocale } from '../../i18n/index.js';

// 冻结文案：这两个 key 在当前词典里都不存在，t() 会原样回退成 key 字符串。
const TEXT_AUTO = 'settings.saveStatus.auto';
const TEXT_SAVING = 'settings.saveStatus.saving';
const TEXT_SAVED = 'settings.saveStatus.saved';
const TEXT_ERROR = 'settings.saveStatus.error';

const CLASS_TESTING = 'settings-provider-status--testing';
const CLASS_SUCCESS = 'settings-provider-status--success';
const CLASS_DANGER = 'settings-provider-status--danger';

function makeButtonElement(over = {}) {
  const button = {
    disabled: 'disabled' in over ? over.disabled : false,
    attrs: {},
    setAttribute(name, value) {
      button.attrs[name] = value;
    },
  };
  return button;
}

function makeStatusElement(over = {}) {
  const status = {
    textContent: 'textContent' in over ? over.textContent : '',
    attrs: {},
    toggles: [],
    setAttribute(name, value) {
      status.attrs[name] = value;
    },
    classList: {
      toggle(name, on) {
        status.toggles.push([name, on]);
      },
    },
  };
  return status;
}

function makeRoot(over = {}) {
  const byId = 'byId' in over ? over.byId : {};
  return {
    getElementById(id) {
      return id in byId ? byId[id] : null;
    },
  };
}

function makeTimerHost() {
  const scheduled = [];
  const cleared = [];
  return {
    scheduled,
    cleared,
    setTimeout(handler, delay) {
      scheduled.push({ fn: handler, ms: delay });
      return scheduled.length;
    },
    clearTimeout(handle) {
      cleared.push(handle);
    },
  };
}

function makeHost(over = {}) {
  const button = 'button' in over ? over.button : makeButtonElement();
  const status = 'status' in over ? over.status : makeStatusElement();
  const timerHost = 'timerHost' in over ? over.timerHost : makeTimerHost();
  const options = { timerHost };
  if ('successDuration' in over) options.successDuration = over.successDuration;
  const presentation = createApiConfigSavePresentation(
    makeRoot({ byId: { btnApiSave: button, apiConfigSaveStatus: status } }),
    options,
  );
  return { button, status, timerHost, presentation };
}

test('apiConfigSavePresentation: 创建时立即渲染 auto 状态', () => {
  const { button, status, presentation } = makeHost();
  try {
    assert.equal(button.disabled, false);
    assert.equal(button.attrs['aria-busy'], 'false');
    assert.equal(status.textContent, TEXT_AUTO);
    assert.deepEqual(status.toggles, [
      [CLASS_TESTING, false],
      [CLASS_SUCCESS, false],
      [CLASS_DANGER, false],
    ]);
  } finally {
    presentation.destroy();
  }
});

test('apiConfigSavePresentation: update(saving) 禁用按钮置 testing 且不排定计时器', () => {
  const { button, status, timerHost, presentation } = makeHost();
  try {
    presentation.update('saving');
    assert.equal(button.disabled, true);
    assert.equal(button.attrs['aria-busy'], 'true');
    assert.equal(status.textContent, TEXT_SAVING);
    assert.equal(timerHost.scheduled.length, 0);
    assert.deepEqual(status.toggles.slice(-3), [
      [CLASS_TESTING, true],
      [CLASS_SUCCESS, false],
      [CLASS_DANGER, false],
    ]);
  } finally {
    presentation.destroy();
  }
});

test('apiConfigSavePresentation: update(saved) 默认 2000ms 后自动回到 auto', () => {
  const { button, status, timerHost, presentation } = makeHost();
  try {
    presentation.update('saved');
    assert.equal(timerHost.scheduled.length, 1);
    assert.equal(timerHost.scheduled[0].ms, 2000);
    assert.equal(status.textContent, TEXT_SAVED);
    assert.deepEqual(status.toggles.slice(-3), [
      [CLASS_TESTING, false],
      [CLASS_SUCCESS, true],
      [CLASS_DANGER, false],
    ]);
    timerHost.scheduled[0].fn();
    assert.equal(status.textContent, TEXT_AUTO);
    assert.equal(button.disabled, false);
    assert.equal(button.attrs['aria-busy'], 'false');
    assert.deepEqual(status.toggles.slice(-3), [
      [CLASS_TESTING, false],
      [CLASS_SUCCESS, false],
      [CLASS_DANGER, false],
    ]);
  } finally {
    presentation.destroy();
  }
});

test('apiConfigSavePresentation: successDuration 可自定义', () => {
  const { timerHost, presentation } = makeHost({ successDuration: 120 });
  try {
    presentation.update('saved');
    assert.equal(timerHost.scheduled.length, 1);
    assert.equal(timerHost.scheduled[0].ms, 120);
  } finally {
    presentation.destroy();
  }
});

test('apiConfigSavePresentation: 已过期的 saved 计时器不再回写状态', () => {
  const { status, timerHost, presentation } = makeHost();
  try {
    presentation.update('saved');
    const stale = timerHost.scheduled[0];
    presentation.update('error');
    assert.deepEqual(timerHost.cleared, [1]);
    assert.equal(status.textContent, TEXT_ERROR);
    assert.deepEqual(status.toggles.slice(-3), [
      [CLASS_TESTING, false],
      [CLASS_SUCCESS, false],
      [CLASS_DANGER, true],
    ]);
    stale.fn();
    assert.equal(status.textContent, TEXT_ERROR);
    assert.equal(timerHost.scheduled.length, 1);
  } finally {
    presentation.destroy();
  }
});

test('apiConfigSavePresentation: destroy 后 update 不再生效且清除待定计时器', () => {
  const { status, timerHost, presentation } = makeHost();
  presentation.update('saved');
  assert.equal(timerHost.scheduled.length, 1);
  presentation.destroy();
  assert.deepEqual(timerHost.cleared, [1]);
  presentation.update('saving');
  assert.equal(status.textContent, TEXT_SAVED);
  assert.equal(timerHost.scheduled.length, 1);
  presentation.destroy();
});

test('apiConfigSavePresentation: 语言切换会重渲染状态文案', () => {
  const { status, presentation } = makeHost();
  try {
    status.textContent = 'sentinel';
    setLocale('en-US');
    assert.equal(status.textContent, TEXT_AUTO);
  } finally {
    presentation.destroy();
    setLocale('zh-CN');
  }
});

test('apiConfigSavePresentation: destroy 后语言切换不再重渲染', () => {
  const { status, presentation } = makeHost();
  presentation.destroy();
  status.textContent = 'sentinel';
  try {
    setLocale('en-US');
    assert.equal(status.textContent, 'sentinel');
  } finally {
    setLocale('zh-CN');
  }
});

test('apiConfigSavePresentation: 缺少目标元素或 document 时安全降级', () => {
  const timerHost = makeTimerHost();
  const noElements = createApiConfigSavePresentation(makeRoot(), { timerHost });
  noElements.update('saved');
  assert.equal(timerHost.scheduled.length, 1);
  timerHost.scheduled[0].fn();
  noElements.destroy();

  const noDocument = createApiConfigSavePresentation(null, { timerHost });
  noDocument.update('error');
  assert.equal(timerHost.scheduled.length, 1);
  noDocument.destroy();
});

test('apiConfigSavePresentation: 只有按钮或只有状态节点时各自独立工作', () => {
  const button = makeButtonElement();
  const timerHost = makeTimerHost();
  const buttonOnly = createApiConfigSavePresentation(makeRoot({ byId: { btnApiSave: button } }), {
    timerHost,
  });
  try {
    buttonOnly.update('saving');
    assert.equal(button.disabled, true);
    assert.equal(button.attrs['aria-busy'], 'true');
  } finally {
    buttonOnly.destroy();
  }

  const status = makeStatusElement();
  const statusOnly = createApiConfigSavePresentation(
    makeRoot({ byId: { apiConfigSaveStatus: status } }),
    { timerHost },
  );
  try {
    statusOnly.update('error');
    assert.equal(status.textContent, TEXT_ERROR);
    assert.deepEqual(status.toggles.slice(-3), [
      [CLASS_TESTING, false],
      [CLASS_SUCCESS, false],
      [CLASS_DANGER, true],
    ]);
  } finally {
    statusOnly.destroy();
  }
});

test('apiConfigSavePresentation: 未知状态原样透传文案且三种装饰类都为 false', () => {
  const { status, presentation } = makeHost();
  try {
    presentation.update('weird');
    assert.equal(status.textContent, 'settings.saveStatus.weird');
    assert.deepEqual(status.toggles.slice(-3), [
      [CLASS_TESTING, false],
      [CLASS_SUCCESS, false],
      [CLASS_DANGER, false],
    ]);
  } finally {
    presentation.destroy();
  }
});
