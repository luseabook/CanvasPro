import { mkdirSync } from 'node:fs';
import path from 'node:path';
export function buildVideoReverseFfmpegArgs({
  sourceAbs: _0x258d5e,
  outAbs: _0x50573f,
  hasAudio: hasAudio = false,
} = {}) {
  if (!_0x258d5e || !_0x50573f) throw new Error('Invalid video reverse source');
  const _0x4e62a8 = ['[0:v]reverse,setpts=PTS-STARTPTS,format=yuv420p[v]'];
  hasAudio && _0x4e62a8.push('[0:a]areverse,asetpts=PTS-STARTPTS[a]');
  const _0x35f9f5 = ['-y', '-i', _0x258d5e, '-filter_complex', _0x4e62a8.join(';'), '-map', '[v]'];
  return (
    hasAudio ? _0x35f9f5.push('-map', '[a]') : _0x35f9f5.push('-an'),
    _0x35f9f5.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-preset', 'fast'),
    hasAudio && _0x35f9f5.push('-c:a', 'aac'),
    _0x35f9f5.push('-movflags', '+faststart', _0x50573f),
    _0x35f9f5
  );
}
export function createVideoReverseMediaTaskHandler({
  createOutputFilename: _0x2454ee,
  ffprobeHasAudio: _0x13a5a7,
  ffprobeVideoMeta: _0x50c186,
  getOutputDir: _0x4d42a4,
  getRuntimeToolOrFallback: _0x371415,
  resolveMediaTaskSource: _0x14127a,
  toOutputLocalPath: _0xec399,
}) {
  return async (_0x50ded9, _0x507084) => {
    const _0x17dd4f = _0x14127a(_0x50ded9.payload.src),
      _0x3d7819 = await _0x50c186(_0x507084, _0x50ded9, _0x17dd4f);
    if (!_0x3d7819.width || !_0x3d7819.height) throw new Error('Source video has no video stream');
    const _0x331cc9 = await _0x13a5a7(_0x507084, _0x50ded9, _0x17dd4f),
      _0x4ee311 = path.join(_0x4d42a4(), 'ReverseVideo');
    mkdirSync(_0x4ee311, { recursive: true });
    const _0x45531e = _0x2454ee('reverse', 'mp4'),
      _0x43eace = path.join(_0x4ee311, _0x45531e),
      _0x2d1390 = _0xec399('ReverseVideo', _0x45531e),
      _0x9f09d5 = buildVideoReverseFfmpegArgs({
        sourceAbs: _0x17dd4f,
        outAbs: _0x43eace,
        hasAudio: _0x331cc9,
      });
    return (
      await _0x507084.runProcess(_0x50ded9, _0x371415('ffmpeg'), _0x9f09d5, {
        durationSec: _0x3d7819.duration || 0,
        progressMessage: 'Reversing video',
      }),
      {
        success: true,
        filename: _0x45531e,
        path: _0x2d1390,
        localPath: _0x2d1390,
        url: '/' + _0x2d1390,
        videoDuration: _0x3d7819.duration || 0,
        fps: _0x3d7819.fps || 0,
        videoWidth: _0x3d7819.width,
        videoHeight: _0x3d7819.height,
      }
    );
  };
}
