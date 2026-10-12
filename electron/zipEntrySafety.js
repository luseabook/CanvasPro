// Pre-flight validation for ZIP archives that are about to be extracted with
// `extract-zip`.
//
// `extract-zip@2.0.1` has no fixed release for its symlink path-traversal advisory
// (GHSA-jmr9-qjv8-65gv / GHSA-7pqw-9j4j-h8q3). Instead of removing the dependency we
// validate every entry *before* extraction and always unpack into a fresh, empty
// directory, so the extractor has no pre-existing symlink to follow and no archive
// entry can escape the destination.
//
// ponytail: this is a pre-flight assertion, not a sandbox. Ceiling: extraction itself
// is still performed by `extract-zip`. Upgrade path: hand the validated entry list to
// a streaming yauzl writer (the pattern `fullProjectPackageService.js` already uses)
// if the dependency is ever dropped.
import { createRequire } from 'node:module';

// Reuse the yauzl copy that `extract-zip` already resolves; no new npm dependency.
const require = createRequire(import.meta.url);
const yauzl = require('yauzl');

export const DEFAULT_ZIP_LIMITS = Object.freeze({
  maxEntries: 50000,
  maxEntryBytes: 4 * 1024 * 1024 * 1024,
  maxTotalBytes: 16 * 1024 * 1024 * 1024,
});

const WINDOWS_RESERVED = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  ...Array.from({ length: 9 }, (_, index) => `com${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `lpt${index + 1}`),
]);

function isUnsafeName(name) {
  if (typeof name !== 'string' || !name || name.includes('\u0000')) return true;
  // Absolute paths, UNC paths, drive letters and backslash separators never map to a
  // relative destination inside the extract dir.
  if (name.startsWith('/') || name.startsWith('\\') || /^[a-zA-Z]:/.test(name)) return true;
  if (name.includes('\\')) return true;
  const segments = name.split('/');
  if (segments[segments.length - 1] === '') segments.pop();
  if (!segments.length) return true;
  for (const segment of segments) {
    if (!segment || segment === '.' || segment === '..') return true;
    if (WINDOWS_RESERVED.has(segment.split('.')[0].toLowerCase())) return true;
  }
  return false;
}

// Pure so it can be unit-tested without crafting archive bytes on disk.
export function assertSafeZipEntries(entries, limits = DEFAULT_ZIP_LIMITS) {
  const maxEntries = limits.maxEntries ?? DEFAULT_ZIP_LIMITS.maxEntries;
  const maxEntryBytes = limits.maxEntryBytes ?? DEFAULT_ZIP_LIMITS.maxEntryBytes;
  const maxTotalBytes = limits.maxTotalBytes ?? DEFAULT_ZIP_LIMITS.maxTotalBytes;
  if (!Array.isArray(entries)) throw new Error('ZIP 条目列表无效');
  if (entries.length > maxEntries) throw new Error('ZIP 条目数量超限');
  const seen = new Set();
  let total = 0;
  for (const entry of entries) {
    const name = entry?.fileName;
    if (isUnsafeName(name)) throw new Error('ZIP 包含不安全的条目路径：' + String(name));
    const mode = ((entry.externalFileAttributes ?? 0) >>> 16) & 0o170000;
    if (mode && mode !== 0o100000 && mode !== 0o040000) {
      throw new Error('ZIP 不允许链接或特殊文件：' + name);
    }
    if (entry.generalPurposeBitFlag & 1) throw new Error('ZIP 不支持加密条目：' + name);
    const size = entry.uncompressedSize;
    if (!Number.isSafeInteger(size) || size < 0 || size > maxEntryBytes) {
      throw new Error('ZIP 条目声明大小无效或超限：' + name);
    }
    const folded = name.normalize('NFC').toLowerCase();
    if (seen.has(folded)) throw new Error('ZIP 存在重复路径或大小写冲突：' + name);
    seen.add(folded);
    total += size;
    if (total > maxTotalBytes) throw new Error('ZIP 解压总量超限');
  }
  return { files: seen, totalBytes: total };
}

export function readZipEntryMetadata(zipPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true, strictFileNames: true }, (openError, zip) => {
      if (openError) {
        reject(openError);
        return;
      }
      const entries = [];
      let failed = false;
      const fail = (error) => {
        if (failed) return;
        failed = true;
        zip.close();
        reject(error);
      };
      zip.once('error', fail);
      zip.once('end', () => {
        if (!failed) resolve(entries);
      });
      zip.on('entry', (entry) => {
        entries.push({
          fileName: entry.fileName,
          externalFileAttributes: entry.externalFileAttributes,
          generalPurposeBitFlag: entry.generalPurposeBitFlag,
          uncompressedSize: entry.uncompressedSize,
        });
        zip.readEntry();
      });
      zip.readEntry();
    });
  });
}

export async function assertSafeZipArchive(zipPath, limits = DEFAULT_ZIP_LIMITS) {
  return assertSafeZipEntries(await readZipEntryMetadata(zipPath), limits);
}
