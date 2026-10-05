import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOFTWARE_H264_ENCODER_PROFILE,
  applyHardwareH264EncoderProfile,
  buildHardwareH264EncoderArgs,
  configureFfmpegVideoEncoderRuntime,
  createFfmpegVideoEncoderRuntime,
  probeFfmpegH264Encoder,
  runFfmpegVideoTask,
  usesSoftwareH264Encoder,
} from './ffmpegVideoEncoderRuntime.js';

const NVENC = Object.freeze({ id: 'nvidia-nvenc', codec: 'h264_nvenc', hardware: true });
const ENCODERS_WIN = [
  ' V..... h264_amf',
  ' V..... h264_nvenc',
  ' V..... h264_qsv',
  ' V..... libx264',
].join('\n');
const FFMPEG = 'C:/runtime/ffmpeg/ffmpeg.exe';

// This assertion must run before any configureFfmpegVideoEncoderRuntime() call below.
test('runFfmpegVideoTask throws until the runtime is configured', () => {
  assert.throws(() => runFfmpegVideoTask({}, { runProcess() {} }, []), {
    message: 'FFmpeg video encoder runtime is not configured',
  });
});

test('buildHardwareH264EncoderArgs maps nvenc with its preset ladder', () => {
  assert.deepEqual(buildHardwareH264EncoderArgs(NVENC), [
    '-c:v',
    'h264_nvenc',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-preset',
    'p4',
    '-tune',
    'hq',
    '-rc',
    'vbr',
    '-cq',
    '23',
    '-b:v',
    '0',
  ]);
  const presetOf = (preset) =>
    buildHardwareH264EncoderArgs(NVENC, { softwarePreset: preset })[
      buildHardwareH264EncoderArgs(NVENC, { softwarePreset: preset }).indexOf('-preset') + 1
    ];
  assert.equal(presetOf('ultrafast'), 'p3');
  assert.equal(presetOf('superfast'), 'p3');
  assert.equal(presetOf('veryfast'), 'p3');
  assert.equal(presetOf('slow'), 'p5');
  assert.equal(presetOf('slower'), 'p5');
  assert.equal(presetOf('veryslow'), 'p6');
  assert.equal(presetOf('medium'), 'p4');
  assert.equal(presetOf(' ULTRafast '), 'p3');
});

test('buildHardwareH264EncoderArgs keeps the crf inside 0..51', () => {
  const cqOf = (crf) => {
    const args = buildHardwareH264EncoderArgs(NVENC, { crf: crf });
    return args[args.indexOf('-cq') + 1];
  };
  assert.equal(cqOf(23), '23');
  assert.equal(cqOf(18), '18');
  assert.equal(cqOf(999), '51');
  assert.equal(cqOf(-5), '0');
  assert.equal(cqOf('abc'), '23');
  assert.equal(cqOf(18.4), '18');
});

test('buildHardwareH264EncoderArgs maps amf quality and cqp quantizers', () => {
  const amf = Object.freeze({ id: 'amd-amf', codec: 'h264_amf', hardware: true });
  assert.deepEqual(buildHardwareH264EncoderArgs(amf, { softwarePreset: 'fast', crf: 20 }), [
    '-c:v',
    'h264_amf',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-quality',
    'speed',
    '-rc',
    'cqp',
    '-qp_i',
    '20',
    '-qp_p',
    '20',
    '-qp_b',
    '20',
  ]);
  const balanced = buildHardwareH264EncoderArgs(amf, { softwarePreset: 'medium' });
  assert.equal(balanced[balanced.indexOf('-quality') + 1], 'balanced');
  assert.equal(balanced[balanced.indexOf('-qp_i') + 1], '23');
});

