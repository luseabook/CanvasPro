import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const CUSTOM_AI_APP_STORAGE_VERSION = 1;
export const CUSTOM_AI_APP_STORAGE_DIRNAME = 'custom-ai-apps';
export const CUSTOM_AI_APP_SOURCE_TYPES = Object.freeze([
  'runninghub-ai-app',
  'comfyui-local-workflow',
  'comfyui-cloud-workflow',
]);

const SOURCE_DIR_BY_TYPE = Object.freeze({
  'runninghub-ai-app': 'runninghub-ai-app',
  'comfyui-local-workflow': 'comfyui-local-workflow',
  'comfyui-cloud-workflow': 'comfyui-cloud-workflow',
});
const SAVED_APPS_FILENAME = 'saved-apps.json';
const PANEL_DRAFT_FILENAME = 'panel-draft.json';
const KIND_KEYS = Object.freeze(['image', 'video', 'audio']);

function normalizeSourceType(value) {
  const type = String(value || '').trim();
  return CUSTOM_AI_APP_SOURCE_TYPES.includes(type) ? type : '';
}

function normalizeKind(value) {
  const kind = String(value || '').trim();
  return KIND_KEYS.includes(kind) ? kind : 'image';
}

function cloneJson(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch {
    return fallback;
  }
}

function readJsonFileSafe(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeJsonFileAtomic(filePath, payload) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = filePath + '.' + process.pid + '.' + Date.now() + '.tmp';
  writeFileSync(tempPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  renameSync(tempPath, filePath);
}

function getSourceDirName(sourceType) {
  return SOURCE_DIR_BY_TYPE[normalizeSourceType(sourceType)] || SOURCE_DIR_BY_TYPE['runninghub-ai-app'];
}

function getSourceFilePath(root, sourceType, filename) {
  return path.join(root, getSourceDirName(sourceType), filename);
}

function getStorageFilePaths(root) {
  return CUSTOM_AI_APP_SOURCE_TYPES.flatMap((sourceType) => [
    getSourceFilePath(root, sourceType, SAVED_APPS_FILENAME),
    getSourceFilePath(root, sourceType, PANEL_DRAFT_FILENAME),
  ]);
}

function readSavedAppsForSource(root, sourceType) {
  const parsed = readJsonFileSafe(getSourceFilePath(root, sourceType, SAVED_APPS_FILENAME));
  const items = Array.isArray(parsed?.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
  return items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...cloneJson(item, {}),
      sourceType: normalizeSourceType(item.sourceType) || sourceType,
    }));
}

function splitSavedAppsBySource(savedApps = []) {
  const grouped = CUSTOM_AI_APP_SOURCE_TYPES.reduce((acc, sourceType) => {
    acc[sourceType] = [];
    return acc;
  }, {});
  (Array.isArray(savedApps) ? savedApps : []).forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const sourceType = normalizeSourceType(item.sourceType) || 'runninghub-ai-app';
    grouped[sourceType].push({ ...cloneJson(item, {}), sourceType });
  });
  return grouped;
}

function resolveKindStateTarget(key) {
  const raw = String(key || '').trim();
  if (!raw) return null;
  const separator = raw.indexOf(':');
  if (separator > 0) {
    const sourceType = normalizeSourceType(raw.slice(0, separator));
    if (sourceType) return { sourceType, kind: normalizeKind(raw.slice(separator + 1)) };
  }
  return { sourceType: 'runninghub-ai-app', kind: normalizeKind(raw) };
}

