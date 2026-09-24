import test from 'node:test';
import assert from 'node:assert/strict';
import { REPLACEMENT_STUDIO_MODE_ID, REPLACEMENT_STUDIO_NAME } from './workspaceStudioModes.js';

test('workspaceStudioModes: 暴露替换工作室模式 id 与显示名', () => {
  assert.equal(REPLACEMENT_STUDIO_MODE_ID, 'person-replacement');
  assert.equal(REPLACEMENT_STUDIO_NAME, '替换工作室');
});
