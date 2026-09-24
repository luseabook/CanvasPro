import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NODE_TOOLBAR_MORE_ICON_SVG,
  NODE_ANNOTATE_ICON_SVG,
  ADVANCED_SETTINGS_TUNE_ICON_MARKUP,
  GIF_ICON_SVG,
  MATERIAL_TREE_CHEVRON_ICON_SVG,
  MATERIAL_FOLDER_ICON_MARKUP,
  PANEL_COLLAPSE_LEFT_ICON_SVG,
} from './sharedIconMarkup.js';

const ALL = {
  NODE_TOOLBAR_MORE_ICON_SVG,
  NODE_ANNOTATE_ICON_SVG,
  ADVANCED_SETTINGS_TUNE_ICON_MARKUP,
  GIF_ICON_SVG,
  MATERIAL_TREE_CHEVRON_ICON_SVG,
  MATERIAL_FOLDER_ICON_MARKUP,
  PANEL_COLLAPSE_LEFT_ICON_SVG,
};

test('sharedIconMarkup: 七个图标常量均为非空字符串', () => {
  (assert.deepEqual(Object.keys(ALL).length, 7),
    Object.entries(ALL).forEach(([name, markup]) => {
      (assert.equal(typeof markup, 'string'), assert.ok(markup.trim().length > 0, name));
    }));
});

test('sharedIconMarkup: 更多菜单图标为三点圆', () => {
  (assert.ok(NODE_TOOLBAR_MORE_ICON_SVG.startsWith('<svg ')),
    assert.equal((NODE_TOOLBAR_MORE_ICON_SVG.match(/<circle /g) || []).length, 3),
    assert.ok(NODE_TOOLBAR_MORE_ICON_SVG.includes('viewBox="0 0 24 24"')),
    assert.ok(NODE_TOOLBAR_MORE_ICON_SVG.includes('aria-hidden="true"')),
    assert.ok(NODE_TOOLBAR_MORE_ICON_SVG.endsWith('</svg>')));
});

test('sharedIconMarkup: 标注图标使用描边路径', () => {
  (assert.ok(NODE_ANNOTATE_ICON_SVG.includes('stroke="currentColor"')),
    assert.ok(NODE_ANNOTATE_ICON_SVG.includes('<path d="M12 20h9"/>')),
    assert.ok(NODE_ANNOTATE_ICON_SVG.includes('stroke-linecap="round"')));
});

test('sharedIconMarkup: 高级设置图标为空载体 span', () => {
  assert.equal(
    ADVANCED_SETTINGS_TUNE_ICON_MARKUP,
    '<span class="advanced-settings-tune-icon" aria-hidden="true"></span>',
  );
});

test('sharedIconMarkup: GIF 图标带 data-icon 与文本徽标', () => {
  (assert.ok(GIF_ICON_SVG.includes('data-icon="gif"')),
    assert.ok(GIF_ICON_SVG.includes('<rect x="2.5" y="5"')),
    assert.ok(GIF_ICON_SVG.includes('>GIF</text>')),
    assert.ok(GIF_ICON_SVG.includes('stroke="none"')));
});

test('sharedIconMarkup: 素材树折叠箭头为单路径 chevron', () => {
  (assert.ok(MATERIAL_TREE_CHEVRON_ICON_SVG.includes('<path d="m9 6 6 6-6 6"')),
    assert.equal((MATERIAL_TREE_CHEVRON_ICON_SVG.match(/<path /g) || []).length, 1));
});

test('sharedIconMarkup: 文件夹图标同时含闭合与展开两态', () => {
  (assert.ok(MATERIAL_FOLDER_ICON_MARKUP.startsWith('\n  ')),
    assert.ok(MATERIAL_FOLDER_ICON_MARKUP.includes('class="is-closed"')),
    assert.ok(MATERIAL_FOLDER_ICON_MARKUP.includes('class="is-open"')),
    assert.equal((MATERIAL_FOLDER_ICON_MARKUP.match(/<svg /g) || []).length, 2),
    assert.ok(MATERIAL_FOLDER_ICON_MARKUP.endsWith('</svg>\n')));
});

test('sharedIconMarkup: 面板收起图标含竖线与左箭头两段', () => {
  (assert.equal((PANEL_COLLAPSE_LEFT_ICON_SVG.match(/<path /g) || []).length, 2),
    assert.ok(PANEL_COLLAPSE_LEFT_ICON_SVG.includes('M5 5v14')),
    assert.ok(PANEL_COLLAPSE_LEFT_ICON_SVG.includes('M19 12H5M12 19l-7-7 7-7')));
});

test('sharedIconMarkup: 常量集合互不重复', () => {
  const seen = new Set(Object.values(ALL));
  assert.equal(seen.size, 7);
});
