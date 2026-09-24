import test from 'node:test';
import assert from 'node:assert/strict';
import * as terminology from './replacementStudioTerminology.js';
import { REPLACEMENT_STUDIO_MODE_ID, REPLACEMENT_STUDIO_NAME } from '../workspaceStudioModes.js';

test('replacementStudioTerminology: 纯再导出 workspaceStudioModes 的两常量', () => {
  assert.deepEqual(Object.keys(terminology).sort(), [
    'REPLACEMENT_STUDIO_MODE_ID',
    'REPLACEMENT_STUDIO_NAME',
  ]);
  assert.equal(terminology.REPLACEMENT_STUDIO_MODE_ID, REPLACEMENT_STUDIO_MODE_ID);
  assert.equal(terminology.REPLACEMENT_STUDIO_NAME, REPLACEMENT_STUDIO_NAME);
});
