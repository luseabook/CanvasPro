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
import { requireProjectDocument } from './projectDocumentGuard.js';
export const PROJECT_RECENTS_VERSION = 1;
export const PROJECT_RECENTS_LIMIT = 20;
export const RECOVERY_SNAPSHOT_VERSION = 1;
export const DEFAULT_PROJECT_FILE_EXTENSION = '.aicanvas';
export const SUPPORTED_PROJECT_FILE_EXTENSIONS = Object.freeze(['.aicanvas', '.aicproj', '.json']);
export const ASSOCIATED_PROJECT_FILE_EXTENSIONS = Object.freeze(['aicanvas', 'aicproj']);
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function normalizeComparablePath(value) {
  const item = path.resolve(String(value || ''));
  return process.platform === 'win32' || process.platform === 'darwin' ? item.toLowerCase() : item;
}
function stripUtf8Bom(key) {
  return String(key || '').replace(/^\uFEFF/, '');
}
function normalizeTimestamp(index, result = 0) {
  const count = Number(index);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : result;
}
export function isSupportedProjectFileExtension(data) {
  const options = path.extname(String(data || '')).toLowerCase();
  return SUPPORTED_PROJECT_FILE_EXTENSIONS.includes(options);
}
export function stripProjectFileExtension(target) {
  const list = String(target || ''),
    list2 = path.extname(list).toLowerCase();
  return SUPPORTED_PROJECT_FILE_EXTENSIONS.includes(list2) ? list.slice(0, -list2.length) : list;
}
export function sanitizeProjectName(source) {
  const t2 = t('coreServices.projectFile.unnamedCanvas'),
    next = String(source || '').trim() || t2;
  return (
    next
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim() || t2
  );
}
export function sanitizeProjectFilename(current) {
  const sanitizeProjectName2 = sanitizeProjectName(stripProjectFileExtension(current));
  return '' + sanitizeProjectName2 + DEFAULT_PROJECT_FILE_EXTENSION;
}
export function withJsonProjectExtension(entry) {
  const enabled2 = String(entry || '').trim();
  if (!enabled2) return enabled2;
  return path.extname(enabled2) ? enabled2 : '' + enabled2 + DEFAULT_PROJECT_FILE_EXTENSION;
}
export function assertJsonProjectPath(record, { mustExist: mustExist = false } = {}) {
  const enabled3 = String(record || '').trim();
  if (!enabled3) throw new Error('Project path is required');
  if (!path.isAbsolute(enabled3)) throw new Error('Project path must be absolute');
  if (!isSupportedProjectFileExtension(enabled3))
    throw new Error('Only .aicanvas, .aicproj, or .json project files are supported');
  if (mustExist) {
    const statSync2 = statSync(enabled3);
    if (!statSync2.isFile()) throw new Error('Project path is not a file');
  }
  return path.resolve(enabled3);
}
export function findFirstSupportedProjectPathFromArgs(payload, { mustExist: mustExist = true } = {}) {
  const handle = Array.isArray(payload) ? payload : [];
  for (const state of handle) {
    const enabled4 = String(state || '')
      .trim()
      .replace(/^"|"$/g, '');
    if (!enabled4 || !path.isAbsolute(enabled4)) continue;
    if (!isSupportedProjectFileExtension(enabled4)) continue;
    try {
      return assertJsonProjectPath(enabled4, { mustExist: mustExist });
    } catch {}
  }
  return '';
}
export function readProjectJson(config) {
  const assertJsonProjectPath2 = assertJsonProjectPath(config, { mustExist: true }),
    scope = JSON.parse(stripUtf8Bom(readFileSync(assertJsonProjectPath2, 'utf8')));
  return requireProjectDocument(scope);
}
export function buildProjectFilePayload(canvases) {
  if (!isPlainObject(canvases)) throw new Error('Project data must be an object');
  if (Array.isArray(canvases.canvases))
    return {
      canvases: canvases.canvases,
      activeCanvasId: String(canvases.activeCanvasId || canvases.canvases[0]?.id || 'canvas_1'),
    };
  return {
    nodes: isPlainObject(canvases.nodes) || Array.isArray(canvases.nodes) ? canvases.nodes : [],
    edges: isPlainObject(canvases.edges) || Array.isArray(canvases.edges) ? canvases.edges : [],
    viewport: isPlainObject(canvases.viewport) ? canvases.viewport : {},
  };
}
export function writeProjectJson(input, output) {
  const assertJsonProjectPath3 = assertJsonProjectPath(input),
    projectFilePayload = buildProjectFilePayload(output);
  mkdirSync(path.dirname(assertJsonProjectPath3), { recursive: true });
  const value2 = assertJsonProjectPath3 + '.tmp-' + process.pid + '-' + Date.now();
  return (
    writeFileSync(value2, JSON.stringify(projectFilePayload, null, 2) + '\n', 'utf8'),
    renameSync(value2, assertJsonProjectPath3),
    projectFilePayload
  );
}
export function buildRecoverySnapshotPayload(options2 = {}, { now: now = Date.now() } = {}) {
  const isPlainObject2 = isPlainObject(options2?.data) ? options2.data : options2?.multiData,
    verifiedData = requireProjectDocument(isPlainObject2 || {});
  if (Array.isArray(verifiedData.canvases) && verifiedData.canvases.length === 0)
    throw new Error('Recovery snapshot must include a canvas');
  const data2 = buildProjectFilePayload(verifiedData),
    savedAt = normalizeTimestamp(options2?.savedAt, normalizeTimestamp(now, Date.now())),
    filename2 = String(options2?.filename || '').trim();
  return {
    version: RECOVERY_SNAPSHOT_VERSION,
    savedAt: savedAt,
    reason: String(options2?.reason || 'auto').trim() || 'auto',
    projectId: String(options2?.projectId || '').trim() || 'default_v2_project',
    projectName: sanitizeProjectName(
      options2?.projectName || options2?.projectId || t('coreServices.projectFile.unnamedCanvas'),
    ),
    filename: filename2 ? path.basename(filename2) : '',
    recentId: String(options2?.recentId || '').trim(),
    displayPath: String(options2?.displayPath || '').trim(),
    lastKnownProjectLastModified: normalizeTimestamp(
      options2?.lastKnownProjectLastModified ?? options2?.lastModified,
      0,
    ),
    data: data2,
  };
}
export function writeRecoverySnapshot(value3, value4, value5 = {}) {
  const enabled5 = String(value3 || '').trim();
  if (!enabled5) throw new Error('Recovery path is required');
  const value6 = path.resolve(enabled5),
    recoverySnapshotPayload = buildRecoverySnapshotPayload(value4, value5);
  const existing = getRecoverySnapshotInfo(value6);
  if (
    existing.exists &&
    (existing.invalid ||
      existing.projectId !== recoverySnapshotPayload.projectId ||
      existing.filename !== recoverySnapshotPayload.filename ||
      existing.recentId !== recoverySnapshotPayload.recentId ||
      existing.displayPath !== recoverySnapshotPayload.displayPath)
  ) {
    throw Object.assign(new Error('已有其他工程或无效恢复快照；原文件已保留，请先备份核对'), {
      code: 'RECOVERY_SNAPSHOT_PROTECTED',
    });
  }
  mkdirSync(path.dirname(value6), { recursive: true });
  const value7 = value6 + '.tmp-' + process.pid + '-' + Date.now();
  return (
    writeFileSync(value7, JSON.stringify(recoverySnapshotPayload, null, 2) + '\n', 'utf8'),
    renameSync(value7, value6),
    recoverySnapshotPayload
  );
}
export function readRecoverySnapshot(value8) {
  try {
    const enabled6 = String(value8 || '').trim();
    if (!enabled6) return null;
    const value9 = path.resolve(enabled6),
      raw = readFileSync(value9, 'utf8'),
      projectId2 = JSON.parse(stripUtf8Bom(raw));
    if (!isPlainObject(projectId2)) return null;
    if (Number(projectId2.version) !== RECOVERY_SNAPSHOT_VERSION) return null;
    if (!isPlainObject(projectId2.data)) return null;
    if (typeof projectId2.projectId !== 'string' || !projectId2.projectId.trim()) return null;
    const verifiedData = requireProjectDocument(projectId2.data);
    if (Array.isArray(verifiedData.canvases) && verifiedData.canvases.length === 0) return null;
    const savedAt2 = normalizeTimestamp(projectId2.savedAt, 0);
    if (!savedAt2) return null;
    return {
      ...projectId2,
      savedAt: savedAt2,
      revision: createHash('sha256').update(raw, 'utf8').digest('hex'),
      projectId: projectId2.projectId.trim(),
      projectName: sanitizeProjectName(
        projectId2.projectName || projectId2.projectId || t('coreServices.projectFile.unnamedCanvas'),
      ),
      filename: String(projectId2.filename || '').trim(),
      recentId: String(projectId2.recentId || '').trim(),
      displayPath: String(projectId2.displayPath || '').trim(),
      lastKnownProjectLastModified: normalizeTimestamp(projectId2.lastKnownProjectLastModified, 0),
    };
  } catch {
    return null;
  }
}
export function removeRecoverySnapshot(value10) {
  try {
    const enabled7 = String(value10 || '').trim();
    if (!enabled7) return;
    unlinkSync(path.resolve(enabled7));
  } catch (value11) {
    if (value11?.code !== 'ENOENT') throw value11;
  }
}
export function clearRecoverySnapshotIfMatches(filename, expected = {}) {
  const projectId = String(expected?.projectId || '').trim(),
    revision = String(expected?.revision || '').trim();
  if (!projectId || !/^[a-f0-9]{64}$/.test(revision))
    return { success: false, cleared: false, reason: 'guard-required' };
  const snapshot = readRecoverySnapshot(filename);
  if (!snapshot)
    return {
      success: false,
      cleared: false,
      reason: filename && existsSync(filename) ? 'invalid' : 'missing',
    };
  if (snapshot.projectId !== projectId || snapshot.revision !== revision)
    return { success: false, cleared: false, reason: 'changed' };
  removeRecoverySnapshot(filename);
  return { success: true, cleared: true };
}
export function getRecoverySnapshotInfo(value12, { currentLastModified: currentLastModified = 0 } = {}) {
  const revision2 = readRecoverySnapshot(value12);
  if (!revision2) {
    const filename = String(value12 || '').trim();
    const invalid = !!filename && existsSync(filename);
    return {
      exists: invalid,
      invalid,
      isNewerThanProject: false,
      savedAt: 0,
      currentLastModified: normalizeTimestamp(currentLastModified, 0),
    };
  }
  const currentLastModified2 = normalizeTimestamp(
    currentLastModified,
    revision2.lastKnownProjectLastModified,
  );
  return {
    exists: true,
    revision: revision2.revision,
    isNewerThanProject: revision2.savedAt > currentLastModified2,
    savedAt: revision2.savedAt,
    currentLastModified: currentLastModified2,
    projectId: revision2.projectId,
    projectName: revision2.projectName,
    filename: revision2.filename,
    recentId: revision2.recentId,
    displayPath: revision2.displayPath,
    lastKnownProjectLastModified: revision2.lastKnownProjectLastModified,
  };
}
export function buildDefaultProjectPath(value13, value14) {
  const value15 = path.resolve(String(value13 || ''));
  return path.join(value15, sanitizeProjectFilename(value14));
}
export function getProjectRecentId(value16) {
  const comparablePath = normalizeComparablePath(value16);
  return createHash('sha256').update(comparablePath).digest('hex').slice(0, 24);
}
export function readRecentProjects(value17) {
  try {
    const fileSync = readFileSync(value17, 'utf8'),
      value18 = JSON.parse(stripUtf8Bom(fileSync));
    return Array.isArray(value18?.items) ? value18.items : [];
  } catch {
    return [];
  }
}
export function writeRecentProjects(value19, list3) {
  const value20 = {
    version: PROJECT_RECENTS_VERSION,
    updatedAt: Date.now(),
    items: Array.isArray(list3) ? list3.slice(0, PROJECT_RECENTS_LIMIT) : [],
  };
  return (
    mkdirSync(path.dirname(value19), { recursive: true }),
    writeFileSync(value19, JSON.stringify(value20, null, 2) + '\n', 'utf8'),
    value20.items
  );
}
export function buildRecentProjectItem(value21, { name: name = '', now: now = Date.now() } = {}) {
  const path2 = assertJsonProjectPath(value21),
    exists = existsSync(path2),
    lastModified = exists ? statSync(path2) : null,
    filename3 = path.basename(path2);
  return {
    recentId: getProjectRecentId(path2),
    name: sanitizeProjectName(name || stripProjectFileExtension(filename3)),
    filename: filename3,
    path: path2,
    displayPath: path2,
    lastModified: lastModified ? Math.round(lastModified.mtimeMs) : 0,
    updatedAt: now,
    exists: exists,
  };
}
export function listRecentProjects(value22) {
  const list4 = readRecentProjects(value22)
    .filter((item2) => item2 && item2.path)
    .map((name2) => {
      try {
        return {
          ...buildRecentProjectItem(name2.path, {
            name: name2.name || name2.filename,
            now: Number(name2.updatedAt || 0) || Date.now(),
          }),
          updatedAt: Number(name2.updatedAt || 0) || 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return (
    list4.sort(
      (item3, value23) =>
        Number(value23.updatedAt || value23.lastModified || 0) -
        Number(item3.updatedAt || item3.lastModified || 0),
    ),
    list4
  );
}
export function upsertRecentProject(value24, value25, { name: name = '' } = {}) {
  const recentProjectItem = buildRecentProjectItem(value25, { name: name, now: Date.now() }),
    recentProjects = readRecentProjects(value24).filter(
      (item4) => item4?.recentId !== recentProjectItem.recentId,
    );
  return (
    recentProjects.unshift(recentProjectItem),
    writeRecentProjects(value24, recentProjects),
    recentProjectItem
  );
}
export function removeRecentProject(value26, value27) {
  const enabled8 = String(value27 || '').trim();
  if (!enabled8) return listRecentProjects(value26);
  const recentProjects2 = readRecentProjects(value26).filter(
    (item5) => String(item5?.recentId || '') !== enabled8,
  );
  return (writeRecentProjects(value26, recentProjects2), listRecentProjects(value26));
}
export function findRecentProject(value28, value29) {
  const enabled9 = String(value29 || '').trim();
  if (!enabled9) return null;
  return listRecentProjects(value28).find((item6) => item6.recentId === enabled9) || null;
}
