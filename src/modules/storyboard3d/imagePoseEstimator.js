import {
  STORYBOARD_3D_IMAGE_POSE_RUNTIME,
  validateStoryboard3DImagePoseFile,
} from './imagePoseRuntimeManifest.js';
export const STORYBOARD_3D_IMAGE_POSE_WORKER_URL = new URL(
  './imagePoseLandmarker.worker.js',
  import.meta['url'],
);
function abortError(error = '姿势识别已取消。') {
  const error2 = new Error(String(error?.['message'] || error || '姿势识别已取消。'));
  return ((error2['name'] = 'AbortError'), (error2['code'] = 'ABORT_ERR'), error2);
}
function poseWorkerError(value, item = '姿势识别失败。') {
  const error3 = value?.['error'] || value || {},
    error4 = new Error(String(error3['message'] || item));
  return (
    (error4['name'] = String(error3['name'] || 'Error')),
    (error4['code'] = String(error3['code'] || 'POSE_ESTIMATION_FAILED')),
    error4
  );
}
function bindWorkerListener(el, key, index) {
  if (typeof el?.['addEventListener'] === 'function')
    return (el['addEventListener'](key, index), () => el['removeEventListener']?.(key, index));
  const result = 'on' + key;
  return (
    (el[result] = index),
    () => {
      if (el[result] === index) el[result] = null;
    }
  );
}
function createRequestId() {
  return (
    globalThis['crypto']?.['randomUUID']?.() ||
    'pose-' + Date['now']() + '-' + Math['random']()['toString'](36)['slice'](2, 9)
  );
}
export function createStoryboard3DImagePoseEstimator({
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerFactory: workerFactory,
  workerUrl: workerUrl = STORYBOARD_3D_IMAGE_POSE_WORKER_URL,
  runtime: runtime = STORYBOARD_3D_IMAGE_POSE_RUNTIME,
  requestTimeoutMs: requestTimeoutMs = 120000,
} = {}) {
  const run =
    workerFactory ||
    (typeof WorkerConstructor === 'function'
      ? (data, options) => new WorkerConstructor(data, options)
      : null);
  let enabled = null,
    handler = () => {},
    handler2 = () => {},
    target = false;
  const map = new Map(),
    handler3 = (source, handler4, next) => {
      const enabled2 = map['get'](source);
      if (!enabled2) return;
      (map['delete'](source), enabled2['removeAbort'](), enabled2['clearTimer'](), handler4(next));
    },
    handler5 = (current) => {
      for (const [entry, promise] of map) {
        (map['delete'](entry), promise['removeAbort'](), promise['clearTimer'](), promise['reject'](current));
      }
    },
    handler6 = ({ terminate: terminate = true } = {}) => {
      (handler(), handler2(), (handler = () => {}), (handler2 = () => {}));
      if (terminate) enabled?.['terminate']?.();
      enabled = null;
    },
    handler7 = () => {
      if (target) throw abortError('姿势识别器已关闭。');
      if (enabled) return enabled;
      if (!run)
        throw poseWorkerError({
          code: 'POSE_WORKER_UNAVAILABLE',
          message: '当前运行环境不支持本地姿势识别 Worker。',
        });
      try {
        enabled = run(workerUrl, { type: 'module', name: 'storyboard3d-image-pose' });
      } catch (record) {
        enabled = null;
        throw poseWorkerError(record, '无法启动本地姿势识别 Worker。');
      }
      if (!enabled || typeof enabled['postMessage'] !== 'function') {
        (enabled?.['terminate']?.(), (enabled = null));
        throw poseWorkerError({ code: 'POSE_WORKER_UNAVAILABLE', message: '本地姿势识别 Worker 不可用。' });
      }
      return (
        (handler = bindWorkerListener(enabled, 'message', (payload) => {
          const handle = payload?.['data'] || {};
          if (handle['type'] === 'result')
            handler3(handle['requestId'], map['get'](handle['requestId'])?.['resolve'], handle['payload']);
          else
            handle['type'] === 'error' &&
              handler3(
                handle['requestId'],
                map['get'](handle['requestId'])?.['reject'],
                poseWorkerError(handle),
              );
        })),
        (handler2 = bindWorkerListener(enabled, 'error', (state) => {
          const poseWorkerError2 = poseWorkerError(state, '本地姿势识别 Worker 异常退出。');
          (handler5(poseWorkerError2), handler6());
        })),
        enabled
      );
    },
    analyze = (image, { signal: signal } = {}) => {
      validateStoryboard3DImagePoseFile(image, runtime);
      if (signal?.['aborted']) return Promise['reject'](abortError(signal['reason']));
      let config;
      try {
        config = handler7();
      } catch (scope) {
        return Promise['reject'](scope);
      }
      const requestId = createRequestId();
      return new Promise((resolve, reject) => {
        let removeAbort = () => {},
          input = null;
        const clearTimer = () => {
          if (input !== null) globalThis['clearTimeout']?.(input);
          input = null;
        };
        if (signal?.['addEventListener']) {
          const output = () => handler3(requestId, reject, abortError(signal['reason']));
          (signal['addEventListener']('abort', output, { once: true }),
            (removeAbort = () => signal['removeEventListener']?.('abort', output)));
        }
        map['set'](requestId, {
          resolve: resolve,
          reject: reject,
          removeAbort: removeAbort,
          clearTimer: clearTimer,
        });
        const count = Math['max'](0, Number(requestTimeoutMs) || 0);
        count > 0 &&
          typeof globalThis['setTimeout'] === 'function' &&
          (input = globalThis['setTimeout'](() => {
            if (!map['has'](requestId)) return;
            const poseWorkerError3 = poseWorkerError({
              code: 'POSE_ESTIMATION_TIMEOUT',
              message: '本地姿势识别超时，请取消后重试或换一张尺寸更小的图片。',
            });
            (handler5(poseWorkerError3), handler6());
          }, count));
        try {
          config['postMessage']({ type: 'estimate', requestId: requestId, image: image });
        } catch (value2) {
          handler3(requestId, reject, poseWorkerError(value2, '无法把图片发送给姿势识别 Worker。'));
        }
      });
    },
    cancel = (value3) => {
      if (!map['size']) return false;
      return (handler5(abortError(value3)), true);
    },
    dispose = () => {
      if (target) return;
      ((target = true), handler5(abortError('编辑器已关闭。')), handler6());
    };
  return {
    analyze: analyze,
    cancel: cancel,
    dispose: dispose,
    get pendingCount() {
      return map['size'];
    },
    get disposed() {
      return target;
    },
  };
}
