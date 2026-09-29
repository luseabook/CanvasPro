import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVideoKeyingProjection, measureVideoKeyingProjection } from './videoKeyingProjection.js';

const rect = (left, top, width, height) => ({ left, top, width, height });

const containVideo = {
  rect: rect(0, 0, 400, 300),
  elementWidth: 400,
  elementHeight: 300,
  mediaWidth: 800,
  mediaHeight: 800,
};
const uniformVideo = {
  rect: rect(0, 0, 400, 300),
  elementWidth: 400,
  elementHeight: 300,
  mediaWidth: 800,
  mediaHeight: 600,
};

test('returns null without a complete video box', () => {
  assert.equal(createVideoKeyingProjection(), null);
  assert.equal(createVideoKeyingProjection({}), null);
  assert.equal(createVideoKeyingProjection({ video: { ...uniformVideo, mediaWidth: 0 } }), null);
  assert.equal(createVideoKeyingProjection({ video: { ...uniformVideo, elementHeight: 0 } }), null);
  assert.equal(
    createVideoKeyingProjection({ video: { ...uniformVideo, rect: rect(NaN, 0, 400, 300) } }),
    null,
  );
});

test('computes the contain fit geometry', () => {
  const { video } = createVideoKeyingProjection({ video: uniformVideo });
  assert.equal(video.fit, 'contain');
  assert.equal(video.scale, 0.5);
  assert.equal(video.dw, 400);
  assert.equal(video.dh, 300);
  assert.equal(video.ox, 0);
  assert.equal(video.oy, 0);
  assert.equal(video.sx, 1);
  assert.equal(video.sy, 1);
  assert.equal(video.vw, 800);
  assert.equal(video.vh, 600);
  assert.equal(Object.isFrozen(video), true);
});

test('exposes a frozen projection wrapper around the video geometry', () => {
  const projection = createVideoKeyingProjection({ video: uniformVideo });
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(typeof projection.pickClientPoint, 'function');
  assert.equal(typeof projection.normalizedToLayerPoint, 'function');
  assert.equal(typeof projection.getVideoRectInLayer, 'function');
});

test('defaults to contain for any non-cover object fit', () => {
  for (const objectFit of [undefined, 'fill', 'scale-down', 'CONTAIN']) {
    assert.equal(createVideoKeyingProjection({ video: { ...uniformVideo, objectFit } }).video.fit, 'contain');
  }
});

test('computes the cover fit geometry with negative overflow offsets', () => {
  const { video } = createVideoKeyingProjection({ video: { ...containVideo, objectFit: 'cover' } });
  assert.equal(video.fit, 'cover');
  assert.equal(video.scale, 0.5);
  assert.equal(video.dw, 400);
  assert.equal(video.dh, 400);
  assert.equal(video.ox, 0);
  assert.equal(video.oy, -50);
});

test('contain letter-boxing shrinks the effective view rect', () => {
  const { video } = createVideoKeyingProjection({ video: containVideo });
  assert.equal(video.scale, 0.375);
  assert.equal(video.ox, 50);
  assert.equal(video.oy, 0);
  assert.equal(video.dw, 300);
  assert.equal(video.dh, 300);
});

test('pickClientPoint maps an in-range client point to normalized coordinates', () => {
  const projection = createVideoKeyingProjection({ video: containVideo });
  assert.deepEqual(projection.pickClientPoint(200, 150), {
    nx: 0.5,
    ny: 0.5,
    videoProjection: projection.video,
  });
  assert.equal(projection.pickClientPoint(50, 0).nx, 0);
  assert.equal(projection.pickClientPoint(350, 300).nx, 1);
});

test('pickClientPoint rejects points outside the contain view rect', () => {
  const projection = createVideoKeyingProjection({ video: containVideo });
  assert.equal(projection.pickClientPoint(10, 150), null);
  assert.equal(projection.pickClientPoint(351, 150), null);
  assert.equal(projection.pickClientPoint(200, -1), null);
  assert.equal(projection.pickClientPoint(200, 301), null);
});

test('pickClientPoint allows overflow and clamps under cover', () => {
  const projection = createVideoKeyingProjection({ video: { ...containVideo, objectFit: 'cover' } });
  assert.deepEqual(projection.pickClientPoint(200, 0), {
    nx: 0.5,
    ny: 0.125,
    videoProjection: projection.video,
  });
  const clamped = projection.pickClientPoint(1000, 1000);
  assert.equal(clamped.nx, 1);
  assert.equal(clamped.ny, 1);
});

test('pickClientPoint returns null for non-numeric client coordinates', () => {
  const projection = createVideoKeyingProjection({ video: containVideo });
  assert.equal(projection.pickClientPoint('left', 0), null);
});

