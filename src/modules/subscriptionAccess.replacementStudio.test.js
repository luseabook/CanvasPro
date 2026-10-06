import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPLACEMENT_STUDIO_VIP_MODEL_ID,
  isModelAllowed,
  isVipModel,
} from './subscriptionAccess.js';

test('replacement studio requires its explicit feature entitlement', () => {
  const activeSubscription = { status: 'active', entitledModelIds: [], entitledModelKeys: [] };
  const entitledSubscription = {
    status: 'active',
    entitledModelIds: [REPLACEMENT_STUDIO_VIP_MODEL_ID],
    entitledModelKeys: [],
  };
  const inactiveSubscription = {
    status: 'none',
    entitledModelIds: [REPLACEMENT_STUDIO_VIP_MODEL_ID],
    entitledModelKeys: [],
  };

  assert.equal(REPLACEMENT_STUDIO_VIP_MODEL_ID, 'feature/replacement_studio');
  assert.equal(isVipModel(REPLACEMENT_STUDIO_VIP_MODEL_ID, 'aicanvas'), true);
  assert.equal(
    isModelAllowed(REPLACEMENT_STUDIO_VIP_MODEL_ID, activeSubscription, 'aicanvas'),
    false,
  );
  assert.equal(
    isModelAllowed(REPLACEMENT_STUDIO_VIP_MODEL_ID, entitledSubscription, 'aicanvas'),
    true,
  );
  assert.equal(
    isModelAllowed(REPLACEMENT_STUDIO_VIP_MODEL_ID, inactiveSubscription, 'aicanvas'),
    false,
  );
});