function splitPanelDraftBySource(panelDraft = {}) {
  const activeSourceType = normalizeSourceType(panelDraft?.sourceType);
  const activeKind = normalizeKind(panelDraft?.kind);
  const split = CUSTOM_AI_APP_SOURCE_TYPES.reduce((acc, sourceType) => {
    acc[sourceType] = {
      version: CUSTOM_AI_APP_STORAGE_VERSION,
      sourceType,
      active: activeSourceType === sourceType,
      kind: activeSourceType === sourceType ? activeKind : 'image',
      kindStates: {},
    };
    return acc;
  }, {});
  const kindStates =
    panelDraft?.kindStates && typeof panelDraft.kindStates === 'object' ? panelDraft.kindStates : {};
  Object.entries(kindStates).forEach(([key, value]) => {
    const target = resolveKindStateTarget(key);
    if (!target) return;
    split[target.sourceType].kindStates[target.kind] = cloneJson(value, {});
  });
  return split;
}

function readPanelDraftForSource(root, sourceType) {
  const parsed = readJsonFileSafe(getSourceFilePath(root, sourceType, PANEL_DRAFT_FILENAME));
  if (!parsed || typeof parsed !== 'object')
    return { sourceType, active: false, kind: 'image', kindStates: {} };
  const kindStates = parsed.kindStates && typeof parsed.kindStates === 'object' ? parsed.kindStates : {};
  return {
    sourceType,
    active: parsed.active === true,
    kind: normalizeKind(parsed.kind),
    kindStates: cloneJson(kindStates, {}),
  };
}

function combinePanelDrafts(drafts = []) {
  const activeDraft = drafts.find((draft) => draft?.active === true);
  const kindStates = {};
  drafts.forEach((draft) => {
    const sourceType = normalizeSourceType(draft?.sourceType);
    if (!sourceType) return;
    Object.entries(draft.kindStates || {}).forEach(([key, value]) => {
      kindStates[sourceType + ':' + normalizeKind(key)] = cloneJson(value, {});
    });
  });
  return {
    sourceType: normalizeSourceType(activeDraft?.sourceType),
    kind: normalizeKind(activeDraft?.kind),
    kindStates,
  };
}

export function createCustomAiAppStorage({ getDataDir } = {}) {
  function getStorageRoot() {
    const dataDir = String(typeof getDataDir === 'function' ? getDataDir() : '').trim();
    if (!dataDir) throw new Error('Custom AI app storage data directory is unavailable');
    return path.join(path.resolve(dataDir), CUSTOM_AI_APP_STORAGE_DIRNAME);
  }
  function read() {
    const root = getStorageRoot();
    const hasData = getStorageFilePaths(root).some((filePath) => existsSync(filePath));
    const savedApps = CUSTOM_AI_APP_SOURCE_TYPES.flatMap((sourceType) =>
      readSavedAppsForSource(root, sourceType),
    );
    const panelDraft = combinePanelDrafts(
      CUSTOM_AI_APP_SOURCE_TYPES.map((sourceType) => readPanelDraftForSource(root, sourceType)),
    );
    return {
      ok: true,
      version: CUSTOM_AI_APP_STORAGE_VERSION,
      storageRoot: root,
      hasData,
      savedApps,
      panelDraft,
    };
  }
  function write(payload = {}) {
    const root = getStorageRoot();
    mkdirSync(root, { recursive: true });
    const savedBySource = splitSavedAppsBySource(payload?.savedApps);
    CUSTOM_AI_APP_SOURCE_TYPES.forEach((sourceType) => {
      writeJsonFileAtomic(getSourceFilePath(root, sourceType, SAVED_APPS_FILENAME), {
        version: CUSTOM_AI_APP_STORAGE_VERSION,
        sourceType,
        items: savedBySource[sourceType] || [],
      });
    });
    const panelDraftBySource = splitPanelDraftBySource(payload?.panelDraft);
    CUSTOM_AI_APP_SOURCE_TYPES.forEach((sourceType) => {
      writeJsonFileAtomic(getSourceFilePath(root, sourceType, PANEL_DRAFT_FILENAME), panelDraftBySource[sourceType]);
    });
    return { ok: true, version: CUSTOM_AI_APP_STORAGE_VERSION, storageRoot: root };
  }
  return { getStorageRoot, read, write };
}
