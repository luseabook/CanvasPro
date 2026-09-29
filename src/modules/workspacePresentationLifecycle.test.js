import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspacePresentationLifecycle } from './workspacePresentationLifecycle.js';

function makeRoot() {
  const listeners = new Map();
  const root = {
    hidden: false,
    attributes: {},
    media: [],
    animations: [],
    getAnimationsOptions: null,
    setAttribute(name, value) {
      root.attributes[name] = value;
    },
    addEventListener(type, fn, capture) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ fn, capture });
    },
    removeEventListener(type, fn, capture) {
      const entries = listeners.get(type) || [];
      const index = entries.findIndex((entry) => entry.fn === fn && entry.capture === capture);
      if (index >= 0) entries.splice(index, 1);
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    dispatch(type, event) {
      for (const entry of [...(listeners.get(type) || [])]) entry.fn(event);
    },
    querySelectorAll(selector) {
      return selector === 'video, audio' ? root.media : [];
    },
    getAnimations(options) {
      root.getAnimationsOptions = options;
      return root.animations;
    },
  };
  return root;
}

function mediaElement(tagName = 'VIDEO') {
  return {
    tagName,
    pauseCount: 0,
    pause() {
      this.pauseCount += 1;
    },
  };
}

test('starts inactive unless asked otherwise', () => {
  assert.equal(createWorkspacePresentationLifecycle({ getRoot: () => null }).isActive(), false);
  assert.equal(
    createWorkspacePresentationLifecycle({ getRoot: () => null, initiallyActive: true }).isActive(),
    true,
  );
  assert.equal(createWorkspacePresentationLifecycle().isActive(), false);
});

test('survives a missing root getter', () => {
  const lifecycle = createWorkspacePresentationLifecycle();
  assert.doesNotThrow(() => lifecycle.activate());
  assert.equal(lifecycle.isActive(), true);
});

test('reveals and re-hides the root across activate and deactivate', () => {
  const root = makeRoot();
  root.hidden = true;
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  assert.equal(lifecycle.activate(), true);
  assert.equal(root.hidden, false);
  assert.equal(root.attributes['aria-hidden'], 'false');
  assert.equal(lifecycle.isActive(), true);
  lifecycle.deactivate();
  assert.equal(root.hidden, true);
  assert.equal(root.attributes['aria-hidden'], 'true');
  assert.equal(lifecycle.isActive(), false);
});

test('reports whether the content key moved', () => {
  let key = 'a';
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => null, getContentKey: () => key });
  assert.equal(lifecycle.activate(), true);
  lifecycle.deactivate();
  assert.equal(lifecycle.activate(), false);
  lifecycle.deactivate();
  key = 'b';
  assert.equal(lifecycle.activate(), true);
});

test('invalidate forces the next activate to report a change', () => {
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => null, getContentKey: () => 'a' });
  lifecycle.activate();
  lifecycle.deactivate();
  assert.equal(lifecycle.activate(), false);
  lifecycle.deactivate();
  lifecycle.invalidate();
  assert.equal(lifecycle.activate(), true);
});

test('treats a null or throwing content key as always changed', () => {
  const nullKey = createWorkspacePresentationLifecycle({ getRoot: () => null, getContentKey: () => null });
  nullKey.activate();
  nullKey.deactivate();
  assert.equal(nullKey.activate(), true);

  const throwingKey = createWorkspacePresentationLifecycle({
    getRoot: () => null,
    getContentKey: () => {
      throw new Error('nope');
    },
  });
  throwingKey.activate();
  throwingKey.deactivate();
  assert.equal(throwingKey.activate(), true);
});

test('pauses media that starts playing while inactive', () => {
  const root = makeRoot();
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  lifecycle.activate();
  assert.equal(root.listenerCount('play'), 1);
  lifecycle.deactivate();

  const video = mediaElement('VIDEO');
  const audio = mediaElement('AUDIO');
  root.dispatch('play', { target: video });
  root.dispatch('play', { target: audio });
  assert.equal(video.pauseCount, 1);
  assert.equal(audio.pauseCount, 1);
});

test('ignores play events while active or for other targets', () => {
  const root = makeRoot();
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  const video = mediaElement('VIDEO');
  const image = {
    tagName: 'IMG',
    pauseCount: 0,
    pause() {
      this.pauseCount += 1;
    },
  };
  lifecycle.activate();
  root.dispatch('play', { target: video });
  lifecycle.deactivate();
  root.dispatch('play', { target: image });
  root.dispatch('play', { target: null });
  assert.equal(video.pauseCount, 0);
  assert.equal(image.pauseCount, 0);
});

