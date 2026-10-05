import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE,
  VIDEO_PLAYBACK_PROXY_VERSION,
  buildVideoPlaybackProxyFfmpegArgs,
  createVideoPlaybackProxyWorkDeduper,
  finalizeVideoPlaybackProxyMigrationResult,
  getVideoPlaybackProxyFilename,
  isCurrentVideoPlaybackProxyLocalPath,
  needsBrowserVideoProxy,
  resolveVideoPlaybackProxyTimeoutMs,
} from './videoPlaybackProxy.js';

const SCALE_FILTER =
  "scale=w='min(iw\\,1280)':h='min(ih\\,1280)':force_original_aspect_ratio=decrease:force_divisible_by=2";

test('constants match the 0.7.16 build', () => {
  assert.equal(VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE, 1280);
  assert.equal(VIDEO_PLAYBACK_PROXY_MAX_LONG_EDGE, 1280);
  assert.equal(VIDEO_PLAYBACK_PROXY_VERSION, 'v2-1280');
});

test('resolveVideoPlaybackProxyTimeoutMs clamps between 5 minutes and 6 hours', () => {
  assert.equal(resolveVideoPlaybackProxyTimeoutMs(0), 5 * 60 * 1000);
  assert.equal(resolveVideoPlaybackProxyTimeoutMs(10), 5 * 60 * 1000);
  assert.equal(resolveVideoPlaybackProxyTimeoutMs(30), 30 * 1000 * 12);
  assert.equal(resolveVideoPlaybackProxyTimeoutMs(10000), 6 * 60 * 60 * 1000);
  assert.equal(resolveVideoPlaybackProxyTimeoutMs(-5), 5 * 60 * 1000);
  assert.ok(Number.isNaN(resolveVideoPlaybackProxyTimeoutMs('abc')));
});

test('work deduper collapses concurrent runs of the same key', async () => {
  const deduper = createVideoPlaybackProxyWorkDeduper();
  let calls = 0;
  let release = null;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const factory = async () => {
    calls += 1;
    await gate;
    return 'proxied';
  };
  const first = deduper.run('asset-1', factory);
  const second = deduper.run('asset-1', factory);
  release();
  assert.deepEqual(await Promise.all([first, second]), ['proxied', 'proxied']);
  assert.equal(calls, 1);
});

test('work deduper drops the entry after completion so later runs re-execute', async () => {
  const deduper = createVideoPlaybackProxyWorkDeduper();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    return calls;
  };
  assert.equal(await deduper.run('asset-2', factory), 1);
  assert.equal(await deduper.run('asset-2', factory), 2);
  assert.equal(calls, 2);
});

test('work deduper runs blank keys and non-functions without caching', async () => {
  const deduper = createVideoPlaybackProxyWorkDeduper();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    return 'direct';
  };
  assert.equal(await deduper.run('', factory), 'direct');
  assert.equal(await deduper.run('   ', factory), 'direct');
  assert.equal(await deduper.run('asset-3', null), undefined);
  assert.equal(calls, 2);
});

test('work deduper propagates rejection and clears the entry', async () => {
  const deduper = createVideoPlaybackProxyWorkDeduper();
  let calls = 0;
  const factory = async () => {
    calls += 1;
    if (calls === 1) throw new Error('transcode failed');
    return 'recovered';
  };
  await assert.rejects(() => deduper.run('asset-4', factory), /transcode failed/);
  assert.equal(await deduper.run('asset-4', factory), 'recovered');
  assert.equal(calls, 2);
});

test('finalizeVideoPlaybackProxyMigrationResult only rewrites the not_required v2 case', () => {
  const untouched = { videoProxyStatus: 'ready' };
  assert.equal(
    finalizeVideoPlaybackProxyMigrationResult(untouched, {
      sourceLocalPath: 'data/assets/original.mp4',
      targetVersion: 'v2-1280',
    }),
    untouched,
  );
  assert.equal(
    finalizeVideoPlaybackProxyMigrationResult(
      { videoProxyStatus: 'not_required' },
      { sourceLocalPath: '', targetVersion: 'v2-1280' },
    ).displayLocalPath,
    undefined,
  );
  assert.equal(
    finalizeVideoPlaybackProxyMigrationResult(
      { videoProxyStatus: 'not_required' },
      { sourceLocalPath: 'data/assets/original.mp4', targetVersion: 'v1-720' },
    ).videoProxyVersion,
    undefined,
  );
});

