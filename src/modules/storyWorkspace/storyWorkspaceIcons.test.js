import test from 'node:test';
import assert from 'node:assert/strict';

import * as storyIcons from './storyWorkspaceIcons.js';
import {
  renderWorkspaceActionIcon,
  renderWorkspaceAddToLibraryIcon,
  renderWorkspaceConfirmIcon,
  renderWorkspaceDeleteIcon,
  renderWorkspaceKeyframeIcon,
  renderWorkspaceSplitIcon,
  renderWorkspaceUploadIcon,
} from '../workspaceActionIcons.js';

const PAIRS = [
  ['renderStoryActionIcon', renderWorkspaceActionIcon],
  ['renderStoryConfirmIcon', renderWorkspaceConfirmIcon],
  ['renderStoryDeleteIcon', renderWorkspaceDeleteIcon],
  ['renderStorySplitIcon', renderWorkspaceSplitIcon],
  ['renderStoryKeyframeIcon', renderWorkspaceKeyframeIcon],
  ['renderStoryUploadIcon', renderWorkspaceUploadIcon],
  ['renderStoryAddToLibraryIcon', renderWorkspaceAddToLibraryIcon],
];

test('storyWorkspaceIcons: 每个 story 图标都与 workspace 图标逐字一致', () => {
  for (const [storyName, source] of PAIRS) {
    const rendered = storyIcons[storyName]();
    assert.equal(typeof rendered, 'string');
    assert.ok(rendered.length > 0, storyName + ' 不应返回空串');
    assert.equal(rendered, source(), storyName + ' 应原样转发');
  }
});

test('storyWorkspaceIcons: 命名空间只含这 7 个转发函数', () => {
  assert.deepEqual(
    Object.keys(storyIcons).sort(),
    PAIRS.map(([name]) => name).sort(),
  );
  for (const [name] of PAIRS) assert.equal(typeof storyIcons[name], 'function');
});

test('storyWorkspaceIcons: 不同图标产出不同，说明没串线', () => {
  const confirm = storyIcons.renderStoryConfirmIcon();
  const remove = storyIcons.renderStoryDeleteIcon();
  const upload = storyIcons.renderStoryUploadIcon();
  assert.notEqual(confirm, remove);
  assert.notEqual(remove, upload);
  assert.equal(new Set([confirm, remove, upload]).size, 3);
});
