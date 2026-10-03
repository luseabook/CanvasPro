import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDeviceIdentityManager } from './deviceIdentity.js';
test('independent profiles never read or mirror the normal profile identity', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'canvaspro-identity-test-'));
  try {
    const profile = path.join(root, 'isolated'), legacy = path.join(root, 'legacy');
    fs.mkdirSync(path.join(legacy,'user'), { recursive: true });
    const legacyFile = path.join(legacy,'user','settings.json');
    fs.writeFileSync(legacyFile, JSON.stringify({ deviceId: 'DO_NOT_REUSE_LEGACY_FIXTURE' }));
    const manager = createDeviceIdentityManager({ isolatedProfile: true, appRoot: legacy,
      app: { getPath: name => { assert.equal(name, 'userData'); return profile; } }, getUserRoot: () => path.join(profile,'user') });
    const id = manager.getStableDeviceId();
    assert.notEqual(id, 'DO_NOT_REUSE_LEGACY_FIXTURE'); assert.equal(manager.getStableDeviceId(), id);
    assert.equal(JSON.parse(fs.readFileSync(legacyFile)).deviceId, 'DO_NOT_REUSE_LEGACY_FIXTURE');
    assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'user','settings.json'))).deviceId, id);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
