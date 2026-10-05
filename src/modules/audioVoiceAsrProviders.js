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
        select: true,
        highlight: true,
      }),
  },
  { id: 'funasr', iconName: 'device', icon: '', iconAlt: 'local' },
]);
export function normalizeAudioVoiceAsrProvider(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return PROVIDERS['some']((key) => key['id'] === item) ? item : 'doubao';
}
export function getAudioVoiceAsrProvider(index) {
  return PROVIDERS['find']((result) => result['id'] === normalizeAudioVoiceAsrProvider(index));
}
export function getAudioVoiceAsrProviderOptions() {
  return PROVIDERS['map']((args) => ({
    ...args,
    label: t('audioVoicePanel.asrProviders.' + args['id'] + '.label'),
    subtitle: t('audioVoicePanel.asrProviders.' + args['id'] + '.subtitle'),
  }));
}
export function assertAudioVoiceAsrResult(data, options) {
  const target = String(data?.['asr']?.['provider'] || '')['trim']();
  if (target !== normalizeAudioVoiceAsrProvider(options))
    throw new Error(t('audioVoicePanel.toasts.asrRuntimeMismatch'));
  const list = Array['isArray'](data?.['segments']) ? data['segments'] : [];
  if (!list['some']((source) => String(source?.['sourceText'] || '')['trim']()))
    throw new Error(t('audioVoicePanel.toasts.asrEmptyTranscript'));
}
