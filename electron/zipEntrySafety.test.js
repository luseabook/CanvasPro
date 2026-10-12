// Offline tests for the ZIP pre-flight validator used before extract-zip unpacks
// untrusted archives. No network or Electron process is involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWriteStream, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import yazl from 'yazl';

import {
  assertSafeZipArchive,
  assertSafeZipEntries,
  readZipEntryMetadata,
} from './zipEntrySafety.js';

function entry(fileName, overrides = {}) {
  return {
    fileName: fileName,
    externalFileAttributes: 0,
    generalPurposeBitFlag: 0,
    uncompressedSize: 1,
    ...overrides,
  };
}

test('accepts a set of plain relative entries', () => {
  assert.doesNotThrow(() =>
    assertSafeZipEntries([entry('python/python.exe'), entry('python/Lib/site.py'), entry('README.txt')])
  );
});

test('rejects path traversal, absolute, UNC and backslash names', () => {
  for (const name of ['../evil', 'a/../../evil', '/etc/passwd', 'C:/win', '//host/share', 'a\\b', '']) {
    assert.throws(() => assertSafeZipEntries([entry(name)]), /不安全的条目路径/, name);
  }
});

test('rejects reserved Windows device names', () => {
  assert.throws(() => assertSafeZipEntries([entry('con.txt')]), /不安全的条目路径/);
  assert.throws(() => assertSafeZipEntries([entry('python/LPT1.ini')]), /不安全的条目路径/);
});

test('rejects symlink and other non-regular entries', () => {
  const symlink = entry('link', { externalFileAttributes: 0o120000 << 16 });
  assert.throws(() => assertSafeZipEntries([symlink]), /链接或特殊文件/);
});

test('rejects encrypted entries', () => {
  assert.throws(() => assertSafeZipEntries([entry('a.txt', { generalPurposeBitFlag: 1 })]), /加密条目/);
});

test('rejects duplicate paths that only differ by case', () => {
  assert.throws(() => assertSafeZipEntries([entry('A.txt'), entry('a.txt')]), /重复路径/);
});

test('enforces entry-count and size limits', () => {
  assert.throws(
    () => assertSafeZipEntries([entry('a'), entry('b')], { maxEntries: 1 }),
    /条目数量超限/
  );
  assert.throws(
    () => assertSafeZipEntries([entry('a', { uncompressedSize: 10 })], { maxEntryBytes: 5 }),
    /声明大小无效或超限/
  );
  assert.throws(
    () => assertSafeZipEntries([entry('a', { uncompressedSize: 10 })], { maxTotalBytes: 5 }),
    /解压总量超限/
  );
});

test('reads metadata from a real archive and passes it through the validator', async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'zip-entry-safety-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const archivePath = path.join(dir, 'pkg.zip');
  const zip = new yazl.ZipFile();
  zip.addBuffer(Buffer.from('hello'), 'python/python.exe');
  zip.addBuffer(Buffer.from('x'), 'python/Lib/site.py');
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(archivePath);
    zip.once('error', reject);
    stream.once('error', reject);
    stream.once('close', resolve);
    zip.outputStream.pipe(stream);
    zip.end();
  });

  const entries = await readZipEntryMetadata(archivePath);
  assert.deepEqual(
    entries.map((item) => item.fileName).sort(),
    ['python/Lib/site.py', 'python/python.exe']
  );
  const result = await assertSafeZipArchive(archivePath);
  assert.equal(result.files.size, 2);
  assert.ok(result.totalBytes >= 6);
});
