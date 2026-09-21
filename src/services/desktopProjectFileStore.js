import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.js';
export const PROJECT_RECENTS_VERSION = 1;
export const PROJECT_RECENTS_LIMIT = 20;
export const RECOVERY_SNAPSHOT_VERSION = 1;
export const DEFAULT_PROJECT_FILE_EXTENSION = '.aicanvas';
export const SUPPORTED_PROJECT_FILE_EXTENSIONS = Object.freeze(['.aicanvas', '.aicproj', '.json']);
export const ASSOCIATED_PROJECT_FILE_EXTENSIONS = Object.freeze(['aicanvas', 'aicproj']);
function isPlainObject(_0x22506f) {
  return !!_0x22506f && typeof _0x22506f === 'object' && !Array.isArray(_0x22506f);
}
function normalizeComparablePath(_0x513c86) {
  const _0x33dda0 = path.resolve(String(_0x513c86 || ''));
  return process.platform === 'win32' || process.platform === 'darwin' ? _0x33dda0.toLowerCase() : _0x33dda0;
}
function stripUtf8Bom(_0x13a5e0) {
  return String(_0x13a5e0 || '').replace(/^\uFEFF/, '');
}
function normalizeTimestamp(_0x2b292d, _0x4b4418 = 0) {
  const _0x1e6589 = Number(_0x2b292d);
  return Number.isFinite(_0x1e6589) && _0x1e6589 > 0 ? Math.round(_0x1e6589) : _0x4b4418;
}
export function isSupportedProjectFileExtension(_0x1ab72c) {
  const _0x4fcaf3 = path.extname(String(_0x1ab72c || '')).toLowerCase();
  return SUPPORTED_PROJECT_FILE_EXTENSIONS.includes(_0x4fcaf3);
}
export function stripProjectFileExtension(_0x3fc938) {
  const _0x4b1cab = String(_0x3fc938 || ''),
    _0x586e99 = path.extname(_0x4b1cab).toLowerCase();
  return SUPPORTED_PROJECT_FILE_EXTENSIONS.includes(_0x586e99)
    ? _0x4b1cab.slice(0, -_0x586e99.length)
    : _0x4b1cab;
}
export function sanitizeProjectName(_0x597b7e) {
  const _0x4396b3 = t('coreServices.projectFile.unnamedCanvas'),
    _0x1fef27 = String(_0x597b7e || '').trim() || _0x4396b3;
  return (
    _0x1fef27
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim() || _0x4396b3
  );
}
export function sanitizeProjectFilename(_0x5036ff) {
  const _0x549b74 = sanitizeProjectName(stripProjectFileExtension(_0x5036ff));
  return '' + _0x549b74 + DEFAULT_PROJECT_FILE_EXTENSION;
}
export function withJsonProjectExtension(_0x2ee4f0) {
  const _0x259b59 = String(_0x2ee4f0 || '').trim();
  if (!_0x259b59) return _0x259b59;
  return path.extname(_0x259b59) ? _0x259b59 : '' + _0x259b59 + DEFAULT_PROJECT_FILE_EXTENSION;
}
export function assertJsonProjectPath(_0x3fb159, { mustExist: mustExist = false } = {}) {
  const _0xcefe40 = String(_0x3fb159 || '').trim();
  if (!_0xcefe40) throw new Error('Project path is required');
  if (!path.isAbsolute(_0xcefe40)) throw new Error('Project path must be absolute');
  if (!isSupportedProjectFileExtension(_0xcefe40))
    throw new Error('Only .aicanvas, .aicproj, or .json project files are supported');
  if (mustExist) {
    const _0x577576 = statSync(_0xcefe40);
    if (!_0x577576.isFile()) throw new Error('Project path is not a file');
  }
  return path.resolve(_0xcefe40);
}
export function findFirstSupportedProjectPathFromArgs(_0x1b813f, { mustExist: mustExist = true } = {}) {
  const _0x1a890e = Array.isArray(_0x1b813f) ? _0x1b813f : [];
  for (const _0x4a1980 of _0x1a890e) {
    const _0x228f7b = String(_0x4a1980 || '')
      .trim()
      .replace(/^"|"$/g, '');
    if (!_0x228f7b || !path.isAbsolute(_0x228f7b)) continue;
    if (!isSupportedProjectFileExtension(_0x228f7b)) continue;
    try {
      return assertJsonProjectPath(_0x228f7b, { mustExist: mustExist });
    } catch {}
  }
  return '';
}
export function readProjectJson(_0x39ad2c) {
  const _0x235c75 = assertJsonProjectPath(_0x39ad2c, { mustExist: true }),
    _0x1aaf17 = JSON.parse(stripUtf8Bom(readFileSync(_0x235c75, 'utf8')));
  if (!isPlainObject(_0x1aaf17)) throw new Error('Project JSON must be an object');
  return _0x1aaf17;
}
export function buildProjectFilePayload(_0x44912e) {
  if (!isPlainObject(_0x44912e)) throw new Error('Project data must be an object');
  if (Array.isArray(_0x44912e.canvases))
    return {
      canvases: _0x44912e.canvases,
      activeCanvasId: String(_0x44912e.activeCanvasId || _0x44912e.canvases[0]?.id || 'canvas_1'),
    };
  return {
    nodes: isPlainObject(_0x44912e.nodes) || Array.isArray(_0x44912e.nodes) ? _0x44912e.nodes : [],
    edges: isPlainObject(_0x44912e.edges) || Array.isArray(_0x44912e.edges) ? _0x44912e.edges : [],
    viewport: isPlainObject(_0x44912e.viewport) ? _0x44912e.viewport : {},
  };
}
export function writeProjectJson(_0x103bb7, _0x2d137b) {
  const _0x3a7d64 = assertJsonProjectPath(_0x103bb7),
    _0x30e9ca = buildProjectFilePayload(_0x2d137b);
  mkdirSync(path.dirname(_0x3a7d64), { recursive: true });
  const _0x5c3691 = _0x3a7d64 + '.tmp-' + process.pid + '-' + Date.now();
  return (
    writeFileSync(_0x5c3691, JSON.stringify(_0x30e9ca, null, 2) + '\n', 'utf8'),
    renameSync(_0x5c3691, _0x3a7d64),
    _0x30e9ca
  );
}
export function buildRecoverySnapshotPayload(_0x229470 = {}, { now: now = Date.now() } = {}) {
  const _0x1e4e0b = isPlainObject(_0x229470?.data) ? _0x229470.data : _0x229470?.multiData,
    _0x35e586 = buildProjectFilePayload(_0x1e4e0b || {}),
    _0x3f226e = normalizeTimestamp(_0x229470?.savedAt, normalizeTimestamp(now, Date.now())),
    _0x478366 = String(_0x229470?.filename || '').trim();
  return {
    version: RECOVERY_SNAPSHOT_VERSION,
    savedAt: _0x3f226e,
    reason: String(_0x229470?.reason || 'auto').trim() || 'auto',
    projectId: String(_0x229470?.projectId || '').trim() || 'default_v2_project',
    projectName: sanitizeProjectName(
      _0x229470?.projectName || _0x229470?.projectId || t('coreServices.projectFile.unnamedCanvas'),
    ),
    filename: _0x478366 ? path.basename(_0x478366) : '',
    recentId: String(_0x229470?.recentId || '').trim(),
    displayPath: String(_0x229470?.displayPath || '').trim(),
    lastKnownProjectLastModified: normalizeTimestamp(
      _0x229470?.lastKnownProjectLastModified ?? _0x229470?.lastModified,
      0,
    ),
    data: _0x35e586,
  };
}
export function writeRecoverySnapshot(_0x15deb4, _0x23747d, _0x1d7a36 = {}) {
  const _0x152f21 = String(_0x15deb4 || '').trim();
  if (!_0x152f21) throw new Error('Recovery path is required');
  const _0x381f99 = path.resolve(_0x152f21),
    _0x515d28 = buildRecoverySnapshotPayload(_0x23747d, _0x1d7a36);
  mkdirSync(path.dirname(_0x381f99), { recursive: true });
  const _0x46c67a = _0x381f99 + '.tmp-' + process.pid + '-' + Date.now();
  return (
    writeFileSync(_0x46c67a, JSON.stringify(_0x515d28, null, 2) + '\n', 'utf8'),
    renameSync(_0x46c67a, _0x381f99),
    _0x515d28
  );
}
export function readRecoverySnapshot(_0x26addd) {
  try {
    const _0x21d2c7 = String(_0x26addd || '').trim();
    if (!_0x21d2c7) return null;
    const _0x4a7e91 = path.resolve(_0x21d2c7),
      _0x20d427 = JSON.parse(stripUtf8Bom(readFileSync(_0x4a7e91, 'utf8')));
    if (!isPlainObject(_0x20d427)) return null;
    if (Number(_0x20d427.version) !== RECOVERY_SNAPSHOT_VERSION) return null;
    if (!isPlainObject(_0x20d427.data)) return null;
    const _0x973593 = normalizeTimestamp(_0x20d427.savedAt, 0);
    if (!_0x973593) return null;
    return {
      ..._0x20d427,
      savedAt: _0x973593,
      projectId: String(_0x20d427.projectId || '').trim() || 'default_v2_project',
      projectName: sanitizeProjectName(
        _0x20d427.projectName || _0x20d427.projectId || t('coreServices.projectFile.unnamedCanvas'),
      ),
      filename: String(_0x20d427.filename || '').trim(),
      recentId: String(_0x20d427.recentId || '').trim(),
      displayPath: String(_0x20d427.displayPath || '').trim(),
      lastKnownProjectLastModified: normalizeTimestamp(_0x20d427.lastKnownProjectLastModified, 0),
    };
  } catch {
    return null;
  }
}
export function removeRecoverySnapshot(_0x1dc46a) {
  try {
    const _0x1f2a6c = String(_0x1dc46a || '').trim();
    if (!_0x1f2a6c) return;
    unlinkSync(path.resolve(_0x1f2a6c));
  } catch (_0x405646) {
    if (_0x405646?.code !== 'ENOENT') throw _0x405646;
  }
}
export function getRecoverySnapshotInfo(_0x9b8d5e, { currentLastModified: currentLastModified = 0 } = {}) {
  const _0x384e0a = readRecoverySnapshot(_0x9b8d5e);
  if (!_0x384e0a)
    return {
      exists: false,
      isNewerThanProject: false,
      savedAt: 0,
      currentLastModified: normalizeTimestamp(currentLastModified, 0),
    };
  const _0x1e6b2c = normalizeTimestamp(currentLastModified, _0x384e0a.lastKnownProjectLastModified);
  return {
    exists: true,
    isNewerThanProject: _0x384e0a.savedAt > _0x1e6b2c,
    savedAt: _0x384e0a.savedAt,
    currentLastModified: _0x1e6b2c,
    projectId: _0x384e0a.projectId,
    projectName: _0x384e0a.projectName,
    filename: _0x384e0a.filename,
    recentId: _0x384e0a.recentId,
    displayPath: _0x384e0a.displayPath,
    lastKnownProjectLastModified: _0x384e0a.lastKnownProjectLastModified,
  };
}
export function buildDefaultProjectPath(_0x37485a, _0x58ceba) {
  const _0x3e7d39 = path.resolve(String(_0x37485a || ''));
  return path.join(_0x3e7d39, sanitizeProjectFilename(_0x58ceba));
}
export function getProjectRecentId(_0x5c752e) {
  const _0x82c213 = normalizeComparablePath(_0x5c752e);
  return createHash('sha256').update(_0x82c213).digest('hex').slice(0, 24);
}
export function readRecentProjects(_0x3ef60c) {
  try {
    const _0x142845 = readFileSync(_0x3ef60c, 'utf8'),
      _0x32c06c = JSON.parse(stripUtf8Bom(_0x142845));
    return Array.isArray(_0x32c06c?.items) ? _0x32c06c.items : [];
  } catch {
    return [];
  }
}
export function writeRecentProjects(_0x188285, _0x3455be) {
  const _0x34c458 = {
    version: PROJECT_RECENTS_VERSION,
    updatedAt: Date.now(),
    items: Array.isArray(_0x3455be) ? _0x3455be.slice(0, PROJECT_RECENTS_LIMIT) : [],
  };
  return (
    mkdirSync(path.dirname(_0x188285), { recursive: true }),
    writeFileSync(_0x188285, JSON.stringify(_0x34c458, null, 2) + '\n', 'utf8'),
    _0x34c458.items
  );
}
export function buildRecentProjectItem(_0x13e382, { name: name = '', now: now = Date.now() } = {}) {
  const _0x40d4e8 = assertJsonProjectPath(_0x13e382),
    _0x6a9f83 = existsSync(_0x40d4e8),
    _0x1097f7 = _0x6a9f83 ? statSync(_0x40d4e8) : null,
    _0x3ff20b = path.basename(_0x40d4e8);
  return {
    recentId: getProjectRecentId(_0x40d4e8),
    name: sanitizeProjectName(name || stripProjectFileExtension(_0x3ff20b)),
    filename: _0x3ff20b,
    path: _0x40d4e8,
    displayPath: _0x40d4e8,
    lastModified: _0x1097f7 ? Math.round(_0x1097f7.mtimeMs) : 0,
    updatedAt: now,
    exists: _0x6a9f83,
  };
}
export function listRecentProjects(_0x76aeab) {
  const _0x14b4df = readRecentProjects(_0x76aeab)
    .filter((_0x411cbb) => _0x411cbb && _0x411cbb.path)
    .map((_0x4665d0) => {
      try {
        return {
          ...buildRecentProjectItem(_0x4665d0.path, {
            name: _0x4665d0.name || _0x4665d0.filename,
            now: Number(_0x4665d0.updatedAt || 0) || Date.now(),
          }),
          updatedAt: Number(_0x4665d0.updatedAt || 0) || 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return (
    _0x14b4df.sort(
      (_0x2e8457, _0x4e0d51) =>
        Number(_0x4e0d51.updatedAt || _0x4e0d51.lastModified || 0) -
        Number(_0x2e8457.updatedAt || _0x2e8457.lastModified || 0),
    ),
    _0x14b4df
  );
}
export function upsertRecentProject(_0x1a0828, _0x196a3c, { name: name = '' } = {}) {
  const _0x449442 = buildRecentProjectItem(_0x196a3c, { name: name, now: Date.now() }),
    _0x1c5cf5 = readRecentProjects(_0x1a0828).filter(
      (_0x467136) => _0x467136?.recentId !== _0x449442.recentId,
    );
  return (_0x1c5cf5.unshift(_0x449442), writeRecentProjects(_0x1a0828, _0x1c5cf5), _0x449442);
}
export function removeRecentProject(_0x3f5104, _0xa4ae28) {
  const _0xb74404 = String(_0xa4ae28 || '').trim();
  if (!_0xb74404) return listRecentProjects(_0x3f5104);
  const _0x5f1a66 = readRecentProjects(_0x3f5104).filter(
    (_0x10d020) => String(_0x10d020?.recentId || '') !== _0xb74404,
  );
  return (writeRecentProjects(_0x3f5104, _0x5f1a66), listRecentProjects(_0x3f5104));
}
export function findRecentProject(_0x372484, _0x2a0b70) {
  const _0x5276bc = String(_0x2a0b70 || '').trim();
  if (!_0x5276bc) return null;
  return listRecentProjects(_0x372484).find((_0x3f441d) => _0x3f441d.recentId === _0x5276bc) || null;
}