test('buildHardwareH264EncoderArgs maps qsv presets and nv12 pixel format', () => {
  const qsv = Object.freeze({ id: 'intel-qsv', codec: 'h264_qsv', hardware: true });
  const fast = buildHardwareH264EncoderArgs(qsv, { softwarePreset: 'ultrafast', crf: 30 });
  assert.deepEqual(fast, [
    '-c:v',
    'h264_qsv',
    '-pix_fmt',
    'nv12',
    '-profile:v',
    'high',
    '-preset',
    'fast',
    '-global_quality',
    '30',
  ]);
  const medium = buildHardwareH264EncoderArgs(qsv, { softwarePreset: 'medium' });
  assert.equal(medium[medium.indexOf('-preset') + 1], 'medium');
});

test('buildHardwareH264EncoderArgs maps videotoolbox quality from the crf', () => {
  const vt = Object.freeze({ id: 'apple-videotoolbox', codec: 'h264_videotoolbox', hardware: true });
  const fast = buildHardwareH264EncoderArgs(vt, { softwarePreset: 'fast', crf: 23 });
  assert.deepEqual(fast, [
    '-c:v',
    'h264_videotoolbox',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-q:v',
    '66',
    '-prio_speed',
    '1',
  ]);
  const medium = buildHardwareH264EncoderArgs(vt, { softwarePreset: 'medium', crf: 18 });
  assert.equal(medium[medium.indexOf('-q:v') + 1], '73');
  assert.equal(medium[medium.indexOf('-prio_speed') + 1], '0');
  const best = buildHardwareH264EncoderArgs(vt, { crf: 0 });
  assert.equal(best[best.indexOf('-q:v') + 1], '100');
  const worst = buildHardwareH264EncoderArgs(vt, { crf: 999 });
  assert.equal(worst[worst.indexOf('-q:v') + 1], '24');
});

test('buildHardwareH264EncoderArgs falls back to libx264 for unknown codecs', () => {
  assert.deepEqual(buildHardwareH264EncoderArgs({ codec: 'hevc_nvenc', hardware: true }), [
    '-c:v',
    'libx264',
  ]);
  assert.deepEqual(buildHardwareH264EncoderArgs(undefined), ['-c:v', 'libx264']);
});

test('usesSoftwareH264Encoder only matches the exact libx264 pair', () => {
  assert.equal(usesSoftwareH264Encoder(['-c:v', 'libx264']), true);
  assert.equal(usesSoftwareH264Encoder(['-y', '-c:v', 'libx264', '-crf', '20']), true);
  assert.equal(usesSoftwareH264Encoder(['-c:v', 'h264_nvenc']), false);
  assert.equal(usesSoftwareH264Encoder(['-c:v']), false);
  assert.equal(usesSoftwareH264Encoder([]), false);
  assert.equal(usesSoftwareH264Encoder(), false);
});

test('applyHardwareH264EncoderProfile is a no-op for software profiles or foreign args', () => {
  const softwareArgs = ['-y', '-c:v', 'libx264', '-crf', '20'];
  const untouchedCopy = applyHardwareH264EncoderProfile(softwareArgs, SOFTWARE_H264_ENCODER_PROFILE);
  assert.deepEqual(untouchedCopy, softwareArgs);
  assert.notEqual(untouchedCopy, softwareArgs);
  const hardwareArgs = ['-y', '-c:v', 'h264_nvenc'];
  assert.deepEqual(applyHardwareH264EncoderProfile(hardwareArgs, NVENC), hardwareArgs);
  assert.deepEqual(applyHardwareH264EncoderProfile(undefined, NVENC), []);
});

test('applyHardwareH264EncoderProfile swaps the encoder and strips software-only flags', () => {
  const source = [
    '-y',
    '-i',
    'in.mp4',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-pix_fmt',
    'yuv420p',
    'out.mp4',
  ];
  assert.deepEqual(applyHardwareH264EncoderProfile(source, NVENC), [
    '-y',
    '-i',
    'in.mp4',
    '-c:v',
    'h264_nvenc',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-preset',
    'p5',
    '-tune',
    'hq',
    '-rc',
    'vbr',
    '-cq',
    '20',
    '-b:v',
    '0',
    '-c:a',
    'aac',
    'out.mp4',
  ]);
  assert.deepEqual(source, [
    '-y',
    '-i',
    'in.mp4',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-pix_fmt',
    'yuv420p',
    'out.mp4',
  ]);
});

