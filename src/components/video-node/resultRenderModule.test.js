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
function createContext(nodeId, showVideoMeta = {}, overrides = {}) {
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
      getImage: overrides.getImage ?? (async () => null),
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
      { showVideoMeta: false }
    );
    (await ctx8._maybeFetchVideoMeta('/output/main.mp4'),
      assert.equal(getFetchVideoMetaCallCount(), 0));
  }),
  test('video result render: 视频节点信息开启时才请求后端元信息', async () => {
    const { ctx: ctx9, getFetchVideoMetaCallCount: getFetchVideoMetaCallCount2 } = createContext(
      { id: 'ai-video-meta-on', type: 'ai-video', videos: [{ localPath: 'output/main.mp4' }] },
      { showVideoMeta: true }
    );
    (await ctx9._maybeFetchVideoMeta('/output/main.mp4'),
      assert.equal(getFetchVideoMetaCallCount2(), 1));
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
      }
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
      'Async provider failed'
    ),
      assert.equal(
        ctx13._getGenerationFailureMessage({
          isGenerating: true,
          rhTaskStatus: 'failed',
          rhStatusMessage: 'RunningHub failed',
        }),
        'RunningHub failed'
      ),
      assert.equal(
        ctx13._getGenerationFailureMessage({
          provider: 'dreamina',
          isGenerating: true,
          jobStatus: 'running',
        }),
        ''
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
test('video result render: thumbId 回退接源走追踪 objectURL 缓存', async () => {
  const prevCreateObjectURL = globalThis.URL.createObjectURL,
    prevRevokeObjectURL = globalThis.URL.revokeObjectURL;
  let revoked = [];
  globalThis.URL.createObjectURL = () => 'blob:tracked-thumb-1';
  globalThis.URL.revokeObjectURL = (url) => {
    revoked.push(url);
  };
  try {
    const { ctx: ctx16 } = createContext(
      {
        id: 'ai-video-thumb-cache',
        type: 'ai-video',
        mainVideoIndex: 0,
        videos: [{ thumbId: 'thumb-1' }],
      },
      {},
      { getImage: async () => new Blob(['video'], { type: 'video/mp4' }) }
    );
    ((ctx16._cachedVideoUrls = new Map()),
      (ctx16._cachedVideoUrlLoads = new Map()),
      (ctx16._videoObjectUrlLifecycleEpoch = 0),
      (ctx16._videoObjectUrlsDisposed = false));
    const url = await ctx16._resolveCachedVideoObjectUrl('thumb-1');
    assert.equal(url, 'blob:tracked-thumb-1');
    assert.equal(ctx16._cachedVideoUrls.get('thumb-1'), 'blob:tracked-thumb-1');
    // 并发去重：同一 thumbId 二次请求复用 in-flight promise，不再打 getImage。
    assert.equal(await ctx16._resolveCachedVideoObjectUrl('thumb-1'), 'blob:tracked-thumb-1');
    assert.deepEqual(revoked, []);
    // 激活集不含该 thumbId 时直接短路，不触碰缓存。
    assert.equal(await ctx16._resolveCachedVideoObjectUrl('thumb-gone'), '');
    assert.equal(ctx16._cachedVideoUrls.has('thumb-gone'), false);
  } finally {
    globalThis.URL.createObjectURL = prevCreateObjectURL;
    globalThis.URL.revokeObjectURL = prevRevokeObjectURL;
  }
});
test('video result render: 缓存释放时同步分离消费者并撤销 URL', () => {
  const prevRevokeObjectURL = globalThis.URL.revokeObjectURL;
  globalThis.URL.revokeObjectURL = () => {};
  try {
    const { ctx: ctx17, store: store4 } = createContext({
      id: 'ai-video-release-consumers',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ thumbId: 'thumb-live' }],
    });
    const el = new FakeVideoElement();
    ((el.dataset.idx = '0'),
      el.setAttribute('src', 'blob:tracked-thumb-stale'),
      (el.loadCount = 0));
    ctx17._multiLayerEls = [el];
    ctx17._cachedVideoUrls = new Map([
      ['thumb-stale', 'blob:tracked-thumb-stale'],
      ['thumb-live', 'blob:tracked-thumb-live'],
    ]);
    const released = ctx17._syncCachedVideoObjectUrls(store4.state.nodes[ctx17.nodeId]);
    (assert.equal(released, 1),
      assert.equal(ctx17._cachedVideoUrls.has('thumb-stale'), false),
      assert.equal(ctx17._cachedVideoUrls.has('thumb-live'), true),
      // 引用旧 URL 的视频元素被摘掉 src 并触发一次 load 收尾。
      assert.equal(el.getAttribute('src'), ''),
      assert.equal(el.loadCount, 1));
  } finally {
    globalThis.URL.revokeObjectURL = prevRevokeObjectURL;
  }
});
test('video result render: dispose 置位后缓存解析全部短路', async () => {
  const { ctx: ctx18 } = createContext(
    {
      id: 'ai-video-dispose',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ thumbId: 'thumb-1' }],
    },
    {},
    { getImage: async () => new Blob(['video'], { type: 'video/mp4' }) }
  );
  ctx18._cachedVideoUrls = new Map([['thumb-1', 'blob:tracked-before-dispose']]);
  const released = ctx18._disposeCachedVideoObjectUrls();
  (assert.equal(released, 1),
    assert.equal(ctx18._cachedVideoUrls.size, 0),
    assert.equal(ctx18._videoObjectUrlsDisposed, true),
    assert.equal(await ctx18._resolveCachedVideoObjectUrl('thumb-1'), ''));
});
test('video result render: 接源竞态翻页后不写旧源', async () => {
  const { ctx: ctx19 } = createContext(
    {
      id: 'ai-video-attach-race',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ thumbId: 'thumb-1' }],
    },
    {},
    {
      getImage: async () => {
        await Promise.resolve();
        return new Blob(['video'], { type: 'video/mp4' });
      },
    }
  );
  const prevCreateObjectURL = globalThis.URL.createObjectURL;
  globalThis.URL.createObjectURL = () => 'blob:tracked-race';
  try {
    ((ctx19._cachedVideoUrls = new Map()),
      (ctx19._videoSourceAttachToken = 0),
      (ctx19._videoSourceAttachTokens = new WeakMap()));
    const el = new FakeVideoElement();
    el.dataset.idx = '0';
    const pending = ctx19._ensureVideoSrcFor(el, { forPlayback: true });
    // 加载在途时节点翻页，token 失效。
    ctx19._videoSourceAttachToken = 1;
    assert.equal(await pending, false);
    assert.equal(el.getAttribute('src'), '');
    assert.equal(el.loadCount, 0);
  } finally {
    globalThis.URL.createObjectURL = prevCreateObjectURL;
  }
});
test('video result render: poster 标记在可见帧就绪后清掉 poster 属性', () => {
  const { ctx: ctx20 } = createContext({
    id: 'ai-video-poster-clear',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'output/main.mp4', thumbUrl: '/output/main.jpg' }],
  });
  const el = new FakeVideoElement();
  (el.setAttribute('poster', 'http://local/output/main.jpg'),
    el.setAttribute('src', 'blob:tracked-poster-src'));
  // fake video 未上报已渲染帧：走 watchVideoFramePresentation 路径，不抛错即可。
  assert.equal(ctx20._clearPreviewPosterForVisibleFrame(el), false);
  assert.equal(el.poster, 'http://local/output/main.jpg');
  // 直接标记：poster 属性存在时摘除并返回 true。
  assert.equal(ctx20._markPreviewPosterClearedForPlayback(el), true);
  assert.equal(el.poster, '');
  assert.equal(ctx20._isPreviewPosterClearedForPlayback(el), true);
});