test('layer projection is null unless a usable layer box is supplied', () => {
  const withoutLayer = createVideoKeyingProjection({ video: containVideo });
  assert.equal(withoutLayer.layer, null);
  assert.equal(withoutLayer.normalizedToLayerPoint(0.5, 0.5), null);
  assert.equal(withoutLayer.getVideoRectInLayer(), null);
  const zeroLayer = createVideoKeyingProjection({
    video: containVideo,
    layer: { rect: rect(0, 0, 0, 0), width: 0, height: 0 },
  });
  assert.equal(zeroLayer.layer, null);
});

test('normalizedToLayerPoint converts through the client rect into layer space', () => {
  const projection = createVideoKeyingProjection({
    video: containVideo,
    layer: { rect: rect(0, 0, 200, 200), width: 200, height: 200 },
  });
  assert.deepEqual(projection.normalizedToLayerPoint(0.5, 0.5), { x: 200, y: 150 });
  assert.deepEqual(projection.normalizedToLayerPoint(2, -1), { x: 350, y: 0 });
});

test('getVideoRectInLayer returns the video rect in layer space with a one-pixel floor', () => {
  const projection = createVideoKeyingProjection({
    video: containVideo,
    layer: { rect: rect(0, 0, 200, 200), width: 200, height: 200 },
  });
  assert.deepEqual(projection.getVideoRectInLayer(), { x: 50, y: 0, width: 300, height: 300 });
});

test('getVideoRectInLayer floors a sub-pixel video rect to one pixel', () => {
  const projection = createVideoKeyingProjection({
    video: {
      rect: rect(0, 0, 0.5, 0.5),
      elementWidth: 10,
      elementHeight: 10,
      mediaWidth: 10,
      mediaHeight: 10,
    },
    layer: { rect: rect(0, 0, 1000, 1000), width: 1000, height: 1000 },
  });
  assert.deepEqual(projection.getVideoRectInLayer(), { x: 0, y: 0, width: 1, height: 1 });
});

test('normalizes client coordinates against media width for non-square media', () => {
  const projection = createVideoKeyingProjection({ video: uniformVideo });
  assert.deepEqual(projection.pickClientPoint(200, 150), {
    nx: 0.5,
    ny: 0.5,
    videoProjection: projection.video,
  });
  assert.equal(projection.pickClientPoint(100, 0).nx, 0.25);
});

test('measureVideoKeyingProjection reads live geometry from elements', () => {
  const videoElement = {
    getBoundingClientRect: () => rect(0, 0, 400, 300),
    offsetWidth: 400,
    offsetHeight: 300,
    videoWidth: 800,
    videoHeight: 600,
  };
  const measured = measureVideoKeyingProjection({ videoElement });
  assert.equal(measured.video.fit, 'contain');
  assert.equal(measured.video.scale, 0.5);
  assert.equal(measured.layer, null);
});

test('measureVideoKeyingProjection returns null without a measureable video', () => {
  assert.equal(measureVideoKeyingProjection(), null);
  assert.equal(measureVideoKeyingProjection({ videoElement: {} }), null);
});

test('measureVideoKeyingProjection accepts a layer element and falls back to client size', () => {
  const videoElement = {
    getBoundingClientRect: () => rect(0, 0, 400, 300),
    offsetWidth: 400,
    offsetHeight: 300,
    videoWidth: 800,
    videoHeight: 600,
  };
  const layerElement = {
    getBoundingClientRect: () => rect(10, 20, 200, 100),
    offsetWidth: 0,
    clientWidth: 200,
    offsetHeight: 0,
    clientHeight: 100,
  };
  const measured = measureVideoKeyingProjection({ videoElement, layerElement });
  assert.equal(measured.video.eh, 300);
  assert.equal(measured.layer.lw, 200);
  assert.equal(measured.layer.lh, 100);
  assert.equal(measured.layer.sx, 1);
  assert.equal(measured.layer.sy, 1);
});

test('measureVideoKeyingProjection rejects a video element without a layout box', () => {
  const videoElement = {
    getBoundingClientRect: () => rect(0, 0, 400, 300),
    offsetWidth: 400,
    offsetHeight: 0,
    videoWidth: 800,
    videoHeight: 600,
  };
  assert.equal(measureVideoKeyingProjection({ videoElement }), null);
});

test('measureVideoKeyingProjection reads object-fit from computed style', () => {
  const videoElement = {
    getBoundingClientRect: () => rect(0, 0, 400, 300),
    offsetWidth: 400,
    offsetHeight: 300,
    videoWidth: 800,
    videoHeight: 800,
    ownerDocument: { defaultView: { getComputedStyle: () => ({ objectFit: 'cover' }) } },
  };
  assert.equal(measureVideoKeyingProjection({ videoElement }).video.fit, 'cover');
});