test('applyHardwareH264EncoderProfile uses the fast/23 defaults when flags are absent', () => {
  const result = applyHardwareH264EncoderProfile(['-c:v', 'libx264'], NVENC);
  assert.equal(result[result.indexOf('-preset') + 1], 'p4');
  assert.equal(result[result.indexOf('-cq') + 1], '23');
});

test('probeFfmpegH264Encoder returns the software profile without a usable probe', async () => {
  assert.equal(await probeFfmpegH264Encoder({}), SOFTWARE_H264_ENCODER_PROFILE);
  assert.equal(
    await probeFfmpegH264Encoder({ ffmpegPath: FFMPEG, runCapture: 'nope' }),
    SOFTWARE_H264_ENCODER_PROFILE,
  );
  assert.equal(
    await probeFfmpegH264Encoder({
      ffmpegPath: FFMPEG,
      runCapture: async () => {
        throw new Error('spawn failed');
      },
    }),
    SOFTWARE_H264_ENCODER_PROFILE,
  );
});

test('probeFfmpegH264Encoder selects the first platform encoder that probes successfully', async () => {
  const calls = [];
  const runCapture = async (command, args, options) => {
    calls.push({ command: command, args: args, options: options });
    if (args[0] === '-hide_banner' && args[1] === '-encoders') return Buffer.from(ENCODERS_WIN);
    if (args.includes('h264_nvenc')) throw new Error('nvenc probe failed');
    return Buffer.from('');
  };
  const selected = await probeFfmpegH264Encoder({ ffmpegPath: FFMPEG, platform: 'win32', runCapture: runCapture });
  assert.deepEqual(selected, { id: 'amd-amf', codec: 'h264_amf', hardware: true });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0].args, ['-hide_banner', '-encoders']);
  assert.equal(calls[0].options.cwd, process.cwd());
  assert.equal(calls[0].options.timeoutMs, 15000);
  assert.deepEqual(calls[1].args.slice(0, 10), [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=black:s=256x256:r=1',
    '-frames:v',
    '1',
    '-c:v',
  ]);
  assert.ok(calls[1].args.includes('h264_nvenc'));
  assert.deepEqual(calls[1].args.slice(-3), ['-f', 'null', '-']);
  assert.ok(calls[2].args.includes('h264_amf'));
  assert.equal(calls[2].args.at(-1), '-');
});

test('probeFfmpegH264Encoder ignores encoders that are not exact-name matches', async () => {
  const calls = [];
  const runCapture = async (command, args) => {
    calls.push(args);
    if (args[1] === '-encoders') return 'V..... libx264_nvenc\nV..... h264_amf_extra';
    return Buffer.from('');
  };
  const selected = await probeFfmpegH264Encoder({ ffmpegPath: FFMPEG, platform: 'win32', runCapture: runCapture });
  assert.equal(selected, SOFTWARE_H264_ENCODER_PROFILE);
  assert.equal(calls.length, 1);
});

test('probeFfmpegH264Encoder honours the platform profile table', async () => {
  const runCapture =
    (encoders) =>
    async (command, args) =>
      args[1] === '-encoders' ? encoders : Buffer.from('');
  assert.deepEqual(
    await probeFfmpegH264Encoder({
      ffmpegPath: FFMPEG,
      platform: 'darwin',
      runCapture: runCapture('V..... h264_videotoolbox\n'),
    }),
    { id: 'apple-videotoolbox', codec: 'h264_videotoolbox', hardware: true },
  );
  assert.equal(
    await probeFfmpegH264Encoder({
      ffmpegPath: FFMPEG,
      platform: 'linux',
      runCapture: runCapture(ENCODERS_WIN),
    }),
    SOFTWARE_H264_ENCODER_PROFILE,
  );
  assert.equal(
    await probeFfmpegH264Encoder({
      ffmpegPath: FFMPEG,
      platform: 'darwin',
      runCapture: runCapture(ENCODERS_WIN),
    }),
    SOFTWARE_H264_ENCODER_PROFILE,
  );
});

