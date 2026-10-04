import {
  canUseLocalAssetCleanup,
  formatCleanupBytes,
  scanLegacyLocalAssetCleanup,
  scanLocalAssetCleanup,
  summarizeLocalAssetCleanupScan,
  trashLocalAssetCleanup,
} from '../../services/localAssetCleanupService.js';
import { t } from '../../i18n/index.js';
import { showError, showSuccess } from '../../services/toastService.js';
const MAX_RENDERED_ITEMS = 120,
  CURRENT_CLEANUP_IDS = Object.freeze({
    card: 'localAssetCleanupCard',
    scanBtn: 'btnLocalAssetCleanupScan',
    trashBtn: 'btnLocalAssetCleanupTrash',
    status: 'localAssetCleanupStatus',
    count: 'localAssetCleanupCount',
    size: 'localAssetCleanupSize',
    list: 'localAssetCleanupList',
  }),
  LEGACY_CLEANUP_IDS = Object.freeze({
    card: 'legacyAssetCleanupCard',
    scanBtn: 'btnLegacyAssetCleanupScan',
    trashBtn: 'btnLegacyAssetCleanupTrash',
    status: 'legacyAssetCleanupStatus',
    count: 'legacyAssetCleanupCount',
    size: 'legacyAssetCleanupSize',
    list: 'legacyAssetCleanupList',
  });
