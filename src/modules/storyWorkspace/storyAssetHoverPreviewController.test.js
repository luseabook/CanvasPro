import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryAssetHoverPreviewController } from './storyAssetHoverPreviewController.js';

function fakeClassList(...initial) {
  const names = new Set(initial);
  return {
    names,
    add: (...values) => values.forEach((value) => names.add(value)),
    remove: (...values) => values.forEach((value) => names.delete(value)),
    contains: (value) => names.has(value),
    toggle: (value, force) => {
      const on = force === undefined ? !names.has(value) : Boolean(force);
      if (on) names.add(value);
      else names.delete(value);
      return on;
    },
  };
}

function fakePreview({ width = 200, height = 100 } = {}) {
  const preview = {
    size: { width, height },
    images: [],
    classList: fakeClassList(),
    dataset: {},
    attributes: {},
    innerHTML: '',
    style: {
      properties: {},
      setProperty(name, value) {
        this.properties[name] = value;
      },
    },
    setAttribute(name, value) {
      preview.attributes[name] = String(value);
    },
    getBoundingClientRect: () => ({ ...preview.size }),
    querySelectorAll(selector) {
      assert.equal(selector, '[data-story-asset-hover-image]');
      return preview.images;
    },
  };
  return preview;
}

function fakeImage({ complete = true, naturalWidth = 400, naturalHeight = 200 } = {}) {
  const item = { classList: fakeClassList() };
  const cell = { classList: fakeClassList() };
  const image = {
    complete,
    naturalWidth,
    naturalHeight,
    item,
    cell,
    listeners: [],
    closest(selector) {
      if (selector === '.story-asset-hover-preview-item') return item;
      if (selector === '.story-asset-hover-preview-cell') return cell;
      return null;
    },
    addEventListener(type, listener, options) {
      image.listeners.push({ type, listener, options });
    },
  };
  return image;
}

function fakeWindow({ animationFrames = true, innerWidth = 1000, innerHeight = 800 } = {}) {
  let nextFrame = 1;
  const win = { innerWidth, innerHeight, frames: new Map(), cancelled: [] };
  if (animationFrames) {
    win.requestAnimationFrame = (callback) => {
      const id = nextFrame++;
      win.frames.set(id, callback);
      return id;
    };
    win.cancelAnimationFrame = (id) => {
      win.cancelled.push(id);
      win.frames.delete(id);
    };
    win.runFrames = () => {
      for (const [id, callback] of [...win.frames]) {
        win.frames.delete(id);
        callback();
      }
    };
  }
  return win;
}

const ASSET = {
  id: 7,
  baseAppearanceId: 'base',
  appearances: [
    { id: 'look-1', imageUrl: ' a.png ' },
    { id: 'look-2', imageUrl: 'b.png' },
  ],
};

function harness({ windowOptions, previewOptions, content } = {}) {
  const preview = fakePreview(previewOptions);
  const win = fakeWindow(windowOptions);
  const calls = { build: [], selected: [] };
  const controller = createStoryAssetHoverPreviewController({
    previewElement: preview,
    getState: () => ({ selectedAssetId: 'selected-asset' }),
    getSelectedAppearance: (state, asset) => (
      calls.selected.push([state, asset]),
      asset.appearances?.[1] || null
    ),
    buildContent: (asset, options) => {
      calls.build.push(options);
      if (content === null) return null;
      return {
        html: `<div>${asset.id}:${options.appearanceId}</div>`,
        columns: 2,
        hasVoice: false,
        appearances: asset.appearances || [],
        ...content,
      };
    },
    isStoryAssetHoverLandscape: (width, height) => width > height,
    documentObject: { documentElement: { clientWidth: 0, clientHeight: 0 } },
    windowObject: win,
  });
  return { preview, win, calls, controller };
}

test('the controller requires every presentation adapter', () => {
  assert.throws(() => createStoryAssetHoverPreviewController(), {
    message: 'story asset hover preview requires presentation adapters',
  });
  assert.throws(
    () =>
      createStoryAssetHoverPreviewController({
        getState: () => ({}),
        getSelectedAppearance: () => null,
        buildContent: () => null,
      }),
    { message: 'story asset hover preview requires presentation adapters' },
  );
});

test('showing renders the asset and positions the preview on the next frame', () => {
  const { preview, win, calls, controller } = harness();
  assert.equal(Object.isFrozen(controller), true);
  assert.equal(controller.show(null, { clientX: 100, clientY: 50 }, ASSET, ' look-1 '), true);
  assert.deepEqual(calls.build, [
    { appearanceId: ' look-1 ', selectedAssetId: 'selected-asset', selectedAppearanceId: 'look-2' },
  ]);
  assert.equal(preview.innerHTML, '<div>7: look-1 </div>');
  assert.equal(preview.dataset.assetId, '7');
  assert.equal(preview.dataset.signature, 'look-1:look-2:base:false:look-1:a.png|look-2:b.png');
  assert.equal(preview.style.properties['--story-asset-hover-columns'], '2');
  assert.equal(preview.classList.contains('is-visible'), true);
  assert.equal(preview.attributes['aria-hidden'], 'false');
  assert.equal(controller.getHoveredAssetId(), '7');
  assert.equal(preview.style.left, undefined);
  win.runFrames();
  assert.deepEqual([preview.style.left, preview.style.top], ['114px', '64px']);
});

test('an unchanged signature skips re-rendering and pointer moves share one frame', () => {
  const { preview, win, controller } = harness();
  controller.show(null, { clientX: 100, clientY: 50 }, ASSET);
  preview.innerHTML = 'kept';
  controller.show(null, { clientX: 300, clientY: 200 }, ASSET);
  assert.equal(preview.innerHTML, 'kept');
  assert.equal(win.frames.size, 1);
  win.runFrames();
  assert.deepEqual([preview.style.left, preview.style.top], ['314px', '214px']);
  controller.show(null, { clientX: 300, clientY: 200 }, ASSET, 'look-1');
  assert.equal(preview.innerHTML, '<div>7:look-1</div>');
});

