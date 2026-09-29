import test from 'node:test';
import assert from 'node:assert/strict';

import { startMediaProgressDragSession } from './mediaProgressDragSession.js';

function createTarget() {
  const listeners = new Map();
  return {
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
    emit(type, event) {
      for (const listener of [...(listeners.get(type) || [])]) listener(event);
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
  };
}

test('startMediaProgressDragSession: filters pointer IDs and ends once', () => {
  const target = createTarget();
  const moves = [];
  const ends = [];
  const session = startMediaProgressDragSession({
    target,
    pointerId: 7,
    onMove: (event) => moves.push(event.pointerId),
    onEnd: (event) => ends.push(event.pointerId),
  });

  target.emit('pointermove', { pointerId: 8 });
  target.emit('pointermove', { pointerId: 7 });
  target.emit('pointerup', { pointerId: 8 });
  target.emit('pointerup', { pointerId: 7 });
  target.emit('pointerup', { pointerId: 7 });

  assert.deepEqual(moves, [7]);
  assert.deepEqual(ends, [7]);
  assert.equal(session.active, false);
  assert.equal(target.listenerCount('pointermove'), 0);
  assert.equal(target.listenerCount('pointerup'), 0);
});

test('startMediaProgressDragSession: dispose cancels without calling onEnd', () => {
  const target = createTarget();
  const ends = [];
  const session = startMediaProgressDragSession({
    target,
    pointerId: 3,
    onMove() {},
    onEnd: (event) => ends.push(event.pointerId),
  });

  assert.equal(session.dispose(), true);
  assert.equal(session.dispose(), false);
  target.emit('pointerup', { pointerId: 3 });
  assert.deepEqual(ends, []);
});

test('startMediaProgressDragSession: blur invokes the cancel callback', () => {
  const target = createTarget();
  const cancellations = [];
  startMediaProgressDragSession({
    target,
    pointerId: 3,
    onMove() {},
    onEnd() {},
    onCancel: (event) => cancellations.push(event.type),
  });

  target.emit('blur', { type: 'blur' });
  assert.deepEqual(cancellations, ['blur']);
});
