import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import yazl from 'yazl';

export const NODE_EXPORT_FILE_EXTENSION = '.zip';
export const NODE_EXPORT_MANIFEST_NAME = 'manifest.json';
export const NODE_EXPORT_PACKAGE_KIND = 'aiCanvas.nodeExport';
export const NODE_EXPORT_SCHEMA_VERSION = 1;

const KIND_DIR = Object.freeze({ text: 'Text', image: 'image', video: 'video', audio: 'audio' });
const KIND_DEFAULT_EXT = Object.freeze({ text: 'txt', image: 'png', video: 'mp4', audio: 'mp3' });
const MEDIA_KINDS = new Set(['image', 'video', 'audio']);
const RESERVED_WINDOWS_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

function trimText(value) {
  return String(value || '').trim();
}
function pad2(value) {
  return String(value).padStart(2, '0');
}
export function defaultNodeExportZipName(date = new Date()) {
  const at = date instanceof Date ? date : new Date(date);
  return (
    'Canvas-Export-' +
    [
      at.getFullYear(),
      pad2(at.getMonth() + 1),
      pad2(at.getDate()),
      '-',
      pad2(at.getHours()),
      pad2(at.getMinutes()),
      pad2(at.getSeconds()),
    ].join('') +
    NODE_EXPORT_FILE_EXTENSION
  );
}
export function withNodeExportZipExtension(name) {
  const trimmed = trimText(name);
  if (!trimmed) return trimmed;
  return path.extname(trimmed).toLowerCase() === NODE_EXPORT_FILE_EXTENSION
    ? trimmed
    : `${trimmed}${NODE_EXPORT_FILE_EXTENSION}`;
}
function sanitizeArchiveBaseName(value, fallback) {
  let safe = trimText(value)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .slice(0, 120)
    .trim();
  if (!safe) safe = fallback;
  if (RESERVED_WINDOWS_NAMES.has(safe.toUpperCase())) safe = `${safe}_`;
  return safe || 'file';
}
function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function basenameFromUrl(value) {
  const trimmed = trimText(value);
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    return safeDecode(parsed.pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    return safeDecode(trimmed.split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop() || '');
  }
}
function extensionFromValue(value) {
  const extension = basenameFromUrl(value).match(/\.([a-z0-9]{1,8})$/i);
  return String(extension?.[1] || '').toLowerCase();
}
function normalizeKind(value) {
  const kind = trimText(value).toLowerCase();
  return Object.prototype.hasOwnProperty.call(KIND_DIR, kind) ? kind : '';
}
function getItemExtension(item) {
  const kind = normalizeKind(item?.kind);
  if (kind === 'text') return 'txt';
  return (
    extensionFromValue(item?.localPath) ||
    extensionFromValue(item?.url) ||
    extensionFromValue(item?.filenameHint) ||
    KIND_DEFAULT_EXT[kind] ||
    'bin'
  );
}
function allocateArchivePath(item, used) {
  const kind = normalizeKind(item?.kind);
  const directory = KIND_DIR[kind];
  const fallbackName = kind || 'file';
  const baseName = sanitizeArchiveBaseName(item?.filenameBase || item?.nodeName, fallbackName);
  const extension = getItemExtension(item);
  for (let index = 1; index < 1000; index += 1) {
    const suffix = index === 1 ? '' : ` (${index})`;
    const archivePath = `${directory}/${baseName}${suffix}.${extension}`;
    const key = archivePath.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    return archivePath;
  }
  throw new Error('Unable to allocate unique export file name');
}
function normalizeRemoteUrl(value) {
  const trimmed = trimText(value);
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}
function writeZip(zipFile, outputPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    output.once('close', resolve);
    output.once('error', reject);
    zipFile.outputStream.once('error', reject);
    zipFile.outputStream.pipe(output);
    zipFile.end();
  });
}
async function downloadRemoteToTemp({ url, tempDir, fetchImpl, ext }) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is not available in the main process');
  const response = await fetchImpl(url);
  if (!response?.ok) throw new Error(`HTTP ${response?.status || 0}`);
  const target = path.join(
    tempDir,
    `remote-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || 'bin'}`,
  );
  if (response.body && typeof Readable.fromWeb === 'function') {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
  } else {
    const buffer = Buffer.from(await response.arrayBuffer());
    await pipeline(Readable.from(buffer), createWriteStream(target));
  }
  if (!statSync(target).isFile()) throw new Error('Remote download did not produce a file');
  return target;
}
export async function saveNodeMediaToFile({
  outputPath,
  item,
  resolveLocalVirtualPath,
  fetchImpl = globalThis.fetch,
} = {}) {
  const kind = normalizeKind(item?.kind);
  if (!MEDIA_KINDS.has(kind)) throw new Error('Only media items can be saved');
  const requestedPath = trimText(outputPath);
  if (!requestedPath) throw new Error('Save path is required');
  if (!path.isAbsolute(requestedPath)) throw new Error('Save path must be absolute');
  const resolvedOutputPath = path.resolve(requestedPath);
  const localPath = trimText(item?.localPath);
  let resolvedLocalPath = '';
  let remoteUrl = '';
  if (localPath) {
    if (typeof resolveLocalVirtualPath !== 'function')
      throw new Error('resolveLocalVirtualPath is required');
    resolvedLocalPath = resolveLocalVirtualPath(localPath);
    if (!resolvedLocalPath) throw new Error('Local media path is not allowed');
    resolvedLocalPath = path.resolve(resolvedLocalPath);
    if (!statSync(resolvedLocalPath).isFile()) throw new Error('Local media path is not a file');
    // Already in place: report success without touching the file.
    if (resolvedLocalPath === resolvedOutputPath)
      return {
        success: true,
        canceled: false,
        path: resolvedOutputPath,
        filename: path.basename(resolvedOutputPath),
        kind,
      };
  } else {
    remoteUrl = normalizeRemoteUrl(item?.url);
    if (!remoteUrl) throw new Error('Media source is required');
    if (typeof fetchImpl !== 'function')
      throw new Error('fetch is not available in the main process');
  }
  mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  const stagedPath = path.join(
    path.dirname(resolvedOutputPath),
    `.${path.basename(resolvedOutputPath)}.${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.part`,
  );
  try {
    if (resolvedLocalPath) {
      await pipeline(createReadStream(resolvedLocalPath), createWriteStream(stagedPath, { flags: 'wx' }));
    } else {
      const response = await fetchImpl(remoteUrl);
      if (!response?.ok) throw new Error(`HTTP ${response?.status || 0}`);
      if (response.body && typeof Readable.fromWeb === 'function') {
        await pipeline(Readable.fromWeb(response.body), createWriteStream(stagedPath, { flags: 'wx' }));
      } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        await pipeline(Readable.from(buffer), createWriteStream(stagedPath, { flags: 'wx' }));
      }
    }
    // "Save as" overwrite is an explicit user choice; the staged copy is only swapped in afterwards.
    if (existsSync(resolvedOutputPath)) rmSync(resolvedOutputPath, { force: true });
    renameSync(stagedPath, resolvedOutputPath);
    return {
      success: true,
      canceled: false,
      path: resolvedOutputPath,
      filename: path.basename(resolvedOutputPath),
      kind,
    };
  } finally {
    if (existsSync(stagedPath)) rmSync(stagedPath, { force: true });
  }
}
function createSkipped(item, reason, detail = '') {
  return {
    nodeId: trimText(item?.nodeId),
    nodeName: trimText(item?.nodeName),
    nodeType: trimText(item?.nodeType),
    kind: normalizeKind(item?.kind) || trimText(item?.kind),
    reason,
    detail: trimText(detail),
  };
}
function normalizeItems(items) {
  return Array.isArray(items)
    ? items.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    : [];
}
export async function exportNodeItemsToZip({
  outputPath,
  items,
  resolveLocalVirtualPath,
  tempRoot,
  fetchImpl = globalThis.fetch,
  now = new Date(),
} = {}) {
  const requestedPath = withNodeExportZipExtension(outputPath);
  if (!requestedPath) throw new Error('Export path is required');
  if (!path.isAbsolute(requestedPath)) throw new Error('Export path must be absolute');
  const resolvedOutputPath = path.resolve(requestedPath);
  if (typeof resolveLocalVirtualPath !== 'function')
    throw new Error('resolveLocalVirtualPath is required');
  const entries = [];
  const skipped = [];
  const usedArchivePaths = new Set();
  let tempDir = '';
  try {
    for (const item of normalizeItems(items)) {
      const kind = normalizeKind(item?.kind);
      if (!kind) {
        skipped.push(createSkipped(item, 'UNSUPPORTED_KIND'));
        continue;
      }
      if (kind === 'text') {
        const text = String(item?.text ?? '');
        if (!text.trim()) {
          skipped.push(createSkipped(item, 'EMPTY_TEXT'));
          continue;
        }
        entries.push({
          item,
          kind,
          archivePath: allocateArchivePath({ ...item, kind }, usedArchivePaths),
          buffer: Buffer.from(text, 'utf8'),
          compress: true,
        });
        continue;
      }
      const localPath = trimText(item?.localPath);
      if (localPath) {
        const absolutePath = resolveLocalVirtualPath(localPath);
        if (!absolutePath) {
          skipped.push(createSkipped(item, 'INVALID_LOCAL_PATH', localPath));
          continue;
        }
        try {
          if (!statSync(absolutePath).isFile()) {
            skipped.push(createSkipped(item, 'LOCAL_PATH_NOT_FILE', localPath));
            continue;
          }
          entries.push({
            item,
            kind,
            archivePath: allocateArchivePath({ ...item, kind }, usedArchivePaths),
            sourcePath: absolutePath,
            compress: false,
          });
        } catch (error) {
          skipped.push(
            createSkipped(item, 'LOCAL_FILE_MISSING', error?.message || localPath),
          );
        }
        continue;
      }
      const remoteUrl = normalizeRemoteUrl(item?.url);
      if (!remoteUrl) {
        skipped.push(createSkipped(item, 'NO_MEDIA_SOURCE'));
        continue;
      }
      try {
        if (!tempDir) {
          const parent = tempRoot || path.dirname(resolvedOutputPath);
          mkdirSync(parent, { recursive: true });
          tempDir = mkdtempSync(path.join(parent, 'aic-node-export-'));
        }
        const downloaded = await downloadRemoteToTemp({
          url: remoteUrl,
          tempDir,
          fetchImpl,
          ext: getItemExtension(item),
        });
        entries.push({
          item,
          kind,
          archivePath: allocateArchivePath({ ...item, kind }, usedArchivePaths),
          sourcePath: downloaded,
          compress: false,
        });
      } catch (error) {
        skipped.push(
          createSkipped(item, 'REMOTE_DOWNLOAD_FAILED', error?.message || remoteUrl),
        );
      }
    }
    if (entries.length <= 0)
      return {
        success: false,
        canceled: false,
        code: 'NO_EXPORTABLE_ITEMS',
        exportedCount: 0,
        skipped,
        counts: {},
      };
    const counts = { text: 0, image: 0, video: 0, audio: 0 };
    for (const entry of entries) counts[entry.kind] += 1;
    const manifest = {
      schemaVersion: NODE_EXPORT_SCHEMA_VERSION,
      packageKind: NODE_EXPORT_PACKAGE_KIND,
      exportedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
      exportedCount: entries.length,
      counts,
      items: entries.map((entry) => ({
        nodeId: trimText(entry.item?.nodeId),
        nodeName: trimText(entry.item?.nodeName),
        nodeType: trimText(entry.item?.nodeType),
        kind: entry.kind,
        archivePath: entry.archivePath,
      })),
      skipped,
    };
    mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    const zipFile = new yazl.ZipFile();
    for (const entry of entries) {
      if (entry.buffer) zipFile.addBuffer(entry.buffer, entry.archivePath);
      else zipFile.addFile(entry.sourcePath, entry.archivePath, { compress: entry.compress !== false });
    }
    zipFile.addBuffer(
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
      NODE_EXPORT_MANIFEST_NAME,
    );
    await writeZip(zipFile, resolvedOutputPath);
    return {
      success: true,
      canceled: false,
      path: resolvedOutputPath,
      filename: path.basename(resolvedOutputPath),
      exportedCount: entries.length,
      skipped,
      counts,
    };
  } finally {
    if (tempDir && existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  }
}
