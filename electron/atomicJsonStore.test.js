import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeJsonAtomicallySync } from './atomicJsonStore.js';
function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'canvaspro-atomic-json-'));
  try { run(path.join(root,'settings.json'), root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
test('desktop identity/settings publication preserves the previous valid file', () => fixture(file => {
  writeJsonAtomicallySync(file, { deviceId: 'fixture-one' });
  writeJsonAtomicallySync(file, { deviceId: 'fixture-two' });
  assert.equal(JSON.parse(fs.readFileSync(file)).deviceId, 'fixture-two');
  assert.equal(JSON.parse(fs.readFileSync(file+'.bak')).deviceId, 'fixture-one');
}));
test('a corrupted settings file is not silently replaced by the identity mirror', () => fixture(file => {
  fs.writeFileSync(file, '{invalid-fixture');
  assert.throws(() => writeJsonAtomicallySync(file, { deviceId: 'new-fixture' }), { code: 'CORRUPT_JSON_FILE' });
  assert.equal(fs.readFileSync(file,'utf8'), '{invalid-fixture');
}));
test('failed publication leaves the old JSON valid and cleans its temporary files', () => fixture((file, root) => {
  writeJsonAtomicallySync(file, { value: 'old' });
  const io = { ...fs, renameSync(source, destination) { if (destination === file) throw Object.assign(new Error('synthetic disk failure'), { code: 'EIO' }); fs.renameSync(source,destination); } };
  assert.throws(() => writeJsonAtomicallySync(file, { value: 'new' }, { io }), { code: 'EIO' });
  assert.equal(JSON.parse(fs.readFileSync(file)).value, 'old');
  assert.equal(fs.readdirSync(root).some(name => name.endsWith('.tmp')), false);
}));
