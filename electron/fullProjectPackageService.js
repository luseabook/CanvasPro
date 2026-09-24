import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { constants, copyFileSync, createReadStream, createWriteStream, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import path from 'node:path';
import { FULL_PACKAGE_LIMITS as LIMITS, FULL_PACKAGE_PREFIXES, assertPortableLocalPath, assertProjectTree, createArchiveEntryGuard, validateFullPackageManifest, validateFullProject } from '../src/modules/projectPackage/fullProjectPackageModel.js';
import { collectReferencedLocalPaths, resolveVirtualPathToAbsolute } from './localAssetCleanup.js';
import { exportProjectPackageToPath, projectPackageInternals } from './projectPackageService.js';
import { sanitizeProjectName, writeProjectJson } from '../src/services/desktopProjectFileStore.js';
// Reuse the reader already required by extract-zip; no new npm installation/dependency.
const require = createRequire(import.meta.url);
const zipReader = createRequire(require.resolve('extract-zip'))('yauzl');
const ROOT_KEYS = ['workflowThumbsRoot', 'uploadsRoot', 'assetsRoot', 'outputRoot'];
function rootFor(localPath, roots) {
  const index = FULL_PACKAGE_PREFIXES.findIndex(prefix => localPath.startsWith(prefix));
  if (index < 0 || !roots?.[ROOT_KEYS[index]]) throw new Error('素材根目录未配置');
  return { root: path.resolve(roots[ROOT_KEYS[index]]), prefix: FULL_PACKAGE_PREFIXES[index], key: ROOT_KEYS[index] };
}
export function assertRegularFileUnderRoot(file, root) {
  const base = realpathSync(root), relative = path.relative(path.resolve(root), path.resolve(file));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('素材不在批准根目录内');
  let current = base;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error('完整工程包不接受根目录内的链接');
  }
  const stat = lstatSync(current);
  if (!stat.isFile() || stat.size > LIMITS.assetBytes) throw new Error('素材不是普通文件或单文件超限');
  return stat;
}
async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function cleanup(directory, warnings) {
  try { rmSync(directory, { recursive: true, force: true }); }
  catch { warnings.push('临时/本次恢复目录未能清理：' + directory); }
}
function rejectAmbiguousHttpReferences(data) {
  const stack = [data];
  while (stack.length) {
    const item = stack.pop();
    if (typeof item === 'string' && /^https?:\/\//i.test(item) && collectReferencedLocalPaths(item).size) throw new Error('HTTP形式的本地素材路径有主机歧义，请先规范为本地虚拟路径');
    if (item && typeof item === 'object') for (const value of Object.values(item)) stack.push(value);
  }
}
function readBoundedJson(file, maxBytes) {
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maxBytes) throw new Error('工程JSON不是普通文件或超限');
  const value = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  assertProjectTree(value);
  return value;
}
// Each name/declared size is checked BEFORE directory creation. Stream bytes are bounded as well.
export async function extractFullPackage(packagePath, directory, { onProgress = () => {} } = {}) {
  const guard = createArchiveEntryGuard();
  const zip = await new Promise((resolve, reject) => zipReader.open(packagePath, { lazyEntries: true, autoClose: true, strictFileNames: true }, (error, value) => error ? reject(error) : resolve(value)));
  await new Promise((resolve, reject) => {
    let failed = false, activeInput = null, activeOutput = null, activeWork = Promise.resolve();
    function fail(error) { if (failed) return; failed = true; activeInput?.destroy(); activeOutput?.destroy(); zip.close(); void activeWork.catch(() => {}).then(() => reject(error)); }
    zip.once('error', fail); zip.once('end', () => { if (!failed) resolve(); });
    zip.on('entry', entry => {
      activeWork = (async () => {
      if (failed) return;
      try {
        const item = guard.accept(entry), destination = path.join(directory, ...item.name.split('/'));
        if (item.directory) mkdirSync(destination, { recursive: true });
        else {
          mkdirSync(path.dirname(destination), { recursive: true });
          activeInput = await new Promise((res, rej) => zip.openReadStream(entry, (error, stream) => error ? rej(error) : res(stream)));
          if (failed) { activeInput.destroy(); return; }
          activeOutput = createWriteStream(destination, { flags: 'wx', mode: 0o600 });
          let bytes = 0;
          await pipeline(activeInput, new Transform({ transform(chunk, encoding, callback) {
            bytes += chunk.length;
            callback(bytes > item.size ? new Error('解压实际容量超过声明') : null, chunk);
          } }), activeOutput);
          if (bytes !== item.size) throw new Error('解压实际容量不符');
          activeInput = null; activeOutput = null;
          onProgress({ phase: 'verifying', message: `读取工程包条目 ${guard.files.size}`, current: guard.files.size });
        }
        if (!failed) zip.readEntry();
      } catch (error) { fail(error); }
      })();
    });
    zip.readEntry();
  });
  return guard.files;
}
export async function inspectFullProjectPackage(packagePath, directory, options = {}) {
  if (!path.isAbsolute(packagePath) || path.extname(packagePath).toLowerCase() !== '.aicpkg') throw new Error('请选择本地.aicpkg工程包');
  const stat = lstatSync(packagePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > LIMITS.packageBytes) throw new Error('工程包不是普通文件或超过10GiB');
  const files = await extractFullPackage(packagePath, directory, options);
  const manifest = readBoundedJson(path.join(directory, 'manifest.json'), LIMITS.manifestBytes);
  const assetsSummary = validateFullPackageManifest(manifest);
  const data = readBoundedJson(path.join(directory, 'project/project.aicanvas'), LIMITS.jsonBytes);
  const projectSummary = validateFullProject(data); rejectAmbiguousHttpReferences(data);
  const expected = new Set(['manifest.json', 'project/project.aicanvas', ...manifest.assets.map(asset => asset.archivePath)]);
  if (files.size !== expected.size || [...files.keys()].some(name => !expected.has(name))) throw new Error('归档文件与清单不一致');
  const localPaths = new Set(manifest.assets.map(asset => asset.localPath));
  for (const reference of collectReferencedLocalPaths(data)) if (!localPaths.has(reference)) throw new Error('工程引用的素材未包含在包中：' + reference);
  if (projectPackageInternals.collectRemoteMediaReferences(data).length) throw new Error('包内仍有未本地化远程媒体，不能完整恢复');
  for (const [index, asset] of manifest.assets.entries()) {
    const file = path.join(directory, ...asset.archivePath.split('/'));
    assertRegularFileUnderRoot(file, directory);
    if (files.get(asset.archivePath) !== asset.size || await sha256(file) !== asset.sha256.toLowerCase()) throw new Error('素材大小/SHA-256校验失败：' + asset.localPath);
    options.onProgress?.({ phase: 'verifying', message: `校验素材 ${index + 1}/${manifest.assets.length}`, current: index + 1, total: manifest.assets.length });
  }
  return { manifest, data, summary: { ...assetsSummary, ...projectSummary } };
}
function makeImportDirectory(root, token) {
  const base = realpathSync(root), parent = path.join(base, 'ProjectImports');
  if (!existsSync(parent)) mkdirSync(parent);
  const stat = lstatSync(parent);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('ProjectImports不是普通目录');
  const directory = path.join(parent, token); mkdirSync(directory); // exclusive, no recursive overwrite
  return directory;
}
export async function restoreFullProjectPackage({ packagePath, roots, projectRoot, tempRoot, confirm, assertActive = () => {}, onProgress = () => {} }) {
  mkdirSync(tempRoot, { recursive: true });
  const temporary = mkdtempSync(path.join(tempRoot, 'full-project-check-'));
  const ownedDirectories = [], cleanupWarnings = []; let committed = false, failure;
  try {
    const inspection = await inspectFullProjectPackage(packagePath, temporary, { onProgress });
    assertActive();
    if (!await confirm(inspection.summary)) return { success: false, canceled: true, cleanupWarnings };
    assertActive();
    const token = 'full-' + randomUUID(), targetRoots = new Map(), replacements = new Map();
    // All hashes/coverage checked before any writes into persistent media/project roots.
    for (const asset of inspection.manifest.assets) {
      const definition = rootFor(asset.localPath, roots);
      if (!targetRoots.has(definition.key)) {
        const dir = makeImportDirectory(definition.root, token + '-' + definition.key); ownedDirectories.push(dir); targetRoots.set(definition.key, dir);
      }
      const relative = asset.localPath.slice(definition.prefix.length);
      const destination = path.join(targetRoots.get(definition.key), ...relative.split('/'));
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(temporary, ...asset.archivePath.split('/')), destination, constants.COPYFILE_EXCL);
      if (await sha256(destination) !== asset.sha256.toLowerCase()) throw new Error('落盘素材校验失败');
      assertActive();
      replacements.set(asset.localPath, `${definition.prefix}ProjectImports/${token}-${definition.key}/${relative}`);
      onProgress({ phase: 'restoring', message: `恢复素材 ${replacements.size}/${inspection.manifest.assets.length}`, current: replacements.size, total: inspection.manifest.assets.length });
    }
    const data = projectPackageInternals.rewriteProjectLocalReferences(inspection.data, replacements);
    validateFullProject(data);
    const mappedPaths = new Set(replacements.values());
    for (const reference of collectReferencedLocalPaths(data)) {
      if (!mappedPaths.has(reference)) throw new Error('恢复后仍含未映射素材路径');
    }
    mkdirSync(projectRoot, { recursive: true });
    const projectDirectory = makeImportDirectory(projectRoot, token + '-project'); ownedDirectories.push(projectDirectory);
    const projectName = sanitizeProjectName(inspection.manifest.project?.projectName || '恢复工程') + '-' + token.slice(-8);
    const projectPath = path.join(projectDirectory, projectName + '.aicanvas');
    assertActive(); writeProjectJson(projectPath, data); committed = true;
    return { success: true, canceled: false, projectPath, projectName, data, assetsCount: replacements.size, fullPackageVersion: 1, cleanupWarnings, ...inspection.summary };
  } catch (error) { failure = error; throw error; } finally {
    cleanup(temporary, cleanupWarnings);
    if (!committed) for (const directory of ownedDirectories.reverse()) cleanup(directory, cleanupWarnings);
    if (failure && cleanupWarnings.length) failure.message += '\n' + cleanupWarnings.join('\n');
  }
}
export async function exportFullProjectPackage({ outputPath, multiData, roots, projectName, projectId, appVersion, assertActive = () => {}, onProgress = () => {} }) {
  if (!path.isAbsolute(outputPath) || path.extname(outputPath).toLowerCase() !== '.aicpkg' || existsSync(outputPath)) throw new Error('完整工程包需使用新的.aicpkg文件名，不覆盖已有文件');
  const json = JSON.stringify(multiData);
  if (Buffer.byteLength(json, 'utf8') > LIMITS.jsonBytes) throw new Error('完整工程JSON超过64MiB');
  const snapshot = JSON.parse(json); validateFullProject(snapshot); rejectAmbiguousHttpReferences(snapshot);
  const references = [...collectReferencedLocalPaths(snapshot)];
  if (references.length > LIMITS.assets) throw new Error('工程素材超过5000项');
  let total = 0;
  for (const reference of references) {
    assertPortableLocalPath(reference);
    const definition = rootFor(reference, roots), file = resolveVirtualPathToAbsolute(reference, roots);
    const stat = assertRegularFileUnderRoot(file, definition.root); total += stat.size;
    if (total > LIMITS.expandedBytes) throw new Error('工程素材总容量超过10GiB');
  }
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const temporary = mkdtempSync(path.join(path.dirname(outputPath), '.full-project-')), cleanupWarnings = [];
  try {
    const staged = path.join(temporary, 'verified.aicpkg');
    await exportProjectPackageToPath({ outputPath: staged, multiData: snapshot, roots, projectName, projectId, appVersion, onProgress });
    const unpacked = path.join(temporary, 'verify'); mkdirSync(unpacked);
    const inspection = await inspectFullProjectPackage(staged, unpacked, { onProgress });
    assertActive(); copyFileSync(staged, outputPath, constants.COPYFILE_EXCL);
    return { success: true, canceled: false, path: outputPath, filename: path.basename(outputPath), fullPackageVersion: 1, cleanupWarnings, ...inspection.summary };
  } finally { cleanup(temporary, cleanupWarnings); }
}
