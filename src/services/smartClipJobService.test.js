import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SMART_CLIP_DEFAULT_FPS,
  SMART_CLIP_DEFAULT_SEGMENTS,
  SMART_CLIP_MAX_SEGMENTS,
  SMART_CLIP_MIN_SEGMENTS,
  SmartClipJobError,
  normalizeSmartClipFps,
  normalizeSmartClipMaxSegmentDuration,
  normalizeSmartClipMaxSegments,
  normalizeSmartClipMode,
  normalizeSmartClipOutputMode,
  normalizeSmartClipRunOptions,
  runSmartClipJob,
} from './smartClipJobService.js';

test('smartClipJobService: numeric normalization clamps supported ranges', () => {
  assert.equal(normalizeSmartClipMaxSegments(-10), SMART_CLIP_MIN_SEGMENTS);
  assert.equal(normalizeSmartClipMaxSegments(999), SMART_CLIP_MAX_SEGMENTS);
  assert.equal(normalizeSmartClipMaxSegments('bad'), SMART_CLIP_DEFAULT_SEGMENTS);
  assert.equal(normalizeSmartClipFps(23), SMART_CLIP_DEFAULT_FPS);
  assert.equal(normalizeSmartClipFps(30), 30);
  assert.equal(normalizeSmartClipMaxSegmentDuration(''), 0);
  assert.equal(normalizeSmartClipMaxSegmentDuration(0), 0);
  assert.equal(normalizeSmartClipMaxSegmentDuration(9999), 600);
});

test('smartClipJobService: mode, output, and run option normalization are stable', () => {
  assert.equal(normalizeSmartClipMode('BALANCED'), 'balanced');
  assert.equal(normalizeSmartClipMode('invalid'), 'stable');
  assert.equal(normalizeSmartClipOutputMode('keyframes'), 'keyframes');
  assert.equal(normalizeSmartClipOutputMode('invalid'), 'videoSegments');
  assert.deepEqual(
    normalizeSmartClipRunOptions({
      mode: 'BALANCED',
      maxSegments: 99,
      fps: 23,
      outputMode: 'keyframes',
      keyframeSelectionPolicy: 'PERSON',
      preserveWholeVideo: true,
      maxSegmentDurationSec: 9999,
    }),
    {
      mode: 'balanced',
      maxSegments: 25,
      fps: 24,
      outputMode: 'keyframes',
      keyframeSelectionPolicy: 'person',
      preserveWholeVideo: true,
      maxSegmentDurationSec: 600,
    },
  );
});

test('smartClipJobService: SmartClipJobError carries stage and job id', () => {
  const error = new SmartClipJobError('failed', { code: 'x', stage: 'status', jobId: 'job-1' });
  assert.equal(error.name, 'SmartClipJobError');
  assert.equal(error.code, 'x');
  assert.equal(error.stage, 'status');
  assert.equal(error.jobId, 'job-1');
});

test('smartClipJobService: run reports progress and returns completed segments', async () => {
  const calls = [];
  const progress = [];
  const request = async (options) => {
    calls.push(options);
    if (calls.length === 1) {
      return { status: 200, data: { success: true, jobId: 'job/1' } };
    }
    return {
      status: 200,
      data: { success: true, status: 'done', outputMode: 'keyframes', segments: [{ start: 0 }] },
    };
  };
  const result = await runSmartClipJob({
    src: ' video.mp4 ',
    options: { maxSegments: 5 },
    request,
    wait: async () => {},
    onProgress: (value) => progress.push(value),
  });
  assert.equal(result.jobId, 'job/1');
  assert.equal(result.outputMode, 'keyframes');
  assert.deepEqual(result.segments, [{ start: 0 }]);
  assert.equal(progress.length, 1);
  assert.equal(calls[1].url, '/api/v2/video/smart_clip/status?jobId=job%2F1');
  assert.equal(JSON.parse(calls[0].body).src, 'video.mp4');
});

test('smartClipJobService: unavailable endpoint and missing job id produce typed errors', async () => {
  await assert.rejects(
    runSmartClipJob({
      src: 'video.mp4',
      request: async () => ({ status: 404, data: null }),
    }),
    (error) => error.code === 'endpoint_unavailable' && error.stage === 'start',
  );
  await assert.rejects(
    runSmartClipJob({
      src: 'video.mp4',
      request: async () => ({ status: 200, data: { success: true } }),
    }),
    (error) => error.code === 'missing_job_id',
  );
});

test('smartClipJobService: cancelled and failed jobs surface typed failures', async () => {
  await assert.rejects(
    runSmartClipJob({ src: 'video.mp4', signal: { aborted: true }, request: async () => ({}) }),
    (error) => error.code === 'cancelled',
  );
  let call = 0;
  await assert.rejects(
    runSmartClipJob({
      src: 'video.mp4',
      request: async () => {
        call += 1;
        if (call === 1) return { status: 200, data: { success: true, jobId: 'job-2' } };
        return { status: 200, data: { success: true, status: 'failed', stage: 'render', error: 'boom' } };
      },
    }),
    (error) => error.code === 'job_failed' && error.stage === 'render' && /boom/.test(error.message),
  );
});

test('smartClipJobService: 状态查询偶发超时会重试，不直接判死任务', async () => {
  let statusCalls = 0;
  const request = async (options) => {
    if (options.url.includes('/status')) {
      statusCalls += 1;
      // 前两次按「超时」抛，第三次才拿到真实状态。
      if (statusCalls <= 2) throw Object.assign(new Error('timeout'), { type: 'TIMEOUT' });
      return { status: 200, data: { success: true, status: 'done', segments: [{ start: 0 }] } };
    }
    return { status: 200, data: { success: true, jobId: 'job/1' } };
  };
  const result = await runSmartClipJob({
    src: 'video.mp4',
    request,
    wait: async () => {},
  });
  assert.equal(result.jobId, 'job/1', '重试后应正常完成，而不是报失败');
  assert.equal(statusCalls, 3);
});

test('smartClipJobService: 重试用尽后报 status_unavailable，并保留根因', async () => {
  let statusCalls = 0;
  const timeout = () => Object.assign(new Error('network down'), { type: 'NETWORK_ERROR' });
  const request = async (options) => {
    if (options.url.includes('/status')) {
      statusCalls += 1;
      throw timeout();
    }
    return { status: 200, data: { success: true, jobId: 'job/1' } };
  };
  await assert.rejects(
    runSmartClipJob({ src: 'video.mp4', request, wait: async () => {} }),
    (error) => {
      assert.equal(error.code, 'status_unavailable', '网络抖动不能伪装成任务失败');
      assert.equal(error.stage, 'status');
      assert.equal(error.cause?.message, 'network down', '根因要保留，否则排查时只剩一句文案');
      return true;
    },
  );
  assert.equal(statusCalls, 4, '首次 + 3 次重试');
});

test('smartClipJobService: 取消时把中止翻译成 cancelled 并带上根因', async () => {
  const controller = new AbortController();
  const request = async (options) => {
    if (options.url.includes('/status')) {
      controller.abort();
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    }
    return { status: 200, data: { success: true, jobId: 'job/1' } };
  };
  await assert.rejects(
    runSmartClipJob({ src: 'video.mp4', request, wait: async () => {}, signal: controller.signal }),
    (error) => {
      assert.equal(error.code, 'cancelled');
      assert.equal(error.stage, 'cancelled');
      assert.equal(error.cause?.name, 'AbortError');
      return true;
    },
  );
});
