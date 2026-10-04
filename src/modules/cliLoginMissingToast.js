import { openSettingsPanelToField } from './settings/panelSettings.js';
const CLI_LOGIN_ACTION_LABEL = '去设置',
  CLI_LOGIN_SETTINGS_TARGETS = Object['freeze']({
    dreamina: Object['freeze']({
      paneName: 'cli-login',
      fieldIds: Object['freeze'](['btnDreaminaAuth', 'dreaminaSettingsCard']),
    }),
    codex: Object['freeze']({
      paneName: 'cli-login',
      fieldIds: Object['freeze'](['btnCodexCliLogin', 'codexCliSettingsCard']),
    }),
  });
function normalizeProviderId(value) {
  return String(value || '')
    ['trim']()
    ['toLowerCase']();
}
export function openCliLoginSettings(options = {}) {
  const providerId = normalizeProviderId(options['providerId'] || options['provider']),
    item = CLI_LOGIN_SETTINGS_TARGETS[providerId],
    key = Array['isArray'](options['fieldIds']) ? options['fieldIds'] : item?.['fieldIds'] || [];
  return openSettingsPanelToField({
    paneName: options['paneName'] || item?.['paneName'] || 'cli-login',
    fieldIds: key,
    select: ![],
    highlight: !![],
  });
}
export function showCliLoginMissingToast(index, result = {}) {
  const data = String(index || '')['trim']() || '请先完成 CLI 登录',
    handler = () => openCliLoginSettings(result),
    handler2 = globalThis['window']?.['showToast'];
  if (typeof handler2 !== 'function') return (handler(), !![]);
  return (
    handler2(data, result['type'] || 'warn', result['duration'], {
      actionLabel: result['actionLabel'] || CLI_LOGIN_ACTION_LABEL,
      onAction: handler,
    }),
    !![]
  );
}
