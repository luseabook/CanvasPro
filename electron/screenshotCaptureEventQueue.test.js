import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_CAPTURE_EVENT_LIMIT,
  createBoundedCaptureEventQueue,
} from './screenshotCaptureEventQueue.js';

test('screenshotCaptureEventQueue: keeps insertion order and consumes everything', () => {
  const queue = createBoundedCaptureEventQueue();
  (assert.equal(queue.limit, DEFAULT_CAPTURE_EVENT_LIMIT),
    assert.equal(queue.push({ id: 1 }), 1),
    assert.equal(queue.push({ id: 2 }), 2),
    assert.equal(queue.size(), 2),
    assert.deepEqual(queue.consume(), [{ id: 1 }, { id: 2 }]),
    assert.equal(queue.size(), 0),
    assert.deepEqual(queue.consume(), []));
});

test('screenshotCaptureEventQueue: drops the oldest events past the limit', () => {
  const queue = createBoundedCaptureEventQueue(8);
  for (let index = 1; index <= 11; index += 1) queue.push({ id: index });
  assert.equal(queue.size(), 8);
  assert.deepEqual(
    queue.consume().map((event) => event.id),
    [4, 5, 6, 7, 8, 9, 10, 11],
  );
});

test('screenshotCaptureEventQueue: honours a custom limit and falls back when it is invalid', () => {
  const custom = createBoundedCaptureEventQueue(2);
  (custom.push({ id: 1 }), custom.push({ id: 2 }), custom.push({ id: 3 }));
  (assert.equal(custom.limit, 2),
    assert.deepEqual(custom.consume(), [{ id: 2 }, { id: 3 }]),
    assert.equal(createBoundedCaptureEventQueue(0).limit, DEFAULT_CAPTURE_EVENT_LIMIT),
    assert.equal(createBoundedCaptureEventQueue(-4).limit, DEFAULT_CAPTURE_EVENT_LIMIT),
    assert.equal(createBoundedCaptureEventQueue('abc').limit, DEFAULT_CAPTURE_EVENT_LIMIT));
});

test('screenshotCaptureEventQueue: instances stay independent', () => {
  const first = createBoundedCaptureEventQueue(2),
    second = createBoundedCaptureEventQueue(2);
  (first.push({ id: 'a' }),
    assert.equal(first.size(), 1),
    assert.equal(second.size(), 0),
    assert.deepEqual(second.consume(), []));
});