test('pointer positions are clamped inside the viewport margins', () => {
  const { preview, controller } = harness({ windowOptions: { animationFrames: false } });
  controller.show(null, { clientX: 950, clientY: 780 }, ASSET);
  assert.deepEqual([preview.style.left, preview.style.top], ['790px', '690px']);
  controller.show(null, { clientX: -50 }, { ...ASSET, id: 8 });
  assert.deepEqual([preview.style.left, preview.style.top], ['10px', '14px']);
});

test('without window metrics the preview falls back to a 1024 x 768 viewport', () => {
  const { preview, controller } = harness({
    windowOptions: { animationFrames: false, innerWidth: 0, innerHeight: 0 },
  });
  controller.show(null, { clientX: 2000, clientY: 2000 }, ASSET);
  assert.deepEqual([preview.style.left, preview.style.top], ['814px', '658px']);
});

function menuTarget(bounds) {
  const menu = { getBoundingClientRect: () => bounds };
  return { closest: (selector) => (selector === '.at-mention-menu' ? menu : null) };
}

test('a hovered mention menu anchors the preview beside it', () => {
  const { preview, controller } = harness({ windowOptions: { animationFrames: false } });
  controller.show(
    menuTarget({ left: 100, right: 300, top: 200, bottom: 400 }),
    { clientX: 150, clientY: 250 },
    ASSET,
  );
  assert.deepEqual([preview.style.left, preview.style.top], ['314px', '232px']);
  controller.show(
    menuTarget({ left: 700, right: 900, top: 100, bottom: 300 }),
    { clientX: 800, clientY: 150 },
    ASSET,
  );
  assert.deepEqual([preview.style.left, preview.style.top], ['486px', '132px']);
});

test('a menu spanning the viewport pushes the preview below or above it', () => {
  const { preview, controller } = harness({ windowOptions: { animationFrames: false } });
  const wide = (top, bottom) => menuTarget({ left: 50, right: 980, top, bottom });
  controller.show(wide(100, 300), { clientX: 500, clientY: 150 }, ASSET);
  assert.deepEqual([preview.style.left, preview.style.top], ['400px', '314px']);
  controller.show(wide(650, 790), { clientX: 500, clientY: 700 }, ASSET);
  assert.deepEqual([preview.style.left, preview.style.top], ['400px', '536px']);
  controller.show(wide(50, 750), { clientX: 500, clientY: 300 }, ASSET);
  assert.deepEqual([preview.style.left, preview.style.top], ['400px', '314px']);
});

test('missing content, audio assets and touch pointers hide the preview', () => {
  const empty = harness({ content: null });
  empty.preview.dataset.assetId = 'old';
  assert.equal(empty.controller.show(null, {}, ASSET), false);
  assert.deepEqual(
    [empty.preview.innerHTML, empty.preview.dataset.assetId, empty.preview.dataset.signature],
    ['', '', ''],
  );
  assert.equal(empty.preview.attributes['aria-hidden'], 'true');
  assert.equal(empty.controller.getHoveredAssetId(), '');
  const { preview, controller, calls } = harness();
  controller.show(null, {}, ASSET);
  assert.equal(controller.show(null, {}, { id: 9, mediaKind: 'audio' }), false);
  assert.equal(preview.classList.contains('is-visible'), false);
  controller.show(null, {}, ASSET);
  assert.equal(controller.show(null, {}, null), false);
  assert.equal(preview.classList.contains('is-visible'), false);
  const buildsBeforeTouch = calls.build.length;
  assert.equal(controller.show(null, { pointerType: 'touch' }, ASSET), false);
  assert.equal(calls.build.length, buildsBeforeTouch);
});

test('hide clears the hovered asset and destroy cancels the pending frame', () => {
  const { preview, win, controller } = harness();
  controller.show(null, { clientX: 10, clientY: 10 }, ASSET);
  controller.hide();
  assert.equal(controller.getHoveredAssetId(), '');
  assert.equal(preview.classList.contains('is-visible'), false);
  controller.show(null, { clientX: 10, clientY: 10 }, ASSET);
  controller.destroy();
  controller.destroy();
  assert.deepEqual(win.cancelled, [1]);
  assert.equal(controller.show(null, {}, ASSET), false);
  assert.equal(preview.classList.contains('is-visible'), false);
});

test('loaded images toggle the landscape class on their item and cell', () => {
  const { preview, controller } = harness({ windowOptions: { animationFrames: false } });
  const wide = fakeImage({ naturalWidth: 400, naturalHeight: 200 });
  const pending = fakeImage({ complete: false, naturalWidth: 0, naturalHeight: 0 });
  preview.images = [wide, pending];
  controller.show(null, { clientX: 100, clientY: 50 }, ASSET);
  assert.equal(wide.item.classList.contains('is-landscape'), true);
  assert.equal(wide.cell.classList.contains('is-landscape'), true);
  assert.equal(pending.listeners.length, 1);
  assert.deepEqual([pending.listeners[0].type, pending.listeners[0].options], ['load', { once: true }]);
  pending.naturalWidth = 300;
  pending.naturalHeight = 600;
  preview.size = { width: 200, height: 400 };
  pending.listeners[0].listener();
  assert.equal(pending.item.classList.contains('is-landscape'), false);
  assert.equal(pending.cell.classList.contains('is-landscape'), false);
  assert.equal(preview.style.top, '64px');
  preview.size = { width: 200, height: 780 };
  pending.listeners[0].listener();
  assert.equal(preview.style.top, '10px');
});
