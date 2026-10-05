import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureVideoFrameBlob,
  captureVideoFrameDataUrl,
  captureVideoFrameSnapshot,
  isVideoFrameReady,
  saveVideoFrameCapture,
  waitForVideoFrame,
} from './videoFrameCapture.js';
class FakeVideo {
  constructor() {
    ((this.currentSrc = ''),
      (this.src = 'video.mp4'),
      (this.readyState = 0),
      (this.videoWidth = 0),
      (this.videoHeight = 0),
      (this.loadCount = 0),
      (this._listeners = new Map()));
  }
  ['addEventListener'](value, item) {
    if (!this._listeners.has(value)) this._listeners.set(value, new Set());
    this._listeners.get(value).add(item);
  }
  ['removeEventListener'](key, index) {
    this._listeners.get(key)?.delete(index);
  }
  ['load']() {
    this.loadCount += 1;
  }
  ['dispatch'](type) {
    for (const run of this._listeners.get(type) || []) {
      run({ type: type, target: this });
    }
  }
}
(test('videoFrameCapture: 已有可读帧时直接判定 ready', () => {
  const fakeVideo = new FakeVideo();
  ((fakeVideo.readyState = 2),
    (fakeVideo.videoWidth = 640),
    (fakeVideo.videoHeight = 360),
    assert.equal(isVideoFrameReady(fakeVideo), true));
}),
  test('videoFrameCapture: 等待 loadeddata 后再判定可截帧', async () => {
    const store = new FakeVideo(),
      waitForVideoFrame2 = waitForVideoFrame(store, { timeoutMs: 1000 });
    (assert.equal(store.loadCount, 1),
      (store.readyState = 2),
      (store.videoWidth = 640),
      (store.videoHeight = 360),
      store.dispatch('loadeddata'),
      assert.equal(await waitForVideoFrame2, true));
  }),
  test('videoFrameCapture: captureVideoFrameDataUrl 使用当前视频尺寸绘制', () => {
    const result = globalThis.document,
      list = [];
    globalThis.document = {
      createElement(data) {
        return (
          assert.equal(data, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(options) {
              return (
                assert.equal(options, '2d'),
                {
                  drawImage(...args) {
                    list.push(args);
                  },
                }
              );
            },
            toDataURL(target) {
              return 'data:' + target + ';base64,ok';
            },
          }
        );
      },
    };
    try {
      const fakeVideo2 = new FakeVideo();
      ((fakeVideo2.readyState = 2),
        (fakeVideo2.videoWidth = 320),
        (fakeVideo2.videoHeight = 180),
        assert.equal(captureVideoFrameDataUrl(fakeVideo2), 'data:image/png;base64,ok'),
        assert.equal(list.length, 1),
        assert.deepEqual(list[0], [fakeVideo2, 0, 0, 320, 180]));
    } finally {
      typeof result === 'undefined' ? delete globalThis.document : (globalThis.document = result);
    }
  }),
  test('videoFrameCapture: captureVideoFrameBlob 导出当前帧 Blob', async () => {
    const source = globalThis.document,
      list2 = [];
    globalThis.document = {
      createElement(next) {
        return (
          assert.equal(next, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(current) {
              return (
                assert.equal(current, '2d'),
                {
                  drawImage(...args2) {
                    list2.push(args2);
                  },
                }
              );
            },
            toBlob(handler, type2) {
              handler(new Blob(['frame'], { type: type2 }));
            },
          }
        );
      },
    };
    try {
      const fakeVideo3 = new FakeVideo();
      ((fakeVideo3.readyState = 2), (fakeVideo3.videoWidth = 640), (fakeVideo3.videoHeight = 360));
      const response = await captureVideoFrameBlob(fakeVideo3);
      (assert.equal(response.type, 'image/png'),
        assert.equal(await response.text(), 'frame'),
        assert.deepEqual(list2[0], [fakeVideo3, 0, 0, 640, 360]));
    } finally {
      typeof source === 'undefined' ? delete globalThis.document : (globalThis.document = source);
    }
  }),
  test('videoFrameCapture: captureVideoFrameSnapshot 只返回 Blob 与元数据', async () => {
    const entry = globalThis.document;
    let record = 0;
    globalThis.document = {
      createElement(payload) {
        return (
          assert.equal(payload, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(handle) {
              return (assert.equal(handle, '2d'), { drawImage() {} });
            },
            toBlob(handler2, type3) {
              ((record += 1), handler2(new Blob(['frame'], { type: type3 })));
            },
          }
        );
      },
    };
    try {
      const fakeVideo4 = new FakeVideo();
      ((fakeVideo4.readyState = 2), (fakeVideo4.videoWidth = 800), (fakeVideo4.videoHeight = 450));
      const box = await captureVideoFrameSnapshot(fakeVideo4, { fileNamePrefix: 'snap' });
      (assert.equal(box.width, 800),
        assert.equal(box.height, 450),
        assert.equal(box.originalWidth, 800),
        assert.equal(box.originalHeight, 450),
        assert.equal(box.ext, 'png'),
        assert.match(box.fileName, /^snap_\d+\.png$/),
        assert.equal(box.blob.type, 'image/png'),
        assert.equal(await box.blob.text(), 'frame'),
        assert.equal(record, 1));
    } finally {
      typeof entry === 'undefined' ? delete globalThis.document : (globalThis.document = entry);
    }
  }),
  test('videoFrameCapture: saveVideoFrameCapture 保存后返回本地图片字段', async () => {
    const state = globalThis.document;
    globalThis.document = {
      createElement(config) {
        return (
          assert.equal(config, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(scope) {
              return (assert.equal(scope, '2d'), { drawImage() {} });
            },
            toBlob(handler3, type4) {
              handler3(new Blob(['frame'], { type: type4 }));
            },
          }
        );
      },
    };
    try {
      const fakeVideo5 = new FakeVideo();
      ((fakeVideo5.readyState = 2), (fakeVideo5.videoWidth = 640), (fakeVideo5.videoHeight = 360));
      const saveVideoFrameCapture2 = await saveVideoFrameCapture(fakeVideo5, async (input, output) => {
        return (
          assert.equal(output.ext, 'png'),
          assert.equal(input.type, 'image/png'),
          { url: '/output/frame.png', localPath: 'output/frame.png', filename: 'frame.png' }
        );
      });
      assert.deepEqual(saveVideoFrameCapture2, {
        src: '/output/frame.png',
        localPath: 'output/frame.png',
        originalLocalPath: 'output/frame.png',
        displayLocalPath: '',
        thumbLocalPath: '',
        originalWidth: 640,
        originalHeight: 360,
        fileName: 'frame.png',
      });
    } finally {
      typeof state === 'undefined' ? delete globalThis.document : (globalThis.document = state);
    }
  }));
