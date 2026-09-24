// Minimal DOM double: checks UI gating only, not real Electron layout or browser behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaTaskHistoryPanel } from './MediaTaskHistoryPanel.js';

const SESSION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECORD = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.style = {}; this.listeners = {}; this.isConnected = true; this.value = ''; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  remove() { this.isConnected = false; }
}
const diskState = { version: 1, enabled: false, persistedEnabled: false, canWrite: true,
  sessionId: SESSION, controlRevision: 0, revision: 1, savedAt: 40, pending: false,
  count: 1, droppedCount: 0, skipped: 0, notice: '', problem: '', path: 'history.json' };
function view() {
  return { taskId: 'task-1', kind: 'mediaClipExport', status: 'complete', createdAt: 10, finishedAt: 20,
    result: { success: true, localPath: 'output/ClipVideo/a.mp4', videoDuration: 4 },
    history: { version: 1, durable: true, recordId: RECORD, sessionId: SESSION, savedAt: 40 } };
}
function setup(t, api, confirm = () => true) {
  const oldDocument = globalThis.document, oldWindow = globalThis.window;
  globalThis.document = { createElement: tag => new Element(tag) };
  globalThis.window = { confirm };
  t.after(() => {
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
  });
  const recovery = { el: new Element('section'), suspends: 0, lookups: [],
    suspend() { this.suspends++; }, async lookup(id) { this.lookups.push(id); } };
  const panel = new MediaTaskHistoryPanel({ api, createRecoveryPanel: () => recovery });
  return { panel, recovery };
}
function api(read = () => ({ version: 1, ok: true, total: 1, rows: [view()], status: diskState })) {
  return { status: () => assert.fail('status is part of read response'), read,
    configure: () => assert.fail('configure should require confirmation'),
    flush: () => assert.fail('read cannot flush') };
}

test('missing host capability disables controls; no browser fallback or auto-read', t => {
  const { panel } = setup(t, null);
  assert.equal(panel.readButton.disabled, true);
  assert.equal(panel.enableButton.disabled, true);
  assert.match(panel.message.textContent, /桌面端/);
});
test('reading is passive; a selected row is bound to its recordId before recovery', async t => {
  const queries = [];
  const { panel, recovery } = setup(t, api(query => { queries.push(query); return { version: 1, ok: true, total: 1, rows: [view()], status: diskState }; }));
  await panel.load();
  assert.deepEqual(queries, [{ offset: 0, limit: 20 }]);
  assert.equal(panel.rows.children.length, 1);
  assert.equal(panel.enableButton.disabled, false);
  assert.equal(recovery.el.hidden, true);
  panel.rows.children[0].children[1].listeners.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(recovery.el.hidden, false);
  assert.deepEqual(recovery.lookups, ['task-1']);
  const selected = await recovery.api.list({ taskId: 'task-1' });
  assert.equal(selected[0].history.recordId, RECORD);
  assert.deepEqual(queries[1], { recordId: RECORD, limit: 1 });
});
test('opt-in requires explicit confirmation and a fresh session/revision token', async t => {
  let approved = false, calls = 0, request;
  const bridge = api(() => ({ version: 1, ok: true, total: 1, rows: [view()],
    status: { ...diskState, enabled: calls > 0, persistedEnabled: calls > 0, controlRevision: calls } }));
  bridge.configure = async value => { calls++; request = value; return { version: 1, ok: true,
    status: { ...diskState, enabled: true, persistedEnabled: true, controlRevision: 1 } }; };
  const { panel } = setup(t, bridge, () => approved);
  await panel.load();
  await panel.configure(true);
  assert.equal(calls, 0);
  approved = true;
  await panel.configure(true);
  assert.equal(calls, 1);
  assert.deepEqual(request, { enabled: true, expectedSession: SESSION, expectedControlRevision: 0 });
  assert.equal(panel.state.enabled, true);
});
test('hiding the history panel discards an in-flight read, not its task', async t => {
  let resolve;
  const { panel } = setup(t, api(() => new Promise(done => { resolve = done; })));
  const waiting = panel.load();
  await Promise.resolve();
  panel.suspend();
  resolve({ version: 1, ok: true, total: 1, rows: [view()], status: diskState });
  await waiting;
  assert.equal(panel.rows.children.length, 0);
  assert.equal(panel.busy, false);
});
