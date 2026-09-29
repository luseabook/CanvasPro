import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { createAudioPlaybackSurfaceController, renderAudioPlaybackSurface } from './audioPlaybackSurface.js';

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;

afterEach(() => {
  if (typeof originalDocument === 'undefined') delete globalThis.document;
  else globalThis.document = originalDocument;
  if (typeof originalWindow === 'undefined') delete globalThis.window;
  else globalThis.window = originalWindow;
});

test('audioPlaybackSurface: renders escaped labels, safe classes, and data attributes', () => {
  const html = renderAudioPlaybackSurface({
    audioUrl: 'blob:audio-1',
    waveformUrl: '/data/assets/wave.json',
    className: 'custom-class invalid!',
    playLabel: 'Play <now>',
    pauseLabel: 'Pause & stop',
    disabled: false,
    ariaBusy: true,
    dataAttributes: {
      'data-mode': 'a"b',
      'bad-key': 'ignored',
      'data-empty': '',
      'data-false': false,
    },
    trailingHtml: '<span>tail</span>',
  });

  assert.match(html, /class="audio-card audio-playback-surface custom-class"/);
  assert.match(html, /data-audio-playback-play-label="Play &lt;now&gt;"/);
  assert.match(html, /data-audio-playback-pause-label="Pause &amp; stop"/);
  assert.match(html, /data-audio-playback-waveform-url="\/data\/assets\/wave\.json"/);
  assert.match(html, /data-mode="a&quot;b"/);
  assert.match(html, /data-empty(?:\s|>)/);
  assert.doesNotMatch(html, /bad-key|data-false|invalid!/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /data-audio-playback-url="blob:audio-1"/);
  assert.match(html, /<span>tail<\/span>/);
  assert.doesNotMatch(html, /class="audio-play-btn"[^>]*disabled/);
});

test('audioPlaybackSurface: disables playback without audio and rejects incomplete containers', () => {
  const withoutAudio = renderAudioPlaybackSurface({ disabled: false });
  assert.match(withoutAudio, /class="audio-play-btn"[^>]*disabled/);

  assert.equal(createAudioPlaybackSurfaceController(null), null);
  assert.equal(createAudioPlaybackSurfaceController({ querySelector: () => null }), null);
});

test('audioPlaybackSurface: controller toggles playback labels and cleans up listeners', async () => {
  globalThis.window = {};
  const listeners = new Map();
  const classValues = new Set();
  const attributes = {};
  const audio = {
    dataset: { audioPlaybackUrl: 'https://cdn.example/audio.mp3' },
    paused: true,
    ended: false,
    duration: 20,
    preload: '',
    currentTime: 0,
    async play() {
      this.paused = false;
    },
    pause() {
      this.paused = true;
    },
    addEventListener(type, handler) {
      listeners.set(`audio:${type}`, handler);
    },
    removeEventListener(type) {
      listeners.delete(`audio:${type}`);
    },
  };
  const toggle = {
    classList: {
      toggle(value, enabled) {
        if (enabled) classValues.add(value);
        else classValues.delete(value);
      },
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
    addEventListener(type, handler) {
      listeners.set(`toggle:${type}`, handler);
    },
    removeEventListener(type) {
      listeners.delete(`toggle:${type}`);
    },
  };
  const progressBar = {
    addEventListener(type, handler) {
      listeners.set(`progress:${type}`, handler);
    },
    removeEventListener(type) {
      listeners.delete(`progress:${type}`);
    },
    getBoundingClientRect() {
      return { left: 0, width: 100 };
    },
  };
  const container = {
    dataset: {
      audioPlaybackPlayLabel: 'Play',
      audioPlaybackPauseLabel: 'Pause',
    },
    isConnected: true,
    querySelector(selector) {
      if (selector === '[data-audio-playback-audio]') return audio;
      if (selector === '[data-audio-playback-toggle]') return toggle;
      if (selector === '[data-audio-playback-progress-bar]') return progressBar;
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  let beforePlay = 0;
  const controller = createAudioPlaybackSurfaceController(container, {
    onBeforePlay() {
      beforePlay += 1;
    },
  });

  await controller.ready;
  listeners.get('toggle:pointerdown')({
    preventDefault() {},
    stopPropagation() {},
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(beforePlay, 1);
  assert.equal(audio.paused, false);
  assert.equal(classValues.has('is-playing'), true);
  assert.equal(attributes['aria-label'], 'Pause');

  controller.destroy();
  assert.equal(listeners.has('toggle:pointerdown'), false);
  assert.equal(listeners.has('audio:play'), false);
  assert.equal(audio.paused, true);
});