test('finalizeVideoPlaybackProxyMigrationResult normalises separators and leading slashes', () => {
  const result = finalizeVideoPlaybackProxyMigrationResult(
    { videoProxyStatus: 'not_required', mediaTaskId: 'task-1' },
    { sourceLocalPath: '\\data\\assets\\clip.mp4', targetVersion: 'v2-1280' },
  );
  assert.deepEqual(result, {
    videoProxyStatus: 'not_required',
    mediaTaskId: 'task-1',
    displayLocalPath: '/data/assets/clip.mp4',
    displayUrl: '/data/assets/clip.mp4',
    videoProxyVersion: 'v2-1280',
  });
  assert.equal(
    finalizeVideoPlaybackProxyMigrationResult(
      { videoProxyStatus: 'not_required' },
      { sourceLocalPath: '/data/assets/clip.mp4', targetVersion: 'v2-1280' },
    ).displayUrl,
    '/data/assets/clip.mp4',
  );
});

test('needsBrowserVideoProxy flags oversized or unknown codecs', () => {
  assert.equal(needsBrowserVideoProxy({ width: 1921, codecName: 'h264', pixelFormat: 'yuv420p' }), true);
  assert.equal(needsBrowserVideoProxy({ width: 1280, codecName: 'h264', pixelFormat: 'yuv420p' }), false);
  assert.equal(needsBrowserVideoProxy({ height: '1920', codecName: 'h264', pixelFormat: 'yuv420p' }), true);
  assert.equal(needsBrowserVideoProxy({ codecName: '' }), true);
  assert.equal(needsBrowserVideoProxy({}), true);
});

test('needsBrowserVideoProxy follows the per-codec rules', () => {
  assert.equal(needsBrowserVideoProxy({ codecName: 'H264', pixelFormat: 'YUV420P' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'h264', pixelFormat: 'yuvj420p' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'h264', pixelFormat: '' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'h264' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'h264', pixelFormat: 'yuv444p' }), true);
  assert.equal(needsBrowserVideoProxy({ codecName: 'vp9', formatName: 'webm' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'vp8', formatName: 'matroska' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'vp9', formatName: 'mp4' }), true);
  assert.equal(needsBrowserVideoProxy({ codecName: 'av1' }), false);
  assert.equal(needsBrowserVideoProxy({ codecName: 'mpeg4' }), true);
});

test('proxy filename and path helpers use the versioned suffix', () => {
  assert.equal(getVideoPlaybackProxyFilename('abc'), 'abc.proxy-v2-1280.mp4');
  assert.equal(getVideoPlaybackProxyFilename('  abc  '), 'abc.proxy-v2-1280.mp4');
  assert.equal(getVideoPlaybackProxyFilename(''), '.proxy-v2-1280.mp4');
  assert.equal(
    isCurrentVideoPlaybackProxyLocalPath('data/assets/derived/video/abc.proxy-v2-1280.mp4', 'abc'),
    true,
  );
  assert.equal(
    isCurrentVideoPlaybackProxyLocalPath('\\data\\assets\\derived\\video\\abc.proxy-v2-1280.mp4', 'abc'),
    true,
  );
  assert.equal(
    isCurrentVideoPlaybackProxyLocalPath('derived/video/abc.proxy-v2-1280.mp4', 'abc'),
    false,
  );
  assert.equal(isCurrentVideoPlaybackProxyLocalPath('', 'abc'), false);
  assert.equal(
    isCurrentVideoPlaybackProxyLocalPath('data/assets/derived/video/abc.mp4', 'abc'),
    false,
  );
});

test('buildVideoPlaybackProxyFfmpegArgs emits the exact expect table', () => {
  assert.deepEqual(
    buildVideoPlaybackProxyFfmpegArgs({
      inputPath: 'in.mp4',
      outputPath: 'out.mp4',
      preset: 'medium',
      crf: 28,
    }),
    [
      '-y',
      '-i',
      'in.mp4',
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-dn',
      '-sn',
      '-vf',
      SCALE_FILTER,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-profile:v',
      'high',
      '-preset',
      'medium',
      '-crf',
      28,
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      'out.mp4',
    ],
  );
});

test('buildVideoPlaybackProxyFfmpegArgs keeps the escaped scale graph and tolerates missing options', () => {
  const args = buildVideoPlaybackProxyFfmpegArgs({ inputPath: 'in.mp4', outputPath: 'out.mp4' });
  assert.equal(args.length, 28);
  assert.equal(args[10], SCALE_FILTER);
  assert.ok(args[10].includes("min(iw\\,1280)"));
  assert.ok(args[10].includes("min(ih\\,1280)"));
  assert.equal(args[18], undefined);
  assert.equal(args[20], undefined);
});
