import { t } from '../i18n/index.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { openSettingsPanelToField } from './settings/panelSettings.js';
export const RUNNINGHUB_API_KEY_CONSOLE_URL = 'https://www.runninghub.cn/?inviteCode=rh-v1312';
export const RUNNINGHUB_INTERNATIONAL_API_KEY_CONSOLE_URL = 'https://www.runninghub.ai/?inviteCode=rh-v1312';
export const RUNNINGHUB_API_KEY_GUIDE_IMAGE = 'images/runninghub-api-key-guide.svg';
const RUNNINGHUB_GUIDE_EDITIONS = Object['freeze']({
    runninghub: Object['freeze']({
      consoleUrl: RUNNINGHUB_API_KEY_CONSOLE_URL,
      fieldIds: ['providerKey-runninghub', 'providerKey-runninghub-model'],
    }),
    'runninghub-international': Object['freeze']({
      consoleUrl: RUNNINGHUB_INTERNATIONAL_API_KEY_CONSOLE_URL,
      fieldIds: ['providerKey-runninghub-international', 'providerKey-runninghub-international-model'],
    }),
  }),
  GUIDE_BACKDROP_ID = 'runninghub-api-key-guide-backdrop',
  GUIDE_DIALOG_ID = 'runninghub-api-key-guide';
