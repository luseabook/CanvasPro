import { t } from '../../i18n/index.js';
import { REPLACEMENT_STUDIO_VIP_MODEL_ID } from '../subscriptionAccess.js';

const REPLACEMENT_STUDIO_VIP_PROVIDER = 'aicanvas';

export function isReplacementStudioAuthorized(windowObject = globalThis.window) {
  const isModelAllowedBySubscription = windowObject?.isModelAllowedBySubscription;
  return (
    typeof isModelAllowedBySubscription === 'function' &&
    isModelAllowedBySubscription(REPLACEMENT_STUDIO_VIP_MODEL_ID, REPLACEMENT_STUDIO_VIP_PROVIDER) ===
      true
  );
}

export function requestReplacementStudioAuthorization({
  windowObject = globalThis.window,
  onSuccess = null,
} = {}) {
  if (typeof windowObject?.openSubscriptionDialog === 'function') {
    windowObject.openSubscriptionDialog({
      modelId: REPLACEMENT_STUDIO_VIP_MODEL_ID,
      provider: REPLACEMENT_STUDIO_VIP_PROVIDER,
      onSuccess,
    });
    return true;
  }

  windowObject?.showToast?.(t('aigenAudioNode.vip.needAuthorization'), 'warn');
  return false;
}
