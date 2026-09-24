// Minimal local DOM double only: not a browser/Electron UI acceptance test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaTaskRecoveryPanel } from './MediaTaskRecoveryPanel.js';
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.style = {}; this.listeners = {}; this.isConnected = true; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
}
function setup(t, api = { list: () => [] }) {
  const oldDocument = globalThis.document;
  globalThis.document = { createElement: tag => new Element(tag) };
  t.after(() => { if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument; });
  return new MediaTaskRecoveryPanel({ api, refresh: async () => true });
}
function task() { return { taskId: 'id', kind: 'storySequenceExport', createdAt: 1, finishedAt: 2, status: 'complete',
  result: { success: true, localPath: 'output/clip.mp4', videoDuration: 3 } }; }
test('missing desktop disables query and refresh', t => {
  const panel = setup(t, null); assert.equal(panel.queryButton.disabled, true); assert.equal(panel.refreshButton.disabled, true);
});
test('lookup only reads; path is selectable readonly text and import is explicit', async t => {
  let reads = 0; const panel = setup(t, { list: () => { reads++; return [task()]; } });
  await panel.lookup('id'); assert.equal(reads, 1); assert.equal(panel.details.children[0].readOnly, true);
  assert.equal(panel.details.children[0].value, 'output/clip.mp4'); assert.ok(panel.takeButton);
});
test('running tasks have no take button', async t => {
  const panel = setup(t, { list: () => [{ ...task(), status: 'processing' }] });
  await panel.lookup('id'); assert.equal(panel.takeButton, null); assert.match(panel.message.textContent, /processing/);
});
test('hiding while lookup awaits ignores its result and releases controls', async t => {
  let resolve; const panel = setup(t, { list: () => new Promise(r => { resolve = r; }) });
  const pending = panel.lookup('id'); await Promise.resolve(); panel.suspend(); resolve([task()]); await pending;
  assert.equal(panel.preview, null); assert.equal(panel.busy, false); assert.equal(panel.details.children.length, 0);
});
test('input change invalidates a stale preview', async t => {
  const panel = setup(t, { list: () => [task()] }); await panel.lookup('id'); panel.input.listeners.input();
  assert.equal(panel.preview, null); assert.equal(panel.details.children.length, 0);
});
test('query failures remain visible, do not invent failure snapshots', async t => {
  const panel = setup(t, { list: () => { throw Error('host unavailable'); } });
  await panel.lookup('id'); assert.equal(panel.preview, null); assert.match(panel.message.textContent, /host unavailable/);
});
test('keyboard input and clipboard stay in the recovery area', t => {
  const panel = setup(t); let stopped = 0;
  panel.el.listeners.keydown({ key: 'c', target: panel.input, stopPropagation: () => stopped++ }); assert.equal(stopped, 1);
});
