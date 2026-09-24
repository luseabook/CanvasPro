import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildProjectOpenResponse,
  createProjectCapabilityOperations,
} from './projectCapabilityOperations.js';

const PROJECT_DOCUMENT = {
  canvases: [{ id: 'canvas_1', nodes: [], edges: [] }],
  activeCanvasId: 'canvas_1',
};

function createHarness(overrides = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'project-capability-')),
    canvasDir = path.join(root, 'projects'),
    recentStorePath = path.join(root, 'recent-projects.json'),
    snapshotPath = path.join(root, 'recovery-snapshot.json'),
    events = [],
    removedSnapshots = [],
    pendingExternalProjectOpenRequests = [],
    state = {
      syncCalls: 0,
      openDialogResult: { canceled: true, filePaths: [] },
      saveDialogResult: { canceled: true, filePath: '' },
      openDialogs: [],
      saveDialogs: [],
      readSnapshotResult: null,
      readSnapshotThrows: false,
      writeSnapshotThrows: false,
      removeSnapshotThrows: false,
      infoResult: { exists: false, isNewerThanProject: false, savedAt: 0, currentLastModified: 0 },
      exported: [],
      imported: [],
    };
  const operations = createProjectCapabilityOperations({
    exportDesktopProjectPackage: (payload, context) => {
      state.exported.push({ payload, context });
      return { success: true, exported: true };
    },
    importDesktopProjectPackage: (payload, context) => {
      state.imported.push({ payload, context });
      return { success: true, imported: true };
    },
    handleRendererUnsavedState: (payload) => ({ success: true, unsaved: payload }),
    getRecentProjectsStorePath: () => recentStorePath,
    syncSystemRecentDocumentsBestEffort: () => {
      state.syncCalls += 1;
    },
    pendingExternalProjectOpenRequests: pendingExternalProjectOpenRequests,
    getCanvasProjectDir: () => canvasDir,
    showOpenDialog: async (options) => {
      state.openDialogs.push(options);
      return state.openDialogResult;
    },
    showSaveDialog: async (options) => {
      state.saveDialogs.push(options);
      return state.saveDialogResult;
    },
    getRecoverySnapshotPath: () => snapshotPath,
    writeRecoverySnapshotFile: () => {
      if (state.writeSnapshotThrows) throw new Error('RECOVERY_SNAPSHOT_PROTECTED');
      return { savedAt: 1234, projectId: 'proj-1', projectName: '工程一' };
    },
    getRecoverySnapshotFileInfo: async () => state.infoResult,
    readRecoverySnapshotFile: async () => {
      if (state.readSnapshotThrows) throw new Error('snapshot read failed');
      return state.readSnapshotResult;
    },
    removeRecoverySnapshotFile: (snapshotFile) => {
      if (state.removeSnapshotThrows) throw new Error('RECOVERY_SNAPSHOT_PROTECTED');
      removedSnapshots.push(snapshotFile);
    },
    logDiagnosticEvent: (event) => events.push(event),
    ...overrides,
  });
  return {
    operations,
    state,
    events,
    removedSnapshots,
    pendingExternalProjectOpenRequests,
    canvasDir,
    recentStorePath,
    snapshotPath,
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function writeProjectFile(projectPath) {
  return writeFileSync(projectPath, JSON.stringify(PROJECT_DOCUMENT), 'utf8');
}
void writeProjectFile;

test('buildProjectOpenResponse prefers the recent record and derives identifiers', async () => {
  const response = buildProjectOpenResponse(
    'C:\\projects\\demo.aicanvas',
    { canvases: PROJECT_DOCUMENT.canvases },
    {
      filename: 'demo.aicanvas',
      name: '演示',
      recentId: 'r1',
      displayPath: 'C:\\projects\\demo.aicanvas',
      lastModified: 55,
    },
  );
  assert.equal(response.success, true);
  assert.equal(response.projectId, 'demo');
  assert.equal(response.projectName, '演示');
  assert.equal(response.filename, 'demo.aicanvas');
  assert.equal(response.recentId, 'r1');
  assert.equal(response.lastModified, 55);
});

test('buildProjectOpenResponse falls back to the path when no recent record exists', () => {
  const response = buildProjectOpenResponse('C:\\projects\\blank.aicproj', { nodes: [] }, null);
  assert.equal(response.projectId, 'blank');
  assert.equal(response.filename, 'blank.aicproj');
  assert.equal(response.displayPath, 'C:\\projects\\blank.aicproj');
  assert.equal(response.recentId, '');
  assert.equal(response.lastModified, 0);
});

test('openPath reads the project, records it as recent and syncs system recents', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const { writeProjectJson, findRecentProject } = await import(
    '../src/services/desktopProjectFileStore.js'
  );
  const projectPath = path.join(h.canvasDir, 'opened.aicanvas');
  writeProjectJson(projectPath, PROJECT_DOCUMENT);

  const result = await h.operations.openPath(projectPath, { source: 'recent' });

  assert.equal(result.success, true);
  assert.equal(result.source, 'recent');
  assert.equal(result.projectId, 'opened');
  assert.deepEqual(result.data.canvases, PROJECT_DOCUMENT.canvases);
  assert.equal(h.state.syncCalls, 1);
  const recent = findRecentProject(h.recentStorePath, result.recentId);
  assert.ok(recent, 'recent entry should exist');
  assert.equal(recent.path, projectPath);
});

