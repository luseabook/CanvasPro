import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPersonReplacementVideoSyncPlayback,
  shouldReusePersonReplacementVideoPlaybackStage,
} from './personReplacementVideoSyncPlayback.js';

function makeVideo({
  paused = true,
  ended = false,
  duration = 100,
  currentTime = 0,
  rejectPlay = false,
} = {}) {
  const listeners = new Map();
  let time = currentTime;
  const video = {
    paused,
    ended,
    duration,
    plays: 0,
    pauses: 0,
    seekLog: [],
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      const list = listeners.get(type);
      if (!list) return;
      const index = list.indexOf(handler);
      if (index >= 0) list.splice(index, 1);
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    dispatch(type, event = {}) {
      [...(listeners.get(type) || [])].forEach((handler) => handler({ type, ...event }));
    },
    play() {
      video.plays += 1;
      if (rejectPlay) return Promise.reject(new Error('blocked'));
      video.paused = false;
      return Promise.resolve();
    },
    pause() {
      video.pauses += 1;
      video.paused = true;
    },
  };
  Object.defineProperty(video, 'currentTime', {
    get: () => time,
    set: (value) => {
      time = value;
      video.seekLog.push(value);
    },
  });
  return video;
}

function makeButton() {
  const classes = new Set();
  return {
    classList: {
      toggle(name, active) {
        if (active) classes.add(name);
        else classes.delete(name);
      },
      has: (name) => classes.has(name),
    },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

test('requires both videos', () => {
  assert.throws(() => createPersonReplacementVideoSyncPlayback({}), /同步播放需要原视频和替换结果视频/u);
  assert.throws(
    () => createPersonReplacementVideoSyncPlayback({ sourceVideo: makeVideo() }),
    /同步播放需要原视频和替换结果视频/u,
  );
});

test('starts disabled and reflects that on the button', async () => {
  const button = makeButton();
  const controller = createPersonReplacementVideoSyncPlayback({
    sourceVideo: makeVideo(),
    resultVideo: makeVideo(),
    button,
  });

  assert.equal(controller.isEnabled(), false);
  assert.equal(controller.isPlayingTogether(), false);
  assert.equal(button.classList.has('is-active'), false);
  assert.equal(button.attributes['aria-pressed'], 'false');
  assert.equal(button.attributes['aria-label'], '开启同步播放');
  assert.equal(await controller.togglePlayback(), false);
});

test('registers the playback listeners for both videos', () => {
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo();
  createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  for (const type of ['playing', 'timeupdate', 'seeking', 'seeked', 'pause', 'ended', 'emptied']) {
    assert.equal(sourceVideo.listenerCount(type), 1);
    assert.equal(resultVideo.listenerCount(type), 1);
  }
});

test('toggling the switch reports the state and notifies the caller', async () => {
  const button = makeButton();
  const changes = [];
  const controller = createPersonReplacementVideoSyncPlayback({
    sourceVideo: makeVideo(),
    resultVideo: makeVideo(),
    button,
    onEnabledChange: (enabled) => changes.push(enabled),
  });

  assert.equal(await controller.toggleEnabled(), true);
  assert.equal(controller.isEnabled(), true);
  assert.equal(button.classList.has('is-active'), true);
  assert.equal(button.attributes['aria-pressed'], 'true');
  assert.equal(button.attributes['aria-label'], '关闭同步播放');

  assert.equal(await controller.toggleEnabled(), false);
  assert.equal(controller.isEnabled(), false);
  assert.deepEqual(changes, [true, false]);
});

test('honours initiallyEnabled', () => {
  const button = makeButton();
  const controller = createPersonReplacementVideoSyncPlayback({
    sourceVideo: makeVideo(),
    resultVideo: makeVideo(),
    button,
    initiallyEnabled: true,
  });

  assert.equal(controller.isEnabled(), true);
  assert.equal(button.classList.has('is-active'), true);
});

test('togglePlayback starts both videos from the result master by default', async () => {
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo({ currentTime: 7 });
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  await controller.toggleEnabled();
  assert.equal(await controller.togglePlayback(), true);

  assert.equal(controller.isPlayingTogether(), true);
  assert.equal(sourceVideo.paused, false);
  assert.equal(resultVideo.paused, false);
  assert.equal(sourceVideo.currentTime, 7);

  assert.equal(await controller.togglePlayback(), false);
  assert.equal(controller.isPlayingTogether(), false);
  assert.equal(sourceVideo.paused, true);
});

test('togglePlayback accepts an explicit master', async () => {
  const sourceVideo = makeVideo({ currentTime: 3 });
  const resultVideo = makeVideo();
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  await controller.toggleEnabled();
  assert.equal(await controller.togglePlayback({ master: 'source' }), true);
  assert.equal(resultVideo.currentTime, 3);
});

test('the master side drives drift correction on its own events', async () => {
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo({ currentTime: 7 });
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  await controller.toggleEnabled();
  await controller.togglePlayback();

  resultVideo.currentTime = 20;
  resultVideo.dispatch('timeupdate');
  assert.equal(sourceVideo.currentTime, 20);

  sourceVideo.currentTime = 40;
  sourceVideo.dispatch('timeupdate');
  assert.equal(resultVideo.currentTime, 20);

  sourceVideo.dispatch('seeking');
  sourceVideo.currentTime = 55;
  sourceVideo.dispatch('timeupdate');
  assert.equal(resultVideo.currentTime, 55);
});

test('respects the drift tolerance', async () => {
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo({ currentTime: 10 });
  const controller = createPersonReplacementVideoSyncPlayback({
    sourceVideo,
    resultVideo,
    driftToleranceSec: 0.5,
  });

  await controller.toggleEnabled();
  await controller.togglePlayback();

  sourceVideo.currentTime = 10.2;
  resultVideo.dispatch('timeupdate');
  assert.equal(sourceVideo.currentTime, 10.2);

  sourceVideo.currentTime = 11;
  resultVideo.dispatch('timeupdate');
  assert.equal(sourceVideo.currentTime, 10);
});

test('a pause event tears the pair down', async () => {
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo();
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  await controller.toggleEnabled();
  await controller.togglePlayback();
  assert.equal(controller.isPlayingTogether(), true);

  sourceVideo.dispatch('pause');
  assert.equal(controller.isPlayingTogether(), false);
  assert.equal(sourceVideo.paused, true);
  assert.equal(resultVideo.paused, true);
});

test('enabling while one video already plays follows that side', async () => {
  const sourceVideo = makeVideo({ paused: false, currentTime: 9 });
  const resultVideo = makeVideo();
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  assert.equal(await controller.toggleEnabled(), true);
  assert.equal(controller.isPlayingTogether(), true);
  assert.equal(resultVideo.currentTime, 9);
});

test('a rejected play pauses both and reports failure', async () => {
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo({ rejectPlay: true });
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo });

  await controller.toggleEnabled();
  assert.equal(await controller.togglePlayback(), false);
  assert.equal(controller.isPlayingTogether(), false);
  assert.equal(sourceVideo.paused, true);
  assert.equal(resultVideo.paused, true);
});