test('createFfmpegVideoEncoderRuntime rejects a missing process runner', async () => {
  const runtime = createFfmpegVideoEncoderRuntime({ ffmpegPath: FFMPEG });
  await assert.rejects(() => runtime.runTask({}, null, ['-c:v', 'libx264']), {
    message: 'Missing media task process runner',
  });
  await assert.rejects(() => runtime.runTask({}, {}, ['-c:v', 'libx264']), {
    message: 'Missing media task process runner',
  });
});

test('runTask passes non-H.264 jobs straight through without probing', async () => {
  const calls = [];
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async () => {
      calls.push('probe');
      return Buffer.from(ENCODERS_WIN);
    },
  });
  const queue = {
    runProcess: async (task, command, args, options) => {
      calls.push({ task: task, command: command, args: args, options: options });
      return 'done';
    },
  };
  const task = { id: 't1' };
  const args = ['-i', 'in.mp4', '-c:v', 'h264_nvenc'];
  assert.equal(await runtime.runTask(task, queue, args, { timeoutMs: 5 }), 'done');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].args, args);
  assert.equal(calls[0].command, FFMPEG);
  assert.deepEqual(calls[0].options, { timeoutMs: 5 });
  assert.equal(runtime.getCachedProfile(), null);
});

test('runTask keeps the software args when the probe finds no hardware encoder', async () => {
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'linux',
    runCapture: async () => Buffer.from(ENCODERS_WIN),
    logger: { info() {}, warn() {} },
  });
  const seen = [];
  const queue = {
    runProcess: async (task, command, args) => {
      seen.push(args);
      return 'ok';
    },
  };
  const args = ['-c:v', 'libx264', '-crf', '20'];
  assert.equal(await runtime.runTask({}, queue, args), 'ok');
  assert.deepEqual(seen, [args]);
});

test('runTask upgrades software args to the probed hardware encoder', async () => {
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async (command, args) =>
      args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from(''),
    logger: { info() {}, warn() {} },
  });
  const seen = [];
  const queue = {
    runProcess: async (task, command, args) => {
      seen.push(args);
      return 'ok';
    },
  };
  const args = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac'];
  assert.equal(await runtime.runTask({}, queue, args), 'ok');
  assert.equal(seen.length, 1);
  assert.equal(seen[0][seen[0].indexOf('-c:v') + 1], 'h264_nvenc');
  assert.equal(seen[0][seen[0].indexOf('-preset') + 1], 'p5');
  assert.deepEqual(args, ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac']);
});

test('runTask retries with libx264 for the session when the hardware encoder fails', async () => {
  const infos = [];
  const warns = [];
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async (command, args) =>
      args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from(''),
    logger: { info: (message) => infos.push(message), warn: (message) => warns.push(message) },
  });
  const attempts = [];
  const progress = [];
  const task = { id: 't2', progress: 12 };
  const queue = {
    emitProgress: (target, value, message) => progress.push([target, value, message]),
    runProcess: async (target, command, args) => {
      attempts.push(args);
      if (attempts.length === 1) throw new Error('nvenc exploded');
      return 'retried';
    },
  };
  const args = ['-c:v', 'libx264', '-crf', '20'];
  assert.equal(await runtime.runTask(task, queue, args), 'retried');
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0][1], 'h264_nvenc');
  assert.deepEqual(attempts[1], args);
  assert.deepEqual(progress, [[task, 12, 'Hardware encoder unavailable; retrying with CPU']]);
  assert.deepEqual(warns, ['[ffmpeg] h264_nvenc failed; falling back to libx264 for this session.']);
  assert.equal(runtime.getCachedProfile(), SOFTWARE_H264_ENCODER_PROFILE);
  assert.deepEqual(infos, ['[ffmpeg] H.264 encoder selected: nvidia-nvenc (h264_nvenc)']);

  await runtime.runTask(task, queue, args);
  assert.equal(attempts.length, 3);
  assert.deepEqual(attempts[2], args);
});

