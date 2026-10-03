import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createUpdaterController } from './updaterController.js';

function fixture() {
  const autoUpdater = new EventEmitter(); const events = []; const logs = [];
  const controller = createUpdaterController({ autoUpdater, isPackaged: true,
    sendEvent: event => events.push(event), logEvent: event => logs.push(event) });
  return { autoUpdater, controller, events, logs };
}
for (const manual of [false, true]) {
  test(`one concise error for event plus rejection, manual=${manual}`, async () => {
    const f = fixture();
    const error = new Error('HTTP 404 Response Headers: ' + 'private-details '.repeat(1000));
    f.autoUpdater.checkForUpdates = async () => { f.autoUpdater.emit('error', error); throw error; };
    await assert.rejects(f.controller.checkForUpdates({ manual }));
    const errors = f.events.filter(event => event.type === 'error');
    assert.equal(errors.length, 1); assert.equal(errors[0].manual, manual);
    assert.ok(errors[0].message.length < 100); assert.ok(!errors[0].message.includes('Headers'));
    assert.equal(f.logs.at(-1).error, error);
  });
}
test('concurrent checks share one request and a later manual request keeps manual feedback', async () => {
  const f = fixture(); let reject; let count = 0;
  f.autoUpdater.checkForUpdates = () => { count++; return new Promise((_, r) => { reject = r; }); };
  const first = f.controller.checkForUpdates(); const second = f.controller.checkForUpdates({ manual: true });
  assert.equal(first, second); await Promise.resolve(); reject(new Error('offline'));
  await assert.rejects(first); assert.equal(count, 1);
  assert.equal(f.events.at(-1).manual, true);
});
test('each later check can report its own failure', async () => {
  const f = fixture(); f.autoUpdater.checkForUpdates = async () => { throw new Error('offline'); };
  await assert.rejects(f.controller.checkForUpdates()); await assert.rejects(f.controller.checkForUpdates());
  assert.equal(f.events.filter(event => event.type === 'error').length, 2);
  assert.notEqual(f.events[0].eventId, f.events[1].eventId);
});
