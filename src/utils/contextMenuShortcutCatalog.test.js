import assert from 'node:assert/strict';
import test from 'node:test';
import { SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED } from '../config/productFeatures.js';
import {
  CONTEXT_MENU_SHORTCUTS,
  CONTEXT_MENU_SHORTCUT_IDS,
  isContextMenuShortcut,
} from './contextMenuShortcutCatalog.js';

const EXPECTED_CATALOG_IDS = [
  'context-canvas-open-add-node-menu',
  'context-canvas-open-node-section-generation',
  'context-canvas-open-node-section-source',
  'context-canvas-open-node-section-function',
  'context-canvas-material-comparison',
  'context-canvas-create-collage',
  'context-canvas-add-to-library',
  'context-canvas-reveal-file',
  'context-canvas-open-output-folder',
  'context-canvas-duplicate',
  'context-canvas-copy-text',
  'context-canvas-create-connected-ai-text',
  'context-canvas-create-connected-ai-image',
  'context-canvas-create-connected-ai-video',
  'context-canvas-create-connected-ai-audio',
  'context-canvas-open-grid-menu',
  'context-canvas-create-grid-4',
  'context-canvas-create-grid-9',
  'context-canvas-create-grid-16',
  'context-canvas-create-grid-25',
  'context-canvas-create-source-image',
  'context-canvas-create-source-video',
  'context-canvas-create-source-audio',
  'context-canvas-create-panorama-scene',
  'context-canvas-create-panorama-360',
  'context-canvas-create-storyboard',
  'context-canvas-create-storyboard-script',
  'context-canvas-create-collage-node',
  'context-canvas-create-whiteboard',
  'context-canvas-create-media-clip',
  'context-canvas-create-debug',
  'context-align-grid-auto',
  'context-align-grid-2',
  'context-align-grid-3',
  'context-align-grid-4',
  'context-align-grid-5',
  'context-history-add-to-canvas',
  'context-history-fullscreen',
  'context-history-reveal',
  'context-history-delete',
  'context-material-load-item',
  'context-material-rename-item',
  'context-material-folder-toggle',
  'context-material-folder-rename',
  'context-material-folder-delete',
  'context-material-favorite',
  'context-material-unfavorite',
  'context-material-rename',
  'context-material-open-move-menu',
  'context-material-duplicate',
  'context-material-download',
  'context-material-delete',
  'context-material-cancel-delete',
  'context-material-confirm-delete',
  'context-media-clip-export-to-canvas',
  'context-media-clip-enable-audio',
  'context-media-clip-disable-audio',
  'context-media-clip-delete',
  'context-project-rename',
  'context-project-delete',
  'context-canvas-tab-save-as',
  'context-canvas-tab-collect-project',
  'context-canvas-tab-delete',
  'context-workspace-open-project',
  'context-workspace-rename-project',
  'context-workspace-duplicate-project',
  'context-workspace-collect-project',
  'context-workspace-archive-project',
  'context-workspace-unarchive-project',
  'context-workspace-delete-project',
  'context-story-switch-version',
  'context-story-delete-version',
  'context-story-select-clip',
  'context-story-delete-clip',
  'context-story-view-asset',
  'context-story-delete-asset',
  'context-person-switch-result',
  'context-person-delete-result',
  'context-audio-voice-toggle-imitate-tone',
  'context-audio-voice-open-model-menu',
  'context-audio-voice-use-global-model',
  'context-audio-voice-use-generated',
  'context-audio-voice-use-source',
  'context-audio-voice-download-source',
  'context-audio-voice-download-generated',
  'context-audio-voice-add-source-to-canvas',
  'context-audio-voice-add-generated-to-canvas',
  'context-audio-voice-delete',
  'context-runninghub-load-app',
  'context-runninghub-delete-app',
  'context-runninghub-rename-param',
  'context-runninghub-edit-description',
  'context-runninghub-choose-control',
  'context-runninghub-remove-param',
  'context-runninghub-remove-input',
  'context-task-cancel',
  'context-task-reveal',
  'context-task-copy-error',
  'context-workflow-details',
  'context-workflow-load',
  'context-workflow-rename',
  'context-workflow-edit-meta',
  'context-workflow-update-content',
  'context-workflow-delete',
  'context-node-manager-rename',
  'context-node-manager-download',
  'context-node-manager-delete',
  'context-agent-open-image',
  'context-agent-open-history',
  'context-agent-delete-history',
  'context-web-image-add-to-canvas',
  'context-web-image-reverse-create',
  'context-web-image-reverse-generate',
  'context-web-copy-text',
  'context-web-open-text-node-menu',
  'context-web-text-to-source',
  'context-web-text-to-generated',
  'context-web-open-image-node-menu',
  'context-web-text-to-image-create',
  'context-web-text-to-image-generate',
  'context-web-open-video-node-menu',
  'context-web-text-to-video-create',
  'context-web-text-to-video-generate',
];

