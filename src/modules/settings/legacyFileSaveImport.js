import {
  fetchLegacyFileSaveCandidates,
  startLegacyFileSaveCopy,
} from '../../../api/userSettingsApi.js';
import { t } from '../../i18n/index.js';
import { showError, showSuccess } from '../../services/toastService.js';

const BUCKETS = Object.freeze(['canvasDir', 'dataDir', 'outputDir']);
const text = (key, vars = {}) => t('settings.fileSave.legacyImport.' + key, vars);

export function isLegacyImportCandidateReady(candidate) {
  return !!candidate && typeof candidate.id === 'string' &&
    /^[a-f0-9]{64}$/.test(String(candidate.fingerprint || '')) &&
    Number(candidate.fileCount) > 0 && !candidate.error;
}

export function legacyImportPathLines(candidate, labelFor = (key) => key) {
  return BUCKETS.map((key) => `${labelFor(key)}:\n${candidate?.sourcePaths?.[key] || '—'}\n→ ${candidate?.targetPaths?.[key] || '—'}`)
    .join('\n\n');
}

export function initLegacyFileSaveImport({
  pollMigrationUntilFinished,
  renderMigrationStatus,
  resetMigrationStatus,
  setSaveControlsBusy,
  saveButton,
} = {}) {
  const scan = document.getElementById('btnFileSaveLegacyScan');
  const copy = document.getElementById('btnFileSaveLegacyCopy');
  const select = document.getElementById('fileSaveLegacyCandidate');
  const status = document.getElementById('fileSaveLegacyStatus');
  if (!scan || !copy || !select || !status) return;
  let candidates = [];

  const currentCandidate = () => candidates.find((candidate) => candidate.id === select.value);
  const updateSelection = () => {
    const candidate = currentCandidate();
    copy.disabled = !isLegacyImportCandidateReady(candidate);
    status.textContent = candidate?.error
      ? text('blocked', { error: candidate.error })
      : candidate
        ? text('preview', { count: candidate.fileCount, root: candidate.sourceRoot })
        : text('noCandidates');
  };
  select.addEventListener('change', updateSelection);
  scan.addEventListener('click', async () => {
    if (saveButton?.disabled) return;
    scan.disabled = true;
    copy.disabled = true;
    select.disabled = true;
    status.textContent = text('scanning');
    try {
      const response = await fetchLegacyFileSaveCandidates();
      candidates = Array.isArray(response?.candidates) ? response.candidates : [];
      select.replaceChildren();
      for (const candidate of candidates) {
        const option = document.createElement('option');
        option.value = candidate.id;
        option.textContent = `${candidate.sourceRoot} · ${candidate.fileCount} ${text('files')}`;
        select.appendChild(option);
      }
      select.disabled = candidates.length === 0;
      updateSelection();
    } catch (error) {
      candidates = [];
      select.replaceChildren();
      status.textContent = text('scanFailed', { error: error?.message || text('unknownError') });
      showError(status.textContent);
    } finally {
      scan.disabled = false;
    }
  });

  copy.addEventListener('click', async () => {
    if (saveButton?.disabled) return;
    const candidate = currentCandidate();
    if (!isLegacyImportCandidateReady(candidate)) return;
    const confirm = globalThis.window?.confirm;
    if (typeof confirm !== 'function') {
      showError(text('confirmUnavailable'));
      return;
    }
    const paths = legacyImportPathLines(candidate, (key) => text('pathLabels.' + key));
    if (!confirm.call(globalThis.window, text('confirm', { count: candidate.fileCount, paths }))) return;
    scan.disabled = true;
    copy.disabled = true;
    select.disabled = true;
    setSaveControlsBusy?.(true);
    resetMigrationStatus?.();
    let startedId = '';
    let confirmedFailure = false;
    try {
      const job = await startLegacyFileSaveCopy({
        candidateId: candidate.id,
        fingerprint: candidate.fingerprint,
        confirmed: true,
      });
      renderMigrationStatus?.(job);
      startedId = String(job?.jobId || '').trim();
      if (!startedId) throw new Error(text('missingJob'));
      const result = await pollMigrationUntilFinished(startedId);
      if (result?.status !== 'done') {
        confirmedFailure = result?.status === 'error';
        throw new Error(result?.error || text('copyFailed'));
      }
      const message = text('done', {
        copied: Number(result.copiedCount || 0),
        identical: Number(result.skippedCount || 0),
      });
      status.textContent = message;
      showSuccess(message);
      // A completed copy does not rewrite absolute media references or delete the old root.
      candidates = [];
      select.replaceChildren();
    } catch (error) {
      const message = startedId && !confirmedFailure
        ? text('statusUnknown', { error: error?.message || text('unknownError'), jobId: startedId })
        : text('copyFailedWithReason', { error: error?.message || text('unknownError') });
      status.textContent = message;
      showError(message);
    } finally {
      setSaveControlsBusy?.(false);
      scan.disabled = false;
      select.disabled = candidates.length === 0;
      copy.disabled = !isLegacyImportCandidateReady(currentCandidate());
    }
  });
}
