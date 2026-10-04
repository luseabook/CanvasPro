import { t } from '../i18n/index.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { openSettingsPanelToField } from './settings/panelSettings.js';
export const PROVIDER_API_KEY_GUIDES = Object['freeze']({
  apimart: Object['freeze']({
    consoleUrl: 'https://apimart.ai/register?aff=ashuoai',
    guideImage: 'images/apimart-api-key-guide.svg',
    inputIds: Object['freeze'](['providerKey-apimart']),
    imageWidth: 0x3c0,
    imageHeight: 0x834,
  }),
  agnes: Object['freeze']({
    consoleUrl: 'https://platform.agnes-ai.com/settings/apiKeys',
    guideImage: 'images/agnes-api-key-guide.svg',
    inputIds: Object['freeze'](['providerKey-agnes']),
    imageWidth: 0x3c0,
    imageHeight: 0x834,
  }),
  'agnes-domestic': Object['freeze']({
    consoleUrl: 'https://platform.agnes-ai.cn/settings/apiKeys',
    guideImage: 'images/agnes-api-key-guide.svg',
    inputIds: Object['freeze'](['providerKey-agnes-domestic']),
    imageWidth: 0x3c0,
    imageHeight: 0x834,
  }),
  volcengine: Object['freeze']({
    consoleUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement',
    guideImage: 'images/volcengine-ark-api-key-guide.svg',
    inputIds: Object['freeze'](['providerKey-volcengine']),
    imageWidth: 0x3c0,
    imageHeight: 0x834,
  }),
  grsai: Object['freeze']({
    consoleUrl: 'https://grsai.com/zh/dashboard/api-keys',
    guideImage: 'images/grsai-api-key-guide.svg',
    inputIds: Object['freeze'](['providerKey-grsai']),
    imageWidth: 0x3c0,
    imageHeight: 0x834,
  }),
});
const GUIDE_BACKDROP_ID = 'provider-api-key-guide-backdrop',
  GUIDE_DIALOG_ID = 'provider-api-key-guide';
