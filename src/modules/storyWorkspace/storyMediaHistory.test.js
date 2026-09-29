import test from 'node:test';
import assert from 'node:assert/strict';

import * as storyMediaHistory from './storyMediaHistory.js';
import { createWorkspaceMediaHistoryMenuController, renderWorkspaceMediaHistoryMenu } from '../workspaceMediaHistory.js';

test('storyMediaHistory: 两个导出名指向同一个实现，是纯别名件', () => {
  assert.equal(storyMediaHistory.createStoryMediaHistoryMenuController, createWorkspaceMediaHistoryMenuController);
  assert.equal(storyMediaHistory.renderStoryMediaHistoryMenu, renderWorkspaceMediaHistoryMenu);
});

test('storyMediaHistory: 命名空间只含这两个别名，不夹带实现', () => {
  assert.deepEqual(Object.keys(storyMediaHistory).sort(), [
    'createStoryMediaHistoryMenuController',
    'renderStoryMediaHistoryMenu',
  ]);
  assert.equal(typeof createWorkspaceMediaHistoryMenuController, 'function');
  assert.equal(typeof renderWorkspaceMediaHistoryMenu, 'function');
});
