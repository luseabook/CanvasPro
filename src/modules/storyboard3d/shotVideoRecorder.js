import { Storyboard3DSceneRuntime } from './sceneRuntime.js';
import { normalizeStoryboard3DShotAnimation, sampleStoryboard3DShotAnimation } from './shotAnimation.js';
import { resolveStoryboardExportDimensions } from './storyboardExport.js';
import { createDirectorVideoPlan, sampleDirectorVideoPlan } from './directorVideoPlan.js';
export function recordDirectorCanvas({
  canvas: _0x1b8f8c,
  drawFrame: _0x338042,
  duration: _0x120dd3,
  fps: _0x59922b,
  signal: _0x43b033,
  onProgress: _0x121d6a,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x574ea6 = windowObject?.['MediaRecorder'],
    _0x357a5b = ['video/mp4;codecs=avc1.42001E', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8']['find'](
      (_0x480377) => _0x574ea6?.['isTypeSupported']?.(_0x480377),
    );
  if (!_0x357a5b || !_0x1b8f8c?.['captureStream'])
    return Promise['reject'](new Error('当前浏览器不支持画面录制，请使用 Chrome 或 Edge。'));
  if (_0x43b033?.['aborted']) return Promise['reject'](new DOMException('已取消录制', 'AbortError'));
  return new Promise((_0x4151a7, _0x598e56) => {
    let _0x2abc8e,
      _0x4c5d7d,
      _0x3d23fe,
      _0x17a59d,
      _0x4f98f0 = ![],
      _0x5d5374 = 0x0,
      _0xb9dc = null;
    const _0x229566 = [],
      _0x2a2868 = () => {
        windowObject['clearTimeout'](_0x3d23fe);
        if (_0x17a59d != null) windowObject['cancelAnimationFrame']?.(_0x17a59d);
        (_0x43b033?.['removeEventListener']('abort', _0x460331),
          _0x2abc8e?.['getTracks']()['forEach']((_0x4f69bc) => _0x4f69bc['stop']()));
      },
      _0x216b53 = (_0x45c562) => {
        if (_0x4f98f0) return;
        ((_0x4f98f0 = !![]), _0x2a2868());
        if (_0x45c562) _0x598e56(_0x45c562);
        else {
          if (!_0x5d5374) _0x598e56(new Error('录制没有产生视频数据。'));
          else
            _0x4151a7({
              blob: new Blob(_0x229566, { type: _0x357a5b['split'](';')[0x0] }),
              duration: _0x120dd3,
              fps: _0x59922b,
            });
        }
      },
      _0x3f3e36 = (_0x11b545) => {
        ((_0xb9dc ||= _0x11b545), windowObject['clearTimeout'](_0x3d23fe));
        if (_0x4c5d7d?.['state'] && _0x4c5d7d['state'] !== 'inactive') _0x4c5d7d['stop']();
        else _0x216b53(_0xb9dc);
      },
      _0x460331 = () => _0x3f3e36(new DOMException('已取消录制', 'AbortError'));
    try {
      (_0x338042(0x0),
        (_0x2abc8e = _0x1b8f8c['captureStream'](_0x59922b)),
        (_0x4c5d7d = new _0x574ea6(_0x2abc8e, {
          mimeType: _0x357a5b,
          videoBitsPerSecond: Math['min'](
            0x1e84800,
            Math['max'](0x3d0900, _0x1b8f8c['width'] * _0x1b8f8c['height'] * _0x59922b * 0.12),
          ),
        })),
        (_0x4c5d7d['ondataavailable'] = (_0x57f4b2) => {
          if (!_0x57f4b2['data']?.['size']) return;
          (_0x229566['push'](_0x57f4b2['data']), (_0x5d5374 += _0x57f4b2['data']['size']));
          if (_0x5d5374 > 0x200 * 0x400 * 0x400)
            _0x3f3e36(new Error('视频超过\x20512\x20MB，请分镜头录制或降低分辨率。'));
        }),
        (_0x4c5d7d['onerror'] = (_0x45f1d6) => _0x3f3e36(_0x45f1d6['error'] || new Error('视频编码失败。'))),
        (_0x4c5d7d['onstop'] = () => _0x216b53(_0xb9dc)),
        _0x43b033?.['addEventListener']('abort', _0x460331, { once: !![] }));
      const _0x560647 = (_0x25aeba) => {
        if (windowObject['requestAnimationFrame'])
          _0x17a59d = windowObject['requestAnimationFrame'](_0x25aeba);
        else _0x3d23fe = windowObject['setTimeout'](_0x25aeba, 0x3e8 / _0x59922b);
      };
      let _0x5070e0 = 0x0;
      const _0x38f8cd = () => _0x2abc8e['getVideoTracks']?.()[0x0]?.['requestFrame']?.(),
        _0x5a10e0 = () => {
          if (_0x4f98f0 || _0xb9dc) return;
          const _0x5cd70f = Math['min'](
            _0x120dd3,
            (windowObject['performance']['now']() - _0x5070e0) / 0x3e8,
          );
          try {
            (_0x338042(_0x5cd70f),
              _0x38f8cd(),
              _0x121d6a?.({ stage: 'recording', current: _0x5cd70f, total: _0x120dd3 }));
            if (_0x5cd70f >= _0x120dd3)
              _0x560647(() => {
                _0x3d23fe = windowObject['setTimeout'](() => _0x3f3e36(), 0x3e8 / _0x59922b);
              });
            else _0x3d23fe = windowObject['setTimeout'](_0x5a10e0, 0x3e8 / _0x59922b);
          } catch (_0x3ddaaa) {
            _0x3f3e36(_0x3ddaaa);
          }
        };
      ((_0x4c5d7d['onstart'] = () => {
        if (_0x4f98f0 || _0xb9dc) return;
        try {
          (_0x338042(0x0), _0x38f8cd());
        } catch (_0x803e36) {
          _0x3f3e36(_0x803e36);
          return;
        }
        _0x560647(() => {
          ((_0x5070e0 = windowObject['performance']['now']()), _0x5a10e0());
        });
      }),
        _0x4c5d7d['start'](0x3e8));
    } catch (_0x244525) {
      _0x3f3e36(_0x244525);
    }
  });
}
export async function renderStoryboard3DShotVideo({
  project: _0x1499d4,
  shot: _0x3cd90f,
  importedModelResolver: _0x19e439,
  signal: _0x34a714,
  onProgress: _0x18057a,
  windowObject: windowObject = globalThis['window'],
  ..._0x12d0d7
} = {}) {
  const _0x1c6567 = structuredClone(_0x1499d4),
    _0x67b0af =
      _0x1c6567['scenes']['find']((_0x39e108) => _0x39e108['id'] === _0x3cd90f['sceneId']) ||
      _0x1c6567['scenes']['find']((_0x1d9161) => _0x1d9161['id'] === _0x1c6567['activeSceneId']),
    _0x4eaa6b = _0x67b0af?.['shots']['find']((_0x5a1a0e) => _0x5a1a0e['id'] === _0x3cd90f['id']);
  if (!_0x67b0af || !_0x4eaa6b) throw new Error('找不到需要录制的镜头。');
  ((_0x1c6567['activeSceneId'] = _0x67b0af['id']), (_0x67b0af['activeShotId'] = _0x3cd90f['id']));
  const _0x5b7bb1 = resolveStoryboardExportDimensions(_0x12d0d7);
  ((_0x4eaa6b['camera']['aspectRatio'] = _0x5b7bb1['aspectRatio']),
    (_0x4eaa6b['animation'] = normalizeStoryboard3DShotAnimation({ ..._0x4eaa6b['animation'], loop: ![] })),
    _0x4eaa6b['animation']['cameraKeyframes']['forEach']((_0x31c4c5) => {
      _0x31c4c5['camera']['aspectRatio'] = _0x5b7bb1['aspectRatio'];
    }));
  const _0x3827d4 =
      _0x12d0d7['mode'] === 'sequence-video'
        ? new Set((_0x12d0d7['shots'] || [])['map']((_0x425db5) => _0x425db5['id']))
        : new Set([_0x3cd90f['id']]),
    _0x19eec2 = _0x1c6567['scenes']
      ['flatMap']((_0x1693d4) => _0x1693d4['shots'])
      ['filter']((_0xa295f0) => _0x3827d4['has'](_0xa295f0['id'])),
    _0x16aa69 = createDirectorVideoPlan(_0x67b0af, _0x19eec2, {
      ..._0x12d0d7,
      scenes: _0x1c6567['scenes'],
      aspectRatio: _0x5b7bb1['aspectRatio'],
    });
  if (new Set(_0x16aa69['segments']['map']((_0xd71454) => _0xd71454['scene']['id']))['size'] > 0x1)
    return recordDirectorSceneSequence({
      snapshot: _0x1c6567,
      plan: _0x16aa69,
      dimensions: _0x5b7bb1,
      importedModelResolver: _0x19e439,
      signal: _0x34a714,
      onProgress: _0x18057a,
      windowObject: windowObject,
    });
  const _0x17243a = windowObject['document']['createElement']('div'),
    _0x2fd136 = new Storyboard3DSceneRuntime({ container: _0x17243a, importedModelResolver: _0x19e439 });
  try {
    ((_0x2fd136['timelinePreviewActive'] = !![]),
      _0x2fd136['sync']({
        project: _0x1c6567,
        sceneId: _0x67b0af['id'],
        selectedObjectIds: [],
        activeTool: 'select',
      }),
      _0x2fd136['resize'](_0x5b7bb1['width'], _0x5b7bb1['height']),
      await _0x2fd136['waitForCaptureReady']({ signal: _0x34a714 }));
    const { duration: _0x342f05, fps: _0x1792fd } = _0x16aa69,
      _0x3b2146 = await _0x2fd136['withCleanCaptureCanvas']((_0x558706) =>
        recordDirectorCanvas({
          canvas: _0x558706,
          duration: _0x342f05,
          fps: _0x1792fd,
          signal: _0x34a714,
          onProgress: _0x18057a,
          windowObject: windowObject,
          drawFrame: (_0x5b9124) => {
            (_0x2fd136['previewTimelineSample'](sampleDirectorVideoPlan(_0x16aa69, _0x5b9124, _0x67b0af)),
              _0x2fd136['renderNow']());
          },
        }),
      );
    return { ..._0x3b2146, width: _0x5b7bb1['width'], height: _0x5b7bb1['height'] };
  } finally {
    _0x2fd136['dispose']();
  }
}
async function recordDirectorSceneSequence({
  snapshot: _0x1198ad,
  plan: _0x1b59a1,
  dimensions: _0x1620a4,
  importedModelResolver: _0x40a780,
  signal: _0x4176b3,
  onProgress: _0x36cadc,
  windowObject: _0x189174,
}) {
  const _0x490317 = new Map(),
    _0xebbad0 = new Map(),
    _0x133cc6 = _0x189174['document']['createElement']('canvas');
  ((_0x133cc6['width'] = _0x1620a4['width']), (_0x133cc6['height'] = _0x1620a4['height']));
  const _0x3abead = _0x133cc6['getContext']('2d');
  if (!_0x3abead) throw new Error('无法创建多场景录制画布。');
  try {
    for (const _0x16f396 of _0x1b59a1['segments']) {
      if (_0x490317['has'](_0x16f396['scene']['id'])) continue;
      if (_0x4176b3?.['aborted']) throw new DOMException('已取消录制', 'AbortError');
      const _0x3f762b = new Storyboard3DSceneRuntime({
        container: _0x189174['document']['createElement']('div'),
        importedModelResolver: _0x40a780,
      });
      (_0x490317['set'](_0x16f396['scene']['id'], _0x3f762b),
        (_0x3f762b['timelinePreviewActive'] = !![]),
        _0x3f762b['sync']({
          project: _0x1198ad,
          sceneId: _0x16f396['scene']['id'],
          selectedObjectIds: [],
          activeTool: 'select',
        }),
        _0x3f762b['resize'](_0x1620a4['width'], _0x1620a4['height']),
        await _0x3f762b['waitForCaptureReady']({ signal: _0x4176b3 }),
        _0x36cadc?.({ stage: 'preparing', current: 0x0, total: _0x1b59a1['duration'] }));
    }
    const _0x10c9e9 = [..._0x490317],
      _0x2ff382 = (_0x29f075) =>
        _0x29f075 < _0x10c9e9['length']
          ? _0x10c9e9[_0x29f075][0x1]['withCleanCaptureCanvas']((_0x4239b9) => {
              return (_0xebbad0['set'](_0x10c9e9[_0x29f075][0x0], _0x4239b9), _0x2ff382(_0x29f075 + 0x1));
            })
          : recordDirectorCanvas({
              canvas: _0x133cc6,
              duration: _0x1b59a1['duration'],
              fps: _0x1b59a1['fps'],
              signal: _0x4176b3,
              onProgress: _0x36cadc,
              windowObject: _0x189174,
              drawFrame: (_0x129983) => {
                const _0x3f5363 =
                    _0x1b59a1['segments']['find']((_0x450a45) => _0x129983 < _0x450a45['end']) ||
                    _0x1b59a1['segments']['at'](-0x1),
                  _0x145e10 = _0x490317['get'](_0x3f5363['scene']['id']);
                (_0x145e10['previewTimelineSample'](
                  sampleDirectorVideoPlan(_0x1b59a1, _0x129983, _0x3f5363['scene']),
                ),
                  _0x145e10['renderNow'](),
                  _0x3abead['clearRect'](0x0, 0x0, _0x133cc6['width'], _0x133cc6['height']),
                  _0x3abead['drawImage'](
                    _0xebbad0['get'](_0x3f5363['scene']['id']),
                    0x0,
                    0x0,
                    _0x133cc6['width'],
                    _0x133cc6['height'],
                  ));
              },
            });
    return { ...(await _0x2ff382(0x0)), width: _0x1620a4['width'], height: _0x1620a4['height'] };
  } finally {
    for (const _0x3fdcc4 of _0x490317['values']()) _0x3fdcc4['dispose']();
  }
}
