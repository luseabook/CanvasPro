import { mkdirSync } from 'node:fs';
import path from 'node:path';
function toNumber(_0x291b22, _0x4bb687 = 0) {
  const _0x3173f2 = Number(_0x291b22);
  return Number.isFinite(_0x3173f2) ? _0x3173f2 : _0x4bb687;
}
function normalizeNonNegative(_0x385049, _0x27c41d = 0) {
  return Math.max(0, toNumber(_0x385049, _0x27c41d));
}
function normalizeRequestedFps(_0xcbe81d) {
  const _0x4142e9 = Math.round(Number(_0xcbe81d) || 0);
  return [16, 24, 30].includes(_0x4142e9) ? _0x4142e9 : 0;
}
function normalizeOutputSize(_0x420f12, _0x387eb3 = 0) {
  const _0x983733 = Math.round(Number(_0x420f12) || 0);
  return _0x983733 > 0 ? _0x983733 : _0x387eb3;
}
function normalizeFilterFps(_0x21514e, _0xc7e358 = 30) {
  const _0x5a700e = Math.round(Number(_0x21514e) || 0);
  return _0x5a700e > 0 ? _0x5a700e : Math.max(1, Math.round(Number(_0xc7e358) || 30));
}
function readRange(_0x2f431a = {}, _0x580a79 = {}, _0x20c134 = '') {
  const _0x3ca135 = _0x20c134 ? _0x20c134 + 'Start' : 'start',
    _0x38f68c = _0x20c134 ? _0x20c134 + 'End' : 'end',
    _0x30a236 = normalizeNonNegative(
      _0x580a79[_0x3ca135] ?? _0x2f431a[_0x3ca135] ?? _0x580a79.start ?? _0x2f431a.start,
      0,
    ),
    _0x37b325 = normalizeNonNegative(
      _0x580a79[_0x38f68c] ?? _0x2f431a[_0x38f68c] ?? _0x580a79.end ?? _0x2f431a.end,
      0,
    );
  if (!(_0x37b325 > _0x30a236)) return null;
  return { start: _0x30a236, end: _0x37b325, duration: _0x37b325 - _0x30a236 };
}
function normalizeMediaClipExportClips(_0x32b341 = []) {
  if (!Array.isArray(_0x32b341)) return [];
  return _0x32b341
    .map((_0x406726) => {
      if (!_0x406726 || typeof _0x406726 !== 'object') return null;
      const _0x5042cd = String(
        _0x406726.src ?? _0x406726.sourceKey ?? _0x406726.localPath ?? _0x406726.path ?? _0x406726.abs ?? '',
      ).trim();
      if (!_0x5042cd) return null;
      const _0x20e865 =
        readRange(_0x406726) || readRange({ start: _0x406726.startSec, end: _0x406726.endSec });
      if (!_0x20e865) return null;
      return {
        src: _0x5042cd,
        abs: _0x406726.abs ? String(_0x406726.abs) : '',
        kind: String(_0x406726.kind || '').trim() === 'image' ? 'image' : 'video',
        hasAudio: _0x406726.hasAudio === true,
        start: _0x20e865.start,
        end: _0x20e865.end,
        duration: _0x20e865.duration,
      };
    })
    .filter(Boolean);
}
function normalizeMediaClipExportAudioClips(_0x3bc851 = []) {
  if (!Array.isArray(_0x3bc851)) return [];
  return _0x3bc851
    .map((_0x14c374) => {
      if (!_0x14c374 || typeof _0x14c374 !== 'object') return null;
      if (_0x14c374.muted === true || _0x14c374.disabled === true) return null;
      const _0x5f0a83 = String(
        _0x14c374.src ?? _0x14c374.sourceKey ?? _0x14c374.localPath ?? _0x14c374.path ?? _0x14c374.abs ?? '',
      ).trim();
      if (!_0x5f0a83) return null;
      const _0x22f658 =
        readRange(_0x14c374) || readRange({ start: _0x14c374.startSec, end: _0x14c374.endSec });
      if (!_0x22f658) return null;
      const _0x182789 = normalizeNonNegative(_0x14c374.timelineStart ?? _0x14c374.timelineStartSec, 0),
        _0x579c9a = normalizeNonNegative(
          _0x14c374.timelineEnd ?? _0x14c374.timelineEndSec,
          _0x182789 + _0x22f658.duration,
        );
      return {
        src: _0x5f0a83,
        abs: _0x14c374.abs ? String(_0x14c374.abs) : '',
        start: _0x22f658.start,
        end: _0x22f658.end,
        duration: _0x22f658.duration,
        timelineStart: _0x182789,
        timelineEnd: Math.max(_0x182789, _0x579c9a),
        ...(_0x14c374.volume !== undefined && _0x14c374.volume !== 1 ? { volume: Math.max(0, Math.min(1, toNumber(_0x14c374.volume, 1))) } : {}),
      };
    })
    .filter(Boolean);
}
function buildMediaClipAudioMixFilterParts(_0x137a96 = [], _0x18b18d = 0, _0x1e09a3 = 0, _0x357bf4 = {}) {
  const _0x3ea702 = normalizeMediaClipExportAudioClips(_0x137a96);
  if (!_0x3ea702.length) return [];
  const _0x5b02cd = String(_0x357bf4.itemPrefix || 'a'),
    _0xd28844 = String(_0x357bf4.outputLabel || 'a'),
    _0x40f0b9 = normalizeNonNegative(_0x1e09a3, 0),
    _0x47deda = _0x3ea702.map((_0x377464, _0x588dc7) => {
      const _0x488760 = _0x18b18d + _0x588dc7,
        _0x4aa2a6 = Math.max(0, Math.round(_0x377464.timelineStart * 0x3e8));
      return (
        '[' +
        _0x488760 +
        ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,' +
        (_0x377464.volume !== undefined ? 'volume=' + _0x377464.volume + ',' : '') +
        'adelay=' +
        _0x4aa2a6 +
        '|' +
        _0x4aa2a6 +
        '[' +
        _0x5b02cd +
        _0x588dc7 +
        ']'
      );
    }),
    _0x11562a = _0x3ea702.map((_0x340aa3, _0x521999) => '[' + _0x5b02cd + _0x521999 + ']').join(''),
    _0x4aed48 =
      _0x3ea702.length === 1
        ? '[' + _0x5b02cd + '0]apad'
        : _0x11562a + 'amix=inputs=' + _0x3ea702.length + ':duration=longest:normalize=0,apad';
  return (_0x47deda.push(_0x4aed48 + ',atrim=0:' + _0x40f0b9 + '[' + _0xd28844 + ']'), _0x47deda);
}
function buildMediaClipSourceAudioConcatFilterParts(_0x140227 = [], _0x36c75c = 'va') {
  const _0x2fa8ab = normalizeMediaClipExportClips(_0x140227),
    _0x3108fd = _0x2fa8ab.some((_0x312c5c) => _0x312c5c.kind === 'video' && _0x312c5c.hasAudio === true);
  if (!_0x3108fd) return [];
  const _0x30ae39 = _0x2fa8ab.map((_0x353514, _0x2c7ceb) => {
      const _0x32efe0 = normalizeNonNegative(_0x353514.duration, 0),
        _0x40bfeb = 'vsa' + _0x2c7ceb;
      if (_0x353514.kind === 'video' && _0x353514.hasAudio === true)
        return (
          '[' +
          _0x2c7ceb +
          ':a]atrim=start=' +
          _0x353514.start +
          ':end=' +
          _0x353514.end +
          ',asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo[' +
          _0x40bfeb +
          ']'
        );
      return (
        'anullsrc=channel_layout=stereo:sample_rate=44100,atrim=0:' +
        _0x32efe0 +
        ',asetpts=PTS-STARTPTS[' +
        _0x40bfeb +
        ']'
      );
    }),
    _0x26ce02 = _0x2fa8ab.map((_0x355956, _0x43e0f7) => '[vsa' + _0x43e0f7 + ']').join('');
  return (
    _0x30ae39.push(_0x26ce02 + 'concat=n=' + _0x2fa8ab.length + ':v=0:a=1[' + _0x36c75c + ']'),
    _0x30ae39
  );
}
function buildMediaClipFinalAudioMixFilterParts(_0x3aed1f = [], _0x48a3f9 = 0, _0xc8946f = 'a') {
  const _0x5cd543 = Array.isArray(_0x3aed1f)
    ? _0x3aed1f.map((_0x5a3a81) => String(_0x5a3a81 || '').trim()).filter(Boolean)
    : [];
  if (!_0x5cd543.length) return [];
  const _0x1e733c = normalizeNonNegative(_0x48a3f9, 0),
    _0x472523 = _0x5cd543.join(''),
    _0x2dcdbb =
      _0x5cd543.length === 1
        ? _0x5cd543[0] + 'apad'
        : _0x472523 + 'amix=inputs=' + _0x5cd543.length + ':duration=longest:normalize=0,apad';
  return [_0x2dcdbb + ',atrim=0:' + _0x1e733c + '[' + _0xc8946f + ']'];
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
  outAbs: _0x2804a6,
} = {}) {
  const _0x45aa6e = normalizeMediaClipExportClips(clips);
  if (!_0x45aa6e.length || !_0x2804a6) throw new Error('Invalid video clip range');
  const _0x1772e1 = normalizeOutputSize(outputWidth),
    _0x4ad974 = normalizeOutputSize(outputHeight);
  if (!_0x1772e1 || !_0x4ad974) throw new Error('Invalid video output size');
  const _0x23af2e = normalizeMediaClipExportAudioClips(audioClips),
    _0x4102ff = _0x23af2e.length > 0,
    _0x2f7700 = !_0x4102ff && !!audioAbs,
    _0x396a5d = _0x2f7700 ? readRange({ start: audioStart, end: audioEnd }) : null;
  if (_0x2f7700 && !_0x396a5d) throw new Error('Invalid audio clip range');
  const _0x345679 = ['-y'];
  (_0x45aa6e.forEach((_0x1d5b4e) => {
    if (_0x1d5b4e.kind === 'image') {
      _0x345679.push('-loop', '1', '-t', String(_0x1d5b4e.duration), '-i', _0x1d5b4e.abs || _0x1d5b4e.src);
      return;
    }
    _0x345679.push('-i', _0x1d5b4e.abs || _0x1d5b4e.src);
  }),
    _0x23af2e.forEach((_0x5c4dbc) => {
      _0x345679.push(
        '-ss',
        String(_0x5c4dbc.start),
        '-t',
        String(_0x5c4dbc.duration),
        '-i',
        _0x5c4dbc.abs || _0x5c4dbc.src,
      );
    }));
  _0x2f7700 &&
    _0x345679.push('-ss', String(_0x396a5d.start), '-t', String(_0x396a5d.duration), '-i', audioAbs);
  const _0x228262 = normalizeFilterFps(fps),
    _0x47216e = _0x45aa6e.map((_0x1007e5, _0x7d9656) => {
      const _0x53f36d =
        _0x1007e5.kind === 'image'
          ? '[' + _0x7d9656 + ':v]'
          : '[' +
            _0x7d9656 +
            ':v]trim=start=' +
            _0x1007e5.start +
            ':end=' +
            _0x1007e5.end +
            ',setpts=PTS-STARTPTS,';
      return (
        _0x53f36d +
        'scale=' +
        _0x1772e1 +
        ':' +
        _0x4ad974 +
        ':force_original_aspect_ratio=decrease,pad=' +
        _0x1772e1 +
        ':' +
        _0x4ad974 +
        ':(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=' +
        _0x228262 +
        ',format=yuv420p,setpts=PTS-STARTPTS[v' +
        _0x7d9656 +
        ']'
      );
    });
  _0x47216e.push(
    _0x45aa6e.map((_0x9ef962, _0x2f70ad) => '[v' + _0x2f70ad + ']').join('') +
      'concat=n=' +
      _0x45aa6e.length +
      ':v=1:a=0[v]',
  );
  const _0x4e397f = _0x45aa6e.reduce((_0x123502, _0xb882e1) => _0x123502 + _0xb882e1.duration, 0),
    _0x57bd89 = [];
  let _0xe16ce0 = false;
  const _0x119ea8 = buildMediaClipSourceAudioConcatFilterParts(_0x45aa6e, 'va');
  _0x119ea8.length && (_0x47216e.push(..._0x119ea8), _0x57bd89.push('[va]'));
  if (_0x2f7700)
    _0x57bd89.length
      ? (_0x47216e.push(
          '[' +
            _0x45aa6e.length +
            ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad,atrim=0:' +
            _0x4e397f +
            '[ea]',
        ),
        _0x57bd89.push('[ea]'))
      : (_0x47216e.push(
          '[' +
            _0x45aa6e.length +
            ':a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]',
        ),
        (_0xe16ce0 = true));
  else
    _0x4102ff &&
      (_0x57bd89.length
        ? (_0x47216e.push(
            ...buildMediaClipAudioMixFilterParts(_0x23af2e, _0x45aa6e.length, _0x4e397f, {
              itemPrefix: 'ta',
              outputLabel: 'ta',
            }),
          ),
          _0x57bd89.push('[ta]'))
        : (_0x47216e.push(...buildMediaClipAudioMixFilterParts(_0x23af2e, _0x45aa6e.length, _0x4e397f)),
          (_0xe16ce0 = true)));
  return (
    _0x57bd89.length &&
      (_0x47216e.push(...buildMediaClipFinalAudioMixFilterParts(_0x57bd89, _0x4e397f, 'a')),
      (_0xe16ce0 = true)),
    _0x345679.push('-filter_complex', _0x47216e.join(';'), '-map', '[v]'),
    _0xe16ce0 && _0x345679.push('-map', '[a]', '-t', String(_0x4e397f)),
    _0x345679.push(
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
      _0x2804a6,
    ),
    _0x345679
  );
}
export function buildMediaClipExportFfmpegArgs({
  videoAbs: _0x4090b8,
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
  outAbs: _0x1619ce,
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
      outAbs: _0x1619ce,
    });
  const _0xb9d7ec = readRange({ start: videoStart, end: videoEnd });
  if (!_0x4090b8 || !_0x1619ce || !_0xb9d7ec) throw new Error('Invalid video clip range');
  const _0x2b76a3 = normalizeMediaClipExportAudioClips(audioClips),
    _0x7175aa = _0x2b76a3.length > 0,
    _0x12c5ad = !_0x7175aa && !!audioAbs,
    _0x2c5503 = _0x12c5ad ? readRange({ start: audioStart, end: audioEnd }) : null;
  if (_0x12c5ad && !_0x2c5503) throw new Error('Invalid audio clip range');
  const _0x30fa11 = ['-y', '-ss', String(_0xb9d7ec.start), '-t', String(_0xb9d7ec.duration), '-i', _0x4090b8];
  _0x2b76a3.forEach((_0x48621f) => {
    _0x30fa11.push(
      '-ss',
      String(_0x48621f.start),
      '-t',
      String(_0x48621f.duration),
      '-i',
      _0x48621f.abs || _0x48621f.src,
    );
  });
  if (_0x7175aa) {
    const _0x14ff5f = [];
    if (sourceHasAudio === true) {
      const _0x3d69da = [];
      (_0x14ff5f.push(
        '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:' +
          _0xb9d7ec.duration +
          ',asetpts=PTS-STARTPTS[va]',
      ),
        _0x3d69da.push('[va]'),
        _0x14ff5f.push(
          ...buildMediaClipAudioMixFilterParts(_0x2b76a3, 1, _0xb9d7ec.duration, {
            itemPrefix: 'ta',
            outputLabel: 'ta',
          }),
        ),
        _0x3d69da.push('[ta]'),
        _0x14ff5f.push(...buildMediaClipFinalAudioMixFilterParts(_0x3d69da, _0xb9d7ec.duration, 'a')));
    } else _0x14ff5f.push(...buildMediaClipAudioMixFilterParts(_0x2b76a3, 1, _0xb9d7ec.duration));
    _0x30fa11.push(
      '-filter_complex',
      _0x14ff5f.join(';'),
      '-map',
      '0:v:0',
      '-map',
      '[a]',
      '-t',
      String(_0xb9d7ec.duration),
    );
  } else {
    if (_0x12c5ad) {
      _0x30fa11.push('-ss', String(_0x2c5503.start), '-t', String(_0x2c5503.duration), '-i', audioAbs);
      const _0x26f625 = [];
      if (sourceHasAudio === true) {
        const _0x18dd03 = [];
        (_0x26f625.push(
          '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:' +
            _0xb9d7ec.duration +
            ',asetpts=PTS-STARTPTS[va]',
        ),
          _0x18dd03.push('[va]'),
          _0x26f625.push(
            '[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad,atrim=0:' +
              _0xb9d7ec.duration +
              '[ea]',
          ),
          _0x18dd03.push('[ea]'),
          _0x26f625.push(...buildMediaClipFinalAudioMixFilterParts(_0x18dd03, _0xb9d7ec.duration, 'a')));
      } else
        _0x26f625.push('[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]');
      _0x30fa11.push(
        '-filter_complex',
        _0x26f625.join(';'),
        '-map',
        '0:v:0',
        '-map',
        '[a]',
        '-t',
        String(_0xb9d7ec.duration),
      );
    } else _0x30fa11.push('-map', '0:v:0', '-map', '0:a?');
  }
  _0x30fa11.push(
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
  const _0x2accdd = normalizeRequestedFps(fps);
  if (_0x2accdd) _0x30fa11.push('-r', String(_0x2accdd));
  return (_0x30fa11.push('-movflags', '+faststart', _0x1619ce), _0x30fa11);
}
export function createMediaClipExportTaskHandler({
  createOutputFilename: _0x27d769,
  ffprobeHasAudio: _0x40d9f9,
  ffprobeVideoMeta: _0x5f0b26,
  getOutputDir: _0x1baefd,
  getRuntimeToolOrFallback: _0x2060b4,
  runFfmpegTask: runFfmpegTask,
  resolveMediaTaskSource: _0xce446c,
  toOutputLocalPath: _0x597446,
}) {
  return async (_0x103cac, _0x5bc472) => {
    const _0x29a589 = _0x103cac.payload || {},
      _0x5d04ec = _0x29a589.args || {},
      _0x5bab48 = normalizeMediaClipExportClips(_0x5d04ec.clips || _0x29a589.clips),
      _0x490101 = normalizeMediaClipExportAudioClips(_0x5d04ec.audioClips || _0x29a589.audioClips),
      _0xa01074 = _0x490101.length ? '' : String(_0x5d04ec.audioSrc ?? _0x29a589.audioSrc ?? '').trim(),
      _0x3f596a = _0xa01074 ? _0xce446c(_0xa01074) : '',
      _0x22d0a3 = _0x3f596a ? readRange(_0x29a589, _0x5d04ec, 'audio') : null;
    if (_0x3f596a && !_0x22d0a3) throw new Error('Invalid audio clip range');
    async function _0x28003f(_0x55cf24, _0x1aa42e = null) {
      if (!_0x55cf24 || _0x1aa42e?.kind === 'image' || typeof _0x40d9f9 !== 'function') return false;
      return _0x40d9f9(_0x5bc472, _0x103cac, _0x55cf24);
    }
    let _0x4d5aa6 = '',
      _0x52fc1d = null,
      _0x495301 = [],
      _0xee8a10 = false;
    if (_0x5bab48.length)
      _0x495301 = await Promise.all(
        _0x5bab48.map(async (_0x147980) => {
          const _0x45c9a1 = _0xce446c(_0x147980.src);
          return { ..._0x147980, abs: _0x45c9a1, hasAudio: await _0x28003f(_0x45c9a1, _0x147980) };
        }),
      );
    else {
      ((_0x4d5aa6 = _0xce446c(_0x29a589.src || _0x29a589.videoSrc)),
        (_0x52fc1d = readRange(_0x29a589, _0x5d04ec, 'video')));
      if (!_0x52fc1d) throw new Error('Invalid video clip range');
      _0xee8a10 = await _0x28003f(_0x4d5aa6);
    }
    const _0x2f45df = _0x490101.map((_0x4cb0e5) => ({ ..._0x4cb0e5, abs: _0xce446c(_0x4cb0e5.src) })),
      _0x4f2b9f =
        _0x495301.find((_0x1eab9d) => _0x1eab9d.kind === 'video')?.abs || _0x495301[0]?.abs || _0x4d5aa6,
      _0x1da319 = await _0x5f0b26(_0x5bc472, _0x103cac, _0x4f2b9f);
    if (!_0x1da319.width || !_0x1da319.height) throw new Error('Source video has no video stream');
    const _0x229d83 = path.join(_0x1baefd(), 'ClipVideo');
    mkdirSync(_0x229d83, { recursive: true });
    const _0x5ba678 = _0x27d769('clip', 'mp4'),
      _0x315a92 = path.join(_0x229d83, _0x5ba678),
      _0x309c4a = _0x597446('ClipVideo', _0x5ba678),
      _0x121bf9 = normalizeRequestedFps(_0x5d04ec.fps ?? _0x29a589.fps),
      _0x3544fd = buildMediaClipExportFfmpegArgs({
        videoAbs: _0x4d5aa6,
        clips: _0x495301,
        audioClips: _0x2f45df,
        audioAbs: _0x3f596a,
        videoStart: _0x52fc1d?.start || 0,
        videoEnd: _0x52fc1d?.end || 0,
        audioStart: _0x22d0a3?.start || 0,
        audioEnd: _0x22d0a3?.end || 0,
        sourceHasAudio: _0xee8a10,
        fps: _0x495301.length ? _0x121bf9 || _0x1da319.fps || 30 : _0x121bf9,
        outputWidth: _0x1da319.width,
        outputHeight: _0x1da319.height,
        outAbs: _0x315a92,
      }),
      _0x473683 = _0x495301.length
        ? _0x495301.reduce((_0x383a12, _0x22e8d5) => _0x383a12 + _0x22e8d5.duration, 0)
        : _0x52fc1d.duration,
      runFfmpeg =
        typeof runFfmpegTask === 'function'
          ? runFfmpegTask
          : (task, queue, args, options) => queue.runProcess(task, _0x2060b4('ffmpeg'), args, options);
    return (
      await runFfmpeg(_0x103cac, _0x5bc472, _0x3544fd, {
        durationSec: _0x473683,
        progressMessage: 'Exporting clip',
      }),
      {
        success: true,
        filename: _0x5ba678,
        path: _0x309c4a,
        localPath: _0x309c4a,
        url: '/' + _0x309c4a,
        videoDuration: _0x473683,
        fps: _0x121bf9 || _0x1da319.fps || 0,
        videoWidth: _0x1da319.width,
        videoHeight: _0x1da319.height,
      }
    );
  };
}