function getGuideConfig(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return item && PROVIDER_API_KEY_GUIDES[item] ? { id: item, ...PROVIDER_API_KEY_GUIDES[item] } : null;
}
function guideText(key, index) {
  const result = key === 'agnes-domestic' ? 'agnes' : key;
  return t('settings.apiInput.providers.' + result + '.' + index);
}
function createEl(data, options = '', target = '') {
  const source = document['createElement'](data);
  if (options) source['className'] = options;
  if (target) source['textContent'] = target;
  return source;
}
function iconSvg() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"></path></svg>';
}
export function closeProviderApiKeyGuide() {
  (document['getElementById'](GUIDE_BACKDROP_ID)?.['remove']?.(),
    document['getElementById'](GUIDE_DIALOG_ID)?.['remove']?.(),
    document['removeEventListener']('keydown', handleGuideKeydown));
}
function handleGuideKeydown(next) {
  if (next['key'] !== 'Escape' || !document['getElementById'](GUIDE_DIALOG_ID)) return;
  (next['preventDefault']?.(), closeProviderApiKeyGuide());
}
export function openProviderApiKeySettings(current) {
  const guideConfig = getGuideConfig(current);
  if (!guideConfig) return;
  (closeProviderApiKeyGuide(),
    openSettingsPanelToField({
      paneName: 'api-input',
      fieldIds: guideConfig['inputIds'],
      select: !![],
      highlight: !![],
    }));
}
function createGuideNote(entry) {
  const el = createEl('li', 'audio-voice-api-key-guide-note');
  return ((el['textContent'] = entry), el);
}
function openGuideExternalLink(record, payload, handle) {
  void openExternalLink(payload, { label: guideText(record, handle) })['catch']((error) => {
    globalThis['window']?.['showToast']?.(
      error?.['message'] || t('coreServices.externalLink.openFailed'),
      'error',
    );
  });
}
export function showProviderApiKeyGuide(state) {
  const guideConfig2 = getGuideConfig(state);
  if (!guideConfig2) return;
  closeProviderApiKeyGuide();
  const el2 = createEl('div', 'audio-voice-api-key-guide-backdrop');
  ((el2['id'] = GUIDE_BACKDROP_ID), el2['setAttribute']('aria-hidden', 'true'));
  const el3 = createEl('section', 'audio-voice-api-key-guide');
  ((el3['id'] = GUIDE_DIALOG_ID),
    el3['setAttribute']('role', 'dialog'),
    el3['setAttribute']('aria-modal', 'true'),
    el3['setAttribute']('aria-label', guideText(guideConfig2['id'], 'guideTitle')));
  const el4 = createEl('div', 'audio-voice-api-key-guide-header'),
    el5 = createEl('span', 'audio-voice-api-key-guide-icon');
  (el5['setAttribute']('aria-hidden', 'true'), (el5['innerHTML'] = iconSvg()));
  const el6 = createEl('div', 'audio-voice-api-key-guide-title', guideText(guideConfig2['id'], 'guideTitle')),
    el7 = createEl('button', 'audio-voice-api-key-guide-close', 'x');
  ((el7['type'] = 'button'),
    (el7['title'] = guideText(guideConfig2['id'], 'close')),
    el7['setAttribute']('aria-label', guideText(guideConfig2['id'], 'close')),
    (el7['dataset']['providerApiKeyGuideAction'] = 'close'),
    el4['append'](el5, el6, el7));
  const el8 = createEl('div', 'audio-voice-api-key-guide-body'),
    el9 = createEl(
      'div',
      'audio-voice-api-key-guide-subtitle',
      guideText(guideConfig2['id'], 'guideSubtitle'),
    ),
    el10 = createEl(
      'div',
      'audio-voice-api-key-guide-section-title',
      guideText(guideConfig2['id'], 'guideChecklistTitle'),
    ),
    el11 = createEl('ol', 'audio-voice-api-key-guide-notes');
  ['guideNote1', 'guideNote2', 'guideNote3', 'guideNote4']['forEach']((config) =>
    el11['appendChild'](createGuideNote(guideText(guideConfig2['id'], config))),
  );
  const el12 = createEl('div', 'audio-voice-api-key-guide-image-wrap'),
    box = createEl('img', 'audio-voice-api-key-guide-image');
  ((box['src'] = guideConfig2['guideImage']),
    (box['alt'] = guideText(guideConfig2['id'], 'guideAlt')),
    (box['width'] = guideConfig2['imageWidth']),
    (box['height'] = guideConfig2['imageHeight']),
    (box['decoding'] = 'async'),
    (box['loading'] = 'eager'),
    (box['fetchPriority'] = 'high'));
  const el13 = createEl('div', 'audio-voice-api-key-guide-image-links');
  ([
    {
      action: 'open-console',
      className: 'audio-voice-api-key-guide-image-link-console',
      label: guideText(guideConfig2['id'], 'openConsole'),
    },
    {
      action: 'open-settings',
      className: 'audio-voice-api-key-guide-image-link-settings',
      label: guideText(guideConfig2['id'], 'openSettings'),
    },
  ]['forEach'](({ action: action, className: className, label: label }) => {
    const el14 = createEl('button', 'audio-voice-api-key-guide-image-link\x20' + className, label);
    ((el14['type'] = 'button'),
      (el14['dataset']['providerApiKeyGuideAction'] = action),
      el14['setAttribute']('aria-label', label),
      el13['appendChild'](el14));
  }),
    el12['append'](box, el13),
    el8['append'](el9, el10, el11, el12));
  const el15 = createEl('div', 'audio-voice-api-key-guide-actions'),
    el16 = createEl(
      'button',
      'audio-voice-api-key-guide-btn audio-voice-api-key-guide-btn-secondary',
      guideText(guideConfig2['id'], 'openSettings'),
    );
  ((el16['type'] = 'button'), (el16['dataset']['providerApiKeyGuideAction'] = 'open-settings'));
  const el17 = createEl(
    'button',
    'audio-voice-api-key-guide-btn\x20audio-voice-api-key-guide-btn-primary',
    guideText(guideConfig2['id'], 'openConsole'),
  );
  ((el17['type'] = 'button'),
    (el17['dataset']['providerApiKeyGuideAction'] = 'open-console'),
    el15['append'](el16, el17),
    el3['append'](el4, el8, el15),
    document['body']?.['append'](el2, el3),
    el2['addEventListener']?.('click', closeProviderApiKeyGuide),
    el3['addEventListener']?.('click', (event) => {
      const enabled = event['target']?.['closest']?.('[data-provider-api-key-guide-action]');
      if (!enabled) return;
      event['preventDefault']?.();
      const scope = enabled['dataset']['providerApiKeyGuideAction'];
      if (scope === 'close') closeProviderApiKeyGuide();
      if (scope === 'open-settings') openProviderApiKeySettings(guideConfig2['id']);
      scope === 'open-console' &&
        openGuideExternalLink(guideConfig2['id'], guideConfig2['consoleUrl'], 'openConsole');
    }),
    document['addEventListener']('keydown', handleGuideKeydown),
    el3['classList']['add']('open'),
    el2['classList']['add']('open'),
    el7['focus']?.());
}
export function bindProviderApiKeyGuideTriggers(input = document) {
  input?.['querySelectorAll']?.('[data-provider-api-key-guide-trigger]')?.['forEach']((output) => {
    if (output['dataset']['providerApiKeyGuideBound'] === '1') return;
    ((output['dataset']['providerApiKeyGuideBound'] = '1'),
      output['addEventListener']('click', (value2) => {
        (value2['preventDefault'](),
          showProviderApiKeyGuide(output['dataset']['providerApiKeyGuideTrigger']));
      }));
  });
}
