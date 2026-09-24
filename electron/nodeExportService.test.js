import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import extract from 'extract-zip';
import {
  defaultNodeExportZipName,
  exportNodeItemsToZip,
  saveNodeMediaToFile,
  withNodeExportZipExtension,
} from './nodeExportService.js';

function tempRoot() {
  return mkdtempSync(path.join(tmpdir(), 'node-export-service-'));
}

test('zip name helpers keep a single extension', () => {
  assert.equal(withNodeExportZipExtension('bundle'), 'bundle.zip');
  assert.equal(withNodeExportZipExtension('bundle.ZIP'), 'bundle.ZIP');
  assert.equal(withNodeExportZipExtension('   '), '');
  assert.equal(
    defaultNodeExportZipName(new Date(2026, 8, 24, 5, 6, 7)),
    'AI-CanvasPro-Export-20260924-050607.zip',
  );
  assert.match(defaultNodeExportZipName(), /^AI-CanvasPro-Export-\d{8}-\d{6}\.zip$/);
});

test('exportNodeItemsToZip writes media, text and a manifest', async () => {
  const root = tempRoot();
  try {
    const imagePath = path.join(root, 'shot.png');
    writeFileSync(imagePath, Buffer.from([137, 80, 78, 71, 1, 2, 3]));
    const zipPath = path.join(root, 'bundle.zip');
    const result = await exportNodeItemsToZip({
      outputPath: zipPath,
      items: [
        { nodeId: 'n1', nodeName: 'Shot A', nodeType: 'image', kind: 'image', localPath: 'data/assets/shot.png' },
        { nodeId: 'n2', nodeName: 'Narration', nodeType: 'text', kind: 'text', text: 'hello world' },
      ],
      resolveLocalVirtualPath: (virtualPath) => (virtualPath === 'data/assets/shot.png' ? imagePath : ''),
      tempRoot: path.join(root, 'tmp'),
      now: new Date(0),
    });
    assert.equal(result.success, true);
    assert.equal(result.canceled, false);
    assert.equal(result.path, zipPath);
    assert.equal(result.filename, 'bundle.zip');
    assert.equal(result.exportedCount, 2);
    assert.deepEqual(result.counts, { text: 1, image: 1, video: 0, audio: 0 });
    assert.deepEqual(result.skipped, []);
    const unzipped = path.join(root, 'unzipped');
    await extract(zipPath, { dir: unzipped });
    assert.equal(
      readFileSync(path.join(unzipped, 'image', 'Shot A.png')).equals(Buffer.from([137, 80, 78, 71, 1, 2, 3])),
      true,
    );
    assert.equal(readFileSync(path.join(unzipped, 'Text', 'Narration.txt'), 'utf8'), 'hello world');
    const manifest = JSON.parse(readFileSync(path.join(unzipped, 'manifest.json'), 'utf8'));
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.packageKind, 'aiCanvas.nodeExport');
    assert.equal(manifest.exportedAt, '1970-01-01T00:00:00.000Z');
    assert.equal(manifest.exportedCount, 2);
    assert.deepEqual(manifest.items[0], {
      nodeId: 'n1',
      nodeName: 'Shot A',
      nodeType: 'image',
      kind: 'image',
      archivePath: 'image/Shot A.png',
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('exportNodeItemsToZip reports every skipped reason and refuses an empty bundle', async () => {
  const root = tempRoot();
  try {
    const result = await exportNodeItemsToZip({
      outputPath: path.join(root, 'empty.zip'),
      items: [
        { nodeId: 'a', kind: 'document', text: 'x' },
        { nodeId: 'b', kind: 'text', text: '   ' },
        { nodeId: 'c', kind: 'image' },
        { nodeId: 'd', kind: 'video', url: 'file:///C:/secret.mp4' },
        { nodeId: 'e', kind: 'image', localPath: 'data/assets/not-allowed.png' },
        { nodeId: 'f', kind: 'audio', localPath: 'data/assets/gone.mp3' },
      ],
      resolveLocalVirtualPath: (virtualPath) =>
        virtualPath === 'data/assets/gone.mp3' ? path.join(root, 'gone.mp3') : '',
    });
    assert.equal(result.success, false);
    assert.equal(result.code, 'NO_EXPORTABLE_ITEMS');
    assert.equal(result.exportedCount, 0);
    assert.deepEqual(result.counts, {});
    assert.deepEqual(
      result.skipped.map((entry) => entry.reason),
      [
        'UNSUPPORTED_KIND',
        'EMPTY_TEXT',
        'NO_MEDIA_SOURCE',
        'NO_MEDIA_SOURCE',
        'INVALID_LOCAL_PATH',
        'LOCAL_FILE_MISSING',
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('exportNodeItemsToZip keeps archive names unique per kind directory', async () => {
  const root = tempRoot();
  try {
    const first = path.join(root, 'first.png');
    const second = path.join(root, 'second.png');
    writeFileSync(first, Buffer.from([1]));
    writeFileSync(second, Buffer.from([2]));
    const result = await exportNodeItemsToZip({
      outputPath: path.join(root, 'names.zip'),
      items: [
        { nodeId: 'n1', kind: 'image', nodeName: 'Same', localPath: 'v/first.png' },
        { nodeId: 'n2', kind: 'image', nodeName: 'Same', localPath: 'v/second.png' },
        { nodeId: 'n3', kind: 'text', nodeName: 'Same', text: 'txt' },
      ],
      resolveLocalVirtualPath: (virtualPath) =>
        virtualPath === 'v/first.png' ? first : virtualPath === 'v/second.png' ? second : '',
    });
    assert.equal(result.success, true);
    assert.deepEqual(
      result.skipped,
      [],
    );
    const unzipped = path.join(root, 'names');
    await extract(result.path, { dir: unzipped });
    assert.equal(readFileSync(path.join(unzipped, 'image', 'Same.png')).equals(Buffer.from([1])), true);
    assert.equal(readFileSync(path.join(unzipped, 'image', 'Same (2).png')).equals(Buffer.from([2])), true);
    assert.equal(readFileSync(path.join(unzipped, 'Text', 'Same.txt'), 'utf8'), 'txt');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('exportNodeItemsToZip requires an absolute path and a resolver', async () => {
  await assert.rejects(
    () => exportNodeItemsToZip({ outputPath: 'relative/out.zip', items: [], resolveLocalVirtualPath: () => '' }),
    /must be absolute/,
  );
  await assert.rejects(
    () => exportNodeItemsToZip({ outputPath: path.join(tmpdir(), 'node-export-abs.zip'), items: [] }),
    /resolveLocalVirtualPath is required/,
  );
});

test('exportNodeItemsToZip downloads remote media and reports download failures', async () => {
  const root = tempRoot();
  try {
    const bytes = Buffer.from([9, 9, 9]);
    const fetched = [];
    const result = await exportNodeItemsToZip({
      outputPath: path.join(root, 'remote.zip'),
      items: [
        { nodeId: 'r1', kind: 'video', nodeName: 'Clip', url: 'https://cdn.example.com/a/clip.mp4' },
        { nodeId: 'r2', kind: 'audio', nodeName: 'Broken', url: 'https://cdn.example.com/a/broken.mp3' },
      ],
      resolveLocalVirtualPath: () => '',
      tempRoot: path.join(root, 'tmp'),
      fetchImpl: async (url) => {
        fetched.push(url);
        if (url.endsWith('broken.mp3')) return { ok: false, status: 502 };
        return { ok: true, status: 200, arrayBuffer: async () => bytes };
      },
    });
    assert.equal(fetched.length, 2);
    assert.equal(result.success, true);
    assert.equal(result.exportedCount, 1);
    assert.deepEqual(result.counts, { text: 0, image: 0, video: 1, audio: 0 });
    assert.equal(result.skipped.length, 1);
    assert.equal(result.skipped[0].reason, 'REMOTE_DOWNLOAD_FAILED');
    assert.match(result.skipped[0].detail, /HTTP 502/);
    const unzipped = path.join(root, 'remote');
    await extract(result.path, { dir: unzipped });
    assert.equal(readFileSync(path.join(unzipped, 'video', 'Clip.mp4')).equals(bytes), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveNodeMediaToFile copies local media and overwrites the chosen file', async () => {
  const root = tempRoot();
  try {
    const sourcePath = path.join(root, 'source.png');
    writeFileSync(sourcePath, Buffer.from([5, 4, 3, 2, 1]));
    const targetPath = path.join(root, 'nested', 'target.png');
    const result = await saveNodeMediaToFile({
      outputPath: targetPath,
      item: { kind: 'image', localPath: 'data/assets/source.png' },
      resolveLocalVirtualPath: () => sourcePath,
    });
    assert.deepEqual(result, {
      success: true,
      canceled: false,
      path: targetPath,
      filename: 'target.png',
      kind: 'image',
    });
    assert.equal(readFileSync(targetPath).equals(Buffer.from([5, 4, 3, 2, 1])), true);
    writeFileSync(targetPath, Buffer.from([7]));
    await saveNodeMediaToFile({
      outputPath: targetPath,
      item: { kind: 'image', localPath: 'data/assets/source.png' },
      resolveLocalVirtualPath: () => sourcePath,
    });
    assert.equal(readFileSync(targetPath).equals(Buffer.from([5, 4, 3, 2, 1])), true);
    // Saving onto the source itself is a no-op success.
    const inPlace = await saveNodeMediaToFile({
      outputPath: sourcePath,
      item: { kind: 'image', localPath: 'data/assets/source.png' },
      resolveLocalVirtualPath: () => sourcePath,
    });
    assert.equal(inPlace.success, true);
    assert.equal(readFileSync(sourcePath).equals(Buffer.from([5, 4, 3, 2, 1])), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveNodeMediaToFile rejects unsupported kinds, relative paths and blocked local paths', async () => {
  const root = tempRoot();
  try {
    await assert.rejects(
      () => saveNodeMediaToFile({ outputPath: path.join(root, 'a.txt'), item: { kind: 'text', localPath: 'v' }, resolveLocalVirtualPath: () => '' }),
      /Only media items can be saved/,
    );
    await assert.rejects(
      () => saveNodeMediaToFile({ outputPath: 'rel.png', item: { kind: 'image', localPath: 'v' }, resolveLocalVirtualPath: () => '' }),
      /must be absolute/,
    );
    await assert.rejects(
      () => saveNodeMediaToFile({ outputPath: path.join(root, 'b.png'), item: { kind: 'image', localPath: 'v' }, resolveLocalVirtualPath: () => '' }),
      /not allowed/,
    );
    await assert.rejects(
      () => saveNodeMediaToFile({ outputPath: path.join(root, 'c.png'), item: { kind: 'image' }, resolveLocalVirtualPath: () => '' }),
      /Media source is required/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('saveNodeMediaToFile streams remote media through the injected fetch', async () => {
  const root = tempRoot();
  try {
    const targetPath = path.join(root, 'remote.mp4');
    const result = await saveNodeMediaToFile({
      outputPath: targetPath,
      item: { kind: 'video', url: 'http://cdn.example.com/clip.mp4' },
      resolveLocalVirtualPath: () => '',
      fetchImpl: async () => ({ ok: true, status: 200, arrayBuffer: async () => Buffer.from([1, 2]) }),
    });
    assert.equal(result.success, true);
    assert.equal(result.kind, 'video');
    assert.equal(readFileSync(targetPath).equals(Buffer.from([1, 2])), true);
    await assert.rejects(
      () => saveNodeMediaToFile({
        outputPath: path.join(root, 'fail.mp4'),
        item: { kind: 'video', url: 'https://cdn.example.com/clip.mp4' },
        resolveLocalVirtualPath: () => '',
        fetchImpl: async () => ({ ok: false, status: 503 }),
      }),
      /HTTP 503/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
