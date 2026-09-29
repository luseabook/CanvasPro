import test from 'node:test';
import assert from 'node:assert/strict';

import { bindVideoToGifAction } from './toGifAction.js';

function createButton() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    emit(type) {
      listeners.get(type)?.({ type, preventDefault() {}, stopPropagation() {} });
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

test('bindVideoToGifAction: initializes GIF conversion with the current video source', async () => {
  const button = createButton();
  const calls = [];
  const controllers = {
    videoClip: { exit: (options) => calls.push(['clip-exit', options]) },
    videoKeying: { exit: (options) => calls.push(['keying-exit', options]) },
    videoGif: {
      exit: (options) => calls.push(['gif-exit', options]),
      init: (options) => calls.push(['gif-init', options]),
    },
  };
  const dispose = bindVideoToGifAction({
    toolbarEl: { querySelector: (selector) => (selector === '.act-to-gif' ? button : null) },
    nodeData: { id: 'video-1' },
    VideoClipController: controllers.videoClip,
    VideoKeyingController: controllers.videoKeying,
    VideoGifController: controllers.videoGif,
    _getCurrentVideoUrl: () => 'https://media.example/video.mp4',
    _getCurrentVideoLocalPath: () => 'C:\\media\\video.mp4',
    _saveRemoteVideoResult: async (url) => `saved:${url}`,
    closeToolbarMoreMenu: () => calls.push(['close-menu']),
  });

  button.emit('click');
  assert.deepEqual(calls, [
    ['close-menu'],
    ['clip-exit', { silent: true }],
    ['keying-exit', { silent: true }],
    ['gif-exit', { silent: true }],
    [
      'gif-init',
      {
        nodeId: 'video-1',
        sourceUrl: 'https://media.example/video.mp4',
        sourceLocalPath: 'C:\\media\\video.mp4',
        ensureLocalSource: calls.at(-1)[1].ensureLocalSource,
      },
    ],
  ]);
  assert.equal(await calls.at(-1)[1].ensureLocalSource('remote.mp4'), 'saved:remote.mp4');

  dispose();
  assert.equal(button.listenerCount, 0);
});

test('bindVideoToGifAction: returns a no-op when the toolbar button is absent', () => {
  const dispose = bindVideoToGifAction({
    toolbarEl: { querySelector: () => null },
  });

  assert.equal(typeof dispose, 'function');
  dispose();
});
