import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_MARQUEE_DRAG_THRESHOLD,
  createStoryAssetMarqueeConfig,
  createStoryMarqueeRect,
  createStoryMarqueeSelectionController,
  doesStoryMarqueeIntersect,
  hasStoryMarqueeDrag,
  resolveStoryMarqueeSelection,
} from './storyMarqueeSelection.js';
import {
  WORKSPACE_MARQUEE_DRAG_THRESHOLD,
  createWorkspaceMarqueeRect,
  createWorkspaceMarqueeSelectionController,
  doesWorkspaceMarqueeIntersect,
  hasWorkspaceMarqueeDrag,
  resolveWorkspaceMarqueeSelection,
} from '../workspaceMarqueeSelection.js';

function visibleAssets() {
  return [
    { id: 'a1', mediaKind: 'image', sourceUrl: 'u1' },
    { id: 'a2', mediaKind: 'Audio', sourceUrl: '  u2  ' },
    { id: 'a3', mediaKind: 'video', sourceUrl: 'u3' },
    { id: 'a4', mediaKind: 'image', sourceUrl: '' },
  ];
}

test('storyMarqueeSelection: 几何与去重原语是 workspace 版的原样别名', () => {
  assert.equal(STORY_MARQUEE_DRAG_THRESHOLD, WORKSPACE_MARQUEE_DRAG_THRESHOLD);
  assert.equal(STORY_MARQUEE_DRAG_THRESHOLD, 5);
  assert.equal(hasStoryMarqueeDrag, hasWorkspaceMarqueeDrag);
  assert.equal(createStoryMarqueeRect, createWorkspaceMarqueeRect);
  assert.equal(doesStoryMarqueeIntersect, doesWorkspaceMarqueeIntersect);
  assert.equal(resolveStoryMarqueeSelection, resolveWorkspaceMarqueeSelection);

  assert.equal(hasStoryMarqueeDrag({ startX: 0, startY: 0 }, 5, 5), true);
  assert.equal(hasStoryMarqueeDrag({ startX: 0, startY: 0 }, 3, 3), false);
  assert.deepEqual(createStoryMarqueeRect({ startX: 10, startY: 20 }, 30, 50), {
    left: 0,
    top: 0,
    right: 50,
    bottom: 30,
    width: 50,
    height: 30,
  });
  assert.equal(
    doesStoryMarqueeIntersect({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 5, top: 5, right: 15, bottom: 15 }),
    true,
  );
});

test('storyMarqueeSelection: 选区合并会去空白去重，additive 才带上已有选择', () => {
  assert.deepEqual(resolveStoryMarqueeSelection(['a', ' a ', 'b']), ['a', 'b']);
  assert.deepEqual(resolveStoryMarqueeSelection(['a'], ['b']), ['a'], '非 additive 忽略已有选择');
  assert.deepEqual(resolveStoryMarqueeSelection(['a'], ['b', 'b', ''], { additive: true }), ['b', 'a']);
  assert.deepEqual(resolveStoryMarqueeSelection(undefined, undefined), []);
});

test('storyMarqueeSelection: 配置只在项目视图第 2 步启用', () => {
  const state = { view: 'project', step: 2, selectedAssetIds: ['keep'] };
  const config = createStoryAssetMarqueeConfig(state, {
    getVisibleAssets: () => [],
    beforeCommit: () => {},
    render: () => {},
  });
  assert.equal(config.enabled, true);
  assert.deepEqual(config.selectedIds, ['keep']);

  assert.equal(
    createStoryAssetMarqueeConfig({ ...state, view: 'library', step: 2 }, {
      getVisibleAssets: () => [],
      beforeCommit: () => {},
      render: () => {},
    }).enabled,
    false,
  );
  assert.equal(
    createStoryAssetMarqueeConfig({ ...state, step: 1 }, { getVisibleAssets: () => [], beforeCommit: () => {}, render: () => {} })
      .enabled,
    false,
  );
});

test('storyMarqueeSelection: commit 会按可见素材收敛选择并推进选中态', () => {
  const state = {
    view: 'project',
    step: 2,
    assetFilter: 'all',
    selectedAssetIds: ['old1'],
    assetSelectionMode: false,
    selectedAssetId: 'old1',
  };
  const calls = { before: 0, render: 0 };
  const config = createStoryAssetMarqueeConfig(state, {
    getVisibleAssets: () => visibleAssets(),
    beforeCommit: () => {
      calls.before += 1;
    },
    render: () => {
      calls.render += 1;
    },
  });

  config.commit(['a1', 'a2', 'a3', 'a4', 'ghost']);
  assert.equal(calls.before, 1);
  assert.equal(calls.render, 1);
  assert.deepEqual(state.selectedAssetIds, ['a1', 'a2', 'a3', 'a4'], '全部视图不过滤媒体类型');
  assert.equal(state.assetSelectionMode, true);
  assert.equal(state.selectedAssetId, 'a4', '取最后一个');
});

test('storyMarqueeSelection: 素材库视图只留带地址的图片与音频', () => {
  const state = {
    view: 'project',
    step: 2,
    assetFilter: 'library',
    selectedAssetIds: [],
    assetSelectionMode: false,
    selectedAssetId: 'keep-me',
  };
  const config = createStoryAssetMarqueeConfig(state, {
    getVisibleAssets: () => visibleAssets(),
    beforeCommit: () => {},
    render: () => {},
  });

  config.commit(['a1', 'a2', 'a3', 'a4']);
  assert.deepEqual(state.selectedAssetIds, ['a1', 'a2'], '视频和无地址的图片被滤掉');
  assert.equal(state.selectedAssetId, 'a2');

  config.commit([]);
  assert.equal(state.assetSelectionMode, false);
  assert.equal(state.selectedAssetId, 'a2', '清空选择时保留上一次的单选');
});

test('storyMarqueeSelection: 控制器沿用 story 的默认选择器，但依赖依旧必填', () => {
  assert.throws(() => createStoryMarqueeSelectionController({}), {
    message: 'workspace marquee selection controller dependencies are incomplete',
  });
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        root: {},
        documentObject: {},
        windowObject: {},
        getConfig: () => ({ enabled: false }),
        surfaceSelector: '[data-x]',
      }),
    { message: 'workspace marquee selection itemSelector and getItemId are required' },
  );
  assert.throws(
    () =>
      createWorkspaceMarqueeSelectionController({
        root: {},
        documentObject: {},
        windowObject: {},
        getConfig: () => ({ enabled: false }),
      }),
    { message: 'workspace marquee selection surfaceSelector is required' },
  );

  const made = [];
  const root = {
    querySelectorAll: () => [],
    querySelector: () => null,
    classList: { add() {}, remove() {} },
    appendChild(node) {
      made.push(node);
    },
  };
  const documentObject = {
    createElement: (tag) => ({
      tagName: tag,
      style: { setProperty() {}, removeProperty() {} },
      classList: { add() {}, remove() {} },
      dataset: {},
      appendChild() {},
      remove() {},
      addEventListener() {},
      setAttribute() {},
    }),
    addEventListener() {},
    removeEventListener() {},
    documentElement: root,
    body: root,
  };
  const windowObject = { addEventListener() {}, removeEventListener() {}, innerWidth: 1000, innerHeight: 800 };
  const controller = createStoryMarqueeSelectionController({
    root,
    documentObject,
    windowObject,
    getConfig: () => ({ enabled: false, selectedIds: [], commit() {} }),
  });
  assert.deepEqual(Object.keys(controller).sort(), ['begin', 'cancel', 'consumeClick', 'destroy', 'finish', 'update']);
  controller.destroy();
});
