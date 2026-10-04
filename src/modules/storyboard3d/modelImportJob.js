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
function text(value) {
  return String(value || '')['trim']();
}
function createJobId(handler) {
  const item =
    typeof handler === 'function' ? handler('model-import') : globalThis['crypto']?.['randomUUID']?.();
  return (
    text(item) ||
    'model-import-' + Date['now']() + '-' + Math['random']()['toString'](0x24)['slice'](0x2, 0x9)
  );
}
function cancellationError(cause, stage2) {
  return new Storyboard3DModelImportJobError(
    text(cause?.['message'] || cause) || 'Model import was cancelled',
    {
      code: 'MODEL_IMPORT_CANCELLED',
      stage: stage2,
      cancelled: !![],
      cause: cause instanceof Error ? cause : undefined,
    },
  );
}
export class Storyboard3DModelImportJobError extends Error {
  constructor(
    key,
    {
      code: code = 'MODEL_IMPORT_FAILED',
      stage: stage = 'queued',
      cancelled: cancelled = ![],
      cause: cause2,
    } = {},
  ) {
    (super(key, { cause: cause2 }),
      (this['name'] = 'Storyboard3DModelImportJobError'),
      (this['code'] = code),
      (this['stage'] = stage),
      (this['cancelled'] = cancelled));
  }
}
export function normalizeStoryboard3DModelImportJobError(cause3, { stage: stage = 'queued' } = {}) {
  if (cause3 instanceof Storyboard3DModelImportJobError) return cause3;
  const index = cause3?.['name'] === 'AbortError' || cause3?.['code'] === 'ABORT_ERR';
  if (index) return cancellationError(cause3, stage);
  return new Storyboard3DModelImportJobError(text(cause3?.['message']) || 'Model import failed', {
    code: text(cause3?.['code']) || 'MODEL_IMPORT_FAILED',
    stage: stage,
    cause: cause3 instanceof Error ? cause3 : undefined,
  });
}
export function yieldStoryboard3DModelImportStart({
  windowObject: windowObject = globalThis['window'],
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
} = {}) {
  return new Promise((result) => {
    const data = () => setTimeoutFn(result, 0x0);
    if (typeof windowObject?.['requestAnimationFrame'] === 'function') {
      windowObject['requestAnimationFrame'](data);
      return;
    }
    setTimeoutFn(result, 0x0);
  });
}
function cachedFileLike(error, size) {
  return {
    name: text(error?.['name'] || error?.['fileName']),
    fileName: text(error?.['fileName'] || error?.['name']),
    type: text(error?.['type']),
    size: size['byteLength'],
    lastModified: Math['max'](0x0, Number(error?.['lastModified']) || 0x0),
    webkitRelativePath: text(error?.['webkitRelativePath']),
    async arrayBuffer() {
      return size;
    },
  };
}
function eachMaterial(options, target) {
  (Array['isArray'](options) ? options : [options])['filter'](Boolean)['forEach'](target);
}
export function disposeCancelledStoryboard3DModelImportResult(source) {
  const next = source?.['parsed'] || source;
  next?.['disposeResources']?.();
  const list = new Set(
      [next?.['scene'], ...(Array['isArray'](next?.['scenes']) ? next['scenes'] : [])]['filter'](Boolean),
    ),
    map = new Set();
  list['forEach']((current) =>
    current?.['traverse']?.((entry) => {
      (entry['geometry'] &&
        !map['has'](entry['geometry']) &&
        (map['add'](entry['geometry']), entry['geometry']['dispose']?.()),
        eachMaterial(entry['material'], (record) => {
          if (map['has'](record)) return;
          map['add'](record);
          for (const payload of Object['values'](record)) {
            payload?.['isTexture'] && !map['has'](payload) && (map['add'](payload), payload['dispose']?.());
          }
          record['dispose']?.();
        }));
    }),
  );
}
export class Storyboard3DModelImportJob {
  constructor({
    file: file,
    relatedFiles: relatedFiles = [],
    importOptions: importOptions = {},
    importModel: importModel = importStoryboard3DModelFile,
    signal: signal,
    yieldControl: yieldControl = yieldStoryboard3DModelImportStart,
    disposeResult: disposeResult = disposeCancelledStoryboard3DModelImportResult,
    idFactory: idFactory,
    onProgress: onProgress,
    onStateChange: onStateChange,
    onError: onError,
  } = {}) {
    if (!file || typeof file['arrayBuffer'] !== 'function')
      throw new TypeError('A readable model file is required');
    if (typeof importModel !== 'function') throw new TypeError('importModel\x20must\x20be\x20a\x20function');
    if (typeof yieldControl !== 'function')
      throw new TypeError('yieldControl\x20must\x20be\x20a\x20function');
    ((this['jobId'] = createJobId(idFactory)),
      (this['file'] = file),
      (this['relatedFiles'] = Array['isArray'](relatedFiles) ? [...relatedFiles] : []),
      (this['importOptions'] = { ...importOptions }),
      (this['importModel'] = importModel),
      (this['externalSignal'] = signal || null),
      (this['abortController'] = typeof AbortController === 'function' ? new AbortController() : null),
      (this['yieldControl'] = yieldControl),
      (this['disposeResult'] = disposeResult),
      (this['onProgress'] = onProgress),
      (this['onStateChange'] = onStateChange),
      (this['onError'] = onError),
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
  ['_transition'](reason, handle, args = {}) {
    ((this['status'] = reason),
      (this['progress'] = Math['max'](
        this['progress'],
        Math['min'](0x1, Math['max'](0x0, Number(handle) || 0x0)),
      )));
    if (args['result'] !== undefined) this['result'] = args['result'];
    if (args['error'] !== undefined) this['error'] = args['error'];
    const args2 = this['_snapshot'](),
      state = { ...args2, ...args };
    return (this['onStateChange']?.(args2, { reason: reason }), this['onProgress']?.(state), args2);
  }
  ['_isCancelled']() {
    return (
      this['status'] === 'cancelled' ||
      this['cancelReason'] !== null ||
      this['externalSignal']?.['aborted'] === !![] ||
      this['abortController']?.['signal']?.['aborted'] === !![]
    );
  }
  ['_throwIfCancelled'](config) {
    if (!this['_isCancelled']()) return;
    throw cancellationError(
      this['cancelReason'] || this['externalSignal']?.['reason'] || 'Model\x20import\x20was\x20cancelled',
      config,
    );
  }
  ['cancel'](scope = 'Model import was cancelled') {
    if (TERMINAL_STATUSES['has'](this['status'])) return ![];
    return (
      (this['cancelReason'] = scope),
      this['abortController']?.['abort']?.(scope),
      (this['error'] = cancellationError(scope, this['status'])),
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
    let stage3 = 'queued';
    if (this['status'] !== 'cancelled') this['_transition']('queued', 0x0);
    try {
      (this['_throwIfCancelled'](stage3),
        await this['yieldControl']({ job: this, stage: stage3 }),
        this['_throwIfCancelled'](stage3),
        (stage3 = 'reading'),
        this['_transition']('reading', 0.12));
      const byteLength = await this['file']['arrayBuffer']();
      this['_throwIfCancelled'](stage3);
      if (!(byteLength instanceof ArrayBuffer))
        throw new Storyboard3DModelImportJobError('Model file did not return an ArrayBuffer', {
          code: 'MODEL_FILE_UNREADABLE',
          stage: stage3,
        });
      ((stage3 = 'parsing'),
        this['_transition']('parsing', 0.55, { byteLength: byteLength['byteLength'] }),
        await this['yieldControl']({ job: this, stage: stage3 }),
        this['_throwIfCancelled'](stage3));
      const result2 = await this['importModel'](cachedFileLike(this['file'], byteLength), {
        ...this['importOptions'],
        relatedFiles: this['relatedFiles'],
        signal: this['abortController']?.['signal'] || this['externalSignal'],
        onProgress: (input, parserDetail = {}) => {
          if (this['_isCancelled']()) return;
          const parserProgress = Math['max'](0x0, Math['min'](0x1, Number(input) || 0x0));
          this['_transition']('parsing', 0.55 + parserProgress * 0.4, {
            parserProgress: parserProgress,
            parserDetail: parserDetail,
          });
        },
      });
      return (
        this['_isCancelled']() && (this['disposeResult']?.(result2), this['_throwIfCancelled'](stage3)),
        this['_transition']('completed', 0x1, { result: result2 }),
        result2
      );
    } catch (output) {
      const error2 = normalizeStoryboard3DModelImportJobError(output, { stage: stage3 });
      if (error2['cancelled'] || this['_isCancelled']())
        return (
          this['status'] !== 'cancelled' &&
            ((this['cancelReason'] = error2),
            this['_transition']('cancelled', this['progress'], { error: error2 })),
          null
        );
      ((this['error'] = error2),
        this['_transition']('error', this['progress'], { error: error2 }),
        this['onError']?.(error2, this['getSnapshot']()));
      throw error2;
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
export function createStoryboard3DModelImportJob(value2) {
  return new Storyboard3DModelImportJob(value2);
}
