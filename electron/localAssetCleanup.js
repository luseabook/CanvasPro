import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const PROJECT_EXTENSIONS = new Set(['.aicanvas', '.aicproj', '.json']),
  IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif', '.svg']),
  VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv']),
  AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.opus', '.webm']),
  MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS]),
  CLEANABLE_PREFIXES = Object.freeze(['output/', 'data/uploads/', 'data/assets/', 'data/workflows/thumbs/']),
  ROOT_DEFINITIONS = Object.freeze([
    { key: 'output', rootKey: 'outputRoot', virtualPrefix: 'output/' },
    { key: 'uploads', rootKey: 'uploadsRoot', virtualPrefix: 'data/uploads/' },
    { key: 'assets', rootKey: 'assetsRoot', virtualPrefix: 'data/assets/' },
    { key: 'workflowThumbs', rootKey: 'workflowThumbsRoot', virtualPrefix: 'data/workflows/thumbs/' },
  ]);
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function trimText(value) {
  return String(value || '').trim();
}
function decodePathPart(item) {
  try {
    return decodeURIComponent(item);
  } catch {
    return item;
  }
}
function splitCompositeVirtualPathValue(key) {
  const trimText2 = trimText(key);
  if (!trimText2) return [];
  return trimText2
    .split('|')
    .map((item2) => item2.trim())
    .filter(Boolean);
}
function normalizeComparablePath(index, result = process.platform) {
  const data = path.resolve(String(index || ''));
  return result === 'win32' || result === 'darwin' ? data.toLowerCase() : data;
}
export function isPathInside(options, target, source = process.platform) {
  try {
    const comparablePath = normalizeComparablePath(options, source),
      comparablePath2 = normalizeComparablePath(target, source);
    return comparablePath === comparablePath2 || comparablePath.startsWith('' + comparablePath2 + path.sep);
  } catch {
    return false;
  }
}
export function normalizeVirtualLocalPath(next) {
  let list = trimText(next);
  if (!list) return '';
  if (list.includes('|')) return '';
  if (/^(?:file|javascript|data|blob):/i.test(list)) return '';
  if (/^https?:\/\//i.test(list))
    try {
      list = new URL(list).pathname || '';
    } catch {
      return '';
    }
  else {
    if (/^[a-z][a-z0-9+.-]*:/i.test(list) && !list.startsWith('/')) return '';
  }
  const current = list.split(/[?#]/, 1)[0],
    list2 = decodePathPart(current).replace(/\\/g, '/').replace(/^\/+/, '');
  if (list2.includes('|')) return '';
  if (/^[a-zA-Z]:\//.test(list2) || list2.startsWith('//')) return '';
  if (list2.split('/').some((item3) => item3 === '..')) return '';
  const enabled2 = path.posix.normalize(list2);
  if (!enabled2 || enabled2 === '.' || enabled2 === '..' || enabled2.startsWith('../')) return '';
  return CLEANABLE_PREFIXES.some((item4) => enabled2.startsWith(item4)) ? enabled2 : '';
}
export function collectVirtualLocalPathsFromString(entry) {
  const list3 = [],
    map = new Set();
  for (const record of splitCompositeVirtualPathValue(entry)) {
    const virtualLocalPath = normalizeVirtualLocalPath(record);
    if (!virtualLocalPath || map.has(virtualLocalPath)) continue;
    (map.add(virtualLocalPath), list3.push(virtualLocalPath));
  }
  return list3;
}
export function collectReferencedLocalPaths(payload, handle = new Set(), map2 = new Set()) {
  if (payload == null) return handle;
  if (typeof payload === 'string') {
    for (const state of collectVirtualLocalPathsFromString(payload)) {
      handle.add(state);
    }
    return handle;
  }
  if (typeof payload !== 'object') return handle;
  if (map2.has(payload)) return handle;
  map2.add(payload);
  if (Array.isArray(payload)) {
    for (const config of payload) collectReferencedLocalPaths(config, handle, map2);
    return handle;
  }
  for (const input of Object.values(payload)) {
    collectReferencedLocalPaths(input, handle, map2);
  }
  return handle;
}
function stripUtf8Bom(output) {
  return String(output || '').replace(/^\uFEFF/, '');
}
function readJsonIfPossible(value2, list4, source2) {
  try {
    return JSON.parse(stripUtf8Bom(readFileSync(value2, 'utf8')));
  } catch (error) {
    return (
      list4?.push({
        type: 'json-read-failed',
        source: source2 || value2,
        message: String(error?.message || error),
      }),
      null
    );
  }
}
function listFilesRecursive(value3, list5, list6 = {}) {
  const trimText3 = trimText(value3);
  if (!trimText3 || !existsSync(trimText3)) return [];
  const list7 = [],
    list8 = [path.resolve(trimText3)],
    value4 = path.resolve(trimText3);
  while (list8.length > 0) {
    const source3 = list8.pop();
    let dirSync = [];
    try {
      dirSync = readdirSync(source3, { withFileTypes: true });
    } catch (error2) {
      list5?.push({
        type: 'directory-read-failed',
        source: source3,
        message: String(error2?.message || error2),
      });
      continue;
    }
    for (const error3 of dirSync) {
      const item5 = path.join(source3, error3.name);
      if (!isPathInside(item5, value4)) continue;
      if (error3.isSymbolicLink()) continue;
      if (error3.isDirectory()) {
        list8.push(item5);
        continue;
      }
      if (!error3.isFile()) continue;
      if (typeof list6.filter === 'function' && !list6.filter(item5)) continue;
      list7.push(item5);
    }
  }
  return list7;
}
function isSupportedProjectFile(value5) {
  return PROJECT_EXTENSIONS.has(path.extname(String(value5 || '')).toLowerCase());
}
function readRecentProjectPaths(enabled3, value6) {
  if (!enabled3 || !existsSync(enabled3)) return [];
  const jsonIfPossible = readJsonIfPossible(enabled3, value6, 'recent-projects'),
    list9 = Array.isArray(jsonIfPossible?.items) ? jsonIfPossible.items : [];
  return list9
    .map((item6) => trimText(item6?.path || item6?.displayPath))
    .filter((item7) => item7 && path.isAbsolute(item7) && isSupportedProjectFile(item7));
}
function addJsonReferencesFromFiles(value7, value8, value9, value10) {
  const map3 = new Set();
  for (const value11 of value7) {
    const value12 = path.resolve(value11),
      comparablePath3 = normalizeComparablePath(value12);
    if (map3.has(comparablePath3) || !existsSync(value12)) continue;
    map3.add(comparablePath3);
    const jsonIfPossible2 = readJsonIfPossible(value12, value9, value10 || value12);
    if (jsonIfPossible2 != null) collectReferencedLocalPaths(jsonIfPossible2, value8);
  }
}
function listJsonFiles(value13, value14) {
  return listFilesRecursive(value13, value14, {
    filter: (value15) => path.extname(value15).toLowerCase() === '.json',
  });
}
function listProjectFiles(value16, value17) {
  return listFilesRecursive(value16, value17, { filter: isSupportedProjectFile });
}
function getWorkflowThumbRoot(value18) {
  const trimText4 = trimText(value18);
  return trimText4 ? path.join(trimText4, 'thumbs') : '';
}
export function buildLocalAssetCleanupRoots({
  fileSavePaths: fileSavePaths = {},
  defaults: defaults = {},
} = {}) {
  const isPlainObject2 = isPlainObject(fileSavePaths) ? fileSavePaths : {},
    canvasRoot = (value19) => {
      const trimText5 = trimText(value19);
      return trimText5 ? path.resolve(trimText5) : '';
    },
    assetsRoot = canvasRoot(trimText(isPlainObject2.dataDir) || trimText(defaults.dataDir)),
    uploadsRoot = assetsRoot
      ? path.join(assetsRoot, 'uploads')
      : canvasRoot(trimText(isPlainObject2.tempDir) || trimText(defaults.uploadsDir));
  return {
    canvasRoot: canvasRoot(trimText(isPlainObject2.canvasDir) || trimText(defaults.canvasDir)),
    outputRoot: canvasRoot(trimText(isPlainObject2.outputDir) || trimText(defaults.outputDir)),
    uploadsRoot: uploadsRoot,
    assetsRoot: assetsRoot ? path.join(assetsRoot, 'assets') : canvasRoot(defaults.assetsDir),
    workflowsRoot: assetsRoot ? path.join(assetsRoot, 'workflows') : canvasRoot(defaults.workflowsDir),
    workflowThumbsRoot: canvasRoot(
      trimText(defaults.workflowThumbsDir) || getWorkflowThumbRoot(defaults.workflowsDir),
    ),
    recentProjectsStorePath: canvasRoot(defaults.recentProjectsStorePath),
    recoverySnapshotPath: canvasRoot(defaults.recoverySnapshotPath),
  };
}
function rootsSignature(value20) {
  return [
    value20.canvasRoot,
    value20.outputRoot,
    value20.uploadsRoot,
    value20.assetsRoot,
    value20.workflowsRoot,
    value20.workflowThumbsRoot,
    value20.recentProjectsStorePath,
    value20.recoverySnapshotPath,
  ]
    .map((item8) => normalizeComparablePath(item8 || ''))
    .join('|');
}
function publicRoots() {
  return {
    output: 'output/',
    uploads: 'data/uploads/',
    assets: 'data/assets/',
    workflowThumbs: 'data/workflows/thumbs/',
  };
}
function buildRootConfigs(value21) {
  return ROOT_DEFINITIONS.map((args) => ({
    ...args,
    absRoot: trimText(value21?.[args.rootKey]),
  })).filter((item9) => item9.absRoot);
}
export function resolveVirtualPathToAbsolute(value22, value23) {
  const list10 = normalizeVirtualLocalPath(value22);
  if (!list10) return '';
  for (const value24 of buildRootConfigs(value23)) {
    if (!list10.startsWith(value24.virtualPrefix)) continue;
    const args2 = list10.slice(value24.virtualPrefix.length),
      value25 = path.resolve(value24.absRoot, ...args2.split('/').filter(Boolean));
    return isPathInside(value25, value24.absRoot) ? value25 : '';
  }
  return '';
}
function toVirtualPath(value26, value27) {
  const enabled4 = path.relative(value27.absRoot, value26);
  if (!enabled4 || enabled4.startsWith('..') || path.isAbsolute(enabled4)) return '';
  return '' + value27.virtualPrefix + enabled4.replace(/\\/g, '/');
}
function isCleanableJsonCandidate(value28) {
  return /\.waveform\.json$/i.test(path.basename(value28));
}
function isCleanableCandidate(value29, value30) {
  const value31 = path.basename(value29),
    value32 = path.extname(value31).toLowerCase();
  if (value31 === 'assets.index.json') return false;
  if (value32 === '.json') return isCleanableJsonCandidate(value29);
  if (!MEDIA_EXTENSIONS.has(value32)) return false;
  if (value30 === 'workflowThumbs') return IMAGE_EXTENSIONS.has(value32);
  return true;
}
function classifyCandidateKind(value33) {
  if (isCleanableJsonCandidate(value33)) return 'waveform';
  const value34 = path.extname(value33).toLowerCase();
  if (IMAGE_EXTENSIONS.has(value34)) return 'image';
  if (VIDEO_EXTENSIONS.has(value34)) return 'video';
  if (AUDIO_EXTENSIONS.has(value34)) return 'audio';
  return 'media';
}
function collectCandidateFiles(value35, value36) {
  const list11 = [],
    map4 = new Set();
  for (const sourceRoot of buildRootConfigs(value35)) {
    const listFilesRecursive2 = listFilesRecursive(sourceRoot.absRoot, value36, {
      filter: (value37) => isCleanableCandidate(value37, sourceRoot.key),
    });
    for (const value38 of listFilesRecursive2) {
      const absPath = path.resolve(value38),
        comparablePath4 = normalizeComparablePath(absPath);
      if (map4.has(comparablePath4)) continue;
      map4.add(comparablePath4);
      const localPath = toVirtualPath(absPath, sourceRoot);
      if (!localPath) continue;
      let statSync2 = null;
      try {
        statSync2 = statSync(absPath);
      } catch {
        continue;
      }
      if (!statSync2?.isFile?.()) continue;
      list11.push({
        absPath: absPath,
        localPath: localPath,
        size: Number(statSync2.size || 0),
        kind: classifyCandidateKind(absPath),
        modifiedAt: Math.round(Number(statSync2.mtimeMs || 0)),
        sourceRoot: sourceRoot.key,
      });
    }
  }
  return list11;
}
function collectAllReferences({
  roots: roots,
  currentProjectSnapshot: currentProjectSnapshot,
  warnings: warnings,
}) {
  const value39 = new Set();
  collectReferencedLocalPaths(currentProjectSnapshot, value39);
  const listProjectFiles2 = listProjectFiles(roots.canvasRoot, warnings);
  addJsonReferencesFromFiles(listProjectFiles2, value39, warnings, 'project');
  const recentProjectPaths = readRecentProjectPaths(roots.recentProjectsStorePath, warnings);
  return (
    addJsonReferencesFromFiles(recentProjectPaths, value39, warnings, 'recent-project'),
    existsSync(roots.recoverySnapshotPath) &&
      addJsonReferencesFromFiles([roots.recoverySnapshotPath], value39, warnings, 'recovery-snapshot'),
    addJsonReferencesFromFiles(listJsonFiles(roots.assetsRoot, warnings), value39, warnings, 'assets'),
    addJsonReferencesFromFiles(listJsonFiles(roots.workflowsRoot, warnings), value39, warnings, 'workflows'),
    value39
  );
}
function createScanId(value40 = Date.now()) {
  return 'asset-cleanup-' + value40 + '-' + Math.random().toString(36).slice(2, 10);
}
function runScan({
  roots: roots2,
  currentProjectSnapshot: currentProjectSnapshot2,
  scanId: scanId = createScanId(),
  scannedAt: scannedAt = Date.now(),
  scope: scope = 'current',
}) {
  const warnings2 = [],
    references = collectAllReferences({
      roots: roots2,
      currentProjectSnapshot: currentProjectSnapshot2,
      warnings: warnings2,
    }),
    candidateCount = collectCandidateFiles(roots2, warnings2),
    orphanCount = candidateCount
      .filter((item10) => !references.has(item10.localPath))
      .map(({ absPath: absPath2, ...args3 }) => args3)
      .sort(
        (item11, value41) =>
          Number(value41.size || 0) - Number(item11.size || 0) ||
          item11.localPath.localeCompare(value41.localPath),
      ),
    orphanBytes = orphanCount.reduce((item12, value42) => item12 + Number(value42.size || 0), 0);
  return {
    ok: true,
    scanId: scanId,
    scope: scope,
    scannedAt: scannedAt,
    roots: publicRoots(),
    candidateCount: candidateCount.length,
    orphanCount: orphanCount.length,
    orphanBytes: orphanBytes,
    items: orphanCount,
    warnings: warnings2,
    _private: {
      roots: roots2,
      rootsSignature: rootsSignature(roots2),
      currentProjectSnapshot: currentProjectSnapshot2,
      references: references,
    },
  };
}
function publicScanResult(value43) {
  const { _private: _private, ...args4 } = value43;
  return args4;
}
function cloneJsonLike(value44) {
  if (value44 == null) return value44;
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(value44);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(value44));
  } catch {
    return null;
  }
}
export function createLocalAssetCleanupManager({
  getRoots: getRoots,
  trashItem: trashItem,
  now: now = () => Date.now(),
} = {}) {
  const map5 = new Map();
  async function run(options2 = {}) {
    if (typeof getRoots !== 'function') throw new Error('缺少清理目录配置');
    const value45 = await getRoots(options2);
    return value45 && typeof value45 === 'object' ? value45 : {};
  }
  return {
    async scan(options3 = {}) {
      const roots3 = await run(options3 || {}),
        runScan2 = runScan({
          roots: roots3,
          currentProjectSnapshot: cloneJsonLike(options3?.currentProjectSnapshot),
          scanId: createScanId(now()),
          scannedAt: now(),
          scope: trimText(options3?.scope) || 'current',
        });
      map5.set(runScan2.scanId, runScan2);
      if (map5.size > 6) {
        const value46 = map5.keys().next().value;
        if (value46) map5.delete(value46);
      }
      return publicScanResult(runScan2);
    },
    async trash(options4 = {}) {
      if (typeof trashItem !== 'function') throw new Error('当前环境不支持移到回收站');
      const scanId2 = trimText(options4?.scanId),
        roots4 = map5.get(scanId2);
      if (!roots4) throw new Error('扫描结果已过期，请重新扫描');
      const value47 = await run(options4 || {});
      if (rootsSignature(value47) !== roots4._private.rootsSignature) {
        map5.delete(scanId2);
        throw new Error('文件保存路径已变化，请重新扫描');
      }
      const value48 = Array.isArray(options4?.localPaths)
          ? options4.localPaths.map(normalizeVirtualLocalPath).filter(Boolean)
          : [],
        value49 = new Set(value48);
      if (value49.size === 0) return { ok: true, trashedCount: 0, trashedBytes: 0, skipped: [], errors: [] };
      const runScan3 = runScan({
          roots: roots4._private.roots,
          currentProjectSnapshot: cloneJsonLike(
            options4?.currentProjectSnapshot || roots4._private.currentProjectSnapshot,
          ),
          scanId: scanId2,
          scannedAt: now(),
          scope: roots4.scope || 'current',
        }),
        map6 = new Map(runScan3.items.map((item13) => [item13.localPath, item13])),
        skipped = [],
        ok = [];
      let trashedCount = 0,
        trashedBytes = 0;
      for (const localPath2 of value49) {
        const enabled5 = map6.get(localPath2);
        if (!enabled5) {
          skipped.push({ localPath: localPath2, reason: 'referenced-or-missing' });
          continue;
        }
        const absolute = resolveVirtualPathToAbsolute(localPath2, roots4._private.roots);
        if (!absolute || !existsSync(absolute)) {
          skipped.push({ localPath: localPath2, reason: 'missing' });
          continue;
        }
        try {
          (await trashItem(absolute), (trashedCount += 1), (trashedBytes += Number(enabled5.size || 0)));
        } catch (error4) {
          ok.push({ localPath: localPath2, message: String(error4?.message || error4) });
        }
      }
      return (
        map5.delete(scanId2),
        {
          ok: ok.length === 0,
          trashedCount: trashedCount,
          trashedBytes: trashedBytes,
          skipped: skipped,
          errors: ok,
        }
      );
    },
    _scanForTests(options5 = {}) {
      return runScan(options5);
    },
  };
}
export const localAssetCleanupInternals = {
  CLEANABLE_PREFIXES: CLEANABLE_PREFIXES,
  isCleanableCandidate: isCleanableCandidate,
  collectCandidateFiles: collectCandidateFiles,
  collectAllReferences: collectAllReferences,
  rootsSignature: rootsSignature,
};
