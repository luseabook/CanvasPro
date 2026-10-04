import { fetchUserSettingsFromServer, saveUserSettingsToServer } from '../../../api/userSettingsApi.js';
import {
  COMPLETION_SOUND_DEFAULTS,
  BUILT_IN_COMPLETION_SOUND_PATH,
  normalizeCompletionSoundSettings,
  previewCompletionSound,
  setCompletionSoundSettingsCache,
} from '../../services/completionSoundService.js';
import { showError, showSuccess } from '../../services/toastService.js';
import { t } from '../../i18n/index.js';
function completionSoundText(value, item = {}) {
  return t('settings.completionSound.' + value, item);
}
const ELEMENT_IDS = Object.freeze({
  enabledGroup: 'completionSoundEnabledGroup',
  notificationEnabledGroup: 'completionNotificationEnabledGroup',
  volumeSlider: 'completionSoundVolumeSlider',
  volumeValue: 'completionSoundVolumeValue',
  fileControl: 'completionSoundFileControl',
  fileSelect: 'completionSoundFileSelect',
  fileTrigger: 'completionSoundFileTrigger',
  fileTriggerText: 'completionSoundFileTriggerText',
  fileMenu: 'completionSoundFileMenu',
  openFolderButton: 'btnCompletionSoundOpenFolder',
  refreshButton: 'btnCompletionSoundRefresh',
  previewButton: 'btnCompletionSoundPreview',
  status: 'completionSoundStatus',
});
let currentSettings = normalizeCompletionSoundSettings(COMPLETION_SOUND_DEFAULTS),
  currentUserSettings = {},
  currentFiles = [];