test('open with a missing recent id is rejected', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  await assert.rejects(() => h.operations.open({ recentId: 'nope' }), /最近项目不存在/);
});

test('open with a deleted recent project file is rejected', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const { writeProjectJson } = await import('../src/services/desktopProjectFileStore.js');
  const projectPath = path.join(h.canvasDir, 'gone.aicanvas');
  writeProjectJson(projectPath, PROJECT_DOCUMENT);
  const opened = await h.operations.openPath(projectPath);
  rmSync(projectPath);

  await assert.rejects(() => h.operations.open({ recentId: opened.recentId }), /最近项目文件不存在/);
});

test('open without a recent id asks for a file and honours cancellation', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const result = await h.operations.open({});
  assert.deepEqual(result, { success: false, canceled: true });
  assert.equal(h.state.openDialogs.length, 1);
  assert.deepEqual(h.state.openDialogs[0].properties, ['openFile']);
  assert.equal(h.state.openDialogs[0].defaultPath, h.canvasDir);
});

test('open without a recent id opens the chosen file with the dialog source', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const { writeProjectJson } = await import('../src/services/desktopProjectFileStore.js');
  const projectPath = path.join(h.canvasDir, 'picked.aicanvas');
  writeProjectJson(projectPath, PROJECT_DOCUMENT);
  h.state.openDialogResult = { canceled: false, filePaths: [projectPath] };

  const result = await h.operations.open({});
  assert.equal(result.success, true);
  assert.equal(result.source, 'dialog');
  assert.equal(result.projectId, 'picked');
});

test('save in plain mode reuses the recent path and records the project', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const { writeProjectJson } = await import('../src/services/desktopProjectFileStore.js');
  const projectPath = path.join(h.canvasDir, 'saved.aicanvas');
  writeProjectJson(projectPath, { nodes: [{ id: 'n1' }], edges: [] });
  const opened = await h.operations.openPath(projectPath);

  const result = await h.operations.save({
    mode: 'save',
    recentId: opened.recentId,
    projectName: '保存工程',
    multiData: PROJECT_DOCUMENT,
  });

  assert.equal(result.success, true);
  assert.equal(result.projectId, 'saved');
  assert.equal(result.filename, 'saved.aicanvas');
  assert.equal(result.recentId, opened.recentId);
  assert.equal(h.state.saveDialogs.length, 0);
  assert.deepEqual(JSON.parse(readFileSync(projectPath, 'utf8')).canvases, PROJECT_DOCUMENT.canvases);
});

test('save in plain mode without a recent id writes into the canvas directory', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const result = await h.operations.save({
    mode: 'save',
    projectName: '新工程',
    multiData: PROJECT_DOCUMENT,
  });
  assert.equal(result.success, true);
  assert.equal(result.filename, '新工程.aicanvas');
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(h.canvasDir, '新工程.aicanvas'), 'utf8')).canvases,
    PROJECT_DOCUMENT.canvases,
  );
});

test('save as honours cancellation and appends the project extension otherwise', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const canceled = await h.operations.save({ mode: 'saveAs', multiData: PROJECT_DOCUMENT });
  assert.deepEqual(canceled, { success: false, canceled: true });
  assert.equal(h.state.saveDialogs.length, 1);

  const chosen = path.join(h.root, 'exported-project');
  h.state.saveDialogResult = { canceled: false, filePath: chosen };
  const saved = await h.operations.save({ mode: 'saveAs', multiData: PROJECT_DOCUMENT });
  assert.equal(saved.success, true);
  assert.equal(saved.filename, 'exported-project.aicanvas');
  assert.deepEqual(
    JSON.parse(readFileSync(chosen + '.aicanvas', 'utf8')).canvases,
    PROJECT_DOCUMENT.canvases,
  );
});

test('listRecent and removeRecent operate on the recent store', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const { writeProjectJson } = await import('../src/services/desktopProjectFileStore.js');
  const first = path.join(h.canvasDir, 'first.aicanvas'),
    second = path.join(h.canvasDir, 'second.aicanvas');
  writeProjectJson(first, PROJECT_DOCUMENT);
  writeProjectJson(second, PROJECT_DOCUMENT);
  const firstOpen = await h.operations.openPath(first);
  await h.operations.openPath(second);

  const listed = h.operations.listRecent();
  assert.equal(listed.length, 2);

  const remaining = await h.operations.removeRecent({ recentId: firstOpen.recentId });
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].filename, 'second.aicanvas');
});

