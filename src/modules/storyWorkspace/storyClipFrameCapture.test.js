import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureStoryClipFrameFromSource,
  captureStoryClipFrameSnapshot,
  isStoryClipFrameCanvasSecurityError,
} from './storyClipFrameCapture.js';

// 最小假 DOM：只实现本模块和本仓 videoFrameCapture 用到的 video / canvas / body 接口，不引入 jsdom。
// 覆盖项一律写成 'k' in over ? over.k : 默认值。
function createFakeVideo(over = {}) {
  const readyOnSrc = 'readyOnSrc' in over ? over.readyOnSrc : true;
  const failOnLoad = 'failOnLoad' in over ? over.failOnLoad : false;
  const failOnSeek = 'failOnSeek' in over ? over.failOnSeek : false;
  const throwOnSeek = 'throwOnSeek' in over ? over.throwOnSeek : false;
  const width = 'width' in over ? over.width : 640;
  const height = 'height' in over ? over.height : 360;
  const listeners = new Map();
  let src = '';
  let currentTime = 'currentTime' in over ? over.currentTime : 0;
  const video = {
    tagName: 'VIDEO',
    style: {},
    muted: false,
    playsInline: false,
    preload: '',
    readyState: 0,
    videoWidth: 0,
    videoHeight: 0,
    duration: 'duration' in over ? over.duration : 12,
    seeking: false,
    parentNode: null,
    log: [],
    get src() {
      return src;
    },
    set src(value) {
      src = String(value);
      video.log.push(['src', src]);
      if (readyOnSrc && !failOnLoad) {
        video.readyState = 4;
        video.videoWidth = width;
        video.videoHeight = height;
      }
    },
    get currentSrc() {
      return src;
    },
    getAttribute(name) {
      return name === 'src' ? src : null;
    },
    removeAttribute(name) {
      if (name === 'src') src = '';
      video.log.push(['removeAttribute', name]);
    },
    get currentTime() {
      return currentTime;
    },
    set currentTime(value) {
      if (throwOnSeek) throw new Error('seek blocked');
      video.log.push(['seek', value]);
      if (failOnSeek) {
        queueMicrotask(() => video.dispatch('error'));
        return;
      }
      currentTime = value;
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    dispatch(type) {
      for (const handler of [...(listeners.get(type) || [])]) handler({ type });
    },
    listenerCount() {
      let count = 0;
      for (const set of listeners.values()) count += set.size;
      return count;
    },
    load() {
      video.log.push(['load']);
      if (failOnLoad && src) queueMicrotask(() => video.dispatch('error'));
    },
    pause() {
      video.log.push(['pause']);
    },
    remove() {
      video.log.push(['remove']);
      if (video.parentNode) {
        const siblings = video.parentNode.children;
        siblings.splice(siblings.indexOf(video), 1);
        video.parentNode = null;
      }
    },
  };
  if ('presetSrc' in over) video.src = over.presetSrc;
  return video;
}

function createFakeCanvas(over = {}) {
  const securityErrorFor = 'securityErrorFor' in over ? over.securityErrorFor : () => false;
  const failWith = 'failWith' in over ? over.failWith : null;
  const canvas = {
    width: 0,
    height: 0,
    draws: [],
    getContext(kind) {
      return kind === '2d' ? { drawImage: (...args) => canvas.draws.push(args) } : null;
    },
    toBlob(callback, type) {
      const source = canvas.draws[0]?.[0];
      if (failWith) throw failWith;
      if (securityErrorFor(source)) {
        const error = new Error(
          "Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported.",
        );
        error.name = 'SecurityError';
        throw error;
      }
      callback(new Blob(['frame'], { type }));
    },
  };
  return canvas;
}

function createFakeDocument(over = {}) {
  const videoOptions = 'video' in over ? over.video : {};
  const canvasOptions = 'canvas' in over ? over.canvas : {};
  const created = { videos: [], canvases: [] };
  const body = {
    children: [],
    appendChild(node) {
      body.children.push(node);
      node.parentNode = body;
      return node;
    },
  };
  return {
    body,
    created,
    createElement(tag) {
      if (tag === 'video') {
        const video = createFakeVideo(videoOptions);
        created.videos.push(video);
        return video;
      }
      if (tag === 'canvas') {
        const canvas = createFakeCanvas(canvasOptions);
        created.canvases.push(canvas);
        return canvas;
      }
      throw new Error('unexpected element: ' + tag);
    },
  };
}

// 本仓 videoFrameCapture 的截帧直接用全局 document 建 canvas，这里临时换成假文档，结束后还原
function useGlobalDocument(t, doc) {
  const had = 'document' in globalThis;
  const previous = globalThis.document;
  globalThis.document = doc;
  t.after(() => {
    if (had) globalThis.document = previous;
    else delete globalThis.document;
  });
}

test('isStoryClipFrameCanvasSecurityError：按错误名或消息识别画布跨域污染', () => {
  assert.equal(isStoryClipFrameCanvasSecurityError({ name: 'SecurityError' }), true);
  assert.equal(isStoryClipFrameCanvasSecurityError({ name: ' securityerror ' }), true);
  assert.equal(isStoryClipFrameCanvasSecurityError(new Error('Tainted canvases may not be exported.')), true);
  assert.equal(isStoryClipFrameCanvasSecurityError(new Error('tainted canvas')), true);
  assert.equal(isStoryClipFrameCanvasSecurityError(new Error('The operation is insecure.')), true);
  assert.equal(isStoryClipFrameCanvasSecurityError(new Error('video frame is not ready')), false);
  assert.equal(isStoryClipFrameCanvasSecurityError(null), false);
  assert.equal(isStoryClipFrameCanvasSecurityError(undefined), false);
});

test('captureStoryClipFrameFromSource：源地址为空或文档不能建元素时直接报错', async () => {
  await assert.rejects(
    captureStoryClipFrameFromSource({ sourceUrl: '  ', documentObject: createFakeDocument() }),
    /^Error: 片段视频本地源不可用$/,
  );
  await assert.rejects(
    captureStoryClipFrameFromSource({ sourceUrl: '/output/a.mp4', documentObject: {} }),
    /^Error: 片段视频本地源不可用$/,
  );
});

test('captureStoryClipFrameFromSource：建离屏静音 video 截帧，结束后清理并移除', async (t) => {
  const doc = createFakeDocument();
  useGlobalDocument(t, doc);
  const snapshot = await captureStoryClipFrameFromSource({
    sourceUrl: '  /output/clip.mp4  ',
    documentObject: doc,
    fileNamePrefix: 'frame_test',
  });
  const [video] = doc.created.videos;
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  assert.equal(video.preload, 'auto');
  assert.deepEqual(video.style, {
    position: 'fixed',
    left: '-10000px',
    top: '-10000px',
    width: '1px',
    height: '1px',
    opacity: '0',
  });
  assert.deepEqual(video.log[0], ['src', '/output/clip.mp4']);
  assert.equal(snapshot.width, 640);
  assert.equal(snapshot.height, 360);
  assert.equal(snapshot.type, 'image/png');
  assert.equal(snapshot.ext, 'png');
  assert.match(snapshot.fileName, /^frame_test_\d+\.png$/);
  assert.ok(snapshot.blob instanceof Blob);
  assert.equal(doc.created.canvases[0].draws[0][0], video);
  // 收尾：暂停、摘掉 src、重新 load，再从 body 移除
  assert.deepEqual(
    video.log.slice(-4).map((entry) => entry[0]),
    ['pause', 'removeAttribute', 'load', 'remove'],
  );
  assert.equal(doc.body.children.length, 0);
  assert.equal(video.src, '');
});

test('captureStoryClipFrameFromSource：documentObject 默认取全局 document', async (t) => {
  const doc = createFakeDocument();
  useGlobalDocument(t, doc);
  const snapshot = await captureStoryClipFrameFromSource({ sourceUrl: '/output/clip.mp4' });
  assert.equal(doc.created.videos.length, 1);
  assert.match(snapshot.fileName, /^story_clip_frame_\d+\.png$/);
});

test('captureStoryClipFrameFromSource：按当前时间定位，超出时长时夹到结尾前 1 毫秒', async (t) => {
  const doc = createFakeDocument({ video: { duration: 5 } });
  useGlobalDocument(t, doc);
  await captureStoryClipFrameFromSource({
    sourceUrl: '/output/clip.mp4',
    documentObject: doc,
    currentTimeSec: 99,
  });
  const seeks = doc.created.videos[0].log.filter((entry) => entry[0] === 'seek');
  assert.deepEqual(seeks, [['seek', 4.999]]);
  const doc2 = createFakeDocument();
  globalThis.document = doc2;
  await captureStoryClipFrameFromSource({
    sourceUrl: '/output/clip.mp4',
    documentObject: doc2,
    currentTimeSec: -3,
  });
  assert.equal(doc2.created.videos[0].log.filter((entry) => entry[0] === 'seek').length, 0);
});

test('captureStoryClipFrameFromSource：画面加载失败、定位失败都会报错，且仍然清理元素', async (t) => {
  const failLoad = createFakeDocument({ video: { failOnLoad: true } });
  useGlobalDocument(t, failLoad);
  await assert.rejects(
    captureStoryClipFrameFromSource({ sourceUrl: '/output/a.mp4', documentObject: failLoad }),
    /^Error: 片段视频本地画面加载失败$/,
  );
  assert.equal(failLoad.body.children.length, 0);
  assert.equal(failLoad.created.videos[0].listenerCount(), 0);

  const failSeek = createFakeDocument({ video: { failOnSeek: true } });
  await assert.rejects(
    captureStoryClipFrameFromSource({
      sourceUrl: '/output/a.mp4',
      documentObject: failSeek,
      currentTimeSec: 2,
    }),
    /^Error: 片段视频定位当前时间失败$/,
  );
  assert.equal(failSeek.body.children.length, 0);

  const throwSeek = createFakeDocument({ video: { throwOnSeek: true } });
  await assert.rejects(
    captureStoryClipFrameFromSource({
      sourceUrl: '/output/a.mp4',
      documentObject: throwSeek,
      currentTimeSec: 2,
    }),
    /^Error: 片段视频定位当前时间失败$/,
  );
  assert.equal(throwSeek.body.children.length, 0);
});

test('captureStoryClipFrameFromSource：crop 在本仓 videoFrameCapture 下不生效，仍截整帧（世代差异）', async (t) => {
  const doc = createFakeDocument();
  useGlobalDocument(t, doc);
  const snapshot = await captureStoryClipFrameFromSource({
    sourceUrl: '/output/clip.mp4',
    documentObject: doc,
    crop: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
  });
  assert.equal(snapshot.width, 640);
  assert.equal(snapshot.height, 360);
  assert.deepEqual(doc.created.canvases[0].draws[0].slice(1), [0, 0, 640, 360]);
});

test('captureStoryClipFrameSnapshot：缺视频元素或画面未就绪时报错', async () => {
  await assert.rejects(captureStoryClipFrameSnapshot({}), /^Error: 当前片段视频不可用$/);
  // 没有 src 的 video 会被判定为画面不可用，立即返回 false
  await assert.rejects(
    captureStoryClipFrameSnapshot({ videoEl: createFakeVideo() }),
    /^Error: 视频画面尚未加载完成，请稍后重试$/,
  );
});

test('captureStoryClipFrameSnapshot：画面可读时直接截当前视频，localizedVideo 为 null', async (t) => {
  const doc = createFakeDocument();
  useGlobalDocument(t, doc);
  const videoEl = createFakeVideo({ presetSrc: 'https://cdn.example.com/v.mp4' });
  let saved = 0;
  const result = await captureStoryClipFrameSnapshot({
    videoEl,
    saveOutputFromUrl: async () => {
      saved += 1;
    },
    fileNamePrefix: 'shot',
  });
  assert.equal(result.localizedVideo, null);
  assert.match(result.snapshot.fileName, /^shot_\d+\.png$/);
  assert.equal(doc.created.canvases[0].draws[0][0], videoEl);
  assert.equal(saved, 0);
  assert.equal(doc.created.videos.length, 0);
});

test('captureStoryClipFrameSnapshot：画布被跨域污染时先把远程视频存到本地，再从本地源截帧', async (t) => {
  const videoEl = createFakeVideo({ presetSrc: 'https://cdn.example.com/raw', currentTime: 3 });
  const doc = createFakeDocument({ canvas: { securityErrorFor: (source) => source === videoEl } });
  useGlobalDocument(t, doc);
  const saves = [];
  const result = await captureStoryClipFrameSnapshot({
    videoEl,
    sourceResult: { url: 'https://cdn.example.com/raw', mimeType: 'video/webm' },
    currentTimeSec: 3,
    documentObject: doc,
    saveOutputFromUrl: async (url, options) => {
      saves.push([url, options]);
      return { localPath: 'output/story_clip_local.webm', displayLocalPath: 'output/story_clip_display.mp4' };
    },
  });
  assert.deepEqual(saves, [
    [
      'https://cdn.example.com/raw',
      { ext: 'webm', maxBytes: 512 * 1024 * 1024, dedupeKey: 'story-clip-video:https://cdn.example.com/raw' },
    ],
  ]);
  assert.deepEqual(result.localizedVideo, {
    url: '/output/story_clip_local.webm',
    localPath: 'output/story_clip_local.webm',
    originalLocalPath: 'output/story_clip_local.webm',
    displayLocalPath: 'output/story_clip_display.mp4',
  });
  const [offscreen] = doc.created.videos;
  assert.deepEqual(offscreen.log[0], ['src', '/output/story_clip_local.webm']);
  assert.deepEqual(
    offscreen.log.filter((entry) => entry[0] === 'seek'),
    [['seek', 3]],
  );
  assert.equal(result.snapshot.width, 640);
  assert.equal(doc.body.children.length, 0);
});

test('captureStoryClipFrameSnapshot：扩展名依次看 MIME、地址后缀，都没有时按 mp4', async (t) => {
  const cases = [
    [{ url: 'https://cdn.example.com/a', contentType: 'video/quicktime' }, 'mov'],
    [{ url: 'https://cdn.example.com/a', mimeType: 'video/mp4; codecs=avc1' }, 'mp4'],
    [{ videoUrl: 'https://cdn.example.com/path/clip.M4V?sig=1' }, 'm4v'],
    [{ displayUrl: 'https://cdn.example.com/path/clip.mkv' }, 'mp4'],
  ];
  useGlobalDocument(t, null);
  for (const [sourceResult, ext] of cases) {
    const videoEl = createFakeVideo({ presetSrc: 'blob:x' });
    const doc = createFakeDocument({ canvas: { securityErrorFor: (source) => source === videoEl } });
    globalThis.document = doc;
    let seen = '';
    await captureStoryClipFrameSnapshot({
      videoEl,
      sourceResult,
      documentObject: doc,
      saveOutputFromUrl: async (url, options) => {
        seen = options.ext;
        return { localPath: 'output/x.' + options.ext };
      },
    });
    assert.equal(seen, ext, JSON.stringify(sourceResult));
  }
});

test('captureStoryClipFrameSnapshot：非跨域错误、无远程地址、无保存函数、保存无本地路径时的处理', async (t) => {
  const plainError = new Error('boom');
  const doc = createFakeDocument({ canvas: { failWith: plainError } });
  useGlobalDocument(t, doc);
  let saved = 0;
  const save = async () => {
    saved += 1;
    return { localPath: 'output/x.mp4' };
  };
  const ready = () => createFakeVideo({ presetSrc: 'https://cdn.example.com/v.mp4' });
  await assert.rejects(
    captureStoryClipFrameSnapshot({
      videoEl: ready(),
      sourceUrl: 'https://cdn.example.com/v.mp4',
      saveOutputFromUrl: save,
    }),
    (error) => error === plainError,
  );
  assert.equal(saved, 0);

  const videoEl = ready();
  globalThis.document = createFakeDocument({ canvas: { securityErrorFor: (source) => source === videoEl } });
  await assert.rejects(
    captureStoryClipFrameSnapshot({ videoEl, sourceUrl: 'blob:http://x/1', saveOutputFromUrl: save }),
    (error) => error.name === 'SecurityError',
  );
  await assert.rejects(
    captureStoryClipFrameSnapshot({ videoEl, sourceUrl: 'https://cdn.example.com/v.mp4' }),
    (error) => error.name === 'SecurityError',
  );
  assert.equal(saved, 0);
  await assert.rejects(
    captureStoryClipFrameSnapshot({
      videoEl,
      sourceUrl: 'https://cdn.example.com/v.mp4',
      saveOutputFromUrl: async () => ({ url: 'https://cdn.example.com/still-remote.mp4' }),
    }),
    /^Error: 片段视频本地保存失败$/,
  );
});
