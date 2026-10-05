const DEFAULT_LOCAL_MEDIA_PLAYBACK_TIMEOUT_MS = 900,
  DEFAULT_LOCAL_MEDIA_PLAYBACK_MAX_BYTES = 32 * 1024 * 1024,
  STREAM_READ_YIELD_EVERY_CHUNKS = 4,
  TYPED_RESULT_MODE = 'typed';
function playbackFetchResult(value, status, blob = null, item = 0) {
  if (value === TYPED_RESULT_MODE)
    return {
      status: status,
      blob: blob,
      httpStatus: Number(item || 0),
    };
  return blob;
}
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function markLocalPlaybackProbe(key, index = {}) {
  globalThis['window']?.['__runtimeCompareMark']?.('local-media-blob:' + key, index);
}
function throwIfAborted(enabled) {
  if (!enabled?.['aborted']) return;
  if (typeof enabled['throwIfAborted'] === 'function') enabled['throwIfAborted']();
  throw new DOMException('The operation was aborted', 'AbortError');
}
async function yieldToMainThread(result) {
  (await new Promise((data) => setTimeout(data, 0)), throwIfAborted(result));
}
async function readBoundedResponseBlob(dom, options, { signal: signal = null, url: url = '' } = {}) {
  const nowMs2 = nowMs();
  if (typeof dom['body']?.['getReader'] !== 'function') {
    markLocalPlaybackProbe('body-read-start', { url: url, streamed: ![] });
    const target = await dom['blob']();
    return (
      markLocalPlaybackProbe('body-read-end', {
        url: url,
        streamed: ![],
        blobSize: Number(target?.['size'] || 0),
        durationMs: nowMs() - nowMs2,
      }),
      target?.['size'] > 0 && target['size'] <= options ? target : null
    );
  }
  const source = dom['body']['getReader'](),
    list = [];
  let totalBytes = 0,
    chunkCount = 0,
    yieldCount = 0;
  markLocalPlaybackProbe('body-read-start', { url: url, streamed: !![] });
  try {
    while (!![]) {
      throwIfAborted(signal);
      const { done: done, value: value2 } = await source['read']();
      if (done) break;
      chunkCount += 1;
      const count = Number(value2?.['byteLength'] || value2?.['length'] || 0);
      totalBytes += count;
      if (totalBytes > options) {
        try {
          await source['cancel']();
        } catch {}
        return null;
      }
      if (count > 0) list['push'](value2);
      chunkCount % STREAM_READ_YIELD_EVERY_CHUNKS === 0 &&
        ((yieldCount += 1),
        yieldCount === 1 &&
          markLocalPlaybackProbe('body-read-yield', {
            url: url,
            chunkCount: chunkCount,
            totalBytes: totalBytes,
          }),
        await yieldToMainThread(signal));
    }
  } finally {
    try {
      source['releaseLock']?.();
    } catch {}
  }
  if (!(totalBytes > 0)) return null;
  const nowMs3 = nowMs();
  markLocalPlaybackProbe('blob-construct-start', {
    url: url,
    chunkCount: chunkCount,
    totalBytes: totalBytes,
  });
  const blob2 = new Blob(list, {
    type: String(dom['headers']?.['get']?.('content-type') || ''),
  });
  return (
    markLocalPlaybackProbe('blob-construct-end', {
      url: url,
      chunkCount: chunkCount,
      totalBytes: totalBytes,
      blobSize: Number(blob2['size'] || 0),
      durationMs: nowMs() - nowMs3,
    }),
    markLocalPlaybackProbe('body-read-end', {
      url: url,
      streamed: !![],
      chunkCount: chunkCount,
      totalBytes: totalBytes,
      yieldCount: yieldCount,
      durationMs: nowMs() - nowMs2,
    }),
    blob2
  );
}
export async function fetchLocalMediaPlaybackBlob(
  next,
  {
    signal: signal2,
    timeout: timeout = DEFAULT_LOCAL_MEDIA_PLAYBACK_TIMEOUT_MS,
    maxBytes: maxBytes = DEFAULT_LOCAL_MEDIA_PLAYBACK_MAX_BYTES,
    resultMode: resultMode = 'legacy',
  } = {},
) {
  const url2 = String(next || '')['trim']();
  if (!url2) return (markLocalPlaybackProbe('empty-url'), playbackFetchResult(resultMode, 'empty-url'));
  const byteLimit = Number['isFinite'](Number(maxBytes))
      ? Math['max'](0, Number(maxBytes))
      : DEFAULT_LOCAL_MEDIA_PLAYBACK_MAX_BYTES,
    current = Number['isFinite'](Number(timeout))
      ? Math['max'](0, Number(timeout))
      : DEFAULT_LOCAL_MEDIA_PLAYBACK_TIMEOUT_MS,
    signal3 = new AbortController();
  let entry = '';
  const setTimeout2 = setTimeout(() => {
    if (!signal3['signal']['aborted']) entry = 'timeout';
    signal3['abort']();
  }, current);
  let record = null;
  signal2 &&
    (signal2['aborted']
      ? ((entry = 'aborted'), signal3['abort']())
      : ((record = () => {
          if (!signal3['signal']['aborted']) entry = 'aborted';
          signal3['abort']();
        }),
        signal2['addEventListener']('abort', record, { once: !![] })));
  try {
    const response = await fetch(url2, {
      method: 'GET',
      cache: 'no-store',
      signal: signal3['signal'],
    });
    if (!response?.['ok']) {
      const status2 = Number(response?.['status'] || 0);
      return (
        markLocalPlaybackProbe('response-error', {
          url: url2,
          status: status2,
        }),
        playbackFetchResult(
          resultMode,
          status2 === 404 || status2 === 410 ? 'hard-missing' : 'http-error',
          null,
          status2,
        )
      );
    }
    const contentLength = Number(response['headers']?.['get']?.('content-length') || 0);
    if (contentLength > byteLimit) {
      try {
        await response['body']?.['cancel']?.();
      } catch {}
      return (
        markLocalPlaybackProbe('over-limit', {
          url: url2,
          contentLength: contentLength,
          byteLimit: byteLimit,
        }),
        playbackFetchResult(resultMode, 'over-limit')
      );
    }
    const boundedResponseBlob = await readBoundedResponseBlob(response, byteLimit, {
      signal: signal3['signal'],
      url: url2,
    });
    return (
      markLocalPlaybackProbe(boundedResponseBlob ? 'ready' : 'empty-body', {
        url: url2,
        contentLength: contentLength,
        blobSize: Number(boundedResponseBlob?.['size'] || 0),
        blobType: String(boundedResponseBlob?.['type'] || ''),
      }),
      playbackFetchResult(resultMode, boundedResponseBlob ? 'ready' : 'empty-body', boundedResponseBlob)
    );
  } catch (error) {
    markLocalPlaybackProbe('failed', {
      url: url2,
      error: String(error?.['name'] || error?.['message'] || error || 'error'),
    });
    if (resultMode === TYPED_RESULT_MODE) {
      if (signal3['signal']['aborted'])
        return playbackFetchResult(resultMode, entry === 'timeout' ? 'timeout' : 'aborted');
      return playbackFetchResult(resultMode, 'failed');
    }
    throw error;
  } finally {
    clearTimeout(setTimeout2);
    if (signal2 && record) signal2['removeEventListener']('abort', record);
  }
}
