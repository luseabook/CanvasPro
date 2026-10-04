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
function fileSaveText(value, item = {}) {
  return t('settings.fileSave.' + value, item);
}
function errorMessage(error) {
  return error?.message || fileSaveText('runtime.unknownError');
}
function getInput(index) {
  return document.getElementById(FIELD_IDS[index]);
}
function getRootInput() {
  return document.getElementById(ROOT_FIELD_ID);
}
function getRootPickButton() {
  return document.getElementById(ROOT_BUTTON_ID);
}
function normalizeText(data) {
  return String(data || '').trim();
}
function translateMigrationStage(options) {
  const text = normalizeText(options);
  if (!text) return '';
  const target = MIGRATION_STAGE_I18N_KEYS[text];
  return target ? fileSaveText(target) : text;
}
function trimTrailingPathSeparators(source) {
  const list = normalizeText(source);
  if (/^[a-zA-Z]:[\\/]*$/.test(list)) return list.slice(0, 2) + '\\';
  if (list === '/' || list === '\\') return list;
  return list.replace(/[\\/]+$/g, '');
}
function getPathSeparator(next) {
  const list2 = normalizeText(next);
  return list2.includes('\\') && !list2.includes('/') ? '\\' : '/';
}
function joinPath(entry, record) {
  const trimTrailingPathSeparators2 = trimTrailingPathSeparators(entry);
  if (!trimTrailingPathSeparators2) return '';
  if (trimTrailingPathSeparators2 === '/' || trimTrailingPathSeparators2 === '\\')
    return '' + trimTrailingPathSeparators2 + record;
  if (/^[a-zA-Z]:\\$/.test(trimTrailingPathSeparators2)) return '' + trimTrailingPathSeparators2 + record;
  return '' + trimTrailingPathSeparators2 + getPathSeparator(trimTrailingPathSeparators2) + record;
}
function pathKey(payload) {
  return trimTrailingPathSeparators(payload).replace(/\\/g, '/').toLowerCase();
}
function pathBasename(handle) {
  const trimTrailingPathSeparators3 = trimTrailingPathSeparators(handle).replace(/\\/g, '/'),
    state = trimTrailingPathSeparators3.split('/').filter(Boolean);
  return state.at(-1) || '';
}
function normalizeParentPath(config) {
  const trimTrailingPathSeparators4 = trimTrailingPathSeparators(config),
    enabled = trimTrailingPathSeparators4.match(/^(.*)[\\/][^\\/]+$/);
  if (!enabled) return '';
  const trimTrailingPathSeparators5 = trimTrailingPathSeparators(enabled[1]);
  return /^[a-zA-Z]:$/.test(trimTrailingPathSeparators5)
    ? trimTrailingPathSeparators5 + '\\'
    : trimTrailingPathSeparators5;
}
function buildManagedPaths(scope) {
  const trimTrailingPathSeparators6 = trimTrailingPathSeparators(scope);
  return {
    canvasDir: joinPath(trimTrailingPathSeparators6, MANAGED_DIR_NAMES.canvasDir),
    dataDir: joinPath(trimTrailingPathSeparators6, MANAGED_DIR_NAMES.dataDir),
    outputDir: joinPath(trimTrailingPathSeparators6, MANAGED_DIR_NAMES.outputDir),
  };
}
function inferManagedRoot(input) {
  const fileSavePaths = normalizeFileSavePaths(input),
    list3 = [];
  for (const [output, value2] of Object.entries(MANAGED_DIR_NAMES)) {
    const text2 = normalizeText(fileSavePaths?.[output]);
    if (!text2 || pathBasename(text2).toLowerCase() !== value2.toLowerCase()) return '';
    list3.push(normalizeParentPath(text2));
  }
  const [enabled2] = list3;
  if (!enabled2) return '';
  return list3.every((item2) => pathKey(item2) === pathKey(enabled2)) ? enabled2 : '';
}
function inferDataDirFromTempDir(value3) {
  const text3 = normalizeText(value3).replace(/\\/g, '/');
  if (!text3) return '';
  return /\/uploads\/?$/i.test(text3) ? text3.replace(/\/uploads\/?$/i, '') : text3;
}
function normalizeFileSavePaths(value4) {
  return {
    ...(value4 || {}),
    dataDir: normalizeText(value4?.dataDir) || inferDataDirFromTempDir(value4?.tempDir),
  };
}
function applyPathsToInputs(value5) {
  const fileSavePaths2 = normalizeFileSavePaths(value5),
    el = getRootInput();
  if (el) el.value = inferManagedRoot(fileSavePaths2);
  for (const value6 of Object.keys(FIELD_IDS)) {
    const el2 = getInput(value6);
    if (el2) el2.value = normalizeText(fileSavePaths2?.[value6]);
  }
}
function setInputsDisabled(enabled3) {
  const el3 = getRootInput(),
    el4 = getRootPickButton();
  if (el3) el3.disabled = !!enabled3;
  if (el4) el4.disabled = !!enabled3;
  for (const value7 of Object.keys(FIELD_IDS)) {
    const el5 = getInput(value7);
    if (el5) el5.disabled = !!enabled3;
  }
}
function readPathsFromInputs() {
  const text4 = normalizeText(getRootInput()?.value);
  if (text4) return buildManagedPaths(text4);
  return {
    canvasDir: normalizeText(getInput('canvasDir')?.value),
    dataDir: normalizeText(getInput('dataDir')?.value),
    outputDir: normalizeText(getInput('outputDir')?.value),
  };
}
function validateRequired(enabled4) {
  if (
    !normalizeText(getRootInput()?.value) &&
    !enabled4.canvasDir &&
    !enabled4.dataDir &&
    !enabled4.outputDir
  )
    return fileSaveText('validation.chooseRoot');
  if (!enabled4.canvasDir) return fileSaveText('validation.projectPath');
  if (!enabled4.dataDir) return fileSaveText('validation.dataPath');
  if (!enabled4.outputDir) return fileSaveText('validation.outputPath');
  return '';
}
function setSaving(el6, enabled5) {
  if (!el6) return;
  ((el6.disabled = !!enabled5),
    (el6.textContent = enabled5 ? fileSaveText('runtime.saving') : fileSaveText('save')));
}
function getDirectoryPicker() {
  return globalThis.window?.electronAPI?.selectDirectory;
}
function readSelectedDirectory(response) {
  if (!response || response.canceled) return '';
  if (response.success === false) return '';
  return normalizeText(response.path || response.filePath || response.filePaths?.[0]);
}
function getPickButtonLabel(el7) {
  return normalizeText(
    el7?.querySelector?.('span')?.textContent || el7?.textContent || fileSaveText('runtime.choose'),
  );
}
function setPickButtonLabel(el8, value8) {
  const el9 = el8?.querySelector?.('span');
  if (el9) el9.textContent = value8;
  else el8 && (el8.textContent = value8);
}
function syncDerivedInputsFromRoot() {
  const text5 = normalizeText(getRootInput()?.value);
  if (!text5) return;
  applyPathsToInputs(buildManagedPaths(text5));
}
async function pickRootDirectory() {
  const el10 = getRootInput(),
    handler = getDirectoryPicker();
  if (!el10 || typeof handler !== 'function') {
    showError(fileSaveText('runtime.pickerUnsupported'));
    return;
  }
  const el11 = getRootPickButton(),
    pickButtonLabel = getPickButtonLabel(el11);
  el11 && ((el11.disabled = true), setPickButtonLabel(el11, fileSaveText('runtime.choosing')));
  try {
    const value9 = await handler({
        title: fileSaveText('runtime.pickTitle'),
        defaultPath: normalizeText(el10.value),
      }),
      selectedDirectory = readSelectedDirectory(value9);
    selectedDirectory && ((el10.value = selectedDirectory), syncDerivedInputsFromRoot(), el10.focus?.());
  } catch (value10) {
    (console.error('[Settings] 选择保存目录失败:', value10),
      showError(fileSaveText('runtime.pickFailed', { error: errorMessage(value10) })));
  } finally {
    el11 && ((el11.disabled = false), setPickButtonLabel(el11, pickButtonLabel));
  }
}
function bindDirectoryPickers() {
  const el12 = getRootInput();
  el12 &&
    !el12.__fileSaveRootInputBound &&
    ((el12.__fileSaveRootInputBound = true), el12.addEventListener('input', syncDerivedInputsFromRoot));
  const el13 = getRootPickButton();
  el13 &&
    !el13.__fileSaveDirectoryPickerBound &&
    ((el13.__fileSaveDirectoryPickerBound = true),
    el13.addEventListener('click', () => {
      void pickRootDirectory();
    }));
}
function sleep(value11) {
  return new Promise((value12) => setTimeout(value12, value11));
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
function clampPercent(value13) {
  const value14 = Number(value13);
  if (!Number.isFinite(value14)) return 0;
  return Math.max(0, Math.min(100, Math.round(value14)));
}
function renderMigrationErrors(el14, value15) {
  if (!el14) return;
  const list4 = Array.isArray(value15) ? value15 : [];
  (el14.replaceChildren(), (el14.hidden = list4.length === 0));
  for (const value16 of list4.slice(0, 20)) {
    const el15 = document.createElement('div');
    el15.className = 'settings-file-migration-error';
    const text6 = normalizeText(value16?.path || value16?.localPath || ''),
      text7 = normalizeText(value16?.error || fileSaveText('migration.itemFailed'));
    ((el15.textContent = text6 ? text6 + ' · ' + text7 : text7), el14.appendChild(el15));
  }
}
function renderMigrationStatus(value17) {
  const migrationElements = getMigrationElements();
  if (!migrationElements.card) return;
  migrationElements.card.hidden = false;
  const clampPercent2 = clampPercent(value17?.progress);
  if (migrationElements.percent) migrationElements.percent.textContent = clampPercent2 + '%';
  if (migrationElements.bar) migrationElements.bar.style.width = clampPercent2 + '%';
  migrationElements.stage &&
    (migrationElements.stage.textContent =
      translateMigrationStage(value17?.stage) || fileSaveText('migration.migrating'));
  const value18 = Number(value17?.processedFiles || 0),
    value19 = Number(value17?.totalFiles || 0);
  migrationElements.processed &&
    (migrationElements.processed.textContent = value18 + ' / ' + (value19 || value18));
  if (migrationElements.copied)
    migrationElements.copied.textContent = String(Number(value17?.copiedCount || 0));
  if (migrationElements.skipped)
    migrationElements.skipped.textContent = String(Number(value17?.skippedCount || 0));
  if (migrationElements.failed)
    migrationElements.failed.textContent = String(Number(value17?.failedCount || 0));
  const file = normalizeText(value17?.currentFile);
  (migrationElements.current &&
    ((migrationElements.current.textContent = file ? fileSaveText('migration.current', { file: file }) : ''),
    (migrationElements.current.title = file)),
    renderMigrationErrors(migrationElements.errors, value17?.errors));
}
function resetMigrationStatus() {
  const migrationElements2 = getMigrationElements();
  if (migrationElements2.card) migrationElements2.card.hidden = true;
  if (migrationElements2.stage) migrationElements2.stage.textContent = fileSaveText('migration.preparing');
  if (migrationElements2.percent) migrationElements2.percent.textContent = '0%';
  if (migrationElements2.bar) migrationElements2.bar.style.width = '0%';
  if (migrationElements2.processed) migrationElements2.processed.textContent = '0 / 0';
  if (migrationElements2.copied) migrationElements2.copied.textContent = '0';
  if (migrationElements2.skipped) migrationElements2.skipped.textContent = '0';
  if (migrationElements2.failed) migrationElements2.failed.textContent = '0';
  (migrationElements2.current &&
    ((migrationElements2.current.textContent = ''), (migrationElements2.current.title = '')),
    renderMigrationErrors(migrationElements2.errors, []));
}
function isMigrationFinished(response2) {
  const text8 = normalizeText(response2?.status);
  return text8 === 'done' || text8 === 'error';
}
async function pollMigrationUntilFinished(value20) {
  let fetchFileSavePathMigrationStatus2 = null;
  while (true) {
    (await sleep(MIGRATION_POLL_INTERVAL_MS),
      (fetchFileSavePathMigrationStatus2 = await fetchFileSavePathMigrationStatus(value20)),
      renderMigrationStatus(fetchFileSavePathMigrationStatus2));
    if (isMigrationFinished(fetchFileSavePathMigrationStatus2)) return fetchFileSavePathMigrationStatus2;
  }
}
function buildMigrationSummary(value21) {
  const copied = Number(value21?.copiedCount || 0),
    skipped = Number(value21?.skippedCount || 0),
    failed = Number(value21?.failedCount || 0);
  return fileSaveText('migration.summary', { copied: copied, skipped: skipped, failed: failed });
}
function confirmSavePathChanges(changes) {
  const confirm = globalThis.window?.confirm;
  if (typeof confirm !== 'function') throw new Error(fileSaveText('migration.confirmUnavailable'));
  const paths = changes
    .map(
      ({ key, from, to }) =>
        `${fileSaveText('migration.pathLabels.' + key)}:\n${from || '—'}\n→ ${to || '—'}`,
    )
    .join('\n\n');
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
  const saveButton = document.getElementById('btnFileSavePathsSave');
  if (!saveButton || saveButton.__fileSaveSettingsBound) return;
  saveButton.__fileSaveSettingsBound = true;
  (bindDirectoryPickers(),
    initLegacyFileSaveImport({
      pollMigrationUntilFinished,
      renderMigrationStatus,
      resetMigrationStatus,
      saveButton: saveButton,
      setSaveControlsBusy: (busy) => {
        setSaving(saveButton, busy);
        setInputsDisabled(busy);
      },
    }),
    fetchUserSettingsFromServer()
      .then((value22) => {
        applyPathsToInputs(value22?.fileSavePaths || {});
      })
      .catch((value23) => {
        (console.error('[Settings] 加载文件与保存路径失败:', value23),
          showError(fileSaveText('runtime.loadFailed')));
      }),
    resetMigrationStatus(),
    saveButton.addEventListener('click', async () => {
      const fileSavePaths3 = readPathsFromInputs(),
        validateRequired2 = validateRequired(fileSavePaths3);
      if (validateRequired2) {
        showError(validateRequired2);
        return;
      }
      (setSaving(saveButton, true), setInputsDisabled(true), resetMigrationStatus());
      try {
        const current = await fetchUserSettingsFromServer();
        const proposed = {
          ...(current || {}),
          fileSavePaths: fileSavePaths3,
          fileSavePathsMeta: {
            ...(current?.fileSavePathsMeta || {}),
            source: 'user',
            mode: normalizeText(getRootInput()?.value) ? 'root' : 'custom',
            rootDir: normalizeText(getRootInput()?.value),
            updatedAt: Date.now(),
          },
        };
        const changes = fileSavePathChanges(current?.fileSavePaths, fileSavePaths3);
        if (changes.length && !confirmSavePathChanges(changes)) return;
        let result;
        if (changes.length) {
          result = await saveSettingsWithMigration(proposed);
        } else {
          const saved = await saveUserSettingsToServer(proposed);
          result = {
            status: 'done',
            copiedCount: 0,
            skippedCount: 0,
            failedCount: 0,
            settings: saved?.settings,
          };
        }
        const applied = result?.settings || (await fetchUserSettingsFromServer());
        applyPathsToInputs(applied?.fileSavePaths || fileSavePaths3);
        if (Number(result?.failedCount || 0) > 0) {
          showError(
            fileSaveText('runtime.partialMigrationFailed', { summary: buildMigrationSummary(result) }),
          );
        } else {
          showSuccess(
            changes.length ? buildMigrationSummary(result) : fileSaveText('runtime.savedWithoutMigration'),
          );
        }
      } catch (value24) {
        (console.error('[Settings] 保存文件与保存路径失败:', value24),
          showError(fileSaveText('runtime.saveFailed', { error: errorMessage(value24) })));
      } finally {
        (setSaving(saveButton, false), setInputsDisabled(false));
      }
    }));
}
