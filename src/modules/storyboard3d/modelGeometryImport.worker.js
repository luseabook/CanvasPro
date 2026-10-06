import {
  collectStoryboard3DGeometryTransferables,
  parseStoryboard3DWorkerGeometry,
} from './geometryImportWorkerCore.js';
self.addEventListener('message', (value) => {
  const format = value.data || {};
  if (format.type !== 'parse') return;
  try {
    const payload = parseStoryboard3DWorkerGeometry({
      format: format.format,
      buffer: format.buffer,
      name: format.name,
      onProgress: (progress) =>
        self.postMessage({ type: 'progress', requestId: format.requestId, progress: progress }),
    });
    self.postMessage(
      { type: 'result', requestId: format.requestId, payload: payload },
      collectStoryboard3DGeometryTransferables(payload),
    );
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: format.requestId,
      error: {
        name: String(error?.name || 'Error'),
        message: String(error?.message || 'Worker geometry import failed.'),
        code: String(error?.code || 'MODEL_WORKER_PARSE_FAILED'),
      },
    });
  }
});