function fileSaveText(value, item = {}) {
  return t('settings.fileSave.' + value, item);
}
function cleanupText(key, index = {}) {
  return fileSaveText('cleanupRuntime.' + key, index);
}
function errorMessage(error) {
  return error?.message || fileSaveText('runtime.unknownError');
}
function getElements(response) {
  return {
    card: document.getElementById(response.card),
    scanBtn: document.getElementById(response.scanBtn),
    trashBtn: document.getElementById(response.trashBtn),
    status: document.getElementById(response.status),
    count: document.getElementById(response.count),
    size: document.getElementById(response.size),
    list: document.getElementById(response.list),
  };
}
function setButtonBusy(el, enabled, result) {
  if (!el) return;
  el.disabled = !!enabled;
  if (result) el.textContent = result;
}
function setStatus(el2, data, options = '') {
  if (!el2) return;
  ((el2.textContent = data || ''),
    el2.classList.toggle('is-error', options === 'error'),
    el2.classList.toggle('is-success', options === 'success'));
}
function createItemRow(target) {
  const el3 = document.createElement('div');
  el3.className = 'settings-local-cleanup-item';
  const el4 = document.createElement('div');
  ((el4.className = 'settings-local-cleanup-path'),
    (el4.textContent = target?.localPath || ''),
    (el4.title = target?.localPath || ''));
  const el5 = document.createElement('div');
  return (
    (el5.className = 'settings-local-cleanup-meta'),
    (el5.textContent = formatCleanupBytes(target?.size) + ' · ' + (target?.kind || cleanupText('mediaKind'))),
    el3.appendChild(el4),
    el3.appendChild(el5),
    el3
  );
}
function renderScanResult(source, response2) {
  const count = Array.isArray(source?.items) ? source.items : [];
  response2.count && (response2.count.textContent = String(Number(source?.orphanCount || 0)));
  response2.size && (response2.size.textContent = formatCleanupBytes(source?.orphanBytes || 0));
  setStatus(response2.status, summarizeLocalAssetCleanupScan(source), count.length > 0 ? '' : 'success');
  if (response2.list) {
    (response2.list.replaceChildren(),
      (response2.list.hidden = count.length === 0),
      count.slice(0, MAX_RENDERED_ITEMS).forEach((item2) => {
        response2.list.appendChild(createItemRow(item2));
      }));
    if (count.length > MAX_RENDERED_ITEMS) {
      const el6 = document.createElement('div');
      ((el6.className = 'settings-local-cleanup-more'),
        (el6.textContent = cleanupText('moreFiles', { count: count.length - MAX_RENDERED_ITEMS })),
        response2.list.appendChild(el6));
    }
  }
  response2.trashBtn && (response2.trashBtn.disabled = count.length === 0);
}
function resetScanResult(next) {
  if (next.count) next.count.textContent = '0';
  if (next.size) next.size.textContent = '0 B';
  next.list && ((next.list.hidden = true), next.list.replaceChildren());
  if (next.trashBtn) next.trashBtn.disabled = true;
}
function initCleanupCard({ ids: ids, scan: scan, textScope: textScope }) {
  const response3 = getElements(ids);
  if (!response3.card || !response3.scanBtn || !response3.trashBtn) return;
  const prefix = (current, entry = {}) => fileSaveText(textScope + '.' + current, entry),
    canUseLocalAssetCleanup2 = canUseLocalAssetCleanup();
  response3.card.hidden = !canUseLocalAssetCleanup2;
  if (!canUseLocalAssetCleanup2) return;
  let enabled2 = null;
  (resetScanResult(response3),
    setStatus(response3.status, prefix('idle')),
    response3.scanBtn.addEventListener('click', async () => {
      ((enabled2 = null),
        resetScanResult(response3),
        setStatus(response3.status, prefix('scanning')),
        setButtonBusy(response3.scanBtn, true, prefix('scanBusy')),
        (response3.trashBtn.disabled = true));
      try {
        const args = await scan(),
          record = { ...args, items: Array.isArray(args?.items) ? args.items : [] };
        ((enabled2 = record),
          renderScanResult(record, response3),
          Number(record?.orphanCount || 0) > 0
            ? window.showToast?.(prefix('scanSuccess'), 'success')
            : showSuccess(prefix('scanEmpty')));
      } catch (error2) {
        (console.error('[Settings] 本地素材清理扫描失败:', error2),
          setStatus(response3.status, error2?.message || cleanupText('scanFailed'), 'error'),
          showError(cleanupText('scanFailedDetail', { error: errorMessage(error2) })));
      } finally {
        (setButtonBusy(response3.scanBtn, false, prefix('scan')),
          (response3.trashBtn.disabled = !enabled2?.items?.length));
      }
    }),
    response3.trashBtn.addEventListener('click', async () => {
      const count2 = Array.isArray(enabled2?.items) ? enabled2.items : [];
      if (count2.length === 0) return;
      const enabled3 =
        typeof window.confirm === 'function' &&
        window.confirm(
          cleanupText('confirmTrash', {
            prefix: prefix('confirmPrefix'),
            count: count2.length,
            bytes: formatCleanupBytes(enabled2.orphanBytes),
          }),
        );
      if (!enabled3) return;
      (setStatus(response3.status, prefix('trashing')),
        setButtonBusy(response3.trashBtn, true, prefix('trashBusy')),
        (response3.scanBtn.disabled = true));
      try {
        const count3 = await trashLocalAssetCleanup(
            enabled2,
            count2.map((item3) => item3.localPath),
          ),
          skipped = Array.isArray(count3?.skipped) ? count3.skipped.length : 0,
          failed = Array.isArray(count3?.errors) ? count3.errors.length : 0,
          message = cleanupText('trashedMessage', {
            count: count3?.trashedCount || 0,
            bytes: formatCleanupBytes(count3?.trashedBytes || 0),
          }),
          args2 = await scan();
        ((enabled2 = { ...args2, items: Array.isArray(args2?.items) ? args2.items : [] }),
          renderScanResult(enabled2, response3),
          setStatus(
            response3.status,
            skipped || failed
              ? cleanupText('trashPartial', { message: message, skipped: skipped, failed: failed })
              : message,
            failed ? 'error' : 'success',
          ),
          failed ? showError(cleanupText('trashPartialToast')) : showSuccess(prefix('success')));
      } catch (error3) {
        (console.error('[Settings] 本地素材清理失败:', error3),
          setStatus(response3.status, error3?.message || cleanupText('trashFailed'), 'error'),
          showError(cleanupText('trashFailedDetail', { error: errorMessage(error3) })));
      } finally {
        (setButtonBusy(response3.trashBtn, false, prefix('trash')),
          (response3.scanBtn.disabled = false),
          (response3.trashBtn.disabled = !enabled2?.items?.length));
      }
    }));
}
export function initLocalAssetCleanupSettings() {
  (initCleanupCard({ ids: CURRENT_CLEANUP_IDS, scan: scanLocalAssetCleanup, textScope: 'localCleanup' }),
    initCleanupCard({
      ids: LEGACY_CLEANUP_IDS,
      scan: scanLegacyLocalAssetCleanup,
      textScope: 'legacyCleanup',
    }));
}