// ---------------------------------------------------------------------------
// 201 批：结果层可见性 / 分层 / 媒体键。
// 这些函数每帧都会跑，任何「半隐藏」或「换片没换 key」都会直接表现为鬼影与错帧。
// ---------------------------------------------------------------------------
const resultRenderModuleNs = await import('./resultRenderModule.js');
const internals201 = resultRenderModuleNs._resultRenderModuleInternalsForTest;

function makeResultElement() {
  const classes = new Set();
  return {
    hidden: false,
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        if (force) classes.add(name);
        else classes.delete(name);
      },
    },
    classes,
  };
}

test('resultRenderModule: 隐藏/显示同时翻转 hidden 与 is-hidden', () => {
  const element = makeResultElement();
  internals201.setVideoResultElementVisible(element, false);
  (assert.equal(element.hidden, true, 'hidden 属性要跟上'),
    assert.equal(element.classes.has('is-hidden'), true, '样式类名也要跟上，否则仍占位'));
  internals201.setVideoResultElementVisible(element, true);
  (assert.equal(element.hidden, false),
    assert.equal(element.classes.has('is-hidden'), false),
    assert.equal(internals201.isVideoResultElementVisible(element), true));
  internals201.setVideoResultElementVisible(null, true);
  assert.equal(internals201.isVideoResultElementVisible(null), false, '空元素视为不可见且不抛');
});

