import {
  fetchFileSavePathMigrationStatus,
  fetchUserSettingsFromServer,
  saveUserSettingsToServer,
  startFileSavePathMigration,
} from '../../../api/userSettingsApi.js';
import { t } from '../../i18n/index.js';
import { fileSavePathChanges } from './fileSaveMigrationGuard.js';
import { initLegacyFileSaveImport } from './legacyFileSaveImport.js';
import { showError, showSuccess } from '../../services/toastService.js';
const MIGRATION_POLL_INTERVAL_MS = 0x15e,
  ROOT_FIELD_ID = 'fileSaveRootDir',
  ROOT_BUTTON_ID = 'btnFileSaveRootDirPick',
  FIELD_IDS = { canvasDir: 'fileSaveCanvasDir', dataDir: 'fileSaveDataDir', outputDir: 'fileSaveOutputDir' },
  MANAGED_DIR_NAMES = { canvasDir: 'projects', dataDir: 'data', outputDir: 'output' },
  MIGRATION_STAGE_I18N_KEYS = Object.freeze({
    准备迁移文件: 'migration.preparing',
    正在创建迁移任务: 'migration.creatingTask',
    正在迁移文件: 'migration.migrating',
    正在迁移输出文件保存路径: 'migration.migrateOutput',
    正在检查旧目录: 'migration.inspecting',
    '正在复制文件（保留旧目录）': 'migration.copying',
    正在应用新的保存位置: 'migration.applying',
    '旧版文件复制完成（旧目录仍保留）': 'migration.legacyDone',
    '迁移失败；旧目录仍保留，请核对当前保存路径': 'migration.failedStage',
    迁移完成: 'migration.done',
  });
