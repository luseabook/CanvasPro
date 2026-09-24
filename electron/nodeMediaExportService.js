import path from 'node:path';
import { constants } from 'node:fs';
import * as fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NODE_MEDIA_EXPORT_LIMITS, NODE_MEDIA_EXPORT_ROOTS, normalizeMediaExportItems } from '../src/modules/nodeExport/nodeMediaExportModel.js';

export function assertNodeExportSender(event, mainWindow, isLocalAppUrl) {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame || !isLocalAppUrl(event.senderFrame?.url || '')) {
    throw new Error('媒体导出仅允许主应用窗口调用');
  }
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return !!relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
function sameFile(a, b) {
  return a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;
}
function publicError(error) {
  if (error?.exportMessage) return error.exportMessage;
  if (error?.code === 'ENOENT') return '源文件或目标目录已不存在';
  if (error?.code === 'ENOSPC') return '磁盘空间不足';
  if (['EACCES', 'EPERM'].includes(error?.code)) return '没有读取或写入权限';
  return '文件导出失败，请核对文件、磁盘和权限';
}
function reject(message) {
  const error = new Error(message); error.exportMessage = message; throw error;
}

export async function resolveExportSource(item, { roots, resolveLocalVirtualPath }) {
  const prefix = NODE_MEDIA_EXPORT_ROOTS.find(root => item.localPath.startsWith(root));
  const configuredRoot = roots?.[prefix];
  if (typeof configuredRoot !== 'string' || !path.isAbsolute(configuredRoot)) reject('本地素材根目录不可用');
  const root = await fs.realpath(configuredRoot);
  const candidate = resolveLocalVirtualPath(item.localPath);
  const expected = path.resolve(configuredRoot, item.localPath.slice(prefix.length));
  if (!candidate || path.resolve(candidate) !== expected) reject('素材路径解析不一致');
  // Walk from the trusted configured root; reject symlink/junction descendants.
  let current = root;
  const parts = item.localPath.slice(prefix.length).split('/');
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink() || (index < parts.length - 1 && !stat.isDirectory())) reject('不导出符号链接或目录跳转素材');
  }
  const absolutePath = await fs.realpath(current);
  if (!isInside(root, absolutePath)) reject('素材越出允许目录');
  const stat = await fs.stat(absolutePath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > NODE_MEDIA_EXPORT_LIMITS.fileBytes) reject('源文件为空、非普通文件或超过 512 MiB');
  return { absolutePath, stat };
}

export async function copyVerified(item, prepared, destination, deps) {
  const fresh = await resolveExportSource(item, deps);
  if (fresh.absolutePath !== prepared.absolutePath || !sameFile(fresh.stat, prepared.stat)) reject('确认后源文件已变化，请重新导出');
  const input = await fs.open(fresh.absolutePath, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  let output, created = false;
  const partialPath = path.join(destination, `${item.fileName}.part`);
  try {
    if (!sameFile(await input.stat(), prepared.stat)) reject('源文件已变化');
    output = await fs.open(partialPath, 'wx'); created = true;
    const hash = createHash('sha256'), buffer = Buffer.alloc(1024 * 1024);
    let bytes = 0;
    while (true) {
      const { bytesRead } = await input.read(buffer, 0, buffer.length, null);
      if (!bytesRead) break;
      bytes += bytesRead;
      if (bytes > prepared.stat.size || bytes > NODE_MEDIA_EXPORT_LIMITS.fileBytes) reject('源文件在复制期间增长');
      hash.update(buffer.subarray(0, bytesRead));
      let offset = 0;
      while (offset < bytesRead) {
        const written = await output.write(buffer, offset, bytesRead - offset, null);
        if (!written.bytesWritten) reject('目标文件写入不完整');
        offset += written.bytesWritten;
      }
    }
    if (bytes !== prepared.stat.size || !sameFile(await input.stat(), prepared.stat)) reject('源文件在复制期间变化');
    await output.sync(); await output.close(); output = null;
    // Exclusive copy of the staged bytes: never replace an existing final file.
    await fs.copyFile(partialPath, path.join(destination, item.fileName), constants.COPYFILE_EXCL);
    await fs.unlink(partialPath); created = false;
    return { bytes, sha256: hash.digest('hex') };
  } finally {
    await input.close().catch(() => {});
    if (output) await output.close().catch(() => {});
    if (created) await fs.unlink(partialPath).catch(() => {});
  }
}

export function createNodeMediaExporter({ getRoots, resolveLocalVirtualPath, chooseDirectory, confirmExport }) {
  let busy = false;
  return async function exportSelected(payload, { assertActive = () => {} } = {}) {
    if (busy) throw new Error('已有媒体导出正在进行，请等待完成');
    const items = normalizeMediaExportItems(payload);
    busy = true;
    try {
      assertActive();
      const deps = { roots: getRoots(), resolveLocalVirtualPath }, prepared = [], results = [];
      let totalBytes = 0;
      for (const item of items) {
        try {
          const source = await resolveExportSource(item, deps);
          totalBytes += source.stat.size;
          prepared.push({ item, source });
        } catch (error) {
          results.push({ nodeId: item.nodeId, name: item.name, kind: item.kind, status: 'failed', error: publicError(error) });
        }
      }
      if (totalBytes > NODE_MEDIA_EXPORT_LIMITS.totalBytes) throw new Error('整批媒体超过 2 GiB，请缩小选择');
      if (!prepared.length) return { status: 'failed', results, directory: '', manifestSaved: false };
      assertActive();
      const selected = await chooseDirectory();
      if (!selected) return { status: 'cancelled', results: [], directory: '', manifestSaved: false };
      const parent = await fs.realpath(selected);
      if (!(await fs.stat(parent)).isDirectory()) throw new Error('目标不是目录');
      assertActive();
      if (!await confirmExport({ directory: parent, items: prepared.map(({ item }) => item),
        totalBytes, failedCount: results.length })) return { status: 'cancelled', results: [], directory: '', manifestSaved: false };
      assertActive();
      const directory = await fs.mkdtemp(path.join(parent, 'CanvasPro-media-'));
      for (const { item, source } of prepared) {
        try {
          // If the renderer closes/navigates, stop starting new copies; existing files remain.
          assertActive();
          const saved = await copyVerified(item, source, directory, deps);
          results.push({ nodeId: item.nodeId, name: item.name, kind: item.kind,
            status: 'saved', fileName: item.fileName, ...saved });
        } catch (error) {
          results.push({ nodeId: item.nodeId, name: item.name, kind: item.kind, status: 'failed', error: publicError(error) });
        }
      }
      const order = new Map(items.map((item, i) => [item.nodeId, i]));
      results.sort((a, b) => order.get(a.nodeId) - order.get(b.nodeId));
      const manifest = { schema: 'canvas-node-media-export.v1', createdAt: new Date().toISOString(), results };
      let manifestSaved = false;
      try {
        await fs.writeFile(path.join(directory, 'export-manifest.json'), JSON.stringify(manifest, null, 2), { encoding: 'utf8', flag: 'wx' });
        manifestSaved = true;
      } catch { /* Keep successful media and report separately; no automatic retry. */ }
      const savedCount = results.filter(item => item.status === 'saved').length;
      return { status: savedCount === 0 ? 'failed' : (savedCount === results.length && manifestSaved ? 'complete' : 'partial'),
        directory, manifestSaved, results };
    } finally { busy = false; }
  };
}
