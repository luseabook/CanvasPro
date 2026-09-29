import test from 'node:test';
import assert from 'node:assert/strict';

import { t } from '../../i18n/index.js';
import { REPLACEMENT_STUDIO_VIP_MODEL_ID } from '../subscriptionAccess.js';
import {
  isReplacementStudioAuthorized,
  requestReplacementStudioAuthorization,
} from './replacementStudioAccess.js';

test('replacementStudioAccess: authorization delegates to the subscription gate', () => {
  const calls = [];
  const windowObject = {
    isModelAllowedBySubscription(...args) {
      calls.push(args);
      return true;
    },
  };

  assert.equal(isReplacementStudioAuthorized(windowObject), true);
  assert.deepEqual(calls, [[REPLACEMENT_STUDIO_VIP_MODEL_ID, 'aicanvas']]);
  assert.equal(
    isReplacementStudioAuthorized({
      isModelAllowedBySubscription: () => 1,
    }),
    false,
  );
  assert.equal(isReplacementStudioAuthorized({}), false);
  assert.equal(isReplacementStudioAuthorized(null), false);
});

test('replacementStudioAccess: opens the subscription dialog with the studio gate', () => {
  const calls = [];
  const onSuccess = () => {};
  const windowObject = {
    openSubscriptionDialog(payload) {
      calls.push(payload);
      return 'opened';
    },
  };

  assert.equal(
    requestReplacementStudioAuthorization({
      windowObject,
      onSuccess,
    }),
    true,
  );
  assert.deepEqual(calls, [
    {
      modelId: REPLACEMENT_STUDIO_VIP_MODEL_ID,
      provider: 'aicanvas',
      onSuccess,
    },
  ]);
});

test('replacementStudioAccess: reports the missing VIP dialog through a warning toast', () => {
  const toasts = [];
  const windowObject = {
    showToast(message, type) {
      toasts.push([message, type]);
    },
  };

  assert.equal(requestReplacementStudioAuthorization({ windowObject }), false);
  assert.deepEqual(toasts, [[t('aigenAudioNode.vip.needAuthorization'), 'warn']]);
});