const GROUP_COUNTS = {
  '右键菜单·画布': 36,
  '右键菜单·素材与文件': 22,
  '右键菜单·项目与工作区': 20,
  '右键菜单·功能面板': 32,
  '右键菜单·网页预览': 13,
};

test('catalog keeps the shipped id order and count', () => {
  assert.deepEqual(Object.keys(CONTEXT_MENU_SHORTCUTS), EXPECTED_CATALOG_IDS);
  assert.equal(EXPECTED_CATALOG_IDS.length, 123);
});

test('catalog and its id index are frozen', () => {
  assert.equal(Object.isFrozen(CONTEXT_MENU_SHORTCUTS), true);
  assert.equal(Object.isFrozen(CONTEXT_MENU_SHORTCUT_IDS), true);
  assert.deepEqual([...CONTEXT_MENU_SHORTCUT_IDS], EXPECTED_CATALOG_IDS);
});

test('every entry is a frozen context-menu-only shortcut with an empty frozen key list', () => {
  for (const id of EXPECTED_CATALOG_IDS) {
    const shortcut = CONTEXT_MENU_SHORTCUTS[id];
    assert.equal(typeof shortcut.label, 'string', id);
    assert.notEqual(shortcut.label.length, 0, id);
    assert.equal(typeof shortcut.group, 'string', id);
    assert.equal(shortcut.contextMenuOnly, true, id);
    assert.equal(Object.isFrozen(shortcut), true, id);
    assert.equal(Array.isArray(shortcut.keys), true, id);
    assert.equal(Object.isFrozen(shortcut.keys), true, id);
    assert.deepEqual(shortcut.keys, [], id);
  }
});

test('entries stay grouped exactly as shipped', () => {
  const counts = {};
  for (const id of EXPECTED_CATALOG_IDS) {
    const { group } = CONTEXT_MENU_SHORTCUTS[id];
    counts[group] = (counts[group] || 0) + 1;
  }
  assert.deepEqual(counts, GROUP_COUNTS);
  assert.equal(Object.keys(counts).length, 5);
});

test('every entry carries its own frozen keys array instance', () => {
  const seen = new Set();
  for (const id of EXPECTED_CATALOG_IDS) {
    const { keys } = CONTEXT_MENU_SHORTCUTS[id];
    assert.equal(seen.has(keys), false, id);
    seen.add(keys);
  }
  assert.equal(seen.size, EXPECTED_CATALOG_IDS.length);
});

test('workflow entries follow SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED', () => {
  const workflowIds = EXPECTED_CATALOG_IDS.filter((id) => id.startsWith('context-workflow-'));
  assert.equal(workflowIds.length, 6);
  for (const id of EXPECTED_CATALOG_IDS) {
    const shortcut = CONTEXT_MENU_SHORTCUTS[id];
    const isWorkflow = id.startsWith('context-workflow-');
    assert.equal('hidden' in shortcut, isWorkflow, id);
    assert.equal('disabled' in shortcut, isWorkflow, id);
    if (!isWorkflow) continue;
    assert.equal(shortcut.hidden, !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED, id);
    assert.equal(shortcut.disabled, !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED, id);
    assert.equal(shortcut.group, '右键菜单·功能面板', id);
  }
  assert.equal(SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED, false);
});

test('labels keep the shipped text, including the escaped-space entries', () => {
  assert.equal(CONTEXT_MENU_SHORTCUTS['context-canvas-create-grid-4'].label, '画布：创建 4 宫格');
  assert.equal(CONTEXT_MENU_SHORTCUTS['context-canvas-create-grid-9'].label, '画布：创建 9 宫格');
  assert.equal(CONTEXT_MENU_SHORTCUTS['context-align-grid-5'].label, '对齐：每行 5 个');
  assert.equal(
    CONTEXT_MENU_SHORTCUTS['context-runninghub-edit-description'].label,
    '自定义 AI 应用：编辑说明',
  );
  assert.equal(CONTEXT_MENU_SHORTCUTS['context-runninghub-remove-param'].label, '自定义 AI 应用：移除参数');
  assert.equal(CONTEXT_MENU_SHORTCUTS['context-web-text-to-video-generate'].label, '网页预览：文本生成视频');
});

test('isContextMenuShortcut only matches own catalog ids', () => {
  for (const id of EXPECTED_CATALOG_IDS) assert.equal(isContextMenuShortcut(id), true, id);
  assert.equal(isContextMenuShortcut('context-canvas-open-add-node'), false);
  assert.equal(isContextMenuShortcut(''), false);
  assert.equal(isContextMenuShortcut(null), false);
  assert.equal(isContextMenuShortcut(undefined), false);
  assert.equal(isContextMenuShortcut(0), false);
  assert.equal(isContextMenuShortcut(false), false);
  assert.equal(isContextMenuShortcut('toString'), false);
  assert.equal(isContextMenuShortcut('constructor'), false);
  assert.equal(isContextMenuShortcut('hasOwnProperty'), false);
});
