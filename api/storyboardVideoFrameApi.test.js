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
    let _0x49ae12 = '',
      _0x2b4caa = null;
    globalThis.fetch = async (_0x2f0495, _0x854ce5 = {}) => {
      return (
        (_0x49ae12 = String(_0x2f0495)),
        (_0x2b4caa = JSON.parse(String(_0x854ce5.body || '{}'))),
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
    const _0x159333 = await extractStoryboardVideoFramesFromServer('/output/a.mp4', {
      maxFrames: 101,
      exactCount: true,
    });
    (assert.equal(_0x49ae12, '/api/v2/video/storyboard_frames'),
      assert.equal(_0x2b4caa.src, '/output/a.mp4'),
      assert.equal(_0x2b4caa.options.maxFrames, STORYBOARD_VIDEO_FRAME_LIMIT),
      assert.equal(_0x2b4caa.options.exactCount, true),
      assert.equal(_0x159333.frames[0].url, '/output/StoryboardFrames/a/frame_001.jpg'),
      assert.equal(_0x159333.frames[0].start, 0),
      assert.equal(_0x159333.frames[0].end, 10));
  }));
