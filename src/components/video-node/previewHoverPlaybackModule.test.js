// Regression tests for the AI video node hover-to-play subsystem.
//
// The bug these lock down: `AIGenVideoNode.mount()` registered `mouseenter` /
// `mouseleave` listeners calling `activatePreviewHoverPlayback()` and
// `_deactivatePreviewHoverPlayback()`, and neither method existed anywhere in the
// tree, so every hover on an AI video node threw a `TypeError`. The tests drive
// the exact wiring from `mount()` (guards included) against the real prototype
// methods, so a re-lost implementation fails here instead of in the canvas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomEnvironment } from '../../../tools/dom-test-environment.mjs';
import { createVideoNodePreviewHoverPlaybackModule } from './previewHoverPlaybackModule.js';

const restoreDom = installDomEnvironment();
const hoverPlaybackModule = createVideoNodePreviewHoverPlaybackModule({ store: null });

test.after(() => {
  restoreDom();
});

/**
 * Builds a minimal video element stub. jsdom does not implement the media
 * pipeline (`play()` throws "Not implemented"), so playback is modelled here.
 * @param {object} [overrides] Fields replacing the defaults.
 * @returns {object} Fake video element.
 */
function createFakeVideo(overrides = {}) {
  const video = {
    src: 'blob:hover-source.mp4',
    currentSrc: 'blob:hover-source.mp4',
    loop: false,
    paused: true,
    currentTime: 1.5,
    playCalls: 0,
    pauseCalls: 0,
    play() {
      video.playCalls += 1;
      video.paused = false;
      return Promise.resolve();
    },
    pause() {
      video.pauseCalls += 1;
      video.paused = true;
    },
    getAttribute(name) {
      return name === 'src' ? video.src : null;
    },
    ...overrides,
  };
  return video;
}

/**
 * Creates a node object carrying the hover playback methods plus the members the
 * real `AIGenVideoNode` owns (`mediaRuntimeState.js` / `mount()`).
 * @param {{ video?: any, data?: object, withVideoField?: boolean }} [options]
 * @returns {any} Node-like object.
 */
function createHoverNode({ video = createFakeVideo(), data = {}, withVideoField = true } = {}) {
  const node = Object.create(hoverPlaybackModule);
  node.nodeId = 'node-ai-video-hover';
  node._data = { id: node.nodeId, isVideosExpanded: false, ...data };
  node._isHovered = false;
  node._hoverManualPause = false;
  node._isManualControl = false;
  node._isManualLoopPlayback = false;
  node._previewHoverActivationPending = false;
  node._hoverPlaybackResumeState = null;
  node._hoverPlaybackLifecycle = null;
  node._multiLayerEls = [];
  node.videoEl = video;
  if (withVideoField) node._video = video;
  node._getActivePreviewVideoEl = () => video;
  return node;
}

/**
 * Reproduces the listener wiring from `AIGenVideoNode.mount()` (including the
 * `videoClip.active` / `isVideosExpanded` leave guards) and exposes a `fire()`
 * helper that invokes each recorded handler directly — jsdom reports listener
 * exceptions to its virtual console instead of rethrowing, so calling the
 * handlers inside `assert.doesNotThrow` is what actually proves "no throw".
 * @param {any} node Node-like object.
 * @param {() => object} readStoreState Canvas state reader.
 * @returns {{ previewEl: HTMLElement, handlers: Map<string, Function[]>, fire: Function }}
 */
function bindPreviewHoverHandlers(node, readStoreState) {
  const previewEl = document.createElement('div');
  document.body.appendChild(previewEl);
  const handlers = new Map();
  const addEventListener = previewEl.addEventListener.bind(previewEl);
  previewEl.addEventListener = (type, handler, options) => {
    const list = handlers.get(type) || [];
    list.push(handler);
    handlers.set(type, list);
    addEventListener(type, handler, options);
  };
  previewEl.addEventListener('mouseenter', () => {
    node.activatePreviewHoverPlayback();
  });
  previewEl.addEventListener('mouseleave', () => {
    const storeState = readStoreState();
    const config = storeState.videoClip;
    if (config && config.active && config.nodeId === node.nodeId) return;
    const scope = storeState.nodes[node.nodeId] || node._data || {};
    if (scope.isVideosExpanded) return;
    node._deactivatePreviewHoverPlayback();
  });
  const fire = (type) => {
    const event = new globalThis.MouseEvent(type);
    for (const handler of handlers.get(type) || []) {
      assert.doesNotThrow(() => handler(event), `${type} handler must not throw`);
    }
    return event;
  };
  return { previewEl, handlers, fire };
}

/** Store stub returning an idle canvas (no clip owner, node not expanded). */
function createStoreState(overrides = {}) {
  return () => ({
    videoClip: null,
    nodes: { 'node-ai-video-hover': { id: 'node-ai-video-hover', isVideosExpanded: false } },
    ...overrides,
  });
}

test('mouseenter starts hover playback without throwing', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  const { fire } = bindPreviewHoverHandlers(node, createStoreState());

  fire('mouseenter');

  assert.equal(node._isHovered, true);
  assert.equal(video.playCalls >= 1, true);
  assert.equal(video.loop, true);
  assert.equal(node._previewHoverActivationPending, false, 're-entry guard must be released');
  assert.deepEqual(node._hoverPlaybackResumeState, {
    currentTime: 1.5,
    src: 'blob:hover-source.mp4',
  });
});

