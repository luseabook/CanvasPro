import {
  collectStoryboard3DGeometryTransferables,
  parseStoryboard3DWorkerGeometry,
} from './geometryImportWorkerCore.js';
self['addEventListener']('message', (_0x494bf1) => {
  const _0x2d34e8 = _0x494bf1['data'] || {};
  if (_0x2d34e8['type'] !== 'parse') return;
  try {
    const _0x3f7e3a = parseStoryboard3DWorkerGeometry({
      format: _0x2d34e8['format'],
      buffer: _0x2d34e8['buffer'],
      name: _0x2d34e8['name'],
      onProgress: (_0x3572d7) =>
        self['postMessage']({ type: 'progress', requestId: _0x2d34e8['requestId'], progress: _0x3572d7 }),
    });
    self['postMessage'](
      { type: 'result', requestId: _0x2d34e8['requestId'], payload: _0x3f7e3a },
      collectStoryboard3DGeometryTransferables(_0x3f7e3a),
    );
  } catch (_0x29bdf3) {
    self['postMessage']({
      type: 'error',
      requestId: _0x2d34e8['requestId'],
      error: {
        name: String(_0x29bdf3?.['name'] || 'Error'),
        message: String(_0x29bdf3?.['message'] || 'Worker geometry import failed.'),
        code: String(_0x29bdf3?.['code'] || 'MODEL_WORKER_PARSE_FAILED'),
      },
    });
  }
});
