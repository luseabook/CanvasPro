import test from 'node:test';
import assert from 'node:assert/strict';

import { bindRendererMediaPlaybackPin } from './rendererMediaPlaybackPin.js';

function createEventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      const entries = listeners.get(type) || [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      listeners.set(
        type,
        (listeners.get(type) || []).filter((entry) => entry !== listener),
      );
    },
    emit(type) {
      for (const listener of [...(listeners.get(type) || [])]) listener({ type });
    },
  };
}

test('rendererMediaPlaybackPin: pins while playing and unpins on pause or disposal', () => {
  const media = createEventTarget();
  media.paused = false;
  media.ended = false;
  const calls = [];
  const dispose = bindRendererMediaPlaybackPin(media, 'node-1', {
    getRenderer: () => ({
      pinNode: (nodeId, reason) => calls.push(['pin', nodeId, reason]),
      unpinNode: (nodeId, reason) => calls.push(['unpin', nodeId, reason]),
    }),
  });

  assert.deepEqual(calls, [['pin', 'node-1', 'media-playback']]);

  media.paused = true;
  media.emit('pause');
  media.emit('pause');
  assert.deepEqual(calls, [
    ['pin', 'node-1', 'media-playback'],
    ['unpin', 'node-1', 'media-playback'],
  ]);

  media.paused = false;
  media.emit('play');
  dispose();
  assert.deepEqual(calls, [
    ['pin', 'node-1', 'media-playback'],
    ['unpin', 'node-1', 'media-playback'],
    ['pin', 'node-1', 'media-playback'],
    ['unpin', 'node-1', 'media-playback'],
  ]);
  assert.equal(media.listeners.get('play').length, 0);
});

test('rendererMediaPlaybackPin: returns a no-op for an invalid media element', () => {
  const dispose = bindRendererMediaPlaybackPin({}, 'node-1', {
    getRenderer: () => {
      throw new Error('should not be called');
    },
  });

  assert.equal(typeof dispose, 'function');
  dispose();
});