test('setUnsavedState and consumeExternalOpenRequests forward their payloads', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const unsaved = h.operations.setUnsavedState({ hasUnsavedChanges: true });
  assert.deepEqual(unsaved, { success: true, unsaved: { hasUnsavedChanges: true } });

  h.pendingExternalProjectOpenRequests.push({ path: 'C:\\a.aicanvas' }, { path: 'C:\\b.aicanvas' });
  assert.equal(h.operations.consumeExternalOpenRequests().length, 2);
  assert.equal(h.operations.consumeExternalOpenRequests().length, 0);
});

test('exportPackage and importPackage forward payload and operation context', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const progress = () => {};
  await h.operations.exportPackage({ projectName: 'P' }, { onProgress: progress });
  await h.operations.importPackage({ packagePath: 'x.aicpkg' }, { onProgress: progress });
  assert.equal(h.state.exported.length, 1);
  assert.equal(h.state.exported[0].payload.projectName, 'P');
  assert.equal(h.state.exported[0].context.onProgress, progress);
  assert.equal(h.state.imported[0].payload.packagePath, 'x.aicpkg');
});

test('writeRecoverySnapshot reports success and surfaces protection errors', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const ok = h.operations.writeRecoverySnapshot({ projectId: 'proj-1' });
  assert.deepEqual(ok, { success: true, savedAt: 1234, projectId: 'proj-1', projectName: '工程一' });

  h.state.writeSnapshotThrows = true;
  const blocked = h.operations.writeRecoverySnapshot({ projectId: 'proj-2' });
  assert.equal(blocked.success, false);
  assert.match(blocked.error, /RECOVERY_SNAPSHOT_PROTECTED/);
});

test('readRecoverySnapshot returns the snapshot payload or an explicit absence', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  assert.deepEqual(await h.operations.readRecoverySnapshot(), {
    success: false,
    exists: false,
    canceled: false,
  });

  h.state.readSnapshotResult = {
    projectId: 'proj-1',
    projectName: '工程一',
    filename: 'a.aicanvas',
    recentId: 'r1',
    displayPath: 'C:\\a.aicanvas',
    lastKnownProjectLastModified: 99,
    savedAt: 1234,
    data: PROJECT_DOCUMENT,
  };
  const snapshot = await h.operations.readRecoverySnapshot();
  assert.equal(snapshot.success, true);
  assert.equal(snapshot.exists, true);
  assert.equal(snapshot.recovery, true);
  assert.equal(snapshot.lastModified, 99);
  assert.equal(snapshot.recoverySavedAt, 1234);
  assert.deepEqual(snapshot.data, PROJECT_DOCUMENT);
});

test('readRecoverySnapshot turns read failures into an error result', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  h.state.readSnapshotThrows = true;
  const result = await h.operations.readRecoverySnapshot();
  assert.equal(result.success, false);
  assert.equal(result.exists, false);
  assert.match(result.error, /snapshot read failed/);
});

test('getRecoverySnapshotInfo forwards the computed timestamp and degrades on failure', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const info = await h.operations.getRecoverySnapshotInfo({ lastModified: 42 });
  assert.deepEqual(info, { exists: false, isNewerThanProject: false, savedAt: 0, currentLastModified: 0 });

  h.state.readSnapshotThrows = true;
  const failed = await h.operations.getRecoverySnapshotInfo({});
  assert.equal(failed.exists, false);
  assert.match(failed.error, /snapshot read failed/);
});

test('clearRecoverySnapshot removes the snapshot and surfaces protected failures', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  assert.deepEqual(h.operations.clearRecoverySnapshot(), { success: true });
  assert.deepEqual(h.removedSnapshots, [h.snapshotPath]);

  h.state.removeSnapshotThrows = true;
  const blocked = h.operations.clearRecoverySnapshot();
  assert.equal(blocked.success, false);
  assert.match(blocked.error, /RECOVERY_SNAPSHOT_PROTECTED/);
});

test('open and save emit diagnostic operation events with canvas counts', async (t) => {
  const h = createHarness();
  t.after(h.cleanup);
  const result = await h.operations.save({
    mode: 'save',
    projectName: 'diag',
    multiData: PROJECT_DOCUMENT,
  });
  assert.equal(result.success, true);

  const types = h.events.map((event) => event.type);
  assert.deepEqual(types, ['project.desktop_save.started', 'project.desktop_save.succeeded']);
  assert.equal(h.events[1].context.canvasCount, 1);
  assert.equal(h.events[1].context.mode, 'save');
  assert.equal(h.events[1].source, 'main');
});

test('the operations object is frozen and exposes the bridge contract', () => {
  const h = createHarness();
  assert.ok(Object.isFrozen(h.operations));
  for (const name of [
    'open',
    'save',
    'openPath',
    'exportPackage',
    'importPackage',
    'setUnsavedState',
    'listRecent',
    'removeRecent',
    'consumeExternalOpenRequests',
    'writeRecoverySnapshot',
    'getRecoverySnapshotInfo',
    'readRecoverySnapshot',
    'clearRecoverySnapshot',
  ])
    assert.equal(typeof h.operations[name], 'function', name + ' should be a function');
  h.cleanup();
});
