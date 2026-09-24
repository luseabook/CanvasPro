import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompletionNotificationNavigation } from './completionNotificationNavigation.js';

test('remember keeps entries out of click events until activated', () => {
  const logs = [],
    clicks = [],
    navigation = createCompletionNotificationNavigation({
      focusMainWindow: () => true,
      onClick: (event) => clicks.push(event),
      logEvent: (entry) => logs.push(entry),
    });
  navigation.remember({ source: 'canvas', nodeId: 'n1' }, 'notif-1');
  assert.deepEqual(navigation.consumeClickEvents(), []);
  assert.equal(navigation.activateLatest(), true);
  assert.equal(clicks.length, 1);
  assert.equal(clicks[0].nodeId, 'n1');
  assert.match(clicks[0].eventId, /^completion-\d+-\d+$/);
  assert.equal(typeof clicks[0].createdAt, 'number');
  assert.equal(logs[0].type, 'notification.generation_complete_clicked');
  const events = navigation.consumeClickEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].nodeId, 'n1');
  assert.deepEqual(navigation.consumeClickEvents(), []);
  assert.equal(clicks.length, 1);
});

test('activate is idempotent and calls the stored release exactly once', () => {
  const releases = [],
    navigation = createCompletionNotificationNavigation({ focusMainWindow: () => true });
  const entry = navigation.remember({ source: 'canvas', nodeId: 'n1' }, 'notif-1');
  entry.release = (closeWindow) => releases.push(closeWindow);
  assert.equal(navigation.activate(entry), true);
  assert.equal(navigation.activate(entry), false);
  assert.deepEqual(releases, [true]);
  assert.equal(entry.release, null);
});

test('activateLatest with no pending entries returns false', () => {
  const navigation = createCompletionNotificationNavigation({ focusMainWindow: () => true });
  assert.equal(navigation.activateLatest(), false);
});

test('acknowledge clears matching pending entries by notificationId', () => {
  const navigation = createCompletionNotificationNavigation({ focusMainWindow: () => true });
  navigation.remember({ source: 'canvas', nodeId: 'n1' }, 'notif-1');
  navigation.remember({ source: 'canvas', nodeId: 'n2' }, 'notif-2');
  assert.deepEqual(navigation.acknowledge({ notificationId: 'notif-1' }), { success: true });
  assert.equal(navigation.activateLatest(), true);
  assert.equal(navigation.consumeClickEvents()[0].nodeId, 'n2');
  assert.deepEqual(navigation.acknowledge({}), { success: false });
  assert.deepEqual(navigation.acknowledge({ notificationId: '' }), { success: false });
  assert.deepEqual(navigation.acknowledge({ notificationId: 42 }), { success: false });
});

test('a release invoked by remember overflow settles the oldest pending entry', () => {
  const releases = [],
    navigation = createCompletionNotificationNavigation({ focusMainWindow: () => true });
  const first = navigation.remember({ source: 'canvas', nodeId: 'first' }, 'notif-0');
  first.release = (closeWindow) => releases.push(['first', closeWindow]);
  for (let index = 0; index < 40; index += 1) {
    navigation.remember({ source: 'canvas', nodeId: 'node-' + index }, 'notif-' + index);
  }
  assert.deepEqual(releases, [['first', true]]);
  assert.equal(first.handled, true);
});

test('the click event queue is capped at 40 entries', () => {
  const navigation = createCompletionNotificationNavigation({ focusMainWindow: () => true });
  for (let index = 0; index < 45; index += 1) {
    const entry = navigation.remember({ source: 'canvas', nodeId: 'node-' + index }, 'notif-' + index);
    navigation.activate(entry);
  }
  const events = navigation.consumeClickEvents();
  assert.equal(events.length, 40);
  assert.equal(events[0].nodeId, 'node-5');
  assert.equal(events[39].nodeId, 'node-44');
});

test('dispose settles every pending entry and drops queued click events', () => {
  const releases = [],
    navigation = createCompletionNotificationNavigation({ focusMainWindow: () => true });
  const entry = navigation.remember({ source: 'canvas', nodeId: 'n1' }, 'notif-1');
  entry.release = (closeWindow) => releases.push(closeWindow);
  const clicked = navigation.remember({ source: 'canvas', nodeId: 'n2' }, 'notif-2');
  navigation.activate(clicked);
  navigation.dispose();
  assert.deepEqual(releases, [true]);
  assert.equal(entry.handled, true);
  assert.deepEqual(navigation.consumeClickEvents(), []);
});

test('focus failure is logged but does not block the click event', async () => {
  const logs = [],
    clicks = [],
    navigation = createCompletionNotificationNavigation({
      focusMainWindow: () => false,
      onClick: (event) => clicks.push(event),
      logEvent: (entry) => logs.push(entry),
    });
  const entry = navigation.remember({ source: 'canvas', nodeId: 'n1' }, 'notif-1');
  navigation.activate(entry);
  assert.equal(clicks.length, 1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    logs.some((entry) => entry.type === 'notification.generation_complete_focus_failed'),
    true,
  );
});
