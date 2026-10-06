import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { finalizeVideoPlaybackProxyMigrationResult } from '../videoPlaybackProxy.js';
const VIDEO_POSTER_TIMEOUT_MS = 60000,
  AUDIO_WAVEFORM_TIMEOUT_MS = 30 * 60 * 1000;
function runVideoTranscode(deps, task, queue, args, options = {}) {
  if (typeof deps.runFfmpegTask === 'function')
    return deps.runFfmpegTask(task, queue, args, options);
  return queue.runProcess(task, deps.getRuntimeToolOrFallback('ffmpeg'), args, options);
}
function createVideoPosterHandler(deps) {
  return async (task, queue) => {
    const source = task.payload.originalLocalPath || task.payload.src,
      sourceAbs = deps.resolveMediaTaskSource(source),
      assetKey =
        String(task.payload.assetId || '').trim() ||
        createHash('sha1').update(source).digest('hex'),
      posterDir = path.join(deps.getAssetsDir(), 'derived', 'video');
    mkdirSync(posterDir, { recursive: true });
    const posterAbs = path.join(posterDir, assetKey + '.poster.jpg'),
      posterRel = deps.toAssetLocalPath('derived', 'video', assetKey + '.poster.jpg'),
      migrated = finalizeVideoPlaybackProxyMigrationResult(
        await deps.ensureAssetVideoPlaybackProxy(task, queue, sourceAbs, assetKey),
        { sourceLocalPath: source, targetVersion: task.payload.videoProxyTargetVersion },
      );
    !existsSync(posterAbs) &&
      (await queue.runProcess(
        task,
        deps.getRuntimeToolOrFallback('ffmpeg'),
        ['-y', '-ss', '0.1', '-i', sourceAbs, '-frames:v', '1', '-vf', 'scale=640:-2', posterAbs],
        { timeoutMs: VIDEO_POSTER_TIMEOUT_MS },
      ));
    const result = {
      ...migrated,
      posterLocalPath: posterRel,
      thumbLocalPath: posterRel,
      posterUrl: '/' + posterRel,
      thumbUrl: '/' + posterRel,
    };
    if (task.payload.assetId) {
      const updated = deps.updateAssetRecord(
        task.payload.assetId,
        {
          ...result,
          status: 'ready',
          error: '',
          mediaTaskId: task.id,
          mediaTaskKind: task.kind,
          mediaTaskStatus: 'complete',
          mediaTaskProgress: 1,
          mediaTaskError: '',
        },
        { expectedMediaTaskId: task.id },
      );
      deps.sendAssetUpdated(updated);
    }
    return result;
  };
}
function createAudioWaveformHandler(deps) {
  return async (task, queue) => {
    const source = task.payload.originalLocalPath || task.payload.src,
      sourceAbs = deps.resolveMediaTaskSource(source),
      assetKey =
        String(task.payload.assetId || '').trim() ||
        createHash('sha1').update(source).digest('hex'),
      waveformDir = path.join(deps.getAssetsDir(), 'derived', 'audio');
    mkdirSync(waveformDir, { recursive: true });
    const waveformAbs = path.join(waveformDir, assetKey + '.waveform.json'),
      waveformRel = deps.toAssetLocalPath('derived', 'audio', assetKey + '.waveform.json');
    if (!existsSync(waveformAbs)) {
      const capture = await queue.runProcess(
        task,
        deps.getRuntimeToolOrFallback('ffmpeg'),
        ['-v', 'error', '-i', sourceAbs, '-ac', '1', '-ar', '8000', '-f', 'f32le', 'pipe:1'],
        { timeoutMs: AUDIO_WAVEFORM_TIMEOUT_MS },
      );
      writeFileSync(
        waveformAbs,
        JSON.stringify(deps.buildWaveformJsonFromFloat32(capture.stdout)) + '\n',
        'utf8',
      );
    }
    const result = { waveformLocalPath: waveformRel, waveformUrl: '/' + waveformRel };
    if (task.payload.assetId) {
      const updated = deps.updateAssetRecord(
        task.payload.assetId,
        {
          ...result,
          status: 'ready',
          error: '',
          mediaTaskId: task.id,
          mediaTaskKind: task.kind,
          mediaTaskStatus: 'complete',
          mediaTaskProgress: 1,
          mediaTaskError: '',
        },
        { expectedMediaTaskId: task.id },
      );
      deps.sendAssetUpdated(updated);
    }
    return result;
  };
}
function createVideoFirstFrameHandler(deps) {
  return async (task, queue) => {
    const source = String(task.payload.src || '').trim(),
      sourceAbs = deps.resolveMediaTaskSource(source),
      stat = statSync(sourceAbs),
      cacheKey = source.replace(/^\/+/, '') + '|' + stat.mtimeMs + '|' + stat.size,
      digest = createHash('sha1').update(cacheKey).digest('hex').slice(0, 12),
      thumbDir = path.join(deps.getOutputDir(), 'VideoThumbs');
    mkdirSync(thumbDir, { recursive: true });
    const filename = 'vthumb_' + digest + '.jpg',
      thumbAbs = path.join(thumbDir, filename),
      thumbRel = deps.toOutputLocalPath('VideoThumbs', filename);
    return (
      !existsSync(thumbAbs) &&
        (await queue.runProcess(task, deps.getRuntimeToolOrFallback('ffmpeg'), [
          '-y',
          '-ss',
          '0',
          '-i',
          sourceAbs,
          '-frames:v',
          '1',
          '-vf',
          'scale=240:-2',
          '-q:v',
          '8',
          '-an',
          thumbAbs,
        ])),
      { success: true, localPath: thumbRel, path: thumbRel, url: '/' + thumbRel }
    );
  };
}
function readCutRange(task) {
  const start = Math.max(
      0,
      Number(task.payload.args?.start ?? task.payload.start ?? 0) || 0,
    ),
    end = Math.max(
      0,
      Number(task.payload.args?.end ?? task.payload.end ?? 0) || 0,
    );
  return { start: start, end: end };
}
function createVideoCutHandler(deps) {
  return async (task, queue) => {
    const sourceAbs = deps.resolveMediaTaskSource(task.payload.src),
      { start: start, end: end } = readCutRange(task);
    if (!(end > start)) throw new Error('Invalid video cut range');
    const requestedFps = Math.round(
        Number(
          task.payload.args?.fps ??
            task.payload.fps ??
            task.payload.frameRate,
        ),
      ),
      fps = [16, 24, 30].includes(requestedFps) ? requestedFps : 0,
      cutDir = path.join(deps.getOutputDir(), 'CutVideo');
    mkdirSync(cutDir, { recursive: true });
    const filename = deps.createOutputFilename('cut', 'mp4'),
      outAbs = path.join(cutDir, filename),
      outRel = deps.toOutputLocalPath('CutVideo', filename);
    return (
      await runVideoTranscode(
        deps,
        task,
        queue,
        [
          '-y',
          '-ss',
          String(start),
          '-i',
          sourceAbs,
          '-t',
          String(end - start),
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-profile:v',
          'high',
          '-preset',
          'fast',
          '-c:a',
          'aac',
          ...(fps ? ['-r', String(fps)] : []),
          '-movflags',
          '+faststart',
          outAbs,
        ],
        { durationSec: end - start, progressMessage: 'Cutting video' },
      ),
      { success: true, filename: filename, path: outRel, localPath: outRel, url: '/' + outRel }
    );
  };
}
function createAudioCutHandler(deps) {
  return async (task, queue) => {
    const sourceAbs = deps.resolveMediaTaskSource(task.payload.src),
      { start: start, end: end } = readCutRange(task);
    if (!(end > start)) throw new Error('Invalid audio cut range');
    const cutDir = path.join(deps.getOutputDir(), 'CutAudio');
    mkdirSync(cutDir, { recursive: true });
    const filename = deps.createOutputFilename('cut', 'mp3'),
      outAbs = path.join(cutDir, filename),
      outRel = deps.toOutputLocalPath('CutAudio', filename);
    return (
      await queue.runProcess(
        task,
        deps.getRuntimeToolOrFallback('ffmpeg'),
        [
          '-y',
          '-i',
          sourceAbs,
          '-ss',
          String(start),
          '-t',
          String(end - start),
          '-vn',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '192k',
          outAbs,
        ],
        { durationSec: end - start, progressMessage: 'Cutting audio' },
      ),
      { success: true, filename: filename, path: outRel, localPath: outRel, url: '/' + outRel }
    );
  };
}
function createVideoAudioSeparateHandler(deps) {
  return async (task, queue) => {
    const sourceAbs = deps.resolveMediaTaskSource(task.payload.src),
      meta = await deps.ffprobeVideoMeta(queue, task, sourceAbs);
    if (!meta.width || !meta.height)
      throw new Error('Source video has no video stream');
    if (!(await deps.ffprobeHasAudio(queue, task, sourceAbs)))
      throw new Error('Source video has no audio stream');
    const videoDir = path.join(deps.getOutputDir(), 'SeparateVideo'),
      audioDir = path.join(deps.getOutputDir(), 'SeparateAudio');
    (mkdirSync(videoDir, { recursive: true }), mkdirSync(audioDir, { recursive: true }));
    const videoFilename = deps.createOutputFilename('video', 'mp4'),
      audioFilename = deps.createOutputFilename('audio', 'mp3'),
      videoAbs = path.join(videoDir, videoFilename),
      audioAbs = path.join(audioDir, audioFilename);
    (await queue.runProcess(
      task,
      deps.getRuntimeToolOrFallback('ffmpeg'),
      ['-y', '-i', sourceAbs, '-map', '0:v:0', '-an', '-c:v', 'copy', videoAbs],
      {
        durationSec: meta.duration || 0,
        initialProgress: 0.05,
        progressMessage: 'Extracting video',
      },
    ),
      queue.emitProgress(task, 0.55, 'Extracting audio'),
      await queue.runProcess(
        task,
        deps.getRuntimeToolOrFallback('ffmpeg'),
        ['-y', '-i', sourceAbs, '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', audioAbs],
        {
          durationSec: meta.duration || 0,
          initialProgress: 0.55,
          progressMessage: 'Extracting audio',
        },
      ));
    const videoRel = deps.toOutputLocalPath('SeparateVideo', videoFilename),
      audioRel = deps.toOutputLocalPath('SeparateAudio', audioFilename);
    return {
      success: true,
      video: { filename: videoFilename, path: videoRel, localPath: videoRel, url: '/' + videoRel },
      audio: { filename: audioFilename, path: audioRel, localPath: audioRel, url: '/' + audioRel },
    };
  };
}
function createVideoComposeHandler(deps) {
  return async (task, queue) => {
    const srcs = Array.isArray(task.payload.srcs)
        ? task.payload.srcs
        : Array.isArray(task.payload.args?.srcs)
          ? task.payload.args.srcs
          : [],
      absList = srcs.map((src) => deps.resolveMediaTaskSource(src)),
      includeAudio = task.payload.args?.includeAudio !== false;
    if (absList.length < 1 || (absList.length < 2 && includeAudio))
      throw new Error('Invalid video compose sources');
    const meta = await deps.ffprobeVideoMeta(queue, task, absList[0]);
    if (!meta.width || !meta.height)
      throw new Error('FFprobe failed: missing width/height');
    const audioFlags = includeAudio
        ? await Promise.all(absList.map((source) => deps.ffprobeHasAudio(queue, task, source)))
        : [],
      hasAudio = includeAudio && audioFlags.every(Boolean),
      composeDir = path.join(deps.getOutputDir(), 'ComposeVideo');
    mkdirSync(composeDir, { recursive: true });
    const filename = deps.createOutputFilename('compose', 'mp4'),
      outAbs = path.join(composeDir, filename),
      outRel = deps.toOutputLocalPath('ComposeVideo', filename),
      fps = Math.max(1, Math.round(meta.fps || 30)),
      filters = [];
    absList.forEach((_source, index) => {
      (filters.push(
        '[' +
          index +
          ':v]scale=' +
          meta.width +
          ':' +
          meta.height +
          ':force_original_aspect_ratio=decrease,pad=' +
          meta.width +
          ':' +
          meta.height +
          ':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=' +
          fps +
          ',format=yuv420p,setpts=PTS-STARTPTS[v' +
          index +
          ']',
      ),
        hasAudio &&
          filters.push(
            '[' +
              index +
              ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a' +
              index +
              ']',
          ));
    });
    hasAudio
      ? filters.push(
          absList.map((_source, index) => '[v' + index + '][a' + index + ']').join('') +
            'concat=n=' +
            absList.length +
            ':v=1:a=1[v][a]',
        )
      : filters.push(
          absList.map((_source, index) => '[v' + index + ']').join('') +
            'concat=n=' +
            absList.length +
            ':v=1:a=0[v]',
        );
    const args = ['-y'];
    (absList.forEach((source) => args.push('-i', source)),
      args.push('-filter_complex', filters.join(';'), '-map', '[v]'));
    if (hasAudio) args.push('-map', '[a]');
    return (
      args.push(
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        ...(hasAudio ? ['-c:a', 'aac'] : []),
        '-movflags',
        '+faststart',
        outAbs,
      ),
      await runVideoTranscode(deps, task, queue, args, {
        durationSec:
          Number(task.payload.args?.duration || 0) || meta.duration || 0,
        progressMessage: 'Composing video',
      }),
      { success: true, filename: filename, path: outRel, localPath: outRel, url: '/' + outRel }
    );
  };
}
function createVideoAudioMuxHandler(deps) {
  return async (task, queue) => {
    const payload = task.payload || {},
      args = payload.args || {},
      videoAbs = deps.resolveMediaTaskSource(payload.src || args.src),
      audioAbs = deps.resolveMediaTaskSource(args.audioSrc || payload.audioSrc),
      meta = await deps.ffprobeVideoMeta(queue, task, videoAbs);
    if (!meta.width || !meta.height) throw new Error('Source video has no video stream');
    if (!(await deps.ffprobeHasAudio(queue, task, audioAbs)))
      throw new Error('Source audio has no audio stream');
    const muxDir = path.join(deps.getOutputDir(), 'MuxVideo');
    mkdirSync(muxDir, { recursive: true });
    const filename = deps.createOutputFilename('mux', 'mp4'),
      outAbs = path.join(muxDir, filename),
      outRel = deps.toOutputLocalPath('MuxVideo', filename),
      durationSec = Math.max(0, Number(meta.duration) || 0),
      ffmpegArgs = [
        '-y',
        '-i',
        videoAbs,
        '-i',
        audioAbs,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-af',
        'apad',
        ...(durationSec > 0 ? ['-t', String(durationSec)] : ['-shortest']),
        '-movflags',
        '+faststart',
        outAbs,
      ];
    return (
      await queue.runProcess(task, deps.getRuntimeToolOrFallback('ffmpeg'), ffmpegArgs, {
        durationSec: durationSec,
        progressMessage: 'Muxing video audio',
      }),
      { success: true, filename: filename, path: outRel, localPath: outRel, url: '/' + outRel }
    );
  };
}
export function registerLocalMediaTaskHandlers(queue, deps = {}) {
  if (!queue || typeof queue.setHandler !== 'function') return;
  (queue.setHandler('videoPoster', createVideoPosterHandler(deps)),
    queue.setHandler('audioWaveform', createAudioWaveformHandler(deps)),
    queue.setHandler('videoFirstFrame', createVideoFirstFrameHandler(deps)),
    queue.setHandler('videoCut', createVideoCutHandler(deps)),
    queue.setHandler('audioCut', createAudioCutHandler(deps)),
    queue.setHandler('videoAudioSeparate', createVideoAudioSeparateHandler(deps)),
    queue.setHandler('videoCompose', createVideoComposeHandler(deps)),
    queue.setHandler('videoAudioMux', createVideoAudioMuxHandler(deps)));
}
