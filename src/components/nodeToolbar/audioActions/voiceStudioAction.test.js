import test from 'node:test';
import assert from 'node:assert/strict';

import { bindAudioVoiceStudioAction } from './voiceStudioAction.js';

function createButton() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    emit(type, event) {
      listeners.get(type)?.(event);
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

test('voiceStudioAction: dispatches the voice panel event with a trimmed node id', () => {
  const button = createButton();
  const events = [];
  const dispose = bindAudioVoiceStudioAction({
    button,
    getNodeId: () => ' node-1 ',
    windowRef: { dispatchEvent: (event) => events.push(event) },
  });
  let prevented = 0;
  let stopped = 0;

  button.emit('click', {
    preventDefault: () => {
      prevented += 1;
    },
    stopPropagation: () => {
      stopped += 1;
    },
  });

  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'audioVoicePanel:open');
  assert.deepEqual(events[0].detail, { sourceNodeId: 'node-1' });

  dispose();
  assert.equal(button.listenerCount, 0);
});

test('voiceStudioAction: ignores clicks without a node id', () => {
  const button = createButton();
  const events = [];
  bindAudioVoiceStudioAction({
    button,
    getNodeId: () => '   ',
    windowRef: { dispatchEvent: (event) => events.push(event) },
  });

  button.emit('click', {});
  assert.deepEqual(events, []);
});

test('voiceStudioAction: returns a no-op when the button is absent', () => {
  const dispose = bindAudioVoiceStudioAction({ button: null });
  assert.equal(typeof dispose, 'function');
  dispose();
});
