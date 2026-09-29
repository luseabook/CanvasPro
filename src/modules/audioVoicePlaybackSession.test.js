import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAudioVoicePlaybackSession,
  isAudioVoicePreviewControlTarget,
  prepareAudioVoicePlaybackElement,
} from './audioVoicePlaybackSession.js';

function createAudioElement() {
  const calls = { play: 0, pause: 0, load: 0, removed: [] };
  return {
    calls,
    preload: '',
    src: '',
    currentTime: 0,
    duration: 3,
    __audioVoiceRequestedPreload: undefined,
    play() {
      calls.play += 1;
      return Promise.resolve();
    },
    pause() {
      calls.pause += 1;
    },
    load() {
      calls.load += 1;
    },
    removeAttribute(name) {
      calls.removed.push(name);
      if (name === 'src') this.src = '';
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

test('audioVoicePlaybackSession: 覆盖目标只认三种预览动作', () => {
  const wrap = (action) => ({ closest: () => ({ dataset: { audioVoiceAction: action } }) });
  assert.equal(isAudioVoicePreviewControlTarget(wrap('play-source')), true);
  assert.equal(isAudioVoicePreviewControlTarget(wrap('  play-converted  ')), true);
  assert.equal(isAudioVoicePreviewControlTarget(wrap('play-history')), true);
  assert.equal(isAudioVoicePreviewControlTarget(wrap('delete-segment')), false);
  assert.equal(isAudioVoicePreviewControlTarget({}), false);
  assert.equal(isAudioVoicePreviewControlTarget(null), false);
});

test('audioVoicePlaybackSession: 缺元素或缺地址时不碰 src', async () => {
  const el = createAudioElement();
  assert.equal(await prepareAudioVoicePlaybackElement(null, 'http://cdn/a.mp3'), '');
  assert.equal(await prepareAudioVoicePlaybackElement(el, '   '), '');
  assert.equal(el.calls.load, 0);
  assert.equal(el.preload, '');
});

test('audioVoicePlaybackSession: preload 一旦要过 auto 就不会降级成 metadata', async () => {
  const el = createAudioElement();
  const attached = [];
  const result = await prepareAudioVoicePlaybackElement(el, 'http://cdn/a.mp3', {
    preload: 'auto',
    attachSource: async (target, url, options) => {
      attached.push([url, options.preload]);
      return 'attached';
    },
    isPlaybackSource: () => true,
  });
  assert.equal(result, 'attached');
  assert.deepEqual(attached, [['http://cdn/a.mp3', 'auto']]);
  assert.equal(el.preload, 'auto');
  assert.equal(el.__audioVoiceRequestedPreload, 'auto');

  const second = createAudioElement();
  second.__audioVoiceRequestedPreload = 'auto';
  await prepareAudioVoicePlaybackElement(second, 'http://cdn/b.mp3', {
    preload: 'metadata',
    attachSource: async () => 'attached',
    isPlaybackSource: () => false,
  });
  assert.equal(second.preload, 'auto', '曾经要过 auto 的元素不会被降级');
  assert.equal(second.__audioVoiceRequestedPreload, 'auto', '保留曾经要过 auto 的记忆');
});

test('audioVoicePlaybackSession: 没有 attachSource 时直写 src 并 load', async () => {
  const el = createAudioElement();
  const result = await prepareAudioVoicePlaybackElement(el, 'http://cdn/a.mp3', { attachSource: null });
  assert.equal(result, 'http://cdn/a.mp3');
  assert.equal(el.src, 'http://cdn/a.mp3');
  assert.equal(el.calls.load, 1);

  const guarded = createAudioElement();
  const skipped = await prepareAudioVoicePlaybackElement(guarded, 'http://cdn/a.mp3', {
    attachSource: null,
    shouldAssign: () => false,
  });
  assert.equal(skipped, '');
  assert.equal(guarded.src, '');
});

function createSession(options = {}) {
  const elements = [];
  const toasts = [];
  const session = createAudioVoicePlaybackSession({
    documentObject: {
      addEventListener() {},
      removeEventListener() {},
    },
    createAudioElement: () => {
      const el = createAudioElement();
      elements.push(el);
      return el;
    },
    attachSource: async (target, url) => {
      target.src = url;
      return url;
    },
    clearPlaybackMetadata: () => {},
    isPlaybackSource: () => true,
    isPreviewControlTarget: () => false,
    beginPlayback: () => {},
    registerPlaybackClient: () => () => {},
    ownerId: 'owner-test',
    maxCachedAudioElements: 2,
    ...options,
  });
  return { session, elements, toasts };
}

test('audioVoicePlaybackSession: 空地址 missing、拿不到音频元素 unavailable', async () => {
  const { session } = createSession();
  assert.deepEqual(await session.play('   '), { status: 'missing' });
  const noElement = createSession({ createAudioElement: () => null });
  assert.equal((await noElement.session.play('http://cdn/a.mp3')).status, 'unavailable');
  assert.equal(noElement.session.getCacheSize(), 0);
});

test('audioVoicePlaybackSession: 播放走同一元素缓存，重复地址不重复建', async () => {
  const { session, elements } = createSession();
  const first = await session.play('http://cdn/a.mp3');
  assert.equal(first.status, 'playing');
  assert.equal(elements.length, 1);
  assert.equal(elements[0].calls.play, 1);
  assert.equal(session.getCacheSize(), 1);

  const again = await session.play('http://cdn/a.mp3');
  assert.equal(again.status, 'playing');
  assert.equal(again.audioEl, first.audioEl);
  assert.equal(elements.length, 1, '命中缓存不新建元素');
});

test('audioVoicePlaybackSession: 预热按去重与 limit 截断，失败不抛', async () => {
  const { session, elements } = createSession();
  const warmed = await session.warmMany(['a', 'a', 'b', 'c'], { limit: 2 });
  assert.equal(warmed.length, 2);
  assert.equal(elements.length, 2);
  assert.ok(warmed.every((entry) => entry.status === 'ready'));
  assert.equal((await session.warm('')).status, 'missing');

  const failing = createSession({
    attachSource: async () => {
      throw new Error('boom');
    },
  });
  assert.equal((await failing.session.warm('http://cdn/x.mp3')).status, 'failed');
});

test('audioVoicePlaybackSession: stop 会暂停当前元素，destroy 之后不再分配', async () => {
  const { session, elements } = createSession();
  await session.play('http://cdn/a.mp3');
  session.stop();
  assert.equal(elements[0].calls.pause, 1);
  session.stop();
  assert.equal(elements[0].calls.pause, 1, '已经没有活动元素时 stop 不再调 pause');

  await session.play('http://cdn/a.mp3');
  assert.equal(elements.length, 1, '重新播放复用同一个缓存元素');
  assert.equal(session.getCacheSize(), 1);
  session.destroy();
  assert.equal(elements[0].calls.pause, 3, 'destroy 先暂停当前元素，再逐个释放缓存元素');
  assert.equal(session.getCacheSize(), 0);
  assert.equal((await session.play('http://cdn/a.mp3')).status, 'unavailable');
  session.destroy();
});

test('audioVoicePlaybackSession: 超过缓存上限时淘汰最旧的元素', async () => {
  const { session, elements } = createSession({ maxCachedAudioElements: 1 });
  const a = await session.play('http://cdn/a.mp3');
  const b = await session.play('http://cdn/b.mp3');
  assert.equal(elements.length, 2);
  assert.equal(session.getCacheSize(), 1);
  assert.ok(elements[0].calls.removed.includes('src'), '被淘汰的元素要清 src');
  assert.notEqual(a.audioEl, b.audioEl);
});