test('runTask defaults the progress value to zero when the task has none', async () => {
  const progress = [];
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async (command, args) =>
      args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from(''),
    logger: { info() {}, warn() {} },
  });
  const queue = {
    emitProgress: (target, value, message) => progress.push([value, message]),
    runProcess: async (target, command, args) => {
      if (args[1] === 'h264_nvenc') throw new Error('nope');
      return 'ok';
    },
  };
  await runtime.runTask({}, queue, ['-c:v', 'libx264']);
  assert.deepEqual(progress, [[0, 'Hardware encoder unavailable; retrying with CPU']]);
});

test('runTask rethrows cancellation and timeout instead of falling back', async () => {
  for (const failure of [
    Object.assign(new Error('cancelled'), { name: 'MediaTaskCancelledError' }),
    Object.assign(new Error('timeout'), { name: 'MediaTaskProcessTimeoutError' }),
    Object.assign(new Error('timeout'), { code: 'MEDIA_TASK_PROCESS_TIMEOUT' }),
  ]) {
    let attempts = 0;
    const runtime = createFfmpegVideoEncoderRuntime({
      ffmpegPath: FFMPEG,
      platform: 'win32',
      runCapture: async (command, args) =>
        args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from(''),
      logger: { info() {}, warn() {} },
    });
    const queue = {
      runProcess: async () => {
        attempts += 1;
        throw failure;
      },
    };
    await assert.rejects(() => runtime.runTask({}, queue, ['-c:v', 'libx264']), (error) => error === failure);
    assert.equal(attempts, 1);
  }
});

test('runTask tolerates a queue without optional emitProgress/throwIfCancelled hooks', async () => {
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async (command, args) =>
      args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from(''),
    logger: { info() {}, warn() {} },
  });
  let attempts = 0;
  const queue = {
    runProcess: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('nvenc exploded');
      return 'ok';
    },
  };
  assert.equal(await runtime.runTask({}, queue, ['-c:v', 'libx264']), 'ok');
  assert.equal(attempts, 2);
});

test('getProfile probes only once and warmup shares the cached result', async () => {
  let probes = 0;
  const runtime = createFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async (command, args) => {
      probes += 1;
      return args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from('');
    },
    logger: { info() {}, warn() {} },
  });
  assert.equal(runtime.getCachedProfile(), null);
  const [first, second] = await Promise.all([runtime.getProfile(), runtime.getProfile()]);
  assert.deepEqual(first, { id: 'nvidia-nvenc', codec: 'h264_nvenc', hardware: true });
  assert.equal(first, second);
  assert.equal(await runtime.warmup(), first);
  assert.equal(probes, 2);
  assert.equal(runtime.getCachedProfile(), first);
});

test('configureFfmpegVideoEncoderRuntime warms the runtime used by runFfmpegVideoTask', async () => {
  const seen = [];
  const configured = configureFfmpegVideoEncoderRuntime({
    ffmpegPath: FFMPEG,
    platform: 'win32',
    runCapture: async (command, args) =>
      args[1] === '-encoders' ? Buffer.from('V..... h264_nvenc\n') : Buffer.from(''),
    logger: { info() {}, warn() {} },
  });
  assert.equal(configured.getCachedProfile(), null);
  const queue = {
    runProcess: async (task, command, args) => {
      seen.push(args);
      return 'configured';
    },
  };
  assert.equal(await runFfmpegVideoTask({}, queue, ['-c:v', 'libx264']), 'configured');
  assert.equal(seen.length, 1);
  assert.equal(seen[0][seen[0].indexOf('-c:v') + 1], 'h264_nvenc');
  assert.equal(configured.getCachedProfile().id, 'nvidia-nvenc');
});
