import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyManualBoxPreview,
  createPersonReplacementBoxDragPreview,
  getPersonReplacementBoxDragDistance,
} from './personReplacementBoxDragPreview.js';

function styleRecorder() {
  const writes = [];
  return {
    writes,
    style: {
      setProperty: (name, value) => writes.push([name, value]),
    },
  };
}

test('applyManualBoxPreview writes percentage custom properties', () => {
  const { writes, style } = styleRecorder();
  applyManualBoxPreview({ style }, { x: 0.5, y: 0.25, width: 0.125, height: 0.75 });
  assert.deepEqual(writes, [
    ['--box-x', '50%'],
    ['--box-y', '25%'],
    ['--box-width', '12.5%'],
    ['--box-height', '75%'],
  ]);
});

test('applyManualBoxPreview tolerates a bare element', () => {
  assert.doesNotThrow(() => applyManualBoxPreview({}, { x: 0, y: 0, width: 0, height: 0 }));
  assert.doesNotThrow(() => applyManualBoxPreview(null, { x: 0, y: 0, width: 0, height: 0 }));
});

test('getPersonReplacementBoxDragDistance measures the pointer travel', () => {
  assert.equal(
    getPersonReplacementBoxDragDistance({ clientX: 3, clientY: 4 }, { startClientX: 0, startClientY: 0 }),
    5,
  );
  assert.equal(
    getPersonReplacementBoxDragDistance({ clientX: 3, clientY: 4 }, { startClientX: 3, startClientY: 4 }),
    0,
  );
});

test('getPersonReplacementBoxDragDistance reports zero for unusable coordinates', () => {
  assert.equal(
    getPersonReplacementBoxDragDistance(
      { clientX: 'nope', clientY: 4 },
      { startClientX: 0, startClientY: 0 },
    ),
    0,
  );
  assert.equal(getPersonReplacementBoxDragDistance(null, { startClientX: 0, startClientY: 0 }), 0);
});

test('createPersonReplacementBoxDragPreview ignores a schedule without a session', () => {
  let previews = 0;
  let frames = 0;
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => null,
    applyPreview: () => {
      previews += 1;
    },
    threshold: 3,
    windowObject: {
      requestAnimationFrame: () => {
        frames += 1;
        return 1;
      },
    },
  });
  handle.schedule({ clientX: 10, clientY: 10 });
  assert.equal(previews, 0);
  assert.equal(frames, 0);
});

test('createPersonReplacementBoxDragPreview applies the preview on the next frame', () => {
  const previews = [];
  const frames = [];
  const session = { hasDragged: false };
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => session,
    applyPreview: (preview) => previews.push(preview),
    threshold: 3,
    windowObject: {
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return 7;
      },
    },
  });
  handle.schedule({ clientX: 12, clientY: 9 });
  assert.equal(frames.length, 1);
  assert.deepEqual(previews, []);
  frames[0]();
  assert.deepEqual(previews, [{ clientX: 12, clientY: 9 }]);
});

test('createPersonReplacementBoxDragPreview marks the session as dragged past the threshold', () => {
  const session = { hasDragged: false, startClientX: 0, startClientY: 0 };
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => session,
    applyPreview: () => {},
    threshold: 5,
    windowObject: {},
  });
  handle.schedule({ clientX: 0, clientY: 4 });
  assert.equal(session.hasDragged, false);
  handle.schedule({ clientX: 6, clientY: 8 });
  assert.equal(session.hasDragged, true);
});

test('createPersonReplacementBoxDragPreview coalesces pending frames and keeps the latest pointer', () => {
  const previews = [];
  const frames = [];
  const session = { hasDragged: false };
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => session,
    applyPreview: (preview) => previews.push(preview),
    threshold: 3,
    windowObject: {
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return frames.length;
      },
    },
  });
  handle.schedule({ clientX: 1, clientY: 1 });
  handle.schedule({ clientX: 8, clientY: 6 });
  assert.equal(frames.length, 1);
  frames[0]();
  assert.deepEqual(previews, [{ clientX: 8, clientY: 6 }]);
  handle.schedule({ clientX: 20, clientY: 20 });
  assert.equal(frames.length, 2);
});

test('createPersonReplacementBoxDragPreview drops a frame whose session changed', () => {
  const previews = [];
  const frames = [];
  let session = { hasDragged: false };
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => session,
    applyPreview: (preview) => previews.push(preview),
    threshold: 3,
    windowObject: {
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return 1;
      },
    },
  });
  handle.schedule({ clientX: 4, clientY: 4 });
  session = { hasDragged: false };
  frames[0]();
  assert.deepEqual(previews, []);
});

test('createPersonReplacementBoxDragPreview cancels a pending frame', () => {
  const cancelled = [];
  const frames = [];
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => ({ hasDragged: false }),
    applyPreview: () => {
      throw new Error('must not run');
    },
    threshold: 3,
    windowObject: {
      requestAnimationFrame: (callback) => {
        frames.push(callback);
        return 11;
      },
      cancelAnimationFrame: (id) => cancelled.push(id),
    },
  });
  handle.schedule({ clientX: 4, clientY: 4 });
  handle.cancel();
  assert.deepEqual(cancelled, [11]);
  handle.cancel();
  assert.deepEqual(cancelled, [11]);
});

test('createPersonReplacementBoxDragPreview applies synchronously without requestAnimationFrame', () => {
  const previews = [];
  const session = { hasDragged: false };
  const handle = createPersonReplacementBoxDragPreview({
    getSession: () => session,
    applyPreview: (preview) => previews.push(preview),
    threshold: 3,
  });
  handle.schedule({ clientX: 1, clientY: 2 });
  assert.deepEqual(previews, [{ clientX: 1, clientY: 2 }]);
  handle.schedule({ clientX: 3, clientY: 4 });
  assert.deepEqual(previews, [
    { clientX: 1, clientY: 2 },
    { clientX: 3, clientY: 4 },
  ]);
});
