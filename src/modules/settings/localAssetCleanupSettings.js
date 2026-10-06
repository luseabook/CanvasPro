import {
  canUseLocalAssetCleanup,
  formatCleanupBytes,
  scanLocalAssetCleanup,
  summarizeLocalAssetCleanupScan,
  trashLocalAssetCleanup,
} from '../../services/localAssetCleanupService.js';
import { t } from '../../i18n/index.js';
import { showError, showSuccess } from '../../services/toastService.js';
import { createLocalAssetCleanupList } from './localAssetCleanupList.js';
const text = (value, item = {}) => t('settings.fileSave.localCleanup.' + value, item),
  runtimeText = (key, index = {}) => t('settings.fileSave.cleanupRuntime.' + key, index);
export function initLocalAssetCleanupSettings() {
  const el = document.getElementById('localAssetCleanupCard'),
    el2 = document.getElementById('btnLocalAssetCleanupScan'),
    el3 = document.getElementById('btnLocalAssetCleanupTrash');
  if (!el || !el2 || !el3) return;
  el.hidden = !canUseLocalAssetCleanup();
  if (el.hidden || el.dataset.cleanupInitialized) return;
  el.dataset.cleanupInitialized = 'true';
  const el4 = document.getElementById('localAssetCleanupStatus'),
    el5 = document.getElementById('localAssetCleanupCount'),
    el6 = document.getElementById('localAssetCleanupSize');
  let response = null,
    result = false;
  const localAssetCleanupList = createLocalAssetCleanupList({
    list: document.getElementById('localAssetCleanupList'),
    toolbar: document.getElementById('localAssetCleanupToolbar'),
    details: document.getElementById('localAssetCleanupDetails'),
    onSelectionChange: (list) => {
      el3.disabled = result || !list.length;
    },
  });
  function run(data, options = '') {
    ((el4.textContent = data),
      el4.classList.toggle('is-error', options === 'error'),
      el4.classList.toggle('is-success', options === 'success'));
  }
  function run2(target, source) {
    ((result = target), (el2.disabled = target));
    for (const [el7, next] of [
      [el2, 'scan'],
      [el3, 'trash'],
    ]) {
      (el7.setAttribute('aria-busy', String(target && source === next)),
        (el7.textContent = text(
          target && source === next ? next + 'Busy' : next,
        )));
    }
    localAssetCleanupList.setBusy(target);
  }
  function run3(args) {
    ((response = args
      ? { ...args, items: Array.isArray(args.items) ? args.items : [] }
      : null),
      (el5.textContent = String(response?.items.length || 0)),
      (el6.textContent = formatCleanupBytes(response?.orphanBytes)),
      localAssetCleanupList.setScan(response));
    if (response) run(summarizeLocalAssetCleanupScan(response), response.ok ? '' : 'error');
  }
  (run3(null),
    run(text('idle')),
    el2.addEventListener('click', async () => {
      if (result) return;
      (run3(null), run2(true, 'scan'), run(text('scanning')));
      try {
        run3(await scanLocalAssetCleanup());
      } catch (error) {
        (run(error?.message || runtimeText('scanFailed'), 'error'),
          showError(
            runtimeText('scanFailedDetail', { error: error?.message || runtimeText('scanFailed') }),
          ));
      } finally {
        run2(false);
      }
    }),
    el3.addEventListener('click', async () => {
      if (result || !response?.ok || response.canTrash === false) return;
      const count = localAssetCleanupList.selectedItems();
      if (!count.length) return;
      const enabled = window.confirm?.(
        runtimeText('confirmTrash', {
          count: count.length,
          bytes: formatCleanupBytes(
            count.reduce((current, entry) => current + Number(entry.size || 0), 0),
          ),
        }),
      );
      if (!enabled) return;
      (run2(true, 'trash'), run(text('trashing')));
      try {
        const count2 = await trashLocalAssetCleanup(
            response,
            count.map((record) => record.localPath),
          ),
          skipped = count2?.skipped?.length || 0,
          failed = count2?.errors?.length || 0,
          message = runtimeText('trashedMessage', {
            count: count2?.trashedCount || 0,
            bytes: formatCleanupBytes(count2?.trashedBytes),
          }),
          message2 =
            skipped || failed
              ? runtimeText('trashPartial', { message: message, skipped: skipped, failed: failed })
              : message;
        run3(null);
        try {
          const response2 = await scanLocalAssetCleanup();
          (run3(response2),
            run(
              response2.ok ? message2 : message2 + '；' + runtimeText('scanIncomplete'),
              failed || !response2.ok ? 'error' : 'success',
            ));
        } catch (error2) {
          run(
            runtimeText('refreshFailed', {
              message: message2,
              error: error2?.message || runtimeText('scanFailed'),
            }),
            'error',
          );
        }
        if (failed) showError(runtimeText('trashPartialToast'));
        else showSuccess(message2);
      } catch (error3) {
        (run3(null),
          run(error3?.message || runtimeText('trashFailed'), 'error'),
          showError(
            runtimeText('trashFailedDetail', { error: error3?.message || runtimeText('trashFailed') }),
          ));
      } finally {
        run2(false);
      }
    }));
}
