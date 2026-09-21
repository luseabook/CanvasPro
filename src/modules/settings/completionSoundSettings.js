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
function completionSoundText(_0x363b9c, _0x58ec83 = {}) {
  return t('settings.completionSound.' + _0x363b9c, _0x58ec83);
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
function getElement(_0x54bc03) {
  return document.getElementById(_0x54bc03);
}
function normalizeText(_0x4698f0) {
  return String(_0x4698f0 || '').trim();
}
function normalizePathKey(_0x1edb1e) {
  return normalizeText(_0x1edb1e).replace(/\\/g, '/').toLowerCase();
}
function clampVolumePercent(_0x28ab1e) {
  const _0x360b80 = Number(_0x28ab1e);
  if (!Number.isFinite(_0x360b80)) return Math.round(COMPLETION_SOUND_DEFAULTS.volume * 100);
  return Math.max(0, Math.min(100, Math.round(_0x360b80)));
}
function isBuiltInNotifyPath(_0x296b69) {
  const _0x319328 = normalizePathKey(_0x296b69);
  return _0x319328.endsWith('/assets/sounds/notify.mp3') || _0x319328 === BUILT_IN_COMPLETION_SOUND_PATH;
}
function readSettingsFromControls() {
  const _0x2fc00d = clampVolumePercent(getElement(ELEMENT_IDS.volumeSlider)?.value);
  return normalizeCompletionSoundSettings({
    ...currentSettings,
    volume: _0x2fc00d / 100,
    selectedFilePath:
      normalizeText(getElement(ELEMENT_IDS.fileSelect)?.value) || BUILT_IN_COMPLETION_SOUND_PATH,
  });
}
function setStatus(_0x401d98 = '', _0x4cad46 = '') {
  const _0x25732e = getElement(ELEMENT_IDS.status);
  if (!_0x25732e) return;
  ((_0x25732e.textContent = _0x401d98),
    _0x25732e.classList.toggle('is-error', _0x4cad46 === 'error'),
    _0x25732e.classList.toggle('is-success', _0x4cad46 === 'success'));
}
function syncEnabledButtons(_0x152557) {
  const _0x963e69 = getElement(ELEMENT_IDS.enabledGroup);
  if (!_0x963e69) return;
  _0x963e69.querySelectorAll('.cursor-size-btn').forEach((_0x57fbff) => {
    const _0x4f7a8e = _0x57fbff.dataset.completionSoundEnabled === 'on';
    _0x57fbff.classList.toggle('active', _0x4f7a8e === _0x152557);
  });
}
function syncNotificationEnabledButtons(_0x4d8f55) {
  const _0x5f5502 = getElement(ELEMENT_IDS.notificationEnabledGroup);
  if (!_0x5f5502) return;
  _0x5f5502.querySelectorAll('.cursor-size-btn').forEach((_0x1872a3) => {
    const _0x4353b1 = _0x1872a3.dataset.completionNotificationEnabled === 'on';
    _0x1872a3.classList.toggle('active', _0x4353b1 === _0x4d8f55);
  });
}
function renderSettings(_0xa49551) {
  ((currentSettings = normalizeCompletionSoundSettings(_0xa49551)),
    setCompletionSoundSettingsCache(currentSettings),
    syncEnabledButtons(currentSettings.enabled),
    syncNotificationEnabledButtons(currentSettings.notificationEnabled));
  const _0x100bd9 = clampVolumePercent(currentSettings.volume * 100),
    _0x2c28c5 = getElement(ELEMENT_IDS.volumeSlider),
    _0x3844ff = getElement(ELEMENT_IDS.volumeValue);
  if (_0x2c28c5) _0x2c28c5.value = String(_0x100bd9);
  if (_0x3844ff) _0x3844ff.textContent = _0x100bd9 + '%';
}
function selectFilePathFromList(_0x19984b, _0x710b9e) {
  const _0x2dfd09 = normalizePathKey(_0x710b9e),
    _0x5754e7 = _0x19984b.find((_0x4090b8) => normalizePathKey(_0x4090b8?.path) === _0x2dfd09);
  if (_0x5754e7?.path) return _0x5754e7.path;
  if (isBuiltInNotifyPath(_0x710b9e)) {
    const _0x2386e1 = _0x19984b.find(
      (_0x22c522) => normalizeText(_0x22c522?.name).toLowerCase() === 'notify.mp3',
    );
    if (_0x2386e1?.path) return _0x2386e1.path;
  }
  return _0x19984b[0]?.path || BUILT_IN_COMPLETION_SOUND_PATH;
}
function renderFileOptions(_0x5d828f, _0x5bc5ff = '') {
  currentFiles = Array.isArray(_0x5d828f) ? _0x5d828f : [];
  const _0x3609f2 = getElement(ELEMENT_IDS.fileSelect),
    _0x55e4b8 = getElement(ELEMENT_IDS.fileTriggerText),
    _0x2bc305 = getElement(ELEMENT_IDS.fileMenu);
  if (!_0x3609f2) return;
  (_0x3609f2.replaceChildren(), _0x2bc305?.replaceChildren?.());
  const _0x337f40 = selectFilePathFromList(currentFiles, _0x5bc5ff);
  if (currentFiles.length === 0) {
    const _0x4a1217 = document.createElement('option');
    ((_0x4a1217.value = BUILT_IN_COMPLETION_SOUND_PATH),
      (_0x4a1217.textContent = 'notify.mp3'),
      _0x3609f2.appendChild(_0x4a1217),
      (_0x3609f2.value = BUILT_IN_COMPLETION_SOUND_PATH));
    if (_0x55e4b8) _0x55e4b8.textContent = 'notify.mp3';
    return;
  }
  for (const _0x321569 of currentFiles) {
    const _0x5a8f5f = normalizeText(_0x321569?.path);
    if (!_0x5a8f5f) continue;
    const _0x4e5e33 = document.createElement('option');
    ((_0x4e5e33.value = _0x5a8f5f),
      (_0x4e5e33.textContent = normalizeText(_0x321569?.name) || _0x5a8f5f),
      _0x3609f2.appendChild(_0x4e5e33));
    const _0xfa2df5 = document.createElement('button');
    ((_0xfa2df5.type = 'button'),
      (_0xfa2df5.className = 'settings-preset-option'),
      (_0xfa2df5.dataset.value = _0x5a8f5f),
      (_0xfa2df5.textContent = _0x4e5e33.textContent),
      _0xfa2df5.setAttribute?.('role', 'option'),
      _0x2bc305?.appendChild?.(_0xfa2df5));
  }
  ((_0x3609f2.value = _0x337f40), syncFileMenuSelection(_0x337f40));
}
function getSelectedFileLabel(_0x463d94) {
  const _0x2517fd = normalizePathKey(_0x463d94),
    _0x41a22d = currentFiles.find((_0x3256db) => normalizePathKey(_0x3256db?.path) === _0x2517fd);
  return normalizeText(_0x41a22d?.name) || 'notify.mp3';
}
function syncFileMenuSelection(_0x873d3a) {
  const _0x3082b1 = getElement(ELEMENT_IDS.fileSelect),
    _0x2718b1 = getElement(ELEMENT_IDS.fileTriggerText),
    _0x4b926a = getElement(ELEMENT_IDS.fileMenu);
  if (_0x3082b1) _0x3082b1.value = _0x873d3a;
  if (_0x2718b1) _0x2718b1.textContent = getSelectedFileLabel(_0x873d3a);
  _0x4b926a?.querySelectorAll?.('.settings-preset-option')?.forEach((_0x262ef2) => {
    const _0x327f0e = normalizePathKey(_0x262ef2.dataset?.value) === normalizePathKey(_0x873d3a);
    (_0x262ef2.classList.toggle('is-active', _0x327f0e),
      _0x262ef2.setAttribute?.('aria-selected', _0x327f0e ? 'true' : 'false'));
  });
}
function setFileMenuOpen(
  _0x160ec8,
  { focusMenu: focusMenu = false, focusTrigger: focusTrigger = false } = {},
) {
  const _0x2030e4 = getElement(ELEMENT_IDS.fileControl),
    _0x2e637c = getElement(ELEMENT_IDS.fileTrigger),
    _0x27d007 = getElement(ELEMENT_IDS.fileMenu);
  if (!_0x2030e4 || !_0x2e637c || !_0x27d007) return;
  (_0x2030e4.classList.toggle('is-open', !!_0x160ec8),
    _0x2e637c.setAttribute?.('aria-expanded', _0x160ec8 ? 'true' : 'false'),
    (_0x27d007.hidden = !_0x160ec8));
  if (_0x160ec8 && focusMenu) {
    const _0x492d1f =
      Array.from(_0x27d007.querySelectorAll?.('.settings-preset-option') || []).find((_0x45353d) =>
        _0x45353d.classList?.contains('is-active'),
      ) || _0x27d007.querySelectorAll?.('.settings-preset-option')?.[0];
    _0x492d1f?.focus?.();
  } else !_0x160ec8 && focusTrigger && _0x2e637c.focus?.();
}
function isFileMenuOpen() {
  return !!getElement(ELEMENT_IDS.fileControl)?.classList?.contains('is-open');
}
async function selectCompletionSoundFile(_0x1d13c5) {
  const _0x2aab95 = selectFilePathFromList(currentFiles, _0x1d13c5);
  ((currentSettings = normalizeCompletionSoundSettings({ ...currentSettings, selectedFilePath: _0x2aab95 })),
    syncFileMenuSelection(_0x2aab95),
    setCompletionSoundSettingsCache(currentSettings),
    setFileMenuOpen(false, { focusTrigger: true }),
    await saveCompletionSoundSettings(currentSettings, { silent: true }));
}
async function saveCompletionSoundSettings(_0xbe6a4e, { silent: silent = false } = {}) {
  const _0x1555a2 = normalizeCompletionSoundSettings({ ..._0xbe6a4e, updatedAt: Date.now() });
  ((currentSettings = _0x1555a2), setCompletionSoundSettingsCache(_0x1555a2));
  try {
    const _0x29547e = await fetchUserSettingsFromServer().catch(() => currentUserSettings || {});
    currentUserSettings = { ...(_0x29547e || {}), completionSound: _0x1555a2 };
    const _0x1f0983 = await saveUserSettingsToServer(currentUserSettings);
    _0x1f0983?.settings &&
      typeof _0x1f0983.settings === 'object' &&
      (currentUserSettings = _0x1f0983.settings);
    if (!silent) showSuccess(completionSoundText('saved'));
    return _0x1555a2;
  } catch (_0xdffd02) {
    (console.error('[completionSoundSettings] save failed:', _0xdffd02),
      showError(
        completionSoundText('saveFailed', {
          error: _0xdffd02?.message || completionSoundText('unknownError'),
        }),
      ));
    throw _0xdffd02;
  }
}
async function loadSystemSoundFiles({ saveSelected: saveSelected = false } = {}) {
  const _0x470757 = globalThis.window?.electronAPI?.notificationSound?.listSystemSounds;
  if (typeof _0x470757 !== 'function')
    return (
      renderFileOptions([], currentSettings.selectedFilePath),
      setStatus(completionSoundText('listUnsupported'), 'error'),
      []
    );
  try {
    setStatus(completionSoundText('readingSystemSounds'));
    const _0x1f1ce3 = await _0x470757(),
      _0x27ec6b = Array.isArray(_0x1f1ce3?.files) ? _0x1f1ce3.files : [],
      _0x23a6e6 = selectFilePathFromList(_0x27ec6b, currentSettings.selectedFilePath);
    (renderFileOptions(_0x27ec6b, _0x23a6e6),
      (currentSettings = normalizeCompletionSoundSettings({
        ...currentSettings,
        selectedFilePath: _0x23a6e6,
      })),
      setCompletionSoundSettingsCache(currentSettings),
      setStatus(
        _0x27ec6b.length
          ? completionSoundText('foundMp3Files', { count: _0x27ec6b.length })
          : completionSoundText('emptyMp3Directory'),
        _0x27ec6b.length ? 'success' : '',
      ));
    if (saveSelected) await saveCompletionSoundSettings(currentSettings, { silent: true });
    return _0x27ec6b;
  } catch (_0x409de0) {
    return (
      console.error('[completionSoundSettings] list system sounds failed:', _0x409de0),
      renderFileOptions([], currentSettings.selectedFilePath),
      setStatus(
        completionSoundText('listFailed', {
          error: _0x409de0?.message || completionSoundText('unknownError'),
        }),
        'error',
      ),
      []
    );
  }
}
function bindEvents() {
  const _0x752a45 = getElement(ELEMENT_IDS.enabledGroup);
  _0x752a45 &&
    !_0x752a45.__completionSoundBound &&
    ((_0x752a45.__completionSoundBound = true),
    _0x752a45.querySelectorAll('.cursor-size-btn').forEach((_0x27c3e) => {
      _0x27c3e.addEventListener('click', async () => {
        const _0x566c4c = _0x27c3e.dataset.completionSoundEnabled === 'on',
          _0x16d46f = normalizeCompletionSoundSettings({ ...currentSettings, enabled: _0x566c4c });
        (renderSettings(_0x16d46f), await saveCompletionSoundSettings(_0x16d46f, { silent: true }));
      });
    }));
  const _0x2d97ea = getElement(ELEMENT_IDS.notificationEnabledGroup);
  _0x2d97ea &&
    !_0x2d97ea.__completionSoundBound &&
    ((_0x2d97ea.__completionSoundBound = true),
    _0x2d97ea.querySelectorAll('.cursor-size-btn').forEach((_0x45ccda) => {
      _0x45ccda.addEventListener('click', async () => {
        const _0xcc0ed8 = _0x45ccda.dataset.completionNotificationEnabled === 'on',
          _0x3cea80 = normalizeCompletionSoundSettings({
            ...currentSettings,
            notificationEnabled: _0xcc0ed8,
          });
        (renderSettings(_0x3cea80), await saveCompletionSoundSettings(_0x3cea80, { silent: true }));
      });
    }));
  const _0x234bb7 = getElement(ELEMENT_IDS.volumeSlider);
  _0x234bb7 &&
    !_0x234bb7.__completionSoundBound &&
    ((_0x234bb7.__completionSoundBound = true),
    _0x234bb7.addEventListener('input', () => {
      const _0x2bf903 = clampVolumePercent(_0x234bb7.value),
        _0x4eade1 = getElement(ELEMENT_IDS.volumeValue);
      if (_0x4eade1) _0x4eade1.textContent = _0x2bf903 + '%';
    }),
    _0x234bb7.addEventListener('change', async () => {
      await saveCompletionSoundSettings(readSettingsFromControls(), { silent: true });
    }));
  const _0x118fb8 = getElement(ELEMENT_IDS.fileSelect);
  _0x118fb8 &&
    !_0x118fb8.__completionSoundBound &&
    ((_0x118fb8.__completionSoundBound = true),
    _0x118fb8.addEventListener('change', async () => {
      await saveCompletionSoundSettings(readSettingsFromControls(), { silent: true });
    }));
  const _0x9b43b4 = getElement(ELEMENT_IDS.fileTrigger),
    _0x10b6c8 = getElement(ELEMENT_IDS.fileMenu);
  (_0x9b43b4 &&
    _0x10b6c8 &&
    !_0x9b43b4.__completionSoundBound &&
    ((_0x9b43b4.__completionSoundBound = true),
    _0x9b43b4.addEventListener('click', () => {
      setFileMenuOpen(!isFileMenuOpen(), { focusMenu: true });
    }),
    _0x9b43b4.addEventListener('keydown', (_0x1d72e6) => {
      (_0x1d72e6.key === 'ArrowDown' || _0x1d72e6.key === 'Enter' || _0x1d72e6.key === ' ') &&
        (_0x1d72e6.preventDefault?.(), setFileMenuOpen(true, { focusMenu: true }));
    }),
    _0x10b6c8.addEventListener('click', (_0x4bd033) => {
      const _0x214bbd = _0x4bd033.target?.closest?.('.settings-preset-option');
      if (!_0x214bbd || _0x214bbd.disabled) return;
      void selectCompletionSoundFile(_0x214bbd.dataset.value);
    }),
    _0x10b6c8.addEventListener('keydown', (_0x48e521) => {
      if (_0x48e521.key === 'Escape')
        (_0x48e521.preventDefault?.(), setFileMenuOpen(false, { focusTrigger: true }));
      else {
        if (_0x48e521.key === 'Enter' || _0x48e521.key === ' ') {
          _0x48e521.preventDefault?.();
          const _0x3b75ac = document.activeElement?.closest?.('.settings-preset-option');
          if (_0x3b75ac && !_0x3b75ac.disabled) void selectCompletionSoundFile(_0x3b75ac.dataset.value);
        }
      }
    }),
    typeof document.addEventListener === 'function' &&
      document.addEventListener('pointerdown', (_0x219bd1) => {
        if (!isFileMenuOpen()) return;
        const _0x54e94b = getElement(ELEMENT_IDS.fileControl);
        if (typeof _0x54e94b?.contains === 'function' && _0x54e94b.contains(_0x219bd1.target)) return;
        setFileMenuOpen(false);
      })),
    getElement(ELEMENT_IDS.openFolderButton)?.addEventListener('click', async () => {
      const _0x358d16 = globalThis.window?.electronAPI?.notificationSound?.openSystemSoundFolder;
      if (typeof _0x358d16 !== 'function') {
        showError(completionSoundText('openFolderUnsupported'));
        return;
      }
      try {
        await _0x358d16();
      } catch (_0xa23fbd) {
        showError(
          completionSoundText('openFolderFailed', {
            error: _0xa23fbd?.message || completionSoundText('unknownError'),
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
      .then(async (_0xeb67ee) => {
        ((currentUserSettings = _0xeb67ee || {}),
          renderSettings(_0xeb67ee?.completionSound || COMPLETION_SOUND_DEFAULTS),
          await loadSystemSoundFiles({ saveSelected: false }));
      })
      .catch((_0xab5290) => {
        (console.error('[completionSoundSettings] load failed:', _0xab5290),
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
