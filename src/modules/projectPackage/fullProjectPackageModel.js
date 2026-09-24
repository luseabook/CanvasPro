export const FULL_PACKAGE_LIMITS = Object.freeze({
  jsonBytes: 64 * 1024 * 1024, manifestBytes: 8 * 1024 * 1024,
  packageBytes: 10 * 1024 ** 3, expandedBytes: 10 * 1024 ** 3,
  assetBytes: 5 * 1024 ** 3, assets: 5000, entries: 12000, canvases: 100, nodes: 50000,
});
export const FULL_PACKAGE_PREFIXES = Object.freeze(['data/workflows/thumbs/', 'data/uploads/', 'data/assets/', 'output/']);
const ACTIVE = new Set(['running', 'processing', 'waiting', 'queued', 'pending', 'submitting', 'polling', 'recovering', 'generating', 'starting', 'submitted', 'in_progress', 'in-progress']);
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
function validId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 && !FORBIDDEN.has(value) && !/[\x00-\x1f\x7f]/.test(value);
}
export function assertPortablePath(value, { directory = false } = {}) {
  if (typeof value !== 'string' || !value || value.length > 1024 || /[\\%?#:\x00-\x1f\x7f]/.test(value) || value.startsWith('/')) throw new Error('工程包路径不规范');
  const clean = directory && value.endsWith('/') ? value.slice(0, -1) : value;
  for (const part of clean.split('/')) {
    if (!part || part === '.' || part === '..' || part !== part.trim() || /[. ]$/.test(part) || /[<>"|*]/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)) throw new Error('工程包含不支持的路径段');
  }
  return clean;
}
export function assertPortableLocalPath(value) {
  assertPortablePath(value);
  if (!FULL_PACKAGE_PREFIXES.some(prefix => value.startsWith(prefix))) throw new Error('不支持的工程素材根目录');
  return value;
}
export function assertProjectTree(value) {
  const stack = [[value, 0, '$']]; let count = 0;
  while (stack.length) {
    const [item, depth, location] = stack.pop();
    if (++count > 2000000 || depth > 100) throw new Error('工程结构过大或过深');
    if (!item || typeof item !== 'object') continue;
    for (const [key, child] of Object.entries(item)) {
      if (typeof child === 'number' && !Number.isFinite(child)) throw new Error('工程含非有限数字');
      if (FORBIDDEN.has(key)) throw new Error('工程包含不安全的对象键');
      if (/(?:Generating|Recovering|Processing)$/i.test(key) && child === true) throw new Error('工程仍有生成/恢复中状态，请先人工核对并停止；不跨工程恢复任务：' + location + '.' + key);
      if (/(?:status|state)$/i.test(key) && typeof child === 'string' && ACTIVE.has(child.trim().toLowerCase())) throw new Error('工程含待发送或进行中状态，请先核对；不会自动迁移在途任务：' + location + '.' + key);
      if (child && typeof child === 'object') stack.push([child, depth + 1, (location + '.' + key).slice(0, 512)]);
    }
  }
}
export function validateFullProject(data) {
  assertProjectTree(data);
  if (!Array.isArray(data?.canvases) || !data.canvases.length || data.canvases.length > FULL_PACKAGE_LIMITS.canvases) throw new Error('完整工程包需1–100张画布');
  const ids = new Set(); let nodeCount = 0;
  for (const canvas of data.canvases) {
    if (!validId(canvas?.id) || ids.has(canvas.id)) throw new Error('画布ID缺失或重复');
    ids.add(canvas.id);
    if (!Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) throw new Error('完整恢复需要原多画布nodes/edges数组格式');
    const nodeIds = new Set();
    for (const node of canvas.nodes) {
      if (!validId(node?.id) || typeof node.type !== 'string' || !/^[a-z0-9_-]{1,80}$/i.test(node.type) || FORBIDDEN.has(node.type) || nodeIds.has(node.id)) throw new Error('节点ID缺失或重复');
      nodeIds.add(node.id);
    }
    const edgeIds = new Set();
    for (const edge of canvas.edges) {
      if (!validId(edge?.id) || edgeIds.has(edge.id) || !nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) throw new Error('工程连线缺失端点或ID冲突');
      edgeIds.add(edge.id);
    }
    nodeCount += canvas.nodes.length;
    if (nodeCount > FULL_PACKAGE_LIMITS.nodes) throw new Error('完整工程包节点总数超过50000');
  }
  if (!ids.has(data.activeCanvasId)) throw new Error('活动画布不在工程中');
  return { canvasCount: ids.size, nodeCount };
}
export function validateFullPackageManifest(manifest) {
  assertProjectTree(manifest);
  if (manifest?.schemaVersion !== 1 || manifest.packageKind !== 'aiCanvas.projectPackage' || manifest.projectFile !== 'project/project.aicanvas') throw new Error('不是受支持的原v1工程包');
  if (!Array.isArray(manifest.assets) || manifest.assets.length > FULL_PACKAGE_LIMITS.assets) throw new Error('工程素材清单超限或缺失');
  if (manifest.warnings?.length) throw new Error('此包含原素材缺失/替代警告，不能作为完整工程恢复');
  const paths = new Set(), archives = new Set(); let totalBytes = 0;
  for (const asset of manifest.assets) {
    assertPortableLocalPath(asset?.localPath); assertPortablePath(asset.archivePath);
    if (asset.archivePath !== 'assets/' + asset.localPath) throw new Error('素材归档路径与原路径不一致');
    const folded = asset.localPath.normalize('NFC').toLowerCase();
    if (paths.has(folded) || archives.has(asset.archivePath.normalize('NFC').toLowerCase())) throw new Error('素材路径重复或大小写冲突');
    paths.add(folded); archives.add(asset.archivePath.normalize('NFC').toLowerCase());
    if (!Number.isSafeInteger(asset.size) || asset.size < 0 || asset.size > FULL_PACKAGE_LIMITS.assetBytes || !/^[a-f0-9]{64}$/i.test(asset.sha256 || '')) throw new Error('素材缺少有效大小/SHA-256或超限');
    totalBytes += asset.size;
    if (totalBytes > FULL_PACKAGE_LIMITS.expandedBytes) throw new Error('素材总容量超限');
  }
  return { assetsCount: paths.size, totalBytes };
}
export function createArchiveEntryGuard() {
  const files = new Map(), names = new Set(); let total = 0, count = 0;
  return {
    files,
    accept(entry) {
      const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
      const directory = entry.fileName?.endsWith('/') || mode === 0o040000;
      const name = assertPortablePath(entry.fileName, { directory });
      if (mode && mode !== 0o100000 && mode !== 0o040000) throw new Error('工程包不允许链接或特殊文件');
      if (entry.generalPurposeBitFlag & 1) throw new Error('不支持加密工程包');
      if (++count > FULL_PACKAGE_LIMITS.entries) throw new Error('归档条目数量超限');
      const folded = name.normalize('NFC').toLowerCase();
      if (names.has(folded)) throw new Error('归档重复路径或大小写冲突');
      names.add(folded);
      const allowed = name === 'manifest.json' || name === 'project/project.aicanvas' || name.startsWith('assets/');
      if (!allowed && !(directory && (name === 'project' || name === 'assets'))) throw new Error('工程包包含未支持条目');
      const size = entry.uncompressedSize;
      const cap = name === 'manifest.json' ? FULL_PACKAGE_LIMITS.manifestBytes : name === 'project/project.aicanvas' ? FULL_PACKAGE_LIMITS.jsonBytes : FULL_PACKAGE_LIMITS.assetBytes;
      if (!Number.isSafeInteger(size) || size < 0 || size > cap || (directory && size !== 0)) throw new Error('归档解压大小无效或超限');
      total += size;
      if (total > FULL_PACKAGE_LIMITS.expandedBytes) throw new Error('归档解压总量超限');
      if (!directory) files.set(name, size);
      return { name, directory, size };
    },
  };
}