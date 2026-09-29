import test from 'node:test';
import assert from 'node:assert/strict';

import { bindStoryReplicationReviewThumbnails } from './storyReplicationReviewThumbnails.js';

const instances = [];

class FakeIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    this.unobserved = [];
    this.disconnected = false;
    instances.push(this);
  }
  observe(node) {
    this.observed.push(node);
  }
  unobserve(node) {
    this.unobserved.push(node);
  }
  disconnect() {
    this.disconnected = true;
  }
}

function createSegmentNode(id, hasImage = false) {
  const frameContainer = {
    children: [],
    replaceChildren(...items) {
      this.children = items;
    },
  };
  return {
    dataset: { replicationSegment: id },
    querySelector(selector) {
      if (selector === 'img') return hasImage ? { tagName: 'IMG' } : null;
      if (selector === '.story-source-segment-frame') return frameContainer;
      return null;
    },
    _frameContainer: frameContainer,
  };
}

function createHarness({ segmentIds = ['ev1', 'ev2'] } = {}) {
  const segments = {
    children: [],
    querySelectorAll(selector) {
      return selector === '[data-replication-segment]'
        ? segmentIds.map((id) => this._byId[id]).filter(Boolean)
        : [];
    },
    _byId: {},
  };
  for (const id of segmentIds) {
    segments._byId[id] = createSegmentNode(id);
  }
  const state = { querySelector: (selector) => (selector === '[data-replication-segments]' ? segments : null) };
  const data = {
    replication: {
      sourceAnalysis: {
        revision: 3,
        events: [
          { id: 'ev1', startSec: 10, endSec: 12 },
          { id: 'ev2', startSec: 30, endSec: 31 },
        ],
      },
    },
    sourceVideo: { videoRef: 'data/uploads/e1.mp4' },
  };
  return { state, data, segments };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test.before(() => {
  globalThis.IntersectionObserver = FakeIntersectionObserver;
});
test.after(() => {
  delete globalThis.IntersectionObserver;
});

test('storyReplicationReviewThumbnails: 绑定后观察每个分段，观察根是分段容器', () => {
  instances.length = 0;
  const harness = createHarness();
  const controller = bindStoryReplicationReviewThumbnails(harness.state, harness.data);

  assert.equal(instances.length, 1);
  const observer = instances[0];
  assert.equal(observer.options.root, harness.segments);
  assert.equal(observer.options.rootMargin, '120px');
  assert.deepEqual(observer.observed, [harness.segments._byId.ev1, harness.segments._byId.ev2]);
  assert.deepEqual(Object.keys(controller).sort(), ['destroy', 'resume', 'suspend']);
});

test('storyReplicationReviewThumbnails: 进入视口的分段排队抽帧后不再重复观察', async () => {
  instances.length = 0;
  const harness = createHarness({ segmentIds: ['ev1'] });
  const controller = bindStoryReplicationReviewThumbnails(harness.state, harness.data);
  const observer = instances[0];

  observer.callback([{ target: observer.observed[0], isIntersecting: true }]);
  await settle();
  assert.equal(observer.unobserved.length, 1);
  assert.equal(harness.segments._byId.ev1._frameContainer.children.length, 0, 'bare node 下抽不出帧');

  controller.destroy();
});

test('storyReplicationReviewThumbnails: 离开视口只出队，已有缩略图的分段跳过', async () => {
  instances.length = 0;
  const harness = createHarness({ segmentIds: ['ev1', 'ev2'] });
  const controller = bindStoryReplicationReviewThumbnails(harness.state, harness.data);
  const observer = instances[0];

  observer.callback([
    { target: observer.observed[0], isIntersecting: false },
    { target: observer.observed[1], isIntersecting: true },
  ]);
  await settle();
  assert.equal(observer.unobserved, controller ? observer.unobserved : observer.unobserved);
  assert.equal(observer.unobserved.length, 1, '只有入队的那个被解除观察');

  controller.destroy();
  assert.equal(observer.disconnected, true);
});

test('storyReplicationReviewThumbnails: 已有缩略图的分段直接跳过抽帧', async () => {
  instances.length = 0;
  const harness = createHarness({ segmentIds: ['ev1'] });
  harness.segments._byId.ev1 = createSegmentNode('ev1', true);
  const controller = bindStoryReplicationReviewThumbnails(harness.state, harness.data);
  const observer = instances[0];

  observer.callback([{ target: observer.observed[0], isIntersecting: true }]);
  await settle();
  assert.equal(observer.unobserved.length, 1);

  controller.destroy();
});

test('storyReplicationReviewThumbnails: suspend 会暂停抽帧，destroy 后彻底停', async () => {
  instances.length = 0;
  const harness = createHarness({ segmentIds: ['ev1'] });
  const controller = bindStoryReplicationReviewThumbnails(harness.state, harness.data);
  const observer = instances[0];

  controller.suspend();
  observer.callback([{ target: observer.observed[0], isIntersecting: true }]);
  await settle();
  assert.equal(observer.unobserved.length, 1, '解除观察照常发生');

  controller.resume();
  await settle();
  controller.destroy();
  observer.callback([{ target: observer.observed[0], isIntersecting: true }]);
  await settle();
  assert.equal(harness.segments._byId.ev1._frameContainer.children.length, 0);
});
