import test from 'node:test';
import assert from 'node:assert/strict';

import { NODE_EDITOR_COMMIT_EVENT, deferNodeEditorCommit } from './nodeEditorCommit.js';

test('nodeEditorCommit: dispatches a cancelable bubbling event with the commit detail', () => {
  const events = [];
  const target = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
  const commit = () => 'saved';

  assert.equal(deferNodeEditorCommit(target, 'name', commit), false);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, NODE_EDITOR_COMMIT_EVENT);
  assert.equal(events[0].bubbles, true);
  assert.equal(events[0].cancelable, true);
  assert.deepEqual(events[0].detail, { key: 'name', commit });
});

test('nodeEditorCommit: reports cancellation and tolerates targets without dispatchEvent', () => {
  const target = {
    dispatchEvent(event) {
      event.preventDefault();
      return false;
    },
  };

  assert.equal(
    deferNodeEditorCommit(target, 'title', () => {}),
    true,
  );
  assert.equal(
    deferNodeEditorCommit({}, 'title', () => {}),
    false,
  );
  assert.equal(
    deferNodeEditorCommit(null, 'title', () => {}),
    false,
  );
});
