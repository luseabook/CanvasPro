import test from 'node:test';
import assert from 'node:assert/strict';

import { discardStagedProjectPackage, stageProjectPackageFile } from './projectPackageApi.js';

test('projectPackageApi: stages packages with filename validation and normalized metadata', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(
      JSON.stringify({
        path: '  data/uploads/demo.aicpkg  ',
        stageId: ' stage-1 ',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  try {
    const result = await stageProjectPackageFile({ name: 'demo.aicpkg' });
    assert.deepEqual(result, {
      path: 'data/uploads/demo.aicpkg',
      stageId: 'stage-1',
    });
    assert.equal(calls[0].url, '/api/v2/desktop/project/stage-package?filename=demo.aicpkg');
    assert.equal(calls[0].options.headers['Content-Type'], 'application/octet-stream');
    await assert.rejects(() => stageProjectPackageFile({ name: 'demo.zip' }), /只支持 .aicpkg/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('projectPackageApi: discards only non-empty staged package ids', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ success: true, removed: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    assert.deepEqual(await discardStagedProjectPackage(''), {
      success: true,
      removed: false,
    });
    assert.equal(calls.length, 0);
    assert.deepEqual(await discardStagedProjectPackage(' stage-1 '), {
      success: true,
      removed: true,
    });
    assert.deepEqual(JSON.parse(calls[0].options.body), { stageId: 'stage-1' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
