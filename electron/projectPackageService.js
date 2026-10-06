import { createHash } from 'node:crypto';
import {
  constants,
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yazl from 'yazl';
import {
  buildProjectFilePayload,
  sanitizeProjectName,
  writeProjectJson,
} from '../src/services/desktopProjectFileStore.js';
import {
  collectReferencedLocalPaths,
  collectVirtualLocalPathsFromString,
  isPathInside,
  normalizeVirtualLocalPath,
  resolveVirtualPathToAbsolute,
} from './localAssetCleanup.js';
import { getVideoPlaybackProxyFilename } from './videoPlaybackProxy.js';
export const PROJECT_PACKAGE_SCHEMA_VERSION = 1;
export const PROJECT_PACKAGE_KIND = 'aiCanvas.projectPackage';
export const PROJECT_PACKAGE_FILE_EXTENSION = '.aicpkg';
export const PROJECT_PACKAGE_MANIFEST_NAME = 'manifest.json';
export const PROJECT_PACKAGE_PROJECT_FILE = 'project/project.aicanvas';
const IMPORT_DIR_ROOT = 'ProjectImports',
  DEFAULT_MAX_IMPORT_PACKAGE_BYTES = 10 * 1024 * 1024 * 1024,
  DEFAULT_MAX_IMPORT_ASSET_BYTES = 5 * 1024 * 1024 * 1024,
  ROOT_DEFINITIONS = Object.freeze([
    { rootKey: 'workflowThumbsRoot', virtualPrefix: 'data/workflows/thumbs/' },
    { rootKey: 'uploadsRoot', virtualPrefix: 'data/uploads/' },
    { rootKey: 'assetsRoot', virtualPrefix: 'data/assets/' },
    { rootKey: 'outputRoot', virtualPrefix: 'output/' },
  ]),
  LOCAL_PATH_KEYS = new Set([
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'posterLocalPath',
    'coverLocalPath',
    'waveformLocalPath',
    'path',
  ]),
  URL_KEYS = new Set([
    'url',
    'src',
    'imageUrl',
    'videoUrl',
    'audioUrl',
    'thumbUrl',
    'posterUrl',
    'coverUrl',
    'sourceUrl',
    'originalUrl',
    'displayUrl',
    'resultUrl',
  ]),
  VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv']),
  RECOVERABLE_DERIVED_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function trimText(value) {
  return String(value || '').trim();
}
function normalizePackagePath(key) {
  const trimText2 = trimText(key);
  if (!trimText2) throw new Error('Project package path is required');
  if (!path.isAbsolute(trimText2)) throw new Error('Project package path must be absolute');
  if (path.extname(trimText2).toLowerCase() !== PROJECT_PACKAGE_FILE_EXTENSION)
    throw new Error('Only .aicpkg project packages are supported');
  return path.resolve(trimText2);
}
export function withProjectPackageExtension(index) {
  const trimText3 = trimText(index);
  if (!trimText3) return trimText3;
  return path.extname(trimText3) ? trimText3 : '' + trimText3 + PROJECT_PACKAGE_FILE_EXTENSION;
}
function stripUtf8Bom(result) {
  return String(result || '').replace(/^\uFEFF/, '');
}
function readJsonFile(data, options) {
  let target = null;
  try {
    target = JSON.parse(stripUtf8Bom(readFileSync(data, 'utf8')));
  } catch (error2) {
    throw new Error('Invalid ' + (options || 'JSON') + ': ' + String(error2?.message || error2));
  }
  if (!isPlainObject(target)) throw new Error((options || 'JSON') + ' must be an object');
  return target;
}
function timestampForFilename(source = new Date()) {
  const run = (next) => String(next).padStart(2, '0');
  return [
    source.getFullYear(),
    run(source.getMonth() + 1),
    run(source.getDate()),
    '-',
    run(source.getHours()),
    run(source.getMinutes()),
    run(source.getSeconds()),
  ].join('');
}
function safePathSegment(current, entry = 'project') {
  const sanitizeProjectName2 = sanitizeProjectName(current || entry)
    .replace(/[.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitizeProjectName2 || entry;
}
function normalizeArchivePath(record) {
  const list = trimText(record).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!list || list.includes('\0')) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(list) || /^[a-zA-Z]:\//.test(list) || list.startsWith('//')) return '';
  const list2 = [];
  for (const payload of list.split('/')) {
    const enabled2 = payload.trim();
    if (!enabled2 || enabled2 === '.') continue;
    if (enabled2 === '..') return '';
    list2.push(enabled2);
  }
  return list2.length > 0 ? list2.join('/') : '';
}
function buildAssetArchivePath(handle) {
  const virtualLocalPath = normalizeVirtualLocalPath(handle);
  if (!virtualLocalPath) return '';
  return 'assets/' + virtualLocalPath;
}
function findRootDefinition(state, config) {
  const localPath = normalizeVirtualLocalPath(state);
  if (!localPath) return null;
  for (const args of ROOT_DEFINITIONS) {
    if (!localPath.startsWith(args.virtualPrefix)) continue;
    const trimText4 = trimText(config?.[args.rootKey]);
    if (!trimText4) return null;
    return {
      ...args,
      absRoot: path.resolve(trimText4),
      localPath: localPath,
      relPath: localPath.slice(args.virtualPrefix.length),
    };
  }
  return null;
}
function clampProgress(scope) {
  const input = Number(scope);
  if (!Number.isFinite(input)) return null;
  return Math.max(0, Math.min(1, input));
}
function emitProgress(handler, error3 = {}) {
  if (typeof handler !== 'function') return;
  const progress = clampProgress(error3.progress);
  handler({
    phase: trimText(error3.phase) || 'working',
    message: trimText(error3.message),
    progress: progress,
    current: Number.isFinite(Number(error3.current)) ? Number(error3.current) : null,
    total: Number.isFinite(Number(error3.total)) ? Number(error3.total) : null,
  });
}
function writeZip(output, value2, value3 = {}) {
  return new Promise((handler2, handler3) => {
    const writeStream = createWriteStream(value2),
      total = Math.max(1, Number(value3.estimatedBytes || 0) || 1);
    let current2 = 0,
      settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      writeStream.once('close', () => handler3(error));
      output.outputStream.destroy();
      writeStream.destroy();
    };
    (writeStream.once('close', () => {
      if (!settled) {
        settled = true;
        handler2();
      }
    }),
      writeStream.once('error', fail),
      output.once('error', fail),
      output.outputStream.once('error', fail),
      output.outputStream.on('data', (list3) => {
        current2 += Number(list3?.length || 0) || 0;
        const value4 = Math.min(1, current2 / total);
        emitProgress(value3.onProgress, {
          phase: 'zipping',
          message: '正在写入项目包...',
          progress: 0.85 + value4 * 0.13,
          current: current2,
          total: total,
        });
      }),
      output.outputStream.pipe(writeStream),
      output.end());
  });
}
function hashFileSha256(value5, value6 = {}) {
  return new Promise((handler4, value7) => {
    const hash = createHash('sha256'),
      readStream = createReadStream(value5);
    (readStream.once('error', value7),
      readStream.on('data', (list4) => {
        (hash.update(list4),
          typeof value6.onChunk === 'function' && value6.onChunk(Number(list4?.length || 0) || 0));
      }),
      readStream.once('end', () => handler4(hash.digest('hex'))));
  });
}
function findExistingAssetPath(value8, value9) {
  const localPath2 = normalizeVirtualLocalPath(value8);
  if (!localPath2) return null;
  const absPath = resolveVirtualPathToAbsolute(localPath2, value9);
  if (!absPath || !existsSync(absPath)) return null;
  const statSync2 = statSync(absPath);
  if (!statSync2.isFile()) return null;
  return { localPath: localPath2, absPath: absPath, size: Number(statSync2.size || 0) };
}
function getRecoverableOriginalVideoFallback(value10, value11) {
  const list5 = normalizeVirtualLocalPath(value10),
    list6 = 'data/assets/original/';
  if (!list5.startsWith(list6)) return null;
  const error4 = path.posix.parse(list5.slice(list6.length)),
    enabled3 = error4.name;
  if (!enabled3 || !VIDEO_EXTENSIONS.has(error4.ext.toLowerCase())) return null;
  const value12 = 'data/assets/derived/video',
    value13 = [
      value12 + '/' + getVideoPlaybackProxyFilename(enabled3),
      value12 + '/' + enabled3 + '.proxy.mp4',
      value12 + '/' + enabled3 + '.mp4',
      value12 + '/' + enabled3 + '.webm',
      value12 + '/' + enabled3 + '.mov',
      value12 + '/' + enabled3 + '.m4v',
      value12 + '/' + enabled3 + '.poster.jpg',
    ];
  for (const value14 of value13) {
    const args2 = findExistingAssetPath(value14, value11);
    if (!args2) continue;
    const value15 = path.extname(args2.localPath).toLowerCase();
    return { ...args2, canReplaceOriginal: RECOVERABLE_DERIVED_VIDEO_EXTENSIONS.has(value15) };
  }
  return null;
}
function collectRemoteMediaReferences(value16, list7 = [], map = new Set()) {
  if (value16 == null || typeof value16 !== 'object') return list7;
  if (map.has(value16)) return list7;
  map.add(value16);
  if (Array.isArray(value16)) {
    for (const value17 of value16) collectRemoteMediaReferences(value17, list7, map);
    return list7;
  }
  const list8 = Object.entries(value16),
    enabled4 = list8.some(([value18, value19]) => {
      if (!LOCAL_PATH_KEYS.has(value18)) return false;
      return collectVirtualLocalPathsFromString(value19).length > 0;
    });
  for (const [key2, url] of list8) {
    if (
      URL_KEYS.has(key2) &&
      typeof url === 'string' &&
      /^https?:\/\//i.test(url) &&
      collectVirtualLocalPathsFromString(url).length === 0 &&
      !enabled4
    ) {
      list7.push({ key: key2, url: url });
      continue;
    }
    collectRemoteMediaReferences(url, list7, map);
  }
  return list7;
}
async function buildExportAssets(value20, value21, value22 = {}) {
  const message = [...collectReferencedLocalPaths(value20)].sort(),
    list9 = [],
    assets = [],
    missing = [],
    warnings = [],
    map2 = new Set(message);
  let current3 = 0;
  emitProgress(value22.onProgress, {
    phase: 'collecting',
    message: message.length ? '正在收集本地素材 0/' + message.length : '正在检查项目素材...',
    progress: 0.05,
    current: 0,
    total: message.length,
  });
  for (let current4 = 0; current4 < message.length; current4 += 1) {
    const localPath3 = message[current4],
      archivePath = buildAssetArchivePath(localPath3),
      absPath2 = resolveVirtualPathToAbsolute(localPath3, value21);
    if (!archivePath || !absPath2 || !existsSync(absPath2)) {
      const fallbackLocalPath = getRecoverableOriginalVideoFallback(localPath3, value21);
      if (fallbackLocalPath) {
        warnings.push({
          type: 'missing-original-video-fallback',
          localPath: localPath3,
          fallbackLocalPath: fallbackLocalPath.localPath,
          canReplaceOriginal: fallbackLocalPath.canReplaceOriginal,
        });
        !map2.has(fallbackLocalPath.localPath) &&
          (map2.add(fallbackLocalPath.localPath), message.push(fallbackLocalPath.localPath));
        continue;
      }
      missing.push(localPath3);
      continue;
    }
    const statSync3 = statSync(absPath2);
    if (!statSync3.isFile()) {
      missing.push(localPath3);
      continue;
    }
    (list9.push({
      localPath: localPath3,
      archivePath: archivePath,
      absPath: absPath2,
      size: Number(statSync3.size || 0),
    }),
      emitProgress(value22.onProgress, {
        phase: 'collecting',
        message: '正在收集本地素材 ' + (current4 + 1) + '/' + message.length,
        progress: 0.05 + ((current4 + 1) / Math.max(1, message.length)) * 0.2,
        current: current4 + 1,
        total: message.length,
      }));
  }
  const total2 = list9.reduce((item2, value23) => item2 + Number(value23.size || 0), 0);
  for (let value24 = 0; value24 < list9.length; value24 += 1) {
    const args3 = list9[value24];
    assets.push({
      ...args3,
      sha256: await hashFileSha256(args3.absPath, {
        onChunk: (value25) => {
          ((current3 += value25),
            emitProgress(value22.onProgress, {
              phase: 'hashing',
              message: '正在校验素材 ' + (value24 + 1) + '/' + list9.length,
              progress: 0.25 + (current3 / Math.max(1, total2)) * 0.5,
              current: current3,
              total: total2,
            }));
        },
      }),
    });
  }
  return { assets: assets, missing: missing, warnings: warnings };
}
export async function exportProjectPackageToPath({
  outputPath: outputPath,
  multiData: multiData,
  projectId: projectId = '',
  projectName: projectName = '',
  appVersion: appVersion = '',
  roots: roots,
  now: now = new Date(),
  onProgress: onProgress,
} = {}) {
  const path2 = path.resolve(withProjectPackageExtension(outputPath));
  if (path.extname(path2).toLowerCase() !== PROJECT_PACKAGE_FILE_EXTENSION)
    throw new Error('Project package output path must end with .aicpkg');
  emitProgress(onProgress, { phase: 'preparing', message: '正在准备项目包...', progress: 0.02 });
  const projectFilePayload = buildProjectFilePayload(multiData || {}),
    list10 = collectRemoteMediaReferences(projectFilePayload);
  if (list10.length > 0) {
    const error5 = new Error('Project package export blocked: remote media must be saved locally first');
    ((error5.code = 'REMOTE_MEDIA_NOT_LOCALIZED'), (error5.remoteMedia = list10.slice(0, 20)));
    throw error5;
  }
  const {
    assets: assets2,
    missing: missing2,
    warnings: warnings2,
  } = await buildExportAssets(projectFilePayload, roots || {}, { onProgress: onProgress });
  if (missing2.length > 0) {
    const error6 = new Error('Project package export blocked: missing local assets');
    ((error6.code = 'MISSING_LOCAL_ASSETS'), (error6.missing = missing2));
    throw error6;
  }
  const assets3 = assets2.map(({ absPath: absPath3, ...args4 }) => args4),
    warnings3 = {
      schemaVersion: PROJECT_PACKAGE_SCHEMA_VERSION,
      packageKind: PROJECT_PACKAGE_KIND,
      exportedAt: now.toISOString(),
      appVersion: trimText(appVersion),
      project: {
        projectId: trimText(projectId),
        projectName: safePathSegment(projectName || projectId || '未命名画布', '未命名画布'),
      },
      projectFile: PROJECT_PACKAGE_PROJECT_FILE,
      assets: assets3,
      warnings: warnings2,
    };
  mkdirSync(path.dirname(path2), { recursive: true });
  const value26 = new yazl.ZipFile(),
    estimatedBytes = Buffer.from(JSON.stringify(warnings3, null, 2) + '\n', 'utf8'),
    list11 = Buffer.from(JSON.stringify(projectFilePayload, null, 2) + '\n', 'utf8');
  (value26.addBuffer(estimatedBytes, PROJECT_PACKAGE_MANIFEST_NAME),
    value26.addBuffer(list11, PROJECT_PACKAGE_PROJECT_FILE));
  for (const value27 of assets2) {
    value26.addFile(value27.absPath, value27.archivePath);
  }
  const temporaryDirectory = mkdtempSync(path.join(path.dirname(path2), '.aicpkg-export-'));
  const temporaryPath = path.join(temporaryDirectory, path.basename(path2));
  try {
    emitProgress(onProgress, {
      phase: 'zipping',
      message: '正在写入项目包...',
      progress: 0.85,
      current: 0,
      total: assets2.length,
    });
    await writeZip(value26, temporaryPath, {
      onProgress: onProgress,
      estimatedBytes:
        estimatedBytes.length +
        list11.length +
        assets2.reduce((item3, value28) => item3 + Number(value28.size || 0), 0),
    });
    renameSync(temporaryPath, path2);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
  emitProgress(onProgress, {
    phase: 'done',
    message: '项目包收集完成',
    progress: 1,
    current: assets2.length,
    total: assets2.length,
  });
  return {
    success: true,
    canceled: false,
    path: path2,
    filename: path.basename(path2),
    assetsCount: assets2.length,
    warnings: warnings3.warnings,
  };
}
function assertImportPackageSize(value29, value30) {
  const statSync4 = statSync(value29);
  if (!statSync4.isFile()) throw new Error('Project package path is not a file');
  const value31 = Number(value30 || DEFAULT_MAX_IMPORT_PACKAGE_BYTES);
  if (Number(statSync4.size || 0) > value31) throw new Error('Project package is too large');
}
function assertPackageManifest(value32) {
  if (!isPlainObject(value32)) throw new Error('Invalid project package manifest');
  if (Number(value32.schemaVersion) !== PROJECT_PACKAGE_SCHEMA_VERSION)
    throw new Error('Unsupported project package schemaVersion');
  if (value32.packageKind !== PROJECT_PACKAGE_KIND) throw new Error('Invalid project package kind');
  const archivePath2 = normalizeArchivePath(value32.projectFile);
  if (archivePath2 !== PROJECT_PACKAGE_PROJECT_FILE) throw new Error('Invalid project package projectFile');
  if (!Array.isArray(value32.assets)) throw new Error('Invalid project package assets');
}
function assertArchivePathInsideTemp(value33, value34) {
  const args5 = normalizeArchivePath(value34);
  if (!args5) return '';
  const value35 = path.resolve(value33, ...args5.split('/'));
  return isPathInside(value35, value33) ? value35 : '';
}
function allocateUniqueFilePath(value36) {
  if (!existsSync(value36)) return value36;
  const value37 = path.dirname(value36),
    error7 = path.parse(value36);
  for (let count = 2; count < 1000; count += 1) {
    const value38 = path.join(value37, error7.name + ' (' + count + ')' + error7.ext);
    if (!existsSync(value38)) return value38;
  }
  throw new Error('Unable to allocate unique import file path');
}
function allocateImportedAssetTarget(value39, value40, value41) {
  const rootDefinition = findRootDefinition(value39, value40);
  if (!rootDefinition) throw new Error('Unsupported local asset path: ' + value39);
  const args6 = rootDefinition.relPath.split('/').filter(Boolean),
    args7 = [IMPORT_DIR_ROOT, value41, ...args6].join('/'),
    absPath4 = allocateUniqueFilePath(path.resolve(rootDefinition.absRoot, ...args7.split('/')));
  if (!isPathInside(absPath4, rootDefinition.absRoot))
    throw new Error('Invalid imported asset target: ' + value39);
  const value42 = path.relative(rootDefinition.absRoot, absPath4).replace(/\\/g, '/');
  return { absPath: absPath4, localPath: '' + rootDefinition.virtualPrefix + value42 };
}
function isUrlLikeKey(value43) {
  return URL_KEYS.has(String(value43 || ''));
}
function rewriteStringLocalReferences(value44, map3, value45 = '') {
  const list12 = String(value44 || '').split('|'),
    list13 = list12.map((item4) => {
      const virtualLocalPath2 = normalizeVirtualLocalPath(item4),
        enabled5 = virtualLocalPath2 ? map3.get(virtualLocalPath2) : '';
      if (!enabled5) return item4;
      const value46 = item4.trim();
      if (LOCAL_PATH_KEYS.has(value45)) return enabled5;
      if (isUrlLikeKey(value45) || /^https?:\/\//i.test(value46) || value46.startsWith('/'))
        return '/' + enabled5;
      return enabled5;
    });
  return list13.join('|');
}
function rewriteProjectLocalReferences(list14, map4, value47 = '') {
  if (typeof list14 === 'string') {
    const list15 = collectVirtualLocalPathsFromString(list14);
    if (!list15.some((item5) => map4.has(item5))) return list14;
    return rewriteStringLocalReferences(list14, map4, value47);
  }
  if (Array.isArray(list14))
    return list14.map((item6) => rewriteProjectLocalReferences(item6, map4, value47));
  if (!isPlainObject(list14)) return list14;
  const value48 = {};
  for (const [value49, value50] of Object.entries(list14)) {
    value48[value49] = rewriteProjectLocalReferences(value50, map4, value49);
  }
  return value48;
}
function allocateUniqueProjectPath(value51, value52) {
  const value53 = path.resolve(trimText(value51));
  mkdirSync(value53, { recursive: true });
  const safePathSegment2 = safePathSegment((value52 || '未命名画布') + ' - 导入', 'imported-project'),
    value54 = path.join(value53, safePathSegment2 + '.aicanvas');
  if (!existsSync(value54)) return value54;
  for (let count2 = 2; count2 < 1000; count2 += 1) {
    const value55 = path.join(value53, safePathSegment2 + ' (' + count2 + ').aicanvas');
    if (!existsSync(value55)) return value55;
  }
  throw new Error('Unable to allocate imported project file path');
}
function importDirNameForProject(value56, value57 = new Date()) {
  return safePathSegment((value56 || 'Project') + '-' + timestampForFilename(value57), 'Project');
}
async function validateImportAssets(value58, value59, value60, value61 = {}) {
  const value62 = Number(value61.maxAssetBytes || DEFAULT_MAX_IMPORT_ASSET_BYTES),
    list16 = [],
    map5 = new Set();
  for (const value63 of value58.assets) {
    if (!isPlainObject(value63)) throw new Error('Invalid project package asset');
    const localPath4 = normalizeVirtualLocalPath(value63.localPath),
      archivePath3 = normalizeArchivePath(value63.archivePath);
    if (
      !localPath4 ||
      String(value63.localPath || '')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '') !== localPath4
    )
      throw new Error('Invalid project package asset localPath');
    if (!archivePath3 || !archivePath3.startsWith('assets/'))
      throw new Error('Invalid project package asset path');
    if (map5.has(localPath4)) continue;
    map5.add(localPath4);
    const absPath5 = assertArchivePathInsideTemp(value59, archivePath3);
    if (!absPath5 || !existsSync(absPath5))
      throw new Error('Project package asset is missing: ' + localPath4);
    const statSync5 = statSync(absPath5);
    if (!statSync5.isFile()) throw new Error('Project package asset is not a file: ' + localPath4);
    const size = Number(statSync5.size || 0);
    if (size > value62) throw new Error('Project package asset is too large');
    const count3 = Number(value63.size || 0) || 0;
    if (count3 > 0 && count3 !== size) throw new Error('Project package asset size mismatch: ' + localPath4);
    const expectedHash = String(value63.sha256 || '')
      .trim()
      .toLowerCase();
    if (expectedHash && !/^[a-f0-9]{64}$/.test(expectedHash))
      throw new Error('Project package asset SHA-256 is invalid: ' + localPath4);
    if (expectedHash && (await hashFileSha256(absPath5)).toLowerCase() !== expectedHash)
      throw new Error('Project package asset SHA-256 mismatch: ' + localPath4);
    if (!findRootDefinition(localPath4, value60))
      throw new Error('Unsupported project package asset localPath: ' + localPath4);
    list16.push({ localPath: localPath4, archivePath: archivePath3, absPath: absPath5, size: size });
  }
  return list16;
}
export async function importProjectPackageFromPath({
  packagePath: packagePath,
  roots: roots2,
  projectRoot: projectRoot,
  tempRoot: tempRoot = os.tmpdir(),
  now: now = new Date(),
  maxPackageBytes: maxPackageBytes = DEFAULT_MAX_IMPORT_PACKAGE_BYTES,
  maxAssetBytes: maxAssetBytes = DEFAULT_MAX_IMPORT_ASSET_BYTES,
} = {}) {
  const sourcePackagePath = normalizePackagePath(packagePath);
  assertImportPackageSize(sourcePackagePath, maxPackageBytes);
  const value64 = path.resolve(tempRoot || os.tmpdir());
  mkdirSync(value64, { recursive: true });
  const mkdtempSync2 = mkdtempSync(path.join(value64, 'aicpkg-'));
  try {
    // Reuse the bounded streaming extractor used by full-package restore.
    const { extractFullPackage } = await import('./fullProjectPackageService.js');
    const extractedEntries = await extractFullPackage(sourcePackagePath, mkdtempSync2);
    const value65 = path.join(mkdtempSync2, PROJECT_PACKAGE_MANIFEST_NAME);
    if (!existsSync(value65)) throw new Error('Project package manifest is missing');
    const args8 = readJsonFile(value65, 'project package manifest');
    assertPackageManifest(args8);
    const expectedEntries = new Set([
      PROJECT_PACKAGE_MANIFEST_NAME,
      PROJECT_PACKAGE_PROJECT_FILE,
      ...args8.assets.map((asset) => normalizeArchivePath(asset?.archivePath)).filter(Boolean),
    ]);
    if (
      expectedEntries.size !== extractedEntries.size ||
      [...extractedEntries.keys()].some((name) => !expectedEntries.has(name))
    )
      throw new Error('Project package contains unlisted archive entries');
    const assertArchivePathInsideTemp2 = assertArchivePathInsideTemp(mkdtempSync2, args8.projectFile);
    if (!assertArchivePathInsideTemp2 || !existsSync(assertArchivePathInsideTemp2))
      throw new Error('Project package project file is missing');
    const jsonFile = readJsonFile(assertArchivePathInsideTemp2, 'project package project file'),
      projectName2 = safePathSegment(
        args8.project?.projectName ||
          args8.project?.projectId ||
          path.basename(sourcePackagePath, PROJECT_PACKAGE_FILE_EXTENSION),
        'Imported Project',
      ),
      importDirNameForProject2 = importDirNameForProject(projectName2, now),
      assetsCount = await validateImportAssets(args8, mkdtempSync2, roots2 || {}, {
        maxAssetBytes: maxAssetBytes,
      }),
      map6 = new Map(),
      value66 = assetsCount.map((from2) => {
        const to = allocateImportedAssetTarget(from2.localPath, roots2 || {}, importDirNameForProject2);
        return (map6.set(from2.localPath, to.localPath), { from: from2.absPath, to: to.absPath });
      });
    const createdAssets = [],
      createdDirectories = new Set();
    let importedProjectPath = '';
    try {
      for (const item of value66) {
        let directory = path.dirname(item.to);
        const missingDirectories = [];
        while (directory && !existsSync(directory)) {
          missingDirectories.push(directory);
          const parent = path.dirname(directory);
          if (parent === directory) break;
          directory = parent;
        }
        missingDirectories.forEach((directoryPath) => createdDirectories.add(directoryPath));
        mkdirSync(path.dirname(item.to), { recursive: true });
        copyFileSync(item.from, item.to, constants.COPYFILE_EXCL);
        createdAssets.push(item.to);
      }
      const importedData = rewriteProjectLocalReferences(jsonFile, map6);
      importedProjectPath = allocateUniqueProjectPath(projectRoot, projectName2);
      writeProjectJson(importedProjectPath, importedData);
      return {
        success: true,
        canceled: false,
        projectPath: importedProjectPath,
        projectName: projectName2 + ' - 导入',
        filename: path.basename(importedProjectPath),
        data: importedData,
        assetsCount: assetsCount.length,
        sourcePackagePath: sourcePackagePath,
      };
    } catch (error) {
      if (importedProjectPath) rmSync(importedProjectPath, { force: true });
      for (const filePath of createdAssets.reverse()) rmSync(filePath, { force: true });
      for (const directory of [...createdDirectories].sort((a, b) => b.length - a.length)) {
        try {
          rmdirSync(directory);
        } catch {}
      }
      throw error;
    }
  } finally {
    rmSync(mkdtempSync2, { recursive: true, force: true });
  }
}
export const projectPackageInternals = {
  collectRemoteMediaReferences: collectRemoteMediaReferences,
  rewriteProjectLocalReferences: rewriteProjectLocalReferences,
  normalizeArchivePath: normalizeArchivePath,
  allocateImportedAssetTarget: allocateImportedAssetTarget,
};
