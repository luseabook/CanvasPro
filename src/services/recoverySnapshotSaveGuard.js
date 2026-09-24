import { t } from '../i18n/index.js';

const text = value => String(value || '').trim();
const IDENTITY_FIELDS = ['projectId', 'filename', 'recentId', 'displayPath'];
let warnedAboutRetainedSnapshot = false;

export function currentRecoveryIdentity() {
  const win = globalThis.window;
  return {
    projectId: text(win?.currentProjectId),
    filename: text(win?._v2CurrentFile),
    recentId: text(win?._v2CurrentRecentProjectId),
    displayPath: text(win?._v2CurrentProjectDisplayPath),
    lastKnownProjectLastModified: Number(win?._v2CurrentProjectLastModified || 0) || 0,
  };
}

// Capture before writing: a later dirty snapshot must never be cleared by this save.
export async function captureRecoverySnapshotBeforeSave(api, identity = currentRecoveryIdentity()) {
  if (typeof api?.getRecoverySnapshotInfo !== 'function') return null;
  try {
    const info = await api.getRecoverySnapshotInfo(identity);
    if (info?.exists === false && !info?.error && !info?.invalid) return null;
    const canClear = info?.exists === true && !info.invalid && !info.error &&
      typeof api.clearRecoverySnapshotIfMatch === 'function' &&
      /^[a-f0-9]{64}$/.test(text(info.revision)) && !!identity.projectId &&
      IDENTITY_FIELDS.every(field => text(info[field]) === text(identity[field]));
    return { identity, token: canClear ? { projectId: identity.projectId, revision: info.revision } : null };
  } catch {
    // An unreadable result cannot prove the old snapshot is absent.
    return { identity, token: null };
  }
}

export async function clearRecoverySnapshotAfterSave(api, captured, result) {
  if (!captured || result?.success !== true) return { retained: false };
  const original = captured.identity;
  const savedId = text(result.projectId || text(result.filename).replace(/\.(?:aicanvas|aicproj|json)$/i, ''));
  const sameSavedProject = savedId === original.projectId &&
    (!original.filename || text(result.filename) === original.filename) &&
    (!original.recentId || text(result.recentId) === original.recentId) &&
    (!original.displayPath || text(result.displayPath) === original.displayPath);
  if (captured.token && sameSavedProject) {
    try {
      const cleared = await api.clearRecoverySnapshotIfMatch(captured.token);
      if (cleared?.success === true && cleared.cleared === true) {
        warnedAboutRetainedSnapshot = false;
        return { retained: false, cleared: true };
      }
    } catch (error) {
      console.warn('[recoverySnapshot] guarded clear failed:', error);
    }
  }
  if (!warnedAboutRetainedSnapshot) {
    warnedAboutRetainedSnapshot = true;
    try {
      globalThis.window?.showToast?.(t('projectLifecycle.recoverySnapshotRetainedAfterSave'), 'warning');
    } catch (error) {
      console.warn('[recoverySnapshot] retained snapshot notice failed:', error);
    }
  }
  return { retained: true, cleared: false };
}
