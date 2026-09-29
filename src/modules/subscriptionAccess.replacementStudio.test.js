import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPLACEMENT_STUDIO_VIP_MODEL_ID,
  isModelAllowed,
  isVipModel,
} from './subscriptionAccess.js';

test('replacement studio unlocks any active subscription without model entitlements', () => {
  const activeSubscription = { status: 'active', entitledModelIds: [], entitledModelKeys: [] };
  const inactiveSubscription = {
    status: 'none',
    entitledModelIds: [REPLACEMENT_STUDIO_VIP_MODEL_ID],
    entitledModelKeys: [],
  };

  assert.equal(REPLACEMENT_STUDIO_VIP_MODEL_ID, 'feature/replacement_studio');
  assert.equal(isVipModel(REPLACEMENT_STUDIO_VIP_MODEL_ID, 'aicanvas'), true);
  assert.equal(
    isModelAllowed(REPLACEMENT_STUDIO_VIP_MODEL_ID, activeSubscription, 'aicanvas'),
    true,
  );
  assert.equal(
    isModelAllowed(REPLACEMENT_STUDIO_VIP_MODEL_ID, inactiveSubscription, 'aicanvas'),
    false,
  );
});