test('swallows a media element that refuses to pause', () => {
  const root = makeRoot();
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  lifecycle.deactivate();
  const stubborn = {
    tagName: 'VIDEO',
    pause() {
      throw new Error('nope');
    },
  };
  assert.doesNotThrow(() => root.dispatch('play', { target: stubborn }));
});

test('rebinds the play listener when the root changes', () => {
  const first = makeRoot();
  const second = makeRoot();
  let current = first;
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => current });
  lifecycle.activate();
  assert.equal(first.listenerCount('play'), 1);
  current = second;
  lifecycle.activate();
  assert.equal(first.listenerCount('play'), 0);
  assert.equal(second.listenerCount('play'), 1);
  lifecycle.dispose();
  assert.equal(second.listenerCount('play'), 0);
});

test('pauses nested media and running animations on deactivate', () => {
  const root = makeRoot();
  const video = mediaElement('VIDEO');
  const animation = {
    playState: 'running',
    pauseCount: 0,
    effect: { target: { isConnected: true } },
    pause() {
      this.playState = 'paused';
      this.pauseCount += 1;
    },
    play() {
      this.playState = 'running';
    },
  };
  root.media = [video];
  root.animations = [animation];
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  lifecycle.activate();
  lifecycle.deactivate();
  assert.equal(video.pauseCount, 1);
  assert.equal(animation.pauseCount, 1);
  assert.deepEqual(root.getAnimationsOptions, { subtree: true });
});

test('resumes connected paused animations on the next activate', () => {
  const root = makeRoot();
  const animation = {
    playState: 'running',
    playCount: 0,
    effect: { target: { isConnected: true } },
    pause() {
      this.playState = 'paused';
    },
    play() {
      this.playState = 'running';
      this.playCount += 1;
    },
  };
  root.animations = [animation];
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  lifecycle.activate();
  lifecycle.deactivate();
  lifecycle.activate();
  assert.equal(animation.playCount, 1);
});

test('leaves disconnected or already-paused animations alone', () => {
  const root = makeRoot();
  const disconnected = {
    playState: 'paused',
    playCount: 0,
    effect: { target: { isConnected: false } },
    play() {
      this.playCount += 1;
    },
  };
  const idle = {
    playState: 'idle',
    pauseCount: 0,
    effect: { target: { isConnected: true } },
    pause() {
      this.pauseCount += 1;
    },
  };
  root.animations = [disconnected, idle];
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  lifecycle.deactivate();
  lifecycle.activate();
  assert.equal(disconnected.playCount, 0);
  assert.equal(idle.pauseCount, 0);
});

test('does not resume a paused animation whose target left the document', () => {
  const root = makeRoot();
  const target = { isConnected: true };
  const animation = {
    playState: 'running',
    playCount: 0,
    effect: { target },
    pause() {
      this.playState = 'paused';
    },
    play() {
      this.playCount += 1;
    },
  };
  root.animations = [animation];
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  lifecycle.deactivate();
  assert.equal(animation.playState, 'paused');
  target.isConnected = false;
  lifecycle.activate();
  assert.equal(animation.playCount, 0);
});

test('skips an animation that refuses to pause and never resumes it', () => {
  const root = makeRoot();
  const stubborn = {
    playState: 'running',
    playCount: 0,
    effect: { target: { isConnected: true } },
    pause() {
      throw new Error('nope');
    },
    play() {
      this.playCount += 1;
    },
  };
  root.animations = [stubborn];
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root });
  assert.doesNotThrow(() => lifecycle.deactivate());
  lifecycle.activate();
  assert.equal(stubborn.playCount, 0);
});

test('dispose tears the lifecycle down and blocks further work', () => {
  const root = makeRoot();
  const lifecycle = createWorkspacePresentationLifecycle({ getRoot: () => root, getContentKey: () => 'a' });
  lifecycle.activate();
  lifecycle.dispose();
  assert.equal(lifecycle.isActive(), false);
  assert.equal(root.hidden, true);
  assert.equal(root.listenerCount('play'), 0);
  assert.equal(lifecycle.activate(), false);
  assert.doesNotThrow(() => lifecycle.deactivate());
});
