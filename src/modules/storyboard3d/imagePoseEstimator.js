import {
  STORYBOARD_3D_IMAGE_POSE_RUNTIME,
  validateStoryboard3DImagePoseFile,
} from './imagePoseRuntimeManifest.js';
export const STORYBOARD_3D_IMAGE_POSE_WORKER_URL = new URL(
  './imagePoseLandmarker.worker.js',
  import.meta['url'],
);
function abortError(_0x235897 = '姿势识别已取消。') {
  const _0x15e82e = new Error(String(_0x235897?.['message'] || _0x235897 || '姿势识别已取消。'));
  return ((_0x15e82e['name'] = 'AbortError'), (_0x15e82e['code'] = 'ABORT_ERR'), _0x15e82e);
}
function poseWorkerError(_0x52e840, _0xbdf6c6 = '姿势识别失败。') {
  const _0x898b52 = _0x52e840?.['error'] || _0x52e840 || {},
    _0x347462 = new Error(String(_0x898b52['message'] || _0xbdf6c6));
  return (
    (_0x347462['name'] = String(_0x898b52['name'] || 'Error')),
    (_0x347462['code'] = String(_0x898b52['code'] || 'POSE_ESTIMATION_FAILED')),
    _0x347462
  );
}
function bindWorkerListener(_0x61784e, _0x72980b, _0x4304e0) {
  if (typeof _0x61784e?.['addEventListener'] === 'function')
    return (
      _0x61784e['addEventListener'](_0x72980b, _0x4304e0),
      () => _0x61784e['removeEventListener']?.(_0x72980b, _0x4304e0)
    );
  const _0x132d7f = 'on' + _0x72980b;
  return (
    (_0x61784e[_0x132d7f] = _0x4304e0),
    () => {
      if (_0x61784e[_0x132d7f] === _0x4304e0) _0x61784e[_0x132d7f] = null;
    }
  );
}
function createRequestId() {
  return (
    globalThis['crypto']?.['randomUUID']?.() ||
    'pose-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x9)
  );
}
export function createStoryboard3DImagePoseEstimator({
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerFactory: _0x242da0,
  workerUrl: workerUrl = STORYBOARD_3D_IMAGE_POSE_WORKER_URL,
  runtime: runtime = STORYBOARD_3D_IMAGE_POSE_RUNTIME,
  requestTimeoutMs: requestTimeoutMs = 0x1d4c0,
} = {}) {
  const _0x5255fd =
    _0x242da0 ||
    (typeof WorkerConstructor === 'function'
      ? (_0x597207, _0x461dd3) => new WorkerConstructor(_0x597207, _0x461dd3)
      : null);
  let _0x36b112 = null,
    _0x1a9d70 = () => {},
    _0x4a5c19 = () => {},
    _0x4774d1 = ![];
  const _0x4134ac = new Map(),
    _0x551c88 = (_0x27579d, _0x2843c5, _0x43d394) => {
      const _0x626c2f = _0x4134ac['get'](_0x27579d);
      if (!_0x626c2f) return;
      (_0x4134ac['delete'](_0x27579d),
        _0x626c2f['removeAbort'](),
        _0x626c2f['clearTimer'](),
        _0x2843c5(_0x43d394));
    },
    _0xe7a9fc = (_0x4bdef9) => {
      for (const [_0x404872, _0x3b1df9] of _0x4134ac) {
        (_0x4134ac['delete'](_0x404872),
          _0x3b1df9['removeAbort'](),
          _0x3b1df9['clearTimer'](),
          _0x3b1df9['reject'](_0x4bdef9));
      }
    },
    _0x74175c = ({ terminate: terminate = !![] } = {}) => {
      (_0x1a9d70(), _0x4a5c19(), (_0x1a9d70 = () => {}), (_0x4a5c19 = () => {}));
      if (terminate) _0x36b112?.['terminate']?.();
      _0x36b112 = null;
    },
    _0x380188 = () => {
      if (_0x4774d1) throw abortError('姿势识别器已关闭。');
      if (_0x36b112) return _0x36b112;
      if (!_0x5255fd)
        throw poseWorkerError({
          code: 'POSE_WORKER_UNAVAILABLE',
          message: '当前运行环境不支持本地姿势识别\x20Worker。',
        });
      try {
        _0x36b112 = _0x5255fd(workerUrl, { type: 'module', name: 'storyboard3d-image-pose' });
      } catch (_0x47b622) {
        _0x36b112 = null;
        throw poseWorkerError(_0x47b622, '无法启动本地姿势识别 Worker。');
      }
      if (!_0x36b112 || typeof _0x36b112['postMessage'] !== 'function') {
        (_0x36b112?.['terminate']?.(), (_0x36b112 = null));
        throw poseWorkerError({ code: 'POSE_WORKER_UNAVAILABLE', message: '本地姿势识别 Worker 不可用。' });
      }
      return (
        (_0x1a9d70 = bindWorkerListener(_0x36b112, 'message', (_0x301a39) => {
          const _0x49e16d = _0x301a39?.['data'] || {};
          if (_0x49e16d['type'] === 'result')
            _0x551c88(
              _0x49e16d['requestId'],
              _0x4134ac['get'](_0x49e16d['requestId'])?.['resolve'],
              _0x49e16d['payload'],
            );
          else
            _0x49e16d['type'] === 'error' &&
              _0x551c88(
                _0x49e16d['requestId'],
                _0x4134ac['get'](_0x49e16d['requestId'])?.['reject'],
                poseWorkerError(_0x49e16d),
              );
        })),
        (_0x4a5c19 = bindWorkerListener(_0x36b112, 'error', (_0x581f7e) => {
          const _0x3638f0 = poseWorkerError(_0x581f7e, '本地姿势识别 Worker 异常退出。');
          (_0xe7a9fc(_0x3638f0), _0x74175c());
        })),
        _0x36b112
      );
    },
    _0x3921f0 = (_0x4383fe, { signal: _0x21b700 } = {}) => {
      validateStoryboard3DImagePoseFile(_0x4383fe, runtime);
      if (_0x21b700?.['aborted']) return Promise['reject'](abortError(_0x21b700['reason']));
      let _0x3120c1;
      try {
        _0x3120c1 = _0x380188();
      } catch (_0x118044) {
        return Promise['reject'](_0x118044);
      }
      const _0x2dec0d = createRequestId();
      return new Promise((_0xbe79f, _0x3611f2) => {
        let _0x2ab6fb = () => {},
          _0x54761e = null;
        const _0x569a23 = () => {
          if (_0x54761e !== null) globalThis['clearTimeout']?.(_0x54761e);
          _0x54761e = null;
        };
        if (_0x21b700?.['addEventListener']) {
          const _0x3d425a = () => _0x551c88(_0x2dec0d, _0x3611f2, abortError(_0x21b700['reason']));
          (_0x21b700['addEventListener']('abort', _0x3d425a, { once: !![] }),
            (_0x2ab6fb = () => _0x21b700['removeEventListener']?.('abort', _0x3d425a)));
        }
        _0x4134ac['set'](_0x2dec0d, {
          resolve: _0xbe79f,
          reject: _0x3611f2,
          removeAbort: _0x2ab6fb,
          clearTimer: _0x569a23,
        });
        const _0x3116ad = Math['max'](0x0, Number(requestTimeoutMs) || 0x0);
        _0x3116ad > 0x0 &&
          typeof globalThis['setTimeout'] === 'function' &&
          (_0x54761e = globalThis['setTimeout'](() => {
            if (!_0x4134ac['has'](_0x2dec0d)) return;
            const _0x25ccf0 = poseWorkerError({
              code: 'POSE_ESTIMATION_TIMEOUT',
              message: '本地姿势识别超时，请取消后重试或换一张尺寸更小的图片。',
            });
            (_0xe7a9fc(_0x25ccf0), _0x74175c());
          }, _0x3116ad));
        try {
          _0x3120c1['postMessage']({ type: 'estimate', requestId: _0x2dec0d, image: _0x4383fe });
        } catch (_0x3ffc63) {
          _0x551c88(_0x2dec0d, _0x3611f2, poseWorkerError(_0x3ffc63, '无法把图片发送给姿势识别 Worker。'));
        }
      });
    },
    _0x524ccb = (_0x1584cb) => {
      if (!_0x4134ac['size']) return ![];
      return (_0xe7a9fc(abortError(_0x1584cb)), !![]);
    },
    _0x4eefec = () => {
      if (_0x4774d1) return;
      ((_0x4774d1 = !![]), _0xe7a9fc(abortError('编辑器已关闭。')), _0x74175c());
    };
  return {
    analyze: _0x3921f0,
    cancel: _0x524ccb,
    dispose: _0x4eefec,
    get pendingCount() {
      return _0x4134ac['size'];
    },
    get disposed() {
      return _0x4774d1;
    },
  };
}
