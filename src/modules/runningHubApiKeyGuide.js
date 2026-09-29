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
function guideText(_0x3e1936) {
  return t('settings.apiInput.providers.runninghub.' + _0x3e1936);
}
function createEl(_0x50ac89, _0x2c2d49 = '', _0x145181 = '') {
  const _0x4b0310 = document['createElement'](_0x50ac89);
  if (_0x2c2d49) _0x4b0310['className'] = _0x2c2d49;
  if (_0x145181) _0x4b0310['textContent'] = _0x145181;
  return _0x4b0310;
}
function iconSvg() {
  return '<svg\x20width=\x2218\x22\x20height=\x2218\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M4\x2019.5A2.5\x202.5\x200\x200\x201\x206.5\x2017H20\x22></path><path\x20d=\x22M4\x204.5A2.5\x202.5\x200\x200\x201\x206.5\x202H20v20H6.5A2.5\x202.5\x200\x200\x201\x204\x2019.5z\x22></path></svg>';
}
export function closeRunningHubApiKeyGuide() {
  (document['getElementById'](GUIDE_BACKDROP_ID)?.['remove']?.(),
    document['getElementById'](GUIDE_DIALOG_ID)?.['remove']?.(),
    document['removeEventListener']('keydown', handleGuideKeydown));
}
function handleGuideKeydown(_0x43c731) {
  if (_0x43c731['key'] !== 'Escape' || !document['getElementById'](GUIDE_DIALOG_ID)) return;
  (_0x43c731['preventDefault']?.(), closeRunningHubApiKeyGuide());
}
function getRunningHubGuideEdition(_0x4df92a = 'runninghub') {
  return (
    RUNNINGHUB_GUIDE_EDITIONS[String(_0x4df92a || '')['trim']()] || RUNNINGHUB_GUIDE_EDITIONS['runninghub']
  );
}
export function openRunningHubApiKeySettings(_0x15a4e7 = 'runninghub') {
  (closeRunningHubApiKeyGuide(),
    openSettingsPanelToField({
      paneName: 'api-input',
      fieldIds: getRunningHubGuideEdition(_0x15a4e7)['fieldIds'],
      select: !![],
      highlight: !![],
    }));
}
function createGuideNote(_0x5ef5de) {
  const _0x453105 = createEl('li', 'audio-voice-api-key-guide-note');
  return ((_0x453105['textContent'] = _0x5ef5de), _0x453105);
}
function openGuideExternalLink(_0xd71bb1, _0x16ee63) {
  void openExternalLink(_0xd71bb1, { label: guideText(_0x16ee63) })['catch']((_0x503584) => {
    globalThis['window']?.['showToast']?.(
      _0x503584?.['message'] || t('coreServices.externalLink.openFailed'),
      'error',
    );
  });
}
export function showRunningHubApiKeyGuide(_0x2dd378 = 'runninghub') {
  closeRunningHubApiKeyGuide();
  const _0x4e5c9d = getRunningHubGuideEdition(_0x2dd378),
    _0x2b2a50 = createEl('div', 'audio-voice-api-key-guide-backdrop');
  ((_0x2b2a50['id'] = GUIDE_BACKDROP_ID), _0x2b2a50['setAttribute']('aria-hidden', 'true'));
  const _0x2625db = createEl('section', 'audio-voice-api-key-guide');
  ((_0x2625db['id'] = GUIDE_DIALOG_ID),
    _0x2625db['setAttribute']('role', 'dialog'),
    _0x2625db['setAttribute']('aria-modal', 'true'),
    _0x2625db['setAttribute']('aria-label', guideText('guideTitle')));
  const _0x500ca7 = createEl('div', 'audio-voice-api-key-guide-header'),
    _0x5a7be1 = createEl('span', 'audio-voice-api-key-guide-icon');
  (_0x5a7be1['setAttribute']('aria-hidden', 'true'), (_0x5a7be1['innerHTML'] = iconSvg()));
  const _0x234a78 = createEl('div', 'audio-voice-api-key-guide-title', guideText('guideTitle')),
    _0x4511fb = createEl('button', 'audio-voice-api-key-guide-close', 'x');
  ((_0x4511fb['type'] = 'button'),
    (_0x4511fb['title'] = guideText('close')),
    _0x4511fb['setAttribute']('aria-label', guideText('close')),
    (_0x4511fb['dataset']['runninghubApiKeyGuideAction'] = 'close'),
    _0x500ca7['append'](_0x5a7be1, _0x234a78, _0x4511fb));
  const _0x243110 = createEl('div', 'audio-voice-api-key-guide-body'),
    _0x3b63b7 = createEl('div', 'audio-voice-api-key-guide-subtitle', guideText('guideSubtitle')),
    _0x2d8736 = createEl('div', 'audio-voice-api-key-guide-section-title', guideText('guideChecklistTitle')),
    _0x42e155 = createEl('ol', 'audio-voice-api-key-guide-notes');
  ['guideNote1', 'guideNote2', 'guideNote3', 'guideNote4']['forEach']((_0x4e3a3b) =>
    _0x42e155['appendChild'](createGuideNote(guideText(_0x4e3a3b))),
  );
  const _0x30179a = createEl('div', 'audio-voice-api-key-guide-image-wrap'),
    _0x58ca90 = createEl('img', 'audio-voice-api-key-guide-image');
  ((_0x58ca90['src'] = RUNNINGHUB_API_KEY_GUIDE_IMAGE),
    (_0x58ca90['alt'] = guideText('guideAlt')),
    (_0x58ca90['width'] = 0x3c0),
    (_0x58ca90['height'] = 0x834),
    (_0x58ca90['decoding'] = 'async'),
    (_0x58ca90['loading'] = 'eager'),
    (_0x58ca90['fetchPriority'] = 'high'));
  const _0x306eb7 = createEl('div', 'audio-voice-api-key-guide-image-links');
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
  ]['forEach'](({ action: _0x34845f, className: _0xfadfc7, label: _0x31df4e }) => {
    const _0x9fb5c0 = createEl('button', 'audio-voice-api-key-guide-image-link ' + _0xfadfc7, _0x31df4e);
    ((_0x9fb5c0['type'] = 'button'),
      (_0x9fb5c0['dataset']['runninghubApiKeyGuideAction'] = _0x34845f),
      _0x9fb5c0['setAttribute']('aria-label', _0x31df4e),
      _0x306eb7['appendChild'](_0x9fb5c0));
  }),
    _0x30179a['append'](_0x58ca90, _0x306eb7),
    _0x243110['append'](_0x3b63b7, _0x2d8736, _0x42e155, _0x30179a));
  const _0x120a1a = createEl('div', 'audio-voice-api-key-guide-actions'),
    _0x2d6cc8 = createEl(
      'button',
      'audio-voice-api-key-guide-btn audio-voice-api-key-guide-btn-secondary',
      guideText('openSettings'),
    );
  ((_0x2d6cc8['type'] = 'button'), (_0x2d6cc8['dataset']['runninghubApiKeyGuideAction'] = 'open-settings'));
  const _0x35a89e = createEl(
    'button',
    'audio-voice-api-key-guide-btn\x20audio-voice-api-key-guide-btn-primary',
    guideText('openConsole'),
  );
  ((_0x35a89e['type'] = 'button'),
    (_0x35a89e['dataset']['runninghubApiKeyGuideAction'] = 'open-console'),
    _0x120a1a['append'](_0x2d6cc8, _0x35a89e),
    _0x2625db['append'](_0x500ca7, _0x243110, _0x120a1a),
    document['body']?.['append'](_0x2b2a50, _0x2625db),
    _0x2b2a50['addEventListener']?.('click', closeRunningHubApiKeyGuide),
    _0x2625db['addEventListener']?.('click', (_0x1d7d6a) => {
      const _0x46a18b = _0x1d7d6a['target']?.['closest']?.('[data-runninghub-api-key-guide-action]');
      if (!_0x46a18b) return;
      _0x1d7d6a['preventDefault']?.();
      const _0x4164d5 = _0x46a18b['dataset']['runninghubApiKeyGuideAction'];
      if (_0x4164d5 === 'close') closeRunningHubApiKeyGuide();
      if (_0x4164d5 === 'open-settings') openRunningHubApiKeySettings(_0x2dd378);
      _0x4164d5 === 'open-console' && openGuideExternalLink(_0x4e5c9d['consoleUrl'], 'openConsole');
    }),
    document['addEventListener']('keydown', handleGuideKeydown),
    _0x2625db['classList']['add']('open'),
    _0x2b2a50['classList']['add']('open'),
    _0x4511fb['focus']?.());
}
export function bindRunningHubApiKeyGuideTriggers(_0x39d461 = document) {
  _0x39d461?.['querySelectorAll']?.('[data-runninghub-api-key-guide-trigger]')?.['forEach']((_0x19c54d) => {
    if (_0x19c54d['dataset']['runninghubApiKeyGuideBound'] === '1') return;
    ((_0x19c54d['dataset']['runninghubApiKeyGuideBound'] = '1'),
      _0x19c54d['addEventListener']('click', (_0x5e3f9a) => {
        (_0x5e3f9a['preventDefault'](),
          showRunningHubApiKeyGuide(_0x19c54d['dataset']['runninghubApiKeyGuideTrigger'] || 'runninghub'));
      }));
  });
}
