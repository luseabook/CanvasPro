import test from 'node:test';
import assert from 'node:assert/strict';
import { runFullProjectPackage, createFullProjectContextGuard } from './fullProjectPackageSession.js';
function fixture() {
  const f = { data: { canvases: [{ id: 'a', nodes: [], edges: [] }, { id: 'b', nodes: [], edges: [] }], activeCanvasId: 'b' }, opened: 0, retained: 0, calls: 0 };
  f.context = { nodes: {}, canvases: [], identity: 'project-a', data: f.data };
  f.result = { success: true, fullPackageVersion: 1, projectPath: '/new/project.aicanvas', canvasCount: 2, data: structuredClone(f.data) };
  f.api = { fullPackageCapabilities: async () => ({ version: 1 }), restoreFullPackage: async () => { f.calls++; return f.result; }, exportFullPackage: async request => { f.calls++; f.request = request; return { success: true, fullPackageVersion: 1 }; } };
  f.args = { mode: 'restore', api: f.api, readContext: () => f.context, confirmSwitch: () => true, openProject: r => { f.opened++; assert.equal(r.data.activeCanvasId, 'b'); return true; }, onRetained: () => { f.retained++; } };
  return f;
}
test('all canvases exported as captured snapshot, not current-only', async () => { const f = fixture(); await runFullProjectPackage({ ...f.args, mode: 'export' }); assert.equal(f.request.multiData.canvases.length, 2); assert.notEqual(f.request.multiData, f.data); assert.equal(f.opened, 0); });
test('restore opens complete data through one explicit original bridge', async () => { const f = fixture(); await runFullProjectPackage(f.args); assert.equal(f.opened, 1); assert.equal(f.retained, 0); });
test('missing or old host fails without invoking restore', async () => { for (const mode of ['missing', 'old', 'error']) { const f = fixture(); if (mode === 'missing') delete f.api.fullPackageCapabilities; if (mode === 'old') f.api.fullPackageCapabilities = async () => ({ version: 0 }); if (mode === 'error') f.api.fullPackageCapabilities = async () => { throw Error('old host'); }; await assert.rejects(runFullProjectPackage(f.args)); assert.equal(f.calls, 0); } });
test('native cancellation leaves current project unchanged', async () => { const f = fixture(); f.result = { canceled: true }; await runFullProjectPackage(f.args); assert.equal(f.opened, 0); assert.equal(f.retained, 0); });
test('declining switch retains the already restored file', async () => { const f = fixture(); f.args.confirmSwitch = () => false; await runFullProjectPackage(f.args); assert.equal(f.opened, 0); assert.equal(f.retained, 1); });
for (const [name, mutate] of Object.entries({
  nodesIdentity: f => { f.context.nodes = {}; }, canvasArray: f => { f.context.canvases = []; }, project: f => { f.context.identity = 'project-b'; },
  edit: f => { f.data.canvases[0].name = 'changed'; }, activeCanvas: f => { f.data.activeCanvasId = 'a'; },
})) test('late restore does not overwrite ' + name, async () => { const f = fixture(); f.api.restoreFullPackage = async () => { mutate(f); return f.result; }; await assert.rejects(runFullProjectPackage(f.args)); assert.equal(f.opened, 0); assert.equal(f.retained, 1); });
test('change during final confirmation also blocks switching', async () => { const f = fixture(); f.args.confirmSwitch = () => { f.context.nodes = {}; return true; }; await assert.rejects(runFullProjectPackage(f.args)); assert.equal(f.opened, 0); assert.equal(f.retained, 1); });
test('original open failure retains path and does not retry', async () => { const f = fixture(); f.args.openProject = () => false; await assert.rejects(runFullProjectPackage(f.args)); assert.equal(f.retained, 1); assert.equal(f.calls, 1); });
test('in-flight generation in current project blocks before host calls', async () => { const f = fixture(); f.data.canvases[0].nodes.push({ id: 'n', isGenerating: true }); await assert.rejects(runFullProjectPackage(f.args)); assert.equal(f.calls, 0); });
test('concurrent complete-project operations are rejected', async () => { const f = fixture(); let finish; f.api.restoreFullPackage = () => new Promise(r => { finish = r; }); const first = runFullProjectPackage(f.args); await Promise.resolve(); await assert.rejects(runFullProjectPackage(f.args), /正在/); finish({ canceled: true }); await first; });
test('context snapshot is detached from later edits', () => { const f = fixture(); const guard = createFullProjectContextGuard(() => f.context); f.data.canvases[0].nodes.push({ id: 'later' }); assert.equal(guard.snapshot.canvases[0].nodes.length, 0); assert.throws(guard.assertCurrent); });
test('system package handle forwards only the opaque value and restores all canvases', async () => {
  const f = fixture(), ticket = 'a'.repeat(48);
  f.args.externalPackageTicket = ticket;
  f.api.fullPackageCapabilities = async () => ({ version: 1, externalPackageTickets: 1 });
  f.api.restoreFullPackage = async payload => { f.calls++; f.request = payload; return f.result; };
  await runFullProjectPackage(f.args);
  assert.deepEqual(f.request, { operationId: undefined, externalPackageTicket: ticket });
  assert.equal(f.opened, 1);
  assert.equal(f.result.data.canvases.length, 2);
});
test('system package request refuses a pre-token host rather than silently using its native picker', async () => {
  const f = fixture(); f.args.externalPackageTicket = 'b'.repeat(48);
  await assert.rejects(runFullProjectPackage(f.args), /更新并重启/);
  assert.equal(f.calls, 0); assert.equal(f.opened, 0);
});
test('malformed or export-mode tickets fail before any host calls', async () => {
  for (const ticket of ['', 'fake', null, 123]) {
    const f = fixture(); f.args.externalPackageTicket = ticket;
    await assert.rejects(runFullProjectPackage(f.args), /凭据无效/);
    assert.equal(f.calls, 0);
  }
  const f = fixture(); f.args.externalPackageTicket = 'c'.repeat(48);
  await assert.rejects(runFullProjectPackage({ ...f.args, mode: 'export' }), /凭据无效/);
  assert.equal(f.calls, 0);
});
test('menu restore does not attach an OS ticket', async () => {
  const f = fixture(); f.api.restoreFullPackage = async payload => { assert.equal('externalPackageTicket' in payload, false); return f.result; };
  await runFullProjectPackage(f.args);
  assert.equal(f.opened, 1);
});
