import { t } from '../i18n/index.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { openSettingsPanelToField } from './settings/panelSettings.js';
export const VOLCENGINE_SPEECH_API_KEY_CONSOLE_URL =
  'https://console.volcengine.com/speech/new/setting/apikeys?';
export const VOLCENGINE_SPEECH_API_KEY_GUIDE_IMAGE = 'images/volcengine-speech-api-key-guide.svg';
const GUIDE_BACKDROP_ID = 'audio-voice-api-key-guide-backdrop',
  GUIDE_DIALOG_ID = 'audio-voice-api-key-guide';
function guideText(value) {
  return t('audioVoicePanel.asrApiKeyHelp.' + value);
}
function createEl(item, key = '', index = '') {
  const el = document['createElement'](item);
  if (key) el['className'] = key;
  if (index) el['textContent'] = index;
  return el;
}
function iconSvg(result) {
  const data =
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    options = {
      settings:
        '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5.9Z"></path>',
    };
  return '<svg width="18" height="18" ' + data + '>' + (options[result] || '') + '</svg>';
}
export function closeVolcengineSpeechApiKeyGuide() {
  (document['getElementById'](GUIDE_BACKDROP_ID)?.['remove']?.(),
    document['getElementById'](GUIDE_DIALOG_ID)?.['remove']?.(),
    document['removeEventListener']('keydown', handleGuideKeydown));
}
function handleGuideKeydown(event) {
  if (event['key'] !== 'Escape' || !document['getElementById'](GUIDE_DIALOG_ID)) return;
  (event['preventDefault']?.(), closeVolcengineSpeechApiKeyGuide());
}
export function openVolcengineSpeechApiKeySettings() {
  (closeVolcengineSpeechApiKeyGuide(),
    openSettingsPanelToField({
      paneName: 'api-input',
      fieldIds: ['providerKey-volcengine-speech'],
      select: !![],
      highlight: !![],
    }));
}
function createGuideNote(target) {
  const el2 = createEl('li', 'audio-voice-api-key-guide-note');
  return ((el2['textContent'] = target), el2);
}
function openGuideExternalLink(source, next) {
  void openExternalLink(source, { label: guideText(next) })['catch']((current) => {
    globalThis['window']?.['showToast']?.(
      current?.['message'] || t('coreServices.externalLink.openFailed'),
      'error',
    );
  });
}
export function showVolcengineSpeechApiKeyGuide() {
  closeVolcengineSpeechApiKeyGuide();
  const el3 = createEl('div', 'audio-voice-api-key-guide-backdrop');
  ((el3['id'] = GUIDE_BACKDROP_ID), el3['setAttribute']('aria-hidden', 'true'));
  const el4 = createEl('section', 'audio-voice-api-key-guide');
  ((el4['id'] = GUIDE_DIALOG_ID),
    el4['setAttribute']('role', 'dialog'),
    el4['setAttribute']('aria-modal', 'true'),
    el4['setAttribute']('aria-label', guideText('guideTitle')));
  const el5 = createEl('div', 'audio-voice-api-key-guide-header'),
    el6 = createEl('span', 'audio-voice-api-key-guide-icon');
  (el6['setAttribute']('aria-hidden', 'true'), (el6['innerHTML'] = iconSvg('settings')));
  const el7 = createEl('div', 'audio-voice-api-key-guide-title', guideText('guideTitle')),
    el8 = createEl('button', 'audio-voice-api-key-guide-close', 'x');
  ((el8['type'] = 'button'),
    (el8['title'] = guideText('close')),
    el8['setAttribute']('aria-label', guideText('close')),
    (el8['dataset']['volcengineSpeechApiKeyGuideAction'] = 'close'),
    el5['append'](el6, el7, el8));
  const el9 = createEl('div', 'audio-voice-api-key-guide-body'),
    el10 = createEl('div', 'audio-voice-api-key-guide-subtitle', guideText('guideSubtitle')),
    el11 = createEl('div', 'audio-voice-api-key-guide-section-title', guideText('guideOfficialKey')),
    el12 = createEl('ol', 'audio-voice-api-key-guide-notes');
  ['guideNote1', 'guideNote2', 'guideNote3', 'guideNote4']['forEach']((entry) =>
    el12['appendChild'](createGuideNote(guideText(entry))),
  );
  const el13 = createEl('div', 'audio-voice-api-key-guide-image-wrap'),
    el14 = createEl('img', 'audio-voice-api-key-guide-image');
  ((el14['src'] = VOLCENGINE_SPEECH_API_KEY_GUIDE_IMAGE),
    (el14['alt'] = guideText('guideAlt')),
    (el14['width'] = 960),
    (el14['height'] = 2100),
    (el14['decoding'] = 'async'),
    (el14['loading'] = 'eager'),
    (el14['fetchPriority'] = 'high'));
  const el15 = createEl('div', 'audio-voice-api-key-guide-image-links');
  ([
    {
      action: 'open-console',
      className: 'audio-voice-api-key-guide-image-link-console',
      label: guideText('openConsole'),
    },
    {
      action: 'open-settings',
      className: 'audio-voice-api-key-guide-image-link-settings',
      label: guideText('openSettings'),
    },
  ]['forEach'](({ action: action, className: className, label: label }) => {
    const el16 = createEl('button', 'audio-voice-api-key-guide-image-link ' + className, label);
    ((el16['type'] = 'button'),
      (el16['dataset']['volcengineSpeechApiKeyGuideAction'] = action),
      el16['setAttribute']('aria-label', label),
      el15['appendChild'](el16));
  }),
    el13['append'](el14, el15),
    el9['append'](el10, el11, el12, el13));
  const el17 = createEl('div', 'audio-voice-api-key-guide-actions'),
    el18 = createEl(
      'button',
      'audio-voice-api-key-guide-btn audio-voice-api-key-guide-btn-secondary',
      guideText('openSettings'),
    );
  ((el18['type'] = 'button'), (el18['dataset']['volcengineSpeechApiKeyGuideAction'] = 'open-settings'));
  const el19 = createEl(
    'button',
    'audio-voice-api-key-guide-btn audio-voice-api-key-guide-btn-primary',
    guideText('openConsole'),
  );
  ((el19['type'] = 'button'),
    (el19['dataset']['volcengineSpeechApiKeyGuideAction'] = 'open-console'),
    el17['append'](el18, el19),
    el4['append'](el5, el9, el17),
    document['body']?.['append'](el3, el4),
    el3['addEventListener']?.('click', closeVolcengineSpeechApiKeyGuide),
    el4['addEventListener']?.('click', (record) => {
      const enabled = record['target']?.['closest']?.('[data-volcengine-speech-api-key-guide-action]');
      if (!enabled) return;
      record['preventDefault']?.();
      const payload = enabled['dataset']['volcengineSpeechApiKeyGuideAction'];
      if (payload === 'close') closeVolcengineSpeechApiKeyGuide();
      if (payload === 'open-settings') openVolcengineSpeechApiKeySettings();
      payload === 'open-console' &&
        openGuideExternalLink(VOLCENGINE_SPEECH_API_KEY_CONSOLE_URL, 'openConsole');
    }),
    document['addEventListener']('keydown', handleGuideKeydown),
    el4['classList']['add']('open'),
    el3['classList']['add']('open'),
    el8['focus']?.());
}
export function bindVolcengineSpeechApiKeyGuideTriggers(handle = document) {
  handle?.['querySelectorAll']?.('[data-volcengine-speech-api-key-guide-trigger]')?.['forEach']((state) => {
    if (state['dataset']['volcengineSpeechApiKeyGuideBound'] === '1') return;
    ((state['dataset']['volcengineSpeechApiKeyGuideBound'] = '1'),
      state['addEventListener']('click', (event2) => {
        (event2['preventDefault'](), showVolcengineSpeechApiKeyGuide());
      }));
  });
}
