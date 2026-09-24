import { detectStoryboard3DModelFormat, importStoryboard3DModelFile } from './modelImport.js';
export const STORYBOARD_3D_MODEL_IMPORT_JOB_STATUSES = Object['freeze']([
  'queued',
  'reading',
  'parsing',
  'completed',
  'error',
  'cancelled',
]);
const TERMINAL_STATUSES = new Set(['completed', 'error', 'cancelled']);
function text(_0x256bf1) {
  return String(_0x256bf1 || '')['trim']();
}
function createJobId(_0x402025) {
  const _0x24944d =
    typeof _0x402025 === 'function' ? _0x402025('model-import') : globalThis['crypto']?.['randomUUID']?.();
  return (
    text(_0x24944d) ||
    'model-import-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x9)
  );
}
function cancellationError(_0x571c4f, _0xb1109d) {
  return new Storyboard3DModelImportJobError(
    text(_0x571c4f?.['message'] || _0x571c4f) || 'Model import was cancelled',
    {
      code: 'MODEL_IMPORT_CANCELLED',
      stage: _0xb1109d,
      cancelled: !![],
      cause: _0x571c4f instanceof Error ? _0x571c4f : undefined,
    },
  );
}
export class Storyboard3DModelImportJobError extends Error {
  constructor(
    _0x4c26ae,
    {
      code: code = 'MODEL_IMPORT_FAILED',
      stage: stage = 'queued',
      cancelled: cancelled = ![],
      cause: _0x5c40c1,
    } = {},
  ) {
    (super(_0x4c26ae, { cause: _0x5c40c1 }),
      (this['name'] = 'Storyboard3DModelImportJobError'),
      (this['code'] = code),
      (this['stage'] = stage),
      (this['cancelled'] = cancelled));
  }
}
export function normalizeStoryboard3DModelImportJobError(_0x30abc1, { stage: stage = 'queued' } = {}) {
  if (_0x30abc1 instanceof Storyboard3DModelImportJobError) return _0x30abc1;
  const _0x2d5fc4 = _0x30abc1?.['name'] === 'AbortError' || _0x30abc1?.['code'] === 'ABORT_ERR';
  if (_0x2d5fc4) return cancellationError(_0x30abc1, stage);
  return new Storyboard3DModelImportJobError(text(_0x30abc1?.['message']) || 'Model import failed', {
    code: text(_0x30abc1?.['code']) || 'MODEL_IMPORT_FAILED',
    stage: stage,
    cause: _0x30abc1 instanceof Error ? _0x30abc1 : undefined,
  });
}
export function yieldStoryboard3DModelImportStart({
  windowObject: windowObject = globalThis['window'],
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
} = {}) {
  return new Promise((_0x5c46f7) => {
    const _0x34e25c = () => setTimeoutFn(_0x5c46f7, 0x0);
    if (typeof windowObject?.['requestAnimationFrame'] === 'function') {
      windowObject['requestAnimationFrame'](_0x34e25c);
      return;
    }
    setTimeoutFn(_0x5c46f7, 0x0);
  });
}
function cachedFileLike(_0x2d58d8, _0x33a1e5) {
  return {
    name: text(_0x2d58d8?.['name'] || _0x2d58d8?.['fileName']),
    fileName: text(_0x2d58d8?.['fileName'] || _0x2d58d8?.['name']),
    type: text(_0x2d58d8?.['type']),
    size: _0x33a1e5['byteLength'],
    lastModified: Math['max'](0x0, Number(_0x2d58d8?.['lastModified']) || 0x0),
    webkitRelativePath: text(_0x2d58d8?.['webkitRelativePath']),
    async arrayBuffer() {
      return _0x33a1e5;
    },
  };
}
function eachMaterial(_0x46b421, _0xc518b8) {
  (Array['isArray'](_0x46b421) ? _0x46b421 : [_0x46b421])['filter'](Boolean)['forEach'](_0xc518b8);
}
export function disposeCancelledStoryboard3DModelImportResult(_0x14cb2c) {
  const _0x157b18 = _0x14cb2c?.['parsed'] || _0x14cb2c;
  _0x157b18?.['disposeResources']?.();
  const _0x27d5e4 = new Set(
      [_0x157b18?.['scene'], ...(Array['isArray'](_0x157b18?.['scenes']) ? _0x157b18['scenes'] : [])][
        'filter'
      ](Boolean),
    ),
    _0x3c0f46 = new Set();
  _0x27d5e4['forEach']((_0x1ee08f) =>
    _0x1ee08f?.['traverse']?.((_0x4e3caf) => {
      (_0x4e3caf['geometry'] &&
        !_0x3c0f46['has'](_0x4e3caf['geometry']) &&
        (_0x3c0f46['add'](_0x4e3caf['geometry']), _0x4e3caf['geometry']['dispose']?.()),
        eachMaterial(_0x4e3caf['material'], (_0x833826) => {
          if (_0x3c0f46['has'](_0x833826)) return;
          _0x3c0f46['add'](_0x833826);
          for (const _0x5ace82 of Object['values'](_0x833826)) {
            _0x5ace82?.['isTexture'] &&
              !_0x3c0f46['has'](_0x5ace82) &&
              (_0x3c0f46['add'](_0x5ace82), _0x5ace82['dispose']?.());
          }
          _0x833826['dispose']?.();
        }));
    }),
  );
}
export class Storyboard3DModelImportJob {
  constructor({
    file: _0x3a1825,
    relatedFiles: relatedFiles = [],
    importOptions: importOptions = {},
    importModel: importModel = importStoryboard3DModelFile,
    signal: _0x4c9a09,
    yieldControl: yieldControl = yieldStoryboard3DModelImportStart,
    disposeResult: disposeResult = disposeCancelledStoryboard3DModelImportResult,
    idFactory: _0xa038c5,
    onProgress: _0x48a0e5,
    onStateChange: _0x22599a,
    onError: _0x480ae0,
  } = {}) {
    if (!_0x3a1825 || typeof _0x3a1825['arrayBuffer'] !== 'function')
      throw new TypeError('A readable model file is required');
    if (typeof importModel !== 'function') throw new TypeError('importModel\x20must\x20be\x20a\x20function');
    if (typeof yieldControl !== 'function')
      throw new TypeError('yieldControl\x20must\x20be\x20a\x20function');
    ((this['jobId'] = createJobId(_0xa038c5)),
      (this['file'] = _0x3a1825),
      (this['relatedFiles'] = Array['isArray'](relatedFiles) ? [...relatedFiles] : []),
      (this['importOptions'] = { ...importOptions }),
      (this['importModel'] = importModel),
      (this['externalSignal'] = _0x4c9a09 || null),
      (this['abortController'] = typeof AbortController === 'function' ? new AbortController() : null),
      (this['yieldControl'] = yieldControl),
      (this['disposeResult'] = disposeResult),
      (this['onProgress'] = _0x48a0e5),
      (this['onStateChange'] = _0x22599a),
      (this['onError'] = _0x480ae0),
      (this['status'] = 'queued'),
      (this['progress'] = 0x0),
      (this['result'] = null),
      (this['error'] = null),
      (this['cancelReason'] = null),
      (this['started'] = ![]),
      (this['runPromise'] = null),
      (this['_externalAbortHandler'] = null));
  }
  ['_snapshot']() {
    return {
      jobId: this['jobId'],
      status: this['status'],
      progress: this['progress'],
      fileName: text(this['file']?.['name'] || this['file']?.['fileName']),
      format: detectStoryboard3DModelFormat(this['file']),
      result: this['result'],
      error: this['error'],
    };
  }
  ['getSnapshot']() {
    return { ...this['_snapshot']() };
  }
  ['_transition'](_0x5e4c4c, _0x2fc4b6, _0x35458c = {}) {
    ((this['status'] = _0x5e4c4c),
      (this['progress'] = Math['max'](
        this['progress'],
        Math['min'](0x1, Math['max'](0x0, Number(_0x2fc4b6) || 0x0)),
      )));
    if (_0x35458c['result'] !== undefined) this['result'] = _0x35458c['result'];
    if (_0x35458c['error'] !== undefined) this['error'] = _0x35458c['error'];
    const _0x402b21 = this['_snapshot'](),
      _0x38c8d2 = { ..._0x402b21, ..._0x35458c };
    return (
      this['onStateChange']?.(_0x402b21, { reason: _0x5e4c4c }),
      this['onProgress']?.(_0x38c8d2),
      _0x402b21
    );
  }
  ['_isCancelled']() {
    return (
      this['status'] === 'cancelled' ||
      this['cancelReason'] !== null ||
      this['externalSignal']?.['aborted'] === !![] ||
      this['abortController']?.['signal']?.['aborted'] === !![]
    );
  }
  ['_throwIfCancelled'](_0x206124) {
    if (!this['_isCancelled']()) return;
    throw cancellationError(
      this['cancelReason'] || this['externalSignal']?.['reason'] || 'Model\x20import\x20was\x20cancelled',
      _0x206124,
    );
  }
  ['cancel'](_0x3f4eb9 = 'Model import was cancelled') {
    if (TERMINAL_STATUSES['has'](this['status'])) return ![];
    return (
      (this['cancelReason'] = _0x3f4eb9),
      this['abortController']?.['abort']?.(_0x3f4eb9),
      (this['error'] = cancellationError(_0x3f4eb9, this['status'])),
      this['_transition']('cancelled', this['progress'], { error: this['error'] }),
      !![]
    );
  }
  ['_bindExternalAbort']() {
    if (!this['externalSignal']?.['addEventListener']) return;
    ((this['_externalAbortHandler'] = () => this['cancel'](this['externalSignal']['reason'])),
      this['externalSignal']['addEventListener']('abort', this['_externalAbortHandler'], { once: !![] }));
  }
  ['_unbindExternalAbort']() {
    if (!this['_externalAbortHandler']) return;
    (this['externalSignal']?.['removeEventListener']?.('abort', this['_externalAbortHandler']),
      (this['_externalAbortHandler'] = null));
  }
  async ['_run']() {
    let _0x3cf041 = 'queued';
    if (this['status'] !== 'cancelled') this['_transition']('queued', 0x0);
    try {
      (this['_throwIfCancelled'](_0x3cf041),
        await this['yieldControl']({ job: this, stage: _0x3cf041 }),
        this['_throwIfCancelled'](_0x3cf041),
        (_0x3cf041 = 'reading'),
        this['_transition']('reading', 0.12));
      const _0x4aa68b = await this['file']['arrayBuffer']();
      this['_throwIfCancelled'](_0x3cf041);
      if (!(_0x4aa68b instanceof ArrayBuffer))
        throw new Storyboard3DModelImportJobError('Model file did not return an ArrayBuffer', {
          code: 'MODEL_FILE_UNREADABLE',
          stage: _0x3cf041,
        });
      ((_0x3cf041 = 'parsing'),
        this['_transition']('parsing', 0.55, { byteLength: _0x4aa68b['byteLength'] }),
        await this['yieldControl']({ job: this, stage: _0x3cf041 }),
        this['_throwIfCancelled'](_0x3cf041));
      const _0x2269de = await this['importModel'](cachedFileLike(this['file'], _0x4aa68b), {
        ...this['importOptions'],
        relatedFiles: this['relatedFiles'],
        signal: this['abortController']?.['signal'] || this['externalSignal'],
        onProgress: (_0x281a9e, _0x3a0b2e = {}) => {
          if (this['_isCancelled']()) return;
          const _0x3c2c4a = Math['max'](0x0, Math['min'](0x1, Number(_0x281a9e) || 0x0));
          this['_transition']('parsing', 0.55 + _0x3c2c4a * 0.4, {
            parserProgress: _0x3c2c4a,
            parserDetail: _0x3a0b2e,
          });
        },
      });
      return (
        this['_isCancelled']() && (this['disposeResult']?.(_0x2269de), this['_throwIfCancelled'](_0x3cf041)),
        this['_transition']('completed', 0x1, { result: _0x2269de }),
        _0x2269de
      );
    } catch (_0x27aaae) {
      const _0x93b503 = normalizeStoryboard3DModelImportJobError(_0x27aaae, { stage: _0x3cf041 });
      if (_0x93b503['cancelled'] || this['_isCancelled']())
        return (
          this['status'] !== 'cancelled' &&
            ((this['cancelReason'] = _0x93b503),
            this['_transition']('cancelled', this['progress'], { error: _0x93b503 })),
          null
        );
      ((this['error'] = _0x93b503),
        this['_transition']('error', this['progress'], { error: _0x93b503 }),
        this['onError']?.(_0x93b503, this['getSnapshot']()));
      throw _0x93b503;
    } finally {
      this['_unbindExternalAbort']();
    }
  }
  ['start']() {
    if (this['runPromise']) return this['runPromise'];
    ((this['started'] = !![]), this['_bindExternalAbort']());
    if (this['externalSignal']?.['aborted']) this['cancel'](this['externalSignal']['reason']);
    return ((this['runPromise'] = this['_run']()), this['runPromise']);
  }
}
export function createStoryboard3DModelImportJob(_0x5f3705) {
  return new Storyboard3DModelImportJob(_0x5f3705);
}