function guideText(value) {
  return t('settings.apiInput.providers.runninghub.' + value);
}
function createEl(item, key = '', index = '') {
  const el = document['createElement'](item);
  if (key) el['className'] = key;
  if (index) el['textContent'] = index;
  return el;
}
function iconSvg() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"></path></svg>';
}
export function closeRunningHubApiKeyGuide() {
  (document['getElementById'](GUIDE_BACKDROP_ID)?.['remove']?.(),
    document['getElementById'](GUIDE_DIALOG_ID)?.['remove']?.(),
    document['removeEventListener']('keydown', handleGuideKeydown));
}
function handleGuideKeydown(event) {
  if (event['key'] !== 'Escape' || !document['getElementById'](GUIDE_DIALOG_ID)) return;
  (event['preventDefault']?.(), closeRunningHubApiKeyGuide());
}
function getRunningHubGuideEdition(result = 'runninghub') {
  return RUNNINGHUB_GUIDE_EDITIONS[String(result || '')['trim']()] || RUNNINGHUB_GUIDE_EDITIONS['runninghub'];
}
export function openRunningHubApiKeySettings(data = 'runninghub') {
  (closeRunningHubApiKeyGuide(),
    openSettingsPanelToField({
      paneName: 'api-input',
      fieldIds: getRunningHubGuideEdition(data)['fieldIds'],
      select: !![],
      highlight: !![],
    }));
}
function createGuideNote(options) {
  const el2 = createEl('li', 'audio-voice-api-key-guide-note');
  return ((el2['textContent'] = options), el2);
}
function openGuideExternalLink(target, source) {
  void openExternalLink(target, { label: guideText(source) })['catch']((error) => {
    globalThis['window']?.['showToast']?.(
      error?.['message'] || t('coreServices.externalLink.openFailed'),
      'error',
    );
  });
}
export function showRunningHubApiKeyGuide(next = 'runninghub') {
  closeRunningHubApiKeyGuide();
  const runningHubGuideEdition = getRunningHubGuideEdition(next),
    el3 = createEl('div', 'audio-voice-api-key-guide-backdrop');
  ((el3['id'] = GUIDE_BACKDROP_ID), el3['setAttribute']('aria-hidden', 'true'));
  const el4 = createEl('section', 'audio-voice-api-key-guide');
  ((el4['id'] = GUIDE_DIALOG_ID),
    el4['setAttribute']('role', 'dialog'),
    el4['setAttribute']('aria-modal', 'true'),
    el4['setAttribute']('aria-label', guideText('guideTitle')));
  const el5 = createEl('div', 'audio-voice-api-key-guide-header'),
    el6 = createEl('span', 'audio-voice-api-key-guide-icon');
  (el6['setAttribute']('aria-hidden', 'true'), (el6['innerHTML'] = iconSvg()));
  const el7 = createEl('div', 'audio-voice-api-key-guide-title', guideText('guideTitle')),
    el8 = createEl('button', 'audio-voice-api-key-guide-close', 'x');
  ((el8['type'] = 'button'),
    (el8['title'] = guideText('close')),
    el8['setAttribute']('aria-label', guideText('close')),
    (el8['dataset']['runninghubApiKeyGuideAction'] = 'close'),
    el5['append'](el6, el7, el8));
  const el9 = createEl('div', 'audio-voice-api-key-guide-body'),
    el10 = createEl('div', 'audio-voice-api-key-guide-subtitle', guideText('guideSubtitle')),
    el11 = createEl('div', 'audio-voice-api-key-guide-section-title', guideText('guideChecklistTitle')),
    el12 = createEl('ol', 'audio-voice-api-key-guide-notes');
  ['guideNote1', 'guideNote2', 'guideNote3', 'guideNote4']['forEach']((current) =>
    el12['appendChild'](createGuideNote(guideText(current))),
  );
  const el13 = createEl('div', 'audio-voice-api-key-guide-image-wrap'),
    box = createEl('img', 'audio-voice-api-key-guide-image');
  ((box['src'] = RUNNINGHUB_API_KEY_GUIDE_IMAGE),
    (box['alt'] = guideText('guideAlt')),
    (box['width'] = 960),
    (box['height'] = 2100),
    (box['decoding'] = 'async'),
    (box['loading'] = 'eager'),
    (box['fetchPriority'] = 'high'));
  const el14 = createEl('div', 'audio-voice-api-key-guide-image-links');
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
    const el15 = createEl('button', 'audio-voice-api-key-guide-image-link ' + className, label);
    ((el15['type'] = 'button'),
      (el15['dataset']['runninghubApiKeyGuideAction'] = action),
      el15['setAttribute']('aria-label', label),
      el14['appendChild'](el15));
  }),
    el13['append'](box, el14),
    el9['append'](el10, el11, el12, el13));
  const el16 = createEl('div', 'audio-voice-api-key-guide-actions'),
    el17 = createEl(
      'button',
      'audio-voice-api-key-guide-btn audio-voice-api-key-guide-btn-secondary',
      guideText('openSettings'),
    );
  ((el17['type'] = 'button'), (el17['dataset']['runninghubApiKeyGuideAction'] = 'open-settings'));
  const el18 = createEl(
    'button',
    'audio-voice-api-key-guide-btn audio-voice-api-key-guide-btn-primary',
    guideText('openConsole'),
  );
  ((el18['type'] = 'button'),
    (el18['dataset']['runninghubApiKeyGuideAction'] = 'open-console'),
    el16['append'](el17, el18),
    el4['append'](el5, el9, el16),
    document['body']?.['append'](el3, el4),
    el3['addEventListener']?.('click', closeRunningHubApiKeyGuide),
    el4['addEventListener']?.('click', (event2) => {
      const el19 = event2['target']?.['closest']?.('[data-runninghub-api-key-guide-action]');
      if (!el19) return;
      event2['preventDefault']?.();
      const entry = el19['dataset']['runninghubApiKeyGuideAction'];
      if (entry === 'close') closeRunningHubApiKeyGuide();
      if (entry === 'open-settings') openRunningHubApiKeySettings(next);
      entry === 'open-console' && openGuideExternalLink(runningHubGuideEdition['consoleUrl'], 'openConsole');
    }),
    document['addEventListener']('keydown', handleGuideKeydown),
    el4['classList']['add']('open'),
    el3['classList']['add']('open'),
    el8['focus']?.());
}
export function bindRunningHubApiKeyGuideTriggers(el20 = document) {
  el20?.['querySelectorAll']?.('[data-runninghub-api-key-guide-trigger]')?.['forEach']((el21) => {
    if (el21['dataset']['runninghubApiKeyGuideBound'] === '1') return;
    ((el21['dataset']['runninghubApiKeyGuideBound'] = '1'),
      el21['addEventListener']('click', (event3) => {
        (event3['preventDefault'](),
          showRunningHubApiKeyGuide(el21['dataset']['runninghubApiKeyGuideTrigger'] || 'runninghub'));
      }));
  });
}
