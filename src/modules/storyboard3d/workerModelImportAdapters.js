import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import {
  createThreeObjStoryboard3DParser,
  createThreeStlStoryboard3DParser,
} from './legacyModelImportAdapters.js';
export const DEFAULT_STORYBOARD_3D_WORKER_IMPORT_MIN_BYTES = 0x400 * 0x400;
export const STORYBOARD_3D_WORKER_IMPORT_FORMATS = Object['freeze'](['obj', 'stl']);
export const STORYBOARD_3D_GEOMETRY_WORKER_URL = new URL(
  './modelGeometryImport.worker.js',
  import.meta['url'],
);
function abortError(error = 'Model\x20geometry\x20worker\x20import\x20was\x20cancelled.') {
  const error2 = new Error(
    String(error?.['message'] || error || 'Model geometry worker import was cancelled.'),
  );
  return ((error2['name'] = 'AbortError'), (error2['code'] = 'ABORT_ERR'), error2);
}
function workerError(value, item = 'Model\x20geometry\x20worker\x20import\x20failed.') {
  const error3 = value?.['error'] || value || {},
    error4 = new Error(String(error3['message'] || item));
  return (
    (error4['name'] = String(error3['name'] || 'Error')),
    (error4['code'] = String(error3['code'] || 'MODEL_WORKER_PARSE_FAILED')),
    error4
  );
}
function createDefaultWorkerFactory(handler) {
  if (typeof handler !== 'function') return null;
  return (key, index) => new handler(key, index);
}
export function supportsStoryboard3DGeometryImportWorker({
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerFactory: workerFactory,
} = {}) {
  return typeof workerFactory === 'function' || typeof WorkerConstructor === 'function';
}
function bindWorkerListener(el, result, data) {
  if (typeof el?.['addEventListener'] === 'function')
    return (el['addEventListener'](result, data), () => el['removeEventListener']?.(result, data));
  const options = 'on' + result;
  return (
    (el[options] = data),
    () => {
      if (el[options] === data) el[options] = null;
    }
  );
}
export function createStoryboard3DWorkerGeometryImportTask({
  format: format,
  buffer: buffer,
  name: name = '',
  signal: signal,
  onProgress: onProgress,
  workerFactory: workerFactory2,
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerUrl: workerUrl = STORYBOARD_3D_GEOMETRY_WORKER_URL,
} = {}) {
  const format2 = String(format || '')
    ['trim']()
    ['toLowerCase']();
  if (!STORYBOARD_3D_WORKER_IMPORT_FORMATS['includes'](format2))
    throw new Error(
      'Worker geometry import does not support ' + (format2['toUpperCase']() || 'this format') + '.',
    );
  if (!(buffer instanceof ArrayBuffer))
    throw new TypeError('Worker geometry import requires an ArrayBuffer.');
  const run = workerFactory2 || createDefaultWorkerFactory(WorkerConstructor);
  if (!run) throw workerError({ code: 'MODEL_WORKER_UNAVAILABLE', message: 'Module Worker is unavailable.' });
  let enabled = null,
    target = ![],
    source,
    handler2 = () => {},
    handler3 = () => {},
    handler4 = () => {};
  const requestId =
      globalThis['crypto']?.['randomUUID']?.() ||
      'geometry-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x9),
    handler5 = ({ terminate: terminate = !![] } = {}) => {
      (handler2(), handler3(), handler4());
      if (terminate) enabled?.['terminate']?.();
    },
    promise = new Promise((next, handler6) => {
      source = handler6;
      if (signal?.['aborted']) {
        ((target = !![]), handler6(abortError(signal['reason'])));
        return;
      }
      try {
        enabled = run(workerUrl, { type: 'module', name: 'storyboard3d-geometry-import' });
      } catch (current) {
        ((target = !![]), handler6(workerError(current, 'Module Worker could not be created.')));
        return;
      }
      if (!enabled || typeof enabled['postMessage'] !== 'function') {
        ((target = !![]),
          enabled?.['terminate']?.(),
          handler6(
            workerError({
              code: 'MODEL_WORKER_UNAVAILABLE',
              message: 'Worker\x20factory\x20returned\x20an\x20invalid\x20Worker.',
            }),
          ));
        return;
      }
      const run2 = (handler7, entry) => {
        if (target) return;
        ((target = !![]), handler5(), handler7(entry));
      };
      ((handler2 = bindWorkerListener(enabled, 'message', (record) => {
        const payload = record?.['data'] || {};
        if (payload['requestId'] !== requestId) return;
        if (payload['type'] === 'progress') {
          const handle = Math['max'](0x0, Math['min'](0x1, Number(payload['progress']) || 0x0));
          onProgress?.(handle, { format: format2, worker: !![] });
        } else {
          if (payload['type'] === 'result') run2(next, payload['payload']);
          else payload['type'] === 'error' && run2(handler6, workerError(payload));
        }
      })),
        (handler3 = bindWorkerListener(enabled, 'error', (state) => {
          run2(handler6, workerError(state, 'Module Worker crashed during model parsing.'));
        })));
      if (signal?.['addEventListener']) {
        const config = () => run2(handler6, abortError(signal['reason']));
        (signal['addEventListener']('abort', config, { once: !![] }),
          (handler4 = () => signal['removeEventListener']?.('abort', config)));
      }
      onProgress?.(0x0, { format: format2, worker: !![] });
      try {
        enabled['postMessage'](
          {
            type: 'parse',
            requestId: requestId,
            format: format2,
            name: String(name || ''),
            buffer: buffer,
          },
          [buffer],
        );
      } catch (scope) {
        run2(handler6, workerError(scope, 'Model buffer could not be sent to the Worker.'));
      }
    }),
    terminate2 = (input = 'Model geometry worker import was terminated.') => {
      if (target) return ![];
      return ((target = !![]), handler5(), source?.(abortError(input)), !![]);
    };
  return {
    requestId: requestId,
    promise: promise,
    terminate: terminate2,
    abort: terminate2,
    get worker() {
      return enabled;
    },
  };
}
function cachedFileLike(error5, size) {
  return {
    ...error5,
    name: String(error5?.['name'] || error5?.['fileName'] || ''),
    size: size['byteLength'],
    async arrayBuffer() {
      return size;
    },
  };
}
function attributeFromPayload(output) {
  const float32Array = new Float32Array(output['array']);
  return new threeRuntime['BufferAttribute'](
    float32Array,
    Math['max'](0x1, Number(output['itemSize']) || 0x1),
  );
}
export function rebuildStoryboard3DWorkerGeometryPayload(
  format3,
  {
    materialFactory: materialFactory = (vertexColors) =>
      new threeRuntime['MeshStandardMaterial']({
        color: 0xb8bec8,
        vertexColors: vertexColors['hasAttribute']('color'),
        roughness: 0.72,
        metalness: 0.04,
      }),
  } = {},
) {
  if (!format3 || !Array['isArray'](format3['meshes']) || !format3['meshes']['length'])
    throw workerError({
      code: 'MODEL_WORKER_RESULT_INVALID',
      message: 'Worker\x20returned\x20no\x20model\x20geometry.',
    });
  const scene = new threeRuntime['Group']();
  scene['name'] = String(format3['name'] || 'Imported model');
  const list = [];
  for (const mesh of format3['meshes']) {
    const el2 = new threeRuntime['BufferGeometry']();
    for (const [value2, value3] of Object['entries'](mesh['attributes'] || {})) {
      if (value3?.['array'] instanceof ArrayBuffer) el2['setAttribute'](value2, attributeFromPayload(value3));
    }
    if (!el2['hasAttribute']('position')) {
      el2['dispose']();
      throw workerError({
        code: 'MODEL_WORKER_RESULT_INVALID',
        message: 'Worker mesh has no position attribute.',
      });
    }
    if (!el2['hasAttribute']('normal')) el2['computeVertexNormals']();
    (el2['computeBoundingBox'](), el2['computeBoundingSphere'](), list['push'](el2));
    const materialFactory2 = materialFactory(el2, { format: format3['format'], mesh: mesh }),
      error6 = new threeRuntime['Mesh'](el2, materialFactory2);
    ((error6['name'] = String(mesh['name'] || 'Mesh')),
      (error6['userData']['storyboard3dMaterialName'] = String(mesh['materialName'] || '')),
      scene['add'](error6));
  }
  return (
    (scene['userData']['storyboard3dWorkerImport'] = !![]),
    (scene['userData']['materialLibraries'] = [...(format3['materialLibraries'] || [])]),
    {
      scene: scene,
      scenes: [scene],
      animations: [],
      cameras: [],
      geometry: format3['format'] === 'stl' && list['length'] === 0x1 ? list[0x0] : undefined,
      bounds: format3['bounds'] || null,
      triangleCount: Math['max'](0x0, Number(format3['triangleCount']) || 0x0),
      materialLibraries: [...(format3['materialLibraries'] || [])],
      workerImport: { used: !![], format: format3['format'] },
    }
  );
}
function isAbort(error7, value4) {
  return (
    value4?.['aborted'] === !![] || error7?.['name'] === 'AbortError' || error7?.['code'] === 'ABORT_ERR'
  );
}
function createWorkerBackedParser({
  format: format4,
  fallbackParser: fallbackParser,
  minBytes: minBytes = DEFAULT_STORYBOARD_3D_WORKER_IMPORT_MIN_BYTES,
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerFactory: workerFactory3,
  workerUrl: workerUrl2,
  materialFactory: materialFactory3,
  onProgress: onProgress2,
} = {}) {
  if (typeof fallbackParser !== 'function')
    throw new TypeError('A\x20main-thread\x20fallback\x20parser\x20is\x20required.');
  return async function run3(value5, signal2 = {}) {
    if (typeof value5?.['arrayBuffer'] !== 'function')
      throw new Error(format4['toUpperCase']() + ' file is unreadable.');
    const buffer2 = await value5['arrayBuffer']();
    if (!(buffer2 instanceof ArrayBuffer))
      throw new Error(format4['toUpperCase']() + ' file did not return an ArrayBuffer.');
    const name2 = cachedFileLike(value5, buffer2),
      value6 = Math['max'](0x0, Number(signal2['workerMinBytes'] ?? minBytes) || 0x0),
      onProgress3 = signal2['onWorkerProgress'] || onProgress2,
      supportsStoryboard3DGeometryImportWorker2 = supportsStoryboard3DGeometryImportWorker({
        WorkerConstructor: WorkerConstructor,
        workerFactory: workerFactory3,
      });
    if (
      !supportsStoryboard3DGeometryImportWorker2 ||
      buffer2['byteLength'] < value6 ||
      signal2['disableWorker'] === !![]
    )
      return (
        onProgress3?.(0x0, {
          format: format4,
          worker: ![],
          reason: !supportsStoryboard3DGeometryImportWorker2 ? 'unavailable' : 'below-threshold',
        }),
        fallbackParser(name2, signal2)
      );
    try {
      const storyboard3DWorkerGeometryImportTask = createStoryboard3DWorkerGeometryImportTask({
          format: format4,
          buffer: buffer2['slice'](0x0),
          name: name2['name'],
          signal: signal2['signal'],
          onProgress: onProgress3,
          workerFactory: workerFactory3,
          WorkerConstructor: WorkerConstructor,
          workerUrl: workerUrl2,
        }),
        value7 = await storyboard3DWorkerGeometryImportTask['promise'];
      return rebuildStoryboard3DWorkerGeometryPayload(value7, { materialFactory: materialFactory3 });
    } catch (error8) {
      if (isAbort(error8, signal2['signal'])) throw error8;
      return (
        onProgress3?.(0x0, { format: format4, worker: ![], reason: 'worker-fallback', error: error8 }),
        fallbackParser(name2, signal2)
      );
    }
  };
}
export function createThreeObjWorkerStoryboard3DParser(fallbackParser2 = {}) {
  return createWorkerBackedParser({
    ...fallbackParser2,
    format: 'obj',
    fallbackParser:
      fallbackParser2['fallbackParser'] || createThreeObjStoryboard3DParser(fallbackParser2['fallback']),
  });
}
export function createThreeStlWorkerStoryboard3DParser(fallbackParser3 = {}) {
  const materialFactory4 = fallbackParser3['materialFactory'];
  return createWorkerBackedParser({
    ...fallbackParser3,
    format: 'stl',
    materialFactory: materialFactory4,
    fallbackParser:
      fallbackParser3['fallbackParser'] ||
      createThreeStlStoryboard3DParser({ materialFactory: materialFactory4 }),
  });
}
export function createThreeWorkerBackedStoryboard3DModelParsers(options2 = {}) {
  return {
    obj: createThreeObjWorkerStoryboard3DParser(options2['obj']),
    stl: createThreeStlWorkerStoryboard3DParser(options2['stl']),
  };
}