function getElement(key) {
  return document.getElementById(key);
}
function normalizeText(index) {
  return String(index || '').trim();
}
function normalizePathKey(result) {
  return normalizeText(result).replace(/\\/g, '/').toLowerCase();
}
function clampVolumePercent(data) {
  const options = Number(data);
  if (!Number.isFinite(options)) return Math.round(COMPLETION_SOUND_DEFAULTS.volume * 100);
  return Math.max(0, Math.min(100, Math.round(options)));
}
function isBuiltInNotifyPath(target) {
  const pathKey = normalizePathKey(target);
  return pathKey.endsWith('/assets/sounds/notify.mp3') || pathKey === BUILT_IN_COMPLETION_SOUND_PATH;
}
function readSettingsFromControls() {
  const volume = clampVolumePercent(getElement(ELEMENT_IDS.volumeSlider)?.value);
  return normalizeCompletionSoundSettings({
    ...currentSettings,
    volume: volume / 100,
    selectedFilePath:
      normalizeText(getElement(ELEMENT_IDS.fileSelect)?.value) || BUILT_IN_COMPLETION_SOUND_PATH,
  });
}
function setStatus(source = '', next = '') {
  const el = getElement(ELEMENT_IDS.status);
  if (!el) return;
  ((el.textContent = source),
    el.classList.toggle('is-error', next === 'error'),
    el.classList.toggle('is-success', next === 'success'));
}
function syncEnabledButtons(current) {
  const el2 = getElement(ELEMENT_IDS.enabledGroup);
  if (!el2) return;
  el2.querySelectorAll('.cursor-size-btn').forEach((el3) => {
    const entry = el3.dataset.completionSoundEnabled === 'on';
    el3.classList.toggle('active', entry === current);
  });
}
function syncNotificationEnabledButtons(record) {
  const el4 = getElement(ELEMENT_IDS.notificationEnabledGroup);
  if (!el4) return;
  el4.querySelectorAll('.cursor-size-btn').forEach((el5) => {
    const payload = el5.dataset.completionNotificationEnabled === 'on';
    el5.classList.toggle('active', payload === record);
  });
}
function renderSettings(handle) {
  ((currentSettings = normalizeCompletionSoundSettings(handle)),
    setCompletionSoundSettingsCache(currentSettings),
    syncEnabledButtons(currentSettings.enabled),
    syncNotificationEnabledButtons(currentSettings.notificationEnabled));
  const clampVolumePercent2 = clampVolumePercent(currentSettings.volume * 100),
    el6 = getElement(ELEMENT_IDS.volumeSlider),
    el7 = getElement(ELEMENT_IDS.volumeValue);
  if (el6) el6.value = String(clampVolumePercent2);
  if (el7) el7.textContent = clampVolumePercent2 + '%';
}
function selectFilePathFromList(list, state) {
  const pathKey2 = normalizePathKey(state),
    config = list.find((item2) => normalizePathKey(item2?.path) === pathKey2);
  if (config?.path) return config.path;
  if (isBuiltInNotifyPath(state)) {
    const scope = list.find((error) => normalizeText(error?.name).toLowerCase() === 'notify.mp3');
    if (scope?.path) return scope.path;
  }
  return list[0]?.path || BUILT_IN_COMPLETION_SOUND_PATH;
}
function renderFileOptions(input, output = '') {
  currentFiles = Array.isArray(input) ? input : [];
  const el8 = getElement(ELEMENT_IDS.fileSelect),
    el9 = getElement(ELEMENT_IDS.fileTriggerText),
    el10 = getElement(ELEMENT_IDS.fileMenu);
  if (!el8) return;
  (el8.replaceChildren(), el10?.replaceChildren?.());
  const filePathFromList = selectFilePathFromList(currentFiles, output);
  if (currentFiles.length === 0) {
    const el11 = document.createElement('option');
    ((el11.value = BUILT_IN_COMPLETION_SOUND_PATH),
      (el11.textContent = 'notify.mp3'),
      el8.appendChild(el11),
      (el8.value = BUILT_IN_COMPLETION_SOUND_PATH));
    if (el9) el9.textContent = 'notify.mp3';
    return;
  }
  for (const error2 of currentFiles) {
    const text = normalizeText(error2?.path);
    if (!text) continue;
    const el12 = document.createElement('option');
    ((el12.value = text), (el12.textContent = normalizeText(error2?.name) || text), el8.appendChild(el12));
    const el13 = document.createElement('button');
    ((el13.type = 'button'),
      (el13.className = 'settings-preset-option'),
      (el13.dataset.value = text),
      (el13.textContent = el12.textContent),
      el13.setAttribute?.('role', 'option'),
      el10?.appendChild?.(el13));
  }
  ((el8.value = filePathFromList), syncFileMenuSelection(filePathFromList));
}
function getSelectedFileLabel(value2) {
  const pathKey3 = normalizePathKey(value2),
    error3 = currentFiles.find((item3) => normalizePathKey(item3?.path) === pathKey3);
  return normalizeText(error3?.name) || 'notify.mp3';
}
function syncFileMenuSelection(value3) {
  const el14 = getElement(ELEMENT_IDS.fileSelect),
    el15 = getElement(ELEMENT_IDS.fileTriggerText),
    el16 = getElement(ELEMENT_IDS.fileMenu);
  if (el14) el14.value = value3;
  if (el15) el15.textContent = getSelectedFileLabel(value3);
  el16?.querySelectorAll?.('.settings-preset-option')?.forEach((el17) => {
    const pathKey4 = normalizePathKey(el17.dataset?.value) === normalizePathKey(value3);
    (el17.classList.toggle('is-active', pathKey4),
      el17.setAttribute?.('aria-selected', pathKey4 ? 'true' : 'false'));
  });
}
function setFileMenuOpen(enabled, { focusMenu: focusMenu = false, focusTrigger: focusTrigger = false } = {}) {
  const el18 = getElement(ELEMENT_IDS.fileControl),
    el19 = getElement(ELEMENT_IDS.fileTrigger),
    el20 = getElement(ELEMENT_IDS.fileMenu);
  if (!el18 || !el19 || !el20) return;
  (el18.classList.toggle('is-open', !!enabled),
    el19.setAttribute?.('aria-expanded', enabled ? 'true' : 'false'),
    (el20.hidden = !enabled));
  if (enabled && focusMenu) {
    const el21 =
      Array.from(el20.querySelectorAll?.('.settings-preset-option') || []).find((el22) =>
        el22.classList?.contains('is-active'),
      ) || el20.querySelectorAll?.('.settings-preset-option')?.[0];
    el21?.focus?.();
  } else !enabled && focusTrigger && el19.focus?.();
}
function isFileMenuOpen() {
  return !!getElement(ELEMENT_IDS.fileControl)?.classList?.contains('is-open');
}
async function selectCompletionSoundFile(value4) {
  const selectedFilePath = selectFilePathFromList(currentFiles, value4);
  ((currentSettings = normalizeCompletionSoundSettings({
    ...currentSettings,
    selectedFilePath: selectedFilePath,
  })),
    syncFileMenuSelection(selectedFilePath),
    setCompletionSoundSettingsCache(currentSettings),
    setFileMenuOpen(false, { focusTrigger: true }),
    await saveCompletionSoundSettings(currentSettings, { silent: true }));
}
async function saveCompletionSoundSettings(args, { silent: silent = false } = {}) {
  const completionSound = normalizeCompletionSoundSettings({ ...args, updatedAt: Date.now() });
  ((currentSettings = completionSound), setCompletionSoundSettingsCache(completionSound));
  try {
    const fetchUserSettingsFromServer2 = await fetchUserSettingsFromServer().catch(
      () => currentUserSettings || {},
    );
    currentUserSettings = { ...(fetchUserSettingsFromServer2 || {}), completionSound: completionSound };
    const server = await saveUserSettingsToServer(currentUserSettings);
    server?.settings && typeof server.settings === 'object' && (currentUserSettings = server.settings);
    if (!silent) showSuccess(completionSoundText('saved'));
    return completionSound;
  } catch (error4) {
    (console.error('[completionSoundSettings] save failed:', error4),
      showError(
        completionSoundText('saveFailed', {
          error: error4?.message || completionSoundText('unknownError'),
        }),
      ));
    throw error4;
  }
}
async function loadSystemSoundFiles({ saveSelected: saveSelected = false } = {}) {
  const run = globalThis.window?.electronAPI?.notificationSound?.listSystemSounds;
  if (typeof run !== 'function')
    return (
      renderFileOptions([], currentSettings.selectedFilePath),
      setStatus(completionSoundText('listUnsupported'), 'error'),
      []
    );
  try {
    setStatus(completionSoundText('readingSystemSounds'));
    const value5 = await run(),
      count = Array.isArray(value5?.files) ? value5.files : [],
      selectedFilePath2 = selectFilePathFromList(count, currentSettings.selectedFilePath);
    (renderFileOptions(count, selectedFilePath2),
      (currentSettings = normalizeCompletionSoundSettings({
        ...currentSettings,
        selectedFilePath: selectedFilePath2,
      })),
      setCompletionSoundSettingsCache(currentSettings),
      setStatus(
        count.length
          ? completionSoundText('foundMp3Files', { count: count.length })
          : completionSoundText('emptyMp3Directory'),
        count.length ? 'success' : '',
      ));
    if (saveSelected) await saveCompletionSoundSettings(currentSettings, { silent: true });
    return count;
  } catch (error5) {
    return (
      console.error('[completionSoundSettings] list system sounds failed:', error5),
      renderFileOptions([], currentSettings.selectedFilePath),
      setStatus(
        completionSoundText('listFailed', {
          error: error5?.message || completionSoundText('unknownError'),
        }),
        'error',
      ),
      []
    );
  }
}
function bindEvents() {
  const el23 = getElement(ELEMENT_IDS.enabledGroup);
  el23 &&
    !el23.__completionSoundBound &&
    ((el23.__completionSoundBound = true),
    el23.querySelectorAll('.cursor-size-btn').forEach((el24) => {
      el24.addEventListener('click', async () => {
        const enabled2 = el24.dataset.completionSoundEnabled === 'on',
          completionSoundSettings = normalizeCompletionSoundSettings({
            ...currentSettings,
            enabled: enabled2,
          });
        (renderSettings(completionSoundSettings),
          await saveCompletionSoundSettings(completionSoundSettings, { silent: true }));
      });
    }));
  const el25 = getElement(ELEMENT_IDS.notificationEnabledGroup);
  el25 &&
    !el25.__completionSoundBound &&
    ((el25.__completionSoundBound = true),
    el25.querySelectorAll('.cursor-size-btn').forEach((el26) => {
      el26.addEventListener('click', async () => {
        const notificationEnabled = el26.dataset.completionNotificationEnabled === 'on',
          completionSoundSettings2 = normalizeCompletionSoundSettings({
            ...currentSettings,
            notificationEnabled: notificationEnabled,
          });
        (renderSettings(completionSoundSettings2),
          await saveCompletionSoundSettings(completionSoundSettings2, { silent: true }));
      });
    }));
  const el27 = getElement(ELEMENT_IDS.volumeSlider);
  el27 &&
    !el27.__completionSoundBound &&
    ((el27.__completionSoundBound = true),
    el27.addEventListener('input', () => {
      const clampVolumePercent3 = clampVolumePercent(el27.value),
        el28 = getElement(ELEMENT_IDS.volumeValue);
      if (el28) el28.textContent = clampVolumePercent3 + '%';
    }),
    el27.addEventListener('change', async () => {
      await saveCompletionSoundSettings(readSettingsFromControls(), { silent: true });
    }));
  const el29 = getElement(ELEMENT_IDS.fileSelect);
  el29 &&
    !el29.__completionSoundBound &&
    ((el29.__completionSoundBound = true),
    el29.addEventListener('change', async () => {
      await saveCompletionSoundSettings(readSettingsFromControls(), { silent: true });
    }));
  const el30 = getElement(ELEMENT_IDS.fileTrigger),
    el31 = getElement(ELEMENT_IDS.fileMenu);
  (el30 &&
    el31 &&
    !el30.__completionSoundBound &&
    ((el30.__completionSoundBound = true),
    el30.addEventListener('click', () => {
      setFileMenuOpen(!isFileMenuOpen(), { focusMenu: true });
    }),
    el30.addEventListener('keydown', (event) => {
      (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') &&
        (event.preventDefault?.(), setFileMenuOpen(true, { focusMenu: true }));
    }),
    el31.addEventListener('click', (event2) => {
      const el32 = event2.target?.closest?.('.settings-preset-option');
      if (!el32 || el32.disabled) return;
      void selectCompletionSoundFile(el32.dataset.value);
    }),
    el31.addEventListener('keydown', (event3) => {
      if (event3.key === 'Escape')
        (event3.preventDefault?.(), setFileMenuOpen(false, { focusTrigger: true }));
      else {
        if (event3.key === 'Enter' || event3.key === ' ') {
          event3.preventDefault?.();
          const el33 = document.activeElement?.closest?.('.settings-preset-option');
          if (el33 && !el33.disabled) void selectCompletionSoundFile(el33.dataset.value);
        }
      }
    }),
    typeof document.addEventListener === 'function' &&
      document.addEventListener('pointerdown', (event4) => {
        if (!isFileMenuOpen()) return;
        const element = getElement(ELEMENT_IDS.fileControl);
        if (typeof element?.contains === 'function' && element.contains(event4.target)) return;
        setFileMenuOpen(false);
      })),
    getElement(ELEMENT_IDS.openFolderButton)?.addEventListener('click', async () => {
      const run2 = globalThis.window?.electronAPI?.notificationSound?.openSystemSoundFolder;
      if (typeof run2 !== 'function') {
        showError(completionSoundText('openFolderUnsupported'));
        return;
      }
      try {
        await run2();
      } catch (error6) {
        showError(
          completionSoundText('openFolderFailed', {
            error: error6?.message || completionSoundText('unknownError'),
          }),
        );
      }
    }),
    getElement(ELEMENT_IDS.refreshButton)?.addEventListener('click', () => {
      void loadSystemSoundFiles({ saveSelected: true });
    }),
    getElement(ELEMENT_IDS.previewButton)?.addEventListener('click', async () => {
      await previewCompletionSound(readSettingsFromControls());
    }));
}
export function initCompletionSoundSettings() {
  if (!getElement(ELEMENT_IDS.enabledGroup)) return;
  (bindEvents(),
    renderSettings(COMPLETION_SOUND_DEFAULTS),
    renderFileOptions([], BUILT_IN_COMPLETION_SOUND_PATH),
    fetchUserSettingsFromServer()
      .then(async (value6) => {
        ((currentUserSettings = value6 || {}),
          renderSettings(value6?.completionSound || COMPLETION_SOUND_DEFAULTS),
          await loadSystemSoundFiles({ saveSelected: false }));
      })
      .catch((value7) => {
        (console.error('[completionSoundSettings] load failed:', value7),
          showError(completionSoundText('loadFailed')));
      }));
}
export const __completionSoundSettingsForTest = {
  renderSettings: renderSettings,
  renderFileOptions: renderFileOptions,
  readSettingsFromControls: readSettingsFromControls,
  getCurrentSettings: () => currentSettings,
  getCurrentFiles: () => currentFiles,
  selectFilePathFromList: selectFilePathFromList,
};
