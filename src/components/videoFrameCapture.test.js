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
  ['addEventListener'](_0x4032a4, _0x21ef34) {
    if (!this._listeners.has(_0x4032a4)) this._listeners.set(_0x4032a4, new Set());
    this._listeners.get(_0x4032a4).add(_0x21ef34);
  }
  ['removeEventListener'](_0xd61e0d, _0x7c912a) {
    this._listeners.get(_0xd61e0d)?.delete(_0x7c912a);
  }
  ['load']() {
    this.loadCount += 1;
  }
  ['dispatch'](_0x4d91bc) {
    for (const _0x37af37 of this._listeners.get(_0x4d91bc) || []) {
      _0x37af37({ type: _0x4d91bc, target: this });
    }
  }
}
(test('videoFrameCapture: 已有可读帧时直接判定 ready', () => {
  const _0x4290f5 = new FakeVideo();
  ((_0x4290f5.readyState = 2),
    (_0x4290f5.videoWidth = 0x280),
    (_0x4290f5.videoHeight = 0x168),
    assert.equal(isVideoFrameReady(_0x4290f5), true));
}),
  test('videoFrameCapture: 等待 loadeddata 后再判定可截帧', async () => {
    const _0x27fdf5 = new FakeVideo(),
      _0x437b78 = waitForVideoFrame(_0x27fdf5, { timeoutMs: 0x3e8 });
    (assert.equal(_0x27fdf5.loadCount, 1),
      (_0x27fdf5.readyState = 2),
      (_0x27fdf5.videoWidth = 0x280),
      (_0x27fdf5.videoHeight = 0x168),
      _0x27fdf5.dispatch('loadeddata'),
      assert.equal(await _0x437b78, true));
  }),
  test('videoFrameCapture: captureVideoFrameDataUrl 使用当前视频尺寸绘制', () => {
    const _0x1e25db = globalThis.document,
      _0x33d70e = [];
    globalThis.document = {
      createElement(_0x219b34) {
        return (
          assert.equal(_0x219b34, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(_0x34b27f) {
              return (
                assert.equal(_0x34b27f, '2d'),
                {
                  drawImage(..._0x15973e) {
                    _0x33d70e.push(_0x15973e);
                  },
                }
              );
            },
            toDataURL(_0x36bcae) {
              return 'data:' + _0x36bcae + ';base64,ok';
            },
          }
        );
      },
    };
    try {
      const _0x5951ab = new FakeVideo();
      ((_0x5951ab.readyState = 2),
        (_0x5951ab.videoWidth = 0x140),
        (_0x5951ab.videoHeight = 180),
        assert.equal(captureVideoFrameDataUrl(_0x5951ab), 'data:image/png;base64,ok'),
        assert.equal(_0x33d70e.length, 1),
        assert.deepEqual(_0x33d70e[0], [_0x5951ab, 0, 0, 0x140, 180]));
    } finally {
      typeof _0x1e25db === 'undefined' ? delete globalThis.document : (globalThis.document = _0x1e25db);
    }
  }),
  test('videoFrameCapture: captureVideoFrameBlob 导出当前帧 Blob', async () => {
    const _0x54ecc5 = globalThis.document,
      _0x5b227d = [];
    globalThis.document = {
      createElement(_0x4d084a) {
        return (
          assert.equal(_0x4d084a, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(_0x14a19c) {
              return (
                assert.equal(_0x14a19c, '2d'),
                {
                  drawImage(..._0x3d90eb) {
                    _0x5b227d.push(_0x3d90eb);
                  },
                }
              );
            },
            toBlob(_0x27f918, _0x4de692) {
              _0x27f918(new Blob(['frame'], { type: _0x4de692 }));
            },
          }
        );
      },
    };
    try {
      const _0x206826 = new FakeVideo();
      ((_0x206826.readyState = 2), (_0x206826.videoWidth = 0x280), (_0x206826.videoHeight = 0x168));
      const _0x476975 = await captureVideoFrameBlob(_0x206826);
      (assert.equal(_0x476975.type, 'image/png'),
        assert.equal(await _0x476975.text(), 'frame'),
        assert.deepEqual(_0x5b227d[0], [_0x206826, 0, 0, 0x280, 0x168]));
    } finally {
      typeof _0x54ecc5 === 'undefined' ? delete globalThis.document : (globalThis.document = _0x54ecc5);
    }
  }),
  test('videoFrameCapture: captureVideoFrameSnapshot 只返回 Blob 与元数据', async () => {
    const _0x1686be = globalThis.document;
    let _0x393377 = 0;
    globalThis.document = {
      createElement(_0xec76d3) {
        return (
          assert.equal(_0xec76d3, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(_0x53babf) {
              return (assert.equal(_0x53babf, '2d'), { drawImage() {} });
            },
            toBlob(_0xf90702, _0x29fb77) {
              ((_0x393377 += 1), _0xf90702(new Blob(['frame'], { type: _0x29fb77 })));
            },
          }
        );
      },
    };
    try {
      const _0x5307d5 = new FakeVideo();
      ((_0x5307d5.readyState = 2), (_0x5307d5.videoWidth = 0x320), (_0x5307d5.videoHeight = 0x1c2));
      const _0x1b4487 = await captureVideoFrameSnapshot(_0x5307d5, { fileNamePrefix: 'snap' });
      (assert.equal(_0x1b4487.width, 0x320),
        assert.equal(_0x1b4487.height, 0x1c2),
        assert.equal(_0x1b4487.originalWidth, 0x320),
        assert.equal(_0x1b4487.originalHeight, 0x1c2),
        assert.equal(_0x1b4487.ext, 'png'),
        assert.match(_0x1b4487.fileName, /^snap_\d+\.png$/),
        assert.equal(_0x1b4487.blob.type, 'image/png'),
        assert.equal(await _0x1b4487.blob.text(), 'frame'),
        assert.equal(_0x393377, 1));
    } finally {
      typeof _0x1686be === 'undefined' ? delete globalThis.document : (globalThis.document = _0x1686be);
    }
  }),
  test('videoFrameCapture: saveVideoFrameCapture 保存后返回本地图片字段', async () => {
    const _0x3d65a7 = globalThis.document;
    globalThis.document = {
      createElement(_0x73defd) {
        return (
          assert.equal(_0x73defd, 'canvas'),
          {
            width: 0,
            height: 0,
            getContext(_0x5eb1d9) {
              return (assert.equal(_0x5eb1d9, '2d'), { drawImage() {} });
            },
            toBlob(_0x291aa1, _0x5adbf3) {
              _0x291aa1(new Blob(['frame'], { type: _0x5adbf3 }));
            },
          }
        );
      },
    };
    try {
      const _0x99ca59 = new FakeVideo();
      ((_0x99ca59.readyState = 2), (_0x99ca59.videoWidth = 0x280), (_0x99ca59.videoHeight = 0x168));
      const _0x442fbf = await saveVideoFrameCapture(_0x99ca59, async (_0x1c7f85, _0xaa6fcc) => {
        return (
          assert.equal(_0xaa6fcc.ext, 'png'),
          assert.equal(_0x1c7f85.type, 'image/png'),
          { url: '/output/frame.png', localPath: 'output/frame.png', filename: 'frame.png' }
        );
      });
      assert.deepEqual(_0x442fbf, {
        src: '/output/frame.png',
        localPath: 'output/frame.png',
        originalLocalPath: 'output/frame.png',
        displayLocalPath: '',
        thumbLocalPath: '',
        originalWidth: 0x280,
        originalHeight: 0x168,
        fileName: 'frame.png',
      });
    } finally {
      typeof _0x3d65a7 === 'undefined' ? delete globalThis.document : (globalThis.document = _0x3d65a7);
    }
  }));
