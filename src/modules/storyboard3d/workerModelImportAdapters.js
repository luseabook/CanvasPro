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
function abortError(_0x3a984a = 'Model\x20geometry\x20worker\x20import\x20was\x20cancelled.') {
  const _0x53e6ea = new Error(
    String(_0x3a984a?.['message'] || _0x3a984a || 'Model geometry worker import was cancelled.'),
  );
  return ((_0x53e6ea['name'] = 'AbortError'), (_0x53e6ea['code'] = 'ABORT_ERR'), _0x53e6ea);
}
function workerError(_0x1f10a3, _0x225836 = 'Model\x20geometry\x20worker\x20import\x20failed.') {
  const _0x58a225 = _0x1f10a3?.['error'] || _0x1f10a3 || {},
    _0xb89b97 = new Error(String(_0x58a225['message'] || _0x225836));
  return (
    (_0xb89b97['name'] = String(_0x58a225['name'] || 'Error')),
    (_0xb89b97['code'] = String(_0x58a225['code'] || 'MODEL_WORKER_PARSE_FAILED')),
    _0xb89b97
  );
}
function createDefaultWorkerFactory(_0x4110d4) {
  if (typeof _0x4110d4 !== 'function') return null;
  return (_0x36828d, _0x42b2bc) => new _0x4110d4(_0x36828d, _0x42b2bc);
}
export function supportsStoryboard3DGeometryImportWorker({
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerFactory: _0x4cd4b1,
} = {}) {
  return typeof _0x4cd4b1 === 'function' || typeof WorkerConstructor === 'function';
}
function bindWorkerListener(_0x3e949b, _0x269fb1, _0x35dc9a) {
  if (typeof _0x3e949b?.['addEventListener'] === 'function')
    return (
      _0x3e949b['addEventListener'](_0x269fb1, _0x35dc9a),
      () => _0x3e949b['removeEventListener']?.(_0x269fb1, _0x35dc9a)
    );
  const _0x2a32cb = 'on' + _0x269fb1;
  return (
    (_0x3e949b[_0x2a32cb] = _0x35dc9a),
    () => {
      if (_0x3e949b[_0x2a32cb] === _0x35dc9a) _0x3e949b[_0x2a32cb] = null;
    }
  );
}
export function createStoryboard3DWorkerGeometryImportTask({
  format: _0x23fdc0,
  buffer: _0x39876c,
  name: name = '',
  signal: _0x165988,
  onProgress: _0x521810,
  workerFactory: _0x8b6ef3,
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerUrl: workerUrl = STORYBOARD_3D_GEOMETRY_WORKER_URL,
} = {}) {
  const _0x4d63c0 = String(_0x23fdc0 || '')
    ['trim']()
    ['toLowerCase']();
  if (!STORYBOARD_3D_WORKER_IMPORT_FORMATS['includes'](_0x4d63c0))
    throw new Error(
      'Worker geometry import does not support ' + (_0x4d63c0['toUpperCase']() || 'this format') + '.',
    );
  if (!(_0x39876c instanceof ArrayBuffer))
    throw new TypeError('Worker geometry import requires an ArrayBuffer.');
  const _0x5efcc1 = _0x8b6ef3 || createDefaultWorkerFactory(WorkerConstructor);
  if (!_0x5efcc1)
    throw workerError({ code: 'MODEL_WORKER_UNAVAILABLE', message: 'Module Worker is unavailable.' });
  let _0x560f79 = null,
    _0x44d09b = ![],
    _0xba31f0,
    _0x24197e = () => {},
    _0x885501 = () => {},
    _0x227481 = () => {};
  const _0x14ed13 =
      globalThis['crypto']?.['randomUUID']?.() ||
      'geometry-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x9),
    _0x152c6b = ({ terminate: terminate = !![] } = {}) => {
      (_0x24197e(), _0x885501(), _0x227481());
      if (terminate) _0x560f79?.['terminate']?.();
    },
    _0x3185a6 = new Promise((_0x18069c, _0x1ddf5e) => {
      _0xba31f0 = _0x1ddf5e;
      if (_0x165988?.['aborted']) {
        ((_0x44d09b = !![]), _0x1ddf5e(abortError(_0x165988['reason'])));
        return;
      }
      try {
        _0x560f79 = _0x5efcc1(workerUrl, { type: 'module', name: 'storyboard3d-geometry-import' });
      } catch (_0x8a5f5) {
        ((_0x44d09b = !![]), _0x1ddf5e(workerError(_0x8a5f5, 'Module Worker could not be created.')));
        return;
      }
      if (!_0x560f79 || typeof _0x560f79['postMessage'] !== 'function') {
        ((_0x44d09b = !![]),
          _0x560f79?.['terminate']?.(),
          _0x1ddf5e(
            workerError({
              code: 'MODEL_WORKER_UNAVAILABLE',
              message: 'Worker\x20factory\x20returned\x20an\x20invalid\x20Worker.',
            }),
          ));
        return;
      }
      const _0x25d848 = (_0x32c299, _0x50bda3) => {
        if (_0x44d09b) return;
        ((_0x44d09b = !![]), _0x152c6b(), _0x32c299(_0x50bda3));
      };
      ((_0x24197e = bindWorkerListener(_0x560f79, 'message', (_0x2bc4f6) => {
        const _0x261e1f = _0x2bc4f6?.['data'] || {};
        if (_0x261e1f['requestId'] !== _0x14ed13) return;
        if (_0x261e1f['type'] === 'progress') {
          const _0x32c0d4 = Math['max'](0x0, Math['min'](0x1, Number(_0x261e1f['progress']) || 0x0));
          _0x521810?.(_0x32c0d4, { format: _0x4d63c0, worker: !![] });
        } else {
          if (_0x261e1f['type'] === 'result') _0x25d848(_0x18069c, _0x261e1f['payload']);
          else _0x261e1f['type'] === 'error' && _0x25d848(_0x1ddf5e, workerError(_0x261e1f));
        }
      })),
        (_0x885501 = bindWorkerListener(_0x560f79, 'error', (_0x30745e) => {
          _0x25d848(_0x1ddf5e, workerError(_0x30745e, 'Module Worker crashed during model parsing.'));
        })));
      if (_0x165988?.['addEventListener']) {
        const _0x40a311 = () => _0x25d848(_0x1ddf5e, abortError(_0x165988['reason']));
        (_0x165988['addEventListener']('abort', _0x40a311, { once: !![] }),
          (_0x227481 = () => _0x165988['removeEventListener']?.('abort', _0x40a311)));
      }
      _0x521810?.(0x0, { format: _0x4d63c0, worker: !![] });
      try {
        _0x560f79['postMessage'](
          {
            type: 'parse',
            requestId: _0x14ed13,
            format: _0x4d63c0,
            name: String(name || ''),
            buffer: _0x39876c,
          },
          [_0x39876c],
        );
      } catch (_0x4cbbf7) {
        _0x25d848(_0x1ddf5e, workerError(_0x4cbbf7, 'Model buffer could not be sent to the Worker.'));
      }
    }),
    _0x4589ae = (_0x39c59e = 'Model geometry worker import was terminated.') => {
      if (_0x44d09b) return ![];
      return ((_0x44d09b = !![]), _0x152c6b(), _0xba31f0?.(abortError(_0x39c59e)), !![]);
    };
  return {
    requestId: _0x14ed13,
    promise: _0x3185a6,
    terminate: _0x4589ae,
    abort: _0x4589ae,
    get worker() {
      return _0x560f79;
    },
  };
}
function cachedFileLike(_0x15d835, _0x14873c) {
  return {
    ..._0x15d835,
    name: String(_0x15d835?.['name'] || _0x15d835?.['fileName'] || ''),
    size: _0x14873c['byteLength'],
    async arrayBuffer() {
      return _0x14873c;
    },
  };
}
function attributeFromPayload(_0x1e3d0e) {
  const _0x2b0f37 = new Float32Array(_0x1e3d0e['array']);
  return new threeRuntime['BufferAttribute'](
    _0x2b0f37,
    Math['max'](0x1, Number(_0x1e3d0e['itemSize']) || 0x1),
  );
}
export function rebuildStoryboard3DWorkerGeometryPayload(
  _0xfa97cf,
  {
    materialFactory: materialFactory = (_0x295857) =>
      new threeRuntime['MeshStandardMaterial']({
        color: 0xb8bec8,
        vertexColors: _0x295857['hasAttribute']('color'),
        roughness: 0.72,
        metalness: 0.04,
      }),
  } = {},
) {
  if (!_0xfa97cf || !Array['isArray'](_0xfa97cf['meshes']) || !_0xfa97cf['meshes']['length'])
    throw workerError({
      code: 'MODEL_WORKER_RESULT_INVALID',
      message: 'Worker\x20returned\x20no\x20model\x20geometry.',
    });
  const _0x4a1c0e = new threeRuntime['Group']();
  _0x4a1c0e['name'] = String(_0xfa97cf['name'] || 'Imported model');
  const _0x269898 = [];
  for (const _0x3df917 of _0xfa97cf['meshes']) {
    const _0x49dcbe = new threeRuntime['BufferGeometry']();
    for (const [_0x36d0c3, _0x59922d] of Object['entries'](_0x3df917['attributes'] || {})) {
      if (_0x59922d?.['array'] instanceof ArrayBuffer)
        _0x49dcbe['setAttribute'](_0x36d0c3, attributeFromPayload(_0x59922d));
    }
    if (!_0x49dcbe['hasAttribute']('position')) {
      _0x49dcbe['dispose']();
      throw workerError({
        code: 'MODEL_WORKER_RESULT_INVALID',
        message: 'Worker mesh has no position attribute.',
      });
    }
    if (!_0x49dcbe['hasAttribute']('normal')) _0x49dcbe['computeVertexNormals']();
    (_0x49dcbe['computeBoundingBox'](), _0x49dcbe['computeBoundingSphere'](), _0x269898['push'](_0x49dcbe));
    const _0x29c431 = materialFactory(_0x49dcbe, { format: _0xfa97cf['format'], mesh: _0x3df917 }),
      _0x3fa898 = new threeRuntime['Mesh'](_0x49dcbe, _0x29c431);
    ((_0x3fa898['name'] = String(_0x3df917['name'] || 'Mesh')),
      (_0x3fa898['userData']['storyboard3dMaterialName'] = String(_0x3df917['materialName'] || '')),
      _0x4a1c0e['add'](_0x3fa898));
  }
  return (
    (_0x4a1c0e['userData']['storyboard3dWorkerImport'] = !![]),
    (_0x4a1c0e['userData']['materialLibraries'] = [...(_0xfa97cf['materialLibraries'] || [])]),
    {
      scene: _0x4a1c0e,
      scenes: [_0x4a1c0e],
      animations: [],
      cameras: [],
      geometry: _0xfa97cf['format'] === 'stl' && _0x269898['length'] === 0x1 ? _0x269898[0x0] : undefined,
      bounds: _0xfa97cf['bounds'] || null,
      triangleCount: Math['max'](0x0, Number(_0xfa97cf['triangleCount']) || 0x0),
      materialLibraries: [...(_0xfa97cf['materialLibraries'] || [])],
      workerImport: { used: !![], format: _0xfa97cf['format'] },
    }
  );
}
function isAbort(_0x2623dc, _0x3a4d90) {
  return (
    _0x3a4d90?.['aborted'] === !![] ||
    _0x2623dc?.['name'] === 'AbortError' ||
    _0x2623dc?.['code'] === 'ABORT_ERR'
  );
}
function createWorkerBackedParser({
  format: _0x1c223a,
  fallbackParser: _0x4878ac,
  minBytes: minBytes = DEFAULT_STORYBOARD_3D_WORKER_IMPORT_MIN_BYTES,
  WorkerConstructor: WorkerConstructor = globalThis['Worker'],
  workerFactory: _0x46969f,
  workerUrl: _0x4b0b14,
  materialFactory: _0x1a2386,
  onProgress: _0x43000a,
} = {}) {
  if (typeof _0x4878ac !== 'function')
    throw new TypeError('A\x20main-thread\x20fallback\x20parser\x20is\x20required.');
  return async function _0x5b7259(_0x413c2b, _0x47141c = {}) {
    if (typeof _0x413c2b?.['arrayBuffer'] !== 'function')
      throw new Error(_0x1c223a['toUpperCase']() + ' file is unreadable.');
    const _0x592c9f = await _0x413c2b['arrayBuffer']();
    if (!(_0x592c9f instanceof ArrayBuffer))
      throw new Error(_0x1c223a['toUpperCase']() + ' file did not return an ArrayBuffer.');
    const _0x108e93 = cachedFileLike(_0x413c2b, _0x592c9f),
      _0x3442c7 = Math['max'](0x0, Number(_0x47141c['workerMinBytes'] ?? minBytes) || 0x0),
      _0x42193b = _0x47141c['onWorkerProgress'] || _0x43000a,
      _0x1920b2 = supportsStoryboard3DGeometryImportWorker({
        WorkerConstructor: WorkerConstructor,
        workerFactory: _0x46969f,
      });
    if (!_0x1920b2 || _0x592c9f['byteLength'] < _0x3442c7 || _0x47141c['disableWorker'] === !![])
      return (
        _0x42193b?.(0x0, {
          format: _0x1c223a,
          worker: ![],
          reason: !_0x1920b2 ? 'unavailable' : 'below-threshold',
        }),
        _0x4878ac(_0x108e93, _0x47141c)
      );
    try {
      const _0x54c72b = createStoryboard3DWorkerGeometryImportTask({
          format: _0x1c223a,
          buffer: _0x592c9f['slice'](0x0),
          name: _0x108e93['name'],
          signal: _0x47141c['signal'],
          onProgress: _0x42193b,
          workerFactory: _0x46969f,
          WorkerConstructor: WorkerConstructor,
          workerUrl: _0x4b0b14,
        }),
        _0x545092 = await _0x54c72b['promise'];
      return rebuildStoryboard3DWorkerGeometryPayload(_0x545092, { materialFactory: _0x1a2386 });
    } catch (_0x3cbe68) {
      if (isAbort(_0x3cbe68, _0x47141c['signal'])) throw _0x3cbe68;
      return (
        _0x42193b?.(0x0, { format: _0x1c223a, worker: ![], reason: 'worker-fallback', error: _0x3cbe68 }),
        _0x4878ac(_0x108e93, _0x47141c)
      );
    }
  };
}
export function createThreeObjWorkerStoryboard3DParser(_0x5bebe4 = {}) {
  return createWorkerBackedParser({
    ..._0x5bebe4,
    format: 'obj',
    fallbackParser: _0x5bebe4['fallbackParser'] || createThreeObjStoryboard3DParser(_0x5bebe4['fallback']),
  });
}
export function createThreeStlWorkerStoryboard3DParser(_0x88156a = {}) {
  const _0x3499c9 = _0x88156a['materialFactory'];
  return createWorkerBackedParser({
    ..._0x88156a,
    format: 'stl',
    materialFactory: _0x3499c9,
    fallbackParser:
      _0x88156a['fallbackParser'] || createThreeStlStoryboard3DParser({ materialFactory: _0x3499c9 }),
  });
}
export function createThreeWorkerBackedStoryboard3DModelParsers(_0x149359 = {}) {
  return {
    obj: createThreeObjWorkerStoryboard3DParser(_0x149359['obj']),
    stl: createThreeStlWorkerStoryboard3DParser(_0x149359['stl']),
  };
}
