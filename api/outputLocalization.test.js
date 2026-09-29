import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveOutputWithLocalization } from './outputLocalization.js';

test('outputLocalization: awaits the required local persistence step', async () => {
  let calls = 0;
  const result = await resolveOutputWithLocalization({ id: 'result-1' }, async () => {
    calls += 1;
    return { localPath: '/tmp/result-1.png' };
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { localPath: '/tmp/result-1.png' });
});

test('outputLocalization: rejects deferred localization and missing persistence', async () => {
  await assert.rejects(
    resolveOutputWithLocalization({}, async () => 'ok', { deferOutputLocalization: true }),
    /必须先保存到本地/,
  );
  await assert.rejects(resolveOutputWithLocalization({}, null), /缺少本地落盘步骤/);
});
