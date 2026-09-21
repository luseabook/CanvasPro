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
function isPlainObject(_0x140a84) {
  return !!_0x140a84 && typeof _0x140a84 === 'object' && !Array.isArray(_0x140a84);
}
function trimText(_0x1ee0af) {
  return String(_0x1ee0af || '').trim();
}
function decodePathPart(_0x2f0bea) {
  try {
    return decodeURIComponent(_0x2f0bea);
  } catch {
    return _0x2f0bea;
  }
}
function splitCompositeVirtualPathValue(_0xa67eb2) {
  const _0x170f87 = trimText(_0xa67eb2);
  if (!_0x170f87) return [];
  return _0x170f87
    .split('|')
    .map((_0x471f78) => _0x471f78.trim())
    .filter(Boolean);
}
function normalizeComparablePath(_0x2b56cb, _0x28e1be = process.platform) {
  const _0x13fde3 = path.resolve(String(_0x2b56cb || ''));
  return _0x28e1be === 'win32' || _0x28e1be === 'darwin' ? _0x13fde3.toLowerCase() : _0x13fde3;
}
export function isPathInside(_0x306632, _0x24cd3a, _0x482dfb = process.platform) {
  try {
    const _0x2cc809 = normalizeComparablePath(_0x306632, _0x482dfb),
      _0x2166f2 = normalizeComparablePath(_0x24cd3a, _0x482dfb);
    return _0x2cc809 === _0x2166f2 || _0x2cc809.startsWith('' + _0x2166f2 + path.sep);
  } catch {
    return false;
  }
}
export function normalizeVirtualLocalPath(_0x3bb29e) {
  let _0x29f88e = trimText(_0x3bb29e);
  if (!_0x29f88e) return '';
  if (_0x29f88e.includes('|')) return '';
  if (/^(?:file|javascript|data|blob):/i.test(_0x29f88e)) return '';
  if (/^https?:\/\//i.test(_0x29f88e))
    try {
      _0x29f88e = new URL(_0x29f88e).pathname || '';
    } catch {
      return '';
    }
  else {
    if (/^[a-z][a-z0-9+.-]*:/i.test(_0x29f88e) && !_0x29f88e.startsWith('/')) return '';
  }
  const _0x30a083 = _0x29f88e.split(/[?#]/, 1)[0],
    _0x22f7d9 = decodePathPart(_0x30a083).replace(/\\/g, '/').replace(/^\/+/, '');
  if (_0x22f7d9.includes('|')) return '';
  if (/^[a-zA-Z]:\//.test(_0x22f7d9) || _0x22f7d9.startsWith('//')) return '';
  if (_0x22f7d9.split('/').some((_0x404230) => _0x404230 === '..')) return '';
  const _0xe2d0d4 = path.posix.normalize(_0x22f7d9);
  if (!_0xe2d0d4 || _0xe2d0d4 === '.' || _0xe2d0d4 === '..' || _0xe2d0d4.startsWith('../')) return '';
  return CLEANABLE_PREFIXES.some((_0x3c2f1e) => _0xe2d0d4.startsWith(_0x3c2f1e)) ? _0xe2d0d4 : '';
}
export function collectVirtualLocalPathsFromString(_0x3c9316) {
  const _0x3ead1a = [],
    _0x29d4e6 = new Set();
  for (const _0x1dedb2 of splitCompositeVirtualPathValue(_0x3c9316)) {
    const _0x1e4704 = normalizeVirtualLocalPath(_0x1dedb2);
    if (!_0x1e4704 || _0x29d4e6.has(_0x1e4704)) continue;
    (_0x29d4e6.add(_0x1e4704), _0x3ead1a.push(_0x1e4704));
  }
  return _0x3ead1a;
}
export function collectReferencedLocalPaths(_0x399094, _0x15dfd4 = new Set(), _0x64e677 = new Set()) {
  if (_0x399094 == null) return _0x15dfd4;
  if (typeof _0x399094 === 'string') {
    for (const _0x1a97c3 of collectVirtualLocalPathsFromString(_0x399094)) {
      _0x15dfd4.add(_0x1a97c3);
    }
    return _0x15dfd4;
  }
  if (typeof _0x399094 !== 'object') return _0x15dfd4;
  if (_0x64e677.has(_0x399094)) return _0x15dfd4;
  _0x64e677.add(_0x399094);
  if (Array.isArray(_0x399094)) {
    for (const _0x37c682 of _0x399094) collectReferencedLocalPaths(_0x37c682, _0x15dfd4, _0x64e677);
    return _0x15dfd4;
  }
  for (const _0x4b3766 of Object.values(_0x399094)) {
    collectReferencedLocalPaths(_0x4b3766, _0x15dfd4, _0x64e677);
  }
  return _0x15dfd4;
}
function stripUtf8Bom(_0x5d7585) {
  return String(_0x5d7585 || '').replace(/^\uFEFF/, '');
}
function readJsonIfPossible(_0x17f57, _0x3d9bd7, _0x4a6459) {
  try {
    return JSON.parse(stripUtf8Bom(readFileSync(_0x17f57, 'utf8')));
  } catch (_0x274cbf) {
    return (
      _0x3d9bd7?.push({
        type: 'json-read-failed',
        source: _0x4a6459 || _0x17f57,
        message: String(_0x274cbf?.message || _0x274cbf),
      }),
      null
    );
  }
}
function listFilesRecursive(_0x2e1050, _0x466378, _0x53ce75 = {}) {
  const _0x30e0fa = trimText(_0x2e1050);
  if (!_0x30e0fa || !existsSync(_0x30e0fa)) return [];
  const _0xf06103 = [],
    _0x14eadb = [path.resolve(_0x30e0fa)],
    _0x1a4f96 = path.resolve(_0x30e0fa);
  while (_0x14eadb.length > 0) {
    const _0x11f9ab = _0x14eadb.pop();
    let _0x4414ca = [];
    try {
      _0x4414ca = readdirSync(_0x11f9ab, { withFileTypes: true });
    } catch (_0x39840b) {
      _0x466378?.push({
        type: 'directory-read-failed',
        source: _0x11f9ab,
        message: String(_0x39840b?.message || _0x39840b),
      });
      continue;
    }
    for (const _0x480266 of _0x4414ca) {
      const _0x273e04 = path.join(_0x11f9ab, _0x480266.name);
      if (!isPathInside(_0x273e04, _0x1a4f96)) continue;
      if (_0x480266.isSymbolicLink()) continue;
      if (_0x480266.isDirectory()) {
        _0x14eadb.push(_0x273e04);
        continue;
      }
      if (!_0x480266.isFile()) continue;
      if (typeof _0x53ce75.filter === 'function' && !_0x53ce75.filter(_0x273e04)) continue;
      _0xf06103.push(_0x273e04);
    }
  }
  return _0xf06103;
}
function isSupportedProjectFile(_0x27b838) {
  return PROJECT_EXTENSIONS.has(path.extname(String(_0x27b838 || '')).toLowerCase());
}
function readRecentProjectPaths(_0x59f8b2, _0x2e6cdd) {
  if (!_0x59f8b2 || !existsSync(_0x59f8b2)) return [];
  const _0xb00ba6 = readJsonIfPossible(_0x59f8b2, _0x2e6cdd, 'recent-projects'),
    _0x15909f = Array.isArray(_0xb00ba6?.items) ? _0xb00ba6.items : [];
  return _0x15909f
    .map((_0x6c2684) => trimText(_0x6c2684?.path || _0x6c2684?.displayPath))
    .filter((_0x49af4a) => _0x49af4a && path.isAbsolute(_0x49af4a) && isSupportedProjectFile(_0x49af4a));
}
function addJsonReferencesFromFiles(_0x50b12d, _0x326302, _0x4019a9, _0x441c6c) {
  const _0x40b5d6 = new Set();
  for (const _0x202cc1 of _0x50b12d) {
    const _0x58cd09 = path.resolve(_0x202cc1),
      _0x5116b4 = normalizeComparablePath(_0x58cd09);
    if (_0x40b5d6.has(_0x5116b4) || !existsSync(_0x58cd09)) continue;
    _0x40b5d6.add(_0x5116b4);
    const _0x16d0f5 = readJsonIfPossible(_0x58cd09, _0x4019a9, _0x441c6c || _0x58cd09);
    if (_0x16d0f5 != null) collectReferencedLocalPaths(_0x16d0f5, _0x326302);
  }
}
function listJsonFiles(_0x57d093, _0x1dc0b4) {
  return listFilesRecursive(_0x57d093, _0x1dc0b4, {
    filter: (_0x14794f) => path.extname(_0x14794f).toLowerCase() === '.json',
  });
}
function listProjectFiles(_0xb622fe, _0x4bc19d) {
  return listFilesRecursive(_0xb622fe, _0x4bc19d, { filter: isSupportedProjectFile });
}
function getWorkflowThumbRoot(_0x201b5b) {
  const _0x203897 = trimText(_0x201b5b);
  return _0x203897 ? path.join(_0x203897, 'thumbs') : '';
}
export function buildLocalAssetCleanupRoots({
  fileSavePaths: fileSavePaths = {},
  defaults: defaults = {},
} = {}) {
  const _0x35d819 = isPlainObject(fileSavePaths) ? fileSavePaths : {},
    _0x1978ef = (_0x244f59) => {
      const _0x3dcbff = trimText(_0x244f59);
      return _0x3dcbff ? path.resolve(_0x3dcbff) : '';
    },
    _0x332fb1 = _0x1978ef(trimText(_0x35d819.dataDir) || trimText(defaults.dataDir)),
    _0x3b1437 = _0x332fb1
      ? path.join(_0x332fb1, 'uploads')
      : _0x1978ef(trimText(_0x35d819.tempDir) || trimText(defaults.uploadsDir));
  return {
    canvasRoot: _0x1978ef(trimText(_0x35d819.canvasDir) || trimText(defaults.canvasDir)),
    outputRoot: _0x1978ef(trimText(_0x35d819.outputDir) || trimText(defaults.outputDir)),
    uploadsRoot: _0x3b1437,
    assetsRoot: _0x332fb1 ? path.join(_0x332fb1, 'assets') : _0x1978ef(defaults.assetsDir),
    workflowsRoot: _0x332fb1 ? path.join(_0x332fb1, 'workflows') : _0x1978ef(defaults.workflowsDir),
    workflowThumbsRoot: _0x1978ef(
      trimText(defaults.workflowThumbsDir) || getWorkflowThumbRoot(defaults.workflowsDir),
    ),
    recentProjectsStorePath: _0x1978ef(defaults.recentProjectsStorePath),
    recoverySnapshotPath: _0x1978ef(defaults.recoverySnapshotPath),
  };
}
function rootsSignature(_0x1556c8) {
  return [
    _0x1556c8.canvasRoot,
    _0x1556c8.outputRoot,
    _0x1556c8.uploadsRoot,
    _0x1556c8.assetsRoot,
    _0x1556c8.workflowsRoot,
    _0x1556c8.workflowThumbsRoot,
    _0x1556c8.recentProjectsStorePath,
    _0x1556c8.recoverySnapshotPath,
  ]
    .map((_0x411e05) => normalizeComparablePath(_0x411e05 || ''))
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
function buildRootConfigs(_0x3b488b) {
  return ROOT_DEFINITIONS.map((_0x2ba940) => ({
    ..._0x2ba940,
    absRoot: trimText(_0x3b488b?.[_0x2ba940.rootKey]),
  })).filter((_0x1c4f25) => _0x1c4f25.absRoot);
}
export function resolveVirtualPathToAbsolute(_0x2c0630, _0x2098c9) {
  const _0x43f81d = normalizeVirtualLocalPath(_0x2c0630);
  if (!_0x43f81d) return '';
  for (const _0x3fdbff of buildRootConfigs(_0x2098c9)) {
    if (!_0x43f81d.startsWith(_0x3fdbff.virtualPrefix)) continue;
    const _0x1828fa = _0x43f81d.slice(_0x3fdbff.virtualPrefix.length),
      _0x515e99 = path.resolve(_0x3fdbff.absRoot, ..._0x1828fa.split('/').filter(Boolean));
    return isPathInside(_0x515e99, _0x3fdbff.absRoot) ? _0x515e99 : '';
  }
  return '';
}
function toVirtualPath(_0x4601d1, _0x5874c9) {
  const _0x59739d = path.relative(_0x5874c9.absRoot, _0x4601d1);
  if (!_0x59739d || _0x59739d.startsWith('..') || path.isAbsolute(_0x59739d)) return '';
  return '' + _0x5874c9.virtualPrefix + _0x59739d.replace(/\\/g, '/');
}
function isCleanableJsonCandidate(_0x28ccde) {
  return /\.waveform\.json$/i.test(path.basename(_0x28ccde));
}
function isCleanableCandidate(_0x1acc6f, _0x5d7037) {
  const _0x3aa531 = path.basename(_0x1acc6f),
    _0x5eb3d = path.extname(_0x3aa531).toLowerCase();
  if (_0x3aa531 === 'assets.index.json') return false;
  if (_0x5eb3d === '.json') return isCleanableJsonCandidate(_0x1acc6f);
  if (!MEDIA_EXTENSIONS.has(_0x5eb3d)) return false;
  if (_0x5d7037 === 'workflowThumbs') return IMAGE_EXTENSIONS.has(_0x5eb3d);
  return true;
}
function classifyCandidateKind(_0x50ce78) {
  if (isCleanableJsonCandidate(_0x50ce78)) return 'waveform';
  const _0x20fba7 = path.extname(_0x50ce78).toLowerCase();
  if (IMAGE_EXTENSIONS.has(_0x20fba7)) return 'image';
  if (VIDEO_EXTENSIONS.has(_0x20fba7)) return 'video';
  if (AUDIO_EXTENSIONS.has(_0x20fba7)) return 'audio';
  return 'media';
}
function collectCandidateFiles(_0x264648, _0xfd431a) {
  const _0x4a1efa = [],
    _0x190269 = new Set();
  for (const _0x2142b9 of buildRootConfigs(_0x264648)) {
    const _0x49b645 = listFilesRecursive(_0x2142b9.absRoot, _0xfd431a, {
      filter: (_0x190a0d) => isCleanableCandidate(_0x190a0d, _0x2142b9.key),
    });
    for (const _0x205814 of _0x49b645) {
      const _0x97c6d6 = path.resolve(_0x205814),
        _0x576d42 = normalizeComparablePath(_0x97c6d6);
      if (_0x190269.has(_0x576d42)) continue;
      _0x190269.add(_0x576d42);
      const _0x3b3c35 = toVirtualPath(_0x97c6d6, _0x2142b9);
      if (!_0x3b3c35) continue;
      let _0x4a06e2 = null;
      try {
        _0x4a06e2 = statSync(_0x97c6d6);
      } catch {
        continue;
      }
      if (!_0x4a06e2?.isFile?.()) continue;
      _0x4a1efa.push({
        absPath: _0x97c6d6,
        localPath: _0x3b3c35,
        size: Number(_0x4a06e2.size || 0),
        kind: classifyCandidateKind(_0x97c6d6),
        modifiedAt: Math.round(Number(_0x4a06e2.mtimeMs || 0)),
        sourceRoot: _0x2142b9.key,
      });
    }
  }
  return _0x4a1efa;
}
function collectAllReferences({ roots: _0x369d4f, currentProjectSnapshot: _0x5ceeb1, warnings: _0x3ed890 }) {
  const _0xc80b14 = new Set();
  collectReferencedLocalPaths(_0x5ceeb1, _0xc80b14);
  const _0x3ffab7 = listProjectFiles(_0x369d4f.canvasRoot, _0x3ed890);
  addJsonReferencesFromFiles(_0x3ffab7, _0xc80b14, _0x3ed890, 'project');
  const _0x5e9f41 = readRecentProjectPaths(_0x369d4f.recentProjectsStorePath, _0x3ed890);
  return (
    addJsonReferencesFromFiles(_0x5e9f41, _0xc80b14, _0x3ed890, 'recent-project'),
    existsSync(_0x369d4f.recoverySnapshotPath) &&
      addJsonReferencesFromFiles([_0x369d4f.recoverySnapshotPath], _0xc80b14, _0x3ed890, 'recovery-snapshot'),
    addJsonReferencesFromFiles(
      listJsonFiles(_0x369d4f.assetsRoot, _0x3ed890),
      _0xc80b14,
      _0x3ed890,
      'assets',
    ),
    addJsonReferencesFromFiles(
      listJsonFiles(_0x369d4f.workflowsRoot, _0x3ed890),
      _0xc80b14,
      _0x3ed890,
      'workflows',
    ),
    _0xc80b14
  );
}
function createScanId(_0x29d54d = Date.now()) {
  return 'asset-cleanup-' + _0x29d54d + '-' + Math.random().toString(36).slice(2, 10);
}
function runScan({
  roots: _0x5ea791,
  currentProjectSnapshot: _0x214322,
  scanId: scanId = createScanId(),
  scannedAt: scannedAt = Date.now(),
  scope: scope = 'current',
}) {
  const _0x55177f = [],
    _0x17772b = collectAllReferences({
      roots: _0x5ea791,
      currentProjectSnapshot: _0x214322,
      warnings: _0x55177f,
    }),
    _0x24baf9 = collectCandidateFiles(_0x5ea791, _0x55177f),
    _0x1be440 = _0x24baf9
      .filter((_0x2a90c2) => !_0x17772b.has(_0x2a90c2.localPath))
      .map(({ absPath: _0x4f065b, ..._0x4f52aa }) => _0x4f52aa)
      .sort(
        (_0x3c25b, _0x34ed7d) =>
          Number(_0x34ed7d.size || 0) - Number(_0x3c25b.size || 0) ||
          _0x3c25b.localPath.localeCompare(_0x34ed7d.localPath),
      ),
    _0x2e7402 = _0x1be440.reduce((_0x477a94, _0x1d7789) => _0x477a94 + Number(_0x1d7789.size || 0), 0);
  return {
    ok: true,
    scanId: scanId,
    scope: scope,
    scannedAt: scannedAt,
    roots: publicRoots(),
    candidateCount: _0x24baf9.length,
    orphanCount: _0x1be440.length,
    orphanBytes: _0x2e7402,
    items: _0x1be440,
    warnings: _0x55177f,
    _private: {
      roots: _0x5ea791,
      rootsSignature: rootsSignature(_0x5ea791),
      currentProjectSnapshot: _0x214322,
      references: _0x17772b,
    },
  };
}
function publicScanResult(_0x171df6) {
  const { _private: _0x38a9f8, ..._0x2c715e } = _0x171df6;
  return _0x2c715e;
}
function cloneJsonLike(_0x511dde) {
  if (_0x511dde == null) return _0x511dde;
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x511dde);
    } catch {}
  try {
    return JSON.parse(JSON.stringify(_0x511dde));
  } catch {
    return null;
  }
}
export function createLocalAssetCleanupManager({
  getRoots: _0x3cca10,
  trashItem: _0x234ec3,
  now: now = () => Date.now(),
} = {}) {
  const _0xd76fb2 = new Map();
  async function _0x383dba(_0x3ecff5 = {}) {
    if (typeof _0x3cca10 !== 'function') throw new Error('缺少清理目录配置');
    const _0xb7ecf1 = await _0x3cca10(_0x3ecff5);
    return _0xb7ecf1 && typeof _0xb7ecf1 === 'object' ? _0xb7ecf1 : {};
  }
  return {
    async scan(_0x2ade92 = {}) {
      const _0x2c4803 = await _0x383dba(_0x2ade92 || {}),
        _0x2622b1 = runScan({
          roots: _0x2c4803,
          currentProjectSnapshot: cloneJsonLike(_0x2ade92?.currentProjectSnapshot),
          scanId: createScanId(now()),
          scannedAt: now(),
          scope: trimText(_0x2ade92?.scope) || 'current',
        });
      _0xd76fb2.set(_0x2622b1.scanId, _0x2622b1);
      if (_0xd76fb2.size > 6) {
        const _0x370075 = _0xd76fb2.keys().next().value;
        if (_0x370075) _0xd76fb2.delete(_0x370075);
      }
      return publicScanResult(_0x2622b1);
    },
    async trash(_0x22576e = {}) {
      if (typeof _0x234ec3 !== 'function') throw new Error('当前环境不支持移到回收站');
      const _0x55e4da = trimText(_0x22576e?.scanId),
        _0xa81d51 = _0xd76fb2.get(_0x55e4da);
      if (!_0xa81d51) throw new Error('扫描结果已过期，请重新扫描');
      const _0x56f3b6 = await _0x383dba(_0x22576e || {});
      if (rootsSignature(_0x56f3b6) !== _0xa81d51._private.rootsSignature) {
        _0xd76fb2.delete(_0x55e4da);
        throw new Error('文件保存路径已变化，请重新扫描');
      }
      const _0x525ea4 = Array.isArray(_0x22576e?.localPaths)
          ? _0x22576e.localPaths.map(normalizeVirtualLocalPath).filter(Boolean)
          : [],
        _0x721881 = new Set(_0x525ea4);
      if (_0x721881.size === 0)
        return { ok: true, trashedCount: 0, trashedBytes: 0, skipped: [], errors: [] };
      const _0x6adacc = runScan({
          roots: _0xa81d51._private.roots,
          currentProjectSnapshot: cloneJsonLike(
            _0x22576e?.currentProjectSnapshot || _0xa81d51._private.currentProjectSnapshot,
          ),
          scanId: _0x55e4da,
          scannedAt: now(),
          scope: _0xa81d51.scope || 'current',
        }),
        _0x4aba5c = new Map(_0x6adacc.items.map((_0x8c0154) => [_0x8c0154.localPath, _0x8c0154])),
        _0x4e876a = [],
        _0x1c56ac = [];
      let _0x2768f9 = 0,
        _0x345ea9 = 0;
      for (const _0x2e5441 of _0x721881) {
        const _0x4f2c9f = _0x4aba5c.get(_0x2e5441);
        if (!_0x4f2c9f) {
          _0x4e876a.push({ localPath: _0x2e5441, reason: 'referenced-or-missing' });
          continue;
        }
        const _0x494cdc = resolveVirtualPathToAbsolute(_0x2e5441, _0xa81d51._private.roots);
        if (!_0x494cdc || !existsSync(_0x494cdc)) {
          _0x4e876a.push({ localPath: _0x2e5441, reason: 'missing' });
          continue;
        }
        try {
          (await _0x234ec3(_0x494cdc), (_0x2768f9 += 1), (_0x345ea9 += Number(_0x4f2c9f.size || 0)));
        } catch (_0x4a2a68) {
          _0x1c56ac.push({ localPath: _0x2e5441, message: String(_0x4a2a68?.message || _0x4a2a68) });
        }
      }
      return (
        _0xd76fb2.delete(_0x55e4da),
        {
          ok: _0x1c56ac.length === 0,
          trashedCount: _0x2768f9,
          trashedBytes: _0x345ea9,
          skipped: _0x4e876a,
          errors: _0x1c56ac,
        }
      );
    },
    _scanForTests(_0x58357e = {}) {
      return runScan(_0x58357e);
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
