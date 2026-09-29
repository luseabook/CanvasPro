import test from 'node:test';
import assert from 'node:assert/strict';

import { bindVideoVoiceReplaceAction } from './voiceReplaceAction.js';
import { t } from '../../../i18n/index.js';

function createButton() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    emit(type, event) {
      listeners.get(type)?.(event);
    },
  };
}

function withWindow(windowLike, run) {
  const originalWindow = globalThis.window;
  globalThis.window = windowLike;
  try {
    return run();
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
}

test('voiceReplaceAction: blocks while video keying is active', () => {
  const button = createButton();
  const toasts = [];
  let stopped = 0;

  withWindow(
    {
      showToast: (...args) => toasts.push(args),
      dispatchEvent() {
        throw new Error('should not open the voice panel');
      },
    },
    () => {
      bindVideoVoiceReplaceAction({
        toolbarEl: { querySelector: () => button },
        nodeData: { id: 'video-1' },
        getStateSnapshot: () => ({ videoKeying: { active: true }, videoClip: { active: false } }),
        VideoClipController: { exit() {} },
        VideoKeyingController: { exit() {} },
      });

      button.emit('click', { stopPropagation: () => (stopped += 1) });
    },
  );

  assert.equal(stopped, 1);
  assert.deepEqual(toasts, [[t('nodeToolbar.video.exitCurrentEditMode'), 'info']]);
});

test('voiceReplaceAction: exits edit controllers and opens the voice panel', () => {
  const button = createButton();
  const calls = [];
  const events = [];

  withWindow(
    {
      showToast() {},
      dispatchEvent: (event) => events.push(event),
    },
    () => {
      bindVideoVoiceReplaceAction({
        toolbarEl: { querySelector: () => button },
        nodeData: { id: 'video-1' },
        getStateSnapshot: () => ({ videoKeying: { active: false }, videoClip: { active: false } }),
        VideoClipController: { exit: (options) => calls.push(['clip', options]) },
        VideoKeyingController: { exit: (options) => calls.push(['keying', options]) },
      });

      button.emit('click', { stopPropagation() {} });
    },
  );

  assert.deepEqual(calls, [
    ['clip', { silent: true }],
    ['keying', { silent: true }],
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'audioVoicePanel:open');
  assert.deepEqual(events[0].detail, { sourceNodeId: 'video-1' });
});
