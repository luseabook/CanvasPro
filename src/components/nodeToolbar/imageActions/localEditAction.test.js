import test from 'node:test';
import assert from 'node:assert/strict';

import { t } from '../../../i18n/index.js';
import { bindImageLocalEditAction } from './localEditAction.js';

function createButton() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event) {
      listeners.get(type)?.(event);
    },
  };
}

test('localEditAction: binds RunningHub task state and opens the image annotation controller', () => {
  const button = createButton();
  const toolbarEl = {
    querySelector: (selector) => (selector === '.act-local-edit' ? button : null),
  };
  const tasks = [{ id: 'task-1', node: { rhToolbarTaskType: 'image-erase' } }];
  const initCalls = [];
  const cancelCalls = [];
  let binding = null;

  bindImageLocalEditAction({
    toolbarEl,
    nodeId: 'image-1',
    ImageAnnotateController: {
      init(...args) {
        initCalls.push(args);
      },
    },
    bindRunningHubToolbarTaskButton: (options) => {
      binding = options;
    },
    findRunningHubToolbarTaskForNode: (nodeId, options) => {
      assert.equal(nodeId, 'image-1');
      assert.deepEqual(options, { taskTypes: ['image-repaint', 'image-erase'] });
      return tasks;
    },
    cancelRunningHubResultTask: (...args) => {
      cancelCalls.push(args);
      return true;
    },
  });

  assert.equal(binding.button, button);
  assert.deepEqual(binding.getTask(), tasks);
  assert.deepEqual(binding.eventTypes, ['click', 'image-local-edit-open']);
  assert.equal(binding.cancelTooltip, t('nodeToolbar.image.cancelLocalEdit'));
  assert.equal(binding.cancelTask(tasks[0]), true);
  assert.deepEqual(cancelCalls, [
    [
      tasks[0],
      {
        name: t('nodeToolbar.image.eraseCancelledName'),
        outputText: t('nodeToolbar.image.eraseCancelledOutput'),
        notifyMessage: t('nodeToolbar.image.eraseCancelledToast'),
      },
    ],
  ]);

  const originalWindow = globalThis.window;
  const focused = [];
  globalThis.window = {
    v2FocusOnNode: (nodeId) => focused.push(nodeId),
  };
  let stopped = false;
  try {
    button.dispatch('image-local-edit-open', {
      detail: { scene: 'erase' },
      stopPropagation() {
        stopped = true;
      },
    });
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }

  assert.equal(stopped, true);
  assert.deepEqual(focused, ['image-1']);
  assert.deepEqual(initCalls, [
    [
      'image-1',
      {
        scene: 'erase',
        submitLabel: t('nodeToolbar.image.generate'),
        submitBusyLabel: t('nodeToolbar.image.generating'),
        submitNoop: true,
      },
    ],
  ]);
});

test('localEditAction: does nothing when the local-edit button is absent', () => {
  let bound = false;
  bindImageLocalEditAction({
    toolbarEl: { querySelector: () => null },
    nodeId: 'image-1',
    bindRunningHubToolbarTaskButton: () => {
      bound = true;
    },
  });
  assert.equal(bound, false);
});