test('destroy pauses, unbinds and locks the controller', async () => {
  const button = makeButton();
  const sourceVideo = makeVideo();
  const resultVideo = makeVideo();
  const controller = createPersonReplacementVideoSyncPlayback({ sourceVideo, resultVideo, button });

  await controller.toggleEnabled();
  await controller.togglePlayback();

  controller.destroy();
  assert.equal(controller.isEnabled(), false);
  assert.equal(controller.isPlayingTogether(), false);
  assert.equal(sourceVideo.paused, true);
  assert.equal(resultVideo.paused, true);
  assert.equal(sourceVideo.listenerCount('timeupdate'), 0);
  assert.equal(sourceVideo.listenerCount('pause'), 0);
  assert.equal(resultVideo.listenerCount('timeupdate'), 0);
  assert.equal(button.attributes['aria-pressed'], 'false');

  assert.equal(await controller.toggleEnabled(), false);
  assert.equal(await controller.togglePlayback(), false);
  assert.doesNotThrow(() => controller.destroy());
});

test('shouldReusePersonReplacementVideoPlaybackStage compares the playback identity', () => {
  const stage = (overrides = {}) => ({
    dataset: {
      personReplacementVideoPlaybackStage: 'stage-1',
      personReplacementVideoUrl: 'blob:one',
      personReplacementVideoPoster: 'poster',
      personReplacementVideoReversed: 'false',
      ...overrides,
    },
  });

  assert.equal(shouldReusePersonReplacementVideoPlaybackStage(stage(), stage()), true);
  assert.equal(
    shouldReusePersonReplacementVideoPlaybackStage(
      stage(),
      stage({ personReplacementVideoPlaybackStage: '' }),
    ),
    false,
  );
  assert.equal(
    shouldReusePersonReplacementVideoPlaybackStage(
      stage(),
      stage({ personReplacementVideoPlaybackStage: 'stage-2' }),
    ),
    false,
  );
  assert.equal(
    shouldReusePersonReplacementVideoPlaybackStage(stage(), stage({ personReplacementVideoUrl: '' })),
    false,
  );
  assert.equal(
    shouldReusePersonReplacementVideoPlaybackStage(stage(), stage({ personReplacementVideoUrl: 'blob:two' })),
    false,
  );
  assert.equal(
    shouldReusePersonReplacementVideoPlaybackStage(stage(), stage({ personReplacementVideoPoster: 'other' })),
    false,
  );
  assert.equal(
    shouldReusePersonReplacementVideoPlaybackStage(
      stage(),
      stage({ personReplacementVideoReversed: 'true' }),
    ),
    false,
  );
  assert.equal(shouldReusePersonReplacementVideoPlaybackStage(stage(), { dataset: {} }), false);
});
