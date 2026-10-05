import test from 'node:test';
import assert from 'node:assert/strict';
import { createVideoNodeResultRenderModule } from './resultRenderModule.js';
const previousDocument = globalThis.document,
  previousRequestAnimationFrame = globalThis.requestAnimationFrame;
function createStyleStub() {
  return {
    setProperty(value, item) {
      this[value] = String(item);
    },
    removeProperty(key) {
      delete this[key];
    },
  };
}
class FakeClassList {
  constructor(index) {
    ((this._owner = index), (this._set = new Set()));
  }
  ['add'](...args) {
    for (const result of args) {
      if (result) this._set.add(String(result));
    }
    this._sync();
  }
  ['remove'](...args2) {
    for (const data of args2) {
      this._set.delete(String(data));
    }
    this._sync();
  }
  ['contains'](options) {
    return this._set.has(String(options));
  }
  ['_sync']() {
    this._owner.className = Array.from(this._set).join(' ');
  }
}
class FakeElement {
  constructor(target) {
    ((this.tagName = String(target || 'div').toUpperCase()),
      (this.children = []),
      (this.parentNode = null),
      (this.style = createStyleStub()),
      (this.dataset = {}),
      (this.className = ''),
      (this.classList = new FakeClassList(this)),
      (this.innerHTML = ''),
      (this.offsetWidth = 320),
      (this.offsetHeight = 180),
      (this.offsetTop = 0),
      (this.textContent = ''));
  }
  ['appendChild'](el) {
    if (!el) return el;
    if (el.parentNode) el.parentNode.removeChild(el);
    return ((el.parentNode = this), this.children.push(el), el);
  }
  ['removeChild'](el2) {
    const count = this.children.indexOf(el2);
    return (count >= 0 && (this.children.splice(count, 1), (el2.parentNode = null)), el2);
  }
  ['remove']() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
  ['addEventListener']() {}
  ['querySelectorAll'](source) {
    if (source === 'video') {
      const list = [],
        handler = (el3) => {
          for (const next of el3.children || []) {
            if (next.tagName === 'VIDEO') list.push(next);
            handler(next);
          }
        };
      return (handler(this), list);
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
  set ['src'](current) {
    this.setAttribute('src', current);
  }
  get ['poster']() {
    return this.getAttribute('poster') || '';
  }
  set ['poster'](entry) {
    this.setAttribute('poster', entry);
  }
  ['getAttribute'](record) {
    return this._attrs.get(String(record)) || '';
  }
  ['setAttribute'](payload, handle) {
    this._attrs.set(String(payload), String(handle));
  }
  ['removeAttribute'](state) {
    this._attrs.delete(String(state));
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
    createElement(config) {
      if (String(config).toLowerCase() === 'video') return new FakeVideoElement();
      return new FakeElement(config);
    },
  };
}
function createStore(args3) {
  const state2 = { nodes: { [args3.id]: { ...args3 } } };
  return {
    state: state2,
    getState() {
      return state2;
    },
    getIncomingEdges() {
      return [];
    },
    updateNodeData(scope, args4) {
      const args5 = state2.nodes[scope] || {};
      state2.nodes[scope] = { ...args5, ...args4 };
    },
  };
}
function createContext(nodeId, showVideoMeta = {}) {
  const store = createStore(nodeId);
  store.state.ui = { showVideoMeta: showVideoMeta.showVideoMeta === true };
  let input = 0,
    list2 = [];
  const videoNodeResultRenderModule = createVideoNodeResultRenderModule({
      store: store,
      api: {
        async fetchVideoMetaFromServer() {
          input += 1;
          if (typeof showVideoMeta.fetchVideoMetaFromServer === 'function')
            return showVideoMeta.fetchVideoMetaFromServer();
          return { success: false };
        },
        fetchVideoFirstFrameThumbFromServer(src, context) {
          list2.push({ src: src, context: context });
          if (typeof showVideoMeta.fetchVideoFirstFrameThumbFromServer === 'function')
            return showVideoMeta.fetchVideoFirstFrameThumbFromServer(src, context);
          return Promise.resolve({ url: '' });
        },
      },
      getImage: async () => null,
      ensureThumbDecoded: () => {},
      buildApiUrl: (output) => 'http://local' + String(output || ''),
      VideoKeyingController: {
        isActiveFor() {
          return false;
        },
      },
    }),
    previewEl = new FakeElement('div'),
    _root = new FakeElement('div'),
    _placeholderEl = new FakeElement('div'),
    ctx = Object.assign(Object.create(videoNodeResultRenderModule), {
      nodeId: nodeId.id,
      _data: store.state.nodes[nodeId.id],
      _root: _root,
      previewEl: previewEl,
      _placeholderEl: _placeholderEl,
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
    ctx: ctx,
    store: store,
    getFetchVideoMetaCallCount: () => input,
    getFetchVideoThumbCalls: () => list2.slice(),
  };
}
(test.before(() => {
  ((globalThis.document = createDocumentStub()),
    (globalThis.requestAnimationFrame = (handler2) => {
      return (handler2(), 1);
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
    const { ctx: ctx2 } = createContext({
      id: 'ai-video-main-preload',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    (await ctx2._loadAndDisplayVideo(),
      assert.equal(ctx2._multiLayerEls.length, 1),
      assert.equal(ctx2._multiLayerEls[0].preload, 'none'),
      assert.equal(ctx2._multiLayerEls[0].getAttribute('src'), ''),
      assert.equal(ctx2._multiLayerEls[0].poster, 'http://local/output/main.jpg'));
  }),
  test('video result render: deferred media shows poster without creating video', async () => {
    const { ctx: ctx3 } = createContext({
      id: 'ai-video-deferred-poster',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    ((ctx3._rendererMediaDeferred = true),
      await ctx3._loadAndDisplayVideo(),
      assert.equal(ctx3._multiLayerEls.length, 0),
      assert.equal(ctx3._multiVideosContainer, null),
      assert.equal(ctx3._placeholderEl.style.display, 'none'),
      assert.equal(ctx3._deferredPosterImgEl?.src, 'http://local/output/main.jpg'));
  }),
  test('video result render: 无 poster 的主预览仍加载视频源生成首帧', async () => {
    const { ctx: ctx4 } = createContext({
      id: 'ai-video-main-no-poster',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4' }],
    });
    (await ctx4._loadAndDisplayVideo(),
      assert.equal(ctx4._multiLayerEls.length, 1),
      assert.equal(ctx4._multiLayerEls[0].preload, 'auto'),
      assert.equal(ctx4._multiLayerEls[0].getAttribute('src'), 'http://local/output/main.mp4'));
  }),
  test('video result render: 主预览交互时才接入视频源', async () => {
    const { ctx: ctx5 } = createContext({
      id: 'ai-video-main-ensure-src',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    await ctx5._loadAndDisplayVideo();
    const value2 = ctx5._multiLayerEls[0];
    (assert.equal(value2.preload, 'none'),
      assert.equal(value2.getAttribute('src'), ''),
      assert.equal(await ctx5._ensureVideoSrcFor(value2), true),
      assert.equal(value2.preload, 'auto'),
      assert.equal(value2.getAttribute('src'), 'http://local/output/main.mp4'),
      assert.equal(value2.loadCount, 0));
  }),
  test('video result render: 播放接源时主动触发媒体加载', async () => {
    const { ctx: ctx6 } = createContext({
      id: 'ai-video-main-ensure-src-playback',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
    });
    await ctx6._loadAndDisplayVideo();
    const value3 = ctx6._multiLayerEls[0];
    (assert.equal(value3.preload, 'none'),
      assert.equal(value3.getAttribute('src'), ''),
      assert.equal(await ctx6._ensureVideoSrcFor(value3, { forPlayback: true }), true),
      assert.equal(value3.preload, 'auto'),
      assert.equal(value3.getAttribute('src'), 'http://local/output/main.mp4'),
      assert.equal(value3.loadCount, 1));
  }),
  test('video result render: poster main preview does not fetch video before interaction', async () => {
    const value4 = globalThis.window,
      value5 = globalThis.location,
      value6 = globalThis.fetch,
      value7 = globalThis.URL.createObjectURL;
    ((globalThis.window = { electronAPI: {} }),
      (globalThis.location = { href: 'http://local/', origin: 'http://local' }));
    const list3 = [];
    ((globalThis.fetch = async (value8) => {
      return (
        list3.push(value8),
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
      const { ctx: ctx7 } = createContext({
        id: 'ai-video-main-poster-warm',
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
      });
      (await ctx7._loadAndDisplayVideo(),
        await new Promise((value9) => setTimeout(value9, 0)),
        assert.equal(ctx7._multiLayerEls[0].preload, 'none'),
        assert.equal(ctx7._multiLayerEls[0].getAttribute('src'), ''),
        assert.deepEqual(list3, []));
    } finally {
      if (typeof value4 === 'undefined') delete globalThis.window;
      else globalThis.window = value4;
      if (typeof value5 === 'undefined') delete globalThis.location;
      else globalThis.location = value5;
      ((globalThis.fetch = value6), (globalThis.URL.createObjectURL = value7));
    }
  }),
  test('video result render: 视频节点信息关闭时不请求后端元信息', async () => {
    const { ctx: ctx8, getFetchVideoMetaCallCount: getFetchVideoMetaCallCount } = createContext(
      { id: 'ai-video-meta-off', type: 'ai-video', videos: [{ localPath: 'output/main.mp4' }] },
      { showVideoMeta: false },
    );
    (await ctx8._maybeFetchVideoMeta('/output/main.mp4'), assert.equal(getFetchVideoMetaCallCount(), 0));
  }),
  test('video result render: 视频节点信息开启时才请求后端元信息', async () => {
    const { ctx: ctx9, getFetchVideoMetaCallCount: getFetchVideoMetaCallCount2 } = createContext(
      { id: 'ai-video-meta-on', type: 'ai-video', videos: [{ localPath: 'output/main.mp4' }] },
      { showVideoMeta: true },
    );
    (await ctx9._maybeFetchVideoMeta('/output/main.mp4'), assert.equal(getFetchVideoMetaCallCount2(), 1));
  }),
  test('video result render: failed thumbnail backfill keeps result video usable', async () => {
    const {
      ctx: ctx10,
      store: store2,
      getFetchVideoThumbCalls: getFetchVideoThumbCalls,
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
    (await ctx10._loadAndDisplayVideo(), await Promise.resolve(), await Promise.resolve());
    const value10 = store2.state.nodes[ctx10.nodeId];
    (assert.notEqual(value10.mediaUnavailable, true),
      assert.equal(value10.mediaUnavailableSource, undefined),
      assert.notEqual(value10.videos[0].mediaUnavailable, true),
      assert.equal(value10.videos[0].mediaUnavailableSource, undefined),
      assert.equal(value10.videoThumbUnavailableSource, '/output/missing.mp4'),
      assert.equal(value10.videos[0].videoThumbUnavailableSource, '/output/missing.mp4'),
      assert.equal(value10.videos[0].thumbUrl, ''),
      assert.equal(getFetchVideoThumbCalls()[0].context.nodeId, ctx10.nodeId),
      assert.equal(getFetchVideoThumbCalls()[0].context.assetId, 'asset-1'));
  }),
  test('video result render: 失败视频结果直接显示错误卡片', async () => {
    const { ctx: ctx11 } = createContext({
      id: 'ai-video-error-result',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ error: 'Seedance upstream failed' }],
    });
    (await ctx11._loadAndDisplayVideo(),
      assert.equal(ctx11._placeholderEl.style.display, 'none'),
      assert.equal(ctx11._multiErrorEls.length, 1),
      assert.equal(ctx11._multiErrorEls[0].className, 'gen-error-card'),
      assert.equal(ctx11._multiErrorEls[0].children[1].textContent, '生成失败'),
      assert.equal(ctx11._multiErrorEls[0].children[2].textContent, 'Seedance upstream failed'));
  }),
  test('video result render: 仅有任务失败状态时也在节点内显示错误', async () => {
    const { ctx: ctx12 } = createContext({
        id: 'ai-video-job-error',
        type: 'ai-video',
        jobStatus: 'error',
        jobError: 'Seedance upstream failed',
        videos: [],
      }),
      el4 = new FakeElement('div');
    ((ctx12._ensureStatusOverlayEl = () => el4),
      await ctx12._loadAndDisplayVideo(),
      assert.equal(ctx12._placeholderEl.style.display, 'none'),
      assert.equal(el4.children.length, 1),
      assert.equal(el4.children[0].className, 'gen-error-card'),
      assert.equal(el4.children[0].children[2].textContent, 'Seedance upstream failed'));
  }),
  test('video result render: failure message uses unified task state', () => {
    const { ctx: ctx13 } = createContext({
      id: 'ai-video-unified-failure',
      type: 'ai-video',
      videos: [],
    });
    (assert.equal(
      ctx13._getGenerationFailureMessage({
        asyncTaskStatus: 'failed',
        asyncTaskError: 'Async provider failed',
      }),
      'Async provider failed',
    ),
      assert.equal(
        ctx13._getGenerationFailureMessage({
          isGenerating: true,
          rhTaskStatus: 'failed',
          rhStatusMessage: 'RunningHub failed',
        }),
        'RunningHub failed',
      ),
      assert.equal(
        ctx13._getGenerationFailureMessage({
          provider: 'dreamina',
          isGenerating: true,
          jobStatus: 'running',
        }),
        '',
      ));
  }),
  test('video result render: 切换主视频后新的 poster 主预览仍保持懒加载', async () => {
    const { ctx: ctx14, store: store3 } = createContext({
      id: 'ai-video-switch-main',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [
        { localPath: 'output/a.mp4', thumbUrl: '/output/a.jpg' },
        { localPath: 'output/b.mp4', thumbUrl: '/output/b.jpg' },
      ],
    });
    (await ctx14._loadAndDisplayVideo(),
      assert.equal(ctx14._multiLayerEls[0].preload, 'none'),
      assert.equal(ctx14._multiLayerEls[1].preload, 'none'),
      assert.equal(ctx14._multiLayerEls[0].getAttribute('src'), ''),
      assert.equal(ctx14._multiLayerEls[1].getAttribute('src'), ''),
      (store3.state.nodes[ctx14.nodeId] = {
        ...store3.state.nodes[ctx14.nodeId],
        mainVideoIndex: 1,
      }),
      (ctx14._data = store3.state.nodes[ctx14.nodeId]),
      await ctx14._loadAndDisplayVideo(),
      assert.equal(ctx14._multiLayerEls[0].preload, 'none'),
      assert.equal(ctx14._multiLayerEls[1].preload, 'none'),
      assert.equal(ctx14._multiLayerEls[0].getAttribute('src'), ''),
      assert.equal(ctx14._multiLayerEls[1].getAttribute('src'), ''));
  }),
  test('video result render: expanded result cells with posters stay lazy', async () => {
    const { ctx: ctx15 } = createContext({
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
    (await ctx15._loadAndDisplayVideo(), assert.equal(ctx15._multiLayerEls.length, 3));
    for (const value11 of ctx15._multiLayerEls) {
      (assert.equal(value11.preload, 'none'), assert.equal(value11.getAttribute('src'), ''));
    }
    const list4 = ctx15._expandPanel.querySelectorAll('video');
    assert.equal(list4.length, 2);
    for (const value12 of list4) {
      (assert.equal(value12.autoplay, false),
        assert.equal(value12.loop, false),
        assert.equal(value12.preload, 'none'),
        assert.equal(value12.getAttribute('src'), ''),
        assert.match(value12.poster, /^http:\/\/local\/output\//));
    }
    (assert.equal(await ctx15._ensureVideoSrcFor(list4[0]), true),
      assert.equal(list4[0].preload, 'auto'),
      assert.match(list4[0].getAttribute('src'), /^http:\/\/local\/output\/[bc]\.mp4$/),
      assert.equal(list4[0].loadCount, 0));
  }));
