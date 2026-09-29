import { t } from '../i18n/index.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { openSettingsPanelToField } from './settings/panelSettings.js';
import {
  showVolcengineSpeechApiKeyGuide,
  openVolcengineSpeechApiKeySettings,
} from './volcengineSpeechApiKeyGuide.js';
export const AUDIO_VOICE_ASR_PROVIDER_IDS = Object['freeze']({
  DOUBAO: 'doubao',
  FUNASR: 'funasr',
  BAILIAN: 'bailian',
});
const PROVIDERS = Object['freeze']([
  {
    id: 'doubao',
    configProviderId: 'volcengine-speech',
    helpPath: 'asrApiKeyHelp',
    requiredCapabilities: ['asr'],
    icon: 'images/volcengine.svg',
    iconAlt: 'volcengine',
    openGuide: showVolcengineSpeechApiKeyGuide,
    openSettings: openVolcengineSpeechApiKeySettings,
  },
  {
    id: 'bailian',
    configProviderId: 'bailian',
    helpPath: 'bailianAsrApiKeyHelp',
    requiredCapabilities: [],
    authErrorKeys: {
      invalidKey: 'bailianAsrApiKeyHelp.invalidMessage',
      permissionDenied: 'bailianAsrApiKeyHelp.invalidMessage',
    },
    icon: 'images/qwen.svg',
    iconAlt: 'Qwen',
    openGuide: () => openExternalLink('https://help.aliyun.com/zh/model-studio/get-api-key'),
    openSettings: () =>
      openSettingsPanelToField({
        paneName: 'api-input',
        fieldIds: ['providerKey-bailian'],
        select: !![],
        highlight: !![],
      }),
  },
  { id: 'funasr', iconName: 'device', icon: '', iconAlt: 'local' },
]);
export function normalizeAudioVoiceAsrProvider(_0x56cfaa) {
  const _0x2e05f3 = String(_0x56cfaa || '')
    ['trim']()
    ['toLowerCase']();
  return PROVIDERS['some']((_0x148c84) => _0x148c84['id'] === _0x2e05f3) ? _0x2e05f3 : 'doubao';
}
export function getAudioVoiceAsrProvider(_0x479ad9) {
  return PROVIDERS['find']((_0x313d10) => _0x313d10['id'] === normalizeAudioVoiceAsrProvider(_0x479ad9));
}
export function getAudioVoiceAsrProviderOptions() {
  return PROVIDERS['map']((_0x1550e5) => ({
    ..._0x1550e5,
    label: t('audioVoicePanel.asrProviders.' + _0x1550e5['id'] + '.label'),
    subtitle: t('audioVoicePanel.asrProviders.' + _0x1550e5['id'] + '.subtitle'),
  }));
}
export function assertAudioVoiceAsrResult(_0x4f24dc, _0x47562c) {
  const _0x30c0e5 = String(_0x4f24dc?.['asr']?.['provider'] || '')['trim']();
  if (_0x30c0e5 !== normalizeAudioVoiceAsrProvider(_0x47562c))
    throw new Error(t('audioVoicePanel.toasts.asrRuntimeMismatch'));
  const _0x5042f5 = Array['isArray'](_0x4f24dc?.['segments']) ? _0x4f24dc['segments'] : [];
  if (!_0x5042f5['some']((_0x25ae56) => String(_0x25ae56?.['sourceText'] || '')['trim']()))
    throw new Error(t('audioVoicePanel.toasts.asrEmptyTranscript'));
}
