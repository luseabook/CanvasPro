import { mkdirSync } from 'node:fs';
import path from 'node:path';
function toNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function normalizeNonNegative(index, result = 0) {
  return Math.max(0, toNumber(index, result));
}
function normalizeRequestedFps(data) {
  const target = Math.round(Number(data) || 0);
  return [16, 24, 30].includes(target) ? target : 0;
}
function normalizeOutputSize(source, next = 0) {
  const count = Math.round(Number(source) || 0);
  return count > 0 ? count : next;
}
function normalizeFilterFps(current, entry = 30) {
  const count2 = Math.round(Number(current) || 0);
  return count2 > 0 ? count2 : Math.max(1, Math.round(Number(entry) || 30));
}
function readRange(options2 = {}, record = {}, payload = '') {
  const handle = payload ? payload + 'Start' : 'start',
    state = payload ? payload + 'End' : 'end',
    start = normalizeNonNegative(record[handle] ?? options2[handle] ?? record.start ?? options2.start, 0),
    end = normalizeNonNegative(record[state] ?? options2[state] ?? record.end ?? options2.end, 0);
  if (!(end > start)) return null;
  return { start: start, end: end, duration: end - start };
}
function normalizeMediaClipExportClips(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((start2) => {
      if (!start2 || typeof start2 !== 'object') return null;
      const src = String(
        start2.src ?? start2.sourceKey ?? start2.localPath ?? start2.path ?? start2.abs ?? '',
      ).trim();
      if (!src) return null;
      const start3 = readRange(start2) || readRange({ start: start2.startSec, end: start2.endSec });
      if (!start3) return null;
      return {
        src: src,
        abs: start2.abs ? String(start2.abs) : '',
        kind: String(start2.kind || '').trim() === 'image' ? 'image' : 'video',
        hasAudio: start2.hasAudio === true,
        start: start3.start,
        end: start3.end,
        duration: start3.duration,
      };
    })
    .filter(Boolean);
}
function normalizeMediaClipExportAudioClips(list2 = []) {
  if (!Array.isArray(list2)) return [];
  return list2
    .map((start4) => {
      if (!start4 || typeof start4 !== 'object') return null;
      if (start4.muted === true || start4.disabled === true) return null;
      const src2 = String(
        start4.src ?? start4.sourceKey ?? start4.localPath ?? start4.path ?? start4.abs ?? '',
      ).trim();
      if (!src2) return null;
      const start5 = readRange(start4) || readRange({ start: start4.startSec, end: start4.endSec });
      if (!start5) return null;
      const timelineStart = normalizeNonNegative(start4.timelineStart ?? start4.timelineStartSec, 0),
        nonNegative = normalizeNonNegative(
          start4.timelineEnd ?? start4.timelineEndSec,
          timelineStart + start5.duration,
        );
      return {
        src: src2,
        abs: start4.abs ? String(start4.abs) : '',
        start: start5.start,
        end: start5.end,
        duration: start5.duration,
        timelineStart: timelineStart,
        timelineEnd: Math.max(timelineStart, nonNegative),
        ...(start4.volume !== undefined && start4.volume !== 1
          ? { volume: Math.max(0, Math.min(1, toNumber(start4.volume, 1))) }
          : {}),
      };
    })
    .filter(Boolean);
}
function buildMediaClipAudioMixFilterParts(list3 = [], config = 0, scope = 0, input = {}) {
  const list4 = normalizeMediaClipExportAudioClips(list3);
  if (!list4.length) return [];
  const output = String(input.itemPrefix || 'a'),
    value2 = String(input.outputLabel || 'a'),
    nonNegative2 = normalizeNonNegative(scope, 0),
    list5 = list4.map((item2, value3) => {
      const value4 = config + value3,
        value5 = Math.max(0, Math.round(item2.timelineStart * 1000));
      return (
        '[' +
        value4 +
        ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,' +
        (item2.volume !== undefined ? 'volume=' + item2.volume + ',' : '') +
        'adelay=' +
        value5 +
        '|' +
        value5 +
        '[' +
        output +
        value3 +
        ']'
      );
    }),
    value6 = list4.map((item3, value7) => '[' + output + value7 + ']').join(''),
    value8 =
      list4.length === 1
        ? '[' + output + '0]apad'
        : value6 + 'amix=inputs=' + list4.length + ':duration=longest:normalize=0,apad';
  return (list5.push(value8 + ',atrim=0:' + nonNegative2 + '[' + value2 + ']'), list5);
}
function buildMediaClipSourceAudioConcatFilterParts(list6 = [], value9 = 'va') {
  const list7 = normalizeMediaClipExportClips(list6),
    enabled = list7.some((item4) => item4.kind === 'video' && item4.hasAudio === true);
  if (!enabled) return [];
  const list8 = list7.map((item5, value10) => {
      const nonNegative3 = normalizeNonNegative(item5.duration, 0),
        value11 = 'vsa' + value10;
      if (item5.kind === 'video' && item5.hasAudio === true)
        return (
          '[' +
          value10 +
          ':a]atrim=start=' +
          item5.start +
          ':end=' +
          item5.end +
          ',asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo[' +
          value11 +
          ']'
        );
      return (
        'anullsrc=channel_layout=stereo:sample_rate=44100,atrim=0:' +
        nonNegative3 +
        ',asetpts=PTS-STARTPTS[' +
        value11 +
        ']'
      );
    }),
    value12 = list7.map((item6, value13) => '[vsa' + value13 + ']').join('');
  return (list8.push(value12 + 'concat=n=' + list7.length + ':v=0:a=1[' + value9 + ']'), list8);
}
function buildMediaClipFinalAudioMixFilterParts(list9 = [], value14 = 0, value15 = 'a') {
  const list10 = Array.isArray(list9) ? list9.map((item7) => String(item7 || '').trim()).filter(Boolean) : [];
  if (!list10.length) return [];
  const nonNegative4 = normalizeNonNegative(value14, 0),
    value16 = list10.join(''),
    value17 =
      list10.length === 1
        ? list10[0] + 'apad'
        : value16 + 'amix=inputs=' + list10.length + ':duration=longest:normalize=0,apad';
  return [value17 + ',atrim=0:' + nonNegative4 + '[' + value15 + ']'];
}
function buildMediaClipExportConcatFfmpegArgs({
  clips: clips = [],
  audioClips: audioClips = [],
  audioAbs: audioAbs = '',
  audioStart: audioStart = 0,
  audioEnd: audioEnd = 0,
  fps: fps = 0,
  outputWidth: outputWidth = 0,
  outputHeight: outputHeight = 0,
  outAbs: outAbs,
} = {}) {
  const list11 = normalizeMediaClipExportClips(clips);
  if (!list11.length || !outAbs) throw new Error('Invalid video clip range');
  const outputSize = normalizeOutputSize(outputWidth),
    outputSize2 = normalizeOutputSize(outputHeight);
  if (!outputSize || !outputSize2) throw new Error('Invalid video output size');
  const list12 = normalizeMediaClipExportAudioClips(audioClips),
    enabled2 = list12.length > 0,
    value18 = !enabled2 && !!audioAbs,
    enabled3 = value18 ? readRange({ start: audioStart, end: audioEnd }) : null;
  if (value18 && !enabled3) throw new Error('Invalid audio clip range');
  const list13 = ['-y'];
  (list11.forEach((item8) => {
    if (item8.kind === 'image') {
      list13.push('-loop', '1', '-t', String(item8.duration), '-i', item8.abs || item8.src);
      return;
    }
    list13.push('-i', item8.abs || item8.src);
  }),
    list12.forEach((item9) => {
      list13.push('-ss', String(item9.start), '-t', String(item9.duration), '-i', item9.abs || item9.src);
    }));
  value18 && list13.push('-ss', String(enabled3.start), '-t', String(enabled3.duration), '-i', audioAbs);
  const filterFps = normalizeFilterFps(fps),
    list14 = list11.map((item10, value19) => {
      const value20 =
        item10.kind === 'image'
          ? '[' + value19 + ':v]'
          : '[' + value19 + ':v]trim=start=' + item10.start + ':end=' + item10.end + ',setpts=PTS-STARTPTS,';
      return (
        value20 +
        'scale=' +
        outputSize +
        ':' +
        outputSize2 +
        ':force_original_aspect_ratio=decrease,pad=' +
        outputSize +
        ':' +
        outputSize2 +
        ':(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=' +
        filterFps +
        ',format=yuv420p,setpts=PTS-STARTPTS[v' +
        value19 +
        ']'
      );
    });
  list14.push(
    list11.map((item11, value21) => '[v' + value21 + ']').join('') +
      'concat=n=' +
      list11.length +
      ':v=1:a=0[v]',
  );
  const value22 = list11.reduce((item12, value23) => item12 + value23.duration, 0),
    list15 = [];
  let value24 = false;
  const list16 = buildMediaClipSourceAudioConcatFilterParts(list11, 'va');
  list16.length && (list14.push(...list16), list15.push('[va]'));
  if (value18)
    list15.length
      ? (list14.push(
          '[' +
            list11.length +
            ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad,atrim=0:' +
            value22 +
            '[ea]',
        ),
        list15.push('[ea]'))
      : (list14.push(
          '[' +
            list11.length +
            ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]',
        ),
        (value24 = true));
  else
    enabled2 &&
      (list15.length
        ? (list14.push(
            ...buildMediaClipAudioMixFilterParts(list12, list11.length, value22, {
              itemPrefix: 'ta',
              outputLabel: 'ta',
            }),
          ),
          list15.push('[ta]'))
        : (list14.push(...buildMediaClipAudioMixFilterParts(list12, list11.length, value22)),
          (value24 = true)));
  return (
    list15.length &&
      (list14.push(...buildMediaClipFinalAudioMixFilterParts(list15, value22, 'a')), (value24 = true)),
    list13.push('-filter_complex', list14.join(';'), '-map', '[v]'),
    value24 && list13.push('-map', '[a]', '-t', String(value22)),
    list13.push(
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
      '-movflags',
      '+faststart',
      outAbs,
    ),
    list13
  );
}
export function buildMediaClipExportFfmpegArgs({
  videoAbs: videoAbs,
  clips: clips = null,
  audioClips: audioClips = [],
  audioAbs: audioAbs = '',
  videoStart: videoStart = 0,
  videoEnd: videoEnd = 0,
  audioStart: audioStart = 0,
  audioEnd: audioEnd = 0,
  sourceHasAudio: sourceHasAudio = false,
  fps: fps = 0,
  outputWidth: outputWidth = 0,
  outputHeight: outputHeight = 0,
  outAbs: outAbs2,
} = {}) {
  if (Array.isArray(clips) && clips.length)
    return buildMediaClipExportConcatFfmpegArgs({
      clips: clips,
      audioClips: audioClips,
      audioAbs: audioAbs,
      audioStart: audioStart,
      audioEnd: audioEnd,
      fps: fps,
      outputWidth: outputWidth,
      outputHeight: outputHeight,
      outAbs: outAbs2,
    });
  const range = readRange({ start: videoStart, end: videoEnd });
  if (!videoAbs || !outAbs2 || !range) throw new Error('Invalid video clip range');
  const list17 = normalizeMediaClipExportAudioClips(audioClips),
    enabled4 = list17.length > 0,
    value25 = !enabled4 && !!audioAbs,
    enabled5 = value25 ? readRange({ start: audioStart, end: audioEnd }) : null;
  if (value25 && !enabled5) throw new Error('Invalid audio clip range');
  const list18 = ['-y', '-ss', String(range.start), '-t', String(range.duration), '-i', videoAbs];
  list17.forEach((item13) => {
    list18.push('-ss', String(item13.start), '-t', String(item13.duration), '-i', item13.abs || item13.src);
  });
  if (enabled4) {
    const list19 = [];
    if (sourceHasAudio === true) {
      const list20 = [];
      (list19.push(
        '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:' +
          range.duration +
          ',asetpts=PTS-STARTPTS[va]',
      ),
        list20.push('[va]'),
        list19.push(
          ...buildMediaClipAudioMixFilterParts(list17, 1, range.duration, {
            itemPrefix: 'ta',
            outputLabel: 'ta',
          }),
        ),
        list20.push('[ta]'),
        list19.push(...buildMediaClipFinalAudioMixFilterParts(list20, range.duration, 'a')));
    } else list19.push(...buildMediaClipAudioMixFilterParts(list17, 1, range.duration));
    list18.push(
      '-filter_complex',
      list19.join(';'),
      '-map',
      '0:v:0',
      '-map',
      '[a]',
      '-t',
      String(range.duration),
    );
  } else {
    if (value25) {
      list18.push('-ss', String(enabled5.start), '-t', String(enabled5.duration), '-i', audioAbs);
      const list21 = [];
      if (sourceHasAudio === true) {
        const list22 = [];
        (list21.push(
          '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:' +
            range.duration +
            ',asetpts=PTS-STARTPTS[va]',
        ),
          list22.push('[va]'),
          list21.push(
            '[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad,atrim=0:' +
              range.duration +
              '[ea]',
          ),
          list22.push('[ea]'),
          list21.push(...buildMediaClipFinalAudioMixFilterParts(list22, range.duration, 'a')));
      } else
        list21.push('[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]');
      list18.push(
        '-filter_complex',
        list21.join(';'),
        '-map',
        '0:v:0',
        '-map',
        '[a]',
        '-t',
        String(range.duration),
      );
    } else list18.push('-map', '0:v:0', '-map', '0:a?');
  }
  list18.push(
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
  );
  const requestedFps = normalizeRequestedFps(fps);
  if (requestedFps) list18.push('-r', String(requestedFps));
  return (list18.push('-movflags', '+faststart', outAbs2), list18);
}
export function createMediaClipExportTaskHandler({
  createOutputFilename: createOutputFilename,
  ffprobeHasAudio: ffprobeHasAudio,
  ffprobeVideoMeta: ffprobeVideoMeta,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  runFfmpegTask: runFfmpegTask,
  resolveMediaTaskSource: resolveMediaTaskSource,
  toOutputLocalPath: toOutputLocalPath,
}) {
  return async (value26, value27) => {
    const value28 = value26.payload || {},
      value29 = value28.args || {},
      list23 = normalizeMediaClipExportClips(value29.clips || value28.clips),
      list24 = normalizeMediaClipExportAudioClips(value29.audioClips || value28.audioClips),
      value30 = list24.length ? '' : String(value29.audioSrc ?? value28.audioSrc ?? '').trim(),
      audioAbs2 = value30 ? resolveMediaTaskSource(value30) : '',
      audioStart2 = audioAbs2 ? readRange(value28, value29, 'audio') : null;
    if (audioAbs2 && !audioStart2) throw new Error('Invalid audio clip range');
    async function run(enabled6, value31 = null) {
      if (!enabled6 || value31?.kind === 'image' || typeof ffprobeHasAudio !== 'function') return false;
      return ffprobeHasAudio(value27, value26, enabled6);
    }
    let videoAbs2 = '',
      videoStart2 = null,
      clips2 = [],
      sourceHasAudio2 = false;
    if (list23.length)
      clips2 = await Promise.all(
        list23.map(async (args2) => {
          const abs = resolveMediaTaskSource(args2.src);
          return { ...args2, abs: abs, hasAudio: await run(abs, args2) };
        }),
      );
    else {
      ((videoAbs2 = resolveMediaTaskSource(value28.src || value28.videoSrc)),
        (videoStart2 = readRange(value28, value29, 'video')));
      if (!videoStart2) throw new Error('Invalid video clip range');
      sourceHasAudio2 = await run(videoAbs2);
    }
    const audioClips2 = list24.map((args3) => ({ ...args3, abs: resolveMediaTaskSource(args3.src) })),
      value32 = clips2.find((item14) => item14.kind === 'video')?.abs || clips2[0]?.abs || videoAbs2,
      outputWidth2 = await ffprobeVideoMeta(value27, value26, value32);
    if (!outputWidth2.width || !outputWidth2.height) throw new Error('Source video has no video stream');
    const value33 = path.join(getOutputDir(), 'ClipVideo');
    mkdirSync(value33, { recursive: true });
    const filename = createOutputFilename('clip', 'mp4'),
      outAbs3 = path.join(value33, filename),
      path2 = toOutputLocalPath('ClipVideo', filename),
      fps2 = normalizeRequestedFps(value29.fps ?? value28.fps),
      mediaClipExportFfmpegArgs = buildMediaClipExportFfmpegArgs({
        videoAbs: videoAbs2,
        clips: clips2,
        audioClips: audioClips2,
        audioAbs: audioAbs2,
        videoStart: videoStart2?.start || 0,
        videoEnd: videoStart2?.end || 0,
        audioStart: audioStart2?.start || 0,
        audioEnd: audioStart2?.end || 0,
        sourceHasAudio: sourceHasAudio2,
        fps: clips2.length ? fps2 || outputWidth2.fps || 30 : fps2,
        outputWidth: outputWidth2.width,
        outputHeight: outputWidth2.height,
        outAbs: outAbs3,
      }),
      durationSec = clips2.length
        ? clips2.reduce((item15, value34) => item15 + value34.duration, 0)
        : videoStart2.duration,
      runFfmpeg =
        typeof runFfmpegTask === 'function'
          ? runFfmpegTask
          : (task, queue, args, options) =>
              queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), args, options);
    return (
      await runFfmpeg(value26, value27, mediaClipExportFfmpegArgs, {
        durationSec: durationSec,
        progressMessage: 'Exporting clip',
      }),
      {
        success: true,
        filename: filename,
        path: path2,
        localPath: path2,
        url: '/' + path2,
        videoDuration: durationSec,
        fps: fps2 || outputWidth2.fps || 0,
        videoWidth: outputWidth2.width,
        videoHeight: outputWidth2.height,
      }
    );
  };
}