function fileSaveText(_0x51aec3, _0x9409d1 = {}) {
  return t('settings.fileSave.' + _0x51aec3, _0x9409d1);
}
function errorMessage(_0x522af8) {
  return _0x522af8?.message || fileSaveText('runtime.unknownError');
}
function getInput(_0x30e47d) {
  return document.getElementById(FIELD_IDS[_0x30e47d]);
}
function getRootInput() {
  return document.getElementById(ROOT_FIELD_ID);
}
function getRootPickButton() {
  return document.getElementById(ROOT_BUTTON_ID);
}
function normalizeText(_0x207738) {
  return String(_0x207738 || '').trim();
}
function translateMigrationStage(_0x45679c) {
  const _0x160179 = normalizeText(_0x45679c);
  if (!_0x160179) return '';
  const _0x28fb5a = MIGRATION_STAGE_I18N_KEYS[_0x160179];
  return _0x28fb5a ? fileSaveText(_0x28fb5a) : _0x160179;
}
function trimTrailingPathSeparators(_0x1e5eee) {
  const _0x29398b = normalizeText(_0x1e5eee);
  if (/^[a-zA-Z]:[\\/]*$/.test(_0x29398b)) return _0x29398b.slice(0, 2) + '\\';
  if (_0x29398b === '/' || _0x29398b === '\\') return _0x29398b;
  return _0x29398b.replace(/[\\/]+$/g, '');
}
function getPathSeparator(_0x35d6ea) {
  const _0x3e01fb = normalizeText(_0x35d6ea);
  return _0x3e01fb.includes('\\') && !_0x3e01fb.includes('/') ? '\\' : '/';
}
function joinPath(_0x370908, _0x2e828d) {
  const _0x2d5a42 = trimTrailingPathSeparators(_0x370908);
  if (!_0x2d5a42) return '';
  if (_0x2d5a42 === '/' || _0x2d5a42 === '\\') return '' + _0x2d5a42 + _0x2e828d;
  if (/^[a-zA-Z]:\\$/.test(_0x2d5a42)) return '' + _0x2d5a42 + _0x2e828d;
  return '' + _0x2d5a42 + getPathSeparator(_0x2d5a42) + _0x2e828d;
}
function pathKey(_0x311756) {
  return trimTrailingPathSeparators(_0x311756).replace(/\\/g, '/').toLowerCase();
}
function pathBasename(_0x994593) {
  const _0x2c9518 = trimTrailingPathSeparators(_0x994593).replace(/\\/g, '/'),
    _0x541536 = _0x2c9518.split('/').filter(Boolean);
  return _0x541536.at(-1) || '';
}
function normalizeParentPath(_0x14412a) {
  const _0x18a4a6 = trimTrailingPathSeparators(_0x14412a),
    _0x596506 = _0x18a4a6.match(/^(.*)[\\/][^\\/]+$/);
  if (!_0x596506) return '';
  const _0x1d928b = trimTrailingPathSeparators(_0x596506[1]);
  return /^[a-zA-Z]:$/.test(_0x1d928b) ? _0x1d928b + '\\' : _0x1d928b;
}
function buildManagedPaths(_0xa4747c) {
  const _0x65243a = trimTrailingPathSeparators(_0xa4747c);
  return {
    canvasDir: joinPath(_0x65243a, MANAGED_DIR_NAMES.canvasDir),
    dataDir: joinPath(_0x65243a, MANAGED_DIR_NAMES.dataDir),
    outputDir: joinPath(_0x65243a, MANAGED_DIR_NAMES.outputDir),
  };
}
function inferManagedRoot(_0xf3e96f) {
  const _0x2107c5 = normalizeFileSavePaths(_0xf3e96f),
    _0x2df11f = [];
  for (const [_0x2083db, _0x564292] of Object.entries(MANAGED_DIR_NAMES)) {
    const _0x2e9916 = normalizeText(_0x2107c5?.[_0x2083db]);
    if (!_0x2e9916 || pathBasename(_0x2e9916).toLowerCase() !== _0x564292.toLowerCase()) return '';
    _0x2df11f.push(normalizeParentPath(_0x2e9916));
  }
  const [_0x42739e] = _0x2df11f;
  if (!_0x42739e) return '';
  return _0x2df11f.every((_0x3a167d) => pathKey(_0x3a167d) === pathKey(_0x42739e)) ? _0x42739e : '';
}
function inferDataDirFromTempDir(_0x3f7f1f) {
  const _0x192125 = normalizeText(_0x3f7f1f).replace(/\\/g, '/');
  if (!_0x192125) return '';
  return /\/uploads\/?$/i.test(_0x192125) ? _0x192125.replace(/\/uploads\/?$/i, '') : _0x192125;
}
function normalizeFileSavePaths(_0x20f79c) {
  return {
    ...(_0x20f79c || {}),
    dataDir: normalizeText(_0x20f79c?.dataDir) || inferDataDirFromTempDir(_0x20f79c?.tempDir),
  };
}
function applyPathsToInputs(_0x316947) {
  const _0x536254 = normalizeFileSavePaths(_0x316947),
    _0x278abd = getRootInput();
  if (_0x278abd) _0x278abd.value = inferManagedRoot(_0x536254);
  for (const _0x19e126 of Object.keys(FIELD_IDS)) {
    const _0x50e17b = getInput(_0x19e126);
    if (_0x50e17b) _0x50e17b.value = normalizeText(_0x536254?.[_0x19e126]);
  }
}
function setInputsDisabled(_0x512053) {
  const _0x116923 = getRootInput(),
    _0x34b00e = getRootPickButton();
  if (_0x116923) _0x116923.disabled = !!_0x512053;
  if (_0x34b00e) _0x34b00e.disabled = !!_0x512053;
  for (const _0x172216 of Object.keys(FIELD_IDS)) {
    const _0x2912dc = getInput(_0x172216);
    if (_0x2912dc) _0x2912dc.disabled = !!_0x512053;
  }
}
function readPathsFromInputs() {
  const _0x475c69 = normalizeText(getRootInput()?.value);
  if (_0x475c69) return buildManagedPaths(_0x475c69);
  return {
    canvasDir: normalizeText(getInput('canvasDir')?.value),
    dataDir: normalizeText(getInput('dataDir')?.value),
    outputDir: normalizeText(getInput('outputDir')?.value),
  };
}
function validateRequired(_0x49d558) {
  if (
    !normalizeText(getRootInput()?.value) &&
    !_0x49d558.canvasDir &&
    !_0x49d558.dataDir &&
    !_0x49d558.outputDir
  )
    return fileSaveText('validation.chooseRoot');
  if (!_0x49d558.canvasDir) return fileSaveText('validation.projectPath');
  if (!_0x49d558.dataDir) return fileSaveText('validation.dataPath');
  if (!_0x49d558.outputDir) return fileSaveText('validation.outputPath');
  return '';
}
function setSaving(_0x48b8eb, _0x2123cc) {
  if (!_0x48b8eb) return;
  ((_0x48b8eb.disabled = !!_0x2123cc),
    (_0x48b8eb.textContent = _0x2123cc ? fileSaveText('runtime.saving') : fileSaveText('save')));
}
function getDirectoryPicker() {
  return globalThis.window?.electronAPI?.selectDirectory;
}
function readSelectedDirectory(_0x31f057) {
  if (!_0x31f057 || _0x31f057.canceled) return '';
  if (_0x31f057.success === false) return '';
  return normalizeText(_0x31f057.path || _0x31f057.filePath || _0x31f057.filePaths?.[0]);
}
function getPickButtonLabel(_0x44baf0) {
  return normalizeText(
    _0x44baf0?.querySelector?.('span')?.textContent ||
      _0x44baf0?.textContent ||
      fileSaveText('runtime.choose'),
  );
}
function setPickButtonLabel(_0x572333, _0x26c956) {
  const _0x2d8566 = _0x572333?.querySelector?.('span');
  if (_0x2d8566) _0x2d8566.textContent = _0x26c956;
  else _0x572333 && (_0x572333.textContent = _0x26c956);
}
function syncDerivedInputsFromRoot() {
  const _0x590dd2 = normalizeText(getRootInput()?.value);
  if (!_0x590dd2) return;
  applyPathsToInputs(buildManagedPaths(_0x590dd2));
}
async function pickRootDirectory() {
  const _0x13699e = getRootInput(),
    _0x2856a6 = getDirectoryPicker();
  if (!_0x13699e || typeof _0x2856a6 !== 'function') {
    showError(fileSaveText('runtime.pickerUnsupported'));
    return;
  }
  const _0xfdf399 = getRootPickButton(),
    _0x54f641 = getPickButtonLabel(_0xfdf399);
  _0xfdf399 && ((_0xfdf399.disabled = true), setPickButtonLabel(_0xfdf399, fileSaveText('runtime.choosing')));
  try {
    const _0x118a1a = await _0x2856a6({
        title: fileSaveText('runtime.pickTitle'),
        defaultPath: normalizeText(_0x13699e.value),
      }),
      _0x15050b = readSelectedDirectory(_0x118a1a);
    _0x15050b && ((_0x13699e.value = _0x15050b), syncDerivedInputsFromRoot(), _0x13699e.focus?.());
  } catch (_0x5cc66e) {
    (console.error('[Settings] 选择保存目录失败:', _0x5cc66e),
      showError(fileSaveText('runtime.pickFailed', { error: errorMessage(_0x5cc66e) })));
  } finally {
    _0xfdf399 && ((_0xfdf399.disabled = false), setPickButtonLabel(_0xfdf399, _0x54f641));
  }
}
function bindDirectoryPickers() {
  const _0x3ebceb = getRootInput();
  _0x3ebceb &&
    !_0x3ebceb.__fileSaveRootInputBound &&
    ((_0x3ebceb.__fileSaveRootInputBound = true),
    _0x3ebceb.addEventListener('input', syncDerivedInputsFromRoot));
  const _0x4d8278 = getRootPickButton();
  _0x4d8278 &&
    !_0x4d8278.__fileSaveDirectoryPickerBound &&
    ((_0x4d8278.__fileSaveDirectoryPickerBound = true),
    _0x4d8278.addEventListener('click', () => {
      void pickRootDirectory();
    }));
}
function sleep(_0x13c640) {
  return new Promise((_0x3a9bd9) => setTimeout(_0x3a9bd9, _0x13c640));
}
function getMigrationElements() {
  return {
    card: document.getElementById('fileSaveMigrationCard'),
    stage: document.getElementById('fileSaveMigrationStage'),
    percent: document.getElementById('fileSaveMigrationPercent'),
    bar: document.getElementById('fileSaveMigrationBar'),
    processed: document.getElementById('fileSaveMigrationProcessed'),
    copied: document.getElementById('fileSaveMigrationCopied'),
    skipped: document.getElementById('fileSaveMigrationSkipped'),
    failed: document.getElementById('fileSaveMigrationFailed'),
    current: document.getElementById('fileSaveMigrationCurrent'),
    errors: document.getElementById('fileSaveMigrationErrors'),
  };
}
function clampPercent(_0x4d76f7) {
  const _0x1d1f72 = Number(_0x4d76f7);
  if (!Number.isFinite(_0x1d1f72)) return 0;
  return Math.max(0, Math.min(100, Math.round(_0x1d1f72)));
}
function renderMigrationErrors(_0x94b24b, _0x546640) {
  if (!_0x94b24b) return;
  const _0x326028 = Array.isArray(_0x546640) ? _0x546640 : [];
  (_0x94b24b.replaceChildren(), (_0x94b24b.hidden = _0x326028.length === 0));
  for (const _0x5a6965 of _0x326028.slice(0, 20)) {
    const _0xb1b189 = document.createElement('div');
    _0xb1b189.className = 'settings-file-migration-error';
    const _0x21a73c = normalizeText(_0x5a6965?.path || _0x5a6965?.localPath || ''),
      _0x344c67 = normalizeText(_0x5a6965?.error || fileSaveText('migration.itemFailed'));
    ((_0xb1b189.textContent = _0x21a73c ? _0x21a73c + ' · ' + _0x344c67 : _0x344c67),
      _0x94b24b.appendChild(_0xb1b189));
  }
}
function renderMigrationStatus(_0x5374ae) {
  const _0x29afbd = getMigrationElements();
  if (!_0x29afbd.card) return;
  _0x29afbd.card.hidden = false;
  const _0x8b5b92 = clampPercent(_0x5374ae?.progress);
  if (_0x29afbd.percent) _0x29afbd.percent.textContent = _0x8b5b92 + '%';
  if (_0x29afbd.bar) _0x29afbd.bar.style.width = _0x8b5b92 + '%';
  _0x29afbd.stage &&
    (_0x29afbd.stage.textContent =
      translateMigrationStage(_0x5374ae?.stage) || fileSaveText('migration.migrating'));
  const _0x2c6558 = Number(_0x5374ae?.processedFiles || 0),
    _0x2d1ab2 = Number(_0x5374ae?.totalFiles || 0);
  _0x29afbd.processed && (_0x29afbd.processed.textContent = _0x2c6558 + ' / ' + (_0x2d1ab2 || _0x2c6558));
  if (_0x29afbd.copied) _0x29afbd.copied.textContent = String(Number(_0x5374ae?.copiedCount || 0));
  if (_0x29afbd.skipped) _0x29afbd.skipped.textContent = String(Number(_0x5374ae?.skippedCount || 0));
  if (_0x29afbd.failed) _0x29afbd.failed.textContent = String(Number(_0x5374ae?.failedCount || 0));
  const _0x59410d = normalizeText(_0x5374ae?.currentFile);
  (_0x29afbd.current &&
    ((_0x29afbd.current.textContent = _0x59410d
      ? fileSaveText('migration.current', { file: _0x59410d })
      : ''),
    (_0x29afbd.current.title = _0x59410d)),
    renderMigrationErrors(_0x29afbd.errors, _0x5374ae?.errors));
}
function resetMigrationStatus() {
  const _0x4bee79 = getMigrationElements();
  if (_0x4bee79.card) _0x4bee79.card.hidden = true;
  if (_0x4bee79.stage) _0x4bee79.stage.textContent = fileSaveText('migration.preparing');
  if (_0x4bee79.percent) _0x4bee79.percent.textContent = '0%';
  if (_0x4bee79.bar) _0x4bee79.bar.style.width = '0%';
  if (_0x4bee79.processed) _0x4bee79.processed.textContent = '0 / 0';
  if (_0x4bee79.copied) _0x4bee79.copied.textContent = '0';
  if (_0x4bee79.skipped) _0x4bee79.skipped.textContent = '0';
  if (_0x4bee79.failed) _0x4bee79.failed.textContent = '0';
  (_0x4bee79.current && ((_0x4bee79.current.textContent = ''), (_0x4bee79.current.title = '')),
    renderMigrationErrors(_0x4bee79.errors, []));
}
function isMigrationFinished(_0x32a16c) {
  const _0x5086c7 = normalizeText(_0x32a16c?.status);
  return _0x5086c7 === 'done' || _0x5086c7 === 'error';
}
async function pollMigrationUntilFinished(_0x3e4ceb) {
  let _0x456a53 = null;
  while (true) {
    (await sleep(MIGRATION_POLL_INTERVAL_MS),
      (_0x456a53 = await fetchFileSavePathMigrationStatus(_0x3e4ceb)),
      renderMigrationStatus(_0x456a53));
    if (isMigrationFinished(_0x456a53)) return _0x456a53;
  }
}
function buildMigrationSummary(_0x4ce30b) {
  const _0x14951c = Number(_0x4ce30b?.copiedCount || 0),
    _0x3aceb0 = Number(_0x4ce30b?.skippedCount || 0),
    _0x255898 = Number(_0x4ce30b?.failedCount || 0);
  return fileSaveText('migration.summary', { copied: _0x14951c, skipped: _0x3aceb0, failed: _0x255898 });
}
function confirmSavePathChanges(changes) {
  const confirm = globalThis.window?.confirm;
  if (typeof confirm !== 'function') throw new Error(fileSaveText('migration.confirmUnavailable'));
  const paths = changes.map(({ key, from, to }) =>
    `${fileSaveText('migration.pathLabels.' + key)}:\n${from || '—'}\n→ ${to || '—'}`,
  ).join('\n\n');
  return confirm.call(globalThis.window, fileSaveText('migration.confirmCopy', { paths }));
}
async function saveSettingsWithMigration(settings) {
  renderMigrationStatus({ status: 'pending', stage: fileSaveText('migration.creatingTask'), progress: 0 });
  // Never downgrade a missing migration endpoint to a plain settings write.
  const job = await startFileSavePathMigration(settings, { confirmed: true });
  renderMigrationStatus(job);
  const jobId = normalizeText(job?.jobId);
  if (!jobId) throw new Error(fileSaveText('migration.noJobId'));
  const result = await pollMigrationUntilFinished(jobId);
  if (normalizeText(result?.status) !== 'done')
    throw new Error(result?.error || fileSaveText('migration.failedMessage'));
  return result;
}
export function initFileSaveSettings() {
  const _0x6b9f54 = document.getElementById('btnFileSavePathsSave');
  if (!_0x6b9f54 || _0x6b9f54.__fileSaveSettingsBound) return;
  _0x6b9f54.__fileSaveSettingsBound = true;
  (bindDirectoryPickers(),
    initLegacyFileSaveImport({
      pollMigrationUntilFinished,
      renderMigrationStatus,
      resetMigrationStatus,
      saveButton: _0x6b9f54,
      setSaveControlsBusy: (busy) => {
        setSaving(_0x6b9f54, busy);
        setInputsDisabled(busy);
      },
    }),
    fetchUserSettingsFromServer()
      .then((_0x2d0353) => {
        applyPathsToInputs(_0x2d0353?.fileSavePaths || {});
      })
      .catch((_0x2b9ed7) => {
        (console.error('[Settings] 加载文件与保存路径失败:', _0x2b9ed7),
          showError(fileSaveText('runtime.loadFailed')));
      }),
    resetMigrationStatus(),
    _0x6b9f54.addEventListener('click', async () => {
      const _0x3cc6b6 = readPathsFromInputs(),
        _0x80a3a6 = validateRequired(_0x3cc6b6);
      if (_0x80a3a6) {
        showError(_0x80a3a6);
        return;
      }
      (setSaving(_0x6b9f54, true), setInputsDisabled(true), resetMigrationStatus());
      try {
        const current = await fetchUserSettingsFromServer();
        const proposed = {
          ...(current || {}),
          fileSavePaths: _0x3cc6b6,
          fileSavePathsMeta: {
            ...(current?.fileSavePathsMeta || {}),
            source: 'user',
            mode: normalizeText(getRootInput()?.value) ? 'root' : 'custom',
            rootDir: normalizeText(getRootInput()?.value),
            updatedAt: Date.now(),
          },
        };
        const changes = fileSavePathChanges(current?.fileSavePaths, _0x3cc6b6);
        if (changes.length && !confirmSavePathChanges(changes)) return;
        let result;
        if (changes.length) {
          result = await saveSettingsWithMigration(proposed);
        } else {
          const saved = await saveUserSettingsToServer(proposed);
          result = { status: 'done', copiedCount: 0, skippedCount: 0,
            failedCount: 0, settings: saved?.settings };
        }
        const applied = result?.settings || (await fetchUserSettingsFromServer());
        applyPathsToInputs(applied?.fileSavePaths || _0x3cc6b6);
        if (Number(result?.failedCount || 0) > 0) {
          showError(fileSaveText('runtime.partialMigrationFailed', { summary: buildMigrationSummary(result) }));
        } else {
          showSuccess(changes.length ? buildMigrationSummary(result) : fileSaveText('runtime.savedWithoutMigration'));
        }
      } catch (_0x2a5bcb) {
        (console.error('[Settings] 保存文件与保存路径失败:', _0x2a5bcb),
          showError(fileSaveText('runtime.saveFailed', { error: errorMessage(_0x2a5bcb) })));
      } finally {
        (setSaving(_0x6b9f54, false), setInputsDisabled(false));
      }
    }));
}
