import { mkdirSync } from 'node:fs';
import path from 'node:path';
function getTaskSources(_0x3a9909) {
  return Array.isArray(_0x3a9909.payload.srcs)
    ? _0x3a9909.payload.srcs
    : Array.isArray(_0x3a9909.payload.args?.srcs)
      ? _0x3a9909.payload.args.srcs
      : [];
}
async function readFfprobeJson(_0x281a9c, _0x3da14b, _0x10c71f, _0x2048cb) {
  const _0x1de1c7 = await _0x281a9c.runProcess(_0x3da14b, _0x10c71f('ffprobe'), _0x2048cb),
    _0x5a635b = _0x1de1c7.stdout.toString('utf8').trim();
  return _0x5a635b ? JSON.parse(_0x5a635b) : {};
}
async function ffprobeMediaDuration(_0x43b1a4, _0x118282, _0x5236d0, _0x1040a8) {
  try {
    const _0x184b85 = await readFfprobeJson(_0x43b1a4, _0x118282, _0x5236d0, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      _0x1040a8,
    ]);
    return Number(_0x184b85?.format?.duration || 0) || 0;
  } catch {
    return 0;
  }
}
export function createAudioComposeMediaTaskHandler({
  createOutputFilename: _0x68fbe7,
  ffprobeHasAudio: _0x57f8dd,
  getOutputDir: _0x2b7d7e,
  getRuntimeToolOrFallback: _0x4c961a,
  resolveMediaTaskSource: _0x14cc25,
  toOutputLocalPath: _0x2cc0c5,
}) {
  return async (_0x4de7c9, _0xc25d95) => {
    const _0x206eb9 = getTaskSources(_0x4de7c9).map((_0x253aae) => _0x14cc25(_0x253aae));
    if (_0x206eb9.length < 2) throw new Error('Invalid audio compose sources');
    const _0x36bb5d = await Promise.all(
      _0x206eb9.map((_0x3dc21b) => _0x57f8dd(_0xc25d95, _0x4de7c9, _0x3dc21b)),
    );
    if (!_0x36bb5d.every(Boolean)) throw new Error('Source audio has no audio stream');
    const _0x24fdd1 = path.join(_0x2b7d7e(), 'ComposeAudio');
    mkdirSync(_0x24fdd1, { recursive: true });
    const _0x4d48ac = _0x68fbe7('compose', 'mp3'),
      _0x875dc7 = path.join(_0x24fdd1, _0x4d48ac),
      _0x54adb7 = _0x2cc0c5('ComposeAudio', _0x4d48ac),
      _0x487c19 = _0x206eb9.map(
        (_0x535930, _0x764b91) =>
          '[' +
          _0x764b91 +
          ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a' +
          _0x764b91 +
          ']',
      );
    _0x487c19.push(
      _0x206eb9.map((_0x371629, _0x2ab2ac) => '[a' + _0x2ab2ac + ']').join('') +
        'concat=n=' +
        _0x206eb9.length +
        ':v=0:a=1[a]',
    );
    const _0x10ab6b = ['-y'];
    (_0x206eb9.forEach((_0x25fa82) => _0x10ab6b.push('-i', _0x25fa82)),
      _0x10ab6b.push(
        '-filter_complex',
        _0x487c19.join(';'),
        '-map',
        '[a]',
        '-vn',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        _0x875dc7,
      ));
    const _0x24ad52 = await Promise.all(
        _0x206eb9.map((_0x57a17c) => ffprobeMediaDuration(_0xc25d95, _0x4de7c9, _0x4c961a, _0x57a17c)),
      ),
      _0x5b68c9 =
        Number(_0x4de7c9.payload.args?.duration || 0) ||
        _0x24ad52.reduce((_0x231cc7, _0x2fa8eb) => _0x231cc7 + (Number(_0x2fa8eb) || 0), 0);
    return (
      await _0xc25d95.runProcess(_0x4de7c9, _0x4c961a('ffmpeg'), _0x10ab6b, {
        durationSec: _0x5b68c9,
        progressMessage: 'Composing audio',
      }),
      { success: true, filename: _0x4d48ac, path: _0x54adb7, localPath: _0x54adb7, url: '/' + _0x54adb7 }
    );
  };
}
