import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractStoryboardVideoFramesFromServer,
  STORYBOARD_VIDEO_FRAME_LIMIT,
} from './storyboardVideoFrameApi.js';
const originalFetch = globalThis.fetch;
(test.afterEach(() => {
  globalThis.fetch = originalFetch;
}),
  test('storyboardVideoFrameApi posts normalized frame extraction options', async () => {
    let value = '',
      item = null;
    globalThis.fetch = async (key, dom = {}) => {
      return (
        (value = String(key)),
        (item = JSON.parse(String(dom.body || '{}'))),
        {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          async json() {
            return {
              success: true,
              frames: [
                {
                  index: 1,
                  start: 0,
                  end: 10,
                  captureTime: 0.2,
                  url: '/output/StoryboardFrames/a/frame_001.jpg',
                },
              ],
            };
          },
        }
      );
    };
    const extractStoryboardVideoFramesFromServer2 = await extractStoryboardVideoFramesFromServer(
      '/output/a.mp4',
      {
        maxFrames: 101,
        exactCount: true,
      },
    );
    (assert.equal(value, '/api/v2/video/storyboard_frames'),
      assert.equal(item.src, '/output/a.mp4'),
      assert.equal(item.options.maxFrames, STORYBOARD_VIDEO_FRAME_LIMIT),
      assert.equal(item.options.exactCount, true),
      assert.equal(
        extractStoryboardVideoFramesFromServer2.frames[0].url,
        '/output/StoryboardFrames/a/frame_001.jpg',
      ),
      assert.equal(extractStoryboardVideoFramesFromServer2.frames[0].start, 0),
      assert.equal(extractStoryboardVideoFramesFromServer2.frames[0].end, 10));
  }));
