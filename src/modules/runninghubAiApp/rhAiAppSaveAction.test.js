import test from 'node:test';
import assert from 'node:assert/strict';

import { saveRhAiApp } from './rhAiAppSaveAction.js';

function makeApp(over = {}) {
  const log = [];
  const saveBtn = {
    disabled: false,
    textContent: '保存',
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
      log.push('btn-aria-set:' + value);
    },
    removeAttribute(name) {
      delete this.attrs[name];
      log.push('btn-aria-remove');
    },
  };
  const app = {
    log,
    savePending: false,
    saveBtn,
    sourceType: 'runninghub-ai-app',
    kind: 'image',
    savedAppId: '',
    runningHubProfileId: '',
    appName: '模型 A',
    appDescription: '',
    promptHelpTooltip: '',
    componentDrafts: [{ id: 1 }],
    currentBundle: { id: 'bundle-1' },
    _getInputText: () => 'input-text',
    _findSavedApp: (id) => {
      log.push('findSavedApp:' + id);
      return null;
    },
    _findSameNameSavedAppForCurrentScope: () => {
      log.push('findSameName');
      return null;
    },
    _showOverwriteConfirm: (id, intent) => {
      log.push('overwriteConfirm:' + id + ':' + intent);
    },
    _resetSaveSuccessFeedback: () => {
      log.push('reset');
      if (saveBtn.textContent === '保存中…') saveBtn.textContent = '保存';
    },
    _flashSaveSuccessFeedback: () => {
      log.push('flash');
    },
    _patchSavedConfigSuccessPreview: (bundle) => {
      log.push('patch:' + bundle?.id);
    },
    _setError: (message) => {
      log.push('setError:' + message);
    },
    _saveCurrentConfigAsSavedApp: async (options) => {
      log.push('save:' + options.overwriteSavedAppId + ':' + options.isCurrentDraft());
      return { isCurrentDraft: true, bundle: { id: 'bundle-1' }, record: { id: 'rec-1', name: '模型 A' } };
    },
    ...over,
  };
  return app;
}

async function withWindow(run) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const toasts = [];
  globalThis.window = { showToast: (...args) => toasts.push(args) };
  try {
    return await run(toasts);
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  }
}

test('savePending 为真时直接返回 null，不做任何操作', async () => {
  await withWindow(async () => {
    const app = makeApp({ savePending: true });
    const result = await saveRhAiApp(app);
    assert.equal(result, null);
    assert.deepEqual(app.log, []);
    assert.equal(app.saveBtn.disabled, false);
  });
});

test('同名模型存在且按 id 找不到时，弹出覆盖确认并返回 null', async () => {
  await withWindow(async () => {
    const app = makeApp({
      savedAppId: 'app-9',
      _findSameNameSavedAppForCurrentScope: () => ({ id: 'same-name-3' }),
    });
    const result = await saveRhAiApp(app);
    assert.equal(result, null);
    assert.ok(app.log.includes('overwriteConfirm:same-name-3:save'));
    assert.ok(!app.log.some((entry) => entry.startsWith('save:')));
  });
});

test('未显式传入覆盖 id 时，用已保存记录 id 覆盖', async () => {
  await withWindow(async () => {
    const app = makeApp({
      savedAppId: 'app-9',
      _findSavedApp: (id) => (id === 'app-9' ? { id: 'app-9' } : null),
      _findSameNameSavedAppForCurrentScope: () => ({ id: 'other' }),
    });
    await saveRhAiApp(app);
    assert.ok(app.log.some((entry) => entry.startsWith('save:app-9:')));
    assert.ok(!app.log.some((entry) => entry.startsWith('overwriteConfirm')));
  });
});

test('成功路径：置保存中态、补丁预览、清错误、成功提示并返回记录', async () => {
  await withWindow(async (toasts) => {
    const app = makeApp();
    const result = await saveRhAiApp(app, 'app-1');
    assert.equal(result.id, 'rec-1');
    assert.deepEqual(app.log, [
      'reset',
      'btn-aria-set:true',
      'save:app-1:true',
      'patch:bundle-1',
      'reset',
      'flash',
      'setError:',
      'btn-aria-remove',
    ]);
    assert.equal(app.savePending, false);
    assert.equal(app.saveBtn.disabled, false);
    assert.equal(app.saveBtn.textContent, '保存');
    assert.deepEqual(toasts, [['模型“模型 A”已保存', 'success']]);
  });
});

