import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createFullProjectPackageController } from './fullProjectPackageController.js';
import { createExternalPackageTickets } from './externalPackageTickets.js';
import { registerProjectIpcHandlers } from './ipc/projectIpc.js';
function fixture() {
  const f = { exported: 0, restored: 0, registered: 0, approved: true };
  f.context = { sender: {}, assertActive() {} };
  f.data = { canvases: [{ id: 'a', nodes: [], edges: [] }], activeCanvasId: 'a' };
  f.options = { dialog: { showMessageBox: async () => ({ response: f.approved ? 1 : 0 }), showSaveDialog: async () => ({ filePath: path.resolve('full.aicpkg') }), showOpenDialog: async () => ({ filePaths: [path.resolve('chosen.aicpkg')] }) },
    getMainWindow: () => ({}), getRoots: () => ({}), getProjectRoot: () => path.resolve('projects'), getTempRoot: () => path.resolve('temporary'), getDownloadsRoot: () => path.resolve('downloads'), readAppVersion: () => 'test', emitProgress() {},
    registerResult: result => { f.registered++; return { data: result.data }; },
    service: { exportFullProjectPackage: async args => { f.exported++; f.args = args; return { success: true, fullPackageVersion: 1 }; },
      restoreFullProjectPackage: async args => { f.restored++; f.args = args; if (!await args.confirm({ canvasCount: 1, nodeCount: 0, assetsCount: 0, totalBytes: 0 })) return { canceled: true }; return { success: true, projectPath: path.resolve('restored.aicanvas'), data: f.data, canvasCount: 1, assetsCount: 0 }; } } };
  return f;
}
test('full export requires native confirmation and forwards entire multiData', async () => { const f = fixture(), c = createFullProjectPackageController(f.options); await c.exportFullProjectPackage({ multiData: f.data }, f.context); assert.equal(f.exported, 1); assert.equal(f.args.multiData, f.data); });
test('native export decline does not call writer', async () => { const f = fixture(); f.approved = false; const c = createFullProjectPackageController(f.options); assert.equal((await c.exportFullProjectPackage({ multiData: f.data }, f.context)).canceled, true); assert.equal(f.exported, 0); });
test('restore ignores renderer-supplied filesystem path and uses native picker', async () => { const f = fixture(), c = createFullProjectPackageController(f.options); await c.restoreFullProjectPackage({ path: '/untrusted/path' }, f.context); assert.equal(f.args.packagePath, path.resolve('chosen.aicpkg')); assert.equal(f.registered, 1); });
test('restore confirmation decline does not register any project', async () => { const f = fixture(); f.approved = false; const c = createFullProjectPackageController(f.options); await c.restoreFullProjectPackage({}, f.context); assert.equal(f.registered, 0); });
test('recent-list failure returns retained project path, not false rollback', async () => { const f = fixture(); f.options.registerResult = () => { throw Error('recents unavailable'); }; const c = createFullProjectPackageController(f.options); const r = await c.restoreFullProjectPackage({}, f.context); assert.equal(r.success, true); assert.equal(r.fullPackageVersion, 1); assert.ok(r.projectPath); assert.match(r.recentRegistrationError, /recents/); });
test('main-window loss blocks before dialogs/service', async () => { const f = fixture(); f.context.assertActive = () => { throw Error('closed'); }; await assert.rejects(createFullProjectPackageController(f.options).restoreFullProjectPackage({}, f.context)); assert.equal(f.restored, 0); });
test('controller rejects concurrent full operations', async () => { const f = fixture(); let resolve; f.options.dialog.showOpenDialog = () => new Promise(r => { resolve = r; }); const c = createFullProjectPackageController(f.options); const first = c.restoreFullProjectPackage({}, f.context); await assert.rejects(c.restoreFullProjectPackage({}, f.context), /正在/); resolve({ canceled: true }); await first; });
test('closing sender during progress cannot throw from writer callback', async () => { const f = fixture(); f.options.service.exportFullProjectPackage = async args => { f.context.assertActive = () => { throw Error('closed'); }; assert.doesNotThrow(() => args.onProgress({})); return { success: true }; }; const c = createFullProjectPackageController(f.options); await c.exportFullProjectPackage({ multiData: f.data }, f.context); });
test('system handle restores the OS-selected package, never the renderer path or another native choice', async () => {
  const f = fixture(), tickets = createExternalPackageTickets(), file = path.resolve('os-selected.aicpkg');
  const request = tickets.issueRequest(file, 'open-file');
  f.options.consumeExternalPackageTicket = value => tickets.consume(value);
  f.options.dialog.showOpenDialog = () => { throw Error('unexpected picker'); };
  f.options.dialog.showMessageBox = async (_window, options) => { assert.ok(options.detail.includes(file)); return { response: 1 }; };
  const controller = createFullProjectPackageController(f.options);
  const result = await controller.restoreFullProjectPackage({ externalPackageTicket: request.externalPackageTicket, path: path.resolve('injected.aicpkg') }, f.context);
  assert.equal(result.success, true);
  assert.equal(f.args.packagePath, file);
  assert.equal(f.registered, 1);
  await assert.rejects(controller.restoreFullProjectPackage({ externalPackageTicket: request.externalPackageTicket }, f.context), /失效或已使用/);
});
test('forged or unsupported system handles fail without falling back to the native picker or old importer', async () => {
  const f = fixture(), tickets = createExternalPackageTickets();
  f.options.consumeExternalPackageTicket = value => tickets.consume(value);
  f.options.dialog.showOpenDialog = () => { throw Error('unexpected picker'); };
  const controller = createFullProjectPackageController(f.options);
  await assert.rejects(controller.restoreFullProjectPackage({ externalPackageTicket: 'forged', path: path.resolve('untrusted.aicpkg') }, f.context), /失效或已使用/);
  assert.equal(f.restored, 0);
  delete f.options.consumeExternalPackageTicket;
  await assert.rejects(createFullProjectPackageController(f.options).restoreFullProjectPackage({ externalPackageTicket: 'a'.repeat(48) }, f.context), /宿主未就绪/);
  assert.equal(f.restored, 0);
});
test('declining native disk confirmation spends the OS handle without registering a project', async () => {
  const f = fixture(), tickets = createExternalPackageTickets(), request = tickets.issueRequest(path.resolve('cancel.aicpkg'), 'startup');
  f.approved = false; f.options.consumeExternalPackageTicket = value => tickets.consume(value);
  const controller = createFullProjectPackageController(f.options);
  assert.equal((await controller.restoreFullProjectPackage({ externalPackageTicket: request.externalPackageTicket }, f.context)).canceled, true);
  assert.equal(f.registered, 0);
  await assert.rejects(controller.restoreFullProjectPackage({ externalPackageTicket: request.externalPackageTicket }, f.context), /失效或已使用/);
});
test('lost main frame before restore does not spend a system handle', async () => {
  const f = fixture(), tickets = createExternalPackageTickets(), file = path.resolve('frame-lost.aicpkg');
  const request = tickets.issueRequest(file, 'open-file');
  f.options.consumeExternalPackageTicket = value => tickets.consume(value);
  f.context.assertActive = () => { throw Error('closed'); };
  await assert.rejects(createFullProjectPackageController(f.options).restoreFullProjectPackage({ externalPackageTicket: request.externalPackageTicket }, f.context), /closed/);
  assert.equal(tickets.consume(request.externalPackageTicket), file);
  assert.equal(f.restored, 0);
});
function ipcFixture() {
  const handles = new Map(), frame = { url: 'app://main' }, webContents = { mainFrame: null }; webContents.mainFrame = frame;
  const main = { webContents, isDestroyed: () => false }, event = { sender: webContents, senderFrame: frame };
  registerProjectIpcHandlers({ ipcMain: { handle: (key, fn) => handles.set(key, fn), on() {} }, getNodeExportWindow: () => main, isNodeExportAppUrl: url => url === frame.url,
    exportFullProjectPackage: () => ({ success: true }), restoreFullProjectPackage: () => ({ success: true }) });
  return { handles, event };
}
test('new IPC advertises system handles only to main frame, and restore still checks sender', () => { const f = ipcFixture(); const capability = f.handles.get('project:fullPackageCapabilities')(f.event); assert.equal(capability.version, 1); assert.equal(capability.externalPackageTickets, 1); assert.throws(() => f.handles.get('project:restoreFullPackage')({ ...f.event, senderFrame: {} }, { externalPackageTicket: 'a'.repeat(48) })); });
test('original package IPC channels are retained alongside new strict channels', () => { const f = ipcFixture(); for (const key of ['project:exportPackage', 'project:importPackage', 'project:exportFullPackage', 'project:restoreFullPackage']) assert.ok(f.handles.has(key)); });
