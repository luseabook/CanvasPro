import {
  inferProviderIdFromApiKeyMessage,
  isApiKeyConfigurationMessage,
  openProviderApiKeySettings,
} from '../modules/providerApiKeyMissingToast.js';
import {
  isSubscriptionAccessConfigurationMessage,
  openSubscriptionAccessSettings,
} from '../modules/subscriptionAccessMissingToast.js';
import { logDiagnosticEvent } from './diagnosticsService.js';
const DEFAULT_DURATION = 2900,
  ALERT_DURATION = 5000,
  SETTINGS_ACTION_LABEL = '去设置',
  ICONS = { ok: '', warn: '⚠️', error: '✕', success: '✓' };
function resolveToastActionOptions(message, value = {}) {
  if (value?.['actionLabel'] || typeof value?.['onAction'] === 'function') return value || {};
  if (isApiKeyConfigurationMessage(message)) {
    const providerId = inferProviderIdFromApiKeyMessage(message);
    return {
      ...(value || {}),
      actionLabel: SETTINGS_ACTION_LABEL,
      onAction: () => {
        openProviderApiKeySettings({ providerId: providerId, message: message });
      },
    };
  }
  if (isSubscriptionAccessConfigurationMessage(message))
    return {
      ...(value || {}),
      actionLabel: SETTINGS_ACTION_LABEL,
      onAction: () => {
        openSubscriptionAccessSettings();
      },
    };
  return value || {};
}
export function showToast(item, key = 'ok', index, result = {}) {
  const level = key === 'warning' ? 'warn' : key;
  (level === 'error' || level === 'warn') &&
    void logDiagnosticEvent({
      type: 'ui.alert_presented',
      level: level,
      source: 'renderer',
      message: String(item || 'User-visible alert'),
      context: { toastType: level },
    });
  const el = document['getElementById']('v2-toast-wrap');
  if (!el) {
    console['warn']('[Toast]', item);
    return;
  }
  const enabled = level === 'error' || level === 'warn',
    data = enabled ? ALERT_DURATION : DEFAULT_DURATION,
    options = Number['isFinite'](Number(index)) ? Math['max'](0, Number(index)) : data,
    target = enabled ? Math['max'](ALERT_DURATION, options) : options,
    source = ICONS[level] ?? '',
    el2 = document['createElement']('div'),
    handler = () => {
      (el2['remove'](),
        el['childElementCount'] === 0 &&
          el['matches']?.(':popover-open') &&
          el['hidePopover']());
    };
  (el2['style']?.['setProperty']('--toast-exit-delay', Math['max'](0, target - 300) + 'ms'),
    (el2['className'] = 'v2-toast' + (level !== 'ok' ? ' ' + level : '')));
  target > DEFAULT_DURATION && !enabled && el2['classList']['add']('is-long');
  if (source) {
    const el3 = document['createElement']('span');
    ((el3['className'] = 'v2-toast-icon'),
      (el3['textContent'] = source),
      el2['appendChild'](el3));
  }
  const el4 = document['createElement']('span');
  ((el4['textContent'] = item), el2['appendChild'](el4));
  const toastActionOptions = resolveToastActionOptions(item, result);
  if (typeof toastActionOptions?.['renderContent'] === 'function') toastActionOptions['renderContent'](el4);
  if (typeof toastActionOptions?.['onClick'] === 'function') {
    const next = (event) => {
      if (event?.['type'] === 'keydown' && !['Enter', ' ']['includes'](event['key'])) return;
      event?.['preventDefault']?.();
      try {
        toastActionOptions['onClick']();
      } finally {
        handler();
      }
    };
    (el2['classList']['add']('is-clickable'),
      el2['setAttribute']('role', 'button'),
      el2['setAttribute']('tabindex', '0'),
      el2['setAttribute'](
        'aria-label',
        String(toastActionOptions['ariaLabel'] || item + '，点击查看')['trim'](),
      ),
      el2['addEventListener']('click', next),
      el2['addEventListener']('keydown', next));
  }
  const current = String(toastActionOptions?.['actionLabel'] || '')['trim']();
  if (current && typeof toastActionOptions?.['onAction'] === 'function') {
    const el5 = document['createElement']('button');
    ((el5['type'] = 'button'),
      (el5['className'] = 'v2-toast-action'),
      (el5['textContent'] = current),
      el5['addEventListener']('click', (event2) => {
        (event2['preventDefault'](), event2['stopPropagation']());
        try {
          toastActionOptions['onAction']();
        } finally {
          handler();
        }
      }),
      el2['appendChild'](el5));
  }
  el['appendChild'](el2);
  if (typeof el['showPopover'] === 'function') {
    el['setAttribute']('popover', 'manual');
    if (el['matches'](':popover-open')) el['hidePopover']();
    el['showPopover']();
  }
  setTimeout(handler, target);
}
export function showSuccess(entry, record) {
  showToast(entry, 'success', record);
}
export function showError(payload, handle) {
  showToast(payload, 'error', handle);
}
export function showWarning(state, config) {
  showToast(state, 'warn', config);
}
export function initToastService() {
  ((window['showToast'] = showToast),
    (window['showSuccess'] = showSuccess),
    (window['showError'] = showError),
    (window['showWarning'] = showWarning));
}
