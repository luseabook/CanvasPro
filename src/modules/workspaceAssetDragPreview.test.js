import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP,
  resolveWorkspaceAssetDragPreview,
  applyWorkspaceAssetNativeDragPreview,
} from './workspaceAssetDragPreview.js';

function image({ props = {}, attrs = {} } = {}) {
  return {
    tagName: 'IMG',
    ...props,
    getAttribute(name) {
      return name in attrs ? attrs[name] : null;
    },
  };
}

function rootOf({ img = null, video = null } = {}) {
  return {
    querySelector(selector) {
      if (selector === 'img') return img;
      if (selector === 'video') return video;
      return null;
    },
  };
}

test('exposes the pointer gap constant', () => {
  assert.equal(WORKSPACE_ASSET_DRAG_PREVIEW_POINTER_GAP, 24);
});

test('prefers the image resolved through a live url', () => {
  const element = image({
    props: { currentSrc: 'live.jpg', poster: 'poster.jpg' },
    attrs: { src: 'attr.jpg' },
  });
  assert.deepEqual(resolveWorkspaceAssetDragPreview(rootOf({ img: element })), {
    element,
    url: 'live.jpg',
    mediaType: 'image',
  });
});

test('falls back to the src attribute when the properties are empty', () => {
  const element = image({ props: { currentSrc: '  ', src: '' }, attrs: { src: 'attr.jpg' } });
  assert.deepEqual(resolveWorkspaceAssetDragPreview(rootOf({ img: element })), {
    element,
    url: 'attr.jpg',
    mediaType: 'image',
  });
});

test('uses the poster property of an image as the last url candidate', () => {
  const element = image({ props: { poster: 'poster.jpg' } });
  assert.deepEqual(resolveWorkspaceAssetDragPreview(rootOf({ img: element })), {
    element,
    url: 'poster.jpg',
    mediaType: 'image',
  });
  const root = rootOf({ img: element, video: { tagName: 'VIDEO', poster: 'v.jpg' } });
  assert.equal(resolveWorkspaceAssetDragPreview(root).mediaType, 'image');
});

test('falls through to the video when the image has no url', () => {
  const video = { tagName: 'VIDEO', poster: 'poster.jpg' };
  assert.deepEqual(resolveWorkspaceAssetDragPreview(rootOf({ img: image(), video })), {
    element: video,
    url: 'poster.jpg',
    mediaType: 'video',
  });
});

test('reads the video poster from the attribute as a last resort', () => {
  const video = {
    tagName: 'VIDEO',
    poster: '',
    getAttribute: (name) => (name === 'poster' ? ' attr.jpg ' : null),
  };
  assert.deepEqual(resolveWorkspaceAssetDragPreview(rootOf({ video })), {
    element: video,
    url: 'attr.jpg',
    mediaType: 'video',
  });
});

test('degrades to an empty descriptor when nothing matches', () => {
  const root = rootOf();
  assert.deepEqual(resolveWorkspaceAssetDragPreview(root), { element: root, url: '', mediaType: '' });
  assert.deepEqual(resolveWorkspaceAssetDragPreview(null), { element: null, url: '', mediaType: '' });
});

test('ignores a root that cannot be queried', () => {
  assert.deepEqual(resolveWorkspaceAssetDragPreview({}), { element: {}, url: '', mediaType: '' });
});

test('applies the resolved element as the native drag image', () => {
  const calls = [];
  const image_ = image({ props: { src: 'a.jpg' } });
  const ok = applyWorkspaceAssetNativeDragPreview(
    { setDragImage: (...args) => calls.push(args) },
    rootOf({ img: image_ }),
  );
  assert.equal(ok, true);
  assert.deepEqual(calls, [[image_, -24, -24]]);
});

test('honours a custom pointer gap', () => {
  const calls = [];
  const image_ = image({ props: { src: 'a.jpg' } });
  applyWorkspaceAssetNativeDragPreview(
    { setDragImage: (...args) => calls.push(args) },
    rootOf({ img: image_ }),
    { pointerGap: 8 },
  );
  assert.deepEqual(calls, [[image_, -8, -8]]);
});

test('clamps a nullish gap to zero', () => {
  const calls = [];
  const image_ = image({ props: { src: 'a.jpg' } });
  for (const gap of [-5, 0, 'x', null, NaN]) {
    applyWorkspaceAssetNativeDragPreview(
      { setDragImage: (...args) => calls.push(args) },
      rootOf({ img: image_ }),
      { pointerGap: gap },
    );
  }
  assert.equal(calls.length, 5);
  for (const [, dx, dy] of calls) {
    assert.ok(dx === 0 && dy === 0);
  }
});

test('returns false when the data transfer cannot take an image', () => {
  const image_ = image({ props: { src: 'a.jpg' } });
  assert.equal(applyWorkspaceAssetNativeDragPreview({}, rootOf({ img: image_ })), false);
  assert.equal(applyWorkspaceAssetNativeDragPreview(null, rootOf({ img: image_ })), false);
});

test('returns false when no element can be resolved', () => {
  const calls = [];
  const ok = applyWorkspaceAssetNativeDragPreview({ setDragImage: (...args) => calls.push(args) }, null);
  assert.equal(ok, false);
  assert.deepEqual(calls, []);
});

test('uses the root itself when neither image nor video is present', () => {
  const calls = [];
  const root = rootOf();
  assert.equal(
    applyWorkspaceAssetNativeDragPreview({ setDragImage: (...args) => calls.push(args) }, root),
    true,
  );
  assert.deepEqual(calls, [[root, -24, -24]]);
});

test('returns false when the drag image call throws', () => {
  const image_ = image({ props: { src: 'a.jpg' } });
  const transfer = {
    setDragImage() {
      throw new Error('nope');
    },
  };
  assert.equal(applyWorkspaceAssetNativeDragPreview(transfer, rootOf({ img: image_ })), false);
});
