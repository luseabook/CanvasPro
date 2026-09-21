import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoNodeResultRenderModule } from './resultRenderModule.js';
const previousDocument = globalThis.document,
  previousRequestAnimationFrame = globalThis.requestAnimationFrame;
function createStyleStub() {
  return {
    setProperty(_0xb6f18f, _0x57f931) {
      this[_0xb6f18f] = String(_0x57f931);
    },
    removeProperty(_0x3997a2) {
      delete this[_0x3997a2];
    },
  };
}
class FakeClassList {
  constructor(_0x1d1790) {
    ((this._owner = _0x1d1790), (this._set = new Set()));
  }
  ['add'](..._0x445922) {
    for (const _0x253be7 of _0x445922) {
      if (_0x253be7) this._set.add(String(_0x253be7));
    }
    this._sync();
  }
  ['remove'](..._0x2c9366) {
    for (const _0x1515d0 of _0x2c9366) {
      this._set.delete(String(_0x1515d0));
    }
    this._sync();
  }
  ['contains'](_0x2f8711) {
    return this._set.has(String(_0x2f8711));
  }
  ['_sync']() {
    this._owner.className = Array.from(this._set).join(' ');
  }
}
class FakeElement {
  constructor(_0x2f6dff) {
    ((this.tagName = String(_0x2f6dff || 'div').toUpperCase()),
      (this.children = []),
      (this.parentNode = null),
      (this.style = createStyleStub()),
      (this.dataset = {}),
      (this.className = ''),
      (this.classList = new FakeClassList(this)),
      (this.innerHTML = ''),
      (this.offsetWidth = 0x140),
      (this.offsetHeight = 180),
      (this.offsetTop = 0),
      (this.textContent = ''));
  }
  ['appendChild'](_0x5b9766) {
    if (!_0x5b9766) return _0x5b9766;
    if (_0x5b9766.parentNode) _0x5b9766.parentNode.removeChild(_0x5b9766);
    return ((_0x5b9766.parentNode = this), this.children.push(_0x5b9766), _0x5b9766);
  }
  ['removeChild'](_0x4d1ce7) {
    const _0xcfd24b = this.children.indexOf(_0x4d1ce7);
    return (_0xcfd24b >= 0 && (this.children.splice(_0xcfd24b, 1), (_0x4d1ce7.parentNode = null)), _0x4d1ce7);
  }
  ['remove']() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  ['addEventListener']() {}
  ['querySelectorAll'](_0x19a2fe) {
    if (_0x19a2fe === 'video') {
      const _0xc504b0 = [],
        _0x3951fc = (_0x376278) => {
          for (const _0x37d367 of _0x376278.children || []) {
            if (_0x37d367.tagName === 'VIDEO') _0xc504b0.push(_0x37d367);
            _0x3951fc(_0x37d367);
          }
        };
      return (_0x3951fc(this), _0xc504b0);
    }
    return [];
  }
}
class FakeVideoElement extends FakeElement {
  constructor() {
    (super('video'),
      (this._attrs = new Map()),
      (this.autoplay = false),
      (this.loop = false),
      (this.muted = true),
      (this.playsInline = true),
      (this.preload = ''),
      (this.draggable = false),
      (this.paused = true),
      (this.readyState = 0),
      (this.videoWidth = 0),
      (this.videoHeight = 0),
      (this.duration = NaN),
      (this.loadCount = 0));
  }
  get ['src']() {
    return this.getAttribute('src') || '';
  }
  set ['src'](_0x537dea) {
    this.setAttribute('src', _0x537dea);
  }
  get ['poster']() {
    return this.getAttribute('poster') || '';
  }
  set ['poster'](_0x5e6dd8) {
    this.setAttribute('poster', _0x5e6dd8);
  }
  ['getAttribute'](_0x39acff) {
    return this._attrs.get(String(_0x39acff)) || '';
  }
  ['setAttribute'](_0x24f1cc, _0x358288) {
    this._attrs.set(String(_0x24f1cc), String(_0x358288));
  }
  ['removeAttribute'](_0x21dab5) {
    this._attrs.delete(String(_0x21dab5));
  }
  ['load']() {
    this.loadCount += 1;
  }
  ['play']() {
    return ((this.paused = false), Promise.resolve());
  }
  ['pause']() {
    this.paused = true;
  }
}
function createDocumentStub() {
  return {
    createElement(_0x240766) {
      if (String(_0x240766).toLowerCase() === 'video') return new FakeVideoElement();
      return new FakeElement(_0x240766);
    },
  };
}
function createStore(_0x3bdc77) {
  const _0x3ca369 = { nodes: { [_0x3bdc77.id]: { ..._0x3bdc77 } } };
  return {
    state: _0x3ca369,
    getState() {
      return _0x3ca369;
    },
    getIncomingEdges() {
      return [];
    },
    updateNodeData(_0x1b61dc, _0x3fdefb) {
      const _0x1ef9ef = _0x3ca369.nodes[_0x1b61dc] || {};
      _0x3ca369.nodes[_0x1b61dc] = { ..._0x1ef9ef, ..._0x3fdefb };
    },
  };
}
function createContext(_0x307c20, _0x579497 = {}) {
  const _0x3af465 = createStore(_0x307c20);
  _0x3af465.state.ui = { showVideoMeta: _0x579497.showVideoMeta === true };
  let _0x50e853 = 0,
    _0x1fb3d9 = [];
  const _0x5472ba = createVideoNodeResultRenderModule({
      store: _0x3af465,
      api: {
        async fetchVideoMetaFromServer() {
          _0x50e853 += 1;
          if (typeof _0x579497.fetchVideoMetaFromServer === 'function')
            return _0x579497.fetchVideoMetaFromServer();
          return { success: false };
        },
        fetchVideoFirstFrameThumbFromServer(_0x3288a8, _0x6f497c) {
          _0x1fb3d9.push({ src: _0x3288a8, context: _0x6f497c });
          if (typeof _0x579497.fetchVideoFirstFrameThumbFromServer === 'function')
            return _0x579497.fetchVideoFirstFrameThumbFromServer(_0x3288a8, _0x6f497c);
          return Promise.resolve({ url: '' });
        },
      },
      getImage: async () => null,
      ensureThumbDecoded: () => {},
      buildApiUrl: (_0x1de20f) => 'http://local' + String(_0x1de20f || ''),
      VideoKeyingController: {
        isActiveFor() {
          return false;
        },
      },
    }),
    _0x504d37 = new FakeElement('div'),
    _0x1113b4 = new FakeElement('div'),
    _0x2fd983 = new FakeElement('div'),
    _0x214e51 = Object.assign(Object.create(_0x5472ba), {
      nodeId: _0x307c20.id,
      _data: _0x3af465.state.nodes[_0x307c20.id],
      _root: _0x1113b4,
      previewEl: _0x504d37,
      _placeholderEl: _0x2fd983,
      _multiVideosContainer: null,
      _multiStackWrap: null,
      _multiLayerEls: [],
      _multiErrorEls: [],
      _multiToggleBtn: null,
      _cachedVideoUrls: new Map(),
      _videoThumbPending: new Set(),
      _lastVideosKeyStr: null,
      _lastMainIdx: null,
      _lastIsExpanded: null,
      _blobResolveToken: 0,
      _isHovered: false,
      _isManualControl: false,
      _showPausedCenterIndicator() {},
      _hideCenterIndicator() {},
      _syncVideoControlsFromVideo() {},
      _applyMuteStateToPreviewVideos() {},
      _setVideoOverlaysVisible() {},
      _clearStatusOverlay() {},
      _ensureStatusOverlayEl() {
        return new FakeElement('div');
      },
    });
  return {
    ctx: _0x214e51,
    store: _0x3af465,
    getFetchVideoMetaCallCount: () => _0x50e853,
    getFetchVideoThumbCalls: () => _0x1fb3d9.slice(),
  };
}
(test.before(() => {
  ((globalThis.document = createDocumentStub()),
    (globalThis.requestAnimationFrame = (_0x510122) => {
      return (_0x510122(), 1);
    }));
}),
  test.after(() => {
    (typeof previousDocument === 'undefined'
      ? delete globalThis.document
      : (globalThis.document = previousDocument),
      typeof previousRequestAnimationFrame === 'undefined'
        ? delete globalThis.requestAnimationFrame
        : (globalThis.requestAnimationFrame = previousRequestAnimationFrame));
  }),
  test('video result render: 有 poster 的主预览首次渲染保持视频源懒加载', async () => {
    const { ctx: _0x5ace21 } = createContext({
      id: 'ai-video-main-preload',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    (await _0x5ace21._loadAndDisplayVideo(),
      assert.equal(_0x5ace21._multiLayerEls.length, 1),
      assert.equal(_0x5ace21._multiLayerEls[0].preload, 'none'),
      assert.equal(_0x5ace21._multiLayerEls[0].getAttribute('src'), ''),
      assert.equal(_0x5ace21._multiLayerEls[0].poster, 'http://local/output/main.jpg'));
  }),
  test('video result render: deferred media shows poster without creating video', async () => {
    const { ctx: _0xc44c1e } = createContext({
      id: 'ai-video-deferred-poster',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    ((_0xc44c1e._rendererMediaDeferred = true),
      await _0xc44c1e._loadAndDisplayVideo(),
      assert.equal(_0xc44c1e._multiLayerEls.length, 0),
      assert.equal(_0xc44c1e._multiVideosContainer, null),
      assert.equal(_0xc44c1e._placeholderEl.style.display, 'none'),
      assert.equal(_0xc44c1e._deferredPosterImgEl?.src, 'http://local/output/main.jpg'));
  }),
  test('video result render: 无 poster 的主预览仍加载视频源生成首帧', async () => {
    const { ctx: _0x5a59a7 } = createContext({
      id: 'ai-video-main-no-poster',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4' }],
    });
    (await _0x5a59a7._loadAndDisplayVideo(),
      assert.equal(_0x5a59a7._multiLayerEls.length, 1),
      assert.equal(_0x5a59a7._multiLayerEls[0].preload, 'auto'),
      assert.equal(_0x5a59a7._multiLayerEls[0].getAttribute('src'), 'http://local/output/main.mp4'));
  }),
  test('video result render: 主预览交互时才接入视频源', async () => {
    const { ctx: _0x1dff82 } = createContext({
      id: 'ai-video-main-ensure-src',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    await _0x1dff82._loadAndDisplayVideo();
    const _0x614b04 = _0x1dff82._multiLayerEls[0];
    (assert.equal(_0x614b04.preload, 'none'),
      assert.equal(_0x614b04.getAttribute('src'), ''),
      assert.equal(await _0x1dff82._ensureVideoSrcFor(_0x614b04), true),
      assert.equal(_0x614b04.preload, 'auto'),
      assert.equal(_0x614b04.getAttribute('src'), 'http://local/output/main.mp4'),
      assert.equal(_0x614b04.loadCount, 0));
  }),
  test('video result render: 播放接源时主动触发媒体加载', async () => {
    const { ctx: _0x5a6fcf } = createContext({
      id: 'ai-video-main-ensure-src-playback',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    await _0x5a6fcf._loadAndDisplayVideo();
    const _0xabc7e6 = _0x5a6fcf._multiLayerEls[0];
    (assert.equal(_0xabc7e6.preload, 'none'),
      assert.equal(_0xabc7e6.getAttribute('src'), ''),
      assert.equal(await _0x5a6fcf._ensureVideoSrcFor(_0xabc7e6, { forPlayback: true }), true),
      assert.equal(_0xabc7e6.preload, 'auto'),
      assert.equal(_0xabc7e6.getAttribute('src'), 'http://local/output/main.mp4'),
      assert.equal(_0xabc7e6.loadCount, 1));
  }),
  test('video result render: poster main preview does not fetch video before interaction', async () => {
    const _0x5d8419 = globalThis.window,
      _0xa9cb2d = globalThis.location,
      _0xfb22d0 = globalThis.fetch,
      _0x527913 = globalThis.URL.createObjectURL;
    ((globalThis.window = { electronAPI: {} }),
      (globalThis.location = { href: 'http://local/', origin: 'http://local' }));
    const _0x3f2c17 = [];
    ((globalThis.fetch = async (_0x1f14ab) => {
      return (
        _0x3f2c17.push(_0x1f14ab),
        {
          ok: true,
          async blob() {
            return new Blob(['media'], { type: 'video/mp4' });
          },
        }
      );
    }),
      (globalThis.URL.createObjectURL = () => 'blob:poster-main-warm'));
    try {
      const { ctx: _0x2f3726 } = createContext({
        id: 'ai-video-main-poster-warm',
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
      });
      (await _0x2f3726._loadAndDisplayVideo(),
        await new Promise((_0x53ec09) => setTimeout(_0x53ec09, 0)),
        assert.equal(_0x2f3726._multiLayerEls[0].preload, 'none'),
        assert.equal(_0x2f3726._multiLayerEls[0].getAttribute('src'), ''),
        assert.deepEqual(_0x3f2c17, []));
    } finally {
      if (typeof _0x5d8419 === 'undefined') delete globalThis.window;
      else globalThis.window = _0x5d8419;
      if (typeof _0xa9cb2d === 'undefined') delete globalThis.location;
      else globalThis.location = _0xa9cb2d;
      ((globalThis.fetch = _0xfb22d0), (globalThis.URL.createObjectURL = _0x527913));
    }
  }),
  test('video result render: 视频节点信息关闭时不请求后端元信息', async () => {
    const { ctx: _0x1ca165, getFetchVideoMetaCallCount: _0x182795 } = createContext(
      { id: 'ai-video-meta-off', type: 'ai-video', videos: [{ localPath: 'output/main.mp4' }] },
      { showVideoMeta: false },
    );
    (await _0x1ca165._maybeFetchVideoMeta('/output/main.mp4'), assert.equal(_0x182795(), 0));
  }),
  test('video result render: 视频节点信息开启时才请求后端元信息', async () => {
    const { ctx: _0x5ca8a8, getFetchVideoMetaCallCount: _0x599265 } = createContext(
      { id: 'ai-video-meta-on', type: 'ai-video', videos: [{ localPath: 'output/main.mp4' }] },
      { showVideoMeta: true },
    );
    (await _0x5ca8a8._maybeFetchVideoMeta('/output/main.mp4'), assert.equal(_0x599265(), 1));
  }),
  test('video result render: failed thumbnail backfill keeps result video usable', async () => {
    const {
      ctx: _0x7b5556,
      store: _0x47017e,
      getFetchVideoThumbCalls: _0xc88b74,
    } = createContext(
      {
        id: 'ai-video-missing-result',
        type: 'ai-video',
        mainVideoIndex: 0,
        thumbUrl: '',
        videos: [
          {
            localPath: 'output/missing.mp4',
            videoUrl: '/output/missing.mp4',
            thumbUrl: '',
            assetId: 'asset-1',
          },
        ],
      },
      {
        fetchVideoFirstFrameThumbFromServer() {
          return Promise.reject(new Error('Invalid media source path'));
        },
      },
    );
    (await _0x7b5556._loadAndDisplayVideo(), await Promise.resolve(), await Promise.resolve());
    const _0x94c58d = _0x47017e.state.nodes[_0x7b5556.nodeId];
    (assert.notEqual(_0x94c58d.mediaUnavailable, true),
      assert.equal(_0x94c58d.mediaUnavailableSource, undefined),
      assert.notEqual(_0x94c58d.videos[0].mediaUnavailable, true),
      assert.equal(_0x94c58d.videos[0].mediaUnavailableSource, undefined),
      assert.equal(_0x94c58d.videoThumbUnavailableSource, '/output/missing.mp4'),
      assert.equal(_0x94c58d.videos[0].videoThumbUnavailableSource, '/output/missing.mp4'),
      assert.equal(_0x94c58d.videos[0].thumbUrl, ''),
      assert.equal(_0xc88b74()[0].context.nodeId, _0x7b5556.nodeId),
      assert.equal(_0xc88b74()[0].context.assetId, 'asset-1'));
  }),
  test('video result render: 失败视频结果直接显示错误卡片', async () => {
    const { ctx: _0x21f2dd } = createContext({
      id: 'ai-video-error-result',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ error: 'Seedance upstream failed' }],
    });
    (await _0x21f2dd._loadAndDisplayVideo(),
      assert.equal(_0x21f2dd._placeholderEl.style.display, 'none'),
      assert.equal(_0x21f2dd._multiErrorEls.length, 1),
      assert.equal(_0x21f2dd._multiErrorEls[0].className, 'gen-error-card'),
      assert.equal(_0x21f2dd._multiErrorEls[0].children[1].textContent, '生成失败'),
      assert.equal(_0x21f2dd._multiErrorEls[0].children[2].textContent, 'Seedance upstream failed'));
  }),
  test('video result render: 仅有任务失败状态时也在节点内显示错误', async () => {
    const { ctx: _0x590b2d } = createContext({
        id: 'ai-video-job-error',
        type: 'ai-video',
        jobStatus: 'error',
        jobError: 'Seedance upstream failed',
        videos: [],
      }),
      _0x2a899c = new FakeElement('div');
    ((_0x590b2d._ensureStatusOverlayEl = () => _0x2a899c),
      await _0x590b2d._loadAndDisplayVideo(),
      assert.equal(_0x590b2d._placeholderEl.style.display, 'none'),
      assert.equal(_0x2a899c.children.length, 1),
      assert.equal(_0x2a899c.children[0].className, 'gen-error-card'),
      assert.equal(_0x2a899c.children[0].children[2].textContent, 'Seedance upstream failed'));
  }),
  test('video result render: failure message uses unified task state', () => {
    const { ctx: _0x1a4206 } = createContext({
      id: 'ai-video-unified-failure',
      type: 'ai-video',
      videos: [],
    });
    (assert.equal(
      _0x1a4206._getGenerationFailureMessage({
        asyncTaskStatus: 'failed',
        asyncTaskError: 'Async provider failed',
      }),
      'Async provider failed',
    ),
      assert.equal(
        _0x1a4206._getGenerationFailureMessage({
          isGenerating: true,
          rhTaskStatus: 'failed',
          rhStatusMessage: 'RunningHub failed',
        }),
        'RunningHub failed',
      ),
      assert.equal(
        _0x1a4206._getGenerationFailureMessage({
          provider: 'dreamina',
          isGenerating: true,
          jobStatus: 'running',
        }),
        '',
      ));
  }),
  test('video result render: 切换主视频后新的 poster 主预览仍保持懒加载', async () => {
    const { ctx: _0x1cc178, store: _0x1f3fca } = createContext({
      id: 'ai-video-switch-main',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [
        { localPath: 'output/a.mp4', thumbUrl: '/output/a.jpg' },
        { localPath: 'output/b.mp4', thumbUrl: '/output/b.jpg' },
      ],
    });
    (await _0x1cc178._loadAndDisplayVideo(),
      assert.equal(_0x1cc178._multiLayerEls[0].preload, 'none'),
      assert.equal(_0x1cc178._multiLayerEls[1].preload, 'none'),
      assert.equal(_0x1cc178._multiLayerEls[0].getAttribute('src'), ''),
      assert.equal(_0x1cc178._multiLayerEls[1].getAttribute('src'), ''),
      (_0x1f3fca.state.nodes[_0x1cc178.nodeId] = {
        ..._0x1f3fca.state.nodes[_0x1cc178.nodeId],
        mainVideoIndex: 1,
      }),
      (_0x1cc178._data = _0x1f3fca.state.nodes[_0x1cc178.nodeId]),
      await _0x1cc178._loadAndDisplayVideo(),
      assert.equal(_0x1cc178._multiLayerEls[0].preload, 'none'),
      assert.equal(_0x1cc178._multiLayerEls[1].preload, 'none'),
      assert.equal(_0x1cc178._multiLayerEls[0].getAttribute('src'), ''),
      assert.equal(_0x1cc178._multiLayerEls[1].getAttribute('src'), ''));
  }),
  test('video result render: expanded result cells with posters stay lazy', async () => {
    const { ctx: _0x5a14e9 } = createContext({
      id: 'ai-video-expanded-lazy',
      type: 'ai-video',
      mainVideoIndex: 0,
      isVideosExpanded: true,
      videos: [
        { localPath: 'output/a.mp4', thumbUrl: '/output/a.jpg' },
        { localPath: 'output/b.mp4', thumbUrl: '/output/b.jpg' },
        { localPath: 'output/c.mp4', thumbUrl: '/output/c.jpg' },
      ],
    });
    (await _0x5a14e9._loadAndDisplayVideo(), assert.equal(_0x5a14e9._multiLayerEls.length, 3));
    for (const _0x903609 of _0x5a14e9._multiLayerEls) {
      (assert.equal(_0x903609.preload, 'none'), assert.equal(_0x903609.getAttribute('src'), ''));
    }
    const _0x53bfdb = _0x5a14e9._expandPanel.querySelectorAll('video');
    assert.equal(_0x53bfdb.length, 2);
    for (const _0xbbea14 of _0x53bfdb) {
      (assert.equal(_0xbbea14.autoplay, false),
        assert.equal(_0xbbea14.loop, false),
        assert.equal(_0xbbea14.preload, 'none'),
        assert.equal(_0xbbea14.getAttribute('src'), ''),
        assert.match(_0xbbea14.poster, /^http:\/\/local\/output\//));
    }
    (assert.equal(await _0x5a14e9._ensureVideoSrcFor(_0x53bfdb[0]), true),
      assert.equal(_0x53bfdb[0].preload, 'auto'),
      assert.match(_0x53bfdb[0].getAttribute('src'), /^http:\/\/local\/output\/[bc]\.mp4$/),
      assert.equal(_0x53bfdb[0].loadCount, 0));
  }));