test('resultRenderModule: 主结果层切换带 z-index，非法层级不写入', () => {
  const element = makeResultElement();
  internals201.setVideoResultLayerActive(element, true, 12);
  (assert.equal(element.classes.has('is-main-result'), true),
    assert.equal(element.style.zIndex, '12', '层级要转成字符串写进 style'),
    assert.equal(element.hidden, false));
  internals201.setVideoResultLayerActive(element, false, 'not-a-number');
  (assert.equal(element.classes.has('is-main-result'), false, '退场要摘标记'),
    assert.equal(element.style.zIndex, '12', '非法层级保持原值，不能写成 NaN'));
});

test('resultRenderModule: 几何动画样式一次性合并', () => {
  const element = makeResultElement();
  element.style.transform = 'translate(0px, 0px)';
  internals201.applyVideoResultGeometryAnimationStyle(element, {
    transform: 'translate(4px, 8px)',
    opacity: '0.5',
  });
  (assert.equal(element.style.transform, 'translate(4px, 8px)'),
    assert.equal(element.style.opacity, '0.5'));
  internals201.applyVideoResultGeometryAnimationStyle(null, { opacity: '1' });
  internals201.applyVideoResultGeometryAnimationStyle(element, null);
  assert.equal(element.style.opacity, '0.5', '空补丁不该清样式');
});

test('resultRenderModule: 媒体键按优先级取第一个非空来源', () => {
  (assert.equal(
    internals201.getVideoResultMediaKey({ localPath: ' /a.mp4 ', videoUrl: '/b.mp4' }),
    '/a.mp4',
    'localPath 优先于 videoUrl，并 trim'
  ),
    assert.equal(
      internals201.getVideoResultMediaKey({}, { src: '/fallback.mp4' }),
      '/fallback.mp4',
      '主对象取不到时回落到当前选中项'
    ),
    assert.equal(
      internals201.getVideoResultMediaKey({ videoUrl: '  ' }),
      '',
      '全空给空串而不是 undefined'
    ),
    assert.equal(
      internals201.getVideoResultMediaKey({ thumbId: 'thumb-1' }),
      'thumb-1',
      '只有 thumbId 也要能用'
    ));
});

