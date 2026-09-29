import test from 'node:test';
import assert from 'node:assert/strict';

import { createPayloadObjectUrlLease, releasePayloadObjectUrlLease } from './payloadObjectUrlLease.js';

test('payloadObjectUrlLease: transfers urls to the payload and releases them later', () => {
  const originalCreate = globalThis.URL.createObjectURL;
  const originalRevoke = globalThis.URL.revokeObjectURL;
  const revoked = [];
  let created = 0;

  globalThis.URL.createObjectURL = () => `blob:lease-${++created}`;
  globalThis.URL.revokeObjectURL = (url) => revoked.push(url);

  try {
    const lease = createPayloadObjectUrlLease({ ownerId: 'node-1', kind: 'image' });
    const payload = {};
    const first = lease.create({ size: 3, type: 'image/png' }, { sourceUrl: 'source-a' });
    const second = lease.create({ size: 4, type: 'image/webp' }, { sourceUrl: 'source-b' });

    assert.equal(first, 'blob:lease-1');
    assert.equal(second, 'blob:lease-2');
    assert.equal(lease.bind(payload), payload);
    assert.equal(lease.release(), 0);
    assert.equal(releasePayloadObjectUrlLease(payload), 2);
    assert.deepEqual(revoked, ['blob:lease-1', 'blob:lease-2']);
  } finally {
    globalThis.URL.createObjectURL = originalCreate;
    globalThis.URL.revokeObjectURL = originalRevoke;
  }
});

test('payloadObjectUrlLease: releases urls that were never bound', () => {
  const originalCreate = globalThis.URL.createObjectURL;
  const originalRevoke = globalThis.URL.revokeObjectURL;
  const revoked = [];

  globalThis.URL.createObjectURL = () => 'blob:unbound';
  globalThis.URL.revokeObjectURL = (url) => revoked.push(url);

  try {
    const lease = createPayloadObjectUrlLease();
    lease.create({ size: 1 });

    assert.equal(lease.release(), 1);
    assert.deepEqual(revoked, ['blob:unbound']);
  } finally {
    globalThis.URL.createObjectURL = originalCreate;
    globalThis.URL.revokeObjectURL = originalRevoke;
  }
});
