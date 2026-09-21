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
function fileSaveText(_0xc4cb33, _0x23f929 = {}) {
  return t('settings.fileSave.' + _0xc4cb33, _0x23f929);
}
function cleanupText(_0x3c42c3, _0x532118 = {}) {
  return fileSaveText('cleanupRuntime.' + _0x3c42c3, _0x532118);
}
function errorMessage(_0x4e6517) {
  return _0x4e6517?.message || fileSaveText('runtime.unknownError');
}
function getElements(_0x3aee43) {
  return {
    card: document.getElementById(_0x3aee43.card),
    scanBtn: document.getElementById(_0x3aee43.scanBtn),
    trashBtn: document.getElementById(_0x3aee43.trashBtn),
    status: document.getElementById(_0x3aee43.status),
    count: document.getElementById(_0x3aee43.count),
    size: document.getElementById(_0x3aee43.size),
    list: document.getElementById(_0x3aee43.list),
  };
}
function setButtonBusy(_0x5175b7, _0x50a17b, _0x558a48) {
  if (!_0x5175b7) return;
  _0x5175b7.disabled = !!_0x50a17b;
  if (_0x558a48) _0x5175b7.textContent = _0x558a48;
}
function setStatus(_0x3e0c8d, _0x594148, _0x118761 = '') {
  if (!_0x3e0c8d) return;
  ((_0x3e0c8d.textContent = _0x594148 || ''),
    _0x3e0c8d.classList.toggle('is-error', _0x118761 === 'error'),
    _0x3e0c8d.classList.toggle('is-success', _0x118761 === 'success'));
}
function createItemRow(_0x29e193) {
  const _0x12f8b5 = document.createElement('div');
  _0x12f8b5.className = 'settings-local-cleanup-item';
  const _0x11a61e = document.createElement('div');
  ((_0x11a61e.className = 'settings-local-cleanup-path'),
    (_0x11a61e.textContent = _0x29e193?.localPath || ''),
    (_0x11a61e.title = _0x29e193?.localPath || ''));
  const _0x3a45e7 = document.createElement('div');
  return (
    (_0x3a45e7.className = 'settings-local-cleanup-meta'),
    (_0x3a45e7.textContent =
      formatCleanupBytes(_0x29e193?.size) + ' · ' + (_0x29e193?.kind || cleanupText('mediaKind'))),
    _0x12f8b5.appendChild(_0x11a61e),
    _0x12f8b5.appendChild(_0x3a45e7),
    _0x12f8b5
  );
}
function renderScanResult(_0x1c137a, _0x4df5c2) {
  const _0x3ee140 = Array.isArray(_0x1c137a?.items) ? _0x1c137a.items : [];
  _0x4df5c2.count && (_0x4df5c2.count.textContent = String(Number(_0x1c137a?.orphanCount || 0)));
  _0x4df5c2.size && (_0x4df5c2.size.textContent = formatCleanupBytes(_0x1c137a?.orphanBytes || 0));
  setStatus(
    _0x4df5c2.status,
    summarizeLocalAssetCleanupScan(_0x1c137a),
    _0x3ee140.length > 0 ? '' : 'success',
  );
  if (_0x4df5c2.list) {
    (_0x4df5c2.list.replaceChildren(),
      (_0x4df5c2.list.hidden = _0x3ee140.length === 0),
      _0x3ee140.slice(0, MAX_RENDERED_ITEMS).forEach((_0x241435) => {
        _0x4df5c2.list.appendChild(createItemRow(_0x241435));
      }));
    if (_0x3ee140.length > MAX_RENDERED_ITEMS) {
      const _0x12fc97 = document.createElement('div');
      ((_0x12fc97.className = 'settings-local-cleanup-more'),
        (_0x12fc97.textContent = cleanupText('moreFiles', { count: _0x3ee140.length - MAX_RENDERED_ITEMS })),
        _0x4df5c2.list.appendChild(_0x12fc97));
    }
  }
  _0x4df5c2.trashBtn && (_0x4df5c2.trashBtn.disabled = _0x3ee140.length === 0);
}
function resetScanResult(_0x23264a) {
  if (_0x23264a.count) _0x23264a.count.textContent = '0';
  if (_0x23264a.size) _0x23264a.size.textContent = '0 B';
  _0x23264a.list && ((_0x23264a.list.hidden = true), _0x23264a.list.replaceChildren());
  if (_0x23264a.trashBtn) _0x23264a.trashBtn.disabled = true;
}
function initCleanupCard({ ids: _0x5463fe, scan: _0x2266e2, textScope: _0x41c4c2 }) {
  const _0x1ed67f = getElements(_0x5463fe);
  if (!_0x1ed67f.card || !_0x1ed67f.scanBtn || !_0x1ed67f.trashBtn) return;
  const _0x370dcf = (_0x1ccbde, _0xe52c41 = {}) => fileSaveText(_0x41c4c2 + '.' + _0x1ccbde, _0xe52c41),
    _0x46fa83 = canUseLocalAssetCleanup();
  _0x1ed67f.card.hidden = !_0x46fa83;
  if (!_0x46fa83) return;
  let _0x272680 = null;
  (resetScanResult(_0x1ed67f),
    setStatus(_0x1ed67f.status, _0x370dcf('idle')),
    _0x1ed67f.scanBtn.addEventListener('click', async () => {
      ((_0x272680 = null),
        resetScanResult(_0x1ed67f),
        setStatus(_0x1ed67f.status, _0x370dcf('scanning')),
        setButtonBusy(_0x1ed67f.scanBtn, true, _0x370dcf('scanBusy')),
        (_0x1ed67f.trashBtn.disabled = true));
      try {
        const _0x5b9050 = await _0x2266e2(),
          _0x3ba342 = { ..._0x5b9050, items: Array.isArray(_0x5b9050?.items) ? _0x5b9050.items : [] };
        ((_0x272680 = _0x3ba342),
          renderScanResult(_0x3ba342, _0x1ed67f),
          Number(_0x3ba342?.orphanCount || 0) > 0
            ? window.showToast?.(_0x370dcf('scanSuccess'), 'success')
            : showSuccess(_0x370dcf('scanEmpty')));
      } catch (_0xd85f59) {
        (console.error('[Settings] 本地素材清理扫描失败:', _0xd85f59),
          setStatus(_0x1ed67f.status, _0xd85f59?.message || cleanupText('scanFailed'), 'error'),
          showError(cleanupText('scanFailedDetail', { error: errorMessage(_0xd85f59) })));
      } finally {
        (setButtonBusy(_0x1ed67f.scanBtn, false, _0x370dcf('scan')),
          (_0x1ed67f.trashBtn.disabled = !_0x272680?.items?.length));
      }
    }),
    _0x1ed67f.trashBtn.addEventListener('click', async () => {
      const _0x23bb8d = Array.isArray(_0x272680?.items) ? _0x272680.items : [];
      if (_0x23bb8d.length === 0) return;
      const _0x16dcff =
        typeof window.confirm === 'function' &&
        window.confirm(
          cleanupText('confirmTrash', {
            prefix: _0x370dcf('confirmPrefix'),
            count: _0x23bb8d.length,
            bytes: formatCleanupBytes(_0x272680.orphanBytes),
          }),
        );
      if (!_0x16dcff) return;
      (setStatus(_0x1ed67f.status, _0x370dcf('trashing')),
        setButtonBusy(_0x1ed67f.trashBtn, true, _0x370dcf('trashBusy')),
        (_0x1ed67f.scanBtn.disabled = true));
      try {
        const _0x185430 = await trashLocalAssetCleanup(
            _0x272680,
            _0x23bb8d.map((_0x2e2090) => _0x2e2090.localPath),
          ),
          _0x5966af = Array.isArray(_0x185430?.skipped) ? _0x185430.skipped.length : 0,
          _0x51f2b4 = Array.isArray(_0x185430?.errors) ? _0x185430.errors.length : 0,
          _0x30ff8f = cleanupText('trashedMessage', {
            count: _0x185430?.trashedCount || 0,
            bytes: formatCleanupBytes(_0x185430?.trashedBytes || 0),
          }),
          _0x1277bd = await _0x2266e2();
        ((_0x272680 = { ..._0x1277bd, items: Array.isArray(_0x1277bd?.items) ? _0x1277bd.items : [] }),
          renderScanResult(_0x272680, _0x1ed67f),
          setStatus(
            _0x1ed67f.status,
            _0x5966af || _0x51f2b4
              ? cleanupText('trashPartial', { message: _0x30ff8f, skipped: _0x5966af, failed: _0x51f2b4 })
              : _0x30ff8f,
            _0x51f2b4 ? 'error' : 'success',
          ),
          _0x51f2b4 ? showError(cleanupText('trashPartialToast')) : showSuccess(_0x370dcf('success')));
      } catch (_0x809474) {
        (console.error('[Settings] 本地素材清理失败:', _0x809474),
          setStatus(_0x1ed67f.status, _0x809474?.message || cleanupText('trashFailed'), 'error'),
          showError(cleanupText('trashFailedDetail', { error: errorMessage(_0x809474) })));
      } finally {
        (setButtonBusy(_0x1ed67f.trashBtn, false, _0x370dcf('trash')),
          (_0x1ed67f.scanBtn.disabled = false),
          (_0x1ed67f.trashBtn.disabled = !_0x272680?.items?.length));
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