test('resultRenderModule: 切换主视频的呈现补丁只搬运白名单字段', () => {
  const patch = resultRenderModuleNs.buildSelectedVideoResultPresentationPatch(
    [
      { videoUrl: '/0.mp4', localPath: '/0.local', prompt: '不该出现' },
      { videoUrl: '/1.mp4', posterUrl: '/1.png', mediaUnavailable: true },
    ],
    1
  );
  (assert.equal(patch.mainVideoIndex, 1),
    assert.equal(patch.videoUrl, '/1.mp4'),
    assert.equal(patch.posterUrl, '/1.png'),
    assert.equal(patch.mediaUnavailable, true),
    assert.equal(patch.isVideosExpanded, false, '切主视频要收起列表'),
    assert.equal('prompt' in patch, false, '非白名单字段不能被带进去'),
    assert.equal(patch.localPath, '', '缺失字段补空串'));
  // 索引越界与 NaN 都夹到合法范围，避免拿到 undefined 再炸。
  (assert.equal(
    resultRenderModuleNs.buildSelectedVideoResultPresentationPatch([{ videoUrl: '/a' }], 9)
      .mainVideoIndex,
    0
  ),
    assert.equal(
      resultRenderModuleNs.buildSelectedVideoResultPresentationPatch([{ videoUrl: '/a' }], -3)
        .mainVideoIndex,
      0
    ),
    assert.equal(
      resultRenderModuleNs.buildSelectedVideoResultPresentationPatch(
        [{ videoUrl: '/a' }, { videoUrl: '/b' }],
        Number.NaN
      ).mainVideoIndex,
      0
    ),
    assert.equal(
      resultRenderModuleNs.buildSelectedVideoResultPresentationPatch([], 0).mainVideoIndex,
      0
    ));
});

test('resultRenderModule: 视口忙闲判定读交互状态', () => {
  const previous = globalThis.document;
  const makeDocument = (classes) => ({
    body: { classList: { contains: (name) => classes.includes(name) } },
  });
  try {
    globalThis.document = makeDocument([]);
    assert.equal(internals201.isVideoResultViewportBusy(), false, '空闲时不该判忙');
    globalThis.document = makeDocument(['is-panning']);
    assert.equal(internals201.isVideoResultViewportBusy(), true, '平移中要判忙');
    globalThis.document = makeDocument(['is-zooming']);
    assert.equal(internals201.isVideoResultViewportBusy(), true, '缩放中要判忙');
  } finally {
    globalThis.document = previous;
  }
});

// ---------------------------------------------------------------------------
// 202 批：媒体生命周期契约。
// 这批方法原本在结果模块里**完全不存在**，但有 5 处外部调用点用 `?.()` 调它们
// （协调器挂起、薄呈现水合、recovery 摘除），静默 no-op 就是「功能看着在、实际没跑」。
// ---------------------------------------------------------------------------
test('resultRenderModule: 终态判定——失败任务或主视频带 error 必须继续渲染', () => {
  const { ctx: normal } = createContext({
    id: 'terminal-normal',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  assert.equal(normal._mustRenderTerminalVideoState(normal._data), false, '正常结果不算终态');

  const { ctx: failed } = createContext({
    id: 'terminal-failed',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
    asyncTaskStatus: 'error',
    asyncTaskError: '模型超时',
  });
  assert.equal(
    failed._mustRenderTerminalVideoState(failed._data),
    true,
    '任务失败要判终态，否则媒体推迟会把错误提示一起挡掉'
  );

  const { ctx: brokenVideo } = createContext({
    id: 'terminal-broken',
    type: 'ai-video',
    mainVideoIndex: 1,
    videos: [{ localPath: 'a.mp4' }, { localPath: 'b.mp4', error: '转码失败' }],
  });
  assert.equal(
    brokenVideo._mustRenderTerminalVideoState(brokenVideo._data),
    true,
    '主视频自带 error 也算终态'
  );

  const { ctx: outOfRange } = createContext({
    id: 'terminal-oor',
    type: 'ai-video',
    mainVideoIndex: 5,
    videos: [{ localPath: 'a.mp4' }, { localPath: 'b.mp4', error: '坏的' }],
  });
  assert.equal(
    outOfRange._mustRenderTerminalVideoState(outOfRange._data),
    false,
    '越界索引回落到 videos[0]，不能拿别的条目的 error 误判'
  );

  assert.equal(normal._mustRenderTerminalVideoState(null), false, '空数据不能抛，按非终态处理');
});

test('resultRenderModule: 失败态不回退海报，避免把失败伪装成成功', () => {
  const { ctx: ok } = createContext({
    id: 'poster-ok',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4', thumbUrl: '/a.jpg' }],
  });
  assert.equal(ok._resolveDeferredVideoPosterUrl(), 'http://local/a.jpg');

  const { ctx: failed } = createContext({
    id: 'poster-failed',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4', thumbUrl: '/a.jpg' }],
    posterUrl: '/node.jpg',
    asyncTaskStatus: 'error',
    asyncTaskError: '失败',
  });
  assert.equal(failed._resolveDeferredVideoPosterUrl(), '', '失败时不能拿旧海报顶上去');

  const { ctx: single } = createContext({
    id: 'poster-single',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
    posterUrl: '/node.jpg',
  });
  assert.equal(
    single._resolveDeferredVideoPosterUrl(),
    'http://local/node.jpg',
    '单条结果允许回退节点级字段'
  );

  const { ctx: multi } = createContext({
    id: 'poster-multi',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }, { localPath: 'b.mp4' }],
    posterUrl: '/node.jpg',
  });
  assert.equal(
    multi._resolveDeferredVideoPosterUrl(),
    '',
    '多条结果不能回退节点级海报，否则会串图'
  );
});