test('mouseleave stops hover playback without throwing', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  const { fire } = bindPreviewHoverHandlers(node, createStoreState());

  fire('mouseenter');
  const pauseCallsBeforeLeave = video.pauseCalls;
  fire('mouseleave');

  assert.equal(node._isHovered, false);
  assert.equal(video.loop, false);
  assert.equal(video.pauseCalls, pauseCallsBeforeLeave + 1);
});

test('dispatched mouseenter / mouseleave reach the prototype methods', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  const { previewEl } = bindPreviewHoverHandlers(node, createStoreState());

  previewEl.dispatchEvent(new globalThis.MouseEvent('mouseenter'));
  assert.equal(node._isHovered, true, 'mouseenter must reach activatePreviewHoverPlayback');
  assert.equal(video.playCalls, 1);

  previewEl.dispatchEvent(new globalThis.MouseEvent('mouseleave'));
  assert.equal(node._isHovered, false, 'mouseleave must reach _deactivatePreviewHoverPlayback');
  assert.equal(video.pauseCalls, 1);
});

test('both methods stay safe when the node has no video element at all', () => {
  const node = Object.create(hoverPlaybackModule);
  node.nodeId = 'node-ai-video-no-media';
  node._data = { id: node.nodeId };
  node._isHovered = false;
  node._previewHoverActivationPending = false;
  node._getActivePreviewVideoEl = () => null;
  node._multiLayerEls = [];

  assert.equal(node.activatePreviewHoverPlayback(), false);
  assert.equal(node._deactivatePreviewHoverPlayback(), false);
  assert.equal(node._isHovered, false);
  assert.equal(node._previewHoverActivationPending, false);
});

test('mouseleave keeps playing while the video clip editor owns this node', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  const readStoreState = createStoreState({
    videoClip: { active: true, nodeId: 'node-ai-video-hover' },
  });
  const { fire } = bindPreviewHoverHandlers(node, readStoreState);

  fire('mouseenter');
  const pauseCallsBeforeLeave = video.pauseCalls;
  fire('mouseleave');

  assert.equal(video.pauseCalls, pauseCallsBeforeLeave, 'clip-owned playback must not be paused');
  assert.equal(video.loop, true);
  assert.equal(node._isHovered, true, 'the leave guard returns before touching hover state');
});

test('mouseenter is inert while the multi-video panel is expanded', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video, data: { isVideosExpanded: true } });
  const { fire } = bindPreviewHoverHandlers(node, createStoreState());

  fire('mouseenter');

  assert.equal(node._isHovered, false);
  assert.equal(video.playCalls, 0);
});

test('a video element without src is skipped instead of calling play()', () => {
  const video = createFakeVideo({ src: '', currentSrc: '' });
  const node = createHoverNode({ video });

  assert.equal(node.activatePreviewHoverPlayback(), false);
  assert.equal(video.playCalls, 0);
  assert.equal(node._isHovered, false);
  assert.equal(node._deactivatePreviewHoverPlayback(), true, 'the element still gets released');
});

test('the production field name videoEl is driven when _video is absent', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video, withVideoField: false });

  assert.equal(node._video, undefined);
  assert.equal(node.activatePreviewHoverPlayback(), true);
  assert.equal(video.playCalls, 1);
  assert.equal(video.loop, true);
});

test('a rejected play() promise (autoplay policy) is swallowed', async () => {
  const video = createFakeVideo({
    play() {
      video.playCalls += 1;
      return Promise.reject(new Error('NotAllowedError: play() requires user gesture'));
    },
  });
  const node = createHoverNode({ video });

  assert.equal(node.activatePreviewHoverPlayback(), true);
  // An unconsumed rejection would fail this test file at the process level.
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(video.playCalls, 1);
});

test('a manual pause keeps the user in control on the next hover', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  node._hoverManualPause = true;

  assert.equal(node.activatePreviewHoverPlayback(), false);
  assert.equal(video.playCalls, 0);
  assert.equal(node._isHovered, true, 'hover state is pinned even when autoplay is suppressed');
});

test('mouseleave does not stop playback the user started manually', () => {
  const video = createFakeVideo({ paused: false });
  const node = createHoverNode({ video });
  node._isHovered = true;
  node._isManualControl = true;
  const { fire } = bindPreviewHoverHandlers(node, createStoreState());

  fire('mouseleave');

  assert.equal(video.pauseCalls, 0);
  assert.equal(node._isHovered, false);
  assert.equal(node._isManualControl, true);
});

test('the activation guard blocks re-entry and always releases afterwards', () => {
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  node._previewHoverActivationPending = true;

  assert.equal(node.activatePreviewHoverPlayback(), false);
  assert.equal(video.playCalls, 0);

  node._previewHoverActivationPending = false;
  assert.equal(node.activatePreviewHoverPlayback(), true);
  assert.equal(node._previewHoverActivationPending, false);
});

test('the hover playback lifecycle is activated and released, not released-and-freed', () => {
  const calls = [];
  const video = createFakeVideo();
  const node = createHoverNode({ video });
  node._hoverPlaybackLifecycle = {
    activate() {
      calls.push('activate');
    },
    deactivate(options) {
      calls.push(['deactivate', options]);
    },
    dispose() {
      calls.push('dispose');
    },
  };

  node.activatePreviewHoverPlayback();
  node._deactivatePreviewHoverPlayback();

  assert.deepEqual(calls, ['activate', ['deactivate', { release: false }]]);
});
