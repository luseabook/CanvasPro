import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createNodeExportController } from './nodeExportController.js';

function tempRoot() {
  return mkdtempSync(path.join(tmpdir(), 'node-export-controller-'));
}
function stubApp(paths) {
  return {
    getPath: (key) => {
      if (!(key in paths)) throw new Error(`unexpected path key ${key}`);
      return paths[key];
    },
  };
}
function buildController(root, overrides = {}) {
  return createNodeExportController({
    app: stubApp({ downloads: root, temp: root, userData: root }),
    dialog: {},
    getMainWindow: () => null,
    resolveLocalVirtualPath: () => '',
    showSaveDialog: async () => ({ canceled: true }),
    showOpenDialog: async () => ({ canceled: true }),
    openPath: async () => '',
    ...overrides,
  });
}

test('exportSelectedNodesPackage writes an explicit output path and a remembered directory', async () => {
  const root = tempRoot();
  try {
    const sourcePath = path.join(root, 'a.png');
    writeFileSync(sourcePath, Buffer.from([1, 2, 3]));
    const controller = buildController(root, {
      resolveLocalVirtualPath: (virtualPath) => (virtualPath === 'data/assets/a.png' ? sourcePath : ''),
    });
    const explicit = await controller.exportSelectedNodesPackage({
      outputPath: path.join(root, 'pkg'),
      items: [{ nodeId: 'n1', kind: 'image', nodeName: 'A', localPath: 'data/assets/a.png' }],
    });
    assert.equal(explicit.success, true);
    assert.equal(explicit.path, path.join(root, 'pkg.zip'));
    assert.equal(statSync(explicit.path).isFile(), true);
    assert.equal(explicit.exportedCount, 1);

    const outputDir = path.join(root, 'out');
    const remembered = await controller.exportSelectedNodesPackage({
      directory: outputDir,
      filename: 'My Bundle',
      items: [{ kind: 'text', nodeName: 'T', text: 'hi' }],
    });
    assert.equal(remembered.path, path.join(outputDir, 'My Bundle.zip'));
    assert.equal(statSync(remembered.path).isFile(), true);

    await assert.rejects(
      () => controller.exportSelectedNodesPackage({ directory: outputDir, filename: 'a/b', items: [] }),
      /path separators/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('exportSelectedNodesPackage falls back to the native save dialog and honours cancel', async () => {
  const root = tempRoot();
  try {
    const seen = [];
    const cancelling = buildController(root, {
      showSaveDialog: async (options) => (seen.push(options), { canceled: true }),
    });
    assert.deepEqual(await cancelling.exportSelectedNodesPackage({ items: [] }), {
      success: false,
      canceled: true,
    });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].title, '批量下载节点');
    assert.equal(seen[0].filters[0].extensions[0], 'zip');
    assert.equal(path.dirname(seen[0].defaultPath), root);
    assert.match(path.basename(seen[0].defaultPath), /^Canvas-Export-\d{8}-\d{6}\.zip$/);

    const chosen = buildController(root, {
      showSaveDialog: async () => ({ canceled: false, filePath: path.join(root, 'picked') }),
    });
    const result = await chosen.exportSelectedNodesPackage({
      items: [{ kind: 'text', nodeName: 'T', text: 'hi' }],
    });
    assert.equal(result.success, true);
    assert.equal(result.path, path.join(root, 'picked.zip'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveTextFile writes UTF-8 content and enforces the size limit', async () => {
  const root = tempRoot();
  try {
    let captured = null;
    const controller = buildController(root, {
      showSaveDialog: async (options) => (captured = options, { canceled: false, filePath: path.join(root, 'notes') }),
    });
    const result = await controller.saveTextFile({ filename: 'notes.md', content: '# hi' });
    assert.deepEqual(result, {
      success: true,
      canceled: false,
      path: path.join(root, 'notes.md'),
      filename: 'notes.md',
    });
    assert.equal(readFileSync(result.path, 'utf8'), '# hi');
    assert.equal(captured.filters[0].extensions[0], 'md');
    assert.equal(captured.title, '保存文件');
    assert.equal(path.basename(captured.defaultPath), 'notes.md');

    await assert.rejects(
      () => controller.saveTextFile({ content: 'x'.repeat(16 * 1024 * 1024 + 1) }),
      /16 MB limit/,
    );

    const cancelling = buildController(root);
    assert.deepEqual(await cancelling.saveTextFile({ content: 'x' }), {
      success: false,
      canceled: true,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveMediaFile copies a node asset and remembers the export directory', async () => {
  const root = tempRoot();
  try {
    const sourcePath = path.join(root, 'src.png');
    writeFileSync(sourcePath, Buffer.from([7, 7, 7]));
    let captured = null;
    const controller = buildController(root, {
      resolveLocalVirtualPath: (virtualPath) => (virtualPath === 'data/assets/src.png' ? sourcePath : ''),
      showSaveDialog: async (options) => (captured = options, { canceled: false, filePath: path.join(root, 'Saved Shot') }),
    });
    const result = await controller.saveMediaFile({
      kind: 'image',
      filename: 'My Shot',
      localPath: 'data/assets/src.png',
    });
    assert.equal(result.success, true);
    assert.equal(result.path, path.join(root, 'Saved Shot.png'));
    assert.equal(captured.title, '保存图片');
    assert.equal(path.basename(captured.defaultPath), 'My Shot.png');
    assert.equal(readFileSync(result.path).equals(Buffer.from([7, 7, 7])), true);
    assert.deepEqual(
      JSON.parse(readFileSync(path.join(root, 'node-export-state.json'), 'utf8')),
      { lastMediaExportDirectory: root },
    );

    await assert.rejects(() => controller.saveMediaFile({ kind: 'text' }), /Unsupported media kind/);
    // A supported kind without any source is still rejected by the service, not silently saved.
    await assert.rejects(() => controller.saveMediaFile({ kind: 'audio' }), /Media source is required/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveMediaFiles deduplicates names in a directory and reports dialogs and cancels', async () => {
  const root = tempRoot();
  try {
    const sourcePath = path.join(root, 'clip.mp4');
    writeFileSync(sourcePath, Buffer.from([4, 4]));
    const controller = buildController(root, {
      resolveLocalVirtualPath: (virtualPath) => (virtualPath === 'v/clip.mp4' ? sourcePath : ''),
    });
    const targetDir = path.join(root, 'targets');
    const saved = await controller.saveMediaFiles({
      directory: targetDir,
      files: [
        { kind: 'video', filename: 'Same', localPath: 'v/clip.mp4' },
        { kind: 'video', filename: 'Same', localPath: 'v/clip.mp4' },
      ],
    });
    assert.equal(saved.success, true);
    assert.equal(saved.canceled, false);
    assert.equal(saved.directory, targetDir);
    assert.equal(saved.count, 2);
    assert.equal(path.basename(saved.files[0].path), 'Same.mp4');
    assert.equal(path.basename(saved.files[1].path), 'Same (2).mp4');

    await assert.rejects(() => controller.saveMediaFiles({ files: [] }), /Media files are required/);
    await assert.rejects(
      () => controller.saveMediaFiles({ directory: targetDir, files: [{ kind: 'text', localPath: 'v/a' }] }),
      /Unsupported media kind/,
    );

    const cancelling = buildController(root);
    assert.deepEqual(
      await cancelling.saveMediaFiles({ files: [{ kind: 'image', localPath: 'v/a' }] }),
      { success: false, canceled: true, count: 0, files: [] },
    );

    const seen = [];
    const choosing = buildController(root, {
      resolveLocalVirtualPath: () => sourcePath,
      showOpenDialog: async (options) => (seen.push(options), { canceled: false, filePaths: [targetDir] }),
    });
    const chosen = await choosing.saveMediaFiles({ files: [{ kind: 'image', localPath: 'v/clip.mp4' }] });
    assert.equal(chosen.success, true);
    assert.deepEqual(seen[0].properties, ['openDirectory', 'createDirectory']);
    assert.equal(seen[0].title, '选择保存目录');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the remembered export directory is reused by a freshly created controller', async () => {
  const root = tempRoot();
  try {
    const rememberedDir = path.join(root, 'chosen');
    const first = buildController(root, {
      resolveLocalVirtualPath: () => path.join(root, 'x.png'),
    });
    writeFileSync(path.join(root, 'x.png'), Buffer.from([1]));
    await first.saveMediaFiles({
      directory: rememberedDir,
      files: [{ kind: 'image', filename: 'x', localPath: 'v/x.png' }],
    });

    const seen = [];
    const second = buildController(root, {
      showOpenDialog: async (options) => (seen.push(options), { canceled: true }),
    });
    await second.saveMediaFiles({ files: [{ kind: 'image', localPath: 'v/x.png' }] });
    assert.equal(seen[0].defaultPath, rememberedDir);

    // A malformed state file must fall back instead of failing the export.
    writeFileSync(path.join(root, 'node-export-state.json'), JSON.stringify({ lastMediaExportDirectory: 'relative/dir' }));
    const third = buildController(root, {
      showOpenDialog: async (options) => (seen.push(options), { canceled: true }),
    });
    await third.saveMediaFiles({ files: [{ kind: 'image', localPath: 'v/x.png' }] });
    assert.equal(seen[1].defaultPath, root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveTimeline is wired to the timeline exporter and never invents a partial export', async () => {
  const root = tempRoot();
  try {
    const sourcePath = path.join(root, 'clip.mp4');
    writeFileSync(sourcePath, Buffer.from([1, 2, 3]));
    const openSeen = [];
    const controller = buildController(root, {
      dialog: { showMessageBox: async () => ({ response: 1 }) },
      resolveLocalVirtualPath: (virtualPath) => (virtualPath === 'output/clip.mp4' ? sourcePath : ''),
      getNodeExportRoots: () => ({ 'output/': root }),
      showOpenDialog: async (options) => (openSeen.push(options), { canceled: true }),
    });
    const invalid = await controller.saveTimeline({});
    assert.equal(invalid.status, 'failed');
    assert.match(invalid.error, /1–32 个本地视频节点/);
    assert.deepEqual(invalid.results, []);
    assert.equal(invalid.directory, '');

    // No usable ffprobe here: the run must fail before any directory is chosen or written.
    const unprobed = await controller.saveTimeline({
      includeAudio: false,
      clips: [{ nodeId: 'n1', name: 'clip', kind: 'video', localPath: 'output/clip.mp4', startSec: 0, endSec: 1 }],
    });
    assert.equal(unprobed.status, 'failed');
    assert.equal(unprobed.directory, '');
    assert.deepEqual(openSeen, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createNodeExportController exposes the openJianying operation', () => {
  const controller = buildController(tmpdir());
  assert.equal(typeof controller.exportSelectedNodesPackage, 'function');
  assert.equal(typeof controller.saveMediaFile, 'function');
  assert.equal(typeof controller.saveTextFile, 'function');
  assert.equal(typeof controller.saveMediaFiles, 'function');
  assert.equal(typeof controller.saveTimeline, 'function');
  assert.equal(typeof controller.openJianying, 'function');
});
