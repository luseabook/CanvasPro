import { openSettingsPanelToField } from "./settings/panelSettings.js";

const SUBSCRIPTION_PANE_NAME = "subscription";
const SUBSCRIPTION_FIELD_IDS = Object.freeze(["subscriptionCdkeyInput"]);

export function isSubscriptionAccessConfigurationMessage(message) {
  const text = String(message || "").trim();
  if (!text) return false;

  return (
    /(?:请先|需要[^，。]*(?:激活|输入)|请输入)[^，。]*(?:cdkey|订阅|授权)/i.test(
      text,
    ) ||
    /(?:vip|subscription|license|cdkey).*(?:required\b|activate\b|enter\b)|(?:activate\b|enter\b).*(?:cdkey|subscription|license)/i.test(
      text,
    )
  );
}

export function openSubscriptionAccessSettings(options = {}) {
  const fieldIds = Array.isArray(options.fieldIds)
    ? options.fieldIds
    : SUBSCRIPTION_FIELD_IDS;
  return openSettingsPanelToField({
    paneName: options.paneName || SUBSCRIPTION_PANE_NAME,
    fieldIds,
    select: options.select !== false,
    highlight: options.highlight !== false,
  });
}
