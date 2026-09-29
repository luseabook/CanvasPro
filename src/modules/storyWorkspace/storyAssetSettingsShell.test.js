import test from 'node:test';
import assert from 'node:assert/strict';

import * as storyShell from './storyAssetSettingsShell.js';
import { renderWorkspaceAssetSettingsShell } from '../workspaceAssetSettingsShell.js';

test('storyAssetSettingsShell: 两个导出名指向同一个实现，是纯别名件', () => {
  assert.equal(storyShell.renderStoryAssetSettingsShell, renderWorkspaceAssetSettingsShell);
  assert.equal(storyShell.renderWorkspaceAssetSettingsShell, renderWorkspaceAssetSettingsShell);
});

test('storyAssetSettingsShell: 命名空间只含这两个别名，不夹带实现', () => {
  assert.deepEqual(Object.keys(storyShell).sort(), [
    'renderStoryAssetSettingsShell',
    'renderWorkspaceAssetSettingsShell',
  ]);
  assert.equal(typeof renderWorkspaceAssetSettingsShell, 'function');
});
