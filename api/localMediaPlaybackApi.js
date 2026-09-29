const DEFAULT_LOCAL_MEDIA_PLAYBACK_TIMEOUT_MS = 0x384,
  DEFAULT_LOCAL_MEDIA_PLAYBACK_MAX_BYTES = 0x20 * 0x400 * 0x400,
  STREAM_READ_YIELD_EVERY_CHUNKS = 0x4,
  TYPED_RESULT_MODE = 'typed';
function playbackFetchResult(_0x27760b, _0x347b48, _0x522152 = null, _0x3b0b19 = 0x0) {
  if (_0x27760b === TYPED_RESULT_MODE)
    return {
      status: _0x347b48,
      blob: _0x522152,
      httpStatus: Number(_0x3b0b19 || 0x0),
    };
  return _0x522152;
}
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function markLocalPlaybackProbe(_0x104f5d, _0x86d5f = {}) {
  globalThis['window']?.['__runtimeCompareMark']?.('local-media-blob:' + _0x104f5d, _0x86d5f);
}
function throwIfAborted(_0x53fb16) {
  if (!_0x53fb16?.['aborted']) return;
  if (typeof _0x53fb16['throwIfAborted'] === 'function') _0x53fb16['throwIfAborted']();
  throw new DOMException('The operation was aborted', 'AbortError');
}
async function yieldToMainThread(_0x41b0ae) {
  (await new Promise((_0xdc730d) => setTimeout(_0xdc730d, 0x0)), throwIfAborted(_0x41b0ae));
}
async function readBoundedResponseBlob(_0x44d8d3, _0x6bf620, { signal: signal = null, url: url = '' } = {}) {
  const _0x5ef64c = nowMs();
  if (typeof _0x44d8d3['body']?.['getReader'] !== 'function') {
    markLocalPlaybackProbe('body-read-start', { url: url, streamed: ![] });
    const _0x1562f8 = await _0x44d8d3['blob']();
    return (
      markLocalPlaybackProbe('body-read-end', {
        url: url,
        streamed: ![],
        blobSize: Number(_0x1562f8?.['size'] || 0x0),
        durationMs: nowMs() - _0x5ef64c,
      }),
      _0x1562f8?.['size'] > 0x0 && _0x1562f8['size'] <= _0x6bf620 ? _0x1562f8 : null
    );
  }
  const _0x173438 = _0x44d8d3['body']['getReader'](),
    _0x382b95 = [];
  let _0xde74dd = 0x0,
    _0x388e6a = 0x0,
    _0x3cd7ea = 0x0;
  markLocalPlaybackProbe('body-read-start', { url: url, streamed: !![] });
  try {
    while (!![]) {
      throwIfAborted(signal);
      const { done: _0x4391e3, value: _0x1ac8b1 } = await _0x173438['read']();
      if (_0x4391e3) break;
      _0x388e6a += 0x1;
      const _0x12df02 = Number(_0x1ac8b1?.['byteLength'] || _0x1ac8b1?.['length'] || 0x0);
      _0xde74dd += _0x12df02;
      if (_0xde74dd > _0x6bf620) {
        try {
          await _0x173438['cancel']();
        } catch {}
        return null;
      }
      if (_0x12df02 > 0x0) _0x382b95['push'](_0x1ac8b1);
      _0x388e6a % STREAM_READ_YIELD_EVERY_CHUNKS === 0x0 &&
        ((_0x3cd7ea += 0x1),
        _0x3cd7ea === 0x1 &&
          markLocalPlaybackProbe('body-read-yield', {
            url: url,
            chunkCount: _0x388e6a,
            totalBytes: _0xde74dd,
          }),
        await yieldToMainThread(signal));
    }
  } finally {
    try {
      _0x173438['releaseLock']?.();
    } catch {}
  }
  if (!(_0xde74dd > 0x0)) return null;
  const _0x4afc05 = nowMs();
  markLocalPlaybackProbe('blob-construct-start', {
    url: url,
    chunkCount: _0x388e6a,
    totalBytes: _0xde74dd,
  });
  const _0x32adf6 = new Blob(_0x382b95, {
    type: String(_0x44d8d3['headers']?.['get']?.('content-type') || ''),
  });
  return (
    markLocalPlaybackProbe('blob-construct-end', {
      url: url,
      chunkCount: _0x388e6a,
      totalBytes: _0xde74dd,
      blobSize: Number(_0x32adf6['size'] || 0x0),
      durationMs: nowMs() - _0x4afc05,
    }),
    markLocalPlaybackProbe('body-read-end', {
      url: url,
      streamed: !![],
      chunkCount: _0x388e6a,
      totalBytes: _0xde74dd,
      yieldCount: _0x3cd7ea,
      durationMs: nowMs() - _0x5ef64c,
    }),
    _0x32adf6
  );
}
export async function fetchLocalMediaPlaybackBlob(
  _0x14eb90,
  {
    signal: _0x5d9779,
    timeout: timeout = DEFAULT_LOCAL_MEDIA_PLAYBACK_TIMEOUT_MS,
    maxBytes: maxBytes = DEFAULT_LOCAL_MEDIA_PLAYBACK_MAX_BYTES,
    resultMode: resultMode = 'legacy',
  } = {},
) {
  const _0x512c71 = String(_0x14eb90 || '')['trim']();
  if (!_0x512c71) return (markLocalPlaybackProbe('empty-url'), playbackFetchResult(resultMode, 'empty-url'));
  const _0x187508 = Number['isFinite'](Number(maxBytes))
      ? Math['max'](0x0, Number(maxBytes))
      : DEFAULT_LOCAL_MEDIA_PLAYBACK_MAX_BYTES,
    _0x352549 = Number['isFinite'](Number(timeout))
      ? Math['max'](0x0, Number(timeout))
      : DEFAULT_LOCAL_MEDIA_PLAYBACK_TIMEOUT_MS,
    _0x4f45c9 = new AbortController();
  let _0x593af2 = '';
  const _0x27902e = setTimeout(() => {
    if (!_0x4f45c9['signal']['aborted']) _0x593af2 = 'timeout';
    _0x4f45c9['abort']();
  }, _0x352549);
  let _0x438f2f = null;
  _0x5d9779 &&
    (_0x5d9779['aborted']
      ? ((_0x593af2 = 'aborted'), _0x4f45c9['abort']())
      : ((_0x438f2f = () => {
          if (!_0x4f45c9['signal']['aborted']) _0x593af2 = 'aborted';
          _0x4f45c9['abort']();
        }),
        _0x5d9779['addEventListener']('abort', _0x438f2f, { once: !![] })));
  try {
    const _0x438e96 = await fetch(_0x512c71, {
      method: 'GET',
      cache: 'no-store',
      signal: _0x4f45c9['signal'],
    });
    if (!_0x438e96?.['ok']) {
      const _0x50f4c8 = Number(_0x438e96?.['status'] || 0x0);
      return (
        markLocalPlaybackProbe('response-error', {
          url: _0x512c71,
          status: _0x50f4c8,
        }),
        playbackFetchResult(
          resultMode,
          _0x50f4c8 === 0x194 || _0x50f4c8 === 0x19a ? 'hard-missing' : 'http-error',
          null,
          _0x50f4c8,
        )
      );
    }
    const _0x49b277 = Number(_0x438e96['headers']?.['get']?.('content-length') || 0x0);
    if (_0x49b277 > _0x187508) {
      try {
        await _0x438e96['body']?.['cancel']?.();
      } catch {}
      return (
        markLocalPlaybackProbe('over-limit', {
          url: _0x512c71,
          contentLength: _0x49b277,
          byteLimit: _0x187508,
        }),
        playbackFetchResult(resultMode, 'over-limit')
      );
    }
    const _0x440305 = await readBoundedResponseBlob(_0x438e96, _0x187508, {
      signal: _0x4f45c9['signal'],
      url: _0x512c71,
    });
    return (
      markLocalPlaybackProbe(_0x440305 ? 'ready' : 'empty-body', {
        url: _0x512c71,
        contentLength: _0x49b277,
        blobSize: Number(_0x440305?.['size'] || 0x0),
        blobType: String(_0x440305?.['type'] || ''),
      }),
      playbackFetchResult(resultMode, _0x440305 ? 'ready' : 'empty-body', _0x440305)
    );
  } catch (_0x26c82a) {
    markLocalPlaybackProbe('failed', {
      url: _0x512c71,
      error: String(_0x26c82a?.['name'] || _0x26c82a?.['message'] || _0x26c82a || 'error'),
    });
    if (resultMode === TYPED_RESULT_MODE) {
      if (_0x4f45c9['signal']['aborted'])
        return playbackFetchResult(resultMode, _0x593af2 === 'timeout' ? 'timeout' : 'aborted');
      return playbackFetchResult(resultMode, 'failed');
    }
    throw _0x26c82a;
  } finally {
    clearTimeout(_0x27902e);
    if (_0x5d9779 && _0x438f2f) _0x5d9779['removeEventListener']('abort', _0x438f2f);
  }
}
