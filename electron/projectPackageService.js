import { createHash } from 'node:crypto';
import {
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import extract_zip from 'extract-zip';
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
export const PROJECT_PACKAGE_SCHEMA_VERSION = 1;
export const PROJECT_PACKAGE_KIND = 'aiCanvas.projectPackage';
export const PROJECT_PACKAGE_FILE_EXTENSION = '.aicpkg';
export const PROJECT_PACKAGE_MANIFEST_NAME = 'manifest.json';
export const PROJECT_PACKAGE_PROJECT_FILE = 'project/project.aicanvas';
const IMPORT_DIR_ROOT = 'ProjectImports',
  DEFAULT_MAX_IMPORT_PACKAGE_BYTES = 10 * 0x400 * 0x400 * 0x400,
  DEFAULT_MAX_IMPORT_ASSET_BYTES = 5 * 0x400 * 0x400 * 0x400,
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
function isPlainObject(_0x5ea462) {
  return !!_0x5ea462 && typeof _0x5ea462 === 'object' && !Array.isArray(_0x5ea462);
}
function trimText(_0x4b6c29) {
  return String(_0x4b6c29 || '').trim();
}
function normalizePackagePath(_0x276b31) {
  const _0x576e18 = trimText(_0x276b31);
  if (!_0x576e18) throw new Error('Project package path is required');
  if (!path.isAbsolute(_0x576e18)) throw new Error('Project package path must be absolute');
  if (path.extname(_0x576e18).toLowerCase() !== PROJECT_PACKAGE_FILE_EXTENSION)
    throw new Error('Only .aicpkg project packages are supported');
  return path.resolve(_0x576e18);
}
export function withProjectPackageExtension(_0x5bd350) {
  const _0x1b53b7 = trimText(_0x5bd350);
  if (!_0x1b53b7) return _0x1b53b7;
  return path.extname(_0x1b53b7) ? _0x1b53b7 : '' + _0x1b53b7 + PROJECT_PACKAGE_FILE_EXTENSION;
}
function stripUtf8Bom(_0x37cd0b) {
  return String(_0x37cd0b || '').replace(/^\uFEFF/, '');
}
function readJsonFile(_0x2c08d6, _0x1c54da) {
  let _0x7871bc = null;
  try {
    _0x7871bc = JSON.parse(stripUtf8Bom(readFileSync(_0x2c08d6, 'utf8')));
  } catch (_0x56929d) {
    throw new Error('Invalid ' + (_0x1c54da || 'JSON') + ': ' + String(_0x56929d?.message || _0x56929d));
  }
  if (!isPlainObject(_0x7871bc)) throw new Error((_0x1c54da || 'JSON') + ' must be an object');
  return _0x7871bc;
}
function timestampForFilename(_0x4e9252 = new Date()) {
  const _0x27f7f0 = (_0x38165a) => String(_0x38165a).padStart(2, '0');
  return [
    _0x4e9252.getFullYear(),
    _0x27f7f0(_0x4e9252.getMonth() + 1),
    _0x27f7f0(_0x4e9252.getDate()),
    '-',
    _0x27f7f0(_0x4e9252.getHours()),
    _0x27f7f0(_0x4e9252.getMinutes()),
    _0x27f7f0(_0x4e9252.getSeconds()),
  ].join('');
}
function safePathSegment(_0x29b42c, _0x368f77 = 'project') {
  const _0x3a99db = sanitizeProjectName(_0x29b42c || _0x368f77)
    .replace(/[.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return _0x3a99db || _0x368f77;
}
function normalizeArchivePath(_0x83123) {
  const _0x1240ab = trimText(_0x83123).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!_0x1240ab || _0x1240ab.includes('\0')) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(_0x1240ab) || /^[a-zA-Z]:\//.test(_0x1240ab) || _0x1240ab.startsWith('//'))
    return '';
  const _0x3bf4cb = [];
  for (const _0x217e4e of _0x1240ab.split('/')) {
    const _0x549fb4 = _0x217e4e.trim();
    if (!_0x549fb4 || _0x549fb4 === '.') continue;
    if (_0x549fb4 === '..') return '';
    _0x3bf4cb.push(_0x549fb4);
  }
  return _0x3bf4cb.length > 0 ? _0x3bf4cb.join('/') : '';
}
function buildAssetArchivePath(_0x5229b3) {
  const _0x14a619 = normalizeVirtualLocalPath(_0x5229b3);
  if (!_0x14a619) return '';
  return 'assets/' + _0x14a619;
}
function findRootDefinition(_0x2c128d, _0x581937) {
  const _0x1251fe = normalizeVirtualLocalPath(_0x2c128d);
  if (!_0x1251fe) return null;
  for (const _0x37a589 of ROOT_DEFINITIONS) {
    if (!_0x1251fe.startsWith(_0x37a589.virtualPrefix)) continue;
    const _0x5b3df1 = trimText(_0x581937?.[_0x37a589.rootKey]);
    if (!_0x5b3df1) return null;
    return {
      ..._0x37a589,
      absRoot: path.resolve(_0x5b3df1),
      localPath: _0x1251fe,
      relPath: _0x1251fe.slice(_0x37a589.virtualPrefix.length),
    };
  }
  return null;
}
function clampProgress(_0x28e71a) {
  const _0xe0d21 = Number(_0x28e71a);
  if (!Number.isFinite(_0xe0d21)) return null;
  return Math.max(0, Math.min(1, _0xe0d21));
}
function emitProgress(_0x36a33a, _0x5cfec3 = {}) {
  if (typeof _0x36a33a !== 'function') return;
  const _0x453472 = clampProgress(_0x5cfec3.progress);
  _0x36a33a({
    phase: trimText(_0x5cfec3.phase) || 'working',
    message: trimText(_0x5cfec3.message),
    progress: _0x453472,
    current: Number.isFinite(Number(_0x5cfec3.current)) ? Number(_0x5cfec3.current) : null,
    total: Number.isFinite(Number(_0x5cfec3.total)) ? Number(_0x5cfec3.total) : null,
  });
}
function writeZip(_0x289ea3, _0x87627f, _0x48b23a = {}) {
  return new Promise((_0x252927, _0x5107e8) => {
    const _0x275f8d = createWriteStream(_0x87627f),
      _0x5d2565 = Math.max(1, Number(_0x48b23a.estimatedBytes || 0) || 1);
    let _0x461bdb = 0;
    (_0x275f8d.once('close', _0x252927),
      _0x275f8d.once('error', _0x5107e8),
      _0x289ea3.outputStream.once('error', _0x5107e8),
      _0x289ea3.outputStream.on('data', (_0x4a1ac4) => {
        _0x461bdb += Number(_0x4a1ac4?.length || 0) || 0;
        const _0x556867 = Math.min(1, _0x461bdb / _0x5d2565);
        emitProgress(_0x48b23a.onProgress, {
          phase: 'zipping',
          message: '正在写入项目包...',
          progress: 0.85 + _0x556867 * 0.13,
          current: _0x461bdb,
          total: _0x5d2565,
        });
      }),
      _0x289ea3.outputStream.pipe(_0x275f8d),
      _0x289ea3.end());
  });
}
function hashFileSha256(_0x17cda0, _0x4b1fda = {}) {
  return new Promise((_0x1a7836, _0x2407eb) => {
    const _0x372aca = createHash('sha256'),
      _0x69c651 = createReadStream(_0x17cda0);
    (_0x69c651.once('error', _0x2407eb),
      _0x69c651.on('data', (_0x183ad6) => {
        (_0x372aca.update(_0x183ad6),
          typeof _0x4b1fda.onChunk === 'function' && _0x4b1fda.onChunk(Number(_0x183ad6?.length || 0) || 0));
      }),
      _0x69c651.once('end', () => _0x1a7836(_0x372aca.digest('hex'))));
  });
}
function findExistingAssetPath(_0x35cda1, _0x4d0360) {
  const _0x1d8b65 = normalizeVirtualLocalPath(_0x35cda1);
  if (!_0x1d8b65) return null;
  const _0x45d9b1 = resolveVirtualPathToAbsolute(_0x1d8b65, _0x4d0360);
  if (!_0x45d9b1 || !existsSync(_0x45d9b1)) return null;
  const _0x3bc23f = statSync(_0x45d9b1);
  if (!_0x3bc23f.isFile()) return null;
  return { localPath: _0x1d8b65, absPath: _0x45d9b1, size: Number(_0x3bc23f.size || 0) };
}
function getRecoverableOriginalVideoFallback(_0x5ab478, _0x13d24e) {
  const _0x207d41 = normalizeVirtualLocalPath(_0x5ab478),
    _0x3d6268 = 'data/assets/original/';
  if (!_0x207d41.startsWith(_0x3d6268)) return null;
  const _0x1f92cb = path.posix.parse(_0x207d41.slice(_0x3d6268.length)),
    _0x4023db = _0x1f92cb.name;
  if (!_0x4023db || !VIDEO_EXTENSIONS.has(_0x1f92cb.ext.toLowerCase())) return null;
  const _0x227102 = 'data/assets/derived/video',
    _0x5c842a = [
      _0x227102 + '/' + _0x4023db + '.proxy.mp4',
      _0x227102 + '/' + _0x4023db + '.mp4',
      _0x227102 + '/' + _0x4023db + '.webm',
      _0x227102 + '/' + _0x4023db + '.mov',
      _0x227102 + '/' + _0x4023db + '.m4v',
      _0x227102 + '/' + _0x4023db + '.poster.jpg',
    ];
  for (const _0x4dd9ad of _0x5c842a) {
    const _0x36249a = findExistingAssetPath(_0x4dd9ad, _0x13d24e);
    if (!_0x36249a) continue;
    const _0x53c753 = path.extname(_0x36249a.localPath).toLowerCase();
    return { ..._0x36249a, canReplaceOriginal: RECOVERABLE_DERIVED_VIDEO_EXTENSIONS.has(_0x53c753) };
  }
  return null;
}
function collectRemoteMediaReferences(_0x4bf51f, _0x2a9e3d = [], _0x1fad2a = new Set()) {
  if (_0x4bf51f == null || typeof _0x4bf51f !== 'object') return _0x2a9e3d;
  if (_0x1fad2a.has(_0x4bf51f)) return _0x2a9e3d;
  _0x1fad2a.add(_0x4bf51f);
  if (Array.isArray(_0x4bf51f)) {
    for (const _0xbc43cb of _0x4bf51f) collectRemoteMediaReferences(_0xbc43cb, _0x2a9e3d, _0x1fad2a);
    return _0x2a9e3d;
  }
  const _0x19908a = Object.entries(_0x4bf51f),
    _0x25b16f = _0x19908a.some(([_0x2c7c94, _0x18e652]) => {
      if (!LOCAL_PATH_KEYS.has(_0x2c7c94)) return false;
      return collectVirtualLocalPathsFromString(_0x18e652).length > 0;
    });
  for (const [_0x104806, _0x3e6d44] of _0x19908a) {
    if (
      URL_KEYS.has(_0x104806) &&
      typeof _0x3e6d44 === 'string' &&
      /^https?:\/\//i.test(_0x3e6d44) &&
      collectVirtualLocalPathsFromString(_0x3e6d44).length === 0 &&
      !_0x25b16f
    ) {
      _0x2a9e3d.push({ key: _0x104806, url: _0x3e6d44 });
      continue;
    }
    collectRemoteMediaReferences(_0x3e6d44, _0x2a9e3d, _0x1fad2a);
  }
  return _0x2a9e3d;
}
async function buildExportAssets(_0x3b6810, _0x1a0c35, _0x53b827 = {}) {
  const _0x4cdd64 = [...collectReferencedLocalPaths(_0x3b6810)].sort(),
    _0x57d1d3 = [],
    _0x10b277 = [],
    _0x5f4e55 = [],
    _0x233cb2 = [],
    _0x4aa817 = new Set(_0x4cdd64);
  let _0x4d69e4 = 0;
  emitProgress(_0x53b827.onProgress, {
    phase: 'collecting',
    message: _0x4cdd64.length ? '正在收集本地素材 0/' + _0x4cdd64.length : '正在检查项目素材...',
    progress: 0.05,
    current: 0,
    total: _0x4cdd64.length,
  });
  for (let _0x4ebe06 = 0; _0x4ebe06 < _0x4cdd64.length; _0x4ebe06 += 1) {
    const _0x3b817c = _0x4cdd64[_0x4ebe06],
      _0x2fcb5a = buildAssetArchivePath(_0x3b817c),
      _0x12c317 = resolveVirtualPathToAbsolute(_0x3b817c, _0x1a0c35);
    if (!_0x2fcb5a || !_0x12c317 || !existsSync(_0x12c317)) {
      const _0x46c08f = getRecoverableOriginalVideoFallback(_0x3b817c, _0x1a0c35);
      if (_0x46c08f) {
        _0x233cb2.push({
          type: 'missing-original-video-fallback',
          localPath: _0x3b817c,
          fallbackLocalPath: _0x46c08f.localPath,
          canReplaceOriginal: _0x46c08f.canReplaceOriginal,
        });
        !_0x4aa817.has(_0x46c08f.localPath) &&
          (_0x4aa817.add(_0x46c08f.localPath), _0x4cdd64.push(_0x46c08f.localPath));
        continue;
      }
      _0x5f4e55.push(_0x3b817c);
      continue;
    }
    const _0xc1171c = statSync(_0x12c317);
    if (!_0xc1171c.isFile()) {
      _0x5f4e55.push(_0x3b817c);
      continue;
    }
    (_0x57d1d3.push({
      localPath: _0x3b817c,
      archivePath: _0x2fcb5a,
      absPath: _0x12c317,
      size: Number(_0xc1171c.size || 0),
    }),
      emitProgress(_0x53b827.onProgress, {
        phase: 'collecting',
        message: '正在收集本地素材 ' + (_0x4ebe06 + 1) + '/' + _0x4cdd64.length,
        progress: 0.05 + ((_0x4ebe06 + 1) / Math.max(1, _0x4cdd64.length)) * 0.2,
        current: _0x4ebe06 + 1,
        total: _0x4cdd64.length,
      }));
  }
  const _0x1e6208 = _0x57d1d3.reduce((_0x35714, _0x11f722) => _0x35714 + Number(_0x11f722.size || 0), 0);
  for (let _0x339518 = 0; _0x339518 < _0x57d1d3.length; _0x339518 += 1) {
    const _0x26f2b = _0x57d1d3[_0x339518];
    _0x10b277.push({
      ..._0x26f2b,
      sha256: await hashFileSha256(_0x26f2b.absPath, {
        onChunk: (_0x215ae0) => {
          ((_0x4d69e4 += _0x215ae0),
            emitProgress(_0x53b827.onProgress, {
              phase: 'hashing',
              message: '正在校验素材 ' + (_0x339518 + 1) + '/' + _0x57d1d3.length,
              progress: 0.25 + (_0x4d69e4 / Math.max(1, _0x1e6208)) * 0.5,
              current: _0x4d69e4,
              total: _0x1e6208,
            }));
        },
      }),
    });
  }
  return { assets: _0x10b277, missing: _0x5f4e55, warnings: _0x233cb2 };
}
export async function exportProjectPackageToPath({
  outputPath: _0x42d841,
  multiData: _0x193624,
  projectId: projectId = '',
  projectName: projectName = '',
  appVersion: appVersion = '',
  roots: _0x155965,
  now: now = new Date(),
  onProgress: _0x4c8ce8,
} = {}) {
  const _0x46d258 = path.resolve(withProjectPackageExtension(_0x42d841));
  if (path.extname(_0x46d258).toLowerCase() !== PROJECT_PACKAGE_FILE_EXTENSION)
    throw new Error('Project package output path must end with .aicpkg');
  emitProgress(_0x4c8ce8, { phase: 'preparing', message: '正在准备项目包...', progress: 0.02 });
  const _0xa8700b = buildProjectFilePayload(_0x193624 || {}),
    _0x135028 = collectRemoteMediaReferences(_0xa8700b);
  if (_0x135028.length > 0) {
    const _0xac0fd7 = new Error('Project package export blocked: remote media must be saved locally first');
    ((_0xac0fd7.code = 'REMOTE_MEDIA_NOT_LOCALIZED'), (_0xac0fd7.remoteMedia = _0x135028.slice(0, 20)));
    throw _0xac0fd7;
  }
  const {
    assets: _0x112b3f,
    missing: _0x560893,
    warnings: _0x220daf,
  } = await buildExportAssets(_0xa8700b, _0x155965 || {}, { onProgress: _0x4c8ce8 });
  if (_0x560893.length > 0) {
    const _0x2e0b5f = new Error('Project package export blocked: missing local assets');
    ((_0x2e0b5f.code = 'MISSING_LOCAL_ASSETS'), (_0x2e0b5f.missing = _0x560893));
    throw _0x2e0b5f;
  }
  const _0x35fd5b = _0x112b3f.map(({ absPath: _0x371df1, ..._0x1b08fe }) => _0x1b08fe),
    _0x4ab3e4 = {
      schemaVersion: PROJECT_PACKAGE_SCHEMA_VERSION,
      packageKind: PROJECT_PACKAGE_KIND,
      exportedAt: now.toISOString(),
      appVersion: trimText(appVersion),
      project: {
        projectId: trimText(projectId),
        projectName: safePathSegment(projectName || projectId || '未命名画布', '未命名画布'),
      },
      projectFile: PROJECT_PACKAGE_PROJECT_FILE,
      assets: _0x35fd5b,
      warnings: _0x220daf,
    };
  mkdirSync(path.dirname(_0x46d258), { recursive: true });
  const _0x414156 = new yazl['ZipFile'](),
    _0x28c5a3 = Buffer.from(JSON.stringify(_0x4ab3e4, null, 2) + '\n', 'utf8'),
    _0x581083 = Buffer.from(JSON.stringify(_0xa8700b, null, 2) + '\n', 'utf8');
  (_0x414156.addBuffer(_0x28c5a3, PROJECT_PACKAGE_MANIFEST_NAME),
    _0x414156.addBuffer(_0x581083, PROJECT_PACKAGE_PROJECT_FILE));
  for (const _0xdb462e of _0x112b3f) {
    _0x414156.addFile(_0xdb462e.absPath, _0xdb462e.archivePath);
  }
  return (
    emitProgress(_0x4c8ce8, {
      phase: 'zipping',
      message: '正在写入项目包...',
      progress: 0.85,
      current: 0,
      total: _0x112b3f.length,
    }),
    await writeZip(_0x414156, _0x46d258, {
      onProgress: _0x4c8ce8,
      estimatedBytes:
        _0x28c5a3.length +
        _0x581083.length +
        _0x112b3f.reduce((_0x50dde7, _0x357c96) => _0x50dde7 + Number(_0x357c96.size || 0), 0),
    }),
    emitProgress(_0x4c8ce8, {
      phase: 'done',
      message: '项目包收集完成',
      progress: 1,
      current: _0x112b3f.length,
      total: _0x112b3f.length,
    }),
    {
      success: true,
      canceled: false,
      path: _0x46d258,
      filename: path.basename(_0x46d258),
      assetsCount: _0x112b3f.length,
      warnings: _0x4ab3e4.warnings,
    }
  );
}
function assertImportPackageSize(_0x2cc1bc, _0x3f906f) {
  const _0x24ebc2 = statSync(_0x2cc1bc);
  if (!_0x24ebc2.isFile()) throw new Error('Project package path is not a file');
  const _0x2b42c6 = Number(_0x3f906f || DEFAULT_MAX_IMPORT_PACKAGE_BYTES);
  if (Number(_0x24ebc2.size || 0) > _0x2b42c6) throw new Error('Project package is too large');
}
function assertPackageManifest(_0x4c72dc) {
  if (!isPlainObject(_0x4c72dc)) throw new Error('Invalid project package manifest');
  if (Number(_0x4c72dc.schemaVersion) !== PROJECT_PACKAGE_SCHEMA_VERSION)
    throw new Error('Unsupported project package schemaVersion');
  if (_0x4c72dc.packageKind !== PROJECT_PACKAGE_KIND) throw new Error('Invalid project package kind');
  const _0x41df95 = normalizeArchivePath(_0x4c72dc.projectFile);
  if (_0x41df95 !== PROJECT_PACKAGE_PROJECT_FILE) throw new Error('Invalid project package projectFile');
  if (!Array.isArray(_0x4c72dc.assets)) throw new Error('Invalid project package assets');
}
function assertArchivePathInsideTemp(_0x417249, _0x1508cc) {
  const _0x1fbf11 = normalizeArchivePath(_0x1508cc);
  if (!_0x1fbf11) return '';
  const _0x23f99a = path.resolve(_0x417249, ..._0x1fbf11.split('/'));
  return isPathInside(_0x23f99a, _0x417249) ? _0x23f99a : '';
}
function allocateUniqueFilePath(_0x3118ee) {
  if (!existsSync(_0x3118ee)) return _0x3118ee;
  const _0x27803d = path.dirname(_0x3118ee),
    _0x518c27 = path.parse(_0x3118ee);
  for (let _0x386a82 = 2; _0x386a82 < 0x3e8; _0x386a82 += 1) {
    const _0x567eca = path.join(_0x27803d, _0x518c27.name + ' (' + _0x386a82 + ')' + _0x518c27.ext);
    if (!existsSync(_0x567eca)) return _0x567eca;
  }
  throw new Error('Unable to allocate unique import file path');
}
function allocateImportedAssetTarget(_0x345add, _0x9ff8bf, _0x29f564) {
  const _0x2ec650 = findRootDefinition(_0x345add, _0x9ff8bf);
  if (!_0x2ec650) throw new Error('Unsupported local asset path: ' + _0x345add);
  const _0x3682ff = _0x2ec650.relPath.split('/').filter(Boolean),
    _0x566fff = [IMPORT_DIR_ROOT, _0x29f564, ..._0x3682ff].join('/'),
    _0x4a7670 = allocateUniqueFilePath(path.resolve(_0x2ec650.absRoot, ..._0x566fff.split('/')));
  if (!isPathInside(_0x4a7670, _0x2ec650.absRoot))
    throw new Error('Invalid imported asset target: ' + _0x345add);
  const _0x4e1d2c = path.relative(_0x2ec650.absRoot, _0x4a7670).replace(/\\/g, '/');
  return { absPath: _0x4a7670, localPath: '' + _0x2ec650.virtualPrefix + _0x4e1d2c };
}
function isUrlLikeKey(_0x42c00c) {
  return URL_KEYS.has(String(_0x42c00c || ''));
}
function rewriteStringLocalReferences(_0x44f793, _0x37f02a, _0x4a4fb7 = '') {
  const _0x3cf012 = String(_0x44f793 || '').split('|'),
    _0x2e19ba = _0x3cf012.map((_0x532d7e) => {
      const _0x34025f = normalizeVirtualLocalPath(_0x532d7e),
        _0x4ab375 = _0x34025f ? _0x37f02a.get(_0x34025f) : '';
      if (!_0x4ab375) return _0x532d7e;
      const _0x1f8b1e = _0x532d7e.trim();
      if (LOCAL_PATH_KEYS.has(_0x4a4fb7)) return _0x4ab375;
      if (isUrlLikeKey(_0x4a4fb7) || /^https?:\/\//i.test(_0x1f8b1e) || _0x1f8b1e.startsWith('/'))
        return '/' + _0x4ab375;
      return _0x4ab375;
    });
  return _0x2e19ba.join('|');
}
function rewriteProjectLocalReferences(_0x569459, _0x2810ff, _0x50bc3a = '') {
  if (typeof _0x569459 === 'string') {
    const _0x5ac026 = collectVirtualLocalPathsFromString(_0x569459);
    if (!_0x5ac026.some((_0x5a25cd) => _0x2810ff.has(_0x5a25cd))) return _0x569459;
    return rewriteStringLocalReferences(_0x569459, _0x2810ff, _0x50bc3a);
  }
  if (Array.isArray(_0x569459))
    return _0x569459.map((_0x2561dd) => rewriteProjectLocalReferences(_0x2561dd, _0x2810ff, _0x50bc3a));
  if (!isPlainObject(_0x569459)) return _0x569459;
  const _0x127c6d = {};
  for (const [_0x212dd7, _0x39f2d2] of Object.entries(_0x569459)) {
    _0x127c6d[_0x212dd7] = rewriteProjectLocalReferences(_0x39f2d2, _0x2810ff, _0x212dd7);
  }
  return _0x127c6d;
}
function allocateUniqueProjectPath(_0x9b7161, _0x27d89f) {
  const _0x1918d5 = path.resolve(trimText(_0x9b7161));
  mkdirSync(_0x1918d5, { recursive: true });
  const _0x4459ca = safePathSegment((_0x27d89f || '未命名画布') + ' - 导入', 'imported-project'),
    _0x3168fe = path.join(_0x1918d5, _0x4459ca + '.aicanvas');
  if (!existsSync(_0x3168fe)) return _0x3168fe;
  for (let _0x5dbbe1 = 2; _0x5dbbe1 < 0x3e8; _0x5dbbe1 += 1) {
    const _0x36d9bb = path.join(_0x1918d5, _0x4459ca + ' (' + _0x5dbbe1 + ').aicanvas');
    if (!existsSync(_0x36d9bb)) return _0x36d9bb;
  }
  throw new Error('Unable to allocate imported project file path');
}
function importDirNameForProject(_0xf21862, _0x2bec9c = new Date()) {
  return safePathSegment((_0xf21862 || 'Project') + '-' + timestampForFilename(_0x2bec9c), 'Project');
}
function validateImportAssets(_0x348cbb, _0x3f55bc, _0x5f272e, _0x98363b = {}) {
  const _0x5312ec = Number(_0x98363b.maxAssetBytes || DEFAULT_MAX_IMPORT_ASSET_BYTES),
    _0x5ca4b1 = [],
    _0x2be2db = new Set();
  for (const _0xe644b3 of _0x348cbb.assets) {
    if (!isPlainObject(_0xe644b3)) throw new Error('Invalid project package asset');
    const _0xf78b36 = normalizeVirtualLocalPath(_0xe644b3.localPath),
      _0x1ed70e = normalizeArchivePath(_0xe644b3.archivePath);
    if (
      !_0xf78b36 ||
      String(_0xe644b3.localPath || '')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '') !== _0xf78b36
    )
      throw new Error('Invalid project package asset localPath');
    if (!_0x1ed70e || !_0x1ed70e.startsWith('assets/')) throw new Error('Invalid project package asset path');
    if (_0x2be2db.has(_0xf78b36)) continue;
    _0x2be2db.add(_0xf78b36);
    const _0x39cce8 = assertArchivePathInsideTemp(_0x3f55bc, _0x1ed70e);
    if (!_0x39cce8 || !existsSync(_0x39cce8))
      throw new Error('Project package asset is missing: ' + _0xf78b36);
    const _0x573624 = statSync(_0x39cce8);
    if (!_0x573624.isFile()) throw new Error('Project package asset is not a file: ' + _0xf78b36);
    const _0x33bce7 = Number(_0x573624.size || 0);
    if (_0x33bce7 > _0x5312ec) throw new Error('Project package asset is too large');
    const _0x44778d = Number(_0xe644b3.size || 0) || 0;
    if (_0x44778d > 0 && _0x44778d !== _0x33bce7)
      throw new Error('Project package asset size mismatch: ' + _0xf78b36);
    if (!findRootDefinition(_0xf78b36, _0x5f272e))
      throw new Error('Unsupported project package asset localPath: ' + _0xf78b36);
    _0x5ca4b1.push({ localPath: _0xf78b36, archivePath: _0x1ed70e, absPath: _0x39cce8, size: _0x33bce7 });
  }
  return _0x5ca4b1;
}
export async function importProjectPackageFromPath({
  packagePath: _0x17e1b5,
  roots: _0x749e3e,
  projectRoot: _0x5e4d4f,
  tempRoot: tempRoot = os.tmpdir(),
  now: now = new Date(),
  maxPackageBytes: maxPackageBytes = DEFAULT_MAX_IMPORT_PACKAGE_BYTES,
  maxAssetBytes: maxAssetBytes = DEFAULT_MAX_IMPORT_ASSET_BYTES,
} = {}) {
  const _0x6a6b14 = normalizePackagePath(_0x17e1b5);
  assertImportPackageSize(_0x6a6b14, maxPackageBytes);
  const _0x14d74e = path.resolve(tempRoot || os.tmpdir());
  mkdirSync(_0x14d74e, { recursive: true });
  const _0x425e26 = mkdtempSync(path.join(_0x14d74e, 'aicpkg-'));
  try {
    await extract_zip(_0x6a6b14, { dir: _0x425e26 });
    const _0x2a513b = path.join(_0x425e26, PROJECT_PACKAGE_MANIFEST_NAME);
    if (!existsSync(_0x2a513b)) throw new Error('Project package manifest is missing');
    const _0x41ecdb = readJsonFile(_0x2a513b, 'project package manifest');
    assertPackageManifest(_0x41ecdb);
    const _0xc4f0dd = assertArchivePathInsideTemp(_0x425e26, _0x41ecdb.projectFile);
    if (!_0xc4f0dd || !existsSync(_0xc4f0dd)) throw new Error('Project package project file is missing');
    const _0x11ac65 = readJsonFile(_0xc4f0dd, 'project package project file'),
      _0x14766c = safePathSegment(
        _0x41ecdb.project?.projectName ||
          _0x41ecdb.project?.projectId ||
          path.basename(_0x6a6b14, PROJECT_PACKAGE_FILE_EXTENSION),
        'Imported Project',
      ),
      _0x1c6ddb = importDirNameForProject(_0x14766c, now),
      _0x5a3642 = validateImportAssets(_0x41ecdb, _0x425e26, _0x749e3e || {}, {
        maxAssetBytes: maxAssetBytes,
      }),
      _0x5dcf41 = new Map(),
      _0x132d5d = _0x5a3642.map((_0x5d6733) => {
        const _0xb3adfb = allocateImportedAssetTarget(_0x5d6733.localPath, _0x749e3e || {}, _0x1c6ddb);
        return (
          _0x5dcf41.set(_0x5d6733.localPath, _0xb3adfb.localPath),
          { from: _0x5d6733.absPath, to: _0xb3adfb.absPath }
        );
      });
    for (const _0x2aa793 of _0x132d5d) {
      (mkdirSync(path.dirname(_0x2aa793.to), { recursive: true }),
        copyFileSync(_0x2aa793.from, _0x2aa793.to));
    }
    const _0x13bcfc = rewriteProjectLocalReferences(_0x11ac65, _0x5dcf41),
      _0x2ea271 = allocateUniqueProjectPath(_0x5e4d4f, _0x14766c);
    return (
      writeProjectJson(_0x2ea271, _0x13bcfc),
      {
        success: true,
        canceled: false,
        projectPath: _0x2ea271,
        projectName: _0x14766c + ' - 导入',
        filename: path.basename(_0x2ea271),
        data: _0x13bcfc,
        assetsCount: _0x5a3642.length,
        sourcePackagePath: _0x6a6b14,
      }
    );
  } finally {
    rmSync(_0x425e26, { recursive: true, force: true });
  }
}
export const projectPackageInternals = {
  collectRemoteMediaReferences: collectRemoteMediaReferences,
  rewriteProjectLocalReferences: rewriteProjectLocalReferences,
  normalizeArchivePath: normalizeArchivePath,
  allocateImportedAssetTarget: allocateImportedAssetTarget,
};