test('保存过程中草稿被改动（isCurrentDraft 为假）时不打补丁也不闪成功', async () => {
  await withWindow(async (toasts) => {
    const app = makeApp();
    app._saveCurrentConfigAsSavedApp = async (options) => {
      app.appName = '改过的名字';
      assert.equal(options.isCurrentDraft(), false);
      return { isCurrentDraft: false, bundle: { id: 'bundle-1' }, record: { id: 'rec-2', name: '模型 A' } };
    };
    const result = await saveRhAiApp(app, '');
    assert.equal(result.id, 'rec-2');
    assert.ok(!app.log.includes('patch:bundle-1'));
    assert.ok(!app.log.includes('flash'));
    assert.ok(toasts.some((entry) => entry[1] === 'success'));
  });
});

test('失败路径：透传错误信息、设置错误、错误提示并返回 null', async () => {
  await withWindow(async (toasts) => {
    const app = makeApp();
    app._saveCurrentConfigAsSavedApp = async () => {
      throw new Error('磁盘已满');
    };
    const result = await saveRhAiApp(app, 'app-1');
    assert.equal(result, null);
    assert.ok(app.log.includes('setError:磁盘已满'));
    assert.deepEqual(toasts, [['磁盘已满', 'error']]);
    assert.equal(app.savePending, false);
    assert.equal(app.saveBtn.disabled, false);
    assert.ok(!('aria-busy' in app.saveBtn.attrs));
  });
});

test('失败但错误无 message 时用默认文案', async () => {
  await withWindow(async (toasts) => {
    const app = makeApp();
    app._saveCurrentConfigAsSavedApp = async () => {
      throw {};
    };
    await saveRhAiApp(app, 'app-1');
    assert.ok(app.log.includes('setError:模型保存失败，请重试'));
    assert.deepEqual(toasts, [['模型保存失败，请重试', 'error']]);
  });
});

test('失败且草稿已变化时不写入错误状态', async () => {
  await withWindow(async () => {
    const app = makeApp();
    app._saveCurrentConfigAsSavedApp = async () => {
      app.appName = '改过的名字';
      throw new Error('保存失败');
    };
    await saveRhAiApp(app, 'app-1');
    assert.ok(!app.log.some((entry) => entry.startsWith('setError:')));
  });
});

test('收尾时按 currentBundle 决定按钮可用性，并移除 aria-busy', async () => {
  await withWindow(async () => {
    const app = makeApp({ currentBundle: null });
    await saveRhAiApp(app, 'app-1');
    assert.equal(app.saveBtn.disabled, true);
    assert.ok(!('aria-busy' in app.saveBtn.attrs));
  });
});

test('收尾时按钮仍显示保存中则再复位一次反馈', async () => {
  await withWindow(async () => {
    const app = makeApp({
      _resetSaveSuccessFeedback: () => {
        app.log.push('reset');
      },
    });
    await saveRhAiApp(app, 'app-1');
    const resetCount = app.log.filter((entry) => entry === 'reset').length;
    assert.equal(resetCount, 3);
    assert.equal(app.saveBtn.textContent, '保存中…');
  });
});

test('成功反馈已把按钮文案复位时，收尾不再多复位一次', async () => {
  await withWindow(async () => {
    const app = makeApp();
    await saveRhAiApp(app, 'app-1');
    const resetCount = app.log.filter((entry) => entry === 'reset').length;
    assert.equal(resetCount, 2);
    assert.equal(app.saveBtn.textContent, '保存');
  });
});

test('没有 saveBtn 时保存流程照常完成', async () => {
  await withWindow(async (toasts) => {
    const app = makeApp({ saveBtn: null });
    const result = await saveRhAiApp(app, 'app-1');
    assert.equal(result.id, 'rec-1');
    assert.deepEqual(toasts, [['模型“模型 A”已保存', 'success']]);
  });
});