test('resultRenderModule: 海报候选只要图片，视频源不能当 poster', () => {
  const { ctx } = createContext({
    id: 'poster-candidates',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  assert.equal(
    ctx._resolveVideoResultPosterUrl({ posterUrl: '/clip.mp4', thumbUrl: '/t.png' }),
    'http://local/t.png',
    '跳过非图片候选，取下一个'
  );
  assert.equal(
    ctx._resolveVideoResultPosterUrl({ posterUrl: '/clip.mp4' }),
    '',
    '全是非图片时返回空串'
  );
  assert.equal(ctx._resolveVideoResultPosterUrl(null), '', '空条目返回空串而不是 undefined');
});

test('resultRenderModule: 结果身份键能区分不同视频、忽略空白字段', () => {
  const { ctx } = createContext({
    id: 'identity',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  assert.equal(ctx._getVideoResultIdentityKey(null), '', '空条目没有身份');
  assert.equal(ctx._getVideoResultIdentityKey({ thumbId: '   ' }), '', '全空白视为无身份');
  const left = ctx._getVideoResultIdentityKey({ videoUrl: '/a.mp4', thumbId: 't1' });
  const same = ctx._getVideoResultIdentityKey({ videoUrl: '/a.mp4', thumbId: 't1' });
  const other = ctx._getVideoResultIdentityKey({ videoUrl: '/b.mp4', thumbId: 't1' });
  assert.equal(left, same, '同样内容要给出同样的键');
  assert.notEqual(left, other, '换视频必须换键，否则全屏会停在旧片');
});

test('resultRenderModule: 结果变了要关掉陈旧全屏', () => {
  const { ctx: idle } = createContext({
    id: 'fullscreen-idle',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  assert.equal(idle._closeFullscreenForStaleResult(), false, '没开全屏时不动');

  const { ctx: stale } = createContext({
    id: 'fullscreen-stale',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  let closed = 0;
  ((stale._activeFullscreenResultIdentity = JSON.stringify(['/old.mp4', '', '', '', '', ''])),
    (stale._activeFullscreenCleanup = () => {
      closed += 1;
    }));
  assert.equal(stale._closeFullscreenForStaleResult(), true, '当前结果里没有它 → 要关');
  assert.equal(closed, 1, '清理函数必须被调用一次');
});

test('resultRenderModule: 挂起媒体会失效所有在途令牌并摘掉 src', () => {
  const { ctx } = createContext({
    id: 'suspend-media',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  const video = new FakeVideoElement();
  video.setAttribute('src', 'blob:preview');
  ctx.previewEl.appendChild(video);
  let paused = 0;
  video.pause = () => {
    paused += 1;
  };
  const epoch = Number(ctx._videoRenderEpoch || 0),
    token = Number(ctx._videoSourceAttachToken || 0);
  ctx.suspendRendererMedia();
  assert.equal(ctx._videoRenderEpoch, epoch + 1, '渲染 epoch 要前进，旧回调才会失效');
  assert.equal(ctx._videoSourceAttachToken, token + 1, '接源令牌同样要前进');
  assert.equal(ctx._rendererMediaDeferred, true, '挂起后必须是「媒体已推迟」状态');
  assert.equal(paused, 1, '要真的暂停播放');
  assert.equal(video.getAttribute('src'), '', 'src 必须摘掉，否则解码器继续跑');
});

test('resultRenderModule: 挂起前没海报就不算准备好', () => {
  const { ctx } = createContext({
    id: 'fallback-suspend',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  assert.equal(
    ctx.prepareRendererMediaFallbackForSuspend(),
    false,
    '没有海报还返回 true 会让协调器挂起后留一片空白'
  );
});

test('resultRenderModule: 没有已呈现画面时不谎报', () => {
  const { ctx } = createContext({
    id: 'presented-none',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4' }],
  });
  assert.equal(ctx.hasPresentedRendererMedia(), false, '空层级不能谎报，否则协调器会丢帧');
  ctx._multiLayerEls = [new FakeVideoElement()];
  assert.equal(ctx.hasPresentedRendererMedia(), false, '有元素但没有接源/没有呈现帧也不能报 true');
});

test('resultRenderModule: 薄呈现水合只跑一次', async () => {
  const { ctx } = createContext({
    id: 'thin-hydrate',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4', thumbUrl: '/a.jpg' }],
  });
  assert.equal(await ctx.hydrateRendererThinVideoPresentation(), false, '没标记时不该重复加载');
  ctx._rendererThinVideoHydration = true;
  // 返回的是 _loadAndDisplayVideo() 的 Promise（上游同语义），不保证返回 true；
  // 真正的契约是「标记被清掉 + 确实加载了一次」。
  await ctx.hydrateRendererThinVideoPresentation();
  assert.equal(ctx._rendererThinVideoHydration, false, '加载后必须清标记，否则每次都重载');
  assert.equal(ctx._multiLayerEls.length, 1, '水合后要真的把主预览建出来');
  assert.equal(await ctx.hydrateRendererThinVideoPresentation(), false, '第二次不再重复加载');
});

// ---------------------------------------------------------------------------
// 203 批：悬停播放收尾与「当前预览元素」定位。
// _getActivePreviewVideoEl 在上游只被调用、从未定义（previewControlsModule 有 12 处
// 调用点，其中数处非可选），仓库同样缺失——走到即 TypeError。
// ---------------------------------------------------------------------------
test('resultRenderModule: 当前预览元素取主结果层，取不到才退回唯一视频', () => {
  const { ctx } = createContext({
    id: 'active-preview-el',
    type: 'ai-video',
    mainVideoIndex: 1,
    videos: [{ localPath: 'a.mp4' }, { localPath: 'b.mp4' }],
  });
  const first = new FakeVideoElement(),
    second = new FakeVideoElement();
  ctx._multiLayerEls = [first, second];
  assert.equal(ctx._getActivePreviewVideoEl(), second, '要看主视频那一条，不是第 0 条');

  ctx._multiLayerEls = [];
  assert.equal(ctx._getActivePreviewVideoEl(), null, '容器里没有视频时返回 null，不抛');

  ctx.previewEl.appendChild(first);
  assert.equal(ctx._getActivePreviewVideoEl(), first, '只有一个视频时可以退回到它');

  ctx.previewEl.appendChild(second);
  assert.equal(
    ctx._getActivePreviewVideoEl(),
    null,
    '多个视频又无层级信息时不猜，交给调用方等就绪'
  );
});

test('resultRenderModule: 悬停播放空闲释放只在真正停住时发生', () => {
  // 注意：localPathToUrl('a.mp4') 返回空串（要求带目录），夹具必须用 output/ 前缀，
  // 否则这里断言的 resumeState 永远为 null，看起来像代码没实现。
  const { ctx } = createContext({
    id: 'idle-release',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'output/a.mp4', thumbUrl: '/a.jpg' }],
  });
  const video = new FakeVideoElement();
  video.setAttribute('src', 'blob:hover');
  video.currentTime = 4.5;
  ctx._multiLayerEls = [video];

  ctx._isHovered = true;
  assert.equal(ctx._releaseIdlePreviewHoverPlaybackMedia(), false, '悬停中不能卸源');
  ctx._isHovered = false;
  video.paused = false;
  assert.equal(ctx._releaseIdlePreviewHoverPlaybackMedia(), false, '还在播就不能卸源');

  ctx._isProgressDragging = true;
  video.paused = true;
  assert.equal(ctx._releaseIdlePreviewHoverPlaybackMedia(), false, '拖动进度时不能卸源');

  ctx._isProgressDragging = false;
  assert.equal(ctx._releaseIdlePreviewHoverPlaybackMedia(), true, '停住且空闲才卸源');
  assert.equal(video.getAttribute('src'), '', 'src 要摘掉');
  assert.equal(video.preload, 'none', '改成 preload=none，避免立刻重新拉流');
  assert.deepEqual(
    ctx._hoverPlaybackResumeState && {
      source: ctx._hoverPlaybackResumeState.source,
      time: ctx._hoverPlaybackResumeState.time,
    },
    { source: 'http://local/output/a.mp4', time: 4.5 },
    '要记住进度，下次悬停接着播'
  );
});

test('resultRenderModule: 播完时非主层不处理、悬停中自动重播', () => {
  const { ctx } = createContext({
    id: 'ended-handling',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4', thumbUrl: '/a.jpg' }],
  });
  const video = new FakeVideoElement();
  video.dataset.idx = '1';
  assert.equal(ctx._handlePreviewVideoEnded(video), false, '别的层播完不抢主层表现');

  video.dataset.idx = '0';
  video.currentTime = 9;
  ctx._isHovered = true;
  const replays = [];
  // _playPreviewVideoWithRecovery 是异步的（内部还要重接源），这里只验证被请求了重播。
  ctx._playPreviewVideoWithRecovery = (el, options) => {
    replays.push({ el, options });
    return Promise.resolve(true);
  };
  assert.equal(ctx._handlePreviewVideoEnded(video), true);
  assert.equal(video.loop, true, '悬停中要连播');
  assert.equal(video.currentTime, 0, '重播要回到开头');
  assert.equal(replays.length, 1, '要真的请求重播');
  assert.equal(replays[0].options.reason, 'hover', '悬停触发的重播要标成 hover');
  assert.equal(replays[0].options.shouldContinue(), true, '仍在悬停 → 允许继续');

  // 不在悬停、也不在手动循环：停在最后一帧并露出暂停指示器。
  const { ctx: idleCtx } = createContext({
    id: 'ended-idle',
    type: 'ai-video',
    mainVideoIndex: 0,
    videos: [{ localPath: 'a.mp4', thumbUrl: '/a.jpg' }],
  });
  const idleVideo = new FakeVideoElement();
  idleVideo.dataset.idx = '0';
  idleVideo.loop = true;
  idleVideo.paused = false;
  let pausedIndicator = 0;
  idleCtx._showPausedCenterIndicator = () => {
    pausedIndicator += 1;
  };
  assert.equal(idleCtx._handlePreviewVideoEnded(idleVideo), true);
  assert.equal(idleVideo.loop, false, '停下时要关循环，否则手动循环的残留会一直生效');
  assert.equal(idleVideo.paused, true);
  assert.equal(pausedIndicator, 1, '要露出暂停指示器');
});

// ---------------------------------------------------------------------------
// 205 批：节点信息用的视频元信息（fps / 帧数）。
// 渲染器用 `typeof x.requestVideoMetaForNodeInfo === 'function'` 守卫调用，
// AIGenVideoNode 上一直没有这个方法 → 静默跳过，节点信息面板的帧率永远空着。
// ---------------------------------------------------------------------------
test('resultRenderModule: 元信息请求对失败/不可用结果直接放弃', () => {
  const { ctx, getFetchVideoMetaCallCount } = createContext(
    {
      id: 'meta-skip',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [],
    },
    { showVideoMeta: true }
  );
  assert.equal(ctx.requestVideoMetaForNodeInfo(ctx._data), null, '没有视频就没有元信息');

  const { ctx: brokenCtx, getFetchVideoMetaCallCount: brokenCalls } = createContext(
    {
      id: 'meta-broken',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/a.mp4', error: '转码失败' }],
    },
    { showVideoMeta: true }
  );
  assert.equal(brokenCtx.requestVideoMetaForNodeInfo(brokenCtx._data), null, '失败条目不去取帧率');
  assert.equal(brokenCalls(), 0, '不该发出请求');

  const { ctx: unavailableCtx, getFetchVideoMetaCallCount: unavailableCalls } = createContext(
    {
      id: 'meta-unavailable',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [
        {
          localPath: 'output/a.mp4',
          mediaUnavailable: true,
          mediaUnavailableSource: 'output/a.mp4',
        },
      ],
    },
    { showVideoMeta: true }
  );
  assert.equal(
    unavailableCtx.requestVideoMetaForNodeInfo(unavailableCtx._data),
    null,
    '已标记不可用的媒体不去取帧率'
  );
  assert.equal(unavailableCalls(), 0);
  assert.equal(getFetchVideoMetaCallCount(), 0);
});

test('resultRenderModule: 元信息请求 5 秒内同源只发一次', async () => {
  const { ctx, getFetchVideoMetaCallCount } = createContext(
    {
      id: 'meta-throttle',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/a.mp4' }],
    },
    { showVideoMeta: true }
  );
  const first = ctx.requestVideoMetaForNodeInfo(ctx._data);
  assert.ok(first, '首次应发出请求');
  await first;
  assert.equal(getFetchVideoMetaCallCount(), 1);

  assert.equal(
    ctx.requestVideoMetaForNodeInfo(ctx._data),
    null,
    '5 秒窗口内不再发请求（返回 null 表示「无需新请求」）'
  );
  assert.equal(getFetchVideoMetaCallCount(), 1, '请求数不能涨');

  // 把上次请求时间推远，模拟窗口过期。
  ctx._videoMetaInfoRequestAt = Date.now() - 6000;
  const again = ctx.requestVideoMetaForNodeInfo(ctx._data);
  assert.ok(again, '窗口过后应允许重试');
  await again;
  assert.equal(getFetchVideoMetaCallCount(), 2);
});

test('resultRenderModule: 已有同源 fps 与帧数时不再请求', async () => {
  const { ctx, store, getFetchVideoMetaCallCount } = createContext(
    {
      id: 'meta-cached',
      type: 'ai-video',
      mainVideoIndex: 0,
      videos: [{ localPath: 'output/a.mp4' }],
    },
    { showVideoMeta: true }
  );
  store.state.nodes['meta-cached'].videoMetaSrc = '/output/a.mp4';
  store.state.nodes['meta-cached'].videoFps = 30;
  store.state.nodes['meta-cached'].videoFrameCount = 300;
  await ctx._maybeFetchVideoMeta('/output/a.mp4');
  assert.equal(getFetchVideoMetaCallCount(), 0, '已有完整元信息就不该再打服务端');
});
