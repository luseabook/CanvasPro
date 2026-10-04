import { mkdirSync } from 'node:fs';
import path from 'node:path';
function getTaskSources(value) {
  return Array.isArray(value.payload.srcs)
    ? value.payload.srcs
    : Array.isArray(value.payload.args?.srcs)
      ? value.payload.args.srcs
      : [];
}
async function readFfprobeJson(item, key, handler, index) {
  const child = await item.runProcess(key, handler('ffprobe'), index),
    result = child.stdout.toString('utf8').trim();
  return result ? JSON.parse(result) : {};
}
async function ffprobeMediaDuration(data, options, target, source) {
  try {
    const ffprobeJson = await readFfprobeJson(data, options, target, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      source,
    ]);
    return Number(ffprobeJson?.format?.duration || 0) || 0;
  } catch {
    return 0;
  }
}
export function createAudioComposeMediaTaskHandler({
  createOutputFilename: createOutputFilename,
  ffprobeHasAudio: ffprobeHasAudio,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  resolveMediaTaskSource: resolveMediaTaskSource,
  toOutputLocalPath: toOutputLocalPath,
}) {
  return async (next, current) => {
    const list = getTaskSources(next).map((item2) => resolveMediaTaskSource(item2));
    if (list.length < 2) throw new Error('Invalid audio compose sources');
    const list2 = await Promise.all(list.map((item3) => ffprobeHasAudio(current, next, item3)));
    if (!list2.every(Boolean)) throw new Error('Source audio has no audio stream');
    const entry = path.join(getOutputDir(), 'ComposeAudio');
    mkdirSync(entry, { recursive: true });
    const filename = createOutputFilename('compose', 'mp3'),
      record = path.join(entry, filename),
      path2 = toOutputLocalPath('ComposeAudio', filename),
      list3 = list.map(
        (item4, payload) =>
          '[' +
          payload +
          ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a' +
          payload +
          ']',
      );
    list3.push(
      list.map((item5, handle) => '[a' + handle + ']').join('') + 'concat=n=' + list.length + ':v=0:a=1[a]',
    );
    const list4 = ['-y'];
    (list.forEach((item6) => list4.push('-i', item6)),
      list4.push(
        '-filter_complex',
        list3.join(';'),
        '-map',
        '[a]',
        '-vn',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        record,
      ));
    const list5 = await Promise.all(
        list.map((item7) => ffprobeMediaDuration(current, next, getRuntimeToolOrFallback, item7)),
      ),
      durationSec =
        Number(next.payload.args?.duration || 0) ||
        list5.reduce((item8, state) => item8 + (Number(state) || 0), 0);
    return (
      await current.runProcess(next, getRuntimeToolOrFallback('ffmpeg'), list4, {
        durationSec: durationSec,
        progressMessage: 'Composing audio',
      }),
      { success: true, filename: filename, path: path2, localPath: path2, url: '/' + path2 }
    );
  };
}
